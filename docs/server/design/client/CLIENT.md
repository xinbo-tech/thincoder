# Thincoder Server · 客户端接入（client/CLIENT）

> 板块 = server ∥ 本档 = client 域（客户面登录 ∥ 客户端 token ∥ `/api/client/*` 数据面命名空间骨架）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 31 ∥ AC-31）；本域回指 = `PROJECT.md` §7（AC-31 判据 = 本档 §4）。
> 端侧机制单源 = `docs/core/design/TEAM.md`（登录流程 ∥ 派生 provider ∥ 三端同构——本档不复制）。
> 建档：2026-10-10（批 `docs/batches/2026-10-10-team-login-client-access.md` 设计轮 · eng-designer · 台账 #1212）——B1 批：三端（CLI ∥ VSC ∥ 桌面）登录入口 + 客户端数据面骨架。

## 1. 客户端 token 面

- **形**：登录 token = **一枚具名成员 key**（落 `api_keys` 表——形 `sk-tc-` + 32 字节随机 base64url；存储 = `sha256(明文)` hex；明文仅登录响应回显一次——同 key 签发语义）。全文 = §5 KD-SV-61。
- **端标签**：落 `api_keys.name`（如 `CLI@台式机`；端侧生成 ∥ 服务端校验沿用 key 名口径——trim 后 ≤40 字符；缺省/空 ⇒ 默认名助手 `key-N`——单源 = `accounts/ACCOUNTS.md` §1.1）。
- **不设过期**：`api_keys` 无过期列——天然成立；**逐请求查库**（KD-SV-11 不变——吊销下一次请求即判）。
- **签发 ∥ 吊销**：每次登录签发一枚（**不受 20 上限**——沿「轮转 ∥ CLI 不受限」先例，`accounts/ACCOUNTS.md` §1.1）；退出 = 吊销该枚（软删——行保留）；不自动清理旧 token（「列表可撤销」= 用户面机制——口径①）。
- **已认账（token 生命周期——口径①）**：累积可预期（每次登录一枚 ∥ 无过期 ∥ 不自动清理）——清理 = 用户面（key 列表逐把吊销——§1「列表可撤销」面）；换 server 重登（单登录态覆盖）⇒ 旧 server 的 token 不在本机——撤销径 = 旧 server 控制台 key 列表（`webui/WEBUI.md` §2.3⑥ ∥ `GET /api/me` ∥ CLI `key revoke`）。
- **兼作 `/v1` 凭据**：同一 token 两用——`/api/client/*`（数据面，本档）∥ `/v1/*`（模型面，`gateway/API.md` §2）；校验单源 = `verifyKey`（账号 key 面）；客户端面门面 = 复用 `requireApiKey`（`thincoder-server/src/gateway/routes.mjs:25`）。**无第二校验面**。
- **列表可撤销**：token 即具名 key——列表/吊销面 = 既有「我的 · key」页（`webui/WEBUI.md` §2.3⑥）∥ `GET /api/me` 成员行 key 清单 ∥ CLI `key list` / `key revoke`（`ops/OPS.md` §3）；**零新列表端点**。
- **与控制台会话面关系**：`sessions` 表（浏览器 cookie 面——KD-SV-12）**零改、零复用**——客户端登录不落 `sessions` 表；两族凭证物理分离（cookie ∥ `Authorization: Bearer`）保持（理由 = §5 KD-SV-61 被否候选栏）。
- **审计**：登录成/败 = 既有 `login_success` / `login_failure`（detail 携 `surface:"client"`）；签发/吊销 = 既有 `key_issue` / `key_revoke`（detail 同携 surface）；**审计十型零增**（零迁移）。

## 2. 端点表（`/api/client/*`——数据面命名空间骨架）

（错误形 = `gateway/API.md` §3 全码复用——**零新码**；写端点仅收 `application/json`，其它 content-type ⇒ 400——分派层统一）

