/**
 * proxy-chunked.mjs — HTTP/1.1 分块传输（`Transfer-Encoding: chunked`）流式剥帧器（#1065）。
 *
 * 单出 `createChunkedDecoder`（设计 = `docs/core/design/PROXY.md` §2 ∥ §7 D-PX11）：
 * - **流式保形**：边收边吐、只保有帧头（块长行上限 1KiB）；块数据到达即吐 `min(可用, 待吐)`；
 * - 块长 = 十六进制（行长 ≤1KiB、数值须安全整数——越界判畸形）+ 可选 `;扩展`（扩展忽略）；块尾须恰为 CRLF；`0` 块 ⇒ `onEnd`
 *   （其后 trailer ∥ 余字节读取即弃——`Connection: close` 语义下无复用面）；
 * - **畸形帧回退 = 透传**：已持有字节原样吐出 + 其后全部字节直通——不报错（不把协议违规
 *   升级成连接失败）、不截断（零静默丢数据）；
 * - 纯状态机、无自有 `'error'` 面（#16 契约零变——body 终止守卫族照旧对 body 单点直作）。
 * 零依赖：Node built-ins only。
 */

/** 块长行上限（超限判畸形——防无界持有帧头）。 */
const MAX_SIZE_LINE = 1024
const CRLF = Buffer.from("\r\n")
const EMPTY = Buffer.alloc(0)

/** 十六进制字节判定（0-9 ∥ a-f ∥ A-F——大小写不敏感）。 */
const isHexByte = (b) => (b >= 0x30 && b <= 0x39) || (b >= 0x61 && b <= 0x66) || (b >= 0x41 && b <= 0x46)

/**
 * 建流式分块解码器（消费单点 = `proxy-transport.mjs` `streamHttpResponse` chunked 径）。
 * @param {{ onData?: (chunk: Buffer) => void, onEnd?: () => void }} [handlers]
 *   `onData` 逐段收解码后的块数据（任意分包边界）；`onEnd` 于 `0` 块到达时触发一次。
 * @returns {{ push: (buf: Buffer) => void, mode: "chunked" | "raw" | "done" }}
 *   `push` 喂入原始字节；`mode` = `chunked`（解码中）∥ `raw`（畸形回退透传）∥
 *   `done`（`0` 块已终，其后字节读取即弃）——供测试与诊断。
 */
export function createChunkedDecoder({ onData, onEnd } = {}) {
  let state = "size" // size → data → crlf → size …
  let mode = "chunked"
  let buf = EMPTY // 未消费字节（只保有帧头——块数据即到即吐）
  let need = 0 // data 阶段待吐字节数

  const emit = (chunk) => { if (chunk.length > 0) onData?.(chunk) }
  /** 畸形回退：已持有字节原样吐出，此后全量直通（不再解析）。 */
  const fallback = () => {
    mode = "raw"
    const held = buf
    buf = EMPTY
    emit(held)
  }
  /** `0` 块终：body 随 0 块结束。 */
  const finish = () => { mode = "done"; buf = EMPTY; onEnd?.() }

  /** 帧推进：逐状态消费 buf；块数据即吐（只保有帧头）。 */
  function step() {
    for (;;) {
      if (state === "size") {
        const idx = buf.indexOf(CRLF)
        if (idx < 0) {
          // 未成行：首字节非十六进制 ∥ 超限 ⇒ 畸形；否则等下一包
          if (buf.length > 0 && !isHexByte(buf[0])) return fallback()
          if (buf.length > MAX_SIZE_LINE) return fallback()
          return
        }
        const line = buf.subarray(0, idx)
        const semi = line.indexOf(0x3b) // ";"——块扩展起点（忽略）
        const hex = semi < 0 ? line : line.subarray(0, semi)
        // 畸形行（超限 ∥ 空 ∥ 非十六进制）⇒ 整段原样吐出（行 ∥ CRLF 零丢弃——不截断）；行有效才消费
        if (idx > MAX_SIZE_LINE || hex.length === 0) return fallback()
        for (const b of hex) if (!isHexByte(b)) return fallback()
        const size = Number.parseInt(hex.toString("latin1"), 16)
        if (!Number.isSafeInteger(size)) return fallback() // 数值越界（>2^53——double 溢出可为 Infinity）⇒ 归畸形
        buf = buf.subarray(idx + 2)
        if (size === 0) return finish()
        need = size
        state = "data"
        continue
      }
      if (state === "data") {
        if (buf.length === 0) return
        const take = Math.min(buf.length, need)
        emit(buf.subarray(0, take))
        buf = buf.subarray(take)
        need -= take
        if (need > 0) return
        state = "crlf"
        continue
      }
      // state === "crlf"：块尾须恰为 CRLF
      if (buf.length < 2) {
        if (buf.length === 1 && buf[0] !== 0x0d) return fallback()
        return
      }
      if (buf[0] !== 0x0d || buf[1] !== 0x0a) return fallback()
      buf = buf.subarray(2)
      state = "size"
    }
  }

  return {
    push(d) {
      if (mode === "done") return // 0 块后余字节（trailer 等）读取即弃
      if (mode === "raw") { emit(d); return }
      buf = buf.length > 0 ? Buffer.concat([buf, d]) : d
      step()
    },
    get mode() { return mode },
  }
}
