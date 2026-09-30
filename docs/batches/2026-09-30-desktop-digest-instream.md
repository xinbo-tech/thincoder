# 2026-09-30 · 桌面消化行流内落位
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 03:2x 走查（原话：「消化行应该在会话流中啊」「还想挂在这里啊」）：桌面消化行现为尾挂组、多轮全堆流尾——批 = 落位端差消（对齐 VSC 边界物模型 ∕ CLI 就地入流）。
> 台账 = #706（PROJECT.md（desktop） · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-30
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**用户走查（2026-09-30 03:1x–03:2x）**：原话「这部分内容还是显示在会话流尾部，多轮堆积在一起，这个不是应该修复过吗？为什么还是这样？」「消化行应该在会话流中啊！你想啥呢！还想挂在这里啊！」（图证 = 桌面会话流尾部 10 对「[auto-turn: digesting finished subagent reports…] ∕ Digested 1 background report(s) (Xs)」平铺堆积）。

**父侧诊断（证据链）**：① 09-21 批引入 digest 行族（`[auto-turn: digesting…]` 两行——当时要的就是这个）；② 09-29 批（#670 消化行组收口）对的是「**值**」（多轮累积 + 终态留存）——**未对「位」**：桌面 = **尾挂组**（`chat-digest.mjs`「组恒居块后」· `RENDERER.md` §1.1 根子序 · `PROJECT.md` KD-33「桌面无 digest 边界物 ⇒ atBoundary 恒按尾追」）⇒ 全夜十轮全堆流尾；③ VSC = 流内**边界物**（`chat-status.js:92` `_digestBoundary` + `activity.js:99-110` `insertBefore(块, 边界)`）∥ CLI = `pushLine` 就地入流（`TUI.md` §6.9）⇒ 本批 = **落位端差消**（桌面 → 流内就地）。

**条目**：台账 **#706**（requirement · PROJECT.md（desktop））。

**关键裁定（父侧）**：① 落位 = **会话流内就地（按发生序）**；对齐标尺 = VSC 边界物模型 ∥ CLI 就地入流——VSC ∕ CLI **零改**（仅登记对位）；② 五件连带（插入点纪律 ∕ 帧刷 ∕ 清点留存 ∕ KD-33 重裁 ∕ 端随动）全入设计面（§2 逐件有落点）；③ **U2 裁 (a)**：`RENDER-CORE.md:211 ∕ :414` 纳入本批——落点 = **实施后随动轮**（坐标以实施后实读为单源；不另派跨板文档轮）；④ 需求笔（`docs/desktop/requirements/PROJECT.md` §4 D4 邻域）= 主 agent，随批准轮落；⑤ 真机支 = 用户面走查（多轮 digest 场景重放）。

**授权口径**：本批 = 用户 03:2x 现场走查即时立批；设计评审点火沿 2026-09-30 00:14「排空」授权（父侧自缚三条件不变——#706 属用户直报条目，非射程外新范围）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（落位设计 + 判据腿三面 + 设计档顺落 + 修正轮 1 逐号点修（评审轮 1 · 发现 1 ∕ 3 ∕ 4 ∕ 5 ∕ 6；发现 2 父裁 Not an issue——2026-09-30））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**一、本批条目（覆盖）**
- 台账 **#706**（requirement · PROJECT.md（desktop））：消化行落位 = **会话流内就地（按发生序）**——现桌面尾挂组全轮堆流尾（用户 2026-09-30 03:2x 走查，实图 = 10 对「digesting… ∕ Digested…」堆底）。覆盖面 = **单轮 ∕ 多轮 ∕ 会话切回**三面 + 归档块锚随动。
- **五件连带（父侧点名）对应**：①插入点纪律 = §二.3 · ②帧尾态刷机制 = §二.4 · ③四清 ∕ 留存边界 = §二.6 · ④KD-33 重裁 = §二.7 · ⑤VSC ∕ CLI 随动 = **零改**（VSC 已逐轮独立元素 + 边界物——`thincoder-vscode/webview/chat-status.js:63-92` ∥ `activity.js:99-110`；CLI 已 `pushLine` 就地入流——`docs/cli/design/TUI.md` §6.9；本批仅登记对位）。
- 不在本批：需求档笔（主 agent——§八）· §4.1 ∕ §4.2 值列回填（归回填轮——as-of 政策；本批基线 = §四）· `RENDER-CORE.md` 两处跨板陈旧（上抛 U2）。

**二、机制设计（落位 = 流内就地）**
1. **节点形**：单组（现 `digestGroupNode(rounds)` 组内多轮平铺）⇒ **逐轮元素**——每轮一 `div.chat-digest[data-digest]`（类 ∕ 锚值零改；行集不变 = 起跑标签行 + `n > 0` 计数行 + cap 行；行内结构 ∕ 词面 ∕ 分档 ∕ `end` 原位更新 **零改**——单源 = `thincoder-vscode/webview/chat-status.js:69-122`）。`[data-digest]` 选择符语义 = **元素集**（原单组）——引用面收正三处 = `blockAnchor` ∕ `compressAnchorOf` ∕ `syncDigest`；CSS 后代选择器（`.chat-digest .digest-turn` 等）与注释面原样命中。
2. **落位（就地入流）**：`start` 帧轮元素插入**流末**（锚 = 新块同锚面：`[data-timer] ?? [data-stopped] ?? [data-ledger] ?? [data-card] ?? [data-pill]` 之前；全缺 ⇒ 根末）⇒ 此后新块随流居其下——轮行留**发生位置**、随流滚动；多轮 = 发生序（R1 → R2 → …，旧元素身份零动）。
3. **插入点纪律（分径——对齐 VSC）**：
   - **常规新块**（user ∕ assistant ∕ reasoning ∕ tool ∕ error）⇒ 流末挂载 = **轮行之下**（证据 = CLI `TUI.md` §6.9「起跑数行：标签行之后、`runAgentTurn` 之前 `pushLine`」= 起跑行在回合内容之上 ∥ VSC `thincoder-vscode/webview/ui.js:102` 常规块 `appendChild` 尾随）。
   - **归档块**（`kind: "subagent"`——消化回收入流）⇒ **末轮元素之前**（= VSC `thincoder-vscode/webview/activity.js:99-110` `insertBefore(块, S._digestBoundary)` 同形——「CLI 序：块在 digest 文本之前」；无轮 ∕ 元素缺 ⇒ 流末退化 = VSC `appendChild` 退化径同形）。锚 = 新导出 `digestBoundaryOf(root)`（末 `[data-digest]` 元素，文档序）。
   - `blockAnchor`（`thincoder-desktop/renderer/views/chat-chrome.mjs:191-195`）**去首锚 `[data-digest]`**——病根消：原「新块插组前 ⇒ 全轮被推流尾」；`compressAnchorOf`（`thincoder-desktop/renderer/views/compress-status.mjs:70-73`）同去（压缩行创建点 = 流末；冻结点语义不变）。
