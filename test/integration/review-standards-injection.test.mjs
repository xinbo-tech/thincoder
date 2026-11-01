/**
 * review-standards-injection.test.mjs —— 集成用例 24-1 / 24-2 / 24-3（RTM CLI 端故事 24「评审的方法论符合度
 * 不再恒空」；判据 ∥ 文案单源 = `docs/core/design/MANIFEST.md` §2.12「标准档声明口」）。
 *
 * 业务进入点 = 工程模式会话里对一本批档发起一次设计评审（真 `advisor` 工具的同步设计评审轨，`batchDoc` 绑定）；
 * 用户看到的是评审上下文里那一段——断言面 = 发给模型的评审消息（`## Project Standards` 段），不是内部函数返回值。
 * 组件间交互 = 项目数据档 `docRoot.standards` → `readManifest` → `injectProjectStandards` → 评审消息组装面。
 * 模型侧 = `node:http` 本机假 OpenAI SSE 端点（回一段固定文本）+ 请求体留档；零外网、零付费端点。
 * 夹具 = 系统临时域（项目根 + 数据档 + 设计档 + 六段批档；零落真实用户目录）。
 *
 * 复跑：`node --test test/integration/review-standards-injection.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

import { advisorTool } from "../../thincoder-core/agent-tools/advisor.mjs"
import { injectProjectStandards, NO_STANDARDS_NOTICE } from "../../thincoder-core/advisor/project-context.mjs"
import { providerSpec } from "../../thincoder-core/model-specs.mjs"

const DESIGN_REL = "docs/core/design/DESIGN-FIXTURE.md"
const BATCH_REL = "docs/batches/fixture.md"
const STANDARDS_REL = "docs/core/requirements/METHODOLOGY.md"
const STANDARDS_BODY = "# 家规\n\n规则甲：写代码之前先读文档。\n"

/** 六段批档（评审的 `batchDoc` 绑定面；内容不参与本档断言）。 */
const RECORD = [
  "# 夹具批 · 标准档声明口",
  "",
  "> 编制：夹具 · 2026-11-01 · 来源 = 集成夹具。",
  "",
  "## §1 讨论（主 agent）",
  "**状态行**：🔄 进行中",
  "",
  "夹具讨论。",
  "",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：设计完成",
  "",
  "夹具任务。",
  "",
  "## §3 设计评审（评审子代理）",
  "## §4 用户批准（主 agent）",
  "夹具批准。",
  "",
  "## §5 实施记录（eng-coder）",
  "夹具实施。",
  "",
  "## §6 验证与收口（父代理）",
  "夹具收口。",
  "",
].join("\n")

