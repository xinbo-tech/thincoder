# 2026-10-10 · gemini-thought-signature
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 09:53 转述另端排查 + 09:57「开批吧，也自动跑。」（另端诊断成立：工具调用思考签名未保存/未回传 ⇒ 工具循环第 2 次请求必挂 400）。
> 台账 = #1205（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与点火

- 用户 2026-10-10 09:53 转述另端（另一 CLI 端）排查结论；09:57「开批吧，也自动跑。」= 立批 + 全链自动授权（本批）。
- **症状**：Gemini 3 工具循环断——工具调用随带思考签名（`thought_signature`），回传缺失 ⇒「调工具 → 回传 → 再请求」第 2 次请求必挂 400（`Function call is missing a thought_signature in functionCall parts … default_api:glob, position 25 … INVALID_ARGUMENT`）；纯问答正常。
- 另端实证：trace `61ca071934e3-3364.jsonl` @00:31:06 ∥ `-3366.jsonl` @00:33:08（两次相同 400）；回传消息工具调用仅三字段（`{id,type,function:{name,arguments}}`）。

### 1.2 现状与范围（父侧实核 · 2026-10-10）

- 全仓 grep `thought_signature` / `extra_content` / `thoughtSignature` = **0 命中**（整链从未保存 / 回传）。
- **捕获面两处**（实读）：① OpenAI 兼容路 `thincoder-core/provider/sse.mjs:36-62`（`mergeToolCalls` 槽 = `{id,name,arguments}`——`:43` / `:47` / `:49` 三处建槽，附带字段不读）；② 原生 google 路 `thincoder-core/provider/google.mjs:195-204`（`part.functionCall` → 槽同形，part 级签名不捕获——范围父侧 10:11 复读定界；评审发现 #2 收正）。
- **回传面**：历史重发构造点——设计轮实读定位（两形态携带位置不同：native = `functionCall` part 级 `thoughtSignature` ∥ OpenAI 兼容 = `extra_content.google.thought_signature`）。
- **网关**：用户链路含中间网关（10.0.0.5:8787，server 侧 in-repo）——透传性待核（设计轮给核验法）。
- 约束：他家 provider（无签名语义）行为零变更；本批不动规格表（`gemini-model-specs` 批在途）。

### 1.3 授权（自动跑 · 2026-10-10 09:57）

用户原话：「开批吧，也自动跑。」⇒ 本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。

**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 09:57 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。

- 端到端真跑核验**需用户 gemini 实例**（本机无该渠道密钥）——父侧收口时提请用户实发一枪；机检（批内件用例）先行。

### 1.4 范围修正（父侧裁定 · 2026-10-10 10:0x）

- 设计轮实读发现：回传构造单点 = `assistantToolCallMessage`（`thincoder-core/model-specs.mjs:345-358`）——与 §1.2「不动 model-specs.mjs」约束相抵（上抛·待裁）。
- **父侧裁定 = ②放行**（父侧已实核坐标）：允许改**函数区**（`:345-358`）；禁令原意仅对**规格表区**（`:201-207` 邻域）有效（防与在途规格表批同文件撞写）。
- 附则：① 单构造点形态保持（先例批 `docs/batches/2026-09-20-reasoning-echo-gap.md` 结构机检钉「零第二构造点」）；② 同文件实施轮撞面由调度器按 `files` 声明自动串行（规格表批链更前、预期先落）；③ 调用点实况（收正 · **以 §2 披露① 现盘实测为准**——父侧初报四点系旧形）：`thincoder-core/agent/turn-loop.mjs:213` ∥ `thincoder-core/advisor/loop.mjs:207` ∥ `bench/lib/client.mjs:177`（VSC 侧 = 零调用点转口——`thincoder-vscode/src/specs.mjs:13/:17` re-export，评审发现 #2 收正）。

### 1.5 父侧核验（2026-10-10 10:1x）

- **失败面实核**（本机 traces `C:\Users\liwei\.thincoder\traces\2026-10-10\61ca071934e3-3364.jsonl` ∥ `-3366.jsonl`）：`provider:"testserver"`（用户网关）+ `model:"gemini-openai/models/gemini-3.8-flash"` ⇒ **OpenAI 兼容路（gemini-openai）**——设计射程正中主线；KD-4（原生路回带出界）不碰用户实证面。
- 400 文本逐字（trace `error.err`）：`Function call is missing a thought_signature in functionCall parts … function call default_api:glob , position 25 … INVALID_ARGUMENT`。
- 回传消息实核：msg#25 assistant `tool_calls[0]` 键 = `id,type,function`（无附带字段）；整条记录 `extra_content` 零命中（与诊断一致）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计轮 2026-10-10 · 相抵点父侧已裁② · §6.24 已落；fix 轮 1 已落（评审 #1 ∥ #3–#9 逐号收正 + 零号项悬空收正））

**设计轮（eng-designer · 2026-10-10）**

**本批条目（覆盖 · 台账 #1205）：**

