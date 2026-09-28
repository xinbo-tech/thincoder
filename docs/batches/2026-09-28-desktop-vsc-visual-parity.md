# 2026-09-28 · desktop-vsc-visual-parity
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 04:42 走查裁定「B」（桌面会话流样式与 VSC 差异大 ⇒ 视觉向 VSC 靠拢）——续「桌面 UI 对齐」需求族（D17–D20 之后的视觉层）。
> 台账 = #477（桌面端 · 归批）。前情 = docs/batches/2026-09-27-render-core-r3.md（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户裁定 · 2026-09-28 04:42 走查「B」）**：桌面端走查反馈——内容已能渲染 markdown 表格（= 核接线生效 ✓），但「样式与 VSC 区别很大」；父侧答「是——设计画线 = 渲染逻辑单源 · 视觉按端自持（`docs/render-core/design/RENDER-CORE.md` §5 样式契约 + R3 裁 ②）」并摆两档（A 保持 ∥ B 向 VSC 靠拢）⇒ 用户裁 **B**。需求档已落 **`docs/desktop/requirements/PROJECT.md` §4 D21**（主 agent 笔 · 本日）。

**改动方向**：核产出面（md 正文 / 标题 / 列表 / 引用 / 代码块 / 行内码 / 表格 / 链接 / 图片 + 推理块 + 复制钮）+ 文本面容器（`renderer/core.css` 现有射程）的**视觉值**改以 **VSC webview 实值**为准（逐面映射表入设计）；桌面外壳 / 主题体系（左列 / 标签 / 池 / 输入区 / 状态行等）零动。

**已知事实（设计免探）**

- `thincoder-desktop/renderer/core.css:1-9` 头注 = 三族覆盖面（①md 产出 ②推理块 ③复制钮）+ 容器（`.block-text` / `.reasoning-content`）+ 值源（`styles.css` 主题表 · 亮暗两套）。
- VSC 值源 = `thincoder-vscode/webview/*.css`（`chat.css` 等——以实读为准）。
- 前情 = `docs/batches/2026-09-27-render-core-r3.md`（已收口）——本批 = R3 后的视觉层续项。

**边界**

- VSC 侧**零改动**（VSC = 值源，不改；两端像素级复刻亦不做——目标 = 内容面观感基本一致，程度 = 逐面值表对齐，用户可再调）。
- 与在途批 `2026-09-28-session-list-disk.md`（#475 链）**文件面零交叠**：其面 = core `SESSION.md` 族 / `IPC.md`（评审冻结中），本批 = `RENDER-CORE.md` / desktop `UI.md` / desktop `PROJECT.md`。

**链**：§2 设计（逐面映射表）→ §3 评审（用户点火）→ §4 批准 → §5 实施 → §6 收口。

**父侧射程扩展（2026-09-28 04:45 · 走查追问并入）**：加一面——**桌面「会话面板」视觉对齐 VSC**（左列列表行 / 密度 / 元数据呈现 / 面板皮肤；结构〔左列 + 标签条〕零动）。缘起 = 用户 04:44 追问「会话面板与 vsc 端完全不同，之前要求过对齐」：**账目实情** = D18 原射程 = 数据层对位（元数据族 + 交互 · R3c 已交付 ✓），**视觉层从未进射程**（当时为「视觉按端自持」期；结构差 = 用户 09-25 自定结构，登记为「本端结构差异不削」）⇒ 本条 = 视觉层补齐（父侧认账：需求定形时未把视觉度问清）。需求档 D18 行补视觉句（主 agent 笔）；台账 #478；设计舱已并入射程（#3 已收扩展令 ✓）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（内容面 21 面 + 会话面板 9 面逐面映射表在册 · 新增变量 14 · 端差 3 · 上抛 5 项（★字族 / 拆档窗口 / D 号三处 / D21 判据 / D18 归属））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 · 逐条可核）

| # | 条目 | 源 | 判据（机检 / 可核） |
|---|---|---|---|
| 1 | **内容面视觉对齐 VSC**——核产出面 21 面（md 正文 / 标题 / 列表 / 引用 / 行内码 / 代码块壳 / 语言条 / 代码体 / 语法高亮 / 表格 / 表头单元格 / 链接 / 强调 / 图片 / 分隔线 / 勾选框 / 推理摘要 / 推理内容 / 推理内 md / 复制钮）值以 VSC 实值为源 | 需求 §4 **D21** · 用户 04:42 走查「B」· 台账 #477 | 逐面映射表 = 核档 §5（21 面 · 每面带 `file:line`）；值落点 = `renderer/core.css` + 主题表 `styles.css` |
| 2 | **会话面板视觉对齐 VSC**——桌面左列会话列表 9 面（行容器 / 行 hover / 活动行态 / 行标题 / 元数据族 / 行内动作钮 / 字形面 / 空态行 / 行聚焦） | 用户 04:44 追问「会话面板与 vsc 端完全不同，之前要求过对齐」· 父侧射程扩展（04:45）· 台账 **#478** · 需求 D18 视觉句（父侧笔） | 逐面映射表 = `docs/desktop/design/UI.md` §1 本批注项 2（9 面）；值落点 = `renderer/styles.css` 左列段 |
| 3 | **口径收正**：RENDER-CORE §5 样式契约句「视觉按端自持」⇒「**内容面视觉对齐 VSC（值以 VSC webview 实值为源）· 外壳自持**」 | 父侧帧定（§1 批件） | 核档 §5 现句 + 核档变更记录一行（史实归记录面） |

**不在本批**：VSC 侧零改（值源——`thincoder-vscode/**` 一字节不动）· 桌面外壳类（`chat.css` 射程：块壳 / 卡族 / 会话头 / 标签条 / 池 / 输入区 / 状态行）· 主题体系（亮暗两套机制与既有变量值）· 需求档 / 台账 / #475 冻结面（`docs/core/**` 之 `SESSION.md` 族与 `IPC.md`）· 实现码（本批 = 设计轮）。

### 2.2 设计落点与值表单源（一处一值表）

| 面 | 值表单源（权威） | 落点（实施批） |
|---|---|---|
| 内容面（核产出件 · 跨端契约） | `docs/render-core/design/RENDER-CORE.md` §5（口径三律 + 主题表新增变量 12 + 逐面映射表 21 面） | `thincoder-desktop/renderer/core.css`（141 ⇒ ~240）+ 主题表 `thincoder-desktop/renderer/styles.css` |
| 会话面板面（端壳面） | `docs/desktop/design/UI.md` §1「本批注（D21）」项 2（映射表 9 面 + 不追面七条） | `thincoder-desktop/renderer/styles.css` 左列段（`.rail-*`） |
| 端差与不追面 | `docs/render-core/design/RENDER-CORE.md` §9（内容面端差 2 + 会话面板端差 1 + 不追面四条） | 同上 |

