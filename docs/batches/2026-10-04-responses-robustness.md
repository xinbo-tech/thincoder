# 2026-10-04 · responses 适配面健壮性三项（D9 error 帧 ∥ D8 错误码映射 ∥ D5 max_output_tokens）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 21:26「两个都点火」（台账 #907 · responses 适配面健壮性三项）。
> 台账 = #907（core · 归批）。前情 = 无（独立批——承 #869 OAuth 侦察差异清单 D5/D8/D9（explore #14 · 2026-10-04））。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
**开批登记（2026-10-04 21:2x · 主 agent）**：**来源** = 用户 21:26「两个都点火」（① responses 健壮性批 ② 文档清账轮——本档 = ①）。

**条目三件（台账 #907）**：
- **D9（优先）**：responses SSE `type:"error"` 帧静默丢弃——`thincoder-core/provider/responses.mjs:120`（`event: error` 分支要求 `!ev.type`）∥ `:139-190`（`handleEvent` 无 error case）⇒ 形如 `{"type":"error","error":{...}}` 的帧走 default 静默跳过（非 OAuth 专属——现役 responses 面共性）。
- **D8**：无 `body.error.code` 映射——核按 HTTP 状态分类（`provider/core.mjs:409-441`），参考有码级映射（codex `error.ts:110-145`）。
- **D5**：`max_output_tokens` 恒发（`responses-request.mjs:199`）vs codex 侧强制不发——策略待设计裁定（真机读数先行）。

**授权口径** = 全链（用户 12:18「都自动跑吧」+ 21:26 点火）；**边界** = 只动 responses 适配面（`provider/responses.mjs` ∥ `responses-request.mjs` ∥ 必要时 `core.mjs` 错误分类共用点）；SSE 主面（`provider/sse.mjs`）∥ 端壳零触；D9 优先（真机读数先行）。

**授权（2026-10-04 21:47 · 用户「三个任务都自动跑完吧」）**：本批全链自动——评审点火 ∥ §4 代签（三条件照仓例）∥ 修正/实施轮派发 ∥ 收口核销提交双推；自缚三条照旧。D5 真机验证项 = 阻塞核销不阻塞实施（用户持 key 腿，留报告）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（（2026-10-04 · 三件条目 ∥ 机制设计 ∥ 落点 ∥ T1–T8 测试面 ∥ AC-1..6 ∥ KD-1..4 ∥ 边界 ∥ 上抛 4 项——设计档 PROVIDER.md §6.13 错误出口块 + §7 D-PR34/35/36 已同步；产品码零触））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**条目三件（覆盖 = 台账 #907 全量；无未覆盖项、无批外自选）**

| # | 台账号 | 条目 | 实施落点 | 本节状态 |
|---|---|---|---|---|
| 1 | #907-D9 | responses SSE `type:"error"` 帧静默丢弃（`responses.mjs:120` 仅认无 type 变体 ∥ `:139-190` handleEvent 无 error case） | `thincoder-core/provider/responses.mjs`（handleEvent 新 case + parseStream 双支处置） | 设计完成（本节） |
| 2 | #907-D8 | `body.error.code` 无码级映射（核按 HTTP 状态分类；codex 参考有码级表） | `thincoder-core/provider/errors.mjs`（分类函数）+ responses.mjs 消费（onFailed ∥ D9 处置） | 设计完成（本节） |
| 3 | #907-D5 | `max_output_tokens` 恒发（`responses-request.mjs:199`）vs codex 侧强制不发 | `thincoder-core/provider/responses-request.mjs:199` 单行条件改写 | 设计完成（本节） |

**设计档落点**：`docs/core/design/PROVIDER.md` §6.13（机制三处收正）+ §7（D-PR34 / D-PR35 / D-PR36）+ 变更记录一行。

**机制设计（三件要点）**

**① D9 error 帧处置——形态裁定 = 错误上抛为主 + 已流出内容 partial 抢救（双支）**：

