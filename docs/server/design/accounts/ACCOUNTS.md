# Thincoder Server · 账号与登录（accounts/ACCOUNTS）

> 板块 = server ∥ 本档 = accounts 域（团队 key ∥ 账号/成员 ∥ 会话/登录 ∥ 密码 scrypt/改密/重置）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 1 ∥ 5 ∥ 7 ∥ 15④）；本域回指 = `PROJECT.md` §7（AC-1 ∥ AC-5 ∥ AC-7 ∥ AC-15④ 判据 = 本档 §5）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 团队 key 面

- 形态：`sk-tc-` + 32 字节随机（base64url，43 字符）；签发 = **明文回显仅一次**（页面 ∥ CLI 同语义；此后任何接口/列表只回显提示形 `sk-tc-ab12cd…wxyz`）。
- 存储：`sha256(明文)` hex 单列唯一索引；库内**无明文**（DDL = `store/STORE.md` §2）。
- 签发 ∥ 吊销：页面（自助轮转 §3 ∥ admin 吊销 §3）与本机 CLI（`ops/OPS.md` §3）——同库同语义；吊销 = `status` 置 `revoked`（软删、行保留）；签发 = 新行（**轮转 = 新签 + 吊销旧**——不做同 key 换 hash）。
- 校验：每请求查库（唯一索引查找——无内存缓存）⇒ **吊销下一次请求即 401**（AC-5 结构性成立）——KD-SV-11（§6）。

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

- **形态**：事件落库（`audit_events` 表——`store/STORE.md` §2 v3 段）；写入口 = `thincoder-server/src/accounts/audit.mjs`（拟新增——`recordAudit` ∥ `queryAudit` ∥ `pruneAuditEvents`）；保留 = 与用量同窗同清（`usageRetentionDays`；启动一次 + 24h 同调度点——`metering/METERING.md` §1）。
- **名快照**：`actor_name` ∥ `target_name` = 落库时点名（改名后记录仍可读；列无 FK——历史记录自足，不约束成员生命周期）。
- **CLI 口径**：本机操作（无会话）⇒ `actor_name = "cli"`（`actor_id` NULL）。
- **事件目录与写入点（逐点——既有函数/路由坐标）**：

| 类型 | 主体（actor） | 对象（target） | detail JSON | 写入点（现值坐标） |
|---|---|---|---|---|
| `login_success` | 登录者 username | —— | `{ ip }` | `thincoder-server/src/accounts/routes.mjs` POST /api/login 成功路径（`recordSuccess` 后） |
| `login_failure` | 提交用户名（成员存在 ⇒ 其 id） | —— | `{ ip }` | 同上——失败路径（`recordFailure` 侧） |
| `login_locked` | 提交用户名 | —— | `{ ip, dimension, retryAfterS }` | `thincoder-server/src/accounts/login-guard.mjs` 置锁处——经 `onLock` 回调（装配接线 = `thincoder-server/bin/thincoder-server.mjs` 建守卫处） |
| `key_rotate` | 本人 | —— | `{ keyHint }` | `thincoder-server/src/accounts/routes.mjs` POST /api/me/keys/rotate |
| `key_issue` | 成员 ∥ `cli` | —— | `{ keyHint }` | `thincoder-server/src/ops/cli.mjs` `key issue` |
| `key_revoke` | admin ∥ `cli` | key 失主 | `{ keyHint }` | `thincoder-server/src/accounts/routes-admin.mjs` 吊销路由 ∥ `thincoder-server/src/ops/cli.mjs` `key revoke` |
| `password_change` | 本人 | —— | —— | `thincoder-server/src/accounts/routes.mjs` POST /api/me/password |
| `password_reset` | admin ∥ `cli` | 目标成员 | —— | `thincoder-server/src/accounts/routes-admin.mjs` 重置路由 ∥ `thincoder-server/src/ops/cli.mjs` `member passwd` |
| `member_create` | admin ∥ `cli` | 新成员 | `{ role }` | `thincoder-server/src/accounts/routes-admin.mjs` 建成员路由 ∥ `thincoder-server/src/ops/cli.mjs` `member add` |

- **「成员删」= 零写入点**：全库零成员删除路径（实核）；审计面只覆盖「增」——需求措辞面（「成员增删」含删）已上抛披露（成员删除功能本身不在任何功能点内）。
- **列表**：`GET /api/audit`（admin——§3 端点表）；过滤 = 类型 ∥ 成员 ∥ 时段（`member` 取 id ∥ 展示名——解析同 usage 口径；匹配 `actor_id` ∥ `target_id`）。
- **边界**：不做告警推送 ∥ 不做事件导出 ∥ 不做不可篡改/防删面（库文件权限自担——内网工具面）；OpenAI 请求不入审计（= 用量面——`metering/METERING.md` §1）。

## 3. 端点表（`/api/*`——登录 ∥ 自助 ∥ 管理）

