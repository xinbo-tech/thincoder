# Thincoder Server · 存储（store/STORE）

> 板块 = server ∥ 本档 = store 域（库 ∥ DDL ∥ 迁移链——accounts 与 metering 共用）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 结构面档（表语义 = 各域档）；数据面 AC = `metering/METERING.md` §4 ∥ `accounts/ACCOUNTS.md` §5（审计事件面）；结构升版判据 = §3 v3 段（空库直落 ∥ v2 旧库启动自动升——随单元测试档）。

## 1. 库形态

- 单库单连接（`DatabaseSync`）；PRAGMA：WAL ∥ `synchronous=NORMAL` ∥ `busy_timeout=5000` ∥ `foreign_keys=ON`。
- 库文件默认 = `thincoder-server/data/gateway.db`（运行期生成，不入 git）。
- 结构版本 = `PRAGMA user_version`（当前 = **25**——v2 增 `providers` ∥ v3 增 `audit_events` 与三索引 ∥ v4 增 `providers.settings_json`（模型设置——服务模型配置面） ∥
  v5 增模型标识两字段拆列 + 派生两表 + 成员配额列 ∥ v6 增成员模型禁用列（详见 §2 v5/v6 段） ∥ v7 增 provider 模型元数据留存列 ∥ **v8 增 key 名称列（`api_keys.name`）**（详见 §2 v7/v8/v9 段） ∥
  v9 增 provider 上游代理旗（`providers.proxy`） ∥ **v10 增审计型 `config_update`（`audit_events` 重建——CHECK 扩型）**（详见 §2 v10 段） ∥ **v11 增沙盒七表 + 审计 CHECK 再扩（十二型）**（详见 §2 v11 段） ∥
   **v12 `sandbox_runners` 表重建（Docker 节点形态）**（详见 §2 v12 段） ∥ **v13 增 `sandbox_onboarding` 表（托管接入；停机留史——数据不删 ∥ 零写入零读面）**（详见 §2 v13 段） ∥
  **v14 增 agent chat 两表 + 审计 CHECK 再扩（十三型）**（详见 §2 v14 段） ∥ **v15 增 `image_sources` 表（镜像源清单）**（详见 §2 v15 段） ∥ **v16 增会话级思考档位列（`agent_chats.reasoning`）**（详见 §2 v16 段）
   ∥ **v17 增 git 源/项目/项目成员三表 + 审计 CHECK 再扩（十四型）**（详见 §2 v17 段） ∥ **v18 增主机表七列 + `sandbox_onboarding` 凭据态四值（`'moved'`）+ 回填移交**（详见 §2 v18 段）
  ∥ **v19 增 `api_keys.key_plain` 列（管理面 sk 明文面）**（详见 §2 v19 段）
  ∥ **v20 增团队台账表 + 审计 CHECK 再扩（十五型）**（详见 §2 v20 段）
  ∥ **v21 增 `git_sources.scope_kind` 列 + 存量回填（gitee 范围三态）**（详见 §2 v21 段）；
  ∥ **v22 收正段（`sandbox_workspaces` 表重建（去 `required_labels_json` ∥ 增 `stop_reason` ∥ 增 `base_image`）+ 增建 `registry_credentials` 表 + `sandbox_tasks` 删表 + 增 `sandbox_runners` 连接材料四列（TLS 档）——sandbox 域）**（详见 §2 v22 段）
  ∥ **v23 增成员 git 凭据表 + 审计 CHECK 再扩（十六型；会话两表不建——题一裁定会话真源在盒内）**（详见 §2 v23 段）；
  ∥ **v24 增 `mcp_servers` 表 + 审计 CHECK 再扩（十七型——mcp 域）**（详见 §2 v24 段）
  ∥ **v25 增 `agent_chats.auto_approve` 列（审批卡面 `always` 槽——agent 域）**（详见 §2 v25 段）；
  未发布期连续演进，无历史库迁移包袱——旧库启动自动升；迁移链机制自 v1 起备）。
- **零结构变更（model-alias 批）**：别名落 `models_json` 元素——JSON 文本内演进；无新列/新表/新段。

## 2. DDL（v1 基线四表 + v2–v25 增段）

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
  models_json TEXT NOT NULL DEFAULT '[]',       -- 开放清单（JSON 数组——条目两形：字符串 = 上游模型名（无别名）∥ 对象 { name, alias }（配别名）；对外标识 = alias ∥ provider/model）
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

- 条目两形与别名语义（KD-SV-59）：别名 = 元素内字段（`{ name, alias }`——alias 非空 ∥ 不含斜杠；字符串条目 = 无别名）；**零迁移**（列形不变——旧行字符串天然兼容；保存径归一 = 别名缺省/空回落字符串形）；校验/唯一性/派发 = `gateway/API.md` §2.2 ∥ §6 KD-SV-59；配置面（种子）= `ops/OPS.md` §1。

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

- 形 = `{ "<上游模型名>": { rpm ∥ tpm（正整数 ∥ null） ∥ costIn ∥ costOut（≥0 数 ∥ null） ∥ note（≤200 字 ∥ null） ∥ quotaTokens（≥0 整数 ∥ null——每人每月默认用量） } }`——`null`/缺省 = 未设；键 = 上游模型名（与 `models` 同空间；不在 `models` 的键合法——设置随名保留，停用不丢）。
- 写面 = PATCH `/api/admin/providers/:id` 的 `settings` 键级合并（`gateway/API.md` §2.2）；校验单源 = `thincoder-server/src/ops/config.mjs`（`validateProviderEntry`/`validateProviderEntries` 扩 settings——未知子字段 ∥ 非法值 ⇒ 400/拒启）；装配载入缺省 = `{}`（配置种子零 settings 字段——控制台单一面）。
- 消费 = 限流（`gateway/ratelimit.mjs`——KD-SV-35）读 `rpm`/`tpm`；`costIn`/`costOut`/`note` = 展示面（`webui/ADMIN.md` §2.1③）；`quotaTokens` = 配额平台层默认值（`metering/METERING.md` §2——三级之一，KD-SV-38）。

### v5 增段（模型标识两字段拆列 + 派生两表 + 成员配额列——metering ∥ accounts 域）

