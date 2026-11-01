/**
 * ledger-read-cross-project.test.mjs — 集成用例 21-1 / 21-2 / 21-3 / 21-4（RTM CLI 端故事 21「跨项目读账读的是目标项目」；
 * 判据原文 = `test/RTM.md` 第 21 节；机制单源 = `docs/core/design/LEDGER.md` §3.10，界判据 = 同档 §3.8「界（单源 · 三面三界）」）。
 *
 * 业务入口 = 进程锚 ≠ 目标项目时读账：`ledger list --json --cwd <目标项目>`（命令面 runner `runLedgerList`）
 * ∥ ACP `ledger/list` ∥ `ledger/count`（`params.cwd` = 目标项目）。断言面 = stdout 单段 JSON + 退出码
 * ∥ ACP 回包对象——**不读库**（读面自证）。
 *
 * 为什么只断「不抛」不够：缺界时的现场形态是**静默空账**（`thincoder-core/ledger-db.mjs:255` 读面空账
 * 两类同形——「未注册目录 ∥ 目标落在界外的已注册项目」——且**读面不抛**）——越界与真无库同形、零报错、
 * 退出码 0。故 21-1 / 21-3 同时锁三件：有项目项（非空集）· 项是目标项目 · 行集是目标项目的行（零旁项目行）。
 *
 * 夹具纪律（设计档 §3.10「进入口与断言面」三条，缺一项即污染同进程后续用例）：
 * ① 造行**先于任何 `chdir`**，走核 `ledgerAdd({ cwd, row, boundary })`——不经工具面，故无 `anchorOf(ctx)`
 *    那一臂（若改走工具面，锚 = A 而 cwd = B 时 `assertLedgerStart` 当场抛无根）；
 * ② `process.chdir` 只包住被测调用本身；
 * ③ 复原**两件**：`chdir` 由每次调用的 `try/finally` 回原目录（`withCwd`）；台账库目录注入
 *    `_setLedgerDirForTest(<临时域>)` 由 `after()` 里的 `_resetLedgerDirForTest()` 复原（先例
 *    `test/integration/batch-close-gate.test.mjs`）——只复原 `chdir` 会让后续用例继承夹库目录。
 * `ledger.mjs` / `ledger-read.mjs` 一律动态 import（静态链入 `node:sqlite`——W8 契约②）。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/ledger-read-cross-project.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"

import { createReadDataHandlers } from "../../thincoder-cli/src/acp/read-data.mjs"

const { _setLedgerDirForTest, _resetLedgerDirForTest, ledgerAdd, ledgerClose, ledgerDbPath } = await import("../../thincoder-core/ledger.mjs")
const { runLedgerList } = await import("../../thincoder-core/ledger-read.mjs")

const MANIFEST_REL = "PROJECT-MANIFEST.json"

/** 台账库目录 = 系统临时域（`_setLedgerDirForTest` 覆盖 ⇒ 夹具根外零写；`after` 恒复原）。 */
const ledgerDir = mkdtempSync(join(tmpdir(), "lrcp-ledgerdir-"))
_setLedgerDirForTest(ledgerDir)

const tempRoots = [ledgerDir]

