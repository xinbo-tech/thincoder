/**
 * opencode-session-header.test.mjs — 集成用例档：RTM 故事 23「配了 OpenCode Go 的会话能发出话」
 * （`test/RTM.md:273` 行 23-1；机制权威 = `docs/core/design/PROVIDER.md` §6.17「会话标识头」）。
 *
 * 业务可观察结果：配好 `opencode-go` 之后发一句话，用户拿到助手回复；修前配置形状（渠道不带该头）
 * 同一句话当场失败，并把上游的 `MissingSessionID` 错误面带到用户面前（不静默、不返回空回复）。
 *
 * 交互三件 = 配置装载（预设条目 `providers[].headers` 的 `${sessionId}` 模板）⟷ 请求装配
 * （`withUserAgent`）⟷ 上游 HTTP；驱动 = 真会话链路（`createAgent` + `runAgent`），上游 = 本机
 * 假端点（零外网、零付费端点、零 `globalThis.fetch` 桩）。
 *
 * 出站头的**值**不在本层断言——同值判据归批内单测 #15 ∥ #16，两层不重复持有同一断言。本层只让
 * 假上游按「头在不在」作答：拿到助手回复即该头在，拿到 400 即不在。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createAgent, runAgent } from "../../thincoder-core/agent.mjs"
import { _resetLogsDirForTest, _setLogsDirForTest } from "../../thincoder-core/log.mjs"
import { presetToEntry } from "../../thincoder-core/config-presets.mjs"

// ---------- 夹具 ----------

const cwd = mkdtempSync(join(tmpdir(), "opencode-session-header-int-"))
const logsDir = mkdtempSync(join(tmpdir(), "opencode-session-header-int-logs-"))
_setLogsDirForTest(logsDir)
after(() => {
  _resetLogsDirForTest()
  rmSync(cwd, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(logsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 上游被问到时助手回的那段话（业务判据的取值来源）。 */
const REPLY = "opencode-go: 收到，这是助手回复。"

/** 上游 400 载荷——逐字复刻实测（`docs/core/design/PROVIDER.md` §6.17「实测依据」行）。 */
const MISSING_SESSION_PAYLOAD = JSON.stringify({
  type: "error",
  error: { type: "MissingSessionID", message: "Request is missing x-opencode-session and cannot be routed efficiently." },
})

/** 一句话进 SSE 帧（首帧正文 + 收束帧）。 */
const sseChunks = (text) => [
  { choices: [{ delta: { content: text }, finish_reason: null }] },
  { choices: [{ delta: {}, finish_reason: "stop" }] },
]

/**
 * 假上游（两态 · 按请求头作答）：带头 ⇒ 200 + 助手回复 SSE；不带头 ⇒ 400 `MissingSessionID`。
 * 请求全量记进 `requests`（只因本档要断言「跑了几次」与「对照跑确实撞上 400」，头值不断言）。
 */
const fakeUpstream = () => {
  const requests = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => { raw += chunk })
    req.on("end", () => {
      requests.push({ headers: req.headers, body: raw })
      if (!req.headers["x-opencode-session"]) {
        res.writeHead(400, { "content-type": "application/json" })
        res.end(MISSING_SESSION_PAYLOAD)
        return
      }
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" })
      for (const chunk of sseChunks(REPLY)) res.write(`data: ${JSON.stringify(chunk)}\n\n`)
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

/**
 * 一次 CLI 会话夹具：真 `createAgent` + 本机假上游。
 * `withSessionHeader=false` = 修前配置形状（渠道条目不携该头）。
 */
async function session(t, { withSessionHeader }) {
  const upstream = await fakeUpstream()
  t.after(() => upstream.close())
  const entry = presetToEntry("opencode-go") // 配置装载面：预设 → 落库条目（携 `headers` 模板）
  const provider = {
    ...entry,
    baseURL: `http://127.0.0.1:${upstream.port}`,
    apiKey: "sk-test",
    model: "deepseek-v4.1-flash",
  }
  if (!withSessionHeader) delete provider.headers
  const agent = createAgent({
    provider: null,
    tools: [],
    config: { agent: { maxTurns: 2 }, traces: { enabled: false } },
    cwd,
    history: [],
  })
  agent.provider = provider
  return { agent, upstream }
}

// ---------- 行 23-1 ----------

test("23-1 正常：配了 OpenCode Go 的会话能发出话（上游带头才回 200）", { timeout: 60_000 }, async (t) => {
  const s = await session(t, { withSessionHeader: true })

  const answer = await runAgent(s.agent, "在吗", {})

  assert.equal(answer, REPLY, `用户拿到助手回复——修前这里是 400 MissingSessionID，实读：${answer}`)
  assert.equal(s.upstream.requests.length, 1, "一句话一次模型请求（没有重试链）")
  const assistantTexts = s.agent.history
    .filter((m) => m.role === "assistant" && typeof m.content === "string" && !m.tool_calls)
    .map((m) => m.content)
  assert.deepEqual(assistantTexts, [REPLY], "回复同样落进会话历史（那一格对用户可见）")
})

test("23-1 对照：修前配置形状（渠道不携该头）复现 400 MissingSessionID", { timeout: 60_000 }, async (t) => {
  const s = await session(t, { withSessionHeader: false })

  const error = await runAgent(s.agent, "在吗", {}).then(() => null, (e) => e)

  assert.ok(error, "该回合必须失败——不静默、不返回空回复")
  assert.match(error.message, /MissingSessionID/, `错误面带出上游的 MissingSessionID，实读：${error.message}`)
  assert.match(error.message, /400/, `错误面点名 HTTP 400，实读：${error.message}`)
  assert.equal(s.upstream.requests.length, 1, "撞上 400 即收场（该错误不可重试）")
})
