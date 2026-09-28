/**
 * views-question.test.mjs — 卡族面用例（批 A · 任务书 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.9
 * T-DSK24 ①/② · A-2a-3 新建档）：
 *   U122（T-DSK24 ①）提问卡构树与三出口锚：卡根两锚 / 子序三件 / 给答项逐位 / `options` 空 · 非数组 · 滤非串
 *     ⇒ 零操作区 / 作答区三件 + 接线两态（handlers 缺 ⇒ 三件 `disabled`，锚恒在）/ 三出口值映射
 *     （选项串原样 ∥ 取消 `null` —— 真注册面收值）；
 *   U123 卡序接缝（跨 `views/chat.mjs` × `mount-cards.mjs` 两档联检）：三族同场序 `approval → question → task` ·
 *     后到族不夺位 · **块锚 = 首个卡节点之前**（非审批卡在场同判 —— 本批加宽面）· 药丸恒末位；
 *   U124 出站接线（`attachCards` 两 handlers 往返 `question:respond`）：回执 `ok` 真才摘 + 清位（零乐观）·
 *     失败 / 拒绝 / 抛 ⇒ 卡留 + 记错（拒收 ⇒ 携 `receipt.reason` · 抛 / 拒 ⇒ `respondQuestion` 自记，各自单记）·
 *     已换 `prompt-id` ⇒ 零写 · 无活动会话 ⇒ 零 IPC · 草稿径空白串 ⇒ 零 IPC /
 *     值原样送出（零 trim）· 控件缺位 ⇒ 零动作 + 记错 · `stopped` ⇒ 零回执直摘 · 等值重挂 ⇒ **活树**零写
 *     （节点不重建 ⇒ 草稿保全 —— 影子构建摘弃不入判，见 `flatRefs`）；
 *   U125（T-DSK24 ②）计划卡：空列表 / 非数组 ⇒ 卡不在场 · 三态逐行（码面原码 + 词面经 `t()`）· 表外码 ⇒
 *     零状态词节点 · `ev:task` 归约驱动落位 · 同 key 就地替换不叠卡 · 等值重挂 ⇒ 活树零写。
 * 用例号 = 自铸（`U122–U125`）：设计用例号归属表无本舱段（沿 A-3b `U120/U121` 先例）。
 * **归约半不重复**：切片写 / `clearQuestion` / `stopped` 摘项 / 位标码域判据住 `test/events-reduce.test.mjs`
 * （A-1b 原址）—— 本档只以 `reduce` 事件驱动产态为**输入**，不重立其判据。
 * 两面 = ① 纯构树（描述符 · 零 DOM）+ ② 落点面（假 DOM：`dom.mjs` 真注册面 / `mountCards` 帧内幂等与插点）。
 * 本地扩缝声明（载体面外两消费点 · 见 `patchCardSeam`）：`document.querySelector`（`mount-cards.mjs:134` 读
 * `CARDS_SLOT`）与元素 `closest`（`mount-cards.mjs:142` 上行找卡）—— `views-harness.mjs` 的 `installSeam`
 * 只补设置面（`closest("form")` / `select.value`）⇒ 两面各持其闭集，不互相放大面。
 * 词面零字面：`useSentinels` ⇒ 断言即证「文案经 `t()` 消费」，不引文案副本。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createStore, initialState } from "../renderer/store.mjs"
import { reduce } from "../renderer/events.mjs"
import { build } from "../renderer/dom.mjs"
import { attachCards, mountCards, submitAnswer } from "../renderer/mount-cards.mjs"
import { planTree } from "../renderer/views/plan.mjs"
import { questionTree } from "../renderer/views/question.mjs"
import { chatModel, mountChat, settleFrame } from "../renderer/views/chat.mjs"
import { syncChrome } from "../renderer/views/chat-chrome.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"
import { clickOn, nodes, sentinel, texts, useSentinels } from "./views-harness.mjs"

// ─── 夹具 ──────────────────────────────────────────────────────────────

const KEY = "s1"
/** 纯态缝：初态 + 活动会话（`initialState` 单源 —— 不手抄切片形）。 */
const blank = () => ({ ...initialState(), activeSession: KEY })
/** 三事件缝 = 归约器**输入**产态（判据面归 `test/events-reduce.test.mjs`）。 */
const askOn = (state, over = {}) => reduce(state, { channel: "ev:question", key: KEY, promptId: "q1", question: "走哪条路？", options: ["甲", "乙"], ...over })
const planOn = (state, items) => reduce(state, { channel: "ev:task", key: KEY, items })
const stopped = (state) => reduce(state, { channel: "ev:activity", key: KEY, event: "stopped" })
const blockOf = (id) => ({ kind: "user", id, text: `文本 ${id}` })
const withBlocks = (state, ...ids) => ({ ...state, blocks: ids.map(blockOf) })
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const ITEM = { promptId: "q1", question: "走哪条路？", options: ["甲", "乙"] }
const APPROVAL = { shape: "single", promptId: "a1", tool: "Bash", argsSummary: "npm test" }
const PLAN = [{ title: "第一步", status: "pending" }, { title: "第二步", status: "in_progress" }, { title: "第三步", status: "done" }]

