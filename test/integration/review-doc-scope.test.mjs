/**
 * review-doc-scope.test.mjs — 集成用例 6-1 … 6-5（RTM CLI 端故事 6「设计评审的文档范围按项目根受理」；
 * 设计 = `docs/core/design/ADVISOR-GUARDS.md` §12「用例设计（实现面）」）。
 *
 * 业务入口 = 真 `advisor` 工具（`agent-tools/advisor.mjs`）的同步设计评审轨；判据落在工具回执文本与
 * 「评审到底读没读到该文档」——不是内部函数返回值。模型侧 = `node:http` 本机假 OpenAI SSE 端点
 * （回一段固定文本）+ 请求体留档（先例 `test/integration/advisor-timeout-hot.test.mjs:27-87`）；
 * 零外网、零付费端点。
 *
 * 用一个测试缝、不用另一个：**用** `_setLedgerDirForTest`（工具面读台账——夹具的账只能种在临时目录，
 * 不碰真实用户目录；先例 `test/integration/batch-close-token-consume.test.mjs`）；
 * **不用** `_setProjectRootForTest`（覆盖位短路 `projectRootView` ⇒ 6-4 的 workspace 态不可达）。
 *
 * **拒因优先级事实（2026-11-02）**：类型门 → 准入门（设计评审必携 `batchDoc`）→ 账链门（批档须挂未决台账行）
 * → 文档范围。前两门已落，五例的夹具一律补一份可读 `batchDoc`（绝对路径形：workspace 锚也照用）；
 * 本批新增的账链门要求该批档落在已是项目的目录内、且台账里有一行未决行的 `task_book` 指着它 ⇒ 夹具批档
 * 放进该例的项目根、并种一行 `在途`。**五例断言逐字不变。**
 *
 * 副作用（如实记）：6-1…6-3 的夹具目录落在**真实仓树**内（`.tc-int-batch-*`），清理靠 `t.after`——中途杀掉进程
 * 会留残目录，可手工删；换临时项目根不行（6-3 的反证格要求会话锚 = 真仓根）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, parse, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { advisorTool } from "../../thincoder-core/agent-tools/advisor.mjs"
import { owningProject, projectRootView } from "../../thincoder-core/manifest-discovery.mjs"
// 台账模块静态链入 `node:sqlite`（W8 契约）——消费侧一律动态取（先例同 `test/integration/batch-close-token-consume.test.mjs`）。
const { _resetLedgerDirForTest, _setLedgerDirForTest, ledgerAdd, ledgerUpdate } = await import("../../thincoder-core/ledger.mjs")

/** 真仓根 = 本档上两级的目录（`test/integration/` → 仓根；`PROJECT-MANIFEST.json` 恒在）。 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

// 台账缝：本档所有台账读写落临时目录（模块级一次设定，收尾复位）。
const LEDGER_DIR = mkdtempSync(join(tmpdir(), "tc-int-ledger-"))
_setLedgerDirForTest(LEDGER_DIR)
after(() => {
  _resetLedgerDirForTest()
  rmSync(LEDGER_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 假 OpenAI SSE 端点：一个完整文本回合，请求体留档（不落任何真实模型）。 */
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

/** 夹具批档：写进 `root`（该例的项目根——账链门要求批档落在某个已注册项目内，否则 `no-ledger-root`）。
 *  内容不参与本档断言（假端点不读它），但它必须是一个可读文件；绝对路径形：任何锚态（含 workspace）都照用。 */
function batchRecordFixture(t, root, tag) {
  const dir = mkdtempSync(join(root, `.tc-int-batch-${tag}-`))
  t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }))
  const abs = join(dir, "fixture-batch.md")
  writeFileSync(abs, [
    "# 夹具批 · 设计评审受理面",
    "",
    "## §1 讨论（主 agent）",
    "",
    "夹具讨论。",
    "",
    "## §2 批次任务与设计（eng-designer）",
    "",
    "夹具任务。",
    "",
    "## §3 设计评审（评审子代理）",
    "",
  ].join("\n"))
  return abs
}

/** 种一行未决台账行（**只走写面，不直写 SQL**——`在途` 必挂 `task_book` 这类 CHECK 正是被测前提的一半）：
 *  `ledgerAdd` 落 `待讨论`（它自己开库）→ `ledgerUpdate` 迁 `在途` 并把指针指到夹具批档（仓根相对形）。 */
function seedPendingRow(root, batchAbs) {
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "夹具批 · 账链门" }, boundary: root })
  ledgerUpdate({ cwd: root, id, patch: { status: "在途", task_book: relative(root, batchAbs).replace(/\\/g, "/") }, boundary: root })
  return id
}

let sceneSeq = 0

