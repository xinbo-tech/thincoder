/**
 * advisor-guard-completion.test.mjs — 第 18 批（VSC 守卫收尾）用例表 1:1 落地：
 * T-VG16–T-VG21（设计档 `docs/design/ADVISOR-CONVERGENCE.md` §14.9）+ AC-VG9–AC-VG12
 * 的机判面（§14.10）。断言判据全文 = §14.3 / §14.4 / §14.5 三条契约。
 * 零网络（T-VG16 = 直调启动拒绝面：承载桩 provider 不可路由——若发起即落失败报告，
 * 前缀断言本身即"零请求在发起之前"的证据）、零真实 LLM（T-VG20 seam = pending promise
 * ——不 settle、无定时器、零挂起句柄）、零长等待（其余全为纯函数 / 内存夹具）。
 * 本端自持编号（T-VG / AC-VG——续第 12 批同族档编号；同族档 427 行已满，独立成档
 * ——§14.7 D-VGC8）。
 * 面③（F26）三形态收敛信号：本档锁前两形态；第三形态（rv.round ≥ 2 无 prior 降级）由
 * 既有 T-VG7 的 `buildAdvisorUserMessage` 自愈锁覆盖（§14.5 交叉引用——不重复断言）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve, dirname } from "node:path"
import { randomUUID } from "node:crypto"

import { runAdvisorReview, ADVISOR_LAUNCH_REFUSAL_PREFIX } from "../src/advisor/run.mjs"
import { prepareAdvisorMessages } from "../src/advisor/main.mjs"
import { advisorTool } from "../src/agent-tools/advisor.mjs"
import { settleAdvisorReview, inflightDesignReviewConflict } from "../src/agent-tools/advisor-async.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"
import { fileOpsTool } from "../src/tools/ops.mjs"
import { mergeChildMutations } from "../src/agent-tools/subagent-async.mjs"
import files from "./files.mjs"

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

const tmpDirs = []
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })

/** 隔离临时工作区（路径解析 / 冻结拦截用；不动真实仓）。 */
function mkws() {
  const dir = mkdtempSync(join(tmpdir(), "vgc-"))
  tmpDirs.push(dir)
  return dir
}
const write = (root, rel, content) => {
  const p = join(root, ...rel.split("/"))
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content, "utf8")
  return p
}
const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
/** 源码读取（EOL 归一——源码 grep 判据不因 CRLF/LF 写法漂移）。 */
const readSrc = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\r\n/g, "\n")
/** win32 分隔符归一（`relative()` 在 Windows 返回反斜杠——断言不逐平台分叉）。 */
const norm = (s) => String(s).replace(/\\/g, "/")
const STUB_PROVIDER = { name: "stub", baseURL: "http://stub.invalid", apiKey: "k", model: "stub-model" }

// ─── A：面① 启动断言（F24 / AC-VG9）──────────────────────────────────────────

test("T-VG16 启动断言：design 无 token 直调 → 拒绝报告（逐字）+ 零请求 + 槽/prior 零写", async () => {
  const ws = mkws()
  write(ws, "docs/design/X.md", "# X\n\nreview target\n")
  const agent = { cwd: ws, history: [], config: {}, _provider: STUB_PROVIDER, _engDesignTokens: new Map() }
  const result = await runAdvisorReview(agent, "design", {}, null, ["docs/design/X.md"])
  assert.ok(result.startsWith("Advisor: design review launch refused"), "前缀逐字（稳定契约——结算面判据）")
  assert.equal(result.startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX), true, "前缀 = 导出常量同源")
  assert.ok(result.includes("no design token was minted"), "原因一 = 未铸码")
  assert.ok(
    result.includes("Nothing was sent") && result.includes("break the credential chain") &&
    result.includes("Re-run advisor(type='design') to mint a fresh token."),
    "余文逐字（§14.3——与 CLI 同文）",
  )
  assert.equal(agent._engDesignTokens.size, 0, "槽零写（无凭证产出）")
  assert.equal(agent._lastAdvisorOutput, undefined, "prior 零写（拒绝不耗轮次 / 不落 prior）")
  // AC-VG9 机判面：前缀定义 / 消费 grep 命中
  const runSrc = readSrc("../src/advisor/run.mjs")
  assert.ok(runSrc.includes('export const ADVISOR_LAUNCH_REFUSAL_PREFIX = "Advisor: design review launch refused"'), "前缀定义在位")
  assert.ok(runSrc.includes("the request does not carry the approval signal"), "第二拒绝原因在实现面（构建面补不上的防御分支）")
  assert.ok(readSrc("../src/agent-tools/advisor-async.mjs").includes("startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX)"), "异步结算消费点 grep 命中")
})

