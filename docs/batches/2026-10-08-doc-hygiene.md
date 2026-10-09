# 2026-10-08 · 文档卫生（锚 · 行宽 · 坐标 · 余项）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = 父侧盘点：doc-check 现盘余量 + 各批归口文档项——用户 2026-10-08 10:51「还有那些能开的，都开吧」。
> 台账 = #1050 · #1043 · #1012 · #1013 · #1014 · #1015 · #1017（core · 归批）。前情 = 无（独立批——各条归口「下轮文档清账/卫生批」）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 点火与范围（2026-10-08 10:5x · 主 agent）

- 用户 2026-10-08 10:51「还有那些能开的，都开吧」= 点火；本批 = 各条归口「下轮文档清账/卫生批」的汇合轮。
- 条目：#1050（现盘余量）∥ #1043（`UI.md` §1 坐标七处）∥ #1012（`WEBVIEW.md` 未列坐标残量）∥ #1013（`WEBVIEW-PROTOCOL.md` §13 登记面复核）∥ #1014（漂移观察 3 族）∥ #1015（标记冗余 + 行数面报告）∥ #1017（doc-check-face 档面余项）。
- 边界：文档面只（坐标/计数/标记/报告面——零新语义）；产品码零触。
- 不同面不并：代理面 = #1042 批（在跑）∥ server public 结构面 = 同轮另批。
- 设计轮 = eng-designer 已派（#3）。

### 1.7 用户授权（自动跑 · 2026-10-08 11:38）

**用户原话**：「自动跑」⇒ 本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。

**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 11:38 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初版 2026-10-08 —— 基线复跑 39 ∥ 36（本批面 16 ∥ 30 ∥ 析出面 23 ∥ 6）；7 条目逐条修法/落点表 + 受影响档表 + 验收对照（预测读数）+ 上抛 7 项；fix 轮 = 设计评审轮 1 修正（6 条逐号落位 + sweep 随机检现盘收正——本批面 悬空 17 ∥ 行宽 35）；fix 轮 2 = 评审轮 2 三条收正（§E 三处引用按现读重锚 ∥ §D 归属列按文件拆写 ∥ 受影响档表列头随形——2026-10-08））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-08）**

**本批条目（覆盖 · 7 条——台账 #1050 ∥ #1043 ∥ #1012 ∥ #1013 ∥ #1014 ∥ #1015 ∥ #1017）**

文档卫生批：全部条目 = 文档面在册残项（坐标 / 计数 / 标记 / 报告面——零新语义）；产品码 ∥ `scripts/**` ∥ 提示词零触。设计承载 = 本 §2（清单与判据 = 一次性材料；长驻面 = 被收正的诸档本身）。

**基线读数（本设计轮复跑 ×2——本段以 11:0x 次为基线；仓根 `node scripts/doc-check.mjs`）**

- 全库：悬空 **39** ∥ 行宽 **36** ∥ 行数面差异 **23**（比对 159 · 跳过 188）∥ 行式异常 **1** ∥ 标记冗余 **6** ∥ 声明源缺位 0 ∥ exit 1。
- 面别拆分（读数两跑差 = 在飞批同窗落笔所致——02:54 首跑 17 ∥ 30；11:0x 复跑 39 ∥ 36）：
  - **本批面 = 悬空 16 ∥ 行宽 30**（含 #1050 现盘余量全量）。
  - **析出面 = 悬空 23 ∥ 行宽 6**：`PROXY.md` 12 ∥ 2（#1042 代理批——其设计轮今日已落笔该档，引用拆档后新家位 ⇒ 实现落件前恒红）∥ server 两档 11 ∥ 4（server public 结构批——§2 落点表已落、实现未落，同型）。
- 台账 #1050 记账（11 ∥ 28）与 #1014 例示（`config.mjs:121`）为时点值——本设计以现盘实读为准（`isBailianHost` 现读 = `thincoder-core/config.mjs:150`）。

**A. #1050a —— 悬空 17（本批面；修 17 ⇒ 0）**

| # | doc:line | token（现文） | 真身实核 | 修法（新形） |
|---|---|---|---|---|
| 1 | `docs/core/design/BROWSER-TOOL.md:193` | `browser/queue.mjs` | `thincoder-core/browser/queue.mjs` ✓ | 仓根全路径前缀补全 |
| 2 | 同上 `:214` | `browser/queue.mjs:157` | 同上；`:157` = `enqueue(…)` 实读对位 ✓ | 全路径（坐标保留） |
| 3 | 同上 `:214` | `browser/session.mjs:489` | `thincoder-core/browser/session.mjs`；`:489` = `runAction(…)` ✓ | 同 2 |
| 4 | 同上 `:250` | `agent/suspension.mjs:92` | `thincoder-core/agent/suspension.mjs`；`:92` = `backgroundCounts` ✓ | 同 2 |
| 5 | 同上 `:372` | `browser/queue.mjs` | 同 1 | 同 1 |
| 6 | 同上 `:377` | `browser/queue.mjs:11` | `:11` = wait 帽常量 import ✓ | 同 2 |
| 7 | 同上 `:439` | `browser/queue.mjs` | 同 1——`thincoder-core/browser/queue.mjs` ✓（F-BT16 验收回指行） | 仓根全路径前缀补全 |
| 8 | 同上 `:439 ∥ :500 ∥ :512 ∥ :549` | `T27b`（用例号 ×4 行） | 用例在（批件 `docs/batches/2026-10-07-browser-async-fix.test.mjs:168`）；四行独红因 = 引用位非定义位且批件住 batches 域（扫描排除 ∥ 非 `test` 树）——非改名面；`:439` 同行另含路径 token 一处（见行 7——注册不消该红） | **一处注册**（径①·决策 K2）：§8 尾（`:513` 后）新增列表项 `- T27b 开启段中止（U52 开启段一格）——批内件 \`docs/batches/2026-10-07-browser-async-fix.test.mjs:168\`。`——首 token = `T27b`，四行（用例号面）同时转绿；**红面全貌 = T27b 四行 + `:439` 路径 token 一处**（后者见行 7 修法） |
| 9 | `docs/desktop/design/PROJECT.md:1867` | `views/settings.mjs` | `thincoder-desktop/renderer/views/settings.mjs` ✓ | 仓根全路径 |
| 10 | `docs/desktop/design/SETTINGS.md:33` | `views/settings.mjs` | 同 8（`ADD_MODAL_GROUP` 源模块实核 ✓） | 同 8 |
| 11 | 同上 `:233` | `./views/settings.mjs` | 同 8（token = `composer-wire.mjs:36` 内 import 说明符逐字） | 全路径替换（决策 K3） |
| 12 | 同上 `:235` | `views/settings.mjs` | 同 8（`settingsModalTree` 宿主） | 同 8 |
| 13 | 同上 `:244` | `views/settings.mjs:378` | 同 8（`:378` = `settingsModalTree` 实读对位 ✓） | 同 8（全路径——坐标 `:378` 保留；fix 轮扫面增量） |
| 14 | `docs/desktop/design/UI.md:311` | `renderer/queue.mjs` | `thincoder-desktop/renderer/queue.mjs` ✓（同档 `:256` 已载全路径先例） | 同 8 |

行数核对：BROWSER-TOOL 11 行（7 路径 + 4 用例号行）∥ desktop 6 行（PROJECT 1 ∥ SETTINGS 4 ∥ UI 1）——合计 17（= 基线 16 + fix 轮扫面增量 `SETTINGS.md:244`）。
判据：复跑后本批面 ✗ 0（BROWSER-TOOL ∥ PROJECT ∥ SETTINGS ∥ UI 四档逐档 ✗ 0）。

**B. #1050b —— 行宽 35（本批面；修 35 ⇒ 0）**

修法 = **折行**（零语义：仅插换行 + 续行缩进；折点取既有 `∥` ∥ `；` ∥ `·` 分隔符处，逐字零改）。判据：折后逐行 ≤300 字符 ∧ 去换行后逐字全等 ∧ markdown 列表结构保持（列表项续行缩进随宿主形）。

