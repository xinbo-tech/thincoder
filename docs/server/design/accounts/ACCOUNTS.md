# Thincoder Server · 账号与登录（accounts/ACCOUNTS）

> 板块 = server ∥ 本档 = accounts 域（团队 key ∥ 账号/成员 ∥ 会话/登录 ∥ 密码 scrypt/改密/重置）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 1 ∥ 5 ∥ 7 ∥ 15④）；本域回指 = `PROJECT.md` §7（AC-1 ∥ AC-5 ∥ AC-7 ∥ AC-15④ 判据 = 本档 §5）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 团队 key 面

- 形态：`sk-tc-` + 32 字节随机（base64url，43 字符）；签发 = **明文回显仅一次**（页面 ∥ CLI 同语义；此后任何接口/列表只回显提示形 `sk-tc-ab12cd…wxyz`）。
- 存储：`sha256(明文)` hex 单列唯一索引；库内**无明文**（DDL = `store/STORE.md` §2）。
- 签发 ∥ 吊销：页面（**自助签发 §1.1 ∥ 自助逐把吊销 §1.1** ∥ admin 吊销 §3）与本机 CLI（`ops/OPS.md` §3）——同库同语义；吊销 = `status` 置 `revoked`（软删、行保留）；签发 = 新行（**多把并存**——一人多把；轮转 = 新签 + 吊销旧——**页面不再露出**，端点保留 = API 兼容不变量（§1.1）；不做同 key 换 hash）。
- 校验：每请求查库（唯一索引查找——无内存缓存）⇒ **吊销下一次请求即 401**（AC-5 结构性成立）——KD-SV-11（§6）。
- **客户端登录签发路径（B1 批——2026-10-10 · 台账 #1212）**：客户端面登录（`POST /api/client/login`）签发 = **一枚具名 key**（本表 §1 面全量适用——hash 存储 ∥ 逐请求查库 ∥ 软删吊销 ∥ 多把并存）；端标签落 `name`（trim ≤40；空 ⇒ 默认名助手——§1.1）；**不设过期**（本表天然）∥ **不受 20 上限**（服务端签发面不判上限——沿「轮转 ∥ CLI 不受限」先例）；
  退出 = 吊销该枚；
  审计两型沿用（`login_success`/`login_failure` + `key_issue`/`key_revoke`——detail 携 `surface:"client"`；该批零新型）。机制全文 = `client/CLIENT.md` §1/§5（KD-SV-61）。
- **沙盒工作区 key（server-exec-sandbox 批——2026-10-10 · 台账 #1224）**：工作区创建 ⇒ 签发一枚具名 key（`api_keys` 行——名 `sandbox:<workspace>`；归属 = 工作区负责人）；**不判 20 上限**（沿客户端登录 ∥ CLI 先例）；明文另存控制面（`sandbox_workspaces.key_plain`——盒重建再注入；披露 = `sandbox/SANDBOX.md` §10-D2）；轮换 = 吊销 + 签发（本表 §1 面全量适用）；机制全文 = `sandbox/SANDBOX.md` §7。

### 1.1 key 自助面（功能点 25——多把并存 ∥ 命名 ∥ 逐把吊销；me-keys 批）

- **语义**：成员自助签发任意把（加一把——不动旧把）∥ 逐把吊销本人指定 key；**所有权校验**在服务端（他人 key ⇒ 404——与「不存在」不区分，防枚举；沿 admin 吊销先例）。
- **命名**：签发可携名（`{name?}`）；trim 后空 ⇒ **默认名 `key-N`**（N = 该成员签发序号——含吊销行，单调不复用；**落库**——显示稳定 ∥ 吊销/新增不重排）；上限 = **40 字符**（trim 后；超长 ∥ 非字符串 ⇒ 400 `invalid_request_error`）；**重名允许**（名称 = 标签非标识——寻址仍按 `id`/提示形；唯一索引 = 零收益）。
- **命名落位（各创建路径）**：自助签发 ∥ 轮换端点新签 ∥ CLI `key issue`（无命名参数——在案）**共用同一默认名助手**——空名入参 ⇒ 同口径落 `key-N`；**库内空串 = 仅限迁移前存量行**（v8 回填后零残留——`store/STORE.md` §2 v8 段）。
- **上限（防滥用）**：每成员 **active key ≤ 20**（自助面判据）：签发前计数（`COUNT(*) … status='active'`）⇒ 已达 ⇒ 400 `invalid_request_error`（消息明示上限与处置）；计数与 INSERT 同同步段（无 await 间点——单写者 SQLite 下无竞态面）；**CLI `key issue` 不设限**（本机兜底面——操作者可控；在案）；轮转端点不受限（先吊销后签发 ⇒ 计数归 1）。
- **吊销语义**：立即生效（逐请求查库——KD-SV-11 不变）；幂等（已吊销 ⇒ 200——软删纪律，行保留）；吊销后 key 行离列表（仅列未吊销——KD-SV-16 口径不变；页面行消失 + flash）。
- **审计**：入既有两型（写作点 = §2.1 表：`key_issue` ∥ `key_revoke`——主体 = 本人）；**型面零增**（批时十型 ⇒ 沙盒批后十二型——§2.1）。
- **数据面**：`api_keys.name`（v8 迁移——`store/STORE.md` §2/§3；存量行回填默认名）；`created_at` 既有（本批起随行下发——§3 行形）。
- **端点**：`POST /api/me/keys/issue` ∥ `POST /api/me/keys/:keyId/revoke`（§3 表）；轮换端点 `POST /api/me/keys/rotate` = **保留**（既有批内件与审计型零动——页面露出面 = `webui/WEBUI.md` §2.3⑥）；其新签行 `name` = 默认名助手（空名入参——请求/响应形零改）。
- **边界**：不做改名 ∥ 不做 key 级有效期/过期 ∥ 不做删除行（软删纪律）∥ CLI 命名参数（后续如需——在案）。

## 2. 账号与会话（B 案）

- **成员表扩列**（DDL = `store/STORE.md` §2）：`username`（登录名——唯一）∥ `password_hash`（scrypt 编码串——KD-SV-13）∥ `role`（`admin` ∥ `user`——缺省 `user`）；`name` 仍为展示名（创建缺省 = username）。
- **寻址口径**：登录用 `username` ∥ API 用 `id` ∥ CLI 用 `name`（沿既有）。
- **会话形**（KD-SV-12）：登录签发令牌（32 字节随机 base64url）；库存 `sha256(令牌)`（`sessions` 表——无明文）；cookie `tc_session=<令牌>`（`HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`——7 天绝对过期 ∥ 不滑动）；同人可多会话（每登录一行）。
- **会话校验**：逐请求查库（无缓存——同团队 key 纪律）；登出 = 删行 + 清 cookie；过期行在登录时顺手清；HTTP 内网无 `Secure` 标记（边界 = 本档 §8 ∥ `ops/OPS.md` §5）。
- **密码规则**：最小长度 8（建成员 ∥ 改密 ∥ 重置统一校验）；长度不设上界（已审定：无 DoS 面）；改密 = 哈希替换（旧密即失效——无宽限）；登录失败不区分「用户不存在 ∥ 密码错」（措辞与耗时同——不存在用户照跑哑散列，防枚举）。
- **登录防护（防爆破——首版完备化②）**：双维失败计数（**进程内存**——`thincoder-server/src/accounts/login-guard.mjs`（已落盘））——**用户名维**（提交值——无论是否存在）：连续失败 ≥5 次（窗 15 分钟）⇒ 锁 15 分钟；**IP 维**：失败 ≥20 次（同窗）⇒ 锁同。
- 锁定期内登录 ⇒ **429 `too_many_attempts`** + `Retry-After`（剩余秒）+ 固定文案（**两维同文案、与用户名存在性无关**——防枚举面保持；不跑散列——快速拒绝）；固定窗（锁期内重试不延长）。
- 口面 = `check` ∥ `recordFailure` ∥ `recordSuccess` ∥ `clearUsername`（时钟可注入——批内件）。
- **清计路径**：登录成功（清该用户名 + 该 IP） ∥ 自助改密（清本人用户名维） ∥ admin 重置（清目标用户名维——HTTP 面；本机 CLI 重置跨进程不达——残余 ≤ 锁窗，在案）。
- **重启 ⇒ 计数清零**（在案口径：在线爆破窗 = 分钟级；重启罕发——接受；离线撞库不在防线内）。
- **桶过期惰性清理**：读写路径顺扫过期条目（过期桶即删——无独立清扫面；重启清零同拍）。
- **客户端 IP 口径**：缺省 = 连接对端地址；`trustProxy: true`（`ops/OPS.md` §1）⇒ 读 `X-Real-IP`（前提 = 端口仅反代可达——`ops/OPS.md` §5.6）。
- **事件日志**：锁触发 ⇒ `login_throttled` 一行（`username` ∥ `ip` ∥ `dimension`（`username` ∥ `ip`） ∥ `retryAfterS`——密钥面零涉）；审计事件 `login_locked` 同拍（§2.1）。
- **首个 admin**：首启引导建（`ops/OPS.md` §2——幂等）；本档只管账号数据形。

