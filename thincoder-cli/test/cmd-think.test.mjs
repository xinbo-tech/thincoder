/**
 * cmd-think.test.mjs — `/think on` 的默认 effort 档（MODEL-SPECS 批 · 批次档
 * 2026-09-20-qwen-flash-specs §1.8-② / 设计 §2.8 + D-9 ——用例 T-14 / AC A-16）。
 *
 * 断言对象 = src/tui/cmd-think.mjs 的 `applyThink`（本批改具名导出，供注入合成 spec 直驱）：
 * on ⇒ effort 取枚举的**首个非 "none"** 档；枚举全 `"none"` / 无枚举 ⇒ 回退 `"high"`
 * （与无枚举同型）。三态均**不得**写入 `"none"`，且 `thinking` 显式 off 标记必须被清除。
 * 构造手法 = ctx 直驱（同 `cmd-eng.test.mjs`）：agent 为普通对象 + `syncProviderField` 记账 mock。
 *
 * 2026-09-20 追加（父侧裁定修复轮 #11 · 顾问面 🟡②——批次档 §5 同轮记录）：`effort none` 档 =
 * **关思考**（非「强度零」）⇒ `applyThink` 入口归一到 off 路径（effort 型 = `thinking:null`＋删
 * effort；type 型 = `{type:"disabled"}`，取其原生 off 形）；载荷面 = 百炼 qwen 出
 * `enable_thinking:false`（`config.mjs:133-139`）且不发 `reasoning_effort`（`provider/core.mjs:197` 门）。
 *
 * 2026-09-25 追加（MODEL-SPECS 清理批 §14.7 AC-5 / §14.8 E-4——纯补测，`cmd-think.mjs` 码面零改）：
 * 回执面断言——快速径 `:37` 与环内 `:82` 回执、次拍菜单头 `:47-48` 在 `thinking:null`（NF1 显式 off）
 * 下必须报 OFF（`!== null` 守卫缺失 ⇒ effort 型 off 后误报 ON = 红）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { applyThink, handleThinkCommand } from "../src/tui/cmd-think.mjs"
import { specForModel, resolveEnableThinking } from "@thincoder/core/config.mjs"
import { thinkOffPath } from "@thincoder/core/think-off.mjs"

/** 本批四新档（核表独立行——枚举首项即 `"none"` = 旧实现会把思考关掉的那一类）。 */
const NEW_ROWS = ["qwen3.7-flash", "qwen3.8-flash", "qwen3.8-omni-flash", "qwen3.8-27b"]

/** agent 夹具：provider 带显式 off 标记（thinking:null）+ 无 effort ⇒ 走 on 默认档分支。 */
function fixture(model) {
  const calls = []
  const agent = {
    provider: { model, thinking: null },
    activeProvider: "p1",
    config: {},
  }
  const syncProviderField = async (name, field, value) => { calls.push([name, field, value]) }
  return { agent, calls, syncProviderField }
}

/** 从 spec 推出 handleThinkCommand 会传给 applyThink 的三个分叉位（保持与调用面同式）。 */
function face(spec) {
  const thinkOnValue = spec.thinkEnabledValue ?? "enabled"
  return {
    isEffortOnly: spec.thinkApi === "effort",
    isCustomThink: thinkOnValue !== "enabled",
    thinkOnValue,
  }
}

