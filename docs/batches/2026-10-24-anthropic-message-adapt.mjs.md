# 2026-10-24 · Anthropic 通道补齐消息适配层：OpenAI 形态历史 → tool_use / tool_result
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = GitHub #20 / Gitee IKKJEE（同一根因）：Anthropic 原生通道原样透传 OpenAI 形态会话历史，带工具调用的多轮对话必然被上游 400 拒收（`Unexpected role "tool"`）。用户 2026-10-24 17:30「开批」。。
> 台账 = #1747（PROVIDER · 归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**讨论（主 agent）**

**现象（GitHub #20 ∥ Gitee IKKJEE，同一根因）**：配了 Anthropic 原生渠道后，只要那一轮用过工具，下一次请求必被上游拒：`400 Unexpected role "tool"`（经网关包装为 502）。换模型、重开会话都不解决——毒在历史里。

**根因（实读 · 2026-10-24）**：

- 历史是 OpenAI 形态：`thincoder-core/agent/record-results.mjs:60` 推 `{ role: "tool", tool_call_id, name, content }`。
- `thincoder-core/provider/core.mjs:143` 分派到 anthropic 分支时，**只归一 tools**（`:148` `normalizeTools(tools)`），messages 原数组直落。
- `thincoder-core/provider/anthropic.mjs:43-49` 只做 system 抽离；`:54` `messages: chatMessages` —— 其余原样透传。
- 全仓 `tool_result` 产出点 = **0**；`tool_use` 只在解析侧出现。
- `normalizeToolPairing`（补缺失工具回执）只跑在 OpenAI 径（`core.mjs:176`），Anthropic 径拿不到。

**文档与代码相抵**：`docs/core/design/PROVIDER.md:147` 写着「tool 用 `tool_use` / `tool_result` block」——设计说已转，代码没转。本批要一并把这个说法变成事实（或纠正设计）。

**修法方向（待设计席定稿）**：在 Anthropic 分支进入请求体之前插入一层纯函数转换——assistant 的 `tool_calls` ⇒ `tool_use` 块；`role:"tool"` ⇒ 含 `tool_result` 块的用户消息；相邻同角色合并；首条须 user；`image_url` ⇒ `image` 块；已是原生块的消息直通。转换必须 copy-on-write，**不改写 agent.history 本体**（历史是 OpenAI 形态的持久表示，改了别的渠道就崩）。

**边界（不做）**：不动 OpenAI / responses / google 三条通道的转换路径；不改工具调用协议本身；不引入第三方依赖。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**

| # | 条目 | 落点 |
|---|---|---|
| B1 | Anthropic 通道消息适配层：OpenAI 形态历史 → Messages API 形态（规则 R1–R13，含畸形 `arguments` 处置与不变量 I1–I6） | design §6.27 |
| B2 | 分派前配对归一：anthropic 分支复用 `normalizeToolPairing` | design §6.27 · `thincoder-core/provider/core.mjs:143` |
| B3 | 设计档对齐：§6.8 的 tool_use / tool_result 说法成为事实；新增 §6.27 与 D-PR41–43 | design §6.8 · §6.27 · §7 |
| B4 | 批内单测：R1–R13 ∥ I1–I6 的断言（closeout 删可执行档，读数留 §5） | design §6.27 |

**明确不在本批（边界）**：另外三条通道的转换路径（`core.mjs:167` responses ∥ `:176` OpenAI ∥ google 径）；工具调用协议本身；历史本体迁移（历史保持 OpenAI 形态）；thinking 块回带 ∥ prompt caching ∥ PDF 块；新增配置项 ∥ 第三方依赖。

**受影响文件（当前行数 → 增量）**

| 文件 | 当前行数 | 增量 | 改动 |
|---|---|---|---|
| `thincoder-core/provider/anthropic.mjs` | 239 | +85 左右 | 新增 `convertMessages`（R1–R13）+ 告警回流 |
| `thincoder-core/provider/core.mjs` | 469 | +2 | anthropic 分支加 `messages = normalizeToolPairing(messages)` |
| `docs/core/design/PROVIDER.md` | 1104（批前）→ 1159（已落） | +55 | §6.8 一句对齐 + §6.27 + D-PR41–43 |
| `thincoder-core/test/anthropic-message-adapt.test.mjs` | 0（新档） | +160 左右 | 批内单测（closeout 删除） |

`thincoder-core/provider/normalize.mjs` 零改（复用既有 `normalizeToolPairing`）。

**验收标准（可机判 · 回指）**

