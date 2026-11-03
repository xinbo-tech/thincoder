/**
 * ssh-transport.mjs — SSH 传输面单点（askpass 链 ∥ 子进程 ∥ 沉降 ∥ 遮蔽 ∥ 输出帽）。
 * 设计 = `docs/core/design/TOOLS.md` §6.22（D-TO17/D-TO18 · 台账 #1436）。
 *
 * 拆档由 = 机制档触 500 顾问线（§6.22 落点表「触 500 顾问线 ⇒ 实施轮先审拆分」）——本档收**运行面**
 * （与会话语义无关的传输原语），`ssh-session.mjs` 收**会话面**（池 / 生命周期 / 动作）。条目形
 * （entry）由 `ssh-session.mjs` 定义并持有；本档只经其字段工作（`buf` / `mask` / `_waiters` /
 * `promptRe` / `state` / `child` / `logStream` / `_notify` / `lastDataAt` / `bytes`）。
 *
 * - askpass 链：包装档（Win `.cmd` ∥ POSIX `.sh` 0700）→ `tools/ssh-askpass.mjs` → stdout；秘密只经
 *   ssh 子进程环境 `TC_SSH_SECRET`（零入参 / 零落盘 / 零回显；环境经 `nodeChildEnv` 单点补 Electron 旗标）。
 * - 终端噪声：有状态剥离（CSI ∥ OSC ∥ 单字符控制三类 + CRLF 归一；状态跨 chunk 携带）——落点 = 传输入口，
 *   **先剥离后遮蔽**；日志面 = 模型面同源（D-TO23）。
 * - 就绪判据：四门（待答标记 ∥ 提示符 ∥ 仍在吐 ∥ 硬超时 60 s）；静默窗只作去抖（D-TO21）。
 * - 遮蔽：写入的秘密对**捕获面与日志面**做字面移除（比较面 = 同一归一 + 按不可见处切段 ≥ 4）。
 * - 失败分类族（auth ∥ unreachable ∥ hostkey）照服务端 `src/sandbox/ssh.mjs` 同源判据。
 * 模块图：→ config.mjs（configDir 缺省）· tools/shared.mjs（解码）· text-budget.mjs（截断本体）·
 * tools/node-child.mjs（nodeChildEnv）· expand-home.mjs（`~` 展开单源——`identityFile` 用）——叶子向、无环
 * （本档不 import `ssh-session.mjs`）。
 */
import { chmodSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { configDir } from "../config.mjs"
import { expandHome } from "../expand-home.mjs"
import { makeDecoder } from "../tools/shared.mjs"
import { nodeChildEnv } from "../tools/node-child.mjs"
import { capText as capBudgetText, fillMarker } from "../text-budget.mjs"

/** 静默窗（§6.22 ③）：**只作去抖**——判尾部这半条标记到没到齐；不再单独构成「已就绪」。 */
export const SSH_SETTLE_MS = 800
/** 硬超时（§6.22 ③/⑥）：`send` / `read` / `secret_input` 的本次等待；到点返回部分输出 + 可读句。 */
export const SSH_TIMEOUT_MS = 60_000
/** `connect` 首屏等待（§6.22 ③「适用范围」拆两常量——慢设备才拖不动连接）。 */
export const SSH_CONNECT_SETTLE_MS = 10_000
/** 单次返回帽（§6.22 ⑥）：**返回窗口** = 保头 + 注记 + 保尾；省略中段回填未读缓冲。 */
export const SSH_RETURN_CAP = 8000
/** 帽窗头尾比例（§6.22 ⑥：头 60% ∥ 尾 40%——头段装接口 / ACL，尾段装结束证据）。 */
const CAP_HEAD_RATIO = 0.6
/** 遮蔽分段下限（§6.22 ③「`≥ 4` 为选定策略值」：3 字符以下与正常输出撞面过高）。 */
const MASK_SEG_MIN = 4
/** 保活缺省（§6.22 ④：`ServerAliveInterval=30`；测试态时间缝按 ms 传入后换算）。 */
export const SSH_KEEPALIVE_MS = 30_000
/** 秘密环境变量名（§6.22 ②「秘密传递」行）。 */
export const SECRET_ENV = "TC_SSH_SECRET"
/** 内存缓冲保留量（仅覆盖返回帽；全量恒在 log）。 */
export const BUF_KEEP_CHARS = 64 * 1024

/** 测试缝（单元测试沙箱——生产从不调用；`_setBgTaskLogDirForTest` 同式：一缝管三落点
 *  （log 目录 ∥ askpass 包装目录 ∥ 预填档）。`prefixArgs` = 夹具替身用（`<node> <夹具脚本> <ssh 参数…>`）。 */
let _sshBinary = null
let _sshArgPrefix = []
let _sshConfigDir = null
export function _setSshBinaryForTest(cmd, prefixArgs = []) {
  _sshBinary = cmd
  _sshArgPrefix = Array.isArray(prefixArgs) ? prefixArgs : []
}
export function _setSshConfigDirForTest(dir) { _sshConfigDir = dir }
export const sshBinary = () => _sshBinary ?? "ssh"
export const sshArgPrefix = () => _sshArgPrefix
export const sshConfigDir = () => _sshConfigDir ?? configDir

// ─── askpass 链（包装档 ∥ 环境 ∥ 命令形）────────────────────────────────────

/** 包装档运行期写入（内容零秘密——仅路径；Win `.cmd` ∥ POSIX `.sh` 0700）。 */
export function writeAskpassWrapper(id) {
  const dir = `${sshConfigDir()}/ssh-askpass`
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  const helper = fileURLToPath(new URL("../tools/ssh-askpass.mjs", import.meta.url))
  const node = process.execPath
  const win = process.platform === "win32"
  const file = `${dir}/askpass-${process.pid}-${id}.${win ? "cmd" : "sh"}`
  // `.cmd` 首行 `@echo off`：cmd 中介默认回显命令行——回显会占掉 ssh 读回的**首行**
  // （`readpass.c` 只取首行 ⇒ 口令错位为空串）；POSIX `.sh` 无此面。
  writeFileSync(file, win ? `@echo off\r\n"${node}" "${helper}" %*\r\n` : `#!/bin/sh\nexec "${node}" "${helper}" "$@"\n`, { mode: 0o700 })
  try { chmodSync(file, 0o700) } catch { /* win32 无 POSIX mode——尽力面 */ }
  return file
}

/** 包装档清理（关闭 / 终结时尽力面——内容零秘密，残留无实害）。 */
export function unlinkAskpass(entry) {
  try { if (entry.askpassFile) unlinkSync(entry.askpassFile) } catch { /* 尽力面 */ }
  entry.askpassFile = null
}

/** ssh 子进程环境：askpass 链 + 秘密（无秘密时**显式清除**——防父进程残留变量误喂）。 */
export function buildSshEnv({ wrapper, secret }) {
  const env = { ...process.env, SSH_ASKPASS: wrapper, SSH_ASKPASS_REQUIRE: "force" }
  // 占位 DISPLAY：OpenSSH < 8.4 无 `SSH_ASKPASS_REQUIRE`（RHEL 8 / CentOS 8 代）——无 DISPLAY 时
  // askpass 不被放行（`readpass.c` allow_askpass 判据）；占位后新旧两代同走 askpass（§6.22 NS1 注）。
  if (!env.DISPLAY) env.DISPLAY = ":0"
  if (secret != null) env[SECRET_ENV] = secret
  else delete env[SECRET_ENV]
  return nodeChildEnv(env)
}

/** 会话命令形（§6.22 ⑤）：`-tt` 强制远端 PTY + 保活三件 + 单提示；`port`/`user` 未给 ⇒ 不下发。
 *  `identityFile` 显式给出 / 记录有值 ⇒ `-i <路径>`（追加候选身份，不夺本机配置与 agent 的既有尝试序列）。
 *  预探 = `NumberOfPasswordPrompts=0`（password ∥ keyboard-interactive 两径同被短路——
 *  `sshconnect2.c` `userauth_passwd` / `userauth_kbdint` 两处同判 `attempt++ >= n`；私钥口令提示
 *  亦被短路：`load_identity_file` 循环 `i <= number_of_password_prompts`）；带密 = 1（单提示）。 */
export function buildSshArgs({ host, user, port, probe, identityFile = null, keepAliveMs = SSH_KEEPALIVE_MS }) {
  const keepAliveS = Math.max(1, Math.round((Number(keepAliveMs) || SSH_KEEPALIVE_MS) / 1000))
  return [
    "-tt",
    "-o", "ConnectTimeout=10",
    "-o", `ServerAliveInterval=${keepAliveS}`,
    "-o", "ServerAliveCountMax=4",
    "-o", `NumberOfPasswordPrompts=${probe ? 0 : 1}`,
    ...(port ? ["-p", String(port)] : []),
    ...(identityFile ? ["-i", expandHome(identityFile)] : []),
    user ? `${user}@${host}` : host,
  ]
}

// ─── 终端噪声（§6.22 ③「终端噪声」· D-TO23）────────────────────────────────

/** 不可见处（遮蔽比较面的切段器——与剥离同一类目：CSI ∥ ESC+1 ∥ 任一控制字符）。 */
const INVISIBLE_SPLIT = /\x1b\[[\x20-\x3f]*[\x40-\x7e]|\x1b[^\x1b]?|[\x00-\x1f\x7f]/

/** 有状态剥离器（§6.22 ③）：三类序列 CSI ∥ OSC ∥ 单字符控制 + `\r\n`∥裸 `\r` 归 `\n`。
 *  状态跨 chunk 携带（序列被 chunk 边界切开不残留成字面）；三类之外的序列（DCS / APC 等）按
 *  单字符控制处理——头字节剥掉，体内字节当可见文本如实交出（设计「表外序列的出口」）。
 *  `push` = 返回边界（状态保留）；`end` = 收场（硬超时 ∥ close ∥ 会话终结：尾部半条序列丢弃并计一次）。 */
export function createStripper() {
  let state = "ground" // ground ∥ esc ∥ csi ∥ osc ∥ oscEsc ∥ charset
  let pendingCr = false // chunk 尾的 `\r`（下一片首字为 `\n` ⇒ 仍归一条——跨 chunk 的 CRLF）
  const scan = (text) => {
    const s = String(text ?? "")
    let out = ""
    let i = 0
    while (i < s.length) {
      const ch = s[i]
      if (pendingCr) {
        pendingCr = false
        out += "\n"
        if (ch === "\n") { i += 1; continue }
      }
      if (state === "esc") {
        state = "ground"
        if (ch === "[") state = "csi"
        else if (ch === "]") state = "osc"
        else if (ch === "(" || ch === ")" || ch === "*" || ch === "+") state = "charset"
        else if (ch === "\x1b") state = "esc"
        i += 1
        continue
      }
      if (state === "charset") { state = "ground"; i += 1; continue } // `ESC ( 0` 字符集指定（既有覆盖不回归）
      if (state === "csi") {
        const c = ch.charCodeAt(0)
        if (c >= 0x20 && c <= 0x3f) { i += 1; continue } // 参数 ∥ 中间字节
        if (c >= 0x40 && c <= 0x7e) { state = "ground"; i += 1; continue } // 终字节
        state = "ground" // 类外字 ⇒ 序列作废，本字按常规面重判（不吞可见字节）
        continue
      }
      if (state === "osc") {
        if (ch === "\x07") { state = "ground"; i += 1; continue }
        if (ch === "\x1b") { state = "oscEsc"; i += 1; continue }
        i += 1
        continue
      }
      if (state === "oscEsc") {
        state = "ground"
        if (ch === "\\") { i += 1; continue } // `ESC \` = ST
        state = "osc" // 非 ST ⇒ 本字仍在 OSC 体内（ESC 已丢弃，体内字节本就要丢）
        continue
      }
      if (ch === "\x1b") { state = "esc"; i += 1; continue }
      if (ch === "\r") {
        if (i + 1 >= s.length) { pendingCr = true; i += 1; continue }
        out += "\n"
        i += s[i + 1] === "\n" ? 2 : 1
        continue
      }
      if (ch === "\n" || ch === "\t") { out += ch; i += 1; continue }
      const code = ch.charCodeAt(0)
      if (code < 0x20 || code === 0x7f) { i += 1; continue } // BEL ∥ 退格 ∥ 其余 C0（保留 `\n` / `\t`）
      out += ch
      i += 1
    }
    return out
  }
  return {
    /** 喂一片（返回可交出文本；半条序列留给下一片）。 */
    feed(text) { return scan(text) },
    /** 收场：尾部半条序列丢弃并计一次；其前后的可见字节照常交出。 */
    end(text = "") {
      let out = scan(text)
      if (pendingCr) { out += "\n"; pendingCr = false }
      const dropped = state === "ground" ? 0 : 1
      state = "ground"
      return { text: out, dropped }
    },
  }
}

/** 同一归一（无状态旁路——遮蔽比较面用：秘密值先过控制字节剥离 + CRLF 归一）。 */
export function normalizeText(text) {
  return createStripper().end(String(text ?? "")).text
}

// ─── 遮蔽（§6.22 ⑦）────────────────────────────────────────────────────────

/** 秘密遮蔽过滤器：字面移除 + `len-1` 尾缓冲（跨 chunk 切分不泄；尾至沉降冲涮）。
 *  比较面 = 与剥离同一归一（§6.22 ③）：秘密值先归一、再按不可见处切段（段长 ≥ 4）——
 *  裸字面匹配会漏掉夹控制字节 ∥ 被 chunk 切开的回显。 */
export function createMask() {
  const secrets = []
  let tail = ""
  let keep = 0
  return {
    add(secret) {
      const raw = String(secret ?? "")
      if (!raw) return
      const table = [normalizeText(raw), ...raw.split(INVISIBLE_SPLIT).filter((seg) => seg.length >= MASK_SEG_MIN)]
      for (const s of table) {
        if (!s || secrets.includes(s)) continue
        secrets.push(s)
        keep = Math.max(keep, s.length - 1)
      }
    },
    push(text) {
      let out = tail + String(text ?? "")
      for (const s of secrets) out = out.split(s).join("")
      if (out.length <= keep) { tail = out; return "" }
      const emit = out.slice(0, out.length - keep)
      tail = out.slice(out.length - keep)
      return emit
    },
    /** 尾缓冲现行内容（**判据面用**：门①② 要看到已达字节——尾在 drain 时释放，判据不得被它推迟）。 */
    peek() { return tail },
    /** 沉降时冲涮尾缓冲：**只放行非秘密前缀段**（尾内最长可疑后缀一律扣下——整尾 ∥ 移位前缀
     *  都不出返回面；扣下的至多 `秘密长-1` 字符，代价 < 前缀外泄）。 */
    flush() {
      const t = tail
      tail = ""
      if (!t) return ""
      let cut = 0
      for (const s of secrets) {
        const max = Math.min(t.length, s.length - 1)
        for (let L = 1; L <= max; L++) if (t.endsWith(s.slice(0, L))) cut = Math.max(cut, L)
      }
      return cut ? t.slice(0, t.length - cut) : t
    },
  }
}

// ─── 子进程（起跑 ∥ 双流汇入 ∥ 退出）────────────────────────────────────────

/** 悬挂 chunk 双流汇入（已剥离已遮蔽 → log ∥ 缓冲 ∥ 面板 → 唤醒沉降等待者）。 */
function handleChunk(entry, text) {
  if (!text) return
  try { entry.logStream?.write(text) } catch { /* log 写失败不进语义——尽力面 */ }
  entry.buf += text
  if (entry.buf.length > BUF_KEEP_CHARS) {
    entry.buf = entry.buf.slice(entry.buf.length - BUF_KEEP_CHARS)
    entry.bufDropped = true
  }
  entry._notify?.(text)
  entry.lastDataAt = Date.now()
  for (const w of [...entry._waiters]) w("data")
}

/** 子进程挂载（双流解码 ∥ 剥离 → 遮蔽 ∥ 退出 ∥ spawn 错误——探连与会话同径）。
 *  顺序 = **先剥离后遮蔽**（§6.22 ③）：剥离只删字节、不插入 ⇒ 切不断秘密字面；每条流一份剥离状态
 *  （两个流各自成序列，不共用一个半条状态）。到达计数在这之前记（§6.22 ③ 门④ 口径 = 「回了没有」，
 *  不随遮蔽尾缓冲的后扣而变）。 */
export function attachChild(entry, child) {
  entry.child = child
  const outDecoder = makeDecoder()
  const errDecoder = makeDecoder()
  const outStrip = createStripper()
  const errStrip = createStripper()
  entry.strippers = [outStrip, errStrip]
  const route = (decoder, strip) => (d, final = false) => {
    const visible = strip.feed(decoder(d, final))
    if (!visible) return
    entry.lastDataAt = Date.now()
    entry.bytes += visible.length // 到达量（剥离后、遮蔽前）——门④ 判「回了没有」用
    handleChunk(entry, entry.mask.push(visible))
  }
  const outRoute = route(outDecoder, outStrip)
  const errRoute = route(errDecoder, errStrip)
  const flush = () => {
    outRoute(Buffer.alloc(0), true)
    errRoute(Buffer.alloc(0), true)
    entry.escDropped = (entry.escDropped ?? 0) + flushEscapes(entry) // 收场：尾部半条序列丢弃并计一次
  }
  child.stdout.on("data", (d) => outRoute(d))
  child.stderr.on("data", (d) => errRoute(d))
  // stdin 无 error 监听 ⇒ 对端刚死时写入的异步 EPIPE 会以未处理 'error' 事件逸出（uncaughtException）。
  // 同族先例：CLI `tui/clipboard.mjs` ∥ `mcp/transport-stdio.mjs` 同式吞 EPIPE。
  child.stdin?.on("error", () => { /* 写失败由 send ∥ secret_input 的调用面回读；此处仅防未处理事件 */ })
  child.on("error", (error) => {
    if (entry.child !== child) return // 旧进程（已被重起替换）——判定面不采
    entry.spawnError = error?.message ?? String(error)
    for (const w of [...entry._waiters]) w("exit")
  })
  child.on("exit", (code, exitSignal) => {
    if (entry.child !== child) return // 旧进程（探连 → 带密会话的重起面）——事件不污染新连接判定
    entry.exitInfo = { code, signal: exitSignal }
    flush()
    // 已就绪（会话态）⇒ 远端断开：终态 + 墓碑（E5）；探连期的退出由 connect 判定径处置（不在此收尾）。
    if (entry.state === "ready" && entry.closing !== true) entry.onRemoteExit?.(entry)
    for (const w of [...entry._waiters]) w("exit")
  })
}

/** 起跑一条 ssh（探连 ∥ 带密会话同径）。重起（探连 → 带密会话）⇒ 判定面复位：exitInfo ∥
 *  spawnError 属**上一次**进程（残留会让新连接的成功判定被误读成「已退出」）。 */
export function spawnSession(entry, { user, port, secret, identityFile = null, keepAliveMs = SSH_KEEPALIVE_MS }) {
  entry.exitInfo = null
  entry.spawnError = null
  const child = spawn(sshBinary(), [...sshArgPrefix(), ...buildSshArgs({ host: entry.host, user, port, probe: secret == null, identityFile, keepAliveMs })], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    detached: process.platform !== "win32",
    env: buildSshEnv({ wrapper: entry.askpassFile, secret }),
  })
  attachChild(entry, child)
  return child
}

// ─── 就绪判据（§6.22 ③ 四门 · D-TO21）─────────────────────────────────────

/** 待答标记（门①——设备正等我发键；`--More--` 走空格、确认走 y/n）。 */
const ANSWER_MARKERS = ["--More--", "(y/n)", "Password:"]
/** 缺省设备提示符形（门②——行尾 `#` `>` `$` `%`，前接非空白词）。 */
const DEVICE_PROMPT = /[^\s][#$>%]\s*$/u

/** 末行（门① 只看末行——陈旧标记被后续输出顶走就不命中，B18）。 */
const tailLine = (text) => {
  const s = String(text ?? "")
  return s.slice(s.lastIndexOf("\n") + 1)
}

/** 判据面文本 = **新到字节**（`base` 之后） + 遮蔽尾缓冲（尾在 drain 时释放，门不得被它推迟）。
 *  `base` 撇掉本轮之前就在缓冲里的存量（回填的中段不得充当本轮判据面——§6.22 ③「四门只判新到字节」）。 */
const watchText = (entry, base = 0) => `${entry.buf.slice(base)}${entry.mask?.peek?.() ?? ""}`

/** 门① 待答标记（**末行锚定**——只看最后一个换行之后的部分；"出现"故用 `includes`：`(y/n)?` ∥ `[y/n]` 同类形都能命中）。 */
export function markerHit(entry, base = 0) {
  const line = tailLine(watchText(entry, base))
  return ANSWER_MARKERS.some((m) => line.includes(m))
}

/** 门② 提示符：agent 所设 `promptPattern` 命中 ∥ 缺省设备形。 */
export function promptHit(entry, base = 0) {
  const text = watchText(entry, base)
  if (entry.promptRe && entry.promptRe.test(text)) return true
  return DEVICE_PROMPT.test(tailLine(text))
}

/** 硬超时失败标签三枚（门④——与门③ 两条子情形同文；计的是**到达字节**：剥离后、遮蔽前）。 */
function timeoutLabel(entry, startBytes) {
  if (entry.bytes <= startBytes) return "not a single byte came back"
  return Date.now() - entry.lastDataAt < SSH_SETTLE_MS ? "still producing output" : "no prompt detected"
}

/** 等到就绪（返回 reason）：`marker` ∥ `prompt` ∥ `timeout` ∥ `exited` ∥ `aborted`（`connect` 另有 `silence`）。
 *  门①② 在**每个到达 chunk** 上求值；静默窗只判「尾部这半条标记到没到齐」（去抖）——不参与求值、不推迟
 *  判断时点，也不再单独构成「已就绪」（D-TO21）。`settleOnSilence` = `connect` 首屏沿用旧口径
 *  （§6.22 ③「适用范围」：四门只判 `send` / `read` / `secret_input`）。 */
export function waitSettled(entry, { timeoutMs = SSH_TIMEOUT_MS, signal = null, settleOnSilence = false } = {}) {
  return new Promise((resolve) => {
    let done = false
    let quietTimer = null
    const startBytes = entry.bytes
    const baseLen = entry.buf.length // 门①② 只判**新到字节**（存量中段不当本轮判据面）
    const deadline = Date.now() + Math.max(1, Number(timeoutMs) || SSH_TIMEOUT_MS)
    const finish = (reason) => {
      if (done) return
      done = true
      clearTimeout(quietTimer)
      clearTimeout(deadlineTimer)
      signal?.removeEventListener("abort", onAbort)
      entry._waiters.delete(onEvent)
      if (reason === "timeout") {
        entry.settleFailure = timeoutLabel(entry, startBytes)
        entry.escDropped = (entry.escDropped ?? 0) + flushEscapes(entry) // 硬超时 = 收场边界（§6.22 ③ flush②）
      }
      resolve(reason)
    }
    const evaluate = () => {
      if (markerHit(entry, baseLen)) { finish("marker"); return true }
      if (promptHit(entry, baseLen)) { finish("prompt"); return true }
      return false
    }
    const arm = () => {
      clearTimeout(quietTimer)
      quietTimer = setTimeout(() => {
        if (done) return
        if (settleOnSilence) return finish(promptHit(entry, baseLen) ? "prompt" : "silence")
        evaluate() // 去抖：尾部半条标记到齐后再求值一次；未命中 ⇒ 继续等到硬超时
      }, SSH_SETTLE_MS)
    }
    const onEvent = (kind) => {
      if (kind === "exit") return finish("exited")
      if (evaluate()) return undefined
      arm()
    }
    const onAbort = () => finish("aborted")
    const deadlineTimer = setTimeout(() => finish("timeout"), Math.max(0, deadline - Date.now()))
    if (entry.state === "dead" || entry.state === "closed") return finish("exited")
    if (signal?.aborted) return finish("aborted")
    signal?.addEventListener("abort", onAbort, { once: true })
    entry._waiters.add(onEvent)
    onEvent("data") // 起点：先查门①②，否则起去抖窗
  })
}

/** 就绪结论注记（§6.22 ③）：提示符 ∥ 待答标记 ∥ 硬超时（**点名失败门**）∥ 中断 ∥ 退出。 */
export function settleNote(entry, reason, waitedMs) {
  if (reason === "prompt") return "settled (prompt matched)"
  if (reason === "marker") return "settled (the device is waiting for input — the marker is shown above)"
  if (reason === "silence") return "settled (silence window)"
  if (reason === "timeout") {
    const label = entry.settleFailure ?? "no prompt detected"
    entry.settleFailure = null
    const hint = label === "no prompt detected" ? "; pass promptPattern on connect if this device's prompt does not look like a shell prompt" : ""
    return `not settled after ${Math.round(waitedMs / 100) / 10}s (${idLabel(entry)} @ ${entry.host}) — partial output above (${label}${hint})`
  }
  if (reason === "aborted") return `(interrupted — partial output above; the session stays open: ${idLabel(entry)} @ ${entry.host})`
  if (reason === "exited") return `${idLabel(entry)} @ ${entry.host} ${entry.state === "ready" ? "ended (the remote closed the connection)" : "has stopped"}`
  return String(reason)
}

// ─── 输出面（缓冲 ∥ 帽 ∥ 状态行）────────────────────────────────────────────

export const idLabel = (entry) => `ssh#${entry.id}`

/** 取出未读输出（遮蔽尾缓冲先冲涮）。 */
export function drain(entry) {
  const flushed = entry.mask.flush()
  if (flushed) entry.buf += flushed
  const text = entry.buf
  entry.buf = ""
  const dropped = entry.bufDropped === true
  entry.bufDropped = false
  return { text, dropped }
}

/** 回填未读缓冲（丢最旧、保住尾证据；§6.22 ⑥）。 */
function backfill(entry, middle) {
  if (!middle || !entry) return
  entry.buf = middle + entry.buf // 中段先于更新字节（回填顺序 = 原序）
  if (entry.buf.length > BUF_KEEP_CHARS) {
    entry.buf = entry.buf.slice(entry.buf.length - BUF_KEEP_CHARS)
    entry.bufDropped = true
  }
}

/** 返回帽窗（§6.22 ⑥ · D-TO22）：**返回总长 ≤ 帽（注记计入帽内）**——头 60% ∥ 注记 ∥ 尾 40%，
 *  切点按行边界取整、取整只在头段（头段可少不可多）；省略中段**回填未读缓冲**（下一次 `read` 先交出）
 *  ⇒ 长配置按窗口连续取全，不靠翻日志。截断本体 = `text-budget.mjs` `capText`（零新截断实现）。 */
export function capWindow(entry, text, max = SSH_RETURN_CAP) {
  const t = String(text ?? "")
  if (!(max > 0) || t.length <= max) return t
  if (max <= windowMarker(t.length, 0, 0).length) {
    // 帽小到放不下注记 ⇒ 无法成窗：按帽交出前缀、余量回填缓冲（「总长 ≤ 帽」不变式先行；每次 read 都有进展）
    backfill(entry, t.slice(max))
    return t.slice(0, max)
  }
  let marker = windowMarker(t.length, 0, 0)
  let head = 0
  let tail = 0
  for (let round = 0; round < 6; round++) {
    const budget = Math.max(0, max - marker.length)
    const nextHead = alignHead(t, Math.floor(budget * CAP_HEAD_RATIO))
    const nextTail = Math.max(0, budget - Math.floor(budget * CAP_HEAD_RATIO))
    const nextMarker = windowMarker(t.length - nextHead - nextTail, nextHead, nextTail)
    const same = nextHead === head && nextTail === tail && nextMarker === marker
    head = nextHead
    tail = nextTail
    marker = nextMarker
    if (same) break
  }
  while (head > 0 && head + marker.length + tail > max) { // 收敛后的边角（省略数位数增长）——头段再收
    head = Math.max(0, head - (head + marker.length + tail - max))
    marker = windowMarker(t.length - head - tail, head, tail)
  }
  backfill(entry, t.slice(head, t.length - tail))
  const markerOf = (omitted) => windowMarker(omitted, head, tail)
  return capBudgetText(t, { max, keepHead: head, keepTail: tail, marker: markerOf })
}

/** 注记形（§6.22 ⑥）：`N` 走 `text-budget.mjs` `fillMarker` 占位约定；`H` ∥ `T` = 实保头 ∥ 尾长。 */
const WINDOW_MARKER = "[… N chars omitted (head H / tail T) — the omitted middle is kept; call read again to collect it …]\n"
const windowMarker = (omitted, head, tail) =>
  fillMarker(WINDOW_MARKER, omitted).replace("H", String(head)).replace("T", String(tail))

/** 头段切点按行边界取整（不切半行；找不到换行则保持原位——头段可少不可多）。 */
const alignHead = (text, n) => {
  const nl = text.lastIndexOf("\n", Math.max(0, n - 1))
  return nl >= 0 ? nl + 1 : n
}

/** 半条序列的收场（§6.22 ③ flush②）：尾部半条丢弃并计一次；其前后的可见字节照常交出。 */
export function flushEscapes(entry) {
  let dropped = 0
  for (const strip of entry.strippers ?? []) {
    const res = strip.end()
    if (res.text) handleChunk(entry, entry.mask.push(res.text))
    dropped += res.dropped
  }
  return dropped
}

/** 半条序列收场注记（§6.22 ③ flush②）——报告一次即清零。 */
export function escapeNote(entry) {
  const n = entry.escDropped ?? 0
  if (!n) return ""
  entry.escDropped = 0
  return `\n— ${n} incomplete escape sequence dropped`
}

/** 状态行冠形（§6.22 动作表末行）：每返回首行。 */
export function statusLine(entry) {
  const idle = Math.max(0, Math.round((Date.now() - entry.lastActivityAt) / 1000))
  return `[ssh (${idLabel(entry)}) ${entry.host} — ${entry.state} · idle ${idle}s]`
}

/** 体形（空 ⇒ `(no output)`；非空转义——`bash-async.mjs renderDigest` 同式）。 */
export function bodyText(text) {
  return text.trim() ? escapeXmlLite(text.replace(/\s+$/u, "")) : "(no output)"
}

/** XML 转义（`agent/helpers.mjs escapeXml` 同式；本档为零依赖注入面自持小实现，避免
 *  transport → agent 反向依赖）。 */
function escapeXmlLite(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

// ─── 失败分类（照服务端分类族：auth ∥ unreachable ∥ fingerprint_changed）─────

export function classifyFailure(stderr) {
  const text = String(stderr ?? "")
  if (/REMOTE HOST IDENTIFICATION HAS CHANGED|Host key verification failed|host key .* revoked|requested strict checking/i.test(text)) {
    return { kind: "hostkey", message: "host key verification failed — the key changed or your local ssh config requires strict checking; known_hosts is never rewritten by this tool" }
  }
  if (/Permission denied|Too many authentication failures|Authentication failed/i.test(text)) {
    return { kind: "auth", message: "authentication rejected" }
  }
  if (/Connection timed out|Connection refused|No route to host|Could not resolve hostname|Connection closed by|Network is unreachable|connect to host .* failure/i.test(text)) {
    return { kind: "unreachable", message: "host unreachable or timed out" }
  }
  return null
}

/** 失败句（含 id ∥ host；尾附探测现场末段——诊断面）。 */
export function failureText(entry, cls, extra = "") {
  const at = `(${idLabel(entry)} @ ${entry.host})`
  const tail = entry.buf.trim() ? `\n${escapeXmlLite(entry.buf.trim().slice(-600))}` : ""
  return `Error: ssh ${cls ? cls.message : "connection failed"} ${at}${extra}${tail}`
}
