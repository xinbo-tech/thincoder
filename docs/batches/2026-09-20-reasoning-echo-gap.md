# 2026-09-20 · thinking 回传缺口修复批（#109）

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮）

**前情** = 无（独立缺陷批）· **母本** = 用户 2026-09-20 00:57 截图反馈 + 父侧逐条实核（行号已收正）

### 1.1 报告与实核

| 面 | 配置（实读） | 表现（用户提供） |
|---|---|---|
| 子代理 `eng-designer` | `agent.subagentModel` / `subagentModels` 未设 ⇒ 继承主模型 `deepseek:deepseek-flash`（thinking） | **挂 2 次**（长任务 · 编号疑为 run id · 未核） |
| 评审 `advisor` | `agent.advisor = {guard:true}` · 同样继承主 provider | 跑完 2 次 |

⇒ **差异不在模型强弱，在暴露量**：多轮子代理 = 更多「可能漏 reasoning」的机会。

### 1.2 病与自我强化机制

- **病根**（实读 · 截图记 `agent.mjs:351` 系早期行号，真位置 = **`:373-374`**）：
  `...(response.reasoning && specForModel(agent.provider.model).reasoningEcho === "required" ? { reasoning_content: response.reasoning } : {})`
  ⇒ **本轮回复无 reasoning ⇒ 该 assistant 消息不带 `reasoning_content` 入库**。
- **镜像同形** = `thincoder-core/advisor/loop.mjs:212-215`（其注释 `:199-204` 自陈已观测症状「server stops returning reasoning_content on later rounds…」）。
- **自我强化**：漏一次 ⇒ 后续轮次模型不再吐 reasoning ⇒ 再漏 ⇒ 供应商从某一轮起一律 400 ⇒ **整条会话死**。
- **症状形态**：总是「**跑了大半程突然中断**」，而不是一开头就挂。
- **⚠️ 口径收正（设计轮 178 真机取证 · 父侧 01:15 落笔 · 以本句为准）**：当日轨迹（`~/.thincoder/traces/2026-09-20/` **690 次调用**）中，「assistant(tool_calls) 缺 rc」形态 **263 次全部 200 成功** · rc-less 无 tool_calls 形态 117 次亦全成功 · 该目录 **0 条 error** ⇒ 「**一律 400 ⇒ 整条会话死**」在**普通请求面不成立**；72h 窗内唯一该 400 文案 = **2 条 prefix 探针**（`2026-09-18` · **另族**——与 `PROVIDER.md` §14 铁律同源、已由 §14.2 止损）。**本批的实测病象 = 服务端停止回推理**（178 真机三连：缺字段 200 但 reasoning 帧 = **0**；空串 **200** 且推理恢复；真值 200）⇒ **修法价值 = 推理连续性 + 同族收口**（非「防猝死」）。上文原报告口径保留为史实。

### 1.3 暴露面（实读）

- `reasoningEcho:"required"`：`model-specs.mjs:33/35/38/40/42`（deepseek 族）+ `:44/46/48`（kimi）+ `:75/76`（mimo）；
- `config-presets.mjs:17` deepseek preset = `thinking:{type:"enabled"}` ⇒ 该族**默认暴露**；
- glm 族 = `"optional"`（不暴露）。

### 1.4 已知同族护栏（修法须对齐，勿另起一套）

- `context.mjs:289-290`（**D-CC18 echo safety**——无 `reasoning_content` 的 assistant 紧邻 assistant ⇒ DeepSeek 族 thinking 模式 **400**）；
- `session-lifecycle.mjs:93`（D-CC18 病态形态）；`test/compaction-echo.test.mjs`（专门不变量检出器）。
- ⇒ 项目已在**压缩/邻接面**打过这一仗，**live push 面（`agent.mjs` 主推入 + `loop.mjs` 镜像）仍是条件式**。

### 1.5 待裁三点（交设计轮 · 父侧不自定方案）

1. `required` 族**是否无条件回传**（缺值回空串？须核供应商接受面与序列化形态）；
2. 缺值补齐策略**与 D-CC18 家族对齐**（复用既有判据 vs 新增）；
3. `advisor/loop.mjs` 镜像**同轮修否**（advisor 同样在 required 族上）。

### 1.6 台账

- **#109** → 本批（待讨论 → **待设计**；任务书指针 = 本档 §2）。

## §2 批次任务与设计（eng-designer）

**状态行**：🔄 设计轮完成（2026-09-20 01:0x）· 方案 = 活体推入面回声恒带（核单点构造）· 执行宿主 = 核（CLI 主循环 + advisor 循环共用核模块）

### 2.1 三点待裁 —— 逐条结论（含量化面）

