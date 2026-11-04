# Thincoder Server · 设计总览（第一步：token 网关）

> 板块 = server（代码 `thincoder-server/` ↔ 文档 `docs/server/`，模块镜像）∥ 本档 = 设计**总览**（板级——定位 ∥ 架构总览 ∥ 模块边界与责任地图 ∥ 文档地图 ∥ 域指针（决策索引 §4 ∥ 域账索引 §6 ∥ 验收索引 §7） ∥ 板级 KD §5 ∥ 板级/跨域上抛 §9 ∥ 交付面 §8）——各域细节 = 域档（见 §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（五要素已齐）；本档不复述需求，验收回指 = §7（验收索引——行级判据 = 各域档「验收」节）。
> 参考件 = `ai-gateway`（外部项目——**只读参考**：零共享运行面 ∥ 零依赖 ∥ 零代码/文档引用；可借鉴经验 = key 明文只回显一次 ∥ 拒打不落用量 ∥ 计量与业务解耦）。
> 范围注：第二步「团队协同」不在本设计集（触发项 = `docs/server/design/EVOLUTION.md` §2）；server 入发布序列 = 定向（npm 路——`docs/RELEASE.md` 扩展 = 发布面轮，不在本范围；沿用户令）。

## 1. 定位与落点

- **一句话**：一台内网常驻的 Node 单进程——OpenAI 兼容入口（chat ∥ embeddings ∥ models），网关代持全部真实 provider key，逐请求记账、按成员限额度；
  另配登录制控制台（vanilla 静态前端——侧栏分组导航；页集 = `docs/server/design/webui/WEBUI.md` §2（单源）∥ 多语言 = `docs/server/design/webui/I18N.md` §2.1）与本机运维 CLI（兜底）；首版完备化面 = `/healthz` ∥ 登录防爆破 ∥ 用量保留窗 ∥ 控制台系统页（版本/更新/接入——§7 AC-13）∥ 可见面二轮六面（向量/看板/总览/审计/健康/key 细节——§7 AC-15）。
- **落点**：代码 = `thincoder-server/`（新顶层目录——与 `thincoder-core/` ∥ `thincoder-cli/` ∥ `thincoder-vscode/` ∥ `thincoder-desktop/` ∥ `thincoder-render-core/` 同级）；设计档 = `docs/server/design/`（板 2 档 + 域 14 档——webui 域另含面档 **13**；见 §2.1 ∥ §3）。
- **形态**：单进程单库（`node:http` + `node:sqlite`）；无构建步骤；纯 ESM（`.mjs`）。
- **零第三方运行期依赖**（沿仓纪律）：import 限 `node:*` 标准库 + 相对路径 + 从核引面（`@thincoder/core`——本仓包，非第三方；口径 = §2.3 ∥ §5 KD-SV-78/137/138）。

## 2. 架构总览

### 2.1 模块边界与责任地图

**三层结构（板 → 域 → 档——代码与文档同拍，用户令）**：代码 = `thincoder-server/src/<域>/<档>.mjs`（入口 `bin/` 与静态 `public/` 除外）；文档 = `docs/server/design/<域>/<档>.md`。

**十二域** = gateway ∥ accounts ∥ metering ∥ store ∥ webui ∥ ops ∥ client ∥ sandbox ∥ agent ∥ project ∥ ledger ∥ mcp。前六域目录自第一步立；其余六域逐条给新立理由：

- **client 域**：新立。
- **sandbox 域**：新立。
- **agent 域**：新立（托管接入）。
- **project 域**：新立（B2——team-projects-permissions——团队项目与权限）。
- **ledger 域**：新立（团队台账——域档 `docs/server/design/ledger/LEDGER.md`）。
- **mcp 域**：新立（MCP 服务器清单与管理会话工具面挂载——域档 `docs/server/design/mcp/MCP.md`）。

拆分落域内（口径 = `docs/server/design/EVOLUTION.md` §1-G4）。

