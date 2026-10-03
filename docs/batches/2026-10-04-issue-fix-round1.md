# 2026-10-04 · issue 修复批·一（核健壮性 8 条：MCP 自愈 ∥ SSE 重复帧 ∥ embedding 毒行 ∥ auto-think ∥ subagentModel ∥ 图片预算 ∥ POSIX 杀树 ∥ fetch 看门狗）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:34「开批吧」（承 00:34 父侧归批组提醒 + 00:31「都自动跑」全自动授权）；条目源 = 2026-10-03 分诊（#850 ∥ #853 ∥ #856 ∥ #859 ∥ #860 ∥ #861 ∥ #877 ∥ #878）。
> 台账 = #850 ∥ #853 ∥ #856 ∥ #859 ∥ #860 ∥ #861 ∥ #877 ∥ #878（核面 · 归批）。前情 = 无（独立批——需求源 = 2026-10-03 gitee/GitHub 分诊台账行 ×8）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04（双组落定 · 22/23 ∥ 17/17 · 全链闭合）
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
**状态行**：设计完成（2026-10-04 登记/回填轮——#82/#83 未决 号 1–3 落毕（§2.10）；§2.8.1 终态读数按「读数面」例回填；doc-check 复跑 exit 0）
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

### 2.10 登记/回填块（fix 轮 · 2026-10-04 · eng-designer）

**口径**：承父侧 2026-10-04 裁定（源 = #82 ∥ #83 交付报告未决项 + 三号裁定）——号 1 行数面终态回填 ∥ 号 2 `PROVIDER.md` 头阶段超时句射程收窄 ∥ 号 3 `sse.mjs` 贴线档登记。**本块为准**——§2.4「预期」列与 §2.9 相关读数行如与本块相左，一律以本块为准（append-only）；设计面措辞以设计档现文为准。**产品码零触**（登记/回填轮；批内件两档随批留存）。

**号 1 · 组 A/B 终态读数回填（口径 = `split("\n")` 末空减一；读数 = 批一实施终态，源 = #82 报告末表 ∥ §5 两舱台账；届盘复读 = 20 档全数实读——18 逐值吻合，2 附注在行）**

**组 A（传输与请求面）**

| 文件 | §2.4 预算 | 终态（前 → 后） | 注 |
|---|---|---|---|
| `thincoder-core/mcp/transport-http.mjs` | 248 · +~45−12 | 248 → **296** | |
| `thincoder-core/mcp.mjs` | 298 · +~8 | 298 → **306** | >300 预登记在册（§2.9 号 2；§2.8.1 行 25） |
| `thincoder-core/mcp/transport-stdio.mjs` | 142 · +~30−8 | 142 → **165** | |
| `thincoder-core/provider/sse.mjs` | 265 · +~32−6 | 265 → **296** | 贴线（余 4 行）——号 3 登记 |
| `thincoder-core/provider/google.mjs` | 258 · +~15−4 | 258 → **273** | |
| `thincoder-core/provider/core.mjs` | 454 · +~15 | 454 → **460** | >300 在册（§2.8.1 次优先） |
| `thincoder-core/stream-destroy.mjs` | 35 · +~15−2 | 35 → **62** | |
| `thincoder-core/provider/normalize.mjs` | 81 · +~35 | 81 → **138** | |
| `thincoder-core/agent/record-results.mjs` | 177 · +~8 | 177 → **180** | 现盘 182 = +批五后续笔 2 行（`32ca9533`——后批增量，非本批面） |
| `thincoder-core/proxy.mjs` | 275 · +~10 | 275 → **284** | §2.9 号 1 案②单点建设（提交面见列报 ①） |
| `docs/batches/2026-10-04-issue-fix-round1.a.test.mjs` | 新建 ~350 | 新建 **684** | 批内件（见下） |

**组 B（记忆与配置面）**

