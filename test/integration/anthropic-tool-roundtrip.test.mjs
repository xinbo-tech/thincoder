/**
 * anthropic-tool-roundtrip.test.mjs — 集成场景 G1–G3（设计：`docs/core/design/PROVIDER.md` §6.28）：
 * 配了 Anthropic 原生通道的会话，用过工具之后还能继续对话。
 * 生产现象（GitHub #20 ∥ Gitee IKKJEE）：带工具的多轮对话，第二轮必被上游
 * `400 Unexpected role "tool"`（网关包装为 502）——毒在历史里，重开会话也不解决。
 *
 * 业务入口 = 真 CLI 子进程 `node bin/thincoder.mjs acp`：本仓 CLI 里唯一同时具备
 * 「会话流」「多轮」「进程重开 + 历史从盘上回放」三项的用户入口（`chat` 一次性且不落会话，
 * TUI 需要真 TTY）；本档扮演 ACP 客户端（NDJSON JSON-RPC）。
 *
 * 模型侧 = 本地脚本化假 Anthropic 端点（零外网、零付费端点）：按 Messages API 回
 * 「tool_use 回合」与「文本回合」两态；文本由本进程实际收到的 tool_result 拼成，
 * 因此「模型看见过工具结果」「历史是否回放」都落在回复文本里——断言不必窥探内部形态。
 *
 * 可证伪点（G1–G3 同一判据）：`messages[].role` 只收 user / assistant——出现其它 role
 * （含 `role:"tool"`，即 OpenAI 形历史漏进请求体）按上游语义回 400
 * `Unexpected role "<role>"`。转换层没把历史改成 tool_use / tool_result，本档即红。
 *
 * 断言只落在业务可观察结果：会话流出现工具调用与结果、模型给出引用结果的回复、
 * 全程无 400 ∥ 502。块结构等内部形态由单元层（§6.27 T-1–T-16）断言，两层不重复。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI_ENTRY = join(HERE, "..", "..", "thincoder-cli", "bin", "thincoder.mjs")
/** 单个场景的上限（一次真进程装配 + 两回合；须覆盖下面两个回合上限之和，否则卡死时报的是裸测试超时）。 */
const SCENE_TIMEOUT_MS = 240_000
/** 一句对话的上限（进程已起好，只等回合走完；本地假端点，不需要长窗）。 */
const TURN_TIMEOUT_MS = 90_000

// ---------- 假 Anthropic 端点（Messages API · SSE · 零外网）----------

const jsonReply = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(payload))
}

const sseReply = (res, events) => {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" })
  for (const [name, data] of events) res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
  res.end()
}

const blocksOf = (message) => (Array.isArray(message?.content) ? message.content : [])

/** 请求体里出现过的全部 tool_result 文本（模型上一回合拿到的工具结果）。 */
const toolResultTexts = (messages) => messages.flatMap((m) => blocksOf(m)
  .filter((b) => b?.type === "tool_result")
  .map((b) => String(b.content)))

/** 客户端最后一句真实发问（跳过 `[System reminder:` 开头的机器注入）。 */
const lastQuestion = (messages) => messages
  .filter((m) => m?.role === "user")
  .flatMap((m) => blocksOf(m).filter((b) => b?.type === "text").map((b) => String(b.text)))
  .filter((t) => !t.startsWith("[System reminder"))
  .at(-1) ?? "(no question)"

const replyText = (messages, results) => `Answer to "${lastQuestion(messages)}": ${results.length > 0 ? results.join(" / ") : "no tool results"}`

const messageStart = { type: "message_start", message: { id: "msg_fake", type: "message", role: "assistant", model: "claude-fake-1", content: [], usage: { input_tokens: 20, output_tokens: 1 } } }

/** 工具回合：一条 assistant 消息、每个调用一个 tool_use 块（≥2 个即 §6.28 G2 的一轮多调用）。 */
const toolUseEvents = (calls) => {
  const events = [["message_start", messageStart]]
  calls.forEach((call, index) => {
    events.push(["content_block_start", { type: "content_block_start", index, content_block: { type: "tool_use", id: call.id, name: call.name, input: {} } }])
    events.push(["content_block_delta", { type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(call.input ?? {}) } }])
    events.push(["content_block_stop", { type: "content_block_stop", index }])
  })
  events.push(["message_delta", { type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 10 } }])
  events.push(["message_stop", { type: "message_stop" }])
  return events
}

/** 文本回合（正常收尾）。 */
const textEvents = (text) => [
  ["message_start", messageStart],
  ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }],
  ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }],
  ["content_block_stop", { type: "content_block_stop", index: 0 }],
  ["message_delta", { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: text.length } }],
  ["message_stop", { type: "message_stop" }],
]

