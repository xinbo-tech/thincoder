# Thincoder Server · 存储（store/STORE）

> 板块 = server ∥ 本档 = store 域（库 ∥ DDL ∥ 迁移链——accounts 与 metering 共用）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 结构面档（表语义 = 各域档）；数据面 AC = `metering/METERING.md` §4 ∥ `accounts/ACCOUNTS.md` §5（审计事件面）；结构升版判据 = §3 v3 段（空库直落 ∥ v2 旧库启动自动升——随批内件）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 库形态

- 单库单连接（`DatabaseSync`）；PRAGMA：WAL ∥ `synchronous=NORMAL` ∥ `busy_timeout=5000` ∥ `foreign_keys=ON`。
- 库文件默认 = `thincoder-server/data/gateway.db`（运行期生成，不入 git）。
- 结构版本 = `PRAGMA user_version`（当前 = **14**——v2 增 `providers` ∥ v3 增 `audit_events` 与三索引 ∥ v4 增 `providers.settings_json`（模型设置——服务模型配置面） ∥
  v5 增模型标识两字段拆列 + 派生两表 + 成员配额列 ∥ v6 增成员模型禁用列（详见 §2 v5/v6 段） ∥ v7 增 provider 模型元数据留存列 ∥ **v8 增 key 名称列（`api_keys.name`——me-keys 批）**（详见 §2 v7/v8/v9 段） ∥
  v9 增 provider 上游代理旗（`providers.proxy`——server 代理批） ∥ **v10 增审计型 `config_update`（`audit_events` 重建——CHECK 扩型；配置控制台批）**（详见 §2 v10 段） ∥ **v11 增沙盒七表 + 审计 CHECK 再扩（十二型——server-exec-sandbox 批）**（详见 §2 v11 段） ∥
  **v12 `sandbox_runners` 表重建（Docker 节点形态——runner-admin-console 批）**（详见 §2 v12 段） ∥ **v13 增 `sandbox_onboarding` 表（托管接入——runner-admin-console 批增补）**（详见 §2 v13 段） ∥
  **v14 增 agent chat 两表 + 审计 CHECK 再扩（十三型——admin-agent-chat 批）**（详见 §2 v14 段）；
  未发布期连续演进，无历史库迁移包袱——旧库启动自动升；迁移链机制自 v1 起备）。
- server-model-alias 批（2026-10-09——台账 #1153）：**零结构变更**（别名落 `models_json` 元素——JSON 文本内演进；无新列/新表/新段——结构版本保持 **10**）。

## 2. DDL（v1 基线四表 + v2–v14 增段）

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
  models_json TEXT NOT NULL DEFAULT '[]',       -- 开放清单（JSON 数组——条目两形：字符串 = 上游模型名（无别名）∥ 对象 { name, alias }（配别名）；对外标识 = alias ∥ provider/model——2026-10-09 alias 批）
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

- 条目两形与别名语义（2026-10-09 alias 批——KD-SV-59）：别名 = 元素内字段（`{ name, alias }`——alias 非空 ∥ 不含斜杠；字符串条目 = 无别名）；**零迁移**（列形不变——旧行字符串天然兼容；保存径归一 = 别名缺省/空回落字符串形）；校验/唯一性/派发 = `gateway/API.md` §2.2 ∥ §6 KD-SV-59；配置面（种子）= `ops/OPS.md` §1。

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

### v4 增段（`providers.settings_json`——gateway 域）

```sql
ALTER TABLE providers ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}';  -- 模型设置映射（JSON 对象——形见下）
```

- 形 = `{ "<上游模型名>": { rpm ∥ tpm（正整数 ∥ null） ∥ costIn ∥ costOut（≥0 数 ∥ null） ∥ note（≤200 字 ∥ null） ∥ quotaTokens（≥0 整数 ∥ null——每人每月默认用量；v5 批新增） } }`——`null`/缺省 = 未设；键 = 上游模型名（与 `models` 同空间；不在 `models` 的键合法——设置随名保留，停用不丢）。
- 写面 = PATCH `/api/admin/providers/:id` 的 `settings` 键级合并（`gateway/API.md` §2.2）；校验单源 = `thincoder-server/src/ops/config.mjs`（`validateProviderEntry`/`validateProviderEntries` 扩 settings——未知子字段 ∥ 非法值 ⇒ 400/拒启）；装配载入缺省 = `{}`（配置种子零 settings 字段——控制台单一面）。
- 消费 = 限流（`gateway/ratelimit.mjs`——KD-SV-35）读 `rpm`/`tpm`；`costIn`/`costOut`/`note` = 展示面（`webui/WEBUI.md` §2.4③）；`quotaTokens` = 配额平台层默认值（`metering/METERING.md` §2——三级之一，KD-SV-38）。

### v5 增段（模型标识两字段拆列 + 派生两表 + 成员配额列——metering ∥ accounts 域；配额分模型批）

```sql
-- ① usage 两字段拆列（KD-SV-40）：内部真名两字段（对外显示 = 别名回映射——2026-10-09 alias 批）；`model` 可含斜杠；嵌入行 `provider = ''`（无前缀命名空间）
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
```

- `provider` 约定（usage ∥ usage_daily ∥ quota_counters 三表同构）：chat 行 = provider 名（无 `/`）；嵌入行 = `''`（无 provider 维——回拼 = `model` 单段）；**对外标识 = 别名回映射**（配别名模型——读面单源 = `thincoder-server/src/gateway/providers.mjs` 别名索引；2026-10-09 alias 批——KD-SV-59）。
- 两派生表 = **可重算**（`usage reconcile`——`metering/METERING.md` §2）；**不设 FK**（派生面自足——沿 `audit_events` 无 FK 口径；成员删除本无路径）；唯一键即查形（日表 = `day` 前缀日窗扫描；计数表 = 四列点查 O(1)——`EXPLAIN` 预期 `SEARCH … USING INDEX sqlite_autoindex_… (…)`）。
- 保留/清理 = 与 usage **同窗同清**（`metering/METERING.md` §1——三表同事务删除）。