（错误形 = `gateway/API.md` §3；写端点仅收 `application/json`，其它 content-type ⇒ 400）

| 方法 + 路径 | 鉴权/角色 | 语义 |
|---|---|---|
| `POST /api/login` | 公开 | 登入：`{username, password}` ⇒ 200 + `Set-Cookie`（会话）；失败 ⇒ 401 `invalid_credentials`；锁定期 ⇒ **429 `too_many_attempts`** + `Retry-After`（两维同文案——防枚举面保持，§2） |
| `POST /api/logout` | 会话 | 销当前会话（删行 + 清 cookie） |
| `GET /api/me` | 会话 | 本人信息（`id ∥ name ∥ username ∥ role ∥ quotaTokens ∥ usedTokens`）+ 本人 key 清单（行形 = `memberView`：`{ id, hint, lastUsedAt, windowTokens }`——提示形 + id ∥ 最后使用 ∥ 近 30 天用量） |
| `POST /api/me/password` | 会话 | 自助改密：`{oldPassword, newPassword}`；旧密错 ⇒ 401 `invalid_credentials`；成功 ⇒ 吊销本人其他会话（当前保留） |
| `POST /api/me/keys/rotate` | 会话 | 轮转本人 key：新签 + 吊销旧（无旧 ⇒ 等同首签）；新明文一次性回显（同 §1 语义） |
| `GET /api/members` | admin | 全队成员 + 额度 + 本月已用 + 各成员 key 清单（行形同 `GET /api/me`——单源 = `memberView`：提示形 + id ∥ `lastUsedAt` ∥ `windowTokens`；仅列未吊销） |
| `POST /api/members` | admin | 建成员：`{username, name?, role?}` ⇒ 一次性临时密码回显（服务器生成——同签发语义） |
| `POST /api/members/:id/keys/:keyId/revoke` | admin | 吊销指定 key（立即生效） |
| `POST /api/members/:id/password-reset` | admin | 重置密码（KD-SV-14——在）：一次性临时密码回显 + 吊销该成员全部会话；旧密即失效（首登后应自助改密——页面提示，不强制门） |
| `GET /api/audit` | admin | 审计事件列表（过滤：type ∥ member ∥ from ∥ to ∥ limit——缺省 100 ∥ 上限 500，沿用量口径）；返回 `{ events: [ { id, ts, type, actor, actorId, target, targetId, detail } ] }`（倒序——新在前；`detail` = 解码对象；类型枚举 = §2.1） |

- 用量与配额端点（`/api/me/usage` ∥ `/api/usage` ∥ `/api/members/:id/quota`）= `metering/METERING.md` §3。
- provider 管理端点（`/api/admin/providers/*`）= `gateway/API.md` §2.2——判权同本表口径（`requireAdmin`：`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401；写端点 JSON 型门同前言）。
- **双角色规则**：角色判定与写权限强制在服务端（页面显隐非判据）；`user` 触管理端点 ⇒ 403 `forbidden`；admin 兼有自助面；无 ∥ 过期会话 ⇒ 401 `unauthorized`。
- **跨站防护**：`SameSite=Strict`（跨站不携 cookie）+ 写端点仅 JSON + 无 CORS 放行头。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/accounts/keys.mjs`（已落盘） | **98**（实读 2026-10-06——本批零动） | key 校验 ∥ key 签发/吊销/轮转（页面与 CLI 共用） |
| `thincoder-server/src/accounts/members.mjs`（已落盘） | **161 ⇒ ≈165**（实读 2026-10-06——本批 +≈4 = `countMembers`（总览读数）） | 成员 CRUD ∥ scrypt 散列/校验 ∥ 角色 ∥ 临时密码 ∥ 首启引导 |
| `thincoder-server/src/accounts/session.mjs`（已落盘） | **95**（实读 2026-10-06——本批零动） | 会话签发/校验/吊销 ∥ cookie 序列化/解析 ∥ 过期清理 |
| `thincoder-server/src/accounts/routes.mjs`（已落盘） | **98 ⇒ ≈112**（实读 2026-10-06——本批 +≈14 = 登录成/败审计写 ∥ 轮换/改密审计写 ∥ `memberView` key 行归并（`lastUsedAt`/`windowTokens`）） | 自助端点：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate |
| `thincoder-server/src/accounts/routes-admin.mjs`（已落盘） | **61 ⇒ ≈100**（实读 2026-10-06——本批 +≈39 = 三处审计写（建/吊销/重置） ∥ `GET /api/audit` 注册行（过滤三轴）） | 管理端点：members 列表/建 ∥ 吊销 ∥ 重置 ∥ 审计列表 |
| `thincoder-server/src/accounts/login-guard.mjs`（已落盘） | **119 ⇒ ≈125**（实读 2026-10-06——本批 +≈6 = `onLock` 回调（置锁处）） | 登录防爆破 |
| `thincoder-server/src/accounts/audit.mjs`（拟新增） | **≈90**（设计估——`recordAudit` ∥ `queryAudit`（过滤/分页） ∥ `pruneAuditEvents` ∥ 行解码） | 审计事件（§2.1） |
| **小计** | **≈570 ⇒ 493 ⇒ 632 ⇒ ≈785**（#963 实读：+139；本批 +≈153） | —— |

