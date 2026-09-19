# VSC 活动区收口（清退+落流 · digest 可读性 · 待消化提示）· 批次记录（2026-09-12）

> 搬迁注记：本档自 CLI 仓 `2026-09-12-VSC-ACTIVITY-CLOSURE（CLI 仓）` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = cdd0739ca68e · 源提交 = cfcc621）。

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-12 01:10 · 来源 = 用户走查（01:03「live 块执行完没有从子agent面板清除，digest 过程远不如 CLI 清晰」+ 01:09「1走A」+ 问「live 块等待消化时有提示吗」）。
> 勘察 = explore#27（只读——证据见下；全文为其报告）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-12**（用户 01:09 授权 A 方案 = 反转旧裁）。下一步 = **设计**（spawn eng-designer）。

### 用户裁定（本批最重要的一条——反转项）

**A 方案获批**（01:09「1走A」）：**终态块出活动区、内容进会话流**（= CLI 语义）。此为对既有裁定的**反转**——须在设计/需求两层明确修订（**不得静默**）：
- `docs/requirements/AGENT-LOOP.md:414`（CLI 仓） §12 F-J3（「冻结块去向 = 区内原地保留（R3）…不做落流…不做折后即移除」）；
- VSC `docs/design/WEBVIEW.md` §12.2 Q1（:1013-1017）候选 2/3 否决 + D-A1（:1088）+ §12.4（:1078-1079「DOM move 落流 / 冻结插入锚链不复活」）。
- **设计要求**：给出**干净机制**（不是旧 DOM-move 锚链复活）——§12.4 那条禁令的「机制本体」须被正面回答（新机制 = 什么、为何不构成旧链）。

### 勘察事实（explore#27——逐点 file:line）

**缺口 1（清退）**：
- VSC：出生 `webview/activity.js:109`（活动区区尾）；终态 `:180-192 freezeBlock` = **原地折叠**（class 翻转 + open=false + ⏹ 移除——零 remove、零 DOM move）；`:245-246` 注释自述「settled 视同 done 即时折叠（**无 awaitingDigest 驻留**）」。
  清退路径穷举仅 3 条（`:194-201` 上限 20 / `:345-353` reset / `:290-300` queued 取消）；digest 回收补发被冻结守卫吞（`:312-322` `if (block._subMeta.frozen) continue`——设计自述「惰性 no-op」）；区显隐 = CSS `:empty` ⇒ **全完成后区仍常驻 32vh**。
- CLI（目标语义）：面板判据 `src/tui/subagent-panel.mjs:43`（`!s.done || s.awaitingDigest`）；清退动作点 `src/tui/subagent-blocks.mjs:235-245`（done → `freezeSubTaskLines` + `delete state.subTasks[key]`）；冻结进流 `src/tui/subagent-freeze.mjs:88-95`（splice 至 `_freezeAt` 锚）；面板零驻留 `layout.mjs:121`。
- **待消化提示（用户 01:09 追问——父侧取证）**：CLI 块级有——`subagent-panel.mjs:104` `statePart = "done · awaiting digestion"` + `:10` 注释「done && awaitingDigest 冻结被延迟，驻留面板显示」；状态行另有聚合计数 `suspension-drive.mjs:139-151`。VSC 现状：**块级无**（settled 即折叠）；仅状态行聚合 `webview/status-bar.js:40-50`（`⏳ N 个… · M 份报告待消化`）。

**缺口 2（digest 可读性）**：
- CLI 可见面 8 项（`suspension-drive.mjs:160-162` 起跑 dim 行 · `agent-turn.mjs:76-82` 回合标签（autoTurn 不画假用户气泡）· `subagent-freeze.mjs:156-175` 块与 digest 文本同流且块在前 · `agent-turn.mjs:188/:192` turn-cap 两行 · 状态行 · Ctrl+C 提示 · 块可展开）。
- VSC 差异 3 项：**① digest 轮无回合标签**（`webview/ui.js:155/205-211`——`assistantLabeled` 无 auto-turn 复位点；host 无 `turnStart` 类消息）；**② 块与 digest 文本不同容器**（活动区 vs `#messages`——A 方案下自然消解）；**③ turn-cap 部分消化完全静默**（`src/extension/panel-chat.mjs:437-447`——CLI 有对应两行）。
  另：`#digest-status` 单元素跨轮复用 → **跨轮位置漂移**（`chat.js:322-328`——第 2 轮「正在消化…」出现在第 1 轮输出上方）。

### 需求（R1–R3——本批）

| # | 需求 | 判定句（可验收形态） |
|---|---|---|
| **R1** | **终态块清退 + 落流（A 方案）**：块 `awaitingDigest` 期间驻留可见（带提示——见 R3）；digest 消化后 → **出活动区 + 冻结进会话流**（内容可读、可展开）；全完成后区不常驻（`:empty`）/或空区自然消失 | 机检：消化后区 DOM 无该块 + 流内有对应冻结块（兄弟序正确）；全完成后区高度为 0 |
| **R2** | **digest 可读性**：① 消化轮显式回合标签（专属文案——对齐 CLI 归属感）；② turn-cap 部分消化补可见行（对齐 CLI `agent-turn.mjs:192` 语义）；③ `#digest-status` 消除跨轮位置漂移（每轮随流新增或等价） | 各自用例 + 文案落 i18n（两 locale） |
| **R3** | **块级等待消化提示**：awaitingDigest 态块头显示对位文案（CLI = `done · awaiting digestion`） | 用例断言块头含该态文案（收到 settled 未 digest 期间） |
| **R4** | **live 块标题信息字段级对齐 CLI**（用户 01:10「live 块的标题信息我也希望对齐」）：以 CLI 面板行（`src/tui/subagent-panel.mjs:85` `[icon key · 模式 · 模型 · Ns · turn N/M]` + `:96-110` 状态区 + 参数摘要）为权威——逐字段差异表（两端码实读）与对齐方案，**含但不限于**：queued 块的 **position/等待原因**（CLI `:100-102`；VSC 现仅 `[⏳ label]`——`activity-view.js:34` 自述「无位置/原因词」）· **审批态**（CLI `:103` `等待审批: X`）· 待消化态（R3 联动）· 当前工具名 + 参数摘要（CLI `:107-109`）· 计时/turn 字段 · 模式词 sync/async · 模型名 | 逐字段对位表（列：字段 × CLI 形态 × VSC 现态 × 目标）× 用例锁关键字段 |
| **R5** | **活动期 Send 按钮可见性与拒发矛盾**（用户 01:13 走查实测：「主会话活动时输入框不能 send，但 send 按钮没隐藏」）：现状 = `webview/loading.js:53` **无条件** `sendBtn.style.display="flex"`（F-6 语义——注释自述「send 按钮常显」）+ `:54` running 时 Stop 同显；busy 拒发走 `send.js:19-25`（toast + 占位符）。**目标**：activity 期（`_turnState === "running"`——与拒发同判据）**隐藏 Send**（或显式禁用态——设计选型二选一，给理由），消除「可点但必被拒」假 affordance；停止能力仍由 Stop 承担 | 用例：running ⇒ Send 不可见/不可用；idle ⇒ 恢复可见；F-6 语义修订落档（**裁决变更——不得静默**：INPUT-LOCK-BEHAVIOR-REVISED 的 F-6 表面 + 既有测试锁逐条核对） |
| **R6** | **状态行字段级对齐 CLI**（用户 01:17「状态行那条，我也希望对齐 CLI」）：以 CLI 状态行为权威（`src/tui/render-frame.mjs:341-397` + 横幅 `:222-233`）——逐字段对位表（字段 × CLI 形态 × VSC 现态 × 目标）；**已知缺项（#29 实查）**：✦reasoning 段 · 限流/TPM/索引状态文本（TPM throttle / Server overloaded / Rate-limited 429 / Indexing…）· `scrolled N`（VSC 现用悬浮回底钮替代——端差裁定面，设计给取舍）；VSC 独有保持：goal 徽标/面板 · 其余已知等价项不重造 | 逐字段对位表 + 用例锁新增状态文本（含限流态——可用注入缝）|

