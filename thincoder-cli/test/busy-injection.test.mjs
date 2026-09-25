/**
 * busy-injection.test.mjs — F16（busy 期消息注入 · 台账 #213；busy-extend 扩面 2026-09-22 ·
 * 台账 #224）机器验收 · CLI 半（按键门 + 入队族留守档）。
 *
 * 拆分（2026-09-25 file-tier-sweep 批 S4 · KD-23「用例族 + 夹具自持」——原档 474 行拆分；
 * 触发 = 前批登记「用例按族分档 · 下批执行」）：渲染 / 状态栏族已迁
 * `busy-injection-render.test.mjs`，消费 / 送达 / 步边界族已迁 `busy-injection-consume.test.mjs`；
 * 本档留守 = 按键门 + 入队族（T-F16-1 / 3 / 4 / 8 / 13 + `baseState` / `keyCtx` / `pressEnter`
 * 夹具）。用例号零改零重排；夹具自持（零跨档 import）。
 *
 * 设计权威：`docs/cli/design/TUI-INPUT-BOX.md` §4.1（放行判据五条 / 执行序 / 二次提交 /
 * 消费回执）+ `docs/cli/design/TUI.md` §7.5（反馈两段式 + `enterHint` 三态表）；批次档
 * `docs/batches/2026-09-21-busy-injection.md` §2 用例表（T-F16-1…6；T-F16-7 =
 * `test/input-lock.test.mjs` AC-1 断言翻转 + AC-2/释放窗口/槽满/斜杠 busy 吞零回归面）+ busy-extend
 * 批档 §2 用例面（T-F16-8 = 挂起内入槽 / 槽满）+ queue-visible 批（2026-09-24 · 台账 #249）§2
 * （T-F16-13 = 容量 8 连续性）。
 * 手法：`createKeyHandler` 桩 ctx 直驱按键（无真实 TTY——先例 `input-lock.test.mjs`）+
 * `renderStatus` 纯函数直驱（状态栏 queued 段 + F13 零注意力色对——先例
 * `session-title-surface.test.mjs`）。快层直跑（无定时器悬挂）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"

const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")

/** 最小按键态（挂起/释放窗口字段齐备——busy 判据三面全在；含状态栏渲染所需字段）。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: false, suspended: false, _suspPending: false, pendingInput: [],
    queue: [], subTasks: {}, tasks: [], scroll: 0, _followTail: true,
    permission: null, question: null,
    status: "Ready", processingStarted: 0, currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    ...over,
  }
}

/** createKeyHandler 桩 ctx（submit / 提示行 / 唤醒计数——挂载点与生产同形）。 */
function keyCtx(state, over = {}) {
  const calls = { submit: 0, wakes: 0, lines: [], renders: 0 }
  state._suspWake ??= () => { calls.wakes++ }
  const base = {
    agent: {},
    state,
    render() { calls.renders++ },
    popPicker() {}, renderPickerLines() {},
    handleSlash: async () => {}, handleTab() {},
    submit: async () => { calls.submit++ },
    pasteClipboardImage: async () => {},
    wizardChooseProvider() {}, wizardSubmitText() {}, cancelWizard() {},
    wizardProviderItems: () => [], renderWizard() {},
    pushLine: (text) => calls.lines.push(String(text)),
    cleanup() {}, showPicker() {}, loadOlder() {},
    ...over,
  }
  base.calls = calls
  return base
}

const pressEnter = (kh) => kh("\r", { name: "return" })

// ─── T-F16-1 正常：busy Enter → 入队（清框 + history 收录 + 状态栏 queued 段）───

test("T-F16-1 busy 入队：Enter ⇒ pendingInput 队列 = 该文本 ∧ 输入框清空 ∧ history 收录 ∧ 状态栏段含「已排队 1 条消息」∧ 零 submit 零提示行零唤醒", () => {
  const s = baseState({ processing: true, input: [..."msg"], cursor: 3, status: "Processing...", processingStarted: Date.now() })
  const c = keyCtx(s)
  const kh = createKeyHandler(c)
  kh("m", { name: "m" }) // busy 期字符照常回显（吞提交不吞字符）
  assert.deepEqual(s.input, [..."msgm"], "字符回显零改")
  pressEnter(kh)
  assert.deepEqual(s.pendingInput, ["msgm"], "队列填入该文本（判据五条全满足——§4.1）")
  assert.deepEqual(s.input, [], "入队清框（用户视为已发送）")
  assert.equal(s.cursor, 0, "光标复位")
  assert.deepEqual(s.history, ["msgm"], "history 照常收录")
  assert.equal(s.historyIndex, -1, "历史指针复位")
  assert.equal(s._draft, null, "草稿复位")
  assert.equal(c.calls.submit, 0, "不经 submit（回合在跑）")
  assert.equal(c.calls.lines.length, 0, "入队无对话流提示行（反馈 = 状态栏段）")
  assert.equal(c.calls.wakes, 0, "busy 入队不唤醒 driver（非挂起态）")
  // 反馈段：同状态直驱 renderStatus（真派生——segment 读 pendingInput.length）
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const flat = stripAnsi(renderStatus(s, agent, 120, []))
  assert.ok(flat.includes("已排队 1 条消息"), `状态栏 queued 段在位（实到 ${JSON.stringify(flat)}）`)
})