### v6 增段（`members.model_disabled_json`——accounts 域；配额 v2 · 成员模型面批）

```sql
ALTER TABLE members ADD COLUMN model_disabled_json TEXT NOT NULL DEFAULT '{}';  -- 成员 × 模型禁用集（JSON 对象——键 = 对外标识；值 = true）
```

- 形 = `{ "<对外标识（别名 ∥ provider/model）>": true }`——键 = 对外标识（与 `model_quotas_json` 同空间；键形校验同助手——非空 ∥ 无首尾空白 ∥ 含斜杠时两段非空（裸名 = 别名形合法——#1008 收正；2026-10-09 alias 批））；值仅 `true`（禁用）；删键 = 恢复可用；缺省 `{}` = **默认全可用**。
- 机制全文 = `accounts/ACCOUNTS.md` §2.2；消费面 = 鉴权行携带（`accounts/keys.mjs` `verifyKey`——沿 `model_quotas_json` 零查询口径） ⇒ 网关准入（`gateway/API.md` §2.1）+ `/v1/models` 随动滤除 + 成员弹窗勾选态（`webui/WEBUI.md` §2.4②）。
- 与 `model_quotas_json`（v5）并列：两列各管一轴——配额 = 用量限额 ∥ 禁用 = 可用性（优先级判据 = `accounts/ACCOUNTS.md` §2.2）。

### v7 增段（`providers.model_meta_json`——gateway 域；Provider 模型元数据批）

```sql
ALTER TABLE providers ADD COLUMN model_meta_json TEXT NOT NULL DEFAULT '{}';  -- 上游模型元数据留存图（JSON 对象——形见下）
```

- 形 = `{ "<上游模型名>": { displayName? ∥ contextWindow?（正整数） ∥ vision?（`true`） ∥ status?（退役状态原文） } }`——**≥1 字段才入键**（缺就空着——零兜底值、零占位）；只含开放清单（`models_json`）模型（写面求交）。
- 保留集与各上游来源映射 = `gateway/API.md` §2.2「模型元数据」条（逐字）；本列 = **纯展示数据**（转发 ∥ 派发 ∥ `/v1/models` 零涉）。
- 写面 = 保存路径（POST/PATCH）携 `modelMeta`（键在场 = 期望图——白名单过滤 + 形不符即略 + 求交；缺省 = 现存按求交滑动）；读面 = `rowToEntry` 解码（坏 JSON ⇒ 行数据损坏抛——沿 `models_json`/`settings_json` 口径）；消费 = 控制台 Provider 详情弹窗（`webui/WEBUI.md` §2.4④）。

### v8 增段（`api_keys.name`——accounts 域；me-keys 批）

```sql
ALTER TABLE api_keys ADD COLUMN name TEXT NOT NULL DEFAULT '';  -- key 名称（空串 = 迁移前存量行——随段回填默认名）
UPDATE api_keys SET name = 'key-' || (SELECT COUNT(*) FROM api_keys k2 WHERE k2.member_id = api_keys.member_id AND k2.id <= api_keys.id);  -- 存量行回填默认名（key-N——按成员签发序）
```

- 形 = 自由文本标签（≤40 字符——服务层 trim 后校验；空名 ⇒ 服务层生成默认名 `key-N` 落库）；**非标识**——寻址仍按 `id`/提示形（重名允许 ∥ 无唯一索引）。
- 语义与写面 = `accounts/ACCOUNTS.md` §1.1（命名规则 ∥ 上限 ∥ 自助签发/吊销）；读面 = `memberView` key 行（`name` 随行下发——仅未吊销）；消费 = 控制台「我的·key 与签发」表列（`webui/WEBUI.md` §2.3⑥）。
- 回填口径：N = 该成员按 `id` 升序的序号（含吊销行——单调不复用；后续签发 = 服务层按同口径续编）；**逐行结果稳定**（子查询只读 `member_id`/`id`——两列不被本 UPDATE 改写，扫描顺序无关）。

### v9 增段（`providers.proxy`——gateway 域；server 代理批）

```sql
ALTER TABLE providers ADD COLUMN proxy INTEGER NOT NULL DEFAULT 0;  -- 上游代理旗（1 = 该渠上游请求经代理；0 = 直连——缺省）
```

- 形 = 布尔旗（SQLite 无布尔——1/0；非布尔 ⇒ 写面 400 ∥ 配置面拒启）；读面解码 = `rowToEntry` 转 boolean（`proxy: row.proxy === 1`——沿 `settings`/`modelMeta` 解码位）。
- 语义与判定 = `gateway/API.md` §6 KD-SV-55（旗 1 ∧ 顶层 `proxy.uri` 在案 ⇒ 该渠上游请求经代理——chat ∥ 发现同判定）；配置面 = `ops/OPS.md` §1（顶层 `proxy` 段）；控制台面 = `webui/WEBUI.md` §2.4④。
- 圈界：纯路由旗——零计量 ∥ 零展示涉 ∥ 不参与 `/v1/models` 与元数据面。

### v10 增段（`audit_events.type` CHECK 扩型——accounts 域；配置控制台批）

```sql
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
```

- 形 = 十型（九型 + `config_update`——配置写入事件）；`detail.keys` = 变更键名清单（值永不入——密钥/uri 洁癖）；actor = admin 名快照（target = 无——空串）。
- 语义与写入点 = `accounts/ACCOUNTS.md` §2.1（写入面 = `src/gateway/config-admin.mjs`（已落盘 · 实读 **182** 行）——写盘成功后一条；失败 ⇒ warn，不反噬已落盘事实）；消费 = 审计页类型下拉/文案（`webui/WEBUI.md` §2.3④——型面现状 = 十三型，v14 段）。
- 圈界：重建净零新表/新列——判据 = 行拷贝逐值（含 id 连续）+ 两索引在场。

### v11 增段（沙盒七表 + 审计 CHECK 再扩——sandbox 域；server-exec-sandbox 批）