| 面 | 落点（doc:line（现长）） |
|---|---|
| core（7） | `BROWSER-TOOL.md:214`（344）∥ `PROVIDER.md:291`（354）∥ `PROVIDER.md:337`（541——#1042 同域·避让注）∥ `PROVIDER.md:518`（430）∥ `PROVIDER.md:519`（392）∥ `TOOLS.md:238`（335）∥ `TOOLS.md:1031`（483） |
| desktop（14） | `PROJECT.md:384`（467）∥ `:400`（379）∥ `:401`（414）∥ `:424`（331）∥ `SETTINGS.md:108`（378）∥ `:195`（531）∥ `:197`（980）∥ `:199`（510）∥ `:201`（482）∥ `:202`（674）∥ `:203`（598）∥ `:205`（787）∥ `:213`（350）∥ `:244`（620） |
| vsc（14） | `SETTINGS.md:327`（337）∥ `:479`（473）∥ `:480`（315）∥ `:481`（302）∥ `:482`（614）∥ `:496`（314）∥ `:504`（582）∥ `:506`（414）∥ `:510`（593）∥ `:512`（453）∥ `:513`（422）∥ `:555`（367）∥ `:600`（495）∥ `:625`（519） |

**C. #1043 —— `docs/desktop/design/UI.md` §1 面线坐标七处重锚**

落点 = §1 项 5（`:213`–`:219`）；口径 = spans 取现行规则体（沿 `:43-57` 新口径——#1030 已落）。七处候选已逐条与现盘 `thincoder-desktop/renderer/settings.css` 对上（零再漂）：

| doc:line | 条目 | 现文 span ⇒ 新 span（settings.css 实读首行） |
|---|---|---|
| `UI.md:215` | `.settings-form` | `:173-180` ⇒ **`:201-209`**（`.settings-form {`） |
| `UI.md:215` | `.settings-notice` / `.wizard-notice` | `:105-117` ⇒ **`:116-124`**（`.settings-notice,`） |
| `UI.md:216` | `.settings-row` | `:141-157` ⇒ **`:152-160`**（`.settings-row {`） |
| `UI.md:218` | 控件族·次级 6 | `:60-81` ⇒ **`:72-86`**（`.settings-lang,` 八选择器共享形块） |
| `UI.md:218` | 强调 2 | `:82-86` ⇒ **`:93-97`**（`.wizard-next,`） |
| `UI.md:219` | `.settings-field` | `:191-206` ⇒ **`:220-227`**（`.settings-field {`） |
| `UI.md:219` | `.settings-mark` | `:159-165` ⇒ **`:187-193`**（`.settings-mark {`） |

判据：七处 span 与现盘逐条相等 ∧ 该档 ✗ 0。附注（观察·零改）：`settings.css:87-92` 另有四选择器色值块，不住任何条目射程。

**D. #1012 —— `docs/vsc/requirements/WEBVIEW.md` 未列坐标残量清账（需求档面·主 agent 笔；本设计出清单与判据）**

档位判定：样本 5/6 命中该档（`:29`/`:34`/`:38`/`:99`/`:127` 逐条对上）；台账行标题「design/」判为记录偏差 ⇒ 以上抛②待核。已确认漂移（本设计轮逐条实读）：

| doc:line | 引（现文） | 现状 | 建议（落笔形——实施前逐条复读） |
|---|---|---|---|
| `:21` F-W2 | `webview/ui.js:445-489` | 档现 250 行 ⇒ 超范围 | 重锚核：`thincoder-render-core/scroll.mjs:18` ∥ `:33-35` ∥ `:78` + 端 `ui.js:222-249` |
| `:99` N-W3 | `ui.js:449-450` | 超范围 | 核 `scroll.mjs:33-35` |
| `:21` F-W2 | `webview/activity.js:115-135` | 漂移 | 现位 `activity.js:66-68` + 核 `subblocks/block.mjs:91-103` |
| `:26` F-W7 | `webview/chat.js:351-405` | 超范围（档 143 行） | 实施轮逐行定位 |
| `:24` F-W5 | `webview/input.js:75-85` | 漂移 | 真身 = 核 `composer/panel.mjs`（实施轮定位） |
| `:29` F-W9 | `settings-env.js:66-69` | 漂移 | 候选 `:26` ∕ `:40`（shellCandidates 读）——实施轮认定 |
| `:29` F-W9 | `settings-env.js:71-73` | 漂移 | 候选 `:48` ∥ `:151`（proxySettings 读） |
| `:29` F-W9 | `settings-providers.js:261-269` | 超范围（档 176 行） | 现位 `:166-175`（`updateProviderStatus`） |
| `:31` F-W11 | `settings-env.js:27-31` | 漂移 | 渲染 `:60-63`；基线 `:76-77` |
| `:34` F-W17 | `settings-tools.js:270/273/283/286` + `settings-providers.js:185/229-246` + `:56-58`/`:67-69`/`:48-49` | 全超范围 | `_delKey:56-58` 已清（现位 `:50-52`）；`:67-69` ⇒ `:50-52`；`:48-49` ⇒ `:47-49`；余逐条 |
| `:84` P2-6 | `settings-providers.js:237-242` | 超范围 | 语义已处置注（`:157-158`）⇒ 或核销 |
| `:87` | `settings.js:43` | 漂移 | 现位 `:48-50` |
| `:115` TUI F1–F5 | `history.js:58-61` | 漂移 | 现位 `:73-77` |
| `:118` TUI F8 | `ui.js:38` | 漂移（语义不符） | 实施轮定位 |
| `:127` | `lib.js:30` | 真身 = 核件 | 改指 `thincoder-render-core/lib.mjs:30` |

未核余量（实施轮扫全——覆盖说明原缺面）：`settings-tools.js` 全组 ∥ F-W18/F-W19/F-W8 坐标 ∥ `composer/panel.mjs:185-245` ∥ `send.js` ∥ `panel-messages.mjs:460-463` ∥ `config-mcp.mjs` ∥ `model-menu.mjs`。
判据：该档未列 token 逐条终态（B 重锚 ∥ A 退场注 ∥ 假阳核销）∥ 复跑该档 ✗ 0 ∥ 「已列 token ∪ 未核余量」之外零动（未核余量组同须逐条终态）。内容态发现（**不修·上抛⑤**）：`:83` P2-5 ∥ `:84` P2-6 待办段与实现态不一致（保存面校验已落 `settings.mjs:241-247`；卡重建注已撤 `settings-providers.js:157-158`）。

**E. #1013 —— `WEBVIEW-PROTOCOL.md` §13 登记面复核（结论：零改）**

F-W12 五条处置齐：`settings` ∥ `saveCustomProvider` ∥ `saveEmbeddingConfig` 三删 ⇒ 行退场（§13 口径 `:540`「删除落地 ⇒ 源零位 ⇒ 表行同步退场」）；`saveShellSettings` 在表（`:522` 处置「活」）；`mcpReconnected` 退场注在 §12 尾（`:472-473`）⇒ **表与现盘一致，零改**。需求档行注收口（主 agent 笔）：`docs/vsc/requirements/WEBVIEW.md:32` 尾注「§13 表登记面未核——设计档面」⇒ 改「已核（2026-10-08 文档卫生批）：表齐」。

**F. #1014 —— 漂移三族重锚**

- ① `docs/desktop/design/WEB-QUICKCHECK.md:57`：宿主坐标 `index.html:54` ⇒ **`:55`**（实读 `:55` = 脚本行；`:54` = `<div data-slot="settings">`）。引文形（`src="app.mjs"`）沿 #958 偏离裁零改。
- ② `docs/core/design/PROVIDER.md:365` 四坐标活体重锚（端档已删——迁核现位逐条实读）：`specForModel` = `thincoder-core/model-specs.mjs:290` ∥ `providerSpec` = `:323` ∥ `resolveEnableThinking` = `thincoder-core/config.mjs:167` ∥ `isBailianHost` = `:150`；「（迁移期引文——档已删）」⇒「（W16 已迁核——原端档已删）」（决策 K4）。
- ③ `docs/cli/design/ACP-CLIENT.md:374`：presets 三坐标书写 `:30/:64/:94` ⇒ **`:31/:66/:96`**（`thincoder-vscode/src/extension/presets.mjs` 实读）；同句另两枚陈旧坐标同拍收正：`model-picker.mjs:37` ⇒ `thincoder-cli/src/tui/model-picker.mjs:43` ∥ `subagent-async.mjs:137` ⇒ `thincoder-core/agent-tools/subagent-async.mjs:143`（`embed-config.mjs:5` 在位核销）。`CONFIG.md:17/:19` 两行 = 仅路径无坐标（解析在位——零改）。

**G. #1015a —— 标记冗余 6（报告态 ⇒ 逐处定处）**

- `docs/vsc/design/VSC-DEBT.md:27`（设计档面·本批笔）：「（迁移期引文——v1 慢测层两线机制；v2 已收敛为单入口）」⇒ 删标记词头、保留说明（「（v1 慢测层两线机制；v2 已收敛为单入口）」）；判据 = 该行不再入「标记冗余」列报（锚 `thincoder-vscode/test/slow.mjs` 本可解析）。
- `docs/core/requirements/TURN-CAP-CONTINUE.md` `:20`/`:21`/`:23`/`:25`/`:36`（需求档面·主 agent 笔）：行尾裸「（迁移期引文）」⇒ 删（零内容损失）。

