/**
 * traces.test.mjs — §18.6 完整轨迹存档测试（AGENT-LOOP.md §18.6 T-TR1..T-TR14）。
 * 双轨：① recordChatTrace 纯函数用例（mock chat 输入输出——N-TR5 单测独立）；
 * ② 真实 chat() 出口集成（本地 SSE mock server——证明唯一采集点接线 + 错误路径落盘
 * + 续写链 isContinuation 标记 T-TR14 + 三调用点开关透传 T-TR13）。
 * 测试隔离：THINCODER_TRACES_DIR 指向临时目录（与 THINCODER_LOG_DIR 同惯例——
 * trace-store 写门：NODE_TEST_CONTEXT 下无 override 不写盘）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"
import { localDateStr } from "../src/traces/trace-store.mjs"

async function loadTraceStore() {
  return import("../src/traces/trace-store.mjs")
}

/** 设隔离目录（每次测试独立 tmp），finally 清理。 */
function isolateDir(fn) {
  return async (...args) => {
    const dir = mkdtempSync(join(tmpdir(), "cli-traces-"))
    process.env.THINCODER_TRACES_DIR = join(dir, "traces")
    try {
      await fn(dir, ...args)
    } finally {
      delete process.env.THINCODER_TRACES_DIR
      rmSync(dir, { recursive: true, force: true })
    }
  }
}

/** 当日（本地——与 trace-store 同日切分口径一致：D-TR3 fix round1 本地日期）轨迹
 *  目录下全部 jsonl 记录 */
function readRecords() {
  const dayDir = join(process.env.THINCODER_TRACES_DIR, localDateStr())
  if (!existsSync(dayDir)) return []
  return readdirSync(dayDir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .map((f) => ({ name: f, record: JSON.parse(readFileSync(join(dayDir, f), "utf8")) }))
}

/** 轨迹根（THINCODER_TRACES_DIR）下 jsonl 计数——含未建目录情况 */
function countRecords() {
  const dayDir = join(process.env.THINCODER_TRACES_DIR, localDateStr())
  if (!existsSync(dayDir)) return 0
  return readdirSync(dayDir).filter((f) => f.endsWith(".jsonl")).length
}

/** 轮询等待（异步写盘 fire-and-forget——集成用例等文件落定；超时 2s）。 */
async function waitFor(fn, timeoutMs = 2000) {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > timeoutMs) throw new Error("waitFor timeout")
    await new Promise((r) => setTimeout(r, 10))
  }
}

/** 等 N 条完整可解析记录：appendFile 先建文件后写内容——文件存在 ≠ 内容写完
 *  （JSON.parse 会空文件炸——T-TR13 实测）——解析兜底重试才是"落定"语义。 */
async function waitForRecords(n, timeoutMs = 2000) {
  await waitFor(() => {
    try {
      return readRecords().length === n
    } catch {
      return false // 写盘在途（空/半文件）——继续等
    }
  }, timeoutMs)
}

const mockProvider = { name: "mock", model: "mock-model" }
const mockOpts = (extra = {}) => ({
  messages: [{ role: "user", content: "hello" }],
  logCtx: { stage: "turn", turn: 1, child: null, role: null, depth: 0, kind: "turn", session: "s-1", cwd: "C:/proj", ...(extra.logCtx ?? {}) },
  ...(extra.opts ?? {}),
})
const mockResult = (extra = {}) => ({
  content: "answer text",
  reasoning: "reasoning text",
  toolCalls: [{ id: "call_1", name: "read", arguments: JSON.stringify({ path: "a.mjs" }) }],
  usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  finishReason: "stop",
  ...extra,
})

test("T-TR1: recordChatTrace 成功路径——完整字段落盘（messages/content/reasoning/toolCalls/usage）",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    await recordChatTrace(mockProvider, mockOpts(), mockResult(), null)
    const all = readRecords()
    assert.equal(all.length, 1, "恰好一个轨迹文件")
    assert.match(all[0].name, /^[0-9a-f]{12}-\d+\.jsonl$/, "文件名 <sessionKey>-<seq>.jsonl")
    const r = all[0].record
    assert.equal(r.provider, "mock")
    assert.equal(r.model, "mock-model")
    assert.equal(r.stage, "turn")
    assert.equal(r.kind, "turn")
    assert.equal(r.messages.length, 1)
    assert.equal(r.messages[0].content, "hello")
    assert.equal(r.content, "answer text")
    assert.equal(r.reasoning, "reasoning text")
    assert.equal(r.toolCalls[0].name, "read")
    assert.deepEqual(r.usage, { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 })
    assert.equal(r.finishReason, "stop")
    assert.equal(r.error, undefined)
    assert.equal(r.round, undefined, "round 字段已删（无来源字段——fix round1）")
    assert.equal(r.isContinuation, false, "新调用 isContinuation:false——T-TR14 缺省")
    assert.equal(r.cwdHash.length, 40)
  }))

