# Thincoder Server · 设计总览（第一步：token 网关）

> 板块 = server（新部分——代码 `thincoder-server/` ↔ 文档 `docs/server/`，模块镜像）∥ 本档 = 设计**总览**（板级——定位 ∥ 架构总览 ∥ 模块边界与责任地图 ∥ 文档地图 ∥ 决策索引 ∥ 文件与验收总账）——各域细节 = 域档（见 §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（五要素已齐——2026-10-06 用户收口）；本档不复述需求，验收回指 = §7。
> 参考件 = `ai-gateway`（外部项目——**只读参考**：零共享运行面 ∥ 零依赖 ∥ 零代码/文档引用；可借鉴经验 = key 明文只回显一次 ∥ 拒打不落用量 ∥ 计量与业务解耦）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构 + 增长与演进域 + 部署面，沿用户 08:04–08:24 裁定）。
> 范围注：第二步「团队协同」不在本设计集（触发项 = `EVOLUTION.md` §2）；server 入发布序列 = 定向（npm 路——`RELEASE.md` 扩展 = 发布面轮，不在本批；沿用户 08:24 令）。

## 1. 定位与落点

- **一句话**：一台内网常驻的 Node 单进程——OpenAI 兼容入口（chat ∥ embeddings ∥ models），网关代持全部真实 provider key，逐请求记账、按成员限额度；另配登录制控制台（vanilla 静态前端——侧栏分组导航十页——IA/多语言 = `webui/WEBUI.md` §2/§2.2）与本机运维 CLI（兜底）；首版完备化面 = `/healthz` ∥ 登录防爆破 ∥ 用量保留窗 ∥ 控制台系统页（版本/更新/接入——§7 AC-13）∥ 可见面二轮六面（向量/看板/总览/审计/健康/key 细节——§7 AC-15）。
- **落点**：代码 = `thincoder-server/`（新顶层目录——与 `thincoder-core/` ∥ `thincoder-cli/` ∥ `thincoder-vscode/` ∥ `thincoder-desktop/` ∥ `thincoder-render-core/` 同级）；设计档 = `docs/server/design/`（板 2 档 + 域 6 档——见 §2.1 ∥ §3）。
- **形态**：单进程单库（`node:http` + `node:sqlite`）；无构建步骤；纯 ESM（`.mjs`）。
- **零第三方运行期依赖**（沿仓纪律）：全树 import 仅 `node:*` 标准库 + 相对路径；不 import `thincoder-core/*`（论证 = §5 KD-SV-2）。

## 2. 架构总览

### 2.1 模块边界与责任地图

**三层结构（板 → 域 → 档——代码与文档同拍，用户 2026-10-06 08:14 令）**：代码 = `thincoder-server/src/<域>/<档>.mjs`（入口 `bin/` 与静态 `public/` 除外）；文档 = `docs/server/design/<域>/<档>.md`。六域 = gateway ∥ accounts ∥ metering ∥ store ∥ webui ∥ ops（域目录自第一步立；拆分落域内——`EVOLUTION.md` §1-G4）。

| 域 | 代码（本域档） | 职责 | 域档（文档） |
|---|---|---|---|
| 入口（板级） | `thincoder-server/bin/thincoder-server.mjs`（已落盘） | argv ∥ 配置加载 ∥ 首启引导 ∥ 装配/启动 ∥ 停机 | `ops/OPS.md` |
| gateway | `thincoder-server/src/gateway/` 十一档（server ∥ routes ∥ forward ∥ sse-tap ∥ providers ∥ provider-admin ∥ system ∥ errors + embedding-admin ∥ overview ∥ ratelimit） | http 服务 ∥ 注册行分派 ∥ OpenAI 三面 ∥ 转发 ∥ usage 旁路扫描 ∥ 模型派发 ∥ 模型限流（per-model RPM/TPM——§2.2） ∥ provider 管理面（§2.2） ∥ 系统面（探活/版本——§2.3） ∥ 控制台数据面（总览/向量服务——§2.4） ∥ 错误形 | `gateway/API.md` |
| accounts | `thincoder-server/src/accounts/` 七档（keys ∥ members ∥ session ∥ routes ∥ routes-admin ∥ login-guard + audit） | 团队 key ∥ 账号/成员 ∥ 会话/登录 ∥ 密码 ∥ 登录防爆破 ∥ 审计事件（§2.1） ∥ 自助/管理端点 | `accounts/ACCOUNTS.md` |
| metering | `thincoder-server/src/metering/` 三档（usage ∥ quota ∥ routes）（已落盘） | 记账 ∥ 配额 ∥ 用量/配额端点（含报表/导出——§3） ∥ 保留窗清理 | `metering/METERING.md` |
| store | `thincoder-server/src/store/` 一档（db）（已落盘） | 库 ∥ DDL ∥ 迁移链（各域共用；v4 = 模型设置增列） | `store/STORE.md` |
| webui | `thincoder-server/src/webui/` 一档（static）+ `thincoder-server/public/` 十九档（静态——`index.html` ∥ `app.mjs` ∥ `nav.mjs` ∥ `views-*` 十档 ∥ `modal.mjs` ∥ `i18n.mjs` ∥ `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ `model-specs-snapshot.mjs` ∥ `style.css`；`views.mjs` 退役） | 页面路由 ∥ HTML/JS/CSS ∥ 静态直发 ∥ IA/导航 ∥ 多语言（§2.2） ∥ 可见面二轮（§2.3） ∥ 弹窗与服务模型配置面（§2.4） ∥ 样式族规范（§2.5） | `webui/WEBUI.md` |
| ops | `thincoder-server/src/ops/` 五档（config ∥ log ∥ cli ∥ presets ∥ update）+ 部署档组（`thincoder-server/deploy/thincoder-server.service` ∥ `thincoder-server/deploy/docker-entrypoint.sh` ∥ `thincoder-server/deploy/converge.mjs` ∥ `thincoder-server/deploy/backup.mjs` ∥ `thincoder-server/Dockerfile` ∥ `thincoder-server/.dockerignore` ∥ `thincoder-server/docker-compose.yml`）+ 模板/说明档（`thincoder-server/config.example.json` ∥ `thincoder-server/README.md`）（已落盘） | 配置（含 provider 预设） ∥ 日志 ∥ 运维 CLI ∥ 更新机制（自检/自升/收敛） ∥ 部署面（npm ∥ Docker ∥ systemd ∥ 备份） | `ops/OPS.md` |

（各域「不做」面 = 各域档「本域边界」段；全局范围 = 头注「范围注」；逐档行数 = 各域档「本域文件与行数预算」。）

### 2.2 数据流（两条主链）

**聊天请求**（OpenAI 面——chat ∥ embeddings ∥ models 同构）：

```text
客户端（四端 / curl / 任意 OpenAI 兼容工具）
  │  Authorization: Bearer sk-tc-…（团队 key——只存在成员机器上）
  ▼
[1] 路由 /v1/chat/completions（注册行分派）
[2] 鉴权（sha256 → api_keys ⋈ members；未知 ∥ 吊销 ⇒ 401）
[3] 配额准入（本月累计 ≥ 额度 ⇒ 429；额内 ⇒ 放行）
[4] body → model → providers 精确匹配派发（未命中 ⇒ 404；命中 ⇒ 模型限流准入——per-model RPM/TPM 超限 ⇒ 429 `rate_limited` + `Retry-After`；KD-SV-35）
[5] 转发上游（网关侧真 key；流式注入 stream_options.include_usage）
[6] 响应透传（SSE 逐块 ∥ 旁路 tap 只读扫描 usage——字节零改）
[7] 记账（usage 行落库——请求结束/流终结/客户端断开时单条 INSERT）
```

**控制台请求**（B 案——登录与会话）：

```text
浏览器（public/ 前端）
  │ POST /api/login {username, password} ──▶ 防爆破门（双维锁 ⇒ 429；KD-SV-21） → scrypt 校验 ⇒ sessions 落行
  │ ◀─ 200 Set-Cookie: tc_session=…（HttpOnly ∥ SameSite=Strict）
  │ 后续请求携 cookie ──▶ 会话校验（sha256 → sessions ⋈ members）
  │                        ├─ 无/过期会话 ⇒ 401
  │                        ├─ user 触管理端点 ⇒ 403
  │                        └─ 放行 ⇒ 自助面 /api/me* ∥ 管理面 /api/members* 等
  ▼
