# Thincoder Server · 账号与登录（accounts/ACCOUNTS）

> 板块 = server ∥ 本档 = accounts 域（团队 key ∥ 账号/成员 ∥ 会话/登录 ∥ 密码 scrypt/改密/重置）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 1 ∥ 5 ∥ 7）；本域回指 = `PROJECT.md` §7（AC-1 ∥ AC-5 ∥ AC-7 判据 = 本档 §5）。
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
- **首个 admin**：首启引导建（`ops/OPS.md` §2——幂等）；本档只管账号数据形。

## 3. 端点表（`/api/*`——登录 ∥ 自助 ∥ 管理）

（错误形 = `gateway/API.md` §3；写端点仅收 `application/json`，其它 content-type ⇒ 400）

| 方法 + 路径 | 鉴权/角色 | 语义 |
|---|---|---|
| `POST /api/login` | 公开 | 登入：`{username, password}` ⇒ 200 + `Set-Cookie`（会话）；失败 ⇒ 401 `invalid_credentials` |
| `POST /api/logout` | 会话 | 销当前会话（删行 + 清 cookie） |
| `GET /api/me` | 会话 | 本人信息（`id ∥ name ∥ username ∥ role ∥ quotaTokens ∥ usedTokens`）+ 本人 key 清单（提示形） |
| `POST /api/me/password` | 会话 | 自助改密：`{oldPassword, newPassword}`；旧密错 ⇒ 401 `invalid_credentials`；成功 ⇒ 吊销本人其他会话（当前保留） |
| `POST /api/me/keys/rotate` | 会话 | 轮转本人 key：新签 + 吊销旧（无旧 ⇒ 等同首签）；新明文一次性回显（同 §1 语义） |
| `GET /api/members` | admin | 全队成员 + 额度 + 本月已用 + 各成员 key 清单（`[{ "id", "hint" }]`——提示形 + id；仅列未吊销） |
| `POST /api/members` | admin | 建成员：`{username, name?, role?}` ⇒ 一次性临时密码回显（服务器生成——同签发语义） |
| `POST /api/members/:id/keys/:keyId/revoke` | admin | 吊销指定 key（立即生效） |
| `POST /api/members/:id/password-reset` | admin | 重置密码（KD-SV-14——在）：一次性临时密码回显 + 吊销该成员全部会话；旧密即失效（首登后应自助改密——页面提示，不强制门） |

- 用量与配额端点（`/api/me/usage` ∥ `/api/usage` ∥ `/api/members/:id/quota`）= `metering/METERING.md` §3。
- **双角色规则**：角色判定与写权限强制在服务端（页面显隐非判据）；`user` 触管理端点 ⇒ 403 `forbidden`；admin 兼有自助面；无 ∥ 过期会话 ⇒ 401 `unauthorized`。
- **跨站防护**：`SameSite=Strict`（跨站不携 cookie）+ 写端点仅 JSON + 无 CORS 放行头。

## 4. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/accounts/keys.mjs`（已落盘） | **98**（实读 2026-10-06——设计估 ≈120） | key 校验 ∥ key 签发/吊销/轮转（页面与 CLI 共用） |
| `thincoder-server/src/accounts/members.mjs`（已落盘） | **161**（实读 2026-10-06——设计估 ≈90） | 成员 CRUD ∥ scrypt 散列/校验 ∥ 角色 ∥ 临时密码 ∥ 首启引导 |
| `thincoder-server/src/accounts/session.mjs`（已落盘） | **95**（实读 2026-10-06——设计估 ≈90） | 会话签发/校验/吊销 ∥ cookie 序列化/解析 ∥ 过期清理 |
| `thincoder-server/src/accounts/routes.mjs`（已落盘） | **81**（实读 2026-10-06——设计估 ≈150） | 自助端点：login ∥ logout ∥ me ∥ me/password ∥ me/keys/rotate |
| `thincoder-server/src/accounts/routes-admin.mjs`（已落盘） | **58**（实读 2026-10-06——设计估 ≈120） | 管理端点：members 列表/建 ∥ 吊销 ∥ 重置 |
| **小计** | **≈570 ⇒ 493** | —— |

## 5. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-1（功能点 1） | 无 Authorization ∥ 未知 key ∥ 吊销 key ⇒ **401 + `invalid_api_key`**；持有效团队 key 经 mock 上游完成一次请求 ⇒ 200 | 批内件 |
| AC-5（功能点 5） | 吊销后**下一次请求** ⇒ 401（无缓存路径——查库即判） | 批内件 |
| AC-7（功能点 7——B 案） | ① 正确凭据登录 ⇒ 200 + 会话 cookie；错凭据（含不存在用户）⇒ 401 `invalid_credentials`（同措辞）② 无/过期会话访问 `/api/me` ∥ `/api/usage` ⇒ 401 `unauthorized` ③ `user` 会话调管理写（建成员 ∥ 配额 ∥ 吊销 ∥ 重置）⇒ 403 `forbidden`（服务端判）④ 自助改密 ⇒ 旧密登录失败 + 新密登录成功 + 本人其他会话失效（当前保留）⑤ admin 重置 ⇒ 旧密失效 + 临时密码可登（一次性回显——同签发语义）⑥ 自助轮换 ⇒ 新 key 通行 + 旧 key 下一请求 401 ⑦ 首启引导幂等（零 admin + 配置 ⇒ 建；再启动 ⇒ 不重建不改密——机制 = `ops/OPS.md` §2） | 批内件 |