/** 树遍历面两查（共享夹具 `nodes` = 后序 ⇒ sibling 保序；判据只用序内相对位）。 */
const some = (tree, name) => nodes(tree).filter((node) => node.props?.[name] !== undefined)
const one = (tree, name) => some(tree, name)[0] ?? null
const rowsOf = (tree) => nodes(tree).filter((node) => node.props?.class === "plan-row")
const codesOf = (tree) => rowsOf(tree).map((node) => node.props["data-status"])
const cardCodes = (root) => root.querySelectorAll("[data-card]").map((node) => node.getAttribute("data-card"))
const blockIds = (root) => root.querySelectorAll("[data-block-kind]").map((node) => node.getAttribute("data-block-id"))

/** 活树引用序（逐层展平）／逐位 `===` 比对 = 零重建 ∧ 零重排 ∧ 零重挂。
 *  **影子构建不入判**：`mountCards` 先 `build` 摘弃再比签名（`mount-cards.mjs:109`）⇒ 假面全局写计恒非零，
 *  「等值 ⇒ 零写」的可证面 = 活树（引用判 —— 不落结构深比，结构深比会放过等形重建）。 */
const flatRefs = (node) => [node, ...(node.children ?? []).flatMap(flatRefs)]
const sameRefs = (left, right) => left.length === right.length && left.every((node, index) => node === right[index])

/** 卡面扩缝（档头声明面）：`document.querySelector` 委派「文档根」+ 元素 `closest`（**含自身** ⇒ 逐代上溯）；
 *  两缝选择器仍走假面闭集纪律（表外**抛** —— 假面不静默给空）。 */
const ATTRIBUTE_SELECTOR = /^\[([A-Za-z0-9_:.-]+)(?:="([^"]*)")?\]$/
function patchCardSeam(fake, shell) {
  const parse = (selector) => {
    const hit = ATTRIBUTE_SELECTOR.exec(String(selector))
    if (hit === null) throw new Error(`seam: 表外选择器 ${selector}（假面不静默给空）`)
    return [hit[1], hit[2]]
  }
  fake.document.querySelector = (selector) => {
    parse(selector)
    return shell.querySelector(selector)
  }
  Object.defineProperty(Object.getPrototypeOf(fake.element()), "closest", {
    configurable: true,
    value: function closest(selector) {
      const [name, value] = parse(selector)
      for (let node = this; node !== null && node !== undefined; node = node.parent) {
        if (node.attrs?.has(name) === true && (value === undefined || node.attrs.get(name) === value)) return node
      }
      return null
    },
  })
}

// ─── U122 T-DSK24 ①：提问卡构树与三出口锚 ─────────────────────────────

