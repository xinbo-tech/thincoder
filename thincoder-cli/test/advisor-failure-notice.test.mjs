/**
 * advisor-failure-notice.test.mjs — 失败结算结论（F28 / F29 / F31）＋结算判据名纯函数。
 * 承第 33 批失败护栏用例（`design-review-streak-guard.test.mjs`）**改名 + 全量重写**：计数载体 /
 * 停止谓词 / 两级检查点已撤——结论块取代计数封禁（零载体 / 零封禁，批档 §2.2 / §2.10）。
 * 判据全文 = `docs/core/design/ADVISOR-GUARDS.md` §7（契约一 / 契约二 / 判据名表）+ §2.5。
 * 用例表 T-AF3 / T-AF8 / T-AF10 / T-AF12 / T-AF16。零网络、零真实 LLM、零长等待。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import {
  settlementCriterion, criterionMeaning, buildSettlementConclusion, identityLine, scopeSummary,
} from "@thincoder/core/advisor/notice.mjs"
import { advisorTool } from "@thincoder/core/agent-tools/advisor.mjs"
import { settleAdvisorRun, normAbs as normAbsViaSettle } from "@thincoder/core/agent-tools/advisor-settle.mjs"
import { timeoutTail } from "@thincoder/core/advisor/compaction.mjs"
import { normAbs, docSetKey } from "@thincoder/core/agent-tools/review-facts.mjs"
import { ADVISOR_LAUNCH_REFUSAL_PREFIX } from "@thincoder/core/advisor/run.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "@thincoder/core/session-slots.mjs"

const tmpDirs = []
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })
const mktmp = (prefix) => { const d = mkdtempSync(join(tmpdir(), prefix)); tmpDirs.push(d); return d }

const CWD = "C:/proj/af"
const X_ABS = join(CWD, "docs", "design", "X.md")
const DOCS = ["docs/design/X.md", "docs/requirements/X.md"]
const KEY = docSetKey(DOCS, CWD)
const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i
const TAILS = {
  context_limit: "Advisor: context window limit reached (123456 tokens). Review incomplete — too many tool calls. Try a narrower scope.",
  turn_cap: "Advisor: stopped after 100 tool rounds — the review appears to be looping. You may retry with a narrower scope.",
  timeout: timeoutTail(600_000, 3, 12, true), // 生产逐字（结构化超时尾——compaction.mjs 单源）
  empty: "Advisor: empty response — review was inconclusive",
  review_failed: "Advisor: review failed (timeout) — The model took too long. Try with a narrower scope.",
  interrupted: "Advisor: interrupted.",
}
const mkAgent = (over = {}) => ({
  cwd: CWD, _mutLog: [], _engDesignTokens: new Map(), _advisorRound: 0, _calledAdvisorThisRun: false, config: { agent: {} }, ...over,
})
const mkEntry = (over = {}) => ({
  id: 1, cancelled: false, reviewType: "design", docAbs: [], launchSeq: -1, designToken: null,
  run: { reviewType: "design", designId: "did-1", round: 0, priorOutput: null, open: true, docSetKey: KEY, approvedSuffix: null },
  report: null, ...over,
})
/** 结论块/判据名文案的凭证卫生：UUID 形扫描零命中。 */
const assertNoCredential = (text, label) => assert.equal(UUID_RE.test(String(text)), false, `${label}：零凭证值`)

// ─── 契约一：结算判据名（纯函数 · 零状态 · 零 LLM 解析）────────────────────────