/**
 * 起本地假 Anthropic 端点，返回 `{ port, requests, rejections, close }`。
 * `calls` = **首个模型请求**派发的工具调用；其后一律文本回合（一回合一个请求，不重派）。
 * 回合上限是有意为之：若转换层退化成「角色合法、但 assistant 的 tool_use 没了」，这里直接回文本，
 * 回复里没有工具结果，断言当场给出可读失败，而不是反复派工具直到超时。
 */
function fakeAnthropic({ calls = [] } = {}) {
  const requests = []
  const rejections = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => (raw += chunk))
    req.on("end", () => {
      let body
      try {
        body = JSON.parse(raw)
      } catch {
        return jsonReply(res, 400, { type: "error", error: { type: "invalid_request_error", message: "request body is not valid JSON" } })
      }
      requests.push({ url: req.url, body })
      const messages = Array.isArray(body.messages) ? body.messages : []
      // 上游语义：messages 只收 user / assistant 两种 role（`role:"tool"` 在此被拒）
      const offending = messages.find((m) => m?.role !== "user" && m?.role !== "assistant")
      if (offending) {
        const message = `messages: Unexpected role "${offending.role}". Each message must have a role of "user" or "assistant".`
        rejections.push(message)
        return jsonReply(res, 400, { type: "error", error: { type: "invalid_request_error", message } })
      }
      if (calls.length > 0 && requests.length === 1) return sseReply(res, toolUseEvents(calls))
      return sseReply(res, textEvents(replyText(messages, toolResultTexts(messages))))
    })
  })
  const ready = new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)))
  return ready.then((port) => ({
    port,
    requests,
    rejections,
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.()
      server.close(() => resolve())
    }),
  }))
}

// ---------- 真 CLI 子进程（ACP 客户端驱动器）----------

/** 关掉 CLI 进程并等它真的退出；不退出则在宽限后强杀（清理不得把收尾挂住）。 */
const stopProcess = (child) => new Promise((resolve) => {
  if (child.exitCode !== null || child.signalCode !== null) return resolve()
  const force = setTimeout(() => child.kill("SIGKILL"), 5_000)
  force.unref?.()
  child.once("close", () => { clearTimeout(force); resolve() })
  child.kill()
})

/**
 * 起一个真 CLI 子进程（`acp` 命令）并返回 JSON-RPC 客户端面。
 * 隔离：HOME ∥ USERPROFILE 指向假家目录（config.json 与 sessions 都落在其中）。
 */
function startCli({ home, cwd }) {
  const child = spawn(process.execPath, [CLI_ENTRY, "acp"], {
    cwd,
    env: { ...process.env, HOME: home, USERPROFILE: home },
    stdio: ["pipe", "pipe", "pipe"],
  })
  const messages = []
  const pending = new Map()
  let buffer = ""
  let stderr = ""
  let nextId = 1
  let exited = false

  const send = (obj) => child.stdin.write(JSON.stringify(obj) + "\n")
  // 子进程已死时对 pipe 的写入会抛 unhandled `error`（EPIPE）——吞掉，交给 `exited` 报可读错
  child.stdin.on("error", () => {})

  child.on("close", () => {
    exited = true
    for (const waiter of pending.values()) waiter({ error: { message: "CLI process exited before responding" } })
    pending.clear()
  })
  child.stderr.setEncoding("utf8")
  child.stderr.on("data", (chunk) => { stderr += chunk })
  child.stdout.setEncoding("utf8")
  child.stdout.on("data", (chunk) => {
    buffer += chunk
    for (let nl = buffer.indexOf("\n"); nl >= 0; nl = buffer.indexOf("\n")) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line) continue
      let msg
      try {
        msg = JSON.parse(line)
      } catch {
        continue // 非协议行（诊断输出）不参与协议
      }
      messages.push(msg)
      // agent → client 反向请求：按真实客户端应答（本套件的工具全为只读，正常零到达）
      if (msg.method !== undefined && msg.id !== undefined) {
        const result = msg.method === "session/request_permission"
          ? { outcome: { outcome: "selected", optionId: "approve_once" } }
          : {}
        send({ jsonrpc: "2.0", id: msg.id, result })
        continue
      }
      if (msg.id !== undefined && pending.has(msg.id)) {
        const waiter = pending.get(msg.id)
        pending.delete(msg.id)
        waiter(msg)
      }
    }
  })

  const request = (method, params, timeoutMs = 120_000) => new Promise((resolve, reject) => {
    if (exited) return reject(new Error(`CLI 已退出，无法发送 ${method}｜stderr: ${stderr.slice(-1500)}`))
    const id = nextId++
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`ACP ${method} 超时 ${timeoutMs}ms｜stderr: ${stderr.slice(-1500)}`))
    }, timeoutMs)
    pending.set(id, (msg) => {
      clearTimeout(timer)
      resolve(msg)
    })
    send({ jsonrpc: "2.0", id, method, params })
  })

  const updates = () => messages
    .filter((m) => m.method === "session/update")
    .map((m) => m.params?.update)
    .filter(Boolean)

  return {
    child,
    request,
    updates,
    get stderr() { return stderr },
    /** 第 `from` 条 update 之后的助手文本（会话流里的模型回复）。 */
    textSince: (from) => updates().slice(from)
      .filter((u) => u.sessionUpdate === "agent_message_chunk" && u.content?.type === "text")
      .map((u) => String(u.content.text))
      .join(""),
    stop: () => stopProcess(child),
  }
}

