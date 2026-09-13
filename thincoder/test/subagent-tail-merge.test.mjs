/**
 * subagent-tail-merge.test.mjs — SUBAGENT-TAIL（设计档 docs/design/TUI.md §6
 * 「内层活动并入外层流」节）测试用例表 1:1：
 * 正常 4（1 数据流合并 append 顺序 / 2 折叠态渲染 / 3 展开态 / 4 冻结态）·
 * 边界 5（5 无嵌套零回归 / 6 追加超限单环 + 内层同环计数 / 7 稳态追加计数真值 /
 * 8 连续多轮 trim 标记恰 1 / 9 两层以上嵌套并入同一流）·
 * 错误 3（10 子块 done 后迟到丢弃 / 11 tombstone 后迟到丢弃 / 12 内层非完成事件剥除）。
 * AC 映射：AC1←1 · AC2←2/4 · AC3←3/9 · AC4←2/4 · AC5←2 · AC6←6 · AC7←7/8 ·
 *          AC8←10/11/12 · AC9←5/4。
 * 确定性单元（无 io/无 LLM——routeSub* 直驱 + 渲染纯函数断言；行数口径断言用测试侧
 * 独立复算——不引用实现内部函数）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  SUB_BLOCK_LINE_LIMIT, routeSubToken, routeSubReasoning, routeSubToolCall, routeSubToolOutput,
} from "../src/tui/subagent-blocks.mjs"
import { renderSubagentPanel } from "../src/tui/subagent-panel.mjs"
import { frozenSubSeg } from "../src/tui/render-segments.mjs"
import { toggleFoldBlock, scrollFoldBlock, foldCapRows } from "../src/tui/fold-block.mjs"

/** 最小 TUI state（路由/渲染读取面）。 */
function mkState(over = {}) {
  return {
    lines: [], subTasks: {}, expandedBlocks: new Set(), foldEnabled: true,
    _frozenSubKeys: new Set(),
    ...over,
  }
}

const noop = () => {}

/** 显示行计数（与 N6 口径同式——测试侧独立复算）。 */
const displayLines = (text) => {
  const lines = String(text ?? "").split("\n")
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
}

/** 省略标记（trim 产物——不计入内容行）。 */
const isMarker = (b) => /^…（已省略 \d+ 行）$/.test(b?.text ?? "")

/** 内容显示行合计（排除省略标记——标记不占额度）。 */
const contentLines = (carrier) => carrier.blocks
  .filter((b) => !isMarker(b))
  .reduce((n, b) => n + displayLines(b.text), 0)

const blockText = (carrier) => carrier.blocks.map((b) => b.text).join("")

/** 面板渲染的行文本（去 ANSI——tail 前缀断言面）。 */
const plain = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")

// ─── 正常 1：数据流合并（D-ST1——append 目标上移）─────────────────────────────

test("用例 1 数据流合并（正常）：routeSub* 直驱——内层行并入外层 blocks 且顺序 = relay 顺序；子块载体无内容增量", () => {
  const state = mkState()
  routeSubToolCall(state, "eng-coder#2/subagent", { action: "spawn" }, noop) // 外层自身工具
  routeSubToolCall(state, "eng-coder#2/explore#1/read", { path: "a.mjs" }, noop) // 内层工具
  routeSubToolOutput(state, "eng-coder#2/explore#1/read", { text: "file contents\n" }, noop)
  routeSubToken(state, "eng-coder#2/explore#1/inner text piece", noop)
  routeSubReasoning(state, "eng-coder#2/explore#1/inner think piece", noop)
  const sub = state.subTasks["eng-coder#2"]
  assert.deepEqual(sub.blocks.map((b) => b.kind), ["tool", "tool", "text", "think"], "kind 序列 = relay 顺序（四路直驱）")
  assert.ok(sub.blocks[0].text.startsWith("❯ subagent"), "外层工具行（改前同款）")
  assert.ok(sub.blocks[1].text.startsWith("❯ read"), "内层工具行进外层流（同款 ❯ 行）")
  assert.ok(sub.blocks[1].text.includes("file contents"), "内层输出续接内层工具块（fresh 判别在守护载体层）")
  assert.equal(sub.blocks[2].text, "inner text piece", "内层文本片落同一流")
  assert.equal(sub.blocks[3].text, "inner think piece", "内层 think 片落同一流（routeSubReasoning 并入）")
  const leaf = sub.children[0]
  assert.equal(leaf.key, "explore#1", "守护载体按 inner 段建")
  // 子块载体无内容增量（契约：无内容行）——用字段容错式断言（类目 B 字段可留可删，
  // 断言不得反向锁死字段存在）
  assert.equal(leaf.blocks?.length ?? 0, 0, "子块载体无内容增量")
  assert.equal(leaf._lineCount ?? 0, 0, "子块载体行数零")
  assert.equal(contentLines(sub), 5, "外层单账本 = 5 显示行")
  assert.equal(sub.dropped, 0)
})