| 文件 | §2.4 预算 | 终态（前 → 后） | 注 |
|---|---|---|---|
| `thincoder-core/embedding.mjs` | 122 · +~35 | 122 → **154** | |
| `thincoder-core/memory/docs.mjs` | 232 · +~15 | 232 → **234** | |
| `thincoder-core/memory/code-search.mjs` | 149 · +~12 | 149 → **151** | |
| `thincoder-core/memory/core.mjs` | 319 · +~12 | 319 → **321** | >300 在册（§2.8.1 行 24） |
| `thincoder-core/auto-think.mjs` | 115 · +~25 | 115 → **139** | |
| `thincoder-core/config.mjs` | 436 · +~30 | 436 → **466** | >300 在册（§2.8.1 主表行 1） |
| `thincoder-core/agent-tools/subagent-async.mjs` | 461 · +~8 | 461 → **466** | >300 在册（§2.8.1 次优先） |
| `thincoder-vscode/src/agent/setup.mjs` | 297 · +~6 | 300 → **309** | +9 = 批一自笔；>300 建议线——档位注记归 VSC 面（本轮未触） |
| `docs/batches/2026-10-04-issue-fix-round1.b.test.mjs` | 新建 ~300 | 新建 **377** | 批内件（见下） |

**批内件两档（登记 = 记录接受——设计强制面 23/17 腿；随批留存件；KD-4 先例 = `docs/batches/2026-09-29-desktop-compress-row-pin.md`）**：a 件 **684**（代码 594 ∥ 注释 43 ∥ 空行 47；§5 记 685 = `split("\n")` 含尾空元素口径——±1 计法差；23 腿 = §2.6-A 19 + §2.9 三条〔T-A22 双径分列〕；T-A15 平台门 skip）∥ b 件 **377**（T-B1–T-B13 细分 17 腿）。**两件不计线**；父侧如需按缺陷族分件另裁。

**设计档面读数回填（按「读数面」例处置——零语义）**：`CORE-UNIFICATION.md` §2.8.1 实施后终态实读回填——主表行 1（`config.mjs` **466**）∥ 子表行 24/25（`memory/core.mjs` **321** ∥ `mcp.mjs` **306**）∥ 次优先两读（`subagent-async.mjs` **466** ∥ `provider/core.mjs` **460**）∥ 新增免登记余档行（`sse.mjs` **296**——见号 3）；`PROVIDER.md` ∥ `CORE-UNIFICATION.md` 变更记录各一行同拍。

**号 2 · `PROVIDER.md` §6.3 头阶段超时句射程收窄（已落）**：响应头阶段 `fetchTimeoutMs` 的**消费面 = 代理分支**（`proxyFetch` 两分支 `tunnelHttps` ∥ `tcpConnectProxy`+`streamHttpResponse`）；**直连面（无 `proxyUri`）无本仓头阶段超时**——「直连面纳入」= 须走设计轮（裁定在册）。同族旁证复查（零动）：`:320` 与 D-PR6 无直连面执行主张（`PROXY.md:30` 见列报 ②）。

**号 3 · `sse.mjs` 贴线档登记**：**结论 = 本批不拆**（#856 ∥ #878 皆行内改、结构不变）∥ **触发 = 越 300 即拆；复核点 = 该档下次触碰时**；拆点候选（触发时细化）= 工具调用合并 ∥ 收尾族 ∥ 读侧看门狗 ∥ idle 两径归一段——外提姊妹档。登记落点 = `CORE-UNIFICATION.md` §2.8.1 免登记余档行（已落）。

**列报（父侧收口面）**：① 组 A 提交 `ea5bf70d` 未含 `thincoder-core/proxy.mjs`——#878 单点建设（275 → 284）现盘仍未提交（截至本刻 `git status` M；疑因 = 提交清单按 §2.4 原表、未含 §2.9 号 1 新入行）——请收口链核处。② `PROXY.md:30`「与直连 600s 语义区分」= 同族陈旧前提句（越本轮写面——另裁）。③ `transport-http.mjs` 同读 296（距 300 余 4 行——未在号 3 射程；如需同式登记请裁）。

**机检（本块落地后复跑 · 仓根 `node scripts/doc-check.mjs`）**：**exit 0**（悬空 0 ∥ 行宽 0；行数面差异 **12** 条 = 桌面档报告态存量〔含他线在飞漂移〕——本批零命中）。

**边界（本块）**：产品码零触 ∥ 需求档零触 ∥ 在飞写域零触（批五面 ∥ 批三已收口档）∥ 已收口批档零触；不点火评审 ∥ 不跑构建 ∥ 零实现码。

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

