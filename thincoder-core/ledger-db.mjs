/**
 * ledger-db.mjs — 台账 SQLite 连接 / DDL / 枚举常量（M2 模块拆分件——设计档
 * docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md §2.3 拆分计划）。
 *
 * items 单表 + 三 CHECK 枚举（kind / status / trigger）+ task_book 咬合 CHECK——枚举机械锁死
 * 靠 DDL（AC-M2-2），不靠应用层 if。归档 = 软删除（状态值，无物理 DELETE——KD-M2-4）。
 * 本档静态 import node:sqlite ⇒ 消费侧一律动态 import 本模块链（W8 契约②——KD-M2-3）。
 *
 * 落点（2026-09-17 用户裁定收正）：台账库**不在项目目录**——住用户数据目录
 * `~/.thincoder/ledger/<sha1(normalizeCwd(项目根绝对路径))[:16]>.db`（工作树外、天然不进 git；
 * 同区先例 = configDir 的 memory.db / tool-results）。项目根仅作**关联键**，不在项目内留任何文件。
 * 键归一（2026-09-25 批 ledger-key-normalize · 台账 #286）：盘符大写契约直引 `session-slots.mjs`
 * `normalizeCwd`——与 session / checkpoint / traces / peers 同契约，跨端同 cwd 同键同库。
 */
