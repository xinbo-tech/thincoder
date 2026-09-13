/**
 * attention-state.test.mjs — 第 33 批（用户介入提醒——attention 态）用例表 1:1 落地：
 * T-AT1–T-AT7（设计档 §14.7）。断言判据全文 = `docs/design/TUI.md` §14
 * （§14.3 逐字契约 / §14.5 D-AT1–D-AT8 / §14.8 AC-AT1–AC-AT6）。
 * 手法：纯函数 + `renderStatus` 直调 + `createKeyHandler` 桩 ctx 直驱（无真实 TTY）；微秒级。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { attentionKind, renderStatus } from "../src/tui/render-frame.mjs"
import { userNeededAtTurnEnd } from "../src/tui/agent-turn.mjs"
import { createKeyHandler, clearAttention } from "../src/tui/key-handler.mjs"
import { stringWidth } from "../src/tui/render.mjs"

const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")
const ATT_SEQ = "\x1b[43m"

/** 最小状态（statusLine 所需字段 + attention 派生字段）。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
    processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    permission: null, question: null, picker: null, wizard: null, search: null, interruptPrompt: null,
    suspended: false, _suspPending: false, attentionAwaiting: false,
    ...over,
  }
}
const agentStub = (over = {}) => ({
  provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0,
  ...over,
})

// ─── T-AT1：派生矩阵（纯函数）────────────────────────────────────────────────

test("T-AT1 attentionKind 矩阵：blocked（审批 / 提问）/ awaiting（条件齐备）/ permission+processing 同真 → blocked / 平态 null；awaiting 三排除", () => {
  assert.equal(attentionKind(baseState({ permission: { name: "x" } })), "blocked", "审批卡 → blocked")
  assert.equal(attentionKind(baseState({ question: { options: [] } })), "blocked", "提问卡 → blocked")
  assert.equal(attentionKind(baseState({ attentionAwaiting: true })), "awaiting", "回合结束等待输入 → awaiting")
  assert.equal(
    attentionKind(baseState({ attentionAwaiting: true, processing: true, permission: { name: "x" } })),
    "blocked",
    "permission + processing 同真 → blocked（processing 豁免仅及 awaiting——F13④ 消歧锁）",
  )
  assert.equal(attentionKind(baseState()), null, "平态 → null")
  // awaiting 三排除（processing / 挂起两态）
  assert.equal(attentionKind(baseState({ attentionAwaiting: true, processing: true })), null, "processing 排除")
  assert.equal(attentionKind(baseState({ attentionAwaiting: true, suspended: true })), null, "suspended 排除")
  assert.equal(attentionKind(baseState({ attentionAwaiting: true, _suspPending: true })), null, "_suspPending 排除")
  assert.equal(attentionKind(baseState({ permission: { name: "x" }, suspended: true })), "blocked", "blocked 不受挂起排除")
})

// ─── T-AT2：变色 + 文案 + 平态负向锁 ────────────────────────────────────────

test("T-AT2 renderStatus 两态（80 列）：awaiting 含色序列 + chip 逐字、strip 后以 chip 开头含常态字段；平态零色序列、无 chip", () => {
  const flat = renderStatus(baseState(), agentStub(), 80, [])
  const awaiting = renderStatus(baseState({ attentionAwaiting: true }), agentStub(), 80, [])
  assert.ok(awaiting.includes(ATT_SEQ), "awaiting 含注意力色序列")
  assert.ok(awaiting.includes("⚠ 等待你的输入"), "chip 逐字")
  assert.ok(stripAnsi(awaiting).startsWith("⚠ 等待你的输入"), "strip-ANSI 后以 chip 开头")
  assert.ok(stripAnsi(awaiting).includes("Enter: send"), "常态字段在位（内容零省略）")
  assert.ok(stripAnsi(awaiting).includes("/: commands"), "常态字段（尾段）在位")
  // 负向锁（N9 判定句同口径）：零注意力序列 + strip 文本无 chip
  assert.ok(!flat.includes(ATT_SEQ), "平态零注意力色序列")
  assert.ok(!stripAnsi(flat).includes("⚠"), "平态 strip-ANSI 无 chip")
  assert.ok(stripAnsi(flat).includes("Enter: send"), "平态常态字段照常")
  // 宽度预算（N9④）：整行 ≤ cols − 1 —— chip 计入
  assert.ok(stringWidth(awaiting) <= 79, `awaiting 整行 ≤ 79（实测 ${stringWidth(awaiting)}）`)
  assert.ok(stringWidth(flat) <= 79, `平态整行 ≤ 79（实测 ${stringWidth(flat)}）`)
  // banner 组合：chip 计入预算后仍 ≤ cols − 1
  const bannerAgent = agentStub({ planMode: true, autoApprove: true, config: { advisor: { guard: true }, agent: { engineering: true } } })
  const withBanner = renderStatus(baseState({ attentionAwaiting: true }), bannerAgent, 80, [])
  assert.ok(stripAnsi(withBanner).startsWith("⚠ 等待你的输入"), "banner 组合下 chip 仍在行首")
  assert.ok(withBanner.includes("\x1b[43m"), "色对在位")
  assert.ok(stringWidth(withBanner) <= 79, `banner 组合整行 ≤ 79（实测 ${stringWidth(withBanner)}）`)
  // 底色存活：banner 内含内部 reset（C.tool/… + ansi.reset）——每次复位后重施加色对
  assert.ok(withBanner.split(ATT_SEQ).length - 1 >= 2, "内部复位后重施加注意力底色（存活）")
})

// ─── T-AT3：三态优先级 ─────────────────────────────────────────────────────

test("T-AT3 blocked 优先级：permission 单真 / question 单真 / permission+awaiting 同真 → blocked 胜 awaiting；permission > question", () => {
  const perm = renderStatus(baseState({ permission: { name: "x" } }), agentStub(), 80, [])
  assert.ok(stripAnsi(perm).startsWith("⚠ 等待你的审批"), "permission → 审批 chip")
  const q = renderStatus(baseState({ question: { options: [] } }), agentStub(), 80, [])
  assert.ok(stripAnsi(q).startsWith("⚠ 等待你的回答"), "question → 回答 chip")
  const both = renderStatus(baseState({ permission: { name: "x" }, attentionAwaiting: true }), agentStub(), 80, [])
  assert.ok(stripAnsi(both).startsWith("⚠ 等待你的审批"), "blocked 胜 awaiting（优先级锁）")
  assert.ok(!stripAnsi(both).includes("等待你的输入"), "awaiting chip 不出现")
  const permQ = renderStatus(baseState({ permission: { name: "x" }, question: { options: [] } }), agentStub(), 80, [])
  assert.ok(stripAnsi(permQ).startsWith("⚠ 等待你的审批"), "permission > question（与按键分发同序）")
})

// ─── T-AT4 / T-AT5：清位（键 / 鼠）──────────────────────────────────────────

/** createKeyHandler 桩 ctx（同 input-lock.test.mjs 手法）。 */
function keyCtx(state, render) {
  return {
    agent: {}, state, render,
    popPicker() {}, renderPickerLines() {},
    handleSlash: async () => {}, handleTab() {},
    submit: async () => {},
    pasteClipboardImage: async () => {},
    wizardChooseProvider() {}, wizardSubmitText() {}, cancelWizard() {}, wizardProviderItems: () => [],
    renderWizard() {}, pushLine() {}, cleanup() {}, showPicker() {}, loadOlder() {},
  }
}

