/**
 * views-activity.test.mjs — E-5 **右列 = 子 agent 面板**用例（R3b · D20 —— `docs/desktop/design/UI.md` §1
 * 「本批注（对齐重定位）」项 2 · `docs/desktop/design/PROJECT.md` §6.1 D20 / §7 T-DSK36；批档 §2 ㈣/㈤）：
 *   U72 三态与三族（族序 = 待审批 → 子 agent → 队列 · 空族零节点 · 零内容回显 · 块头四段 + 状态词闭集 +
 *       停止钮在场判据 · 表外码零节点）；
 *   U73 折叠与两读数（体零条目 ∧ 头读数仍在 ∧ `togglePool` 三支 + 按会话记忆）+ 薄挂载（假 DOM）；
 *   U168 块面判据（射程五类同形 · 用时三态 · 回合词形**核域真词表**锁 · 停止钮闸门 · 零工具行）；
 *   U169 停止出口（`stopSubagent` —— 载荷逐字 / `ok` 真 ⇒ 零切片写 / 失败与抛 ⇒ `console.error` + `false`）。
 * 面 = `poolModel` / `poolTree`（**纯构树**）+ `mountPool` 薄挂载（假 DOM · `test/fake-dom.mjs`）；折叠纯动作 =
 * `renderer/store.mjs` 的 `togglePool`；停止出口 = `renderer/mount-pool.mjs` 的 `stopSubagent`（假 host）。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面；
 * 核域真词表锁（用时 / 回合两段）用 `projectDictionary` 真投影 —— 缝自铸模板会遮蔽参名不符（R3a 教训）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { projectDictionary } from "@thincoder/core/i18n.mjs"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { stopSubagent } from "../renderer/mount-pool.mjs"
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
/** 块条目集（`data-pool-item="subagent"`）。 */
const items = (tree) => withAttr(tree, "data-pool-item").filter((node) => node.props["data-pool-item"] === "subagent")
/** 条目分段（`data-seg`）按码取。 */
const segOf = (item, code) => withAttr(item, "data-seg").find((node) => node.props["data-seg"] === code)

/** 词面哨兵：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = { "approval.batch.count": "⟦batch:${count}⟧", "status.elapsed": "⟦status.elapsed:${seconds}⟧" }
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error", "status.turn"]

function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => initDict({}))
}

/** 块模型夹具（核态机模型形 —— `/rc/subblocks/state.mjs` `buildModel` + 迁移写点）。 */
const block = (over = {}) => ({
  key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, model: "glm-5.3",
  startedAt: 1000, pool: true, syncLive: false, turn: 3, maxTurns: 100,
  status: "running", queued: false, frozen: false, doneAt: null, ...over,
})
/** 帧态夹具：`subBlocks` 按会话键分槽（键 = `activeSession`）。 */
function state(over = {}) {
  const { pool, subBlocks, ...rest } = over
  return {
    activeSession: "1",
    activeTab: "1",
    subBlocks: { "1": [], ...subBlocks },
    pool: { running: 1, approval: 1, queue: [], approvals: [], ...pool },
    ...rest,
  }
}
const approvalItem = (over = {}) => ({ shape: "single", promptId: "a1", tool: "Bash", argsSummary: "npm test", ...over })
const queueItem = (over = {}) => ({ title: "待跑任务", status: "queued", ...over })
/** 内容回显哨兵（条目零回显 ⇒ 五串皆不得入树）。 */
const ECHO = ["秘密参数", "秘密输出", "秘密正文", "秘密入参", "秘密笔记"]
const echoOf = () => ({ stateWord: ECHO[0], result: ECHO[1], text: ECHO[2], args: ECHO[3], note: ECHO[4] })

// ─── U72 右列三族与三态（块面 = 子 agent）─────────────────────