test("T-VG17 异步结算消费：启动拒绝报告不计评审覆盖（false 保持）；对照 design 报告照常置位", () => {
  const refusal = `${ADVISOR_LAUNCH_REFUSAL_PREFIX} — no design token was minted. Nothing was sent: a request that asks the reviewer to echo a token it cannot see would break the credential chain. Re-run advisor(type='design') to mint a fresh token.`
  const mk = (report) => {
    const history = {}
    const parent = { cwd: "C:/proj/vg", history, config: {}, _engDesignTokens: new Map(), _calledAdvisorThisRun: false, _advisorRuns: new Map() }
    const rid = "did-gc-17"
    // 实例记录载体 = history（advisorRunsMap 口径：history 优先双查询——跨 run 存活）
    history._advisorRuns = new Map([[rid, { reviewId: rid, reviewType: "design", round: 1, priorOutput: null, stale: false, state: "running", designId: rid }]])
    const entry = {
      id: 17, role: "advisor", status: "running", reviewType: "design", reviewId: rid, round: 1,
      designToken: liveTok(), designId: rid, cancelled: false, done: false,
      controller: new AbortController(), report,
    }
    return { parent, entry }
  }
  const refused = mk(refusal)
  settleAdvisorReview(refused.parent, refused.entry, refusal, null, null)
  assert.equal(refused.parent._calledAdvisorThisRun, false, "未发起 = 无评审产出——不得计为已覆盖（F24）")
  assert.ok(refused.entry.report.startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX), "拒绝报告可见（digest 原样——不静默吞）")
  assert.equal(refused.parent._engDesignTokens.size, 0, "槽零写")
  assert.equal(refused.parent.history._advisorRuns.get(refused.entry.reviewId).state, "settled", "实例照常结算（记账面零改——history 载体）")
  // 对照：普通 design 报告 → 照常置位（零回归）
  const clean = mk("Round 1 design review — no 🔴 issues found.")
  settleAdvisorReview(clean.parent, clean.entry, clean.entry.report, null, null)
  assert.equal(clean.parent._calledAdvisorThisRun, true, "普通 design 报告照常置位")
})

// ─── B：面② 冻结窗口（F25 / N16 / N17 / AC-VG10 / AC-VG11）───────────────────

