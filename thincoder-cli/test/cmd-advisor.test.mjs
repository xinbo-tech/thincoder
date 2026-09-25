/**
 * cmd-advisor.test.mjs — `/advisor` Thinking 子菜单档位面（设计 `docs/core/design/MODEL-SPECS.md`
 * §14.7 AC-6 / §14.8 E-3 · 批 2026-09-25-model-specs-cleanup。§15.4-2 / AC-5 生产者面 · 批 2026-09-25-spec-effort）。
 *
 * 断言对象 = `src/tui/cmd-advisor.mjs` 的 `effort_none` 归一（`:130-138`）与共用 off 形 `applyThinkOff`
 * （`:57-72`）：档位 `none` **不是**「强度零」而是关思考 ⇒ 必须删 `reasoningEffort` 键 + 落 off 形 +
 * 回执 `Thinking: OFF`；不归一则残留 `"none"` 被载荷层当强度档送（`:132-133` 注释所指违约）。
 * off 形**按族取形**（§15.4-2 单源）：effort 族（`thinkApi === "effort"`）⇒ `thinking: null`；
 * 自定义开值族 ⇒ `null`；其余（type 族默认，如 `deepseek-v4-flash`）⇒ `{type:"disabled"}`。
 * 构造手法 = ctx 直驱（同 `cmd-think.test.mjs`）：showPicker 脚本化 + persistRaw 记录落盘快照。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { handleAdvisorCommand } from "../src/tui/cmd-advisor.mjs"
import { specForModel } from "@thincoder/core/config.mjs"

const BAILIAN = "https://dashscope.aliyuncs.com/compatible-mode/v1"

/** agent 夹具：「思考已开」起点（env 档位在位）——`effort none` 的可达前置态。 */
function fixture(model) {
  return { provider: { model, baseURL: BAILIAN, reasoningEffort: "high" }, activeProvider: "p1", config: {} }
}

/** 脚本化 showPicker + 落盘快照收集（persistRaw 的 mutate 真跑一遍——落盘面即断言的真相面）。 */
function drive(agent, script) {
  const lines = []
  const snaps = []
  let i = 0
  const ctx = {
    agent,
    showPicker: async () => (i < script.length ? script[i++] : null),
    pushLine: (t) => lines.push(t),
    pushLabel: () => {},
    persistRaw: async (mutate) => {
      const raw = { agent: {} }
      mutate(raw)
      snaps.push(JSON.parse(JSON.stringify(raw.agent.advisor ?? {})))
    },
  }
  return { ctx, lines, snaps }
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

test("E-3 边界：自定义开值族（MiniMax `adaptive`）⇒ off 形取 `null`（NF1 显式 off）", async () => {
  const agent = fixture("minimax-m3")
  assert.equal(specForModel("minimax-m3").thinkEnabledValue, "adaptive", "前提——自定义开值族")
  // 该族无 enum ⇒ 菜单无 `none` 行（`buildThinkingEntries` 回退 `["high","max"]`）——本用例锁的是共用 off 形
  // （`applyThinkOff`）的三形契约之一：族自定义 ⇒ `null`；菜单门（菜单 off 项）与 `effort_none` 共用它。
  const { ctx, lines } = drive(agent, toThinking("effort_none"))
  await handleAdvisorCommand(ctx)

  assert.equal(agent.config.advisor.thinking, null, "自定义族 off 形 = null（`{type:\"disabled\"}` 是其原生关值、语义不同）")
  assert.equal("reasoningEffort" in agent.config.advisor, false, "effort 键同删")
  assert.deepEqual(lines, ["Thinking: OFF"])
})
