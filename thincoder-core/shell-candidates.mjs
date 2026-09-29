/**
 * shell-candidates.mjs — 平台 shell 候选探测**单源**（B10 S17 收编：桌面 `settings-env.mjs:27-62` ∥
 * VSC `src/extension/settings.mjs:72-115` 两造 ≈逐字 ⇒ 候选表 ∕ 探测序 ∕ 超时 ∕ memo 上提本档；
 * 两端薄壳只留 re-export —— 端侧零自持候选表）。
 *
 * 面：`shellCandidates()` ⇒ `Promise<{ name, value }[]>`——「System default」恒首 + 平台候选
 * （`where` ∕ `sh -c 'command -v'` 探存）；进程内 memo（成功结果缓存：本进程生命周期内 shell 路径
 * 不热变化）+ 在飞去重（同一时刻重复请求共享同一批 —— 不叠发子进程）。
 * 探测面 = **异步非阻塞**（`execFile` + `Promise.all` 并发；同步探测会占住宿主事件循环 ⇒ UI 假死 ——
 * VSC F-W18 口径）；本函数**绝不抛出**（探测失败 = 该候选缺席）。
 * 测试缝（先例 = 核 `_setProbeImplForTest`）：`_setShellDetectForTest` 替换真实 `execFile` 探测；
 * 注入即清 memo ∕ 在飞态（免旧批结果串味）；复位 = `null`。
 * 纪律：零第三方依赖；本档只 probe 存在性 —— 不读配置、不出文案（候选名面 = 两端既有显示源）。
 */
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"

/** 探测超时（ms）—— 两端原值单源（VSC `settings.mjs` ∕ 桌面 `settings-env.mjs` 同值 3000）。 */
const PROBE_TIMEOUT_MS = 3000

/** Git Bash 安装路径表（Windows 候选面 —— 表序 = 探测优先序，首命中即取）。 */
const GIT_BASH_PATHS = Object.freeze([
  "C:\\Program Files\\Git\\bin\\bash.exe",
  "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
  `${process.env.LOCALAPPDATA ?? ""}\\Programs\\Git\\bin\\bash.exe`,
])

/** memo（成功结果缓存）∕ 在飞（同批共享）—— 本档单点持有。 */
let _cache = null
let _inFlight = null

/** 测试缝：伪探测替掉真实 `execFile` 探测（可返 Promise——异步面同形）；注入即清 memo ∕ 在飞态。 */
let _detectImpl = null
export function _setShellDetectForTest(fn) {
  _detectImpl = typeof fn === "function" ? fn : null
  _cache = null
  _inFlight = null
}

/** 候选命令是否存在（异步探测：Windows `where` / POSIX `sh -c 'command -v'`；失败或超时 ⇒ false）。 */
function commandExists(cmd) {
  return new Promise((resolve) => {
    if (_detectImpl) { resolve(_detectImpl(cmd)); return }
    const win = process.platform === "win32"
    try {
      execFile(win ? "where" : "sh", win ? [cmd] : ["-c", `command -v ${cmd}`], { timeout: PROBE_TIMEOUT_MS }, (err, stdout) => {
        resolve(!err && String(stdout ?? "").trim().length > 0)
      })
    } catch { resolve(false) }
  })
}

/** 平台候选表（「System default」恒首；`detect` 只作探测用 —— 出口两键 `{ name, value }` 不外发函数）。 */
function candidateTable() {
  const candidates = [{ name: "System default", value: null, detect: () => true }]
  if (process.platform === "win32") {
    candidates.push({ name: "PowerShell (pwsh)", value: "pwsh", detect: () => commandExists("pwsh") })
    candidates.push({ name: "Windows PowerShell (powershell)", value: "powershell", detect: () => commandExists("powershell") })
    const gb = GIT_BASH_PATHS.find((p) => p && existsSync(p))
    if (gb) candidates.push({ name: `Git Bash (${gb})`, value: gb, detect: () => true })
    candidates.push({ name: "WSL bash (wsl)", value: "wsl", detect: () => commandExists("wsl") })
  } else {
    for (const sh of ["bash", "zsh", "fish"]) candidates.push({ name: sh, value: sh, detect: () => commandExists(sh) })
  }
  return candidates
}

/** 平台 shell 候选读数（memo + 在飞去重）：候选集 = 探存命中项 `{ name, value }`（平台序）。 */
export function shellCandidates() {
  if (_cache !== null) return Promise.resolve(_cache)
  if (_inFlight) return _inFlight
  const candidates = candidateTable()
  const p = Promise.all(candidates.map(async (c) => ((await c.detect()) ? { name: c.name, value: c.value } : null)))
    .then((hits) => { _cache = hits.filter(Boolean); return _cache })
    .finally(() => { if (_inFlight === p) _inFlight = null })
  _inFlight = p
  return p
}
