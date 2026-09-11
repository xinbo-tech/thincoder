/**
 * design-review-streak-guard.test.mjs — 第 33 批（评审失败护栏：同一 doc-set 连续未完成即停）
 * 用例表 1:1 落地：T-SK1–T-SK10（设计档 §17.10）。断言判据全文 =
 * `docs/design/ADVISOR-CONVERGENCE.md` §17（§17.3 分类表 / §17.4 逐字结论串 / §17.5 检查点
 * 与计数点 / §17.11 AC-SK1–AC-SK6）。零网络、零真实 LLM（桩 agent + 纯函数直驱）、零长等待。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import {
  MAX_DESIGN_REVIEW_STREAK, normAbs, docSetKey, designReviewOutcome,
  noteDesignReviewOutcome, designReviewStreakRecord, designReviewStreakStopped,
  designReviewStreakApplies,
} from "../src/agent-tools/review-streak.mjs"
import { settleAdvisorRun, normAbs as normAbsViaSettle } from "../src/agent-tools/advisor-settle.mjs"
import { advisorTool } from "../src/agent-tools/advisor.mjs"
import {
  ADVISOR_DESIGN_STREAK_STOP_PREFIX, ADVISOR_LAUNCH_REFUSAL_PREFIX, buildDesignReviewGuardMessage, runAdvisorReview,
} from "../src/advisor/run.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/session-slots.mjs"

const tmpDirs = []
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })
function mktmp(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tmpDirs.push(dir)
  return dir
}
const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
const CWD = "C:/proj/sk"
const KEY = docSetKey(["docs/design/X.md", "docs/requirements/X.md"], CWD)

/** 结算输入 → 分类（序列断言便捷式）。 */
const classify = (input) => designReviewOutcome(input)
const feed = (agent, key, input) => noteDesignReviewOutcome(agent, key, designReviewOutcome(input))

// ─── T-SK1：分类矩阵（优先级逐条锁定；纯函数）────────────────────────────────

test("T-SK1 分类矩阵：pass/changes-required 复位；五 kind 逐一计数；interrupted 中性；stale / persistFailed / launchRefused / hasResult=false", () => {
  assert.deepEqual(classify({}), { reset: true, count: null }, "pass 且落盘成功 → reset")
  assert.deepEqual(classify({ incomplete: null }), { reset: true, count: null }, "changes-required（无尾）→ reset")
  for (const kind of ["context_limit", "turn_cap", "timeout", "empty", "review_failed"]) {
    assert.deepEqual(classify({ incomplete: kind }), { reset: false, count: kind }, `五 kind 逐一：${kind}`)
  }
  assert.deepEqual(classify({ incomplete: "interrupted" }), { reset: false, count: null }, "interrupted → neutral")
  assert.deepEqual(classify({ stale: true }), { reset: false, count: "stale" }, "stale → count")
  assert.deepEqual(classify({ persistFailed: true }), { reset: false, count: "no_credential" }, "pass 但落盘失败 → count")
  assert.deepEqual(classify({ launchRefused: true }), { reset: false, count: null }, "拒发 → neutral（无尝试发生）")
  assert.deepEqual(classify({ hasResult: false }), { reset: false, count: "no_report" }, "无报告 → count")
  // 优先级逐条锁定（#1 > #2 > #3 > #4 > #5 > #6 > #7）
  assert.deepEqual(classify({ launchRefused: true, stale: true, incomplete: "timeout" }), { reset: false, count: null }, "#1 拒发压过 stale / 尾")
  assert.deepEqual(classify({ stale: true, incomplete: "timeout" }), { reset: false, count: "stale" }, "#2 stale 压过尾")
  assert.deepEqual(classify({ hasResult: false, incomplete: "timeout", persistFailed: true }), { reset: false, count: "no_report" }, "#3 无报告压过尾 / 落盘")
  assert.deepEqual(classify({ incomplete: "timeout", persistFailed: true }), { reset: false, count: "timeout" }, "#4 尾压过落盘失败")
  assert.deepEqual(classify({ incomplete: "interrupted", persistFailed: true }), { reset: false, count: null }, "#5 中断压过落盘失败")
})

