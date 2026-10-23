/**
 * ledger-db.mjs — 台账 SQLite 连接 / DDL / 枚举常量（M2 模块拆分件——设计档
 * docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md §2.3 拆分计划）。
 *
 * items 单表 + 三 CHECK 枚举（kind / status / trigger）+ task_book 咬合 CHECK——枚举机械锁死
 * 靠 DDL（AC-M2-2），不靠应用层 if。归档 = 软删除（状态值，无物理 DELETE——KD-M2-4）。
 * 本档静态 import node:sqlite ⇒ 消费侧一律动态 import 本模块链（W8 契约②——KD-M2-3）。
 *
 * 项目根推导单源（`resolveLedgerRoot`）+ 同级枚举（`ledgerChildren`）居本档——键 / 库位 / 根同源
 * （设计档 `LEDGER.md` §2.1「根解析面」/ §3.8）：读写同一判据（档在盘 ∨ 以目录自身路径为键的库在盘）。
 *
 * 落点（2026-09-17 用户裁定收正）：台账库**不在项目目录**——住用户数据目录
 * `~/.thincoder/ledger/<sha1(normalizeCwd(项目根绝对路径))[:16]>.db`（工作树外、天然不进 git；
 * 同区先例 = configDir 的 memory.db / tool-results）。项目根仅作**关联键**，不在项目内留任何文件。
 * 键归一（2026-09-25 批 ledger-key-normalize · 台账 #286）：盘符大写契约直引 `session-slots.mjs`
 * `normalizeCwd`——与 session / checkpoint / traces / peers 同契约，跨端同 cwd 同键同库。
 */
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, opendirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"

import { configDir } from "./config-io.mjs"
import { MANIFEST_REL, projectRootView } from "./manifest.mjs"
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

/** 键控库文件路径（根 → 库位）——**内部形**：根推导内部判「库在盘」时用它，**不得经 `ledgerDbPath`**
 *  （互指即环，设计档 §3.8「无自指」）。库目录 = `ledgerDir`（`_setLedgerDirForTest` 覆盖 ⇒ 夹具根外零写）。 */
const keyedDbFile = (root) => join(ledgerDir, `${ledgerKey(root)}.db`)

/** 「已注册」判据（设计档 §2.1——**唯一**事实，两臂取一即成立）：
 *  档臂 = 该目录带项目声明档 `PROJECT-MANIFEST.json`（档在盘）；
 *  库臂 = 以该目录自身路径为键的键控库在盘 ∧ 该目录**非工作区态**（键控库存在 ≠ 可作项目）；
 *  工作区判据只在库在盘时才查（`projectRootView` 含 fs 扫描——档臂已中即短路）。 */
function isRegistered(dir) {
  if (existsSync(join(dir, MANIFEST_REL))) return true
  if (!existsSync(keyedDbFile(dir))) return false
  return projectRootView(dir).state !== "workspace"
}

/** 同级枚举上限（成本有界：父目录超此规模 = 缓存 / 临时等非仓族形态 → 退化空集）。
 *  2026-10-16 批 ledger-root-derivation 自 `ledger.mjs` 随迁（根推导收敛序 ∥ 族发现同级枚举同源）。 */
export const MAX_SIBLING_SCAN = 100

/** 目录下**已注册**（档 ∨ 库——§2.1 单谓词）的直接子目录（目录名升序；不可读 ∥ 超限 ⇒ 空集；
 *  **惰性枚举 + 上限**——大目录零全量扫描）。消费面 = 根推导收敛序 ∥ 族发现 ∥ 轻通道闸候选枚举。
 *  `ledger` = 该子目录根的键控库路径（谓词含档臂 ⇒ 可能尚未在盘）。2026-10-16 批自 `ledger.mjs` 随迁。 */
export function ledgerChildren(dir) {
  const out = []
  let handle
  try { handle = opendirSync(dir) } catch { return out }
  try {
    let n = 0
    for (;;) {
      const ent = handle.readSync()
      if (!ent) break
      if (++n > MAX_SIBLING_SCAN) return []
      if (!ent.isDirectory()) continue
      const root = join(dir, ent.name)
      if (!isRegistered(root)) continue
      out.push({ root, ledger: keyedDbFile(root) })
    }
  } catch { /* 读中断 → 已得子集（尽力而为） */ }
  finally { try { handle.closeSync() } catch { /* 已关 */ } }
  return out.sort((a, b) => (a.root < b.root ? -1 : a.root > b.root ? 1 : 0))
}

