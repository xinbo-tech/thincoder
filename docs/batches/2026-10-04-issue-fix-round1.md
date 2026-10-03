# 2026-10-04 · issue 修复批·一（核健壮性 8 条：MCP 自愈 ∥ SSE 重复帧 ∥ embedding 毒行 ∥ auto-think ∥ subagentModel ∥ 图片预算 ∥ POSIX 杀树 ∥ fetch 看门狗）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:34「开批吧」（承 00:34 父侧归批组提醒 + 00:31「都自动跑」全自动授权）；条目源 = 2026-10-03 分诊（#850 ∥ #853 ∥ #856 ∥ #859 ∥ #860 ∥ #861 ∥ #877 ∥ #878）。
> 台账 = #850 ∥ #853 ∥ #856 ∥ #859 ∥ #860 ∥ #861 ∥ #877 ∥ #878（核面 · 归批）。前情 = 无（独立批——需求源 = 2026-10-03 gitee/GitHub 分诊台账行 ×8）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：2026-10-03 分诊归批组的第一组（核健壮性 8 条真缺陷）——用户 00:34「开批吧」点火；全链（设计 → 评审 → 实施 → 收口）。

**本批条目（8）**：
| # | 台账 | 条目 | 证据锚（分诊实读） |
|---|---|---|---|
| 1 | #850 | MCP Streamable HTTP 会话过期自愈（404 ⇒ 清会话 + 重新 initialize + 重试一次） | `mcp/transport-http.mjs:168-172`（非 2xx 直接映射、不重置 sessionId）∥ `:245`（isAlive 不看会话有效性）∥ mcp/ 全目录 404 零命中 |
| 2 | #856 | SSE message 形状重复帧守卫（MiniMax v2 端点二次追加） | `provider/sse.mjs:138`（choice.delta ?? choice.message ?? {}）∥ `:146-150`（content/tool_calls 二次追加）∥ `config-presets.mjs:26`（v2 端点默认在用） |
| 3 | #859 | embedding 孤立代理项清洗 + 毒行隔离（不堵 backlog） | `memory/embedding.mjs:75-92`（JSON.stringify 前无清洗）∥ `escape.mjs:56`（sanitize 只走消息面）∥ `memory/docs.mjs:195-203`（批失败整抛）∥ `provider/rate.mjs`（RETRYABLE 不含 400） |
| 4 | #860 | auto-think 分类对思考型模型 100% 失败（无思考守卫 + maxTokens 互斥 + 静默回退） | `auto-think.mjs:66-68`/`:76`/`:104-106` ∥ 调用点 `agent/chat-call.mjs:22-24` ∥ 38/38 实测 |
| 5 | #861 | `agent.subagentModel` 非法形态：加载期零校验 + 裸 `.includes` 崩 | `subagent-async.mjs:142`/`:150`/`:153` ∥ `subagent-spawn.mjs:80-82` ∥ `config.mjs:38-39` ∥ `settings.mjs:42` |
| 6 | #853 | 历史图片字节预算（累计驱逐最老 + 注入时驱逐 + 413 可操作化） | `token-window.mjs:14,24`（固定 2000 token 计账）∥ `provider/normalize.mjs:13-34`（只按能力剥离）∥ `tools/file.mjs:26`（单图 15MB 不约束累积） |
| 7 | #877 | 退出阶段 POSIX 杀树仅 SIGTERM（忽略信号子进程泄漏——crash-guards 残面） | `MCP.md:106`/D-MC17 ∥ win32 已修（#17）∥ POSIX 2s SIGKILL 升级 timer 不触发 |
| 8 | #878 | 直连 fetch 读侧 120s 看门狗失效（ReadableStream 无 destroy——守卫 no-op） | crash-guards 批档 §2 U-CG-1 ∥ `proxy.mjs` 路径不受影响 |

**复验令（承用户 2026-09-25 先例）**：设计轮**开工先逐条实读复验仍存在**；已消/前提变者按实况登记（不硬做）。

**授权口径**：全链；用户 00:31「都自动跑」——点火/代签/派发/收口全自动（自缚三条在册：代签三条件 ∥ 新范围即停 ∥ 破坏性即停）。

**边界**：在飞写域零触——#51（`thincoder-core/ledger-*.mjs` ∥ `thincoder-cli/src/**` ∥ `docs/cli/design/{CLI-ENTRY,ACP-CLIENT}.md` ∥ `docs/batches/2026-10-03-read-data-interface*`）∥ #54（`docs/desktop/design/PANEL-READBACK.md` ∥ `docs/desktop/design/IPC.md` ∥ `docs/batches/2026-10-04-subagent-panel-live-face.md`——评审冻结窗在效）∥ #55（`docs/batches/2026-10-03-menu-working-directory.md`）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-04 · 评审轮 1 收正块（号 1–9 全采纳）在册；8 条复验 + 机制笔 + 用例腿齐；doc-check 复跑 exit 0）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 复验结论（承用户 09-25 先例「开工先逐条实读复验」· as-of 2026-10-04 实读）

| # | 台账 | 复验结论 | 实读证据（file:line） | 与台账证据锚的差异 |
|---|---|---|---|---|
| ① | #850 | **仍存在** | `thincoder-core/mcp/transport-http.mjs:168-172`（非 2xx 直映射、无 404 特判、不清 sessionId）∥ `:245`（isAlive 不看会话有效性）∥ mcp/ 全目录 404 零命中 | 无（行号吻合） |
| ② | #856 | **仍存在** | `thincoder-core/provider/sse.mjs:139`（`choice.delta ?? choice.message ?? {}` 无守卫）∥ `:147-150`（content/tool_calls 二次追加）∥ `thincoder-core/config-presets.mjs:26`（minimax `chatPath: "/text/chatcompletion_v2"` 默认在用） | 行号微移（批档记 :138 / :146-150——+1 系他批增行；含义不变） |
| ③ | #859 | **仍存在** | `thincoder-core/embedding.mjs:75-92`（`requestWithRetry` :88 JSON.stringify 前无清洗）∥ `thincoder-core/escape.mjs:56`（sanitizeLoneSurrogates 只走消息面）∥ `thincoder-core/memory/docs.mjs:195-203`（批失败整抛）∥ `thincoder-core/provider/rate.mjs:8`（RETRYABLE 无 400） | **路径修正**：embedding.mjs 住核根（批档记 `memory/embedding.mjs`——实为 `thincoder-core/embedding.mjs`）；同族扩散面 2 处（`memory/code-search.mjs:121` ∥ `memory/core.mjs:175` 同款整抛）——设计一并覆盖 |
| ④ | #860 | **仍存在** | `thincoder-core/auto-think.mjs:66-68`（只查 reasoningEffortEnum）∥ `:76`（`{...agent.provider, maxTokens: 10}` 原样透传思考字段）∥ `:104-106`（catch → null 静默）∥ `thincoder-core/agent/chat-call.mjs:22-24`（调用点） | 无 |
| ⑤ | #861 | **仍存在** | `thincoder-core/agent-tools/subagent-async.mjs:142`（falsy 门）∥ `:150`（String() 比较）∥ `:153`（裸 `.includes(":")`——对象形态 TypeError 崩点）∥ `thincoder-core/agent-tools/subagent-spawn.mjs:80-82`（原样回传）∥ `thincoder-core/config.mjs:38-39`（仅 DEFAULTS 注释）∥ `thincoder-core/agent-tools/settings.mjs:42`（写面形状表在位） | 无 |
| ⑥ | #853 | **仍存在** | `thincoder-core/token-window.mjs:14`（IMAGE_TOKEN_ESTIMATE = 2000）∥ `:24`（固定计账）∥ `thincoder-core/provider/normalize.mjs:13-34`（只按能力剥离、无字节预算）∥ `thincoder-core/tools/file.mjs:26`（MAX_IMAGE_BYTES = 15MB 单图上限）∥ capHistoryImageBytes/字节预算全仓零命中 | 无 |
| ⑦ | #877 | **仍存在**（POSIX 残面） | `thincoder-core/mcp/transport-stdio.mjs:20-23`（POSIX 仅 SIGTERM + 2s 升级 timer——退出相位不触发）∥ `docs/core/design/MCP.md:106`（残面句在册）∥ win32 已修（`:16-19` spawnSync） | 无 |
| ⑧ | #878 | **仍存在** | `thincoder-core/stream-destroy.mjs:29`（`typeof body.destroy !== "function"` ⇒ web ReadableStream 显式 no-op）∥ `provider/sse.mjs:179` ∥ `provider/google.mjs:204`（看门狗调 destroyBody）∥ proxy 路径不受影响（crash-guards T5 实证） | 无 |

