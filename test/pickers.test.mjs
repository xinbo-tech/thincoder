/**
 * pickers.mjs tests — picker 栈 / showPicker 互斥 / 过滤 / defaultIndex / 异步更新选中恢复。
 * Mock ctx 与 tui.test.mjs / slash-commands.test.mjs 同风格。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { createPickers } from "../src/tui/pickers.mjs"

/** Minimal ctx mock: picker 只需要 state/render/ansi/C 等少数字段。 */
function pickersCtx(overrides = {}) {
  const state = {}
  const lines = []
  const ctx = {
    agent: { providers: [], activeProvider: "", provider: {}, config: {} },
    state,
    render: () => {},
    ansi: { bold: "" },
    C: { tool: "", text: "", dim: "", error: "" },
    pushLine: (t) => lines.push(t),
    pushLabel: (t) => lines.push(t),
    persistRaw: async () => {},
    askQuestion: async () => "",
    maskKey: () => "***",
    ...overrides,
  }
  return { ctx, state, lines }
}

const ENTRIES = [
  { type: "header", text: "Group" },
  { type: "item", text: "alpha" },
  { type: "item", text: "Beta" },
  { type: "item", text: "gamma" },
]

// ====================================================================
// showPicker / popPicker / closePicker 栈语义
// ====================================================================

test("showPicker: 入栈并暴露 filteredItems，Enter(popPicker) resolve 选中项", async () => {
  const { ctx, state } = pickersCtx()
  const { showPicker, popPicker } = createPickers(ctx)
  const p = showPicker("T", ENTRIES)
  assert.equal(state.picker.title, "T")
  assert.equal(state.pickerStack.length, 1)
  assert.deepEqual(state.picker.filteredItems.map((e) => e.text), ["alpha", "Beta", "gamma"])
  popPicker(state.picker.filteredItems[1])
  assert.equal((await p).text, "Beta")
  assert.equal(state.picker, null)
  assert.equal(state.pickerStack.length, 0)
})

test("showPicker 互斥: 栈非空时再次调用，前一个 Promise resolve(null)", async () => {
  const { ctx, state } = pickersCtx()
  const { showPicker, closePicker } = createPickers(ctx)
  const p1 = showPicker("first", ENTRIES)
  const p2 = showPicker("second", ENTRIES)
  assert.equal(await p1, null, "被顶替的 picker resolve(null)，无 Promise 悬挂")
  assert.equal(state.picker.title, "second")
  assert.equal(state.pickerStack.length, 1)
  closePicker()
  assert.equal(await p2, null)
})

test("closePicker: 清空栈，所有挂起者 resolve(null)", async () => {
  const { ctx, state } = pickersCtx()
  const { showPicker, closePicker } = createPickers(ctx)
  const p1 = showPicker("A", ENTRIES)
  const p2 = showPicker("B", ENTRIES) // p1 已被互斥 resolve(null)
  closePicker()
  assert.equal(await p1, null)
  assert.equal(await p2, null)
  assert.equal(state.picker, null)
  assert.equal(state.pickerStack.length, 0)
})

test("popPicker: resolve 栈顶并恢复下层（两层嵌套）", async () => {
  const { ctx, state } = pickersCtx()
  const { showPicker, popPicker } = createPickers(ctx)
  const outer = showPicker("outer", ENTRIES)
  const outerPicker = state.picker
  // 手工压入第二层（showPicker 有互斥，嵌套层只能由内部流程直接压栈）
  let innerResolve
  const inner = new Promise((r) => { innerResolve = r })
  state.pickerStack.push({ title: "inner", entries: ENTRIES, lines: [], index: 0, scroll: 0, selectedLine: 0, filter: "", resolve: innerResolve })
  state.picker = state.pickerStack.at(-1)
  assert.equal(state.picker.title, "inner")

  popPicker(ENTRIES[3])
  assert.equal((await inner).text, "gamma")
  assert.equal(state.picker, outerPicker, "pop 后 state.picker 恢复指向下层")

  popPicker(null)
  assert.equal(await outer, null)
  assert.equal(state.picker, null)
})

// ====================================================================
// defaultIndex clamp
// ====================================================================

