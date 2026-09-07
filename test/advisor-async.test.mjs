/**
 * advisor-async.test.mjs — §24 D-24b（AGENT-LOOP.md §24——R13 async advisor——2026-09-06）
 * VS Code 镜像测试：
 *   T-24b1  async 发起（depth-0）——ack 即回 + 池条目 running + 回合不阻塞
 *   T-24b10 depth 门控——depth>0 显式 async 拒 / 缺省恒同步
 *   T-24b8  池容量——ADVISOR_POOL_LIMIT=2——第 3 个发起返回错误文案（不排队）
 *   T-24b3  token settle 签发——后台设计评审通过 → settle 入槽（designId 匹配）
 *   T-24b2  settle 注入——挂起期 settle → pending → digest 轮注入（报告 + designId 注记）
 *   T-24b9  陈旧评审——launch 后 FILE_MUTATORS → settle 不置 _calledAdvisorThisRun/不签发 token
 *   T-24b7  取消——cancel 定向中止 → cancelled settle：不入 pending/不入 token 槽 + 提醒注入
 *   T-24b5  多评审并行隔离——两设计评审并发 → round/prior 各归各 reviewId（_advisorRuns）
 *   T-24b6/b12 修正轮续跑——同 scope 再启 → round 2 + prior = 该实例前轮输出（code 无 token 面）
 *   T-24b11 cap 随实例——单实例第 6 次发起拒（他实例不受影响）
 *   T-24b4  guard 时点——guard on + async 未决 → 不推回；settle 后无有效评审 → 推回
 * harness 手法同 advisor.test.mjs / subagent-async.test.mjs（mock SSE LLM + fake parent）。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"

/** Mock advisor LLM：captured 记录每次请求的 messages（供 prior/round 断言）。
 *  mode: "pass"（回显 token——设计通过）/ "fail"（表格无 token）/ "code-ok"（代码评审
 *  全过表格）/ "slow"（delayMs 后完成——取消/并发窗口）。 */
function reviewServer(captured, { pass = true, delayMs = 0, reply } = {}) {
  const server = createServer((req, res) => {
    let text = ""
    req.on("data", (c) => (text += c))
    req.on("end", () => {
      const body = JSON.parse(text)
      captured.push(body.messages)
      const tokenMatch = JSON.stringify(body.messages).match(/([0-9a-f-]{36}:\d{13})/)
      const token = tokenMatch ? tokenMatch[1] : "no-token"
      let content = reply
      if (content === undefined) {
        content = pass
          ? `## Review\n\n设计通过，未发现问题。\n\n[DESIGN-TOKEN:${token}]`
          : "## Review\n\n| # | Category | Severity | Issue | Suggestion |\n|---|---------|----------|------|------------|\n| 1 | correctness | 🔴 | spec gap | fix the spec |"
        if (pass === "code-ok") content = "## Review\n\nAll clear — no issues found. | # | File | Severity | Issue |"
      }
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (delayMs > 0) setTimeout(() => res.end(frames), delayMs)
      else res.end(frames)
    })
  })
  return server
}

const listen = (server) => new Promise((r) => server.listen(0, "127.0.0.1", () => r(server.address().port)))

/** 评审 fake parent（advisor-async 载体齐备——history 数组挂池/记录/事件）。 */
function advParent(port, extra = {}) {
  const history = []
  const parent = {
    _provider: { name: "p", model: "m", baseURL: `http://127.0.0.1:${port}`, apiKey: "x" },
    config: { agent: { engineering: true }, advisor: {} },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    history,
    cwd: tmpdir(),
    _calledAdvisorThisRun: false,
    _mutatedThisRun: false,
    _advisorRound: 0,
    ...extra,
  }
  history._asyncAdvisors = parent._asyncAdvisors
  return { parent, history }
}

function advCtx(parent, cwd, extra = {}) {
  return { agent: parent, cwd, callbacks: {}, depth: 0, ...extra }
}

const userMsgOf = (messages) => messages.find((m) => m.role === "user")?.content ?? ""

/** 工具 async 发起（depth-0 缺省 async——省略 async 参数）。 */
async function launch(subagentTool, parent, ctx, args) {
  return String(await subagentTool.execute({ ...args }, ctx))
}

const waitSettle = async (entry) => {
  await entry.settled
  return entry
}