**复验附注（本设计轮实测——直接证据）**：
- **#877 机制内核级实证**（本机 WSL Ubuntu-1 · Python 3.12 探针——内核语义语言无关）：`start_new_session=True`（= Node `detached` 等价）建新进程组 ⇒ `killpg`(组长 pid) SIGKILL 后 **child（Z 僵尸 = 已被杀）+ grand（收割后消失）皆死**；非组长 pid 的 `killpg` ⇒ **ESRCH（errno 3）**——不误杀判据成立。探针档 = `.thincoder/tmp/posix-groupkill-probe.py`。
- **#877 Node API 面**：官方文档 `process.kill(pid)` 段——「**Windows platforms will throw an error if the pid is used to kill a process group**」（反证 POSIX 负 pid = 组杀语义；win32 分支本走 taskkill，零触）。
- **本机限制（如实登记）**：WSL 内 node 二进制坏档（`Exec format error`——Python 可跑、node 不可跑）⇒ **POSIX 生产形测试腿本机不可执行**——组 A 批内件对 POSIX-only 腿按平台门 skip + 记录（沿 crash-guards T11 先例）；win32 机位以**测试缝**（注入 spy）覆盖相位分流逻辑分支。

### 2.1 设计总览（8 条 → 一句修法）

| # | 台账 | 修法一句话 | 设计档落点 |
|---|---|---|---|
| 1 | #850 | HTTP 404（会话失效）⇒ transport 内「清会话 + 重新 initialize + 重试一次」（单飞；失败 ⇒ fireDead 退避链兜底；sessionDead 入 isAlive） | `docs/core/design/MCP.md` §6.6 ∥ §6.9 ∥ §7 D-MC18 |
| 2 | #856 | SSE message 快照帧 ⇒ content/reasoning 前缀补差 ∥ tool_calls 覆盖（只对 `delta == null` 帧；不吞真实内容） | `docs/core/design/PROVIDER.md` §6.4 ∥ §7 D-PR31 |
| 3 | #859 | 嵌入发送前 `sanitizeLoneSurrogates` 清洗（主修）+ 400 类批失败逐条独试隔离（兜底——backlog 不堵） | `docs/core/design/MEMORY.md` §6.3 ∥ §7 D-MEM31 |
| 4 | #860 | 分类调用「可关思考」守卫（不可关跳过 + 一次警示）+ 关思考形 + maxTokens 32 + 失败一次可见 | `docs/core/design/AGENT-LOOP.md` §6.1 ∥ §7 D-AL26 |
| 5 | #861 | 非法 subagentModel 三层防线（加载期清洗 ∥ 运行期明确错误 ∥ 写面形状表） | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.1 |
| 6 | #853 | 历史图片累计字节预算（最老先驱逐——发送前副本 ∥ 注入时 history 本体同函数）+ 413 错误文本带处置指引 | `docs/core/design/PROVIDER.md` §6.3 ∥ §6.7 ∥ §7 D-PR32 |
| 7 | #877 | POSIX = detached 新进程组 + 组杀；退出相位同步组 SIGKILL 直达（模块级相位标志分流） | `docs/core/design/MCP.md` §6.6 ∥ §7 D-MC19 |
| 8 | #878 | 直连 fetch 断流 = 内部 abort 通道（IDLE_ABORT + terminateBody——看门狗恢复有效） | `docs/core/design/PROXY.md` §2 ∥ §7 D-PX8 ∥ `PROVIDER.md` §6.3 |

### 2.2 分组实施序（按面分组 · 事实以设计为准）

- **组 A = 传输与请求面**（#850 ∥ #877 ∥ #856 ∥ #878 ∥ #853）：落点全在「请求构造 / 发送 / 载荷」链（`mcp/` ∥ `provider/` ∥ 载荷预算 ∥ 图片注入面）；共享文件 `provider/sse.mjs`（#856+#878）与 `provider/core.mjs`（#878 + #853 的 413 特判）由同席**按文件聚合一次读改**。
- **组 B = 记忆与配置面**（#859 ∥ #860 ∥ #861）：三面相互独立（`memory/` ∥ `auto-think` ∥ `config` + `subagent-async`），与组 A 文件零重叠。
- **并行建议**：A ∥ B 两席可并行（零共享文件）；组 A 内部串行（同文件聚合）。
- **批内件**（每组一个测试文件 · 沿批内件先例）：`docs/batches/2026-10-04-issue-fix-round1.a.test.mjs`（组 A）∥ `docs/batches/2026-10-04-issue-fix-round1.b.test.mjs`（组 B）。

（机制设计 8 条详文见 §2.3；受影响文件表 / 验收对照 / 用例清单 / 关键决策 / 上抛见 §2.4–§2.8）

### 2.3 机制设计（8 条 —— 根因 / 修法 / 落点 / 验收判据）

**#850 · MCP HTTP 会话过期自愈（设计档 = `MCP.md` §6.6 ∥ §6.9 ∥ D-MC18）**
- 根因（实读）：`postRequest` 非 2xx 一律映射 `HTTP <status>` 错误（`:168-172`）——404（MCP 会话失效语义）不触发任何重建；`isAlive`（`:245`）只查 `!closed && (eventSource || postOnly)` ⇒ 会话过期后 `ensureAlive` 认活、每次调用重复 404，无自愈（唯一手动恢复 = `/mcp reconnect`）。
- 修法：transport 内三步——① 404（且非重建请求自身）⇒ 清 `sessionId`；② 重新 `initialize`（+ `notifications/initialized`；参数单源 = `mcp.mjs` 建连时经 `setInitPayload(...)` 注入——`doInitialize` 参数抽 `buildInitParams()` 供两处共用）；③ 重试原请求**一次**（每原请求至多一次——`retried` 标志；并发 404 共享同一重建 promise——**单飞**）。重建失败 / 二次 404 ⇒ 报原错误 + `fireDead("session expired")`（既有退避重连链兜底）；`sessionDead` 标记入 `isAlive`（未修复死态 ⇒ false ⇒ `ensureAlive` 走重连）。非 404 错误路径零变。
- 落点：`thincoder-core/mcp/transport-http.mjs`（postRequest 重构 `postOnce`+自愈包装 ∥ close 与 isAlive 补 sessionDead）∥ `thincoder-core/mcp.mjs`（setInitPayload 注入 + init 参数单源）。
- 验收判据：mock server 首答 404 → 客户端自动重建（收到 initialize）→ 重试成功、调用返回正常结果；服务端记录 = `initialize` 恰好 +1、原请求重发恰好 +1（**只重试一次**）；连续 404 两次 ⇒ 不第三次、错误透传 + fireDead 触发（接线可观测）；非 404（500 等）路径调用序零变。