```sql
-- ① 沙盒七表（对象模型 = `sandbox/SANDBOX.md` §2——单源）
CREATE TABLE IF NOT EXISTS sandbox_runners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                  -- 节点名（登记时给）
  address TEXT NOT NULL,                      -- Docker API 地址（登记时给）
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  runtime_json TEXT NOT NULL DEFAULT '{}',    -- 连通自检读数
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sandbox_workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  owner_member_id INTEGER NOT NULL REFERENCES members(id),
  key_id INTEGER NOT NULL REFERENCES api_keys(id),
  key_plain TEXT NOT NULL,                    -- 工作区 key 明文（盒重建再注入——披露 D2）
  runner_id INTEGER,                          -- 绑定节点（未绑定 ⇒ NULL）
  limits_json TEXT NOT NULL DEFAULT '{}',     -- 每工作区覆写（资源 + TTL；键集/取值序 = `sandbox/SANDBOX.md` §2；空 = 随全局默认）
  created_at TEXT NOT NULL
);
-- 注：本表列面（去 `required_labels_json`）仍与实表有差——实现收正随执行面重做批（旁注 = v12 段）。
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
  kind TEXT NOT NULL,                         -- 'sandbox.*'；'ci.*' 预留（执行面与 CI 共用——KD-SV-72）
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','done','failed','unsupported')),
  created_at TEXT NOT NULL,
  finished_at INTEGER,
  result_json TEXT
);
-- 注：本表列面（去 `claimed_at`）仍与实表有差——实现收正随执行面重做批（旁注 = v12 段）。
CREATE TABLE IF NOT EXISTS sandbox_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  size INTEGER NOT NULL,                      -- 字节
  blob_path TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sandbox_settings (
  k TEXT PRIMARY KEY,                         -- 全局默认——键全集与值形 = `gateway/API.md` §2.5（单源）；「默认单」非本表（= sandbox_rules 种子行）
  v TEXT NOT NULL                             -- JSON 文本（数字 ∥ 字符串统一 JSON 编码）
);

-- ② 审计 CHECK 再扩（十型 ⇒ 十二型——表重建，步序与 v10 同构）
-- + 'sandbox_rule'（规则增删——detail = { action, rule }）∥ + 'sandbox_event'（审批三态/超时 ∥ 盒起停拆 ∥ 节点添加/删除（含连通自检失败行） ∥ 快照——detail = { kind, ... }）
-- 重建步（建新表（十二型 CHECK） ∥ 拷贝 ∥ DROP ∥ RENAME ∥ 两索引重建——SQL 形同 v10 段，逐字替换型清单）。
-- ③ 种子（初始化点 = 本段一次性写入；可改可删——不复活）
--   sandbox_rules 八行（source='default'）：deny（cidr）= 10.0.0.0/8 ∥ 172.16.0.0/12 ∥ 192.168.0.0/16；
--   allow（domain）= registry.npmjs.org ∥ github.com ∥ *.githubusercontent.com ∥ gitee.com ∥ *.gitee.com；
--   恒拒（127.0.0.0/8 ∥ 169.254.0.0/16）= 内置（非行——不入种子）；动态项（服务器网段 ∥ 节点自身网段）登记时自动带入。
```

- 语义/对象模型 = `sandbox/SANDBOX.md` §2/§3–§7（单源）；端点 = `gateway/API.md` §2.5/§2.7。
- 圈界：`sandbox_settings` = 键值设置面（全局默认——键全集/值形 = `gateway/API.md` §2.5）；`sandbox_*` 与 `members`/`api_keys` 的引用 = `owner_member_id` ∥ `key_id`（沿 `api_keys` 先例）；`sandbox_pending`/`sandbox_tasks`/`sandbox_checkpoints` 无 FK（历史/瞬态面自足——沿 `audit_events` 口径）。

- 表归属：`members` ∥ `api_keys` ∥ `sessions` ∥ `audit_events` = accounts 域（`accounts/ACCOUNTS.md`）；`usage` ∥ `usage_daily` ∥ `quota_counters` = metering 域（`metering/METERING.md`）；`providers` = gateway 域（provider 管理面 ∥ v4 模型设置——`gateway/API.md` §2.2）；
  `sandbox_runners` ∥ `sandbox_workspaces` ∥ `sandbox_rules` ∥ `sandbox_pending` ∥ `sandbox_tasks` ∥ `sandbox_checkpoints` ∥ `sandbox_settings` = sandbox 域（`sandbox/SANDBOX.md` §2——对象模型单源）；结构单源 = 本档。

### v12 增段（`sandbox_runners` 表重建——sandbox 域；runner-admin-console 批）

（背景：v11 段所列 `sandbox_runners` 列面 = 执行面重定后的**目标形**；v11 实落为旧通道形态（`token_hash` ∥ `labels_json` ∥ `last_heartbeat_at`）——本段一次重建收正，两形态不再并存。重建后列面以 §2 v11 段所列**为准**（本节不重复列举）。）

- **重建步**（SQLite 不可改列集——沿 v10 表重建先例）：① 建 `sandbox_runners_v12`（列面 = v11 段所列：`id` ∥ `name`（NOT NULL UNIQUE） ∥ `address`（NOT NULL） ∥ `status`（NOT NULL DEFAULT `'active'` CHECK `active`/`disabled`） ∥ `runtime_json`（NOT NULL DEFAULT `'{}'`——连通自检读数） ∥ `created_at`（NOT NULL））。
  ⇒ ② **存量行弃**（不迁——旧通道行无地址可取、令牌/心跳语义整废；一次性过渡行为）⇒ ③ `DROP TABLE sandbox_runners` ⇒ ④ `RENAME` ⇒ 无索引/无 FK（沿先例——`sandbox_workspaces.runner_id` 无 FK）。