| # | 验收 | 回指 | 机检 |
|---|---|---|---|
| AC-1 | R2 ∥ R3 ∥ R6 ∥ R7 ∥ R8 的每种输入产出逐字相等的规定输出 | design §6.27 R2–R8 | `node --test thincoder-core/test/anthropic-message-adapt.test.mjs` 全绿（批内） |
| AC-2 | 畸形 `arguments`（`"{"` ∥ `"[1]"` ∥ `"null"` ∥ 缺失）⇒ `input:{}` + 恰一条 `anthropic-tool-args-malformed`，转换不抛 | R4 ∥ R5 ∥ I6 | 同上，断言不抛 + 告警计数 = 1 |
| AC-3 | copy-on-write：入参 `JSON.stringify` 前后相等、返回数组 ≠ 入参数组 | I5 | 同上，断言两条件 |
| AC-4 | 不变量 I1–I4 对混合历史（assistant 开头 ∥ 连续 tool ∥ 图文混排）成立 | I1–I4 ∥ R9–R13 | 同上，四断言 |
| AC-5 | 三条非 Anthropic 通道零回归 | design §6.27 边界 | `git diff --stat` 无 `provider/google.mjs` ∥ `provider/responses.mjs`；`core.mjs` diff 仅 anthropic 分支两行 |
| AC-6 | 设计档说法与实现一致 | design §6.8 ∥ §6.27 | `doc_check(mode:"gate")` = PASS（见上抛项：本会话引擎陈旧，需重启后复跑） |

**关键决策**：D-PR41（转换层落在 transport 内、配对修复复用 `normalizeToolPairing`）∥ D-PR42（畸形 `arguments` = `input:{}` + 告警，不抛）∥ D-PR43（首条 user 占位 ∥ 同 role 合并 ∥ tool_result 前置，均在转换层收口）——理由见 design §7。

**偏离**：无功能偏离。两点说明：① brief 的「五种变形」扩为 R1–R13（补 system 抽离、空消息丢弃、原生块幂等）；② `normalizeToolPairing` 按判断复用（理由 = design §6.27）。

**上抛项**：

- `doc_check` gate 本会话无法出 PASS：引擎档 mtime（2026-10-24T09:14:45Z）晚于会话进程启动（2026-10-23T15:44:56Z）⇒ gate 判 ERROR「重启会话后复跑」；`report` 态读数 = 0 命中（锚 0 · 行宽 0）。需主 agent 重启会话后复跑 gate，读数回填 §6。
- 两处 API 约束（首条须 user ∥ assistant 文本置于 tool_use 之前）未取到原文页，design §6.27 标 unverified；两种读法下本设计都合法，不需裁定。

**修轮补记（评审轮次 1 · changes-required → 12 条逐条处置）**

**规则编号重发（按角色分组；旧号 → 新号）**：assistant 文本 2 → 4 · assistant `tool_calls` 3 → 5 · 参数缺/空 4 → 6 · 参数畸形 5 → 7 · `role:"tool"` 6 → 8 · 连续 tool 7 → 9 · 同 role 合并 8 → 10 · 首条 user 9 → 11 · 图像 10/11 → 12（data URL ∥ http 合一行）· 空内容 12 → 13。

删除两支（仓内无生产者）：旧 R12「未知 part 丢弃」→ 改为表外直通（不静默丢）；旧 R13「原生块直通」→ 删除。新增 user 角色行：R2（字符串）∥ R3（part 数组 = `record-results.mjs:66-68` 主路径）。

**验收改绑（映新号）**：AC-1 = R2 ∥ R3 ∥ R4 ∥ R5 ∥ R8 ∥ R9 ∥ R10 逐字输出；AC-2 = R6 ∥ R7 ∥ I6（`input:{}` + 恰一条告警，不抛）；AC-3 = I5（`out.messages !== messages` + 入参 `JSON.stringify` 前后相等）；AC-4 = I1–I4 ∥ I7（text part 零丢弃）∥ R11 ∥ R12 ∥ R13。AC-5 ∥ AC-6 不变。

**返回契约定死**：`convertMessages(messages) → { messages, warnings }`；告警并入 `result._warnings`，消费面 = `agent/run-stages.mjs:44-45`；告警码唯一发射点 = R7 分支。

**受影响文件行数口径**：`read` 行号 anthropic.mjs = 240、core.mjs = 469（`wc -l` 读数 239 ∥ 468，差 1 = 末尾换行）；Δ（+85 ∥ +2）与 tier 结论不变。

**其余评审项落点**：分支场景逐支入 design §6.27 规则表「场景 / 依据」列；用例表 T-1–T-16 入 §6.27；assistant `null` 无 `tool_calls` 的处置 = R13；先例段改正（google 不读 `tool_calls`、`:64` 整条丢弃）∥ 三问行 ∥ 真机验证项两条（阻塞核销）均在 §6.27；`normalize.mjs:131` 坐标已正；D-PR41 措辞统一为「anthropic 分支内、转换前」；google 通道同类缺陷登记为 §6.27 边界观察项（另批）。

**实施后坐标收正（设计席 · 2026-10-24）**

实施落地后按实读复核 `docs/core/design/PROVIDER.md` §6.27：原坐标是设计时读数，已逐条收正（只动坐标与行数，规则面 R1–R13 ∥ I1–I7 与实现代码零改）。