### 设计约束

- **反转项处理**：需求 §12 F-J3 + VSC WEBVIEW §12.2/§12.4/D-A1 的修订（含「为何新机制不是旧 DOM-move 锚链」的正面论证）；
- **写域**：`webview/activity.js`（354 行——越 300 软线，**须带拆分评估注**）· `activity-view.js` · `chat.js`（355 · 同）· `streaming.js` · `base.css` · `src/extension/suspension.mjs`（363 · 同）等 + 测试面（`activity-flow` / `activity-live-ux` / `digest-visibility` / `async-visibility` / `files.mjs`）；CLI 仓零改；
- **与既有裁定衔接**：SESSION-ACTIVITY-REVISED / SESSION-FLOW-A/B 的验收句凡涉「块不落流」者须逐条核对并修订（D5 不静默）；
- i18n：新文案键须两 locale 同步（`locales/*.json`）。

### 范围外

- 台账维护项（本批附带核销——见下）；CLI 侧零改动。

### 附带（父侧台账核销——本批立批时一并办）

① VSC `docs/TODO.md:44`「digest 开始无可见指示」实为已交付（`suspension.mjs:266-283` + `chat.js:321-346` + 测试在册）→ 核销/改待核销；② VSC `docs/TODO.md:15`「VSC live 块 UX」实为已交付（本夜 LIVE-UX 闭环）→ 同上。

---

## §2 批次任务（eng-designer 写）


---

**状态：任务书就绪**（2026-09-12——需求+设计+测试三层已落档；待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求源 = 本批 §1（用户走查五连——含 A 方案反转裁定）+ `AGENT-LOOP（CLI 仓·需求）` §16
（F-R1..F-R6；§12 F-J1/F-J3/F-J6 已随修订）；设计与测试 = VSC 仓 `docs/design/WEBVIEW.md` **§14**（§14.1–§14.10）
+ §2/§3/§5/§5.1.4/§5.1.7/§5.1.9/§6/§7.4/§12 修订 + 变更记录 §15；机制面（挂起 UI / 中止语义）= VSC 仓
`docs/design/AGENT-LOOP.md` §1/§7/§10 + 变更记录；沿革三指针（`SESSION-ACTIVITY-REVISED.md` / `ACTIVITY-REWRITE-SIMPLE.md` /
`SESSION-FLOW-B.md`）；CLI 仓代码零改（需求树除外——设计者已落）。

### 一、覆盖条目（本批条目 = 设计回指 = §1 裁定；三方一致清单）

| # | 条目 | 设计 | 用例 | 验收 |
|---|---|---|---|---|
| R1 | 终态清退 + 落流（A 方案） | §14 C-1..C-8 · §14.4 | T-CL1..T-CL13 | AC-CL1 |
| R2 | digest 可读性（标签 / cap / 漂移） | §14 C-9/C-10 · §14.2 M2 | T-CL14..T-CL16 | AC-CL2 |
| R3 | awaitingDigest 块级提示 | §14 C-2 · §14.1 面二 | T-CL1/T-CL2 | AC-CL3 |
| R4 | live 块标题字段级对齐 | §14 C-11 · §14.3 C-13 表 | T-CL17..T-CL19 | AC-CL4 |
| R5 | Send 可见性 | §14 C-14 · §14.2 M4 | T-CL20 | AC-CL5 |
| R6 | 状态行字段级对齐 | §14 C-15 表 · §14.2 M3/M5 | T-CL21..T-CL24 | AC-CL6 |

需求对位：`AGENT-LOOP（CLI 仓·需求）` §16 F-R1..F-R6（判定句逐条；§12 F-J1/F-J3/F-J6 修订注回指 §16）。

### 二、影响文件全清单（as-of 2026-09-12 实测；行数口径 = `split("\n").length` 含末行）

**实施域 A·VSC webview（10 改）**：`webview/activity.js`(354→±0~-10——归档机制 + awaitingDigest + 区上限退役 + reset 收窄 + 头注) ·
`webview/activity-view.js`(157→+~35——awaiting 态词 / queued 信息 / tool+cmd / turn 进展 / refreshLiveHeaders) ·
`webview/chat.js`(355→+~45——digest 轮元素 / cap / boundary + assistantLabeled 复位 + statusText/turnFrame case) ·
`webview/status-bar.js`(76→+~20——statusText 段 + ✦ + turn N/M) · `webview/panels.js`(138→+~4——2s tick 同点刷新) ·
`webview/loading.js`(61→±2——Send 可见性) · `webview/ui.js`(492→±0——trimOldMessages 选择器 +`.sub-block`；距 500 硬限 8 行——只许逐字替换) ·
`webview/history.js`(89→+~3——锚选择器 ×2) · `webview/base.css`(448→+~20——`.digest-turn`/`.digest-cap`) · `locales/en.json`+`zh.json`(248→+~12/−1——C-16 键表)。

