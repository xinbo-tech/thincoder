/**
 * ledger-executor.test.mjs — 台账执行者归属用例（F-LX1 · LEDGER-EXECUTOR 批——设计档
 * docs/core/design/LEDGER.md §2 / §3.1 / §7.1 / §7.3.1 / §8 / §9 · 批次档 §2.5 AC 对照）。
 *
 * 面：T15 三形态写语义（缺省注入 / patch 显式优先 / 行现值兜底——第三拍按裁定 #1 直调不注入
 * executorSessionId 才可达）· T16 两出边清空（patch 不复活）· T17 ledgerClose 撤回同步置 NULL
 * + 勾销零触 + 纯字段更新零变 · T18 老库幂等迁移（旧 DDL 裸建 → 补列不损 / 二次幂等 /
 * duplicate 竞争 → 复核吞——裁定 #3 谓词注入喂复核单元）· T19 判活展示三态文案（注入
 * aliveFn/cmdlineFn；dead 优先 / staleDays 标注 / 探测失败不显死亡——裁定 #8 TTL 缝 finally 恢复）
 * · T20 性能红线（无在途零 exec / TTL 内零 exec / 写径零探测）。
 * 手法：临时 cwd + 自造在档 + tmp 台账库（`_setLedgerDirForTest`——不读写真实用户库，夹具同
 * `ledger-write-gate.test.mjs`）；迁「在途」必带 task_book（CHECK + 写门咬合）；判活探测经
 * `_setProcessProbeTestImpl` 注入缝（批量语义——零真实子进程）；「写命令不可达」的行态经原生
 * SQL 直构（同 `ledger-write-gate.test.mjs` T14 先例）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import {
  buildScan, executorTail, formatDetailLine, ledgerAdd, ledgerClose, ledgerDbPath, ledgerQuery,
  ledgerUpdate, openLedger, resolveExecutorStates, _resetLedgerDirForTest, _setExecutorProbeTtlForTest,
  _setLedgerDirForTest,
} from "../ledger.mjs"
import { ensureExecutorColumn } from "../ledger-db.mjs"
import { _resetProcessProbeTestImpl, _setProcessProbeTestImpl } from "../process-probe.mjs"
import { PEER_PROBE_TTL_MS } from "../peer-instances.mjs"

let tmp, seq = 0
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-exec-"))
  _setLedgerDirForTest(join(tmp, "ledgerdir"))
})
afterEach(() => {
  _resetLedgerDirForTest()
  _resetProcessProbeTestImpl()
  _setExecutorProbeTtlForTest(null) // TTL 缝恢复（裁定 #8——测试间不串）
  rmSync(tmp, { recursive: true, force: true })
})

/** 夹具：临时项目（cwd）+ 自造在档 + 新行（入待讨论 → 迁待设计——在途由各用例带 task_book 迁）。 */
function fixture() {
  const proj = join(tmp, `proj${seq++}`)
  mkdirSync(join(proj, "docs", "batches"), { recursive: true })
  writeFileSync(join(proj, "docs", "batches", "here.md"), "# 在档\n")
  const id = ledgerAdd({ cwd: proj, row: { kind: "requirement", title: `执行者用例 ${seq}` } })
  ledgerUpdate({ cwd: proj, id, patch: { status: "待设计" } })
  return { proj, id }
}
const rowOf = (proj, id) => ledgerQuery({ cwd: proj }).find((r) => r.id === id)
/** 迁在途（带合法 task_book——CHECK + 写门咬合）；executorSessionId 缺省 = 注入值。 */
const goInflight = (proj, id, executorSessionId = "9001-sess") =>
  ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: "docs/batches/here.md" }, executorSessionId })