| # | 漂移项 | 处置 |
|---|---|---|
| 1 | system 抽离 `anthropic.mjs:41-49` ⇒ 实读 `:157-166`；anthropic 分支 `core.mjs:143` ⇒ `:151`；`convertMessages` 导出 `:97`、调用 `:169`、告警合并 `:232-234` | 已改 |
| 2 | 同节其它 `file:line` 按实施后实读复核：`normalize.mjs:127` · `record-results.mjs:44/52/54-90/62/67-69/75-81/90` · `core.mjs:173/186/292/331-336` · `anthropic.mjs:172-192/248-362/290/302-304` · `google.mjs:42/48/51-63/65/82` | 已改 |
| 3 | 受影响文件表：`anthropic.mjs` 现量 363（批前 240 ⇒ +123）· `core.mjs` 现量 479（本层两行；余量来自工作树其它在途改动）· 测试档 229 | 已改；tier 结论不变（均 < 500 软线） |
| 4 | `docs\core\design\API-CONTRACT.md` 生成区未再生（新导出缺席、`chat` 仍 `:39`） | 跑 `node scripts/api-contract.mjs --write` 再生：`anthropic.mjs:97` / `:156`；`--check` = 骨架零漂移 |

`doc_check(mode:"gate")` = PASS（2 档 · 0 命中）。

**补记 · F34 集成测试设计段（设计席 · 2026-10-24）**

**补什么**：`docs/core/design/PROVIDER.md` §6.28「集成测试设计（Anthropic 消息适配层）」成段（`:1158`–`:1180`），形制对齐 `docs\core\design\TIMEOUT-DIGEST.md` §9 ∥ `docs\core\design\SESSION-OBSERVABILITY.md` §9（场景表 · 判据 · 回指）。依据 = `docs/core/requirements/TESTING.md` §6.1 F34 ∥ F28。

**为何判本批触及业务行为**：本批把带工具的会话在 Anthropic 通道下从「第二轮必 400」变成「能正常继续」——用户可见结果变了，不是内部形态调整。故收口行不能写「集成场景无变化」（F34：该行只在改动未触及业务行为时成立）。

**场景（设计面 · 表见 §6.28）**：G1 正常（一次工具调用后继续）· G2 边界（一轮多个工具调用后继续 · R9 ∥ R10 历史形）· G3 边界（用过工具的会话重开后继续 · 持久历史回放）。判据 = 业务可观察结果（模型给出下一段回复、无 `400 Unexpected role "tool"` ∥ 502），逐条回指 #20 ∥ IKKJEE。

**夹具**：本地脚本化假 Anthropic 端点（零外网、零付费端点），按上游语义对「请求体含 `role:"tool"`」回 400——可证伪点，请求体残留该 role 即红。
**落点**：`thincoder-cli/test/integration/anthropic-tool-roundtrip.test.mjs`（常驻档；`thincoder-cli/test/run.mjs:3` 两层 glob 收集，随发布门跑）。用例档的写入 = 实施面（eng-coder），不在设计席写面；不是批内单测档（两类永不互转）。

**受影响文件**：`docs/core/design/PROVIDER.md` 1205 → 1229（read 行号读数；+24 = §6.28）。代码面零改。

**验收**：§6.28 含场景表 + 判据 + 逐条回指；`doc_check(mode:"gate")` = PASS（1 档 · 0 命中）。