```sql
-- ① usage 两字段拆列（KD-SV-40）：内部真名两字段（对外显示 = 别名回映射）；`model` 可含斜杠；嵌入行 `provider = ''`（无前缀命名空间）
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

- `provider` 约定（usage ∥ usage_daily ∥ quota_counters 三表同构）：chat 行 = provider 名（无 `/`）；嵌入行 = `''`（无 provider 维——回拼 = `model` 单段）；**对外标识 = 别名回映射**（配别名模型——读面单源 = `thincoder-server/src/gateway/providers.mjs` 别名索引；KD-SV-59）。
- 两派生表 = **可重算**（`usage reconcile`——`metering/METERING.md` §2）；**不设 FK**（派生面自足——沿 `audit_events` 无 FK 口径；成员删除本无路径）；唯一键即查形（日表 = `day` 前缀日窗扫描；计数表 = 四列点查 O(1)——`EXPLAIN` 预期 `SEARCH … USING INDEX sqlite_autoindex_… (…)`）。
- 保留/清理 = 与 usage **同窗同清**（`metering/METERING.md` §1——三表同事务删除）。

### v6 增段（`members.model_disabled_json`——accounts 域）

```sql
ALTER TABLE members ADD COLUMN model_disabled_json TEXT NOT NULL DEFAULT '{}';  -- 成员 × 模型禁用集（JSON 对象——键 = 对外标识；值 = true）
```

- 形 = `{ "<对外标识（别名 ∥ provider/model）>": true }`——键 = 对外标识（与 `model_quotas_json` 同空间；键形校验同助手——非空 ∥ 无首尾空白 ∥ 含斜杠时两段非空（裸名 = 别名形合法））；值仅 `true`（禁用）；删键 = 恢复可用；缺省 `{}` = **默认全可用**。
- 机制全文 = `accounts/ACCOUNTS.md` §2.2；消费面 = 鉴权行携带（`accounts/keys.mjs` `verifyKey`——沿 `model_quotas_json` 零查询口径） ⇒ 网关准入（`gateway/API.md` §2.1）+ `/v1/models` 随动滤除 + 成员弹窗勾选态（`webui/ADMIN.md` §2.1②）。
- 与 `model_quotas_json`（v5）并列：两列各管一轴——配额 = 用量限额 ∥ 禁用 = 可用性（优先级判据 = `accounts/ACCOUNTS.md` §2.2）。

### v7 增段（`providers.model_meta_json`——gateway 域）

```sql
ALTER TABLE providers ADD COLUMN model_meta_json TEXT NOT NULL DEFAULT '{}';  -- 上游模型元数据留存图（JSON 对象——形见下）
```

- 形 = `{ "<上游模型名>": { displayName? ∥ contextWindow?（正整数） ∥ vision?（`true`） ∥ status?（退役状态原文） } }`——**≥1 字段才入键**（缺就空着——零兜底值、零占位）；只含开放清单（`models_json`）模型（写面求交）。
- 保留集与各上游来源映射 = `gateway/API.md` §2.2「模型元数据」条（逐字）；本列 = **纯展示数据**（转发 ∥ 派发 ∥ `/v1/models` 零涉）。
- 写面 = 保存路径（POST/PATCH）携 `modelMeta`（键在场 = 期望图——白名单过滤 + 形不符即略 + 求交；缺省 = 现存按求交滑动）；读面 = `rowToEntry` 解码（坏 JSON ⇒ 行数据损坏抛——沿 `models_json`/`settings_json` 口径）；消费 = 控制台 Provider 详情弹窗（`webui/ADMIN.md` §2.1④）。

### v8 增段（`api_keys.name`——accounts 域）

```sql
ALTER TABLE api_keys ADD COLUMN name TEXT NOT NULL DEFAULT '';  -- key 名称（空串 = 迁移前存量行——随段回填默认名）
UPDATE api_keys SET name = 'key-' || (SELECT COUNT(*) FROM api_keys k2 WHERE k2.member_id = api_keys.member_id AND k2.id <= api_keys.id);  -- 存量行回填默认名（key-N——按成员签发序）
```

- 形 = 自由文本标签（≤40 字符——服务层 trim 后校验；空名 ⇒ 服务层生成默认名 `key-N` 落库）；**非标识**——寻址仍按 `id`/提示形（重名允许 ∥ 无唯一索引）。
- 语义与写面 = `accounts/ACCOUNTS.md` §1.1（命名规则 ∥ 上限 ∥ 自助签发/吊销）；读面 = `memberView` key 行（`name` 随行下发——仅未吊销）；消费 = 控制台「我的·key 与签发」表列（`webui/ME.md` §2.1）。
- 回填口径：N = 该成员按 `id` 升序的序号（含吊销行——单调不复用；后续签发 = 服务层按同口径续编）；**逐行结果稳定**（子查询只读 `member_id`/`id`——两列不被本 UPDATE 改写，扫描顺序无关）。

### v9 增段（`providers.proxy`——gateway 域）

```sql
ALTER TABLE providers ADD COLUMN proxy INTEGER NOT NULL DEFAULT 0;  -- 上游代理旗（1 = 该渠上游请求经代理；0 = 直连——缺省）
```

- 形 = 布尔旗（SQLite 无布尔——1/0；非布尔 ⇒ 写面 400 ∥ 配置面拒启）；读面解码 = `rowToEntry` 转 boolean（`proxy: row.proxy === 1`——沿 `settings`/`modelMeta` 解码位）。
- 语义与判定 = `gateway/API.md` §6 KD-SV-55（旗 1 ∧ 顶层 `proxy.uri` 在案 ⇒ 该渠上游请求经代理——chat ∥ 发现同判定）；配置面 = `ops/OPS.md` §1（顶层 `proxy` 段）；控制台面 = `webui/ADMIN.md` §2.1④。
- 圈界：纯路由旗——零计量 ∥ 零展示涉 ∥ 不参与 `/v1/models` 与元数据面。

### v10 增段（`audit_events.type` CHECK 扩型——accounts 域）

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
- 语义与写入点 = `accounts/ACCOUNTS.md` §2.1（写入面 = `src/gateway/config-admin.mjs`（已落盘）——写盘成功后一条；失败 ⇒ warn，不反噬已落盘事实）；消费 = 审计页类型下拉/文案（`webui/READINGS.md` §2.1④——型面现状 = 十三型，v14 段）。
- 圈界：重建净零新表/新列——判据 = 行拷贝逐值（含 id 连续）+ 两索引在场。

### v11 增段（沙盒七表 + 审计 CHECK 再扩——sandbox 域；**`sandbox_rules`/`sandbox_pending` 两表已退场——表在库留史，零写入零读面**）

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
-- 注：本表列面（去 `required_labels_json`）与实表一致——v22 段表重建。
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
-- 注：`sandbox_rules`/`sandbox_pending` 两表已退场：表在库留史，零写入 ∥ 零读面；无删表迁移（历史数据不删）。
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
-- 注：本表（指令队列）已退场——v22 段删表（KD-SV-161；本段 DDL 为历史形，保留在链）。
CREATE TABLE IF NOT EXISTS sandbox_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  size INTEGER NOT NULL,                      -- 字节
  blob_path TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sandbox_settings (
  k TEXT PRIMARY KEY,                         -- 全局默认——键全集与值形 = `gateway/API.md` §2.5（单源）
  v TEXT NOT NULL                             -- JSON 文本（数字 ∥ 字符串统一 JSON 编码）
);

-- ② 审计 CHECK 再扩（十二型——表重建，步序与 v10 同构）
-- + 'sandbox_rule'（规则增删——detail = { action, rule }；写入面已退场）∥ + 'sandbox_event'（盒起停拆 ∥ 节点添加/删除（含连通自检失败行） ∥ 快照——detail = { kind, ... }）
-- 重建步（建新表（十二型 CHECK） ∥ 拷贝 ∥ DROP ∥ RENAME ∥ 两索引重建——SQL 形同 v10 段，逐字替换型清单）。
-- ③ 种子（初始化点 = 本段一次性写入；可改可删——不复活）——**本种子面已退场：零写入；历史行不动**。
```

- 语义/对象模型 = `sandbox/SANDBOX.md` §2/§3–§7（单源）；端点 = `gateway/API.md` §2.5/§2.7。
- 圈界：`sandbox_settings` = 键值设置面（全局默认——键全集/值形 = `gateway/API.md` §2.5）；`sandbox_*` 与 `members`/`api_keys` 的引用 = `owner_member_id` ∥ `key_id`（沿 `api_keys` 先例）；`sandbox_pending`/`sandbox_checkpoints` 无 FK（历史/瞬态面自足——沿 `audit_events` 口径）。

- 表归属：`members` ∥ `api_keys` ∥ `sessions` ∥ `audit_events` = accounts 域（`accounts/ACCOUNTS.md`）；`usage` ∥ `usage_daily` ∥ `quota_counters` = metering 域（`metering/METERING.md`）；`providers` = gateway 域（provider 管理面 ∥ v4 模型设置——`gateway/API.md` §2.2）；
  `sandbox_runners` ∥ `sandbox_workspaces` ∥ `sandbox_rules` ∥ `sandbox_pending` ∥ `sandbox_checkpoints` ∥ `sandbox_settings` ∥ **`registry_credentials`** = sandbox 域（v22 后**七表**——其中两表已退场（注见 v11 段）；`sandbox/SANDBOX.md` §2 对象模型单源；`sandbox_tasks` 已退场——v22 段删表）；结构单源 = 本档。

### v12 增段（`sandbox_runners` 表重建——sandbox 域）

（背景：v11 段所列 `sandbox_runners` 列面 = 执行面重定后的**目标形**；v11 实落为旧通道形态（`token_hash` ∥ `labels_json` ∥ `last_heartbeat_at`）——本段一次重建收正，两形态不再并存。重建后列面以 §2 v11 段所列**为准**（本节不重复列举）。）

- **重建步**（SQLite 不可改列集——沿 v10 表重建先例）：① 建 `sandbox_runners_v12`（列面 = v11 段所列：`id` ∥ `name`（NOT NULL UNIQUE） ∥ `address`（NOT NULL） ∥ `status`（NOT NULL DEFAULT `'active'` CHECK `active`/`disabled`） ∥ `runtime_json`（NOT NULL DEFAULT `'{}'`——连通自检读数） ∥ `created_at`（NOT NULL））。
  ⇒ ② **存量行弃**（不迁——旧通道行无地址可取、令牌/心跳语义整废；一次性过渡行为）⇒ ③ `DROP TABLE sandbox_runners` ⇒ ④ `RENAME` ⇒ 无索引/无 FK（沿先例——`sandbox_workspaces.runner_id` 无 FK）。