test("U122 T-DSK24 ①: 提问卡构树与三出口锚（卡根两锚 · 子序 · 给答项逐位 · options 零操作区 · 三出口值映射）", (ctx) => {
  useSentinels(ctx)
  const seen = []
  const card = questionTree(ITEM, { onAnswer: (promptId, answer) => seen.push([promptId, answer]), onAnswerDraft: () => {} })

  // ① 卡根两锚 + 子序三件
  assert.equal(card.props["data-card"], "question", "卡根锚 = data-card=question（驻对话流根 · 非块节点）")
  assert.equal(card.props["data-prompt-id"], "q1", "身份锚 = prompt-id（与 ev:question 同源同值）")
  assert.equal(questionTree({ promptId: 7 }).props["data-prompt-id"], "7", "非串 prompt-id ⇒ 串形（锚单形）")
  assert.deepEqual(card.children.map((node) => node.props.class), ["question-head", "question-options", "question-answer"], "子序 = 题干行 → 给答项区 → 作答区")
  assert.deepEqual(texts(one(card, "data-question-head")), ["走哪条路？"], "题干行 = 提问串原样（零构造）")

  // ② 给答项逐位（i = 1 起 · 词 = 选项串原样）
  const options = one(card, "data-question-options")
  assert.deepEqual(options.children.map((node) => node.props["data-action"]), ["question:1", "question:2"], "给答项锚 = question:<i>（i = 1 起）")
  assert.deepEqual(texts(options), ["甲", "乙"], "逐项词 = 选项串原样（零构造）")
  assert.deepEqual(some(card, "data-action").map((node) => node.props["data-action"]), ["question:1", "question:2", "question:answer", "question:cancel"], "出口锚四件全序（给答项 ⇒ 提交 ⇒ 取消）")

  // ③ 作答区三件（文本控件 + 提交 + 取消）· 接线两态
  const answer = one(card, "data-question-answer")
  assert.deepEqual(answer.children.map((node) => node.props.class), ["question-input", "question-submit", "question-cancel"], "作答区三件同序（恒在场）")
  assert.equal(answer.children[0].props["data-input"], "answer", "文本控件锚 = data-input=answer（沿输入区惯例）")
  assert.equal(answer.children[0].props["aria-label"], sentinel("question.input"), "控件词面经 t()（键 question.input）")
  assert.equal(answer.children[0].props.rows, "1", "单行起（草稿面派生，无窗口判据）")
  assert.equal(answer.children[0].props.disabled, undefined, "接线两态①：onAnswerDraft 给 ⇒ 控件在场可编辑")
  assert.deepEqual(texts(answer), [sentinel("question.answer"), sentinel("question.cancel")], "两键词面经 t()（键逐位）")
  const degraded = one(questionTree({ promptId: "q2", question: "x" }, {}), "data-question-answer")
  assert.deepEqual(degraded.children.map((node) => node.props.disabled), [true, true, true], "接线两态②：handlers 缺 ⇒ 三件皆 disabled（诚实非死控）")
  assert.deepEqual(one(questionTree({ promptId: "q2", question: "x" }, {}), "data-action") !== null, true, "锚恒在（降级不隐藏）")

  // ④ `options` 空 / 非数组 / 滤非串空串 ⇒ 零操作区节点（自由作答路恒在）
  assert.equal(questionTree({ promptId: "q3", question: "自由作答？", options: [] }).children[1], null, "options 空 ⇒ 零操作区节点")
  assert.equal(questionTree({ promptId: "q4", question: "x", options: "甲" }).children[1], null, "非数组 ⇒ 零操作区")
  assert.deepEqual(one(questionTree({ promptId: "q5", question: "x", options: ["甲", "", 5] }), "data-question-options").children.map((node) => node.props["data-action"]), ["question:1"], "逐项滤非串 / 空串（零假造 · 序号连续）")

  // ⑤ 三出口值映射（落点面：真注册面收值）
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档 —— 载体不静默失效）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const node = build(card)
  clickOn(fake, node.querySelector('[data-action="question:1"]'))
  clickOn(fake, node.querySelector('[data-action="question:2"]'))
  clickOn(fake, node.querySelector('[data-action="question:cancel"]'))
  assert.deepEqual(seen, [["q1", "甲"], ["q1", "乙"], ["q1", null]], "三出口值映射：选项串原样 ∥ 取消 ⇒ answer: null（词面读数归 U124）")
  assert.equal(fake.fire(node.querySelector('[data-action="question:answer"]'), "click", { currentTarget: node }), 1, "提交键监听在场（提交径 = 草稿路）")
  assert.equal(fake.fire(build(questionTree(ITEM, {})).querySelector('[data-action="question:cancel"]'), "click"), 0, "缺 handlers ⇒ 零监听（降级面）")
})