**窗口读数**：`thincoder-cli/test/` 集成集现量 0 例（实读无 `integration/` 目录）；本表 3 例为首批，50–100 上限约束不变（超窗裁减旧场景）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审对象 = `docs/core/design/PROVIDER.md` §6.27 Anthropic 消息适配层（OpenAI 形态历史 → tool_use / tool_result），对象状态 = 待评审。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Branch provenance (6b) | 🔴 | 本节新增的输入形分支无一给出场景来源（既无引用的观测，也无复现路径）：R5（`docs/core/design/PROVIDER.md:1078`「#30 教训：外部来的形状不可信」= 问题单引用，非引用读数）；R7（`:1080`「连续同 role 的容忍度因网关而异」= 泛化断言；真正的产出点 `record-results.mjs:52-85` 并行结果循环未引）；R9（`:1082`「会话恢复后历史可能以 assistant 开头」= 假设，且其所服务的上游约束本身在 `:1102` 标记 unverified）；R12（`:1085`「无对应形态」= 本节自述该输入形不存在）；R13（`:1086`「幂等护栏（续写 ∥ 重试 ∥ 二次调用同数组）」= 仓内无调用方会把已是原生块的数组喂进本函数，调用点是每请求一次的转换）。R4（`:1077`「无参调用是合法形态」）与 R6 空输出款（`:1079`）属同一案，仅差一句场景。 | 逐支或给场景或删支：R7 引 `record-results.mjs:52-85`（并行结果产 N 条连续 `role:"tool"`）；R5 给复现径（落盘的 `tool_calls[].arguments` 非合法 JSON ⇒ 重放即上游 400）；R9 / R12 / R13 若无生产者则删除。 |
| 2 | Requirements coverage | 🔴 | 规则表自称全集（`:1070`「转换规则全集」），但对「**user 角色且 `content` 为 part 数组、内含 `{type:"text"}`**」无映射行——而这是本仓主路径产出形：`thincoder-core/agent/record-results.mjs:67` 每次多模态 `read_image` 推 `content: [{ type: "text", text: parsed.text }, ...parsed.images]`（role = user）。R2（`:1075`）限定 assistant（「assistant，`content` 为字符串 ∥ 文本 part」），R10 / R11（`:1083`/`:1084`）只覆盖 `image_url`，R12（`:1085`）对未映射 part 走丢弃 ⇒ 工具文本结果在 Anthropic 通道静默消失。 | 补一行：user ∥ `content` 字符串 ⇒ 原样；user ∥ part 数组 ⇒ `{type:"text"}` 与 image part 各自成块；并加一条不变量：任何 `text` part 不得被丢弃。 |
| 3 | Clarity / Acceptance criteria | 🔴 | 返回契约在同一节内两种互斥写法：`:1068`「返回新数组」与 I5（`:1094`）「且返回数组 ≠ 入参数组」= 返回消息数组；I6（`:1095`）「R5 触发时返回告警一条」= 同一次调用还要返回告警记录，R5 又承诺机读告警 `anthropic-tool-args-malformed`。本节未点名告警进入 `chat()` 结果 `_warnings` 的投递点 ⇒ I5 与 I6 无法同时成立，且承诺的机读告警可能被静默丢弃（正是 D-PR42 所拒绝的形态）。 | 定死签名（如 `convertMessages(messages) → { messages, warnings }`），I5 改断言 `out.messages !== messages` 且深比较相等，并写明把 `warnings` 并入 transport `_warnings` 的消费点。 |
| 4 | Affected-file annotations | 🟡 | 本节无「受影响文件（现量 / Δ）」表，而它要改 `thincoder-core/provider/anthropic.mjs`（新增 `convertMessages`）与 `thincoder-core/provider/core.mjs`（`:143` 分支加 `normalizeToolPairing` 调用），并新增测试档；同档 §6.26 带该表（`:1012`「受影响文件清单（行数口径 = `wc -l`）」）。实读现量：anthropic.mjs = 240 行、core.mjs = 469 行 ⇒ 不触发拆点，但 tier 结论目前无据。 | 补该表（现量 / Δ / 动作），并写明 tier 判定（240 → ~+70、469 → +1，均在 500 软线内）。 |
| 5 | Acceptance criteria | 🟡 | `:1088`「可机检，批内单测逐条断言」只覆盖 I1–I6；R1 / R4 / R6（字符串与空输出）/ R7（合并）/ R9（前置 user）/ R10 / R11（图像映射）/ R12（丢弃）均无机检绑定，且本节无用例表 / 验收回指（§6.26 有：`:1024`」「用例表（批内档——正常 / 边界 / 错误）」、`:1040` 验收回指）。 | 补逐规则用例表（R# → 夹具 → 期望）覆盖正常（R3 / R6）、边界（R6 空输出、R7 并行、R9 首条 assistant、R10 / R11 data URL vs http URL）、错误（R5），逐条绑测试 id。 |
| 6 | Clarity | 🟡 | assistant 空 / `null` content 未定义处置：`thincoder-core/model-specs.mjs:431` 以 `content: response.content || null` 构造工具轮 assistant 消息，故 `null` 会进转换器；R2 只在字符串 ∥ 文本 part 时映射，R12（`:1085`）只丢「非 assistant」的空内容，而 I3（`:1092`）要求每条 `content` 为非空块数组。「`null` content 且无 tool_calls」的结局无陈述。 | 写明该形态（丢该消息 ∥ 保证不出空块），并使 R12 射程与 I3 一致。 |
| 7 | Closest-precedent | 🟡 | 先例段（`:1101`）称 google 的转换「`tool_calls` 与 `role:"tool"` 压平成文本」——实读不符：`google.mjs` 全文不读 `tool_calls`（grep 零命中），assistant 若 `content` 为 null 且带 `tool_calls` 则无 part、在 `google.mjs:64` 被整条丢弃。偏离结论（工具协议无仓内先例）仍成立，但建立在误述的先例上。 | 改正该款（`tool_calls` 被丢弃、`role:"tool"` 压成 user 文本 part）——偏离理由由此更强而非更弱。 |
| 8 | Existing-piece | 🟡 | `convertMessages` 之名已存在于 `thincoder-core/provider/google.mjs:41`（语义不同），本节新增同名导出却未按三问形作答（`existing:` / `none found:` / `existing but unusable:`）；先例段只是暗示「工具协议不可对齐」，未写名 / 骨架是复用还是另起。新告警码 `anthropic-tool-args-malformed` 同缺该形。 | 补三问行：住址（`google.mjs:41`）+ 逐字名 + 消费者，以及处置（名沿用但 transport 内私有 ∥ 骨架对齐 / 工具协议新定义）；告警码写出唯一发射点。 |
| 9 | Doc hygiene | 🔵 | 坐标漂移一例：`:1066`「`provider/normalize.mjs:132`」，实读 `export function normalizeToolPairing(messages)` 在 `normalize.mjs:131`。其余锚点实读精确（`core.mjs:143`、`anthropic.mjs:41-49`、`record-results.mjs:60` / `:85`、`google.mjs:41-75`）。 | 改 `:131`。 |
| 10 | Closest-precedent / evidence | 🔵 | `:1102`「按保守形态落地，标记 **unverified**」诚实，但未挂核销项（对照 §6.13 `:278`「真机验证项在册」的形），故「首条须 user」「assistant 文本置于 tool_use 之前」两条假设可随实施落地而永不被验。 | 挂一条真机验证项（不阻塞实施、阻塞核销）。 |
| 11 | Doc hygiene | 🔵 | D-PR41（`:1156`）写「分派前复用 `normalizeToolPairing`」，与本节落点（`:1064` 落在 anthropic 分支内）措辞不一；照字面读，「分派前」= 四格式同收配对修复，非本节本意。 | 统一措辞为「anthropic 分支内、转换前」。 |
| 12 | Scope | 🔵 | google 通道存在同类缺陷（`tool_calls` 被丢弃、工具消息压成 user 文本），本节在 `:1108` 以「不动另外三条通道」排除，但未登记观察项——同类缺陷不留账，日后会以「新 bug」重现。 | 在边界里登记该观察（另批），不改本批射程。 |

