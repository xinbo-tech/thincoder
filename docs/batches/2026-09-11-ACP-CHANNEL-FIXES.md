# ACP 通道修整（question 工具剔除 + relay 前缀收敛）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 主 agent · §2 eng-designer · §3 评审子代理 · §4 主 agent · §5 eng-coder · §6 父代理。
> 编制：主 agent · 2026-09-11 15:10 · 来源 = 用户 13:36「那几条你的建议都可以」（Gitee #IKEV9I + #IKEV9H——评估 id=48 逐条核实）。

---

## §1 讨论（主 agent 记）

### 本批条目（2 条）

| # | 条目 | 内容（评估结论） |
|---|---|---|
| **A1** | **#IKEV9I：question 工具在 ACP 必抛** | 成立（三句全中）。**裁定 = 方案 a**：ACP 侧从工具集**剔除 question**（headless 过滤点勘察定）+ `question.md` 假承诺修正 + ACP 文档「能力缺口」节。方案 b（真接通 elicitation）= 本仓明确裁剪，不做。 |
| **A2** | **#IKEV9H：子代理 relay 前缀泄漏进 ACP** | 成立（校验面比 issue 更宽：`onReasoning` 零剥离、`onToolCall` 名字带前缀、ACP **无 `onToolOutput`**）。**修法**：relay 前缀文法从 TUI 抽到非 TUI 模块（`spawn-child.mjs` 导出），bridge 复用剥离；两套平行 parser 收敛为一套；`onToolOutput` 面补齐或明示缺；文档行 + 断言。 |

### 已核事实（id=48 侦察——免重复）

- A1：`src/tools/question.mjs:20` 无 `ctx.onQuestion` 即 throw；TUI 接 `src/tui/tool-events.mjs:329`；`src/agent/dispatch.mjs:385` 原样转发；ACP `src/acp/bridge.mjs:168-285` buildAcpCallbacks **无 onQuestion**（全仓 grep 命中仅 question.mjs/dispatch.mjs/tui）；工具默认注册 `src/tools/index.mjs:22`；ACP 走同一 `assembleAgent`（`src/acp.mjs:78-81`）。漂移：`src/tools/question.md:1,8-10` 假承诺；`docs/design/ACP-CLIENT.md:113` 回调映射无 question 行；`docs/requirements/ACP-CLIENT.md:30-39` 无该工具不可用声明。
- A2：生成侧 `src/agent/spawn-child.mjs:126-143`（onToken :130 / onReasoning :133 / onToolCall :136 / onToolOutput :139，嵌套递归）；TUI 剥离 `src/tui/subagent-blocks.mjs:32` SUB_PREFIX_RE + `:46-59` parseRelayPath、路由 `src/tui/tool-events.mjs:68/76/84/286`；ACP 侧 `src/acp/bridge.mjs:169-181` 仅剥 `[model]`/`⟦ev⟧`（不放行正文）、`onReasoning:183` 零剥离、`onToolCall:188-209`（`inferToolKind:27` 取 `/` 尾段）；`docs/design/ACP-CLIENT.md:113` 漂移。

### 待设计裁定
1. A1 剔除点（make-agent 工具装配 + acp 传入标志 vs bridge 过滤——勘察定）与 `question.md` 修正措辞；ACP 文档「能力缺口」节归属档；
2. A2 文法模块抽出形态（**预授权新档 1 件**——名由 designer 定）+ bridge 三消费点逐点落法 + `onToolOutput` 补齐/明示缺的择一；
3. 受影响文件全清单（行数/增量）+ 用例/AC（逐条回指 A1/A2）+ 双端纪律核对（VSC 侧 ACP 有无镜像面——勘察）；
4. 与既有纪律冲突核对。

### 范围边界（明确不做）
- 不改 ACP 协议面（elicitation/`session/request_permission` 复用均不做）；不改 TUI 消费面语义（抽文法 = 零语义）；不改 `dispatch` 转发面；**除预授权新档外不得另建**（必须 → 停下打回）。

### 状态
**已收口 2026-09-11**（用户批准）。下一步 = 设计（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）