test("showPicker: defaultIndex clamp 到 item 范围", async () => {
  const { ctx, state } = pickersCtx()
  const { showPicker, closePicker } = createPickers(ctx)
  showPicker("A", ENTRIES, { defaultIndex: 99 })
  assert.equal(state.picker.index, 2)
  closePicker()
  showPicker("B", ENTRIES, { defaultIndex: -5 })
  assert.equal(state.picker.index, 0)
  closePicker()
  showPicker("C", ENTRIES, { defaultIndex: 1 })
  assert.equal(state.picker.index, 1)
  closePicker()
})

// ====================================================================
// rebuildLines 过滤
// ====================================================================

test("rebuildLines: 子串大小写不敏感过滤，header 恒显示，filter 后 index clamp", () => {
  const { ctx, state } = pickersCtx()
  const { showPicker, renderPickerLines } = createPickers(ctx)
  showPicker("T", ENTRIES)
  const p = state.picker
  p.index = 2
  p.filter = "BET" // 大写 filter 匹配 "Beta"
  renderPickerLines()
  assert.deepEqual(p.filteredItems.map((e) => e.text), ["Beta"])
  assert.equal(p.index, 0, "index clamp 到过滤后范围")
  assert.ok(p.lines.some((l) => l.text.includes("Group")), "header 恒显示")
  assert.ok(!p.lines.some((l) => l.text.includes("alpha")))
})

test("rebuildLines: 无匹配显示 (no match)", () => {
  const { ctx, state } = pickersCtx()
  const { showPicker, renderPickerLines } = createPickers(ctx)
  showPicker("T", ENTRIES)
  state.picker.filter = "zzz"
  renderPickerLines()
  assert.equal(state.picker.filteredItems.length, 0)
  assert.ok(state.picker.lines.some((l) => l.text.includes("(no match)")))
})

// ====================================================================
// /model 异步更新：按 entry 标识恢复选中
// ====================================================================

test("openModelPicker: 两级 picker — Level 1 显示 provider 列表", async () => {
  const agent = {
    providers: [
      { name: "p1", baseURL: "http://example.com/v1", model: "m1", apiKey: "k" },
      { name: "active", baseURL: "http://example.com/v1", model: "m1", apiKey: "k" },
    ],
    activeProvider: "active",
    activeModel: null,
    provider: { model: "m1" },
    config: {},
  }
  const { ctx, state } = pickersCtx({ agent })
  const { openModelPicker, popPicker } = createPickers(ctx)

  const flow = openModelPicker() // 不 await：它停在 showPicker 上等用户选择
  try {
    // 等 picker 渲染
    await new Promise((r) => setTimeout(r, 50))

    const items = state.picker?.filteredItems ?? []
    // Level 1: 2 providers + 4 management items (add/remove/key/context — PROVIDER.md §15 D-C4)
    assert.equal(items.length, 6, "Level 1 应有 2 个 provider + 4 个 management 项")

    // 验证 provider 项
    const providerItems = items.filter((i) => i.action === "open-models")
    assert.equal(providerItems.length, 2)
    assert.equal(providerItems[0].provider, "p1")
    assert.equal(providerItems[1].provider, "active")

    // 验证 management 项
    const managementItems = items.filter((i) => ["add", "remove", "key", "context"].includes(i.action))
    assert.equal(managementItems.length, 4)

    popPicker(null) // Esc 退出菜单循环
    await flow
  } catch (e) {
    popPicker(null)
    await flow.catch(() => {})
    throw e
  }
})

// ====================================================================
// T-C1..C5（TUI.md §10.6D）——Add Provider Custom 的 API format 走 picker（无手输）
// ====================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 驱动 openModelPicker → Add provider → Custom → 直到 format picker 打开（askQuestion 喂
 *  name/baseURL/model）。返回 { flow, state }——调用方继续 popPicker 选择 format。 */
async function driveToFormatPicker(ctx, state, values) {
  const { openModelPicker, popPicker } = createPickers(ctx)
  const flow = openModelPicker()
  await sleep(20)
  popPicker(state.picker.filteredItems.find((i) => i.action === "add"))
  await sleep(20)
  popPicker(state.picker.filteredItems.find((i) => i.kind === "custom"))
  await sleep(30) // 三个连续 askQuestion await
  return { flow, popPicker, state }
}

