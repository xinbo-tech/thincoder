# Thincoder Server · 设计总览（第一步：token 网关）

> 板块 = server（新部分——代码 `thincoder-server/` ↔ 文档 `docs/server/`，模块镜像）∥ 本档 = 设计**总览**（板级——定位 ∥ 架构总览 ∥ 模块边界与责任地图 ∥ 文档地图 ∥ 决策索引 ∥ 文件与验收总账）——各域细节 = 域档（见 §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（五要素已齐——2026-10-06 用户收口）；本档不复述需求，验收回指 = §7。
> 参考件 = `ai-gateway`（外部项目——**只读参考**：零共享运行面 ∥ 零依赖 ∥ 零代码/文档引用；可借鉴经验 = key 明文只回显一次 ∥ 拒打不落用量 ∥ 计量与业务解耦）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构 + 增长与演进域 + 部署面，沿用户 08:04–08:24 裁定）。
> 范围注：第二步「团队协同」不在本设计集（触发项 = `EVOLUTION.md` §2）；server 入发布序列 = 定向（npm 路——`RELEASE.md` 扩展 = 发布面轮，不在本批；沿用户 08:24 令）。

## 1. 定位与落点

- **一句话**：一台内网常驻的 Node 单进程——OpenAI 兼容入口（chat ∥ embeddings ∥ models），网关代持全部真实 provider key，逐请求记账、按成员限额度；另配登录制控制台（vanilla 静态前端——三视图）与本机运维 CLI（兜底）。
- **落点**：代码 = `thincoder-server/`（新顶层目录——与 `thincoder-core/` ∥ `thincoder-cli/` ∥ `thincoder-vscode/` ∥ `thincoder-desktop/` ∥ `thincoder-render-core/` 同级）；设计档 = `docs/server/design/`（板 2 档 + 域 6 档——见 §2.1 ∥ §3）。
- **形态**：单进程单库（`node:http` + `node:sqlite`）；无构建步骤；纯 ESM（`.mjs`）。
- **零第三方运行期依赖**（沿仓纪律）：全树 import 仅 `node:*` 标准库 + 相对路径；不 import `thincoder-core/*`（论证 = §5 KD-SV-2）。

## 2. 架构总览

### 2.1 模块边界与责任地图

**三层结构（板 → 域 → 档——代码与文档同拍，用户 2026-10-06 08:14 令）**：代码 = `thincoder-server/src/<域>/<档>.mjs`（入口 `bin/` 与静态 `public/` 除外）；文档 = `docs/server/design/<域>/<档>.md`。六域 = gateway ∥ accounts ∥ metering ∥ store ∥ webui ∥ ops（域目录自第一步立；拆分落域内——`EVOLUTION.md` §1-G4）。