- ① 捕获 · OpenAI 兼容路——`thincoder-core/provider/sse.mjs:36-62` `mergeToolCalls` 槽加 `extra_content`（白名单 `{google:{thought_signature}}`；在场才建 · 在场覆写）。
- ② 捕获 · 原生路——`thincoder-core/provider/google.mjs:195-204` `part.functionCall` 支同字段（`part.thoughtSignature`——**unverified**：本机无原生流样本）。
- ③ 承载——`thincoder-core/model-specs.mjs` `assistantToolCallMessage`（as-of `:345-358`；在途规格表批落地后 +~7 行位移 ⇒ 以符号名定位）：tool_calls 映射加签名字段 + 文档串补一句。
- ④ 合并保真——`thincoder-core/provider/core.mjs:346-366` `mergeRetryToolCalls`：新建槽时搬签名（首见胜——重试/续写合并不丢捕获）。
- ⑤ 网关核——`thincoder-server` 判定**零改**（实读：`src/gateway/forward.mjs:204` 请求体 `{...body, model}` 展开透传 ∥ `:140-150` 流式中继逐块原样 ∥ `routes.mjs:44-70` 零字段白名单）；机检 = 源文本结构断言（批内件）+ 收口真发端到端。
- ⑥ 持久化——原样 JSON 往返（`session.mjs:184` history = 消息对象数组 ∥ `session-segments.mjs:41-52` `slimForDisplay` 只截 arguments、不改 tc 键集）⇒ 重载回带签名存活（证据级 = 实读，无真机重载 shot）。
- ⑦ 用例（批内件）+ 零回归钉。

**本批不做（显式）**：原生路回带（functionCall parts 复建——另机制，见 KD-4）∥ 网关改动 ∥ 规格表 / 预设表 / 三端 UI ∥ 需求档 ∥ 服务器预设快照。

**设计档落点（本设计轮已落）**：`docs/core/design/PROVIDER.md`——新增 **§6.24**（机制单源）+ §6.10 槽附加字段指针 + §7 D-PR37/D-PR38 + 变更记录 1 行。

**机制设计（改法逐字；无签名上游结构零变）**：

1. `provider/sse.mjs` `mergeToolCalls`——槽落定（`:56-60`）之后加：
```js
const sig = tc.extra_content?.google?.thought_signature
if (typeof sig === "string" && sig) slot.extra_content = { google: { thought_signature: sig } }
```
覆盖四条槽路径（index / id / name / tail）与非 SSE JSON 兜底帧（同经本函数）；覆写语义与 snapshot 覆盖一致——非 snapshot 增量帧通常只在首帧携带 ⇒ 两规则等价。

2. `provider/google.mjs` `parseGeminiStream`——`:195-204` 支改为：
```js
} else if (part.functionCall) {
  let slot = result.toolCalls.find((tc) => tc.name === part.functionCall.name)
  if (!slot) {
    slot = { id: part.functionCall.name + "_" + result.toolCalls.length, name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args || {}) }
    result.toolCalls.push(slot)
  }
  if (typeof part.thoughtSignature === "string" && part.thoughtSignature) {
    slot.extra_content = { google: { thought_signature: part.thoughtSignature } }
  }
}
```
无签名 ⇒ 与现盘逐字同形（只重构出 `slot` 复用，零语义差）。

3. `model-specs.mjs` `assistantToolCallMessage`——tool_calls 映射项加 `...(tc.extra_content ? { extra_content: tc.extra_content } : {})`（缺 ⇒ 键不存在——单构造点穿过，全调用点零改）。

4. `provider/core.mjs` `mergeRetryToolCalls`——`:363` 邻域加 `if (tc.extra_content && !s.extra_content) s.extra_content = tc.extra_content`。

5. 回传面（**零改面 · 证据**）：`core.mjs:185-189` body.messages 原样 ∥ `normalize.mjs` / `escape.mjs:106-123`（spread 保 tc 字段）/ `:139-147`（消息级只剥 ts/transient）∥ 网关透传（⑤）⇒ 消息里的 `extra_content` 随 messages 原样出车。

**受影响文件与测试面**：

| 文件 | 现读（行数） | 增量 | 说明 |
|---|---|---|---|
| `thincoder-core/provider/sse.mjs` | 297 | +3（~300——300 咨询线沿位；≤500 硬限在位） | 捕获① |
| `thincoder-core/provider/google.mjs` | 285 | +5/−3（支内重构） | 捕获② |
| `thincoder-core/provider/core.mjs` | 466 | +1 | 合并保真④ |
| `thincoder-core/model-specs.mjs` | 359（as-of；在途批 +~7 ⇒ 锚以符号名） | +1 行 + 文档串 1 句 | 承载③（函数区——父侧已放行，见上抛） |
| `docs/core/design/PROVIDER.md` | 712 | +~40 | §6.24 + 指针 + D-PR37/38 + 变更记录（本设计轮已落） |
| `docs/batches/2026-10-10-gemini-thought-signature.test.mjs` | 新档 | ~120-160 | 批内件；形态循 `2026-10-04-issue-fix-round1.a.test.mjs:87-112`（readSSE 直驱）∥ `2026-10-05-digest-accounting.test.mjs:309`（google fetch 桩） |
| 网关 `thincoder-server/**` | — | 0 | 零改（判定⑤） |