- **判据（批内件）**：空库读数 12 ∥ v11 库升后读数 12 ∥ v12 段幂等（再开零变）∥ 列面五行在场（`pragma_table_info`）∥ 旧三列名不在（`token_hash` ∥ `labels_json` ∥ `last_heartbeat_at`）∥ 存量行弃（含旧行的 v11 库升后 ⇒ 空表）。
- 同段旁注（不在本段射程——登记在案）：v11 段所列 `sandbox_workspaces`（去 `required_labels_json`）∥ `sandbox_tasks`（去 `claimed_at`）两处列面仍与实表有差——随执行面重做批收正。

### v13 增段（`sandbox_onboarding` 建表——sandbox 域；runner-admin-console 批增补（托管接入））

（背景：托管接入任务 + 凭据 = 单表；任务态/步骤读数/凭据密文共一行——机制 = `sandbox/SANDBOX.md` §3。）

- **建表**（`CREATE TABLE sandbox_onboarding`——列面逐列）：`id`（INTEGER PRIMARY KEY）∥ `host`（TEXT NOT NULL——主机地址原文）∥ `ssh_port`（INTEGER NOT NULL DEFAULT 22）∥ `ssh_user`（TEXT NOT NULL）∥ `auth_kind`（TEXT NOT NULL CHECK `'key'`/`'password'`）∥
  `secret_cipher`（TEXT——AES-256-GCM 包 `iv|tag|ct` base64；零化后 NULL）∥ `sudo_cipher`（TEXT——可选，同形）∥ `credential_mode`（TEXT NOT NULL CHECK `'burn'`/`'keep'`）∥ `credential_state`（TEXT NOT NULL DEFAULT `'sealed'` CHECK `'sealed'`/`'burned'`/`'revoked'`）∥
  `name`（TEXT——节点名（可选；缺省取探测主机名））∥ `model`（TEXT NOT NULL——提交时所选模型）∥ `status`（TEXT NOT NULL CHECK `'running'`/`'succeeded'`/`'failed'`/`'interrupted'`）∥ `step`（TEXT——当前/最后一步 id）∥
  `steps_json`（TEXT NOT NULL DEFAULT `'[]'`——步骤日志（读数面））∥ `runner_id`（INTEGER——成功后关联；未成 NULL）∥ `created_by`（INTEGER——admin 成员 id）∥ `created_at`（TEXT NOT NULL）∥ `finished_at`（TEXT）。
- **加密密钥** = `data/credentials.key`（32 字节；首用生成；0600——**不落库**；如实披露 = `sandbox/SANDBOX.md` §3）。
- **判据（批内件）**：空库直落 13 ∥ v12 库升后读数 13 ∥ v13 段幂等（再开零变）∥ 列面十八列在场（`pragma_table_info`）∥ 凭据列读写往返（密文 ≠ 明文 ∥ 零化后 NULL）∥ 状态 CHECK 四值放行/越值拒。

### v14 增段（agent chat 两表 + 审计 CHECK 再扩——agent 域；admin-agent-chat 批）

（背景：管理面 chat = 会话 + 消息序两表（对象模型 = `agent/ADMIN-AGENT.md` §11——单源）；审计新型 `agent_event`（KD-SV-91）。）

```sql
-- ① 管理面 chat 两表
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
--   detail = { kind, chatId, tool?, call?, resultCode?, summary?, reason?（chat_stop——四值枚举同 v14 段 `data_json` 注） }——摘要截断 + 秘密掩蔽口径沿任务面）
-- 重建步（建新表（十三型 CHECK） ∥ 拷贝 ∥ DROP ∥ RENAME ∥ 两索引重建——SQL 形同 v10 段，逐字替换型清单）。
```

- 语义/对象模型 = `agent/ADMIN-AGENT.md` §11/§12（单源）；端点 = `gateway/API.md` §2.8；控制台面 = `webui/WEBUI.md` §2.10；审计型面 = `accounts/ACCOUNTS.md` §2.1。
- 圈界：`agent_chat_messages.chat_id` 无 FK（沿 `audit_events`/沙盒瞬态表口径）；消息不回写/不归档（保留口径未裁——不设清零——`agent/ADMIN-AGENT.md` §10）。
- **判据（批内件）**：空库直落 14 ∥ v13 库升后读数 14 ∥ v14 段幂等（再开零变）∥ 两表列面在场（`pragma_table_info`）∥ `(chat_id, seq)` 索引在场 ∥ 存量审计行逐值保形 + 两索引在场 ∥ `agent_event` 型可写（CHECK 放行）∥ `role`/`status` CHECK 枚举放行/越值拒。

## 3. 迁移链（`user_version` 逐版升）

- `thincoder-server/src/store/db.mjs`（已落盘）持 `MIGRATIONS` 数组——每段 = `{ v, up(db) }`（v = 目标 `user_version`，自 1 起递增；v1 = 基线段 = §2 全量 DDL）。
- 开库序：读 `user_version` ⇒ 顺序执行 `v > 当前` 的段（每段单事务；成功 ⇒ `PRAGMA user_version = v`；抛错 ⇒ 进程非零退出——fail-closed）。
- 结构每变一次 = 追一段（+1）——空库 ∥ 旧库启动自动升，零手工脚本（断点列 = `EVOLUTION.md` §1-G2）。
- v2 = provider 增段（`providers` 表——控制台 provider 管理；旧库（v1）启动自动升 ∥ 空库直落 v2）。
- v3 = 审计增段（`audit_events` 表 + 三索引——`accounts/ACCOUNTS.md` §2.1 ∥ key 明细索引）；旧库（v1/v2）启动自动升 ∥ 空库直落 v3；判据（批内件）= 空库结构版本读数 3 ∥ v2 库升后读数 3 ∥ 迁移链幂等（再开零变）。
- v4 = 模型设置增列（`providers.settings_json`——服务模型配置面）：**列级 ALTER = 表不重建**（SQLite `ADD COLUMN` 常量默认——存量行即刻得 `'{}'`）；旧库（v1–v3）启动自动升 ∥ 空库直落 v4；判据（批内件）= 空库读数 4 ∥ v3 库升后读数 4 ∥ v4 段幂等（再开零变）。
- first-release-completeness 批（2026-10-06）：**零结构变更**（保留窗清理 = 删除式 ∥ 登录防护计数 = 进程内存——均无新表；结构版本不变）。
- v5 = 两字段拆列 + 派生两表 + 成员配额列（**配额分模型批**——需求 §2:21 ∥ §2:22 ∥ 台账 #990/#991/#992）：五步见 §2 v5 段（拆列 ∥ 建 `usage_daily`/`quota_counters` ∥ 成员列增删 ∥ 期初回填）。
  判据（批内件）= 空库读数 5 ∥ v4 库升后读数 5 ∥ v5 段幂等（再开零变）∥ 拆列抽样逐值（含 `model` 带斜杠 ∥ 嵌入行 `provider = ''`）∥ 回填两表逐值 = usage 重算 ∥ 旧列不在 `pragma_table_info('members')`；耗时（一次性 @500k 行——同构探针实读）= 日表回填 ≈1.2s ∥ 计数回填 ≈3.4s（合计 ≈5s 级）。
