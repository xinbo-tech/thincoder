/**
 * engineering-chain.test.mjs — 集成场景 ②（TESTING.md §5.2——工程模式全链）。
 *
 * 业务语义：工程模式下"设计评审 → token 签发 → 带 token 实施放行 → 链终消费"这条
 * 机械脊柱真的能串起来——评审结算是脚本化结论（mock 端点回显 Approval Signal 里的
 * token = 通过），其余全是真机制：真 advisor 工具 → 真 runAdvisorReview → 真 async
 * settle 记账 → 真 token 槽 → 真 spawn 门 → 真 eng-coder 子代理 → 真 consume。
 * 三态：正常（全链串通）/ 边界（修正窗口放行 ↔ 链终机械拒）/ 错误（无 token 拒发）。
 *
 * 断言只写业务可观察结果：评审回执 / 槽台账 / spawn 判决 / 二次 spawn 拒绝。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { runAgent, createAgent } from "../../src/agent.mjs"
import { builtinTools } from "../../src/tools/index.mjs"
import { advisorTool } from "../../src/agent-tools/advisor.mjs"
import { subagentTool } from "../../src/agent-tools/subagent.mjs"
import { executeConsumeDesignAction, resolveDesignSlot } from "../../src/agent-tools/subagent-spawn.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "../../src/session-slots.mjs"

let sessionsDir
beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "tc-int-eng-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  try { rmSync(sessionsDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

const CHILD_REPORT =
  "DELIVERY REPORT — implemented the module per the approved design and ran the project's verification.\n" +
  "Transparency table: requirement 1 Done; requirement 2 Done.\n" +
  "Files touched: lib/feature.mjs. All checks green."

/** 脚本化端点：设计评审请求（体内含 Approval Signal）→ 回显 token（= 通过）；子代理请求 → 交付报告。 */
async function mockEndpoint() {
  const requests = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      requests.push(body)
      // 只认真 token 形态（uuid:expiresAt——模板里的 [DESIGN-TOKEN:<token>] 占位符不匹配）
      const m = /\[DESIGN-TOKEN:\s*([0-9a-f-]{36}:\d+)\s*\]/i.exec(body)
      const content = m
        ? `Design review passed — no issues found. The design is approved as written.\n\nApproval: [DESIGN-TOKEN: ${m[1]}]`
        : CHILD_REPORT
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n"
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port, requests }
}

/** 工程模式父代理 + 临时工作区（设计档 / 批次档 + 接口文件）。 */
async function makeEngineeringParent(t) {
  const dir = mkdtempSync(join(tmpdir(), "tc-int-eng-"))
  mkdirSync(join(dir, "docs"), { recursive: true })
  mkdirSync(join(dir, "lib"), { recursive: true })
  writeFileSync(join(dir, "docs", "FEATURE.md"), "# Feature design\n\nAdd lib/feature.mjs.\n")
  writeFileSync(join(dir, "docs", "BATCH.md"), "# Batch record\n\n## 本批任务\n\nImplement lib/feature.mjs.\n")
  const mock = await mockEndpoint()
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } })
  const agent = createAgent({
    provider: { name: "mock", model: "mock-model", baseURL: `http://127.0.0.1:${mock.port}/v1`, apiKey: "test-key" },
    tools: builtinTools,
    config: { agent: { maxTurns: 12, engineering: true } },
    cwd: dir,
    memory: null,
  })
  return { agent, dir, mock }
}

/** 设计评审（真工具 → 真评审 → 真 settle）；返回 { report, designId }。默认异步面。 */
async function runDesignReview(agent, { async = true } = {}) {
  const res = await advisorTool.execute(
    { type: "design", documents: ["docs/FEATURE.md"], ...(async ? {} : { async: false }) },
    { agent, cwd: agent.cwd, depth: 0, callbacks: {} },
  )
  if (!async) return { report: res, designId: [...agent._engDesignTokens.keys()][0] }
  const ack = JSON.parse(res)
  assert.equal(ack.status, "running", "评审在后台池启动（async ack）")
  const entry = agent._asyncAdvisors.get(String(ack.id))
  await entry.promise
  assert.equal(entry.error, null, `评审正常结算：${entry.error ?? ""}`)
  const designId = [...(agent._engDesignTokens ?? new Map()).keys()][0]
  return { report: entry.report, designId }
}

