# Thincoder Server · 设计总览（第一步：token 网关）

> 板块 = server（新部分——代码 `thincoder-server/` ↔ 文档 `docs/server/`，模块镜像）∥ 本档 = 设计**总览**（板级——定位 ∥ 架构总览 ∥ 模块边界与责任地图 ∥ 文档地图 ∥ 决策索引 ∥ 文件与验收总账）——各域细节 = 域档（见 §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（五要素已齐——2026-10-06 用户收口）；本档不复述需求，验收回指 = §7。
> 参考件 = `ai-gateway`（外部项目——**只读参考**：零共享运行面 ∥ 零依赖 ∥ 零代码/文档引用；可借鉴经验 = key 明文只回显一次 ∥ 拒打不落用量 ∥ 计量与业务解耦）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构 + 增长与演进域 + 部署面，沿用户 08:04–08:24 裁定）。
> 范围注：第二步「团队协同」不在本设计集（触发项 = `EVOLUTION.md` §2）；server 入发布序列 = 定向（npm 路——`RELEASE.md` 扩展 = 发布面轮，不在本批；沿用户 08:24 令）。

## 1. 定位与落点

- **一句话**：一台内网常驻的 Node 单进程——OpenAI 兼容入口（chat ∥ embeddings ∥ models），网关代持全部真实 provider key，逐请求记账、按成员限额度；另配登录制控制台（vanilla 静态前端——侧栏分组导航十三页——IA/多语言 = `webui/WEBUI.md` §2/§2.2）与本机运维 CLI（兜底）；首版完备化面 = `/healthz` ∥ 登录防爆破 ∥ 用量保留窗 ∥ 控制台系统页（版本/更新/接入——§7 AC-13）∥ 可见面二轮六面（向量/看板/总览/审计/健康/key 细节——§7 AC-15）。
- **落点**：代码 = `thincoder-server/`（新顶层目录——与 `thincoder-core/` ∥ `thincoder-cli/` ∥ `thincoder-vscode/` ∥ `thincoder-desktop/` ∥ `thincoder-render-core/` 同级）；设计档 = `docs/server/design/`（板 2 档 + 域 9 档——见 §2.1 ∥ §3）。
- **形态**：单进程单库（`node:http` + `node:sqlite`）；无构建步骤；纯 ESM（`.mjs`）。
- **零第三方运行期依赖**（沿仓纪律）：import 限 `node:*` 标准库 + 相对路径 + 从核引面（`@thincoder/core`——本仓包，非第三方；口径 = §2.3 ∥ §5 KD-SV-78）。

## 2. 架构总览

### 2.1 模块边界与责任地图

**三层结构（板 → 域 → 档——代码与文档同拍，用户 2026-10-06 08:14 令）**：代码 = `thincoder-server/src/<域>/<档>.mjs`（入口 `bin/` 与静态 `public/` 除外）；文档 = `docs/server/design/<域>/<档>.md`。
**九域 = gateway ∥ accounts ∥ metering ∥ store ∥ webui ∥ ops ∥ client ∥ sandbox ∥ agent**（前六域目录自第一步立；client 域 = 2026-10-10 B1 批新立；
sandbox 域 = 2026-10-10 沙盒批新立；agent 域 = 2026-10-10 runner-admin-console 批（托管接入）新立；拆分落域内——`EVOLUTION.md` §1-G4）。