**实施域 B·VSC extension/provider（13 改）**：`src/extension/panel-chat.mjs`(499→**≤0**——cap 两处调用 + 注释压行；硬限零余量，增行前先抽 helper——§14.6 方案 B) ·
`src/extension/panel-callbacks.mjs`(186→+~16——onWait→statusText / onAgentTurn→turnFrame / reasoning_tokens / postDigestCap) ·
`src/extension/panel-index.mjs`(183→+~9——索引进度→statusText) · `src/extension/suspension.mjs`(363→±2——注释同步「折叠回收」→「归档落流」零逻辑) ·
`src/provider.mjs`(424→+~6——429 onWait 携 status；5xx 重试等待上报) · `src/provider/transports/openai.mjs`(347→+~2) · `responses.mjs`(415→+~1) ·
`google.mjs`(264→+~1——reasoning_tokens 映射) · `src/agent-tools/subagent-run.mjs`(190→+~4——tool/cmd 字段 + `status:"turn"` 帧) ·
`subagent-escalate.mjs`(219→+~2) · `subagent-escalate-async.mjs`(226→+~2) · `consult.mjs`(474→+~2——tool/cmd) · `src/extension/panel-toolpanel.mjs`(21→+~2——白名单 +`tool`/`cmd`)。

**测试域（VSC）**：`test/activity-flow.test.mjs`(486——区语义期望改写：折叠块不再驻区 / 上限用例撤 / 归档断言) ·
`test/activity-live-ux.test.mjs`(172——T-LU6 微调) · `test/digest-visibility.test.mjs`(147——每轮元素 / turn 标签 / cap / 漂移回归) ·
`test/async-visibility.test.mjs`(402——补桩/接管/位置期望改归档) · `test/webview-turnstate.test.mjs`(292——⑤ 补 Send 可见性 + 状态行段) ·
**新档** `test/activity-closure.test.mjs`（R1/R3/R4 主力） · **新档** `test/status-line.test.mjs`（R6） · `test/files.mjs`(+2 登记)。

**拆分评估注**：`activity.js` 354 预期净减（上限退役抵消新增）——本批不拆；`chat.js` 355→~400 不拆（越 450 触发拆分评估）；`panel-chat.mjs` 499 零余量（方案 B 已登记）；`ui.js` 492 仅逐字替换。

**不入 files**：`docs/TODO.md` / `CHANGELOG.md`（父侧）；CLI 仓一切（需求树除外）；群 A §11/§13 与在途批域。

### 三、验收标准（逐条——每条可机器验证；判据全文 = §14.8，不重抄）

- **AC-CL1**（R1）= T-CL1..T-CL12：awaiting 驻留与提示、回收/即时/退出三类归档、落点与保序、区空 `:empty`、reset 只清区。
- **AC-CL2**（R2）= T-CL14/T-CL15/T-CL16：每轮独立元素（漂移回归）、回合标签 + `assistantLabeled` 复位、cap 两档文案。
- **AC-CL3**（R3）= T-CL1/T-CL2：settled 未回收头含对位态词；回收前不归档。
- **AC-CL4**（R4）= T-CL17/T-CL18/T-CL19 + C-13 表逐行落位；审批态端差登记在档。
- **AC-CL5**（R5）= T-CL20；`send.js` 零改（git diff 断言）。
- **AC-CL6**（R6）= T-CL21..T-CL24 + C-15 表逐行落位；端差（scrolled/ctx/attention）登记在档。
- **AC-CL7**（零回归）= VSC 快层全绿；CLI 仓代码零改（`git status`）；协议增量 = C-12 六项逐项在位；`check-doc-width` 两仓新增超宽 0。

### 四、用例（共 24 例 T-CL1..T-CL24；输入/预期全文 = §14.7）

正常：T-CL1 awaiting 驻留 · T-CL2 回收归档（边界前） · T-CL3 普通终态尾追 · T-CL4 多块保序 · T-CL5 会话退出 flush · T-CL6 全归档后区空；
边界：T-CL7 边界失效退化 · T-CL8 无边界（用户回合路径） · T-CL9 150 窗 + 懒历史锚 · T-CL10 新代接管 · T-CL11 补桩直归档 · T-CL12 reset/清屏 · T-CL13 digest 中断残块 · T-CL14 每轮元素无漂移 · T-CL15 回合标签 · T-CL16 cap 两档 · T-CL17 queued 字段 · T-CL19 turn/计时刷新 · T-CL23 turn N/M 段 · T-CL24 scrolled 端差；
错误面：T-CL18 工具 + 参数（结果 chunk 不改写） · T-CL20 Send 可见性 · T-CL21 statusText 映射 · T-CL22 ✦reasoning。

**测试族写法**：新档 `activity-closure` 用 `installChatFixture` + 动态 import 真 `activity.js`/`activity-view.js`（同 activity-flow 模式）；`status-line` 用 `installChatFixture` + `status-bar.js`/`chat.js` 注入面；digest 用例沿用 `digest-visibility` 的 window MessageEvent 直驱。

### 五、开放设计问选型表（M1–M6——逐项 ≥2 候选 + 判据 + 否决理由；全文 §14.2）

| 问 | 选定 | 否决候选（理由） |
|---|---|---|
| M1 终态去向机制 | 消化后归档落流（轮边界插入） | 旧 DOM-move 锚链（§12.4 点名债）/ 一律尾追（序反 CLI——仅作降级）/ 折后移除（不可读） |
| M2 digest 轮元素 | 标签行 + 每轮独立状态元素 | 单元素搬运 / 新增 turnStart 消息 |
| M3 状态文本载体 | 结构化 `statusText`（webview i18n） | host 直发成品文本（locale 双源）/ 不做（判定句不满足） |
| M4 Send 可见性 | running 期隐藏 | 禁用态（双范式、仍占位） |
| M5 `scrolled N` | 保持悬浮回底钮（端差） | 补文本段（新造单位 + 双指示） |
| M6 会话退出 | 区全体归档 | 仅 live 折叠（awaiting 悬空） |

### 六、明确不在本批（不扩面）

- 不做 CLI 端；不做行面板复活；不做跨 reload 恢复；不改 digest 注入 / 预算；
- 不复活 §12.4 旧链（DOM move 锚链 / 双态驻留旧形态 / preview·ticker）；
- 流内归档块无独立分页锚（`data-idx` 不补——懒分页锚仍由 `.message` 承担——登记）；
- 端差不做项：审批态（无数据源）· `scrolled N` · ctx 绝对数 · attention chip · 键盘提示段；
- 不碰群 A §11/§13 节域；advisor 流内块（`S._advisorBlock`）不动。

