/**
 * webview-model-busy-gate.test.mjs — F-W14（回合中改模型不得静默覆盖）机器验收。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §4.2（忙态门 = 禁用派生 · 两处入口守卫 · 与 D-P9
 * 分工；判据 = `S._turnState !== "idle"`——同经 `_turnState` 派生的独立谓词，与 Send / Stop
 * 的 `=== "running"` 差值 = 本门多含 `susp`）；批次档
 * `docs/batches/2026-09-18-vsc-session-wiring.md` §2.3（W14-1…W14-4）。
 *
 * 手法（happy-dom——`webview-turnstate.test.mjs` 模式）：setupWebview + installChatFixture 后
 * 动态 import 真模块，直驱 host 消息对应的 reducer（turnState case → `handleTurnStateMessage`；
 * models case → `handleModelsMessage`）+ 真按钮监听（`model-picker.js` 顶层注册）——不引导
 * chat.js 全量模块图。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv
let capturedPosts

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installChatFixture()
})

after(() => {
  // panels.js 模块顶的 2s 清扫 interval——经其注册的 unload 监听清掉（防 node --test 悬挂）
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const loading = await import("../webview/loading.js")
  const picker = await import("../webview/model-picker.js")
  const panels = await import("../webview/panels.js")
  const i18n = await import("../webview/i18n.js")
  return {
    S: state.S, ctx: state.ctx, t: i18n.t,
    modelSwitchBlocked: loading.modelSwitchBlocked, applyBusyLock: loading.applyBusyLock,
    handleModelsMessage: picker.handleModelsMessage, handleTurnStateMessage: panels.handleTurnStateMessage,
  }
}

/** 运行期拉取清单（候选不与 prefs 命中分支耦合——W14-3 走命中面）。 */
const LIST = [{ id: "kimi-k3", provider: "kimi", group: "Kimi", reasoning: ["low", "high"] }]

const slotPosts = () => capturedPosts.filter((m) => m.type === "selectModel" || m.type === "selectReasoning")
const overlay = () => document.querySelector(".mm-overlay")

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S / ctx——每测独立起点）。 */
function reset({ S, ctx }) {
  S._turnState = "idle"
  capturedPosts.length = 0
  ctx._models = []
  ctx.selectedModel = ""
  ctx.selectedProvider = ""
  ctx.selectedReasoning = ""
  ctx.modelBtn.textContent = ""
  ctx.modelBtn.disabled = false
  ctx.reasoningBtn.textContent = ""
  ctx.reasoningBtn.disabled = false
  ctx.reasoningDropdown.style.display = "none"
  overlay()?.remove()
  ctx.inputEl.placeholder = ""
}

// ─── W14-1 禁用派生 ──────────────────────────────────────────────────────────

test("W14-1 禁用派生（正常）：running / susp ⇒ 两按钮 disabled + aria-disabled；idle ⇒ 复原", async () => {
  const wv = await loadWebview()
  const { ctx, handleTurnStateMessage } = wv
  reset(wv)

  handleTurnStateMessage({ type: "turnState", state: "running" })
  assert.equal(ctx.modelBtn.disabled, true, "running ⇒ 模型按钮禁用")
  assert.equal(ctx.reasoningBtn.disabled, true, "running ⇒ 推理按钮禁用")
  assert.equal(ctx.modelBtn.getAttribute("aria-disabled"), "true", "aria-disabled 同携")

  handleTurnStateMessage({ type: "turnState", state: "susp" })
  assert.equal(ctx.modelBtn.disabled, true, "susp（在飞蒸馏落盘窗）同禁——判据 = 非 idle")
  assert.equal(ctx.reasoningBtn.disabled, true)

  handleTurnStateMessage({ type: "turnState", state: "idle" })
  assert.equal(ctx.modelBtn.disabled, false, "idle ⇒ 复原")
  assert.equal(ctx.reasoningBtn.disabled, false)
  assert.equal(ctx.modelBtn.getAttribute("aria-disabled"), "false")
})

test("W14-1′ 判据谓词单源（正常）：modelSwitchBlocked() = 非 idle（与 Send / Stop 的 running 谓词非同一条）", async () => {
  const wv = await loadWebview()
  const { S, modelSwitchBlocked } = wv
  reset(wv)
  assert.equal(modelSwitchBlocked(), false, "idle ⇒ 不挡")
  S._turnState = "running"
  assert.equal(modelSwitchBlocked(), true)
  S._turnState = "susp"
  assert.equal(modelSwitchBlocked(), true, "susp 同挡（差值所在）")
})