4. **帧刷（`syncDigest` 重写）**：逐轮元素按文档序配对——原位刷（幂等零写判据不变）；**追加 = 流末插新元素**（旧元素身份零动）；**收缩 = 保尾去首**（清点保「未结末轮」⇒ 存活元素 = 末元素**原位存续**；原「保首」映射在就地落位下会把末轮数据画在首元素位置——本批改为尾保）。
5. **重建径（`chatTree`）**：轮元素按模型序列于块序列之后（模型无位置载体——**登记**：locale 切换重建复聚流尾 = 留观项；活流主径不受影响）。
6. **归约面零改**（`events-wake.mjs` `onDigest` 多轮记录不动）· **清点判据零改**（`clearDigest`：终端整清 ∕ 未结末轮保 ∕ 零载体原引用——`page-read.mjs:136` 引调面零改）。
7. **KD-33 重裁**：`atBoundary` 由「恒按尾追（桌面无 digest 边界物）」⇒ **「末轮元素前插；无轮 ⇒ 流末退化」**（VSC `archiveBlock` 同形；原「无边界物」前提随本批消失）。

**三、设计档落点（本批顺落）**
- `docs/desktop/design/RENDERER.md` §1.1 四处（归约面条 `:42` ∕ `:45` · 帧尾态刷条 `:68-69` · 插入点纪律条 `:71-73` · 流内非块节点族条 `:81`）+ 变更记录。
- `docs/desktop/design/UI.md` §1 对话流行行（` :18` digest 句）+「本批注（对齐第二批）」项 5（`:329` atBoundary 句）+ 变更记录。
- `docs/desktop/design/PROJECT.md` §2 **KD-33** 行 + 变更记录；§4.1 ∕ §4.2 值列 = 归回填轮（as-of 政策——本批基线见 §四）。

