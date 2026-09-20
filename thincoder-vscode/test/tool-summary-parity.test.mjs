/**
 * tool-summary-parity.test.mjs — X3 + X7 机器验收（端差·显示面消差批 · 批档 §2.2 X3/X7）。
 *
 * 缺陷：VSC 摘要恒走「末行 + 状态」通用面 ⇒ 无结构化计数，advisor 裁决计数不可见。
 * 判据权威：`docs/batches/2026-09-20-display-parity-batch.md` §2.2 X3（advisor）· X7（read/write/
 * grep/glob/bash + 默认分支）+ §2.6 行 6；CLI 标尺 = `thincoder-cli/src/tui/tool-summaries.mjs`
 * （`formatToolSummary` 分派 + `:7-53` 各分支字面）。
 *
 * 手法：**对端纯函数直驱对拍**——跨包 import CLI `formatToolSummary`，同输入等值断言（禁复制
 * 字面常量当断言源，§2.6 判据纪律）。恢复面（`buildToolHistory`）与活卡（`finishTool`）两路径
 * 同源断言（happy-dom）。已裁决端差与射程边界**显式断言**（不静默跳过）：
 *  - 成功面不拼 `(exit code 0)`（端差② · `docs/vsc/requirements/WEBVIEW.md:126`）；
 *  - `(empty)` 占位不入内容位（F-W16 · `docs/vsc/design/WEBVIEW.md` §4.3）；
 *  - `verify` 分支本批不登记（X7 ④ —— 落默认分支）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { formatToolSummary } from "../webview/tool-summary.js"
import { formatToolSummary as cliFormatToolSummary } from "../../thincoder-cli/src/tui/tool-summaries.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

/** 同输入对拍（两端输出等值——跨端等值断言唯一手法）。 */
const both = (name, text) => [formatToolSummary(name, text), cliFormatToolSummary(name, text)]

// ─── X3 advisor 三形态（满载 / 零 critical / 拒因）──────────────────────────

const ROWS = (rows) => ["### 评审", "| # | Category | Severity | Issue |", "|---|----------|----------|-------|", ...rows].join("\n")

test("X3-1 advisor 满载：`N critical, N advisory, N style` 对拍等值", () => {
  const text = ROWS(["| 1 | Scope | 🔴 | 越禁 |", "| 2 | Clarity | 🟡 | 措辞 |", "| 3 | Style | 🔵 | 用词 |"])
  const [vsc, cli] = both("advisor", text)
  assert.equal(vsc, cli, "对拍等值")
  assert.equal(vsc, "advisor: 1 critical, 1 advisory, 1 style")
})

test("X3-2 advisor 零 critical（有表）⇒ `advisor: passed` 对拍等值", () => {
  const text = ROWS(["| 1 | Clarity | 🔵 | 用词 |"])
  const [vsc, cli] = both("advisor", text)
  assert.equal(vsc, cli, "对拍等值")
  assert.equal(vsc, "advisor: passed")
})

test("X3-3 advisor 拒因（`Advisor: <首句>`）⇒ `advisor: <首句>` 对拍等值", () => {
  const text = "Advisor: design review launch refused. Ask the user to approve the design first."
  const [vsc, cli] = both("advisor", text)
  assert.equal(vsc, cli, "对拍等值")
  assert.equal(vsc, "advisor: design review launch refused")
})

test("X3-4 advisor 无计数无措辞 ⇒ 两端同返 falsy（不伪摘要）", () => {
  const [vsc, cli] = both("advisor", "no table here at all")
  assert.equal(vsc, cli, "对拍等值（两端同形）")
  assert.ok(!vsc, "零摘要")
})

// ─── X7 四形态结构化计数 ────────────────────────────────────────────────────

test("X7-1 read：`N lines`（含行数缺失回退）对拍等值", () => {
  for (const text of ["Read 120 lines", "a\nb\nc", "big:\nline\n", ""]) {
    const [vsc, cli] = both("read", text)
    assert.equal(vsc, cli, `read 对拍等值（输入 ${JSON.stringify(text.slice(0, 12))}）`)
  }
  assert.equal(formatToolSummary("read", "Read 120 lines"), "120 lines")
})

test("X7-2 write：`wrote N bytes` / `wrote file` / 首行兜底 对拍等值", () => {
  for (const text of ["wrote 2048 bytes to x.mjs", "created file x.mjs", "Edited x.mjs:1", ""]) {
    const [vsc, cli] = both("write", text)
    assert.equal(vsc, cli, `write 对拍等值（输入 ${JSON.stringify(text.slice(0, 12))}）`)
  }
  assert.equal(formatToolSummary("write", "wrote 2048 bytes to x.mjs"), "wrote 2048 bytes")
})

test("X7-3 grep：`N matches` / `1 match` / `no matches`（空结果界）对拍等值", () => {
  for (const text of ["a\nb\nc", "only", "", "\n\n"]) {
    const [vsc, cli] = both("grep", text)
    assert.equal(vsc, cli, `grep 对拍等值（输入 ${JSON.stringify(text.slice(0, 12))}）`)
  }
  assert.equal(formatToolSummary("grep", ""), "no matches")
})

test("X7-4 glob：`N files` / `1 file` / `no files`（空结果界）对拍等值", () => {
  for (const text of ["a.mjs\nb.mjs", "a.mjs", "", "\n"]) {
    const [vsc, cli] = both("glob", text)
    assert.equal(vsc, cli, `glob 对拍等值（输入 ${JSON.stringify(text.slice(0, 12))}）`)
  }
  assert.equal(formatToolSummary("glob", ""), "no files")
})