test("T-TR2: advisor 调用（logCtx.stage=advisor）→ stage 元数据正确 + kind=advisor",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    await recordChatTrace(mockProvider, mockOpts({ logCtx: { stage: "advisor", role: "eng-coder", kind: "advisor", session: "s-1", cwd: "C:/proj" } }), mockResult(), null)
    const r = readRecords()[0].record
    assert.equal(r.stage, "advisor", "T-TR2: advisor 轨迹 stage:advisor")
    assert.equal(r.kind, "advisor", "T-TR2: kind=advisor")
    assert.equal(r.role, "eng-coder", "T-TR2: 调用方角色透出（eng-coder 内嵌评审）")
  }))

test("T-TR3: 子代理调用（depth>0）→ depth + role 元数据正确（审计 explore 可对回）",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    await recordChatTrace(mockProvider, mockOpts({ logCtx: { stage: "turn", turn: 2, child: "explore#3", role: "explore", depth: 2, kind: "subagent", session: "s-1", cwd: "C:/proj" } }), mockResult(), null)
    const r = readRecords()[0].record
    assert.equal(r.depth, 2, "T-TR3: depth 元数据")
    assert.equal(r.role, "explore", "T-TR3: role 元数据——审计 explore 对回")
    assert.equal(r.kind, "subagent")
    assert.equal(r.turn, 2)
  }))

test("T-TR4: messages 含 apiKey/designtoken/password 字段 → 落盘值遮蔽（复用 log.mjs 黑名单）",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    const messages = [
      { role: "user", content: "hi" },
      { role: "user", content: "cfg", apiKey: "sk-real-key-123456", designtoken: "tok-abc", password: "pw-xyz", authorization: "Bearer abcdef123456" },
    ]
    await recordChatTrace(mockProvider, mockOpts({ opts: { messages } }), mockResult(), null)
    const r = readRecords()[0].record
    assert.equal(r.messages[1].apiKey, "[REDACTED]", "T-TR4: apiKey 遮蔽")
    assert.equal(r.messages[1].designtoken, "[REDACTED]", "T-TR4: designtoken 遮蔽")
    assert.equal(r.messages[1].password, "[REDACTED]", "T-TR4: password 遮蔽")
    assert.equal(r.messages[1].authorization, "[REDACTED]", "T-TR4: authorization 遮蔽")
  }))

test("T-TR5: reasoning 含 Bearer sk-xxx 形态 → 落盘值遮蔽（SECRET_FORM 扫描）",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    await recordChatTrace(mockProvider, mockOpts(), mockResult({ reasoning: "the key is Bearer sk-abcdefghijkl and more" }), null)
    const r = readRecords()[0].record
    assert.ok(!r.reasoning.includes("sk-abcdefghijkl"), "T-TR5: sk- 形态不落盘")
    assert.ok(r.reasoning.includes("[redacted]"), "T-TR5: 截断标记存在")
    assert.ok(r.reasoning.startsWith("the key is "), "T-TR5: 截断到形态前")
  }))

test("T-TR6: 落盘失败（目录不可写/IO 错误）→ 静默降级，不抛错",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    // 用同名文件占住 traces 根——mkdirSync recursive 失败（ENOTDIR/EEXIST 路径）
    writeFileSync(join(root, "traces"), "i am a file, not a dir")
    let threw = false
    try {
      await recordChatTrace(mockProvider, mockOpts(), mockResult(), null)
    } catch {
      threw = true
    }
    assert.equal(threw, false, "T-TR6: 落盘失败不抛错（fire-and-forget）")
    assert.equal(countRecords(), 0, "T-TR6: 无轨迹文件")
  }))

test("T-TR7: traces.enabled:false（logCtx.traces=false）→ 不落盘（默认 true——开关可控）",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    await recordChatTrace(mockProvider, mockOpts({ logCtx: { stage: "turn", turn: 1, child: null, role: null, depth: 0, kind: "turn", session: "s-1", cwd: "C:/proj", traces: false } }), mockResult(), null)
    assert.equal(countRecords(), 0, "T-TR7: 关 = 不落盘")
    // 缺省（无 traces 字段）= on——T-TR8 覆写前先验默认 on
    await recordChatTrace(mockProvider, mockOpts(), mockResult(), null)
    assert.equal(countRecords(), 1, "T-TR7: 缺省 enabled（默认 on）")
  }))

