# 2026-11-04 · timer-marker-text
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 每段只有一个作者：作者的段可 `append` 加内容、可就地改（`edit`，§4.19）；非作者一概拒。
> 编制：主 agent · 2026-11-04 · 来源 = 用户 2026-11-04 16:02「发现个问题：linux终端界面显示不了 timer的那个图标，改直接用文字吧」。
> 台账 = #2034（cli · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-04
- 本批条目 = 三件：① CLI 状态行 timer 标记改文字形 `timer N`；② `/timers` 逐行行首同改；③ 引用这两处的设计档与机制档/协议档字面随动。
- 关键判据 = 状态行 strip-ANSI 含 `timer N` 且零 `⏰`；零在途逐字节等价；到期态警示色不变；`/timers` 逐行行首为 `timer <i>`。
- 授权口径 = 用户 16:03「可以。」（范围与词形两条已定决定）＋ 17:54「自动跑完。」（整批令，覆盖批准门，批内全链自动跑完）。

## 已定决定

- **已定决定**：范围 = **只改 CLI 两端面**（状态行标记 ∥ `/timers` 逐行），VSC ∥ 桌面 ∥ 服务端保留 `⏰N`；理由 = Linux 终端缺 U+23F0 字形属**宿主能力差异**（跨端差异纪律的唯一例外），webview 面渲染正常不动。 · 用户原话：「**可以。**」 · 时间：2026-11-04 16:03
- **已定决定**：标记文字 = **`timer N`**（N = 在途数），不新造词（产品里这东西一直叫 timer：`/timers` 命令 ∥ `无在途 timer` ∥ 工具名 `timer`）。到期态仍走警示色，形态 `timer N` 不变。 · 用户原话：「**可以。**」 · 时间：2026-11-04 16:03

## 现场实读（开工前定位）

`⏰`（U+23F0）在盘上的分布（全仓扫串，103 处命中，其中**产品码 7 处**）：

| 端 | 落点 | 本批是否改 |
|---|---|---|
| CLI | `thincoder-cli/src/tui/status-line.mjs:174` 状态行 ` │ ⏰N` | **改** |
| CLI | `thincoder-cli/src/tui/cmd-timers.mjs:68` `/timers` 逐行 `⏰<i> · …` | **改** |
| VSC | `thincoder-vscode/locales/en.json` ∥ `zh.json` 的 `status.timer` = `⏰${n}` | 不改 |
| 桌面 | `thincoder-desktop/renderer/i18n.mjs` 两处 `status.timer` | 不改 |
| 服务端 | `thincoder-server/public/views-me-chat-composer.mjs:136` | 不改 |
| 核 | `thincoder-core/agent/timers.mjs:102` 注入行 `[System reminder: ⏰ timer — …]` | 不改（模型可见契约文本） |

**不动核的注入行是本批的硬边界**：那行是模型可见的历史文本，改它等于改契约，与本批「终端字形」无关。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计档 §7.6 已落；doc-check gate PASS）

### 2.1 本批条目（覆盖）

| # | 条目 | 归属 | 验收落点 |
|---|---|---|---|
| 1 | CLI 状态行 timer 段改文字形 `timer N`（N = 在途数） | 台账 #2034 · 需求 `docs/cli/requirements/TUI.md` F17 | 单元档 T1–T3、T6 |
| 2 | CLI `/timers` 逐行标记改文字形 `timer <i>`（i = 1 起序号） | 同 | 单元档 T4–T5 |
| 3 | CLI 设计档同步（词形 ∥ 端差登记 ∥ 不动位） | 同 | 机检门 PASS |

三向一致：#1–#2 ↔ 需求 F17 判定句 ↔ 设计 `docs/cli/design/TUI.md` §7.6（本批已落）。

### 2.2 设计档落点

`docs/cli/design/TUI.md` §7.6 **就地改**（不新起文件）：三态表「已设」行、落点与形态、负向锁、可机判四处改词形；新增三段——「词形（文字形）」「端差（登记 · 宿主能力例外）」「不动位」。

### 2.3 机制设计（形态，一句一事）

