# 方向键编辑能力（输入框竖直移动 + Inject 框升级）· 批次记录（2026-09-11）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 15:10 · 来源 = 用户 13:36「都可以」（Gitee #IKC6IX + 父侧建议获准）。

---

## §1 讨论（主 agent 记）

### 本批条目（1 条）

| # | 条目 | 内容 |
|---|---|---|
| **E1** | **输入框 ↑↓ 竖直移动 + Inject 框（Ctrl+I）方向键编辑** | 成立（两条）。主输入框：`src/tui/key-handler.mjs:296-325` ↑↓ **无条件** = 历史导航；光标移动只有 ←→/Home/End（`:328-347`）；`state.input` 扁平 codepoint + 单整数光标（`docs/design/TUI-INPUT-BOX.md:9` 不变量 1）——无行列模型 ⇒ 竖直移动结构性不存在；processing 期 ↑↓ 直接屏蔽（`:271`）。Inject 框：`src/tui/key-modes.mjs:210-238` handleInterruptMode 只处理 Esc/Enter/Backspace/可打印，其余落到末尾 `return true`（模态独占吞键）；`state.interruptPrompt` 是**裸字符串、无 cursor**（对比 question 自由文本态 `q.cursor`，`:152-199`、`TUI-INPUT-BOX.md:113-123`）⇒ 四方向键结构性无响应。 |

### 用户裁定（2026-09-11 13:36 批准父侧建议）
**↑↓ = 多行时竖直移动、单行时回落历史；正在翻历史（historyIndex ≠ -1）时恒为历史导航**（与 zsh/readline 惯例 + 本仓 VSC webview 先例 `thincoder-vscode/webview/input.js:76-84` 一致）。

### 已核事实（免重复）
- 契约档：`docs/design/TUI-INPUT-BOX.md:9`（不变量 1 扁平模型）· `:13`（不变量 5 `layoutInput` → `{cursorLine,cursorCol}`）· `:22-31`（§2 按键表）· `:37-42`（§3 语义）· `:113-123`（question 自由文本态先例）。
- VSC 先例（同款规则）：`thincoder-vscode/webview/input.js:76-84`。

### 待设计裁定
1. 主框实现形态（按 `layoutInput` 行列模型做「上行/下行 + 列保持钳制」；与既有 ↑↓ 历史语义的切换条件）+ 契约 §2/§3 更新；
2. Inject 框升级形态（`{chars,cursor}` 模型 + 复用 `layoutAnswer/layoutInput` 渲染 + 同一组编辑键——`TUI-INPUT-BOX.md` §7 同步）；
3. processing 期屏蔽（`:271`）保留否（裁）；
4. 受影响文件全清单（行数/增量）+ 用例/AC（逐条机验：单行回落历史 / 多行竖移列保持 / 历史中恒历史 / Inject 四方向键）+ 既有锁零伤；
5. 与 D1 纪律核对（契约档更新 = design 面）。

### 范围边界（明确不做）
- 不做 VSC webview 改动（其已有同款规则；差异勘察仅报告）；不改 question 自由文本态（既有 ✓）；不得新建档（必须 → 打回）。

### 状态
**已收口**（用户批准）。下一步 = 设计。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求层 + 设计/测试层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；按键语义逐字 / 用例表 / 验收判据全文在设计档，本段只做任务书 + 口径锚）。

**目标**：主输入框 ↑↓ 获得多行竖移（可视行口径、显示列保持），不可移时回落历史；Inject 框（Ctrl+I）升级为 `{chars,cursor}` 带光标编辑（四方向键可用）。**为什么**：多行输入不可竖移 + 注入框方向键结构性无响应（本档 §1 条目 E1 一手实证）。

**已知事实（免重复勘察）**：本档 §1「已核事实」+ 设计 §9.1。要点：↑↓ 现状 = `key-handler.mjs:296-325` 无条件历史导航；`:271` busy 门禁屏蔽 ↑↓；`state.interruptPrompt` = 裸 `{ text }`、`key-modes.mjs:210-238` 未列键吞；契约不变量 = `TUI-INPUT-BOX.md` §1；VSC 先例 = `thincoder-vscode/webview/input.js:76-84`。

**落档位置**：需求 = `docs/requirements/TUI.md` §2 **F11** + §3 **N8**（F5 括注改指 F11）· 设计+测试 = `docs/design/TUI-INPUT-BOX.md` **§8（Inject 契约）+ §9 全节**（三规则 / 选型 / 决策 / 受影响文件 / 用例 11 条 / AC-E1-1..10）。`docs/design/TUI.md` 更新面 = 报告父侧（本批未写——超会话声明面；最小改动面见设计 §9.5 末注）。

**本批覆盖的条目**（三方一致——本节条目 = 设计档 AC 回指 = 需求档条目）：