| 方法 + 路径 | 鉴权 | 语义 |
|---|---|---|
| `POST /api/client/login` | 公开 | 端侧直登：`{username, password, label?}` ⇒ 200 `{ok:true, token, member:{id,name,username,role}}`（token 明文一次性）；失败 ⇒ 401 `invalid_credentials`（同措辞——防枚举面保持）；锁定期 ⇒ 429 `too_many_attempts` + `Retry-After`（沿 `login-guard` 双维锁——`accounts/ACCOUNTS.md` §2）；体非法 ∥ 缺字段 ∥ label 非法 ⇒ 400 `invalid_request_error` |
| `POST /api/client/logout` | 登录 token | 退出：吊销当前 token 对应 key 行（`revokeKey`——立即生效）⇒ 200 `{ok:true}`；无 ∥ 无效 token ⇒ 401 `invalid_api_key`（端侧视同「已失效」——照清本地） |
| `GET /api/client/me` | 登录 token | 当前登录读数：`{member:{id,name,username,role}, token:{label, createdAt}}`——供端侧校验 token 仍有效 ∥ 当前态显示 |

- **命名空间**：客户端数据面 = `/api/client/*`（`EVOLUTION.md` §2 决策点「客户端数据面命名空间」本批钉死）；后续团队面（台账 ∥ 记忆 ∥ 在场 ∥ 会话）同命名空间扩端点——各面设计轮落。
- **角色**：本阶段零角色判定（任何成员可用）；admin 专属面 = 后续各面自定。
- **注册面**：`thincoder-server/bin/thincoder-server.mjs` 一行注册（沿既有注册行制——装配面 = `registerClientRoutes`（拟新增））。
- **判权口径**：无 ∥ 无效 token ⇒ 401 `invalid_api_key`（三态不区分——防信息泄露，沿 /v1 面）。

## 3. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/client/routes.mjs`（拟新增） | **≈75**（设计估——login ∥ logout ∥ me 三处理 + 注册行；复用 members/keys/guard/audit 单源） | 客户端面（§1 ∥ §2） |
| `thincoder-server/bin/thincoder-server.mjs`（已落盘） | **182 ⇒ ≈184**（实读 2026-10-10——+import 一行 +注册一行） | 装配面 |
| **小计** | **≈257** | —— |

- `thincoder-server/package.json` ±0（`prepublishOnly` 清单 38 ⇒ **39**——本批件入链；单行清单行数零变）；**store 域零改**（零迁移——结构版本保持 v10）。
- 批内件：`docs/batches/2026-10-10-team-login-client-access.test.mjs`（服务端面——估 ≈260 行）。

## 4. 验收判据（机检面——回指 AC-31）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-31①（三端登录入口在册） | 端侧面 = `docs/core/design/TEAM.md` §5；服务面 = login 端点三态（200 ∥ 401 ∥ 429——§6 用例 N37/B27） | 批内件 + 收口轮 |
| AC-31②（token 落本地 ∥ 明文密码零落盘） | login 200 携 `token`（仅一次回显）∥ 服务端库存 hash（实读 `api_keys.key_hash` 行在场）∥ 端侧零密码字段（`docs/core/design/TEAM.md` §5） | 批内件 |
| AC-31③（登录后自动 provider——模型可用） | 服务面：该 token 对 `/v1/models` 与 `/v1/chat/completions` 可用（同 key 面判据——`gateway/API.md` §2）；端侧派生条目面 = `docs/core/design/TEAM.md` §5 | 批内件 + 收口轮 |
| AC-31④（未登录 ⇒ 团队各面不启用） | 端侧登录态门 = `docs/core/design/TEAM.md` §5；服务面 = 无 token 请求 `/api/client/*` ⇒ 401 | 批内件 + 收口轮 |
| AC-31⑤（退出 ⇒ 登录 token 吊销（`api_keys` 行）+ 团队面关闭） | logout ⇒ 该 token 下一次 `/api/client/*` 与 `/v1/*` 请求 ⇒ 401（吊销即判——无缓存）；端侧关闭面 = `docs/core/design/TEAM.md` §5 | 批内件 + 收口轮 |