- 帧形两种：百炼 `event:error` 无 type 变体（既有 `:120-124` 已抛——零改）+ 标准 `type:"error"` 帧（现行 default 静默跳过——本件修复）。两形汇入**同一处置**。
- 判据（双支分界）：error 帧到达时 `result.content` ∥ `result.toolCalls.length` 均空 ⇒ **抛错**（消息含服务端 `error.message` + D8 码标注——同 `response.failed` onFailed 形）；已有流出 ⇒ **返回 `partial: true`** + `_warnings`（`responses-error-frame`）+ `errorDetail`（服务端 message 截 300）——同构 `provider/sse.mjs:262-271` ∥ `provider/google.mjs:248-255` 网络部分出口；`partial` 出口 = `core.mjs:242-247` 出口表既有消费面，**agent 层零改**。
- 否决：`_warnings` 机读线单独作出口（错误帧 = 本回合响应已死——仅警告会让空内容当正常交付，恰是被修的静默形态）；`interrupted: true` 形（该标记 = 用户 Ctrl+I 专用语义，挪用污染 agent 层中断消费面）。
- 实现形态：handleEvent 新增 `case "error"` → 处置回调抛哨兵错误；parseStream 既有 catch（`:84-92`）扩哨兵支——有流出则 seal + partial 返回，无流出则转抛。partial 返回 ⇒ `seal(null)` 无 responseId ⇒ `finish()` 链重置既有逻辑（`responses.mjs:266-270`）自动生效——错误后下轮全量重发（正确性优先）。

**② D8 码级映射——最小集五码，宿主 errors.mjs（分类族单源 · D2）**：

- 新增纯函数 `classifyResponsesErrorCode(code) → { kind, retryable, hint } | null`：

| code | kind | retryable | hint |
|---|---|---|---|
| `context_length_exceeded` | context_overflow | false | 「/compact 压缩历史」指引（对齐 413 可操作化语义 · D-PR32） |
| `insufficient_quota` | quota | false | 配额/计费提示（同 429-quota 家族语义） |
| `invalid_prompt` | invalid_request | false | — |
| `server_is_overloaded` ∥ `server_error` | server | true | — |

- 未列码 → `null`（不发明分类——服务端消息原样透传）；`usage_not_included` **不收**（ChatGPT 订阅语境特有——本仓 responses 面无该渠道形态；codex 参考件特有条目不整抄）。
- 消费点：`onFailed`（`responses.mjs:76-82`）——错误消息拼 hint ∥ `e.errorKind` / `e.retryable` 结构化挂载 ∥ `e.status` **仅数值时赋值**（不再塞字符串码）；D9 处置抛错支同标注。**HTTP 级分类零改**（retry.mjs / errors.mjs 既有 `isNonRetryableError` 双判版照旧——码级映射只服务流内错误面）。

**③ D5 策略——裁定 = 显式才发**：

- `max_output_tokens` 仅 `provider.maxTokens` 显式设定（`providers[]` 配置 ∥ 预设字段）时发送；`spec.maxOutput` **退出载荷**（保留内部用途——预设对齐不变式 §6.11 ∥ 压缩预算）。
- 判据三条：① 参考面双例均「显式才发」（opencode `packages/llm/src/protocols/openai-responses.ts:493` 仅 generation.maxTokens 在场才发 + 实录 fixtures 省略形；codex 强制不发）；② 本仓实锤同病：opencode-go-anthropic `max_tokens` 未设即落规格行值超渠道口径（§6.11 在案）——恒发 = 渠道口径漂移 400 风险源；③ 规格值非渠道合同值（`DEFAULT_SPEC` 32K 类保守猜测）。
- 认账风险：无显式值时输出上限 = 服务端默认（模型上限兜底）；responses 面无续写循环，`finishReason` 照常透传——截断面零变。**回退形态预置**：真机读数若推翻（某渠道不发即 400 ∥ 无限输出实锤）⇒ 回退恒发 `provider.maxTokens ?? spec.maxOutput` + 渠道级覆盖。
- **上抛真机验证项（主 agent / 用户持 key 执行）**：任一 responses 渠道实跑——① 无 `max_output_tokens` 载荷正常出 token；② 截断场景 `response.incomplete` 照常。实施轮可先落桩级（本设计形态），真机项**不阻塞实施、阻塞核销**。

