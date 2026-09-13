/**
 * subagent-lifecycle.test.mjs — 集成场景 ③（TESTING.md §5.3——子代理生命周期）。
 *
 * 业务语义：后台子代理从 spawn 到结算的完整一生——派活 → 观察 → 报告回来 → 结算；
 * 域冲突时自动排队与补位（不靠手工串行）；定向 cancel 干净收尾。
 * 驱动 = 真调度器（subagent 工具 async 分支）+ 脚本化 provider 跑真子代理管线。
 * 种子 S1（GitHub #6——异步子代理结果不丢）的 CLI 侧语义在"正常"态断言：
 * 结算结果必达父侧（注入断言）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runAgent, createAgent } from "../../src/agent.mjs"
import { builtinTools } from "../../src/tools/index.mjs"
import { subagentTool } from "../../src/agent-tools/subagent.mjs"

const CHILD_TASK = "Survey lib/feature.mjs and report."
const CHILD_REPORT =
  "Survey complete — I searched the search/read family and checked the named files.\n" +
  "Findings: the module exports one function and no callers outside lib/. Nothing else was examined.\n" +
  "Not found: no test files reference it."
const PARENT_DONE = "Noted the background reports."

/** 短暂轮询（异步调度是事件驱动的——等状态而不是猜时长）。 */
async function waitFor(fn, { timeoutMs = 10_000, stepMs = 20 } = {}) {
  const t0 = Date.now()
  for (;;) {
    if (fn()) return true
    if (Date.now() - t0 > timeoutMs) return false
    await new Promise((r) => setTimeout(r, stepMs))
  }
}

/** 端点应答（SSE 形态——与真 provider 流式面同形）。 */
function respond(res, content) {
  const frames =
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
    "data: [DONE]\n\n"
  res.writeHead(200, { "Content-Type": "text/event-stream" })
  res.end(frames)
}

/** 内容键控端点（**不按请求序号取步**——多/少一次请求不会静默错位）：
 *  子代理任务文本在场 → 交付报告（带 "(slow)" 则迟一步回，留排队/cancel 窗口）；
 *  父回合 → 收尾应答（带 "(fail)" → 400 错误轮）。 */
async function mockEndpoint(t) {
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", async () => {
      if (!body.includes(CHILD_TASK)) {
        if (body.includes("(fail)")) {
          res.writeHead(400, { "Content-Type": "text/plain" })
          res.end("bad request")
          return
        }
        respond(res, PARENT_DONE)
        return
      }
      if (body.includes("(slow)")) await new Promise((r) => setTimeout(r, 500))
      respond(res, CHILD_REPORT)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  t.after(() => { try { server.close() } catch { /* ignore */ } })
  return { server, port: server.address().port }
}

/** 父代理 + 临时工作区 + 内容键控 provider。 */
async function makeParent(t) {
  const dir = mkdtempSync(join(tmpdir(), "tc-int-sub-"))
  mkdirSync(join(dir, "lib"), { recursive: true })
  writeFileSync(join(dir, "lib", "feature.mjs"), "export const feature = () => 1\n")
  const mock = await mockEndpoint(t)
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  const agent = createAgent({
    provider: { name: "mock", model: "mock-model", baseURL: `http://127.0.0.1:${mock.port}/v1`, apiKey: "test-key" },
    tools: builtinTools,
    config: { agent: { maxTurns: 12, engineering: false } },
    cwd: dir,
    memory: null,
  })
  return { agent, dir }
}

const spawn = (agent, args = {}) =>
  subagentTool.execute({ action: "spawn", role: "explore", task: CHILD_TASK, ...args },
    { agent, cwd: agent.cwd, depth: 0, callbacks: {} })

const entryOf = (agent, id) => agent._asyncSubagents.get(String(id))