- **判据（单元测试档）**：空库读数 12 ∥ v11 库升后读数 12 ∥ v12 段幂等（再开零变）∥ 列面五行在场（`pragma_table_info`）∥ 旧三列名不在（`token_hash` ∥ `labels_json` ∥ `last_heartbeat_at`）∥ 存量行弃（含旧行的 v11 库升后 ⇒ 空表）。
- 同段旁注：v11 段所列 `sandbox_workspaces` 列面 = v22 段表重建（去 `required_labels_json`；增 `stop_reason` ∥ `base_image`）；`sandbox_tasks` = v22 段删表（KD-SV-161）。

### v13 增段（`sandbox_onboarding` 建表——sandbox 域；**停机留史（托管接入退场：数据不删 ∥ 零写入零读面）**）

（背景：托管接入任务 + 凭据 = 单表；任务态/步骤读数/凭据密文共一行——**现状 = 停机留史（托管接入退场；历史机制 as-of = `sandbox/SANDBOX.md` §2 停机留史注）。**）

- **建表**（`CREATE TABLE sandbox_onboarding`——列面逐列）：`id`（INTEGER PRIMARY KEY）∥ `host`（TEXT NOT NULL——主机地址原文）∥ `ssh_port`（INTEGER NOT NULL DEFAULT 22）∥ `ssh_user`（TEXT NOT NULL）∥ `auth_kind`（TEXT NOT NULL CHECK `'key'`/`'password'`）∥
  `secret_cipher`（TEXT——AES-256-GCM 包 `iv|tag|ct` base64；零化后 NULL）∥ `sudo_cipher`（TEXT——可选，同形）∥ `credential_mode`（TEXT NOT NULL CHECK `'burn'`/`'keep'`）∥ `credential_state`（TEXT NOT NULL DEFAULT `'sealed'` CHECK `'sealed'`/`'burned'`/`'revoked'`）∥
  `name`（TEXT——节点名（可选；缺省取探测主机名））∥ `model`（TEXT NOT NULL——提交时所选模型）∥ `status`（TEXT NOT NULL CHECK `'running'`/`'succeeded'`/`'failed'`/`'interrupted'`）∥ `step`（TEXT——当前/最后一步 id）∥
  `steps_json`（TEXT NOT NULL DEFAULT `'[]'`——步骤日志（读数面））∥ `runner_id`（INTEGER——成功后关联；未成 NULL）∥ `created_by`（INTEGER——admin 成员 id）∥ `created_at`（TEXT NOT NULL）∥ `finished_at`（TEXT）。
- **加密密钥** = `data/credentials.key`（32 字节；首用生成；0600——**不落库**；如实披露 = `sandbox/SANDBOX.md` §14 KD-SV-84 ∥ 单源 = `thincoder-server/src/store/credential-crypto.mjs`）。
- **判据（单元测试档）**：空库直落 13 ∥ v12 库升后读数 13 ∥ v13 段幂等（再开零变）∥ 列面十八列在场（`pragma_table_info`）∥ 凭据列读写往返（密文 ≠ 明文 ∥ 零化后 NULL）∥ 状态 CHECK 四值放行/越值拒。

### v14 增段（agent chat 两表 + 审计 CHECK 再扩——agent 域）

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
  data_json TEXT,                             -- role 附加形：assistant 的 toolCalls ∥ tool 的 toolCallId/名/`args`（调用参数原文字符串——回读卡参数与活流帧同字）/摘要 ∥ notice 的 reason（五值枚举——重启收尾 "restart" ∥ 预算超限 "budget" ∥ 模型错误 "model_error" ∥ 空回合 "empty_turn" ∥ 手动中止 "aborted"）
  --                                          -- user 行携图 ⇒ imageParts（parts 数组素形；零结构变更）
  --                                          -- user 行 + `data.kind="reminder"`（提醒投递行——timer 到期 ∥ 后台任务结算；零结构变更）
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_chat_messages ON agent_chat_messages(chat_id, seq);

-- ② 审计 CHECK 再扩（十三型——表重建，步序与 v10/v11 同构）
-- + 'agent_event'（管理面 agent 会话——kind：chat_start（会话创建）∥ chat_call（每工具调用）∥ chat_stop（异常收尾：预算超限 ∥ 模型错误 ∥ 空回合 ∥ 重启中断 ∥ 手动中止）；
--   detail = { kind, chatId, tool?, call?, resultCode?, summary?, reason?（chat_stop——五值枚举同 v14 段 `data_json` 注） }——摘要截断 + 秘密掩蔽口径沿任务面）
-- 重建步（建新表（十三型 CHECK） ∥ 拷贝 ∥ DROP ∥ RENAME ∥ 两索引重建——SQL 形同 v10 段，逐字替换型清单）。
```

- 语义/对象模型 = `agent/ADMIN-AGENT.md` §11/§12（单源）；端点 = `gateway/API.md` §2.8；控制台面 = `webui/CHAT.md` §2.1；审计型面 = `accounts/ACCOUNTS.md` §2.1。
- 圈界：`agent_chat_messages.chat_id` 无 FK（沿 `audit_events`/沙盒瞬态表口径）；消息不回写/不归档（不设清零——`agent/ADMIN-AGENT.md` §10）。
- **判据（单元测试档）**：空库直落 14 ∥ v13 库升后读数 14 ∥ v14 段幂等（再开零变）∥ 两表列面在场（`pragma_table_info`）∥ `(chat_id, seq)` 索引在场 ∥ 存量审计行逐值保形 + 两索引在场 ∥ `agent_event` 型可写（CHECK 放行）∥ `role`/`status` CHECK 枚举放行/越值拒。

### v15 增段（`image_sources` 建表——sandbox 域）

（背景：控制台镜像源清单（增/删/改/列 + 常用源预选）——对象模型/机制 = `sandbox/SANDBOX.md` §3；**拉取机器侧零改；消费面 = 显式选源（KD-SV-96）**。）

```sql
-- ① 镜像源表（server 全局清单——非按节点）
CREATE TABLE IF NOT EXISTS image_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                         -- 显示名（≤40 字符——应用层校验）
  address TEXT NOT NULL,                      -- 归一后基址：https://host[:port] ∥ http://host[:port]（无路径/查询）
  created_at TEXT NOT NULL,
  created_by INTEGER,                         -- 建源 admin 成员 id（无 FK——沿先例）
  UNIQUE (name),
  UNIQUE (address)
);
-- ② 无审计 CHECK 变更（三 kind 走 sandbox_event——kind 非枚举；十三型不变）
```

- 语义/机制 = `sandbox/SANDBOX.md` §3（单源）；端点 = `gateway/API.md` §2.5 镜像源七行；审计 kind = `accounts/ACCOUNTS.md` §2.1。
- 圈界：`created_by` 无 FK（沿 `audit_events`/沙盒瞬态表口径）；**清单不镜像远端**（远端态不落库——读时读；KD-SV-79 精神）。
- **判据（单元测试档）**：空库直落 15 ∥ v14 库升后读数 15 ∥ v15 段幂等（再开零变）∥ 列面五列在场（`pragma_table_info`）∥ 重名/重址插入拒（UNIQUE 两枚）∥ 存量表零变。

### v16 增段（`agent_chats.reasoning` 增列——agent 域）

（背景：控制台对话页思考档位选择器——会话级档位（与 `model` 同层）；对象模型/机制 = `agent/ADMIN-AGENT.md` §11.4；**列级 `ALTER`——表不重建**。）

```sql
-- ① 会话档位列（NULL = 未设——默认态；值域 = 该模型核枚举 `reasoningEffortEnum`，应用层校验）
ALTER TABLE agent_chats ADD COLUMN reasoning TEXT;
-- ② 审计 CHECK 零动（三 kind 不扩——档位写 = 会话设置面，沿 KD-SV-108 先例；十三型不变）
```

- 语义/机制 = `agent/ADMIN-AGENT.md` §11.4（单源）；端点 = `gateway/API.md` §2.8（会话设置面 + 会话行形）；控制台面 = `webui/CHAT.md` §2.1⑤。
- 圈界：**零迁移**——存量行保持 NULL（= 未设 = 今日行为逐字同；无回填 ∥ 无改写）；**档位词表不入库**（核单源——列只存该模型枚举内的串）；NULL 与字面 `off` 不等价（缺省 ≠ 原子档位哨兵——`off` = 核件**显示**哨兵，写面不收）。
- **判据（单元测试档）**：空库直落 16 ∥ v15 库升后读数 16 ∥ v16 段幂等（再开零变）∥ `agent_chats` 列面**七列**在场（`pragma_table_info`——`reasoning` 尾插）∥ 存量行 `reasoning IS NULL` 零变 ∥ 存量其余列逐值保形。

### v17 增段（git 源/项目/项目成员三表 + 审计 CHECK 再扩（十四型）——project 域）

（背景：团队项目与权限——源表/仓表（项目 ↔ 仓一对一）/权限三档；对象模型与机制 = `project/PROJECTS.md` §2/§4/§5（单源）；PAT 密文包形 = `credential-crypto.mjs`（KD-SV-119）。）

```sql
-- ① 三表（源 ∥ 项目（仓） ∥ 项目成员）
CREATE TABLE IF NOT EXISTS git_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                    -- 源名（≤40——应用层校验）
  platform TEXT NOT NULL CHECK (platform IN ('gitee','github','gitlab','selfhosted')),
  base_url TEXT,                                -- 自建平台基址（其余平台 NULL——客户端用固定基址）
  scope TEXT,                                   -- 组织/企业/组标识（成员同步用；NULL = 未配置）
  token_cipher TEXT NOT NULL,                   -- PAT 密文（AES-256-GCM `iv|tag|ct`——KD-SV-119；永不回显原文）
  hook_secret_cipher TEXT,                      -- webhook 密钥密文（事件进路——github 专用；按需生成 ⇒ NULL 缺省；生成时一次性明示 ∥ 读面恒掩码——`project/PROJECTS.md` §13）
  enabled INTEGER NOT NULL DEFAULT 1,           -- 启用/停用（停用 ⇒ 定时停、已挂项目保留——需求 44⑤）
  sync_mode TEXT NOT NULL DEFAULT 'poll' CHECK (sync_mode IN ('poll','event')),
  interval_minutes INTEGER NOT NULL DEFAULT 60, -- 定时拉取间隔（5–1440——应用层校验）
  last_sync_at TEXT,                            -- 上次同步尝试时刻（成败同记——需求 44⑤「上次同步时间 + 结果」）
  last_sync_result_json TEXT NOT NULL DEFAULT '{}',
  token_state TEXT NOT NULL DEFAULT 'unknown' CHECK (token_state IN ('unknown','ok','invalid')),
  token_checked_at TEXT,
  created_by INTEGER,                           -- 无 FK——沿先例
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,                            -- 所属源（手输仓 ⇒ NULL）；无 FK——删源防护走应用层（KD-SV-122）
  address TEXT NOT NULL UNIQUE,                 -- git 地址（跨形归一后 = 记账键——规范形 `host[:port]/path`；归一口径 = `project/PROJECTS.md` §5）
  display_name TEXT NOT NULL,                   -- 显示名（负责人可改——需求 44②）
  owner_username TEXT,                          -- 负责人（统一用户名键；NULL = 未指派；admin 指派）
  created_by INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE,        -- 统一用户名键（大小写不敏感唯一——KD-SV-116）
  level TEXT NOT NULL CHECK (level IN ('read','readwrite','manage')),
  origin TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','sync')),
  synced_role TEXT,                             -- 平台角色原文（sync 行携带——展示用；manual 行 NULL）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (project_id, username)
);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(username);
CREATE INDEX IF NOT EXISTS idx_projects_source ON projects(source_id);

