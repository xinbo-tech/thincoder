/**
 * context-percent-parity.test.mjs — M2 机器验收（端差·显示面消差批 · 批档 §2.1 M2 + §2.10.8 #14）。
 *
 * 缺陷：同一会话里 `context X%` 双口径——CLI 用**估算**（`estimateTokens(history)`），VSC 用
 * provider 报告的 `prompt_tokens`（`panel-callbacks.mjs` → `ctxPercentForModel`）⇒ 同标签两读数。
 * 判据权威：`docs/batches/2026-09-20-display-parity-batch.md` §2.1 M2（分子 = 核 `estimateTokens`
 * ——`thincoder-core/context.mjs:20`；分母 = 核 `providerSpec(provider).context` = CLI 同源）；CLI
 * 标尺 = `thincoder-cli/src/tui/render-frame.mjs:388-389`（式 `Math.round(分子 / 分母 * 100)`）+
 * `render-loop.mjs:89-91`（`ctxCache.tokens = estimateTokens(agent.history)`——内联式，无独立导出
 * ⇒ 对拍以**逐字复算 + 源锚**承载，见 §2.10.8 #14 限制登记）。
 *
 * 组①（跨端对拍）：同一 history × provider 夹具 ⇒ `ctxPercentForHistory` === CLI 现盘公式复算值
 *   （结构锚 = CLI 两处源文本在位 ⇒ 对端公式漂移即红）。组②（调用点）：真 `buildPanelCallbacks`
 *   `onUsage` 载荷 = 估算值（非 `prompt_tokens` 值——夹具两者不等 ⇒ 判据有牙）。组③（渲染两路径）：
 *   usage 消息驱动与 2 s 拍体复绘字面同值；`ctxPercentForModel` 既有语义零回归。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { estimateTokens } from "@thincoder/core/context.mjs"
import { providerSpec } from "@thincoder/core/model-specs.mjs"
import { ctxPercentForHistory, ctxPercentForModel } from "../src/specs.mjs"
import { buildPanelCallbacks } from "../src/extension/panel-callbacks.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

// ─── 夹具 ────────────────────────────────────────────────────

/** 机读线形态（role + content + reasoning + tool_calls——`context.mjs estimateTokens` 全量面）。 */
const HISTORY = [
  { role: "system", content: "You are ThinCoder, a zero-dependency coding agent. ".repeat(40) },
  { role: "user", content: "把显示面消差批落地：工具卡 / 摘要 / 状态行。".repeat(60) },
  {
    role: "assistant",
    content: "开始。",
    reasoning_content: "先读批档 §2，再逐子项落点。".repeat(30),
    tool_calls: [{ function: { name: "bash", arguments: '{"command":"npm test"}' } }],
  },
  { role: "tool", content: "[stdout]:\nTests passed.\n\n(exit code 0)\n".repeat(50) },
]
/** provider 覆盖形（`providers[].context` 千 token 单位 ⇒ `providerSpec` ×1024）。 */
const PROVIDER = { model: "glm-5.2", context: 128 }

/** CLI 现盘公式**逐字复算**（`render-frame.mjs:388-389`：分子 = `ctxCache.tokens` = `estimateTokens(agent.history)`）。 */
const cliCtxPct = (history, provider) =>
  Math.round((estimateTokens(history) / providerSpec(provider).context) * 100)

// ─── 组① 跨端对拍 + 对端源锚（§2.10.8 #14）──────────────────────────────────

test("M2-1 对端源锚：CLI 公式与分子链逐字在位（对拍锚——对端漂移即红）", () => {
  const frame = readFileSync(new URL("../../thincoder-cli/src/tui/render-frame.mjs", import.meta.url), "utf8")
  assert.ok(
    frame.includes("Math.round((state.ctxCache.tokens / modelContext) * 100)"),
    "CLI 状态行公式字面在位（render-frame.mjs 分子/分母/式）",
  )
  assert.ok(frame.includes("providerSpec(agent.provider).context"), "CLI 分母 = providerSpec(provider).context")
  const loop = readFileSync(new URL("../../thincoder-cli/src/tui/render-loop.mjs", import.meta.url), "utf8")
  assert.match(loop, /tokens:\s*estimateTokens\(agent\.history\)/, "CLI 分子 = estimateTokens(agent.history)（render-loop）")
})

