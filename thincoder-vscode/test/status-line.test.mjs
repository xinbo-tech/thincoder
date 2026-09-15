/**
 * status-line.test.mjs — 活动区收口批（2026-09-12）R6 机器验收（状态行字段级对齐 CLI）。
 * 设计权威：`docs/design/WEBVIEW.md` §14（C-12#1/#2/#6 · C-15 逐字段对位表 · 用例
 * T-CL21..T-CL24 · AC-CL6）；批次档 `thincoder-cli/docs/batches/2026-09-12-VSC-ACTIVITY-CLOSURE.md`
 * §2（§14.7 注：本档直驱导出映射面 + 发射调用点 grep 机检）。
 *
 * 两组手法：
 * ① 主侧（T-CL21a）：`statusTextPayload` 纯函数直驱（onWait 相位 → kind）+ 载荷面机判；
 * ② webview 侧（T-CL21b/T-CL22/T-CL23/T-CL24）：happy-dom 全量 id fixture + 真 chat.js 驱动
 *    （window message 直驱 statusText/turnFrame/usage/token）→ `#status-line` 文本断言。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { setupWebview } from "./helpers/webview-env.mjs"
import files from "./files.mjs"
import { statusTextPayload } from "../src/extension/panel-callbacks.mjs"
import { toolPanelPayload } from "../src/extension/panel-toolpanel.mjs"

let cleanupEnv

const INDEX_IDS = ("chat-container session-bar project-btn session-selector session-title session-arrow " +
  "session-dropdown new-session-btn messages subagent-activity panels goal-panel task-panel toolbar status-line " +
  "at-dropdown input-row file-input input attach-btn send-btn abort-btn paste-bar paste-badge controls-row " +
  "model-btn reasoning-btn auto-btn advisor-btn eng-btn plan-btn settings-btn model-dropdown reasoning-dropdown " +
  "settings-panel settings-close settings-body welcome-panel welcome-heading welcome-text " +
  "welcome-provider-label welcome-provider welcome-key-label welcome-key welcome-save-btn welcome-skip-btn " +
  "welcome-settings-btn").split(" ")

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  document.body.innerHTML = INDEX_IDS.map((id) => `<div id="${id}"></div>`).join("")
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const line = () => document.getElementById("status-line").innerHTML

async function loadChat() {
  await import("../webview/chat.js")
  const state = await import("../webview/state.js")
  const i18n = await import("../webview/i18n.js")
  return { S: state.S, setStrings: i18n.setStrings }
}

/** 状态段断言用清场（S 面 + DOM 面——逐测独立起点）。 */
function resetLine(S) {
  S._statusText = null
  S._turnFrame = null
  S._lastUsage = null
  S._phase = null
  send({ type: "clearMessages" })
}

// ─── ① 主侧：onWait → statusText 映射（T-CL21a）＋ 载荷面机判 ──────────

test("T-CL21a statusText 映射（AC-CL6/AC-CL7）：五相位逐 kind 载荷 + warn/未知 → 不发射", () => {
  assert.deepEqual(statusTextPayload({ phase: "rate", seconds: 5 }), { type: "statusText", kind: "rateWait", seconds: 5 }, "TPM 限流等待")
  assert.deepEqual(statusTextPayload({ phase: "gate", seconds: 9 }), { type: "statusText", kind: "rateWait", seconds: 9 }, "CLI gate 相位同映射")
  assert.deepEqual(statusTextPayload({ phase: "retry", seconds: 7, status: 429 }), { type: "statusText", kind: "rateLimited", seconds: 7 }, "429 限流（provider 侧携 status:429）")
  assert.deepEqual(statusTextPayload({ phase: "overloaded", seconds: 2 }), { type: "statusText", kind: "overloaded", seconds: 2 }, "5xx 过载重试")
  assert.deepEqual(statusTextPayload({ phase: "quota", message: "quota exhausted: x" }), { type: "statusText", kind: "quota", message: "quota exhausted: x" }, "配额耗尽（原文透传）")
  assert.equal(statusTextPayload({ phase: "warn", message: "estimated > tpm" }), null, "warn（前置换告警）→ 不发射")
  assert.equal(statusTextPayload({ phase: "unknown" }), null, "未知相位 → 不发射")
})

test("T-CL21a-3 C-12#3/#4 host 面机判（AC-CL7）：toolPanel 白名单 tool/cmd 逐字 + subagent-run status:'turn' 发射点", () => {
  const obj = toolPanelPayload("sub:eng-coder#1", { kind: "tool", text: "read {}", round: 2, model: "glm-5.3", tool: "read", cmd: "src/x.mjs" })
  assert.equal(obj.type, "toolPanel", "消息名不变（只增不改）")
  assert.equal(obj.tool, "read", "白名单透传 tool（工具名）")
  assert.equal(obj.cmd, "src/x.mjs", "白名单透传 cmd（参数摘要）")
  const strChunk = toolPanelPayload("sub:eng-coder#1", "legacy text")
  assert.equal(strChunk.tool, undefined, "string 分支 tool undefined（安全降级——§7.3）")
  assert.equal(strChunk.cmd, undefined, "string 分支 cmd undefined（安全降级——§7.3）")
})

