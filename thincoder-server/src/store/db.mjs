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

/** v11 增段（沙盒七表 + 审计 CHECK 再扩（十二型）+ 默认单种子——store/STORE.md §2 v11 段逐字；sandbox ∥ accounts 域）。
 *  ① 七表 CREATE（对象模型 = `sandbox/SANDBOX.md` §2 单源）；② 审计表重建（十型 ⇒ 十二型——步序与 v10 同构）；
 *  ③ 种子八行（`source='default'`——本段一次性写入、可改可删、不复活：deny 三 + allow 五）。 */
const DDL_V11 = `
-- ① 沙盒七表（对象模型 = sandbox/SANDBOX.md §2——单源；表结构全文 = store/STORE.md §2 v11 段）
CREATE TABLE IF NOT EXISTS sandbox_runners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                  -- runner 名（注册时给）
  token_hash TEXT NOT NULL UNIQUE,            -- sha256(runner 令牌) hex
  labels_json TEXT NOT NULL DEFAULT '{}',     -- 容量描述符（标签 + maxBoxes——放置判据；形 = src/sandbox/registry.mjs 档头）
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draining','drained','disabled')),
  runtime_json TEXT NOT NULL DEFAULT '{}',    -- 最近心跳上行块（版本 ∥ 自检读数 ∥ 磁盘余量 ∥ 盒清单——心跳更新）
  last_heartbeat_at INTEGER,                  -- unix ms（3 拍缺 ⇒ unhealthy——展示面派生）
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sandbox_workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  owner_member_id INTEGER NOT NULL REFERENCES members(id),
  key_id INTEGER NOT NULL REFERENCES api_keys(id),
  key_plain TEXT NOT NULL,                    -- 工作区 key 明文（盒重建再注入——披露 D2）
  runner_id INTEGER,                          -- 放置绑定（未放置 ⇒ NULL）
  required_labels_json TEXT NOT NULL DEFAULT '{}',
  limits_json TEXT NOT NULL DEFAULT '{}',     -- 每工作区覆写（资源 + TTL；键集/取值序 = sandbox/SANDBOX.md §2；空 = 随全局默认）
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sandbox_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('cidr','domain')),
  action TEXT NOT NULL CHECK (action IN ('allow','deny')),
  target TEXT NOT NULL,                       -- CIDR ∥ 域名（含单层左通配）
  port INTEGER,                               -- NULL = 不限
  protocol TEXT,                              -- 'tcp' ∥ 'udp' ∥ NULL（不限）
  priority INTEGER NOT NULL DEFAULT 0,        -- 同动作内排序
  note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('default','admin','approval')),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sandbox_pending (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  runner_id INTEGER NOT NULL,
  workspace_id INTEGER NOT NULL,
  host TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,            -- 三次批准建议判据
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved_once','approved_remember','denied','timeout')),
  resolved_at INTEGER
);
CREATE TABLE IF NOT EXISTS sandbox_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  runner_id INTEGER NOT NULL,
  kind TEXT NOT NULL,                         -- 'sandbox.*' 本批；'ci.*' 预留（可扩——KD-SV-72）
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','claimed','done','failed','unsupported')),
  created_at TEXT NOT NULL,
  claimed_at INTEGER,
  finished_at INTEGER,
  result_json TEXT
);
CREATE TABLE IF NOT EXISTS sandbox_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  size INTEGER NOT NULL,                      -- 字节
  blob_path TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sandbox_settings (
  k TEXT PRIMARY KEY,                         -- 全局默认——键全集与值形 = gateway/API.md §2.5（单源）；「默认单」非本表（= sandbox_rules 种子行）
  v TEXT NOT NULL                             -- JSON 文本（数字 ∥ 字符串统一 JSON 编码）
);

-- ② 审计 CHECK 再扩（十型 ⇒ 十二型——表重建，步序与 v10 同构）
-- + 'sandbox_rule'（规则增删——detail = { action, rule }）∥ + 'sandbox_event'（审批三态/超时 ∥ 盒起停拆 ∥ runner 注册/排空/删除 ∥ join 失败 ∥ 快照——detail = { kind, ... }）
CREATE TABLE audit_events_v11 (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,              -- unix ms（事件时刻）
  type        TEXT NOT NULL CHECK (type IN ('login_success','login_failure','login_locked',
    'key_rotate','key_issue','key_revoke','password_change','password_reset','member_create','config_update',
    'sandbox_rule','sandbox_event')),
  actor_id    INTEGER,                       -- 行为人成员 id（无会话 ∥ 未知用户名 ⇒ NULL；无 FK——历史记录自足）
  actor_name  TEXT NOT NULL,                 -- 行为人名快照（用户名 ∥ 展示名 ∥ 'cli' ∥ 'runner:<名>'）
  target_id   INTEGER,                       -- 对象成员 id（无对象 ⇒ NULL）
  target_name TEXT NOT NULL DEFAULT '',      -- 对象名快照（无对象 ⇒ 空串）
  detail      TEXT NOT NULL DEFAULT '{}'     -- 附加形（JSON：ip ∥ dimension ∥ keyHint ∥ role ∥ keys 等）
);
INSERT INTO audit_events_v11 (id, ts, type, actor_id, actor_name, target_id, target_name, detail)
  SELECT id, ts, type, actor_id, actor_name, target_id, target_name, detail FROM audit_events;
DROP TABLE audit_events;
ALTER TABLE audit_events_v11 RENAME TO audit_events;
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
CREATE INDEX IF NOT EXISTS idx_audit_type_ts ON audit_events(type, ts);

-- ③ 种子八行（初始化点 = 本段一次性写入；可改可删——不复活）：deny（cidr）三条 = RFC1918 ∥ allow（domain）五条 = 默认单
--   恒拒（127.0.0.0/8 ∥ 169.254.0.0/16）= 内置（非行——不入种子）；动态项（服务器网段 ∥ runner 自身网段）= 注册时自动带入
INSERT INTO sandbox_rules (kind, action, target, port, protocol, priority, note, source, created_at, created_by) VALUES
  ('cidr', 'deny', '10.0.0.0/8', NULL, NULL, 0, '默认禁单：RFC1918 私网', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed'),
  ('cidr', 'deny', '172.16.0.0/12', NULL, NULL, 0, '默认禁单：RFC1918 私网', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed'),
  ('cidr', 'deny', '192.168.0.0/16', NULL, NULL, 0, '默认禁单：RFC1918 私网', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed'),
  ('domain', 'allow', 'registry.npmjs.org', NULL, NULL, 0, '默认单：npm 依赖', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed'),
  ('domain', 'allow', 'github.com', NULL, NULL, 0, '默认单：代码仓', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed'),
  ('domain', 'allow', '*.githubusercontent.com', NULL, NULL, 0, '默认单：代码仓资源（单层左通配）', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed'),
  ('domain', 'allow', 'gitee.com', NULL, NULL, 0, '默认单：代码仓', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed'),
  ('domain', 'allow', '*.gitee.com', NULL, NULL, 0, '默认单：代码仓资源（单层左通配）', 'default', strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'seed');
`