### 2.1 审计事件（audit——功能点 15④）

- **形态**：事件落库（`audit_events` 表——`store/STORE.md` §2 v3 段）；写入口 = `thincoder-server/src/accounts/audit.mjs`（`recordAudit` ∥ `queryAudit` ∥ `pruneAuditEvents`）；保留 = 与用量同窗同清（`usageRetentionDays`；启动一次 + 24h 同调度点——`metering/METERING.md` §1）。
- **名快照**：`actor_name` ∥ `target_name` = 落库时点名（改名后记录仍可读；列无 FK——历史记录自足，不约束成员生命周期）。
- **CLI 口径**：本机操作（无会话）⇒ `actor_name = "cli"`（`actor_id` NULL）。
- **事件目录与写入点（逐点——既有函数/路由坐标）**：

| 类型 | 主体（actor） | 对象（target） | detail JSON | 写入点（现值坐标） |
|---|---|---|---|---|
| `login_success` | 登录者 username | —— | `{ ip, surface? }` | `thincoder-server/src/accounts/routes.mjs` POST /api/login 成功路径（`recordSuccess` 后） |
| `login_failure` | 提交用户名（成员存在 ⇒ 其 id） | —— | `{ ip, surface? }` | 同上——失败路径（`recordFailure` 侧） |
| `login_locked` | 提交用户名 | —— | `{ ip, dimension, retryAfterS }` | `thincoder-server/src/accounts/login-guard.mjs` 置锁处——经 `onLock` 回调（装配接线 = `thincoder-server/bin/thincoder-server.mjs` 建守卫处） |
| `key_rotate` | 本人 | —— | `{ keyHint }` | `thincoder-server/src/accounts/routes.mjs` POST /api/me/keys/rotate |
| `key_issue` | 成员 ∥ `cli` | —— | `{ keyHint, surface? }` | `thincoder-server/src/accounts/routes.mjs` POST /api/me/keys/issue（本人——me-keys 批） ∥ `thincoder-server/src/ops/cli.mjs` `key issue` |
| `key_revoke` | 本人 ∥ admin ∥ `cli` | key 失主 | `{ keyHint, surface? }` | `thincoder-server/src/accounts/routes.mjs` POST /api/me/keys/:keyId/revoke（本人——me-keys 批） ∥ `thincoder-server/src/accounts/routes-admin.mjs` 吊销路由 ∥ `thincoder-server/src/ops/cli.mjs` `key revoke` |
| `password_change` | 本人 | —— | —— | `thincoder-server/src/accounts/routes.mjs` POST /api/me/password |
| `password_reset` | admin ∥ `cli` | 目标成员 | —— | `thincoder-server/src/accounts/routes-admin.mjs` 重置路由 ∥ `thincoder-server/src/ops/cli.mjs` `member passwd` |
| `member_create` | admin ∥ `cli` | 新成员 | `{ role }` | `thincoder-server/src/accounts/routes-admin.mjs` 建成员路由 ∥ `thincoder-server/src/ops/cli.mjs` `member add` |
| `config_update` | admin（名快照） | —— | `{ keys }`（变更键名清单——值永不入） | `thincoder-server/src/gateway/config-admin.mjs`（已落盘 · 实读 **182** 行）PATCH /api/admin/config 写盘成功后一条（失败 ⇒ warn——不反噬已落盘事实） |
| `sandbox_rule` | admin（名快照） | —— | `{ action, rule }`（规则增删原文——审计面所需） | `thincoder-server/src/sandbox/rules.mjs`（拟新增）——规则增/删各一条 |
| `sandbox_event` | admin ∥ runner（名快照） | —— | `{ kind, workspaceId? }`（审批三态/超时 ∥ 盒起停拆 ∥ runner 注册/排空/删除 ∥ 快照） | `thincoder-server/src/sandbox/registry.mjs`（拟新增）∥ `sandbox/rules.mjs`——§2.5/§2.6 动作处 |

- **型面现状（v11——沙盒批后）**：**十二型**（上表十型 + `sandbox_rule` ∥ `sandbox_event`；CHECK 扩型重建 = `store/STORE.md` §2 v11 段）。

- **`surface` 字段（B1 批——2026-10-10）**：上表四行（`login_success` ∥ `login_failure` ∥ `key_issue` ∥ `key_revoke`）detail 列 `surface?` = 客户端面机读位——取值域 = `"client"`（现唯一值）；写入面 = `/api/client/login`（成 ∥ 败 ∥ 签发）∥ `/api/client/logout`（吊销）两写点；**其余各面（控制台 / 自助 / CLI / admin）该键缺席**（单源 = `client/CLIENT.md` §1）。

- **「成员删」= 零写入点**：全库零成员删除路径（实核）；审计面只覆盖「增」——需求措辞面（「成员增删」含删）已上抛披露（成员删除功能本身不在任何功能点内）。
- **列表**：`GET /api/audit`（admin——§3 端点表）；过滤 = 类型 ∥ 成员 ∥ 时段（`member` 取 id ∥ 展示名——解析同 usage 口径；匹配 `actor_id` ∥ `target_id`）。
- **边界**：不做告警推送 ∥ 不做事件导出 ∥ 不做不可篡改/防删面（库文件权限自担——内网工具面）；OpenAI 请求不入审计（= 用量面——`metering/METERING.md` §1）；**成员配置写（分模型覆盖 ∥ 模型禁用集）不入审计**（admin 成员管理动作——沿覆盖先例，该面零增）；被拒调用 = 网关行为（同口径）。

### 2.2 成员模型禁用（配额 v2——功能点 23③ ∥ 台账 #1004）