/** 在途行时间戳回拨 staleDays 天（「N 天未动」标注源——updated_at 时间戳纯注入，零探测）。 */
function backdate(proj, id, staleDays) {
  const t = new Date(Date.now() - staleDays * 86400000).toISOString()
  const db = openLedger(proj, { create: true })
  db.prepare("UPDATE items SET updated_at = ?, created_at = ? WHERE id = ?").run(t, t, id)
  db.close()
}
/** 注入缝计数驱动（process-probe.test.mjs 同款）：aliveFn 缺省 = 入参全活；返回计数对象。 */
function counted() {
  const calls = { alive: 0, cmdline: 0 }
  _setProcessProbeTestImpl({
    aliveFn: (pids) => { calls.alive++; return new Set(pids) },
    cmdlineFn: (pids) => { calls.cmdline++; return new Map() },
  })
  return calls
}

// ── T15 进「在途」三形态写语义（AC-M2-7 · LEDGER.md §3.1 优先级链） ─────────────
test("T15 正常：进在途——缺省注入 / patch 显式优先 / 行现值兜底（直调不注入才可达）", () => {
  // ① 缺省注入：executorSessionId 直落列
  const a = fixture()
  goInflight(a.proj, a.id, "9001-sess")
  assert.equal(rowOf(a.proj, a.id).executor, "9001-sess", "缺省注入 = executorSessionId 直落")

  // ② patch 显式优先：patch.executor 压过注入值（接手软语义——改写归属）
  const b = fixture()
  goInflight(b.proj, b.id, "9001-stale")
  assert.equal(rowOf(b.proj, b.id).executor, "9001-stale", "前提：先注入（带参形态下兜底不可达）")
  ledgerUpdate({ cwd: b.proj, id: b.id, patch: { executor: "7002-takeover" }, executorSessionId: "9001-stale" })
  assert.equal(rowOf(b.proj, b.id).executor, "7002-takeover", "patch 显式 > 注入值（接手改写归属）")

  // ③ 行现值兜底：直调不注入 executorSessionId（裁定 #1——工具层恒带注入值 ⇒ 该分支仅直调可达；
  //    行已带值 → 保留行值不覆盖）
  const c = fixture()
  ledgerUpdate({ cwd: c.proj, id: c.id, patch: { executor: "6001-early" } }) // 待设计态纯字段更新（无状态迁移）
  ledgerUpdate({ cwd: c.proj, id: c.id, patch: { status: "在途", task_book: "docs/batches/here.md" } })
  assert.equal(rowOf(c.proj, c.id).executor, "6001-early", "无注入值 → 行现值兜底保留")
})

// ── T16 离「在途」两出边清空 + patch 不复活（AC-M2-7） ─────────────────────────
test("T16 边界：出边自动语义压 patch——→待核销 / →已废弃 均清 NULL；显式传 executor 不复活", () => {
  for (const to of ["待核销", "已废弃"]) {
    const { proj, id } = fixture()
    goInflight(proj, id, "9001-sess")
    assert.equal(rowOf(proj, id).executor, "9001-sess", `前提（→${to}）：在途带值`)
    ledgerUpdate({ cwd: proj, id, patch: { status: to, executor: "7777-hijack" }, executorSessionId: "9001-sess" })
    assert.equal(rowOf(proj, id).executor, null, `→${to} 自动语义压 patch——显式传也不复活`)
  }
  // 非出边更新（无状态迁移）executor 零变：行现值兜底
  const c = fixture()
  goInflight(c.proj, c.id, "9001-sess")
  ledgerUpdate({ cwd: c.proj, id: c.id, patch: { title: "改名不触碰执行者" } })
  assert.equal(rowOf(c.proj, c.id).executor, "9001-sess", "无状态迁移 → 行现值兜底（零变）")
})

