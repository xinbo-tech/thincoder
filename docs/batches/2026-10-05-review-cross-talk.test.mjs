/**
 * 2026-10-05-review-cross-talk.test.mjs — 评审 history 串台面批（#949）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-05-review-cross-talk.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析。）
 *
 * 腿（批档 §2.6——初态 = 实施前实读：P1 ∥ P2 ∥ S1 红；P1b ∥ P2b ∥ S2 绿）：
 *   P1（主红腿①）池上限 1 ∥ A（code）running ∥ Q（design）排队 → A 结算 → refill 启动 Q：
 *       Q 构建须回本评审实例（设计轨 system ∥ 零他场正文）                                    初红
 *   P2（主红腿②）本线程投递 → 表 A → 他场投递 → 表 B → 轮 2 构建：
 *       聚焦参考须取本线程表（TABLE-A-MARKER ∥ 零 TABLE-B-MARKER）                            初红
 *   P1b（①可行向）消费点按本评审实例定域 ⇒ 构建回设计轨（零他场正文）                         初绿
 *   P2b（②可行向）sinceIdx 前向取首表 = 本线程；无参倒扫 = 最新（纯函数语义保留）              初绿
 *   S1（结构单源）定域双点 ∥ 水印双点 ∥ 取件两处携 `_advisorResponseAnchor`                    初红（零命中）
 *   S2（回归）旧批件四档只读复跑（13 ∥ 8 ∥ 11 ∥ 8——零退化）                                 初绿
 *
 * 驱动面：全真实函数（resolveAdvisorLaunch / launchAsyncAdvisor / settleAdvisorRun /
 * injectAsyncResult / prepareAdvisorMessages）+ LLM 调用替身（registerHooks 把
 * `advisor/loop.mjs` 的 `../provider/core.mjs` 解析重定向为捕获替身——零网络）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { spawnSync } from "node:child_process"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从 thincoder 仓根运行（cwd = ${ROOT}）`)

const SCRATCH = mkdtempSync(join(tmpdir(), "cross-talk-batch-"))
const STUB = join(SCRATCH, "chat-stub.mjs")
writeFileSync(STUB, `// chat 替身：捕获待发 messages 快照；按脚本兑现（call#1 挂起等放行 / call#2 即答）。
export async function chat(provider, opts) {
  const h = globalThis.__crossTalkStub
  const snapshot = (opts?.messages ?? []).map((m) => ({ role: m.role, content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }))
  h.captures.push(snapshot)
  const plan = h.plans[h.captures.length - 1]
  if (!plan) throw new Error("cross-talk batch: no plan for chat call #" + h.captures.length)
  const text = await plan()
  opts?.onToken?.(text)
  return { content: text }
}
`, "utf8")

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "../provider/core.mjs" && context.parentURL && context.parentURL.endsWith("/advisor/loop.mjs")) {
      return { url: pathToFileURL(STUB).href, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const read = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const until = async (fn, ms = 8000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error("until timeout")
    await new Promise((r) => setTimeout(r, 5))
  }
}
/** 源档切片（结构腿）：取 [a, b) 区间；两锚须在场且有序（fail-closed）。 */
const seg = (src, a, b) => {
  const i = src.indexOf(a)
  const j = src.indexOf(b, i + a.length)
  assert.ok(i >= 0 && j > i, `源档锚在场：${a}`)
  return src.slice(i, j)
}

const REVIEW_A = "| # | Category | Severity | Issue | Suggestion |\n|---|---|---|---|---|\n| 1 | Correctness | 🟡 | A-REVIEW-MARKER stub finding of unrelated code review A | fix it |\n" + "A-filler ".repeat(30)
const REVIEW_Q = "Q-REVIEW-MARKER stub design review reply".padEnd(220, " q")
const PRIOR_A = "| # | Category | Severity | Issue | Suggestion |\n|---|---|---|---|---|\n| 1 | Correctness | 🟡 | PRIOR-A-MARKER round-1 issue under verification | fix |\n" + "P-prior filler ".repeat(20)
const TABLE_A = "| # | Action | Detail |\n|---|---|---|\n| 1 | Fixed | TABLE-A-MARKER — response to THIS review thread |"
const TABLE_B = "| # | Action | Detail |\n|---|---|---|\n| 1 | Fixed | TABLE-B-MARKER — response to the OTHER review's findings |"

