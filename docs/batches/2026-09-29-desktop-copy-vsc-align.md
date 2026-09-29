# 2026-09-29 · desktop-copy-vsc-align
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 02:51–03:03 走查裁定（右键编辑菜单缺位 + 两枚 ⧉ 摘除）——台账 #557 / #558。
> 台账 = #557 + #558（桌面端 · 归批）。前情 = docs/batches/2026-09-27-desktop-chat-panel-b.md §1（已收口 2026-09-27）——两枚 ⧉ 控件出身批（本批摘除对象）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-29 走查裁定 · 两件）**：

① **右键编辑菜单缺位补齐**（台账 #557）：桌面全仓零右键实现（`thincoder-desktop/**` + `thincoder-render-core/**` 零 `context-menu` ∕ `contextmenu` ∕ `Menu.popup` 命中；Electron 无默认右键菜单）⇒ 选中文本 ∕ 输入框的右键复制粘贴均不可用；VSC 侧右键 = VS Code 宿主自带（扩展零代码）⇒ 对齐 = Electron 宿主层补标准编辑菜单。用户原话（02:59）：「我希望跟vsc对齐，而且vsc是可以选中文字然后用鼠标右键复制的，但是在desktop端，甚至在输入框里都不能用右键复制粘贴。」

② **两枚 ⧉ 控件摘除**（台账 #558）：桌面自建复制面（消息块尾 ∕ 输入区尾两控件 + `⧉` 字形）按 VSC 口径摘除——只留 VSC 对位的核件代码块 Copy 文字钮。裁定链 = 02:51「为什么连会话面板的右下角都有个复制图标」→ 02:54「vsc啥时候有过长成这样的复制图标？」→ 02:59「我希望跟vsc对齐」→ 03:03「对的」。出身备查 = 批 B（`docs/batches/2026-09-27-desktop-chat-panel-b.md:34-36` 建控件 · 当时对话流纯文本）+ `2026-09-27-desktop-visible-face-fix` 补 CSS 自选字形——本项 = 对齐口径对自建面的反转。

**条目表**：

| # | 条目 | 需求侧 | 判据载体 |
|---|---|---|---|
| 1 | 右键编辑菜单（选中 ∕ 输入框） | 需求 §4 **D27**（已落——`docs/desktop/requirements/PROJECT.md:172`） | 本档 §2；真机右键读数（菜单弹出 + 剪贴板往返） |
| 2 | 两枚 ⧉ 摘除 | 需求 §4 **D13**（已收正——「代码块复制」单留，`:158`） | 本档 §2；真机零残留读数 |

**已知事实（设计免探 · 实勘坐标 · as-of 2026-09-29 03:0x）**：

- 右键面：零实现全貌；现存唯一编辑线 = `src/main/window.mjs:60-75` `buildMenu()`（Edit 组 Chromium roles：undo/redo/cut/copy/paste/selectAll——键盘面）+ `:116` `win.setMenu(buildMenu())`；窗口 `webPreferences` = `contextIsolation:true · sandbox:true · nodeIntegration:false · preload`（`:110-115`）。
- 复制面（摘除物全清单）：`renderer/views/chat-copy.mjs`（`copyBlockNode` `:82-92` · `data-action="chat:copy-block"` ∕ `lastCopyNode` `:100-113` · class `chat-copy-last`）· 字形唯一落点 `renderer/chat-composer.css:54`（`.chat-copy-block::before, .chat-copy-last::before { content: "⧉" }`）+ 四态 `:45-70` + 尾锚右对齐 `:38-41` · 挂点 `[data-composer-tail]`（`renderer/mount-composer.mjs:9`）· 窄刷 `renderer/composer-sync.mjs:126-144`（`syncLastCopy`）· 消费位 `renderer/views/chat-text.mjs:56` ∕ `:85-86` · `renderer/views/chat.mjs:173` ∕ `:211` · i18n 两键 `chat.action.copy` ∕ `chat.action.copyLast`（`renderer/i18n.mjs:112-115` ∕ `:270-273`）。
- 保留物：核件代码块 Copy 钮（`thincoder-render-core/flow/stream.mjs:95-113` `attachCopyButtons`；桌面挂点 `renderer/views/chat.mjs:249-255`）——零动。
- 选中面未禁：`user-select:none` 仅三处 chrome 元件（`renderer/core.css:41` ∕ `:109` · `renderer/chrome.css:110`）；正文与输入框可选。
- VSC 对位基准：VSC 复制面穷尽 = 代码块 Copy（`webview/history.js:51` 注「code-block copy buttons only」）；右键 = 宿主原生（`thincoder-vscode/**` 零 contextmenu 代码）。

**边界**：VSC 侧零改（对位基准）· 核件零改（Copy 钮保留）· 应用菜单 Edit 组 roles 不动（键盘面保留）· 外壳 ∕ 主题 ∕ 其余可见面零动 · 测试面随全清令（2026-09-28 23:18）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）· 他在途批写域避让（工作树并发改动在册——本批实施面收在 window.mjs ∕ 新宿主档 + 复制控件族）。

**链**：§2 设计 → §3 评审（用户点火）→ §4 批准 → §5 实施 → §6 收口。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 4（#107 · 发现 1–5）逐号落毕（5/5）· 「全清令」措辞族终扫轮落定（六处 + 本扫同族五处 = 11 处——见 §2.13）· 2026-09-29）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**：

| # | 条目 | 需求侧 | 判据载体 | 设计单源 |
|---|---|---|---|---|
| 1 | **右键编辑菜单**（选中文本 ∕ 输入框——Electron 宿主层补齐） | §4 **D27**（新行 · `thincoder/docs/desktop/requirements/PROJECT.md:172`） | 真机右键读数（菜单弹出 + 剪贴板往返）；T-DSK47 | `docs/desktop/design/UI.md` §1「本批注（复制面对齐 VSC · 2026-09-29）」项 1 · `docs/desktop/design/PROJECT.md` §2 **KD-43** · `docs/desktop/design/SHELL.md` §2「右键编辑菜单」行 |
| 2 | **自建复制面两控件摘除**（⧉ 块级 ∕ 末条退场——核件代码块 Copy 钮单留） | §4 **D13**（收正句 · `:158`） | 真机零残留读数（**判据域 = 代码树**：`thincoder-desktop/**` ∕ `thincoder-render-core/**`——`docs/` 除外；`⧉` 零命中 ∧ 代码块 Copy 钮仍在）；T-DSK30 收正面 | `docs/desktop/design/UI.md` §1 本批注项 2 · `docs/desktop/design/PROJECT.md` §2 **KD-22**（收正）· §1「批 B 注」项 4（就地收正） |

**不在本批（边界）**：应用菜单 Edit 组 roles（键盘面保留 · 零动——其文案 en-only 债 = 台账 #533 另处理）· 核件 `attachCopyButtons`（保留物零动）· VSC 侧 ∕ `thincoder-core` 零改（对位基准 / 核机制只住核）· 测试面（全清令 2026-09-28 23:18）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）· 链接 ∕ 图片类右键条目（D27 射程外——禁自造）。

**机制设计（一）右键编辑菜单（D27 · 宿主面）**：

- 机制 = `win.webContents.on("context-menu", (event, params) => …)` ⇒ 按 `params` 构模板 ⇒ `Menu.popup({ window })`（Electron 无默认右键菜单——零实现即零菜单）。
- **条目集**（纯函数 `contextMenuTemplate(params, labels)`；空数组 ⇒ 不 popup）：`params.isEditable` ⇒ **剪切 ∕ 复制 ∕ 粘贴 ∕ 全选**（序 = cut → copy → paste → selectAll；`enabled` 取 `params.editFlags` 对应值——缺键不禁用）；非编辑 ∧ `selectionText` 非空 ⇒ **复制 ∕ 全选**；非编辑 ∧ 空选 ⇒ **零菜单**（不出）。
- 行为 = Chromium role 四件（`cut` / `copy` / `paste` / `selectAll`）。**沙箱判据句**：role 执行径 = 主进程 `webContents` 方法（实读 Electron v44.4.5 `lib/browser/api/menu-item-roles.ts` `webContentsMethod`）⇒ `contextIsolation:true · sandbox:true · nodeIntegration:false` 下可用性成立（与既有键盘面 Ctrl+C/V 同径——不经渲染面 Node ∕ 权限面）。
- **文案面** = **显式 `label` 取词表四键**：`menu.edit.cut` ∕ `menu.edit.copy` ∕ `menu.edit.paste` ∕ `menu.edit.selectAll`（住 `thincoder-desktop/renderer/i18n.mjs` 宿主表；en = `Cut` / `Copy` / `Paste` / `Select All` ∥ zh = `剪切` / `复制` / `粘贴` / `全选`）。读音 = 主进程 `loadConfig().locale` **现读**（右键时刻——语言切换即时随动；读失败 ⇒ 回落 en + `console.error`——零静默）；主进程直取词表 = `thincoder-desktop/src/main/attachments.mjs:37-41` 先例。**不采 role 默认文案**（实读 Electron v44.4.5 `menu-item-roles.ts`：默认文案 = 英文硬编码字面 ⇒ 直采即 `#533` 式 en-only 债）。
- 落点 = **新档 `thincoder-desktop/src/main/context-menu.mjs`**（两纯函数 · 零 `electron` ⇒ 平 node 直测）+ `thincoder-desktop/src/main/window.mjs`（`createWindow` 内落子 + `loadConfig` 现读）。**为什么新档 / 与 `buildMenu()` 的关系**：`window.mjs` = electron 落子档（处理体出档先例 = `session-maintenance.mjs`——"处理体零 electron、本档只做落子"）；纯函数出档 ⇒ 可平 node 直测；`window.mjs` 191 ⇒ ≈214（≤300 臂内）。两菜单**两事不混**：`buildMenu()` = 窗口应用菜单（`win.setMenu`；Edit 组 roles 零动）；右键菜单 = 每弹独立模板（共 `Menu` 面，不共模板）。
- 边界：零 IPC ∕ 零白名单项 ∕ 零新通道（主进程本地面）。

**机制设计（二）两控件摘除（D13 收正）**：

- **当前复制面 = 核件代码块 Copy 钮（唯一）**：`pre.code-block` 内 `.code-copy-btn`（核件 `attachCopyButtons`；词键 `msg.copy` / `msg.copied` = 端供给面，值同 VSC）；桌面挂点 = `thincoder-desktop/renderer/views/chat.mjs` `attachCodeCopies`（重挂 / 帧尾两调用点）——**零动**。
- **摘除物全清单（零残留为判据）**：① `thincoder-desktop/renderer/views/chat-copy.mjs` **整档删**（`blockTextOf` 迁 `thincoder-desktop/renderer/views/chat-text.mjs`——其唯一剩余消费者 = 文本面与就地更新判据）；② 块尾 ∕ 推理块尾 ∕ 错误块尾 `data-action="chat:copy-block"` 控件（`views/chat.mjs` ∕ `views/chat-text.mjs` 三处调用点摘除）；③ 输入区尾 `chat:last` 控件 + `[data-composer-tail]` 挂件锚（`mount-composer.mjs` 槽形三件 ⇒ 两件）；④ `thincoder-desktop/renderer/chat-composer.css` 两控件族 + `⧉` 字形（`content`）规则 + 两交互态成员；⑤ i18n 两键 `chat.action.copy` ∕ `chat.action.copyLast`（两语同退）；⑥ `thincoder-desktop/renderer/app.mjs` `writeText` 单点供给（消费者归零随退）+ `mount-composer.mjs` ∕ `composer-sync.mjs` 的 `writeText` / `tailOf` deps 与 `syncLastCopy` 族。
- **保留物**：`data-raw` 锚（就地更新判据面——`patchTextBlock` 值变比较仍消费，非复制取文源）· 核件 Copy 钮族与两调用点。
- 判据：**D13 真机零残留**（**判据域 = 代码树**：`thincoder-desktop/**` ∕ `thincoder-render-core/**`——排除 `docs/`；设计档自身携带字面）——`⧉` 零命中 ∧ `chat:copy-block` ∕ `chat:last` ∕ `chat.action.copy` 零命中 ∧ `views/chat-copy.mjs` 不存在 ∧ 代码块 Copy 钮仍在且点按可复制（往返）；**布局残面** = 输入区槽形三件 ⇒ 两件（提示锚 + 核件面板子树），尾锚移除后无残高 / 无残留 CSS（`[data-composer-tail]` 规则随摘）。

**受影响文件与「现行 ⇒ 预期」（实读 2026-09-29 · 内容行数口径）**：

