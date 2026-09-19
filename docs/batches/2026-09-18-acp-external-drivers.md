# 2026-09-18 · ACP 外部编排器兼容批（台账 #82）

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮）

### 1.1 批件（用户 2026-09-18 15:06 上报；15:10 指示查证；15:36「**开**」= 立批授权）

**用户原话**：「thincoder 的 acp 与 **cc-connect** 不匹配，想要**居家操控**还缺一点点」。

### 1.2 现状实查（父侧 · 15:1x）

- **cc-connect**（`github.com/chenhg5/cc-connect` · Go · MIT）= **本机 AI agent ↔ IM 枢纽**（13 平台：飞书 / 钉钉 / 微信个人号 / Telegram / Slack / Discord / LINE / WeCom / 微博 / QQ / QQ Bot / Matrix；**多数零公网 IP**）+ Web 管理面 `:9820`；配置 `~/.cc-connect/config.toml`，agent 以 `command = [...]` 拉起。
- **关键**：其 Support Matrix 逐字载「**Agent | ACP (Agent Client Protocol) | ✅ Any ACP-compatible agent**」⇒ **通道存在**，缺口在**我方 ACP 实现面**（非 cc-connect 单点不兼容）。
- **我方 ACP**（id=63 盘点 · 逐条 file:line）：自写精简层，实装 12 agent 方法 + 3 扩展方法 + 5 反向 RPC 通路；stdio 通道 / 会话槽位 / 审批 / IDE diff 桥在位。

### 1.3 缺口清单（id=63 盘点 · 10 条 · 逐条有 file:line）

| # | 缺口 | 实锤要点 |
|---|---|---|
| **G1** 🔴 | **登录无法被外部驱动** | `acp.mjs:141` `authMethods:["terminal"]` **裸字符串**（schema 要含 `id`/`args`/`env` 的对象；参考 kimi `auth-methods.ts:36-47`）· **无 `login` 子命令**（`bin/thincoder.mjs:143-432` 全量 switch 无 login）· `acp --login` **被静默忽略**（`:402-406` 不读 args）· 向导 `isTTY` 门控（`:167`）；**且除 `initialize`/`authenticate` 外所有 handler 首行 `if (!authenticated) → -32000`**（`acp.mjs:151,191,…`）⇒ **客户端不调 `authenticate` 则会话一律起不来** |
| **G2** 🔴 | **`initialize` 响应不合 schema** | `acp.mjs:137-142` 返回 `capabilities`（参考实现均为 `agentCapabilities`）· **不读 params ⇒ 无版本协商** · **不声明 `loadSession`/`sessionCapabilities`** ⇒ 已实现的 `load/list/resume` **客户端可能永不调用** |
| **G3** 🟡 | `fs` 反向 RPC 不查 `clientCapabilities` | `bridge.mjs:104-118 / 285-307` 无条件发 `fs/*` ⇒ 不支持该面的客户端每次 `write`/`edit` **干等 30s 超时**（参考 kimi `server.ts:627-630` 会关闭该面） |
| **G8** 🟡 | 凭据面单路 + **文档-代码漂移** | 只认 `~/.thincoder/config.json` 且强绑 `defaultModel` 解析（`acp.mjs:70-76` + `core/config.mjs:319-322`）——设计档与代码注释声称「env fallback」而**全仓零实现**（`API_KEY` 检索零命中） |
| G4 | 单 cwd 模型 | `session/new` 的 cwd 必等于进程 cwd（`acp.mjs:163-167`），一个进程只能服务一个项目 |
| G5 | sessionId 双命名空间 | `session/list` 返回**槽位号**，而 `prompt/cancel/…` 认 **ACP 会话 id**（`nextId++`）⇒ 列表直喂 = `unknown session` |
| G6 | `session/prompt` 只取首个 text 块 | `acp.mjs:194-195`——image / resource / 多 text 块**静默丢弃** |
| G7 | `mcpServers` 静默忽略 | `acp.mjs:168-170`（仅 stderr 日志，客户端收不到错误） |
| G9 | 无 ACP 端到端测试 | `thincoder-cli/test/integration/` 8 档无一为 ACP；G2/G3 类契约缺口**无回归网** |
| G10 | 文档面 | CLI 树 `ides.md` 已归档而 `thincoder-cli/README.md:52` **仍指 `docs/guides/ides.md`（悬空链接）**；根层 `docs/cli/design/ACP-CLIENT.md` **未收**「Paseo / 登录缺口」注记 |

**现状下唯一可用外部姿势**：预置 `~/.thincoder/config.json`（含 `providers[].apiKey` + **非空 `defaultModel`**）→ 拉起 `thincoder acp`（**进程 cwd = 目标项目**）→ 编排器按 `command = ["thincoder","acp"]` 挂。

### 1.4 批射程（父侧裁定 · 承 1.6 验收口径）

**本批做**：**G1 + G2 + G3 + G8 + G10** + **N1–N4**（设计轮 id=68 新发现 · 父侧 2026-09-18 15:4x 裁定纳入——**N1** `session/new` 返 `{id}` 而契约 `NewSessionResponse.required = ["sessionId"]` ⇒ 客户端拿不到会话 id；**N2** `session/prompt` 读 `params.content` 而契约 `PromptRequest.required = ["sessionId","prompt"]` ⇒ **每请求 −32602**——**N1/N2 不纳则本批「挂得上、用不了」**；**N3/N4** 同族（`SessionInfo.sessionId` · `SessionConfigItem.{id,name}`）同轮）。
**另裁（本批不做 —— 写进设计档「边界」节，明说不做而非默默略过）**：G4 · G5 · G6 · G7 · G9。

### 1.5 设计轮第一任务（硬性 · 不可跳）

**锁死 schema 依据**——id=63 **未连上上游 ACP `schema.json`**（fetch ECONNRESET）⇒ G2 的字段名结论建立在**三份本地参考实现**（kimi `packages/acp-adapter/src/server.ts` · opencode `src/acp/service.ts` · openclaw `src/acp/translator.ts`）的一致上，**未对上游原文核对**。
⇒ 设计轮**必须先取上游 schema**（或给足交叉印证 + 明示置信边界），**再定形改法**；**不得照未核实的形状改**。

### 1.6 验收口径（父侧裁定）

1. **契约合规**——修的是「**不符合 ACP 契约**」，**不是**「迎合某客户端」；每条 AC 须**回指契约条款或参考实现逐字**。
2. **无 TTY 环境可驱动**——认证路径存在且可机判（G1 的核心）。
3. **零回归**——既有 ACP 通道测试与 TUI/CLI 面不破。

### 1.7 边界

- **不做**：G4–G7 / G9（另裁）· **VSC 端对位**（另案）· **cc-connect 侧改动**（外部工具；我们只保证**契约面正确**）· 提示词面正文（父侧落笔，若需）。
- **禁触**：`_archive/**` · `docs/batches/**` · 参照树 · **需求档 `docs/cli/requirements/ACP-CLIENT.md`**（父侧笔——设计出建议文本，父侧落笔）。

### 1.8 台账

- **#82** → 本批（立批时推进为「待设计」→ 设计交付后「在途」）。

### 1.9 用户授权（**父侧代点火 + 代批准** · 本批专用 · 2026-09-18 15:38）

**用户原话**：「**acp 那个你自己跑完吧。**」⇒ 本批链上的**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**（不必逐次请点）——自本批起至本批收口。

**父侧自缚（代签条件）**：
1. 仅在「**评审 pass（0 🔴）** ∧ **修正轮已落地并逐条核验** ∧ **token 已签发**」三条件齐备时代签；
2. 每次代签在 §4 写明「**父侧代签（用户 15:38 授权）+ 依据**」（评审 id / 核验结论 / 发现处置表）；
3. **范围仅限本批**（batch `2026-09-18-acp-external-drivers`）；超出本批或出现「停下上报」级问题 ⇒ 等用户，不自行代裁。

（同族先例：2026-09-11 04:19/04:20「帮我自动点火 + 帮我也自动批准」授权窗口。）

### 1.10 父侧裁定（设计轮 id=68 上抛 · 2026-09-18 15:4x）

| # | 上抛 | 裁定 |
|---|---|---|
| 1 | **N1–N4 是否纳入射程** | **全纳**（N1/N2 必纳——致命契约违规；N3/N4 同族同轮）——已并入 §1.4 |
| 2 | **D17**：G8 改「**收回文档声称**」（不实现 env fallback） | **确认** ✓——**理由采纳**：与现行已裁定 A6（`DOC-CODE-RECONCILE`「env vars are not a key source」· 2026-09-15）直接冲突；且 env 通道属 **CONFIG/PROVIDER 板块**（登记项）。**父侧原倾向（实现）在此收回**——以已裁定口径为准 |
| 3 | `thincoder-cli/README.md` 逐字建议文本 | **批准**（交 eng-coder 落笔 · 产品文本面） |
| 4 | `thincoder-core/config.mjs:11` 注释收正 | **纳入**（同族漂移面第三处） |

## §2 批次任务与设计

### 2.1 设计轮结论（eng-designer · initial）

**设计档落点** = `docs/cli/design/ACP-CLIENT.md`（板块 = ACP 协议 · 编辑器接线）——本轮新增 **§11 外部编排器接入（契约合规面）**（§11.1 依据 / §11.2 G1 / §11.3 G2族 / §11.4 G3 / §11.5 G8 / §11.6 G10 / §11.7 不变量 / §11.8 实施序 / §11.9 边界与登记项）
+ **§3.4 客户端能力快照**（§11.2/§11.4 的共同基座）+ 决策 **D15–D19**；§1 / §2.1 / §2.2 / §4 同步；**撤除全文两处「env fallback」声称**。