// ─── U123 卡序接缝（两档插点联检）────────────────────────────────────

test("U123: 卡序接缝（三族同场序 · 后到族不夺位 · 块锚 = 首个卡节点之前 —— 卡序两档联检）", (ctx) => {
  useSentinels(ctx)
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const flow = fake.element("div")
  flow.setAttribute("data-slot", "flow")

  // ① 先到 = 计划族（单族）：卡居块后（非块节点 —— 块序列不变式不受影响）
  const s1 = withBlocks(planOn(blank(), PLAN.slice(0, 1)), "u1")
  mountChat(flow, s1)
  assert.equal(mountCards(flow, s1, {}), 1, "在场族数 = 1（计划族）")
  assert.deepEqual(cardCodes(flow), ["task"], "计划卡在场（先到者居位）")
  assert.equal(flow.children.indexOf(flow.querySelector('[data-card="task"]')) > flow.children.indexOf(flow.querySelector("[data-block-kind]")), true, "卡居块序列之后")

  // ② 后到族不夺位：提问卡到 ⇒ 插在计划卡之前（插点判据 = 卡序，非到达序）
  const s2 = withBlocks(askOn(s1), "u1")
  assert.equal(mountCards(flow, s2, {}), 2, "在场族数 = 2（提问 + 计划）")
  assert.deepEqual(cardCodes(flow), ["question", "task"], "提问插在计划之前（首个更高序卡 = 计划卡）")

  // ③ 三族同场：审批族后到 ⇒ 插在提问之前（两档插点各居其位）
  const s3 = { ...s2, pool: { ...s2.pool, approvals: [APPROVAL] } }
  syncChrome(flow, chatModel(s3), {})
  assert.deepEqual(cardCodes(flow), ["approval", "question", "task"], "三族同场序 = 待审批 → 提问 → 计划（卡序单源）")

  // ④ 块锚 = 首个卡节点之前（**非审批卡在场**同判 —— 本批加宽面）：尾段块插到卡之前
  const s4 = withBlocks({ ...s3, following: false }, "u1", "u2")
  settleFrame(flow, chatModel(s4), null, { evict: 0, prepend: 0, tail: [s4.blocks[1]], ok: true }, "append", {})
  const kids = flow.children
  const firstCard = kids.findIndex((node) => node.attrs?.has("data-card"))
  const lastBlock = kids.map((node) => node.attrs?.has("data-block-kind")).lastIndexOf(true)
  assert.deepEqual(blockIds(flow), ["u1", "u2"], "尾段块入位（块序不变）")
  assert.equal(firstCard > 0, true, "卡族在场（序首之位 = 块序列之后）")
  assert.equal(lastBlock < firstCard, true, "块锚 = 首个卡节点之前（提问 / 计划卡在场同判 —— 加宽面）")
  assert.equal(kids.at(-1).attrs?.has("data-pill"), true, "药丸恒末位（卡族之后）")
})

// ─── U124 出站接线（attachCards 两 handlers）─────────────────────────