**四、受影响文件与测试面（现行 ⇒ 预期；内容行数口径）**
| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/chat-digest.mjs` | **197**（实读）**⇒ ≈245（+≈48）**——逐轮同步重写 ∕ `digestBoundaryOf` 新导出 ∕ `digestGroupNode` ⇒ `digestRoundNode` 更名 ∕ 注释 | 落位全族 |
| 2 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **216**（实读）**⇒ ≈220**——`blockAnchor` 去首锚 ∕ 再出口一名 | 锚面 |
| 3 | `thincoder-desktop/renderer/views/chat.mjs` | **300**（实读）**⇒ ≈300–305**（行内改述为主）——`mountTail` 归档锚 ∥ 构树逐轮；**若越 300 ⇒ 越层段补登 + 预案（构树面出档）** | 构树 ∕ 尾段挂载 |
| 4 | `thincoder-desktop/renderer/views/compress-status.mjs` | **75**（#674 实读）**⇒ 75（净 0）**——锚链去 `[data-digest]` | 锚面 |
| 5 | `thincoder-desktop/renderer/chat.css` | **331**（实读）**⇒ ≈331（注释随动）** | 注释 |
| 6 | `thincoder-desktop/renderer/views/chat-model.mjs` | **104**（#690 as-of）**⇒ 104（注释随动）** | 注释 |
| 7 | 测试面 | 批内件 = `docs/batches/2026-09-30-desktop-digest-instream.test.mjs`（三腿——§五；批内件惯例——沿 digest-parity 批先例）；原 digest 测试随 2026-09-28 测试树重置已退役——重建时按本批判据补例；**仓套件 = 收口轮父侧跑（非本批）** | 全批 |
| 8 | 设计档 | RENDERER ∕ UI ∕ PROJECT 三档（本批顺落，见 §三） | 全批 |

**五、验收对照（判据腿——可机检）**
- **腿 1（单轮就地）**：伪 DOM 根 = 块序列 + 尾组；`start` + sync ⇒ 轮元素居「发生点」；随后新块挂载 ⇒ 新块位于轮元素**之后**；归档块挂载 ⇒ 位于**末轮元素之前**。
- **腿 2（多轮）**：R1 ∕ R2 文档序 = 发生序；跨帧旧元素**节点身份零动**（同态帧零重建）；非尾聚判据 = R1 之后仍有块内容（随流下延）。
- **腿 3（切回 ∕ 清点）**：收缩（保末轮）⇒ **末元素原位存续**（身份保）∧ 前元素摘；全终态 ⇒ 零元素；零载体 ⇒ 原引用零写。
- **真机支（列报）**：多轮 digest 演练走查（实图对拍——10 对场景重放）；locale 切换重建复聚 = 留观项。

**六、关键决策**
- **D1 落位 = 就地入流**（轮行在内容之上 ∕ 常规内容随流居下）——否：边界前插一切（= 病根复现：末轮永沉流尾）。证据 = CLI `TUI.md` §6.9 ∥ VSC `ui.js:102`。
- **D2 归档块 = 末轮元素前插**（VSC 同形）——否：一律流末（丢 VSC「块在 digest 文本之前」序）。
- **D3 收缩 = 保尾去首**——否：保首（错位映射——末轮数据画在首元素位置）。
- **D4 重建 = 模型序复列（不引轮锚字段）**——否：模型锚（须活动键限定 + 页读失效 ⇒ 成本 > 收益）；登记 = locale 切换复聚流尾。
- **D5 归约面 ∕ 清点判据零改**；KD-33 重裁 = 末轮边界前插。

**七、上抛（2）**
- **U1**：① 批档 §1 正文仍为模板占位（讨论未落——状态行「进行中」）；本批设计依据 = 用户走查原文 + 父侧简报 + 台账 #706——请主 agent 补 §1（或裁定免）。② 批档头台账占位已按台账实读机械填为 **#706（PROJECT.md（desktop） · 归批）**（写盘闸前置——本次回执）。
- **U2**：`docs/render-core/design/RENDER-CORE.md` 两处跨板陈旧——`:211`（「归档入流 = 消化边界前插入…桌面 `subagent-reduce.mjs:93-112`」）∥ `:414`（「③ 桌面无 digest 边界物 ⇒ 归档 atBoundary 恒按尾追」）：本批 KD-33 重裁后 `:414` 前提消失、`:211` 桌面侧形态收正——请裁（a）本批顺笔（跨板）∥（b）另派 render-core 板文档轮。

**八、需求笔（列报 · 需求档零触）**：`docs/desktop/requirements/PROJECT.md` §4 **D4** 邻域（「挂起态与 digest + 空闲唤醒 + 完成提示面」）——落位口径（流内就地）如需在需求档显式落字，请主 agent 笔。

### 修正轮记录（评审轮 1）

**轮次**：fix · eng-designer · 2026-09-30 03:5x（落笔实读）——承 §3 轮次 1（changes-required：🔴×1 ∕ 🟡×2 ∕ 🔵×3 = 6 条）。**父侧裁**：发现 1 ∕ 3 ∕ 4 ∕ 5 ∕ 6 全部接受、按评审建议修（Suggestion 列 = 评审建议，执行 = 本设计轮）；**发现 2 = 父裁 Not an issue（§1 `:9–:17` 正文在位；`:7` = 合法骨架占位行）——不入本轮**。**执行口径**：逐号点修（不重新勘察）；批档面修正 = 本小节载明（append-only——§2 前文原文照旧；凡与原文相抵处，以本小节为准）；设计档面就地收正（RENDERER ∕ UI ∕ PROJECT 三档）；产品码 ∕ 测试件零触；不 re-run 评审；不扩新项。

**逐号修复表（号 → 改动 file:line）**

| # | 级 | 修复 | 改动（file:line） |
|---|---|---|---|
| 1 | 🔴 | 归档块锚补**块序守卫**（处置 = 二择一取 ㈠「守卫」——见 ①；原文 `:33` ∕ `:38` ∕ `:58` 与守卫相抵处留档，以本小节为准） | 本 §2（①——批档侧权威句）；`docs/desktop/design/RENDERER.md:71` ∕ `docs/desktop/design/UI.md:329` ∕ `docs/desktop/design/PROJECT.md:72`（KD-33） |
| 3 | 🟡 | `chat.css` 逐条二分核毕——六规则**皆逐轮自洽 · 零值改**（见 ②；`:52`「注释随动」维持） | 本 §2（②——核查结论）；`thincoder-desktop/renderer/chat.css`（实读面——零改） |
| 4 | 🔵 | 重建复聚登记落 **§10 CR** 行 + 半句「复聚含压缩行 ∕ 消化行族相对序翻转」；登记指针改指 §10 CR（见 ③；`:36` 原文留档） | 本 §2（③）；`docs/desktop/design/PROJECT.md` §10（**CR** 行）· `docs/desktop/design/RENDERER.md:73` |
| 5 | 🔵 | 实读现盘数入册（六档真值——内容行数口径）+ 回填轮收口句（见 ④） | 本 §2（④） |
| 6 | 🔵 | `syncDigest` 居住档点名（§二.4——见 ⑤；`:35` 原文留档）；`RENDERER.md:68` 档面指涉收正 | 本 §2（⑤）；`docs/desktop/design/RENDERER.md:68` |

**① 发现 1 处置（守卫定形——批档侧权威句；`RENDERER.md:71` ∕ `UI.md:329` ∕ KD-33 同口径已落）**：**归档块锚 = 末轮元素之前——唯经块序守卫**——守卫 = 末 `[data-digest]` 元素**即块序尾位**（其后无块节点〔`[data-block-kind]`〕，文档序）⇒ 边界前插；否则退化 = **常规块插入点**（`blockAnchor` 链——块序尾位；无轮 ∥ 元素缺 = 守卫不过特例）。锚函数 = `digestBoundaryOf(root)`（末 `[data-digest]` 元素，文档序——守卫不过 ⇒ 回落 `blockAnchor(root)`）；守卫 = 纯 DOM 文档序谓词（挂载点逐枚现读；零帧面记账）。**两径皆落块序尾位** ⇒ `RENDERER.md` §2 不变式（DOM ≡ `visible`，`:136`）、运行期块记账（`:130`）、对齐步（`alignPlan` ∕ `mounted` 记账，`:131-135`）、尾段挂载指针句（`:148`）**零改**。**否 ㈡（显式登记「离序插入」）**：重建径无位置载体（D4）——离序位一遇重挂即失（重挂按模型序 ⇒ 复位块序尾），登记面自相抵。**连带自洽核查**：重建径 D4（模型序复列）自洽（守卫仅约束活流插入点；重建前后 DOM 块序皆 ≡ 模型序）；`UI.md:328`（块序 = 归档序）∥ `:332`（机检 = `blocks` 尾块 `kind:"subagent"`）**零改**（守卫下两语句保持真——两径皆落块序尾位）。

**② 发现 3 核查结论（`thincoder-desktop/renderer/chat.css` 实读——逐条二分）**：六规则逐条核过——`.chat-digest .digest-turn`（`:283`）· `.chat-digest .digest-status`（`:289`）· `.chat-digest .digest-status.digest-done`（`:298`）· `.chat-digest .digest-status.digest-failed`（`:302`）· `.chat-digest .digest-cap`（`:310`）· `.digest-cap.digest-cap-stop`（`:317`）：**皆逐轮自洽**（后代选择器原样命中；`.chat-digest` 自身零盒规则 ⇒ 无组级盒值逐元素套用改观感；跨轮相邻距 = 边距塌缩同值 6px——组模型 ∕ 逐轮模型两式同值）。**零值改** ⇒ `:52`「注释随动」维持；注释面三处随实现轮笔（`:277` 组名句 ∕ `:277-278` 落点句「块序列之后、待发送组之前」 ∕ `:279` 行集句「多轮平铺」）。

**③ 发现 4 登记（重建复聚）**：留观项落 `docs/desktop/design/PROJECT.md` §10 **CR** 行（耐久台账——复聚含压缩行 ∕ 消化行族相对序翻转 + 暴露面按页读四清界定量）；`RENDERER.md:73` 与本节登记指针改指 §10 CR。

**④ 发现 5 值列对账（实读现盘数——内容行数口径，文末换行不计 · 2026-09-30）**：`chat-chrome.mjs` **215** · `chat.mjs` **299** · `compress-status.mjs` **75** · `chat.css` **330** · `chat-digest.mjs` **197** · `chat-model.mjs` **104**。注：§四「现行」列三处为分行（split）口径读数（`chat-chrome.mjs` 216 ∕ `chat.mjs` 300 ∕ `chat.css` 331——各 +1）；§四 ∕ §4.1 记录值差（`compress-status.mjs` 74 ⇒ 75 · `chat.css` 329 ⇒ 330 · `chat-digest.mjs` 133 ⇒ 197）归回填轮。**回填轮按盘收口 §4.1 ∕ §4.2 + `chat-digest.mjs` 差值归因**；§4.1 ∕ §4.2 本体仍归回填轮（as-of 政策）；§四「现行」列原值留档（真值以 ④ 为准）。

**⑤ 发现 6 居住档点名**：§二.4（`:35`）`syncDigest` 居住档点名 = `thincoder-desktop/renderer/views/chat-digest.mjs`（以本小节为准）；`RENDERER.md:68` 陈旧指涉收正——帧尾态刷出档 = `thincoder-desktop/renderer/views/chat-chrome.mjs`（`PROJECT.md` §4.1 `:244` 同源；帧尾调用点 = `views/chat.mjs` `settleFrame` ③；重挂径调用点 = `app.mjs:171` ∕ `:180`；实读）。

**语义零变声明（逐条）**：① = 插入点判据补全（守卫——二择一裁 ㈠，父侧授权「你定」；前插径语义保持 ∕ 退化径落位精确化）· ② = 核查落字（零值改结论）· ③ = 记录面补全（登记耐久化）· ④ = 读数收正 · ⑤ = 点名 ∕ 指涉收正。产品码 ∕ 测试件零触 ✓；`RENDER-CORE.md` 零触 ✓（归实施后随动轮）；不 re-run 评审 ✓。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 归档块锚与既约不变式相抵：批档 `docs/batches/2026-09-30-desktop-digest-instream.md:33` 定「归档块（`kind:"subagent"`）⇒ **末轮元素之前**」，`:58` 腿 1 同判（「随后新块挂载 ⇒ 新块位于轮元素**之后**；归档块挂载 ⇒ 位于**末轮元素之前**」）；而 `docs/desktop/design/RENDERER.md:136` 明定「非重挂帧收尾后 DOM 块节点序 ≡ 帧内 `visible`（逐位引用等）」（`:131` 认证同源 ∕ 对齐步判据），`:130` 认证运行期块**计入块序 ∕ `data-blocks`**；`docs/desktop/design/UI.md:328` 又述「块序 = 归档序（与 VSC 的 append 序同形）」、`UI.md:332` 机检断言「`blocks` **尾块** `kind:"subagent"`」。当末 `[data-digest]` 元素之下已有后到块（本批正题 = 新块随流居轮行之下）时，「末轮元素之前」= 块序列**中段插入** ⇒ DOM 块节点序 ≠ `visible`（模型尾块落中段），而 `RENDERER.md:148` 尾段挂载插点仍单指 §1.1 插入点纪律——本设计未给守卫 ∕ 例外句。（源档不可读 ⇒ 源码面未核；以上皆文档内自证） | 明确分径与守卫（例：末 `[data-digest]` 元素即块序列尾位 ⇒ 边界前插；否则流末退化），或显式登记「归档块允许离序插入」并同笔改述 `RENDERER.md` §2 不变式句 + 对齐步（`alignPlan` ∕ `mounted` 记账）处置；`UI.md:328` ∕ `:332` 块序句同口径随动 |
| 2 | Methodology | 🟡 | 批次档 §1（讨论）仍为模板占位（`:7`）、状态行「进行中」（`:6`）——讨论面不可追溯（设计自陈上抛 = `:71` U1；设计依据只见于 §2 自述 + 台账 #706） | 补 §1 正文（本批条目 / 关键判据 / 授权口径），或落免裁句并写明依据面（用户 2026-09-30 03:2x 走查原文 + 台账 #706） |
| 3 | Affected-file annotations | 🟡 | 元素形由「组内多轮平铺」改「逐轮 N 元素」（`:29`「类 ∕ 锚值零改」）后，`chat.css` 判为「注释随动」（`:52`）——组级盒规则（外边距 ∕ 边框 ∕ 间距族）逐元素套用会改观感；设计只断言后代选择器「原样命中」，未给组级规则的核查结论（源档不可读 ⇒ 未核） | 落一条核查句：逐条过 `chat.css` 中 `.chat-digest` ∕ `.digest-*` 规则，二分「逐轮自洽」与「须改值」；若须改值 ⇒ `:52` 行改记实增行数 |
| 4 | Clarity | 🔵 | 重建 ∕ 重挂径复聚仅以「登记 = 批档 §2」为指针（`RENDERER.md:73`、批档 `:36`）；且复聚同含**压缩行 ∕ 消化行族相对序翻转**（活流 = 按时点先后；`RENDERER.md:73` 根子序 = 压缩行在前）未点名 | 留观项落 `PROJECT.md` §10 一行（耐久台账）+ 补半句「复聚含着压缩行 ∕ 族相对序翻转」；暴露面按页读四清界定量（终态轮不跨首屏读） |
| 5 | Affected-file annotations | 🔵 | 「现行」列与 `PROJECT.md` §4.1 记录值对不齐：`chat-chrome.mjs` 216 ∕ `:244` = 215 · `chat.mjs` 300 ∕ `:241` = 299 · `compress-status.mjs` 75 ∕ `:292` = 74 · `chat.css` 331 ∕ `:213` = 329 · `chat-digest.mjs` 197 ∕ §4.1 仅记 **133**（`chat-model.mjs` 104 ∕ `:242` = 104 ⇒ ≈106）；设计声明值列归回填轮（`:43`） | 回填轮按盘实读逐档收口 §4.1 ∕ §4.2，与本批批档 §四同笔对齐；`chat-digest.mjs` 补登记 133 ⇒ 197 的差值归因（或补真值） |
| 6 | Clarity | 🔵 | `syncDigest` 改写（`:35`）未点名居住档；`RENDERER.md:68` 仍记帧尾态刷 `syncChrome` 居「`chat.mjs` DOM 面」，而 `PROJECT.md` §4.1（`:244`）记帧尾态刷已出档 `views/chat-chrome.mjs` | §二.4 点名 `syncDigest` 居住档（按 `:48` 行 = `chat-digest.mjs`）+ 顺笔收正 `RENDERER.md:68` 档面指涉 |

计数：🔴 1 · 🟡 2 · 🔵 3（合计 6）

VERDICT: changes-required

### 轮次 2（评审子代理）

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/desktop/design/RENDERER.md:71` ∕ `UI.md:329` ∕ `PROJECT.md:72`（KD-33）· 批档 §2 修正轮块 ①（`:90`） | 🔴 | Fixed（已核） | 守卫三档同口径已落。`RENDERER.md:71`：「**归档块（`kind: "subagent"`）例外 = 末轮元素之前——唯经块序守卫**（守卫 = 末 `[data-digest]` 元素即块序尾位〔其后无 `[data-block-kind]` 块节点，文档序〕⇒ 前插；否则退化 = 常规块插入点〔本条前段通条〕；无轮 ∥ 元素缺 = 守卫不过特例——两径皆落块序尾位 ⇒ 本档 §2 不变式（DOM ≡ `visible`）与对齐步零改）」；`UI.md:329`：「**归档块锚 = 末轮元素之前——唯经块序守卫**（末轮元素即块序尾位〔其后无块节点〕⇒ 边界前插；否则退化 = 常规块插入点；无轮 ∕ 元素缺 = 守卫不过特例——两径皆落块序尾位」；KD-33 同句。**推证成立**：常规插入点 = 首个尾组∕卡∕药丸之前（其后无块节点）⇒ 两径皆落块序尾位 ⇒ §2 不变式 `:136`（「非重挂帧收尾后 DOM 块节点序 ≡ 帧内 `visible`」）、运行期块记账 `:130`、对齐步 `:131-135`、尾段挂载 `:148` 零改皆逐处实读在位 ✓；被否 ㈡（离序插入登记）已给由（重建径无位置载体 · 一遇重挂即复位）✓ |
| 2 | 2 | 批档 §1（`:5`–`:17`） | 🟡 | Not an issue（父裁成立 · 已核） | `:7`＝「<§1 模板占位：本批条目 / 关键判据 / 授权口径>」（合法骨架占位行）；§1 正文在位——`:9` 用户走查原文 ∕ `:11` 父侧诊断证据链 ∕ `:13` 条目 ∕ `:15` 关键裁定（含五件连带与 U2 裁） ∕ `:17` 授权口径 ✓ ⇒ 原 🟡 撤回 |
| 3 | 3 | 批档 §2 ②（`:92`） | 🟡 | Fixed（已核） | 核查句已落：六规则逐条点名（`:283` ∕ `:289` ∕ `:298` ∕ `:302` ∕ `:310` ∕ `:317`）＋「**皆逐轮自洽**（后代选择器原样命中；`.chat-digest` 自身零盒规则 ⇒ 无组级盒值逐元素套用改观感；跨轮相邻距 = 边距塌缩同值 6px）」＋「**零值改** ⇒ `:52`「注释随动」维持」＋注释面三处随实现轮笔（`:277` ∕ `:277-278` ∕ `:279`）。`chat.css` 本体超本评审射程——其读数为设计侧实读声明，in-scope 核查句已落 ✓ |
| 4 | 4 | `PROJECT.md:1247`（§10 **CR**）∥ `RENDERER.md:73` | 🔵 | Fixed（已核） | CR 行在位：「| CR | **重建 ∕ 重挂径复聚（桌面消化行流内落位批 · 2026-09-30 · 台账 #706）**…**复聚含压缩行 ∕ 消化行族相对序翻转**…暴露面按页读四清界定量（终态轮不跨首屏读）」；指针改指 §10 CR：「重建径无位置载体 ⇒ 复聚流尾 = 登记（`docs/desktop/design/PROJECT.md` §10 **CR**——复聚含压缩行 ∕ 消化行族相对序翻转）」✓（半句 + 暴露面界定量皆落；`PROJECT.md:1613` 变更记录同拍） |
| 5 | 5 | 批档 §2 ④（`:96`）∥ §四值列 | 🔵 | Fixed（已核） | 实读真值入册：「`chat-chrome.mjs` **215** · `chat.mjs` **299** · `compress-status.mjs` **75** · `chat.css` **330** · `chat-digest.mjs` **197** · `chat-model.mjs` **104**」＋ §四 +1 三处归因（分行口径 216 ∕ 300 ∕ 331）＋「§四 ∕ §4.1 记录值差（`compress-status.mjs` 74 ⇒ 75 · `chat.css` 329 ⇒ 330 · `chat-digest.mjs` 133 ⇒ 197）归回填轮」✓ §四原值留档 +「真值以 ④ 为准」声明在位（`PROJECT.md:1612` 值列归回填轮同拍） |
| 6 | 6 | 批档 §2 ⑤（`:98`）∥ `RENDERER.md:68` | 🔵 | Fixed（已核） | 居住档点名：「§二.4（`:35`）`syncDigest` 居住档点名 = `thincoder-desktop/renderer/views/chat-digest.mjs`（以本小节为准）」；`RENDERER.md:68` 收正：「帧尾态刷出档 = `thincoder-desktop/renderer/views/chat-chrome.mjs`——帧尾调用点 = `thincoder-desktop/renderer/views/chat.mjs` `settleFrame` ③；重挂径调用点 = `thincoder-desktop/renderer/app.mjs:171` ∕ `:180`」✓ |
| 7 | (new) | 批档 `:58`（腿 1）∥ `:65`（D2）∥ `:78`/`:84` 留档声明 | 🔵 | New（记录面残形——不阻塞） | 腿 1 断言仍为未守卫形：`:58`「归档块挂载 ⇒ 位于**末轮元素之前**。」；`：65`「**D2 归档块 = 末轮元素前插**（VSC 同形）——否：一律流末」。修正块已声明「原文 `:33` ∕ `:38` ∕ `:58` 与守卫相抵处留档，以本小节为准」（`:78` ∕ `:84`），D2 由通句「凡与原文相抵处，以本小节为准」覆盖 ⇒ 非缺陷升级；**风险点** = 批内件按 §五 建（`:54`「三腿——§五」），而腿 1 断言语境（轮元素之后有新块）恰是守卫不过径 ⇒ 按原文建件会与守卫相抵——建议 §五 补一行指针句（或腿 1 改守卫形）供实施 ∕ 建件轮 |