**H. #1015b —— 行数面差异 23 + 行式异常 1（报告态 ⇒ 实施轮回填）**

修法 = **实施轮实读回填**（口径 = 内容行数——沿 `PROJECT.md:221` 口径句）；范围 = 现报 23 差异行（desktop 九档：SHELL 2 ∥ IPC 1 ∥ SESSIONS 2 ∥ SETTINGS 9 ∥ CHAT 2 ∥ COMPOSER 1 ∥ ACTIVITY 1 ∥ RENDERER 4 ∥ PACKAGING 1——逐行 `<doc>:<line>` 见机检列表；as-of fix 轮复跑）。行式异常：`SETTINGS.md:260` 表值格首加粗段 `**398 ⇒ 419**`（双数 vs 单档）⇒ 收形单值（`**<现读>**`）、「398 ⇒ 419」迁入随行括注（沿 2026-09-30 先例）。判据：复跑「差异 0 条」∧ 异常 0。

**I. #1017 —— doc-check-face 档面余项（复核 + 收正）**

- ① `docs/core/design/DOC-DISCIPLINE.md` §7 收正（设计档面）：`:1411` 定位句 ∥ `:1417` F1 ⇒ 三面齐述（锚 + 行宽 + 行数面）；`:1432` 坐标 `scripts/doc-check.mjs:58` ⇒ **`:93`**（域基解析式；调用面 `:99-101`）；`:1444` 计数「4 档 ~900 行」⇒ 现盘 5 档（数值实施轮实读）；`:1454` AC-M8-5 补行数面（报告态）。同族顺收：`:999` 坐标 `doc-check.mjs:62` ⇒ `:99`（两态 gate 呼叫点）。
- ② `PROJECT.md` §4.1 口径句（复核）：**在位**（`:221`——「行数口径 = 内容行数（文末换行不计）」+ 机检半句）⇒ 子项核销零改；回填面归 H。**另报张力（上抛③·待裁）**：`:221`「本表 = …单源…新档在本表补行」↔ `UI.md:505`/`SHELL.md:196`「读取面 = `PROJECT.md` §4.1…本表行按同值同步；本域新档在本表补行」↔ `PROJECT-MANIFEST.json` 14 条目实况——三处对「单源 ∥ 读取面 ∥ 补行位」表述不一。
- ③ `MANIFEST.md` 漂移报告（复核）：该块**不存在**（全档 grep 零命中；「26 条」清单 = 2026-09-29 会话记录面，现行替代 = 机检「行数面」live 清单）；`MANIFEST.md` 的 #546 随动已落（checkConfig 六键行 + lineCounts 元素层）⇒ 子项核销零改。

**受影响档表（本批面——`.md` 行两列填 `—`、行保留，沿 `DOC-DISCIPLINE.md` §3.7）**

| 档 | 条目/落点 | 增量估 |
|---|---|---|
| `docs/core/design/BROWSER-TOOL.md`（—） | #1050（7 路径 ∥ T27b 注册行）∥ 行宽 `:214` | — |
| `docs/core/design/PROVIDER.md`（—） | #1050 行宽 `:291`/`:337`/`:518`/`:519` ∥ #1014② `:365` | — |
| `docs/core/design/TOOLS.md`（—） | #1050 行宽 `:238`/`:1031` | — |
| `docs/core/design/DOC-DISCIPLINE.md`（—） | #1017① 五处 + `:999`；`:1622` 记录面 residual（见下注） | — |
| `docs/desktop/design/PROJECT.md`（—） | #1050（悬空 `:1867` ∥ 行宽 ×4） | — |
| `docs/desktop/design/SETTINGS.md`（—） | #1050（悬空 ×4 ∥ 行宽 ×10）∥ #1015b（表行 9 + `:260` 收形） | — |
| `docs/desktop/design/UI.md`（—） | #1043 七 span ∥ #1050 悬空 `:311` | — |
| `docs/desktop/design/WEB-QUICKCHECK.md`（—） | #1014① | — |
| `docs/desktop/design/{SHELL,IPC,SESSIONS,CHAT,COMPOSER,ACTIVITY,RENDERER,PACKAGING}.md`（—） | #1015b 回填（2/1/2/2/1/1/4/1 行） | — |
| `docs/vsc/design/SETTINGS.md`（—） | #1050 行宽 ×14 | — |
| `docs/vsc/design/VSC-DEBT.md`（—） | #1015a `:27` | — |
| `docs/cli/design/ACP-CLIENT.md`（—） | #1014③ | — |
| `docs/core/requirements/TURN-CAP-CONTINUE.md`（—） | #1015a ×5（主 agent 笔） | — |
| `docs/vsc/requirements/WEBVIEW.md`（—） | #1012 ∥ #1013 行注（主 agent 笔） | — |

**注（fix 轮 · `:1622` 收口——记录面 residual）**：`docs/core/design/DOC-DISCIPLINE.md:1622`（变更记录行——「现行承接档 = `thincoder-cli/test/doc-check.test.mjs` 随 `npm test` 常驻」）：basename 全仓零命中（glob 实核）属实；**引擎实读（fix 轮复跑）= 不抽取该 token**（末段含 ≥2 扩展名段 ⇒ V5-A 排除式「组合简写」——规格 `DOC-DISCIPLINE.md:927` ③ ∥ 实装 `scripts/doc-check-anchors.mjs:149`）⇒ 不入红单、逐行检索零命中、亦不在本批面 ∥ 析出面拆分内（非漏计）。**登记 = 记录面 residual：本批零改、不复跑归零**（该行维持原样）。

**实施面路由 + 避让**：设计档面（`docs/**/design/**`）= **eng-designer 实施轮**（笔）；需求档面（`TURN-CAP-CONTINUE.md` ∥ `vsc/requirements/WEBVIEW.md`）= **主 agent 笔**；`scripts/**` ∥ `PROJECT-MANIFEST.json` ∥ 产品码 = 零触。避让（在飞批同窗——fix 轮复核）：`PROXY.md` = 全析出（#1042）；`PROVIDER.md` ∥ vsc/desktop `SETTINGS.md` = 在写（#1042 设计轮已触 `PROVIDER.md:337`；fix 轮窗内残项续投批续写两 `SETTINGS.md`——新红已随现盘并入 §A/§B）——实施轮开工先复核在飞批写域，相撞 ⇒ 该档避让重排并披露；server 两档 = 析出。

**关键决策（含否决）**

1. **K1 `PROXY.md` 全组（悬空 12 ∥ 行宽 2）= 析出**（#1042 同档面在飞——其设计轮今日已落笔；本批零触）——否决「本批顺手修」（同档双写相撞 ∥ 其新红系其设计落笔所致，随其实施自消解）。
2. **K2 `T27b` = 径①一处注册**（§8 尾列表项）——否决径②行内注记（同行其余锚随行豁免 ∥ 豁免膨胀）∥ 径③改述去号（丢号可追溯性）。**谓词实装已核（fix 轮）**：`scripts/doc-check-anchors.mjs:222-226`（列表项分支取首 token——`- T27b …` 非粗体形有效；粗体行首 = 另一分支 `:228-229`）；现盘实证 = `LEDGER.md:437-439` 非粗体项在册不红 ⇒ 注册形零改。
3. **K3 `SETTINGS.md:233` 说明符逐字形** = 全路径替换——否决「保逐字形加注」（保原形则解析面恒红）；语义零改（句主张 = 「自该模块引——单源」）。
4. **K4 `PROVIDER.md:365`** = 活体重锚至定义位 + 引文标改述「（W16 已迁核——原端档已删）」（沿该档 `:358` 体例）——否决「保留引文标不重锚」（#1014 明令迁核）。
5. **K5 行数面回填 = 实施轮实读落笔**（非本设计轮快照——在飞批持续改码，读数每跑皆动）。
6. **K6 #1012 档位** = `docs/vsc/requirements/WEBVIEW.md`（样本 5/6 命中）——台账标题「design/」判为记录偏差（上抛②待核）。

**边界（本批不做）**：产品码 ∥ `scripts/**` ∥ `PROJECT-MANIFEST.json` ∥ 提示词零触；需求档零笔（笔 = 主 agent）；析出面（`PROXY.md` ∥ server 两档）零触；行宽豁免区（变更记录 / 历史沿革）与表格行零动；宽符号报告面（925 行）零动；禁脚本批量改文（逐处经手）。