**验收对照（AC → 机检面；批内件复跑 = 仓根 `node --test docs/batches/2026-10-10-gemini-thought-signature.test.mjs`）**：

- AC-1 捕获（OpenAI 兼容路）：合成 SSE 帧带 `tool_calls[].extra_content.google.thought_signature` ⇒ `readSSE` 出口 `result.toolCalls[0].extra_content.google.thought_signature === "S"`。
- AC-2 捕获（原生路）：`google.mjs` `chat()` + fetch 桩喂 `functionCall` + `thoughtSignature` ⇒ 槽含同字段。
- AC-3 承载：`assistantToolCallMessage` 直调——有 ⇒ `msg.tool_calls[0].extra_content.google.thought_signature === "S"`；无 ⇒ `"extra_content" in msg.tool_calls[0] === false`。
- AC-4 合并保真（结构断言）：`core.mjs` 源文本含该搬字段行。
- AC-5 零回归：无签名字段帧 ⇒ 槽键集 = `{id,name,arguments}` ∧ 消息 tool_calls 项键集 = `{id,type,function}`（逐字——他家 provider / 无签名上游零变）。
- AC-6 网关透传（结构断言）：`forward.mjs` 展开形 + 逐块原样写 + `routes.mjs` 全 body 传递三断言在场。
- AC-7 持久化：`JSON.parse(JSON.stringify(msg))` 后签名字段同值 ∥ `slimForDisplay(msg)` 不改 `extra_content`。
- AC-8 端到端（真跑 · **需用户 gemini 实例**）：同 bug 场景一枪（调工具 → 回传 → 再请求 200）——父侧收口提请项，非机检。

**关键决策（KD）**：

- KD-1 白名单字段（非原样透带整个 `extra_content`）——只认官方实样路径；回显未知子字段会改变他家上游线形。被否：原样透带。
- KD-2 单构造点穿过（`assistantToolCallMessage`）——父侧裁定②；被否：各调用点旁路（破单点形态）。
- KD-3 不做发送面目标感知剥离（跨 provider 携带 = 认账）——用户链过网关 ⇒ host/format 判别不可靠，剥离恰杀要保字段。被否：按 host/format 剥离。
- KD-4 原生路捕获在位 · 回带缓（边界）——原生路现不复建 functionCall parts（工具轮历史压平为文本）⇒ 不触本 400；补建 = 新机制（functionResponse 配对 + 修复前历史无签名 ⇒ 直接补发反引新 400）。被否：同批补建。

**上抛/披露**：

- 上抛：相抵点（约束「禁动 model-specs.mjs」vs 回传唯一构造点在该文件）已由父侧裁 ②（放行函数区 + 两批实施轮同文件自动串行 + 锚以内容为主）；本设计轮无其余待裁。
- 披露（报告尾注）：① 父侧点名调用点清单两处过时——现盘实测 = `agent/turn-loop.mjs:213`（原 `thincoder-core/agent.mjs`）∥ `advisor/loop.mjs:207` ∥ `bench/lib/client.mjs:177`；`thincoder-vscode/src/agent.mjs` = 44 行转口残面（**零调用点**），VSC 现形 = `specs.mjs:13/:17` 转口 re-export；② 原生路字段名 ∥ 网关真链路 = unverified（源读 + 收口真发补证）；③ trace 记录面将随捕获带 `extra_content`（诊断增强——脱敏无关）。

**本设计轮产品码零触**（实施 = 另轮 eng-coder；上表五个产品码文件 + 批内件为其交付面）。

### 修复轮落位（设计评审轮 1 · 发现 #1 ∥ #3–#9 逐号收正——2026-10-10 · 执行人 = eng-designer）

**轮次**：fix（承批档 §3「轮次 1」逐号要件；#2 = 父侧直执行、已收正 §1 两处坐标——本节零涉）。**本补记 = 终形**（现文以本补记为准；被取代项见末尾清单）。**零新语义**（评审发现直接导出项）；**产品码 / 测试码零触**（批内件 = 实施轮交付面）。

**逐号落点（号 → 改动；坐标 = as-of 本补记）**：

1. **#1（修复前历史残余）** → `docs/core/design/PROVIDER.md` 认账 ∥ 边界之间补「**残余（修复前历史）**」段（现 `:596`）：修复前落盘、含无签名工具调用的会话重发仍可能落同一 400（服务端对既有无签名史形的容忍度 = 本批无读数）；缓解径 = `/compact` ∥ 新会话。
   - 批档面同句：本项即该句载体；**AC-8 两枪形** = 验收面 ③。