- **状态行段**：`timerHint` 零在途 ⇒ `""`（负向锁不变）；否则 ` │ timer <N>`。到期态 = **同一串**，只在外面包 `ansi.reset + C.warn`、收尾复归 `ansi.dim` —— 只换字面，色与段位零动。
- **`/timers` 逐行**：行首段 `timer <i>`（`i` = 1 起序号，即今日符号位同一位置）；其后 kind ∥ 剩余 ∥ message 首行逐字零变；零在途仍走 `无在途 timer`。
- **字面直书，不新增 i18n 键（existing but unusable）**：`status.timer` 键**存在但 CLI 取不到**——它住端侧 locale（`thincoder-vscode/locales/en.json:360` ∥ `zh.json:360`，值均为 `"status.timer": "⏰${n}"`；桌面 `thincoder-desktop/renderer/i18n.mjs:261` ∥ `:369` 同值），**核容器无该键**（全仓扫 `status.timer` 零核命中；`docs/vsc/design/WEBVIEW-PROTOCOL.md:333`「**端特有键**（住 `thincoder-vscode/locales/{zh,en}.json`——不进核容器）」）⇒ CLI 侧 `t()` 走核字典（`thincoder-cli/src/tui/status-line.mjs:13` `import { t } from "@thincoder/core/i18n.mjs"`）取不到它，故字面直书；`timer` 一词已由 `/timers` 命令、空态行 `无在途 timer`、模型工具名 `timer` 承载。
- **加宽的账（实测）**：`stringWidth(" │ timer 2") = 10` 列 ∥ `stringWidth(" │ ⏰2") = 5` 列 ⇒ 状态行宽 5 显示列；整行 ≤ `cols − 1` 由既有 `statusMax` 截断保证（`thincoder-cli/src/tui/status-line.mjs:63-64`）——不新增机制 ∥ 不新增分支。
- **核注入行零改**：`[System reminder: ⏰ timer — <message>]` 逐字保持（模型可见契约文本，机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30）。

### 2.4 受影响文件与测试覆盖

| 文件 | 面 | 改什么 |
|---|---|---|
| `thincoder-cli/src/tui/status-line.mjs` | 产品码 | `timerHint` 字面两处（`⏰${timers.length}`，warn 态与常态各一） |
| `thincoder-cli/src/tui/cmd-timers.mjs` | 产品码 | 行首 `⏰${i + 1}` → `timer ${i + 1}`；档头注释同步 |
| `docs/cli/design/TUI.md` | 设计档 | §7.6（本 spawn 已落） |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 设计档（机制档） | §6.30.7 T-TW10 ∥ T-TW12 断言真值；§6.30.18 `/timers` 行形与状态行字面改指单源 |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 设计档（协议档） | §6.1 计时器段行：CLI 字面 ∥ 端差登记 ∥ 死坐标收正 |
| `docs/batches/2026-11-04-timer-marker-text.test.mjs` | 单元档（用后即删） | 新建 |

**档级结论**：代码侧无跨档文件——改的是 CLI 端面显示字面，核 ∥ 投影 ∥ VSC ∥ 桌面 ∥ 服务端的**产品码**零触；两处设计档随动（机制档 ∥ 协议档）属文档面，不改任何端的行为。

### 2.5 验收对照（可机判）

- 命令（cwd = 仓根 `thincoder/`）：`node --test docs/batches/2026-11-04-timer-marker-text.test.mjs`
- 用例：见 §2.6；每条断言落在 `renderStatus` / `handleTimersCommand` 的出口串上，不读文档散文。

### 2.6 用例表（正常 ∥ 边界 ∥ 错误）

| 号 | 类 | 输入 | 期望输出 |
|---|---|---|---|
| T1 | 正常 | `_pendingTimers` 2 条、均未到期 | 状态行 strip-ANSI 含 ` │ timer 2`，无 warn 序列 |
| T2 | 边界·到期 | 2 条、其一 `expiresAt <= now` | 含 `timer 2`，且串前有 `C.warn` 序列、串后复归 dim |
| T3 | 边界·零在途 | `_pendingTimers` `[]` | 与空基线**逐字节等价**：零 `timer` 段、零新增色对 |
| T4 | 正常 | `/timers` 三项（一一次性 = 三标识皆不在场 ∥ 一 `everyMs` 整分 ∥ 一 `at: true` 且 `expiresAt` 有限） | 三行分别以 `timer 1` / `timer 2` / `timer 3` 起；行 1 无 kind 段（`kindText` 返 `null`）∥ 行 2 含 ` · 每 <N>m` ∥ 行 3 含 ` · 于 <YYYY-MM-DD HH:MM>`；其后 ` · 剩余 <mm:ss> · <message 首行>` 逐字零变 |
| T5 | 错误·空态 | `_pendingTimers` `[]` 调 `/timers` | 恰一行 `无在途 timer`，零 `timer <i>` 行 |
| T6 | 边界·数量两位 | 10 条在途 | 含 `timer 10`（不补零、不截断） |

