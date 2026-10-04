/**
 * 2026-10-04-bash-executor-face.test.mjs — bash 执行器语义根治批 · 批内单测件（随批归档）。
 *
 * 不入 `thincoder-core/test/` 仓套件树（开发期工具不占仓套件——批次档教义）；复跑方式：
 *   node --test docs/batches/2026-10-04-bash-executor-face.test.mjs   （cwd = 仓根）
 *
 * 八腿 = 设计档 AC1–AC8 的机判子集（AC4/AC6 的活体探针读数落批次档 §5——本件只守纯函数与装配面）。
 * 注：三端注入表 import 即求值（读真实 ~/.thincoder/config.json——shape 断言不绑 kind，跨机可复跑）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  resolveShellIdentity,
  executorLine,
  _setComSpecForTest,
} from "../../thincoder-core/shell-identity.mjs"
import {
  loadToolDoc,
  applyPromptInjections,
  configurePromptInjections,
  resetPromptInjections,
} from "../../thincoder-core/prompt-files.mjs"
import { CLI_PROMPT_INJECTIONS } from "../../thincoder-cli/src/prompt-injections.mjs"
import { DESKTOP_PROMPT_INJECTIONS } from "../../thincoder-desktop/src/main/prompt-injections.mjs"
import { VSC_PROMPT_INJECTIONS } from "../../thincoder-vscode/src/prompt-injections.mjs"

const ANCHOR_RE = /\{\{inject:[a-z0-9-]+\}\}/

test("AC1 识别表：知名字逐词命中（powershell ∥ pwsh ∥ bash.exe 路径 ∥ wsl）", () => {
  assert.deepEqual(
    { kind: resolveShellIdentity("powershell").kind, known: resolveShellIdentity("powershell").known, name: resolveShellIdentity("powershell").name },
    { kind: "powershell", known: true, name: "Windows PowerShell" },
  )
  const pwsh = resolveShellIdentity("pwsh")
  assert.equal(pwsh.kind, "powershell")
  assert.equal(pwsh.name, "PowerShell (pwsh)")
  const gitBash = resolveShellIdentity("C:\\Program Files\\Git\\bin\\bash.exe")
  assert.equal(gitBash.kind, "posix")
  assert.equal(gitBash.known, true)
  assert.equal(resolveShellIdentity("wsl").kind, "posix")
})

test("AC1 入参 null（win32 宿主）⇒ %COMSPEC% 链 ⇒ kind:cmd 且 raw 收在 cmd.exe", () => {
  const id = resolveShellIdentity(null)
  if (process.platform === "win32") {
    assert.equal(id.kind, "cmd")
    assert.ok(id.raw.toLowerCase().endsWith("cmd.exe"), `raw = ${id.raw}`)
  } else {
    assert.equal(id.kind, "posix")
  }
})

test("AC7a 探测不到（未知名 myweirdshell）⇒ unknown 中性句（fail-open 零猜测）", () => {
  const id = resolveShellIdentity("myweirdshell")
  assert.equal(id.known, false)
  assert.equal(id.kind, "unknown")
  const line = executorLine(id)
  assert.match(line, /could not be identified/)
  assert.match(line, /myweirdshell/)
})

test("AC7b _setComSpecForTest(\"\") + shell=null ⇒ 链终值兜底 cmd.exe ⇒ kind:cmd + cmd 行", () => {
  try {
    _setComSpecForTest("")
    const id = resolveShellIdentity(null)
    assert.equal(id.raw, "cmd.exe")
    assert.equal(id.kind, "cmd")
    assert.match(executorLine(id), /Windows cmd\.exe/)
  } finally {
    _setComSpecForTest(undefined)
  }
})

test("U5 纯空白串 trim 后空 ⇒ 走默认链（不改 spawn 现行为的探测面镜像）", () => {
  try {
    _setComSpecForTest("C:\\Windows\\system32\\cmd.exe")
    const id = resolveShellIdentity("   ")
    assert.equal(id.kind, "cmd")
    assert.equal(id.raw, "C:\\Windows\\system32\\cmd.exe")
  } finally {
    _setComSpecForTest(undefined)
  }
})

test("值面五形：cmd ∥ PS5 ∥ pwsh（/pwsh/i 分流）∥ posix ∥ unknown 逐字形态", () => {
  assert.match(executorLine(resolveShellIdentity("cmd.exe")), /Windows cmd\.exe \(%COMSPEC%\)/)
  const ps5 = executorLine(resolveShellIdentity("powershell"))
  assert.match(ps5, /PS 5\.1 has NO &&\/\|\|/)
  const pwsh = executorLine(resolveShellIdentity("pwsh"))
  assert.match(pwsh, /&& and \|\| work/)
  assert.doesNotMatch(pwsh, /PS 5\.1/)
  assert.match(executorLine(resolveShellIdentity("bash")), /POSIX shell/)
  assert.match(executorLine(resolveShellIdentity("myweirdshell")), /could not be identified/)
})

test("三端注入表：CLI ∥ 桌面 = 执行器行；VSC = 执行器行 + terminal 参数行拼接", () => {
  assert.match(CLI_PROMPT_INJECTIONS["bash-terminal-face"], /^- Executor:/)
  assert.match(DESKTOP_PROMPT_INJECTIONS["bash-terminal-face"], /^- Executor:/)
  const vsc = VSC_PROMPT_INJECTIONS["bash-terminal-face"]
  assert.match(vsc, /^- Executor:/)
  assert.match(vsc, /terminal: "visible"/)
})

test("装配面：configure 后 apply(loadToolDoc) 产物含 Executor 行 ∥ 零 {{inject: 字面", () => {
  try {
    configurePromptInjections(CLI_PROMPT_INJECTIONS)
    const out = applyPromptInjections(loadToolDoc("bash"))
    assert.match(out, /- Executor:/)
    assert.doesNotMatch(out, ANCHOR_RE)
  } finally {
    resetPromptInjections()
  }
  // 复位 = 恒等（未配置零替换——核缝三态守一）
  assert.equal(applyPromptInjections("A{{inject:bash-terminal-face}}B"), "A{{inject:bash-terminal-face}}B")
})