| # | 待裁项 | 结论 | 理由（量化面） |
|---|---|---|---|
| ① | `required` 族是否无条件回传（缺值回空串？） | **是 —— 无条件回传；缺值 ⇒ 空串 `""`（字段不省略）** | 真机三连实证（2026-09-20 · `deepseek-flash` · 带 `tools` · 同形历史，经核 `provider/core.mjs` 实发）：带空串 **200** 且服务端仍回 `reasoning` 63 字符 · 缺字段 **200** 但服务端 `reasoning` 帧 = **0** · 带真值 **200**（104 字符）。⇒ ① 供应商**接受空串**（「不可离线证」风险消解）② 缺字段轮服务端不再回推理 —— 与 `advisor/loop.mjs:199-204` 自述症状同向（n=1 采样，症状面证据非独立结论）。量化面：spec 表 **10 行**翻面（deepseek ×5 `model-specs.mjs:33/35/38/40/42` · kimi ×3 `:44/46/48` · mimo ×2 `:75/76`）；推入点 **2 处**；glm / 未声明族 **0 行**改。 |
| ② | 缺值补齐与 D-CC18 家族对齐（复用判据 vs 新增） | **复用判据 + 新增修法行（D-CC22）** | 判据同源 = 「`required` 族机读线上 assistant 消息不得缺 `reasoning_content`」：D-CC18 治压缩注入 · D-CC19 治恢复读取 · 本批治**活体推入**（第三面，前两者不覆盖）。修法不同（前两者**消形态**，本面**材料化字段**）⇒ 同族不同面：§6.10 新增 **#9** + §7 新增 **D-CC22**；不新造判据、不动 D-CC18/19 代码。既有谓词 `isAssistantEchoPair`（`context.mjs:230-235`）**零改**：空串 falsy ⇒ 空回声消息在无 `tool_calls` 时仍属「可并入」类（预期语义 —— 空串无内容可配对）。 |
| ③ | advisor 镜像同轮修否 | **同轮修** | 该镜像走 `providerSpec(provider)`（`advisor/loop.mjs:11`）—— `required` 族同样命中；构造式与主循环逐字同形（`loop.mjs:205-215` ↔ `agent.mjs:366-376`）⇒ 单点替入后一行之差；分轮修 = 同族缺陷留一半（其 `:199-204` 注释自陈症状即本批病灶）。 |

### 2.2 修法（单点构造 + 场规则）

落点 = `thincoder-core/model-specs.mjs`（新增导出）：

```js
export function assistantToolCallMessage(response, spec) {
  const msg = {
    role: "assistant",
    content: response.content || null,
    tool_calls: response.toolCalls.map((tc) => ({
      id: tc.id, type: "function", function: { name: tc.name, arguments: tc.arguments },
    })),
  }
  if (spec?.reasoningEcho === "required") {
    msg.reasoning_content = typeof response.reasoning === "string" ? response.reasoning : ""
  }
  return msg
}
```

行为矩阵（**唯一 Δ**）：`required` + 空/缺 reasoning = `{reasoning_content: ""}`（改前 = 无字段）；`required` + 有值 = 逐字不变；`optional` / 未声明（含 `DEFAULT_SPEC`）= 逐字不变（恒无字段）。

调用点（替入后两处不再各自内联）：
- 主循环 `thincoder-core/agent.mjs:366-376` → `pushReal(agent, assistantToolCallMessage(response, specForModel(agent.provider.model)))`；
- advisor `thincoder-core/advisor/loop.mjs:205-215` → `messages.push(assistantToolCallMessage(response, providerSpec(provider)))`；
- 导入面：`thincoder-core/config.mjs:91-92` 的 import/export 名表加一项（两推入点均经 config 门面取 spec —— 保持单一导入面）。

落点否决：`context.mjs`（**496 行 + Δ > 500 硬限** ⇒ `core-hygiene` 硬红）· 新档 `reasoning-echo.mjs`（单函数新模块，收益不抵模块面）· 各推入点内联同式（**双构造点**，违 D2 单源）。

### 2.3 受影响文件表（as-of 2026-09-20 01:0x 读数）

| 文件 | 现量（行） | Δ | 越线核查 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 182 | +12（导出函数 + 头注） | 194 ≤ 300 ✓ |
| `thincoder-core/config.mjs` | 420 | ±0（`:91/:92` 名表加项） | 420 ≤ 500 ✓（>300 已在 `SOFT_LINE_REGISTRY`） |
| `thincoder-core/agent.mjs` | 440 | −2（3 行条件式 → 1 行调用） | 438 ≤ 500 ✓（>300 已登记） |
| `thincoder-core/advisor/loop.mjs` | 299 | −2 | 297 ≤ 300 ✓（回落软线内） |
| `thincoder-core/test/model-specs.test.mjs` | 60 | +~30（规则面断言组） | ≤300 ✓ |
| `thincoder-core/test/core-hygiene.test.mjs` | 124 | +~12（构造单点结构检查） | ≤300 ✓ |
| `thincoder-cli/test/integration/reasoning-echo-live.test.mjs` | 新建 | ~90 | ≤300 ✓ |

设计轮已落文档（设计面，非实施面）：`docs/core/design/CONTEXT-COMPACTION.md` 510 → **513**（§6.10 #9 + §7 D-CC22 + 变更记录）· `AGENT-LOOP.md` 541 → **544**（§6.4 契约行 + 变更记录；**超 500 硬限** —— 沿革自 D-CC18 批登记 506）· `ADVISOR-CONVERGENCE.md` 345 → **347**（§12 契约行 + 变更记录）。

### 2.4 可机检验收（≥4 · 命令 + 断言面）

