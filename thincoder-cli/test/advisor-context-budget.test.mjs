/**
 * advisor-context-budget.test.mjs — 第 25 批（评审上下文预算跟随模型窗口——120K 硬编码退场）
 * 用例表 1:1 落地：T-CB1–T-CB5（设计档 `docs/design/ADVISOR-CONVERGENCE.md` §16.9；
 * AC-CB1–AC-CB5；需求 §10 F27）；群 B 批 B4 追补 T-EST1/T-EST2（`§18.3`——评审估算器
 * CJK 加权，F32）。
 *
 * 单测零网络、零真实 LLM（`_runAdvisorToolLoop` 的 `seams.chat` 覆写）、零长等待（字符串
 * 夹具——微秒级）。夹具量级口径 = `MAX_RESULT_CHARS`（64 × 1024）字符 ÷ 4 = 16_384 tokens/条。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { _runAdvisorToolLoop, advisorIncompleteMarker } from "@thincoder/core/advisor/run.mjs"
import { advisorContextBudget, estimateTokens, MAX_RESULT_CHARS } from "@thincoder/core/advisor/compaction.mjs"

const TOKENS_PER_BLOB = MAX_RESULT_CHARS / 4 // 16_384（chars/4 口径——满长工具结果一条）
const BLOB = "x".repeat(MAX_RESULT_CHARS) // 单条工具结果 = 满长截断量级（64 × 1024 字符）
/** n 条满长工具结果的消息夹具（估算式逐条相加 ⇒ 12 条 = 196_608 / 45 条 = 737_280）。 */
const blobs = (n) => Array.from({ length: n }, (_, i) => ({ role: "tool", tool_call_id: `t${i}`, content: BLOB }))
/** 终稿 chat 缝（零网络）：一次返回无工具调用的终稿文本。 */
const finalChat = async (p, opts) => { opts.onToken("final review text"); return { content: "final review text", toolCalls: [] } }
const AGENT = { cwd: "C:/proj/cb", config: {} }
const NO_TOOLS = { schemas: [], byName: new Map() }
/** 跑一次评审循环（空白工具集 + 终稿缝——预算守卫是本档唯一被测面）。 */
const runLoop = (provider, messages) =>
  _runAdvisorToolLoop(provider, messages, null, undefined, AGENT, "C:/proj/cb", NO_TOOLS, "code", null, null, { chat: finalChat })
/** 尾块 = 输出的最后一个空行分块（「以截断尾收尾」的机验形态）。 */
const tailBlock = (out) => out.split(/\n\s*\n/).at(-1)

test("T-CB1 纯函数 advisorContextBudget：五组输入 × {limit, compactAt} 逐断言 + 入参零突变", () => {
  assert.deepEqual(advisorContextBudget({ model: "deepseek-flash" }), { limit: 800_000, compactAt: 640_000 }, "1M 模型")
  assert.deepEqual(advisorContextBudget({ model: "glm-4" }), { limit: 102_400, compactAt: 81_920 }, "128K 模型")
  assert.deepEqual(advisorContextBudget({ model: "no-such-model-xyz" }), { limit: 102_400, compactAt: 81_920 }, "未知模型 → DEFAULT_SPEC 回退")
  assert.deepEqual(advisorContextBudget({ model: "deepseek-flash", context: 64 }), { limit: 52_428, compactAt: 41_942 }, "provider 级 context 覆盖（K 单位 ×1024）")
  assert.deepEqual(advisorContextBudget(null), { limit: 102_400, compactAt: 81_920 }, "null → 默认规格（不抛错——总函数）")
  const p = { model: "glm-4", context: 64 }
  const snap = JSON.stringify(p)
  assert.deepEqual(advisorContextBudget(p), advisorContextBudget(p), "重复调用同值（纯函数）")
  assert.equal(JSON.stringify(p), snap, "入参零突变（纯函数）")
})

test("T-CB2 核心缺陷闭合：1M 模型 + ~197K tokens → 不判死、正常收尾", async () => {
  const provider = { model: "deepseek-flash" }
  const messages = blobs(12)
  assert.equal(estimateTokens(messages), 12 * TOKENS_PER_BLOB, "夹具量级 ~197K（12 × 64K ÷ 4 = 196_608）")
  const out = await runLoop(provider, messages)
  assert.ok(!out.includes("Advisor: context window limit"), "1M 模型不得于 ~197K 判死（旧 120K 帽形态）")
  assert.ok(out.includes("final review text"), "终稿文本在位（评审完整收尾）")
  assert.equal(advisorIncompleteMarker(out), null, "判定族零命中")
  assert.equal(estimateTokens(messages), 12 * TOKENS_PER_BLOB, "未达派生触发线（640K）——零压缩零改写")
})