test("T-14 正常：四新档 `/think on` ⇒ 枚举首个非 none 档（minimal）、off 标记清除", async () => {
  for (const model of NEW_ROWS) {
    const spec = specForModel(model)
    assert.equal(spec.thinkApi, "effort", `${model}：前提——effort 型（on 走 reasoning_effort 分支）`)
    assert.equal(spec.reasoningEffortEnum[0], "none", `${model}：前提——枚举首项 = none（取首项即等于关思考）`)
    assert.equal(spec.reasoningEffortEnum.includes("minimal"), true, `${model}：前提——存在非 none 档`)

    const { agent, calls, syncProviderField } = fixture(model)
    const f = face(spec)
    await applyThink({ action: "on" }, agent, syncProviderField, spec, f.isEffortOnly, f.isCustomThink, f.thinkOnValue)

    assert.equal(agent.provider.reasoningEffort, "minimal", `${model}：on ⇒ 首个非 "none" 档`)
    assert.notEqual(agent.provider.reasoningEffort, "none", `${model}：不得写入 "none"`)
    assert.equal("thinking" in agent.provider, false, `${model}：显式 off 标记已清除（delete）`)
    assert.deepEqual(calls, [
      ["p1", "thinking", undefined],
      ["p1", "reasoningEffort", "minimal"],
    ], `${model}：落盘字段与 provider 同步同值`)
  }
})

test("T-14 边界：枚举全 none ⇒ 回退 high（与无枚举同型——不抛错、不留空、不写 none）", async () => {
  const spec = { thinkApi: "effort", reasoningEffortEnum: ["none"] }
  const { agent, calls, syncProviderField } = fixture("qwen3.8-degenerate")
  const f = face(spec)
  await applyThink({ action: "on" }, agent, syncProviderField, spec, f.isEffortOnly, f.isCustomThink, f.thinkOnValue)

  assert.equal(agent.provider.reasoningEffort, "high")
  assert.notEqual(agent.provider.reasoningEffort, "none")
  assert.equal("thinking" in agent.provider, false, "显式 off 标记已清除")
  assert.deepEqual(calls, [["p1", "thinking", undefined], ["p1", "reasoningEffort", "high"]])
})

test("T-14 边界：无枚举 ⇒ 既有 high 回退零变化", async () => {
  const spec = { thinkApi: "effort" }
  const { agent, calls, syncProviderField } = fixture("qwen-nofallback")
  const f = face(spec)
  await applyThink({ action: "on" }, agent, syncProviderField, spec, f.isEffortOnly, f.isCustomThink, f.thinkOnValue)

  assert.equal(agent.provider.reasoningEffort, "high")
  assert.notEqual(agent.provider.reasoningEffort, "none")
  assert.equal("thinking" in agent.provider, false, "显式 off 标记已清除")
  assert.deepEqual(calls, [["p1", "thinking", undefined], ["p1", "reasoningEffort", "high"]])
})

// ─── 追加（修复轮 #11 · 🟡②）：`effort none` = 关思考 ⇒ 归一到 off 路径 ──────────────

/** 百炼 host（`resolveEnableThinking` 白名单门——`config.mjs:116-119`）；model 为裸 ID（无 `/`
 *  前缀 ⇒ `provider/core.mjs:196` 的 isRouter 门不参与，载荷断言面成立）。 */
const BAILIAN = "https://dashscope.aliyuncs.com/compatible-mode/v1"

/** 「思考已开」起点（effort 档在位、无 off 标记）——`effort none` 的可达前置态。 */
function onFixture(model) {
  const calls = []
  const agent = { provider: { model, baseURL: BAILIAN, reasoningEffort: "high" }, activeProvider: "p1", config: {} }
  const syncProviderField = async (name, field, value) => { calls.push([name, field, value]) }
  return { agent, calls, syncProviderField }
}

