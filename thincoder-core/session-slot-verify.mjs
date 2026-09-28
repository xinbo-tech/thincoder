/**
 * session-slot-verify.mjs — 读面懒核实面（SESSION.md §6.25 判据句 3 · LEDGER-RELIABILITY 批 · 2026-09-28）。
 * 触发 = 读面交来的**不可信档清单**（谓词单源 `needsVerify`）。**调度 = 纯内存登记 + 启动窗外延迟拍**（`VERIFY_TICK_DELAY_MS` = 3s，`setTimeout` + `unref`——承 D-SE39：`setImmediate` 点火与启动链同循环）
 * ⇒ 零 I/O / 零同步阻塞（首答 F-SL1 50 ms 不被拖慢）。核实 = 单档整档**分块流式**（计数只能全读获得——
 * D-SE56）：1 MiB 分块 + 逐块宏任务让出（零 ≥50 ms 连续同步段）；**不整档物化**——走顶层键 + 逐元素结构
 * 定界计数 / 切片解析（`jump` 每字符只扫一次；跨块续读、零正则）。预算 = 每轮 ≤ `SCAN_BUDGET_BYTES`（4 MiB
 * ——单源住 `session-slot-scan.mjs`）∨ **超预算大档该轮至多一档**；未覆盖者留待下次列表调用；**不做全量扫**
 * （D-SE67）。不重复三条：① 核完即回写摘要（`ts` 地板 = 该档 mtime——平台时间戳可领先 `Date.now()`，见回写行注释）⇒ 回快路；② **单飞**；③ **负缓存**（同 mtime 不重试）。
 * 回写 = 尾部**一次合并写**（仅摘要条目）；校验门不过（坏 JSON / 异 cwd / `version > 2`）⇒ **不写回**。
 * 缝：`_verifyState` · `_verifyIdle()`（**禁时间等待**）· `_setVerifyDelayForTest` · `_resetVerifyStateForTest`。
 * 在飞轮去向：目录切换 ⇒ **弃轮**（零跨根写）；进程退出 ⇒ 拍 `unref` 不持活、在飞轮随终止丢弃；静态环：核内四引求值期零顶层调用 ⇒ 环安全。
 */
import { closeSync, openSync, readSync, statSync } from "node:fs"
import { SCAN_BUDGET_BYTES } from "./session-slot-scan.mjs" // 预算常量单源
import { sessionPath, slotPath } from "./session-slots.mjs" // 槽前缀 / 路径单源
import { loadManifest, saveManifest } from "./session-slots-manifest.mjs" // 清单面单源
import { isRealUserMsg } from "./history-window.mjs" // 「真实用户消息」谓词单源（turnCount / firstMessage）
/** 启动窗外延迟拍（D-SE64 · 承 D-SE39）：自调度点起 3s ⇒ 核实起点落于启动窗外。 */
export const VERIFY_TICK_DELAY_MS = 3000
/** 分块粒度（判据句 3）：1 MiB + 逐块让出。 */
export const VERIFY_CHUNK_BYTES = 1024 * 1024
const HEAD_KEYS = new Set(["title", "activeProvider", "activeModel", "createdBy", "updatedAt", "version", "cwd"])
const isNum = (v) => typeof v === "number" && Number.isFinite(v)
const isStr = (v) => typeof v === "string"
const isWs = (c) => c === " " || c === "\n" || c === "\r" || c === "\t"
const isDelim = (c) => c === undefined || isWs(c) || c === "," || c === "}" || c === "]"
const isBlank = (s) => { for (let i = 0; i < s.length; i++) if (!isWs(s[i])) return false; return true } // 尾随只许空白
const yieldToLoop = () => new Promise((resolve) => setImmediate(resolve)) // 逐块让出（唯一 setImmediate——非点火）
/** 观测计数（`_scanStats` 同惯例——生产零消费）：`ticks` / `verified` 成功回写档数 / `failed` 门不过档数 /
 *  `skipped` 跳过档数（不在盘 / 负缓存 / 余量不足）/ `chunks` 分块读次数 / `bytes` 分块读字节。 */