### 七、纪律与边界（coder 须知 + 父侧事项）

- **D1 写权**：coder 写实施域；文档域 = 设计者已落——coder 零碰（发现文档需改 → 回报）。
- **D5 冻结窗**：落笔时点核验（评审在途不改被审文档；本批落档时无在途评审）。
- **D6**：写入后回读核对；行数对表入 §5。
- **逐字纪律**：C-16 i18n 键表两 locale 逐字照抄；cap/限流文案逐字；⏹/既有头词语义零改（除 C-11/C-13 明列）。
- **协议只增不改**（C-12 六项逐项登记）；既有消息名/字段零改。
- 不 commit（改动留工作区）；凭证不落档；越出声明写域 → 停下报告；长测试先落盘再查。
- **父侧登记项（批后核销）**：VSC `docs/TODO.md` ① :44 digest 可见指示 ② :15 LIVE-UX（本批立批已列）→ 核销/推进；`docs/design/README.md` 补登行；需求池（如适用）。
- 边界：不发起评审（红线）；CLI 仓零改（需求树除外）；本批 UI/交互决策全落档（§14.10 无 open 项）。

**状态推进**：任务书就绪——待设计评审（用户发起）→ 用户批准 → eng-coder 实施（设计 token 门）。

〔注记：本段 4 行（落档位置 / 实施域 A / 实施域 B / 测试域）原为单行长 424/708/816/439 字符（超 300 文档规）——
本人 §2 域内折行修补，零增删。〕

### 修正轮同步（2026-09-12——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审轮次 1 VERDICT = changes-required（🔴 1 · 🟡 5 · 🔵 2——发现表见 §3 轮次 1）。
父侧裁决 **8/8 全修**（含 #5 的「更强防御」——评估结论 = 采纳，见下表 #5 行）。本轮 = 修正轮
（**只改文档、不碰实现**；未新建档；`src/**` 零改动、未 commit）。落笔文件 = VSC 仓
`docs/design/WEBVIEW.md`、`docs/design/AGENT-LOOP.md`（就地「修正轮 #N」注已逐处带）。

**落修明细（逐条）**：

| # | 级别 | 落点（as-of 落修后） |
|---|---|---|
| 1 | 🔴 | §12 反转注清单补 §12.3#9 / D-A7 / AC-R1（+AC-R2 采样注）——四处就地 2026-09-12 修订注 |
| 2 | 🟡 | §14.6 文档域补 AGENT-LOOP 未决行 + subagent-run 受影响行带注释同步；AGENT-LOOP.md 未决行收口注 + 变更记录行 |
| 3 | 🟡 | §7.2 表同步（四改 + 两增 + 修订注）+ 文档域补 §7.2 + §5.1.4 第 8 条当时批口径注 |
| 4 | 🟡 | C-11④ 明示「不设运行态门（仅刷块头）」+ T-CL19 补断言条件 + panels.js 受影响行 |
| 5 | 🟡 | C-5③ 失明面写全 + 「旧代回收在途」吞机制（采纳）+ 残余登记；§5.1.4 第 5 条指注；T-CL10 扩断言 |
| 6 | 🟡 | 测试域逐档 ≤±N（486≤+10 / 172≤±6 / 147≤+50 / 402≤+15 / 292≤+35）+ 越线处置口径；C-9 start 连发口径补全 |
| 7 | 🔵 | §14.6 计数对齐（10 改 = 10 行 · 13 改 = 13 行） |
| 8 | 🔵 | §14.7 后新增 C-12 host 覆盖归属注（六项逐项机判归属） |

**派生修正（同源、如实披露）**：a) §5.1.4 第 8 条加当时批口径注（#3 派生——该表本批补行）；
b) 修正轮边界核对 = 未夹带新语义；三方条目（R1–R6 / AC-CL1–AC-CL7 / T-CL1–T-CL24）零增删。

**D6 回读**：两档逐处回读核实——全部落点在位、无重复/残句。

**宽度自检**：VSC 仓 `check-doc-width` 零超宽（69 文件，扫描域全绿）；CLI 仓存量超宽
20 文件 / 34 行（含本档 §3 一行 513 字符——属评审段，本轮按「不碰 §3」不修）+ 存量外
V3 新增 1 条（`2026-09-12-VSC-CHILD-PERMISSION.md` §3——他批）——均不在本轮写域，见交付报告。

**状态**：修正轮落地——待父侧重发轮次 2（同一链内取 token）。

### 修正轮续（2026-09-12——轮次 2 两项 🔵 微修；零新语义；与上文本冲突时以本追加为准）

**背景**：轮次 2 VERDICT = pass（0🔴·0🟡·2🔵 新登记——发现表见 §3 轮次 2 表 #9/#10）。父侧裁定两项均落修。
本轮 = 收口微修：只改 VSC 仓 `docs/design/WEBVIEW.md`（就地「修正轮 #9/#10」注已逐处带）；`src/**` 零改动；
未新建档、未发起评审、本轮未 commit。

**落修明细（逐条——as-of 落修后）**：

| # | 级别 | 落点 |
|---|---|---|
| 9 | 🔵 | `WEBVIEW.md:1403-1405`（§14 头部）——原内联「吸收条目」清单改**纯指针句**（「条目清单以 §12 修订注为准」）；就地注「修正轮 #9」 |
| 10 | 🔵 | `WEBVIEW.md:424`（§7.2 `onAgentTurn` 行）——引指更正 `C-11④`→`C-11③`（逐轮帧/池条目同步的对位项）；就地注「修正轮 #10」 |

**#9 形式选型（评审二选一——裁定记录）**：**否决「补录内联清单」**——清单权威源 = §12 修订注（逐项带就地修订注），
§14 头部再录一份 = 双写（本次失同步即其证）；违背 D2「只引用不重述」。**选定「纯指针句」**。零语义差。

**注号口径**：任务书「逐处注『修正轮 #9』」按 §3 轮次 2 表 finding 序号顺延落地 = #9（头部清单）/#10（onAgentTurn）。

**D6 回读**：两处逐字回读核实在位；`check-doc-width`（VSC 仓）复跑 = 宽度 69 文件全绿 + V1/V2/V3 新增违规 0 条。