### 轮次 2（评审子代理）

**评审对象**：issue 修复批·一 设计面 · 评审轮次 2（复评）——逐条验证 §3 轮次 1 的 9 条（1🔴 · 4🟡 · 4🔵）修复状态（fix 轮 = §2.9 收正块）；重点 = 🔴 取案②（建通道下移 `proxyFetch` 直连分支——拓扑核验结论 ∥ 覆盖句同步 ∥ google 腿 T-A22）成立性。
**限制声明**：本评审实例无 shell ⇒ `node scripts/doc-check.mjs` 不可执行——AC-10 复跑读数 **unverified**（fix 块自报 exit 0 并披露）；`CORE-UNIFICATION.md`（357KB）∥ `AGENT-LOOP-SUBAGENT.md`（135KB）按修复落点节段读（§2.8.1 ∥ 变更记录 ∥ §6.7.1），非全文；行数抽查（read 面）= `mcp.mjs` 298 ∥ `think-off.mjs` 49 ∥ `proxy.mjs` 275 ∥ `config.mjs` 436 ∥ `memory/core.mjs` 319 ∥ `agent-tools/subagent-async.mjs` 461——与表值吻合。

**逐条核验（9/9 已修复）**：
1. 🔴 号 1（#878 拓扑）= **已修复且成立**：拓扑核验结论独立复核——`thincoder-core/proxy.mjs:266-275`（`proxyFetch`；直连分支 `:267`；`tunnelHttps` 唯一生产调用点 `:269` ∥ `tcpConnectProxy`+`streamHttpResponse` `:271-274`）；直连面两链入口 = `thincoder-core/provider/core.mjs:395-397`（call-site 分支实读）∥ `thincoder-core/provider/google.mjs:119`（恒 `proxyFetch`）；读侧看门狗全仓仅 `thincoder-core/provider/sse.mjs:179` ∥ `thincoder-core/provider/google.mjs:204`（grep 实证）⇒ 收口后单点覆盖 `readSSE` ∥ `parseGeminiStream` 成立。覆盖句已同步（`PROXY.md:28/:35-37/:93/:97/:117` ∥ `PROVIDER.md:104-105/:493`）；T-A22 / AC-8 / AC-2 扩与受影响表修订（`proxy.mjs` 275 · +~10）在 §2.9:244-245 在册。
2. 🟡 号 2（mcp.mjs 档位）= 已修复：`CORE-UNIFICATION.md:1149` 子表行 25（298 → ≈306；>300 须带；拆点候选；消解条件）+ 计数句（`:1109/:1110/:1112/:1119`）+ 变更记录 `:2046`。
3. 🟡 号 3（U1）= 已修复：`AGENT-LOOP-SUBAGENT.md:37` 端差句（正案 = VSC 端壳同拍清洗；宿主能力面举证不成立）+ 变更记录 `:1008`；`thincoder-vscode/src/agent/setup.mjs:131-132` raw 读点实读吻合。
4. 🟡 号 4（U3）= 已修复：`MCP.md:115` 副作用登记半句 ∥ §7 D-MC19 `:196` ∥ 变更记录 `:241`。
5. 🟡 号 5（U4）= 已修复：`CORE-UNIFICATION.md:1091`（主表行 1：`config.mjs` 436 + 本批触评「不构成触发」）∥ `:1148`（子表行 24）∥ `:1153-1154`（次优先 454/461）∥ `:2046-2048`。
6. 🔵 号 6 = 已修复：§2.9:263-264（T-A20 ∥ T-A21 + AC-2/AC-8 扩句）。
7. 🔵 号 7 = 已修复：§2.9:267；`thincoder-cli/src/tui/index.mjs:125` 实读吻合（`createExitCleanup` `:124`）。
8. 🔵 号 8 = 已修复（记录节号残留，见发现表）：`PROVIDER.md:220` 实读 **49**；`think-off.mjs` 49 行吻合。
9. 🔵 号 9 = 已修复：`MCP.md:108` 射程括注（Streamable POST 面含 postOnly；legacySSE 分支零触）；`mcp/transport-http.mjs:125-152` legacy 分支实读（会话语义不涉——`sessionId` 仅非 legacy 路径读写 `:165` ∥ close `:223-232`）。

