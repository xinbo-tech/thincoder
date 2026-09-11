/**
 * advisor-context-budget.test.mjs — 第 26 批（评审上下文预算 VSC 镜像——120K 硬编码退场）
 * 用例表 1:1 落地：T-CB1–T-CB6（设计档 `docs/design/ADVISOR-CONVERGENCE.md` §15.11）+
 * AC-CB1–AC-CB5 的机判面（§15.12）；群 B 批 B4 追补 T-EST1/T-EST2（§17.3/§17.5——评审
 * 估算器 CJK 加权，F32）。断言判据全文 = §15.4 / §15.5 / §17.3 契约。
 * 单测零网络（循环 `seams.chat` 覆写——`??` 默认回退，生产路径不可达）、零真实 LLM、
 * 零长等待（字符串夹具——微秒级，slow-gate 零命中）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import { _runAdvisorToolLoop } from "../src/advisor/run.mjs"
import {
  advisorIncompleteMarker, advisorContextBudget, CONTEXT_LIMIT_RATIO, estimateTokens,
} from "../src/advisor/compaction.mjs"

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

/** 源码读取（EOL 归一——静态锚不因 CRLF/LF 写法漂移）。 */
const readSrc = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const mkLoopAgent = (timeoutMs) => ({ cwd: "C:/proj/vscb", config: { advisor: { timeoutMs } } })
const P1M = { name: "stub", baseURL: "http://stub.invalid", apiKey: "k", model: "deepseek-flash" }
const P128K = { ...P1M, model: "glm-4" }

/** 64K 字符工具结果（`MAX_RESULT_CHARS` 边界内——与生产透传量级同形）。 */
const K64 = "x".repeat(64 * 1024)

/** 预置消息夹具：n 个 64K 字符工具结果（两条挂一条 assistant——消息数受控）。 */
function bigContext(n) {
  const messages = [{ role: "user", content: "review brief" }]
  for (let i = 0; i < n; i += 2) {
    const ids = [i, i + 1].filter((k) => k < n)
    messages.push({
      role: "assistant", content: null,
      tool_calls: ids.map((k) => ({ id: `t${k}`, type: "function", function: { name: "read", arguments: "{}" } })),
    })
    for (const k of ids) messages.push({ role: "tool", tool_call_id: `t${k}`, content: K64 })
  }
  return messages
}

/** 终稿 chat 缝（零工具调用 ⇒ 循环正常收尾）；`assertLive` = 回调时就地断言。 */
const finalChat = (text, assertLive) => async (p, opts) => {
  assertLive?.()
  opts.onToken(text)
  return { content: text, toolCalls: [] }
}
/** 不应被触达（判死分支必须在 chat 前返回——fail-closed 探针）。 */
const mustNotChat = async () => { throw new Error("chat must not be reached (context check must return first)") }

const run = (provider, messages, chat, timeoutMs = 600_000) => _runAdvisorToolLoop(
  provider, messages, null, undefined, mkLoopAgent(timeoutMs), "C:/proj/vscb", "code", null, null, { chat },
)

/** src/ 递归文本扫描（只读——返回含 needle 的文件相对路径清单）。 */
function scanSrc(needle) {
  const root = fileURLToPath(new URL("../src/", import.meta.url))
  const hits = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(?:mjs|cjs|js)$/.test(e.name) && readFileSync(p, "utf8").includes(needle)) hits.push(relative(root, p).replace(/\\/g, "/"))
    }
  }
  walk(root)
  return hits.sort()
}

// ─── T-CB1：纯函数（五组输入 × 两档） ─────────────────────────────────────────

test("T-CB1 纯函数 advisorContextBudget：1M / 128K / 未知 / context:64 / null 五组", () => {
  assert.deepEqual(advisorContextBudget({ model: "deepseek-flash" }), { limit: 800_000, compactAt: 640_000 })
  assert.deepEqual(advisorContextBudget({ model: "glm-4" }), { limit: 102_400, compactAt: 81_920 })
  assert.deepEqual(advisorContextBudget({ model: "no-such-model-xyz" }), { limit: 102_400, compactAt: 81_920 }, "未知模型 → DEFAULT_SPEC 128K 回退")
  assert.deepEqual(advisorContextBudget({ model: "deepseek-flash", context: 64 }), { limit: 52_428, compactAt: 41_942 }, "provider 级 K 单位覆盖")
  assert.deepEqual(advisorContextBudget(null), { limit: 102_400, compactAt: 81_920 }, "null → 总函数退化默认（不抛错）")
  assert.equal(CONTEXT_LIMIT_RATIO, 0.8, "系数导出面（跨端对读）")
  // 纯函数面（AC-CB1）：同输入重复调用同值 + 模块导入面唯一（无 I/O / 无状态写入）
  assert.deepEqual(
    advisorContextBudget({ model: "deepseek-flash", context: 64 }),
    advisorContextBudget({ model: "deepseek-flash", context: 64 }),
    "确定性（无隐藏状态）",
  )
  const src = readSrc("../src/advisor/compaction.mjs")
  const imports = src.split("\n").filter((l) => l.startsWith("import "))
  assert.deepEqual(imports, [
    'import { providerSpec } from "../specs.mjs"',
    'import { estimateText } from "../provider/rate.mjs"',
  ], "导入面 = 两枚叶子（specs + provider/rate——B4 加权单源；无 fs / 无 I/O）")
  assert.ok(!/\b(?:fs|process|globalThis)\s*\.|\bnode:/.test(src), "无 I/O / 无全局状态写入面")
})

