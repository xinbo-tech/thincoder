/**
 * path-resolution.test.mjs — 集成用例 29-1 … 29-5（RTM CLI 端故事 29「路径解析统一层」）。
 *
 * 判据原文 = `test/RTM.md` 第 29 节；机制 = `docs/core/design/PATH-RESOLUTION.md` §2 / §2.6 / §2.7。
 * 业务入口全部是真工具调用（`batch` / `ledger` / `doc_check`），断言的是**回执文本与落盘结果**——
 * 不是内部函数返回值。夹具 = 系统临时域（零落仓 + 并发免疫）；台账缝 `_setLedgerDirForTest` 隔离真实用户目录。
 *
 * 五行对应关系（行号 = RTM 定死的号）：
 * 29-1 裸档名 ⇒ 批档写入落盘、门不再判档缺 · 29-2 三面同一句报明（拒 + 候选全列）·
 * 29-3 文档门：缺哪一段 + 同名候选 · 29-4 跨仓引用只判引用写对没有 · 29-5 形态错仍阻断（文档面 / 台账面两面差）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { docCheckTool } from "../../thincoder-core/agent-tools/doc-check.mjs"
import { ledgerTool } from "../../thincoder-core/ledger-tools.mjs"

const { _resetLedgerDirForTest, _setLedgerDirForTest, ledgerAdd } = await import("../../thincoder-core/ledger.mjs")

const LEDGER_DIR = mkdtempSync(join(tmpdir(), "pr-int-ledger-"))
_setLedgerDirForTest(LEDGER_DIR)
const TMP = []
after(() => {
  _resetLedgerDirForTest()
  rmSync(LEDGER_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  for (const d of TMP) rmSync(d, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

const BATCH_SKELETON = [
  "# 夹具批 · 路径解析",
  "",
  "## §1 讨论（主 agent）",
  "**状态行**：🔄 进行中（…）",
  "",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：设计完成",
  "",
  "## §3 设计评审（评审子代理）",
  "**状态行**：评审通过",
  "",
  "## §4 用户批准（主 agent）",
  "",
  "## §5 实施记录（eng-coder）",
  "",
  "## §6 验证与收口（父代理）",
  "",
].join("\n")

/** 项目夹具：`docRoot` 五键齐（裸档名要能经 `docRoot.batches` / `docRoot` 各键找到）。 */
const manifestOf = (publicRepos = []) => JSON.stringify({
  version: 1,
  phase: "initial-dev",
  docRoot: {
    requirements: "docs/core/requirements",
    specs: "docs/core/specs",
    design: "docs/core/design",
    modules: "docs/core/modules",
    batches: "docs/batches",
    standards: null,
  },
  codePaths: ["thincoder-core"],
  index: { codeExtensions: [], docExtensions: [], excludePaths: [], publicRepos },
}, null, 2)

function makeProject(files = {}, publicRepos = []) {
  const root = mkdtempSync(join(tmpdir(), "pr-int-proj-"))
  TMP.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), manifestOf(publicRepos))
  for (const [rel, body] of Object.entries(files)) put(root, rel, body)
  return root
}

function put(root, rel, body = "# x\n") {
  const abs = join(root, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, body)
  return abs
}

const agentOf = (root) => ({ cwd: root, config: { agent: { engineering: true } }, planMode: false, autoApprove: false })
const ctx0 = (root) => ({ depth: 0, agent: agentOf(root) })

// ── 29-1 唯一项目根 + 裸档名 ⇒ 批档写入落盘，门不再判档缺 ────────────────────
test('29-1 父侧 batch append：裸档名定位批档 ⇒ 写入落盘，文档门不再判档缺', { timeout: 60_000 }, async (t) => {
  const root = makeProject({ "docs/batches/2026-11-02-bare.md": BATCH_SKELETON })
  put(root, "docs/batches/bare-ref.md", "# 被引档\n\n正文。\n")
  await seedRow(root, "docs/batches/2026-11-02-bare.md")
  const tool = batchTool(null)

  const receipt = String(await tool.execute(
    { action: "append", path: "2026-11-02-bare.md", segment: "§1", text: "举证：bare-ref.md 这一笔已核对。" },
    ctx0(root),
  ))
  assert.match(receipt, /appended/, `裸档名定位成"可读批档"并写入，实际：${receipt}`)
  assert.doesNotMatch(receipt, /DOC-CHECK GATE: REFUSED/, `门不再判档缺，实际：${receipt}`)
  assert.match(readFileSync(join(root, "docs/batches/2026-11-02-bare.md"), "utf8"), /bare-ref\.md 这一笔已核对/, "文本已落盘")
})

// ── 29-2 同一句报明：三面（批档 / 台账 / 文档门）在工作区锚下都拒 + 列候选 ──────
test('29-2 工作区锚：批档 / 台账 / 文档门三面同一句报明形——拒 + 候选全列', { timeout: 60_000 }, async (t) => {
  const ws = mkdtempSync(join(tmpdir(), "pr-int-ws-"))
  TMP.push(ws)
  for (const name of ["pa", "pb"]) {
    mkdirSync(join(ws, name), { recursive: true })
    writeFileSync(join(ws, name, "PROJECT-MANIFEST.json"), manifestOf())
  }
  const batch = batchTool(null)
  const ledger = ledgerTool
  const docCheck = docCheckTool

  // ① 批档读面：相对形判不出唯一 ⇒ 候选项名两个项目
  await assert.rejects(
    () => batch.execute({ action: "status", path: "docs/batches/x.md", value: "进行中" }, ctx0(ws)),
    (e) => /not a readable file/.test(e.message) && /Candidates: .*pa.*pb/.test(e.message),
    "批档面拒 + 候选全列",
  )
  // ② 台账读面：无根 ⇒ 报明 + 下辖候选
  await assert.rejects(
    () => ledger.execute({ action: "count" }, ctx0(ws)),
    (e) => /未找到项目根/.test(e.message) && /下辖候选项目：.*pa.*pb/.test(e.message),
    "台账面拒 + 候选全列",
  )
  // ③ 文档门：target 未指名 + 工作区锚 ⇒ 报明候选（gate 面 ERROR + 候选行）
  const gate = String(docCheck.execute({ mode: "gate", docs: [] }, ctx0(ws)))
  assert.match(gate, /DOC-CHECK GATE: ERROR（多项目工作区：请指名 target）/)
  assert.match(gate, /候选：.*pa.*pb/, `文档门报候选全列，实际：${gate}`)
})