// ─── 正常 2：折叠态渲染（F8/N5——取代小节）───────────────────────────────────

test("用例 2 折叠态渲染（正常）：头 + 3 行 tail 含内层行；无子块头行/子块折叠键；负断言 tail 无归属前缀", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#2/scanning repo\n", noop)
  routeSubToolCall(state, "eng-coder#2/explore#1/read", { path: "a.mjs" }, noop)
  routeSubToolOutput(state, "eng-coder#2/explore#1/read", { text: "file contents\nsecond line\n" }, noop)
  routeSubToken(state, "eng-coder#2/explore#1/inner latest line", noop)
  const rows = renderSubagentPanel(state, 100, 40)
  assert.ok(plain(rows[0].text).startsWith("─"), "顶部分隔线")
  assert.equal(rows[1]._foldToggle, "sub-eng-coder#2", "头行 = 外层块键（唯一折叠入口）")
  const tails = rows.slice(2)
  assert.equal(tails.length, 3, "折叠 tail ≤3（N5：头 1 + tail ≤3）")
  const tailText = tails.map((r) => plain(r.text)).join("\n")
  assert.ok(tailText.includes("inner latest line"), "内层最新活动直接进 tail（F8）")
  assert.equal(/\bexplore#\d+/.test(tailText), false, "负断言：tail 行文本不含 explore#N 式归属前缀（内层行无标）")
  assert.equal(rows.some((r) => plain(r.text).includes("❯ explore#1")), false, "无子块头行")
  const foldKeys = rows.filter((r) => r._foldToggle).map((r) => r._foldToggle)
  assert.deepEqual(foldKeys, ["sub-eng-coder#2"], "零子块折叠键（sub-*/…）")
  assert.equal(rows.length - 1, 4, "AC5：折叠态每块 = 头 1 + tail 3 = 4 行")
})

// ─── 正常 3：展开态（F8——合并流全量 + 60% 封顶零动）──────────────────────────

test("用例 3 展开态（正常）：合并流全量含内层行；60% 封顶窗口化 + 控制行齐备；滚动后深层行可达", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#2/seed\n", noop)
  for (let i = 0; i < 30; i++) routeSubToken(state, `eng-coder#2/explore#1/deep inner ${i}\n`, noop)
  const cap = foldCapRows(40)
  state.expandedBlocks.add("sub-eng-coder#2")
  const rows = renderSubagentPanel(state, 100, 40)
  const body = rows.slice(2) // 去分隔线 + 头行
  assert.ok(body.length <= cap, `展开段 ≤60% 封顶（${body.length} ≤ ${cap}）`)
  assert.ok(body.some((r) => plain(r.text).includes("click to collapse")), "收起控制行齐备")
  assert.ok(body.some((r) => /下方还有 \d+ 行/.test(plain(r.text))), "窗口化标记在位（封顶生效）")
  scrollFoldBlock(state, "sub-eng-coder#2", 1, 9999)
  const scrolled = renderSubagentPanel(state, 100, 40).slice(2)
  assert.ok(scrolled.some((r) => plain(r.text).includes("deep inner 29")), "末行（最深内层行）展开可达")
})

// ─── 正常 4：冻结态渲染（F8——同键跨冻结边界）────────────────────────────────