// ─── T-SK2 – T-SK5：计数 · 停止 · 复位 ───────────────────────────────────────

test("T-SK2 连续三次同类计数：count===3、log 顺序=录入顺序、停止 true（阈值 = MAX_DESIGN_REVIEW_STREAK）", () => {
  const agent = { cwd: CWD }
  for (let i = 0; i < 3; i++) feed(agent, KEY, { incomplete: "timeout" })
  const rec = designReviewStreakRecord(agent, KEY)
  assert.equal(rec.count, 3, "三次计数")
  assert.deepEqual(rec.log, ["timeout", "timeout", "timeout"], "log 顺序 = 录入顺序")
  assert.equal(designReviewStreakStopped(agent, KEY), true, "达阈值停止")
  assert.equal(MAX_DESIGN_REVIEW_STREAK, 3, "N=3（§17.2 表 1 选定）")
  // 1–2 次不触发（判定句②）
  const agent2 = { cwd: CWD }
  feed(agent2, KEY, { incomplete: "timeout" })
  feed(agent2, KEY, { incomplete: "timeout" })
  assert.equal(designReviewStreakStopped(agent2, KEY), false, "2 次不停")
})

test("T-SK3 混合 kind：timeout → stale → empty → count===3 且停止；log 三 kind 有序（结论表数据源）", () => {
  const agent = { cwd: CWD }
  feed(agent, KEY, { incomplete: "timeout" })
  feed(agent, KEY, { stale: true })
  feed(agent, KEY, { incomplete: "empty" })
  const rec = designReviewStreakRecord(agent, KEY)
  assert.equal(rec.count, 3)
  assert.deepEqual(rec.log, ["timeout", "stale", "empty"], "混合 kind 有序")
  assert.equal(designReviewStreakStopped(agent, KEY), true)
})

test("T-SK4 中途复位：计数 2 → 一次 reset（changes-required）→ 再 2 次；停在 2 不停、记录删除后重建（log 从空起）", () => {
  const agent = { cwd: CWD }
  feed(agent, KEY, { incomplete: "timeout" })
  feed(agent, KEY, { incomplete: "empty" })
  assert.equal(designReviewStreakRecord(agent, KEY).count, 2)
  feed(agent, KEY, { incomplete: null }) // changes-required → reset
  assert.equal(designReviewStreakRecord(agent, KEY), null, "reset 删除记录（判定句③）")
  feed(agent, KEY, { incomplete: "timeout" })
  feed(agent, KEY, { incomplete: "turn_cap" })
  const rec = designReviewStreakRecord(agent, KEY)
  assert.equal(rec.count, 2, "第二次序列从零起（停在 2）")
  assert.deepEqual(rec.log, ["timeout", "turn_cap"], "log 重建（reset 后从空起）")
  assert.equal(designReviewStreakStopped(agent, KEY), false, "不达阈值不停")
})

test("T-SK5 序列含 neutral：count → neutral(interrupted) → count → count = 停止；neutral 不增计数（值断言）", () => {
  const agent = { cwd: CWD }
  feed(agent, KEY, { incomplete: "timeout" })
  assert.equal(designReviewStreakRecord(agent, KEY).count, 1)
  feed(agent, KEY, { incomplete: "interrupted" }) // neutral
  assert.equal(designReviewStreakRecord(agent, KEY).count, 1, "neutral 不增计数（不打断连续）")
  assert.deepEqual(designReviewStreakRecord(agent, KEY).log, ["timeout"], "neutral 不入 log")
  feed(agent, KEY, { incomplete: "empty" })
  feed(agent, KEY, { incomplete: "timeout" })
  assert.equal(designReviewStreakRecord(agent, KEY).count, 3)
  assert.equal(designReviewStreakStopped(agent, KEY), true, "跨 neutral 累积达阈值")
  // log 环上限 = N（超限只留最近 N 条）
  const agent2 = { cwd: CWD }
  for (let i = 0; i < 5; i++) feed(agent2, KEY, { incomplete: "empty" })
  assert.equal(designReviewStreakRecord(agent2, KEY).log.length, MAX_DESIGN_REVIEW_STREAK, "log 有界（slice(-N)）")
})

