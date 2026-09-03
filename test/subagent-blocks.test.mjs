/**
 * subagent-blocks.mjs 单测 — 子agent 活动区块数据层（§7.2 D4/D5，消费端）。
 * 覆盖：前缀路由（token/reasoning/toolCall/toolOutput）、事件 token 头部更新、
 * N2 环形上限、done 标记。渲染断言在 tui.test.mjs。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  SUB_BLOCK_LINE_LIMIT, finishSubTask, finishSubTaskKey, finishSubTasksByRole, finishSubTaskByModel, applySubEvent,
  parseRelayPath,
  routeSubToken, routeSubReasoning, routeSubToolCall, routeSubToolOutput,
  freezeDoneSubTasks, freezeAllSubTasks, shiftFreezeAnchors, freezeReclaimDigestedBlocks,
  ensureCompressPanel, markCompressFailed, markCompressDone, markCompressFallback,
} from "../src/tui/subagent-blocks.mjs"

const noop = () => {}
const state = () => ({ subTasks: {} })

test("routeSubToken: 无前缀 → false（主路径）；带前缀 → 区块 + 主流隔离", () => {
  const s = state()
  assert.equal(routeSubToken(s, "plain", noop), false)
  assert.equal(routeSubToken(s, "coder#1/hello", noop), true)
  const sub = s.subTasks["coder#1"]
  assert.ok(sub.blocks.some((b) => b.kind === "text" && b.text === "hello"))
})

test("routeSubToken: [model] 元数据只记录一次；后续 [model] 开头的内容照常入块", () => {
  const s = state()
  routeSubToken(s, "coder#1/[model]glm-5.3", noop)
  assert.equal(s.subTasks["coder#1"].model, "glm-5.3")
  // model 已设置 → 第二个 [model] 开头 token 视为内容（不吞）
  routeSubToken(s, "coder#1/[model] not metadata", noop)
  assert.ok(s.subTasks["coder#1"].blocks.some((b) => b.text.includes("[model] not metadata")))
})

test("routeSubToken: 事件 token 只进头部，不进 blocks", () => {
  const s = state()
  routeSubToken(s, "coder#1/⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e", noop)
  const sub = s.subTasks["coder#1"]
  assert.equal(sub.turn, 3)
  assert.equal(sub.maxTurns, 100)
  assert.equal(sub.blocks.length, 0)
  assert.equal(applySubEvent(sub, "⟦ev⟧approval\x1e3\x1e100\x1eapproval\x1ewrite x"), true)
  // applySubEvent 直接调用：detail 超长截断 ≤ 40
  applySubEvent(sub, `⟦ev⟧approval\x1e4\x1e100\x1eapproval\x1e${"y".repeat(60)}`)
  assert.ok(s.subTasks["coder#1"].approval.length <= 40)
})

test("routeSubReasoning / routeSubToolCall / routeSubToolOutput 路由与合并", () => {
  const s = state()
  assert.equal(routeSubReasoning(s, "main reasoning", noop), false)
  routeSubReasoning(s, "coder#1/think a", noop)
  routeSubReasoning(s, "coder#1/think b", noop)
  routeSubToolCall(s, "coder#1/bash", { command: "npm  test" }, noop)
  // 多 chunk raw 拼接（2026-09-03 修复轮——参考 routeSubToken 测试形态）：relay chunk
  // 是任意字节边界碎片，chunk 边界不补换行——"line2 li"+"ne3" 跨 chunk 的词同行
  // 还原，emit 端自带的行尾 \n（"more\n"）原样保留、不再逐 chunk 强加 \n。
  routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: "line1\nline2 li" }, noop)
  routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: "ne3\nmore\n" }, noop)
  routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: "tail" }, noop)
  const sub = s.subTasks["coder#1"]
  const thinks = sub.blocks.filter((b) => b.kind === "think")
  assert.equal(thinks.length, 1, "连续 think 合并")
  assert.equal(thinks[0].text, "think athink b")
  const tools = sub.blocks.filter((b) => b.kind === "tool")
  assert.equal(tools.length, 1, "tool call 标题块与后续同名输出合并为单块（标题+输出一体）")
  assert.ok(tools[0].text.startsWith("❯ bash") && tools[0].text.includes("npm test"))
  assert.ok(tools[0].text.includes("line1\nline2 line3\nmore\ntail"), `原文无损还原（无逐 chunk 断行），实际: ${tools[0].text}`)
  assert.ok(!tools[0].text.includes("li\nne3") && !tools[0].text.includes("more\n\ntail"), "chunk 边界无人为断行/补行")
  assert.equal(sub.currentTool, "bash")
})

test("finishSubTask: 最早运行的同角色子代理标记 done + lastError + epoch 递增", () => {
  const s = state()
  routeSubToken(s, "coder#1/a", noop)
  routeSubToken(s, "coder#2/b", noop)
  s.subTasks["coder#1"].started = 1000
  s.subTasks["coder#2"].started = 2000
  const epochBefore = s.subTasks["coder#1"].blockEpoch
  finishSubTask(s, ["coder"], "turn cap reached — work may be partial")
  const done1 = s.subTasks["coder#1"]
  assert.equal(done1.done, true, "最早启动的先 done")
  assert.equal(done1.lastError, "turn cap reached — work may be partial")
  assert.ok(done1.doneAt >= done1.started)
  assert.notEqual(done1.blockEpoch, epochBefore, "fold 签名失效（epoch bump）")
  assert.equal(s.subTasks["coder#2"].done, false, "其余不受影响")
})

// -------------------------------------------- §7.2.3 sync spawn 完成精确冻结（finishSubTaskKey——T-F1..F5 数据层）

test("§7.2.3 T-F2 数据层: finishSubTaskKey 按 key 精确 done——async eng-coder 先启动也不误冻（启发式对照）", () => {
  const s = state()
  // async eng-coder 先 spawn/启动（先建块、started 更早）；sync explore 后 spawn
  routeSubToken(s, "eng-coder#1/[model]glm-5.3", noop)
  routeSubToken(s, "eng-coder#1/后台实现中...", noop)
  routeSubToken(s, "explore#2/[model]glm-5.3", noop)
  routeSubToken(s, "explore#2/搜索中...", noop)
  const eng = s.subTasks["eng-coder#1"]
  const exp = s.subTasks["explore#2"]
  assert.ok(eng.started <= exp.started, "eng-coder#1 先启动（启发式会先选它）")
  // sync explore 完成 → 精确按 explore#2 冻——eng-coder#1 保持 running
  const ret = finishSubTaskKey(s, "explore#2", null)
  assert.equal(ret, exp, "返回被精确 settle 的块")
  assert.equal(exp.done, true, "explore#2 done（完成块）")
  assert.notEqual(exp.blockEpoch, undefined)
  assert.equal(eng.done, false, "eng-coder#1 不被误冻（启发式下会误冻它——T-F2 核心）")
  // done 后再按同一 key 调用幂等（已 done 标记保持）
  finishSubTaskKey(s, "explore#2")
  assert.equal(exp.done, true)
})

test("§7.2.3 T-F3 数据层: 并行 2 sync 乱序完成——各自 key 精确 settle 互不串扰", () => {
  const s = state()
  routeSubToken(s, "explore#1/搜索 A...", noop)
  routeSubToken(s, "explore#2/搜索 B...", noop)
  // 乱序完成：先 finishSubTaskKey(#2)——#1 仍 running
  finishSubTaskKey(s, "explore#2", null)
  assert.equal(s.subTasks["explore#2"].done, true)
  assert.equal(s.subTasks["explore#1"].done, false, "先完成的 key 不冻另一块")
  finishSubTaskKey(s, "explore#1", null)
  assert.equal(s.subTasks["explore#1"].done, true)
  assert.equal(s.subTasks["explore#2"].done, true)
})

test("§7.2.3 T-F5 数据层: finishSubTaskKey 未知 key → null 零状态变更（不落启发式兜底——不误冻他块）", () => {
  const s = state()
  routeSubToken(s, "eng-coder#1/hello", noop)
  const eng = s.subTasks["eng-coder#1"]
  assert.equal(finishSubTaskKey(s, "explore#99", null), null, "无匹配 key 返回 null")
  assert.equal(eng.done, false, "running 块不受影响（无启发式兜底误冻）")
  assert.deepEqual(Object.keys(s.subTasks), ["eng-coder#1"], "无新条目/无删除")
})

test("§7.2.3 finishSubTaskKey: lastError 落位 + 跨角色 key（escalate#N——round1 #2 同享路径）", () => {
  const s = state()
  routeSubToken(s, "escalate#1/[model]kimi-k3", noop)
  const esc = s.subTasks["escalate#1"]
  const epochBefore = esc.blockEpoch
  finishSubTaskKey(s, "escalate#1", "turn cap reached — work may be partial")
  assert.equal(esc.done, true)
  assert.equal(esc.lastError, "turn cap reached — work may be partial")
  assert.notEqual(esc.blockEpoch, epochBefore, "epoch bump（fold 签名失效）")
  assert.equal(esc.currentTool, null, "currentTool 清空")
  assert.equal(esc.approval, null, "approval 清空")
})

test("§7.2.3 T-F1 数据层: 单块面板精确冻与启发式同效（既有语义回归——同走 freezeDoneSubTasks 冻结家族）", () => {
  const s = freezeState()
  routeSubToken(s, "explore#1/hello", noop)
  finishSubTaskKey(s, "explore#1", null)
  freezeDoneSubTasks(s)
  assert.equal(s.subTasks["explore#1"], undefined, "条目释放")
  assert.ok(s._frozenSubKeys.has("explore#1"), "tombstone 登记")
  const frozen = s.lines.find((l) => l._frozenSubTask?.key === "explore#1")
  assert.ok(frozen, "冻结载体行入流（同 freezeDoneSubTasks 机制——与 §17.5.5 freezeReclaimDigestedBlocks 并存不冲突）")
})

test("N2: 环形上限经路由同样生效（跨回调类型）", () => {
  const s = state()
  for (let i = 1; i <= 600; i++) routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: `row ${i}\n` }, noop)
  const sub = s.subTasks["coder#1"]
  const total = sub.blocks.reduce((n, b) => n + b.text.split("\n").length, 0)
  assert.ok(total <= SUB_BLOCK_LINE_LIMIT + 1, `≤ 501（500 + meta 标记行），实际 ${total}`)
})


// -------------------------------------------- §19.5 嵌套前缀子标（T-M24/M25 数据层）+ stopped

test("§19.5 T-M24: parseRelayPath——单层兼容（inner 空）+ 嵌套多层循环解析", () => {
  assert.equal(parseRelayPath("无前缀"), null)
  const single = parseRelayPath("coder#1/hello")
  assert.deepEqual({ ...single }, { head: "coder#1", inner: [], label: "", rest: "hello" })
  const nested = parseRelayPath("eng-coder#2/explore#1/read")
  assert.equal(nested.head, "eng-coder#2", "首段路由（块）")
  assert.deepEqual(nested.inner, ["explore#1"], "剩余段 = 内层链")
  assert.equal(nested.label, "explore#1")
  assert.equal(nested.rest, "read", "段后余量 = 内容")
  const deep = parseRelayPath("eng-coder#2/explore#1/audit#3/x")
  assert.deepEqual(deep.inner, ["explore#1", "audit#3"], "任意深度循环解析")
  assert.equal(deep.rest, "x")
})

test("§19.5 T-M25 数据层: 嵌套文本/think/工具/输出三形态子标渲染 + 事件 token 剥除不路由", () => {
  const s = state()
  // 单层（无内层段）内容零变化——回归基线
  assert.equal(routeSubToken(s, "coder#1/hello", noop), true)
  assert.ok(s.subTasks["coder#1"].blocks.some((b) => b.kind === "text" && b.text === "hello"), "单层文本零变化")
  // 外层自身文本照常（eng-coder 单层前缀——以 \n 收尾模拟行完成）
  assert.equal(routeSubToken(s, "eng-coder#2/hello\n", noop), true)
  const outer = s.subTasks["eng-coder#2"]
  assert.ok(outer.blocks.some((b) => b.kind === "text" && b.text === "hello\n"), "单层文本零变化")
  // 内层文本：行首（块首或上一内容以 \n 收尾）→ 字面子标 `explore#1 · `；行中 → 前缀静默剥除
  assert.equal(routeSubToken(s, "eng-coder#2/explore#1/报告摘要\n", noop), true)
  assert.ok(outer.blocks.some((b) => b.kind === "text" && String(b.text).endsWith("explore#1 · 报告摘要\n")), "文本行行首子标（块首——同 kind 块合并追加）")
  assert.equal(routeSubToken(s, "eng-coder#2/explore#1/续行", noop), true)
  assert.ok(outer.blocks.some((b) => b.kind === "text" && String(b.text).endsWith("explore#1 · 续行")), "换行后新行首也带子标")
  assert.equal(routeSubToken(s, "eng-coder#2/explore#1/继续", noop), true)
  assert.ok(outer.blocks.some((b) => b.kind === "text" && String(b.text).endsWith("继续")), "行中前缀静默剥除——内容续接")
  assert.ok(!outer.blocks.some((b) => String(b.text).includes("explore#1/")), "内层前缀不再字面泄漏（只剩 · 子标形态）")
  // 工具行：子标 + 既有工具行形态；currentTool = 全路径（归属判别）
  assert.equal(routeSubToolCall(s, "eng-coder#2/explore#1/read", { path: "x" }, noop), true)
  const tools = outer.blocks.filter((b) => b.kind === "tool")
  assert.ok(tools.some((b) => b.text.includes("explore#1 · ❯ read")), "工具行 = 子标 + 既有形态")
  assert.equal(outer.currentTool, "explore#1/read", "currentTool 全路径")
  // 工具输出：跟随最近工具行归属——raw 追加、不重复前缀（块以 \n 收尾）
  assert.equal(routeSubToolOutput(s, "eng-coder#2/explore#1/read", { kind: "text", text: "file content\n" }, noop), true)
  const toolBlock = tools.at(-1)
  assert.ok(toolBlock.text.includes("file content"), "输出进对应工具块")
  // 内层 think：同文本规则（行首——上一块以 \n 收尾）
  assert.equal(routeSubReasoning(s, "eng-coder#2/explore#1/思考行", noop), true)
  const thinks = outer.blocks.filter((b) => b.kind === "think")
  assert.ok(thinks.some((b) => b.text === "explore#1 · 思考行"), "think 行行首子标")
  assert.equal(routeSubReasoning(s, "eng-coder#2/explore#1/续想", noop), true)
  assert.ok(thinks.some((b) => String(b.text).endsWith("续想")), "think 行中前缀同样剥除")
  assert.ok(!outer.blocks.some((b) => String(b.text).includes("explore#1/续")), "think 无前缀泄漏")
  // 内层事件类 token：剥除不路由（不更新外层块头 turn/maxTurns——round1 #4）
  routeSubToken(s, "eng-coder#2/explore#1/⟦ev⟧turn\x1e5\x1e100\x1ellm\x1e", noop)
  assert.equal(outer.turn, 0, "内层 ⟦ev⟧turn 不污染外层块头")
  assert.equal(outer.maxTurns, 0)
  routeSubToken(s, "eng-coder#2/explore#1/[model]inner-model", noop)
  assert.equal(outer.model, undefined, "内层 [model] 不污染外层 model")
  // 外层自身单层事件照常（eng-coder 进度驱动自身块头）
  routeSubToken(s, "eng-coder#2/⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e", noop)
  assert.equal(outer.turn, 3, "单层 ⟦ev⟧turn 照常路由")
  assert.equal(outer.maxTurns, 100)
})

test("§19.5 T-M19 数据层: ⟦ev⟧stopped → interrupted 语义冻结（stopped 标记 + 面板释放 + 冻结载体）", () => {
  const s = freezeState()
  routeSubToken(s, "eng-coder#2/hello", noop)
  assert.equal(routeSubToken(s, "eng-coder#2/⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e", noop), true, "stopped 事件消费")
  assert.equal(s.subTasks["eng-coder#2"], undefined, "stopped 立即冻结——从 live 集合释放")
  assert.ok(s._frozenSubKeys.has("eng-coder#2"), "tombstone 登记")
  const frozen = s.lines.find((l) => l._frozenSubTask?.key === "eng-coder#2")
  assert.ok(frozen, "冻结载体行入流")
  assert.equal(frozen._frozenSubTask.stopped, true, "stopped 标记（冻结头显示 \"stopped\"）")
  assert.equal(frozen._frozenSubTask.done, true)
  // done 冻结不带 stopped 标记（对照）
  const s2 = freezeState()
  routeSubToken(s2, "coder#1/hello", noop)
  routeSubToken(s2, "coder#1/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", noop)
  const f2 = s2.lines.find((l) => l._frozenSubTask?.key === "coder#1")
  assert.equal(f2._frozenSubTask.stopped, false, "done 冻结无 stopped 标记")
  // 冻结后晚到 token 经 tombstone 丢弃（不复活）
  assert.equal(routeSubToken(s2, "coder#1/晚到", noop), true)
  assert.equal(s2.subTasks["coder#1"], undefined)
})

// -------------------------------------------- 冻结锚点（2026-09-03 修复轮：症状 2）

/** 建块 + 挂起期 settle（⟦ev⟧settled 记录锚点）——真实路径：子代理 start 的
 *  [model]/文本 token 建块，settle 回调发 ⟦ev⟧settled。 */