const BASH_OK = "[stdout]:\nboom\n\n(exit code 2)"
const BASH_MULTI = "[stdout]:\nline1\nline2\n\n(exit code 1)"
const BASH_SPAWN = "Command failed: spawn C:\\Windows\\system32\\cmd.exe ENOENT\n[stdout]:\n(empty)\n\n(spawn failed)"

test("X7-5 bash 失败面（末行提取 + 状态位）对拍等值", () => {
  for (const text of [BASH_OK, BASH_MULTI, BASH_SPAWN]) {
    const [vsc, cli] = both("bash", text)
    assert.equal(vsc, cli, `bash 对拍等值（输入 ${JSON.stringify(text.slice(0, 16))}）`)
  }
  assert.equal(formatToolSummary("bash", BASH_OK), "bash: boom (exit code 2)")
  assert.equal(formatToolSummary("bash", BASH_MULTI), "bash: line2 (exit code 1)")
  assert.equal(formatToolSummary("bash", BASH_SPAWN), "bash: (spawn failed)")
})

test("X7-6 bash 空结果界：两端同返 falsy", () => {
  const [vsc, cli] = both("bash", "")
  assert.equal(vsc, cli, "对拍等值")
  assert.ok(!vsc)
})

test("X7-7 bash 长末行：两端同取 100 字符（字面逐字承 CLI）", () => {
  const long = "x".repeat(140)
  const [vsc, cli] = both("bash", `[stdout]:\n${long}\n\n(exit code 1)`)
  assert.equal(vsc, cli, "对拍等值（截断长度同规）")
  assert.equal(vsc, `bash: ${"x".repeat(100)} (exit code 1)`)
})

test("X7-8 端差②（已裁决 · 登记断言）：bash 成功面本端不拼 `(exit code 0)`", () => {
  const text = "[stdout]:\nok\n\n(exit code 0)"
  const [vsc, cli] = both("bash", text)
  assert.equal(vsc, "bash: ok", "本端仅失败面拼非零状态")
  assert.equal(cli, "bash: ok (exit code 0)", "CLI 摘要侧拼退出状态")
  assert.notEqual(vsc, cli, "该形**不等值** = 端差②本体（`docs/vsc/requirements/WEBVIEW.md:126`）")
})

test("X7-9 F-W16 既有裁决（登记断言）：bash 无输出面 `(empty)` 占位不入内容位", () => {
  const text = "[stdout]:\n(empty)\n\n(exit code 1)"
  assert.equal(formatToolSummary("bash", text), "bash: (exit code 1)", "本端只余状态位（不读作 (empty)）")
  assert.equal(cliFormatToolSummary("bash", text), "bash: (empty) (exit code 1)", "CLI 原样取占位行")
})

test("X7-10 默认分支（未知工具）= `name: <首个非空行>`（CLI :15-17 同规）对拍等值", () => {
  for (const text of ["first line\nsecond", "  \nreal first\n", ""]) {
    const [vsc, cli] = both("mcp__foo", text)
    assert.equal(vsc, cli, `默认分支对拍等值（输入 ${JSON.stringify(text.slice(0, 12))}）`)
  }
  assert.equal(formatToolSummary("mcp__foo", "first line\nsecond"), "mcp__foo: first line")
})

test("X7-11 射程边界断言：`verify` 本批不登记 ⇒ 落默认分支（X7 ④）", () => {
  const text = "Changed files: x.mjs\n  ✗ a.mjs:3 — syntax\n✓ Tests passed."
  assert.equal(formatToolSummary("verify", text), "verify: Changed files: x.mjs", "本端默认分支形")
  assert.notEqual(formatToolSummary("verify", text), cliFormatToolSummary("verify", text), "CLI verify 分支未迁（登记边界）")
})

// ─── 恢复面 / 活卡两路径同源（happy-dom 真 ui.js）────────────────────────────

let cleanupEnv

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

async function loadUi() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  return { ctx: state.ctx, ...ui }
}

test("X7-12 两路径同源：活卡（finishTool）与恢复卡（buildToolHistory）摘要字面 = 叶函数返回值", async () => {
  const wv = await loadUi()
  const { ctx } = wv
  const text = ROWS(["| 1 | Scope | 🔴 | 越禁 |", "| 2 | Style | 🔵 | 用词 |"])
  const expected = "→ " + formatToolSummary("advisor", text)
  assert.equal(expected, "→ advisor: 1 critical, 1 style", "前置：分派命中 advisor")
  ctx.messagesEl.replaceChildren()
  ctx.currentBlock = null
  ctx.currentTools = []
  ctx._toolRefs = {}
  ctx.assistantLabeled = true
  wv.addTool(ctx, "advisor", '{"type":"design"}', "x1")
  wv.finishTool(ctx, "advisor", "x1", text, [])
  const live = ctx.messagesEl.querySelector('.tool-call[data-tool-id="x1"] .tool-call-summary')
  assert.equal(live?.textContent, expected, "活卡摘要 = 叶函数字面")
  const histCard = wv.buildToolHistory(ctx, "advisor", text, 7)
  const hist = histCard.querySelector(".tool-call-summary")
  assert.equal(hist?.textContent, expected, "恢复卡摘要同字面（两路径同源）")
})