**第一任务（锁 schema 依据）已闭环**：一手 = `github.com/agentclientprotocol/agent-client-protocol` `main` 分支 `schema/v1/schema.json`（经 `gh-proxy.com` 镜像实取成功；170 `$defs` · 46 条 `x-method`，as-of 2026-09-18）；二手 = `agentclientprotocol.com/protocol/{initialization,authentication}` v1；
交叉印证 = 本地**四份**实现（`kimi-code/packages/acp-adapter/src/**` · `oh-my-pi/packages/coding-agent/src/modes/acp/**` · `MiMo-Code/packages/opencode/src/acp/agent.ts` · `openclaw/src/acp/**`——**后两份为 id=63 清单之外新发现**）。
**置信边界**：取自 `main` 非 tag ⇒ 结论限该 as-of；`ProtocolVersion` 仅破坏性变更递增 + 新能力走 capabilities ⇒ 字段名在实施窗口内稳定。

### 2.2 🔴 设计轮新发现（**超出 §1.3 十条清单 · 需父侧裁定**）

实核发现 **`session/new` 与 `session/prompt` 两处契约形状违规**——二者均在原 G2「initialize 响应不合 schema」射程**之外**，但使「可挂可用」**不可达**：

| # | 落点 | 契约（schema 逐字段） | 后果 |
|---|---|---|---|
| **N1** | `thincoder-cli/src/acp.mjs:184` 返回 `{ id, configOptions }` | `NewSessionResponse.required = ["sessionId"]` | **客户端拿不到会话 id ⇒ 后续方法全部不可用** |
| **N2** | `thincoder-cli/src/acp.mjs:194-195` 读 `params.content` | `PromptRequest.required = ["sessionId","prompt"]`，`prompt` = `ContentBlock[]` | **每个 prompt 都走 `-32602` ⇒ 会话不可用** |
| N3 | `thincoder-cli/src/acp.mjs:234-240` list 条目键 `id` | `SessionInfo.required = ["sessionId","cwd"]` | 列表项被判非法/跳过 |
| N4 | `thincoder-cli/src/acp.mjs:184/297/346` `configOptions:[{configId}]` | `SessionConfigOption.required = ["id","name"]`（响应侧 `id`；**请求侧** `configId`——不对称属契约本身） | 配置项被 `x-deserialize-skip-invalid-items` 静默跳过 ⇒ 能力不可见 |

**根因旁证**：`thincoder-cli/test/acp-channel.test.mjs`（303 行）**只覆盖 bridge/通道层，不覆盖方法分发**（实核：全文无 `session/new` / `session/prompt` 断言）⇒ 上述形状错位在既有用例中**响应键断言为零**（与 G9 同源）——**表述收窄 · 评审 #8**（原写「从未被任何用例触及」过宽：`test/manifest-flip-refusal.test.mjs:136-184` 直驱 `session/load` / `session/resume`，但是该档**不作响应键断言**）。
**我的建议**：N1 / N2 **纳入本批**（不纳入则本批交付「挂得上、用不了」，与批档 §1.3 目标及 §1.6 验收口径 #1「契约合规」直接冲突）；N3 / N4 建议同批（各为一行级改动，同族同修成本最低）。**裁定权在父侧**——若父侧裁「不做」，我将按回退形态改写 §11.3 的改法节。

### 2.3 受影响文件表（现行行数 = as-of 2026-09-18 实核；尺寸档 = ≤300 提示 / ≤500 硬限——**函数档是第一判据**）

**行数口径（本轮写明——评审 #9）**：下表 = `read` 工具行数（= `find /c /v ""` 换行符数 **+ 1**——`read` 另计一个空尾行；实核本仓各档均如此：`acp.mjs` 492 → 493）。
同口径现行读数：`acp.mjs` 493 · `bridge.mjs` 384 · `session.mjs` 53 · `transport.mjs` 156 · `bin/thincoder.mjs` 433 · `config.mjs` 420 ·
`README.md` 472 · `acp-channel.test.mjs` 303 · `manifest-flip-refusal.test.mjs` 185 · 本设计档 **365**（§9 修正：前值 360 为误记——设计档自记 2026-09-16 收正 362 → 365）。

| 文件 | 现行 | Δ（估） | 落定 | 尺寸档（文件 / 函数） | 笔 |
|---|---|---|---|---|---|
| `thincoder-cli/src/acp.mjs` | 493 | **−363**（迁出 handler 面 ~420 / 新增装配 ~55） | ~130 | 文件 ✅；**单体 `buildAcpHandlers` 368 行 ⇒ 必拆（评审 #3）** | eng-coder |
| **新** `thincoder-cli/src/acp/client-caps.mjs` | — | +115（`initialize` / `authenticate` + 能力快照 + 版本协商 + `authMethods` 构造） | 115 | ✅ / ✅ | eng-coder |
| **新** `thincoder-cli/src/acp/handlers-session.mjs` | — | +170（内存会话族 6 handler + `findSession` / `applyConfigOption` / 门助手） | 170 | ✅ / ✅ | eng-coder |
| **新** `thincoder-cli/src/acp/handlers-slots.mjs` | — | +190（槽族 4 handler + `slotEngineering` / `reattach`） | 190 | ✅ / ✅ | eng-coder |
| **新** `thincoder-cli/src/acp/ext.mjs` | — | +70（**纯搬迁** cited `:412-479` = 68 行 + 头注；前值「−56」= 扣减口径错误——评审 #9） | 70 | ✅ / ✅ | eng-coder |
| **新** `thincoder-cli/src/acp/login.mjs` | — | +60（`--login` 流程） | 60 | ✅ / ✅ | eng-coder |
| `thincoder-cli/src/acp/bridge.mjs` | 384 | +12（fs 门控：`readBuffer` / `writeBuffer` / `toolRouter` + `clientCaps` 透传） | 396 | ⚠️ 文件 >300（既存）；**不拆**（结论见下） | eng-coder |
| `thincoder-cli/src/acp/session.mjs` | 53 | +12（透传 `clientCaps`） | 65 | ✅ / ✅ | eng-coder |
| `thincoder-cli/src/acp/transport.mjs` | 156 | 0 | 156 | ✅ / ✅ | — |
| `thincoder-cli/bin/thincoder.mjs` | 433 | **+9**（`case "acp"` 读 args + `--login` 分派 + `USAGE` 行·评审 #10；前值 +8 未含 USAGE） | 442 | ⚠️ 文件 >300（既存）；**不拆**（结论见下） | eng-coder |
| `thincoder-cli/README.md` | 472 | ±1 + 1 行（悬空链接 §11.6 + 登录入口句） | ~473 | — | eng-coder（**产品文本面**） |
| `thincoder-core/config.mjs` | 420 | 1 行注释收正（`:11`） | 420 | ⚠️ 文件 >300（既存）；**不拆**（结论见下） | eng-coder（跨包） |
| **新** `thincoder-cli/test/acp-contract.test.mjs` | — | +130 | 130 | ✅ / ✅ | eng-coder |
| `docs/cli/design/ACP-CLIENT.md` | **365** | +215（初始轮）· **+67**（本修正轮） | **647**（2026-09-18 修正轮后实测·`read` 口径） | 文档（无行数限） | **eng-designer（已落）** |
| `docs/batches/2026-09-18-acp-external-drivers.md` §2 | — | 本段 + **§2.8** | — | — | **eng-designer（本段）** |

**`acp.mjs` 拆分方案（函数档判据驱动 · 评审 #3 收正）**

`buildAcpHandlers` = **单函数 368 行**（`acp.mjs:99`–`:466`；含 jsdoc 375）⇒ 越函数档线（≥300 必拆——`docs/core/requirements/METHODOLOGY.md` F3-1），**不因文件 ≤500 豁免**。本批既改其 12 个 handler 中的 10 个，**当轮拆**（细化 = 设计档 §3.5）：

① **纯搬迁**：`checkpoint/*` + `memory/*` 五 handler + `ensureAcpMemory()`（现行 `:412-479` = **68 行**）→ `src/acp/ext.mjs`（工厂形 `createExtHandlers(ctx)`，零语义）；
② **方法族抽出**：auth/initialize 面（版本协商 / 快照 / `authMethods` 构造）→ `client-caps.mjs`；内存会话族 → `handlers-session.mjs`；持久化槽族 → `handlers-slots.mjs`（拆两支而非一支：单支合计 ≈300 行，仍贴线）；
③ **入口只留装配与转发**：`buildAcpHandlers` 保留签名与 `{ handlers, sessions, notifyRef, requestRef }` 返回形状（**唯一外部契约**——两档既有测档直驱它 ⇒ 拆分零回归），内部改为合并四族 + 共享 `ctx`（`{ getCwd, sessions, allocSessionId, notifyRef, requestRef, createSession, requireConfigured, log }`）。

⇒ `acp.mjs` 493 → **~130**（单体函数 368 → **~35**）；四个新模块逐档 ≤190。受影响面与逐档读数 = 本表（一次性材料）。

**三个 >300 文件的拆/不拆结论（评审 #3 要求·逐档一句）**

- `bridge.mjs`（384 → 396）：**本批不拆**——改动面 = 既有闭包内门控条件（`readBuffer` `:104-118` / `writeBuffer` `:112` / `toolRouter` `:282-309`），**无新增函数**；最大单体 `buildAcpCallbacks`（`:59`–`:312` = 254 行，含文档注 ≈263）本批 +12 ⇒ ≈275，**仍在 300 内（余量 ~25）**。触发条件 = 该函数下次实质增量预计越 300，或文件越 500 ⇒ 抽 `fs 桥` / `审批桥` 子模块。
- `bin/thincoder.mjs`（433 → 442）：**本批不拆**——命令分派 = 顶层 `switch`（`:143` 起，模块作用域、**非函数**），各 `case` 独立块；**全档无 ≥300 行函数**；文件 >300 为存量。触发条件 = 任一 `case` 块自身越 300 行 ⇒ 该子命令抽 `src/cli/<name>.mjs`（本批 `--login` 即按此形态：新增 `src/acp/login.mjs`）。
- `thincoder-core/config.mjs`（420 → 420）：**本批不拆**——本批只改 1 行注释（`:11`），零结构改动；该档既有拆档史在册（`config-migrate.mjs` / `config-io.mjs` 已拆出，头注 `:17` / `:20` 自记）。触发条件 = CONFIG / PROVIDER 板块批实质改动此档时随批评估。

