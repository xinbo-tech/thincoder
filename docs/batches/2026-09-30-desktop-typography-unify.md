# 2026-09-30 · 桌面排版统一
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 18:18 ∥ 18:20 桌面走查两条 + 18:23「开」：「①现在桌面端字体大大小小，间距也不一致……我希望能就用一种字体，一个字号，行间距字间距也都一样，不要大大小小参差不齐。除了markdown里标了的，我们自己用的字体也不要有粗体，只用颜色区分足够了。」「②markdown内容用的字体也应该基于我们系统选定的字体和字号，再在这个基础上做格式修饰，不要弄出一个完全跟系统没关系的独立体系来。」——父侧合并读法（用户已确认）：系统基线 = 一种字体 ∥ 一个字号 ∥ 行距字距一致 ∥ 自有文字无粗体（颜色区分）；markdown = 基线之上做格式修饰（不得自成独立体系）。需求已落：`docs/desktop/requirements/PROJECT.md` §4 **D29** + 变更记录。台账 #736（待讨论 ⇒ 本批点火）。。
> 台账 = #736（UI · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（需求落档 ✓（D29 + 变更记录）· 设计轮排队（eng-designer #3——等 #2 释放 RENDERER.md 域））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-09-30 18:18 ∥ 18:20 两条 + 18:23「**开**」。原话见本档头部；**射程 = 全链**（需求落档 → 设计 → 评审 → 批准 → 实施；路由判定 = **非轻通道**——跨全 UI 排版系统级）。

**定性**：**新需求**（排版基线从未立过——现状 = 各面字号 ∥ 字重 ∥ 字距各自为政）。用户读法（已确认，项目记忆在册）：① **系统基线** = 一种字体 ∥ 一个字号 ∥ 行距字距全一致 ∥ **自有文字零粗体**（强调只用颜色）——射程 = 桌面自有排版面（UI chrome ∥ 工具卡 ∥ 状态行 ∥ 面板 ∥ 自定强调样式）；② **markdown 内容 = 基于同一基线**（同字族同字号）+ 其上的**格式修饰层**（`**粗体**` ∥ 标题 ∥ 代码块等语义保留——**不得自成独立字体/字号体系**）。

**范围（本批）**：需求点 **1** 枚——桌面排版统一（D29）。设计必答：① **现状清点全表**（桌面全栈现有 font-family ∥ size ∥ weight ∥ line-height ∥ letter-spacing 使用面——逐档逐选择器）；② **统一值裁定**（基线字族 ∥ 字号 ∥ 行高 ∥ 字距——与既有 `--mono` ∥ 主题变量族对账）；③ **markdown 修饰层映射**（基线之上：`strong` ∥ 标题 ∥ 代码块 ∥ 引用等的修饰形——颜色优先；样式域 = 核件 markdown 渲染面 ∥ 桌面 CSS——**边界待勘**）；④ **落点**（CSS 变量单源 + 各面收敛——受影响档清单）；⑤ **验收** = 机检腿（computed-style 全栈扫描：唯一 font-size ∥ 自有面零 `font-weight > 400`）+ 真机走查（父侧跑）。

**边界**：功能 ∥ 布局 ∥ 块外边距零动（此处「间距」= **行距 ∥ 字距**，非块外边距——后者 = #712 ∥ #715 ∥ #716 ∥ #718 族已在案）；markdown 语义保留（只动「自成体系」部分）；不改 markdown 解析器行为。

**下一手**：设计轮（本档 §2）→ 评审 → 批准 → 实施。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（D29 排版统一 · 三档落点（PROJECT.md KD-57 §4.2 §6.1 T-DSK51 CV ∥ UI.md 本批注+三行指针 ∥ RENDER-CORE §5 块）· 清册 15 档 208 条 · 上抛 3（统一值 ∥ 修饰层读法 ∥ 核件消费面））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**排版统一批（D29）· 设计轮（initial）· eng-designer · 2026-09-30**——承 §1（用户 18:18 ∥ 18:20 两条 + 18:23「开」；需求 D29 + 变更记录已落——父侧笔）；本设计轮**产品码零触**（实施 = 实施舱）；全档坐标 = 本舱实读现值（as-of 2026-09-30）。

### 一、本批条目（覆盖）

| # | 条目 | 来源 | 状态 |
|---|---|---|---|
| 1 | **桌面排版统一**：系统基线 = 一种字体 ∥ 一个字号 ∥ 行距 ∥ 字距全一致 ∥ 自有文字零粗体（颜色区分）；markdown 内容 = 同基线 + 修饰层（不得自成独立字体/字号体系） | 需求档 `docs/desktop/requirements/PROJECT.md` §4 **D29**（`:174`）+ 变更记录（`:277`）；台账 #736；批档 §1 | 设计落 ✓（本段） |

- 本批**不含**：功能 ∥ 布局 ∥ 块外边距（含件级内边距）改动 · markdown 解析器行为 · 核件 ∥ VSC 侧改动 · 需求档笔（父侧）。
- 需求核对（设计前置）：D29 = 可机检判据（computed-style 全栈扫描：唯一字号 ∥ 自有面零 `font-weight > 400` ∥ 字族单值 ∥ 行高 ∥ 字距单值）+ 边界已明（markdown 语义保留；只动「自成体系」部分）⇒ **无需求缺口**（不上抛需求补件）。

### 二、设计档落点（判由 + D6 读回在盘）

| 档 | 落点 | 内容 |
|---|---|---|
| `docs/desktop/design/PROJECT.md` | §2 **KD-57**（新增 · 实读 `:100`）· §4.2 本批「现行 ⇒ 预期」块（实读 `:980` 起 · 十四行）· §6.1「排版统一批（验收面）」块（实读 `:1070` 起）· §7 **T-DSK51**（实读 `:1122`）· §10 **CV**（实读 `:1331`）· 变更记录（`- 2026-09-30（排版统一批（D29）…` 末条） | 决策（统一值 ∥ 零粗体 ∥ 修饰层口径 ∥ D21 关系 ∥ 核件零触 ∥ 回退配方 ∥ 边界 + 被否四候选）+ 受影响文件预算 + 验收回指 + 用例 + 登记 |
| `docs/desktop/design/UI.md` | §1「本批注（排版统一 · D29 · 2026-09-30）」（实读 `:585` 起 · 七项）+ 主题 ∥ 对话流 ∥ 输入区三行行内指针（实读 `:31` ∥ `:18` ∥ `:19`）+ 变更记录（末条） | 外壳面值面（基线四值 ∥ 零粗体颜色通道 ∥ 修饰层 ∥ 覆盖段 ∥ 收敛表 ∥ 判据 ∥ 边界） |
| `docs/render-core/design/RENDER-CORE.md` | §5「排版统一覆盖」块（实读 `:295` 起 · 逐面收正）+ ★上抛① 收正句 + 变更记录（末条） | 内容面值面（21 面逐面：面 1 ∥ 3 ∥ 6 ∥ 8 ∥ 9 ∥ 11 ∥ 12 ∥ 14 ∥ 18 ∥ 19 ∥ 21） |