| 域 | 代码（本域档） | 职责 | 域档（文档） |
|---|---|---|---|
| 入口（板级） | `thincoder-server/bin/thincoder-server.mjs`（已落盘） | argv ∥ 配置加载 ∥ 首启引导 ∥ 装配/启动 ∥ 停机 | `ops/OPS.md` |
| gateway | `thincoder-server/src/gateway/` 十四档（server ∥ routes ∥ forward ∥ sse-tap ∥ providers ∥ provider-admin ∥ system ∥ errors + embedding-admin ∥ overview ∥ ratelimit + proxy ∥ config-admin ∥ proxy-admin） | http 服务 ∥ 注册行分派 ∥ OpenAI 三面 ∥ 转发 ∥ usage 旁路扫描 ∥ 模型派发 ∥ 模型限流（per-model RPM/TPM——§2.2） ∥ provider 管理面（§2.2） ∥ 系统面（探活/版本——§2.3） ∥ 控制台数据面（总览/向量服务/配置/代理测试——§2.4） ∥ 错误形 | `gateway/API.md` |
| accounts | `thincoder-server/src/accounts/` 七档（keys ∥ members ∥ session ∥ routes ∥ routes-admin ∥ login-guard + audit） | 团队 key ∥ 账号/成员 ∥ 会话/登录 ∥ 密码 ∥ 登录防爆破 ∥ 审计事件（§2.1） ∥ 自助/管理端点 | `accounts/ACCOUNTS.md` |
| metering | `thincoder-server/src/metering/` 五档（usage ∥ aggregates ∥ report ∥ quota ∥ routes） | 记账（同事务三写：usage + 派生两表） ∥ 配额（三级计数准入） ∥ 用量/配额端点（含报表/导出——§3） ∥ 保留窗清理 | `metering/METERING.md` |
| store | `thincoder-server/src/store/` 一档（db）（已落盘） | 库 ∥ DDL ∥ 迁移链（各域共用；v5 = 模型标识两字段拆列 + 派生两表 + 成员配额列） | `store/STORE.md` |
| webui | `thincoder-server/src/webui/` 一档（static）+ `thincoder-server/public/` 三十档 ⇒ 三十一档（沙盒运行面批——+ `views-sandbox.mjs`）⇒ 三十三档（静态——`index.html` ∥ `app.mjs` ∥ `dom.mjs` ∥ `health.mjs` ∥ `nav.mjs` ∥ `views-*` 十四档（+ `views-system-config.mjs`——2026-10-09 配置控制台批落盘；2026-10-10 代理回迁批：代理行 ∥ 连通测试块并入；2026-10-10 沙盒批（两轮）：运行面批 + `views-sandbox.mjs`（运行面卡 + 容器区——§2.8①）；余面批 + `views-sandbox-egress.mjs`（§2.8）∥ `views-me-sandbox.mjs`（§2.9 成员面）） ∥ `modal.mjs` ∥ `i18n.mjs` ∥ `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ i18n 部件八档（`i18n-{zh,en}-{shell,me,admin,system}.mjs`） ∥ `model-specs-snapshot.mjs` ∥ `style.css`；含 favicon 全目录三十四档；`views.mjs` ∥ `views-proxy.mjs` 退役） | 页面路由 ∥ HTML/JS/CSS ∥ 静态直发 ∥ IA/导航 ∥ 多语言（§2.2） ∥ 可见面二轮（§2.3） ∥ 弹窗与服务模型配置面（§2.4） ∥ 样式族规范（§2.5） ∥ 系统页配置控制台（含代理设置与连通测试——§2.1 ∥ §2.7） ∥ 沙盒页（运行面——§2.8①；六面分两轮）∥ 管理面对话页（§2.10）——**admin-agent-chat 批（本批）：+ `views-chat.mjs`（管理面对话——§2.10）+ `nav.mjs` 管理项 +1 ⇒ 本行各计数 +1** | `webui/WEBUI.md` |
| ops | `thincoder-server/src/ops/` 五档（config ∥ log ∥ cli ∥ presets ∥ update）+ 部署档组（`thincoder-server/deploy/thincoder-server.service` ∥ `thincoder-server/deploy/docker-entrypoint.sh` ∥ `thincoder-server/deploy/converge.mjs` ∥ `thincoder-server/deploy/backup.mjs` ∥ `thincoder-server/Dockerfile` ∥ `thincoder-server/.dockerignore` ∥ `thincoder-server/docker-compose.yml`）+ 模板/说明档（`thincoder-server/config.example.json` ∥ `thincoder-server/README.md`）（已落盘） | 配置（含 provider 预设） ∥ 日志 ∥ 运维 CLI ∥ 更新机制（自检/自升/收敛） ∥ 部署面（npm ∥ Docker ∥ systemd ∥ 备份） | `ops/OPS.md` |
| client | `thincoder-server/src/client/` 一档（routes）（拟新增） | 客户端接入：客户面登录 ∥ 退出（token 吊销） ∥ 当前态读数（`me`）——token = 具名成员 key（复用 accounts key 面） | `client/CLIENT.md` |
| sandbox | `thincoder-server/src/sandbox/` 五档（routes ∥ registry ∥ rules ∥ credentials ∥ docker（本批新档——Docker API 客户端））+ 三档（`ssh` ∥ `onboarding` ∥ `onboarding-routes`——托管接入增补）+ 执行面档组（重做批定形） | 沙盒：节点与容器（最小切片——§3）∥ 托管接入（§3——agent 代做） ∥ 控制面（登记/工作区/规则/待批/凭据/控制台——§1–§9）；执行面随重做批重建 | `sandbox/SANDBOX.md` |
| agent | `thincoder-server/src/agent/` 六档（`run` 实读 **137** ∥ `tools` 实读 **288 ⇒ ≈200**（docker 执行器迁出——两驱动单源） ∥ **`chat` ≈300** ∥ **`chat-routes` ≈120** ∥ **`chat-tools` ≈400** ∥ **`docker-ops` ≈140**——后四档 = 本批（admin-agent-chat 批）） | 管理面 agent：两驱动形态（任务式 §2 ∥ 聊天式 §11） ∥ 任务模型 ∥ 工具面（任务五件 §3 + 管理面七件 §12） ∥ 会话与流式通路 ∥ 无人值守裁剪 ∥ 自主边界与失败处置 | `agent/ADMIN-AGENT.md` |

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
十二页两区（`#/login` ∥ 我的四页 ∥ 管理八页——IA = `webui/WEBUI.md` §2）——数据全经 /api/*，判权全在后端；系统页数据 = `/api/system`（版本/更新/引擎模型——KD-SV-24/30）
```

### 2.3 与 core 的关系（依赖决策摘要）

- **裁定（2026-10-10——用户指示 + 评估结论）：共有机制从核引；服务端专有域自持**。判据一句 = 「该机制三端是否也有？有 ⇒ 从核引；服务端专有 ⇒ 自持」。
- **逐面**：网关 = 不引（「不认识内容」的字节级中继语义——KD-SV-2 三理由；范围限网关面）∥ **存储 ∥ 记账 ∥ 账号 ∥ 控制台 ∥ 沙盒 ∥ 运维 = 自持**（核里无该面）∥ **agent 面（#1237）与后续共有机制 = 从核引**（依赖声明形照 CLI——`@thincoder/core` 钉版本；server agent 的无人值守档面裁剪随 #1237 设计轮）。
- 同仓直连的优势（协议两端一提交同改同审）保留待用：非 OpenAI 协议翻译类需求（现为不做项）出现时再按批直连，不预先耦合。
- 存储选 `node:sqlite` 与核 `thincoder-core/ledger-db.mjs` 同技术（`DatabaseSync`），零代码共享——各持各的库与 DDL。

## 3. 文档地图（板 2 + 域 9）

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
| `client/CLIENT.md` | 域 | client | 客户端接入：客户端 token 面 ∥ `/api/client/*` 数据面骨架 ∥ 端点表 ∥ 本域文件与预算 ∥ 验收判据（AC-31）∥ 用例 ∥ 边界（2026-10-10 B1 批建档） |
| `sandbox/SANDBOX.md` | 域 | sandbox | 沙盒：形态 ∥ 对象模型与存储（v11–v13） ∥ 节点与容器（最小切片——§3） ∥ 托管接入（§3——步骤表/凭据定形/网络路径） ∥ 出站规则单源 ∥ 工作区生命周期与节点绑定 ∥ 待批队列 ∥ 盒内凭据 ∥ 控制台六面（必交面——每配置项有 UI 写入口） ∥ 端点与判权 ∥ 已裁决策与披露 ∥ 验收判据 ∥ 用例 ∥ 本域文件与行数预算 ∥ 决策（含 KD-SV-79/80/81/83–86） ∥ 边界（2026-10-10 沙盒批建档；runner-admin-console 批随正；托管接入增补 2026-10-10） |
| `agent/ADMIN-AGENT.md` | 域 | agent | 管理面 agent：形态与定位 ∥ 任务模型 ∥ 工具面五件 ∥ 自主边界与失败处置 ∥ 无人值守裁剪 ∥ **聊天式驱动（§11）** ∥ **工具面扩展七件（§12）** ∥ 本域预算 ∥ 验收 ∥ 本域决策（KD-SV-82/87/88/89/90/91） ∥ 边界（2026-10-10 runner-admin-console 批建档；2026-10-11 admin-agent-chat 批增 §11/§12） |

## 4. 决策索引（KD-SV-1–91）

| # | 决策一句话 | 所在档 |
|---|---|---|
| KD-SV-1 | 形态 = 单进程单服务 | 本档 §5 |
| KD-SV-2 | 网关（provider 层）不引 `thincoder-core/*` | 本档 §5 |
| KD-SV-3 | 存储 = `node:sqlite`（WAL ∥ `user_version`） | `store/STORE.md` |
| KD-SV-4 | 模型派发 = **对外标识**（配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`）精确匹配；配了只认别名（旧前缀名 ⇒ 404——2026-10-09 alias 批 · KD-SV-59） | `gateway/API.md` |
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
| KD-SV-17 | provider 预设 = server 自持表（快照——起步 21 家 OpenAI 兼容子集） | `ops/OPS.md` |
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
| KD-SV-32 | 服务模型页 = 派生视图（零新端点——`providers` 展平；零引擎行——KD-SV-58）+ 配置骨架先行 | `webui/WEBUI.md` §7 |
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
| KD-SV-55 | 上游代理 = 逐渠 `proxy` 旗 + 顶层 `proxy.uri`（无全局闸）+ 自持 std 传输（零第三方——`proxy.mjs`） | `gateway/API.md` §6 |
| KD-SV-56 | 配置控制台 = 文件面读写 + 重启生效 + 原子写 + 校验单源（写端点 `/api/admin/config`；`host`/`port`/`db` 只读——定则例外显式） | `ops/OPS.md` §8 |
| KD-SV-57 | 嵌入配置可选 = 禁用态（缺位/`null` ⇒ 服务照起 + `/v1/embeddings` 404 `model_not_found` 消息明示——零新码；在场严格校验保持）+ 控制台向量卡「未配置」态可从无到有创建 | `ops/OPS.md` §8 |
| KD-SV-58 | 引擎模型退出通用清单（单独命名空间）：`/v1/models` 与控制台服务模型页零引擎行（`modelList` ∥ `deriveModels`）；派发面零动 | `gateway/API.md` §6 |
| KD-SV-59 | 服务模型别名 = `models_json` 条目两形（字符串 = 无别名 ∥ 对象 `{name, alias}`——**零迁移**）；校验 = 非空/无斜杠/无首尾空白 + 全服唯一（撞 ⇒ 拒启/400；别名 vs 前缀名 = 形上不相交）；对外标识 = 别名回映射（清单/派发/成员键/记账——内部真名零改） | `gateway/API.md` §6 |
| KD-SV-60 | 代理设置与连通测试 = 系统页「服务配置」卡内：`proxy.uri` = 第四写控件（保存体四键——白名单零变）+ 连通测试块（`POST /api/admin/proxy/test`——表单明传 uri ∥ 目标可填+预填首个 provider baseURL ∥ 自含读数 `{ ok, status ∥ error{kind}, ms }` ∥ 预算 10s ∥ 零落库零计费）∥ 旧链 `#/admin/proxy` ⇒ `#/admin/system` | `webui/WEBUI.md` §7 |
| KD-SV-61 | 客户端 token = 一枚具名成员 key（`api_keys` 行——端标签落 `name`；无过期天然 ∥ 不受 20 上限；`/api/client/*` 与 `/v1/*` 同源校验；不进 `sessions` 表） | `client/CLIENT.md` §5 |
| KD-SV-62 | 客户端数据面命名空间 = `/api/client/*`（骨架 = login ∥ logout ∥ me；鉴权 = 登录 token（Bearer——`requireApiKey` 单源复用）；错误形复用全码——零新码） | `client/CLIENT.md` §5 |
| KD-SV-63 | 沙盒 = 控制面直调 Docker API（server 不跑盒；节点可多台——集群化 = 用 Docker 自己的集群） | `sandbox/SANDBOX.md` §14 |
| KD-SV-67 | 未提交保护 = 卷保留 ∥ WIP 快照（控制端定时器） ∥ 销毁显式确认 | `sandbox/SANDBOX.md` §14 |
| KD-SV-68 | 出站 = 两类同表两闸（CIDR + 域名，解析后 IP 二查；显式 deny 恒先；增删即生效） | `sandbox/SANDBOX.md` §14 |
| KD-SV-69 | 待批队列 = 三态 + 60s + 三次建议 | `sandbox/SANDBOX.md` §14 |
| KD-SV-70 | 每工作区凭据 = `api_keys` 行（名 `sandbox:<ws>`；明文存控制面） | `sandbox/SANDBOX.md` §14 |
| KD-SV-71 | 可用性门 = 无可用节点 ⇒ 仅沙盒功能面不可用（不降级——503 `sandbox_unavailable`）；server 启动与运行零依赖沙盒 | `sandbox/SANDBOX.md` §14 |
| KD-SV-72 | 执行面共用（沙盒与 CI——用户 14:00 裁定⑦）：接口/形态随重做批定形 | `sandbox/SANDBOX.md` §14 |
| KD-SV-73 | 盒参数集 = read-only 根 + 唯一卷 + tmpfs 例外 + cap-drop + 非 root + 每工作区网络 | `sandbox/SANDBOX.md` §14 |
| KD-SV-74 | 磁盘配额 = 项目配额优先 ∥ loopback 备选（主机侧——SSH 执行） | `sandbox/SANDBOX.md` §14 |
| KD-SV-76 | 网络层闸 = nft 优先 ∥ iptables 备 + 全量重算幂等（主机侧——SSH 执行） | `sandbox/SANDBOX.md` §14 |
| KD-SV-78 | server 引核面 = agent 与后续共有机制；专有域自持（2026-10-10 裁定） | 本档 §5 |
| KD-SV-79 | 容器态不落库 = Docker 引擎即真源（读时读 ∥ 动作直调——零镜像/零同步；runner-admin-console 批） | `sandbox/SANDBOX.md` §14 |
| KD-SV-80 | 节点存活 = 读时探活（非心跳——请求内现打 `/info`；无后台定时器/心跳落库） | `sandbox/SANDBOX.md` §14 |
| KD-SV-81 | Docker API 版本 = 登记时协商（`max(1.44, MinAPIVersion)` ≤ `ApiVersion`）+ 调用恒带前缀 | `sandbox/SANDBOX.md` §14 |
| KD-SV-82 | 管理面 agent = server 进程内（核 `@thincoder/core`）+ 无人值守裁剪 + 工具面五件（无围栏；本批扩管理面七件——KD-SV-90） | `agent/ADMIN-AGENT.md` §9 |
| KD-SV-83 | 托管接入 = agent 逐案执行（步骤骨架 ∥ 六边界 ∥ 失败处置 = 仅撤自改 ∥ 预算） | `sandbox/SANDBOX.md` §14 |
| KD-SV-84 | 凭据 = AES-256-GCM + 密钥文件 0600 + 默认弃 + 可撤 + 每步审计（掩蔽） | `sandbox/SANDBOX.md` §14 |
| KD-SV-85 | SSH 传输 = 容器内系统 openssh（key ∥ `sshpass -e`）+ 指纹 TOFU | `sandbox/SANDBOX.md` §14 |
| KD-SV-86 | run 态 = 库行 + 读时轮询；重启 ⇒ `interrupted` + 凭据按模式处置 | `sandbox/SANDBOX.md` §14 |
| KD-SV-87 | 模型选择 = 任务提交时选择（注册表现有模型；无模型 ⇒ 不可提交） | `agent/ADMIN-AGENT.md` §9 |
| KD-SV-88 | 聊天式驱动 = 管理面 chat 会话（会话语义/回合/NDJSON 帧流/每回合预算——执行不依赖连接） | `agent/ADMIN-AGENT.md` §9 ∥ §11 |
| KD-SV-89 | 会话持久化 = v14 两表 + OpenAI 消息形 + notice 行 + `status` 在途标记（重启如实收尾） | `agent/ADMIN-AGENT.md` §9 ∥ `store/STORE.md` §2 v14 段 |
| KD-SV-90 | 工具面扩展 = 管理面七件（members/providers/models/usage/audit/runners/docker——进程内直取域件；exec 不入 chat） | `agent/ADMIN-AGENT.md` §9 ∥ §12 |
| KD-SV-91 | 审计型面 = `agent_event`（十三型——`chat_start`/`chat_call`/`chat_stop`；不双记既有域型） | `agent/ADMIN-AGENT.md` §9 ∥ `accounts/ACCOUNTS.md` §2.1 |

## 5. 关键决策（本档）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-1 | **形态 = 单进程单服务**（`node:http`——模块表见 §2.1） | 「内网一台常驻」；团队规模并发；零依赖纪律下无必要拆进程 | 多进程拆（入口/计量分离——无收益增运维）· 引 Web 框架（违零依赖） |
| KD-SV-2 | **网关（provider 层）不引 `thincoder-core/*`**（范围限定 = 网关面；全域口径 = KD-SV-78） | ① 核 `thincoder-core/provider/sse.mjs` 的 `readSSE` 是消费型（onToken 回调 ∥ 全量累积 ∥ 规则短路 ∥ 120s idle 判定）——中继复用会强制整段消费/再序列化，与「SSE 逐块透传」相抵；② 核 provider 层面向客户端多协议适配（anthropic/google/responses ∥ 重试 ∥ 限速 ∥ 思考映射）——网关零需要；③ 网关要「不认识内容」的代理语义——解析越少越稳。行数影响：自持 `thincoder-server/src/gateway/sse-tap.mjs`（≈80 行）覆盖全部所需（`data:` 行 JSON 取 usage） | **全引 `chat()`**（消费型语义错配 + 强制缓冲）· **引窄叶**（`normalizeUsageCache`——服务客户端缓存语义、网关不需要；`RETRYABLE_STATUS`——本设计不做重试）· **引 `embedding.mjs`**（自带批量/归一化/整流——网关须原样透传与计数，语义不符） |
| KD-SV-78 | **server 引核面 = agent 面（#1237）与后续共有机制；专有域自持**（2026-10-10 裁定——用户指示 + 评估结论）：从核引 = 依赖声明形照 CLI（`@thincoder/core` 钉版本；server agent 的无人值守档面裁剪随 #1237 设计轮） | 判据 = 「该机制三端是否也有？有 ⇒ 从核引；服务端专有 ⇒ 自持」——存储 ∥ 记账 ∥ 账号 ∥ 控制台 ∥ 沙盒 ∥ 运维 = 核里无该面（自持）；agent 面与后续共有机制 = 三端共有（从核引） | **全树自持**（共有机制各写一套——重复与三端漂移；否）· **全树引核**（网关面语义错配——KD-SV-2 三理由；否） |
| KD-SV-79 | **容器态不落库**（runner-admin-console 批）：Docker 引擎即真源——读时读（`containers/json`）∥ 动作直调（create/start/stop/DELETE）；控制面零镜像 ∥ 零同步机制 | 双源必漂移（外部 `docker` 命令 ∥ 机器重启 ∥ 别的工具都在改容器）；同步/对账机制 = 白增面（最小切片不取） | 落库镜像表 + 对账（同步机制/陈旧窗口——否）；心跳式上报（用户 19:52 口径已排除——机器上不驻留进程 ∥ 无心跳） |
| KD-SV-80 | **节点存活 = 读时探活（非心跳）**：运行面/读数 = 请求内现打 `GET …/info`（3s ∥ 并发）∥ 动作 = 现打现报；无后台定时器 ∥ 无心跳落库 | 用户 19:52 口径（无自驻进程）；探活只服务展示与当下动作，无独立可用性状态可陈 | 心跳上报（通道已废——否）；常驻探针进程（用户口径排除——否） |
| KD-SV-81 | **Docker API 版本 = 登记时协商 + 调用恒带前缀**：`ver = max(1.44, MinAPIVersion)`，须 ≤ `ApiVersion`（否则拒登记）；版本存 `runtime_json` | 官方文档明示无版本前缀调用已废弃（将移除）；协商 = 老 daemon（min < 1.44）与新 daemon（min ≥ 1.44）两头都接得住 | 裸无前缀（官方废弃面——否）；固定档不协商（未来 daemon 抬底即坏——否） |
| KD-SV-82 | **管理面 agent = server 进程内**（核 `@thincoder/core` + 最小壳——KD-SV-78 落实）+ **无人值守档面裁剪**（保留核 agent 环/工具协议/provider；裁剪审批面/TTY/无关族）+ **工具面五件**（exec ∥ docker ∥ register ∥ verify ∥ report——无白名单围栏）；唯一一个 agent（用户 22:29）；驱动器两形（任务式 ∥ 聊天式——聊天式 = **admin-agent-chat 批**（§11/KD-SV-88）） | 用户 22:19–22:29 口径 + KD-SV-78（从核引）；进程内 = 直取域件零 HTTP 回环；机器侧零驻留延续 19:52 | 独立进程/守护（另一套生命周期——否）；自写第四份 agent（KD-SV-78 已否）；白名单围栏（15:02 用户已撤——否） |
| KD-SV-83 | **托管接入 = agent 逐案执行**（探明 → 决定 → 执行 → 验证 → 报告——非固定脚本）：步骤骨架 S1–S8 在案（`sandbox/SANDBOX.md` §3）∥ 自主 = 技术路线（包管理器/装法/重试 ≤1/次序）∥ 停下报告六边界 ∥ 失败处置 = 仅撤自改可逆配置（drop-in）∥ 装包不回滚 ∥ 登记失败零宿主回滚 ∥ 预算（20 分钟 ∥ 60 调用） | 用户 15:00/15:02 口径；无人值守须保险丝与停点；「回滚还是停下」= 按动作可逆性分类 | 固定安装脚本（用户已否）；全量回滚（装包卸载更危险——否）；无预算（跑飞面——否） |
| KD-SV-84 | **凭据 = AES-256-GCM + 密钥文件（`data/credentials.key` 0600）+ 默认用完即弃 + 可撤销 + 每步审计（掩蔽）** | 需求凭据纪律五件定形（#1236）；`node:crypto` 零第三方；默认弃 = 信任最小化；如实披露（同机密钥不防整机沦陷；撤销只及 server 侧） | 明文落库（跳板凭据面——否）；外部 KMS（另立级——本批否）；默认保留（长期持凭据——否） |
| KD-SV-85 | **SSH 传输 = 容器内系统 openssh**（密钥 `-i`（0600 文件）∥ 密码 `sshpass -e`（环境变量——不入 argv））+ 主机指纹 TOFU（accept-new + 首见记录；变更 ⇒ 停 + 「重新信任」重试）+ `.ssh` 落数据目录 | 零第三方运行期依赖（仓纪律——JS 自写 SSH 不现实）；`sshpass -e` = ps 无泄漏形；数据目录 = 容器重建不丢 | 自写 SSH 协议（体量/安全——否）；`-p` 明文 argv（ps 泄漏——否）；不验指纹（网内中间人——否）；硬拒一切指纹变更（重装常态——否） |
| KD-SV-86 | **run 态 = 库行 + 读时轮询**（`sandbox_onboarding` v13——无后台常驻定时器）；重启 ⇒ 在途 `interrupted`（如实收尾 + 凭据按模式处置） | 沿 KD-SV-80（无后台常驻）；部署链真会重建容器（重启恢复必须诚实） | 内存态（刷新即失/重启悬挂——否）；后台监控定时器（无必要常驻——否） |
| KD-SV-87 | **模型选择 = 任务提交时选择**（下拉源 = provider 注册表；缺省 = 最近一次成功所用；无模型 ⇒ 不可提交） | 显式可见（零隐藏缺省）∥ 零新配置项（免「每配置项有 UI 写入口」新面）∥ 每次运行留痕 | 配置项 `agent.model`（新配置面 + UI 落点无自然位——否）；固定取首家 provider 首模型（静默任意——否） |
| KD-SV-88 | **聊天式驱动 = 管理面 chat 会话（§11——admin-agent-chat 批）**：会话（建会话时选定模型——KD-SV-87 同口径）× 回合（用户发一条 ⇒ 环跑到终态）∥ 流式通路 = 单 POST + NDJSON 帧流（`delta`/`call`/`result`/`end`）∥ **执行不依赖连接**（落库单源）∥ 每回合预算独立（20 分钟 ∥ 60 调用）∥ 判权 = `requireAdmin` 全族 | 需求 §5「两个 chat 界面」④ + 用户「浏览器流式会话通路」点名；单请求 = 写入与执行同跳；NDJSON = 每行一帧零壳；断连照跑 = 同「读时单源」先例 | `EventSource`（GET-only）· SSE-over-fetch（无增益壳）· WebSocket（超需求）· 轮询（非流式）· 双请求（孤儿流）· 任务式复用（run 语义不合） |
| KD-SV-89 | **会话持久化 = v14 两表 + OpenAI 消息形 + notice 行 + `status` 在途标记**：`agent_chats` ∥ `agent_chat_messages`（role 四值 CHECK ∥ 逐条增量落库 ∥ 回放 = 库行装配——notice 滤除；工具结果截断口径 = 任务面）∥ 重启 ⇒ `running` ⇒ `idle` + notice + `chat_stop`（KD-SV-86 口径） | 行式 = 逐条增量（免写放大）∥ 在途标记落库 = 刷新/多标签一致（进程内存不作判据） | 单档 JSON 列（写放大）· 纯内存会话（悬挂）· 复用核会话档（域差异）· 复用 `sandbox_onboarding`（域错） |
| KD-SV-90 | **工具面扩展 = 管理面七件（§12）**：`members`（六动词）∥ `providers`（五）∥ `models`（五）∥ `usage`（summary/rows）∥ `audit`（query）∥ `runners`（list/add/remove）∥ `docker`（十动词——绑定 = 注册节点）；进程内直取域件（KD-SV-82 延续）；写链与路由同函数（单源）；**`exec` 不入 chat**（SSH 凭据 = 任务表单专有——KD-SV-84 不破） | 需求 §5 工具面行 + 用户 22:28「成员/provider/模型/用量等托管给 agent」；「控制台与 agent 同一套调用」口径镜像；进程内 = 判权/校验/审计单源 | 任务五件复用（绑定语义不合）· HTTP 回环（双判权）· 每动作一工具（爆炸）· docker 任意地址（机队语义）· chat 收 SSH 凭据（另裁才可） |
| KD-SV-91 | **审计型面 = `agent_event`（十三型）**：kind = `chat_start` ∥ `chat_call`（**每工具调用——读动作同落行**）∥ `chat_stop`（预算/模型错/重启）；**不双记**既有域型；掩蔽沿任务面 | 跨六域动作面（单一型 + kind）∥ 「每次动作落审计行」= 用户口径 ∥ 不双记 = 计数诚实 | 复用 `sandbox_event`（名不符）· 逐域既有型（枚举爆炸）· 不落审计（违口径）· turn 级行（噪声） |

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
  控制台测试 key 缺陷修复批预算（2026-10-09 设计轮——本批；台账 #1120）：产品面 ≈+8——`thincoder-server/public/views-providers-modals.mjs` 实读 **367**（2026-10-07）⇒ **实读 376**（草稿 key 助手 ∥ 两调用点与注释随正——2026-10-09 实施回填收正）；
  i18n 两表 ∥ `style.css` ±0（文案与样式零动）∥ `thincoder-server/package.json` ±0（`prepublishOnly` 清单添本批件——本批 +1 件（已落盘）；单行清单行数零变）∥ 批内件一件（已落盘——`docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`，实读 **201** 行）；机制全文 = `webui/WEBUI.md` §2.4④（KD-SV-54）；实施后回填轮（已办——2026-10-09）。
  随正件（本批——fix 轮补列）：门禁件数断言七件 N ⇒ N+1——注释同拍（N 以实施当刻盘面实读为准——现值实读 2026-10-09 = 29 ⇒ 30；在途批入链先后影响绝对值）：`-console-list-style` · `:237` ∥ `-server-auto-update` · `:480` ∥ `-console-layout` · `:449` ∥
  `-me-usage-charts` · `:225` ∥ `-provider-model-metadata` · `:491` ∥ `-quota-per-model` · `:444` ∥ `-quota-v2-member-models` · `:428`——父侧已落（2026-10-09 实施轮同拍；行数 ±0——断言文本就地收正）；文档链随正 = `ops/OPS.md` §5.1 ∥ 本档 §6 板级行（29 ⇒ 30 件）。
  provider 默认模型清除批（2026-10-09——服务端舱；台账 #1122）：产品面 实读 **+3**——`thincoder-server/src/ops/presets.mjs` 实读 **50 ⇒ 51**（头注 ∥ 表注 ∥ 展开注随正；表 20 键逐键去 `model`——行数不变） ∥
  `thincoder-server/README.md` 实读 **244 ⇒ 246**（预设句块 +2——覆盖句 ∥ `models` 无预设缺省 + 勾选路径句）；`thincoder-server/package.json` ±0（`prepublishOnly` 清单添本批件——本批 +1 件（已落盘）；单行清单行数零变）∥
  批内件一件（已落盘——`docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`，实读 **180** 行）；机制全文 = `ops/OPS.md` §1。
  server 代理批预算（2026-10-09 设计轮——本批；台账 #1128 ∥ #1129；用户 13:45/13:5x 两令）：产品面 ≈+311（gateway ≈+243——`proxy.mjs`（**已落盘 267**——自持 std 传输） ∥
  `forward.mjs` 实读 **201** ⇒ ≈210（`proxyUri` 参 ∥ 出口换 +≈9） ∥ `providers.mjs` 实读 **177** ⇒ ≈195（`proxy` 解码 ∥ 注入 ∥ 种子列 +≈18） ∥ `provider-admin.mjs` 实读 **284** ⇒ ≈300（discover `proxy` ∥ GET/POST/PATCH 面 +≈16）；
  ops ≈+35——`config.mjs` 实读 ≈260 ⇒ ≈278（`proxy` 段校验 ∥ 条目判据 +≈18） ∥ `presets.mjs` 实读 **51** ⇒ ≈53（`gemini-openai` 行 ∥ 头注 +≈2） ∥ `README.md` 实读 **247** ⇒ ≈259（proxy 配置行 ∥ 说明 +≈12） ∥ `config.example.json` 实读 **35** ⇒ ≈37（`proxy` 段示例） ∥ `package.json` ±0（`prepublishOnly` 清单 30 ⇒ **31**——本批件入链；单行清单行数零变）；
  store ≈+10——`db.mjs` 实读 **≈224** ⇒ ≈234（v9 段）；webui ≈+23——`views-providers-modals.mjs` 实读 **376** ⇒ ≈395（两窗勾选 ∥ 探针随携 +≈19） ∥ i18n 两表 +≈2/表；核侧 ≈+3——`thincoder-core/config-presets.mjs` 实读 **53** ⇒ ≈56（`gemini-openai` 行 + 注释）；
  批内件一件（**已落盘 735 行**·19 例——`docs/batches/2026-10-09-server-gemini-openai-preset.test.mjs`）；
  随正件 = 漂移件 `docs/batches/2026-10-06-server-presets.test.mjs`（`:123` `20 ⇒ 21`——本批实施落）+ `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`（四处 `20 ⇒ 21`——跨批面父侧落）；机制全文 = `gateway/API.md` §6 KD-SV-55 ∥ `ops/OPS.md` §1；
  **实施后回填（父侧 · 2026-10-09——实读）**：`forward.mjs` **208** ∥ `providers.mjs` **184** ∥ `provider-admin.mjs` **305** ∥ `config.mjs` **301** ∥ `presets.mjs` **52** ∥ `README.md` **252**；
  `config.example.json` **38** ∥ `db.mjs` **231** ∥ `views-providers-modals.mjs` **385** ∥ `config-presets.mjs` **66**；i18n 两表 = 138 ∥ 142（+1 键）。
配置控制台批预算（2026-10-09 设计轮——本批；台账 #1139 ∥ #1138 ∥ #1123；用户 15:51–15:57 三连）：产品面 ≈+467——逐档 = gateway ≈+172（`config-admin.mjs`（已落盘 · 实读 **182** 行） ∥ `embedding-admin.mjs` 实读 **96** ⇒ ≈108（草稿三项明传优先 +≈12））∥
  accounts +1（`audit.mjs` 实读 **108** ⇒ ≈109——`config_update` 入 `AUDIT_TYPES`）∥ store ≈+25（`db.mjs` 实读 **231** ⇒ ≈256——v10 段（`audit_events` CHECK 扩型重建））∥
  webui ≈+250（`views-system-config.mjs`（已落盘 · 实读 **103** 行） ∥ `views-system.mjs` 实读 **175** ⇒ ≈230（向量卡配置面/保存/草稿探活 +≈55） ∥ `views-audit.mjs` 实读 **91** ⇒ ≈94（十型接） ∥
  `i18n-{zh,en}-system.mjs` 122 ⇒ ≈151（+29/表） ∥ `i18n-{zh,en}-admin.mjs` 138 ∥ 142 ⇒ ±0（`useProxy` 逐值改） ∥ `style.css` 228 ⇒ ≈232（表单复用为主 +≈4））∥
  ops ≈+19（`bin/thincoder-server.mjs` 实读 **178** ⇒ ≈180（+≈2） ∥ `README.md` 实读 **252** ⇒ ≈264（控制台配置面句 ∥ 容器路配置目录前提 +≈12） ∥ `docker-compose.yml` 实读 **20** ⇒ ≈24（目录级 rw 挂载形 +≈4） ∥ `.dockerignore` 实读 **8** ⇒ ≈9（+1 = `config/` 排除） ∥ `config.example.json` ±0）∥
  `package.json` ±0（`prepublishOnly` 清单 31 ⇒ **32**——本批件入链；单行清单行数零变）；
  档目 29 ∥ 30 ⇒ **30 ∥ 31**（+ `views-system-config.mjs` 一档）；批内件一件（`docs/batches/2026-10-09-server-console-config.test.mjs`——估 ≈450 行）；机制全文 = `ops/OPS.md` §1（配置写面）+ §8 KD-SV-56 ∥ 端点 = `gateway/API.md` §2.4 ∥ 控制台面 = `webui/WEBUI.md` §2.1；
  **实施后回填（父侧 · 2026-10-09——实读）**：`config-admin.mjs` **182** ∥ `embedding-admin.mjs` **110** ∥ `audit.mjs` **109** ∥ `db.mjs` **255** ∥ `views-system-config.mjs` **105** ∥ `views-system.mjs` **222** ∥ `views-audit.mjs` **93** ∥ `i18n-{zh,en}-system.mjs` **153 ∥ 153**；
  `style.css` **229** ∥ `bin/thincoder-server.mjs` **180** ∥ `README.md` **256** ∥ `docker-compose.yml` **22** ∥ `.dockerignore` **12** ∥ `package.json` ±0；批内件 **796 行**（估 ≈450）；批面实读增量 ≈**+1246**（产品面 **+450**——估 ≈467 ∥ 批内件 +796）。随正件/批内件行数注 = 注⑬。
  embed 解耦批预算（2026-10-09 设计轮——本批；台账 #1147 ∥ #1148；用户 17:24 两条之 1/2）：产品面 ≈+27——逐档 = gateway ≈+11（`routes.mjs` 实读 **111** ⇒ ≈117（缺配 404 支 +≈6） ∥ `embedding-admin.mjs` 实读 **110** ⇒ ≈118（GET 缺段 null 容形 ∥ 探活缺配 400 +≈8） ∥ `providers.mjs` 实读 **184** ⇒ ≈181（`modelList` 引擎行删 −≈3））∥
  ops ≈+7（`config.mjs` 实读 **301** ⇒ ≈306（embedding 可选分支 ∥ 告警一行 +≈5） ∥ `README.md` 实读 **256** ⇒ ≈258（嵌入可选句 +≈2） ∥ `config.example.json` ±0）∥
  webui ≈+9（`views-system.mjs` 配置批后 ≈230 ⇒ ≈245（未配置态 +≈15） ∥ `views-models.mjs` 实读 **216** ⇒ ≈208（引擎行与死支删 −≈8） ∥ `views-admin.mjs` 实读 **331** ⇒ ±0（调用点去参——一行改） ∥ `i18n-{zh,en}-system.mjs` 实读 **153** ⇒ ≈155（+2/表） ∥ `i18n-{zh,en}-admin.mjs` 实读 **138 ∥ 142** ⇒ ≈137 ∥ 141（−1/表））；
  `package.json` ±0（`prepublishOnly` 清单 32 ⇒ **33**——本批件入链；单行清单行数零变）；零新档——档目 30 ∥ 31 不变；批内件一件（`docs/batches/2026-10-09-server-embedding-decouple.test.mjs`——估 ≈300 行）；机制全文 = `ops/OPS.md` §8 KD-SV-57 ∥ `gateway/API.md` §6 KD-SV-58；
  **实施后回填（父侧 · 2026-10-09——实读）**：gateway `routes.mjs` **114** ∥ `embedding-admin.mjs` **117** ∥ `providers.mjs` **183**；ops `config.mjs` **311** ∥ `README.md` **256**（±0） ∥ `config.example.json` **38**（±0）；
  webui `views-system.mjs` **237** ∥ `views-models.mjs` **209** ∥ `views-admin.mjs` **331**（±0） ∥ `views-me.mjs` **297**（+2——列表外改动） ∥ `i18n-{zh,en}-system.mjs` **155 ∥ 155** ∥ `i18n-{zh,en}-admin.mjs` **137 ∥ 141**（−1/表）；
  `package.json` **26**（±0——清单 33 件）；产品面实读增量 ≈**+23**（估 ≈+27）；批内件 **579 行**（估 ≈300）。随正件/行数注 = 注⑭。
  server-model-alias 批预算（2026-10-09 设计轮——本批；台账 #1153 + 并入 #1008 ∥ #1010 ∥ #1152 ∥ #967 ∥ #1151；需求 §2:29 + AC-29；用户 20:32/20:36 令）：产品面 ≈**+147**——逐档 = gateway ≈+44（`providers.mjs` 实读 **183** ⇒ ≈208（别名索引 ∥ 归一助手 ∥ 外标解析 +≈25） ∥ `provider-admin.mjs` 实读 **305** ⇒ ≈322（校验/唯一性 +≈17） ∥
  `forward.mjs` 实读 **208** ⇒ ≈210（派发查表换用外标解析 +≈2））∥
  metering ≈+48（`usage.mjs` 实读 **170** ⇒ ≈182 ∥ `aggregates.mjs` 实读 **173** ⇒ ≈183 ∥ `report.mjs` 实读 **226** ⇒ ≈252——读面回映射与过滤反查；域档小计 ⇒ ≈774）∥
  webui ≈+49（`views-models.mjs` 实读 **209** ⇒ ≈240（别名组 +≈31） ∥ `views-providers-modals.mjs` 实读 **385** ⇒ ≈395（勾选保形 +≈10） ∥ `i18n-{zh,en}-admin.mjs` 实读 **137 ∥ 141** ⇒ ≈141 ∥ ≈145（+4/表）；域档小计 ⇒ ≈4036）∥
  ops ≈+6（`config.mjs` 实读 **311** ⇒ ≈316（别名校验 +≈5） ∥ `README.md` 实读 **256** ⇒ ≈257（#967 注一行 +≈1））∥ accounts/store ±0（键形校验助手归 gateway 别名层——接点零行）；
  `package.json` ±0（`prepublishOnly` 清单 33 ⇒ **34**——本批件入链；单行清单行数零变）；零新档——档目 30 ∥ 31 不变；批内件一件（`docs/batches/2026-10-09-server-model-alias.test.mjs`——估 ≈350 行）；机制全文 = `gateway/API.md` §6 KD-SV-59；随正件/行数注 = 注⑮（§9 R48②——实施后回填轮实读收正）。
  console-proxy-page 批预算（2026-10-09 设计轮——本批；台账 #1158；需求 §2:30 + AC-30；用户 21:06 令）：产品面 ≈**+233**——逐档 = webui ≈+135（`views-proxy.mjs`（已落盘）≈110 ∥ `views-system-config.mjs` 实读 **106** ⇒ ≈96（去 proxy.uri 行/标签/保存键） ∥ `nav.mjs` 实读 **88** ⇒ ≈89（+1 管理项） ∥ `app.mjs` 实读 **191** ⇒ ≈193（import ∥ `PAGES` 行） ∥
  `i18n-{zh,en}-system.mjs` 实读 **155 ∥ 155** ⇒ ≈170（+17 键 −2 键/表） ∥ `i18n-{zh,en}-shell.mjs` 实读 **73 ∥ 71** ⇒ ≈74 ∥ ≈72（+1/表） ∥ `i18n-{zh,en}-admin.mjs` 实读 **137 ∥ 141** ⇒ ±0（`useProxy` 逐值改） ∥ `style.css` ±0（复用既有族——零新类/变量））∥
  gateway ≈+95（`proxy-admin.mjs`（已落盘）≈95——测试端点：判权 ∥ 轻校验 ∥ 代打 ∥ kind 二分类 ∥ 自含形）∥ ops ≈+3（`bin/thincoder-server.mjs` 实读 **180** ⇒ ≈182（import ∥ 注册行） ∥ `README.md` 实读 **256** ⇒ ≈258（写面落点三处改指 + 代理页句））∥ `package.json` ±0（`prepublishOnly` 清单 34 ⇒ **35**——本批件入链；单行清单行数零变）；
  档目 30 ∥ 31 ⇒ **31 ∥ 32**（+ `views-proxy.mjs` 一档；gateway 十三 ⇒ **十四档**）；批内件一件（`docs/batches/2026-10-09-console-proxy-page.test.mjs`——估 ≈300 行）；机制全文 = `webui/WEBUI.md` §2.7（KD-SV-60）∥ 端点 = `gateway/API.md` §2.4 ∥ 写面落点 = `ops/OPS.md` §1；随正件/行数注 = 注⑯。
  **实施后回填（2026-10-09——实读）**：webui `views-proxy.mjs` **119** ∥ `views-system-config.mjs` **103** ∥ `nav.mjs` **89** ∥ `app.mjs` **192** ∥ `i18n-{zh,en}-system.mjs` **172 ∥ 172**；
  `i18n-{zh,en}-shell.mjs` **74 ∥ 72** ∥ `i18n-{zh,en}-admin.mjs` ±0（`useProxy` 逐值改） ∥ `style.css` ±0；gateway `proxy-admin.mjs` **81**；ops `bin/thincoder-server.mjs` **182** ∥ `README.md` **258**（净 0——三处 hunk 全行内改）；
  产品面实读增量 ≈**+238**（估 ≈+233——webui **+155** ∥ gateway **+81** ∥ ops **+2**）；档目 **31 ∥ 32**（实读）；批内件 **540 行**（估 ≈300）。
  console-proxy-back 批预算（2026-10-10 形式化轮——本批；台账 #1199；需求 §2:30 + AC-30 回改；用户 08:22 令「服务器的代理设置还是放回系统设置页面。」+ 08:41「测试要保留。」）：产品面实读增量 **−65**——逐档 = webui **−65**（`views-proxy.mjs` **−119**（删档） ∥
  `views-system-config.mjs` 103 ⇒ **166**（+63——代理行回归 ∥ 连通测试块并入） ∥ `nav.mjs` 89 ⇒ **88**（−1） ∥ `app.mjs` 194 ⇒ **192**（−2） ∥ `i18n-{zh,en}-system.mjs` 172 ⇒ **170 ∥ 170**（−2/表） ∥
  `i18n-{zh,en}-shell.mjs` 74 ∥ 72 ⇒ **73 ∥ 71**（−1/表） ∥ `i18n-{zh,en}-admin.mjs` ±0（`useProxy` 逐值改） ∥ `style.css` ±0）；gateway ∥ ops 产品面 ±0（零触）；
  档目 31 ∥ 32 ⇒ **30 ∥ 31**；`package.json` ±0（`prepublishOnly` 38 件——零新件入链；**跨批件十五档随正**：`-console-completeness-2` ∥ `-console-list-style` ∥
  `-console-modals` ∥ `-console-provider-redo-runtime` ∥ `-console-providers` ∥ `-models-config` ∥ `-server-gateway-webui-deploy` ∥ `-server-i18n` ∥ `-me-keys-redo-ui` ∥ `-provider-model-metadata` ∥
  `-quota-v2-member-models` ∥ `-server-public-structure` ∥ `-console-proxy-page` ∥ `-server-console-config` ∥ `-server-small-fixes`）；批内件 = 零（跨批件随正代批内件——判据 = 重跑全链 337/337）；机制全文 = `webui/WEBUI.md` §2.7（KD-SV-60）∥ 端点 = `gateway/API.md` §2.4 ∥ 写面落点 = `ops/OPS.md` §1。
  跨批件十五档逐档行数（实读 2026-10-10 ⇒ ±0——断言文本就地收正；口径 = `split("\n").length − 1`）：`-console-completeness-2` **504** ∥ `-console-list-style` **241** ∥ `-console-modals` **468** ∥ `-console-provider-redo-runtime` **350** ∥
  `-console-providers` **479** ∥ `-models-config` **270** ∥ `-server-gateway-webui-deploy` **322** ∥ `-server-i18n` **303** ∥ `-me-keys-redo-ui` **395** ∥ `-provider-model-metadata` **494** ∥
  `-quota-v2-member-models` **740** ∥ `-server-public-structure` **156** ∥ `-console-proxy-page` **547** ∥ `-server-console-config` **795**（十五件均 ≤800 硬限；本件逼近——余 5 行，拆分预案宜随档） ∥ `-server-small-fixes` **349**。（父侧补注——设计评审 #109 发现 3 对账；可 revert）
  team-login-client-access 批预算（2026-10-10 设计轮——本批；台账 #1212；需求 §2:31 + AC-31）：服务端产品面 ≈**+77**——逐档 = `thincoder-server/src/client/routes.mjs`（拟新增）≈75（login ∥ logout ∥ me 三处理 + 注册行；复用 members/keys/guard/audit 单源——零迁移零新码） ∥
  `thincoder-server/bin/thincoder-server.mjs` 实读 **182** ⇒ ≈184（import ∥ 注册行）；域面 = **client 域新立（一档）**；accounts ∥ store ∥ gateway ±0（结构版本保持 v10）；
  `thincoder-server/package.json` ±0（`prepublishOnly` 清单 38 ⇒ **39**——本批件入链；单行清单行数零变）；**批内件三件（跨档集）**：服务端单件 = `docs/batches/2026-10-10-team-login-client-access.test.mjs`（估 ≈260 行——**入 server 链**：`prepublishOnly` 38 ⇒ 39）；
  核 + 三端结构件 = `docs/batches/2026-10-10-team-login-client-access-ends.test.mjs`（估 ≈380 行——**不入 server 链**：跨面件无宿主产品链——登记面 = `docs/core/design/TEAM.md` §4 ∥ `docs/desktop/design/SETTINGS.md` §3.2）；
  桌面件 = `docs/batches/2026-10-10-team-login-client-access-desktop.test.mjs`（实读 **364** 行——**不入链**：桌面包无 `prepublishOnly` 链）；机制全文 = `client/CLIENT.md` §1/§5（KD-SV-61/62）；端侧清单（核 + 三端）另册 = `docs/core/design/TEAM.md` §4。
  server-exec-sandbox 批预算（2026-10-10 设计轮——本批；台账 #1224；需求 §5 沙盒块 + 用户 14:00 两平面裁定 + 14:08 必交面行）：产品面 ≈**+3998**——逐面 = 控制面 ≈+1161（sandbox 域五档 ≈270 ∥ ≈230 ∥ ≈250 ∥ ≈230 ∥ ≈80 + `db.mjs` +≈90（v11 七表 + 审计重建） ∥ `audit.mjs` +≈3 ∥ `errors.mjs` +≈2 ∥ `bin/thincoder-server.mjs` +≈6）∥
  执行面预算随重做批重建（`deploy/sandbox/Dockerfile` ≈35——盒镜像）∥
  webui ≈+682（`views-sandbox.mjs` 新 ≈290（六面卡） ∥ `views-sandbox-egress.mjs` 新 ≈240 ∥ `nav.mjs` +1 ∥ `app.mjs` +3 ∥ i18n admin 两部件 +≈60/表 ∥ i18n system 两部件 +≈4/表 ∥ `views-audit` +≈8 ∥ `style.css` +≈12）∥ ops ≈+60（`README.md` runner 部署节——§5.10）；
  档目：webui 30 ∥ 31 ⇒ **33 ∥ 34**（+3 档——沙盒两档 + 成员面一档）；sandbox 域新立（域档一档——`sandbox/SANDBOX.md`；执行面随重做批重建）；`thincoder-server/package.json` ±0（`prepublishOnly` 38 ⇒ **40**——本批两件入链）；
  批内件两件（**均入 server 链**）：`docs/batches/2026-10-10-server-exec-sandbox.test.mjs`（估 ≈480——控制面/服务面）∥ `docs/batches/2026-10-10-server-exec-sandbox-runner.test.mjs`（估 ≈450——盒参数/网络/配额假 runtime）；
  机制全文 = `sandbox/SANDBOX.md`；随正件 = 注⑱。
  runner-admin-console 批预算（2026-10-10 设计轮——本批；台账 #1252；用户 19:59 令）：服务端产品面 ≈**+316**——逐档 = sandbox 域（`routes.mjs` 实读 **407** ⇒ ≈540（+≈133——添/删节点 ∥ 容器四路由；drain 路由删） ∥
  `registry.mjs` 实读 **522** ⇒ ≈500（−≈22——runner 面重写 ∥ `runnerHealth` 删） ∥ `docker.mjs` 新 ≈170（Docker API 客户端——版本协商/四端点/错误映射） ∥ `db.mjs` 实读 **365** ⇒ ≈400（v12 段 +≈35） ∥ `errors.mjs` ±0 ∥ `bin` ±0）；
  webui ≈**+275**（`views-sandbox.mjs` 新 ≈210 ∥ `nav.mjs` +1 ∥ `app.mjs` +3 ∥ i18n admin 两部件 +≈26/表 ∥ shell 两部件 +1/表（`err.upstream_error` 逐值改——±0） ∥ `style.css` +≈7）；零新档——档目 30 ∥ 31 ⇒ **31 ∥ 32**（+1 档）；`thincoder-server/package.json` ±0（`prepublishOnly` 40 ⇒ **42**——本批两件入链；单行清单行数零变）；
  批内件两件（**均入 server 链**）：`docs/batches/2026-10-10-runner-admin-console.test.mjs`（估 ≈420——Docker 客户端/路由/v12 迁移）∥ `docs/batches/2026-10-10-runner-admin-console-ui.test.mjs`（估 ≈260——前端面）；机制全文 = `sandbox/SANDBOX.md` §3。
  托管接入（管理面 agent）增补预算（2026-10-10 设计轮——runner-admin-console 批增补；台账 #1236/#1237；用户 22:19–22:29 + 15:00/15:02 裁）：服务端产品面 ≈**+1110**——逐档 = **agent 域新立**（`run.mjs` 新 ≈230 ∥ `tools.mjs` 新 ≈240——KD-SV-82） ∥
  sandbox 域（`ssh.mjs` 新 ≈180 ∥ `onboarding.mjs` 新 ≈300 ∥ `onboarding-routes.mjs` 新 ≈130 ∥ `routes.mjs` ±≈5 ∥ `db.mjs` ≈400 ⇒ ≈425（v13 段 +≈25）） ∥ `Dockerfile` +≈3（`openssh-client` + `sshpass`） ∥ `bin` ±0；
  webui ≈**+141**（`views-sandbox.mjs` ≈210 ⇒ ≈285 ∥ i18n admin 两部件 +≈30/表 ∥ `style.css` +≈6；零新档——档目 31 ∥ 32 不变）；域档 +1（agent 域——域档计数 8 ⇒ **9**）；
  批内件：`docs/batches/2026-10-10-runner-admin-console-agent.test.mjs`（估 ≈420——假 ssh/五工具/任务生命周期/凭据加密/v13 迁移；**入 server 链**）+ ui 件随增（≈260 ⇒ ≈330）；`thincoder-server/package.json`（`prepublishOnly` 39 ⇒ **42**——本批三件入链；单行清单行数零变）；
   机制全文 = `sandbox/SANDBOX.md` §3 ∥ `agent/ADMIN-AGENT.md`；随正件（父侧落——实施轮同拍）：`docs/batches/2026-10-10-runner-admin-console.test.mjs`（v13 读点/句） ∥ `-ui.test.mjs` ∥ 门禁件数断言件（39 ⇒ 42——以收口实读为准）。

   admin-agent-chat 批预算（2026-10-11 设计轮——本批；台账 #1254；需求 §5「两个 chat 界面」②④）：服务端产品面 ≈**+1280**——逐档 = **agent 域**（`chat.mjs` 新 ≈300 ∥ `chat-routes.mjs` 新 ≈120 ∥ `chat-tools.mjs` 新 ≈400 ∥ `docker-ops.mjs` 新 ≈140 ∥ `tools.mjs` 288 ⇒ ≈200（执行器迁出 −≈88） ∥ `run.mjs` ±0（复用环）） ∥ **store**（`db.mjs` 实读 **409** ⇒ ≈450——v14 段 +≈41） ∥ **accounts**（`audit.mjs` ±0——型面扩走 CHECK） ∥ **bin**（实读 187 ⇒ ≈189）；
   webui ≈**+380**（`views-chat.mjs` 新 ≈300 ∥ `views-audit.mjs` +≈4 ∥ `nav.mjs` +1 ∥ `app.mjs` +2 ∥ i18n admin 两部件 +≈32/表 ∥ `style.css` +≈10）；
   档目：webui 31 ∥ 32 ⇒ **32 ∥ 33**（+1 档）；audit 型面 十二 ⇒ **十三型**（v14 重建）；`thincoder-server/package.json` ±0（`prepublishOnly` 42 ⇒ **44**——本批两件入链）；批内件两件（`-admin-agent-chat.test.mjs` ∥ `-admin-agent-chat-tools.test.mjs`）；
   机制全文 = `agent/ADMIN-AGENT.md` §11/§12 ∥ 端点 = `gateway/API.md` §2.8 ∥ 控制台面 = `webui/WEBUI.md` §2.10 ∥ 存储 = `store/STORE.md` §2 v14 段 ∥ 审计型 = `accounts/ACCOUNTS.md` §2.1。

  控制台布局收正批回填（2026-10-07——批 `docs/batches/2026-10-07-console-layout.md`；功能点 20 四件——五页视口高壳 ∥ 页脚行计数 ∥ 左对齐 ∥ 弹窗内列表表格化）：产品面实读——webui 八档：`app` **318**（`dataShell` :94 ∥ `SHELL_PAGES` 恰五路径 :255） ∥ `style` **215**（高度链 :191-200 ∥ 回退媒体查询 :203-205） ∥
  `views-admin` **185** ∥ `views-providers` **61** ∥ `views-models` **199** ∥ `views-audit` **94** ∥ `views-me` **125** ∥ `views-providers-modals` **287** ∥ i18n 两表 **334 ∥ 331**（+6 键/表）；`package.json` ±0（`prepublishOnly` 十七 ⇒ **十八件**）；零新档（public 档目 19 ∥ 20 不变）；
  批内件 `docs/batches/2026-10-07-console-layout.test.mjs`（腿 A–G——**8/8 绿**）；父侧门禁 **148/148**；随正五件（stub ctx 三 + 门禁计数二——父侧落）；估/实读差 = 该批 §5 披露（`app` ≈316/318 ∥ `style` ≈222/215 ∥ `views-admin` ≈189/185 ∥ `views-modals` ≈280/287）。
  配额分模型批回填（2026-10-07——批 `docs/batches/2026-10-07-quota-per-model.md`；台账 #992 + 并入 #990 ∥ #991 + 模型标识两字段）：产品面实读——后端/数据面（结构版本 **v5**）：store `db`（`DDL_V5` :95-144 + 两派生表） ∥
  metering 域（`usage` **171** ∥ `report` **170**——原址 re-export 保名面 ∥ `aggregates`（派生两表 + 对账重算） ∥ `quota`（三级检查 + 429 形） ∥ `routes`（键级合并端点；旧端点退役 404）） ∥ gateway `routes`（派发命中后/转发前；仅 chat） ∥
  ops `config`（`quotaTokens` 子字段） ∥ `cli`（`usage reconcile` + `member quota` 换形） ∥ accounts 三档（`keys` ∥ `members` ∥ `routes`——`modelQuotas` 随行）；前端/控制台面：`views-admin` 185 ⇒ **275** ∥ `views-models` 199 ⇒ **207** ∥ `app` 317 ⇒ **321** ∥
  `views-me` **122**（±0） ∥ i18n 两表 334 ⇒ **345** ∥ 330 ⇒ **341**（改值 1 ∥ +12 键 ∥ 退役 1） ∥ `style` 223 ⇒ **224**；`package.json` ±0（`prepublishOnly` 十八 ⇒ **十九件**）；零新档；批内件 `docs/batches/2026-10-07-quota-per-model.test.mjs` **446** 行（7 例）；
  父侧门禁 **155/155**；随正十四件（两舱 tmp → 父侧文件级搬入）；披露 = metering 域档职责/行数漂移（#983 在册） ∥ `-server-gateway-metering` 越限 +54（接受）。
  配额 v2 · 成员模型批回填（2026-10-07——批 `docs/batches/2026-10-07-quota-v2-member-models.md`；台账 #988 + 并入 #994 ∥ #995 ∥ #1001–#1004）：产品面实读——后端（结构版本 **v6**）：store `db` 202 ⇒ **209** ∥
  accounts（`members` 192 ⇒ **241** ∥ `keys` 102 ⇒ **109** ∥ `routes` 113 ⇒ **118** ∥ `routes-admin` 95 ⇒ **109**——`model-disables` 端点） ∥ metering（`aggregates` 141 ⇒ **173** ∥ `report` 169 ⇒ **168**） ∥ gateway `routes` 104 ⇒ **111**（禁用准入 + 清单滤除）；
  前端：i18n 门面 110 ⇒ **137**（复数取形） ∥ i18n 两表 345 ⇒ **345**（+2/−2） ∥ 341 ⇒ **348**（+2/−2 +7 `.one`） ∥ `views-admin` 275 ⇒ **331** ∥ `views-models` 207 ⇒ **216** ∥ `views-audit` 91 ⇒ **91**（卡内 h3 删）；
  `package.json` ±0（`prepublishOnly` 十九 ⇒ **二十件**）；零新档；批内件 416 ⇒ **745** 行（十二腿）；父侧门禁 **167/167**；随正七件（父侧搬入）；域档小计实读：webui **3269** ∥ accounts **897**（越估在册）；metering/API 聚合重算 = #983 域。
  模型元数据批回填（2026-10-07——批 `docs/batches/2026-10-07-provider-model-metadata.md`；台账 #1005 + 并入 #984）：产品面实读——store `db` **216**（v7 段：`model_meta_json`） ∥ gateway `providers` **177**（`modelMeta` 出参） ∥
  `provider-admin` **284**（`extractModelMeta` / `filterModelMeta`） ∥ webui `views-providers-modals` **365**（富信息六面 + 退役只提示 + 加载三态） ∥ i18n 两表 **350 ∥ 354**（+5 键/表）；`package.json` 26 行 ±0（`prepublishOnly` 二十 ⇒ **二十一件**）；
  零新档；批内件 `docs/batches/2026-10-07-provider-model-metadata.test.mjs` **497** 行（六腿）；父侧门禁 **173/173**；随正七件（父侧搬入——结构版本 pin 6 ⇒ 7 族 ∥ 件数 20 ⇒ 21 族 ∥ `hint error` 计数 15 ⇒ 17）；
  设计档回填（父侧笔）：`gateway/API.md` provider-admin ⇒ **284** ∥ `webui/WEBUI.md` 视图件 ⇒ **365**（小计 ⇒ 3345）。
  列式收正批回填（2026-10-07——批 `docs/batches/2026-10-07-provider-picks-columns.md`；台账 #1020 ∥ #1021；轻通道轮——笔 #1 候选表列式 ∥ 笔 #2 弹窗宽 clamp）：产品面实读——`views-providers-modals` **367**（`renderPicks` 五列：模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态；死键 `metaContext` 删 ∥ `metaVision` 转列头） ∥
  i18n zh **352** ∥ en **355**（+3 键 −1） ∥ `style` 弹窗宽单源 = `clamp(560px, 78vw, 1200px)`（零新变量——`:root` **38** 不变）；小计实读 **3350**（= public 19 档 3272 + 快照档 78）；批内件 **496** 行（原 506 越 500 硬限 ⇒ 压缩）；父侧门禁 22 件 **173/173**（三跑）；零新档。
  对照设计总账 ≈5237（= 闭式 ≈3247 + 控制台面预期 ≈840 + 完备化面预期 ≈518 + 多语言面预期 ≈632；实读差 −163 = 前账超出 +61 ∥ 控制台面回落 −124 ∥ 完备化面回落 −9 ∥ 多语言面回落 −92 ∥ package.json +1）。
自动更新批回填（2026-10-06）：**3308 行（35 档）**（+484 = ops 族 +484 ∥ package.json +0——详见 `ops/OPS.md` §6）。

- **板级**：`thincoder-server/package.json`（可发布形：`@thincoder/server`（拟） ∥ `files` 白名单 ∥ `bin` = `thincoder-server` ∥ engines `node>=24` ∥ `prepublishOnly` 门禁；`private` 撤；dependencies 空；实读 26 行（估 ≈30；含 `dev` 脚本行）；`prepublishOnly` 清单 30 ⇒ 31 ⇒ 32 ⇒ 33 ⇒ 34 ⇒ 35 ⇒ 36 ⇒ **38 件**
  （八 + #962/#963/i18n/#972 件 + 弹窗批件 + 后续各批 18 ⇒ 19 ⇒ 20 ⇒ 21 ⇒ 22 ⇒ 23 ⇒ 25 件——alias ∥ 代理页批件已入链；以当刻盘面实读为准：盘面实读 **36**（2026-10-10 现读——含 server-face-residues 件）⇒ 本批（server-small-fixes 两件入链）**+2 ⇒ 38** ⇒ server-exec-sandbox 批两件入链 **+2 ⇒ 40** ⇒ runner-admin-console 批两件入链 **+2 ⇒ 42**））。
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
| `docs/batches/2026-10-06-server-presets.md` ∥ `docs/batches/2026-10-06-server-presets.test.mjs`（已落盘） | 本批（provider 预设）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 349 行 |
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
| `docs/batches/2026-10-09-server-console-testkey-fix.md` ∥ `docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`（已落盘） ∥ `thincoder-server/package.json`（板级件——`prepublishOnly` 清单） | 本批（控制台测试 key 缺陷修复——详情弹窗两调用点 = 草稿 key）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） ∥ 清单添本批件（已落盘——本批 +1 件，28 ⇒ 29） | append ∥ 新建——实读 **201** 行 ∥ 全树 ±0（单行清单行数零变） |
| `docs/batches/2026-10-09-provider-default-model-purge.md` ∥ `docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`（已落盘） ∥ `thincoder-server/package.json`（板级件——`prepublishOnly` 清单） | 本批（provider 默认模型清除——服务端舱）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） ∥ 清单添本批件（已落盘——本批 +1 件，29 ⇒ 30） | append ∥ 新建——实读 **180** 行 ∥ 全树 ±0（单行清单行数零变） |
| `docs/batches/2026-10-10-server-exec-sandbox.md` ∥ `docs/batches/2026-10-10-server-exec-sandbox.test.mjs` ∥ `docs/batches/2026-10-10-server-exec-sandbox-runner.test.mjs` ∥ `thincoder-server/package.json`（板级件——`prepublishOnly` 清单） | 本批（server-exec-sandbox——沙盒设计轮）批档 §2 ∥ 批内件两件（服务面 ≈480 ∥ 执行面 ≈450——随批留存；均入 server 链） ∥ 清单添本批件（38 ⇒ **40**——两件入链） | append ∥ 新建（暂未落盘——设计轮） ∥ 全树 ±0（单行清单行数零变） |

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
- 注⑬（配置控制台批随正件 + 新批内件——2026-10-09 设计轮）：随正件 = ① 档目断言件十件（档目链 29 ∥ 30 ⇒ **30 ∥ 31**——名单添 `views-system-config.mjs`；断点以当刻盘面为准）：`-console-completeness-2` ∥ `-console-list-style` ∥ `-console-modals` ∥ `-console-provider-redo-runtime` ∥ `-console-providers` ∥ `-models-config` ∥
  `-server-gateway-webui-deploy` ∥ `-me-keys-redo-ui` ∥ `-provider-model-metadata` ∥ `-quota-v2-member-models`；② 门禁件数断言件七件（31 ⇒ **32**——注释同拍；断点以当刻盘面为准）：`-console-list-style` · `:237` ∥ `-server-auto-update` · `:480` ∥ `-console-layout` · `:449` ∥
  `-me-usage-charts` · `:225` ∥ `-provider-model-metadata` · `:493` ∥ `-quota-per-model` · `:444` ∥ `-quota-v2-member-models` · `:428`；
  ③ v10 读点（`-server-gateway` 等——以盘面为准）；`thincoder-server/package.json`（`prepublishOnly` **31** ⇒ **32**——本批件入链）；新批内件 = **一件**（`docs/batches/2026-10-09-server-console-config.test.mjs`——估 ≈450 行）；
  逐件行数（实读 2026-10-09 ⇒ 预期增量）：`-console-completeness-2` **504** ⇒ ≤±8 ∥ `-console-list-style` **240** ⇒ ≤±6 ∥ `-console-modals` **474** ⇒ ≤±6 ∥ `-console-provider-redo-runtime` **350** ⇒ ≤±6 ∥ `-console-providers` **479** ⇒ ≤±6 ∥
  `-models-config` **270** ⇒ ≤±6 ∥ `-server-gateway-webui-deploy` **322** ⇒ ≤±8 ∥ `-me-keys-redo-ui` **395** ⇒ ≤±6 ∥ `-provider-model-metadata` **494** ⇒ ≤±6 ∥ `-quota-v2-member-models` **741** ⇒ ≤±6 ∥
  `-console-layout` **495** ⇒ ≤±6 ∥ `-server-auto-update` **498** ⇒ ≤±2 ∥ `-me-usage-charts` **228** ⇒ ≤±2 ∥ `-quota-per-model` **447** ⇒ ≤±2 ∥ `-server-gateway` **495** ⇒ ≤±2；实施后回填核销。
- 注⑭（embed 解耦批随正件 + 新批内件——2026-10-09 设计轮）：随正件 = **十件断言件**（旧「引擎模型入清单 / 入页」断言面——反证清单；坐标以当刻盘面为准）：
  `-server-gateway` · `:259`/`:262`/`:317` ∥ `-server-gateway-chat` · `:479` ∥ `-server-gateway-model-ref` · `:10`/`:129-131` ∥ `-console-provider-redo-runtime` · `:275`/`:279` ∥
  `-console-providers` · `:200` ∥ `-models-config-ui` · `:227`/`:231`/`:338`/`:417-439` ∥ `-console-completeness-2` · `:422-424` ∥ `-console-modals` · `:327-328`/`:341`/`:357`/`:362` ∥
  `-provider-model-metadata` · `:220` ∥ `-quota-v2-member-models` · `:286-288`/`:678`/`:698`/`:706`；存疑件（断点以实读为界）= `-console-layout` · `:256`/`:275`（仅夹具）；
  门禁件数断言件七件（32 ⇒ **33**——注释同拍；断点以当刻盘面为准）：`-console-list-style` · `:237` ∥ `-server-auto-update` · `:480` ∥ `-console-layout` · `:449` ∥ `-me-usage-charts` · `:225` ∥ `-provider-model-metadata` · `:493` ∥ `-quota-per-model` · `:444` ∥ `-quota-v2-member-models` · `:428`；
  逐件行数（实读 2026-10-09 ⇒ 预期增量）：`-server-gateway` **495** ⇒ ≤±4 ∥ `-server-gateway-chat` **499** ⇒ ≤±4 ∥ `-server-gateway-model-ref` **194** ⇒ ≤±4 ∥ `-console-provider-redo-runtime` **350** ⇒ ≤±6 ∥ `-console-providers` **479** ⇒ ≤±6 ∥
  `-models-config-ui` **493** ⇒ ≤±8 ∥ `-console-completeness-2` **504** ⇒ ≤±8 ∥ `-console-modals` **474** ⇒ ≤±6 ∥ `-provider-model-metadata` **494** ⇒ ≤±6 ∥ `-quota-v2-member-models` **741** ⇒ ≤±6；
  `thincoder-server/package.json`（`prepublishOnly` **32** ⇒ **33**——本批件入链；单行清单行数零变）；新批内件 = **一件**（`docs/batches/2026-10-09-server-embedding-decouple.test.mjs`——估 ≈300 行）；实施后回填核销。
- 注⑮（server-model-alias 批随正件 + 旧件核 + 新批内件——2026-10-09 设计轮）：随正件 = 门禁件数断言件七件（**33 ⇒ 34**——注释同拍；断点以当刻盘面为准）：
  `-console-list-style` · `:237` ∥ `-server-auto-update` · `:480` ∥ `-console-layout` · `:449` ∥ `-me-usage-charts` · `:225` ∥ `-provider-model-metadata` · `:493` ∥ `-quota-per-model` · `:444` ∥ `-quota-v2-member-models` · `:428`；
  逐件行数（实读 2026-10-09 ⇒ 预期增量——断言文本就地收正 ⇒ 明写 ±0）：`-console-list-style` **240** ⇒ ±0 ∥ `-server-auto-update` **498** ⇒ ±0 ∥ `-console-layout` **495** ⇒ ±0 ∥ `-me-usage-charts` **228** ⇒ ±0 ∥
  `-provider-model-metadata` **494** ⇒ ±0 ∥ `-quota-per-model` **447** ⇒ ±0 ∥ `-quota-v2-member-models` **741** ⇒ ±0；
  旧断言件核（预计零——既有断言零别名配置：外标仍回落 `provider/model`；断点以实施实读为界）：清单/派发/前缀形族（`-server-gateway` ∥ `-server-gateway-chat` ∥ `-server-gateway-model-ref`）∥
  派生面族（`-console-modals` · `deriveModels` ∥ `-models-config-ui` ∥ `-server-embedding-decouple`）∥ 外标键族（`-quota-v2-member-models` ∥ `-quota-per-model` ∥ `-server-gateway-accounts`）；
  配置组数断言族（**必改**——G 组增入 ⇒ 六组/七枚：`-console-modals` · `:369` 字段枚数 6 ⇒ 7 ∥ `:359` 注释陈值「四组」同拍 ∥ `-models-config-ui` · `:303`「配置五组」⇒「六组」）；
  `thincoder-server/package.json`（`prepublishOnly` **33** ⇒ **34**——本批件入链；单行清单行数零变）；新批内件 = **一件**（`docs/batches/2026-10-09-server-model-alias.test.mjs`——估 ≈350 行）；实施后回填核销。
- 注⑯（console-proxy-page 批随正件 + 旧件核 + 新批内件——2026-10-09 设计轮）：随正件 = 档目断言件九件（`views-proxy.mjs` 入列表（档目 30 ∥ 31 ⇒ **31 ∥ 32**）；断点以当刻盘面为准）——
  `-console-completeness-2` ∥ `-console-list-style` ∥ `-console-modals` ∥ `-console-provider-redo-runtime` ∥ `-console-providers` ∥ `-models-config` ∥ `-server-gateway-webui-deploy` ∥ `-server-i18n` ∥ `-server-console-config` ∥
  nav 计数件三件（管理 7 ⇒ **8**）：`-console-providers` · `:405`（路径全量表） ∥ `-console-modals` · `:389` ∥ `-console-completeness-2` · `:470`；
  旧语义断言件（**必改**——配置控制台批 F1/F4 面）：`-server-console-config`——四写控件 ⇒ **三写控件**（`:641-649` 面） ∥ 提交体去 `proxyUri`（`:649` 断言文案） ∥ i18n 键清单去 `system.cfgProxyUri`/`system.cfgProxyUriPh`（`:748` 面） ∥ `useProxy` 改向断言改指「代理」页（`:761-762`）；
  门禁件数断言件七件（**+1 入链**——现值以当刻盘面为准：alias 批落地前 33 ⇒ 34 ∥ 落地后 34 ⇒ 35；注释同拍；断点以当刻盘面为准）：
  `-console-list-style` · `:237` ∥ `-server-auto-update` · `:480` ∥ `-console-layout` · `:449` ∥ `-me-usage-charts` · `:225` ∥ `-provider-model-metadata` · `:493` ∥ `-quota-per-model` · `:444` ∥ `-quota-v2-member-models` · `:428`；
  逐件行数：以实施当刻盘面实读为准（断言文本就地收正 ⇒ 明写 ±0——沿注⑮口径）；
  `thincoder-server/package.json`（`prepublishOnly` **+1 入链**——现值同基数；单行清单行数零变）；新批内件 = **一件**（`docs/batches/2026-10-09-console-proxy-page.test.mjs`——估 ≈300 行）；实施后回填核销（2026-10-09——批内件实读 **540** 行）。

- 注⑰（server-face-residues 批随正件 + 新批内件——2026-10-10 实施轮随正）：随正件 = 门禁件数断言件七件（35 ⇒ **36**——注释/测试名/断言消息同拍；断点以当刻盘面为准）：
  `-console-list-style` · `:21`/`:234`/`:236`/`:238` ∥ `-server-auto-update` · `:9`/`:439`/`:480` ∥ `-console-layout` · `:16`/`:447`/`:449` ∥ `-me-usage-charts` · `:12`/`:222`/`:225` ∥ `-provider-model-metadata` · `:18`/`:462`/`:489`/`:491` ∥
  `-quota-per-model` · `:19`/`:440`/`:442`/`:444` ∥ `-quota-v2-member-models` · `:24`/`:424`/`:426`/`:428`；逐件行数：以实施当刻盘面实读为准（断言文本就地收正 ⇒ 明写 ±0——沿注⑮口径）；
  文档链两处（`ops/OPS.md` §5.1 ∥ 本档 §6 板级行：链 35 ⇒ 36 + 组成式「后续各批 22 ⇒ 23 件」）；`thincoder-server/package.json`（`prepublishOnly` **35 ⇒ 36**——本批件入链；单行清单行数零变）；新批内件 = **一件**（`docs/batches/2026-10-10-server-face-residues.test.mjs`——估 ≈150 行）；实施后回填核销。

- 注⑱（server-exec-sandbox 批随正件 + 新批内件——2026-10-10 设计轮）：随正件（**父侧落——实施轮同拍；以当刻盘面为准**）= 档目断言件九件（`-console-completeness-2` ∥ `-console-list-style` ∥ `-console-modals` ∥ `-console-provider-redo-runtime` ∥
  `-console-providers` ∥ `-models-config` ∥ `-server-gateway-webui-deploy` ∥ `-server-i18n` ∥ `-server-console-config`——`views-sandbox*.mjs` 入列表 ∥ 档目 30 ∥ 31 ⇒ **33 ∥ 34**（+3——含 `views-me-sandbox.mjs`））+ nav 计数件三件（管理 7 ⇒ **8**；**我的 3 ⇒ 4**）+
  审计型面件（`views-audit` ∥ i18n 键数——十二型）+ 门禁件数断言件七件（38 ⇒ **40**；注释同拍）∥ `thincoder-server/package.json`（`prepublishOnly` 38 ⇒ **40**——本批两件入链；单行清单行数零变）；
  新批内件 = **两件**（服务面 ≈480 ∥ 执行面 ≈450）；实施后回填核销。

## 7. 验收对照（需求 §2 验收表 → 判据域档）

| 需求 AC | 判据（机检面）所在 | 载体 |
|---|---|---|
| AC-1（功能点 1） | `accounts/ACCOUNTS.md` 验收判据（key 面：401 三态 + 有效 key 完成请求） | 批内件 |
| AC-2（功能点 2） | `gateway/API.md` 验收判据（SSE 逐块 ∥ 帧字节一致 ∥ `[DONE]` 透传；四端任一实跑 = 收口轮） | 批内件 + 收口轮 |
| AC-3（功能点 3） | `metering/METERING.md` 验收判据（usage 行落库 ∥ token 与上游逐值相等） | 批内件 |
| AC-4（功能点 4） | `metering/METERING.md` 验收判据（超额 429 + 可读提示 ∥ 额内放行） | 批内件 |
| AC-5（功能点 5） | `accounts/ACCOUNTS.md` 验收判据（吊销后下一次请求即 401——无缓存路径） | 批内件 |
| AC-6（功能点 6） | `gateway/API.md` 验收判据（引擎命中 + 响应透传维度/条数不变 + 记账；**缺 `embedding` 段 ⇒ 服务照起 ∥ `/v1/embeddings` 404 `model_not_found` 消息明示 ∥ 引擎模型不入 `/v1/models`**——2026-10-09 embed 解耦批）+ `ops/OPS.md` §7 AC-6 行（载入容缺 ∥ 创建流） | 批内件 |
| AC-7（功能点 7——B 案） | `accounts/ACCOUNTS.md` 验收判据（七判据：登录 ∥ 未登录拒 ∥ 越权拒 ∥ 改密 ∥ 重置 ∥ 轮换 ∥ 引导幂等） | 批内件 |
| AC-8（功能点 8——分发与部署） | `ops/OPS.md` §7 判据（`npm pack --dry-run` 通过——`files` 白名单齐 ∥ 零 install 步；`docker build` 成功 + compose 起停通；systemd unit 安放可启） | 收口轮（真机；发布动作 = 发布面轮） |
| 功能点 8（分发与部署——npm 全局装启动链；缺陷 #1113） | `ops/OPS.md` §7 判据（经符号链接（bin 垫片形 ∥ 目录连接形）调用入口 ⇒ 不静默——进入正常输出/错误路径；普通调用不回归） | 批内件（`docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`——已落盘 112 行） |
| AC-9（功能点 9——provider 预设；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `ops/OPS.md` §7 判据（预设展开 ∥ 未知预设拒启 ∥ `name` 缺省 ∥ 覆盖语义 ∥ 漂移件） | 批内件 |
| AC-10（功能点 10——自动更新；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `ops/OPS.md` §7 判据（自检 ∥ 档位 ∥ 自升 ∥ 版本可见性 ∥ 容器收敛——机制全文 = `ops/OPS.md` §5.4） | 批内件 + 收口轮 |
| AC-11（功能点 11——控制台 provider/模型管理；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `gateway/API.md` §5 判据（CRUD 三态 ∥ 保存即热生效 ∥ 密钥掩码/日志零明文 ∥ 发现与降级）+ `ops/OPS.md` §7 种子行 + `webui/WEBUI.md` §6 控制台行 | 批内件 |
| AC-12（功能点 14——控制台 IA；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（`nav.mjs` 直测：组/项 ∥ 重定向 ∥ 角色默认 ∥ denied；静态档目随正（二轮后 15/16 ⇒ 弹窗批后 17/18 ⇒ provider 重做批后 18/19 ⇒ 配置面批后 **19 ∥ 20** ⇒ 结构轮后 **29 ∥ 30** ⇒ 配置控制台批后 **30 ∥ 31** ⇒ 代理页批后 **31 ∥ 32** ⇒ 代理回迁批后 **30 ∥ 31**） ∥ 拆分） | 批内件 |
| AC-13（功能点 12——首版完备化六项；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `gateway/API.md` §5 ∥ ② `accounts/ACCOUNTS.md` §5 ∥ ③④ `webui/WEBUI.md` §6 ∥ ⑤ `ops/OPS.md` §7 ∥ ⑥ `metering/METERING.md` §4 | 批内件 + 收口轮 |
| AC-14（功能点 13——控制台多语言；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（检测矩阵 ∥ 两表键集对齐 ∥ 键引用闭合 ∥ 错误码映射 ∥ 档目/静态直发随正） | 批内件 + 收口轮 |
| AC-15（功能点 15——控制台可见面六面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `gateway/API.md` §5 + `webui/WEBUI.md` §6（含缺段「未配置」态——2026-10-09 embed 解耦批） ∥ ② `metering/METERING.md` §4 + `webui/WEBUI.md` §6 ∥ ③ `gateway/API.md` §5 + `webui/WEBUI.md` §6 ∥ ④ `accounts/ACCOUNTS.md` §5 + `store/STORE.md` §3 ∥ ⑤ `webui/WEBUI.md` §6 ∥ ⑥ `metering/METERING.md` §4 + `webui/WEBUI.md` §6 | 批内件 + 收口轮 |
| AC-16（功能点 16——控制台弹窗交互；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（`modal.mjs` 在册 ∥ 成员三态弹窗 ∥ 一次性秘密不破 ∥ 静态档目 17/18 ⇒ 18/19（provider 重做批后）⇒ 配置面批后 **19 ∥ 20** ⇒ 结构轮后 **29 ∥ 30** ⇒ 配置控制台批后 **30 ∥ 31** ⇒ 代理页批后 **31 ∥ 32** ⇒ 代理回迁批后 **30 ∥ 31**） | 批内件 + 收口轮 |
| AC-17（功能点 17——服务模型页 ∥ 配置面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 判据（列表同源——嵌入模型行退场（2026-10-09 embed 解耦批） ∥ 详情/配置五组（A/C/D/E/F——F 判据 = AC-21 行） ∥ 停用流（含退役可停 ∥ 与 Provider 页单源协同） ∥ 限流 429 形 ∥ admin 面）+ `gateway/API.md` §5 判据（限流面机检） | 批内件 + 收口轮 |
| AC-18（功能点 18——Provider 管理面重做；已落需求档） | `webui/WEBUI.md` §6 判据（nav 值「Provider」 ∥ 列表 + 双弹窗 ∥ 零内联面 ∥ 候选 = 上游发现（零手填） ∥ 勾选保存 ⇒ PATCH `models` ⇒ `/v1/models` 随动 ∥ 退役项只读注 ∥ 测试同窗（key = 草稿口径——未保存 key；2026-10-09 修复批）；档目 18/19 ⇒ 配置面批后 **19 ∥ 20** ⇒ 结构轮后 **29 ∥ 30** ⇒ 配置控制台批后 **30 ∥ 31** ⇒ 代理页批后 **31 ∥ 32** ⇒ 代理回迁批后 **30 ∥ 31**） | 批内件 + 收口轮 |
| AC-19（功能点 19——样式族总体统一；已落需求档） | `webui/WEBUI.md` §6 判据（§2.5 散置清单 ∥ 变量单源 ∥ 族值表 + 逐族套用表 ①–⑩（含 #87/#88 接续） ∥ 可点行判据 ∥ 空/错/加载态；视觉收口轮实走） | 批内件 + 收口轮 |
| AC-20（功能点 20——控制台布局收正；已落需求档） | `webui/WEBUI.md` §6 判据（五页视口高壳（页头固定 ∥ 表头吸附 ∥ 行区滚动 ∥ 表尾行计数）∥ 内容左对齐 ∥ 弹窗内列表表格化（Provider 模型 ∥ 成员 key）∥ 矮视口回退整页滚；浏览器实走 = 收口轮） | 批内件 + 收口轮 |
| AC-21（功能点 21——配额分模型；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分三面判据：`metering/METERING.md` §4 AC-21 行（三级 ∥ 计数点查 ∥ 零 SQL 短路 ∥ 自然月窗口 ∥ 429 形）∥ `gateway/API.md` §5 AC-21 行（检查点 = 派发命中后/转发前机检）∥ `webui/WEBUI.md` §6 AC-21 行（F 组 ∥ 分模型覆盖面） | 批内件 + 收口轮（浏览器实走） |
| AC-22（功能点 22——模型标识两字段；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `metering/METERING.md` §4 AC-22 行（两字段记账/计数 ∥ 列直操作聚合 ∥ 迁移拆分回填逐值 ∥ 对外契约不变）+ `store/STORE.md` §3 v5 段判据（拆列抽样逐值 ∥ 两表回填逐值） | 批内件 |
| AC-23（功能点 23——成员模型面 v2；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-23 两行（查看态模型表直显 ∥ 服务模型页配额列 ∥ 禁用勾选即时写）+ `accounts/ACCOUNTS.md` §5 AC-23 行（写/读面）+ `gateway/API.md` §5（禁用执行面） | 批内件 + 收口轮（浏览器实走） |
| AC-24（功能点 24——上游模型元数据；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-24 两行（列式五列 ∥ 退役只提示 ∥ 加载态）+ `gateway/API.md` §5（留存写入面） | 批内件 + 收口轮（浏览器实走） |
| AC-25（功能点 25——「我的·key 与签发」页重做；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-25 两行（页面六列 ∥ 双弹窗 ∥ 复制钮 ∥ 接入卡成员面 ∥ 非壳；机检口径）+ `accounts/ACCOUNTS.md` §5 AC-25 行（端点/命名/上限/404/审计）+ `store/STORE.md` §3 v8 段（回填判据） | 批内件 + 收口轮（浏览器实走） |
| AC-26（功能点 26——「我的·用量」页图表化；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-26 两行（页形 ∥ 零依赖 ∥ 数据面 ∥ 壳面 ∥ i18n ∥ 空错态 ∥ 导出判否；机检口径）+ `metering/METERING.md` §4 AC-26 行（端点契约 ∥ 判权 = 本人 ∥ 逐值/零填充） | 批内件 + 收口轮（浏览器实走） |
| AC-27（功能点 27——上游出口代理；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `gateway/API.md` §5 判据（判定与同判定（chat ∥ 发现） ∥ loopback 旁路 ∥ 假代理命中 ∥ SSE 逐块 ∥ 502 ∥ 字段往返 ∥ v9 幂等）+ `ops/OPS.md` §7 判据（启动两 warn ∥ 配置面校验）+ `webui/WEBUI.md` §6 AC-18 行（两窗勾选） | 批内件 + 收口轮（浏览器实走） |
| AC-28（功能点 28——server 配置控制台；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `webui/WEBUI.md` §6 AC-28 两行（配置项全量 ∥ 掩码 ∥ 保存往返 ∥ 重启生效 ∥ 探活草稿 ∥ 审计 ∥ 文案改向 ∥ 缺段创建）+ `gateway/API.md` §5 AC-28 行（写路径机检）+ `ops/OPS.md` §7 AC-28 行 + §8 KD-SV-56/57；代理回迁批：`proxy.uri` 承载回迁服务配置卡（§2.7）——第四写控件 ∥ 连通测试块（文案改向句改指——AC-30 行同拍） | 批内件 + 收口轮（浏览器实走） |
| AC-29（功能点 29——服务模型别名；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分五面判据：`gateway/API.md` §5 AC-29 行（① 配置形两形/非法 400·拒启 ∥ ② 对外别名生效（清单/请求命中/旧名 404） ∥ ③ 唯一性（撞别名拒 ∥ 形上不相交））∥ `metering/METERING.md` §4 AC-29④ 行（记账外标 = 别名 ∥ 过滤反查 ∥ 键随动）∥ `accounts/ACCOUNTS.md` §5 AC-29④ 行（配额/禁用键 = 外标形）∥ `webui/WEBUI.md` §6 AC-29① 行（G · 别名组 ∥ 列表外标）∥ `ops/OPS.md` §7 AC-29①③ 行（配置/种子面：两形 ∥ 校验 ∥ 拒启）∥ `store/STORE.md` §2 v2 段（条目两形——零迁移） ∥ ⑤ 嵌入面零涉（设计句 = `gateway/API.md` §6 KD-SV-59 ∥ §8 不做项「嵌入面别名」；回归面 = 嵌入面判据零动——批内件断言） | 批内件 + 收口轮（浏览器实走） |
| AC-30（功能点 30——代理设置与连通测试（服务配置卡内）+ 旧链重定向；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分三面判据：① 承载 = `webui/WEBUI.md` §6 AC-30 行（服务配置卡 = 四写控件 + 连通测试块 ∥ `views-proxy.mjs` 不在盘（档目 30 ∥ 31）∥ nav 管理 7 ∥ 旧链 `#/admin/proxy` ⇒ `#/admin/system`）+ `gateway/API.md` §5（白名单零变——`CONFIG_WRITABLE_KEYS` 导出直测） ∥ ② 测试功能 = `gateway/API.md` §5 AC-30 行 + §7 用例（N36/B26/E27）+ `webui/WEBUI.md` §6 AC-30 续行（真打读数 ∥ 就地错态 ∥ 零落库零计费） ∥ ③ 语义零变 = `ops/OPS.md` §1 写面句 + 保存往返/重启生效 + Provider 勾选零回归 + `proxy.mjs` 零触（KD-SV-55 不变） | 批内件 + 收口轮（浏览器实走） |
| 管理面 agent 会话面（admin-agent-chat 批——台账 #1254；需求 §5「两个 chat 界面」②④；编号随需求档——建议 **AC-37**） | 分面判据：机制面 = `agent/ADMIN-AGENT.md` §7 聊天式行 ∥ §8（N54/N55 ∥ B48/B49 ∥ E40/E41——端到端：假模型 + 假工具：帧序/落库/重放/在途门/重启收尾/逐调用审计）∥ 端点面 = `gateway/API.md` §2.8（四端点三态码 ∥ NDJSON 帧形逐帧 ∥ 流前信封/流中 `end` 帧分界）∥ 控制台面 = `webui/WEBUI.md` §6 管理面 agent 会话页行（页在册 ∥ 流读取 ∥ 四形渲染 ∥ 两表键族）∥ 存储面 = `store/STORE.md` §3 v14 段（空库直落 14 ∥ v13 升后 14 ∥ 幂等 ∥ 两表 + 索引在场 ∥ `agent_event` 型可写）∥ 审计面 = `accounts/ACCOUNTS.md` §2.1 `agent_event` 行 + §7 用例；工具面 = §12 逐件回指（members/providers/models/usage/audit/runners/docker） | 批内件 + 收口轮（浏览器实走） |
| AC-36（沙盒 · server-exec-sandbox 批——台账 #1224；需求 §5 沙盒块 + 14:00 裁定 + 14:08 必交面行；**AC-36 = 已落需求档**（2026-10-10 沙盒批回笔）；**分两轮落**：运行面（runner-admin-console 批）∥ 余面） | 分面判据：`sandbox/SANDBOX.md` §11 判据行（出站两类型/两闸/显式 deny 先/通配 ∥ 待批三态 ∥ 凭据 ∥ 必交面六面 + 每配置项有 UI 写入口）∥ §12 用例 ∥ `gateway/API.md` §2.5（端点面机检——节点登记/工作区/规则/待批）∥ `webui/WEBUI.md` §6 沙盒行（控制台机检）∥ `store/STORE.md` §3 v11 段（迁移判据）；执行面判据随重做批重建；**最小切片（runner-admin-console 批——台账 #1252）**：`sandbox/SANDBOX.md` §11 最小切片行 ∥ §3 ∥ §12（N40 ∥ N46–N48 ∥ B41–B43 ∥ E34–E36）∥ `gateway/API.md` §2.5 前七行 ∥ `webui/WEBUI.md` §2.8① ∥ `store/STORE.md` §2 v12 段/§3 v12 + 真机（10.0.0.6）；**托管接入（runner-admin-console 批增补——#1236/#1237）**：`sandbox/SANDBOX.md` §11 托管接入行 ∥ §12（N49–N52 ∥ B44–B46 ∥ E37/E38）∥ `agent/ADMIN-AGENT.md` §7 ∥ `gateway/API.md` §2.5 托管接入四行 ∥ `store/STORE.md` §2 v13 段/§3 v13 + 真机（无 Docker 机：只给地址+凭据 ⇒ 「已就绪」） | 批内件 + 收口轮（浏览器实走 + 真机） |
| AC-31（功能点 31——三端登录与接入；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 分两面判据：① 服务面 = `client/CLIENT.md` §4（login 三态 ∥ token 兼用 /v1 ∥ logout 即吊销——§6 用例 N37/B27/E28/N39）∥ ② 端侧面 = `docs/core/design/TEAM.md` §5（三端入口 ∥ token 落本地 ∥ 派生 provider ∥ 未登录态 ∥ 退出关闭） | 批内件 + 收口轮（三端实走） |
| 非功能 · 零第三方运行期依赖 | 本档 §1 ∥ §2.3 ∥ §5 KD-SV-2 / KD-SV-78（口径与范围）；import 扫描断言 = 批内件 | 批内件 |
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
| R40 | **me-keys 批（本批）——随正件与滞账**：① 旧批测试随正（删 `.key-item` 类 ⇒ 四件断点：`2026-10-06-console-list-style.test.mjs` ∥ `2026-10-07-console-layout.test.mjs` ∥ `2026-10-07-quota-v2-member-models.test.mjs`（`:744` 悬停清单；复数直测 `:526`/`:545` 期望文本随正——同件双面） ∥ `2026-10-07-provider-model-metadata.test.mjs`；值改 `me.keys.lastUsed`/`windowTokens`（列内形） ⇒ `2026-10-06-console-completeness-2.test.mjs`（键在场——应不破，实读为界）；门禁件数随正（`prepublishOnly` 22 ⇒ 23——添本批件） ⇒ 六档：`2026-10-06-console-list-style.test.mjs` ∥ `2026-10-06-server-auto-update.test.mjs` ∥ `2026-10-07-console-layout.test.mjs` ∥ `2026-10-07-provider-model-metadata.test.mjs` ∥ `2026-10-07-quota-per-model.test.mjs` ∥ `2026-10-07-quota-v2-member-models.test.mjs`（件数断言/注释同拍））——父侧落地（实施轮同拍；行数注 = §6 注⑩）∥ ② 滞账登记：§4 索引 42–46 与 §7 AC-23/AC-24 行（前两批漏登）已随本批补齐；2026-10-07 各批 §6 总账行（布局/配额/配额 v2/元数据/列式）**已补（2026-10-10 本批——五行在 §6）** ∥ ③ 上抛（设计轮裁——供复核）：轮换页面下架（端点保留）∥ 名称上限 40 字符 ∥ 自助上限 20 把（CLI 免）∥ 名称不进 admin 面 key 表 ∥ 页面非壳（钉表五页不扩）∥ 词汇口径：本页新文案取需求 §2:25③ 字面（「API Key」——定音在案：用户 2026-10-07 16:41/16:43 取 B，批档 §1.3 术语门）；既有四面（nav/管理/审计/接入卡）原用「key」⇒ **统一已办（2026-10-10 本批——台账 #1025；`webui/WEBUI.md` §2.2 词汇口径条已落统一现状句；指针同 ②）** ∥ 需求边界句「接入卡源不动」读法 = **已裁**（需求档 2026-10-07 回笔：接入卡 = 同源构件复用——导出/变体参数允许；admin 面渲染/措辞零改；在案 = `requirements/PROJECT.md` §2:25 ∥ 本档变更记录；上抛记录 = 批档 §2.8） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R41 | **me 用量图表化批（本批）——需求档回笔 + 随正件 + 披露**：① 需求档回笔（主 agent 笔——随本批评审/收口）：§2 增功能点 26 + AC-26 行（设计侧候补已在——`webui/WEBUI.md` §6 ∥ `metering/METERING.md` §4）∥ ② 随正件（父侧落讫——回填轮实读收正；行数注 = §6 注⑪）：六件断言件（`-console-layout` ∥ `-console-list-style` ④ 面 ∥ `-server-auto-update` ∥ `-provider-model-metadata` ∥ `-quota-per-model` ∥ `-quota-v2-member-models`——门禁件数 24 ⇒ **26**）+ `-console-layout` me 页两处断点（路由桩补 `/api/me/usage/summary` ∥ 页头断言改点〔`me.usage.summary` 键退役〕）+ `thincoder-server/package.json`（`prepublishOnly` 24 ⇒ **26**——本批两件入链）∥ ③ 披露（不阻塞）：壳面五页钉表维持——报表卡不承缩 + 上限自滚（明细卡恒得剩余高）+ 明细承缩（高度链 +2 行在册）；如偏好参考图式自由滚动页 ⇒ 需求 §2:20 改判另轮 ∥ ④ 三档翻案已随正（`metering/METERING.md` §8 ∥ `webui/WEBUI.md` §8/§7 KD-SV-29 否决栏——改判 = KD-SV-49） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R42 | **结构轮（本批）——上抛 + 随正件 + 需求档回笔**：① 上抛（用户批准面——`webui/WEBUI.md` §7 KD-SV-51/52）：i18n 拆表形态（四部件 + 门面 = 拟案；备选 = 两/三拆）∥ `app.mjs` 拆否（拟 = 拆三档；备选 = 不拆——越线续存）∥ 余两越线档（`views-admin` ∥ `views-providers-modals`——预案标「触发 = 结构轮（#993/#976 同族）」）是否随轮 ∥ 新档命名（`dom.mjs` 等） ∥ ② 需求档回笔（主 agent 笔——随本批评审/收口）：`requirements/PROJECT.md` AC-12 `:147` ∥ AC-14 `:149` 档目链（19 ∥ 20 ⇒ **29 ∥ 30**；若裁不拆 app ⇒ 27 ∥ 28） ∥ AC-14 CJK 措辞随回笔同拍（「i18n 三档 CJK 口径（zh 表 = 唯一 CJK 档）」⇒ 族式「zh 族」 ∥ 「三新档静态直发」⇒「十新档」——与设计侧 AC-14 行字面同拍） ∥ ③ 随正件（父侧落讫——实施轮同拍；行数注 = 注⑫）：**十六件**断言件 + `thincoder-server/package.json`（`prepublishOnly` 26 ⇒ 27） ∥ ④ 域外发现（报告——非本批面）：`docs/core/design/API-CONTRACT.md:2626` `HEALTH_POLL_MS` 坐标陈旧（载 `thincoder-server/public/app.mjs:111`，实读 `:140`）——拆后符号迁 `health.mjs`；生成区重刷 = `api-contract --write`（工具面 ∥ 另轮） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R43 | **bin 入口 guard 修复批（本批）——回笔建议 + 部署收尾 + 同族记录**：① 需求档回笔建议（主 agent 笔）：AC-8 判据现未覆盖「npm 全局装（POSIX 符号链接垫片）装后起服可跑」——本缺陷即从此缝漏出；建议补一条（判据 = 经垫片调用 ⇒ 服务真启动；载体 = 批内件 ∥ 收口轮）∥ ② 部署侧收尾（父侧执行——ECS）：镜像重建（含修复）+ compose `entrypoint:` 覆盖件移除（现为绕行——修复落地后执行）∥ ③ 同族记录（本批不修——范围外；清单 = 批档 §2）：`thincoder-server/deploy/backup.mjs:84` ∥ `thincoder-server/deploy/converge.mjs:194` ∥ `thincoder-server/src/ops/cli.mjs:216`（同判据形）+ `bench/preflight.mjs:115` ∥ `bench/probe.mjs:307` ∥ `bench/run.mjs:304` ∥ `bench/toolcall.mjs:259` ∥ `scripts/api-contract.mjs:129` + 五处 `resolve()` 变体：`scripts/dev-link.mjs:171` ∥ `scripts/doc-check.mjs:123` ∥ `thincoder-cli/scripts/doc-impact.mjs:144` ∥ `thincoder-desktop/scripts/make-icon.mjs:170` ∥ `thincoder-desktop/scripts/materialize-deps.mjs:142`——择批处置 | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R44 | **控制台测试 key 修复批（本批）——需求档回笔（已办）+ 部署收尾 + 随正件**：① 需求档回笔（**已办**——2026-10-09；主 agent 笔）：功能点 18③ / AC-18 行补「测试连接 ∥ 刷新候选 key = 草稿口径（未保存 key）」判据句——回笔在盘 = `docs/server/requirements/PROJECT.md:265`（变更记录在册：§2:18 草稿口径句 ∥ `:77` 口径句 ∥ `:157` AC-18 判据句；设计侧行已随正——`webui/WEBUI.md` §6 AC-18 行）∥ ② 部署侧收尾（父侧执行——ECS）：镜像重建（含修复）+ 重收敛 + 用户复测原流程（§1 在册——`public/**` 在镜像内）∥ ③ 随正件（父侧**已落**——2026-10-09 实施轮同拍；断点/行数注 = §6 本批预算行）：门禁件数断言七件 N ⇒ N+1——注释同拍（N 以实施当刻盘面实读为准；现值实读 = 29 ⇒ 30）+ 文档链随正（`ops/OPS.md` §5.1 ∥ 本档 §6 板级行：29 ⇒ 30 件） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R45 | **server 代理批（本批）——需求档回笔 + 跨批件 + 文案面**：① 需求档回笔（主 agent 笔）：`docs/server/requirements/PROJECT.md` §2:9 计数「起步 20 家」⇒ **21 家**（+ `gemini-openai`）+ 新增**功能点 27（server 上游代理——逐渠 `proxy` 旗）** + AC 行（判据 = `gateway/API.md` §5 代理行）+ 变更记录 ∥ `docs/core/requirements/PROJECT.md` C3 计数 24 ⇒ **25** ∥ ② 跨批件（父侧落——机械）：`docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs` 四处 `20 ⇒ 21`（行号以当刻盘面为准）∥ ③ 产品文案面（三端 README 计数随实施轮——`thincoder-cli/README.md`「twenty-four providers」⇒ 25 ∥ `thincoder-vscode/README.md`「24 provider presets」⇒ 25 ∥ 枚举随正；server README 同批已含） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R46 | **配置控制台批（本批）——需求档回笔 + 随正件 + 披露 + 部署收尾**：① 需求档回笔（主 agent 笔——随本批评审/收口）：`docs/server/requirements/PROJECT.md` §2 增**功能点 28（server 配置控制台——草案句 = 批档 §2：全部配置项可视/可写 ∥ 只读三件例外显式 ∥ 重启生效标注 ∥ 密钥面 ∥ 草稿探活 ∥ 审计 ∥ 文案改向）** + AC-28 行（判据 = `webui/WEBUI.md` §6 ∥ `gateway/API.md` §5 ∥ `ops/OPS.md` §7）+ 标题计数 二十七条 ⇒ **二十八条** + 变更记录 ∥ AC-15① 微调建议（向量卡 = 配置面（可编辑）+ 草稿探活替代「配置真值行」读法）∥ ② 随正件（父侧落——实施轮同拍）：档目断言件十件（名单 = 结构轮注⑫①——列表 + `views-system-config.mjs`）∥ 门禁件数断言件（31 ⇒ 32——名单以实施当刻盘面为准）∥ v10 读点（`-server-gateway` 等——以盘面为准；行数注 = §6 注⑬）∥ ③ 披露：#1123 复核 = 盘面十行零「拟新增」残留（`dom.mjs`/`health.mjs`/i18n 八部件实读在场——逐行 = `webui/WEBUI.md` §5；翻正动作 = 无）∥ `GET /api/admin/embedding` UI 消费者退场（配置面读取改经 `/api/admin/config`——端点契约零动、零退役；是否收敛 = 另议）∥ 生效口径 = 统一「重启生效」（若要求热生效 = 翻案点——呈请）∥ ④ 部署收尾（父侧执行——ECS）：镜像重建 + 挂载形迁移（config 目录级——逐条 = 批档 §2 修复轮块） + 重收敛 + 浏览器实走（服务配置卡 + 向量卡编辑） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R47 | **embed 解耦批（本批）——需求档回笔 + 随正件 + 披露**：① 需求档回笔（主 agent 笔——随本批评审/收口）：`docs/server/requirements/PROJECT.md` 功能点 6 补「嵌入配置可缺 + 禁用语义 + 嵌入模型不入通用清单」句 ∥ 功能点 15① 补向量卡「未配置」态 ∥ 功能点 17 补「嵌入引擎模型不入本清单」 ∥ 功能点 21② 删「嵌入行 = —」（退场） ∥ AC-6 / AC-15① / AC-28 判据句随补（**编号零增——均 = 收正既有条目**）+ 变更记录 ∥ ② 随正件（父侧落——实施轮同拍）：十件断言件（旧「引擎模型入清单/入页」断言面——清单 = §6 注⑭）+ `thincoder-server/package.json`（`prepublishOnly` 32 ⇒ 33——本批件入链）∥ ③ 披露（不阻塞）：`/api/system.embedding.model` 保留下发（用户面提示条——非「模型列表」面）∥ `GET /api/admin/embedding` 端点在册（UI 消费者已退场——契约零动）∥ 控制台删除/清空 `embedding` 段不做（缺段 = 编辑配置文件）∥ 本批落修（一致性面——登记）：§7 AC-27/AC-28 两行滞账补齐（前两批漏登——沿 R40② 先例）∥ ④ 部署收尾（父侧执行——ECS）：镜像重建 + 重收敛 + 可选 `/v1/models` 实走核对（模型清单零引擎行） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R48 | **server-model-alias 批（本批）——需求档回笔 + 随正件 + 披露**：① 需求档回笔（**已办**——2026-10-09；主 agent 笔）：`docs/server/requirements/PROJECT.md` 边界行 `:216`（当刻盘面）已删「模型别名」（现文 = 「v1 不做**模型路由**（已降级为后续可选）；」）；变更记录在册（`:300`——§4 不做项行逐字替换）；AC-29 编号零增（本批已落 `:194`） ∥ ② 随正件（父侧落——实施轮同拍，**以当刻盘面实读为准**）：门禁件数断言 N ⇒ N+1（现值 33 ⇒ 34——七件注释同拍）+ `thincoder-server/package.json`（`prepublishOnly` 33 ⇒ 34——本批件入链）+ 旧断言件核（预计零——既有断言无别名配置：外标仍回落 `provider/model`；清单 = §6 注⑮） ∥ ③ 披露（不阻塞）：别名与成员键互为外标（改别名 ⇒ 旧形键 = 离表键保留、不生效——无历史/迁移）∥ 停用/重开两径换外标（停用 = `models` 减项离表 ∥ 重开 = Provider 页勾选按字符串形重建——别名不再存在 ⇒ 旧别名请求 404 `model_not_found`；如需保留 = 另轮）∥ CLI `usage reconcile` 读数 = 内部真名（运维面）∥ #967 残 nuance 已落 `ops/OPS.md` §1 + `README.md` 一行 ∥ #1010（撤销面 ∥ displayName 源 ∥ 富项分列）∥ #1152（判据改指运行时 accessor）∥ #1151（向量卡「用法」行随段显隐）——四并入项落修均在册 ∥ ④ 版本面：零迁移（结构版本保持 v10——`store/STORE.md` §3） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R49 | **console-proxy-page 批（本批）——需求档回笔 + 随正件 + 披露**：① 需求档回笔（主 agent 笔——随本批评审/收口）：`docs/server/requirements/PROJECT.md` AC-28 行文案改向句改指（「系统 → 服务配置」⇒「代理」页——`:193` 当刻盘面）∥ 页数/项数链随正（§2:13 侧栏「十页」⇒**十一页** `:52` ∥ §2:14 管理「七页」⇒**八页** `:57` ∥ AC-12 行「管理 7」⇒ **8** `:172`）∥ ② 随正件（父侧落——实施轮同拍，**以当刻盘面实读为准**）：档目断言件九件（`-console-completeness-2` ∥ `-console-list-style` ∥ `-console-modals` ∥ `-console-provider-redo-runtime` ∥ `-console-providers` ∥ `-models-config` ∥ `-server-gateway-webui-deploy` ∥ `-server-i18n` ∥ `-server-console-config`——`views-proxy.mjs` 入列表）+ nav 计数件三件（管理 7 ⇒ 8）+ 配置批 F1/F4 断言件（`-server-console-config`——四写控件 ⇒ 三写控件 ∥ 提交体去 `proxyUri` ∥ 键清单去 2 键 ∥ `useProxy` 改向断言改指）+ 门禁件数断言 N ⇒ N+1（现值 33——在途批入链先后影响绝对值）+ `thincoder-server/package.json`（`prepublishOnly` 同基数）∥ ③ 披露（不阻塞）：测试 uri = **表单明传（所见即所测——草稿先验，KD-SV-54/57 同源）**；如裁「必须打运行配置值」⇒ 翻案点（保存→重启→测试链）∥ 重定向两径差（直连径 fetch 缺省跟随 ∥ 经代理径单请求不跟随（3xx 原样回读））——生产同链同行为，不改传输 ∥ `proxy.mjs` 零触（KD-SV-55 传输语义不变） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R50 | **team-login-client-access 批（B1——本批）——需求读法披露 + 随正件 + 部署收尾**：① 披露（需求读法——供复核）：§2:31①「复用既有账号/密码散列与会话机制」本设计读法 = 复用散列校验 + 登录守卫 + token 签发（**`sessions` 表不用**——浏览器 cookie 面专属；客户端 token 落 `api_keys`，理由 = token 须兼作 /v1 凭据 ∥ 无过期 ∥ 记账归因——KD-SV-61）；如用户本意 = 复用 `sessions` 表 ⇒ 翻案点（与「不设过期」「模型可用」两条相抵面需重裁）∥ ② 披露（存储面）：token 明文落 `~/.thincoder/config.json`（0600 先例——沿 provider apiKey 口径；keychain 不用）；登录 token 在控制台「我的 · key」页自然可见（不设区分列——如需标记 ⇒ 另轮）∥ ③ 披露（能力面）：CLI 密码隐藏回显 = 新建能力（非 TTY 回落 stdin 行读——脚本化直登径）；端标签自动生成（≤40 裁剪）∥ ④ 随正件（父侧落——实施轮同拍，以当刻盘面为准）：`thincoder-server/package.json`（`prepublishOnly` 38 ⇒ 39——本批件入链）+ 门禁件数断言件随正（39 ⇒ 40）∥ ⑤ 部署收尾（父侧执行）：server 侧零迁移零配置——新代码部署（镜像/进程重建）+ 三端拾新版本；收口轮实走（CLI/VSC/桌面各一轮：登录 → 模型可用 → 退出） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R51 | **server-exec-sandbox 批（该批）——需求档回笔 + 随正件 + 披露**：① 需求档回笔（主 agent 笔——**已落** 2026-10-10 14:1x：§5 沙盒块必交面行（14:08）+ **AC-36** 在册（四处同源）+ §2:13 十 ⇒ **十一页** ∥ §2:14 七 ⇒ **八页** + AC-12/AC-14 档目 30∥31 ⇒ **32∥33** + AC-28 十二型 + server 零依赖沙盒行（14:24））∥ ② 随正件（父侧落——实施轮同拍）：注⑱（档目断言件九件 ∥ nav 计数件三件 ∥ 审计型面件 ∥ 门禁件数断言件七件 38 ⇒ 40）+ `thincoder-server/package.json`（38 ⇒ 40）∥ ③ 披露（不阻塞）：**已裁 U1–U5**（2026-10-10 14:23 用户「都按建议」——docker ∥ podman 双兼容 ∥ 回环+169.254 恒拒·RFC1918 可开 ∥ 默认单五条起步 ∥ 独立管理页 ∥ 快照 15 分钟+拆前）∥ 披露 D1–D4（tmpfs 例外 ∥ key_plain 明文 ∥ 盒可达 server 整端口 ∥ 复用 key 残余面）∥ ④ 部署收尾（父侧执行）：节点接入（`ops/OPS.md` §5.10） | 披露（上抛——如无异议按设计实施；部署收口 = 父侧） | 评审/用户复核 |
| R52 | **runner-admin-console 批（本批）——需求档回笔/父侧补笔/登记项**：① 需求档（主 agent 笔）：沙盒四件的可检验条目已在本批验收盘面（`sandbox/SANDBOX.md` §11 ∥ §12 ∥ 批档 §2）；需求档 §5/AC-36 的阶段口径（六面分两轮）宜回笔——**写法/计数 = 主 agent 定** ∥ ② 父侧补笔：`docs/TEST-ENV-ECS.md` §7——现为 `thincoder-runner.service` 残留口径（服务已不存在）+ 需补节点前置步（dockerd 监听 TCP——`ops/OPS.md` §5.10 节点前置条）∥ ③ 登记（不阻塞）：审计页 `sandbox_event` 模板随余面批（原始型名兜底可用）∥ ④ 本批承诺项：v12 迁移（存量旧行弃——测试库仅一行 daemon 期残留）∥ 收口轮 = 真机走查（10.0.0.6） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R53 | **runner-admin-console 批（托管接入增补——本批）——需求档回笔/父侧补笔/登记项**：① 需求档（主 agent 笔）：AC-36 ⑨/⑩ 与 §5「接入两径」判据面收口（三态 ∥ 凭据纪律五件 ∥ 网络路径——判据全文 = `sandbox/SANDBOX.md` §3/§11）；写法/计数 = 主 agent 定 ∥ ② 父侧补笔：`docs/TEST-ENV-ECS.md` §7——补「托管接入」跑法（agent 代做三件；手工前置路仍可作降级）；既有 `thincoder-runner.service` 残留口径同 R52② ∥ ③ 登记（不阻塞）：`docs/README.md` 地图登记 agent 域（新域——域档一档）∥ `@thincoder/server` 带核发布形（`@thincoder/core` 钉版本依赖——构建期 registry 可达性，实施轮定；KD-SV-78 依赖声明形） ∥ `Dockerfile` 构建期 apt 可达性（`openssh-client`+`sshpass`——如实披露） ∥ agent 模型出口代理旗复核点（`agent/ADMIN-AGENT.md` §5） ∥ ④ 披露（不阻塞）：多机并装 ∥ 任务中途取消 ∥ TLS（`:2375` 明文——沿提议①）不做；托管接入 = 任务式驱动（管理面 chat 随会话面增量轮） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R54 | **admin-agent-chat 批（本批）——需求档回笔 + 随正件 + 披露**：① 需求档回笔（主 agent 笔——§5「两个 chat 界面」②④ 的落点与 AC）：§2 增**功能点 37（管理面 chat——草案：会话/回合模型 ∥ 流式通路 ∥ 工具面七件 ∥ 审计型 ∥ 不做单）** + **AC-37 行**（判据 = §7 本批行——机制/端点/控制台/存储/审计五面指针）+ 标题计数随正 + 变更记录 ∥ AC-28 审计型数随正（十二 ⇒ **十三型**——`agent_event`）∥ AC-12/AC-14 管理项数 8 ⇒ **9** + 静态档目 31∥32 ⇒ **32∥33**（余面批 ⇒ 34∥35）∥ §5 成员面 chat 归属句随正（**#1215**——2026-10-10 16:04 裁）∥ ② 随正件（父侧落——实施轮同拍）：`views-audit` 型面数断言件 ∥ nav 计数件（管理 8 ⇒ **9**）∥ 档目断言件（`views-chat.mjs` 入列表——31∥32 ⇒ **32∥33**）∥ 门禁件数断言件（42 ⇒ **44**——本批两件入链；以实施当刻盘面实读为准）+ `thincoder-server/package.json`（同基数）∥ ③ 披露（不阻塞）：chat 不收 SSH 凭据（装机 = 任务式弹窗——KD-SV-84 不破）∥ 会话无删除/重命名/清理（保留口径未裁——不设清零）∥ 回合无中途中止钮（预算封顶）∥ 破坏性动作「先说明后执行」= 提示词级纪律（机制级确认门未做——如要另裁）∥ 节点排空/禁用工具 = 随控制台同批长（未落——不发明）∥ 跨会话并发未设限（未裁）∥ ④ 部署收尾（父侧执行）：镜像重建 + 重收敛 + 浏览器实走（建会话 ⇒ 发一条 ⇒ 帧流 ⇒ 工具调用行 ⇒ 刷新重读） | 披露（上抛——如无异议按设计实施；部署收口 = 父侧） | 评审/用户复核 |

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
- 2026-10-09：实施回填收正（控制台测试 key 修复批——批 `docs/batches/2026-10-09-server-console-testkey-fix.md`）：§6 本批预算行产品面 ≈375 ⇒ **实读 376** ∥ 批内件/随动表行「拟新增」翻转（实读 **201** 行；清单 28 ⇒ 29 已落）∥ §6 随正件行与 §9 R44③「父侧落地」⇒「已落」；同源随动 = `webui/WEBUI.md` §5/变更记录。父侧直接执行 · 机械计数 · 可 revert。
- 2026-10-09：实施期收正（provider 默认模型清除批——服务端舱——批 `docs/batches/2026-10-09-provider-default-model-purge.md`；台账 #1122）：§6 添本批预算行（产品面实读 +3——`presets.mjs` **50 ⇒ 51** ∥ README **244 ⇒ 246**）+ 随动表行（批档 ∥ 批内件 **180** 行 ∥ `package.json` +1 件）；§6 板级行门禁件数随正（**29 ⇒ 30**——本批件入链）；同源随动 = `ops/OPS.md` §5.1/§6/变更记录。**零新语义**（实读 ∥ 登记）。
- 2026-10-09：server 代理批设计轮（批 `docs/batches/2026-10-09-server-gemini-openai-preset.md`——台账 #1128 ∥ #1129；用户 13:45/13:5x 两令）——§2.1 gateway 行十一 ⇒ **十二**档（+ `proxy.mjs`）∥ §4 索引增 KD-SV-55（标题 1–54 ⇒ 1–55）∥ §6 添本批预算行 + 随动件（批内件 ∥ 漂移件 ∥ 跨批件 ∥ `package.json` 30 ⇒ 31）∥ §9 增 R45（需求档回笔 ∥ 跨批件 ∥ 文案面）；机制全文 = `gateway/API.md` §6 KD-SV-55 ∥ `ops/OPS.md` §1。
- 2026-10-09：配置控制台设计轮（批 `docs/batches/2026-10-09-server-console-config.md`——台账 #1139 ∥ #1138 ∥ #1123；用户 15:51–15:57 三连）——§2.1 gateway 行十二 ⇒ **十三**档（+ `config-admin.mjs`）+ webui 行二十九 ⇒ **三十**档（+ `views-system-config.mjs`）∥ §4 索引增 KD-SV-56（标题 1–55 ⇒ 1–56）∥ §6 添本批预算行（产品面 ≈+470；档目 30 ∥ 31）∥ §9 增 R46（需求档回笔 ∥ 随正件 ∥ 披露 ∥ 部署收尾）；机制全文 = `ops/OPS.md` §1 + §8 KD-SV-56 ∥ 端点 = `gateway/API.md` §2.4 ∥ 控制台面 = `webui/WEBUI.md` §2.1。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-console-config.md` §3 评审发现 5/7/8/9，本档面）：§6 增**注⑬**（本批随正件登记：档目断言件十件 ∥ 门禁件数断言件七件（31 ⇒ 32） ∥ v10 读点 ∥ 逐件实读 ⇒ ≤±N）+ 本批块随正（gateway ≈+172 ∥ ops ≈+19 ∥ 产品面 ≈+467——分项闭式 ∥ `docker-compose.yml`/`.dockerignore` 行入列 ∥ README ⇒ ≈264 ∥ 行数注指针）∥ §6 重复行删一 ∥ 板级行 `prepublishOnly` 随正到现值链（30 ⇒ 31 ⇒ **32 件**——与 §6 本批行 ∥ `ops/OPS.md` §5.1 同拍；机读实核：现册 31 件 + 本批件）∥ §9 R46② 补行数注指针 + ④ 补挂载形迁移。**零新语义**（评审发现直接导出项）。
- 2026-10-09：embed 解耦批设计轮（批 `docs/batches/2026-10-09-server-embedding-decouple.md`——台账 #1147 ∥ #1148；用户 17:24 两条之 1/2）——§4 索引增 KD-SV-57/58（标题 1–56 ⇒ **1–58**）∥ §6 添本批预算行 + 注⑭（随正件十件 ∥ `package.json` 32 ⇒ 33）∥ §7 AC-6/AC-15/AC-17 行补缺段与退场判据 + 补 AC-27/AC-28 滞账两行（落修登记——R47③）∥ §9 增 R47（需求档回笔 ∥ 随正件 ∥ 披露）；机制全文 = `ops/OPS.md` §8 KD-SV-57 ∥ `gateway/API.md` §6 KD-SV-58。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-embedding-decouple.md` §3 评审发现 1/4/5/7，本档面）：§4 索引 KD-SV-32 行去 `embedding.model`（零引擎行——与 KD-SV-58 同拍）∥ §6 注⑭补逐件「实读 ⇒ ≤±N」行数注 + 门禁件数断言七件登记（32 ⇒ **33**）+ 本批 i18n 四部件现读（实读 153 ⇒ ≈155 ∥ 实读 138 ∥ 142 ⇒ ≈137 ∥ 141）∥ §6 板级行门禁件数链随正（⇒ **33 件**；组成式 18 ⇒ 19 ⇒ 20 件）∥ §7 AC-26 行「候补」标记收正（已落需求档）。**零新语义**（评审发现直接导出项）。
- 2026-10-09（**server-model-alias 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-model-alias.md` §2 · 台账 #1153 + 并入 #1008 ∥ #1010 ∥ #1152 ∥ #967 ∥ #1151）：§4 索引 KD-SV-4 行随正 + 增 KD-SV-59（标题 1–58 ⇒ **1–59**）∥ §6 添本批预算行（产品面 ≈+146；档目 30 ∥ 31 不变）∥ §7 增 AC-29 行（五面判据指针——编号随需求档 ①–⑤）∥ §9 增 R48（需求档边界行相抵上抛 ∥ 随正件 ∥ 披露）；同源随动 = `gateway/API.md` ∥ `metering/METERING.md` ∥ `accounts/ACCOUNTS.md` ∥ `store/STORE.md` ∥ `webui/WEBUI.md` ∥ `ops/OPS.md`。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-model-alias.md` §3 评审发现 2/3/5/7/8/9，本档面）：§2.1 webui 行 `views-system-config.mjs` 标记翻正（「——本批」⇒ 落盘批次日期）∥ §6 本批块算术平（产品面 ≈+146 ⇒ **≈+147** ∥ webui ≈+48 ⇒ **≈+49** ∥ 域档小计 ≈4035 ⇒ **≈4036**——分项闭式 ∥ README 链 ⇒ **≈257**）+ 行数注指针（⇒ 注⑮）∥ §6 增**注⑮**（门禁件数断言件七件 33 ⇒ 34——逐件实读 ⇒ ±0 ∥ 旧断言件核清单（含配置组数断言族）∥ 新批内件估算）∥ §7 AC-29 行补 ⑤ 判据指（嵌入面零涉——设计句 ∥ 回归面）∥ §9 R48① 翻转「已办」（回指需求档 `:216`/`:300`——当刻盘面）+ ② 补注⑮指针 + ③ 补停用/重开换外标披露条。**零新语义**（评审发现直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09（**console-proxy-page 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-console-proxy-page.md` §2 · 台账 #1158；需求 §2:30 + AC-30；用户 21:06 令）：§1 定位句（侧栏分组导航十一页）∥ §2.1 gateway 行十三 ⇒ **十四档**（+ `proxy-admin.mjs`）+ webui 行三十 ⇒ **三十一档**（`views-*` 十二档；含 favicon 三十二档）+ 职责面补「代理页（§2.7）」∥ §2.2 控制链十一页/管理八页随正 ∥ §4 索引增 KD-SV-60（标题 1–59 ⇒ **1–60**）∥ §6 添本批预算行 + 注⑯（随正件登记）∥ §7 AC-12/AC-16/AC-18 三行档目链补「配置控制台批后 30 ∥ 31」（滞账——配置控制台批漏登）⇒ 代理页批 **31 ∥ 32** + AC-28 行补代理页迁出句 + **增 AC-30 行** ∥ §9 增 R49（需求档回笔 ∥ 随正件 ∥ 披露）；同源随动 = `webui/WEBUI.md` ∥ `gateway/API.md` ∥ `ops/OPS.md`。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-console-proxy-page.md` §3 评审发现 4，本档面）：§6 板级行 `prepublishOnly` 件数链随两在途批收正（30 ⇒ 31 ⇒ 32 ⇒ 33 ⇒ 34 ⇒ **35 件**）∥ 组成式重算对账（补「弹窗批件」项——8 + 4 + 1 + 20 = 33 平）∥ 基数口径明写「以当刻盘面实读为准」（现册 33——`thincoder-server/package.json` 清单实读）。**零新语义**（评审发现直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09：实施后回填轮（代理页批——批 `docs/batches/2026-10-09-console-proxy-page.md` · eng-designer）：§6 本批预算行「拟新增」标记随正（`views-proxy.mjs` ∥ `proxy-admin.mjs`——已落盘）+ 实施后回填实读行（产品面 ≈**+238**——估 ≈+233；批内件 **540** 行——估 ≈300）∥ 注⑯ 补核销读数；同源随动 = `webui/WEBUI.md` §5/§6/变更记录 ∥ `gateway/API.md` §4/变更记录 ∥ `ops/OPS.md` §6/变更记录。**零语义**（读数 ∥ 标记）。
- 2026-10-10：随正件（实施轮 · 机械计数 · 可 revert——server-face-residues 批 · 台账 #1161）：§6 板级行 `prepublishOnly` 件数链收正（35 ⇒ **36 件**——本批件入链）+ 组成式同拍（后续各批 22 ⇒ 23 件；alias ∥ 代理页批件已入链）∥ §6 增**注⑰**（本批随正件登记：门禁件数断言件七件 35 ⇒ 36 ∥ 文档链两处 ∥ 新批件一件）；同源随动 = `ops/OPS.md` §5.1。**零新语义**（计数 ∥ 登记）。
- 2026-10-10：清账轮簇Ⅱ server 面小修/清账批（批 `docs/batches/2026-10-10-server-small-fixes.md` · 台账 #1024 ∥ #1025 ∥ #1056 ∥ #1057 ∥ #1137 ∥ #1146；2026-10-10 实施轮）：§6 滞账注两条 ⇒ 删（D8——失效表达式不留现面）+ 原位补 2026-10-07 五批总账行（布局收正 ∥ 配额分模型 ∥ 配额 v2 · 成员模型 ∥ 模型元数据 ∥ 列式收正——五行实读逐批取数）∥ §6 板级行 `prepublishOnly` 件数链收正（⇒ **38 件**——盘面实读 36 + 本批两件）∥ §9 R40② 滞账 ⇒ 已补（五行在 §6）∥ §9 R40③ 词汇口径 ⇒ 统一已办（台账 #1025）；同源随动 = `webui/WEBUI.md` §2.2/§2.3⑥/§2.6⑤/变更记录 ∥ `ops/OPS.md` §5.1。**零新语义**（句面 ∥ 读数 ∥ 登记）。
- 2026-10-10（**console-proxy-back 批 · 设计形式化轮 · eng-designer**——承批档 `docs/batches/2026-10-10-console-proxy-back.md` §2 · 台账 #1199；需求 §2:30 + AC-30 回改；用户 08:22「服务器的代理设置还是放回系统设置页面。」+ 08:41「测试要保留。」）：§1 定位句（侧栏分组导航十页）∥ §2.1 webui 行三十一 ⇒ **三十档**（`views-*` 十一档；含 favicon 三十一档；`views-proxy.mjs` 退役）+ 职责面（系统页配置控制台含代理设置与连通测试——§2.1 ∥ §2.7）∥ §2.2 控制链十页/管理七页随正 ∥ §4 索引 KD-SV-60 重写（回迁形）+ KD-SV-20 枚举去代理 ∥ §6 添本批预算行（实读增量 **−65**；档目 **30 ∥ 31**；跨批件十五档随正 ∥ 零新件）∥ §7 AC-12/AC-16/AC-18 三行档目链补「代理回迁批后 **30 ∥ 31**」+ AC-28 行代理回迁句 + AC-30 行承载面重写 ∥ §9 本行；同源随动 = `webui/WEBUI.md` ∥ `gateway/API.md` ∥ `ops/OPS.md`。**产品码零触**（形式化轮——码已落）。
- 2026-10-10（**team-login-client-access 批（B1）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-team-login-client-access.md` §1 · 台账 #1212；需求 §2:31 + AC-31）：**client 域新立**——§3 文档地图板 2 + 域 **7**（+ `client/CLIENT.md`）∥ §4 索引增 KD-SV-61/62（标题 1–60 ⇒ **1–62**）∥ §6 添本批预算行（产品面 ≈+77；client 域新立）∥ §7 增 AC-31 行（两面判据指针）∥ §9 增 R50（需求读法披露 ∥ 随正件 ∥ 部署收尾）；同源随动 = `client/CLIENT.md`（新档） ∥ `accounts/ACCOUNTS.md` ∥ `gateway/API.md` ∥ `EVOLUTION.md` ∥ 端侧 = `docs/core/design/TEAM.md`。**产品码零触（设计轮）**。
- 2026-10-10（**team-login-client-access 批（B1）· 设计评审轮 1 修正（fix 轮 · 发现 1 ∥ 3）· eng-designer**——承批档 §3 轮次 1 · 台账 #1212）：§2.1 补 **client 域行** + 「六域」⇒ **七域**（含 §1 落点句「域 6 ⇒ 7 档」同拍）∥ §6 本批块**批内件两件对账**（服务端单件入链 ∥ -ends 件不入链——逐件给由）；同源随动 = `EVOLUTION.md` §1-G4（第一步六域 + client 补立）。**零新语义**（评审发现的直接导出项）。
- 2026-10-10（**server-exec-sandbox 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 · 台账 #1224；需求 §5 沙盒块 + 用户 14:00 两平面裁定 + 14:08 必交面行）：§1 定位句（侧栏十 ⇒ **十一页**）∥ §1 落点句（域 7 ⇒ **9 档**）∥ §2.1 域清单（七 ⇒ **八域**——sandbox 新立）+ webui 行（三十 ⇒ **三十二档** ∥ `views-*` 十一 ⇒ **十三档** ∥ 全目录三十一 ⇒ **三十三档**）+ **增 sandbox 行** ∥ §2.2 控制链（十页 ⇒ **十一页**）∥ §3 文档地图（域 7 ⇒ **9**）+ **增 `sandbox/SANDBOX.md` ∥ `sandbox/RUNNER.md`（迁移期引文——已删）两行** ∥ §4 索引（KD-SV-1–62 ⇒ **1–76**——14 行在册）∥ §6 本批预算块（产品面 ≈**+3998**；档目 ⇒ **32 ∥ 33**；批内件两件）+ 板级行（`prepublishOnly` 38 ⇒ **40**）+ 随动表行 + 注⑱ ∥ §7 **增沙盒行**（建议编号 AC-36）∥ §9 **增 R51**；同源随动 = `sandbox/SANDBOX.md` ∥ `sandbox/RUNNER.md` ∥ `store/STORE.md` §2 v11 ∥ `gateway/API.md` §2.5/§2.6 ∥ `webui/WEBUI.md` §2.8/§6 ∥ `accounts/ACCOUNTS.md` §2.1 ∥ `ops/OPS.md` §5.10 ∥ `EVOLUTION.md` §1-G4/G6。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · checkpoint 通路口径 fix 轮 · eng-designer**——2026-10-10 裁定（实现轮上抛——相抵两说：快照 ≤200 MiB vs 全局 32 MiB）；承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 fix 轮块）：§4 索引标题 1–76 ⇒ **1–77** + 增索引行 ∥ §5 增 **KD-SV-77**（快照上送 = 路由级豁免——octet-stream ∥ 路由级 200 MiB ∥ 流式落盘）∥ §2 无适用行（架构总览未涉写门/体限句——已核）。**产品码零触**。
- 2026-10-10（**server-exec-sandbox 批 · 与 core 关系收正 fix 轮 · eng-designer**——2026-10-10 裁定（用户指示 + 评估结论）「共有机制从核引；服务端专有域自持」；承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 fix 轮块）：§1 零依赖句收正（零第三方运行期依赖——删全树不引核句）∥ §2.3 裁定形（逐面 + 判据一句）∥ §4 索引 KD-SV-2 行范围限定「网关（provider 层）不引」+ 增 KD-SV-78 行（标题 1–77 ⇒ **1–78**）∥ §5 KD-SV-2 行同限定 + 增 KD-SV-78（全形四列）∥ §7 非功能行与机检句随正。**零新语义**（口径与范围收正——原全树句之论证射程仅网关面）；产品码零触。
- 2026-10-10（**runner-admin-console 批 · 设计档随正 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252；用户 2026-10-10 19:52–19:56 口径「runner = 远程 Docker API 节点」）：§1/§2.1/§3 域档计数随正（域 9 ⇒ **8 档**——`sandbox/RUNNER.md` 已删（迁移期引文——执行面重定））∥ §2.1 sandbox 行重写（控制面直调 Docker API；执行面随重做批重建）∥ §3 文档地图去 RUNNER 行 + SANDBOX 行随正 ∥ §4 索引 KD-SV-63/67/68/69/70/71/72/73/74/76 行随正（指针 ⇒ §14）∥ KD-SV-64/65/66/75/77 ⇒ **作废** ∥ §5 KD-SV-77 条 ⇒ 作废 ∥ §6 本批预算块执行面行随正 ∥ §7 沙盒行随正 ∥ §9 R51 部署句随正；同源随动 = `sandbox/SANDBOX.md` ∥ `EVOLUTION.md` ∥ 各域档。**产品码零触**。
- 2026-10-10（**runner-admin-console 批 · A 批最小切片设计 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252；用户 19:59 令）：§2.1 sandbox 行补 `docker.mjs`（本批新档）+ 职责面补「节点与容器（§3）」∥ §2.1 webui 行/职责面沙盒分两轮随正 ∥ §3 文档地图 SANDBOX 行描述随正 ∥ §4 索引标题 1–78 ⇒ **1–81** + 增 KD-SV-79/80/81 三行 ∥ §5 增 KD-SV-79/80/81（全形四列——容器不落库 ∥ 读时探活 ∥ 版本协商）∥ §6 添本批预算行（产品面 ≈+316；webui ≈+275；档目 **31 ∥ 32**；批内件两件入链 40 ⇒ **42**）+ 板级行随拍 ∥ §7 沙盒行补最小切片判据指针（§3 ∥ §12 用例 ∥ v12 ∥ 真机）∥ §9 增 R52（需求档回笔/父侧补笔/登记项）；同源随动 = `sandbox/SANDBOX.md` ∥ `gateway/API.md` ∥ `store/STORE.md` ∥ `webui/WEBUI.md` ∥ `accounts/ACCOUNTS.md` ∥ `ops/OPS.md`。**产品码零触（设计轮）**。
- 2026-10-10（**runner-admin-console 批 · 托管接入（管理面 agent）设计 · eng-designer**——承批档 §2 · 台账 #1236/#1237；用户 22:19–22:29 四句 + 15:00/15:02 裁）：§2.1 域清单（八 ⇒ **九域**——**agent 域新立**）+ sandbox 行补三档（托管接入）+ **增 agent 行** ∥ §3 域档计数（域 8 ⇒ **9**）+ **增 `agent/ADMIN-AGENT.md` 行** + SANDBOX 行描述随正（v11–v13 ∥ 托管接入）∥ §4 索引（1–81 ⇒ **1–87**——六行在册）∥ §5 增 KD-SV-82/83/84/85/86/87（全形四列）∥ §6 添本批增补预算行（服务端产品面 ≈+1110（agent 域 ≈470 ∥ sandbox 域 ≈640 ∥ `Dockerfile` +3） ∥ webui ≈+141；域档计数 8 ⇒ **9**；批内件一件入链 42 ⇒ **43**）∥ §7 沙盒行补托管接入判据指针 ∥ §9 增 R53；同源随动 = `sandbox/SANDBOX.md` ∥ `agent/ADMIN-AGENT.md`（新档） ∥ `gateway/API.md` ∥ `store/STORE.md` ∥ `webui/WEBUI.md` ∥ `accounts/ACCOUNTS.md` ∥ `ops/OPS.md` ∥ `EVOLUTION.md`。**产品码零触（设计轮）**。
- 2026-10-10（**runner-admin-console 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §3 轮次 1 之 3/7）：#3 §4 索引作废行（KD-SV-64/65/66/75/77）与 §5 KD-SV-77 条删净（编号留空档——历史 = 变更记录）∥ #7 §1 定位句与 §2.2 控制链计数十一 ⇒ **十二页**（我的四页 + 管理八页 = 12——与 `webui/WEBUI.md` §2.2 ∥ 需求同拍）。**零新语义**（评审发现直接导出项）。
- 2026-10-11（**admin-agent-chat 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-11-admin-agent-chat.md` §1 · 台账 #1254；需求 §5「两个 chat 界面」②④ + §1 后续议题）：§1 定位句（侧栏分组导航十二 ⇒ **十三页**）∥ §2.1 agent 行（两档拟新增 ⇒ **六档**——run/tools 实读翻正 + 本批四新档）+ webui 行补本批增量注（+1 档）∥ §3 文档地图 agent 行（§11/§12 + KD 面随正）∥ §4 索引（1–87 ⇒ **1–91**——KD-SV-88/89/90/91 四行在册；KD-SV-82 行随正）∥ §5 增 KD-SV-88/89/90/91（全形四列）+ KD-SV-82 行驱动器随正（两形）∥ §6 添本批预算行（服务端 ≈+1280 ∥ webui ≈+380；档目 ⇒ **32 ∥ 33**；`prepublishOnly` 42 ⇒ **44**）∥ §7 增管理面 agent 会话面行（建议 AC-37）∥ §9 增 R54；同源随动 = `agent/ADMIN-AGENT.md` §11/§12 ∥ `gateway/API.md` §2.8 ∥ `store/STORE.md` §2 v14 段 ∥ `accounts/ACCOUNTS.md` §2.1 ∥ `webui/WEBUI.md` §2.10。**产品码零触（设计轮）**。