-- ② 审计 CHECK 再扩（十四型：+ 'project_event'——表重建，步序与 v10/v11/v14 同构）
--    kind 枚举（十一 kind）：source_add ∥ source_update ∥ source_delete ∥ source_sync ∥ source_check ∥ project_add ∥ project_update ∥
--    project_delete ∥ member_add ∥ member_update ∥ member_remove（kind 非 CHECK 枚举——逐 kind 归 accounts/ACCOUNTS.md §2.1）
```

- 语义/机制 = `project/PROJECTS.md` §2/§4/§5（单源）；端点 = `gateway/API.md` §2.9；控制台面 = `webui/PROJECTS.md` §2。
- 圈界：`projects.source_id` 无 FK（删除防护 = 应用层 400——KD-SV-122）；成员行不要求本地账号存在（KD-SV-116）；项目删除 = 应用层级联（`project_members` 同事务随删——`project/PROJECTS.md` §14）；`token_cipher` ∥ `hook_secret_cipher` 同键文件（`data/credentials.key`）不同密钥（每源独立随机——KD-SV-84/119）。
- **判据（单元测试档）**：空库直落 17 ∥ v16 库升后读数 17 ∥ v17 段幂等（再开零变）∥ 三表列面（含 `git_sources.hook_secret_cipher`）/三索引在场（`pragma_table_info` + `sqlite_master`）∥ 存量审计行逐值保形 + 两索引在场 ∥ `project_event` 型可写（CHECK 放行）。

### v18 增段（主机表七列 + `sandbox_onboarding` 凭据态四值（`'moved'`）+ 回填移交——sandbox 域）

（背景：主机表 = `sandbox_runners` 扩展——行 = 一台主机（名 ∥ Docker API 地址 ∥ SSH 凭据随行）；托管接入 `keep` 且成功 ⇒ 凭据移交该主机行。机制全文 = `sandbox/SANDBOX.md` §3 主机凭据块（单源） ∥ §14 KD-SV-133/134/135。）

```sql
-- ① 主机表增七列（列级 ALTER = 表不重建——KD-SV-133）
ALTER TABLE sandbox_runners ADD COLUMN ssh_port INTEGER;                              -- SSH 端口（NULL = 未设——写面缺省 22）
ALTER TABLE sandbox_runners ADD COLUMN ssh_user TEXT;                                 -- SSH 用户名（NULL = 未设）
ALTER TABLE sandbox_runners ADD COLUMN auth_kind TEXT;                                -- `key` ∥ `password`（NULL = 未设；应用层校验）
ALTER TABLE sandbox_runners ADD COLUMN secret_cipher TEXT;                            -- 凭据密文（AES-256-GCM `iv|tag|ct`——KD-SV-84 同件；NULL = 无凭据）
ALTER TABLE sandbox_runners ADD COLUMN sudo_cipher TEXT;                              -- sudo 口令密文（同形；NULL = 未设）
ALTER TABLE sandbox_runners ADD COLUMN credential_state TEXT NOT NULL DEFAULT 'none'; -- `none` ∥ `sealed` ∥ `revoked`（应用层校验）
ALTER TABLE sandbox_runners ADD COLUMN credential_updated_at TEXT;                    -- 最近设/撤时刻（NULL = 未设）