// ---------- 场景骨架 ----------

/** 一次集成场景的隔离现场：假家目录（config + sessions）、临时项目目录、假 Anthropic 端点。 */
async function scene(t, { files = {}, calls = [] } = {}) {
  const home = mkdtempSync(join(tmpdir(), "tc-int-anthropic-home-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-anthropic-proj-"))
  const endpoint = await fakeAnthropic({ calls })
  const children = []
  t.after(async () => {
    for (const cli of children) await cli.stop()
    await endpoint.close()
    rmSync(home, { recursive: true, force: true })
    rmSync(cwd, { recursive: true, force: true })
  })
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(cwd, rel)), { recursive: true })
    writeFileSync(join(cwd, rel), content)
  }
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({
    defaultModel: "fake-anthropic:claude-fake-1",
    providers: [{ name: "fake-anthropic", baseURL: `http://127.0.0.1:${endpoint.port}/v1`, format: "anthropic", apiKey: "test-key" }],
  }, null, 2))
  const launch = () => {
    const cli = startCli({ home, cwd })
    children.push(cli)
    return cli
  }
  return { cwd, endpoint, launch }
}

/** 真实 ACP 客户端开场序：initialize → session/new（返回槽号串）。 */
async function openSession(cli, cwd) {
  const init = await cli.request("initialize", { protocolVersion: 1, clientCapabilities: {} })
  assert.equal(init.error, undefined, `initialize 被拒：${JSON.stringify(init.error)}`)
  const created = await cli.request("session/new", { cwd, mcpServers: [] })
  assert.equal(created.error, undefined, `session/new 被拒：${JSON.stringify(created.error)}｜stderr: ${cli.stderr.slice(-1500)}`)
  assert.ok(created.result?.sessionId, `session/new 未给会话号：${JSON.stringify(created)}`)
  return String(created.result.sessionId)
}

/** 发一句话，等这一回合走完；返回本回合的助手文本。 */
async function say(cli, sessionId, text) {
  const from = cli.updates().length
  const res = await cli.request("session/prompt", { sessionId, prompt: [{ type: "text", text }] }, TURN_TIMEOUT_MS)
  assert.equal(res.error, undefined, `对话被拒（生产症状：上游 400 Unexpected role "tool"）：${JSON.stringify(res.error)}｜stderr: ${cli.stderr.slice(-2000)}`)
  assert.equal(res.result?.stopReason, "end_turn", `回合未正常收尾：${JSON.stringify(res.result)}`)
  return cli.textSince(from)
}

// ---------- G1 正常 / G2 边界 / G3 边界 ----------

test('1-1 正常：一次工具调用后继续对话 —— 会话流有调用与结果，模型回复引用结果，无 400', { timeout: SCENE_TIMEOUT_MS }, async (t) => {
  const s = await scene(t, {
    files: { "note.txt": "PINEAPPLE-42\n" },
    calls: [{ id: "toolu_g1", name: "read", input: { path: "note.txt" } }],
  })
  const cli = s.launch()
  const sessionId = await openSession(cli, s.cwd)
  const reply = await say(cli, sessionId, "Read note.txt and tell me what it says.")

  const updates = cli.updates()
  const calls = updates.filter((u) => u.sessionUpdate === "tool_call")
  const completed = updates.filter((u) => u.sessionUpdate === "tool_call_update" && u.status === "completed")
  assert.equal(calls.length, 1, `会话流应出现一次工具调用，实际：${JSON.stringify(calls.map((c) => c.title))}`)
  assert.equal(calls[0].title, "read", "工具调用是 read")
  assert.equal(calls[0].rawInput?.path, "note.txt", "读的就是那个内容已知的小文件")
  assert.equal(completed.length, 1, "会话流应出现该工具的结果")
  assert.match(JSON.stringify(completed[0].content), /PINEAPPLE-42/, "工具结果带回文件内容")
  assert.match(reply, /PINEAPPLE-42/, `模型下段回复应引用工具结果，实际：${reply}`)
  assert.equal(s.endpoint.rejections.length, 0, `上游无 role 类 400（本档证伪点）：${s.endpoint.rejections.join("｜")}`)
  assert.ok(s.endpoint.requests.length >= 2, "工具回合之后还有下一回合（会话确实继续了）")
})