test("U124: 出站接线（回执 ok 才摘 / 失败留卡 + 记错 / 已换项零写 / 空白串零 IPC / 控件缺位记错 / stopped 直摘）", async (ctx) => {
  useSentinels(ctx)
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const flow = fake.element("div")
  flow.setAttribute("data-slot", "flow")
  const shell = fake.element("div")
  shell.append(flow)
  patchCardSeam(fake, shell)
  assert.equal(fake.document.querySelector('[data-slot="flow"]'), flow, "扩缝：document 查询面命中 flow 槽（attachCards 落点面）")

  const calls = []
  let receipt = { ok: true }
  const host = { invoke: async (channel, payload) => { calls.push([channel, payload]); return receipt } }
  const store = createStore(withBlocks(askOn(blank()), "u1"))
  const { paintCards, handlers } = attachCards(host, { store })
  assert.equal(paintCards(), 1, "paintCards ⇒ 卡族落位（真径 = document.querySelector(CARDS_SLOT)）")
  const cardOf = () => flow.querySelector('[data-card="question"]')
  assert.equal(cardOf() !== null, true, "提问卡落到 flow 槽")

  // ① 等值重挂 ⇒ 活树零写（在形文本控件的草稿 / 焦点保全 = 不重建节点）
  cardOf().querySelector('[data-input="answer"]').value = "草稿在途"
  const keptRefs = flatRefs(cardOf())
  const keptKids = flow.children.slice()
  const mark = fake.mark()
  assert.equal(paintCards(), 1, "等值重挂 ⇒ 在场族数不变")
  assert.equal(fake.delta(mark).text, 0, "零文本写（标签刷写路未走）")
  assert.equal(sameRefs(flatRefs(cardOf()), keptRefs), true, "活树引用序全等（逐位 === ⇒ 零重建 / 零重排）")
  assert.equal(sameRefs(flow.children, keptKids), true, "flow 子序引用不变（零摘零插）")
  assert.equal(cardOf().querySelector('[data-input="answer"]').value, "草稿在途", "控件值随节点存留（真保全）")

  // ② 回执非 ok ⇒ 卡留 + 记错（零乐观摘 —— 切片零写 · 位标零清 · 错面不静默）
  const rejected = []
  const priorError = console.error
  console.error = (...args) => rejected.push(args)
  try {
    receipt = { ok: false, reason: "bad-kind" }
    handlers.onAnswer("q1", "甲")
    await tick()
  } finally {
    console.error = priorError
  }
  assert.deepEqual(calls.at(-1), ["question:respond", { promptId: "q1", answer: "甲" }], "窄桥通道 + 载荷逐字（给答项路）")
  assert.equal(store.get().questions[KEY] !== undefined, true, "回执非 ok ⇒ 卡留（零切片写）")
  assert.equal(store.get().tabBadges[KEY].includes("approval"), true, "位标零清（摘项判据未达）")
  assert.equal(rejected.length, 1, "回执非 ok ⇒ 有诊断（console.error 恰一次 —— 错面不静默）")
  assert.equal(rejected[0][0], "[renderer] question:respond failed: bad-kind", "错面携 receipt.reason（同族先例形）")

  // ③ 回执 ok 真 ⇒ 摘项 + 清位（两效同笔）+ 帧内刷 ⇒ 卡退场
  receipt = { ok: true }
  handlers.onAnswer("q1", "甲")
  await tick()
  assert.equal(store.get().questions[KEY], undefined, "回执 ok 真 ⇒ 摘本键提问项")
  assert.deepEqual(store.get().tabBadges[KEY], [], "两效同笔：清本键 approval 位（单源 = events.mjs clearQuestion）")
  assert.equal(paintCards(), 0, "帧内刷 ⇒ 零族")
  assert.equal(cardOf(), null, "卡节点摘净（零残留）")

  // ④ 已换项（新问在场）⇒ 回执 ok 亦零写（摘项前验 prompt-id —— 不误摘新项）
  store.set(withBlocks(askOn(blank(), { promptId: "q2" }), "u1"))
  assert.equal(paintCards(), 1, "新问落卡")
  receipt = { ok: true }
  handlers.onAnswer("q1", "甲")
  await tick()
  assert.equal(store.get().questions[KEY].promptId, "q2", "旧 prompt-id 回执 ⇒ 新项零写（零误摘）")
  assert.equal(store.get().tabBadges[KEY].includes("approval"), true, "位标零清（本项未受理）")

  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    // ⑤ invoke 抛 ⇒ 卡留 + 记错（不静默 · 零切片写）
    const wired = attachCards({ invoke: () => { throw new Error("no handler") } }, { store })
    wired.handlers.onAnswer("q2", "乙")
    await tick()
    assert.equal(errors.length, 1, "invoke 抛 ⇒ console.error 恰一次")
    assert.equal(errors[0][0], "[renderer] question:respond failed:", "错面前缀逐字（沿审批卡同形）")
    assert.equal(store.get().questions[KEY].promptId, "q2", "回执 null ⇒ 卡留可重试")

    // ⑥ 无活动会话 ⇒ 零 IPC + 记错（前置判 —— 回执未发）
    const orphan = createStore({ ...initialState(), activeSession: null })
    const quiet = calls.length
    assert.equal(await submitAnswer({ store: orphan, host }, "q2", "乙"), false, "无活动会话 ⇒ 未受理")
    assert.equal(calls.length, quiet, "零 IPC")
    assert.equal(errors.at(-1)[0], "[renderer] question:respond: no active session", "错面逐字")

    // ⑦ 草稿径（词面读数 = 接线面）：空白串 ⇒ 零 IPC；非空 ⇒ 值原样送出（零 trim / 零改写）
    const box = cardOf().querySelector('[data-input="answer"]')
    const submit = cardOf().querySelector('[data-action="question:answer"]')
    box.value = "   "
    const quiet2 = calls.length
    clickOn(fake, submit)
    await tick()
    assert.equal(calls.length, quiet2, "空白串 ⇒ 零动作零 IPC（取消走显式出口 —— 不吞别的键）")
    box.value = "  乙  "
    fake.fire(submit, "click", { currentTarget: submit })
    await tick()
    assert.deepEqual(calls.at(-1), ["question:respond", { promptId: "q2", answer: "  乙  " }], "值原样送出（词面读数 = 接线面）")

    // ⑧ 控件缺位 ⇒ 零动作 + 记错（**不得**当取消）
    const bare = fake.element("div")
    bare.setAttribute("data-card", "question")
    const quiet3 = calls.length
    const marks = errors.length
    fake.fire(submit, "click", { currentTarget: bare })
    await tick()
    assert.equal(errors.length, marks + 1, "控件缺位 ⇒ 记错恰一次")
    assert.equal(errors.at(-1)[0], "[renderer] question:answer: draft input missing for prompt:", "错面逐字")
    assert.equal(calls.length, quiet3, "零 IPC（缺位不当取消 —— 零回执）")
  } finally {
    console.error = original
  }

  // ⑨ stopped 终局：事件面摘项 ⇒ 本档零回执直摘（归约半判据住原址）
  store.set(withBlocks(askOn(blank(), { promptId: "q3" }), "u1"))
  assert.equal(paintCards(), 1, "新问落卡（在场族数 = 1）")
  const quiet4 = calls.length
  store.set(stopped(store.get()))
  assert.equal(store.get().questions[KEY], undefined, "stopped ⇒ 事件面摘项")
  paintCards()
  assert.equal(cardOf(), null, "卡零回执直摘（摘项来自事件面 —— 本档零 IPC）")
  assert.equal(calls.length, quiet4, "零 IPC")
})