test("U72: 右列三族与三态（none 零节点 / empty 提示 / 族序 = 待审批 → 子 agent → 队列 ∧ 空族零节点 ∧ 零内容回显）", (ctx) => {
  setupDict(ctx)

  const stale = state({ activeSession: null, pool: { running: 3, approval: 2 }, subBlocks: { "1": [block()] } })
  const off = poolModel(stale)
  assert.equal(off.state, "none", "无活动会话 ⇒ none（无视供给面残留）")
  assert.deepEqual(off.blocks, [], "none 态块表零读（面板随已载入页 —— 零推导 / 零复制）")
  assert.equal(off.running, null, "none ⇒ 两读数 null（零节点 —— 禁假造）")
  assert.equal(off.approval, null)
  assert.equal(off.collapsed, false, "none ⇒ 恒非折叠")
  const offTree = poolTree(off)
  assert.equal(offTree.props["data-pool"], "", "根锚 = data-pool（描述符恒在）")
  assert.equal(offTree.props["data-state"], "none", "data-state = none")
  assert.deepEqual(offTree.children, [], "none ⇒ 零子节点（禁假数据 —— 残留族不入树）")
  assert.equal(withAttr(offTree, "data-read").length, 0, "none ⇒ 零读数节点（头亦不在）")
  assert.equal(withAttr(offTree, "data-pool-item").length, 0, "none ⇒ 零条目节点")

  const blank = poolModel(state({ subBlocks: { "1": [] } }))
  assert.equal(blank.state, "empty", "有会话三族皆空 ⇒ empty")
  const blankTree = poolTree(blank)
  assert.equal(blankTree.props["data-state"], "empty")
  assert.equal(withAttr(blankTree, "data-pool-head").length, 1, "empty ⇒ 头在场")
  assert.deepEqual(texts(one(blankTree, "data-pool-head"))[0], "⟦pool.title⟧", "头题 = pool.title 词表值")
  assert.deepEqual(withAttr(blankTree, "data-read").map((node) => node.props["data-read"]), ["running", "approval"], "两读数锚 = running → approval")
  assert.deepEqual(texts(one(blankTree, "data-pool-body")), ["⟦pool.empty.hint⟧"], "empty ⇒ 体 = 词表提示（零族节点）")
  assert.equal(withAttr(blankTree, "data-family").length, 0, "empty ⇒ 零族节点")

  const full = poolTree(poolModel(state({
    subBlocks: { "1": [block()] },
    pool: { approvals: [approvalItem()], queue: [queueItem()] },
  })))
  assert.equal(full.props["data-state"], "pool", "三族非空 ⇒ pool")
  assert.deepEqual(families(full), ["approvals", "subagents", "queue"], "族序固定 = 待审批 → 子 agent → 队列")
  const partial = poolTree(poolModel(state({ subBlocks: {}, pool: { queue: [queueItem()] } })))
  assert.deepEqual(families(partial), ["queue"], "部分空 ⇒ 只落非空族（空族零节点 —— 不落空壳）")
  assert.deepEqual(families(poolTree(poolModel(state({ subBlocks: {}, pool: { approvals: [approvalItem()], queue: [queueItem()] } })))), ["approvals", "queue"], "跳空族 ⇒ 序仍固定")

  const card = withAttr(full, "data-pool-item")
  assert.deepEqual(card.map((node) => node.props["data-pool-item"]), ["approval", "subagent", "queue"], "条目族标 = 三型各一（族内序 = 入参序）")
  assert.equal(card[0].props["data-prompt-id"], "a1", "待审批条目 = 身份锚（prompt-id 单形）")
  assert.deepEqual(texts(card[0].children[0]), ["Bash", "⟦tab.badge.approval⟧"], "待审批标称 = approvalTitle + 状态词（同源卡面）")
  assert.equal(withAttr(card[0], "data-approval-actions").length, 1, "待审批条目 = 三出口操作区（与卡面同一构造）")
  assert.equal(withAttr(card[0], "data-autofocus").length, 0, "池面条目不争焦（零 data-autofocus）")

  assert.equal(card[1].props["data-status"], "running", "子 agent 条 = data-status 落闭枚举码")
  assert.equal(card[1].props["data-sub-id"], "1", "身份锚 = data-sub-id（停止出口载荷源 —— 与 ev:subagent 同源同值）")
  assert.equal(card[1].props["data-sub-role"], "coder", "身份锚 = data-sub-role")
  assert.deepEqual(withAttr(card[1], "data-seg").map((node) => node.props["data-seg"]), ["role", "model", "elapsed", "turn", "status"], "块头段码序 = role / model / elapsed / turn / status（**逐段包元素**）")
  assert.deepEqual(texts(segOf(card[1], "role")), ["coder"], "role 段 = 数据串原样")
  assert.deepEqual(texts(segOf(card[1], "model")), ["glm-5.3"], "model 段 = 数据串原样")
  assert.deepEqual(texts(segOf(card[1], "status")), ["⟦sub.running⟧"], "状态词 = 闭枚举词（经 t()）")
  assert.equal(card[2].props["data-status"], "queued", "队列条目 = data-status 落码")
  assert.deepEqual(texts(card[2]), ["待跑任务", "⟦sub.queued⟧"], "队列标称 = 标题串 + 状态词")
  assert.equal(card[0].props["data-status"], undefined, "待审批条目 = 零 data-status（族已是身份）")

  const muted = poolTree(poolModel(state({
    subBlocks: { "1": [block({ status: "weird", queued: false })] },
    pool: { queue: [queueItem({ status: 7 })] },
  })))
  const mutedItems = withAttr(muted, "data-pool-item")
  assert.equal(mutedItems[0].props["data-status"], undefined, "表外状态码 ⇒ 零 data-status（禁假造）")
  assert.equal(segOf(mutedItems[0], "status"), undefined, "表外码 ⇒ 零状态词（不自造词）")
  assert.equal(mutedItems[1].props["data-status"], undefined, "非串状态 ⇒ 零 data-status")
  assert.deepEqual(texts(mutedItems[1].children[0]), ["待跑任务"], "非串状态 ⇒ 零状态词")

  // 标签行两段**逐段包元素**（`span[data-seg]` —— 裸串直作 flex 行子 ⇒ `gap` 静默失效；缺席段零节点）
  const labelOf = (item) => item.children[0]
  const labelSegs = (item) => withAttr(labelOf(item), "data-seg").map((node) => node.props["data-seg"])
  assert.deepEqual(labelSegs(card[0]), ["title", "status"], "待审批标签行段码序 = title / status")
  assert.deepEqual(labelSegs(card[2]), ["title", "status"], "队列条目同段集")
  assert.equal(labelOf(card[2]).children.filter((kid) => kid !== null).length, withAttr(labelOf(card[2]), "data-seg").length, "标签行子节点**全为** `[data-seg]` 元素（裸串零入 flex 行）")
  assert.deepEqual(labelSegs(mutedItems[1]), ["title"], "表外状态码 ⇒ 状态段零节点（段数 = 在场段数）")
  assert.equal(withAttr(poolTree(poolModel(state({ subBlocks: {}, pool: { approvals: [approvalItem({ shape: "weird" })] } }))), "data-approval-actions").length, 0, "表外形 ⇒ 零操作区（账目仍在）")
  assert.equal(withAttr(poolTree(poolModel(state({ subBlocks: {}, pool: { approvals: [approvalItem({ shape: "weird", promptId: 9 })] } }))), "data-prompt-id")[0].props["data-prompt-id"], "9", "表外形 ⇒ 身份锚仍在（不掩盖事实）")

  const echo = poolTree(poolModel(state({
    subBlocks: { "1": [block(echoOf())] },
    pool: { approvals: [approvalItem(echoOf())], queue: [queueItem(echoOf())] },
  })))
  const dump = JSON.stringify(echo)
  for (const marker of ECHO) assert.equal(dump.includes(marker), false, `零内容回显：${marker} 不入树（块头 + 状态词之外不回显）`)
  assert.equal(dump.includes("npm"), false, "参数摘要不入右列树（零回显）")

  const reads = poolTree(poolModel(state({ subBlocks: { "1": [block()] }, pool: { running: 0, approval: 2 } })))
  assert.deepEqual(texts(readOf(reads, "running")), ["0"], "读数 = String(数)（含 0 —— 0 亦是读数）")
  assert.deepEqual(texts(readOf(reads, "approval")), ["2"], "读数 = String(数)")
  const fakeReads = poolTree(poolModel(state({ subBlocks: { "1": [block()] }, pool: { running: "3", approval: null } })))
  assert.equal(readOf(fakeReads, "running"), undefined, "读数非数 ⇒ 零节点（禁假造）")
  assert.equal(readOf(fakeReads, "approval"), undefined, "读数缺 ⇒ 零节点")
  assert.equal(fakeReads.props["data-state"], "pool", "读数缺不影响三态判（族非空 ⇒ pool）")
})