**口径三律（核档 §5 单源）**：① 宿主主题色**角色对位**（VSC `--vscode-*` ⇒ 桌面 `--fg` / `--line` / `--accent` / `--warn`——值随端主题，主题体系零动）；② 语义常量**值照搬**（语法配色 / 叠加层 rgba / 字族栈 / 尺寸 / 圆角 / 透明度）；③ **盒层单层律**（内嵌件照搬；块壳已承载的块内边距 / 边框 / 圆角不搬）。

**新增变量合计 14**（单源 = 主题表 `styles.css` 亮暗两套）：`--mono` · `--hover-bg` · `--hover-bg-strong` · `--overlay` · `--green` · `--syn-kw` / `--syn-str` / `--syn-cmt` / `--syn-num` / `--syn-type` / `--syn-prop` / `--syn-atrule`（内容面 12）+ `--diff-del-bg` · `--error-fg`（会话面板面 2）。

### 2.3 逐面映射表 · 内容面（21 面 · 快照——完整逐值清单 = 核档 §5）

VSC 坐标简写 = `thincoder-vscode/webview/` 下同名档（`chat.css:68` = `thincoder-vscode/webview/chat.css:68`）；桌面落点 = `thincoder-desktop/renderer/` 下（`core.css` / `styles.css`）。

| # | 面（核产出件） | VSC 实值（file:line） | 桌面落法（复用 ∥ 新增变量 ∥ 直接值） |
|---|---|---|---|
| 1 | 正文（字族 / 字号 / 行高） | `base.css:74`（字族 = `--vscode-editor-font-family`）· `:75`（字号 `14px`）· `chat.css:50-55`（行高 `1.55`） | 两容器 `font-family: var(--mono)`（**新增** ★上抛①）· `14px` · `line-height: 1.55`；断词沿壳层 `.block`（`overflow-wrap: anywhere`） |
| 2 | 段落 + 首尾留白 | `chat.css:68-69`（`p: 0 0 6px` · `p:last-child` 归零） | `p { margin: 0 0 6px }` + `p:last-child { margin-bottom: 0 }`；**删**现 `core.css:12-15` 首子归零规则（直接值） |
| 3 | 标题 h1–h6 | `chat.css:63-66` · `:126` · `:127` | 逐级：h1 `1.3em/12px 0 6px/700` · h2 `1.15em/10px 0 4px/700` · h3 `1.05em/8px 0 4px/600` · h4 `1em/6px 0 2px/600` · h5 `0.95em/5px 0 2px/600` · h6 `0.9em/4px 0 2px/600` + `opacity: 0.8`（现制一律 `1em`/`600` ⇒ 本值） |
| 4 | 列表 ul / ol / li + 嵌套 | `chat.css:111-112` · `:129` · `:130-132` | `ul, ol { margin: 4px 0 6px; padding-left: 20px }` · `ol { list-style: decimal }` · `li { margin: 2px 0; line-height: 1.5 }` + 嵌套三条（直接值） |
| 5 | 引用 blockquote | `chat.css:134-141` | `6px 0` · `padding: 6px 12px` · `border-left: 3px solid var(--line)`（复用）· `background: var(--hover-bg-strong)`（**新增**）· 圆角 `0 4px 4px 0` · `color` 撤 `--fg-muted`（VSC `--textSecondary` 未定义 ⇒ `--fg`） |
| 6 | 行内码 code | `chat.css:71-78` | `var(--mono)` · `0.9em` · `background: var(--hover-bg-strong)`（**新增**）· `padding: 1px 5px` · `border-radius: 3px` · `word-break: break-word` |
| 7 | 代码块壳 `pre.code-block` | `chat.css:80-88` | `margin: 8px 0` · `padding: 0` · `border: 1px solid var(--line)`（复用）· `border-radius: 6px` · `overflow: hidden` · `background: var(--overlay)`（**新增**）· `position: relative`（既有） |
| 8 | 语言条 `.code-lang` | `chat.css:90-98` | `padding: 3px 10px` · `10px` · `color: var(--fg)`（复用）· `opacity: 0.5` · `border-bottom: 1px solid var(--line)` · `var(--mono)` |
| 9 | 代码体 `.code-block code` | `chat.css:100-109` | `display: block` · `padding: 8px 10px` · `overflow-x: auto` · `var(--mono)` · `0.88em` · `line-height: 1.5` · `background: transparent` |
| 10 | 语法高亮 `tk-*`（9 类） | `base.css:371-379`（变量 = `:27-33` / `:51-57`） | 9 条规则 + `--syn-*` 七（**新增**）——`.tk-keyword` / `.tk-string` / `.tk-comment`（+italic） / `.tk-number` / `.tk-type` / `.tk-property` / `.tk-atrule` / `.tk-class`⇒`--syn-type` / `.tk-id`⇒`--syn-atrule`；**桌面现零 `tk-*` 规则 = 高亮不可见（本批首要缺口）** |
| 11 | 表格 | `chat.css:154-159` | `border-collapse: collapse` · `8px 0` · `font-size: 0.9em` · `width: 100%`（直接值） |
| 12 | 表头 / 单元格 | `chat.css:161-170` | `th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left }` · `th { background: var(--hover-bg-strong); font-weight: 600 }`（**新增**） |
| 13 | 链接 a | `chat.css:114-115` | `color: var(--accent)`（复用）· `text-decoration: none` · `a:hover { text-decoration: underline }` |
| 14 | 行内强调 strong / em / s | `chat.css:123-124` · `:143` | `strong 700` · `em italic` · `s { line-through; opacity: 0.7 }`（直接值） |
| 15 | 图片 img | `chat.css:172-175` | `max-width: 100%`（既有）· `border-radius: 4px` |
| 16 | 分隔线 hr | `chat.css:117-121` | `border: 0` · `border-top: 1px solid var(--line)`（复用）· `margin: 10px 0` |
| 17 | 任务清单勾选框 | `chat.css:145-151` | `margin-right: 6px` · `vertical-align: middle`（既有）· `pointer-events: none` · `[disabled] { opacity: 0.85 }` |
| 18 | 推理摘要 `.reasoning-summary` | `chat.css:286-294` | `font-size: 12px` · `color: var(--fg)`（复用）· `opacity: 0.5` · italic · `cursor: pointer` · `user-select: none`；**`padding: 4px 10px` 不搬**（盒层单层律 = 端差①）；尾缀 `content: "…"` 保留（字形面） |
| 19 | 推理内容区 `.reasoning-content` | `chat.css:393-401` | `padding: 6px 0 0`（水平 `10px` 不搬——盒层单层律）· `border-top: 1px solid var(--line)`（复用）· `12px` · `opacity: 0.65` · `1.45` · `max-height: 200px` · `overflow-y: auto` · `word-break: break-word` |
| 20 | 推理块内 Markdown | `chat.css:404-413` | `h1,h2,h3 { 700; 8px 0 4px }` · `p { 0 0 5px }` + `p:last-child` · `code { var(--mono); rgba(127,127,127,.15); 3px; 1px 4px; 0.92em }` · `ul,ol { 4px 0 6px; padding-left: 18px }` · `li { 2px 0 }` · `strong`/`em` 同 14 行；**代码块不来推**（端差②） |
| 21 | 代码块复制钮 `.code-copy-btn` | `base.css:386-401` | `top/right: 6px`（既有）· `padding: 3px 8px` · `11px` · `border: 1px solid var(--line)`（复用）· `border-radius: 4px` · `background: var(--overlay)`（**新增**）· `color: var(--fg)`（复用）· `opacity: 0.4` · `transition` · `:hover { opacity: 1; background: var(--hover-bg-strong) }` · `.copied { opacity: 1; color: var(--green); border-color: var(--green) }`（**新增**） |