**#856 · SSE message 形状重复帧守卫（设计档 = `PROVIDER.md` §6.4 ∥ D-PR31）**
- 根因（实读）：`handleEvent` 中 `const delta = choice.delta ?? choice.message ?? {}`（`:139`）——MiniMax v2（`chatPath: "/text/chatcompletion_v2"`，preset :26 默认在用）在 delta 缺席的帧放入**完整 message 快照**时，`delta.content`（实为累积全文）被当增量 `result.content += …`（`:147-150`）⇒ 与先前 delta 累积重复；`mergeToolCalls` 对快照帧的 tool_calls 按增量聚合 ⇒ arguments 重复拼接。
- 修法：**帧形状分派**——`choice.delta == null && choice.message != null` ⇒ 快照语义：① content / reasoning：`text === result.content` ⇒ 跳过；`text.startsWith(result.content)` ⇒ 只追加差量 `text.slice(result.content.length)`；无前缀关系 ⇒ 按增量追加（无法判定时**不吞**真实内容）；② tool_calls：snapshot 模式传参 `mergeToolCalls(result, delta, { snapshot: true })`——已有 slot（index / id 命中）的 arguments **覆盖**（非 `+=`），新 slot 照常建。`choice.delta` 在场的帧 = 纯增量语义照旧（不做去重——真增量文本天然可重复）。
- 落点：`thincoder-core/provider/sse.mjs`（handleEvent + mergeToolCalls 加 snapshot 参数）。
- 验收判据：构造 v2 形状帧序列（delta 帧交错全量 message 帧）⇒ `result.content` 无重复（逐字断言）；tool_calls arguments 无重复拼接；纯 delta 序列（OpenAI 标准）结果逐字零回归。

**#859 · embedding 毒行清洗 + 隔离（设计档 = `MEMORY.md` §6.3 ∥ D-MEM31）**
- 根因（实读）：`embedding.mjs:88` 请求体 `JSON.stringify({ model, input })` 前无清洗（sanitize 只走消息面）——孤立 UTF-16 代理文本（含已入库毒行）⇒ 硅基流动 400/20015；`rate.mjs:8` RETRYABLE 不含 400 ⇒ 400 直抛 ⇒ 补嵌批（`docs.mjs:199` ∥ `code-search.mjs:121` ∥ `core.mjs:175` 三面同款整抛）每次取同批头部 ⇒ backlog 永久堵死（22,957 条）。
- 修法：**两道防线**——① 主修：`requestWithRetry` 的 body 构造处对 input 逐条施 `sanitizeLoneSurrogates`（`escape.mjs:56` 复用纯函数）⇒ 存量毒行发前净化、根因消除；② 兜底：新 `embedTolerant(embedder, texts)`（`embedding.mjs`）——整批失败且 `err.httpStatus === 400`（`requestWithRetry` 抛错时标注）⇒ 逐条独试：成功者照常返回、仍败者置 `null` + 收集 `skipped`（首条原因）；其他错误（网络 / 401 等）照旧整抛。三面消费（docs ∥ code-search ∥ core）改用 tolerant 版 + `null` 行跳过不写 + 一行 `console.warn` 可见回执。
- 落点：`thincoder-core/embedding.mjs` ∥ `thincoder-core/memory/docs.mjs` ∥ `memory/code-search.mjs` ∥ `memory/core.mjs`。
- 验收判据：注入含孤立代理的批次 ⇒ 请求体逐条清洗（fetch 桩抓 body 断言无 `\uD800-\uDFFF` 孤立码元）；清洗后成功嵌入；模拟「清洗后仍 400 的毒行」⇒ 毒行跳过、同批其余写入、`skipped` 回执一条；毒行不阻后续批次（第二轮取到新行）；query 面（单条）行为零变。

**#860 · auto-think 分类对思考型模型失败（设计档 = `AGENT-LOOP.md` §6.1 ∥ D-AL26）**
- 根因（实读）：三重叠加——① 无「可关思考」守卫（`:66-68` 只查 reasoningEffortEnum 存在性）；② `{...agent.provider, maxTokens: 10}`（`:76`）原样透传 `thinking` / `reasoningEffort` ⇒ 思考开启 + 10 token 预算被思考吃光 / 400；③ catch → null 静默（`:104-106`）⇒ 38/38 失败无感知。
- 修法：① 守卫：`thinkOffPath(spec)`（`think-off.mjs` 单源）为 false ⇒ 不调用（`return null`）+ 进程内一次 `console.warn`（按 model 去重——「无法关思考，auto-think 跳过」）；② 能关 ⇒ `classifierProvider = { ...agent.provider, maxTokens: 32, thinking: thinkOffShape(spec), reasoningEffort: null }`（effort 族 off 形自动走 `provider/core.mjs:214-221` 的 `reasoning_effort:"none"` 补发门；type 族走 `{type:"disabled"}`；`reasoningEffort` 清空防父档外溢）；③ 失败可见：catch 内按错误签名进程级一次 `console.warn("[auto-think] classification failed: …")`，`return null` 回退语义不变。
- 落点：`thincoder-core/auto-think.mjs`（守卫 + classifier 构造 + 可见化；`think-off.mjs` / `model-specs` 零改）。
- 验收判据：思考型且不可关（`thinkAlwaysOn` / 枚举无 `none`）⇒ 零分类调用 + 一次 warn；可关模型 ⇒ 分类请求体携族别 off 形 + `max_tokens: 32` + 无 `reasoning_effort` 外溢档（fetch 桩断言）；解析成功路径逐字零回归；失败一次 warn 后不再刷。

**#861 · subagentModel 非法形态三层防线（设计档 = `AGENT-LOOP-SUBAGENT.md` §6.7.1）**
- 根因（实读）：`resolveChildProvider:153` 裸 `.includes(":")`——config `subagentModel` 为对象（误配形）经 `effectiveSubagentModel:80-82` 原样回传 ⇒ **TypeError** 崩 spawn；`config.mjs:38-39` 加载期零校验（settings.mjs:42 写面形状表只挡 agent 写路径）。
- 修法：① 加载期清洗（`loadConfig`，沿 `sanitizeConsultModels` 先例）：`subagentModel` 非「非空字符串或 null」⇒ 置 null + 一次性警告；`subagentModels` 非对象 ⇒ {}，值非「非空字符串」⇒ 剔除该键 + 一次性警告（含修复指引）；② 运行期防御（`resolveChildProvider` 入口单点——四消费链汇点）：`modelArg` 非 null 且非字符串 ⇒ 抛**明确错误**（`subagent model override must be a string ("provider:model" | provider | model); got <type>`——不裸 TypeError；tool `model` 参数面同防）；③ settings 写面形状表零改（既有）。
- 落点：`thincoder-core/config.mjs` ∥ `thincoder-core/agent-tools/subagent-async.mjs`（subagent-spawn 零改——汇点在 resolveChildProvider）。
- 验收判据：配置对象形态 `subagentModel` 加载 ⇒ 不采纳（= null）+ 警告一条、spawn 正常（零 TypeError）；`subagentModels` 含非法值键 ⇒ 剔除 + 警告、其余键生效；直接以对象调 `resolveChildProvider` ⇒ 明确错误消息（name = Error、非 TypeError）；合法字符串链逐字零回归。VSC 端壳自读 raw（不经核 loadConfig）⇒ 运行期防线保不崩（加载期清洗端差登记，见上抛）。