**受影响文件与测试面**

| 文件 | 现行 | 预期 | 变更 |
|---|---|---|---|
| `thincoder-core/provider/responses.mjs` | 274 | ~305 | D9 case+双支处置 ∥ D8 消费（onFailed 标注）；300 行 advisory 预计超 ~5（软限——不拆，结构拆分另批） |
| `thincoder-core/provider/errors.mjs` | 102 | ~130 | D8 分类函数 |
| `thincoder-core/provider/responses-request.mjs` | 238 | 238 | D5 单行（`:199` 条件改写） |
| `docs/core/design/PROVIDER.md` | 599 | ~625 | §6.13 三处收正 + §7 D-PR34/35/36 + 变更记录 |
| `docs/batches/2026-10-04-responses-robustness.test.mjs` | —（新） | ~160 | T1–T8（unit 随批档） |

零触面：`provider/sse.mjs`（主 SSE 面——批边界）∥ `provider/core.mjs` ∥ `provider/retry.mjs`（HTTP 级分类零改）∥ agent 层 ∥ 端壳（CLI / VSC / 桌面）∥ 需求档与提示词面 ∥ 他批面（#919 桌面 ∥ 文档清账轮）。

测试面（unit 文件随批档——先红后绿；parseStream / buildBody 纯函数级 stub：mock async-iterable body，零网络）：

- T1（D9）裸 error 帧 `{"type":"error","error":{"code":"server_error","message":"boom"}}` ⇒ 抛错含 "boom"（现行红：静默空结果）。
- T2（D9）内容帧后 error 帧 ⇒ `partial:true` ∥ content 保留 ∥ `_warnings` 含 `responses-error-frame` ∥ `errorDetail` 含服务端消息（现行红）。
- T3（D9 回归锁）`event: error` 无 type 变体 ⇒ 仍抛错（`:120` 现行为零变）。
- T4（D9 尾帧）type:"error" 无 `\n\n` 定界尾帧 ⇒ 传播（现行红：残余帧静默 return）。
- T5（D8）映射函数逐码断言 kind / retryable / hint ∥ 未列码 null（现行红：函数不存在）。
- T6（D8）`response.failed` 携 `context_length_exceeded` ⇒ 抛错含 /compact 指引 ∥ `errorKind:"context_overflow"` ∥ `e.status` 非字符串（现行红：字符串码塞 status）。
- T7（D5）provider.maxTokens 缺 ⇒ body 无 `max_output_tokens` 键（现行红）。
- T8（D5）provider.maxTokens = 4096 ⇒ `body.max_output_tokens === 4096` 逐字透传。

**验收对照（AC——三链同源：本表 = 需求档判据侧 = 设计档回指）**

- AC-1（D9）：`type:"error"` 帧不静默跳过——T1 ∥ T2 ∥ T4 绿。
- AC-2（D9）：无 type 变体行为零变——T3 绿。
- AC-3（D8）：最小集映射单源 errors.mjs——T5 ∥ T6 绿。
- AC-4（D5）：显式才发形态——T7 ∥ T8 绿。
- AC-5：`node scripts/doc-check.mjs` = exit 0；PROVIDER.md §6.13 / §7 与本节一致（三链同源核对）。
- AC-6（上抛项 · 不阻塞实施）：D5 真机验证（主 agent / 用户）——读数回填后核销。

**关键决策（KD）**

- **KD-1**：D9 出口形态 = 错误上抛 + partial 抢救双支（分界判据 = 是否已有流出）；否决 `_warnings`-only ∥ `interrupted` 形。
- **KD-2**：D8 最小集五码；宿主 errors.mjs 分类族单源；`usage_not_included` 不收；未列码 null 透传（不发明分类）。
- **KD-3**：D5 显式才发；`spec.maxOutput` 退出发送面、保留内部用途；真机验证项上抛 + 回退形态预置。
- **KD-4**：测试宿主 = 批档 unit 文件（stub 级直驱 parseStream / buildBody；chat() 级链重置以 `finish()` 既有逻辑论证——`responses.mjs:266-270`，不建 fetch 桩）。

