/**
 * editor-open.mjs — 外部编辑器 CLI 探测 ∕ 命令行构造 ∕ spawn 形（端差清算轮 #627 —— `file:open` 行定位消解）。
 *
 * 面：`file:open` 出口（`ipc.mjs` `fileOpen`）的**单一路径链**前半 ——
 *   ① 候选探测：`code` → `code-insiders` → `cursor` → `subl`（`where` ∕ `sh -c 'command -v'` 探存 ——
 *      沿核 `shell-candidates.mjs:46` 同式；**成功结果 memo** ∕ 在飞去重 ∕ **绝不抛出**：探测失败 = 该候选缺席）；
 *      两臂返回形 = 命中 ⇒ **回显入口路径**（`where` 命中 `.cmd` shim ⇒ 直 spawn 不可靠，全路径 + cmd 包装才是稳形）·
 *      未命中 ⇒ `null`（调用面落 `shell.openPath` 兜底）。
 *   ② 命令行构造（**argv 数组，零 shell 拼接**）：`code` 族 = `--goto path:line`；`subl` = `path:line`
 *      （style 由入口路径 basename 判定）；`line` 缺 ∕ 非正整数 ⇒ 纯路径（零行参）。
 *   ③ spawn 形（沿核 `mcp/transport-stdio.mjs:30` 先例）：Windows 且非 `.exe` ⇒ `cmd.exe /d /s /c` 包装
 *      （`windowsVerbatimArguments` + 核 `quoteArg` 单源引用）；否则直 spawn。fire-and-forget：`detached` +
 *      `unref`，只认 spawn ∕ error 事件（spawn 失败 ⇒ 调用面兜底恰一次）。
 */
import { execFile, spawn } from "node:child_process"
import { basename } from "node:path"
// 命令行引用单源（零第二实现——核 `mcp/transport-stdio.mjs:30` 同份 `quoteArg`）。
import { quoteArg } from "@thincoder/core/mcp/helpers.mjs"

/** 候选表（表序 = 探测优先序，首命中即取——`code` 族先于 `subl`）。 */
export const EDITOR_CANDIDATES = Object.freeze(["code", "code-insiders", "cursor", "subl"])

/** 探测超时（ms）—— 沿核 `shell-candidates.mjs` 同值（两端原值单源口径）。 */
const PROBE_TIMEOUT_MS = 3000

/** 成功结果 memo ∕ 在飞（同批共享）——本档单点持有；未命中不缓存（`where` 便宜，且用户可能中途装上）。 */
let _cache = null
let _inFlight = null

/** 测试缝（沿核 `_setShellDetectForTest` 先例；复位 = `null`）：伪探测（返串 ∕ `null`，可 Promise）——注入即清 memo ∕ 在飞态；
 * 伪 spawn（入参 `(entry, args)`，返布尔 —— 供全链注入与失败注入）；纪律：零第三方依赖 ∕ 零文案。 */
let _detectImpl = null
export function _setEditorDetectForTest(fn) {
  _detectImpl = typeof fn === "function" ? fn : null
  _cache = null
  _inFlight = null
}

/** 伪 spawn（入参 = `(entry, args)`，返布尔 ∕ Promise<布尔>）。 */
let _spawnImpl = null
export function _setEditorSpawnForTest(fn) { _spawnImpl = typeof fn === "function" ? fn : null }

/** 首行路径提取：`where` 可回多行 ⇒ 取首个非空行；非串 ∕ 空输出 ⇒ `null`。 */
function firstPathOf(value) {
  if (typeof value !== "string") return null
  for (const line of value.split(/\r?\n/)) {
    const hit = line.trim()
    if (hit !== "") return hit
  }
  return null
}