### 2.4 AC 与用例（可机判 · 逐条回指契约条款或参考实现）

| # | 类 | AC（机判） | 回指 |
|---|---|---|---|
| AC1 | 正常 | `initialize` 响应 `agentCapabilities.loadSession === true` 且 `sessionCapabilities` 含 `list`/`resume`/`delete`/`close` 四键（各 `{}`）；`result.capabilities === undefined` | schema `AgentCapabilities` / `SessionCapabilities` |
| AC2 | 边界 | `initialize {protocolVersion:1}` → 响应 `protocolVersion === 1`；`{protocolVersion:5}` → 响应 `=== 1`（最新支持） | 文档「Version Negotiation」逐字 |
| AC3 | 正常 | `clientCapabilities.auth.terminal === true` → `authMethods` 长 1、`[0].id`/`.name` 皆 string、`[0].type === "terminal"`、`[0].args` 含 `"--login"` | `AuthMethodTerminal` required + MUST |
| AC4 | 边界 | `auth.terminal` 为 `false` **或** `clientCapabilities` **整个省略** → `authMethods === []` | 同上（缺省 = UNSUPPORTED） |
| AC5 | **正常·核心** | 脚本化 stdio 客户端（**全程不发 `authenticate`**、无 TTY）+ 凭据就绪：`initialize` → `session/new` 返回含 `sessionId` → `session/prompt {sessionId, prompt:[{type:"text",text:"…"}]}` 返回 `stopReason === "end_turn"` | schema `session/new` 方法描述逐字「May return an `auth_required` error if the agent requires authentication.」（锚收正 · 评审 #5）；N1/N2 同证；**= 「无 TTY 可驱动」主判据** |
| AC6 | 错误 | `isConfigured()` 注入 `false` → `session/new` 返回 `error.code === -32000` | `AuthRequired` 错误码（schema `ErrorCode` = −32000） |
| AC7 | 错误 | `authenticate {methodId:"nope"}` → `error.code === -32602`（**唯一断言**） | schema `authenticate` 方法描述逐字「Called when the agent requires authentication before allowing session creation.」+ 参数 `methodId`「Clients MUST NOT pass a terminal method.」 |
| AC7b（**不作断言 · 仅存注**） | — | 原后半「已宣告时 `{methodId:"terminal"}` → `result` 深等于 `{}`」**删除**（评审 #6）：契约**禁止**客户端以 `terminal` 方法调 `authenticate`（文档 Authentication 逐字「Clients MUST NOT pass a terminal method.」/「the Client MUST NOT send an `authenticate` request for a terminal method.」）⇒ 原断言锁的是**宽容越过契约的非法调用**，不是契约要求。实现若对此宽容返回 `{}` 属**实现自由**——不入 AC | — |
| AC8 | 错误·边界 | 非 TTY 下 `thincoder acp --login`（stdio 重定向）**不挂死**：限时内退出且 `exitCode !== 0`、stderr 含可行动文案 | `AuthMethodTerminal`「A zero exit status signals success; any other termination signals failure」 |
| AC9 | 边界 | 省略 `clientCapabilities.fs` → `toolRouter("write", {path, content})` 返回 `{handled:false}` 且**零** `fs/write_text_file` 请求（断言 `request` 未被调用）；`fs:{writeTextFile:true}` → `{handled:true}` + 1 次请求；edit 对 `readTextFile` 同判 | `FileSystemCapabilities` 默认 `false` + 文档 UNSUPPORTED；同构 = kimi `server.ts:626-636` |
| AC10 | 正常 | `session/list` → `result.sessions[]` 各项含 `sessionId`(string) + `cwd`，**不含** `id` 键 | `SessionInfo.required` |
| AC11 | 正常 | `session/new` 的 `configOptions[]` 各项含 `id` + `name`(string)，不含 `configId` | `SessionConfigOption.required` |
| AC12 | 边界 | **handler = `session/new` · 错误码 = `-32000`**：`providers[].apiKey` 在位而 `defaultModel` 未设 ⇒ `error.code === -32000` ∧ `error.message` 含子串 `defaultModel`（来源 = `config.providerInvalidReason` ← `defaultModelReason`——**复用既有单源文案，非新造**） | §11.5「判据拆分」——② 分支的判据 = 姐妹探针 `providerStatus()` 的 `{ok:false, keyPresent:true, reason}`（同注入位；文本源 `model-ref.mjs:58-66`）；**载体可达性 = 评审 #1 收正项** |
| AC13 | 正常 | **代码面零残留（目标集 = §2.7 修正1 收正集）**：① `grep -rn "env fallback" thincoder-cli/src thincoder-core/ thincoder-cli/README.md` = **0**；② **站点级词形**（评审 #2 新增）：`grep -rn "fall back to environment" thincoder-core/config.mjs` = **0** ∧ 在场断言 `grep -n "not a key source" thincoder-core/config.mjs` = **1**（改后注释逐字目标见 §11.5「代码注释面收正」） | D17 裁定（收回声称）· §1.10#4（`config.mjs:11` 站点）· **评审 #2 收正**（原全表 `docs/` 写法与 §2.7 修正1 自相冲突，且打不中 `:11`——该处原文无 `env fallback` 串） |
| AC14 | 正常 | `grep -n "docs/guides/ides.md" thincoder-cli/README.md` = 0；新目标 `../docs/cli/design/ACP-CLIENT.md` 命中且文件存在 | §11.6 裁定 |
| AC15 | 零回归 | `cd thincoder-cli && npm test` 全绿；`test/acp-channel.test.mjs` **零修改**通过；`test/manifest-flip-refusal.test.mjs` **零修改**通过（判据 = **形状收敛不破**：该档 `:136-184` 直驱 `session/load` / `session/resume`，只断言 `!r.error` / reason 句 / `createSession` 计数——见设计档 §11.8） | 批档 §1.6 #3 · **评审 #8 收正** |

**用例覆盖（正常 / 边界 / 错误）**：正常 = AC1 / AC3 / AC5 / AC10 / AC11 / AC13 / AC14；边界 = AC2 / AC4 / AC8 / AC9 / AC12；错误 = AC6 / AC7。宿主 = 新档 `thincoder-cli/test/acp-contract.test.mjs`（handler 直调）+ AC5 一条脚本化 stdio 冒烟。

### 2.5 提示词面

**不涉**——本批无新增/修改提示词槽位、工具描述或注入锚（G1–G3/G8 全在协议与 CLI 分派层；G10 的 README 段非提示词正本）。⇒ **无逐字建议文本**。

### 2.6 上抛项（待父侧裁定）

1. **§2.2 的 N1–N4 是否纳入本批射程**（我建议 N1/N2 必纳——硬阻塞；N3/N4 建议同纳）；若否，我按回退形态改写 §11.3。
2. **D17 裁定确认**：§1.5/父侧原倾向「实现 env fallback」，我裁定**收回文档声称**（理由三条见 §11.5）——需父侧确认或推翻。
3. **`thincoder-cli/README.md` 修正的落笔**：属**产品文本面**（对外发布契约，非工程工具面）⇒ 由 eng-coder 随实施落，**非我笔**；逐字建议文本 = 把 `[docs/guides/ides.md](docs/guides/ides.md)` 改为 `[docs/cli/design/ACP-CLIENT.md](../docs/cli/design/ACP-CLIENT.md)`，同段补一行登录入口 `thincoder acp --login`。
4. **`thincoder-core/config.mjs:11` 注释收正**（跨包 · core）是否纳入本批——同属「env fallback」漂移面（第三处）。

### 2.7 同轮修正（交付前自检）

**修正 1 · AC13 表述收正**：原写「`grep -rn "env fallback" docs/ …` 命中 **0**」——**该表述会误报**：撤回叙述本身必然含该串。
收正为：**代码面零残留**（可机判）= `grep -rn "env fallback" thincoder-cli/src thincoder-core/ thincoder-cli/README.md` = **0**（`_archive/**` 除外）；
**设计档面** = 两处「声称」位（`docs/cli/design/ACP-CLIENT.md` §2.1 `authenticate` 行 · §4）已无该串——实核余 **4** 处全在 **D17 / §11.5 / 变更记录**（撤回叙述，属**应有**内容）。

**修正 2 · 受影响文件表体量读数收正**：`docs/cli/design/ACP-CLIENT.md` 360 → **580**（表中前值 ~535 为估算；实际落笔 §11 = 376–565 行 + §3.4 + 决策 5 行 + 变更记录 6 行）。最大行宽 **286** 字符（< 300 判据）。

**修正 3 · 机检读数（按档归属零新增 · AC15 判据面）**：`cd thincoder && node scripts/doc-check.mjs`
- 首跑（本轮落地后）：`FAIL(锚): 8 条悬空`（其中 **3** 条属本档：`:18` / `:385` 的 `schema/v1/schema.json`、`:514` 的 `docs/guides/ides.md`）· `FAIL(行宽): 5 行`（其中 **1** 条属本档：`:18`，343 字符）。
- 收正后复跑：`FAIL(锚): 5 条悬空` · `FAIL(行宽): 4 行`——**余量 = 既存基线**（悬空：`docs/core/design/AGENT-LOOP-SUBAGENT.md:417` · `CORE-UNIFICATION.md:515` · `DOC-DISCIPLINE.md:503` · `SESSION.md:238` · `WORKSPACE.md:18`；行宽：`CONTEXT-COMPACTION.md:303` · `prompts/persona-engineering.md:137`/`:139` · `core/requirements/CONTEXT-COMPACTION.md:27`）——**均不在 ACP 档** ⇒ **本档归属零新增** ✅。
- 收正手法（供后续档复用）：① 悬空路径 token 改**去掉扩展名**的目录形态（`schema/v1`——机检路径 token 需扩展名，故不触发）；② 必须逐字保留的悬空路径（如 README 待修行）放入 **fenced 块**（机检整块跳过）；③ 超宽行按语义**折行**（表格行本身豁免，仅正文行计入）。