/** 隔离会话：假 provider + 最小 `agent`（`cwd` 决定评审的锚态）+ 夹具批档与它那一行未决账。
 *  `recordRoot` = 夹具批档 / 台账行所在的项目根（缺省 = `cwd` 自身）：6-1…6-3 = 本仓仓根；
 *  6-4 = `p1/`；6-5 = `only/`——锚态（workspace / 无项目根）不变，只是夹具落进下辖项目。 */
async function scene(t, cwd, recordRoot = null) {
  const endpoint = await fakeProvider()
  const entry = { name: "fake", baseURL: `http://127.0.0.1:${endpoint.port}`, apiKey: "test-key" }
  const config = {
    defaultModel: "fake:gpt-4o",
    providers: [entry],
    providersList: [entry],
    agent: { advisor: { provider: "fake", guard: false } },
    advisor: { provider: "fake", guard: false },
    traces: { enabled: false },
  }
  const agent = { config, provider: { ...entry, model: "gpt-4o" }, cwd }
  t.after(() => endpoint.close())
  const batchDoc = batchRecordFixture(t, recordRoot ?? cwd, `s${++sceneSeq}`)
  seedPendingRow(recordRoot ?? cwd, batchDoc)
  return { agent, endpoint, batchDoc }
}

/** 最小项目档（夹具只需「目录里有没有这份档」——形同 `DEFAULT_MANIFEST` 的键集）。 */
const MANIFEST = JSON.stringify({
  version: "0.0.0-test",
  phase: "test",
  docRoot: {
    requirements: "docs/core/requirements",
    specs: "docs/core/specs",
    design: "docs/core/design",
    modules: "docs/core/modules",
    batches: "docs/batches",
  },
  codePaths: ["thincoder-core"],
  index: { publicRepos: [] },
}, null, 2)

const review = (agent, documents, toolCallId, batchDoc) => advisorTool.execute(
  { type: "design", async: false, documents, batchDoc },
  { agent, _toolCallId: toolCallId },
)

test('6-1 仓内非 docRoot 树下的文档被受理，评审读得到', { timeout: 120_000 }, async (t) => {
  const s = await scene(t, REPO_ROOT)
  const doc = "thincoder-core/tool-docs/advisor.md"
  const receipt = String(await review(s.agent, [doc], "t1", s.batchDoc))

  assert.doesNotMatch(receipt, /scope-not-doc/, `受理面放行（不是范围拒发），实际：${receipt}`)
  assert.equal(s.endpoint.requests.length, 1, "一次评审 = 一次模型请求")
  assert.ok(s.endpoint.requests[0].body.includes(doc), "评审消息携带该文档（判据「评审读得到」）")
  assert.match(receipt, /No findings/, `评审跑完并带回模型文本（不是半途拒发），实际：${receipt}`)
})

test('6-2 项目内代码文件 ⇒ 当场拒发（not-doc-file），零实例 / 零 token / 零 LLM', { timeout: 60_000 }, async (t) => {
  const s = await scene(t, REPO_ROOT)
  const doc = "thincoder-core/agent-tools/advisor.mjs"
  const receipt = String(await review(s.agent, [doc], "t2", s.batchDoc))

  assert.match(receipt, /criterion=scope-not-doc/, `标识行恒 scope-not-doc，实际：${receipt}`)
  assert.match(receipt, /reason=not-doc-file/)
  assert.ok(receipt.includes(resolve(REPO_ROOT, doc)), `文案载解析后绝对路径，实际：${receipt}`)
  assert.match(receipt, /Expected form 1 — project-root-relative:/, "期望形第 1 句")
  assert.match(receipt, /Expected form 2 — absolute:/, "期望形第 2 句")
  assert.equal(s.agent._advisorRefusals.has("t2"), true, "拒发登记")
  assert.equal((s.agent._advisorRuns?.size ?? 0), 0, "零评审实例")
  assert.equal(s.endpoint.requests.length, 0, "零 token / 零 LLM")
})

test('6-3 项目外绝对路径 ⇒ 当场拒发（outside-project），零实例', { timeout: 60_000 }, async (t) => {
  const outside = mkdtempSync(join(tmpdir(), "tc-int-outside-"))
  t.after(() => rmSync(outside, { recursive: true, force: true }))
  const doc = join(outside, "outside", "x.md")
  mkdirSync(dirname(doc), { recursive: true })
  writeFileSync(doc, "# outside\n")
  assert.equal(owningProject(outside, REPO_ROOT), null, "夹具前置：临时根不在会话项目根之下（outside-project 的前提）")

  const s = await scene(t, REPO_ROOT)
  const receipt = String(await review(s.agent, [doc], "t3", s.batchDoc))

  assert.match(receipt, /criterion=scope-not-doc/)
  assert.match(receipt, /reason=outside-project/)
  assert.ok(receipt.includes(doc), `文案载解析后路径，实际：${receipt}`)
  assert.match(receipt, /Expected form 1 — project-root-relative:/, "期望形第 1 句（同 6-2 形态）")
  assert.match(receipt, /Expected form 2 — absolute:/, "期望形第 2 句（同 6-2 形态）")
  assert.equal(s.agent._advisorRefusals.has("t3"), true, "拒发登记")
  assert.equal((s.agent._advisorRuns?.size ?? 0), 0, "零评审实例")
  assert.equal(s.endpoint.requests.length, 0, "零 LLM")
})