**验收对照（回指条目——机检形 + 预测读数）**

| # | 验收 | 载体/判据 |
|---|---|---|
| #1050 | 本批面悬空 17 ⇒ 0 ∥ 行宽 35 ⇒ 0（sweep = fix 轮现盘；终判 = 逐档 ✗ 0）；全库复跑 = 析出面余量 | 复跑 `node scripts/doc-check.mjs` |
| #1043 | 七 span 与现盘逐条相等 ∥ 该档 ✗ 0 | 逐条实读 + 机检 |
| #1012 | 未列 token 逐条终态 ∥ 该档 ✗ 0 ∥ 「已列 token ∪ 未核余量」之外零动 | 主 agent 落笔 + 复跑 |
| #1013 | §13 表 ∥ F-W12 五条齐（复核结论在案）∥ 需求行注收口 | 实读 + 主 agent 笔 |
| #1014 | 三族新坐标逐处实读相等（`:55` ∥ 四坐标 ∥ `:31/:66/:96` + 同句两枚） | 逐条实读 |
| #1015 | 标记冗余：VSC-DEBT ⇒ 0（本批）+ TURN-CAP 5（主 agent）；行数面差异 23 ⇒ 0 ∥ 异常 1 ⇒ 0 | 复跑 |
| #1017 | §7 五处收正 ∥ §4.1 口径句核销 ∥ MANIFEST 面核销；张力上抛在案 | 逐处实读 + 复跑 |

**预测复跑读数（本批面全落——as-of fix 轮现盘）**：悬空 **25**（析出：PROXY **14** ∥ server 11）∥ 行宽 **6**（PROXY 2 ∥ server 4）∥ 行数面差异 **0** ∥ 行式异常 **0** ∥ 标记冗余 **5**（需求档面待主 agent；落则 0）∥ exit 1（余量全在析出面——随 #1042 ∥ server 批实现落定归零）。

**上抛项（父侧 ∥ 主 agent 面）**

1. **需求档面笔**（主 agent）：#1012 全族落笔（清单 = D 段）∥ TURN-CAP-CONTINUE 五处标记删 ∥ `vsc/requirements/WEBVIEW.md:32` 行注收口（§13 已核）。
2. **档位待核**：#1012 立清单于 `docs/vsc/requirements/WEBVIEW.md`（样本 5/6 命中）；台账行标题「design/WEBVIEW.md」= 记录偏差判定待父侧确认。
3. **口径待裁**：`PROJECT.md:221` ↔ `UI.md:505`/`SHELL.md:196` ↔ manifest 14 条目 的「单源 ∥ 读取面 ∥ 补行位」表述张力（本批零改）。
4. **域外发现·只报**：`docs/vsc/design/WEBVIEW.md` 同类坐标漂移 ≈60 处（未列账——建议另立行）∥ `DOC-DISCIPLINE.md:1622`（变更记录行）「现行承接档 = `thincoder-cli/test/doc-check.test.mjs` 随 `npm test` 常驻」与现盘不符——**fix 轮实核：引擎不抽取该 token（V5-A 排除式③）⇒ 记录面 residual：本批零改、不复跑归零（见受影响档表注）** ∥ vsc `SETTINGS.md:327` 本轮起入列报（337 字符）。
5. **内容态复核**（#1012 同档）：`:83` P2-5 ∥ `:84` P2-6 待办段与实现态不一致（见 D 段末）。
6. **机制观察**：批内件（`docs/batches/*.test.mjs`）用例号在册三源不可达（batches 域被排除 ∥ 非 `test` 树）——本批以注册行消解 `T27b` ×4；机制面如需另裁。
7. **台账 evidence 修正**：#1014 例示 `isBailianHost` = `thincoder-core/config.mjs:121` → 现盘 = `:150`（本设计按 `:150` 落）。

**变更记录**：2026-10-08 — §2 初版（基线 = 本设计轮复跑 39 ∥ 36；本批面 16 ∥ 30；析出面 23 ∥ 6 明列）。
2026-10-08 — 设计评审轮 1 修正（fix 轮）：6 条逐号落位（§A 补 `:439` 行 ∥ §H 分解随机检〔SETTINGS 差异 9 ∥ 异常 `:260`〕∥ 受影响档表两列 `—`〔§3.7〕∥ K2 谓词实装坐标 ∥ §D 判据射程句 ∥ `:1622` 记录面 residual）+ sweep 随机检现盘收正（父侧扫面 `:244`/`:108` + 同窗连带——本批面 悬空 16 ⇒ 17 ∥ 行宽 30 ⇒ 35）；详见 §2 尾追加块。

**§2 追加 · 设计评审轮 1 修正（fix 轮）——6 条逐号落位 + sweep 随现盘收正（2026-10-08 · eng-designer）**

**背景**：设计评审轮 1 = **changes-required**（🔴1 · 🟡2 · 🔵3——§3 轮次 1；父侧派单受理）+ 父侧两条机检扫面补报（desktop `SETTINGS.md:244` 悬空 ∥ `:108`/`:244` 行宽——残项续投批当窗投落）。本轮 = fix：改面 = 本 §2（设计承载）；零新语义。**sweep 口径 = 机检现盘（终判 = 逐档 ✗ 0）**；基线段（11:0x）保留 as-of 记录。

**逐号落位**：

| 号 | 处置（本 §2 落点） | 回读核 |
|---|---|---|
| 1 🔴 | §A 补行 7（`:439` 路径 token——修法同 1）+ 原行 7（现行 8）判词明「红面全貌 = T27b 四行 + `:439` 路径 token 一处」；§A 头句/行数核对随正 | §A 表 14 行；`:439` 两红各得其位（机检现盘实证） |
| 2 🟡 | 引擎实读收口（见下「引擎实读」）+ 受影响档表注（记录面 residual） | 复跑逐行检索零命中；实装坐标在档 |
| 3 🟡 | 受影响档表：`.md` 行两列填 `—`（行保留；沿 `DOC-DISCIPLINE.md` §3.7）；表题随正 | 表 14 行全 `（—）`/`—`；档名行保留 |
| 4 🔵 | §H 分解随机检（SETTINGS 差异 9 ∥ 行式异常 `:260`）；受影响档表同值 | 和 = 23 ✓；异常坐标 = 现盘 ✓ |
| 5 🔵 | K2 补谓词实装坐标与实证（非粗体列表项有效） | 注册形零改；`LEDGER.md:437-439` 在册不红 |
| 6 🔵 | §D 判据射程句 =「已列 token ∪ 未核余量」之外零动（#1012 验收行同收） | 句在档 |

**引擎实读（#2 收口）**：fix 轮复跑（仓根 `node scripts/doc-check.mjs`）逐行实读——`docs/core/design/DOC-DISCIPLINE.md:1622` **零命中**（不入红单、不入任何列报行；全库现盘读数：悬空 **42** ∥ 行宽 **41** ∥ 行数面差异 **23**）。因由 = token `thincoder-cli/test/doc-check.test.mjs` 末段含 ≥2 扩展名段（`doc-check.` ∥ `test.`）⇒ 命中 V5-A 排除式「组合简写」（规格 `DOC-DISCIPLINE.md:927` ③；实装 `scripts/doc-check-anchors.mjs:149`·`EXT_SEG_RE` `:58`）⇒ 不入锚候选；basename 全仓零命中（glob 实核）⇒ 该行 = **记录面 residual**（本批零改、不复跑归零——登记见受影响档表注；该锚不在本批面 ∥ 析出面拆分内，非漏计）。

**sweep 随现盘收正**：§A 本批面悬空 16 ⇒ **17**（desktop `SETTINGS.md` 3 ⇒ 4 行：`:232`/`:234` ⇒ `:233`/`:235` 坐标随动 + `:244` 增量）；§B 本批面行宽 30 ⇒ **35**（core 5 ⇒ 7〔PROVIDER `:518`/`:519` 增量〕∥ desktop 12 ⇒ 14〔SETTINGS 八行坐标 +1 至 `:195`–`:213` + `:108`/`:244` 增量〕∥ vsc 13 ⇒ 14〔`:482` 长度重读 ∥ `:599` ⇒ `:600` + `:625` 增量〕）。析出面现盘 = 悬空 **25**（PROXY 14 ∥ server 11）∥ 行宽 6；在写档（PROVIDER ∥ 两 `SETTINGS.md`）坐标随动——**实施轮以复跑清单为准**（避让复核 = 「实施面路由 + 避让」段）。

**零触面**：产品码 ∥ `scripts/**` ∥ 需求档 ∥ 析出面（`PROXY.md` ∥ server 两档）∥ 两 `SETTINGS.md` 档体 ∥ §3（评审段只读）。