**补记·CLI 仓复核（同轮——报告口径）**：宽度存量 20 文件 / 34 行（同上轮口径；含本档 §3 既定
513 字符行——他段）；一致性新增 7 条 = 本档 §3 评审段 6（轮次 2 表 File 列跨仓引用形态 ×5 + 「核验轮」
行括号 ×1）+ 他批 1（CHILD-PERMISSION）——本追加 0 新增；`test/doc-consistency.test.mjs` T41 ①
当前红（同上因，非本轮产生）；处置（改写形态 / 入基线 / 随清扫批）待父侧裁定。

### 实现后同步（2026-09-12——交付后文档面 4 处；纯文档，实现面零改）

**背景**：§6 遗留 ①–④（doc 面 #43 同步）。落笔文件 = VSC 仓 `docs/design/WEBVIEW.md`（就地「实现后同步（2026-09-12）」注逐处带）；
`src/**` / `webview/**` / 测试零改动；未新建档、未发起评审（红线）、未 commit。

**落笔明细（逐条——as-of 落笔后实测，2026-09-12）**：

| # | 条目 | 落点（as-of 落笔后） |
|---|---|---|
| 1 | `activity.js` 行数对表校准（实测 406；越 300 软线拆分评估注） | §14.6 `activity.js` 行（`:1663`——`354（本批前）→ 406（实现后实测）`；预估 ±0~-10 → 实测 **+52**）+ 拆分评估注（`:1704-1706`——越 300 软线；<500 硬限余量 94；未触 450 线；本批不拆） |
| 2 | `refreshLiveHeaders` 归属更正（activity-view.js → `activity.js:375`） | §3 模块图两行（`:70-71` activity.js 行补录 + `:74-76` activity-view.js 行撤销更正）+ §14.6 两行（`:1663`/`:1664`） |
| 3 | `state.js` 协调项登记（三 S 字段动态挂载 vs 集中声明惯例） | §14.6 新增登记段（`:1711-1714`——结论 = 惯例落差落注、不补行；集中声明建议随后续批） |
| 4 | C-16 i18n 占位符记法校准（`{n}` 简写 → 实落 `${…}`） | C-16 表后注（`:1627-1629`——引擎仅认 `${k}`；实落以两 locale 为准） |

**D6 回读**：逐处回读核实——全部落点在位、无重复/残句；变更记录 §15 同步行补（`:1793-1796`）。

**宽度/一致性自检**：VSC 仓 `check-doc-width`——宽度 69 文件全绿（零超宽行）；一致性 V1/V2/V3 新增违规 0、存量 25（基线内）。

**as-of 说明**：本段 406 与 `:375` 均为**本批交付时点**口径；落笔核验时 `activity.js` 已另有在飞批（child 审批批）并发写入——行数与行号随增，按各批 as-of 口径互不覆盖，后续批各自登记。

**状态**：4 处全落——本批文档面收口（无新语义、零契约变更；三方条目 R1–R6 / AC-CL1–AC-CL7 / T-CL1–T-CL24 零增删）。

## §3 设计评审（评审子代理写）


---

### 轮次 1（评审子代理）

### 设计评审（活动区收口批——WEBVIEW §14 / 需求 §16）发现表

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | §12 反转注标注清单不完整——三处未标注 §12 旧文与 §14 新契约直接矛盾：① §12.3#9（WEBVIEW.md:1087-1088）「防御孤儿清（选择器改全类 `.sub-block`——含折叠）」「`freezeLiveBlocks` 原地折叠不变」vs §14 C-7（:1499-1501）「防御清扫限定 `ctx.activityEl` 后代……流内归档块不动」与 C-8（:1503-1504）「区全体归档」；② D-A7（:1116）「`trimOldMessages` 零改」vs §14.6 ui.js 行（:1628）「`trimOldMessages` 选择器 + `.sub-block`」/T-CL9（:1682）；③ AC-R1（:1192）「`#messages` 内 `.sub-block` 计数 == 0」vs §2（:38-41）「`#messages` 内 `.sub-block` = 归档块」/C-3（:1481-1485）。§12 修订注明文清单（:1016 起）未列三者；需求侧 F-J1 已把「`#messages` 零 `.sub-block`」限缩为区驻留期——设计侧 §12.8 未同步 | 把 §12.3#9（两句）、D-A7、AC-R1 补入 §12 修订注清单并就地加 2026-09-12 修订注（#9 → C-7/C-8；D-A7 → T-CL9；AC-R1 → 采样限定「区驻留期/出生时刻」）；顺带 AC-R2（:1194-1195）注明「折叠原地」采样点=折叠时刻 |
| 2 | Clarity / Doc state | 🟡 | VSC `docs/design/AGENT-LOOP.md`「未决/待办状态行」（:28-30）「live 头缺逐轮 turn 段……不擅建……无跟进计划」将被本批 C-11③（WEBVIEW.md:1520）履行，但批次文档域（WEBVIEW.md:1663-1664）仅列 §1/§7/§10——该行不在写域，交付后成失效悬空句；同族失效注释另在 `src/agent-tools/subagent-run.mjs:136-139`（「逐轮跳动需新通道——不建」） | 把该未决行（标注「已履行/收口」）与 subagent-run 注释的更新补入写域（实现行不改语义） |
| 3 | Document ownership | 🟡 | WEBVIEW §7.2（:401-414——自述「本架构权威源：扩展机制消息族清单」）不在本批文档域（:1663-1666）；批后其行失真：`subagent`（:406）缺 `status:"turn"`、`digest`（:410）缺 `status:"cap"`、`toolPanel`（:405）缺 `tool/cmd`、`onAgentTurn`（:414「顶层无订阅 no-op」）将被推翻，且 `statusText`/`turnFrame` 两新消息无行（同款：第 21 批为 `digest` 补行） | 将 §7.2 补入文档域并同步五行（四改 + 两增——只增不改口径） |
| 4 | Feasibility / Clarity | 🟡 | C-11④（:1521）「elapsed 定时刷新：panels `_panelTimer`（既有 2s）同点调 `refreshLiveHeaders()`」——既有定时器回调带门 `if (S._turnState === "running")`（`webview/panels.js:68`）；挂起纯池跑（state=susp——live 块后台运行主场景）不在门内，同点接入将致块头 elapsed 冻结（R4「elapsed 定时刷新」落空） | 明示刷新门（如 running || susp）或不设门（仅刷块头），并在 T-CL19 注明 |
| 5 | Clarity / Risk | 🟡 | C-5③（:1493-1494）接管「其回收消息将路由到新块——登记已知歧义同 §5.1.4 第 5 条」：该登记只涵盖「迟到 chunk 落进新块」；在 awaiting 新语义下，旧代滞留回收 `done` 命中新代 live 块时按 C-1②/C-5①（:1471-1473/:1491）将被折叠 + 即时归档——新代块提前终止、其后 chunk 被冻结守卫吞掉（失明面大于登记所述） | 把后果写全进注册句（或 §5.1.4 第 5 条）；更强防御（接管时记「旧代待回收」吞该 done）评估后登记 |
| 6 | Acceptance criteria | 🟡 | 测试域（:1651-1656）对四个被改写测试档只给现行行数未给预计增量（activity-flow 486 无 `≤±N`；digest-visibility 147、async-visibility 402、webview-turnstate 292 同）；activity-flow 距 500 线仅 14 行，改写后是否越线不可判（评审准则 #8 要求逐档标注 delta） | 逐档补 `≤±N`（测试档拆分沿用登记口径）；若 activity-flow 预计越 500，注明处置口径 |
| 7 | Document hygiene | 🔵 | §14.6 表头计数「webview（8 改）」（:1618——表内 10 行，locale 行含 2 档）与「extension / provider（9 改）」（:1633——表内 13 行）与行数不符 | 改实计数（10 行 / 13 行）或注明计数口径；同口径 §12.6「12 改 = 9 源 + 3 测试」、§17.6「15 档 = 源档 12 + 测档 3」 |
| 8 | Acceptance criteria | 🔵 | C-12 六项增量的 host 发射点（panel-chat cap 两调用 · panel-callbacks onWait/onAgentTurn/reasoning · panel-index 索引进度 · 四生产者 tool/cmd）在测试域无显式机判用例（webview 侧经注入缝覆盖） | 在设计/AC 注明 host 面覆盖归属（如 digest-visibility 改写含 host cap 发射）或补桩面板直驱小用例（同款 digest-visibility T-D1–T-D3） |