| # | 判据（断言面明写） | 命令 |
|---|---|---|
| A-C1 | **规则面**：`assistantToolCallMessage({content:null,toolCalls:[…],reasoning:""}, specForModel("deepseek-flash")).reasoning_content === ""` 且 `"reasoning_content" in msg === true`；同 spec + `reasoning:"rc"` ⇒ `=== "rc"`；`specForModel("glm-5.3")`（`optional`）与未知模型（`DEFAULT_SPEC`）⇒ **键不存在**（有值/无值两情形） | `cd D:\teamcode\thincoder\thincoder-core && node --test test/model-specs.test.mjs` |
| A-C2 | **宿主面（§1.5 指定机检）**：真循环 + 脚本化 provider（`mockLLM`），模型 = `deepseek-flash`；脚本 = 步1 带 reasoning 的工具调用 → 步2 **无 reasoning 的工具调用** → 步3 纯文本收尾；断言**第 3 次请求体**中该 assistant 消息 `'reasoning_content' in m === true && m.reasoning_content === ""`，且**第 2 次请求体**中前一工具轮消息 `reasoning_content === "think-1"`（有值面零回归） | `cd D:\teamcode\thincoder\thincoder-cli && node --test test/integration/reasoning-echo-live.test.mjs` |
| A-C3 | **optional 族零改**：同宿主、模型 = `glm-5.3`，全量抓取请求体中**任一** assistant 消息 `'reasoning_content' in m === false`（含 mock 已回 reasoning 帧的情形） | 同 A-C2 文件 |
| A-C4 | **D-CC18 家族回归保持绿**：压缩注入 / 恢复归并产物零「无 rc 的 assistant 紧邻 assistant」形态 + 文本 / `tool_calls` 守恒 + 干净输入同引用（既有 T0–T3 / M0–M3 全绿；本批零改其代码） | `cd D:\teamcode\thincoder\thincoder-core && node --test test/compaction-echo.test.mjs` |
| A-C5 | **核全量门**：`npm test`（= `node test/run.mjs` → `node --test test/*.test.mjs`）全绿（含 `core-hygiene` 行数硬限与新增结构检查） | `cd D:\teamcode\thincoder\thincoder-core && npm test` |
| A-C6 | **构造单点结构检查**：`agent.mjs` / `advisor/loop.mjs` 两档**零 `reasoning_content:` 字面**（字段字面只存于 `model-specs.mjs` 单点） | 归 A-C5 档内（`test/core-hygiene.test.mjs`） |
| A-C7 | **前置真机探针**（实施轮开工前一次三连）：带 `tools` + 同形历史 —— 空串 / 缺字段 / 真值三形态各 1 请求 ⇒ 期望 200/200/200（设计轮实测 = 200 · 200 · 200）。**出现 400（"must be passed back"）⇒ 停下上报，不得带病上线** | 核 `provider/core.mjs` `chat()` 直调（一次脚本；`traces.enabled=true` 自动留证） |

### 2.5 边界与不变量

- **不改 provider 序列化语义**：`provider/*` 零改；`stripLocalMessageFields`（`escape.mjs:139-147`）只剥 `ts`/`transient` ⇒ `reasoning_content` 原样到线；`escapeMessageContent` 对 `""` 恒等；线上形态 = `"reasoning_content":""`（键序不变：role → content → tool_calls → reasoning_content）。
- **不动 glm / optional / 未声明族**：行为逐字不变（A-C3 反向断言）。
- **不触压缩 / 恢复面**：`context.mjs`（496）· `session-lifecycle.mjs` 零改；D-CC18/19 判据与代码不变（A-C4 回归）；族关系 = 同判据、不同面（§2.1 ②）。
- **不新增请求 / 轮次 / token 语义**：`context.mjs:30` 对 `""` 计 0 增量；显示面零改（`history-window.mjs:43-46` `reasoningOf` 对 `""` 返回 null ⇒ 不出幽灵帧）。
- **不预造防护**：非工具路径 / 续写路径不修（判据见 §2.6）。

### 2.6 本批不做 / 登记（逐点判据）

| # | 面 | 坐标 | 判据 / 处置 |
|---|---|---|---|
| 1 | **VSC 端活体推入（第三站点 —— §1 未列）** | `thincoder-vscode/src/agent.mjs:387-397`（同形条件式；自持 `./specs.mjs` 的 `specForModel`） | **停下上报**（本轮不静默改批界）：父侧裁定「随本轮同式修」（⇒ 端侧单点构造 + `thincoder-vscode/test/` 宿主用例）或「另批登记」。核侧修复经 `@thincoder/core` 不覆盖端自持循环 ⇒ 端侧不随修则同缺陷存活。 |
| 2 | 主循环非工具路径 assistant 推入（final answer） | `thincoder-core/agent/completion.mjs:59/77/90/105/143` · `agent.mjs:306/324` | 不在本批形态面（无 `tool_calls`；D-CC18 批 R4 已同判登记）。若父侧要「`required` 族 assistant 消息**恒带**」的**全域**口径 ⇒ 另批裁（本批只闭工具轮面）。 |
| 3 | 续写尾块 | `provider/core.mjs:296-301` | 不修（不可构造：prefix 路径已由 §14.2 精简历史剔工具链；partial 路径基请求须先过校验）。 |

### 2.7 与 §1 不一致处（附证据）

1. **§1.2 自我强化链的「一律 400」在普通请求面不成立**：当日轨迹目录 `~/.thincoder/traces/2026-09-20/`（690 次调用 · 本地 00:00–01:5x）实算 —— 「assistant(`tool_calls`) 缺 `reasoning_content`」形态 **263 次请求全部成功**；「无 `tool_calls` 的 rc-less assistant」形态 117 次亦全成功；该目录 `"error"` 字段 **0 命中**。⇒ 缺字段**不**在普通请求面致 400。
2. **72h 窗内唯一带该 400 文案的记录 = 2 条探针**（`2026-09-18/02a338af07b1-2154.jsonl` · `-2266.jsonl`，`kind:"probe"`）：形态以 assistant 收尾 + 带 `tools` ⇒ 与 `docs/core/design/PROVIDER.md` §14 铁律（thinking 模式 **prefix 续写 + 工具链历史 ⇒ 必 400**）同源，非本批病灶（该面已由 §14.2 止损）。
3. ⇒ **修法仍立**（协议回传面闭环 + 族内形态统一 + 缺字段轮服务端不再回推理的实测症状），但「**整条会话死**」的因果链需另证 —— 本批**不据此扩面**；§1.1 的「挂 2 次」本批**不认定为 chat 面失败**（当日核 call 零失败记录；症状复现路径待父侧另查，本档只登记）。

### 2.8 需求面判定句（交主 agent 落需求档）

**判定句**：`specForModel("deepseek-flash").reasoningEcho === "required"` 的模型下，工具轮响应 `reasoning` 为空时，推入机读线的该 assistant 消息满足 `'reasoning_content' in msg === true` 且 `msg.reasoning_content === ""`；`optional`（`glm-5.3`）/ 未声明族两种情形下该键**恒不存在**。