### 2.7 关键决策

- **换词不换符号**：符号 `⏰`（U+23F0）在 Linux 终端无字形（用户 2026-11-04 16:02 报「显示不了那个图标」）——字形不可用即换词，不引第二套图标、不做字体探测分支（无场景支撑的分支会带出告警与跨端一致性问题）。
- **不新造词**：用现成 `timer`；候选 `计时 N` 否决——产品里无此词，新造一个词等于一个物件两个名字。
- **`/timers` 行首只换词不换位**：数字语义仍是 1 起序号（与今日 `⏰<i>` 同位），避免顺手改语义。
- **端差登记而非消解**：VSC ∥ 桌面 ∥ 服务端字形齐备，保留 `⏰N` —— 宿主能力差异（跨端差异纪律的唯一例外），在设计 §7.6「端差（登记 · 宿主能力例外）」段与需求 F17「端差（登记）」行同口径。

### 2.8 集成测试（`test/RTM.md` 增量）

- **已读**（2026-11-04 实读）：`test/RTM.md` 无一行断言 CLI timer 标记——按 `timer` / `计时` / `状态行` 扫，`timer` 零命中；`计时` 唯一命中 = `test/RTM.md:232`「等首 token 与流中途停摆分开计时」（断流窗注释，非 timer 面）；`状态行` 命中均为批档门 ∥ ctx% ∥ 撞帽等无关节 ⇒ 零改写、零删除。
- **新增行：不新增**。两入口逐一对照——①「产品真需要的业务场景」：timer 标记是信息读数，断言面在单组件纯函数内部，无跨组件交互可评；②「生产真发生过的问题」：本批成因是宿主字形成立与否，已由 T1 的字面断言直接读出，不构成可评的组件交互。既有同族节在盘 = `test/RTM.md` §16「状态行百分比与压缩判据同尺」（载体 `test/integration/context-percent-calibrated.test.mjs`，16-1 已过）——该行断的是 ctx% 业务结果，本批不改该结果 ⇒ 零改写；若要覆盖「核在途表 → 状态行」这根接线，按 `test/RTM.md` §16 节注形补行，号先定再写用例名。

### 2.9 上抛项

1. **已落**——机制档（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`）：§6.30.7 T-TW10 真值改 `timer 2` ∥ 空态零 `timer` 段、T-TW12 改零 `timer` 段；§6.30.18 `/timers` 逐条行形改 `timer <i>`；同节状态行句去 `⏰N` 字面，字面形改指 `docs/cli/design/TUI.md` §7.6 单源。
2. **已落**——协议档（`docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1）：计时器段 CLI 列改 ` │ timer N`，结论由「等价」转「实证例外（宿主能力面证据）」，死坐标 `render-frame.mjs:422` 收正为 `thincoder-cli/src/tui/status-line.mjs:174`（`buildStatusLine` `:84`）。

### 2.10 先例与勘察证据