/** 带档项目（真写 `PROJECT-MANIFEST.json`——「项目」的唯一判据 = 档在盘，库在盘不算项目）。 */
function makeProject(tag) {
  const root = mkdtempSync(join(tmpdir(), `lrcp-${tag}-`))
  tempRoots.push(root)
  writeFileSync(join(root, MANIFEST_REL), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  return root
}

const A = makeProject("A") // 进程锚 = 另一个带档项目（有行）
const B = makeProject("B") // 目标项目
const C = makeProject("C") // 带档但从不写台账 ⇒ 键控库不在盘

const A_TITLES = ["A-行一（旁项目）", "A-行二（旁项目）"]
const B_TITLES = ["B-行一", "B-行二（复启到期 + evidence 文字太长）", "B-行三", "B-行四（已废弃）"]
/** B 的期望读数（夹具已知量）：三条未决行（第四条已废弃不计）· 其一复启到期 · 其一 evidence 文字太长。
 *  A 的未决行数 = 2 ⇒ 本组读数与「读了旁项目 A」可区分（判据落到 A 时 count 会是 2，不是 3）。 */
const B_EXPECT = { count: 3, overdue: 1, evidenceTooLong: 1 }

// 造行先于任何 chdir（夹具纪律①）；`boundary` = 该项目根 ⇒ 界恒含目标自身。
for (const title of A_TITLES) ledgerAdd({ cwd: A, row: { kind: "tech_todo", title }, boundary: A })
/** B 的行 id 集（`ledgerAdd` 返回值——21-1 的「行 id 集 = B 的行」逐字断它）。 */
const B_IDS = []
B_IDS.push(ledgerAdd({ cwd: B, row: { kind: "requirement", title: B_TITLES[0] }, boundary: B }))
B_IDS.push(ledgerAdd({
  cwd: B,
  row: { kind: "requirement", title: B_TITLES[1], trigger: "条件", resume_when: "等外部事件 @2020-01-01", evidence: "长".repeat(320) },
  boundary: B,
}))
B_IDS.push(ledgerAdd({ cwd: B, row: { kind: "requirement", title: B_TITLES[2] }, boundary: B }))
const closedId = ledgerAdd({ cwd: B, row: { kind: "tech_todo", title: B_TITLES[3] }, boundary: B })
B_IDS.push(closedId)
ledgerClose({ cwd: B, id: closedId, status: "已废弃", boundary: B })

after(() => {
  _resetLedgerDirForTest()
  // `force` 只忽略 ENOENT、不重试 EPERM/EBUSY；句柄未即释时清理会抛 ⇒ 给重试窗（先例 batch-close-gate.test.mjs）。
  for (const p of tempRoots) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** `chdir` 包裹（夹具纪律②③）：只包住被测调用本身，`finally` 恒复原进程锚。
 *  **同步形 ∥ async 形不可互代**：ACP 处理器是 async，而同步 `finally` 在它返回 Promise 的那一拍就复原
 *  目录（首条 `await` 都还没跑）⇒ 被测体实际不在「进程锚 = A」下运行。 */
function withCwd(dir, fn) {
  const from = process.cwd()
  process.chdir(dir)
  try { return fn() } finally { process.chdir(from) }
}

async function withCwdAsync(dir, fn) {
  const from = process.cwd()
  process.chdir(dir)
  try { return await fn() } finally { process.chdir(from) }
}

/** CLI 面 = 进程内跑 runner（壳只分发，不改被观测的东西）；`cwd` 缺省在**调用时**取值 = 进程锚。 */
function runListCli(args, anchor) {
  const out = [], err = []
  const code = withCwd(anchor, () => runLedgerList(args, {
    cwd: process.cwd(),
    out: (line) => out.push(String(line)),
    err: (line) => err.push(String(line)),
  }))
  return { code, stdout: out.join("\n"), stderr: err.join("\n") }
}

/** 「stdout 单段 JSON」的机检形：恰一段、可解析、零杂行。 */
function singleJson(stdout) {
  const lines = stdout.split("\n").filter((line) => line.trim() !== "")
  assert.equal(lines.length, 1, `stdout 应恰一段 JSON（零杂行），实际 ${lines.length} 行：${stdout}`)
  return JSON.parse(lines[0])
}

/** ACP 面（会话锚 = `getCwd()`；凭据门放行 = `requireConfigured` 回值不带 error 键）。 */
const acpHandlers = (anchor) => createReadDataHandlers({ getCwd: () => anchor, requireConfigured: () => ({}) }).handlers

test('21-1 正常 · 进程锚 A、--cwd B ⇒ ledger list --json 给 1 项（根 = B）与 B 的行、零 A 行', () => {
  const r = runListCli(["--json", "--cwd", B], A)
  assert.equal(r.code, 0, `跨项目读应 exit 0，实际 ${r.code}：${r.stderr}`)
  assert.equal(r.stderr, "", "stderr 零行")

  const payload = singleJson(r.stdout)
  assert.equal(payload.projects.length, 1, `应恰 1 个项目项（目标项目 B），实际 ${payload.projects.length}：${r.stdout}`)

  const [p] = payload.projects
  assert.equal(p.root, resolve(B), "项目项须是目标项目 B（不是进程锚 A）")
  assert.equal(p.name, basename(B), "项目名 = 目标项目目录名")
  assert.equal(p.schemaVersion, 2, "schemaVersion = 库 PRAGMA user_version 如实回读（刻意按载荷值硬断，不引 LEDGER_SCHEMA_VERSION 常量）")
  assert.deepEqual(p.rows.map((x) => x.id), B_IDS, "行 id 集 = B 的行")
  assert.deepEqual(p.rows.map((x) => x.title), B_TITLES, "行集须是 B 的行（导出面不筛状态 ⇒ 含已废弃行）")
  assert.deepEqual(p.rows.filter((x) => A_TITLES.includes(x.title)), [], "零 A 行（旁项目不掺入）")
})

test('21-2 边界 · 同一 A 锚、--cwd <带档但无台账库的项目> ⇒ exit 0 · projects [] · stderr 零行', () => {
  // 夹具两项自证（缺任一项本例空转）：目标带档 ∧ 键控库不在盘
  assert.ok(existsSync(join(C, MANIFEST_REL)), "夹具：目标项目 C 带 PROJECT-MANIFEST.json")
  assert.equal(existsSync(ledgerDbPath(C, C)), false, `夹具：C 的键控库不在盘（${ledgerDbPath(C, C)}）`)

  const r = runListCli(["--json", "--cwd", C], A)
  assert.equal(r.code, 0, "空账不改成抛（需求档验收 ②「空库空集 exit 0」）")
  assert.equal(r.stderr, "", "stderr 零行（空账不是错误）")
  assert.deepEqual(singleJson(r.stdout), { projects: [] }, "空集，不是报错")
})

test('21-3 正常 · ACP ledger/list（params.cwd = B、会话锚 = A）⇒ 1 项 · 根 = B · 零 A 行，且与 21-1 载荷深等', async () => {
  const cliPayload = singleJson(runListCli(["--json", "--cwd", B], A).stdout)
  const reply = await withCwdAsync(A, () => acpHandlers(A)["ledger/list"]({ cwd: B }))

  // 三锁照 21-1 判：只断「与 CLI 深等」不够——两出口同时读空也能深等（静默空正是这么溜过去的）
  assert.equal(reply.projects.length, 1, `应恰 1 个项目项，实际 ${reply.projects.length}：${JSON.stringify(reply)}`)
  assert.equal(reply.projects[0].root, resolve(B), "项目项须是目标项目 B（不是会话锚 A）")
  assert.deepEqual(reply.projects[0].rows.map((x) => x.title), B_TITLES, "行集须是 B 的行")
  assert.deepEqual(reply.projects[0].rows.filter((x) => A_TITLES.includes(x.title)), [], "零 A 行")
  assert.deepEqual(reply, cliPayload, "两出口载荷深等（同一序列化单源）")
})

test('21-4 正常 · ACP ledger/count（params.cwd = B、会话锚 = A）⇒ count = B 的未决四态行数（≠ 0）', async () => {
  const reply = await withCwdAsync(A, () => acpHandlers(A)["ledger/count"]({ cwd: B }))

  assert.notEqual(reply.count, 0, `跨项目计数须非 0（无根 ⇒ 三零、零报错——正是本行要抓的形态）：${JSON.stringify(reply)}`)
  assert.deepEqual(reply, B_EXPECT, "count = B 的未决四态行数；overdue ∥ evidenceTooLong 取 B 的读数（不是 A 的）")
})