**发现表（复评轮）**：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene（记录节号） | 🔵 | 号 8 收正块（§2.9:270）与 `PROVIDER.md` 变更记录（`:584`）均把 think-off 读数收正记在「§6.3 :219」——该句实住 §6.12 `:220`（§6.3 区间 `:95-105` 内无该句） | 两处记录节号/行号收正为 §6.12 `:220`（或标 as-of） |
| 2 | Acceptance（用例措辞） | 🔵 | T-A22（§2.9:244）记「`parseGeminiStream` 以 `sse-idle` 终结」——google 腿相位串实为 `google-sse-idle`（`thincoder-core/provider/google.mjs:204` 实读）；且「无内容 ⇒ 超时错误 ∥ 有内容 ⇒ partial」两径须经 `idleFired` 归一（google 现形 catch 对 idle 文案即落 partial 径——`google.mjs:242/:256-258` 实读），用例若写死 `sse-idle` 或按现形断言会与实施形错位 | T-A22 断言锚「idle ⇒ 终结（不再永挂）」+ 相位串按实施形落 + 两径断言分列（无内容 ⇒ 超时错误；有内容 ⇒ partial） |

**计数**：0🔴 · 0🟡 · 2🔵（复评：轮次 1 九条全修复；🔴 定向复核 = 取案② 成立）
**VERDICT: pass**

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-04 00:31「都自动跑」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass** ✓：轮次 2 复评 #78（`VERDICT: pass` · 🔴 0 ∥ 🟡 0 ∥ 🔵 2——**9/9 修复核验**；🔴 取案② 定向复核 = **成立**）；
- ② **修正落地核验** ✓：fix 轮 #67 九条全落（`PROXY.md` §2/§6.1/D-PX8 ∥ `PROVIDER.md` ∥ `MCP.md` ∥ `AGENT-LOOP-SUBAGENT.md` ∥ `CORE-UNIFICATION.md` §2.8.1 ∥ 本档 §2.9）；父侧抽验在盘 + `doc-check` exit 0；**#78 两🔵处置** = ① 节号收正就地落（`PROVIDER.md:584`——父侧直接执行 · 可 revert）∥ ② T-A22 措辞纠正随实施任务书明示（相位串按实施形 ∥ 「无内容 ⇒ 超时错误」两径断言分列——不改档）；
- ③ **token 已签发** ✓（值不入档，纪律照守）。

**批准面**：#850 ∥ #853 ∥ #856 ∥ #859 ∥ #860 ∥ #861 ∥ #877 ∥ #878——**两组并行派发**（组 A 传输/请求 10 档 ⇒ eng-coder 甲 ∥ 组 B 记忆/配置 9 档 ⇒ eng-coder 乙——文件面含 `thincoder-vscode/src/agent/setup.mjs`，与批三实施 #79 交叠，由调度器自动串行）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（两组——甲：组 A 10 档 + a 件 22/23（T-A15 平台门 skip）；乙：组 B 9 档 + b 件 17/17；内审各 1 轮 ∥ 代码评审各 1 轮 pass（甲 🔴 0））

### 5.1 交付摘要（组 B · #859 ∥ #860 ∥ #861 · 9 档）