-- ② `sandbox_onboarding.credential_state` CHECK 四态（+ `'moved'`——SQLite 不可改 CHECK ⇒ 表重建，步序与 v10/v12 同构）
--    重建后列面 = v13 段所列（十八列——本段不重复列举）；唯一差 = `credential_state` CHECK 四值（`'sealed'` ∥ `'burned'` ∥ `'revoked'` ∥ `'moved'`）
-- ③ 回填移交（存量 `keep` ∧ 成功行 ⇒ 密文移入主机行 + run 行密列零化 + `'moved'`；`keep` ∧ 未成功 ⇒ 不动）
```

- **语义/机制 = `sandbox/SANDBOX.md` §3 主机凭据块（单源）**——列面/行形（`ssh` 元数据） ∥ 密列零回显（响应 ∥ 日志 ∥ 审计 ∥ 帧四面零秘密字段） ∥ 端点 = `gateway/API.md` §2.5 ∥ 审计两 kind = `accounts/ACCOUNTS.md` §2.1。
- **回填口径**：存量 `keep` ∧ 成功行（`runner_id` 在场）按 `id` 序移交——**同 runner 多行 ⇒ 后者胜**；`keep` ∧ 未成功 ⇒ 留 run 行（密文不动）；既有 `sandbox_runners` 行新列 = NULL ∥ `'none'`（零伪造回填）。
- **圈界**：加解密 = 既有凭据三件同件（**不与 run 行并存两份**——实施轮以当刻盘面实读为准）；`sandbox_runners` 既有列 ∥ 索引 ∥ 引用面零动。
- **判据（单元测试档）**：空库直落 **18** ∥ v17 库升后读数 **18** ∥ v18 段幂等（再开零变）∥ 七列在场（`pragma_table_info('sandbox_runners')`）∥ `credential_state` 四值放行/越值拒 ∥ 回填三用例（成功行 ⇒ 移交 ∥ 同 runner 多行 ⇒ 后者胜 ∥ 失败行 ⇒ 零变）∥ 存量 `sandbox_onboarding` 行逐值保形（拷贝前后全等）。

### v19 增段（`api_keys.key_plain` 列——管理面 sk 明文面）

（背景：管理面 chat 的模型出口经本 server 网关链回环——每回合需真凭据（sk 明文）送验；凭据归属/吊销/轮转全沿 key 面（`accounts/ACCOUNTS.md` §1）。机制 = `agent/ADMIN-AGENT.md` §16.3。）

```sql
ALTER TABLE api_keys ADD COLUMN key_plain TEXT;
```

- **语义**：NULL = 常规 key（服务端不留明文——既有行为不变）∥ 非空 = **服务端自持面**（当前唯一写面 = `issueKey({ keepPlain: true })`——管理面 sk `admin-agent`）。
- **单源**：`thincoder-server/src/accounts/keys.mjs`（列写入点 = `issueKey`；读取 = `agentKeyOf`）。
- **旁证先例**：沙盒工作区 `key_plain`（服务端即消费方——披露类不升级）。

- **判据（单元测试档）**：空库直落 **19** ∥ v18 库升后读数 **19** ∥ v19 段幂等（再开零变）∥ `api_keys` 列面含 `key_plain`（`pragma_table_info`——尾插）∥ 存量行 `key_plain IS NULL` 零变 ∥ 其余列逐值保形。

### v20 增段（团队台账表 + 审计 CHECK 再扩（十五型）——ledger 域）

（背景：团队共享一本工作台账——**全局编号** ∥ **键 = git 源**（归一地址） ∥ **全局一本**（数据层无分本）；机制全文 = `ledger/LEDGER.md`（单源）。）

```sql
-- ① 团队台账表（单表——全局编号；仓 = 归一地址（`projects.address` 同形）；六态枚举沿本机台账）
CREATE TABLE IF NOT EXISTS team_ledger_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT, -- 全局编号（全队一号空间——跨本引用可解析）
  repo       TEXT NOT NULL,                     -- 仓标记（归一形 `host[:port]/path`；非 FK——项目删除不级联，KD-SV-147）
  status     TEXT NOT NULL CHECK(status IN ('待讨论','待设计','在途','待核销','已核销','已废弃')),
  title      TEXT NOT NULL,                     -- 标题（≤200——应用层校验）
   detail     TEXT,                              -- 正文/说明（≤4000；追认核销须非空）
  owner      TEXT NOT NULL,                     -- 负责人（统一用户名键——不要求现存账号）
  created_by TEXT NOT NULL,                     -- 写入者（用户名）
  created_at TEXT NOT NULL,
  updated_at TEXT,                              -- 老化行龄源 = updated_at ?? created_at（未决态 ∧ >30 天 ⇒ aged）
  closed_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_team_ledger_repo_status ON team_ledger_items(repo, status);
CREATE INDEX IF NOT EXISTS idx_team_ledger_owner ON team_ledger_items(owner);

-- ② 审计 CHECK 再扩（十五型：+ 'ledger_event'——表重建，步序与 v10/v11/v14/v17 同构）
--    kind 枚举（四 kind）：create ∥ edit ∥ close ∥ withdraw（kind 非 CHECK 枚举——逐 kind 归 accounts/ACCOUNTS.md §2.1）
```

- 语义/机制 = `ledger/LEDGER.md` §3/§4（单源）；端点 = `gateway/API.md` §2.10；控制台面 = `webui/LEDGER.md` §2；端侧面 = `docs/core/design/TEAM-LEDGER.md` §2。
- 圈界：无 FK（沿先例）；`repo` 非唯一（同仓 N 条）；`status` CHECK 六态（迁移表判在应用层——`ALLOWED_MIGRATIONS` 沿本机台账枚举）；归档 = 状态值（软删除——行保留）。
- **判据（单元测试档）**：空库直落 **20** ∥ v19 库升后读数 **20** ∥ v20 段幂等（再开零变）∥ 表/两索引在场（`pragma_table_info` + `sqlite_master`）∥ 存量审计行逐值保形 + 两索引在场 ∥ `ledger_event` 型可写（CHECK 放行）。

### v21 增段（`git_sources.scope_kind` 列 + 存量回填——project 域）

```sql
-- ① gitee 范围类型（personal ∥ org ∥ enterprise——KD-SV-151；非 gitee/NULL = 不适用）
ALTER TABLE git_sources ADD COLUMN scope_kind TEXT CHECK (scope_kind IN ('personal','org','enterprise'));
-- ② 存量回填（仅 gitee——零猜测：scope 在场 ⇒ 'org'（沿现行路由）∥ scope 空 ⇒ 'personal'；非 gitee 零动）
UPDATE git_sources SET scope_kind = CASE WHEN scope IS NULL OR TRIM(scope) = '' THEN 'personal' ELSE 'org' END WHERE platform = 'gitee';
```

- 语义/机制 = `project/PROJECTS.md` §4（KD-SV-151——三态 ∥ 路由 ∥ 不符报错）；旧企业行（如 id=2）= 回填后 `org`——编辑窗改选「企业」保存即工作（迁移零猜测；端形 = `gateway/API.md` §2.9）。
- 圈界：列级 `ALTER`（表不重建）；CHECK 三值（NULL 放行——非 gitee 恒 NULL）；非 gitee 行零动（回填体 `WHERE platform = 'gitee'`）；审计 CHECK 零动（十五型不变）。
- **判据（单元测试档）**：空库直落 **21** ∥ v20 库升后读数 **21** ∥ v21 段幂等（再开零变）∥ 列面含 `scope_kind`（`pragma_table_info`——尾插）∥ 回填三用例（gitee ∧ scope 在场 ⇒ `org` ∥ gitee ∧ scope 空 ⇒ `personal` ∥ 非 gitee ⇒ NULL/零动）∥ 存量行余列逐值保形。

### v22 收正段（`sandbox_workspaces` 表重建 + `registry_credentials` 建表 + `sandbox_tasks` 删表——sandbox 域）

```sql
-- ① sandbox_workspaces 表重建（列面 = v11 段所列减 required_labels_json + 增 stop_reason + 增 base_image——放置判据去标签；停因注记；底座绑定）
CREATE TABLE IF NOT EXISTS sandbox_workspaces_v22 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  owner_member_id INTEGER NOT NULL REFERENCES members(id),
  key_id INTEGER NOT NULL REFERENCES api_keys(id),
  key_plain TEXT NOT NULL,
  runner_id INTEGER,
  limits_json TEXT NOT NULL DEFAULT '{}',
  stop_reason TEXT,                            -- 停因注记（idle_ttl/wallclock_ttl/manual；NULL = 未停）
  base_image TEXT,                             -- 底座绑定（归一引用「名:标签」；NULL = 标准镜像 settings.image——底座可换）
  created_at TEXT NOT NULL
);
-- ② 存量行拷贝（逐列映射）⇒ DROP TABLE sandbox_workspaces ⇒ RENAME ⇒ （无索引/无 FK 重建）
-- ③ DROP TABLE sandbox_tasks（指令队列退场——KD-SV-161）
-- ④ 私有仓凭据表（sandbox 域——server 全局；底座可换：拉取/派生注入——KD-SV-188）
CREATE TABLE IF NOT EXISTS registry_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host TEXT NOT NULL UNIQUE,                   -- 注册表主机（归一：小写；Hub 别名归 docker.io）
  username TEXT NOT NULL,
  secret_cipher TEXT NOT NULL,                 -- AES-256-GCM（credential-crypto.mjs；密列零回显）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,                    -- 最后编辑时间（创建 = 创建时刻；编辑刷新——写面维护）
  created_by INTEGER
);
-- ⑤ sandbox_runners 增连接材料四列（TLS 档；列级 ALTER = 表不重建；存量行 NULL = 明文档零回填；机制 = `sandbox/SANDBOX.md` §3 连接方式块）
ALTER TABLE sandbox_runners ADD COLUMN tls_ca TEXT;                                    -- CA 证书 PEM（仅 TLS 档）
ALTER TABLE sandbox_runners ADD COLUMN tls_cert TEXT;                                  -- 客户端证书 PEM（仅 TLS 档）
ALTER TABLE sandbox_runners ADD COLUMN tls_key_cipher TEXT;                            -- 客户端私钥密文（AES-256-GCM——密列零回显；仅 TLS 档）
ALTER TABLE sandbox_runners ADD COLUMN tls_updated_at TEXT;                            -- 材料更新时间（NULL = 未设）
```

- 语义/机制 = `sandbox/EXECUTION.md` §3/§8/§9（KD-SV-161/162/184/188——直调链替换队列；`stop_reason` 写入点 = 服务器侧停盒动作；`base_image` 写入点 = 工作区 PATCH（`baseImage` 键）；`registry_credentials` 写入点 = 凭据四端点）；**`tls_*` 四列 = 列级 `ALTER`**（存量行 NULL——零回填；不变量 `https` ⇔ 三件齐 = 应用层校验——`sandbox/SANDBOX.md` §3）。
- 圈界：表重建（SQLite 不可改列集——沿 v12 表重建先例）；`required_labels_json` 列消（放置 = 在线 active 最少绑定者——EXECUTION §3）；`stop_reason`/`base_image` NULL 放行；无索引/无 FK（沿先例）；删表 = 队列退场（无消费者——瞬时态零迁移价值）；`registry_credentials` 新表：`host` 唯一（一主机一枚——`UNIQUE` 自携索引）；`created_by` 无 FK（沿先例）。
- **判据（单元测试档）**：空库直落 **22** ∥ v21 库升后读数 **22** ∥ v22 段幂等（再开零变）∥ **`sandbox_workspaces` 列面十行在场**（`pragma_table_info`——含 `stop_reason` ∥ `base_image`；不含 `required_labels_json`）∥
  `registry_credentials` 表在场且列面**七行**（含 `updated_at`） + `host` 唯一（`sqlite_master` ∥ 重复 host 插入 ⇒ 拒）∥ `sandbox_tasks` 表不在（`sqlite_master`）∥ **`sandbox_runners` 连接材料四列在场**（`pragma_table_info`——含 `tls_key_cipher`；存量行 NULL）∥ 存量行逐值保形（拷贝映射——`base_image` 全 NULL）。

### v23 增段（成员 git 凭据表 + 审计 CHECK 再扩（十六型）——agent 域）

```sql
-- ① 成员 git 凭据表（成员本人凭据——拉取/推送共用；KD-SV-204；密列零回显）
CREATE TABLE IF NOT EXISTS member_git_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,                  -- 归属（本人过滤键）
  host TEXT NOT NULL,                          -- 托管主机（归一：小写）
  username TEXT NOT NULL,
  secret_cipher TEXT NOT NULL,                 -- AES-256-GCM（credential-crypto.mjs；密列零回显）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_git_credentials ON member_git_credentials(member_id, host);