## 6. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-7 | **管理/自助面 = 登录制页面（会话 cookie + 角色分面：user 自助 ∥ admin 管理）+ 本机运维 CLI 兜底** | B 案（用户 08:04）——管理页（受登录门禁）承载管理写面（建成员 ∥ 配额 ∥ 吊销 ∥ 重置）；会话与团队 key 两族鉴权物理分离（cookie ∥ Bearer）；CLI 降本机兜底但保留全能力（同库同语义） | `admin.token` 门禁区保留（二套并存——无正交价值）· 管理写面只走 CLI（B 案点名页面管成员——已越）· 会话混用 `Authorization` 头（与团队 key 混族——读端点无法按头分族） |
| KD-SV-11 | **团队 key 校验 = 逐请求查库（无缓存）** | 吊销即时生效（AC-5）零失效逻辑；单索引查询成本可忽略（团队量级） | 内存缓存（失效/失效传播复杂度——无收益） |
| KD-SV-12 | **会话形 = HttpOnly cookie**（`tc_session`；`SameSite=Strict`；7 天绝对过期）；`sessions` 表存 `sha256(令牌)`——逐请求查库（同 key 纪律） | 与团队 key 物理分族（`Authorization: Bearer` 只属 OpenAI 面）∥ 浏览器原生携带、页面零令牌存储（HttpOnly——JS 不可读）∥ `SameSite=Strict` + 写端点仅 JSON ⇒ 免 CSRF 令牌 | Bearer 会话令牌（localStorage——与团队 key 共头形；XSS 可取）· 签名自持令牌（无状态——吊销不即时，与逐请求查库纪律相抵）· 内存会话表（重启全登出 ∥ 与库单源相抵） |
| KD-SV-13 | **密码散列 = scrypt**（`node:crypto`；N=16384 ∥ r=8 ∥ p=1 ∥ keyLen=32 ∥ salt 16B 随机；异步变体）；编码串 `scrypt$N$r$p$salt$hash`（自描述——参数可升）；校验 `timingSafeEqual`；密码最小长度 8 | 零依赖（node 内建）∥ 慢因子抗离线爆破 ∥ 异步变体不阻塞事件循环（同进程中继不抖动）∥ 自描述编码串免参数考古 | 裸 sha256（无慢因子）· bcrypt/argon2（第三方——违零依赖）· 同步 scrypt（阻塞 50–100ms——中继受扰） |
| KD-SV-14 | **admin 重置成员密码 = 在**（用户 2026-10-06 08:06 定）；语义 = 服务器生成**一次性临时密码**（回显一次——同签发语义）+ 吊销该成员全部会话；首登后应自助改密（页面提示——不设强制门） | 忘密唯一兜底（找回 = 不做项——无外部通道）∥ 一次性临时密码 = 管理侧零知情（admin 不见成员自设密码）∥ 与 key 签发同语义——两族凭证一致 | admin 直接设新密（admin 知晓成员密码——凭据卫生否）· 自助找回（邮件/短信——不做项）· 不落（兜底缺——忘密只剩本机 shell） |
| KD-SV-16 | **管理面 key 枚举 = `GET /api/members` 成员行内附清单**（提示形 + id；仅列未吊销）——不设 `/api/members/:id/keys` 子资源 | 管理页一次装配（成员表 + 吊销控件同响应——vanilla 前端一跳）；与 `GET /api/me`「本人信息 + key 清单」同形；端点面零增 | 独立子资源（`GET /api/members/:id/keys`——页面 N+1 请求 ∥ 无其它消费方，吊销流多一跳） |

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

## 8. 本域边界（不做的面）

- 组织架构同步 ∥ SSO ∥ 双因素 ∥ **密码找回**（需外部通道（邮件/短信）——「团队协同」步再议；**改密 = 在**——自助 ∥ admin 重置）。
- 登录失败限速/账户锁定 ∥ 密码复杂度策略（仅最小长度 8） ∥ 会话管理面（会话列表 ∥ 多端踢出——改密/重置吊销属被动机制）。
- 角色只两级（admin ∥ user——不做细粒度权限/自定义角色）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——accounts 域：团队 key 面 ∥ 账号/会话/角色 ∥ 自助/管理端点表 ∥ 改密/重置；KD-SV-7/11/12/13/14；用例 N5–N10 ∥ B8 ∥ E8–E10。
- 2026-10-06：fix 轮（评审轮次 1 #1——管理面 key 枚举补记）：`GET /api/members` 成员行附 key 清单（提示形 + id）；KD-SV-16 增；用例 N11 增（admin 吊销正路——该 key 下一请求 401）。
- 2026-10-06：实施后回填轮（fix）——§2 密码规则补「长度不设上界」（已审定：无 DoS 面）；§4 行数按实读回填（小计 ≈570 ⇒ 493）。