test("T-VG18 冲突 helper：命中三形态（相对声明 / 绝对声明 / legacy 面）+ 负向族全 null", () => {
  const ws = mkws()
  const docRel = "docs/design/X.md"
  const docAbs = resolve(ws, "docs", "design", "X.md")
  const mk = (over = {}, withPool = true) => {
    const parent = { cwd: ws, history: {}, config: {}, _asyncAdvisors: new Map() }
    if (withPool) {
      parent._asyncAdvisors.set(7, { id: 7, role: "advisor", status: "running", reviewType: "design", documents: [docRel], cwd: ws, cancelled: false, done: false, ...over })
    }
    return parent
  }
  assert.deepEqual(inflightDesignReviewConflict(mk(), [docAbs]), { id: "7", path: docAbs }, "相对声明 × ABS 写入：命中 id + 路径")
  assert.deepEqual(inflightDesignReviewConflict(mk({ documents: [docAbs] }), [docAbs]), { id: "7", path: docAbs }, "绝对声明形态：同判")
  const legacy = mk({ documents: null })
  assert.ok(inflightDesignReviewConflict(legacy, [docAbs]), "legacy 面：.md 写入命中")
  assert.ok(inflightDesignReviewConflict(legacy, [resolve(ws, "docs", "notes.txt")]), "legacy 面：docs/ 路径命中")
  assert.equal(inflightDesignReviewConflict(legacy, [resolve(ws, "src", "a.mjs")]), null, "legacy 面：射程外（非 .md / 非 docs/）放行")
  // 负向族（N16 零误杀）：已结算 / 已取消 / code 评审 / 射程外 / 空池 / 空写入集
  assert.equal(inflightDesignReviewConflict(mk({ status: "done", done: true }), [docAbs]), null, "已结算不拦")
  assert.equal(inflightDesignReviewConflict(mk({ cancelled: true }), [docAbs]), null, "已取消不拦")
  assert.equal(inflightDesignReviewConflict(mk({ reviewType: "code" }), [docAbs]), null, "code 评审不拦")
  assert.equal(inflightDesignReviewConflict(mk({ documents: ["docs/design/OTHER.md"] }), [docAbs]), null, "射程外路径放行")
  assert.equal(inflightDesignReviewConflict(mk({}, false), [docAbs]), null, "空池放行")
  assert.equal(inflightDesignReviewConflict(mk(), []), null, "空写入集放行")
  // 同源判据：win32 反斜杠写入形态归一后同判（与 advisorStale 同一归一）
  const bsAbs = docAbs.replace(/\//g, "\\")
  assert.deepEqual(inflightDesignReviewConflict(mk(), [bsAbs]), { id: "7", path: bsAbs }, "反斜杠形归一后命中（原样回传）")
})

test("T-VG19 冻结拦截（executeToolBatches 集成）：射程内写在途被拒（零落地）；射程外写放行", async () => {
  const ws = mkws()
  const docRel = "docs/design/X.md"
  const otherRel = "docs/design/OTHER.md"
  const parent = { cwd: ws, history: {}, config: {}, _asyncAdvisors: new Map(), _touchedFiles: [] }
  parent._asyncAdvisors.set(7, { id: 7, role: "advisor", status: "running", reviewType: "design", documents: [docRel], cwd: ws, cancelled: false, done: false })
  const executed = []
  const writeTool = {
    name: "write",
    readonly: false,
    touchedPaths: (a) => [a.path],
    execute: async (args, ctx) => {
      const abs = resolve(ctx.cwd, args.path)
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, args.content ?? "", "utf8")
      executed.push(args.path)
      return `Wrote ${args.path}`
    },
  }
  const runWrite = async (path, content) => {
    const history = []
    await executeToolBatches(parent, {
      response: { toolCalls: [{ id: "t1", name: "write", arguments: JSON.stringify({ path, content }) }] },
      history, fullHistory: [], toolByName: new Map([["write", writeTool]]),
      getAuto: () => true, callbacks: {}, cwd: ws, recentSigs: [], depth: 0,
    })
    return String(history.find((m) => m.role === "tool")?.content ?? "")
  }
  const blocked = await runWrite(docRel, "mutated\n")
  assert.ok(blocked.includes("write refused — design review"), "拒绝文案锚一（§14.4(c) 逐字）")
  assert.ok(blocked.includes("(D5 freeze window)"), "拒绝文案锚二")
  assert.ok(blocked.includes("action:'cancel'") && blocked.includes("id:'7'"), "拒绝文案锚三（逃生门 + 评审 id）")
  assert.ok(norm(blocked).includes(`in flight over ${docRel}`), "冲突路径 = cwd 相对（relative 归一）")
  assert.equal(existsSync(resolve(ws, docRel)), false, "被拒写入零落地（读回断言）")
  assert.equal(executed.length, 0, "工具零执行（预闸在权限阶段 / autoApprove 之前）")
  // 对照：射程外写放行（成对）
  const allowed = await runWrite(otherRel, "ok\n")
  assert.ok(!allowed.includes("write refused"), "射程外写不拦")
  assert.equal(readFileSync(resolve(ws, otherRel), "utf8"), "ok\n", "对照写落地")
  assert.deepEqual(executed, [otherRel], "对照工具执行恰一次")
  // AC-VG10 机判面：实现锚 grep（单一预闸点内冻结分支）——§18 C-11（2026-09-12）：
  // preGateBlocked 已 verbatim 迁至 src/agent/tool-gates.mjs（execute-tools 500 硬限归位），
  // 源读路径随迁改指新档。
  const execSrc = readSrc("../src/agent/tool-gates.mjs")
  assert.ok(execSrc.includes("inflightDesignReviewConflict(agent, absPaths)"), "预闸调用点 grep 命中（两调用点共用同一 preGateBlocked）")
  assert.ok(execSrc.includes("write refused — design review") && execSrc.includes("D5 freeze window"), "拒绝文案锚实现面在位")
})