// ─── T-F16-3 边界：容量 8（第 9 条）= 拒绝 + 提示 + 文本保留（不覆盖）───

test("T-F16-3 容量：容量内再提交 ⇒ 连续入队；第 9 条吞 + 满队提示含「已排队 8 条消息」+ 输入框文本保留（不覆盖不丢）", () => {
  // 容量内（阈 1 → 8——queue-visible 批多槽裁定）：连续入队，每条各占一项
  const s0 = baseState({ processing: true, pendingInput: ["first"], input: [..."second"] })
  const c0 = keyCtx(s0)
  pressEnter(createKeyHandler(c0))
  assert.deepEqual(s0.pendingInput, ["first", "second"], "容量内再提交 ⇒ 连续入队（多槽）")
  assert.equal(c0.calls.submit, 0, "零 submit")

  // 第 9 条：拒 + 提示 + 文本保留
  const full = Array.from({ length: 8 }, (_, i) => `q${i}`)
  const s = baseState({ processing: true, pendingInput: [...full], input: [..."ninth"] })
  const c = keyCtx(s)
  pressEnter(createKeyHandler(c))
  assert.deepEqual(s.pendingInput, full, "满队不覆盖（8 条逐字保持）")
  assert.deepEqual(s.input, [..."ninth"], "被拒文本保留在输入框")
  assert.equal(c.calls.lines.length, 1, "满队提示一次")
  assert.match(c.calls.lines[0], /已排队 8 条消息/, "满队提示明示（阈 1 → 8）")
  assert.equal(c.calls.submit, 0, "零 submit")
})

// ─── T-F16-4 边界：排除面四形（模态 / digest / 斜杠 / 空）───

test("T-F16-4 排除与挂起面：审批卡（模态消费 Enter）/ 斜杠 busy 吞——文本保留 ∧ 零入槽；挂起会话内 busy ⇒ 同判据入槽（清框 + 唤醒）；空 Enter 静默", () => {
  // ① 审批卡挂起（busy + permission）：模态分派链最前——Enter 被模态消费（D-BI1 结构保证：
  //    本路径物理不可达——判据表条件 2 为如实守卫），零入槽零 submit 文本保留
  const s1 = baseState({ processing: true, input: [..."during-approval"], permission: { name: "bash", args: {}, resolve() {} } })
  const c1 = keyCtx(s1)
  pressEnter(createKeyHandler(c1))
  assert.equal(c1.calls.submit, 0, "模态期 Enter 不落 busy 门禁（dispatch 序：模态在前）")
  assert.deepEqual(s1.pendingInput, [], "模态期零入槽（条件 2 排他）")
  assert.deepEqual(s1.input, [..."during-approval"], "文本保留在输入框")
  assert.equal(c1.calls.lines.length, 0, "模态消费静默（自有面板呈现——不叠 busy 提示行）")

  // ② 挂起会话内 busy（suspended ∧ processing）：busy-extend 批改述——同判据入队（原「仍吞」撤销）
  const s2 = baseState({ processing: true, suspended: true, input: [..."during-digest"], cursor: 13 })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.deepEqual(s2.pendingInput, ["during-digest"], "入 pendingInput 队列（挂起两态不再是吞面）")
  assert.deepEqual(s2.input, [], "入槽清框 + 光标复位")
  assert.equal(s2.cursor, 0, "光标复位")
  assert.deepEqual(s2.history, ["during-digest"], "history 照常收录")
  assert.equal(c2.calls.wakes, 1, "挂起面入槽同款唤醒（呼叫点执行）")
  assert.equal(c2.calls.lines.length, 0, "入槽零提示行（反馈 = 状态栏段）")
  assert.equal(c2.calls.submit, 0, "不经 submit")

  // ③ 斜杠 busy（条件 3）：吞 + busy 提示 + 文本保留（白名单已删语义不变）
  const s3 = baseState({ processing: true, input: [..."/exit"] })
  const c3 = keyCtx(s3)
  pressEnter(createKeyHandler(c3))
  assert.deepEqual(s3.pendingInput, [], "斜杠零入槽")
  assert.deepEqual(s3.input, [..."/exit"], "文本保留输入框")
  assert.match(c3.calls.lines[0], /主会话处理中/, "斜杠吞同提示")
  assert.equal(c3.calls.submit, 0, "斜杠不经 submit（busy 禁发）")

  // ④ 空 Enter（条件 4）：静默（零提示行零入槽）
  const s4 = baseState({ processing: true, input: [..."   "] })
  const c4 = keyCtx(s4)
  pressEnter(createKeyHandler(c4))
  assert.equal(c4.calls.lines.length, 0, "空/纯空白静默无提示")
  assert.deepEqual(s4.pendingInput, [], "零入槽")
})

