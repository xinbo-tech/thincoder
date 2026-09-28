/**
 * views-approval.test.mjs — E-1 审批卡面用例（批档 §2.2（a）+ §2.3 U68–U70 · `docs/desktop/design/UI.md` §1 审批呈现行 /
 * 键盘可达行 · KD-8 / KD-14）：两形与键位闭集 / 降级与接线两态 / 出口动作与负例。
 * 面 = `approvalTree` / `verdictOfKey` / `approvalExits`（**纯构树**）+ 出口与键盘**落点面**（假 DOM · `test/fake-dom.mjs`）：
 * 描述符 → 节点那一段（`dom.mjs el()` 的事件注册面）在本档机检，不靠人工走查。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import {
  approvalActions, approvalExits, approvalSummary, approvalTitle, approvalTree, respondApproval, verdictOfKey,
} from "../renderer/views/approval.mjs"
import { DIFF_FILE_FLOOR, DIFF_LINE_FLOOR, toolChanges } from "../renderer/views/chat-tool.mjs"
import { focusAutofocus } from "../renderer/views/chat-chrome.mjs"
import { build } from "../renderer/dom.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

/** 剥注释（块 / 行）：源面机检须看**代码面** —— 头注里的 `store.mjs` 字样（本档头注确有「零 `store.mjs` import」一句）不得当证据。 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
}

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
/** 属性在场筛选（DFS 序 · 值不约束）。 */
const withAttr = (tree, name) => nodes(tree).filter((node) => node.props?.[name] !== undefined)
/** 单点取（先例 = `views-chrome.test.mjs` 的 `[0]` 取法）。 */
const one = (tree, name) => withAttr(tree, name)[0]
/** 三出口按钮序（操作区子序 = 键位序）。 */
const exitsOf = (tree) => one(tree, "data-approval-actions").children