test("T-AT4 键盘清位：字符键 / 方向键 / Esc → attentionAwaiting=false 且 render 被调（清位一次——模态分派前）", () => {
  for (const [str, key] of [["a", { name: "a" }], ["", { name: "up" }], ["\x1b", { name: "escape" }]]) {
    const state = baseState({ attentionAwaiting: true })
    let renders = 0
    createKeyHandler(keyCtx(state, () => renders++))(str, key)
    assert.equal(state.attentionAwaiting, false, `${key.name}：清位`)
    assert.ok(renders >= 1, `${key.name}：render 被调`)
  }
  // 清位一次语义：方向键本身零副作用（空历史）→ 重绘恰一次 = 清位那一次
  const state = baseState({ attentionAwaiting: true })
  let renders = 0
  createKeyHandler(keyCtx(state, () => renders++))("", { name: "up" })
  assert.equal(renders, 1, "清位触发恰一次重绘")
  // 未置位时零副作用（不重绘）
  let renders2 = 0
  const s2 = baseState()
  assert.equal(clearAttention(s2, () => renders2++), false, "未置位 → false")
  assert.equal(renders2, 0, "未置位不重绘")
  // 置位 → true + 重绘；再清位 → false（幂等）
  assert.equal(clearAttention(s2, () => renders2++), false, "仍 false")
  const s3 = baseState({ attentionAwaiting: true })
  assert.equal(clearAttention(s3, () => renders2++), true, "置位 → true")
  assert.equal(renders2, 1, "恰一次重绘")
  assert.equal(clearAttention(s3, () => renders2++), false, "已清 → false（幂等）")
})