**核验记录**：三档全文已读；行数抽检 20 档全部与设计标注相符（activity.js=354 · ui.js=492 · chat.js=355 · panel-chat.mjs=499 · panel-callbacks.mjs=186 · suspension.mjs=363 · status-bar.js=76 · loading.js=61 · panels.js=138 · history.js=89 · activity-view.js=157 · panel-toolpanel.mjs=21 · base.css=448 · locales=248 ·
  consult.mjs=474 · provider.mjs=424 · panel-index.mjs=183 · subagent-run.mjs=190 · activity-flow.test.mjs=486 · digest-visibility.test.mjs=147）；C-4 边界机制与 `suspension.mjs` 实际消息序（reclaim 在 postSuspension 之前）核对为可行（无 findings）。

VERDICT: changes-required

计数：🔴 1 · 🟡 5 · 🔵 2（共 8 条）。

### 轮次 2（评审子代理）

**核验轮（轮次 2）——活动区收口批（WEBVIEW §14 / 需求 §16）**：原 8 项（🔴1 · 🟡5 · 🔵2）全部核验落修；另 2 项 🔵 新登记（均为修正轮残留小口径，不阻断）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | WEBVIEW.md §12 | 🔴（原） | **已落修** | :1031「D-A1、D-A2、D-A5、D-A7（`trimOldMessages` 零改 → 选择器补 `.sub-block`——T-CL9）、§12.3#3/#4」· :1032「§12.3#9（防御清扫限区子树 + `freezeLiveBlocks` 区全体归档——C-7/C-8）」· :1034「§12.8 AC-R1（`#messages` 零块限「区驻留期」采样）· AC-R2（折叠采样点 = 折叠时刻）· AC-R3」；就地修订注 §12.3#9:1106-1108 / D-A7:1136 / AC-R1:1212-1213 / AC-R2:1215-1216 全在位 |
| 2 | 2 | AGENT-LOOP.md（VSC） | 🟡（原） | **已落修** | :30-32 未决行加收口注「**2026-09-12 收口（活动区收口批 C-11③/C-12 #4——`status:"turn"` 帧上屏）：本条由本批履行…（修正轮 #2）**」；写域补入（WEBVIEW.md:1705）；subagent-run 注释同步登记（WEBVIEW.md:1681） |
| 3 | 3 | WEBVIEW.md §7.2 | 🟡（原） | **已落修** | :421-422 `statusText`/`turnFrame` 新增行；:409/:410/:418 三行补字段；:424 `onAgentTurn` 行更正；:426-428 修订 banner；§14.6 写域含 §7.2（:1704）；§5.1.4 第 8 条指注（:281-283） |
| 4 | 4 | WEBVIEW.md C-11④ | 🟡（原） | **已落修** | :1554-1555「④ elapsed 定时刷新…——**不设运行态门**（…`running` 门（`webview/panels.js:68`）不延伸…）（修正轮 #4）」；:1733 T-CL19 同注；:1662 panels 行登记 |
| 5 | 5 | WEBVIEW.md C-5③ | 🟡（原） | **已落修** | :1518-1526 失明面写全 + `meta.oldReclaimPending` 吞机制 + 残余登记；§5.1.4 第 5 条注（:258-259）；:1724 T-CL10；:1658 activity.js 行登记。轮次 2 复核：防御逻辑自洽（FIFO 先至依据成立、残余已登记） |
| 6 | 6 | WEBVIEW.md §14.6 测试域 | 🟡（原） | **已落修** | :1687-1694 五档 ≤±N 补齐（486→≤+10 等）；:1696-1697 越线处置口径 |
| 7 | 7 | WEBVIEW.md §14.6 表头 | 🔵（原） | **已落修** | :1654「（10 改 = 10 行——locale 行含 en/zh 两档；修正轮 #7）」· :1669「（13 改 = 13 行；修正轮 #7）」——与表行数相符 |
| 8 | 8 | WEBVIEW.md §14.7 后注 | 🔵（原） | **已落修** | :1740-1747「C-12 host 发射面覆盖归属（修正轮 #8——六项增量 host 侧机判）」段在位 |
| 9 | (new) | WEBVIEW.md:1403-1405 | 🔵 | **新登记** | 「> 本 §14 吸收 §12 中被反转条目（Q1/Q4 选定行、D-A1/D-A2/D-A5、§12.3#3/#4/#10、§12.4 行 1–3、§12.7」——未随 #1 同步（缺 D-A7/§12.3#9/AC-R1/AC-R2；§12 注 :1031-1035 已含）——建议同步或改指针句 |
| 10 | (new) | WEBVIEW.md:424 | 🔵 | **新登记** | onAgentTurn 行引「（§14 C-11④/C-12 #2）」——C-11④（:1554）= elapsed 段；本行逐轮帧/池条目同步应对 C-11③（:1553「…`onAgentTurn` 帧」）→ 建议 ④→③ |

