/**
 * digest-empty-round.test.mjs — 集成用例档：RTM 故事 18「一条后台报告只投递一次，未签收时才升级」
 * （`test/RTM.md` 行 18-1；机制权威 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.5 / §6.31.11
 * A-DA3 · A-DA9；需求回指 = `docs/core/requirements/AGENT-LOOP.md` §4.15 F-DA3）。
 *
 * 业务可观察结果：一条后台报告在会话里出现一次之后**不再被注入**；连续几个空消化轮里它既不丢也不提醒；
 * 到上限才升级——升级那一刻正文再出现一次（终局披露）+ 一条 UNSETTLED 提醒，此后零自动投递。
 * 修前：空回合被记成「读了却没签收」⇒ 每个空回合再推一遍（正文 3 次）、第 3 轮即升级。
 *
 * 驱动 = 真会话链路（`createAgent` + `runAgent`，一次 `runAgent` = CLI 里一个消化轮）；模型侧 = 本机假
 * OpenAI SSE 端点（先例 `test/integration/empty-response-retry.test.mjs:96-110`）——零外网、零 `fetch` 全局桩。
 * 空回合的现实形 = 恒空提供端（`thincoder-core/agent/completion.mjs:51-61`：空响应重试两次后抛
 * `LLM returned empty response` ⇒ 该 run 零非空正文 ⇒ `output == null`）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createAgent, runAgent } from "../../thincoder-core/agent.mjs"
import { unsettledCount } from "../../thincoder-core/agent/digest-account.mjs"
import { _resetLogsDirForTest, _setLogsDirForTest } from "../../thincoder-core/log.mjs"

// ---------- 夹具 ----------

const cwd = mkdtempSync(join(tmpdir(), "digest-deliver-once-int-"))
const logsDir = mkdtempSync(join(tmpdir(), "digest-deliver-once-int-logs-"))
_setLogsDirForTest(logsDir)
after(() => {
  _resetLogsDirForTest()
  rmSync(cwd, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(logsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 报告正文的可检索标记（断言「正文在会话流里出现几次」= 投递了几次）。 */
const MARK = "background-report-marker-9c1e"

/** 空响应（零正文、零工具调用）⇒ `completion.mjs` 的空响应重试支；连三次即抛。 */
const EMPTY = {}

const sseChunks = (reply) => [
  { choices: [{ delta: { content: reply.content ?? "" }, finish_reason: null }] },
  { choices: [{ delta: {}, finish_reason: "stop" }] },
]