**§2 追加 · desktop 脸笔（设计档面 · 实施轮）——逐条落笔 + 回读 + 复跑读数（2026-10-08 · eng-designer）**

**射程（10 档）**：`docs/desktop/design/`：`PROJECT.md` ∥ `UI.md` ∥ `WEB-QUICKCHECK.md` + #1015b 回填七档（SHELL ∥ SESSIONS ∥ CHAT ∥ COMPOSER ∥ ACTIVITY ∥ RENDERER ∥ PACKAGING）。避让复核（开工先核在飞写域）：desktop `SETTINGS.md` ∥ `IPC.md` = 续投笔 ⇒ 本笔零触。

**逐条落位（清单 → 改动 file:line（落笔后现址））**：
- §A 悬空：`PROJECT.md` 原 `:1867` ⇒ 现 `:1875`——`views/settings.mjs` ⇒ `thincoder-desktop/renderer/views/settings.mjs`（仓根全路径；行号随折行 +8 行）；`UI.md:311`——`renderer/queue.mjs` ⇒ `thincoder-desktop/renderer/queue.mjs`。
- §C #1043：`UI.md:215`（`.settings-form` ⇒ `:201-209` ∥ `.settings-notice` / `.wizard-notice` ⇒ `:116-124`）∥ `:216`（`.settings-row` ⇒ `:152-160`）∥ `:218`（次级 6 ⇒ `:72-86` ∥ 强调 2 ⇒ `:93-97`）∥ `:219`（`.settings-field` ⇒ `:220-227` ∥ `.settings-mark` ⇒ `:187-193`）——落笔前逐条复读 `thincoder-desktop/renderer/settings.css` 实读对上（零再漂）。
- §F① #1014：`WEB-QUICKCHECK.md:57`——宿主坐标 `index.html:54 ⇒ :55`（实读 `:55` = 脚本行；引文形沿 #958 裁零改）。
- §B 行宽：`PROJECT.md` `:384-387` ∥ `:403-405` ∥ `:406-408` ∥ `:431-432`——四处原长行折行（折点全取既有 `；` 分隔符；逐字零改；折后逐段 ≤300）。
- §H #1015b 回填 13 行（口径 = 内容行数——文末换行不计；逐行当刻实读）：SHELL `:183`（327 ⇒ 333）∥ `:186`（196 ⇒ 206）· SESSIONS `:121`（65 ⇒ 77）∥ `:122`（259 ⇒ 270）· CHAT `:145`（72 ⇒ 67）∥ `:159`（124 ⇒ 120）· COMPOSER `:158`（276 ⇒ 286）· ACTIVITY `:142`（292 ⇒ 288）· RENDERER `:326`（328 ⇒ 336）∥ `:327`（271 ⇒ 279）∥ `:336`（368 ⇒ 370）∥ `:339`（153 ⇒ 154）· PACKAGING `:345`（33 ⇒ 73）——行式沿本档惯例（新值 + 「届盘实读收正（表载 X ⇒ Y）；文档卫生批行数面回填」 + 前读链保留）。

**回读核 + 复跑读数**：逐处回读（写入回显 + 定点重读）+ 落笔后仓根 `node scripts/doc-check.mjs` 复跑：本笔诸档 悬空闸红 **0** ∥ 行宽 **0** ∥ 行数面差异 **0**（13 行全清）∥ 行式异常 **0**。全库相位：悬空 **30**（余量 = BROWSER-TOOL 11 ∥ PROXY 14 ∥ desktop SETTINGS 5）∥ 行宽 **30**（余量 = desktop SETTINGS 10 ∥ core/vsc 脸余量 20）∥ 行数面差异 **10**（余量 = SETTINGS 9 ∥ IPC 1）。

**披露（只报）**：① desktop `SETTINGS.md` 悬空现读 **5** 行（派单记 ×4；增量 = `:516`（`PROVIDER.md:341`）——归续投笔）；② `UI.md:311` 同联 `renderer/page-read.mjs` 现读不红、清单未列 ⇒ 零动；③ 改动面实核（git numstat）：本 10 档逐档增删行数恰合落笔面（PROJECT 13/5 ∥ UI 5/5 ∥ RENDERER 4/4 ∥ SHELL 2/2 ∥ SESSIONS 2/2 ∥ CHAT 2/2 ∥ ACTIVITY 1/1 ∥ COMPOSER 1/1 ∥ PACKAGING 1/1 ∥ WEB-QUICKCHECK 1/1）——清单外零动；④ 零脚本批量改文（逐处经手；逐条单次命中）。

**§2 追加 · core 脸笔实施落盘（设计档面 · 2026-10-08 · eng-designer）**

**背景**：批内实施轮——core 脸一笔（射程 3 档 = `BROWSER-TOOL.md` ∥ `TOOLS.md` ∥ `DOC-DISCIPLINE.md`）；清单源 = 本 §2（§A 行 1–8 ∥ §B core 面 ∥ #1017① 五处 + 同族 `:999`）。零新语义（坐标 / 计数 / 标记 / 报告面）；禁脚本批量改文——逐处经手；D6 逐处回读。

**逐条落位（清单条目 → 落盘后 file:line）**

| # | 清单条目 | 落盘后 file:line | 形 |
|---|---|---|---|
| 1 | §A 行 1–7（7 路径 token） | `BROWSER-TOOL.md:193` ∥ `:214` ∥ `:215` ∥ `:251` ∥ `:373` ∥ `:378` ∥ `:440` | `browser/…` ⇒ `thincoder-core/browser/…`（坐标保留；同档 `:32`/`:348` 本已是全路径先例） |
| 2 | §A 行 8（T27b ×4 注册） | `BROWSER-TOOL.md:515`（§8 尾新增列表项——首 token = `T27b`）；原四行 `:440` ∥ `:501` ∥ `:513` ∥ `:551` | 注册落笔 ⇒ 四行转绿（复跑实证） |
| 3 | §B core 面（行宽 3 行） | `BROWSER-TOOL.md:214`（344 ⇒ 165+209）∥ `TOOLS.md:238`（335 ⇒ 201+134）∥ `TOOLS.md:1032`（483 ⇒ 241+242） | 折行（仅插换行；去换行后逐字全等已核；续行 col 0 沿宿主形） |
| 4 | #1017①（5 处）+ 同族 `:999` | `DOC-DISCIPLINE.md:999` ∥ `:1411` ∥ `:1417` ∥ `:1432` ∥ `:1444` ∥ `:1454`（行号无位移） | `:62` ⇒ `:99` ∥ 定位句 + F1 三面齐述（锚 + 行宽 + 行数面）∥ `:58` ⇒ `:93` ∥ 「4 档 ~900 行」⇒「5 档 ~830 行」（现盘实读 833 = 124+355+86+128+140）∥ AC-M8-5 补行数面（报告态） |

**复跑读数（落盘后 · 仓根 `node scripts/doc-check.mjs`）**：三档逐档——`BROWSER-TOOL.md` 悬空 **11 ⇒ 0** ∥ 行宽 **1 ⇒ 0**；`TOOLS.md` 悬空 0 ∥ 行宽 **2 ⇒ 0**；`DOC-DISCIPLINE.md` 悬空 0 ∥ 行宽 0。本笔净效应 = 悬空 **−11** ∥ 行宽 **−3**；全库现盘 = 悬空 **19** ∥ 行宽 **27** ∥ 行数面差异 **10** ∥ exit 1（余量 = 他脸 ∥ 析出面 + 在飞批同窗，非本笔面）。

**避让披露（零触核实）**：`PROVIDER.md` ∥ `PROXY.md` ∥ server 两档 ∥ 两 `SETTINGS.md` ∥ `DOC-DISCIPLINE.md:1622`（记录面 residual）——零触；本笔 diff 净变 = 8/6 ∥ 4/2 ∥ 6/6（`git diff --numstat`），逐行 = 上表 15 处，清单外零动。

**披露（形）**：折行逐字零改含空格保真——`BROWSER-TOOL.md:215` 行首一空格 = 折点原位空格保留（去换行后逐字全等判据所需；与该档既有折行处「∥ 处空格省略」形略异，如实登记）。

**清单外观察（只报 · 零改）**：`DOC-DISCIPLINE.md:1009` 句「`scripts/` 现存四档 = 锚 + 行宽，无一致性族」与现盘五档（含行数面）形不一致——同族残项候选（非 #1017① 射程，本笔零改）。

**§2 追加 · 续投笔（五档）实施落盘（设计档面 · 2026-10-08 · eng-designer）**