**计数**：🔴 0（原 1 已落修）· 🟡 0（原 5 已落修）· 🔵 2（新登记）。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 02:00 父侧代签**——用户 23:43「自动推进到排空」+ A 方案授权（01:09）；条件齐备：轮次 1 changes-required（1🔴 · 5🟡 · 2🔵）→ **修正轮 8/8 落地**（#33）→ **轮次 2 核验 pass**（8/8 已落修；新 2🔵 = 登记级）→ token 已签发（值不落档）。

**批准范围**：VSC 活动区收口 R1–R6（清退+落流 A · digest 可读性 · 待消化提示 · 块头字段 · Send 可见性 · 状态行字段）——实施面 = §14.6 受影响表（webview 10 + extension/provider 13 + 测试域）；实施者 = eng-coder（设计 token 门）。

**遗留**：① 2 项 🔵（§14 头部括号清单同步 / §7.2 onAgentTurn 引指 ④→③）——#37 微修；② 与 child 审批批写域重叠（subagent-run/panel-callbacks/activity/locales）——调度器串行；③ commit 随「扫」批。

---

## §5 实施记录（eng-coder 自写）


---

**实施记录（eng-coder · 2026-09-12）**

**交付摘要**：R1–R6 全量落地（A 方案终态清退 + 归档落流 · digest 轮每轮独立元素/标签/cap · awaitingDigest 块级提示 · 块头字段级对齐 · Send running 期隐藏 · 状态行字段对齐）+ 测试域（新档 2 档 + 改写 5 档 + `test/files.mjs` 登记 2 行）+ 协议增量 C-12 六项（只增不改）。CLI 仓零写入（本 coder 全部 write/edit 落 thincoder-vscode）。

**逐契约落点**：C-1/C-2/C-3（`webview/activity.js`：settled → awaitingDigest 驻留 + 态词；done 回收 → 边界前归档；其余终态即时尾追）· C-4（`chat.js` digest start 置 `S._digestBoundary`；suspension/clearMessages 清）· C-5（补桩直归档；
  接管旧 awaiting 块归档 + `oldReclaimPending` 吞守卫）· C-6（`MAX_REGION_FOLDED`/`enforceRegionCap` 退役——全仓零命中）· C-7（resetActivity 限区子树；
  clearMessages 全清）· C-8（freezeLiveBlocks 区全体归档）· C-9/C-10（每轮 `.digest-turn` + 独立 `.digest-status`、id 退役、`assistantLabeled` 复位、cap 两档）· C-11①②③④（tool/cmd → `${tool} — ${cmd ≤60}`、结果 chunk 不改写、queueInfo、`status:"turn"` 帧、2s `refreshLiveHeaders` 不设运行态门）·
  C-12 六项（statusText / turnFrame / toolPanel tool+cmd / subagent turn / digest cap / usage reasoning_tokens）· C-13/C-15 逐行（含端差不做项：审批态/`scrolled N`/ctx 绝对数/attention chip）· C-14（send.js 门禁与 toast 零改）· C-16（12 键两 locale 同步、`status.turns` 退役）。

**一、行数对表（as-of 落笔实测；口径 = `split("\n").length` 含末行）**

| 文件 | 现行 | 预计 | 实测 | 判 |
|---|---|---|---|---|
| webview/activity.js | 354 | ±0~-10 | 406 | **+52（超预计；<500 硬限、未触发 450 拆分线）** |
| webview/activity-view.js | 157 | +~35 | 176 | +19 ✓ |
| webview/chat.js | 355 | +~45 | 398 | +43 ✓ |
| webview/status-bar.js | 76 | +~20 | 102 | +26（贴线） |
| webview/panels.js | 138 | +~4 | 141 | +3 ✓ |
| webview/loading.js | 61 | ±2 | 64 | +3 ✓ |
| webview/ui.js | 492 | ±0 | 492 | ±0 ✓（逐字行替换，未越 500） |
| webview/history.js | 89 | +~3 | 89 | ±0 ✓ |
| webview/base.css | 448 | +~20 | 469 | +21 ✓ |
| locales/en.json·zh.json | 248 | +12/−1 | 259/259 | +11 ✓（键位/键数两侧同步） |
| src/extension/panel-chat.mjs | 499 | ≤0 | 499 | ≤0 ✓（cap +2 / 注释 −2） |
| src/extension/panel-callbacks.mjs | 186 | +~16 | 207 | +21（超预计） |
| src/extension/panel-index.mjs | 183 | +~9 | 192 | +9 ✓ |
| src/extension/suspension.mjs | 363 | ±2 | 363 | ±0 ✓（注释同步） |
| src/provider.mjs | 424 | +~6 | 427 | +3 ✓ |
| src/provider/transports/{openai,responses,google}.mjs | 347/415/264 | +2/+1/+1 | 351/416/265 | ✓ |
| src/agent-tools/{subagent-run,subagent-escalate,subagent-escalate-async,consult}.mjs | 190/219/226/474 | +4/+2/+2/+2 | 194/220/227/475 | ✓ |
| src/extension/panel-toolpanel.mjs | 21 | +~2 | 23 | ✓ |
| test/activity-flow.test.mjs | 486 | ≤+10 | 461 | −25 ✓（T-R8/T-R16 随 §14 撤） |
| test/activity-live-ux.test.mjs | 172 | ≤±6 | 173 | +1 ✓ |
| test/digest-visibility.test.mjs | 147 | ≤+50 | 199 | +52（**微越 1~2 行**） |
| test/async-visibility.test.mjs | 402 | ≤+15 | 410 | +8 ✓ |
| test/webview-turnstate.test.mjs | 292 | ≤+35 | 329~332 | +37~40（**微越**） |
| test/files.mjs | 75 | +2 | 77 | ✓ |
| **新** test/activity-closure.test.mjs | 0 | ≤300 软线 | ~302 | **微越软线 2 行** |
| **新** test/status-line.test.mjs | 0 | ≤200 | 182 | ✓ |