// ─── W14-2 忙态点击零写槽 ────────────────────────────────────────────────────

test("W14-2 忙态点击零写槽（正常）：模型 / 推理按钮点击 ⇒ 零 selectModel / selectReasoning + 浮层不现", async () => {
  const wv = await loadWebview()
  const { ctx, handleTurnStateMessage } = wv
  reset(wv)
  ctx._models = LIST
  handleTurnStateMessage({ type: "turnState", state: "running" })
  capturedPosts.length = 0

  ctx.modelBtn.click()
  const modelMenu = overlay() // 哨兵（推理按钮的 toggle 会连带关模型菜单——须在两次点击间取）
  ctx.reasoningBtn.click()

  assert.deepEqual(slotPosts(), [], "忙态点击零写槽 post")
  assert.ok(modelMenu == null, "模型菜单零开（不留「点了没用」的假 affordance）") // 布尔断言：DOM 节点不入断言载荷
  assert.notEqual(ctx.reasoningDropdown.style.display, "block", "推理浮层零开")
})

test("W14-2′ 进忙态关浮层（正常）：已弹出的两个浮层随忙态到达关闭", async () => {
  const wv = await loadWebview()
  const { ctx, handleTurnStateMessage } = wv
  reset(wv)
  ctx._models = LIST

  ctx.modelBtn.click() // idle：菜单照开
  assert.ok(overlay() != null, "前置：模型菜单已开")
  handleTurnStateMessage({ type: "turnState", state: "running" })
  assert.ok(overlay() == null, "进忙态 ⇒ 模型菜单关闭")

  // 推理浮层单测（其 toggle 会连带关模型菜单 ⇒ 两浮层分测）
  reset(wv)
  ctx.reasoningBtn.click()
  assert.equal(ctx.reasoningDropdown.style.display, "block", "前置：推理浮层已开")
  handleTurnStateMessage({ type: "turnState", state: "running" })
  assert.notEqual(ctx.reasoningDropdown.style.display, "block", "进忙态 ⇒ 推理浮层关闭")
})

// ─── W14-3 忙态 models 回写门 ────────────────────────────────────────────────

test("W14-3 忙态 models 回写门（边界）：零回写 post ∧ 显示仍更新", async () => {
  const wv = await loadWebview()
  const { ctx, t, handleTurnStateMessage, handleModelsMessage } = wv
  reset(wv)
  handleTurnStateMessage({ type: "turnState", state: "running" })
  capturedPosts.length = 0

  handleModelsMessage({ type: "models", models: LIST, prefs: { model: "kimi-k3", provider: "kimi", reasoning: "high" } })

  assert.deepEqual(slotPosts(), [], "忙态零 selectModel / selectReasoning（不携旧快照覆写槽）")
  assert.equal(ctx.modelBtn.textContent, "kimi-k3", "显示仍更新（信息钮语义——屏上读数不冻）")
  assert.equal(ctx.reasoningBtn.textContent, t("reasoning.high"), "推理级显示同刷")
  assert.deepEqual(ctx._models, LIST, "候选清单照收")
})

// ─── W14-4 idle 零回归（回归锚）──────────────────────────────────────────────

test("W14-4 idle 零回归（正常·回归锚）：点击照开浮层 + models 推送照发两 post", async () => {
  const wv = await loadWebview()
  const { ctx, handleTurnStateMessage, handleModelsMessage } = wv
  reset(wv)
  ctx._models = LIST
  handleTurnStateMessage({ type: "turnState", state: "idle" })

  ctx.modelBtn.click()
  assert.ok(overlay() != null, "idle ⇒ 模型菜单照开（忙态门不误伤）")
  ctx.modelBtn.click() // 再点（overlay 外点击面另测——此处只证两态不抛）

  capturedPosts.length = 0
  handleModelsMessage({ type: "models", models: LIST, prefs: { model: "kimi-k3", provider: "kimi", reasoning: "high" } })
  const posts = slotPosts()
  assert.ok(posts.some((m) => m.type === "selectModel" && m.model === "kimi-k3"), "idle ⇒ 同值回写照发（既有语义）")
  assert.ok(posts.some((m) => m.type === "selectReasoning" && m.reasoning === "high"), "reasoning 回写照发")
})