slow("T-24b1/b10 (vscode): async 发起 ack 即回 + 池条目 running；depth>0 显式 async 拒/缺省同步", async () => {
  const captured = []
  const server = reviewServer(captured, { delayMs: 300 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    const notes = []
    const ctx = advCtx(parent, cwd, { callbacks: { onSubagent: (n) => notes.push(n), onToolPanel: () => {}, onAsyncSettled: () => {} } })
    const out = await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    assert.match(out, /started in the background/, "ack 文案（评审已后台启动——完成自动回来）")
    assert.ok(!out.includes("Approved"), "ack 不携带评审结果")
    const entry = [...parent._asyncAdvisors.values()][0]
    assert.ok(entry && entry.status === "running", "池条目 running")
    assert.equal(entry.reviewType, "design")
    assert.equal(entry.round, 1, "首轮 round 1")
    assert.ok(entry.designId && /^[0-9a-f-]{36}$/.test(entry.designId), "designId = reviewId（②-5）")
    assert.equal(entry.reviewId, entry.designId, "design: reviewId === designId")
    assert.ok(notes.some((n) => n.role === "advisor" && n.status === "started" && n.pool === true), "started + pool:true（⏹ 门控源）")
    await waitSettle(entry)
    assert.equal(entry.done, true, "后台完成")
    assert.ok(String(entry.report).includes("Approved") || String(entry.report).includes("DESIGN-TOKEN"), "settle 落报告")
    // depth 门控（修正 #3——②-3 A）：depth>0 显式 async 拒
    const deep = advCtx(parent, cwd, { depth: 1 })
    const refused = await launch(advisorTool, parent, deep, { type: "code", paths: ["a.mjs"], async: true })
    assert.match(refused, /only available at the top level/, "depth>0 显式 async → 拒")
    // depth>0 缺省恒同步：缺省 async 参数 + depth 1 → asyncFlag false → 阻塞执行（结果 = 评审文本）
    const syncOut = await launch(advisorTool, parent, deep, { type: "code", paths: ["src/a.mjs"] })
    assert.ok(!/started in the background/.test(syncOut), "depth>0 缺省 → 同步执行（不翻转——eng-coder 内部自审）")
    assert.match(syncOut, /Review/, "同步返回评审结果")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b8 (vscode): 池容量——ADVISOR_POOL_LIMIT=2——第 3 个发起返回错误文案（不排队）", async () => {
  const captured = []
  const server = reviewServer(captured, { delayMs: 400 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    for (let i = 0; i < 2; i++) {
      const out = await launch(advisorTool, parent, ctx, { type: "code", paths: [`src/f${i}.mjs`] })
      assert.match(out, /started in the background/, `第 ${i + 1} 个评审启动`)
    }
    const third = await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/f2.mjs"] })
    assert.match(third, /another review is already running/, "第 3 个 → 超限拒文案（另有一评审在跑——逐个发起）")
    assert.ok(!third.includes("started in the background"), "不排队不启动")
    assert.equal([...parent._asyncAdvisors.values()].filter((e) => e.status === "running").length, 2, "池仍 2 running")
    await Promise.allSettled([...parent._asyncAdvisors.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b3 (vscode): token settle 签发——后台设计评审通过 → settle 入槽（designId 匹配）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 250 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    const ctx = advCtx(parent, cwd)
    const out = await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    assert.match(out, /started in the background/)
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    assert.ok(parent._engDesignTokens instanceof Map && parent._engDesignTokens.has(entry.designId), "settle 通过 → token 入槽（designId 键）")
    assert.equal(parent._engDesignTokens.get(entry.designId), entry.designToken, "槽值 = 该轮设计 token")
    assert.equal(parent._engDesignToken, entry.designToken, "单槽镜像同步")
    assert.equal(parent._calledAdvisorThisRun, true, "非陈旧 settle → guard 标记置位（②）")
    // 注入形态（digest 轮呈递）：designId 注记 + 报告（token 已回显——eng-coder spawn 凭证）
    const hist = history
    const full = []
    const { injectAdvisorResult } = await import("../src/agent-tools/advisor-async.mjs")
    await injectAdvisorResult(entry, { history: hist, fullHistory: full, cwd })
    const injected = hist.find((m) => typeof m.content === "string" && m.content.includes("async advisor design review"))
    assert.ok(injected, "注入提醒形态（同 injectAsyncResult）")
    assert.ok(injected.content.includes(`designId: ${entry.designId}`), "designId 注记随注入（spawn 复用）")
    assert.ok(injected.content.includes(entry.designToken.slice(0, 8)), "token 随通过报告回显")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T6 (vscode): 评审员正文自编 designId 不落 spawn 指引位——尾部真值在（2026-09-07 §2.6 假 id 负例）", async () => {
  const captured = []
  const FAKE_ID = "00000000-0000-4000-8000-000000000000"
  // 独立 mock：正文夹带自编 designId + 方括号 token（pass 形态——token 自请求回读）
  const server = createServer((req, res) => {
    let text = ""
    req.on("data", (c) => (text += c))
    req.on("end", () => {
      const body = JSON.parse(text)
      captured.push(body.messages)
      const tokenMatch = JSON.stringify(body.messages).match(/([0-9a-f-]{36}:\d{13})/)
      const token = tokenMatch ? tokenMatch[1] : "no-token"
      const content = `## Review\n\n设计通过。参考 designId: ${FAKE_ID}（正文自编值——模型可能取用）。\n\n[DESIGN-TOKEN:${token}]`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      )
    })
  })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-fakeid-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    assert.notEqual(entry.designId, FAKE_ID, "真值 ≠ 假 id（评审调用生成随机 designId）")
    const report = String(entry.report)
    // spawn 指引位（尾部 Approved 后缀）= 真值 designId
    const guidance = report.split("Approved. Pass this exact token to eng-coder")[1] ?? ""
    assert.ok(guidance.includes(`designId: ${entry.designId} (pass as the designId parameter`), "spawn 指引位携带真值 designId")
    assert.ok(!guidance.includes(FAKE_ID), "正文自编假 id 不落在 spawn 指引位（模型取正文值会被 not found 拒——指引位真值性）")
    assert.ok(report.includes(FAKE_ID), "正文自编值仍在报告（不篡改评审员文本——仅指引位真值性断言）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b2 (vscode): settle 注入——挂起期 settle → pending → digest 轮注入（真实 runAgent）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 250 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    // 挂起期语义：_suspended = true → settle 移交 _pendingAdvisorResults（driver 消化链）
    history._suspended = true
    await waitSettle(entry)
    assert.equal(parent._asyncAdvisors.size, 0, "settle 出池（移交 pending）")
    assert.equal(history._pendingAdvisorResults.length, 1, "挂起记账（D-S3 ② 同机制）")
    history._suspended = false
    // digest/下个用户回合 run-start 注入（agent.mjs 首行——prepareRun 前）
    const { runAgent } = await import("../src/agent.mjs")
    const fullHistory = []
    const out2 = await runAgent(parent._provider, cwd, "下一轮", {}, undefined, true, { history, fullHistory })
    assert.ok(String(out2).length > 0, "回合完成")
    assert.equal(history._pendingAdvisorResults.length, 0, "注入即消费")
    const injected = history.find((m) => typeof m.content === "string" && m.content.includes("async advisor design review #"))
    assert.ok(injected, "digest 轮注入（报告呈递）")
    const inputIdx = history.findIndex((m) => m.content === "下一轮")
    assert.ok(history.indexOf(injected) < inputIdx, "注入先于用户输入（prepareRun 前落定）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b9 (vscode): 陈旧评审——launch 后 FILE_MUTATORS → settle 不置 _calledAdvisorThisRun/不签发 token", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 250 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { recordFileMutation } = await import("../src/agent-tools/advisor-async.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    // 评审飞行中发生 FILE_MUTATORS（execute-tools 记账点——测试直调同一收口）
    recordFileMutation(parent, join(cwd, "docs", "design", "A.md"))
    parent._mutatedThisRun = true
    await waitSettle(entry)
    assert.equal(parent._calledAdvisorThisRun, false, "陈旧 settle → 不置 guard 标记（guard 仍推回）")
    assert.ok(!(parent._engDesignTokens instanceof Map && parent._engDesignTokens.has(entry.designId)), "陈旧 settle → 不签发 token")
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(entry.reviewId).stale, true, "实例记录 stale 标记（④——无陈旧标记才算未评审）")
    // 代码面陈旧：任意文件变更命中（code review）
    const parent2 = advParent(port).parent
    await launch(advisorTool, parent2, advCtx(parent2, cwd), { type: "code", paths: ["src/a.mjs"] })
    const e2 = [...parent2._asyncAdvisors.values()][0]
    recordFileMutation(parent2, join(cwd, "unrelated.mjs")) // code 面：任意文件变更即陈旧
    await waitSettle(e2)
    assert.equal(parent2._calledAdvisorThisRun, false, "code 面任意文件变更 → 陈旧")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b7 (vscode): 取消——cancel 定向中止 → cancelled settle：不入 pending/不入 token 槽 + 提醒注入", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 2000 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { cancelAdvisorReview } = await import("../src/agent-tools/advisor-async.mjs")
    const { parent, history } = advParent(port)
    const notes = []
    const ctx = advCtx(parent, cwd, { callbacks: { onSubagent: (n) => notes.push(n), onAsyncSettled: () => {} } })
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    const res = JSON.parse(cancelAdvisorReview(parent, entry.id))
    assert.equal(res.status, "cancelled")
    assert.ok(history.some((m) => typeof m.content === "string" && m.content.includes("cancelled") && m.content.includes("no design token was issued")), "取消提醒注入（评审已取消——token 未签发）")
    history._suspended = true // 挂起期 settle 分流条件——cancelled 不得入 pending
    await waitSettle(entry)
    assert.equal(entry.cancelled, true)
    assert.equal((history._pendingAdvisorResults?.length) ?? 0, 0, "cancelled settle 不入 pending")
    assert.ok(!(parent._engDesignTokens instanceof Map && parent._engDesignTokens.has(entry.designId)), "cancelled settle 不入 token 槽")
    assert.equal(parent._calledAdvisorThisRun, false, "取消不计评审")
    assert.ok(notes.some((n) => n.status === "cancelled"), "webview stopped 冻结通知")
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(entry.reviewId).state, "cancelled", "实例记录 cancelled（不匹配续跑——取消轮不计轮次）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b5/b6/b12 (vscode): 多评审隔离 + 修正轮续跑——round/prior 各归各 reviewId；code 无 token 面", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: "code-ok" })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    const ctx = advCtx(parent, cwd)
    // 两个并行 code 评审（不同 scope——隔离）
    await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/a.mjs"] })
    await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/b.mjs"] })
    const entries = [...parent._asyncAdvisors.values()]
    assert.equal(entries.length, 2, "两评审并行（池容量 2）")
    assert.notEqual(entries[0].reviewId, entries[1].reviewId, "reviewId 各自随机")
    await Promise.allSettled(entries.map((e) => e.settled))
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(entries[0].reviewId).round, 1)
    assert.equal(runs.get(entries[1].reviewId).round, 1)
    // b6：处置后同 scope 再启 → round 2 + prior = 该实例前轮输出（非其他评审）
    const capBefore = captured.length
    await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/a.mjs"] })
    const entry2 = [...parent._asyncAdvisors.values()].find((e) => !e.done)
    assert.equal(entry2.round, 2, "同 scope 续跑 → round 2（修正轮——修复后复审同一范围）")
    assert.equal(entry2.reviewId, entries[0].reviewId, "同实例（reviewId 沿用）")
    await waitSettle(entry2)
    const round2msgs = captured.slice(capBefore).map((m) => m).flat()
    const r2user = userMsgOf(round2msgs)
    assert.ok(r2user.includes("## Round 2"), "round 2 收敛指令（prior 注入面）")
    assert.ok(r2user.includes("All clear — no issues found"), "prior = 该 reviewId 前轮输出（非 b.mjs 评审）")
    assert.ok(!r2user.includes("src/b.mjs"), "他评审 scope 不混入")
    assert.equal(runs.get(entries[0].reviewId).round, 2, "记录轮次推进")
    // b12 语义：code 复核无 token 面
    assert.equal(entry2.designId, null, "code review 无 designId")
    assert.equal(entry2.designToken, null, "code review 无 designToken")
    assert.ok(!(parent._engDesignTokens instanceof Map && parent._engDesignTokens.size > 0), "code 复核不签发 token")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b11 (vscode): cap 随实例——单实例第 6 次发起拒（他实例不受影响——修正 #4）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: "code-ok" })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    for (let round = 1; round <= 5; round++) {
      const out = await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/a.mjs"] })
      assert.match(out, /started in the background/, `round ${round} 正常启动`)
      const entry = [...parent._asyncAdvisors.values()].find((e) => e.status === "running")
      await waitSettle(entry)
      const runs = (parent.history ?? parent)._advisorRuns
      assert.equal(runs.get(entry.reviewId).round, round)
    }
    // 第 6 次同 scope 发起 → 拒（该实例 ≤5 轮）
    const sixth = await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/a.mjs"] })
    assert.match(sixth, /convergence cap/, "第 6 次同实例启动拒")
    // 他实例不受影响：不同 scope 照常 round 1
    const other = await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/other.mjs"] })
    assert.match(other, /started in the background/, "他实例不受 cap 影响")
    const oe = [...parent._asyncAdvisors.values()].find((e) => e.status === "running")
    assert.equal(oe.round, 1, "他实例 round 1（cap 随实例——不共享）")
    await waitSettle(oe)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("§8 (vscode): design 实例 round≥5 第 6 次发起不被拒（cap 豁免——code-only）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: false })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    let reviewId = null
    for (let round = 1; round <= 5; round++) {
      const out = await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
      assert.match(out, /started in the background/, `design round ${round} 正常启动`)
      const entry = [...parent._asyncAdvisors.values()].find((e) => e.status === "running")
      reviewId = entry.reviewId
      await waitSettle(entry)
      const runs = (parent.history ?? parent)._advisorRuns
      assert.equal(runs.get(entry.reviewId).round, round, `design round ${round} 落账`)
    }
    // 第 6 次同 scope 发起 → 不被 cap 拒（正向断言——ack 即启动）
    const sixth = await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    assert.match(sixth, /started in the background/, "§8: design 第 6 次启动不被拒（cap 豁免）")
    const e6 = [...parent._asyncAdvisors.values()].find((e) => e.status === "running")
    assert.equal(e6.reviewId, reviewId, "§8: 同 doc-set 续同一实例")
    assert.equal(e6.round, 6, "§8: 第 6 轮")
    await waitSettle(e6)
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(reviewId).round, 6, "§8: settle 后轮次 6（继续递增）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-24b4 (vscode): guard 时点——未决评审不推回；陈旧 settle 后推回（无陈旧标记才算未评审）", async () => {
  const { maybeGuardPushbacks } = await import("../src/agent/run-stages.mjs")
  const { advisorReviewInFlight } = await import("../src/agent-tools/advisor-async.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-"))
  try {
    const mkAgent = () => ({
      config: { agent: { engineering: false }, advisor: { guard: true } },
      _tasks: [], _touchedFiles: [join(cwd, "src", "a.mjs")], _mutatedThisRun: true,
      _calledAdvisorThisRun: false, _verifiedThisRun: false, _verifyPassed: undefined,
      _advisorRound: 0, _verifyRetries: 0, _honestReminderInjected: false,
      _taskPushbacks: 0, _asyncSubagents: new Map(), _asyncAdvisors: new Map(),
      history: [], _inAutoTurn: false,
    })
    const mkSt = (agent) => ({
      response: { content: "done" }, history: agent.history, fullHistory: [],
      callbacks: {}, cfgVerifyGuard: false, pb: { guardPushbacks: 0, advisorPushbacks: 0 },
    })
    // 前置：guard on + 已变更 + 未评审 + 无未决 → 推回
    const a1 = mkAgent()
    const st1 = mkSt(a1)
    const pushed1 = await maybeGuardPushbacks(a1, st1)
    assert.equal(pushed1, true, "无评审记录 → 推回（基线）")
    // 有未决 async 评审 → 不推回（未决不算未评审——等 settle）
    const running = { id: 1, role: "advisor", status: "running", done: false }
    const a2 = mkAgent()
    a2._asyncAdvisors.set(1, running)
    assert.equal(advisorReviewInFlight(a2), true, "in-flight 判定")
    const pushed2 = await maybeGuardPushbacks(a2, mkSt(a2))
    assert.equal(pushed2, false, "guard on + async 评审未决 → 不推回（T-24b4）")
    // settle 后非陈旧 → _calledAdvisorThisRun 置位 → 不推回
    const a3 = mkAgent()
    a3._calledAdvisorThisRun = true // settle 记账置位（非陈旧）
    const pushed3 = await maybeGuardPushbacks(a3, mkSt(a3))
    assert.equal(pushed3, false, "非陈旧 settle → 已评审 → 不推回")
    // settle 后陈旧（无 called 标记 + stale 记录）→ 仍推回（防静默漏审）
    const a4 = mkAgent()
    const runs = (a4.history ?? a4)._advisorRuns = new Map()
    runs.set("r1", { state: "settled", stale: true, round: 1, reviewType: "code" })
    const pushed4 = await maybeGuardPushbacks(a4, mkSt(a4))
    assert.equal(pushed4, true, "陈旧标记 → 仍推回（发起新评审）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})


// ─────────────────────────────────────────────────────────────────────────────
// §29（2026-09-07——async advisor stale 误判修复——AGENT-LOOP.md §29——VS Code 镜像）：
// 修复 A —— recordFileMutation 移到 runOne 执行成功即刻（唯一记账点——取代批后提交
// 循环——不双计——中断批不再丢事件）；修复 B —— settle 分支输出写回 entry.report：
// digest 永不展示未注册 token（通过 = 剥回显 + Approved/designId 后缀——T-B1；
// stale = 同剥 + "评审目标已变更——token 未签发"提示——T-B2）。
// ─────────────────────────────────────────────────────────────────────────────

/** execute-tools 记账字段齐备的批次装配（advParent + batchAgent 字段合并）。 */
function advBatchParent(port, cwd) {
  const { parent, history } = advParent(port)
  parent.cwd = cwd
  Object.assign(parent, {
    _planMode: false, _role: null, _engDesignToken: null, _engDesignReviewed: false,
    _verifiedThisRun: false, _verifyPassed: undefined,
  })
  return { parent, history }
}

const mockWriteTool = { name: "write", readonly: false, execute: async () => "Wrote" }

/** 同批 [写 + advisor] executeToolBatches（VS 批次装配——A 系用例共用）。 */
async function runWriteLaunchBatch(parent, history, cwd, port, signal = undefined, sessionSignal = null) {
  const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
  const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
  await executeToolBatches(parent, {
    response: {
      toolCalls: [
        { id: "1", name: "write", arguments: JSON.stringify({ path: "docs/design/A.md", content: "v1" }) },
        { id: "2", name: "advisor", arguments: JSON.stringify({ type: "design", documents: ["docs/design/A.md"] }) },
      ],
    },
    history, fullHistory: [],
    toolByName: new Map([["write", mockWriteTool], ["advisor", advisorTool]]),
    getAuto: () => true, // AUTO——免询问——保序执行（write 批次先于 advisor 只读批）
    callbacks: {}, signal, sessionSignal, cwd, recentSigs: [], depth: 0,
  })
}

slow("T-A1 (vscode): 同批 [写文档 + async advisor launch] settle → 槽位在（eventsAtLaunch 已含同批写——不误判陈旧）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 250 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-a1-"))
  try {
    const { parent, history } = advBatchParent(port, cwd)
    await runWriteLaunchBatch(parent, history, cwd, port)
    const entry = [...parent._asyncAdvisors.values()][0]
    assert.ok(entry, "T-A1: 池条目在")
    assert.equal(history._fileMutEvents.length, 1, "T-A1: 写事件恰一条（执行期唯一记账点）")
    assert.deepEqual(history._fileMutEvents, [join(cwd, "docs", "design", "A.md")], "T-A1: 事件 = 该文档 abs")
    assert.equal(entry.eventsAtLaunch, 1, "T-A1: eventsAtLaunch 已含同批写（先写后 launch——不误判陈旧）")
    await waitSettle(entry)
    assert.equal(parent._calledAdvisorThisRun, true, "T-A1: 非陈旧 settle 置 called")
    assert.ok(parent._engDesignTokens instanceof Map && parent._engDesignTokens.has(entry.designId), "T-A1: 槽位在——settleDesignReview 被调")
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(entry.reviewId).stale, false, "T-A1: 实例非 stale")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-A1i (vscode): 中断（Ctrl+I）不杀 settle——事件单计——槽位在（会话信号链 interrupt 豁免）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 250 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-a1i-"))
  const ac = new AbortController()
  try {
    const { parent, history } = advBatchParent(port, cwd)
    // 同批 [写 + launch]——review 飞行中（delayMs 250）发 Ctrl+I（interrupt——F2 豁免——
    // 评审按会话信号链存活——settle 照常记账——不双计不丢事件）
    await runWriteLaunchBatch(parent, history, cwd, port, ac.signal, ac.signal)
    const entry = [...parent._asyncAdvisors.values()][0]
    ac.abort({ interrupt: true, message: "停" })
    assert.equal(history._fileMutEvents.length, 1, "T-A1i: 写事件单计（中断无任何双计路径）")
    assert.equal(entry.eventsAtLaunch, 1, "T-A1i: eventsAtLaunch 已含同批写")
    await waitSettle(entry)
    assert.equal(parent._calledAdvisorThisRun, true, "T-A1i: interrupt 不杀 settle——照常置 called（F2 豁免——中断非全停）")
    assert.ok(parent._engDesignTokens instanceof Map && parent._engDesignTokens.has(entry.designId), "T-A1i: 槽位在")
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(entry.reviewId).stale, false, "T-A1i: 实例非 stale")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-A2 (vscode): launch 后写仍保守陈旧——不注册（T-24b9 语义保持）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 250 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-a2-"))
  try {
    const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advBatchParent(port, cwd)
    // 消息 1：launch；消息 2：写文档（launch 后）——settle 需在写执行后（delayMs 250）
    await executeToolBatches(parent, {
      response: { toolCalls: [{ id: "1", name: "advisor", arguments: JSON.stringify({ type: "design", documents: ["docs/design/A.md"] }) }] },
      history, fullHistory: [],
      toolByName: new Map([["advisor", advisorTool]]),
      getAuto: () => true, callbacks: {}, signal: undefined, sessionSignal: null, cwd, recentSigs: [], depth: 0,
    })
    const entry = [...parent._asyncAdvisors.values()][0]
    assert.equal(entry.eventsAtLaunch, 0, "T-A2: launch 时无前序写")
    await executeToolBatches(parent, {
      response: { toolCalls: [{ id: "2", name: "write", arguments: JSON.stringify({ path: "docs/design/A.md", content: "v2" }) }] },
      history, fullHistory: [],
      toolByName: new Map([["write", mockWriteTool]]),
      getAuto: () => true, callbacks: {}, signal: undefined, sessionSignal: null, cwd, recentSigs: [], depth: 0,
    })
    assert.equal(history._fileMutEvents.length, 1, "T-A2: launch 后的写事件一条")
    await waitSettle(entry)
    assert.ok(!(parent._engDesignTokens instanceof Map && parent._engDesignTokens.size > 0), "T-A2: launch 后写 → 陈旧 → 不签发 token（T-24b9 语义保持）")
    assert.equal(parent._calledAdvisorThisRun, false, "T-A2: 不置 called")
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(entry.reviewId).stale, true, "T-A2: 实例 stale 标记")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-B1 (vscode): 通过 settle digest 清洗——全文无方括号 token——designId/reminder id 在", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-b1-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { injectAdvisorResult } = await import("../src/agent-tools/advisor-async.mjs")
    const { parent, history } = advParent(port)
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    // settle 分支输出（清洗 + Approved/designId 后缀——sync 参照形态同构）已写回 entry.report
    const report = String(entry.report)
    assert.ok(!report.includes("[DESIGN-TOKEN:"), "T-B1: entry.report 无方括号 token 原文（评审员回显已剥）")
    assert.ok(report.includes("Approved. Pass this exact token to eng-coder"), "T-B1: Approved 指引形态（sync 参照同构）")
    assert.ok(report.includes("designId:"), "T-B1: designId 后缀在")
    // digest 注入形态——同样无方括号 token + designId/reminder id 在
    const full = []
    await injectAdvisorResult(entry, { history, fullHistory: full, cwd })
    const injected = history.find((m) => typeof m.content === "string" && m.content.includes("async advisor design review"))
    assert.ok(injected, "T-B1: digest 注入在")
    const text = String(injected.content)
    assert.ok(!text.includes("[DESIGN-TOKEN:"), "T-B1: digest 全文无方括号 token（清洗输出）")
    assert.ok(text.includes("designId:"), "T-B1: digest 载体仍含 designId（spawn 指引不丢）")
    assert.ok(text.includes("review #"), "T-B1: reminder id 在")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-B2 (vscode): stale settle digest 形态——无方括号 token + '未签发'提示在", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 200 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-b2-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { recordFileMutation, injectAdvisorResult } = await import("../src/agent-tools/advisor-async.mjs")
    const { parent, history } = advParent(port)
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    recordFileMutation(parent, join(cwd, "docs", "design", "A.md")) // 评审飞行中目标文档变更 → stale
    await waitSettle(entry)
    assert.ok(!(parent._engDesignTokens instanceof Map && parent._engDesignTokens.has(entry.designId)), "T-B2: stale 不签发 token")
    const report = String(entry.report)
    assert.ok(!report.includes("[DESIGN-TOKEN:"), "T-B2: entry.report 无方括号 token（评审员回显已剥——即使 pass 回显）")
    assert.ok(report.includes("评审目标已变更——token 未签发"), "T-B2: 未签发提示前置")
    // digest 注入形态——同样无 token + 提示在
    const full = []
    await injectAdvisorResult(entry, { history, fullHistory: full, cwd })
    const injected = history.find((m) => typeof m.content === "string" && m.content.includes("async advisor design review"))
    assert.ok(injected, "T-B2: digest 注入在")
    const text = String(injected.content)
    assert.ok(!text.includes("[DESIGN-TOKEN:"), "T-B2: digest 全文无方括号 token（不变式：永不展示未注册 token）")
    assert.ok(text.includes("评审目标已变更——token 未签发"), "T-B2: 未签发提示在 digest")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// §29.1（2026-09-07——designId/token 凭证机制——AGENT-LOOP.md §29.1——VS 镜像）：
// T1 注入契约（两值同段——修前必红）——T2 单槽省略指引（保 id + 可省略注记）——T3
// prior 无原生 token 泄漏——T5 尾部同源锁（async）——T6 stale 前缀——T8 round2+
// 注入侧提示词无泄漏——T9 端到端复现锁（正文回显 id spawn 过）——T10 多槽交叉配对
// 拒——T11 F2c 时效（单槽指引 → 第二槽获批 → 省略 spawn 撞多槽拒自愈）——T12 挂起
// 期 settle 镜像持久化 round-trip（F2g）——T13 并行两 design 各槽各注入——T14 同
// scope 复审旧 token 拒——T15 round2+ 注入 fail-when-unchanged（修前必红）。
// ─────────────────────────────────────────────────────────────────────────────

const VS_FINDINGS = "| # | Category | Severity | Issue | Suggestion |\n|---|---------|----------|------|------------|\n| 1 | correctness | 🔴 | spec gap | fix the spec |"

test("T1 (vscode): 注入契约——round1 Approval Signal 同段注入 token + designId 两值（Copy BOTH——修前必红）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f1-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    const joined = JSON.stringify(captured[0])
    const m = joined.match(/\[DESIGN-TOKEN:([0-9a-f-]+:\d+)\] and this exact designId: ([0-9a-f-]{36})\. Copy BOTH values verbatim/)
    assert.ok(m, "T1: 同段注入两值 + Copy BOTH values verbatim 锚句（修前无 designId）")
    assert.equal(m[2], entry.designId, "T1: 注入的 designId = 该评审实例 id（回显即真值）")
    assert.equal(parent._engDesignTokens?.get(entry.designId), m[1], "T1: 回显 token 与槽一致")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T2+T5 (vscode): settle 通过报告——id 回显保留 + 单槽省略指引 + 槽数时点注记（断言反转）+ 尾部同源锁", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f2-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { buildApprovedSuffix } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    const report = String(entry.report)
    assert.ok(report.includes(`designId: ${entry.designId} (pass as the designId parameter`), "T2: id 回显保留（单槽不吞 id——单→多迁移历史可查）")
    assert.ok(report.includes("optional while this session holds a single design"), "T2: spawn 可省略 designId 指引")
    assert.ok(report.includes("1 approved design slot(s) held as of this approval"), "T2: settle 时点槽数快照")
    assert.ok(report.includes("the count may have changed since"), "T2: spawn 时槽况可能已变注记（F2d 兑底）")
    assert.ok(report.endsWith(buildApprovedSuffix(entry.designToken, entry.designId, 1)), "T5: 尾部 = 引擎拼接（async 面同源锁）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T3 (vscode): prior 无原生 token 泄漏——token 两形态均不落实例 prior（designId 留 prior 无害）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f3-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    const runs = (parent.history ?? parent)._advisorRuns
    const prior = String(runs.get(entry.reviewId).priorOutput ?? "")
    assert.ok(!prior.includes(`[DESIGN-TOKEN:${entry.designToken}]`), "T3: 方括号形态不落 prior")
    assert.ok(!prior.includes(entry.designToken), "T3: 原生 token 不落 prior（引擎后缀精确截断——F2e）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T6 (vscode): stale settle 前缀——双语未签发提示不变（F2f 裁撤：不英文化）+ 无 token 两形态", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 200 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f6-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { recordFileMutation } = await import("../src/agent-tools/advisor-async.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    recordFileMutation(parent, join(cwd, "docs", "design", "A.md"))
    await waitSettle(entry)
    const report = String(entry.report)
    assert.ok(report.startsWith("评审目标已变更——token 未签发 (review target changed after launch"), "T6: stale 前缀双语形态锁（F2f 裁撤——不英文化）")
    assert.ok(!report.includes("[DESIGN-TOKEN:"), "T6: stale 报告无方括号 token")
    assert.ok(!report.includes(entry.designToken), "T6: stale 报告无原生 token")
    assert.ok(!(parent._engDesignTokens instanceof Map && parent._engDesignTokens.size > 0), "T6: stale 不签发")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T8 (vscode): round2+ 注入侧提示词无泄漏——prior 无旧 token 两形态，新 token 块在（F2a 注入段）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f8-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { prepareAdvisorMessages } = await import("../src/advisor/main.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    const runs = (parent.history ?? parent)._advisorRuns
    const prior = runs.get(entry.reviewId).priorOutput
    assert.ok(prior, "T8: 前轮 prior 在")
    // round2+ 消息构建（async 续跑同形态：rv 携带实例 prior——注入面 = messages 层）
    const msgs = prepareAdvisorMessages(parent, "design", "NEW-TOKEN", ["docs/design/A.md"], null, null, { round: 2, priorOutput: prior }, entry.designId)
    const content = msgs[1].content
    assert.ok(!content.includes(`[DESIGN-TOKEN:${entry.designToken}]`), "T8: 注入面无旧方括号 token")
    assert.ok(!content.includes(entry.designToken), "T8: 注入面无旧原生 token")
    assert.ok(content.includes("[DESIGN-TOKEN:NEW-TOKEN]"), "T8: 新 token 块在（re-approve 链）")
    assert.ok(content.includes(`this exact designId: ${entry.designId}`), "T8: 新 designId 同段在")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T15 (vscode): design round2+ 注入段——token + designId 两值同段（fail-when-unchanged：修前 VS 无注入段）", async () => {
  const { prepareAdvisorMessages } = await import("../src/advisor/main.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f15-"))
  try {
    const parent = {
      history: [], cwd, _touchedFiles: [], _advisorRound: 1, _lastAdvisorOutput: VS_FINDINGS,
      config: { agent: { engineering: true } },
    }
    const msgs = prepareAdvisorMessages(parent, "design", "TOK2", ["docs/design/A.md"], null, null, null, "D-1")
    const content = msgs[1].content
    assert.ok(content.includes("[DESIGN-TOKEN:TOK2]"), "T15: round2+ 注入新 token（可 re-approve——修前无）")
    assert.ok(content.includes("this exact designId: D-1"), "T15: round2+ 同段注入 designId（修前无）")
    assert.ok(content.includes("Copy BOTH values verbatim"), "T15: 锚句在")
    assert.ok(content.includes("## Documents to Review") && content.includes("docs/design/A.md"), "T15: 重锚文档范围")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T10 (vscode): 多槽交叉配对拒——designId A + token B → 拒（不静默 spawn 错设计）", async () => {
  const { resolveDesignSlot, authorizeEngCoderDesignToken } = await import("../src/agent-tools/subagent-spawn-gate.mjs")
  const parent = {
    _engDesignTokens: new Map([["id-a", "tok-a"], ["id-b", "tok-b"]]),
    _engDesignToken: "tok-a",
  }
  assert.equal(resolveDesignSlot(parent, "id-a").token, "tok-a", "T10: 槽 A 精确定位")
  assert.throws(() => authorizeEngCoderDesignToken(parent, "id-a", "tok-b"), /Invalid or missing design token/, "T10: 交叉配对拒（designId A + token B）")
})

slow("T9 (vscode): 端到端复现锁——评审员正文回显注入两值 → settle → 用正文回显 id spawn → 过（三次实测真回归）", async () => {
  // 独立 mock：正文照抄注入的 designId（F2a 注入前评审员只能自编 id——digest 回显 id
  // 三次各异 ≠ 登记槽——spawn 撞 designId not found——真现场）
  const captured = []
  const server = createServer((req, res) => {
    let text = ""
    req.on("data", (c) => (text += c))
    req.on("end", () => {
      const body = JSON.parse(text)
      captured.push(body.messages)
      const joined = JSON.stringify(body.messages)
      const token = joined.match(/([0-9a-f-]{36}:\d{13})/)?.[1] ?? "no-token"
      const id = joined.match(/and this exact designId: ([0-9a-f-]{36})/)?.[1] ?? "no-id"
      const content = `## Review\n\n设计通过。评审对象 designId: ${id}（正文回显——模型照抄注入值）。\n\n[DESIGN-TOKEN:${token}]`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      )
    })
  })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f9-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    const echoedId = String(entry.report).match(/designId: ([0-9a-f-]{36})（正文回显/)?.[1]
    assert.ok(echoedId, "T9: 评审员正文回显了注入的 designId（照抄真值）")
    assert.equal(echoedId, entry.designId, "T9: 正文回显 id = 尾部引擎拼接 id（注入消竞争值）")
    const { resolveDesignSlot } = await import("../src/agent-tools/subagent-spawn-gate.mjs")
    assert.equal(resolveDesignSlot(parent, echoedId).token, entry.designToken, "T9: 正文回显 id 可直接 spawn（端到端复现锁）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T11 (vscode): F2c 时效——单槽省略指引后第二槽获批 → 省略 spawn 撞多槽拒自愈（错误含列表）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f11-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { resolveDesignSlot } = await import("../src/agent-tools/subagent-spawn-gate.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const e1 = [...parent._asyncAdvisors.values()][0]
    await waitSettle(e1)
    assert.ok(String(e1.report).includes("optional while this session holds a single design"), "T11: 单槽时点指引可省略")
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/B.md"] })
    const e2 = [...parent._asyncAdvisors.values()].find((e) => e !== e1 && !e.done)
    await waitSettle(e2)
    assert.equal(parent._engDesignTokens.size, 2, "T11: 第二槽获批")
    assert.throws(
      () => resolveDesignSlot(parent, undefined),
      (e) => /Multiple approved designs/.test(e.message) && e.message.includes(e1.designId) && e.message.includes(e2.designId),
      "T11: 省略 spawn 撞多槽拒——错误列表自愈（F2d 兑底）",
    )
    assert.equal(resolveDesignSlot(parent, e1.designId).token, parent._engDesignTokens.get(e1.designId), "T11: 指定 id 照常可 spawn")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T12 (vscode): 挂起期 settle 镜像与多槽表同写落盘——resume round-trip 无 torn-state（F2g）", async () => {
  const { _setSessionsDirForTest, _resetSessionsDirForTest, newSlot, loadSlot } = await import("../src/extension/session-io.mjs")
  const sessionsTmp = mkdtempSync(join(tmpdir(), "tc-sess-f12-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f12-"))
  _setSessionsDirForTest(sessionsTmp)
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    const slot = newSlot(cwd)
    parent._engPersist = { cwd, slot }
    history._suspended = true // 挂起期 settle（无 onComplete agentState 通道——settle 直写 slot）
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    // 等 fire-and-forget 落盘（动态 import 异步——轮询 slot 字段出现）
    const t0 = Date.now()
    let data = null
    while (Date.now() - t0 < 3000) {
      data = loadSlot(cwd, slot)
      if (data?.engDesignTokens) break
      await new Promise((r) => setTimeout(r, 20))
    }
    assert.ok(data?.engDesignTokens, "T12: 多槽表落盘")
    assert.equal(data.engDesignTokens[entry.designId], entry.designToken, "T12: 槽值 = token")
    assert.equal(data.engDesignToken, entry.designToken, "T12: 镜像与多槽表同写（F2g——pre-fix 镜像缺失 → torn-state）")
    // resume round-trip：按恢复形态重建（setup 恢复链的字段面）→ spawn 门禁不撞 torn-state guard
    const restored = {
      _engDesignTokens: new Map(Object.entries(data.engDesignTokens)),
      _engDesignToken: data.engDesignToken,
    }
    const { resolveDesignSlot } = await import("../src/agent-tools/subagent-spawn-gate.mjs")
    assert.equal(resolveDesignSlot(restored, entry.designId).token, entry.designToken, "T12: 恢复后 spawn 可用（镜像在——torn-state guard 不触发）")
  } finally {
    _resetSessionsDirForTest()
    server.close()
    rmSync(sessionsTmp, { recursive: true, force: true })
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T13 (vscode): 并行两 design 各槽各注入——请求互不夹带对方 designId，槽各自独立", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 250 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f13-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/B.md"] })
    const [eA, eB] = [...parent._asyncAdvisors.values()]
    await Promise.all([waitSettle(eA), waitSettle(eB)])
    const joinedA = JSON.stringify(captured[0])
    const joinedB = JSON.stringify(captured[1])
    assert.ok(joinedA.includes(`this exact designId: ${eA.designId}`), "T13: A 请求注入 A 的 designId")
    assert.ok(joinedB.includes(`this exact designId: ${eB.designId}`), "T13: B 请求注入 B 的 designId")
    assert.ok(!joinedA.includes(`this exact designId: ${eB.designId}`), "T13: A 请求不夹带 B 的 id")
    assert.equal(parent._engDesignTokens.get(eA.designId), eA.designToken, "T13: A 槽 = A token")
    assert.equal(parent._engDesignTokens.get(eB.designId), eB.designToken, "T13: B 槽 = B token")
    assert.notEqual(eA.designToken, eB.designToken, "T13: 两 token 独立")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24b13 (vscode): 机械失败 settle（provider 故障文本）→ 不置 called——guard 不静默满足（CLI 同源——评审发现 #2）", async () => {
  const captured = []
  const FAIL = "Advisor: review failed (rate limit) — 429. Wait a moment and retry."
  const server = reviewServer(captured, { reply: FAIL })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f13b-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "code", paths: ["src/a.mjs"] })
    const entry = [...parent._asyncAdvisors.values()][0]
    await waitSettle(entry)
    assert.equal(parent._calledAdvisorThisRun, false, "T-24b13: 机械失败 settle 不置 called（guard 仍推回——防静默满足）")
    const runs = (parent.history ?? parent)._advisorRuns
    assert.equal(runs.get(entry.reviewId).round, 1, "T-24b13: 尝试仍耗轮次（cap 有界）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-24b13b (vscode): error settle（rejection 路径——result=null 带 error）→ code 评审不置 called（复评补边）", async () => {
  const { settleAdvisorReview, advisorRunsMap } = await import("../src/agent-tools/advisor-async.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f13c-"))
  try {
    const { parent } = advParent(0)
    const runs = advisorRunsMap(parent, true)
    runs.set("r1", { reviewId: "r1", reviewType: "code", scopeKey: JSON.stringify([]), round: 0, priorOutput: null, stale: false, state: "running", designId: null })
    const entry = {
      id: 1, role: "advisor", status: "done", reviewType: "code", reviewId: "r1", round: 1,
      documents: null, paths: null, object: null, designId: null, designToken: null,
      done: true, report: null, error: null, cancelled: false,
      controller: { signal: { aborted: false } },
      eventsAtLaunch: 0, cwd,
      _onCancelled: () => {}, _onTerminal: () => {},
      _resolve: () => {}, settled: Promise.resolve(),
    }
    settleAdvisorReview(parent, entry, null, "transport boom", null)
    assert.equal(parent._calledAdvisorThisRun, false, "error settle 不置 called（无评审判定——guard 仍推回）")
    assert.equal(runs.get("r1").round, 1, "尝试仍耗轮次（cap 有界）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("F2h 写法变体 (vscode): 同文档集换写法（\"./\" 前缀）→ sync 复审沿用同 designId（scope 键归一——评审发现 #3）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f3c-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { parent } = advParent(port)
    const ctx = advCtx(parent, cwd)
    const out1 = String(await advisorTool.execute({ type: "design", documents: ["docs/design/A.md"], async: false }, ctx))
    const id1 = out1.match(/designId: ([0-9a-f-]{36})/)?.[1]
    assert.ok(id1, "首评 designId")
    const out2 = String(await advisorTool.execute({ type: "design", documents: ["./docs/design/A.md"], async: false }, ctx))
    const id2 = out2.match(/designId: ([0-9a-f-]{36})/)?.[1]
    assert.equal(id2, id1, "F2h 写法变体：\"./\" 前缀仍沿用同 designId（scope 键归一——pre-fix 开新 id）")
    assert.equal(parent._engDesignTokens.size, 1, "无新槽（同 id 覆写——旧 token 拒）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T14 (vscode): 同 scope 复审通过 → 槽覆写同 designId → 旧 token spawn 拒（F2h——旧槽 TTL 前不残留）", async () => {
  const captured = []
  const server = reviewServer(captured, { pass: true, delayMs: 150 })
  const port = await listen(server)
  const cwd = mkdtempSync(join(tmpdir(), "tc-adv-f14-"))
  try {
    const { advisorTool } = await import("../src/agent-tools/advisor.mjs")
    const { authorizeEngCoderDesignToken } = await import("../src/agent-tools/subagent-spawn-gate.mjs")
    const { parent, history } = advParent(port)
    history._suspended = true
    const ctx = advCtx(parent, cwd)
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const e1 = [...parent._asyncAdvisors.values()][0]
    await waitSettle(e1)
    const token1 = e1.designToken
    assert.equal(parent._engDesignTokens.get(e1.designId), token1, "T14: 首评通过入槽")
    // 复审（同 scope——async 实例解析沿用 settled 记录同 designId——新 token 覆写同槽）
    await launch(advisorTool, parent, ctx, { type: "design", documents: ["docs/design/A.md"] })
    const e2 = [...parent._asyncAdvisors.values()].find((e) => e !== e1 && !e.done)
    await waitSettle(e2)
    assert.equal(e2.designId, e1.designId, "T14: 同 scope 复审沿用同 designId")
    const token2 = parent._engDesignTokens.get(e1.designId)
    assert.ok(token2 && token2 !== token1, "T14: 新 token 覆写同 id 槽")
    assert.equal(parent._engDesignTokens.size, 1, "T14: 无新槽残留（F2h）")
    assert.throws(() => authorizeEngCoderDesignToken(parent, e1.designId, token1), /Invalid or missing design token/, "T14: 旧 token 拒（同 scope 复审后旧 token 失效）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})