test("T-VG20 点火回执冻结句：design ack 含（逐字）；code ack 不含（不对称锁定）", async () => {
  const agent = { cwd: "C:/proj/vg", history: [], config: {}, _provider: STUB_PROVIDER, _advisorRuns: new Map() }
  // seam = pending promise（不 settle——零真实 LLM；pending promise 不持事件循环句柄）
  const ctx = { agent, depth: 0, callbacks: {}, runAdvisorReview: () => new Promise(() => {}) }
  const designAck = await advisorTool.execute({ type: "design", documents: ["docs/design/X.md"] }, ctx)
  const freeze = "；D5 冻结窗口：被审文档（含批次档）在报告送达前零写入——在途写入会被拒绝，写入将使本轮结算为陈旧 (pass 不发 token)"
  assert.ok(designAck.includes(freeze), "冻结句逐字（§14.4(d)——与 CLI 同文）")
  assert.ok(designAck.includes("review started in the background"), "回执本体零改（追加式）")
  const codeAck = await advisorTool.execute({ type: "code", paths: ["src/a.mjs"] }, ctx)
  assert.ok(!codeAck.includes("D5 冻结窗口"), "code ack 零冻结句（不对称）")
  assert.ok(codeAck.includes("review started in the background"), "code 回执零回归")
  // AC-VG11 实现锚：窗口起 / 止读 / 结算三锚 grep 对齐（§14.4(a) 定义句 ↔ 实现）
  const asyncSrc = readSrc("../src/agent-tools/advisor-async.mjs")
  for (const anchor of ["eventsAtLaunch", "advisorStale", "settleAdvisorReview"]) {
    assert.ok(asyncSrc.includes(anchor), `实现锚在位：${anchor}`)
  }
})

// ─── C：面③ 收敛路径信号（F26 / AC-VG12——现状锁定，零代码改动）──────────────

test("T-VG21 收敛路径信号锁定：两形态含信号 + 逐字 token + designId 各恰一次", () => {
  const token = liveTok()
  const prior = "Prior review output — verbatim prior table text."
  const userOf = (msgs) => msgs.find((m) => m.role === "user").content
  const rvUser = userOf(prepareAdvisorMessages(
    { cwd: "C:/proj/vg", history: [], config: {} }, "design", token, ["docs/design/X.md"], null, null,
    { round: 2, priorOutput: prior }, "did-gc-21a",
  ))
  const syncUser = userOf(prepareAdvisorMessages(
    { cwd: "C:/proj/vg", history: [], config: {}, _advisorRound: 1, _lastAdvisorOutput: prior },
    "design", token, ["docs/design/X.md"], null, null, null, "did-gc-21b",
  ))
  for (const [shape, user, did] of [["rv 实例 + prior（async 修正轮）", rvUser, "did-gc-21a"], ["sync 持久 prior", syncUser, "did-gc-21b"]]) {
    assert.equal(user.split("## Approval Signal").length - 1, 1, `${shape}：Approval Signal 恰一次`)
    assert.equal(user.split(`[DESIGN-TOKEN:${token}`).length - 1, 1, `${shape}：逐字 token 恰一次`)
    assert.equal(user.split(did).length - 1, 1, `${shape}：designId 恰一次`)
    assert.ok(user.includes(prior), `${shape}：prior 全文注入（收敛面零改）`)
  }
  // AC-VG12 登记面：新档入显式清单（test/files.mjs +1——不登记不跑）
  assert.ok(files.includes("test/advisor-guard-completion.test.mjs"), "新档登记在位")
  // 第三形态（rv.round ≥ 2 无 prior 降级）由既有 T-VG7 自愈锁覆盖（§14.5 交叉引用）——本档不重复断言。
})
// ═══ D：B2 结算面拒发不记账（F30 / AC-B2-1——群 B 批）════════════════════════