统计：🔴 3 · 🟡 5 · 🔵 4。质量面已具备的项：设计档在场且住拥有该主题的档（docs/core/design/PROVIDER.md，§6.8 `:147` 已指向本节，无第二份机制描述）；closest-precedent 行在场（`:1101`）；survey-evidence 行在场（`:1102`，含「区域拦 + 检索片段」与 unverified 标注）；§7 关键决策 D-PR41/42/43 在册。

VERDICT: changes-required

### 轮次 2（评审子代理）

## 第 2 轮验证（docs/core/design/PROVIDER.md §6.27 修正后）

范围：`docs/core/design/PROVIDER.md:1060-1156` 全节重读 + 上轮 12 条逐条对位；对修正引入的新坐标做了源码抽验（`record-results.mjs`、`anthropic.mjs`、`model-specs.mjs`、`core.mjs`、`run-stages.mjs`、`google.mjs`）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/PROVIDER.md | 🔴 | Fixed | 规则表新增「场景 / 依据」列（`:1079` 表头 `| # | 组 | 输入（OpenAI 形） | 输出（Messages API 形） | 场景 / 依据 |`），逐支给产出点/复现径：R6 `anthropic.mjs:167` 初值 + `:192` 推入（实读吻合）、R7 `record-results.mjs:42` 逐调 try/catch + 复现径、R9 `:52-85` 并行循环、R10 `:50` `deferredUserMsgs`、R11 `core.mjs:321-326`/`:282`、R13 `model-specs.mjs:431`。旧「已是原生块直通」幂等护栏已删，改为表外默认 + 理由（`:1095`）。 |
| 2 | 2 | docs/core/design/PROVIDER.md | 🔴 | Fixed | user 侧 part 数组成行：R2/R3（`:1082`/`:1083`）+ 不变量 I7（`:1105`）+ T-3（`:1113`）。 |
| 3 | 3 | docs/core/design/PROVIDER.md | 🔴 | Fixed | 签名定死 `convertMessages(messages) → { messages, warnings }`（`:1066`）；投递点 `:1070` 合并进 `result._warnings`；I5 `out.messages !== messages`（`:1103`）、I6 `out.warnings`（`:1104`）。元素形 `{name, message}` 与消费面实读一致（`run-stages.mjs:45` `w.name || w.pattern`、`:48` `w.message`）。 |
| 4 | 4 | docs/core/design/PROVIDER.md | 🟡 | Fixed | 受影响文件表到场（`:1128-1136`）+ tier 判定「240 → ≈325、469 → ≈471，均在 500 行软线内，不触发拆分」。 |
| 5 | 5 | docs/core/design/PROVIDER.md | 🟡 | Fixed | 用例表 T-1–T-16（`:1107-1126`）覆盖 R1–R13 ∥ I1–I6 ∥ 告警投递；逐规则绑测试行。 |
| 6 | 6 | docs/core/design/PROVIDER.md | 🟡 | Fixed | R13 扩为「任何 role；含 `content` 为 `null` ∥ 空串且无 `tool_calls` 的 assistant」（`:1093`）；I1 空结果条款（`:1099`）；T-13（`:1123`）。 |
| 7 | 7 | docs/core/design/PROVIDER.md | 🟡 | Fixed | 先例改正（`:1145`）：实读 `google.mjs:47` role 映射、`:50-62` 只搬 text/`image_url`、`:64` 零 part 整条丢弃、全文零读 `tool_calls`——改正后逐款吻合。 |
| 8 | 8 | docs/core/design/PROVIDER.md | 🟡 | Fixed | 三问行（`:1142`）`existing: thincoder-core/provider/google.mjs:41 · name: "convertMessages" · consumers: google.mjs:81`（实读 `:81` 即 `chat()` 内唯一调用点）；处置 `:1143`；告警码唯一发射点 `:1071`。 |
| 9 | 9 | docs/core/design/PROVIDER.md | 🔵 | Fixed | 坐标改 `provider/normalize.mjs:131`（`:1073`）。 |
| 10 | 10 | docs/core/design/PROVIDER.md | 🔵 | Fixed | 真机验证项在册（`:1147`），两条 unverified 约束各绑回验用例（T-12 ∥ T-5）。 |
| 11 | 11 | docs/core/design/PROVIDER.md | 🔵 | Fixed | D-PR41 改「anthropic 分支内、转换前」（`:1202`），与 `:1064` 落点一致。 |
| 12 | 12 | docs/core/design/PROVIDER.md | 🔵 | Fixed | google 通道同族缺陷登记为观察项 · 另批（`:1156`）。 |
| 13 | (new) | docs/core/design/PROVIDER.md | 🔵 | New | R12 的 http(s) 分支无仓内产出点、无用例行；T-3 只覆盖 data URL。原文 `:1092`：`http(s) ⇒ `{type:"image", source:{type:"url", url}}`` —— 非阻塞，标 forward-compat 或补一行即可。 |

