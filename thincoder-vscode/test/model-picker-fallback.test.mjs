/**
 * model-picker-fallback.test.mjs — MODEL-SELECTION v2 · 范围追加（R10 / M10 / T29 / AC-10）。
 *
 * 用户 2026-09-11 裁定：面板候选未命中（prefs 复合不在运行期拉取清单）**不得静默写会话槽**——
 * webview 兜底分支只回落显示与状态（= 会话槽复合 prefs.model / prefs.provider），
 * 零 selectModel / selectReasoning post（selectModel = 唯一槽写入口；selectReasoning 只写
 * workspaceState）；写槽仅显式点击候选行；命中分支维持现状（同值回写）。
 *
 * 手法（happy-dom——helpers/webview-env.mjs 先例）：setupWebview（happy-dom 注册 + en locale +
 * acquireVsCodeApi 桥桩——capturedPosts）+ installChatFixture 后动态 import 真模块，
 * 直驱 handleModelsMessage（webview/model-picker.js:111 导出）——不引导 chat.js 全量模块图。
 *
 * 2026-09-20 追加 ③（父侧裁定修复轮 #11 · 顾问面 🟡①——批次档 §5 同轮记录）：reasoning 归一
 * 优先**端侧默认档** `effortDefault`（spec `reasoningEffortDefault`——产线载荷同形：
 * `src/extension/provider-probe-window.mjs:67`），未声明才回落 `levels[0]`；两处归一
 * （`selectModel` / `handleModelsMessage`）各一条断言——后者直驱、前者走**真点击流**
 * （`#model-btn` → provider 行 → 飞窗模型行）——因为 ② 兜底面用 LIST（无 effortDefault）
 * 锁的是回落口径，本组锁的才是默认档优先。
 *
 * 2026-09-25 归一链改判（批 `2026-09-25-spec-effort` · 设计 `docs/core/design/MODEL-SPECS.md` §15.4 / 台账 #330 ·
 * `WEBVIEW.md` D-W41 / U-W20 · 用例 E-9）：取值式 = 单源 `effortSelection`（`settings-state.js`）——
 * 无注册默认 ⇒ **中性档 `""`（不显式 effort）**，**不得**回落 `levels[0]`（`levels[0] === "none"` 族会被静默关思考）；
 * 故 ② 的负控判据随之**改判**（原「无 `effortDefault` ⇒ 仍落 `levels[0]`」退场），两渲染点
 * （`:82-88` / `:121-125`）同判据：中性档 ⇒ 按钮「—」+ 无 ✓ + 无 active + 回合侧零 patch（`""` 假值）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv
let capturedPosts

/** 运行期拉取清单（MODEL-SELECTION 后候选不再来自 config 静态字段——本引用即「拉取结果」）。 */
const LIST = [
  { id: "kimi-k3", provider: "kimi", group: "Kimi", reasoning: ["low", "high"] },
  { id: "glm-5.3", provider: "glm", group: "GLM", reasoning: [] },
]

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installChatFixture()
})

after(() => { cleanupEnv() })

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadPicker() {
  const state = await import("../webview/state.js")
  const picker = await import("../webview/model-picker.js")
  return { ctx: state.ctx, handleModelsMessage: picker.handleModelsMessage }
}

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 ctx——每测独立起点）。 */
function resetPicker(ctx) {
  capturedPosts.length = 0
  ctx._models = []
  ctx.selectedModel = ""
  ctx.selectedProvider = ""
  ctx.selectedReasoning = "max"
  ctx.modelBtn.textContent = ""
  ctx.reasoningBtn.textContent = ""
}

/** 槽写相关 post = 本轮断言对象（T29 逐字：selectModel / selectReasoning）。 */
const slotPosts = () => capturedPosts.filter((m) => m.type === "selectModel" || m.type === "selectReasoning")

// ─── ① 未命中不写槽（M10——两态 + 冷启空值 + prefs 缺失/均缺）─────────────────

test("① 未命中（ctx.selectedModel ∈ 清单）——显示与状态回落会话槽复合 + 零 selectModel / selectReasoning post", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  // 切/开会话残留态：当前显示值仍在新清单里（旧守卫 `!ctx._models.find(x => x.id ===
  // ctx.selectedModel)` 下该态不进任何分支——统一口径后由 prefs 未命中接管，回落 prefs 复合）
  ctx.selectedModel = "glm-5.3"; ctx.selectedProvider = "glm"; ctx.modelBtn.textContent = "glm-5.3"
  ctx.reasoningBtn.textContent = "High"
  const prefs = { model: "old-qwen", provider: "qwen", reasoning: "low" }

  handleModelsMessage({ type: "models", models: LIST, prefs })

  assert.deepEqual(slotPosts(), [], "零 selectModel / selectReasoning post——会话槽零写")
  assert.equal(ctx.selectedModel, prefs.model, "状态回落会话槽复合（turn echo 载体——send.js:47）")
  assert.equal(ctx.selectedProvider, prefs.provider, "状态回落会话槽复合（provider）")
  assert.equal(ctx.modelBtn.textContent, prefs.model, "显示回落会话槽复合")
  assert.equal(ctx.selectedReasoning, "max", "不改 selectedReasoning")
  assert.equal(ctx.reasoningBtn.textContent, "High", "reasoning 显示不被兜底分支改写")
  assert.deepEqual(ctx._models, LIST, "候选清单已应用（呈现候选——经菜单）")
})