function suspend(state, key) {
  routeSubToken(state, `${key}/hello`, noop)
  routeSubToken(state, `${key}/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`, noop)
}

const freezeState = () => ({ subTasks: {}, lines: [], _frozenSubKeys: new Set() })

const frozenTexts = (s) => s.lines.map((l) => l._frozenSubTask ? `[块 ${l._frozenSubTask.key}]` : l.text)

test("冻结锚点：settled 记录 settle 时刻流位置——digest 文本之后补发冻结仍 splice 落其前（freezeAllSubTasks/freezeDoneSubTasks 同效）", () => {
  // freezeAllSubTasks（挂起退出路径）
  const s = freezeState()
  s.lines.push({ text: "用户回合内容", color: undefined })
  suspend(s, "coder#1") // 此时 settle——锚点 = 1（用户内容之后）
  assert.equal(s.subTasks["coder#1"]._freezeAt, 1, "锚点 = settle 时刻流位置")
  s.lines.push({ text: "digest 总览", color: undefined })
  s.lines.push({ text: "digest 更多", color: undefined })
  freezeAllSubTasks(s)
  assert.equal(s.lines[1]._frozenSubTask?.key, "coder#1", "splice 落位——冻结块在 digest 文本之前")
  assert.deepEqual(frozenTexts(s), ["用户回合内容", "[块 coder#1]", "digest 总览", "digest 更多"])
  // freezeDoneSubTasks（工具结果清扫路径）同效
  const s2 = freezeState()
  s2.lines.push({ text: "用户回合内容", color: undefined })
  suspend(s2, "coder#2")
  s2.lines.push({ text: "digest 总览", color: undefined })
  freezeDoneSubTasks(s2)
  assert.deepEqual(frozenTexts(s2), ["用户回合内容", "[块 coder#2]", "digest 总览"], "freezeDoneSubTasks 同按锚点插入")
})