/** v12 增段（`sandbox_runners` 表重建——旧通道形态 ⇒ Docker 节点形态——store/STORE.md §2 v12 段逐字；sandbox 域）。
 *  ① 建新表（列面 = v11 段所列：id/name/address/status/runtime_json/created_at）⇒ ② 存量行弃（旧通道行无地址可取、令牌/心跳语义整废——一次性过渡）
 *  ⇒ ③ DROP ⇒ ④ RENAME（沿 v10 表重建先例——SQLite 不可改列集/CHECK）。 */
const DDL_V12 = `
-- ① 建新表（Docker 节点形态——无 token_hash ∥ 无 labels_json ∥ 无 last_heartbeat_at）
CREATE TABLE sandbox_runners_v12 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                  -- 节点名（登记时给）
  address TEXT NOT NULL,                      -- Docker API 地址（登记时给）
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  runtime_json TEXT NOT NULL DEFAULT '{}',    -- 连通自检读数
  created_at TEXT NOT NULL
);
-- ② 存量行弃（不迁——见上注）⇒ ③ DROP ⇒ ④ RENAME
DROP TABLE sandbox_runners;
ALTER TABLE sandbox_runners_v12 RENAME TO sandbox_runners;
`

/** v13 增段（`sandbox_onboarding` 建表——托管接入任务 + 凭据——store/STORE.md §2 v13 段逐字；sandbox 域）。
 *  加表（零重建）：任务态/步骤读数/凭据密文共一行；加密密钥 = `data/credentials.key`（不落库——KD-SV-84）。 */
const DDL_V13 = `
CREATE TABLE IF NOT EXISTS sandbox_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host TEXT NOT NULL,                          -- 主机地址原文
  ssh_port INTEGER NOT NULL DEFAULT 22,
  ssh_user TEXT NOT NULL,
  auth_kind TEXT NOT NULL CHECK (auth_kind IN ('key','password')),
  secret_cipher TEXT,                          -- AES-256-GCM 包（iv|tag|ct —— base64 三段）；零化后 NULL
  sudo_cipher TEXT,                            -- 可选（同形）
  credential_mode TEXT NOT NULL CHECK (credential_mode IN ('burn','keep')),
  credential_state TEXT NOT NULL DEFAULT 'sealed' CHECK (credential_state IN ('sealed','burned','revoked')),
  name TEXT,                                   -- 节点名（可选；缺省取探测主机名）
  model TEXT NOT NULL,                         -- 提交时所选模型
  status TEXT NOT NULL CHECK (status IN ('running','succeeded','failed','interrupted')),
  step TEXT,                                   -- 当前/最后一步 id
  steps_json TEXT NOT NULL DEFAULT '[]',       -- 步骤日志（读数面）
  runner_id INTEGER,                           -- 成功后关联（未成 NULL）
  created_by INTEGER,                          -- admin 成员 id
  created_at TEXT NOT NULL,
  finished_at TEXT
);
`