- **语义**：**默认全可用**；禁用 = 对该成员禁用某 chat 模型（对外标识粒度——别名 ∥ `provider/model`；2026-10-09 alias 批——KD-SV-59）——**服务端执行**（被禁模型调用 ⇒ 拒；控制台仅写配置）。可用性轴，与配额（用量限额轴）独立（关系判据见下）。
- **存储**：`members.model_disabled_json`（JSON 对象——键 = 对外标识；值 `true`；缺省 `{}`）；形/DDL = `store/STORE.md` §2 v6 段；随鉴权行携带（零查询——沿 `model_quotas_json` 口径）。
- **写面**：`POST /api/members/:id/model-disables`（admin——§3 端点表）：**键级合并** `{disables: {"<外标>": true|null}}`——`true` = 禁用 ∥ `null` = 删键（恢复）∥ 未出现键不动；键形校验（**与 `model-quotas` 同助手**——非空 ∥ **无首尾空白** ∥ 含斜杠时两段非空；**裸名 = 别名形合法**（2026-10-09 alias 批）；首尾空白键 ⇒ 400——#1008 收正，手写/curl 面可达无反馈面闭合）；
  值非 `true`/`null` ⇒ 400（库零变）；成员不存在 ⇒ 404。
- **读面**：`memberView` 增 `modelDisables`（map——`/api/me` ∥ `/api/members` 同源；控制台勾选态直读）。
- **执行面**（消费细节 = `gateway/API.md` §2.1）：派发命中后、配额准入前——随鉴权行（零查询）；被禁 ⇒ 404 `model_not_found`（消息明示「已对该成员禁用」——零新码）；`/v1/models` 随动滤除（输出 = 开放清单 − 调用者禁用集）；仅 chat（嵌入面零涉——沿配额/限流口径）。
- **与配额三级的关系（优先级判据）**：**禁用优先**——被禁 ⇒ 拒（404），不涉配额判定（零 SQL）；未禁 ⇒ 才走三级（覆盖 > 平台 > 不限）。两轴独立：禁用不触计数/记账（准入前拒打不落用量——既口径）；配额超额不改禁用态。
- **审计面**：禁用集变更不入审计（§2.1 边界）；被拒调用不入审计（= 用量面/网关行为）。
- **边界**：不做 CLI 设置面 ∥ 定时/条件禁用 ∥ 禁用统计面 ∥ 嵌入模型禁用（嵌入面零涉）；成员删除路径零改。

## 3. 端点表（`/api/*`——登录 ∥ 自助 ∥ 管理）

（错误形 = `gateway/API.md` §3；写端点仅收 `application/json`，其它 content-type ⇒ 400；**例外** = `POST /api/runner/checkpoint`（octet-stream——`gateway/API.md` §2.6））

| 方法 + 路径 | 鉴权/角色 | 语义 |
|---|---|---|
| `POST /api/login` | 公开 | 登入：`{username, password}` ⇒ 200 + `Set-Cookie`（会话）；失败 ⇒ 401 `invalid_credentials`；锁定期 ⇒ **429 `too_many_attempts`** + `Retry-After`（两维同文案——防枚举面保持，§2） |
| `POST /api/logout` | 会话 | 销当前会话（删行 + 清 cookie） |
| `GET /api/me` | 会话 | 本人信息（`id ∥ name ∥ username ∥ role ∥ modelQuotas ∥ modelUsage ∥ modelDisables ∥ usedTokens`——覆盖 map（键 = 对外标识；额度口径 = `metering/METERING.md` §2）∥ 逐模型已用 map（当月——`metering/METERING.md` §2.3）∥ 禁用集 map（§2.2））+ 本人 key 清单（行形 = `memberView`：`{ id, name, hint, createdAt, lastUsedAt, windowTokens }`——名称 ∥ 提示形 + id ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天用量；仅未吊销） |
| `POST /api/me/password` | 会话 | 自助改密：`{oldPassword, newPassword}`；旧密错 ⇒ 401 `invalid_credentials`；成功 ⇒ 吊销本人其他会话（当前保留） |
| `POST /api/me/keys/rotate` | 会话 | 轮转本人 key：新签 + 吊销旧（**全换**——无旧 ⇒ 等同首签）；新明文一次性回显（同 §1 语义）；**页面不再露出**（me-keys 批——多把并存下「全换」页面下架；端点 = API 兼容不变量——请求/响应形零改；新签行 `name` = 默认名助手（§1.1）） |
| `POST /api/me/keys/issue` | 会话 | 自助签发一把新 key：`{name?}`（名称可空——trim 空 ⇒ 默认 `key-N`；≤40 字符 ∥ 非字符串 ⇒ 400 `invalid_request_error`）⇒ 200 `{id, name, hint, plain}`（明文一次性——同 §1 语义；**旧 key 照常可用**——多把并存）；active ≥20 ⇒ 400（消息明示上限）；命名/上限全文 = §1.1 |
| `POST /api/me/keys/:keyId/revoke` | 会话 | 自助吊销本人指定 key（立即生效——逐请求查库）；key 不存在 ∥ 不属本人 ⇒ **404 `not_found`**（两况不区分——防枚举）；已吊销 ⇒ 幂等 200；返回 `{ok, id, status:"revoked"}` |
| `GET /api/members` | admin | 全队成员 + 分模型覆盖 + 逐模型已用 + 禁用集 + 本月已用 + 各成员 key 清单（行形同 `GET /api/me`——单源 = `memberView`：名称 ∥ 提示形 + id ∥ `createdAt` ∥ `lastUsedAt` ∥ `windowTokens`；仅列未吊销） |
| `POST /api/members` | admin | 建成员：`{username, name?, role?}` ⇒ 一次性临时密码回显（服务器生成——同签发语义） |
| `POST /api/members/:id/keys/:keyId/revoke` | admin | 吊销指定 key（立即生效） |
| `POST /api/members/:id/password-reset` | admin | 重置密码（KD-SV-14——在）：一次性临时密码回显 + 吊销该成员全部会话；旧密即失效（首登后应自助改密——页面提示，不强制门） |
| `POST /api/members/:id/model-disables` | admin | 设成员模型禁用集（键级合并）：`{disables: {"<对外标识（别名 ∥ provider/model）>": true|null}}`——`true` = 禁用 ∥ `null` = 删键（恢复可用）；未出现键不动；键形校验（非空 ∥ 无首尾空白 ∥ 含斜杠时两段非空（裸名 = 别名形合法）——与 `model-quotas` 同助手；#1008 收正）∥ 值非 `true`/`null` ⇒ 400（库零变）∥ 成员不存在 ⇒ 404；返回 `{id, modelDisables}`（机制全文 = §2.2） |
| `GET /api/audit` | admin | 审计事件列表（过滤：type ∥ member ∥ from ∥ to ∥ limit——缺省 100 ∥ 上限 500，沿用量口径）；返回 `{ events: [ { id, ts, type, actor, actorId, target, targetId, detail } ] }`（倒序——新在前；`detail` = 解码对象；类型枚举 = §2.1） |