2. **#3（AC-4 ∥ AC-6 证据级）** → 实读定形 = **重试缝合可达**：`mergeRetryToolCalls` 非导出（`thincoder-core/provider/core.mjs:346` 局部函数），但经导出面可达——`chat()`（`:76` 单一入口）首轮 `finishReason === "insufficient_system_resource"`（`:256`）⇒ 第 2 次请求 + `mergeRetryToolCalls`（`:268`；首帧 finish_reason 经 `sse.mjs:151` 逐字透传）。
   - AC-4 收正 = 双层（验收面 ①：结构断言保留 + **行为用例**）；AC-6 补证据级注（验收面 ②）。
3. **#4（先例对照）** → `PROVIDER.md` §6.24 头补「**先例（closest-precedent）**」段（现 `:566-567`）= 先例批 `docs/batches/2026-09-20-reasoning-echo-gap.md`（thinking 回传缺口批——同点加字段）+ 落点实现坐标 `thincoder-core/model-specs.mjs:352`（`assistantToolCallMessage`——先例所建单构造点）。
   - 续：其设计档节 `docs/core/design/CONTEXT-COMPACTION.md` §6.10 #9（`:165`）∥ §7 D-CC22（`:698`）+ 对齐句（单构造点穿过 ∥ 调用点零改）+ 偏离句二（① 白名单构造 → §7 D-PR37；② 原生路回带缓 → §7 D-PR38）。批档面对照面 = 本补记。
4. **#5（零第二构造点）** → **AC-9（新 · 验收面 ④）**：回传面 tool_calls 装配单点结构断言（与 AC-4 同件承载）。
5. **#6（插入锚收正）** → 本节 `:64` 插入锚改述（以本补记为准）=「`mergeToolCalls` **槽选择分支链之后、循环体内单次插入**（四条槽路径共经）」——`sse.mjs` 实读：槽选择分支链 = `:41-55`，循环体 = `:37-61`。
   - 「覆盖四条槽路径 + 非 SSE 兜底帧」句（本节 `:69`）**保留**——作 AC-1 判据面。
6. **#7（受影响文件表读数收正）** → 本节 `:100` 行（`PROVIDER.md`）：「现读 712」= **设计轮前读数**（作废）⇒ **750**（评审轮实读）→ **757**（fix 轮后实读；+7 = 先例 2 行 + 空行 2 + 残余 1 行 + 变更记录 2 行）。
   - 增量列注：+~40 **已落**（设计轮）+7（fix 轮）；实施轮零触。
7. **#8（KD-3 验证面）** → KD-3（本节 `:119`）补注：验证面 = **AC-10（新 · 验收面 ⑤）桩面断言**；对端接受度 = 认账本体（对端行为、发送侧不可判）。
8. **#9（条目②）** → 本节 `:51` 条目② **保留**（父侧裁）+ 理由句：**先落捕获、消费者后至**（消费者同批到位 = KD-4 批——原生路回带补建）；捕获值现无读取方——零副作用守卫使其无害。

**零号项（一致性面 · fix-on-spot，非评审号）**：本批引用面悬空收正 1 处——`PROVIDER.md` §6.24 机制 3 的核 core 档引路补全（`thincoder-core/provider/core.mjs`）；doc-check 闸态悬空 **1 → 0**。零语义（引路补全）。

**验收面增量（终形 · 覆盖本节 `:106-113` 的 AC 面）**：

- ① **AC-4（终形 = 双层）**：① 结构断言（原句保留——源文本含搬字段行）；② **行为用例（新）**：fetch 桩两帧喂 `chat()`（openai 形 provider）——帧 1 = 槽帧（不携签名字段）+ `finish_reason:"insufficient_system_resource"`；帧 2 = 同槽帧（携 `extra_content.google.thought_signature`）+ `finish_reason:"tool_calls"` ⇒ 出口槽 `extra_content.google.thought_signature` 在场（合并搬字段——签名存活）。该断言 = 搬字段行的红 / 绿判别器（行未落 ⇒ 红）。
- ② **AC-6（终形 = 原句 + 证据级注）**：源文本结构断言（零改面钉）；线上透传真跑核验 = AC-8——证据级 = 结构 + 真跑双层，机检层到此为止。
- ③ **AC-8（终形 = 两枪形）**：端到端真跑 · 需用户 gemini 实例（父侧收口提请项，非机检）——① 新会话一枪（同 bug 场景：调工具 → 回传 → 再请求 = 200）；② 续跑修复前会话一枪（含无签名工具调用史）⇒ 取残余面读数：200 ⇒ 风险不显；400 ⇒ 残余证实（缓解径 `/compact` ∥ 新会话）。
- ④ **AC-9（新 · 结构断言 · 与 AC-4 同件承载）**：回传面 tool_calls 装配单点——`thincoder-core/**`（非 test）assistant 消息的 `tool_calls` 装配对象字面恰 1 处 = `model-specs.mjs:356`（`assistantToolCallMessage` 内；`token-window.mjs:69` 命中 = 注释、非装配）。
  - 续：`assistantToolCallMessage` 面 = `config.mjs:103-104` 名表 + 三调用站点（`agent/turn-loop.mjs:213` ∥ `advisor/loop.mjs:207` ∥ `bench/lib/client.mjs:177`）各恰 1 处 + VSC 转口（`specs.mjs:13/:17`）零调用点——零旁路装配。
