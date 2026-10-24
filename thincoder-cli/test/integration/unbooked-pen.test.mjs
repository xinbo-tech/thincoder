/**
 * unbooked-pen.test.mjs — 集成场景 I1–I3（设计：`docs/core/design/LIGHT-CHANNEL.md` §8 · F-LC6）：
 * 每会话**首次**由主 agent 落下**产品源文件**笔时，工具回执末尾多一行 `[pen check]`；
 * 同一会话第二笔不再出现；文档笔零提示且**不消耗**「每会话一次」闩。
 *
 * 业务入口 = 真 CLI 子进程 `node bin/thincoder.mjs chat --auto "<prompt>"`：`--auto` = 会话级
 * AUTO 放行工具调用（`thincoder-cli/src/command-interactive.mjs:70` 置 `agent.autoApprove`，
 * dispatch 跳过审批面）；三例都是单趟运行，不需要 ACP 的多轮客户端能力
 * （`chat` 一次性、不落会话——本档不依赖会话持久化）。
 *
 * 断言面 = **模型面工具回执**：提醒的落点 = `thincoder-core/agent/record-results.mjs:89-90`
 * （`pushReal` 的 tool 消息正文），也就是脚本化 provider 下一请求里那笔 `tool_result` 的正文。
 * 会话流 `tool_call_update` 渲染的是执行结果（`thincoder-core/agent/dispatch-run.mjs:155` 的
 * `onToolResult`，早于提醒拼接）——故本档不拿会话流正文当判据。
 *
 * 模型侧 = 本地脚本化 Anthropic 端点（零外网、零付费端点）：第 N 个请求回第 N 个脚本回合
 * （`tool_use`），脚本耗尽后一律文本回合收尾。夹具 workspace 带 `PROJECT-MANIFEST.json`
 * （`src/` 为默认 codePaths）——`declarationForTarget` 解析得出辖域、`src/**` 才判为产品源文件；
 * 缺档则触发面 ④ 恒不成立（门先拒是工程模式的事，本档跑 normal 模式会话）。
 *
 * 隔离：HOME ∥ USERPROFILE 指向假家目录（config 与运行态都落在其中）；临时项目目录即会话 cwd。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI_ENTRY = join(HERE, "..", "..", "bin", "thincoder.mjs")
/** 单例场景上限（一次真进程装配 + 两三个本地回合）。 */
const SCENE_TIMEOUT_MS = 180_000
/** chat 子进程上限（本地假端点，只等回合走完）。 */
const CHAT_TIMEOUT_MS = 120_000

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

const messageStart = { type: "message_start", message: { id: "msg_fake", type: "message", role: "assistant", model: "claude-fake-1", content: [], usage: { input_tokens: 20, output_tokens: 1 } } }

/** 工具回合：一条 assistant 消息、每个调用一个 tool_use 块。 */
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
 * 起本地假 Anthropic 端点，返回 `{ port, requests, close }`（`requests[] = { url, body }`）。
 * `rounds[N]` = 第 N+1 个 **messages** 请求派发的工具调用；非 messages 请求（若将来出现旁路调用）
 * 不占用脚本回合；脚本耗尽后一律文本回合（不重派，避免退化用例挂到超时）。
 */
function fakeAnthropic({ rounds = [] } = {}) {
  const requests = []
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
      const round = rounds[chatRequests(requests).length - 1]
      if (round?.length) return sseReply(res, toolUseEvents(round))
      return sseReply(res, textEvents("done"))
    })
  })
  const ready = new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)))
  return ready.then((port) => ({
    port,
    requests,
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.()
      server.close(() => resolve())
    }),
  }))
}

// ---------- 真 CLI 子进程（chat --auto 驱动器）----------

/** 跑一次 `chat --auto`，等进程真正退出；超时则强杀并抛出带 stderr 尾部的可读错误。 */
function runChat({ home, cwd, prompt, timeoutMs = CHAT_TIMEOUT_MS }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_ENTRY, "chat", "--auto", prompt], {
      cwd,
      env: { ...process.env, HOME: home, USERPROFILE: home },
      stdio: ["ignore", "ignore", "pipe"],
    })
    let stderr = ""
    child.stderr.setEncoding("utf8")
    child.stderr.on("data", (chunk) => { stderr += chunk })
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error(`chat 超时 ${timeoutMs}ms｜stderr: ${stderr.slice(-1500)}`))
    }, timeoutMs)
    timer.unref?.()
    child.on("error", (e) => { clearTimeout(timer); reject(e) })
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({ code, stderr })
    })
  })
}