## 5. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-1（功能点 1） | 无 Authorization ∥ 未知 key ∥ 吊销 key ⇒ **401 + `invalid_api_key`**；持有效团队 key 经 mock 上游完成一次请求 ⇒ 200 | 批内件 |
| AC-5（功能点 5） | 吊销后**下一次请求** ⇒ 401（无缓存路径——查库即判） | 批内件 |
| AC-7（功能点 7——B 案） | ① 正确凭据登录 ⇒ 200 + 会话 cookie；错凭据（含不存在用户）⇒ 401 `invalid_credentials`（同措辞）② 无/过期会话访问 `/api/me` ∥ `/api/usage` ⇒ 401 `unauthorized` ③ `user` 会话调管理写（建成员 ∥ 配额 ∥ 吊销 ∥ 重置）⇒ 403 `forbidden`（服务端判）④ 自助改密 ⇒ 旧密登录失败 + 新密登录成功 + 本人其他会话失效（当前保留）⑤ admin 重置 ⇒ 旧密失效 + 临时密码可登（一次性回显——同签发语义）⑥ 自助轮换 ⇒ 新 key 通行 + 旧 key 下一请求 401 ⑦ 首启引导幂等（零 admin + 配置 ⇒ 建；再启动 ⇒ 不重建不改密——机制 = `ops/OPS.md` §2） | 批内件 |
| AC-13②（功能点 12——登录防爆破；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 5 连败（同用户名）⇒ 第 6 次（含正确密码）⇒ 429 `too_many_attempts` + `Retry-After`（秒）；锁窗过后 ⇒ 正确密码 200；成功 ⇒ 清计；IP 维 20 阈值（`trustProxy` 下取 `X-Real-IP`）；不存在用户名同锁（枚举零差——措辞/计时面）；admin 重置 ⇒ 该用户名锁清（旧密 401、临时密码 200）；锁触发日志 `login_throttled` 在册 | 批内件 |
| AC-15④（功能点 15——审计/安全面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 事件落库（逐写入点实走 ⇒ 各型行在场：登录成/败/锁 ∥ 轮换/签发/吊销 ∥ 改密/重置 ∥ 建成员——含 CLI 面 `actor=cli`）∥ 列表过滤（类型 ∥ 成员 ∥ 时段逐轴生效）∥ 失败登录可见（N 连败 ⇒ `login_failure` 行 + 第 5 次起 `login_locked` 行）∥ 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ 保留清理（注入时钟 ⇒ 窗外删——同窗接线） | 批内件 |

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
| KD-SV-28 | **审计事件 = 库表（v3）+ 名快照 + 与用量同保留窗**：`audit_events`（九型 CHECK）；写入口 = `thincoder-server/src/accounts/audit.mjs`（拟新增——`recordAudit` 由调用侧显式传型/主体——HTTP 路由与 CLI 同覆盖）；列表 = `GET /api/audit`（admin——过滤三轴）；清理复用 `usageRetentionDays` 与调度点 | 浏览器可读（审计页）+ 过滤 ∥ 库表 = 与全系统同库单源；快照名 = 改名后记录仍自足（列无 FK——不约束成员生命周期）；同窗单旋钮 = 保留治理一处配置；CLI 覆盖 = 本机改动也入审计（单点漏检面） | 日志文件（控制台不可读 ∥ 无过滤 ∥ 轮转面）· 内存（重启清零）· 独立保留窗配置（口径分裂——两窗默认值不同徒增疑问）· 服务层函数内隐式落库（`setMemberPassword` 三调用方异型——无法区分自助/重置/CLI） |

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

## 8. 本域边界（不做的面）

- 组织架构同步 ∥ SSO ∥ 双因素 ∥ **密码找回**（需外部通道（邮件/短信）——「团队协同」步再议；**改密 = 在**——自助 ∥ admin 重置）。
- 密码复杂度策略（仅最小长度 8） ∥ 会话管理面（会话列表 ∥ 多端踢出——改密/重置吊销属被动机制） ∥ 登录防护不做：跨重启持久锁 ∥ IP 黑白名单/验证码 ∥ 改密/重置端点的失败限速（需已持会话——在案） ∥ 离线撞库（防线外）。
- 角色只两级（admin ∥ user——不做细粒度权限/自定义角色）。
- 审计面不做：告警推送 ∥ 事件导出 ∥ 不可篡改/防删面（库文件权限自担）；OpenAI 请求不入审计（= 用量面）。

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