- ⑤ **AC-10（新 · 桩面断言）**：有签名历史（assistant `tool_calls[].extra_content`）经 `chat()`（openai 形 provider + fetch 桩捕获请求体）⇒ 请求体 `messages[]` 该字段**逐字在场**（净化链保 tc 字段——`escape.mjs:106-123` spread 形）；对端接受度 = 认账本体（发送侧不可判）。

**机检（fix 轮落笔后复跑 · cwd = 仓根）**：`node scripts/doc-check.mjs --root .` ⇒ 悬空 **0**（前值 1——零号项收正）· 行宽 **0**（OK）· 拟新增 26 · 迁移期引文 326。本 fix 轮 = 零新悬空 ∥ 零超宽行。

**被取代项清单（防重开）**：① 本节 `:64` 原锚「槽落定（`:56-60`）之后加」⇒ 以 #6 改述为准；② 本节 `:100` 行「现读 712」⇒ 以 #7 收正为准；③ 本节 `:109` AC-4 结构断言单层 ⇒ 以验收面 ① 双层为准；④ 本节 `:111` AC-6 无证据级注 ⇒ 以验收面 ② 为准；⑤ 本节 `:113` AC-8 单枪形 ⇒ 以验收面 ③ 两枪形为准；⑥ 本节 `:119` KD-3 无验证项 ⇒ 以 #8 注 + 验收面 ⑤ 为准；⑦ 本节 `:51` 条目② 无理由句 ⇒ 以 #9 理由句为准（条目保留）。

**零触面（显式）**：§1 段（#2 = 父侧笔）· §3 段 · 产品码 / 测试码 · 需求档 · 提示词 · 他批写域 · `PROVIDER.md` §6.24 与变更记录以外的既有节。**PROVIDER.md 本 fix 轮改动 = §6.24 三笔（先例 ∥ 残余 ∥ 机制 3 引路）+ 变更记录 1 行**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**审查面限制**：① 无文档地图（Document ownership 判据降级）——落点依设计档自身节序（§6.20–§6.23 邻域）核对，§6.24 形态相符；② 无项目标准档——方法学按 AGENTS.md + 在审文档判；③ 射程仅两份文档——产品码 / 测试 / 网关坐标与行数未抽检（标 unverified），受影响文件抽检限在审 `.md` 行。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 需求覆盖 | 🟡 | 修复前历史残面未入设计：本批自身实证（批档 `:41`「msg#25 assistant `tool_calls[0]` 键 = `id,type,function`（无附带字段）」）= 400 由「回带无签名 functionCall」触发；设计保持回传面零改（`PROVIDER.md:587`），则修复前落盘、含无签名工具调用的会话重发时仍可能落同一 400（服务端对既有无签名史形的容忍度 = 本批无读数，unverified）。KD-4（批档 `:120`）恰以「修复前历史无签名 ⇒ 直接补发反引新 400」为由缓原生路，同一风险对本批主线（OpenAI 兼容路）无认账/边界句；AC-8（`:113`）单枪亦未描述该场景。 | 在 `PROVIDER.md:593` 边界 ∥ `:591` 认账 邻域与批档 §2 补一句：修复前历史无签名之残余 + 缓解径（/compact ∥ 新会话）；AC-8 扩为两枪形（新会话 + 续跑修复前会话），以便取得该面读数。 |
| 2 | Doc-state（批内两节坐标未同步） | 🟡 | §1.4 附则③（批档 `:35`）调用点清单含 `thincoder-core/agent.mjs` ∥ `thincoder-vscode/src/agent.mjs`，§2 披露①（`:125`）已实测收正为 `agent/turn-loop.mjs:213` ∥ `advisor/loop.mjs:207` ∥ `bench/lib/client.mjs:177`（VSC 侧 = 零调用点转口）——旧坐标仍留 §1 记录面、无收正标记；同类：google.mjs 捕获面范围 §1.2（`:18`）记 `:195-201` ∥ §2（`:51`/`:71`）记 `:195-204`。 | §1.4 附则③补「以 §2 披露① 为准」标记（或改齐坐标）；google.mjs 两范围取一（或注明 as-of 读出差异），使批内坐标单一现形。 |
| 3 | 验收标准 | 🟡 | AC-4（批档 `:109`）与 AC-6（`:111`）均为源文本结构断言（只钉行在场、不验行为）；AC-4 守的正是运行期合并路径——重试/续写合并丢签名即本 400 的静默复发形态，结构断言证不了「不丢」。 | 若 `mergeRetryToolCalls` 可经导出 ∥ 重试缝合路径触达，补行为用例（两次尝试合并 ⇒ 签名存活）；否则 AC-4 注「结构断言 = 当前可得最强形态」及理由。AC-6 为零改面钉可保留，建议同句注明证据级。 |
| 4 | 先例对照（closest-precedent） | 🟡 | 先例仅两处零散提及（`PROVIDER.md:637` D-PR37「（先例 = `2026-09-20-reasoning-echo-gap` 批同点加字段）」∥ 批档 `:35` 附则①），无完整先例行：缺先例实现坐标 ∥ 对应设计档节 ∥ 对齐·偏离的显式裁定（本批偏离 = 白名单构造 ∥ 原生路回带缓）。 | 批档 §2 ∥ §6.24 头补一行先例对照：先例批 + 落点实现坐标 + 其设计档节 + 对齐句与偏离句（理由各带指针）。 |
| 5 | 验收标准（不变量钉） | 🔵 | AC-1..AC-8（批档 `:106-113`）无「单构造点」不变量钉——批档 `:35` 附则①自述先例批以结构机检钉「零第二构造点」，本批承载面正在同一构造点，却无对应断言。 | 增一条结构断言：历史回传面 tool_calls 装配只经 `assistantToolCallMessage`（零第二构造点），与 AC-4 同件承载。 |
| 6 | 清晰度（改法落点） | 🔵 | 批档 `:64` 插入锚写作「槽落定（`:56-60`）之后加」，而 `:69` 声明覆盖四条槽路径 + 非 SSE 兜底帧——行区间坐标与「四路径单次插入」意图可能被字面实现为单路径。 | 锚述为「槽选择分支链之后、循环体内单次插入（四条槽路径共经）」，保留「覆盖四路径」句作 AC-1 判据。 |
| 7 | 受影响文件注记（抽检） | 🔵 | 抽检：`PROVIDER.md` 行记「712」（批档 `:100`），该档本评审实读 = 750 行（设计轮 +~40 已落——行内自注「本设计轮已落」）⇒ 读数漂移（纯 `.md` 注释豁免）；另该档 750 行已过 500 咨询线、距 800 硬限位（同档后续批次留意分拆，不属本批判定）。 | 该行「现读」收为落地后读数（或标「设计轮前读数」）；四产品码行（sse 297 ∥ google 285 ∥ core 466 ∥ model-specs 359）在本评审射程外未能抽检（见审查面限制）。 |
| 8 | 验证面（跨 provider 携带） | 🔵 | KD-3（批档 `:119`）以「认账」结案跨 provider 携带，但无验证/观察项：`extra_content` 随 tool_calls 项发给非 Gemini 上游的接受度仅由推理担保（unverified）。 | 补桩面断言（有签名历史发 openai 形桩 ⇒ 请求体形态逐字在场）或明写「观察登记 · 无验证项」留痕。 |
| 9 | 范围（原生路捕获项） | 🔵 | 条目②（批档 `:51`）落一个当前无消费者的捕获面（原生路不复建 functionCall parts ⇒ 捕获值无人读），字段名 `part.thoughtSignature` 自标 **unverified**；零副作用守卫使其无害，但属「先于消费者落码」。 | 二选一：条目②随 KD-4 批一并落（消费者同批到位、字段名可获真样）；或保留现状 + 明写「先落捕获、消费者后至」理由句。 |

