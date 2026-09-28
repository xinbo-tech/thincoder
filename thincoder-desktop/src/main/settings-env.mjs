/**
 * settings-env.mjs — 主侧 env 族处理体（R7 · 桌面功能对位批 · 批档 §2 R7 #4；**先拆后改**：自
 * `src/main/settings.mjs` 拆出 —— 300 行层拆分）。
 *
 * 面：`settings:env` 三支 —— 读 `{}`（proxy + shell 现值 + shell 候选面）· 写 `{ patch: { proxy?,
 * shell? } }`（**写经核 `writeConfigAtomic`**——端侧零自写盘；删键语义住 mutate 体）· TestProxy
 * `{ testProxy: { uri } }`（转口 `providers.mjs` `testProxy` —— 探针面单源，本档零第二探针）。
 * 语义源（逐项）：proxy merge ∕ shell 清键 = VSC `settings-env.js` + `saveProxySettingsFromPanel` ∕
 * `saveShellSettingsFromPanel`（`thincoder-vscode/src/extension/settings.mjs`）；shell 候选面 =
 * VSC `shellCandidates`（同序同形：System default 恒首）。
 * 纪律：零 electron 依赖（平 node 可直测）；写前校验失败 ⇒ 回执 reason 直传、**零写**；
 * TestProxy 反向依赖经**动态 import** 解引用（零顶层环）。
 */
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { loadConfig, normalizeProxy } from "@thincoder/core/config.mjs"
import { _configPath, writeConfigAtomic } from "@thincoder/core/config-io.mjs"

/** Shell 候选面（平台探测；源 = VSC `src/extension/settings.mjs` `shellCandidates` 同序同形 ——
 *  「System default」恒首 + 平台候选（`where` ∕ `sh -c 'command -v'` 探存））：
 *  memo（本进程内 shell 路径不热变化）+ 在飞去重（同批共享 —— 不叠发子进程）；
 *  `detect` 只返回候选名 ∕ 值两键（探测函数不外发）。**绝不抛出**（探测失败 = 该候选缺席）。 */
let _shellProbeCache = null
let _shellProbeInFlight = null

/** 候选命令是否存在（异步探测：Windows `where` / POSIX `sh -c 'command -v'`；失败或超时 ⇒ false）。 */
function commandExists(cmd) {
  return new Promise((resolve) => {
    const win = process.platform === "win32"
    try {
      execFile(win ? "where" : "sh", win ? [cmd] : ["-c", `command -v ${cmd}`], { timeout: 3000 }, (err, stdout) => {
        resolve(!err && String(stdout ?? "").trim().length > 0)
      })
    } catch { resolve(false) }
  })
}

/** 平台 shell 候选读数（异步 ⇒ Promise；memo + 在飞去重）。 */
export function shellCandidates() {
  if (_shellProbeCache !== null) return Promise.resolve(_shellProbeCache)
  if (_shellProbeInFlight) return _shellProbeInFlight
  const GIT_BASH_PATHS = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    `${process.env.LOCALAPPDATA ?? ""}\\Programs\\Git\\bin\\bash.exe`,
  ]
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
  const p = Promise.all(candidates.map(async (c) => ((await c.detect()) ? { name: c.name, value: c.value } : null)))
    .then((hits) => { _shellProbeCache = hits.filter(Boolean); return _shellProbeCache })
    .finally(() => { if (_shellProbeInFlight === p) _shellProbeInFlight = null })
  _shellProbeInFlight = p
  return p
}

/** env 读面（`{ proxy, shell }`）：proxy = 核 `normalizeProxy` 投影（缺 ∕ 非法 ⇒ 默认三键形——
 *  空 uri 即「未配置」；沿 VSC `saveProxySettingsFromPanel` 缺省形）；shell = 现值（缺 ⇒ null）+ 候选面。 */
async function envFace() {
  const config = loadConfig()
  const proxy = normalizeProxy(config?.proxy) ?? { uri: "", web: true, model: false }
  const shell = typeof config?.shell === "string" && config.shell !== "" ? config.shell : null
  return { proxy, shell: { current: shell, candidates: await shellCandidates() } }
}

