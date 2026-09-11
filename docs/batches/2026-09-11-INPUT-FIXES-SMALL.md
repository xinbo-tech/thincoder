# 输入面小修（/advisor 缺 await + VSC Enter 离线面）· 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分）**：本档对端（VSC）份已由 VSC 仓 `docs/batches/2026-09-11-INPUT-FIXES-SMALL（VSC 仓）` 逐字承载（D10——零改写）；本档保留本仓份。
> 移出条目（对端份）清单：§2 「仓」列 VSC 行（B2 纯 VSC，as-of `:205`）——条目计数（对端份 / 本仓份）= 6 / 3（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 15:10 · 来源 = 用户 13:36「都可以」（Gitee #IKEZ1C + #IKALHO 离线面——评估 id=47/48）。

---

## §1 讨论（主 agent 记）

### 本批条目（2 条）

| # | 条目 | 内容 |
|---|---|---|
| **B1** | **#IKEZ1C：/advisor Thinking 子菜单必报错** | 成立·根因精确：`src/tui/cmd-advisor.mjs:89` 调 **async** `buildThinkingEntries`（定义 :225）**漏 `await`** → Promise 进 `src/tui/pickers.mjs:46` `.filter` 抛 `entries.filter is not a function`（Model 菜单正常因 `buildModelEntries:196` 是同步）。修 = +`await` + 建议 `showPicker` 入口 `Array.isArray` 守卫（把同族陷阱变显式错误）。 |
| **B2** | **#IKALHO：VSC Enter 离线可测面** | 代码层两候选（IME 组合期无守卫 / busy 静默拒发）+ **离线真 bug**：`webview/autocomplete.js:96-104` 的 Enter 接受建议与 `input.js:73` 的发送**同时绑同一元素、互不协调**（@ 下拉打开时 Enter 既发送又插入）。修 = ① Enter 分支加 `e.isComposing` 守卫 ② @ 下拉与 send 的 Enter 协调（下拉打开时 Enter 只接受建议）+ happy-dom 用例 ③（裁）busy 守卫静默→可见提示。**真机复现面（mac/输入法）不在本批**——索料待回。 |

### 已核事实（免重复）
- B1：`src/tui/cmd-advisor.mjs:89`（调用点）/`:225`（async 定义）；`src/tui/pickers.mjs:46`（filter）；`src/tui/slash-commands.mjs:120-123`（错误打印）；全仓唯一调用点 ✓。
- B2：`thincoder-vscode/webview/input.js:73`（Enter→send）/`:101-106`（composition 仅追踪高度）；`webview/send.js:17-21`（busy 静默拒发）；`webview/autocomplete.js:96-104`（下拉 Enter 冲突）；`webview/index.html:34`（#input）；`webview/panels.js:124`（_turnState 广播）。VSC 扩展版本 0.8.10（issue 引的 v0.12.3 是 CLI 版本号——错位）。
- 参考先例（B2-① 竖移规则）：`webview/input.js:76-84`（selectionStart===0 走历史）。

### 待设计裁定
1. B1 守卫形态（throw 显式错误 vs 空集返回——建议显式）+ 用例；
2. B2 三子项逐项范围（③ busy 可见化的最小形态——裁）；
3. 受影响文件全清单（行数/增量）+ 用例/AC（B1 机验判据 + B2 happy-dom 用例）+ 双端纪律核对；
4. 既有测试锁零伤核对。

### 范围边界（明确不做）
- B1 不改 picker 渲染语义；B2 不动 `_turnState` 生命周期本体（若 ③ 需要 → 打回）；不碰 mac 真机面（待复现）；不得新建档（必须 → 打回）。