计数：前轮 6 条已结（🔴 1 已消 · 🟡 2 已消〔含 1 条父裁 Not an issue——已核〕· 🔵 3 已消）；新发现 🔵×1（记录面残形指引）。**🔴 0 · 🟡 0 · 🔵 1**——新 🔴 零 ⇒ 修正面自洽，未引入新缺陷。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30 · 沿 00:14「排空」授权）**

- **三条件核检**：① **评审 pass**——设计评审 #29 轮 2（VERDICT: pass · 🔴 0 ∕ 🟡 0 ∕ 🔵 1〔记录面残形指引——非阻断〕；§3 轮次 2 在册）✓；② **修正轮已落地并逐条核验**——#28 修正轮（发现 1 ∕ 3 ∕ 4 ∕ 5 ∕ 6 全落：守卫径三档同口径 ∥ `chat.css` 核查句 ∥ §10 CR 行 ∥ 值列对账 ∥ `RENDERER.md:68` 收正）+ 父侧逐处抽读核验 ✓；③ **设计 token 已签发**（凭证值不入档）✓。
- **批准范围**：批档 §2 全部（含修正轮块 ① **守卫形**——**实施单源**）。
- **授权链**：用户 2026-09-30 03:2x 现场走查（本批条目 #706 直报）→ 00:14「后续这些任务你自动跑」（会话级全链授权——新批在射程内自开；§1 在册）→ 父侧代签。
- **裁定注**：轮 2 新 🔵（§五 腿 1 记录面残形）= **Deferred**——修正块前言已给总指针（「凡与原文相抵处，以本小节为准」）；实施轮任务书将显式按守卫形立腿（风险在派发层闭合；§2 原形按 append-only 制不回改）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（落位 = 逐轮元素 · 流内就地（构树 ∕ 帧刷 ∕ 锚 ∕ 守卫形全族）· 批内件红→绿两相在案（腿 1a ∕ 1b ∕ 2 ∕ 3 + 引用面收正，5 腿）· 内部审计 1 轮 clean ∕ 代码评审 1 轮 pass · 终态 clean）