/** 假 OpenAI SSE 端点：每次请求的回复由 `replyFor(state)` 实时决定（不按请求序数猜——轮数会随重试漂移）。 */
const providerStub = (state) => {
  const requests = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => { raw += chunk })
    req.on("end", () => {
      requests.push(raw)
      const reply = state.content === null ? EMPTY : { content: state.content }
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" })
      for (const chunk of sseChunks(reply)) res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  return new Promise((done) => {
    server.listen(0, "127.0.0.1", () => done({
      port: server.address().port,
      requests,
      close: () => new Promise((finish) => { server.closeAllConnections?.(); server.close(() => finish()) }),
    }))
  })
}

/** 会话夹具：真 `createAgent` + 本机假端点；`_daSession` 置真（会话态——投递账生效）。 */
async function session(t) {
  const agent = createAgent({
    provider: null,
    tools: [],
    config: { agent: { maxTurns: 10 }, traces: { enabled: false } },
    cwd,
    history: [],
  })
  const state = { content: null } // null = 恒空提供端（空回合）；置串 = 恢复出正文
  const stub = await providerStub(state)
  t.after(() => stub.close())
  agent.provider = { model: "deepseek-flash", baseURL: `http://127.0.0.1:${stub.port}`, apiKey: "sk-test" }
  // 一条已 settle、尚未投递的后台报告（首投由第 1 个系统轮自然发生）
  const entry = { id: 26, role: "subagent", report: `${MARK} body`, done: true, status: "done" }
  agent._pendingAsyncResults = [entry]
  agent._daSession = true
  return { agent, stub, entry, state }
}

/** 报告正文在会话流里的出现次数 = 投递次数（首投 + 终局披露）。 */
const injections = (agent) => agent.history.filter(
  (m) => typeof m.content === "string" && m.content.includes(MARK),
).length

/** UNSETTLED 提醒条数（升级提醒句锚）。 */
const reminders = (agent) => agent.history.filter(
  (m) => typeof m.content === "string" && m.content.includes("marked UNSETTLED"),
).length

/** 一个消化轮（`autoTurn` 系统轮）。空提供端 ⇒ 该轮抛 `LLM returned empty response`，调用面 catch 后继续。 */
async function digestRound(agent) {
  return runAgent(agent, "", {}, { autoTurn: true }).then((v) => ({ ok: true, v }), (e) => ({ ok: false, e }))
}

// ---------- 故事 18 行 18-1 ----------

test("18-1 一条后台报告只投递一次：连空 3 个消化轮不丢不提醒，第 4 轮升级才终局披露，此后零投递", { timeout: 120_000 }, async (t) => {
  // 前 4 轮 = 恒空提供端（该轮抛错）；第 5 轮起提供端恢复出正文
  const { agent, entry, state } = await session(t)

  // —— 第 1 轮：首投 ——
  const r1 = await digestRound(agent)
  assert.equal(r1.ok, false, "空提供端 ⇒ 该轮抛错（现实形 = 恒空提供端）")
  assert.match(r1.e.message, /LLM returned empty response/, `抛的是空响应错误，实读：${r1.e?.message}`)
  assert.equal(entry._daDelivered, true, "第 1 个系统轮完成首投")
  assert.equal(injections(agent), 1, "首投恰一次——正文在会话流里出现 1 次")
  assert.equal(entry._daMissRounds, 1, "空回合按未签收判一个轮次（修前：`_daFailures` +1 且置重投）")
  assert.ok(agent._pendingAsyncResults.includes(entry), "条留容器（不丢）")
  assert.equal(reminders(agent), 0, "零升级提醒")

  // —— 第 2、3 轮：空回合零投递（修前每轮再推一遍）——
  for (const round of [2, 3]) {
    const r = await digestRound(agent)
    assert.equal(r.ok, false, `第 ${round} 轮空提供端照旧抛错`)
    assert.equal(injections(agent), 1, `第 ${round} 轮零再注入（修前此处 = ${round} 次）`)
    assert.equal(entry._daMissRounds, round, `第 ${round} 轮未签收轮数 = ${round}`)
    assert.ok(agent._pendingAsyncResults.includes(entry), `第 ${round} 轮条仍在容器（高负载窗口不更易丢）`)
    assert.equal(entry.report, `${MARK} body`, `第 ${round} 轮 report 未释放`)
    assert.equal(reminders(agent), 0, `第 ${round} 轮零 UNSETTLED 提醒（修前第 3 轮即提醒）`)
    assert.equal((agent._unsettledDigests ?? []).length, 0, `第 ${round} 轮零升级`)
  }

  // —— 第 4 轮：达上限 ⇒ 升级 + 终局披露 ——
  const r4 = await digestRound(agent)
  assert.equal(r4.ok, false, "第 4 轮仍是空提供端")
  assert.equal(agent._unsettledDigests.length, 1, "升级账本恰一条")
  assert.equal(agent._unsettledDigests[0].id, "26")
  assert.equal(agent._unsettledDigests[0].missRounds, 4, "账本携未签收轮数 = 4")
  assert.equal(reminders(agent), 1, "UNSETTLED 提醒恰一条")
  assert.ok(
    agent.history.some((m) => typeof m.content === "string" && m.content.includes("after 4 digest rounds")),
    "提醒句轮数 = 4",
  )
  assert.equal(injections(agent), 2, "正文出现 2 次：首投 1 + 终局披露 1")
  assert.equal(unsettledCount(agent), 0, "条已离容器 ⇒ 端面残余行清零")
  assert.equal(agent._pendingAsyncResults.includes(entry), false, "升级 ⇒ 离容器")

  // —— 第 5 轮：零新注入（升级即终局）——
  state.content = "background report processed" // 提供端恢复
  const r5 = await digestRound(agent)
  assert.equal(r5.ok, true, `提供端恢复 ⇒ 本轮回正文、正常收尾，实读：${r5.e?.message ?? r5.v}`)
  assert.equal(r5.v, "background report processed", "第 5 轮拿到正文答复（用户可见的业务结果）")
  assert.equal(injections(agent), 2, "零新注入——总数仍 = 首投 1 + 终局披露 1")
  assert.equal(reminders(agent), 1, "零新提醒")
  assert.equal(agent._unsettledDigests.length, 1, "账本不被重写")
})