**#853 · 历史图片字节预算（设计档 = `PROVIDER.md` §6.3 ∥ §6.7 ∥ D-PR32）**
- 根因（实读）：`token-window.mjs:14/:24` 固定 2000 token/图计账（不约束字节）；`normalize.mjs:13-34` 只按能力剥离、无预算；`tools/file.mjs:26` 15MB 仅单图上限 ⇒ 长会话图片累积 ⇒ 请求体超大 413 且会话卡死。
- 修法：① `IMAGE_HISTORY_BYTES_BUDGET = 32MB`（常量，`normalize.mjs`——40MB 级请求体的保守下界，留两张大图余量；可调）+ `capHistoryImages(messages, budgetBytes)`：全部 image part b64 长度和超预算 ⇒ 从最老起替换为 `[image omitted — dropped to keep the request under the history image budget]`；② **发送前**（`normalize.mjs`——对消息副本，与 stripImages 同址）；③ **注入时**（`agent/record-results.mjs` 图片注入点 :53-59——对 `history` 本体同函数同预算，防无界膨胀）；④ **413 可操作化**（`provider/core.mjs` `!resp.ok` 分支 413 特判）：错误文本追加处置提示（`/compact` 压缩历史 ∥ 移除历史图片）。
- 落点：`thincoder-core/provider/normalize.mjs` ∥ `thincoder-core/provider/core.mjs` ∥ `thincoder-core/agent/record-results.mjs`（token-window / tools/file 零改——计账面协同自然回落）。
- 验收判据：注入构造超预算历史（小预算注入函数直驱）⇒ 最老图先被占位替换、结果字节和 ≤ 预算、新图保留；发送前副本被驱逐而 history 本体不变（拷贝语义）；注入面驱逐改 history 本体（预算内）；413 mock 响应 ⇒ 错误文本含处置指引；预算内零改动（逐字零回归）。

**#877 · POSIX 杀树相位分流（设计档 = `MCP.md` §6.6 ∥ D-MC19）**
- 根因（实读）：`transport-stdio.mjs:20-23` POSIX = `child.kill("SIGTERM")` + 2s `SIGKILL` 升级 timer——退出相位（`process.on("exit")` 无事件循环）timer 不触发 ⇒ 忽略 SIGTERM 的子进程泄漏；且单进程 SIGTERM 只达直接子进程（npx 链孙进程本就漏）。
- 修法：① POSIX spawn 加 `detached: true`（新进程组；win32 分支零改——taskkill /T /F 已覆盖）；② `killTree` POSIX：组杀 `process.kill(-child.pid, sig)`（组 id = 组长 pid；ESRCH ⇒ fallback 单进程 kill）——正常相位 = 组 SIGTERM → 2s 组 SIGKILL 升级；③ **退出相位分流**：`transport-stdio.mjs` 模块加载期注册 `process.on("exit", ...)` 置模块级标志（注册序恒早于宿主 cleanup——CLI `tui-lifecycle.mjs:125` 注册晚于本模块加载）⇒ 退出相位走**同步组 SIGKILL 直达**（不做 SIGTERM 等待——无等待窗口）；④ 测试缝 `_killHooks`（`groupKill` / `childKill` / `setTimer` 可注入——沿 `_rateHooks` 先例）。
- 落点：`thincoder-core/mcp/transport-stdio.mjs`（单档；CLI/desktop/VSC 零触）。
- 验收判据（win32 机位）：注入 spy ⇒ 正常相位调用序 = [组 SIGTERM, (2s) 组 SIGKILL]；退出相位标志注入 ⇒ 调用序 = [组 SIGKILL] 且无 timer；组杀失败（ESRCH）⇒ fallback 单进程；win32 分支零回归。POSIX 生产形腿 = 平台门 skip + 记录（本机 WSL node 坏档——真机复验登记）。

**#878 · 直连 fetch 断流链（设计档 = `PROXY.md` §2 ∥ D-PX8 ∥ `PROVIDER.md` §6.3）**
- 根因（实读）：`stream-destroy.mjs:29` 对 web `ReadableStream`（直连 fetch body）显式 no-op ⇒ `sse.mjs:179` / `google.mjs:204` 的 120s 读侧看门狗静默失效（无代理连接停摆时不断流；proxy 路径自有 `_bodyIdleMs` 不受影响）。
- 修法：**内部 abort 通道**——① `stream-destroy.mjs` 导出 `IDLE_ABORT`（symbol）+ `terminateBody(response, err)`：response 挂有 `IDLE_ABORT` ⇒ `controller.abort(err)`（fetch body 随之中止）；否则 `destroyBody(response.body, err)`（原契约不变）；② `provider/core.mjs` `requestWithRetry`：直连 fetch 建 `AbortController`，signal = `AbortSignal.any([userSignal, idleAbort.signal])`，controller 挂 `response[IDLE_ABORT]`；proxy 路径不挂（自有断流）；③ `sse.mjs` / `google.mjs` 看门狗改调 `terminateBody(response, err)` + `idleFired` 标志：abort 后 for-await 终结，错误归类经标志归一（无内容 ⇒ `sse-idle` 超时错误；有部分内容 ⇒ partial + networkError）。
- 落点：`thincoder-core/stream-destroy.mjs` ∥ `thincoder-core/provider/core.mjs` ∥ `provider/sse.mjs` ∥ `provider/google.mjs`。
- 验收判据：真 fetch + 本地挂起 server（头到齐后停发）+ mock timers 前推 120s ⇒ readSSE 以 `sse-idle` 错误终结（修前 = 永挂——退出码/超时守卫判别）；有部分内容场景 ⇒ partial 语义保留；`terminateBody` 对 PassThrough（proxy 形）走 destroyBody 零回归；`IDLE_ABORT` 缺席的 response 行为零变。

### 2.4 受影响文件表（`wc -l` 口径 = `split("\n").length - 1`；读数 as-of 2026-10-04 设计轮统计；「预期」= 设计预算，实施轮按盘回填）