export const _verifyState = { ticks: 0, verified: 0, failed: 0, skipped: 0, chunks: 0, bytes: 0 }
let verifyDelayMs = VERIFY_TICK_DELAY_MS
/** 延迟拍缝（置 0 点火勿真等；还原 = 置回 `VERIFY_TICK_DELAY_MS`）。 */
export function _setVerifyDelayForTest(ms) { verifyDelayMs = ms }
/** 不可信谓词（判据句 3 · **单源**）：缺失 ∨ `ts < mtime`（陈旧）∨ 计数两字段任一非数（不可得）；真 0
 *  不触发（数值 0 = 可信）；`mtime` 非数（stat 失败）⇒ 不妄断陈旧。 */
export function needsVerify(entry, mtime) {
  if (!entry || typeof entry !== "object") return true
  if (!isNum(entry.messageCount) || !isNum(entry.turnCount)) return true
  if (!isNum(entry.ts)) return true
  return isNum(mtime) ? entry.ts < mtime : false
}
const pending = new Map() // cwd → Set(slot)：待核（拍在途——纯内存登记）
const timers = new Map() // cwd → Timeout：拍句柄（去重 / 复位）
const running = new Set() // cwd：在飞轮（单飞）
const failedCache = new Map() // cwd → Map(slot → mtime)：负缓存

/** 读面交付点（`listSlots` 同步返回前调用——纯内存登记 + 延迟拍：零 I/O / 零同步阻塞）：`scanned` = 扫描行
 *  `[{ slot, meta, mtime }]`；不可信档按 **mtime 降序**入队（用户最可能看的行先核）；同档不重复入队；
 *  已有拍 ⇒ 并入待核集（不重复点火）。 */
export function scheduleVerify(cwd, scanned, digests = {}) {
  const targets = scanned.filter((s) => needsVerify(digests?.[s.slot], s.mtime)).sort((a, b) => b.mtime - a.mtime)
  if (targets.length === 0) return
  let prefix
  try { prefix = sessionPath(cwd) } catch { return } // 前缀不可解析 ⇒ 不排
  const list = pending.get(cwd) ?? new Set()
  for (const s of targets) list.add(s.slot)
  pending.set(cwd, list)
  if (timers.has(cwd)) return
  const t = setTimeout(() => { timers.delete(cwd); runPass(cwd, prefix).catch(() => { /* 静默：下轮重核 */ }) }, verifyDelayMs)
  t.unref?.() // 不持活（进程退出随终止）
  timers.set(cwd, t)
}

/** 一轮核实（拍点火）：捕获前缀校验（目录切换 ⇒ 弃轮——零跨根写）→ 逐档（mtime 降序）分块流式核实 →
 *  尾部一次合并写（仅摘要条目）。 */