test("③ 正常：两个后台子代理 spawn → 结算 → 报告回到父侧、池清、id 递增", async (t) => {
  const { agent } = await makeParent(t)

  const ackA = JSON.parse(await spawn(agent))
  const ackB = JSON.parse(await spawn(agent))
  assert.equal(ackA.status, "running", "spawn 立即返回（不阻塞父侧）")
  assert.equal(Number(ackB.id), Number(ackA.id) + 1, "后台 id 递增（不复用）")

  await entryOf(agent, ackA.id).promise
  await entryOf(agent, ackB.id).promise
  assert.match(String(entryOf(agent, ackA.id).report), /Survey complete/, "子代理产出报告")

  // 父侧下一个回合：结算的报告自动送达父侧历史（结果不丢——种子 S1 语义）
  await runAgent(agent, "any updates from the background survey?", { onPermissionRequest: async () => true })
  const injected = agent.history.filter((m) => typeof m.content === "string" && m.content.includes("async subagent #"))
  assert.equal(injected.length, 2, `两条结算报告都送达父侧：\n${agent.history.map((m) => String(m.content).slice(0, 60)).join("\n")}`)
  assert.ok(injected.every((m) => m.content.includes("Survey complete")), "送达内容 = 子代理报告本体")
  assert.equal(agent._asyncSubagents.size, 0, "结算后池清（报告已消费）")
})

test("③ 边界：文件域交叠 → 第二个先排队，先入者结算后自动启动（不手串行）", async (t) => {
  const { agent } = await makeParent(t)

  const ackA = JSON.parse(await spawn(agent, { task: `${CHILD_TASK} (slow)`, files: ["lib/feature.mjs"] }))
  const ackB = JSON.parse(await spawn(agent, { files: ["lib/feature.mjs"] }))
  assert.equal(ackA.status, "running", "先入者立即开跑")
  assert.equal(ackB.status, "queued", "文件域冲突 → 后入者排队（不拒绝）")
  assert.equal(ackB.position, 1, "排队位次可见")
  assert.match(String(ackB.reason ?? ""), /域冲突/, "排队原因 = 文件域冲突")

  await entryOf(agent, ackA.id).promise
  const started = await waitFor(() => entryOf(agent, ackB.id)?.status === "running")
  assert.ok(started, "先入者结算后，排队者自动补位启动（无手工干预）")
  await entryOf(agent, ackB.id).promise
  assert.match(String(entryOf(agent, ackB.id).report), /Survey complete/, "补位者同样产出报告")
})

test("③ 种子 S1（GitHub #6）：错误轮不误杀——已结算的报告不因本回合出错而丢", async (t) => {
  // 同一 doc-set 语义的 CLI 侧：一个回合出错（provider 400）不得携带走已结算的后台结果
  const { agent } = await makeParent(t)

  const ack = JSON.parse(await spawn(agent))
  await entryOf(agent, ack.id).promise
  await assert.rejects(
    () => runAgent(agent, "this turn will fail (fail)", { onPermissionRequest: async () => true }),
    /LLM API error 400/,
    "父回合确实以错误结束",
  )
  const injected = agent.history.filter((m) => typeof m.content === "string" && m.content.includes(`async subagent #${ack.id}`))
  assert.equal(injected.length, 1, "错误轮仍送达已结算报告（容错——结果不丢）")
  assert.ok(injected[0].content.includes("Survey complete"), "送达内容完整")
  assert.equal(agent._asyncSubagents.size, 0, "结算条目已消费出池")
})

test("③ 错误：运行中 cancel —— 应答取消、池释放、终态干净", async (t) => {
  const { agent } = await makeParent(t)

  const ack = JSON.parse(await spawn(agent, { task: `${CHILD_TASK} (slow)` }))
  const entry = entryOf(agent, ack.id)
  const res = JSON.parse(await subagentTool.execute({ action: "cancel", id: ack.id }, { agent, cwd: agent.cwd, depth: 0, callbacks: {} }))
  assert.equal(res.status, "cancelled", "cancel 应答取消")
  await entry.promise

  assert.equal(entry.done, true, "条目进入终态")
  assert.equal(entry.controller.signal.aborted, true, "子代理运行已中止（无残留执行）")
  assert.equal(agent._asyncSubagents.size, 0, "池已释放")
  assert.equal(agent._asyncTombstones.get(String(ack.id)).status, "cancelled", "终态墓碑 = cancelled")
  assert.ok(
    agent.history.some((m) => typeof m.content === "string" && m.content.includes(`subagent explore#${ack.id} cancelled`)),
    "父侧收到取消提醒（半成品警示可见）",
  )
})