**设计档落点（单源）**：`docs/core/design/CONTEXT-COMPACTION.md` §6.10 #9 + §7 **D-CC22**（判据与决策单源）；`AGENT-LOOP.md` §6.4（主循环推入面）与 `ADVISOR-CONVERGENCE.md` §12（advisor 镜像面）各一行指针。

**两档关系（报告项）**：`AGENT-LOOP.md` = 主循环（`agent.mjs`）机制档 · `AGENT-LOOP-SUBAGENT.md` = 子代理 / 评审池 / 上行通道族档（**不**拥有 `advisor/loop.mjs` 装配面）· advisor 循环 owning 档 = `ADVISOR-CONVERGENCE.md`（实现载体表 `:12` 明列 `advisor/loop.mjs`）· 回声安全家族判据单源 = `CONTEXT-COMPACTION.md`（D-CC18/19/22 同表）。

### 2.9 第三站点（VSC 端壳自有循环）补面 —— 设计轮 fix · 2026-09-20

**轮次**：设计轮 fix（定点扩展——承 §2.6 行 1 上报 + 父侧裁定「同批同式修」，不另立批）；体例承 §2.2–§2.7。**本轮零真机探针**（证据已在 §2.1 在册）。

**① 第三站点落点与端侧组合式**

- **站点**：`thincoder-vscode/src/agent.mjs:387-397`（同形条件式——端自持 `./specs.mjs` 的 `specForModel`）。**端面实扫**（`reasoning_content|reasoningEcho` 于 `thincoder-vscode/src/**` 命中 2 处）：活体推入面 = 上述**唯一一处**（`:394-395`）；另一处 `thincoder-vscode/src/extension/panel-session.mjs:92` = D-CC18 注释（显示 / 恢复面）⇒ **端侧无第四站点**。
- **组合式**（改后）：`pushReal(history, fullHistory, assistantToolCallMessage(response, specForModel(provider.model)))`。
- **逐字同形度**：与核主循环（`assistantToolCallMessage(response, specForModel(agent.provider.model))`）同形——**同一构造单点 + 单行调用**；差值仅「取值表达式」= 各站点自持的 spec 面（advisor 站点 = `providerSpec(provider)`）。
- **端取值面零改**：`specForModel`（`thincoder-vscode/src/specs.mjs:46-50`）= 核规格表 + 端差 `reasoningEffortDefault`——未命中端差行 ⇒ 核返回值原样；命中 ⇒ 浅拷贝（spread）⇒ `reasoningEcho` 判定**等价**。
- **端构造单点入口（转口形态）**：`thincoder-vscode/src/specs.mjs:11` 的核 import 名表加 `assistantToolCallMessage` + `:13` re-export（先例 = 同址 `providerSpec` 转口）；`thincoder-vscode/src/agent.mjs:6` 的端 import 面同批加名 ⇒ **端壳零新增模块边**（取值与构造同走一端入口，D2）。
- **W8 契约② 实核（本席只读闭包扫描——同 `thincoder-vscode/test/engine-floor-guard.test.mjs:101-127` 算法）**：① 核 `thincoder-core/model-specs.mjs` 静态闭包 = **自身 1 档 / builtins 0 / unresolved 0** ⇒ `node:sqlite` 不可达；② 端壳 `thincoder-vscode/src/agent.mjs` 静态闭包 = **123 档 / builtins 11（无 `node:sqlite`）**，且 `thincoder-core/model-specs.mjs` **已在闭包内**（经 `thincoder-vscode/src/specs.mjs:11`）⇒ **加名零新增闭包条目 ⇒ 静态引合法**（无须改动态 import）。

**② 受影响文件表（VSC 面 · as-of 2026-09-20 01:2x 本席实读）**

| 文件 | 现量（行） | Δ | 越线核查 |
|---|---|---|---|
| `thincoder-vscode/src/agent.mjs` | 494 | **−10**（`:387-397` 11 行 → 1 行调用；`:6` 加名 ±0 行） | 484 ≤ 500 ✓ |
| `thincoder-vscode/src/specs.mjs` | 61 | ±0（`:11` / `:13` 两行加名——行数不变） | 61 ≤ 300 ✓ |
| `thincoder-vscode/test/integration/reasoning-echo-live.test.mjs` | 新建 | ~95 | ≤500 ✓（测试档 500 硬限无豁免） |
| `thincoder-vscode/test/integration/files.mjs` | 22 | +1（清单登记——D3 清单与实档同动） | ≤500 ✓ |
| 核侧 | —— | 0（本面无核侧新增文件） | 构造单点 / 导入面计数已在 §2.3 在册（`thincoder-core/model-specs.mjs` · `thincoder-core/config.mjs:91-92`） |

设计面文档（本轮落笔 · 本席读数口径 = 文件按 `\n` 切分元素数）：
- `docs/core/design/CONTEXT-COMPACTION.md` **516 → 517**（§6.10 #9 调用点枚举 2 → 3 + §7 D-CC22 共用口径收正 + 变更记录一行）；
- `docs/core/design/AGENT-LOOP.md` **544 → 547**（§6.4 补第三站点 + §6.18 新增行〔七面 → 八面〕+ 变更记录一行；同批收正上条变更记录的死锚形态；**超 500 硬限**属沿革在册）；
- `docs/core/design/ADVISOR-CONVERGENCE.md` **零改**（三站点枚举与验收锚单源 = `CONTEXT-COMPACTION.md` §6.10 #9；§12 行对象 = advisor 面，逐字仍真——D2 不复制）。

**③ 可机检验收（VSC 面 · 命令 + 断言面明写；判据行禁中文 `findstr /c:` 形态——台账 #102）**

