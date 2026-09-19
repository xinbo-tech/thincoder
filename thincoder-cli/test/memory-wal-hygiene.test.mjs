/**
 * memory-wal-hygiene.test.mjs — §6.12 WAL 卫生（TUI 假死批 2026-09-18 ·
 * 批档 `docs/batches/2026-09-18-tui-freeze.md` §2.5 用例表 T-W1/T-W2）。
 *
 * 行为面：① 开库设 `journal_size_limit`（回读 = 设定值——防复胀上界）；
 * ② 开库**一次性** `wal_checkpoint(TRUNCATE)` 回收上回残留（WAL 文件回落）；
 * ③ 另一连接持读事务时开库**失败容忍**（busy ⇒ 跳过，不重试不报错）+ 库可用，
 * 耗时 ≤ `busy_timeout` + 容差（**最坏等待上界**——写实口径，非「不阻塞」；CS-3 边界）。
 *
 * 真库（tmp 目录落盘——WAL 是文件面行为，内存库无意义）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { createMemory, put } from "@thincoder/core/memory.mjs"
import { SQLITE_BUSY_TIMEOUT, WAL_SIZE_LIMIT_BYTES } from "@thincoder/core/memory/schema.mjs"

function tmpBase(t) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-wal-"))
  t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }))
  return dir
}

const walSize = (dbPath) => {
  try { return statSync(`${dbPath}-wal`).size } catch { return 0 }
}

/** 灌入足量写（WAL 增长——本批不在写侧 checkpoint，增长由开库一次性回收）。 */
async function seed(mem, n = 400) {
  for (let i = 0; i < n; i++) await put(mem, { type: "rule", title: `t${i}`, content: "x".repeat(2000) })
  return n
}

test("T-W1 正常：journal_size_limit 读数 = 设定值 ∧ 开库 checkpoint(TRUNCATE) ⇒ WAL 回落", async (t) => {
  const dbPath = join(tmpBase(t), "memory.db")
  const mem = createMemory({ dbPath })
  assert.equal(
    mem.db.prepare(`PRAGMA journal_size_limit`).get().journal_size_limit,
    WAL_SIZE_LIMIT_BYTES,
    "回收后 WAL 截断上界已设（防复胀）",
  )
  const n = await seed(mem)
  const grown = walSize(dbPath)
  assert.ok(grown > 0, `WAL 随写增长（实 ${grown} B）`)
  mem.db.close()

  // 重开 ⇒ 开库一次性 TRUNCATE ⇒ 上回残留回收
  const mem2 = createMemory({ dbPath })
  const after = walSize(dbPath)
  assert.ok(after < grown, `WAL 回落（${grown} → ${after}）`)
  assert.ok(after <= 32 * 1024, `TRUNCATE 后 WAL 仅余头部（实 ${after} B）`)
  assert.equal(mem2.db.prepare(`SELECT COUNT(*) AS n FROM entries`).get().n, n, "库可用且数据在（checkpoint 只回收 WAL）")
  mem2.db.close()
})

test("T-W2 边界：另一连接持读事务 ⇒ 不抛、不重试 ∧ 库可用；耗时 ≤ busy_timeout + 容差", async (t) => {
  const dbPath = join(tmpBase(t), "memory.db")
  const seedMem = createMemory({ dbPath })
  const n = await seed(seedMem, 200)
  seedMem.db.close()

  const holder = new DatabaseSync(dbPath)
  holder.exec(`PRAGMA busy_timeout = 2000`)
  holder.exec("BEGIN")
  holder.prepare(`SELECT COUNT(*) AS n FROM entries`).get() // 持读事务（WAL 读快照 —— checkpoint TRUNCATE 会 busy）

  let mem2 = null
  const started = Date.now()
  try {
    mem2 = createMemory({ dbPath }) // 内部 TRUNCATE checkpoint 在此 busy（失败容忍 ⇒ 静默跳过）
    const elapsed = Date.now() - started
    assert.ok(
      elapsed <= SQLITE_BUSY_TIMEOUT + 2000,
      `开库耗时 ${elapsed}ms ≤ busy_timeout ${SQLITE_BUSY_TIMEOUT}ms + 容差 2000ms（最坏等待上界）`,
    )
    assert.equal(mem2.db.prepare(`SELECT COUNT(*) AS n FROM entries`).get().n, n, "开库成功且库可用（读得到既有行）")
  } finally {
    try { holder.exec("COMMIT") } catch { /* 已结算 */ }
    try { holder.close() } catch { /* 已关 */ }
    try { mem2?.db.close() } catch { /* 已关 */ }
  }
})