/** P1 / P1b 共用构造：池上限 1 ∥ A（code）running（chat 挂起）∥ Q（design·docB）排队。 */
const setupPair = async (name) => {
  const caps = []
  let releaseA
  const aDeferred = new Promise((res) => { releaseA = res })
  globalThis.__crossTalkStub = { captures: caps, plans: [() => aDeferred, () => REVIEW_Q] }
  const tmp = join(SCRATCH, name)
  mkdirSync(tmp, { recursive: true })
  const docB = join(tmp, "docB.md")
  writeFileSync(docB, "# docB\n")
  const codePath = join(tmp, "x.mjs")
  writeFileSync(codePath, "export const x = 1\n")
  const aa = await mod("thincoder-core/agent-tools/advisor-async.mjs")
  const P = {
    cwd: tmp, history: [],
    provider: { name: "stub", model: "claude-sonnet-4-5" },
    config: { agent: { poolLimits: { advisor: 1 } } },
    _subAgentCounter: 0,
  }
  const ctx = {}
  const ra = aa.resolveAdvisorLaunch(P, "code")
  const ackA = aa.launchAsyncAdvisor(P, ctx, {
    reviewType: "code", documents: null, paths: [codePath], object: null,
    designToken: null, designId: null, run: ra.run,
  })
  assert.equal(ackA.ok, true, "A 起跑 ack")
  assert.equal(ackA.queued, undefined, "A 未排队")
  await until(() => caps.length === 1)
  const rq = aa.resolveAdvisorLaunch(P, "design", { documents: [docB] })
  const ackQ = aa.launchAsyncAdvisor(P, ctx, {
    reviewType: "design", documents: [docB], paths: null, object: null,
    designToken: "batch-token-123", designId: rq.designId, run: rq.run,
  })
  assert.equal(ackQ.ok, true, "Q ack")
  assert.equal(ackQ.queued, true, "池满 ⇒ 排队（未启动）")
  return { aa, P, caps, releaseA, ackQ, rq }
}

test("P1 ①（镜像串台）：排队评审实际启动时按会话镜像构建 ⇒ 借他场轮次/prior（应取本评审实例）", async () => {
  const { P, caps, releaseA, ackQ } = await setupPair("p1")
  // 放行 A：A 结算（会话镜像被写成 A 场值）→ refill 补位启动 Q → Q 的构建须读本评审实例
  releaseA(REVIEW_A)
  await until(() => caps.length === 2)
  const sysQ = caps[1].find((m) => m.role === "system")
  const usrQ = caps[1].find((m) => m.role === "user")
  console.log("[P1 evidence] Q system[0:120] =", String(sysQ?.content).slice(0, 120).replace(/\n/g, " "),
    "| Q carries A-REVIEW-MARKER =", String(usrQ?.content).includes("A-REVIEW-MARKER"))
  assert.ok(String(sysQ?.content).includes("You are an independent design reviewer for a design review inside an engineering-mode session."),
    "Q 的 system 应取设计轨提示词（本评审类型）")
  assert.ok(!String(sysQ?.content).includes("The prior review output above is the COMPLETE output of the last review"),
    "Q 不应取轮 2/3 收敛 system（他场轮次）")
  assert.ok(!String(usrQ?.content).includes("A-REVIEW-MARKER"), "Q 的构建不得载他场（code 场 A）评审正文")
  await until(() => P._asyncAdvisors.get(String(ackQ.id))?.done === true)
})