| # | 判据（断言面明写） | 命令 |
|---|---|---|
| A-C8（T-V-RC1 / T-V-RC2） | **VSC 宿主面**：真端壳循环（`thincoder-vscode/src/agent.mjs` 的 `runAgent`）+ 脚本化 provider（`test/integration/helpers/mock-llm.mjs` 的 `mockLLM` / `providerFor(llm, { model: "deepseek-flash" })`）；夹具 = tmp 工作区（含 `.git`）+ tmp config（`_setConfigPathForTest`——同 `scenario-01`）；脚本 = 步1（`reasoning:"think-1"` + 工具调用）→ 步2（**无 reasoning** 的工具调用）→ 步3（纯文本收尾）。断言：**`llm.requests[2].body.messages`** 中**最后一条**带 `tool_calls` 的 assistant 消息（= 步2 轮）满足 `'reasoning_content' in m === true && m.reasoning_content === ""`；**`llm.requests[1].body.messages`** 中步1 的 assistant 消息 `m.reasoning_content === "think-1"`（有值面零回归）。**边界（同档第二例）**：模型 = `glm-5.3` ⇒ 全量 `llm.requests[*].body.messages` 中任一 assistant 消息 `'reasoning_content' in m === false` | `cd D:\teamcode\thincoder\thincoder-vscode && node --test test/integration/reasoning-echo-live.test.mjs` |
| A-C9（T-V-RC3） | **端侧单点结构面（零第二构造点）**：`thincoder-vscode/src/agent.mjs` 源文本零 `reasoning_content:` 字面 + `assistantToolCallMessage(` 调用恰 1 处；`thincoder-vscode/src/specs.mjs` 含 `assistantToolCallMessage`（import ∧ re-export 两面） | 同 A-C8 文件 |
| A-C10 | **端清单登记不破（D3）**：新档在集成清单在册、零漏登记（runner 启动自检 = `thincoder-vscode/test/run.mjs:28-56`） | `cd D:\teamcode\thincoder\thincoder-vscode && npm test` |
| A-C11 | **端壳静态闭包不破（W8 契约②）**：`node:sqlite` 不入端壳静态链（本次加名零新增闭包条目） | `cd D:\teamcode\thincoder\thincoder-vscode && node --test test/engine-floor-guard.test.mjs` |

**④ 边界与不变量（端面版）**

- **零新增静态边**：端壳静态闭包实测 123 档 / 零 `node:sqlite`——核 `thincoder-core/model-specs.mjs` 本就在闭包内 ⇒ 加名不改闭包（A-C11）。
- **端不复制字段字面**：`reasoning_content:` 字面只存核 `thincoder-core/model-specs.mjs` 单点；端壳零该字面（A-C9）——后续再内联条件式即红。
- **端差面零改**：`reasoningEffortDefault` / `ctxPercentForModel`（`thincoder-vscode/src/specs.mjs`）零改；端 `specForModel` 的 `reasoningEcho` 判定等价。
- **显示面零改**：webview / 面板面零触（`history-window` 经核转口；`reasoningOf` 对 `""` 返回 null ⇒ 不出幽灵帧）。
- **端壳其余面零改**：`thincoder-vscode/src/agent.mjs` 仅 `:6` 与 `:387-397` 两处；`extension/**` / `webview/**` / 其余 `src/**` 零改（零第四站点——①）。
- **他端 / 核侧零改**：核两站点（§2.2）与 `provider/*` 序列化面零改；`optional` / 未声明族行为逐字不变（A-C8 边界例）。

**⑤ 与已定结论 / 父侧裁定的一致性**

- §2.6 行 1（原「停下上报」）：父侧已裁定**同批同式修** ⇒ 处置落定为本节（不改 §2.6 原行——本节即其处置面）。
- §2.1 ③：advisor 站点结论不变；第三站点 = 同判据的第三个执行站点（**非新判据、非新决策行**）。
- §2.2 落点否决：端侧**零新构造点**（复用核导出）⇒ 与「各推入点内联同式」否决项同向（D2 单源）。
- §2.7：判据面 = 字段在场，端面同族症状面不变——§2.7 的「修法仍立」结论对端面同样成立。
- **需求档判定句（§2.8）须同批扩面至端侧站点**——需求档笔在主 agent，本席只报不写（上抛项）。

**⑥ 本席登记（出批发现）**

- §2.3 设计档行数口径与现盘差：在册 `CONTEXT-COMPACTION.md` **513** / `ADVISOR-CONVERGENCE.md` **347** vs 本席轮前实读 **516 / 349**（`AGENT-LOOP.md` 544 = 在册 ✓）——读数差登记（非阻断）。
- `docs/core/design/AGENT-LOOP.md:545`（前轮变更记录行）原带裸文件名死锚 ⇒ 本轮同批收正为核路径形态；`node scripts/doc-check.mjs --root .` 实测：悬空 **7 → 6**（净减 1）· 行宽 **24 = 24**（净增 0）。
- `docs/core/design/AGENT-LOOP.md` 544 → **547 行**（>500 硬限，沿革在册）；本批不为该档另立结构债条目。

### 2.10 设计评审轮 1 收正（F1–F8 逐条处置）· 2026-09-20

**轮次**：设计轮 fix —— 评审轮 1 = **pass**（🔴0 · 🟡4 · 🔵4；发现表逐字 = §3「轮次 1」）；父侧逐条裁定「全部接受并要求落地」⇒ 本节 = 处置面。**追加制**（承 §2.9 同制）：前述各行 = 史实保留；凡与本节冲突 ⇒ **以本节为准**。

**覆盖索引（被本节收正的前述行）**：§2.3 `:97` / `:98`（Δ）· `:103`（设计档行数）· §2.4 A-C2 `:110` / A-C6 `:114` / A-C7 `:115` · §2.5（残险面）· §2.6 行 2 `:130` · §2.9 ② 对 `docs/core/design/ADVISOR-CONVERGENCE.md` 的「零改」句（本节 ⑨ = 一处派生一致性收正）。