// ── 29-3 文档门：裸档名不在任何基根 ⇒ 报「缺哪一段」+ 同名候选 ───────────────
test('29-3 文档门判档：裸名两层基根零命中 ⇒ 报缺哪一段 + 同名候选（"你是不是指这个"）', { timeout: 60_000 }, async (t) => {
  const root = makeProject({ "docs/core/design/modules/域/guide-topic.md": "# 深处的档\n\n正文。\n" })
  put(root, "docs/core/design/prose.md", "# 正文面\n\n去读 guide-topic.md 那份。\n")
  const report = String(docCheckTool.execute({ mode: "report", docs: ["docs/core/design/prose.md"] }, ctx0(root)))

  assert.match(report, /✗ 锚·档缺 docs\/core\/design\/prose\.md:3/, `命中原行，实际：${report}`)
  assert.match(report, /缺「guide-topic\.md」/, `报缺的那一段，实际：${report}`)
  assert.match(report, /盘上同名：docs\/core\/design\/modules\/域\/guide-topic\.md/, `列同名候选（不产命中档），实际：${report}`)
})

// ── 29-4 文档门判跨仓引用：只判引用写对没有（已声明不查存在性 / 未声明不阻断）──
test('29-4 文档门判跨仓引用：已声明仓名零命中（盘上无该仓同判）· 未声明仓名零命中但回执含须先声明 + 仓名候选', { timeout: 60_000 }, async (t) => {
  const parent = mkdtempSync(join(tmpdir(), "pr-int-cross-"))
  TMP.push(parent)
  const proj = join(parent, "proj")
  mkdirSync(proj, { recursive: true })
  writeFileSync(join(proj, "PROJECT-MANIFEST.json"), manifestOf(["thin2"]))
  mkdirSync(join(parent, "otherside", "docs"), { recursive: true })
  writeFileSync(join(parent, "otherside", "docs", "guide.md"), "# 对面仓\n")
  put(proj, "docs/core/design/refs.md", [
    "# 跨仓引用面",
    "",
    "① 已声明源：thin2/docs/guide.md",
    "",
    "② 未声明仓：otherside/docs/guide.md",
    "",
  ].join("\n"))

  const report = String(docCheckTool.execute({ mode: "report", docs: ["docs/core/design/refs.md"] }, ctx0(proj)))
  assert.doesNotMatch(report, /✗ 锚·档缺/, `跨仓形零命中（写作被放行），实际：${report}`)
  assert.match(report, /仓「thin2」的 docs\/guide\.md（声明源引用，未校验存在性）/, `已声明形一行读数，实际：${report}`)
  assert.match(report, /引用外部仓「otherside」——引用外部仓须先在 index\.publicRepos 声明/, `未声明形报须先声明，实际：${report}`)
  assert.match(report, /本机仓名候选：.*otherside/, `未声明形给仓名候选，实际：${report}`)
})

// ── 29-5 形态错的跨仓引用：文档面仍阻断；改台账面 ⇒ 硬拒（KD-10 的可见差）──
test('29-5 形态错的跨仓引用：文档门仍判缺（阻断）；同输入改台账面 ⇒ 硬拒', { timeout: 60_000 }, async (t) => {
  const root = makeProject({ "docs/core/design/bad-form.md": "# 形态错\n\n借道：thin2/../escape.md\n" }, ["thin2"])
  const report = String(docCheckTool.execute({ mode: "report", docs: ["docs/core/design/bad-form.md"] }, ctx0(root)))
  assert.match(report, /✗ 锚·档缺 docs\/core\/design\/bad-form\.md:3/, `形态错仍阻断，实际：${report}`)
  assert.doesNotMatch(report, /跨仓引用：/, `形态错不落 crossRepo，实际：${report}`)

  // 台账面：同形跨仓指针（task_book 指向外部仓）⇒ 写门硬拒（L4 判据零改）
  await seedRow(root, "docs/batches/2026-11-02-bad.md", { writeRecord: true })
  const ledger = ledgerTool
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "夹具行 · 跨仓指针" }, boundary: root })
  await assert.rejects(
    () => ledger.execute({ action: "update", id, status: "在途", task_book: "thin2/../escape.md" }, ctx0(root)),
    /task_book 指向的档不存在/,
    "台账面跨仓指针硬拒（文档面放宽、台账面不放宽）",
  )
})

/** 种一行未决账（批档写门 / 台账面用法与既有夹具同形）。 */
async function seedRow(root, recordRel, { writeRecord = false } = {}) {
  if (writeRecord) put(root, recordRel, BATCH_SKELETON)
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "夹具批 · 路径解析" }, boundary: root })
  const ledger = ledgerTool
  await ledgerTool.execute({ action: "update", id, status: "在途", task_book: recordRel }, ctx0(root))
  return id
}