### 状态
**已收口**（用户批准）。下一步 = 设计。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求+设计+测试三层已落档，待设计评审；含父侧排程项 2 条——见「需父侧排程」）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/TUI.md` **F12**（B1）+ `docs/requirements/AGENT-LOOP.md` **§8**（B2：F-F1~F-F3 / NFR-F1~F3）。
设计+测试 = `docs/design/TUI.md` **§13**（B1）+ `WEBVIEW（VSC 仓）§9`（B2）。

## 覆盖条目（本批 = §1 两条目，逐条回指）

| 条目 | 需求 | 设计 | 用例 | 验收 |
|---|---|---|---|---|
| B1：/advisor Thinking 子菜单可开（#IKEZ1C） | `requirements/TUI.md` F12 | `design/TUI.md` §13.2/§13.3 | T-B1-1~T-B1-3（§13.6） | AC-B1-1~AC-B1-4（§13.7） |
| B2：VSC Enter 离线可测面（#IKALHO） | `requirements/AGENT-LOOP.md` §8（F-F1~F-F3） | `WEBVIEW（VSC 仓）§9`（9.2） | T-B2-1~T-B2-7（§9.6） | AC-B2-1~AC-B2-5（§9.7） |

**三方条目一致**：本表条目 = 设计档 AC 回指的条目 = 需求档条目（B1 回指 F12 / B2 回指 F-F1~F-F3）。

## 勘察 4 问结论（§1 待裁——实施者据此执行，勿再选型）

1. **B1 守卫形态 = 显式 TypeError**（`showPicker` 入口首行 + Promise 输入附 "missing `await`?" 提示）——否决空集返回
   （静默吞错 = 本 issue 的体验）。用例：T-B1-1（「Thinking 子菜单不抛 + 菜单可开」机验——脚本化 picker 断言第二次调用
   entries 为真数组）/ T-B1-2（守卫抛错形态）/ T-B1-3（正控 + 0-item 保护）。见设计档 §13.2/§13.6。
2. **B2 三子项范围逐项**：① 组合期 `e.isComposing` 守卫 = **三处 Enter 分支**（`input.js:40` 中断注入 / `input.js:73` 发送 /
   `autocomplete.js:96` 接受建议——不 preventDefault、无模块状态）；② @ 下拉与 send 协调 = 下拉打开时 Enter 只接受建议
   （`input.js` 让位 + 打开态判据硬化 `!!el && display !== "none"`——含打开态断言用例）；③ busy 可见提示 = **复用既有
   toast 机制**（提取 `webview/toast.js` 共享模块 + `send.js` busy 分支追加 `showToast(t("input.busyPlaceholder"))`）——
   **不触 `_turnState` 生命周期**（无需打回：busy 判据/派生/单广播零动）。见 `WEBVIEW（VSC 仓）§9.2`~§9.4。
3. **受影响文件 + 用例/AC + 双端纪律**：见 `design/TUI.md` §13.5 与 `WEBVIEW（VSC 仓）§9.5`（行数为 as-of 实测）——
   B1 = CLI 2 源 + 1 新测试档；B2 = VSC 3 源 + 1 新模块 + 1 新测试档 + `test/files.mjs` 登记。**双端纪律**：两端各自独立
   实现、语义同源不 byte-identical——B1 纯 CLI、B2 纯 VSC 互不镜像（B2 面 CLI 无对应：无 @ 下拉/无 webview；busy 拒发
   CLI 已具备——零改动）。
4. **既有测试锁零伤核对**（基线 as-of 2026-09-11 实测）：CLI 快层 **471/458/1/12**——唯一红 = `doc-consistency` T41 ①
   的 4 条新增 V1/V2（**他批文档面**：端口批与 TUI-SELECTION 两档——非本批触碰面，如实登记、不代修）；VSC 快层
   **422/421/0/1 全绿**。本批无既有测试直驱被改面：CLI 无测试使用真 `createPickers`/`cmd-advisor`（全部 mock/probe——
   grep 核对）；VSC 无测试触碰 `input.js`/`autocomplete.js`/`paste-*`/`at-dropdown`（grep 核对）。新测试档：
   CLI `test/advisor-thinking-picker.test.mjs`（快层 glob 自动收）+ VSC `test/webview-input-enter.test.mjs`（**必须入
   `test/files.mjs`**——显式清单，不登记不跑）。

## 受影响文件（行数 as-of 2026-09-11，口径 `split("\n").length` 含末行；写域声明）

**B1（CLI 仓）**：`src/tui/cmd-advisor.mjs`(256,+0±1——:89 补 `await`) · `src/tui/pickers.mjs`(107,+5±2——`showPicker`
入口 Array.isArray 守卫) · `test/advisor-thinking-picker.test.mjs`(新增,+90±30)。

**B2（VSC 仓）**：`webview/input.js`(133,+6±3) · `webview/autocomplete.js`(201,-8±4) · `webview/send.js`(53,+3±1) ·
`webview/toast.js`(新增,+22±6) · `test/webview-input-enter.test.mjs`(新增,+130±40) · `test/files.mjs`(56,+1)。
零改核对项（B2）：`webview/controls.css` / `webview/index.html`（toast 复用既有 id/class/CSS）· `webview/loading.js` /
`webview/state.js` / `webview/chat.js` / `webview/panels.js`（零改）· 全部 locale 文件（零新增键）。

**文档写域（设计者）**：`docs/requirements/TUI.md` · `docs/design/TUI.md` · `docs/requirements/AGENT-LOOP.md` ·
`WEBVIEW（VSC 仓）`（以上已落档）；收口回写项 = `design/TUI.md` §1 模块地图两行（`cmd-advisor.mjs` / `pickers.mjs`——
设计者收口阶段回写，coder 不回写）。

**写域外（coder 不碰）**：`thincoder-vscode/AGENTS.md` 模块图 +1 行（登记新模块 `webview/toast.js`）——父侧落笔（见下）。

## 交付要求

1. 实现 = 设计档逐字契约（B1：§13.3 C-B1-1/C-B1-2；B2：`WEBVIEW（VSC 仓）§9.2` C-B2-1~C-B2-4）——语义争议回设计档，
   不自行改语义（撞墙 → 停下报告，不静默偏离）。
2. 测试 = 两新档用例 1:1（§13.6 三条 / §9.6 七条）+ VSC `test/files.mjs` 登记 + 守卫红→绿证据（T-B1-1/T-B1-2 修前红可复现）。
3. 验证分层：L0+（语法 + 定向 `node --test test/advisor-thinking-picker.test.mjs` + VSC `node --test
   test/webview-input-enter.test.mjs` + 两仓快层）；不跑全量（父侧 L2）。
4. 交付报告：透明报告（Done/Simplified/Not done）+ 逐条 AC 机验证据（命令 + 结果）+ 所触源文件**实测行数**
   （口径同表头注——供设计者收口回写，不回写文档）。
5. 不 commit；`docs/**` 零改；`AGENTS.md` 零改（写域外——父侧处理）。

## 需父侧排程 / 需注意

- **VSC 仓 `AGENTS.md` 模块图 +1 行**（登记 `webview/toast.js`）——设计者写域外，请父侧落笔或指派；
- **TODO 需求池**：本批两条目无池条目（源自 issue 评估 id=47/48）——如需登记，属主 agent 记录面；
- **他批基线红（报告不动）**：CLI 快层 1 红（`doc-consistency`——PORTABILITY / TUI-SELECTION 两档 4 条新增 V1/V2）+ 宽度检查
  9 档 11 行超宽（均为他批批次档，as-of 2026-09-11）——在途批冻结窗口，非本批触碰面；
- **mac 真机面**：输入法矩阵索料中——本批不碰（`WEBVIEW（VSC 仓）§9.8` 登记；`keyCode===229` 兼容兜底不引入）。

## 边界（本批不做）

- B1：不改 picker 渲染/过滤/导航/栈语义；不做异步 entries 支持；不改 cmd-advisor 其余子面（Model/Guard/View）；
- B2：不改 `_turnState` 生命周期本体；不改门禁语义（只禁 send 不禁录入）；不改下拉过滤/防抖/seq 语义；不改 CSS/i18n 键；
  不改 Shift+Enter 打开态既有形态；不复活排队；
- 共同：不碰真机面；不新建文档档；不 commit。

## 未确认面（呈评审/父侧）

- **B2 ③ 形态选择**（复用 toast vs 输入框闪动）= 设计裁定（选型表在 `WEBVIEW（VSC 仓）§9.3`）——评审/用户可否决重定向；
- **B2 toast 归属**：`webview/toast.js` 新模块 + `autocomplete.js` 改 import（行为零变）——属重构面，如实披露；
- **mac 真机 IME 时序差异**（Safari 组合确认 Enter 的 `isComposing` 可能为假）：登记为本批范围外，待索料后另批。

### 修正轮（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（🔴 0 · 🟡 3 · 🔵 2——发现表见 §3）。5 条全部采纳落档（同一 designId 链内；不重新发起评审）。本轮 = 修正轮（**只改文档、不碰实现**——两仓源码/测试零改；提示词实体零碰）。

**发现 → 落点映射（5/5 已落——行号 as-of 2026-09-11 修正后实测）**：

| 发现 | 级别 | 落点 |
|---|---|---|
| #1 需求表断行（F12 脱离 §2 表） | 🟡 | `requirements/TUI.md` §2 表（:37/:38）——删 F12 前空行，F11/F12 连续并入表 |
| #2 F-F3「自动隐去」未覆盖 | 🟡 | `WEBVIEW（VSC 仓）§9.7` AC-B2-3（:663）——补「自动隐去 = 原样提取的既有机制（行为零变）——断言面 = 即时可见（§9.6 注）」继承登记 |
| #3 C-B2-2 preventDefault 未写明 | 🟡 | `WEBVIEW（VSC 仓）§9.2` C-B2-2（:591）——补半句「让位 = 提前 `return` 且保留 `preventDefault`（防 Enter 默认换行落入输入框——autocomplete 侧仅 active 项存在时防默认，让位侧自带防默认兜住间隙）」 |
| #4 基线记法不一 | 🔵 | `WEBVIEW（VSC 仓）§9.7` AC-B2-4（:664）+ `requirements/AGENT-LOOP.md` NFR-F1（:233）——「422/421/0」→「422/421/0/1」（补 skip 位；口径 = total/pass/fail/skip——与 §2 上文 / CLI 侧 4 段统一） |
| #5 await 提示措辞两读 | 🔵 | `requirements/TUI.md` F12（:38）+ `design/TUI.md` §13.3（:1041）——「message 含 `await` 提示」→「Promise 输入附 `await` 提示」（与 §13.2 / AC-B1-2 同款） |

**变更记录注记**：`requirements/TUI.md` / `design/TUI.md` / `WEBVIEW（VSC 仓）` 三档各追加一行修正轮注记；`AGENT-LOOP.md` 无变更记录节——不加。**定性**：纯格式/措辞/登记——零语义、零新内容；判定句与验收标准的验收语义不动。

**披露（超本批修复面——提请父侧）**：`requirements/TUI.md` F13 行（:40）前空行（:39）未动——F13 为第 33 批（REVIEW-ATTENTION）行、同类表格断行；非本批评审发现、涉他批在飞面（D5 冻结），本轮只修 F12 一处；如需一并并入表（删该空行）请父侧裁量。

**检查（修正后实测）**：CLI 仓 `check-doc-width`——本批触碰档（`TUI.md` / `design/TUI.md` / `AGENT-LOOP.md`）零超宽、零一致性新增；他批在飞档违规照实报告（宽度 11 档 18 行 + 一致性新增 5 条——全部在 `docs/batches/*` 他批档，报告不动）。VSC 仓 `check-doc-width`——**OK：全域 67 文件零超宽、一致性新增 0**。两仓均未 commit。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

评审对象（第 28 批·输入面小修——轮次 1）：批次档 §2 · `design/TUI.md` §13 · `requirements/TUI.md` F12 · `requirements/AGENT-LOOP.md` §8 · `WEBVIEW（VSC 仓）` §3/§6/§9（只读节段；实现代码未读，行数/grep 声明未对源码复验 = unverified）。重点核 ①~⑤ 均核实一致；发现 0 🔴。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 文档结构 | 🟡 | `requirements/TUI.md:36` 空行把 F12 行（:37）与 F1–F11 表（…:35）截断——F12 脱离 §2 功能需求表、不再作为表格行渲染（F9–F11 为连续行，仅 F12 被隔断）。 | 删 :36 空行、F12 并入同表（父侧文档层一行修复）。 |
| 2 | 验收覆盖 | 🟡 | F-F3 判定句含「自动隐去」（`AGENT-LOOP.md:227`），而 AC-B2-3（`WEBVIEW.md:663`）与 T-B2-5（`:653`）只断言即时可见；§9.6 表前注（`:642-645`）已披露不测 2.6s 淡出。 | 在 AC-B2-3 或测试注显式登记「自动隐去 = 原样提取的既有机制（行为零变）」的继承关系，或补一条 mock-timer 确定性断言，闭合 F-F3 判定句。 |
| 3 | 清晰性 | 🟡 | C-B2-2 让位分支（`WEBVIEW.md:590-594`）仅写「`input.js` 不发送」，未写明 preventDefault 处置；C-B2-1（`:586-589`）对组合分支明示「不 preventDefault」——同一分支改造两半颗粒度不一。 | 契约补半句：让位 = 提前 return 且（保留/跳过）preventDefault 显式定死，防实现期自行发挥。 |
| 4 | 一致性 | 🔵 | VSC 基线记法不一：批次档 §2（`:67-69`）「422/421/0/1 全绿」（4 段含 skip）vs `WEBVIEW.md:664` / `AGENT-LOOP.md:233`「422/421/0」（3 段）；CLI 侧全档统一 4 段（471/458/1/12）。 | 统一口径（补注 skip 位或约定 3 段），免后续审计把 skip 误读为红。 |
| 5 | 措辞精度 | 🔵 | F12（`requirements/TUI.md:37`）「非数组…（message 含 `await` 提示）」与 `design/TUI.md:1040-1041` 同款通指措辞 vs 实现片段（`:1030-1034`）/AC-B1-2（`:1080`）实为「仅 Promise 分支附 await 提示」——两读并存（null/字符串输入无 await 子串），验收审计可能误判。 | 任一侧微调（如「Promise 输入附 `await` 提示」）对齐，纯措辞零语义。 |

计数：🔴 0 · 🟡 3 · 🔵 2
VERDICT: pass

### 轮次 2（评审子代理）

**评审对象（第 28 批·输入面小修——轮次 2：单轮校验 + 硬性预算）**：只核修正轮 5 条落点（映射 = §2 修正块，行号 as-of 修正后）+ 变更记录三行；锚点区间只读（±10 行），不作新问题狩猎。

**逐点校验（发现 → 落点 → 实测）**：

| 落点（映射） | 实测证据 | 判定 |
|---|---|---|
| 🟡#1 `requirements/TUI.md` §2 表（:37/:38） | :37 = F11 行、:38 = F12 行——与 F1–F10 表逐行连续、无空行截断（F12 已在表内） | 已落 |
| 🟡#2 `WEBVIEW（VSC 仓）§9.7` AC-B2-3（:663） | :663 载「**自动隐去 = 原样提取的既有机制（行为零变）**——断言面 = 即时可见（§9.6 注）」；§9.6 注（:645）确载「断言只覆盖即时态（不等 2.6s 淡出）」——指针可解析 | 已落 |
| 🟡#3 `WEBVIEW（VSC 仓）§9.2` C-B2-2（:591） | :591 载「**让位 = 提前 `return` 且保留 `preventDefault`**（防 Enter 默认换行落入输入框——autocomplete 侧仅 active 项存在时防默认，让位侧自带防默认兜住间隙）」 | 已落 |
| 🔵#4 `WEBVIEW（VSC 仓）§9.7` AC-B2-4（:664）+ `requirements/AGENT-LOOP.md` NFR-F1（:233） | :664「基线 as-of 2026-09-11：422/421/0/1」；:233「基线 as-of 2026-09-11：422/421/0/1」——两处 4 段含 skip、记法统一 | 已落 |
| 🔵#5 `requirements/TUI.md` F12（:38）+ `design/TUI.md` §13.3（:1041） | :38「（Promise 输入附 `await` 提示）」；:1041「（不静默、不裸抛；Promise 输入附 `await` 提示）」——措辞对齐 | 已落 |

**变更记录三行**：`requirements/TUI.md:70` / `design/TUI.md:1308` / `WEBVIEW（VSC 仓）:830` 均存在，且与各落点内容互证一致——已落。

**发现表（残遗/未落/新增矛盾）**：0 条。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| — | — | — | 无发现（0 条） | — |

**计数**：🔴 0 · 🟡 0 · 🔵 0

**未复验（锚点外，如实标注——不构成发现）**：`design/TUI.md:1308` 的「与 §13.2 / AC-B1-2 同款」互指、§2 修正块「`AGENT-LOOP.md` 无变更记录节」主张。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 02:30 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 pass（🔴0 · 🟡3 · 🔵2）→ 修正轮 5/5（F12 并入表 + AC-B2-3 机制句 + C-B2-2 preventDefault 依据 + 口径统一 + 措辞）→ **轮次 2 = pass**（5/5 核销 · 0 发现）→ **token 已签发**（值不落档）。

**批准范围**：B1 CLI 3 档（`cmd-advisor.mjs` 补 `await` · `pickers.mjs` Array.isArray 守卫 · 新测档 `advisor-thinking-picker.test.mjs`）+ B2 VSC 6 档（`webview/input.js` · `autocomplete.js` · `send.js` · 新 `toast.js` · 新测档 `webview-input-enter.test.mjs` · `test/files.mjs`）；零改核对项照 §2。

**遗留（批准时登记）**：① 收口回写：`design/TUI.md` §1 模块地图两行（设计者）；② 父侧：`thincoder-vscode/AGENTS.md` 模块图 +1 行（toast.js）；③ commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：交付完成——终态 `clean`**（2026-09-11）。范围 = §2 两条目全量交付（B1 CLI 3 档 / B2 VSC 6 档）。内部协议闭环：explore 偏差审计 1 轮（四类偏差 0 条）→ advisor 代码评审首审（0 🔴 · 0 需修 🟡 · 3 🔵——3/3 采纳自修·修正轮 1/5）→ 复评（3/3 `Fixed`，**pass**）。零 commit；`docs/**` 手工零改（本 §5 经 `batch_segment` 工具通道写入本档，设计档/需求档零触）。

### 5.1 交付清单 + 实测行数（口径 `split("\n").length` 含末行——供设计者收口回写）

| 仓 | 文件 | 批前（设计 as-of） | 实测（交付后） | 本批增量 | 变更点 |
|---|---|---|---|---|---|
| CLI | `src/tui/cmd-advisor.mjs` | 256 | **256** | +0 | :89 补 `await`（C-B1-1） |
| CLI | `src/tui/pickers.mjs` | 107 | **118** | +6（守卫块逐字；余 +5 = 批前在飞漂移，非本批） | `showPicker` 入口 Array.isArray 守卫（C-B1-2，:44-49；先于 `closePicker()`） |
| CLI | `test/advisor-thinking-picker.test.mjs` | — | **115**（新增） | 新增 | T-B1-1~3 |
| VSC | `webview/input.js` | 133 | **146** | +13 | C-B2-1 ×2（:42/:77）+ C-B2-2 让位（:78-84——保留 preventDefault）+ C-B2-3 硬化（:121-124） |
| VSC | `webview/autocomplete.js` | 201 | **189** | −12 | C-B2-1 接受分支守卫（:99）+ showToast 提取改 import（:7；本地私有实现删） |
| VSC | `webview/send.js` | 53 | **57** | +4 | C-B2-4 busy 分支追加 `showToast(t("input.busyPlaceholder"))`（:23） |
| VSC | `webview/toast.js` | — | **23**（新增） | 新增 | showToast 共享模块（原样提取：懒建 `#paste-toast` / `.visible` / 2.6s / 静态 `_t`） |
| VSC | `test/webview-input-enter.test.mjs` | — | **204**（新增） | 新增 | T-B2-1~7 |
| VSC | `test/files.mjs` | 56 | **61** | +1 | 新档登记（:59；余 +4 = 他批在飞条目） |

**增量超设计预估带（3 处，如实披露）**：① `pickers.mjs` 实测 118（预估 110±2 含批前——本批贡献 +6 = 守卫块，仍在内）；② `input.js` 实测 +13（预估 +6±3——超 4：C-B2-1/C-B2-2 逐字注释块 + 修正轮次序注 +1）；③ `test/webview-input-enter.test.mjs` 实测 204（预估 130±40——超 34：7 用例 + 自备 DOM 装配 + 逐测复位 helper + 断言密度）。

### 5.2 AC 机验（逐条——命令 + 结果）

| AC | 判据 | 证据（命令/断言） | 结果 |
|---|---|---|---|
| AC-B1-1 | entries 真数组 + 含条目 + 全程无 `[error]` | `node --test test/advisor-thinking-picker.test.mjs` → T-B1-1 | 绿（修前红——5.4） |
| AC-B1-2 | 非数组 → 同步 TypeError（子串 `entries must be an array` + Promise 分支 `await` 提示） | T-B1-2（含排序判别：真层在栈未被关闭 + 栈深 1） | 绿（修前红） |
| AC-B1-3 | 正控 + 0-item 保护零回归 | T-B1-3 | 绿 |
| AC-B1-4 | CLI 快层不新增红；39 处调用点零触达 | `cd thincoder && npm test` → 574/559/1/14；`grep "showPicker("` 全量 39 处皆数组 | 唯一红 = `doc-consistency` T41 ① 他批既有红（非本批面）；零新增 |
| AC-B2-1 | 组合期 Enter 三路不触达且不粘滞 | T-B2-2 / T-B2-6 / T-B2-7（发送 / 接受建议 / 注入） | 绿 |
| AC-B2-2 | 下拉打开只接受建议；关闭照常发；元素缺失 ≠ 打开 | T-B2-1 / T-B2-3（含 preventDefault 保留断言）/ T-B2-4 | 绿 |
| AC-B2-3 | busy 拒发：零发送 + 文本保留 + toast 可见（文案 = busy 串） | T-B2-5（即时态；自动隐去 = 原样提取既有机制——继承登记） | 绿 |
| AC-B2-4 | 既有 webview 族全绿 + `test/files.mjs` 登记 + CLI 本面零改 | VSC 快层 466/459/0/7；`files.mjs:59`；CLI 本面零文件触 | 绿 |
| AC-B2-5 | `showToast` 定义点单处（autocomplete 私有零残留） | `grep "function showToast"` → 唯一 `webview/toast.js:10` | ✓ |

### 5.3 测试实测（先落盘再查——日志为临时产物，读毕已删，工作树零残留）

- CLI 定向：`node --test test/advisor-thinking-picker.test.mjs` → **3/3 pass**
- VSC 定向：`node --test test/webview-input-enter.test.mjs` → **7/7 pass**
- CLI 快层：`npm test`（日志落盘后读汇总）→ **574 tests / 559 pass / 1 fail / 14 skip**——唯一 fail = `doc-consistency` T41 ①（他批文档面 6 条：ACP-CHANNEL-FIXES / PORTABILITY / TUI-SELECTION；§2 已登记非本批触碰面，不代修）
- VSC 快层：`npm test`（日志落盘后读汇总）→ **466 tests / 459 pass / 0 fail / 7 skip**（含新档 7 例）
- 基线记数相对设计 as-of 的差异（CLI 471/458 → 574/559；VSC 422/421 → 466/459）来自他批在飞测试新增，非本批口径变化

### 5.4 红→绿证据（修前红可复现——脚本化：临时重建修前态 → 跑测 → 逐字节恢复，恢复已核）

- T-B1-1 / T-B1-2：修前（漏 `await` → Promise 进 picker；无守卫 → 同步不抛）**红**；修后绿
- T-B2-2 / T-B2-3 / T-B2-5 / T-B2-6 / T-B2-7：修前（无组合守卫 / 无让位 / 无 toast）**红**；修后绿
- T-B2-4：修前两态皆绿（让位缺陷在引入后才显性）——另跑「让位在位 + 判据未硬化」变体 → **红**，锁定 C-B2-3 必要性
- T-B1-2 排序契约：守卫移至 `closePicker()` 后 → **红**（变体实测），锁定 C-B1-2「守卫先于 closePicker()」
- T-B2-1（正控）修前修后皆绿——回归对照

### 5.5 透明表（Done / Simplified / Not done）

| 项 | 状态 | 说明 |
|---|---|---|
| 9 档逐字契约落地 | **Done** | C-B1-1/C-B1-2 + C-B2-1~C-B2-4 逐条按设计落笔（含修正轮 C-B2-2「保留 preventDefault」形态） |
| 用例表 1:1 | **Done** | T-B1-1~3 + T-B2-1~**7**（任务书括号写「T-B2-1~6」与设计 §9.6 七条不符——按设计权威实现 7 条，如实披露） |
| `test/files.mjs` 登记 | **Done** | :59（未登记不跑——已核跑） |
| 红线（零改核对项 / 文档 / commit） | **Done** | 零改核对项（controls.css/index.html/loading.js/state.js/chat.js/panels.js/locale）mtime 全部早于交付窗口；`docs/**` 手工零改；未 commit；未发起（设计）评审 |
| 简化 | **无** | 零简化：逐字注释/守卫形态/文案复用均按契约落地 |
| Not done（范围外，各有其主） | — | mac 真机 IME 矩阵（§9.8 登记）；VSC `AGENTS.md` 模块图 +1 行（父侧）；`design/TUI.md` §1 模块地图两行回写（设计者）；commit（父侧） |
| 追加·披露（测试面内部） | Done | 测试自备 DOM 补 `#file-input` / `#attach-btn`（设计列举 `#at-dropdown`/`#paste-bar`/`#paste-badge` 之外）——真 `initAutocomplete` 装配所需（解引用点）；共享 fixture 零改。另：T-B2-3 追加 dispatchEvent 返回值断言（preventDefault 保留——修正轮依据机判化） |

### 5.6 偏差审计 + 代码评审（轮次与终态）

- **explore 偏差审计（1 轮）**：四类偏差（部分实现 / 静默简化 / 文档漂移 / 超清单改动）**0 条** → clean；点名观察 2 条（行数超预估带 → 已入 5.1；测试日志文件 → 已删）均已处置。
- **advisor 代码评审首审**：0 🔴 · 0 需修 🟡 · 3 🔵（① T-B1-2 排序判别力不足 ② T-B2-4 合成尾态未登记 ③ input.js 次序前提注释缺失）——3/3 采纳自修（修正轮 1/5；仅测试/注释面，零行为改动）。
- **复评（轮次 2）**：3/3 修正核验 `Fixed`（T-B1-2 判别力成立；T-B2-4 注释登记且引文核实；input.js 次序前提句在位且前提属实）→ **pass**，零新发现。
- **终态：`clean`**（审计 clean + 评审 pass + 复评 pass）。

## §6 验证与收口（父代理自写）

**2026-09-12 05:45 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **3/3 + 7/7** · CLI 快层 574/559/1（他链）· VSC 466/459/0 · **修前红→绿可复现**（回退逐字节恢复）；
- **父侧抽核**：`await` ✓ · `Array.isArray` 守卫 ✓ · `toast.js` 22 行导出 ✓ · 让位+preventDefault ✓；
- 内部：审计 clean + 评审（0🔴·3🔵 全采纳）→ 修正 3/3 → clean。

### 逐条验收结论

- **AC-B1-1~4 / AC-B2-1~5 全绿**（含 T-B2-1~7——按设计权威实现、任务书括号偏差已披露）；**Simplified 零 · Not done 零**（范围外三项各有其主）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：9 档实测 ✓ · 指针：设计 §13/§9 ↔ 用例 ✓ · 待办：三项（下）✓

### 遗留项

1. **父侧**：`thincoder-vscode/AGENTS.md` 模块图 +1 行（`webview/toast.js`）；
2. **设计者**：`design/TUI.md` §1 两行行数回写（实测值见 §5.1）；mac 真机 IME 矩阵（§9.8 范围外）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
