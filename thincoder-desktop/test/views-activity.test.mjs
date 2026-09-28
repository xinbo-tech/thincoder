/**
 * views-activity.test.mjs — E-5 **右列 = 子 agent 面板**用例（R3b · D20 —— `docs/desktop/design/UI.md` §1
 * 「本批注（对齐重定位）」项 2 · 「本批注（对齐第二批 · 六件）」项 3 / 5 · `docs/desktop/design/PROJECT.md`
 * §6.1 D20 / §7 T-DSK36；批档 §2）：
 *   U72 三态与三族（族序 = 待审批 → 子 agent → 队列 · 空族零节点 · **归档墓碑 region 过滤** · 表外码零节点）；
 *   U73 折叠与两读数（体零条目 ∧ 头读数仍在 ∧ `togglePool` 三支 + 按会话记忆）+ 薄挂载（假 DOM · **键控差分**）；
 *   U168 子 agent 族核件面（「对齐第二批」项 3 —— 块 = `details.advisor-block.sub-block` · 头文形 · tail-3 `│ `
 *        前缀 · ⏹ 判据 · **接管末刷**（换元素径挂载后末刷）· **同 key 元素跨帧同一**（不重建）· 内容行增量 ·
 *        **跨会话换代**（键域 = 会话内）· `sub.desc` 一次性 · 零工具行负向锁）；
 *   U169 停止出口（`stopSubagent` —— 载荷逐字 / `ok` 真 ⇒ 零切片写 / 失败与抛 ⇒ `console.error` + `false`）
 *        + ⏹ 点击委托（`bindSubagentStop` —— 载荷读 `data-sub-id` / `data-sub-role`）。
 * 面 = `poolModel` / `poolTree`（**纯构树**）+ `mountPool` 薄挂载（假 DOM · `test/fake-dom.mjs`）；折叠纯动作 =
 * `renderer/store.mjs` 的 `togglePool`；停止出口 = `renderer/mount-pool.mjs`。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面；
 * 核件头文形判据走核件真词值（`sub.async` 等哨兵 + 核 `status.thinking`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { setStrings } from "/rc/i18n.mjs"
import { HOST_DICT, initDict, setStringsSink } from "../renderer/i18n.mjs"
import { bindSubagentStop, stopSubagent } from "../renderer/mount-pool.mjs"
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
const items = (tree) => withAttr(tree, "data-pool-item")
const itemTypes = (tree) => items(tree).map((node) => node.props["data-pool-item"])

/** 词面哨兵：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = { "approval.batch.count": "⟦batch:${count}⟧", "sub.awaitingApproval": "⟦awaiting:${tool}⟧" }
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error", "status.turn", "status.thinking"]

function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  // 核件取词接线（「对齐第二批」项 3 · 修复轮择形（c））：注册单点 = 生产里 `renderer/app.mjs`；用例同径注册
  // ⇒ 核件 `t()` 经注册端取词（§2.8 前瞻注 —— 断言核件词值须先注册 sink）
  setStringsSink(setStrings)
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => { initDict({}); setStringsSink(null) })
}

/** 块模型夹具（核态机模型形 —— `/rc/subblocks/state.mjs` `buildModel` + 迁移写点；`startedAt` = 现刻 ⇒ 用时 0s 可算死）。 */
const block = (over = {}) => ({
  key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, model: "glm-5.3",
  startedAt: Date.now(), pool: true, syncLive: false, turn: 3, maxTurns: 100,
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

// ─── U72 右列三族与三态（块面 = 子 agent）─────────────────────

test("U72: 右列三族与三态（none 零节点 / empty 提示 / 族序 = 待审批 → 子 agent → 队列 ∧ 空族零节点 ∧ region 墓碑过滤）", (ctx) => {
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

  // 子 agent 族 = **常驻容器空壳**（纯树只出族标签 —— 项元素 = 核件（DOM 面）由 `mountPool` 键控差分填入）
  const subFamily = withAttr(full, "data-family").find((node) => node.props["data-family"] === "subagents")
  assert.equal(subFamily.props["data-family"], "subagents", "子 agent 族节点在场（容器壳）")
  assert.deepEqual(texts(subFamily), ["⟦pool.family.subagents⟧"], "族标签 = 词表键（零硬编码）")
  assert.equal(withAttr(full, "data-pool-item").filter((node) => node.props["data-pool-item"] === "subagent").length, 0, "纯树零 subagent 条目（项元素 = 核件 —— 不入描述符树）")

  const card = items(full)
  assert.deepEqual(itemTypes(full), ["approval", "queue"], "条目族标 = 两型（待审批 / 队列 —— 子 agent 项在 DOM 面）")
  assert.equal(card[0].props["data-prompt-id"], "a1", "待审批条目 = 身份锚（prompt-id 单形）")
  assert.deepEqual(texts(card[0].children[0]), ["Bash", "⟦tab.badge.approval⟧"], "待审批标称 = approvalTitle + 状态词（同源卡面）")
  assert.equal(withAttr(card[0], "data-approval-actions").length, 1, "待审批条目 = 三出口操作区（与卡面同一构造）")
  assert.equal(withAttr(card[0], "data-autofocus").length, 0, "池面条目不争焦（零 data-autofocus）")
  assert.equal(card[1].props["data-status"], "queued", "队列条目 = data-status 落码")
  assert.deepEqual(texts(card[1]), ["待跑任务", "⟦sub.queued⟧"], "队列标称 = 标题串 + 状态词")
  assert.equal(card[0].props["data-status"], undefined, "待审批条目 = 零 data-status（族已是身份）")

  const muted = poolTree(poolModel(state({
    subBlocks: { "1": [block({ status: "weird", queued: false })] },
    pool: { queue: [queueItem({ status: 7 })] },
  })))
  const mutedItems = items(muted)
  assert.equal(mutedItems.length, 1, "沉默场条目 = 队列一条（子 agent 项 = 核件面 —— 不入描述符树）")
  assert.equal(mutedItems[0].props["data-status"], undefined, "非串状态 ⇒ 零 data-status")
  assert.deepEqual(texts(mutedItems[0].children[0]), ["待跑任务"], "非串状态 ⇒ 零状态词")
  assert.deepEqual(families(muted), ["subagents", "queue"], "表外码子 agent 块仍占族（零状态词归核件面 —— 不自造词）")

  // **归档墓碑过滤**（项 5）：`region: "flow"` 表项池内退场（族计数 / empty 判定同源过滤）
  const archived = block({ frozen: true, status: "done", doneAt: Date.now(), region: "flow" })
  const living = block({ key: "sub:coder#2", label: "coder#2", id: 2 })
  assert.deepEqual(poolModel(state({ subBlocks: { "1": [archived] } })).blocks, [], "全墓碑 ⇒ 块表空")
  assert.equal(poolModel(state({ subBlocks: { "1": [archived] } })).state, "empty", "全墓碑 ≈ 三族皆空 ⇒ empty（归档者不占位）")
  const mixed = poolModel(state({ subBlocks: { "1": [archived, living] } }))
  assert.deepEqual(mixed.blocks.map((entry) => entry.key), ["sub:coder#2"], "墓碑过滤：只留在场块（池内退场）")
  assert.deepEqual(families(poolTree(mixed)), ["subagents"], "族节点随过滤后非空表")

  const reads = poolTree(poolModel(state({ subBlocks: { "1": [block()] }, pool: { running: 0, approval: 2 } })))
  assert.deepEqual(texts(readOf(reads, "running")), ["0"], "读数 = String(数)（含 0 —— 0 亦是读数）")
  assert.deepEqual(texts(readOf(reads, "approval")), ["2"], "读数 = String(数)")
  const fakeReads = poolTree(poolModel(state({ subBlocks: { "1": [block()] }, pool: { running: "3", approval: null } })))
  assert.equal(readOf(fakeReads, "running"), undefined, "读数非数 ⇒ 零节点（禁假造）")
  assert.equal(readOf(fakeReads, "approval"), undefined, "读数缺 ⇒ 零节点")

  // 零工具行负向锁（右列条目型闭集不含 tool —— 工具面 = 对话流工具卡）
  const dump = JSON.stringify(full)
  assert.equal(dump.includes('"tool"'), false, "零工具行节点（条目型 / 段码里无 tool）")
  assert.equal(dump.includes("npm"), false, "参数摘要不入右列树（工具面在对话流）")
})

// ─── U73 右列折叠与两读数（含 togglePool 三支 + 薄挂载）──────────

test("U73: 右列折叠与两读数（体零条目 ∧ 头读数仍在 ∧ aria 两态 ∧ togglePool 三支 + 按会话记忆 + 薄挂载键控差分）", (ctx) => {
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

  // 薄挂载（假 DOM）：props 复制 + 清空 + 入位，宿主 data-slot 保留
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档 —— 载体自身不静默失效）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("section")
  root.setAttribute("data-slot", "pool")
  const model = mountPool(root, base, { onTogglePool: () => {} })
  assert.equal(model.state, "pool", "挂载回执 = 模型（调用面零分支）")
  assert.equal(root.getAttribute("data-pool"), "", "根锚复制到宿主")
  assert.equal(root.getAttribute("data-state"), "pool", "态锚复制到宿主")
  assert.equal(root.getAttribute("data-slot"), "pool", "宿主 data-slot 保留（槽位零改）")
  assert.equal(root.querySelector("[data-pool-head]") !== null, true, "头入位")
  assert.equal(root.querySelector("[data-pool-body]") !== null, true, "体入位")
  const family = root.querySelector('[data-family="subagents"]')
  assert.equal(family !== null, true, "子 agent 族容器入位")
  const element = root.querySelector(".sub-block")
  assert.equal(element !== null, true, "核件块元素入位（`details.advisor-block.sub-block`）")
  assert.equal(element.tag, "details", "块元素 = details")
  // 键控差分：同 key 再挂 ⇒ 同元素（不重建）；容器常驻；两族照帧刷
  const again = mountPool(root, base, {})
  assert.equal(again.state, "pool", "再挂 = 幂等（props 再复制）")
  assert.equal(root.querySelectorAll("[data-pool-head]").length, 1, "再挂 ⇒ 头恰一枚（不叠加）")
  assert.equal(root.querySelector(".sub-block"), element, "**同 key 元素跨帧同一**（键控差分 —— 不重建）")
  assert.equal(root.querySelector('[data-family="subagents"]'), family, "族容器常驻（跨帧同一）")
  assert.notEqual(mountPool(null, state()), null, "容器缺位 ⇒ 模型照给（零抛）")
})

// ─── U168 子 agent 族核件面（「对齐第二批」项 3）──────────────

test("U168: 子 agent 族核件面（块壳 ∧ 头文形两态 ∧ tail-3 `│ ` ∧ ⏹ 判据 · 接管末刷 · 同 key 复用 + 内容增量 · 跨会话换代 · sub.desc 一次性）", (ctx) => {
  setupDict(ctx)
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("section")
  root.setAttribute("data-slot", "pool")

  // ① 块壳与头文形（live：`[▶ role#id · async · model · 0s · turn 3/100]` + 状态词）
  mountPool(root, state({ subBlocks: { "1": [block()] } }), {})
  const element = root.querySelector(".sub-block")
  assert.equal(element.getAttribute("data-subname"), "sub:coder#1", "块壳 data 面：data-subname = 核态机键")
  assert.equal(element.getAttribute("data-subrole"), "coder", "data-subrole = 角色")
  assert.equal(element.getAttribute("data-subid"), "1", "data-subid = 核态机 id")
  const header = element.querySelector(".sub-hdr")
  assert.equal(header.textContent.startsWith("[▶ coder#1 · ⟦sub.async⟧ · glm-5.3 · 0s · turn 3/100]"), true, `头文形 = 核件 VSC 同件（实 = ${header.textContent}）`)
  assert.equal(header.textContent.includes("⟦status.thinking⟧…"), true, "live 状态词 = 核 `status.thinking`+…（闭枚举）")
  assert.equal(element.querySelector(".sub-stop-btn") !== null, true, "async 池 running ⇒ ⏹ 在场")
  assert.equal(element.querySelector(".sub-desc").textContent, "⟦sub.desc⟧", "会话首块 = 说明行一次性（核 `renderSubDesc`）")

  // ② 内容行增量 + tail-3（`│ ` 前缀独立行）：同 key 更新 ⇒ 同元素、内容行追加（不重建）
  const r1 = { kind: "text", text: "第一行" }
  const r2 = { kind: "text", text: "第二行", sub: "s2" } // 异 sub ⇒ 新行（核合并判据 = 同 kind ∧ 同 sub 才拼接）
  mountPool(root, state({ subBlocks: { "1": [block({ rows: [r1] })] } }), {})
  assert.equal(root.querySelector(".sub-block"), element, "内容追加 ⇒ 同 key 元素复用（不重建）")
  assert.equal(element.querySelectorAll(".advisor-text").length, 1, "内容行 1 行入块体（核 `renderSubagentChunk`）")
  mountPool(root, state({ subBlocks: { "1": [block({ rows: [r1, r2] })] } }), {})
  assert.equal(root.querySelector(".sub-block"), element, "再追加 ⇒ 元素仍同一")
  assert.equal(element.querySelectorAll(".advisor-text").length, 2, "增量重放：只追新行（1 ⇒ 2）")
  assert.equal(element.querySelector(".sub-tail"), null, "live ∧ 展开 ⇒ 零 tail（核件：tail-3 只入折叠 / 冻结态）")
  assert.equal(element.querySelectorAll(".sub-desc").length, 1, "说明行仍恰一（不重复）")
  assert.equal(element.querySelector(".sub-desc") !== null, true, "说明行随元素存活（一次性 —— 非每帧）")

  // ③ 终态折叠（frozen）：头词换 `[✓ … done 0s]`、⏹ 摘除、内容仍可展开（`open=false`）
  const frozen = block({ frozen: true, status: "done", doneAt: Date.now(), rows: [r1, r2] })
  mountPool(root, state({ subBlocks: { "1": [frozen] }, pool: { running: 0 } }), {})
  const foldedEl = root.querySelector(".sub-block")
  assert.equal(foldedEl, element, "终态折叠 ⇒ 同元素（就地）")
  assert.equal(foldedEl.classList.contains("sub-frozen"), true, "class 翻转 sub-live ⇒ sub-frozen")
  assert.equal(foldedEl.open, false, "终态折叠（默认收起 —— 可展开）")
  assert.equal(foldedEl.querySelector(".sub-stop-btn"), null, "冻结 ⇒ ⏹ 摘除（核 fold 同形）")
  assert.equal(foldedEl.querySelector(".sub-hdr").textContent.startsWith("[✓ coder#1 · ⟦sub.async⟧ · glm-5.3 · ⟦sub.done⟧ 0s"), true, `冻结头文形 = [✓ … done Ns]（实 = ${foldedEl.querySelector(".sub-hdr").textContent}）`)
  assert.equal(foldedEl.querySelectorAll(".advisor-text").length, 2, "内容留场（可展开 —— 零截断）")
  assert.equal(foldedEl.querySelector(".sub-tail").textContent.includes("│ 第二行"), true, "tail-3 = `│ ` 前缀独立行（折叠态在场）")

  // ④ 新代接管（同键新代：前态冻结 ∧ 新态未冻结）⇒ 换新元素（核 takeover 同形）
  const fresh = block({ key: "sub:coder#1", label: "coder#1", id: 1, rows: [] })
  mountPool(root, state({ subBlocks: { "1": [fresh] } }), {})
  const replaced = root.querySelector(".sub-block")
  assert.notEqual(replaced, foldedEl, "新代接管 ⇒ 换新元素（旧代已归档入流）")
  assert.equal(replaced.classList.contains("sub-live"), true, "新代 = live 形态")
  assert.equal(replaced.querySelectorAll(".advisor-text").length, 0, "新代内容面清零（不继承旧代行）")
  assert.equal(replaced.querySelector(".sub-stop-btn") !== null, true, "接管后挂载后末刷 ⇒ ⏹ 在场（`isConnected` 门控 —— 与首见径同序）")
  // ④(b) 接管至 queued（新代未起跑）：末刷同径 ⇒ 「取消排队」钮在场（核 `updateStopButton` queued 支同门控）
  const parked = block({ key: "sub:coder#1", label: "coder#1", id: 1, frozen: true, status: "done", doneAt: Date.now(), rows: [] })
  mountPool(root, state({ subBlocks: { "1": [parked] }, pool: { running: 0 } }), {})
  const parkedOver = block({ key: "sub:coder#1", label: "coder#1", id: 1, status: "queued", queued: true, pool: false, syncLive: false })
  mountPool(root, state({ subBlocks: { "1": [parkedOver] } }), {})
  const parkedEl = root.querySelector(".sub-block")
  assert.notEqual(parkedEl, replaced, "冻结 ⇒ queued 亦走新代接管径（换元素）")
  assert.equal(parkedEl.querySelector(".sub-stop-btn") !== null, true, "接管后末刷：queued 接管态 ⇒ 取消排队钮在场（同门控）")

  // ⑤ ⏹ 判据（诚实非死控）：consult（无池 / 无 registry）⇒ 零钮；queued ⇒ 在场；frozen ⇒ 零钮
  const consult = block({ key: "sub:consult#2", role: "consult", id: 2, pool: false, syncLive: false })
  mountPool(root, state({ subBlocks: { "1": [consult] } }), {})
  assert.equal(root.querySelector(".sub-block").querySelector(".sub-stop-btn"), null, "consult（不可中止）⇒ 零钮")
  const queuedCoder = block({ key: "sub:coder#3", label: "coder#3", id: 3, status: "queued", queued: true, pool: false, syncLive: false })
  mountPool(root, state({ subBlocks: { "1": [queuedCoder] } }), {})
  assert.equal(root.querySelector(".sub-block").querySelector(".sub-stop-btn") !== null, true, "queued（家族角色）⇒ ⏹ 在场（可撤销排队）")
  const queuedConsult = block({ key: "sub:consult#4", role: "consult", id: 4, status: "queued", queued: true, pool: false, syncLive: false })
  mountPool(root, state({ subBlocks: { "1": [queuedConsult] } }), {})
  assert.equal(root.querySelector(".sub-block").querySelector(".sub-stop-btn"), null, "queued consult ⇒ 零钮（FAMILY_ROLES 角色门 —— 核件同 VSC）")

  // ⑥ 零工具行负向锁（DOM 面）：条目型闭集 = {approval, queue}；核件块面不入工具行
  const types = [...new Set([...root.querySelectorAll("[data-pool-item]")].map((node) => node.getAttribute("data-pool-item")))].sort()
  assert.deepEqual(types, [], "无池条目时零条目型（子 agent 项 = 核件元素 —— 不带 data-pool-item）")
  assert.equal(root.querySelectorAll('[data-pool-item="tool"]').length, 0, "零工具行（工具面 = 对话流工具卡）")

  // ⑦ 跨会话换代（「键域与换代」—— 元素复用键域 = 会话内）：同键重现于另一会话 ⇒ 弃容器重建（不承旧账）
  const rOld = { kind: "text", text: "旧会话行" }
  const rNewA = { kind: "text", text: "新会话行一" }
  const rNewB = { kind: "text", text: "新会话行二", sub: "s2" } // 异 sub ⇒ 新行（同 ② 合并判据）
  mountPool(root, state({ activeSession: "1", activeTab: "1", subBlocks: { "1": [block({ rows: [rOld] })] } }), {})
  const oldGen = root.querySelector(".sub-block")
  assert.deepEqual([...oldGen.querySelectorAll(".advisor-text")].map((node) => node.textContent), ["旧会话行"], "夹具：旧会话块一行")
  mountPool(root, state({ activeSession: "2", activeTab: "2", subBlocks: { "2": [block({ rows: [rNewA, rNewB] })] } }), {})
  const newGen = root.querySelector(".sub-block")
  assert.notEqual(newGen, oldGen, "跨会话同键 ⇒ 弃旧容器重建（元素换代 —— 不复用旧会话元素）")
  assert.equal(root.querySelectorAll(".sub-block").length, 1, "族恰一枚块（旧容器弃用后零残留）")
  assert.deepEqual([...newGen.querySelectorAll(".advisor-text")].map((node) => node.textContent), ["新会话行一", "新会话行二"], "行账复位（`_rowsDone` 归零 —— 头新体旧 ⇒ 消除）")
  mountPool(root, state({ activeSession: "1", activeTab: "1", subBlocks: { "1": [block({ rows: [rOld] })] } }), {})
  const backGen = root.querySelector(".sub-block")
  assert.notEqual(backGen, newGen, "切回原会话 ⇒ 再换代（族重建 —— 旧元素不复活）")
  assert.deepEqual([...backGen.querySelectorAll(".advisor-text")].map((node) => node.textContent), ["旧会话行"], "切回 ⇒ 本会话行恰一（不叠加）")
})

// ─── U169 停止出口（`stopSubagent` · 零乐观写）+ ⏹ 点击委托 ──────────────

test("U169: 停止出口（载荷逐字 `{ key, id, role? }` · `ok` 真 ⇒ `true` ∧ 零切片写 · 失败与抛 ⇒ `console.error` + `false`）+ ⏹ 委托", async (ctx) => {
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

  // ⏹ 点击委托（「对齐第二批」项 3）：核件钮无 `data-action` —— 载荷读 `data-sub-id` / `data-sub-role`；
  // 键 = 现刻活动会话；幂等注册；非钮点按 ⇒ 零动作
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("section")
  root.setAttribute("data-slot", "pool")
  const host2 = { calls: [], invoke(channel, payload) { this.calls.push([channel, payload]); return Promise.resolve({ ok: true }) } }
  const store = { get: () => state({}) }
  assert.equal(bindSubagentStop(root, host2, store), true, "首次注册 ⇒ true")
  assert.equal(bindSubagentStop(root, host2, store), false, "重复注册 ⇒ false（幂等 —— `_stopBound` 记账）")
  mountPool(root, state({ subBlocks: { "1": [block()] } }), {})
  const stopBtn = root.querySelector(".sub-stop-btn")
  assert.equal(stopBtn.getAttribute("data-sub-id"), "1", "钮身份锚 = data-sub-id（核件落笔）")
  assert.equal(stopBtn.getAttribute("data-sub-role"), "coder", "钮身份锚 = data-sub-role")
  fake.fire(root, "click", { target: stopBtn })
  assert.deepEqual(host2.calls, [["subagent:stop", { key: "1", id: "1", role: "coder" }]], "委托载荷 = `{ key, id, role }`（id / role 读钮 data 锚 —— 与 ev:subagent 同源）")
  host2.calls.length = 0
  fake.fire(root, "click", { target: root.querySelector(".pool-head") })
  assert.deepEqual(host2.calls, [], "非 ⏹ 点按 ⇒ 零动作（不误发）")
})
