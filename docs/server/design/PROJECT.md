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
| metering | `thincoder-server/src/metering/` 五档（usage ∥ aggregates ∥ report ∥ quota ∥ routes） | 记账（同事务三写：usage + 派生两表） ∥ 配额（三级计数准入） ∥ 用量/配额端点（含报表/导出——§3） ∥ 保留窗清理 | `metering/METERING.md` |
| store | `thincoder-server/src/store/` 一档（db）（已落盘） | 库 ∥ DDL ∥ 迁移链（各域共用；v5 = 模型标识两字段拆列 + 派生两表 + 成员配额列） | `store/STORE.md` |
| webui | `thincoder-server/src/webui/` 一档（static）+ `thincoder-server/public/` 二十九档（静态——`index.html` ∥ `app.mjs` ∥ `dom.mjs` ∥ `health.mjs` ∥ `nav.mjs` ∥ `views-*` 十档 ∥ `modal.mjs` ∥ `i18n.mjs` ∥ `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ i18n 部件八档（`i18n-{zh,en}-{shell,me,admin,system}.mjs`） ∥ `model-specs-snapshot.mjs` ∥ `style.css`；含 favicon 全目录三十档；`views.mjs` 退役） | 页面路由 ∥ HTML/JS/CSS ∥ 静态直发 ∥ IA/导航 ∥ 多语言（§2.2） ∥ 可见面二轮（§2.3） ∥ 弹窗与服务模型配置面（§2.4） ∥ 样式族规范（§2.5） | `webui/WEBUI.md` |
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
[3] body → model 形校（缺 model ⇒ 400）
[4] providers 精确匹配派发（未命中 ⇒ 404）→ 准入双闸：配额（三级分模型——计数表点查；超限 ⇒ 429 `quota_exceeded`；KD-SV-38）→ 模型限流（per-model RPM/TPM 超限 ⇒ 429 `rate_limited` + `Retry-After`；KD-SV-35）
[5] 转发上游（网关侧真 key；流式注入 stream_options.include_usage）
[6] 响应透传（SSE 逐块 ∥ 旁路 tap 只读扫描 usage——字节零改）
[7] 记账（请求结束/流终结/客户端断开时——同事务三写：usage 行 INSERT + usage_daily/quota_counters 两 upsert）
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
| `webui/WEBUI.md` | 域 | webui | 静态面 ∥ 控制台 IA 与视图 ∥ 多语言（i18n） ∥ 可见面二轮（§2.3） ∥ 弹窗机制（§2.4） ∥ 样式族规范（§2.5） ∥ 数据表壳布局（§2.6） ∥ 判权/自托管约束 ∥ 本域文件与预算 ∥ 验收判据 |
| `ops/OPS.md` | 域 | ops | 配置面 ∥ 首启引导 ∥ 运维 CLI ∥ 启动/停机/部署面 ∥ 日志 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |

## 4. 决策索引（KD-SV-1–54）

| # | 决策一句话 | 所在档 |
|---|---|---|
| KD-SV-1 | 形态 = 单进程单服务 | 本档 §5 |
| KD-SV-2 | 不 import `thincoder-core/*`（含 provider 层） | 本档 §5 |
| KD-SV-3 | 存储 = `node:sqlite`（WAL ∥ `user_version`） | `store/STORE.md` |
| KD-SV-4 | 模型派发 = `provider/model` 复合键精确匹配 | `gateway/API.md` |
| KD-SV-5 | 流式计量 = 注入 `stream_options.include_usage` + 旁路 tap | `gateway/API.md` |
| KD-SV-6 | 配额周期/单位 = 自然月 ∥ token（机制 = KD-SV-38） | `metering/METERING.md` |
| KD-SV-7 | 管理/自助面 = 登录制页面 + 本机 CLI 兜底 | `accounts/ACCOUNTS.md` |
| KD-SV-8 | 计量写入 = 请求终结后同事务三写（usage + 派生两表） | `metering/METERING.md` |
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
| KD-SV-37 | 控制台布局收正 = 数据表五页视口高壳 + 左对齐 + 弹窗列表表格化 | `webui/WEBUI.md` §7 |
| KD-SV-38 | 配额分模型 = 三级（成员×模型覆盖 ⇒ 平台默认 ⇒ 不限）+ 计数固定字段点查准入（计数 = 记账同事务；三级全无 ⇒ 零 SQL 短路；检查点 = 派发命中后/转发前——仅 chat） | `metering/METERING.md` §6 |
| KD-SV-39 | 汇表面（报表/成员页/汇总）= 预聚合日表 `usage_daily`（记账同事务 upsert；明细/导出/审计零动——真源；API 契约不变；回填 + `usage reconcile` 对账） | `metering/METERING.md` §6 |
| KD-SV-40 | v5 迁移 = 模型标识两字段（`provider` ∥ `model`）+ 派生两表 + 旧列删除（拆列判据 = `endpoint='chat'`；嵌入 `provider=''`；旧 `quota_tokens` 删列不弃用） | `store/STORE.md` §5 |
| KD-SV-41 | 配额配置面 = 服务模型页 F 组（settings `quotaTokens`）+ 成员弹窗分模型覆盖（键级合并——不在清单键恒保留） | `webui/WEBUI.md` §7 |
| KD-SV-42 | 成员模型禁用 = 默认全可用 + 勾选即禁用（即时写；v6 列；派发命中后/配额前 404 `model_not_found`；`/v1/models` 随动滤除） | `accounts/ACCOUNTS.md` §6 |
| KD-SV-43 | 成员弹窗 = 模型表直显（查看态）+ 逐行已用（自然月 ∥ `memberView.modelUsage`；离表键注行） | `webui/WEBUI.md` §7 |
| KD-SV-44 | i18n 计数复数形 = `Intl.PluralRules` + `.one` 变体族（仅 en） | `webui/WEBUI.md` §7 |
| KD-SV-45 | 上游模型元数据 = 白名单留存（v7 `providers.model_meta_json`）+ 弹窗列式展示 + 退役提示（只提示） | `webui/WEBUI.md` §7 |
| KD-SV-46 | 候选段在飞态 = 静态 `.hint` + 触发钮禁用 | `webui/WEBUI.md` §7 |
| KD-SV-47 | 我的·key 页 = 多把并存工作台（六列表 ∥ 双弹窗 ∥ 复制钮 ∥ 接入卡复用 ∥ 轮换页下架；v8 列） | `webui/WEBUI.md` §7 |
| KD-SV-48 | key 自助面 = 多把并存（签发 + 逐把吊销）+ 命名（默认 `key-N` 落库）+ 上限 20（CLI 免）+ 他人 key 404 | `accounts/ACCOUNTS.md` §6 |
| KD-SV-49 | 「我的·用量」页 = 本人面轻量图表（看板形 ∥ 维度切换 ∥ 导出不设；壳面五页维持） | `webui/WEBUI.md` §7 |
| KD-SV-50 | 本人用量报表 = 新端点 `GET /api/me/usage/summary`（复用 `usageSummary` + 逐日维序；admin 端点零动） | `metering/METERING.md` §6 |
| KD-SV-51 | i18n 表族 = 按域拆四部件 + 聚合门面（结构轮——#976 断点落地） | `webui/WEBUI.md` §7 |
| KD-SV-52 | `app.mjs` 拆三档（`dom.mjs` ∥ `health.mjs`；#993 断点落地） | `webui/WEBUI.md` §7 |
| KD-SV-53 | bin 主入口判据 = `argv[1]` 经 `realpathSync` 解析后与 `import.meta.url` 比对（符号链接垫片形可主入口执行；不可解析 ⇒ 显式报错） | `ops/OPS.md` §8 |
| KD-SV-54 | 控制台 provider 测试/发现 = 草稿 key 口径（明填 ⇒ `apiKey` 明传 ∥ 留空 ⇒ `providerId` 回落 ∥ 清除勾 ⇒ 显式空——保存语义镜像） | `webui/WEBUI.md` §7 |

## 5. 关键决策（本档）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-1 | **形态 = 单进程单服务**（`node:http`——模块表见 §2.1） | 「内网一台常驻」；团队规模并发；零依赖纪律下无必要拆进程 | 多进程拆（入口/计量分离——无收益增运维）· 引 Web 框架（违零依赖） |
| KD-SV-2 | **不 import `thincoder-core/*`**（含 provider 层） | ① 核 `thincoder-core/provider/sse.mjs` 的 `readSSE` 是消费型（onToken 回调 ∥ 全量累积 ∥ 规则短路 ∥ 120s idle 判定）——中继复用会强制整段消费/再序列化，与「SSE 逐块透传」相抵；② 核 provider 层面向客户端多协议适配（anthropic/google/responses ∥ 重试 ∥ 限速 ∥ 思考映射）——网关零需要；③ 网关要「不认识内容」的代理语义——解析越少越稳。行数影响：自持 `thincoder-server/src/gateway/sse-tap.mjs`（≈80 行）覆盖全部所需（`data:` 行 JSON 取 usage） | **全引 `chat()`**（消费型语义错配 + 强制缓冲）· **引窄叶**（`normalizeUsageCache`——服务客户端缓存语义、网关不需要；`RETRYABLE_STATUS`——本设计不做重试）· **引 `embedding.mjs`**（自带批量/归一化/整流——网关须原样透传与计数，语义不符） |

## 6. 受影响文件与行数预算（总账）

口径：全为新建树——预算 = 实施前估值；已实施落盘：行数 = 实读（口径 = 内容行数 ∥ 文末换行不计），行式 = 实读值（实读日期——设计估），小计 = 预算 ⇒ 实读。全部单档 **≤500 行软线内**（时点 = 本回填；
  此后实读（2026-10-08 结构轮后）：`views-admin.mjs` **331** ∥ `views-providers-modals.mjs` **367**（2026-10-07 实读）；`app.mjs` ∥ i18n 双表两越线条目已由结构轮拆解（2026-10-08——`webui/WEBUI.md` §5/§2.2）；
  此外最宽 = `config.mjs` **260** ∥ `README.md` **244**（2026-10-07 实读））；
  800 硬限未触及；全树实读 **5074 行（47 档）**（含 README 复测校正 +1 ∥ 预设面 +63 ∥ 自动更新面 +484 ∥ 控制台面 +716 ∥ 完备化面 +509 ∥ 多语言面 +540 ∥ package.json +1——2026-10-06 回填后）。
  控制台二轮面预算（2026-10-06 设计轮——本批）：产品面 ≈+1270（gateway ≈+185 ∥ accounts ≈+153 ∥ metering ≈+144 ∥ store ≈+36 ∥ webui ≈+702 ∥ ops ≈+49 ∥ package.json +1——落点 = `prepublishOnly` 清单添本批件）⇒ 全树 **≈6344 行（53 档**——+6 新档）；实施后回填轮校正。
  控制台弹窗批预算（2026-10-06 设计轮——弹窗批）：产品面 ≈+400（webui ≈+399——modal 新 ≈110 ∥ views-models 新 ≈110 ∥ views-admin +≈110 ∥ style +≈30 ∥ i18n 两表 +≈34 ∥ nav +≈3 ∥ app +≈2；package.json +1——落点 = `prepublishOnly` 清单添本批件：十二件 ⇒ 十三件——以 #972 随正落地后实读为准）⇒ 全树 **≈6744 行（55 档**——+2 新档）；实施后回填轮校正。
  控制台 Provider 重做批预算（2026-10-06 设计轮——本批）：产品面 ≈+196（webui ≈+195——`views-providers` 拆分（214 ⇒ ≈110 + 新档 ≈260）∥ style +≈25 ∥ i18n 两表 ≈−2（净 ≈−1/表）；package.json +1——`prepublishOnly` 清单添本批件：十三件 ⇒ 十四件）⇒ 全树 **≈6940 行（56 档**——+1 新档）；实施后回填轮校正。
  服务模型配置面批预算（2026-10-06 设计轮——本批）：产品面 ≈+527（webui ≈+314——`views-models` 77 ⇒ ≈235 ∥ `model-specs-snapshot.mjs`（已落盘）**≈80 ⇒ 实读 103** ∥ i18n 两表 +≈50 ∥ style +≈26；
  gateway ≈+171——`ratelimit.mjs`（已落盘）**≈90 ⇒ 实读 64** ∥ provider-admin +≈28 ∥ providers +≈19 ∥ routes +≈14 ∥ errors +≈9 ∥ forward +≈6 ∥ server +≈5；ops ≈+30——config settings 校验；store ≈+11——v4 段；package.json +1——`prepublishOnly` 清单添本批件：十四件 ⇒ 十五件（件数以当刻盘面为准））⇒ 全树 **≈7467 行（58 档**——+2 新档）；实施后回填轮校正。
  样式族统一批预算（2026-10-06 设计轮——本批）：产品面 ≈+26（webui ≈+26——`thincoder-server/public/style.css` **139 ⇒ ≈165 ⇒ ≈190 ⇒ ≈216**（三批叠加 = 配置面 +≈26 ∥ provider 重做 +≈25 ∥ 本批 +≈26 = `:root` 变量族 +≈20 ∥ 态面 +≈9 ∥ 死规则 −2；顺序倒置时以当刻盘面为准）；views/app ±0——类串微改行数零变；零新档）⇒ 全树 **≈7493 行（58 档**——档数不变）；实施后回填轮校正。
  me-keys 批预算（2026-10-07 设计轮——本批）：产品面 **≈+221**（webui ≈+155——`views-me` **122 ⇒ ≈211** ∥ `app` **321 ⇒ ≈346** ∥ `views-system` **172 ⇒ ≈178** ∥
  i18n 两表 +≈22/表 ∥ `style` **224 ⇒ ≈219**；accounts ≈+56——`keys` **109 ⇒ ≈131** ∥ `routes` **118 ⇒ ≈152**；store ≈+10——`db` **210 ⇒ ≈228**；零新档——档目 19 ∥ 20 不变）；批内件另计——随正件/批内件行数注 = 注⑩。
  me 用量图表化批预算（2026-10-07 设计轮——本批）：产品面 **≈+184 ⇒ 实读 +189**（metering **≈+63 ⇒ 实读 +64**——`report` **168 ⇒ 实读 226**（`memberUsageSummary`——估 ≈223，越估 3） ∥ `routes` **111 ⇒ 实读 117**（me summary 路由——估 ≈119，低于估 2）；
  webui **≈+121 ⇒ 实读 +125**——`views-me` **194 ⇒ 实读 295**（用量页图表化重写——估 ≈279，越估 16；≤500 软线内） ∥ `style` **218 ⇒ 实读 228**（堆叠段/切换/链增——估 ≈240，低于估 12） ∥ i18n 两表 375 ∥ 378 ⇒ **实读 382 ∥ 385**（+8 ∥ −1/表） ∥ `views-overview` **±0**（`statCard` 导出——1 词改，行数零增）；零新档——档目 19 ∥ 20 不变）；
  批内件两件（越 500 硬线拆档——沿 me-keys 先例）：`docs/batches/2026-10-07-me-usage-charts.test.mjs` **228** ∥ `docs/batches/2026-10-07-me-usage-charts-ui.test.mjs` **403**；随正件 = 六件断言件 + `-console-layout` me 页两处断点（父侧落讫）；`thincoder-server/package.json`（`prepublishOnly` 24 ⇒ **26**——本批两件入链）——行数注 = 注⑪。
  结构轮（server `public/**` 结构——i18n 拆表 ∥ `app.mjs` 拆分）预算（2026-10-08 设计轮——本批）：webui **≈+77**（i18n 表族拆表 **≈+53**（zh +26 = 382 ⇒ ≈392 部件 + ≈16 门面 ∥ en +27 = 385 ⇒ ≈396 + ≈16） ∥ `app.mjs` 三拆 **≈+24**（350 ⇒ ≈192 + ≈120 + ≈62）——实读回填）；
  档目 19 ∥ 20 ⇒ **29 ∥ 30**（+10 档）；零 `src/**` 触 ∥ 零服务端语义；随正件 = **十六件**门禁断言件 + `thincoder-server/package.json`（`prepublishOnly` 26 ⇒ **27**——本批件入链）——行数注 = 注⑫。
  bin 入口 guard 修复批预算（2026-10-09 设计轮——本批；台账 #1113）：产品面 ≈+2——`thincoder-server/bin/thincoder-server.mjs` 实读 **176**（2026-10-09）⇒ **实读 178**（`realpathSync` import ∥ 注释——判据行就地改写 ±0；2026-10-09 回填轮实读收正）；
  `thincoder-server/package.json` ±0（`prepublishOnly` 清单 27 ⇒ **28**——本批件入链（已落盘）；单行清单行数零变）∥ 批内件一件（`docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`——已落盘 112 行）；机制全文 = `ops/OPS.md` §4；实施后回填轮（已办——2026-10-09）。
  控制台测试 key 缺陷修复批预算（2026-10-09 设计轮——本批；台账 #1120）：产品面 ≈+8——`thincoder-server/public/views-providers-modals.mjs` 实读 **367**（2026-10-07）⇒ ≈375（草稿 key 助手 ∥ 两调用点与注释随正）；
  i18n 两表 ∥ `style.css` ±0（文案与样式零动）∥ `thincoder-server/package.json` ±0（`prepublishOnly` 清单添本批件——本批 +1 件（拟新增）；单行清单行数零变）∥ 批内件一件（拟新增——`docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`，估 ≈160 行）；机制全文 = `webui/WEBUI.md` §2.4④（KD-SV-54）；实施后回填轮校正。
  随正件（本批——fix 轮补列）：门禁件数断言七件 N ⇒ N+1——注释同拍（N 以实施当刻盘面实读为准——现值实读 2026-10-09 = 28 ⇒ 29；在途批入链先后影响绝对值）：`-console-list-style` · `:237` ∥ `-server-auto-update` · `:480` ∥ `-console-layout` · `:449` ∥
  `-me-usage-charts` · `:225` ∥ `-provider-model-metadata` · `:491` ∥ `-quota-per-model` · `:444` ∥ `-quota-v2-member-models` · `:428`——父侧落地（实施轮同拍；行数 ±0——断言文本就地收正）；文档链随正 = `ops/OPS.md` §5.1 ∥ 本档 §6 板级行（28 ⇒ 29 件）。
  ※ 2026-10-07 各批（布局收正 ∥ 配额分模型 ∥ 配额 v2 ∥ 模型元数据 ∥ 列式收正）的总账行未回填——**滞账在册（§9 R40②）**；
  本行原值以各域档小计为准（webui **3350** ∥ accounts **897** ∥ store/db **210**——各批实读在盘）。
  对照设计总账 ≈5237（= 闭式 ≈3247 + 控制台面预期 ≈840 + 完备化面预期 ≈518 + 多语言面预期 ≈632；实读差 −163 = 前账超出 +61 ∥ 控制台面回落 −124 ∥ 完备化面回落 −9 ∥ 多语言面回落 −92 ∥ package.json +1）。
自动更新批回填（2026-10-06）：**3308 行（35 档）**（+484 = ops 族 +484 ∥ package.json +0——详见 `ops/OPS.md` §6）。

- **板级**：`thincoder-server/package.json`（可发布形：`@thincoder/server`（拟） ∥ `files` 白名单 ∥ `bin` = `thincoder-server` ∥ engines `node>=24` ∥ `prepublishOnly` 门禁；`private` 撤；dependencies 空；实读 26 行（估 ≈30；含 `dev` 脚本行）；`prepublishOnly` 清单 28 ⇒ 29 件
  （八 + #962/#963/i18n/#972 件 + 后续各批 16 件））。
- **各域预算表**（「本域文件与行数预算」节）：gateway **≈770 ⇒ 658 ⇒ 951 ⇒ 1007** ∥ accounts **≈570 ⇒ 493 ⇒ 632** ∥ metering **≈260 ⇒ 218 ⇒ 233 ⇒ ≈377 ⇒ 实读 416 ⇒ ≈690** ∥ store **≈175 ⇒ 110 ⇒ 124 ⇒ ≈160 ⇒ 144 ⇒ ≈155 ⇒ 实读 150 ⇒ ≈205** ∥
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
| `docs/batches/2026-10-06-console-completeness-2.md` ∥ `docs/batches/2026-10-06-console-completeness-2.test.mjs`（已落盘） | 本批（控制台可见面二轮——六面）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建（写面受阻 ⇒ `.thincoder/tmp/` 父侧 copy——沿先例）——实读 **497** 行 |
| 随正七件（父侧落地——跨批写门禁） | `-console-providers`（nav 断言 ∥ 档目 15/16） ∥ `-server-gateway-webui-deploy`（档目 12/13 ⇒ 15/16） ∥ `-server-i18n`（键集 ∥ labelKeys 9 ⇒ 11 ∥ JS 档单 ∥ 新档直发） ∥ `-server-gateway-accounts`（key 行形断点五处） ∥ `-first-release-completeness`（`/api/system` 深比 + `embedding.model`） | 行数（实读）⇒ ≤±N 与断言改点 = 下注①②④⑤；实施后回填核销 |
| 随正七件（续——本 fix 轮补入两件） | `-server-gateway`（基准件——v3 断言改点） ∥ `-server-auto-update`（门禁件数 11 ⇒ 12 ∥ 注释同拍） | 同上（行数/改点 = 下注①②④⑤） |
| `docs/batches/2026-10-06-console-modals.md` ∥ `docs/batches/2026-10-06-console-modals.test.mjs`（已落盘） | 本批（控制台弹窗——成员弹窗 + 公共组件 + 服务模型页）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 **473** 行 |
| 随正五件（父侧——跨批写门禁；弹窗批） | `-console-completeness-2`（nav 组项 6 ⇒ 7 ∥ 档目 15/16 ⇒ 17/18 ∥ labelKeys 11 ⇒ 12） ∥ `-console-providers`（nav 断言） ∥ `-webui-deploy`（档目） ∥ `-server-i18n`（键集/JS 档单） ∥ `-server-auto-update`（门禁件数 12 ⇒ 13 ∥ `:9`/`:439`/`:480` 注释与断言同拍——以 #972 随正落地后实读为准） | 断点以当刻盘面为准——登记 = §9 R26；行数增量 = 注⑥ |
| `thincoder-server/package.json`（板级件——`prepublishOnly` 清单） | 本批（弹窗批）：清单添本批件——十二件 ⇒ **十三件**（以 #972 随正落地后实读为准） | 全树总账 +1（≈6743 ⇒ ≈6744） |
| `docs/batches/2026-10-06-console-provider-redo.md` ∥ `docs/batches/2026-10-06-console-provider-redo.test.mjs` ∥ `docs/batches/2026-10-06-console-provider-redo-runtime.test.mjs`（已落盘——拆档双件） | 本批（Provider 管理面重做——列表 + 双弹窗）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 **334** ∥ **350**（拆分搬移：静态面 ①–④ ∥ 运行面 ⑤–⑦） |
| 随正五件（父侧——跨批写门禁；Provider 重做批） | `-console-providers`（档目名单 18 ⇒ 19） ∥ `-console-completeness-2`（同） ∥ `-console-modals`（同） ∥ `-server-gateway-webui-deploy`（档目 + 标题句 17/18 ⇒ 18/19） ∥ `-server-i18n`（JS 档单 15 ⇒ 16） | 断点以当刻盘面为准——登记 = §9 R29；行数增量 = 注⑦ |
| `docs/batches/2026-10-06-models-config.md` ∥ `docs/batches/2026-10-06-models-config.test.mjs` ∥ `docs/batches/2026-10-06-models-config-ui.test.mjs`（已落盘——双件） | 本批（服务模型配置面——功能点 17 A/C/D/E）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 **270** ∥ **493** |
| 随正六件（父侧——跨批写门禁；服务模型配置面批） | `-console-modals`（详情骨架零字段断言 ⇒ 配置四组） ∥ `-server-gateway`（迁移读点 v:3 ⇒ v:4） ∥ `-server-i18n`（JS 档单 16 ⇒ 17 ∥ 键族） ∥ `-server-gateway-webui-deploy`（档目 19 ⇒ 20 ∥ 标题句） ∥ `-console-completeness-2` ∥ `-console-providers`（档目名单）+ `thincoder-server/package.json`（`prepublishOnly` 添本批件——件数以当刻盘面为准） | 断点以当刻盘面为准——登记 = §9 R33；行数增量 = 注⑧ |
| `docs/batches/2026-10-06-console-list-style.md` ∥ `docs/batches/2026-10-06-console-list-style.test.mjs`（已落盘） | 本批（样式族统一——功能点 19）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建（随正件 = 无——无新档 ∥ 无断点：类串微改/行数零变——既有档目/直发断言零触；批内件实读 **238**——注⑨） |
| `docs/batches/2026-10-09-server-bin-guard-fix.md` ∥ `docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`（已落盘） ∥ `thincoder-server/package.json`（板级件——`prepublishOnly` 清单） | 本批（bin 入口 guard 修复——符号链接判据）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） ∥ 清单添本批件（27 ⇒ **28**——已落盘） | append ∥ 新建——实读 **112** 行 ∥ 全树 ±0（单行清单行数零变） |
| `docs/batches/2026-10-09-server-console-testkey-fix.md` ∥ `docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`（拟新增） ∥ `thincoder-server/package.json`（板级件——`prepublishOnly` 清单） | 本批（控制台测试 key 缺陷修复——详情弹窗两调用点 = 草稿 key）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） ∥ 清单添本批件（拟新增——本批 +1 件） | append ∥ 新建（估 ≈160 行——实施后回填） ∥ 全树 ±0（单行清单行数零变） |

- 注① 随正七件行数（实读——内容行 ∥ 文末换行不计）⇒ 预期增量（五件）：`-console-providers` 479 ⇒ ≤±4 ∥ `-server-gateway-webui-deploy` 322 ⇒ ≤±6 ∥ `-server-i18n` 298 ⇒ ≤±10 ∥ `-server-gateway-accounts` 493 ⇒ ≤±5 ∥ `-first-release-completeness` 497 ⇒ ≤±3。
- 注② 同上（本 fix 轮补入两件 + 新批内件）：`-server-gateway`（基准件）496 ⇒ ≤±2 ∥ `-server-auto-update` 498 ⇒ ≤±1 ∥ 新批内件实读 **497** 行；实施后回填核销。
- 注④ 断言改点（基准件——v3 迁移致 v2 断言整体失效）：`:9`/`:164` 标题文本随正（五表 + 三索引 + user_version=2 ⇒ 六表 + 六索引 + user_version=3）∥
  `:167`/`:168` SCHEMA_VERSION/readVersion ⇒ 3 ∥ `:170` 表清单补 `audit_events` ∥ `:172` 索引数 3 ⇒ 6 ∥ `:186` migrate 返回 ⇒ 3 ∥ `:201`/`:208` readVersion ⇒ 3。
- 注⑤ 断言改点（基准件续 ∥ 自动更新件）：`:205` 失败探针 `v: 3` ⇒ `v: 4` ∥ `:207` 错误消息同步（`（v3）` ⇒ `（v4）`）；`-server-auto-update` = `:480` 件数 11 ⇒ 12 ∥ 断言消息「应列十一件」⇒ 十二件 ∥ `:9`/`:439` 段头注释同拍。
- 注⑥（弹窗批随正五件 + 新批内件）：行数（实读）⇒ 预期增量：`-console-completeness-2`（实读 **497**——收正）∥ `-console-providers` ≤±6 ∥ `-webui-deploy` ≤±8 ∥ `-server-i18n` ≤±12 ∥ `-server-auto-update` ≤±2（门禁件数 12 ⇒ 13——以 #972 随正落地后实读为准）∥ 新批内件实读 **473** 行；实施后回填核销。
- 注⑦（Provider 重做批随正五件 + 新批内件）：行数（实读）⇒ 预期增量：`-console-providers` **479** ⇒ ≤±4（`:426` 名单添档） ∥ `-console-completeness-2` **498** ⇒ ≤±4（`:434`） ∥ `-console-modals` **391** ⇒ ≤±4（`:334`）
  ∥ `-server-gateway-webui-deploy` **322** ⇒ ≤±8（`:239` mime 样 ∥ `:272`–`:274` 档目/标题句 ∥ 头注） ∥ `-server-i18n` **298** ⇒ ≤±6（`:120` JS 档单）；`thincoder-server/package.json`（`prepublishOnly` 十三 ⇒ 十四件——添本批内件）；新批内件实读 **334 ∥ 350** 行（拆档双件——拆分搬移 ∥ 逐件 ≤800）；实施后回填核销。
- 注⑧（服务模型配置面批随正六件 + 新批内件）：行数（实读）⇒ 预期增量：`-console-modals` **391** ⇒ ≤±12（配置四组断言改点） ∥ `-server-gateway` **496** ⇒ ≤±6（v4 读点） ∥ `-server-i18n` **298** ⇒ ≤±8（档单/键族） ∥
  `-server-gateway-webui-deploy` **322** ⇒ ≤±8（档目） ∥ `-console-completeness-2` **498** ⇒ ≤±4 ∥ `-console-providers` **479** ⇒ ≤±4；新批内件实读 **270 ∥ 493** 行（双件）；实施后回填核销。
  - v4 读点（`-server-gateway`——逐点；行号以当刻盘面为准）：`:9`/`:164` 文本 `user_version=3` ⇒ 4 ∥ `:167` SCHEMA_VERSION ⇒ 4 ∥ `:168`/`:201`/`:208` readVersion ⇒ 4 ∥ `:186` migrate 返回 ⇒ 4 ∥ `:205` 失败探针 `v: 4` ⇒ `v: 5`（`v4_probe` ⇒ `v5_probe`，`:209` 同拍） ∥ `:207` 消息 `（v4）` ⇒ `（v5）`。
- 注⑨（样式族批随正件 = 无 + 新批内件）：随正件 = 无（无新档 ∥ 无断点——类串微改/行数零变；既有档目/直发断言零触——实读在案）；批内件实读 **238** 行（`docs/batches/2026-10-06-console-list-style.test.mjs`）；实施后回填核销。
- 注⑩（me-keys 批随正件七档 + 新批内件）：行数（实读）⇒ 预期增量：`-console-list-style` **238** ⇒ ≤±4（`:116`/`:188`/`:189` 类删断点 ∥ `:235` 门禁件数 22 ⇒ 23） ∥ `-console-layout` **490** ⇒ ≤±4（`:458`/`:481`/`:484` ∥ `:444` 门禁件数） ∥
  `-quota-v2-member-models` **745** ⇒ ≤±6（`:744` 悬停清单 ∥ `:526`/`:545` 复数直测期望文本随正 ∥ `:428` 门禁件数） ∥ `-provider-model-metadata` **496** ⇒ ≤±4（`:490` ∥ `:493` 门禁件数） ∥
  `-console-completeness-2` **497** ⇒ ≤±2（`:452` 键在场——应不破，实读为界） ∥ `-server-auto-update` **498** ⇒ ≤±2（`:480` 门禁件数——注释同拍） ∥ `-quota-per-model` **447** ⇒ ≤±2（`:444` 门禁件数——注释同拍）；
  `thincoder-server/package.json`（`prepublishOnly` 清单 22 ⇒ 23——添本批内件）；新批内件（拟）估算 ≈450 行；实施后回填核销。
- 注⑪（me 用量图表化批随正件 + 新批内件——2026-10-07 实读，回填轮收正）：随正件 = **六件断言件**——`-console-layout` ∥ `-console-list-style`（④ 面计数 7 ⇒ 8 ∥ `hint error` 19 ⇒ 21） ∥ `-server-auto-update` ∥
  `-provider-model-metadata` ∥ `-quota-per-model` ∥ `-quota-v2-member-models`（门禁件数 24 ⇒ **26**——注释同拍；全部父侧落讫）∥ 另 `-console-layout` me 页两处断点：`:268`–`:272` 路由桩补 `GET /api/me/usage/summary` ∥ `:271` 页头断言改点〔`me.usage.summary` 键退役〕（行号以当刻盘面为准）；
  `thincoder-server/package.json` **26** ⇒ ±0（`prepublishOnly` 清单 24 ⇒ **26**——本批两件入链；单行清单，行数零变）；新批内件 = **两件**（越 500 硬线拆档——沿 me-keys 先例）：`docs/batches/2026-10-07-me-usage-charts.test.mjs` **228** ∥ `docs/batches/2026-10-07-me-usage-charts-ui.test.mjs` **403**；实施后回填核销。
- 注⑫（结构轮随正件 + 新批内件——2026-10-08 设计轮）：随正件 = **十六件断言件**（①–④ 去重）——① 目录整列断言十件（名单添十名 ∥ 计数 [20,19] ⇒ [30,29]）：`-console-completeness-2` · `:436`/`:437-440` ∥ `-console-list-style` · `:204-210` ∥
  `-console-modals` · `:411-416` ∥ `-console-provider-redo-runtime` · `:293-299` ∥ `-console-providers` · `:424-426` ∥ `-models-config` · `:217-223` ∥
  `-server-gateway-webui-deploy` · `:272-274` ∥ `-me-keys-redo-ui` · `:390-391` ∥ `-provider-model-metadata` · `:483-484` ∥ `-quota-v2-member-models` · `:730-731`（断点以当刻盘面为准）；
  ② i18n 扫描面八件（排除名单 ⇒ 前缀式 `i18n-zh*`/`i18n-en*`）：`-server-i18n` · `:42` JS 档单 + `:123` 名单 + `:129-130` CJK 载体断言 + `:173` import 图面 + `:197` 直发面 ∥ `-console-completeness-2` · `:461` ∥ `-console-modals` · `:435` ∥
  `-console-provider-redo-runtime` · `:320` ∥ `-models-config` · `:230` ∥ `-console-layout` · `:432` ∥ `-me-usage-charts-ui` · `:382` ∥ `-quota-v2-member-models` · `:732`；
  ③ app 源扫三处：`-console-layout` · `:166-172`（`dataShell`/`rowCount` 扫面 ⇒ `dom.mjs`） ∥ `-console-completeness-2` · `:479-480`（`HEALTH_POLL_MS`/三态键 ⇒ `health.mjs`） ∥ `-me-keys-redo-ui` · `:95`（`load("app.mjs")` 取 `h`/`table`/`showSecret` ⇒ 改载 `dom.mjs`）；
  ④ 门禁件数七件（26 ⇒ **27**——注释同拍）：`-console-list-style` · `:237` ∥ `-server-auto-update` · `:480` ∥ `-console-layout` · `:449` ∥ `-me-usage-charts` · `:225` ∥ `-provider-model-metadata` · `:493` ∥ `-quota-per-model` · `:444` ∥ `-quota-v2-member-models` · `:428`；
  `thincoder-server/package.json`（`prepublishOnly` 26 ⇒ **27**——本批件入链）；新批内件 = **一件**：`docs/batches/2026-10-08-server-public-structure.test.mjs`（估 ≈220 行——零语义指纹 ∥ 部件互斥/并集 ∥ 门面 identity ∥ 新档直发 ∥ 拆分接线）；实施后回填核销。
  逐件行数（实读 2026-10-08 ⇒ 预期增量）：`-console-completeness-2` **502** ⇒ ≤±8 ∥ `-console-list-style` **240** ⇒ ≤±6 ∥ `-console-modals` **473** ⇒ ≤±6 ∥ `-console-provider-redo-runtime` **350** ⇒ ≤±6 ∥ `-console-providers` **479** ⇒ ≤±6 ∥ `-models-config` **270** ⇒ ≤±6 ∥
  `-server-gateway-webui-deploy` **322** ⇒ ≤±8 ∥ `-me-keys-redo-ui` **395** ⇒ ≤±6 ∥ `-provider-model-metadata` **496** ⇒ ≤±6 ∥ `-quota-v2-member-models` **745** ⇒ ≤±6 ∥ `-server-i18n` **301** ⇒ ≤±8 ∥ `-console-layout` **495** ⇒ ≤±6 ∥
  `-me-usage-charts-ui` **403** ⇒ ≤±4 ∥ `-server-auto-update` **498** ⇒ ≤±2 ∥ `-me-usage-charts` **228** ⇒ ≤±2 ∥ `-quota-per-model` **447** ⇒ ≤±2；越 500 软线两件处置：`-quota-v2-member-models`（745）∥ `-console-completeness-2`（502）——档位结论 = **免拆**（≤800）。

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
| 功能点 8（分发与部署——npm 全局装启动链；缺陷 #1113） | `ops/OPS.md` §7 判据（经符号链接（bin 垫片形 ∥ 目录连接形）调用入口 ⇒ 不静默——进入正常输出/错误路径；普通调用不回归） | 批内件（`docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`——已落盘 112 行） |
| AC-9（功能点 9——provider 预设；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `ops/OPS.md` §7 判据（预设展开 ∥ 未知预设拒启 ∥ `name` 缺省 ∥ 覆盖语义 ∥ 漂移件） | 批内件 |
| AC-10（功能点 10——自动更新；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `ops/OPS.md` §7 判据（自检 ∥ 档位 ∥ 自升 ∥ 版本可见性 ∥ 容器收敛——机制全文 = `ops/OPS.md` §5.4） | 批内件 + 收口轮 |
| AC-11（功能点 11——控制台 provider/模型管理；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `gateway/API.md` §5 判据（CRUD 三态 ∥ 保存即热生效 ∥ 密钥掩码/日志零明文 ∥ 发现与降级）+ `ops/OPS.md` §7 种子行 + `webui/WEBUI.md` §6 控制台行 | 批内件 |
| AC-12（功能点 14——控制台 IA；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（`nav.mjs` 直测：组/项 ∥ 重定向 ∥ 角色默认 ∥ denied；静态档目随正（二轮后 15/16 ⇒ 弹窗批后 17/18 ⇒ provider 重做批后 18/19 ⇒ 配置面批后 **19 ∥ 20** ⇒ 结构轮后 **29 ∥ 30**） ∥ 拆分） | 批内件 |
| AC-13（功能点 12——首版完备化六项；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `gateway/API.md` §5 ∥ ② `accounts/ACCOUNTS.md` §5 ∥ ③④ `webui/WEBUI.md` §6 ∥ ⑤ `ops/OPS.md` §7 ∥ ⑥ `metering/METERING.md` §4 | 批内件 + 收口轮 |
| AC-14（功能点 13——控制台多语言；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（检测矩阵 ∥ 两表键集对齐 ∥ 键引用闭合 ∥ 错误码映射 ∥ 档目/静态直发随正） | 批内件 + 收口轮 |
| AC-15（功能点 15——控制台可见面六面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `gateway/API.md` §5 + `webui/WEBUI.md` §6 ∥ ② `metering/METERING.md` §4 + `webui/WEBUI.md` §6 ∥ ③ `gateway/API.md` §5 + `webui/WEBUI.md` §6 ∥ ④ `accounts/ACCOUNTS.md` §5 + `store/STORE.md` §3 ∥ ⑤ `webui/WEBUI.md` §6 ∥ ⑥ `metering/METERING.md` §4 + `webui/WEBUI.md` §6 | 批内件 + 收口轮 |
| AC-16（功能点 16——控制台弹窗交互；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（`modal.mjs` 在册 ∥ 成员三态弹窗 ∥ 一次性秘密不破 ∥ 静态档目 17/18 ⇒ 18/19（provider 重做批后）⇒ 配置面批后 **19 ∥ 20** ⇒ 结构轮后 **29 ∥ 30**） | 批内件 + 收口轮 |
| AC-17（功能点 17——服务模型页 ∥ 配置面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（列表同源 ∥ 详情/配置五组（A/C/D/E/F——F 判据 = AC-21 行） ∥ 停用流（含退役可停 ∥ 与 Provider 页单源协同） ∥ 限流 429 形 ∥ admin 面）+ `gateway/API.md` §5 判据（限流面机检） | 批内件 + 收口轮 |
| AC-18（功能点 18——Provider 管理面重做；已落需求档） | `webui/WEBUI.md` §6 判据（nav 值「Provider」 ∥ 列表 + 双弹窗 ∥ 零内联面 ∥ 候选 = 上游发现（零手填） ∥ 勾选保存 ⇒ PATCH `models` ⇒ `/v1/models` 随动 ∥ 退役项只读注 ∥ 测试同窗（key = 草稿口径——未保存 key；2026-10-09 修复批）；档目 18/19 ⇒ 配置面批后 **19 ∥ 20** ⇒ 结构轮后 **29 ∥ 30**） | 批内件 + 收口轮 |
| AC-19（功能点 19——样式族总体统一；已落需求档） | `webui/WEBUI.md` §6 判据（§2.5 散置清单 ∥ 变量单源 ∥ 族值表 + 逐族套用表 ①–⑩（含 #87/#88 接续） ∥ 可点行判据 ∥ 空/错/加载态；视觉收口轮实走） | 批内件 + 收口轮 |
| AC-20（功能点 20——控制台布局收正；已落需求档） | `webui/WEBUI.md` §6 判据（五页视口高壳（页头固定 ∥ 表头吸附 ∥ 行区滚动 ∥ 表尾行计数）∥ 内容左对齐 ∥ 弹窗内列表表格化（Provider 模型 ∥ 成员 key）∥ 矮视口回退整页滚；浏览器实走 = 收口轮） | 批内件 + 收口轮 |
| AC-21（功能点 21——配额分模型；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分三面判据：`metering/METERING.md` §4 AC-21 行（三级 ∥ 计数点查 ∥ 零 SQL 短路 ∥ 自然月窗口 ∥ 429 形）∥ `gateway/API.md` §5 AC-21 行（检查点 = 派发命中后/转发前机检）∥ `webui/WEBUI.md` §6 AC-21 行（F 组 ∥ 分模型覆盖面） | 批内件 + 收口轮（浏览器实走） |
| AC-22（功能点 22——模型标识两字段；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `metering/METERING.md` §4 AC-22 行（两字段记账/计数 ∥ 列直操作聚合 ∥ 迁移拆分回填逐值 ∥ 对外契约不变）+ `store/STORE.md` §3 v5 段判据（拆列抽样逐值 ∥ 两表回填逐值） | 批内件 |
| AC-23（功能点 23——成员模型面 v2；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-23 两行（查看态模型表直显 ∥ 服务模型页配额列 ∥ 禁用勾选即时写）+ `accounts/ACCOUNTS.md` §5 AC-23 行（写/读面）+ `gateway/API.md` §5（禁用执行面） | 批内件 + 收口轮（浏览器实走） |
| AC-24（功能点 24——上游模型元数据；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-24 两行（列式五列 ∥ 退役只提示 ∥ 加载态）+ `gateway/API.md` §5（留存写入面） | 批内件 + 收口轮（浏览器实走） |
| AC-25（功能点 25——「我的·key 与签发」页重做；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-25 两行（页面六列 ∥ 双弹窗 ∥ 复制钮 ∥ 接入卡成员面 ∥ 非壳；机检口径）+ `accounts/ACCOUNTS.md` §5 AC-25 行（端点/命名/上限/404/审计）+ `store/STORE.md` §3 v8 段（回填判据） | 批内件 + 收口轮（浏览器实走） |
| AC-26（功能点 26——「我的·用量」页图表化；候补——需求档落点 = 主 agent） | `webui/WEBUI.md` §6 AC-26 两行（页形 ∥ 零依赖 ∥ 数据面 ∥ 壳面 ∥ i18n ∥ 空错态 ∥ 导出判否；机检口径）+ `metering/METERING.md` §4 AC-26 行（端点契约 ∥ 判权 = 本人 ∥ 逐值/零填充） | 批内件 + 收口轮（浏览器实走） |
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
| R22 | **随正七件登记（父侧——跨批写门禁）**：`-console-providers` ∥ `-webui-deploy` ∥ `-server-i18n` ∥ `-server-gateway-accounts` ∥ `-first-release-completeness` ∥ `-server-gateway`（基准件——v3 断言改点） ∥ `-server-auto-update`（门禁件数 11 ⇒ 12）（逐件断点与行数 = §6 随动表行 + 注①②④⑤） | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R23 | **需求档回笔（已办）**：AC-12 行随正（管理 6 ⇒ **7** ∥ 静态档目 15/16 ⇒ **17/18**——弹窗批后）+ §2:14 侧栏页数注（九页 ⇒ 十页）——设计侧行已随正（`webui/WEBUI.md` §6） | 需求档回笔（主 agent 笔） | 已办（2026-10-06——需求档 `requirements/PROJECT.md:166` 回笔在盘） |
| R24 | **配置候选表（已裁——用户 2026-10-06 21:39/21:40「ACDE」）**：A（开放/停用——**服务模型页自持操作面；不得被 Provider 页吸收**——上游退役模型从发现列表消失后只在服务模型页可停用）∥ C（per-model 限流）∥ D（展示元数据）∥ E（成本权重）**入选**；B（默认请求参数）**不选**；落字段 = 本批设计在盘（2026-10-06——`webui/WEBUI.md` §2.4③ ∥ KD-SV-34/35；需求档 §2:17 已同拍） | 用户裁定（已裁） | 落字段 = 本批设计在盘；实施 = 后续轮 |
| R25 | **i18n 表拆域（断点触发登记）**：弹窗批后 zh ≈309 ∥ en ≈305（估）⇒ 按域拆表；处置 = 独立结构轮（本批面已定 ∥ 撞在途批断言面）；实施实读为准 | 处置已定（独立结构轮） | 独立结构轮（实施后另轮） |
| R26 | **随正五件登记（父侧——跨批写门禁）**：`-console-completeness-2`（nav 6 ⇒ 7 ∥ 档目 15/16 ⇒ 17/18 ∥ labelKeys 11 ⇒ 12） ∥ `-console-providers` ∥ `-webui-deploy` ∥ `-server-i18n` ∥ `-server-auto-update`（门禁件数 12 ⇒ 13 ∥ `:9`/`:439`/`:480` 注释与断言同拍——以 #972 随正落地后实读为准）；断点以当刻盘面为准；行数 = §6 注⑥ | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R27 | **实施后回填轮**：预算实读（弹窗批增量 ∥ 新两档——§6 全树 ≈6744 推算值收正）∥ 批内件行数 ∥ 随正五件核销 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R28 | **需求档回笔（主 agent 笔）**：AC-11 行「手填降级」措辞收正（用户 21:36 裁定——控制面候选手填入口撤除；发现失败 = 提示 + 重试；服务端 502 语义零改）——设计侧行已收正（本批——`gateway/API.md` §5 ∥ `webui/WEBUI.md` §6 AC-11 行） | 需求档回笔 | 随本批评审/收口 |
| R29 | **实施后回填轮（本批）**：预算实读（拆分两档 ∥ style/i18n 增量——§6 ≈6940 推算值收正）∥ 批内件行数 ∥ 随正五件核销（+ `prepublishOnly` 十三 ⇒ 十四件）〔2026-10-07 清账批：批内件实读 **334 ∥ 350**（拆分搬移——§6 随动表）；拆分两档实读 **61 ∥ 365**（`webui/WEBUI.md` §5）；`prepublishOnly` 现 **22 件**（闸链含拆分双件）；余子项在册〕 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R30 | **披露——退役模型停用过渡窗**：本批落地后，上游已退役（不在发现列表）的已开放模型在 Provider 页不可停用（用户 21:40 机制）；服务模型页 A 开关设计在盘（本批——`webui/WEBUI.md` §2.4③）；过渡窗内停用入口 = API 级 PATCH `models`；建议 A 实施轮紧随（设计已备） | 披露（不阻塞） | 用户/主 agent 排期 |
| R31 | **需求档回笔（主 agent 笔）**：AC-17 行「配置项 = 用户裁定面（未裁前只落详情 + 编辑骨架）」收正（配置项 = A/C/D/E 已裁——设计在盘）+ §2:17 末句「实现序 = 另轮排期（本轮骨架在盘）」随正（设计在盘，实施另轮）；设计侧行已随正（`webui/WEBUI.md` §6） | 需求档回笔 | 随本批评审/收口 |
| R32 | **C 存储面/端点面裁定点（上抛——评审/用户确认）**：设计取 = ① 存储 `providers.settings_json`（v4 迁移——单列，非新表）；② 端点 = PATCH `/api/admin/providers/:id` 扩 `settings` 键级合并（零新端点）；③ 窗口 = 进程内存 60s 定窗（重启归零）；④ 拒绝形 = 429 `rate_limited` + `Retry-After`；备选（被否）= 新表 `model_settings` + 新端点族 ∥ 滑动窗 ∥ 持久窗（全文 = `webui/WEBUI.md` §7 KD-SV-34 ∥ `gateway/API.md` §6 KD-SV-35） | 披露（上抛裁定） | 如无异议按设计实施；存储面改动须同拍 `store/STORE.md`/`gateway/API.md` |
| R33 | **随正六件登记（父侧——跨批写门禁；本批）**：`-console-modals` ∥ `-server-gateway`（v4 读点） ∥ `-server-i18n`（档单/键族） ∥ `-server-gateway-webui-deploy`（档目） ∥ `-console-completeness-2` ∥ `-console-providers` + `thincoder-server/package.json`（`prepublishOnly` 添件）；断点以当刻盘面为准；行数 = §6 注⑧ | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R34 | **实施后回填轮（本批）**：预算实读（webui/gateway/ops/store 增量 ∥ 两新档——§6 ≈7467 推算值收正）∥ 批内件行数 ∥ 随正六件核销〔2026-10-07 清账批：批内件实读 **270 ∥ 493**；两新档已落盘（`ratelimit.mjs` **64** ∥ `model-specs-snapshot.mjs` **103**）；余子项在册〕 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R35 | **跨批顺序披露**：本批设计档引用 provider 重做批成果（§2.4④ 退役注行 ∥ `views-providers-modals.mjs`）——两批实施顺序建议 = provider 重做批先行、本批随后（其随正链 18 ⇒ 19 先落，本批再 19 ⇒ 20）；顺序倒置时断点以当刻盘面为准（在案） | 披露（不阻塞） | 实施排期参考 |
| R36 | **实施后回填轮（本批）**：预算实读（`style.css` 三批叠加断点收正——§6 ≈7493 推算值 ∥ webui 小计 ≈3180）∥ 批内件行数 ∥ 随正件 = 无（核销在案）〔2026-10-07 清账批：批内件实读 **238**；`style.css` 实读 **224**（三批叠加——`webui/WEBUI.md` §5）；余子项在册〕 | 实施后设计回填轮（沿先例） | 实施后轮 |
| R37 | **需求档收正（已办）**：`docs/server/requirements/PROJECT.md` §2:17 ∥ §2:19 两行超宽（改前实读 315 ∥ 565 字符——本批机检读数）已拆行落地（2026-10-06——需求档变更记录在册：主 agent 直接执行 · 可 revert）；本批设计侧零新增超宽 | 需求档修复（主 agent 笔） | 已办（2026-10-06） |
| R38 | **披露——字排/悬停两口径的后果（供用户/评审复核）**：一字号（13px）+ 零粗体下页题（h2）∥ KPI 数值（`stat-value`）∥ 卡题与正文同号同重——层级 = 结构通道（位置/间距/底色/边框）；悬停统一 = 全数据行（含不可点表——可点性由指针/焦点环承担）。如用户要求保留字号层级或「仅可点行悬停」⇒ 回笔需求 §2:19 边界句，值表单点调整 | 披露（不阻塞） | 评审/用户复核 |
| R39 | **披露——退役且已停用模型的控制台重开径**：上游已退役（不在发现列表）且已停用的模型 ⇒ 控制台零重开路径（Provider 页该类项只读注「停用入口 = 服务模型页」且停用后注行不含——`webui/WEBUI.md` §2.4④；服务模型页列表 = 开放集 ⇒ 行不在——§2.4③）；重开径 = API 级 PATCH `models`（口径沿 R30）；如用户要求控制台重开入口 ⇒ 回笔（候选面需发现数据——与 21:36 无手填裁定衔接） | 披露（不阻塞） | 用户/主 agent 排期 |
| R40 | **me-keys 批（本批）——随正件与滞账**：① 旧批测试随正（删 `.key-item` 类 ⇒ 四件断点：`2026-10-06-console-list-style.test.mjs` ∥ `2026-10-07-console-layout.test.mjs` ∥ `2026-10-07-quota-v2-member-models.test.mjs`（`:744` 悬停清单；复数直测 `:526`/`:545` 期望文本随正——同件双面） ∥ `2026-10-07-provider-model-metadata.test.mjs`；值改 `me.keys.lastUsed`/`windowTokens`（列内形） ⇒ `2026-10-06-console-completeness-2.test.mjs`（键在场——应不破，实读为界）；门禁件数随正（`prepublishOnly` 22 ⇒ 23——添本批件） ⇒ 六档：`2026-10-06-console-list-style.test.mjs` ∥ `2026-10-06-server-auto-update.test.mjs` ∥ `2026-10-07-console-layout.test.mjs` ∥ `2026-10-07-provider-model-metadata.test.mjs` ∥ `2026-10-07-quota-per-model.test.mjs` ∥ `2026-10-07-quota-v2-member-models.test.mjs`（件数断言/注释同拍））——父侧落地（实施轮同拍；行数注 = §6 注⑩）∥ ② 滞账登记：§4 索引 42–46 与 §7 AC-23/AC-24 行（前两批漏登）已随本批补齐；2026-10-07 各批 §6 总账行仍缺（布局/配额/配额 v2/元数据/列式）——建议由各批回填轮或父侧一次性补 ∥ ③ 上抛（设计轮裁——供复核）：轮换页面下架（端点保留）∥ 名称上限 40 字符 ∥ 自助上限 20 把（CLI 免）∥ 名称不进 admin 面 key 表 ∥ 页面非壳（钉表五页不扩）∥ 词汇口径：本页新文案取需求 §2:25③ 字面（「API Key」——定音在案：用户 2026-10-07 16:41/16:43 取 B，批档 §1.3 术语门）；nav/管理面/审计/接入卡仍用「key」（本批零触——admin 面边界；`webui/WEBUI.md` §2.2 键族登记「词汇口径」条）——一名两形登记，统一 = 另笔（台账 #1025） ∥ 需求边界句「接入卡源不动」读法 = **已裁**（需求档 2026-10-07 回笔：接入卡 = 同源构件复用——导出/变体参数允许；admin 面渲染/措辞零改；在案 = `requirements/PROJECT.md` §2:25 ∥ 本档变更记录；上抛记录 = 批档 §2.8） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R41 | **me 用量图表化批（本批）——需求档回笔 + 随正件 + 披露**：① 需求档回笔（主 agent 笔——随本批评审/收口）：§2 增功能点 26 + AC-26 行（设计侧候补已在——`webui/WEBUI.md` §6 ∥ `metering/METERING.md` §4）∥ ② 随正件（父侧落讫——回填轮实读收正；行数注 = §6 注⑪）：六件断言件（`-console-layout` ∥ `-console-list-style` ④ 面 ∥ `-server-auto-update` ∥ `-provider-model-metadata` ∥ `-quota-per-model` ∥ `-quota-v2-member-models`——门禁件数 24 ⇒ **26**）+ `-console-layout` me 页两处断点（路由桩补 `/api/me/usage/summary` ∥ 页头断言改点〔`me.usage.summary` 键退役〕）+ `thincoder-server/package.json`（`prepublishOnly` 24 ⇒ **26**——本批两件入链）∥ ③ 披露（不阻塞）：壳面五页钉表维持——报表卡不承缩 + 上限自滚（明细卡恒得剩余高）+ 明细承缩（高度链 +2 行在册）；如偏好参考图式自由滚动页 ⇒ 需求 §2:20 改判另轮 ∥ ④ 三档翻案已随正（`metering/METERING.md` §8 ∥ `webui/WEBUI.md` §8/§7 KD-SV-29 否决栏——改判 = KD-SV-49） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R42 | **结构轮（本批）——上抛 + 随正件 + 需求档回笔**：① 上抛（用户批准面——`webui/WEBUI.md` §7 KD-SV-51/52）：i18n 拆表形态（四部件 + 门面 = 拟案；备选 = 两/三拆）∥ `app.mjs` 拆否（拟 = 拆三档；备选 = 不拆——越线续存）∥ 余两越线档（`views-admin` ∥ `views-providers-modals`——预案标「触发 = 结构轮（#993/#976 同族）」）是否随轮 ∥ 新档命名（`dom.mjs` 等） ∥ ② 需求档回笔（主 agent 笔——随本批评审/收口）：`requirements/PROJECT.md` AC-12 `:147` ∥ AC-14 `:149` 档目链（19 ∥ 20 ⇒ **29 ∥ 30**；若裁不拆 app ⇒ 27 ∥ 28） ∥ AC-14 CJK 措辞随回笔同拍（「i18n 三档 CJK 口径（zh 表 = 唯一 CJK 档）」⇒ 族式「zh 族」 ∥ 「三新档静态直发」⇒「十新档」——与设计侧 AC-14 行字面同拍） ∥ ③ 随正件（父侧落讫——实施轮同拍；行数注 = 注⑫）：**十六件**断言件 + `thincoder-server/package.json`（`prepublishOnly` 26 ⇒ 27） ∥ ④ 域外发现（报告——非本批面）：`docs/core/design/API-CONTRACT.md:2626` `HEALTH_POLL_MS` 坐标陈旧（载 `thincoder-server/public/app.mjs:111`，实读 `:140`）——拆后符号迁 `health.mjs`；生成区重刷 = `api-contract --write`（工具面 ∥ 另轮） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R43 | **bin 入口 guard 修复批（本批）——回笔建议 + 部署收尾 + 同族记录**：① 需求档回笔建议（主 agent 笔）：AC-8 判据现未覆盖「npm 全局装（POSIX 符号链接垫片）装后起服可跑」——本缺陷即从此缝漏出；建议补一条（判据 = 经垫片调用 ⇒ 服务真启动；载体 = 批内件 ∥ 收口轮）∥ ② 部署侧收尾（父侧执行——ECS）：镜像重建（含修复）+ compose `entrypoint:` 覆盖件移除（现为绕行——修复落地后执行）∥ ③ 同族记录（本批不修——范围外；清单 = 批档 §2）：`thincoder-server/deploy/backup.mjs:84` ∥ `thincoder-server/deploy/converge.mjs:194` ∥ `thincoder-server/src/ops/cli.mjs:216`（同判据形）+ `bench/preflight.mjs:115` ∥ `bench/probe.mjs:307` ∥ `bench/run.mjs:304` ∥ `bench/toolcall.mjs:259` ∥ `scripts/api-contract.mjs:129` + 五处 `resolve()` 变体：`scripts/dev-link.mjs:171` ∥ `scripts/doc-check.mjs:123` ∥ `thincoder-cli/scripts/doc-impact.mjs:144` ∥ `thincoder-desktop/scripts/make-icon.mjs:170` ∥ `thincoder-desktop/scripts/materialize-deps.mjs:142`——择批处置 | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R44 | **控制台测试 key 修复批（本批）——需求档回笔（已办）+ 部署收尾 + 随正件**：① 需求档回笔（**已办**——2026-10-09；主 agent 笔）：功能点 18③ / AC-18 行补「测试连接 ∥ 刷新候选 key = 草稿口径（未保存 key）」判据句——回笔在盘 = `docs/server/requirements/PROJECT.md:265`（变更记录在册：§2:18 草稿口径句 ∥ `:77` 口径句 ∥ `:157` AC-18 判据句；设计侧行已随正——`webui/WEBUI.md` §6 AC-18 行）∥ ② 部署侧收尾（父侧执行——ECS）：镜像重建（含修复）+ 重收敛 + 用户复测原流程（§1 在册——`public/**` 在镜像内）∥ ③ 随正件（父侧落地——实施轮同拍；断点/行数注 = §6 本批预算行）：门禁件数断言七件 N ⇒ N+1——注释同拍（N 以实施当刻盘面实读为准；现值实读 = 28 ⇒ 29）+ 文档链随正（`ops/OPS.md` §5.1 ∥ 本档 §6 板级行：28 ⇒ 29 件） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |

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
- 2026-10-07：配额分模型批设计轮（批 `docs/batches/2026-10-07-quota-per-model.md`——需求 §2:21 ∥ §2:22 ∥ 台账 #990/#991/#992）——§2 控制台链随正（[3] 体读形校 → [4] 派发 + 准入双闸：配额（KD-SV-38）→ 限流）；§2.1 metering 行（三档 ⇒ 五档：+ aggregates/report）∥ store 行（v5）∥ §4 索引增 KD-SV-38–41（标题 1–36 ⇒ 1–41）∥ §6 预算随动（metering ⇒ ≈690；各域档同拍——`store/STORE.md` §4 ∥ `gateway/API.md` §4 ∥ `webui/WEBUI.md` §5 ∥ `ops/OPS.md` §6；全树总账回收 = 实施后回填轮）∥ §7 判据行（AC-21/AC-22 已入需求档验收表——各域判据行同拍）；机制全文 = `metering/METERING.md` §2 ∥ `store/STORE.md` §2 v5 段。
- 2026-10-07：fix 轮（评审 #126——批 `docs/batches/2026-10-07-quota-per-model.md` §3 十项，本档面）：§2.2 [7] 记账收正为三写形（单条 INSERT 退役表述删净）∥ §4 标题 ⇒ 1–41 + 补 KD-SV-37 行（索引缺口闭）∥ §6 链补 metering 实读 416 ⇒ ≈690 ∥ store 实读 150 ⇒ ≈205 ∥ §7 补 AC-21/AC-22 判据行 + AC-17 行配置组随正（五组）。
- 2026-10-07：文档清账批（fix 轮——承批档 `docs/batches/2026-10-07-doc-cleanup.md` §2 · 台账 #983）：§6 随动表五档批内件实读收正（`-console-completeness-2` **497** ∥ `-console-modals` **473** ∥ `-console-provider-redo` **334 ∥ 350**（拆档双件） ∥ `-models-config` **270 ∥ 493**（493 距 500 余量 7——不拆 + 窗口/阈值） ∥ `-console-list-style` **238**）+ 注②⑥⑦⑧⑨ 施行「实施后回填核销」∥ §9 R29/R34/R36 部分已办登记（批内件行数 ∥ 拆分两档实读 61 ∥ 365 ∥ `prepublishOnly` 22 件）。**零语义**（实读收正）。
- 2026-10-07：me-keys 批设计轮（批 `docs/batches/2026-10-07-me-keys-redo.md`——需求 §2:25 ∥ 台账 #1023）——§4 索引补 KD-SV-42–46（前批滞账）并增 KD-SV-47/48（标题 1–41 ⇒ 1–48）∥ §7 增 AC-23/AC-24（滞账）∥ AC-25 行 ∥ §6 添本批预算行 + 滞账注 ∥ §9 增 R40；同源随动 = `webui/WEBUI.md` ∥ `accounts/ACCOUNTS.md` ∥ `store/STORE.md`。
- 2026-10-07：fix 轮（评审 #43——批 `docs/batches/2026-10-07-me-keys-redo.md` §3 七号落修；本档面 = #1/#5/#6）：§6 添注⑩（me-keys 随正件实读 ⇒ ≤±N + 新批内件估算/拆档触发——原列六名经实读勘正：`-quota-v2` 死名 ⇒ `-quota-v2-member-models` 归并；门禁件数随正两档（`-server-auto-update` ∥ `-quota-per-model`）补列；随正实单 = 七档）+ 本批行/§9 R40① 指针同拍 ∥ §6 越线在册补 `views-admin.mjs` **331** ∥ `views-providers-modals.mjs` **367** + 「此外最宽」实读收正（`config.mjs` **260** ∥ `README.md` **244**）∥ §9 R40③ 需求边界句读法 = 已裁（需求档回笔在案）。
- 2026-10-07：术语定音随正（用户 2026-10-07 16:41/16:43「API Key」定音——批 `docs/batches/2026-10-07-me-keys-redo.md` §1.3 术语门）：§9 R40③ 词汇口径条随正（本页新文案字面 ⇒「API Key」——zh 保留英文原形 ∥ en = "API key"；统一 = 另笔——台账 #1025）。
- 2026-10-07：me 用量图表化批设计轮（批 `docs/batches/2026-10-07-me-usage-charts.md`——用户 22:03 令 ∥ 台账 #1055）——§4 索引增 KD-SV-49/50（标题 1–48 ⇒ 1–50）∥ §6 添本批预算行（产品面 ≈+188 ∥ 随正件登记）∥ §7 增 AC-26 候补行 ∥ §9 增 R41；同源随动 = `webui/WEBUI.md` §2.3⑦/§5/§6/§7/§8 ∥ `metering/METERING.md` §3/§4/§5/§6/§7/§8。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-me-usage-charts.md` §3 八发现〔🟡1–3 ∥ 🔵4–8〕，本档面 = 🟡1/3 ∥ 🔵8）：§6 本批预算行算术平（`report` ≈225 ⇒ ≈223（168 + ≈55） ∥ `views-me` ≈280 ⇒ ≈279 ∥ `views-overview` ≈75 ⇒ ±0（1 词改，行数零增） ∥ webui ≈+125 ⇒ ≈+121 ∥ 产品面 ≈+188 ⇒ ≈+184）+ 随正件件数实读收正（`prepublishOnly` 24 ⇒ 25——原「23 ⇒ 24」为陈）+ 添注⑪（两随正件行数注）∥ §9 R41② 行数注回指 + R41③ 披露随正（报表卡上限自滚——明细卡恒得剩余高）；同源随动 = `webui/WEBUI.md` §2.3⑦/§2.6②/§5 ∥ `metering/METERING.md` §3/§4/§5。
- 2026-10-07：轮 2 残余小收正（主 agent 直接执行 · 可 revert——评审轮次 2 残余 ②④）：§6 `routes` ≈120 ⇒ **≈119**（取整差平）∥ §3 文档地图 webui 行 +「可见面二轮（§2.3）∥ 数据表壳布局（§2.6）」指针。
- 2026-10-07：实施后回填轮（me 用量图表化批——批 `docs/batches/2026-10-07-me-usage-charts.md`）：§6 本批预算行实读收正（产品面 **≈+184 ⇒ 实读 +189**；`report`/`routes`/`views-me`/`style`/i18n 两表逐档实读）∥ 注⑪ 收正（批内件 = **两件 228 ∥ 403**——越 500 拆档；`prepublishOnly` 24 ⇒ **26**——两件入链；随正件 = 六件断言件 + `-console-layout` me 页两处断点——原「单件 ∥ 24 ⇒ 25 ∥ 拟 ≈400」类措辞为陈——实读收正）∥ §9 R41② 同拍；同源随动 = `webui/WEBUI.md` §5/§2.2/§2.5 ∥ `metering/METERING.md` §5。
- 2026-10-08：结构轮设计轮（批 `docs/batches/2026-10-08-server-public-structure.md`——台账 #976 ∥ #993）——§4 索引增 KD-SV-51/52（标题 1–50 ⇒ 1–52）∥ §6 越线在册句随正（两条目拆解；余两档另轮）+ 添本批预算行（webui ≈+77；档目 19 ∥ 20 ⇒ 29 ∥ 30）+ 注⑫（随正件 14 件逐处 + 新批内件一件）∥ §9 增 R42（上抛 ∥ 需求档回笔 ∥ 随正件 ∥ 域外发现）；同源随动 = `webui/WEBUI.md` §1/§2.2/§5/§6/§7/§8 ∥ `requirements/PROJECT.md` AC-12/AC-14（主 agent 笔）。
- 2026-10-08：fix 轮（设计评审轮 1 修正——批 `docs/batches/2026-10-08-server-public-structure.md` §3 八发现：🔴×1 ∥ 🟡×6 ∥ 🔵×1）：§2.1 webui 行档目 19 ⇒ **29** + 十件档单（含 favicon 全目录 30）∥ §4 标题 ⇒ 1–52 ∥ §6 本批预算行/注⑫/§9 R42③ 随正件件数（十四 ⇒ **十六**）+ 注⑫ 逐件行数（实读 ⇒ ≤±N）与越 500 两件处置 ∥ §7 判据行三处补「⇒ 结构轮后 **29 ∥ 30**」∥ §9 R42② 补 AC-14 CJK 措辞随回笔同拍 ∥ §9 R42④ 陈旧坐标引注 ⇒ 全路径式（锚机检）∥ §6 :150/:164 折行（零语义）。
- 2026-10-08：fix 轮（设计评审轮 2 修正——批 `docs/batches/2026-10-08-server-public-structure.md` §3 复评新发现：🟡×2）：§6 注⑫ ③ 行收正（「app 源扫两件」⇒「app 源扫三处」+ 补 `-me-keys-redo-ui` · `:95` 腿——标称与实列同拍；零语义）。
- 2026-10-08：实施后回填轮（父侧直接执行 · 机械 · 可 revert——批 `docs/batches/2026-10-08-server-public-structure.md`）：注⑫② 收正——`-quota-v2-member-models` 随动坐标 `:512` ⇒ **`:732`**（实随动对象 = 行宽清单前缀式行；§5.2 申报同拍）。**零语义**（坐标实读）。
- 2026-10-09：bin 入口 guard 修复设计轮（批 `docs/batches/2026-10-09-server-bin-guard-fix.md`——台账 #1113）——§4 索引增 KD-SV-53（标题 1–52 ⇒ 1–53）∥ §6 添本批预算行 + 随动表行（批档 ∥ 批内件 ∥ `package.json` 27 ⇒ 28）∥ §7 增功能点 8 判据行（#1113）∥ §9 增 R43（需求档回笔建议 ∥ 部署侧收尾 ∥ 同族记录）；机制全文 = `ops/OPS.md` §4 ∥ §8 KD-SV-53。
- 2026-10-09：fix 轮（评审轮次 1 #2/#3——批 `docs/batches/2026-10-09-server-bin-guard-fix.md` §3）：#2 板级行门禁件数随正（十二件 ⇒ 27；本批件入链 ⇒ 28）∥ #3 §6 本批预算行收正（≈179 ⇒ ≈178；+≈2 = `realpathSync` import ∥ 注释——判据行就地改写 ±0）。
- 2026-10-09：控制台测试 key 缺陷修复设计轮（批 `docs/batches/2026-10-09-server-console-testkey-fix.md`——台账 #1120；用户 11:38/11:40 裁定）——§4 索引增 KD-SV-54（标题 1–53 ⇒ 1–54）∥ §6 添本批预算行 + 随动表行（批档 ∥ 批内件 ∥ `package.json` +1 件）∥ §7 AC-18 行补 key 口径（草稿 key）∥ §9 增 R44（需求档回笔 ∥ 部署侧收尾）；机制全文 = `webui/WEBUI.md` §2.4④ ∥ §7 KD-SV-54。
- 2026-10-09：fix 轮（评审轮次 1 #1–#3——批 `docs/batches/2026-10-09-server-console-testkey-fix.md` §3）：#1 §6 本批预算行增随正件登记（门禁件数断言七件 N ⇒ N+1——注释同拍；现读 28 ⇒ 29；逐件在册）+ §6 板级行门禁件数随正（28 ⇒ 29）+ §9 增 R44③ ∥ #2 §9 R44① 收正（需求档回笔已办——回指 `docs/server/requirements/PROJECT.md:265`）∥ #3 落面在 `webui/WEBUI.md`（§2.4④ 补清除勾优先序 + §6 AC-18 行点名两调用点）。
- 2026-10-09：实施后回填轮（bin 入口 guard 修复批——批 `docs/batches/2026-10-09-server-bin-guard-fix.md`）：§6 本批预算行「拟新增」标记随正 + 批内件行数实读收正（**112** 行）∥ 随动表本批行收正（新建——实读 **112** 行）∥ §7 功能点 8 判据行「拟新增」标记随正；同源随动 = `ops/OPS.md` §7/变更记录。