test("冻结锚点：多子代理各自 settle 锚点插入——锚点交错（digest 夹中间）时按锚点降序冻结", () => {
  const s = freezeState()
  suspend(s, "coder#1") // A settle（锚点 0）
  s.lines.push({ text: "digest A 总览", color: undefined })
  suspend(s, "coder#2") // B settle 更晚（锚点 1——digest A 之后）
  s.lines.push({ text: "digest B 总览", color: undefined })
  freezeAllSubTasks(s)
  assert.deepEqual(frozenTexts(s), ["[块 coder#1]", "digest A 总览", "[块 coder#2]", "digest B 总览"],
    "A 块落 digest A 之前、B 块落 digest B 之前（先 settle 者不落后 settle 者的 digest 后）")
})

test("冻结锚点：无锚点路径（即时完成/中断）仍尾推不变", () => {
  const s = freezeState()
  routeSubToken(s, "coder#1/hello", noop)
  s.lines.push({ text: "既有内容", color: undefined })
  finishSubTask(s, ["coder"]) // 非挂起 settle——done 即时冻结（无 _freezeAt）
  freezeDoneSubTasks(s)
  assert.deepEqual(frozenTexts(s), ["既有内容", "[块 coder#1]"], "无锚点默认尾推（既有行为不变）")
})