// ─── U210「对齐第三批」提问卡两增量（P2 Enter 提交 · P3 聚焦两态）────────

test("U210: 「对齐第三批」提问卡（P2 Enter / Shift+Enter / 组字三径 · 空白零发送）∧ P3 聚焦两态（插入即焦 / 答毕回焦 / 失败零动）", async (ctx) => {
  useSentinels(ctx)
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const flow = fake.element("div")
  flow.setAttribute("data-slot", "flow")
  const composerInput = fake.element("textarea")
  composerInput.setAttribute("data-input", "text")
  const shell = fake.element("div")
  shell.append(flow, composerInput)
  patchCardSeam(fake, shell)
  const focused = []
  Object.defineProperty(Object.getPrototypeOf(fake.element()), "focus", {
    configurable: true,
    value: function focus() { focused.push(this.getAttribute("data-input") ?? this.tag) },
  })

  const calls = []
  let receipt = { ok: true }
  const host = { invoke: async (channel, payload) => { calls.push([channel, payload]); return receipt } }
  const store = createStore(withBlocks(askOn(blank()), "u1"))
  const { paintCards, handlers } = attachCards(host, { store })

  // P3 ①：新卡插入 ⇒ 卡内作答控件聚焦（插入径；刷新径不重夺焦 —— 下行对拍）
  assert.equal(paintCards(), 1, "新问落卡")
  assert.deepEqual(focused, ["answer"], "卡插入 ⇒ `[data-input=\"answer\"]` 聚焦恰一次")
  assert.equal(paintCards(), 1, "等值重挂（零重建）")
  assert.deepEqual(focused, ["answer"], "刷新径不重夺焦（零 DOM 写 ⇒ 零 focus 调用）")

  // P2：Enter（非组字）⇒ preventDefault + 泻入既有 `onAnswerDraft` 径（值原样零 trim）
  const box = flow.querySelector('[data-card="question"]').querySelector('[data-input="answer"]')
  const prevented = []
  box.value = "  乙  "
  fake.fire(box, "keydown", { key: "Enter", target: box, currentTarget: box, preventDefault: () => prevented.push("enter") })
  await tick()
  assert.deepEqual(prevented, ["enter"], "Enter ⇒ preventDefault（本端接管该键）")
  assert.deepEqual(calls.at(-1), ["question:respond", { promptId: "q1", answer: "  乙  " }], "复用 onAnswerDraft 径：值原样送出（零 trim —— 单一实现）")

  // 空白 + Enter ⇒ 零发送（空白闸同提交键）；Shift+Enter / 组字期 ⇒ 零动作不吞键
  box.value = "   "
  const quiet = calls.length
  fake.fire(box, "keydown", { key: "Enter", target: box, currentTarget: box, preventDefault: () => prevented.push("blank") })
  await tick()
  assert.equal(calls.length, quiet, "空白串 ⇒ 零动作零 IPC")
  box.value = "留字"
  fake.fire(box, "keydown", { key: "Enter", shiftKey: true, target: box, currentTarget: box, preventDefault: () => prevented.push("shift") })
  fake.fire(box, "keydown", { key: "Enter", isComposing: true, target: box, currentTarget: box, preventDefault: () => prevented.push("ime") })
  fake.fire(box, "keydown", { key: "Enter", keyCode: 229, target: box, currentTarget: box, preventDefault: () => prevented.push("229") })
  fake.fire(box, "keydown", { key: "a", target: box, currentTarget: box, preventDefault: () => prevented.push("a") })
  await tick()
  assert.deepEqual(prevented, ["enter", "blank"], "Shift+Enter / 组字两臂 / 余键 ⇒ 零 preventDefault（不吞键）")
  assert.equal(calls.length, quiet, "三径皆零 IPC（Shift+Enter = 换行路）")

  // P3 ②：作答回执 `ok` 真 ⇒ 回焦输入区；失败径零动
  focused.length = 0
  receipt = { ok: true }
  handlers.onAnswer("q1", "甲")
  await tick()
  assert.deepEqual(focused, ["text"], "受理 ⇒ 回焦输入区 `[data-input=\"text\"]`")
  store.set(withBlocks(askOn(blank(), { promptId: "q2" }), "u1"))
  paintCards()
  focused.length = 0
  receipt = { ok: false, reason: "bad-kind" }
  const priorError = console.error
  console.error = () => {}
  try {
    handlers.onAnswer("q2", "乙")
    await tick()
  } finally {
    console.error = priorError
  }
  assert.equal(store.get().questions[KEY].promptId, "q2", "回执非 ok ⇒ 卡留（零切片写）")
  assert.deepEqual(focused, [], "失败径零动（不回焦 —— 卡留场可重试）")
})

