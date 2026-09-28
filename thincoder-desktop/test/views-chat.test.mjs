/**
 * views-chat.test.mjs — E-3 对话流视图树面用例（批档 §2.4 U58–U62 · 批 7 §2.3 树面）：
 * 三态与根锚 / 块五型与块序 / 工具卡三行与降级 / 折叠默认态与 toggle / 接线形与词表面 / **消化行组**（U194 ——
 * 「桌面空闲唤醒」批：`[data-digest]` 非块节点组——树面两行与在场判据 + 帧面起跑建组 / 幂等 / 终态先更新后摘）。
 * 判据面 = 纯构树（`chatModel` / `chatTree` / `toggleExpanded`）+ `[data-digest]` 帧面段（假 DOM = `test/fake-dom.mjs`）——**帧面全体性**
 * （`mountChat` / `syncChrome` / `settleFrame`）本批主体段仍住 `test/views-chat-frame.test.mjs`（U71 —— 档行预算，`docs/desktop/design/PROJECT.md` §4.1）。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { chatModel, chatTree, mountChat } from "../renderer/views/chat.mjs"
import { syncChrome } from "../renderer/views/chat-chrome.mjs"
import { toggleExpanded } from "../renderer/views/chat-tool.mjs"
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
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error", "status.thinking", "status.stopped",
  // 消化行族五键（桌面空闲唤醒批 —— 核字典经 `t()` 投影面直取；树面消费前三，`digest.done` / `digest.aborted` = 帧面终态句）
  "digest.turnLabel", "digest.turnLabelAsk", "digest.start", "digest.done", "digest.aborted"]
/** 核字典缝占位（消化行族 —— 占位名逐字同核模板；插值入判据）。 */
const CORE_TEMPLATE = {
  "digest.turnLabelAsk": "⟦digest.turnLabelAsk:${from}/${msg}⟧",
  "digest.start": "⟦digest.start:${n}⟧", "digest.done": "⟦digest.done:${n}/${seconds}⟧", "digest.aborted": "⟦digest.aborted:${seconds}⟧",
}
/** 「对齐第三批」新键（词面住 `renderer/i18n.mjs`——词表面）：用例缝自携哨兵值 ⇒ 词面到位前后判据同形（零耦合）。 */
const NEW_WORD_KEYS = ["welcome.heading", "welcome.text", "welcome.textConfigured", "welcome.shortcuts", "error.retry", "tool.interrupted"]

function setupDict(ctx) {
  const host = Object.fromEntries([...Object.keys(HOST_DICT.en), ...NEW_WORD_KEYS].map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, CORE_TEMPLATE[key] ?? `⟦${key}⟧`])) })
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
  // 「对齐第三批」项 15：`no-message` 帧 = 欢迎条三行（抬头 / 文案二值 / 快捷键行 —— 单行 hint 退场）
  assert.deepEqual(blankTree.children[0].props["data-guide"], "no-message", "空态码 = no-message（引导节点同根）")
  assert.deepEqual(texts(blankTree), ["⟦welcome.heading⟧", "⟦welcome.text⟧", "⟦welcome.shortcuts⟧"], "三行 = 抬头 / 文案（未配 ⇒ `welcome.text`）/ 快捷键行")
  assert.deepEqual(
    blankTree.children[0].children.map((node) => node.props.class),
    ["chat-welcome"],
    "欢迎条容器（.chat-welcome —— 行住其内）",
  )
  const configuredTree = chatTree(chatModel(state({ blocks: [], settings: { configured: true } })))
  assert.deepEqual(texts(configuredTree), ["⟦welcome.heading⟧", "⟦welcome.textConfigured⟧", "⟦welcome.shortcuts⟧"], "已配 ⇒ 文案二值换 `welcome.textConfigured`（同三行）")

  const flowTree = chatTree(chatModel(state({ blocks: [user({ id: "u1" }), user({ id: "u2" })], following: false, pendingNew: 2 })))
  assert.equal(flowTree.props["data-state"], "flow", "有块 ⇒ flow")
  assert.equal(flowTree.props["data-blocks"], 2, "data-blocks = 块数（= DOM 块节点数）")
  assert.equal(flowTree.props["data-hidden"], 0, "data-hidden = 隐藏块数（未越窗 ⇒ 0）")
  assert.equal(flowTree.props["data-following"], "0", "data-following 随 following（串两态）")
  assert.deepEqual(withAttr(flowTree, "data-block-kind").map((node) => node.props["data-block-id"]), ["u1", "u2"], "块位序 = 入参序")
})