/** 单候选探存（异步非阻塞；失败 ∕ 超时 ⇒ `null`——绝不抛出）。 */
function probeCommand(cmd) {
  if (_detectImpl !== null) return Promise.resolve().then(() => _detectImpl(cmd)).then(firstPathOf).catch(() => null)
  return new Promise((resolve) => {
    const win = process.platform === "win32"
    try {
      execFile(win ? "where" : "sh", win ? [cmd] : ["-c", `command -v ${cmd}`], { timeout: PROBE_TIMEOUT_MS }, (err, stdout) => {
        resolve(err ? null : firstPathOf(stdout))
      })
    } catch { resolve(null) }
  })
}

/** 候选探测（memo 命中 + 在飞去重）：命中 ⇒ 入口路径；全候选缺席 ⇒ `null`——**绝不抛出**。 */
export function detectEditorCli() {
  if (_cache !== null) return Promise.resolve(_cache)
  if (_inFlight) return _inFlight
  const p = (async () => {
    for (const cmd of EDITOR_CANDIDATES) {
      const entry = await probeCommand(cmd)
      if (entry !== null) return entry
    }
    return null
  })().then((hit) => { _cache = hit; return hit }).finally(() => { if (_inFlight === p) _inFlight = null })
  _inFlight = p
  return p
}

/** 行参风格（纯函数）：入口路径 basename 去可执行后缀 = `subl` ⇒ `colon`（`path:line`）；余 ⇒ `goto`
 *  （`--goto path:line` —— `code` ∕ `code-insiders` ∕ `cursor` 族同形）。未知入口 ⇒ `goto`（宽臂）。 */
export function editorStyleOf(entry) {
  const stem = basename(String(entry ?? "")).replace(/\.(exe|cmd|bat)$/i, "").toLowerCase()
  return stem === "subl" ? "colon" : "goto"
}

/** 命令行构造（纯函数 —— argv 数组，零 shell 拼接）：`line` 正整数 ⇒ 携行（`goto` = `--goto path:line`；
 *  `colon` = `path:line`）；缺 ∕ 非正整数 ⇒ 纯路径（零行参）。 */
export function buildEditorArgs(entry, filePath, line) {
  const n = typeof line === "number" && Number.isInteger(line) && line > 0 ? line : null
  if (n === null) return [filePath]
  return editorStyleOf(entry) === "colon" ? [`${filePath}:${n}`] : ["--goto", `${filePath}:${n}`]
}

/** spawn 形（纯函数）：Windows 且非 `.exe` ⇒ `cmd.exe /d /s /c` 包装（`where` 命中的 `.cmd` shim 直 spawn
 *  不可靠 —— 沿核 `mcp/transport-stdio.mjs:30` 先例；引用 = 核 `quoteArg` 单源）；否则直 spawn。 */
export function spawnSpecOf(entry, args, platform = process.platform) {
  const argv = Array.isArray(args) ? args : []
  if (platform === "win32" && !/\.exe$/i.test(entry)) {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", [entry, ...argv].map(quoteArg).join(" ")],
      windowsVerbatimArguments: true,
    }
  }
  return { command: entry, args: argv, windowsVerbatimArguments: false }
}

/** 启动编辑器（fire-and-forget）：spawn 事件达 ⇒ `true`（随后 `unref`，不等退出）；error ∕ 同步抛 ⇒ `false`
 *  （调用面据此落 `shell.openPath` 兜底恰一次）。测试缝在场 ⇒ 走缝（布尔 ∕ Promise<布尔>）。 */
export function spawnEditorCli(entry, args) {
  if (_spawnImpl !== null) return Promise.resolve().then(() => _spawnImpl(entry, args)).then((value) => value === true).catch(() => false)
  return new Promise((resolve) => {
    const spec = spawnSpecOf(entry, args)
    let child = null
    try {
      child = spawn(spec.command, spec.args, {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
        windowsVerbatimArguments: spec.windowsVerbatimArguments,
      })
    } catch { resolve(false); return }
    child.once("error", () => resolve(false))
    child.once("spawn", () => {
      try { child.unref() } catch { /* already gone */ }
      resolve(true)
    })
  })
}