// ─── U73 右列折叠与两读数（含 togglePool 三支 + 薄挂载）──────────

test("U73: 右列折叠与两读数（体零条目 ∧ 头读数仍在 ∧ aria 两态 ∧ togglePool 三支 + 按会话记忆 + 薄挂载）", (ctx) => {
  setupDict(ctx)

  const stocked = { subBlocks: { "1": [block()] }, pool: { approvals: [approvalItem()], queue: [queueItem()] } }
  const expanded = poolTree(poolModel(state(stocked)))
  const toggleOf = (tree) => one(tree, "data-action")
  assert.equal(toggleOf(expanded).props["data-action"], "pool:toggle", "折叠控件锚 = data-action=pool:toggle")
  assert.equal(toggleOf(expanded).tag, "button", "折叠控件 = 按钮")
  assert.equal(toggleOf(expanded).props["aria-expanded"], "true", "展开态 ⇒ aria-expanded=true")
  assert.equal(toggleOf(expanded).props["aria-label"], "⟦pool.collapse⟧", "展开态 ⇒ aria-label = pool.collapse（词表两态）")
  assert.equal(families(expanded).length, 3, "展开 ⇒ 三族在体")

  const folded = poolTree(poolModel(state({ ...stocked, poolCollapsed: { "1": true } })))
  assert.equal(poolModel(state({ ...stocked, poolCollapsed: { "1": true } })).collapsed, true, "折叠态 = poolCollapsed[会话键] === true")
  assert.deepEqual(one(folded, "data-pool-body").children, [], "折叠 ⇒ 体零条目节点")
  assert.equal(withAttr(folded, "data-family").length, 0, "折叠 ⇒ 零族节点")
  assert.equal(withAttr(folded, "data-pool-item").length, 0, "折叠 ⇒ 零条目节点")
  assert.deepEqual(withAttr(folded, "data-read").map((node) => node.props["data-read"]), ["running", "approval"], "折叠 ⇒ 头两读数仍在（读数不随体折叠）")
  assert.deepEqual(texts(readOf(folded, "running")), ["1"], "折叠 ⇒ 读数照给现值")
  assert.equal(toggleOf(folded).props["aria-expanded"], "false", "折叠 ⇒ aria-expanded=false")
  assert.equal(toggleOf(folded).props["aria-label"], "⟦pool.expand⟧", "折叠 ⇒ aria-label = pool.expand")
  assert.equal(withAttr(folded, "data-pool-head").length, 1, "折叠 ⇒ 头在场")

  const other = poolTree(poolModel(state({ ...stocked, poolCollapsed: { "2": true } })))
  assert.equal(poolModel(state({ ...stocked, poolCollapsed: { "2": true } })).collapsed, false, "折叠态按会话记忆（他键命中不影响本键）")
  assert.equal(families(other).length, 3, "他键折叠 ⇒ 本会话展开")
  for (const value of [false, "true", 1, null]) {
    assert.equal(poolModel(state({ ...stocked, poolCollapsed: { "1": value } })).collapsed, false, `非 true 值 ${JSON.stringify(value)} ⇒ 非折叠（严格判）`)
  }
  assert.equal(poolModel(state({ ...stocked, activeTab: 7, poolCollapsed: { "1": true } })).collapsed, false, "会话键非串 ⇒ 非折叠")
  assert.equal(poolModel(state({ ...stocked, activeSession: null, poolCollapsed: { "1": true } })).collapsed, false, "none 态 ⇒ 非折叠")
  // 块表键 = activeSession（面板随已载入页）；折叠键 = activeTab（存量口径）——两键在生产同源（会话键）
  const shifted = poolModel(state({ ...stocked, activeSession: "1", activeTab: "2", poolCollapsed: { "1": true } }))
  assert.equal(shifted.collapsed, false, "折叠键 ≠ 块表键时各按各键（activeTab 口径）")
  assert.equal(shifted.blocks.length, 1, "块表随 activeSession（本会话块在）")

  // togglePool 三支（store 纯动作 ⇒ 折叠态读写闭环）
  const base = { ...initialState(), activeSession: "1", activeTab: "1", subBlocks: { "1": [block()] }, pool: { ...initialState().pool, ...stocked.pool } }
  const first = togglePool(base, "1")
  assert.notEqual(first, base, "缺键 ⇒ 新态（首击折叠，无需先写槽）")
  assert.equal(first.poolCollapsed["1"], true, "缺键 ⇒ 落 true")
  assert.equal(poolModel(first).collapsed, true, "闭环：缺键支 ⇒ 右列折叠")
  assert.deepEqual(one(poolTree(poolModel(first)), "data-pool-body").children, [], "闭环：折叠 ⇒ 体零节点")
  assert.equal(base.poolCollapsed["1"], undefined, "入参零变异（纯函数）")
  const second = togglePool(first, "1")
  assert.equal(second.poolCollapsed["1"], false, "命中（现值 true）⇒ 翻转 false")
  assert.equal(poolModel(second).collapsed, false, "闭环：命中支 ⇒ 右列展开")
  assert.equal(togglePool(second, "1").poolCollapsed["1"], true, "再击 ⇒ 复折叠（三支往返）")
  for (const key of [7, null, undefined, {}, ["1"]]) {
    assert.equal(togglePool(base, key), base, `非串键 ${JSON.stringify(key)} ⇒ 原引用（零通知）`)
  }
  assert.equal(togglePool({ ...base, poolCollapsed: { "1": false } }, "1").poolCollapsed["1"], true, "现值非 true ⇒ 落 true（不误判为命中）")
  assert.equal(togglePool({ ...base, poolCollapsed: { "1": "true" } }, "1").poolCollapsed["1"], true, "现值串 'true' ⇒ 落 true（严格 === 判）")

  // 薄挂载（假 DOM）：props 复制 + 清空 + 入位，宿主 data-slot 保留；停止钮真注册
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档 —— 载体自身不静默失效）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("section")
  root.setAttribute("data-slot", "pool")
  const calls = []
  const model = mountPool(root, base, {
    onTogglePool: (key) => calls.push(["toggle", key]),
    onStopSubagent: (key, id, role) => calls.push(["stop", key, id, role]),
  })
  assert.equal(model.state, "pool", "挂载回执 = 模型（调用面零分支）")
  assert.equal(root.getAttribute("data-pool"), "", "根锚复制到宿主")
  assert.equal(root.getAttribute("data-state"), "pool", "态锚复制到宿主")
  assert.equal(root.getAttribute("data-slot"), "pool", "宿主 data-slot 保留（槽位零改）")
  assert.equal(root.querySelector("[data-pool-head]") !== null, true, "头入位")
  assert.equal(root.querySelector("[data-pool-body]") !== null, true, "体入位")
  for (const marker of ECHO) assert.equal(root.textContent.includes(marker), false, `零内容回显：${marker} 不入节点`)
  const button = root.querySelector('[data-action="pool:toggle"]')
  assert.equal(fake.fire(button, "click"), 1, "折叠控件真注册（click 监听在场）")
  assert.deepEqual(calls, [["toggle", "1"]], "折叠控件回执 = 本会话键")
  const stopBtn = root.querySelector('[data-action="subagent:stop"]')
  assert.equal(fake.fire(stopBtn, "click"), 1, "停止钮真注册（可中止块 ⇒ 钮在场）")
  assert.deepEqual(calls.at(-1), ["stop", "1", 1, "coder"], "停止钮回执 = `{ 会话键, id, role }`（与 ev:subagent 同源同值）")
  mountPool(root, state({ subBlocks: { "1": [block()] }, pool: {} }), {})
  assert.equal(root.getAttribute("data-state"), "pool", "重挂 = 幂等（props 再复制）")
  assert.equal(root.querySelectorAll("[data-pool-head]").length, 1, "重挂先清空 ⇒ 头恰一枚（不叠加）")
  assert.equal(root.querySelectorAll("[data-family]").length, 1, "重挂后族数随新态（单族恰一枚）")
  assert.equal(fake.fire(root.querySelector('[data-action="pool:toggle"]'), "click"), 0, "缺 handlers ⇒ 零监听（disabled 面非死控）")
  assert.notEqual(mountPool(null, state()), null, "容器缺位 ⇒ 模型照给（零抛）")
})