### 2.4 逐面映射表 · 会话面板面（9 面 · 快照——完整清单 = `docs/desktop/design/UI.md` §1 本批注项 2）

对位 = VSC 会话列表（`.session-item` 族）；值源 = `thincoder-vscode/webview/session.css` / `thincoder-vscode/webview/session-bar.js`；落点 = `thincoder-desktop/renderer/styles.css` 左列段（`.rail-*`）。

| # | 面 | VSC 实值（file:line） | 桌面落法 |
|---|---|---|---|
| 1 | 行容器（内边距 / 间距 / 分隔） | `session.css:61-71`（`padding: 8px 10px` · `gap: 8px` · `border-bottom: 1px solid var(--border)` · `:last-child` 无线） | `.rail-row`：`6px 8px ⇒ 8px 10px` · `gap: 8px`（既有）· 新增 `border-bottom: 1px solid var(--line)`（复用）+ `:last-child` 无线 |
| 2 | 行 hover 底色 | `session.css:73-75`（`background: var(--hover-bg)`） | `.rail-row:hover { background: var(--hover-bg) }`（**新增变量**——现值 `var(--bg)`） |
| 3 | 活动行态 | `session.css:77-83`（`color-mix(in srgb, var(--accent) 10%, transparent)`；标题 `color: var(--accent)`） | `.rail-row[data-active="1"]`：`border-color: var(--accent) ⇒` 该底色 + `.rail-row-title { color: var(--accent) }`（直接值） |
| 4 | 行标题 | `session.css:85-93`（`13px` · `500` · 省略三件） | `.rail-row-title { font-size: 13px; font-weight: 500 }`（省略三件既有） |
| 5 | 元数据族 | `session.css:95-100`（`11px` · `color: var(--fg)` · `opacity: 0.4`）；串形 = `session-bar.js:41` | `.rail-row-meta { 12px ⇒ 11px; --fg-muted ⇒ var(--fg); opacity: 0.4 }`；分隔符机制差保留（CSS `::before "· "` ≡ VSC 串内 ` · `） |
| 6 | 行内动作钮（改名 / 删除） | `session.css:102-151`（`22px` 方 · `4px` 圆角 · `12px` · 静息 `opacity: 0` · 行 hover `0.5` · 自身 hover `1` + 底色〔`--hover-bg-strong`+`--accent` ∥ `--diff-del-bg`+`--error-fg`〕） | `.rail-rename` / `.rail-delete`：`22×22` · `border-radius: 4px` · `12px` · 静息 `opacity: 0` · 行 hover `0.5` · 自身 `:hover { opacity: 1 }` + 底色色值照落（**新增 2**：`--diff-del-bg` · `--error-fg`）+ **本端加一臂** `:focus-visible { opacity: 1 }`（键盘可达 = 端差登记） |
| 7 | 字形面（两钮） | `session-bar.js:42` / `:44`（`✎` / `✕`） | `content: "✎"`（既有）· `content: "×" ⇒ "✕"`（字形仍住样式档；标签条关闭控件不在射程） |
| 8 | 空态行 | `session-bar.js:65-70`（空项 `opacity: 0.5`） | `.rail-hint`（`--fg-muted`——观感等价）⇒ 不改（登记） |
| 9 | 行聚焦（键盘） | 无对应（VSC 行 `tabIndex = 0` 无 `:focus` 样式——`session-bar.js:36`） | 沿浏览器原生焦点环（零新规则） |

### 2.5 边界面（明示不追 · 逐条理由）

**内容面**：VSC 侧零改（值源）· 桌面外壳零动（块壳 / 卡族 / 会话头 / 标签条 / 池 / 输入区 / 状态行——`chat.css` / `pool.css` / `settings.css` 零规则改动）· 主题体系零动（亮暗机制与既有变量值不动）· 推理块**壳层**（边框 / 底色 / 圆角 / 斜体 muted）沿 `.block-reasoning`。
**会话面板面**：① 面板容器皮肤（VSC = 浮层 dropdown 带 `--shadow`；桌面 = 三列左列卡片）· ② 会话选择器 / 下拉交互（桌面列表常显 + 标签条，无「点开下拉」形态）· ③ `#project-btn`（VSC 多根切换钮——本端单项目模型 ⇒ 不适用）· ④ `#new-session-btn`（桌面新建入口 = 左列空态入口 + 标签条 `+`）· ⑤ `.dropdown-section`（VSC 会话列表不发射该节点——仅 `model-picker.js:73` 消费）· ⑥ 行内换形三件（VSC 改名走宿主输入框 / 删除走浮层）· ⑦ `.rail-origin` / `.rail-control`（本端独有 D2 / D1 面）。**结构零动**：左列 + 标签条 + 行族结构 / 元数据族 / 换形面（需求 D18「本端结构差异不削」）。

### 2.6 验收路径

