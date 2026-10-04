/**
 * shell-identity.mjs — bash 工具**执行器身份**探测单源（bash-executor-face 批 · 台账 #922——
 * 设计权威 = `docs/core/design/BASH-EXECUTOR-FACE.md` §2 契约 + §3.1）。
 *
 * 探测源 = **spawn 同链镜像**（`tools/bash.mjs` spawn 的 `shell` 参数计算式）：
 *   config.shell（trim 后非空即用）→ win32 %COMSPEC% → 兜底字面 `cmd.exe`；
 *   非 win32 = `process.env.SHELL` → 兜底 `/bin/sh`（Node `shell:true` 兜底的事实陈述，非平台推断）。
 * 探测值 = 实际执行器（不是环境快照）；探测不到（识别表未命中知名字）⇒ `unknown` 中性句
 * （fail-open 零猜测——用户 2026-10-04 22:48 裁定③）；**零静态平台默认**（裁定①）。
 *
 * memo（进程生命周期 + 按配置值键控）先例 = `shell-candidates.mjs`（「shell 路径不热变化」同判据）；
 * 配置值变化 ⇒ memo 未命中重探（K2 配置变更刷新 ∥ 裁定①零静态同时成立）。
 * 测试缝 `_setComSpecForTest` 先例 = `shell-candidates.mjs:34` `_setShellDetectForTest`。
 */

// 识别表（raw 尾段词 → 显示名 + 语法族）。匹配大小写不敏感，尾段词先剥 `.exe` 后缀（U3——
// `bash.exe` ∥ `cmd.exe` ∥ `pwsh.exe` 均须命中）；序 = 最特异优先：
// `pwsh` 先于 `powershell`；`sh` 排末（防 `fish` 尾段误命中——fish 自目在前）。
const IDENTITY_TABLE = Object.freeze([
  { word: "pwsh", name: "PowerShell (pwsh)", kind: "powershell" },
  { word: "powershell", name: "Windows PowerShell", kind: "powershell" },
  { word: "cmd", name: "cmd.exe", kind: "cmd" },
  { word: "bash", name: "bash", kind: "posix" },
  { word: "wsl", name: "wsl", kind: "posix" },
  { word: "fish", name: "fish", kind: "posix" },
  { word: "zsh", name: "zsh", kind: "posix" },
  { word: "sh", name: "sh", kind: "posix" },
])

/** 尾段词：raw 的最后一段非空词，剥尾 `.exe`（`C:\\...\\bash.exe` → `bash`；`pwsh` → `pwsh`）。 */
function lastWord(raw) {
  const parts = String(raw).trim().split(/[\\/:]+/).filter(Boolean)
  const tail = parts[parts.length - 1] ?? ""
  return tail.toLowerCase().replace(/\.exe$/i, "")
}

/**
 * 探测执行器身份。`configShell` = spawn 侧同一取值（`ctx.agent?.config?.shell ?? null`）。
 * 纯函数（不读环境外的状态；win32 分支内读 `%COMSPEC%`）；memo 按配置值键控。
 * @param {string|null|undefined} configShell
 * @returns {{ raw: string, name: string, kind: "cmd"|"powershell"|"posix"|"unknown", known: boolean }}
 */
export function resolveShellIdentity(configShell) {
  const key = configShell == null ? null : String(configShell)
  if (_memo.key === key) return _memo.value

  // 链 = spawn 侧同式：config.shell trim 后非空即用 → 空/缺省时 win32 读 %COMSPEC%（兜底字面
  // cmd.exe）∥ 非 win32 读 SHELL（兜底 /bin/sh）——探测值 = 实际执行器。
  const trimmed = key == null ? "" : key.trim()
  let raw
  if (trimmed) {
    raw = trimmed
  } else if (process.platform === "win32") {
    const comspec = _comSpecOverride !== null ? _comSpecOverride : process.env.ComSpec
    raw = comspec && comspec.trim() ? comspec : "cmd.exe"
  } else {
    const shell = process.env.SHELL
    raw = shell && shell.trim() ? shell : "/bin/sh"
  }

  const lw = lastWord(raw).toLowerCase()
  // pwsh 分流总则（设计档 §2）：powershell 族值面按 raw 尾段词命中 /pwsh/i 分流——
  // 命中 ⇒ pwsh 形；未命中 ⇒ Windows PowerShell（5.x）形。kind 枚举不动（识别表单目）。
  const pwshForm = /pwsh/i.test(lw)
  const hit =
    IDENTITY_TABLE.find((e) => lw === e.word) ??
    (pwshForm ? null : IDENTITY_TABLE.find((e) => lw.endsWith(e.word)))
  const value = hit
    ? { raw, name: hit.name, kind: hit.kind, known: true }
    : { raw, name: raw, kind: "unknown", known: false }
  _memo.key = key
  _memo.value = value
  return value
}

/** memo（进程生命周期 ∕ 按配置值键控——本档单点持有）。 */
const _memo = { key: undefined, value: null }

/** 测试缝：注入 %COMSPEC% 读数（undefined = 复位真实环境读数）；注入即清 memo。 */
let _comSpecOverride = null
export function _setComSpecForTest(value) {
  _comSpecOverride = value === undefined ? null : value
  _memo.key = undefined
  _memo.value = null
}

/**
 * kind ⇒ 注入值面（一行 Executor 声明 · 设计档 §2 值面表逐字）。powershell 族按 raw 尾段词
 * `/pwsh/i` 分流（pwsh 形 ∥ Windows PowerShell 5.x 形）；identity.kind 为 unknown ⇒ 中性句。
 * @param {{ raw: string, name: string, kind: string, known: boolean }} identity resolveShellIdentity 出参
 * @returns {string}
 */
export function executorLine(identity) {
  const { raw, name, kind } = identity
  switch (kind) {
    case "cmd":
      return "- Executor: the bash tool runs commands through Windows cmd.exe (%COMSPEC%). Use cmd syntax: && works; NUL not /dev/null; %VAR% not $VAR; no single-quote grouping. For complex logic prefer the execute tool (node)."
    case "powershell":
      return /pwsh/i.test(lastWord(raw))
        ? `- Executor: the bash tool runs commands through PowerShell (pwsh; ${raw}). && and || work; %VAR% does not expand (use $VAR); cmdlets differ (Remove-Item, Copy-Item). For complex logic prefer the execute tool (node).`
        : `- Executor: the bash tool runs commands through Windows PowerShell (${raw}). PS 5.1 has NO &&/|| (use ; or separate calls); redirection differs (2>/dev/null is invalid); cmdlets differ (Remove-Item, Copy-Item). For complex logic prefer the execute tool (node).`
    case "posix":
      return `- Executor: the bash tool runs commands through a POSIX shell (${raw}). Standard POSIX syntax applies ($(...), $VAR, ;, >/dev/null).`
    default:
      return `- Executor: the bash tool shell could not be identified (raw: ${raw}) — write portable commands and trust the command's own error output.`
  }
}