// ─── U59 块五型与块序 ────────────────────────────────────────

test("U59: 块五型与块序（逐位同序 ∧ 兜底键 = 全列表位序 ∧ 文本面 = 核 md + 原文锚）", (ctx) => {
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
  const sentTree = chatTree(chatModel(state({ blocks: [{ kind: "user", text: "发送文本" }] })))
  const sent = one(sentTree, "data-block-kind")
  assert.deepEqual([sent.props["data-block-kind"], sent.props["data-block-id"]], ["user", "0"], "发送面块形（无 id）⇒ 树面 user 块 + 兜底位序键（#458 ③）")
  // 文本面（R3c · KD-RC-4 改判）：`data-raw` = 原文逐字（复制取文源 —— KD-22）；`html` = 核 `md` 产出（转义闸在核）。
  const faces = withAttr(tree, "data-raw")
  assert.deepEqual(faces.map((node) => node.props["data-raw"]), ["<b>原文</b>", "流中", "想", "崩"], "文本族块面原文逐字（`data-raw` —— 四型逐位；工具卡无文本面不入）")
  assert.deepEqual(faces.map((node) => node.props.class), ["block-text", "block-text", "reasoning-content", "block-text error-text"], "文本面类名（推理块内容区 = 核件类名；错误面 = md 容器类 + 横幅 `.error-text` —— 项 9）")
  assert.deepEqual(texts(sentTree), [], "树面零裸文本子（文本全在 `html` 面 —— 渲染面经核 md；空文本块同形）")
  const html = faces.map((node) => node.props.html)
  assert.equal(html[0].includes("&lt;b&gt;原文&lt;/b&gt;"), true, "注入样本 ⇒ 转义闸（核 `md`）后 = 字面文本（C7 ②）")
  assert.equal(html[0].includes("<b>"), false, "零裸标签入渲染面（转义闸判据）")
  assert.equal(html[1].includes("流中") && html[2].includes("想") && html[3].includes("崩"), true, "四型文本逐位在场（渲染面）")

  // 「对齐第二批」项 4 —— 说话人标签容器（回合首块判据单源：用户块恒出 / 助手族前一位 = user ⇒ 出）：
  // 本组 = [user, assistant, reasoning, tool, error] ⇒ 标签两枚（user 块 + 回合首的 assistant 块）
  const labelsOf = (tree) => withAttr(tree, "data-block-kind").map((node) => node.children[0]?.props?.["data-label"] ?? null)
  assert.deepEqual(labelsOf(tree), ["user", "assistant", null, null, null], "标签判据：user 恒出 / assistant 回合首（前一位 = user）出 / 同回合后续零标签")
  const firstLabel = kindNodes[0].children[0]
  assert.deepEqual([firstLabel.tag, firstLabel.props.class, firstLabel.children.length], ["div", "msg-label", 0], "标签容器 = 空容器（文本落笔归帧尾后处理）")
  assert.equal(kindNodes[1].children[0].props["data-label"], "assistant", "助手标签容器在两型块同形（本块底正文面）")
  const reasoningHead = chatTree(chatModel(state({ blocks: [{ kind: "reasoning", text: "想" }, user({ id: "u2" })] })))
  assert.deepEqual(withAttr(reasoningHead, "data-block-kind").map((node) => node.children[0]?.props?.["data-label"] ?? null), ["assistant", "user"], "居块序首位 ⇒ 出标签（前位不可知不存在）；user 块仍恒出")
  const windowed = chatTree(chatModel(state({ blocks: [user({ id: "u1" }), { kind: "assistant", id: "a1", text: "x" }] }), 1))
  assert.deepEqual(withAttr(windowed, "data-block-kind").map((node) => node.children[0]?.props?.["data-label"] ?? null), [null], "窗越限（前位未渲染）⇒ 助手块零标签（禁假造 —— 不猜回合界）")
  // ts 载波（项 4）：`data-ts` 锚 = 块 `ts`（无 ts ⇒ 零锚 —— 「无 ts 不显示」同判据）
  const tsTree = chatTree(chatModel(state({ blocks: [user({ id: "u1", ts: 1730000000000 }), user({ id: "u2" })] })))
  const tsNodes = withAttr(tsTree, "data-block-kind")
  assert.equal(tsNodes[0].props["data-ts"], "1730000000000", "块 ts 落 `data-ts` 锚（核 `paintLabel` 供料面）")
  assert.equal(tsNodes[1].props["data-ts"], undefined, "无 ts ⇒ 键缺席（不落空锚）")
  // 归档 `subagent` 块（项 5 · 块六型）：壳 = 零边距透传容器（回显 = 核件元素 —— 帧后补装，不入纯树）
  const archived = chatTree(chatModel(state({ blocks: [{ kind: "subagent", meta: { key: "sub:coder#1" } }] })))
  const shell = one(archived, "data-block-kind")
  assert.deepEqual([shell.props["data-block-kind"], shell.props.class], ["subagent", "block block-subagent"], "归档块 = 六型之一（`block-subagent` 透传壳）")
  // 待发送气泡组（项 2 · 纯树）：非块节点 —— 落点 = 块序列之后、卡序列之前；零块标识（守 data-blocks 不变式）
  const queuedTree = chatTree(chatModel(state({ blocks: [user({ id: "u1" })], pending: { s1: [{ text: "排一", ts: 1 }] } })))
  assert.equal(withAttr(queuedTree, "data-pending").length, 1, "队非空 ⇒ 尾组在树（恰一枚）")
  assert.equal(queuedTree.props["data-blocks"], 1, "组不入账（非块节点 —— `data-blocks` 不变）")
  const queuedKids = queuedTree.children.map((node) => node.props["data-block-kind"] !== undefined ? "block" : node.props["data-pending"] !== undefined ? "pending" : node.props.class)
  assert.deepEqual(queuedKids, ["block", "pending"], "子序 = 块序列 → 待发送组（卡 / 药丸随判据）")
  assert.equal(chatTree(chatModel(state({ blocks: [user()], pending: {} }))).children.some((node) => node.props?.["data-pending"] !== undefined), false, "队空 ⇒ 零组节点（不落空壳）")
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
  assert.deepEqual(texts(head(small)), ["Bash", "npm test", "⟦sub.done⟧", "⟦dur:1.5⟧", "→ Bash: R"], "头行五件序 = 名 / 参摘 / 状态词 / 耗时 / 摘要段（项 1）")
  const segsOf = (tree) => withAttr(tree, "data-seg")
  assert.deepEqual(segsOf(head(small)).map((node) => node.props["data-seg"]), ["name", "args", "status", "time", "summary"], "头行五段逐段包元素（段码序 —— #460 ① + 项 1 摘要段）")
  assert.equal(segsOf(head(small)).length, head(small).children.filter((child) => child !== null).length, "头行子节点**全为** `[data-seg]` 元素（裸串零入 flex 行 ⇒ gap 生效；空位 null 不入）")
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
  assert.equal(withAttr(live, "data-tool-result").length, 1, "运行期缺省 ⇒ 展开（项 3：增量在场 ⇒ 体在场）")

  const waiting = card({ status: "queued", durationMs: 900, result: "…" })
  assert.ok(texts(head(waiting)).includes("⟦sub.queued⟧"), "状态词 = 核词表值（queued）")
  assert.equal(texts(head(waiting)).includes("⟦dur:0.9⟧"), false, "耗时仅 done / error ⇒ queued 零耗时节点")
  const halted = card({ status: "stopped", durationMs: 900, result: "…" })
  assert.ok(texts(head(halted)).includes("⟦sub.stopped⟧"), "状态词 = 核词表值（stopped）")
  const gate = card({ status: "approval", result: "…" })
  assert.ok(texts(head(gate)).includes("⟦tab.badge.approval⟧"), "approval 状态词 = 宿主键 tab.badge.approval（单源不复制）")
  assert.equal(withAttr(gate, "data-tool-result").length, 0, "缺省 + 非 error ⇒ 折叠（approval 同律）")

  const odd = card({ status: "weird", durationMs: "900", result: "x" })
  assert.deepEqual(texts(head(odd)), ["Bash", "npm test", "→ Bash: x"], "表外状态码 ⇒ 零状态词；耗时非数 ⇒ 零耗时；摘要段照取（项 1）")
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

  // 复制控（本地效应 · 零通道）：点击源 = 控件宿主的**原文锚** `[data-raw]` 现读 ⇒ 注入写效应（RENDERER.md §1.1 ·
  //   R3c：文本面经核 Markdown 后 DOM 文本已非原文 ⇒ 取文源 = 原文锚，**逐字**：KD-22）
  const copyNode = controls.find((node) => node.props["data-action"] === "chat:copy-block")
  assert.equal(copyNode.props["aria-label"], "⟦chat.action.copy⟧", "复制控词面 = 词表键（aria-label · 控形零文本子）")
  const holder = (raw) => ({ parentNode: { querySelector: () => ({ getAttribute: () => raw }) } })
  copyNode.props.onClick({ currentTarget: holder("**块文本一**") })
  assert.deepEqual(copies, ["**块文本一**"], "点击源现读原文锚 ⇒ 注入写效应（**原文逐字** —— Markdown 记号不丢）")
  assert.equal(copyNode.props.onClick(undefined), false, "无 event 裸调 ⇒ 静默 return（不写不报 —— 机检面兜底）")
  assert.deepEqual(copies, ["**块文本一**"], "裸调零写（静默）· 空文本同样零写")
  copyNode.props.onClick({ currentTarget: holder("") })
  assert.deepEqual(copies, ["**块文本一**"], "现读空串 ⇒ 零写（空文本非失败 —— 零诊断）")
  assert.equal(copyNode.props.onClick({ currentTarget: { parentNode: { querySelector: () => null } } }), false, "原文锚缺席（无面宿主）⇒ 零写（不抛 —— 防御读）")

  const pill = (over) => one(chatTree(chatModel(state({ blocks: [user()], following: false, ...over }))), "data-pill")
  assert.deepEqual(texts(pill({ pendingNew: 3 })), ["⟦new:3⟧"], "pendingNew > 0 ⇒ chat.pill.new（${n} = 未读数）")
  assert.deepEqual(texts(pill({ pendingNew: 0 })), ["⟦chat.pill.bottom⟧"], "pendingNew = 0 ⇒ chat.pill.bottom")
  assert.equal(withAttr(chatTree(chatModel(state({ blocks: [user()], following: true }))), "data-pill").length, 0, "跟滚中 ⇒ 零药丸")
})