- **落点判由（观察 · 报父侧核）**：§1 注记「设计轮排队（等 #2 释放 RENDERER.md 域）」——按板块归属实勘：排版 = **界面形态 ∥ 视觉值面**（UI.md 板块含「主题」；D21 ∥ D24 ∥ 扁平化 ∥ 间距诸前例皆落 UI.md + 核档 §5 值表），RENDERER.md = 实现工艺面（DOM ∥ 窗口 ∥ 滚动 ∥ 帧）——**排版不入 RENDERER.md**；本批对 RENDERER.md **零触**（#2 域提示与板块归属不符——按归属落点，请核）。
- 冻结窗检查（实读）：UI.md ∥ RENDER-CORE.md 无在飞冻结；PROJECT.md 有并行批（#734 重开批）未提交改动——本舱写入 = **追加式**（两批面不重叠：KD-57 居 KD-56 后 ∥ §4.2 块 ∥ §6.1 块 ∥ T-DSK51 ∥ CV）；如真撞 ⇒ 以父侧 ∥ 实施批对盘为准。
- **写回执（D6）**：三档落笔均单次批量原子成功；读回抽查 = KD-57 行 ∥ UI.md 本批注 ∥ 核档块三段在盘（上下文回显见落笔回执）。

### 三、统一值裁定（建议值 + 判由 · 与 `--mono` ∥ 主题变量对账）

| 通道 | 建议值 | 判由 | 被否 |
|---|---|---|---|
| 字族 | `--mono` 等宽栈（`--font: var(--mono)`） | 主阅读面（markdown ∥ 代码 ∥ 工具输出）已在案等宽（★上抛① 用户未否）；内容面转 sans ⇒ 码 ∥ 对齐面反损 + 须竖第二族（违「一种字体」）；「字距一致」在等宽下天然成立 | 统一系统 UI 栈（同上）；内容 ∥ 外壳两族并存（违 D29） |
| 字号 | **14px**（`--fs`） | = 现值 body ∥ 内容面同值（「系统选定字号」最简解——主阅读面零位移）；小字族（10 ∥ 11 ∥ 12 ∥ 13px）上收 + 大字形族（8 ∥ 15 ∥ 16 ∥ 18px）归位 | 13px（VSC webview 默认——主阅读面缩小）；12px（现状最多档——阅读面大幅缩小） |
| 行高 | **1.5**（`--lh`） | = 现值 body 值；内容面 1.55 ⇒ 1.5（微调对齐）；撤 1 ∥ 1.3 ∥ 1.4 ∥ 1.45 ∥ 1.6 ∥ 1.7 六值 | 1.55（markdown 现值——body 须随动，改面更大）；1.6（阅读更大但代码行距偏松） |
| 字距 | **0**（`--ls`） | 「字距一致」最简形；撤 0.3px ∥ 0.5px ∥ 0.04em 三处 tracking（uppercase 标签随归零） | 统一微字距（无用户指名 ∥ 全栈 tracking 反违「一样」） |

- **对账**：`--font` 与 `--mono` 同栈后 = **单族单值**（`--mono` 保留为族面命名 ∥ `--font` 指之——一名一实）；主题变量族其余（色 ∥ 尺寸 ∥ 圆角）零动。
- **零粗体**：自有面 `font-weight` 全 400（撤 500 ∥ 600 ∥ 700 三档——逐处 = §六清册）；强调 = 既有色位（零新色槽）。
- **回退配方**（用户否决统一值时）：`--font` 值复原系统 UI 栈 + 内容面族声明（`core-markdown.css` ∥ `core.css` ∥ `chat.css` 三档 `var(--mono)` 声明）改指 `var(--font)`——约 8 行、单次可回。

### 四、关键决策（含实施面裁定）

1. **核件零触 + 桌面覆盖段**：`thincoder-render-core/**`（`composer/composer.css` VSC 逐字锁 + 测试锁）∥ VSC 侧零改；核件消费面（输入面板 ∥ 模型菜单 ∥ 搜索条 ∥ `auto-confirm` 同位族）收敛 = `thincoder-desktop/renderer/chat-composer.css` 覆盖段（特征度提升选择器——沿扁平化覆盖先例，盒值 ∥ 描边零动）。
2. **落地形 = 值改 + 变量制**：收敛主体 = 既有规则内取值改（净增行 ≈ 0，除 `theme.css` 变量三行 + 覆盖段一处）；`--fs` ∥ `--lh` ∥ `--ls` 三变量 = 唯一字号 ∥ 行高 ∥ 字距源（`--font` 指 `--mono` = 唯一族源）。
3. **markdown 修饰层读法（T1）**：基线 = 正文（族 ∥ 号 ∥ 行高）；修饰 = 相对（em）或非尺度通道——**绝对 px 岛清零**；相对修饰保留（语义 = 用户「除了 markdown 里标了的」）——**待核准 = 上抛②**。
4. **在飞面判定**：排版值面与他批（#734 ∥ 已核销的 #712 ∥ #715 ∥ #716 族）零射程重叠；清册现值以 as-of 实读为准。
5. **测试面**：批内件两档（源扫描 + 真机 computed 扫描——随批留存 · 不进仓套件）；真机走查 = 父侧（D16 义务）。**in-line 样式面 = 零**（`renderer/**/*.mjs` ∥ `src/**` 全树零 `fontSize` ∥ `fontFamily` ∥ `font-weight` 内联 ∥ 零 `setProperty` 字面——grep 实读）；**核件注入面** = 三静态档（`composer/composer.css` ∥ `composer/model-menu.css` ∥ `search.css`——经 `mount-composer.mjs:199-200` 注 `<link>` ∥ `index.html:21` `/rc/search.css`）+ 注入 DOM 的核构件（样式全经桌面 `core.css` ∥ `core-markdown.css` 映射）。

### 五、上抛（3）

- **U1 · 基线统一值（字族 + 字号）**：建议 = `--mono`（等宽栈）+ 14px（判由 = §三）——**观感变化最大一项**（全 UI 转等宽）；否决 ⇒ 回退配方（§三末）。请用户 ∥ 批准面裁。
- **U2 · markdown 相对修饰读法**：建议 = 保留相对 em 修饰（标题 1.3–0.9em ∥ 码 0.9 ∥ 0.88em ∥ 表 0.9em——「基线 + 修饰」）；备选 = 全压平至基线字号（标题仅以粗体区分）。请裁（影响内容面观感）。
- **U3 · 核件消费面纳入**：建议 = 纳入（输入面板 ∥ 模型菜单 ∥ 搜索条经覆盖段收基线——核件零触）；若判越「桌面自有」射程 ⇒ 撤覆盖段（一处删）。请裁。

### 六、现状清点全表（as-of 2026-09-30 实读——15 档 · 208 条 font 声明逐档逐选择器；「⇒」后 = 收正目标）

**口径**：现状 = 声明现值（`file:line` 为实读坐标）；目标：`fs` = `var(--fs)`（14px）∥ `lh` = `var(--lh)`（1.5）∥ `ls` = 0 ∥ `400`；**内联样式面 = 零**（实读）；**核件注入面 = 三静态档 + 注入口两处**（见 §四-5）。

**A · 桌面自有档（11 档 · 值改为主）**：