| 文件 | 现行 ⇒ 预期 | 构成 |
|---|---|---|
| `thincoder-desktop/src/main/context-menu.mjs`（新） | — ⇒ ≈65 | `contextMenuLabels(locale)` + `contextMenuTemplate(params, labels)`（零 electron） |
| `thincoder-desktop/src/main/window.mjs` | 191 ⇒ ≈214 | `context-menu` 落子（`Menu.buildFromTemplate(…).popup({ window })`）+ `loadConfig` 现读 + 档头注 |
| `thincoder-desktop/renderer/views/chat-copy.mjs` | 113 ⇒ **删档** | 两控件族退场；`blockTextOf` 迁出 |
| `thincoder-desktop/renderer/views/chat-text.mjs` | 126 ⇒ ≈131 | `blockTextOf` 迁入；`copyBlockNode` 两调用点摘除；`data-raw` 注释改述 |
| `thincoder-desktop/renderer/views/chat.mjs` | 365 ⇒ ≈361 | `copyBlockNode` 引调三处摘除 |
| `thincoder-desktop/renderer/mount-composer.mjs` | 238 ⇒ ≈230 | 尾锚 ∕ `writeText` ∕ `tailOf` 摘除（槽形三件 ⇒ 两件） |
| `thincoder-desktop/renderer/composer-sync.mjs` | 210 ⇒ ≈188 | `syncLastCopy` 族摘除（`writeText` / `tailOf` deps 随退） |
| `thincoder-desktop/renderer/app.mjs` | 276 ⇒ ≈268 | `writeText` 单点供给摘除（消费者归零） |
| `thincoder-desktop/renderer/chat-composer.css` | 71 ⇒ ≈55 | 两控件族 + `⧉` 字形 + 尾锚规则摘除 |
| `thincoder-desktop/renderer/i18n.mjs` | 473 ⇒ **≈482**（实落 482——以盘为准〔实读 2026-09-29〕；净量复算 = 退两键 × 2 语 −4 行 + 增四键 × 2 语 +8 行 + 两语注释块 ∕ 链记录行 +5——合计净 +9） | 退两键 × 2 语（−4 行）+ 增四键 × 2 语（+8 行）——键面净 +2 键 ∕ 行面净 +4 行；键数链随动 = `HOST_DICT` 合并表 **267 ⇒ 269**（实读基数 2026-09-29：HOST_DICT 267 ∕ VIEWS_DICT 106 ∕ COMPOSER_DICT 28） |
| 测试面 | **零改** | 全清令 2026-09-28 23:18：**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件；现存测试树零引用两控件——实读核对：`test/**` 对 `chat-copy` / `chat:copy-block` / `chat:last` 零命中）；机检口径（两纯函数平 node 直测）之测试件**已落 = 批次本地件惯例**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs`——名随批次档 · 住 `docs/batches/` · 不登记 · 随批留存——单源 = `docs/batches/2026-09-28-test-layer-prompts.md` §1.15–§1.23）；验收 = 设计判据句 + 真机走查由父侧闭合 |

**设计档落点（五档 · 本轮就地更新 · 已落）**：`docs/desktop/design/UI.md`（新增本批注四项 + 六处反转句收正：「批 B 注」项 4 重写 ∕ 对话流 ∕ 输入区两行行内指针 ∕ 「批 B 追加注」项 1 死先例 ∕ 「可见面修复」项 1（控件族句收正 + ⧉ 字形句删 + 判据句）∕ 「D17 / D19」项 2 与「对齐第二批」项 4 的 `data-raw` 句 ∕ 「D24」项 1 控件族 11 ⇒ **8** + 项 2 hover 理由句）· `docs/desktop/design/SHELL.md`（§1 树 `context-menu.mjs` 行 + `window.mjs` 行；`views/` 行去 `chat-copy.mjs`；`mount-composer.mjs` 行去末条句；§2 增右键菜单行）· `docs/desktop/design/PROJECT.md`（§2 KD-22 收正 + KD-43；§4.1 增 ∕ 去行；§4.2 本批块；§6.1 表头 D1–D27 + D13 行 + 本批验收注；§7 T-DSK30 收正 + T-DSK47；§9；§10 AN 收正 + BU / BV / BW；变更记录）· `docs/desktop/design/RENDERER.md`（§1.1 引导节点条死先例重锚）· `docs/desktop/design/IPC.md`（档头 D1–D27——零通道面）；五档档头同拍 **D1–D27**（`SHELL.md:4` 待收项同批销 = §10 AN）。

**验收对照（逐条判据句 · 点回需求）**：

- **D27**：① 机制在场 = `window.mjs` 挂 `context-menu` 事件 + `context-menu.mjs` 两纯函数（机检面 = 两纯函数平 node 直测口径：三语境条目集 ∕ `editFlags` 启用径 ∕ 两语词值；测试件**已落 = 批次本地件惯例**——载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑）；② 真机 = 选中文本 ⇒ 右键 ⇒ 菜单出「复制」⇒ 点按 ⇒ 剪贴板 = 选中文本逐字（**往返**：粘回输入框可见）；输入框 ⇒ 右键 ⇒ 四件在场（剪切 ∕ 复制 ∕ 粘贴 ∕ 全选；`enabled` 随 `editFlags`——空输入 ⇒ 剪切 ∕ 复制禁用 · 粘贴可用）；③ 边界 = 非编辑区空选 ⇒ **零菜单**；④ 文案 = zh 下四字（`locale` 现读随动）；真机走查 = 父侧真跑闭合（D16 义务）+ T-DSK47。
- **D13**：① **判据域 = 代码树**（`thincoder-desktop/**` ∕ `thincoder-render-core/**`——排除 `docs/`）：`⧉` 零命中 ∧ `chat:copy-block` ∕ `chat:last` ∕ `chat.action.copy` ∕ `chat.action.copyLast` 零命中 ∧ `views/chat-copy.mjs` 不存在；② `pre.code-block` 内 `.code-copy-btn` 仍在 + 点按 ⇒ 剪贴板收代码文本（词两态 `msg.copy` → `msg.copied`）；③ 输入区槽形两件（提示锚 + 核件面板子树）+ 尾锚规则零残留；真机零残留读数 + T-DSK30 收正面。

**关键决策（本批 · 单源 = `docs/desktop/design/PROJECT.md` §2）**：**KD-43**（右键编辑菜单 = 宿主面职责；条目集随语境；role 行为 + 词表显式文案——**被否**：role 默认文案（en-only 债复刻）∕ 渲染面自建 HTML 菜单 ∕ 非编辑空选给菜单 ∕ 链接图片类条目）× **KD-22 收正**（复制面 = 核件代码块 Copy 钮唯一——被否：自建第二复制面 ∕ 真代码块取文面端侧重实现）。

**上抛项 / 不确定项（登记 = `docs/desktop/design/PROJECT.md` §10）**：

- **BU（差异 · 待裁）**：VSC webview 右键菜单实况（本机 VS Code 构建实读：`WebviewContext` 菜单注册 = **剪切 ∕ 复制 ∕ 粘贴三件、无「全选」**；门 = `preventDefaultContextMenuItems`）⟷ 桌面按 D27 逐字落语境化集合（可编辑四件 ∕ 选中两件 ∕ 空选零菜单）——差异两处：①「全选」项（D27 有 ∕ VSC 无）②空选非编辑（桌面零菜单 ∕ VSC 注册面恒列三件）；消解路 = 走查比对后按用户口径裁（需求档笔权 = 主 agent）。
- **BV**：`T-DSK47` 用例号自铸披露（并号裁定权 = 父侧）。
- **BW**：主进程原生菜单文案族——本批只保新面不复制 #533 债（右键菜单两语随 `locale`）；维护面文案 zh/en = #533 另行处理。

**边界（不做）**：应用菜单 Edit 组 roles 不动 · 核件 Copy 钮族零改 · VSC ∕ 核两树零改 · 其余可见面零动 · 测试面（全清令）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件） · 不做链接 ∕ 图片类右键条目 ∕ 不做右键菜单的平台特化（macOS services 等）。

### 2.9 修正轮（评审轮 1 · 发现 1–8 逐号处置 · eng-designer · 2026-09-29）

**输入** = 本档 §3 轮次 1（VERDICT: pass · 🔴0 ∕ 🟡6 ∕ 🔵2 = 8 条）+ 父侧逐条裁定（1–7 接受并逐号点修；8 缓办——待用户裁）；**处置执行 = 本舱**；**零新语义（= 归一 ∕ 澄清 ∕ 去重）**；需求档 ∕ 测试面 ∕ 核件 ∕ VSC 树零触。**一切行数按盘实读 2026-09-29（同一次按盘）为准**；坐标 = 本轮 read-back 实读（并发写者在动——按内容复核）。

| 号 | 落点（file:line） | 态 |
|---|---|---|
| 1 · 🟡 行数账归一 | `docs/desktop/design/PROJECT.md` §4.1 六行按盘收正——`window.mjs` **177 ⇒ 191**（`:148`）· `renderer/views/chat.mjs` **354 ⇒ 365**（`:196`）· `renderer/mount-composer.mjs` **322 ⇒ 238**（`:214`）· `renderer/app.mjs` **299 ⇒ 276**（`:180`）· `renderer/i18n.mjs` **489 ⇒ 473**（`:193`）· `renderer/views/chat-text.mjs` **132 ⇒ 126**（`:225`）（as-of 同拍 2026-09-29）；越层段两值同拍（`i18n` ⇒ **473** ∕ `chat.mjs` ⇒ **365**，`:240` ∕ `:241`）+ 两档除名（`mount-composer`（原 `:240` 位）越层除名 ∕ `app.mjs` 贴层除名（`:243`）——按盘实测回落 ≤300）；§4.2 本批块现值同盘（`:517`–`:527`）；**本档** `:53` 192 ⇒ **191** | 落定 |
| 2 · 🟡 缺行补登 | `docs/desktop/design/PROJECT.md` §4.1 补两行——`renderer/composer-sync.mjs` **210**（`:216`）· `renderer/chat-composer.css` **71**（`:229`）（含未越 300 状态）；**去重复核** = 他处零已登记行（勿双行）；`docs/desktop/design/SHELL.md` §1 树 = 部分索引（非受影响文件账——零改） | 落定 |
| 3 · 🟡 D24 计数归一 | `docs/desktop/design/UI.md:272` 控件族 **11 ⇒ 8 选择器** + `docs/desktop/design/PROJECT.md:582`（D24 行）同笔收正（8 = 现值；11 之历史归 UI.md 变更记录 `:643` 行——规范面零残句） | 落定 |
| 4 · 🟡 判据域写死 | D13 零残留判据域 = **代码树**（`thincoder-desktop/**` ∕ `thincoder-render-core/**`——排除 `docs/`；设计档自身携带字面）——**本档** `:43` ∕ `:61` ∕ `:84` + `docs/desktop/design/UI.md:493` 同拍 | 落定 |
| 5 · 🟡 越层处置句 | `docs/desktop/design/PROJECT.md` §4.2 两行补——`renderer/views/chat.mjs`（`:521`）**续期说明**（本批摘除型小改未拆；消解窗口 = 该档下次被触碰的批）+ `renderer/i18n.mjs`（`:526`）**续期说明**（第二档 `i18n-views.mjs` 已落 · 本体余族续期；同窗） | 落定 |
| 6 · 🔵 机检载体 | 自相抵消除（「机检面 = 随批单元证据」⟷「不交付测试档」）——**本档** `:77` ∕ `:83` + `docs/desktop/design/PROJECT.md:600–:601` + `docs/desktop/design/UI.md:494`③ 同拍改述：机检 = 两纯函数平 node 直测**口径**；**本批零测试件**（全清令）⇒ 现状载体 = 设计判据句；**测试件留待 = 批次本地件惯例**（名随批次档 · 住 `docs/batches/` · 不登记 · 随批留存——单源 = `docs/batches/2026-09-28-test-layer-prompts.md` §1.15–§1.23）；零测试件实建 | 落定 |
| 7 · 🔵 行内指针 | `docs/desktop/design/UI.md:19`（输入区行）补**行内指针**（尾控件 ∕ `[data-composer-tail]` 尾锚退场 → 本批注项 2）——「设计档落点」句随实转真（本档 `:79` ∕ `UI.md` 变更记录行零改） | 落定 |
| 8 · 🟡 缓办 | 父侧裁定——本轮不修：D27 条目集「全选」项待用户裁（`docs/desktop/design/PROJECT.md` §10 **BU** 在册；批准时一并裁）；T-DSK47 断言与 BU 行零动 | 缓办（照登） |

**同族收正（机检口径 · 零语义）**：本批新档 token 三处补 ∕ 正「拟新增」标记（`PROJECT.md:83`（KD-43 行）· `PROJECT.md:517`（§4.2 行——去粗体）· `UI.md:495`（计数行））⇒ 机检转「拟新增——列报 · 不入闸」；本舱变更记录行 token 全形化（`PROJECT.md:1073–:1077` ∕ `UI.md:643` ∕ `SHELL.md:181`）。

**自检（同文档内同档只存一个「现行」值）**：

| 档 | 现值（实读 2026-09-29） | PROJECT.md 在册处（一致） | 本档表同值 |
|---|---|---|---|
| `window.mjs` | **191** | §4.1 `:148` ∕ §4.2 `:518` ∕ 变更记录 `:1073` | ✓ `:68` |
| `renderer/views/chat.mjs` | **365** | §4.1 `:196` ∕ 越层段 `:241` ∕ §4.2 `:521` ∕ 变更记录 | ✓ `:71` |
| `renderer/mount-composer.mjs` | **238** | §4.1 `:214` ∕ §4.2 `:522`（越层段已除名）∕ 变更记录 ∕ SHELL `:48` | ✓ `:72` |
| `renderer/app.mjs` | **276** | §4.1 `:180` ∕ §4.2 `:524`（贴层已除名）∕ 变更记录 | ✓ `:74` |
| `renderer/i18n.mjs` | **473** | §4.1 `:193` ∕ 越层段 `:240` ∕ §4.2 `:526` ∕ 变更记录 | ✓ `:76` |
| `renderer/views/chat-text.mjs` | **126** | §4.1 `:225` ∕ §4.2 `:520` ∕ 变更记录 | ✓ `:70` |
| `renderer/composer-sync.mjs` | **210** | §4.1 `:216`（补行）∕ §4.2 `:523` | ✓ `:73` |
| `renderer/chat-composer.css` | **71** | §4.1 `:229`（补行）∕ §4.2 `:525` | ✓ `:75` |

**变更记录行同笔**（三档各一行）：`UI.md:643` · `SHELL.md:181` · `PROJECT.md:1073–:1077`。

**机检（`node scripts/doc-check.mjs` · 交付前跑 · 本舱面逐行核）**：本舱新增 ∕ 修改行**零新增悬空、零新增超宽**（三处按「分句断行」收正——零语义）；本批新档 token 三处悬空转「拟新增——列报」（悬空 168 ⇒ 166 之可归因部分）。全局 FAIL 读数为存量（悬空 166 ∕ 行宽 18）；其中本批**设计轮**遗留超宽 3 行（`PROJECT.md:1069` 531 字符 ∕ `SHELL.md:180` 304 ∕ `UI.md:640` 505——前轮行，是否分句断行归父侧裁，本舱只报）。**read-back**：四档逐处核过（PROJECT.md §4.1 全表 ∕ 越层段 ∕ §4.2 块 ∕ §6.1 ∕ 变更记录；UI.md 输入区行 ∕ D24 计数行 ∕ 本批注 ∕ 变更记录；SHELL.md 树行 ∕ 变更记录；本档 §2 表 ∕ 判据句——逐处上下文核读）。

**边界说明（只报）**：① `PROJECT.md:196` 行「复制面对齐批**已删档**」——盘上 `views/chat-copy.mjs` 在（113 行；删档 = 实施轮动作）⇒ 表述口径（改「本批删档」与否）归父侧裁（本舱未动）；② 越层段 `views/chat.mjs` 条目无逐档拆分预案句（`:196` 称「预案见越层段」而越层段该条未载预案）——存量缺口，归回填轮；③ `docs/desktop/design/SHELL.md` §4.1 实读指针与现盘漂移（例：`mount-head.mjs` 树注 **147** ↔ §4.1 **155**；`mount-settings.mjs` 树注 **426** ↔ §4.1 **499**）——非本批触碰档（本批零触），归回填轮；④ 并发在册：PROJECT.md ∕ UI.md 另有活跃实例写意图（窗队列对齐批 · 台账 #564——面互斥，read-back 已核本舱行在位）。**除 1–7 号落点 + 同族收正外零扩面；上抛零新增。**

### 2.10 修正轮 2（评审 #58 · §3 轮次 2 · 发现 1–8 逐号处置 · eng-designer · 2026-09-29）

**输入** = 本档 §3 轮次 2（VERDICT: changes-required · 🔴1 ∕ 🟡5 ∕ 🔵2 = 8 条）+ 父侧逐条裁定（发现 1 取「按盘面收正」一侧；发现 8 = 零动作）；**处置执行 = 本舱**；**零新语义**（= 按盘收正 ∕ 数值回填 ∕ 补行 ∕ 表头注）；需求档 ∕ 测试件 ∕ 产品码 ∕ 其它批射程零触。
**行数口径** = 内容行数（文末换行不计——同 §4.1 表头声明口径）；一切值按盘实读 2026-09-29（同一次按盘）；坐标 = 本轮 read-back 实读（并发写者在动——按内容复核）。

| 号 | 处置（file:line · 实读 2026-09-29） | 态 |
|---|---|---|
| 1 · 🔴 账本警示面同值收正 | 按盘面取「下拉首行 ∕ `div.session-ledger-notice` ∕ `chrome.css`」侧，四处同笔、旧述删净：`docs/desktop/design/UI.md` 本批注项 2（`:214-215`——「会话区末子 ∕ `[data-section="sessions"]` ∕ `.rail-ledger-notice` ∕ `styles.css`」全去，改「下拉首行 ∕ `div.session-ledger-notice` ∕ `.session-ledger-notice` 单规则（`padding: 6px 10px` · `opacity: 0.7`）· `chrome.css:222`」）+ 同注会话控制面行（`:27` 补 `div.session-ledger-notice` 同值）；`docs/desktop/design/IPC.md:170`（「渲染面左列账本警示行」⇒「会话控制面下拉首行账本警示注记（`div.session-ledger-notice`）」）；`docs/desktop/design/PROJECT.md:620`（D23 行「左列会话区末位 dim 注记」⇒「会话控制面下拉首行 dim 注记」）。**同机制同族同笔**：`PROJECT.md:708`（T-DSK40 行：`[data-section="sessions"]` 末子 ∕ `[data-list="sessions"]` ⇒ 下拉首行 ∕ `.session-item` 计数）· `PROJECT.md:430`（§4.1 账本批落值行：`.rail-ledger-notice` 旧述 ⇒ `.session-ledger-notice` 现值）· `docs/desktop/design/E2E-TESTING.md:127`（§3.6 第 4 步）∕ `:180`（§6 T-DSK40 行）同拍。**互证**：全档 grep `rail-ledger-notice` ∕ `[data-section="sessions"]` ∕ `[data-list="sessions"]` = 零命中 | 落定 |
| 2 · 🟡 全表数值实读回填 | `PROJECT.md` §4.1 主表逐档按盘复测、按盘收正约 45 行（实读 2026-09-29——例：`events.mjs` 497⇒**246** · `mount-settings.mjs` 499⇒**151** · `chat.css` 479⇒**312** · `i18n-views.mjs` 68⇒**282** · `agent-bridge.mjs` 257⇒**333** · `store.mjs` 328⇒**298** · `settings-sections.mjs` 356⇒**223** · `app.mjs` 276 一致 · `window.mjs` 191 一致 · `views/chat.mjs` 365 一致 ……）；口径注：父侧给定五值（`events.mjs` 247 ∕ `chrome.css` 445 ∕ `chat.css` 313 ∕ `i18n-views.mjs` 283 ∕ `agent-bridge.mjs` 334）为「读示口径」（文末空行 +1）——本表按统一内容口径落值。`styles.css` 行（档已不存在）⇒ 拆 `theme.css` **89** ∕ `chrome.css` **444** ∕ `skin.css` **13** 三行（R13 四拆分产）；`composer-send.mjs` 行（档已不存在）⇒ `composer-wire.mjs` **167** 行；越层段 ∕ 在册例外段全段按盘重写（见号 4）；§4.2 本批块九值复核一致（零改） | 落定 |
| 3 · 🟡 缺行补登 | §4.1 补行 **38**（实读值 + 一行职责）：发现清单 **28**（`events-blocks` ∕ `events-slices` ∕ `events-status` ∕ `events-wake` · `composer-wire` · `i18n-composer` · `mount-settings-{reads,exits,segments,segments-models}` · `views/{statusline-segments,settings-agent,settings-controls,settings-sections-{env,mcp,models,tools},goal}` · `src/main/{at-complete,exec-run,prompt-injections,settings-values}` · CSS `theme ∕ skin ∕ chrome ∕ chat-fixes ∕ core-markdown ∕ chat-cards`）+ 同族漏登 **10**（`events-flags` ∕ `questions` ∕ `views/{activity-new,pool-subagents,compress-status}` ∕ `src/main/{config-watch,index-status,session-flags,settings-env,settings-tools}`）；
  表头补纪律行「**新档落盘随批登记**」（`PROJECT.md:141`）；`docs/desktop/design/SHELL.md` §1 树同步——CSS 行全量（11 档 + `index.html`）· `views/` 行全量重写（R13 退场档除名）· `src/main/` 补 19 档（本清单 + 既往漏登）· 渲染面根 12 档补入 | 落定 |
| 4 · 🟡 越层无预案 | `chrome.css` **444** 档（未入册）与 `agent-bridge.mjs` **333** 档（原记 257、无预案）补拆分预案并入册——`chrome.css` = 按面拆档（会话控制面条段 ∕ 状态行段 ∕ 骨架段——与 `chat.css` ∕ `pool.css` 先例同形）；`agent-bridge.mjs` = 协议行解析 ∕ 事件映射族出档（新档名实施批定）；越层段按盘收正为**六档**（`i18n.mjs` 473 ∕ `chrome.css` 444 ∕ `mount-sessions.mjs` 400 ∕ `views/chat.mjs` 365 ∕ `agent-bridge.mjs` 333 ∕ `chat.css` 312——各带预案 + 消解窗口）；**在册例外归零**（mount-settings 拆档消解）；贴 300 层 = `store.mjs` **298** | 落定 |
| 5 · 🟡 退场面残迹 | `UI.md:14` 断点行 ⇒ **零断点**（R13 消解——去 `styles.css` 调参面句）· `:26` 启动态行 ⇒ 项目钮入口（去左列 ∕ 最近目录列表残句）· `:31` 主题行变量回锚 `theme.css` · `:145` D21 项 2 落点 ⇒ `chrome.css` 会话控制面段（`.session-*`）· `:161-167` 不追面 ①②④⑤⑥⑦ 按 R13 后形态收正 · `:210` 本批注头行锚「左列会话行」⇒「会话控制面」；`PROJECT.md:695` T-DSK27 段序 ⇒ `providers,model,agent,mcp,env,tools,models`（七段）；同笔 `E2E-TESTING.md:87-88`（段集四段 ⇒ 七段） | 落定 |
| 6 · 🟡 单源事实相抵 | ① `PROJECT.md:586` §5 script 行 ⇒ **四条**（补 `start` = `electron .`）+ §4.1 `package.json` 行同笔（`script 四条`；`SHELL.md:14` 原已四条——零改）；② `IPC.md:36` `ev:config` 复读面 ⇒ **七段**（段集单源 = `UI.md` §1 设置面行） | 落定 |
| 7 · 🔵 表头承载注 | `PROJECT.md:594` §6.1 表头补「D26 ∕ D27 表体行未列——以表下两注承载验收面」 | 落定 |
| 8 · 🔵 零动作 | 用户 2026-09-29 04:37 已裁「全选保留」（§4.2 在册——设计原样、KD-43 ∕ T-DSK47 零动）；本舱零动作 | 零动作（照登） |

**read-back 核验**（同轮逐处）：`PROJECT.md`（§4.1 表首纪律行 ∕ `src/main` 九新行组 ∕ 事件族 ∕ CSS 三行 ∕ settings 段体族 ∕ 越层段 ∕ §5 ∕ §6.1 ∕ D23 ∕ T-DSK27 ∕ T-DSK40 ∕ 变更记录）· `UI.md`（`:14` ∕ `:26` ∕ `:27` ∕ `:31` ∕ `:145` ∕ `:161-167` ∕ `:210` ∕ `:214-215` ∕ 变更记录）· `SHELL.md`（§1 树四段 ∕ 变更记录）· `IPC.md`（`:36` ∕ `:170`）· `E2E-TESTING.md`（`:87-88` ∕ `:127` ∕ `:180` ∕ 变更记录）——逐处上下文核读在位；**`rail-ledger-notice` ∕ `[data-section="sessions"]` ∕ `[data-list="sessions"]` 全档零命中**（发现 1 互证）。

**边界说明（只报 · 本舱未动）**：① `styles.css` 死指针残句（未列发现内——约 20 处：`PROJECT.md` §2 KD-29 ∕ §6.1 D21 行 ∕ §10 AL ∕ D21 批块 ∕ §4.1 数处行描述；`UI.md` D21 项 1 ∕ D24 注 ∕ #500 注 ∕ §3 借用项表 `:530-531`）——是否并轮收正归父侧裁；② `UI.md` 其余「左列 ∕ 标签条 ∕ `.rail-*`」旧面引用（`:63-64` ∕ `:98` ∕ `:115` ∕ `:117` ∕ `:135` ∕ `:139-140` ∕ `:149-157` ∕ `:173` ∕ `:231-233` ∕ `:240-249` ∕ `:260`——多为历史批注本体内表述）——本轮只动发现 5 枚举处 + 同笔锚，其余归父侧裁；③ `PROJECT.md:196` 「复制面对齐批**已删档**」表述（盘上 `views/chat-copy.mjs` 在——删档 = 实施轮动作；前轮已报在前）——仍归父侧裁；④ `E2E-TESTING.md` ∕ §7 若干 T-DSK 行「已落」测试档读数（全清令后现盘无档）= 系统性残引，归测试面轮；⑤ `project:recent` 读数落 store 切片而现盘无渲染消费面（`UI.md:26` 已按「项目钮入口」收正——不提「最近列表」）。**除发现 1–8 落点 + 同族同笔外零扩面；上抛零新增；零测试件实建。**

### 2.11 修正轮 3（§3 轮次 3 · 评审 #76 · 发现 1–11 逐号点修）· eng-designer · 2026-09-29

派单 = 11 条逐号落进五档（本单 11 条坐标 + 同笔；残批 gated 面零触）。落笔 = 五档（`UI.md` · `PROJECT.md` · `IPC.md` · `SHELL.md` · `E2E-TESTING.md`）+ 逐档 changelog；回读 = 落毕逐处 context 核过（D6）。

| 号 | 处置 | 落点（file:line） |
|---|---|---|
| 1 🔴 | 驱动路径重锚 = **会话控制面项目钮** `button.session-project[data-action="project:open"]`（`thincoder-desktop/renderer/views/session-control.mjs:112-120`）+ **主进程对话框测试侧替换**（`dialog.showOpenDialog` ⇒ `PROJ`——仅换 OS 对话框层，产品码 ∕ 渲染面零改）；已否：「夹具预置当前项目」（`thincoder-desktop/src/main/projects.mjs:21-25` 内存态、无启动恢复——零产品码改下无通路）、「带 `data-path` 形」（R13 后无该形） | `E2E-TESTING.md` §3.5 步 5/6（:107/:108/:109）· §3.6 步 3（:126）· §6 `T-DSK32`/`T-DSK39`/`T-DSK40` 行（:179 ①/:180 ①/:189 ②）；`PROJECT.md` §7 `T-DSK32`（:722 夹具+②）· `T-DSK39`（:729 ①）· `T-DSK40`（:730 ①）· `T-DSK46`（:734 ①②③） |
| 2 | R13 退役面残引逐处收正 | `UI.md` :29（开面锚）·:63·:64·:65·:98·:115·:117·:135·:136·:139·:140·:173·:344·:531；`IPC.md` :205·:222；`PROJECT.md` D11 (:624)·T-DSK1 (:691)·T-DSK3 (:693+注 :741)·T-DSK11 (:701)·T-DSK20 (:710)·T-DSK25 (:715)·T-DSK26 (:716)·§8 #426 (:795) |
| 3 | **零动作**（非缺口——复核一致）：`ev:flags` 条已由窗队列批修正 #57 落定（`IPC.md:78` 在册；`:51` 计数 23 与 :53–:82 逐条同值） | —（回读 :78/:51） |
| 4 | 改记已落（R8：启动拍 + 120s 周期拍） | `PROJECT.md` KD-38 (:77)·`UI.md` 项 12 (:377)·E 表 ① 销项重编 (:434)；单源 = `IPC.md` §1 `ev:ledger` (:28) |
| 5 | 测试层同步（全清重置后）：集成档行「已落 ⇒ 已退」·`files.mjs` **3**∕`run.mjs` **49**·「机检面」改述批次本地件惯例 | `SHELL.md` §1 树 test/ 行 (:91–:92)；`E2E-TESTING.md` §4（:137–:144·:145·:146·:155）·机检面面（:143/:144/:184）·§6 条尾（:179/:180）·按批读注（:192–:196）；`PROJECT.md` §7 各行（T-DSK27 :717·T-DSK31 :721·T-DSK32 :722·T-DSK33 :723·T-DSK34 :724·T-DSK37 :727·T-DSK38 :728·T-DSK39 :729·T-DSK40 :730·T-DSK42 :731·T-DSK43 :732） |
| 6 | `project:recent` = **无渲染消费面（保留）**（`cwd` 仍消费）；T-DSK2 退场给理由（R13 后无该面——「开即物化」⇒ T-DSK1、「点开即续」⇒ T-DSK32）；D1 验证面随动 | `IPC.md` :122；`PROJECT.md` :692（T-DSK2 转 ❌ 退场）·:614（D1） |
| 7 | P28 补**挂起窗在飞档**：在飞 ⇒ 位标含 `running` ⇒ 可点（中断 = 回合级）；窗空闲 ⇒ `disabled`（点按必付 `idle`）——判据单源 = 位标集 `busyOf`；`suspActiveOf` = 抑制面判据非本键 | `UI.md` :409 |
| 8 | 按盘数值回填 | `queued-input` **73**（`PROJECT.md`:304 · `UI.md`:294/:440）· `i18n-views` **282**（`PROJECT.md`:522 · `UI.md`:432）· `chat-pending` **69** ∕ `chat-subagent` **75**（`PROJECT.md`:468 · `UI.md`:337/:347）· 回调面 **十九回调**（`SHELL.md`:26 · `PROJECT.md`:163 · `IPC.md`:38——bridge 对象 `on*` 键实读 19）；状态词 8 词复核一致（零动作） |
| 9 | 设置入口锚按盘收正（info-row 面已死——`views/` 无档、零 `settings:open` 生产） | `E2E-TESTING.md` :50·:85（`button#settings-btn`——`thincoder-render-core/composer/controls.mjs:51`；close 锚 `thincoder-desktop/renderer/views/settings.mjs:253`）；`UI.md` :29 补锚 |
| 10 | §4 项 4 补 **#517 结算序**（标题 → 落盘 → 读数 → 终局事件 · `turn-face.mjs` `settleTurn`——或指 KD-41） | `SHELL.md` :144 |
| 11 | 档头声明「行数纪律（300 建议 ∕ 500 硬限）只对代码档；纯 `.md` 设计档不受限」 | `PROJECT.md` :10 · `UI.md` :8 |

**同笔（发现 1 连带，坐标内）**：`PROJECT.md` `T-DSK26` 行题名 ∕ 例面按 R13 收正（「关标签」⇒「删会话」+ 末项删除门 `last-session`——口径 = `IPC.md`:163）；`E2E-TESTING.md` §6 `T-DSK32` 行摘要 ∕ `T-DSK46` 行 ②③ 随拍。

**留报（同族样本、不在本单坐标——未触，报父侧裁）**：
- `E2E-TESTING.md` :111 步 8 ∕ :177 摘要句 ∕ :190 ③：`关唯一标签 ∕ tab:close ∕ tabbar.mjs` 径——**R13 后无可达 UI 驱动路**（`session:delete` 末项门：会话数 ≤ 1 拒）；「无活动会话 ∕ `no-session` 引导」面可达性存疑——该步重锚 ∕ 裁剪归父侧裁（同发现 1 族，本单未列坐标）。
- `PROJECT.md` 同类残引未列本单：:325（`views` 左列三态句）·:338（T-DSK26 机检面死档引用）·:413/:418/:541/:749（残余批 §4.1/§4.2 死档行）·:639/:654（D26）·:634（D21 注）·:67（KD-29）·:765（`queued-input.test.mjs` **87** 死档）·:871 BN；`:96x–:97x` 段（记录面）：不动。
- `UI.md` :156（D21 映射表 `.rail-hint` 残句）·:231（`.rail-head` ∕ `.tabbar` 底线句——与残批 #540 面重叠）·:245（#548 面重叠）——未触（避双头）。
- `E2E-TESTING.md` :176（T-DSK27 行四段序残句——本单未列）·:178（「真点最近目录」残句——本单未列）。

**边界**：需求档 ∕ 测试件 ∕ §5 ∕ §6 本轮零触；`src/**` ∕ 渲染面零改（设计档面）；残批 gated 面（#551/#540/#548/#550/#536 ∕ 口径句 4 处）零触。

### 2.12 修正轮 4（§3 轮次 4 · 评审 #107 · 发现 1–5 逐号处置）· eng-designer · 2026-09-29

**输入** = 本档 §3 轮次 4（VERDICT: pass · 🔴0 ∕ 🟡3 ∕ 🔵2 = 5 条）+ 父侧逐条裁定（1–5 接受 · 逐号点修）；**处置执行 = 本舱**；**零新语义**（= 落定证据补记 ∕ 数值复合收正 ∕ 驱动路径裁退与随动 ∕ 复核坐标补载 ∕ 窗口口径收正）；需求档 ∕ 产品码 ∕ 测试件 ∕ §5 ∕ §6 ∕ 其它批射程零触。行数口径 = 内容行数；一切值按盘实读 2026-09-29；坐标 = 本轮 read-back 实读（评审批次列举与现盘行号漂移者逐处注明）。

| 号 | 处置（file:line · 实读 2026-09-29） | 态 |
|---|---|---|
| 1 · 🟡 落定证据覆盖 | ① 评审列举 `PROJECT.md:423`（files.mjs 3 ∕ 22 对）届盘复核 = 行号漂移（现为 ipc ∕ agent-host ∕ session-slots 行）；files.mjs「22」现值读数实位于 `:415`（残余批）∶ `:425`（状态栏对齐）∶ `:437`（账本警示面）三处 §4.2 行 ⇒ 三处同笔补「**现盘 3**（随 2026-09-28 测试树全清重置；实读 2026-09-29）」注；② `E2E-TESTING.md:128`（原列举 `:131`——步表裁退后行移）届盘复核 = **改述已在盘**（「原两单元档随 2026-09-28 测试树全清重置退场——现载体 = 批次本地件惯例」——零「机检面」指向 ∕ 零死档引用）⇒ 依据登记；③ 勾稽表见下 | 落定 |
| 2 · 🟡 i18n 数值复合 | 本档 `:76` 预期列 + `PROJECT.md:567`（§4.2 行）同笔收正 = **≈482**（实落 482——以盘为准；净量复算 = 退两键 × 2 语 −4 行 + 增四键 × 2 语 +8 行 + 两语注释块 ∕ 链记录行 +5——合计净 +9）；构成列拆两算（键面净 +2 键 ∕ 行面净 +4 行） | 落定 |
| 3 · 🟡 E2E 残径裁退 | 届盘核实 = **无可达路**（`tab:close` 全树零命中 ∧ `session-actions.mjs:63` 末项门〔会话数 ≤ 1 拒〕∧ `:67-73` 开项目恒一次 resume 分配）⇒ §3.5 步 8 ∕ 步 9（同路尾步——判据面 = 引导面 `session:create`，随该面失路）**裁退在册冒烟序**：步表重编号（序列 12 ⇒ **10** 步 · 标题 ∕ `:135` ∕ `:174` ∕ `:186-187` 随拍）+ 边界句附依据登记 + `PROJECT.md:723`（§7 T-DSK32 行）③④ 裁退 + ⑤ 重编号 + `PROJECT.md:364`（批 B 行「十二序」）加批时值现读指针（十序）。**代锚候选（会话控制面新建钮 `button.session-new`——`session-control.mjs:85`）经审视不采**：点前 ∕ 点后断言态同值（不可证伪）⇒ 退场给由 | 落定 |
| 4 · 🔵 零动作可追溯 | 状态词复核坐标 ∕ as-of 补载：`PROJECT.md:69`（KD-30）现读 = 零计数句（「入状态词闭枚举」）；单源 = `UI.md:16`（状态词行）= **8 词**闭集（八项列举）· `UI.md:534`（借用项 9）= 8 词；全档 `7 词 ∕ 七词` 命中 = 仅登记 ∕ 记录面（§10 **BN** 码面注释登记 ∕ 两档变更记录行）——规范面零残句 ⇒ 「8 词复核一致（零动作）」成立（依据 = 本轮实读） | 落定 |
| 5 · 🔵 越层窗口口径 | `PROJECT.md:562` ∕ `:567` 两行同笔：记明**本批不拆依据**（`views/chat.mjs` = 摘除型小改 ∕ 净减；`i18n.mjs` = 键面 ∕ 注块 ∕ 链记录行改动——均非结构改动）+ 消解窗口改指**下批触碰该档的批**（= 本批之后首个触碰批；触碰时到期——执行拆分 ∕ 上抛二择） | 落定 |

**勾稽表（发现 1 ③ · 按发现列举逐项 · 届盘实读 2026-09-29）**：

| 发现列举（§3 轮次 3） | 届盘实读 | 态 |
|---|---|---|
| `E2E-TESTING.md:131`「机检面」（行移 ⇒ 现 `:128`） | 改述在盘（「现载体 = 批次本地件惯例」；零指向） | 已在盘（登记 = 上表 1②） |
| `E2E-TESTING.md:143` ∕ `:144` ∕ `:184` | 逐行 = 批次本地件惯例改述 + 原档「已退」（`timer-wake.test.mjs` ∕ `midturn-input.test.mjs` 退场句） | 落定（轮 3 已落） |
| `PROJECT.md` §7 逐行（T-DSK27 `:718` · T-DSK31 `:722` · T-DSK32 `:723` · T-DSK33 `:724` · T-DSK34 `:725` · T-DSK37 `:728` · T-DSK38 `:729` · T-DSK39 `:730` · T-DSK40 `:731` · T-DSK42 `:732` · T-DSK43 `:733`；评审原列 `:701–:703` ∕ `:718` ∕ `:720` ∕ `:729` = 批时号位） | 逐行 = 「机检面 = 批次本地件惯例（原档随全清重置退场）」在盘 | 落定（轮 3 已落） |
| `files.mjs` **3**（§4.1 `:270` = **49 / 3**）∥ **22**（§4.2 三处） | 上表 1①——三处补「现盘 3」注 ⇒ 对闭 | 落定（本轮） |
| `queued-input` **73**（`PROJECT.md:304` ∕ `UI.md:295` ∕ `:441`） | 逐处 = 「已落 · 实读 73（2026-09-29）」 | 落定（轮 3 已落） |
| `i18n-views` **282**（`PROJECT.md:522` ∕ `UI.md:433`） | 逐处 = 「已落 · 实读 282（2026-09-29）」 | 落定（轮 3 已落） |
| `chat-pending` **69** ∕ `chat-subagent` **75**（`PROJECT.md:468` ∕ `UI.md:338` ∕ `:348`） | 逐处 = 「已落 · 实读 69 ∕ 75（2026-09-29）」 | 落定（轮 3 已落） |
| 回调面 **十九回调**（`SHELL.md:26` ∕ `PROJECT.md:164` ∕ `IPC.md:38`） | 三处 = 「十九回调」 | 落定（轮 3 已落） |
| 状态词（KD-30 ∕ `UI.md` 两处） | 上表 4——坐标 ∕ as-of 补载 | 落定 |

**read-back 核验**（同轮逐处）：`E2E-TESTING.md`（§3.5 标题 ∕ 步表（十步无断号）· 边界句 · `:135` ∕ `:174` ∕ `:186-187` 断言面 · 变更记录）· `PROJECT.md`（`:415` ∕ `:425` ∕ `:437` ∕ `:562` ∕ `:567` ∕ `:723` ∕ `:364` · 变更记录）· 本档 `:76`——逐处上下文核读在位；全档「十二序」剩量 = 仅记录面（`E2E-TESTING.md:238-239` ∕ `PROJECT.md:1025–:1028` 变更记录 ∕ `PROJECT.md:364` 已加现读指针）。

**边界说明（只报 · 本舱未动）**：① 评审列举行号与现盘漂移 = 批时号位——本舱按条目身份（T-DSK## ∕ 物件名）勾稽，不逐号追行；② 记录面（变更记录 ∕ §2.9–§2.11 前轮文字 ∕ §3 评审表 ∕ §5）内批时值（「十二序」等）留档不改；③ 同族未列残引照登（§2.11 留报在册——如 `PROJECT.md:339` T-DSK26 机检面死档引用 ∕ §10 BN 码面注释计数）——归父侧裁；④「`no-session` 面无可达路」为上抛级事实（需求 D16 两态引导之 `no-session` 一侧现无可达驱动路）——本舱只登记（E2E 边界句 + 本节），是否另批立「关会话面」归父侧裁。

### 2.13 「全清令」措辞族终扫轮（#126 观察 1–2 收尾 · 父侧派单 · 六处 + 本扫同族五处 · eng-designer · 2026-09-29）

**来源 ∕ 裁定**：父侧派单（#126 观察 1–2 收尾——「已知残余六处一次清至零」+「同族全扫：实读另见同族残余（活动面）⇒ 一并收正并列清单」）。标准限定语 = 「**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存（不入仓套件）**」（单源 = `docs/batches/2026-09-28-test-layer-prompts.md` §1.15–§1.23）。**零新语义**（现况收正 ∕ 限定语补正 ∕ 计数收正）；产品码 ∕ 需求档 ∕ 其它批记录 ∕ 历史冻结面 ∕ 测试件本体零触。

**实况（实读 2026-09-29）**：两批批内件在盘——`docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs`（5 例）· `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（**T1–T9 = 9 例**——T9 系 #564 档 §5.7 增补轮落件；派单 ∕ 在册「T1–T8」为增补前旧值 ⇒ 本轮计数随扫收正）。

**改动（11 处 · 逐处 read-back 核过——落笔后实读坐标）**：

| # | 落点（file:line） | 旧 ⇒ 新 |
|---|---|---|
| 1 | `docs/desktop/design/PROJECT.md:642`（§6.1 D27 行载体 cell） | 「（`context-menu.mjs`——零测试件现状载体）」⇒「（`context-menu.mjs`——**批档本地用例随批留存**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件——全清令：仓套件不写 ∕ 不改 ∕ 不跑））」 |
| 2 | `docs/desktop/design/PROJECT.md:660`（D27 验收注）【同扫】 | 「**测试件留待 = 批次本地件惯例**（名随批次档」⇒「**测试件已落 = 批次本地件惯例**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs`——名随批次档」 |
| 3 | `docs/desktop/design/PROJECT.md:664`（窗队列验收注）【计数收正——件实读 9 例】 | 「（T1–T8）」⇒「（T1–T9）」 |
| 4 | `docs/desktop/design/PROJECT.md:738`（§7 T-DSK48 机检面） | 「（**全清令：不交付测试档**）」⇒「（**批档本地用例随批留存**——载体 = `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（T1–T9） · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑）」 |
| 5 | `docs/desktop/design/UI.md:495`（本批注（复制面对齐）项 3 ③） | 「——本批零测试件（测试件留待 = 批次本地件惯例——不登记 · 随批留存）」⇒「——**批档本地用例随批留存**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件——全清令：仓套件不写 ∕ 不改 ∕ 不跑）」 |
| 6 | `docs/desktop/design/UI.md:504`（本批注（挂起窗径）项 5 边界）【同扫】 | 「测试档随全清令」⇒「测试面（全清令）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）」 |
| 7 | `docs/desktop/design/UI.md:512–:513`（本批注（窗队列）判据项 5） | 「本批零测试件——全清令；载体 = 设计判据句 ∕ 批档 §2.6 AC-1–AC-3」⇒「**批档本地用例随批留存**——载体 = `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（T1–T9） · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑」+ **分句断行**（原行 454 字符超宽 ⇒ 拆 `:512`（252）∕ `:513`（281）——零语义） |
| 8 | 本档 `:45`（§2 不在本批）【同扫】 | 「测试面零交付（全清令 2026-09-28 23:18）」⇒「测试面（全清令 2026-09-28 23:18）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）」 |
| 9 | 本档 `:77`（受影响文件表测试面行） | 「全清令：不写测试档 ∕ 不改 `thincoder-desktop/test/files.mjs` ∕ 不跑测试（现存测试树…）」⇒「全清令 2026-09-28 23:18：**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件；现存测试树…）」+「之测试件**留待 = 批次本地件惯例**（名随批次档」⇒「之测试件**已落 = 批次本地件惯例**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs`——名随批次档」 |
| 10 | 本档 `:83`（验收对照 D27 ①） | 「**本批零测试件**（全清令 2026-09-28 23:18）⇒ 现状载体 = 设计判据句，测试件留待 = 批次本地件惯例」⇒「测试件**已落 = 批次本地件惯例**——载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑」 |
| 11 | 本档 `:94`（§2 边界（不做））【同扫】 | 「不写测试档 ∕ 不改 `test/files.mjs` ∕ 不跑测试」⇒「测试面（全清令）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）」 |

**同笔 changelog**：`docs/desktop/design/PROJECT.md:1152` ∕ `docs/desktop/design/UI.md:654` 各一行（落定随记）。

**机检**（`node scripts/doc-check.mjs` · 交付前 ∕ 后对拍）：悬空 **225 ⇒ 225**（零新增）· 行宽超 300 **42 ⇒ 41**（净 −1 = `UI.md:512` 拆分；本轮新增 ∕ 修改行零新增超宽）· 候选 32151 ⇒ 32161（+10 = 新增件名引用）· 拟新增 30 ∕ 迁移期引文 234 不变。

**残余清单（本扫所见 · 未触——零扩面）**：
① **记录面（不动）**：本档 §2.9 `:107` ∕ §2.10 `:151` 前轮文字 ∕ §3 `:224` ∕ §5 `:350`（批时表述——记录面）；`docs/desktop/design/PROJECT.md:1142` ∕ `docs/desktop/design/UI.md:646` 变更记录行（dated record——现况句以本轮新 changelog 行为准）；
② **其它批记录（禁触面 · 只报）**：`docs/batches/2026-09-29-desktop-window-queue-parity.md` `:201`–`:235` 段（批时收正表 ∕ 观察记录——其 §5.7 已载 T9 终值）· `docs/batches/2026-09-29-desktop-susp-queue.md` `:22` ∕ `:49` ∕ `:266` ∕ `:274` ∕ `:275`（§1 简引 + 该舱自判 ∕ 收正表）· `2026-09-28-desktop-feature-parity.md` ∕ `2026-09-28-desktop-flow-vsc-align.md` 诸行（旧批处置注——批时口径）；
③ **§1（主 agent 笔 · 未触）**：本档 `:30`「测试面随全清令（2026-09-28 23:18）不作交付面」——同族简引，报父侧裁；
④ **其它批射程**：`docs/desktop/design/E2E-TESTING.md:194` ∕ `:195`（flow 批 ∕ R10 处置注「测试面随全清令取消」——前轮在册「归测试面轮」）· `docs/desktop/design/PROJECT.md:650` 悬空 ∕ `docs/desktop/design/UI.md:492` 悬空（测试面轮 ∕ 残批 #540 重锚射程）；
⑤ **观测（低 · 件档头）**：`docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` 档头「跑法」句仍书 `.thincoder/tmp/` 路径（终位已 copy 至 `docs/batches/`；tmp 副本留档在盘——档头未携终位跑法；pair 件档头已携两形）——归件作者 ∕ 父侧。

**边界**：11 处 + 两 changelog 行外零扩面；零测试件新建 ∕ 零产品码 ∕ 零需求档 ∕ 零其它批记录笔。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审发现表（复制面对齐 VSC 批 · 桌面）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file annotations | 🟡 | 同一文档对同批各文件给出互斥「现行」值（皆标实读）：`docs/desktop/design/PROJECT.md:148` window.mjs **177**（实读 2026-09-28）↔ `:517` **191 ⇒ ≈214**（本批块，实读 2026-09-29）；同族——`PROJECT.md:196` chat.mjs **354** ↔ `:520` **365**；`PROJECT.md:214` mount-composer **322** ↔ `:521` **238**；`PROJECT.md:180` app.mjs **299** ↔ `:523` **276**；`PROJECT.md:193` i18n **489** ↔ `:525` **473**；`PROJECT.md:224` chat-text **132** ↔ `:519` **126**；批档内另有 192 ↔ 191（`docs/batches/2026-09-29-desktop-copy-vsc-align.md:53` ↔ `:68`） | 以 §4.1 为单源按同一次按盘实读把两处收正到同一 as-of（§4.1 值列 + 本批 §4.2 块 + 批档 §2 表同步），每档只保留一个「现行」值 |
| 2 | Affected-file annotations | 🟡 | 本批将改动的 `composer-sync.mjs`（**210 ⇒ ≈188**·`PROJECT.md:522`）与 `chat-composer.css`（**71 ⇒ ≈55**·`PROJECT.md:524`）在 §4.2 本批块与 UI 本批注（`UI.md:491`）在册，但 §4.1 值列表（行数预算单源——`SHELL.md:68`）无这两行（`SHELL.md` §1 树亦未列）；同批其余八档皆在册 | 两档补 §4.1 行（含越层状态），或注明未入册理由与入册批 |
| 3 | Document ownership / doc state | 🟡 | D24 注「控件族 11 ⇒ 8 选择器」的收正只落项 1（`UI.md:232` 已 8）；同注计数行 `UI.md:272` 与 `PROJECT.md:581`（D24 行）仍记「控件族 **11 选择器**」——同注两处计数互斥 | 两处 11 ⇒ 8 同笔收正（或注明 11 = 前史值 / 8 = 现值） |
| 4 | Acceptance criteria | 🟡 | D13 零残留判据「**全仓** `⧉` 零命中 ∧ `chat:copy-block` ∕ `chat:last` ∕ `chat.action.copy` 零命中」（批档 `:61` ∕ `:84`；`UI.md:492`）——设计档自身携带这些字面（`UI.md:52` ∕ `:491` · 批档 `:11`），按字面「全仓」执行盘面 grep 必红 | 判据域收为代码树（`thincoder-desktop/**` ∕ `thincoder-render-core/**`，排除 `docs/`），或把「全仓（代码面）」口径写死 |
| 5 | Affected-file annotations | 🟡 | 本批触碰的越层档 `chat.mjs`（两读法皆 >300：354 ∕ 365）与 `i18n.mjs`（489 ∕ 473）在 §4.2 行（`:520` ∕ `:525`）未载越层处置；在册纪律 = 「各带拆分预案 + 消解窗口 = 各自下次被触碰的批」（`PROJECT.md:235`）——本批即该窗口 | 两行补越层处置句（续拆预案 ∕ 续期说明），闭合「被触碰批必载处置」纪律 |
| 6 | Acceptance criteria | 🔵 | 「机检面 = 随批单元证据（三语境 ∕ `editFlags` 启用径 ∕ 两语词值）」与同句「本批不交付测试档」自相抵（批档 `:83` ∕ `:77`）；全清令后在册口径 = 「单元 = 批次本地件（不登记）」（`PROJECT.md:229`），两兄弟批皆落批次本地件（`PROJECT.md:509` ∕ `:537`） | 落批次本地件（两纯函数平 node 直测 · 不登记），或明示机检面的实际载体与不出档依据 |
| 7 | Document ownership / doc state | 🔵 | 「设计档落点」声称已含「对话流 ∕ 输入区两行行内指针」（批档 `:79`；`UI.md:631` 同），对话流行已落（`UI.md:18`），输入区行未见对应指针（`UI.md:19` 无「复制面对齐」指向） | 补输入区行行内指针（尾控件 ∕ 尾锚退场 → 本批注项 2），或把该句从「已落」清单剔除 |
| 8 | Requirements coverage（协调项 · 非缺陷） | 🟡 | 需求 D27（`docs/desktop/requirements/PROJECT.md:172`）列举句含「全选」而括注「条目集以 VSC webview 菜单为准」；本批实读 VSC 侧 = 无「全选」⇒ 设计按列举落 + §10 **BU** 登记（`PROJECT.md:814`）——裁定落地前，T-DSK47 ⑤ 与「全选」项验收口径处于待裁态 | 把条目集口径结论落地（继续列举口径 ∕ 随 VSC 去「全选」），并据此收正 BU 行与 T-DSK47 断言 |

计数：🔴 0 · 🟡 6 · 🔵 2（共 8 条）

**VERDICT: pass**

### 轮次 2（评审子代理）

**发现表（本轮 · 设计评审 §3）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（同机制两处不同描述） | 🔴 | 账本警示面的落点 ∕ 类名 ∕ 样式在两处相抵：`UI.md:214-215`（本批注（账本警示面）项 2）记「落点 = 会话区**末子节点**（…`[data-section="sessions"]` 内）· 节点 = `div.rail-ledger-notice` · 样式住 `styles.css` 左列段」；同注项 4 ∕ 项 5②（`UI.md:220` ∕ `:223`）与 §1 会话控制面行（`UI.md:27`）记「**下拉首行**」——盘面实证 = `thincoder-desktop/renderer/views/session-control.mjs:210`（`div.session-ledger-notice`）+ `renderer/chrome.css:222`；盘上无 `[data-section]` ∕ 无 `.rail-ledger-notice` ∕ 无 `styles.css`。同族残句：`IPC.md:170`（「渲染面左列账本警示行」）· `PROJECT.md:581`（D23 行「左列会话区末位 dim 注记」）。 | 四处按盘面收正为「下拉首行 ∕ `div.session-ledger-notice` ∕ `chrome.css`」（或反向收会话控制面行——二值取一）；同机制两处必须同值后方可放行。 |
| 2 | Affected-file annotations（数值抽查） | 🟡 | §4.1 ∕ 越层段抽查值与现盘不符：`renderer/events.mjs` 记 497（`PROJECT.md:239`）现读 **247**；`renderer/mount-settings.mjs` 记 499、在册例外「距 500 硬限 1 行」（`PROJECT.md:236`）现读 **151**（已拆 `mount-settings-reads ∕ exits ∕ segments(-models).mjs`）；`renderer/chat.css` 记 479（`PROJECT.md:240`）现读 **313**；`renderer/views/settings-sections.mjs` 记 356（`PROJECT.md:241`）现读 **<300**（已拆 `settings-sections-{env,mcp,models,tools}`）；`renderer/store.mjs` 记 328（`PROJECT.md:241`）现读 **<300**；`renderer/i18n-views.mjs` 记 68（`PROJECT.md:194`）现读 **283**；`src/main/agent-bridge.mjs` 记 257（`PROJECT.md:161`）现读 **334**。（对拍一致侧：`views/chat.mjs` 365 ∕ `src/main/window.mjs` 191 ∕ `src/main/ipc.mjs` ≈293 ∕ 通道 23 ∕ 白名单 38 与盘面一致。） | 全表按盘实读回填一轮（越层段 ∕ 在册例外 ∕ §4.2 同笔）——「距硬限 1 行」一类失真读数会误导后续批次裁决。 |
| 3 | Affected-file annotations（清单完整性） | 🟡 | 现盘多档未入 §4.1 清单与 `SHELL.md:42` 树（抽查 grep 五档文档全无命中）：`renderer/events-blocks.mjs ∕ events-slices.mjs ∕ events-status.mjs ∕ events-wake.mjs` · `renderer/composer-wire.mjs` · `renderer/i18n-composer.mjs` · `renderer/mount-settings-{reads,exits,segments,segments-models}.mjs` · `renderer/views/statusline-segments.mjs ∕ settings-agent.mjs ∕ settings-controls.mjs ∕ settings-sections-{env,mcp,models,tools}.mjs ∕ goal.mjs` · `src/main/{at-complete,exec-run,prompt-injections,settings-values}.mjs` · CSS `theme.css ∕ skin.css ∕ chrome.css ∕ chat-fixes.css ∕ core-markdown.css ∕ chat-cards.css`（其中 `skin.css ∕ chat-fixes.css ∕ core-markdown.css` 全域零提及）。 | 逐档补行（实读值 + 一行职责）+ `SHELL.md` §1 树同步；此后新档落盘随批登记。 |
| 4 | Affected-file annotations（越层无预案） | 🟡 | 越 300 档缺拆分预案：`renderer/chrome.css` **445**（未入册）· `src/main/agent-bridge.mjs` **334**（`PROJECT.md:161` 记 257、无预案）。仓级规则 = >300 即须拆分评审。 | 两档补拆分预案并入册；`chrome.css` 与 `chat.css` ∕ `pool.css` 先例同形（新立档 ∕ 段落拆分）。 |
| 5 | Doc hygiene（退场面残迹） | 🟡 | 左列 ∕ 标签条（R13 已裁撤——盘面骨架 = `renderer/index.html` 两列：`.session` + `.pool` + 底行状态栏）仍留在现行面文本：`UI.md:26`（启动态行「**左列** = 打开目录入口 + 最近目录列表」——入口现住会话控制面条体项目钮）· `UI.md:14`（断点行残句 + 调参面落 `styles.css`）· `UI.md:145`（D21 项 2「桌面左列会话列表」· 落点 `styles.css` 左列段 `.rail-*`——盘上无此档此选择器）· `UI.md:161-167`（不追面 ③④⑦ 引左列 ∕ 标签条）· `PROJECT.md:656`（T-DSK27 段序仍四段 `providers,model,agent,mcp`——设置面现七段）。 | 逐处按 R13 后形态收正（改引现落点 ∕ 删残句）；历史表述归变更记录面。 |
| 6 | Consistency（单源事实相抵） | 🟡 | 两条单源事实两处不一致：① `package.json` script —— `PROJECT.md:547` 记「script 三条（单源 · 本行）」vs `SHELL.md:14` 记「script 四条」vs 盘面四条（`test ∕ start ∕ package ∕ postpackage`）；② `IPC.md:36` `ev:config` 行记「复读**四段**」vs `UI.md` 设置面行「**七段**」（R7 后）。 | 两处同笔收正（§5 补 `start`；`ev:config` 复读面段数随设置面现段集书写）。 |
| 7 | Clarity（验收面） | 🔵 | §6.1 表头「功能点 D1–D27」（`PROJECT.md:555`）而表体止于 D25 行（D26 ∕ D27 仅以「批（验收面）」注承载——回指与判据在位）。 | 或补 D26 ∕ D27 两行、或表头注明「D26 ∕ D27 以批注承载」，免扫读漏项。 |
| 8 | Requirements（已登记张力） | 🔵 | D27 条目集张力：需求 D27 括注「条目集以 VSC webview 菜单为准」，设计按 D27 主句落四件（`PROJECT.md` KD-43；差异已登记 §10 **BU**，待真机比对裁）。 | 真机比对时随裁把需求括注与 KD-43 同笔收口——已登记，无本轮动作。 |

**计数（本轮 · 设计评审）**：🔴 1 · 🟡 5 · 🔵 2 = **8 项**。

**VERDICT: changes-required**（阻断项 = 发现 1：同机制两处不同描述——账本警示面落点 ∕ 类名 ∕ 样式相抵，须收正后方可放行）

### 轮次 3（评审子代理）

**发现表（设计评审 · 桌面端五档：UI.md / PROJECT.md / IPC.md / SHELL.md / E2E-TESTING.md）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership · Acceptance | 🔴 | 退场面与用例驱动路径相抵：E2E-TESTING.md §3.5 步 5/6（`:107`–`:109`）、§3.6 步 3（`:126`）、§6 用例行（`:179` / `:180` / `:189`）与 PROJECT.md §7（`:700` / `:707` / `:708` / `:712`）均以「真点左列最近目录项 `[data-slot="projects"] [data-action="project:open"][data-path]`」为唯一开项目驱动路径；而 UI.md 布局行（`:13`）= 两列 · 断点行（`:14`）= 左列裁撤 · 启动态行（`:26`）=「R13 后原左列入口面退场」· 会话控制面行（`:27`）= 条体项目钮（`project:open` 恒在场 · 词面经 `aria-label`，无 `data-path` 形）——同一「项目打开入口」机制两处两形；E2E-TESTING.md `:198` 自记「会话控制下拉与左列零残留」为 R11–R13 目标。后果 = 冒烟序该步与四条用例无目标节点（无 `data-path` 形在场），验收按现文不可执行 ∕ 不可验证；替代锚（无 `data-path` 的入口如何机检点开）全档未见落定（§7 与 §3.5/§3.6 皆无 as-of 限定语） | 按 R13 后入口形态重锚该步：点名替代选择器 ∕ 替代驱动路径（或改「引导面 `project:open` + 夹具预置当前项目」形），并同步收正 §7 四条用例的 ① 步与夹具描述 |
| 2 | Doc hygiene | 🟡 | R13 退役面（左列 ∕ 标签条 ∕ 最近目录列表）残引散布叙述面：UI.md `:63`–`:64`（「免『去左列找』」·「与左列**同出口**」）· `:115`（段 11「计数仍住左列信息行」）· `:117`（段 13「与标签条 ∕ 左列同源」）· `:135`（D18 落形「左列会话行元数据族三值」——§1 会话控制面行已载同机制）· `:344`（「既有单断点只折叠左列」）· `:531`（借用项 8 落形 = 单断点 900px，与断点行「零断点」相抵）；IPC.md `:204`（模式位注项 4「左列 ∕ 标签条不消费」）· `:221`（项目面注项 3「渲染面经 `sessions:list` 刷左列」）；PROJECT.md `:608`（D11「入口 = 左列底行右端」）· `:669` / `:671` / `:679` / `:693` / `:694`（T-DSK1 / 3 / 11 / 20 / 25 / 26 的「左列 ∕ 标签条」预期输出）· `:772`（「#426 窄窗左列折叠交互」） | 逐处改为 R13 后形态（会话控制面 ∕ 中区引导面 ∕ 状态行 ∕ 会话控制面下拉），历史口径归记录面 |
| 3 | Clarity | 🟡 | IPC.md §1 **载荷键集**段（`:51` 声明「**二十三通道**一律携 `key`」且逐通道字段集「**单源 = 本段**」）实列 22 条，缺 `ev:flags` 条（`:31` 表行在册；`:85` 会话键面与 `:88` 订阅面皆按二十三计） | 补 `ev:flags { key, flags }` 条（与 §1 该行同形），或把该段「单源」限定为「表行在册者」 |
| 4 | Doc hygiene | 🟡 | 台账周期刷新三处死句与已落实况相抵：UI.md `:377`（项 12「周期刷新（VSC `REFRESH_MS`）**不在本批**（open 行登记）」）· UI.md `:434`（E① 仍列该 open 消解路）· PROJECT.md `:77`（KD-38「周期刷新另裁 … 不在本批」）—— ∥ IPC.md `:28`（`REFRESH_MS` = 120s · 启动拍 + 周期拍 · R8 落）· PROJECT.md `:843`（BI 行 = 已落） | 三处删死句 ∕ 改记已落（历史归记录面），与 IPC.md §1 该行同拍 |
| 5 | Doc state · Test layer | 🟡 | 测试层状态三档不一：SHELL.md `:91`–`:96`（用例模块**三十五档** + 名序 = `test/files.mjs` 现值同序 + 集成域两档）∥ PROJECT.md `:269`–`:270`（2026-09-28 **测试树全清重置** · `test/` 现盘三档 · `files.mjs` = **3** · 单元 = 批次本地件不登记）∥ E2E-TESTING.md `:145`–`:146`（`files.mjs` 12 ⇒ **22** · `run.mjs` **41**）。连带：多处「机检面」指向已退单元档——E2E-TESTING.md `:131` · `:143` · `:144` · `:184`；PROJECT.md `:701`–`:703` · `:718` · `:720` · `:729` | 以 §4.1 现盘为单源同步 SHELL §1 树与 E2E §4；把指向已退单元档的「机检面」改述为「批次本地件 ∕ 真机走查 + 父侧真跑闭合」同形 |
| 6 | Semantic dangling | 🟡 | `project:recent` 通道在册（IPC.md `:121` · `:139` 白名单位次 3）但 UI 侧消费面随 R13 退场（UI.md `:26` 去最近目录列表；`:27` 会话控制面行无该面）⇒ 通道无消费面 ∕ T-DSK2「最近目录」验收（PROJECT.md `:670`）无落点 | 明确该通道的当前消费面（或标「无消费面 · 保留」），并同步 T-DSK2 场景与判据 |
| 7 | Clarity | 🟡 | 中断键两态判据未覆盖挂起窗：UI.md `:409`（P28 判据 = 本会话**位标含 `running`**）∥ UI.md `:499`（输入面并行判据 = `busyOf ∨ suspActiveOf`）∥ IPC.md `:111`（`msg:interrupt` 窗内 = 回合级，可中止 digest 在飞轮）——窗在飞（消化 ∕ 唤醒轮）时该键的在场 ∕ 可点判据未见裁定 | 在 P28 补一档（窗在飞 ⇒ 可点 ∕ 不可点）并点名判据单源（`suspActiveOf` 或位标集） |
| 8 | Clarity | 🔵 | 数值漂移组（同一物件两值）：§4.1 ∥ §4.2 ∕ UI.md——`queued-input.mjs` **73**（PROJECT.md `:161`）∥ **117**（PROJECT.md `:302` · UI.md `:294` / `:440`）；`i18n-views.mjs` **282**（PROJECT.md `:213`）∥ **68**（PROJECT.md `:520` · UI.md `:432`）；`chat-pending.mjs` **69**（PROJECT.md `:218`）∥ **77**（PROJECT.md `:466` · UI.md `:347`）；`chat-subagent.mjs` **75**（PROJECT.md `:219`）∥ **69**（同两处）；回调面 **九回调**（SHELL.md `:26` · PROJECT.md `:163`）∥ **十八回调**（IPC.md `:38`）；状态词 **7 词**（PROJECT.md `:68` KD-30）∥ **8 词**（UI.md `:15` 状态词行 · `:532` 借用项 9）；`files.mjs` **3**（PROJECT.md `:269`）∥ **22**（PROJECT.md `:423`） | 按盘一次性回填（单源 = §4.1 ∕ §4.2 现值），KD-30 与借用项同拍计数 |
| 9 | Clarity | 🔵 | 设置面「开」面落点两档不一：UI.md `:29` = 输入区控件行出口（`openSettings`——`mount-composer.mjs:15`）∥ E2E-TESTING.md `:85` 步 3 与 KD-7 注 `:50` = 信息行 `button.info-entry`（`views/info-row.mjs:82-90`；该档未见于 SHELL.md `:89` 名单与 §4.1 现表） | 对盘核一处收正；若两面并存 ⇒ UI.md 补列第二入口 |
| 10 | Consistency | 🔵 | SHELL.md §4 项 4（`:144`）只述「回合尾落盘已落（**先落盘再出终局事件** · `session-io.mjs`）」，未含 #517 结算序（**标题 → 落盘 → 读数 → 终局事件** · `turn-face.mjs` `settleTurn` 单实现，见 PROJECT.md `:80` KD-41 ∕ `:159`） | 该行补结算序与落点（或改指 KD-41 / §4.1 该档行） |
| 11 | Scope | 🔵 | 档体量：PROJECT.md **1122** 行 · UI.md **646** 行，超仓级 500 行硬限的适用面未声明（各档只对代码档立 300 ∕ 500 纪律，纯 `.md` 未标豁免），逐批注层叠使残体类缺陷反复（本轮发现 2 / 4 / 10 同族） | 在档头 ∕ DOC-SYSTEM 面声明纯 `.md` 的行数口径，或对已闭批注做一次「现行规则留规范面 · 历史留记录面」的合并 |

**计数**：发现 **11**（🔴 1 · 🟡 6 · 🔵 4）；证据引用全部为档内 `file:line`（未读档外文件 —— 需求档 ∕ RENDERER.md ∕ 批档 ∕ 码面未纳入）。

**范围与限制**（同轮报告口径）：无 git 仓 ⇒ 无变更集；无 standards ∕ document-map 声明 ⇒ 判据 3（方法学）与判据 7（文档归属）仅按 Project Guide（AGENTS.md）与各档自述纪律判；判据 8 的行数抽查以档间互证为限（未读码面实读）。

**档外一条（不给严重度）**：RENDERER.md `:69`（「待发送带不在流内——住输入区上方带」）与 UI.md `:296`（`[data-pending]` 组 = **流内非块节点**）读法相抵，属评审范围外物件。

VERDICT: changes-required

### 轮次 4（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file annotations（落定证据覆盖） | 🟡 | 修正记录未覆盖发现列举的全部坐标：① 发现 8（本档 `:234`）列举 `files.mjs` **3**（`PROJECT.md:269`）∥ **22**（`PROJECT.md:423`）——修正行 8（本档 `:166`）无该对处置，修正行 5（本档 `:163`）的 `PROJECT.md` 落点仅 §7 各行、不含 `:423`；② 发现 5（本档 `:231`）列举「机检面」残引 `E2E-TESTING.md:131` ∕ `:143` ∕ `:144` ∕ `:184`——修正行 5（本档 `:163`）只列 `:143/:144/:184`，`:131` 不在列。两条均难据现记录判全闭（状态行已记「11/11 落毕」· 本档 `:35`） | 补落两坐标（`PROJECT.md:423` 收正 ∕ `E2E-TESTING.md:131` 改述），或补一行豁免注（引系统性残引口径，如本档 `:151` 边界④）并写死依据；补记后按发现列举坐标逐项勾稽，再保留「全闭」表述 |
| 2 | Affected-file annotations（数值抽查） | 🟡 | 受影响文件表 `i18n.mjs` 行（本档 `:76`）两列自相抵：构成列 = 退两键 × 2 语 + 增四键 × 2 语（净 +2，键数链 `HOST_DICT` 267 ⇒ 269 与之相符）⇒ 按每条目双语计 473 + 4 = **≈477**，而预期列记 **≈472**（净 −1）；同表另九行增减符号均与各自构成列一致，唯此行相反 | 对齐两列（预期值收正为 ≈477，或补注估值口径使 473 ⇒ ≈472 可复算）；表头补账法口径（行 ∕ 键），防后续批再漂 |
| 3 | Acceptance criteria（协调项 · 非缺陷） | 🟡 | 🔴 重锚虽落，同族驱动路径残面仍在册：留报 ①（本档 `:174`）记 `E2E-TESTING.md:111` 步 8 ∕ `:177` 摘要句 ∕ `:190` ③ 的「关唯一标签 ∕ `tab:close` ∕ `tabbar.mjs`」径 R13 后无可达 UI 驱动路（`session:delete` 末项门：会话数 ≤ 1 拒），「无活动会话 ∕ `no-session` 引导」面可达性存疑——该步按现文不可执行（与轮次 3 发现 1（本档 `:227`）同族，未列本单坐标） | 重锚该步驱动路径（或注明该步退出在册冒烟序并附依据），使 E2E 档按现文逐步可达；口径与发现 1 的收正同形，免同档「开项目 ∕ 关标签」两条驱动路径两形并存 |
| 4 | Clarity（零动作可追溯） | 🔵 | 「零动作」结论不可追溯：修正行 8（本档 `:166`）对状态词判「8 词复核一致（零动作）」，而发现 8（本档 `:234`）列举两侧 = KD-30（`PROJECT.md:68`「**7 词**」）∥ `UI.md:15` ∕ `:532`（「8 词」）——复核坐标 ∕ as-of 读值未载，结论的成立依据读不出 | 该行补复核坐标与 as-of 读值（例：`PROJECT.md:68` 现读 8 词），或注明复核结论的来源（新增读值 ∕ 读数订正），与发现 8 的列举逐项对应 |
| 5 | Scope（越层状态 · 不重启既有裁定） | 🔵 | 越层档本批无拆分动作、窗口口径自相抵：本批触碰的 `renderer/views/chat.mjs`（365 ⇒ ≈361，本档 `:71`）与 `renderer/i18n.mjs`（473 ⇒ ≈472，本档 `:76`）在 §4.2 仅记「续期说明」，其句自设「消解窗口 = 该档下次被触碰的批」（本档 `:106`）——本批即触碰批而仍未拆；判据 8 的「越层带拆分预案」在本批面上只有续期句（两档均 < 500 硬限，不涉硬顶） | 记明本批不拆的依据（摘除型小改）并把消解窗口改指可判定的下批 ∕ 或注明窗口顺延理由，使「续期」句可按现文复判 |

**计数（本轮 · 设计评审）**：🔴 0 · 🟡 3 · 🔵 2 = 5 项（范围 = 本批档；五档 ∕ 码面坐标未入本评范围——跨档落定为记录面核验；无 standards ∕ document-map 声明 ⇒ 判据 3 ∕ 7 按 Project Guide 与档自述纪律判）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（主 agent 代录 · 2026-09-29 04:3x）
- **用户令（04:32 逐字）**：「检查一下我刚才在桌面端创建的批档，接过来处理完。」⇒ 本批（+同批 #561）**移交本会话接管至收口**；§4 = 批准落（设计已评审 pass + 修正 1–7 逐号落定并核验）。
- **批准范围**：条目 1 D27 右键编辑菜单 · 条目 2 D13 两控件摘除——按 §2 设计（单源 = `docs/desktop/design/PROJECT.md` §2 KD-43 ∕ KD-22 收正）。
- **待裁一项（BU · 不阻实施 · 默认已定）**：D27 条目集「全选」项（VSC 无 ∕ D27 列举有）+ 空选语境（桌面零菜单 ∕ VSC 恒列）。**默认 = 条目集随 VSC 去「全选」（剪切/复制/粘贴三件），空选零菜单保留**（体感更优、无可见害）；用户一句话可翻转。
- **实施**：移交本会话 eng-coder（全链：实施 → 交付核验 → §5/§6 → 核销）。

### 4.2 收正 · 待裁项 BU 落定（用户 2026-09-29 04:37 逐字「就这么办把，全选可以留着。」）
- **「全选」保留**（设计原样——条目集含全选，零改动）；§4.1 的「默认去全选」句以本条为准。
- 其余差异（空选语境）维持 §2 设计。
- **评审 #58 = changes-required**（1🔴+5🟡+2🔵 · §3 轮次 2 在册）⇒ 实施前先走**修正轮**（发现 1..8 逐条落），修正后复审 → pass 取 token → 实施。

### 4.2 复审通过（父侧 · 2026-09-29 05:3x）

- 评审 **#107（复审轮 2）= pass**（🔴0 · 🟡3 ∕ 🔵2 = 5）——🔴 驱动路径重锚与 10 条残项落定获复核；三条 🟡 为落定证据 ∕ 数值 ∕ 同族残径，两 🔵 为可追溯性与越层窗口状态（全非阻断）。
- **§4.1 批准条件（pass ∧ 修正落地核验 ∧ token 在位）已齐 ⇒ 实施门开**。
- 复审 5 项处置 = 修正轮 **r3**（在册接办：落定证据补记 + 勾稽 ∕ `i18n.mjs` 数值复合 ∕ E2E 残径重锚 ∕ 零动作坐标 ∕ 越层窗口口径）。
- 实施 = 分波（码面 → 档面 → 收尾），r3 落定与码面波并行安全（异面零重叠）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（码面单波十档落位；批内件 5/5；零残留零命中；审计 1 轮 ∕ 评审 1 轮 = pass——终态 clean；真机走查归父侧）



### 5.1 码面单波（eng-coder · 2026-09-29）

**交付摘要**：按 §2 机制设计（一）∕（二）+ 受影响文件表十档逐项落位——① D27 右键编辑菜单（新档两纯函数 + `window.mjs` 落子 + 词表四键两语现读）；② D13 自建复制面两控件全清单摘除（`views/chat-copy.mjs` 整档删、`blockTextOf` 迁入 `views/chat-text.mjs`、三处调用点、尾锚 ∕ `writeText` ∕ `tailOf` ∕ `syncLastCopy` 族、i18n 两键、CSS 两族 + 字形 + 尾锚规则）。零新语义、零核件 ∕ VSC 树 ∕ `test/**` ∕ 五档文档面触碰。

**逐档落位（读回 · file:line）**：

| # | 档 | 落位 | 行数（现行 ⇒ 实际） |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/context-menu.mjs`（新） | `contextMenuLabels` :35-44 · `contextMenuTemplate` :48-60 · 词键表 :24 · 条目表 :27-32（零 electron ∕ 零 node:） | — ⇒ **60**（预期 ≈65） |
| 2 | `thincoder-desktop/src/main/window.mjs` | 落子 :122-136（`context-menu` ⇒ `Menu.buildFromTemplate(...).popup({ window: win })`；`loadConfig()?.locale` 现读 + 读失败回落 en + `console.error`）；imports :14 ∕ :16-17；档头注 :6-7 | 191 ⇒ **211**（≈214） |
| 3 | `thincoder-desktop/renderer/views/chat-copy.mjs` | **整档删**（`blockTextOf` 迁出；全树引用零漏网） | 113 ⇒ **删档** ✓ |
| 4 | `thincoder-desktop/renderer/views/chat-text.mjs` | `blockTextOf` 迁入 :26-30；`copyBlockNode` 两调用点摘除（推理块子件 ∕ 就地更新补控件块）；`data-raw` 等注释改述 :8-9 ∕ :13-14 ∕ :32 ∕ :72-77 | 126 ⇒ **126**（≈131） |
| 5 | `thincoder-desktop/renderer/views/chat.mjs` | `copyBlockNode` 引调三处摘除（import ∕ `errorNode` ∕ `blockNode`）；KD-22 收正注 :246-250；残句收正 :20 ∕ :302 | 365 ⇒ **362**（≈361） |
| 6 | `thincoder-desktop/renderer/mount-composer.mjs` | 槽形三件 ⇒ 两件 :187-199；`TAIL_ANCHOR` ∕ `tailAnchor` ∕ `writeText` ∕ `tailOf` 摘除；`COMPOSER_KEYS` 去 `blocks` | 238 ⇒ **231**（≈230） |
| 7 | `thincoder-desktop/renderer/composer-sync.mjs` | `syncLastCopy` 族 ∕ `writeText` ∕ `tailOf` deps 摘除（import ∕ 工厂签名 :40 ∕ 函数体 ∕ `syncPanel` :174-179） | 210 ⇒ **188**（≈188） |
| 8 | `thincoder-desktop/renderer/app.mjs` | `writeText` 单点供给摘除（const ∕ `attachComposer` deps :66 ∕ 对话流 handlers :169） | 276 ⇒ **269**（≈268） |
| 9 | `thincoder-desktop/renderer/chat-composer.css` | 两控件族 ∕ `⧉` 字形 ∕ `[data-composer-tail]` 规则 ∕ 两交互态成员摘除（余成员零动 :41-48） | 71 ⇒ **48**（≈55） |
| 10 | `thincoder-desktop/renderer/i18n.mjs` | 退两键 × 2 语 + 增 `menu.edit.*` 四键 × 2 语（en :117-120 ∕ zh :278-281）；键数链随动 `HOST_DICT` 合并表 **267 ⇒ 269**（实读复核一致） | 473 ⇒ **482**（≈472——+9 差 = 两语注释块 + 链记录行） |

**表外改动（2 处 · 注释级 · 零行为面 · 已披露）**：`renderer/chat.css:4`（兄弟档描述残句「两挂件锚 + 两复制控件」⇒「提示行锚 + 交互态组」）· `renderer/views/chat-guide.mjs:6`（死先例句去指针化：「沿 `renderer/views/chat-copy.mjs` 先例」⇒「沿流内非块节点构树先例」——与设计档 RENDERER.md §1.1 收正同口径）。删档连带残句排查共 3 处（含 `renderer/chat.css`），另 `views/chat-pending.mjs:26` 一处「复制面同约」残句属他批在办射程——未触，报父侧。

**决策透明表（实施面判断 · 均已在注释面留痕）**：

| # | 判断 | 依据与落法 |
|---|---|---|
| 1 | `COMPOSER_KEYS` 去 `blocks` | 设计摘除清单 ⑥「`syncLastCopy` 族」内判：`blocks` 唯一消费者 = 末条复制控件（键注原文「块（末条复制控件取文源）」）⇒ 随族摘除，键注同笔改述 |
| 2 | `patchTextBlock` ∕ `reasoningNode` 签名保留（`key` ∕ `handlers` 摘除后无内部消费） | 按设计「`copyBlockNode` 两调用点摘除」字面零扩展；现无消费一事在档内注释明记（:75-77），如需签名瘦身请另行裁 |
| 3 | 表外注释 2 档 | 删档 ∕ 摘除产生的死指针 ∕ 残句，按「死指针是缺陷」口径就地收正并披露 |
| 4 | `Menu.buildFromTemplate(...).popup(...)` 不绑局部引用 | 逐字沿设计形（批档 §2 机制设计（一））；评审 🔵 建议（unverified）——实读 `electron.d.ts:9621` `popup(options?: PopupOptions): void`（零 promise 面）⇒ 判保留 |

**验证命令与读数**：
- 批内件（两纯函数平 node 直测 5 条：三语境条目集 ∕ `editFlags` 启用径（假值禁用 + 缺键不禁用）∕ 两语词值 + 归一）：`node --test .thincoder/tmp/2026-09-29-desktop-copy-vsc-align.test.mjs`（自 `thincoder/` 根）⇒ **5/5 绿**（0 fail）。终位 = 父侧 copy 至 `docs/batches/`（批次本地件惯例）。
- 零残留（D13 判据域 = 代码树 `thincoder-desktop/**` ∕ `thincoder-render-core/**`）：`⧉` ∕ `chat:copy-block` ∕ `chat:last` ∕ `chat.action.copy` ∕ `chat.action.copyLast` ∕ `chat-copy` **零命中**（源档全树扫描）∧ `renderer/views/chat-copy.mjs` 不存在 ✓。
- 保留物零动：核件 `attachCopyButtons` + `.code-copy-btn` + 桌面两调用点（`views/chat.mjs`）在盘；`msg.copy` / `msg.copied` 在；核心文面 ∕ 输入框可选面 ∕ 应用菜单 Edit 组：零动。
- 语法：九 .mjs 全 `node --check` OK。未跑仓级测试套（全清令口径 + 父侧收口跑）。

**舱内审计与评审（终态 clean）**：
- **审计轮 1**（explore · 只读设计一致性）：发现 6（🔴0 ∕ 🟡3 ∕ 🔵3）——逐字对照 §2 机制面全项在盘；三条 🔵 = 两处注释残句 + 判据域外历史件（登记）；两 🟡 = 本 §5 在办（已落）与两处表外注释档（已披露）。
- **评审轮 1**（advisor · code）：VERDICT **pass**（🔴0 · 🟡3 全非必修：两档在册越层咨询线（`views/chat.mjs` 362 ∕ `i18n.mjs` 482）+ 批内件终位协调项 · 🔵2：`popup` 局部引用建议（unverified）· 行数预估漂移报告项）。
- **fix round**：1 轮（审计 🔵 残句 2 处 + 自检复核 3 处：`views/chat.mjs` :20 ∕ :302 · `mount-composer.mjs` :44）；余零修。终态 = **clean**（未触 5 轮上限）。

**透明披露 / 上抛（父侧裁）**：① 判据域外残留字面：`thincoder/.thincoder/tmp/desktop-denoise-probe.mjs` ∕ `views-chrome-before.mjs` 与 `thincoder-desktop/.thincoder/tmp/*.log` 历史件携带旧字面（非源档；判据域外——清 ∕ 留归父侧）；② 批内件终位 copy 归父侧（§6）；③ 两越层档按在册续期说明零拆；④ 真机走查（D16）与 T-DSK47 ∕ T-DSK30 收正面归父侧闭合；⑤ `views/chat-pending.mjs:26` 残句属他批射程未触。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**收口读数（父侧亲跑 · 冻结版）**：
- 批内件 `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` = **5/5 pass**（三语境条目集 ∕ `editFlags` 启用径 ∕ 两语词值；跑法行 = 终位 · 父侧已收正档头）。
- 全量批内件收口跑 = **124/124**（14 件 · 同刻 · 含本批）；四端套件 = 空清单绿（全清令制）。
- 实施面实测：`window.mjs` ∕ `context-menu.mjs` 两纯函数 + 全仓零右键命中 ⇒ 实施后选择面 ∕ 输入框两径在位；D13 摘除（`chat-copy.mjs` 两控件 + CSS 四态 + 挂点 + 窄刷 + i18n 两键）零残留；`node --check` 九 .mjs 全过、无新增红。
- **r3（修正轮 4 · #109）**：评审 #105 的 5 条全闭（含步 8/9 退场 ⇒ 序列 12 ⇒ 10 ∕ i18n 实盘复算 ≈482 ∕ `files.mjs` 三处「现盘 3」注）；**「全清令」措辞族终扫（#128）= 11 处** + 父侧 `:30` 一笔。

**结算面（D7）**：台账 **#557**（右键菜单对齐）→ **已核销**（机制 + 判据句 + 锁 5/5）；**#558**（两 ⧉ 控件摘除）→ **已核销**（摘除清单逐处退场 + 零残留）；**#591**（no-session 驱动路——r3 边界 2）→ 挂册在途（要求面裁量）。
**真机面（父侧义务 · D16）**：T-DSK47 全项——流内选中 ⇒ 右键 ⇒ 复制 ⇒ 剪贴板逐字（粘回往返）· 输入框右键四件 + `editFlags` 两态 · 非编辑区零菜单 · zh 文案——人工走查；清单随本轮真机汇总行。

**状态行**：已收口 2026-09-29。