test("① 未命中（ctx.selectedModel ∉ 清单）——不再取候选首项替换选中（旧兜底退役）", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  ctx.selectedModel = "ghost-model"; ctx.selectedProvider = "ghost"; ctx.modelBtn.textContent = "ghost-model"
  const prefs = { model: "old-qwen", provider: "qwen", reasoning: "low" }

  handleModelsMessage({ type: "models", models: LIST, prefs })

  assert.deepEqual(slotPosts(), [], "零 post——不再以 _models[0] 替换选中并写槽")
  assert.equal(ctx.selectedModel, prefs.model, "回落会话槽复合（== prefs.model）")
  assert.notEqual(ctx.selectedModel, LIST[0].id, "选中未被替换为候选首项")
  assert.equal(ctx.selectedProvider, prefs.provider)
  assert.equal(ctx.modelBtn.textContent, prefs.model)
  assert.equal(ctx.selectedReasoning, "max", "不改 selectedReasoning")
})

test("① 冷启空值（ctx 空 + prefs 未命中）——回落 prefs 复合 + 零 post", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  const prefs = { model: "old-qwen", provider: "qwen", reasoning: "low" }

  handleModelsMessage({ type: "models", models: LIST, prefs })

  assert.deepEqual(slotPosts(), [], "零 post——冷启也不写槽")
  assert.equal(ctx.selectedModel, "old-qwen", "状态回落会话槽复合")
  assert.equal(ctx.selectedProvider, "qwen")
  assert.equal(ctx.modelBtn.textContent, "old-qwen", "显示回落会话槽复合")
})

test("① prefs 缺失（无 model）保持现有显示与状态；prefs 与当前显示均缺 = 空白（零 post）", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  // prefs 缺失（无 model）→ 保持现有显示与状态
  ctx.selectedModel = "glm-5.3"; ctx.selectedProvider = "glm"; ctx.modelBtn.textContent = "glm-5.3"
  handleModelsMessage({ type: "models", models: LIST, prefs: { reasoning: "low" } })
  assert.deepEqual(slotPosts(), [], "零 post")
  assert.equal(ctx.selectedModel, "glm-5.3", "保持现有状态")
  assert.equal(ctx.selectedProvider, "glm")
  assert.equal(ctx.modelBtn.textContent, "glm-5.3", "保持现有显示")

  // prefs 与当前显示均缺 → 保持空白
  resetPicker(ctx)
  handleModelsMessage({ type: "models", models: LIST, prefs: {} })
  assert.deepEqual(slotPosts(), [], "零 post")
  assert.equal(ctx.selectedModel, "", "均缺 = 状态空白")
  assert.equal(ctx.selectedProvider, "")
  assert.equal(ctx.modelBtn.textContent, "", "均缺 = 显示空白")
})

// ─── ② 命中正控（命中分支维持现状——同值回写 + reasoning 归一照旧）────────────

test("② 命中正控——仍 post selectModel（同值回写——发射链路未断）", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  ctx.selectedModel = "stale-model"; ctx.selectedProvider = "stale"; ctx.modelBtn.textContent = "stale-model"
  const prefs = { model: "kimi-k3", provider: "kimi", reasoning: "high" }

  handleModelsMessage({ type: "models", models: LIST, prefs })

  const posts = slotPosts()
  const sel = posts.find((m) => m.type === "selectModel")
  assert.ok(sel, "命中分支仍 post selectModel（同值回写）")
  assert.deepEqual(sel, { type: "selectModel", model: "kimi-k3", provider: "kimi" }, "post 载荷 = prefs 复合")
  assert.ok(posts.some((m) => m.type === "selectReasoning" && m.reasoning === "high"), "reasoning post 照旧")
  assert.equal(ctx.selectedModel, "kimi-k3")
  assert.equal(ctx.selectedProvider, "kimi")
  assert.equal(ctx.modelBtn.textContent, "kimi-k3")
})