/** 假 OpenAI SSE 端点：一个完整文本回合，请求体留档（先例 `test/integration/review-doc-scope.test.mjs:28-52`）。 */
function fakeProvider(text = "No findings — clean pass.") {
  const requests = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => { raw += chunk })
    req.on("end", () => {
      requests.push({ url: req.url, body: raw })
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" })
      res.flushHeaders?.()
      res.write(`data: ${JSON.stringify({ id: "chatcmpl-fake", object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: text }, finish_reason: null }] })}\n\n`)
      res.write(`data: ${JSON.stringify({ id: "chatcmpl-fake", object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  const ready = new Promise((done) => server.listen(0, "127.0.0.1", () => done(server.address().port)))
  return ready.then((port) => ({
    port,
    requests,
    close: () => new Promise((done) => {
      server.closeAllConnections?.()
      server.close(() => done())
    }),
  }))
}

const roots = []
after(() => { for (const p of roots) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }) })

/** 夹具项目根：数据档 + 设计档 + 批档 + 一份在盘的标准档（声明与否由各格自己写数据档决定）。 */
function fixture(tag) {
  const root = mkdtempSync(join(tmpdir(), `rsi-${tag}-`))
  roots.push(root)
  mkdirSync(dirname(join(root, DESIGN_REL)), { recursive: true })
  mkdirSync(dirname(join(root, BATCH_REL)), { recursive: true })
  mkdirSync(dirname(join(root, STANDARDS_REL)), { recursive: true })
  writeFileSync(join(root, DESIGN_REL), "# 设计夹具\n\n夹具正文。\n")
  writeFileSync(join(root, BATCH_REL), RECORD)
  writeFileSync(join(root, STANDARDS_REL), STANDARDS_BODY)
  return root
}

/** 数据档：`standards` 传 `undefined` ⇒ **该键缺**（未声明格）；传值 ⇒ 声明该值。 */
function writeManifest(root, standards) {
  const docRoot = {
    requirements: "docs/core/requirements",
    specs: "docs/core/specs",
    design: "docs/core/design",
    modules: "docs/core/modules",
    batches: "docs/batches",
  }
  if (standards !== undefined) docRoot.standards = standards
  writeFileSync(
    join(root, "PROJECT-MANIFEST.json"),
    JSON.stringify({ version: 1, phase: "initial-dev", docRoot, codePaths: ["src"], index: { codeExtensions: [], docExtensions: [], excludePaths: [], publicRepos: [] } }, null, 2),
  )
}

let seq = 0
/** 一次设计评审（工程模式 + `batchDoc` 绑定）：返回评审消息全文（模型收到的请求体）与工具回执。 */
async function designReview(t, root) {
  const endpoint = await fakeProvider()
  t.after(() => endpoint.close())
  const entry = { name: "fake", baseURL: `http://127.0.0.1:${endpoint.port}`, apiKey: "test-key" }
  const agent = {
    cwd: root,
    provider: { ...entry, model: "gpt-4o" },
    config: {
      defaultModel: "fake:gpt-4o",
      providers: [entry],
      providersList: [entry],
      agent: { engineering: true, advisor: { provider: "fake", guard: false } },
      advisor: { provider: "fake", guard: false },
      traces: { enabled: false },
    },
  }
  const receipt = String(await advisorTool.execute(
    { type: "design", async: false, documents: [DESIGN_REL], batchDoc: BATCH_REL },
    { agent, _toolCallId: `rsi-${++seq}` },
  ))
  assert.equal(endpoint.requests.length, 1, "一次评审 = 一次模型请求（评审真的跑到了消息组装面）")
  return { agent, receipt, body: endpoint.requests[0].body }
}

/** 从评审消息里切出 `## Project Standards` 段（到下一个二级标题为止）。 */
function standardsSection(body) {
  const head = "## Project Standards"
  const start = body.indexOf(head)
  assert.ok(start >= 0, "评审消息含 Project Standards 段")
  const rest = body.slice(start + head.length)
  const end = rest.indexOf("\\n## ")
  return (end < 0 ? rest : rest.slice(0, end)).replaceAll("\\n", "\n").trim()
}

test("24-1 声明了标准档 ⇒ 评审上下文拿到该档正文", { timeout: 120_000 }, async (t) => {
  const root = fixture("241")
  writeManifest(root, STANDARDS_REL)
  const { body } = await designReview(t, root)
  const section = standardsSection(body)
  const cap = Math.max(8192, Math.floor(providerSpec({ model: "gpt-4o" }).context * 0.05))

  assert.ok(STANDARDS_BODY.length < cap, `夹具前置：正文 ${STANDARDS_BODY.length} < 预算帽 ${cap}（句子不被截断污染）`)
  assert.ok(section.includes("The file below is the project's standards document. Judge methodology compliance against it."), `用途句在场：${section}`)
  assert.ok(section.includes("规则甲：写代码之前先读文档。"), `该档正文首行在场：${section}`)
  assert.ok(!section.includes(NO_STANDARDS_NOTICE), "态 3 不带降级句（拿到了正文就不是降级）")

  // 行 24-1 的第二半「返该档绝对路径」：注入面的回执（同一夹具、同一数据档）。
  const parts = []
  const ret = injectProjectStandards({ cwd: root, provider: { model: "gpt-4o" } }, parts, null)
  assert.equal(ret, resolve(root, STANDARDS_REL), "返该档绝对路径")
})

test("24-2 声明指向不存在的档 ⇒ 态 2 句点名路径与原因，且与 24-3 的句子不等", { timeout: 120_000 }, async (t) => {
  const root = fixture("242")
  writeManifest(root, "docs/nope")
  const { body } = await designReview(t, root)
  const section = standardsSection(body)

  assert.ok(section.includes("declared at"), `态 2 句点明「声明了」：${section}`)
  assert.ok(section.includes("docs/nope"), `含声明路径字面：${section}`)
  assert.ok(section.includes("no such file"), "原因 = 路径不存在")
  assert.ok(!section.includes("规则甲"), `零正文注入（数据档里那份在盘档不因声明错而顶替）：${section}`)
  assert.ok(!section.includes(NO_STANDARDS_NOTICE), "与「未声明」句不同形（防作者回头补一个已有的声明）")
  assert.notEqual(section, NO_STANDARDS_NOTICE, "且与 24-3 的句子不等")
})

test("24-3 删掉该键 ⇒ 态 1 句；零正文、零路径字面、零 declared", { timeout: 120_000 }, async (t) => {
  const root = fixture("243")
  writeManifest(root, undefined) // 键缺 = 未声明（在盘的那份标准档不被探测）
  const { body } = await designReview(t, root)
  const section = standardsSection(body)

  assert.equal(section, NO_STANDARDS_NOTICE, `注入面出现 NO_STANDARDS_NOTICE：${section}`)
  assert.ok(!section.includes("规则甲"), "零正文")
  assert.ok(!section.includes("docs/"), "零路径字面")
  assert.ok(!/declared/i.test(section), "零 declared")
})