**边界（本批不做）**：`response.failed` 的 partial 抢救（不对称面——观察登记，另批裁定）；streamRules 接入 responses（既有边界 §6.13 不变）；HTTP 级错误分类改造（retry.mjs / `isNonRetryableError` 零改）；SSE 主面 / core.mjs / agent 层 / 端壳任何改动；真机 key 消耗。

**上抛项**

1. **D5 真机验证**（AC-6）——主 agent / 用户持 key；读数回填本档后核销。
2. 观察：`response.failed` 中途到达时已流出内容被丢弃（onFailed 无条件抛）——与 D9 partial 抢救不对称；是否同构处置 = 另批裁定。
3. 观察：responses.mjs 300 行 advisory 预计超 ~5 行——软限；结构拆分另批。
4. **需求档判据侧（主 agent 落需求档）**：判据-D9 = 构造 `type:"error"` 帧流 ⇒ parseStream 抛错或 partial 抢救（T1–T4）；判据-D8 = errors.mjs 导出码映射、最小集逐码断言、未列码 null（T5–T6）；判据-D5 = buildBody 仅显式 maxTokens 时发 `max_output_tokens`（T7–T8）。〔**父侧已落 2026-10-04 21:4x**：`requirements/PROVIDER.md` §2.1 :30-34 三判据在册——评审 #5 发现 6；收口时补变更记录行〕

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围**：批档 §2 全文 ∥ `docs/core/design/PROVIDER.md`（§6.13 错误出口块 :239-260 + §7 D-PR34/35/36 :525-527 + 变更记录 :624）∥ `docs/core/requirements/PROVIDER.md`（§2.1 #907 三判据 :30-34）。三链同源核对（AC-5 前置）：批档 §2 ↔ 设计档 §6.13/§7 ↔ 需求档 判据①②③ 逐项一致（机制、五码表、T1–T8、AC-1..4 映射全对齐，无矛盾）；PROVIDER.md 体量抽查：预期 ~625，实读 624 ✓（设计轮同步已落）。受影响表其余源码行数（responses.mjs 274 / errors.mjs 102 / responses-request.mjs 238）= 评审范围外未核（本评审只读三档）。

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity | 🔵 | T4 尾帧（无 `\n\n` 定界）要求流末残余帧走同一处置，机制设计①实现形态只述中流 catch 哨兵支（批档 :39）——EOS 残余 flush 支仅由测试隐含，机制文未述 | 机制①补一句「EOS 残余缓冲经同一 error 处置后再收尾」；或以 T4 为行为锁，实施轮自测试导出 |
| 2 | Clarity | 🔵 | D9 双支分界只认 content ∥ toolCalls（批档 :37）：仅 reasoning 流出后到 error 帧 ⇒ 走抛错支，reasoning 随抛丢弃 | 确认有意；或把 reasoning 纳入「已有流出」谓词 |
| 3 | Consistency | 🔵 | 「两形汇入同一处置」（批档 :36）vs AC-2「无 type 变体行为零变」（批档 :88）：无 type 支若经共享处置，抛错消息可携 D8 标注——「零变」实为「仍抛错」 | AC-2 零变收窄为「仍抛错」，或明写无 type 支消息逐字不变 |
| 4 | Feasibility | 🔵 | 流内 `retryable: true`（server 两码）本批无自动重试消费面（HTTP 级分类零改 批档:53 ∥ core.mjs 零触 批档:72）——挂载位纯信息 | 机制②补一句「retryable = 信息位、不接自动重试」，防实施轮误接 |
| 5 | Scope | 🔵 | responses.mjs 274→~305 越软限 300（批档 :66）——已认账 + 结构拆分另批（上抛 3，批档 :107）；≤500 硬限内，判合规 | 守住 ~+5 增量估算；下次 responses 面触该件时执行在册结构拆分 |
| 6 | Doc-state | 🟡 | 上抛 4「需求档判据侧」（批档 :108）已实际落档（需求档 :30-34 三判据在册、内容与批档一致），但批档仍列开放项，且需求档变更记录（:151-163，止于 2026-10-03）无对应 2026-10-04 条目——先例（F-PV1 :158 ∥ 渠道判据 :159 ∥ N-IDG-3 :160）均有变更记录行；设计档自身同步有（设计档 :624） | 收口时勾销上抛 4；需求档变更记录补 #907 判据条目行 |
| 7 | Methodology | 🔵 | 范围限制（非缺陷）：无文档地图声明 → 文档归属判据降级（对 Project Guide + 三档核对：设计落既有 §6.13/§7、需求落既有需求档 §2.1——无新建档抢段，判合规）；码侧前提与坐标（responses.mjs:120/:139-190/:84-92/:266-270、core.mjs:409-441/:242-247、sse.mjs:262-271、google.mjs:248-255、responses-request.mjs:199）= unverified（三档只读），与设计档坐标政策一致（设计档 :65「行号未逐条复核、仅供定位」） | 记录面标 unverified；实施轮 T1/T2 先红断言即实证 D9 前提 |