**射程（5 档）**：`docs/core/design/PROVIDER.md` ∥ `docs/vsc/design/SETTINGS.md` ∥ `docs/vsc/design/VSC-DEBT.md` ∥ `docs/desktop/design/SETTINGS.md` ∥ `docs/desktop/design/IPC.md`。清单源 = 本 §2（§A desktop 五悬空 ∥ §B core/vsc 行宽余面 ∥ §H 回填 10 行 ∥ #1014②）；零新语义（坐标 / 计数 / 标记 / 回填）；逐处经手（零脚本批量改文）；D6 逐处回读。开工避让：desktop `SETTINGS.md` ∥ `IPC.md` = 续投笔归属（desktop 脸笔留注「本笔零触」）——本笔即其落；core ∥ vsc 两脸笔先落（本 §2 两前块），五档无他笔在飞。

**逐条落位（清单条目 → 落盘后 file:line／值）**

| # | 清单条目 | 落盘后 file:line | 形 |
|---|---|---|---|
| 1 | §A desktop 悬空 5 处 | `SETTINGS.md:33` ∥ `:233` ∥ `:235` ∥ `:244`（⇒ `:244`–`:247`）∥ `:516` | `views/settings.mjs` 族 ⇒ `thincoder-desktop/renderer/views/settings.mjs`（仓根全路径）；`:244` 含 `:378` 坐标；`:516` = `PROVIDER.md:341` ⇒ `docs/core/design/PROVIDER.md:342`（行号随折行 +1 随动——沿「原 :1867 ⇒ 现 :1875」先例） |
| 2 | §B 行宽 core 2 行 | `PROVIDER.md:295`（354 ⇒ 155+199）∥ `:342`–`:345`（552 ⇒ 175+108+141+128） | 折行（仅插换行；去换行后逐字全等；续行 col 0） |
| 3 | §B 行宽 vsc 14 行 | `SETTINGS.md:327` ⇒ `:327` ∥ `:480`–`:489` ∥ `:496`–`:497` ∥ `:512`–`:517` ∥ `:521`–`:530` ∥ `:572`–`:573` ∥ `:618`–`:620` ∥ `:645`–`:648`（落盘后现址；共 24 折） | 折行（同上；折点取既有 `；` ∥ `∥` 优先） |
| 4 | §B 行宽 desktop 10 行 | `SETTINGS.md:108`–`:109` ∥ `:196`–`:199` ∥ `:201`–`:205` ∥ `:207`–`:209` ∥ `:211`–`:213` ∥ `:214`–`:218` ∥ `:219`–`:222` ∥ `:224`–`:230` ∥ `:238`–`:239` ∥ `:244`–`:247` | 折行（同上；折点取 `；` ∥ 结构界） |
| 5 | 标记冗余（≤ 五之一） | `VSC-DEBT.md:27` | 删「迁移期引文——」词头（说明句留）⇒ 锚 `thincoder-vscode/test/slow.mjs:4,16` 转绿（复跑实证） |
| 6 | §H 回填 10 行 | `SETTINGS.md:282` / `:289` / `:290` / `:294` / `:295` / `:299` / `:300` / `:301` / `:302` / `:304` ∥ `IPC.md:353` | 届盘实读收正（表载 X ⇒ Y；文档卫生批行数面回填）；前读链保留（收正值：providers **324** ∥ views/settings **439** ∥ sections **96** ∥ sections-mcp **261** ∥ sections-models **186** ∥ mount-settings **264** ∥ reads **206** ∥ exits **307** ∥ segments-mcp **327** ∥ segments-models **192** ∥ preload **85**） |
| 7 | §H 行式异常 | `SETTINGS.md:289`（views/settings.mjs 行） | `**398 ⇒ 419**`（双数）⇒ 收形单值 `**439**`；「398 ⇒ 419」迁入 10-07 事件括注 |
| 8 | #1015b 口径·同笔 | `SETTINGS.md:215`（判据行） | desktop 测试件数 **376 ⇒ 377**（届盘实读 = read 378 − 1；口径同 #1015b） |
| 9 | #1014② 重锚 | `PROVIDER.md:373`（原 :369） | 端档四坐标（宿主档已删）⇒ `thincoder-core/model-specs.mjs:290` / `:323` ∥ `thincoder-core/config.mjs:167` / `:150`；标记「（迁移期引文——档已删）」⇒「（W16 已迁核——原端档已删）」 |

**复跑读数（落盘后 · 仓根 `node scripts/doc-check.mjs`）**：五档逐档 —— 悬空闸红 **0** ∥ 行宽 **0** ∥ 行数面差异 **0** ∥ 行式异常 **0**（余 = 迁移期引文 ∥ 拟新增列报项——报告面、不入闸）。全库相位：悬空 **14**（全 = 析出面 `PROXY.md`）∥ 行宽 **1**（`PROXY.md:81`——析出面）∥ **行数面差异 0**（原 10 = desktop SETTINGS 9 ∥ IPC 1 ⇒ 全清）∥ 行式异常 **0** ∥ 标记冗余报告面余 **1**（需求档 `docs/core/requirements/TURN-CAP-CONTINUE.md:85`——主 agent 面）；exit 1（余量全在析出面）。

**披露（只报 · 逐项）**：① `SETTINGS.md:516` 指针随动（341 ⇒ 342 + 全路径）——折行使坐标位移，随动即写现址（先例 = desktop 脸笔「原 :1867 ⇒ 现 :1875」）；② `SETTINGS.md:215` 件数 376 ⇒ 377（届盘实读认定；归 #1015b 口径）；③ 折行形 = 逐字零改（仅插换行；去换行后逐字全等）；表格行 ∥ 变更记录区零动；PAREN 形与档内既有多档（bal 0–3）同域，未强收；④ 派单附言一组坐标（`dispatchPATCH` ∥ `streamResponses` ∥ `normalizeProxy` ⇒ `payload.mjs:11` ∥ `stream-stt.mjs:11` ∥ `provider-flows.mjs:15-30`）实核：`dispatchPATCH` / `streamResponses` / `payload.mjs` / `stream-stt.mjs` 全仓零命中（`normalizeProxy` 在 `thincoder-core/config.mjs:259`）——非本 §2 条目，本笔零动、只报。