test("T-CB3 对照：128K / 未知模型同量上下文 → 仍以 context_limit 截断尾收尾", async () => {
  for (const model of ["glm-4", "no-such-model-xyz"]) {
    const out = await runLoop({ model }, blobs(12))
    assert.ok(tailBlock(out).startsWith("Advisor: context window limit reached ("), `${model}: 截断尾为收尾块（族前缀逐字）`)
    assert.ok(out.includes("Advisor: context window limit reached (196608 tokens)"), `${model}: 压缩后计数逐字（机械线不失效）`)
    assert.equal(advisorIncompleteMarker(out), "context_limit", `${model}: 判定族命中`)
  }
})

test("T-CB4 接线面 = providerSpec：provider 级 context 覆盖双向翻转判定", async () => {
  const tightMsgs = blobs(12)
  const looseMsgs = blobs(12)
  assert.equal(estimateTokens(tightMsgs), estimateTokens(looseMsgs), "两跑输入同量（196_608）")
  const tight = await runLoop({ model: "deepseek-flash", context: 64 }, tightMsgs)
  assert.equal(advisorIncompleteMarker(tight), "context_limit", "收紧（64K 窗口 → 判死线 52_428）→ 判死")
  const loose = await runLoop({ model: "glm-4", context: 1024 }, looseMsgs)
  assert.equal(advisorIncompleteMarker(loose), null, "放宽（1024K 窗口 → 判死线 838_860）→ 不判死")
  assert.ok(loose.includes("final review text"), "放宽后正常收尾")
})

test("T-CB5 压缩触发线在位：1M + ~737K → 真裁剪后正常收尾（不判死）", async () => {
  const provider = { model: "deepseek-flash" }
  const messages = blobs(45)
  assert.equal(estimateTokens(messages), 45 * TOKENS_PER_BLOB, "夹具量级 ~737K（45 × 64K ÷ 4 = 737_280）")
  const out = await runLoop(provider, messages)
  assert.ok(out.includes("[Context compacted:"), "派生触发线在位（压缩已触发）")
  assert.ok(!out.includes("Advisor: context window limit"), "压缩后不判死")
  assert.equal(advisorIncompleteMarker(out), null, "评审正常收尾（判定族零命中）")
  assert.ok(out.includes("final review text"), "终稿文本在位")
  assert.ok(estimateTokens(messages) < advisorContextBudget(provider).limit, "压缩后估算 < 派生判死线")
  assert.equal(messages.length, 22, "压缩真裁剪（system + 压缩注记 + 最近 20 条）")
})

// ─── T-EST1/T-EST2：B4 评审估算器 CJK 加权（群 B 批 §18.3——F32）───────────────

test("T-EST1 正常：estimateTokens 纯 ASCII 与旧扁平式逐值相等（零回归）", () => {
  assert.equal(estimateTokens([{ role: "user", content: "a".repeat(400) }]), 100, "400 ASCII / 4 = 100（ceil 同式）")
  assert.equal(estimateTokens(blobs(1)), TOKENS_PER_BLOB, "64K ASCII 工具结果 = 16_384（既有夹具断言逐值不变）")
  assert.equal(estimateTokens([]), 0, "空消息集 = 0")
  assert.equal(estimateTokens([{ role: "user", content: "" }]), 0, "空内容 = 0（旧式同值）")
})

test("T-EST2 正常：CJK 逐字符计（旧式 1/4）+ 混合 200 ASCII + 200 CJK = 250", () => {
  assert.equal(estimateTokens([{ role: "user", content: "中".repeat(400) }]), 400, "「中」×400 → 400（旧式 100——低估修正）")
  assert.equal(estimateTokens([{ role: "user", content: "a".repeat(200) + "中".repeat(200) }]), 250, "混合 = ceil(200/4) + 200")
  assert.equal(estimateTokens([{ role: "user", content: "中" }]), 1, "单 CJK 字符 = 1")
  const tcs = [{ id: "t1", type: "function", function: { name: "read", arguments: "{}" } }]
  assert.equal(estimateTokens([{ role: "assistant", content: null, tool_calls: tcs }]),
    Math.ceil((JSON.stringify("").length + JSON.stringify(tcs).length) / 4),
    "tool_calls JSON 全串照常入估（walker 两源 / 计数口径零改——ASCII 与旧式同值）")
})
