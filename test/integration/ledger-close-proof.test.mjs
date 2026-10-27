/**
 * ledger-close-proof.test.mjs — 集成用例 10-3（RTM CLI 端故事 10「收口即清账」；
 * 回指需求 F-LX4 · AC-M2-34）；机制 = 批档 §2「核销机检」——写 `已核销` 前判三件：
 * ① `task_book` 所指批档在盘 ② 该档 §1 = `已收口` ③ 该档 `§3` 状态行 = `评审通过`。
 *
 * ③ 是**档面事实**（三链统一批 R6）：不再读 token 槽的批次归属——判据从「谁在跑」改成「评审过没过」，
 * 换会话 / 重启进程 / 隔天补账都成立。本档因此**不造槽**（槽里空无一物，a 行照样过）——这就把
 * 「不看槽」变成可观察结果，否则「不看槽」只是一句声明。
 *
 * 业务入口 = 真 `ledger` 工具（`ledger-tools.mjs` depth-0 全量变体）的 `close` action——
 * 台账没有 `ledger close` CLI 子命令，模型面工具即产品的用户可径入口。
 * 断言面 = 工具回执 / 拒因文本 + 行集落盘值（`status` / `closed_at`）。
 *
 * 夹具 = 系统临时域（项目根 + 三份批档 + 三行台账；独立会话槽根 ∥ 台账库目录——零落真实用户目录）。
 * 复跑（cwd = 仓根）：`node --test test/integration/ledger-close-proof.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest } from "../../thincoder-core/session-slots.mjs"
// 台账模块静态链入 `node:sqlite`（W8 契约②）——消费侧一律动态取。
const { _resetLedgerDirForTest, _setLedgerDirForTest, ledgerQuery, ledgerTool } = await import("../../thincoder-core/ledger.mjs")

const CLOSED = "docs/batches/closed.md" // a 行：已收口 ∧ §3 = 评审通过
const OPEN = "docs/batches/open.md" // b 行：未收口（§3 已 pass）
const CLOSED_NO_REVIEW = "docs/batches/closed-no-review.md" // c 行：已收口 ∧ §3 未过评审

/** 六段批档（§1 状态行与 §3 状态行按参）。 */
const recordText = (statusLine, s3Line) => [
  "# 夹具批 · 核销机检",
  "",
  "> 编制：夹具 · 2026-10-26 · 来源 = 集成夹具。",
  "",
  "## §1 讨论（主 agent）",
  `**状态行**：${statusLine}`,
  "",
  "夹具讨论。",
  "",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：设计完成",
  "",
  "夹具任务。",
  "",
  "## §3 设计评审（评审子代理）",
  `**状态行**：${s3Line}`,
  "",
  "夹具评审。",
  "",
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

const sessionsDir = mkdtempSync(join(tmpdir(), "lcproof-sessions-"))
const ledgerDir = mkdtempSync(join(tmpdir(), "lcproof-ledger-"))
_setSessionsDirForTest(sessionsDir)
_setLedgerDirForTest(ledgerDir)

const projects = []
after(() => {
  _resetSessionsDirForTest()
  _resetLedgerDirForTest()
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(sessionsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 工程模式夹具：项目根（声明 + 三份批档）+ depth-0 主 agent（槽号钉 1）。 */
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "lcproof-"))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  writeFileSync(join(root, CLOSED), recordText("✅ 已收口 2026-10-26", "评审通过"))
  writeFileSync(join(root, OPEN), recordText("🔄 进行中", "评审通过"))
  writeFileSync(join(root, CLOSED_NO_REVIEW), recordText("✅ 已收口 2026-10-26", "进行中"))
  const agent = { cwd: root, _slot: 1, _sessionStart: "2026-10-26T00:00:00.000Z", _touchedFiles: [], config: { agent: { engineering: true } } }
  return { root, agent }
}

const ctxOf = (agent) => ({ depth: 0, agent })
const exec = (ctx, args) => ledgerTool.execute(args, ctx)
const rowOf = (root, id) => ledgerQuery({ cwd: root, boundary: root }).find((r) => r.id === id)

/** 造一行 `待核销`（写门要求的迁移链三步；`task_book` 在 add 时落）。 */
async function pendingCloseRow(ctx, taskBook, title) {
  const { id } = JSON.parse(await exec(ctx, { action: "add", kind: "tech_todo", title, task_book: taskBook }))
  for (const status of ["待设计", "在途", "待核销"]) await exec(ctx, { action: "update", id, status })
  return id
}

test("10-3 正常 ∥ 错误 · 核销机检三件：a 全过即清账（槽内空无一物也过），b 点名缺 ②，c 点名缺 ③（两行零改）", async () => {
  const { root, agent } = fixture()
  const ctx = ctxOf(agent)
  // 前置：夹具未造槽（本档不调 settle / 不造归属表）——“③ 不看槽”的可观察面是下面 a 行当场核销成功
  assert.equal(agent._engDesignTokenBatches, undefined, "前置：夹具未造槽（故 a 行能过 = ③ 确实没去读槽）")

  const a = await pendingCloseRow(ctx, CLOSED, "核销机检 a · 三件齐")
  const b = await pendingCloseRow(ctx, OPEN, "核销机检 b · 批档未收口")
  const c = await pendingCloseRow(ctx, CLOSED_NO_REVIEW, "核销机检 c · §3 未过评审")

  // a：三件齐 ⇒ 核销成功、closed_at 落值
  const receiptA = await exec(ctx, { action: "close", id: a, status: "已核销" })
  assert.match(receiptA, /"status":"已核销"/, `a 行应核销成功：${receiptA}`)
  assert.equal(rowOf(root, a).status, "已核销")
  assert.ok(rowOf(root, a).closed_at, "a 行 closed_at 非空")

  // b：批档在盘但 §1 = 进行中 ⇒ 拒、点名缺 ②；行零改
  await assert.rejects(() => exec(ctx, { action: "close", id: b, status: "已核销" }), (e) => {
    assert.match(e.message, /——缺：②/, `回执点名缺 ②：${e.message}`)
    assert.match(e.message, /② 批档未收口（.+open\.md §1 = open）/i, `拒因行点名状态与路径：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, b).status, "待核销", "b 行 status 仍 待核销")
  assert.equal(rowOf(root, b).closed_at, null, "b 行 closed_at 仍空")

  // c：批档已收口、但 §3 未过评审 ⇒ 拒、点名缺 ③；行零改
  await assert.rejects(() => exec(ctx, { action: "close", id: c, status: "已核销" }), (e) => {
    assert.match(e.message, /——缺：③/, `回执点名缺 ③：${e.message}`)
    assert.match(e.message, /③ 批档 §3 未通过评审（§3 状态行 = 进行中，须 = 评审通过）/, `拒因行逐字：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, c).status, "待核销", "c 行 status 仍 待核销")
  assert.equal(rowOf(root, c).closed_at, null, "c 行 closed_at 仍空")

  // 两条存储各管各的：被拒的台账动作不改批档字节（“台账零改”由上面两处 rowOf 证实）
  const recordBytes = readFileSync(join(root, CLOSED), "utf8")
  assert.match(recordBytes, /\*\*状态行\*\*：✅ 已收口 2026-10-26/, "批档不受台账动作影响（两条存储各管各的）")
})
