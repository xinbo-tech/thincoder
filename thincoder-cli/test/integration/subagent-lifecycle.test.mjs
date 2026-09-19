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
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runAgent, createAgent } from "@thincoder/core/agent.mjs"
import { builtinTools } from "@thincoder/core/tools/index.mjs"
import { subagentTool } from "@thincoder/core/agent-tools/subagent.mjs"

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

/** 确定性闸门：测试登记 marker → Promise，端点见该 marker 在场即等其释放（取代墙钟窗口）。 */
const gates = new Map()
function openGate(marker) {
  let release
  const gate = new Promise((r) => { release = r })
  gates.set(marker, gate)
  return { release, close: () => gates.delete(marker) }
}

/** 内容键控端点（**不按请求序号取步**——多/少一次请求不会静默错位）：
 *  子代理任务文本在场 → 交付报告（带 "(slow)" 则迟一步回，留排队/cancel 窗口；
 *  带已登记闸门 marker 则等测试显式释放——同窗口确定性化，不看墙钟）；
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
      const gate = [...gates.entries()].find(([marker]) => body.includes(marker))
      if (gate) await gate[1]
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

const spawn = (agent, args = {}, signal = null) =>
  subagentTool.execute({ action: "spawn", role: "explore", task: CHILD_TASK, ...args },
    { agent, cwd: agent.cwd, depth: 0, callbacks: {}, signal })

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

/** 隔离日志目录内 `ev:discarded` 事件行（写门 override——NODE_TEST_CONTEXT 默认不写盘）。
 *  本用例自建空目录 ⇒ 全量读即可断言条数。 */
function discardedEvents(dir) {
  const out = []
  for (const n of readdirSync(dir)) {
    for (const line of readFileSync(join(dir, n), "utf8").split("\n")) {
      if (!line.trim()) continue
      try { const e = JSON.parse(line); if (e.ev === "ev:discarded") out.push(e) } catch { /* 半行（并发写）忽略 */ }
    }
  }
  return out
}

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

test("③ 中止丢弃（批 4 CLI-ASYNC-DISCARD）：父回合中止 → 已死条目出池 + discarded 墓碑 + 一次提醒；存活条目仍能结算注入", async (t) => {
  const { agent } = await makeParent(t)
  const logDir = mkdtempSync(join(tmpdir(), "tc-int-discard-"))
  t.after(() => { try { rmSync(logDir, { recursive: true, force: true }) } catch { /* ignore */ } })
  process.env.THINCODER_LOG_DIR = logDir
  try {
    // 存活条目（跨回合后台工作——基信号未中止）：本回合 Stop 不得误伤
    const keep = new AbortController()
    const liveGate = openGate("(gated)") // 在飞窗口由本用例显式释放——不再依赖 500ms 墙钟
    t.after(() => liveGate.close())
    const ackLive = JSON.parse(await spawn(agent, { task: `${CHILD_TASK} (gated)`, files: ["lib/feature.mjs"] }, keep.signal))
    // 在飞条目（持本回合 signal + 域冲突排队未启动）⇒ 中止时确定性「已死且未结算」
    const stop = new AbortController()
    const ackDead = JSON.parse(await spawn(agent, { files: ["lib/feature.mjs"] }, stop.signal))
    assert.equal(ackLive.status, "running", "先入者开跑（占住文件域）")
    assert.equal(ackDead.status, "queued", "域冲突 → 后入者排队未启动")

    stop.abort() // 用户 Stop：回合 signal 中止（逐链中止池内持该基信号的条目）
    await assert.rejects(
      () => runAgent(agent, "stopped turn", { onPermissionRequest: async () => true }, { signal: stop.signal }),
      /abort/i,
      "父回合以中止结束",
    )

    // 已死条目：出池 + discarded 墓碑；存活条目留池（未误伤）
    assert.equal(entryOf(agent, ackDead.id), undefined, "已死条目出池")
    assert.equal(agent._asyncTombstones.get(String(ackDead.id))?.status, "discarded", "终态墓碑 = discarded")
    assert.equal(entryOf(agent, ackLive.id)?.status, "running", "存活条目仍在池（跨回合后台工作不被误伤）")
    // 提醒：父历史恰一条（丢弃数 + 名单 + 未启动词）+ 恰一条事件
    const notices = agent.history.filter((m) => typeof m.content === "string" && m.content.includes("discarded by the user's Stop"))
    assert.equal(notices.length, 1, `整批恰一条提醒：\n${agent.history.map((m) => String(m.content).slice(0, 70)).join("\n")}`)
    assert.equal(notices[0].role, "user", "user 注入")
    assert.match(notices[0].content, new RegExp(`explore#${ackDead.id} \\(was queued — never started\\)`), "名单带 id + 未启动词")
    const evs = discardedEvents(logDir)
    assert.equal(evs.length, 1, "恰一条 ev:discarded")
    assert.equal(evs[0].n, 1, "事件 n = 丢弃数")

    // 存活条目：中止不阻断其结算注入（下个正常回合送达——结果不丢）
    liveGate.release() // 放行：存活条目此刻才在飞窗口内完成
    await entryOf(agent, ackLive.id).promise
    await runAgent(agent, "any updates from the background survey?", { onPermissionRequest: async () => true })
    assert.ok(
      agent.history.some((m) => typeof m.content === "string" && m.content.includes(`async subagent #${ackLive.id}`)),
      "存活条目结算后仍送达父侧",
    )
    assert.equal(agent._asyncSubagents.size, 0, "结算后池清")
  } finally {
    delete process.env.THINCODER_LOG_DIR
  }
})