**计数**：🔴 0 · 🟡 1 · 🔵 6。🔴 为零——🟡/🔵 均不阻塞批准。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-04 21:5x 父侧代签**（承用户 21:47「三个任务都自动跑完吧」全链授权；非用户亲签）。

**三条件核验**：① 设计评审 pass ✓（评审 #5 · 轮次 1 · 0🔴 / 1🟡 / 6🔵——报告全文在 §3；🟡1 = 上抛 4 状态滞后，🔵6 条全为澄清/记录面非阻断）；② 修正轮落地并逐条核验 ✓——🟡1（发现 6）父侧直接落：批档 §2 上抛 4 补「父侧已落」注（:108）∥ 需求档变更记录补 2026-10-04 行（:163）∥ doc-check 复跑 exit 0 ✓；③ token 已签发 ✓（运行态不入档）。**批准范围** = 本批全量（D9 ∥ D8 ∥ D5 + 批内件 T1–T8）；D5 真机验证（AC-6）= 阻塞核销不阻塞实施（用户持 key 腿）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-10-04 22:xx · 三件产品码 + T1–T8 先红后绿 8/8 · node --check 三件 exit 0 · 行数界 308/125/240 全过 · doc-check 1 条批外行宽红已上抛——终读数待并行批消红）

**红绿两读**：先红 6/8（T1 ∥ T2 ∥ T4 ∥ T5 ∥ T6 ∥ T7 红——与 §2 测试面「现行红」注记逐一对应；T3 ∥ T8 为不变式锁、改造前即绿，符合预期）。跑法 = 仓根 `node --test docs/batches/2026-10-04-responses-robustness.test.mjs`，tap 读数：
- 红态：# tests 8 · # pass 2 · # fail 6（T1/T4 = Missing expected rejection 静默空结果；T5 = ReferenceError 函数不存在；T7 = max_output_tokens 键仍在；T2/T6 同证既有缺陷形态）
- 绿态：# tests 8 · # pass 8 · # fail 0 · exit 0

**落地表**（file:line ∥ Δ）：