**轮次**：impl · eng-coder · 2026-09-30 04:0x（落笔实读）——任务书 = §2 全部（以「修正轮记录（评审轮 1）」块 ① **守卫形**为插入点纪律权威句）；实施点 = §二.1–§二.7 逐条；零触面 = VSC ∕ CLI ∥ `thincoder-render-core/**` ∥ `RENDER-CORE.md` · 归约面（`events-wake.mjs`）· 页读面（`page-read.mjs`）；未跑仓套件（父侧收口轮）。

**交付摘要**：落位端差消（尾挂组 ⇒ 流内就地）——① 节点形 = **逐轮元素**（`digestRoundNode`；类 ∕ 锚值 ∕ 行集 ∕ 词面 ∕ 分档零改）② 落位 = `start` 帧落流末（锚 = 新块同锚面）· 随流滚动；**常规新块随流居轮行之下**（`blockAnchor` ∕ `compressAnchorOf` 去 `[data-digest]` 首锚）③ **归档块 = 末轮元素之前——唯经块序守卫**（守卫不过 ⇒ 常规块插入点；挂载点逐枚现读）④ 帧刷 `syncDigest` = 逐轮元素**文档序配对**（原位刷 ∕ 追加 = 流末新元素 ∕ 收缩 = **保尾去首**）⑤ 重建径 = 模型序复列（登记 = `PROJECT.md` §10 **CR**）⑥ 归约面 ∕ 清点判据零改；`digestAnchorOf` 随「锚 = 新块同锚面」退场。