test("T-C1 Add Provider Custom：API format 为 picker（默认 index=0 openai——Enter 直过；落盘无 format 字段）", async () => {
  const queue = ["my-prov", "https://api.example.com/v1", "model-x", ""]
  const saved = {}
  const agent = { providers: [], activeProvider: "", provider: {}, config: {} }
  const { ctx, state } = pickersCtx({
    agent,
    askQuestion: async () => queue.shift() ?? "",
    persistRaw: async (mutate) => { saved.raw = {}; mutate(saved.raw) },
  })
  const { flow, popPicker } = await driveToFormatPicker(ctx, state, queue)
  try {
    assert.equal(state.picker.title, "API format")
    assert.deepEqual(state.picker.filteredItems.map((i) => i.name), ["openai", "anthropic", "google"], "枚举三项（无手输自由文本）")
    assert.equal(state.picker.index, 0, "默认 index=0 openai")
    popPicker(state.picker.filteredItems[0]) // openai → key 问询（queue 空 → 跳过）
    await sleep(20)
    popPicker(null) // 主菜单重开 → Esc 退出循环
    await flow
    assert.equal(agent.providers.length, 1)
    assert.equal(agent.providers[0].name, "my-prov")
    assert.equal(agent.providers[0].format, undefined, "openai = 默认省略（无 format 字段——与旧手输语义一致）")
    assert.equal(saved.raw.providers[0].format, undefined, "落盘无 format")
    assert.equal(state.picker, null, "流程结束 picker 关闭")
  } catch (e) {
    popPicker(null)
    await flow.catch(() => {})
    throw e
  }
})

test("T-C2 Add Provider Custom：format picker Esc = 中止整个流程——无半配置落盘", async () => {
  const queue = ["half-prov", "https://api.example.com/v1", "model-x"]
  let persisted = 0
  const agent = { providers: [], activeProvider: "", provider: {}, config: {} }
  const { ctx, state } = pickersCtx({
    agent,
    askQuestion: async () => queue.shift() ?? "",
    persistRaw: async () => { persisted++ },
  })
  const { flow, popPicker } = await driveToFormatPicker(ctx, state, queue)
  try {
    assert.equal(state.picker.title, "API format")
    popPicker(null) // Esc → 中止 Add Provider（不落盘）→ 回主菜单循环
    await sleep(20)
    assert.equal(agent.providers.length, 0, "无半配置（name/baseURL/model 已问但未落盘）")
    assert.equal(persisted, 0, "persistRaw 未被调用")
    assert.equal(state.picker.title, "Models & Providers", "中止后回主菜单")
    popPicker(null) // 退出主菜单
    await flow
    assert.equal(state.picker, null)
  } catch (e) {
    popPicker(null)
    await flow.catch(() => {})
    throw e
  }
})

test("T-C5 Add Provider Custom：选 anthropic 生效落盘（cfg.format = anthropic）", async () => {
  const queue = ["my-anthropic", "https://api.anthropic.example/v1", "claude-x", "sk-key"]
  const saved = {}
  const agent = { providers: [], activeProvider: "", provider: {}, config: {} }
  const { ctx, state } = pickersCtx({
    agent,
    askQuestion: async () => queue.shift() ?? "",
    persistRaw: async (mutate) => { saved.raw = {}; mutate(saved.raw) },
  })
  const { flow, popPicker } = await driveToFormatPicker(ctx, state, queue)
  try {
    assert.equal(state.picker.title, "API format")
    popPicker(state.picker.filteredItems[1]) // anthropic
    await sleep(20)
    popPicker(null) // key 已喂 sk-key → 主菜单重开 → Esc 退出
    await flow
    assert.equal(agent.providers[0].format, "anthropic", "内存 providers[].format 写入")
    assert.equal(saved.raw.providers[0].format, "anthropic", "persistRaw 落盘 format")
    assert.equal(agent.providers[0].apiKey, "sk-key", "key 继续照常问询落盘")
  } catch (e) {
    popPicker(null)
    await flow.catch(() => {})
    throw e
  }
})