## 5. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-61 | **客户端 token = 一枚具名成员 key**（`api_keys` 行；端标签落 `name`；无过期天然；`/api/client/*` 与 `/v1/*` 同源校验） | ① token 须兼作 /v1 凭据（AC-31③「模型可用」）——校验/记账/配额/归因全链零改（`usage.key_id` 引用天然成立）；② 「不设过期」= api_keys 无过期列（零改）；③ 「端标签 + 列表可撤销」= `name` + 既有列表面（`/api/me` ∥ key 页 ∥ CLI）——零新设施；④ 单秘密（一次登录一枚——口径①） | **新表 `client_tokens`**（token 独立——/v1 面须第二校验面或映射；记账 key 归因无着落；两套凭证语义——否）· **复用 `sessions` 表**（7 天绝对过期与「不设过期」相抵；浏览器 cookie 语义与端侧持久 token 混装——否）· token 兼 session + 另发 key（每次登录两枚秘密——与「发一个」口径相抵——否） |
| KD-SV-62 | **客户端数据面命名空间 = `/api/client/*`**（骨架 = login ∥ logout ∥ me；鉴权 = 登录 token（Bearer——`requireApiKey` 单源复用）） | ① `EVOLUTION.md` §2「客户端数据面命名空间」决策点本批钉死——后续团队四面同空间扩；② 鉴权单源 = 账号 key 校验——零第二校验面；③ 与 `/api/*`（会话 cookie 面）∥ `/v1/*`（模型面）三分清晰 | `/api/team/*`（语义窄化——台账/记忆非「team 专属」义——否）· 并入 `/api/*` 会话面（cookie 与 Bearer 混面——判权分族乱——否） |

## 6. 用例（本域 · 批内件）

| # | 用例 | 判据 |
|---|---|---|
| N37 | login 成功 ⇒ 200 携 token；`api_keys` 新行（name = label ∥ key_hash = sha256(token)）；审计 `login_success` + `key_issue` 各一行 | 批内件 |
| B27 | 错密码 ∥ 不存在用户 ⇒ 401 同措辞；5 连败 ⇒ 429 + `Retry-After`；label 缺省 ⇒ 默认名 `key-N`；label >40 字符 ⇒ 400 | 批内件 |
| E28 | logout ⇒ 吊销；再请求（`/api/client/me` ∥ `/v1/models`）⇒ 401；已吊销再 logout ⇒ 401（端侧清本地语义） | 批内件 |
| N39 | token 兼用：`GET /api/client/me` ∥ `GET /v1/models` 同 token 皆 200 | 批内件 |

## 7. 本域边界（不做）

- 不做 token 过期/续期 ∥ 不做逐端吊销之外的复杂度 ∥ 不做授权码/device-flow（已搁置） ∥ 不做离线缓存（需求 §3）。
- 不做客户端面角色/管理端点（后续面自定） ∥ 不做控制台新页（口径④——控制台未登录自然不可见）。
- 不做登录 token 与手工 key 的区分列（登录 token 在既有 key 列表自然可见；如需区分标记 ⇒ 另轮）。
- 不触 `sessions` 表 ∥ 不触登录守卫/审计机制 ∥ 零迁移。

## 变更记录

- 2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer**——承 `docs/batches/2026-10-10-team-login-client-access.md` §1 · 台账 #1212；需求 §2:31 + AC-31）：建档——客户端 token 面（token = 具名成员 key）∥ `/api/client/*` 骨架（login ∥ logout ∥ me）∥ 端点表 ∥ 文件预算 ∥ 验收判据（AC-31）∥ 决策 KD-SV-61/62 ∥ 用例 ∥ 边界。实施 = 本批实施轮。
- 2026-10-10（**team-login-client-access 批（B1）· 设计评审轮 1 修正（fix 轮 · 发现 9）· eng-designer**——承批档 §3 轮次 1 · 台账 #1212）：§1 增 token 生命周期**已认账**条（累积可预期 ∥ 用户面清理；换 server 重登旧 token 处置）——文案面，零机制改。**零新语义**（评审发现的直接导出项）。
- 2026-10-10（**B1 批 · 评审回笔随动（发现 2 呼应）· eng-designer**——承批档 §3 发现 2（需求档已由主 agent 收正——`docs/server/requirements/PROJECT.md` §2:31③ ∥ AC-31）：§4 AC-31⑤ 行标题随正——「服务端会话撤销」⇒「登录 token 吊销（`api_keys` 行）」（与需求档收正句逐字同拍；机制面零改）。**零新语义**。
- 2026-10-10（**server-exec-sandbox 批 · 残差对齐（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 残差项 ②；父侧裁定：收口前对齐）：§2 前言补写端点 JSON 门例外括注——**例外** = `POST /api/runner/checkpoint`（octet-stream——`gateway/API.md` §2.6）；与 `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3 逐字同拍。**零新语义**（KD-SV-77 路由级豁免的残差对齐）。
- 2026-10-10（**runner-admin-console 批 · 设计档随正 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252）：§2 前言去端点 JSON 门例外括注（随执行面重定——`gateway/API.md` §2.6 退场）；与 `accounts/ACCOUNTS.md` §3 ∥ `metering/METERING.md` §3 逐字同拍。**零新语义**。