**逐点落位（落笔后实读 · 行数 = 内容行）**

| # | 档 | 落点（实读 file:line） | 读数 |
|---|---|---|---|
| 1 | `renderer/views/chat-digest.mjs` | 头注五名 `:2-14` · `digestRoundNode:89-91` · 判据 `digestPresent:95-97` · 逐轮原位 `syncRound:112-140` · 逐元素配对 `syncRounds:146-159`（保尾去首 `:147-149` ∕ 追加流末 `:154-158`）· 帧刷 `syncDigest:165-174` · 清点 `clearDigest:179-189` · 界锚 `digestBoundaryOf:196-201`；旧导出 `digestGroupNode` ∕ `digestAnchorOf` 退场（活代码零引用） | 197 ⇒ **201**（预测 ≈245——重写以「配对 ∕ 保尾 ∕ 守卫」三段收紧，预测高估；≤ 预期 ✓） |
| 2 | `renderer/views/chat-chrome.mjs` | `blockAnchor:193-196`（去首锚 —— 新链 timer→stopped→ledger→card→pill）· 再出口 `:21`（`digestBoundaryOf` ∕ `digestPresent` ∕ `digestRoundNode`）· 帧刷引调 `:163`（锚改 `blockAnchor(root)`）· 注释随动 | 215 ⇒ **217**（预测 ≈220 ✓） |
| 3 | `renderer/views/chat.mjs` | `mountTail:210-220`（归档块锚分径 `:218` = `digestBoundaryOf(root, blockAnchor(root))` —— 逐枚现读）· 构树逐轮 `:139-140` · 头注 ∕ 根子序句随动 | 305 ⇒ **305**（净 0；**越 300 建议线事实在册**——见限度段） |
| 4 | `renderer/views/compress-status.mjs` | `compressAnchorOf:69-75`（去 `[data-digest]` 首锚）+ 头注族序句 | 75 ⇒ **75**（净 0 = 预测 ✓） |
| 5 | `renderer/chat.css` | 族头注 `:277-280`（族名 ∥ 落点 = 流内就地 ∥ 行集 = 每轮一元素） | 330 ⇒ **330**（净 0；预测 ≈331 ✓） |
| 6 | `renderer/views/chat-model.mjs` | `:33` 注释（`[data-digest]` 族〔逐轮元素〕） | 104 ⇒ **104**（净 0 ✓） |
| 7 | `docs/batches/2026-09-30-desktop-digest-instream.test.mjs` | 新建（腿 1a ∕ 1b〔守卫两径 + 同帧组合序〕· 腿 2 · 腿 3 · 引用面收正） | — ⇒ **494** |