统计：🔴 0 · 🟡 0 · 🔵 1（New，非阻塞）。上轮 12 条全部 Fixed。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-24 会话内授权「自动跑」（不逐批人工放行），本批设计经评审通过后按该授权进入实施。设计评审链：轮 1 → 轮 2 通过（记录见 §3）。

**未走人工逐条批准的原因**：用户明确要求本会话自动推进；如有语义级变更（改变已批准设计的边界），仍会上抛待裁。

## §5 实施记录（eng-coder）

**状态行**：实施完成

**实施摘要**：在 Anthropic transport 内新增纯函数 `convertMessages(messages) → { messages, warnings }`（规则 R1–R13 ∥ 不变量 I1–I7）。
`chat()` 在 system 抽离之后、请求体组装之前调用它，并把 R7 告警并入 `result._warnings`；
`core.mjs` 的 anthropic 分支在调用 `chat()` 前跑 `normalizeToolPairing(messages)`（复用既有函数，`normalize.mjs` 零改）。
历史本体零写（copy-on-write）：入参 `JSON.stringify` 前后相等，返回数组 ≠ 入参数组。

**改动文件（行数口径 = read 行号）**

| 文件 | 改前 | 改后 | 改动 |
|---|---|---|---|
| `thincoder-core/provider/anthropic.mjs` | 240 | 363 | 新增 `convertMessages` + 私有助手（参数解析 ∥ 图像块 ∥ tool_result 成形 ∥ 合并排序）；`chat()` 接转换与告警投递 |
| `thincoder-core/provider/core.mjs` | 469 | 471 | anthropic 分支 +2 行（注释 + `messages = normalizeToolPairing(messages)`） |
| `thincoder-core/test/anthropic-message-adapt.test.mjs` | 0 | 229 | 批内单测 T-1–T-16（closeout 删除） |

非 Anthropic 三径零触（AC-5）：`provider/google.mjs` ∥ `provider/responses.mjs` ∥ `provider/normalize.mjs` 无 diff。

**验收读数**

- `node --check` 三档：`anthropic.mjs` / `core.mjs` / `test/anthropic-message-adapt.test.mjs` 全 `Syntax OK`。
- `node --test test/anthropic-message-adapt.test.mjs`：tests 16 · pass 16 · fail 0。
- `node test/run.mjs`：tests 49 · pass 49 · fail 0（批前基线 33 ⇒ 既有 anthropic 路径零回归）。
- `git diff --stat`：`core.mjs` 仅 anthropic 分支 +2；`google.mjs` / `responses.mjs` / `normalize.mjs` 零 diff。

**偏离项**：无功能偏离。两点说明：
① `anthropic.mjs` 实增 123 行（设计档受影响文件表记 +85 ≈ 325，实读 363）——tier 结论不变（< 500 软线），行数读数漂移随交付报父侧归设计席；
② 设计档写「在 `finishAnthropic(result)` 之后合并 `result._warnings`」，实现落在其返回的新对象上（`const finished = finishAnthropic(result)` 后再合并）——照字面写回入参反而会丢告警，语义与设计一致。

**自审（explore 只读审计）**：R1–R13 ∥ I1–I7 全 PASS · T-1–T-16 全在场 · 清单外改动 0。
发现两条设计席文档漂移（功能面 clean）：`docs/core/design/API-CONTRACT.md` 生成区未再生（新导出缺席、`chat` 坐标仍 :39）；`docs/core/design/PROVIDER.md` 本节坐标与行数读数失真。两条均不在本笔可改面，上报父侧。

**独立代码评审（advisor · type=code）**：VERDICT pass——🔴 0 · 🟡 3（均 optional，非 must-fix）· 🔵 5。逐条处置：

| # | 级别 | 项 | 处置 |
|---|---|---|---|
| 1 | 🟡 | `docs/core/design/API-CONTRACT.md` 生成区未再生 | 父侧/设计席再生（非本笔） |
| 2 | 🟡 | 非可迭代 `tool_calls` 无守卫 | 不改：全仓契约 = 数组（`normalize.mjs:142`/`:149` 同判），无生产者；「无场景分支不立」 |
| 3 | 🟡 | closeout 删测试档后的常驻覆盖 | closeout 决策项：保留精简常驻版 ∥ 记显式技术债，上报父侧 |
| 4 | 🔵 | 设计档本节坐标漂移（system 抽离指向 :41-49，实为 :157-166） | 上报设计席 |
| 5 | 🔵 | 设计档受影响文件表行数读数（+85/+160 vs 实读 363/229） | 上报设计席 |
| 6 | 🔵 | R7 告警在 run-stages 面以「stream rule warnings」标题渲染 | 共享消费面文案，超出本批文件清单；上报 |
| 7 | 🔵 | 非严格 `;base64,` 的 data URL 落 url source 的理论径 | 仓内无生产者；记交付报告待另批 |
| 8 | 🔵 | `tool_result.content` 非字符串透传的 I4 窄口 | 仓内无生产者；记交付报告待另批 |