test("修复轮 #11 正常：四新档 `effort none` ⇒ 关思考（off 标记在位 + 零 effort 残留 + 载荷 enable_thinking:false）", async () => {
  for (const model of NEW_ROWS) {
    const spec = specForModel(model)
    assert.equal(spec.thinkApi, "effort", `${model}：前提——effort 型（档位面可达 none）`)
    assert.equal(spec.reasoningEffortEnum.includes("none"), true, `${model}：前提——枚举含 none`)

    const { agent, calls, syncProviderField } = onFixture(model)
    const f = face(spec)
    await applyThink({ action: "effort", level: "none" }, agent, syncProviderField, spec, f.isEffortOnly, f.isCustomThink, f.thinkOnValue)

    assert.equal(agent.provider.thinking, null, `${model}：none ⇒ 显式 off 标记在位（NF1——与 /think off 同态）`)
    assert.equal("reasoningEffort" in agent.provider, false, `${model}：effort 字段删除（不留 "none"）`)
    assert.equal(agent.provider.reasoningEffort, undefined, `${model}：值面也非 "none"`)
    assert.deepEqual(calls, [["p1", "thinking", null], ["p1", "reasoningEffort", undefined]], `${model}：落盘字段与 provider 同步同值`)
    // 载荷面（🟡② 判据）：显式 off ⇒ enable_thinking:false；零 effort ⇒ reasoning_effort 不发
    assert.equal(resolveEnableThinking(agent.provider, spec), false, `${model}：载荷 enable_thinking:false（provider/core.mjs:209-210）`)
    assert.equal(Boolean(agent.provider.reasoningEffort), false, `${model}：载荷 reasoning_effort 不发（provider/core.mjs:197 门）`)
  }
})

test("修复轮 #11 正常（type 型）：`effort none` ⇒ `{type:\"disabled\"}`（原生 off 形）", async () => {
  const spec = specForModel("glm-5.2")
  assert.equal(spec.thinkApi, "type", "前提——glm-5.2 = type 型（off 形与 effort 族不同）")
  assert.equal(spec.reasoningEffortEnum.includes("none"), true, "前提——枚举含 none")

  const { agent, calls, syncProviderField } = onFixture("glm-5.2")
  const f = face(spec)
  assert.equal(f.isEffortOnly, false, "前提——非 effort 型")
  assert.equal(f.isCustomThink, false, "前提——thinkOnValue = enabled（非 MiniMax 的 adaptive）")
  await applyThink({ action: "effort", level: "none" }, agent, syncProviderField, spec, f.isEffortOnly, f.isCustomThink, f.thinkOnValue)

  assert.deepEqual(agent.provider.thinking, { type: "disabled" }, "type 型 off 形 = {type:'disabled'}（既有 off 路径同形——非 null）")
  assert.equal("reasoningEffort" in agent.provider, false, "effort 字段删除")
  assert.deepEqual(calls, [["p1", "thinking", { type: "disabled" }], ["p1", "reasoningEffort", undefined]])
  assert.equal(resolveEnableThinking(agent.provider, spec), undefined, "非 qwen ⇒ 白名单不命中（enable_thinking 不发——零变更）")
})

test("修复轮 #11 边界：非 none 档零回归（off 标记清除 + effort 落值——入口归一不误伤）", async () => {
  const spec = specForModel("qwen3.8-flash")
  const { agent, calls, syncProviderField } = onFixture("qwen3.8-flash")
  agent.provider.thinking = null // 上一动作 = off ⇒ effort 档须清 off 标记（评审 #1 既有语义）
  const f = face(spec)
  await applyThink({ action: "effort", level: "high" }, agent, syncProviderField, spec, f.isEffortOnly, f.isCustomThink, f.thinkOnValue)

  assert.equal(agent.provider.reasoningEffort, "high", "档位照落")
  assert.equal("thinking" in agent.provider, false, "显式 off 标记被清除")
  assert.deepEqual(calls, [["p1", "thinking", undefined], ["p1", "reasoningEffort", "high"]])
  assert.equal(resolveEnableThinking(agent.provider, spec), true, "载荷 enable_thinking:true（随 reasoning_effort 同行）")
})

// ─── 追加（MODEL-SPECS 清理批 §14.7 AC-5 / §14.8 E-4）：`effort none` 回执面（码面零改——纯补测） ───