| 文件 | 行数（前→后） | 落点（file:line ∥ 要点） |
|---|---|---|
| `thincoder-core/embedding.mjs` | 122 → 154 | `:118` 发送前逐条 `sanitizeLoneSurrogates`（主修）；`:131-139` 抛错携 `httpStatus`（重试耗尽路同携）；`:53-78` 新增 `embedTolerant`（400 类逐条隔离 → `{vectors, skipped}`；其余整抛） |
| `thincoder-core/memory/docs.mjs` | 232 → 234 | `:198-204` tolerant 消费 + `null` 行跳写 + `[docs]` 一行回执 |
| `thincoder-core/memory/code-search.mjs` | 149 → 151 | `:120-126` 同款（`[code]` 回执） |
| `thincoder-core/memory/core.mjs` | 319 → 321 | `:173-181` 同款（entries+files 双面索引偏移同改；`[memory]` 回执） |
| `thincoder-core/auto-think.mjs` | 115 → 139 | `:78-84` `thinkOffPath` 守卫（不可关 ⇒ 零调用 + 按 model 一次 warn）；`:94` `classifierProvider`（`maxTokens:32` + `thinkOffShape(spec)` + `reasoningEffort:null`）；`:122-129` 失败一次可见（按错误签名去重）+ `null` 回退 |
| `thincoder-core/config.mjs` | 436 → 466 | `:191-206` `sanitizeSubagentModel` / `sanitizeSubagentModels` 两导出（非法形态不 throw）；`:208-214` 进程级一次性警告（含修复指引）；`:339-342` loadConfig 接线 |
| `thincoder-core/agent-tools/subagent-async.mjs` | 461 → 466 | `:142-147` `resolveChildProvider` 入口防御（`null` ∕ 空串回继承；其余非字符串 ⇒ 明确 Error，不裸 TypeError） |
| `thincoder-vscode/src/agent/setup.mjs` | 300 → 309 | `:21` 核内单源导入；`:75-80` 端侧一次性警告；`:138-141` raw 读点同拍清洗（与 CLI loadConfig 同判） |
| `docs/batches/2026-10-04-issue-fix-round1.b.test.mjs` | 新建 377 | T-B1–T-B13（17 腿 = §2.6-B 12 行细分 + 表外增益腿 T-B13；平 node · 零网络） |

**行数注记（承评审 🟡①）**：`setup.mjs` 300 → 309（预测 +~6，实测 +12——多出的一端侧一次性警告 helper 为「用户零可见端差」判据的直接导出项；<500 硬限；>300 建议线请父侧/设计席按需补档位注记）。`config.mjs` = 466（恰合预算）。

**跑法与读数（先红后绿）**：`node --test docs/batches/2026-10-04-issue-fix-round1.b.test.mjs`——**先红 = 15 红 ∕ 2 绿**（2 绿为既有回归腿 T-B8/T-B12）；**后绿 = 17/17 全绿 · fail 0**（#859 腿 6 ∥ #860 腿 5 ∥ #861 腿 6）。`node scripts/doc-check.mjs` = **exit 0**（锚闸悬空 0 · 行宽 OK；行数面 9 条差异全为桌面档报告态存量——本批 9 档零命中）。

### 5.2 决策透明表

| # | 决策 | 理由 |
|---|---|---|
| D1 | `embedTolerant` 返回 `{vectors, skipped}`（毒位 `null` 占位）而非抛出 | 三消费面须「跳过不写 + 一行回执」；首条原因 = `skipped[0]`（批档 §2.3 #859） |
| D2 | 清洗复用 `sanitizeLoneSurrogates`（实码语义 = **剥除**孤立码元） | 设计明定「escape.mjs 复用零改」；T-B1 期望值按实码锁定（上游档注称 U+FFFD 与实码不符——另记，见评审 🔵） |
| D3 | VSC 端壳清洗 + 端侧一次性警告（净 +9 行） | 批档 §2.9 号 3「同拍清洗、用户零可见端差」；诊断面同判（先例 = `presets.mjs` `warnConsultModelsFiltered`） |
| D4 | `resolveChildProvider` 门形 = `== null ∥ ""` 回继承 ∥ 其余非字符串抛明确 Error | 设计「非 null 且非字符串 ⇒ 明确错误」；空串 = 既有文档化等价（`subagent-spawn.mjs:78` 邻注）；`false` ∕ `0` ∕ `NaN` 的收口随内审 F1 |
| D5 | 越表改动 = **零**（9 档全在派发文件面内） | — |

### 5.3 审计与代码评审轮次与终态

