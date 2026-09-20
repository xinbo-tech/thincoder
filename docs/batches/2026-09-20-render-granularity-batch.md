# 2026-09-20 · 渲染粒度对齐批（RENDER-GRANULARITY-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 16:2x · 来源 = 用户 16:17 现场观察（VSC 端 eng-coder 偏差评估时 explore 输出「一 chunk 一行」· **当前现码**）+ 用户 16:28「**可以，开吧**」+ 台账 **#148**（父侧走查 + explore#1 盘点已把机制缩至三条候选）。
> 本档 = **VSC 子代理内容渲染粒度**；口径 = **以 CLI 为标尺**（既有裁定 · 两端语义冲突以 CLI 为准）。

## §1 讨论（主 agent）

### 1.0 用户授权（**父侧代点火 + 代批准** · 时限 **跑到干完（排空）**）

**用户原话**（14:40）「**全自动跑到下午五点**」+（17:03）「**自动跑到干完吧**」⇒ **窗口限制解除**（同 2026-09-18「自动跑到排空吧」先例 ✓）——本批**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**，直到本批收口（排空）✓。

**父侧自缚（代签条件）**：① 仅当「评审 **pass（0 🔴）** ∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备时代签；② 每次代签在 §4 写明「父侧代签（用户 14:40→17:03 授权 · 跑到干完）+ 依据」；③ 需**新范围**（本批之外）或**用户口径裁决** ⇒ 仍停下。

**状态行**：🔄 进行中（**评审 pass（id=4 · 0🔴/3🟡）→ 修正轮待发**）

### 1.1 条目（1 条台账 + 2 项同域顺带）

| # | 来源 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#148** | **渲染粒度：「一 chunk 一行」** | 症状**确认**（用户现场 · 现码）· 已排除 5 条（核心按行切 ✗ · 中继切分 ✗ · `noteChunk` ✗ · **`?? &quot;tool&quot;` 兜底（探查证不可达 ✗）** · 今日改动 ✗）⇒ 真凶 = **`webview/ui.js:71-77` 的 `sameRow` 四条件**（任一不满足即新建行 ✗）· 三条静态可达候选：**(a)** 并行嵌套 `sub` 交替（`dispatch.mjs:476` 批并行 ⇒ `explore#N` 交错）· **(b)** **think↔text 逐事件交替**（`provider/sse.mjs:141-149` 单事件可同携 `reasoning_content`+`content`）· **(c)** tool 面设计即每 chunk 一行（`ui.js:51-68`）+ 两处端差。 |
| 2 | 同域端差 | **VSC `toolResult` 第五路无 CLI 对位** | `panel-callbacks.mjs:207`（2026-09-19 批补）· CLI 侧 `routeSub*` 仅 4 面（`tool-events.mjs:101/109/117/328`）⇒ 登记或补对位（**属双端面 ⇒ 需口径裁**）。 |
| 3 | 埋雷 | **`??` 双默认值不一致** | `streaming.js:255` `?? &quot;tool&quot;` vs `panel-toolpanel.mjs:15` `?? &quot;text&quot;` ⇒ 今日不可达 ✓ 但任何绕过 `toolPanelPayload` 的未来生产者会被**静默渲成工具行** ✗ ⇒ 统一为 `&quot;text&quot;`（随本批归一）。 |

### 1.2 硬要求（父侧已裁的方向）

1. **第一义务 = 先实读对端**：CLI 的 **think / text / toolOutput 三面各自的合并粒度**须实读（`routeSubToken` / `routeSubReasoning` / `routeSubToolOutput` 或对位面）——**这一步决定「谁向谁对齐」**：若 CLI 同类亦 per-delta 换行 ⇒ **双端共同缺陷 ⇒ 双端一起修**（口径升级）；若 CLI 合并 ⇒ **端差 ⇒ VSC 向 CLI 对齐**（不发明新规则 ✓）。
2. **(a) 判「不是缺陷」**（父侧预裁）：并行嵌套 `sub` 分行**有用途**（两路输出并排可辨 · 行首已有 `explore#N ·` 标识 ✓）⇒ **不合并**（合并需新设计 ✗）；若设计轮实读认为有更好的取舍 ⇒ **摆选项 + 理由**（不擅自改裁 ✓）。
3. **(b)(c) 按实读定案**：think/text 粒度 + toolOutput 合并（照 CLI `fresh` 判据 `subagent-blocks.mjs:366-370`）+ 埋雷归一。
4. **回归锁**：一条渲染粒度用例（连续 think/text 交替 + 同工具连续输出 ⇒ **段数可断言** ✓）。

### 1.3 验收（方向）

① 对端三面合并粒度实读表（含 file:line + 逐面判据）；② 修法（按实读定案）或「双端共缺陷」升级呈裁；③ 受影响文件表（VSC webview 面 + 若双端 ⇒ CLI 面）；④ 渲染粒度用例（先红后绿）；⑤ `doc-check` 净增 0。

### 1.4 台账

**#148** → 本批（在途）· 落定后核销。

## §2 批次任务与设计（eng-designer）

> 轮次 = **initial** · 任务书 = §1 全段 · 出处 = 台账 #148 + 同域两项 · 口径 = **以 CLI 为标尺**（先实读对端 ⇒ 定「谁向谁对齐」）。
> 设计档落点 = `docs/vsc/design/WEBVIEW.md` **§5.6**（新增）+ §5.3 面集收正 + §10 行 16 + 变更记录；协议登记 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 / §3.2 行 3（**本轮已落**）。

### 2.0 本批覆盖 / 不在本批

| # | 条目 | 本批处置 |
|---|---|---|
| 1 | **#148** 渲染粒度「一 chunk 一行」 | **修**（R1–R4 + CSS）——真凶 = `webview/ui.js:51-68` tool 分支无合并路径 |
| 2 | 同域端差 · VSC `toolResult` 第五路无 CLI 对位 | **删净**（R6）——实读判「**无产者**」；父侧裁定 **①**（删支路 + 删档句）；②案已否决 |
| 3 | 埋雷 · `??` 双默认不一致（`streaming.js:255` vs `panel-toolpanel.mjs:15`） | **归一为 `"text"`**（R4） |

