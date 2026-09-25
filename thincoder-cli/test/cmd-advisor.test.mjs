/**
 * cmd-advisor.test.mjs — `/advisor` Thinking 子菜单档位面（设计 `docs/core/design/MODEL-SPECS.md`
 * §14.7 AC-6 / §14.8 E-3 · 批 2026-09-25-model-specs-cleanup。§15.4-2 / AC-5 生产者面 · 批 2026-09-25-spec-effort）。
 *
 * 断言对象 = `src/tui/cmd-advisor.mjs` 的 `effort_none` 归一（`:130-138`）与共用 off 形 `applyThinkOff`
 * （`:57-72`）：档位 `none` **不是**「强度零」而是关思考 ⇒ 必须删 `reasoningEffort` 键 + 落 off 形 +
 * 回执 `Thinking: OFF`；不归一则残留 `"none"` 被载荷层当强度档送（`:132-133` 注释所指违约）。
 * off 形**按族取形**（§15.4-2 单源）：effort 族（`thinkApi === "effort"`）⇒ `thinking: null`；
 * 其余（type 族默认 / 自定义开值族）⇒ `{type:"disabled"}`（自定义族随 §15.4-2 表改判——批 2026-09-25-off-family-closeout ·
 * 父侧 2026-09-25 裁决，原 `null` 形退场）。
 * 构造手法 = ctx 直驱（同 `cmd-think.test.mjs`）：showPicker 脚本化 + persistRaw 记录落盘快照。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { handleAdvisorCommand } from "../src/tui/cmd-advisor.mjs"
import { specForModel } from "@thincoder/core/config.mjs"
import { thinkOffPath, thinkOffShape } from "@thincoder/core/think-off.mjs"

const BAILIAN = "https://dashscope.aliyuncs.com/compatible-mode/v1"

/** agent 夹具：「思考已开」起点（env 档位在位）——`effort none` 的可达前置态。 */
function fixture(model) {
  return { provider: { model, baseURL: BAILIAN, reasoningEffort: "high" }, activeProvider: "p1", config: {} }
}

/** 脚本化 showPicker + 落盘快照收集（persistRaw 的 mutate 真跑一遍——落盘面即断言的真相面）。
 *  `script` = 数组（按拍取项）或 `(entries, n) => choice` 函数（从**真渲染条目**取——渲染面自证）。 */
function drive(agent, script) {
  const lines = []
  const snaps = []
  const seen = []
  const pickOne = typeof script === "function" ? script : (entries, n) => (n < script.length ? script[n] : null)
  const ctx = {
    agent,
    showPicker: async (title, entries) => { seen.push(entries); return pickOne(entries, seen.length - 1) },
    pushLine: (t) => lines.push(t),
    pushLabel: () => {},
    persistRaw: async (mutate) => {
      const raw = { agent: {} }
      mutate(raw)
      snaps.push(JSON.parse(JSON.stringify(raw.agent.advisor ?? {})))
    },
  }
  return { ctx, lines, snaps, seen }
}

/** 主菜单 → Thinking 子菜单 → 档位动作 → 两次 Esc 退环。 */
const toThinking = (action) => [{ type: "item", action: "thinking" }, { type: "item", action }, null, null]

test("E-3 正常（归一·effort 族）：`effort none` ⇒ off 形 `thinking:null` + 删 `reasoningEffort` + 回执 OFF", async () => {
  const agent = fixture("qwen3.8-flash")
  assert.equal(specForModel("qwen3.8-flash").thinkApi, "effort", "前提——effort 型（档位面含 none 门）")
  const { ctx, lines, snaps } = drive(agent, toThinking("effort_none"))
  await handleAdvisorCommand(ctx)

  const cfg = agent.config.advisor
  assert.equal(cfg.thinking, null, "off 形 = `null`（§15.4-2 族别取形——`{type:\"disabled\"}` 不开载荷层 off 门）")
  assert.equal("reasoningEffort" in cfg, false, "`reasoningEffort` 键删除（残留 none = 载荷层当强度档送 = 红）")
  assert.equal(JSON.stringify(cfg).includes('"none"'), false, "落盘面零 none 字面")
  assert.deepEqual(lines, ["Thinking: OFF"], "回执 = Thinking: OFF（唯一一行）")
  assert.equal(snaps.at(-1)?.reasoningEffort, undefined, "persist 快照：effort 键不在落盘面")
})