1. **值表逐项落点（设计面 · 已核）**：内容面 21 面 × 会话面板面 9 面逐面带 VSC `file:line` + 桌面落法；落点文件 = `core.css` / `styles.css`（实施批按表落地）。
2. **真机比对（人工走查）**：同轮会话并排 VSC 与桌面（逐面：正文 / 标题 / 列表 / 引用 / 行内码 / 代码块 + 高亮 / 表格 / 链接 / 图片 / 分隔线 / 推理块 / 复制钮；会话行 9 面）——走查面 = T-DSK21。
3. **可机检部分（候选 · 测试档随修随加 · 不占设计条目）**：① **值落点锁**（`thincoder-desktop/test/views-locks.test.mjs` 原址补例——新增变量两模式齐备 · `tk-*` 9 规则在场 · 关键值串；沿 U152 同式）；② **真机读数**（`thincoder-desktop/test/integration/chat-render.test.mjs` 原址补例——真 Electron `getComputedStyle` 读代码块底 / 行内码底 / 表头底 / 关键词色；需求 D16 条「改可见面 ⇒ 真 Electron 使用面用例」由本条承担）。
4. **文档面机检**：`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ **本批新增行 0 悬空 · 0 行宽**（读数 = 全仓汇总 悬空 47 · 行宽 34——逐条核对皆存量基线，无一本批新增行）。

### 2.7 行数预算与越层登记

| 文件 | 现行 ⇒ 预期 | 备注 |
|---|---|---|
| `thincoder-desktop/renderer/core.css` | **141 ⇒ ~240**（+~100） | ≪300 ⇒ 零拆分预案；首要缺口 = `tk-*` 9 规则现零 |
| `thincoder-desktop/renderer/styles.css` | **374 ⇒ ~420**（+~46：主题表 14 变量 × 亮暗两套 ≈22 行 + 左列段 9 面 ≈24 行） | **越 300（在册）** · 拆档窗口已到（本批触碰）⇒ 归父侧裁（§10 AL · 本设计倾续期——拆档不消解越层） |
| `docs/render-core/design/RENDER-CORE.md` | §5 +~55 行（三律 + 变量表 12 + 映射表 21 面 + 计数行）· §9 +~6 行 | 已落 |
| `docs/desktop/design/UI.md` | §1 +~20 行（本批注 2 项 + 表 9 面 + 不追面七条） | 已落（§1 形态行数 23 不变 ⇒ 本档 §9 指针「行数不变」） |
| `docs/desktop/design/PROJECT.md`（本档） | §2 KD-29 · §4.1 / §4.2 / §6.1 / §7 / §9 / §10 随动 | 已落 |

### 2.8 关键决策（含被否候选 · 逐条给源）

| # | 决策 | 理由（证据） | 被否候选与何故否 |
|---|---|---|---|
| 1 | **值源 = VSC webview 实值**（逐面取值带 `file:line`） | 用户 04:42 走查裁定「B」+ 需求 D21 判据句「值以 VSC webview 实值为准」 | **保持现制**（用户明否）· **逐像素复刻**（宿主主题变量在桌面不存在 ⇒ 取值即自铸；且 VSC 侧作用域副产物不宜复刻）· **只改配色**（差异大头在字族 / 盒模型 / 高亮 ⇒ 浅改不解） |
| 2 | **口径三律**：宿主主题色角色对位 ∥ 语义常量值照搬 ∥ 盒层单层律 | 两端变量体系不同源（VSC `--vscode-*` 宿主注入 vs 桌面自持主题表 `styles.css:5-32`）；盒层叠加会反偏离（桌面块壳已给 `8px 10px`） | **全量硬编码 VSC 算值**（暗色算值移植 ⇒ 亮色失配 + 主题零动边界破）· **全量走桌面主题变量**（「值以 VSC 实值为源」落空） |
| 3 | **新增变量落主题表 `styles.css`**（值变量单源） | 沿核档 §5 原句（值面变量 = 桌面主题表亮暗两套）+ `core.css:3` 头注自述 | **core.css 自带 `:root` + dark 媒体查询**（第二张主题表 ⇒ 主题机制双源） |
| 4 | **★字族对齐 = 编辑器等宽栈**（`--mono` = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`） | `thincoder-vscode/webview/base.css:74`（VSC webview 正文字族 = `--vscode-editor-font-family`，VS Code 缺省即等宽族）——差异感知最大的一项 | **保留系统 UI 栈**（与 VSC 现实不符）· **折中（仅代码面等宽）**（半对齐）；**单点回退面在册**（★上抛①——删一行即还原） |
| 5 | **推理块内代码块 = 正文面同形**（不复制 VSC 灰底覆盖） | 核产出件两端同形优先；VSC 侧 `.reasoning-content pre` 覆盖系 `.content` 前缀缺失之作用域副产物（`chat.css:404-413` 同段注释自述「mirror .content styles」） | **逐字复刻灰底**（连带语言条丢样式 + 同一核产出件两端分形）；如需 ⇒ 另裁 |
| 6 | **推理块盒层单层**（summary / content 的块内边距不搬） | 桌面 `.block-reasoning` 壳已给 `8px 10px`（`chat.css:13-19`）；照搬 ⇒ 水平 20px 缩进（观感反偏离） | **照搬 `4px 10px` / `6px 10px`**（双层内边距） |
| 7 | **会话面板 = 结构零动 + 9 面视觉收正** | 需求 D18「多标签保留 / 本端结构差异不削」；父侧射程扩展句「结构〔左列 + 标签条〕零动」 | **改用 VSC 单栏下拉**（违 D18 结构不削）· **面板块一并复刻**（无对应位——左列卡片 = 布局面） |
| 8 | **动作钮隐现律 + 本端加一臂 `:focus-visible { opacity: 1 }`** | VSC 隐现律（`session.css:114` / `:119`）为主；本端键盘可达面已入档（`UI.md` §1 键盘可达行）⇒ 加臂不削可达性 | **仅照 VSC（无 focus 臂）**（削本端已入档可达面）· **保留常显**（视觉不对齐） |