/** B2 夹具：桩 parent + 单实例 record（round / prior 结算前值可注入——advisorRunsMap 载体）。 */
function mkSettleFixture({ round = 0, prior = null, entryRound = 1, report }) {
  const history = {}
  const parent = { cwd: "C:/proj/vg", history, config: {}, _engDesignTokens: new Map(), _calledAdvisorThisRun: false }
  const rid = "did-rs"
  history._advisorRuns = new Map([[rid, { reviewId: rid, reviewType: "design", round, priorOutput: prior, stale: false, state: "running", designId: rid }]])
  const entry = {
    id: 41, role: "advisor", status: "running", reviewType: "design", reviewId: rid, round: entryRound,
    designToken: liveTok(), designId: rid, cancelled: false, done: false,
    controller: new AbortController(), report,
  }
  return { parent, entry, record: () => history._advisorRuns.get(rid) }
}
const REFUSAL_REPORT = `${ADVISOR_LAUNCH_REFUSAL_PREFIX} — no design token was minted. Nothing was sent: a request that asks the reviewer to echo a token it cannot see would break the credential chain. Re-run advisor(type='design') to mint a fresh token.`

test("T-RS1 正常：启动拒绝结算零记账——record.round 0→1 残留闭合 + prior 零污染 + state settled + 覆盖标记保持 false", () => {
  const f = mkSettleFixture({ round: 0, prior: null, entryRound: 1, report: REFUSAL_REPORT })
  settleAdvisorReview(f.parent, f.entry, REFUSAL_REPORT, null, null)
  const rec = f.record()
  assert.equal(rec.round, 0, "拒绝 = 未发起 = 无 attempt——round 不推进（旧 0→1 残留）")
  assert.equal(rec.priorOutput, null, "prior 零写（拒绝文不冒充「前轮评审输出」）")
  assert.equal(rec.state, "settled", "state 照归 settled（同 scope 重发通道保住）")
  assert.equal(f.parent._calledAdvisorThisRun, false, "未发起 = 无评审产出（既有语义零变）")
  assert.ok(f.entry.report.startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX), "拒绝文原样进 digest（报告分支形态零改——模型可见重发指引）")
})

test("T-RS2 边界：续跑实例拒绝结算 round/prior 逐值不变；对照普通 design 报告照常推进（零回归）", () => {
  const cont = mkSettleFixture({ round: 3, prior: "PRIOR", entryRound: 4, report: REFUSAL_REPORT })
  settleAdvisorReview(cont.parent, cont.entry, REFUSAL_REPORT, null, null)
  assert.equal(cont.record().round, 3, "续跑实例：拒绝不耗轮次（重跑得「round = 未耗值 + 1」）")
  assert.equal(cont.record().priorOutput, "PRIOR", "prior 逐值不变（续跑者读到的仍是真前轮输出）")
  assert.equal(cont.record().state, "settled", "可续跑")
  // 对照：普通 design 报告（表格形态 → looksLikeReview）照常推进 + prior 更新（零回归）
  const longReport = "Round 4 design review — no 🔴 issues found.\n| # | Category | Severity |\n|---|---|---|"
  const normal = mkSettleFixture({ round: 3, prior: "PRIOR", entryRound: 4, report: longReport })
  settleAdvisorReview(normal.parent, normal.entry, longReport, null, null)
  assert.equal(normal.record().round, 4, "对照：round 3 → 4（既有推进语义零改）")
  assert.equal(normal.record().priorOutput, longReport, "对照：prior 照常写入")
  assert.equal(normal.record().state, "settled")
})

// ═══ E：B3 冻结窗口盲区收口（F31 / AC-B3-1——群 B 批）════════════════════════

/** file_ops 批执行驱动（**真工具**——move/copy/rename 三动作经 executeToolBatches 全链：
 *  预闸冻结拦截 → 工具执行 → 记账分支）。零网络零子进程。 */
async function runFileOps(parent, args) {
  const history = []
  await executeToolBatches(parent, {
    response: { toolCalls: [{ id: "t1", name: "file_ops", arguments: JSON.stringify(args) }] },
    history, fullHistory: [], toolByName: new Map([["file_ops", fileOpsTool]]),
    getAuto: () => true, callbacks: {}, cwd: parent.cwd, recentSigs: [], depth: 0,
  })
  return String(history.find((m) => m.role === "tool")?.content ?? "")
}