- **theme.css（89）**：`:20` `--font` ⇒ `--mono` 栈指（`var(--mono)`）；`:87` body `font: 14px/1.5 var(--font)` ⇒ `var(--fs)/var(--lh) var(--font)` + `letter-spacing: var(--ls)`；新增 `--fs: 14px` ∥ `--lh: 1.5` ∥ `--ls: 0`。
- **chrome.css（269）**：`.session-project` 12px/`lh:1`（`:78-79`）⇒ fs/lh；`.session-title` 13px/500（`:117-118`）⇒ fs/400；`.session-arrow` 8px（`:125`）⇒ fs；`.session-new` 18px/`lh:1`（`:143-144`）⇒ fs/lh；`.auto-confirm-text` 13px（`:179`）⇒ fs；`.status-bar > [data-seg]` 12px（`:227`）⇒ fs；`.status-alert` 12px（`:244`）⇒ fs；`.status-goal` 12px（`:254`）⇒ fs；`.boot-reason` 13px（`:266`）⇒ fs。
- **session-list.css（169）**：`.session-item-title` 13px/500（`:55-56`）⇒ fs/400；`.session-item-meta` 11px（`:68`）⇒ fs；`.session-item-badge` 12px（`:83`）⇒ fs；`.session-rename`/`.session-delete` 12px（`:107-108`）⇒ fs。
- **chat.css（350）**：`.block-error` 12px/`lh:1.45`（`:71-72`）⇒ fs/lh；`.error-text` 12px（`:77`）⇒ fs；`.block-tool` 12px（`:93`）⇒ fs；`.tool-head [data-seg="name"]` 600（`:127`）⇒ 400；status ∥ time ∥ summary 11px（`:139`/`:143`/`:147`）⇒ fs；`.tool-changes` 12px（`:166`）⇒ fs；`.tool-file` 12px（`:173`）⇒ fs；`.tool-result` 11px/`lh:1.45`（`:185-186`）⇒ fs/lh；`.chat-summary` 12px（`:201`）⇒ fs；`.msg-label` 14px/700（`:244-245`）⇒ fs/400；`.msg-time` 11px（`:260-261`）⇒ fs；`.chat-pending-label` 12px/600（`:277-278`）⇒ fs/400；`.chat-pending-item`/`-more` 12px（`:283`）⇒ fs；digest 三行 11px（`:305`/`:315`/`:332`）⇒ fs。
- **chat-cards.css（152）**：`.permission-prompt` 12px/`lh:1.5`（`:44-45`）⇒ fs/lh；`.question-card` 14px-var/`lh:1.5`（`:81-82`）⇒ fs/lh；`.question-card .perm-btn` 14px-var（`:85`）⇒ fs；`.question-input` 14px-var（`:89`）∥ 12px（`:122`）⇒ fs；`.question-mark` 700（`:93`）⇒ 400。
- **chat-fixes.css（118）**：`.error-details summary` 11px（`:16`）⇒ fs；`.error-details pre` 11px（`:24`）⇒ fs；`.error-retry-btn` 11px（`:35`）⇒ fs；`.chat-ledger` 11px（`:45`）⇒ fs；`.compress-status` 11px（`:56`）⇒ fs；`.diff-preview` 12px/`lh:1.5`（`:79-80`）⇒ fs/lh；`.diff-header` 11px（`:84`）⇒ fs；`.welcome-heading` 15px/600（`:108-109`）⇒ fs/400；`.welcome-text`/`-shortcuts` 12px/`lh:1.7`（`:114-115`）⇒ fs/lh。
- **core-markdown.css（191）**：正文两族 `font-family: var(--mono)`/14px/`lh:1.55`（`:15-17`）⇒ `var(--font)` 指/fs/lh；标题 h1–h6 1.3–0.9em + 700∥600（`:35-40`）⇒ **保留**（修饰）；`li lh:1.5`（`:51`）⇒ `var(--lh)`；code 0.9em（`:70`）⇒ **保留**；`.code-lang` 10px（`:93`）⇒ fs；代码体 0.88em/`lh:1.5`（`:108-109`）⇒ 0.88em/**lh**；表 0.9em（`:131`）⇒ **保留**；`th` 600（`:147`）⇒ **保留**；`strong` 700（`:162`）⇒ **保留**。
- **core.css（332）**：`.reasoning-block` 12px（`:30`）⇒ fs；`.reasoning-summary` 12px（`:37`）⇒ fs；`.reasoning-content` 12px/`lh:1.45`（`:52-54`）⇒ fs/lh；推理内 h1-h3 700（`:69`）⇒ 保留（修饰）；`.code-copy-btn` 11px（`:118`）⇒ fs；`.advisor-block` 12px（`:135`）⇒ fs；`.advisor-block summary` 12px/500（`:143-144`）⇒ fs/400；`.advisor-content` 11px（`:154`）⇒ fs；`.sub-desc` 10px（`:160`）⇒ fs；`.sub-stop-btn` 12px/`lh:1.4`（`:178-179`）⇒ fs/lh；`.sub-tail` 11px（`:195`）⇒ fs；`.sub-follow-btn` 11px/`lh:1.6`（`:213`）⇒ fs/lh；`.perm-btn` 11px/600（`:226-227`）⇒ fs/400；`.panel-desc` 10px（`:255`）⇒ fs；`.task-mark` 14px（`:270`）⇒ fs（同值）；`.task-status` 10px/`ls:0.3px`（`:285-288`）⇒ fs/0；`.goal-label` 10px/`ls:0.5px`（`:295-297`）⇒ fs/0；`.goal-value` 12px/`lh:1.45`（`:302-303`）⇒ fs/lh；`.goal-status-badge` 10px/600（`:310-311`）⇒ fs/400；`.ledger-line` `lh:1.5`（`:323`）⇒ `var(--lh)`。
- **pool.css（113）**：`.pool-title` 600（`:29`）⇒ 400；`.pool-read` 12px（`:33`）⇒ fs；`.activity-new-btn` 11px/`lh:1.4`（`:70-71`）⇒ fs/lh；`.pool-family-label` 12px/`ls:0.04em`（`:82-83`）⇒ fs/0。
- **settings.css（294）**：`[data-slot="settings"]` `14px/1.5 var(--font)`（`:24`）⇒ 变量引用；`.settings-title`/`.wizard-title` 16px（`:55`）⇒ fs；`.settings-close::before`/`.wizard-dismiss::before` `lh:1`（`:102`）⇒ lh；`.settings-section-title` 12px/`ls:0.04em`（`:129-130`）⇒ fs/0；`.settings-row-name` 600（`:157`）⇒ 400；`.settings-mark` 12px（`:169`）⇒ fs；`.settings-readonly-hint` 12px（`:217`）⇒ fs；`.wizard-step` 12px（`:230`）⇒ fs；`.wizard-step[data-current]` 600（`:234`）⇒ 400；`[data-slot="info"]` 12px（`:252`）⇒ fs；`.info-title` 600（`:261`）⇒ 400。
- **skin.css（13）**：零字面（零改）。
- **index.html（55）**：零改（链序零动）。

**B · 核件消费面（3 档 · 只读不改——收正走覆盖段）**：

- **composer/composer.css（481）**：`#paste-bar` 11px（`:39`）· `.paste-toast` 11px（`:54`）· `.paste-chip` 12px（`:72`）· `.paste-chip-del` 10px（`:78`）· `#input` `font-size: inherit`/`lh:1.45`（`:94`/`:99`）· `#send-btn`/`#abort-btn` 12px/600（`:112-113`/`:151-152`）· `#attach-btn` 12px/600（`:168-169`）· `.ctrl-btn` 12px/`lh:1.3`（`:196`/`:205`）· `#reasoning-btn` 11px/`ls:0.5px`（`:255`/`:258`）· dropdown 族 12px/11px（`:281`/`:295`/`:302`/`:314`/`:325`/`:381`）· `.at-file-name` 600（`:392`）· `.at-file-path` 11px（`:397`）· `.auto-confirm-text` 12px/`lh:1.5`（`:441-442`）· `.auto-confirm-yes`/`-no` 12px/600（`:458-459`）⇒ 覆盖段收基线。
- **composer/model-menu.css（46）**：`.mm-panel` 12px（`:17`）· `.mm-sub` 11px（`:25`）· `.mm-manage` 11px（`:29`）· `.mm-flyout` 12px（`:34`）· `.mm-filter` 12px（`:41`）⇒ 覆盖段收基线。
- **search.css（59）**：`#search-input` 12px（`:26`）· `#search-count` 11px（`:32`）· `#search-bar button` 12px（`:41`）⇒ 覆盖段收基线。

**C · 覆盖段（新增 · chat-composer.css）选择器清单**（特征度提升形；逐条 = 同锚下取字号 ∥ 字重归基线，行高声明归 `var(--lh)`）：`.composer #paste-bar` ∥ `body .paste-toast` ∥ `.composer .paste-chip` ∥ `.composer .paste-chip-del` ∥ `.composer #input`（`font-family: var(--font)` ∥ fs ∥ lh）∥ `.composer #send-btn` ∥ `.composer #abort-btn` ∥ `.composer #attach-btn` ∥ `.composer .ctrl-btn` ∥ `.composer #reasoning-btn` ∥ `.composer .dropdown-item` ∥ `.composer .dropdown-item .check` ∥ `.composer .dropdown-item .dropdown-sub` ∥ `.composer .dropdown-item .submenu-arrow` ∥ `.composer .dropdown-manage` ∥ `.composer #at-dropdown .dropdown-item` ∥ `.composer .at-file-name` ∥ `.composer .at-file-path` ∥ `body .auto-confirm-text` ∥ `body .auto-confirm-yes` ∥ `body .auto-confirm-no` ∥ `body .mm-panel` ∥ `body .mm-flyout` ∥ `body .mm-row .mm-sub` ∥ `body .mm-manage` ∥ `body .mm-filter` ∥ `#toolbar #search-input` ∥ `#toolbar #search-count` ∥ `#toolbar #search-bar button`。
（落笔 = 实施舱——本清单为设计定向；选择器合并 ∥ 注释随实施。）

### 七、markdown 修饰层映射（基线 + 修饰 · 具体形）

| 元素 | 基线 | 修饰（保留） | 判由 |
|---|---|---|---|
| 正文 p ∥ 段距 | 族 ∥ fs ∥ lh ∥ ls 全基线 | — | D29「同字族同字号」 |
| `strong`（`**粗体**`） | — | 700（**豁免**——markdown 标记） | 用户「除了 markdown 里标了的」 |
| `em` ∥ `s` | — | italic ∥ line-through + opacity 0.7 | 非尺度通道 |
| 标题 h1–h6 | — | em 相对（1.3 ∥ 1.15 ∥ 1.05 ∥ 1 ∥ 0.95 ∥ 0.9）+ 700∥600 + 边距 | 「基于基线 + 修饰」；**相对 = 派生非独立**——待核准 = 上抛② |
| 行内码 ∥ 代码体 | — | 0.9em ∥ 0.88em（相对）+ 盒 ∥ 色（VSC 盒值） | 同上 |
| 语言条 | **fs**（10px ⇒ 基线——绝对岛清零） | 色 ∥ 底边线 | 自有件非 markdown 标记 |
| 代码块壳 ∥ 引用 ∥ 表 ∥ 分隔线 ∥ 勾选框 | 盒 ∥ 色 ∥ 结构零动 | 表 0.9em 相对 ∥ `th` 600；引用 border+底 | 语义保留 |
| 推理摘要 ∥ 推理内容 ∥ 复制钮 | **fs**（12 ∥ 12 ∥ 11px ⇒ 基线）；推理 `lh` ⇒ `var(--lh)` | 色 ∥ opacity | 自有件 |
| 块壳 ∥ 工具卡 ∥ 卡族件 | fs + 400（去粗）+ lh | 色 ∥ 底 ∥ 边框 | 自有面 |

### 八、边界（不做）

- 功能 ∥ 布局 ∥ 块外边距（含件级内边距——`8px 0` ∥ `6px 10px` 族）零动（「间距」射程 = 行距 ∥ 字距）；markdown 解析器行为零动；markdown 语义保留（只动「自成体系」部分）。
- 核件（`thincoder-render-core/**`）∥ VSC（`thincoder-vscode/**`）零改；零通道 ∥ 零词键 ∥ 零 JS（纯 CSS 值面 + 三变量 + 一覆盖段）。
- 「终端风格」大改（#710）仍在搁置（本批 = 排版一刀，不并其他换皮面）。

### 九、受影响文件与测试面

（与 `docs/desktop/design/PROJECT.md` §4.2 本批块同源——十四行：12 档 CSS/HTML + 测试面 + 设计档；`chat-composer.css` **70 ⇒ ≈100** = 唯一净增档（覆盖段）；`theme.css` **89 ⇒ ≈95**（变量三行 + 注）；余档净 ±0。）

**观察（报父侧）**：① §4.1 记 `chat-composer.css` **48**（实读 **70**——在册漂移 #713 族，本批以实读为准）；② §6.1 表头「功能点 D1–D27」未随 D28 ∥ D29 收正（存量漂移——本批零触）。

**测试面**：① 源扫描腿 = `docs/batches/2026-09-30-desktop-typography-unify.test.mjs`（拟新增 · 平 node）；② 真机 computed 扫描腿 = `docs/batches/2026-09-30-desktop-typography-unify-probe.mjs`（拟新增 · 真 Electron）；随批留存 · 不进仓套件（全清令）；真机走查 = 父侧真跑闭合（D16 义务）。

**机检判据（二腿 · 具体形）**：

- **源扫描腿**（平 node · 输入 = 12 档 CSS 文本）：① 全档 `font-size` 声明 ∈ {`var(--fs)`} ∪ 白名单（`core-markdown.css` ∥ `core.css` 内 em 修饰选择器集——标题 h1–h6 ∥ code ∥ `.code-block code` ∥ table；**零 px/rem 字面**）；② 全档 `font-weight` ≤ 400 ∪ 白名单（`strong` ∥ h1–h6 ∥ `th`）；③ `theme.css` 三变量在位（`--fs: 14px` ∥ `--lh: 1.5` ∥ `--ls: 0`）∧ `--font` 指 `var(--mono)`；④ `chat-composer.css` 覆盖段选择器清单在位（§六-C）；⑤ `letter-spacing` 声明仅 `theme.css` 基面一处（`var(--ls)`）——余零；⑥ `line-height` 声明 ∈ {`var(--lh)`} ∪ 白名单；⑦ 负面锁：`thincoder-render-core/**` ∥ `thincoder-vscode/**` 零 diff。
- **真机 computed 扫描腿**（真 Electron——启动 ⇒ `page.evaluate` 全元素 `getComputedStyle`）：① 亮 ∥ 暗两模式，除白名单（修饰面 selector 集 + 期望计算值：h1 18.2px ∥ h2 16.1 ∥ h3 14.7 ∥ h4 14 ∥ h5 13.3 ∥ h6 12.6 ∥ code ≈12.6 ∥ code-block ≈12.32 ∥ table 12.6——**若 U2 裁「全压平」⇒ 白名单与期望值同拍改基线**）外，全文本元素 `font-size === 14px`；② `font-weight <= 400`（白名单除外）；③ `font-family` 首项 = `ui-monospace`；④ `line-height === 21px`；⑤ `letter-spacing === "normal"`；⑥ 覆盖面在场性：真开模型菜单 ∥ 搜索条（Ctrl+F）∥ 设置 ∥ 向导后同扫（含核件消费面）；⑦ 读数表落盘（`…-readings.json`——随批留存）。

### 十、验收对照（D29 ⇄ 腿 ⇄ 落点）

| D29 判据句 | 验收腿 | 落点 |
|---|---|---|
| 一种字体 | 源①③ ∥ 真机③ | `theme.css` + 全档族声明 + 覆盖段 |
| 一个字号 | 源① ∥ 真机① | 全档 + `--fs` |
| 行距 ∥ 字距全一致 | 源⑤⑥ ∥ 真机④⑤ | 全档 + `--lh`/`--ls` |
| 自有文字零粗体（颜色区分） | 源② ∥ 真机② + 走查（色位可见性） | 全档 + `docs/desktop/design/UI.md` §1 本批注项 2 色位表 |
| markdown 基于同一基线 | 源①（正文 ∥ 内容面族 ∥ 号）∥ 真机① | `core-markdown.css` ∥ `core.css` |
| markdown 修饰层（不得自成独立体系） | 源①白名单 ∥ 真机①白名单 + 走查（修饰可辨） | `docs/render-core/design/RENDER-CORE.md` §5 块 |
| 边界（功能 ∥ 布局 ∥ 块外边距零动；语义保留） | 走查对照（改前 ∥ 改后截图）+ 源⑦ | §八 ∥ 本表 |

- **三链同源核对**：需求 D29（§4）⇄ 本档（§一 ∥ §十）⇄ 设计档（`docs/desktop/design/PROJECT.md` §2 KD-57 ∥ `docs/desktop/design/UI.md` §1 本批注 ∥ `docs/render-core/design/RENDER-CORE.md` §5 块）——同源 ✓。
- **真机走查项（父侧跑）**：亮 ∥ 暗两模式逐面（会话流（含 md 修饰五件：粗体 ∥ 标题 ∥ 代码块 ∥ 引用 ∥ 表格）∥ 工具卡（流式 ∥ 折叠 ∥ 结果）∥ 状态行 ∥ 池 ∥ 设置 ∥ 向导 ∥ 输入区 ∥ 搜索条 ∥ 模型菜单）∥ 两态对照（改前 ∥ 改后）。

### 落点坐标勘误 + 读回回执（本舱同轮补记 · 2026-09-30）

① **坐标勘误**：二、落点表 `T-DSK51` 的 `:1122` ⇒ **实读 `:1148`**（后续块插入致位移）——现行 as-of 坐标全列：KD-57 **`:100`** ∥ §4.2 本批块 **`:980` 起**（十四行）∥ §6.1 批注块 **`:1070` 起** ∥ **T-DSK51 `:1148`** ∥ **CV `:1331`**；UI.md 本批注 `:585` 起（七项）∥ 主题 `:31` ∥ 对话流 `:18` ∥ 输入区 `:19`；核档 §5 覆盖块 `:295` 起。
② **读回（D6）**：三档落点全文实读抽查 ✓（落笔回执 + 独立复读两轮）；行宽收正两处（UI.md `:587` 332 字符 ⇒ 拆行；`docs/desktop/design/PROJECT.md` §6.1 块机检面句 426 字符 ⇒ 拆行——皆 ≤300）。
③ **同轮随手收正（一致性面 · 逐条报告）**：核档 §5 旧「★上抛①」段（原「单点回退 = 删该行」配方已失效）⇒ **删净**（现行 = 覆盖块末条）；`docs/desktop/design/PROJECT.md` §10 **AM** 行处置列收正 ⇒「已收正（2026-09-30 · 排版统一批（D29））」+ 新回退配方指针。**零新语义**（坐标 ∥ 行宽 ∥ 形面收正）。
④ **观察（报父侧 · 非本批）**：`docs/desktop/design/PROJECT.md` §4.1 记 `chat-composer.css` **48**（实读 **70**——在册漂移 #713 族）；§6.1 表头「功能点 D1–D27」未随 D28 ∥ D29 收正（存量漂移）；核档 §5「落点与预算」句现读 2026-09-29（值列旧——他批在册）。

### 评审后修复轮（fix · eng-designer · 2026-09-30）——承 §3 轮次 1

**来源** = 本档 §3 轮次 1（advisor id=15 · pass：0🔴 ∥ 4🟡 ∥ 3🔵）；🟡3 = 父侧同刻已收正（D1–D29 六处书证——本舱零动作）；本舱处置 **#1 ∥ #2 ∥ #4 ∥ #5 ∥ #6 ∥ #7** 六号 + 附项。**产品码零触 · 机制本体零改**（仅收正矛盾 ∥ 指针 ∥ 处置句）——落点全在设计面（三档）。

- **#1 值对账（按现盘实读同拍）**：现盘实读（2026-09-30 · `split("\n")`−1 口径）——`chat-composer.css` **70** ∥ `chrome.css` **269** ∥ `session-list.css` **169** ∥ `chat.css` **350** ∥ `core.css` **331**；§4.1 表与 §4.2 块已同值（评审引 48 ∥ 268 ∥ 170 = 旧读——按现盘披露零改）；收正两处 = `docs/desktop/design/PROJECT.md:322`（chat.css 越层段 **329 ⇒ 350**）∥ `:326`（core.css 越层段 **332 ⇒ 331**）；§4.2 块同拍 = `:986`（**331 ⇒ 331**）∥ `:987`（350 在盘）。
- **#2 字距二值定音 = `--ls: normal`**（二择取「与判据同字」案——computed 同形）：判据两处零改原样成立（§6.1 D29 块 `:1072` ∥ T-DSK51 `:1149` ∥ 真机腿 `letter-spacing = normal`）；**落位写明** = `body` 面 `letter-spacing: var(--ls)` 独立一行（`font` 简写不载字距——全栈唯一声明点；三处 tracking 撤除，余档零声明）。改点 = `PROJECT.md:100`（KD-57 题 ∥ ①）∥ `:984`；`docs/desktop/design/UI.md:589`（本批注项 1——落位句 `:590`）∥ `:606` ∥ `:607` ∥ `:608`；`docs/render-core/design/RENDER-CORE.md:296`。**本段前文 §三 :53 ∥ §六 :79 ∥ §九 :131 各「0」读法以此为准**。
- **#4 被替代值表收正三处**：① `UI.md:154`（D21 注项 2 表后收正指针——行 4 ∥ 5 ∥ 6 字号 ∥ 字重被基线接管）；② `RENDER-CORE.md:246` 律 2 加「排版通道限定」（「字号比例」枚举被 D29 接管）；③ `RENDER-CORE.md:278` 面 7 加注（`border-radius: 6px ⇒ 0`——扁平化收正；推理内残留观察在册）。
- **#5 越层处置句**：`PROJECT.md:986` ∥ `:987` 各补「越 300 在册 ⇒ 本批触碰 = 行级小修（非结构性）⇒ 消解窗口顺延」；core.css 331 同拍（见 #1）。
- **#6 计数收正**：`UI.md:611` ∥ `PROJECT.md:996`「12 档 CSS」⇒「**11 档 CSS + `index.html` 骨架**」；本段 §九 :131 同判据追认（读法 = 11 档 CSS + `index.html`）。
- **#7 上抛②指针**：`PROJECT.md:1332` **CV** 行补 ③（待核准在册——相对 em 保留建议 ∥ 全压平备选 ∥ 裁定面 = 批准；「二件」⇒「三件」）。
- **附项（RENDER-CORE §3）**：行 23（`:108`）「端模式钮（桌面会话头自持）」⇒ 收正为「桌面端面自持——模式钮住输入区控件行 ∥ 四态呈现 = 状态行行首 banner 四段（撤会话头批后收正）」；行 26「桌面首启向导自持」实读现行（零改）；**提示坐标 `:18/:24` 与现盘不符**——行 18 ∥ 24（`input.js` ∥ `model-menu.js`）无涉，实盘唯一残留 = 行 23（披露）。
- **读回（D6）+ 机检对账**：三档改后逐处复读 ✓；`node scripts/doc-check.mjs --root .` 对账 = **零新增**（行宽 FAIL 169 ∥ 悬空 59——与基线同值；改笔行宽逐行模拟过 ≤300）。
- **残留（2）**：① `RENDER-CORE.md` §5 面 5 ∥ 6 ∥ 15（+面 7 推理内残留）同族圆角值 vs 扁平化「代码块族归零」= 同相抵状态（评审归「扁平化批随动面」——本舱只注面 7，余面列报）；② KD-57 ④「盒值仍随 VSC」与扁平化批归零的现实张力（KD-57 本体零改——若判收正归后续轮 ∥ 扁平化批域）。

### 实施后收正轮（fix · eng-designer · 2026-09-30）——承 §5 残留（2）

**来源** = 本档 §5 残留（2）（实施舱披露 + §5 决策表 #4）；本舱处置 **① ∥ ②** 两号——**产品码零触 · 机制本体零改**，落点全在设计面（`docs/desktop/design/PROJECT.md` ∥ `docs/desktop/design/UI.md` ∥ `docs/render-core/design/RENDER-CORE.md` 三档）。

- **① `select` 本体行高豁免落档**：§九 **真机腿 ④** 判据句补平台豁免——**现行读法（本块为准）= `line-height === 21px`（`select` 本体除外）**：Blink 把 `select` 本体 computed `line-height` 固定 `normal`（内联 ∥ 表则 ∥ `!important` 均不可达——页面 CSS 不可承载）；同壳 `option` ∥ `input` ∥ `button` 可控已归基线。
  证据 = 批内件读数 `selectExemption` 段（`docs/batches/2026-09-30-desktop-typography-unify-readings.json:236`——`before` ∥ `inline` ∥ `inlineImportant` 三路皆 `normal`；同壳 `option` = `21px`）；同句落位（实读定位 · 4 处）：
  - `docs/desktop/design/PROJECT.md:1085`（§6.1 批注块 ②——同句原位）；
  - `docs/desktop/design/PROJECT.md:1162`（§7 **T-DSK51** ④——实读第二命中；派单「§2 邻」处零命中〔KD-57 = 值面，无该判据句〕）；
  - `docs/desktop/design/UI.md:611`（§1 本批注项 6——真机腿判据行）；
  - `docs/render-core/design/RENDER-CORE.md:307`（§5 覆盖块尾——新增豁免注）。
- **② §六-C 搜索条三锚收正**：原 `#toolbar #search-input` ∥ `#toolbar #search-count` ∥ `#toolbar #search-bar button` ⇒ **现行读法 = `#search-bar #search-input` ∥ `#search-bar #search-count` ∥ `body #search-bar button`**；
  判由 = 核 `thincoder-render-core/search.mjs:141`（`toolbar.parentNode.insertBefore(bar, toolbar)`）⇒ `#search-bar` = `#toolbar` **前兄弟节点**（桌面 `#toolbar` 由装配期赋值）；实盘同形 = 覆盖段实码（`thincoder-desktop/renderer/chat-composer.css:97-99`）∥ 批内件期望锚同形（`docs/batches/2026-09-30-desktop-typography-unify.test.mjs:204-206`）。
- **读回（D6）**：三档改后逐处复读 ✓；`node scripts/doc-check.mjs --root .` 对账 = 零新增（行宽 FAIL 172 ∥ 悬空 60——与基线同值；改笔行宽逐行模拟过 ≤300）。
- **残留**：**0**（两号全闭）；前轮遗留（圆角随动面 ∥ KD-57 ④ 张力）= 另轮在册——本轮零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · #736 桌面排版统一（D29）** · 对象 = `docs/desktop/design/PROJECT.md` ∥ `docs/desktop/design/UI.md` ∥ `docs/render-core/design/RENDER-CORE.md`（declaration：design · 待评审）

限制：无项目标准档 ∥ 无文档地图（口径 7 降级——按 Project Guide 判）；未读评审范围外文件（批档 §2 未读 ⇒ 判据白名单 ∕ 清册内容未核）；行数对账按档内 §4.1 单源（声明的行数预算单源）。

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 受影响文件（口径 8） | 🟡 | §4.2 D29 块「现行」值与本档 §4.1 单源不一致四处：`chat-composer.css` 48（§4.1 :304）↔ 70（D29 块 :994）；`chrome.css` 268（:214）↔ 269（:989）；`session-list.css` 170（:215）↔ 169（:990）；`chat.css` 越层段 329（:322）↔ 350（:217 ∥ D29 块 :987） | 以 §4.1 为准逐行对账收正（或按届盘实读同拍收正两处）+ 越层段 chat.css 值同拍 |
| 2 | 验收判据（口径 5） | 🟡 | 字距二值互斥：`--ls` = 0（KD-57 ① :100 ∥ UI.md 本批注项 1 :587）∥ 验收期望 `letter-spacing = normal`（§6.1 D29 块 :1072 ∥ T-DSK51 ④ :1149）；且 `--ls` 的消费落位未点名（`font` 简写不载 letter-spacing——「简写取三变量」只可载 `--fs` ∕ `--lh` ∕ `--font`） | 二择一收正（`--ls: normal` 或判据改 `0px`）+ 写明 `--ls` 落位规则 |
| 3 | 文档状态（D 号书证） | 🟡 | 档头 ∥ §6.1 表头仍 D1–D27（本档 :6 ∥ :1015；UI.md :4）——未随 D28 ∥ D29 收正（违 §10 AN :1269「D 号诸处同改」口径；D29 批块档面随动清单未列此项） | 范围内三处同笔收正为 D1–D29（同族书证 IPC ∥ RENDERER ∥ SHELL :4 = 范围外，见注） |
| 4 | 文档状态（被替代值表未收正） | 🟡 | D21 系值表未随后续批就地收正 ∕ 加指针：① UI.md :147-149（D21 项 2 表行 4 ∕ 5 ∕ 6——13px ∥ 500 ∥ 11px ∥ 12px）已被 D29 替代；② RENDER-CORE :246 律 2「字号比例」枚举未随 D29 收正（仅 21 面表本体经 :295 覆盖块总句收正）；③ RENDER-CORE :278 面 7 `border-radius: 6px` 与 UI.md :475 扁平化「代码块族圆角归零」相抵（KD-57 ④「盒值仍随 VSC」边界句的现实偏差） | 三处就地加收正指针（沿既有先例）；③ 另涉扁平化批随动面 |
| 5 | 受影响文件（越层处置） | 🔵 | `core.css`（332）∥ `chat.css`（350）两越 300 档本批以值改触碰——批块未写处置句（按在册口径 = 行级小修 ⇒ 消解窗口顺延） | 两行各补一句处置句（避免误读为拆分窗口） |
| 6 | 计数 | 🔵 | 「12 档 CSS 源判据」（UI.md :608 ∥ 本档 :996）与批块文件表（11 CSS 档 + index.html）不符——第 12 档未点名 | 点名第 12 档或改「11 档 CSS + 骨架」 |
| 7 | 上抛登记面 | 🔵 | 上抛②（markdown 相对修饰值读法待核准）仅住批档 §2；本批 §10 CV（:1332）只列两件——设计档 §10 无该待决项行 | §10 或 UI.md 本批注补一行指针 |

计数：🔴 0 · 🟡 4 · 🔵 3（共 7）

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30）**：依据 = 用户 18:28「自动跑完」授权 + **设计评审通过**（0🔴 ∥ 4🟡 ∥ 3🔵——六号 + 附项全采纳、修复轮落定于 §2 修复轮块 `:156-168`〔父侧核验 ✓〕）。

**实施舱**：eng-coder（单舱 · 设计Token 已签发——值不入档）。**实施范围** = §2 落点表：统一值变量单源（`thincoder-desktop/renderer/theme.css`——`--font: var(--mono)` ∥ `--fs: 14px` ∥ `--lh: 1.5` ∥ `--ls: normal`〔落位 = `body` 面独立 `letter-spacing` 行〕）+ 12 档收敛（外壳面 ∥ 内容面 21 面——值改零增行）+ 核件消费面覆盖段（`chat-composer.css`）+ **自有文字零粗体**（颜色通道强调）+ 绝对 px 岛清零。

**验收** = §2 机检两腿（源扫描 + 真机 computed 全栈扫描）+ §7 **T-DSK51** 真机走查（父侧闭合）。**显性提点**：基线值 = `--mono` + 14px（字距 `normal`）；回退配方 = KD-57 ⑥。

**残留登记（同拍）**：① `RENDER-CORE.md` §5 面 5 ∥ 6 ∥ 15 圆角值同族 = 扁平化批随动面（评审判入——另轮）；② KD-57 ④「盒值仍随 VSC」与扁平化归零的现实张力 = 在册（另轮）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（两腿绿（源 9/9 ∥ 真机 0 违规）· 审计 DEVIATIONS 0🔴 ∥ 评审 pass 0🔴 —— 残留 2（判据句 select 豁免落档 ∥ §六-C 三锚收正））



**排版统一批（D29）· 实施轮（initial）· eng-coder · 2026-09-30**——承 §2（评审通过 + §4 代签 / 修复轮落定）；本舱改动 = `thincoder-desktop/renderer/**` 11 档 CSS（值改 + 变量 + 覆盖段）；`index.html` ∥ `skin.css` 零改；核件 ∥ VSC 侧零触（负面锁在盘）；批内件两档 + 读数 json 随批留存。

### 一、落地面（实读行数终值 · 供 §4.2 同拍）

| 档 | 行数（实读） | 改动面 |
|---|---|---|
| `theme.css` | 89 ⇒ **96** | 基线四值（`--font: var(--mono)` ∥ `--fs: 14px` ∥ `--lh: 1.5` ∥ `--ls: normal`）+ body `font: var(--fs)/var(--lh) var(--font)` + `letter-spacing: var(--ls)` 独立行 |
| `chrome.css` | 269 ⇒ 269 | 9 处值改（12 ∥ 13 ∥ 8 ∥ 18px ⇒ `var(--fs)`；500 ⇒ 400；`lh:1` ×2 ⇒ `var(--lh)`） |
| `session-list.css` | 169 ⇒ 169 | 4 处值改（13px/500 ⇒ `var(--fs)`/400；11 ∥ 12px ⇒ `var(--fs)`） |
| `chat.css` | 350 ⇒ 350 | 17 处值改（11 ∥ 12 ∥ 14px ⇒ `var(--fs)`；lh 1.45 ⇒ `var(--lh)`；600 ∥ 700 ⇒ 400） |
| `chat-cards.css` | 152 ⇒ **155** | 值改（12px ∥ 14px-var ⇒ `var(--fs)`；lh ⇒ `var(--lh)`；700 ⇒ 400）+ `permission-prompt button` `font: inherit` + `question-input` `line-height` |
| `chat-composer.css` | 70 ⇒ **139** | **覆盖段**（核件消费面 32 锚 × 特征度提升 + UA 控件族回收）——过估（§九 ≈100，+39；覆盖段注 + 真机扫描所得回收规则） |
| `chat-fixes.css` | 118 ⇒ 118 | 9 处值改（11 ∥ 12 ∥ 15px ⇒ `var(--fs)`；lh 1.5 ∥ 1.7 ⇒ `var(--lh)`；600 ⇒ 400） |
| `core-markdown.css` | 191 ⇒ 191 | 面 1 族 ∥ 号 ∥ 行高 ⇒ 变量；`li` ∥ 代码体 `lh` ⇒ `var(--lh)`；`.code-lang` 10px ⇒ `var(--fs)`（修饰 em ∥ 700 ∥ 600 全保留） |
| `core.css` | 331 ⇒ **333** | 值改（10 ∥ 11 ∥ 12 ∥ 14px ⇒ `var(--fs)`；500 ∥ 600 ⇒ 400；lh ⇒ `var(--lh)`）+ tracking ×2 删除 + 钮族族 ∥ 行高回收 ×4 |
| `pool.css` | 113 ⇒ **112** | 值改 + tracking 删除（-1 行） |
| `settings.css` | 294 ⇒ **298** | 值改（12 ∥ 16px ⇒ `var(--fs)`；`lh:1` ⇒ `var(--lh)`）+ 两处标题 UA 粗体归零 + `settings-row-action` `font: inherit` + `option` 行高 + tracking 删除 |
| `skin.css` ∥ `index.html` | 13 ∥ 55 | **零改** |

### 二、决策透明表（实施面裁定 · 逐条）

| # | 事项 | 处置 | 判由 |
|---|---|---|---|
| 1 | 覆盖段搜索条三锚 | 设计 `#toolbar #search-input` ⇒ 实落 `#search-bar #search-input` ∥ `#search-bar #search-count` ∥ `body #search-bar button` | 核 `search.mjs:141` 把 `#search-bar` 插在 `#toolbar` **之前**（兄弟节点——桌面 `#toolbar` 由装配期赋值）⇒ 设计前缀不命中；§2 §六-C 自句「设计定向 ∥ 选择器随实施」授权定形；**该差请设计侧收正** |
| 2 | 源判据⑤ 实现形 | 「值一律取 `var(--ls)`（零 tracking 字面）；声明点 = theme.css 基面 + 覆盖段推理钮复位」 | 核件 `#reasoning-btn` `letter-spacing: 0.5px` 为冻结核件值 ⇒ 真机⑤ `normal` 须覆盖段归零回收（§2 §六-B 明文「覆盖段收基线」）；此为两判据共解 |
| 3 | 真机扫描所得清册外坏点 6 类 | 全按 D29 目标归基线（细则 = 下表） | 设计清册（15 档 208 条）未列；坏点直接违反真机①–④ 与 D29「一种字体 ∥ 一个字号 ∥ 行距一致」⇒ 按设计目标收口，逐条在此披露 |
| 4 | `select` 本体行高 | 探针豁免（证据在盘：`readings.json` `selectExemption`——`before/inline/inlineImportant` 三路皆 `normal`，同壳 `option` = `21px`） | Blink 把 `select` 本体 computed `line-height` 固定 `normal`（页面 CSS 不可承载——非实现层可收）；**豁免须父侧 ∥ 设计侧落档**（判据句同现 §2:132 ∥ 设计档三处） |
| 5 | 覆盖段预算 | 实读 139 行（估 ≈100） | 见上表；未触 300 线 ⇒ 无档位影响，值请父侧按实读同拍 |
| 6 | `.advisor-content` ∥ 面 20 `.code-block code` 行高 | 前者 `1.5 ⇒ var(--lh)`（同值）；后者 `inherit` 保留并列入源判据⑥白名单 | 判据⑥「∈ {`var(--lh)`} ∪ 白名单」；`inherit` = 面 20「零改」既有值（真机取用 = 21px） |

**清册外坏点 6 类（真机扫描发现 ⇒ 处置）**：① 设置面 `h2.settings-title` ∥ `h2.wizard-title` ∥ `h3.settings-section-title` 承 UA 粗体（700）⇒ settings.css 显式 400；② `button.settings-row-action` 族承 UA 控件字体（13.3333px ∥ Arial ∥ lh normal）⇒ settings.css 加 `font: inherit`；③ `.permission-prompt button`（审批卡三出口）同承 UA 控件字体 ⇒ chat-cards.css 加 `font: inherit`（盒值零动）；④ `.code-copy-btn` 自 `pre`（UA `monospace`）继承错族 ⇒ core.css 加 `font-family: var(--font)`；⑤ `.sub-stop-btn` ∥ `.sub-follow-btn` 承 UA 族 Arial ⇒ core.css 各加族声明；⑥ 钮 ∥ 输入 ∥ 下拉内件行高（`#send-btn`∥`#abort-btn`∥`#attach-btn`∥搜索三钮∥`.perm-btn`∥`.question-input`∥`.mm-filter`∥`option`）承 UA `line-height: normal` ⇒ 覆盖段 ∥ core.css ∥ chat-cards.css ∥ settings.css 各处归 `var(--lh)`。

### 三、机检两腿（跑法 + 读数）

- **源扫描腿**：`node --test docs/batches/2026-09-30-desktop-typography-unify.test.mjs`（仓根 `thincoder/`）⇒ **9/9 pass**（①font-size ∥ ②font-weight ∥ ③三变量+族指 ∥ ④覆盖段锚 ∥ ⑤letter-spacing ∥ ⑥line-height ∥ ⑦负面锁 ∥ ⑧骨架 ∥ ⑨font-family 单源——⑨ = 评审补笔）。
- **真机 computed 腿**：`node docs/batches/2026-09-30-desktop-typography-unify-probe.mjs` ⇒ **0 violations ∥ exit 0**；九步 = base(51 候选) ∥ modelMenu(55) ∥ reasoningDropdown(53) ∥ autoConfirm(56) ∥ search(57) ∥ settings(256) ∥ settingsDark(256) ∥ synthetic(182) ∥ wizard(52)；族首项全 = `ui-monospace`；亮 bg `rgb(247,248,250)` ⇄ 暗 bg `rgb(21,23,28)`；零 `pageerror`；读数 = `docs/batches/2026-09-30-desktop-typography-unify-readings.json`。
- 全清令：仓套件零写 ∥ 零改 ∥ 零跑（本舱未跑 `npm test`——收口单跑 = 父侧）。

### 四、审计 ∥ 代码评审轮次与终态

- **内部 explore 偏离审计（轮 1）**：DEVIATIONS（0🔴 ∥ 2🟡 ∥ 3🔵）——五条 = 口径差 ∥ 文档随动 ∥ 批内产物级；无越界改动、无未披露简化、无判据实质削弱。处置：tmp 探查脚本 ∥ 快照已清（5 枚）；其余随本段落档。
- **内部 advisor 代码评审（轮 1）**：**pass**（0🔴 ∥ 4🟡 ∥ 5🔵）。fix round（同会话）：探针退出码改「零违规 ⇒ 0 / 有 ⇒ 1」；合成面补 paste ∥ dropdown ∥ `#at-dropdown` 锚（+10 候选，仍 0 违规）；源腿补判据⑨（`font-family` 单源）；档头注释 11 ⇒ 12 档收正；探针档头 ④ 补 `select` 豁免句。**未修 2 条**（理由）：探针 382 行越 300 顾问线（批内件惯例——在册先例 625 行件；拆档收益低）∥ 负面锁随 git 工作区状态（批内复跑场景够用；哈希基线为可选升级）。fix round 后两腿复跑：源 9/9 ∥ 真机 0 违规。
- **终态 = clean**（两轮零 🔴；🟡 全为「报告 + 落档」级）。

### 五、残留（2）

1. 判据句 `select` 豁免未落档（§2 §九 ④ ∥ 设计档三处同句「`line-height = 21px`」）——本舱不可改 §2 ∥ 设计档，请父侧 ∥ 设计侧同拍（证据 = 读数 `selectExemption` 段）。
2. 覆盖段三锚与 §2 §六-C 清单不符（`#toolbar …` ⇒ `#search-bar …`）——请设计侧收正 §六-C；实施形已按实盘 DOM 定形（覆盖段注释 ∥ 测试注释双证）。

**勘误（同轮补记 · 按盘实读收正）**：一表 ∥ §四四处行数按**终盘实读**收正（口径 = 内容行数，文末换行不计）——`theme.css` 89 ⇒ **95**（表内原记 96）∥ `chat.css` 350 ⇒ **351**（表内原记 350；+1 = 头行段注释 D29 补句一行）∥ `chat-composer.css` 70 ⇒ **138**（表内原记 139）∥ 探针实读 **389** 行（§四原记 382——仍越 300 顾问线，处置不变）；批内件源扫描档实读 **277** 行（< 300 ✓）。余值（chrome 269 ∥ session-list 169 ∥ chat-cards 155 ∥ chat-fixes 118 ∥ core-markdown 191 ∥ core 333 ∥ pool 112 ∥ settings 298 ∥ skin 13 ∥ index.html 55）与表同。§三 两腿结论与九步读数**零变**。

## §6 验证与收口（父代理）

**实施舱回执** = §5 在盘（eng-coder 自写：落地面 ∥ 决策透明表 ∥ 两腿读数 ∥ 审计/评审轮次）；终态 = **clean**（审计 1 轮〔0🔴〕∥ 代码评审 1 轮 pass 0🔴 + 响应表全落）；实施后收正轮（id=34）两号全闭。

**父侧核验（2026-09-30 19:3x）**：① 源扫描腿独立复跑 = **9/9 绿**（本席亲跑：font-size ∥ font-weight ∥ 变量 ∥ 覆盖段清单 ∥ letter-spacing ∥ line-height ∥ 负面锁〔`render-core` ∥ `vscode` 零 diff〕∥ 骨架 ∥ font-family）；② 真机腿 = 实施舱九步读数 **0 违规**（批内件 probe 可复跑）；③ 改动面 = 11 档 CSS（提交 `3a175713`，+1245/−123）+ 批内件三档；核件 ∥ VSC ∥ 骨架 ∥ `skin.css` 零触。

**收口核对（D7）**：角色表 §1–§6 ✓ ｜ 状态行 ✓ ｜ 计数（11 档值面改 + 清册外 6 类坏点收口）✓ ｜ 指针 ✓ ｜ **台账 #736 → 待核销** ✓。

**遗留（如实）**：① **T-DSK51 真机走查 = 候用户一眼**（重载后逐面观感——机检面已全绿）；② **值回填**（§4.1 ∥ §4.2 实读值随实施收正——含 `chat.css` 351 ∥ `chat-composer.css` 138〔覆盖段预算越界对账在 §5〕∥ `core.css` 333 ∥ `settings.css` 298 等；doc-check 行数面 9⇒12 差异即此）＝ 回填轮（在册）；③ 圆角随动面 ∥ KD-57 ④ 张力 = 另轮在册。

**收口结论**：验收 = 源 9/9（父侧亲跑）+ 真机 0 违规；**本批冻结候 T-DSK51 一眼 + 回填轮**。