**修正 4 · 域外提示**：`docs/batches/**` **不在** `doc-check` 扫描域（实核：全量报告中零 `batches` 行）⇒ §2 内出现精确路径 token（如 `schema/v1/schema.json`）**不构成**机检违规；本段保留精确形态以便追溯。

### 2.8 评审修正轮落位（2026-09-18 · eng-designer · 评审 §3 轮次 1 · 12 条逐条）

**轮次自证**：本轮 = 设计评审（**pass · 🔴0 / 🟡4 / 🔵8**）的**修正轮**。改动 = 设计档 `docs/cli/design/ACP-CLIENT.md`（§2.1 / §3 图 / **§3.5 新增** / §3.3 / §11 各节 / 变更记录）+ 本档 §2（§2.2 / §2.3 / §2.4 **就地收正** + 本块）。
**零触碰**：实现面代码（`thincoder-cli/src/**` · `bin/**` · `thincoder-cli/README.md` · `thincoder-core/**`）· 需求档本体（父侧笔）· 冻结文档（`DOC-DISCIPLINE.md` / `DOC-MIGRATION.md` / `SEND-STALL-DISTILL.md` / 死名批 / 判据面批面）· 未点火复审 · 未 commit · 未碰台账。
**行数口径（本轮写明）**：`read` 工具计数（= `find /c /v ""` + 1；末行有换行符者计一空尾行）。设计档 647 · 本档 227+ · `acp.mjs` 493 · `bridge.mjs` 384 · `bin/thincoder.mjs` 433 · `config.mjs` 420。

**逐条落位表（发现号 → 改了什么 → 改动 file:line → 读数 / 理由）**

| # | 级 | 处置 | 改动（file:line） | 读数 / 理由 |
|---|---|---|---|---|
| 1 | 🟡 | ✅ 落 | 设计档 §11.5「判据拆分」（`ACP-CLIENT.md:554-572`）· §11.7 判据 4（`:592`）· 批档 AC12（`:160`） | ② 的判据 = **姐妹探针** `providerStatus()` → `{ok, keyPresent, reason}`；reason 源 = `config.providerInvalidReason`（`config.mjs:319-322` → `defaultModelReason`，`model-ref.mjs:58-66`——该串 defaultModel 未设时**逐字含 `defaultModel`**）；落点 = 门助手（`session/new` 为首触点），② 分支把 reason 拼进 `-32000` 的 message。**旧因（`isConfigured()` 单布尔分不了 ①②⇒该分支永不执行）已消**；`isConfigured` 注入口**不动** ⇒ AC6 与 `manifest-flip-refusal` 的 `isConfigured: () => true` harness 零改 |
| 2 | 🟡 | ✅ 落 | 批档 AC13（`:161`）· 设计档 §11.5「代码注释面收正」（逐字目标 `:570-571`） | AC13 目标集 = §2.7 修正1 收正集；`config.mjs:11` 单列**站点级断言**（`fall back to environment` 零残留 ∧ `not a key source` 在场——改后注释逐字目标由设计档给定）。实核：旧全表写法对该行**改动前即通过**（原文「API key can fall back to environment variables…」不含 `env fallback`）⇒ 修正后判据**可证伪** |
| 3 | 🟡 | ✅ 落（取向 = **拆**） | 设计档 **§3.5 新增**（`ACP-CLIENT.md:129-151`）· §3 架构图（`:68-85`）· 批档 §2.3 全表 + 拆分方案 + 三档结论（`:104-142`） | 判据 = **函数档第一判据**（`docs/core/requirements/METHODOLOGY.md` F3-1 ≥300 必拆）⇒ `buildAcpHandlers` 368 行**当轮拆**为四模块 + 入口装配；bridge 396 / bin 442 / config 420 各一句**不拆结论 + 触发条件**（见下「发现 3 取向」段） |
| 4 | 🟡 | ✅ 落 | 批档 §2.8「一手 schema 实物留档」（本块下节）· 设计档 §11.1 实物留档指针（`:429-431`） | 留档 = 镜像 URL + 字节数 + **SHA256** + 相关 `$def` 摘录（`required` / MUST 逐字）+ 复取命令。复取实测（本轮）= HTTP 200 · **247168 B** · 170 `$defs` · 46 `x-method`（与 §11.1 记值一致 ✓）⇒ 字段级结论事后可复核 |
| 5 | 🔵 | ✅ 落 | 设计档 §11.2 契约条文（`:438-441`）· §4（`:156`）· 批档 AC5（`:152`）· AC8 回指（`:158`） | 两串**各自逐字确证、锚不同源**（schema `AuthMethodTerminal.description` ∥ 文档 Authentication § Terminal authentication）⇒ 改「两处上游文本，**非同一条**」并列 + **AC8 统一回指 schema 串**。同族锚收正 = `NewSessionRequest` → 「schema `session/new` 方法描述」（G1-c `:452`；实核该句住 `ClientRequest` union 的方法描述，非 `*Request` def） |
| 6 | 🔵 | ✅ 落 | 批档 AC7（`:154`）+ AC7b 存注行（`:155`） | 后半断言**删除**，改「契约禁止客户端以 `terminal` 调 `authenticate`」（文档逐字两处）的**存注**——不作断言；前半 `-32602` 为唯一断言 |
| 7 | 🔵 | ✅ 落 | 设计档 §11.3 边界行（`:518-523`）· §3.3（`:111`） | 明写：list/load/resume/delete 认**槽位号**（`acp.mjs:235` `String(s.slot)`）；prompt/cancel/close/set_* 认 **ACP 会话 id**（`nextId++`）⇒ list→prompt 仍 `unknown session`（G5 不做，§11.9 登记项保留） |
| 8 | 🔵 | ✅ 落 | 设计档 §11.8 回归面（`:598-604`）· 批档 AC15（`:163`）· §2.2 表述收窄（`:101`） | 点名 `test/manifest-flip-refusal.test.mjs:136-184`（判据 = **形状收敛不破**；harness 注入 `isConfigured: () => true` ⇒ 认证门改造不破）；「从未被任何用例触及」→「**响应键断言为零**」 |
| 9 | 🔵 | ✅ 落 | 批档 §2.3 表（`:106-126`）+ 口径注（`:106-109`） | 设计档行 = **365 → 580 → 647**（实核；前值 360 = 误记）；`−56` → **`−363`**（迁出 handler 面 ~420 / 新增装配 ~55）；ext 行改「+70（cited `:412-479` = **68 行** + 头注）」；全表补行数口径注 |
| 10 | 🔵 | ✅ 落 | 设计档 §11.2 改法 4（`:467-473`）· 批档 §2.3 bin 行（`:121`） | `USAGE` 行**逐字给定**（`  thincoder acp --login     Authenticate this machine for ACP clients (terminal auth flow), then exit`）+ bin Δ **+8 → +9**（落定 442）；代码落笔 = 实现轮 |
| 11 | 🔵 | ✅ 落 | 设计档 §11 头注 as-of（`:413-414`）· §11.2 G1-a/G1-c（`:450` / `:452`）· §11.5 漂移面行（`:545`）· §11 头注 D2 指针 | 行号逐条校正：`:141`→`:140` · `:111`→`:112` · 唯一置真路径 `:145-147`→**`:146`**；「本档 `:31,110`」→ **结构化指针**（§2.1 `authenticate` 行 · §4 凭据来源段——两处声称已撤，行号不再适用）；「D2 单一权威源」→ **直述 + 指针**（`docs/core/design/DOC-DISCIPLINE.md` §1 D2，实核 `:17`）——与 §9 决策 D2 撞名消解 |
| 12 | 🔵 | ✅ 落（**建议文本**，需求档 = 父侧笔） | 本块末节「需求面建议文本」（逐字） | 需求档 `docs/cli/requirements/ACP-CLIENT.md`（128 行）无 `--login` 入口与契约合规不变量条目 ⇒ 给 **F4 增补（R-A4.1–A4.3）+ 新 F8（R-A5.1–A5.7）+ 新 N8** 逐字文本 + 变更记录两处「§7 体量」自指收正文本。**需求档本体零触碰** |

**观察项（未派 / 未处置 · 报告）**

1. **评审 §3 尾「范围外注」2 条**（评审员原文：「均在本轮声明目标（§11 / §3.4 / D15–D19）之**外**」⇒ 本轮**未派、未处置**）：① 设计档 `:276-277` 引 `thincoder-cli/src/acp.mjs:77` / `:83`（盘上实在 **`:81`** / **`:87`**）；② `:317` 仍把 ⟦ev⟧ 枚举白名单写作「现状缺陷」，而盘上已是形态判据（`bridge.mjs:188`）+ 负例用例。若父侧纳入 ⇒ 两处各一行 edit。
2. **拆分落地后的坐标二次漂移**：`ACP_EXCLUDED_TOOLS` / `defaultCreateSession` 留在入口 `acp.mjs` 但行号必变 ⇒ §7.1 的两处坐标（`:276-277`）实施后再次失效。建议实现轮落拆分时按同法加 as-of 注（或改按符号名定位）。
3. **需求档「§7 体量」自指第二处**（评审只点 `:127`）：`:123`（2026-09-16 条）亦写「§7 体量读数同步」——一并给收正文本（见末节）。
4. **全仓行宽基线漂移（非本批）**：`FAIL(行宽)` 4 → **6** 行，新增 2 行在 `docs/core/requirements/ADVISOR-CONVERGENCE.md:129` / `:224`（他批/并行线产物——**本批零触碰**，如实登记）。