### 2.9 上抛项（归父侧 / 用户裁定）

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| ① | **★正文面字族**：随 VSC = 编辑器等宽栈（新增 `--mono`）——**观感变化最大一项** | 用户裁定面（设计已按「值以 VSC 实值为源」落） | 核准 ⇒ 照落；否决 ⇒ **单点回退**（删 `font-family: var(--mono)` 一行 · 余 20 面不动）；登记 = 本档 §10 AM |
| ② | **`styles.css` 拆档窗口已到**（374 ⇒ 本批 ~420；在册预案 = 主题变量 / 布局 / 折叠态三段拆档） | 上抛（归父侧裁） | 拆档**不消解**越层（主题段拆出后仍 ~380 > 300）⇒ 本设计倾**续期**；执行窗口 = 后续「三段一次性拆档」批；登记 = 本档 §10 AL |
| ③ | **D 号口径同族书证三处未随动**：`thincoder/../IPC.md:4` · `.. /RENDERER.md:4` · `.. /SHELL.md:4` 仍标「§4 功能点 D1–D16」 | 一致性面（只报 · 未改三处 —— IPC 在 #475 冻结中，另两档不在本批写域） | 父侧随收（IPC 解冻后同笔）；本批已改 = 本档档头 + `UI.md:4` + §6.1 表头；登记 = 本档 §10 AN |
| ④ | **D21 判据的机检面收口**：需求 D21 判据句「观感基本一致」= 人工走查面；机检面（映射表在册 + 值落点锁 + 真机读数）本设计已给候选并落 `PROJECT.md` §6.1 D21 行 / §7 D21 注 | 需求档收口建议（只报 · 需求档笔权在父侧） | 若父侧要求判据列逐条机检 ⇒ 建议补「值表在册 ∧ 值落点锁」形（或指向设计 §6.1 行）；否则保持现句 + 人工走查闭合 |
| ⑤ | **D18 视觉句归属**：父侧扩展令称需求 D18 行补视觉句（本舱读档 as-of 04:43 未见该句）；本设计把会话面板面挂 **D21 + 本批**（含需求 D18 原判据面不动） | 需求档自洽（只报 · 零触碰） | 父侧落笔后 D18 / D21 两行在需求档内须互不撞车（视觉句若入 D18 ⇒ D21 侧指回 D18 即可） |

**条目-设计-需求三方一致（铁律）**：本批条目 1 / 2 ⇄ 设计值表（核档 §5 21 面 · `UI.md` §1 本批注项 2 九面）⇄ 需求 §4 **D21**（父侧笔）+ D18 视觉句（父侧笔）——同源；D 表 = D1–D21（本批同族书证随动三处已改、三处上报）。

**§2.10 记法收正（自校 · 加法不改旧行）**：§2.9 第 ③ 行三处文档坐标按**仓根相对全路径**记 —— `docs/desktop/design/IPC.md:4` · `docs/desktop/design/RENDERER.md:4` · `docs/desktop/design/SHELL.md:4`（三处仍标「§4 功能点 D1–D16」，待父侧随收；IPC 面在 #475 评审冻结中）。同笔：本批已改者 = `docs/desktop/design/PROJECT.md:6` · `docs/desktop/design/UI.md:4` · `docs/desktop/design/PROJECT.md` §6.1 表头（`D1–D20 ⇒ D1–D21`）。

**§2.11 计数关系（自校 · 加法不改旧行）**：**不追面 = 7 条**（全清单 = `docs/desktop/design/UI.md` §1 本批注项 2）；`docs/render-core/design/RENDER-CORE.md` §9 与本文 §2.2 所称「不追面四条」= 其中**核心四条**（容器皮肤 / 选择器下拉 / 会话条 / `#project-btn`——核档不重述端壳面细节）。计数总账：**面 30**（内容面 21 + 会话面板面 9）· **新增变量 14**（12 + 2）· **端差 3**（内容面 2 + 会话面板 1）· **不追面 7** · **上抛 5**。

**§2.12 报告项（本批外 · 只报不改 · 探索中发现）**：**用户消息块的 Markdown 深度两端结构不同**——VSC 用户气泡 = `❯ …` label + `<div class="bubble">` + `mdInline(text)`（`thincoder-render-core/flow/block.mjs:87`——**无 `content` 类 · 无块级 md**）；助手气泡 = `bubble content` + `md(text)`（同档 `:100`）。桌面侧两型块同经 `textFace()` 全量 `md()`（`thincoder-desktop/renderer/views/chat-text.mjs:24-27`）⇒ 用户消息里的围栏 / 表格 / 标题桌面会成块渲染，VSC 不会。类型 = **渲染深度差（D19 面 · 非视觉值面）**——本批（D21）不追、不改（触及 = 渲染逻辑与 `chat-text.mjs` ⇒ 另裁）；建议父侧登记（D19 端差 ∥ 台账）后另行定形。另：本批映射表行 1 的落点 `.block-text` 同时覆盖用户 / 助手两型块（字族 / 字号 / 行高照落）——与上记差异**不冲突**。

**§2.13 报告项（需求侧收口 · 只报 · 零触碰需求档）**：**需求 D21 边界句与「会话面板」面的字面张力**——D21 现写「边界 = 桌面外壳 / 主题体系（**左列** / 标签 / 池 / 输入区 / 状态行等）零动」，而父侧 04:45 射程扩展 = **左列会话列表视觉对齐 VSC**（本批条目 2，已按「**结构**零动 + 视觉面收正」落设计）。处置口径 = 以**父侧 04:45 派单为准**（后令覆盖 + 同轮 §1 明写「结构〔左列 + 标签条〕零动」）；建议父侧落笔时把 D21 边界句收窄为「**外壳结构与其非会话行元素零动**」或把该面整体归 D18 视觉句（二者择一，避免 D21 / D18 两行在需求档内互相顶牛）。本舱**未动**需求档 / 台账（笔权在父侧），设计侧已按派单落定，不阻塞实施。

**§2.14 点修记（设计评审轮 1 · 逐号 1–7 · 2026-09-28 · eng-designer）**：设计面按 §3 发现表逐号落修（★上抛① 裁定面未动；零新语义）——
`docs/render-core/design/RENDER-CORE.md`：§5 `--mono` 行改标**角色对位 / 近似**（宿主编辑器字族；字面出处 = `thincoder-desktop/renderer/core.css:29`）· §5 计数 / 预算两行加**内容面口径**限定（全批合计 → `docs/desktop/design/PROJECT.md` §4.2）· §5 映射表行 2 叙明容器级 `> :last-child` **保留理由**（盒层单层律的容器臂）· §5 预算基线 141 ⇒ **140**；
`docs/desktop/design/PROJECT.md`：§4.1 `events.mjs` 收正 **500**（= 硬限顶格）+ 越层段同笔 · 用例模块行 ⇒ **四十一档**（补六新档 + 值列；`views-locks` **190**）· 集成域补 `chat-render.test.mjs`（**146**）· `run.mjs` / `files.mjs` 按盘刷新 **43 / 21** · §4.2 补两行（`views-locks` **190 ⇒ ~210** / `chat-render` **146 ⇒ ~160**）· §4.2 `core.css` 基线 141 ⇒ **140** · §10 增 **AO** 行（需求档 D17 / D19 两句落点 = 批 `docs/batches/2026-09-28-desktop-residuals.md`）。
**计数口径收正（±1 · 末空行计入与否）**：`views-locks` / `core.css` 之 191 / 141 = 含末空行的编辑器计数；在册口径（内容行数 · 文末换行不计——R3 档实读校准）⇒ **190 / 140**（本舱按在册口径落；`core.css` 与本档 §4.2 R3c 行既有 140 一致）。doc-check 读数：悬空 47 / 行宽 32（与修前逐字同——净增 0）。
**报告项（相邻面 · 只报）**：核档 §5 变量表表头「VSC 源（实值同字面）」与律 2「字族栈」字面未随动（按裁定「行改标」分支执行——未列入写域枚举；如需同笔收（表头例外项写法）⇒ 归父侧裁定）。