**计数**：🔴 0 · 🟡 4 · 🔵 5

VERDICT: pass

## §4 用户批准（主 agent）

**批准（父侧代签 · 2026-10-10 · 用户 09:57「开批吧，也自动跑。」授权内）**：设计评审轮 1 = **pass**（🔴 0 ∥ 🟡 4 ∥ 🔵 5）；评审发现逐号处置毕——修正轮 8/8 落位 + 零号项（悬空收正：doc-check 闸态 1 → 0）经父侧逐处核验：先例对照（`docs/core/design/PROVIDER.md:566-567`）∥ 残余段（`:596`）∥ AC-4 双层（结构 + fetch 桩行为用例）∥ AC-6 证据级注 ∥ AC-8 两枪形 ∥ AC-9（新·单构造点结构断言）∥ AC-10（新·桩面请求体断言）∥ 插入锚收正 ∥ 受影响读数 757 ∥ 条目② 保留 + 理由句（批档 §2 修复轮块 `:129-164`）；#2 = 父侧直执行收正（§1 两处，已落）。

**三条件核验**：① 评审 pass 0🔴 ✓ ② 修正轮落地 + 逐条核验 ✓ ③ token 已签发 ✓。批准信号已出（token ∕ designId = 运行时凭据，不载文档）。**实施轮已派**（五文件 + 批内件；捕获双面 ∥ 单点承载 ∥ 合并保真）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 clean · 评审两轮 pass；批内件 9/9 绿 · 终态 clean）



**（1）交付摘要**（实施轮 · 2026-10-10 · 设计单源 = `docs/core/design/PROVIDER.md` §6.24 ∥ 批档 §2 修复轮终形；五处落笔按 §2 `:64-88` 逐字 + 批内件）：