// ── T17 ledgerClose 撤回同步 / 勾销零触（AC-M2-7） ─────────────────────────────
test("T17 边界：ledgerClose 撤回（在途→已废弃）同步置 NULL；勾销路径零触碰 executor；纯字段零变", () => {
  // 撤回：在途直撤 → executor 同步 NULL（LEDGER.md §3.1 ④——不依赖出边迁移）
  const a = fixture()
  goInflight(a.proj, a.id, "9001-sess")
  assert.equal(rowOf(a.proj, a.id).executor, "9001-sess", "前提：在途带值")
  ledgerClose({ cwd: a.proj, id: a.id, status: "已废弃" })
  assert.equal(rowOf(a.proj, a.id).executor, null, "撤回同步置 NULL")

  // 勾销零触（可观测强断言）：待核销行 executor 经写命令已恒 NULL ⇒ 原生 SQL 直构哨兵值
  // （该态写命令不可达——同写门用例 T14 先例）；close 后哨兵原样 = 「零触碰」而非「清零」
  const b = fixture()
  goInflight(b.proj, b.id, "9001-sess")
  ledgerUpdate({ cwd: b.proj, id: b.id, patch: { status: "待核销" } })
  assert.equal(rowOf(b.proj, b.id).executor, null, "前提：离场迁移已清")
  {
    const db = openLedger(b.proj, { create: true })
    db.prepare("UPDATE items SET executor = 'keep-me' WHERE id = ?").run(b.id)
    db.close()
  }
  ledgerClose({ cwd: b.proj, id: b.id, status: "已核销" })
  assert.equal(rowOf(b.proj, b.id).executor, "keep-me", "勾销零触碰（哨兵原样保留——非清零动作）")
})

