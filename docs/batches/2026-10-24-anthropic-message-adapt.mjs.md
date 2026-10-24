# 2026-10-24 · Anthropic 通道补齐消息适配层：OpenAI 形态历史 → tool_use / tool_result
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = GitHub #20 / Gitee IKKJEE（同一根因）：Anthropic 原生通道原样透传 OpenAI 形态会话历史，带工具调用的多轮对话必然被上游 400 拒收（`Unexpected role "tool"`）。用户 2026-10-24 17:30「开批」。。
> 台账 = #1747（PROVIDER · 归批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
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

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审对象 = `PROVIDER.md` §6.27 Anthropic 消息适配层（OpenAI 形态历史 → tool_use / tool_result），对象状态 = 待评审。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Branch provenance (6b) | 🔴 | 本节新增的输入形分支无一给出场景来源（既无引用的观测，也无复现路径）：R5（`PROVIDER.md:1078`「#30 教训：外部来的形状不可信」= 问题单引用，非引用读数）；R7（`:1080`「连续同 role 的容忍度因网关而异」= 泛化断言；真正的产出点 `record-results.mjs:52-85` 并行结果循环未引）；R9（`:1082`「会话恢复后历史可能以 assistant 开头」= 假设，且其所服务的上游约束本身在 `:1102` 标记 unverified）；R12（`:1085`「无对应形态」= 本节自述该输入形不存在）；R13（`:1086`「幂等护栏（续写 ∥ 重试 ∥ 二次调用同数组）」= 仓内无调用方会把已是原生块的数组喂进本函数，调用点是每请求一次的转换）。R4（`:1077`「无参调用是合法形态」）与 R6 空输出款（`:1079`）属同一案，仅差一句场景。 | 逐支或给场景或删支：R7 引 `record-results.mjs:52-85`（并行结果产 N 条连续 `role:"tool"`）；R5 给复现径（落盘的 `tool_calls[].arguments` 非合法 JSON ⇒ 重放即上游 400）；R9 / R12 / R13 若无生产者则删除。 |
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

统计：🔴 3 · 🟡 5 · 🔵 4。质量面已具备的项：设计档在场且住拥有该主题的档（PROVIDER.md，§6.8 `:147` 已指向本节，无第二份机制描述）；closest-precedent 行在场（`:1101`）；survey-evidence 行在场（`:1102`，含「区域拦 + 检索片段」与 unverified 标注）；§7 关键决策 D-PR41/42/43 在册。

VERDICT: changes-required

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