**发现 3 的取向与理由（二选一：拆 vs 登记 —— 取向 = 拆）**

- **为何必须拆**：判据不是「文件 ≤500」，而是**函数档第一判据**——`docs/core/requirements/METHODOLOGY.md` F3-1「函数 ≥300 必拆骨干」+ `docs/core/design/prompts/advisor-design.md` 第 8 条「文件 ≤500 行而含 300+ 行单体函数**仍不合规**」。`buildAcpHandlers` = **368 行**（`acp.mjs:99`–`:466`）且本批改其 12 个 handler 中的 10 个 ⇒ 「下次触碰」= 本批；登记 = 把债原样搬到下一批（违「撞错结构就改」）。
- **为何可行**：接缝 = `buildAcpHandlers(deps)` 的**外部契约**（签名 + 返回 `{handlers, sessions, notifyRef, requestRef}`）——**不动它**，两档既有测档（`acp-channel` / `manifest-flip-refusal`）的直驱路径零改 ⇒ 结构性零回归；共享态经单一 `ctx` 传（**会话 id 分配器与会话族共享** ⇒ 命名空间不裂）。
- **代价（如实）**：新增档从 3 → **5**（`handlers-session` / `handlers-slots` 拆两支——单支合计 ≈300 行仍贴线）；`acp.mjs` 493 → **~130**，`buildAcpHandlers` 368 → **~35**（装配）。
- **不拆的三档（结论 + 触发条件 · 全文 = §2.3 末段）**：`bridge.mjs`——改动面全在既有闭包内、最大单体 `buildAcpCallbacks`（`:59`–`:312` = 254 行）本批 +12 ⇒ ≈275 **仍 <300**；`bin/thincoder.mjs`——命令分派 = 顶层 `switch`（非函数），**全档无 ≥300 行函数**；`config.mjs`——1 行注释、零结构改动。三者均写**触发条件**（越 300 / 越 500 / 下次实质改动）。

**AC12 / AC13 判据（可跑 · 命令形态）**

**AC12**（handler 直调 · 真实配置链 · 沙箱不碰用户目录）：

```js
// thincoder-cli/test/acp-contract.test.mjs（新增用例；宿主 = node --test）
_setConfigPathForTest(<tmp>/config.json)        // 写入 providers:[{name,apiKey,baseURL}]，**不写 defaultModel**
const { handlers } = buildAcpHandlers({ log: () => {} })   // isConfigured / providerStatus 走默认实现
const r = await handlers["session/new"]({ cwd: process.cwd(), mcpServers: [] })
assert.equal(r.error.code, -32000)              // 命名 handler = session/new；错误码 = -32000
assert.match(r.error.message, /defaultModel/)   // 文案源 = config.providerInvalidReason（非新造）
_resetConfigPathForTest()
```

**AC13**（三条 grep · 代码面 · 目标集 = §2.7 修正1 收正集）：

```bash
grep -rn "env fallback" thincoder-cli/src thincoder-core/ thincoder-cli/README.md   # 期望 0
grep -rn "fall back to environment" thincoder-core/config.mjs                        # 期望 0
grep -rn "not a key source" thincoder-core/config.mjs                                # 期望 1（改后注释在场）
```

本轮**改动前基线实核**：① `env fallback` = `thincoder-cli/src/acp.mjs:69` **1 处**（`_archive/**` 另 2 处在 `thincoder-cli/docs/_archive/design/ACP-CLIENT.md:37` / `:105`——AC13 明示除外）；② `fall back to environment` = `thincoder-core/config.mjs:11` **1 处**；③ `not a key source` 于 `config.mjs` = **0 处** ⇒ 三条**均可证伪**（改前 1/1/0，改后 0/0/1）。

**一手 schema 实物留档（发现 4）**

- **来源**：`agentclientprotocol/agent-client-protocol` · `main` 分支 · `schema/v1/schema.json`（经 `gh-proxy.com` 镜像取 `raw.githubusercontent.com`）。
- **as-of**：2026-09-18 · **247168 字节** · **SHA256 `3c17bd6385d90cf672d8a661fddc359d73422cf8b8ce6865213d25cfd4c0eca7`** · **170 个 `$defs`** · **46 条 `x-method`**（与设计档 §11.1 记值一致 ✓）。
- **复取命令（任一平台）**：

```bash
curl -L -o schema.json "https://gh-proxy.com/https://raw.githubusercontent.com/agentclientprotocol/agent-client-protocol/main/schema/v1/schema.json" && sha256sum schema.json
# Windows: Get-FileHash -Algorithm SHA256 .\schema.json
```

  与上行 `sha256` **逐字比对**即完成复核；不一致 ⇒ 上游已变，字段级结论须按新 as-of 重核。

- **相关 `$def` 摘录（逐字 · 只摘本批结论所依赖的字段）**：

```text
AuthMethodTerminal — required = ["id","name"]；description:「… Agents MUST advertise this method only when the client enabled its
  terminal authentication capability. A zero exit status signals success; any other termination signals failure.
  The client MUST NOT pass this method to `authenticate`.」；args:「Additional arguments to append to the configured agent
  invocation for terminal auth.」
AuthCapabilities.terminal — type boolean, default false；「The client should set this to `true` only when it can reproduce the
  configured agent invocation in an interactive terminal. When `true`, the agent may include `terminal` entries …」
AgentCapabilities — loadSession(bool, default false) / promptCapabilities(default {image:false,audio:false,embeddedContext:false})
  / mcpCapabilities(default {http:false,sse:false}) / sessionCapabilities(default {}) / auth(default {})
SessionCapabilities — list / delete / additionalDirectories / resume / close（各「Omitted or `null` both mean the agent does not
  advertise support. Supplying `{}` means … supports」）；基线句「As a baseline, all Agents MUST support session/new,
  session/prompt, session/cancel, and session/update.」
InitializeRequest — required = ["protocolVersion"]；clientCapabilities 缺省 = {fs:{readTextFile:false,writeTextFile:false},
  terminal:false, auth:{terminal:false}}
InitializeResponse — properties = protocolVersion / agentCapabilities / authMethods / agentInfo / _meta；required = ["protocolVersion"]
  （**无 `capabilities` 键**）
NewSessionResponse — required = ["sessionId"]
PromptRequest — required = ["sessionId","prompt"]（prompt = ContentBlock[]）
SessionInfo — required = ["sessionId","cwd"]
SessionConfigOption — required = ["id","name"]（响应侧）；SetSessionConfigOptionRequest — required = ["sessionId","configId"]（请求侧）
FileSystemCapabilities — readTextFile / writeTextFile（各 type boolean, default false）
方法描述（ClientRequest union）· session/new:「May return an `auth_required` error if the agent requires authentication.」
方法描述 · authenticate:「Called when the agent requires authentication before allowing session creation.」
```

**机检读数（`node scripts/doc-check.mjs` · cwd = 仓根 · 2026-09-18 修正轮）**

- **首跑（§3.5 落笔后）**：本档 `docs/cli/design/ACP-CLIENT.md` 新增 **6 条悬空**——`:138-142` 五条（§3.5 表内**未创建**的新档路径）+ `:462` 一条（`src/acp/login.mjs`）。
- **收正手法**（承 §2.7 修正3 手法①）：新档名按**无扩展名**形态书写（机检路径 token 需扩展名 ⇒ 不触发）+ §3.5 表下补「档名形态注」；**逐字路径与行数预算移入本档 §2.3**（`docs/batches/**` 不在扫描域——§2.7 修正4）。
- **复跑（终态）**：`FAIL(锚): 5 条悬空` · `FAIL(行宽): 6 行`——**闸态 ✗ 逐条核过，ACP 设计档 / 需求档零命中** ⇒ **本档归属零新增** ✅。
  余量 = 既存基线（悬空 5：`AGENT-LOOP-SUBAGENT.md:417` · `CORE-UNIFICATION.md:515` · `DOC-DISCIPLINE.md:509` · `SESSION.md:238` · `WORKSPACE.md:18`；行宽 6：`CONTEXT-COMPACTION.md:303` · `prompts/persona-engineering.md:137` / `:139` · `requirements/ADVISOR-CONVERGENCE.md:129` / `:224` · `requirements/CONTEXT-COMPACTION.md:27`）。
  （行宽面 4 → 6 的 2 行为**他批/并行线产物**，本批零触碰——观察项 4。）

**需求面建议文本（发现 12 · 逐字 · 需求档 = 父侧落笔，本角色只出文本）**

> 落点 = `docs/cli/requirements/ACP-CLIENT.md`（现 128 行 · 本档止于 §6）。编号承既有块序（F5→R-A1.x · F6→R-A2.x · F7→R-A3.x ⇒ 本批两块 = **A4**（F4 增补）· **A5**（新 F8））。
> 依据 = 设计档 `docs/cli/design/ACP-CLIENT.md` §11.2（G1）/ §11.3（G2 族）/ §11.4（G3）/ §11.5（G8）/ §11.7（不变量 1–6）。

**（1）F4 行改述（§2 功能表，替换现文本）**

| **F4** | 登录态与会话复用 | 复用终端配置（`~/.thincoder/config.json`）；会话存档按槽位 load / resume / list / delete；每回合末存档；**并提供 `thincoder acp --login` 入口**（判定句见下） |

**§2 末尾追加（F7 判定句之后）：**

**F4 判定句（登录入口 · R-A4）**

