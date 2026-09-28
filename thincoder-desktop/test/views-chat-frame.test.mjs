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
import { setStrings } from "/rc/i18n.mjs"
import { HOST_DICT, initDict, setStringsSink, t } from "../renderer/i18n.mjs"
import { chatModel, chatTree, mountChat, settleFrame } from "../renderer/views/chat.mjs"
import { focusAutofocus, syncChrome } from "../renderer/views/chat-chrome.mjs"
import { bindFileLinks, fileLinkOf, linkifyResult } from "../renderer/views/chat-tool.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

/** 词面哨兵：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = {
  "chat.pill.new": "⟦new:${n}⟧",
  "chat.summary.older": "⟦older:${n}⟧",
  "chat.tool.changes": "⟦chg:${files}+${add}-${del}⟧",
  "chat.tool.duration": "⟦dur:${seconds}⟧",
}
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error", "status.thinking", "status.stopped"]
/** 「对齐第三批」新键（词面住 `renderer/i18n.mjs`）：用例缝自携哨兵 ⇒ 词面到位前后判据同形。 */
const NEW_WORD_KEYS = ["error.retry", "tool.interrupted", "welcome.heading", "welcome.text", "welcome.textConfigured", "welcome.shortcuts"]

function setupDict(ctx) {
  const host = Object.fromEntries([...Object.keys(HOST_DICT.en), ...NEW_WORD_KEYS].map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  // 核件取词接线（「对齐第二批」项 3 / 4 · 修复轮择形（c））：注册单点 = 生产里 `renderer/app.mjs`；用例同径注册
  // ⇒ 核件 `t()`（`paintLabel` / `markPending` / `renderSubBlock` 族）经注册端取词
  setStringsSink(setStrings)
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => { initDict({}); setStringsSink(null) })
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

  // ② 子序 = [引导?] → [摘要?] → 块序列 → [卡?] → [药丸?]；卡 = 非块节点（不破 data-blocks 不变式）
  const ordered = chatTree(chatModel(state({ blocks: [u("u1"), u("u2")], pool: { approvals: [item] }, following: false }), 1))
  const roleOf = (node) => node.props["data-block-kind"] !== undefined ? "block"
    : node.props["data-card"] !== undefined ? "card"
    : node.props["data-summary"] !== undefined ? "summary"
    : node.props["data-pill"] !== undefined ? "pill" : node.props.class
  assert.deepEqual(ordered.children.map(roleOf), ["summary", "block", "card", "pill"], "子序 = 摘要 → 块 → 卡 → 药丸（卡恒居块后药丸前）")
  assert.equal(ordered.props["data-blocks"], 1, "data-blocks = 块节点数（卡不入账 —— 非块节点）")
  assert.equal(ordered.props["data-hidden"], 1, "窗越限 ⇒ data-hidden 随 visibleWindow")
  assert.deepEqual(chatTree(chatModel(state({ blocks: [], pool: { approvals: [item] } }))).children.map(roleOf), ["chat-empty", "card"], "零块 ⇒ 引导节点（空态文案）+ 卡仍在场（两判据独立）")
  const pair = chatTree(chatModel(state({ blocks: [u("u1")], pool: { approvals: [item, item2] }, following: false })))
  assert.deepEqual(pair.children.map(roleOf), ["block", "card", "card", "pill"], "二项 ⇒ 两卡逐位按序（卡恒居块序之后 · 药丸之前）")
  assert.deepEqual(pair.children.map((node) => node.props["data-prompt-id"]).filter((id) => id !== undefined), ["p1", "p2"], "卡序 = 待决项序（data-prompt-id 逐位）")
  assert.deepEqual(chatTree(chatModel(state({ activeSession: null, pool: { approvals: [item] } }))).children.map(roleOf), ["chat-empty"], "none ⇒ 根唯一子 = 引导节点（零块节点 · 卡亦无）")

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

  // ⑥ 说话人标签落笔（「对齐第二批」项 4 · 假根）：用户块 = 核 `paintLabel`（❯ user: [+ ts]）∥ 助手回合首块 = 端侧同字面
  const labelRoot = fake.element("div")
  labelRoot.setAttribute("data-slot", "flow")
  const labeled = state({ blocks: [user({ id: "u1", text: "问", ts: 1730000000000 }), { kind: "assistant", id: "a1", text: "答" }, { kind: "assistant", id: "a2", text: "又答" }] })
  mountChat(labelRoot, labeled)
  const [uNode, aNode, a2Node] = labelRoot.querySelectorAll("[data-block-kind]")
  assert.equal(uNode.querySelector(".msg-label").innerHTML.startsWith("❯ ⟦msg.user⟧:"), true, "用户标签 = 核 `paintLabel` 字面（❯ <msg.user>:）")
  assert.equal(uNode.querySelector(".msg-label").innerHTML.includes('class="msg-time"'), true, "ts 在场 ⇒ 时间段落笔")
  assert.equal(aNode.querySelector(".msg-label").textContent, "⟦msg.assistant⟧", "助手回合首块标签 = 端侧同字面（词键 msg.assistant）")
  assert.equal(a2Node.querySelector(".msg-label"), null, "同回合后续块零标签（判据单源 = 回合首）")
  const labelMark = fake.mark()
  syncChrome(labelRoot, chatModel(labeled), {})
  assert.deepEqual(fake.delta(labelMark), { structural: 0, text: 0, attr: 4 }, "标签帧幂等（`_labelPainted` 记账 —— 再刷零写）")
  const noTsRoot = fake.element("div")
  mountChat(noTsRoot, state({ blocks: [{ kind: "user", id: "u9", text: "问二" }] }))
  assert.equal(noTsRoot.querySelector(".msg-label").innerHTML, "❯ ⟦msg.user⟧:", "无 ts ⇒ 零时间段（「无 ts 不显示」同判据）")

  // ⑦ 待发送气泡组（「对齐第二批」项 2 · 假根）：在场 ⟺ 本会话队非空 · 项数 = 队长 · 核原语落笔 · 交接同帧
  const pendingRoot = fake.element("div")
  pendingRoot.scrollHeight = 500
  const waiting = state({ blocks: [u("u1")], pending: { s1: [{ text: "排一", ts: 1 }, { text: "排二", ts: 2 }] } })
  mountChat(pendingRoot, waiting)
  const group = pendingRoot.querySelector("[data-pending]")
  assert.equal(group !== null, true, "队非空 ⇒ 组在场")
  assert.equal(group.children.length, 2, "项数 = 队长（逐条气泡）")
  const bubbles = pendingRoot.querySelectorAll("[data-pending-item]")
  assert.deepEqual(bubbles.map((node) => node.classList.contains("pending")), [true, true], "核 `markPending` 落类（幂等原语）")
  assert.deepEqual(bubbles.map((node) => node.querySelector(".msg-label").innerHTML), ["⏳ ⟦queued.pending⟧", "⏳ ⟦queued.pending⟧"], "待发送标签两态之一 = ⏳ + 核键值")
  assert.equal(bubbles[0].querySelector("[data-raw]").getAttribute("data-raw"), "排一", "气泡文本面 = `text` 逐字（与用户块同面）")
  assert.equal(bubbles[0].querySelector('[data-action="chat:copy-block"]'), null, "零复制控件（未受理 —— 诚实面）")
  assert.equal(pendingRoot.children.indexOf(group) > pendingRoot.children.indexOf(pendingRoot.querySelector("[data-block-kind]")), true, "组居块序列之后")
  // 交接同帧（回合尾受理）：队首出场 ∧ 用户块入场 —— 同帧；块插在组之前（位置零跳）
  const tailUser = { kind: "user", text: "排一", ts: 1 }
  const next = state({ blocks: [u("u1"), tailUser], pending: { s1: [{ text: "排二", ts: 2 }] } })
  settleFrame(pendingRoot, chatModel(next), null, { evict: 0, prepend: 0, tail: [tailUser], ok: true }, "append", {})
  assert.equal(pendingRoot.querySelector("[data-pending]").children.length, 1, "交接同帧：组剩 1 项（队首出场）")
  const tail = pendingRoot.querySelectorAll("[data-block-kind]").at(-1)
  assert.equal(tail.getAttribute("data-block-kind"), "user", "交接同帧：尾块 = user（同帧入流）")
  assert.equal(tail.querySelector(".msg-label").innerHTML.startsWith("❯ ⟦msg.user⟧:"), true, "尾块标签转正（核原语同笔）")
  assert.equal(pendingRoot.children.indexOf(tail) < pendingRoot.children.indexOf(pendingRoot.querySelector("[data-pending]")), true, "块恒居组之前（交接位置零跳）")
  mountChat(pendingRoot, state({ blocks: [u("u2")], pending: { s1: [] } }))
  assert.equal(pendingRoot.querySelector("[data-pending]"), null, "队空 ⇒ 组退场（零残留）")

  // ⑧ 归档子 agent 块（「对齐第二批」项 5 · 假根）：壳 + 核件回显补装（冻结形 `[✓ …]` + tail-3）—— 冻结块静态
  const archRoot = fake.element("div")
  const snapshot = {
    kind: "subagent",
    meta: {
      key: "sub:coder#9", label: "coder#9", role: "coder", id: 9, model: "glm-5.3", startedAt: Date.now(),
      doneAt: Date.now(), frozen: true, status: "done", region: "flow", turn: 2, maxTurns: 8, pool: true,
    },
    rows: [{ kind: "text", text: "尾部行" }],
  }
  const archBlock = { kind: "subagent", meta: snapshot.meta, rows: snapshot.rows }
  const { model: archModel } = mountChat(archRoot, state({ blocks: [archBlock] }))
  assert.equal(archRoot.getAttribute("data-blocks"), "1", "归档块计入 `data-blocks`（运行期块入块序）")
  const shellNode = archRoot.querySelector('[data-block-kind="subagent"]')
  assert.equal(shellNode.getAttribute("class").includes("block-subagent"), true, "壳 = 零边距透传容器")
  const echo = shellNode.querySelector(".advisor-block")
  assert.equal(echo !== null, true, "核件元素补装（details.advisor-block）")
  assert.equal(echo.classList.contains("sub-block"), true, "核件类名面（sub-block）")
  assert.equal(echo.classList.contains("sub-frozen"), true, "冻结形（终态折叠）")
  assert.equal(echo.open, false, "折叠可展开（内容留场）")
  assert.equal(echo.querySelector(".sub-hdr").textContent.startsWith("[✓ coder#9"), true, `冻结头形（实 = ${echo.querySelector(".sub-hdr").textContent}）`)
  assert.equal(echo.querySelector(".sub-tail").textContent.includes("│ 尾部行"), true, "tail-3 留场（内容单留存处 = rows）")
  assert.equal(echo.querySelector(".sub-stop-btn"), null, "冻结 ⇒ 零 ⏹")
  settleFrame(archRoot, archModel, null, { evict: 0, prepend: 0, tail: [], ok: true }, "none", {})
  assert.equal(archRoot.querySelector(".advisor-block"), echo, "再帧 ⇒ 同回显元素（冻结块静态 —— 零重建 / 零重放）")
  assert.equal(archRoot.querySelectorAll(".advisor-text").length, 1, "内容行不翻倍（幂等）")
  assert.equal(archRoot.querySelectorAll("[data-block-kind]").length, 1, "块节点恰一（回显为块内子节点）")
})

