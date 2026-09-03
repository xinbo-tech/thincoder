/**
 * subagent-blocks.mjs 单测 — 子agent 活动区块数据层（§7.2 D4/D5，消费端）。
 * 覆盖：前缀路由（token/reasoning/toolCall/toolOutput）、事件 token 头部更新、
 * N2 环形上限、done 标记。渲染断言在 tui.test.mjs。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  SUB_BLOCK_LINE_LIMIT, finishSubTask, applySubEvent,
  routeSubToken, routeSubReasoning, routeSubToolCall, routeSubToolOutput,
  freezeDoneSubTasks, freezeAllSubTasks, shiftFreezeAnchors,
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

test("N2: 环形上限经路由同样生效（跨回调类型）", () => {
  const s = state()
  for (let i = 1; i <= 600; i++) routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: `row ${i}\n` }, noop)
  const sub = s.subTasks["coder#1"]
  const total = sub.blocks.reduce((n, b) => n + b.text.split("\n").length, 0)
  assert.ok(total <= SUB_BLOCK_LINE_LIMIT + 1, `≤ 501（500 + meta 标记行），实际 ${total}`)
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