| 域 | 代码（本域档） | 职责 | 域档（文档） |
|---|---|---|---|
| 入口（板级） | `thincoder-server/bin/thincoder-server.mjs`（已落盘） | argv ∥ 配置加载 ∥ 首启引导 ∥ 装配/启动 ∥ 停机 | `ops/OPS.md` |
| gateway | `thincoder-server/src/gateway/` 六档（server ∥ routes ∥ forward ∥ sse-tap ∥ providers ∥ errors）（已落盘） | http 服务 ∥ 注册行分派 ∥ OpenAI 三面 ∥ 转发 ∥ usage 旁路扫描 ∥ 模型派发 ∥ 错误形 | `gateway/API.md` |
| accounts | `thincoder-server/src/accounts/` 五档（keys ∥ members ∥ session ∥ routes ∥ routes-admin）（已落盘） | 团队 key ∥ 账号/成员 ∥ 会话/登录 ∥ 密码 ∥ 自助/管理端点 | `accounts/ACCOUNTS.md` |
| metering | `thincoder-server/src/metering/` 三档（usage ∥ quota ∥ routes）（已落盘） | 记账 ∥ 配额 ∥ 用量/配额端点 | `metering/METERING.md` |
| store | `thincoder-server/src/store/` 一档（db）（已落盘） | 库 ∥ DDL ∥ 迁移链（accounts 与 metering 共用） | `store/STORE.md` |
| webui | `thincoder-server/src/webui/` 一档（static）+ `thincoder-server/public/` 四档（静态）（已落盘） | 页面路由 ∥ HTML/JS/CSS ∥ 静态直发 | `webui/WEBUI.md` |
| ops | `thincoder-server/src/ops/` 四档（config ∥ log ∥ cli ∥ presets——后一档拟新增）+ 部署档组（`thincoder-server/deploy/thincoder-server.service` ∥ `thincoder-server/Dockerfile` ∥ `thincoder-server/.dockerignore` ∥ `thincoder-server/docker-compose.yml`）+ 模板/说明档（`thincoder-server/config.example.json` ∥ `thincoder-server/README.md`）（除 presets 外均已落盘） | 配置（含 provider 预设） ∥ 日志 ∥ 运维 CLI ∥ 部署面（npm ∥ Docker ∥ systemd） | `ops/OPS.md` |

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
[4] body → model → providers 精确匹配派发（未命中 ⇒ 404）
[5] 转发上游（网关侧真 key；流式注入 stream_options.include_usage）
[6] 响应透传（SSE 逐块 ∥ 旁路 tap 只读扫描 usage——字节零改）
[7] 记账（usage 行落库——请求结束/流终结/客户端断开时单条 INSERT）
```

**控制台请求**（B 案——登录与会话）：

```text
浏览器（public/ 前端）
  │ POST /api/login {username, password} ──▶ scrypt 校验 ⇒ sessions 落行
  │ ◀─ 200 Set-Cookie: tc_session=…（HttpOnly ∥ SameSite=Strict）
  │ 后续请求携 cookie ──▶ 会话校验（sha256 → sessions ⋈ members）
  │                        ├─ 无/过期会话 ⇒ 401
  │                        ├─ user 触管理端点 ⇒ 403
  │                        └─ 放行 ⇒ 自助面 /api/me* ∥ 管理面 /api/members* 等
  ▼
三视图（#/login ∥ #/me ∥ #/admin）——数据全经 /api/*，判权全在后端
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
| `webui/WEBUI.md` | 域 | webui | 静态面 ∥ 三视图 ∥ 判权/自托管约束 ∥ 本域文件与预算 ∥ 验收判据 |
| `ops/OPS.md` | 域 | ops | 配置面 ∥ 首启引导 ∥ 运维 CLI ∥ 启动/停机/部署面 ∥ 日志 ∥ 本域文件与预算 ∥ 验收判据 ∥ 用例 |

## 4. 决策索引（KD-SV-1–17）

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

## 5. 关键决策（本档）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-1 | **形态 = 单进程单服务**（`node:http`——模块表见 §2.1） | 「内网一台常驻」；团队规模并发；零依赖纪律下无必要拆进程 | 多进程拆（入口/计量分离——无收益增运维）· 引 Web 框架（违零依赖） |
| KD-SV-2 | **不 import `thincoder-core/*`**（含 provider 层） | ① 核 `thincoder-core/provider/sse.mjs` 的 `readSSE` 是消费型（onToken 回调 ∥ 全量累积 ∥ 规则短路 ∥ 120s idle 判定）——中继复用会强制整段消费/再序列化，与「SSE 逐块透传」相抵；② 核 provider 层面向客户端多协议适配（anthropic/google/responses ∥ 重试 ∥ 限速 ∥ 思考映射）——网关零需要；③ 网关要「不认识内容」的代理语义——解析越少越稳。行数影响：自持 `thincoder-server/src/gateway/sse-tap.mjs`（≈80 行）覆盖全部所需（`data:` 行 JSON 取 usage） | **全引 `chat()`**（消费型语义错配 + 强制缓冲）· **引窄叶**（`normalizeUsageCache`——服务客户端缓存语义、网关不需要；`RETRYABLE_STATUS`——本设计不做重试）· **引 `embedding.mjs`**（自带批量/归一化/整流——网关须原样透传与计数，语义不符） |

## 6. 受影响文件与行数预算（总账）