test("冻结锚点：头裁校正按净位移（裁 N 补 1 标记行 → −(N−1)），无锚点条目不受影响", () => {
  const s = freezeState()
  suspend(s, "coder#1")
  s.subTasks["coder#1"]._freezeAt = 1500 // 模拟 settle 于 1500 行处
  shiftFreezeAnchors(s, 1000)
  assert.equal(s.subTasks["coder#1"]._freezeAt, 501, "1500 − (1000−1)——净位移（标记行已计入）")
  // 连续两次头裁：逐次 −(1000−1)
  s.subTasks["coder#1"]._freezeAt = 4000
  shiftFreezeAnchors(s, 1000)
  shiftFreezeAnchors(s, 1000)
  assert.equal(s.subTasks["coder#1"]._freezeAt, 2002, "4000 − 999×2")
  // min 0 兜底：锚点小于裁切量 → 0
  s.subTasks["coder#1"]._freezeAt = 500
  shiftFreezeAnchors(s, 1000)
  assert.equal(s.subTasks["coder#1"]._freezeAt, 0, "500 − 999 → 0")
  // 无锚点条目（即时完成/中断/压缩面板）不受影响
  const s2 = freezeState()
  routeSubToken(s2, "coder#2/hello", noop)
  shiftFreezeAnchors(s2, 1000)
  assert.equal(s2.subTasks["coder#2"]._freezeAt, undefined, "无锚点不动")
})

