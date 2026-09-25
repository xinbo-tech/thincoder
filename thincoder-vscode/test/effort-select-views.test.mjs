/**
 * effort-select-views.test.mjs — 批 2026-09-25-model-specs-cleanup（设计 `docs/core/design/MODEL-SPECS.md`
 * §14 · §14.8 用例 E-5 / §14.10 两径同源 / AC-3 + AC-6 VSC 侧）。
 *
 * 判据（思考档下拉：consult 行 `.consult-effort` + advisor `#adv-effort`）：
 *   ① 未注册默认档 ⇒ 「—」selected——**不是**枚举首项（四新档首项 = `none` ⇒ 会静默预设关思考）；
 *   ② 已存值优先 > 注册默认（须 ∈ 枚举）> 「—」；③ 选 `none` / 「—」/ 空 ⇒ 落盘 null（删键不写字面）；
 *   ④ 空枚举 ⇒ 零渲染（`view = null`；真模型实例 = `kimi-for-coding-highspeed`——无 effort 块）。
 *
 * 两径同源（§14.10）：径① 初渲染 = `settings-agent.js` 内联串；径② 换模型重建 =
 * `settings-widgets.js buildEffortSelect`（`settings-models.js:149/:157` 两重建位同用它）。载荷两点 =
 * consult `settings-models.js collectConsultRows` + advisor `settings-agent.js bindAgentControls`（真 change ⇒ postMessage）。
 * 设计指派载体 `test/image-downgrade.test.mjs`（+~22 行）余量不足 ⇒ 拆本档（§14.6「超即拆新档，勿挤写」）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview } from "./helpers/webview-env.mjs"

let cleanupEnv
let capturedPosts
let M // 被测模块集

/** 清单条目（产线载荷同形：`reasoning` 枚举 + `effortDefault`——`src/extension/provider-probe-window.mjs:67`）。 */
const MODELS = [
  { id: "m-bare", reasoning: ["none", "low", "high"] },                       // 未注册默认档
  { id: "m-def", reasoning: ["none", "low", "high"], effortDefault: "high" }, // 注册默认 ∈ 枚举
  { id: "m-def-out", reasoning: ["low"], effortDefault: "max" },              // 注册默认 ∉ 枚举（继承形）
  { id: "m-empty", reasoning: [] },                                           // 空枚举（真例 highspeed 形）
]

/** 下拉读数 = { levels, selected }；无控件 ⇒ null（零渲染）。 */
function view(sel) {
  if (!sel) return null
  const opts = Array.from(sel.options)
  return { levels: opts.map((o) => o.value), selected: opts.find((o) => o.hasAttribute("selected"))?.value ?? null }
}

/** 径① 初渲染：内联串 → 真 HTML 解析 ⇒ [consult 行, advisor]。 */
function initSelects(model, current) {
  M.SS.agentSettings = { consultModels: [{ provider: "p", model, effort: current }], advisor: { model, effort: current } }
  document.body.innerHTML = ""
  const d = document.createElement("div")
  d.innerHTML = M.consultAdvisorCardHtml()
  return [view(d.querySelector(".consult-effort")), view(d.querySelector("#adv-effort"))]
}

/** 三视图同判据：[径① consult, 径① advisor, 径② 重建]。 */
function bothPaths(model, current) {
  return [...initSelects(model, current), view(M.buildEffortSelect({ model, current }))]
}

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  const state = await import("../webview/settings-state.js")
  M = {
    SS: state.SS,
    consultAdvisorCardHtml: (await import("../webview/settings-agent.js")).consultAdvisorCardHtml,
    agentCardHtml: (await import("../webview/settings-agent.js")).agentCardHtml,
    bindAgentControls: (await import("../webview/settings-agent.js")).bindAgentControls,
    readConsultRowsFromDom: (await import("../webview/settings-models.js")).readConsultRowsFromDom,
    collectConsultRows: (await import("../webview/settings-models.js")).collectConsultRows,
    buildEffortSelect: (await import("../webview/settings-widgets.js")).buildEffortSelect,
  }
  M.SS.getModels = () => MODELS
})

after(() => cleanupEnv())

test("E-5 两径：未注册 ⇒ 「—」selected（非枚举首项）/ 注册默认∈枚举 ⇒ 预选 / ∉枚举 ⇒ 「—」/ 空枚举 ⇒ 零渲染", () => {
  const LEVELS = ["—", "none", "low", "high"]
  assert.deepEqual(bothPaths("m-bare", null), Array(3).fill({ levels: LEVELS, selected: "—" }),
    "未注册默认档 ⇒ 「—」（枚举首项 none = 关思考，不得回落——AC-3）")
  assert.deepEqual(bothPaths("m-def", null), Array(3).fill({ levels: LEVELS, selected: "high" }),
    "注册默认 ∈ 枚举 ⇒ 预选 high（「—」恒首项，档序不变）")
  assert.deepEqual(bothPaths("m-def-out", null), Array(3).fill({ levels: ["—", "low"], selected: "—" }),
    "注册默认 ∉ 枚举 ⇒ 回落「—」（两前置都不成立）")
  assert.deepEqual(bothPaths("m-empty", null), [null, null, null],
    "空枚举 ⇒ 零渲染（view = null——真例 kimi-for-coding-highspeed 无 effort 块）")
})

test("E-5 两径：已存值优先注册默认；载荷「—」/ none / 空 ⇒ null（删键不写字面）", () => {
  assert.deepEqual(bothPaths("m-def", "low"), Array(3).fill({ levels: ["—", "none", "low", "high"], selected: "low" }),
    "已存值优先于注册默认（重开面板不丢用户档）")
  // ── 载荷点一：consult（`settings-models.js collectConsultRows`）——真 DOM 三行 ⇒ 归一 ──
  document.body.innerHTML = `<div id="consult-rows">${["none", "—", "low"].map((v) =>
    `<div class="consult-row" data-provider="p" data-model="m"><select class="consult-effort"><option value="${v}" selected>${v}</option></select></div>`).join("")}</div>`
  assert.deepEqual(M.readConsultRowsFromDom().map((r) => r.effort), ["none", "—", "low"], "读取面保持原始值（行重建原样回灌）")
  assert.deepEqual(M.collectConsultRows().map((r) => r.effort), [null, null, "low"], "落盘面：none/「—」⇒ null（不写字面），真档原样")
  // ── 载荷点二：advisor（`settings-agent.js bindAgentControls`）——真建面 ⇒ 真 change ⇒ postMessage ──
  M.SS.agentSettings = { consultModels: [], advisor: { model: "m-def" } }
  document.body.innerHTML = M.agentCardHtml() + M.consultAdvisorCardHtml()
  M.bindAgentControls()
  const sel = document.getElementById("adv-effort")
  const save = (v) => {
    sel.value = v
    sel.dispatchEvent(new window.Event("change"))
    const msg = capturedPosts.at(-1)
    assert.equal(msg.type, "saveAgentSettings", "change ⇒ 落盘消息")
    return msg.settings
  }
  assert.equal(save("—").advisor.effort, null, "advisor「—」⇒ 落盘 null（删键不写字面占位）")
  assert.equal(save("none").advisor.effort, null, "advisor none ⇒ 落盘 null（= 关思考）")
  assert.equal(save("low").advisor.effort, "low", "advisor 真档原样落盘")
})