- **R-A4.1**：`thincoder acp --login` = 终端认证流程入口（`initialize.authMethods` 的 `terminal` 项 `args = ["--login"]` 即指向它）：进入设置向导 → 校验并补齐 `defaultModel` → 成功 **exit 0**；失败或非交互终端 ⇒ stderr 一行可行动文案 + **非 0 退出**（不静默挂死）。
- **R-A4.2**：`--login` **不进 stdio 服务模式**；不带 `--login` 的 `thincoder acp` 行为零变。
- **R-A4.3**：CLI `USAGE` 列出该入口（`thincoder acp --login` + 一句用途）。

**（2）新 F 条目（§2 功能表末行 + 判定句）**

| **F8** | **ACP v1 契约形状合规（外部编排器可挂可用）** | 见下判定句 |

**F8 判定句（契约形状合规 · R-A5）**

- **R-A5.1**：`initialize` 响应**只**含契约字段（`protocolVersion` / `agentCapabilities` / `authMethods` / `agentInfo` / `_meta`）；能力面**如实声明**（`loadSession` + `sessionCapabilities{list,resume,delete,close}`；不虚报 image / audio / embeddedContext；未实现的 `mcpCapabilities` / `additionalDirectories` 不声明）。
- **R-A5.2**：`protocolVersion` 按「支持则回同版本、否则回最新支持」协商（当前支持集 = `{1}`）。
- **R-A5.3**：`authMethods` = **对象数组**（`id` / `name` 齐备）；含 `terminal` 项 **⟺** `clientCapabilities.auth.terminal === true`（契约 MUST）。
- **R-A5.4**：会话方法响应形状——`session/new` 含 `sessionId`；`session/list` 条目含 `sessionId` + `cwd`；`configOptions` 条目含 `id` + `name`；`session/prompt` 入参取自 `params.prompt`。
- **R-A5.5**：`fs/*` 反向 RPC 发出前必过客户端能力位（`readTextFile` / `writeTextFile`）；未宣告 ⇒ 回落本地（不得干等超时）。
- **R-A5.6**：认证语义 = **凭据即时判据**（无跨调用闩锁）：`authenticate` 是**可选确认动作**（成功返回 `{}`；契约**禁止**客户端以 `terminal` 方法调它）；凭据不可解析 ⇒ `-32000` 且文案可行动（无 key ⇒ 指向 config 与 `--login`；key 在位而 `defaultModel` 不可解析 ⇒ **点名 `defaultModel`**）。
- **R-A5.7**（可验判据）：无 TTY 的脚本化 stdio 客户端**全程不发 `authenticate`** 可完成 `initialize → session/new → session/prompt`（`stopReason:"end_turn"`）；非 TTY 下 `thincoder acp --login` **不挂死**（快速退出码非 0）。

**（3）新 N 条目（§3 非功能表末行）**

| **N8** | 无 TTY 可驱动 | 认证路径不依赖交互终端：脚本化 stdio 客户端（不发 `authenticate`、无 TTY）可完成 `initialize → session/new → session/prompt`；`thincoder acp --login` 在非 TTY 下快速退出（非 0）而非挂死 |

**（4）变更记录两处「§7 体量」自指收正（实核：本档止于 §6，无 §7）**

- `:127`（2026-09-15 迁移轮条）④ 子句——**原文**「④ 补 §6 不并项与历史沿革、§7 体量；」→ **改后**「④ 补 §6 不并项与历史沿革（**§7 体量节未落——本档现止于 §6**；体量读数归配对设计档与批次档）；」。
- `:123`（2026-09-16 批 1 条）末子句——**原文**「；§7 体量读数同步。」→ **改后**「（体量读数随该节未落一并撤除——本档现止于 §6）。」

**（5）同步项（建议 · 落笔时一并）**：§5 范围边界的「**不改 ACP 协议面**」宜补半句——「（**形状合规 ≠ 协议面变更**：响应字段按 schema v1 收敛，落在 F8 / R-A5）」，防与 F8 读作互斥。

**（6）本角色确认（合规核对 · 不落笔）**：需求档现 F1–F7 / N1–N7 的五要素形态齐备（目标 / 可验条目 / 边界 / 判据 / 依赖），上述增补沿用同形态；**三条链同源** = 本档 §2.4 AC ⇄ 设计档 §11 / §3.5 ⇄ 需求档 F4 增补 + F8 + N8（父侧落笔后闭合）。

## §3 设计评审

> **状态（父侧 · 2026-09-18 15:5x）**：**未能执行**——本批设计评审（首轮）两次发起，顾问面均直接返回「**收敛上限已达（5 轮）· 所有先前问题已结清 · 接受现状并推进**」（同步回，**未出报告、未签凭证**）。
>
> 🔴 **父侧更正（2026-09-18 16:1x · 承台账 #84 检查结论）**：两次拒回的**真因** = 点火调用**缺顶层 `type:"design"`**（只写在 `object` 内）⇒ 落 **code 轨**（`thincoder-core/agent-tools/advisor.mjs:98` 缺省）⇒ 撞 **code 实例** 5 轮上限（`advisor/run.mjs:193` / `agent-tools/advisor.mjs:180`——**design 评审 cap 豁免**，正确点名则不会命中）——**非「会话级设计评审配额」**（此前归因已更正）。⇒ 本批设计评审**重发中**（`type='design'`），回执以本档 §3 新段落为准。
> 链上现状：设计轮（id=68）**已交付**（§2 + 设计档 §11）· 父侧裁定表 = §1.10（N1–N4 全纳 · D17 确认 · README 建议批准 · config.mjs:13 纳入）· **待用户裁**（见 §4 与「选项」）。

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收可判性 | 🟡 | AC12 的载体在本文门控下不可达：§11.5:508-512 把「key 在位但 `defaultModel` 不可解析」的可行动文案挂在 `session/new` 的 `agent._providerInvalid` 分支，而 §4:127 / §11.2:418 的门是 `isConfigured()`；实核 `defaultIsConfigured()`（acp.mjs:70-76）= `loadConfig().provider?.apiKey`，`provider` = `resolveRuntimeProvider()`（config.mjs:319）在 defaultModel 未设时返 `{}`（model-ref.mjs:51-55）⇒ 该场景下门先返 -32000、`_providerInvalid` 分支永不执行 ⇒ AC12（batch:140）要的含 `defaultModel` 的 message 只能由门产生，而门的 ② 判据来源未指定（`isConfigured()` 是布尔注入口，区分不了 ①②）。 | 在 §11.5 写明 ② 的判据与落点：同注入位增设「配置状态探测」（返回 `{ok, reason}`，reason 取 `config.providerInvalidReason`——该串已含 `defaultModel`，见 model-ref.mjs:58-66，无需新增文案），并让门在 ② 分支把 reason 拼进 -32000 的 message；AC12 同时点名 handler 与错误码。 |
| 2 | 验收可判性 | 🟡 | AC13 覆盖不到它自己声明的第三处漂移点：`thincoder-core/config.mjs:11` 原文是「API key can fall back to environment variables…」，不含 `env fallback`（实核该串在 thincoder-core 零命中，改动前即通过）⇒ 该 AC 不能证明 §1.10#4 / §11.5:513 要求收正的注释已改；且 §2.4 AC13（batch:141）仍写 `docs/ thincoder-cli/ thincoder-core/` 全表，与 §2.7 修正1（batch:160-161）「该表述会误报」的收正自相冲突。 | 把 AC13 同步为 §2.7 修正1 的目标集，并把 `config.mjs:11` 单列为站点级断言（逐字比对改后注释，或按「environment variable」等实际词形纳入 pattern）。 |
| 3 | 尺寸档（文件/函数） | 🟡 | 拆分计划只处理文件级 500 上限：`buildAcpHandlers` 是单函数 ~368 行（acp.mjs:99-466），移出 ext 面（:412-479）后仍 ~310–350 行——函数级 >300 不因文件 ≤500 豁免；另 §2.3 对 bridge 396（batch:112）/ bin 441（:115）/ config 420（:117）只标「既存超 300 建议」，无拆分评审结论。 | 把函数级拆分并入本次拆分计划（按方法族抽出：auth/initialize 面入 client-caps、会话方法族入独立 handler 模块，acp.mjs 只留装配与转发）；在 §2.3 对三个 >300 文件各补一句本批拆/不拆的评审结论。 |
| 4 | 依据信实度 | 🟡 | §11.1:384-395 只留 as-of + 计数（170 `$defs` / 46 `x-method`），未留可取回实物（schema 快照 / SHA256 / `$def` 摘录）⇒ 全部字段级结论（`required` 列表、MUST 条文）事后无法复核（一手经 `gh-proxy.com` 镜像瞬时取用）。 | 把取回的 v1 schema 或其 SHA256 + 相关 `$def` 摘录留档（附落点），§11.1 加注指针。（本地可核的交叉印证抽检已逐字对上：kimi `server.ts:626-636` · `:656-661` · `version.ts:38-50`。） |
| 5 | 引用一致性 | 🔵 | 同一条上游条文两处给出不同英文「逐字」文本：设计 §11.2:405 归给「文档（terminal 认证）」的「Exit status zero signals success; a non-zero status, termination without an exit status, or cancellation signals failure.」 vs 批档 AC8（batch:136）归给 `AuthMethodTerminal` 的「A zero exit status signals success; any other termination signals failure」——至少一处非逐字，出处也不同。 | 统一为一条上游原文 + 出处锚（def 名或文档页/节），两处引用同一串；无法确证逐字的改为转述并去掉「逐字」标记。 |
| 6 | 验收口径 | 🔵 | AC7 后半（batch:135）断言 `authenticate{methodId:"terminal"}` 返回 `{}`，而 §11.2:401 自引契约明写「The client MUST NOT pass this method to `authenticate`」⇒ 锁定的是宽容越过契约的非法调用，非契约要求（前半 `{methodId:"nope"} → -32602` 才是）。 | 保留 -32602 半；后半改为注明「终端法被调用时宽容返回 `{}`（契约禁止客户端如此调用）」，或换为已宣告集合为空时任何 methodId 均 -32602 的边界断言。 |
| 7 | 边界（承裁定） | 🔵 | 改键不改值：`session/list` 条目 `sessionId` 取值仍是槽位号（acp.mjs:235），而 prompt/cancel 只认会话 id（design §6.1:209「与持久化槽位号不同物」）⇒「列表→prompt」仍 unknown session（G5 已裁不做，本项只要边界可见，而 §11.3:474 只给形状）。 | 在 §11.3 形状表旁补一行 id 命名空间边界（list/resume/delete 认槽位号；prompt/cancel/close 认会话 id），保留 §11.9 G5 登记项。 |
| 8 | 零回归主张 | 🔵 | §11.8:542 只列 `acp-channel.test.mjs`；既有 `test/manifest-flip-refusal.test.mjs:136-184` 直驱 `buildAcpHandlers` 的 `session/load` / `session/resume`（本批改其响应形状者）——该档只断言 `!r.error` / reason 句，形状收敛不破它（已核）；另 §2.2（batch:101）「从未被任何用例触及」过宽。 | 在 §11.8 回归面与 AC15 备注点名该档（注明其判据 = 形状收敛不破），并把「从未被任何用例触及」收窄为「响应键无断言」。 |
| 9 | 体量读数 | 🔵 | §2.3（batch:119）设计档行仍 `360 → ~535`，与同档 §2.7 修正2（batch:164）的 `360 → 580` 冲突（实核 580 行）；「现行 360」与设计档自记 365（design:574）不一致；`acp.mjs` 行 `−56` 对应 cited 范围 `:412-479` 实为 68 行（batch:120）。 | 用 §2.7 修正2 实测值覆盖 §2.3 该行，设计档基线取一（360/365）；`−56` 注明扣减口径（随迁 import/段落计法）或按 cited 范围行数改写。 |
| 10 | 用户面完整性 | 🔵 | 新入口 `--login` 未进 `USAGE`（bin/thincoder.mjs:107 已列 `thincoder acp`，:415-419 打印），§2.3 的 bin `+8`（batch:115）似未含该行。 | USAGE 的 acp 行后补 `thincoder acp --login`（含一句用途），并计入 bin 增量。 |
| 11 | 引用卫生 | 🔵 | §11 内行号与盘上不符：§11.2:411 指 `acp.mjs:141` 为 `authMethods: ["terminal"]`（实在 `:140`；`:141` 正是 §11.3:448 所引的 `capabilities` 行）· §11.2:413 指 `acp.mjs:111` 为闩锁声明（实在 `:112`；`:111` 是 `let nextId = 1`）· §11.5:496「本档 `:31,110`」两处现均非该声称所在（§2.7 修正1:162 自述位点是 §2.1 authenticate 行与 §4）；§11:382 引「D2 单一权威源」，而本档 §9 的 D2 = 「fs 反向 RPC」（:323）。 | 逐条校正为盘上行号或注明 as-of；「D2 单一权威源」改直述或补指针，避免与 §9 决策编号撞名。 |
| 12 | 需求面同步 | 🔵 | 批档 §1.7（batch:53）为需求档预留「设计出建议文本」通道，本批交付（§2.5/§2.6）未给需求面文本：新入口 `--login` 与 §11.7:530-536 的契约合规不变量在需求档 F1–F7 / N1–N7 无对应条目；需求档 变更记录:127 另引「§7 体量」而该档止于 §6。 | 补一段可落笔的需求面建议文本（新 F/N 条目 + F4 增补），并修掉「§7 体量」自指。 |