// ─── T-CB2：核心缺陷闭合（1M 窗口不再被 120K 帽判死） ─────────────────────────

test("T-CB2 1M 模型 ~19.7 万 tokens：不以截断尾收尾（改前 120K 帽必判死）", async () => {
  const messages = bigContext(12)
  const tokens = estimateTokens(messages)
  assert.ok(tokens > 190_000 && tokens < 205_000, `夹具量级 ~19.7 万 tokens（实测 ${tokens}）`)
  assert.ok(messages.length <= 20, `消息数 ≤20（压缩不裁剪——实测 ${messages.length}）`)
  const out = await run(P1M, messages, finalChat("FINAL REVIEW TEXT"))
  assert.ok(!out.includes("Advisor: context window limit"), "1M 窗口在 ~19.7 万 tokens 处不判死")
  assert.ok(out.includes("FINAL REVIEW TEXT"), "终稿文本在位")
  assert.equal(advisorIncompleteMarker(out), null, "未完成判定族零命中")
})

// ─── T-CB3：对照（128K / 未知模型同量上下文仍截断） ──────────────────────────

test("T-CB3 128K / 未知模型同量上下文：仍以截断尾收尾（机械线 + 回退判据）", async () => {
  const cases = [["128K", P128K], ["未知模型", { ...P1M, model: "no-such-model-xyz" }]]
  for (const [label, provider] of cases) {
    const out = await run(provider, bigContext(12), mustNotChat)
    assert.ok(out.split("\n").some((l) => l.startsWith("Advisor: context window limit reached (")), `${label}：族前缀逐字`)
    assert.equal(advisorIncompleteMarker(out), "context_limit", `${label}：判定族命中`)
  }
})

// ─── T-CB4：边界（provider 级覆盖双向翻转） ──────────────────────────────────

test("T-CB4 provider 级 context 覆盖双向：64K 收紧判死 / 1024K 放宽不判死", async () => {
  const tight = await run({ ...P1M, context: 64 }, bigContext(12), mustNotChat)
  assert.ok(tight.includes("Advisor: context window limit reached ("), "context:64（收紧）→ 判死")
  assert.equal(advisorIncompleteMarker(tight), "context_limit")
  const loose = await run({ ...P128K, context: 1024 }, bigContext(12), finalChat("FINAL REVIEW TEXT"))
  assert.ok(!loose.includes("Advisor: context window limit"), "context:1024（放宽）→ 不判死")
  assert.equal(advisorIncompleteMarker(loose), null)
})

// ─── T-CB5：边界（派生触发线在位 + 压缩真裁剪） ──────────────────────────────

test("T-CB5 1M 模型 ~73.7 万 tokens：压缩真裁剪（>20 条）后正常收尾", async () => {
  const messages = bigContext(45)
  const tokens = estimateTokens(messages)
  assert.ok(tokens > 700_000 && tokens < 760_000, `夹具量级 ~73.7 万 tokens（实测 ${tokens}）`)
  assert.ok(messages.length > 20, `消息数 >20（触发真裁剪——实测 ${messages.length}）`)
  const out = await run(P1M, messages, finalChat("FINAL REVIEW TEXT", () => {
    assert.ok(messages.length <= 22, "压缩真裁剪：system + 压缩注记 + 最近 20 条")
    assert.ok(estimateTokens(messages) < 800_000, "压缩后估算 < 判死线（就地断言）")
  }))
  assert.ok(out.includes("[Context compacted:"), "派生触发线在位")
  assert.ok(!out.includes("Advisor: context window limit"), "压缩后不判死")
  assert.ok(out.includes("FINAL REVIEW TEXT"), "评审正常收尾")
  assert.equal(advisorIncompleteMarker(out), null)
})

// ─── T-CB6：静态锚（旧帽退场 + 循环消费派生值） ──────────────────────────────

test("T-CB6 静态锚：旧 OOM 注释与 MAX_CONTEXT_TOKENS 在 src/ 零残留；循环消费派生函数", () => {
  const compaction = readSrc("../src/advisor/compaction.mjs")
  const loop = readSrc("../src/advisor/loop.mjs")
  assert.ok(!compaction.includes("Reserve headroom to avoid OOM") && !loop.includes("Reserve headroom to avoid OOM"), "旧 OOM 注释零残留")
  assert.deepEqual(scanSrc("MAX_CONTEXT_TOKENS"), [], "MAX_CONTEXT_TOKENS 在 src/ 零残留")
  assert.ok(loop.includes("const budget = advisorContextBudget(provider)"), "循环体外一次性派生")
  assert.ok(loop.includes("budget.compactAt") && loop.includes("budget.limit"), "两处消费换值")
})

// ─── T-EST1/T-EST2：B4 评审估算器 CJK 加权（群 B 批 §17.3 / §17.5——F32）─────────

test("T-EST1 正常：estimateTokens 纯 ASCII 与旧扁平式逐值相等（零回归）", () => {
  assert.equal(estimateTokens([{ role: "user", content: "a".repeat(400) }]), 100, "400 ASCII / 4 = 100（ceil 同式）")
  assert.equal(estimateTokens([{ role: "tool", tool_call_id: "t1", content: K64 }]), 16_384, "64K ASCII 工具结果 = MAX_RESULT_CHARS/4 口径不变")
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