test("冻结锚点：头裁净位移校正后补发冻结 splice 精确落位——冻结块仍在 digest 文本之前", () => {
  const s = freezeState()
  for (let i = 0; i < 10; i++) s.lines.push({ text: `L${i}`, color: undefined })
  suspend(s, "coder#1") // settle 于 10 行处（锚点 10）
  s.lines.push({ text: "digest 总览", color: undefined }) // settle 后进流（第 11 行）
  // 模拟 index.mjs pushLine 头裁：裁 6 行 + 补 1 标记行（净位移 −5）
  s.lines.splice(0, 6)
  s.lines.unshift({ text: "... [earlier messages trimmed]", color: undefined })
  shiftFreezeAnchors(s, 6)
  assert.equal(s.subTasks["coder#1"]._freezeAt, 5, "锚点按净位移 −5（10 − (6−1)）")
  freezeAllSubTasks(s)
  const texts = frozenTexts(s)
  assert.deepEqual(texts, ["... [earlier messages trimmed]", "L6", "L7", "L8", "L9", "[块 coder#1]", "digest 总览"],
    "校正后 splice 精确落位：冻结块紧跟残余既有内容、仍在 digest 文本之前")
})

// ---------------------------------------------------------------- 压缩面板（CONTEXT-COMPACTION §7 D-C2）