test("用例 4 冻结态渲染（正常）：折叠 tail 含内层行；sub- 键跨运行/冻结同键可 toggle", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#7/outer note\n", noop)
  routeSubToken(state, "eng-coder#7/explore#1/inner frozen line", noop)
  const runningKey = `sub-${Object.keys(state.subTasks)[0]}`
  routeSubToken(state, "eng-coder#7/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", noop)
  assert.equal(state.subTasks["eng-coder#7"], undefined, "冻结即移出运行面板")
  const frozenLine = state.lines.find((l) => l._frozenSubTask)
  assert.ok(frozenLine, "冻结载体落流")
  const rows = frozenSubSeg(state, frozenLine, 0, 100, 40)
  const head = rows.find((r) => r._foldToggle)
  assert.equal(head._foldToggle, runningKey, "冻结与运行面板同键（D5 无缝衔接）")
  assert.ok(rows.some((r) => plain(r.text).includes("inner frozen line")), "冻结折叠 tail 含内层行")
  assert.equal(rows.some((r) => plain(r.text).includes("❯ explore#1")), false, "无子块头行")
  assert.deepEqual(rows.filter((r) => r._foldToggle).map((r) => r._foldToggle), [runningKey], "零子块折叠键")
  toggleFoldBlock(state, runningKey)
  const expanded = frozenSubSeg(state, frozenLine, 0, 100, 40)
  assert.ok(expanded.some((r) => plain(r.text).includes("inner frozen line")), "同键 toggle 展开可达")
})

// ─── 边界 5：无嵌套零回归（AC9）──────────────────────────────────────────────

test("用例 5 无嵌套零回归（边界）：全路径直驱——tail 3 / 展开时间线 / 头行字段与改前同款", () => {
  const state = mkState()
  routeSubToken(state, "explore#1/line one\n", noop)
  routeSubToolCall(state, "explore#1/grep", { pattern: "x" }, noop)
  routeSubToolOutput(state, "explore#1/grep", { text: "match-a\nmatch-b\n" }, noop)
  const sub = state.subTasks["explore#1"]
  assert.equal(sub.children.length, 0, "无嵌套不建守护载体")
  assert.equal(sub._lineCount, 4, "显示行记账（text 1 + tool 3）")
  assert.equal(sub.dropped, 0, "未超限无省略")
  const rows = renderSubagentPanel(state, 100, 40)
  assert.equal(rows.length, 5, "分隔线 + 头 + 3 tail（改前同款）")
  assert.ok(plain(rows[1].text).includes("[▶ explore#1 · sync"), "头行字段零变化")
  assert.deepEqual(rows.slice(2).map((r) => plain(r.text)), ["│ ❯ grep /x/", "│ match-a", "│ match-b"], "tail = 末 3 非空行（同款）")
  assert.equal(rows.filter((r) => r._foldToggle).length, 1)
  toggleFoldBlock(state, "sub-explore#1")
  const expanded = renderSubagentPanel(state, 100, 40)
  assert.ok(expanded.some((r) => plain(r.text).includes("line one")), "展开时间线含外层行（零回归）")
  assert.ok(expanded.some((r) => plain(r.text).includes("match-b")), "展开时间线含工具输出（零回归）")
})

// ─── 边界 6：追加超限——单环 + 内层同环计数（N5/AC6）──────────────────────────

test("用例 6 追加超限（边界）：内层前缀行混入——单环 ≤500 显示行 + 流首恰 1 条省略标记 + 持续守恒", () => {
  const state = mkState()
  for (let i = 0; i < 100; i++) routeSubToken(state, `eng-coder#9/outer-${i}\n`, noop)
  for (let i = 0; i < 500; i++) routeSubToken(state, `eng-coder#9/explore#1/inner-${i}\n`, noop)
  const sub = state.subTasks["eng-coder#9"]
  assert.equal(contentLines(sub), SUB_BLOCK_LINE_LIMIT, "单环 = 500 显示行（内层行与外层行同环计数）")
  assert.equal(sub._lineCount, SUB_BLOCK_LINE_LIMIT)
  assert.equal(sub.blocks.filter(isMarker).length, 1, "流首恰 1 条省略标记")
  assert.equal(isMarker(sub.blocks[0]), true, "标记在流首（流首 meta 行——与改前同款位置）")
  const all = blockText(sub)
  assert.equal(/outer-/.test(all), false, "最旧先行：外层先到的 100 行被移除（同环序）")
  assert.ok(all.includes("inner-499"), "后到的内层行保留（内层计入同一 500 行环）")
  assert.equal(sub.dropped, 100, "N = 实际移除内容行数（无幽灵行）")
  routeSubToken(state, "eng-coder#9/outer-continued\n", noop)
  assert.equal(contentLines(sub), SUB_BLOCK_LINE_LIMIT, "继续追加持续守恒")
  assert.equal(sub.blocks.filter(isMarker).length, 1, "标记仍恰 1 条")
  assert.equal(sub.dropped, 101, "N 随内容移除 +1")
})