/** 词面哨兵：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = {
  "approval.batch.count": "⟦batch:${count}⟧",
  "chat.tool.changes": "⟦chg:${files}+${add}-${del}⟧",
}
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error"]

function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => initDict({}))
}

const single = (over = {}) => ({ shape: "single", promptId: "p1", tool: "Bash", argsSummary: "npm test", ...over })
const batch = (over = {}) => ({ shape: "batch", promptId: "p2", batch: { count: 3, tools: ["Bash", "Edit", "Read"] }, ...over })
const changesOf = (length, insertions = 0, deletions = 0) => ({
  items: Array.from({ length }, (_, index) => ({ path: `f${index}`, insertions, deletions })),
})

// ─── U68 卡面两形与键位闭集 ──────────────────────────────────

test("U68: 卡面两形与键位闭集（根锚 / 首行 / 三出口逐位 / 焦点锚 / verdictOfKey 矩阵）", (ctx) => {
  setupDict(ctx)

  const card = approvalTree(single())
  assert.equal(card.props["data-card"], "approval", "卡根锚 = data-card=approval")
  assert.equal(card.props["data-prompt-id"], "p1", "身份锚 = 待决项 prompt-id（路由键）")
  assert.equal(card.props["data-shape"], "single", "形锚 = single")
  assert.deepEqual(
    texts(one(card, "data-approval-head")),
    ["Bash", "npm test", "⟦tab.badge.approval⟧"],
    "逐项首行 = 工具名 + 参数摘要 + 状态词（复用位标词键 —— 零副本）",
  )
  assert.equal(one(card, "data-approval-head").tag, "div", "首行 = 纯展示行（非控件）")
  const headSegs = (tree) => withAttr(one(tree, "data-approval-head"), "data-seg").map((node) => node.props["data-seg"])
  assert.deepEqual(headSegs(card), ["name", "args", "status"], "逐项首行段码序 = name / args / status")
  assert.equal(headSegs(card).length, one(card, "data-approval-head").children.length, "首行子节点**全为** `[data-seg]` 元素（裸串零入 flex 行）")
  assert.deepEqual(headSegs(approvalTree(single({ argsSummary: undefined }))), ["name", "status"], "参摘缺 ⇒ 该段零节点（段数 = 在场段数）")
  assert.deepEqual(
    exitsOf(card).map((node) => node.props["data-action"]),
    ["approval:once", "approval:always", "approval:reject"],
    "逐项三出口 = once → always → reject（呈现序 = 描述符序）",
  )
  assert.deepEqual(exitsOf(card).map((node) => node.props["data-key"]), ["1", "2", "3"], "键位 1/2/3 逐位同序")
  assert.deepEqual(texts(one(card, "data-approval-actions")), ["⟦approval.once⟧", "⟦approval.always⟧", "⟦approval.reject⟧"], "三出口文本 = 词表值")
  assert.equal(withAttr(card, "data-autofocus").length, 1, "焦点锚恰一枚（逐项）")
  assert.equal(one(card, "data-autofocus").props["data-key"], "3", "逐项 ⇒ 置焦最安全键 reject（键 3）")
  assert.equal(withAttr(card, "data-tool-changes").length, 0, "changes 缺 ⇒ 零改动摘要行")

  const wide = approvalTree(batch({ promptId: 7 }))
  assert.equal(wide.props["data-prompt-id"], "7", "非串 prompt-id ⇒ 串形（锚单形）")
  assert.equal(wide.props["data-shape"], "batch", "形锚 = batch")
  assert.deepEqual(texts(one(wide, "data-approval-head")), ["⟦batch:3⟧", "Bash", "Edit", "Read"], "批形首行 = 计数词 + 逐工具名（零状态词）")
  assert.deepEqual(headSegs(wide), ["count", "name", "name", "name"], "批形首行段码 = count + 逐名 name（不定长段集）")
  assert.deepEqual(
    exitsOf(wide).map((node) => node.props["data-action"]),
    ["approval:approveAll", "approval:deny", "approval:oneByOne"],
    "批形三出口 = approveAll → deny → oneByOne",
  )
  assert.deepEqual(exitsOf(wide).map((node) => node.props["data-key"]), ["1", "2", "3"], "批形键位同形")
  assert.equal(withAttr(wide, "data-autofocus").length, 1, "焦点锚恰一枚（批形）")
  assert.equal(one(wide, "data-autofocus").props["data-key"], "2", "批形 ⇒ 置焦最安全键 deny（键 2）")

  const counted = approvalTree(batch({ batch: { count: 5, tools: ["Bash", "Edit"] } }))
  assert.equal(texts(one(counted, "data-approval-head"))[0], "⟦batch:5⟧", "count 整数 ⇒ 计数词以 count 为准")
  const fallback = approvalTree(batch({ batch: { count: "5", tools: ["Bash", "Edit", null, 7, ""] } }))
  assert.equal(texts(one(fallback, "data-approval-head"))[0], "⟦batch:2⟧", "count 非整数 ⇒ 以清单长度为准（不假造）")
  assert.deepEqual(texts(one(fallback, "data-approval-head")).slice(1), ["Bash", "Edit"], "非空串工具名之外的项滤除")
  assert.equal(approvalTitle({ shape: "batch", batch: { tools: [] } }), "⟦batch:0⟧", "批形标称 = 计数词（清单空 ⇒ 0）")
  assert.equal(approvalTitle(single()), "Bash", "逐项标称 = 工具名")
  assert.deepEqual(approvalSummary(single()), ["Bash", "npm test"], "逐项标识片 = [工具名, 参数摘要]（池面同源消费）")
  assert.deepEqual(approvalSummary(batch()), ["⟦batch:3⟧", "Bash", "Edit", "Read"], "批形标识片 = [计数词, …工具名]")

  assert.equal(approvalTree({ promptId: "p", tool: "T" }).props["data-shape"], undefined, "shape 缺 ⇒ 形锚空位（`el` 跳空位 ⇒ 不落属性 —— 禁假造形）")
  assert.equal(approvalTree({ promptId: "p", shape: "" }).props["data-shape"], undefined, "空串 shape ⇒ 同缺")
  assert.equal(approvalTree({ shape: "single", promptId: null }).props["data-prompt-id"], undefined, "prompt-id 缺 ⇒ 身份锚空位（不落空串）")
  assert.equal(approvalExits({ shape: "weird" }), null, "表外形 ⇒ 零操作区（零动作）")
  assert.equal(approvalExits(undefined), null, "无数 ⇒ 零操作区")
  assert.equal(approvalExits({ shape: "single" }, {}, { autofocus: true }).children.length, 3, "focus 选项不增删出口（唯置焦）")
  assert.equal(
    withAttr(approvalTree({ shape: "weird", promptId: "p" }), "data-autofocus").length,
    0,
    "表外形 ⇒ 零焦点锚（无出口可置焦）",
  )
  assert.equal(
    withAttr(approvalExits({ shape: "single" }, {}, { autofocus: false }), "data-autofocus").length,
    0,
    "不置焦调用（池面条目）⇒ 零焦点锚",
  )

  // verdictOfKey 入参矩阵（两形 × 三键 + 表外 + 非串 + 未知形）
  assert.equal(verdictOfKey("single", "1"), "once")
  assert.equal(verdictOfKey("single", "2"), "always")
  assert.equal(verdictOfKey("single", "3"), "reject")
  assert.equal(verdictOfKey("batch", "1"), "approveAll")
  assert.equal(verdictOfKey("batch", "2"), "deny")
  assert.equal(verdictOfKey("batch", "3"), "oneByOne")
  assert.deepEqual(
    ["single", "batch"].map((shape) => ["1", "2", "3"].map((key) => verdictOfKey(shape, key))),
    [["once", "always", "reject"], ["approveAll", "deny", "oneByOne"]],
    "键位 → 值映射 = 六值闭集（两形各三）",
  )
  for (const key of ["4", "0", "01", "", "enter", "Enter", " "]) {
    assert.equal(verdictOfKey("single", key), null, `表外键 ${JSON.stringify(key)} ⇒ null（零动作）`)
  }
  for (const key of [1, null, undefined, {}, ["1"], true]) {
    assert.equal(verdictOfKey("single", key), null, "非串键 ⇒ null（零动作）")
  }
  assert.equal(verdictOfKey("weird", "1"), null, "未知形 ⇒ null")
  assert.equal(verdictOfKey(undefined, "1"), null, "形缺 ⇒ null")
  assert.equal(verdictOfKey("toString", "1"), null, "原型链形名 ⇒ null（hasOwn 判 —— 不落原型取值）")
  assert.equal(verdictOfKey("single", "constructor"), null, "原型链键名 ⇒ null")
  assert.equal(approvalActions("single").length, 3, "三出口描述符 = 单一 owner（卡面 / 池面同表）")
  assert.equal(approvalActions("batch")[1].safe, true, "安全键标注在册（批形 ⇒ deny）")
  assert.equal(approvalActions("single")[2].safe, true, "安全键标注在册（逐项 ⇒ reject）")
  assert.equal(approvalActions("single")[0].safe, undefined, "非安全键不标（置焦判据单源）")
  assert.equal(approvalActions("nope"), null, "表外形 ⇒ null")
})

// ─── U69 卡面降级与接线两态 ──────────────────────────────────

test("U69: 卡面降级与接线两态（同判据同形 ∧ 阈值边界 ∧ disabled 两态 ∧ 键盘两态）", (ctx) => {
  setupDict(ctx)

  const item = single({ changes: changesOf(1, 3, 1) })
  const small = approvalTree(item)
  assert.deepEqual(one(small, "data-tool-changes"), toolChanges(item), "改动摘要行 deepEqual 工具卡同判据同形（零副本）")
  assert.equal(withAttr(small, "data-file").length, 1, "未越阈 ⇒ 每文件一行")
  assert.equal(texts(one(small, "data-approval-actions")).length, 3, "改动摘要行不夺出口（子序 = 首行 → 摘要 → 出口）")
  assert.deepEqual(
    small.children.map((child) => child === null ? null : child.props["data-approval-head"] !== undefined ? "head" : child.props["data-approval-actions"] !== undefined ? "exits" : child.props["data-diff"] !== undefined ? "diff" : "changes"),
    ["head", "changes", null, "exits"],
    "卡子序 = 首行 → 改动摘要行 → [diff 预览?] → 三出口操作区（无 diff ⇒ 空位）",
  )
  assert.equal(approvalTree(single({ changes: changesOf(0) })).children[1], null, "changes 在场但零项 ⇒ 摘要行空位（toolChanges 判据同源）")

  const floorFiles = approvalTree(single({ changes: changesOf(DIFF_FILE_FLOOR) }))
  assert.equal(withAttr(floorFiles, "data-file").length, DIFF_FILE_FLOOR, `恰 ${DIFF_FILE_FLOOR} 文件 ⇒ 未越阈（严格大于）`)
  const overFiles = approvalTree(single({ changes: changesOf(DIFF_FILE_FLOOR + 1) }))
  assert.equal(withAttr(overFiles, "data-file").length, 0, "文件数越阈 ⇒ 降级（零 [data-file]）")
  assert.equal(withAttr(overFiles, "data-tool-changes").length, 1, "降级 ⇒ 摘要行留（总量不丢）")
  const floorLines = approvalTree(single({ changes: changesOf(1, DIFF_LINE_FLOOR, 0) }))
  assert.equal(withAttr(floorLines, "data-file").length, 1, `恰 ${DIFF_LINE_FLOOR} 行 ⇒ 未越阈`)
  const overLines = approvalTree(single({ changes: changesOf(1, DIFF_LINE_FLOOR, 1) }))
  assert.equal(withAttr(overLines, "data-file").length, 0, "增删合计越阈 ⇒ 降级")
  assert.deepEqual(
    one(overLines, "data-tool-changes"),
    toolChanges(single({ changes: changesOf(1, DIFF_LINE_FLOOR, 1) })),
    "降级形亦 deepEqual 工具卡（同判据 ⇒ 同形）",
  )
  const wideBatch = approvalTree(batch({ changes: changesOf(2, 5, 5) }))
  assert.equal(withAttr(wideBatch, "data-tool-changes").length, 1, "批形 changes 在场 ⇒ 摘要行同落（两形同构）")
  assert.equal(withAttr(wideBatch, "data-file").length, 2, "批形未越阈 ⇒ 文件行在")

  // 键盘两态（描述符面）：闭集命中 ⇒ preventDefault + 派发；表外键 / 非串键 ⇒ 零动作且不吞键；缺 handlers ⇒ 不挂
  assert.equal(approvalTree(single(), {}).props.onKeyDown, undefined, "缺 handlers ⇒ keydown 空位（`el` 跳 ⇒ 不挂监听 —— 不夺焦）")
  const keys = []
  const prevented = []
  const keyed = approvalTree(single(), { onApprove: (promptId, verdict) => keys.push([promptId, verdict]) })
  assert.equal(typeof keyed.props.onKeyDown, "function", "onApprove 给 ⇒ keydown 在场")
  keyed.props.onKeyDown({ key: "2", preventDefault: () => prevented.push("2") })
  assert.deepEqual(keys, [["p1", "always"]], "闭集命中 ⇒ 派发 (promptId, verdict)")
  assert.deepEqual(prevented, ["2"], "命中 ⇒ preventDefault（本端接管键位）")
  keyed.props.onKeyDown({ key: "9", preventDefault: () => prevented.push("9") })
  keyed.props.onKeyDown({ key: 1, preventDefault: () => prevented.push(1) })
  keyed.props.onKeyDown({ preventDefault: () => prevented.push("空") })
  assert.deepEqual(keys, [["p1", "always"]], "表外键 / 非串键 / 缺 key ⇒ 零动作")
  assert.deepEqual(prevented, ["2"], "表外 ⇒ 不 preventDefault（不吞键）")

  const bare = approvalTree(single())
  for (const node of exitsOf(bare)) {
    assert.equal(node.props.disabled, true, "缺 handlers ⇒ disabled true（诚实非死控）")
    assert.equal("onClick" in node.props, false, "缺 handlers ⇒ 零 onClick（锚仍在场）")
    assert.ok(String(node.props["data-action"]).startsWith("approval:"), "缺 handlers ⇒ data-action 仍在场")
    assert.equal(node.props["data-key"].length, 1, "缺 handlers ⇒ 键位锚仍在场")
  }
  assert.equal(withAttr(bare, "data-autofocus").length, 1, "缺 handlers ⇒ 焦点锚仍在（置焦不依 handler）")

  const calls = []
  const wired = approvalTree(single({ changes: changesOf(1, 1, 1) }), { onApprove: (promptId, verdict) => calls.push([promptId, verdict]) })
  for (const node of exitsOf(wired)) {
    assert.equal(typeof node.props.onClick, "function", "handlers 给 ⇒ 落 onClick")
    assert.equal("disabled" in node.props, false, "handlers 给 ⇒ 不落 disabled")
  }
  for (const node of exitsOf(wired)) node.props.onClick()
  assert.deepEqual(calls, [["p1", "once"], ["p1", "always"], ["p1", "reject"]], "三出口同一路：逐键携 (promptId, verdict)")
  const batchCalls = []
  for (const node of exitsOf(approvalTree(batch(), { onApprove: (...args) => batchCalls.push(args) }))) node.props.onClick()
  assert.deepEqual(batchCalls, [["p2", "approveAll"], ["p2", "deny"], ["p2", "oneByOne"]], "批形三出口同路（键位闭集驱动值）")
})

// ─── U70 出口动作与负例 ──────────────────────────────────────

test("U70: 出口动作与负例（载荷逐字 / 拒绝不静默 / 零 store.mjs import 双证 / 假 DOM 落点两路）", async (ctx) => {
  setupDict(ctx)

  // ① 载荷逐字 + 成功回执直传（本档零改写）
  const seen = []
  const okHost = { invoke: async (channel, payload) => { seen.push([channel, payload]); return { accepted: true } } }
  const ok = await respondApproval(okHost, 7, "once")
  assert.deepEqual(seen, [["approval:respond", { promptId: 7, verdict: "once" }]], "窄桥通道名 + 载荷逐字（promptId 原值传递）")
  assert.deepEqual(ok, { accepted: true }, "成功回执直传（调用面零分支）")

  // ② 拒绝 / 同步抛 ⇒ 回执 null ∧ console.error 在场（不静默）
  const errors = []
  const original = console.error
  console.error = (...args) => { errors.push(args) }
  try {
    assert.equal(await respondApproval({ invoke: () => Promise.reject(new Error("no handler")) }, "p", "reject"), null, "拒绝 ⇒ 回执 null")
    assert.equal(errors.length, 1, "拒绝 ⇒ console.error 恰一次")
    assert.equal(errors[0][0], "[renderer] approval:respond failed:", "错面前缀逐字")
    assert.ok(errors[0][1] instanceof Error, "原错随附（不吞）")
    assert.equal(respondApproval({ invoke: () => { throw new Error("sync") } }, "p", "once"), null, "同步抛 ⇒ 回 null（零外向抛）")
    assert.equal(errors.length, 2, "同步抛亦不静默")
    assert.equal(errors[1][0], "[renderer] approval:respond failed:")
  } finally {
    console.error = original
  }

  // ③ 双证：源面（剥注释）零 store.mjs 字样 + 结构面 import 闭集（无 store 可达路径）
  const source = readFileSync(new URL("../renderer/views/approval.mjs", import.meta.url), "utf8")
  const code = stripComments(source)
  assert.equal(code.includes("store.mjs"), false, "源面：代码面零 store.mjs（零乐观写 = 无切片可写）")
  assert.deepEqual(
    [...code.matchAll(/from\s+"([^"]+)"/g)].map((hit) => hit[1]).sort(),
    ["../i18n.mjs", "./chat-tool.mjs", "/rc/diff.mjs", "/rc/lib.mjs"],
    "结构面：import 闭集 = 四档（两本档 + 核三导出供体；无 store 可达路径 · 零 node: / 零裸包）",
  )

  // ④ 假 DOM 落点：三出口经 `build` 落节点 ⇒ 真注册面（`addEventListener`）收 (promptId, verdict)
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档 —— 载体自身不静默失效）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const clicks = []
  const node = build(approvalTree(single(), { onApprove: (promptId, verdict) => clicks.push([promptId, verdict]) }))
  assert.equal(node.getAttribute("data-card"), "approval", "落点面：卡根锚在位")
  const buttons = node.querySelector("[data-approval-actions]").querySelectorAll("[data-action]")
  assert.deepEqual(buttons.map((button) => button.getAttribute("data-key")), ["1", "2", "3"], "落点面：键位锚逐位同序")
  for (const button of buttons) fake.fire(button, "click")
  assert.deepEqual(clicks, [["p1", "once"], ["p1", "always"], ["p1", "reject"]], "落点面：三按钮 click ⇒ 同一 handler 收 (promptId, verdict)")
  assert.equal(fake.fire(build(approvalTree(single(), {}).children[3]).children[0], "click"), 0, "缺 handlers ⇒ 零监听（disabled 面非死控）")

  // ⑤ 假 DOM 落点：卡根 keydown（第一出口面）—— 命中接管 ∧ 表外不吞键 ∧ 缺 handlers 不挂
  const pressed = []
  const prevented = []
  const keyed = build(approvalTree(single(), { onApprove: (promptId, verdict) => pressed.push([promptId, verdict]) }))
  assert.equal(fake.fire(keyed, "keydown", { key: "3", preventDefault: () => prevented.push("3") }), 1, "onApprove 给 ⇒ keydown 监听在场")
  assert.deepEqual(pressed, [["p1", "reject"]], "落点面：键位 3 ⇒ reject 派发")
  fake.fire(keyed, "keydown", { key: "7", preventDefault: () => prevented.push("7") })
  assert.deepEqual(prevented, ["3"], "表外键 ⇒ 零 preventDefault（不吞键）")
  assert.equal(fake.fire(build(approvalTree(single(), {})), "keydown", { key: "1", preventDefault: () => prevented.push("1") }), 0, "缺 handlers ⇒ keydown 不挂（不夺焦）")
})

// ─── U209「对齐第三批」卡面三增量（P1 owner / 相抵① diff / F-置焦）────────

/** 词面哨兵（本例）：diff 降级计数键带参数入词 —— 断言即证「文案经 `t()` 消费 + 参数插值」。 */
const DIFF_TEMPLATE = { "approval.diff.large": "⟦diff:${n}⟧" }