test("T-AF3a 结算判据名：七行优先级逐条锁定；可用判决 / 中断 / 拒发 ⇒ null（零结论块）", () => {
  assert.equal(settlementCriterion({}), null, "#7 pass 且落盘成功 → null")
  assert.equal(settlementCriterion({ incomplete: null }), null, "#7 changes-required（无尾）→ null")
  for (const kind of ["context_limit", "turn_cap", "timeout", "empty", "review_failed"]) {
    assert.equal(settlementCriterion({ incomplete: kind }), kind, `#4 五 kind 逐一：${kind}`)
  }
  assert.equal(settlementCriterion({ incomplete: "interrupted" }), null, "#5 中断 → null")
  assert.equal(settlementCriterion({ stale: true }), "stale", "#2 陈旧 → stale")
  assert.equal(settlementCriterion({ persistFailed: true }), "no_credential", "#6 落盘失败 → no_credential")
  assert.equal(settlementCriterion({ launchRefused: true }), null, "#1 未发起请求 → null")
  assert.equal(settlementCriterion({ hasResult: false }), "no_report", "#3 无报告 → no_report")
  // 优先级（#1 > #2 > #3 > #4 > #5 > #6 > #7）
  assert.equal(settlementCriterion({ launchRefused: true, stale: true, incomplete: "timeout" }), null, "#1 拒发压过 stale / 尾")
  assert.equal(settlementCriterion({ stale: true, incomplete: "timeout" }), "stale", "#2 stale 压过尾")
  assert.equal(settlementCriterion({ hasResult: false, incomplete: "timeout", persistFailed: true }), "no_report", "#3 无报告压过尾 / 落盘")
  assert.equal(settlementCriterion({ incomplete: "timeout", persistFailed: true }), "timeout", "#4 尾压过落盘失败")
  assert.equal(settlementCriterion({ incomplete: "interrupted", persistFailed: true }), null, "#5 中断压过落盘失败")
  // 判据名 → 人读说明（八值逐字——§7 表第三列）
  assert.equal(criterionMeaning("timeout"), "review exceeded the wall-clock budget (agent.advisor.timeoutMs)")
  assert.equal(criterionMeaning("context_limit"), "review exceeded the model context budget")
  assert.equal(criterionMeaning("turn_cap"), "review exceeded the tool-round limit")
  assert.equal(criterionMeaning("empty"), "the provider returned an empty response")
  assert.equal(criterionMeaning("review_failed"), "provider / transport error")
  assert.equal(criterionMeaning("stale"), "the reviewed target changed while the review was in flight")
  assert.equal(criterionMeaning("no_credential"), "the token could not be written to the session ledger")
  assert.equal(criterionMeaning("no_report"), "the review settled without a report")
})

// ─── 契约二：结论块（逐字模板——两轨共用）────────────────────────────────────

test("T-AF3 设计轨结论块：块首行四字段 + criterion=timeout + 含义 + 尝试表 + 选项三值；既有正文逐字", () => {
  const agent = mkAgent()
  const token = liveTok()
  const entry = mkEntry({
    designToken: token, documents: DOCS,
    report: `Findings text.\n\n[DESIGN-TOKEN:${token}]\n\n${TAILS.timeout}`,
  })
  const settled = settleAdvisorRun(agent, entry)
  const [head] = settled.report.split("\n")
  assert.match(head, /^Advisor: review failure — 本轮未产出可用结论 \(no usable settlement\) \[type=design · scope=docs\/design\/X\.md \+1 more · round=1\/uncapped · criterion=timeout\]$/, "块首行 = 对象标识行（四字段）")
  assert.ok(settled.report.includes("评审未完成——token 未签发"), "既有正文（未签发提示）逐字下沉为块体")
  assert.ok(settled.report.includes("reason: timeout"), "未签发提示载原因")
  assert.ok(settled.report.includes("Failed attempts in this review instance (most recent last):"), "尝试表头")
  assert.ok(settled.report.includes("| 1 | timeout | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |"), "尝试表逐字（单行——本次尝试）")
  assert.ok(settled.report.includes("Options: 1. proceed as-is (no usable conclusion — design: no token, implementation stays gated; code: the code face stays unapproved)"), "选项 ①")
  assert.ok(settled.report.includes("2. narrow or change the scope and re-run") && settled.report.includes("3. stop and report to the user"), "选项 ② / ③")
  assertNoCredential(settled.report, "T-AF3")
  assert.equal(agent._designReviewStreaks, undefined, "零会话级计数载体（F28③）")
  assert.equal(agent._calledAdvisorThisRun, true, "设计评审保持计入（无代码面——§6 parity 零改）")
})

test("T-AF16 代码轨结论块 + round 语义：块首 round=N ∧ 尝试表 #=N（同值）；既有正文逐字", () => {
  const agent = mkAgent()
  const entry = mkEntry({
    reviewType: "code", paths: ["src/x.mjs"], documents: null,
    run: { reviewType: "code", designId: null, round: 2, priorOutput: null, open: true, docSetKey: null },
    report: `Round 1 review text.\n\n${TAILS.timeout}`,
  })
  const settled = settleAdvisorRun(agent, entry)
  assert.equal(entry.run.round, 3, "结算后轮次 = 本次已结算尝试号")
  const [head] = settled.report.split("\n")
  assert.match(head, /\[type=code · scope=src\/x\.mjs · round=3\/uncapped · criterion=timeout\]/, "块首行 type = 实际评审轨 + 结算尝试号")
  const n = head.match(/round=(\d+)\/uncapped/)[1]
  assert.ok(settled.report.includes(`| ${n} | timeout |`), "尝试表 # 与块首 round 同值")
  assert.ok(settled.report.includes("Round 1 review text."), "既有正文逐字（块体）")
  assert.equal(agent._calledAdvisorThisRun, false, "截断代码评审不得计为已覆盖（守卫语义零改）")
  assertNoCredential(settled.report, "T-AF16")
})