| # | 文件:行 | 笔 |
|---|---|---|
| ① | `thincoder-core/provider/sse.mjs:56-58` | 捕获（OpenAI 兼容路）——白名单构造 `{google:{thought_signature}}`、在场才建 / 在场覆写；插入位 = 槽选择分支链（`:41-55`）之后、循环体内单次插入（四条槽路径 + 非 SSE 兜底帧共经） |
| ② | `thincoder-core/provider/google.mjs:201-204` | 捕获（原生路）——`part.thoughtSignature` 同形挂载（在场才建）；无签名 ⇒ 与批前逐字同形（仅重构出 slot 复用，零语义差） |
| ③ | `thincoder-core/model-specs.mjs:361` | 承载——tool_calls 映射 `...(tc.extra_content ? { extra_content: tc.extra_content } : {})`（缺 ⇒ 键不存在；单构造点穿过、调用点零改）+ 文档串补一句（`:349`）；规格表区零触 |
| ④ | `thincoder-core/provider/core.mjs:364` | 合并保真——`if (tc.extra_content && !s.extra_content) s.extra_content = tc.extra_content`（首见胜） |
| ⑤ | `docs/batches/2026-10-10-gemini-thought-signature.test.mjs`（新档 · 252 行） | 批内件——AC-1..AC-7 / AC-9 / AC-10 九条用例全落 |

**复跑读数**（cwd = `thincoder/`）：

- 红基线（改前）：`node --test docs/batches/2026-10-10-gemini-thought-signature.test.mjs` ⇒ 3 pass / 6 fail（红 = AC-1/2/3/4/9/10）。
- 落笔后首跑：8 pass / 1 fail（AC-9 计数器把 `assistantToolCallMessage` 自身定义行计入——批内件侧 bug，见（4））。
- 终跑：9 pass / 0 fail（`ℹ pass 9 · fail 0`）。
- AC-4 判别器红读（临时移除 `core.mjs` 搬字段行）：行为用例红（`Cannot read properties of undefined (reading 'google')`——签名在合并处丢失）⇒ 行恢复后 9/9 绿；`git diff` 复核恢复后逐字同形。
- `node --check`：四涉档（sse ∥ google ∥ core ∥ model-specs）+ 批内件 = 全 OK。

**（2）决策透明表**（实施轮内自决项）：

| # | 决策 | 依据 |
|---|---|---|
| ① | 插入位取「分支链 `:41-55` 之后」字面位 | 批档 §2 修复轮 #6 改述锚 =「槽选择分支链之后、循环体内单次插入」 |
| ② | 三处落笔各加一行注释（§6.24 指针 / unverified 标注 / 首见胜） | 仓惯例注释载 why；零语义 |
| ③ | 文档串补一句置于 reasoningEcho 段之后（空注释行分隔） | 设计「文档串补一句」；段落边界不动 |
| ④ | 批内件含白名单构造断言（KD-1）与 AC-4 重排（行为用例先、结构断言后） | 机制「白名单构造」的机检面延伸；重排使判别器红读落行为面（覆盖面零变） |
| ⑤ | 评审 🔵#2（既有文档串滞后）报而不修 | 批外笔（先于本批存在）+ 设计只授权「+映射行 + 文档串 1 句」——超笔即越权 |

**（3）审计与代码评审轮次与终态**：

| 轮 | 类型 | 结论 | 处置 |
|---|---|---|---|
| 审计轮 1 | 内部 explore 偏差审计（只读） | CLEAN——四类偏差（partial / 静默简化 / doc-drift / 超清单）零发现 | 无 fix |
| 代码评审轮 1 | advisor（独立只读） | pass——🔴 0 ∥ 🟡 1 ∥ 🔵 3 | 🟡#1 = 设计档措辞（父侧文档层，实施轮禁改面）→ 上抛；🔵#3/#4 = 批内件自缺陷 → 当轮修复；🔵#2 = 既有文档串滞后 → 报不修 |
| 代码评审轮 2 | advisor（fix 核验） | pass——两条 fix claim 逐字核验（标头基线 ∥ AC-9 过滤行感知）；两条 reasoned non-fix 成立 | 收敛 |

**终态 = clean**（审计 clean + 评审两轮 pass；无未决 🔴；两条非修复项均带理由并上抛）。

**（4）fix round（实施轮内 · 均批内件侧，产品码零涉）**：

- fix-1：AC-9 调用点计数器误计自身定义行 / 文档串行 ⇒ 改行感知（弃 `*` / `//` 起首与 `function …(` 行）。
- fix-2：AC-9 ① 注释过滤只排 `//` ⇒ 补 `*` 起首行（评审 🔵#4 同项）。
- fix-3：批内件标头「先红后绿」分面收正为实测 6 红 / 3 绿（评审 🔵#3）。
- fix-4：AC-4 用例重排（行为用例先、结构断言后）——判别器红读落行为面；断言集零变。

**（5）零改面（零 diff 复核）**：回传面（`provider/core.mjs:185-189` body.messages 原样）∥ 净化链（`provider/normalize.mjs` ∥ `escape.mjs:106-123` / `:139-147`）∥ 网关（`thincoder-server/**`）∥ 持久化（`session.mjs` / `session-segments.mjs`）∥ 规格表行值 ∥ 预设表 ∥ 三端 UI ∥ 需求档 ∥ 设计档 ∥ 批档（除本 §5）。