test("T-FZ1 错误：在途设计评审 × file_ops（move / copy 目标 = 被审档）→ 冻结拦截零落地；射程外放行（成对）", async () => {
  const ws = mkws()
  write(ws, "docs/design/X.md", "reviewed content\n")
  write(ws, "docs/design/OTHER.md", "other content\n")
  const parent = { cwd: ws, history: {}, config: {}, _asyncAdvisors: new Map(), _touchedFiles: [] }
  parent._asyncAdvisors.set(7, { id: 7, role: "advisor", status: "running", reviewType: "design", documents: ["docs/design/X.md"], cwd: ws, cancelled: false, done: false })

  const moved = await runFileOps(parent, { action: "move", source: "docs/design/OTHER.md", dest: "docs/design/X.md" })
  assert.ok(moved.includes("write refused — design review"), "拒绝文案锚一（§14.4(c) 逐字复用）")
  assert.ok(moved.includes("(D5 freeze window)") && moved.includes("id:'7'"), "拒绝文案锚二/三（冻结窗口 + 逃生门）")
  assert.equal(readFileSync(resolve(ws, "docs/design/X.md"), "utf8"), "reviewed content\n", "被审档零变动（读回断言）")
  assert.equal(readFileSync(resolve(ws, "docs/design/OTHER.md"), "utf8"), "other content\n", "源零变动（预闸在工具执行前）")
  assert.deepEqual(parent._touchedFiles, [], "拦截路径零记账")

  const copied = await runFileOps(parent, { action: "copy", source: "docs/design/OTHER.md", dest: "docs/design/X.md" })
  assert.ok(copied.includes("write refused — design review"), "copy 目标命中同样被拦（copy 仅目标入 l3TouchedPaths）")

  const ok = await runFileOps(parent, { action: "move", source: "docs/design/OTHER.md", dest: "docs/design/OTHER2.md" })
  assert.ok(!ok.includes("write refused"), "射程外 file_ops 放行（成对）")
  assert.equal(readFileSync(resolve(ws, "docs/design/OTHER2.md"), "utf8"), "other content\n", "对照落地")
  assert.equal(existsSync(resolve(ws, "docs/design/OTHER.md")), false, "对照 move 真执行")
})

test("T-FZ2 正常：成功 file_ops 记账——move 记源+目标、copy 仅目标（_fileMutEvents 与 _touchedFiles 同点）", async () => {
  const ws = mkws()
  write(ws, "a.txt", "A")
  write(ws, "b.txt", "B")
  const parent = { cwd: ws, history: {}, config: {}, _touchedFiles: [] }

  await runFileOps(parent, { action: "move", source: "a.txt", dest: "a-moved.txt" })
  await runFileOps(parent, { action: "copy", source: "b.txt", dest: "b-copy.txt" })

  const events = parent.history._fileMutEvents ?? []
  assert.deepEqual(events, [resolve(ws, "a.txt"), resolve(ws, "a-moved.txt"), resolve(ws, "b-copy.txt")],
    "move 记源+目标；copy 仅目标（copy 源不入记账）")
  assert.deepEqual(parent._touchedFiles, events, "同点同步记 _touchedFiles（契约 2——子代理合入载体）")
  // 去重守卫：重复同目标拷贝不重复记账
  await runFileOps(parent, { action: "copy", source: "b.txt", dest: "b-copy.txt" })
  assert.equal(parent._touchedFiles.length, 3, "includes 去重守卫（同路径不重复入列）")
})

test("T-FZ4 正常：子代 file_ops 成功 → 子代 _touchedFiles 含源+目标；mergeChildMutations 合入父侧 + 变更事件", async () => {
  const ws = mkws()
  write(ws, "src-child.txt", "C")
  const child = { cwd: ws, history: {}, config: {}, _touchedFiles: [] }
  await runFileOps(child, { action: "move", source: "src-child.txt", dest: "dst-child.txt" })
  assert.deepEqual(child._touchedFiles, [resolve(ws, "src-child.txt"), resolve(ws, "dst-child.txt")],
    "子代 _touchedFiles 含源 + 目标（契约 2 同点——子代理合入载体）")

  const parent = { cwd: ws, history: {}, config: {}, _touchedFiles: [], _calledAdvisorThisRun: false, _verifiedThisRun: false }
  mergeChildMutations(parent, { touchedFiles: child._touchedFiles })
  assert.deepEqual(parent._touchedFiles, [resolve(ws, "src-child.txt"), resolve(ws, "dst-child.txt")],
    "合入后父侧 _touchedFiles 同含（合入即合账）")
  assert.deepEqual(parent.history._fileMutEvents, [resolve(ws, "src-child.txt"), resolve(ws, "dst-child.txt")],
    "history._fileMutEvents 含二者（#7 判面判据——在途设计评审的 stale 判定覆盖）")
})



