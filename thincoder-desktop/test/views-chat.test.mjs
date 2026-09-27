/**
 * views-chat.test.mjs — E-3 对话流视图树面用例（批档 §2.4 U58–U62 · 批 7 §2.3 树面）：
 * 三态与根锚 / 块五型与块序 / 工具卡三行与降级 / 折叠默认态与 toggle / 接线形与词表面。
 * 判据面 = 纯构树（`chatModel` / `chatTree` / `toggleExpanded`）——**帧面**（`mountChat` / `syncChrome` / `settleFrame` ·
 * 假 DOM = `test/fake-dom.mjs`）本批拆出，住 `test/views-chat-frame.test.mjs`（U71 —— 档行预算，`docs/desktop/design/PROJECT.md` §4.1）。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { chatModel, chatTree } from "../renderer/views/chat.mjs"
import { toggleExpanded } from "../renderer/views/chat-tool.mjs"

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
const many = (count) => Array.from({ length: count }, (_, index) => user({ id: `b${index + 1}` }))
const tool = (over = {}) => ({ kind: "tool", id: "t1", name: "Bash", argsSummary: "npm test", status: "done", ...over })

// ─── U58 三态与根锚 ──────────────────────────────────────────

test("U58: 三态与根锚（none 零块节点 + 引导节点 / empty 提示 / flow 四锚）", (ctx) => {
  setupDict(ctx)

  const off = chatModel(state({ activeSession: null, blocks: [user()] }))
  assert.equal(off.state, "none", "无活动会话 ⇒ none")
  assert.deepEqual(off.blocks, [], "none ⇒ 零块（守 data-blocks 不变式：不落 stale 块）")
  assert.equal(off.hidden, 0, "none ⇒ hidden 归 0")
  const offTree = chatTree(off)
  assert.equal(offTree.props["data-state"], "none", "data-state = none")
  assert.equal(offTree.props["data-blocks"], 0, "none ⇒ data-blocks = 0")
  const offKids = offTree.children
  assert.equal(offKids.length, 1, "none ⇒ 根唯一子 = 引导节点（零**块**节点 —— 禁假数据）")
  assert.equal(offKids[0].props["data-guide"], "no-project", "无活动会话 ∧ `cwd` 缺 ⇒ no-project（判据单源 = `chatModel.guide`）")
  assert.equal(off.guide, "no-project", "模型 `guide` 字段同源可读")

  const blank = chatModel(state({ blocks: [] }))
  assert.equal(blank.state, "empty", "有会话零块 ⇒ empty")
  const blankTree = chatTree(blank)
  assert.equal(blankTree.props["data-state"], "empty", "data-state = empty")
  assert.deepEqual(blankTree.children.map((node) => node.props.class), ["chat-empty"], "empty ⇒ 只提示节点")
  assert.deepEqual(texts(blankTree), ["⟦chat.empty.hint⟧"], "提示文本 = chat.empty.hint 词表值")

  const flowTree = chatTree(chatModel(state({ blocks: [user({ id: "u1" }), user({ id: "u2" })], following: false, pendingNew: 2 })))
  assert.equal(flowTree.props["data-state"], "flow", "有块 ⇒ flow")
  assert.equal(flowTree.props["data-blocks"], 2, "data-blocks = 块数（= DOM 块节点数）")
  assert.equal(flowTree.props["data-hidden"], 0, "data-hidden = 隐藏块数（未越窗 ⇒ 0）")
  assert.equal(flowTree.props["data-following"], "0", "data-following 随 following（串两态）")
  assert.deepEqual(withAttr(flowTree, "data-block-kind").map((node) => node.props["data-block-id"]), ["u1", "u2"], "块位序 = 入参序")
})

// ─── U59 块五型与块序 ────────────────────────────────────────

test("U59: 块五型与块序（逐位同序 ∧ 兜底键 = 全列表位序 ∧ 文本裸串）", (ctx) => {
  setupDict(ctx)
  const blocks = [
    user({ id: "u1", text: "<b>原文</b>" }),
    { kind: "assistant", id: "a1", text: "流中", streaming: true },
    { kind: "reasoning", text: "想" },
    tool({ id: "t1", result: "R" }),
    { kind: "error", text: "崩" },
  ]
  const tree = chatTree(chatModel(state({ blocks })))
  const kindNodes = withAttr(tree, "data-block-kind")
  assert.deepEqual(
    kindNodes.map((node) => node.props["data-block-kind"]),
    ["user", "assistant", "reasoning", "tool", "error"],
    "五型单序列 · 逐位同序",
  )
  assert.deepEqual(
    kindNodes.map((node) => node.props["data-block-id"]),
    ["u1", "a1", "2", "t1", "4"],
    "块键 = id ?? 全列表位序串（无 id 两块取位序 2 / 4）",
  )
  assert.equal(kindNodes[1].props["data-streaming"], "1", "assistant.streaming ⇒ data-streaming=1")
  assert.equal(kindNodes[0].props["data-streaming"], undefined, "非流式块零 data-streaming（不落空锚）")
  const sent = one(chatTree(chatModel(state({ blocks: [{ kind: "user", text: "发送文本" }] }))), "data-block-kind")
  assert.deepEqual([sent.props["data-block-kind"], sent.props["data-block-id"], texts(sent)[0]], ["user", "0", "发送文本"], "发送面块形（无 id）⇒ 树面 user 块 + 兜底位序键 + 文本逐字（#458 ③）")
  assert.ok(texts(tree).includes("<b>原文</b>"), "文本节点 = 入参原样（零 HTML / Markdown 转换）")
  assert.ok(texts(tree).includes("流中") && texts(tree).includes("想") && texts(tree).includes("崩"), "四型文本逐位在场")
})

// ─── U60 工具卡三行与降级 ────────────────────────────────────

test("U60: 工具卡三行与降级（八组状态 / 头行四件 / 摘要行两向 / 结果区）", (ctx) => {
  setupDict(ctx)
  const card = (over) => chatTree(chatModel(state({ blocks: [tool(over)] })))
  const head = (tree) => one(tree, "data-tool-head")
  const files = (tree) => withAttr(tree, "data-file")

  const small = card({ result: "R", durationMs: 1500, changes: { items: [{ path: "a.mjs", insertions: 3, deletions: 1 }] } })
  assert.equal(one(small, "data-block-kind").props["data-block-id"], "t1", "卡根携块键（toggle 同域）")
  assert.equal(head(small).props["data-status"], "done", "头行 data-status = 状态码")
  assert.deepEqual(texts(head(small)), ["Bash", "npm test", "⟦sub.done⟧", "⟦dur:1.5⟧"], "头行四件序 = 名 / 参摘 / 状态词 / 耗时")
  const segsOf = (tree) => withAttr(tree, "data-seg")
  assert.deepEqual(segsOf(head(small)).map((node) => node.props["data-seg"]), ["name", "args", "status", "time"], "头行四段逐段包元素（段码序 —— #460 ①）")
  assert.equal(segsOf(head(small)).length, head(small).children.length, "头行子节点**全为** `[data-seg]` 元素（裸串零入 flex 行 ⇒ gap 生效）")
  assert.deepEqual(segsOf(head(card({ argsSummary: undefined, status: "weird" }))).map((node) => node.props["data-seg"]), ["name"], "缺席段零节点（无参摘 / 表外状态词 / 无耗时 ⇒ 只 name 一段）")
  assert.equal(head(small).tag, "button", "有 result ⇒ 头行 = 开关控件")
  assert.deepEqual(files(small).length, 1, "未越阈 ⇒ 每文件一行")
  assert.deepEqual(texts(files(small)[0]), ["a.mjs", "3", "1"], "行文本 = 路径 + 增 / 删数（[data-add] / [data-del]）")
  assert.equal(texts(one(small, "data-tool-changes"))[0], "⟦chg:1+3-1⟧", "摘要行文本 = chat.tool.changes（files / add / del 入词）")
  assert.equal(withAttr(small, "data-tool-result").length, 0, "done 缺省折叠 ⇒ 零结果区（展开矩阵归 U61）")

  const wide = card({ changes: { items: Array.from({ length: 11 }, (_, index) => ({ path: `f${index}`, insertions: 1, deletions: 0 })) } })
  assert.equal(files(wide).length, 0, "文件数 > 10 ⇒ 降级：零 [data-file]")
  assert.equal(texts(one(wide, "data-tool-changes"))[0], "⟦chg:11+11-0⟧", "降级 ⇒ 摘要行留（总量不丢）")
  const deep = card({ changes: { items: [{ path: "a", insertions: 150, deletions: 60 }] } })
  assert.equal(files(deep).length, 0, "增删合计 > 200 ⇒ 降级")
  const edgeFiles = card({ changes: { items: Array.from({ length: 10 }, (_, index) => ({ path: `f${index}`, insertions: 0, deletions: 0 })) } })
  assert.equal(files(edgeFiles).length, 10, "边界：恰 10 文件 ⇒ 未越阈（严格大于）")
  const edgeLines = card({ changes: { items: [{ path: "a", insertions: 100, deletions: 100 }] } })
  assert.equal(files(edgeLines).length, 1, "边界：增删合计恰 200 ⇒ 未越阈")
  assert.equal(withAttr(card({}), "data-tool-changes").length, 0, "无 changes ⇒ 零摘要行")

  const bare = card({ result: "" })
  assert.equal(head(bare).tag, "div", "result 空 ⇒ 头行退纯展示 div")
  assert.equal("data-action" in head(bare).props, false, "result 空 ⇒ 零 toggle 控件（诚实非死控）")
  assert.equal(withAttr(bare, "data-tool-result").length, 0, "result 空 ⇒ 零结果区")

  const failed = card({ status: "error", durationMs: 2400, result: "boom" })
  assert.ok(texts(head(failed)).includes("⟦sub.error⟧"), "状态词 = 核词表值（error）")
  assert.ok(texts(head(failed)).includes("⟦dur:2.4⟧"), "耗时节点在（error ∈ 两态集）")
  assert.deepEqual(texts(one(failed, "data-tool-result")), ["boom"], "缺省 + error ⇒ 展开（结果区在）")

  const live = card({ status: "running", durationMs: 900, result: "…" })
  assert.ok(texts(head(live)).includes("⟦sub.running⟧"), "状态词 = 核词表值（running）")
  assert.equal(texts(head(live)).includes("⟦dur:0.9⟧"), false, "耗时仅 done / error ⇒ running 零耗时节点")
  assert.equal(withAttr(live, "data-tool-result").length, 0, "缺省 + 非 error ⇒ 折叠")

  const waiting = card({ status: "queued", durationMs: 900, result: "…" })
  assert.ok(texts(head(waiting)).includes("⟦sub.queued⟧"), "状态词 = 核词表值（queued）")
  assert.equal(texts(head(waiting)).includes("⟦dur:0.9⟧"), false, "耗时仅 done / error ⇒ queued 零耗时节点")
  const halted = card({ status: "stopped", durationMs: 900, result: "…" })
  assert.ok(texts(head(halted)).includes("⟦sub.stopped⟧"), "状态词 = 核词表值（stopped）")
  const gate = card({ status: "approval", result: "…" })
  assert.ok(texts(head(gate)).includes("⟦tab.badge.approval⟧"), "approval 状态词 = 宿主键 tab.badge.approval（单源不复制）")
  assert.equal(withAttr(gate, "data-tool-result").length, 0, "缺省 + 非 error ⇒ 折叠（approval 同律）")

  const odd = card({ status: "weird", durationMs: "900", result: "x" })
  assert.deepEqual(texts(head(odd)), ["Bash", "npm test"], "表外状态码 ⇒ 零状态词；耗时非数 ⇒ 零耗时（不造事实）")
})

// ─── U61 折叠默认态与 toggle ─────────────────────────────────

test("U61: 折叠默认态与 toggle（显式优先 ∧ 缺省 error 展开 ∧ 三组翻转）", (ctx) => {
  setupDict(ctx)
  const card = (over) => chatTree(chatModel(state({ blocks: [tool({ result: "R", ...over })] })))
  const shown = (tree) => withAttr(tree, "data-tool-result").length > 0

  assert.equal(shown(card({ expanded: true })), true, "显式展开 ⇒ 结果区在")
  assert.equal(shown(card({ expanded: false })), false, "显式折叠 ⇒ 零结果区")
  assert.equal(shown(card({ expanded: false, status: "error" })), false, "显式优先于 error 缺省")
  assert.equal(shown(card({ status: "error" })), true, "缺省 ∧ error ⇒ 展开（错误取证优先）")
  assert.equal(shown(card({ status: "done" })), false, "缺省 ∧ 非 error ⇒ 折叠")
  assert.equal(shown(card({ result: "" })), false, "无结果 ⇒ 结果区无位可展开")

  const blocks = [
    tool({ id: "t1", expanded: false }),
    { kind: "assistant", id: "a1", text: "x" },
    tool({ id: "t3", status: "error" }),
  ]
  const hit = toggleExpanded(blocks, "t1")
  assert.notEqual(hit, blocks, "命中 ⇒ 新数组")
  assert.equal(hit[0].expanded, true, "命中 ⇒ 展开态取反")
  assert.equal(hit[1], blocks[1], "非目标块引用不变（零触碰）")
  assert.equal(hit[2], blocks[2], "非目标块引用不变（零触碰）")
  assert.equal(blocks[0].expanded, false, "入参数组零变异（纯函数）")
  const flipped = toggleExpanded(blocks, "t3")
  assert.equal(flipped[2].expanded, false, "缺省（error 展开）⇒ 取反为折叠")
  assert.equal(toggleExpanded(blocks, "无此键"), blocks, "未命中 ⇒ 原引用（零通知）")
  assert.equal(toggleExpanded(blocks, "a1"), blocks, "命中非 tool ⇒ 原引用（无变化）")
  assert.equal(toggleExpanded(undefined, "t1"), undefined, "非数组入参 ⇒ 原值")
})

// ─── U62 接线形与词表面 ──────────────────────────────────────

test("U62: 接线形与词表面（handlers 两态 ∧ 四控出口 ∧ 药丸文本两态）", (ctx) => {
  setupDict(ctx)
  const model = chatModel(state({ blocks: [many(2)[0], many(2)[1], tool({ result: "R" })], following: false, pendingNew: 2 }), 2)

  const bare = chatTree(model)
  const bareControls = withAttr(bare, "data-action")
  assert.deepEqual(
    bareControls.map((node) => node.props["data-action"]),
    ["chat:backfill", "chat:copy-block", "chat:tool-toggle", "chat:return"],
    "四控 data-action 齐（回填 / 块复制 / toggle / 药丸 —— 根子序 = 摘要 → 块 → 药丸；复制控住带文本块尾）",
  )
  for (const node of bareControls) assert.equal(node.props.disabled, true, "缺 handlers ⇒ disabled true（诚实非死控）")
  const copyAnchors = bareControls.filter((node) => node.props["data-action"] === "chat:copy-block")
  assert.deepEqual(copyAnchors.map((node) => node.props["data-block-id"]), ["b2"], "复制控携本块键（机读锚 = 文本块键 —— 工具卡无文本 ⇒ 零控件）")

  const calls = []
  const copies = []
  const wired = chatTree(model, {
    onToggleTool: (key) => calls.push(["toggle", key]),
    onBackfill: () => calls.push(["backfill"]),
    onReturn: () => calls.push(["return"]),
    writeText: (value) => { copies.push(value) },
  })
  const controls = withAttr(wired, "data-action")
  for (const node of controls) {
    assert.equal(typeof node.props.onClick, "function", "handlers 给 ⇒ 落 onClick")
    assert.equal("disabled" in node.props, false, "handlers 给 ⇒ 不落 disabled")
  }
  for (const node of controls) {
    if (node.props["data-action"] !== "chat:copy-block") node.props.onClick()
  }
  assert.deepEqual(calls, [["backfill"], ["toggle", "t1"], ["return"]], "三控出口：回填 / 药丸零参 · toggle 携本块键")

  // 复制控（本地效应 · 零通道）：点击源 = 控件宿主父节点**现读**文本 ⇒ 注入写效应（RENDERER.md §1.1）
  const copyNode = controls.find((node) => node.props["data-action"] === "chat:copy-block")
  assert.equal(copyNode.props["aria-label"], "⟦chat.action.copy⟧", "复制控词面 = 词表键（aria-label · 控形零文本子）")
  copyNode.props.onClick({ currentTarget: { parentNode: { textContent: "块文本一" } } })
  assert.deepEqual(copies, ["块文本一"], "点击源现读父节点文本 ⇒ 注入写效应（值逐字）")
  assert.equal(copyNode.props.onClick(undefined), false, "无 event 裸调 ⇒ 静默 return（不写不报 —— 机检面兜底）")
  assert.deepEqual(copies, ["块文本一"], "裸调零写（静默）· 空文本同样零写")
  copyNode.props.onClick({ currentTarget: { parentNode: { textContent: "" } } })
  assert.deepEqual(copies, ["块文本一"], "现读空串 ⇒ 零写（空文本非失败 —— 零诊断）")

  const pill = (over) => one(chatTree(chatModel(state({ blocks: [user()], following: false, ...over }))), "data-pill")
  assert.deepEqual(texts(pill({ pendingNew: 3 })), ["⟦new:3⟧"], "pendingNew > 0 ⇒ chat.pill.new（${n} = 未读数）")
  assert.deepEqual(texts(pill({ pendingNew: 0 })), ["⟦chat.pill.bottom⟧"], "pendingNew = 0 ⇒ chat.pill.bottom")
  assert.equal(withAttr(chatTree(chatModel(state({ blocks: [user()], following: true }))), "data-pill").length, 0, "跟滚中 ⇒ 零药丸")
})