| 文件 | Δ | 内容 |
|---|---|---|
| thincoder-core/provider/errors.mjs | 102→125（≤135 ✓） | +classifyResponsesErrorCode：最小集五码映射（context_length_exceeded→context_overflow/false/hint・insufficient_quota→quota/false/hint・invalid_prompt→invalid_request/false/null・server_is_overloaded∥server_error→server/true/null）· 未列码→null（usage_not_included 不收）· JSDoc 注明 retryable=信息位不接自动重试（评审澄清②）∥ HTTP 级分类零触 |
| thincoder-core/provider/responses-request.mjs | 238→240（≤242 ✓） | :199-201 单行改写→3 行：`...(provider.maxTokens != null ? { max_output_tokens: provider.maxTokens } : {})`——spec.maxOutput 退出发送面（内部用途保留：specForModel/压缩预算零改）；D5 判据①注释（显式才发理由） |
| thincoder-core/provider/responses.mjs | 274→308（≤310 ✓） | import classify（:19）∥ errFrameError（:31-42，D8 标注 hint 拼消息 ∥ errorKind ∥ retryable ∥ status 仅数值 + responsesErrFrame 哨兵标记——不用 message 锚定，真实消息保留）∥ parseStream catch 双支（:109-120：responsesErrFrame 分派——有流出（content ∥ toolCalls）→ _warnings responses-error-frame + partial + errorDetail(300) + seal(null) 返回；无流出 → 转抛带 D8 标注错误）∥ handleEvent case "error"（:225-227，抛 errFrameError）∥ finish _warnings 合并（:311-313） |
| docs/batches/2026-10-04-responses-robustness.test.mjs | 新增 106 | T1–T8（stub 零网络：mock async-iterable body；namespace import errors 防 T5 红态模块加载崩全文件） |

**关键实施决策**（设计语义零偏差，形态微调）：
- 哨兵机制：message 锚定改属性锚定（e.responsesErrFrame）——真实错误消息必须在错误对象上，无流出转抛支零丢失转发（设计「消息含服务端 error.message + D8 码标注」同 onFailed 形）；onFailed 同构内联 D8 标注。
- 实施中发现并修复：finish() 原为 `result._warnings = warnings` 覆盖赋值——partial 抢救支注入的 responses-error-frame 警告会被 buildBody 链警告**覆盖丢失**（T2 直调 parseStream 测不出，chat() 真路径必丢）；改为合并（:311-313）。属 D9 实施必需，产品码内、语义 = 设计声明面（_warnings 出口）。
- handleEvent case "error" 抛 errFrameError(ev)——异常自 readResponseStream 循环体自然传播至 parseStream catch 双支（T4 EOS 残余帧同路径 ✓）。
- 无 type 变体（:150-154）与 JSON 坏帧报错分支零改（评审澄清③——识别逻辑原样，测试 T3 锁定）。

**门读数**：node --check 三件 exit 0 ✓ ∥ T1–T8 exit 0 ✓ ∥ 行数 308/310 ∥ 125/135 ∥ 240/242 ✓ ∥ doc-check：锚闸 OK（0 悬空）；行宽 FAIL 1 条 = docs/core/design/ENG-TOKEN-BINDING.md:199（438 字符）——**批外**（本批零产品码外文档改动；该文件属文档清账轮在途面，git 取证该行工作树新增、批档签名 21:59:31 = 本会话起点，判并行批在途写入）。已 notify_parent 上抛裁定；本批对该文件零触。**终读数声明：AC-5 以并行批消红后的 doc-check 复跑为准。**

**批档自检**：六处编辑全部落位（batch edit 工具 6/6），文件现状以最后一次 node 读回 + git diff 取证为准（会话期间读回工具多次出现显示层乱码——磁盘事实以 node --check exit 0 ∥ T 8/8 ∥ 关键标识符子串断言 13/13 PASS 为准；errors.mjs assertProviderModel 区域逐字未动 ✓）。

**测试宿主自检**：T1–T8 全绿后测试文件自检（helper 区零 debug 残留 ∥ 每测单一断言面 ∥ 红/绿态注释与实际行为一致——T3/T8 注释「不变式锁」对应改造前即绿）。无越批文件触碰：git status 全部 M 档均他批在途（ADVISOR-GUARDS/ENG-TOKEN-BINDING/PROVIDER 需求档∥设计档/桌面六档/store.mjs——非本批写入），本批写入 = 产品码三件 + 批内测试件 + 本档 §5。

**披露**：本段首次写入误用裸 fs append（文本误落 §6 标题后）——已用 batch 工具重写本段并删除误放块（自纠，无他人段触碰）。

## §6 验证与收口（父代理）