// ─── U194 消化行组（桌面空闲唤醒 —— `[data-digest]` 非块节点组：树面 + 帧面）──────────

test("U194: 消化行组（起跑 ⟺ 在场 · `n = 0` 轮零计数行 · `end` 先更新后摘 · 非块节点不破 `data-blocks` · 假根帧刷）", (ctx) => {
  setupDict(ctx)
  const start = (over = {}) => ({ status: "start", n: 2, tier: null, from: null, msg: null, ...over })
  const tree4 = (slice, over = {}) => chatTree(chatModel(state({ blocks: [user({ id: "u1" })], digest: slice === null ? undefined : { s1: slice }, ...over })))
  const group = (tree) => withAttr(tree, "data-digest")[0] ?? null
  const roleOf = (node) => node.props["data-block-kind"] !== undefined ? "block"
    : node.props["data-digest"] !== undefined ? "digest"
    : node.props["data-pending"] !== undefined ? "pending" : node.props.class
  // ① 树面：起跑态 ⇒ 组在场（两行 = 标签行 + 计数行）；非块节点 ⇒ 不入账 / 块序不变
  const tree = tree4(start())
  assert.equal(group(tree).props.class, "chat-digest", "组 = `chat-digest`（`[data-digest]` 非块节点组 —— 沿 `[data-pending]` 先例）")
  assert.deepEqual(group(tree).children.map((node) => node.props.class), ["digest-turn", "digest-status"], "两行 = 起跑标签行 + `n > 0` 计数行")
  assert.deepEqual(texts(group(tree)), ["⟦digest.turnLabel⟧", "⟦digest.start:2⟧"], "词面 = 核字典 `digest.*` 经 `t()` 直取（零新键 · 值同源零复制）")
  assert.equal(tree.props["data-blocks"], 1, "组不入账（零 `data-block-id` ⇒ 不破 `data-blocks` 不变式）")
  assert.deepEqual(tree.children.map(roleOf), ["block", "digest"], "根子序 = 块序列 → 消化行组（无队无卡无药丸）")
  assert.deepEqual(tree4(start(), { pending: { s1: [{ text: "排一", ts: 1 }] } }).children.map(roleOf), ["block", "digest", "pending"], "族内序 = 消化行组 → 待发送组（两族同侧 = 块序列之后）")
  // ② 逐态：`n = 0` 轮零计数行（幻影行禁出）· ask 档携参 · 终态零组 · 切片缺零组 · 他键零扰 · none 归零
  assert.equal(group(tree4(start({ n: 0 }))).children.length, 1, "`n = 0` 轮 ⇒ 零计数行（沿 VSC `.digest-status` 规则）")
  assert.deepEqual(texts(group(tree4(start({ n: 0, tier: "ask", from: "coder#2", msg: "要不要改？" })))), ["⟦digest.turnLabelAsk:coder#2/要不要改？⟧"], "ask 档 ⇒ `digest.turnLabelAsk`（`from` / `msg` 入词）")
  assert.deepEqual(texts(group(tree4(start({ tier: "other", n: 1 })))), ["⟦digest.turnLabel⟧", "⟦digest.start:1⟧"], "`tier` 表外值 ⇒ 回落 digest 档（档位两值闭集）")
  assert.equal(group(tree4({ status: "end", ok: true, ms: 100 })), null, "终态 ⇒ 零组（在场 ⟺ 起跑态）")
  assert.equal(group(tree4(null)), null, "切片缺 ⇒ 零组（禁假造）")
  assert.equal(group(chatTree(chatModel(state({ blocks: [user()], digest: { s9: start() } })))), null, "他键切片 ⇒ 零组（源 = 本会话键）")
  assert.equal(chatModel(state({ activeSession: null, digest: { s1: start() } })).digest, null, "none ⇒ 切片归零（不落 stale 组）")
  // ③ 帧面（假根）：起跑帧建组（落点 = 块后待发送组前）/ 同内容幂等零写 / `end` **先原地更新**终态句后摘除
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  const root = fake.element("div")
  root.setAttribute("data-slot", "flow")
  const live = (slice, over = {}) => state({ blocks: [user({ id: "u1" })], digest: slice === null ? undefined : { s1: slice }, ...over })
  const { model } = mountChat(root, live(start()))
  assert.equal(root.querySelector("[data-digest]") !== null, true, "重挂 ⇒ 组落点实挂（构建面同源）")
  assert.equal(root.querySelector("[data-digest]").getAttribute("class"), "chat-digest", "宿主内组节点 = 构树形（薄挂载零分叉）")
  const steady = fake.mark()
  syncChrome(root, model)
  assert.deepEqual([fake.delta(steady).structural, fake.delta(steady).text], [0, 0], "同内容帧刷 ⇒ 零结构 / 零文本写（幂等）")
  const endMark = fake.mark()
  syncChrome(root, chatModel(live({ ...start(), status: "end", ok: true, ms: 2500 })))
  const endDelta = fake.delta(endMark)
  assert.equal(root.querySelector("[data-digest]"), null, "终态帧 ⇒ 组摘除（退场 = `end` 更新毕摘除）")
  assert.ok(endDelta.text > 0, "摘除前**先原地更新本键游标行**（终态句先更新后摘 —— 零文本写 = 漏更新）")
  assert.ok(endDelta.structural > 0, "组节点摘除落结构写（摘除非零写）")
  const failRoot = fake.element("div")
  const failState = live(start({ n: 1 }))
  const failModel = mountChat(failRoot, failState).model
  syncChrome(failRoot, chatModel(live({ ...start({ n: 1 }), status: "end", ok: false, ms: 300 })))
  assert.equal(failRoot.querySelector("[data-digest]"), null, "失败径终态 ⇔ 同摘（两态同径）")
  const zeroRoot = fake.element("div")
  const zeroModel = mountChat(zeroRoot, live(start({ n: 0 }))).model
  assert.equal(zeroRoot.querySelector("[data-digest]") !== null, true, "`n = 0` 轮 ⇒ 组在场（标签行）")
  const zeroMark = fake.mark()
  syncChrome(zeroRoot, chatModel(live({ ...start({ n: 0 }), status: "end", ok: false, ms: 3 })))
  assert.deepEqual([fake.delta(zeroMark).text, zeroRoot.querySelector("[data-digest]")], [0, null], "`n = 0` 轮终态 ⇒ 零文本写 + 摘组（零动作 —— 不造幻影行）")
  assert.equal(failModel.digest.status, "start", "模型纯读（帧刷不改切片）")
  assert.equal(zeroModel.digest.n, 0, "模型字段同源可读（起跑数）")
  // 族序角落（插入点纪律 —— 帧面新建径同守）：待发送组已在场 ∧ 无卡无药丸 ⇒ 新建消化行组须落其**前**（非末位 append）
  const orderRoot = fake.element("div")
  const domRole = (node) => node.getAttribute("data-block-kind") !== null ? "block"
    : node.getAttribute("data-digest") !== null ? "digest"
    : node.getAttribute("data-pending") !== null ? "pending"
    : node.getAttribute("data-card") !== null ? "card" : node.getAttribute("class")
  const queued = live(null, { pending: { s1: [{ text: "排一", ts: 1 }] } })
  mountChat(orderRoot, queued)
  const orderMark = fake.mark()
  syncChrome(orderRoot, chatModel(live(start(), { pending: { s1: [{ text: "排一", ts: 1 }] } })))
  assert.deepEqual([...orderRoot.children].map(domRole), ["block", "digest", "pending"], "族序 = 块 → 消化行组 → 待发送组（新建径同守 —— 组不落组后）")
  assert.ok(fake.delta(orderMark).structural > 0, "角落夹具：组确为本次新建（非零写假绿）")
  // 补强两径（评审表 #4）：① 组换代 = **原位替换**（非摘建）⇒ 恰一枚 ∧ 计数行文随新起跑数；② 锚含卡径（卡在场 ⇒ 组落卡前）
  const swapRoot = fake.element("div")
  mountChat(swapRoot, live(start({ n: 1 })))
  syncChrome(swapRoot, chatModel(live(start({ n: 2 }))))
  assert.deepEqual([swapRoot.querySelectorAll("[data-digest]").length, swapRoot.querySelector("[data-digest-count]").textContent],
    [1, "⟦digest.start:2⟧"], "组换代 ⇒ 原位替换恰一枚 ∧ 计数行文随新起跑数（`start` → `start`）")
  const cardRoot = fake.element("div")
  const cardState = (slice) => live(slice, { pool: { approvals: [{ shape: "single", promptId: "p1", tool: "Bash", argsSummary: "npm test" }] } })
  mountChat(cardRoot, cardState(null))
  assert.deepEqual([...cardRoot.children].map(domRole), ["block", "card"], "卡在场夹具（无消化组）")
  syncChrome(cardRoot, chatModel(cardState(start())))
  assert.deepEqual([...cardRoot.children].map(domRole), ["block", "digest", "card"], "锚含卡径：消化行组落卡**前**（族序守 —— 块 → 消化 → 卡）")
})

