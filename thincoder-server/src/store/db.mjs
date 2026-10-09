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
  models_json TEXT NOT NULL DEFAULT '[]',       -- 开放清单（JSON 数组——条目两形：字符串 = 上游模型名（无别名）∥ 对象 { name, alias }（配别名）；对外标识 = alias ∥ provider/model——2026-10-09 alias 批）
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

/** v5 增段（模型标识两字段拆列 + 派生两表 + 成员配额列——store/STORE.md §2 v5 段逐字；metering ∥ accounts 域）。
 *  ① usage 拆列（判据 = `endpoint = 'chat'` + 首斜杠；嵌入行 `provider = ''`）；② 预聚合日表 `usage_daily`；
 *  ③ 配额计数表 `quota_counters`；④ 成员分模型覆盖列增 + 旧总量列删；⑤ 期初回填（usage = 真源）。 */
const DDL_V5 = `
-- ① usage 两字段拆列（KD-SV-40）：内部真名两字段（对外显示 = 别名回映射——2026-10-09 alias 批）；\`model\` 可含斜杠；嵌入行 \`provider = ''\`（无前缀命名空间）
ALTER TABLE usage ADD COLUMN provider TEXT NOT NULL DEFAULT '';
UPDATE usage SET provider = substr(model, 1, instr(model, '/') - 1), model = substr(model, instr(model, '/') + 1)
  WHERE endpoint = 'chat' AND instr(model, '/') > 0;

-- ② 预聚合日表（汇表面读源——KD-SV-39；粒度 = 日 × 成员 × key × provider × model × endpoint）
CREATE TABLE IF NOT EXISTS usage_daily (
  day               TEXT NOT NULL,              -- 'YYYY-MM-DD'（服务器本地日界——与 trend strftime 同形）
  member_id         INTEGER NOT NULL,
  key_id            INTEGER NOT NULL,
  provider          TEXT NOT NULL,              -- '' = 无 provider 维（嵌入面）
  model             TEXT NOT NULL,
  endpoint          TEXT NOT NULL CHECK (endpoint IN ('chat','embeddings')),
  requests          INTEGER NOT NULL DEFAULT 0, -- 请求数（含 error ∥ aborted）
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0, -- NULL 计 0（口径同 SUM 聚合）
  duration_ms       INTEGER NOT NULL DEFAULT 0,
  errors            INTEGER NOT NULL DEFAULT 0, -- status = 'error' 计数
  PRIMARY KEY (day, member_id, key_id, provider, model, endpoint)
);

-- ③ 配额计数表（检查面点查源——KD-SV-38；粒度 = 成员 × provider × 模型 × 自然月）
CREATE TABLE IF NOT EXISTS quota_counters (
  member_id INTEGER NOT NULL,
  provider  TEXT NOT NULL,               -- 检查只读 chat 键（provider 非空）∥ 嵌入行照计不读
  model     TEXT NOT NULL,
  month     TEXT NOT NULL,               -- 'YYYY-MM'（服务器本地时区）
  tokens    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (member_id, provider, model, month)
);

-- ④ 成员分模型覆盖列 + 旧总量列退役（被 ①② 取代）
ALTER TABLE members ADD COLUMN model_quotas_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE members DROP COLUMN quota_tokens;

-- ⑤ 期初回填（一次性聚合——usage = 真源；两表与真源逐值可重算）
INSERT INTO usage_daily (day, member_id, key_id, provider, model, endpoint, requests, prompt_tokens, completion_tokens, total_tokens, duration_ms, errors)
SELECT strftime('%Y-%m-%d', ts / 1000, 'unixepoch', 'localtime') AS day, member_id, key_id, provider, model, endpoint,
       COUNT(*), COALESCE(SUM(prompt_tokens), 0), COALESCE(SUM(completion_tokens), 0), COALESCE(SUM(total_tokens), 0),
       COALESCE(SUM(duration_ms), 0), COALESCE(SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END), 0)
FROM usage GROUP BY day, member_id, key_id, provider, model, endpoint;
INSERT INTO quota_counters (member_id, provider, model, month, tokens)
SELECT member_id, provider, model, strftime('%Y-%m', ts / 1000, 'unixepoch', 'localtime') AS month, COALESCE(SUM(total_tokens), 0)
FROM usage GROUP BY member_id, provider, model, month;
`

/** v6 增段（`members.model_disabled_json`——store/STORE.md §2 v6 段逐字；accounts 域——成员模型禁用集）。
 *  列级 ALTER = 表不重建（存量行即刻得 `'{}'`——**默认全可用**；§3 迁移链 v6）。 */
