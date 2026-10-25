/**
 * advisor-timeout-hot.test.mjs — 集成场景 I-AP1–I-AP3（设计：`docs/core/design/AGENT-PARAMS.md` §6.2 末
 * 「集成测试设计（F34 · 本批 · 收口口径）」）：
 * 会话里改 `agent.advisor.timeoutMs` 之后，**下一次评审按新值跑**（不需要重启）；`null` 删除回退
 * `REVIEW_TIMEOUT_MS`；非法值在写面被拒且配置面读回不变。
 *
 * 业务入口 = 真 `settings` 工具（`agent-tools/settings.mjs`，真实写盘 + 内存热应用）∥ 真 `advisor` 工具
 * （`agent-tools/advisor.mjs`，同步评审路径）。判据落在评审回执文本与耗时，不是配置回显：
 * AP1 假端点流式 5s、超时预算 3s ⇒ 评审 ≈3s 结束并带超时尾；AP2 清掉超时后同一 5s 流跑完、无超时尾
 * ⇒ 读面确实回退 600s。
 *
 * 模型侧 = `node:http` 本机假 SSE 端点（OpenAI `chat/completions` 流；`chat provider 的 baseURL 可配，
 * 故本档不需要任何测试缝`——设计同段）；零外网、零付费端点。评审的 provider 条目 baseURL 指向它。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { settingsTool } from "../../thincoder-core/agent-tools/settings.mjs"
import { advisorTool } from "../../thincoder-core/agent-tools/advisor.mjs"
import { REVIEW_TIMEOUT_MS } from "../../thincoder-core/advisor/compaction.mjs"

/** 假 OpenAI SSE 端点：收到请求后静默 `delayMs`，再发一个完整文本回合（超时预算短的时候由调用方 abort）。 */
function fakeSlowProvider(delayMs) {
  const requests = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => { raw += chunk })
    req.on("end", () => {
      requests.push({ url: req.url, body: raw })
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" })
      res.flushHeaders?.()
      const timer = setTimeout(() => {
        res.write(`data: ${JSON.stringify({ id: "chatcmpl-fake", object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: "No findings — clean pass." }, finish_reason: null }] })}\n\n`)
        res.write(`data: ${JSON.stringify({ id: "chatcmpl-fake", object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`)
        res.write("data: [DONE]\n\n")
        res.end()
      }, delayMs)
      res.on("close", () => clearTimeout(timer))
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

/**
 * 一个隔离会话：临时家目录（config.json 落在其中）+ 临时项目目录 + 假 provider。
 * `timeoutMs` = 会话初始的评审超时（nested ∥ promoted 同值，等价 `loadConfig` 装载后的形态）。
 */
async function scene(t, { delayMs, timeoutMs }) {
  const root = mkdtempSync(join(tmpdir(), "tc-int-advisor-"))
  const project = join(root, "project")
  const configDir = join(root, ".thincoder")
  mkdirSync(project, { recursive: true })
  mkdirSync(configDir, { recursive: true })
  writeFileSync(join(project, "note.txt"), "fixture file\n")
  const configPath = join(configDir, "config.json")
  writeFileSync(configPath, JSON.stringify({ agent: { advisor: { timeoutMs } } }, null, 2))

  const endpoint = await fakeSlowProvider(delayMs)
  const entry = { name: "fake", baseURL: `http://127.0.0.1:${endpoint.port}`, apiKey: "test-key" }
  const config = {
    defaultModel: "fake:gpt-4o",
    providers: [entry],
    providersList: [entry],
    // promoted 视图 = loadConfig 的产物（配置面读回 = 两视图同值）
    agent: { advisor: { provider: "fake", timeoutMs, guard: false } },
    advisor: { provider: "fake", timeoutMs, guard: false },
    traces: { enabled: false },
  }
  const agent = { config, provider: { ...entry, model: "gpt-4o" }, cwd: project }
  t.after(async () => {
    await endpoint.close()
    rmSync(root, { recursive: true, force: true })
  })
  return { agent, settings: settingsTool({ configPath }), endpoint, configPath, project }
}

const review = (agent) => advisorTool.execute({ type: "code", async: false, paths: ["note.txt"] }, { agent })

test('5-1 热生效：settings set 3000 后，下一次评审按 3s 结束并带回超时尾', { timeout: 90_000 }, async (t) => {
  const s = await scene(t, { delayMs: 5_000, timeoutMs: 900_000 })

  const set = await s.settings.execute({ action: "set", key: "agent.advisor.timeoutMs", value: "3000" }, { agent: s.agent })
  assert.match(set, /persisted \+ hot-applied/, `写面回执应声明已热应用，实际：${set}`)
  assert.equal(s.agent.config.advisor.timeoutMs, 3000, "运行读面（promoted 视图）立即拿到新值")
  assert.equal(s.agent.config.agent.advisor.timeoutMs, 3000, "配置面（nested 视图）同值")

  const started = Date.now()
  const receipt = await review(s.agent)
  const elapsed = Date.now() - started
  assert.match(String(receipt), /Advisor: review timeout after 3s\./, `评审按新值 3s 停并带可读超时尾，实际：${receipt}`)
  assert.ok(elapsed >= 2_500, `评审在 ≈3s 结束（不是立刻失败），实际 ${elapsed}ms`)
  assert.ok(elapsed < 4_500, `评审在 ≈3s 结束（5s fixture 流没跑完就停了），实际 ${elapsed}ms`)
  assert.equal(s.endpoint.requests.length, 1, "一次评审 = 一次模型请求")
})

test('5-2 null 删除回退：清掉超时后同一评审跑完（≈5s 流）、无超时尾', { timeout: 90_000 }, async (t) => {
  const s = await scene(t, { delayMs: 5_000, timeoutMs: 3_000 })

  const removed = await s.settings.execute({ action: "set", key: "agent.advisor.timeoutMs", value: "null" }, { agent: s.agent })
  assert.match(removed, /key removed/, `null = 显式清除，实际：${removed}`)
  assert.ok(!("timeoutMs" in s.agent.config.agent.advisor), "配置面不再有该键")
  assert.ok(!("timeoutMs" in s.agent.config.advisor), "运行读面不再有该键（否则旧值留在读面上）")
  assert.equal(REVIEW_TIMEOUT_MS, 600_000, "回退值 = 评审默认墙钟 600s")

  const started = Date.now()
  const receipt = await review(s.agent)
  const elapsed = Date.now() - started
  assert.doesNotMatch(String(receipt), /review timeout/i, `清掉超时后评审跑完、无超时尾，实际：${receipt}`)
  assert.match(String(receipt), /No findings/, `评审拿到模型文本，实际：${receipt}`)
  assert.ok(elapsed >= 4_000, `评审确实跑过了原 3s 墙（回退到 600s），实际 ${elapsed}ms`)
  assert.ok(elapsed < 10_000, `评审在 5s 流完后结束（不是悬挂），实际 ${elapsed}ms`)
  assert.equal(s.endpoint.requests.length, 1, "一次评审 = 一次模型请求")
})

test('5-3 写面拒非法值：abc 被拒且点名键与可消费形态，配置面读回不变', { timeout: 60_000 }, async (t) => {
  const s = await scene(t, { delayMs: 100, timeoutMs: 3_000 })

  await assert.rejects(
    () => s.settings.execute({ action: "set", key: "agent.advisor.timeoutMs", value: "abc" }, { agent: s.agent }),
    /advisor\.timeoutMs must be a finite positive number \(ms\) or null/,
    "写面拒绝并点名键与可消费形态（null ∥ 有限正数）",
  )
  const got = await s.settings.execute({ action: "get", key: "agent.advisor.timeoutMs" }, { agent: s.agent })
  assert.match(got, /agent\.advisor\.timeoutMs = 3000 \(number\)/, `配置面读回不变，实际：${got}`)
  assert.equal(s.agent.config.agent.advisor.timeoutMs, 3000, "nested 视图未被非法值污染")
  assert.equal(s.agent.config.advisor.timeoutMs, 3000, "promoted 视图未被非法值污染")
  const disk = JSON.parse(readFileSync(s.configPath, "utf8"))
  assert.equal(disk.agent?.advisor?.timeoutMs, 3000, "写面拒绝 = 磁盘零变化")
})