- **内审（分岔审计 · 1 轮）**：**1 项（低）**——F1：`resolveChildProvider` 的 falsy 门静默吞 `false` ∕ `0` ∕ `NaN`（与设计判据及自身注释不符）⇒ **就地收口**（D4）+ 用例扩（T-B11 扩 falsy 腿 ∥ T-B12 扩 `undefined` ∕ 空串回归腿）。
- **代码评审（advisor code · 1 轮）**：🔴 0 ∥ 🟡 3 ∥ 🔵 3；**VERDICT: pass**。🟡 = ① `setup.mjs` 309 越 300 建议线 + 批次档未载档位注记（见 5.1 行数注记）② §5/§6 档面未落 + §2.4 预期与实测偏离（本 §5 即回填落盘）③ VSC 改动覆盖 = 结构腿（记账 + 上抛父侧收口跑端侧套件）。🔵 = >300 在册档（R3 不升级）∥ T-B1 锁定实码语义（已就地注记）∥ 清洗强转（当前不可达，注记）。
- **fix round**：代码面 1 处（F1）+ 测试面 2 处（T-B1 注记 ∥ T-B11/T-B12 扩腿）。**复跑读数**：17/17 绿（如上）。
- **终态**：**clean**（🔴 0；未决 = 登记项：端侧套件跑迹 = 父侧收口面）。

### 5.4 边界遵守

零组 A 面触（`mcp/*` ∥ `provider/*` ∥ `stream-destroy.mjs` ∥ `proxy.mjs`——他批在飞文件面）∥ 零 `docs/**` 设计档触 ∥ 零在飞写域触（`thincoder-vscode/src/agent/setup.mjs` 与批三实施交叠：落笔前核验该档收笔 = 盘面 mtime 19.5min 未动 + round3 §5.1 终态读数在案）∥ 零改面核验零改：`escape.mjs` ∥ `think-off.mjs` ∥ `model-specs.mjs` ∥ `provider/rate.mjs` ∥ `agent-tools/settings.mjs` ∥ `thincoder-cli/src/**`。

### 5.5 交付摘要（组 A · #850 ∥ #877 ∥ #856 ∥ #878 ∥ #853 · 10 档 + 批内件）

| 文件 | 行数（前→后） | 落点（file:line ∥ 要点） |
|---|---|---|
| `thincoder-core/mcp/transport-http.mjs` | 248 → 296 | `:126` `postOnce(method, params, retried)`（原 `postRequest` 拆出）；`:173-192` 404 自愈三步（清会话 `:178` ⇒ 单飞重建 ⇒ 重试恰一次 `:181`）+ 失败兜底（`:183-189` `sessionDead` + `fireDead("session expired")`；close 竞态守卫 `:181` ∕ `:185`）；`:243-260` `reinitialize`（单飞 `:247`；close 双检 `:250` ∕ `:254`）；`:263` `setInitPayload`；`:268` close 复位；`:293` `isAlive` 含 `!sessionDead`；legacy 分支 `:130-157` 零触 |
| `thincoder-core/mcp.mjs` | 298 → 306 | `:56-62` `buildInitParams()` 参数单源（导出面）；`:76` 建连 `setInitPayload` 注入；`:209` `doInitialize` 同源 |
| `thincoder-core/mcp/transport-stdio.mjs` | 142 → 165 | `:9-10` 模块加载期退出相位标志；`:14-18` `_killHooks` 测试缝；`:30-45` `killTree` 相位分流（正常 = 组 SIGTERM → 2s 组 SIGKILL ∥ 退出 = 同步组 SIGKILL 直达 ∥ ESRCH ⇒ 单进程回落；win32 分支原样）；`:52` POSIX `detached` |
| `thincoder-core/provider/sse.mjs` | 265 → 296 | `:156-175` 帧形状分派（快照帧 = `delta == null && message != null`）；`:26-30` 前缀补差；`:36` ∕ `:59-60` `mergeToolCalls` snapshot 覆盖；`:201-209` 看门狗 `terminateBody` + `idleError`；`:248-272` 两径归一 |
| `thincoder-core/provider/google.mjs` | 258 → 273 | `:199-209` 看门狗同形（相位串 `google-sse-idle`）；`:246-255` idle 两径归一（无内容 ⇒ 超时错误 ∥ 有内容 ⇒ partial） |
| `thincoder-core/provider/core.mjs` | 454 → 460 | `:399` 请求调用点收口（恒走 `proxyFetch`——call-site 分叉删）；`:129-130` 发送前 `capHistoryImages`（副本）；`:411-414` 413 处置指引 |
| `thincoder-core/stream-destroy.mjs` | 35 → 62 | `:43` `IDLE_ABORT`；`:54-62` `terminateBody` 分流（通道 ⇒ `controller.abort(err)` ∥ 否则 `destroyBody`；缺位 ∕ 无 body no-op）；`destroyBody` 本体零改 |
| `thincoder-core/provider/normalize.mjs` | 81 → 138 | `:14` `IMAGE_HISTORY_BYTES_BUDGET`（32MB）；`:17` 占位文本（设计逐字）；`:35-68` `capHistoryImages`（最老先驱逐；预算内返原引用 `:49`） |
| `thincoder-core/agent/record-results.mjs` | 177 → 180 | `:178-179` 注入面本体驱逐（真图注入后 `agent.history = capHistoryImages(...)`） |
| `thincoder-core/proxy.mjs` | 275 → 284 | `:269-276` 直连分支建通道（`AbortController` + `AbortSignal.any` + `response[IDLE_ABORT]`——§2.9 号 1 案②单点建设）；proxy 两分支零改 |
| `docs/batches/2026-10-04-issue-fix-round1.a.test.mjs` | 新建 685 | 23 test 块 = §2.6-A 19 行 + §2.9 三条（T-A20/A21/A22；T-A22 双径分列；google 相位串按实施形） |