// ─── T-SK6：键隔离与归一 ────────────────────────────────────────────────────

test("T-SK6 键隔离与归一：集 A 停止不影响集 B；写法变体（./ / 反斜杠 / 次序颠倒）指向同一键", () => {
  const kA = docSetKey(["docs/design/A.md", "docs/design/B.md"], CWD)
  const kB = docSetKey(["docs/design/Other.md"], CWD)
  assert.notEqual(kA, kB)
  assert.equal(docSetKey(["./docs/design/A.md", "docs/design/B.md"], CWD), kA, "./ 前缀归一")
  assert.equal(docSetKey(["docs/design/B.md", "docs/design/A.md"], CWD), kA, "次序无关")
  assert.equal(docSetKey(["docs\\design\\A.md", "docs/design/B.md"], CWD), kA, "反斜杠归一")
  assert.equal(normAbs("docs/design/A.md", CWD), normAbs(join(CWD, "docs", "design", "A.md"), CWD), "ABS 幂等")
  assert.equal(normAbsViaSettle, normAbs, "advisor-settle 原处 re-export（既有 import 面零变——单源）")
  const agent = { cwd: CWD }
  for (let i = 0; i < 3; i++) feed(agent, kA, { incomplete: "timeout" })
  assert.equal(designReviewStreakStopped(agent, kA), true, "集 A 停止")
  assert.equal(designReviewStreakStopped(agent, kB), false, "集 B 不受影响（判定句④）")
  assert.equal(designReviewStreakStopped(agent, docSetKey(["./docs/design/A.md", "docs\\design\\B.md"], CWD)), true, "变体同键——A 的计数在变体发起上生效")
})

// ─── T-SK7：工具层预检（检查点 1——sync/async 分治前）──────────────────────────