**① F1（advisor 站点无行为 / 调用在场判据）→ 采「两者」**

- **A-C6 改双面形态**（对称 §2.9 A-C9）：`thincoder-core/agent.mjs` / `thincoder-core/advisor/loop.mjs` **各档**：源文本零 `reasoning_content:` 字面 **∧** `assistantToolCallMessage(` 调用恰 1 处；并补 `thincoder-core/config.mjs:91-92` 名表含该名（import ∧ re-export 两面）。命令不变（归 A-C5 档内 `thincoder-core/test/core-hygiene.test.mjs`）。
- **新增 A-C12（缝式离线行为断言 · 零网络）**：缝 = `_runAdvisorToolLoop`（`thincoder-core/advisor/loop.mjs:298`；调用形态承 `thincoder-cli/test/advisor-context-budget.test.mjs:21-26` 的 `seams.chat` 覆写——循环对入参 `messages` **原位推入**，断言直读该数组）：required 族（`{model:"deepseek-flash"}`）首轮返回 `tool_calls` 且无 `reasoning` ⇒ 推入的 assistant 消息 `'reasoning_content' in m === true && m.reasoning_content === ""`；带 `reasoning:"think-1"` ⇒ `=== "think-1"`；`optional` 族（`glm-5.3`）⇒ 键不存在。落位 = **新核档** `thincoder-core/test/reasoning-echo-live.test.mjs`（拟新增；核门单层 glob 收集 ⇒ 归 A-C5 档内）。
- **选型理由（选「两者」）**：A-C6 单面只证「字面不在」——删掉整段不接线亦可满足（评审原话）；行为面的「空串在场」无静态替代 ⇒ 两面互补，增量仅一条用例（缝既有 + 零网络 + 零新夹具面）。

**② F2（Δ 算术 −2 ∥ 实为 −10）→ 三站点同变换同 Δ（对照）**

| 站点 | 现量 | Δ | 落值 | 形态 |
|---|---|---|---|---|
| 核主循环 `thincoder-core/agent.mjs`（§2.3 `:97` 原记 −2） | 440 | **−10** | **430** | `:366-376` 11 行条件式 → 1 行调用 |
| advisor 循环 `thincoder-core/advisor/loop.mjs`（§2.3 `:98` 原记 −2） | 299 | **−10** | **289** | `:205-215` 同上 |
| VSC 端壳 `thincoder-vscode/src/agent.mjs`（§2.9 ② 原记） | 494 | **−10** | **484** | `:387-397` 同上 |

档位结论两向不变：430 ≤ 500 ✓ · 289 ≤ 300 ✓（回落软线内 ⇒ `SOFT_LINE_REGISTRY` 零改）。

**③ F3（W8 闭包读数三处重复 → 单源）**：闭包读数单处 = 本节 §2.9 ①（批档面）；两设计档只留**结论 + 指针**（编辑面 = ⑨）。依据 = 本项目「重复读数已致分叉」先例（`docs/core/design/CONTEXT-COMPACTION.md` §6.15 系同法处置——评审 #3 引）。

**④ F4（kimi / mimo 空串接受面未证）→ 探针扩面 + 残险登记**

- **A-C7 扩面**（父侧授权该探针面 ≤6 请求）：`deepseek-flash` 三连（原）+ **kimi 一族一行**（`kimi-k3` · `thincoder-core/model-specs.mjs:44`）× 三形态 + **mimo 一族一行**（`mimo-v2.5` · `:76`）× 三形态 = 扩编 **6 请求**（空串 / 缺字段 / 真值各 1），期望 200/200/200（形态口径逐字同原 A-C7）；缺凭证 ⇒ 该族判「不可证」并落入下条残险登记，不阻塞其余两族。
- **§2.5 边界补登（本节即登记面）**：① kimi / mimo 的 `reasoning_content:""` 接受面在扩面探针跑完前 = **未证**（原「风险消解」句仅 `deepseek-flash` 一族成立）；② **任一探针出现 400（"must be passed back"）⇒ 停下上报**、不得带病上线（三族同规；实施轮开工前一次跑）。

**⑤ F5（§6.18 新行脱表）→ 已修**：删 `docs/core/design/AGENT-LOOP.md` 原 `:413` 空行 ⇒ 该行（现 `:413`）并入表体（W15 行 `:412` 紧邻）；结句前空行保留（现 `:414`）。

**⑥ F6（`completion.mjs` 坐标清单缺 `:101` / `:133`）**：§2.6 行 2 坐标收正为**七处** —— `thincoder-core/agent/completion.mjs:59/77/90/101/105/133/143`（本席实读 `pushReal(agent, { role: "assistant", content: response.content })` 七站点；皆无 `tool_calls` ⇒ 判据面不变）。

**⑦ F7（§2.3 设计档行数陈旧）**：按 §2.9 ⑥ 读数收正 + 本节落笔后实读（口径 = 文件按 `\n` 切分元素数，同 §2.9）：`docs/core/design/CONTEXT-COMPACTION.md` 517 → **518**（+1 变更记录行）· `AGENT-LOOP.md` **547**（−1 空行 +1 变更记录行 = 净 0；超 500 硬限沿革在册）· `ADVISOR-CONVERGENCE.md` 349 → **351**（+2：分隔空行 + 变更记录行）。

**⑧ F8（A-C2 测试落位）→ 保留 CLI 集成层 + 落位理由**（选型 = 理由支，不移核）：