**（6）上抛/披露**：

- [上抛·待裁] 评审轮 1 🟡#1：`docs/core/design/PROVIDER.md:588`「（新建槽时搬字段，首见胜）」与 `provider/core.mjs:364`（槽缺即搬）及批档终形 AC-4（`:153`）语义不一致——代码与终端 AC 一致，属设计档单源措辞待对齐（父侧文档层；实施轮禁改设计档）。建议改为「合并时缺则搬（首见胜）」。
- [上抛·知会] 评审轮 1 🔵#2：`thincoder-core/model-specs.mjs:351-352` 调用点清单滞后（列 `agent.mjs` / VSC `agent.mjs`；实测 = `agent/turn-loop.mjs:213` ∥ `advisor/loop.mjs:207` ∥ `bench/lib/client.mjs:177`）——既有文本、批外笔，本轮未改；建议该文件下次触碰时对齐（批档 §2 披露① 已载收正清单）。
- AC-8（端到端两枪形真跑）＝ 父侧收口提请项（需用户 gemini 实例）——非本轮机检面；批内件对网关 / 持久化 / 回传面为结构断言 + 静态复核（真跑 = AC-8）。
- 本批内件未进仓套件（按设计）；仓套件复跑属父侧收口面。

## §6 验证与收口（父代理）

### 6.1 交付核验（实跑读数 · 父侧 2026-10-10 10:3x）

- 批内件复跑（仓根）：`node --test docs/batches/2026-10-10-gemini-thought-signature.test.mjs` ⇒ **tests 9 ∥ pass 9 ∥ fail 0**（AC-1..AC-7 / AC-9 / AC-10；AC-8 = 真跑面见 6.4）。
- 判别器实证（实施轮）：临时移除 `thincoder-core/provider/core.mjs:364` ⇒ AC-4 行为用例红；恢复 ⇒ 绿（红 / 绿对在案）。
- 语法：五涉档 `node --check` 全 OK（实施轮读数；父侧复跑同判）。
- 改动面实读：`thincoder-core/provider/sse.mjs:56-58`（+3）∥ `thincoder-core/provider/google.mjs:195-204`（净 +2）∥ `thincoder-core/model-specs.mjs:349,361`（净 +3）∥ `thincoder-core/provider/core.mjs:364`（+1）；批内件新档 252 行。

### 6.2 测试纪律线

- ① 本批 unit 文件 = `docs/batches/2026-10-10-gemini-thought-signature.test.mjs`（随批存档——无处置项；复跑命令见 6.1）。
- ② 集成场景：无影响（传输面捕获 / 承载两行；不涉业务流程面）——AC-8 真跑 = 收口提请（见 6.4）。
- ③ 仓套件：未跑（父侧收口口径——本批以批内件为准）。

### 6.3 结算同步核单

- **角色表**：§1 主 agent ∥ §2 eng-designer ∥ §3 评审（轮次 1）∥ §4 主 agent ∥ §5 eng-coder ∥ §6 主 agent——各段单一作者在位。
- **状态行**：§2 = 设计完成 ∥ §3 = 评审完成（pass）∥ §5 = 实施完成（§1 收口态由 close 落）。
- **计数**：设计评审 🔴0 / 🟡4 / 🔵5（处置 = 修正轮 8 号 + 父侧笔 1（#2）+ 零号项 1）；代码评审 🔴0 / 🟡1 / 🔵3（🟡1 = 父侧收口机械笔处置——措辞收正；🔵3 内部处置——含两条 reasoned non-fix，轮 2 核验成立）。
- **指针**：台账 #1205 task_book → 本档（在盘）；§2 ∥ `docs/core/design/PROVIDER.md` §6.24 ∥ 变更记录三分同源。
- **变更记录**：设计轮 `:754` ∥ fix 轮 `:755-756` ∥ 收口机械笔 `:757`（父侧直执行 · 可 revert——措辞「合并时缺则搬」+ `model-specs.mjs` 文档串调用点清单收正）。
- **遗留待办**：AC-8 两枪形真跑 = 已提请用户（需 gemini 实例；非机检——读数回填）；其余无。
- **暂缓批复核**：无。
- **前批遗留交叉核**：无。
- **结算行**：见收口回报（`/ledger` 面）。

### 6.4 收口注 + AC-8 真跑提请

- **AC-8 提请（两枪形）**：① 新会话：调一次工具 → 回传 → 再请求 ⇒ 应 200；② 续跑修复前会话（含无签名工具调用史）⇒ 取残余面读数（200 ⇒ 残余不显；400 ⇒ 残余证实——缓解径 = `/compact` ∥ 新会话）。
- 提交：code = 四涉档（`provider/sse.mjs` ∥ `provider/google.mjs` ∥ `provider/core.mjs` ∥ `model-specs.mjs`）；docs = 本档 + 批内件 + `PROVIDER.md`（两笔 path-limited；读数落父侧回报与台账 evidence——本档冻结后零回改）。
- 设计槽：收口后 consume（运行时凭据，不载文档）。