**§2.15 点修记（实施期设计前提收正 · 面 9 行聚焦 · 2026-09-28 · eng-designer）**：发现源 = 实施舱实读——`thincoder-vscode/webview/base.css:449-457` 规则块（`.session-item:focus-visible` 选择器 `:450` · 三值 `:454-456`：`outline: 2px solid var(--accent)` / `outline-offset: -2px` / `background: var(--hover-bg-strong)`）；

裁定 = 父侧（实施面照落同三值）；值源 = VSC webview 实读。收正原记「VSC 行无行聚焦样式 ⇒ 沿浏览器原生焦点环 · 零新规则」（实施期发现设计前提不实——原记不成立）。

落点 = `docs/desktop/design/UI.md` §1 本批注项 2 表第 9 行 + 同档变更记录一行；计数零变（9 面 / 变量 14 / 端差 3 不动——本面 = 对齐非端差，`docs/render-core/design/RENDER-CORE.md` §9 零动）；实现码零动（实施舱照落）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**口径限制**：本评审未获项目级 standards 档与文档地图 ⇒ Document ownership 判据降级（按仓内档头指针 + Project Guide 核对）。评审对象 = 四档（核档 / UI / 设计 PROJECT / 需求 PROJECT）· 本轮 = D21 视觉对齐设计轮。要点核验：核档 §5 VSC 侧实值（变量表 11/12 逐字命中 base.css 行锚）· 映射表 21 面 VSC 实值全数命中 chat.css / base.css · 桌面落点 `core.css` 141 / `styles.css` 374 实读相符 · 核包零依赖（`private: true`、无 dependencies）在盘。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity（值源） | 🟡 | 核档 §5 变量表 `--mono` 行（`docs/render-core/design/RENDER-CORE.md:222`）与表头「VSC 源（实值同字面）」+ 律 2「字族栈照搬」相抵：所引 `thincoder-vscode/webview/base.css:74` 的字面实为 `var(--vscode-editor-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)`（回退 = 系统 UI 栈）；行内给值 `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` 在该行无源（疑取自桌面既有 `thincoder-desktop/renderer/core.css:29`） | 该行改标「角色对位 / 近似（宿主编辑器字族）」并注明字面出处，或表头加例外项；★上抛①（AM 行）裁定面照旧 |
| 2 | Requirements coverage | 🟡 | 需求档当日补两句在四档内零落点：D17「恢复态播种」（`docs/desktop/requirements/PROJECT.md:146`）· D19「用户块 md 深度两端统一」（`:148`）；实读 `thincoder-desktop/renderer/views/chat-text.mjs:26`（经 `thincoder-desktop/renderer/views/chat.mjs:96` 五型文本族同径）仍全量 `md`；承批 `docs/batches/2026-09-28-desktop-residuals.md` §2 为空（设计轮未开） | 协调项——由该批设计轮落点，或本档补一行指针指明落点批次；勿双记 |
| 3 | Doc consistency | 🟡 | 设计 PROJECT §4.1 行数账滞后于 §4.2 / 盘上实读：`thincoder-desktop/renderer/events.mjs` 记 351（越层段 `:176`）／369（行内），实读 **500**（= 500 硬限顶格；§4.2 `:250` 已记「下次触碰必须执行拆分」而 §4.1 未载）· `thincoder-desktop/test/views-locks.test.mjs` 记 135（`:163` 值列），实读 **191** · 测试清单行自称「三十五档 · 名序 = `thincoder-desktop/test/files.mjs` 现值同序」，实读 **44** 档（六档未入名录：`views-rail-actions` / `agent-host-subagent` / `events-subagent` / `agent-bridge-subagent` / `views-chat-text` / `views-statusline`），`thincoder-desktop/test/integration/chat-render.test.mjs`（**146**）两名录均无行 | 按盘刷新 §4.1（越层段尤须）或明标 §4.2 为现值单源；本批触碰面以实读为准 |
| 4 | Affected-file annotations | 🟡 | D21 将改的两个测试档无现行行数 / 预期增量：`thincoder-desktop/test/views-locks.test.mjs`（实读 **191**）· `thincoder-desktop/test/integration/chat-render.test.mjs`（实读 **146**）——仅 §7「D21 注」（`docs/desktop/design/PROJECT.md:377-378`）点名机检面，§4.1 / §4.2 无行 | §4.2 补两行「现行 ⇒ 预期（≤±N）」，或明引既裁「测试档随修随加——不进设计面条目」以声明其确为有意（两档距 300 层尚远） |
| 5 | Doc consistency | 🔵 | `thincoder-desktop/renderer/core.css` 现值两记并存：§4.1 R3c 行「— ⇒ 140」（`docs/desktop/design/PROJECT.md:263`）∥ 本批行 / §4.2 行 / 核档 §5「141」（实读 = **141**） | 收一值（141） |
| 6 | Doc consistency | 🔵 | 本批预算 / 计数两口径并列未加范围限定：核档 §5「新增变量 12 · `styles.css` 374 ⇒ ~396」（`docs/render-core/design/RENDER-CORE.md:263` / `:265`——内容面口径）∥ 设计 PROJECT「14 · ~420」（含左列会话面板 9 面）——皆真但并列易被判为互相打架 | 两处各加范围限定（内容面 ∥ 含会话面板面）；零语义 |
| 7 | Clarity（映射完整性） | 🔵 | 容器级残留规则未与 VSC 对位：核档 §5 映射表行 2 删 `:first-child` 归零，保留 `thincoder-desktop/renderer/core.css:16-19` 的 `> :last-child { margin-bottom: 0 }`；VSC 仅 `p:last-child`（`thincoder-vscode/webview/chat.css:69`）⇒ 非 p 尾件（代码块 / 表格）底边距两端将不同 | 表中明示保留理由（或列为端差），或按 VSC 收窄至 `p:last-child` |

**计数**：7 项 = **0 🔴 / 4 🟡 / 3 🔵**。

**VERDICT: pass**

## §4 用户批准（主 agent）