// ─── 边界 7：稳态追加计数真值（N6/AC7）───────────────────────────────────────

test("用例 7 稳态追加计数真值（边界）：稳态追加 K 行 → N 恰 +K（无幽灵增量）", () => {
  const state = mkState()
  for (let i = 0; i < 520; i++) routeSubToken(state, `eng-coder#8/line-${i}\n`, noop)
  const sub = state.subTasks["eng-coder#8"]
  assert.equal(sub.dropped, 20, "超限 20 行 → N 20")
  const K = 50
  for (let i = 0; i < K; i++) routeSubToken(state, `eng-coder#8/steady-${i}\n`, noop)
  assert.equal(sub.dropped, 20 + K, "N 恰 +K（标记自重 + 幽灵行缺陷已修）")
  assert.equal(sub.blocks.filter(isMarker).length, 1)
  assert.equal(contentLines(sub), SUB_BLOCK_LINE_LIMIT)
})

// ─── 边界 8：连续多轮 trim——标记恰 1 条（N6/AC7）────────────────────────────

test("用例 8 连续多轮 trim（边界）：标记恰 1 条且不重复 unshift；N 只随内容移除增长", () => {
  const state = mkState()
  for (let i = 0; i < 560; i++) routeSubToken(state, `eng-coder#6/chunk-${i}\n`, noop)
  const sub = state.subTasks["eng-coder#6"]
  assert.equal(sub.blocks.filter(isMarker).length, 1, "多轮 trim 后标记恰 1 条")
  assert.equal(isMarker(sub.blocks[0]), true, "标记驻流首（原位更新）")
  const n1 = sub.dropped
  assert.equal(sub.blocks[0].text, `…（已省略 ${n1} 行）`, "标记文本 = N 真值")
  routeSubToken(state, "eng-coder#6/chunk-more\n", noop)
  assert.equal(sub.blocks.filter((b) => /（已省略/.test(b.text)).length, 1, "无重复 unshift")
  assert.equal(sub.blocks[0].text, `…（已省略 ${n1 + 1} 行）`, "N 只随内容移除增长")
  // 未超限载体：不产标记、N 不动
  const small = mkState()
  routeSubToken(small, "explore#5/short\n", noop)
  const s5 = small.subTasks["explore#5"]
  assert.equal(s5.dropped, 0)
  assert.equal(s5.blocks.some(isMarker), false, "未超限不产省略标记")
})

// ─── 边界 9：两层以上嵌套并入同一流（F8——R23d 内容可达性）───────────────────

test("用例 9 两层以上嵌套（边界）：深孙路径行并入同一流、展开可达", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#2/seed\n", noop)
  routeSubToken(state, "eng-coder#2/explore#1/plan#3/deep grandchild line\n", noop)
  routeSubToolCall(state, "eng-coder#2/explore#1/plan#3/read", { path: "x.mjs" }, noop)
  const sub = state.subTasks["eng-coder#2"]
  assert.equal(sub.children[0].key, "explore#1", "守护载体链第一层")
  assert.equal(sub.children[0].children[0].key, "plan#3", "守护载体链按 inner 段逐层建（D-R23d）")
  const all = blockText(sub)
  assert.ok(all.includes("deep grandchild line") && all.includes("❯ read"), "任意深度内层行并入同一流")
  // 中间层/深孙载体无内容（字段容错式——类目 B 字段可留可删，不反向锁死）
  assert.equal(sub.children[0].blocks?.length ?? 0, 0, "中间层载体无内容")
  assert.equal(sub.children[0].children[0].blocks?.length ?? 0, 0, "深孙载体无内容")
  state.expandedBlocks.add("sub-eng-coder#2")
  const rows = renderSubagentPanel(state, 100, 40)
  assert.ok(rows.some((r) => plain(r.text).includes("deep grandchild line")), "深孙文本展开可达")
  assert.ok(rows.some((r) => plain(r.text).includes("❯ read")), "深孙工具行展开可达")
  assert.equal(rows.some((r) => plain(r.text).includes("❯ plan#3")), false, "无深孙头行（单流无标）")
})

