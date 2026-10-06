/**
 * db.mjs — 库 ∥ PRAGMA ∥ DDL ∥ 迁移链（store/STORE.md §1–§3；accounts 与 metering 共用）。
 *
 * 单库单连接（`DatabaseSync`）；结构版本 = `PRAGMA user_version`；
 * 迁移链 = `MIGRATIONS` 逐段升（每段单事务；抛错 ⇒ 整段回滚 + 进程非零退出——fail-closed）。
 * 库文件缺省 = `data/gateway.db`（运行期生成，不入 git）。
 */
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { DatabaseSync } from "node:sqlite"

/** v1 全量 DDL（四表 + 三索引——store/STORE.md §2 逐字）。 */
const DDL_V1 = `
CREATE TABLE IF NOT EXISTS members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,             -- 登录名（账号标识）
  name          TEXT NOT NULL UNIQUE,             -- 展示名（创建缺省 = username）
  password_hash TEXT NOT NULL,                    -- scrypt 编码串（KD-SV-13）
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  quota_tokens  INTEGER,                          -- NULL = 不限；否则月度 token 额度
  created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api_keys (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id  INTEGER NOT NULL REFERENCES members(id),
  key_hash   TEXT NOT NULL UNIQUE,                -- sha256(明文) hex
  key_hint   TEXT NOT NULL,                       -- sk-tc-ab12cd…wxyz
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS usage (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  ts                INTEGER NOT NULL,             -- unix ms（请求开始）
  member_id         INTEGER NOT NULL REFERENCES members(id),
  key_id            INTEGER NOT NULL REFERENCES api_keys(id),
  endpoint          TEXT NOT NULL CHECK (endpoint IN ('chat','embeddings')),
  model             TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('ok','error','aborted')),
  stream            INTEGER NOT NULL,             -- 0/1
  prompt_tokens     INTEGER,                      -- NULL = 上游未回 usage
  completion_tokens INTEGER,
  total_tokens      INTEGER,
  duration_ms       INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,                -- sha256(会话令牌) hex
  member_id  INTEGER NOT NULL REFERENCES members(id),
  created_at INTEGER NOT NULL,                    -- unix ms
  expires_at INTEGER NOT NULL                     -- unix ms（绝对过期）
);
CREATE INDEX IF NOT EXISTS idx_usage_ts ON usage(ts);
CREATE INDEX IF NOT EXISTS idx_usage_member_ts ON usage(member_id, ts);
CREATE INDEX IF NOT EXISTS idx_sessions_member ON sessions(member_id);
`

/** v2 增段（`providers` 表——store/STORE.md §2 v2 段逐字；控制台 provider 管理——gateway/API.md §2.2）。 */
const DDL_V2 = `
CREATE TABLE IF NOT EXISTS providers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,             -- 对外标识前缀（无 \`/\`；重名拒）
  base_url    TEXT NOT NULL,                    -- OpenAI 兼容根
  api_key     TEXT NOT NULL DEFAULT '',         -- 明文 ∥ \`env:NAME\` 引用（空 = 不发 Authorization；解析 = 注册表构建期）
  models_json TEXT NOT NULL DEFAULT '[]',       -- 开放清单（JSON 数组——上游模型名；对外 = provider/model）
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
`

/** v3 增段（`audit_events` 事件表 + 三索引——store/STORE.md §2 v3 段逐字；accounts ∥ metering 域）。 */
const DDL_V3 = `
CREATE TABLE IF NOT EXISTS audit_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,              -- unix ms（事件时刻）
  type        TEXT NOT NULL CHECK (type IN ('login_success','login_failure','login_locked',
    'key_rotate','key_issue','key_revoke','password_change','password_reset','member_create')),
  actor_id    INTEGER,                       -- 行为人成员 id（无会话 ∥ 未知用户名 ⇒ NULL；无 FK——历史记录自足）
  actor_name  TEXT NOT NULL,                 -- 行为人名快照（用户名 ∥ 展示名 ∥ 'cli'）
  target_id   INTEGER,                       -- 对象成员 id（无对象 ⇒ NULL）
  target_name TEXT NOT NULL DEFAULT '',      -- 对象名快照（无对象 ⇒ 空串）
  detail      TEXT NOT NULL DEFAULT '{}'     -- 附加形（JSON：ip ∥ dimension ∥ keyHint ∥ role 等）
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
CREATE INDEX IF NOT EXISTS idx_audit_type_ts ON audit_events(type, ts);
CREATE INDEX IF NOT EXISTS idx_usage_key_ts ON usage(key_id, ts);
`

/** v4 增段（`providers.settings_json`——store/STORE.md §2 v4 段逐字；gateway 域——模型设置映射）。
 *  列级 ALTER = 表不重建（存量行即刻得 `'{}'`——§3 迁移链 v4）。 */
const DDL_V4 = `
ALTER TABLE providers ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}';  -- 模型设置映射（JSON 对象——形见 store/STORE.md §2 v4 段）
`

/** 迁移链：每段 = `{ v, up(db) }`（v = 目标结构版本，自 1 起递增）；结构每变一次追一段（+1）。 */
export const MIGRATIONS = [
  { v: 1, up: (db) => db.exec(DDL_V1) },
  { v: 2, up: (db) => db.exec(DDL_V2) },
  { v: 3, up: (db) => db.exec(DDL_V3) },
  { v: 4, up: (db) => db.exec(DDL_V4) },
]

/** 当前结构版本（= 链尾段号——store/STORE.md §1）。 */
export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].v

/** 连接级 PRAGMA（store/STORE.md §1——每次开库必设）。 */
export function applyPragmas(db) {
  db.exec("PRAGMA journal_mode = WAL")     // 读并发 + 单写者
  db.exec("PRAGMA synchronous = NORMAL")   // 进程崩溃安全；掉电丢最后若干提交（计量档位——登记在册）
  db.exec("PRAGMA busy_timeout = 5000")
  db.exec("PRAGMA foreign_keys = ON")
}

/** 迁移：读 `user_version` ⇒ 顺序执行 `v > 当前` 的段（每段单事务 + 升号；抛错 ⇒ 回滚 + 抛）。 */
export function migrate(db, { migrations = MIGRATIONS } = {}) {
  let version = readVersion(db)
  for (const step of migrations) {
    if (step.v <= version) continue
    db.exec("BEGIN")
    try {
      step.up(db)
      db.exec(`PRAGMA user_version = ${Number(step.v)}`)
      db.exec("COMMIT")
      version = step.v
    } catch (e) {
      db.exec("ROLLBACK")
      throw new Error(`迁移失败（v${step.v}）：${e.message}`)
    }
  }
  return version
}

/** 结构版本读数（空库 ⇒ 0）。 */
export function readVersion(db) {
  return Number(db.prepare("PRAGMA user_version").get().user_version ?? 0)
}

/** 开库：建父目录 → 连接 → PRAGMA → 迁移链；任何一步失败 ⇒ 关连接 + 抛（fail-closed）。 */
export function openDatabase(file, { migrations = MIGRATIONS } = {}) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  try {
    applyPragmas(db)
    migrate(db, { migrations })
  } catch (e) {
    db.close()
    throw new Error(`库打开失败：${file}（${e.message}）`)
  }
  return db
}
