/**
 * views-activity.test.mjs — E-5 活动池面用例（批档 §2.2（c）+ §2.3 U72–U73 · `docs/desktop/design/UI.md` §2 项 1 池落形）：
 * 三态与三族（族序 / 空族零节点 / 条目零内容回显）+ 折叠与两读数（体零条目 ∧ 头读数仍在 ∧ `togglePool` 三支）。
 * 面 = `poolModel` / `poolTree`（**纯构树**）+ `mountPool` 薄挂载（假 DOM · `test/fake-dom.mjs`：props 复制 + 清空 + 入位，
 * 宿主 `data-slot` 保留）；折叠纯动作 = `renderer/store.mjs` 的 `togglePool`（折叠态读写闭环在本档并检）。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { mountPool, poolModel, poolTree } from "../renderer/views/activity.mjs"
import { initialState, togglePool } from "../renderer/store.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

/** 树遍历（深度优先 · 保序）：节点集 / 叶文本集共用（`null` 空位不入）。 */
function walk(tree, asText) {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (typeof child === "object" && typeof child.tag === "string") {
      if (!asText) out.push(child)
      for (const kid of Array.isArray(child.children) ? child.children : [child.children]) visit(kid)
      return
    }
    if (asText) out.push(String(child))
  }
  visit(tree)
  return out
}

const nodes = (tree) => walk(tree, false)
const texts = (tree) => walk(tree, true)
const withAttr = (tree, name) => nodes(tree).filter((node) => node.props?.[name] !== undefined)
const one = (tree, name) => withAttr(tree, name)[0]
/** 读数节点按名取（两读数同锚不同名）。 */
const readOf = (tree, name) => withAttr(tree, "data-read").find((node) => node.props["data-read"] === name)
const families = (tree) => withAttr(tree, "data-family").map((node) => node.props["data-family"])

/** 词面哨兵：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = { "approval.batch.count": "⟦batch:${count}⟧" }
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error"]

function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => initDict({}))
}

/** 帧态夹具：`pool` 三族缺省空表（供给面未落 ⇒ 零节点）。 */
function state(over = {}) {
  const { pool, ...rest } = over
  return {
    activeSession: "s1",
    activeTab: "t1",
    pool: { running: 2, approval: 1, blocks: [], queue: [], approvals: [], ...pool },
    ...rest,
  }
}
const approvalItem = (over = {}) => ({ shape: "single", promptId: "a1", tool: "Bash", argsSummary: "npm test", ...over })
const blockItem = (over = {}) => ({ tool: "Edit", status: "running", ...over })
const queueItem = (over = {}) => ({ title: "待跑任务", status: "queued", ...over })
/** 内容回显哨兵（条目零回显 ⇒ 四串皆不得入树）。 */
const ECHO = ["秘密参数", "秘密输出", "秘密正文", "秘密入参"]
const echoOf = () => ({ argsSummary: ECHO[0], result: ECHO[1], text: ECHO[2], args: ECHO[3] })

// ─── U72 池面三族与三态 ──────────────────────────────────────