async function runPass(cwd, prefix) {
  const slots = pending.get(cwd)
  pending.delete(cwd)
  if (!slots || running.has(cwd)) return // 单飞：在飞即返（余档留待下次列表调用）
  if (sessionPath(cwd) !== prefix) return
  running.add(cwd)
  _verifyState.ticks += 1
  try {
    const results = new Map() // slot → { meta, mtime }（meta 不含 ts——ts 写回时打点）
    let budget = SCAN_BUDGET_BYTES
    let oversizeTaken = false
    for (const slot of slots) {
      let st
      try { st = statSync(slotPath(cwd, slot)) } catch { _verifyState.skipped += 1; continue } // 不在盘 ⇒ 跳
      if (failedCache.get(cwd)?.get(slot) === st.mtimeMs) { _verifyState.skipped += 1; continue } // 负缓存
      if (st.size > SCAN_BUDGET_BYTES) {
        if (oversizeTaken) continue // 超预算大档该轮至多一档
        oversizeTaken = true
      } else if (st.size > budget) continue // 余量不足 ⇒ 留待下次列表调用
      const meta = await scanOne(slotPath(cwd, slot), st.size, cwd)
      budget = Math.max(0, budget - st.size)
      if (meta) { results.set(slot, { meta, mtime: st.mtimeMs }); continue }
      _verifyState.failed += 1 // 门不过 ⇒ 负缓存（不发明摘要）
      const neg = failedCache.get(cwd) ?? new Map()
      neg.set(slot, st.mtimeMs)
      failedCache.set(cwd, neg)
    }
    // 回写：尾部一次合并写——仅摘要条目；写回前再校验捕获前缀（零跨根写）
    if (results.size > 0 && sessionPath(cwd) === prefix) {
      const m = loadManifest(cwd)
      m.slots ??= {}
      // `ts` 地板 = 该档 mtime（平台文件时间戳可领先 `Date.now()` 数 ms——延迟盖章）：无地板则刚核完的档被判「陈旧」再读；判据比较（`ts ≥ mtime`）零改。
      for (const [slot, r] of results) m.slots[slot] = { ts: Math.max(Date.now(), r.mtime), ...r.meta }
      if (saveManifest(cwd, m) !== false) _verifyState.verified += results.size // 拒写（边界 ⑩）不计
    }
  } finally {
    running.delete(cwd)
  }
}

/** 可等待句柄（判据句 3 缝）：「无 pending 拍 ∧ 无在飞轮」即决。 */
export async function _verifyIdle() {
  while (pending.size > 0 || running.size > 0) await yieldToLoop()
}

/** 复位（用例跨例隔离）：清 pending 拍 + 在飞登记 + 负缓存 + 观测计数。 */
export function _resetVerifyStateForTest() {
  for (const t of timers.values()) clearTimeout(t)
  timers.clear(); pending.clear(); running.clear(); failedCache.clear()
  for (const k of Object.keys(_verifyState)) _verifyState[k] = 0
}

/** 单档分块流式核实：1 MiB 分块读 + 逐块让出；返回摘要字段（不含 `ts`）或 `null`（门不过）。 */
async function scanOne(path, size, cwd) {
  const buf = Buffer.allocUnsafe(VERIFY_CHUNK_BYTES)
  const dec = new TextDecoder("utf-8") // 流式解码：多字节字符跨块不劈
  const scan = new StreamScan()
  let fd
  try { fd = openSync(path, "r") } catch { return null } // 打开失败（并发删除等）⇒ 门不过（负缓存）
  try {
    let pos = 0
    while (pos < size) { // 读到文件末（`done` 后仍读——尾随非空白等于坏 JSON，见 `feed` / `result`）
      const n = readSync(fd, buf, 0, Math.min(VERIFY_CHUNK_BYTES, size - pos), pos)
      if (n <= 0) break // 截断（读不到声明长度）⇒ 门不过
      pos += n
      _verifyState.chunks += 1
      _verifyState.bytes += n
      scan.feed(dec.decode(buf.subarray(0, n), { stream: true }))
      await yieldToLoop() // 逐块宏任务让出（零 ≥50 ms 连续同步段）
    }
    // EOF 尾段冲洗（#499）：流式解码器在文件末滞留的**不完整 UTF-8 序列**（≤3 字节）不冲洗就
    // 丢失——坏档尾段会逃过「尾随非空白 = 坏 JSON」门；无参 `decode()` 收尾 ⇒ 残缺字节出 U+FFFD
    // ⇒ 按坏档门不过（完整多字节字符照常解码，零影响）。
    scan.feed(dec.decode())
  } catch {
    return null // 读失败 ⇒ 门不过（负缓存）
  } finally {
    try { closeSync(fd) } catch { /* 关闭失败不影响读结果 */ }
  }
  return scan.result(cwd)
}

