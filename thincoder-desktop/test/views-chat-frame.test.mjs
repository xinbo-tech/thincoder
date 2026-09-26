/**
 * views-chat-frame.test.mjs — E-3 对话流帧面用例（批档 §2.4 U71 · 原住 `test/views-chat.test.mjs`）：
 * 待决项源（`state.pool.approvals` 切片 · 空 / 一 / 二逐位）/ 卡居块后药丸前（无卡 ⇒ 药丸之前）/ 假根态刷幂等（在场帧零写 ·
 * 卡在场 ↔ 缺席两向）/ 同 `prompt-id` 文本变就地换 / 帧尾六步（append 档插点 ∧ 头动作补偿写 ∧ 非跟滚零写）。
 * 拆档理由 = 档行预算（`docs/desktop/design/PROJECT.md` §4.1「300 行 = 主动拆分层」）——面不变、判据不变，只换宿主档；
 * 树面（U58–U62）留 `test/views-chat.test.mjs`。
 * 判据面 = 帧面**落点**（`chatModel` / `chatTree` / `mountChat` / `syncChrome` / `settleFrame` · 假 DOM = `test/fake-dom.mjs`：
 * 描述符 → 节点那一段机检，不靠人工走查）。词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证
 * 「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { chatModel, chatTree, mountChat, settleFrame, syncChrome } from "../renderer/views/chat.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

/** 词面哨兵：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = {
  "chat.pill.new": "⟦new:${n}⟧",
  "chat.summary.older": "⟦older:${n}⟧",
  "chat.tool.changes": "⟦chg:${files}+${add}-${del}⟧",
  "chat.tool.duration": "⟦dur:${seconds}⟧",
}
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error"]

function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => initDict({}))
}

/** 帧态夹具（只给判据消费的键）：`activeSession` 非空 ⇒ 有会话（有块面另给 `blocks`）。 */
const state = (over = {}) => ({
  activeSession: "s1",
  blocks: [],
  history: { hasOlder: false, inFlight: false, page: null },
  following: true,
  pendingNew: 0,
  locale: "en",
  ...over,
})
const user = (over = {}) => ({ kind: "user", text: "问题", ...over })

// ─── U71 帧面（待决项源 ∧ 子序 ∧ 态刷幂等 ∧ 帧尾六步）────────────