const panelText = (panel) => panel.blocks.map((b) => b.text).join("")
/** 压缩面板测试夹具：冻结路径（freezeSubTaskLines）需要 state.lines。 */
const panelState = () => ({ subTasks: {}, lines: [] })

test("压缩面板: 开始→失败→重试→3 次失败→降级（状态机，降级说明与连续失败绑定）", () => {
  const s = panelState()
  // 第 1 次尝试：进行中
  const p = ensureCompressPanel(s, { messages: 9 })
  assert.ok(p.key.startsWith("compress#"))
  assert.equal(p.role, "compress")
  const t1 = panelText(p)
  assert.match(t1, /Compressing context…/)
  assert.match(t1, /summarizing 9 messages/)
  const started1 = p.started
  // 失败：仅错误文本，无降级说明；不冻结（可重试）
  markCompressFailed(s, new Error("API error: HTTP 400 — bad request"))
  assert.match(panelText(p), /Compression failed: API error: HTTP 400 — bad request/)
  assert.ok(!panelText(p).includes("fallback"), "单次失败不得出现降级说明")
  assert.equal(p.done, false, "失败不冻结——重试继续同一面板")
  assert.equal(p.lastError, "API error: HTTP 400 — bad request")
  // 重试：同一面板回到进行中，耗时 ticker 重置
  ensureCompressPanel(s, { messages: 9 })
  assert.equal(p.done, false)
  assert.ok(p.started >= started1, "每次 onCompressStart 重置耗时基座")
  // 第 2 次失败 + 重试
  markCompressFailed(s, new Error("API error: HTTP 400 — bad request"))
  ensureCompressPanel(s, { messages: 9 })
  // 第 3 次失败 → fallback 实际执行 → 降级说明 + 冻结
  markCompressFailed(s, new Error("API error: HTTP 400 — bad request"))
  markCompressFallback(s, { mode: "fallback", tailMessages: 6 })
  assert.equal(p.done, true)
  assert.match(panelText(p), /Compression failed — fallback: truncated to 6 messages/)
  assert.ok(s.lines.some((l) => l._frozenSubTask?.role === "compress"), "冻结进会话流")
  assert.equal(Object.values(s.subTasks).some((x) => x.role === "compress"), false, "live 条目释放")
})

test("T5 压缩面板: 摘要正文永不进面板（仅状态/阶段/耗时/结果 kind）", () => {
  const s = panelState()
  const p = ensureCompressPanel(s, { messages: 9 })
  // 模拟压缩全程：开始 → 失败 → 重试 → 完成（摘要正文 "这是摘要正文" 全程不得进入面板）
  markCompressFailed(s, new Error("API error: HTTP 400 — bad request"))
  ensureCompressPanel(s, { messages: 9 })
  markCompressDone(s, { mode: "summary", tokensFreed: 1234, elapsedMs: 12_345 })
  const text = panelText(p)
  assert.match(text, /Compressed: 1234 tokens freed → summary \(12s\)/)
  assert.ok(!text.includes("这是摘要正文"), "摘要正文不泄入面板")
  const frozen = s.lines.find((l) => l._frozenSubTask?.role === "compress")
  const kinds = new Set(frozen._frozenSubTask.blocks.map((b) => b.kind))
  assert.ok([...kinds].every((k) => ["status", "meta", "err"].includes(k)), `仅状态 kind，实际 ${[...kinds].join(",")}`)
  const frozenText = frozen._frozenSubTask.blocks.map((b) => b.text).join("")
  assert.ok(!frozenText.includes("这是摘要正文"), "冻结形态同样无正文")
})