// ─── U168 块面判据（射程五类 · 用时三态 · 回合真词表锁 · 停止钮闸门 · 零工具行）──

test("U168: 块面判据（五类射程同形 · 用时三态 ∧ 回合核域词形锁 ∧ 停止钮闸门 ∧ 零工具行）", (ctx) => {
  setupDict(ctx)
  const now = 60_000 // 固定现刻（用时判据可算死）

  // 射程五类 = sync spawn / async 池 / consult / escalate / advisor-async（凭 relay 前缀出场 —— 归约面零角色过滤）
  const five = [
    block({ key: "sub:eng-coder#1", role: "eng-coder", id: 1, pool: false, syncLive: true, model: "m-sync" }),
    block({ key: "sub:coder#2", role: "coder", id: 2, pool: true, syncLive: false, model: "m-pool" }),
    block({ key: "sub:consult#3", role: "consult", id: 3, pool: false, syncLive: false, model: "m-consult" }),
    block({ key: "sub:escalate#4", role: "escalate", id: 4, pool: true, syncLive: false, model: "m-esc" }),
    block({ key: "sub:advisor#5", role: "advisor", id: 5, pool: true, syncLive: false, model: "m-adv" }),
  ]
  const tree = poolTree(poolModel(state({ subBlocks: { "1": five }, pool: { running: 5 } }), now))
  const cards = items(tree)
  assert.equal(cards.length, 5, "五类射程各出块（同形 —— 块头 + 状态词 + 停止钮）")
  assert.deepEqual(cards.map((item) => item.props["data-sub-role"]), ["eng-coder", "coder", "consult", "escalate", "advisor"], "块身份逐类在场")
  for (const item of cards) {
    assert.deepEqual(withAttr(item, "data-seg").map((node) => node.props["data-seg"]), ["role", "model", "elapsed", "turn", "status"], "五类同形：段集与段序一致")
  }
  // 停止钮闸门（诚实非死控）：sync（registry live）/ async 池 / queued ⇒ 在场；无池无 registry（consult）⇒ 零钮
  const stopOf = (item) => withAttr(item, "data-action").find((node) => node.props["data-action"] === "subagent:stop")
  assert.equal(stopOf(cards[0]) !== undefined, true, "sync（syncLive 真）⇒ 停止钮在场")
  assert.equal(stopOf(cards[1]) !== undefined, true, "async 池（pool 真）⇒ 停止钮在场")
  assert.equal(stopOf(cards[2]), undefined, "consult（无池 / 无 registry）⇒ 零钮（不可中止者不落钮）")
  assert.equal(stopOf(cards[3]) !== undefined, true, "escalate（池条目）⇒ 停止钮在场")
  assert.equal(stopOf(cards[4]) !== undefined, true, "advisor（评审池）⇒ 停止钮在场")
  assert.deepEqual(texts(stopOf(cards[0])), ["⟦pool.stop⟧"], "停止钮词 = 词表键（经 t()）")
  const queuedCard = items(poolTree(poolModel(state({ subBlocks: { "1": [block({ status: "queued", queued: true, pool: false, syncLive: false })] }, pool: { running: 1 } }), now)))[0]
  assert.equal(stopOf(queuedCard) !== undefined, true, "queued ⇒ 停止钮在场（可撤销排队决策）")
  assert.equal(segOf(queuedCard, "elapsed"), undefined, "排队态 ⇒ 用时零节点（等待不计用时）")
  assert.deepEqual(texts(segOf(queuedCard, "status")), ["⟦sub.queued⟧"], "排队态 ⇒ 状态词 = 排队中")
  const frozenCard = items(poolTree(poolModel(state({ subBlocks: { "1": [block({ status: "cancelled", frozen: true, doneAt: 5000 })] }, pool: { running: 0 } }), now)))[0]
  assert.equal(stopOf(frozenCard), undefined, "已终态 ⇒ 零钮（折叠面 = 终态词 + 用时）")
  assert.deepEqual(texts(segOf(frozenCard, "status")), ["⟦sub.stopped⟧"], "`cancelled` ⇒ 词表「已停止」（⟦ev⟧stopped 先例兼容映射）")
  assert.deepEqual(texts(segOf(frozenCard, "elapsed")), ["⟦status.elapsed:4⟧"], "终态用时 = `doneAt` − `startedAt`（冻结后不走时 —— 现刻再进 1h 亦同）")
  assert.deepEqual(texts(segOf(frozenCard, "elapsed")), texts(segOf(items(poolTree(poolModel(state({ subBlocks: { "1": [block({ status: "cancelled", frozen: true, doneAt: 5000 })] }, pool: { running: 0 } }), now + 3_600_000)))[0], "elapsed")), "冻结块用时与现刻无关（两帧同值）")
  const liveCard = items(poolTree(poolModel(state({ subBlocks: { "1": [block({ done: false })] }, pool: { running: 1 } }), now)))[0]
  assert.deepEqual(texts(segOf(liveCard, "elapsed")), ["⟦status.elapsed:59⟧"], "在用时 = 现刻 − 起刻（1000ms 起 ⇒ 59s）")

  // 回合段词形**核域真词表**锁（缝自铸模板会遮蔽参名不符 —— R3a 教训；参数名须逐字 = 核 `${n}/${m}`）
  initDict({ locale: "en", dict: projectDictionary("en") })
  const real = items(poolTree(poolModel(state({ subBlocks: { "1": [block({ turn: 2, maxTurns: 8 })] }, pool: { running: 1 } }), now)))[0]
  assert.deepEqual(texts(segOf(real, "turn")), ["turn 2/8"], "回合段 = 核键真渲染（零残留 `${…}` —— 参名逐字）")
  assert.equal(texts(segOf(real, "turn")).join("").includes("${"), false, "零占位残留")

  // 零工具行（右列）：条目型闭集 = {approval, subagent, queue}；工具名 / 池条目形不得入树
  const types = [...new Set(withAttr(tree, "data-pool-item").map((node) => node.props["data-pool-item"]))].sort()
  assert.deepEqual(types, ["subagent"], "树面条目型 = 子 agent（零工具行节点）")
  assert.equal(JSON.stringify(tree).includes("read_file"), false, "工具名串不入右列树")
})