| 域 | 代码（本域档） | 职责 | 域档（文档） |
|---|---|---|---|
| 入口（板级） | `thincoder-server/bin/thincoder-server.mjs`（已落盘） | argv ∥ 配置加载 ∥ 首启引导 ∥ 装配/启动 ∥ 停机 | `docs/server/design/ops/OPS.md` |
| gateway | `thincoder-server/src/gateway/`（档单/计数 = `docs/server/design/gateway/API.md` §4——单源，链不复述） | http 服务 ∥ 注册行分派 ∥ OpenAI 三面 ∥ 转发 ∥ usage 旁路扫描 ∥ 模型派发 ∥ 模型限流（per-model RPM/TPM——§2.2） ∥ provider 管理面（§2.2） ∥ 系统面（探活/版本——§2.3） ∥ 控制台数据面（总览/向量服务/配置/代理测试——§2.4） ∥ 错误形 | `docs/server/design/gateway/API.md` |
| accounts | `thincoder-server/src/accounts/`（档单/计数 = `docs/server/design/accounts/ACCOUNTS.md` §4——单源） | 团队 key ∥ 账号/成员 ∥ 会话/登录 ∥ 密码 ∥ 登录防爆破 ∥ 审计事件（§2.1） ∥ 自助/管理端点 | `docs/server/design/accounts/ACCOUNTS.md` |
| metering | `thincoder-server/src/metering/`（档单/计数 = `docs/server/design/metering/METERING.md` §5——单源） | 记账（同事务三写：usage + 派生两表） ∥ 配额（三级计数准入） ∥ 用量/配额端点（含报表/导出——§3） ∥ 保留窗清理 | `docs/server/design/metering/METERING.md` |
| store | `thincoder-server/src/store/`（一档——`db`；档单/计数 = `docs/server/design/store/STORE.md` §4——单源） | 库 ∥ DDL ∥ 迁移链（各域共用；v5 = 模型标识两字段拆列 + 派生两表 + 成员配额列） | `docs/server/design/store/STORE.md` |
| webui | `thincoder-server/src/webui/`（一档——`static`）+ `thincoder-server/public/`（档单/计数 = `docs/server/design/webui/WEBUI.md` §1——单源；含 favicon 全目录） | 页面路由 ∥ HTML/JS/CSS ∥ 静态直发（**双根：`public/` + `/rc/*` → `@thincoder/render-core`**） ∥ IA/导航（`docs/server/design/webui/WEBUI.md` §2） ∥ 多语言（`docs/server/design/webui/I18N.md` §2.1） ∥ 可见面二轮（`docs/server/design/webui/READINGS.md` §2.1） ∥ 弹窗与成员/服务模型/Provider 面（`docs/server/design/webui/ADMIN.md` §2.1） ∥ 样式族与布局壳（`docs/server/design/webui/STYLE.md` §2.1/§2.2） ∥ 系统页配置面（`docs/server/design/webui/SYSTEM.md` §2.1/§2.2） ∥ 沙盒页（运行面 + 容器面/镜像族 + 拉取认源 + 卷族——`docs/server/design/webui/SANDBOX.md` §2.1/§2.2；六面分五轮）∥ 管理面对话页（`docs/server/design/webui/CHAT.md` §2.1——呈现面复用渲染核，KD-SV-101；**壳面四轴对齐——布局/消息形态/输入区全件/状态行，KD-SV-106 ∥ 活流按步交错——与终态同形，KD-SV-132**） ∥ 终端核（可复用三件 + 控制台消费件——`docs/server/design/webui/TERMINAL.md` §2；KD-SV-181/182/183） | `docs/server/design/webui/WEBUI.md`（面档 **13**——§3） |
| ops | `thincoder-server/src/ops/` + 部署档组（`thincoder-server/deploy/**` ∥ `Dockerfile` ∥ `.dockerignore` ∥ `docker-compose.yml`）+ 模板/说明档（档单/计数 = `docs/server/design/ops/OPS.md` §6——单源） | 配置（含 provider 预设） ∥ 日志 ∥ 运维 CLI ∥ 更新机制（自检/自升/收敛） ∥ 部署面（npm ∥ Docker ∥ systemd ∥ 备份） | `docs/server/design/ops/OPS.md` |
| client | `thincoder-server/src/client/`（一档——`routes`；档单/计数 = `docs/server/design/client/CLIENT.md` §3——单源） | 客户端接入：客户面登录 ∥ 退出（token 吊销） ∥ 当前态读数（`me`）——token = 具名成员 key（复用 accounts key 面） | `docs/server/design/client/CLIENT.md` |
| sandbox | `thincoder-server/src/sandbox/`（档单/计数 = `docs/server/design/sandbox/SANDBOX.md` §13——单源；**执行面单源 = `docs/server/design/sandbox/EXECUTION.md`**） | 沙盒：节点与容器（§3）∥ 容器面补齐 + 镜像族（§3）∥ 镜像源族 + 一键拉取 + 拉取认源（§3）∥ 卷族（§3）∥ **盒底座可换 + 私有仓凭据（§3 底座可换块——派生构建/凭据注入）** ∥ **连接面 TLS 档（§3 连接方式块——可选：客户端证书三件）** ∥ 主机表 + 凭据（§3 主机凭据块——SSH 凭据托管 ∥ `exec` 进 chat ∥ run 退场路线） ∥ 控制面（登记/工作区/凭据/控制台——§1–§9；出站规则/待批两件退场）；执行面随执行面重建 | `docs/server/design/sandbox/SANDBOX.md` |
| agent | `thincoder-server/src/agent/`（档单/计数 = `docs/server/design/agent/ADMIN-AGENT.md` §6 ∥ `docs/server/design/agent/MEMBER-AGENT.md` §5——单源） | 管理面 agent：驱动器 = 聊天式（唯一形态——§11） ∥ 工具面（管理面**九件** §12〔`exec` 入 chat——KD-SV-136；`mcp` 独立面——§12.2〕+ 环境六族八件 §14） ∥ **环境感知（四块装配——§14）** ∥ **唤醒与投递面（§15——timer 空闲唤醒 ∥ bash 异步）** ∥ 会话与流式通路 ∥ 无人值守裁剪 ∥ **成员面 agent（第四壳——盒内核同件 + 最小壳：**会话真源在盒内**（核原生——零会话落库） ∥ 盒出向接入（SSE 下行 + NDJSON 上行 + `cmd` 指令） ∥ 首次进入与拉仓 ∥ 权限与上限 ∥ 生命周期接线 ∥ 成员 git 凭据）** ∥ **模型测试（§12.1——`models.test` 经网关链 loopback 单请求 ＋ 五读数）** | `docs/server/design/agent/ADMIN-AGENT.md` ∥ `docs/server/design/agent/MEMBER-AGENT.md` |
| project | `thincoder-server/src/project/`（档单/计数 = `docs/server/design/project/PROJECTS.md` §8——单源） | 团队项目与权限：git 源接入（四平台 PAT——加密存） ∥ 项目/仓表（一对一；项目删除 = §14） ∥ 成员三档与可见性（能力矩阵——未授权即不可见） ∥ 成员单向同步（定时 + 手动 + **github 事件接收端 §13**） + PAT 体检 ∥ 源/项目/成员管理端点 | `docs/server/design/project/PROJECTS.md` |
| ledger | `thincoder-server/src/ledger/`（档单/计数 = `docs/server/design/ledger/LEDGER.md` §9——单源） | 团队台账：团队共享工作台账（全局编号 ∥ 键 = git 源（归一地址） ∥ 全局一本）∥ 两面族端点（控制台 `/api/ledger*` ∥ 端侧 `/api/client/ledger*`）∥ 判权 = B2 能力矩阵（`can.view`/`can.write`）∥ 六态/老化/审计 `ledger_event` ∥ 上送（零跨账代码路径） | `docs/server/design/ledger/LEDGER.md` |
| mcp | `thincoder-server/src/mcp/`（档单/计数 = `docs/server/design/mcp/MCP.md` §10——单源） | MCP 服务器清单（server 全局单份 ∥ 密列凭据零回显） ∥ 管理会话工具面挂载（`@thincoder/core/mcp.mjs` 四导出原文复用 ∥ 失败冷却）∥ 探活 ∥ 端点族 `/api/admin/mcp*` ∥ 审计 `mcp_event`（配置变更）+ `chat_call`（调用） ∥ **管面工具（`mcp` 第九件——管理会话管清单；机制 = `docs/server/design/agent/ADMIN-AGENT.md` §12.2）** | `docs/server/design/mcp/MCP.md` |

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
控制台面两区（`#/login` ∥ 我的 ∥ 管理——页集/组项数 = `docs/server/design/webui/WEBUI.md` §2 IA 表（单源，链不复述））——数据全经 /api/*，判权全在后端；系统页数据 = `/api/system`（版本/更新/引擎模型——KD-SV-24/30）
```

### 2.3 与 core 的关系（依赖决策摘要）

- **裁定（用户指示 + 评估结论）：共有机制从核引；服务端专有域自持**。判据一句 = 「该机制三端是否也有？有 ⇒ 从核引；服务端专有 ⇒ 自持」。
- **逐面**：**中继面（网关 provider 层）= 不引**（「不认识内容」的字节级中继语义——KD-SV-2 三理由；范围限网关面）∥ **存储 ∥ 记账 ∥ 账号 ∥ 控制台 ∥ 沙盒 ∥ 运维 = 自持**（`@thincoder/core` 里无该面——核内 = 客户端登录侧（`team.mjs`），服务端为权威侧、方向相反；控制台渲染面 = 从渲染核引——`@thincoder/render-core`（**版本声明形——registry `^0.1.0`**（#1353；与 `@thincoder/core` 同形）——「核」两指全文以包名别之）∥
  **agent 面 = 从核引（件级）**：件清单单源 = `docs/server/design/agent/ADMIN-AGENT.md` §17.2（在盘 15 件 ＋ 新增 3 面）；**环体（回合骨架）自持**（核内无宿主缝——核缝设计草案 = §17.4 开放点①）；provider 客户端 ∥ 模型规格 = 引（任务出口 ∥ 会话 loopback 出口 ∥ 档位与回灌形）；依赖声明形照 CLI（`@thincoder/core` 版本声明——`^0.10.7`）。
- **带核发布形（版本对位口径）**，五面：
  - ① **依赖形** = 两包皆版本声明（registry——`@thincoder/core` `^0.10.7` ∥ `@thincoder/render-core` `^0.1.0`；#1353 收正——原渲染核 `file:` 形已去）。
  - ② **地板口径** = 声明版本须覆盖服务端实际消费的全部核件/导出（背书 = `docs/server/design/agent/ADMIN-AGENT.md` §17.2 件清单；新采纳核件 ⇒ 同提交升 pin）。
  - ③ **发布序** = 核**先于/同拍**随 server 发行到 npm。
  - ④ 装机三径（Docker 构建期 pack ∥ npm 全局装 ∥ 自升 converge）registry 不可达 ∥ 核包缺失 ⇒ fail-loud（沿 `docs/server/design/agent/ADMIN-AGENT.md` §14.5 结论）。
  - ⑤ 发布动作 = 发布面轮（定向——R5/R10 在册）。
- 同仓直连的优势（协议两端一提交同改同审）保留待用：非 OpenAI 协议翻译类需求（现为不做项）出现时再按需要直连，不预先耦合。
- 存储选 `node:sqlite` 与核 `thincoder-core/ledger-db.mjs` 同技术（`DatabaseSync`），零代码共享——各持各的库与 DDL。

## 3. 文档地图（板 2 + 域 14）

| 档 | 层 | 域 | 内容（各档自带决策段） |
|---|---|---|---|
| `docs/server/design/PROJECT.md` | 板 | —— | 定位 ∥ 架构总览 ∥ 模块边界与责任地图 ∥ 文档地图 ∥ 域指针（决策索引 §4 ∥ 域账索引 §6 ∥ 验收索引 §7） ∥ 板级 KD §5 ∥ 板级/跨域上抛 §9 ∥ 交付面 §8 |
| `docs/server/design/EVOLUTION.md` | 板 | —— | 扩展点（断点） ∥ 触发条件式演进 ∥ 明确不预建 |
| `docs/server/design/gateway/API.md` | 域 | gateway | 路由族表 ∥ OpenAI 三面 ∥ 转发与计量行为 ∥ 错误形 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |
| `docs/server/design/accounts/ACCOUNTS.md` | 域 | accounts | 团队 key 面 ∥ 账号/会话/角色 ∥ 自助/管理端点表 ∥ 改密/重置 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |
| `docs/server/design/metering/METERING.md` | 域 | metering | 记账 ∥ 配额 ∥ 查询与额度端点 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |
| `docs/server/design/store/STORE.md` | 域 | store | 库 ∥ DDL ∥ 迁移链 ∥ 本域文件与预算 ∥ 决策 |
| `docs/server/design/webui/WEBUI.md` | 域 | webui | 壳面：静态面 ∥ 控制台 IA（§2——页集/档目链单源） ∥ 判权与自托管 ∥ 壳面文件与预算余行 ∥ 验收（非功能·前端自洽 ∥ AC-12） ∥ 边界；面档 **13** = `docs/server/design/webui/ADMIN.md`（管理数据面） ∥ `docs/server/design/webui/CHAT.md`（管理面对话） ∥ `docs/server/design/webui/I18N.md`（多语言） ∥ `docs/server/design/webui/ME.md`（我的面） ∥ `docs/server/design/webui/READINGS.md`（读数面——可见面二轮六面） ∥ `docs/server/design/webui/SANDBOX.md`（沙盒面） ∥ `docs/server/design/webui/STYLE.md`（样式与版式） ∥ `docs/server/design/webui/SYSTEM.md`（系统页） ∥ `docs/server/design/webui/PROJECTS.md`（团队项目与权限面） ∥ `docs/server/design/webui/TABS.md`（公共标签页组件） ∥ `docs/server/design/webui/LEDGER.md`（团队台账面） ∥ `docs/server/design/webui/TERMINAL.md`（终端核——可复用件） ∥ `docs/server/design/webui/MCP.md`（MCP 面）——各档 §1 KD ∥ §2 机制 ∥ §3 文件账/键族 ∥ §4 验收 ∥ §5 边界 ∥ §6 上抛/余项 |
| `docs/server/design/ops/OPS.md` | 域 | ops | 配置面 ∥ 首启引导 ∥ 运维 CLI ∥ 启动/停机/部署面 ∥ 日志 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |
| `docs/server/design/client/CLIENT.md` | 域 | client | 客户端接入：客户端 token 面 ∥ `/api/client/*` 数据面骨架 ∥ 端点表 ∥ 本域文件与预算 ∥ 验收判据（AC-31）∥ 用例 ∥ 边界 ∥ 上抛/余项（§8） |
| `docs/server/design/sandbox/SANDBOX.md` | 域 | sandbox | 沙盒：形态 ∥ 对象模型与存储（v11–v13 ∥ v15） ∥ 节点与容器（最小切片——§3；**容器面补齐 + 镜像族——§3**；**镜像源族——§3**；**卷族——§3**；**主机凭据——§3**） ∥ 工作区生命周期与节点绑定 ∥ 盒内凭据 ∥ 控制台四面（必交面——每配置项有 UI 写入口；出站规则/待批队列退场） ∥ 端点与判权 ∥ 已裁决策与披露 ∥ 验收判据 ∥ 用例 ∥ 本域文件与行数预算 ∥ 决策（含 KD-SV-79/80/81/84/85/92–100 ∥ 104/105 ∥ **133–135**） ∥ 边界 ∥ 上抛/余项（§16） |
| `docs/server/design/sandbox/EXECUTION.md` | 域 | sandbox | 执行面（第二档 · 单源）：形态与三证（零驻留） ∥ 通道三件（Docker API ∥ SSH ∥ 盒出向） ∥ 盒生命周期直调链与建盒参数集 ∥ 主机侧件（磁盘限额） ∥ 写门实时化 ∥ 盒运行时通道（核同件 + 最小壳） ∥ 底座可换（派生构建 ∥ 私有仓凭据） ∥ **连接面 TLS 档（可选——形态/传输/材料/审计——增补 #2）** ∥ v22 收正/迁移拆案 ∥ 探针执行器（余腿）∥ 验收判据 ∥ 用例 ∥ 本域预算 ∥ KD-SV-160–163 ∥ 166–174 ∥ 184–191 ∥ **192–195** ∥ 上抛/余项（§17） |
| `docs/server/design/agent/ADMIN-AGENT.md` | 域 | agent | 管理面 agent：形态与定位 ∥ 无人值守裁剪 ∥ **聊天式驱动（§11）** ∥ **工具面扩展九件（§12——§12.1 模型测试 ∥ §12.2 MCP 管理工具）** ∥ **环境感知与环境工具面（§14——四块装配 ∥ 六族八件 ∥ 限幅 ∥ 审计详情与 timer 投递 ∥ 核可达性）** ∥ **唤醒与投递面（§15——唤醒器一器两源 ∥ 投递汇 ∥ 对齐表 ∥ 开放点四条）** ∥ **会话历史与出口改道（§16——`read_history` ∥ 网关链 loopback ∥ 管理面 sk）** ∥ **与核的取核形（§17——件清单 ∥ 开放点 ∥ 核面零改声明）** ∥ **模型测试（§12.1——`models.test` 网关链 loopback ＋ 五读数）** ∥ **MCP 管理工具（§12.2——`mcp` 第九件工具）** ∥ 本域预算 ∥ 验收 ∥ 本域决策（KD-SV-82/87/88/89/90/91 ∥ **107/108/109/110** ∥ **112/113/114** ∥ **125/126 ∥ 129/130/131** ∥ **136 ∥ 205 ∥ 206/207/208**） ∥ 边界∥ 上抛/余项（§13） |
| `docs/server/design/agent/MEMBER-AGENT.md` | 域 | agent | 成员面 agent（第四壳 · 会话面）：定位与形态 ∥ 关键决策（KD-SV-152–159 ∥ 203/204 ∥ 216–223——五题裁定 ∥ 工具面归属 ∥ 记忆面压后 ∥ 会话管理面 ∥ 成员 git 凭据 ∥ 三端对齐面） ∥ 机制（全链三段 ∥ **会话真源在盒内（核原生——零上送/零回灌）** ∥ 盒接入（SSE + NDJSON + `cmd` 指令）∥ 回合模型 ∥ 生命周期接线 ∥ 首次进入与拉仓 ∥ 权限与上限 ∥ 移动端接口形 ∥ 记忆面 ∥ 三端对齐面（§3.11） ∥ 盒内壳与核） ∥ 端点索引 ∥ 本域文件与预算 ∥ 验收（AC-50 对位——①–⑦） ∥ 用例 ∥ 边界 ∥ 上抛/余项（§9——R75–R90） |
| `docs/server/design/project/PROJECTS.md` | 域 | project | 团队项目与权限：定位与词表 ∥ 关键决策（KD-SV-115–123 ∥ **127/128** ∥ **151**） ∥ 权限模型（能力矩阵/判据句九条） ∥ 平台接入（能力矩阵 + 角色映射表四张 + 客户端口径） ∥ 同步机制（三径/调度/算法/锁/体检/源生命周期/加仓两径 ∥ **事件接收端 §13**） ∥ **项目删除（§14）** ∥ 端点摘要（单源 = `docs/server/design/gateway/API.md` §2.9） ∥ 界面承载（⇒ `docs/server/design/webui/PROJECTS.md`） ∥ 本域文件与预算 ∥ 验收（AC-44 ①–⑨ + ⑬ 对位 + R63/R64 补面） ∥ 用例 ∥ 边界 ∥ 上抛/余项（§12） |
| `docs/server/design/ledger/LEDGER.md` | 域 | ledger | 团队台账：定位与形态 ∥ 关键决策（KD-SV-139–147） ∥ 数据形（单表/全局编号/仓标记/老化） ∥ 写路径 ∥ 读路径与端点摘要 ∥ 上送（零跨账代码路径） ∥ 审计 ∥ 承载指针 ∥ 本域文件与行数预算 ∥ 验收（AC-32 ①–⑥ 对位） ∥ 用例 ∥ 边界 ∥ 上抛/余项（§13——R74） |
| `docs/server/design/mcp/MCP.md` | 域 | mcp | MCP 面：定位与形态（三件/拓扑/最近先例） ∥ 解裁与挂载（`TRIMMED_FACES` 收正 ∥ chat 面接法 ∥ 失败冷却 ∥ 生命周期） ∥ 配置面（v24 表 ∥ 五端点 ∥ 探活 ∥ 控制台落点） ∥ 核件复用（引件清单 +1） ∥ 安全/审批/审计（`mcp_event`） ∥ 成员侧挂载 ∥ 边界 ∥ 用例（N1–N6 ∥ B1–B4 ∥ E1–E3） ∥ 关键决策（KD-SV-196–201 ∥ 214） ∥ 本域文件与预算 ∥ 验收（AC-54 ∥ AC-54⑤ 对位——已入册） ∥ 上抛/余项（§12——R86）（**管面（agent 侧 `mcp` 工具）机制 = `docs/server/design/agent/ADMIN-AGENT.md` §12.2**） |

## 4. 决策索引（KD-SV-1–223——域 → 域档 KD 节）

> 编号 = `KD-SV-N`（全局唯一 ∥ 不随域分号段）；每条全形（决策 ∥ 理由） = 其所在档 KD 节（单一权威源）——本表只作域级索引；板级 KD 全形 = 本档 §5。

| 域 | KD 节 |
|---|---|
| 板级 | 本档 §5（KD-SV-1 ∥ 2 ∥ 78 ∥ 137 ∥ 138） |
| gateway | `docs/server/design/gateway/API.md` §6 |
| accounts | `docs/server/design/accounts/ACCOUNTS.md` §6 |
| metering | `docs/server/design/metering/METERING.md` §6 |
| store | `docs/server/design/store/STORE.md` §5 |
| webui | `docs/server/design/webui/WEBUI.md` §7 + 各面档 §1（KD-SV-132——对话页活流分步）（+ **KD-SV-149——项目面单入口合并；`docs/server/design/webui/PROJECTS.md` §1** ∥ **KD-SV-150——隐藏切换语义；`docs/server/design/webui/STYLE.md` §1**）（+ **KD-SV-181/182/183——终端核三件/渲染与调色板/能力表 v1；`docs/server/design/webui/TERMINAL.md` §1**） |
| ops | `docs/server/design/ops/OPS.md` §8 |
| client | `docs/server/design/client/CLIENT.md` §5 |
| sandbox | `docs/server/design/sandbox/SANDBOX.md` §14（KD-SV-133–135——主机表扩展 ∥ 凭据入口弹窗 ∥ run 退场三步） ∥ `docs/server/design/sandbox/EXECUTION.md` §15（KD-SV-160–174——执行面） ∥ **KD-SV-175–180——容器终端 v1（会话链/帧协议/心跳/收口/环境与命令/审计与门）；`docs/server/design/sandbox/SANDBOX.md` §14** ∥ **KD-SV-184–191——底座可换（绑定形 ∥ 派生构建 ∥ 缓存/重建 ∥ 前提（乙——Node 随包带） ∥ 私有仓凭据 ∥ 镜像就位步 ∥ 控制台面 ∥ 审计）；`docs/server/design/sandbox/EXECUTION.md` §15** ∥ **KD-SV-192–195——连接面 TLS 档（形态（地址 scheme 单源） ∥ 传输（`node:https` 适配件） ∥ 材料（三件自备 + 零回显） ∥ 审计）；`docs/server/design/sandbox/EXECUTION.md` §15** |
| agent | `docs/server/design/agent/ADMIN-AGENT.md` §9（KD-SV-125–131——抓醒/异步/历史/出口四面）（+ KD-SV-136——`exec` 八件入 chat） ∥ **与核取核形（§17——板级 KD-SV-137/138 = 本档 §5）** ∥ **KD-SV-152–159 ∥ 203/204 ∥ 215–223（成员面——`docs/server/design/agent/MEMBER-AGENT.md` §2）** ∥ **模型测试（KD-SV-205——`models.test` 网关链 loopback ＋ 五读数；`docs/server/design/agent/ADMIN-AGENT.md` §12.1）** ∥ **MCP 管理工具（KD-SV-206/207/208——`mcp` 第九件工具 ∥ 审计两行/凭据只写 ∥ `chat.mjs` 拆档评估；`docs/server/design/agent/ADMIN-AGENT.md` §12.2）** |
| project | `docs/server/design/project/PROJECTS.md` §2（KD-SV-115–123 ∥ **127/128** ∥ **151**——gitee 范围三态） ∥ `docs/server/design/webui/PROJECTS.md` §1（KD-SV-124） |
| ledger | `docs/server/design/ledger/LEDGER.md` §2（KD-SV-139–147） ∥ `docs/server/design/webui/LEDGER.md` §1（KD-SV-148） |
| mcp | `docs/server/design/mcp/MCP.md` §9（KD-SV-196–201） ∥ `docs/server/design/webui/MCP.md` §1（KD-SV-202——控制台面） ∥ 管面（KD-SV-206–208 = `docs/server/design/agent/ADMIN-AGENT.md` §9 ∥ §12.2） |


## 5. 关键决策（本档——板级）

> 本表只载板级 KD（KD-SV-1 ∥ 2 ∥ 78 ∥ 137 ∥ 138）；域内 KD 全形 = 域档 KD 节（单一权威源——索引 = §4）。

| # | 决策 | 理由 |
|---|---|---|
| KD-SV-1 | **形态 = 单进程单服务**（`node:http`——模块表见 §2.1） | 「内网一台常驻」；团队规模并发；零依赖纪律下无必要拆进程 |
| KD-SV-2 | **中继面（网关 provider 层）不引 `thincoder-core/*`**（范围限定 = 网关面；全域口径 = KD-SV-78；逐面复核表 = §2.3） | ① 核 `thincoder-core/provider/sse.mjs` 的 `readSSE` 是消费型（onToken 回调 ∥ 全量累积 ∥ 规则短路 ∥ 120s idle 判定）——中继复用会强制整段消费/再序列化，与「SSE 逐块透传」相抵；② 核 provider 层面向客户端多协议适配（anthropic/google/responses ∥ 重试 ∥ 限速 ∥ 思考映射）——网关零需要；③ 网关要「不认识内容」的代理语义——解析越少越稳。行数影响：自持 `thincoder-server/src/gateway/sse-tap.mjs`（≈80 行）覆盖全部所需（`data:` 行 JSON 取 usage） |
| KD-SV-78 | **server 引核面 = agent 面与后续共有机制；专有域自持**（用户指示 + 评估结论）：agent 面 = 件级取核（件清单单源 = `docs/server/design/agent/ADMIN-AGENT.md` §17.2；环体自持 ＋ 核缝承接 = §17.4）；从核引 = 依赖声明形照 CLI（`@thincoder/core` 版本声明——`^0.10.7`） | 判据 = 「该机制三端是否也有？有 ⇒ 从核引；服务端专有 ⇒ 自持」——存储 ∥ 记账 ∥ 账号 ∥ 控制台 ∥ 沙盒 ∥ 运维 = 核里无该面（自持）；agent 面与后续共有机制 = 三端共有（从核引） |

| KD-SV-137 | **agent 面取核形 = 件级取核 + 环体自持**（目标态 = 需求 `:601`；全形 = `docs/server/design/agent/ADMIN-AGENT.md` §17）：件清单（file 级）+ 消费接法（动载 ∥ 注入口 ∥ 缺核降级 ∥ 垫片即宿主）；**核面实现零改**；环体取核 = 开放点①（核缝设计草案在册——后续承接） | **全环取核当下不可达**（核 depth-0 恒挂全家族矩阵 ＋ git/树/记忆/技能注入 ∥ `assembleFamilyTools` 无宿主裁剪入参——`thincoder-core/agent/setup.mjs:198-208`；与 `docs/server/design/agent/ADMIN-AGENT.md` §5 裁剪裁决相抵）；件级取核 = 共有机制单源 ∥ 环体宿主语义（DB 单源 ∥ 帧面 ∥ 裁剪 ∥ 记账出口）服务端专有 |
| KD-SV-138 | **带核发布形 = 版本声明 + 地板口径 + 发布序**（全形 = §2.3）：① 依赖形 = `@thincoder/core` 版本声明（registry）；② 地板 = pin 覆盖件清单（`docs/server/design/agent/ADMIN-AGENT.md` §17.2）——新采纳 ⇒ 同提交升 pin；③ 发布序 = 核先于/同拍随 server 发行到 npm；④ 装机三径 registry 不可达 ∥ 核包缺失 ⇒ fail-loud | 单包发布位 = 定向（npm 路）；核包 = 公开包（registry 实读 0.10.8——2026-10-18 `npm view`）；缺核/不可达 ⇒ 拒启（fail-loud 已实证——`docs/server/design/agent/ADMIN-AGENT.md` §14.5） |

## 6. 域账索引（域 → 域档文件账节）

> 逐档行数/预算/迁移读数 = 各域档「本域文件与行数预算」节（单一权威源）；本表 = 域级索引 + 板级件行（实读指针——不载存量数）。

| 域 | 文件账节 |
|---|---|
| gateway | `docs/server/design/gateway/API.md` §4 |
| accounts | `docs/server/design/accounts/ACCOUNTS.md` §4 |
| metering | `docs/server/design/metering/METERING.md` §5 |
| store | `docs/server/design/store/STORE.md` §4 |
| webui | `docs/server/design/webui/WEBUI.md` §5（壳面）+ 各面档 §3（面文件行 ∥ 键族登记） |
| ops | `docs/server/design/ops/OPS.md` §6 |
| client | `docs/server/design/client/CLIENT.md` §3 |
| sandbox | `docs/server/design/sandbox/SANDBOX.md` §13 ∥ `docs/server/design/sandbox/EXECUTION.md` §14 |
| agent | `docs/server/design/agent/ADMIN-AGENT.md` §6 ∥ `docs/server/design/agent/MEMBER-AGENT.md` §5 |
| project | `docs/server/design/project/PROJECTS.md` §8 ∥ `docs/server/design/webui/PROJECTS.md` §3 |
| ledger | `docs/server/design/ledger/LEDGER.md` §9 ∥ `docs/server/design/webui/LEDGER.md` §3 |
| mcp | `docs/server/design/mcp/MCP.md` §10 ∥ `docs/server/design/webui/MCP.md` §3 |
| 板级件 | `thincoder-server/package.json`（`prepublishOnly` = 3×`node --check`——用户裁：单元测试档不入发布门，门禁链撤除） ∥ `.gitignore`（仓根——运行期/本地配置排除两行） ∥ `docs/batches/*.test.mjs`（单元测试档——**收口即删**、不入任何门；只留批档实施记录一行读数） |


## 7. 验收索引（域 → 域档验收节）

> 行级判据 = 各域档「验收」节（单一权威源）；本表 = 域级索引（各域 AC 号列）；判不决（跨域/他面）行 = 下方跨域块（原址）；单域行已迁出者 = 原址保位 stub。

| 域 | 验收节 | AC 号（该域判据行涉及） |
|---|---|---|
| gateway | `docs/server/design/gateway/API.md` §5 | AC-2 ∥ AC-6 ∥ AC-11 ∥ AC-13①③ ∥ AC-15①③ ∥ AC-17 ∥ AC-21 ∥ AC-23 ∥ AC-24 ∥ AC-27 ∥ AC-28 ∥ AC-29 ∥ AC-30 ∥ **AC-44** |
| accounts | `docs/server/design/accounts/ACCOUNTS.md` §5 | AC-1 ∥ AC-5 ∥ AC-7 ∥ AC-13② ∥ AC-15④ ∥ AC-23 ∥ AC-25 ∥ AC-29④ ∥ AC-31 ∥ AC-36 ∥ AC-38 ∥ **AC-44** |
| metering | `docs/server/design/metering/METERING.md` §4 | AC-3 ∥ AC-4 ∥ AC-13⑥ ∥ AC-15②⑥ ∥ AC-21 ∥ AC-22 ∥ AC-23 ∥ AC-26 ∥ AC-29④ |
| store | `docs/server/design/store/STORE.md` §3 | AC-15④ ∥ AC-22 ∥ AC-25 ∥ AC-29 ∥ AC-36 ∥ AC-38 ∥ **AC-44** |
| webui | `docs/server/design/webui/WEBUI.md` §6 + 各面档 §4 | AC-11–AC-30（控制台面） ∥ 非功能·前端自洽 ∥ AC-36 ∥ AC-38 ∥ AC-39 ∥ AC-40 ∥ **AC-41** ∥ **AC-42** ∥ **AC-44（控制台面）** ∥ **AC-48（控制台面）** ∥ **AC-49（控制台面）** ∥ **AC-51（控制台面）** ∥ **AC-54（控制台面）** |
| ops | `docs/server/design/ops/OPS.md` §7 | AC-6 ∥ AC-8 ∥ AC-9 ∥ AC-10 ∥ AC-11 ∥ AC-13⑤ ∥ 功能点 8 ∥ AC-27 ∥ AC-28 ∥ AC-29①③ ∥ 非功能·仅内网 |
| client | `docs/server/design/client/CLIENT.md` §4 | AC-31①–⑤ |
| sandbox | `docs/server/design/sandbox/SANDBOX.md` §11 ∥ `docs/server/design/sandbox/EXECUTION.md` §12 | AC-36 ∥ AC-38 ∥ AC-40 ∥ **AC-47（主机表 + `exec` 进 chat——已入册；`docs/server/design/sandbox/SANDBOX.md` §16 R72①）** ∥ **AC-51（容器终端 v1——已入册；§16 R85①）** ∥ **AC-52（底座可换——拟入册；§16 R74①）** ∥ **AC-53（连接面 TLS 档——拟入册；§16 R74①）** |
| project | `docs/server/design/project/PROJECTS.md` §9 | **AC-44 ①–⑨ ∥ ⑬**（gitee 范围三态） ∥ R63/R64 补面（§13/§14） |
| agent | `docs/server/design/agent/ADMIN-AGENT.md` §7/§8 | AC-36（接入与运维） ∥ 管理面 agent 会话面（AC-37） ∥ **AC-43（环境感知与环境工具面）** ∥ **唤醒与投递面（AC-46 已入册——`docs/server/design/agent/ADMIN-AGENT.md` §13 R71①）** ∥ **AC-47（主机表与 SSH 凭据——已入册；`docs/server/design/sandbox/SANDBOX.md` §16 R72①）** ∥ **与核取核形（`docs/server/design/agent/ADMIN-AGENT.md` §17）** ∥ **AC-50（成员面会话——`docs/server/design/agent/MEMBER-AGENT.md` §6/§7）** ∥ **模型测试（AC-55 已入册——`docs/server/design/agent/ADMIN-AGENT.md` §13 R87①）** ∥ **MCP 管理工具（AC-56 已入册——`docs/server/design/agent/ADMIN-AGENT.md` §13 R88①）** |
| ledger | `docs/server/design/ledger/LEDGER.md` §10 ∥ `docs/server/design/webui/LEDGER.md` §4 ∥ `docs/core/design/TEAM-LEDGER.md` §6 | **AC-32**（团队台账——已入册） |
| mcp | `docs/server/design/mcp/MCP.md` §11 ∥ `docs/server/design/webui/MCP.md` §4 | **AC-54**（MCP 面——**已入册**；`docs/server/design/mcp/MCP.md` §12 R86①） ∥ **AC-56（MCP 管理工具——已入册；`docs/server/design/agent/ADMIN-AGENT.md` §13 R88①）** |
| 板级 | 本档 §1 ∥ §2.3 ∥ §5 | 非功能·零第三方运行期依赖 ∥ 文档面 |

**跨域/留板行（判不决——原址）**：

| 需求 AC | 判据（机检）所在 | 载体 |
|---|---|---|
| AC-1（功能点 1） | → `docs/server/design/accounts/ACCOUNTS.md` §5 AC-1 行 | —— |
| AC-2（功能点 2） | → `docs/server/design/gateway/API.md` §5 AC-2 行 | —— |
| AC-3（功能点 3） | → `docs/server/design/metering/METERING.md` §4 AC-3 行 | —— |
| AC-4（功能点 4） | → `docs/server/design/metering/METERING.md` §4 AC-4 行 | —— |
| AC-5（功能点 5） | → `docs/server/design/accounts/ACCOUNTS.md` §5 AC-5 行 | —— |
| AC-6（功能点 6） | `docs/server/design/gateway/API.md` 验收判据（引擎命中 + 响应透传维度/条数不变 + 记账；**缺 `embedding` 段 ⇒ 服务照起 ∥ `/v1/embeddings` 404 `model_not_found` 消息明示 ∥ 引擎模型不入 `/v1/models`**）+ `docs/server/design/ops/OPS.md` §7 AC-6 行（载入容缺 ∥ 创建流） | 单元测试档 |
| AC-7（功能点 7——B 案） | → `docs/server/design/accounts/ACCOUNTS.md` §5 AC-7 行 | —— |
| AC-8（功能点 8——分发与部署） | → `docs/server/design/ops/OPS.md` §7 AC-8 行 | —— |
| 功能点 8（分发与部署——npm 全局装启动链） | → `docs/server/design/ops/OPS.md` §7 功能点 8 行 | —— |
| AC-9（功能点 9——provider 预设；`docs/server/requirements/PROJECT.md` 验收表） | → `docs/server/design/ops/OPS.md` §7 AC-9 行 | —— |
| AC-10（功能点 10——自动更新；`docs/server/requirements/PROJECT.md` 验收表） | → `docs/server/design/ops/OPS.md` §7 AC-10 行 | —— |
| AC-11（功能点 11——控制台 provider/模型管理；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/gateway/API.md` §5 判据（CRUD 三态 ∥ 保存即热生效 ∥ 密钥掩码/日志零明文 ∥ 发现与降级）+ `docs/server/design/ops/OPS.md` §7 种子行 + `docs/server/design/webui/ADMIN.md` §4（控制台行） | 单元测试档 |
| AC-12（功能点 14——控制台 IA；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/WEBUI.md` §6 判据（`nav.mjs` 直测：组/项 ∥ 重定向 ∥ 角色默认 ∥ denied；静态档目随正——单源 = `docs/server/design/webui/WEBUI.md` §1；链不复述） | 单元测试档 |
| AC-13（功能点 12——首版完备化六项；`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `docs/server/design/gateway/API.md` §5 ∥ ② `docs/server/design/accounts/ACCOUNTS.md` §5 ∥ ③④ `docs/server/design/webui/SYSTEM.md` §4 ∥ ⑤ `docs/server/design/ops/OPS.md` §7 ∥ ⑥ `docs/server/design/metering/METERING.md` §4 | 单元测试档 + 收口轮 |
| AC-14（功能点 13——控制台多语言；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/I18N.md` §4 判据（检测矩阵 ∥ 两表键集对齐 ∥ 键引用闭合 ∥ 错误码映射 ∥ 档目/静态直发随正） | 单元测试档 + 收口轮 |
| AC-15（功能点 15——控制台可见面六面；`docs/server/requirements/PROJECT.md` 验收表） | 分六面判据：① `docs/server/design/gateway/API.md` §5 + `docs/server/design/webui/SYSTEM.md` §4（含缺段「未配置」态） ∥ ② `docs/server/design/metering/METERING.md` §4 + `docs/server/design/webui/READINGS.md` §4 ∥ ③ `docs/server/design/gateway/API.md` §5 + `docs/server/design/webui/READINGS.md` §4 ∥ ④ `docs/server/design/accounts/ACCOUNTS.md` §5 + `docs/server/design/store/STORE.md` §3 ∥ ⑤ `docs/server/design/webui/READINGS.md` §4 ∥ ⑥ `docs/server/design/metering/METERING.md` §4 + `docs/server/design/webui/ME.md` §4 | 单元测试档 + 收口轮 |
| AC-16（功能点 16——控制台弹窗交互；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/ADMIN.md` §4 判据（`modal.mjs` 在册 ∥ 成员三态弹窗 ∥ 一次性秘密不破；档目随正——单源 = `docs/server/design/webui/WEBUI.md` §1） | 单元测试档 + 收口轮 |
| AC-17（功能点 17——服务模型页 ∥ 配置面；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/ADMIN.md` §4 判据（列表同源——嵌入模型行退场 ∥ 详情/配置五组（A/C/D/E/F——F 判据 = AC-21 行） ∥ 停用流（含退役可停 ∥ 与 Provider 页单源协同） ∥ 限流 429 形 ∥ admin 面）+ `docs/server/design/gateway/API.md` §5 判据（限流面机检） | 单元测试档 + 收口轮 |
| AC-18（功能点 18——Provider 管理面重做） | `docs/server/design/webui/ADMIN.md` §4 判据（nav 值「Provider」 ∥ 列表 + 双弹窗 ∥ 零内联面 ∥ 候选 = 上游发现（零手填） ∥ 勾选保存 ⇒ PATCH `models` ⇒ `/v1/models` 随动 ∥ 退役项只读注 ∥ 测试同窗（key = 草稿口径——未保存 key）；档目随正——单源 = `docs/server/design/webui/WEBUI.md` §1；链不复述） | 单元测试档 + 收口轮 |
| AC-19（功能点 19——样式族总体统一） | `docs/server/design/webui/STYLE.md` §4 判据（散置清单 ∥ 变量单源 ∥ 族值表 + 逐族套用表 ①–⑩ ∥ 可点行判据 ∥ 空/错/加载态；视觉收口轮实走） | 单元测试档 + 收口轮 |
| AC-20（功能点 20——控制台布局收正） | `docs/server/design/webui/STYLE.md` §4 判据（五页视口高壳（页头固定 ∥ 表头吸附 ∥ 行区滚动 ∥ 表尾行计数）∥ 内容左对齐 ∥ 弹窗内列表表格化（Provider 模型 ∥ 成员 key）∥ 矮视口回退整页滚；浏览器实走 = 收口轮） | 单元测试档 + 收口轮 |
| AC-21（功能点 21——配额分模型；`docs/server/requirements/PROJECT.md` 验收表） | 分三面判据：`docs/server/design/metering/METERING.md` §4 AC-21 行（三级 ∥ 计数点查 ∥ 零 SQL 短路 ∥ 自然月窗口 ∥ 429 形）∥ `docs/server/design/gateway/API.md` §5 AC-21 行（检查点 = 派发命中后/转发前机检）∥ `docs/server/design/webui/ADMIN.md` §4 AC-21 行（F 组 ∥ 分模型覆盖范围） | 单元测试档 + 收口轮（浏览器实走） |
| AC-22（功能点 22——模型标识两字段；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/metering/METERING.md` §4 AC-22 行（两字段记账/计数 ∥ 列直操作聚合 ∥ 迁移拆分回填逐值 ∥ 对外契约不变）+ `docs/server/design/store/STORE.md` §3 v5 段判据（拆列抽样逐值 ∥ 两表回填逐值） | 单元测试档 |
| AC-23（功能点 23——成员模型面 v2；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/ADMIN.md` §4 AC-23 两行（查看态模型表直显 ∥ 服务模型页配额列 ∥ 禁用勾选即时写）+ `docs/server/design/accounts/ACCOUNTS.md` §5 AC-23 行（写/读面）+ `docs/server/design/gateway/API.md` §5（禁用执行面） | 单元测试档 + 收口轮（浏览器实走） |
| AC-24（功能点 24——上游模型元数据；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/ADMIN.md` §4 AC-24 两行（列式五列 ∥ 退役只提示 ∥ 加载态）+ `docs/server/design/gateway/API.md` §5（留存写入面） | 单元测试档 + 收口轮（浏览器实走） |
| AC-25（功能点 25——「我的·key 与签发」页重做；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/ME.md` §4 AC-25 两行（页面六列 ∥ 双弹窗 ∥ 复制钮 ∥ 接入卡成员面 ∥ 非壳；机检口径）+ `docs/server/design/accounts/ACCOUNTS.md` §5 AC-25 行（端点/命名/上限/404/审计）+ `docs/server/design/store/STORE.md` §3 v8 段（回填判据） | 单元测试档 + 收口轮（浏览器实走） |
| AC-26（功能点 26——「我的·用量」页图表化；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/ME.md` §4 AC-26 两行（页形 ∥ 零依赖 ∥ 数据面 ∥ 壳面 ∥ i18n ∥ 空错态 ∥ 导出判否；机检口径）+ `docs/server/design/metering/METERING.md` §4 AC-26 行（端点契约 ∥ 判权 = 本人 ∥ 逐值/零填充） | 单元测试档 + 收口轮（浏览器实走） |
| AC-27（功能点 27——上游出口代理；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/gateway/API.md` §5 判据（判定与同判定（chat ∥ 发现） ∥ loopback 旁路 ∥ 假代理命中 ∥ SSE 逐块 ∥ 502 ∥ 字段往返 ∥ v9 幂等）+ `docs/server/design/ops/OPS.md` §7 判据（启动两 warn ∥ 配置面校验）+ `docs/server/design/webui/ADMIN.md` §4 AC-18 行（两窗勾选） | 单元测试档 + 收口轮（浏览器实走） |
| AC-28（功能点 28——server 配置控制台；`docs/server/requirements/PROJECT.md` 验收表） | `docs/server/design/webui/SYSTEM.md` §4 AC-28 两行（配置项全量 ∥ 掩码 ∥ 保存往返 ∥ 重启生效 ∥ 探活草稿 ∥ 审计 ∥ 文案改向 ∥ 缺段创建）+ `docs/server/design/gateway/API.md` §5 AC-28 行（写路径机检）+ `docs/server/design/ops/OPS.md` §7 AC-28 行 + §8 KD-SV-56/57；`proxy.uri` 承载回迁服务配置卡（`docs/server/design/webui/SYSTEM.md` §2.2）——第四写控件 ∥ 连通测试块（文案改向句改指——AC-30 行同拍） | 单元测试档 + 收口轮（浏览器实走） |
| AC-29（功能点 29——服务模型别名；`docs/server/requirements/PROJECT.md` 验收表） | 分五面判据：`docs/server/design/gateway/API.md` §5 AC-29 行（① 配置形两形/非法 400·拒启 ∥ ② 对外别名生效（清单/请求命中/旧名 404） ∥ ③ 唯一性（撞别名拒 ∥ 形上不相交））∥ `docs/server/design/metering/METERING.md` §4 AC-29④ 行（记账外标 = 别名 ∥ 过滤反查 ∥ 键随动）∥ `docs/server/design/accounts/ACCOUNTS.md` §5 AC-29④ 行（配额/禁用键 = 外标形）∥ `docs/server/design/webui/ADMIN.md` §4 AC-29① 行（G · 别名组 ∥ 列表外标）∥ `docs/server/design/ops/OPS.md` §7 AC-29①③ 行（配置/种子面：两形 ∥ 校验 ∥ 拒启）∥ `docs/server/design/store/STORE.md` §2 v2 段（条目两形——零迁移） ∥ ⑤ 嵌入面零涉（设计句 = `docs/server/design/gateway/API.md` §6 KD-SV-59 ∥ §8 不做项「嵌入面别名」；回归 = 嵌入面判据零动——单元测试档断言） | 单元测试档 + 收口轮（浏览器实走） |
| AC-30（功能点 30——代理设置与连通测试（服务配置卡内）+ 旧链重定向；`docs/server/requirements/PROJECT.md` 验收表） | 分三面判据：① 承载 = `docs/server/design/webui/SYSTEM.md` §4 AC-30 行（服务配置卡 = 四写控件 + 连通测试块 ∥ `views-proxy.mjs` 不在盘（档目断言——单源 = `docs/server/design/webui/WEBUI.md` §1）∥ 旧链 `#/admin/proxy` ⇒ `#/admin/system`）+ `docs/server/design/gateway/API.md` §5（白名单零变——`CONFIG_WRITABLE_KEYS` 导出直测） ∥ ② 测试功能 = `docs/server/design/gateway/API.md` §5 AC-30 行 + §7 用例（N36/B26/E27）+ `docs/server/design/webui/SYSTEM.md` §4 AC-30 续行（真打读数 ∥ 就地错态 ∥ 零落库零计费） ∥ ③ 语义零变 = `docs/server/design/ops/OPS.md` §1 写面句 + 保存往返/重启生效 + Provider 勾选零回归 + `proxy.mjs` 零触（KD-SV-55 不变） | 单元测试档 + 收口轮（浏览器实走） |
| 管理面 agent 会话面（需求 §5「两个 chat 界面」②④；编号随需求档——建议 **AC-37**） | 分面判据：机制面 = `docs/server/design/agent/ADMIN-AGENT.md` §7 聊天式行 ∥ §8（N54/N55 ∥ B48/B49 ∥ E40/E41——端到端：假模型 + 假工具：帧序/落库/重放/在途门/重启收尾/逐调用审计）∥ 端点面 = `docs/server/design/gateway/API.md` §2.8（六端点三态码 ∥ NDJSON 帧形逐帧 ∥ 流前信封/流中 `end` 帧分界）∥ 控制台面 = `docs/server/design/webui/CHAT.md` §4 管理面 agent 会话页行（页在册 ∥ 流读取 ∥ 四形渲染 ∥ 两表键族）∥ 存储面 = `docs/server/design/store/STORE.md` §3 v14 段（空库直落 14 ∥ v13 升后 14 ∥ 幂等 ∥ 两表 + 索引在场 ∥ `agent_event` 型可写）∥ 审计面 = `docs/server/design/accounts/ACCOUNTS.md` §2.1 `agent_event` 行 + §7 用例；工具面 = §12 逐件回指（members/providers/models/usage/audit/runners/docker/exec） | 单元测试档 + 收口轮（浏览器实走） |
| AC-36（沙盒 · 需求 §5 沙盒块） | 分面判据：`docs/server/design/sandbox/SANDBOX.md` §11 判据行（凭据 ∥ 必交面四面 + 每配置项有 UI 写入口；出站/待批两面退场）∥ §12 用例 ∥ `docs/server/design/gateway/API.md` §2.5（端点面机检——节点登记/工作区）∥ `docs/server/design/webui/SANDBOX.md` §4 沙盒行（控制台机检）∥ `docs/server/design/store/STORE.md` §3 v11 段（迁移判据）；执行面判据随执行面重建；**最小切片**：`docs/server/design/sandbox/SANDBOX.md` §11 最小切片行 ∥ §3 ∥ §12（N40 ∥ N46–N48 ∥ B41–B43 ∥ E34–E36）∥ `docs/server/design/gateway/API.md` §2.5 前七行 ∥ `docs/server/design/webui/SANDBOX.md` §2.1① ∥ `docs/server/design/store/STORE.md` §2 v12 段/§3 v12 + 真机（10.0.0.6）；**接入与运维（任务式装机退场）**：承接 = `docs/server/design/sandbox/SANDBOX.md` §3 接入面块（手工登记 ∥ 装机/主机运维 = 管理面 chat 内动作——`exec`/`docker`/`runners`）；**容器面补齐 + 镜像族**：`docs/server/design/sandbox/SANDBOX.md` §11 容器面补齐判据行 ∥ §3（容器面块）∥ §12（N53–N56 ∥ B47–B51 ∥ E39–E42）∥ `docs/server/design/gateway/API.md` §2.5 新八行 ∥ `docs/server/design/webui/SANDBOX.md` §2.1① + §4 沙盒行（随正） ∥ `docs/server/design/accounts/ACCOUNTS.md` §2.1（四 kind——型面计数零增）+ 真机（10.0.0.6：真容器详/日志/重启/强杀/用量 ∥ 真镜像列/删） | 单元测试档 + 收口轮（浏览器实走 + 真机） |
| AC-53（功能点 53——连接面 TLS 档；拟入册——`docs/server/design/sandbox/SANDBOX.md` §16 R74①） | 分面判据：机制面 = `docs/server/design/sandbox/SANDBOX.md` §3 连接方式块（形态 = 地址 scheme 单源 ∥ 材料三件自备 + 零回显 ∥ 不变量 `https` ⇔ 三件齐 ∥ 写面两端点 ∥ 关 TLS 原子 ∥ 生效面全谱）∥ §11 连接面行 ∥ §12 用例（N73 ∥ B76） ∥ 传输面 = `docs/server/design/sandbox/EXECUTION.md` §2.1/§13 ∥ §15 KD-SV-192–195 ∥ 端点面 = `docs/server/design/gateway/API.md` §2.5（改一行 + 增一行） ∥ 存储面 = `docs/server/design/store/STORE.md` §2 v22 段 ⑤（四列）/§3 v22 判据 ∥ 审计面 = `docs/server/design/accounts/ACCOUNTS.md` §2.1（`runner_connection` + `runner_add` 增 `tls` 键） ∥ 运维面 = `docs/server/design/ops/OPS.md` §5.10 连接面 TLS 档条 ∥ 控制台面 = `docs/server/design/webui/SANDBOX.md` §2.1①/§4（连接面行） | 单元测试档 + 收口轮（浏览器实走 + 真机（ECS `.6`——节点 dockerd TLS 就位 ⇒ 自签三件 ⇒ 切档 ⇒ 自检过 ⇒ 全谱可用 ⇒ 切回明文）） |
| AC-54（功能点 54——MCP 面；已入册；`docs/server/design/mcp/MCP.md` §12 R86①） | 分面判据：机制面 = `docs/server/design/mcp/MCP.md` §2（解裁/挂载/冷却——chat 面挂载 ∥ `TRIMMED_FACES` 零 `mcp` ∥ 任务面零 MCP 件）∥ §3（存储/端点/探活）∥ §4（核件复用——零第二实现）∥ §5（安全/审批/审计）∥ §6（成员侧挂载——五面）∥ §8 用例（N1–N6 ∥ B1–B4 ∥ E1–E3） ∥ 存储面 = `docs/server/design/store/STORE.md` §2 v24 段/§3 v24 判据 ∥ 端点面 = `docs/server/design/gateway/API.md` §2.13（五行） ∥ 审计面 = `docs/server/design/accounts/ACCOUNTS.md` §2.1（`mcp_event` 三 kind）+ 调用面 = `chat_call` 零扩 ∥ 运维面 = `docs/server/design/ops/OPS.md` §5.11 ∥ 控制台面 = `docs/server/design/webui/MCP.md` §4 ∥ 成员侧面 = `docs/server/design/mcp/MCP.md` §11（AC-54⑤ 行） | 单元测试档（`2026-10-13-server-mcp.test.mjs`）+ 收口轮（浏览器实走：加真实 MCP 服务器 ⇒ 探活 ✓ ⇒ 管理会话实调 ⇒ 审计页一行） |
| AC-56（功能点 56——MCP 管理工具；已入册；`docs/server/design/agent/ADMIN-AGENT.md` §13 R88①） | 分面判据：工具面 = `docs/server/design/agent/ADMIN-AGENT.md` §12.2（五动词 ∥ 寻址 ∥ 引件表 ∥ 结果形）∥ §7 行 ∥ §8（N85 ∥ B81 ∥ E63） ∥ 复用面 = `docs/server/design/mcp/MCP.md` §4 管面句（零第二实现） ∥ 审计面 = `docs/server/design/mcp/MCP.md` §5（`mcp_event` 三 kind ＋ 驱动层 `chat_call`） ∥ 凭据面 = `docs/server/design/mcp/MCP.md` §3.1 密文列纪律 ∥ 存储/端点/控制台面 = 零触（既有在册） | 单元测试档（`2026-10-14-server-mcp-admin-tools.test.mjs`）+ 收口轮（会话实走：列/探/增一条真实服务器） |
| AC-31（功能点 31——三端登录与接入；`docs/server/requirements/PROJECT.md` 验收表） | 分两面判据：① 服务面 = `docs/server/design/client/CLIENT.md` §4（login 三态 ∥ token 兼用 /v1 ∥ logout 即吊销——§6 用例 N37/B27/E28/N39）∥ ② 端侧面 = `docs/core/design/TEAM.md` §5（三端入口 ∥ token 落本地 ∥ 派生 provider ∥ 未登录态 ∥ 退出关闭） | 单元测试档 + 收口轮（三端实走） |
| AC-38（功能点 38——沙盒镜像源族；`docs/server/requirements/PROJECT.md` §2:38 + 验收表；已入册） | `docs/server/design/sandbox/SANDBOX.md` §3（源清单四端点 + 预选 ∥ v2/Hub 两面读取 ∥ 匿名 Bearer 挑战 ∥ 有界首页 ∥ 五分类如实读绪；**一键拉取块**；**拉取认源块**）+ §11（镜像源族判据行 ∥ 一键拉取行 ∥ 拉取认源行）∥ §12 用例（N57–N59 ∥ B52–B56 ∥ E43–E45 ∥ N60 ∥ B57/B58 ∥ E46 ∥ N61 ∥ B59–B62 ∥ E47）∥ `docs/server/design/gateway/API.md` §2.5 镜像源七行 ∥ `docs/server/design/webui/SANDBOX.md` §4（镜像源族行 + 一键拉取行 + 拉取认源行——沙盒页镜像源卡/本地镜像表过滤/一键拉取/拉取认源）∥ `docs/server/design/store/STORE.md` §2 v15 段/§3 v15（`image_sources`）∥ `docs/server/design/accounts/ACCOUNTS.md` §2.1（三 kind——型面计数零增）∥ §14 KD-SV-100 | 单元测试档 + 收口轮（浏览器实走 + 整条旅程真机（ECS `.6`——加源 ⇒ 经源拉 ⇒ 建容器）） |
| AC-44（功能点 44——团队项目与权限；`docs/server/requirements/PROJECT.md` 验收表；已入册） | 分面判据：机制面 = `docs/server/design/project/PROJECTS.md` §9（AC-44 ①–⑨ 对位表 + R63/R64 补面行）+ §3/§4/§5（权限/平台/同步）+ §13/§14（接收端/项目删除） ∥ 端点面 = `docs/server/design/gateway/API.md` §5 AC-44 行 + §2.9 **十七行** ∥ 存储面 = `docs/server/design/store/STORE.md` §2 v17 段/§3 v17（三表 + `hook_secret_cipher` + 审计十四型） ∥ 控制台面 = `docs/server/design/webui/PROJECTS.md` §4 ∥ 审计面 = `docs/server/design/accounts/ACCOUNTS.md` §2.1 `project_event` 行 + §7 用例 ∥ 用例 = `docs/server/design/project/PROJECTS.md` §10（N1–N23 ∥ B1–B3 ∥ E1–E4） | 单元测试档 + 收口轮（浏览器实走） |
| AC-32（功能点 32——团队台账；`docs/server/requirements/PROJECT.md` 验收表；已入册） | 分面判据：机制面 = `docs/server/design/ledger/LEDGER.md` §10（AC-32 ①–⑥ 对位）+ §11（N1–N5 ∥ B1–B9 ∥ E1–E4）+ §2（KD-SV-139–147） ∥ 端点面 = `docs/server/design/gateway/API.md` §2.10 **八行** + §5 AC-32 行 ∥ 存储面 = `docs/server/design/store/STORE.md` §2 v20 段/§3 v20（单表 + 两索引 + 审计十五型） ∥ 控制台面 = `docs/server/design/webui/LEDGER.md` §4 ∥ 端侧面 = `docs/core/design/TEAM-LEDGER.md` §4/§6/§7（三端承载分工） ∥ 审计面 = `docs/server/design/accounts/ACCOUNTS.md` §2.1 `ledger_event` 行 + §7 用例 ∥ 判权单源 = `docs/server/design/project/PROJECTS.md` §3（`can.write` 首个端到端消费者——其 §12 R67 已兑现） | 单元测试档 + 收口轮（浏览器实走 + 三端实走） |
| 非功能 · 零第三方运行期依赖 | 本档 §1 ∥ §2.3 ∥ §5 KD-SV-2 / KD-SV-78 / KD-SV-137 / KD-SV-138（口径与范围）；import 扫描断言 = 单元测试档 | 单元测试档 |
| 非功能 · 仅内网 | → `docs/server/design/ops/OPS.md` §7 非功能·仅内网 行 | —— |
| 非功能 · 前端自洽 | `docs/server/design/webui/WEBUI.md` §6 验收判据（零外部引用扫描） | 单元测试档 |
| 文档面 | `node scripts/doc-check.mjs --root .` exit 0（悬空 0） | 收口轮（仓根机检） |

## 8. 交付面（测试与实施顺序）

- **单元测试档**：`2026-10-06-server-gateway.test.mjs`（平 node 直测：config 校验 ∥ keys ∥ members ∥ session ∥ usage ∥ quota ∥ sse-tap ∥ forward + routes（mock 上游 = 端口随机 `node:http`） ∥ bootstrap 幂等 ∥ 静态面（mime ∥ 防穿越） ∥ 依赖面/外链扫描断言）。写面受阻时先落 `.thincoder/tmp/`、父侧 copy——沿先例。
- **不设 `test/` 树**：单元测试档**收口即删**（测试纪律——不占集成测试树；只留批档实施记录一行读数）；**例外 = 取件缝件**（`thincoder-server/test/rc-resolve.mjs`——非单元测试档、不入链 ∥ 不入 `files`；见 §9 R58③）；收口轮 = 父侧真机（AC 实跑 ∥ 四端任一实际接入一轮 ∥ 仓根 `node scripts/doc-check.mjs --root .`）。
- **实施序（派单为准）**：实施轮实际 = 四阶段派单——D1 骨架 → D2 账号与计量 → D3 聊天链 → D4 控制台 + 向量面 + 分发部署；「实施顺序建议」两条 = 设计时划分（仅参考——非执行序）。
- **实施顺序建议**（串行——按域推进，上半）：D1 骨架（store/db → ops/config → gateway/server ∥ `/v1/models` 可通）→ D2 账号与会话（accounts 全档 → bootstrap → webui 登录壳）→ D3 鉴权 + 配额 + 计量（gateway/errors ∥ metering 全档）。
- **实施顺序建议**（续）：D4 聊天链（gateway 的 providers → sse-tap → forward → routes）→ D5 embeddings + 管理面收尾（engine 转发 ∥ accounts/routes-admin ∥ metering/routes ∥ webui 管理视图 ∥ ops/cli）。
- 收口轮前置（环境面）：真实上游可达 ∥ 内网引擎（Ollama/TEI）可达。

## 9. 上抛与报告项（板级/跨域）

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| R1 | **地图登记**：`docs/README.md` 地图与 `docs/core/design/DOC-SYSTEM.md` 部分表补 server 行（含设计档三层结构） | 文档随动（父侧面为常例——零触他板档） | 随实施轮或父侧直接执行；先例 = render-core 第五部分登记 |
| R2 | **需求留白（设计已定形——供用户复核）**：① 额度单位/周期（token ∥ 自然月——KD-SV-6）② provider key 配置形态（**已定**：库单源 + 控制台保存即生效——KD-SV-19）③ 控制台门禁（登录制——会话 cookie ∥ 角色分面；KD-SV-7） | 披露（不阻塞） | 如用户意图不同 ⇒ 回笔需求或改设计 |
| R3 | **收口轮环境前置**：AC-2 四端实跑需真实上游可达；AC-6 需内网嵌入引擎（或本机 Ollama） | 实施前置 | 收口轮执行前确认 |
| R4 | **单元测试档写面**：`docs/batches/*.test.mjs` 直写若受阻 ⇒ 落 `.thincoder/tmp/` 父侧 copy | 实施前置（沿先例） | 实施轮处置 |
| R5 | **发布序列**：server 入发布序列 = 定向（npm 路——用户令）；`docs/RELEASE.md` 扩展 = 发布面轮（不在本范围——只做包体就绪） | 后续轮 | 发布面轮 |
| R10 | **发布面接线点**：`@thincoder/server` 发布前 ⇒ 自检恒「无新版」（404 静默）；发布后自生效（无需改动）；发布动作 = 发布面轮 | 后续轮（接线在案） | 发布面轮 |
| R19 | **需求档回笔**：AC-12 行随正（管理 4 ⇒ 6 ∥ `#/admin` 重定向 ⇒ `/admin/overview` ∥ 静态九档 ⇒ 15/16——与 §2:15③④ 冲突面收口）；另 AC-12「静态九档」= i18n 后已陈（现有 12/13） | 需求档回笔（主 agent 笔） | 随评审/收口；设计侧行已随正（`docs/server/design/webui/WEBUI.md` §6 AC-12 行） |
| R20 | **披露——「成员增删」之「删」零既有路径**：功能点 15④ 审计事件目录含「成员增删」，而全库零成员删除路径（控制台/CLI 皆无）；设计只覆盖「增」（member_create）；「成员删除」功能不在任何功能点内 | 需求措辞面裁定（回笔 or 立后续项） | 待主 agent/用户裁；审计面零阻塞 |
| R22 | **随正七件登记（父侧——跨批写门禁）**：`-console-providers` ∥ `-webui-deploy` ∥ `-server-i18n` ∥ `-server-gateway-accounts` ∥ `-first-release-completeness` ∥ `-server-gateway`（基准件——v3 断言改点） ∥ `-server-auto-update`（门禁件数 11 ⇒ 12）（逐件断点与行数 = §6 随动表行 + 注①②④⑤） | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R24 | **配置候选表（已裁——用户裁「ACDE」）**：A（开放/停用——**服务模型页自持操作面；不得被 Provider 页吸收**——上游退役模型从发现列表消失后只在服务模型页可停用）∥ C（per-model 限流）∥ D（展示元数据）∥ E（成本权重）**入选**；B（默认请求参数）**不选**；落字段 = 设计在盘（`docs/server/design/webui/ADMIN.md` §2.1③ ∥ KD-SV-34/35；需求档 §2:17 已同拍） | 用户裁定（已裁） | 落字段 = 设计在盘；实施 = 后续轮 |
| R25 | **i18n 表拆域（断点触发登记）**：拆表后 zh ≈309 ∥ en ≈305（估）⇒ 按域拆表；处置 = 独立结构轮（本面已定 ∥ 撞在途断言面）；实施实读为准 | 处置已定（独立结构轮） | 独立结构轮（实施后另轮） |
| R26 | **随正五件登记（父侧——跨批写门禁）**：`-console-completeness-2`（nav 6 ⇒ 7 ∥ 档目 15/16 ⇒ 17/18 ∥ labelKeys 11 ⇒ 12） ∥ `-console-providers` ∥ `-webui-deploy` ∥ `-server-i18n` ∥ `-server-auto-update`（门禁件数 12 ⇒ 13 ∥ `:9`/`:439`/`:480` 注释与断言同拍——以随正落地后盘面为准）；断点以当刻盘面为准；行数 = §6 注⑥ | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R28 | **需求档回笔（主 agent 笔）**：AC-11 行「手填降级」措辞收正（用户裁定——控制面候选手填入口撤除；发现失败 = 提示 + 重试；服务端 502 语义零改）——设计侧行（`docs/server/design/gateway/API.md` §5 ∥ `docs/server/design/webui/ADMIN.md` §4 AC-11 行） | 需求档回笔 | 随评审/收口 |
| R30 | **披露——退役模型停用过渡窗**：落地后，上游已退役（不在发现列表）的已开放模型在 Provider 页不可停用（用户裁定）；服务模型页 A 开关设计在盘（`docs/server/design/webui/ADMIN.md` §2.1③）；过渡窗内停用入口 = API 级 PATCH `models`；建议 A 实施轮紧随（设计已备） | 披露（不阻塞） | 用户/主 agent 排期 |
| R31 | **需求档回笔（主 agent 笔）**：AC-17 行「配置项 = 用户裁定面（未裁前只落详情 + 编辑骨架）」收正（配置项 = A/C/D/E 已裁——设计在盘）+ §2:17 末句「实现序 = 另轮排期（本轮骨架在盘）」随正（设计在盘，实施另轮）；设计侧行已随正（`docs/server/design/webui/ADMIN.md` §4） | 需求档回笔 | 随评审/收口 |
| R32 | **C 存储面/端点面裁定点（上抛——评审/用户确认）**：设计取 = ① 存储 `providers.settings_json`（v4 迁移——单列，非新表）；② 端点 = PATCH `/api/admin/providers/:id` 扩 `settings` 键级合并（零新端点）；③ 窗口 = 进程内存 60s 定窗（重启归零）；④ 拒绝形 = 429 `rate_limited` + `Retry-After`（全文 = `docs/server/design/webui/ADMIN.md` §1 KD-SV-34 ∥ `docs/server/design/gateway/API.md` §6 KD-SV-35） | 披露（上抛裁定） | 如无异议按设计实施；存储面改动须同拍 `docs/server/design/store/STORE.md`/`docs/server/design/gateway/API.md` |
| R33 | **随正六件登记（父侧——跨批写门禁）**：`-console-modals` ∥ `-server-gateway`（v4 读点） ∥ `-server-i18n`（档单/键族） ∥ `-server-gateway-webui-deploy`（档目） ∥ `-console-completeness-2` ∥ `-console-providers` + `thincoder-server/package.json`（`prepublishOnly` 添件）；断点以当刻盘面为准；行数 = §6 注⑧ | 父侧直接执行（实施轮同拍） | 实施轮落地 |
| R35 | **跨批顺序披露**：设计档引用 provider 重做成果（`docs/server/design/webui/ADMIN.md` §2.1④ 退役注行 ∥ `views-providers-modals.mjs`）——两批实施顺序建议 = provider 重做先行、随后（其随正链 18 ⇒ 19 先落，再 19 ⇒ 20）；顺序倒置时断点以当刻盘面为准（在案） | 披露（不阻塞） | 实施排期参考 |
| R38 | **披露——字排/悬停两口径的后果（供用户/评审复核）**：一字号（13px）+ 零粗体下页题（h2）∥ KPI 数值（`stat-value`）∥ 卡题与正文同号同重——层级 = 结构通道（位置/间距/底色/边框）；悬停统一 = 全数据行（含不可点表——可点性由指针/焦点环承担）。如用户要求保留字号层级或「仅可点行悬停」⇒ 回笔需求 §2:19 边界句，值表单点调整 | 披露（不阻塞） | 评审/用户复核 |
| R39 | **披露——退役且已停用模型的控制台重开径**：上游已退役（不在发现列表）且已停用的模型 ⇒ 控制台零重开路径（Provider 页该类项只读注「停用入口 = 服务模型页」且停用后注行不含——`docs/server/design/webui/ADMIN.md` §2.1④；服务模型页列表 = 开放集 ⇒ 行不在——§2.1③）；重开径 = API 级 PATCH `models`（口径沿 R30）；如用户要求控制台重开入口 ⇒ 回笔（候选面需发现数据——与无手填裁定衔接） | 披露（不阻塞） | 用户/主 agent 排期 |
| R40 | **me-keys（随正件）**：① 旧测试随正（删 `.key-item` 类 ⇒ 四件断点：`2026-10-06-console-list-style.test.mjs` ∥ `2026-10-07-console-layout.test.mjs` ∥ `2026-10-07-quota-v2-member-models.test.mjs`（`:744` 悬停清单；复数直测 `:526`/`:545` 期望文本随正——同件双面） ∥ `2026-10-07-provider-model-metadata.test.mjs`；值改 `me.keys.lastUsed`/`windowTokens`（列内形） ⇒ `2026-10-06-console-completeness-2.test.mjs`（键在场——应不破）；门禁件数随正（`prepublishOnly` 22 ⇒ 23——添单元测试档） ⇒ 六档：`2026-10-06-console-list-style.test.mjs` ∥ `2026-10-06-server-auto-update.test.mjs` ∥ `2026-10-07-console-layout.test.mjs` ∥ `2026-10-07-provider-model-metadata.test.mjs` ∥ `2026-10-07-quota-per-model.test.mjs` ∥ `2026-10-07-quota-v2-member-models.test.mjs`（件数断言/注释同拍））——父侧落地（实施轮同拍；行数注 = §6 注⑩）∥ ③ 上抛（设计轮裁——供复核）：轮换页面下架（端点保留）∥ 名称上限 40 字符 ∥ 自助上限 20 把（CLI 免）∥ 名称不进 admin 面 key 表 ∥ 页面非壳（钉表五页不扩）∥ 词汇口径：本页新文案取需求 §2:25③ 字面（「API Key」——定音在案：用户裁取 B，术语门）；既有四面（nav/管理/审计/接入卡）原用「key」⇒ **统一已办（`docs/server/design/webui/I18N.md` §2.1 词汇口径条已落统一现状句）** ∥ 需求边界句「接入卡源不动」读法 = **已裁**（需求档回笔：接入卡 = 同源构件复用——导出/变体参数允许；admin 面渲染/措辞零改；在案 = `docs/server/requirements/PROJECT.md` §2:25；上抛已闭环） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R41 | **me 用量图表化（需求档回笔 + 随正件 + 披露）**：① 需求档回笔（主 agent 笔——随评审/收口）：§2 增功能点 26 + AC-26 行（设计侧候补已在——`docs/server/design/webui/ME.md` §4 ∥ `docs/server/design/metering/METERING.md` §4）∥ ② 随正件（父侧落讫——回填轮收正；行数注 = §6 注⑪）：六件断言件（`-console-layout` ∥ `-console-list-style` ④ 面 ∥ `-server-auto-update` ∥ `-provider-model-metadata` ∥ `-quota-per-model` ∥ `-quota-v2-member-models`——门禁件数 24 ⇒ **26**）+ `-console-layout` me 页两处断点（路由桩补 `/api/me/usage/summary` ∥ 页头断言改点〔`me.usage.summary` 键退役〕）+ `thincoder-server/package.json`（`prepublishOnly` 24 ⇒ **26**——两件入链）∥ ③ 披露（不阻塞）：壳面五页钉表维持——报表卡不承缩 + 上限自滚（明细卡恒得剩余高）+ 明细承缩（高度链 +2 行在册）；如偏好参考图式自由滚动页 ⇒ 需求 §2:20 改判另轮 ∥ ④ 三档翻案已随正（`docs/server/design/metering/METERING.md` §8 ∥ `docs/server/design/webui/ADMIN.md` §5/§1 KD-SV-29 否决栏——改判 = KD-SV-49） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R42 | **结构轮——上抛 + 随正件 + 需求档回笔**：① 上抛（用户批准面——`docs/server/design/webui/I18N.md` §1 KD-SV-51/52）：i18n 拆表形态（四部件 + 门面 = 拟案；备选 = 两/三拆）∥ `app.mjs` 拆否（拟 = 拆三档；备选 = 不拆——越线续存）∥ 余两越线档（`views-admin` ∥ `views-providers-modals`——预案标「触发 = 结构轮（同族）」）是否随轮 ∥ 新档命名（`dom.mjs` 等） ∥ ② 需求档回笔（主 agent 笔——随评审/收口）：`docs/server/requirements/PROJECT.md` AC-12 `:147` ∥ AC-14 `:149` 档目链（19 ∥ 20 ⇒ **29 ∥ 30**；若裁不拆 app ⇒ 27 ∥ 28） ∥ AC-14 CJK 措辞随回笔同拍（「i18n 三档 CJK 口径（zh 表 = 唯一 CJK 档）」⇒ 族式「zh 族」 ∥ 「三新档静态直发」⇒「十新档」——与设计侧 AC-14 行字面同拍） ∥ ③ 随正件（父侧落讫——实施轮同拍；行数注 = 注⑫）：**十六件**断言件 + `thincoder-server/package.json`（`prepublishOnly` 26 ⇒ 27） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R43 | **bin 入口 guard 修复（回笔建议 + 部署收尾 + 同族记录）**：① 需求档回笔建议（主 agent 笔）：AC-8 判据现未覆盖「npm 全局装（POSIX 符号链接垫片）装后起服可跑」——本缺陷即从此缝漏出；建议补一条（判据 = 经垫片调用 ⇒ 服务真启动；载体 = 单元测试档 ∥ 收口轮）∥ ② 部署侧收尾（父侧执行——ECS）：镜像重建（含修复）+ compose `entrypoint:` 覆盖件移除（现为绕行——修复落地后执行）∥ ③ 同族记录（不修——范围外）：`thincoder-server/deploy/backup.mjs:84` ∥ `thincoder-server/deploy/converge.mjs:194` ∥ `thincoder-server/src/ops/cli.mjs:216`（同判据形）+ `bench/preflight.mjs:115` ∥ `bench/probe.mjs:307` ∥ `bench/run.mjs:304` ∥ `bench/toolcall.mjs:259` + 五处 `resolve()` 变体：`scripts/dev-link.mjs:171` ∥ `scripts/doc-check.mjs:90` ∥ `thincoder-cli/scripts/doc-impact.mjs:144` ∥ `thincoder-desktop/scripts/make-icon.mjs:170` ∥ `thincoder-desktop/scripts/materialize-deps.mjs:142`——择批处置 | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R44 | **控制台测试 key 修复（需求档回笔（已办）+ 部署收尾 + 随正件）**：① 需求档回笔（**已办**；主 agent 笔）：功能点 18③ / AC-18 行补「测试连接 ∥ 刷新候选 key = 草稿口径（未保存 key）」判据句——回笔在盘 = `docs/server/requirements/PROJECT.md:265`（§2:18 草稿口径句 ∥ `:77` 口径句 ∥ `:157` AC-18 判据句；设计侧行已随正——`docs/server/design/webui/ADMIN.md` §4 AC-18 行）∥ ② 部署侧收尾（父侧执行——ECS）：镜像重建（含修复）+ 重收敛 + 用户复测原流程（§1 在册——`public/**` 在镜像内）∥ ③ 随正件（父侧**已落**——实施轮同拍；断点/行数注 = §6 预算行）：门禁件数断言七件 N ⇒ N+1——注释同拍（现值 **30**）+ 文档链随正（`docs/server/design/ops/OPS.md` §5.1 ∥ 本档 §6 板级行：**30** 件） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R45 | **server 代理（需求档回笔 + 跨批单元测试档 + 文案面）**：① 需求档回笔（主 agent 笔）：`docs/server/requirements/PROJECT.md` §2:9 计数「起步 20 家」⇒ **21 家**（+ `gemini-openai`）+ 新增**功能点 27（server 上游代理——逐渠 `proxy` 旗）** + AC 行（判据 = `docs/server/design/gateway/API.md` §5 代理行） ∥ `docs/core/requirements/PROJECT.md` C3 计数 24 ⇒ **25** ∥ ② 跨批单元测试档（父侧落——机械）：`2026-10-09-provider-default-model-purge-server.test.mjs` 四处 `20 ⇒ 21`（行号以当刻盘面为准）∥ ③ 产品文案面（三端 README 计数随实施轮——`thincoder-cli/README.md`「twenty-four providers」⇒ 25 ∥ `thincoder-vscode/README.md`「24 provider presets」⇒ 25 ∥ 枚举随正；server README 同批已含） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R46 | **配置控制台（需求档回笔 + 随正件 + 披露 + 部署收尾）**：① 需求档回笔（主 agent 笔——随评审/收口）：`docs/server/requirements/PROJECT.md` §2 增**功能点 28（server 配置控制台——草案句：全部配置项可视/可写 ∥ 只读三件例外显式 ∥ 重启生效标注 ∥ 密钥面 ∥ 草稿探活 ∥ 审计 ∥ 文案改向）** + AC-28 行（判据 = `docs/server/design/webui/WEBUI.md` §6 ∥ `docs/server/design/gateway/API.md` §5 ∥ `docs/server/design/ops/OPS.md` §7）+ 标题计数 二十七条 ⇒ **二十八条** ∥ AC-15① 微调建议（向量卡 = 配置面（可编辑）+ 草稿探活替代「配置真值行」读法）∥ ② 随正件（父侧落——实施轮同拍）：档目断言件十件（名单 = 结构轮注⑫①——列表 + `views-system-config.mjs`）∥ 门禁件数断言件（31 ⇒ 32——名单以实施当刻盘面为准）∥ v10 读点（`-server-gateway` 等——以盘面为准；行数注 = §6 注⑬）∥ ③ 披露：复核 = 盘面十行零「拟新增」残留（`dom.mjs`/`health.mjs`/i18n 八部件在场——逐行 = `docs/server/design/webui/WEBUI.md` §1/§5 ∥ 面档 §3；翻正动作 = 无）∥ `GET /api/admin/embedding` UI 消费者退场（配置面读取改经 `/api/admin/config`——端点契约零动、零退役；是否收敛 = 另议）∥ 生效口径 = 统一「重启生效」（若要求热生效 = 翻案点——呈请）∥ ④ 部署收尾（父侧执行——ECS）：镜像重建 + 挂载形迁移（config 目录级） + 重收敛 + 浏览器实走（服务配置卡 + 向量卡编辑） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R47 | **embed 解耦（需求档回笔 + 随正件 + 披露）**：① 需求档回笔（主 agent 笔——随评审/收口）：`docs/server/requirements/PROJECT.md` 功能点 6 补「嵌入配置可缺 + 禁用语义 + 嵌入模型不入通用清单」句 ∥ 功能点 15① 补向量卡「未配置」态 ∥ 功能点 17 补「嵌入引擎模型不入本清单」 ∥ 功能点 21② 删「嵌入行 = —」（退场） ∥ AC-6 / AC-15① / AC-28 判据句随补（**编号零增——均 = 收正既有条目**） ∥ ② 随正件（父侧落——实施轮同拍）：十件断言件（旧「引擎模型入清单/入页」断言面——清单 = §6 注⑭）+ `thincoder-server/package.json`（`prepublishOnly` 32 ⇒ 33——单元测试档入链）∥ ③ 披露（不阻塞）：`/api/system.embedding.model` 保留下发（用户面提示条——非「模型列表」面）∥ `GET /api/admin/embedding` 端点在册（UI 消费者已退场——契约零动）∥ 控制台删除/清空 `embedding` 段不做（缺段 = 编辑配置文件）∥ ④ 部署收尾（父侧执行——ECS）：镜像重建 + 重收敛 + 可选 `/v1/models` 实走核对（模型清单零引擎行） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R48 | **server-model-alias（需求档回笔 + 随正件 + 披露）**：① 需求档回笔（**已办**；主 agent 笔）：`docs/server/requirements/PROJECT.md` 边界行 `:216`（当刻盘面）已删「模型别名」（现文 = 「v1 不做**模型路由**（已降级为后续可选）；」）；AC-29 编号零增（已落 `:194`） ∥ ② 随正件（父侧落——实施轮同拍，**以当刻盘面实读为准**）：门禁件数断言 N ⇒ N+1（现值 33 ⇒ 34——七件注释同拍）+ `thincoder-server/package.json`（`prepublishOnly` 33 ⇒ 34——单元测试档入链）+ 旧断言件核（预计零——既有断言无别名配置：外标仍回落 `provider/model`；清单 = §6 注⑮） ∥ ③ 披露（不阻塞）：别名与成员键互为外标（改别名 ⇒ 旧形键 = 离表键保留、不生效——无历史/迁移）∥ 停用/重开两径换外标（停用 = `models` 减项离表 ∥ 重开 = Provider 页勾选按字符串形重建——别名不再存在 ⇒ 旧别名请求 404 `model_not_found`；如需保留 = 另轮）∥ CLI `usage reconcile` 读数 = 内部真名（运维面）∥ ④ 版本面：零迁移（结构版本保持 v10——`docs/server/design/store/STORE.md` §3） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R49 | **console-proxy-page（需求档回笔 + 随正件 + 披露）**：① 需求档回笔（主 agent 笔——随评审/收口）：`docs/server/requirements/PROJECT.md` AC-28 行文案改向句改指（「系统 → 服务配置」⇒「代理」页——`:193` 当刻盘面）∥ 页数/项数链随正（§2:13 侧栏「十页」⇒**十一页** `:52` ∥ §2:14 管理「七页」⇒**八页** `:57` ∥ AC-12 行「管理 7」⇒ **8** `:172`）∥ ② 随正件（父侧落——实施轮同拍，**以当刻盘面实读为准**）：档目断言件九件（`-console-completeness-2` ∥ `-console-list-style` ∥ `-console-modals` ∥ `-console-provider-redo-runtime` ∥ `-console-providers` ∥ `-models-config` ∥ `-server-gateway-webui-deploy` ∥ `-server-i18n` ∥ `-server-console-config`——`views-proxy.mjs` 入列表）+ nav 计数件三件（管理 7 ⇒ 8）+ 配置 F1/F4 断言件（`-server-console-config`——四写控件 ⇒ 三写控件 ∥ 提交体去 `proxyUri` ∥ 键清单去 2 键 ∥ `useProxy` 改向断言改指）+ 门禁件数断言 N ⇒ N+1（现值 33——在途入链先后影响绝对值）+ `thincoder-server/package.json`（`prepublishOnly` 同基数）∥ ③ 披露（不阻塞）：测试 uri = **表单明传（所见即所测——草稿先验，KD-SV-54/57 同源）**；如裁「必须打运行配置值」⇒ 翻案点（保存→重启→测试链）∥ 重定向两径差（直连径 fetch 缺省跟随 ∥ 经代理径单请求不跟随（3xx 原样回读））——生产同链同行为，不改传输 ∥ `proxy.mjs` 零触（KD-SV-55 传输语义不变） | 披露（上抛——如无异议按设计实施） | 评审/用户复核 |
| R50 | → `docs/server/design/client/CLIENT.md` §8（上抛/余项·R50 行） | —— | —— |
| R51 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R51 行） | —— | —— |
| R52 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R52 行） | —— | —— |
| R53 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R53 行） | —— | —— |
| R54 | → `docs/server/design/agent/ADMIN-AGENT.md` §13（上抛/余项·R54 行） | —— | —— |
| R55 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R55 行） | —— | —— |
| R56 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R56 行） | —— | —— |
| R58 | **console-chat-align（需求档回笔 + 随拍件 + 披露 + 部署链随正）**：① 需求档回笔建议（主 agent 笔）：§5「两个 chat 界面」③ 纪律句（「新会话面/新呈现面先查可复用资产（先查再造）」——判据 = `docs/server/design/webui/CHAT.md` §1 KD-SV-101 ∥ §2.1）是否入册；写法/计数 = 主 agent 定 ∥ ② **部署链随正（父侧笔面——本轮已上抛）**：`docs/TEST-ENV-ECS.md` §3 一行（`docker build` 上下文 ⇒ 仓根）+ `Dockerfile`（双包 COPY/pack/装——**41**）+ `thincoder-server/README.md`（`:16`/`:93` 两处构建上下文行）+ 仓根 `.dockerignore`（新建——上下文迁仓根后 server 侧件失效）+ `docs/server/design/ops/OPS.md` §5.1（构建上下文句 ⇒ 仓根 ∥ 门禁链 **52**——沿漂移同拍）——落点已定形；未落则 `.5` 镜像内核包不可解析（**启动 fail-loud**——沿桌面 `thincoder-desktop/src/main/protocol.mjs:20` 先例；非静默白屏）⇒ 实施轮前置 ∥ **npm 装机径**（`npm i -g @thincoder/server`——README §1/§3）核包投递 = 随发布面轮（装机判据 = 缺包 fail-loud——同上）∥ ③ 随拍件（父侧落——实施轮同拍，以当刻盘面为准）：档目断言件（**39 ∥ 40**；盘面 **16 档**——含管理面 chat 单元测试档（链内——`load()` 页面档）；以实施当刻为准）+ `thincoder-server/package.json`（`file:` 声明 ∥ `prepublishOnly` 链 **52**（单元测试档入链——沿近先例）∥ 链行加 `--import ./thincoder-server/test/rc-resolve.mjs`——单行内改）+ **缝件新建** = `thincoder-server/test/rc-resolve.mjs`（`/rc/*` 平 node 解析钩子——沿桌面 `test/rc-resolve.mjs` 先例；非用例档——不入链 ∥ 不入 `files` 白名单）+ **既有件随正两事**：① `-admin-agent-chat-ui.test.mjs`——缝承零改（`--import` 预载）+ 静态面用例上量随正（档目 `[38, 37]` ⇒ **[40, 39]** ∥ 类名/键闭两用例按核件消费收正）；② 门禁件数断言件七件（**52**——注释/断言消息同拍）+ 文档链两处（`docs/server/design/ops/OPS.md` §5.1 ∥ 本档 §6 板级行——链 **52** 同拍）+ 核件类名闭合域随正（AC-19 canon——`style.css` 选择器 ⊆ 档面字面类 ∪ 核件发射类清单）∥ ④ 披露（不阻塞）：核件工具卡内含内联状态色（`#f14c4c`/`#4ec9b0`）——与 AC-19 canon（`:root` 外零颜色字面量）不冲突（canon 扫描面 = `style.css`；核 = 单源，端侧不覆写）∥ 控制台现零 CSP 头（不改；如后加 ⇒ `default-src 'self'` 即足——作用面 = 控制台自有档；核件内联状态色 ⇒ 后加而无 `style` 内联豁免则回读卡状态色落空——桌面 `style-src 'self'` 同态：`renderer/index.html:7`）∥ 会话内搜索不做（浏览器原生 Ctrl+F）∥ 代码块复制钮不做（安全上下文依赖——TLS/公网化后可接） | 披露（上抛——如无异议按设计实施；部署收尾 = 父侧） | 评审/用户复核 |
| R57 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R57 行） | —— | —— |
| R59 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R59 行） | —— | —— |
| R61 | → `docs/server/design/agent/ADMIN-AGENT.md` §13（上抛/余项·R61 行；随正件（测试链 13 件坐标） ∥ 披露（核缺位退化 ∥ 路由形名字） ∥ 部署收尾） | —— | —— |
| R62 | → `docs/server/design/agent/ADMIN-AGENT.md` §13（上抛/余项·R62 行；需求档两括注收正（父侧已受理） ∥ 随正件（`prepublishOnly` **57 ⇒ 58**；i18n 两表 +3 键/表） ∥ 披露（无围栏 ∥ 掩蔽面不含文件内容 ∥ `process.kill` 自伤面 ∥ timer 无空闲唤醒 ∥ 核文案指引落空 ∥ 核可达性结论） ∥ 部署收尾） | —— | —— |
| R63 | → `docs/server/design/project/PROJECTS.md` §13（**已裁（乙案）——用户授权：github 成员事件接收端落章**；原上抛行已销） | —— | —— |
| R64 | → `docs/server/design/project/PROJECTS.md` §14（**已裁（补面）——用户授权：项目删除落章**；原上抛行已销） | —— | —— |
| R65 | → `docs/server/design/project/PROJECTS.md` §12（上抛/余项·R65 行；三端可见性） | —— | —— |
| R66 | → `docs/server/design/project/PROJECTS.md` §12（上抛/余项·R66 行；成员同步作用域） | —— | —— |
| R67 | → `docs/server/design/project/PROJECTS.md` §12（上抛/余项·R67 行；「读写能写」机检口径） | —— | —— |
| R68 | → `docs/server/design/project/PROJECTS.md` §12（上抛/余项·R68 行；admin-agent 工具面缺项） | —— | —— |
| R69 | → `docs/server/design/project/PROJECTS.md` §12（上抛/余项·R69 行；gitee 企业成员端点未接 ∥ 自建平台协议口径） | —— | —— |
| R70 | → `docs/server/design/project/PROJECTS.md` §12（上抛/余项·R70 行；**需求档计数回笔（主 agent 笔）**：我的 **6**（注⑱「我的 3 ⇒ 4」= 预记未落——其页由成员面承办；成员面 +1；团队台账 +1）∥ 管理 **十一** ∥ 侧栏 **十七**） | —— | —— |
| R71 | → `docs/server/design/agent/ADMIN-AGENT.md` §13（上抛/余项·R71 行） | —— | —— |
| R72 | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R72 行） | —— | —— |

| R73 | → `docs/server/design/agent/ADMIN-AGENT.md` §13（上抛/余项·R73 行） | —— | —— |
| R74 | → `docs/server/design/ledger/LEDGER.md` §13（上抛/余项·R74 行） | —— | —— |
| R74（sandbox 域） | → `docs/server/design/sandbox/SANDBOX.md` §16（上抛/余项·R74 行） | —— | —— |
| R86 | → `docs/server/design/mcp/MCP.md` §12（上抛/余项·R86 行） | —— | —— |

| R87 | → `docs/server/design/agent/ADMIN-AGENT.md` §13（上抛/余项·R87 行） | —— | —— |

| R88 | → `docs/server/design/agent/ADMIN-AGENT.md` §13（上抛/余项·R88 行） | —— | —— |