// ─── U205 「对齐第三批」对话流面（停止痕 / 台账行组 / 错误横幅（详情 + 重试）/ 真置焦 / 文件链接着装）──

test("U205: 「对齐第三批」帧面 —— 停止痕 ∧ 台账行组 ∧ 错误横幅（详情 + 重试）∧ 真置焦 ∧ 文件链接（着装 / 委托）", (ctx) => {
  setupDict(ctx)
  const base = state({ blocks: [user({ id: "u1" })] })

  // ① 模型四字段（项 6 / 12 / 9 / 15）：本键切片判据 · 零 stale · 三态归一
  assert.deepEqual([chatModel(base).stopped, chatModel(base).ledger], [false, null], "无痕 / 无行集 ⇒ 两判据假 / 空")
  assert.equal(chatModel({ ...base, stopMark: { s1: true } }).stopped, true, "本键痕 ⇒ 停止痕在场")
  assert.equal(chatModel({ ...base, stopMark: { s9: true } }).stopped, false, "他键痕 ⇒ 零扰")
  assert.equal(chatModel({ ...base, activeSession: null, stopMark: { s1: true } }).stopped, false, "none ⇒ 不在场（不落 stale）")
  const lines = [{ text: "台账行一", warn: false }, { text: "台账行二", warn: true }]
  assert.deepEqual(chatModel({ ...base, ledgerLines: { s1: lines } }).ledger, lines, "本键行集直取（逐字 —— 端侧零构造）")
  assert.equal(chatModel({ ...base, ledgerLines: { s1: [] } }).ledger, null, "空行集 ⇒ 零组（禁假造）")
  assert.equal(chatModel({ ...base, ledgerLines: { s9: lines } }).ledger, null, "他键行集 ⇒ 零扰")
  assert.equal(chatModel(base).canRetry, true, "有 `user` 块 ⇒ 重试钮判据真（源 = 全量块表 —— 非窗口切片）")
  assert.equal(chatModel({ ...base, blocks: [{ kind: "assistant", text: "x" }] }).canRetry, false, "无 `user` 块 ⇒ 零钮")
  assert.equal(chatModel({ ...base, blocks: [{ kind: "user", text: 7 }] }).canRetry, false, "`user` 块文本非串 ⇒ 零钮（与出口同谓词 —— 防可点静默）")
  assert.deepEqual([chatModel({ ...base, settings: { configured: true } }).configured, chatModel({ ...base, settings: { configured: null } }).configured], [true, false], "`configured` 三态：真 ⇒ 真 ∥ 未知 / 未配 ⇒ 假（禁假造）")

  // ② 树面：三尾组落点（族内序 = 消化行组 → 停止痕 → 台账行 → 待发送组）+ 行面（逐行 / `warn` 加类 / 词面）
  const rootOf = (over = {}) => chatTree(chatModel(state({ blocks: [user({ id: "u1" })], digest: { s1: { status: "start", n: 1 } }, pending: { s1: [{ text: "排", ts: 1 }] }, ...over })))
  const roleOf = (node) => node.props["data-block-kind"] !== undefined ? "block"
    : node.props["data-digest"] !== undefined ? "digest"
    : node.props["data-stopped"] !== undefined ? "stopped"
    : node.props["data-ledger"] !== undefined ? "ledger"
    : node.props["data-pending"] !== undefined ? "pending" : node.props.class
  assert.deepEqual(rootOf().children.map(roleOf), ["block", "digest", "pending"], "基线：块 → 消化行组 → 待发送组（两新组缺席 ⇒ 零节点）")
  const full = rootOf({ stopMark: { s1: true }, ledgerLines: { s1: lines } })
  assert.deepEqual(full.children.map(roleOf), ["block", "digest", "stopped", "ledger", "pending"], "族内序 = 消化行组 → 停止痕 → 台账行 → 待发送组（落点 = 块序列之后 · 待发送组之前）")
  assert.equal(full.props["data-blocks"], 1, "两新组 = 非块节点（`data-blocks` 不变式不破）")
  const stoppedTree = full.children[2]
  assert.equal(stoppedTree.children[0], t("status.stopped"), "痕词 = 核键 `status.stopped` 直取（两语逐字 —— 端侧零新键）")
  const ledgerTree = full.children[3]
  assert.deepEqual(ledgerTree.children.map((row) => row.props["data-ledger-line"]), ["", ""], "逐行 `[data-ledger-line]`")
  assert.deepEqual(ledgerTree.children.map((row) => row.props.class), ["ledger-line", "ledger-line warn"], "类名面 = 核行产口径（`warn` 加类）")
  assert.deepEqual(ledgerTree.children.map((row) => row.children[0]), ["台账行一", "台账行二"], "行文逐字（端侧零构造）")

  // ③ 帧面（假根）：痕 / 组建 · 组换代 · 摘除 —— 三态逐径 + 插点锚定
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("div")
  const pendingOf = (over = {}) => state({ blocks: [user({ id: "u1" })], pending: { s1: [{ text: "排", ts: 1 }] }, ...over })
  mountChat(root, pendingOf())
  assert.deepEqual([root.querySelector("[data-stopped]"), root.querySelector("[data-ledger]")], [null, null], "基线：两新组零节点")
  syncChrome(root, chatModel(pendingOf({ stopMark: { s1: true } })))
  const mark = root.querySelector("[data-stopped]")
  assert.equal(mark !== null, true, "痕入场（帧尾建组）")
  assert.equal(root.children.indexOf(mark) < root.children.indexOf(root.querySelector("[data-pending]")), true, "痕插点 = 待发送组之前")
  assert.equal(mark.textContent, t("status.stopped"), "痕词面（帧面与树面同源）")
  syncChrome(root, chatModel(pendingOf({ ledgerLines: { s1: lines } })))
  assert.equal(root.querySelector("[data-stopped]"), null, "痕退场（判据空 ⇒ 摘净）")
  const group = root.querySelector("[data-ledger]")
  assert.equal(group.querySelectorAll("[data-ledger-line]").length, 2, "台账行组入场（逐行节点）")
  assert.equal(group.children[1].getAttribute("class"), "ledger-line warn", "`warn` 行类名面")
  syncChrome(root, chatModel(pendingOf({ ledgerLines: { s1: [lines[0]] } })))
  assert.equal(root.querySelector("[data-ledger]").children.length, 1, "行集换代 ⇒ 原位换（逐字更新 · 不叠加）")
  syncChrome(root, chatModel(pendingOf()))
  assert.deepEqual([root.querySelector("[data-ledger]"), root.querySelector("[data-stopped]")], [null, null], "两判据空 ⇒ 双向摘净（零残留）")
  assert.equal(root.querySelectorAll("[data-block-kind]").length, 1, "帧刷不动块面（两新组 = 非块节点）")

  // ④ 错误横幅（项 9）：`.error-text` + `details`（`techInfo` 在场才落）+ 重试钮（在场 ⟺ 末 `user` 块在场）
  const errorBlocks = (over = {}) => [user({ id: "u1" }), { kind: "error", id: "e1", text: "崩", ...over }]
  const banner = chatTree(chatModel(state({ blocks: errorBlocks({ techInfo: "at x" }) })), { onRetry: () => {} })
  const errNode = banner.children.find((node) => node.props["data-block-kind"] === "error")
  const byClass = (node, cls) => node.children.find((child) => String(child.props?.class ?? "").split(" ").includes(cls))
  assert.equal(errNode.children[0].props.class, "msg-label", "回合首块 ⇒ 说话人标签容器在首（头形不动）")
  assert.equal(byClass(errNode, "error-text").props["data-raw"], "崩", "文面类名 = `.error-text`（横幅形 —— 原文锚同文本面）")
  const details = byClass(errNode, "error-details")
  assert.deepEqual([details.tag, details.children.map((child) => child.tag)], ["details", ["summary", "pre"]], "详情 = `details.error-details`（原生折叠：summary + pre）")
  assert.equal(details.children[1].children[0], "at x", "`techInfo` 原文入 `pre`（零解析）")
  const retryBtn = errNode.children.find((child) => child.props?.["data-action"] === "chat:retry")
  assert.deepEqual(retryBtn.children, [t("error.retry")], "重试钮机读锚 + 钮词 = 词键（值同 VSC）")
  const plainErr = chatTree(chatModel(state({ blocks: errorBlocks() }))).children.find((node) => node.props["data-block-kind"] === "error")
  assert.equal(byClass(plainErr, "error-details"), undefined, "`techInfo` 缺 ⇒ 零详情节点（禁假造）")
  assert.equal(byClass(plainErr, "error-text") !== undefined, true, "零详情 ⇒ 文面类名同形")
  const orphan = chatTree(chatModel(state({ blocks: [{ kind: "error", id: "e1", text: "崩" }] })), { onRetry: () => {} })
  assert.equal(orphan.children.some((node) => node.props["data-action"] === "chat:retry"), false, "无 `user` 块 ⇒ 零重试钮（诚实面）")
  const noHandlerErr = chatTree(chatModel(state({ blocks: errorBlocks() }))).children.find((node) => node.props["data-block-kind"] === "error")
  const noHandlerBtn = noHandlerErr.children.find((child) => child.props?.["data-action"] === "chat:retry")
  assert.equal(noHandlerBtn.props.disabled, true, "接线面句柄缺 ⇒ 钮 `disabled`（两态通则 —— 锚恒在）")

  // ⑤ 真置焦（F-置焦）：对卡内 `[data-autofocus=\"1\"]` 执行 `focus()` ∧ 幂等（非每帧抢焦）
  const focusRoot = fake.element("div")
  const focused = []
  const anchor = fake.element("button")
  anchor.setAttribute("data-autofocus", "1")
  anchor.focus = () => focused.push("anchor")
  focusRoot.append(anchor)
  focusAutofocus(focusRoot)
  assert.deepEqual(focused, ["anchor"], "帧尾对锚执行 `focus()`")
  focusAutofocus(focusRoot)
  assert.deepEqual(focused, ["anchor"], "已执行过 ⇒ 零重焦（不夺已移焦 —— 逐节点记账）")
  anchor.remove()
  focusAutofocus(focusRoot)
  assert.deepEqual(focused, ["anchor"], "锚缺席 ⇒ 零动作")
  assert.equal(focusAutofocus(null), undefined, "根缺位 ⇒ 零动作零抛")

  // ⑥ 文件链接着装（相抵② 渲染半）：核 `linkifyPaths` 消费单点（注入缝代核）；`data-path` 补锚 + 幂等
  const linkBlock = { kind: "tool", id: "t1", name: "read", status: "done", expanded: true, result: "见 C:\\p\\a.mjs 尾", links: [{ raw: "C:\\p\\a.mjs", path: "C:\\p\\a.mjs", line: 12 }] }
  const linkRoot = fake.element("div")
  const { model: linkModel } = mountChat(linkRoot, state({ blocks: [user({ id: "u0" }), linkBlock] }))
  const cardNode = linkRoot.querySelectorAll("[data-block-kind]").at(-1)
  const body = cardNode.querySelector("[data-tool-result]")
  assert.equal(body !== null, true, "结果区在场（夹具）")
  const injected = (el, links) => {
    const span = document.createElement("span")
    span.className = "file-link"
    span.textContent = links[0].raw
    el.append(span)
  }
  linkifyResult(cardNode, linkModel.blocks.at(-1), injected)
  const span = body.querySelector(".file-link")
  assert.equal(span !== null, true, "注入缝代核 `linkifyPaths`（生产缺省 = 核件）")
  assert.equal(span.getAttribute("data-path"), "C:\\p\\a.mjs", "着装面补 `data-path` 锚（值 = 链接盘上路径）")
  assert.equal(span.getAttribute("data-line"), "12", "`line` 在场 ⇒ 补 `data-line`")
  assert.equal(linkifyResult(cardNode, linkModel.blocks.at(-1), () => {}), cardNode, "幂等：回值 = 本节点（零抛）")
  assert.equal(body.querySelectorAll(".file-link").length, 1, "幂等：不重复着装")
  assert.equal(linkifyResult(cardNode, { ...linkBlock, links: [] }, injected), cardNode, "`links` 空 ⇒ 零动作（禁假造）")

  // ⑦ 文件链接出口（相抵②）：命中判据两向 + 点按 / Enter 委托（装配期一次 · 幂等）
  const linkSpan = fake.element("span")
  linkSpan.className = "file-link"
  linkSpan.setAttribute("data-path", "C:\\p\\a.mjs")
  linkSpan.setAttribute("data-line", "12")
  const plainSpan = fake.element("span")
  plainSpan.className = "plain"
  const holder = fake.element("b")
  holder.append(linkSpan)
  assert.deepEqual(fileLinkOf(holder.children[0]), { path: "C:\\p\\a.mjs", line: 12 }, "命中：自目标上溯取 `{ path, line }`")
  assert.equal(fileLinkOf(plainSpan), null, "非链接 ⇒ null")
  linkSpan.removeAttribute("data-path")
  assert.equal(fileLinkOf(linkSpan), null, "锚缺（未着装）⇒ null（零误发）")
  const wireRoot = fake.element("div")
  const opened = []
  assert.equal(bindFileLinks(wireRoot, (path, line) => opened.push([path, line])), true, "委托注册（装配期一次）")
  assert.equal(bindFileLinks(wireRoot, () => {}), false, "幂等（重复注册 ⇒ false）")
  assert.equal(bindFileLinks(null, null), false, "根 / 句柄缺 ⇒ 不注册")
  fake.fire(wireRoot, "click", { target: linkSpan })
  assert.equal(opened.length, 0, "锚缺 ⇒ 点按零动作（未着装不误发）")
  linkSpan.setAttribute("data-path", "C:\\p\\a.mjs")
  fake.fire(wireRoot, "click", { target: linkSpan })
  assert.deepEqual(opened, [["C:\\p\\a.mjs", 12]], "点按 ⇒ `open(path, line)`")
  fake.fire(wireRoot, "keydown", { key: "Enter", target: linkSpan })
  assert.equal(opened.length, 2, "Enter ⇒ 同路（键盘可达）")
  fake.fire(wireRoot, "keydown", { key: "Esc", target: linkSpan })
  assert.equal(opened.length, 2, "他键 ⇒ 零动作")
  fake.fire(wireRoot, "click", { target: plainSpan })
  assert.equal(opened.length, 2, "非链接目标 ⇒ 零动作")
})