**修正轮次**：0（审计与评审均无 must-fix 项）。**终态**：clean（实现面）；两条设计席文档漂移作为上报项交父侧路由。

**告警投递实读**：元素 `{ name, message }` 与消费面 `agent/run-stages.mjs:45`（`w.name || w.pattern`）∥ `:48`（`${w.name}: ${w.message}`）形状吻合；T-16 用真 `injectResponseReminders` 断言机读线收到该条。

**doc_check**：本会话 gate 判 ERROR（引擎档 mtime 晚于进程启动——与 §2 上抛项同一因，需重启会话后复跑）。
report 态旧引擎读数：行宽 0 命中；锚 17 命中，全部位于 §3 的不带目录段档名引用（行 91–132），非本笔可改面——交父侧路由（补全路径即可解析）。

**本笔交付**：设计档 §6.28 的 G1–G3 三条集成用例落成常驻档（F34 的常驻验收面——批内单测档收口即删，本档留下）。

**改动文件（行数口径 = `read` 行号）**

| 文件 | 改前 | 改后 | 改动 |
|---|---|---|---|
| `thincoder-cli/test/integration/anthropic-tool-roundtrip.test.mjs`（新档） | 0 | 365（`wc -l` = 364） | G1–G3 三例 + 假 Anthropic 端点 + ACP 客户端驱动器 |
| `thincoder-cli/test/integration/`（目录） | 不存在 | — | 新建（`test/run.mjs` 两层 glob 的集成层落点） |

`thincoder-core/provider/*` 零改；批内单测档（`thincoder-core/test/anthropic-message-adapt.test.mjs`）未触碰（按 closeout 删除）。

**用例与判据（G1–G3）**

| # | 场景 | 业务入口 | 判据（机检） |
|---|---|---|---|
| G1 | 一次工具调用后继续（正常） | `node bin/thincoder.mjs acp` 子进程：`session/new` → `session/prompt`（模型回 `read note.txt`） | 会话流 1 个 `tool_call`（`read` ∥ `path: note.txt`）+ 1 个 `tool_call_update completed`（内容含 PINEAPPLE-42）；回复含该内容；假端点零 400 |
| G2 | 一轮 ≥2 个工具调用后继续（边界） | 同上，首回合回两个 `tool_use` 块（note-a ∥ note-b） | 会话流 2 个 `tool_call` + 2 个 completed；回复同时含 ALPHA-1 ∥ BETA-2；零 400 |
| G3 | 关进程重开同一会话后继续（边界） | 第一程跑完关进程；第二程 `initialize` → `session/load`（同槽号，历史从盘回放）→ `session/prompt` | 第二程回复含上一程工具结果（PINEAPPLE-42）+ 本程新问题；零 400 |

**夹具**：本地脚本化假 Anthropic 端点（`node:http`，零外网、零付费端点）。按 Messages API 回 SSE 两态（tool_use 回合 ∥ 文本回合）；文本由本进程实际收到的 `tool_result` 拼成——「模型看见过工具结果」「历史是否回放」直接落在回复文本里，断言不必窥探内部形态。拒收规则 = 上游语义：`messages[].role` 只收 user / assistant，出现其它 role（含 `role:"tool"`）回 `400 Unexpected role "<role>"`——可证伪点。

**验收读数**

- `node --check test/integration/anthropic-tool-roundtrip.test.mjs` = OK。
- 新档单跑：tests 3 · pass 3 · fail 0（≈4.0s）。
- `cd thincoder-cli && node test/run.mjs`：tests 32 · pass 32 · fail 0（批前 29 ⇒ 本档 3 例被两层 glob 收集；既有 `session-observability` 零回归）。
- **先红（旧实现）**：`git checkout HEAD -- thincoder-core/provider/anthropic.mjs`（HEAD = 批前版本，`convertMessages` 零命中）后单跑 = tests 3 · pass 0 · fail 3，三例均以 `Anthropic API error 400: ... Unexpected role "tool"` 失败（= 生产症状）。
- **后绿**：还原后（`git diff --stat` 与还原前逐字相同：127 insertions / 4 deletions）复跑 = 3/3 绿。

**关键实施决定**

- **业务入口选 ACP（`thincoder acp`），不选 `chat`**：`chat` 是一次性 `runAgent`、不落会话，满足不了 G3「关进程重开同一会话（历史从盘上回放）」；TUI 需真 TTY 且入口自带父包装 spawn。ACP 是本仓 CLI 唯一同时给出「会话流」「多轮」「槽位持久化 + `session/load` 回放」三项的用户入口，且 NDJSON 可确定性驱动；三条判据逐条落在 §6.28 的规定面上。
- **本层只断言业务结果**：块结构 ∥ 告警计数不在此层重复（§6.27 T-1–T-16 归属单元层）；本层只断言会话流、回复文本、上游零拒收。
- **不发权限请求**：`read` 是只读工具（`thincoder-core/tools/file.mjs:76` `readonly: true`），dispatch 免审批——夹具无需模拟审批窗；驱动器仍对反向 RPC 应答（真实客户端行为），正常零到达。