**用户 2026-09-28 05:07 批准**（原话：「评审通过了就落地吧」——父侧读作「批准本批设计 + 开始实施」，沿 `2026-09-25-eng-ownership.md` §4.1 先例；若所指他批请纠正）。

**三条件**

- ① **设计评审 pass**：轮次 1 · **0 🔴 / 4 🟡 / 3 🔵**（§3 在册）；
- ② **修正轮 #10 在飞**（7 项全 Dispatched——落地前不阻塞实施：全部为标注 / 账目 / 指针面，**零实现语义**；落地后父侧复验）；
- ③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：§2 定稿设计（D21 内容面 21 面 + D18 追加会话面板 9 面 + 14 变量 + tk-* 高亮 9 规则补缺）；实施写域 = `thincoder-desktop/renderer/core.css` · `thincoder-desktop/renderer/styles.css` · `thincoder-desktop/test/views-locks.test.mjs` · `thincoder-desktop/test/integration/chat-render.test.mjs`。

**边界**：外壳 / 主题体系零动（chat.css · pool.css · settings.css）· VSC 侧零改（值源）· ★字族（`--mono`）照采纳（用户未否——单点回退通道保留）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-28 落地 · 四档全绿（npm test 192/0）· 审计 1 轮 + 代码评审 2 轮 + 点修轮（面 19 前景色 · 审计 1 + 评审 1）· 终态 clean）


### 5.1 交付摘要 · 写域四档（现行 ⇒ 交付 · 实读）

本批 = D21 视觉对齐落地：**内容面 21 面 + 会话面板面 9 面值全落**；`tk-*` 高亮缺口闭合（批前桌面零规则 ⇒ 代码块全同色 = 本批最大可见项）；主题表新增变量 **14**（亮暗两套）。

| 档 | 现行 ⇒ 交付 | 内容 |
|---|---|---|
| `thincoder-desktop/renderer/core.css` | 141 ⇒ **257** 行 | 内容面 21 面逐面落值（值源 = `docs/render-core/design/RENDER-CORE.md` §5）+ `tk-*` 9 规则 + 三律 / 端差①②照落 |
| `thincoder-desktop/renderer/styles.css` | 374 ⇒ **462** 行 | 主题表 14 变量 × 亮暗两套 + 左列段 9 面值（含父侧裁定新增行聚焦臂） |
| `thincoder-desktop/test/views-locks.test.mjs` | 190 ⇒ **280** 行 | 新增用例 **U174**（值落点锁：`tk-*` 9 类 → 变量 · 内容/面板两面关键值 · 14 变量 × 亮暗两套逐名逐值 · 计数锁 14） |
| `thincoder-desktop/test/integration/chat-render.test.mjs` | 146 ⇒ **174** 行 | T-DSK37 原址扩例（真机 computed style：面 1/7/8/9/10/19/21 + 面板面 6 真机 hover 态 0.5 ⇒ 1） |

**命令读数（终态）**：`cd thincoder-desktop && npm test` = **192 tests / 0 fail**（新例 +1；E2E pageerror 零断言照旧；E2E 读数 `高亮 = rgb(0, 0, 255) / rgb(9, 134, 88)`）；`git diff --stat -- thincoder-desktop` = **恰四档** —— 外壳（`chat.css` / `pool.css` / `settings.css`）· VSC 侧（`thincoder-vscode/**`）· docs / 批档面零改。

### 5.2 决策透明表（实施期判定 · 逐条给据）

| # | 判定 | 依据 |
|---|---|---|
| 1 | 面 9 选择器带容器前缀（`.block-text .code-block code, .reasoning-content .code-block code`） | 裸 `.code-block code` 会被面 20 的 `.reasoning-content code`（同专指度 · 后序）压过 ⇒ 端差②（推理内代码块同形）落空；已自注 + U174 锁 |
| 2 | 活动行选择器 `.rail-item > .rail-row[data-active="1"]`（设计字面 = `.rail-row[data-active="1"]`） | 需胜行 hover（`*:not(:disabled):hover` 与活动态同为 (0,3,0)）⇒ 活动行 hover 仍显活动底色（VSC 同序）；已自注 |
| 3 | 末行无线 = `.rail-item:last-child > .rail-row`（设计字面 = `:last-child`） | `.rail-row:last-child` 在本端 DOM（`li.rail-item > [行, 改名, 删除]` —— `renderer/views/sessions.mjs:167`）**永不命中** ⇒ 按语义落盘（`:196`） |
| 4 | 两钮静息色落 `var(--fg)`（设计行未列该属性） | 探针审计：静息 `--fg-muted` vs VSC `session.css:108/:134` `--fg` ⇒ 按 D21 值源 + 律 1 角色对位照落（一行可回退） |
| 5 | 面板面 6 行 hover 臂锚 `.rail-item:hover`（设计字面 = `.rail-row:hover`） | 两钮为行**兄弟** ⇒ 字面选择器永不命中（探针审计 #1 实偏）⇒ 臂锚上行；已自注 + U174 锁 + E2E 真机读数（0.5 ⇒ 1） |
| 6 | `--mono` / `--error-fg` 暗块**同值重声明**（设计标「同亮」） | 收父侧判据「14 名 × 亮暗两套命中」可直读；零语义差 |
| 7 | `--diff-del-bg` / `--error-fg` 字面取 VSC 实值 | 设计只给变量名（「色值照落」）⇒ 取 `base.css:60`/`:37`（亮/暗）与 `:18` 回退值（两端同值）；评审轮 1 复核相符 |
| 8 | 父侧 2026-09-28 裁定新增 `.rail-row:focus-visible`（VSC `base.css:449-457` 同三值） | 设计面 9 原句「零新规则」前提不实（VSC 实有该规则）⇒ 父侧裁定照落；U174 三条锁 + 注释锚收正 449-457 |

### 5.3 审计与代码评审轮次（含 fix round · 终态 clean）

- **探索审计（只读子代理 · 1 轮）**：21 面 + 9 面逐值对拍 —— 命中 1 实偏（面板面 6 行 hover 兄弟选择器 = 行为断链 + 1 处假绿锁）· 1 值源未追全（两钮静息色）· 1 设计前提取数错（面 9「VSC 无 focus 样式」）。
- **代码评审（advisor · 2 轮）**：轮 1 = **pass**（0 🔴 / 3 🟡 非 must-fix / 5 🔵 —— 报告项见 5.4）；轮 2（增量核验 = 父侧裁定新增行聚焦规则）= **pass**（0 🔴 / 1 🔵 注释锚偏，本舱已收正 ⇒ 全闭）。**终态 = clean**（无 🔴 · 无 must-fix）。
- **fix round 计**：审计后自修 3 处（兄弟臂锚 / 静息色 / 锁串随修 + E2E 真机 hover 读数补强）；评审后 1 处（注释锚）；父侧裁定 1 处（行聚焦臂 + 锁 ×3）。每轮修毕即全量复跑 `npm test`（终态 192/0）。

