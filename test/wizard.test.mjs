/**
 * wizard.mjs tests — first-launch config wizard 流程。
 * T-C3/T-C4（TUI.md §10.6D D-C2）：Custom 分支含 API format 步（默认 openai 直过、
 * anthropic/google 落盘）；preset 路径不受影响（无 format 步）；Esc（cancelWizard）无半配置。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { createWizard } from "../src/tui/wizard.mjs"

function wizardCtx(overrides = {}) {
  const agent = {
    providers: [], activeProvider: "", activeModel: null, provider: {},
    config: { agent: { compactThresholdAuto: false } },
  }
  const state = { wizard: null, input: [], cursor: 0 }
  const lines = []
  const saved = { count: 0 }
  const ctx = {
    agent, state,
    pushLine: (t) => lines.push(t),
    pushLabel: (t) => lines.push(t),
    render: () => {},
    persistRaw: async (mutate) => { saved.count++; saved.raw = {}; mutate(saved.raw) },
    openModelPicker: async () => {},
    ...overrides,
  }
  return { ctx, agent, state, lines, saved }
}

/** wizard 文本步：state.input 喂入 + wizardSubmitText（同步推进 step）。 */
function submit(state, w, text) {
  state.input = [...text]
  w.wizardSubmitText()
}

/** 走完 Custom 前半段（name/baseURL/model）→ 停在 format 步。 */
function walkToFormat(state, w) {
  w.startWizard()
  w.wizardChooseProvider({ kind: "custom" })
  submit(state, w, "my-custom")
  assert.equal(state.wizard.step, "baseURL")
  submit(state, w, "https://api.example.com/v1")
  assert.equal(state.wizard.step, "model")
  submit(state, w, "custom-model")
  assert.equal(state.wizard.step, "format")
  return state.wizard
}

test("T-C3 wizard Custom 流程含 format 步（endpoint 后 key 前——空 Enter = 默认 openai 直过）", () => {
  const { ctx, agent, state, saved } = wizardCtx()
  const w = createWizard(ctx)
  walkToFormat(state, w)
  assert.ok(state.wizard.lines.some((l) => l.text.includes("API format")), "format 步提示渲染")
  assert.ok(state.wizard.lines.some((l) => l.text.includes("openai")), "提示含枚举")
  submit(state, w, "") // 空输入 = openai 默认（同 D-C1 index=0——Enter 直过）
  assert.equal(state.wizard.step, "key", "format 后进 key（endpoint 后、key 前）")
  assert.equal(state.wizard.fields.format, "openai", "空输入归一为 openai")
  submit(state, w, "sk-1")
  assert.equal(state.wizard.step, "embedkey")
  submit(state, w, "")
  assert.equal(state.wizard, null, "finish——向导关闭")
  assert.equal(agent.providers.length, 1)
  assert.equal(agent.providers[0].format, undefined, "openai = 默认省略（与 D-C1 picker 同构）")
  assert.equal(saved.raw.providers[0].format, undefined, "落盘无 format")
})

test("wizard Custom format 步：选 anthropic 生效落盘（两入口行为一致——D-C2）", () => {
  const { ctx, agent, state, saved } = wizardCtx()
  const w = createWizard(ctx)
  walkToFormat(state, w)
  submit(state, w, "anthropic")
  assert.equal(state.wizard.fields.format, "anthropic")
  assert.equal(state.wizard.step, "key")
  submit(state, w, "sk-an")
  submit(state, w, "")
  assert.equal(agent.providers[0].format, "anthropic", "finish 落盘 format")
  assert.equal(saved.raw.providers[0].format, "anthropic")
})

test("wizard Custom format 步：非法输入报错不前进（validate 守卫）", () => {
  const { ctx, state } = wizardCtx()
  const w = createWizard(ctx)
  walkToFormat(state, w)
  submit(state, w, "foo")
  assert.equal(state.wizard.step, "format", "非法格式停留在本步")
  assert.ok(state.wizard.error?.includes("openai, anthropic, google"), `错误提示: ${state.wizard.error}`)
})

test("wizard format 步 Esc = 沿用 wizard 跳过语义（cancelWizard——无半配置落盘）", () => {
  const { ctx, agent, state, lines, saved } = wizardCtx()
  const w = createWizard(ctx)
  walkToFormat(state, w)
  w.cancelWizard() // key-handler 对任意 wizard 步 Esc 都走 cancelWizard
  assert.equal(state.wizard, null, "向导取消")
  assert.equal(agent.providers.length, 0, "无半配置")
  assert.equal(saved.count, 0, "persistRaw 未调用")
  assert.ok(lines.some((l) => l.includes("Skipped initial setup")), "跳过提示")
})

test("T-C4 wizard preset 路径不受影响（无 format 步——直接 key）", () => {
  const { ctx, agent, state, saved } = wizardCtx()
  const w = createWizard(ctx)
  w.startWizard()
  w.wizardChooseProvider({ kind: "preset", name: "openai", baseURL: "https://api.openai.com/v1", model: "gpt-4o" })
  assert.equal(state.wizard.step, "key", "preset 跳过 name/baseURL/model/format——直接 key")
  assert.equal(state.wizard.fields.format, undefined, "fields 无 format")
  submit(state, w, "sk-p")
  assert.equal(state.wizard.step, "embedkey")
  submit(state, w, "")
  assert.equal(agent.providers[0].name, "openai")
  assert.equal(agent.providers[0].format, undefined, "preset 路径无 format 步（T-C4）")
  assert.equal(saved.raw.providers[0].format, undefined)
})

test("wizard preset 带扩展字段（claude：format=anthropic/maxTokens/thinking）直达落盘——与 pickers preset 路径同构（code review 🟡）", () => {
  const { ctx, agent, state, saved } = wizardCtx()
  const w = createWizard(ctx)
  w.startWizard()
  w.wizardChooseProvider({
    kind: "preset", name: "claude", baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-4",
    desc: "Claude (Anthropic)", format: "anthropic", maxTokens: 8192, thinking: { type: "enabled" },
  })
  assert.equal(state.wizard.step, "key", "preset 仍无 format 提问步（T-C4 不受影响）")
  assert.equal(state.wizard.fields.format, "anthropic", "preset 声明的 format 带进 fields")
  submit(state, w, "sk-claude")
  submit(state, w, "")
  assert.equal(agent.providers[0].format, "anthropic", "落盘不丢 format——wizard 不再静默错配（claude 按 anthropic 格式请求）")
  assert.equal(agent.providers[0].maxTokens, 8192)
  assert.deepEqual(agent.providers[0].thinking, { type: "enabled" })
  assert.equal(saved.raw.providers[0].format, "anthropic")
})