核测试层无 mock provider 面——核主循环经**模块级** `chat()`（`thincoder-core/agent.mjs:5` ← `thincoder-core/provider/index.mjs:5`）直发、无 chat 注入缝，且 `thincoder-core/test/` 为**单层**目录、零 helpers / 零 server 夹具 ⇒ 核内建 live-loop 用例须**新增核内 mock 面**（新面、新夹具）；CLI 集成层既有 `thincoder-cli/test/helpers/mock-llm.mjs` + tmp 工作区夹具（先例 = `thincoder-cli/test/integration/normal-mode-toolflow.test.mjs:15-17/46` 驱核 `runAgent`）⇒ 落位 = **零新增夹具面**。核侧判据面（A-C1 规则 / A-C6 结构 / **A-C12 缝式行为**）**全在核门内**（A-C5 覆盖）；A-C2 / A-C3 = 「真循环 × HTTP mock」集成档，与 A-C8 端侧**同层同位**（各面自持断言）。

**⑨ 设计档收正落笔（本席）**：`docs/core/design/CONTEXT-COMPACTION.md:164` + 变更记录 `:516` · `AGENT-LOOP.md:241` / 空行删除（现 `:413` 为并入行）+ 变更记录 `:546` · `ADVISOR-CONVERGENCE.md:313` + 变更记录 `:330`（F1 派生一致性收正）。**产品码 / 需求档 / 提示词 / 他批写域零触。**

**⑩ 冒烟读数（本节落笔时 · cwd = 仓根）**：`node scripts/doc-check.mjs --root .` —— 悬空 **6 = 6**（净增 0）· 行宽 **25 = 25**（净增 0）· 拟新增 6 = 6 · 迁移期引文 222 = 222；门态 FAIL（悬空 6 / 行宽 25）= **存量**（本轮前即 6 / 25，本轮零新增）。三处被编辑行本就在行宽清单内（`CONTEXT-COMPACTION.md:164` 882 → 899 · `AGENT-LOOP.md:241` 658 → 675 · `ADVISOR-CONVERGENCE.md:313` 496 → 602 字符）——清单**条数不变**、同三条读数增（存量非阻断，如实登记）。

**⑪ 与父侧裁定不一致处**：**无**（八条逐条照落）。附一条形式说明：批档面为**追加制** ⇒ F2 / F6 / F7 的「改记 / 收正」以本节为载体、以「以本节为准」生效；如需**就地改写** §2.3 / §2.6 原行，属父侧另裁面（本节不含）。

**⑫ 受影响文件面增补（承本节 ①②；其余行以 §2.3 + §2.9 ② + 本节 ② 为准——D2/D3 不重复列表）**

| 文件 | 现量（行） | Δ | 越线核查 |
|---|---|---|---|
| `thincoder-core/test/reasoning-echo-live.test.mjs`（拟新增 · A-C12 宿主） | 新建 | ~50 | ≤300 ✓（`core-hygiene` 对 `test/**` 同样生效——无 `test/` 登记条目，超线即红） |
| `thincoder-core/test/core-hygiene.test.mjs` | 124 | +~16（双面形态：零字面 **∧** 调用恰 1 处 + `config.mjs:91-92` 名表双面） | ~140 ≤300 ✓ |

设计档落笔后读数（§2.10 ⑦ 同口径）：`CONTEXT-COMPACTION.md` **518** · `AGENT-LOOP.md` **547** · `ADVISOR-CONVERGENCE.md` **351**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

发现表（#109 thinking 回传缺口批 · 设计评审 · 对象 = 批档 §1–§2 全段 + `CONTEXT-COMPACTION.md` + `AGENT-LOOP.md` + `ADVISOR-CONVERGENCE.md`；token / designId 按 §2.7 不入档）：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | advisor 站点（§2.1③ 承诺同轮修的三站点之一）无任何判据证明其接线：A-C6 只断言核两档**零** `reasoning_content:` 字面（删掉整段 spread 不接线亦可满足）；端侧对应项 A-C9 为双面形态（零字面 **∧** 调用恰 1 处）——同一批内判据不对称，该站点行为面无覆盖 | A-C6 改成与 A-C9 同双面形态（每档零字面 ∧ `assistantToolCallMessage(` 恰 1 处），或补一条用既有 `_runAdvisorToolLoop` 缝（`thincoder-core/advisor/loop.mjs:298`）的离线断言——推入的 assistant 消息 `reasoning_content === ""` |
| 2 | Affected-file annotations | 🟡 | §2.3 两行 Δ 记 −2（`thincoder-core/agent.mjs`、`thincoder-core/advisor/loop.mjs`），但被替换块各为 11 行（`agent.mjs:366-376` / `advisor/loop.mjs:205-215`）→ 1 行调用 = **−10**；同一变换 §2.9 ② 对 `thincoder-vscode/src/agent.mjs` 记的正是 −10（494 → 484）⇒ 表内自相矛盾；实际预期落值 430 / 289（非 438 / 297）。档位结论两向不变（≤500 / ≤300 均成立） | 两行改记 −10（或「结构不变：−10」），与 §2.9 ② 口径统一 |
| 3 | Document ownership | 🟡 | W8 契约② 的闭包读数（核 `model-specs.mjs` = 自身 1 档 / 零 builtins；端壳闭包 = 123 档 / 11 builtins；已含该核档）在同一批内写在**三处**（`CONTEXT-COMPACTION.md:164`、`AGENT-LOOP.md:241`、`AGENT-LOOP.md:414`）——本项目已有先例（§6.15 受影响文件表因两处逐行重复、读数分叉而改指针） | 读数留单处（批档 §2.9 ① / 任务书），两设计档只留结论与指针 |
| 4 | Requirements coverage | 🟡 | 「供应商接受空串」的实证只覆盖 `deepseek-flash`（§2.1① / A-C7 三形态探针），而本批翻面 **10 行 / 3 族**（deepseek ×5 · kimi ×3 · mimo ×2 —— `model-specs.mjs:33/35/38/40/42/44/46/48/75/76`）；A-C7 前置探针复测的是同一 deepseek-flash 形态 ⇒ kimi / mimo 对 `reasoning_content:""` 的接受面仍不可证，「风险消解」句仅一族成立 | A-C7 探针扩至 kimi / mimo 各一模型（同三形态：空串 / 缺字段 / 真值），或把 kimi / mimo 的接受度残险与「出现 400 ⇒ 停下上报」显式登记进 §2.5 边界 |
| 5 | Documentation hygiene | 🔵 | `AGENT-LOOP.md` §6.18 新增行（`:414`）与所并入的表之间隔一空行（`:413`）、其后又一空行（`:415`）且自身无表头 / 分隔行 ⇒ GFM 下该行渲染在 8 行表**之外**（内容在、表位不在） | 删 `AGENT-LOOP.md:413` 空行使该行并入表体（结句前空行保留） |
| 6 | Requirements coverage | 🔵 | §2.6 行 2 的坐标清单记 `agent/completion.mjs:59/77/90/105/143`，实档为 :59/:77/:90/**:101**/:105/**:133**/:143（两处坐标缺；判据「无 `tool_calls`」不受影响——七处皆 content-only） | 补全坐标（或改述为「全部 `pushReal(agent,{role:'assistant',content:…})` 站点」） |
| 7 | Document ownership | 🔵 | §2.3 的设计档行数现量陈旧（`CONTEXT-COMPACTION.md` 510→513 · `ADVISOR-CONVERGENCE.md` 345→347），§2.9⑥ 已记轮前实读 **516 / 349**（本轮实读：CONTEXT-COMPACTION = **517**（与 §2.9 自述一致）· ADVISOR-CONVERGENCE = **349** ≠ 在册 347）；纯 .md 无标注义务、漂移已登记，但 §2.3 行未同步 | §2.3 两行按 §2.9⑥ 读数收正（或加一行指向 §2.9⑥） |
| 8 | Clarity | 🔵 | A-C2 断言的是**核**推入点（`thincoder-core/agent.mjs:366-376`），档却落 `thincoder-cli/test/integration/` ⇒ 只进 CLI 门，核门（`thincoder-core/test/run.mjs` 单层收集）不含它；已有先例（`thincoder-cli/test/integration/normal-mode-toolflow.test.mjs:15` 驱核 `runAgent`） | 一行写明落位理由，或改落 `thincoder-core/test/reasoning-echo-live.test.mjs` 使核门一并覆盖核主循环 |