- v6 = 成员模型禁用列（`members.model_disabled_json`——**配额 v2 · 成员模型面批** ∥ 台账 #1004）：**列级 ALTER = 表不重建**（存量行即刻得 `'{}'`——默认全可用）；旧库（v1–v5）启动自动升 ∥ 空库直落 v6；判据（批内件）= 空库读数 6 ∥ v5 库升后读数 6 ∥ v6 段幂等（再开零变）∥ 新列常量默认在场（`pragma_table_info('members')` 含列）。
- v7 = provider 模型元数据留存列（`providers.model_meta_json`——**Provider 模型元数据批** ∥ 台账 #1005）：**列级 ALTER = 表不重建**（存量行即刻得 `'{}'`——未存 = 无元数据）；旧库（v1–v6）启动自动升 ∥ 空库直落 v7；判据（批内件）= 空库读数 7 ∥ v6 库升后读数 7 ∥ v7 段幂等（再开零变）∥ 新列常量默认在场（`pragma_table_info('providers')` 含列）。
- v8 = key 名称列（`api_keys.name`——**me-keys 批** ∥ 台账 #1023）：**列级 ALTER = 表不重建**（存量行即刻得 `''` ⇒ 随段回填默认名 `key-N`——按成员签发序）；旧库（v1–v7）启动自动升 ∥ 空库直落 v8；判据（批内件）= 空库读数 8 ∥ v7 库升后读数 8 ∥ v8 段幂等（再开零变）∥ 新列在场（`pragma_table_info('api_keys')` 含 `name`）∥ 存量回填抽查（多 key 成员：行名 = `key-1..key-N` 按 id 序 ∥ 空串零残留）。
- v9 = provider 上游代理旗（`providers.proxy`——**server 代理批** ∥ 台账 #1129）：**列级 ALTER = 表不重建**（存量行即刻得 `0`——缺省直连）；旧库（v1–v8）启动自动升 ∥ 空库直落 v9；判据（批内件）= 空库读数 9 ∥ v8 库升后读数 9 ∥ v9 段幂等（再开零变）∥ 新列在场（`pragma_table_info('providers')` 含 `proxy`）∥ 存量默认值抽查（迁移后旧行 `proxy = 0`——直连缺省）。
- v10 = 审计事件型扩（`audit_events` CHECK 扩十型——**配置控制台批** ∥ 台账 #1139）：**表重建**（SQLite 不可改 CHECK——建新表 ∥ 拷贝 ∥ 换名 ∥ 索引重建）；旧库（v1–v9）启动自动升 ∥ 空库直落 v10；判据（批内件）= 空库读数 10 ∥ v9 库升后读数 10 ∥ v10 段幂等（再开零变）∥ 存量行逐值保形（id/时刻/型/详情——拷贝前后全等）∥ 两索引在场 ∥ `config_update` 型可写（CHECK 放行）∥ `sqlite_sequence` 连续（新事件 id 不撞存量）。
- server-model-alias 批（2026-10-09——台账 #1153）：**零结构变更**（别名 = `models_json` 元素升级——JSON 文本内演进；无新列/新表/新段——结构版本保持 **10**；旧行字符串天然兼容）；判据（批内件）= 迁移链读数仍 10 ∥ 别名增删往返不改库结构（`pragma_table_info('providers')` 零变）。
- v11 = 沙盒七表 + 审计 CHECK 再扩（十二型）+ `sandbox_rules` 种子（八行——**server-exec-sandbox 批** ∥ 台账 #1224）：七表 CREATE（见 §2 v11 段）+ 种子写入（`source='default'`——一次性；可改可删不复活）+ `audit_events` 表重建（十型 ⇒ 十二型：+ `sandbox_rule` ∥ `sandbox_event`——步序与 v10 同构）；
  旧库（v1–v10）启动自动升 ∥ 空库直落 v11；判据（批内件）= 空库读数 11 ∥ v10 库升后读数 11 ∥ v11 段幂等（再开零变） ∥ 七表在场（`pragma_table_info`） ∥ 存量审计行逐值保形 + 两索引在场 ∥ 两新型可写（CHECK 放行） ∥ 种子八行在场（`source='default'`——deny 三 + allow 五） ∥ 覆写列在场（`sandbox_workspaces.limits_json` 默认 `'{}'`）。