/** v14 增段（agent chat 两表 + 审计 CHECK 再扩（十三型）——store/STORE.md §2 v14 段逐字；agent 域——admin-agent-chat 批）。
 *  ① `agent_chats`（会话：`model` ∥ `status` 在途标记）+ `agent_chat_messages`（消息序：`role` 四值 ∥ `content` ∥ `data_json`）+ `(chat_id, seq)` 索引；
 *  ② 审计表重建（十二型 ⇒ 十三型：+ `agent_event`——步序与 v10/v11 同构）。对象模型 = `agent/ADMIN-AGENT.md` §11/§12（单源）。 */
const DDL_V14 = `
-- ① 管理面 chat 两表（KD-SV-89——消息逐条增量落库；无 FK——沿 audit_events 口径）
CREATE TABLE IF NOT EXISTS agent_chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model TEXT NOT NULL,                        -- 建会话时选定（KD-SV-87 同口径）
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running')),  -- running = 一轮在途（重启 ⇒ idle——如实收尾）
  created_by INTEGER,                         -- 发起 admin 成员 id（无 FK——沿先例）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,                   -- 无 FK（历史/瞬态面自足——沿 audit_events 口径）
  seq INTEGER NOT NULL,                       -- 会话内序（1 起）
  role TEXT NOT NULL CHECK (role IN ('user','assistant','tool','notice')),
  content TEXT NOT NULL DEFAULT '',           -- 工具结果 = 模型可见形（截断 ≤4000 字——回放逐字一致）
  data_json TEXT,                             -- role 附加形：assistant 的 toolCalls ∥ tool 的 toolCallId/名/摘要 ∥ notice 的 reason（四值枚举——重启收尾 "restart" ∥ 预算超限 "budget" ∥ 模型错误 "model_error" ∥ 空回合 "empty_turn"）
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_chat_messages ON agent_chat_messages(chat_id, seq);

-- ② 审计 CHECK 再扩（十二型 ⇒ 十三型——表重建，步序与 v10/v11 同构）
-- + 'agent_event'（管理面 agent 会话——kind：chat_start（会话创建）∥ chat_call（每工具调用）∥ chat_stop（异常收尾：预算超限 ∥ 模型错误 ∥ 空回合 ∥ 重启中断）；
--   detail = { kind, chatId, tool?, call?, resultCode?, summary?, reason? }（notice 的 reason 四值枚举——重启收尾 "restart" ∥ 预算超限 "budget" ∥ 模型错误 "model_error" ∥ 空回合 "empty_turn"）；
--   摘要截断 + 秘密掩蔽口径沿任务面）
CREATE TABLE audit_events_v14 (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,              -- unix ms（事件时刻）
  type        TEXT NOT NULL CHECK (type IN ('login_success','login_failure','login_locked',
    'key_rotate','key_issue','key_revoke','password_change','password_reset','member_create','config_update',
    'sandbox_rule','sandbox_event','agent_event')),
  actor_id    INTEGER,                       -- 行为人成员 id（无会话 ∥ 未知用户名 ⇒ NULL；无 FK——历史记录自足）
  actor_name  TEXT NOT NULL,                 -- 行为人名快照（用户名 ∥ 展示名 ∥ 'cli'）
  target_id   INTEGER,                       -- 对象成员 id（无对象 ⇒ NULL）
  target_name TEXT NOT NULL DEFAULT '',      -- 对象名快照（无对象 ⇒ 空串）
  detail      TEXT NOT NULL DEFAULT '{}'     -- 附加形（JSON：ip ∥ dimension ∥ keyHint ∥ role ∥ kind ∥ chatId 等）
);
INSERT INTO audit_events_v14 (id, ts, type, actor_id, actor_name, target_id, target_name, detail)
  SELECT id, ts, type, actor_id, actor_name, target_id, target_name, detail FROM audit_events;
DROP TABLE audit_events;
ALTER TABLE audit_events_v14 RENAME TO audit_events;
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
  { v: 11, up: (db) => db.exec(DDL_V11) },
  { v: 12, up: (db) => db.exec(DDL_V12) },
  { v: 13, up: (db) => db.exec(DDL_V13) },
  { v: 14, up: (db) => db.exec(DDL_V14) },
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