**状态：任务书就绪**（2026-09-11——需求层 + 设计/测试层已落档：需求 `docs/requirements/ACP-CLIENT.md` §13 · 设计+测试 `docs/design/ACP-CLIENT.md` §12；**待设计评审 + 用户批准后由 eng-coder 实施**（设计 token 门））。实施者 = eng-coder——本 §2 = 其任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/ACP-CLIENT.md` §13（R-A1.1–A1.3 · R-A2.1–A2.4）· 设计+测试 = `docs/design/ACP-CLIENT.md` §12（§12.1–§12.10）。

### 本批条目（2——三方条目一致：本 §2 = 设计 §12.8 AC 回指 = 需求 §13）

| # | 条目 | 需求 | 设计 / AC |
|---|---|---|---|
| A1 | question 工具 ACP 装配期剔除 + `question.md` 措辞修正 | R-A1.1–A1.3 | §12.2① / §12.3⑤ / AC1–AC2 |
| A2 | relay 前缀零进 ACP 流（显示面剥离 + 文法单一权威 + onToolOutput 明示缺） | R-A2.1–A2.4 | §12.2②③ / §12.3①②③ / AC3–AC6 |

### 实施要点（设计 §12 为权威——此处只列任务书面）

1. 新增 `src/agent/relay-prefix.mjs`（文法单一权威——**预授权新档即此件**；接口 = §12.3①：`RELAY_PREFIX_RE` / `parseRelayPath` / `relayPrefixOf`；零依赖）。
2. TUI 侧零语义搬迁（`subagent-blocks.mjs` 删本地定义改 import；`tool-events.mjs` 换名——§12.3②）。
3. bridge 显示面剥离——逐点落法 = §12.3③ 表（5 落点：onToken / onReasoning / onToolCall / onPermissionRequest / replayHistory 防御面）；**配对键保持原样名**（不动 `toolQueue`/`peekToolId` 的键）。
4. `src/tools/question.md` 措辞逐字插入（§12.3④——显式"无交互面返回错误"句）。
5. A1 装配链：`applyToolExclusions`（纯函数）+ `assembleAgent({ excludeTools })` + `ACP_EXCLUDED_TOOLS`（§12.3⑤）。
6. 新增断言档 `test/acp-channel.test.mjs`（用例 T1–T17 = §12.7；**声明的第 2 件新增**——断言宿主，见 §12.9 边界注）。

**勘察新增（相对 §1 三落点）**：第 4 落点 = `onPermissionRequest`（子代理权限请求名带 owner key `${key}/${tool}`——证据 `src/agent-tools/subagent-spawn.mjs:312-317` + `src/acp/bridge.mjs:224-247`）——同缺陷类、同模块、同批落法（§12.3③ 表行 4）。

**禁改面（明确不做）**：ACP 协议面（elicitation / 新通知面）· TUI 消费面语义（`routeSub*` 调用点）· `dispatch.mjs` 转发面 · `question.mjs` 本体 · VSC 仓 · 除 `src/agent/relay-prefix.mjs` 与 `test/acp-channel.test.mjs` 外不新建文件（撞上 → 停下报告，不自行扩建）。

**受影响文件全清单**：见设计 §12.5（含当前行数 / 增量 / 超档拆分计划——11 行含 2 件新增）。

### 验收标准（机器可验）

- 逐条 = 设计 §12.8 AC1–AC8；AC8 = `npm test` 快层全绿（含新档全部用例；slow 门零拦截）。
- 交付报告须含：① 逐需求透明表（R-A1.x / R-A2.x → file:line 证据）② 实测行数表（对照 §12.5 预计值，超档位须说明）③ 测试实测（命令 + 通过数 + 新增用例逐条点名）④ 偏差披露（设计 vs 实现差异——零静默）⑤ §5 写入自证。

### 待父侧排程 / 未确认面

1. **文档联动（写域边界外——本设计已给最小改动面）**：`docs/design/TUI.md` §1 模块表 1 行 · `docs/design/AGENT-LOOP.md` §1 模块地图 ±2 行 · `docs/requirements/AGENT-LOOP.md` §1 +1 行。
2. **登记项（设计 §12.9——待父侧裁）**：① `thincoder chat` 同缺陷（`bin/thincoder.mjs:140` 未传剔除——同款一行修复）② 子代理 children 的工具剔除（`subagent-spawn.mjs:447-450` 无 `onQuestion`）③ kimi 式「子代理事件整体过滤」（需用户裁定）④ onToolOutput 流式补齐（后续批）。
3. **需求池登记（记录 = 主 agent）**：本批未随任务带入 todo 项——`docs/TODO.md` 需求池缺本批条目（建议一行指针：需求 §13 + 本批 §2 + `status=在途`；eng-designer 未自行登记）。
4. **批次档 §1 宽度债**：§1 :19 / :20 两行 >300 字符（`check-doc-width` 报）——一段一作者，请主 agent 就地折行。

### 修正轮（评审轮次 1 后——2026-09-11）

> 背景：轮次 1（§3）VERDICT = changes-required（🔴1 · 🟡3 · 🔵4 = 8 条）；父侧裁决 = 全部采纳。本轮 = 修正轮——**只改文档、不碰实现**（`src/**` 零触碰；未 commit、未发起评审）。
> 本段 = §2 面同步（append——与上文冲突处（「用例 T1–T17」计数、「11 行含 2 件新增」清单计数）以本段为准）。

**逐条落点**（以 §3 轮次 1 表为准）：

| # | 级别 | 处法 / 落点 |
|---|---|---|
| 1 | 🔴 | AC3 扫描锚重定：弃正则字面量，改「模块直读」形态——自 `RELAY_PREFIX_RE` 去 `^` 锚派生**非锚定**扫描（行首+串中零命中——覆盖 permission 文本的串中泄漏位）；AC 与 §12.3① 互校（`^([\w-]+)#(\d+)\/` = 正文唯一正则源；`parseRelayPath` 语义由 T16 独立锁定）→ 设计 §12.8 AC3。 |
| 2 | 🟡 | AC6 指位对齐——二择一取②（不动需求 §13.2 R-A2.4 指位；按「裁剪权威＝需求 §12」补登记）：需求 §12「不做项」表新增 `onToolOutput` 明示缺行——设计 §12.6 权威声明因此成立；AC6 改两档 grep（`onToolOutput` 两档均命中）→ 设计 §12.8 AC6。 |
| 3 | 🟡 | replay 缺口：补 **T18**（`replayHistory` 直驱——带前缀 → 剥离 / 无前缀 → 零变化；已核 = bridge 导出 `src/acp/bridge.mjs:299`，可直测）；设计 §12.7 表 1 头加「+ `replayHistory` 直驱」、表末增 T18 行；§12.3③ 表行 5 注 T18。 |
| 4 | 🟡 | 新档计数对账——**父侧认定行**：`test/acp-channel.test.mjs` = 需求 §13.3 明示「新增断言档」（本批新档数 = 2：`src/agent/relay-prefix.mjs` 预授权 + 断言宿主）；免后续审计按 §1 字面判超额。 |
| 5 | 🔵 | §2 上文遗留的模板占位行（原 :38）已由本节作者清理（同 SUBAGENT-TAIL / REVIEW-CHAIN-GUARDS 先例；D6 回读核实）。 |
| 6 | 🔵 | 行号互异以设计为准——本轮复核：`SUB_PREFIX_RE` = `src/tui/subagent-blocks.mjs:32`、`parseRelayPath` = `:51-67`（与源一致）；§1 :20 旧快照不回改；后续引用以符号名为主锚。 |
| 7 | 🔵 | 锚形态口径已留——设计 §12.10 新增行（file:line = 勘察快照锚 as-of 2026-09-11；实施后维护以符号名为主锚）。 |
| 8 | 🔵 | VSC 零面声明补硬证据（本轮现场）：`thincoder-vscode` 全仓 grep `acp` 仅文档/注释命中、无 `src/acp/`；`thincoder-vscode/src/tools/question.mjs:43-68` 实读 = panel 回调 + QuickPick/InputBox 兜底——与设计 §12.10 一致。 |

**自检修正（非评审条目——现场复核发现，如实披露）**：

- **`async 取号分支 :440` 归属更正**：实况 = `src/agent-tools/subagent-spawn.mjs:440`（`if (wantAsync)` 分支；`spawn-child.mjs` 全文 224 行、仅 `makeRelay:74` 一处构造）。
  修正：设计 §12.3① 补文件归属；§12.5 增 1 行改档（新第 3 行）并顺延编号——**新档数不变（2 件）**、受影响文件 11 → 12 行。
  注：`escalate-async.mjs:152` / `advisor-async.mjs:269` 亦为字面构造——不在本批「两处」声明面（消费面同剥、无功能缺口）——未动；如父侧认为需收敛 → 另批。
- **T 用例计数更新**：设计 §12.7 = **T1–T18**（上文「T1–T17」以本段为准）；§12.5 测试档预计 ~160 → ~170。
- **头部死指针清理（同批漂移扫尾）**：设计档 :3/:4 尚引已删的 `test/acp.test.mjs`（本轮现场复核发现）——改为 `test/acp-channel.test.mjs` + §8 指针；零语义（死指针 → 活指针）。

**核验**：全部落点已逐处重读核实（D6）；`check-doc-width`：本批改动行新增超宽 **0**（ACP 档残余 :19/:20 = §1 存量已知债，见上文「待父侧」节；表格行豁免行不计）；一致性新增 **0**（报出的 4 条新增均在别批档——PORTABILITY / TUI-SELECTION，非本批）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

第 27 批（ACP 通道修整）轮次 1——对象：批 §2（含 §1/§3 边界）· 设计 `docs/design/ACP-CLIENT.md` §12.1–§12.10 · 需求 `docs/requirements/ACP-CLIENT.md` §12+§13（按评审对象声明只读节段；源码面 file:line 断言为本域外，未独立复核＝设计自述）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收标准 | 🔴 | **AC3（设计 :434）机验正则写坏**：`/\[\w-\]+#\d+\//` 把 `[`/`]` 转义成字面量，只能匹配「`[`＋字符＋`-`＋`]`…」形态，**无法命中 `role#id/` 前缀**（对照同档 :279 未转义同款写法；该转义形态全文仅此一处）——按字面实现则聚合扫描恒零命中、恒通过：R-A2.1（前缀零进流）的验收门形同虚设（逐条 T 用例的精确断言仍可兜列举载荷，扫描面失效）。 | 修正转义、与 §12.3①（:313）同形；或直接以 `relay-prefix.mjs` 的 `RELAY_PREFIX_RE`/`parseRelayPath` 作扫描锚（单一权威、与 R-A2.3 同向）。AC 与 §12.3① 正则互校后再交 eng-coder。 |
| 2 | 验收标准 | 🟡 | **AC6（:437）指位与实况不符**：要求核「需求档 §12 行」含 onToolOutput 明示缺——需求侧该条款实际在 §13.2 R-A2.4（需求 :73）；需求 §12「不做项」表（:30-40）无 onToolOutput 行（§12.5 行 10 的「§12 行」＝ question 行，属 A1）。按节范围机验会误判；全文 grep 才过。 | 二择一对齐：① AC6 改指「需求 §13.2 R-A2.4 + 设计 §12.6」；或 ② 按设计 §12.6「裁剪权威＝需求 §12」补一行裁剪登记后保留原措辞。勿两可并存。 |
| 3 | 用例覆盖 | 🟡 | **5 落点之 replayHistory（设计 :337）零用例**——§12.7 表 1（T1–T13）未驱动 replayHistory；该落点改重放 title 取值，其「无前缀历史输出零变化」为回归敏感面，无断言锁定（AC7 只锁 TUI 用例档）。 | 补 1 条合成用例（无前缀 → 零变化；带前缀 → 剥离），或明示「历史按构造不含前缀」的不测理由并落档。 |
| 4 | 范围协调 | 🟡 | **新档计数对账（R5 协调项，非缺陷）**：批 §1（:24 预授权 1 件；:29「除预授权新档外不得另建」）vs 设计实含 2 件新增（`src/agent/relay-prefix.mjs`＋`test/acp-channel.test.mjs` :449）。设计已透明声明（§2 要点 6／§12.9），需求 §13.3 明示「新增断言档」，旧 `test/acp.test.mjs` 已删（设计 :207）→ 判定可接受。 | 父侧于 §4/§6 留一句认定（断言宿主＝需求明示第 2 件新档），免后续审计按 §1 字面判超额。 |
| 5 | 文档卫生 | 🔵 | 批 §2 :38 遗留模板占位「_（待写——eng-designer）_」与 :40「状态：任务书就绪」并存（append-only 未消）。 | 父侧知悉即可；后续填段顺手消占位。 |
| 6 | 文档一致性 | 🔵 | `parseRelayPath` 行号互异：批 §1:20 记 `:46-59`，设计 :278/:325 记 `:51-67`（同标 as-of 2026-09-11；设计＝现场复核）。 | 以设计行号为准（§1 冻结不必回改）；后续引用以符号名为主锚。 |
| 7 | 规范张力 | 🔵 | §12 大面积以 `file:line` 为主锚（§12.1、§12.3③ 表等），与 AGENTS.md「引用用符号、不用行号」约定存在张力；本批实施即改动所引文件（行号即刻腐化）。现以 as-of 标注＋符号并列缓解。 | 非阻断建议：后续维护以符号锚为主；若父侧认勘察快照形态可豁免，留一句口径。 |
| 8 | 双端纪律 | 🔵 | VSC 零面声明（设计 :464-466：无 `src/acp`＋question 原生 UI 兜底）系跨仓勘察自述，本域不可独立复核；与需求 R-A1.3（:61-62）一致、无冲突。 | 按声明接受；如需硬证据，父侧于 §5/§6 附 VSC 仓 grep 输出一行。 |

**计数**：🔴×1 / 🟡×3 / 🔵×4（共 8 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

对象：第 27 批（ACP 通道修整）§3 轮次 1 的 8 条处置 + 修正轮 3 条自检修正——只读锚点 ±10 逐点回读：**11/11 全部已落，0 发现**。

| # | Orig# | File | Severity | Status | Notes（引本轮回读行） |
|---|-------|------|----------|--------|------|
| 1 | R1-#1 | `docs/design/ACP-CLIENT.md:436` | 🔴 | Fixed | AC3 弃正则字面→模块直读派生：`扫描锚自模块 RELAY_PREFIX_RE 去 ^ 锚派生——单源 §12.3①，不复制正则字面量`；§12.3①:313 单源未动；旧转义字面量 `\[\w-\]+` 全文 0 命中（literal grep）。 |
| 2 | R1-#2 | `docs/requirements/ACP-CLIENT.md:37` + `docs/design/ACP-CLIENT.md:439` | 🟡 | Fixed | 需求 §12 新增行：`本批明示缺（裁剪）——见 docs/requirements/ACP-CLIENT.md §13.2 R-A2.4 / 设计 §12.6`；AC6 改两档 grep：`grep 子串 onToolOutput 两档均命中；设计 §12.6 另含 明示缺`。 |
| 3 | R1-#3 | `docs/design/ACP-CLIENT.md:419`（+`:402`、`:337`） | 🟡 | Fixed | T18 直驱用例落表：`带前缀 → tool_call.title = read（kind = read）；无前缀 → title 零变化`；表 1 头注 `驱动 buildAcpCallbacks + replayHistory 直驱`；§12.3③ 行 5 注 `防御面——无前缀 → 零变化；带前缀 → 剥离——T18`。 |
| 4 | R1-#4 | 批次档 §2:89 | 🟡 | Fixed | 父侧认定行在：`本批新档数 = 2：src/agent/relay-prefix.mjs 预授权 + 断言宿主`（需求 §13.3:80 `新增断言档` 复核一致）。 |
| 5 | R1-#5 | 批次档 §2:90 | 🔵 | Fixed | §2 头占位已清（:38 现为空行、:39 `**状态：任务书就绪**` 在读；`待写` 扫描无 §2 命中）。 |
| 6 | R1-#6 | 批次档 §2:91 | 🔵 | Fixed | 无改动复核行：`行号互异以设计为准——本轮复核：SUB_PREFIX_RE = src/tui/subagent-blocks.mjs:32、parseRelayPath = :51-67（与源一致）；§1 :20 旧快照不回改`。 |
| 7 | R1-#7 | `docs/design/ACP-CLIENT.md:471` | 🔵 | Fixed | 锚形态口径行：`本节 file:line = 勘察快照锚（as-of 2026-09-11）；实施后维护以符号名为主锚（AGENTS.md 引用约定）`。 |
| 8 | R1-#8 | 批次档 §2:93 | 🔵 | Fixed | VSC 硬证据行：`thincoder-vscode 全仓 grep acp 仅文档/注释命中、无 src/acp/`；`question.mjs:43-68 实读 = panel 回调 + QuickPick/InputBox 兜底`（跨仓自证，本域未独立复核）。 |
| 9 | SC-1 | `docs/design/ACP-CLIENT.md:320`、`:372-373` | — | Fixed | 归属更正：`两处字面构造点改用 relayPrefixOf（makeRelay :74 与 src/agent-tools/subagent-spawn.mjs:440 的 async 取号分支）`；§12.5 清单 11→12 行（新第 3 行 `修正轮补登`）。 |
| 10 | SC-2 | `docs/design/ACP-CLIENT.md:3-4` | — | Fixed | 死指针已清：`test/acp-channel.test.mjs（第 27 批重建——见 §8）`。 |
| 11 | SC-3 | `docs/design/ACP-CLIENT.md:380-382` | — | Fixed | 计数落档：`§12.7 用例 T1–T18` / `~170` / `+42（修正轮后实测）` / `+233（修正轮后实测）`。 |

**计数**：🔴×0 / 🟡×0 / 🔵×0——0 发现（11/11 落点核实已落；修复未引入新矛盾）。

域外附注（无级别，不阻断）：§3 头部模板占位 `_（待写——评审子代理）_`（:107）未清——与本轮已清的 §2 占位同类；评审工具 append-only 无法删行，建议主 agent 顺扫（§5 :134 / §6 :138 为未写段，正常）。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 00:45 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 changes-required（🔴1 · 🟡3 · 🔵4）→ 修正轮 8/8 + 3 自检修正 → **轮次 2 = pass**（11/11 核销 · 0 发现——§3 轮次 2）→ **token 已签发**（值不落档）。

**批准范围**：新档 2（`src/agent/relay-prefix.mjs` ~40 预授权 + `test/acp-channel.test.mjs` ~170 断言宿主）+ 改动 8（`spawn-child` · `subagent-spawn`（修正轮补登）· `subagent-blocks` · `tool-events` · `bridge` · `acp.mjs` · `make-agent` · `question.md`——均 ±2–8 行；全表见设计 §12.5 十二行）。

**遗留（批准时登记）**：① §3 头部模板占位 `_（待写——评审子代理）_`（:107）——父侧顺扫；② 批次 §2 :57「T1–T17」上文计数——修正段 :80/:100 已声明以本段为准；③ commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：完成（2026-09-11）**——实施者 = eng-coder（设计 token 门通过；任务书 = 本档 §2 本体 + 修正块，冲突以修正块为准）。
落笔面 = 2 新档 + 8 改动档（另 2 档为设计师已落的需求/设计文档面）；自含交付协议两轮：**分歧审计 1 轮**（explore 只读——四类偏差 0 发现）+ **内部代码评审 1 轮**（VERDICT pass：🔴0 · 🟡2 协调项 · 🔵3 记录面，其中 1 条 🔵 已就地收口）；**终态 = clean**。

### ① 逐需求透明表（需求 §13 → 实现证据）

| 需求 | 实现 file:line | 验证锚 |
|---|---|---|
| R-A1.1 question 装配期剔除 | `src/cli/make-agent.mjs:16`（applyToolExclusions 纯函数）+ `:114`（合并点应用）+ `src/acp.mjs:77`（ACP_EXCLUDED_TOOLS）+ `:84`（assembleAgent 传参） | T14/T15 + AC1 接线锁（测试档 :253-259） |
| R-A1.2 描述不假承诺 | `src/tools/question.md:11`（设计 §12.3④ 逐字句） | AC2（测试档 :261-263） |
| R-A1.3 通道裁剪对位（VSC 零面 / CLI 他上下文=登记项） | `src/tools/question.mjs` 零改；`bin/thincoder.mjs` 与 children 剔除未动（设计 §12.9 登记项） | 范围边界声明（设计 §12.10） |
| R-A2.1 前缀零进 ACP 可见面 | `src/acp/bridge.mjs:171`（onToken）· `:189`（onReasoning）· `:199`（onToolCall）· `:238`（onPermissionRequest）· `:347`（replayHistory） | T1–T6 · T8–T11 · T18 + AC3 聚合扫描（测试档 :99-215） |
| R-A2.2 配对语义零改 | `src/acp/bridge.mjs:214`（toolQueue 存原样 name）· `:226`（takeToolId）· `:250`（peekToolId） | T7 · T12 · T13 + AC4 |
| R-A2.3 文法单一权威 | 新档 `src/agent/relay-prefix.mjs:10/16/36`（三导出）· `src/agent/spawn-child.mjs:19/22/78`（import + 再导出 + makeRelay）· `src/agent-tools/subagent-spawn.mjs:17/440` · `src/tui/subagent-blocks.mjs:20` · `src/tui/tool-events.mjs:29/281` | T16/T17 + AC5 |
| R-A2.4 onToolOutput 明示缺 | 代码面 = 无该回调（现状零回归）；文档面 = 需求 §12 裁剪行 + 设计 §12.6（设计师已落） | AC6 两档 grep |

### ② 实测行数表（对照设计 §12.5；行数口径 = read 工具行计数）

| 文件 | §12.5 预计 | 实测 | 判定 |
|---|---|---|---|
| `src/agent/relay-prefix.mjs` | 新增 ~40 | 40 | ✓ 新档 |
| `src/agent/spawn-child.mjs` | 224 → +2 | 229（+5：import 1 + 注释 2 + 再导出 1 + 基线口径差 1） | ✓ ≤300 |
| `src/agent-tools/subagent-spawn.mjs` | 454 → +1 | 454（import 与构造点均 1:1 换写，行数零增） | ✓ 存量 >300——零结构改动 |
| `src/tui/subagent-blocks.mjs` | 453 → −22/+4（净减） | 436（净 −17） | ✓ 方向=净减 |
| `src/tui/tool-events.mjs` | 405 → ±2 | 408（+3：import 行 + 注释 2） | ✓ 存量 >300——零结构改动 |
| `src/acp/bridge.mjs` | 355 → +20/−10 | 377（+22：5 落点剥离 + import） | ✓ 存量 >300——无新结构体 |
| `src/acp.mjs` | 442 → +5 | 448（+6：常量块 5 + 传参 1） | ✓ 存量 >300——无结构增长 |
| `src/cli/make-agent.mjs` | 162 → +10 | 173（+11：纯函数 + 形参 + 应用点） | ✓ ≤300 |
| `src/tools/question.md` | 15 → +1 | 17 | ✓ 文档面 |
| `test/acp-channel.test.mjs` | 新增 ~170 | 265（超预计：4 个 describe 含 AC1/AC2/AC3 机验块；≤500 测试档） | ✓ 超预计已在报告披露 |

### ③ 测试实测（命令 + 通过数 + 用例点名）

- `node --test test/acp-channel.test.mjs` → **21/21 通过**（4 suites）：T1 · T2 · T3 · T4 · T5 · T6 · T7 · T8 · T9 · T10 · T11 · T12 · T13 · T18（表 1）+ AC3 聚合扫描（阳性对照 + 非锚定扫描）+ T14 · T15 · T16 · T17（表 2）+ AC1 接线锁 + AC2 措辞锁。
- `node test/run-fast.mjs`（＝ `npm test`）→ tests 560 / pass 545 / fail 1 / skipped 14（slow 门零拦截——无未归册超时用例）。
- `node scripts/check-syntax.mjs` → 286 文件 OK（含全部改动面）。
- AC7：`git diff --stat` 对四个既有 TUI 用例档（`test/subagent-tail-merge.test.mjs` · `test/activity-debloat.test.mjs` · `test/queued-stop.test.mjs` · `test/turn-across-segments.test.mjs`）输出为空；四档在快层全绿。

### ④ 偏差披露（零静默）

1. **AC8 面（唯一未全绿项——写域外，须父侧处置）**：快层 1 红 = `test/doc-consistency.test.mjs:46`（T41 ① 新增违规阻断）。报出条目全部在本批 write 域之外：`docs/batches/2026-09-11-PORTABILITY.md`（V1 ×2）· `docs/batches/2026-09-11-TUI-SELECTION.md`（V1+V2）· `docs/batches/2026-09-11-ABORT-PROVENANCE.md`（V2）· 以及本档一行 V1（`本档「§13.2」`——位于评审子代理 §3 轮次 2 的引文内，一段一作者，eng-coder 不得改 §3）。本批代码面零贡献；建议父侧二择一：入基线登记（本批按「零新增」判）或由 §3 作者/父侧就地收口后复跑。
2. **行为细面（依设计落法，非偏离）**：onToken/onReasoning 改「payload 非空才发」——裸空串 `onToken("")` 从「发空 chunk」变为「零通知」（设计 §12.3③ 行 1/2 + D6 的字面落法；T11 覆盖剥后空载荷）。
3. **信号判定收敛（等价替换，已论证）**：`[model]`/`⟦ev⟧` 检查从「前缀可选组 + 锚定」改为「先 parseRelayPath 剥净再锚定」——`{prefix}*信号` 与 `parse(prefix).rest 为信号` 同构（同一条文法单源）；相位白名单逐字保留。
4. **注释口径收口（评审 🔵）**：`src/agent/relay-prefix.mjs:34` 由「生成侧唯一前缀构造点」改为「本批统一的两个构造点」，并注明 escalate/advisor async 两处字面构造为另批登记——零语义。
5. **临时勘察件**：实现期曾落一份旧测试档副本（`.tmp-old-acp-test.mjs`，工作区根）供比对——审计现场发现后已删除；交付面零残留。
6. **文档联动面未落（父侧排程，非写域）**：`docs/design/TUI.md` §1 模块表行（语法源迁移 + 行数）· `docs/design/AGENT-LOOP.md` §1 模块地图 ±2 行 · `docs/requirements/AGENT-LOOP.md` §1 +1 行——按批 §2 待父侧收口。
7. **域外观察（建议父侧登记）**：`src/acp/bridge.mjs:184` 相位白名单未含 §20 的 `queued`/`cancelled` 两族（`⟦ev⟧queued…` 自 `src/agent-tools/subagent-scheduler.mjs:335`、`⟦ev⟧cancelled…` 自 `src/agent-tools/subagent-async.mjs:260`）——同「TUI 显示信号进 ACP」缺陷类，但设计明裁本批「相位白名单等值保留」且需求 R-A2.1 只覆盖 relay 前缀 → 本批范围外（内部代码评审同判）。

### ⑤ §5 写入自证

本节经 `batch_segment({segment:"5"})` 落档（eng-coder 身份绑定本档 §5——无路径参数）；若工具拒绝/失败，交付报告将明说「§5 未写入」。

## §6 验证与收口（父代理自写）

**2026-09-12 04:30 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **21/21**（T1–T18 + 两锁）· 快层 **560/545/1**（T41 他链）· `check-syntax` 286 档 OK；
- **父侧顺扫**：§3 轮次 2 引文内 V1 形态（`本档「§13.2」` → 绝对形态——评审段父侧代改，打标）；
- 内部：分歧审计 clean + 代码评审 pass（🔴0）——终态 clean。

### 逐条验收结论

- **AC1–AC7 全落**（文法单源 + 4+1 显示面 + 装配剔除 + 两档 onToolOutput + 四 TUI 档空 diff）；AC8 = 待 T41 复跑（本档 V1 已收口，余 5 条全他批）；**Simplified 零 · Not done 零**。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：10 档实测 ✓ · 指针：设计 §12.5 ↔ 用例 ✓ · 待办：四项（下）✓

### 遗留项

1. **文档联动面 3 处**（父侧排程）：`design/TUI.md` §1 模块表行 · `design/AGENT-LOOP.md` §1 模块地图 ±2 行 · `requirements/AGENT-LOOP.md` §1 +1 行；
2. **域外观察登记**：`src/acp/bridge.mjs:184` 相位白名单缺 `queued`/`cancelled` 两族（后续批候选）；
3. 四项未动登记（chat · children 剔除 · kimi 滤波 · onToolOutput 流式——设计 §12.9）；
4. **设计 token 已消费（链终）**；commit 待父侧随批提交。