test("② 命中分支（同值回写面）——reasoning 归一：无注册默认 ⇒ 中性档（不落 levels[0]，§15.4 改判）", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  const prefs = { model: "kimi-k3", provider: "kimi", reasoning: "ultra" } // "ultra" ∉ levels

  handleModelsMessage({ type: "models", models: LIST, prefs })

  assert.equal(ctx.selectedReasoning, "", "无注册默认 ⇒ 中性档 `\"\"`（旧「回落 levels[0]」判据退场——`levels[0] === \"none\"` 族会被静默关思考）")
  assert.equal(ctx.reasoningBtn.textContent, "—", "按钮文案「—」（非旧式 `t(\"reasoning.none\")`）")
  assert.equal(ctx.reasoningBtn.classList.contains("active"), false, "中性档无 active（`visible !== \"off\"` 对 \"\" 误真——须判否）")
  assert.ok(slotPosts().some((m) => m.type === "selectReasoning" && m.reasoning === ""), "归一结果照旧 post（中性档 = 空值）")
  assert.ok(!slotPosts().some((m) => m.type === "selectReasoning" && m.reasoning === "low"), "不得落 levels[0]")
})

// ─── ③ 归一优先端侧默认档 effortDefault（修复轮 #11 · 🟡①）────────────────────

/** 产线候选行（`provider-probe-window.mjs:67` 同形）：四新 flash 档枚举首项 = "none"
 *  ⇒ 旧归一（取 `levels[0]`）选中即落 `reasoning="none"` = 思考关（登记默认 = "high"）。 */
const EFFORT_LIST = [
  { id: "qwen3.7-flash", provider: "qwen", group: "Qwen", reasoning: ["none", "minimal", "low", "medium", "high", "xhigh"], effortDefault: "high" },
]

test("③ 归一默认档（直驱）：prefs.reasoning 不在新档枚举 ⇒ 落 effortDefault（非枚举首项 none）", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  const prefs = { model: "qwen3.7-flash", provider: "qwen", reasoning: "max" } // 旧模型残留档（"max" ∉ 新档枚举）

  handleModelsMessage({ type: "models", models: EFFORT_LIST, prefs })

  assert.equal(ctx.selectedReasoning, "high", "归一 = 该档端侧默认档 effortDefault（取 levels[0] 即落 none = 思考关）")
  assert.ok(slotPosts().some((m) => m.type === "selectReasoning" && m.reasoning === "high"), "归一结果随 selectReasoning post 上榜")
  assert.ok(!slotPosts().some((m) => m.type === "selectReasoning" && m.reasoning === "none"), "不得落 none")
})

/** 点击流候选（真菜单两段：provider 行 + 飞窗模型行——`model-menu.js:169-271`）。 */
const CLICK_LIST = [
  { id: "kimi-k3", provider: "kimi", group: "Kimi", label: "kimi-k3", reasoning: ["low", "high"] },
  { id: "qwen3.7-flash", provider: "qwen", group: "Qwen", label: "qwen3.7-flash",
    reasoning: ["none", "minimal", "low", "medium", "high", "xhigh"], effortDefault: "high" },
]

test("③ 归一默认档（真点击流）：#model-btn → provider 行 → 飞窗模型行 ⇒ 思考档按钮落 effortDefault（非 off）", async () => {
  const { ctx } = await loadPicker()
  resetPicker(ctx)
  ctx._models = CLICK_LIST
  ctx.selectedModel = "kimi-k3"; ctx.selectedProvider = "kimi"; ctx.modelBtn.textContent = "kimi-k3"
  ctx.selectedReasoning = "max" // 旧模型残留档（"max" ∉ qwen 档枚举 ⇒ 归一必触发）

  ctx.modelBtn.click() // 真绑定（model-picker.js:13 监听）——非直接调 openModelMenu
  const provRows = [...document.querySelectorAll(".mm-panel > .mm-row")]
  const provRow = provRows.find((el) => el.textContent.includes("Qwen"))
  assert.ok(provRow, `菜单 provider 行在位（实读 ${JSON.stringify(provRows.map((r) => r.textContent))}）`)
  provRow.click() // 开飞窗（model-menu.js:269）

  const modelRows = [...document.querySelectorAll(".mm-flyout .mm-row")]
  const row = modelRows.find((el) => el.textContent.includes("qwen3.7-flash"))
  assert.ok(row, `飞窗候选行在位（实读 ${JSON.stringify(modelRows.map((r) => r.textContent))}）`)
  row.click() // pickModel ⇒ onPick ⇒ selectModel（:78）

  assert.equal(ctx.selectedModel, "qwen3.7-flash", "选中已切换（点击流真到达 selectModel）")
  assert.equal(ctx.selectedReasoning, "high", "归一 = effortDefault（非枚举首项 none）")
  assert.ok(slotPosts().some((m) => m.type === "selectModel" && m.model === "qwen3.7-flash"), "槽写 post 在位")
  // 显示面（:88 同式）——旧归一（取 levels[0]="none"）时此处为 "off" = 「选中即关思考」的可见症状
  assert.equal(ctx.reasoningBtn.textContent, "High", "思考档按钮显示 = High（非 off）")
  // 写面契约（既有，非本轮改动）：点击路归一 = 状态/显示面——不补发 selectReasoning
  // （`selectModel` 仍为唯一槽写 :81）；失配的 prefs.reasoning 由下一次 models 消息归一（:125）
  // 后照发（:132）自愈。

  document.querySelectorAll(".mm-overlay").forEach((el) => el.remove()) // 菜单闭合清理（happy-dom 残留归零）
})