test("T-AF8 无结论面零噪声：可用判决 / interrupted / 启动拒绝 / 代码轨干净结果 ⇒ 报告零追加", () => {
  const agent = mkAgent()
  const cases = [
    ["design changes-required", mkEntry({ report: "Design review found issues — changes required." })],
    ["design interrupted", mkEntry({ report: `Timeline.\n\n${TAILS.interrupted}` })],
    ["启动拒绝（无尝试发生）", mkEntry({ report: `${ADVISOR_LAUNCH_REFUSAL_PREFIX} — no design token was minted.` })],
    ["code clean", mkEntry({ reviewType: "code", report: "Code review — all clear.", run: { reviewType: "code", round: 0, priorOutput: null, open: true, docSetKey: null } })],
    ["code interrupted", mkEntry({ reviewType: "code", report: `Timeline.\n\n${TAILS.interrupted}`, run: { reviewType: "code", round: 0, priorOutput: null, open: true, docSetKey: null } })],
  ]
  for (const [label, entry] of cases) {
    const before = entry.report
    const settled = settleAdvisorRun(agent, entry)
    assert.equal(settled.report, before, `${label}：报告逐字零追加（判据名 null ⇒ 无结论块）`)
    assert.equal(String(settled.report).includes("no usable settlement"), false, `${label}：无结论块`)
  }
  assert.equal(agent._designReviewStreaks, undefined, "零计数载体")
})

test("T-AF12 陈旧 / 落盘失败分支结论：criterion=stale / no_credential + 既有前缀逐字 + 零凭证值", () => {
  // ① 陈旧结算（两轨可判——本档取设计轨：token 未签发前缀 + 结论块）
  const token = liveTok()
  const staleAgent = mkAgent({ _mutLog: [{ seq: 1, paths: [X_ABS] }] })
  const stale = settleAdvisorRun(staleAgent, mkEntry({
    docAbs: [X_ABS], launchSeq: 0, designToken: token, documents: DOCS,
    report: `Findings.\n\n[DESIGN-TOKEN:${token}]\n\nbody text`,
  }))
  assert.ok(stale.report.includes("评审目标已变更——token 未签发"), "陈旧前缀逐字在位")
  assert.ok(stale.report.split("\n")[0].includes("criterion=stale"), "结论块首行 criterion=stale")
  assert.ok(stale.report.includes("| 1 | stale | the reviewed target changed while the review was in flight |"), "尝试表行逐字")
  assertNoCredential(stale.report, "T-AF12 stale")
  assert.equal(staleAgent._engDesignTokens.size, 0, "陈旧不签发")
  // ② pass 但槽落盘失败（no_credential——设计专属面）
  const good = mktmp("af-sess-")
  _setSessionsDirForTest(good)
  try {
    writeFileSync(join(good, "blocker"), "x")
    _setSessionsDirForTest(join(good, "blocker", "sessions"))
    const token2 = liveTok()
    const failAgent = mkAgent({ _slot: 1, _sessionStart: "s" })
    const settled = settleAdvisorRun(failAgent, mkEntry({
      designToken: token2, documents: DOCS, report: `All good.\n\n[DESIGN-TOKEN:${token2}]`,
    }))
    assert.ok(settled.report.includes("D1: the design review passed but the token could NOT be durably written"), "既有 D1 正文逐字")
    assert.ok(settled.report.split("\n")[0].includes("criterion=no_credential"), "结论块首行 criterion=no_credential")
    assert.equal(failAgent._engDesignTokens.size, 0, "槽回滚（无半结算态）")
    assertNoCredential(settled.report, "T-AF12 no_credential")
  } finally {
    _resetSessionsDirForTest()
  }
})