**跑法与读数（先红后绿）**：`node --test docs/batches/2026-10-04-issue-fix-round1.a.test.mjs`——**先红 = 20 红 ∕ 2 绿 ∕ 1 skip**（2 绿 = 保旧行为回归腿 T-A7 ∕ T-A8；红含 T-A5 实读 `'HelloHello world!'` vs 期望 `'Hello world!'`〔#856 重复帧复现〕∥ T-A9 看门狗 `settled=false`〔#878 永挂复现〕∥ T-A12 ∕ T-A16 ∕ T-A19 = 面缺红）；**后绿 = 22 过 ∕ 0 败 ∕ 1 skip · exit 0**（T-A15 = win32 平台门 skip——本机 WSL node 坏档〔Exec format error〕，真机复验登记）；fix 后复跑同读数。`node scripts/doc-check.mjs` = **exit 0**（悬空 0 ∥ 行宽 0；行数面 9 条差异全为桌面档报告态——本批零命中）。另：真实装配链探针（`connectMcpServer` + mock server，临时区）实证 404 ⇒ `initialize` 恰 +1 + 重试成功 + 工具返回正常。

### 5.6 决策透明表

| # | 决策 | 理由 |
|---|---|---|
| A1 | 自愈链三处 close 守卫（`:181` `healed && !closed` ∥ `:185` 死态标记 `!closed` ∥ `:250` ∕ `:254` 重建双检） | 设计未定 close×自愈竞态；内审 🟡 就地收口——close 落在自愈飞行中：不复活会话 ∥ 不外发 `initialized` ∥ 不重试（探针复证：initialize 1 次、tools/list 无重试、无 notify） |
| A2 | idle 判定以 `idleError` 非空承载（语义 = 设计「`idleFired` 标志」） | 等价实现形（值非空 ⟺ 已触发）；两径分流经它 |
| A3 | `buildInitParams()` 导出（mcp.mjs 导出面 +1） | 「参数单源不可分叉」——批内件复用同一函数（不复制字面）；属设计抽取项的直接形态 |
| A4 | 发送面 cap 落点 = `chatImpl` 内 `stripImagesForTextModel` 紧后（对副本） | §2.3 #853 ②「与 stripImages 同址」；位于格式分派前 ⇒ 四 transport 同享 |
| A5 | 越表改动 = 零（10 档全在 §2.4 + §2.9 号 1 修订表内；`.thincoder/tmp/` 探针件 = 临时区，非交付面） | — |

### 5.7 审计与代码评审轮次与终态