test("P2 ②（上轮表扫全文）：轮 2+ 聚焦参考取他场最新响应表（应取本评审线程窗口）", async () => {
  const tmp = join(SCRATCH, "p2")
  mkdirSync(tmp, { recursive: true })
  const xPath = join(tmp, "x.mjs")
  writeFileSync(xPath, "export const x = 1\n")
  const aa = await mod("thincoder-core/agent-tools/advisor-async.mjs")
  const { prepareAdvisorMessages } = await mod("thincoder-core/advisor.mjs")
  const P2 = { cwd: tmp, history: [], provider: { name: "stub", model: "claude-sonnet-4-5" }, config: {}, _subAgentCounter: 0 }
  // code 线程实例 + round-1 真实结算（prior 落定）
  const rr = aa.resolveAdvisorLaunch(P2, "code")
  aa.settleAdvisorRun(P2, {
    cancelled: false, run: rr.run, report: PRIOR_A, error: null,
    reviewType: "code", id: 1, documents: null, paths: null, launchSeq: -1,
  })
  // 真实投递（投递单点 injectAsyncResult——本评审取件下界水印在此落定）
  const { injectAsyncResult } = await mod("thincoder-core/agent-tools/subagent-async.mjs")
  await injectAsyncResult(P2, { role: "advisor", id: 1, run: rr.run, report: PRIOR_A, error: null, done: true, status: "done" })
  // 真实序：投递之后写下响应——本线程表 A → 他场投递 → 他场响应表 B（最新）
  P2.history.push(
    { role: "assistant", content: TABLE_A },
    { role: "user", content: "[System reminder: async advisor review #2 finished]\n" + TABLE_B },
    { role: "assistant", content: TABLE_B },
  )
  aa.resolveAdvisorLaunch(P2, "code") // 轮 2 构建（工具面同序：resolve → 构建）
  const msgs = prepareAdvisorMessages(P2, "code", null, null, [xPath], null, null, null)
  const usr = String(msgs.find((m) => m.role === "user")?.content ?? "")
  console.log("[P2 evidence] round2 carries own thread =", usr.includes("TABLE-A-MARKER"), "| other thread =", usr.includes("TABLE-B-MARKER"))
  assert.ok(usr.includes("TABLE-A-MARKER"), "轮 2 聚焦参考应取本线程响应表（TABLE-A-MARKER）")
  assert.ok(!usr.includes("TABLE-B-MARKER"), "不得取他场响应表（TABLE-B-MARKER）")
})

test("P1b ①-fix 可行向：消费点按本评审实例（run）定域 ⇒ 构建回到本评审（设计轨）", async () => {
  const { P, caps, releaseA, ackQ, rq } = await setupPair("p1b")
  const qEntry = P._asyncAdvisors.get(String(ackQ.id))
  // 模拟修复向：出队 + 消费点按本评审实例定域（run 键控）+ 手动启动
  P._asyncAdvisorQueue.splice(0, P._asyncAdvisorQueue.length)
  P._advisorRound = rq.run.priorOutput ? rq.run.round : 0
  P._lastAdvisorOutput = rq.run.priorOutput
  qEntry.start()
  await until(() => caps.length === 2)
  releaseA(REVIEW_A)
  const sysQ = caps[1].find((m) => m.role === "system")
  const usrQ = caps[1].find((m) => m.role === "user")
  assert.ok(String(sysQ?.content).includes("You are an independent design reviewer for a design review inside an engineering-mode session."),
    "按实例定域 ⇒ 设计轨 system（现缺陷的唯一致因 = 镜像值）")
  assert.ok(!String(usrQ?.content).includes("A-REVIEW-MARKER"), "零他场正文")
  assert.ok(String(usrQ?.content).includes("docB.md"), "本评审文档集在场")
  await until(() => qEntry.done === true)
})