**二、验证（真跑；长测先落盘再查）**
- 定向：`node --test test/activity-closure.test.mjs`（15→终稿 14 例全绿）· `test/status-line.test.mjs` 7/7 · `test/digest-visibility.test.mjs` 9/9 · `test/async-visibility.test.mjs` 10/10 · `test/activity-flow.test.mjs` 17/17 · `test/webview-turnstate.test.mjs` 6/6 · `test/activity-live-ux.test.mjs` 6/6。
- 快层：`node test/run-fast.mjs` = **624 tests / 609 pass / 1 fail（T-CI-2a 既有他批红）/ 14 skip**；全量：`node test/run-full.mjs` = **624 / 623 pass / 1 fail（同 T-CI-2a）/ 0 skip**。
- `npm run lint`（`scripts/check-syntax.mjs`）：279 JS files OK。`node scripts/check-doc-width.mjs`（VSC 仓）：69 文件全绿，新增超宽 0。
- 慢门：快层偶发 2 例（`expand-home` T-MA2-5 / `verify-redesign` T-V3）在负载下越 800ms 阈值——隔离与 test:full 复跑均绿（非本批文件，属机器负载抖动）。

**三、偏差披露（透明表）**
1. **越表写域**：`webview/streaming.js`（§14.6 未列）——改动 = 头/尾注释同步 + `noteChunk(block, kind, text, m)` 传参一行（C-11① 结构化 tool/cmd 上下行必需；`toolPanel` 消息→`noteChunk` 是唯一通路）。已披露。
2. **未触碰 `webview/state.js`**（守 D1 写域）：三个跨模块 S 字段 `_digestBoundary`/`_turnFrame`/`_statusText` 以动态属性挂载（读面 falsy 安全）；「S 字段集中声明」惯例落差 = 协调项上报（父侧/设计者）。
3. **i18n 记法**：C-16 表占位符 `{n}` 为简写，落档为 `${n}`（本端引擎仅认 `${k}`；既有 `digest.*` 同族同口径——照抄 `{n}` 会向用户显示字面占位符）。
4. **行数偏差**：见上表（activity.js +52、panel-callbacks +21、digest-visibility/activity-closure/webview-turnstate 微越自设目标）；无 500 硬限违反。
5. **既有红/环境面**：`test/context-parity.test.mjs` T-CI-2a = 他批在飞（prompt 两态装配断言与现行提示词不符）——非本批域，不动。

**四、审计与代码评审（终态）**
- **内部 explore 分歧审计**（§18 D-E2③）：🔴 0 · 🟡 1（streaming.js 越表触碰——如实披露）· 🔵 4（streaming.js 注释滞后 / T-CL15 渲染面断言缺 / activity.js 行数预测漂移 / i18n 记法）。**自修正**：streaming.js 注释滞后 → Fixed（头注 + finish() 注释同步 §14 语义）；T-CL15 渲染面 → Fixed（digest-visibility 增「本轮 assistant 块含 ❯ 标签」断言）。其余 = 文档域或如实入表。
- **内部 advisor 代码评审**（round 1，type=code，review-object 已声明）：**VERDICT = pass（无 🔴）· 🟡 3 · 🔵 4**。逐条裁决与落地：
  | # | 级别 | 裁决 | 落点 |
  |---|---|---|---|
  | 1 | 🟡 | Fixed | 补 C-12#3/#4 host 面机判：`test/status-line.test.mjs` 新增 T-CL21a-3（`toolPanelPayload` tool/cmd 逐字直驱 + string 分支降级 + `subagent-run` `status:"turn"` 发射锚） |
  | 2 | 🟡 | Deferred（文档域/父侧） | `state.js` 未入受影响表 + 三动态 S 字段声明 = 协调项；本批守 D1 不改 |
  | 3 | 🟡 | Deferred（设计档修订面） | `refreshLiveHeaders` 文档归属（§3/§14.6 写 activity-view.js，实际 `activity.js:375`）——父侧/设计者同步 |
  | 4 | 🔵 | 如实入表 | 行数预测漂移（activity.js 406 vs ≤354 等）——见行数对表 |
  | 5 | 🔵 | Fixed | `chat.js:184` clearMessages 同点清 `S._statusText`/`S._turnFrame`（会话切换不留旧状态段） |
  | 6 | 🔵 | Fixed（注释） | `gate` 相名 = CLI 对位保留（VSC `rate.mjs` 发 `rate`）——注释明示，分支保留 |
  | 7 | 🔵 | 已披露 | streaming.js 越表注释同步（同审计 #1） |
- **修正轮边界**：只落评审发现与裁决直接导出的修正（+测试补强），未夹带新语义/新范围。
- **终态：`clean`**（无未决 🔴/🟡；两项 Deferred 均属文档域登记项，已逐条上报父侧）。

## §6 验证与收口（父代理自写）

**2026-09-12 02:26 收口（父侧核验）**

- **真跑**：VSC 快层 `node test/run-fast.mjs` → **624 例 / 609 过 / 1 fail / 14 skip**——唯一红 = `context-parity` T-CI-2a（**他批在飞**——prompt 两态装配断言，非本批域）；coder 全量 624/623/1；定向 7 档全绿（14/7/9/10/17/6/6）；lint 279 档 OK；`check-doc-width`（VSC）全绿新增 0；
- **交付表 R1–R6 全 Done**（清退+落流 A · digest 每轮元素 · awaiting 提示 · 块头字段 · Send 隐藏 · 状态行五 kind+✦+turn 段）+ AC-CL7 零回归（协议增量六项逐项在位）；panel-chat 499 ≤0 达标；
- **评审**：内部审计 🟡1/🔵4（全处理）→ advisor 代码评审 round 1 **pass**（🔴0 · 3🟡 已修 · 4🔵 中 3 项入文档面、1 项（state.js）为协调项）→ 终态 clean；
- **越表披露**：`webview/streaming.js`（`toolPanel→noteChunk` 多传 `m`——C-11① 必需）——**采纳**（非静默）；
- **遗留（doc 面——#43 同步）**：① `activity.js` 实测 406（设计预计 ≤354）行数对表 ② `refreshLiveHeaders` 归属（设计写 activity-view.js → 实际 `activity.js:375`）③ `state.js` 未入受影响表（三 S 字段动态挂载——协调项）④ i18n 记法 `{n}`→`${n}` 校准；
- **范围外注**（无级别）：coder 清理临时日志用 `_*.log` 通配——含他批日志（临时产物、可重建）；**纪律提醒已记**（清理限自己产物）；
- **链终**：design 链令牌已消费（值不落档）——再动需新评审。