**范围外注（不标级）**：§7.1:246-248 引 `acp.mjs:77`/`:83`（实在 `:81`/`:87`）；§7.2:287 仍把 ⟦ev⟧ 枚举白名单写作「现状缺陷」，而盘上已是形态判据（bridge.mjs:188）+ 负例用例（acp-channel.test.mjs:115-137）——均在本轮声明目标（§11/§3.4/D15–D19）之外。

**计数**：🔴 0 · 🟡 4 · 🔵 8（共 12 条）。

VERDICT: pass

## §4 用户批准

**2026-09-18 17:00 / 17:20 父侧代签** —— 依据三重授权：① 用户 15:38「**acp 那个你自己跑完吧**」（本批专用：设计评审点火权 + §4 批准权，见 §1.9）② 用户 17:00「都点火吧」③ 用户 17:20「你自动跑到排空吧」。

**父侧自缚条件（§1.9）逐条核验**：评审 **pass（0 🔴）**（id=70）· 修正轮（id=76）**12/12 落地并经父侧核验** · **token 已签发**（值不落档——运行时凭证）⇒ 三条件齐备，代签有效。

**批准范围**：设计 §3.5 处理器模块划分 + §11 契约合规面（G1 / G2 / G3 / G8 / G10）全量 + §11.6 文档面。
**实施**：eng-coder（id=88）——**已交付**（终态 clean · §5 在册 · 三包 `npm test` = 691 / 362 / 600 全绿 · 两档回归面零改通过）。

**父侧补记（读数面 · 父侧直接执行 · 可 revert）**：§2.3「落定」列为设计轮**估算值**，实测偏差 8 项（`handlers-session` 170→241 · `test/acp-contract` 130→364 · `acp.mjs` ~130→144 · `client-caps` 115→87 · `ext` 70→87 · `login` 60→49 · `session.mjs` 65→55 · `bin` 442→440；`bridge` 396→397 吻合）——**无一越阈值、无新增债**，收口以本节为准。（主 agent）

## §5 实施

**状态行**：✅ **已交付**——实现 → 内部分歧审计（explore 子代理：4 条低危）→ 自修 3 项 → 内部 advisor 代码评审（**pass · 0🔴 / 3🟡 / 3🔵**）→ 再自修 2 项 → **终态 `clean`**（无未决项；🟡 三行 = 既存尺寸档裁定，按 R3 不重开）。

**设计权威**：`docs/cli/design/ACP-CLIENT.md` §3.4 / §3.5 / §11.1–§11.9（含 §11.8 实施序 ①–⑤）；任务书 = 本档 §2（§2.3 受影响表 / §2.4 AC1–AC15 / §2.8）。

### 5.1 交付摘要（逐档落位）

- **新档（5）**：`src/acp/client-caps.mjs`（initialize / authenticate + §3.4 能力快照 + 版本协商 + `authMethods` 构造）· `src/acp/handlers-session.mjs`（内存会话族 6 handler + `findSession` / `applyConfigOption` / **门助手 `createRequireConfigured`**）·
  `src/acp/handlers-slots.mjs`（持久化槽族 4 handler + `slotEngineering` / `reattach`）· `src/acp/ext.mjs`（`checkpoint/*` + `memory/*` **纯搬迁** + `ensureAcpMemory`）· `src/acp/login.mjs`（`runAcpLogin()`）。
- **入口重写**：`src/acp.mjs` —— 常量（`VERSION` / `ACP_EXCLUDED_TOOLS`）· 注入默认（`defaultIsConfigured` / **`defaultProviderStatus`**）· `defaultCreateSession` · **`buildAcpHandlers` 装配（合并四族 + 单一 `ctx`）** · `runAcpServer` · 再导出 `runAcpLogin`。
  **接缝契约不变**：签名 + 返回 `{ handlers, sessions, notifyRef, requestRef }`；`ctx` 键逐字 = §3.5（`{ getCwd, sessions, allocSessionId, notifyRef, requestRef, createSession, requireConfigured, log }`）——
  能力位经入口 `createSession` 包装注入（`{ ...opts, clientCaps: clientCaps.current }`），未往 `ctx` 加键。**单体 `buildAcpHandlers` 368 行 → 装配约 45 行**。
- **改动面**：`src/acp/session.mjs`（透传 `clientCaps`）· `src/acp/bridge.mjs`（§11.4 fs 门控：`readBuffer` / `writeBuffer` 守卫 + `toolRouter` 双判）· `bin/thincoder.mjs`（`case "acp"` 读 `args` + `--login` 分派 · `USAGE` 逐字行）·
  `thincoder-cli/README.md`（`:52` 悬空链接改指根层活档 + `:53` 登录入口句）· `thincoder-core/config.mjs`（仅 `:11` 注释逐字收正）。
- **测试档**：新增 `test/acp-contract.test.mjs`（15 用例 = AC1–AC12 handler 直调 + AC9 bridge 直驱 + **AC5 脚本化 stdio 冒烟** + **AC8 非 TTY `--login` 冒烟**）。

### 5.2 逐档读数（实测 · `read` 口径 = 批档 §2.3 同口径）

| 文件 | 批档落定 | 实测 | 备注 |
|---|---|---|---|
| `src/acp.mjs` | ~130 | **144** | 功能面齐备（常量 + 探针 + 装配 + 服务） |
| 新 `src/acp/client-caps.mjs` | 115 | **87** | — |
| 新 `src/acp/handlers-session.mjs` | 170 | **241** | 6 handler + 门助手 + 既有注释随行 |
| 新 `src/acp/handlers-slots.mjs` | 190 | **197** | 含 #41 判据注释（随行保留） |
| 新 `src/acp/ext.mjs` | 70 | **87** | 纯搬迁 68 行 + 头注 |
| 新 `src/acp/login.mjs` | 60 | **49** | — |
| `src/acp/session.mjs` | 65 | **55** | — |
| `src/acp/bridge.mjs` | 396 | **397** | 最大单体 `buildAcpCallbacks` = 264 行（< 300） |
| `src/acp/transport.mjs` | 156 | **156** | 0 改 |
| `bin/thincoder.mjs` | 442 | **440** | 实 Δ = **+7**（USAGE +1 · case 块 +6） |
| `thincoder-cli/README.md` | ~473 | **473** | +1 行（链接行改 1 拆 2 ⇒ 净 +1） |
| `thincoder-core/config.mjs` | 420 | **420** | 1 行替换 |
| 新 `test/acp-contract.test.mjs` | 130 | **364** | AC 面全落 + stdio/`--login` 两条冒烟 |
| `test/acp-channel.test.mjs` | 303 | **303** | **零改** ✅ |
| `test/manifest-flip-refusal.test.mjs` | 185 | **185** | **零改** ✅ |