test("T-TR8: 同会话两调用 → 两次写不同 seq 号（递增不覆盖）",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    await recordChatTrace(mockProvider, mockOpts(), mockResult({ content: "first" }), null)
    await recordChatTrace(mockProvider, mockOpts(), mockResult({ content: "second" }), null)
    const all = readRecords()
    assert.equal(all.length, 2)
    assert.match(all[0].name, /-1\.jsonl$/, "首个 seq=1")
    assert.match(all[1].name, /-2\.jsonl$/, "第二个 seq=2")
    assert.equal(all[0].record.content, "first")
    assert.equal(all[1].record.content, "second")
    // 并发（不 await 第一个——fire-and-forget 在途）仍不撞号：同步预留原子
    await Promise.all([
      recordChatTrace(mockProvider, mockOpts(), mockResult({ content: "c1" }), null),
      recordChatTrace(mockProvider, mockOpts(), mockResult({ content: "c2" }), null),
    ])
    const all2 = readRecords()
    assert.equal(all2.length, 4, "并发两调用各得独立号位——无覆写")
    assert.deepEqual(all2.map((f) => f.name.match(/-(\d+)\.jsonl$/)[1]), ["1", "2", "3", "4"], "seq 连续 1..4")
  }))

test("T-TR9: 超大内容（长 reasoning/大 messages）→ 不截断——单文件可大（用户接受）",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    const long = "r".repeat(300_000)
    await recordChatTrace(mockProvider, mockOpts(), mockResult({ reasoning: long }), null)
    const r = readRecords()[0].record
    assert.equal(r.reasoning.length, 300_000, "T-TR9: reasoning 全量不截断")
  }))

test("T-TR10: 跨会话/进程重启（同 cwd、同日）→ 新轨迹 seq = 当日目录 max+1——不覆写既有旧轨迹",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    // 会话 A（先前进程）已写 seq 1
    await recordChatTrace(mockProvider, mockOpts(), mockResult({ content: "session A" }), null)
    // 会话 B（另一进程/会话——session 字段不同、cwd 同日相同）——seq 必须 = max+1
    await recordChatTrace(mockProvider, mockOpts({ logCtx: { stage: "turn", turn: 1, child: null, role: null, depth: 0, kind: "turn", session: "s-2-B", cwd: "C:/proj" } }), mockResult({ content: "session B" }), null)
    const all = readRecords()
    assert.equal(all.length, 2, "T-TR10: 不覆写——两个文件都在")
    assert.match(all[1].name, /-2\.jsonl$/, "T-TR10: 新轨迹 seq = 当日目录 max+1")
    assert.equal(all[0].record.content, "session A")
    assert.equal(all[1].record.content, "session B")
  }))

test("T-TR11: 错误路径——recordChatTrace 错误入轨迹（error.err + 类别 + finishReason:null），不阻塞主流程",
  isolateDir(async (root) => {
    const { recordChatTrace } = await loadTraceStore()
    let threw = false
    try {
      await recordChatTrace(mockProvider, mockOpts(), null, new Error("provider boom"))
    } catch {
      threw = true
    }
    assert.equal(threw, false, "T-TR11: 错误路径收集不抛错")
    const r = readRecords()[0].record
    assert.equal(r.finishReason, null, "T-TR11: finishReason:null")
    assert.ok(r.error.err.includes("provider boom"), "T-TR11: error.err 截断文本")
    assert.equal(r.error.kind, "error", "T-TR11: 错误类别（classifyErr）")
    assert.equal(r.content, null)
  }))