import { createHash } from "node:crypto"
import { existsSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"

import { configDir } from "./config-io.mjs"
import { resolveProjectRoot } from "./manifest.mjs"
// 归一步单源（KD-LN1——直引，不抽新 util：先例 = peer-domains.mjs / traces/trace-store.mjs）。
import { normalizeCwd } from "./session-slots.mjs"

/** 台账库目录（默认 = 用户数据目录；测试注入面 `_setLedgerDirForTest` 覆盖）。 */
let ledgerDir = join(configDir, "ledger")

/** 测试注入：覆盖台账库目录（同 `_setConfigPathForTest` 先例——测试不碰真实用户目录）。 */
export function _setLedgerDirForTest(dir) { ledgerDir = dir }
export function _resetLedgerDirForTest() { ledgerDir = join(configDir, "ledger") }

/** 台账库目录读数（设计档 §7.1 导出面）：键控库住它；迁移 / 审计面默认根 = 本值——备份 /
 *  回收目录取它的**兄弟位**（同派生于可覆盖基⇒ `_setLedgerDirForTest` 覆盖后三者同随）。 */
export function ledgerDirPath() { return ledgerDir }

/** 项目根 → 库键（**键式单源**——设计档 `LEDGER.md` §2.1：键只在**本函数**一处生成）：
 *  `sha1(normalizeCwd(root))[:16]`——`normalizeCwd`（盘符统一大写）是唯一补丁面：`resolve()`
 *  已覆盖分隔符 / 点段 / 尾斜杠；非盘符段大小写**不折叠**（§2.1 不做段）。
 *  @param {string} root 项目根绝对路径
 *  @returns {string} 16 位十六进制键 */
export function ledgerKey(root) {
  return createHash("sha1").update(normalizeCwd(root)).digest("hex").slice(0, 16)
}

/** 项目根 → 库路径（稳定键 = `ledgerKey` 前 16 位——路径唯一标识，不含分隔符）。
 *  项目根与 manifest 同一判据（归属 ∨ 发现——`resolveProjectRoot`；无 manifest ⇒ `resolve(cwd ?? ".")`
 *  兜底且**单值**）——与写门指针基准同一子表达式（键另加 `normalizeCwd` 一步，§2.1）。
 *  v2 键归一（2026-09-25 批）：盘符本大写（CLI）⇒ 键恒等零变；小写盘符（VSC `uri.fsPath`）
 *  并入同键 ⇒ 同项目两端同库（收正前 = 同项目两键两库）。 */
export function ledgerDbPath(cwd) {
  const root = resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
  return join(ledgerDir, `${ledgerKey(root)}.db`)
}

/** 未决四态（「活条目」口径 = 计数单源 WHERE 集；已核销 / 已废弃 = 归档态）。 */
export const PENDING_STATUSES = ["待讨论", "待设计", "在途", "待核销"]

/** 六态允许迁移表（ledgerUpdate 迁移前判，不在表内 → 拒——规格 ②.2；设计档 §2.1）。 */
export const ALLOWED_MIGRATIONS = {
  "待讨论": ["待设计", "已废弃"],
  "待设计": ["在途", "已废弃"],
  "在途": ["待核销", "已废弃"],
  "待核销": ["已核销", "已废弃"],
  "已核销": ["已废弃"],
  "已废弃": [],
}

/** 建表 DDL（幂等——设计档 §2.2 逐字；CHECK 字符串用单引号——KD7 实核）。 */
const DDL = `
CREATE TABLE IF NOT EXISTS items (
  id         INTEGER PRIMARY KEY,
  kind       TEXT NOT NULL CHECK(kind IN ('requirement','tech_todo')),
  status     TEXT NOT NULL CHECK(status IN ('待讨论','待设计','在途','待核销','已核销','已废弃')),
  title      TEXT NOT NULL,
  board      TEXT,
  req_doc    TEXT,
  task_book  TEXT,
  evidence   TEXT,
  trigger    TEXT CHECK(trigger IN ('归批','条件','认账不排期') OR trigger IS NULL),
  executor   TEXT,
  created_at TEXT,
  updated_at TEXT,
  closed_at  TEXT,
  CHECK (status NOT IN ('在途','待核销') OR (task_book IS NOT NULL AND task_book <> ''))
)`

/** 老库幂等迁移：items 表缺 executor 列（旧 DDL 建的库）→ ALTER 补列。
 *  判据 = PRAGMA table_info 实查（不猜版本号）；ALTER duplicate column 竞争 → 复核列在吞 / 不在抛真错。
 *  列存在性谓词抽成单元（param exists），便于并发竞争拍直测。K-LX5：老库零删改、零重建。 */
export function ensureExecutorColumn(db, { exists } = {}) {
  const columnExists = exists
    ?? (() => db.prepare("SELECT 1 FROM pragma_table_info('items') WHERE name = 'executor'").get() !== undefined)
  if (columnExists()) return false
  try {
    db.exec("ALTER TABLE items ADD COLUMN executor TEXT")
    return true
  } catch (e) {
    if (columnExists()) return false // 并发竞争——另一连接已加列：吞
    throw new Error(`台账库 executor 列迁移失败：${e.message}`)
  }
}

/** 开库（cwd = 项目根——仅作关联键）→ DatabaseSync 句柄 + 幂等建表 + 老库幂等迁移（executor 列）。
 *  读面（create=false）：库文件不存在 → 返回 null（空账——读面不建库、无副作用）。
 *  写面（create=true）：库文件不存在自动建（台账目录随之创建）；项目根目录不存在 → 抛友好错误。 */
export function openLedger(cwd, { create = false } = {}) {
  const dir = resolve(cwd ?? ".")
  const file = ledgerDbPath(dir)
  if (!existsSync(dir)) {
    throw new Error(`项目目录不存在：${dir}——cwd 请给存在的项目根（相对路径按当前工作目录解析；缺省 = 会话项目根）`)
  }
  if (!existsSync(file) && !create) return null
  try { mkdirSync(ledgerDir, { recursive: true }) } catch { /* 已存在 / 并发建目录竞争——忽略 */ }
  const db = new DatabaseSync(file)
  try {
    db.exec(DDL)
    ensureExecutorColumn(db)
  } catch (e) {
    db.close()
    throw new Error(`台账库打开失败：${file}（${e.message}）`)
  }
  return db
}

/** 时间戳统一口径（ISO 字符串——行龄源 = 时间戳差值，KD-M2-6）。 */
export const nowIso = () => new Date().toISOString()