// ─── T-F16-8 正常/边界：挂起内 busy 入队 + 满队吞（可区分判据）───

test("T-F16-8 挂起内 busy：队列未满 ⇒ 入队（pendingInput + 清框 + history + 唤醒 + 零对话提示行）；满队 ⇒ 吞（清框不发生 + 队列既有项不被覆盖 + 非空恒显 dim 段）", () => {
  // 挂起会话内 busy + 队列未满：与普通 busy 同判据入队（busy-extend 批 AC-1 扩面）
  const s1 = baseState({ processing: true, suspended: true, input: [..."session-msg"], cursor: 11, })
  const c1 = keyCtx(s1)
  pressEnter(createKeyHandler(c1))
  assert.deepEqual(s1.pendingInput, ["session-msg"], "队列填入（两面共用同一队列）")
  assert.deepEqual(s1.input, [], "入队清框")
  assert.equal(s1.cursor, 0, "光标复位")
  assert.deepEqual(s1.history, ["session-msg"], "history 收录")
  assert.equal(s1._draft, null, "草稿复位")
  assert.equal(c1.calls.wakes, 1, "挂起面入队同款唤醒")
  assert.equal(c1.calls.submit, 0, "不经 submit")
  assert.equal(c1.calls.lines.length, 0, "零对话提示行（反馈 = 状态栏段）")

  // 满队形（挂起内 busy · 队列已满 8 条）：吞——可区分判据 = 清框不发生 + 既有项不覆盖 + 零入队
  const full = Array.from({ length: 8 }, (_, i) => `q${i}`)
  const s2 = baseState({ processing: true, suspended: true, pendingInput: [...full], input: [..."second"], cursor: 6 })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.equal(s2.pendingInput.length, 8, "队列既有不被覆盖（长度不变）")
  assert.equal(s2.pendingInput[0], "q0", "队列首项逐字不变")
  assert.deepEqual(s2.input, [..."second"], "清框不发生（输入框段文本逐字不变）")
  assert.equal(s2.cursor, 6, "光标零动")
  assert.equal(c2.calls.lines.length, 1, "吞 + 满队提示一次")
  assert.match(c2.calls.lines[0], /已排队 8 条消息/, "满队提示与既有满队分支逐字同构")
  assert.equal(c2.calls.wakes, 0, "吞 ⇒ 零唤醒（零入队）")
  // 提示段 = 队列非空恒显 dim 段（TUI.md §7.5 表第 1 行逐字）
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  assert.ok(stripAnsi(renderStatus(s2, agent, 120, [])).includes("已排队 8 条消息"), "队列非空 ⇒ dim 段在位（N = 8）")
})

// ═══ queue-visible 批（2026-09-24 · 台账 #249）：待发送块 / 合并计划 / 步边界 pickup ═══
// 设计 = `TUI.md` §7.5（待发送块 · 四态 · 三时机）· `TUI-INPUT-BOX.md` §4.1（容量 / 满队）·
// `AGENT-LOOP-ASYNC-POOL.md` §6.8（步边界 pickup）。用例表 T-F16-10…19（批档 §2）。

test("T-F16-13 容量 8：连续入队 8 条全入（长度 === 8）∧ 第 9 条拒 + 提示含「已排队 8 条消息」+ 文本保留 ∧ 入队恢复跟随", () => {
  const s = baseState({ processing: true, scroll: 42, _followTail: false })
  const c = keyCtx(s)
  const kh = createKeyHandler(c)
  for (let i = 0; i < 8; i++) {
    s.input = [...`m${i}`]; s.cursor = 2
    pressEnter(kh)
  }
  assert.equal(s.pendingInput.length, 8, "前 8 条全入（容量 8——多槽）")
  assert.deepEqual(s.pendingInput, Array.from({ length: 8 }, (_, i) => `m${i}`), "逐条可见（顺序 = 入队序）")
  assert.deepEqual([s.scroll, s._followTail], [0, true], "入队恢复跟随（F4——新提交消息同列；§7.5 跟随）")
  s.input = [..."ninth"]; s.cursor = 5
  pressEnter(kh)
  assert.equal(s.pendingInput.length, 8, "第 9 条拒（零覆盖）")
  assert.deepEqual(s.input, [..."ninth"], "被拒文本保留在输入框")
  assert.equal(c.calls.lines.length, 1, "拒 + 提示一次")
  assert.match(c.calls.lines[0], /已排队 8 条消息/, "满队提示逐字")
})

