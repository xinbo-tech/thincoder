/**
 * ledger-close-proof.test.mjs — 集成用例 10-3 ∥ 10-5（RTM CLI 端故事 10「收口即清账」；
 * 回指需求 F-LX4 · AC-M2-34）；机制 = 批档 §2「核销机检」——写 `已核销` 前判三件：
 * ① `task_book` 所指批档在盘 ② 该档 §1 = `已收口` ③ 该档 `§3` 状态行 = `评审通过`。
 *
 * ③ 是**档面事实**（三链统一批 R6）：不再读 token 槽的批次归属——判据从「谁在跑」改成「评审过没过」，
 * 换会话 / 重启进程 / 隔天补账都成立。本档因此**不造槽**（槽里空无一物，a 行照样过）——这就把
 * 「不看槽」变成可观察结果，否则「不看槽」只是一句声明。
 *
 * 10-3 的 d 档 = **存量声明档**（§1 已收口 + §1 段体写着 `> 不适用：§3`）：声明机制退役后，核销门不认声明、
 * 也不读它——照 ③ 如实拒。本档断言「不抛错、行零改」两件，即证明读面不被那行字反射。
 *
 * 业务入口 = 真 `ledger` 工具（`ledger-tools.mjs` depth-0 全量变体）的 `close` action——
 * 台账没有 `ledger close` CLI 子命令，模型面工具即产品的用户可径入口。
 * 断言面 = 工具回执 / 拒因文本 + 行集落盘值（`status` / `closed_at`）。
 *
 * 夹具 = 系统临时域（项目根 + 四份批档 + 行集；独立会话槽根 ∥ 台账库目录——零落真实用户目录）。
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
const DECLARED = "docs/batches/declared.md" // d 行：存量声明档（§1 已收口 ∧ §1 段体声明 §3 不适用 ∧ §3 未过评审）

/** 六段批档（§1 状态行 ∥ §3 状态行 ∥ §1 段体按参）。 */
const recordText = (statusLine, s3Line, sec1 = "夹具讨论。") => [
  "# 夹具批 · 核销机检",
  "",
  "> 编制：夹具 · 2026-10-26 · 来源 = 集成夹具。",
  "",
  "## §1 讨论（主 agent）",
  `**状态行**：${statusLine}`,
  "",
  sec1,
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
  writeFileSync(join(root, DECLARED), recordText("✅ 已收口 2026-10-26", "进行中", "夹具讨论。\n\n> 不适用：§3 —— 纯措辞纠正批。"))
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

/** 造一行任意现态（认领三步的步数可截——本档 10-5 用来停在 `待讨论` / `待设计` / `在途`）。 */
async function rowAt(ctx, taskBook, title, steps = []) {
  const { id } = JSON.parse(await exec(ctx, { action: "add", kind: "tech_todo", title, task_book: taskBook }))
  for (const status of steps) await exec(ctx, { action: "update", id, status })
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
  const d = await pendingCloseRow(ctx, DECLARED, "核销机检 d · 存量声明档")

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

  // d（存量声明档）：§1 那行 `> 不适用：§3 —— …` 既不抛错也不放行——核销门不读声明，照 ③ 如实拒；行零改
  await assert.rejects(() => exec(ctx, { action: "close", id: d, status: "已核销" }), (e) => {
    assert.match(e.message, /——缺：③/, `回执点名缺 ③：${e.message}`)
    assert.match(e.message, /③ 批档 §3 未通过评审（§3 状态行 = 进行中，须 = 评审通过）：重开该档补评审结论，或另起批次/, `拒因行逐字：${e.message}`)
    assert.doesNotMatch(e.message, /不适用/, `拒因不提声明（那机制已退役，读面不认它）：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, d).status, "待核销", "d 行 status 仍 待核销")
  assert.equal(rowOf(root, d).closed_at, null, "d 行 closed_at 仍空")

  // 两条存储各管各的：被拒的台账动作不改批档字节（“台账零改”由上面两处 rowOf 证实）
  const recordBytes = readFileSync(join(root, CLOSED), "utf8")
  assert.match(recordBytes, /\*\*状态行\*\*：✅ 已收口 2026-10-26/, "批档不受台账动作影响（两条存储各管各的）")
})

test("10-5 错误 ∥ 正常 · 核销只有一条边：待讨论 / 待设计 / 在途 / 归档态一律拒（逐态出路句），认领三步全过", async () => {
  const { root, agent } = fixture()
  const ctx = ctxOf(agent)

  // 待讨论 ⇒ 拒；出路 = 认领句（并点名现态）
  const id = await rowAt(ctx, CLOSED, "核销边 10-5 · 待讨论")
  await assert.rejects(() => exec(ctx, { action: "close", id, status: "已核销" }), (e) => {
    assert.match(e.message, /ledgerClose：核销仅限 待核销（现态 待讨论）：先 update 到 在途 认领，再 update 到 待核销，最后 close 勾销/, `待讨论 拒文逐字：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, id).status, "待讨论", "待讨论 行 status 零变")
  assert.equal(rowOf(root, id).closed_at, null, "待讨论 行 closed_at 仍空")

  // 待设计 ⇒ 拒；出路句同待讨论（两者都还没被认领）
  await exec(ctx, { action: "update", id, status: "待设计" })
  await assert.rejects(() => exec(ctx, { action: "close", id, status: "已核销" }), (e) => {
    assert.match(e.message, /核销仅限 待核销（现态 待设计）：先 update 到 在途 认领，再 update 到 待核销，最后 close 勾销/, `待设计 拒文逐字：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, id).status, "待设计", "待设计 行 status 零变")
  assert.equal(rowOf(root, id).closed_at, null, "待设计 行 closed_at 仍空")

  // 在途 ⇒ 拒；出路 = 结账句（不是认领句——对已认领的行说「先去认领」是让人重做一步已做的事）
  await exec(ctx, { action: "update", id, status: "在途" })
  await assert.rejects(() => exec(ctx, { action: "close", id, status: "已核销" }), (e) => {
    assert.match(e.message, /核销仅限 待核销（现态 在途）：先 update 到 待核销（做完才结账），再 close 勾销/, `在途 拒文逐字：${e.message}`)
    assert.doesNotMatch(e.message, /在途 认领/, `在途 不给认领句：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, id).status, "在途", "在途 行 status 零变")
  assert.equal(rowOf(root, id).closed_at, null, "在途 行 closed_at 仍空")

  // 认领三步全过：在途 → 待核销 → 勾销（“条目在别处完成”也只有这一条走法）
  await exec(ctx, { action: "update", id, status: "待核销" })
  const settled = await exec(ctx, { action: "close", id, status: "已核销" })
  assert.match(settled, /"status":"已核销"/, `三步全过后勾销成功：${settled}`)
  assert.equal(rowOf(root, id).status, "已核销")
  assert.ok(rowOf(root, id).closed_at, "勾销后 closed_at 落值")

  // 归档态 ⇒ 拒；出路 = 归档句（该行不在核销面）——两支都要断言：`已废弃`（撤回后）∥ `已核销`（勾销后重按）
  const gone = await rowAt(ctx, CLOSED, "核销边 10-5 · 已撤回")
  await exec(ctx, { action: "close", id: gone, status: "已废弃" })
  await assert.rejects(() => exec(ctx, { action: "close", id: gone, status: "已核销" }), (e) => {
    assert.match(e.message, /核销仅限 待核销（现态 已废弃）：该行已归档（已废弃），不在核销面/, `归档态（已废弃）拒文逐字：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, gone).status, "已废弃", "归档行 status 零变")

  const settledTwice = await rowAt(ctx, CLOSED, "核销边 10-5 · 已核销再按", ["待设计", "在途", "待核销"])
  await exec(ctx, { action: "close", id: settledTwice, status: "已核销" })
  await assert.rejects(() => exec(ctx, { action: "close", id: settledTwice, status: "已核销" }), (e) => {
    assert.match(e.message, /核销仅限 待核销（现态 已核销）：该行已归档（已核销），不在核销面/, `归档态（已核销）拒文逐字：${e.message}`)
    return true
  })
  assert.equal(rowOf(root, settledTwice).status, "已核销", "归档行 status 零变")
})