| # | 条目 | 需求面 | 设计 / AC 面 | 一句话 |
|---|---|---|---|---|
| E1 | 输入框 ↑↓ 竖移 + Inject 框四方向键编辑 | TUI 需求 F11 / N8 | TUI-INPUT-BOX 设计 §8/§9 · AC-E1-1..10 | 三规则（竖移优先 / 边界回落 / 翻历史恒历史）+ Inject `{chars,cursor}` + 四方向键 |

**受影响文件**（写域声明——行数 as-of 2026-09-11 实测，口径 `split("\n").length` 含末行）：

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/tui/render.mjs` | 253 | +30 ± 10 | `layoutInput` 增 `lineStarts`（additive）；新 `moveCursorVertical` |
| `src/tui/layout.mjs` | 227 | +8 ± 3 | inject 字段读取（chars/cursor）；新 `inputContentWidth` |
| `src/tui/key-handler.mjs` | 440 | +15 / −10 | ↑↓ 分流（竖移/历史）；`:271` 门禁改（tab 子句保留）；Ctrl+I 创建点 |
| `src/tui/key-modes.mjs` | 239 | +20 ± 6 | handleInterruptMode 编辑键 + 四方向键 |
| `src/tui/clipboard.mjs` | 175 | +6 / −2 | insertPastedText 注入框分支落 cursor |
| `src/tui/render-frame.mjs` | 377 | ±4 | Inject 标题提示（§8.3 逐字）+ 占位符判定 |
| `src/tui/index.mjs` | 450 | ±1 | state 注释形态（`interruptPrompt` 空态） |
| `test/arrow-editing.test.mjs` | 新增 | +170 ± 40 | 用例 11 条 1:1（设计 §9.6 T-A1..T-A11） |

**零改核对项**：`test/input-lock.test.mjs`（回归跑）· `src/tui/key-handler-search.mjs` · `src/tui/mouse.mjs` · `src/tui/interaction.mjs` · 其余 `src/**` · `src/prompts/**` · VSC 仓 · `docs/**`（写稿面 = 设计者）· `docs/TODO.md`（父侧登记，见下）。

**交付要求**：

1. 实现 = 设计档 §9.3 契约变更清单逐条 + §8 按键表逐字（语义争议回设计档，不自行改语义；撞墙 → 停下报告，不静默偏离）。
2. 测试：新档 `test/arrow-editing.test.mjs` **11 用例 1:1**（设计 §9.6）+ 既有锁档 `test/input-lock.test.mjs` 零改全绿。
3. 验证分层：L0+（`node --check` 所触源档 + 定向 `node --test test/arrow-editing.test.mjs test/input-lock.test.mjs`）；不跑全量（父侧 L2）。
4. 交付报告 = 透明表（Done / Simplified / Not done）+ 逐条 AC 机验证据（命令 + 结果）+ 所触文件**实测行数（入报告——不回写文档**；写权归设计者/父侧收口）。
5. 不 commit。

**边界（不做）**：见设计 §9.8 全列——VSC 零改（差异仅报告：VSC 首行 col>0 时 ↑ 为浏览器默认 no-op）／§7 question 面零动／Inject 不上 Delete、多行、历史回落／不引入列记忆／不动 `:271` tab 死条件（TODO 在案）／不新建档／不 commit。

**未确认面（呈父侧确认）**：

① **设计承载档** = `docs/design/TUI-INPUT-BOX.md` §8/§9——本会话写域「上述 2 档」的解读 = 需求档 + 契约档（契约更新为本档 §1 待裁 1/2/5 明示要求）；若父侧原意含 `docs/design/TUI.md` 承载，内容与落点解耦、迁移成本低，父侧可否决重定向；
② `docs/design/TUI.md` 更新面本批未写（超声明面）——最小改动面 = 设计 §9.5 末注三处；
③ processing 期语义微扩（C1：竖移放行、历史禁）——设计裁定（§9.2 C / D-31.3），裁定权在评审 / 用户；
④ 契约 §2/§3/§8 现按**目标态**落档（实现待批准）——实现后由设计者去标（本批不代改）。

**父侧事项（不在 coder 写域）**：

- **TODO 登记**：`docs/TODO.md` 需求池未见本批条目（方向键编辑 / Gitee #IKC6IX）——待父侧登记一行指针（需求档节 + 本档 §2 + status）。
- **发现项（已随本批修正——在写域内）**：`docs/design/TUI-INPUT-BOX.md` §6 测试行原引 `test/tui.test.mjs` / `test/clipboard.test.mjs`（两档不存在）→ 更正为 `test/input-lock.test.mjs` + 本批新档。
- **发现项（不改——本批边界外）**：① `key-handler.mjs:271` tab 死条件（TODO 已登记 status=待讨论；本批改该行时原样保留 tab 子句）；② 历史编辑态 `_draft` 为覆盖式（编辑历史条目时 `_draft` 被改写——既有行为，本批零改；如属缺陷另案）。
- **VSC 差异（仅报告）**：`thincoder-vscode/webview/input.js:76-84` 的 ArrowUp 判定 = `selectionStart === 0`（首行 col>0 时 ↑ 为浏览器默认 no-op——不回落历史）——与 CLI 裁定语义有细微差别；本批 VSC 零改。
- **两仓 check-doc-width**：VSC 新增 0（导出 0 违规）；CLI 本批两档新增 0（报出的 8 文件 / 10 行为他批批次记录存量）；一致性 V1/V2 新增 4 条均在他批批次记录（PORTABILITY / TUI-SELECTION），本批 0 新增。

#### §2 修正轮留痕（2026-09-11——设计评审轮次 1 后；本节作者补录）

> 本节记录修正轮对 §2 既有行的**直接修订** + 父侧协调项认定（D7 变更留痕；设计侧对应改动见设计档「变更记录」同日修正轮条目）。
> 修正轮边界：只改文档（`docs/**`——设计者写域），`src/**` 与提示词零碰；未新建档；不 commit。

**§2 行级修订（行号为落笔时 as-of）**

| 行 | 改前 | 改后 |
|---|---|---|
| :47 | AC-E1-1..9 | AC-E1-1..10（AC-E1-10 新增——N8③/N8④ 检视口径） |
| :53 | AC-E1-1..9 | AC-E1-1..10 |

**评审逐条落点（轮次 2 验证依据）——8 条全部落修**

| # | 级别 | 落点（`docs/design/TUI-INPUT-BOX.md`，as-of 落修后） | 处置 |
|---|---|---|---|
| 1 | 🔴 | :283（T-A6） | 数组序改 `["older","x\ny"]`（index0=older——三处预期逐格复算对齐：首 ↑ index=1/input=x\ny/cursor=3；再 ↑ index=0/older/cursor=5；↓ index=1/x\ny/cursor=3） |
| 2 | 🟡 | :284（T-A7） | 补非空夹具 `history=["prev"]` + 字面多行 `aa\nbbbb`（cursor=5→↑→cursor=2 复算成立）+「历史禁——不载入 prev」判别措辞 |
| 3 | 🟡 | :290/:302/:303（AC 表） | 表头口径改「机跑用例或检视证据」；AC-E1-9 回指收窄为 N8①；**新增 AC-E1-10** = N8③/N8④ 检视验证（纯函数签名 / diff 零新 state 字段 / package.json 与 import 零增） |
| 4 | 🟡 | 本块（认定行） | 父侧协调项认定（非缺陷）：① TODO 需求池登记；② `docs/design/TUI.md` 实现后回写——按 §2「父侧事项」执行，批准/收口时点由父侧确认 |
| 5 | 🔵 | :5 + :148 | 档头枚举补 §1/§6；§8 引言「已把」→「把」+「（目标态）」——完成态措辞归位 |
| 6 | 🔵 | :285（T-A8）+ :15 | 载荷钉死 `{chars: "a"×60, cursor: 30}` + 钳制几何（↓→60 钳制行尾 / ↑→25 列保持逐键现算——「（钳制）」真触发）；不变量 5 补「cursor 落 `\n` 时属前行行尾」（T-A2 口径） |
| 7 | 🔵 | :15 | 不变量 5 尾项精确定义：末项哨兵 = `chars.length`（上界、不指向行）；行 k 区间 = `[lineStarts[k], lineStarts[k+1])`（含行尾 `\n`） |
| 8 | 🔵 | :171-172 | §8.2「差异仅此一项」→「差异共两项」：① 四方向键；② 粘贴换行清洗（本面 `\n`/`\r` 去除 vs §7.2 面折叠为空格） |

**验证**：`node scripts/check-doc-width.mjs`——本批两档（设计档 + 本档）宽度与 V1/V2/V3 新增均 0；脚本报出的 11 文件 / 17 行超宽与一致性 4 条均为他批存量（PORTABILITY / TUI-SELECTION 等）。回读核实（D6）已做。

#### §2 交付后刷新留痕（2026-09-11——coder 交付终态后；本节作者补录）

> 触发 = 交付后呈父侧项 ①（T-A8 括注）/ ②（`TUI.md` §1/§2/§4 回写）/ ④（§1 不变量 4 vs 分发序——存量）。
> 边界：只改文档（设计者写域）；零代码、需求档零碰、`src/**` 零碰；未新建档；未 commit；未发起评审。

**逐项落点（file:line as-of 本轮）**

| # | 项 | 落点 | 处置 |
|---|---|---|---|
| 1 | §9.6 T-A8 括注几何修正 | `docs/design/TUI-INPUT-BOX.md:285` | 行 1 / 行 2 = **33 / 27 字符**（含 2 列行前缀——显示宽 35 / 29）；「↑」列保持 → **cursor=27**（原「35 / 25」「cursor=25」未减行前缀）；按 §9.3 #3 单源公式 + `render.mjs` 行前缀语义实测、与测试档断言对齐（§5 偏差披露 ① 闭合） |
| 2 | `TUI.md` §1 模块地图触行回写 | `docs/design/TUI.md:34/36/50/52/68/70/71` | 实测：key-handler **461** · key-modes **294** · render **285** · layout **237** · clipboard **181** · pickers **118** · wizard **242**——含批 20（`TUI-SELECTION.md` §5 实测表）与批 28（`INPUT-FIXES-SMALL.md` §2/§4 遗留）声明面；cmd-advisor 实测 256 = 表值（核验无差、未注改） |
| 3 | `TUI.md` §2/§4 契约注 | `docs/design/TUI.md:124/168-170` | §2 `interruptPrompt` 形态注（`{chars,cursor}` 单行态——指针 TUI-INPUT-BOX.md §1 不变量 9）；§4 状态优先级行序修正（interruptPrompt 先于 picker 栈/wizard）+「正常输入编辑」括注补竖移/历史（第 31 批） |
| 4 | §1 不变量 4 分发序归位 | `docs/design/TUI-INPUT-BOX.md:14`（`TUI.md:168-169` 同步） | 裁定 = **修正措辞**（非登记缺陷）——理由见下 |
| 5 | 变更记录 | `TUI-INPUT-BOX.md:317` / `TUI.md:1308` | 各一行同日刷新注记（D7） |

**#4 裁定理由（修正措辞——按 `key-handler.mjs` / `key-modes.mjs` 实核）**：

① 实测行为自洽——Ctrl+I 创建（`key-handler.mjs:162`）与 interruptPrompt 模态（`:173`；`key-modes.mjs:216` 未激活返回 false、`:292` 激活消费全部按键）先于 picker 分支（`:176`）：picker 打开期间 processing 按 Ctrl+I 照常打开注入框，Esc 关框后 picker 原样保留；
② 反向修法（给 Ctrl+I 加 picker 门）= 行为收紧——会阻塞 processing 期逃逸通道，须独立批次入评审链，超出本刷新轮零代码边界；
③ 原句「picker 吃掉按键（interruptPrompt 在 picker 后）」与实码不符属文档口径问题（HEAD 存量、非本批引入）——按实现归位：同句换上正确优先级列表 + 实际行为描述。

**口径说明（呈父侧核）**：任务点名「模块地图两行（cmd-advisor.mjs / pickers.mjs）」；勘察判读 = 批 28 遗留（`INPUT-FIXES-SMALL.md` §2 声明的收口回写两行）+ 批 20 遗留（`TUI-SELECTION.md` §5 声明的设计者回写——表内触行 = pickers / key-modes / wizard）+ 本批触行——按并集落（wizard 随批 20 面一并闭合；cmd-advisor 256 无差）。若父侧原意仅两行，wizard 一处可撤。

**核验（D6）**：`node scripts/check-doc-width.mjs`——design 两档（`TUI-INPUT-BOX.md` / `TUI.md`）非表格 >300 新增 0、一致性 V1/V2/V3 新增 0；宽度报出 12 文件 / 20 行（除本档 :225——§5 coder 段落存量、非本轮引入——外均在他批档）、一致性新增 6 条全部在他批在飞档；回读核实已做。

**呈父侧（本刷新轮未动）**：① `TUI-INPUT-BOX.md:5` / `:42` / `:146` 「目标态（设计已落档、实现待批准）」标注——实现已批准并交付 clean，翻转归父侧收口（§6）或下一轮指派；② F1 帮助文案（`key-handler.mjs:153`「↑/↓ — Navigate input history」）未含竖移语义——设计 §9.5 变更点未含该项，未自行扩（建议后续批）；③ 本档 :225 宽度存量（§5 段，非本段写域）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

评审对象：第 31 批「↑↓ 多行竖移 + Inject 框升级」轮次 1——批次档 §2 · `docs/design/TUI-INPUT-BOX.md` §8/§9（含 §1/§2/§3/§6 就地更新面 + 变更记录）· `docs/requirements/TUI.md` F11/N8 + §4 批边界行。三方一致已逐点比对；契约档就地更新面（§1/§2/§3/§6 + §7 指针）齐备；受影响表 7 源 + 1 新测两表逐格互证（行数对源码复核受读域限制未做）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收可验性 | 🔴 | T-A6（`docs/design/TUI-INPUT-BOX.md:282`）输入与预期互斥：字面 `history=["x\ny","older"]` 下首 ↑ 应载入 history[1]="older"（预期却写 input=[..."x\ny"]）；再 ↑ 预期 cursor=5 只与 "older"（长 5）自洽，字面数组下它对应 "x\ny"（长 3，cursor 不可为 5）——三条预期的 input 值均不成立、cursor=5 越界。AC-E1-4（:296）唯一机验手段即 T-A6，且任务书要求 coder「1:1」「不自行改语义」（`docs/batches/2026-09-11-ARROW-EDITING.md:72-73`）——实现前必须裁决。 | 修正方向：令数组顺序与三处互相自洽的预期对齐（现三处预期仅与 older→index 0 的排序自洽），或反向重推预期；修后逐格复算（含 cursor=5 与条目末语义）。 |
| 2 | 用例精度 | 🟡 | T-A7（:283）缺字面多行输入（预期 cursor=2 依赖行 1 宽 ≥2 的具体输入），且 processing 子用例未给历史夹具：「单行 ↑ → 零变化（历史禁）」在空历史下与「门禁失效但无历史可回」不可区分，无法判别 `:271` 新分流的禁历史分支（见 `docs/batches/2026-09-11-ARROW-EDITING.md:61`）。 | 补字面输入 + 非空历史夹具，使「零变化 / historyIndex 不变」成为可判别断言（否则 AC-E1-5 的历史禁仅名义覆盖）。 |
| 3 | 验收回指 | 🟡 | AC-E1-9（:301）回指 N8①/N8③，但其机验手段（T-A3 + 双档 `node --test`）不证明 N8③「状态对象零增」；N8④「零新依赖」（`docs/requirements/TUI.md:46`）在设计 AC 表无回指。 | 为 N8③ 补最小结构证据（纯函数/无 state 变更断言）或注明「检视验证」；N8④ 补一行检视口径或 AC 回指。 |
| 4 | 协调项（非缺陷） | 🟡 | 父侧事项（均已随文档声明）：① `docs/TODO.md` 需求池待登记本批条目（`docs/batches/2026-09-11-ARROW-EDITING.md:89`）；② `docs/design/TUI.md` §1/§2/§4 更新面本批未写、待实现后由设计者收口（`docs/design/TUI-INPUT-BOX.md:270-271`）——请在批准/收口时点确认，防文档滞后漂移。 | 按批次 §2 父侧事项执行（TODO 一行指针 + 实现后 TUI.md 三处回写）。 |
| 5 | 文档状态标注 | 🔵 | 档头（:5）称「§2/§3/§8 为目标态」，但 §1（不变量 5/9，:15/:19）与 §6（新函数名 `moveCursorVertical`/`inputContentWidth`，:105-106）同载目标态内容；§8 引言（:148）以完成态措辞「已把 … 走 `layoutInput`」描述未实现接线。 | 枚举补 §1/§6；完成态措辞改目标态表述，免被读作现状。 |
| 6 | 用例/边界精度 | 🔵 | T-A8（:284）载荷非字面（「60 字符」未指定内容——「折 2 行」仅对全单宽字符成立）且「（钳制）」未被该几何触发（cursor=60 = 末行 col25，↑ → 首行 col25，行 1 宽 35 不触钳制）；T-A2（:278）cursor=2 落在 `\n` 索引上，其行归属（前行行尾）仅见于用例括注，§1 不变量 5（:15）未固化。 | T-A8 钉死载荷与预期光标值，或改用能触发钳制的起止几何（如自行 1 较深列按 ↓）；不变量 5 补「cursor 落 `\n` 时行归属」一句。 |
| 7 | 契约清晰度 | 🔵 | §1 不变量 5（:15）「`lineStarts[k]` = 第 k 行行首…（尾行 = `chars.length`）」尾项指代不清——字面读「最后一行行首 = chars.length」除空尾行外不成立；竖移定位依赖该尾项（哨兵）语义。 | 精确定义尾项（如哨兵项 = chars.length、行 k 字符区间由相邻项推出），免实现歧义。 |
| 8 | 表述精度 | 🔵 | §8.2（:171）称与 §7.2「差异仅此一项」（↑↓），但粘贴清洗亦不同——question 面「`\n` → 替换为空格」（:141、:144），Inject 面「`\n`/`\r` 去除」（:166；T-A10）。两处各自成文无直接矛盾，唯「仅此一项」表述不精确。 | 统一两面清洗口径，或在 §8.2 明列第二差异。 |

VERDICT: changes-required

计数：🔴×1 · 🟡×3 · 🔵×4（共 8 条）

### 轮次 2（评审子代理）

轮次 2 单轮校验（修正轮 8 条落点 + 连带同步）——逐条回读当前态复核：8/8 全部落修，连带同步到位，新增发现 0 条。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `docs/design/TUI-INPUT-BOX.md:283` | 🔴 | Fixed | T-A6 数组序改 `["older","x\ny"]`（index0=older / index1 最新——push 序），三处预期逐格复算通过：首 ↑ idx=1/"x\ny"/cursor=3（条目末，长 3）· 再 ↑ idx=0/"older"/cursor=5 · ↓ idx=1/"x\ny"/cursor=3——字面输入下三处预期现均成立，矛盾消解。 |
| 2 | 2 | `docs/design/TUI-INPUT-BOX.md:284` | 🟡 | Fixed | T-A7 补非空夹具 `history=["prev"]` + 字面多行 `aa\nbbbb`（cursor=5=末行 col2 → ↑ → cursor=2，复算成立）+「历史禁——不载入 prev」判别措辞——空历史不可区分问题消除，AC-E1-5 断言可判别。 |
| 3 | 3 | `docs/design/TUI-INPUT-BOX.md:290/:302/:303` | 🟡 | Fixed | :290 表头口径 =「每条有可核验手段——机跑用例或检视证据」；:302 AC-E1-9 回指收窄为 N8①；:303 新增 AC-E1-10（回指 N8③/N8④；检视验证：纯函数签名无 state 入参 / diff 零新 state 字段 / package.json 与 import 零增）——N8③④ 覆盖补全。 |
| 4 | 4 | `docs/batches/2026-09-11-ARROW-EDITING.md:114` | 🟡 | Fixed | 父侧协调项认定行落档：① TODO 需求池登记；② `docs/design/TUI.md` 实现后回写——按 §2「父侧事项」执行、批准/收口时点由父侧确认（协调项（非缺陷）留痕，非阻塞）。 |
| 5 | 5 | `docs/design/TUI-INPUT-BOX.md:5/:148` | 🔵 | Fixed | 档头枚举补 §1/§6（现「§1/§2/§3/§6/§8 为目标态」）；§8 引言「已把」→「把」+「（目标态）」——完成态措辞归位。 |
| 6 | 6 | `docs/design/TUI-INPUT-BOX.md:285/:15` | 🔵 | Fixed | T-A8 载荷钉死 `{chars: "a"×60, cursor: 30}`（cols=40 → 行 35/25）；钳制真触发（↓ 自 col30 → cursor=60 钳制行尾）；↑ → cursor=25 且「逐键现算，不回 30」；:15 补「cursor 落 `\n` 时属前行行尾（T-A2 口径）」。 |
| 7 | 7 | `docs/design/TUI-INPUT-BOX.md:15` | 🔵 | Fixed | 不变量 5 尾项精确定义：末项哨兵 = `chars.length`（上界、不指向行）；行 k 区间 = `[lineStarts[k], lineStarts[k+1])`（含行尾 `\n`）——与 T-A2/T-A3 复算闭合。 |
| 8 | 8 | `docs/design/TUI-INPUT-BOX.md:171-172` | 🔵 | Fixed | §8.2 改「与 §7.2 的差异共两项」：① 四方向键 ↑↓；② 粘贴换行清洗（本面 `\n`/`\r` 去除 vs §7.2 折叠为空格）——与 :166 / :141、:144 一致。 |
| 9 | 连带 | `docs/batches/2026-09-11-ARROW-EDITING.md:47/:53` + `docs/design/TUI-INPUT-BOX.md:316` | — | Fixed | 批次档两处「AC-E1-1..9」→「AC-E1-1..10」；§2 修正轮留痕块（:100-120：行级修订表 + 8 条落点 + 验证行）在位；设计变更记录 :316 修正轮条目在位；两档全文检索无「AC-E1-1..9」残遗。 |

VERDICT: pass

计数：新增 🔴×0 · 🟡×0 · 🔵×0（共 0 条）；复核原 8 条 + 连带 1 组——全部落修。

## §4 用户批准（主 agent 记）

**2026-09-12 01:05 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 changes-required（🔴1 · 🟡3 · 🔵4）→ 修正轮 8/8 + 连带同步 → **轮次 2 = pass**（8/8 核销 · 0 发现）→ **token 已签发**（值不落档）。

**批准范围**：7 改 + 1 新（`render.mjs`（`lineStarts` + `moveCursorVertical`）· `layout.mjs`（inject 读取 + `inputContentWidth`）· `key-handler.mjs`（↑↓ 分流 · Ctrl+I）· `key-modes.mjs`（四方向键）· `clipboard.mjs`（注入框落 cursor）· `render-frame.mjs`（标题提示）· `index.mjs`（注释）· 新测档 `test/arrow-editing.test.mjs`（11 用例 1:1））。

**遗留（批准时登记）**：① 父侧协调项（TODO 需求池 + `docs/design/TUI.md` 实现后回写）；② commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：交付完成**（2026-09-11）——设计 §9.3 八条契约变更 + §8 按键表逐条落地；8 档（7 改 + 1 新测档）；定向验证 15/15 绿（11 新 + 4 既有锁，锁档零改）；`node scripts/check-syntax.mjs` 290 档 OK；未 commit；VSC 仓零改。

**实测行数**（口径 `split("\n").length` 含末行；as-of = 设计 §9.5 表）

| 文件 | as-of | 实测 | 增量 | 设计预估 |
|---|---|---|---|---|
| `src/tui/render.mjs` | 253 | 285 | +32 | +30 ± 10 ✓ |
| `src/tui/layout.mjs` | 227 | 237 | +10 | +8 ± 3 ✓ |
| `src/tui/key-handler.mjs` | 440 | 461 | +21 | +15 / −10（净增略超） |
| `src/tui/key-modes.mjs` | 239 | 294 | +55 | +20 ± 6（**超预估 ~35**） |
| `src/tui/clipboard.mjs` | 175 | 181 | +6 | +6 / −2 ✓ |
| `src/tui/render-frame.mjs` | 377 | 377 | 0 | ±4 ✓ |
| `src/tui/index.mjs` | 450 | 450 | 0 | ±1 ✓ |
| `test/arrow-editing.test.mjs` | 新增 | 283 | +283 | +170 ± 40（**超预估 ~70**） |

超预估成因：Inject 键表 12 行逐行落地 + 守卫/注释密度（key-modes）；用例档注释 + T-A8 几何断言与偏差注（test 档）。均未越 300 咨询线（key-modes 294 已近线——下批再触该档应先评估拆分）。

**透明表（Done / Simplified / Not done）**

| 项 | 状态 | 说明 |
|---|---|---|
| §9.3 #1 `layoutInput` 增 `lineStarts` | Done | additive；末项哨兵 = `chars.length`；行 k 区间含行尾 `\n` |
| §9.3 #2 `moveCursorVertical` | Done | `(chars, cursor, width, dir) → number \| null`（null = 无邻行） |
| §9.3 #3 `inputContentWidth` | Done | `max(20, cols−1) − 4`；布局（layout.mjs）与竖移（key-handler/key-modes）共用同式 |
| §9.3 #4/#5 三规则 + processing | Done | 三规则分流；processing 期竖移放行 / 历史禁（分支吞） |
| §9.3 #6/#7 Inject `{chars,cursor}` + 键集 | Done | §8.1 十二行逐行；Delete 吞、无历史回落、Ctrl+J no-op |
| §9.3 #8 标题提示 | Done | 逐字（` Enter send, Esc cancel │ ←→↑↓ Home/End move │ Ctrl+V paste `）；共用段条件收窄为 Input/Processing |
| T-A1..T-A11 1:1 | Done | 11 用例；唯一数字偏差见「偏差披露」（doc-side） |
| `test/input-lock.test.mjs` 零改 | Done | 4/4 绿 |
| Simplified / Not done | 无 | 本批边界外项见「呈父侧」 |

**AC-E1-1..10 机验证据**（命令：`node --test test/arrow-editing.test.mjs test/input-lock.test.mjs` → tests 15 / pass 15 / fail 0 / 282ms；`node scripts/check-syntax.mjs` → 290 files OK）

| AC | 回指 | 证据 |
|---|---|---|
| AC-E1-1 | F11 | T-A1（9→5→9）+ T-A2（↓ 钳制 4 / ↑→1） |
| AC-E1-2 | F11 | T-A4（↑ 历史 + 草稿入 `_draft`；↓ 还原） |
| AC-E1-3 | F11 | T-A5（顶行 ↑ 回落历史；末行 ↓ 零变化） |
| AC-E1-4 | F11 | T-A6（index 1→0→1，多行条目不竖移） |
| AC-E1-5 | F11 | T-A7（多行 ↑ 5→2；单行 ↑ / 末行 ↓ 零变化——非空历史夹具可判别） |
| AC-E1-6 | F11 | T-A8（↓ 钳制 60；↑ 列保持 27；←→59 / Home 0 / End 60 / Ctrl+U 清空） |
| AC-E1-7 | F11 | T-A9（abort 载荷 `{interrupt,message}` + `[inject]` 提示；空不 abort；Esc 置 null）+ T-A10（落 cursor / 无 `\n` / `\t`→2 空格 / 主框零污染） |
| AC-E1-8 | N8② | T-A11 + input-lock 4/4 绿 |
| AC-E1-9 | N8① | T-A3（CJK 显示列 2）+ 双档 15/15 绿 |
| AC-E1-10 | N8③/N8④ | 检视：`moveCursorVertical` 4 参纯函数无 state 入参；`layoutInput` 同；diff 零新 state 字段（`interruptPrompt` 形态 = §9.3 #6 指定变更）；`package.json` 未动、新增 import 全为仓内既有模块 |

**偏差披露（1 条——doc-side，代码/测试侧零改；呈设计者/父侧）**

① **T-A8 数字与设计档失配**：设计 §9.6 写 cols=40「内容宽 35 → 折 2 行：行 1 宽 35 / 行 2 宽 25」、预期「↑ → cursor=25」；按设计 §9.3 #3 公式（`inputContentWidth(40) = max(20,39) − 4 = 35`）与 `layoutInput` 既有语义（`render.mjs:171` `avail = width − 2`——每行 2 列行前缀），实测折行 = **33 / 27 字符**（显示宽 35 / 29），↑ 自 cursor=60 → **27**。测试按实测几何断言并在档内注明（`test/arrow-editing.test.mjs:176-184`、`:197`）；↓→60、末行 ↓ 吞、←→59、Home 0、End 60、Ctrl+U 六项与设计逐项一致。令 25 成立须让 inject 用与渲染不同的宽度（违 §9.3 #3 单源 + §9.2 A1 选定理由）——**待设计者/父侧修 §9.6 括注**（33/27 字符 = 显示宽 35/29、↑→27）。内部审计与 advisor 评审均复核该诊断成立，且唯一受影响用例 = T-A8。

**审计与代码评审轮次（终态 clean）**

| 轮次 | 类型 | 结论 | 处置 |
|---|---|---|---|
| 1 | 内部 explore 偏离审计（只读） | changes-required——2 条均 **doc-side**（T-A8 括注 / `docs/design/TUI.md` 模块地图回写）；**代码侧 0 改动需求** | 复核成立；已呈父侧 |
| 1 | 内部 advisor 代码评审（同步） | **pass**——🔴×0 · 🟡×3 · 🔵×3 | 见响应表；fix round 1 项已修 |

**advisor 响应表（逐条裁决）**

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | T-A8 数字失配（🟡）——doc-side，coder 无 docs 写权；代码/测试侧零改（实测几何 33/27——`render.mjs:171` 与 §9.3 #3 公式互斥于设计括注）；档内注明 + 呈父侧收口。不阻断（advisor 明示「非 coder 写域、非阻塞」；内部审计同结论）。 |
| 2 | Deferred | §1 不变量 4「picker 打开期间 Ctrl+I 不接收不处理」与分发序不一致（🟡，报告项）——`key-handler.mjs:162-176`（inject 创建/模态先于 picker 分支）。git 核实：该句与分发序均为 HEAD 存量（非本批引入，本批仅改创建点形态）。裁定权在父侧/设计者（改文档表述 or 独立批次补 picker 门/重排）。 |
| 3 | Deferred | `key-handler.mjs`（461）/`index.mjs`（450）/`render-frame.mjs`（377）> 300 行（🟡 advisory）——设计 §9.5 已逐档裁定「不拆」（≤500 硬限内），存量债，不重复升级。 |
| 4 | Deferred | `key-modes.mjs` 294 行近 300 线（🔵）——本批不动（设计裁不拆）；下批再触该档优先拆分（permission/question/inject 三模态天然可分）。 |
| 5 | Deferred | F1 帮助文案「↑/↓ — Navigate input history」未含竖移语义（🔵）——设计 §9.5 变更点未含该项，未自行扩语义；建议后续批次补。 |
| 6 | Fixed | 注入框形态防御一致化（🔵）——`src/tui/clipboard.mjs:103` 改为 `p.chars ? [...p.chars] : []`（同 question 面先例，保文本不丢）；修后复跑双档 15/15 绿。 |

**fix round（1 项，已落地）**：`src/tui/clipboard.mjs:103` 形态防御统一（`[]` → `p.chars ? [...p.chars] : []`）；另修 `src/tui/key-modes.mjs:247` 注释别字（鉗→钳）。复跑：`node --test test/arrow-editing.test.mjs test/input-lock.test.mjs` → 15/15 绿；`check-syntax` 290 OK。

**呈父侧/设计者（本批边界外，未改）**：① 设计 §9.6 T-A8 括注修正（doc-side，见偏差披露）；② `docs/design/TUI.md` §1/§2/§4 回写 + `docs/TODO.md` 需求池登记（批次档 §2 已声明父侧事项）；③ F1 帮助文案（`key-handler.mjs:153`）未随 F11 更新；④ §1 不变量 4 与 inject/picker 分发序的权威侧裁定（存量）。

## §6 验证与收口（父代理自写）

**2026-09-12 06:15 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **15/15**（11 新 + 4 锁）· syntax 290 ✓ · 相邻面 23 pass；
- **抽核**：T-A8 = **33/27 字符**（括注已与公式自洽）✓ · 不变量 4 新序（`…interruptPrompt → picker 栈/wizard → 正常输入`）✓ · `TUI.md` 回写 461/294 ✓；
- 内部：审计 2 条 doc-side → 刷新轮 3/3（**独立复跑实证** + 实码实核裁定）；代码/测试零改（单源正确）。

### 逐条验收结论

- **AC-E1-1–10 全绿**；**Simplified 零 · Not done 零**；偏差如实（T-A8 数字失配——双复核实证后**修文档不修代码**，与单源公式自洽）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：8 档实测+回写 ✓ · 指针：设计 §9 ↔ 用例 ✓ · 待办：三项（下）✓

### 遗留项

1. **目标态标注翻转**：`TUI-INPUT-BOX.md:5/:42/:146`「目标态（实现待批准）」→ 已交付（父侧收口/指派）；
2. F1 帮助文案未随 F11 更新（后续批）；wizard 行回写已闭合（口径 = 并集——保留）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