计数：🔴 0 · 🟡 4 · 🔵 4
VERDICT: pass

（已核事实抽样：`model-specs.mjs` 182 行 · required 行 33/35/38/40/42/44/46/48/75/76 · DEFAULT_SPEC `:99` 无 `reasoningEcho` · glm-5.3 `:52` optional；`agent.mjs` 440 行 / `:366-376` 条件式同形；`advisor/loop.mjs` 299 行 / `:205-215` + `:298` 缝；`config.mjs` 420 行 / `:91-92` 名表；VSC `agent.mjs` 494 行 / `:6` + `:387-397`；VSC `specs.mjs` 61 行 / `:11` + `:13` + `:46-50`；`context.mjs` 496 行 / `:30` / `:230-235`；`core-hygiene.test.mjs` 124 行；`model-specs.test.mjs` 60 行；VSC `test/integration/files.mjs` 22 行；两 mock 助手的 requests 形状差异（CLI = 裸 body · VSC = `{body}`）与 A-C2 / A-C8 断言路径相符；三站点扫面（核 tool_calls 推入仅 `agent.mjs:369` + `loop.mjs:208`；端 src 仅 `agent.mjs:394-395` + `panel-session.mjs:92` 注释）成立。残险登记 = kimi / mimo 接受面（见 #4）。）

## §4 用户批准（主 agent）

**2026-09-20 01:32 父侧代签**——依据用户 01:04 授权「**你自动跑到排空吧**」（同 2026-09-18 先例：设计评审点火权 + §4 批准权委托父侧，自缚三条件）。

**三条件核验**：① 评审 **pass（0 🔴）**（id=182 · 🔴0 / 🟡4 / 🔵4 · §3「轮次 1」在册）；② **修正轮（id=183）F1–F8 全部落地**（F1 双面判据 + A-C12 缝式断言 · F2 Δ 收正 −10 · F3 读数单源指针 · F4 探针扩三族 · F5 脱表行归并 · F6 坐标补全七处 · F7 行数收正 · F8 落位理由）——三条形式面披露 **父侧裁定**：批档追加制（以 §2.10 为准）**接受** · F1 派生收正（`ADVISOR-CONVERGENCE.md:313`）**接受** · 行宽清单条数不变（25）**接受**；③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：① **设计定稿**（批档 §1–§2 含 §2.9 扩展块 + §2.10 修正轮块 · 设计三档 · **需求档 §4.13**〔父侧已落〕）；② **实现派法**：**单轮 · 两包**（核包 = `model-specs.mjs` / `config.mjs` / `agent.mjs` / `advisor/loop.mjs` + 两核测档；端包 = `thincoder-vscode/src/agent.mjs` / `specs.mjs` + 两 VSC 测档 + 两处新建 `reasoning-echo-live.test.mjs`）——同 designId + token 一次 spawn（端侧经 `@thincoder/core` JUNCTION 直取新导出 ✓）。

**特别授权**：**A-C7 前置真机探针**（三族各一模型 × 三形态 · **总请求 ≤9** · 400 ⇒ 停下上报）——探针上限由父侧在此明示（承 178 轮越面教训）。

**收口预告**：实现轮落定 → 父侧核 A-C1..A-C12 → 收口（§6）+ 核销 #109 + **提交 + push**。

## §5 实施记录（eng-coder）

## §6 验证与收口（父代理）