**不在本批**：(a) 并行嵌套 `sub` 交替分行（§1.2 预裁「不是缺陷」· 维持）· (b) think↔text 逐事件交替（实读两端同构 · 不修）· 工具行**字面形态**端差（另立条目）· CLI 面 / 核面 / `TUI.md`（**零改**）。

### 2.1 对端三面实读表（交付 ① —— 定「谁向谁对齐」）

| 面 | CLI 标尺（file:line 实核） | 合并判据 | 结论 |
|---|---|---|---|
| text | `routeSubToken` → `appendSubBlock(sub,"text",payload)`（`thincoder-cli/src/tui/subagent-blocks.mjs:304`） | `pushBlock`：`!fresh && last.kind === kind && !isTrimMarker(last)` ⇒ 并入末块（`subagent-children.mjs:139-145`）；RAW 拼接零分隔符（`:143`） | **合并** |
| think | `routeSubReasoning` → `appendSubBlock(sub,"think",path.rest)`（`:319`） | 同上 | **合并** |
| text↔think 交替 | — | `last.kind === kind` 不成立 ⇒ 新块（`subagent-children.mjs:140`） | 每次 kind 翻转 = 一段 ⇒ **两端同构 · 非端差** |
| toolOutput | `routeSubToolOutput` → `appendSubBlock(sub,"tool",part.text,{fresh: currentTool !== toolName})`（`:356-374`）；工具名 = relay 前缀 `path.rest`（`:364`） | 工具名不变 ⇒ 并入末块（RAW · 零分隔符）；名变 ⇒ 新块 | **合并**（一工具调用 = 一块） |
| toolCall（调用行） | `routeSubToolCall` → `appendSubBlock(sub,"tool",`❯ name args\n`,{fresh:true})`（`:346`） | `fresh:true` ⇒ 恒新块 | 每调用恒新段 |
| 嵌套归属 | SUBAGENT-TAIL：内层行并入外层 blocks（`subagent-blocks.mjs:341-346`） | CLI 内层行**无归属标** | 与 VSC 的 `sub` 子标 = `TUI.md:360-361` **已登记端差**（各端独立实现） |

⇒ **结论 = 端差（非双端共缺陷）** ⇒ **VSC 向 CLI 对齐**（不发明新规则）；无 CLI 修复面。

### 2.2 真凶与修法（交付 ②）

**真凶**：`webview/ui.js:51-68` tool 分支**无合并路径**——每 chunk 新建 `div.advisor-tool-line`；而 relay chunk = **任意字节边界碎片**（CLI 同注释实证：逐 chunk 补 `\n` 会把词拦腰断行——`subagent-blocks.mjs:351-355`）⇒ 逐 chunk 断行 = 用户症状「一 chunk 一行」。

**非真凶（不修）**：`sameRow` 的 `dataset.kind` / `dataset.sub` 两条件与 CLI 同构（见 §2.6 保留裁定 (a)(b)）。

| # | 落点 | 改法（对齐判据） |
|---|---|---|
| R1 | `src/extension/panel-subagent-relay.mjs:174-182` | ① toolOutput 面 chunk 补 `tool: path.rest`（**工具名与 CLI 同源**——CLI 的 `fresh` 判据正读它）；② 四面 chunk 统一携 `face`（∈ text / think / toolCall / toolOutput）——CLI 以「哪个路由函数被调用」表达面，本端四面压成单 `toolPanel` 载荷 ⇒ 面必须随载荷（否则调用行与输出行不可分 ⇒ 工具名粘连） |
| R2 | `src/extension/panel-toolpanel.mjs:15-21` | 白名单补 `face`（NF1 不静默丢字段；`tool` 字段已在册） |
| R3 | `webview/ui.js:42-95` `appendAdvisorChunk` | 入参扩 `meta`（结构化 chunk · 可选——缺省 = 旧行为）；tool 分支加**合并路径**（CLI `pushBlock` 同判据）：调用 chunk（`face === "toolCall"`）**恒新行**；输出 chunk 并入**末子行** iff 末子 = 工具行 ∧ `dataset.face === "toolOutput"` ∧ `dataset.tool` 同 ∧ `dataset.sub` 同 ⇒ `appendChild(createTextNode(str))`（**RAW 拼接 · 零分隔符**）。冻结守卫 / `_subCur` 记账 / sub 标 span **零改** |
| R4 | `webview/streaming.js:255-256` | `const kind = m.kind ?? "text"`（**单点默认**——与桥 `panel-toolpanel.mjs:15` 及 CLI `tool-events.mjs:324` 同值）；`appendAdvisorChunk` / `noteChunk` 两处同用 + 传 `m`（**埋雷归一 = 条目 3**：现 `?? "tool"` 与桥 `?? "text"` 双默认不一致——今日不可达，未来绕过桥的生产者会被静默渲成工具行） |
| R5 | `webview/activity-view.js:179-200` `noteChunk` | 结构化分支加**面门**（`m.face !== "toolOutput"`）⇒ 输出 chunk 仍走「工具文本尾句」（否则 R1 补 `tool` 后状态区退成裸工具名——`WEBVIEW-PROTOCOL.md` §6.2 状态区·running 对齐面回归） |
| R6 | `src/extension/panel-callbacks.mjs:206-207` · `panel-subagent-relay.mjs:167`/`:178`/`:180-182` · `WEBVIEW.md:275` | **删「第五路 `toolResult`」死支路**（父侧裁定 **①**：零行为变更 · 死对象删净〔能判〕· 不升级用户；将来核侧真加 relay ⇒ 随该能力面重建支路 + 档句）。**实现面收口（评审 #1）**：兜底分支只收 `text` / `think`——非四面 face（含 `toolResult`）⇒ `return false`（先于 `noteContentFirst` / `emitToolPanel`——不入 `ev:subcontent`、不发载荷；调用方原样转发）。T-G8 断言面（`toolResult` 返 false）即以此为设计依据。**备选 ②「保留 + 登记为无产者面」= 已否决**（登记是给「不能判」的东西准备的；此处能判） |