test("U72: 池面三族与三态（none 零节点 / empty 提示 / 族序固定 ∧ 空族零节点 ∧ 零内容回显）", (ctx) => {
  setupDict(ctx)

  const stale = state({ activeSession: null, pool: { running: 3, approval: 2, blocks: [blockItem()] } })
  const off = poolModel(stale)
  assert.equal(off.state, "none", "无活动会话 ⇒ none（无视供给面残留）")
  assert.equal(off.blocks, stale.pool.blocks, "none 态族切片原样过路（渲染面零推导 / 零复制 —— 零节点由树面兜住）")
  assert.equal(off.running, null, "none ⇒ 两读数 null（零节点 —— 禁假造）")
  assert.equal(off.approval, null)
  assert.equal(off.collapsed, false, "none ⇒ 恒非折叠")
  const offTree = poolTree(off)
  assert.equal(offTree.props["data-pool"], "", "根锚 = data-pool（描述符恒在）")
  assert.equal(offTree.props["data-state"], "none", "data-state = none")
  assert.deepEqual(offTree.children, [], "none ⇒ 零子节点（禁假数据 —— 残留族不入树）")
  assert.equal(withAttr(offTree, "data-read").length, 0, "none ⇒ 零读数节点（头亦不在）")
  assert.equal(withAttr(offTree, "data-pool-item").length, 0, "none ⇒ 零条目节点")

  const blank = poolModel(state())
  assert.equal(blank.state, "empty", "有会话三族皆空 ⇒ empty")
  const blankTree = poolTree(blank)
  assert.equal(blankTree.props["data-state"], "empty")
  assert.equal(withAttr(blankTree, "data-pool-head").length, 1, "empty ⇒ 头在场")
  assert.deepEqual(texts(one(blankTree, "data-pool-head"))[0], "⟦pool.title⟧", "头题 = pool.title 词表值")
  assert.deepEqual(withAttr(blankTree, "data-read").map((node) => node.props["data-read"]), ["running", "approval"], "两读数锚 = running → approval")
  assert.deepEqual(texts(one(blankTree, "data-pool-body")), ["⟦pool.empty.hint⟧"], "empty ⇒ 体 = 词表提示（零族节点）")
  assert.equal(withAttr(blankTree, "data-family").length, 0, "empty ⇒ 零族节点")

  const full = poolTree(poolModel(state({ pool: { approvals: [approvalItem()], blocks: [blockItem()], queue: [queueItem()] } })))
  assert.equal(full.props["data-state"], "pool", "三族非空 ⇒ pool")
  assert.deepEqual(families(full), ["approvals", "blocks", "queue"], "族序固定 = 待审批 → 活动块 → 队列")
  const partial = poolTree(poolModel(state({ pool: { queue: [queueItem()] } })))
  assert.deepEqual(families(partial), ["queue"], "部分空 ⇒ 只落非空族（空族零节点 —— 不落空壳）")
  assert.deepEqual(families(poolTree(poolModel(state({ pool: { approvals: [approvalItem()], queue: [queueItem()] } })))), ["approvals", "queue"], "跳空族 ⇒ 序仍固定")

  const card = withAttr(full, "data-pool-item")
  assert.deepEqual(card.map((node) => node.props["data-pool-item"]), ["approval", "block", "queue"], "条目族标 = 三型各一（族内序 = 入参序）")
  assert.equal(card[0].props["data-prompt-id"], "a1", "待审批条目 = 身份锚（prompt-id 单形）")
  assert.deepEqual(texts(card[0].children[0]), ["Bash", "⟦tab.badge.approval⟧"], "待审批标称 = approvalTitle + 状态词（同源卡面 · 标签行内零出口文本）")
  assert.equal(withAttr(card[0], "data-approval-actions").length, 1, "待审批条目 = 三出口操作区（与卡面同一构造）")
  assert.deepEqual(card[0].children[1].children.map((node) => node.props["data-action"]), ["approval:once", "approval:always", "approval:reject"], "池面三出口同锚同序")
  assert.equal(withAttr(card[0], "data-autofocus").length, 0, "池面条目不争焦（零 data-autofocus）")
  assert.equal(card[1].props["data-status"], "running", "活动块条目 = data-status 落闭枚举码")
  assert.deepEqual(texts(card[1]), ["Edit", "⟦sub.running⟧"], "活动块标称 = 工具名 + 状态词（闭枚举值）")
  assert.equal(card[2].props["data-status"], "queued", "队列条目 = data-status 落码")
  assert.deepEqual(texts(card[2]), ["待跑任务", "⟦sub.queued⟧"], "队列标称 = 标题串 + 状态词")
  assert.equal(card[0].props["data-status"], undefined, "待审批条目 = 零 data-status（族已是身份）")

  const muted = poolTree(poolModel(state({
    pool: { blocks: [blockItem({ status: "weird" })], queue: [queueItem({ status: 7 })] },
  })))
  const mutedItems = withAttr(muted, "data-pool-item")
  assert.equal(mutedItems[0].props["data-status"], undefined, "表外状态码 ⇒ 零 data-status（禁假造）")
  assert.deepEqual(texts(mutedItems[0]), ["Edit"], "表外码 ⇒ 零状态词（不自造词）")
  assert.equal(mutedItems[1].props["data-status"], undefined, "非串状态 ⇒ 零 data-status")
  assert.deepEqual(texts(mutedItems[1]), ["待跑任务"], "非串状态 ⇒ 零状态词")
  assert.equal(withAttr(poolTree(poolModel(state({ pool: { approvals: [approvalItem({ shape: "weird" })] } }))), "data-approval-actions").length, 0, "表外形 ⇒ 零操作区（账目仍在）")
  assert.equal(withAttr(poolTree(poolModel(state({ pool: { approvals: [approvalItem({ shape: "weird", promptId: 9 })] } }))), "data-prompt-id")[0].props["data-prompt-id"], "9", "表外形 ⇒ 身份锚仍在（不掩盖事实）")

  const echo = poolTree(poolModel(state({
    pool: { approvals: [approvalItem(echoOf())], blocks: [blockItem(echoOf())], queue: [queueItem(echoOf())] },
  })))
  const dump = JSON.stringify(echo)
  for (const marker of ECHO) assert.equal(dump.includes(marker), false, `零内容回显：${marker} 不入树（标称 + 状态词之外不回显）`)
  assert.equal(dump.includes("npm"), false, "参数摘要不入池面树（零回显）")

  const reads = poolTree(poolModel(state({ pool: { running: 0, approval: 2, blocks: [blockItem()] } })))
  assert.deepEqual(texts(readOf(reads, "running")), ["0"], "读数 = String(数)（含 0 —— 0 亦是读数）")
  assert.deepEqual(texts(readOf(reads, "approval")), ["2"], "读数 = String(数)")
  const fakeReads = poolTree(poolModel(state({ pool: { running: "3", approval: null, blocks: [blockItem()] } })))
  assert.equal(readOf(fakeReads, "running"), undefined, "读数非数 ⇒ 零节点（禁假造）")
  assert.equal(readOf(fakeReads, "approval"), undefined, "读数缺 ⇒ 零节点")
  assert.equal(fakeReads.props["data-state"], "pool", "读数缺不影响三态判（族非空 ⇒ pool）")
})