- **内审（分歧审计 · 1 轮）**：四类偏差 0（终判 clean）；风险面 1 🟡（close×自愈竞态）+ 2 🔵（旧 transport 替换不关闭 = 设计面归口 ∥ `process.emit("exit")` 用例注记）⇒ 🟡 就地收口（A1）+ 探针复证。
- **代码评审（advisor code · 1 轮）**：🔴 0 · **VERDICT: pass**。🟡 2（① `PROVIDER.md:102` 头阶段超时句与直连现形分歧——非本批引入、报告面 ② 批内件 685 行 vs §2.4 预算 ~350——批内件不计线〔KD-4 先例 `2026-09-29-desktop-compress-row-pin.md:348`→`:371`〕不升级、父侧记账）∥ 🔵 3（`record-results` 换引用观察 ∥ 用例确定性两注 ∥ 组 A §5 记录回填 = 本块）。**零强制修复项**。
- **fix round**：代码面 1 处（A1）；测试面 0。复跑 22 ∕ 23（同上）。
- **终态**：**clean**（🔴 0；未决 = 登记项：T-A15 真机复验 ∥ 批内件行数记账 ∥ crash-guards T7 断代红〔见 5.8〕）。

### 5.8 披露（越表 ∕ 断代 ∕ 登记项）

1. **批内件 685 行**（代码 594 ∥ 注释 43 ∥ 空行 48）超 §2.4 预算「~350」：23 腿 = 设计强制面（§2.6-A 19 + §2.9 三），压缩需删腿 ∕ 并腿（与「逐腿」「两径分列」相抵）⇒ 保留原形；批内件不计线（KD-4），父侧如需按缺陷族分件请裁。
2. **crash-guards T7 断代红**（`docs/batches/2026-10-03-crash-guards.test.mjs`）：该腿钉「google 无内容 idle ⇒ resolve 空结果」旧形；本批 §2.9 号 1 收正为「无内容 ⇒ 超时错误」+ 其 fetch 桩体不认 abort 通道 ⇒ 复跑 9 ∕ 10 绿（T6 ∕ T9 ∕ T10 零回归）。归口 = 断代件重锚（另批 ∕ 父侧裁）；本批零触。
3. **AC-1「legacySSE 分支零触」半句**：批内件无专用腿（§2.6-A 未列）——以实读合规举证（`transport-http.mjs:130-157` 无 404 ∕ 会话逻辑；`!resp.ok` 仅映射 `POST failed: HTTP ${status}`）。
4. **`mcp.mjs` 306 > 300**：§2.9 号 2 已预登记；`sse.mjs` 296 距 300 顾问线 4 行（下次触及该档时拆点候选登记）。
5. **designId 回显**：本舱 spawn 载荷未携 designId 明文——如实缺项（不猜、不以实例 id 充数）；写授权经 token 门在写时核验（10 档 + 批内件全部写入获准 ⇒ token 在位）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（设计（#56）→ 评审 #63（changes-required）→ 轮 1 修 #67 九条 → 复评 #78（pass · 9/9）→ §4 代签 → 双组实施（甲 #82 ∥ 乙 #83）→ 登记/回填轮 #90 号 1–3 → 本节核销 → 签入）

- **交付判据链**：#850 会话过期自愈（探针 `initialize` 恰 +1 + T-A1/A3）∥ #877 杀树相位分流（T-A12/T-A13）∥ #856 帧形状守卫（T-A5 重复帧复现→消）∥ #878 案②单点收口（T-A9/A22 两链 + 拓扑独立复核）∥ #853 图片字节预算 ∥ #859 embedding 三面（毒行不阻下批——T-B4）∥ #860 think 守卫（T-B5–B8）∥ #861 三层防线（T-B9–B13）∥ 批内件 a（684 行 · 22 过/0 败/1 skip——T-A15 win32 平台门）+ b（377 行 · **17/17**）∥ `doc-check` exit 0 ∥ 提交 `ea5bf70d`（补签 `dd6c82f5`——`proxy.mjs` 漏行，登记轮抓出）+ `c870433b`。
- **残余（在册）**：① 批内件 a 684 行（**记录接受**——设计强制面 23 腿 · KD-4 先例）；② crash-guards `T7` 断代重锚（台账 #897）；③ `T-A15` POSIX 真机复验（win32 平台门 skip——登记）；④ `PROXY.md:30` ∥ `PROVIDER.md:102` 头阶段超时同族收窄已落（`dd6c82f5` ∥ #90）；⑤ `transport-http.mjs` 296 贴线（§2.10 表在册，不单立）。
- **结算**：台账 #850 ∥ #853 ∥ #856 ∥ #859 ∥ #860 ∥ #861 ∥ #877 ∥ #878 核销 ∥ 签入。