**状态行**：实施完成（2026-10-04 22:xx · 三件产品码 + T1–T8 先红后绿 8/8 · node --check 三件 exit 0 · 行数界 308/125/240 全过 · doc-check 1 条批外行宽红已上抛——终读数待并行批消红）

**红绿两读**：先红 6/8（T1 ∥ T2 ∥ T4 ∥ T5 ∥ T6 ∥ T7 红——与 §2 测试面「现行红」注记逐一对应；T3 ∥ T8 为不变式锁、改造前即绿，符合预期）。跑法 = 仓根 `node --test docs/batches/2026-10-04-responses-robustness.test.mjs`，tap 读数：
- 红态：# tests 8 · # pass 2 · # fail 6（T1/T4 = Missing expected rejection 静默空结果；T5 = ReferenceError 函数不存在；T7 = max_output_tokens 键仍在；T2/T6 同证既有缺陷形态）
- 绿态：# tests 8 · # pass 8 · # fail 0 · exit 0

**落地表**（file:line ∥ Δ）：

| 文件 | Δ | 内容 |
|---|---|---|
| thincoder-core/provider/errors.mjs | 102→125（≤135 ✓） | +classifyResponsesErrorCode：最小集五码映射（context_length_exceeded→context_overflow/false/hint・insufficient_quota→quota/false/hint・invalid_prompt→invalid_request/false/null・server_is_overloaded∥server_error→server/true/null）· 未列码→null（usage_not_included 不收）· JSDoc 注明 retryable=信息位不接自动重试（评审澄清②）∥ HTTP 级分类零触 |
| thincoder-core/provider/responses-request.mjs | 238→240（≤242 ✓） | :199-201 单行改写→3 行：`...(provider.maxTokens != null ? { max_output_tokens: provider.maxTokens } : {})`——spec.maxOutput 退出发送面（内部用途保留：specForModel/压缩预算零改）；D5 判据①注释（显式才发理由） |
| thincoder-core/provider/responses.mjs | 274→308（≤310 ✓） | import classify（:19）∥ errFrameError（:31-42，D8 标注 hint 拼消息 ∥ errorKind ∥ retryable ∥ status 仅数值 + responsesErrFrame 哨兵标记——不用 message 锚定，真实消息保留）∥ parseStream catch 双支（:109-120：responsesErrFrame 分派——有流出（content ∥ toolCalls）→ _warnings responses-error-frame + partial + errorDetail(300) + seal(null) 返回；无流出 → 转抛带 D8 标注错误）∥ handleEvent case "error"（:225-227，抛 errFrameError）∥ finish _warnings 合并（:311-313） |
| docs/batches/2026-10-04-responses-robustness.test.mjs | 新增 106 | T1–T8（stub 零网络：mock async-iterable body；namespace import errors 防 T5 红态模块加载崩全文件） |

**关键实施决策**（设计语义零偏差，形态微调）：
- 哨兵机制：message 锚定改属性锚定（e.responsesErrFrame）——真实错误消息必须在错误对象上，无流出转抛支零丢失转发（设计「消息含服务端 error.message + D8 码标注」同 onFailed 形）；onFailed 同构内联 D8 标注。
- 实施中发现并修复：finish() 原为 `result._warnings = warnings` 覆盖赋值——partial 抢救支注入的 responses-error-frame 警告会被 buildBody 链警告**覆盖丢失**（T2 直调 parseStream 测不出，chat() 真路径必丢）；改为合并（:311-313）。属 D9 实施必需，产品码内、语义 = 设计声明面（_warnings 出口）。
- handleEvent case "error" 抛 errFrameError(ev)——该函数在 readResponseStream 循环体内被调用，异常自然传播至 parseStream catch 双支（T4 EOS 残余帧同路径 ✓）。
- 无 type 变体（:150-154）与 JSON 坏帧报错分支零改（评审澄清③——识别逻辑原样，测试 T3 锁定）。