-- ② audit_events 表重建（十六型：+ member_event——步序与 v10/v11/v14/v17/v20 同构）
```

- 语义/机制 = `agent/MEMBER-AGENT.md` §3.6/§2 KD-SV-204（成员本人凭据——绑定一次复用 ∥ 经盒按次 ∥ 用毕即清）；端点 = `gateway/API.md` §2.11。
- 圈界：无 FK（沿先例）；`(member_id, host)` 唯一（UNIQUE 自携索引）；`secret_cipher` 单密列（读写单点）；**会话两表不建**（题一裁定——服务器零会话落库）；审计 CHECK 扩型 = 十六型（重建同构——CHECK **kind 非枚举**：`member_event` 六 kind = `chat_start` ∥ `chat_call` ∥ `chat_stop` ∥ `pull` ∥ `credential_set` ∥ `credential_revoke`）。
- **判据（单元测试档）**：空库直落 **23** ∥ v22 库升后读数 **23** ∥ v23 段幂等（再开零变）∥ `member_git_credentials` 列面七行在场（`pragma_table_info`）+ `(member_id, host)` 唯一（重复插入 ⇒ 拒）∥ 存量审计行逐值保形 + 两索引在场 ∥ `member_event` 型可写（CHECK 放行）∥ **`member_sessions` 表不在**（`sqlite_master`——题一判据）。

### v24 增段（`mcp_servers` 建表 + 审计 CHECK 再扩（十七型）——mcp 域）

```sql
-- ① MCP 服务器清单表（server 全局单份——非逐用户；KD-SV-197）
CREATE TABLE IF NOT EXISTS mcp_servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                   -- 服务器名（工具前缀源——核 `{server}_{tool}`）
  transport TEXT NOT NULL CHECK (transport IN ('stdio','http','ws')),
  command TEXT,                                -- stdio：可执行（明文）
  args_json TEXT,                              -- stdio：参数数组（JSON string[]；明文——可含秘密，指引 = 设计档）
  url TEXT,                                    -- http：端点
  ws_url TEXT,                                 -- ws：端点
  secret_cipher TEXT,                          -- AES-256-GCM（credential-crypto.mjs；{ token?, headers?, env? } 合一；NULL = 零敏感字段；密列零回显）
  enabled INTEGER NOT NULL DEFAULT 1,          -- 启用位（0/1——沿 providers.proxy 先例）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- ② audit_events 表重建（十七型：+ 'mcp_event'——步序与 v10/v11/v14/v17/v20/v23 同构）