// ─── U125 T-DSK24 ②：计划卡 ─────────────────────────────────────────

test("U125 T-DSK24 ②: 计划卡（空列表零节点 · 三态逐行 · 表外码零词 · ev:task 归约驱动 · 就替换不叠卡）", (ctx) => {
  useSentinels(ctx)

  // ① 纯构树：空列表 / 非数组 ⇒ null（卡不在场 —— 零节点）
  assert.equal(planTree([]), null, "空列表 ⇒ null（卡不在场）")
  assert.equal(planTree(undefined), null, "槽缺 ⇒ null")
  assert.equal(planTree("x"), null, "非数组 ⇒ null（防御读形）")

  // ② 三态逐行：码面 = 原始码（机器读面）· 词面经 t()（码域三值 ⇒ 词键三枚）
  const tree = planTree(PLAN)
  assert.equal(tree.props["data-card"], "task", "卡根锚 = data-card=task")
  assert.deepEqual(codesOf(tree), ["pending", "in_progress", "done"], "逐行码面 = 原始码逐位同序")
  assert.deepEqual(texts(tree), ["第一步", sentinel("sub.queued"), "第二步", sentinel("sub.running"), "第三步", sentinel("sub.done")], "逐行 = 标题串原样 + 状态词（词面经 t()）")
  // #460：事项行两段逐段包元素（裸文本子 ⇒ 行 `justify-content: space-between` 数学上不可达；缺席段零节点）
  const rowSegs = (row) => nodes(row).filter((node) => node.props?.["data-seg"] !== undefined).map((node) => node.props["data-seg"])
  assert.deepEqual(rowsOf(tree).map(rowSegs), [["title", "status"], ["title", "status"], ["title", "status"]], "行段码序 = title / status（逐行同形）")
  assert.equal(rowsOf(tree).every((row) => rowSegs(row).length === row.children.length), true, "行子节点**全为** `[data-seg]` 元素")
  assert.deepEqual(rowSegs(rowsOf(planTree([{ title: "x" }]))[0]), ["title"], "状态码缺 ⇒ 状态段零节点（段数 = 在场段数）")
  assert.deepEqual(texts(planTree([{ title: "x", status: "blocked" }])), ["x"], "表外码 ⇒ 零状态词节点（沿表外降级）")
  assert.deepEqual(codesOf(planTree([{ title: "x", status: "blocked" }])), ["blocked"], "表外码仍上属性（码面 ≠ 词面）")
  assert.deepEqual(codesOf(planTree([{ title: "x" }])), [undefined], "码缺 ⇒ 零属性（零假造）")

  // ③ 事件驱动落位：ev:task 归约 ⇒ 卡入位（序首 = 首卡之前 ⇒ 无更序卡 ⇒ 药丸之前 ⇒ 末位）
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const flow = fake.element("div")
  flow.setAttribute("data-slot", "flow")
  const first = planOn(blank(), PLAN)
  assert.equal(mountCards(flow, first, {}), 1, "在场族数 = 1（计划族）")
  const cardOf = () => flow.querySelector('[data-card="task"]')
  assert.equal(cardOf().getAttribute("data-card"), "task", "落点面：卡根锚在位")
  assert.deepEqual(cardOf().querySelectorAll("[data-status]").map((node) => node.getAttribute("data-status")), ["pending", "in_progress", "done"], "落点面：逐行码面同序")

  // ④ 帧内幂等：等值重挂 ⇒ 活树零写（签名三面全等 · 节点不重建 · 零重排）
  const keptRefs = flatRefs(cardOf())
  const keptKids = flow.children.slice()
  const mark = fake.mark()
  assert.equal(mountCards(flow, planOn(blank(), PLAN), {}), 1, "等值重挂 ⇒ 在场族数不变")
  assert.equal(fake.delta(mark).text, 0, "零文本写（标签刷写路未走）")
  assert.equal(sameRefs(flatRefs(cardOf()), keptRefs), true, "活树引用序全等（逐位 === ⇒ 零重建 / 零重排）")
  assert.equal(sameRefs(flow.children, keptKids), true, "flow 子序引用不变（零摘零插）")

  // ⑤ 同 key 就地替换：新载荷整卡替换 —— 不叠卡 · 旧行零残留
  const next = planOn(first, [{ title: "第四步", status: "done" }])
  assert.equal(mountCards(flow, next, {}), 1, "同 key 替换 ⇒ 仍单族")
  assert.equal(flow.querySelectorAll('[data-card="task"]').length, 1, "不叠卡（族内单槽）")
  assert.deepEqual(cardOf().querySelectorAll("[data-status]").map((node) => node.getAttribute("data-status")), ["done"], "行面随新载荷")
  assert.equal(cardOf().textContent.includes("第四步"), true, "新标题在场")
  assert.equal(cardOf().textContent.includes("第一步"), false, "旧行零残留")

  // ⑥ 空列表 ⇒ 卡离场（零节点 · 零残留）
  assert.equal(mountCards(flow, planOn(next, []), {}), 0, "空列表 ⇒ 零族（卡不在场）")
  assert.equal(cardOf(), null, "卡节点摘净（零残留）")
})