test("T-AT5 鼠标路径清位：滚轮 / 点击到达 → 清位 + render（单点）；index.mjs 接线位于滚轮分支与 onMouseClick 之前", () => {
  let renders = 0
  const wheel = baseState({ attentionAwaiting: true })
  assert.equal(clearAttention(wheel, () => renders++), true, "滚轮到达 → 清位")
  assert.equal(wheel.attentionAwaiting, false, "滚轮清位生效")
  assert.equal(renders, 1, "重绘一次")
  const click = baseState({ attentionAwaiting: true })
  clearAttention(click, () => renders++)
  assert.equal(click.attentionAwaiting, false, "点击到达 → 清位（同一点覆盖）")
  assert.equal(renders, 2, "重绘一次")
})

// ─── T-AT6：置位谓词矩阵 ───────────────────────────────────────────────────

test("T-AT6 userNeededAtTurnEnd 七条件矩阵：正常空闲 true；skipSession / 挂起 / 释放窗口 / 池 live / 队列非空 / processing 全 false", () => {
  const idle = () => ({ suspended: false, _suspPending: false, queue: [], processing: false })
  const bare = {}
  assert.equal(userNeededAtTurnEnd(idle(), bare, false), true, "正常空闲 → true")
  assert.equal(userNeededAtTurnEnd(idle(), bare, true), false, "skipSession 排除（digest / 会话内回合）")
  assert.equal(userNeededAtTurnEnd({ ...idle(), suspended: true }, bare, false), false, "挂起会话排除")
  assert.equal(userNeededAtTurnEnd({ ...idle(), _suspPending: true }, bare, false), false, "释放窗口排除")
  assert.equal(userNeededAtTurnEnd(idle(), { _asyncSubagents: new Map([[1, {}]]) }, false), false, "子代理池 live 排除")
  assert.equal(userNeededAtTurnEnd(idle(), { _asyncAdvisors: new Map([[1, {}]]) }, false), false, "评审池 live 排除（poolLive 同源）")
  assert.equal(userNeededAtTurnEnd({ ...idle(), queue: [{ text: "x" }] }, bare, false), false, "队列非空排除")
  assert.equal(userNeededAtTurnEnd({ ...idle(), processing: true }, bare, false), false, "processing 排除")
})

// ─── T-AT7：非触发态（判定句④）─────────────────────────────────────────────

test("T-AT7 非触发态渲染：picker / wizard / search / interruptPrompt / processing / suspended → null 且渲染零注意力序列", () => {
  const cases = {
    picker: { picker: { entries: [], filteredItems: [], index: 0, title: "t" } },
    wizard: { wizard: { step: "provider", index: 0 } },
    search: { search: { query: "q", matches: [], index: 0 } },
    interruptPrompt: { interruptPrompt: { chars: [], cursor: 0 } },
    processing: { processing: true },
    suspended: { suspended: true, attentionAwaiting: true },
  }
  for (const [name, over] of Object.entries(cases)) {
    const state = baseState(over)
    assert.equal(attentionKind(state), null, `${name}：非触发态 → null`)
    const row = renderStatus(state, agentStub(), 80, [])
    assert.ok(!row.includes(ATT_SEQ), `${name}：渲染零注意力序列`)
    assert.ok(!stripAnsi(row).includes("⚠ 等待"), `${name}：无 chip`)
  }
})