test("E-3 正常（off 项 · effort 族）：`think_off` ⇒ `thinking:null` + 清档（生产者面族规则本体）", async () => {
  // effort 族的菜单不渲染 Thinking mode 两行（`buildThinkingEntries` 的 `!isEffortOnly` 门）⇒ 本用例直驱
  // 共用生产者 `applyThinkOff` 的 effort 支（与 `effort_none` 归一径同源）。预置 cfg.reasoningEffort 在场，
  // 断其被清出——族规则本体，不靠调用方先删。
  const agent = fixture("qwen3.8-flash")
  agent.config.advisor = { reasoningEffort: "high" }
  const { ctx } = drive(agent, toThinking("think_off"))
  await handleAdvisorCommand(ctx)

  const cfg = agent.config.advisor
  assert.equal(cfg.thinking, null, "effort 族 off 形 = `null`")
  assert.equal("reasoningEffort" in cfg, false, "显式 off 清档（残留档不得与 off 形同行——载荷层 off 门第四款）")
})

test("E-3 正常（type 族默认）：`think_off` ⇒ off 形 `{type:\"disabled\"}`（族别另一支）", async () => {
  const agent = fixture("deepseek-v4-flash")
  assert.equal(specForModel("deepseek-v4-flash").thinkApi, "type", "前提——type 族（非 effort 族）")
  assert.equal(specForModel("deepseek-v4-flash").thinkEnabledValue, undefined, "前提——非自定义开值族")
  const { ctx, lines } = drive(agent, toThinking("think_off"))
  await handleAdvisorCommand(ctx)

  const cfg = agent.config.advisor
  assert.deepEqual(cfg.thinking, { type: "disabled" }, "type 族默认 off 形 = `{type:\"disabled\"}`（原生关值）")
  assert.equal("reasoningEffort" in cfg, false, "该支不写 effort 键（零变面）")
  assert.deepEqual(lines, ["Thinking: OFF"])
})

test("E-3 正常（置档）：`effort low` ⇒ 落档 + 回执档位（不写 off 形）", async () => {
  const agent = fixture("qwen3.8-flash")
  const { ctx, lines, snaps } = drive(agent, toThinking("effort_low"))
  await handleAdvisorCommand(ctx)

  assert.equal(agent.config.advisor.reasoningEffort, "low", "档位落 cfg")
  assert.equal("thinking" in agent.config.advisor, false, "置档不写 off 形")
  assert.deepEqual(lines, ["Reasoning effort: low"], "回执带档位")
  assert.equal(snaps.at(-1)?.reasoningEffort, "low", "persist 快照：档位落盘")
})

test("E-3 边界（自定义开值族 · 随 §15.4-2 表改判）：MiniMax `adaptive` ⇒ off 形 `{type:\"disabled\"}`（off 可达）", async () => {
  const agent = fixture("minimax-m3")
  assert.equal(specForModel("minimax-m3").thinkEnabledValue, "adaptive", "前提——自定义开值族")
  assert.deepEqual(thinkOffShape(specForModel("minimax-m3")), { type: "disabled" },
    "前提——单源取形（§16.2；父侧 2026-09-25 裁决落位：原 `null` = 不发字段 = off 动作 no-op）")
  // 该族无 enum ⇒ 菜单无 `none` 行（`buildThinkingEntries` 回退 ["high","max"]）——本用例锁的是共用 off 形
  // （`applyThinkOff`）三形契约之一：自定义开值族 ⇒ `{type:"disabled"}`（达载荷层）。
  const { ctx, lines } = drive(agent, toThinking("effort_none"))
  await handleAdvisorCommand(ctx)

  assert.deepEqual(agent.config.advisor.thinking, { type: "disabled" }, "自定义族 off 形 = {type:'disabled'}（实测路径）")
  assert.equal("reasoningEffort" in agent.config.advisor, false, "effort 键同删")
  assert.deepEqual(lines, ["Thinking: OFF"])
})