test("P2b ②-fix 可行向：sinceIdx 前向扫描取本线程表（落点机制现态已具备——缺的只是水印投递）", async () => {
  const { extractAgentResponseTable } = await mod("thincoder-core/advisor/history.mjs")
  const h = [
    { role: "assistant", content: TABLE_A },
    { role: "user", content: "background" },
    { role: "assistant", content: TABLE_B },
  ]
  assert.equal(extractAgentResponseTable(h, 0), TABLE_A, "sinceIdx=0 前向取首表 = 本线程表")
  assert.equal(extractAgentResponseTable(h), TABLE_B, "无 sinceIdx 全文倒扫 = 最新表（纯函数语义保留）")
})

test("S1（结构单源）：定域双点 ∥ 投递水印双点 ∥ 取件两处携 `_advisorResponseAnchor`", () => {
  const rf = read("thincoder-core/agent-tools/review-facts.mjs")
  assert.ok(/export function scopeAdvisorMirror\s*\(agent, run\)/.test(rf), "scopeAdvisorMirror 导出（镜像三值 + 锚）")
  assert.ok(/export function noteReviewDelivered\s*\(agent, run\)/.test(rf), "noteReviewDelivered 导出（投递水印）")
  assert.ok(rf.includes("agent._advisorResponseAnchor = run.historyAnchorIdx ?? null"), "锚落点：实例键控 ?? null")
  assert.ok(rf.includes("run.historyAnchorIdx = Array.isArray(agent?.history) ? agent.history.length : 0"), "水印落点：投递刻下标")

  const aa = read("thincoder-core/agent-tools/advisor-async.mjs")
  assert.ok(seg(aa, "export function resolveAdvisorLaunch", "/** Guard round").includes("scopeAdvisorMirror(agent, run)"), "定域点①（resolveAdvisorLaunch）")
  assert.ok(seg(aa, "entry.start = () => {", "// ED-5（§6.21）入池键守卫").includes("scopeAdvisorMirror(parent, run)"), "定域点②（entry.start 消费点复核）")

  const sa = read("thincoder-core/agent-tools/subagent-async.mjs")
  assert.ok(seg(sa, "export async function injectAsyncResult", "writeTombstone(agent, entry.id").includes("noteReviewDelivered(agent, entry.run)"), "水印点①（injectAsyncResult）")
  const rrSrc = read("thincoder-core/agent/record-results.mjs")
  assert.ok(seg(rrSrc, "agent._advisorSyncCalls?.get(toolCall.id)", "// F16").includes("if (run) noteReviewDelivered(agent, run)"), "水印点②（record-results 记账块）")

  const anchorParam = "extractAgentResponseTable(agent.history, agent._advisorResponseAnchor ?? undefined)"
  assert.ok(read("thincoder-core/advisor.mjs").includes(anchorParam), "消费点①（buildAdvisorFollowUp）携锚")
  assert.ok(read("thincoder-core/advisor/messages.mjs").includes(anchorParam), "消费点②（legacy 收敛路径）携锚")
})

test("S2（回归）：旧批件四档只读复跑（13 ∥ 8 ∥ 11 ∥ 8——零退化）", () => {
  const legs = [
    ["docs/batches/2026-10-03-advisor-convergence.test.mjs", 13],
    ["docs/batches/2026-10-05-review-gate-gaps.test.mjs", 8],
    ["docs/batches/2026-10-04-issue-fix-round5.test.mjs", 11],
    ["docs/batches/2026-10-04-tool-path-baseline.test.mjs", 8],
  ]
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT // 父运行器注入 child-v8 ⇒ 嵌套 --test 会「递归跳过」假绿——清
  for (const [rel, expect] of legs) {
    const r = spawnSync(process.execPath, ["--test", rel], { cwd: ROOT, encoding: "utf8", timeout: 180000, env })
    const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`
    assert.equal(r.status, 0, `${rel} exit 0`)
    assert.ok(out.includes(`ℹ pass ${expect}`), `${rel} pass = ${expect}（零退化）`)
    assert.ok(!/ℹ fail [1-9]/.test(out), `${rel} 零红`)
  }
})