// ─── U73 池面折叠与两读数（含 togglePool 三支）──────────────────

test("U73: 池面折叠与两读数（体零条目 ∧ 头读数仍在 ∧ aria 两态 ∧ togglePool 三支 + 按会话记忆）", (ctx) => {
  setupDict(ctx)

  const stocked = {
    approvals: [approvalItem()], blocks: [blockItem()], queue: [queueItem()],
  }
  const expanded = poolTree(poolModel(state({ pool: stocked })))
  const toggleOf = (tree) => one(tree, "data-action")
  assert.equal(toggleOf(expanded).props["data-action"], "pool:toggle", "折叠控件锚 = data-action=pool:toggle")
  assert.equal(toggleOf(expanded).tag, "button", "折叠控件 = 按钮")
  assert.equal(toggleOf(expanded).props["aria-expanded"], "true", "展开态 ⇒ aria-expanded=true")
  assert.equal(toggleOf(expanded).props["aria-label"], "⟦pool.collapse⟧", "展开态 ⇒ aria-label = pool.collapse（词表两态）")
  assert.equal(families(expanded).length, 3, "展开 ⇒ 三族在体")

  const folded = poolTree(poolModel(state({ pool: stocked, poolCollapsed: { t1: true } })))
  assert.equal(poolModel(state({ pool: stocked, poolCollapsed: { t1: true } })).collapsed, true, "折叠态 = poolCollapsed[会话键] === true")
  assert.deepEqual(one(folded, "data-pool-body").children, [], "折叠 ⇒ 体零条目节点")
  assert.equal(withAttr(folded, "data-family").length, 0, "折叠 ⇒ 零族节点")
  assert.equal(withAttr(folded, "data-pool-item").length, 0, "折叠 ⇒ 零条目节点")
  assert.deepEqual(withAttr(folded, "data-read").map((node) => node.props["data-read"]), ["running", "approval"], "折叠 ⇒ 头两读数仍在（读数不随体折叠）")
  assert.deepEqual(texts(readOf(folded, "running")), ["2"], "折叠 ⇒ 读数照给现值")
  assert.equal(toggleOf(folded).props["aria-expanded"], "false", "折叠 ⇒ aria-expanded=false")
  assert.equal(toggleOf(folded).props["aria-label"], "⟦pool.expand⟧", "折叠 ⇒ aria-label = pool.expand")
  assert.equal(withAttr(folded, "data-pool-head").length, 1, "折叠 ⇒ 头在场")

  const other = poolTree(poolModel(state({ pool: stocked, poolCollapsed: { t2: true } })))
  assert.equal(poolModel(state({ pool: stocked, poolCollapsed: { t2: true } })).collapsed, false, "折叠态按会话记忆（他键命中不影响本键）")
  assert.equal(families(other).length, 3, "他键折叠 ⇒ 本会话展开")
  for (const value of [false, "true", 1, null]) {
    assert.equal(poolModel(state({ pool: stocked, poolCollapsed: { t1: value } })).collapsed, false, `非 true 值 ${JSON.stringify(value)} ⇒ 非折叠（严格判）`)
  }
  assert.equal(poolModel(state({ pool: stocked, activeTab: 7, poolCollapsed: { t1: true } })).collapsed, false, "会话键非串 ⇒ 非折叠")
  assert.equal(poolModel(state({ pool: stocked, activeSession: null, poolCollapsed: { t1: true } })).collapsed, false, "none 态 ⇒ 非折叠")

  // togglePool 三支（store 纯动作 ⇒ 折叠态读写闭环）
  const base = { ...initialState(), activeSession: "s1", activeTab: "t1", pool: { ...initialState().pool, ...stocked } }
  const first = togglePool(base, "t1")
  assert.notEqual(first, base, "缺键 ⇒ 新态（首击折叠，无需先写槽）")
  assert.equal(first.poolCollapsed.t1, true, "缺键 ⇒ 落 true")
  assert.equal(poolModel(first).collapsed, true, "闭环：缺键支 ⇒ 池面折叠")
  assert.deepEqual(one(poolTree(poolModel(first)), "data-pool-body").children, [], "闭环：折叠 ⇒ 体零节点")
  assert.equal(base.poolCollapsed.t1, undefined, "入参零变异（纯函数）")
  const second = togglePool(first, "t1")
  assert.equal(second.poolCollapsed.t1, false, "命中（现值 true）⇒ 翻转 false")
  assert.equal(poolModel(second).collapsed, false, "闭环：命中支 ⇒ 池面展开")
  assert.equal(togglePool(second, "t1").poolCollapsed.t1, true, "再击 ⇒ 复折叠（三支往返）")
  for (const key of [7, null, undefined, {}, ["t1"]]) {
    assert.equal(togglePool(base, key), base, `非串键 ${JSON.stringify(key)} ⇒ 原引用（零通知）`)
  }
  assert.equal(togglePool({ ...base, poolCollapsed: { t1: false } }, "t1").poolCollapsed.t1, true, "现值非 true ⇒ 落 true（不误判为命中）")
  assert.equal(togglePool({ ...base, poolCollapsed: { t1: "true" } }, "t1").poolCollapsed.t1, true, "现值串 'true' ⇒ 落 true（严格 === 判）")
  assert.equal(togglePool(base, "t1").poolCollapsed.t1, true, "键域独立：他键在册不影响本键")

  // 薄挂载（假 DOM）：props 复制 + 清空 + 入位，宿主 data-slot 保留
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档 —— 载体自身不静默失效）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("section")
  root.setAttribute("data-slot", "pool")
  const calls = []
  const model = mountPool(root, first, { onTogglePool: (key) => calls.push(key) })
  assert.equal(model.state, "pool", "挂载回执 = 模型（调用面零分支）")
  assert.equal(root.getAttribute("data-pool"), "", "根锚复制到宿主")
  assert.equal(root.getAttribute("data-state"), "pool", "态锚复制到宿主")
  assert.equal(root.getAttribute("data-slot"), "pool", "宿主 data-slot 保留（槽位零改）")
  assert.equal(root.querySelector("[data-pool-head]") !== null, true, "头入位")
  assert.equal(root.querySelector("[data-pool-body]") !== null, true, "体入位")
  for (const marker of ECHO) assert.equal(root.textContent.includes(marker), false, `零内容回显：${marker} 不入节点`)
  const button = root.querySelector('[data-action="pool:toggle"]')
  assert.equal(fake.fire(button, "click"), 1, "折叠控件真注册（click 监听在场）")
  assert.deepEqual(calls, ["t1"], "折叠控件回执 = 本会话键")
  mountPool(root, state({ pool: stocked }), {})
  assert.equal(root.getAttribute("data-state"), "pool", "重挂 = 幂等（props 再复制）")
  assert.equal(root.querySelectorAll("[data-pool-head]").length, 1, "重挂先清空 ⇒ 头恰一枚（不叠加）")
  assert.equal(root.querySelectorAll("[data-family]").length, 3, "重挂后三族恰三枚")
  assert.equal(fake.fire(root.querySelector('[data-action="pool:toggle"]'), "click"), 0, "缺 handlers ⇒ 零监听（disabled 面非死控）")
  assert.notEqual(mountPool(null, state()), null, "容器缺位 ⇒ 模型照给（零抛）")
})