// ─── 批 2026-09-25-off-family-closeout（设计 MODEL-SPECS.md §16.4 / §16.6-⑵⑶ · 用例 W-6..W-8）──────

test("W-6 边界：`/advisor`（glm-5.3-flashx）思考菜单 ⇒ 无 Disabled 项 ∧ Enabled 在场 ∧ 档位三行在场", async () => {
  const agent = fixture("glm-5.3-flashx")
  assert.equal(thinkOffPath(specForModel("glm-5.3-flashx")), false, "前提——服务端强制族（§16.4 判据 false）")
  const { ctx, seen } = drive(agent, [{ type: "item", action: "thinking" }, null, null])
  await handleAdvisorCommand(ctx)

  const actions = seen[1].filter((e) => e.type === "item").map((e) => e.action)
  assert.equal(actions.includes("think_off"), false, "Disabled 项不渲染（§16.4 门）")
  assert.equal(actions.includes("think_on"), true, "Enabled 项保留（残留标记恢复径）")
  assert.deepEqual(actions.filter((a) => a.startsWith("effort_")), ["effort_low", "effort_high", "effort_max"], "档位三行照旧")
})

test("W-7 边界：`/advisor` 状态行不报 off（两族残留标记 ⇒ `on`）", async () => {
  for (const [model, marker] of [["kimi-k3", null], ["glm-5.3-flashx", { type: "disabled" }]]) {
    assert.equal(thinkOffPath(specForModel(model)), false, `${model}：前提——§16.4 判据 false`)
    const agent = fixture(model)
    agent.config.advisor = { thinking: marker } // 残留标记（无档）
    const { ctx, seen } = drive(agent, [null])
    await handleAdvisorCommand(ctx)

    const head = seen[0]
    assert.equal(head[0].text.includes("Think: off"), false, `${model}：状态行不报 off`)
    assert.equal(head[0].text.includes("Think: on"), true, `${model}：残留标记按「未设档」渲染 ⇒ on`)
    const thinkItem = head.find((e) => e.action === "thinking")
    assert.equal(thinkItem.text.includes("off"), false, `${model}：菜单行同源 slice 亦不报 off`)
  }
})

test("W-8 正常：选档清 `thinking:null` 标记（#346-①）∧ off 动作清档（§16.6-⑵ 三支同清）", async () => {
  // 正向（qwen3.8-flash = effort 族）：先 think_off 落 `thinking:null` 残留标记 ⇒ 再选 `effort_low`
  // （档位项从真渲染条目取；think_off 该族菜单不渲染——直驱共用生产者，同 E-3「off 项 · effort 族」先例）
  const agent = fixture("qwen3.8-flash")
  const { ctx } = drive(agent, (entries, n) => {
    if (n === 0) return entries.find((e) => e.action === "thinking")
    if (n === 1) return { type: "item", action: "think_off" }
    if (n === 2) return entries.find((e) => e.action === "effort_low")
    return null
  })
  await handleAdvisorCommand(ctx)
  const cfg = agent.config.advisor
  assert.equal("thinking" in cfg, false, "选档 = 要思考 ⇒ `null` 标记清除（键删，不落 null）")
  assert.equal(cfg.reasoningEffort, "low", "档位落值")

  // 反向（type 族 deepseek-v4-flash）：off 动作清档——预置档位在场，断其被清出（§16.6-⑵：CLI 侧对齐
  // VSC 写面已定的形——三支同清，原 type 支不清档 ⇒ 「off 标记 + 档位」同盘 = F2 违约族）。
  const agent2 = fixture("deepseek-v4-flash")
  agent2.config.advisor = { reasoningEffort: "high" }
  const { ctx: ctx2 } = drive(agent2, toThinking("think_off"))
  await handleAdvisorCommand(ctx2)
  assert.deepEqual(agent2.config.advisor.thinking, { type: "disabled" }, "type 族 off 形")
  assert.equal("reasoningEffort" in agent2.config.advisor, false, "off ⇒ 档位键清出")
})