// ─── 错误 10：子块 done 后迟到 chunk（AC8——F2 不回退）───────────────────────

test("用例 10 子块 done 后迟到 chunk（错误）：丢弃不产生新行（F2 语义不回退）", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#3/explore#1/before done\n", noop)
  routeSubToken(state, "eng-coder#3/explore#1/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", noop)
  const sub = state.subTasks["eng-coder#3"]
  const leaf = sub.children[0]
  assert.equal(leaf.done, true, "内层 done → 子块定格")
  assert.equal(sub.done, false, "外层块不随内层冻结（D-R23c2）")
  const before = JSON.stringify(sub.blocks)
  routeSubToken(state, "eng-coder#3/explore#1/late text", noop)
  routeSubReasoning(state, "eng-coder#3/explore#1/late think", noop)
  routeSubToolCall(state, "eng-coder#3/explore#1/read", { path: "z" }, noop)
  routeSubToolOutput(state, "eng-coder#3/explore#1/read", { text: "late output" }, noop)
  routeSubToken(state, "eng-coder#3/explore#1/[model]late-model", noop)
  assert.equal(JSON.stringify(sub.blocks), before, "迟到 chunk（text/think/tool/output/model）全量丢弃——零新行")
  assert.equal(contentLines(sub), 1, "内容流仅存 done 前 1 行（类目 B 字段（model 等）不设断言）")
})

// ─── 错误 11：外层 tombstone 后迟到 token（AC8）──────────────────────────────

test("用例 11 外层冻结 tombstone 后迟到 token（错误）：丢弃不复活块", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#4/note\n", noop)
  routeSubToken(state, "eng-coder#4/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", noop)
  assert.equal(state.subTasks["eng-coder#4"], undefined, "完成冻结 + 移出运行面板")
  assert.equal(state._frozenSubKeys.has("eng-coder#4"), true, "墓碑在册")
  const linesBefore = state.lines.length
  routeSubToken(state, "eng-coder#4/late", noop)
  routeSubToken(state, "eng-coder#4/explore#1/late nested", noop)
  routeSubReasoning(state, "eng-coder#4/late think", noop)
  routeSubToolCall(state, "eng-coder#4/late-tool", {}, noop)
  routeSubToolOutput(state, "eng-coder#4/late-tool", { text: "x" }, noop)
  assert.equal(state.subTasks["eng-coder#4"], undefined, "tombstone 拒绝复活")
  assert.equal(state.lines.length, linesBefore, "零新冻结载体落流")
})

// ─── 错误 12：内层非完成事件剥除（AC8——D1 保全）─────────────────────────────

test("用例 12 内层非完成事件剥除（错误）：turn/approval/settled 不路由——不污染外层块头与内容流", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#5/seed\n", noop)
  const sub = state.subTasks["eng-coder#5"]
  const before = JSON.stringify(sub.blocks)
  routeSubToken(state, "eng-coder#5/explore#1/⟦ev⟧turn\x1e5\x1e10\x1eturn\x1e", noop)
  routeSubToken(state, "eng-coder#5/explore#1/⟦ev⟧approval\x1e5\x1e10\x1eapproval\x1etool\x1e", noop)
  routeSubToken(state, "eng-coder#5/explore#1/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noop)
  assert.equal(sub.turn, 0, "内层 turn 不路由（外层块头零污染）")
  assert.equal(sub.maxTurns, 0)
  assert.equal(sub.approval, null)
  assert.equal(sub.done, false, "内层 settled 剥除——不置外层 done")
  assert.equal(JSON.stringify(sub.blocks), before, "内容流零污染")
})