--    kind 枚举（三 kind）：server_add ∥ server_update ∥ server_remove（kind 非 CHECK 枚举——逐 kind 归 accounts/ACCOUNTS.md §2.1）
```

- 语义/机制 = `mcp/MCP.md` §3（KD-SV-197/198——清单形/凭据形）；端点 = `gateway/API.md` §2.13；控制台面 = `webui/MCP.md` §2。
- 圈界：无 FK（沿先例）；`name` 唯一（UNIQUE 自携索引——工具前缀须稳定可辨）；`transport` CHECK 三值；三传输列互斥 = 应用层校验（列 NULL 放行）；`secret_cipher` 单密列（三敏感面合一——读写单点）；审计 CHECK 扩型 = 十七型（重建同构）。
- **判据（单元测试档）**：空库直落 **24** ∥ v23 库升后读数 **24** ∥ v24 段幂等（再开零变）∥ `mcp_servers` 列面十一行在场（`pragma_table_info`）∥ `name` 唯一（重复插入 ⇒ 拒）∥ `transport` 枚举逐值（表外 ⇒ 拒）∥ 存量审计行逐值保形 + 两索引在场 ∥ `mcp_event` 型可写（CHECK 放行）。

### v25 增段（`agent_chats.auto_approve` 增列——agent 域）

```sql
-- 审批卡面 `always` 槽（KD-SV-226——admin-approval-cards 批 ∥ 用户 2026-10-17 裁「必须上审批卡」）；
-- 列级 ALTER = 表不重建；0 = 缺省（问）∥ 1 = 免问（`always` 置真 ∥ PATCH 可清）；语义 = agent/ADMIN-AGENT.md §11.5。
ALTER TABLE agent_chats ADD COLUMN auto_approve INTEGER NOT NULL DEFAULT 0;
```

- 语义/机制 = `agent/ADMIN-AGENT.md` §11.5（写类门挡 ∥ `always` ⇒ 置真 ∥ `PATCH …/:id { autoApprove }` 人工清/置径）；端点 = `gateway/API.md` §2.8；控制台面 = `webui/CHAT.md` §2.1。
- 圈界：整型 0/1（沿 `providers.proxy`/`mcp_servers.enabled` 先例——无布尔列）；存量行即刻得 `0`（= 问——与列前行为读侧等价）；零 CHECK 重建（不触碰审计表）。
- **判据（单元测试档）**：空库直落 **25** ∥ v24 库升后读数 **25** ∥ v25 段幂等（再开零变）∥ 列面含 `auto_approve`（`pragma_table_info('agent_chats')`）∥ 存量行 `0` 零变 ∥ 置真/清往返逐值（1 ⇒ 0）。

## 3. 迁移链（`user_version` 逐版升）

- `thincoder-server/src/store/db.mjs`（已落盘）持 `MIGRATIONS` 数组——每段 = `{ v, up(db) }`（v = 目标 `user_version`，自 1 起递增；v1 = 基线段 = §2 全量 DDL）。
- 开库序：读 `user_version` ⇒ 顺序执行 `v > 当前` 的段（每段单事务；成功 ⇒ `PRAGMA user_version = v`；抛错 ⇒ 进程非零退出——fail-closed）。
- 结构每变一次 = 追一段（+1）——空库 ∥ 旧库启动自动升，零手工脚本（断点列 = `EVOLUTION.md` §1-G2）。
- v2 = provider 增段（`providers` 表——控制台 provider 管理；旧库（v1）启动自动升 ∥ 空库直落 v2）。
- v3 = 审计增段（`audit_events` 表 + 三索引——`accounts/ACCOUNTS.md` §2.1 ∥ key 明细索引）；旧库（v1/v2）启动自动升 ∥ 空库直落 v3；判据（单元测试档）= 空库结构版本读数 3 ∥ v2 库升后读数 3 ∥ 迁移链幂等（再开零变）。
- v4 = 模型设置增列（`providers.settings_json`——服务模型配置面）：**列级 ALTER = 表不重建**（SQLite `ADD COLUMN` 常量默认——存量行即刻得 `'{}'`）；旧库（v1–v3）启动自动升 ∥ 空库直落 v4；判据（单元测试档）= 空库读数 4 ∥ v3 库升后读数 4 ∥ v4 段幂等（再开零变）。
- **零结构变更**（保留窗清理 = 删除式 ∥ 登录防护计数 = 进程内存——均无新表；结构版本不变）。
- v5 = 两字段拆列 + 派生两表 + 成员配额列（需求 §2:21 ∥ §2:22）：五步见 §2 v5 段（拆列 ∥ 建 `usage_daily`/`quota_counters` ∥ 成员列增删 ∥ 期初回填）。
  判据（单元测试档）= 空库读数 5 ∥ v4 库升后读数 5 ∥ v5 段幂等（再开零变）∥ 拆列抽样逐值（含 `model` 带斜杠 ∥ 嵌入行 `provider = ''`）∥ 回填两表逐值 = usage 重算 ∥ 旧列不在 `pragma_table_info('members')`；耗时（一次性 @500k 行——同构探针实读）= 日表回填 ≈1.2s ∥ 计数回填 ≈3.4s（合计 ≈5s 级）。
- v6 = 成员模型禁用列（`members.model_disabled_json`）：**列级 ALTER = 表不重建**（存量行即刻得 `'{}'`——默认全可用）；旧库（v1–v5）启动自动升 ∥ 空库直落 v6；判据（单元测试档）= 空库读数 6 ∥ v5 库升后读数 6 ∥ v6 段幂等（再开零变）∥ 新列常量默认在场（`pragma_table_info('members')` 含列）。
- v7 = provider 模型元数据留存列（`providers.model_meta_json`）：**列级 ALTER = 表不重建**（存量行即刻得 `'{}'`——未存 = 无元数据）；旧库（v1–v6）启动自动升 ∥ 空库直落 v7；判据（单元测试档）= 空库读数 7 ∥ v6 库升后读数 7 ∥ v7 段幂等（再开零变）∥ 新列常量默认在场（`pragma_table_info('providers')` 含列）。
- v8 = key 名称列（`api_keys.name`）：**列级 ALTER = 表不重建**（存量行即刻得 `''` ⇒ 随段回填默认名 `key-N`——按成员签发序）；旧库（v1–v7）启动自动升 ∥ 空库直落 v8；判据（单元测试档）= 空库读数 8 ∥ v7 库升后读数 8 ∥ v8 段幂等（再开零变）∥ 新列在场（`pragma_table_info('api_keys')` 含 `name`）∥ 存量回填抽查（多 key 成员：行名 = `key-1..key-N` 按 id 序 ∥ 空串零残留）。
- v9 = provider 上游代理旗（`providers.proxy`）：**列级 ALTER = 表不重建**（存量行即刻得 `0`——缺省直连）；旧库（v1–v8）启动自动升 ∥ 空库直落 v9；判据（单元测试档）= 空库读数 9 ∥ v8 库升后读数 9 ∥ v9 段幂等（再开零变）∥ 新列在场（`pragma_table_info('providers')` 含 `proxy`）∥ 存量默认值抽查（迁移后旧行 `proxy = 0`——直连缺省）。
- v10 = 审计事件型扩（`audit_events` CHECK 扩十型）：**表重建**（SQLite 不可改 CHECK——建新表 ∥ 拷贝 ∥ 换名 ∥ 索引重建）；旧库（v1–v9）启动自动升 ∥ 空库直落 v10；判据（单元测试档）= 空库读数 10 ∥ v9 库升后读数 10 ∥ v10 段幂等（再开零变）∥ 存量行逐值保形（id/时刻/型/详情——拷贝前后全等）∥ 两索引在场 ∥ `config_update` 型可写（CHECK 放行）∥ `sqlite_sequence` 连续（新事件 id 不撞存量）。
- **零结构变更**（别名 = `models_json` 元素升级——JSON 文本内演进；无新列/新表/新段——结构版本保持 **10**；旧行字符串天然兼容）；判据（单元测试档）= 迁移链读数仍 10 ∥ 别名增删往返不改库结构（`pragma_table_info('providers')` 零变）。
- v11 = 沙盒七表 + 审计 CHECK 再扩（十二型）+ `sandbox_rules` 种子（八行）：七表 CREATE（见 §2 v11 段）+ 种子写入（`source='default'`——一次性；可改可删不复活）+ `audit_events` 表重建（十二型：+ `sandbox_rule` ∥ `sandbox_event`——步序与 v10 同构）；
  旧库（v1–v10）启动自动升 ∥ 空库直落 v11；判据（单元测试档）= 空库读数 11 ∥ v10 库升后读数 11 ∥ v11 段幂等（再开零变） ∥ 七表在场（`pragma_table_info`） ∥ 存量审计行逐值保形 + 两索引在场 ∥ 两新型可写（CHECK 放行） ∥ 种子八行在场（`source='default'`——deny 三 + allow 五） ∥ 覆写列在场（`sandbox_workspaces.limits_json` 默认 `'{}'`）。
- v12 = `sandbox_runners` 表重建（旧通道形态 ⇒ Docker 节点形态）：**表重建**（建新表 ∥ 存量行弃 ∥ DROP ∥ RENAME——见 §2 v12 段）；旧库（v1–v11）启动自动升 ∥ 空库直落 v12；判据（单元测试档）= 空库读数 12 ∥ v11 库升后读数 12 ∥ v12 段幂等（再开零变）∥ 列面五行在场 ∥ 旧三列名不在 ∥ 存量行弃（含旧行 ⇒ 空表）∥ `sandbox_workspaces.runner_id` 引用面零变。
- v13 = `sandbox_onboarding` 建表（托管接入任务 + 凭据）：**加表**（零重建——见 §2 v13 段）；旧库（v1–v12）启动自动升 ∥ 空库直落 v13；判据（单元测试档）= 空库读数 13 ∥ v12 库升后读数 13 ∥ v13 段幂等（再开零变）∥ 列面十八列在场 ∥ 凭据读写往返（密文 ≠ 明文 ∥ 零化后 NULL）∥ 存量表零变。
- v14 = agent chat 两表 + 审计 CHECK 再扩（十三型）：**加两表 + 表重建**（SQLite 不可改 CHECK——步序与 v10/v11 同构；见 §2 v14 段）；旧库（v1–v13）启动自动升 ∥ 空库直落 v14；判据（单元测试档）= 空库读数 14 ∥ v13 库升后读数 14 ∥ v14 段幂等（再开零变）∥ 两表列面在场 + `(chat_id, seq)` 索引在场 ∥ 存量审计行逐值保形 + 两索引在场 ∥ `agent_event` 型可写。
- v15 = `image_sources` 建表（镜像源清单）：**加表**（零重建——见 §2 v15 段）；旧库（v1–v14）启动自动升 ∥ 空库直落 v15；判据（单元测试档）= 空库读数 15 ∥ v14 库升后读数 15 ∥ v15 段幂等（再开零变）∥ 列面五列在场 ∥ 重名/重址插入拒（UNIQUE 两枚）∥ 存量表零变。
- v16 = `agent_chats.reasoning` 增列（会话级思考档位）：**加列**（`ALTER TABLE … ADD COLUMN`——表不重建；见 §2 v16 段）；旧库（v1–v15）启动自动升 ∥ 空库直落 v16；判据（单元测试档）= 空库读数 16 ∥ v15 库升后读数 16 ∥ v16 段幂等（再开零变）∥ 列面**七列**在场 ∥ 存量行 NULL 零变。
- v17 = git 源/项目/项目成员三表 + 审计 CHECK 再扩（十四型）：**加三表 + 表重建**（SQLite 不可改 CHECK——步序与 v10/v11/v14 同构；见 §2 v17 段）；旧库（v1–v16）启动自动升 ∥ 空库直落 v17；判据（单元测试档）= 空库读数 17 ∥ v16 库升后读数 17 ∥ v17 段幂等（再开零变）∥ 三表列面（含 `hook_secret_cipher`）与索引在场 ∥ 存量审计行逐值保形 ∥ `project_event` 型可写。
- v18 = 主机表七列 + `sandbox_onboarding` 凭据态四值（`'moved'`）+ 回填移交：**加列 + 表重建**（列级 `ALTER`——表不重建；CHECK 重建步序与 v10/v12 同构；见 §2 v18 段）；旧库（v1–v17）启动自动升 ∥ 空库直落 v18；

- v19 = `api_keys.key_plain` 增列（管理面 sk 明文面）：**加列**（`ALTER TABLE … ADD COLUMN`——表不重建；见 §2 v19 段）；旧库（v1–v18）启动自动升 ∥ 空库直落 v19；
    判据（单元测试档）= 空库读数 19 ∥ v18 库升后读数 19 ∥ v19 段幂等（再开零变）∥ 列面含 `key_plain` ∥ 存量行 NULL 零变。
- v20 = 团队台账表 + 审计 CHECK 重建（十五型）：**建表 + 两索引 + 表重建（审计 CHECK 扩型——同上四段同构）**（见 §2 v20 段）；旧库（v1–v19）启动自动升 ∥ 空库直落 v20；
    判据（单元测试档）= 空库读数 20 ∥ v19 库升后读数 20 ∥ v20 段幂等（再开零变）∥ 表/两索引在场 ∥ 存量审计行逐值保形 ∥ `ledger_event` 型可写。
- v21 = `git_sources.scope_kind` 增列 + 存量回填（gitee 范围三态）：**加列 + 回填**（`ALTER TABLE … ADD COLUMN` + 同段 `UPDATE`——表不重建；见 §2 v21 段）；旧库（v1–v20）启动自动升 ∥ 空库直落 v21；
    判据（单元测试档）= 空库读数 21 ∥ v20 库升后读数 21 ∥ v21 段幂等（再开零变）∥ 列面含 `scope_kind` ∥ 回填三用例（gitee 在场 ⇒ `org` ∥ gitee 空 ⇒ `personal` ∥ 非 gitee 零动）。
  - v22 = 沙盒两表收正（`sandbox_workspaces` 表重建 + `registry_credentials` 建表 + `sandbox_tasks` 删表 + `sandbox_runners` 连接材料四列）：**表重建 + 建表 + 删表 + 列级 ALTER**（步序与 v10/v12 同构；见 §2 v22 段）；旧库（v1–v21）启动自动升 ∥ 空库直落 v22；
      判据（单元测试档）= 空库读数 22 ∥ v21 库升后读数 22 ∥ v22 段幂等（再开零变）∥ `sandbox_workspaces` 列面十行（含 `stop_reason` ∥ `base_image`；不含 `required_labels_json`）∥ `registry_credentials` 在场 + `host` 唯一 ∥ `sandbox_tasks` 表不在 ∥ `sandbox_runners` 连接材料四列在场（存量行 NULL）∥ 存量行逐值保形。
- v23 = 成员 git 凭据表 + 审计 CHECK 再扩（十六型）：**加表 + 表重建**（步序与 v10/v11/v14/v17/v20 同构；见 §2 v23 段；**会话两表不建**——题一裁定）；旧库（v1–v22）启动自动升 ∥ 空库直落 v23；
     判据（单元测试档）= 空库读数 23 ∥ v22 库升后读数 23 ∥ v23 段幂等（再开零变）∥ 凭据表列面七行与 `(member_id, host)` 唯一在场 ∥ `member_sessions` 表不在 ∥ 存量审计行逐值保形 ∥ `member_event` 型可写。
- v24 = `mcp_servers` 建表 + 审计 CHECK 重建（十七型）：**加表 + 表重建**（步序与 v10/v11/v14/v17/v20/v23 同构；见 §2 v24 段）；旧库（v1–v23）启动自动升 ∥ 空库直落 v24；
    判据（单元测试档）= 空库读数 24 ∥ v23 库升后读数 24 ∥ v24 段幂等（再开零变）∥ 表列面十一行 + `name` 唯一 + `transport` CHECK ∥ 存量审计行逐值保形 ∥ `mcp_event` 型可写。
- v25 = `agent_chats.auto_approve` 增列（审批卡面 `always` 槽）：**加列**（`ALTER TABLE … ADD COLUMN`——表不重建；见 §2 v25 段）；旧库（v1–v24）启动自动升 ∥ 空库直落 v25；
    判据（单元测试档）= 空库读数 25 ∥ v24 库升后读数 25 ∥ v25 段幂等（再开零变）∥ 列面 **8 列**在场 ∥ 存量行 `0` 零变。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/store/db.mjs`（已落盘） | 实读 **37**（迁移段已外拆）；DDL/迁移链 = `migrations.mjs` 实读 **795** ⇒ ≈**804**（本批 +v25 段 ≈+9——**越 800 硬限** ⇒ 先拆后落：拆案 = DDL 段常量外拆 `migrations-ddl.mjs`（纯数据搬迁零语义）∥ 或 v25 段压缩 ≤5 行；触发 = 实读 >800） | 开库 ∥ PRAGMA ∥ 语句封装（DDL/迁移链 = `migrations.mjs`） |