test("U71: 帧面（待决项源 ∧ 卡居块后药丸前 ∧ syncChrome 幂等 ∧ 文本变就地换 ∧ settleFrame 六步 · 假根）", (ctx) => {
  setupDict(ctx)
  const item = { shape: "single", promptId: "p1", tool: "Bash", argsSummary: "npm test" }
  const item2 = { ...item, promptId: "p2", argsSummary: "npm run build" }
  const u = (id) => user({ id, text: `文本 ${id}` })

  // ① 待决项源 = `state.pool.approvals` 切片（缺 / 非数组 / none ⇒ 空表 —— 禁假数据）
  const model = chatModel(state({ blocks: [u("u1")], pool: { approvals: [item] }, following: false, pendingNew: 1 }))
  assert.deepEqual(model.approval, [item], "待决项源 = state.pool.approvals（切片直取 —— 渲染面零推导）")
  assert.deepEqual(chatModel(state({ blocks: [u("u1")], pool: { approvals: [item, item2] } })).approval, [item, item2], "二项 ⇒ 逐位按序（切片原样 —— 渲染面零重排）")
  assert.deepEqual(chatModel(state({ blocks: [u("u1")], pool: { approvals: "x" } })).approval, [], "非数组 ⇒ 空表（零卡）")
  assert.deepEqual(chatModel(state({ blocks: [u("u1")] })).approval, [], "槽位缺 ⇒ 空表")
  assert.deepEqual(chatModel(state({ blocks: [u("u1")], pool: { approvals: [item] }, activeSession: null })).approval, [], "none ⇒ 空表（不落 stale 卡）")

  // ② 子序 = [摘要?] → 块序列 → [卡?] → [药丸?]；卡 = 非块节点（不破 data-blocks 不变式）
  const ordered = chatTree(chatModel(state({ blocks: [u("u1"), u("u2")], pool: { approvals: [item] }, following: false }), 1))
  const roleOf = (node) => node.props["data-block-kind"] !== undefined ? "block"
    : node.props["data-card"] !== undefined ? "card"
    : node.props["data-summary"] !== undefined ? "summary"
    : node.props["data-pill"] !== undefined ? "pill" : node.props.class
  assert.deepEqual(ordered.children.map(roleOf), ["summary", "block", "card", "pill"], "子序 = 摘要 → 块 → 卡 → 药丸（卡恒居块后药丸前）")
  assert.equal(ordered.props["data-blocks"], 1, "data-blocks = 块节点数（卡不入账 —— 非块节点）")
  assert.equal(ordered.props["data-hidden"], 1, "窗越限 ⇒ data-hidden 随 visibleWindow")
  assert.deepEqual(chatTree(chatModel(state({ blocks: [], pool: { approvals: [item] } }))).children.map(roleOf), ["chat-empty", "card"], "零块 ⇒ 空态提示 + 卡仍在场（两判据独立）")
  const pair = chatTree(chatModel(state({ blocks: [u("u1")], pool: { approvals: [item, item2] }, following: false })))
  assert.deepEqual(pair.children.map(roleOf), ["block", "card", "card", "pill"], "二项 ⇒ 两卡逐位按序（卡恒居块序之后 · 药丸之前）")
  assert.deepEqual(pair.children.map((node) => node.props["data-prompt-id"]).filter((id) => id !== undefined), ["p1", "p2"], "卡序 = 待决项序（data-prompt-id 逐位）")
  assert.deepEqual(chatTree(chatModel(state({ activeSession: null, pool: { approvals: [item] } }))).children, [], "none ⇒ 零节点（卡亦无）")

  // ③ 帧面落点（假根）：挂载 → 态刷幂等 → 帧尾六步
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档 —— 载体自身不静默失效）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("div")
  root.setAttribute("data-slot", "flow")
  const first = state({ blocks: [u("u1"), u("u2")], pool: { approvals: [item] }, following: true })
  const { model: mountedModel, mounted } = mountChat(root, first)
  assert.equal(root.getAttribute("data-slot"), "flow", "宿主 data-slot 保留（槽位零改）")
  assert.equal(root.getAttribute("data-blocks"), "2", "四锚复制到宿主（data-blocks）")
  assert.deepEqual(mounted.map((pair) => pair.block), mountedModel.blocks, "回执逐位 = 可见块（DOM ≡ visible）")
  assert.equal(mounted[0].node.getAttribute("data-block-id"), "u1", "回执节点 = DOM 块节点")
  assert.equal(root.querySelectorAll('[data-card="approval"]').length, 1, "卡恰一枚")
  assert.deepEqual(mountChat(null, first).mounted, [], "容器缺位 ⇒ 模型照给 · 零节点")

  const steady = fake.mark()
  syncChrome(root, mountedModel, {})
  assert.equal(fake.delta(steady).text, 0, "在场帧零文本写（卡等价不刷 ⇒ 不写标签）")
  const kids = root.children.slice()
  const cardNode = root.querySelector('[data-card="approval"]')
  syncChrome(root, mountedModel, {})
  assert.deepEqual(root.children.map((kid, index) => kid === kids[index]), [true, true, true], "节点引用不变（卡在阵 · 在位）")
  assert.equal(root.querySelector('[data-card="approval"]'), cardNode, "卡面等价 ⇒ 引用不变（零替换 —— 在场树零写；同步面为比较而建的那棵子树不入本判）")

  // ③a 同 `prompt-id` 文本变（输入列第二态）：等价判据三面任一不等 ⇒ 就地换 —— 卡序原位 ∧ 邻位零改写
  //（同步面为比较而建的那棵子树不入本判 —— 同 ③ 口径；本段判「卡面换 / 邻位零改写」两观测面）
  const changed = chatModel(state({ blocks: [u("u1"), u("u2")], pool: { approvals: [{ ...item, argsSummary: "npm run build" }] }, following: true }))
  syncChrome(root, changed, {})
  const cardNext = root.querySelector('[data-card="approval"]')
  assert.notEqual(cardNext, cardNode, "文本变 ⇒ 卡换节点（等价判据含文本面）")
  assert.equal(cardNext.textContent.includes("npm run build"), true, "新参数摘要入场（文本面随判据）")
  assert.equal(root.querySelectorAll('[data-card="approval"]').length, 1, "换后卡恰一枚（不叠加）")
  assert.equal(root.children.length, kids.length, "子序长度不变（就地换 —— 零增删）")
  assert.equal(root.children.indexOf(cardNode), -1, "旧卡离场（零残留）")
  assert.deepEqual(root.children.slice(0, 2), kids.slice(0, 2), "块节点零改写（卡序原位 = 块后 · 药丸前）")

  // ③c 卡在场 ↔ 缺席（同根两向）：缺席 ⇒ 卡摘净 ∧ 块零改写；复入（且停药丸）⇒ 卡插在药丸之前
  syncChrome(root, chatModel(state({ blocks: [u("u1"), u("u2")], following: false })), {})
  assert.equal(root.querySelectorAll('[data-card="approval"]').length, 0, "待决项空 ⇒ 卡离场（零残留）")
  assert.deepEqual(root.children.slice(0, 2), kids.slice(0, 2), "摘卡不动块（块节点零改写）")
  syncChrome(root, chatModel(state({ blocks: [u("u1"), u("u2")], pool: { approvals: [item] }, following: false })), {})
  const pillHere = root.querySelector("[data-pill]")
  const cardBack = root.querySelector('[data-card="approval"]')
  assert.equal(root.children.length, 4, "复入 ⇒ 卡 + 药丸同在（逐位入位）")
  assert.equal(root.children.indexOf(cardBack) < root.children.indexOf(pillHere), true, "复入插点 = 药丸之前（卡恒居块序之后）")

  // ③b 幂等帧（零卡 / 零摘要 / 跟滚无药丸）⇒ 零结构写 ∧ 零文本写
  const bare = fake.element("div")
  bare.setAttribute("data-slot", "flow")
  const { model: bareModel } = mountChat(bare, state({ blocks: [u("u1"), u("u2")], following: true }))
  const bareKids = bare.children.slice()
  const tick = fake.mark()
  syncChrome(bare, bareModel, {})
  assert.deepEqual(fake.delta(tick), { structural: 0, text: 0, attr: 4 }, "无卡帧 ⇒ 零结构写 ∧ 零文本写（attr = 四根锚恒写 —— 不入幂等判）")
  const tick2 = fake.mark()
  syncChrome(bare, bareModel, {})
  assert.deepEqual(fake.delta(tick2), { structural: 0, text: 0, attr: 4 }, "再刷仍零（刷新面幂等）")
  assert.deepEqual(bare.children.map((kid, index) => kid === bareKids[index]), [true, true], "节点引用不变（零摘零插）")

  // ④ 帧尾 append 档：尾段插点 = 首卡之前 + 跟滚贴底
  const frameRoot = fake.element("div")
  frameRoot.scrollHeight = 500
  mountChat(frameRoot, state({ blocks: [u("u1"), u("u2")], pool: { approvals: [item] }, following: true }))
  const nextModel = chatModel(state({ blocks: [u("u1"), u("u2"), u("u3")], pool: { approvals: [item] }, following: true }))
  const back = settleFrame(frameRoot, nextModel, null, { evict: 0, prepend: 0, tail: [u("u3")], ok: true }, "append", {})
  const ids = () => frameRoot.querySelectorAll("[data-block-kind]").map((node) => node.getAttribute("data-block-id"))
  assert.deepEqual(ids(), ["u1", "u2", "u3"], "尾段入位 ⇒ 块序不变（尾插）")
  const order = frameRoot.children
  const tailNode = frameRoot.querySelectorAll("[data-block-kind]").at(-1)
  assert.equal(order.indexOf(frameRoot.querySelector('[data-card="approval"]')) > order.indexOf(tailNode), true, "卡恒居块序之后（插点 = 首卡之前）")
  assert.deepEqual(back.map((pair) => pair.block), nextModel.blocks, "帧回执 = DOM 重建对齐序（逐位）")
  assert.equal(frameRoot.scrollTop, 500, "跟滚 ⇒ 贴底写 scrollTop = scrollHeight")
  assert.deepEqual(settleFrame(null, nextModel, null, null, "append", {}), [], "容器缺位 ⇒ 零回执（零抛）")

  // ④b 无卡帧尾 append：插点 = 药丸之前（两锚皆缺 ⇒ 末位）
  const pillOnly = fake.element("div")
  pillOnly.setAttribute("data-slot", "flow")
  mountChat(pillOnly, state({ blocks: [u("u1")], following: false }))
  const grownTail = chatModel(state({ blocks: [u("u1"), u("u2")], following: false }))
  settleFrame(pillOnly, grownTail, null, { evict: 0, prepend: 0, tail: [u("u2")], ok: true }, "append", {})
  const tailNode2 = pillOnly.querySelectorAll("[data-block-kind]").at(-1)
  const pillNode2 = pillOnly.querySelector("[data-pill]")
  assert.equal(pillOnly.children.indexOf(tailNode2) < pillOnly.children.indexOf(pillNode2), true, "无卡 ⇒ 尾块插在药丸之前")
  assert.equal(pillOnly.children.at(-1), pillNode2, "药丸仍居末（插点不夺药丸位）")

  // ⑤ 帧尾头动作 + 非跟滚 ⇒ 补偿写（两次读数：t0 先于态刷 / 头动作，t1 其后）
  const headRoot = fake.element("div")
  headRoot.scrollHeight = 400
  headRoot.scrollTop = 120
  mountChat(headRoot, state({ blocks: [u("u2"), u("u3")], following: false }))
  const readings = [
    { scrollTop: 100, scrollHeight: 300, clientHeight: 200 },
    { scrollTop: 100, scrollHeight: 350, clientHeight: 200 },
  ]
  const scroll = { readMetrics: () => readings.shift() ?? { scrollTop: 100, scrollHeight: 350, clientHeight: 200 } }
  const grown = chatModel(state({ blocks: [u("u0"), u("u1"), u("u2"), u("u3")], following: false }))
  const oldHead = headRoot.querySelector('[data-block-id="u2"]')
  const headBack = settleFrame(headRoot, grown, scroll, { evict: 0, prepend: 2, tail: [], ok: true }, "none", {})
  assert.equal(readings.length, 0, "读数恰两次（t0 / t1 —— 假读口两次耗尽）")
  assert.deepEqual(headRoot.querySelectorAll("[data-block-kind]").map((node) => node.getAttribute("data-block-id")), ["u0", "u1", "u2", "u3"], "前插两枚 ⇒ 新头居旧头之前")
  assert.equal(headRoot.querySelector('[data-block-id="u2"]'), oldHead, "旧头节点零改写（引用不变 —— 仅位置后移）")
  assert.equal(headRoot.scrollTop, 150, "非跟滚 ∧ 头动作 > 0 ⇒ 补偿写 = prevTop + (t1 高 − t0 高)")
  assert.equal(headBack.length, 4, "帧回执 = 四枚对齐")
  const quiet = fake.mark()
  headRoot.scrollTop = 42
  const pillNode = headRoot.querySelector("[data-pill]")
  settleFrame(headRoot, grown, { readMetrics: () => ({ scrollTop: 42, scrollHeight: 400, clientHeight: 200 }) }, { evict: 0, prepend: 0, tail: [], ok: true }, "none", {})
  assert.equal(headRoot.scrollTop, 42, "非跟滚 ∧ 零头动作 ⇒ 帧尾零写（scrollTop 原地）")
  assert.deepEqual(fake.delta(quiet), { structural: 0, text: 1, attr: 4 }, "静帧：零结构写 + 在场药丸标签恰一刷（控件文本就写 —— 不做等价比较）+ 四锚恒写")
  assert.equal(headRoot.querySelector("[data-pill]"), pillNode, "药丸节点引用不变（零重建）")
})