test("T-SK7 工具层预检：置位 3 次后 advisorTool.execute 返回结论串（前缀 + 表 + 三选项）——零 chat、拒发登记", async () => {
  const ws = mktmp("sk-tool-")
  const docs = ["docs/design/X.md", "docs/requirements/X.md"]
  const agent = { cwd: ws, _advisorRuns: new Map(), _designReviewStreaks: new Map() }
  const key = docSetKey(docs, ws)
  for (const kind of ["timeout", "stale", "empty"]) feed(agent, key, { stale: kind === "stale", incomplete: kind === "stale" ? null : kind })
  assert.equal(designReviewStreakStopped(agent, key), true)

  const out = await advisorTool.execute({ type: "design", documents: docs }, { agent, depth: 0, _toolCallId: "sk-c1" })
  assert.ok(out.startsWith("Advisor: design review stopped"), "前缀逐字（§17.4）")
  assert.ok(out.includes("Document set (1 design instance — no token issued):"), "doc-set 清单头")
  assert.ok(docs.every((d) => out.includes(`- ${d}`)), "清单逐档")
  assert.ok(out.includes("Attempts (most recent last):"), "尝试表头")
  assert.ok(out.includes("| # | outcome | meaning |"), "表头列")
  assert.ok(out.includes("| 1 | timeout | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |"), "表行 1（kind → meaning 逐字）")
  assert.ok(out.includes("| 2 | stale | the reviewed documents changed while the review was in flight |"), "表行 2")
  assert.ok(out.includes("| 3 | empty | the provider returned an empty response |"), "表行 3")
  assert.ok(out.includes("Options:") && out.includes("1. Accept the current state and proceed"), "三选项 ①")
  assert.ok(out.includes("2. Narrow or change the scope"), "三选项 ②")
  assert.ok(out.includes("3. Start a new session (/new) to reset the guard."), "三选项 ③")
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/.test(out), "零凭证值（UUID 形扫描零命中——F29）")
  // 零 chat：拒发在分叉前——池条目从未建立（launchAsyncAdvisor 才会建池），async ack 亦无
  assert.equal(agent._asyncAdvisors, undefined, "未发起（无池条目）")
  assert.equal(agent._advisorAsyncAcks, undefined, "未走 async-ack 记账")
  assert.equal(agent._advisorRefusals?.has("sk-c1"), true, "拒发登记命中该 toolCallId（不置 called / 不耗轮次）")
  assert.equal(out, buildDesignReviewGuardMessage(designReviewStreakRecord(agent, key), docs), "工具层返回逐字 = 结论串构建器输出（单源）")

  // 检查点 2（内防线）行为锁：同一 stopped 键直调 runAdvisorReview —— 结论串同拒（零 provider /
  // 零消息构建 / 零发起——防线在 provider 解析之前）。
  const direct = await runAdvisorReview(agent, "design", {}, liveTok(), docs, null)
  assert.ok(String(direct).startsWith(ADVISOR_DESIGN_STREAK_STOP_PREFIX), "直调同拒（防直接调用方绕）")
  assert.ok(String(direct).includes("| 1 | timeout |"), "内防线返回同一结论串（含尝试表）")

  // 对照：未达阈值不触发（判定句②——1–2 次仍正常发起；此处仅查停止判定面，不真发起）
  const agent2 = { cwd: ws, _advisorRuns: new Map(), _designReviewStreaks: new Map() }
  feed(agent2, docSetKey(docs, ws), { incomplete: "timeout" })
  assert.equal(designReviewStreakStopped(agent2, docSetKey(docs, ws)), false, "1 次失败不触发护栏")
})

// ─── T-SK8：异步结算直驱（计数点 1）─────────────────────────────────────────