| `thincoder-server/src/store/credential-crypto.mjs`（已落——KD-SV-119） | ≈65（设计估——凭据三件（`loadOrCreateCredentialKey` ∥ `encryptSecret` ∥ `decryptSecret`）自 `thincoder-server/src/sandbox/onboarding.mjs` 逐字抽出 + **键路径派生 `credentialKeyPath(config)` 同件收口**（单一出处——两域同址；消第二份路径规则）——sandbox ∥ project 两域共享） | 凭据加解密（AES-256-GCM + `data/credentials.key`——首用生成 ∥ 0600 ∥ 不落库） |

## 5. 关键决策（本域）

| # | 决策 | 理由 |
|---|---|---|
| KD-SV-3 | **存储 = `node:sqlite`（`DatabaseSync`）**——WAL ∥ `user_version` 结构版本 | 需求候选 + 仓内先例（核 `thincoder-core/ledger-db.mjs:18` 同技术）；零依赖 ∥ 单文件 ∥ SQL 聚合天然贴合看板/配额 |
| KD-SV-40 | **v5 迁移 = 模型标识两字段（`provider` ∥ `model`）+ 派生两表 + 旧列删除**：拆列判据 = `endpoint = 'chat'`（嵌入行 `provider = ''`——无前缀命名空间）；派生两表 = 可重算（对账兜底）+ 不设 FK；旧 `members.quota_tokens` **删列**（`DROP COLUMN`——`node:sqlite`（SQLite 3.53.4）实核可）不弃用：总量 ≠ 分模型无保义映射（不转换 ⇒ 列删）；`ADD COLUMN` 常量默认 = 表不重建 | 用户直令（「应该分两个字段，将来统计的时候需要按provider」——需求 §2:22）；迁移窗口 = 与 v5 段同窗（§2:22③）；弃用列留残 = 双源混乱 ∥ 转换 = 语义放大（总量复制到每模型）；派生面同事务维护（`metering/METERING.md` §1） |

## 6. 本域边界（不做的面）

- 归档/导出面不做（清理 = 保留窗删除式——`metering/METERING.md` §1；备份 = 部署侧面——`ops/OPS.md` §5.5）；多实例共享存储 = 触发项（`EVOLUTION.md` §2）；结构升级只走迁移链（不做手工脚本面）。