test('6-4 workspace 锚 + 项目根相对形 ⇒ 当场拒发（ambiguous-path）；反证格：基面存在则不再此拒', { timeout: 60_000 }, async (t) => {
  const ws = mkdtempSync(join(tmpdir(), "tc-int-ws-"))
  t.after(() => rmSync(ws, { recursive: true, force: true }))
  for (const name of ["p1", "p2"]) {
    mkdirSync(join(ws, name), { recursive: true })
    writeFileSync(join(ws, name, "PROJECT-MANIFEST.json"), MANIFEST)
  }
  assert.equal(projectRootView(ws).state, "workspace", "夹具前置：锚无档、下辖 ≥1 项目（workspace 态的前提）")

  const s = await scene(t, ws, join(ws, "p1"))
  const receipt = String(await review(s.agent, ["docs/a.md"], "t4", s.batchDoc))

  assert.match(receipt, /criterion=scope-not-doc/)
  assert.match(receipt, /reason=ambiguous-path/, `实际：${receipt}`)
  assert.match(receipt, /Session anchor is workspace \(/, "文案报锚态")
  assert.match(receipt, /Candidates: .*p1.*p2/, "文案报候选全列（下辖项目按名排序）")
  assert.match(receipt, /Expected form 1 — project-root-relative:/, "期望形第 1 句")
  assert.match(receipt, /Expected form 2 — absolute:/, "期望形第 2 句")
  assert.equal(s.agent._advisorRefusals.has("t4"), true, "拒发登记")
  assert.equal((s.agent._advisorRuns?.size ?? 0), 0, "零评审实例")
  assert.equal(s.endpoint.requests.length, 0, "零 token / 零 LLM")

  // 反证格：cwd 换成 p1（基面已存在）⇒ 同一调用不再以 ambiguous-path 拒（改为「文件不存在」这一档）。
  const counter = String(await review({ ...s.agent, cwd: join(ws, "p1") }, ["docs/a.md"], "t4b", s.batchDoc))
  assert.doesNotMatch(counter, /ambiguous-path/, `基面存在 ⇒ 不再报锚态，实际：${counter}`)
  assert.match(counter, /reason=not-doc-file/)
  assert.equal(s.endpoint.requests.length, 0, "反证格同样零 LLM")
})

test('6-5 会话锚 = 非项目目录（根无档、下辖 1 个项目）⇒ 当场拒发（ambiguous-path），不把下辖项目当根', { timeout: 60_000 }, async (t) => {
  const box = mkdtempSync(join(tmpdir(), "tc-int-box-"))
  t.after(() => rmSync(box, { recursive: true, force: true }))
  mkdirSync(join(box, "only"), { recursive: true })
  writeFileSync(join(box, "only", "PROJECT-MANIFEST.json"), MANIFEST)
  assert.equal(owningProject(box, parse(box).root), null, "夹具前置：锚根及其祖先无项目档（workspace 态的前提）")

  const s = await scene(t, box, join(box, "only"))
  const receipt = String(await review(s.agent, ["docs/a.md"], "t5", s.batchDoc))

  assert.match(receipt, /criterion=scope-not-doc/)
  assert.match(receipt, /reason=ambiguous-path/, `实际：${receipt}`)
  assert.match(receipt, /→ \(no base\) ∥ reason=ambiguous-path/, "无基面：不拿下辖项目当根（未解析成该项目的路径）")
  assert.match(receipt, /Session anchor is workspace \(/, `文案报锚态 = 多根工作区（下辖 1 个项目），实际：${receipt}`)
  assert.match(receipt, /Candidates: .*only/, "唯一下辖项目也只作候选，不作基面")
  assert.ok(!receipt.includes(resolve(join(box, "only"), "docs", "a.md")), `不以该下辖项目为基面解析，实际：${receipt}`)
  assert.match(receipt, /Expected form 1 — project-root-relative:/, "期望形第 1 句")
  assert.match(receipt, /Expected form 2 — absolute:/, "期望形第 2 句")
  assert.equal(s.agent._advisorRefusals.has("t5"), true, "拒发登记")
  assert.equal((s.agent._advisorRuns?.size ?? 0), 0, "零评审实例")
  assert.equal(s.endpoint.requests.length, 0, "零 token / 零 LLM")
})