/** 项目根推导**单源**（设计档 §2.1「根解析面」/ §3.8——读写同一判据、同一实现）：
 *  自 `target` 沿**祖先链**上溯取最近「已注册」目录——**以会话锚（`process.cwd()`）为界，越界即停**：
 *  界内上溯 = 子目录归到自己的项目根（应该）；越过锚 = 挂到无关外层项目上（禁止）。
 *  命中 ⇒ `{ root, basis: 'self' | 'ancestor' }`（自身 vs 界内祖先）；
 *  界内无命中 ∧ `descend: true` ⇒ **向下收敛**锚的直接子目录（`ledgerChildren` 同款惰性枚举 +
 *  上限、名序升序）：恰一 ⇒ 取之；≥2 ⇒ ① 先取**有键控库**者（账已在盘 = 事实）② 该集名序首者 ⇒
 *  `{ root, basis: 'descendant' }`（向下发现——**须报明**）；零已注册子目录 ⇒ `null`（无根）。
 *  `descend: false` ⇒ 只问界内上溯支（族发现 ∥ 标记面——容器 ∥ 工作区锚 ⇒ `null` ⇒ 族求和）。
 *  **无自指**：内部「库在盘」判据只用 `ledgerKey` + `keyedDbFile`（不经 `ledgerDbPath`）。
 *  @param {string} [target] 动作目标路径（目录）
 *  @param {{descend?: boolean}} [opts] `descend` 缺省 `true`（动作面——`openLedger` / `ledgerDbPath` / 单范围读）
 *  @returns {{root: string, basis: 'self'|'ancestor'|'descendant'}|null} 项目根 + 判据来源 / 无根（`null`） */