// ─── ④ 中性档两径（§15.4 三面映射 · U-W20 —— E-9）────────────────────────────

/** 中性档候选（枚举首项 = "none" ∧ **无** effortDefault——hy3 / doubao 六名形）：
 *  旧式两径都落 `levels[0]` = `"none"` ⇒ 选中即静默关思考。 */
const NEUTRAL_LIST = [
  { id: "hy3", provider: "tokenhub", group: "TokenHub", label: "hy3", reasoning: ["none", "low", "high"] },
]

test("E-9 中性档（直驱径）：无注册默认 ⇒ 按钮「—」+ 无 active + 列表无 ✓ + 回合侧零 patch", async () => {
  const { ctx, handleModelsMessage } = await loadPicker()
  resetPicker(ctx)
  const prefs = { model: "hy3", provider: "tokenhub", reasoning: "max" } // "max" ∉ 枚举

  handleModelsMessage({ type: "models", models: NEUTRAL_LIST, prefs })

  assert.equal(ctx.selectedReasoning, "", "中性档 = `\"\"`（不显式 effort）")
  assert.equal(Boolean(ctx.selectedReasoning), false, "回合侧 `if (reasoning)` 假值 ⇒ 零 patch（`panel-turn-stages.mjs:98`）")
  assert.equal(ctx.reasoningBtn.textContent, "—", "按钮文案「—」（两渲染点同判据）")
  assert.equal(ctx.reasoningBtn.classList.contains("active"), false, "无 active 态")
  ctx.reasoningDropdown.style.display = "none" // 前置：浮层闭合态（toggle 语义：开态首击 = 收起、不重建）
  ctx.reasoningBtn.click() // 真绑定（model-picker.js:33 监听）⇒ buildReasoningDropdown
  assert.deepEqual([...ctx.reasoningDropdown.querySelectorAll(".check")], [], "列表无 ✓（列表本体 = 模型能力档，不新增项）")
  assert.equal(ctx.reasoningDropdown.querySelectorAll(".dropdown-item").length, 3, "列表项 = 枚举三项（中性档不新增列表项）")
})

test("E-9 中性档（真点击流径）：换模型 ⇒ 同判据（按钮「—」/ 状态 `\"\"` / 零 levels[0]）", async () => {
  const { ctx } = await loadPicker()
  resetPicker(ctx)
  ctx._models = NEUTRAL_LIST
  ctx.selectedModel = "kimi-k3"; ctx.selectedProvider = "kimi"; ctx.modelBtn.textContent = "kimi-k3"
  ctx.selectedReasoning = "max" // 旧模型残留档（∉ 新档枚举 ⇒ 归一必触发）

  ctx.modelBtn.click()
  const provRows = [...document.querySelectorAll(".mm-panel > .mm-row")]
  const provRow = provRows.find((el) => el.textContent.includes("TokenHub"))
  assert.ok(provRow, `菜单 provider 行在位（实读 ${JSON.stringify(provRows.map((r) => r.textContent))}）`)
  provRow.click()
  const modelRows = [...document.querySelectorAll(".mm-flyout .mm-row")]
  const row = modelRows.find((el) => el.textContent.includes("hy3"))
  assert.ok(row, `飞窗候选行在位（实读 ${JSON.stringify(modelRows.map((r) => r.textContent))}）`)
  row.click() // pickModel ⇒ onPick ⇒ selectModel

  assert.equal(ctx.selectedModel, "hy3", "选中已切换（点击流真到达 selectModel）")
  assert.equal(ctx.selectedReasoning, "", "换模型径同判据：中性档 `\"\"`（不落 levels[0] = \"none\"）")
  assert.equal(ctx.reasoningBtn.textContent, "—", "按钮「—」")
  assert.equal(ctx.reasoningBtn.classList.contains("active"), false, "无 active")

  document.querySelectorAll(".mm-overlay").forEach((el) => el.remove()) // 菜单闭合清理
})