test("T-SK8 settleAdvisorRun 直驱：design 五 kind 逐一 / stale / persist 失败 / 可用判决复位；launchRefused 不动计数", () => {
  const tails = {
    context_limit: "Advisor: context window limit reached (123456 tokens). Review incomplete — too many tool calls. Try a narrower scope.",
    turn_cap: "Advisor: stopped after 100 tool rounds — the review appears to be looping. You may retry with a narrower scope.",
    timeout: "Advisor: review timeout after 600s. Partial results may be available. Try again with a narrower scope.",
    empty: "Advisor: empty response — review was inconclusive",
    review_failed: "Advisor: review failed (timeout) — The model took too long. Try with a narrower scope.",
  }
  const agent = { cwd: CWD, _mutLog: [], _engDesignTokens: new Map(), _advisorRound: 0, _calledAdvisorThisRun: false }
  const mkEntry = (report, over = {}, token = liveTok()) => ({
    id: 1, cancelled: false, reviewType: "design", docAbs: [], launchSeq: -1,
    run: { reviewType: "design", designId: "did-1", round: 0, priorOutput: null, open: true, docSetKey: KEY },
    designToken: token, report,
    ...over,
  })
  for (const [kind, tail] of Object.entries(tails)) {
    settleAdvisorRun(agent, mkEntry(`Findings.\n\n${tail}`))
    const rec = designReviewStreakRecord(agent, KEY)
    assert.ok(rec, `${kind}：记录在位`)
    assert.equal(rec.log.at(-1), kind, `${kind}：按分类增计数 + 记录 kind`)
  }
  assert.equal(designReviewStreakRecord(agent, KEY).count, 5, "五 kind 累计")

  // stale 分支（陈旧结算——不签发）：增 "stale"
  const X_ABS = join(CWD, "docs", "design", "X.md")
  const staleAgent = {
    cwd: CWD, _mutLog: [{ seq: 1, paths: [X_ABS] }], _engDesignTokens: new Map(), _advisorRound: 0, _calledAdvisorThisRun: false,
  }
  settleAdvisorRun(staleAgent, mkEntry("Findings text.\n\nbody", { docAbs: [X_ABS], launchSeq: 0 }))
  assert.deepEqual(designReviewStreakRecord(staleAgent, KEY)?.log, ["stale"], "stale 分支计数")

  // launchRefused 报告 → 不动计数（neutral——无尝试发生）
  settleAdvisorRun(agent, mkEntry(`${ADVISOR_LAUNCH_REFUSAL_PREFIX} — no design token was minted.`))
  assert.equal(designReviewStreakRecord(agent, KEY).count, 5, "拒发报告不计（neutral）")

  // 可用判决复位：pass + D1 落盘成功 → reset（记录删除）
  const good = mktmp("sk-good-")
  _setSessionsDirForTest(good)
  try {
    const token = liveTok()
    const passAgent = {
      cwd: CWD, _slot: null, _sessionStart: "s", _mutLog: [], _engDesignTokens: new Map(),
      _advisorRound: 0, _calledAdvisorThisRun: false, config: { agent: {} },
    }
    settleAdvisorRun(passAgent, mkEntry(`All good.\n\n[DESIGN-TOKEN:${token}]`, {}, token))
    assert.ok(designReviewStreakRecord(passAgent, KEY) === null, "可用判决复位计数（判定句③）")

    // persist 失败分支：写盘不可达 → no_credential（不注册 / 不签发 / 可重评）
    const blocker = join(good, "blocker")
    writeFileSync(blocker, "x")
    _setSessionsDirForTest(join(blocker, "sessions"))
    const failAgent = {
      cwd: CWD, _slot: 1, _sessionStart: "s", _mutLog: [], _engDesignTokens: new Map(),
      _advisorRound: 0, _calledAdvisorThisRun: false, config: { agent: {} },
    }
    const token2 = liveTok()
    settleAdvisorRun(failAgent, mkEntry(`All good.\n\n[DESIGN-TOKEN:${token2}]`, {}, token2))
    const rec = designReviewStreakRecord(failAgent, KEY)
    assert.equal(rec?.count, 1, "persist 失败计入")
    assert.deepEqual(rec?.log, ["no_credential"], "分类 = no_credential（pass 但无可用凭证）")
    assert.equal(failAgent._engDesignTokens.size, 0, "槽回滚（无半结算态）")
  } finally {
    _resetSessionsDirForTest()
  }
})

// ─── T-SK10：空清单不适用（fail-open）───────────────────────────────────────

test("T-SK10 空清单：documents=[] / null → 键不适用——计数 no-op、停止恒 false（无载体写入）", () => {
  const agent = { cwd: CWD }
  for (const docs of [[], null]) {
    const key = docSetKey(docs, CWD)
    assert.equal(key, "[]", "空清单键 = \"[]\"")
    assert.equal(designReviewStreakApplies(key), false, "空清单键不适用")
    noteDesignReviewOutcome(agent, key, { reset: false, count: "timeout" })
    assert.equal(agent._designReviewStreaks, undefined, "无计数写入（no-op）")
    assert.equal(designReviewStreakStopped(agent, key), false, "停止恒 false")
    assert.equal(designReviewStreakRecord(agent, key), null, "无记录")
  }
  assert.equal(designReviewStreakStopped(agent, null), false, "null 键恒 false")
  assert.equal(designReviewStreakStopped(agent, undefined), false, "undefined 键恒 false")
  // 内防线面：空清单键走同一不适用判定（同纯函数；不建消息、不发起）
  assert.equal(designReviewStreakStopped(agent, docSetKey(null, CWD)), designReviewStreakStopped(agent, docSetKey([], CWD)), "两形态同判（均 false）")
})