const spawnEngCoder = (agent, args) =>
  subagentTool.execute(
    { action: "spawn", role: "eng-coder", async: false, task: "Implement lib/feature.mjs per the approved design.", ...args },
    { agent, cwd: agent.cwd, depth: 0, callbacks: {} },
  )

test("② 正常：评审通过 → token 签发 → 带 token spawn 放行 → 链终 consume 槽消费", async (t) => {
  const { agent, dir } = await makeEngineeringParent(t)
  const { report, designId } = await runDesignReview(agent)
  assert.ok(designId, `评审通过签发 token 槽（designId=${designId}）`)
  assert.match(String(report), /Approved\./, "评审回执带 Approved 后缀（token 回显）")
  const token = agent._engDesignTokens.get(designId)

  // 令牌槽状态：内存台账 + 权威槽文件（async settle 当场落盘）
  const onDisk = JSON.parse(readFileSync(slotPath(dir, agent._slot), "utf8"))
  assert.equal(onDisk.engDesignTokens[designId], token, "token 已落权威槽台账")
  assert.equal(resolveDesignSlot(agent, designId).token, token, "spawn 门解析出该槽 token")

  const out = await spawnEngCoder(agent, { designToken: token, designId, batchDoc: "docs/BATCH.md" })
  assert.match(String(out), /DELIVERY REPORT/, "带 token 的 eng-coder 实跑并回交付报告")

  const consumed = executeConsumeDesignAction({ designId }, { agent })
  assert.match(consumed, /closed out/, "链终消费生效")
  assert.equal(agent._engDesignTokens.has(designId), false, "槽已消费（内存台账）")
  const afterConsume = JSON.parse(readFileSync(slotPath(dir, agent._slot), "utf8"))
  assert.equal(afterConsume.engDesignTokens, undefined, "槽台账同步落盘删除（不复活）")
})

test("② 边界：链未消费同 designId 复用放行；消费后再 spawn 机械拒", async (t) => {
  const { agent, dir } = await makeEngineeringParent(t)
  const { designId } = await runDesignReview(agent)
  const token = agent._engDesignTokens.get(designId)
  const args = { designToken: token, designId, batchDoc: join(dir, "docs", "BATCH.md") }

  const first = await spawnEngCoder(agent, args)
  assert.match(String(first), /DELIVERY REPORT/, "首次 spawn 放行")
  const fixRound = await spawnEngCoder(agent, args) // 修正窗口：同 designId + 同 token
  assert.match(String(fixRound), /DELIVERY REPORT/, "修正窗口内同 designId 复用放行（docs FIRST 语义）")

  executeConsumeDesignAction({ designId }, { agent })
  await assert.rejects(() => spawnEngCoder(agent, args), /designId not found/, "链终后再 spawn 机械拒（需新评审新 token）")
  await assert.rejects(() => spawnEngCoder(agent, { batchDoc: join(dir, "docs", "BATCH.md") }), /Invalid or missing design token/, "链终后无 token 同拒")
})

test("② 错误：无 token spawn eng-coder —— 机械拒绝且零 spawn", async (t) => {
  const { agent, dir } = await makeEngineeringParent(t)
  const before = agent._subAgentCounter ?? 0
  await assert.rejects(
    () => spawnEngCoder(agent, { batchDoc: join(dir, "docs", "BATCH.md") }),
    /Invalid or missing design token/,
    "无 token 拒绝（明确文案）",
  )
  assert.equal(agent._asyncSubagents?.size ?? 0, 0, "零 spawn——池无残留")
  assert.equal(agent._subAgentCounter ?? 0, before, "零 spawn——未取号")
})