// ── T18 老库幂等迁移（设计档 §2 · K-LX5） ──────────────────────────────────────
test("T18 边界：旧 DDL 裸建 → 补列不损 / 二次幂等 / duplicate 竞争 → 复核吞", async () => {
  // ① 旧 DDL 裸建（无 executor 列）+ 存量行 → openLedger 幂等补列，行不损（K-LX5 零删改零重建）
  const { proj } = fixture() // 先经 openLedger 建库建目录（旧 DDL 裸表在其上重建）
  const file = ledgerDbPath(proj)
  const oldDdl = "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('requirement','tech_todo')), status TEXT NOT NULL CHECK(status IN ('待讨论','待设计','在途','待核销','已核销','已废弃')), title TEXT NOT NULL, board TEXT, req_doc TEXT, task_book TEXT, evidence TEXT, trigger TEXT CHECK(trigger IN ('归批','条件','认账不排期') OR trigger IS NULL), created_at TEXT, updated_at TEXT, closed_at TEXT, CHECK (status NOT IN ('在途','待核销') OR (task_book IS NOT NULL AND task_book <> '')))"
  const seeded = { kind: "requirement", status: "待设计", title: "旧库存量行", task_book: "docs/batches/here.md" }
  {
    const db = openLedger(proj, { create: true })
    db.exec("DROP TABLE items")
    db.exec(oldDdl)
    db.prepare("INSERT INTO items (kind, status, title, task_book, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(seeded.kind, seeded.status, seeded.title, seeded.task_book, "2026-09-01T00:00:00.000Z", "2026-09-01T00:00:00.000Z")
    db.close()
    // 复核：落盘的库此刻确无 executor 列（旧 DDL 生效——前提机检）
    const probe = new DatabaseSync(file)
    assert.equal(probe.prepare("SELECT 1 FROM pragma_table_info('items') WHERE name = 'executor'").get(), undefined, "前提：旧 DDL 建的库缺列")
    probe.close()
  }
  openLedger(proj, { create: true }).close() // 重开（写面）→ 幂等迁移补列
  const rows = ledgerQuery({ cwd: proj })
  assert.equal(rows.length, 1, "存量行不损（表级零重建——行集原样）")
  const kept = rows[0]
  assert.equal(kept.title, seeded.title)
  assert.equal(kept.status, "待设计", "状态逐字保留")
  assert.equal(kept.task_book, seeded.task_book, "指针逐字保留")
  assert.equal(kept.executor, null, "旧库存量行 executor = NULL（新列）")
  // 补列后写语义可达：迁在途带 executor 正常落列（老库升级闭环）
  ledgerUpdate({ cwd: proj, id: kept.id, patch: { status: "在途" }, executorSessionId: "9001-sess" })
  assert.equal(rowOf(proj, kept.id).executor, "9001-sess", "补列后写语义可达")
  // ② 二次打开幂等：列已在 → 不再 ALTER（false）
  {
    const db = openLedger(proj, { create: true })
    assert.equal(ensureExecutorColumn(db), false, "列已在 → false（幂等）")
    // ③ duplicate 竞争 → 复核吞（裁定 #3：首判缺列（谓词注入）→ ALTER 撞 duplicate（列实存）
    //    → catch 复核谓词翻转 → 吞。TOCTOU 窗确定性入口——竞态拍直测）
    let exists = false
    const flaky = () => { const v = exists; exists = true; return v } // 首判 false、复核 true
    assert.equal(ensureExecutorColumn(db, { exists: flaky }), false, "撞 duplicate → 复核列在 → 吞（false）")
    db.close()
    // 反证：首判缺列且列真缺 → 走 ALTER（true）——谓词注入同样可达正拍
    const bare = join(tmp, `bare${seq++}`)
    mkdirSync(bare, { recursive: true })
    const bareDb = new DatabaseSync(ledgerDbPath(bare))
    bareDb.exec(oldDdl)
    let called = false
    assert.equal(ensureExecutorColumn(bareDb, { exists: () => { called = true; return false } }), true, "真缺列 → ALTER（true）")
    assert.equal(called, true, "注入谓词被消费（非走默认实查路径）")
    bareDb.close()
  }
})

// ── T19 判活展示三态文案（AC-M2-8 + 必答② · LEDGER.md §7.3.1） ─────────────────
test("T19 正常：三态文案——dead 优先 / alive+回拨 ≥1 天标「N 天未动」/ 探测失败不显死亡", async () => {
  _setExecutorProbeTtlForTest(0) // 用例内恒重探（TTL 缝——裁定 #8；恢复见 afterEach）
  const CLI_PROC = process.platform === "win32" ? "node C:\\app\\thincoder.cjs" : "node /app/thincoder.cjs"
  // ① 属主已死 →「属主已死 <n>，可接手」（dead 优先）
  {
    const { proj, id } = fixture()
    goInflight(proj, id, "5001-dead")
    _setProcessProbeTestImpl({ aliveFn: (pids) => new Set(pids.filter((p) => p !== 5001)), cmdlineFn: () => new Map() })
    const s = buildScan({ cwd: proj })
    await resolveExecutorStates([s])
    assert.equal(s.deadExecutors, 1, "deadExecutors 计数")
    assert.deepEqual(s.executors, [{ executor: "5001-dead", pid: 5001, end: undefined, state: "dead", staleDays: 0 }])
    assert.equal(executorTail(s), "（属主已死 1，可接手）", "dead 优先文案")
    assert.equal(formatDetailLine(s), `台账 ${s.name}：需求池 1 · 技术待办 0（老化 0）（属主已死 1，可接手）`, "L2 尾段嵌入逐字（kind=requirement → 池 1 · 技术 0）")
  }
  // ② alive + 回拨 ≥1 天 →「执行中 <n> · 最长 <d> 天未动」；<1 天 →「执行中 <n>」
  {
    const { proj, id } = fixture()
    goInflight(proj, id, "6001-alive")
    backdate(proj, id, 3)
    _setProcessProbeTestImpl({ aliveFn: (pids) => new Set(pids), cmdlineFn: (pids) => new Map(pids.map((p) => [p, CLI_PROC])) })
    const s = buildScan({ cwd: proj })
    await resolveExecutorStates([s])
    assert.deepEqual(s.executors, [{ executor: "6001-alive", pid: 6001, end: "cli", state: "alive", staleDays: 3 }], "alive + end = classifyEnd(cmdline) + 行龄 3 天")
    assert.equal(executorTail(s), "（执行中 1 · 最长 3 天未动）", "staleDays ≥1 标注")
    backdate(proj, id, 0) // 当天（<1 天）→ 无「未动」段
    const s2 = buildScan({ cwd: proj })
    await resolveExecutorStates([s2])
    assert.equal(executorTail(s2), "（执行中 1）", "staleDays <1 → 无标注")
  }
  // ③ 探测失败（null）→ 不显死亡（D-MI10 保守）：unknown 不进死亡文案
  {
    const { proj, id } = fixture()
    goInflight(proj, id, "7001-fail")
    _setProcessProbeTestImpl({ aliveFn: () => null, cmdlineFn: () => null })
    const s = buildScan({ cwd: proj })
    await resolveExecutorStates([s])
    assert.deepEqual(s.executors, [{ executor: "7001-fail", pid: 7001, end: undefined, state: "unknown", staleDays: 0 }], "探测失败 ⇒ unknown")
    assert.equal(s.deadExecutors, 0, "不判死")
    assert.equal(executorTail(s), "（执行中 1）", "unknown 不进死亡文案（保守）")
  }
  // ④ 无在途 executor → 尾段空串 + deadExecutors 0（既有文案零破）
  {
    const { proj } = fixture() // 待设计行——无在途
    const s = buildScan({ cwd: proj })
    await resolveExecutorStates([s])
    assert.deepEqual(s.executors, [], "无在途 → 空数组")
    assert.equal(s.deadExecutors, 0)
    assert.equal(executorTail(s), "", "尾段空串（既有逐字断言零破）")
  }
})

// ── T20 性能红线（必答① · K-LX6） ──────────────────────────────────────────────
test("T20 性能：无在途零 exec / 同 pid TTL 内零 exec（越界重探）/ 写径零探测", async () => {
  // ① 无在途 executor ⇒ 零 exec（不探、不缓存）
  {
    const calls = counted()
    const s = buildScan({ cwd: fixture().proj }) // 待设计行——无在途
    await resolveExecutorStates([s])
    assert.equal(calls.alive, 0, "无在途 → 零判活 exec")
    assert.equal(calls.cmdline, 0, "无在途 → 零 cmdline exec")
    assert.deepEqual(s.executors, [])
  }
  // ② TTL 缓存：同 pid TTL 内第二次解析零 exec（5s 同源口径；now 注入——确定性界值拍）
  {
    assert.equal(PEER_PROBE_TTL_MS, 5000, "同源口径（peer-instances 常量）")
    _setExecutorProbeTtlForTest(PEER_PROBE_TTL_MS) // 显式取缺省值——缝生效路径
    const calls = counted()
    const { proj, id } = fixture()
    goInflight(proj, id, "8001-ttl")
    const s1 = buildScan({ cwd: proj })
    await resolveExecutorStates([s1], { now: 1000 })
    assert.equal(calls.alive, 1, "首探：1 次批量判活")
    const s2 = buildScan({ cwd: proj })
    await resolveExecutorStates([s2], { now: 1000 + PEER_PROBE_TTL_MS - 1 }) // TTL 界内
    assert.equal(calls.alive, 1, "TTL 界内 → 零 exec（缓存命中）")
    assert.equal(s2.executors[0].state, s1.executors[0].state, "缓存态逐条照挂（读面语义不变）")
    await resolveExecutorStates([buildScan({ cwd: proj })], { now: 1000 + PEER_PROBE_TTL_MS }) // 界值 = 重探
    assert.equal(calls.alive, 2, "TTL 越界 → 重探（恰 1 次）")
  }
  // ③ 写径零探测：写命令全程零 exec（判活只落显示面——§7.3.1 红线）
  {
    const calls = counted()
    const { proj, id } = fixture()
    goInflight(proj, id, "8002-write")
    ledgerUpdate({ cwd: proj, id, patch: { title: "写径更新" } })
    ledgerClose({ cwd: proj, id, status: "已废弃" })
    assert.equal(calls.alive + calls.cmdline, 0, "写径零探测")
  }
})