test("M2-2 跨端对拍：同一 history × provider ⇒ VSC 值 === CLI 公式逐字复算值", () => {
  for (const [label, history, provider] of [
    ["会话夹具（覆盖窗口）", HISTORY, PROVIDER],
    ["模型默认窗口（无 providers[].context 覆盖）", HISTORY, { model: "glm-5.2" }],
    ["短历史", [{ role: "user", content: "hi" }], PROVIDER],
  ]) {
    assert.equal(ctxPercentForHistory(history, provider), cliCtxPct(history, provider), `${label}：两端同式等值`)
  }
})

test("M2-3 空历史边界：零估算 ⇒ null（CLI `ctxPct > 0` 显示门同判——不产 `context 0%`）", () => {
  assert.equal(estimateTokens([]), 0, "前置：空心读零估算")
  assert.equal(ctxPercentForHistory([], PROVIDER), null)
  assert.equal(ctxPercentForHistory(undefined, PROVIDER), null)
  assert.equal(cliCtxPct([], PROVIDER), 0, "CLI 复算值 0 ⇒ 显示门不渲染（同判）")
})

test("M2-4 `ctxPercentForModel` 既有语义零回归（provider 报告值消费面保留）", () => {
  assert.equal(ctxPercentForModel(65536, PROVIDER), 50)
  assert.equal(ctxPercentForModel(0, PROVIDER), null)
  assert.equal(ctxPercentForModel(null, PROVIDER), null)
})

// ─── 组② 调用点（真 buildPanelCallbacks——载荷 = 估算值）────────────────────

test("M2-5 调用点：`onUsage` 载荷 ctxPct = 估算口径（≠ 同批 prompt_tokens 口径——夹具两值不等）", () => {
  const posts = []
  const panel = { _panel: { webview: { postMessage: (m) => posts.push(m) } } }
  const cbs = buildPanelCallbacks(panel, { history: HISTORY, p: PROVIDER })
  cbs.onUsage({ prompt_tokens: 999_999, completion_tokens: 12 })
  const usage = posts.find((m) => m.type === "usage")
  assert.ok(usage != null, "usage 载荷已发（前置）")
  const expected = cliCtxPct(HISTORY, PROVIDER)
  assert.equal(usage.ctxPct, expected, "ctxPct = 估算口径（CLI 同式）")
  assert.notEqual(usage.ctxPct, ctxPercentForModel(999_999, PROVIDER), "非 prompt_tokens 口径（判据有牙）")
  assert.equal(usage.usage.prompt_tokens, 999_999, "`↑prompt` 段仍为 provider 报告值累计（本项边界）")
})

// ─── 组③ 渲染两路径字面同值 ─────────────────────────────────

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

test("M2-6 渲染两路径：usage 消息驱动与 2 s 拍体复绘字面同值", async () => {
  const state = await import("../webview/state.js")
  const statusBar = await import("../webview/status-bar.js")
  const activity = await import("../webview/activity.js")
  const { S } = state
  S._statusText = null
  S._turnFrame = null
  S._phase = null
  statusBar.handleUsageMessage({ usage: { prompt_tokens: 1000, completion_tokens: 10 }, ctxPct: cliCtxPct(HISTORY, PROVIDER) })
  const line = () => document.getElementById("status-line").innerHTML
  const driven = line()
  assert.ok(driven.includes(`context ${cliCtxPct(HISTORY, PROVIDER)}%`), "消息驱动：context 段 = 估算口径值")
  // 2 s 拍体逐字（`panels.js:69-72`：refreshLiveHeaders + running 门下 renderStatusBar）
  S._turnState = "running"
  activity.refreshLiveHeaders()
  statusBar.renderStatusBar()
  assert.equal(line(), driven, "拍体复绘字面同值（`_lastCtxPct` 单源）")
})