- 用量与配额端点（`/api/me/usage` ∥ `/api/usage` ∥ `/api/members/:id/model-quotas`）= `metering/METERING.md` §3。
- 成员行三 map（`modelQuotas` ∥ `modelUsage` ∥ `modelDisables`）键 = 对外标识（别名 ∥ `provider/model`）——读面回映射随别名即改（`metering/METERING.md` §2.3 ∥ §4 AC-29④ 行；2026-10-09 alias 批）。
- provider 管理端点（`/api/admin/providers/*`）= `gateway/API.md` §2.2——判权同本表口径（`requireAdmin`：`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401；写端点 JSON 型门同前言）。
- 客户端面端点（`/api/client/*`——login ∥ logout ∥ me；鉴权 = 登录 token（`Authorization: Bearer`——与 /v1 同校验单源））= `client/CLIENT.md` §2（token 即本表 key 面——§1 客户端登录签发路径条）。
- **双角色规则**：角色判定与写权限强制在服务端（页面显隐非判据）；`user` 触管理端点 ⇒ 403 `forbidden`；admin 兼有自助面；无 ∥ 过期会话 ⇒ 401 `unauthorized`。
- **跨站防护**：`SameSite=Strict`（跨站不携 cookie）+ 写端点仅 JSON + 无 CORS 放行头。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/accounts/keys.mjs`（已落盘） | **98**（实读 2026-10-06）**⇒ 本批 +≈7**（校验面携 `modelQuotas`——`verifyKey` 解析随行；配额批）**⇒ 实读 102 ⇒ ≈108 ⇒ 实读 109（2026-10-07）**（配额 v2 批落地：鉴权行携 `model_disabled_json`——`verifyKey` SELECT + parse 随行）**⇒ ≈131**（me-keys 批：`issueKey` 携名 ∥ 默认名助手 ∥ `countActiveKeys` ∥ `MAX_ACTIVE_KEYS` ∥ `activeKeysOf` 列增 +≈22——实施实读为准） | key 校验 ∥ key 签发/吊销/轮转（页面与 CLI 共用） |
| `thincoder-server/src/accounts/members.mjs`（已落盘） | **161 ⇒ ≈165**（实读 2026-10-06——本批 +≈4 = `countMembers`（总览读数））**⇒ 实读 166 ⇒ ≈190**（配额批：`mergeMemberModelQuotas`（键级合并） ∥ `setMemberQuota` 退役（旧列删） ∥ 建成员 INSERT 列随正）**⇒ 实读 192 ⇒ ≈210 ⇒ 实读 241（2026-10-07）**（配额 v2 批落地：`parseModelDisables` ∥ `mergeMemberModelDisables` ∥ 键形助手（覆盖 ∥ 禁用两合并共用——#1001②）；+49——越估 31） | 成员 CRUD ∥ scrypt 散列/校验 ∥ 角色 ∥ 临时密码 ∥ 首启引导 |
| `thincoder-server/src/accounts/session.mjs`（已落盘） | **95**（实读 2026-10-06——本批零动） | 会话签发/校验/吊销 ∥ cookie 序列化/解析 ∥ 过期清理 |
| `thincoder-server/src/accounts/routes.mjs`（已落盘） | **98 ⇒ ≈112**（实读 2026-10-06——本批 +≈14 = 登录成/败审计写 ∥ 轮换/改密审计写 ∥ `memberView` key 行归并（`lastUsedAt`/`windowTokens`））**⇒ 实读 112 ⇒ ≈118**（配额批：`memberView` 配额字段换形（`modelQuotas`））**⇒ 实读 113 ⇒ ≈122 ⇒ 实读 118（2026-10-07）**（配额 v2 批落地：`memberView` 两新字段（`modelUsage` ∥ `modelDisables`）∥ 取数装配）**⇒ ≈152**（me-keys 批：两新路由（issue ∥ revoke——校验/上限/所有权/审计）+≈30 ∥ key 行 += name/createdAt +≈4） | 自助端点：login ∥ logout ∥ me ∥ me/password ∥ me/keys/issue ∥ me/keys/:keyId/revoke ∥ me/keys/rotate |
| `thincoder-server/src/accounts/routes-admin.mjs`（已落盘） | **61 ⇒ ≈100**（实读 2026-10-06——本批 +≈39 = 三处审计写（建/吊销/重置） ∥ `GET /api/audit` 注册行（过滤三轴））**⇒ 实读 95 ⇒ ≈112 ⇒ 实读 109（2026-10-07）**（配额 v2 批落地：`model-disables` 端点注册行（合并 ∥ 校验 ∥ 404 ∥ 返回）） | 管理端点：members 列表/建 ∥ 吊销 ∥ 重置 ∥ 审计列表 |
| `thincoder-server/src/accounts/login-guard.mjs`（已落盘） | **119 ⇒ ≈125**（实读 2026-10-06——本批 +≈6 = `onLock` 回调（置锁处）） | 登录防爆破 |
| `thincoder-server/src/accounts/audit.mjs`（已落盘） | **≈90**（设计估——`recordAudit` ∥ `queryAudit`（过滤/分页） ∥ `pruneAuditEvents` ∥ 行解码）**⇒ 实读 109**（2026-10-09——首版完备化批落地后首读） | 审计事件（§2.1） |
| **小计** | **≈570 ⇒ 493 ⇒ 632 ⇒ ≈785**（#963 实读：+139）**⇒ ≈822**（配额批：+≈37 = members +≈24 ∥ keys +≈7 ∥ routes +≈6）**⇒ ≈872 ⇒ 实读 897（2026-10-07——配额 v2 批落地后；Δ+75 = members +49 ∥ keys +7 ∥ routes +5 ∥ routes-admin +14——越估 ≈25）⇒ ≈953（me-keys 批：+≈56 = keys +22 ∥ routes +34 ∥ members/routes-admin ±0——实施实读为准）** | —— |

## 5. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-1（功能点 1） | 无 Authorization ∥ 未知 key ∥ 吊销 key ⇒ **401 + `invalid_api_key`**；持有效团队 key 经 mock 上游完成一次请求 ⇒ 200 | 批内件 |
| AC-5（功能点 5） | 吊销后**下一次请求** ⇒ 401（无缓存路径——查库即判） | 批内件 |
| AC-7（功能点 7——B 案） | ① 正确凭据登录 ⇒ 200 + 会话 cookie；错凭据（含不存在用户）⇒ 401 `invalid_credentials`（同措辞）② 无/过期会话访问 `/api/me` ∥ `/api/usage` ⇒ 401 `unauthorized` ③ `user` 会话调管理写（建成员 ∥ 配额（分模型覆盖） ∥ 吊销 ∥ 重置）⇒ 403 `forbidden`（服务端判）④ 自助改密 ⇒ 旧密登录失败 + 新密登录成功 + 本人其他会话失效（当前保留）⑤ admin 重置 ⇒ 旧密失效 + 临时密码可登（一次性回显——同签发语义）⑥ 自助轮换 ⇒ 新 key 通行 + 旧 key 下一请求 401 ⑦ 首启引导幂等（零 admin + 配置 ⇒ 建；再启动 ⇒ 不重建不改密——机制 = `ops/OPS.md` §2） | 批内件 |
| AC-13②（功能点 12——登录防爆破；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 5 连败（同用户名）⇒ 第 6 次（含正确密码）⇒ 429 `too_many_attempts` + `Retry-After`（秒）；锁窗过后 ⇒ 正确密码 200；成功 ⇒ 清计；IP 维 20 阈值（`trustProxy` 下取 `X-Real-IP`）；不存在用户名同锁（枚举零差——措辞/计时面）；admin 重置 ⇒ 该用户名锁清（旧密 401、临时密码 200）；锁触发日志 `login_throttled` 在册 | 批内件 |
| AC-15④（功能点 15——审计/安全面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 事件落库（逐写入点实走 ⇒ 各型行在场：登录成/败/锁 ∥ 轮换/签发/吊销 ∥ 改密/重置 ∥ 建成员——含 CLI 面 `actor=cli`）∥ 列表过滤（类型 ∥ 成员 ∥ 时段逐轴生效）∥ 失败登录可见（N 连败 ⇒ `login_failure` 行 + 第 5 次起 `login_locked` 行）∥ 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ 保留清理（注入时钟 ⇒ 窗外删——同窗接线） | 批内件 |
| AC-23（功能点 23③——成员模型禁用写/读面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 写面：`POST /api/members/:id/model-disables` 键级合并（`true` = 禁用 ∥ `null` = 删键 ∥ 未出现键不动）∥ 键形非法（空 ∥ 首尾空白 ∥ 含斜杠时空段）⇒ 400（裸名 = 别名形合法——2026-10-09 alias 批）∥ 值非 `true`/`null` ⇒ 400（库零变）∥ 不存在 ⇒ 404 ∥ 返回 `{id, modelDisables}` ∥ 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）；读面：`memberView` 新字段 `modelUsage`（当月逐模型已用——键 = 外标）∥ `modelDisables`——`/api/me` ∥ `/api/members` 同形；变更不入审计（十型零增）；覆盖键形校验同拍（#1001② ∥ #1008——`model-quotas` 首尾空白键 ⇒ 400；裸名 = 别名形合法） | 批内件 |
| AC-29④（功能点 29——成员面随动：配额/禁用键；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 写面键形 = 对外标识（配别名模型 ⇒ 别名形——裸名合法；首尾空白 ⇒ 400；含斜杠 ⇒ 两段非空）；`memberView` 三 map 键 = 对外标识；别名变更 ⇒ 键面当即随动（旧形键 = 离表键保留、不生效——无历史/迁移）；记账面判据 = `metering/METERING.md` §4 AC-29④ 行；用例 = §7 N35 | 批内件 |
| AC-25（功能点 25——key 多把并存/命名/自助签发/逐把吊销；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 签发：`POST /api/me/keys/issue`（会话）——`{name?}` ⇒ 200 `{id,name,hint,plain}`（明文一次性；**旧 key 照常可用**——多把并存）；空名 ⇒ 默认 `key-N`（单调——含吊销行）；名 ≤40 字符（trim；超长/非字符串 ⇒ 400 `invalid_request_error`）；重名允许；active ≥20 ⇒ 400（消息明示上限——防滥用；CLI 不设限在案）∥ 吊销：`POST /api/me/keys/:keyId/revoke` ⇒ 200；**他人 key ⇒ 404 `not_found`**（不属本人与不存在不区分——防枚举）；已吊销 ⇒ 幂等 200；吊销即断（下一 `/v1` 请求 401——逐请求查库）∥ 行形：`/api/me` ∥ `/api/members` key 行 += `name`/`createdAt`（单源 = `memberView`；仅未吊销）∥ 审计：两型既有（`key_issue` ∥ `key_revoke`——主体 = 本人；十型零增）∥ 判权：无会话 ⇒ 401；轮换端点保留（页面不再露出——兼容不变量）∥ 数据面：`api_keys.name`（v8 迁移——存量行回填默认名）∥ **空串零残留断点**（v8 回填后全表实读——全部创建路径经默认名助手；空串仅限迁移前存量） | 批内件 |
| AC-31（功能点 31——三端登录 token 面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | login ⇒ 200 携 token（`api_keys` 新行：name = 端标签 ∥ key_hash = sha256(token)）；错凭据 ⇒ 401 同措辞；锁定期 ⇒ 429 + `Retry-After`（沿双维锁——§2）；logout ⇒ 吊销即判（下一请求 401——无缓存）；token 兼用 `/v1/*` 与 `/api/client/*`；label ≤40（空 ⇒ 默认名 `key-N`）；签发不受 20 上限；审计两型沿用（十型零增）；`sessions` 表零涉 | 批内件 |

## 6. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-7 | **管理/自助面 = 登录制页面（会话 cookie + 角色分面：user 自助 ∥ admin 管理）+ 本机运维 CLI 兜底** | B 案（用户 08:04）——管理页（受登录门禁）承载管理写面（建成员 ∥ 配额 ∥ 吊销 ∥ 重置）；会话与团队 key 两族鉴权物理分离（cookie ∥ Bearer）；CLI 降本机兜底但保留全能力（同库同语义） | `admin.token` 门禁区保留（二套并存——无正交价值）· 管理写面只走 CLI（B 案点名页面管成员——已越）· 会话混用 `Authorization` 头（与团队 key 混族——读端点无法按头分族） |
| KD-SV-11 | **团队 key 校验 = 逐请求查库（无缓存）** | 吊销即时生效（AC-5）零失效逻辑；单索引查询成本可忽略（团队量级） | 内存缓存（失效/失效传播复杂度——无收益） |
| KD-SV-12 | **会话形 = HttpOnly cookie**（`tc_session`；`SameSite=Strict`；7 天绝对过期）；`sessions` 表存 `sha256(令牌)`——逐请求查库（同 key 纪律） | 与团队 key 物理分族（`Authorization: Bearer` 只属 OpenAI 面）∥ 浏览器原生携带、页面零令牌存储（HttpOnly——JS 不可读）∥ `SameSite=Strict` + 写端点仅 JSON ⇒ 免 CSRF 令牌 | Bearer 会话令牌（localStorage——与团队 key 共头形；XSS 可取）· 签名自持令牌（无状态——吊销不即时，与逐请求查库纪律相抵）· 内存会话表（重启全登出 ∥ 与库单源相抵） |
| KD-SV-13 | **密码散列 = scrypt**（`node:crypto`；N=16384 ∥ r=8 ∥ p=1 ∥ keyLen=32 ∥ salt 16B 随机；异步变体）；编码串 `scrypt$N$r$p$salt$hash`（自描述——参数可升）；校验 `timingSafeEqual`；密码最小长度 8 | 零依赖（node 内建）∥ 慢因子抗离线爆破 ∥ 异步变体不阻塞事件循环（同进程中继不抖动）∥ 自描述编码串免参数考古 | 裸 sha256（无慢因子）· bcrypt/argon2（第三方——违零依赖）· 同步 scrypt（阻塞 50–100ms——中继受扰） |
| KD-SV-14 | **admin 重置成员密码 = 在**（用户 2026-10-06 08:06 定）；语义 = 服务器生成**一次性临时密码**（回显一次——同签发语义）+ 吊销该成员全部会话；首登后应自助改密（页面提示——不设强制门） | 忘密唯一兜底（找回 = 不做项——无外部通道）∥ 一次性临时密码 = 管理侧零知情（admin 不见成员自设密码）∥ 与 key 签发同语义——两族凭证一致 | admin 直接设新密（admin 知晓成员密码——凭据卫生否）· 自助找回（邮件/短信——不做项）· 不落（兜底缺——忘密只剩本机 shell） |
| KD-SV-16 | **管理面 key 枚举 = `GET /api/members` 成员行内附清单**（提示形 + id；仅列未吊销）——不设 `/api/members/:id/keys` 子资源 | 管理页一次装配（成员表 + 吊销控件同响应——vanilla 前端一跳）；与 `GET /api/me`「本人信息 + key 清单」同形；端点面零增 | 独立子资源（`GET /api/members/:id/keys`——页面 N+1 请求 ∥ 无其它消费方，吊销流多一跳） |
| KD-SV-21 | **登录防爆破 = 双维内存锁**（用户名维 5 次 ∥ IP 维 20 次——窗/锁各 15 分钟；任一中锁 ⇒ 429 `too_many_attempts` + `Retry-After`；两维同文案——防枚举面保持；成功/改密/重置清计；重启清零（在案））；IP 口径 = 对端地址 ∥ `trustProxy: true` 读 `X-Real-IP` | 内网面在线爆破防护（分钟级窗）；内存 = 零表零写（登录热路径不落库）∥ 双维 = 兼顾定向与喷洒；快速拒绝（429）优于服务端 sleep（挂连接/事件循环面）；固定窗不升级（升档留后续） | DB 持久化（每条失败一写 + 新表——重启清零可接受，收益低）· 逐次延迟响应（挂连接）· 仅用户名维（喷洒无阻）· 仅 IP 维（定向爆破不阻 ∥ 反代聚合面误伤）· 验证码/外部组件（内网工具面——不做） |
| KD-SV-28 | **审计事件 = 库表（v3）+ 名快照 + 与用量同保留窗**：`audit_events`（十型 CHECK）；写入口 = `thincoder-server/src/accounts/audit.mjs`（`recordAudit` 由调用侧显式传型/主体——HTTP 路由与 CLI 同覆盖）；列表 = `GET /api/audit`（admin——过滤三轴）；清理复用 `usageRetentionDays` 与调度点 | 浏览器可读（审计页）+ 过滤 ∥ 库表 = 与全系统同库单源；快照名 = 改名后记录仍自足（列无 FK——不约束成员生命周期）；同窗单旋钮 = 保留治理一处配置；CLI 覆盖 = 本机改动也入审计（单点漏检面） | 日志文件（控制台不可读 ∥ 无过滤 ∥ 轮转面）· 内存（重启清零）· 独立保留窗配置（口径分裂——两窗默认值不同徒增疑问）· 服务层函数内隐式落库（`setMemberPassword` 三调用方异型——无法区分自助/重置/CLI） |
| KD-SV-42 | **成员模型禁用 = 默认全可用 + 勾选即禁用（即时写）+ 存储 `members.model_disabled_json`（JSON map——沿覆盖列口径）+ 派发命中后/配额前执行（404 `model_not_found`——消息明示）+ `/v1/models` 随动滤除**：写面 = 键级合并 `POST model-disables`（`true`/`null`）；检查 = 随鉴权行零查询；**禁用优先于配额**（可用性 ≠ 用量限额——两轴独立）；审计零增（沿覆盖先例）；仅 chat（嵌入面零涉） | 需求 §2:23③（用户 11:16 走查「默认可用、勾选即禁用」——机制选择为设计裁定）；沿 `model_quotas_json` 先例（JSON 列随鉴权行——零新表零新查询）；错误形零新码（沿「未开放 ⇒ 404」选择性中继口径——列表/派发两面同判）；即时写 = 布尔勾选（沿吊销在窗「即点即效」先例；额度输入仍草稿+保存——值面校验/误触面） | 新错误码（新契约 + i18n + 四端未知码面——无收益）· 独立禁用表（键查 + N+1 面）· 列表照列仅拒调用（可观察面自相矛盾：列表可选中而调用必 404）· 草稿+保存提交（勾选语义失即时性；且与配额提交并批 = 二写非原子）· 嵌入面禁（表不列嵌入行——面外） |
| KD-SV-48 | **key 自助面 = 多把并存（签发 + 逐把吊销）+ 命名 + 上限**：端点 = `POST /api/me/keys/issue` ∥ `POST /api/me/keys/:keyId/revoke`（会话面——判权本人）；命名 = 可空 ⇒ 默认 `key-N`（**落库**——单调不复用）∥ ≤40 字符 ∥ 重名允许（名称 = 标签；寻址 = id/提示形）；上限 = active ≤20（自助面判据；超 ⇒ 400 明示；CLI 免——本机兜底）；他人 key ⇒ 404（不区分——防枚举，沿 admin 先例）；审计 = 既有两型（主体 = 本人；十型零增）；轮换端点保留（页面下架——API 契约零动）；存储 = `api_keys.name`（v8） | 需求 §2:25（用户 16:06/16:08/16:1x——「一个用户可能会有多个Key」硬需求）；沿 admin 吊销先例（404 口径 ∥ 幂等）；默认名落库 = 显示稳定（吊销/新增不重排）；名称 = 标签非标识（唯一索引无收益） | 「轮换（全换）」为唯一签发径（页面下架——误读为「换一把」即全断；需求 ① 允许留/否）· 空名零默认（表列无所指）· 重名禁止（唯一索引 + 冲突路径——收益低）· 上限落 CLI（本机兜底面——免）· 改名/排序面（面外） |

## 7. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| N5 | 正常 | admin 会话 + `GET /api/members` | 200；无/过期会话 ⇒ 401 `unauthorized`；`GET /` 公开 200（页面壳——零数据） |
| N6 | 正常 | 正确 `username` + `password` → `POST /api/login`，随后携 cookie `GET /api/me` | 200 + `Set-Cookie`；`/api/me` 200（本人信息 + key 提示形） |
| N7 | 正常 | 会话 + `POST /api/me/password`（旧密正确） | 200；旧密再登录 401；新密可登录；本人其他会话 401（当前保留） |
| N8 | 正常 | 会话 + `POST /api/me/keys/rotate` | 新明文一次性回显；旧 key 下一 `/v1` 请求 401；新 key 通行 |
| N9 | 正常 | admin 会话：`POST /api/members` + 设配额（`metering/METERING.md` §3） | 新成员初始密码一次性回显；该成员可登录；配额对 `/v1` 生效（429 口径 = AC-4） |
| N10 | 正常 | admin 会话 + `POST /api/members/:id/password-reset` | 200 + 临时密码一次性回显；该成员旧密登录 401；临时密码可登录；其会话全部失效 |
| N11 | 正常 | admin 会话 + `GET /api/members`（取成员行内 key id）→ `POST /api/members/:id/keys/:keyId/revoke` | 200；该 key 下一 `/v1` 请求 401（吊销即扫——无缓存路径）；成员行 key 清单不再含该 key |
| B8 | 边界 | 改密时旧密码错误 | 401 `invalid_credentials`；原密码 ∥ 全部会话不变 |
| E8 | 错误 | 无/过期会话访问 `/api/me` ∥ `/api/usage` | 401 `unauthorized` |
| E9 | 错误 | `user` 会话调管理写（`POST /api/members` ∥ 配额 ∥ 吊销 ∥ 重置） | 403 `forbidden`（服务端拒——页面隐藏非判据） |
| E10 | 错误 | 错误密码 ∥ 不存在用户登录 | 401 `invalid_credentials`（两况同措辞——防枚举） |
| N22 | 正常 | 同用户名 5 连败 ⇒ 第 6 次（正确密码） | 429 `too_many_attempts` + `Retry-After`；日志 `login_throttled` |
| N23 | 正常 | 锁窗过后（时钟注入）正确密码登录 | 200 + 会话；计数清零 |
| N24 | 正常 | admin 重置（HTTP）后该成员登录 | 锁清——临时密码 200（旧密 401） |
| B18 | 边界 | 锁定期内重复尝试 | 429 同文案；`Retry-After` 递减；锁不延长（固定窗） |
| B19 | 边界 | 不存在用户名 5 连败 | 同锁同 429（与存在者零差——枚举面） |
| E20 | 错误 | 锁定期请求（任一门径） | 429 `too_many_attempts`；`Retry-After` 头在场 |
| N26 | 正常 | 走全事件链（登录成 ∥ 败 ∥ 5 连败锁 ∥ 轮换 ∥ 签发 ∥ 吊销 ∥ 改密 ∥ 重置 ∥ 建成员）⇒ `GET /api/audit` | 各型行在场（时间 ∥ 类型 ∥ 主体 ∥ 对象 ∥ detail 逐值——ip/dimension/keyHint 归位） |
| B24 | 边界 | 失败登录（不存在用户名）∥ 锁触发 | `login_failure`（actor = 提交值 ∥ id NULL）∥ `login_locked`（dimension ∥ retryAfterS） |
| B25 | 边界 | CLI 面四命令（member add ∥ member passwd ∥ key issue ∥ key revoke） | 对应事件行（actor = `cli`） |
| E21 | 错误 | 无会话 ∥ user ⇒ `GET /api/audit`；`type`/`limit` 非法 | 401 `unauthorized` ∥ 403 `forbidden` ∥ 400 `invalid_request_error` |
| N28 | 正常 | 注入时钟：窗外一行 + 窗内一行 ⇒ `pruneAuditEvents` | 界外删、窗内留 |
| N29 | 正常 | admin 设禁用 `{disables:{"mock/mock-chat":true}}` ⇒ 该成员调 `mock/mock-chat` ∥ 他成员同调 | 404 `model_not_found`（消息含「已对该成员禁用」）；`/v1/models`（该成员）不含；他成员 200（不受累） |
| N30 | 正常 | `{disables:{"mock/mock-chat":null}}`（恢复）⇒ 下一请求 | 200；`/v1/models` 恢复含；即时生效（无缓存——写后下一请求） |
| B26 | 边界 | 禁用键不在服务清单（离表） ∥ 禁用后模型被停用再重开 | 键恒保留（与覆盖键同口径——重开即再禁）；行可读（map 面） |
| B27 | 边界 | 键形非法（`/m` ∥ `p/` ∥ `""` ∥ 首尾空白 `" mock/m"`） ∥ 裸名 `m`（别名形——合法） ∥ 值 `false`/`0`/`"x"` | 400 `invalid_request_error`；库零变 ∥ 裸名照收（别名形——2026-10-09 alias 批） |
| E22 | 错误 | `user` ∥ 无会话 ∥ 成员不存在 ⇒ 禁用端点 | 403 `forbidden` ∥ 401 `unauthorized` ∥ 404 `not_found` |
| N31 | 正常 | 会话 + `POST /api/me/keys/issue`（`{name:"笔记本"}`） | 200 `{id, name:"笔记本", hint, plain}`（明文一次性）；**旧 key 照常可用**（多把并存——verifyKey 命中）；审计 `key_issue`（actor = 本人） |
| N32 | 正常 | 会话 + `POST /api/me/keys/issue`（空体） | 200；`name` = 默认 `key-N`（该成员签发序号——含吊销行单调） |
| N33 | 正常 | 会话 + `POST /api/me/keys/:keyId/revoke`（本人 key） | 200；该 key 下一 `/v1` 请求 401；`/api/me` key 清单不再含；审计 `key_revoke`（actor = 本人）；重复调用 ⇒ 幂等 200 |
| B28 | 边界 | active = 20 时第 21 把签发 ∥ 吊销一把后再签 | 400 `invalid_request_error`（消息明示上限）∥ 吊销后 ⇒ 200 |
| B29 | 边界 | 名 41 字符 ∥ 两把同名 ∥ 名全空白 | 400 `invalid_request_error`；库零变 ∥ 200（重名允许） ∥ 200（默认名） |
| E23 | 错误 | A 会话吊销 B 的 key（B 的 keyId） ∥ 无会话 ∥ keyId 不存在 | 404 `not_found`（A 的操作零变——B key 仍 active） ∥ 401 `unauthorized` ∥ 404 `not_found` |
| N34 | 正常 | 走签发 + 自助吊销链 ⇒ `GET /api/audit` | `key_issue` ∥ `key_revoke` 行在场（actor = 本人 ∥ detail = keyHint；十型零增——既有型复用） |
| N35 | 正常 | 模型配别名 `fast` ⇒ admin 设禁用 `{disables:{"fast":true}}` ⇒ 该成员调 `model=fast` ∥ 覆盖键同拍 `{quotas:{"fast":N}}` | 404（消息含「已对该成员禁用」）∥ 配额键 `fast` 生效（点查准入按真名对）——键即外标随动（KD-SV-59） |

## 8. 本域边界（不做的面）

- 组织架构同步 ∥ SSO ∥ 双因素 ∥ **密码找回**（需外部通道（邮件/短信）——「团队协同」步再议；**改密 = 在**——自助 ∥ admin 重置）。
- 密码复杂度策略（仅最小长度 8） ∥ 会话管理面（会话列表 ∥ 多端踢出——改密/重置吊销属被动机制） ∥ 登录防护不做：跨重启持久锁 ∥ IP 黑白名单/验证码 ∥ 改密/重置端点的失败限速（需已持会话——在案） ∥ 离线撞库（防线外）。
- 角色只两级（admin ∥ user——不做细粒度权限/自定义角色）。
- 审计面不做：告警推送 ∥ 事件导出 ∥ 不可篡改/防删面（库文件权限自担）；OpenAI 请求不入审计（= 用量面）。
- 成员模型禁用面不做：CLI 设置面 ∥ 定时/条件禁用 ∥ 禁用统计/看板 ∥ 嵌入模型禁用（嵌入面零涉——沿配额/限流口径）；审计零增（§2.1/§2.2）。
- key 自助面不做：改名 ∥ key 级有效期/过期 ∥ 删除行（软删纪律） ∥ 上限的 CLI 侧（本机兜底免——§1.1） ∥ 签发去向/设备标注（名称已足——面外） ∥ key 级用量明细面（= 网关归因面，已有）。
- 成员键别名面（2026-10-09 alias 批——KD-SV-59）：键存储 = 字符串（键 = 对外标识——别名随动、无迁移；旧形键 = 离表键恒保留）；不做键的历史/别名回写 ∥ 不做键的存在性/别名交叉校验（键形 = 形状面单源——无斜杠裸名归别名形）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——accounts 域：团队 key 面 ∥ 账号/会话/角色 ∥ 自助/管理端点表 ∥ 改密/重置；KD-SV-7/11/12/13/14；用例 N5–N10 ∥ B8 ∥ E8–E10。
- 2026-10-06：fix 轮（评审轮次 1 #1——管理面 key 枚举补记）：`GET /api/members` 成员行附 key 清单（提示形 + id）；KD-SV-16 增；用例 N11 增（admin 吊销正路——该 key 下一请求 401）。
- 2026-10-06：实施后回填轮（fix）——§2 密码规则补「长度不设上界」（已审定：无 DoS 面）；§4 行数按实读回填（小计 ≈570 ⇒ 493）。
- 2026-10-06：控制台 provider/模型管理设计轮（批 `docs/batches/2026-10-06-console-providers.md`）——§3 增 provider 管理端点指针行（端点表归 `gateway/API.md` §2.2——本域零语义改）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12② ∥ 台账 #963）——§2 增登录防护（双维内存锁 ∥ 阈值/窗 ∥ 清计路径 ∥ 重启口径 ∥ IP 口径 ∥ 事件日志）∥ §3 login 行补 429 ∥ §4 预算（login-guard 拟新增 ≈90 ∥ routes +20 ∥ routes-admin +3；小计 ≈606）∥ §5 补 AC-13② 候补行 ∥ §6 增 KD-SV-21 ∥ §7 增 N22–N24 ∥ B18/B19 ∥ E20 ∥ §8 边界随正（限速/锁定由不做项转在册）。
- 2026-10-06：fix 轮（评审轮次 1 #10——批 `docs/batches/2026-10-06-first-release-completeness.md` §3）：§2 补「桶过期惰性清理」句（读写路径顺扫——重启清零同拍）。
- 2026-10-06：AC-13 行候补标记收正（父侧直接执行 · 机械 · 可 revert——已落需求档验收表）。
- 2026-10-06：实施后回填轮（R16——批 `docs/batches/2026-10-06-first-release-completeness.md`）：§2/§4 login-guard 标记翻正 + 行数按实读收正（**119** ∥ routes **98** ∥ routes-admin **61**；小计 ⇒ **632**）。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§2 事件日志句补审计同拍 ∥ 增 §2.1 审计事件（事件目录/逐点写入坐标/列表/边界）∥ §3 增 `GET /api/audit` 行 ∥ §4 预算（audit 新档 ≈90 ∥ routes ⇒ ≈112 ∥ routes-admin ⇒ ≈100 ∥ guard ⇒ ≈125 ∥ members ⇒ ≈165；小计 ⇒ ≈785）∥ §5 补 AC-15④ 候补行 ∥ §6 增 KD-SV-28 ∥ §7 增 N26/N28 ∥ B24/B25 ∥ E21 ∥ §8 边界随正。
- 2026-10-06：fix 轮（评审 #69——批 `docs/batches/2026-10-06-console-completeness-2.md` §3 十项，本档面）：§3 两行 key 行形收正（补 `lastUsedAt`/`windowTokens`——单源 = `memberView`；与 `metering/METERING.md` §4 AC-15⑥ 断言口径对齐）。
- 2026-10-07：配额分模型批设计轮（批 `docs/batches/2026-10-07-quota-per-model.md`——需求 §2:21 ∥ 台账 #992）——§3 三行随正（`GET /api/me` 字段 `quotaTokens` ⇒ `modelQuotas` ∥ `GET /api/members` 同拍 ∥ 配额端点指针 ⇒ `/api/members/:id/model-quotas`）；同源随动 = `metering/METERING.md` §2/§3 ∥ `store/STORE.md` §2 v5 段 ∥ `webui/WEBUI.md` §2.4②。
- 2026-10-07：fix 轮（评审 #126 #7——批 `docs/batches/2026-10-07-quota-per-model.md` §3，本档面）：§4 小计复算收正（≈785 + ≈37 ⇒ **≈822**——改前 ≈820 系加法口误）。
- 2026-10-07：配额 v2 · 成员模型面批设计轮（批 `docs/batches/2026-10-07-quota-v2-member-models.md`——需求 §2:23 ∥ 台账 #1002/#1003/#1004 + 并入 #1001/#994/#995/#988）——§2.1 边界句（成员配置写不入审计）∥ 增 §2.2（成员模型禁用：语义/存储/写面/读面/执行面/与配额关系/审计口径/边界——机制全文）∥ §3 端点表（`/api/me` 与 `/api/members` 行补 `modelUsage`/`modelDisables` ∥ 新增 `model-disables` 行）∥ §4 四行实读回基 + 小计 ⇒ ≈872 ∥ §5 增 AC-23 行 ∥ §6 增 KD-SV-42 ∥ §7 增 N29/N30 ∥ B26/B27 ∥ E22 ∥ §8 边界随正；同源随动 = `store/STORE.md` §2 v6 段 ∥ `gateway/API.md` §2.1 ∥ `webui/WEBUI.md` §2.4②。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-quota-v2-member-models.md` §3 六发现，本档面）：§5 AC-23 行「候补」标记收正（已落需求档——沿 AC-13/AC-14 先例）。
- 2026-10-07：me-keys 批设计轮（批 `docs/batches/2026-10-07-me-keys-redo.md`——需求 §2:25 ∥ 台账 #1023）——§1 签发/吊销句随正（多把并存 ∥ 轮转页面下架）+ 增 §1.1（key 自助面：命名 ∥ 上限 ∥ 吊销语义 ∥ 审计 ∥ 数据面 ∥ 边界）∥ §2.1 两写入点随正（key_issue/key_revoke——本人）∥ §3 增两行 + 三行行形随正 ∥ §4 两行预算 + 小计 ⇒ ≈953（上链无批名估算残留随正）∥ §5 增 AC-25 行 ∥ §6 增 KD-SV-48 ∥ §7 增 N31–N34 ∥ B28/B29 ∥ E23 ∥ §8 边界随正；同源随动 = `webui/WEBUI.md` §2.3⑥ ∥ `store/STORE.md` v8 段 ∥ `design/PROJECT.md` §4/§7。
- 2026-10-07：fix 轮（评审 #43——批 `docs/batches/2026-10-07-me-keys-redo.md` §3 七号落修；本档面 = #2）：命名面闭合——全部创建路径（自助签发 ∥ 轮换新签 ∥ CLI `key issue`）共用默认名助手（§1.1 增「命名落位」条 ∥ §1.1 端点行 ∥ §3 轮换行 `name` 落位同拍）∥ §5 AC-25 行增「空串零残留」断点（库内空串 = 仅限迁移前存量——v8 回填后零残留）；`store/STORE.md` 零动（不变量在闭合后成立）。
- 2026-10-09：fix 轮（射程外收口——承批 `docs/batches/2026-10-09-server-console-config.md` §3 轮 1 ∥ 同批修轮射程外发现）：审计面随 v10 十型——§2.1 事件目录增 `config_update` 行（actor = admin 名快照 ∥ detail = 键名清单、值永不入 ∥ 写入点 = `thincoder-server/src/gateway/config-admin.mjs`（拟新增））∥ 全档审计型表述随正为「十型」（§1.1 ∥ §2.1 边界 ∥ §5 AC-23/AC-25 ∥ §6 KD-SV-28/KD-SV-48 ∥ §7 N34）；同源 = `store/STORE.md` §2 v10 段。
- 2026-10-09（**server-model-alias 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-model-alias.md` §2 · 台账 #1153 + 并入 #1008；需求 §2:29 + AC-29）：§2.2 语义/写面条随正（外标 = 别名 ∥ `provider/model`；键形 = 非空 ∥ 无首尾空白 ∥ 含斜杠两段非空——裸名合法；首尾空白 400——#1008 收正）∥ §3 `GET /api/me` 同拍句 + `model-disables` 行键形 ∥ §5 AC-23 行键形收正 + 增 AC-29④ 行 ∥ §7 B27 重写 + 增 N35 ∥ §8 增成员键别名面不做句。**产品码零触（设计轮）**。
- 2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §1 · 台账 #1212；需求 §2:31 + AC-31）：§1 增**客户端登录签发路径**条（签发 = 一枚具名 key ∥ 端标签落 `name` ∥ 不设过期 ∥ 免 20 上限 ∥ 审计两型沿用）∥ §3 增客户端面端点指针行 ∥ §5 增 AC-31 行；同源 = `client/CLIENT.md`（新档）。**产品码零触（设计轮）**。
- 2026-10-10（**team-login-client-access 批（B1）· 设计评审轮 1 修正（fix 轮 · 发现 4）· eng-designer**——承批档 §3 轮次 1 · 台账 #1212）：§2.1 审计事件目录四行（`login_success` ∥ `login_failure` ∥ `key_issue` ∥ `key_revoke`）detail 列补 `surface?` + 取值域注（客户端面 = `"client"`；余面键缺席）——与 §1 客户端登录条 ∥ `client/CLIENT.md` §1 逐字同拍。**零新语义**（评审发现的直接导出项）。
- 2026-10-10（**server-exec-sandbox 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 · 台账 #1224）：§1 增**沙盒工作区 key**条（复用本表 key 面——具名 `sandbox:<ws>` ∥ 免 20 上限 ∥ 明文另存 ∥ 轮换口径）∥ §2.1 事件目录增两型（`sandbox_rule` ∥ `sandbox_event`——写入点坐标）+ 型面现状句（**十二型**——v11 重建）∥ §1/§2.1 两处「十型零增」计数随正；同源 = `store/STORE.md` §2 v11 段 ∥ `sandbox/SANDBOX.md` §2/§7。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · 残差对齐（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 残差项 ②；父侧裁定：收口前对齐）：§3 前言补写端点 JSON 门例外括注——**例外** = `POST /api/runner/checkpoint`（octet-stream——`gateway/API.md` §2.6）；与 `client/CLIENT.md` §2 ∥ `metering/METERING.md` §3 逐字同拍。**零新语义**（KD-SV-77 路由级豁免的残差对齐）。