**组 A（传输与请求面）**

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/mcp/transport-http.mjs` | 248 | +~45 −~12 | #850：postRequest 拆 `postOnce` + 404 自愈包装（reinit 单飞 / retried 标志 / sessionDead / setInitPayload） |
| `thincoder-core/mcp.mjs` | 298 | +~8 | #850：`buildInitParams()` 抽取 + 建连时 `setInitPayload` 注入（doInitialize 共用同源） |
| `thincoder-core/mcp/transport-stdio.mjs` | 142 | +~30 −8 | #877：detached + 组杀 + 退出相位标志 + `_killHooks` 测试缝 |
| `thincoder-core/provider/sse.mjs` | 265 | +~32 −6 | #856 帧形状守卫（handleEvent + mergeToolCalls snapshot）∥ #878 terminateBody + idleFired（同档聚合改） |
| `thincoder-core/provider/google.mjs` | 258 | +~15 −4 | #878：terminateBody + idleFired 同形 |
| `thincoder-core/provider/core.mjs` | 454 | +~15 | #878：idleAbort 建设 + 挂 `response[IDLE_ABORT]` + signal 合成 ∥ #853：413 特判提示（同档聚合改）。**>300 在册 = §2.8.1 次优先（≥437——登记、暂不逐档建计划）；改后 ~469 距 500 硬限余量 ~31** |
| `thincoder-core/stream-destroy.mjs` | 35 | +~15 −2 | #878：`IDLE_ABORT` symbol + `terminateBody`（destroyBody 本体零改） |
| `thincoder-core/provider/normalize.mjs` | 81 | +~35 | #853：`IMAGE_HISTORY_BYTES_BUDGET` + `capHistoryImages` |
| `thincoder-core/agent/record-results.mjs` | 177 | +~8 | #853：注入面调用（history 本体驱逐） |
| `docs/batches/2026-10-04-issue-fix-round1.a.test.mjs` | 0 | 新建 ~350 | 组 A 用例（§2.6-A） |

**组 B（记忆与配置面）**

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `thincoder-core/embedding.mjs` | 122 | +~35 | #859：清洗 + `embedTolerant` + `httpStatus` 标注 |
| `thincoder-core/memory/docs.mjs` | 232 | +~15 | #859：tolerant 消费 + null 跳过 + 回执 |
| `thincoder-core/memory/code-search.mjs` | 149 | +~12 | #859：同款 |
| `thincoder-core/memory/core.mjs` | 319 | +~12 | #859：同款。**>300（as-of 319）；§2.8.1 未见该档登记行——登记缺口 → 上抛 U4** |
| `thincoder-core/auto-think.mjs` | 115 | +~25 | #860：守卫 + classifier 构造 + 可见化 |
| `thincoder-core/config.mjs` | 436 | +~30 | #861：subagentModel/subagentModels 加载期清洗 + 警告（沿 `sanitizeConsultModels` 先例）。**>300 在册 = §2.8.1 主表行 1（拆分计划在册：MCP 热重载族 ∥ DEFAULTS 族外提）；改后 ~466 距硬限余量 ~34；拆分时点疑义 → 上抛 U4** |
| `thincoder-core/agent-tools/subagent-async.mjs` | 461 | +~8 | #861：resolveChildProvider 入口防御。**>300 在册 = §2.8.1 次优先（456 读数行）；改后 ~469** |
| `docs/batches/2026-10-04-issue-fix-round1.b.test.mjs` | 0 | 新建 ~300 | 组 B 用例（§2.6-B） |

**设计档（本设计轮已落笔 · 逐档明细见 §2.1 落点列）**：`docs/core/design/MCP.md`（§6.6 ×2 ∥ §6.9 ∥ §7 D-MC18/D-MC19 ∥ 变更记录）· `PROXY.md`（§2 ∥ §6.1 ∥ §7 D-PX8 ∥ 变更记录）· `PROVIDER.md`（§6.3 ×2 ∥ §6.4 ∥ §6.7 ∥ §7 D-PR31/32/33 ∥ 变更记录）· `MEMORY.md`（§6.3 ∥ §7 D-MEM31 ∥ 变更记录）· `AGENT-LOOP.md`（§6.1 ∥ §7 D-AL26 ∥ 变更记录）· `AGENT-LOOP-SUBAGENT.md`（§6.7.1 ∥ 变更记录）。

**零改面（备核——防误触）**：`thincoder-core/token-window.mjs`（188——计账协同自然回落）∥ `thincoder-core/tools/file.mjs`（463——15MB 单图上限保留；>300 在册 = §2.8.1 子表行 17）∥ `thincoder-core/escape.mjs`（sanitize 复用零改）∥ `thincoder-core/think-off.mjs`（守卫消费零改）∥ `thincoder-core/provider/rate.mjs`（400 不入 RETRYABLE——裁定项）∥ `thincoder-cli/src/**`（禁触区——退出链零改；相位判定自持于核）∥ `thincoder-vscode/**` ∥ `thincoder-desktop/**`（随核包消费）。

### 2.5 验收对照（条目 → 判据 → 机检法；与 §2.0 复验表、§2.3 机制设计同源）

| AC | 条目 | 判据 | 机检法 |
|---|---|---|---|
| AC-1 | #850 | 404 ⇒ 自愈三步（重建 + 重试一次）；二次 404 不重试；非 404 零变 | 批内件 a（mock server 请求计数断言） |
| AC-2 | #856 | 快照帧去重（content 无重复 / tool_calls 覆盖）；纯 delta 零回归 | 批内件 a（帧序列构造直驱 readSSE） |
| AC-3 | #859 | 请求体清洗（无孤立码元）+ 毒行隔离（其余前进 / 不堵 backlog） | 批内件 b（fetch 桩抓 body + 毒行注入） |
| AC-4 | #860 | 不可关 ⇒ 零调用；可关 ⇒ off 形 + `max_tokens: 32`；失败一次可见 | 批内件 b（fetch 桩断言报文体） |
| AC-5 | #861 | 非法形态不崩（加载期不采纳；运行期明确错误非 TypeError） | 批内件 b（loadConfig 直驱 + 解析入口直调） |
| AC-6 | #853 | 超预算驱逐最老、预算内零改、413 带处置指引 | 批内件 a（驱逐函数直驱 + 413 mock） |
| AC-7 | #877 | 相位分流调用序（正常 = SIGTERM→SIGKILL；退出相位 = SIGKILL 直达） | 批内件 a（spy 注入）+ POSIX 生产形腿平台门 skip + 记录 |
| AC-8 | #878 | 直连 fetch 看门狗恢复有效（idle ⇒ 终结 + 归类） | 批内件 a（本地挂起 server + mock timers 前推 120s） |
| AC-9 | 横向 | 批内件全绿（两组各一跑 EXIT 0） | `node --test docs/batches/2026-10-04-issue-fix-round1.a.test.mjs` ∥ `…b.test.mjs` |
| AC-10 | 横向 | 仓根 `node scripts/doc-check.mjs` exit 0 | 命令复跑（本设计轮已自跑——读数 = §2.8） |

### 2.6 用例清单（normal ∥ boundary ∥ error；「组 A」= `…a.test.mjs` ∥「组 B」= `…b.test.mjs`）

**组 A（传输与请求面）**

| id | 类 | 输入 / 动作 | 期望输出与判据 |
|---|---|---|---|
| T-A1 | 正常 | #850：mock server 首答 404 → 重建后成功 | 调用返回正常结果；服务端 `initialize` 计数恰 +1、原请求重发恰 +1（只重试一次） |
| T-A2 | 错误 | #850：重建后仍 404（连续两次） | 不再第三次；错误透传；`fireDead` 触发（onDead 回调可达）；`isAlive` 返 false |
| T-A3 | 边界 | #850：并发两请求同时遇 404 | 单飞重建：`initialize` 恰一次；两请求各自重试一次 |
| T-A4 | 回归 | #850：非 404（500） | 调用序零变（无重建、无重试） |
| T-A5 | 正常 | #856：delta 帧 + 全量 message 帧交错 | `result.content` 无重复（逐字断言） |
| T-A6 | 边界 | #856：递进快照帧链（message 全量递增 ×3） | 只补差量；终值 = 末快照逐字 |
| T-A7 | 边界 | #856：message 帧 content 与已收无前缀关系 | 按增量追加（不吞——保旧行为） |
| T-A8 | 回归 | #856：纯 delta 标准序列 | 逐字零回归 |
| T-A9 | 正常 | #878：本地 server 头到齐后停发 + mock timers 前推 120s | `readSSE` 以 `sse-idle` 错误终结（不再永挂） |
| T-A10 | 边界 | #878：有部分内容 + idle | partial 语义保留（`partial: true` + networkError） |
| T-A11 | 回归 | #878：`terminateBody` 对 PassThrough（proxy 形） | 走 `destroyBody`：errored 保留原错误 |
| T-A12 | 正常 | #877：spy 注入 · 正常相位 | 调用序 = [组 SIGTERM, setTimer(2000)] → 前推 = [组 SIGKILL] |
| T-A13 | 边界 | #877：退出相位标志注入 | 调用序 = [组 SIGKILL] 且无 timer |
| T-A14 | 边界 | #877：组杀 ESRCH | fallback 单进程 kill |
| T-A15 | 平台门 | #877：POSIX 生产形（真 detached 树） | win32 机位 skip + 记录；POSIX 机位跑（真机复验登记） |
| T-A16 | 正常 | #853：超预算历史（小预算注入） | 最老先驱逐、字节和 ≤ 预算、新图保留 |
| T-A17 | 边界 | #853：预算内 | 逐字零改；发送前副本被驱逐而 history 本体不变 |
| T-A18 | 错误 | #853：413 mock 响应 | 错误文本含处置指引（/compact ∥ 移除图片） |
| T-A19 | 边界 | #853：注入面驱逐（history 本体） | 本体规约至预算内 |

**组 B（记忆与配置面）**

| id | 类 | 输入 / 动作 | 期望输出与判据 |
|---|---|---|---|
| T-B1 | 正常 | #859：含孤立代理批 | fetch 桩抓 body 无孤立码元；嵌入成功 |
| T-B2 | 错误 | #859：清洗后仍 400 的毒行 | 毒行跳过；同批其余写入；`skipped` 回执一条 |
| T-B3 | 边界 | #859：网络错（非 400） | 整抛（不逐条）——隔离只对 400 类 |
| T-B4 | 边界 | #859：毒行不阻下批 | 第二轮取到新行（backlog 前进） |
| T-B5 | 正常 | #860：可关模型 | 请求体 = 族别 off 形 + `max_tokens: 32` + 无 `reasoning_effort` 外溢 |
| T-B6 | 边界 | #860：不可关模型 | 零分类调用；一次 warn |
| T-B7 | 错误 | #860：分类调用失败 | 一次 warn + `null` 回退（原语义） |
| T-B8 | 回归 | #860：解析成功路径 | EFFORT_MAP 映射逐字零回归 |
| T-B9 | 正常 | #861：对象形态 config | 加载不采纳（= null）+ 警告一条；spawn 正常（零 TypeError） |
| T-B10 | 边界 | #861：subagentModels 含非法值键 | 剔除该键 + 警告；其余键生效 |
| T-B11 | 错误 | #861：直接以对象调 resolveChildProvider | 明确 Error（消息含期望形态；非 TypeError） |
| T-B12 | 回归 | #861：合法链（default / p:m / 渠道 / 模型） | 逐字零回归 |

### 2.7 关键决策与被否（明细 = §2.3 各条 ∥ 各设计档 D 行；此处只列统领性选择）

1. **#850 轻量 transport 内 reinit**（非直走 `scheduleReconnect`）——「会话刚过期」是高频临时态；退避 1s+ 起步 + 全量重建（含 SSE 重开）过重。被否：不重试（手动恢复负担）· 无单飞（并发 404 触发重建风暴）。失败兜底 = 既有退避链（fireDead）。
2. **#856 快照语义分派**（只对 `delta == null` 帧生效）——被否：统一去重（真增量文本天然可重复——连续标点 / 重复词会误吞）。
3. **#859 清洗主修 + 400 类逐条隔离兜底**——被否：400 入 RETRYABLE（加重试税、无治愈）· 毒行持久登记（新存储面；清洗后已知毒源已消）。
4. **#860 守卫 + 关思考小预算请求**——被否：加大 maxTokens 让思考跑完（延迟 / 成本与 cheap 分类意图相悖）· 换分类渠道（超本批范围）。
5. **#861 三层防线**（加载期清洗 ∥ 运行期明确错误 ∥ 写面形状表）——运行期取「明确错误」而非静默回退：tool 参数面的非法形态应让模型可自纠（静默回退 = 模型以为覆盖生效）。
6. **#853 最老先驱逐**——被否：注入拒绝（体验差 + 413 风险藏于静默丢新图）· 只发送前单点（history 本体无界）。预算初值 = 32MB（可调；量级依据 = 40MB 级请求体保守下界）。
7. **#877 相位标志自持 + detached 组杀**——零「force 标志三档穿透」新语义（crash-guards KD-CG-3 否决形未采纳）。被否：退出相位仅 SIGTERM（不修——缺陷照旧）· 无条件同步 SIGKILL（正常路径失优雅）。
8. **#878 内部 abort 通道**——被否：`ReadableStream.cancel` 面（`for-await` 锁定流上 cancel 拒 TypeError——解锁重构读循环 = 大改）· 绝对墙钟（2026-09-01 已裁废）。

### 2.8 上抛项

- **U1（端差 · #861）**：VSC 端壳 `thincoder-vscode/src/agent/setup.mjs:131-132` 自读 raw 配置（不经核 `loadConfig`）⇒ 加载期清洗对 VSC 不达（**运行期防线已保不崩**）。候裁：VSC 随动（端壳同拍清洗）∥ 接受端差登记。
- **U2（测试面 · #877）**：本机 WSL node 坏档（`Exec format error`）⇒ POSIX 生产形腿不可本机执行——批内件按平台门 skip + 记录（沿 crash-guards T11 先例）；**真机复验登记**（有 POSIX 机位时补跑 T-A15）。
- **U3（行为副作用 · #877）**：`detached: true` 的 POSIX 副作用——终端 SIGINT / SIGHUP 不再直传 MCP 子进程（生命周期由 close 链负责）；非正常终止（父被 SIGKILL）时子进程孤儿化存留概率上升。请评审关注；如需对冲 = 另批（非本批范围）。
- **U4（登记缺口 · 行数面）**：① `thincoder-core/memory/core.mjs` 319 > 300——§2.8.1 未见登记行（登记缺口，待补登 / 补拆分计划）；② `thincoder-core/config.mjs`（在册「消解条件 = 该档下次实质改动时」）本批 +~30 是否构成触发 — 设计席判 **不构成**（守卫类最小修、结构不变；拆分面（MCP 热重载族 / DEFAULTS 族）与本批改动无交集），请评审 / 父侧复核该判定。
- **U5（行号 as-of）**：本段全部 `file:line` = 2026-10-04 设计轮实读；实施轮坐标以盘读为准（D4：行号仅作 as-of 参考）。

**结论**：8 条全部复验「仍存在」并给出设计（修法 / 落点 / 验收判据齐）；6 个设计档已落笔（§2.4）；批内件两组用例清单齐（§2.6）；doc-check 自跑读数 = 见收尾行。

### 2.9 设计评审轮 1 收正块（fix 轮 · 按号 1–9 全采纳 · 2026-10-04 · eng-designer）

**口径**：承 §3 轮次 1 发现表（1🔴 · 4🟡 · 4🔵）· 父侧裁定 = 九条全采纳；**本块为准**——§2 前文相关行（§2.3 / §2.4 / §2.6 / §2.8）如与本块相左，一律以本块为准（append-only）；设计面措辞全量以六设计档现文为准。

**号 1（🔴 · #878 gemini 直连通道缺口）——取评审案 ②（单点收口）**
- 拓扑核验结论（实读 2026-10-04）：`thincoder-core/proxy.mjs` 的 `proxyFetch`（`:266-275`）为 provider 请求共用出口——proxy 两分支（`tunnelHttps` `:269` ∥ `tcpConnectProxy`+`streamHttpResponse` `:271-274`）唯经它；直连面调用点 = `thincoder-core/provider/core.mjs:395-397`（call-site 分支——无 proxyUri 时裸 `fetch`）∥ `thincoder-core/provider/google.mjs:119`（恒经 `proxyFetch`）⇒ **拓扑容 ②：单点收口成立**。
- 修法修订（取代 §2.3 #878 之 ②）：**建通道下移 `proxyFetch` 直连分支单点**（建 `AbortController` + signal 合成 `AbortSignal.any` + 挂 `response[IDLE_ABORT]`）+ **`core.mjs` 请求调用点收口**（恒走 `proxyFetch(url, opts, provider.proxyUri)`——原 call-site 分支删）⇒ 两条流式直连链（`readSSE` ∥ `parseGeminiStream`）同经单点；proxy 两分支零触（自有 `_bodyIdleMs`）。`stream-destroy.mjs`（`IDLE_ABORT` + `terminateBody`）∥ `sse.mjs` ∥ `google.mjs` 看门狗三件照旧。
- 设计面落点（已落）：`PROXY.md` §2（`:28` / `:35-37`）· §6.1（`:93` / `:97`）· §7 D-PX8（`:117`）· 变更记录（`:151`）∥ `PROVIDER.md` §6.3（`:104-105`）· §7 D-PR33（`:492`）· 变更记录（`:582-583`）。
- 用例/验收腿补：§2.6 组 A 补 **T-A22**（google 腿：真 fetch + 本地挂起 server + mock timers 前推 120s ⇒ `parseGeminiStream` 以 `sse-idle` 终结）；AC-8 判据扩「readSSE ∥ google 两腿」；AC-2 扩幂等半句（与号 6 同拍）。
- 受影响表修订：`provider/core.mjs` 行——#878 面改「请求调用点收口（净 ~±0）」（原「idleAbort 建设 + 挂符号 + signal 合成」句随撤；#853 面照旧）；**新入一行**：`thincoder-core/proxy.mjs`（275 · +~10 · #878 直连分支建设——proxy 两分支零改）。

**号 2（🟡 · mcp.mjs 档位注记）**
- §2.4 组 A `thincoder-core/mcp.mjs` 行补档位注记：现 298 → 改后 **≈306 越过 300**；拆分复核结论 = **结构不变**（仅 `buildInitParams()` 抽取 + `setInitPayload` 注入——无新职责 / 无状态面变化），本批不拆；行数面落点 = `CORE-UNIFICATION.md` §2.8.1 子表**行 25**（登记义务随测试体系重建落册）。

**号 3（🟡 · U1 处置）**
- **收为正案 = VSC 端壳同拍清洗**（宿主能力面举证不成立——清洗为纯函数、无宿主约束；「接受端差登记」依据不足，撤）。判定已写进 `AGENT-LOOP-SUBAGENT.md` §6.7.1 端差句（`:37`——清洗逻辑核内单源、端壳 raw 读点同拍消费；用户零可见端差）；变更记录（`:1008`）。
- 受影响面 +1 行：`thincoder-vscode/src/agent/setup.mjs`（297 · +~6 · #861：raw 读点应用核内清洗函数）；§2.4「零改面」句按此收正（`thincoder-vscode/**` 除该一行外零触）。**实施序注**：VSC 树 = 批三（#60）在飞写域 ⇒ 实施派发由父侧统一分流（沿 round4 U1 先例）。

**号 4（🟡 · U3 副作用登记位）**
- 登记位已落设计面：`MCP.md` §6.6 stdio 行补半句（`:115`——终端 SIGINT / SIGHUP 不直传 ∥ 父被 SIGKILL 时孤儿化概率升）+ §7 D-MC19 理由列同拍补句（`:196`）；处置去向 = **接受登记**（对冲如需另批）。变更记录（`:241`）。

**号 5（🟡 · U4 两问落点）**
- ① `memory/core.mjs` 拆分复核行落 `CORE-UNIFICATION.md` §2.8.1 子表**行 24**（现读 319 → 本批 ≈331；拆点候选 = 嵌入维护族 `:158-215` 邻域；消解条件 = 越 500 硬限前或该档下次实质改动时）。
- ② `config.mjs`「不触发」判定落点 = 同档主表**行 1「本批触评」句**（+~30 守卫类最小修、结构不变、与拆分面〔MCP 热重载族 ∕ DEFAULTS 族〕无交集 ⇒ 不构成「下次实质改动」触发；拆分顺延）。
- ③ §2.8.1 相关读数同拍刷新：主表行 1 `config.mjs` **419 ⇒ 436**；次优先 `provider/core.mjs` **491 ⇒ 454** ∥ `agent-tools/subagent-async.mjs` **456 ⇒ 461**（全 = `wc -l` 实读 2026-10-04；同档变更记录 `:2046-2048`）。

**号 6（🔵 · 错误/幂等腿）**
- §2.6 组 A 补两行：**T-A20**（#856 幂等：同一全量 message 帧连收两次 ⇒ content / reasoning 零再增、tool_calls 无重复）∥ **T-A21**（#878 错误/幂等：`terminateBody` 二次调用 ⇒ 幂等不抛；无通道 ∥ 无 body ⇒ no-op 不抛）。
- AC-2 判据扩「幂等：同帧重复零再增」；AC-8 判据扩「`terminateBody` 幂等 / 无 body no-op」（与号 1 的 google 腿同拍）。

**号 7（🔵 · 注册序坐标）**
- 举证点收正：`tui-lifecycle.mjs:125` ⇒ **`thincoder-cli/src/tui/index.mjs:125`**（`process.on("exit", cleanup)` 注册点；`createExitCleanup` 工厂住 `tui-lifecycle.mjs`）。结论（注册晚于 transport-stdio 加载）不变。

**号 8（🔵 · think-off 读数）**
- `PROVIDER.md` §6.3 相关句读数收正（已落 `:219`）：`thincoder-core/think-off.mjs` **26 ⇒ 49**（`wc -l` 实读 2026-10-04；含后批上提 `applyAdvisorEffort`）。

**号 9（🔵 · #850 射程）**
- 修法句 / AC-1 补半句：**「legacySSE 分支零触（无会话语义）」**（射程 = Streamable POST 面含 postOnly；legacy 分支不读写 `sessionId`、非 2xx 直映射照旧——`thincoder-core/mcp/transport-http.mjs:125-152` 实读）；同拍落 `MCP.md` §6.6 HTTP 行射程括注（`:108`）。
- AC-1 判据修订（全句）：404 ⇒ 自愈三步（重建 + 重试一次）；二次 404 不重试；非 404 零变；**legacySSE 分支零触**。

**机检（本块落地后复跑 · 仓根 `node scripts/doc-check.mjs`）**：**exit 0**（悬空 0 · 行宽 0；行数面差异 8 条 = 报告态存量）。披露：首落笔曾红一次（7 悬空 + 2 行宽——均为本块新增行）：裸引路径 5 处（`memory/core.mjs` ×3 ∥ `provider/core.mjs` ×2）补 `thincoder-core/` 前缀；`AGENT-LOOP-SUBAGENT.md` §6.7.1 删窄符号谓词「导出」（消 2 条符号悬空）；§2.8.1 题行（337 字符）与 `PROVIDER.md` §6.3 句（335 字符）折行（仅换行、零语义）。当场收正后复跑即 exit 0。
**边界（本块）**：零实现码（设计 / 记录面收正）；不触批三（#60）/ ACP（#59）/ 面板（#65）写域；不触已收口批档；`MCP.md` 仅动批一相关段（§6.6 / §7 D-MC19 / 变更记录——批三面 §6.4 零触）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批 2026-10-04-issue-fix-round1 设计（批档 §2 + 六档设计笔：`MCP.md` §6.6/§6.9/D-MC18/D-MC19 ∥ `PROVIDER.md` §6.3/§6.4/§6.7/D-PR31–33 ∥ `MEMORY.md` §6.3/D-MEM31 ∥ `AGENT-LOOP.md` §6.1/D-AL26 ∥ `AGENT-LOOP-SUBAGENT.md` §6.7.1 ∥ `PROXY.md` §2/§6.1/D-PX8）；状态 = 待评审。限制声明：无项目标准档 / 无文档地图 ⇒ Document ownership 按 Project Guide 降级判；`node scripts/doc-check.mjs` 本评审实例不可执行（无 shell）⇒ AC-10 读数 = **unverified**（旁证：六档设计笔新增行无 >300 宽面非表格行，`PROJECT-MANIFEST.json:24-36` 的 exclude 含 `batches`、`widthExemptZones` 含 变更记录/历史沿革）。行数抽查（read 面）：transport-http 248 ∥ mcp.mjs 298 ∥ transport-stdio 142 ∥ sse 265–266 ∥ google 258–259 ∥ core.mjs 454 ∥ stream-destroy 35 ∥ normalize 81 ∥ embedding 122 ∥ memory/core 319 ∥ auto-think 115 ∥ config 436 ∥ subagent-async 461–462 ∥ token-window 188 ∥ tools/file 463——与表值 ±1 内相符。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility（机制覆盖） | 🔴 | #878 的内部 abort 通道只挂 `provider/core.mjs` 的 `requestWithRetry`，而 gemini 直连请求**不经该函数**：`thincoder-core/provider/google.mjs:8` 引的是 `./retry.mjs` 的 `requestWithRetry`（`retry.mjs:20-41` 仅 `await request()`，不建 controller、不挂符号），fetch 本体在 `google.mjs:118-127`：`proxyFetch(url, {…signal…}, provider.proxyUri)`；无 proxyUri ⇒ `proxy.mjs:267` 原生 `globalThis.fetch` ⇒ body = web `ReadableStream`。改后 `google.mjs:204` 看门狗调 `terminateBody(response, err)` 时该 response 无 `IDLE_ABORT` ⇒ 落回 `destroyBody` ⇒ `stream-destroy.mjs:29` 对 web 流 no-op ⇒ **gemini 直连路径的 120s 读侧看门狗仍是 no-op（#878 未修）**。而设计面已宣告双读者覆盖：`PROVIDER.md:104`「读侧空闲断流（`readSSE` ∥ `parseGeminiStream`）经单点 `terminateBody`……web `ReadableStream`（直连 fetch）走内部 abort 通道」∥ `PROXY.md:36-37`；验收亦无 google 腿（批档:121/168 = T-A9/AC-8 只跑 `readSSE`）。 | 三选一并同拍落设计面与用例：① 在 `google.mjs` 自己的请求站点同式建 controller（`AbortSignal.any` + 挂 `IDLE_ABORT`）；② 把建通道下移到 `proxyFetch` 直连分支（一处覆盖两条直连链，与「proxy 路径不挂」判据自洽）；③ 明文把 gemini 直连排除在 #878 射程外并收窄 `PROVIDER.md` §6.3 ∥ `PROXY.md` §2 的覆盖句。任一方向都需补一条 google 腿（真 fetch + 本地挂起 server + mock timers）到 AC-8/T-A9 侧。 |
| 2 | Affected-file size annotations | 🟡 | `thincoder-core/mcp.mjs`（批档:130 行）现读 298–299 行、预期 +~8 ⇒ 改后 ~306–307 **越过 300 档**，该行无档位注记 / 拆分复核；同表对其它 >300 档（`provider/core.mjs` ∥ `config.mjs` ∥ `subagent-async.mjs` ∥ `memory/core.mjs`）都给了在册行 + 拆分立场。 | 该行补档位注记（>300 新触或在册 + 拆分复核结论，例：「结构不变——仅 `buildInitParams()` 抽取 + `setInitPayload` 注入」），越线则同拍登记行数面落点。 |
| 3 | 上抛处置（U1 · #861） | 🟡 | U1（批档:228）把「接受端差登记」列为候选处置——与在册用户裁定「用户可见端差 = 缺陷；唯一例外 = 宿主能力面（须实证）；登记后保留通道已废」相抵（裁定原文 = `AGENT-LOOP-SUBAGENT.md:1002-1003`）；且该端差可被用户看见：同一份对象形态 `subagentModel`，CLI 经加载期清洗 ⇒ spawn 正常；VSC 不经清洗（按批档声明，**unverified**）⇒ 同一动作抛运行期错误，两端一成一败。 | 收为正案 = VSC 端壳同拍清洗，或举证属宿主能力面；「接受端差登记」单列需注明依据不足。判定结果同拍写进 `AGENT-LOOP-SUBAGENT.md` §6.7.1 的端差句。 |
| 4 | 上抛处置（U3 · #877 副作用） | 🟡 | `detached: true` 的 POSIX 副作用（终端 SIGINT / SIGHUP 不再直传 MCP 子进程；父被 SIGKILL 时子进程孤儿化概率升）只住批档 §2.8 U3 一行（批档:230）；设计面 `MCP.md` §6.6 stdio 行（`:108-112`）与 §7 D-MC19（`:193`）只写组杀 / 相位分流，无该副作用或其处置的登记位——批档收口后长期面无载体。 | 在设计面给一个登记位（D-MC19 理由列或 §6.6 同句补半句）+ 处置去向（接受 / 对冲归属），使「已认账」在长期档可引。 |
| 5 | 上抛处置（U4 · 行数登记与触发判定） | 🟡 | U4（批档:231）两问均影响后续轮：① `memory/core.mjs` 现读 **319 > 300**（本席实读）、本批再改（+~12）仍无拆分复核，设计只在表内记「登记缺口 → 上抛 U4」；② `config.mjs`（现读 **436**）消解条件 = 「该档下次实质改动时」，本批 +~30 是否构成触发——设计席判「不构成」但无落点，且本批不改 `CORE-UNIFICATION.md` §2.8.1 ⇒ 改后读数将陈。 | ① 给 `memory/core.mjs` 补一行拆分复核（或写明补登义务的落点与轮次）；② 「不触发」判定写明落点（设计面决策行 ∥ 收口轮）+ 同拍刷新 §2.8.1 相关读数，使下一轮不必重开该问。 |
| 6 | Acceptance | 🔵 | 用例类覆盖：#856 ∥ #878 两组无「错误」类行（T-A5–A8 ∥ T-A9–A11；#877 的 ESRCH 腿可按错误面计）；#878 缺幂等/错误腿（二次 `terminateBody`、无 body、body 已消费）。 | 两组各补一条错误/幂等腿，或写明该面不适用的理由。 |
| 7 | Clarity（坐标） | 🔵 | 批档:113 的注册序举证错档：「CLI `tui-lifecycle.mjs:125` 注册晚于本模块加载」——实读 `thincoder-cli/src/tui/tui-lifecycle.mjs` 全档 113 行、无 `process.on("exit")` 注册；`process.on("exit", cleanup)` 实住 `thincoder-cli/src/tui/index.mjs:125`（`createExitCleanup` 工厂在 tui-lifecycle，注册在 index.mjs）。结论（注册序晚于 transport-stdio 加载）仍成立。 | 坐标收正为 `thincoder-cli/src/tui/index.mjs:125`（或写明工厂 / 注册两点分列）。 |
| 8 | Doc hygiene（读数） | 🔵 | `PROVIDER.md:219` 记「单源实现 `thincoder-core/think-off.mjs`（已落 · 实读 **26**）」，实读该档 **49** 行（read 面；含后批上提的 `applyAdvisorEffort`）——本批 #860 正消费该档（`thinkOffPath`/`thinkOffShape` 已核实导出）。 | 该读数随本批同拍收正或标 as-of，避免「单源」引证落在陈旧读数上。 |
| 9 | Clarity（射程边界） | 🔵 | #850 修法句（批档:77）与 AC-1 只按 Streamable POST 面描述，未声明 `transport-http.mjs:133-136` 的 legacySSE 分支零触（该分支同有非 2xx 直映射、且不读写 `sessionId`）。 | 修法句或 AC-1 补半句「legacySSE 分支零触（无会话语义）」，把射程写死。 |

**计数**：1🔴 · 4🟡 · 4🔵（复核项：分组零重叠 ✓（组 A/B 文件集实核无交）· 复验表 8 条证据锚逐条实读命中（transport-http.mjs:168-172/:245 · sse.mjs:139/:147-150 · embedding.mjs:88 · auto-think.mjs:66-68/:76/:104-106 · subagent-async.mjs:142/:150/:153 + subagent-spawn.mjs:80-82 · normalize.mjs/token-window.mjs:14,24/tools/file.mjs:26 · transport-stdio.mjs:20-23 · stream-destroy.mjs:29）· `resolveChildProvider` 四处消费链实核 ✓ · `thinkOffPath`/`thinkOffShape` 导出在盘 ✓ · `sanitizeConsultModels` 先例在盘 ✓ · `capHistoryImageBytes` 全仓零命中 ✓）。
**VERDICT: changes-required**

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