口径：全为新建树——预算 = 实施前估值；已实施落盘：行数 = 实读（口径 = 内容行数 ∥ 文末换行不计），行式 = 实读值（实读日期——设计估），小计 = 预算 ⇒ 实读。全部单档 **≤300 行软线内**（最宽 = `views.mjs` 实读 244——管理视图未出档）；500 硬限未触及；全树实读 **2824 行（32 档）**（含 README 复测校正 +1 与预设面 +63）——对照设计总账 ≈3250（本批达预期 ≈2824 ✓）。

- **板级**：`thincoder-server/package.json`（可发布形：`@thincoder/server`（拟） ∥ `files` 白名单 ∥ `bin` = `thincoder-server` ∥ engines `node>=24` ∥ `prepublishOnly` 门禁；`private` 撤；dependencies 空；实读 25 行（估 ≈30））。
- **各域预算表**（「本域文件与行数预算」节）：gateway **≈770 ⇒ 658** ∥ accounts **≈570 ⇒ 493** ∥ metering **≈260 ⇒ 218** ∥ store **≈175 ⇒ 110** ∥ webui **≈680 ⇒ 558** ∥ ops **≈765 ⇒ 762** —— 合计 **≈3220 ⇒ 2799**
  （+ package.json **≈30 ⇒ 25** ⇒ 总账 **≈3250 ⇒ 2824**；全树 **32 档**）。
- **既有随动**：

| 档 | 改动 | 量 |
|---|---|---|
| `.gitignore`（仓根） | 追加两行：`thincoder-server/data/` ∥ `thincoder-server/config.json`（运行期与本地配置不入库）（机检豁免——部署机本地档） | 现行 35 行 ⇒ 预期 37 行（+2） |
| `docs/server/design/`（本设计集——板 2 档 + 域 6 档） | 建档（本补轮按三层结构 + B 案织入） | 八档 |
| `docs/batches/2026-10-06-server-gateway.md` | §2 批次任务与设计（批档唯一写入面） | append |
| `docs/batches/2026-10-06-server-gateway.test.mjs`（已落盘） | 批内件（单位测试——随批留存；见 §8） | 新建——实读 486 行；另按域拆档五件（`-accounts` 493 ∥ `-metering` 188 ∥ `-chat` 498 ∥ `-webui-deploy` 321 ∥ `-model-ref` 194）——合计六件 |
| `docs/batches/2026-10-06-server-presets.md` ∥ `docs/batches/2026-10-06-server-presets.test.mjs`（已落盘） | 本批（provider 预设）批档 §2 ∥ 批内件（单位测试——随批留存；见 §8） | append ∥ 新建——实读 347 行 |

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
| R2 | **需求留白（设计已定形——供用户复核）**：① 额度单位/周期（token ∥ 自然月——KD-SV-6）② provider key 配置形态（配置档 + 重启——`ops/OPS.md` §1）③ 控制台门禁（登录制——会话 cookie ∥ 角色分面；KD-SV-7 改，2026-10-06） | 披露（不阻塞） | 如用户意图不同 ⇒ 回笔需求或改设计 |
| R3 | **收口轮环境前置**：AC-2 四端实跑需真实上游可达；AC-6 需内网嵌入引擎（或本机 Ollama） | 实施前置 | 收口轮执行前确认 |
| R4 | **批内件写面**：`docs/batches/*.test.mjs` 直写若受阻 ⇒ 落 `.thincoder/tmp/` 父侧 copy | 实施前置（沿先例） | 实施轮处置 |
| R5 | **发布序列**：server 入发布序列 = 定向（npm 路——用户 08:24）；`RELEASE.md` 扩展 = 发布面轮（不在本批——本批只做包体就绪） | 后续轮 | 发布面轮 |
| R6 | **B 案补轮两枚用户裁定（已落实）**：admin 重置 = 在 ∥ 前端 = vanilla 静态文件 | 披露（已落实） | 需求档回笔已办（2026-10-06——需求档变更记录在册） |
| R7 | **AC-9 行（已办）**：功能点 9 验收行已落需求档（`docs/server/requirements/PROJECT.md` 验收表——2026-10-06） | 需求档回笔（主 agent 笔） | 已办（2026-10-06） |
| R8 | **实施后回填**：预算实读（ops 域增量 ∥ 批内件行数）∥ §6 预期值收正 | 实施后设计回填轮（沿先例） | 实施后轮 |

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