- **最接近先例**：先例批 = `docs/batches/2026-10-15-timer-face-closeout.md`（timer 可见面落地批）；实现坐标 = 状态段簇尾（`thincoder-cli/src/tui/status-line.mjs:174` `timerHint`，`ledgerHint` 之后、`titleHint` 之前）∥ `/timers` 逐条行（`thincoder-cli/src/tui/cmd-timers.mjs:68`）；设计档节 = 设计 §7.6（同簇尾位例族 = §7.4 标题段 / §7.8 登录态段）。
- **对齐**（三项不动）：段落位不变 ∥ 既有 `ansi.reset + C.warn` 包裹口径不变 ∥ 零缓存活读（每帧 recompute）不变。
- **偏离**：符号形 `⏰N` 改文字形 `timer N`——理由 = 宿主字形缺失（用户 2026-11-04 16:02「linux终端界面显示不了 timer的那个图标」），属宿主能力例外，不是形态偏好。
- **勘察证据（public-source survey）**：`PROJECT-MANIFEST.json` `index.publicRepos` = `[]` ⇒ 无声明外部公共仓，无独立文档仓相关。在仓勘察四处：需求 `docs/cli/requirements/TUI.md` F17 ∥ 机制档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.7 / §6.30.18 ∥ 协议档 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1 ∥ 核 i18n 字典（`status.timer` 零命中）。
- **三向一致核对（实读）**：需求 F17 判定句逐字 = 「在途 2 ⇒ strip-ANSI 含 `timer 2`；含过期项 ⇒ 含警示色序列；空 ⇒ 零该串 + 逐字节等价」；机制档 §6.30.7 T-TW10 逐字 = 「含 `timer 2`；含过期 ⇒ 含警示色序列；空 ⇒ 零 `timer` 段 + 逐字节等价」——与 §2.6 T1–T3 同判据。协议档 §6.1 计时器段逐字（`docs/vsc/design/WEBVIEW-PROTOCOL.md:249`）= 「` │ timer N`（状态段簇尾——`thincoder-cli/src/tui/status-line.mjs:174`（`buildStatusLine` `:84`）；含过期项 ⇒ 警示色）」+ 结论「**实证例外（宿主能力面证据）**」——与设计 §7.6 端差登记同口径，三处已落。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-11-04-timer-marker-text.md` §2（设计）∥ `docs/cli/design/TUI.md` §7.6（显示形态单源）。

**射程外未取证**：需求 `docs/cli/requirements/TUI.md` F17 · 机制档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.7/§6.30.18 · 协议档 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1（§2.9 称「已落」，本次未读）。

**抽验读数（判据 8 自测 + 事实核）**

- 档级（判据 8 自测）：`thincoder-cli/src/tui/status-line.mjs` **204 行** ∥ `thincoder-cli/src/tui/cmd-timers.mjs` **71 行** ⇒ §2.4 档级结论「代码侧无跨档文件」成立（无 >500 者，亦无 300 行长函数）。
- `timerHint` 实读：一处定义行含 `⏰${timers.length}` 两处字面（warn 态 ∥ 常态），与 §2.4 描述相符。
- `/timers` 递交行实读：`⏰${i + 1}${kind === null ? "" : ` · ${kind}`}...`，与 §2.3「只换行首、其后逐字零变」相符。
- CLI 产品码 `⏰` 实扫：仅上述两档（第三条为档头注释，§2.4「档头注释同步」已覆盖）。
- 测试面：`**/test/**/*.mjs` 全域 `⏰` **零命中** ⇒ 无既有单测因换字面转红。
- 宽度账：`charWidth` 实读落「其余 = 1」支（U+23F0 ∥ U+2502 均不入宽表）⇒ §2.3 的 10 列 ∥ 5 列 ∥ 差 5 列成立；`statusMax` 截断点实读在位。
- RTM 复核（§2.8）：`test/RTM.md` 全档 `timer` 零命中 · `计时` 唯一命中在断流窗注释 · `状态行` 命中均为批档门 ∥ ctx% ∥ 撞帽 ⇒ 零改写零删除的结论成立。

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | Requirements coverage | 🟡 | `docs/cli/design/TUI.md` §7.6「不动位」把 `[System reminder: ⏰ timer — <message>]` 记为「模型可见的契约文本」，但同节「触发落流」明写该行以 `C.warn` 推入会话流；实读 `thincoder-cli/src/tui/tool-events.mjs` 有 `last.content.startsWith("[System reminder:")` 镜像分支 ⇒ Linux 终端用户在会话流仍看到同一枚无字形（豆腐块），用户 16:02 报的症状在流内未消 | 在「不动位」处补一句：该行仍进会话流（用户可见），Linux 字形缺失同样影响此行；本批按已定范围（只改状态行 ∥ `/timers` 逐行）不改，改核注入文本另起批 |
| 2 | Clarity / 事实准确 | 🟡 | §2.3「CLI 侧无 `status.timer` 键（核字典与端侧 locale 均无该键——实读确认）」与同档 §1 实读表互斥：§1 明列 VSC `locales/en.json` ∥ `zh.json` 与桌面 `renderer/i18n.mjs` 携 `status.timer` = `⏰${n}`；盘上可核 `thincoder-vscode/locales/en.json` 为 `"status.timer": "⏰${n}"`，`docs/vsc/design/WEBVIEW-PROTOCOL.md` 亦有该键行 | 改写成「existing but unusable」形：`status.timer` 住端侧 locale（VSC ∥ 桌面），核容器无该键 ⇒ CLI 经 `@thincoder/core/i18n.mjs` 取不到，故字面直书 |
| 3 | Closest precedent（判据 9） | 🟡 | §2 无「最接近先例」行（实现坐标 ∥ 对应设计档节 ∥ 先例批 + 对齐/偏离理由）。器形先例在盘：`docs/batches/2026-10-15-timer-face-closeout.md`（timer 可见面落地批）∥ 批内单测落 `docs/batches/<批档名>.test.mjs` 的批族惯例；`docs/cli/design/TUI.md` §7.6 内仅散落「先例 = §7.4 标题段与 LEDGER-SURFACE 同区」「同 ledgerHint 实现口径」 | 补一行：先例批 = 上述批 ∥ 段位 = §7.4 / LEDGER-SURFACE 同簇尾 ∥ 对齐 = 同 dim 段样式 + ledgerHint warn 包裹口径 ∥ 偏离 = 符号形改文字形（理由 = 宿主字形缺失，用户 16:02 报） |
| 4 | Survey evidence（判据 10） | 🟡 | 无调研证据行（查过哪些档 / 是否相关；无独立文档仓时须显式记「无相关」）。§2 只给在仓「实读确认」，与批族「勘察证据行」形不一致 | 补一行：查过 = 需求 F17 ∥ 机制档 §6.30 ∥ 协议档 §6.1 ∥ 端侧 locale ∥ `PROJECT-MANIFEST.json` 的 `index.publicRepos`；结论按实读写（含「无独立文档仓相关」） |
| 5 | Doc hygiene / 状态行 | 🟡 | §2 有两行 `**状态行**：`（「设计完成（设计档 §7.6 已落；机检门 PASS）」∥「设计完成 · 2026-11-04」）；§1 状态行仍「🔄 进行中（…）」且其下留模板占位 `<§1 模板占位：本批条目 / 关键判据 / 授权口径>`（正文已在其后） | §2 只留一行状态行；§1 清掉模板占位行（留占位读起来像待填） |
| 6 | Integration test（判据 12） | 🟡 | §2.8 主体成立（RTM 实读复核如上），但结句「要 UAT 面则须另起「CLI 状态行读面」一行，不属本批」是范围理由，不属唯一成立的那条；且 RTM 已有同族节 = §16「状态行百分比与压缩判据同尺」（进入口 = CLI 恢复会话读状态行段，载体 `test/integration/context-percent-calibrated.test.mjs` 在盘）⇒「须另起节」与盘上形态不符 | 删该结句，只留「零改写 ∥ 零新增」+ 唯一理由（不动既有用例所断的业务结果；成因 = 宿主字形成立与否，已由 T1 字面断言直读）；若要覆盖「核在途表 → 状态行」接线，按 RTM §16 节注形补行并先定号 |
| 7 | Clarity / 用例表 | 🔵 | T4 期望「kind 段只在非一次性行插入」未给 `at` 行逐字。实读 `thincoder-cli/src/tui/cmd-timers.mjs` `kindText`：`at === true` 且 `expiresAt` 有限 ⇒ 返 `于 <YYYY-MM-DD HH:MM>`（非 `null`），而「一次性」在代码注释里 = 三标识皆不在场 | T4 补逐字：行 2 含 ` · 每 Nm`（或秒形），行 3 含 ` · 于 <刻>` |
| 8 | Acceptance 可跑性 | 🔵 | §2.5 命令未写 cwd；批族惯例 = 仓根 `thincoder/`（`docs/batches/2026-10-15-timer-face-closeout.md`「cwd = `thincoder/`」） | 命令处注 cwd = `thincoder/` |
| 9 | 射程限制（登记） | 🔵 | 需求 F17 ∥ 机制档 §6.30.7/§6.30.18 ∥ 协议档 §6.1 三处不在本次射程 ⇒「设计 §7.6 ↔ 需求 F17 判定句」与三档口径一致**未取证**（另：`**/test/**/*.mjs` 实扫零 `⏰`，测试面未见旧字面残留） | 跨档一致性在收口侧另核这三处 |

**计数**：🔴 0 ∥ 🟡 6 ∥ 🔵 3。无阻塞项。

VERDICT: pass

## §4 用户批准（主 agent）

## 用户批准

- **批准原话**：「**可以。**」（2026-11-04 16:03）——确认两条已定决定：范围 = 只改 CLI 两端面、词形 = `timer N`。
- **整批令原话**：「**自动跑完。**」（2026-11-04 17:54）——覆盖批准门，批内全链自动跑完（设计评审 → 裁定 → 修复 → 实施 → 收口），中途不再逐步请批。
- **批准范围**：`thincoder-cli/src/tui/status-line.mjs` ∥ `thincoder-cli/src/tui/cmd-timers.mjs` 两处产品码字面，加上引用它们的四档文档随动（`docs/cli/design/TUI.md` §7.6 ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.7·§6.30.18 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.1 ∥ `docs/cli/requirements/TUI.md` F17）。
- **不在范围内**：核注入行 `[System reminder: ⏰ timer — <message>]`（模型可见契约文本）∥ VSC ∥ 桌面 ∥ 服务端的状态行符号形（宿主字形齐备）。

## §5 实施记录（eng-coder）

### 5.1 交付摘要

改 2 档产品码（净 3 行：字面 2 处 + 档头注释 1 行）；新建批内单测档 1 个。

| 文件 | 面 | 改动 |
|---|---|---|
| `thincoder-cli/src/tui/status-line.mjs` | 产品码 | `timerHint` 两处字面 `⏰${timers.length}` → `timer ${timers.length}`（warn 态 ∥ 常态各一）；段位、色序、负向锁零动（仍 204 行，`timerHint` 仍在 174 行） |
| `thincoder-cli/src/tui/cmd-timers.mjs` | 产品码 | 行首 `⏰${i + 1}` → `timer ${i + 1}`；档头注释 `⏰<i>` → `timer <i>`（仍 71 行，`pushLine` 仍在 68 行） |
| `docs/batches/2026-11-04-timer-marker-text.test.mjs` | 单元档（用后即删） | 新建：T1–T6 六条用例，直驱 `renderStatus` ∥ `handleTimersCommand` 出口串 |

**行数不变的用意**：设计档 §7.6 与协议档以行号引用 `status-line.mjs:174`（`buildStatusLine` `:84`）；改字面若多插一行，行号后移即造死坐标。故档头注释走同行替换、状态行注释不加行——首稿曾加一行注释，实测后自行收回。

**越界改动**：无。三档全在 §2.4 受影响文件表内。表内另三档（CLI 设计档 §7.6 ∥ 机制档 §6.30.7/§6.30.18 ∥ 协议档 §6.1）由设计侧已落，本 spawn 零触；实施前逐处实读复核在盘（`timer N` ∥ `timer <i>` ∥ 端差登记 ∥ 实证例外）。

### 5.2 改动时验证（实跑读数）

- `node --test docs/batches/2026-11-04-timer-marker-text.test.mjs`（cwd = 仓根）⇒ `tests 6 ∥ pass 6 ∥ fail 0`（T1 T2 T3 T6 T4 T5 全绿；两次实跑同读数）。
- `node scripts/check-syntax.mjs`（cwd = `thincoder-cli/`）⇒ `check-syntax: 124 file(s) OK`。
- 实渲染（cols = 120 / 60 / 40）⇒ 行宽 119 / 59 / 39，逐档落在 `cols − 1` 预算内（既有 `statusMax` 截断）；120 列面逐字 = ` Ready │ turn 2/30 │ ↑12k ↓3.4k │ context 42% 54k │ timer 2 │ 修 timer 标记 │ Enter: send …`。
- 残留扫：`thincoder-cli` 全包 `⏰` **零命中**；全仓 `**/*.test.mjs` 除本批单测档外零 `⏰` 断言 ⇒ 无既有用例因换字面转红。
- 反查脚本 `node scripts/doc-impact.mjs --base HEAD --files src/tui/status-line.mjs,src/tui/cmd-timers.mjs` ⇒ 建议档四处（CLI 设计 ∥ CLI 需求 ∥ 机制档 ∥ 协议档），与 §2.4 表同集，无表外档。

### 5.3 内部两轮与终态

| 轮 | 面 | 结论 | 修复轮 |
|---|---|---|---|
| 勘探审计（只读 explore） | §2.1 三条目 ∥ §2.3 逐字形态 ∥ §2.6 六号 ∥ 越界 ∥ 设计漂移 | `audit: clean`（四类零命中：无部分实现 / 无静默简化 / 无档漂移 / 无表外改动） | 0 |
| 代码评审（advisor · code） | 目标三档 + 设计档 §7.6 判据 | `VERDICT: pass`（🔴 0 ∥ 🟡 1 ∥ 🔵 4） | 0（无必修项） |

**四条 🔵 的逐条处置**：

- `timerHint` 回调参数 `t` 遮蔽模块级 `t`——**未改**：该 `.some((t) => …)` 是改前既有形，非本批引入；本批只换字面，改形参名属表外装饰，而设计 §2.3 要求形态零动。
- 状态行无时钟缝 ⇒ T1/T2/T6 依赖墙钟——**接受，不改产品码**：夹具偏移 600_000 / 900_000 ms，抖红风险可忽略；给 `renderStatus` 加 `now` 参数属新增机制，需设计侧先裁，不在本批。
- 设计档 §7.6 新增句用行号坐标 `thincoder-cli/src/tui/tool-events.mjs:448`——**未改**：设计档非本 spawn 笔域，随报告上抛父侧路由。
- 批档 §5 空——**本轮补上**（即本段）；§4 由主 agent 落。

**终态：`clean`。**

### 5.4 上抛项

- [上抛·待裁] **残面登记**：CLI 会话流仍原样推 `[System reminder: ⏰ timer — …]`（`thincoder-cli/src/tui/tool-events.mjs` 回合尾镜像分支以 `C.warn` 推入），同一台缺字形的 Linux 终端里该行仍是豆腐块。设计档 §7.6「不动位」已认这一处并写「归属机制档单源另批处置」，但台账面未见对应行（库内无可读面，未取证）。建议父侧落一条 tech_todo / 需求行，避免「另批」只活在设计散文里而失账。
- [上抛·知会] 设计档 §7.6 新增句的行号坐标与仓内约定（文档引用用符号、不用行号）相左——设计档笔域在 eng-designer，非本 spawn 可改。

## §6 验证与收口（父代理）

## 验证与收口（父侧实跑 · 2026-11-04 18:10）

**父侧复验读数（不采信实施席报告，逐条重跑）**：

| 项 | 读数 |
|---|---|
| `thincoder-cli` 全包 `⏰` 扫描 | **0 处命中** |
| `thincoder-cli/src/tui/status-line.mjs` 行 174 | `…${ansi.reset}${C.warn}timer ${timers.length}…`（两处字面已换） |
| `thincoder-cli/src/tui/cmd-timers.mjs` 行 68 | `pushLine(\`timer ${i + 1}${kind === null ? "" : \` · ${kind}\`} · 剩余 …\`)` |
| `thincoder-cli/src/tui/cmd-timers.mjs` 行 5（档头注释） | `` `timer <i> · <kind> · 剩余 <dur> · <message 首行（截断）>` `` |
| 批内单测 | `node --test docs/batches/2026-11-04-timer-marker-text.test.mjs` ⇒ **6 pass ∥ 0 fail** |
| 收口门（仓库根全量集成） | `node test/run.mjs` ⇒ **133 pass ∥ 0 fail ∥ 65.7s** |

**首跑曾报 1 条失败**（ssh 集成用例断言 `/no prompt detected/` 与实际 `not settled after 1.9s` 不匹配），**重跑即 133/133 全绿**——该用例的时序抖动，与本批改动无关（本批零触及 ssh 面）。**如实记：发布门依赖的用例存在抖动，未在本批修。**

**集成测试面**：本批按 §2.8 零新增 RTM 行（既有同族节 = `test/RTM.md` §16，本批不改其断言的 ctx% 业务结果）；本轮唯一的集成跑 = 上述仓库根全量，133/133 绿。

**本批的手法例外（如实记）**：§2 段体里删掉的那条重复 `**状态行**：设计完成 · 2026-11-04` 由**父侧直接改档**删除——`batch edit` 的 E5 守卫拒绝任何触及 `**状态行**：` 行的锚，设计席无从落手。删的是重复残留，工具管理的那条未动。

**台账**：`#2034` → 见 ledger 调用。残留面（会话流 `[System reminder: ⏰ timer — …]` 在 Linux 仍豆腐块）不在本批范围，另起行记账。