test("压缩面板: 无 live 面板时完成/失败回调安全 no-op", () => {
  const s = panelState()
  markCompressDone(s, { mode: "summary", tokensFreed: 1, elapsedMs: 1 })
  markCompressFailed(s, new Error("x"))
  markCompressFallback(s, { mode: "fallback", tailMessages: 1 })
  assert.deepEqual(s.lines, [])
  assert.deepEqual(s.subTasks, {})
})

test("§19.5 D-M7b 数据层: ⟦ev⟧async 零字段标记 → sub.async = true（sync 无标记保持 undefined；嵌套剥除不路由；伪形态不设标记）", () => {
  // async 标记（实际启动即发——先于 [model]）：事件只设标记，不进 blocks
  const s = state()
  assert.equal(routeSubToken(s, "eng-coder#2/⟦ev⟧async\x1e", noop), true)
  const sub = s.subTasks["eng-coder#2"]
  assert.equal(sub.async, true, "⟦ev⟧async 解析 → sub.async = true")
  assert.equal(sub.blocks.length, 0, "事件 token 不进 blocks（与 ⟦ev⟧turn 同族——仅头部）")
  // [model]/turn 等随后照常（标记与模型名并列渲染——互不干扰）
  routeSubToken(s, "eng-coder#2/[model]glm-5.3", noop)
  routeSubToken(s, "eng-coder#2/⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e", noop)
  assert.equal(sub.model, "glm-5.3")
  assert.equal(sub.turn, 3)
  // 嵌套 async（理论不产生——eng-coder 内部受限 spawn 同步强制）→ 剥除不路由
  const s2 = state()
  routeSubToken(s2, "eng-coder#5/explore#1/⟦ev⟧async\x1e", noop)
  assert.equal(s2.subTasks["eng-coder#5"].async, undefined, "内层 async 标记剥除——不设外层 async")
  // sync 块（无标记——sync spawn 不发）：async 保持 undefined → 渲染端显式标 sync
  const s3 = state()
  routeSubToken(s3, "explore#1/hello", noop)
  assert.equal(s3.subTasks["explore#1"].async, undefined, "sync 块无 async 字段（undefined = sync——D-M7b B 形态）")
  // 伪形态（async 后无 RS/串尾——正文误前缀）不设标记（严格匹配）
  const s4 = state()
  routeSubToken(s4, "coder#1/⟦ev⟧asyncronous text", noop)
  assert.equal(s4.subTasks["coder#1"].async, undefined, "asyncronous 伪前缀不设标记")
})

// ═══════════════════════════════════════════════════════════════════════════
// §19.6 D-P1 面板镜像（AGENT-LOOP.md §19.6——T-P6 + 冻结家族刷新点）
// ═══════════════════════════════════════════════════════════════════════════

/** 挂载 mock：state._agent = agent（index.mjs 装配同构）→ 镜像 = agent._panelSnapshot。 */
const mounted = () => {
  const agent = {}
  return { agent, s: { ...state(), _agent: agent, lines: [], _frozenSubKeys: new Set() } }
}
const mirror = (agent) => agent._panelSnapshot ?? null