- v12 = `sandbox_runners` 表重建（旧通道形态 ⇒ Docker 节点形态——**runner-admin-console 批** ∥ 台账 #1252）：**表重建**（建新表 ∥ 存量行弃 ∥ DROP ∥ RENAME——见 §2 v12 段）；旧库（v1–v11）启动自动升 ∥ 空库直落 v12；判据（批内件）= 空库读数 12 ∥ v11 库升后读数 12 ∥ v12 段幂等（再开零变）∥ 列面五行在场 ∥ 旧三列名不在 ∥ 存量行弃（含旧行 ⇒ 空表）∥ `sandbox_workspaces.runner_id` 引用面零变。
- v13 = `sandbox_onboarding` 建表（托管接入任务 + 凭据——**runner-admin-console 批增补** ∥ 台账 #1236/#1237）：**加表**（零重建——见 §2 v13 段）；旧库（v1–v12）启动自动升 ∥ 空库直落 v13；判据（批内件）= 空库读数 13 ∥ v12 库升后读数 13 ∥ v13 段幂等（再开零变）∥ 列面十八列在场 ∥ 凭据读写往返（密文 ≠ 明文 ∥ 零化后 NULL）∥ 存量表零变。
- v14 = agent chat 两表 + 审计 CHECK 再扩（十三型——**admin-agent-chat 批** ∥ 台账 #1254）：**加两表 + 表重建**（SQLite 不可改 CHECK——步序与 v10/v11 同构；见 §2 v14 段）；旧库（v1–v13）启动自动升 ∥ 空库直落 v14；判据（批内件）= 空库读数 14 ∥ v13 库升后读数 14 ∥ v14 段幂等（再开零变）∥ 两表列面在场 + `(chat_id, seq)` 索引在场 ∥ 存量审计行逐值保形 + 两索引在场 ∥ `agent_event` 型可写。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/store/db.mjs`（已落盘） | **124 ⇒ ≈160 ⇒ 144**（实读——v3 落地后）**⇒ ≈155**（服务模型配置面批 +≈11 = v4 段（ALTER + 迁移段））**⇒ 实读 150 ⇒ ≈205**（配额分模型批 +≈55 = v5 段：拆列 ALTER/UPDATE ∥ 建两表 ∥ 两回填 INSERT ∥ 成员列增删）**⇒ 实读 202 ⇒ ≈214**（配额 v2 批 +≈12 = v6 段（ALTER + 迁移段））**⇒ 实读 210（v6 落地后）⇒ ≈218**（模型元数据批 +≈8 = v7 段（ALTER + 迁移段——与 v6 段同构））**⇒ ≈228**（me-keys 批 +≈10 = v8 段（ALTER + 回填 UPDATE + 迁移段——较 v6/v7 段多一条回填））**⇒ 实读 ≈224（2026-10-09）⇒ ≈234**（本批代理：v9 段 +≈10——实读待回填）**⇒ 实读 231（2026-10-09——本设计轮复读）⇒ ≈256（配置控制台批：v10 重建段 +≈25——建新表/拷贝/换名/索引重建 ∥ 迁移段；实读待回填）⇒ 实读 255（2026-10-09——配置控制台批落地后）∥ ±0（2026-10-09 alias 批：零结构变更）⇒ ≈350（server-exec-sandbox 批：v11 段 +≈95 = 七表 + 种子 + 审计重建——实读待回填）** ⇒ 实读 **365**（2026-10-10——runner-admin-console 批现读）⇒ ≈400（本批：v12 段 +≈35——实读待回填）⇒ **≈425**（托管接入增补：v13 段 +≈25——实读待回填）** ⇒ 实读 **409**（2026-10-11——本设计轮现读）⇒ ≈450（本批：v14 段 +≈41（两表 + 重建 + 迁移段）——实读待回填）** | 开库 ∥ PRAGMA ∥ DDL ∥ 迁移链 ∥ 语句封装 |

## 5. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-3 | **存储 = `node:sqlite`（`DatabaseSync`）**——WAL ∥ `user_version` 结构版本 | 需求候选 + 仓内先例（核 `thincoder-core/ledger-db.mjs:18` 同技术）；零依赖 ∥ 单文件 ∥ SQL 聚合天然贴合看板/配额 | JSON 文件（并发/查询弱、无原子写）· 外部 DB（违零依赖 ∥ 运维重）· 内存（重启即失——违计量本意） |
| KD-SV-40 | **v5 迁移 = 模型标识两字段（`provider` ∥ `model`）+ 派生两表 + 旧列删除**：拆列判据 = `endpoint = 'chat'`（嵌入行 `provider = ''`——无前缀命名空间）；派生两表 = 可重算（对账兜底）+ 不设 FK；旧 `members.quota_tokens` **删列**（`DROP COLUMN`——`node:sqlite`（SQLite 3.53.4）实核可）不弃用：总量 ≠ 分模型无保义映射（不转换 ⇒ 列删）；`ADD COLUMN` 常量默认 = 表不重建 | 用户 09:38 直令（「应该分两个字段，将来统计的时候需要按provider」——需求 §2:22）；迁移窗口 = 配额分模型批同窗（§2:22③）；弃用列留残 = 双源混乱 ∥ 转换 = 语义放大（总量复制到每模型）；派生面同事务维护（`metering/METERING.md` §1） | 转换旧值到每模型覆盖（无保义——总量 ≠ 分模型）· 保留旧列只读弃用（死列 ∥ 归拼口径分裂）· 拆列按全行 `instr > 0`（嵌入名可含斜杠 ⇒ 误拆——故以 `endpoint` 为判据）· 派生表异步回填（两写路径 = 漂移面） |

## 6. 本域边界（不做的面）