const DDL_V6 = `
ALTER TABLE members ADD COLUMN model_disabled_json TEXT NOT NULL DEFAULT '{}';  -- 成员 × 模型禁用集（JSON 对象——键 = 对外标识；值 = true）
`

/** v7 增段（`providers.model_meta_json`——store/STORE.md §2 v7 段逐字；gateway 域——上游模型元数据留存图）。
 *  列级 ALTER = 表不重建（存量行即刻得 `'{}'`——未存 = 无元数据；§3 迁移链 v7）。 */
const DDL_V7 = `
ALTER TABLE providers ADD COLUMN model_meta_json TEXT NOT NULL DEFAULT '{}';  -- 上游模型元数据留存图（JSON 对象——形见下）
`

/** v8 增段（`api_keys.name`——store/STORE.md §2 v8 段逐字；accounts 域——key 名称列）。
 *  列级 ALTER = 表不重建（存量行即刻得 `''` ⇒ 随段回填默认名 `key-N`——按成员签发序；§3 迁移链 v8）。 */
const DDL_V8 = `
ALTER TABLE api_keys ADD COLUMN name TEXT NOT NULL DEFAULT '';  -- key 名称（空串 = 迁移前存量行——随段回填默认名）
UPDATE api_keys SET name = 'key-' || (SELECT COUNT(*) FROM api_keys k2 WHERE k2.member_id = api_keys.member_id AND k2.id <= api_keys.id);  -- 存量行回填默认名（key-N——按成员签发序）
`

/** v9 增段（`providers.proxy`——store/STORE.md §2 v9 段逐字；gateway 域——上游代理旗）。
 *  列级 ALTER = 表不重建（存量行即刻得 0——缺省直连；§3 迁移链 v9）。 */
const DDL_V9 = `
ALTER TABLE providers ADD COLUMN proxy INTEGER NOT NULL DEFAULT 0;  -- 上游代理旗（1 = 该渠上游请求经代理；0 = 直连——缺省）
`

/** v10 增段（`audit_events.type` CHECK 扩型——store/STORE.md §2 v10 段逐字；accounts 域——配置控制台批）。
 *  SQLite 不可改 CHECK ⇒ **表重建**（建新表 ∥ 拷贝 ∥ 换名 ∥ 索引重建）；净零新表/新列（§3 迁移链 v10）。 */
const DDL_V10 = `
-- 事件型 CHECK 扩十型（+ 'config_update'）——SQLite 不可改 CHECK ⇒ 表重建（建新表 ∥ 拷贝 ∥ 换名 ∥ 索引重建）
CREATE TABLE audit_events_v10 (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,              -- unix ms（事件时刻）
  type        TEXT NOT NULL CHECK (type IN ('login_success','login_failure','login_locked',
    'key_rotate','key_issue','key_revoke','password_change','password_reset','member_create','config_update')),
  actor_id    INTEGER,                       -- 行为人成员 id（无会话 ∥ 未知用户名 ⇒ NULL；无 FK——历史记录自足）
  actor_name  TEXT NOT NULL,                 -- 行为人名快照（用户名 ∥ 展示名 ∥ 'cli'）
  target_id   INTEGER,                       -- 对象成员 id（无对象 ⇒ NULL）
  target_name TEXT NOT NULL DEFAULT '',      -- 对象名快照（无对象 ⇒ 空串）
  detail      TEXT NOT NULL DEFAULT '{}'     -- 附加形（JSON：ip ∥ dimension ∥ keyHint ∥ role ∥ keys 等）
);
INSERT INTO audit_events_v10 (id, ts, type, actor_id, actor_name, target_id, target_name, detail)
  SELECT id, ts, type, actor_id, actor_name, target_id, target_name, detail FROM audit_events;
DROP TABLE audit_events;
ALTER TABLE audit_events_v10 RENAME TO audit_events;
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
CREATE INDEX IF NOT EXISTS idx_audit_type_ts ON audit_events(type, ts);
`

/** 迁移链：每段 = `{ v, up(db) }`（v = 目标结构版本，自 1 起递增）；结构每变一次追一段（+1）。 */
export const MIGRATIONS = [
  { v: 1, up: (db) => db.exec(DDL_V1) },
  { v: 2, up: (db) => db.exec(DDL_V2) },
  { v: 3, up: (db) => db.exec(DDL_V3) },
  { v: 4, up: (db) => db.exec(DDL_V4) },
  { v: 5, up: (db) => db.exec(DDL_V5) },
  { v: 6, up: (db) => db.exec(DDL_V6) },
  { v: 7, up: (db) => db.exec(DDL_V7) },
  { v: 8, up: (db) => db.exec(DDL_V8) },
  { v: 9, up: (db) => db.exec(DDL_V9) },
  { v: 10, up: (db) => db.exec(DDL_V10) },
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