**零触面**：产品码 ∥ `scripts/**` ∥ 需求档 ∥ 析出面（`PROXY.md` ∥ server 两档）∥ `PROJECT.md` ∥ `UI.md` ∥ `ACP-CLIENT.md` ∥ 他批在飞档——零触；§3 评审段只读。改动面 = 本五档（逐处经手，无他档净动）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（1 轮）· 发现表（对象 = 批档 §2 设计 · 2026-10-08-doc-hygiene）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage / 验收可达成性 | 🔴 | §A 修法表短一行：同节自述「BROWSER-TOOL 11 行（7 路径 + 4 用例号行）」（批档 `2026-10-08-doc-hygiene.md:52`），但表内路径 token 仅 6 处（`:193` ∥ `:214`×2 ∥ `:250` ∥ `:372` ∥ `:377`）；第 7 处 = `docs/core/design/BROWSER-TOOL.md:439` 的 `browser/queue.mjs`（"§2.9 ∥ §5 `browser/queue.mjs`"）——同档同形 token 在 `:193`/`:372`/`:377` 被判红，`:439` 必同判；而该行在表内只以 row 7 的 `T27b`（批档 `:45`）出现，其判词「四行独红因 = 引用位非定义位且批件住 batches 域」「首 token = `T27b`，四行同时转绿」对 `:439` 不成立（注册 T27b 不能消其路径红灯）⇒ 验收「复跑后本批面 ✗ 0（BROWSER-TOOL ∥ PROJECT ∥ SETTINGS ∥ UI 四档逐档 ✗ 0）」（批档 `:53`）按现表落不到 0。 | 在 §A 补 `:439` 路径 token 一行（修法同 1：「仓根全路径前缀补全」），row 7 判词按「T27b 四行 + `:439` 路径 token 一处」改写；实施轮以该档 ✗ 0 复跑为终判。 |
| 2 | Document ownership / Doc-state | 🟡 | 上抛④ 把 `DOC-DISCIPLINE.md:1622`（行内 token `thincoder-cli/test/doc-check.test.mjs`，见 `DOC-DISCIPLINE.md:1622`）判为「域外发现·只报」（批档 `:182`「与现盘不符（记录面冻结行）」）——但该 basename 全仓不存在（本轮 glob 实核 `**/doc-check.test.mjs` 零命中；`**/doc-check*.mjs` 仅 `scripts/doc-check*.mjs` 五档）；按 `DOC-DISCIPLINE.md:917` V5-A 射程「含 `/` 的路径形态」入判，该锚应红。而同一验收句（批档 `:53`）把本批面写成四档逐档 ✗ 0。两说不能同真。 | 二选一收口：① 给 `:1622` 落处置并入清单（同档 `:533`/`:534` 型 A 类改述——须先核引擎判法）；或 ② 在受影响档表 / 验收句显式登记该行为记录面冻结 residual（写明不复跑归零）。并复核 16 ∥ 23 两面拆分是否已含该锚。 |
| 3 | Methodology（§3.7 文档档零标注口径） | 🟡 | 受影响档表（批档 `:131`「**受影响档表（本批面；行数 = 本设计轮实读）**」）对本批全部 `.md` 档列了「现读行数」+「增量估」两列（如 `docs/core/design/BROWSER-TOOL.md`（549）… `+2（注册 +1 ∥ 折 +1）`），与 `DOC-DISCIPLINE.md:249`「**新落笔**的批次档受影响文件表同此口径——**源 / 测试档**保留「当前行数 + 预计增量」两列，**文档档（`.md`）不列该两列**」相抵（同旨句 `:245`）。 | 按 §3.7 口径收正：`.md` 行该两列填 `—`（行保留）——本批即文档卫生批，宜自家先合规。 |
| 4 | Methodology（D3 计数·枚举）/ Clarity | 🔵 | §H 头句「范围 = 现报 23 差异行」（批档 `:123`）与同句分解（SHELL 2 ∥ IPC 1 ∥ SESSIONS 2 ∥ SETTINGS 10 ∥ CHAT 2 ∥ COMPOSER 1 ∥ ACTIVITY 1 ∥ RENDERER 4 ∥ PACKAGING 1）之和 = 24；批档 `:143` 另一处分解（2/1/2/2/1/1/4/1 = 14 + SETTINGS 10）亦 = 24。 | 两处分解与总计数对齐（以机检清单为准收一）——实施轮本要逐行实读回填，收正成本为零。 |
| 5 | Feasibility（机检机制） | 🔵 | K2 生效前提 = 引擎「定义位」谓词接受 `- T27b …`（非粗体列表项首）；设计只给结论（批档 `:45`「首 token = `T27b`，四行同时转绿」），未给该谓词实装坐标。本轮只据 `DOC-DISCIPLINE.md:957`（用例号定义面「② **定义位**（表格首格 / 列表项首 / 粗体行首——全档全域）」）判其合规，引擎实装未核（`scripts/**` 不在本评审 scope）。 | 实施轮首步落注册行后即复跑一次以机器判据为准；若谓词不认非粗体列表项，注册行改粗体首 token 形（沿同档 `- **Fm` 先例）即可，语义零改。 |
| 6 | Clarity（#1012 验收口径） | 🔵 | D 段判据「清单外零动」（批档 `:104`）与同段「未核余量（实施轮扫全——覆盖说明原缺面）」（批档 `:103`）并置时易被读成「清单 = 只含已列 token」而把未核余量组读作域外。 | 判据句写明射程 = 「已列 token ∪ 未核余量」之外零动（未核余量组同须逐条终态）。 |

**已实核（未构成发现的正证据）**：① 悬空 16 的构成闭合——BROWSER-TOOL 7 路径 + 4 用例号行 ∥ desktop 5（PROJECT 1 ∥ SETTINGS 3 ∥ UI 1），其中 7 路径 = `:193` ∥ `:214`×2 ∥ `:250` ∥ `:372` ∥ `:377` ∥ **`:439`**（第 7 处未入表——见发现 1）逐条实读成立；② `T27b` 独红机制成立——`docs/batches/2026-10-07-browser-async-fix.test.mjs:168` 确在（用例定义），`T42`/`T43`/`T44` 因他档定义位在场（`LEDGER.md:437-439` ∥ `MANIFEST.md:681-683`）不红，与设计判法自洽；③ #1043 七 span 现文逐条与 `UI.md:215`/`:216`/`:218`/`:219` 实读相等（`renderer/queue.mjs` 在 `UI.md:311` 实读成立）；④ #1013 复核三锚实读对位（`WEBVIEW-PROTOCOL.md:538` 退场口径 ∥ `:520` `saveShellSettings` 行「活」∥ `:470-471` `mcpReconnected` 退场注）；⑤ 受影响档表行数与「内容行数 = read 计数 − 1」口径一致（BROWSER-TOOL 549 ∥ UI 820 ∥ DOC-DISCIPLINE 1678 ∥ WEB-QUICKCHECK 203 抽核）；⑥ §B 行宽 30 = core 5 + desktop 12 + vsc 13，逐行计数与 ±增量估自洽（desktop SETTINGS +12 与 8 行长度的多折需要相合）。

**范围与限制（如实登记）**：无文档地图 / 无项目标准档 ⇒ Document ownership 判据降级（按 AGENTS.md + 在评档自身规范判）；本评审无命令执行面 ⇒ 机检读数取自设计自跑（39 ∥ 36 · 16 ∥ 30 · 23 ∥ 6），「机器是否报 X」类断言均按所引判据句推证；评审清单两路径与实盘不符（`docs/desktop/design/BROWSER-TOOL.md` / `docs/vsc/design/WEB-QUICKCHECK.md` 不存在，实盘 = `docs/core/design/BROWSER-TOOL.md` / `docs/desktop/design/WEB-QUICKCHECK.md`——已按实盘读）；`settings.css` ∥ `PROVIDER.md` ∥ `ACP-CLIENT.md` ∥ 桌面/vsc `SETTINGS.md` 等目标值不在 scope ⇒ 未核（设计亦已声明实施前逐条复读）。

**计数**：🔴 1 · 🟡 2 · 🔵 3（共 6 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审（2 轮）· 发现表（对象 = 批档 §2 设计（fix 轮后现文）· 2026-10-08-doc-hygiene；复评面 = §3 轮次 1 六条 + 父侧扫面两条逐条复核 + 新问题）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（引用坐标 · 数值漂移） | 🔵 | §E 三处引用相对现盘整体 +1（同向单行位移）：批档 `docs/batches/2026-10-08-doc-hygiene.md:116` 引「§13 口径 `:538` ∥ `saveShellSettings` 在表 `:520` ∥ §12 尾 `:470-471`」；现盘实读 = `docs/vsc/design/WEBVIEW-PROTOCOL.md:539`（「删除落地 ⇒ 源零位 ⇒ 表行同步退场」句）∥ `:521`（`saveShellSettings` 表行）∥ `:471`（`mcpReconnected` 退场注——句跨 `:471-472`）。结论「零改」不受影响（表与现盘一致性本身成立）。 | 三处引用按现盘重锚（或标 as-of），使复读落点即所指行。 |
| 2 | Clarity（清单归属精度） | 🔵 | §D 行（批档 `:104`）「引（现文）」列书 `settings-providers.js:270/273/283/286/185/229-246`——其中 `270` ∥ `283` ∥ `273` ∥ `286` 在现文（`docs/vsc/requirements/WEBVIEW.md:34`）均属 `settings-tools.js`（`settings-tools.js:270` · `:283` · `settings-tools.js:273` / `:286`），仅 `185` / `229-246` 属 `settings-providers.js`；同行修法列（`:56-58`/`:67-69`/`:48-49`）不受影响。 | 该列按文件拆写（或在 270/273/283/286 前注明 `settings-tools.js`），其余不动。 |
| 3 | Methodology（§3.7 形态余量） | 🔵 | 受影响档表列头（批档 `:141`）仍为「档（现读行数）」，而全表 `.md` 行两格已按 §3.7 填 `—`（批档 `:143`–`:156`）——列头与列值形不一致（轮 1 发现 3 的随体余量；表题已随正）。 | 列头随「`—` 表」收形（如「档（`.md` 行不列行数——§3.7）」或去括注），与行值同笔。 |