**保留裁定三项（本批不翻）**：(a) 并行嵌套 `sub` 分行 = 「不是缺陷」维持（行首 `explore#N ·` 归属可辨 + `TUI.md:360-361` 已登记）；(b) think↔text = 两端同构 ⇒ 不修；(c) CLI 面 / 核面 = **零改**（判端差而非共缺陷）。

### 2.3 受影响文件表（交付 ③ —— 行数 = `wc -l` 实读 2026-09-20）

| # | 文件 | 现 | 预期 Δ | 改动 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/webview/ui.js` | 475 | +≤17（→ ≤492） | R3 |
| 2 | `thincoder-vscode/webview/streaming.js` | 260 | +≤5 | R4 |
| 3 | `thincoder-vscode/webview/activity-view.js` | 200 | +≤2 | R5 |
| 4 | `thincoder-vscode/webview/chat.css` | 490 | +1（→ 491） | `.advisor-tool-line`（`:336`）加 `white-space: pre-wrap`（输出自带换行无损还原） |
| 5 | `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | 266 | +≤4 | R1 + R6（面枚举注释收正为四面 + 非四面 face 返 false 收口） |
| 6 | `thincoder-vscode/src/extension/panel-toolpanel.mjs` | 22 | +1 | R2 |
| 7 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 308 | −2 | R6（删支路 + 注释） |
| 8 | `thincoder-vscode/test/render-granularity.test.mjs` | 新 | ~130 | T-G1–T-G8（§2.4） |
| 9 | `thincoder-vscode/test/files.mjs` | 120 | +1 | 登记新档（`test/run.mjs` fail-closed：不登记 = 永不执行） |
| 10 | `thincoder-vscode/test/subagent-content-relay.test.mjs` | 145 | +≤15 | 载荷 `tool`/`face` 断言随收 + **面集 = 4 结构锁**（R6 回归） |
| 11 | `docs/vsc/design/WEBVIEW.md` | 585 → **614** | **已落**（本轮） | §5.6 新增 · §5.3 面集收正（四面 + 无产者证据链）· §10 行 16 · 变更记录一行 |
| 12 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 538 → **540** | **已落**（本轮） | §3 `toolPanel` 行 + §3.2 行 3（增字段 `face`；十三项计数零变） |
| — | `thincoder-cli/**` · `thincoder-core/**` · `docs/cli/design/TUI.md` | — | **零改** | 标尺面 |

**跨文件限 + 拆分预案**：`ui.js` → ≤492（距 500 硬限 ≤8）· `chat.css` → 491（≤9）——均在限内；若实施越限 ⇒ **拆分预案** = 内容行族（`appendAdvisorChunk` + 新合并判据）整段迁新叶模块 `webview/block-rows.mjs`（`ui.js` 只留 re-export）。新档 ≤500 无虞。

### 2.4 用例设计（交付 ④ —— 段数断言 · 先红后绿）

新档 `thincoder-vscode/test/render-granularity.test.mjs`（手法同 `activity-flow.test.mjs`：真 `test/helpers/webview-env.mjs` fixture + 真 `webview/streaming.js` 直驱；段数 = `.advisor-content` 子元素计数；判据全 ASCII）。

| 用例 | 输入（真载荷形） | 期望 | 先红读数 |
|---|---|---|---|
| T-G1 | call `read`（face=toolCall）→ 两条 toolOutput（同 tool/sub） | 段数 **2**（调用行 + 输出行）；输出行 textContent = 两片段**逐字相接**（零分隔符） | 修前 **3** |
| T-G2 | call `read`（face=toolCall）→ `read` 输出 ×2 → `grep` 输出 ×1 | 段数 **3**（调用行 + `read` 输出 ×2 并一行 + `grep` 新段） | 修前 **4** |
| T-G3 | call `read` → call `read`（同工具连续两次） | 段数 2（调用行恒新段） | 前后同（防「过并」锁） |
| T-G4 | text → think → text | 段数 3（kind 翻转分段） | 前后同（两端同构锁） |
| T-G5 | 同 tool 同 face，`sub` = `explore#1` / `explore#2` 交替 | 段数 2（(a) 预裁锁） | 前后同 |
| T-G6 | 无 `tool`/`face` 的 `{kind:"tool",text}` ×2（旧生产者） | 段数 2（降级 = 旧行为零变） | 前后同 |
| T-G7 | `subagentChunk({name, text})`（kind 缺省——埋雷面） | 行 class = `.advisor-text`（非 `.advisor-tool-line`） | **修前红** |
| T-G8 | 直驱 `relaySubagentContentChunk` 五面名 | 四面认领；`toolResult` 返 false（**R6 结构锁**——防未来误重加） | **修前红**（五面认领） |

### 2.5 验收标准（逐条回指 §1.3）

| 条 | 落点 | 判据 |
|---|---|---|
| A1 对端实读表 | §2.1 | 三面 + 交替 + 嵌套逐项 file:line + 判据 + 结论「对齐 / 共缺陷」= **端差** |
| A2 修法定案 | §2.2 R1–R6 + 三项保留裁定 | **无 CLI 面改动**（对端判合并 ⇒ 端差路径成立）；②案已否决并记因 |
| A3 受影响文件表 | §2.3（12 档 + 零改面 + 拆分预案） | 行数 = `wc -l` 实读 |
| A4 用例设计 | §2.4 T-G1–T-G8 | 段数断言 + 先红读数逐条（含结构锁两项） |
| A5 不一致处 | §2.6 三条 | 逐条点名 |
| A6 `doc-check` 净增 0 | 本轮实测 | `WEBVIEW.md` over-300 = **3**（基线 3）· `WEBVIEW-PROTOCOL.md` = **3**（基线 3）· 新引锚（`§5.6` / §3 / §3.2 行 3）均在位 |

### 2.6 与 §1 的不一致处（交付 ⑤）

| # | 不一致 | 处置 |
|---|---|---|
| 1 | §1 条目 2 前提（「属双端面 ⇒ 需口径裁」）**与实码不符**——第五路**无产者**（证据链 = §2.2 R6 / `WEBVIEW.md` §5.3：`wrapChildCallbacks` 只包四面 · 子装配不携 `onToolResult` · `dispatch.mjs:374/:441` 恒 undefined） | 已呈裁 ⇒ **父侧裁定 ①（删支路 + 删档句）**，本批落 R6；②案否决并记因 |
| 2 | §1.1 条目 1「**两处端差**」未逐项点名；实读可点名的 tool 面端差 = ① 逐 chunk 分行（本批修）· ② **行字面形态**（VSC `name {argsJson≤120}`（`panel-subagent-relay.mjs:176`）vs CLI `❯ name argsDesc`（`subagent-blocks.mjs:346`）） | ① 修；② 属**字面面**（非粒度面）⇒ 本批不动、如实登记（如需并入 ⇒ 另立条目） |
| 3 | §1 头注「两端语义冲突以 CLI 为准」 vs `TUI.md:360-361`「两端不再同构 · 各端独立实现、互不追赶」 | 实读判**不冲突**：前者射程 = 未登记的意外端差（本批对齐）· 后者射程 = 嵌套归属子标（已登记项 · 本批维持不翻） |

### 2.7 台账

**#148** → 本批（在途）· 落定后核销。

### 2.8 修正轮记录（fix · 2026-09-20 · 评审 id=4〔pass · 0🔴/3🟡〕→ 三条定点落地）

> 轮次 = fix（定点 · 追加制）· 任务书 = §3 发现表 1..3（父侧逐条裁定接受）；既有各行就地收正，本节只记「发现号 → 改动 file:line + 读数」。

- **发现 1（🟡 · R6 ↔ T-G8 口径缺口）→ 落**（`:80` + `:92`）：R6 补**实现面收口**——兜底分支只收 `text` / `think`；非四面 face（含 `toolResult`）⇒ `return false`（先于 `noteContentFirst` / `emitToolPanel`：不入 `ev:subcontent`、不发载荷；调用方原样转发）＝ T-G8 断言面设计依据；R6 坐标补 `panel-subagent-relay.mjs:180-182`；受影响文件表 5 行同收（Δ ±3 → +≤4）。
- **发现 2（🟡 · R1 五值枚举 vs 四面口径）→ 落**（`:75`）：① toolOutput 面 chunk 补 `tool: path.rest`（`toolResult` 字面去净）；② 四面 chunk 统一携 `face`（∈ text / think / toolCall / toolOutput）；「本端五面」→「本端四面」。与 `:92` / `:97` / `:98` / `:117` 四面口径四处互证。
- **发现 3（🟡 · T-G2 输入 ↔ 读数差 1）→ 落**（`:111`）：输入补全为 `call read（face=toolCall）→ read 输出 ×2 → grep 输出 ×1`（照 T-G1 写法）；期望 3 / 修前 4 与所列 4 chunk 自洽（调用行 + read 输出 ×2 并一行 + grep 新段）。
- **一致性 1 条（本席自查追加——非评审三条）**（`:95`）：受影响文件表 8 行「T-G1–T-G7」→「T-G1–T-G8」——与 §2.4 表 / §2.5 A4 / `WEBVIEW.md` §5.6 判据行三处互证（枚举对齐 · 零语义位移）。
- **读数（本轮实跑）**：逐条断言 8/8 绿（F1–F3 + X1）；`node scripts/doc-check.mjs --root .` = 锚 **2 悬空** / 行宽 **0**（域前 = 2 / 0 ⇒ **净增 0**）。2 悬空两项 = `WEBVIEW.md:412`（裸 `TUI.md:360-361` 不解析）/ `:414`（`T-G8` 用例号——目标测试档拟新增）——设计档已落面 · 本轮禁改 ⇒ **呈父侧裁**（建议：裸路径收全 `docs/cli/design/TUI.md:360-361`；T-G8 待实施落档后消解）。
- **D8 自查**：全档扫 `~~` / 尸标 / 「原为 · 此前为」零命中；本轮五处行编辑均为现行规范句 ✓。

### 2.9 设计档收正轮记录（设计档面 · 2026-09-20 · eng-designer——承 §4 派单「设计档已落面收正」）

- **条目 1（`:406`）→ 落**：`docs/vsc/design/WEBVIEW.md:406`「本端五面」→「本端四面」——承 R6 删净后终态面集 = 四面；与 `:296`（`face` ∈ `text` / `think` / `toolCall` / `toolOutput`——四面）· `:613`（面集收正为四面）互证。
- **条目 2（`:412`）→ 落**：裸 `TUI.md:360-361` 收全为 `docs/cli/design/TUI.md:360-361`（自仓根完整路径——D4 细则；目标行实核在位 = 端差异登记句）。
- **条目 3（`:324`）→ 落**：① 项判为**规范面**（§5.3 正文「窄缝族（⑥ · 本批逐条）」）⇒ 09-19 批叙旧「本批补第五路调用面 `toolResult`」（读如活项）删净，留现值「① relay 分流面 = **无产者**（证据链见上「工具结果行面 = 无产者」）」；史实归记录面 = 本档变更记录 `:608` / `:613`（零改）。
- **`:414`（T-G8 锚）→ 免动 ✓**：实施轮新档 `thincoder-vscode/test/render-granularity.test.mjs` 已落 ⇒ 该锚自然归 0（本轮实测含入）。
- **读数（本轮实跑 · cwd = 仓根）**：`node scripts/doc-check.mjs --root .` ⇒ 悬空 **1 → 0**（域前唯一悬空 = `WEBVIEW.md:412`）/ 行宽 **0 不变** / 行数净增 **0**（614 → 614；三处均行内替换）/ exit **1 → 0**。
- **写域自查**：唯一内容编辑面 = `docs/vsc/design/WEBVIEW.md`（三处行内）；批档他人段 / 产品码 / 需求档 / `scripts/**` / 他批写域零触。
- **D8 自查**：三处编辑均为现行规范句；全档扫 `~~` /「原记」/「已作废」/「裁撤」/「此前」/「原为」/「曾补」——规范面零命中（`:591`「原记」= 变更记录行 = 记录面，照留）。观察（3 处之外 · 未动）：`:312`–`:313` 携「覆旧…判定 / 旧判定…退场」式表述（§5.3 规范面）——归口交父侧。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**缩范围重跑**（只核批档 §2 内部自洽 · 三条定点 · 禁实读代码 · 判据 = 批档自身文本互证）；上轮 id=3 超时无结论 ⇒ 无既有条目可核。全档 fresh read（146 行）后逐条判定：

| # | 定点 | 文件:行 | 严重度 | 判定 | 证据（本轮 read 原句）/ 说明 |
|---|---|---|---|---|---|
| 1 | ① R6 ↔ T-G8 | `docs/batches/2026-09-20-render-granularity-batch.md:80`（旁证 `:49`「父侧裁定 **①**（删支路 + 删档句）」）vs `:117` | 🟡 | 不自洽（口径缺口；非逐字互斥） | R6=「**删「第五路 `toolResult`」死支路**（父侧裁定 **①**：零行为变更 · 死对象删净〔能判〕· 不升级用户；将来核侧真加 relay ⇒ 随该能力面重建支路 + 档句）」；T-G8=「四面认领；`toolResult` 返 false（**R6 结构锁**——防未来误重加）」。修法面只写「删」，断言面要求「返 false」；全档唯一收口句（`:92`「R1 + R6（面枚举注释收正为四面）」）只收「注释」面，未写「非四面 face ⇒ 返 false」的判据 ⇒ T-G8 的实现依据在设计面无着落。建议 R6 补一句收口（非四面 ⇒ 返 false ／兜底只收 text·think）。三条中唯一有实施面后果者：收口句缺位时，T-G8 的可满足性取决于 R6 未写明的兜底面。 |
| 2 | ② R1 五值枚举 vs 四面口径 | `2026-09-20-render-granularity-batch.md:75` vs `:92`/`:97`/`:98`/`:117` | 🟡 | 字面不一致（终态口径一致） | R1=「② 五面 chunk 统一携 `face`（∈ text / think / toolCall / toolOutput / toolResult）」+「① toolOutput / toolResult 面 chunk 补 `tool: path.rest`」；对面口径=`:92`「面枚举注释收正为四面」·`:97`「面集 = 4 结构锁」·`:98`「§5.3 面集收正（四面 + 无产者证据链）」·`:117`「四面认领」。⇒ 终态四面口径四处互证（可判读为「删前五路 / 删后四面」）；残留 = R1 ①/② 两处 `toolResult` 字面未随 R6 收正（① 会给已删分支补字段）⇒ 一行注记/收正即可。 |
| 3 | ③ T-G2 输入 vs 读数 | `2026-09-20-render-granularity-batch.md:111`（对照 `:110` 与 `:77`） | 🟡 | 不自洽（差恰好 1） | T-G2=「`read` 输出 ×2 → `grep` 输出 ×1」+「段数 **3**（工具名变 = 新段）」+「修前 **4**」：按所列 3 chunk + R3 合并判据（`:77`「输出 chunk 并入**末子行** iff 末子 = 工具行 ∧ `dataset.face === "toolOutput"` ∧ `dataset.tool` 同 ∧ `dataset.sub` 同」）推得 修后 2 / 修前 3；读数 4/3 需一条未列出的调用 chunk（T-G1 `:110` 显式列「call `read`（face=toolCall）→ 两条 toolOutput」）⇒ 补全输入行（或改两处读数）使同 fixture 自洽。 |

范围外说明（无严重度，不入发现表）：上轮主机核验提示的 1 条未过引用（`WEBVIEW-PROTOCOL.md:539`，file unreadable）属本评声明排除的实读面——本轮未核、不得按已核处理。

计数：🔴 0 · 🟡 3 · 🔵 0

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 17:1x 父侧代签** —— 用户 14:40「全自动跑到下午五点」+ 17:03「**自动跑到干完吧**」⇒ 本批**设计评审点火权 + §4 批准权**均在授权射程内（**跑到干完** · 窗口限制已解除 ✓）。

**三条件核验**：① 评审 **pass**（id=4 · 缩范围重跑 · 0🔴/3🟡）✓；② **修正轮（id=5）3/3 落地**（R6 实现面收口 ✓ · R1 四面口径收正 ✓ · T-G2 输入补全 ✓；机检断言 **8/8 PASS** · 另自捕一致性 1 条 ✓）；③ **token 已签发**（值不落档 ✓）。

**批准范围**：本批全量。**实施两路**：**webview/端壳面**（R1–R6 · ui.js / streaming.js / activity-view.js / chat.css / panel-subagent-relay.mjs / panel-toolpanel.mjs / panel-callbacks.mjs + 新测档 `render-granularity.test.mjs` + `files.mjs` 登记）→ **eng-coder + token** ✓；**设计档已落面收正**（`WEBVIEW.md:406` 五面→四面 · `:412` 裸路径收全 · `:324` 按面标史）→ **eng-designer**（小面）✓。两路皆已派发 ✓。
## §5 实施记录（eng-coder）

### 5.0 交付摘要（eng-coder · 2026-09-20 · 轮次 = initial）

按 §2 全段落 **R1–R6**（含 §2.8 修正轮三条收口）+ 用例 **T-G1–T-G8**；**先红后绿逐条留痕**（5.2）；三包测试全绿（5.4）；`node scripts/doc-check.mjs --root .` = 锚**悬空 0** / 行宽 **0**（本席车道零新增 ✓——设计轮遗留的 2 项由设计档另一路消解）。**零 CLI 面 / 零核面改动**（端差路径成立）。设计档（`WEBVIEW.md` / `WEBVIEW-PROTOCOL.md`）不在本席写域——已由另一路落地并逐点实读核过（`WEBVIEW.md:275-277` 无产者证据链 · `:324` 按面标史 · `:393-414` §5.6 · 总行数 614 = §2.3 表读 ✓）。

### 5.1 改动清单（file → 落点 → Δ 实读）

> Δ 口径 = 逐行计数（去尾空行）——与 §2.3「现」列同口径；六行基线逐字吻合（ui.js 475 · streaming 260 · activity-view 200 · chat.css 490 · relay 266 · toolpanel 22）。

| # | 文件 | 落点（R号 / T号） | Δ 实读 | 判定 |
|---|---|---|---|---|
| 1 | `webview/ui.js` | **R3**：`:41-45` doc · `:47` 入参扩 `meta` · `:56-64` tool 分支合并路径（四条件 + RAW 零分隔符）· `:67` `dataset.face`/`dataset.tool` · `:69` `dataset.sub`（合并判据读它——现码 tool 分支原不落该键） | 475 → **490**（+15） | ≤492 设计上限 ✓ · ≤500 硬限 ✓（余 10） |
| 2 | `webview/streaming.js` | **R4**：`:255` 单点默认 `m.kind ?? "text"` · `:257` `appendAdvisorChunk(…, m)`（m 随行）· `:258` `noteChunk(block, kind, …)` | 260 → **262**（+2） | 预期 +≤5 ✓ |
| 3 | `webview/activity-view.js` | **R5**：`:183-185` `noteChunk` 结构化分支加面门 `m.face !== "toolOutput"` | 200 → **202**（+2） | 预期 +≤2 ✓ |
| 4 | `webview/chat.css` | CSS：`:336` 注释 + `:337` `.advisor-tool-line` 加 `white-space: pre-wrap` | 490 → **491**（+1） | 预期 +1 ✓ |
| 5 | `src/extension/panel-subagent-relay.mjs` | **R1**：`:180-181` toolCall 面 `tool: path.rest, face` · `:183` toolOutput 面 `tool` + `face` · `:185` text/think 面 `face`。**R6**：`:166-171` 面枚举收正为四面 + `:173` 非四面 face 早退 `false`（先于 `:188` `noteContentFirst` / `:189` `emitToolPanel`） | 266 → **270**（+4） | 预期 +≤4 ✓ |
| 6 | `src/extension/panel-toolpanel.mjs` | **R2**：`:23` 白名单增 `face`（`typeof chunk === "string" ? undefined : chunk?.face`）+ `:19-20` 注释随收 | 22 → **24**（+2） | 预期 +1 ⇒ 超 1 行（注释折行；不影响限） |
| 7 | `src/extension/panel-callbacks.mjs` | **R6**：删 `onToolResult` 内 `toolResult` 分流两行（原注释 + `relaySubagentContentChunk(panel, "toolResult", …)`）——`onToolResult` 现零 relay 调用；全档 relay 分流仅 `:196`（toolCall）/ `:217`（toolOutput）两处 | **309 → 307**（−2） | Δ 与表一致（−2）✓；表载基线 308 与本席实读 309 差 1（见 5.6 上抛 4） |
| 8 | `test/render-granularity.test.mjs` | **新档**（T-G1–T-G7 · §2.4 手法 = 真 `helpers/webview-env.mjs` fixture + 真 `webview/streaming.js` 直驱 · 段数 = `.advisor-content` 子元素计数） | 新 → **155** | 设计估值 ~130（估值非判据） |
| 9 | `test/files.mjs` | **登记新档**：`:120` 一行（`test/run.mjs` fail-closed 前置 —— 不登记 = 永不执行） | **121 → 122**（+1） | ✓（表载基线 120 与本席实读 121 差 1） |
| 10 | `test/subagent-content-relay.test.mjs` | **T1 载荷面随收**（`:53-55` `face` 四值 + `out.tool === "read"`）+ **T-G8 面集四面结构锁**（`:149-157`） | 145 → **157**（+12） | 预期 +≤15 ✓ |

**逐子项落点（R号 / T号 → file:line）**：R1 → `panel-subagent-relay.mjs:180-185` · R2 → `panel-toolpanel.mjs:23` · R3 → `ui.js:56-69` · R4 → `streaming.js:255-258` · R5 → `activity-view.js:185` · R6 → `panel-callbacks.mjs:201-214`（删支路）+ `panel-subagent-relay.mjs:173`（收口）；T-G1 → `render-granularity.test.mjs:64` · T-G2 → `:79` · T-G3 → `:94` · T-G4 → `:106` · T-G5 → `:119` · T-G6 → `:132` · T-G7 → `:144` · T-G8 → `subagent-content-relay.test.mjs:151`。

### 5.2 先红后绿读数（同一 fixture · 修前实跑 → 落实现 → 复跑）

| 用例 | 期望（§2.4） | **修前实读**（红） | **修后实读**（绿） | 红因（一句话） |
|---|---|---|---|---|
| T-G1 | 段数 2 · output 逐字相接 | **3** | 2 ✓（`= "line one\nline two\n"`） | tool 分支无合并路径（每 chunk 新建行） |
| T-G2 | 段数 3 | **4** | 3 ✓（`chunk-a chunk-b` + `hit` 新段） | 同上（工具名变亦恒新行） |
| T-G3 | 段数 2（调用行恒新） | 2（绿） | 2 ✓ | —（防「过并」锁：前后同） |
| T-G4 | 段数 3（kind 翻转） | 3（绿） | 3 ✓ | —（两端同构锁：前后同） |
| T-G5 | 段数 2（不同 sub 不并） | 2 段 ✓ 但 `dataset.sub` = **undefined**（红） | 2 ✓ + 两行 `dataset.sub` 逐一命中 | tool 分支原不落 `dataset.sub`（R3 合并判据读它） |
| T-G6 | 段数 2（降级 = 旧行为） | 2（绿） | 2 ✓ | —（无 face/tool 恒新行——降级不猜） |
| T-G7 | 行 class = `.advisor-text` | **`.advisor-tool-line`**（红） | `.advisor-text` ✓ | `?? "tool"` 双默认（埋雷面） |
| T-G8 | 四面认领 · `toolResult` 返 false | 五面认领（`toolResult` 返 **true**，红） | 四面 `true` · `toolResult` `false` ✓（载荷恰 4 条） | 第五路死支路未删 |
| T1（随收） | `face` 四值 + 输出面 `tool` | `[undefined×4]`（红） | `["text","think","toolCall","toolOutput"]` ✓ | R1 未落（面不随载荷 / 输出面无工具名） |

修前读数取法 = `node --test test/render-granularity.test.mjs test/subagent-content-relay.test.mjs`（修前 9 pass / **6 fail**）；修后同命令 **15 pass / 0 fail**。

### 5.3 实现要点与设计逐点对齐（核过项）

- **R1**：toolOutput 面补 `tool: path.rest`（工具名与 CLI `fresh` 判据同源）+ 四面 chunk 统一携 `face` ✓（`panel-subagent-relay.mjs:180` / `:183` / `:185`）。
- **R6 实现面收口**：`face` 非四面（含 `toolResult`）⇒ `:173` 早退 `false`——**先于** `noteContentFirst`（`:188`）/ `emitToolPanel`（`:189`）⇒ 不入 `ev:subcontent`、不发载荷、调用方原样转发 ✓。**删支路安全性**（实读核）：核 `spawn-child.mjs:146-163` `wrapChildCallbacks` 只包四面（无 `onToolResult`）⇒ 删的是真死路，零行为变更 ✓；三处删净（`panel-callbacks.mjs:206-207` 本席 · `panel-subagent-relay.mjs:167`/`:178` 本席 · `WEBVIEW.md:275` 设计另一路——已实读核在 place ✓）。
- **R3**：四条件与 §2.2 逐字一致（`ui.js:61-62`）；调用行恒新行（`face !== "toolOutput"` ⇒ 走新行路径）；冻结守卫 / `_subCur` 记账 / sub 标 span **零改**（合并路径早退不触 `_subCur`——该值恒与末行相等，语义无位移）；text/think 分支语义未动（`:87-88` 原 `sameRow` 逐字保留）。
- **R4**：单点默认（两处同用同一 `kind`）+ `m` 随行 ⇒ R3 合并判据有源；与桥 `panel-toolpanel.mjs:15` 及 CLI `tool-events.mjs:324` 同值 ✓。
- **R5**：面门方向 = 输出 chunk **不走**结构化分支 ⇒ 状态词仍取「工具文本尾句」（§6.2 状态区·running 对齐面零回归）✓。
- **`face` 字段链路**：生产（relay）→ 白名单（桥 NF1 不静默丢字段）→ 载荷 → `subagentChunk`（R4 传 `m`）→ `appendAdvisorChunk`（R3 合并判据）/ `noteChunk`（R5 面门）——**全链闭合**，无第二套字段。

### 5.4 包测试与机检读数（本席实跑）

| 面 | 命令 | 读数 |
|---|---|---|
| VSC（三包之三） | `cd thincoder-vscode && npm test`（= `test/run.mjs`：清单自检 + `node --test`） | **tests 862 · pass 862 · fail 0 · skipped 0**（含新档 7 例 + 中继档 T-G8） |
| CLI（标尺面） | `cd thincoder-cli && npm test` | **tests 745 · pass 745 · fail 0** |
| core | `cd thincoder-core && npm test` | **tests 447 · pass 447 · fail 0** |
| 邻域回归（直跑 9 档） | `node --test test/render-granularity … test/protocol-coverage` | **tests 86 · pass 86 · fail 0**（活动族 / 嵌套中继 / toolPanel 载荷 / 状态行 / 协议对表 全绿——含 `face` 增字段不触 `protocol-coverage` 1-hop 记账） |
| 文档机检 | `node scripts/doc-check.mjs --root .` | **汇总：候选 18576 · 悬空 0** · 行宽 `OK`（**净增 0**——本席车道零新增；设计轮遗留 2 项已由另一路消解） |

### 5.5 内审 + advisor 轮次与终态

- **内审（explore 子代理 · 偏差审计）1 轮 → DEVIATIONS**：四类内 finding **1** 条 = **本 §5 空段**（当时未写 ⇒ 测试档头 `见批档 §5` 悬空引用）——**本轮写入即消解** ✓；另 3 条行数观察已并入 5.1 / 5.6。逐条核过：R1–R6 逐点一致 · T-G1–T-G8 逐条在位（8/8）· 禁改面零命中 · 无调试残留 / 陈旧注释（7 档扫 `console.*|debugger|FIXME|TODO` 零命中）。
- **advisor（type=code）1 轮 → VERDICT: pass**（🔴 0 · 🟡 5 · 🔵 2，**无 must-fix**）。
- **响应表**：

| # | 发现（advisor） | 严重度 | 处置 | 落点 |
|---|---|---|---|---|
| 1 | §5 实施记录未落（档态缺项 ⇒ 先红证据无落点 + 测试档头悬空引用） | 🟡 | **已消解**——本段即落点 | 本 §5 |
| 2 | T-G8 落点自述不一致（§2.3 行 8 / §2.4 表头称新档含 T-G8；实际在 `subagent-content-relay.test.mjs:151`，新档 = T-G1–T-G7） | 🟡 | **不处置（非本席写域）**——判据面 8/8 在册、零实现动作；档面收正归设计档一路 ⇒ 上抛 1 | — |
| 3 | `WEBVIEW.md:399` 引 `webview/ui.js:71-77`（现 `:87-88`）· `:408` 引 `webview/chat.css:336`（现 `:337`）——坐标随实现漂移 | 🟡 | **不处置（非本席写域）** ⇒ 上抛 2 | — |
| 4 | 端差面：CLI 首条输出并入**调用块**（`subagent-blocks.mjs:337` 置 `sub.currentTool` · `:369` `fresh = currentTool !== toolName`）vs 本端面门 ⇒ 2 行 | 🟡 | **不处置（设计已批准 · 实现与 R3/T-G1 逐字一致）** ⇒ 上抛 3（是否登记端差句由父侧裁） | — |
| 5 | 体量 >300 建议线（ui.js 490 / panel-callbacks 307 / relay 270 / activity-view 202） | 🟡 | **不处置**——超线为存量债、批档 §2.3 已载拆分预案（越 500 硬限才拆）；本批增量在预期内 | — |
| 6 | 「预期 Δ」抽查：`panel-callbacks.mjs` / `files.mjs` 基线读数各差 1 | 🔵 | **如实记账**（5.1 表内逐行注明；Δ 列仍与表一致）⇒ 上抛 4 | 5.1 |
| 7 | `rows()` 直解引用 `S._subBlocks.get(CH)` ⇒ 块缺失抛 TypeError（诊断不可读） | 🔵 | **采纳落地（fix round 1）**：`render-granularity.test.mjs:56-57` 加 `assert.ok(block, …)` 守卫；复跑两档 **15 pass / 0 fail**、邻域 9 档 **86 pass / 0 fail**、VSC 全量 **862 pass / 0 fail** | `test/render-granularity.test.mjs:56-58` |

- **fix round 1**（唯一一轮）：上游 = advisor 🔵#7（诊断口径）；改动 = 1 档 3 行（测试档，本席写域）；复跑读数同上 ⇒ **收敛（clean）**。

### 5.6 上抛项（父侧裁 / 父侧落）

1. **档面（设计一路）**：§2.3 行 8 `T-G1–T-G8` 与 §2.4 表头「新档含 T-G8」两处措辞 ⇒ 实际落点 `subagent-content-relay.test.mjs:151`（与 §2.3 行 10「面集 = 4 结构锁」自洽）——建议档面收正（判据零动作）。
2. **坐标（设计一路）**：`WEBVIEW.md:399`（`ui.js:71-77` → `:87-88`）/ `:408`（`chat.css:336` → `:337`）——实现轮后 as-of 收正。
3. **端差登记（待父侧裁）**：CLI = 一工具调用一块（输出并入调用块）vs 本端 = 调用行 + 输出行两段（面门所致）。视觉等价（皆「调用行 + 输出行」），本端严格实现 R3 + T-G1；**如需字面块数对齐** ⇒ 去面门（末子 = 同 `tool`/`sub` 的工具行即并入）；否则建议在设计档补一句端差登记。
4. **读数基线**：§2.3 行 7（308）/ 行 9（120）与本席实读（309 / 121）差 1（Δ 列一致）——批次档基线口径复核项。
5. **禁改面复核**：`apps` 外域（CLI / core / scripts / i18n / 设计档）本席**零写** ✓；`WEBVIEW.md` 失真句（原 R6 三处之一）由设计另一路落地，已实读核在 place ✓。

## §6 验证与收口（父代理）

**2026-09-20 17:2x 父侧收口**

**交付核验（两面四道）**：设计（#2：对端三面实读 ⇒ 判**端差**·非双端共缺陷）✓ · 评审（id=3 **超时** ⇒ id=4 **缩范围重跑 pass** 0🔴/3🟡）→ 修正轮（#5 3/3 · R6 实现面收口 + 8/8 机检）✓ · **实施两路**：**webview/端壳（#6）**✓——R1–R6 全落 + T-G1–T-G8（**先红 9/6 → 后绿 15/15**）· 三包 **862/745/447** 全绿；**设计档收正（#7）**✓——3/3（`:406` 四面 · `:412` 锚归零 · `:324` 按面删净）· `doc-check` **悬空 1 → 0 · exit 0** ✓

**读数**：T-G1 3→**2** ✓ · T-G2 4→**3** ✓ · T-G5 `dataset.sub` undefined→命中 ✓ · T-G7 `.advisor-tool-line`→**`.advisor-text`** ✓ · **T-G8 五面认领→四面 + `toolResult` 返 false** ✓✓（即本轮原点）· T1 载荷 `face` 四值 + `tool` ✓ · 跨车道互证（#7 复跑读到的锚归零 = #6 新档已落 ✓）

**父侧裁定与采纳**：① **端差面（⑤-3）= 维持 R3 面门**（视觉等价 + 实现与 R3/T-G1 逐字一致 ✓）⇒ **设计档补一句端差登记**（不取对方字面块数对齐——那会改已评审的 R3 口径 ✗）；② 修正轮 ④ 三条设计档收正 = 接受 ✓；③ 遗留 ①②④ = 收口轮措辞/坐标/基线口径收正 ✓

**台账**：**#148 → 已核销** ✓

**遗留（显式）**：① §2.3 行 8 / §2.4 表头措辞（T-G8 实际落档 = `subagent-content-relay.test.mjs:151` ✓）· ② 坐标漂移（`WEBVIEW.md:399`/`:408`）· ③ CLI 首条输出并入调用块的端差登记句 · ④ 基线口径 308/309 · 120/121 差 1（Δ 列一致 ✓）—— 均属收口轮小笔 ✓。

**提交**：待入库（本笔 + 后批）。