export function resolveLedgerRoot(target, { descend = true } = {}) {
  const start = resolve(target ?? ".")
  let dir = start
  for (;;) {
    if (isRegistered(dir)) return { root: dir, basis: dir === start ? "self" : "ancestor" }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  if (!descend) return null
  const children = ledgerChildren(start)
  if (children.length === 0) return null
  if (children.length === 1) return { root: children[0].root, basis: "descendant" }
  const withDb = children.filter((c) => existsSync(c.ledger))
  return { root: (withDb.length > 0 ? withDb : children)[0].root, basis: "descendant" }
}

/** 无根文案（单源——设计档 §3.8「无根契约」逐字；`openLedger` 写面 ∥ `ledgerDbPath` 共用同一句）。 */
const noRootMessage = (start) =>
  `台账：自 ${start} 未能推导项目根——该目录与本级子目录均无已注册项目（带 PROJECT-MANIFEST.json 或已有键控台账库）`

/** 项目根 → 库路径（稳定键 = `ledgerKey` 前 16 位——路径唯一标识，不含分隔符）。
 *  **归单源**（2026-10-16 批 ledger-root-derivation）：根 = `resolveLedgerRoot(cwd)`——与读面 / 写面
 *  同一推导；无根 ⇒ 抛**同一**无根文案（键需根，不产第二答案）。
 *  v2 键归一（2026-09-25 批）：盘符本大写（CLI）⇒ 键恒等零变；小写盘符（VSC `uri.fsPath`）
 *  并入同键 ⇒ 同项目两端同库（收正前 = 同项目两键两库）。 */
export function ledgerDbPath(cwd) {
  const start = resolve(cwd ?? ".")
  const derived = resolveLedgerRoot(start)
  if (!derived) throw new Error(noRootMessage(start))
  return keyedDbFile(derived.root)
}

/** 未决四态（「活条目」口径 = 计数单源 WHERE 集；已核销 / 已废弃 = 归档态）。 */
export const PENDING_STATUSES = ["待讨论", "待设计", "在途", "待核销"]

/** 老化阈值（天——口径 = 需求档；消费面 = `buildScan`（展示，`days` 可覆盖）+ `ledgerQuery` 逐行
 *  `aged`（查询面，`now` 可注入））。2026-10-07 批 ledger-tool：自 `ledger.mjs` 迁入（枚举常量档单源
 *  ——`ledgerQuery` 计算面直引本档，消 `ledger-cmd ↔ ledger.mjs` 新环；`ledger.mjs` 同名 re-export
 *  保公共面零变——LEDGER.md §13.4）。 */
export const AGING_DAYS = 30

/** `evidence` 软上限（字——设计档 `LEDGER.md` §5 P4 读数面单源）：超限**只出读数，不拒写**
 *  （软上限非闸门——用户裁定「无限机检反感」；读数面 = `query` 逐行 `evidenceOversize` ∥
 *  `count` 回报）。 */
export const EVIDENCE_SOFT_LIMIT = 300

/** 台账库结构版本（N2 标记**单源**——`PRAGMA user_version` 落标：写面开库 `v < 本值 ⇒ 置`；
 *  读面如实回读（旧库未标 = 0）；结构变更（新列 / 新表）同步升号——2026-10-03 read-data-interface 批。
 *  2 = `resume_when` 可空列（设计档 §3.4 P5）。 */
export const LEDGER_SCHEMA_VERSION = 2

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
  resume_when TEXT,
  CHECK (status NOT IN ('在途','待核销') OR (task_book IS NOT NULL AND task_book <> ''))
)`

/** 老库幂等迁移共件：items 表缺该可空列 ⇒ ALTER 补列（`executor` ∥ `resume_when` 两列共用一份
 *  「复判列在否」逻辑——设计档 §3.4）。判据 = PRAGMA table_info 实查（不猜版本号）；ALTER
 *  duplicate column 竞争 → 复核列在吞 / 不在抛真错。列存在性谓词抽成单元（param exists），
 *  便于并发竞争拍直测。K-LX5：老库零删改、零重建。 */
export function ensureColumn(db, name, { exists } = {}) {
  const columnExists = exists
    ?? (() => db.prepare("SELECT 1 FROM pragma_table_info('items') WHERE name = ?").get(name) !== undefined)
  if (columnExists()) return false
  try {
    db.exec(`ALTER TABLE items ADD COLUMN ${name} TEXT`)
    return true
  } catch (e) {
    if (columnExists()) return false // 并发竞争——另一连接已加列：吞
    throw new Error(`台账库 ${name} 列迁移失败：${e.message}`)
  }
}

/** `executor` 列补列（F-LX1——共件别名，公共面形零改）。 */
export const ensureExecutorColumn = (db, opts) => ensureColumn(db, "executor", opts)

/** 只读态开库（read-data-interface 批 FR2③——readOnly 句柄 + **零 DDL / 零 ALTER**；先例 = 本包
 *  `ledger-migrate.mjs` 的 `openRead`）：文件必已在盘；items 表缺失探针 ⇒ 视同空账返回 null
 *  （非台账库的 SQLite 档 / 空档——观测面保持「空集」，文件零触）。不可开（坏档 / 非 SQLite）⇒
 *  抛（调用方按面处置：单范围 = 读错；族范围 = 不可读跳过）。 */
function openReadOnly(file) {
  let db
  try {
    db = new DatabaseSync(file, { readOnly: true })
    if (db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'items'").get() === undefined) {
      db.close()
      return null // 无 items 表 ⇒ 非台账库 ⇒ 空账（探针零写）
    }
    return db
  } catch (e) {
    try { db?.close() } catch { /* 已关 / 未开 */ }
    throw new Error(`台账库打开失败：${file}（${e.message}）`)
  }
}

/** 写面落标（N2）：`user_version` < 常量 ⇒ 置；≥ 常量不动（未来版本零回退）。只在写面开库调用。 */
function markSchemaVersion(db) {
  const v = Number(db.prepare("PRAGMA user_version").get().user_version ?? 0)
  if (v < LEDGER_SCHEMA_VERSION) db.exec(`PRAGMA user_version = ${LEDGER_SCHEMA_VERSION}`)
}

/** 开库（cwd = 「动作目标路径」）→ DatabaseSync 句柄 + 幂等建表 + 老库幂等迁移（executor 列）。
 *  **根推导**（设计档 §2.1 / §3.8）：项目根 = `resolveLedgerRoot(cwd)`——读写同一判据；嵌套取近者、
 *  容器锚向下收敛。**无根（`null`）**：写面（`create:true`）抛（fail-loud、零落盘零建库）；读面空账
 *  （`null`——与「库不在 = 空账」同形）。
 *  读面（create=false）：库文件不存在 → 返回 null（读面不建库、无副作用）。
 *  写面（create=true）：库文件不存在自动建（台账目录随之创建）。
 *  **只读态**（readOnly=true——读面专用）：只读句柄 + 零 DDL / ALTER + items 探针（见 openReadOnly）；
 *  如实副作用：旧库（缺 executor 列）**读**不再自动补列——补列归写面开库；读出行缺列按 null 归一。
 *  「目录不存在」的真错照抛（fail-loud——先于推导，文案逐字零改）。 */
export function openLedger(cwd, { create = false, readOnly = false } = {}) {
  const start = resolve(cwd ?? ".")
  if (!existsSync(start)) {
    throw new Error(`项目目录不存在：${start}——cwd 请给存在的项目根（相对路径按当前工作目录解析；缺省 = 会话项目根）`)
  }
  const derived = resolveLedgerRoot(start)
  if (!derived) {
    if (create) throw new Error(noRootMessage(start)) // 写面抛——零落盘零建库
    return null // 读面空账（未注册目录下旧行为亦为空 ⇒ 零回归）
  }
  const file = keyedDbFile(derived.root)
  if (!existsSync(file) && !create) return null
  if (readOnly) return openReadOnly(file)
  try { mkdirSync(ledgerDir, { recursive: true }) } catch { /* 已存在 / 并发建目录竞争——忽略 */ }
  const db = new DatabaseSync(file)
  try {
    db.exec(DDL)
    ensureColumn(db, "executor")
    ensureColumn(db, "resume_when")
    markSchemaVersion(db)
  } catch (e) {
    db.close()
    throw new Error(`台账库打开失败：${file}（${e.message}）`)
  }
  return db
}

/** 时间戳统一口径（ISO 字符串——行龄源 = 时间戳差值，KD-M2-6）。 */
export const nowIso = () => new Date().toISOString()