⇒ 尺寸档复核：**新增档全部 ≤300（文件与函数两档）**；`bridge.mjs` 397 / `bin` 440 为既存档（批档 §2.3 已有不拆结论 + 触发条件）。批档落定列与实测的偏差（`handlers-session` 170→241、测试档 130→364 等）= 估算偏差，**父侧文档层可择机收正**（本角色不笔文档）。

### 5.3 AC 与用例读数（命令 + 结果）

- **AC1–AC12 / AC9 / AC5 / AC8（用例面）**：`cd thincoder-cli && node --test test/acp-contract.test.mjs` ⇒ **15 tests / 15 pass / 0 fail**（AC5 stdio 冒烟 ~1.3s、AC8 `--login` 冒烟 ~0.7s）。
- **AC13（三条 grep）**：`env fallback` 于 `thincoder-cli/src` = **0** · `thincoder-core/` = **0** · `thincoder-cli/README.md` = **0**（仅 `thincoder-cli/docs/_archive/**` 两处，AC 明示除外）；`fall back to environment` 于 `thincoder-core/config.mjs` = **0**；`not a key source` 于同档 = **1**（`config.mjs:11` 逐字 = §11.5 目标文本）⇒ **0/0/1** ✅。
- **AC14**：`docs/guides/ides.md` 于 `thincoder-cli/README.md` = **0**；`README.md:52` = `  - Setup: [ACP 接入设计](../docs/cli/design/ACP-CLIENT.md)`，目标档实存 ✅。
- **AC15（回归/三包）**：`cd thincoder-cli && npm test` = **691 pass / 0 fail**（含两档零改档；改后复跑两次同读数）· `cd thincoder-core && npm test` = **362 / 0** · `cd thincoder-vscode && npm test` = **600 / 0**。
- **`node scripts/doc-check.mjs`（仓根）**：`FAIL(锚): 5 条悬空` · `FAIL(行宽): 6 行`——**逐条核过均为 §2.8 既存基线**（悬空 5：`AGENT-LOOP-SUBAGENT.md:417` / `CORE-UNIFICATION.md:515` / `DOC-DISCIPLINE.md:509` / `SESSION.md:238` / `WORKSPACE.md:18`；行宽 6：`CONTEXT-COMPACTION.md:303` / `prompts/persona-engineering.md:137`/`:139` / `requirements/ADVISOR-CONVERGENCE.md:129`/`:224` / `requirements/CONTEXT-COMPACTION.md:27`）⇒ **本批归属零新增** ✅。

### 5.4 审计与评审轮次（终态 clean）

**轮 1 · 内部分歧审计（explore 子代理 · 只读）**：4 条命中（均低危，无实现面缺口）——① 批档 §2.3 行数落定偏差（🔵→ 报告父侧）；② 临时调试档 `_dbg_acp_smoke.mjs` 曾落盘（**已删除，工作树零残留**——越界披露项）；③ AC9 断言面缺「edit 的写侧关闭分支」（**已补用例**）；④ README 链接文案与设计 §11.6 逐字目标不一致（**已改设计逐字**）。审计另注：测试档头注「config 路径均指临时目录」措辞与实际范围不符（**已收正为事实陈述**，且 AC6 改用临时配置走 ① 分支 —— 更严）。

**轮 2 · 内部 advisor 代码评审（`type=code` · 12 档路径 + 设计/批档为文）⇒ VERDICT: pass（0🔴 / 3🟡 / 3🔵）**

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1–3 | 🟡 | `bridge.mjs` 397 / `bin/thincoder.mjs` 440 / `core/config.mjs` 420 越 300 提示线 | **既存债、本批零新增**；批档 §2.3 已有不拆结论 + 触发条件 ⇒ 按 R3 **不升级、不重开**；仅报告 |
| 4 | 🔵 | `login.mjs` 的 `writeConfigAtomic` 未包 try/catch（配置不可解析时该函数抛错 ⇒ 走 bin 顶层 rejection 通道，而非设计 §11.2 改法 4 的「一行文案 + exit 1」；非 TTY 分支在其之前返回 ⇒ AC8 不受影响） | **已修**：try/catch + 复用同一失败文案 + `return 1` |
| 5 | 🔵 | `handlers-session.mjs` / `handlers-slots.mjs` 响应按**引用**复用模块级常量 `CONFIG_OPTIONS`（无现害，防御面） | **已修**：三处返回改浅拷贝 `[...CONFIG_OPTIONS]` |
| 6 | 🔵 | 批档 §2.3 落定行数与实测偏差 | 报告父侧（本角色不笔文档） |

**fix round 汇总**：审计轮修 3 项（AC9 用例补全 · README 逐字 · AC6 沙箱化 + 头注收正）· 评审轮修 2 项（login try/catch · `configOptions` 浅拷贝）⇒ **复跑全绿**（`node --test test/acp-contract.test.mjs` = 15/15；`npm test` = 691/0）。

### 5.5 决策透明表（实现面自主裁量 · 逐条披露）

| # | 裁量点 | 取舍与依据 |
|---|---|---|
| 1 | **装配后兜底错误的错误码** = `-32000`（设计 §11.5 只写「返回错误」未给码，AC 不判该码） | 取「凭据/配置不可用」同族码（客户端可据此触发 `--login` 恢复路径），文案 = `agent._providerInvalidReason`（逐字复用、不新造） |
| 2 | **edit 路由 = `readTextFile ∧ writeTextFile`**（设计 §11.4 只把 `readTextFile !== true ⇒ 不路由` 写死；`readTextFile=true ∧ writeTextFile=false` 未列） | 取「不变量 2：任何 `fs/*` 发出前必过能力位」+ §11.4「二者皆 true ⇒ 现有路径零改」⇒ 写回位不成立即不路由（AC9 已补该关闭分支断言） |
| 3 | **README 链接文案** = 设计 §11.6 逐字 `[ACP 接入设计](../docs/cli/design/ACP-CLIENT.md)` | 设计档 = 权威规格；批档 §2.6 建议形态（路径作文案）与设计 §11.6 本就不同 ⇒ 取设计档；AC14 机判 = 路径（两形态皆绿） |
| 4 | **`ctx` 不含 `clientCaps`** | §3.5 的 `ctx` 键列表为逐字规格 ⇒ 未加键；能力位经入口 `createSession` 包装注入（会话构造期取值） |
| 5 | **AC13 / AC14 不作测试面语句锚** | 测试纪律「no new prose anchors」⇒ 以验收命令读数承载（本段 §5.3 已给三条 grep + README 读数） |
| 6 | `authMethods` 的 `name` / `description` 取值（设计给 `"…"` 占位） | `name = "Terminal login"`；`description` = 指向 `thincoder acp --login` 的英文一句；AC3 只判 id/name 为 string + type + args |

### 5.6 越界项（如实）

- **禁改面零触碰**：`thincoder-core/**` 仅 `config.mjs:11` 一行注释（§11.5 逐字目标）· 设计档 / 需求档 · `thincoder-vscode/**` · `_archive/**` —— **零改动**。
- **域外披露（1 项）**：实现期曾落一个临时调试档 `thincoder-cli/_dbg_acp_smoke.mjs`（stdio 冒烟排障用），**已删除**（工作树零残留；审计轮已核 `glob **/_dbg*` = 0）。
- **并行线观察（非本批）**：实施窗口内工作树另有他线在途改动（`thincoder-core/agent-tools/**` · `docs/**` 等）——本批逐档读数与三包测试读数为**本角色执行时点**实测，未混入他线改动。

## §6 验证与收口

**收口（2026-09-18 17:4x · 父侧直接执行）**

- **交付判据**：评审 pass（id=70）→ 修正（id=76 · 12/12）→ 实现轮（id=88 · 终态 clean：分歧审计 4 条低危→自修 3 项 · 代码评审 pass 0🔴/3🟡/3🔵→自修 2 项）——逐条验收全绿。
- **验收读数（实现轮自跑）**：`test/acp-contract.test.mjs` **15/15 pass**（AC1–AC12 + AC9 bridge 直驱 + AC5 stdio 冒烟 + AC8 非 TTY 冒烟）；AC13 三条 grep = **0 / 0 / 1**；AC14 README 悬空链改指根层活档 ✓；三包 `npm test` = **691 / 362 / 600**（0 fail）；两档回归面**零改通过**；`doc-check` 按档归属零新增。
- **交付形态**：§3.5 拆分落定（`acp.mjs` 493 → **144**；新增 `client-caps` / `handlers-session` / `handlers-slots` / `ext` / `login` 五档，均 ≤300 行；接缝 `buildAcpHandlers` 契约不变）；§11 契约合规面（G1 / G2 / G3 / G8 / G10）全量落地。
- **读数面（父侧补记）**：§2.3「落定」列 8 项为设计轮估算值，实测偏差已记于 §4（无一越阈值）。
- **父侧实测告警（登记）**：收口前父侧跑 `acp-contract` 曾变红——根因 = **他批（顾问面批 #91）改名在途中间态**（`review-streak.mjs` 缺失，被 `advisor/run.mjs` 导入）⇒ **非本批缺陷**；教训 = **跨批验收必须在写者静默后复跑**（已入本批记录面）。
- **状态行**：✅ 已收口 2026-09-18（全档冻结）。
- **台账**：#82 ⇒ 已核销。（父代理）