// ─── U208 「对齐第三批」工具卡面（项 1 摘要段 · 项 5 已中断词 · 项 14 轮次段 · 项 2 两态色锁）──

test("U208: 「对齐第三批」工具卡面 —— 摘要段（分派抽样 · 无摘要零段）∧ `interrupted` 词 ∧ 轮次段 ∧ 头行两态色（chat.css 值锁）", (ctx) => {
  setupDict(ctx)
  const card = (over) => chatTree(chatModel(state({ blocks: [tool({ result: "R", ...over })] })))
  const summarySeg = (tree) => withAttr(one(tree, "data-tool-head"), "data-seg").find((node) => node.props["data-seg"] === "summary")
  const roundSeg = (tree) => withAttr(one(tree, "data-tool-head"), "data-seg").find((node) => node.props["data-seg"] === "round")

  // ① 摘要段（项 1）：`→ ` + 核 `formatToolSummary` 直取 —— 分派抽样四组 + 无摘要零段（禁假造）
  assert.deepEqual(texts(summarySeg(card({ name: "bash", result: "[stdout]:\n构建通过\n\n(exit code 0)" }))), ["→ bash: 构建通过"], "bash ⇒ 末条输出行（包装标记不入）")
  assert.deepEqual(texts(summarySeg(card({ name: "read", result: "a\nb\nc" }))), ["→ 3 lines"], "read ⇒ `N lines`")
  assert.deepEqual(texts(summarySeg(card({ name: "glob", result: "a.mjs" }))), ["→ 1 file"], "glob ⇒ 计数单数形")
  assert.deepEqual(texts(summarySeg(card({ name: "custom_tool", result: "hello\nworld" }))), ["→ custom_tool: hello"], "未登记工具 ⇒ 默认分派（首非空行）")
  assert.equal(summarySeg(card({ name: "bash", result: "   " })), undefined, "无摘要（空白文本）⇒ 零段")
  assert.equal(texts(summarySeg(card({ name: "bash", result: "x" }))).length, 1, "摘要在场 ⇒ 恰一段（段码 `summary`）")

  // ② 已中断词（项 5）：状态词闭枚举第八词（`tool.interrupted` 端供给面）+ 头行 `data-status` + 体默认折叠
  const halted = card({ status: "interrupted", durationMs: 800, result: "半截" })
  assert.deepEqual(texts(one(halted, "data-tool-head")).filter((line) => line.startsWith("⟦")), ["⟦tool.interrupted⟧"], "状态词 = `tool.interrupted`（两语逐字 —— 值同 VSC locales）")
  assert.equal(one(halted, "data-tool-head").props["data-status"], "interrupted", "头行 `data-status` = 中止码（样式面判据）")
  assert.equal(withAttr(halted, "data-tool-result").length, 0, "`interrupted` 缺省 ⇒ 折叠（非 running / error）")

  // ③ 轮次段（项 14）：advisor `(round N · model)` 同 VSC `ui.js:104-107` 式；`model` 缺 ⇒ 降级形；`round` 缺 ⇒ 零段
  assert.deepEqual(texts(roundSeg(card({ name: "advisor", round: 2, model: "gpt-x", result: "R" }))), ["(round 2 · gpt-x)"], "具名 ⇒ `(round N · model)`")
  assert.deepEqual(texts(roundSeg(card({ name: "advisor", round: 2, result: "R" }))), ["(round 2)"], "无 `model` ⇒ 降级形（不显空）")
  assert.equal(roundSeg(card({ name: "advisor", result: "R" })), undefined, "无 `round` ⇒ 零段（非 advisor / 无载荷逐字同修前）")
  assert.equal(roundSeg(card({ name: "Bash", round: 3, model: "m", result: "R" })) === undefined, false, "段面只认载荷在场（宿主侧限定 `advisor` 名 —— 端侧零第二判据）")

  // ④ 头行两态色（项 2 · 值源 = VSC 内联色）：chat.css 两值两规则锁（样式面单源 = `renderer/chat.css`）
  const css = readFileSync(new URL("../renderer/chat.css", import.meta.url), "utf8")
  assert.ok(/\.tool-head\[data-status="error"\][^{]*\{[^}]*#f14c4c/s.test(css), "`data-status=\"error\"` ⇒ `#f14c4c`（VSC 内联色同值）")
  assert.ok(/\.tool-head\[data-status="done"\][^{]*\{[^}]*#4ec9b0/s.test(css), "`data-status=\"done\"` ⇒ `#4ec9b0`（VSC 内联色同值）")
})