test('1-2 边界：一轮两个工具调用后继续对话 —— 两个结果都回到模型，无 400', { timeout: SCENE_TIMEOUT_MS }, async (t) => {
  const s = await scene(t, {
    files: { "note-a.txt": "ALPHA-1\n", "note-b.txt": "BETA-2\n" },
    calls: [
      { id: "toolu_g2a", name: "read", input: { path: "note-a.txt" } },
      { id: "toolu_g2b", name: "read", input: { path: "note-b.txt" } },
    ],
  })
  const cli = s.launch()
  const sessionId = await openSession(cli, s.cwd)
  const reply = await say(cli, sessionId, "Read note-a.txt and note-b.txt, then tell me both contents.")

  const updates = cli.updates()
  const calls = updates.filter((u) => u.sessionUpdate === "tool_call")
  const completed = updates.filter((u) => u.sessionUpdate === "tool_call_update" && u.status === "completed")
  assert.equal(calls.length, 2, `一轮应出现两个工具调用，实际：${JSON.stringify(calls.map((c) => c.rawInput?.path))}`)
  assert.deepEqual(calls.map((c) => c.rawInput?.path).sort(), ["note-a.txt", "note-b.txt"], "两个调用各读一个文件")
  assert.equal(completed.length, 2, "两个调用都拿到了结果")
  assert.match(reply, /ALPHA-1/, `模型回复应引用第一个结果，实际：${reply}`)
  assert.match(reply, /BETA-2/, `模型回复应引用第二个结果，实际：${reply}`)
  assert.equal(s.endpoint.rejections.length, 0, `上游无 role 类 400（本档证伪点）：${s.endpoint.rejections.join("｜")}`)
  assert.ok(s.endpoint.requests.length >= 2, "多工具回合之后还有下一回合（会话确实继续了）")
})

test('1-3 边界：关进程重开同一会话，历史从盘回放后继续 —— 回复引用上一程的工具结果，无 400', { timeout: SCENE_TIMEOUT_MS }, async (t) => {
  const s = await scene(t, {
    files: { "note.txt": "PINEAPPLE-42\n" },
    calls: [{ id: "toolu_g3", name: "read", input: { path: "note.txt" } }],
  })

  // 第一程：开会话、用一次工具、拿到回复
  const first = s.launch()
  const sessionId = await openSession(first, s.cwd)
  const firstReply = await say(first, sessionId, "Read note.txt and tell me what it says.")
  assert.match(firstReply, /PINEAPPLE-42/, `本程回复应引用工具结果，实际：${firstReply}`)
  await first.stop() // 关掉 CLI 进程（会话已在本回合收尾时落盘）

  const requestsBefore = s.endpoint.requests.length
  const rejectionsBefore = s.endpoint.rejections.length

  // 第二程：重开 CLI、装载同一会话（历史从盘上回放）、再发一句话
  const second = s.launch()
  const init = await second.request("initialize", { protocolVersion: 1, clientCapabilities: {} })
  assert.equal(init.error, undefined, `第二程 initialize 被拒：${JSON.stringify(init.error)}`)
  const loaded = await second.request("session/load", { sessionId })
  assert.equal(loaded.error, undefined, `装载同一会话失败：${JSON.stringify(loaded.error)}｜stderr: ${second.stderr.slice(-2000)}`)

  const reply = await say(second, sessionId, "what did the file say?")
  assert.match(reply, /PINEAPPLE-42/, `重开后的回复应接上原上下文（引用上一程的工具结果），实际：${reply}`)
  assert.match(reply, /what did the file say\?/, `模型应看见本程的新问题，实际：${reply}`)
  assert.equal(s.endpoint.rejections.length - rejectionsBefore, 0, `第二程无 role 类 400：${s.endpoint.rejections.slice(rejectionsBefore).join("｜")}`)
  assert.ok(s.endpoint.requests.length > requestsBefore, "第二程确实向模型发了请求（回放的历史 + 新问题）")
})