**批内件两相读数**（同件同命令 = `node --test docs/batches/2026-09-30-desktop-digest-instream.test.mjs` · cwd = `thincoder/`）

- **红相（改前盘 · 同会话内实跑）**：**0 pass ∕ 5 fail**（exit 1）——逐例：腿 1a `TypeError: digest.digestRoundNode is not a function` ∥ 引用面同 `TypeError` ∥ 腿 1b `AssertionError: 常规新块随流居轮行之下`（前态 = 新块插组前）∥ 腿 2 `逐轮元素（R1 ∕ R2 各一枚）1 !== 2` ∥ 腿 3 `两轮元素在场 1 !== 2`（前态 = 单组形）。
- **绿相（现盘）**：**5 pass ∕ 0 fail**（exit 0）。
- 注：红相为改前盘**同会话实跑读数**（未复刻改前盘镜像——与 09-29 parity 批「镜像盘复读」之差如实登记；复读需求 ⇒ 按 §2 现行句 + 本表逐例读数重建）。

**决策透明表**

| # | 决策 | 理由 |
|---|---|---|
| 1 | `digestBoundaryOf(root, fallback)` 的回落由**调用面组合**（`chat.mjs:218` = `digestBoundaryOf(root, blockAnchor(root))`） | `chat-digest.mjs` 档头「零反向 import ⇒ 无环」约束 ⇒ 不在函数内直调 `blockAnchor`；档面语义句「守卫不过 ⇒ 回落 `blockAnchor(root)`」由调用面逐枚现读实现（行为逐字等价） |
| 2 | `digestAnchorOf` **退场**（非改名） | §2.1「引用面收正三处」不含它 + §2.2「锚 = 新块同锚面」⇒ 保留即成第二条链（单源违规） |
| 3 | 收缩 = **保尾去首**（`syncRounds:147-149`） | 与「清点保末轮」（`clearDigest`）同拍 —— 存活元素 = 文档序末 N 枚（末元素原位存续）；保首会把末轮数据画在首元素位 |
| 4 | 守卫谓词 = 「`[data-digest]` ∪ `[data-block-kind]` 文档序末枚为 digest」 | 与修正轮块 ①「末轮元素即块序尾位（其后无块节点）」逐条等价；单选择符取件（不引 `compareDocumentPosition`，假 DOM 可注入） |
| 5 | 注释面族名收正（老词「消化行组」⇒「消化行族」）+ `chat.mjs:62` 计数「五件 ⇒ 六件」 | 触碰面同笔收正（零语义）；`events-wake ∕ page-read ∕ frame-dispatch ∕ chat-subagent` 不在本批写域 ⇒ 只报不改 |
| 6 | 同帧组合序用例补（腿 1b 末景） | 守卫「挂载点逐枚现读」边界（同帧常规块翻转守卫 ⇒ 归档块退化径）无旧例固定；补例后产品码零动 |