test("T-TR12: 本地时间 00:00-08:00 调用（UTC 尚在前一日）→ 落盘目录按本地日期（fix round1）",
  isolateDir(async (root) => {
    const { recordChatTrace, localDateStr, _traceHooks } = await loadTraceStore()
    const origNow = _traceHooks.now
    try {
      // 构造本地时刻使 本地日 ≠ UTC 日（任意时区：本地午夜 00:30 或前一晚 23:30
      // 至少一侧错位；仅纯 UTC+0 时区两者恒等——无分日错位可验，本地日断言仍成立）
      let fake = new Date(2026, 8, 4, 0, 30, 0)
      if (localDateStr(fake) === fake.toISOString().slice(0, 10)) fake = new Date(2026, 8, 3, 23, 30, 0)
      const localDay = localDateStr(fake)
      const utcDay = fake.toISOString().slice(0, 10)
      _traceHooks.now = () => new Date(fake)
      await recordChatTrace(mockProvider, mockOpts(), mockResult(), null)
      const localDir = join(process.env.THINCODER_TRACES_DIR, localDay)
      assert.equal(
        existsSync(localDir) && readdirSync(localDir).some((f) => f.endsWith(".jsonl")),
        true,
        "T-TR12: 轨迹落本地日期目录（非 UTC 日期）",
      )
      if (localDay !== utcDay) {
        const utcDir = join(process.env.THINCODER_TRACES_DIR, utcDay)
        assert.equal(
          !existsSync(utcDir) || !readdirSync(utcDir).some((f) => f.endsWith(".jsonl")),
          true,
          "T-TR12: 不落 UTC 日期目录",
        )
      }
    } finally {
      _traceHooks.now = origNow
    }
  }))

test("T-TR13: traces.enabled:false + goal/distill/cmd-mcp 调用点 → 不落盘（开关透传全覆盖——fix round1）",
  isolateDir(async (root) => {
    // 三调用点共用 400 mock server：chat() 立即抛（非重试态）——穿透真实 chat() 出口
    // （采集点唯一——N-TR2）验证开关闭环；失败路径同时验证 D-TR5 错误轨迹（开侧）
    const errServer = createServer((req, res) => {
      req.resume()
      req.on("end", () => {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: { message: "bad request" } }))
      })
    })
    await new Promise((r) => errServer.listen(0, "127.0.0.1", r))
    const port = errServer.address().port
    const provider = { name: "mock", baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    try {
      // --- goal（agent-tools/goal.mjs——judge chat 调用点）---
      const { goalTool } = await import("../src/agent-tools.mjs")
      const mkAgent = (tracesOn) => ({
        provider,
        history: [
          { role: "assistant", content: "a1" },
          { role: "assistant", content: "a2" },
          { role: "assistant", content: "a3" },
          { role: "assistant", content: "a4" },
        ],
        goal: { objective: "o", criteria: "c", status: "active" },
        config: { traces: { enabled: tracesOn } },
        cwd: "C:/proj",
      })
      const off1 = await goalTool.execute({ action: "complete" }, { agent: mkAgent(false), depth: 0 })
      assert.match(off1, /Goal verified complete/)
      assert.equal(countRecords(), 0, "T-TR13-goal: 关 = 不落盘")
      const on1 = await goalTool.execute({ action: "complete" }, { agent: mkAgent(true), depth: 0 })
      assert.match(on1, /Goal verified complete/)
      await waitForRecords(1)
      // 注：distill 记录 cwd 回退 process.cwd()（sessionKey 不同）——按 stage 定位不按索引
      const goalRec = readRecords().find((f) => f.record.stage === "goal")
      assert.ok(goalRec, "T-TR13-goal: 开 = 落盘且元数据正确")
      assert.ok(goalRec.record.error, "T-TR13-goal: 错误路径轨迹（D-TR5——400 穿透）")
      // --- distill（distill.mjs——extractCandidates chat 调用点）---
      const { extractCandidates } = await import("../src/distill.mjs")
      await assert.rejects(extractCandidates(provider, "transcript", { traces: false }), /LLM API error 400/)
      assert.equal(countRecords(), 1, "T-TR13-distill: 关 = 不落盘")
      await assert.rejects(extractCandidates(provider, "transcript", { traces: true }), /LLM API error 400/)
      await waitForRecords(2)
      assert.ok(readRecords().some((f) => f.record.stage === "distill"), "T-TR13-distill: 开 = 落盘")
      // --- cmd-mcp（tui/cmd-mcp.mjs——/mcp ai 生成 chat 调用点）---
      const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
      const mkCtx = (tracesOn) => ({
        agent: { provider, config: { traces: { enabled: tracesOn }, mcp: { servers: [] } }, tools: [], cwd: "C:/proj" },
        pushLine: () => {}, pushLabel: () => {}, showPicker: async () => null,
        askQuestion: async () => "a filesystem server that gives access to /tmp",
        persistRaw: async (mutate) => mutate({ mcp: { servers: [] } }),
      })
      await handleMcpCommand(mkCtx(false), ["ai"])
      assert.equal(countRecords(), 2, "T-TR13-mcp: 关 = 不落盘")
      await handleMcpCommand(mkCtx(true), ["ai"])
      await waitForRecords(3)
      assert.ok(readRecords().some((f) => f.record.stage === "mcp"), "T-TR13-mcp: 开 = 落盘")
    } finally {
      errServer.close()
    }
  }))