**已实核（未构成发现的正证据）**：① 轮 1 🔴 已落——§A 行 7（`:439` 路径 token）在表（批档 `:51`）+ 行 8 判词「红面全貌 = T27b 四行 + `:439` 路径 token 一处」（`:52`）+ 行数核对「11 行（7 路径 + 4 用例号行）…合计 17（= 基线 16 + fix 轮扫面增量 `SETTINGS.md:244`）」（`:60`），与 `docs/core/design/BROWSER-TOOL.md:439` 实读（同行路径 + T27b 双 token）∥ `:500` ∥ `:512` ∥ `:549` 三 T27b 行实读逐条相合；② 轮 1 🟡#2（`:1622`）按「② 登记 residual」收口（批档 `:158` ∥ `:215`）：「组合简写」排除式③ 规格句在档（`docs/core/design/DOC-DISCIPLINE.md:927` ③），该 token 现文在 `DOC-DISCIPLINE.md:1622` 实读成立；③ 轮 1 🟡#3 已落——受影响档表 14 行全 `（—）`/`—`（批档 `:143`–`:156`），与 `DOC-DISCIPLINE.md:245`「该两列填 `—`，行保留」相合；④ 轮 1 🔵#4 已落——分解和 = 23（SETTINGS 9 + 八档 2/1/2/2/1/1/4/1，批档 `:131` ∥ `:151`）；⑤ 轮 1 🔵#5 已落——K2 谓词实装坐标 + 现盘实证入档（批档 `:165`）；⑥ 轮 1 🔵#6 已落——判据射程句（批档 `:112`）与 #1012 验收行（`:179`）同形；⑦ 父侧扫面两条已并入——`docs/desktop/design/SETTINGS.md:244` 实读含 `views/settings.mjs:378`（§A 行 13，批档 `:57`）；`:108` / `:244` 均为非表格长行、入 §B（批档 `:70`）；⑧ #1043 七处「现文 span」与 `docs/desktop/design/UI.md:215`/`:216`/`:218`/`:219` 实读逐条相等，`UI.md:311` `renderer/queue.mjs` 实读成立；⑨ #1014① 现文在 `docs/desktop/design/WEB-QUICKCHECK.md:57`（`thincoder-desktop/renderer/index.html:54`）实读成立；⑩ #1013 复核结论成立——§13 表无三删行、`saveShellSettings` 行在（`WEBVIEW-PROTOCOL.md:521`）、`mcpReconnected` 退场注在（`:471`）；⑪ #1017 五处「现文」在 `DOC-DISCIPLINE.md:1411` / `:1417` / `:1432` / `:1444` / `:1454` 逐条成立 + `:999` 坐标（`scripts/doc-check.mjs:62`）成立；⑫ #1012 表 doc:line ↔ 引（现文）抽核（`:21`/`:24`/`:26`/`:29`/`:31`/`:34`/`:84`/`:87`/`:99`/`:115`/`:118`/`:127`）逐条命中；⑬ 计数自洽：17 = 7 + 4 + 6 ∥ 35 = 7 + 14 + 14 ∥ 复跑 42 = 17 + 25 ∥ 41 = 35 + 6。

**范围与限制（如实登记）**：无命令执行面 ⇒ 机检读数（39 ∥ 36 · 17 ∥ 35 · 42 ∥ 41 · 行数面 23 等）不复核，按所引判据句与两轮自述读数推证；`settings.css` ∥ `PROVIDER.md` ∥ vsc `SETTINGS.md` ∥ `VSC-DEBT.md` ∥ `ACP-CLIENT.md` ∥ `TURN-CAP-CONTINUE.md` 等目标值不在本评审 scope ⇒ #1043 新 span ∥ #1014②③ ∥ #1015a 未逐条核；文档地图仍缺 ⇒ Document ownership 判据降级（按 AGENTS.md + 在评档自身规范判）。

**计数**：🔴 0 · 🟡 0 · 🔵 3（共 3 条）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-10-08 11:38 授权「自动跑」✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（§3 轮次 2 · 🔴 0 · 前表 6 条全清（🔴1 ∥ 🟡2 ∥ 🔵3）+ 父侧扫面 2 条（`:244` 悬空 ∥ `:108`/`:244` 行宽）并入核讫；新 🔵 3 条非阻断〔§E 引用重锚 ∥ §D 归属列拆写 ∥ 受影响档表列头随形——随实施轮同笔〕）；② **修正轮已落地并逐条核验** ✓（§2 尾块 + 轮 2 实读复核：`:439` 双 token ∥ 计数自洽 17/35/42/41 ∥ §3.7 `—` 形逐行落）；③ **token 已签发** ✓。**代签依据 = §3 轮次 2「VERDICT: pass」+ 计数「🔴 0 · 🟡 0 · 🔵 3」**。

**实施面预告**（射程与分派——按脸路由）：设计档面 = eng-designer 轮（core ∥ desktop ∥ vsc 各脸一笔，≤15 档/笔）；`docs/vsc/requirements/WEBVIEW.md`（#1012）= 主 agent 笔（需求档面·设计已明列）；排序 = 候在飞修正轮（#19 ∥ #23 ∥ #24）解冻后按写域串行。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 6.1 收口结算（2026-10-08 · 主 agent）

**逐项核讫**（机检终读 2026-10-08 12:4x · 父侧跑）：悬空 **2**（皆 `PROXY.md` 拟新增待件——代理族析出，K1）∥ 行宽 **1**（`PROXY.md:81`——代理批收口笔）∥ 行数面差异 **0** ∥ 行式异常 **0** ∥ 声明源缺位 **0**——**非代理族余量 = 0** ✓。
- **#1050a/b**（悬空 17 ∥ 行宽 35 本批面）：诸面收正落（设计面笔 + 父侧笔）；余量如上（代理族析出在册）。
- **#1043**（UI.md §1 七坐标）：设计面笔落，评审轮 2 抽核过。
- **#1012**（WEBVIEW.md 未列坐标残量）：父侧笔落——15 行表 14 行新坐标 ∥ 未核余量九组 ∥ P2-5/P2-6「已处置」收正 ∥ 顺读增量 `:30`/`:85` ∥ 变更行 `:198`；清账外残项四行（`:38/:39/:79/:80`）⇒ **#1079** 入册。
- **#1013**（§13 表登记面）：零改 + 行注收口（F-W12 处置齐）→ `:32` 行注「表齐」。
- **#1014**（漂移观察 3 族）：① `WEB-QUICKCHECK.md:57` 宿主坐标（设计面）✓ ∥ ② `PROVIDER.md:365` 四坐标迁核收正（`isBailianHost` = `config.mjs:150`——台账行 evidence 已随修）✓ ∥ ③ `ACP-CLIENT.md:374`/`CONFIG.md:17/:19` presets `:30/:64/:94` ⇒ `:31/:66/:96` + `model-picker.mjs:43` + `subagent-async.mjs:143` ✓。
- **#1015a**（标记冗余）：TURN-CAP ×5（父侧笔——节号指针形）∥ VSC-DEBT ×1（设计面）⇒ 复跑报告面无该面项（**0**）；**#1015b**（行数面）：13 条回填 ⇒ 差异 **0** ∥ 行式异常 **0**。
- **#1017**（档面余项）：① `DOC-DISCIPLINE.md` 五处（设计面笔）✓ ② `PROJECT.md:221` 在位核销 + 「单源 ∥ 读取面 ∥ 补行位」张力 ⇒ **#1076** 入册 ③ `MANIFEST.md` 漂移报告面核销 ✓。

**评审轮 2 三条 🔵 随收**（fix 轮 #45 落、回读过；父侧抽核三锚 ✓）：§E 三处引用按现盘重锚（`:540` ∥ `:522` ∥ `:472-473`——目标档 mtime 12:26 在飞，落笔时复锚；行号漂移如实登记）∥ §D 引用列按文件拆写（`270/273/283/286` 归 `settings-tools.js`）∥ 受影响档表列头收形（`:141`）。

**父侧直笔（披露 · 机械 · 可 revert）**：① `docs/vsc/requirements/WEBVIEW.md` 清账笔（#1012——26 处 + 变更行 `:198`）② `TURN-CAP-CONTINUE.md:85` 邻位（标记冗余收正）。

**上抛七项处置**：① 需求档面三笔全落 ✓ ② 台账行题「design/」偏差确认——#1012 行题按 `docs/vsc/requirements/` 收正 ✓ ③ 张力 ⇒ **#1076** ④ 域外 ≈60 处 ⇒ **#1066**（已存；本批重复册 #1077 撤并）⑤ P2-5/P2-6 收正 ✓ ⑥ T27b 留档 ✓ ⑦ #1014 evidence 修正随修 ✓。

**台账**：#1050 ∥ #1043 ∥ #1012 ∥ #1013 ∥ #1014 ∥ #1015 ∥ #1017 → **已核销**；新增 #1076 ∥ #1079；#1077 撤并；#1078（F-W17 重锚候 #40）在册。
**结算同步清单**：角色表 ✓ ∥ 状态行 ✓ ∥ 计数 ✓（本块）∥ 指针 ✓ ∥ 变更记录 ✓（WEBVIEW.md `:198`）∥ 待办勾销 ✓ ∥ 前批遗留交叉核 = 无 ∥ 台账可见面 = 结算行随报（本会话）。
**暂缓批复核：无**。
**收口**：记录冻结（回改禁止 · 只读）；批终。