**偏离项**：无功能偏离。入口选择（ACP）见上条——设计未钉子命令，判据逐条满足。

**上抛项（父侧路由）**

1. 设计档 §6.28 两处读数随本笔过时：① `:1180`「窗口读数 = … 无 `integration/` 目录 ⇒ 集成集 0 例」——现为 3 例；② `:1175` 的 `run.mjs:3` 指注释行（真正的两层 glob 在 `run.mjs:50`）。两条均在设计席写面，本笔未改。
2. `doc_check` 报告态对本批档判 3 条锚·档缺，全在 §2 `:102`：三条相对 `docs/core/design/` 的裸档名（PROVIDER ∥ TIMEOUT-DIGEST ∥ SESSION-OBSERVABILITY，其 §6.28 ∥ §9 节引用）从批档目录解析不到。§2 非本笔写面，未改，请父侧路由。
   本笔 §5 初稿把这三条裸档名原样引用，自身也造出同形锚（6 条里的另外 3 条）——已就地改写，本笔自伤自修，零遗留。
   gate 态本会话判 `ERROR`（引擎档 mtime 晚于进程启动，须重启会话后复跑）——非内容命中。

**自审（explore 只读审计）**：AUDIT clean —— 13 项逐条 PASS（三例在场 ∥ 判据对位 ∥ 夹具零外网 ∥ role 守卫 ∥ 只断言业务面 ∥ 落点与收集 ∥ 清单外改动 = 0）。读数：修正轮次 0。

**独立代码评审（advisor · `type=code`）**：VERDICT pass —— 🔴 0 · 🟡 2（均 optional，非 must-fix）· 🔵 4 · 报告项 2。逐条处置（5 条就地修入，3 条留报告）：

| # | 级别 | 项 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 假端点只按「历史里有无 `tool_use`」决定回合，无回合上限——转换层若退化成「角色合法但 `tool_use` 没了」，失败表现为 90–150s 超时而非可读断言 | 已修：改为**首个模型请求**派工具（`requests.length === 1`），之后一律文本；退化路径当场以「回复里没有工具结果」可读失败 |
| 2 | 🟡 | 「无 400」断言只证 role 类 400，文案覆盖面过宽 | 已修：三处文案收窄为「上游无 role 类 400（本档证伪点）」；结构类 400 的加固（`tool_use`/`tool_result` 配对检查）未加——§6.28 只把 role 约束定为证伪点，加了属超设计 |
| 3 | 🔵 | 子进程 stdin 无 `error` 监听——CLI 中途死掉时写 pipe 会抛 unhandled EPIPE，崩整档 | 已修：`child.stdin.on("error", () => {})`，死进程走既有 `exited` 可读报错 |
| 4 | 🔵 | 时间预算自相矛盾：场景上限 180s < G3 两回合 × 回合上限 150s ⇒ 卡死时报裸测试超时 | 已修：场景上限 240s ∥ 回合上限 90s（本地假端点，无需长窗） |
| 5 | 🔵 | 关进程无升级路径——CLI 若被在飞回合拖住，清理会挂死 | 已修：SIGTERM 后 5s 强杀（`SIGKILL`） |
| 6 | 🔵 | 夹具写文件未建父目录（将来带子目录的夹具会 ENOENT） | 已修：`mkdirSync(dirname(...), {recursive:true})` |
| 7 | 🟡 | 设计档 §6.28 窗口读数「集成集 0 例」已过时 | 报告：设计席写面，见上抛项 1 |
| 8 | 🔵 | 设计档 §6.28 的 `run.mjs:3` 指注释行（可执行 glob 在 `:50`） | 报告：设计席写面，见上抛项 1 |

**修正轮次**：1（评审 optional 项 5 条就地修入；修后复跑 3/3 绿，先红读数同步重取——仍 3/3 红）。**终态**：clean。

## §6 验证与收口（父代理）

## 验证与收口

**父侧独立复核（不采信子代理报告，逐条实跑）**

| 项 | 读数 |
|---|---|
| core 全量（收口后） | **33 pass / 0 fail**（删批内单测档前 57） |
| cli 全量（收口后） | **15 pass / 0 fail**（全部为集成用例） |
| 集成用例 | `thincoder-cli/test/integration/anthropic-tool-roundtrip.test.mjs` · 3 例 · **先红后绿可复现**（退回批前实现 3/3 红，失败原因 = `Anthropic API error 400: … Unexpected role "tool"`；还原后 3/3 绿） |

**批内单测档处置**：`thincoder-core/test/anthropic-message-adapt.test.mjs`（16 例）已按测试纪律**删除**（用毕即删、零留存）。删前读数：通过。本批行为回归由常驻集成用例 G1–G3 承接。

**集成集现状**：本仓 `thincoder-cli/test/integration/` 5 档 15 例（本批 3 例为首批之一）；窗口 50–100 为上限。

**设计档同步**：`docs\core\design\PROVIDER.md` §6.28 新增「集成测试设计」段（G1–G3 场景表 + 判据 + 回指）；§6.27 规则面按实现收正。

**未决项**：无。台账 `#1756`（同一场景）在本批集成用例落地后核销。