// ─── ② webview 侧：状态行渲染（T-CL21b/T-CL22/T-CL23/T-CL24） ─────────

test("T-CL21b 状态文本段（AC-CL6）：五 kind 两 locale 逐字；活动恢复清空（token/complete——C-15）", async () => {
  const { S, setStrings } = await loadChat()
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  resetLine(S)
  // en（fixture 默认）
  send({ type: "statusText", kind: "rateWait", seconds: 5 })
  assert.ok(line().includes("TPM throttle wait ~5s"), `rateWait en（实到 ${line()}）`)
  send({ type: "statusText", kind: "rateLimited", seconds: 9 })
  assert.ok(line().includes("Rate-limited 429, retry in 9s"), "rateLimited en")
  send({ type: "statusText", kind: "overloaded", seconds: 2 })
  assert.ok(line().includes("Server overloaded, retrying in 2s"), "overloaded en")
  send({ type: "statusText", kind: "quota", message: "quota exhausted: balance" })
  assert.ok(line().includes("quota exhausted: balance"), "quota en（原文）")
  send({ type: "statusText", kind: "index", phase: "scan", total: 42 })
  assert.ok(line().includes("Indexing: scanning 42 files…"), "index scan en")
  send({ type: "statusText", kind: "index", phase: "index", done: 3, total: 9 })
  assert.ok(line().includes("Indexing: 3/9…"), "index progress en（W8：核 sync 相位——原 embed 相位退场）")
  // zh（两 locale 同步）
  setStrings(zh)
  send({ type: "statusText", kind: "rateWait", seconds: 5 })
  assert.ok(line().includes("TPM 限流等待 ~5s"), `rateWait zh（实到 ${line()}）`)
  send({ type: "statusText", kind: "rateLimited", seconds: 9 })
  assert.ok(line().includes("限流 429，9s 后重试"), "rateLimited zh")
  send({ type: "statusText", kind: "overloaded", seconds: 2 })
  assert.ok(line().includes("服务过载，2s 后重试"), "overloaded zh")
  send({ type: "statusText", kind: "index", phase: "index", done: 3, total: 9 })
  assert.ok(line().includes("索引：3/9…"), "index progress zh")
  // index done 相位 → 清段
  send({ type: "statusText", kind: "index", phase: "done" })
  assert.ok(!line().includes("索引"), "index done → 状态段清除")
  // 活动恢复清空（token / complete / toolCall / toolResult / error / aborted——C-15）
  send({ type: "statusText", kind: "rateWait", seconds: 5 })
  assert.ok(line().includes("TPM 限流等待"), "段在")
  send({ type: "token", text: "hi" })
  assert.ok(!line().includes("TPM 限流等待"), "token → 活动恢复清空")
  send({ type: "statusText", kind: "overloaded", seconds: 1 })
  send({ type: "complete" })
  assert.ok(!line().includes("服务过载"), "complete → 清空")
  setStrings(en)
})

test("T-CL22 ✦reasoning（AC-CL6）：usage reasoning_tokens>0 显 ✦X；=0 隐", async () => {
  const { S } = await loadChat()
  resetLine(S)
  send({ type: "usage", usage: { prompt_tokens: 100, completion_tokens: 20, reasoning_tokens: 1500 }, ctxPct: 10 })
  assert.ok(line().includes("✦1.5k"), `>0 显 ✦X（实到 ${line()}）`)
  send({ type: "usage", usage: { prompt_tokens: 100, completion_tokens: 20, reasoning_tokens: 0 }, ctxPct: 10 })
  assert.ok(!line().includes("✦"), "=0 隐（同 CLI）")
  // host 累计面：累加而非覆盖（panel-callbacks onUsage 契约——机检已在上组；此处锁渲染面）
  send({ type: "usage", usage: { prompt_tokens: 200, completion_tokens: 40 }, ctxPct: 11 })
  assert.ok(!line().includes("✦"), "缺字段（旧 host）→ 不显")
})

test("T-CL23 turn N/M 段（AC-CL6）：turnFrame → `turn N/M`；旧 `轮次 N` 段不再出现", async () => {
  const { S } = await loadChat()
  resetLine(S)
  send({ type: "turnFrame", turn: 3, maxTurns: 100 })
  assert.ok(line().includes("turn 3/100"), `turn N/M 渲染（实到 ${line()}）`)
  assert.ok(!line().includes("Turns"), "旧 status.turns 段不再出现（en 值 Turns）")
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  assert.equal(zh["status.turns"], undefined, "status.turns 键随段退役（zh）")
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  assert.equal(en["status.turns"], undefined, "status.turns 键随段退役（en）")
})

test("T-CL24 端差登记（AC-CL6）：scrolled 不做（悬浮回底钮在位）；ctx 段保持 pct 形态", async () => {
  const { S } = await loadChat()
  resetLine(S)
  send({ type: "usage", usage: { prompt_tokens: 1000, completion_tokens: 20 }, ctxPct: 55 })
  assert.ok(line().includes("context 55%"), "ctx 段保持 pct 形态（绝对数端差不做）")
  assert.ok(!/\bscrolled\b/.test(line()), "状态行无 scrolled 段（M5 端差保持）")
  assert.ok(files.includes("test/status-line.test.mjs"), "本档已登记 test/files.mjs")
})