- 归档/导出面不做（清理 = 保留窗删除式——`metering/METERING.md` §1；备份 = 部署侧面——`ops/OPS.md` §5.5）；多实例共享存储 = 触发项（`EVOLUTION.md` §2）；结构升级只走迁移链（不做手工脚本面）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——store 域：库 ∥ DDL（四表——members 扩列 + sessions） ∥ 迁移链；KD-SV-3。
- 2026-10-06：实施后回填轮（fix）——§4 行数按实读回填（≈175 ⇒ 110）。
- 2026-10-06：控制台 provider/模型管理设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ 台账 #962）——§1 结构版本 1 ⇒ 2 ∥ §2 增 v2 增段（`providers` 表——字段面/注释）+ 表归属补 gateway 行 ∥ §3 迁移链补 v2 段 ∥ §4 预算（db 110 ⇒ ≈135）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12 ∥ 台账 #963）——§3 补零结构变更句 ∥ §6 边界随正（清理 = 删除式保留窗；备份归部署侧面）。
- 2026-10-06：实施后回填轮（R14——批 `docs/batches/2026-10-06-console-providers.md`）：§4 行数按实读收正（db **124**）。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 结构版本 2 ⇒ 3 ∥ §2 增 v3 增段（`audit_events` + `idx_audit_ts`/`idx_audit_type_ts`/`idx_usage_key_ts`）∥ 表归属补 accounts 行 ∥ §3 迁移链补 v3 段 ∥ §4 预算（db 124 ⇒ ≈160）；同源随动 = `accounts/ACCOUNTS.md` §2.1 ∥ `metering/METERING.md` §3。
- 2026-10-06：服务模型配置面设计轮（批 `docs/batches/2026-10-06-models-config.md`——需求 §2:17 ∥ 台账 #981）——§1 结构版本 3 ⇒ 4 ∥ §2 增 v4 增段（`ALTER TABLE providers ADD COLUMN settings_json`——形/写面/校验/消费）∥ 表归属 providers 行补 v4 ∥ §3 迁移链补 v4 段（表不重建 ∥ 判据）∥ §4 预算（db ⇒ ≈155；v4 段 +≈11）；同源随动 = `gateway/API.md` §2.2 ∥ `webui/WEBUI.md` §2.4③。
- 2026-10-07：配额分模型批设计轮（批 `docs/batches/2026-10-07-quota-per-model.md`——需求 §2:21 ∥ §2:22 ∥ 台账 #990/#991/#992）——§1 结构版本 4 ⇒ 5 ∥ §2 增 v5 增段（usage 两字段拆列 ∥ `usage_daily` ∥ `quota_counters` ∥ members 增 `model_quotas_json`/删 `quota_tokens` ∥ 期初回填——全 DDL 逐字）∥ v4 段 settings 形补 `quotaTokens`（消费补配额句）∥ 表归属补 metering 两表 ∥ §3 迁移链补 v5 段（判据 + 一次性耗时读数）∥ §4 预算（db 150 ⇒ ≈205）∥ §5 增 KD-SV-40；同源随动 = `metering/METERING.md` §1/§2 ∥ `gateway/API.md` §2.2。
- 2026-10-07：配额 v2 · 成员模型面批设计轮（批 `docs/batches/2026-10-07-quota-v2-member-models.md`——需求 §2:23 ∥ 台账 #1002/#1003/#1004 + 并入 #1001/#994/#995/#988）——§1 结构版本 5 ⇒ 6 ∥ §2 增 v6 增段（`members.model_disabled_json`——形/消费/与配额列并置句）∥ §3 迁移链补 v6 段（判据）∥ §4 预算（db 实读 202 ⇒ ≈214）；同源随动 = `accounts/ACCOUNTS.md` §2.2/§3 ∥ `gateway/API.md` §2.1。
- 2026-10-07：Provider 模型元数据批设计轮（批 `docs/batches/2026-10-07-provider-model-metadata.md`——台账 #1005 + 并入 #984）——§1 结构版本 6 ⇒ 7 ∥ §2 增 v7 增段（`providers.model_meta_json`——形/写面/读面/消费/圈界）∥ §3 迁移链补 v7 段（判据）∥ §4 预算（db 实读 210 ⇒ ≈218——v6 落地后基数重估）；同源随动 = `gateway/API.md` §2.2 ∥ `webui/WEBUI.md` §2.4④。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-provider-model-metadata.md` §3 九发现，本档面）：§4 预算按现读重估（v6 已落盘——db 实读 210；v7 终值 ≈218——上条括注同拍）。
- 2026-10-07：me-keys 批设计轮（批 `docs/batches/2026-10-07-me-keys-redo.md`——需求 §2:25 ∥ 台账 #1023）——§1 结构版本 7 ⇒ 8 ∥ §2 增 v8 增段（`api_keys.name`——形/语义指针/写读面/回填口径）∥ §3 迁移链补 v8 段（判据）∥ §4 预算（db 实读 210 ⇒ ≈228——v8 段 +≈10）；同源随动 = `accounts/ACCOUNTS.md` §1.1 ∥ `webui/WEBUI.md` §2.3⑥。
- 2026-10-09：server 代理批设计轮（批 `docs/batches/2026-10-09-server-gemini-openai-preset.md`——台账 #1129；用户 13:5x 令）：§1 结构版本 8 ⇒ **9** ∥ §2 增 v9 增段（`providers.proxy`——形/语义指针/圈界）∥ §3 迁移链补 v9 段（判据）∥ §4 预算（db 实读 ≈224 ⇒ ≈234——v9 段 +≈10）；同源随动 = `gateway/API.md` §2.2/§6 KD-SV-55 ∥ `ops/OPS.md` §1 ∥ `webui/WEBUI.md` §2.4④。
- 2026-10-09：配置控制台批设计轮（批 `docs/batches/2026-10-09-server-console-config.md`——台账 #1139；用户 15:51–15:57 三连）：§1 结构版本 9 ⇒ **10** ∥ §2 增 v10 增段（`audit_events` CHECK 扩型——表重建 SQL 逐字 ∥ 语义/圈界）∥ §2 标题随正 ∥ §3 迁移链补 v10 段（判据）∥ §4 预算（db 实读 231 ⇒ ≈256——v10 段 +≈25）；同源随动 = `accounts/ACCOUNTS.md` §2.1（事件型/写入面） ∥ `webui/WEBUI.md` §2.3④（十型）。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-console-config.md` §3 评审发现 6，本档面）：§1 版本枚举补 v9 条（`providers.proxy`——server 代理批）。**零新语义**（评审发现直接导出项）。
- 2026-10-09（**server-model-alias 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-model-alias.md` §2 · 台账 #1153；需求 §2:29 + AC-29）：§1 补零结构变更句 ∥ §2 v2 段 `models_json` 注释两形 + 增条目两形/别名语义条 ∥ v5 拆列注释随正（内部真名）+ `provider` 约定句补别名回映射 ∥ v6 禁令键形收正（裸名合法 + 首尾空白 400——#1008）∥ §3 补零结构变更条（版本保持 **10**）∥ §4 db.mjs 行 ±0 句。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 · 台账 #1224；需求 §5 沙盒块 + 用户 14:00 两平面裁定）：§1 结构版本 10 ⇒ **11** ∥ §2 增 v11 增段（沙盒七表 DDL ∥ 审计 CHECK 再扩（十型 ⇒ 十二型）重建注）∥ §2 标题随正 ∥ 表归属补 sandbox 行 ∥ §3 迁移链补 v11 段（判据）∥ §4 预算（db 实读 255 ⇒ ≈345——v11 段 +≈90）；同源随动 = `sandbox/SANDBOX.md` §2 ∥ `accounts/ACCOUNTS.md` §2.1（十二型） ∥ `gateway/API.md` §2.5/§2.6。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §3 轮次 1 之 1/2 + 用户 14:56 直令）：§2 v11 段 `sandbox_workspaces` 增 `limits_json` 列（每工作区覆写——键集/取值序 = `sandbox/SANDBOX.md` §2）∥ `sandbox_settings` 注释收正（键全集/值形单源 = `gateway/API.md` §2.5；「默认单」非本表 = `sandbox_rules` 种子行）∥ 增 ③ 种子注（初始化点 = 本段一次性写入——八行：deny 三 + allow 五；恒拒两项非行）∥ `sandbox_event` 注补 join 失败 ∥ §3 v11 判据补种子八行 + 覆写列 ∥ §4 db.mjs 行随正（⇒ ≈350）。**零新语义**（评审发现直接导出项 + 用户直令）。
- 2026-10-10（**runner-admin-console 批 · 设计档随正 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252；用户 2026-10-10 19:52–19:56 口径「runner = 远程 Docker API 节点」）：§2 v11 段列面随正——`sandbox_runners` 去 token_hash/labels_json/last_heartbeat_at、增 address（Docker API 地址）、status 枚举收窄（active/disabled）、runtime_json 注释 = 连通自检读数 ∥ `sandbox_workspaces` 去 required_labels_json（runner_id 注释 = 绑定节点）∥ `sandbox_tasks` 去 claimed_at（status 去 claimed）∥ 审计注/种子注/端点注随正；**`db.mjs` v11 列面实现与本节差 = 实施侧收正项（重做批）**；同源随动 = `sandbox/SANDBOX.md` §2 ∥ `accounts/ACCOUNTS.md` §2.1 ∥ `gateway/API.md` §2.5。**产品码零触**。
- 2026-10-10（**runner-admin-console 批 · A 批最小切片设计 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252；用户 19:59 令）：§1 结构版本 11 ⇒ **12** ∥ §2 标题随正（v2–v11 ⇒ v2–v12）+ **增 v12 增段**（`sandbox_runners` 表重建——旧通道形态 ⇒ Docker 节点形态；重建步 ∥ 存量行弃 ∥ 幂等判据；列面不重复 = v11 段所列为准）∥ §3 迁移链补 v12 段（判据）∥ §4 预算（db 实读 **365** ⇒ ≈400——v12 段 +≈35）；同源随动 = `sandbox/SANDBOX.md` §2/§3。**产品码零触（设计轮）**。
- 2026-10-10（**runner-admin-console 批 · 托管接入（管理面 agent）设计 · eng-designer**——承批档 §2 · 台账 #1236/#1237；用户 22:19–22:29 四句 + 15:00/15:02 裁）：§1 结构版本 12 ⇒ **13** ∥ §2 标题随正（v2–v12 ⇒ v2–v13）+ **增 v13 增段**（`sandbox_onboarding` 建表——任务态/步骤日志/凭据密文；密钥文件显式不落库 ∥ 十八列）∥ §3 迁移链补 v13 段（判据）∥ §4 预算（≈400 ⇒ ≈425——v13 段 +≈25）；同源随动 = `sandbox/SANDBOX.md` §2/§3 ∥ `accounts/ACCOUNTS.md` §2.1。**产品码零触（设计轮）**。
- 2026-10-11（**admin-agent-chat 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-11-admin-agent-chat.md` §1 · 台账 #1254；需求 §5「两个 chat 界面」②④）：§1 结构版本 13 ⇒ **14** ∥ §2 标题随正（v2–v13 ⇒ v2–v14）+ **增 v14 增段**（agent chat 两表 —— 会话/消息序 ∥ 审计 CHECK 再扩十二 ⇒ 十三型：+ `agent_event`；重建步同 v10/v11 同构）∥ §3 迁移链补 v14 段（判据）∥ §4 预算（db 实读 **409** ⇒ ≈450——v14 段 +≈41）；同源随动 = `agent/ADMIN-AGENT.md` §11/§12 ∥ `accounts/ACCOUNTS.md` §2.1（十三型） ∥ `gateway/API.md` §2.8。**产品码零触（设计轮）**。
- 2026-10-10（**runner-admin-console 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §3 轮次 1 之 8）：§2 v11 段 `sandbox_workspaces` ∥ `sandbox_tasks` 两表定义处就近补注（列面差 = 去 `required_labels_json` ∥ 去 `claimed_at`——与 v12 段旁注同指；实现收正随执行面重做批）。**零新语义**（评审发现直接导出项）。
- 2026-10-11（**admin-agent-chat 批 · 实施轮上抛回笔（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-11-admin-agent-chat.md` §6（实施轮上抛处置 + notice 补裁——④ 空回合单列 · 四值枚举））：§2 v14 段 `data_json` 注释收正——notice 的 `reason` 四值枚举（重启收尾 "restart" ∥ 预算超限 "budget" ∥ 模型错误 "model_error" ∥ 空回合 "empty_turn"；与 `gateway/API.md` §2.8 ∥ `agent/ADMIN-AGENT.md` §11 同拍）。**零新语义**（上抛裁决直接导出项）。
- 2026-10-11（**admin-agent-chat 批 · notice 四值同拍 · 主 agent 直接执行 · 可 revert**）：§2 v14 段审计注 `chat_stop` 原因列举补「空回合」+ `reason?` 钉四值枚举指针（同段 `data_json` 注）。**零语义**。