/** patch 夹具：`count` 行内容行（`+` 前缀 ⇒ 全 add）+ 一行头（核 `patchLineType` 同判）。 */
const patchOf = (count) => ["@@ -1 +1 @@", ...Array.from({ length: count }, (_, i) => `+line${i}`)].join("\n")

test("U209: 「对齐第三批」卡面三增量（P1 owner 段 · 相抵① diff 节点两形 / 超阈降级 / 负向 · F-置焦锤点可执行）", (ctx) => {
  initDict({
    locale: "en",
    host: Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? DIFF_TEMPLATE[key] ?? `⟦${key}⟧`])),
    dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])),
  })
  ctx.after(() => initDict({}))

  // ① P1 owner 归属（子代理门）：首行首段 = `<owner> · <tool>` ∧ 工具名不再另落一段
  const owned = approvalTree(single({ owner: "eng-coder#2" }))
  const ownedHead = one(owned, "data-approval-head")
  assert.deepEqual(texts(ownedHead), ["eng-coder#2 · Bash", "npm test", "⟦tab.badge.approval⟧"], "首行 = owner · tool（格式串与核卡同形）+ 参摘 + 状态词")
  assert.deepEqual(withAttr(ownedHead, "data-seg").map((node) => node.props["data-seg"]), ["owner", "args", "status"], "owner 在场 ⇒ 段码序 = owner / args / status")
  assert.equal(withAttr(ownedHead, "data-seg").length, ownedHead.children.length, "首行子节点全为 `[data-seg]` 元素（裸串零入 flex 行）")
  assert.deepEqual(texts(one(approvalTree(single()), "data-approval-head")), ["Bash", "npm test", "⟦tab.badge.approval⟧"], "owner 缺 ⇒ 既有形零回归（段码 = name / args / status）")
  assert.deepEqual(
    texts(one(approvalTree(single({ owner: "coder#1", tool: undefined })), "data-approval-head")),
    ["coder#1", "npm test", "⟦tab.badge.approval⟧"],
    "owner 在场而工具名缺 ⇒ 零悬挂分隔符（不拼空段）",
  )
  assert.deepEqual(
    texts(one(approvalTree(batch({ owner: "coder#1" })), "data-approval-head")),
    ["⟦batch:3⟧", "Bash", "Edit", "Read"],
    "批形零 owner 段（核批卡无 owner 面 —— 两形同构不变）",
  )

  // ② 相抵① diff 两形（行面 = 核三导出直取）：patch 形 ⇒ 头 = 工具名 + 行级差 html（核 `renderDiff` 产出）
  const patchCard = approvalTree(single({ tool: "apply_patch", diff: { patch: patchOf(3) } }))
  const patchNode = one(patchCard, "data-diff")
  assert.equal(patchNode.props.class, "diff-preview", "diff 节点 = `.diff-preview`（核类名面）")
  assert.equal(patchNode.props["data-diff"], "lines", "未越阈 ⇒ `lines` 面")
  assert.deepEqual(texts(patchNode.children[0]), ["apply_patch"], "patch 形头 = 工具名（核卡同形）")
  assert.equal(patchNode.children[1].props["data-diff-lines"], "", "行级差携机读锚")
  assert.ok(patchNode.children[1].props.html.includes("diff-add") && patchNode.children[1].props.html.includes("diff-line"), "行面 = 核 `renderDiff` 产出（diff-add / diff-line 类名面）")
  const oldNew = approvalTree(single({ tool: "Edit", diff: { old: "a\nb\nc", new: "a\nx\nc", path: "src/a.mjs" } }))
  const oldNewNode = one(oldNew, "data-diff")
  assert.deepEqual(texts(oldNewNode.children[0]), ["src/a.mjs"], "old/new 形头 = 盘上路径（核卡 `diff.path` 同形）")
  assert.ok(oldNewNode.children[1].props.html.includes("diff-del") && oldNewNode.children[1].props.html.includes("diff-add"), "两向行面在场（删 / 增）")

  // ③ 超阈降级（patch > 20 行 ∥ 改动 > 12 行）⇒ 只出摘要 + 计数（零外部查看器）；边界 = 严格大于
  const floorPatch = one(approvalTree(single({ diff: { patch: patchOf(19) } })), "data-diff")
  assert.equal(floorPatch.props["data-diff"], "lines", "恰 20 行（头行 + 19）⇒ 未越阈（严格大于）")
  const bigPatch = one(approvalTree(single({ tool: "apply_patch", diff: { patch: patchOf(20) } })), "data-diff")
  assert.equal(bigPatch.props["data-diff"], "large", "21 行 ⇒ 越阈")
  assert.equal(bigPatch.children[1].props["data-diff-lines"], undefined, "降级 ⇒ 零行面（预览省略）")
  assert.deepEqual(texts(bigPatch.children[1]), ["⟦diff:21⟧"], "计数 = 行数（含头行）+ 键带参入词")
  assert.deepEqual(texts(bigPatch.children[0]), ["apply_patch"], "降级 ⇒ 摘要（头行）仍在")
  const oldNewCase = (changed) => single({
    diff: { old: "a\nz", new: ["a", ...Array.from({ length: changed }, (_, i) => `x${i}`), "z"].join("\n") },
  })
  assert.equal(one(approvalTree(oldNewCase(12)), "data-diff").props["data-diff"], "lines", "old/new 形：恰 12 行改动 ⇒ 未越阈")
  const bigOldNew = one(approvalTree(oldNewCase(13)), "data-diff")
  assert.equal(bigOldNew.props["data-diff"], "large", "old/new 形：13 行改动 ⇒ 越阈")
  assert.deepEqual(texts(bigOldNew.children[1]), ["⟦diff:13⟧"], "old/new 形计数 = 改动行数（非全行数）")

  // ④ 负向面：缺 diff / 表外形 / 两形皆不可组 ⇒ 零节点；批形同构
  for (const item of [
    single(),
    single({ diff: null }),
    single({ diff: "patch" }),
    single({ diff: {} }),
    single({ diff: { patch: "" } }),
    single({ diff: { old: "a", new: "a" } }),
    single({ diff: { old: "a", new: 7 } }),
    single({ diff: { old: "a" } }),
  ]) {
    assert.equal(withAttr(approvalTree(item), "data-diff").length, 0, `负向 ${JSON.stringify(item.diff ?? null)} ⇒ 零 diff 节点（禁假造）`)
  }
  assert.equal(withAttr(approvalTree(single({ diff: { old: "a", new: "b" } })), "data-diff").length, 1, "old/new 单行改写 ⇒ 节点在场（正例 —— 非负向）")
  assert.equal(withAttr(approvalTree(batch({ diff: { patch: patchOf(2) } })), "data-diff").length, 1, "批形同构（diff 节点两形同落）")

  // ⑤ F-置焦（锤点可执行）：卡内 `[data-autofocus="1"]` 恰一 ∧ 帧尾执行器对它执行 `focus()`
  assert.equal(withAttr(approvalTree(single()), "data-autofocus").length, 1, "卡内焦点锚恰一（逐项）")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const focused = []
  Object.defineProperty(Object.getPrototypeOf(fake.element()), "focus", {
    configurable: true,
    value: function focus() { focused.push(this.getAttribute("data-key") ?? this.getAttribute("data-autofocus")) },
  })
  const cardRoot = fake.element("div")
  const cardEl = build(approvalTree(single(), { onApprove: () => {} }))
  cardRoot.append(cardEl)
  focusAutofocus(cardRoot)
  assert.deepEqual(focused, ["3"], "帧尾执行器 ⇒ 逐项形最安全键（键 3）获焦")
  focusAutofocus(cardRoot)
  assert.deepEqual(focused, ["3"], "已执行过 ⇒ 零重焦（不夺已移焦）")
})