十页两区（`#/login` ∥ 我的三页 ∥ 管理七页——IA = `webui/WEBUI.md` §2）——数据全经 /api/*，判权全在后端；系统页数据 = `/api/system`（版本/更新/引擎模型——KD-SV-24/30）
```

### 2.3 与 core 的关系（依赖决策摘要）

- **不 import `thincoder-core/*`**：网关要「不认识内容」的字节级中继；核 provider 层（`thincoder-core/provider/sse.mjs`）是消费型客户端器件——完整论证 = §5 KD-SV-2。
- 同仓直连的优势（协议两端一提交同改同审）保留待用：非 OpenAI 协议翻译类需求（现为不做项）出现时再按批直连，不预先耦合。
- 存储选 `node:sqlite` 与核 `thincoder-core/ledger-db.mjs` 同技术（`DatabaseSync`），零代码共享——各持各的库与 DDL。

## 3. 文档地图（板 2 + 域 6）

| 档 | 层 | 域 | 内容（各档自带决策段与变更记录） |
|---|---|---|---|
| `PROJECT.md` | 板 | —— | 定位 ∥ 架构总览 ∥ 模块边界与责任地图 ∥ 文档地图 ∥ 决策索引 ∥ 文件/验收总账 ∥ 交付面 |
| `EVOLUTION.md` | 板 | —— | 扩展点（断点） ∥ 触发条件式演进 ∥ 明确不预建 |
| `gateway/API.md` | 域 | gateway | 路由族表 ∥ OpenAI 三面 ∥ 转发与计量行为 ∥ 错误形 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |
| `accounts/ACCOUNTS.md` | 域 | accounts | 团队 key 面 ∥ 账号/会话/角色 ∥ 自助/管理端点表 ∥ 改密/重置 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |
| `metering/METERING.md` | 域 | metering | 记账 ∥ 配额 ∥ 查询与额度端点 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |
| `store/STORE.md` | 域 | store | 库 ∥ DDL ∥ 迁移链 ∥ 本域文件与预算 ∥ 决策 |
| `webui/WEBUI.md` | 域 | webui | 静态面 ∥ 控制台 IA 与视图 ∥ 多语言（i18n） ∥ 弹窗机制（§2.4） ∥ 样式族规范（§2.5） ∥ 判权/自托管约束 ∥ 本域文件与预算 ∥ 验收判据 |
| `ops/OPS.md` | 域 | ops | 配置面 ∥ 首启引导 ∥ 运维 CLI ∥ 启动/停机/部署面 ∥ 日志 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |

## 4. 决策索引（KD-SV-1–36）

| # | 决策一句话 | 所在档 |
|---|---|---|
| KD-SV-1 | 形态 = 单进程单服务 | 本档 §5 |
| KD-SV-2 | 不 import `thincoder-core/*`（含 provider 层） | 本档 §5 |
| KD-SV-3 | 存储 = `node:sqlite`（WAL ∥ `user_version`） | `store/STORE.md` |
| KD-SV-4 | 模型派发 = `provider/model` 复合键精确匹配 | `gateway/API.md` |
| KD-SV-5 | 流式计量 = 注入 `stream_options.include_usage` + 旁路 tap | `gateway/API.md` |
| KD-SV-6 | 配额 = 成员月度 token 累计·准入检查 | `metering/METERING.md` |
| KD-SV-7 | 管理/自助面 = 登录制页面 + 本机 CLI 兜底 | `accounts/ACCOUNTS.md` |
| KD-SV-8 | 计量写入 = 请求终结后单条 INSERT | `metering/METERING.md` |
| KD-SV-9 | 控制台前端 = vanilla 静态面（零框架 ∥ 零构建 ∥ 零外部资源） | `webui/WEBUI.md` |
| KD-SV-10 | SSE tap = 有界只读扫描 | `gateway/API.md` |
| KD-SV-11 | 团队 key 校验 = 逐请求查库（无缓存） | `accounts/ACCOUNTS.md` |
| KD-SV-12 | 会话形 = HttpOnly cookie（`SameSite=Strict` ∥ 7 天绝对过期） | `accounts/ACCOUNTS.md` |
| KD-SV-13 | 密码散列 = scrypt（N=16384 ∥ r=8 ∥ p=1——异步） | `accounts/ACCOUNTS.md` |
| KD-SV-14 | admin 重置成员密码 = 在（一次性临时密码） | `accounts/ACCOUNTS.md` |
| KD-SV-15 | 首启 admin 引导 = `bootstrap` 配置 + 幂等 | `ops/OPS.md` |
| KD-SV-16 | 管理面 key 枚举 = 成员行内附清单（提示形 + id） | `accounts/ACCOUNTS.md` |
| KD-SV-17 | provider 预设 = server 自持表（快照——起步 20 家 OpenAI 兼容子集） | `ops/OPS.md` |
| KD-SV-18 | 更新机制 = 两路统一 npm 版本身份（自检 + 档位 + 自升；容器 = 壳——`TC_SERVER_VERSION` 收敛） | `ops/OPS.md` |
| KD-SV-19 | provider 配置面 = 库单源 + 保存即热生效（config `providers[]` 降为一次性种子；密钥明文 ∥ `env:` 引用并存） | `ops/OPS.md` §8 |
| KD-SV-20 | 控制台 IA = 侧栏分组导航 + 一页一职责（十页；hash 路由扩展；旧链重定向） | `webui/WEBUI.md` §7 |
| KD-SV-21 | 登录防爆破 = 双维内存锁（用户名 5 ∥ IP 20；窗/锁 15 分钟；429 + `Retry-After`；成/败同措辞保持） | `accounts/ACCOUNTS.md` §6 |
| KD-SV-22 | 用量保留 = 配置化保留窗（缺省 90 天；启动 + 24h 删除式清理；`null` = 不限） | `metering/METERING.md` §6 |
| KD-SV-23 | 健康检查 = `/healthz` 无鉴权只读探活（status/version/uptime/db；503 degraded；HEALTHCHECK 单源） | `ops/OPS.md` §8 |
| KD-SV-24 | 更新可见面 = `GET /api/system`（会话）+ 控制台（meta 槽 ∥ 系统页——更新器状态导出） | `ops/OPS.md` §8 |
| KD-SV-25 | 部署文档完备 = README 定稿（nginx 完整段；备份 = `backup.mjs` 在线快照 + 定时器样例） | `ops/OPS.md` §8 |
| KD-SV-26 | 控制台多语言 = 前端静态双表 + 浏览器语言自动 + 显式切换（记忆）+ 错误码前端映射（缺省 zh——服务端零改） | `webui/WEBUI.md` §7 |
| KD-SV-27 | 用量报表 = 服务端聚合与导出（summary 单端点 ∥ 导出 = 服务端 CSV；与明细同源） | `metering/METERING.md` §6 |
| KD-SV-28 | 审计事件 = 库表（v3）+ 名快照 + 与用量同保留窗（写入口 = 调用侧显式传型） | `accounts/ACCOUNTS.md` §6 |
| KD-SV-29 | 可见面二轮 = 服务端聚合/代发 + 零依赖前端（总览落地页 ∥ CSS 柱 ∥ 健康三态轮询） | `webui/WEBUI.md` §7 |
| KD-SV-30 | 向量服务面 = 配置真值经 admin 端点 + 服务端代探/代试（地址 admin 面 ∥ 模型名下发用户面） | `gateway/API.md` §6 |
| KD-SV-31 | 控制台弹窗 = 自持公共组件（`modal.mjs`——原生 `<dialog>` 基座；单例；遮罩点击不关） | `webui/WEBUI.md` §7 |
| KD-SV-32 | 服务模型页 = 派生视图（零新端点——`providers` 展平 + `embedding.model`）+ 配置骨架先行 | `webui/WEBUI.md` §7 |
| KD-SV-33 | Provider 管理面 = 列表 + 双弹窗（添加 ∥ 详情）——勾选集 = 服务集（PATCH `models`——零新端点）；候选 = 上游发现（无手填）；退役项只读注 + 恒保留（A = 服务模型页自持） | `webui/WEBUI.md` §7 |
| KD-SV-34 | 服务模型配置面 = A/C/D/E 落字段（A = `models` 成员·服务页自持；`settings`（v4 + PATCH 键级合并）；D = 规格快照 + 说明；E = 内部估算参考） | `webui/WEBUI.md` §7 |
| KD-SV-35 | 模型限流 = per-model RPM/TPM（内存定窗；429 `rate_limited` + `Retry-After`；换表热生效） | `gateway/API.md` §6 |
| KD-SV-36 | 控制台样式族 = 变量单源 + 一套刻度 + 系统基线对齐（一字族/一字号 13px/行距 1.5/零粗体·色区分；悬停底同值（列表行/中性面）；可点行三件套；族目勘误 = +⑩ 码面 ∥ 变量单源为底座） | `webui/WEBUI.md` §7 |

## 5. 关键决策（本档）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-1 | **形态 = 单进程单服务**（`node:http`——模块表见 §2.1） | 「内网一台常驻」；团队规模并发；零依赖纪律下无必要拆进程 | 多进程拆（入口/计量分离——无收益增运维）· 引 Web 框架（违零依赖） |
| KD-SV-2 | **不 import `thincoder-core/*`**（含 provider 层） | ① 核 `thincoder-core/provider/sse.mjs` 的 `readSSE` 是消费型（onToken 回调 ∥ 全量累积 ∥ 规则短路 ∥ 120s idle 判定）——中继复用会强制整段消费/再序列化，与「SSE 逐块透传」相抵；② 核 provider 层面向客户端多协议适配（anthropic/google/responses ∥ 重试 ∥ 限速 ∥ 思考映射）——网关零需要；③ 网关要「不认识内容」的代理语义——解析越少越稳。行数影响：自持 `thincoder-server/src/gateway/sse-tap.mjs`（≈80 行）覆盖全部所需（`data:` 行 JSON 取 usage） | **全引 `chat()`**（消费型语义错配 + 强制缓冲）· **引窄叶**（`normalizeUsageCache`——服务客户端缓存语义、网关不需要；`RETRYABLE_STATUS`——本设计不做重试）· **引 `embedding.mjs`**（自带批量/归一化/整流——网关须原样透传与计数，语义不符） |

## 6. 受影响文件与行数预算（总账）

口径：全为新建树——预算 = 实施前估值；已实施落盘：行数 = 实读（口径 = 内容行数 ∥ 文末换行不计），行式 = 实读值（实读日期——设计估），小计 = 预算 ⇒ 实读。全部单档 **≤300 行软线内**（时点 = 本回填；此后越线在册：`app.mjs` ≈301（拆分预案 = `webui/WEBUI.md` §5） ∥ i18n 双表 312 ∥ 308（R25 独立结构轮）；二者外最宽 = `README.md` 实读 241——本批后 ≈255）；
  500 硬限未触及；全树实读 **5074 行（47 档）**（含 README 复测校正 +1 ∥ 预设面 +63 ∥ 自动更新面 +484 ∥ 控制台面 +716 ∥ 完备化面 +509 ∥ 多语言面 +540 ∥ package.json +1——2026-10-06 回填后）。
  控制台二轮面预算（2026-10-06 设计轮——本批）：产品面 ≈+1270（gateway ≈+185 ∥ accounts ≈+153 ∥ metering ≈+144 ∥ store ≈+36 ∥ webui ≈+702 ∥ ops ≈+49 ∥ package.json +1——落点 = `prepublishOnly` 清单添本批件）⇒ 全树 **≈6344 行（53 档**——+6 新档）；实施后回填轮校正。
  控制台弹窗批预算（2026-10-06 设计轮——弹窗批）：产品面 ≈+400（webui ≈+399——modal 新 ≈110 ∥ views-models 新 ≈110 ∥ views-admin +≈110 ∥ style +≈30 ∥ i18n 两表 +≈34 ∥ nav +≈3 ∥ app +≈2；package.json +1——落点 = `prepublishOnly` 清单添本批件：十二件 ⇒ 十三件——以 #972 随正落地后实读为准）⇒ 全树 **≈6744 行（55 档**——+2 新档）；实施后回填轮校正。
  控制台 Provider 重做批预算（2026-10-06 设计轮——本批）：产品面 ≈+196（webui ≈+195——`views-providers` 拆分（214 ⇒ ≈110 + 新档 ≈260）∥ style +≈25 ∥ i18n 两表 ≈−2（净 ≈−1/表）；package.json +1——`prepublishOnly` 清单添本批件：十三件 ⇒ 十四件）⇒ 全树 **≈6940 行（56 档**——+1 新档）；实施后回填轮校正。
  服务模型配置面批预算（2026-10-06 设计轮——本批）：产品面 ≈+527（webui ≈+314——`views-models` 77 ⇒ ≈235 ∥ `model-specs-snapshot.mjs`（拟新增）≈80 ∥ i18n 两表 +≈50 ∥ style +≈26；
  gateway ≈+171——`ratelimit.mjs`（拟新增）≈90 ∥ provider-admin +≈28 ∥ providers +≈19 ∥ routes +≈14 ∥ errors +≈9 ∥ forward +≈6 ∥ server +≈5；ops ≈+30——config settings 校验；store ≈+11——v4 段；package.json +1——`prepublishOnly` 清单添本批件：十四件 ⇒ 十五件（件数以当刻盘面为准））⇒ 全树 **≈7467 行（58 档**——+2 新档）；实施后回填轮校正。
  样式族统一批预算（2026-10-06 设计轮——本批）：产品面 ≈+26（webui ≈+26——`thincoder-server/public/style.css` **139 ⇒ ≈165 ⇒ ≈190 ⇒ ≈216**（三批叠加 = 配置面 +≈26 ∥ provider 重做 +≈25 ∥ 本批 +≈26 = `:root` 变量族 +≈20 ∥ 态面 +≈9 ∥ 死规则 −2；顺序倒置时以当刻盘面为准）；views/app ±0——类串微改行数零变；零新档）⇒ 全树 **≈7493 行（58 档**——档数不变）；实施后回填轮校正。
  对照设计总账 ≈5237（= 闭式 ≈3247 + 控制台面预期 ≈840 + 完备化面预期 ≈518 + 多语言面预期 ≈632；实读差 −163 = 前账超出 +61 ∥ 控制台面回落 −124 ∥ 完备化面回落 −9 ∥ 多语言面回落 −92 ∥ package.json +1）。
自动更新批回填（2026-10-06）：**3308 行（35 档）**（+484 = ops 族 +484 ∥ package.json +0——详见 `ops/OPS.md` §6）。

- **板级**：`thincoder-server/package.json`（可发布形：`@thincoder/server`（拟） ∥ `files` 白名单 ∥ `bin` = `thincoder-server` ∥ engines `node>=24` ∥ `prepublishOnly` 门禁；`private` 撤；dependencies 空；实读 26 行（估 ≈30；含 `dev` 脚本行）；`prepublishOnly` 清单十二件 ⇒ 十三件
  （八 + #962 件 + #963 件 + i18n 件 + #972 件 + 弹窗批件——以 #972 随正落地后实读为准））。
- **各域预算表**（「本域文件与行数预算」节）：gateway **≈770 ⇒ 658 ⇒ 951 ⇒ 1007** ∥ accounts **≈570 ⇒ 493 ⇒ 632** ∥ metering **≈260 ⇒ 218 ⇒ 233** ∥ store **≈175 ⇒ 110 ⇒ 124 ⇒ ≈160 ⇒ 144 ⇒ ≈155** ∥
  webui **≈680 ⇒ 558 ⇒ 943 ⇒ 1006 ⇒ 1545** ∥ ops **≈762 ⇒ 1246 ⇒ 1270 ⇒ 1506 ⇒ 1507** —— 合计 **≈3217 ⇒ 3283 ⇒ 3999 ⇒ 4508 ⇒ 5048**
  （二轮面——2026-10-06 设计轮：gateway **≈1192** ∥ accounts **≈785** ∥ metering **≈377** ∥ store **≈160** ∥ webui **≈2247** ∥ ops **≈1556** —— 合计 **≈6317**）
  （弹窗批——2026-10-06 设计轮：webui **≈2646**（+≈399）；余域不动 —— 合计 **≈6716**）
  （+ package.json **≈30 ⇒ 25 ⇒ 26 ⇒ 27 ⇒ 28** ⇒ 总账 **≈3247 ⇒ 3308 ⇒ 4024 ⇒ 4534 ⇒ 5074 ⇒ ≈6344 ⇒ ≈6743 ⇒ ≈6744 ⇒ ≈6940（provider 重做批）⇒ ≈7467（服务模型配置面批）⇒ ≈7493（样式族批）**；全树 **47 ⇒ 53 ⇒ 55 ⇒ 56 ⇒ 58 档**）。
  provider/IA 面回填（2026-10-06——批 `docs/batches/2026-10-06-console-providers.md`）：产品面 **+716 行**（gateway +293 ∥ webui +385 ∥ store +14 ∥ ops +24）∥ 批内件实读 **479** ∥ 全树 **35 ⇒ 41 档**（+7 新档 ∥ −1 退役：`views.mjs`）。
  first-release-completeness 面回填（2026-10-06——批 `docs/batches/2026-10-06-first-release-completeness.md`）：产品面 **+509 行**（gateway +56 ∥ accounts +139 ∥ metering +15 ∥ webui +63 ∥ ops +236——
  含 README +94 ∥ `thincoder-server/deploy/backup.mjs` 新 **86**）∥ `package.json` **+1**（`dev` 脚本行）∥ 批内件实读 **497** ∥ 全树 **41 ⇒ 44 档**（+3 新档：system ∥ login-guard ∥ backup）。
  控制台多语言面回填（2026-10-06——批 `docs/batches/2026-10-06-server-i18n.md`）：产品面 **+540 行**（webui **+539** = i18n 三档 **+505**（113 ∥ 198 ∥ 194）——
  app +21 ∥ views-auth +2 ∥ views-me +1 ∥ views-admin +2 ∥ views-providers +1 ∥ views-system +1 ∥ style +6 ∥ nav ±0；ops **+1** = README 241）∥ 批内件实读 **298** ∥ 全树 **44 ⇒ 47 档**（+3 新档：i18n 三档）。
- **既有随动**：

| 档 | 改动 | 量 |
|---|---|---|
| `.gitignore`（仓根） | 追加两行：`thincoder-server/data/` ∥ `thincoder-server/config.json`（运行期与本地配置不入库）（机检豁免——部署机本地档） | 现行 35 行 ⇒ 预期 37 行（+2） |
| `docs/server/design/`（本设计集——板 2 档 + 域 6 档） | 建档（本补轮按三层结构 + B 案织入） | 八档 |
| `docs/batches/2026-10-06-server-gateway.md` | §2 批次任务与设计（批档唯一写入面） | append |
| `docs/batches/2026-10-06-server-gateway.test.mjs`（已落盘） | 批内件（单位测试——随批留存；见 §8） | 新建——实读 **496** 行；另按域拆档五件（`-accounts` 493 ∥ `-metering` 188 ∥ `-chat` 498 ∥ `-webui-deploy` 322 ∥ `-model-ref` 194）——合计六件 |
| `docs/batches/2026-10-06-server-presets.md` ∥ `docs/batches/2026-10-06-server-presets.test.mjs`（已落盘） | 本批（provider 预设）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 347 行 |
| `docs/batches/2026-10-06-server-auto-update.md` ∥ `docs/batches/2026-10-06-server-auto-update.test.mjs`（已落盘） | 本批（自动更新）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 498 行 |
| `docs/batches/2026-10-06-console-providers.md` ∥ `docs/batches/2026-10-06-console-providers.test.mjs`（已落盘） | 本批（控制台 provider 管理 + IA/导航）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 **479** 行 |
| `docs/batches/2026-10-06-first-release-completeness.md` ∥ `docs/batches/2026-10-06-first-release-completeness.test.mjs`（已落盘） | 本批（首版完备化六项）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 **497** 行 |
| `docs/batches/2026-10-06-server-i18n.md` ∥ `docs/batches/2026-10-06-server-i18n.test.mjs`（已落盘） | 本批（控制台多语言）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 **298** 行；随正三件（已核销——父侧落地）= `-webui-deploy` **322** ∥ `-auto-update` **498** ∥ `-console-providers` **479**（行数 ±0——断言文本就地收正：十二/十三档 ∥ 十一件 ∥ `labelKey`；门禁复跑 99/99） |
| `docs/batches/2026-10-06-console-completeness-2.md` ∥ `docs/batches/2026-10-06-console-completeness-2.test.mjs`（拟新增） | 本批（控制台可见面二轮——六面）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建（写面受阻 ⇒ `.thincoder/tmp/` 父侧 copy——沿先例） |
| 随正七件（父侧落地——跨批写门禁） | `-console-providers`（nav 断言 ∥ 档目 15/16） ∥ `-server-gateway-webui-deploy`（档目 12/13 ⇒ 15/16） ∥ `-server-i18n`（键集 ∥ labelKeys 9 ⇒ 11 ∥ JS 档单 ∥ 新档直发） ∥ `-server-gateway-accounts`（key 行形断点五处） ∥ `-first-release-completeness`（`/api/system` 深比 + `embedding.model`） | 行数（实读）⇒ ≤±N 与断言改点 = 下注①–⑤；实施后回填核销 |
| 随正七件（续——本 fix 轮补入两件） | `-server-gateway`（基准件——v3 断言改点） ∥ `-server-auto-update`（门禁件数 11 ⇒ 12 ∥ 注释同拍） | 同上（行数/改点 = 下注①–⑤） |
| `docs/batches/2026-10-06-console-modals.md` ∥ `docs/batches/2026-10-06-console-modals.test.mjs`（拟新增） | 本批（控制台弹窗——成员弹窗 + 公共组件 + 服务模型页）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建 |
| 随正五件（父侧——跨批写门禁；弹窗批） | `-console-completeness-2`（nav 组项 6 ⇒ 7 ∥ 档目 15/16 ⇒ 17/18 ∥ labelKeys 11 ⇒ 12） ∥ `-console-providers`（nav 断言） ∥ `-webui-deploy`（档目） ∥ `-server-i18n`（键集/JS 档单） ∥ `-server-auto-update`（门禁件数 12 ⇒ 13 ∥ `:9`/`:439`/`:480` 注释与断言同拍——以 #972 随正落地后实读为准） | 断点以当刻盘面为准——登记 = §9 R26；行数增量 = 注⑥ |
| `thincoder-server/package.json`（板级件——`prepublishOnly` 清单） | 本批（弹窗批）：清单添本批件——十二件 ⇒ **十三件**（以 #972 随正落地后实读为准） | 全树总账 +1（≈6743 ⇒ ≈6744） |
| `docs/batches/2026-10-06-console-provider-redo.md` ∥ `docs/batches/2026-10-06-console-provider-redo.test.mjs`（拟新增） | 本批（Provider 管理面重做——列表 + 双弹窗）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建 |
| 随正五件（父侧——跨批写门禁；Provider 重做批） | `-console-providers`（档目名单 18 ⇒ 19） ∥ `-console-completeness-2`（同） ∥ `-console-modals`（同） ∥ `-server-gateway-webui-deploy`（档目 + 标题句 17/18 ⇒ 18/19） ∥ `-server-i18n`（JS 档单 15 ⇒ 16） | 断点以当刻盘面为准——登记 = §9 R29；行数增量 = 注⑦ |
| `docs/batches/2026-10-06-models-config.md` ∥ `docs/batches/2026-10-06-models-config.test.mjs`（拟新增） | 本批（服务模型配置面——功能点 17 A/C/D/E）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建 |
| 随正六件（父侧——跨批写门禁；服务模型配置面批） | `-console-modals`（详情骨架零字段断言 ⇒ 配置四组） ∥ `-server-gateway`（迁移读点 v:3 ⇒ v:4） ∥ `-server-i18n`（JS 档单 16 ⇒ 17 ∥ 键族） ∥ `-server-gateway-webui-deploy`（档目 19 ⇒ 20 ∥ 标题句） ∥ `-console-completeness-2` ∥ `-console-providers`（档目名单）+ `thincoder-server/package.json`（`prepublishOnly` 添本批件——件数以当刻盘面为准） | 断点以当刻盘面为准——登记 = §9 R33；行数增量 = 注⑧ |
| `docs/batches/2026-10-06-console-list-style.md` ∥ `docs/batches/2026-10-06-console-list-style.test.mjs`（拟新增） | 本批（样式族统一——功能点 19）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建（随正件 = 无——无新档 ∥ 无断点：类串微改/行数零变——既有档目/直发断言零触；新批内件估算 = 注⑨） |

- 注① 随正七件行数（实读——内容行 ∥ 文末换行不计）⇒ 预期增量（五件）：`-console-providers` 479 ⇒ ≤±4 ∥ `-server-gateway-webui-deploy` 322 ⇒ ≤±6 ∥ `-server-i18n` 298 ⇒ ≤±10 ∥ `-server-gateway-accounts` 493 ⇒ ≤±5 ∥ `-first-release-completeness` 497 ⇒ ≤±3。
- 注② 同上（本 fix 轮补入两件 + 新批内件）：`-server-gateway`（基准件）496 ⇒ ≤±2 ∥ `-server-auto-update` 498 ⇒ ≤±1 ∥ 新批内件（拟新增）估算 ≈450 行；越 500 硬线预案 = 注③；实施后回填核销。
- 注③ 拆档预案（增后越 500 时启用——沿按域拆档先例）：`-server-gateway` 抽 `③ db 迁移链` 段独立成件 ∥ `-server-gateway-accounts` 抽 CLI/入口段独立成件。
- 注④ 断言改点（基准件——v3 迁移致 v2 断言整体失效）：`:9`/`:164` 标题文本随正（五表 + 三索引 + user_version=2 ⇒ 六表 + 六索引 + user_version=3）∥
  `:167`/`:168` SCHEMA_VERSION/readVersion ⇒ 3 ∥ `:170` 表清单补 `audit_events` ∥ `:172` 索引数 3 ⇒ 6 ∥ `:186` migrate 返回 ⇒ 3 ∥ `:201`/`:208` readVersion ⇒ 3。
- 注⑤ 断言改点（基准件续 ∥ 自动更新件）：`:205` 失败探针 `v: 3` ⇒ `v: 4` ∥ `:207` 错误消息同步（`（v3）` ⇒ `（v4）`）；`-server-auto-update` = `:480` 件数 11 ⇒ 12 ∥ 断言消息「应列十一件」⇒ 十二件 ∥ `:9`/`:439` 段头注释同拍。
- 注⑥（弹窗批随正五件 + 新批内件）：行数（实读）⇒ 预期增量：`-console-completeness-2`（拟新增 ≈450——实施后实读收正）∥ `-console-providers` ≤±6 ∥ `-webui-deploy` ≤±8 ∥ `-server-i18n` ≤±12 ∥ `-server-auto-update` ≤±2（门禁件数 12 ⇒ 13——以 #972 随正落地后实读为准）∥ 新批内件（拟新增）估算 ≈450 行；越 500 硬线 ⇒ 沿注③拆档预案（沿注②先例）；实施后回填核销。
- 注⑦（Provider 重做批随正五件 + 新批内件）：行数（实读）⇒ 预期增量：`-console-providers` **479** ⇒ ≤±4（`:426` 名单添档） ∥ `-console-completeness-2` **498** ⇒ ≤±4（`:434`） ∥ `-console-modals` **391** ⇒ ≤±4（`:334`）
  ∥ `-server-gateway-webui-deploy` **322** ⇒ ≤±8（`:239` mime 样 ∥ `:272`–`:274` 档目/标题句 ∥ 头注） ∥ `-server-i18n` **298** ⇒ ≤±6（`:120` JS 档单）；`thincoder-server/package.json`（`prepublishOnly` 十三 ⇒ 十四件——添本批内件）；新批内件（拟新增）估算 ≈450 行；越 500 硬线 ⇒ 沿注③拆档预案；实施后回填核销。
- 注⑧（服务模型配置面批随正六件 + 新批内件）：行数（实读）⇒ 预期增量：`-console-modals` **391** ⇒ ≤±12（配置四组断言改点） ∥ `-server-gateway` **496** ⇒ ≤±6（v4 读点） ∥ `-server-i18n` **298** ⇒ ≤±8（档单/键族） ∥
  `-server-gateway-webui-deploy` **322** ⇒ ≤±8（档目） ∥ `-console-completeness-2` **498** ⇒ ≤±4 ∥ `-console-providers` **479** ⇒ ≤±4；新批内件（拟新增）估算 ≈480 行；越 500 硬线 ⇒ 沿注③拆档预案；实施后回填核销。
  - v4 读点（`-server-gateway`——逐点；行号以当刻盘面为准）：`:9`/`:164` 文本 `user_version=3` ⇒ 4 ∥ `:167` SCHEMA_VERSION ⇒ 4 ∥ `:168`/`:201`/`:208` readVersion ⇒ 4 ∥ `:186` migrate 返回 ⇒ 4 ∥ `:205` 失败探针 `v: 4` ⇒ `v: 5`（`v4_probe` ⇒ `v5_probe`，`:209` 同拍） ∥ `:207` 消息 `（v4）` ⇒ `（v5）`。
- 注⑨（样式族批随正件 = 无 + 新批内件）：随正件 = 无（无新档 ∥ 无断点——类串微改/行数零变；既有档目/直发断言零触——实读在案）；新批内件（拟新增——`docs/batches/2026-10-06-console-list-style.test.mjs`）估算 ≈400 行；越 500 硬线 ⇒ 拆档预案（沿注③先例）：类名双向闭合 + 死类零残留 两腿合段抽独立成件；实施后回填核销。

## 7. 验收对照（需求 §2 验收表 → 判据域档）

| 需求 AC | 判据（机检面）所在 | 载体 |
|---|---|---|
| AC-1（功能点 1） | `accounts/ACCOUNTS.md` 验收判据（key 面：401 三态 + 有效 key 完成请求） | 批内件 |
| AC-2（功能点 2） | `gateway/API.md` 验收判据（SSE 逐块 ∥ 帧字节一致 ∥ `[DONE]` 透传；四端任一实跑 = 收口轮） | 批内件 + 收口轮 |
| AC-3（功能点 3） | `metering/METERING.md` 验收判据（usage 行落库 ∥ token 与上游逐值相等） | 批内件 |
| AC-4（功能点 4） | `metering/METERING.md` 验收判据（超额 429 + 可读提示 ∥ 额内放行） | 批内件 |
| AC-5（功能点 5） | `accounts/ACCOUNTS.md` 验收判据（吊销后下一次请求即 401——无缓存路径） | 批内件 |
| AC-6（功能点 6） | `gateway/API.md` 验收判据（引擎命中 + 响应透传维度/条数不变 + 记账） | 批内件 |
| AC-7（功能点 7——B 案） | `accounts/ACCOUNTS.md` 验收判据（七判据：登录 ∥ 未登录拒 ∥ 越权拒 ∥ 改密 ∥ 重置 ∥ 轮换 ∥ 引导幂等） | 批内件 |
| AC-8（功能点 8——分发与部署） | `ops/OPS.md` §7 判据（`npm pack --dry-run` 通过——`files` 白名单齐 ∥ 零 install 步；`docker build` 成功 + compose 起停通；systemd unit 安放可启） | 收口轮（真机；发布动作 = 发布面轮） |
| AC-9（功能点 9——provider 预设；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `ops/OPS.md` §7 判据（预设展开 ∥ 未知预设拒启 ∥ `name` 缺省 ∥ 覆盖语义 ∥ 漂移件） | 批内件 |
| AC-10（功能点 10——自动更新；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `ops/OPS.md` §7 判据（自检 ∥ 档位 ∥ 自升 ∥ 版本可见性 ∥ 容器收敛——机制全文 = `ops/OPS.md` §5.4） | 批内件 + 收口轮 |
| AC-11（功能点 11——控制台 provider/模型管理；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `gateway/API.md` §5 判据（CRUD 三态 ∥ 保存即热生效 ∥ 密钥掩码/日志零明文 ∥ 发现与降级）+ `ops/OPS.md` §7 种子行 + `webui/WEBUI.md` §6 控制台行 | 批内件 |
| AC-12（功能点 14——控制台 IA；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（`nav.mjs` 直测：组/项 ∥ 重定向 ∥ 角色默认 ∥ denied；静态档目随正（二轮后 15/16 ⇒ 弹窗批后 17/18 ⇒ provider 重做批后 18/19 ⇒ 配置面批后 **19 ∥ 20**） ∥ 拆分） | 批内件 |
| AC-13（功能点 12——首版完备化六项；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `gateway/API.md` §5 ∥ ② `accounts/ACCOUNTS.md` §5 ∥ ③④ `webui/WEBUI.md` §6 ∥ ⑤ `ops/OPS.md` §7 ∥ ⑥ `metering/METERING.md` §4 | 批内件 + 收口轮 |
| AC-14（功能点 13——控制台多语言；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（检测矩阵 ∥ 两表键集对齐 ∥ 键引用闭合 ∥ 错误码映射 ∥ 档目/静态直发随正） | 批内件 + 收口轮 |
| AC-15（功能点 15——控制台可见面六面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `gateway/API.md` §5 + `webui/WEBUI.md` §6 ∥ ② `metering/METERING.md` §4 + `webui/WEBUI.md` §6 ∥ ③ `gateway/API.md` §5 + `webui/WEBUI.md` §6 ∥ ④ `accounts/ACCOUNTS.md` §5 + `store/STORE.md` §3 ∥ ⑤ `webui/WEBUI.md` §6 ∥ ⑥ `metering/METERING.md` §4 + `webui/WEBUI.md` §6 | 批内件 + 收口轮 |
| AC-16（功能点 16——控制台弹窗交互；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（`modal.mjs` 在册 ∥ 成员三态弹窗 ∥ 一次性秘密不破 ∥ 静态档目 17/18 ⇒ 18/19（provider 重做批后）⇒ 配置面批后 **19 ∥ 20**） | 批内件 + 收口轮 |
| AC-17（功能点 17——服务模型页 ∥ 配置面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（列表同源 ∥ 详情/配置四组 A/C/D/E ∥ 停用流（含退役可停 ∥ 与 Provider 页单源协同） ∥ 限流 429 形 ∥ admin 面）+ `gateway/API.md` §5 判据（限流面机检） | 批内件 + 收口轮 |
| AC-18（功能点 18——Provider 管理面重做；已落需求档） | `webui/WEBUI.md` §6 判据（nav 值「Provider」 ∥ 列表 + 双弹窗 ∥ 零内联面 ∥ 候选 = 上游发现（零手填） ∥ 勾选保存 ⇒ PATCH `models` ⇒ `/v1/models` 随动 ∥ 退役项只读注 ∥ 测试同窗；档目 18/19 ⇒ 配置面批后 **19 ∥ 20**） | 批内件 + 收口轮 |
| AC-19（功能点 19——样式族总体统一；已落需求档） | `webui/WEBUI.md` §6 判据（§2.5 散置清单 ∥ 变量单源 ∥ 族值表 + 逐族套用表 ①–⑩（含 #87/#88 接续） ∥ 可点行判据 ∥ 空/错/加载态；视觉收口轮实走） | 批内件 + 收口轮 |
| 非功能 · 零依赖 | 本档 §1 ∥ §5 KD-SV-2（口径）；全树 import 扫描断言 = 批内件 | 批内件 |
| 非功能 · 仅内网 | `ops/OPS.md` 验收判据（`host` 必填 fail-closed + `0.0.0.0` 警告） | 批内件 |
| 非功能 · 前端自洽 | `webui/WEBUI.md` 验收判据（零外部引用扫描） | 批内件 |
| 文档面 | `node scripts/doc-check.mjs` exit 0（悬空 0） | 收口轮（仓根机检） |

## 8. 交付面（测试与实施顺序）

- **单位测试（批内件）**：`docs/batches/2026-10-06-server-gateway.test.mjs`（平 node 直测：config 校验 ∥ keys ∥ members ∥ session ∥ usage ∥ quota ∥ sse-tap ∥ forward + routes（mock 上游 = 端口随机 `node:http`） ∥ bootstrap 幂等 ∥ 静态面（mime ∥ 防穿越） ∥ 依赖面/外链扫描断言）。写面受阻时先落 `.thincoder/tmp/`、父侧 copy——沿先例。
- **不设 `test/` 树**：单位测试随批留存（测试纪律——不占仓套件）；收口轮 = 父侧真机（AC 实跑 ∥ 四端任一实际接入一轮 ∥ 仓根 `node scripts/doc-check.mjs`）。
- **实施序（派单为准）**：实施轮实际 = 四阶段派单——D1 骨架 → D2 账号与计量 → D3 聊天链 → D4 控制台 + 向量面 + 分发部署；「实施顺序建议」两条 = 设计时划分（仅参考——非执行序）。
- **实施顺序建议**（串行——按域推进，上半）：D1 骨架（store/db → ops/config → gateway/server ∥ `/v1/models` 可通）→ D2 账号与会话（accounts 全档 → bootstrap → webui 登录壳）→ D3 鉴权 + 配额 + 计量（gateway/errors ∥ metering 全档）。
- **实施顺序建议**（续）：D4 聊天链（gateway 的 providers → sse-tap → forward → routes）→ D5 embeddings + 管理面收尾（engine 转发 ∥ accounts/routes-admin ∥ metering/routes ∥ webui 管理视图 ∥ ops/cli）。
- 收口轮前置（环境面）：真实上游可达 ∥ 内网引擎（Ollama/TEI）可达。

## 9. 上抛与报告项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| R1 | **地图登记**：`docs/README.md` 地图与 `docs/core/design/DOC-SYSTEM.md` 部分表补 server 行（含设计档三层结构） | 文档随动（父侧面为常例——本批零触他板档） | 随实施轮或父侧直接执行；先例 = render-core 第五部分登记 |
| R2 | **需求留白（设计已定形——供用户复核）**：① 额度单位/周期（token ∥ 自然月——KD-SV-6）② provider key 配置形态（**已定**：库单源 + 控制台保存即生效——KD-SV-19 ∥ 批 `console-providers`）③ 控制台门禁（登录制——会话 cookie ∥ 角色分面；KD-SV-7 改，2026-10-06） | 披露（不阻塞） | 如用户意图不同 ⇒ 回笔需求或改设计 |
| R3 | **收口轮环境前置**：AC-2 四端实跑需真实上游可达；AC-6 需内网嵌入引擎（或本机 Ollama） | 实施前置 | 收口轮执行前确认 |
| R4 | **批内件写面**：`docs/batches/*.test.mjs` 直写若受阻 ⇒ 落 `.thincoder/tmp/` 父侧 copy | 实施前置（沿先例） | 实施轮处置 |
| R5 | **发布序列**：server 入发布序列 = 定向（npm 路——用户 08:24）；`RELEASE.md` 扩展 = 发布面轮（不在本批——本批只做包体就绪） | 后续轮 | 发布面轮 |
| R6 | **B 案补轮两枚用户裁定（已落实）**：admin 重置 = 在 ∥ 前端 = vanilla 静态文件 | 披露（已落实） | 需求档回笔已办（2026-10-06——需求档变更记录在册） |
| R7 | **AC-9 行（已办）**：功能点 9 验收行已落需求档（`docs/server/requirements/PROJECT.md` 验收表——2026-10-06） | 需求档回笔（主 agent 笔） | 已办（2026-10-06） |
| R8 | **实施后回填**：预算实读（ops 域增量 ∥ 批内件行数）∥ §6 预期值收正 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R9 | **需求档回笔（已办）**：AC-10 行已落需求档验收表（2026-10-06） | 需求档回笔 | 已办（2026-10-06） |
| R10 | **发布面接线点**：`@thincoder/server` 发布前 ⇒ 自检恒「无新版」（404 静默）；发布后自生效（无需改动）；发布动作 = 发布面轮 | 后续轮（接线在案） | 发布面轮 |
| R11 | **实施后回填（已办）**：预算实读（ops 小计 762 ⇒ **1246** ∥ 全树 2824 ⇒ **3308**）∥ 批内件实读 **498** | 实施后设计回填轮（沿先例） | 已办（2026-10-06） |
| R12 | **需求档行宽破口（已办）**：`requirements/PROJECT.md:43` 已拆行（400 字符 ⇒ 三行 ≤300 ∥ 2026-10-06） | 需求档修复 | 已办（2026-10-06） |
| R13 | **需求档回笔（已办）**：AC-11 ∥ AC-12 两行已落需求档验收表（`docs/server/requirements/PROJECT.md`——2026-10-06） | 需求档回笔 | 已办（2026-10-06） |
| R14 | **实施后回填轮（已办）**：预算实读（webui 重排 ∥ 新档——§6 全树 **4024 行（41 档）**）∥ 批内件实读 **479** ∥ 旧件随正清单核销（base/presets ∥ webui-deploy ∥ model-ref ∥ chat ∥ auto-update——父侧落地/零改在册） | 实施后设计回填轮（沿先例） | 已办（2026-10-06） |
| R15 | **需求档回笔（已办）**：AC-13 行已落需求档验收表（`docs/server/requirements/PROJECT.md`——2026-10-06；判据 = 六面行——见 §7） | 需求档回笔 | 已办（2026-10-06） |
| R16 | **实施后回填轮（已办）**：预算实读（六面增量 ∥ 新三档——§6 全树 **4534 行（44 档）**）∥ 批内件实读 **497** ∥ 旧件随正核销（`-auto-update` 件 prepublishOnly 件数断言 9 ⇒ 10——父侧落地在册） | 实施后设计回填轮（沿先例） | 已办（2026-10-06） |
| R17 | **需求档回笔（已办）**：§2:13 措辞收正已落（需求档变更记录在册）+ AC-14 行已落需求档验收表（`docs/server/requirements/PROJECT.md`——2026-10-06；判据 = `webui/WEBUI.md` §6 AC-14 行） | 需求档回笔 | 已办（2026-10-06） |
| R18 | **实施后回填轮（已办）**：预算实读（i18n 三档 ∥ 接线增量——§6 全树 **5074 行（47 档）**）∥ 批内件实读 **298** ∥ 旧件随正核销（`-webui-deploy` ∥ `-auto-update` ∥ `-console-providers` 三件——父侧落地在册；门禁复跑 99/99） | 实施后设计回填轮（沿先例） | 已办（2026-10-06） |
| R19 | **需求档回笔（本批交付）**：AC-12 行随正（管理 4 ⇒ 6 ∥ `#/admin` 重定向 ⇒ `/admin/overview` ∥ 静态九档 ⇒ 15/16——与 §2:15③④ 冲突面收口）；另 AC-12「静态九档」= i18n 后已陈（现有 12/13） | 需求档回笔（主 agent 笔） | 随本批评审/收口；设计侧行已随正（`webui/WEBUI.md` §6 AC-12 行） |
| R20 | **披露——「成员增删」之「删」零既有路径**：功能点 15④ 审计事件目录含「成员增删」，而全库零成员删除路径（实核——控制台/CLI 皆无）；设计只覆盖「增」（member_create）；「成员删除」功能不在任何功能点内 | 需求措辞面裁定（回笔 or 立后续项） | 待主 agent/用户裁；审计面零阻塞 |
| R21 | **实施后回填轮**：预算实读（六面增量 ∥ 新六档——§6 全树 ≈6344 推算值收正）∥ 批内件行数 ∥ 随正七件核销 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R22 | **随正七件登记（父侧——跨批写门禁）**：`-console-providers` ∥ `-webui-deploy` ∥ `-server-i18n` ∥ `-server-gateway-accounts` ∥ `-first-release-completeness` ∥ `-server-gateway`（基准件——v3 断言改点） ∥ `-server-auto-update`（门禁件数 11 ⇒ 12）（逐件断点与行数 = §6 随动表行 + 注①–⑤） | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R23 | **需求档回笔（已办）**：AC-12 行随正（管理 6 ⇒ **7** ∥ 静态档目 15/16 ⇒ **17/18**——弹窗批后）+ §2:14 侧栏页数注（九页 ⇒ 十页）——设计侧行已随正（`webui/WEBUI.md` §6） | 需求档回笔（主 agent 笔） | 已办（2026-10-06——需求档 `requirements/PROJECT.md:166` 回笔在盘） |
| R24 | **配置候选表（已裁——用户 2026-10-06 21:39/21:40「ACDE」）**：A（开放/停用——**服务模型页自持操作面；不得被 Provider 页吸收**——上游退役模型从发现列表消失后只在服务模型页可停用）∥ C（per-model 限流）∥ D（展示元数据）∥ E（成本权重）**入选**；B（默认请求参数）**不选**；落字段 = 本批设计在盘（2026-10-06——`webui/WEBUI.md` §2.4③ ∥ KD-SV-34/35；需求档 §2:17 已同拍） | 用户裁定（已裁） | 落字段 = 本批设计在盘；实施 = 后续轮 |
| R25 | **i18n 表拆域（断点触发登记）**：弹窗批后 zh ≈309 ∥ en ≈305（估——双表均越 300 软线）⇒ 按域拆表；处置 = 独立结构轮（本批面已定 ∥ 撞在途批断言面）；实施实读为准 | 处置已定（独立结构轮） | 独立结构轮（实施后另轮） |
| R26 | **随正五件登记（父侧——跨批写门禁）**：`-console-completeness-2`（nav 6 ⇒ 7 ∥ 档目 15/16 ⇒ 17/18 ∥ labelKeys 11 ⇒ 12） ∥ `-console-providers` ∥ `-webui-deploy` ∥ `-server-i18n` ∥ `-server-auto-update`（门禁件数 12 ⇒ 13 ∥ `:9`/`:439`/`:480` 注释与断言同拍——以 #972 随正落地后实读为准）；断点以当刻盘面为准；行数 = §6 注⑥ | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R27 | **实施后回填轮**：预算实读（弹窗批增量 ∥ 新两档——§6 全树 ≈6744 推算值收正）∥ 批内件行数 ∥ 随正五件核销 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R28 | **需求档回笔（主 agent 笔）**：AC-11 行「手填降级」措辞收正（用户 21:36 裁定——控制面候选手填入口撤除；发现失败 = 提示 + 重试；服务端 502 语义零改）——设计侧行已收正（本批——`gateway/API.md` §5 ∥ `webui/WEBUI.md` §6 AC-11 行） | 需求档回笔 | 随本批评审/收口 |
| R29 | **实施后回填轮（本批）**：预算实读（拆分两档 ∥ style/i18n 增量——§6 ≈6940 推算值收正）∥ 批内件行数 ∥ 随正五件核销（+ `prepublishOnly` 十三 ⇒ 十四件） | 实施后设计回填轮（沿先例） | 实施后轮 |
| R30 | **披露——退役模型停用过渡窗**：本批落地后，上游已退役（不在发现列表）的已开放模型在 Provider 页不可停用（用户 21:40 机制）；服务模型页 A 开关设计在盘（本批——`webui/WEBUI.md` §2.4③）；过渡窗内停用入口 = API 级 PATCH `models`；建议 A 实施轮紧随（设计已备） | 披露（不阻塞） | 用户/主 agent 排期 |
| R31 | **需求档回笔（主 agent 笔）**：AC-17 行「配置项 = 用户裁定面（未裁前只落详情 + 编辑骨架）」收正（配置项 = A/C/D/E 已裁——设计在盘）+ §2:17 末句「实现序 = 另轮排期（本轮骨架在盘）」随正（设计在盘，实施另轮）；设计侧行已随正（`webui/WEBUI.md` §6） | 需求档回笔 | 随本批评审/收口 |
| R32 | **C 存储面/端点面裁定点（上抛——评审/用户确认）**：设计取 = ① 存储 `providers.settings_json`（v4 迁移——单列，非新表）；② 端点 = PATCH `/api/admin/providers/:id` 扩 `settings` 键级合并（零新端点）；③ 窗口 = 进程内存 60s 定窗（重启归零）；④ 拒绝形 = 429 `rate_limited` + `Retry-After`；备选（被否）= 新表 `model_settings` + 新端点族 ∥ 滑动窗 ∥ 持久窗（全文 = `webui/WEBUI.md` §7 KD-SV-34 ∥ `gateway/API.md` §6 KD-SV-35） | 披露（上抛裁定） | 如无异议按设计实施；存储面改动须同拍 `store/STORE.md`/`gateway/API.md` |
| R33 | **随正六件登记（父侧——跨批写门禁；本批）**：`-console-modals` ∥ `-server-gateway`（v4 读点） ∥ `-server-i18n`（档单/键族） ∥ `-server-gateway-webui-deploy`（档目） ∥ `-console-completeness-2` ∥ `-console-providers` + `thincoder-server/package.json`（`prepublishOnly` 添件）；断点以当刻盘面为准；行数 = §6 注⑧ | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R34 | **实施后回填轮（本批）**：预算实读（webui/gateway/ops/store 增量 ∥ 两新档——§6 ≈7467 推算值收正）∥ 批内件行数 ∥ 随正六件核销 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R35 | **跨批顺序披露**：本批设计档引用 provider 重做批成果（§2.4④ 退役注行 ∥ `views-providers-modals.mjs`）——两批实施顺序建议 = provider 重做批先行、本批随后（其随正链 18 ⇒ 19 先落，本批再 19 ⇒ 20）；顺序倒置时断点以当刻盘面为准（在案） | 披露（不阻塞） | 实施排期参考 |
| R36 | **实施后回填轮（本批）**：预算实读（`style.css` 三批叠加断点收正——§6 ≈7493 推算值 ∥ webui 小计 ≈3180）∥ 批内件行数 ∥ 随正件 = 无（核销在案） | 实施后设计回填轮（沿先例） | 实施后轮 |
| R37 | **需求档收正（已办）**：`docs/server/requirements/PROJECT.md` §2:17 ∥ §2:19 两行超宽（改前实读 315 ∥ 565 字符——本批机检读数）已拆行落地（2026-10-06——需求档变更记录在册：主 agent 直接执行 · 可 revert）；本批设计侧零新增超宽 | 需求档修复（主 agent 笔） | 已办（2026-10-06） |
| R38 | **披露——字排/悬停两口径的后果（供用户/评审复核）**：一字号（13px）+ 零粗体下页题（h2）∥ KPI 数值（`stat-value`）∥ 卡题与正文同号同重——层级 = 结构通道（位置/间距/底色/边框）；悬停统一 = 全数据行（含不可点表——可点性由指针/焦点环承担）。如用户要求保留字号层级或「仅可点行悬停」⇒ 回笔需求 §2:19 边界句，值表单点调整 | 披露（不阻塞） | 评审/用户复核 |
| R39 | **披露——退役且已停用模型的控制台重开径**：上游已退役（不在发现列表）且已停用的模型 ⇒ 控制台零重开路径（Provider 页该类项只读注「停用入口 = 服务模型页」且停用后注行不含——`webui/WEBUI.md` §2.4④；服务模型页列表 = 开放集 ⇒ 行不在——§2.4③）；重开径 = API 级 PATCH `models`（口径沿 R30）；如用户要求控制台重开入口 ⇒ 回笔（候选面需发现数据——与 21:36 无手填裁定衔接） | 披露（不阻塞） | 用户/主 agent 排期 |

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮 · eng-designer）——第一步 token 网关设计（单档）。
- 2026-10-06：**补轮（fix）**——① B 案织入（轻量账号体系：登录 ∥ 双角色 ∥ 自助改密 ∥ 管理页；admin 重置 = 在——用户 08:06；前端 = vanilla 静态文件——用户 08:09）；② 三层结构（板 → 域 → 档——代码/文档同拍；用户 08:12→08:14 文档令）；③ 增增长与演进域（用户 08:11 架构令）；④ 部署面薄面落（用户 08:21→08:24——`ops/OPS.md` §5：分发两路 = npm 发布 ∥ Docker；守护两路 = systemd ∥ 容器 restart；升级回滚/备份/两版清单）。
- 2026-10-06：**fix 轮（评审轮次 1 六条——批 `docs/batches/2026-10-06-server-gateway.md` §3）**：#1 管理面 key 枚举补记（§4 索引增 KD-SV-16）∥ #2 §7 补 AC-8 行（分发与部署——判据 = `ops/OPS.md` §7）∥ #3 §9 R7 销项（需求档回笔已办——2026-10-06）∥ #5 §2.1 ops 行补列 `config.example.json` ∥ `README.md`（对齐域预算表）∥ #6 §6 随动表 `.gitignore` 行改仓根相对 + 补现行行数。
- 2026-10-06：**实施后回填轮（fix）**——§6 行数按实读回填（全树 **2720 行 ∥ 31 档**；行式 = 实读值（实读日期——设计估））；§8 实施序注「派单为准」（实施 = 四阶段：骨架 → 账号与计量 → 聊天链 → 控制台/向量/部署）。
- 2026-10-06：模型标识口径变更（用户 10:27–10:28）——§4 索引 KD-SV-4 行随正（`provider/model` 复合键——全文 = `gateway/API.md` §6）；同源随动 = `gateway/API.md` §2/§2.1 ∥ `ops/OPS.md` §1。
- 2026-10-06：小收尾轮（fix）——§6 总账再收正（全树 **2745 行 ∥ 31 档**：gateway ⇒ 658 ∥ ops ⇒ 683）；批内件行随正（基准件 486 ∥ 拆档五件含 `-model-ref` 155——合计六件）。
- 2026-10-06：provider 预设设计轮（批 `docs/batches/2026-10-06-server-presets.md`——需求 §2:9 ∥ 台账 #960）——§2.1 ops 行四档（+ presets）∥ §4 索引增 KD-SV-17（标题 1–16 ⇒ 1–17）∥ §6 预算随动（ops ⇒ 预期 ≈762；全树 31 ⇒ 32 档；含 README 复测校正 +1）∥ §6 随动表补本批批档/批内件行 ∥ §7 补 AC-9（候补）∥ §9 增 R7/R8 ∥ 两条 `config.json` 既存悬空按注记集闭合（§6 随动表 `.gitignore` 行）；机制全文 = `ops/OPS.md` §1。
- 2026-10-06：评审轮次 1 收正（父侧直接执行 · 机械 · 可 revert）——§7 AC-9 行标记收正（已落需求档）∥ §9 R7 销项（已办）。
- 2026-10-06：实施后回填轮（R8 · 父侧直接执行 · 机械 · 可 revert）——§6 全树 **2824 行（32 档）**（域级 ops ⇒ 762；含预设面 +63）∥ 随动表本批行收正（批内件实读 **347**）。
- 2026-10-06：自动更新设计轮（批 `docs/batches/2026-10-06-server-auto-update.md`——需求 §2:10 ∥ 台账 #961）——§2.1 ops 行五档（+ update）∥ 部署档组补 entrypoint/converge（拟新增）∥ §4 索引增 KD-SV-18（标题 1–17 ⇒ 1–18）∥ §6 预算随动（ops ⇒ 本批预期 ≈1107；全树 ⇒ ≈3170 ∥ 35 档；package.json 随动）∥ §6 随动表补本批批档/批内件行 ∥ §7 补 AC-10（候补）∥ §9 增 R9–R12（含需求档行宽破口报告项）；机制全文 = `ops/OPS.md` §5.4。
- 2026-10-06：控制台 provider/模型管理 + IA 设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ §2:14 ∥ 台账 #962/#966）——§1 定位句随正（侧栏分组导航七页）∥ §2.1 gateway 行（+ provider-admin）∥ webui 行（九档重排——`views.mjs` 退役）∥ §2.2 控制台链随正 ∥ §4 索引增 KD-SV-19/20（标题 1–18 ⇒ 1–20）∥ §6 预算随动（产品面 ≈+840 ∥ 全树 35 ⇒ 41 档）∥ §6 随动表补本批批档/批内件行 ∥ §7 补 AC-11/AC-12 候补行 ∥ §9 增 R13/R14。
- 2026-10-06：实施后回填轮（R11 · 父侧直接执行 · 机械 · 可 revert）——§6 全树 **3308 行（35 档）**（域级 ops ⇒ **1246**；含自动更新面 +484）∥ 随动表本批行收正（批内件实读 **498**）∥ §9 R11 销项；R2② provider 配置形态按 KD-SV-19 收正（已定）。
- 2026-10-06：fix 轮（评审轮次 1 五条——批 `docs/batches/2026-10-06-console-providers.md` §3）：#2 §7 AC-11/AC-12 行标记收正（已落需求档）∥ §9 R13 销项（已办——沿 R7/R9 先例）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12 ∥ 台账 #963）——§1 定位句补完备化面 ∥ §2.1 gateway 行（+ system）/accounts 行（+ login-guard）/metering 行/ops 行（+ backup；陈旧「拟新增」标记随正——update/entrypoint/converge 已落盘）∥ §2.2 控制台链（防爆破门 + 系统页数据）∥ §4 索引增 KD-SV-21–25（标题 1–20 ⇒ 1–25）∥ §6 预算随动（产品面 ≈+518 ∥ 全树 41 ⇒ 44 档）+ 随动表补本批行 ∥ §7 补 AC-13 候补行 ∥ §9 增 R15/R16；机制全文 = `gateway/API.md` §2.3 ∥ `accounts/ACCOUNTS.md` §2 ∥ `metering/METERING.md` §1 ∥ `ops/OPS.md` §5.5/§5.6/§5.9 ∥ `webui/WEBUI.md` §2.1。
- 2026-10-06：控制台多语言设计轮（批 `docs/batches/2026-10-06-server-i18n.md`——需求 §2:13 ∥ 台账 #965）——§1 定位句（IA/多语言双指）∥ §2.1 webui 行（十二档 + 多语言）∥ §3 文档地图 webui 行（+ 多语言）∥ §4 索引增 KD-SV-26（标题 1–25 ⇒ 1–26）∥ §6 预算随动（产品面 ≈+632 ∥ 全树 44 ⇒ 47 档）+ 随动表补本批行 ∥ §7 补 AC-14 候补行 ∥ §9 增 R17/R18；机制全文 = `webui/WEBUI.md` §2.2。
- 2026-10-06：fix 轮（评审轮次 1 #4/#7——批 `docs/batches/2026-10-06-first-release-completeness.md` §3）：§6 分解句收正（views-* +25 ⇒ +35——与 `webui/WEBUI.md` §5 逐档同拍）∥ 各域预算表 ops 预估值收正（≈765 ⇒ ≈762；合计 ≈3220 ⇒ ≈3217——与 `ops/OPS.md` §6 同拍）。
- 2026-10-06：总账导数随动（父侧直接执行 · 机械 · 可 revert）——≈3250 ⇒ **≈3247**（= 合计 ≈3217 + package ≈30——承 fix 轮 #7；现已闭式）。
- 2026-10-06：AC-13/AC-14 行候补标记收正 + R15/R17 销项（父侧直接执行 · 机械 · 可 revert——已落需求档验收表）。
- 2026-10-06：fix 轮（评审轮次 1 #3/#4——批 `docs/batches/2026-10-06-server-i18n.md` §3）：§9 R17 收正（§2:13 措辞收正 = 已办——需求档变更记录在册；AC-14 行候补 = 父侧回笔待办）∥ §6 随动表本批行补随正三件增量（`-webui-deploy` 322 ⇒ ≈326 ∥ `-auto-update` 498 ⇒ ≈502 ∥ `-console-providers` ≈450 ⇒ ≈455——各 ≤±5；与批档 §2.4 勘误同拍）+ `-webui-deploy` 现读收正（321 ⇒ 322）。
- 2026-10-06：实施后回填轮（R14——批 `docs/batches/2026-10-06-console-providers.md`）：§6 全树 **4024 行（41 档）**（域级 gateway ⇒ 951 ∥ store ⇒ 124 ∥ webui ⇒ 943 ∥ ops ⇒ 1270；控制台面 +716）∥ 随动表本批行收正（批内件实读 **479**）∥ §9 R14 销项（旧件随正五件核销）；域档同拍（`webui/WEBUI.md` §5 ∥ `gateway/API.md` §4 ∥ `store/STORE.md` §4 ∥ `ops/OPS.md` §6——含 `views.mjs` 退役行迁移期引文标记）。
- 2026-10-06：实施后回填轮（R16——批 `docs/batches/2026-10-06-first-release-completeness.md`）：§2.1 三域行「拟新增」标记随正 ∥ §6 全树 **4534 行（44 档）**（域级 gateway ⇒ 1007 ∥ accounts ⇒ 632 ∥ metering ⇒ 233 ∥ webui ⇒ 1006 ∥ ops ⇒ 1506；完备化面 +509 ∥ package.json +1）∥ 随动表本批行收正（批内件实读 **497**）∥ §9 R16 销项。
- 2026-10-06：实施后回填轮（R18——批 `docs/batches/2026-10-06-server-i18n.md`）：§6 全树 **5074 行（47 档）**（域级 webui ⇒ **1545** ∥ ops ⇒ **1507**；对照总账 ⇒ ≈5237；多语言面 +540）∥ 随动表本批行收正（批内件实读 **298** ∥ 随正三件核销——322 ∥ 498 ∥ 479）∥ §2.1「拟新增」标记随正 ∥ §9 R18 销项。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 定位句（九页 + 二轮面）∥ §2.1 模块表随正（gateway 十档 ∥ accounts 七档 ∥ webui 十五档；职责补审计/报表/控制台数据面）∥ §2.2 控制台链（九页）∥ §4 索引增 KD-SV-27–30（标题 1–26 ⇒ 1–30）∥ §6 预算随动（产品面 ≈+1237 ∥ 全树 ⇒ ≈6344（53 档））+ 随动表补本批行（含随正五件）∥ §7 补 AC-15 行 ∥ §9 增 R19–R22（含需求档回笔与「成员删」披露）。
- 2026-10-06：fix 轮（评审 #69——批 `docs/batches/2026-10-06-console-completeness-2.md` §3 十项，本档面）：随正清单五件 ⇒ 七件（+ 网关基准件 ∥ 自动更新件——断言改点 = §6 注④⑤）∥ `prepublishOnly` 件数十二件（+ #972 件——落点 = 清单单行添项）∥ KD-SV-20 七页 ⇒ 九页 ∥ 合数 ≈+1237 ⇒ ≈+1270（分项和收正）∥ 基准件实读 486 ⇒ 496 + 七件行数注/拆档预案（§6 注①②③）∥ §9 R21/R22 随正七件。
- 2026-10-06：控制台弹窗批设计轮（批 `docs/batches/2026-10-06-console-modals.md`——需求 §2:16 ∥ §2:17 ∥ 台账 #973/#974）——§1 定位句（十页）∥ §2.1 webui 行（十七档 + 弹窗职责）∥ §2.2 控制台链（十页）∥ §3 文档地图 webui 行（+ 弹窗机制）∥ §4 索引增 KD-SV-31/32（标题 1–30 ⇒ 1–32）∥ KD-SV-20 九页 ⇒ 十页 ∥ §6 预算随动（产品面 ≈+399 ∥ 全树 ⇒ ≈6743（55 档））+ 随动表补本批行（含随正四件 + 注⑥）∥ §7 补 AC-16/AC-17 行 + AC-12 行档目随正 ∥ §9 增 R23–R27（含配置候选表与 i18n 拆表登记）。
- 2026-10-06：fix 轮（评审轮次 1 第 1–4 项——批 `docs/batches/2026-10-06-console-modals.md` §3）：§6 随正四件 ⇒ 五件（+ `-server-auto-update`——门禁件数 12 ⇒ 13）+ `thincoder-server/package.json` 登记（`prepublishOnly` 清单十二件 ⇒ 十三件；全树总账 +1 ⇒ ≈6744）∥ §9 R23 销项（已办——需求档回笔在盘）∥ §9 R25 双表收正（≈309 ∥ ≈305）+ 处置落定（独立结构轮）∥ §6 注⑥ 随正（五件 + 新批内件估算 ≈450）。
- 2026-10-06：控制台 Provider 重做设计轮（批 `docs/batches/2026-10-06-console-provider-redo.md`——需求 §2:18 ∥ 台账 #980）——§2.1 webui 行（十八档）∥ §4 索引增 KD-SV-33（标题 1–32 ⇒ 1–33）∥ §6 预算随动（产品面 ≈+196 ∥ 全树 ⇒ ≈6940（56 档））+ 随动表补本批行（含随正五件）+ 注⑦ ∥ §7 补 AC-18 行 + AC-11 行随正 + AC-12/AC-16 档目随正 ∥ §9 增 R28–R30 + R24 收正（已裁——ACDE 入选 / B 否）；机制全文 = `webui/WEBUI.md` §2.4④。
- 2026-10-06：服务模型配置面设计轮（批 `docs/batches/2026-10-06-models-config.md`——需求 §2:17 ∥ 台账 #981；裁定 21:39「ACDE」∥ 21:40「A 保留」）——§2.1 gateway 行（十一档 + 模型限流）∥ store 行（v4）∥ webui 行（十九档）∥ §2.2 chat 链 [4] 补限流准入 ∥ §4 索引增 KD-SV-34/35（标题 1–33 ⇒ 1–35）∥ §6 预算随动（产品面 ≈+526 ∥ 全树 ⇒ ≈7465（58 档））+ 随动表补本批行（含随正六件）+ 注⑧ ∥ §7 AC-17 行随正 ∥ §9 R24/R30 收正 + R31–R35；机制全文 = `webui/WEBUI.md` §2.4③ ∥ `gateway/API.md` §2.1/§2.2/§6。
- 2026-10-06：样式族统一设计轮（批 `docs/batches/2026-10-06-console-list-style.md`——需求 §2:19 ∥ 台账 #982）——§2.1 webui 行（+ 样式族）∥ §4 索引增 KD-SV-36（标题 1–35 ⇒ 1–36）∥ §6 预算随动（产品面 ≈+26 ∥ 全树 ⇒ ≈7491（58 档——零新档））+ 随动表补本批行（随正件 = 无）+ 本批预算段 ∥ §7 补 AC-19 行 ∥ §9 增 R36–R38；机制全文 = `webui/WEBUI.md` §2.5。
- 2026-10-06：fix 轮（评审 #94——批 `docs/batches/2026-10-06-console-provider-redo.md` §3；本档面）：§7 AC-11 行删「手填降级」残留引文（无手填在案——校正历史 = §9 R28）∥ §6 本批预算行 i18n 净增量口径统一（净 ≈−1/表；聚合估数回填轮实读收正）。
- 2026-10-06：fix 轮（评审 #95——批 `docs/batches/2026-10-06-models-config.md` §3 受理项；本档面）：§6 预算收正（产品面 ≈+526 ⇒ ≈+527 ∥ 全树 ≈7465 ⇒ **≈7467**——分项和闭式；样式行 ≈7491 ⇒ ≈7493 随动 ∥ 域表 store 行对齐 `store/STORE.md` 实读链）∥ §6 注⑧ v4 读点逐点列明 ∥ §7 AC-12/AC-16/AC-18 档目链补「配置面批后 19 ∥ 20」∥ §9 R39 增（退役且已停用模型重开径披露）+ R34/R36 推算值随正。
- 2026-10-06：fix 轮（评审 #96——批 `docs/batches/2026-10-06-console-list-style.md` §3 七条；本档面）：§3 文档地图 webui 行补「样式族规范（§2.5）」∥ §4 索引 KD-SV-36 悬停句收正（列表行/中性面）∥ §6 口径句限定时点 + 越线在册 ∥ §6 随动表本批行 + 注⑨（新批内件估算 ≈400 ∥ 拆档预案）∥ §9 R37 销项。