/** proxy 写形（merge 语义沿 VSC `saveProxySettingsFromPanel`）：`uri` 给 ⇒ 取 trim（空 ⇒ 删整节）；
 *  未给 ⇒ 沿用现值；`web` ∕ `model` 逐键覆写。 */
function applyProxyPatch(disk, value) {
  const current = normalizeProxy(disk?.proxy) ?? { uri: "", web: true, model: false }
  const uri = "uri" in value ? value.uri.trim() : current.uri
  if (!uri) { delete disk.proxy; return }
  disk.proxy = {
    uri,
    web: "web" in value ? value.web : current.web,
    model: "model" in value ? value.model : current.model,
  }
}

/** shell 写形（沿 VSC `saveShellSettingsFromPanel`）：串取 trim（空 ⇒ 删键 ⇒ 系统默认）；`null` = 显式清。 */
function applyShellPatch(disk, value) {
  const shell = typeof value === "string" ? value.trim() : ""
  if (!shell) delete disk.shell
  else disk.shell = shell
}

/** env 写支写前校验（**零写**判据：非法即回执 reason —— 不落任何变更）。返回错误串 ∕ `null`（合法）。 */
function envPatchError(patch) {
  if ("proxy" in patch) {
    const value = patch.proxy
    if (value === null || typeof value !== "object" || Array.isArray(value)) return "settings:env patch.proxy expects an object { uri?, web?, model? }"
    for (const key of Object.keys(value)) if (!["uri", "web", "model"].includes(key)) return `settings:env patch.proxy: unknown field "${key}"`
    if ("uri" in value && typeof value.uri !== "string") return "settings:env patch.proxy.uri expects a string"
    if ("web" in value && typeof value.web !== "boolean") return "settings:env patch.proxy.web expects a boolean"
    if ("model" in value && typeof value.model !== "boolean") return "settings:env patch.proxy.model expects a boolean"
  }
  if ("shell" in patch && patch.shell !== null && typeof patch.shell !== "string") return "settings:env patch.shell expects a string or null"
  return null
}

/**
 * `settings:env(payload)`：读 `{}` ⇒ `{ ok, reason:null, proxy, shell }`；写 `{ patch: { proxy?,
 * shell? } }` ⇒ 同形回执（**写后回读**）；TestProxy `{ testProxy: { uri } }` ⇒ 转口 `providers.mjs`
 * `testProxy`（探针面单源 —— 本档零第二探针）。
 * 三支**互斥**（`patch` 与 `testProxy` 同在 ⇒ `invalid-patch` 零动作）；写支失败 ⇒ reason 直传
 * （核 `mtime-conflict` ∕ 本档写前校验串）——**零写**。
 */
export async function settingsEnv(payload) {
  const test = payload?.testProxy
  const patch = payload?.patch
  const hasTest = test !== undefined && test !== null
  const hasPatch = patch !== undefined && patch !== null
  if (hasTest && hasPatch) return { ok: false, reason: "invalid-patch", ...(await envFace()) }
  if (hasTest) {
    const { testProxy } = await import("./providers.mjs") // 反向依赖仅调用期解引用（零顶层环）
    return testProxy(test)
  }
  if (!hasPatch) return { ok: true, reason: null, ...(await envFace()) }
  if (typeof patch !== "object" || Array.isArray(patch)) return { ok: false, reason: "invalid-patch", ...(await envFace()) }
  const keys = Object.keys(patch)
  if (keys.length === 0 || keys.some((k) => k !== "proxy" && k !== "shell")) {
    return { ok: false, reason: "invalid-patch", ...(await envFace()) }
  }
  const invalid = envPatchError(patch)
  if (invalid !== null) return { ok: false, reason: invalid, ...(await envFace()) }
  const w = writeConfigAtomic(_configPath(), (disk) => {
    if ("proxy" in patch) applyProxyPatch(disk, patch.proxy)
    if ("shell" in patch) applyShellPatch(disk, patch.shell)
  })
  if (!w.ok) return { ok: false, reason: w.reason, ...(await envFace()) }
  return { ok: true, reason: null, ...(await envFace()) }
}