/** ctx 直驱夹具：`pick(entries, n)` 收到第 n 拍的真渲染条目、返回选中项（null = Esc）。 */
function thinkCtx(agent, pick) {
  const lines = []
  const seen = []
  const calls = []
  const ctx = {
    agent,
    syncProviderField: async (name, field, value) => { calls.push([name, field, value]) },
    showPicker: async (title, entries) => { seen.push(entries); return pick(entries, seen.length - 1) },
    pushLine: (t) => lines.push(t),
    pushLabel: () => {},
  }
  return { ctx, lines, seen, calls }
}

test("E-4 回归（快速径）：`/think effort none` ⇒ 回执 Thinking: OFF（不比照档位报 none）", async () => {
  const { agent } = onFixture("qwen3.8-flash")
  const { ctx, lines, calls } = thinkCtx(agent, () => null)
  await handleThinkCommand(ctx, ["effort", "none"])

  assert.deepEqual(lines, ["Thinking: OFF"], "回执 = off 文案")
  assert.equal(agent.provider.thinking, null, "off 形落 provider（NF1）")
  assert.equal("reasoningEffort" in agent.provider, false, "零 effort 残留")
  assert.deepEqual(calls, [["p1", "thinking", null], ["p1", "reasoningEffort", undefined]])
})

// ─── 批 2026-09-25-off-family-closeout（设计 `docs/core/design/MODEL-SPECS.md` §16.4 · 用例 W-1..W-4 / AC-2）───
// 回执条件化（本质 = 「不宣称做不到的事」——台账 #334）：无有效 off 路径的族（effort 枚举无 `none` /
// 服务端强制思考族）⇒ 拒 `/think off`（零写盘）· 头与回执恒报 ON · Thinking 开关项不渲染。

/** 无有效 off 路径两族：`kimi-k3`（effort 枚举无 `none`）/ `glm-5.3-flashx`（服务端强制思考族）。 */
const NO_OFF_PATH = ["kimi-k3", "glm-5.3-flashx"]
/** 拒绝文案（§16.4 定形——单行 · `C.error` 通道）。 */
const NO_OFF_MSG = "No off path for this model — thinking cannot be turned off here (use /think effort <level>)"

test("W-1/W-2 错误：`/think off`（两族）⇒ 拒绝行 + 零写盘（不落标记 / 不落档）", async () => {
  for (const model of NO_OFF_PATH) {
    assert.equal(thinkOffPath(specForModel(model)), false, `${model}：前提——§16.4 判据 false`)
    const { agent } = onFixture(model) // 档位「high」在位
    agent.provider.thinking = { type: "disabled" } // 残留 off 标记（拒绝面：两键零改）
    const { ctx, lines, calls, seen } = thinkCtx(agent, () => null)
    await handleThinkCommand(ctx, ["off"])

    assert.deepEqual(lines, [NO_OFF_MSG], `${model}：拒绝行 = §16.4 文案`)
    assert.deepEqual(calls, [], `${model}：零 syncProviderField（不写盘）`)
    assert.equal(agent.provider.reasoningEffort, "high", `${model}：档位键零改`)
    assert.deepEqual(agent.provider.thinking, { type: "disabled" }, `${model}：残留标记零改`)
    assert.deepEqual(seen, [], `${model}：快速径不进菜单`)
  }
})

test("W-3 边界①：`/think` 环（kimi-k3 + 残留 thinking:null）⇒ 头与回执报 ON（不误报 OFF）", async () => {
  const { agent } = fixture("kimi-k3") // thinking: null = 残留 off 标记
  assert.equal(thinkOffPath(specForModel("kimi-k3")), false, "前提——无有效 off 路径")
  const { ctx, seen } = thinkCtx(agent, () => null)
  await handleThinkCommand(ctx, [])
  assert.equal(seen[0][0].text.includes("Thinking: ON"), true, "首拍菜单头报 ON（判据 false ⇒ 恒报 ON）")
  assert.equal(seen[0][0].text.includes("Thinking: OFF"), false, "残留标记不误报 OFF")
  assert.deepEqual(seen[0].filter((e) => e.action === "effort").map((e) => e.level), ["low", "high", "max"], "档位项照旧")

  // 回执行 = 公式锁（该族 UI 本无 off 入口——`!isEffortOnly` 旧门已排除 + 判据 false；防公式回退成
  // 单看的标记式 ⇒ 直驱合成 action 锁「回执条件化」本身）。
  const { agent: agent2 } = fixture("kimi-k3")
  const { ctx: ctx2, lines: lines2 } = thinkCtx(agent2, (entries, n) => (n === 0 ? { type: "item", action: "off" } : null))
  await handleThinkCommand(ctx2, [])
  assert.deepEqual(lines2, ["Thinking: ON"], "回执恒报 ON（残留标记不生效——OFF 会是假断言）")
})