### 5.4 未闭报告项（只报 · 归父侧 / 设计席）

① **面 19 推理内容区有效前景色**：撤显式 color 后 → 壳层 `chat.css:27` 的 `--fg-muted` 承接（有效 = muted × 0.65）；VSC 实值 = `--fg` × 0.65。补丁备就（`core.css` 一行 `.reasoning-content { color: var(--fg) }`）或登记端差 —— 本舱按任务书「表外零改」未擅改。
② **E2E 真机读数缺两条设计点名值**（面 6 行内码底 / 面 12 表头底 —— 夹具无行内码 / 表格 ⇒ 现夹具下不可得；两值有 U174 单元锁）。
③ `styles.css` **462 行**越 300 层（批档 §2.7 已在册 · 归父侧拆档批；距 500 硬限尚远）。
④ **UI.md 面 6 锚** `.rail-row:hover` 与实现臂锚 `.rail-item:hover` 的字面差（文档面随收）。
⑤ 面 4 列表规则外溢进推理容器（li 行高 1.5 / 嵌套 margin 微差）· ⑥ VSC hover `transition` 未照搬（`session.css:68/:115/:141` 值表未列）。

**用例号自铸披露**：新增用例号 = **U174**（沿桌面测试档 U 号续号）。

**§5.5 点修轮（面 19 前景色 · 父侧 2026-09-28 裁定落地 · eng-coder）**：目标 = 面 19 推理内容区**有效前景色**对齐 VSC 实值（现由壳层 `.block-reasoning` 的 `--fg-muted` 承接 = 偏差；VSC `chat.css:393-401` 不单设 ⇒ 继承 `body` 的 `--fg`〔`base.css:76`〕；渲染有效 = fg × 0.65）。父侧裁定 = 照落 `var(--fg)`（D21 值源）——本轮 = §5.4 ① 预置补丁落地。

- **改动 ①** `thincoder-desktop/renderer/core.css:214-226`：面 19 规则新增 `color: var(--fg);`（`:219`）+ 注释同步（`:214-215`：VSC 不单设 ⇒ 继承 `body`；壳层 `--fg-muted` 承接已废——父侧裁定）；行数 257 ⇒ **259**。
- **改动 ②** `thincoder-desktop/test/integration/chat-render.test.mjs:125`：③ 块新增真机断言——`${REASONING} .reasoning-content` computed `color` = `rgb(27, 31, 36)`（= `--fg` 亮值 `#1b1f24`；≠ 旧 `--fg-muted` `#5c6672` 承接值；`colorScheme: "light"` 前提与同块亮值断言同式）；行数 174 ⇒ **175**。
- **零动（判定记录）**：`thincoder-desktop/test/views-locks.test.mjs` —— U174 面 19 段（`:219-220`：12px / padding 两锁）与新值无冲突（`[^}]*` 不跨 `}`、规则体加行仍命中；全档零 color 锁面）⇒ 按任务书「不冲突则零动」零改（前后 sha256 同 = `9fb8e494…`）。
- **命令读数**：`cd thincoder-desktop && npm test` = **192 tests / 192 pass / 0 fail**（连跑 ×2 全绿）；单档 `node --test test/integration/chat-render.test.mjs` = 1/1 全绿。首跑注：192 tests / 191 pass / 1 fail —— 1 红 = 面板面 6 hover 断言（`chat-render.test.mjs:136`，本轮零触碰；该跑三枚 E2E 同幅放缓〔T-DSK37 16.5s / T-DSK27 15.7s / T-DSK32 9.6s vs 复跑常态 2–3s〕⇒ 机位重载下 hover 丢态读 `0`，竞态复现，非本轮面）。`git diff --name-only` 前后同为 20 档、零新增路径；本轮触碰 ⊆ 三档（core.css + chat-render.test.mjs，views-locks 零动）。
- **审计与评审轮次（本轮 · 终态 clean）**：探索审计（只读子代理 · 1 轮）= 四类发散（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）零命中（级联生效性 / 断言语义与判别力 / U174 锁无冲突 / 越界零 / 设计行 19 八值齐备逐项核过）；代码评审（advisor · 1 轮）= **pass**（0 🔴 / 2 🟡 / 1 🔵）。
  - 🟡 报告项（归父侧 · 非 must-fix）：① 核档 §5 行 19 值列未枚举 `color`——尾注「现 `--fg-muted` ⇒ 本值」的「本值」无绑定目标（语义悬空；同形 = 批档 §2.3 行 19）；② 批档 §5.4 ①（`:237`）与 §5.1 计数（`:209` / `:212`）记录态待 §6 收口随收（面 19 前景色销项 + 本轮轮差 + §2.5「斜体 muted」限缩注）。
  - 🔵 可选项：U174 补一条 `.reasoning-content { … color: var(--fg) }` 锁（与「views-locks 零动」令相抵 ⇒ 归父侧裁；E2E 已锁行为值，不加无缺口）。

## §6 验证与收口（父代理）

**§6 验证与收口（父侧 · 2026-09-28 08:2x）**

**交付**：D21 内容面 **21 面** + 会话面板 **9 面**视觉映射落地（实施已落——审计 1 轮 + 代码评审 2 轮 + 点修，终态 clean）；D18 视觉追加（行视觉）；需求侧 D21 边界句收正（**结构零动**——行视觉归 D18 追加射程）。

**验收读数（父侧亲跑）**：desktop **202/202**（含本批面）；core / cli / vsc 终跑全绿（零回归）。

**提交**：`366bab1f`（桌面码——三链共笔）。

**§5.4 记录态随收**：① 面 19 值列 `color` 语义悬空（尾注「本值」无绑定目标）——登记：值面落点 = 落盘实值，如须枚举归该表下次触碰的轮；② §5.1 计数 / 轮差注 = 记录态（§5 原文在册，不追改）。

**越层补登**：`thincoder-desktop/test/views-activity.test.mjs`（**339** 实读 2026-09-28——本批测试面触碰所致）补登至 `docs/desktop/design/PROJECT.md` §4.1 越 300 段（预案 = 池面用例拆分〔档名实施批定〕）。

**结算**：台账 #477 / #478 → 已核销（证据行 = 本 §6 + `366bab1f`）；前批遗留 = 无。