**审计与代码评审轮次与终态**

- **内部探索审计（只读 · 偏差审计）**：1 轮 —— **VERDICT: clean**（四类偏差零：无部分实现 ∕ 无静默简化 ∕ 无清单外改动 ∕ 文档三档同口径）；🔵×5 记录（`API-CONTRACT.md` 生成档三行陈旧 = 父侧重生成待办 ∕ 老族名残于非本批面 ∕ §5 未落〔本段即补〕∕ `chat.mjs` 305 越线登记〔转父侧〕∕ 红绿读数复现面）。
- **内部代码评审（advisor · code）**：1 轮 —— **VERDICT: pass**（🔴 0 · 🟡 1 · 🔵 3）——响应：🟡 `chat.mjs` 305 越 300 + 批档 §四「若越 300 ⇒ 越层段补登 + 预案（构树面出档）」未兑现 = **本席无设计档写域** ⇒ 上抛父侧（见限度段）；🔵 §5 空 = **本段即补**；🔵 `chat.mjs:62` 计数 = **已修**；🔵 同帧组合序用例缺 = **已补**。
- **fix round**：1 轮（评审后自修 = 上述两 🔵：注释计数 + 用例；产品码零语义改）。
- **终态**：**clean**（审计 ∕ 评审两轮毕；评审 pass；🟡 一项 = 越线登记面转父侧，非产品码缺陷）。

**限度 ∕ 登记**

- **`chat.mjs` 305 越 300 建议线**（本批净 0；设计基线 299 系他批漂移后之现盘）：批档 §四预置句「若越 300 ⇒ 越层段补登 + 预案（构树面出档）」未兑现 —— `PROJECT.md:241` 仍记 **299**、§4.1 越层段无 `chat.mjs` 条目；**本席无设计档写域 ⇒ 转父侧**（回填轮 ∕ 另派；预案在册 = 构树面出档）。
- **红相未留镜像盘**（见上）；仓套件 = 父侧收口跑（本席未跑全仓）。
- **邻批件复跑影响登记**（非本批写域 · 本席未改）：`docs/batches/2026-09-29-desktop-digest-parity.test.mjs:190 ∕ :212`（调 `digestGroupNode`）∥ `docs/batches/2026-09-29-structure-split-2.test.mjs:112 ∕ :113 ∕ :123`（导出名集 ∕ 再出口名断言）——API 收正后失效；两件皆批内件（不进仓套件）⇒ 建议父侧随动登记。
- **真机支**（列报）：多轮 digest 演练走查 ∕ locale 切换复聚 = 归父侧。

## §6 验证与收口（父代理）

**验证读数（父侧独立复核 · 2026-09-30 04:1x）**

- **批内件父侧复跑**：`…-digest-instream.test.mjs` = **5/5 绿 · 0 fail**（舱内先红 0/5 → 后绿 5/5——红相 = `digestRoundNode is not a function` ×2 ∥ 腿 1b「常规新块随流居轮行之下」∥ 腿 2/3 单组形）。
- **守卫实现逐字实读**：`chat-digest.mjs:196-201`（`digestBoundaryOf(root, fallback)`——查 `[data-digest], [data-block-kind]` 取文档序末位、是 digest 元素才前插、否则 `fallback`）∥ 调用面 `chat.mjs:218`（`digestBoundaryOf(root, blockAnchor(root))`——`plan.tail.forEach` 内逐枚现读）——**与 §2 修正轮块 ① 一致** ✓。
- **行数账（内容行数）**：`chat-digest.mjs` 197⇒**201**（≤≈245 ✓）· `chat-chrome.mjs` 215⇒**217**（≤≈220 ✓）· `chat.mjs` **305**（净 0——**越 300 建议线系入批前既态**，预案 ∕ 登记归回填轮——U1）· `compress-status.mjs` 75 ∥ `chat.css` 330 ∥ `chat-model.mjs` 104——全在 §四预期内。
- **舱内轮次**：内部审计 1 轮 clean · 代码评审 1 轮 pass（🔴0 · 🟡1 · 🔵3）· fix 1 轮（两 🔵 自修：计数 ∕ 同帧组合序用例）——终态 clean（§5 在册）。

**结算清单（D7）**

- 六座：§1 ✓ ∥ §2 ✓（六块 + 修正轮块）∥ §3 ✓（两轮）∥ §4 ✓（代签）∥ §5 ✓（实施轮）∥ §6 = 本段。
- 台账：**#706 → 已核销**（本笔）。
- 上抛处置：**U1**（`chat.mjs` 305 ∥ `PROJECT.md:241` 记 299）→ **#708**（回填轮：越层段补登 + §4.1 ∕ §4.2 值列收口）· **U2①**（API-CONTRACT 生成区三处）→ **父侧已随动**（`--check` 漂移〔盘 2697 ∕ 生成 2727〕⇒ `--write` **2725 条 · 606 档** ⇒ `--check` **零漂移 exit 0**）· **U2②**（邻批件两枚：`desktop-digest-parity.test.mjs:190 ∕ :212` ∥ `structure-split-2.test.mjs:112 ∕ :113 ∕ :123`——API 改形后失效）→ **#708**（收正 ∥ 退役二择）。
- 残留（入册不阻收）：`RENDER-CORE.md:211 ∕ :414` 实施后随动 → **#708 已含**；跨实例写意图提示一次（`chat.mjs`——他实例声明；本席改动已落盘并复核在位——§5 披露）。
- **暂缓批复核：无。**

**收口**：全链闭合（走查 → 设计 → 评审两轮 → 修正 → 代签 → 实施（先红后绿）→ 父侧复核 → 收口），记录冻结（2026-09-30）。