test("T-AF10 范围拒回载标识（F31）：三类逐条——既有稳定前缀逐字 + 标识块四项", async () => {
  const cwd = mktmp("af-scope-")
  const mkCallAgent = (over = {}) => ({
    cwd, history: [], config: {}, provider: {}, _touchedFiles: [], _engDesignTokens: new Map(),
    _advisorRuns: new Map(), _asyncAdvisors: new Map(), _asyncSubagents: new Map(), ...over,
  })
  // ① 范围缺失（code 无 paths / documents）
  const a1 = mkCallAgent()
  const r1 = String(await advisorTool.execute({ type: "code" }, { agent: a1, cwd, depth: 0, _toolCallId: "af10-1" }))
  assert.ok(r1.startsWith("Advisor: no review scope specified"), "既有稳定前缀逐字（行首）")
  assert.ok(r1.includes("[type=code · scope=none · round=— · criterion=scope-missing]"), "标识块四项（范围缺失）")
  // ② 范围非法（design documents 非文档）
  const a2 = mkCallAgent()
  const r2 = String(await advisorTool.execute({ type: "design", documents: ["x.mjs"] }, { agent: a2, cwd, depth: 0, _toolCallId: "af10-2" }))
  assert.ok(r2.startsWith("Advisor: design review documents must be documentation files"), "既有稳定前缀逐字（行首）")
  assert.ok(r2.includes("[type=design · scope=x.mjs · round=— · criterion=scope-not-doc]"), "标识块四项（范围非法）")
  // ③ 同 scope 在跑（池内同文档集 running 条目）
  const docs = ["docs/design/X.md", "docs/requirements/X.md"]
  const a3 = mkCallAgent({ _asyncAdvisors: new Map([["e1", {
    id: "e1", reviewType: "design", status: "running", done: false, cancelled: false,
    run: { reviewType: "design", docSetKey: docSetKey(docs, cwd), round: 0 },
  }]]) })
  const r3 = String(await advisorTool.execute({ type: "design", documents: docs }, { agent: a3, cwd, depth: 0, _toolCallId: "af10-3" }))
  assert.ok(r3.startsWith("Advisor: 此 scope 已有评审在跑"), "既有稳定前缀逐字（行首）")
  assert.ok(r3.includes("[type=design · scope=docs/design/X.md +1 more · round=1/uncapped · criterion=scope-in-flight]"), "标识块四项（同 scope 在跑——round = 本次发起将使用的轮次号）")
  // 三类共同：首行 = 既有前缀 + 标识行（AC-3 判据形态）
  for (const [label, r] of [["范围缺失", r1], ["范围非法", r2], ["同 scope", r3]]) {
    assert.match(r.split("\n")[0], /\[type=(code|design|absent|invalid) · scope=.* · round=(\d+\/uncapped|—) · criterion=[a-z_-]+\]/, `${label}：首行 = 既有前缀 + 标识行`)
  }
})

test("T-AF12b 凭证卫生与单源构件：结论块逐字 = 构建器输出；scope / round 字段面闭合", () => {
  assert.equal(identityLine({ type: "code", scope: "a.md", round: "3/uncapped", criterion: "timeout" }), "[type=code · scope=a.md · round=3/uncapped · criterion=timeout]")
  assert.equal(scopeSummary(["a.md"]), "a.md", "单路径")
  assert.equal(scopeSummary(["a.md", "b.md", "c.md"]), "a.md +2 more", "首路径 + N more")
  assert.equal(scopeSummary([]), "none", "空 ⇒ none")
  assert.equal(scopeSummary(null), "none", "缺 ⇒ none")
  const built = buildSettlementConclusion({ type: "design", scope: "d/a.md", round: 7, criterion: "empty", body: "body text" })
  assert.ok(built.startsWith("Advisor: review failure — 本轮未产出可用结论 (no usable settlement) [type=design · scope=d/a.md · round=7/uncapped · criterion=empty]"), "构建器块首行逐字")
  assert.ok(built.includes("| 7 | empty | the provider returned an empty response |"), "尝试表行（单值 round）")
  assertNoCredential(built, "builder")
  // 归一 / 范围键单源（事实面档——改名后零回归：既有 normAbs re-export 面不变）
  assert.equal(normAbsViaSettle, normAbs, "advisor-settle re-export（既有 import 面零变）")
  assert.equal(docSetKey(["./docs/design/X.md", "docs/requirements/X.md"], CWD), KEY, "范围键归一（./ 前缀）")
})