test("T-TR14: 续写/重试链 → isContinuation:true 标记（新调用 false——fix round1）",
  isolateDir(async (root) => {
    const { chat } = await import("../src/provider/index.mjs")
    let requests = 0
    // kimi-k3（partialMode——续写不走 /beta 重写）：首轮 length 截断 → 续写子请求正常完成
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", () => {
        requests++
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        if (requests === 1) {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "part one " } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "length" }] })}\n\n` +
            `data: [DONE]\n\n`,
          )
        } else {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "part two" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            `data: [DONE]\n\n`,
          )
        }
      })
    })
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    try {
      const provider = { name: "mock", baseURL: `http://127.0.0.1:${server.address().port}`, apiKey: "x", model: "kimi-k3" }
      const logCtx = { stage: "turn", turn: 1, child: null, role: null, depth: 0, kind: "turn", session: "s-cont", cwd: "C:/proj" }
      const res = await chat(provider, { messages: [{ role: "user", content: "hi" }], logCtx })
      assert.equal(res.content, "part one part two", "T-TR14: 续写合并（出口全量）")
      await waitForRecords(2)
      const all = readRecords()
      const sub = all.find((f) => f.record.content === "part two")
      const outer = all.find((f) => f.record.content === "part one part two")
      assert.ok(sub && outer, "T-TR14: 续写子请求 + 外层合并各一条轨迹")
      assert.equal(sub.record.isContinuation, true, "T-TR14: 续写子请求 isContinuation:true")
      assert.equal(outer.record.isContinuation, false, "T-TR14: 新调用（外层）isContinuation:false")
    } finally {
      server.close()
    }
  }))

test("T-TR1/T-TR11 集成: 真实 chat() 出口——成功 + 失败路径均落盘（唯一采集点接线）",
  isolateDir(async (root) => {
    // 成功路径：单帧 SSE 完成
    const okServer = createServer((req, res) => {
      req.resume()
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "hello trace" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`,
        )
      })
    })
    await new Promise((r) => okServer.listen(0, "127.0.0.1", r))
    const okPort = okServer.address().port
    try {
      const { chat } = await import("../src/provider/core.mjs")
      const provider = { name: "mock", baseURL: `http://127.0.0.1:${okPort}`, apiKey: "x", model: "m" }
      const res = await chat(provider, { messages: [{ role: "user", content: "ping" }], logCtx: { stage: "turn", turn: 1, child: null, role: null, depth: 0, kind: "turn", session: "s-int", cwd: "C:/proj" } })
      assert.equal(res.content, "hello trace")
      await waitForRecords(1) // 异步写盘 fire-and-forget——等落定
      const okRecords = readRecords()
      assert.equal(okRecords.length, 1, "集成: 成功路径经 chat() 出口落盘")
      assert.equal(okRecords[0].record.content, "hello trace")
      assert.equal(okRecords[0].record.messages[0].content, "ping")
      assert.equal(okRecords[0].record.finishReason, "stop")
    } finally {
      okServer.close()
    }
    // 失败路径：400（非重试——立即抛）→ 错误轨迹落盘且 chat() 照常抛错
    const errServer = createServer((req, res) => {
      req.resume()
      req.on("end", () => {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: { message: "bad request" } }))
      })
    })
    await new Promise((r) => errServer.listen(0, "127.0.0.1", r))
    const errPort = errServer.address().port
    try {
      const { chat } = await import("../src/provider/core.mjs")
      const provider = { name: "mock", baseURL: `http://127.0.0.1:${errPort}`, apiKey: "x", model: "m" }
      await assert.rejects(
        chat(provider, { messages: [{ role: "user", content: "boom" }], logCtx: { stage: "turn", turn: 2, child: null, role: null, depth: 0, kind: "turn", session: "s-int", cwd: "C:/proj" } }),
        /LLM API error 400/,
      )
      await waitForRecords(2) // 失败轨迹异步落盘——等落定
      const errRecords = readRecords()
      assert.equal(errRecords.length, 2, "集成: 失败路径经 chat() 出口落盘")
      const errRec = errRecords.find((f) => f.name.endsWith("-2.jsonl"))
      assert.ok(errRec, "第二个轨迹 = 错误路径")
      assert.equal(errRec.record.finishReason, null)
      assert.ok(errRec.record.error.err.includes("LLM API error 400"))
      assert.equal(errRec.record.error.kind, "error")
    } finally {
      errServer.close()
    }
  }))