test("§19.6 T-P6: 镜像同步——state.subTasks 块级变更 → agent._panelSnapshot 刷新（块创建/settled/冻结删除）", () => {
  const { agent, s } = mounted()
  // ① 未挂载（headless/mock——无 state._agent）：零变更零镜像（降级判定靠 agent 侧）
  const bare = state()
  routeSubToken(bare, "coder#1/hello", noop)
  assert.equal(agent._panelSnapshot, undefined, "挂载前（裸 state 无 _agent）不产生镜像")
  // ② 块创建（routeSubToken 经 ensureSubTaskKey）→ running 入镜
  routeSubToken(s, "coder#1/hello", noop)
  assert.deepEqual(mirror(agent).map((b) => [b.key, b.role, b.status]), [["coder#1", "coder", "running"]],
    "块创建 → running 镜像条目")
  // ③ 第二块 + async 标记（标记不进镜——非块级状态）
  routeSubToken(s, "eng-coder#2/[model]glm-5.3", noop)
  routeSubToken(s, "eng-coder#2/⟦ev⟧async\x1e", noop)
  routeSubToken(s, "eng-coder#2/工作中...", noop)
  assert.equal(mirror(agent).length, 2, "第二块入镜")
  assert.equal(mirror(agent)[1].async, undefined, "镜像条目无 async 字段（快照字段 = key/role/status/startedAt）")
  assert.ok(mirror(agent).every((b) => typeof b.startedAt === "number"), "startedAt 入镜（elapsed 读时算——round1 #4）")
  // ④ 文本/tool 内容流：不逐 token 刷（NF-P——块级变更才刷）
  const before = mirror(agent)
  routeSubToken(s, "coder#1/继续写...", noop)
  assert.equal(mirror(agent), before, "内容 token 不触发刷镜（同一数组引用——非块级变更零开销）")
  // ⑤ finishSubTaskKey 精确 done → 状态 done（冻结家族后续才移出）
  finishSubTaskKey(s, "coder#1", null)
  assert.deepEqual(mirror(agent).map((b) => [b.key, b.status]), [["coder#1", "done"], ["eng-coder#2", "running"]],
    "done 标记 → 镜像状态 done")
  // ⑥ 冻结删除（freezeDoneSubTasks）→ 移出镜像
  freezeDoneSubTasks(s)
  assert.deepEqual(mirror(agent).map((b) => b.key), ["eng-coder#2"], "冻结回收后刷镜——块移出面板")
  // ⑦ settled → awaitingDigest（驻留中间态入镜）
  routeSubToken(s, "eng-coder#2/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noop)
  assert.deepEqual(mirror(agent).map((b) => [b.key, b.status]), [["eng-coder#2", "awaitingDigest"]],
    "settled 驻留 → awaitingDigest 状态入镜")
  // ⑧ freezeAllSubTasks 兜底删除 → 空镜（镜像非 undefined——挂载后 [] 与无镜像区分）
  freezeAllSubTasks(s)
  assert.deepEqual(mirror(agent), [], "兜底冻结 → 空面板镜像（[] ≠ undefined——区分空面板与无镜像）")
  assert.equal(agent._panelSnapshot !== undefined, true)
})

test("§19.6 T-P6 扩展: routeSubToken done/stopped 分支 + freezeReclaimDigestedBlocks 删除 → 镜像同步", () => {
  // done 事件（回合内 settle）→ 冻结删除即时刷镜
  const a = mounted()
  routeSubToken(a.s, "coder#1/hello", noop)
  routeSubToken(a.s, "coder#1/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", noop)
  assert.deepEqual(mirror(a.agent), [], "⟦ev⟧done 冻结删除 → 刷镜")
  // stopped 事件（cancel——§19.5）→ 冻结删除即时刷镜
  const b = mounted()
  routeSubToken(b.s, "eng-coder#2/hello", noop)
  routeSubToken(b.s, "eng-coder#2/⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e", noop)
  assert.deepEqual(mirror(b.agent), [], "⟦ev⟧stopped 冻结删除 → 刷镜")
  // finishSubTask / finishSubTasksByRole / finishSubTaskByModel 同刷（done 状态入镜）
  const c = mounted()
  routeSubToken(c.s, "coder#1/hello", noop)
  finishSubTask(c.s, ["coder"], null)
  assert.deepEqual(mirror(c.agent).map((b) => [b.key, b.status]), [["coder#1", "done"]], "finishSubTask done 刷镜")
  const d = mounted()
  routeSubToken(d.s, "consult#1/hello", noop)
  finishSubTasksByRole(d.s, ["consult"], null)
  assert.deepEqual(mirror(d.agent).map((b) => b.status), ["done"], "finishSubTasksByRole done 刷镜")
  const e = mounted()
  routeSubToken(e.s, "consult#1/[model]kimi-k3", noop)
  finishSubTaskByModel(e.s, "consult", "kimi-k3")
  assert.deepEqual(mirror(e.agent).map((b) => b.status), ["done"], "finishSubTaskByModel done 刷镜")
  // freezeReclaimDigestedBlocks（§17.5.5 逐条回收）→ 刷镜
  const f = mounted()
  routeSubToken(f.s, "eng-coder#9/hello", noop)
  routeSubToken(f.s, "eng-coder#9/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noop)
  assert.equal(freezeReclaimDigestedBlocks(f.s, []), 1, "已消化（pending 空）→ 逐条回收")
  assert.deepEqual(mirror(f.agent), [], "freezeReclaim 删除 → 刷镜")
  // 压缩面板建/冻结 → 同镜（面板视图与用户所见一致——含 compress 区块）
  const g = mounted()
  ensureCompressPanel(g.s, { messages: 10 })
  assert.equal(mirror(g.agent).length, 1, "压缩面板建 → 入镜")
  assert.equal(mirror(g.agent)[0].role, "compress")
  assert.equal(mirror(g.agent)[0].status, "running")
  markCompressDone(g.s, { tokensFreed: 5, elapsedMs: 1000 })
  assert.deepEqual(mirror(g.agent), [], "压缩面板冻结 → 刷镜移除")
})