// ─── U169 停止出口（`stopSubagent` · 零乐观写）──────────────────

test("U169: 停止出口（载荷逐字 `{ key, id, role? }` · `ok` 真 ⇒ `true` ∧ 零切片写 · 失败与抛 ⇒ `console.error` + `false`）", async (ctx) => {
  const calls = []
  const host = { invoke: (channel, payload) => { calls.push([channel, payload]); return Promise.resolve({ ok: true, reason: null }) } }
  assert.equal(await stopSubagent({ host }, "1", 3, "coder"), true, "`ok` 真 ⇒ `true`")
  assert.deepEqual(calls, [["subagent:stop", { key: "1", id: 3, role: "coder" }]], "载荷逐字 = `{ key, id, role }`（通道名逐字）")
  await stopSubagent({ host }, "1", 3, null)
  assert.deepEqual(calls.at(-1)[1], { key: "1", id: 3 }, "role 缺 ⇒ 键缺席（不落 `role: null` 占位）")

  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  ctx.after(() => { console.error = original })
  const bad = { invoke: () => Promise.resolve({ ok: false, reason: "unknown-sub" }) }
  assert.equal(await stopSubagent({ host: bad }, "1", 9, "coder"), false, "`ok` 假 ⇒ `false`（零乐观写 —— 块原地可重试）")
  assert.equal(errors.length, 1, "失败 ⇒ 恰一行诊断（零静默）")
  const broken = { invoke: () => { throw new Error("bridge down") } }
  assert.equal(await stopSubagent({ host: broken }, "1", 9, "coder"), false, "抛 ⇒ `false`（不吞）")
  assert.equal(errors.length, 2, "抛亦入诊断（零静默）")
})