test("W-3 边界②：`/think` 环（glm-5.3-flashx + 残留 {type:\"disabled\"}）⇒ 无 Thinking 开关项 ∧ 头报 ON", async () => {
  const { agent } = fixture("glm-5.3-flashx")
  agent.provider.thinking = { type: "disabled" } // 残留 off 形
  assert.equal(thinkOffPath(specForModel("glm-5.3-flashx")), false, "前提——服务端强制族")
  const { ctx, seen } = thinkCtx(agent, () => null)
  await handleThinkCommand(ctx, [])

  const head = seen[0]
  assert.equal(head[0].text.includes("Thinking: ON"), true, "头报 ON（残留标记不误报 OFF）")
  assert.equal(head.some((e) => e.action === "on" || e.action === "off"), false,
    "无 Thinking 开关项（§16.4 新合门生效面——现行门对非 effort 族本会渲染 = 旧态）")
  assert.deepEqual(head.filter((e) => e.action === "effort").map((e) => e.level), ["low", "high", "max"], "档位项照旧")
})

test("W-4 正常：`/think on`（glm-5.3-flashx，残留 {type:\"disabled\"}）⇒ 写 ON 形覆盖（恢复径可达）", async () => {
  const { agent } = fixture("glm-5.3-flashx")
  agent.provider.thinking = { type: "disabled" }
  const { ctx, lines, calls } = thinkCtx(agent, () => null)
  await handleThinkCommand(ctx, ["on"])

  assert.deepEqual(agent.provider.thinking, { type: "enabled" }, "on 形覆盖残留 off 标记（恢复径）")
  assert.deepEqual(calls, [["p1", "thinking", { type: "enabled" }], ["p1", "reasoningEffort", "high"]], "落盘：on 形 + 默认档")
  assert.deepEqual(lines, ["Thinking: on"], "回执 = 快速径既有文案（`Thinking: ${sub}`；大小写即现有形，零改）")
})

test("E-4 回归（环内）：effort none ⇒ 回执 OFF ∧ 次拍菜单头 Thinking: OFF（守卫缺失即误报 ON = 红）", async () => {
  const { agent } = onFixture("qwen3.8-flash")
  // 选项从首拍真渲染条目里取（none 门的真实性 = 渲染面自证，非合成 action）。
  const { ctx, lines, seen, calls } = thinkCtx(agent, (entries, n) =>
    n === 0 ? entries.find((e) => e.action === "effort" && e.level === "none") : null)
  await handleThinkCommand(ctx, [])

  assert.deepEqual(lines, ["Thinking: OFF"], "环内 none 档回执 = off 文案（:82）")
  assert.equal(agent.provider.thinking, null, "off 形落 provider")
  assert.equal("reasoningEffort" in agent.provider, false, "零 effort 残留（残留会被载荷层当强度档送）")
  assert.deepEqual(calls, [["p1", "thinking", null], ["p1", "reasoningEffort", undefined]])
  assert.equal(seen[1][0].text.includes("Thinking: OFF"), true, "次拍菜单头随状态报 OFF（:47-48）")
  assert.equal(seen[1][0].text.includes("Thinking: ON"), false, "守卫缺失时此处误报 ON ⇒ 红")
})