// ---------- 场景骨架 ----------

/** 一次集成场景的隔离现场：假家目录（config）、临时项目目录（带项目声明）、假 Anthropic 端点。 */
async function scene(t, { rounds = [] } = {}) {
  const home = mkdtempSync(join(tmpdir(), "tc-int-unbooked-home-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-unbooked-proj-"))
  const endpoint = await fakeAnthropic({ rounds })
  t.after(async () => {
    await endpoint.close()
    rmSync(home, { recursive: true, force: true })
    rmSync(cwd, { recursive: true, force: true })
  })
  // 项目声明：src/ 为默认 codePaths ⇒ declarationForTarget 可解析、isCodePath 判产品源文件。
  writeFileSync(join(cwd, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({
    defaultModel: "fake-anthropic:claude-fake-1",
    providers: [{ name: "fake-anthropic", baseURL: `http://127.0.0.1:${endpoint.port}/v1`, format: "anthropic", apiKey: "test-key" }],
  }, null, 2))
  return { cwd, endpoint, run: (prompt) => runChat({ home, cwd, prompt }) }
}

// ---------- 回执读取（断言面 = 模型面工具回执）----------

/** 打到 messages 面的请求（脚本回合与回执读数都只看这一面；旁路请求不占回合）。 */
const chatRequests = (requests) => requests.filter((r) => String(r?.url ?? "").endsWith("/messages"))

const textOf = (block) => {
  const content = block?.content
  if (typeof content === "string") return content
  if (Array.isArray(content)) return content.map((b) => (typeof b === "string" ? b : b?.text ?? "")).join("")
  return String(content ?? "")
}

/** 一个请求体里全部 tool_result 的正文。 */
const toolResultTexts = (body) => (Array.isArray(body?.messages) ? body.messages : [])
  .flatMap((m) => (Array.isArray(m?.content) ? m.content : []))
  .filter((b) => b?.type === "tool_result")
  .map(textOf)

/**
 * 全部 **messages** 请求里、正文提及该路径的 tool_result 正文（同一回执在多轮历史里重复出现 ⇒ 去重）。
 * 恰一笔 ⇒ 返回其正文；零笔 ∥ 多笔不同正文 ⇒ 断言失败（模型没收到回执 / 判别歧义）。
 */
function receiptFor(requests, needle) {
  const hits = new Set()
  for (const { body } of chatRequests(requests)) {
    for (const text of toolResultTexts(body)) {
      if (text.includes(needle)) hits.add(text)
    }
  }
  const texts = [...hits]
  assert.equal(texts.length, 1, `应恰有一笔含 ${needle} 的工具回执，实际 ${texts.length} 笔：${JSON.stringify(texts).slice(0, 1200)}`)
  return texts[0]
}

/** 回执里的提醒行（以 `[pen check]` 开头的行）。 */
const penLines = (receipt) => receipt.split("\n").filter((line) => line.startsWith("[pen check]"))

// ---------- I1 首次命中 / I2 第二笔 / I3 文档笔不消耗闩 ----------

const I1_CONTENT = "export const penProbe = 1\n"

test("I1 首次：主 agent 写产品源文件 ⇒ 该笔回执以 [pen check] 行结尾、恰一次、含两处键句；文件已写入", { timeout: SCENE_TIMEOUT_MS }, async (t) => {
  const rounds = [[{ id: "toolu_i1", name: "write", input: { path: "src/x.mjs", content: I1_CONTENT } }]]
  const s = await scene(t, { rounds })
  const run = await s.run("Write src/x.mjs with the requested content.")
  assert.equal(run.code, 0, `chat 应以 0 退出｜stderr: ${run.stderr.slice(-2000)}`)
  assert.equal(chatRequests(s.endpoint.requests).length, rounds.length + 1, `脚本回合应全部走完（${rounds.length} 个工具回合 + 1 个收尾文本回合）`)

  const receipt = receiptFor(s.endpoint.requests, "src/x.mjs")
  assert.match(receipt, /^Wrote /, `工具照常成功（零拒绝——回执是成功文案），实际回执：${receipt.slice(0, 500)}`)
  assert.equal(receipt.split("[pen check]").length - 1, 1, `提醒行应恰出现一次，实际回执：${receipt}`)
  const lines = penLines(receipt)
  assert.equal(lines.length, 1, `提醒行应恰有一行，实际 ${lines.length} 行`)
  assert.equal(receipt.split("\n").at(-1), lines[0], `提醒行应在回执末尾（以之结尾），实际回执：${receipt}`)
  assert.match(lines[0], /confirm the channel/, "提醒行逐字含 confirm the channel")
  assert.match(lines[0], /ledger settlement misses it/, "提醒行逐字含 ledger settlement misses it")

  assert.equal(readFileSync(join(s.cwd, "src/x.mjs"), "utf8"), I1_CONTENT, "文件已写入（笔真的落盘了）")
})

test("I2 第二笔：同一会话紧接第二笔产品源文件写 ⇒ 第二笔回执零 [pen check]", { timeout: SCENE_TIMEOUT_MS }, async (t) => {
  const firstContent = "export const firstPen = 1\n"
  const secondContent = "export const secondPen = 2\n"
  const rounds = [
    [{ id: "toolu_i2a", name: "write", input: { path: "src/first.mjs", content: firstContent } }],
    [{ id: "toolu_i2b", name: "write", input: { path: "src/second.mjs", content: secondContent } }],
  ]
  const s = await scene(t, { rounds })
  const run = await s.run("Write src/first.mjs, then src/second.mjs.")
  assert.equal(run.code, 0, `chat 应以 0 退出｜stderr: ${run.stderr.slice(-2000)}`)
  assert.equal(chatRequests(s.endpoint.requests).length, rounds.length + 1, `脚本回合应全部走完（${rounds.length} 个工具回合 + 1 个收尾文本回合）`)

  const first = receiptFor(s.endpoint.requests, "src/first.mjs")
  const second = receiptFor(s.endpoint.requests, "src/second.mjs")
  assert.match(first, /^Wrote /, `第一笔应成功，实际回执：${first.slice(0, 500)}`)
  assert.equal(first.split("[pen check]").length - 1, 1, `第一笔应有提醒，实际回执：${first}`)
  assert.match(second, /^Wrote /, `第二笔应成功（成功但零提示才是判据），实际回执：${second.slice(0, 500)}`)
  assert.equal(second.split("[pen check]").length - 1, 0, `第二笔应零提示，实际回执：${second}`)

  assert.equal(readFileSync(join(s.cwd, "src/first.mjs"), "utf8"), firstContent)
  assert.equal(readFileSync(join(s.cwd, "src/second.mjs"), "utf8"), secondContent)
})

test("I3 另一会话：先写文档再写产品源文件 ⇒ 文档笔零提示且不消耗闩，随后产品码笔仍有提示", { timeout: SCENE_TIMEOUT_MS }, async (t) => {
  const docContent = "# note\n"
  const codeContent = "export const afterDoc = 3\n"
  const rounds = [
    [{ id: "toolu_i3a", name: "write", input: { path: "docs/x.md", content: docContent } }],
    [{ id: "toolu_i3b", name: "write", input: { path: "src/after-doc.mjs", content: codeContent } }],
  ]
  const s = await scene(t, { rounds })
  const run = await s.run("Write docs/x.md, then src/after-doc.mjs.")
  assert.equal(run.code, 0, `chat 应以 0 退出｜stderr: ${run.stderr.slice(-2000)}`)
  assert.equal(chatRequests(s.endpoint.requests).length, rounds.length + 1, `脚本回合应全部走完（${rounds.length} 个工具回合 + 1 个收尾文本回合）`)

  const doc = receiptFor(s.endpoint.requests, "docs/x.md")
  const code = receiptFor(s.endpoint.requests, "src/after-doc.mjs")
  assert.match(doc, /^Wrote /, `文档笔应成功（成功但零提示才是判据），实际回执：${doc.slice(0, 500)}`)
  assert.equal(doc.split("[pen check]").length - 1, 0, `文档笔应零提示，实际回执：${doc}`)
  assert.equal(code.split("[pen check]").length - 1, 1, `文档笔不应消耗闩——随后的产品码笔仍应有提示，实际回执：${code}`)
  assert.equal(code.split("\n").at(-1), penLines(code)[0], `产品码笔的提醒行应在回执末尾，实际回执：${code}`)

  assert.equal(readFileSync(join(s.cwd, "docs/x.md"), "utf8"), docContent)
  assert.equal(readFileSync(join(s.cwd, "src/after-doc.mjs"), "utf8"), codeContent)
})