/** 跨块流式结构扫描器（判据句 3）：顶层键取值 + `history` 逐元素定界计数；**消费段即时丢弃**（内存 =
 *  未完成 token）；零正则、零整档物化。**严格 JSON**（容器分隔态 `sep`；结构违规 ⇒ `corrupt()`）。
 *  st：key → value → after ∨ item（history 内）；sep：start 首元素位 / need 刚吃 `,` / after 刚完一元素；
 *  k：跳跃态（1 串 / 2 结构 / 3 标量 / null 无）、p 跳跃位置（buf 内）、d 深度、inStr / esc 串与转义态
 *  （跨块保留——续扫不重扫）；cursor = 已消费位置（在飞值时 = 值起点）；open = 顶层 `{` 未取。 */
class StreamScan {
  constructor() {
    this.buf = ""; this.cursor = 0; this.st = "key"; this.open = true; this.sep = "start"; this.key = null
    this.k = null; this.p = 0; this.d = 0; this.inStr = false; this.esc = false
    this.count = 0; this.turns = 0; this.first = null; this.head = {}
    this.historySeen = false; this.done = false; this.bad = false
  }
  /** 喂入一块文本（终结后只许空白——尾随非空白 = 坏 JSON，判据句 3 门面）。 */
  feed(text) {
    if (this.done) { if (!isBlank(text)) this.bad = true; return }
    if (this.cursor > 0) {
      this.buf = this.buf.slice(this.cursor)
      if (this.k !== null) this.p -= this.cursor
      this.cursor = 0
    }
    this.buf += text
    while (this.done === false) {
      const next = this.step(this.buf, this.cursor)
      if (next === null) break // 请示更多输入（不完整 token——含坏档停滞）
      this.cursor = next
    }
  }
  /** 单步（返回新位置 / `null` = 请示更多输入）；结构违规 ⇒ `corrupt()`（门不过）。 */
  step(b, i) {
    const n = b.length
    while (i < n && isWs(b[i])) i++
    if (this.st === "key") {
      if (i >= n) return null
      const c = b[i]
      if (this.open) { // 顶层 `{`（首字符）
        if (c !== "{") return this.corrupt()
        this.open = false
        return i + 1
      }
      if (c === "}") { if (this.sep === "need") return this.corrupt(); this.done = true; return i + 1 } // 尾逗号 ⇒ 违规
      if (c !== '"') return this.corrupt() // 空键位 / 双逗号 / 非串键
      const end = this.jump(b, i)
      if (end === null) return null
      try { this.key = JSON.parse(b.slice(i, end)) } catch { return this.corrupt() }
      if (!isStr(this.key)) return this.corrupt()
      let k = end
      while (k < n && isWs(b[k])) k++
      if (k >= n) return null // 冒号未到（键重扫——键短，零成本）
      if (b[k] !== ":") return this.corrupt()
      this.st = "value"
      return k + 1
    }
    if (this.st === "value") {
      if (i >= n) return null
      const c = b[i]
      if (this.key === "history") { // history 非数组 ⇒ 内容面不可用（门不过）
        if (c !== "[") return this.corrupt()
        this.historySeen = true
        this.sep = "start"
        this.st = "item"
        return i + 1
      }
      const end = this.jump(b, i)
      if (end === null) return null
      if (end <= i) return this.corrupt() // 空值（无进展）⇒ 结构违规（防死循环）
      if (HEAD_KEYS.has(this.key) && c !== "{" && c !== "[") {
        try { this.head[this.key] = JSON.parse(b.slice(i, end)) } catch { return this.corrupt() }
      }
      this.st = "after"
      return end
    }
    if (this.st === "after") { // 顶层：刚完一值 ⇒ 须是 `,` 或 `}`
      if (i >= n) return null
      if (b[i] === ",") { this.sep = "need"; this.st = "key"; return i + 1 }
      if (b[i] === "}") { this.done = true; return i + 1 }
      return this.corrupt()
    }
    // item：history 数组内（元素结构定界——逐元素切片解析）
    if (i >= n) return null
    const c = b[i]
    if (c === "]") { if (this.sep === "need") return this.corrupt(); this.st = "after"; return i + 1 } // 尾逗号
    if (c === ",") { if (this.sep !== "after") return this.corrupt(); this.sep = "need"; return i + 1 }
    if (this.sep === "after") return this.corrupt() // 缺分隔符
    const end = this.jump(b, i) // 值闭界（不完整 ⇒ 留值文本于 buf，续扫）
    if (end === null) return null
    if (end <= i) return this.corrupt() // 空值元素（无进展）⇒ 结构违规（防死循环）
    this.sep = "after"
    this.count += 1 // messageCount = history.length（逐元素计数——含非对象元素）
    if (c === "{") {
      let m
      try { m = JSON.parse(b.slice(i, end)) } catch { return this.corrupt() }
      if (isRealUserMsg(m)) {
        this.turns += 1 // turnCount = 真实用户消息数（谓词单源 = history-window.mjs）
        if (this.first === null) this.first = m.content.slice(0, 80)
      }
    }
    return end
  }
  /** 跨块可续的值跳跃（「字符串 / 转义跨块续读」）：自 `i` 跳到值末（回值后一位）；输入不足 ⇒ `null`
   *  （**状态保留**——下次自 `this.p` 续扫，每字符只扫一次）；标量**不吃分隔符**（切片 `[i, end)`）。 */
  jump(b, i) {
    if (this.k === null) {
      const c = b[i]
      if (c === undefined) return null
      if (c === '"') { this.k = 1; this.p = i + 1; this.esc = false }
      else if (c === "{" || c === "[") { this.k = 2; this.p = i + 1; this.d = 1; this.inStr = false; this.esc = false }
      else { this.k = 3; this.p = i }
    }
    let j = this.p
    if (this.k === 1) {
      while (j < b.length) {
        const c = b[j]
        if (this.esc) { this.esc = false; j++; continue }
        if (c === "\\") { this.esc = true; j++; continue }
        if (c === '"') { this.k = null; return j + 1 }
        j++
      }
    } else if (this.k === 2) {
      while (j < b.length) {
        const c = b[j]
        if (this.inStr) {
          if (this.esc) this.esc = false
          else if (c === "\\") this.esc = true
          else if (c === '"') this.inStr = false
        } else if (c === '"') this.inStr = true
        else if (c === "{" || c === "[") this.d += 1
        else if ((c === "}" || c === "]") && --this.d === 0) { this.k = null; return j + 1 }
        j++
      }
    } else {
      while (j < b.length && !isDelim(b[j])) j++
      if (j < b.length) { this.k = null; return j } // 标量末（不吃分隔符）
    }
    this.p = j // 输入不足 ⇒ 记位置续扫（触底 = 可能截断）
    return null
  }
  corrupt() { this.bad = true; this.done = true; return null }
  /** 校验门 + 摘要字段：结构完整（顶层配平 ∧ 见 `history` 数组）∧ `version ∈ {1,2}` ∧ cwd 一致（缺键 =
   *  本档）⇒ 字段（不含 `ts`）；否则 `null`（不发明摘要）。字段缺省与 `slotDigest` / `extractSlotMeta`
   *  逐条同口径（单源判据 = 用例强制逐字段相等）。 */
  result(cwd) {
    if (this.bad || !this.done || !this.historySeen) return null
    if (!isBlank(this.buf.slice(this.cursor))) return null // 顶层配平后非空白残留（未过 `feed` 的那段）⇒ 门不过
    if (this.head.version !== 1 && this.head.version !== 2) return null
    const fc = this.head.cwd
    if (isStr(fc) && fc.toLowerCase() !== cwd.toLowerCase()) return null
    const meta = {
      messageCount: this.count, turnCount: this.turns, firstMessage: this.first ?? "",
      activeProvider: this.head.activeProvider ?? "", updatedAt: this.head.updatedAt ?? Date.now(),
      title: this.head.title ?? "",
    }
    if (this.head.activeModel) meta.activeModel = this.head.activeModel
    if (this.head.createdBy) meta.createdBy = this.head.createdBy
    return meta
  }
}