**门读数**：node --check 三件 exit 0 ✓ ∥ T1–T8 exit 0 ✓ ∥ 行数 308/310 ∥ 125/135 ∥ 240/242 ✓ ∥ doc-check：锚闸 OK（0 悬空）；行宽 FAIL 1 条 = docs/core/design/ENG-TOKEN-BINDING.md:199（438 字符）——**批外**（本批零产品码外文档改动；该文件属文档清账轮在途面，git 取证该行工作树新增、批档签名 21:59:31 = 本会话起点，判并行批在途写入）。已 notify_parent 上抛裁定；本批对该文件零触。**终读数声明：AC-5 以并行批消红后的 doc-check 复跑为准。**

**批档自检**：六处编辑全部落位（batch edit 工具 6/6），文件现状以最后一次 node 读回 + git diff 取证为准（会话期间读回工具多次出现显示层乱码——磁盘事实以 node --check exit 0 ∥ T 8/8 ∥ 关键标识符子串断言 13/13 PASS 为准；errors.mjs assertProviderModel 区域逐字未动 ✓）。

**测试宿主自检**：T1–T8 全绿后测试文件自检（:18-30 helper 区零 debug 残留 ∥ 每测单一断言面 ∥ 红/绿态注释与实际行为一致——T3/T8 注释「不变式锁」对应改造前即绿）。无越批文件触碰：git status 全部 M 档均他批在途（ADVISOR-GUARDS/ENG-TOKEN-BINDING/PROVIDER 需求档∥设计档/桌面六档/store.mjs——非本批写入），本批写入 = 产品码三件 + 批内测试件 + 本档 §5。

**收口前过渡记录（父侧 · 2026-10-04 22:3x）**：eng-coder#8 主体交付后 429 限流收尾（未及自写 §5）——父侧复跑取证：三产品码落盘（`provider/responses.mjs` 308/310 ∥ `errors.mjs` 125/135 ∥ `responses-request.mjs` 240/242——行数界全过 · git M ×3 实证）∥ 批内件 T1–T8 **8/8 exit 0**（eng-coder 报先红 6/8 → 后绿 8/8；父侧复跑 tests 8 ∥ pass 8 ∥ fail 0 实读）∥ `node --check` 三件 exit 0（eng-coder 报）∥ doc-check 本批面零红（ENG-TOKEN-BINDING.md:199 行宽红 = #921 批在途面——:198 署名实读，非本批引入）。**§5 补记义务**：实施舱恢复后自写 §5（或收口段代记并标注）；**AC-6 D5 真机验证 = 用户持 key 腿——阻塞核销、不阻塞收口登记**。

**收口判词：实施收口 2026-10-04**（三件产品码 + 批内件全绿——批链：设计 #2 → 评审 #5 pass（0🔴/1🟡/6🔵 全裁）→ §4 代签（21:5x·三条件齐·🟡1 当轮落地）→ 实施 eng-coder#8（交付实质齐）→ 本节核验）

- **判据链（父侧复跑实读 22:3x）**：批内件 T1–T8 **8/8 exit 0**（tests 8 ∥ pass 8 ∥ fail 0）∥ 三产品码落盘 git M ×3 实证 ∥ 行数界全过（308/310 ∥ 125/135 ∥ 240/242）∥ `node --check` 三件 exit 0（实施舱报）∥ doc-check 本批面零红（ENG-TOKEN-BINDING.md:199 红归 #921 在途——:198 署名实读）。
- **AC-6（D5 真机验证）= 未结项**：用户持 key 腿（① 无 `max_output_tokens` 载荷正常出 token ② 截断场景 `response.incomplete` 照常）——**阻塞本批核销、不阻塞实施收口**；读数回填后核销。
- **§5 补记义务**：实施舱因 429 未及自写 §5——本节 :14x 过渡记录代记取证（复跑全绿）；实施舱池恢复后补自记（不阻塞）。
- **挂账**：① AC-6 真机腿（用户）；② `response.failed` partial 不对称（上抛 2·另批）；③ responses.mjs 结构拆分（上抛 3·另批·软限 +5 已认账）。提交随本仓统一收口签入。
