# Thincoder Server · 存储（store/STORE）

> 板块 = server ∥ 本档 = store 域（库 ∥ DDL ∥ 迁移链——accounts 与 metering 共用）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 结构面档（表语义 = 各域档）；数据面 AC = `metering/METERING.md` §4 ∥ `accounts/ACCOUNTS.md` §5（审计事件面）；结构升版判据 = §3 v3 段（空库直落 ∥ v2 旧库启动自动升——随批内件）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 库形态

- 单库单连接（`DatabaseSync`）；PRAGMA：WAL ∥ `synchronous=NORMAL` ∥ `busy_timeout=5000` ∥ `foreign_keys=ON`。
- 库文件默认 = `thincoder-server/data/gateway.db`（运行期生成，不入 git）。
- 结构版本 = `PRAGMA user_version`（当前 = 3——v2 增 `providers` ∥ v3 增 `audit_events` 与三索引；未发布期连续演进，无历史库迁移包袱——旧库启动自动升；迁移链机制自 v1 起备）。

## 2. DDL（v1 基线四表 + v2/v3 增段）

### v1 基线（四表——逐字）

```sql
PRAGMA journal_mode = WAL;      -- 读并发 + 单写者
PRAGMA synchronous = NORMAL;    -- 进程崩溃安全；掉电丢最后若干提交（内部计量档位——登记）
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;

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
```

### v2 增段（`providers`——gateway 域）

```sql
CREATE TABLE IF NOT EXISTS providers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,             -- 对外标识前缀（无 `/`；重名拒）
  base_url    TEXT NOT NULL,                    -- OpenAI 兼容根
  api_key     TEXT NOT NULL DEFAULT '',         -- 明文 ∥ `env:NAME` 引用（空 = 不发 Authorization；解析 = 注册表构建期）
  models_json TEXT NOT NULL DEFAULT '[]',       -- 开放清单（JSON 数组——上游模型名；对外 = provider/model）
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### v3 增段（`audit_events` 事件表 + 三索引——accounts 域 ∥ metering 域）

```sql
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
```

- `audit_events` 语义与写入点清单 = `accounts/ACCOUNTS.md` §2.1；快照名（`actor_name` ∥ `target_name`）= 成员改名/删除后记录仍可读（无 FK 约束成员生命周期）；保留窗 = 与 usage 同窗同清（`metering/METERING.md` §1 口径）。
- `idx_usage_key_ts` = key 级明细查询索引（「最后使用 ∥ 窗口内用量」——`metering/METERING.md` §3）。

- 表归属：`members` ∥ `api_keys` ∥ `sessions` ∥ `audit_events` = accounts 域（`accounts/ACCOUNTS.md`）；`usage` = metering 域（`metering/METERING.md`）；`providers` = gateway 域（provider 管理面——`gateway/API.md` §2.2）；结构单源 = 本档。

## 3. 迁移链（`user_version` 逐版升）

- `thincoder-server/src/store/db.mjs`（已落盘）持 `MIGRATIONS` 数组——每段 = `{ v, up(db) }`（v = 目标 `user_version`，自 1 起递增；v1 = 基线段 = §2 全量 DDL）。
- 开库序：读 `user_version` ⇒ 顺序执行 `v > 当前` 的段（每段单事务；成功 ⇒ `PRAGMA user_version = v`；抛错 ⇒ 进程非零退出——fail-closed）。
- 结构每变一次 = 追一段（+1）——空库 ∥ 旧库启动自动升，零手工脚本（断点列 = `EVOLUTION.md` §1-G2）。
- v2 = provider 增段（`providers` 表——控制台 provider 管理；旧库（v1）启动自动升 ∥ 空库直落 v2）。
- v3 = 审计增段（`audit_events` 表 + 三索引——`accounts/ACCOUNTS.md` §2.1 ∥ key 明细索引）；旧库（v1/v2）启动自动升 ∥ 空库直落 v3；判据（批内件）= 空库结构版本读数 3 ∥ v2 库升后读数 3 ∥ 迁移链幂等（再开零变）。
- first-release-completeness 批（2026-10-06）：**零结构变更**（保留窗清理 = 删除式 ∥ 登录防护计数 = 进程内存——均无新表；结构版本不变）。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/store/db.mjs`（已落盘） | **124 ⇒ ≈160**（实读 2026-10-06——设计估 ≈175；#962 +14 = v2 段（`providers` DDL + 迁移段）；本批 +≈36 = v3 段（`audit_events` DDL + 三索引）） | 开库 ∥ PRAGMA ∥ DDL ∥ 迁移链 ∥ 语句封装 |

## 5. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-3 | **存储 = `node:sqlite`（`DatabaseSync`）**——WAL ∥ `user_version` 结构版本 | 需求候选 + 仓内先例（核 `thincoder-core/ledger-db.mjs:18` 同技术）；零依赖 ∥ 单文件 ∥ SQL 聚合天然贴合看板/配额 | JSON 文件（并发/查询弱、无原子写）· 外部 DB（违零依赖 ∥ 运维重）· 内存（重启即失——违计量本意） |

## 6. 本域边界（不做的面）

- 归档/导出面不做（清理 = 保留窗删除式——`metering/METERING.md` §1；备份 = 部署侧面——`ops/OPS.md` §5.5）；多实例共享存储 = 触发项（`EVOLUTION.md` §2）；结构升级只走迁移链（不做手工脚本面）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——store 域：库 ∥ DDL（四表——members 扩列 + sessions） ∥ 迁移链；KD-SV-3。
- 2026-10-06：实施后回填轮（fix）——§4 行数按实读回填（≈175 ⇒ 110）。
- 2026-10-06：控制台 provider/模型管理设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ 台账 #962）——§1 结构版本 1 ⇒ 2 ∥ §2 增 v2 增段（`providers` 表——字段面/注释）+ 表归属补 gateway 行 ∥ §3 迁移链补 v2 段 ∥ §4 预算（db 110 ⇒ ≈135）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12 ∥ 台账 #963）——§3 补零结构变更句 ∥ §6 边界随正（清理 = 删除式保留窗；备份归部署侧面）。
- 2026-10-06：实施后回填轮（R14——批 `docs/batches/2026-10-06-console-providers.md`）：§4 行数按实读收正（db **124**）。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 结构版本 2 ⇒ 3 ∥ §2 增 v3 增段（`audit_events` + `idx_audit_ts`/`idx_audit_type_ts`/`idx_usage_key_ts`）∥ 表归属补 accounts 行 ∥ §3 迁移链补 v3 段 ∥ §4 预算（db 124 ⇒ ≈160）；同源随动 = `accounts/ACCOUNTS.md` §2.1 ∥ `metering/METERING.md` §3。
