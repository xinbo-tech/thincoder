# 桌面端（DESKTOP）· 菜单体系（应用菜单 + 窄通道）

> 面 = **应用菜单面**——五组双语原生菜单 + 菜单 ↔ 渲染面两条窄通道（命令下行 `ev:menu` ∥ 勾选态回读 `theme:state`）；本档是该面的单源设计。
> 需求侧 = 需求分卷（本域卷 = `docs/desktop/requirements/MENU.md`——**D36 ∥ D38**；查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**）；
> 总览 ∥ 跨域决策 ∥ 索引 = `docs/desktop/design/PROJECT.md`；通道面 = `docs/desktop/design/IPC.md` §1 `ev:menu` 行 ∥ §2 `theme:state` 行；宿主面 = `docs/desktop/design/SHELL.md` §1 树行 + §2 菜单行；界面总则 = `docs/desktop/design/UI.md`。
> 建档 = 2026-10-02（文档体系重组批 #813 · 波 1——内容逐字迁自 `docs/desktop/design/PROJECT.md` §2 / §4.1 / §4.2 / §6.1 / §7 / §10 ∥ `docs/desktop/design/UI.md` §1，as-of 2026-10-02；迁移前原址 = 各源档保位指针）。
> **行数纪律（300 建议 ∕ 500 硬限）只对代码档**（`.mjs` ∥ `.cjs` ∥ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。

## 1. 关键决策（KD-65）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-65 | **桌面菜单体系（D36）= 五组双语原生菜单 + 菜单 ↔ 渲染面两条窄通道（命令下行 `ev:menu` ∥ 勾选态回读 `theme:state`）**（菜单体系批 · 2026-10-02 · 台账 #811）：① **菜单树（五组）**——文件[新建会话 `CmdOrCtrl+N` → `ev:menu{newSession}` ∥ 打开项目… `CmdOrCtrl+O` → `ev:menu{openProject}`（渲染面 `openDir` 单一实现——原生选择框同径）∥ 最近项目▸（`recentDirs()` 前 10——`projects.mjs` 数据面既有、零改；项 label = cwd 全路径；空表 ⇒ 单枚禁用占位项）∥ 现状 close ∥ quit（显式双语 label）] ∥ 编辑[现状 role 组（显式双语 label——role 默认文案 = Electron 英文硬编码，直采即 en-only 债，单源 = D27 批实读）+ 查找… `CmdOrCtrl+F` → `ev:menu{find}`] ∥ 视图[现状 role 组 + 主题▸（跟随系统 ∥ 亮色 ∥ 暗色——**序 = `renderer/theme.mjs` `THEMES` 闭集序**={`system`,`light`,`dark`}；**当前生效主题带勾**——`type: "checkbox"` + `checked` 逐项判等（单源 = 主进程回读缓存；恰一真 ∥ 报告未达 = 全假——零误勾））→ `ev:menu{theme, value}`] ∥ 设置[设置… ⇒ 现有设置页 ∥ **六组项** ⇒ 组弹窗（收窄批 #820：组项集 七 ⇒ 六）∥ 两子组（维护▸ ∥ 关于与快捷键▸）——**设置菜单升级批 · #817 重组**（原「维护」改名；单源 = 本档 §1 **KD-67**）] ∥ 帮助[检查更新… → 主进程更新面（`host("update")`——状态机 label；**桌面发布·阶段二批落**；单源 = `docs/desktop/design/PACKAGING.md` §2.8.1）∥ 命令与快捷键… → `ev:menu{help}` ∥ 关于 ThinCoder… → 主进程 `app.showAboutPanel()`（内容 = `app.setAboutPanelOptions`：应用名 ThinCoder ∥ `app.getVersion()` ∥ 版权行——建窗时一次设置）]；**窗口组（minimize/zoom）按五组枚举退场**（D36 ∥ §1 ∥ 台账三处枚举一致；窗口操作走系统标题栏）；**菜单结构出档** = `thincoder-desktop/src/main/menu-words.mjs`（扩至全菜单词表：组名五 + 条目 + role 标签 + 主题/最近/关于词——zh/en 双值 + en 回落，沿 #533 形）∥ `thincoder-desktop/src/main/app-menu.mjs`（新档 · `menuTemplate({ words, edit, recent, theme, onAction, onNative })` 纯函数——`onNative(action)` = 宿主自办四项 `gc` ∥ `index` ∥ `about` ∥ **`update`**（末项 = 桌面发布·阶段二批 +1）——不经 `ev:menu`；零 `electron` ⇒ 平 node 直测；`THEME_VALUES` 三值闭集同导出（主进程报告校验面共用——零第二份）；先例 = `context-menu.mjs` 两纯函数）；`window.mjs` = 宿主面落子（`Menu.buildFromTemplate` + `win.setMenu` + 关于面 + `refreshMenu` + `setMenuTheme`（勾选态缓存——表外值零变更 + 记错））。② **菜单 ↔ 渲染面 = 两条窄通道**——**命令下行 = `ev:menu`**（主→渲染单向；`EVENT_CHANNELS` **23 ⇒ 24**）：载荷 `{ action, path?, value? }`——`action` 闭集**六值** `newSession` / `openProject` / `find` / `theme` / `help` / `openSettings`（**打开项目亦经渲染面**——`openDir` 单一实现 + 会话面/轨面随动所需；**六动作——设置菜单升级批收正**（五 ⇒ 六：+`openSettings`——单源 = 本档 §1 **KD-67**）；「五」旧口径沿需求档 `:181` 收正先行）；`path` 仅 `openProject` 携（最近项）；**`value` 携主二**——`theme`（三值闭集）∥ `openSettings`（组名——菜单发出闭集六名〔收窄批 #820：= `SECTIONS` 名序去「模型与档位」〕∥ 渲染面校验 `SCOPES` 七名——设置页对齐超集；缺 ⇒ 开设置面）；**不携 `key`**（非会话面——沿 `ev:config` 例外句）；发送 = `window.mjs`（`win.webContents.send` + `isDestroyed` 守卫）；接收 = `events-subscribe.mjs` 窄口 `onMenu`（纯信号、归约面零写者——沿 `onConfig` 先例）⇒ `app.mjs` 接线 ⇒ **`thincoder-desktop/renderer/menu-actions.mjs`（新档）** 分派：`newSession` → `createSession()`（mount-sessions 单一实现）∥ `openProject` → `openDir(path?)`（app.mjs 单一实现）∥ `find` → 搜索面 `openSearch()`（核件 `createSearch` 返回面——R6 端壳现刻零消费点 ⇒ 本批接线；**幂等开径** ⇒ 与核件 Ctrl+F 键径双触发零害——核件键径 = 开非 toggle）∥ `theme` → 设置面出口 `setTheme`（→ `theme.mjs` 单写者 + 切片写）∥ `help` → `composer.printHelp()`（`/help` 流内打印口——mount-composer face 暴露；单实现）∥ `openSettings` → 设置页 `openSettings()`（缺组——现有页零动）∥ 组弹窗 `openSettingsModal(group)`（单源 = `docs/desktop/design/SETTINGS.md` §1 **KD-68**）——**勾选态回读 = `theme:state`**（渲染→主单向——**仅携 `{ theme }`**（三值闭集）；发送 = 渲染面两写作点（装配初值 ∥ 设置面出口落地——单写者 `theme.mjs` 的两调用位）；接收 = 主进程缓存 + `refreshMenu()`（`window.mjs` `setMenuTheme`；表外值 ⇒ 零变更 + 记错 + `{ ok:false, reason:"invalid-theme" }`）；**新 invoke 白名单项 46 ⇒ 47**；主进程零直读渲染面存储 ∥ 零轮询）。③ **词表单源**——应用菜单词值只住 `menu-words.mjs`；编辑四值（剪切/复制/粘贴/全选）复用 `contextMenuLabels(locale)` 读取（值单源 = 渲染面 `HOST_DICT` `menu.edit.*`——两菜单同词面，零第二份）；与 `HOST_DICT` 零重叠键。④ **菜单重建时机（最近项目读取 ∥ 语言随动 ∥ 主题勾随动）** = 菜单构建时读 + 重建点**六处**（启动建窗 ∥ `project:open` 成功径（`ipc.mjs` `refreshMenu()`）∥ **语言写径**（`config:write` 成功径 ⇒ `refreshMenu()`——`ipc-relays.mjs` `configWriteChannel`；`window.mjs` 单向 import——零环）∥ **主题态报告径**（`theme:state` 到达 ⇒ 缓存 + `refreshMenu()`——`ipc.mjs` 处理体转口 `setMenuTheme`）∥ 窗口 `focus`（外部盘面漂移兜底）∥ **更新面状态迁移径**（更新状态迁移 ⇒ `refreshMenu()`——`setUpdateFace` 转口；实读 `window.mjs:111-113` 一带——桌面发布·阶段二批））——`win.setMenu(buildMenu())` 幂等重建。⑤ **键位** = 新增三件（`CmdOrCtrl` N/O/F）+ 其余 role 默认加速键保留（reload/forceReload/devTools/zoom 三/全屏）；零冲突实读（渲染面 `ctrlKey` 零既有绑定——唯核件 Ctrl+F 同径收敛）。⑥ **关于面** = 原生 `app.setAboutPanelOptions` + `showAboutPanel()`（无平台限注实读）；版本 = `app.getVersion()`（package.json 现 0.10.1）。⑦ **边界** = 托盘 ∥ 自绘菜单 ∥ 全量快捷键体系 ∥ 语言切换进菜单（设置面单源）（检查更新 = **桌面发布·阶段二批落**；单源 = `docs/desktop/design/PACKAGING.md` §2.8.1）∥ 菜单项选中态 = 唯主题▸带勾（当前生效主题；命令下行 + 状态回读 `theme:state`——**限度**：回读经渲染面报告缓存（主进程零直读渲染面存储）∥ 报告未达窗 = 全零勾（fail-open，零误勾）∥ 零双向协议 ∥ 零热更 ∥ 其余条目零选中态）∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触 | 需求 D36（用户 2026-10-02 09:37 提出 + 09:40「可以啊，先做了我看看」= 四默认定案：双语 ✓ ∥ 主题▸ ✓ ∥ 关于=原生+版本 ✓ ∥ 最近项目 ✓）；现状实读 = `window.mjs:70-92` `buildMenu()`（五组 · 组名硬编码英文混排）；出档判由 = 结构机检需平 node 可测（`window.mjs` 载 `electron` 不可直测——沿 D27「模板出档」同判） | **窗口组保留**（违五组枚举——上抛 U2）· **打开项目走主进程直办**（渲染面轨/会话面不随动——留 UI 陈旧缺口；违 `openDir` 单一实现）· **help 经 `composer.submit("/help")`**（污染输入框草稿 + 入输入历史——经打印口暴露取代）· **`app-menu.mjs` 自立词值**（两词表打架面——词值仍单源 `menu-words.mjs`） |
| KD-67 | **设置组改造（D38 ∥ D39 菜单侧）= 顶级「维护」改名「设置」+ 组内「设置…」入口 + **六组项** ⇒ 弹窗（KD-68）+ 维护 ∕ 关于与快捷键两子组**（设置菜单升级批 · 2026-10-02 · 台账 #817；需求卷 **D38** ∥ **D39**）：① **菜单树（五组序不变）**——顶级组 = **设置**（词键 `settings`「设置」/「Settings」——原「维护」改名；**词键 `maintenance` 保留**（值「维护」/「Maintenance」不变——现役 = 子组标签））；组内 = **「设置…」**（`settingsOpen` → `ev:menu{openSettings}`〔缺 `value`〕⇒ **现有设置页** `openSettings()`——零动）∥ sep ∥ **六组项**（渠道… ∥ agent 参数… ∥ MCP… ∥ 运行环境… ∥ 工具与服务… ∥ 会诊与审查…——序 = 渲染面 `thincoder-desktop/renderer/views/settings.mjs` `SECTIONS` 段序**去「模型与档位」**；**收窄批 #820（2026-10-02）**：组项集 七 ⇒ 六——「模型与档位」不入菜单（模型选择归输入面板——用户 16:53 走查裁）；label = HOST_DICT `settings.section.*` 投影 + 「…」后缀（菜单形）→ `ev:menu{openSettings, value:组名}` ⇒ **组弹窗**（KD-68））∥ sep ∥ **维护▸**〔清理会话数据… → `host("gc")` ∥ 重建会话索引 → `host("index")`——**行为零改**（原生对话框，不经通道）〕∥ **关于与快捷键▸**〔命令与快捷键… → `emit("help")` ∥ 关于 ThinCoder… → `host("about")`——**行为零改**；**帮助组零动**——本组 = 同二项之**第二入口**（上抛 DI ③）〕。② **窄通道动作集 +1**（`ev:menu` 五 ⇒ **六**：+`openSettings`；**`value` 携主二**——`theme`（三值闭集）∥ `openSettings`（组名——菜单发出闭集六名（= `SECTIONS` 名序去「模型与档位」；收窄批 #820）∥ 渲染面校验 `SCOPES` 七名宽容（设置页对齐——零改）；缺 ⇒ 开设置面）；其余载荷面零改；**零新通道**——事件 24 ∥ 白名单 47 ∥ preload ∥ `ipc-registry.mjs` 零触；**KD-65 ② 同拍收正**（动作闭集五 ⇒ 六））。③ **词面**——`menu-words.mjs` +三键（`settings` ∥ `settingsOpen` ∥ `aboutShortcuts`「关于与快捷键」/「About & Shortcuts」；键集 29 ⇒ 32）+ 新读器 `settingsSectionLabels(locale)`（HOST_DICT `settings.section.*` 投影——沿 `contextMenuLabels` 先例，零第二份；**投影枚举 = 菜单六组名**〔收窄批 #820——与组项集对齐〕；en 回落 ∥ 缺键 ⇒ 键名终态）。④ **动作落径**——`openSettings`（缺组）→ 现有设置页（零动）；`openSettings`+组 → 组弹窗（KD-68）；`gc` ∥ `index` ∥ `about` → `onNative` 零改；`help` → `emit("help")` 零改。⑤ **重建时机零新**（五处不动——设置组项全静态）。⑥ **边界** = 独立设置窗口（B 案——用户明令不做）∥ 帮助组（零动；「移动」= 需求变更级——本设计不做）∥ 托盘 ∥ 自绘菜单 ∥ 全量快捷键体系。 | 需求 D38 ∥ D39（用户 2026-10-02 15:13 提出 + 15:19「先按照a做吧」= A 案应用内模态）；现盘实读 = `thincoder-desktop/src/main/app-menu.mjs:96-109`（维护组两项）∥ `menu-words.mjs:53`（`maintenance:"维护"`）∥ `renderer/menu-actions.mjs:24-36`（五动作分派）；弹窗体面 = `docs/desktop/design/SETTINGS.md` §1 **KD-68** | 被否：**段名七键入 menu-words 自持**（词值两源——段名改则菜单漂移）· **新载荷键 `group`**（键面净增——`value` 恰为其「动作参数」义位，沿 `theme` 先例）· **「设置…」直开总览弹窗**（非派单口径——D38「打开设置面」字面 = 现有页；备选登记 = 上抛 DI ②）· **帮助组两件移动**（破 D36 已裁五组——需求变更级） |

## 2. 界面形态与交互

**本批注（菜单体系 · D36 · 2026-10-02 · 台账 #811）**：本批定形「应用菜单五组扩充 + 菜单栏双语 + 菜单→渲染面窄通道」（需求 D36；用户 2026-10-02 09:40「可以啊，先做了我看看」= 四默认定案）；
批档 = `docs/batches/2026-10-02-desktop-menu-system.md`；决策单源 = **本档 §1 KD-65**（通道面 = `docs/desktop/design/IPC.md` §1 `ev:menu` 行 ∥ §2 `theme:state` 行）。

**本批注（设置菜单升级 · D38 ∥ D39 · 2026-10-02 · 台账 #817）**：本批定形菜单侧两波——① **设置组**（顶级「维护」改名「设置」+「设置…」入口 ⇒ 现有设置页 + 七组项 ⇒ 组弹窗 + 维护 ∥ 关于与快捷键两子组）；② **窄通道动作 +1**（`ev:menu` 五 ⇒ 六：+`openSettings`；`value` 携主二）。
  决策单源 = **本档 §1 KD-67**；弹窗体面 = `docs/desktop/design/SETTINGS.md` §1 **KD-68**；批档 = `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md`。

**本批注（设置菜单组项收窄 · 2026-10-02 · 台账 #820）**：菜单组项集 **七 ⇒ 六**——「模型与档位」不入菜单（模型选择归输入面板——用户 2026-10-02 16:53 走查裁）；**设置页面七段零动**（渲染面零触）。
闭集关系收正 = 菜单发出闭集 **六名**（= `SECTIONS` 名序去「模型与档位」）∥ 渲染面校验 `SCOPES` **七名宽容**（菜单不发第七名——零改；支 A 裁定）。
决策单源 = 本档 §1 **KD-67** ①–③ ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68** ④；批档 = `docs/batches/2026-10-02-settings-menu-trim.md`。

**本批注（桌面发布·阶段二批 · 菜单半 · 2026-10-02 · 台账 #810 · 需求 D40）**：帮助组 +「检查更新…」项（首项 + sep）——`host("update")` 主进程更新面（状态机 label）；`onNative` 自办四项（+`update`；不经 `ev:menu`）；**其余四组与两通道零动**（`ev:menu` 六动作 ∥ 事件 24 ∥ 白名单 47）。
三件面全规 = `docs/desktop/design/PACKAGING.md` §2.8；决策单源 = 同档 §1 **KD-71**；本档 §1 **KD-65** ①/②/⑦ 随拍；批档 = `docs/batches/2026-10-02-desktop-release-stage2.md`。

1. **菜单树（五组）**：文件[新建会话 `Ctrl+N` ∥ 打开项目… `Ctrl+O` ∥ 最近项目▸（前 10 · 项 label = cwd 全路径 · 空表 ⇒ 单枚禁用占位项）∥ close ∥ quit] ∥ 编辑[role 组 + 查找… `Ctrl+F`]
   ∥ 视图[role 组 + 主题▸（跟随系统 ∥ 亮色 ∥ 暗色——序 = `thincoder-desktop/renderer/theme.mjs` `THEMES` 闭集序；**需求档字面序保持**（实现序 = `THEMES` 闭集序）；**当前生效主题带勾**）] ∥ 设置[设置… ⇒ 现有设置页 ∥ **六组项** ⇒ 组弹窗（收窄批 #820：组项集 七 ⇒ 六）∥ 两子组（维护▸ ∥ 关于与快捷键▸）——**设置菜单升级批 · #817 重组**（原「维护」改名；单源 = 本档 §1 **KD-67**）]
   ∥ 帮助[检查更新… ∥ 命令与快捷键… ∥ 关于 ThinCoder…]（首项 = `host("update")` 主进程更新面——**桌面发布·阶段二批落**；单源 = `docs/desktop/design/PACKAGING.md` §2.8.1）。
   组名与条目双语（词表单源 = `thincoder-desktop/src/main/menu-words.mjs`；role 默认文案 = Electron 英文硬编码 ⇒ 显式双语 label 覆写——防 en-only 债）；**窗口组（minimize/zoom）按五组枚举退场**（窗口操作走系统标题栏）。
2. **交互落径（每项 = 既有单一实现）**：新建会话 → 会话创建出口 ∥ 打开项目 ∥ 最近项 → `openDir`（原生选择框同径）∥ 查找 → 搜索面 `openSearch()`（与核件 `Ctrl+F` 键径**同径收敛**——开语义幂等，双触发零害）∥ 主题 → 设置面出口 `setTheme`（`theme.mjs` 单写者 + 切片写；**落地值回读主进程**——`theme:state` ⇒ 菜单勾随动）∥ 命令与快捷键 → `/help` 流内打印口 ∥ 关于 → 原生面板（版本 = `app.getVersion()` 动态）。
3. **键盘可达**：三新增键位（`Ctrl+N` ∥ `Ctrl+O` ∥ `Ctrl+F`——菜单加速键；**记法注**：macOS 上 = Cmd——实现取 `CmdOrCtrl`；需求档字面 `Ctrl` 保持）；其余等于 role 默认加速键保留；零冲突实读（渲染面 `ctrlKey` 零既有绑定）。
4. **判据**：机检 = 批内件 `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（已建成 · 300 行 · 8/8 绿——五腿：树形（含带勾态）∥ 双语回落 ∥ 动作闭集 ∥ 词表纪律 ∥ 通道双表（含 `theme:state` 白名单））；真机面 = **T-DSK57**（走查：五组双语在场 ∥ 五入口 ∥ 三键 ∥ 关于面板含版本 0.10.1 ∥ 主题勾随动）。
5. **边界**：菜单项选中态 = 唯主题▸带勾（命令下行 + 状态回读 `theme:state`——限度 = 报告缓存；其余条目零选中态）∥ 托盘 ∥ 自绘菜单 ∥ 全量快捷键体系 ∥ 语言切换进菜单（设置面单源）（检查更新 = **桌面发布·阶段二批落**——单源 = `docs/desktop/design/PACKAGING.md` §2.8.1）；零触面 = `context-menu.mjs`（D27）∥ `projects.mjs`。

## 3. 文件账

### 3.1 本端文件清单与行数预算（菜单族行）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/src/main/menu-words.mjs`（残余族清账批 · 新档；菜单体系批扩键；设置体系升级批扩键；桌面发布·阶段二批扩键） | **145**（实读 2026-10-03——桌面发布·阶段二批实施落盘（115 ⇒ 145：+11 键（菜单四 + 对话框 ∥ 通知七）× zh/en ⇒ 键集 43 + `{version}` 占位三句）；前读 **115**（实读 2026-10-02——设置体系升级批（#817）实施落盘（86 ⇒ 115：+3 键（`settings` ∥ `settingsOpen` ∥ `aboutShortcuts`——键集 29 ⇒ 32）+ `settingsSectionLabels` 读器）；前读 **86**（实读 2026-10-02——菜单体系批实施落盘（30 ⇒ 86）；扩至全菜单键集：组名五 + 条目 + role 标签 + 主题三值 + 最近/关于/占位词））） | **应用菜单词表**（zh/en 常量对 + `menuLabels(locale)` 纯函数；零 `electron` ⇒ 平 node 直测；zh = 语义直译值 ∕ en = 回归面现值——单源 = `docs/batches/2026-09-29-desktop-residuals-sweep.md` §2 #533 行 · `docs/batches/2026-10-02-desktop-menu-system.md` §2） |
| `thincoder-desktop/src/main/app-menu.mjs`（菜单体系批 · 已落；设置体系升级批重组；桌面发布·阶段二批扩项） | **已落 · 158**（实读 2026-10-03——桌面发布·阶段二批实施落盘（143 ⇒ 158：帮助组 +「检查更新…」首项 + sep ∥ `update` 注入（状态 ⇒ label ∥ enabled））；前读 **143**（实读 2026-10-02——设置体系升级批（#817）实施落盘（111 ⇒ 143：设置组重组 + `SETTINGS_GROUPS` 镜像闭集同导出）；前读 111（菜单体系批实施落盘））） | 应用菜单模板纯函数（`menuTemplate({ words, edit, recent, theme, onAction, onNative })`——五组 ∥ 条目 ∥ role/加速键 ∥ 主题▸/最近▸ 子菜单 ∥ 主题勾选态（`checked` 判等；`THEME_VALUES` 导出）∥ `onAction` ∥ `onNative` 两接缝（`onNative(action)` = 宿主自办**四项** `gc` ∥ `index` ∥ `about` ∥ `update`（末项 = 桌面发布·阶段二批 +1）——不经 `ev:menu`）；零 `electron` ⇒ 平 node 直测；决策单源 = 本档 §1 **KD-65**） |
| `thincoder-desktop/renderer/menu-actions.mjs`（菜单体系批 · 已落；设置体系升级批扩支） | **已落 · 44**（实读 2026-10-02——设置体系升级批（#817）实施落盘（37 ⇒ 44：+`openSettings` 分支——六动作闭集）；前读 37（菜单体系批实施落盘）） | 菜单动作落面（`ev:menu` 六动作 → 各既有单一实现分派（#817 收正——五 ⇒ 六：+`openSettings`）；注入缝 ⇒ 平 node 直测；决策单源 = 本档 §1 **KD-65**） |

### 3.2 现有文件改动 · 菜单体系批（实施落盘）

**本批（菜单体系批 · 2026-10-02 · 台账 #811 · 需求 D36）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-02——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 本档 §1 **KD-65**；**实施落盘——2026-10-02**）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/window.mjs` | **229 ⇒ 283**（实施落盘）（buildMenu 改消费 `menuTemplate`（携 `theme` 回读缓存）+ `refreshMenu` + `setMenuTheme`（勾选态缓存收面——表外值零变更）+ focus 重建 + 关于面两行 + `onAction` 接缝；菜单行注「只挂主进程动作面 ∥ 零 IPC 依赖项」句随 KD-65 收正；**越 300 顾问线远内**） | 宿主菜单面 |
| 2 | `thincoder-desktop/src/main/menu-words.mjs` | **30 ⇒ 86**（实施落盘）（全菜单键集；结构 ∥ `normalizeLocale` 归一 ∥ en 回落零改） | 词表面 |
| 3 | `thincoder-desktop/src/main/app-menu.mjs` | **无 ⇒ 111**（实施落盘）（新档——模板纯函数 `menuTemplate({ words, edit, recent, theme, onAction, onNative })`；主题三值 + 勾选态 `checked` 判等 ∥ `THEME_VALUES` 闭集同导出；`onNative(action)` = 宿主自办三项 `gc` ∥ `index` ∥ `about`——不经 `ev:menu`） | 菜单模板面 |
| 4 | `thincoder-desktop/src/main/ipc.mjs` | **270 ⇒ 276**（实施落盘）（`openProjectChannel` 成功径 `refreshMenu()` 调用 + `theme:state` 处理体（`setMenuTheme` 转口 + 回执）+ import ∕ 注） | 项目面 |
| 4b | `thincoder-desktop/src/main/ipc-relays.mjs` | **70 ⇒ 77**（实施落盘）（`configWriteChannel` 成功径 `refreshMenu()`（**语言写径重建点**——KD-65 ④；与 `project:open` 径同形）+ `window.mjs` 单向 import ∕ 注） | 转口面 |
| 4c | `thincoder-desktop/src/main/ipc-registry.mjs` | **90 ⇒ 92**（实施落盘）（`HANDLERS` + `"theme:state"` 行 + import + 头注计数四十六 ⇒ 四十七） | 注册面 |
| 5 | `thincoder-desktop/src/preload/preload.cjs` | **80 ⇒ 83**（实施落盘）（`EVENT_CHANNELS` + `"ev:menu"`（23 ⇒ 24）∥ `CHANNELS` + `"theme:state"`（46 ⇒ 47）+ 头注计数随正） | 桥面 |
| 6 | `thincoder-desktop/renderer/events-subscribe.mjs` | **93 ⇒ 101**（实施落盘）（`CHANNELS` + `"ev:menu"` + 窄口 `onMenu` 参 + 分派行 + 头注） | 订阅面 |
| 7 | `thincoder-desktop/renderer/menu-actions.mjs` | **无 ⇒ 37**（实施落盘）（新档——五动作分派） | 动作落面 |
| 8 | `thincoder-desktop/renderer/app.mjs` | **305 ⇒ 319**（实施落盘）（`searchFace` 捕获 + `onMenu` 接线 + `menuActions` 建面 + import + **主题态回读接线**（装配初值报告 = 写点①）；**越 300 顾问线在册**——随趟登记，拆分预案随下次结构性触碰评估；**本批触属性 = 装配接线（非结构性）**〔新增行全为接线点〕——窗口沿「任一后续批择机」顺延（越层段条目同拍）） | 装配面 |
| 9 | `thincoder-desktop/renderer/mount-composer.mjs` | **296 ⇒ 297**（实施落盘）（face 暴露 `printHelp`——**#761 冻结邻接披露**，批档 §2 上抛 U4） | 输入区面 |
| 10 | `thincoder-desktop/renderer/mount-settings.mjs` | **179 ⇒ 181**（实施落盘）（face 暴露 `setTheme` = 既有 `exits.handlers.onSetTheme` 转名——零第二实现） | 设置面 |
| 10b | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **242 ⇒ 248**（实施落盘）（`setThemeFace` 落地径补主题态回读报告——写点②（`ask("theme:state")`；菜单 ∥ 设置两入口同痕） | 设置出口面 |
| 11 | 批内件 | `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（**已建成 · 300 行 · 五腿 · 8/8 绿**——腿集 = 批档 §2 六） | 全批 |
| 12 | 设计档 | 本档 §1 **KD-65** ∥ 本档 §3.1（新行二 + 三行随动）∥ 本档 §3.2 本块 ∥ 本档 §4（本批块 + `docs/desktop/design/PROJECT.md` §6.1 表头 **D1–D35 ⇒ D1–D36**）∥ 本档 §5（批注 + **T-DSK57**）∥ `docs/desktop/design/PROJECT.md` §8 本批边界行 ∥ 本档 §6 **DG** ∥ `docs/desktop/design/PROJECT.md` §10 **BE**（计数随动）；`docs/desktop/design/SHELL.md` §1 树三行 + §2 菜单行；`docs/desktop/design/UI.md` §1 本批注；`docs/desktop/design/IPC.md` §1 `ev:menu` 行 + §2 `theme:state` 行 + 计数随动（白名单 46 ⇒ 47）；`docs/desktop/design/RENDERER.md`（**机制面零触**——计数随动：档头 **D1–D34 ⇒ D1–D36** ∥ 变更行 `:369`） | 全批 |

零触面：`src/main/context-menu.mjs`（D27 零触 ∥ 只读复用 `contextMenuLabels`）∥ `src/main/projects.mjs`（数据面只读复用——`recentDirs` ∥ `openProject` 零改）∥ `renderer/theme.mjs` ∥ `thincoder-desktop/renderer/search.mjs` ∥ 核件 `thincoder-render-core/**` ∥ 核 `thincoder-core/**` ∥ CLI ∥ VSC；测试面随修随加——不占设计条目（2026-09-27 裁定）。

### 3.3 现有文件改动 · 设置菜单升级批（实施落盘）

**本批（设置菜单升级批 · D38 ∥ D39 · 2026-10-02 · 台账 #817）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-02——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 本档 §1 **KD-67** ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68**；**实施落盘——2026-10-02**）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/menu-words.mjs` | **86 ⇒ 115**（实施落盘）（+三键（`settings` ∥ `settingsOpen` ∥ `aboutShortcuts`）+ `settingsSectionLabels(locale)` 读器；键集 29 ⇒ 32） | 词表面 |
| 2 | `thincoder-desktop/src/main/app-menu.mjs` | **111 ⇒ 143**（实施落盘）（设置组重组——改名 + 设置… + 七组项（`sections` 注入）+ 两子组；`SETTINGS_GROUPS` 镜像闭集同导出） | 模板面 |
| 3 | `thincoder-desktop/src/main/window.mjs` | **283 ⇒ 288**（实施落盘）（`buildMenu` 读 `settingsSectionLabels` + 注入 `sections`） | 宿主菜单面 |
| 4 | `thincoder-desktop/renderer/menu-actions.mjs` | **37 ⇒ 44**（实施落盘）（+`openSettings` 分支；deps +1） | 动作落面 |
| 5 | `thincoder-desktop/renderer/app.mjs` | **319 ⇒ 321**（实施落盘）（deps.`openSettings` 注入——设置面临时双口（页 ∥ 弹窗）转接；**越 300 在册**——本批触属性 = 装配接线（非结构性）） | 装配面 |
| 6 | 弹窗族（设置域） | `docs/desktop/design/SETTINGS.md` §3.2 本批块（新档 `settings-modal.mjs` ∥ `settings-modal.css` + 改档五） | 设置域 |
| 7 | 批内件 | `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（已建成 · 六腿——波 1 三 + 波 2 三） | 全批 |
| 8 | 设计档 | 本档 §1 **KD-67** ∥ §2 本批注 ∥ §3.3 本块 ∥ §4 本批块 ∥ §5 交叉行 ∥ §6 **DI**；`docs/desktop/design/SETTINGS.md`（§1 **KD-68** ∥ §2.10 ∥ §3.2 ∥ §4 ∥ §5 ∥ §6）；`docs/desktop/design/IPC.md` §1 `ev:menu` 行（五 ⇒ 六 + `value` 携主二）+ §1「事件映射」`:52` ∥「载荷键集」`:88`（同拍收正）+ §2 菜单面段；`docs/desktop/design/{SHELL,UI}.md`；`docs/desktop/design/PROJECT.md` §2 登记行二 + §6.1 + §7 + §10 **DI** | 全批 |

零触面：`onNative` 三缝行为（原生对话框 ∥ 原生面板）∥ 帮助组 ∥ 键位面（零新加速键）∥ 通道集（事件 24 ∥ 白名单 47）∥ `preload.cjs` ∥ `ipc-registry.mjs`；测试面随修随加——不占设计条目（2026-09-27 裁定）。

### 3.4 现有文件改动 · 设置菜单组项收窄批（实施落盘）

**本批（设置菜单组项收窄批 · #820 · 2026-10-02 · 需求 D39 收正）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-02——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 本档 §1 **KD-67** ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68** ④；**实施落盘——2026-10-02**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/app-menu.mjs` | **143 ⇒ 143**（实施落盘）（`SETTINGS_GROUPS` 七 ⇒ 六（去 `model`）+ 注面随正（「七组项」∥「组名七值」∥「与 `SCOPES` 同值」⇒ 六名 ∥ 校验七名关系）） | 模板面 |
| 2 | `thincoder-desktop/src/main/menu-words.mjs` | **115 ⇒ 115**（实施落盘）（`SETTINGS_SECTION_KEYS` 七 ⇒ 六 + 注面随正） | 词表面 |
| 3 | `thincoder-desktop/src/main/window.mjs` | **288 ⇒ 288**（实施落盘）（注两行随正（「设置六组段名」∥「组名六值」）——功能零改） | 宿主菜单面 |
| 4 | 零改面 | 渲染面全档（`SECTIONS` ∥ `SCOPES` ∥ 弹窗族 ∥ `menu-actions.mjs` ∥ `store.mjs`——校验七名宽容〔支 A 裁定〕零触 ∥ 设置页七段）∥ `preload.cjs` ∥ `ipc-registry.mjs` ∥ 通道集（事件 24 ∥ 白名单 47）∥ 词表键集（32——零新键）∥ 动作集（六动作）∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC | 零触 |
| 5 | 批内件 | `docs/batches/2026-10-02-settings-menu-trim.test.mjs`（已建成 · 3/3 绿——三腿 = 六项集 ∥ 跨面闭集一致性 ∥ 弹窗仍达六组〔+校验七名宽容 pin〕） | 全批 |
| 6 | 设计档 | 本档 §1 **KD-65** ①② ∥ **KD-67** ①–③ ∥ §2 本批注 + §2.1 项 1 ∥ §3.4 本块 ∥ §4 本批块 ∥ §5 交叉行 ∥ §6 **DJ**；`docs/desktop/design/SETTINGS.md` §1 **KD-68** ④ ∥ §2.11 ∥ §3.2 本批块 ∥ §4 ∥ §5 **T-DSK59**；`docs/desktop/design/IPC.md` §1 `ev:menu` 行；`docs/desktop/design/SHELL.md` §2 菜单行 | 全批 |

零触面：`onNative` 三缝 ∥ 帮助组 ∥ 键位面 ∥ 设置页七段（需求明文零动）∥ 弹窗复用链（七行——设置页对齐）∥ `PROJECT.md` ∥ 需求卷（收正已落——引 `docs/desktop/requirements/SETTINGS.md:18` D39 行内收正句 ∥ `:24` 变更行）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

### 3.5 现有文件改动 · 桌面发布·阶段二批（菜单半——实施落盘）

**本批（桌面发布·阶段二批 · 2026-10-02 · 台账 #810 · 需求回指 = 批档 §1 需求登记③）行「现行 ⇒ 实读（实施落盘）」**（现行 = 实读 2026-10-02；实读 2026-10-03——实施落盘；内容行数口径；机制 ∕ 判据单源 = `docs/desktop/design/PACKAGING.md` §1 **KD-71** ∥ §2.8.1）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/menu-words.mjs` | **115 ⇒ 145**（实施落盘）（+11 键 × zh/en（菜单四 + 对话框 ∥ 通知七）；键集 32 ⇒ 43；宪章句扩「应用菜单与更新面词表」） | 词表面 |
| 2 | `thincoder-desktop/src/main/app-menu.mjs` | **143 ⇒ 158**（实施落盘）（帮助组 +「检查更新…」项（首项 + sep）∥ `update` 注入（状态 ⇒ label ∥ enabled；`ready` ⇒ 「重启以安装更新」）） | 菜单模板面 |
| 3 | `thincoder-desktop/src/main/window.mjs` | **288 ⇒ 336**（实施落盘）（`onNative` +`update` 转口（`setUpdateFace` 注入——沿 `setMenuTheme` 先例）∥ 确认 ∥ 结果对话框两枚；**越 300 顾问线在册**——拆分预案 ∥ 消解窗口 = `docs/desktop/design/PROJECT.md` §4.1 越层段本批行） | 宿主菜单面 |
| 4 | 零改面 | 渲染面全档（`menu-actions.mjs` ∥ `events-subscribe.mjs` ∥ `app.mjs`）∥ `context-menu.mjs` ∥ `projects.mjs` ∥ 通道集（事件 24 ∥ 白名单 47）∥ 动作集（六动作——`ev:menu` 零动）∥ `preload.cjs` ∥ `ipc-registry.mjs` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC | 零触 |
| 5 | 设计档 | `docs/desktop/design/PACKAGING.md`（§1 **KD-71** ∥ §2.8.1 ∥ §3.3 本批块 ∥ §4.3 ∥ §5 **T-DSK60** ∥ §6 **DK**）；本档 §1 **KD-65** ①/②/⑦ 随拍 + 本块 + 变更记录；`docs/desktop/design/PROJECT.md`（§2 ∥ §5 ∥ §8 ∥ §10 **DK** ∥ §7 **T-DSK60**） | 全批 |

零触面：`onNative` 前三缝行为（原生对话框 ∥ 原生面板）∥ 其余四组 ∥ 键位面（零新加速键）∥ 设置组「关于与快捷键」子菜单（**不加更新项**——子菜单名语义 = 快捷键 + 关于；更新项单入口 = 帮助组）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

## 4. 验收回指（需求卷 D36）

**菜单体系批（验收面 · 2026-10-02 · 台账 #811）**：需求回指 = **D36**（五组扩充 ∥ 双语 ∥ 窄通道 ∥ 四默认定案）；设计单源 = 本档 §1 **KD-65** ∥ `docs/desktop/design/SHELL.md` §2 菜单行 ∥ `docs/desktop/design/IPC.md` §1 `ev:menu` 行 ∥ §2 `theme:state` 行 ∥ 本档 §2；
机检面 = 批内件 `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（已建成 · 300 行 · 8/8 绿——五腿：① **菜单树结构**（五组序 ∥ 逐组条目 ∥ 三加速键 ∥ 主题子菜单三值序 = `THEMES` 闭集序 + **带勾态**（`theme` 给定 ⇒ 恰一枚 `checked`；缺省 ⇒ 全假） ∥ 最近子菜单 ≤10 + 空表占位禁用）② **双语 ∥ 回落**（zh/en 词值 + 未知 ∕ 缺 locale ⇒ en 回落——沿 #533 腿形）
  ③ **动作闭集**（五动作 `onAction` 派发正确 ∥ 未知 action ⇒ 零动作 + 记错）④ **词表纪律**（`menuLabels` 键集 = 预期集 ∥ Edit 四值 = `contextMenuLabels` 同源读取）
  ⑤ **通道面**（`preload.cjs` `EVENT_CHANNELS` ∧ `events-subscribe.mjs` `CHANNELS` 双表含 `"ev:menu"` 且等值；**回读面**——`preload.cjs` `CHANNELS` 含 `"theme:state"`（46 ⇒ 47）∧ `ipc-registry.mjs` `HANDLERS` 含同项））；随批留存 · 不进仓套件）；
真机面 = **T-DSK57**（走查十一项：五组双语在场 ∥ 新建会话 ∥ 打开项目 ∥ 最近项 ∥ 查找 ∥ 主题切换 ∥ **主题勾随动**（切主题 ⇒ 当前生效主题带勾——设置面 ∥ 菜单两径）∥ `/help` 打印 ∥ 关于面板含版本 0.10.1 ∥ `CmdOrCtrl+N/O/F` 三键（macOS = Cmd）∥ 边界两查（空最近表 ⇒ 单枚禁用占位；未配 locale ⇒ en 回落））；**离线不可产面**（真菜单 ∥ 原生关于面板 ∥ 系统对话框）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**设置菜单升级批（验收面 · 菜单半 · 2026-10-02 · 台账 #817 · 需求 D38 ∥ D39）**：需求回指 = **D38**（改名 ∥ 设置… 入口 ∥ 维护子组零改）∥ **D39**（七组项 ⇒ 组弹窗）；设计单源 = 本档 §1 **KD-67** ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68**；
机检面 = 批内件 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（已建成——**波 1 腿**：① 菜单树（组名设置 ∥ 条目序 = 设置… ∥ sep ∥ 七组项（序 = `SECTIONS`）∥ sep ∥ 维护▸ 两项 ∥ 关于与快捷键▸ 两项 ∥ 七项 emit 值 = 组名闭集——**跨面闭集一致性**：`SETTINGS_GROUPS`（主）≡ `SECTIONS` 名序（渲染——`SCOPES` 同源派生）源扫）
   ② 词表纪律（键集 32 ∥ `settingsSectionLabels` HOST_DICT 投影 + en 回落）③ 动作闭集六（`openSettings` 两形派发 ∥ 表外 ⇒ 记错））；随批留存 · 不进仓套件；
真机面 = **T-DSK59**（用例行 = `docs/desktop/design/SETTINGS.md` §5——两波合一走查）；**离线不可产面**（原生菜单 ∥ 原生对话框 ∥ 原生面板）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**设置菜单组项收窄批（验收面 · 菜单半 · 2026-10-02 · 台账 #820 · 需求 D39 收正）**：需求回指 = **D39**（菜单组项 七 ⇒ 六——「模型与档位」不入菜单；设置页面七段零动）；设计单源 = 本档 §1 **KD-67** ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68** ④（闭集关系）。
机检面 = 批内件 `docs/batches/2026-10-02-settings-menu-trim.test.mjs`（已建成 · 3/3 绿——三腿：① 六项集（条目序 = 设置… ∥ sep ∥ 六组项（序 = `SECTIONS` 去「模型与档位」）∥ sep ∥ 维护▸ 两项 ∥ 关于与快捷键▸ 两项；六项 emit 值 = 组名闭集；「模型与档位」零在场）；
② 跨面闭集一致性（`SETTINGS_GROUPS`（主）≡ `SECTIONS` 名序去「模型与档位」（渲染）源扫；读取面键序同值）∥ ③ 弹窗仍达六组（逐组开 ⇒ 切片写 + 读取链）+ 校验七名宽容（`model` 受理 = 支 A pin；表外 ⇒ 拒））；随批留存 · 不进仓套件。
前批注（#817 批内件腿①/② 断言 = 七组项快照——**已实证**：本批实施落盘后恰 2 红（2026-10-02 复跑 = `tests 8 ∥ pass 6 ∥ fail 2`；红例 = 腿① `:171` ∥ 腿② `:254`）；处置 = 该档头注（已落）+ 收口互指；#817 记录零触、不追改）。
真机面 = **T-DSK59**（条目面随正 = `docs/desktop/design/SETTINGS.md` §5——六组项）；**离线不可产面**（真菜单）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计面条目（2026-09-27 裁定）。

## 5. 用例

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK57 | 正常 / 边界 · 菜单体系（D36 · 真 Electron） | 真 Electron（三启程）：① 默认家（含历史项目）——逐项走查（**十一项**清单 = 本档 §4）；② 空最近表家（无记录）；③ 未配 locale 家（config 无 `locale` 键） | ① 十一项逐条：五组双语在场（zh ∥ en 各一轮）∥ 新建会话 ∥ 打开项目 ∥ 最近项（≤10 · label = cwd 全路径）∥ 查找 ∥ 主题切换（序 = `THEMES` 闭集序）∥ **主题勾随动**（切主题（设置面 ∥ 菜单两径）⇒ 当前生效主题带勾随动——`data-theme` 值与菜单勾位一致）∥ `/help` 打印（流内）∥ 关于面板含版本 `0.10.1` ∥ `CmdOrCtrl+N/O/F` 三键真触发（记法 = macOS Cmd）∥ 边界两查（空最近表 ⇒ 单枚禁用占位〔不可点〕；未配 locale ⇒ en 回落〔零空白 ∥ 零混排〕）；**离线不可产面**（真菜单 ∥ 原生关于面板 ∥ 系统对话框）= 人工走查 + 父侧真跑闭合（D16 义务） | 机检面 = 批内件 `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（已建成 · 300 行 · 五腿 · 8/8 绿；随批留存 · 不进仓套件）；用例号自铸披露 = §6 **DG** |

**菜单体系批注（验收面 · 2026-10-02 · 台账 #811）**：机检面 = 批内件 `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（已建成 · 300 行 · 五腿 · 8/8 绿——逐条 = 本档 §4）；真机面 = **T-DSK57**（走查十一项——清单 = 本档 §4；用例行 = 本表）；用例行随测试档修加——不进设计面条目（2026-09-27 裁定）。

**设置菜单升级批注（验收面 · 2026-10-02 · 台账 #817）**：真机用例 = **T-DSK59**（全文 = `docs/desktop/design/SETTINGS.md` §5——菜单 ∥ 弹窗两波合一走查；as-of 2026-10-02）；机检腿 = 本档 §3.3 ∥ §4（波 1 三腿）+ `docs/desktop/design/SETTINGS.md` §3.2 ∥ §4（波 2 三腿）。

**设置菜单组项收窄批注（验收面 · 2026-10-02 · 台账 #820）**：真机用例 = **T-DSK59**（条目面随正——六组项；全文 = `docs/desktop/design/SETTINGS.md` §5）；机检腿 = 本档 §3.4 ∥ §4；批档 = `docs/batches/2026-10-02-settings-menu-trim.md`。

## 6. 上抛与登记（DG）

| 行 | 内容 | 状态 | 单源 |
|---|---|---|---|
| DG | **`T-DSK57` 用例号自铸披露 + 菜单体系批（#811）上抛四项**（沿 T-DSK37–T-DSK56 先例——菜单体系批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **窄通道动作数披露**——D36 ∥ §1 现文记「四动作」，设计实取**五**（+`openProject`——渲染面 `openDir` 单一实现 + 会话/轨面随动所需）；若父侧本意四 ⇒ 裁；③ **窗口组（minimize/zoom）去留披露**——D36 ∥ §1 ∥ 台账三处枚举均无它，设计按五组落 = 该组退场；如需保留 = +1 组；④ **关于版权文案取值**（内容权 = 主 agent）——提案 = `© 2026 Shanghai Xinbo Technology Co., Ltd.`（源 = D32 签名主体）；版本 = `app.getVersion()` 动态；⑤ **#761 冻结邻接披露**——`mount-composer.mjs` 增 face 暴露 `printHelp` 一行（slash 批存量文件——UI.md ∥ RENDERER.md 同为其「零写」清单档；本批按派单触其非 slash 区，slash 区零动）；若裁冻结面绝对零触 ⇒ help 另径求助（现无零触替代） | 登记（自铸披露 + 上抛四项——**已裁（引需求档 `:181` ∥ 变更行 `:299`——「D36 动作集收正（四 ⇒ 五）+ 窗口组退场确认」条）**） | 单源 = 本档 §1 **KD-65** ∥ 批档 `docs/batches/2026-10-02-desktop-menu-system.md` §2 上抛项 |
| DI | **`T-DSK59` 用例号自铸披露 + 设置菜单升级批（#817）五披露**（沿 T-DSK37–T-DSK58 先例——本批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **「设置…」落面判定**——设计取「现有设置页」（D38 字面「打开设置面」+ D39「现有设置页保留」）；备选 = 总览弹窗（未采——若父侧本意备选 ⇒ 裁，改动面小）；③ **「关于与快捷键」= 第二入口**（帮助组零动——D36 保持；若父侧裁「移动（帮助组退场）」⇒ 需求变更级，本设计不擅动）；④ **需求侧已收正**（主 agent 笔面——已落）：D36 动作集「五」⇒ **六**（+`openSettings`——沿上批「四 ⇒ 五」收正先例）——引需求卷 `docs/desktop/requirements/MENU.md:12` D36 行内收正句 ∥ `:19` 变更行；⑤ **D39「多子菜单」读法登记**——设计读法 = 「七组项平铺 + 维护 ∥ 关于与快捷键两枚真子菜单」（细目设计定之内——沿 ② 先例）；若父侧原意「每组一条子菜单」⇒ 属 U1 同族细化，请裁。设置半披露 = `docs/desktop/design/SETTINGS.md` §6 **DI（设置半）** | 登记（自铸披露 + **五**披露） | 单源 = 本档 §1 **KD-67** ∥ 批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §2 |
| DJ | **设置菜单组项收窄批（#820）二择项裁定 + 披露一**：① **弹窗校验面 = 支 A（七名宽容）**——菜单不发第七名，零改 `SCOPES`；**读器投影枚举 = 六名**（与组项集对齐）——两裁明写 = 本档 §1 **KD-67** ③ ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68** ④；② **#817 批内件腿①/②（= 七组项快照）实施落盘后预期变红**——处置沿 #811→#817 先例（该档头注 + 收口互指；#817 记录零触）；③ **T-DSK59 条目面随正（六组项——同号复用，不新铸）** | 登记（裁定二 + 披露一） | 单源 = 本档 §1 **KD-67** ∥ 批档 `docs/batches/2026-10-02-settings-menu-trim.md` §2 |

## 变更记录

- 2026-10-02：建档（文档体系重组批 #813 · 波 1 · 迁移轮）——自 `docs/desktop/design/PROJECT.md`（§2 **KD-65** ∥ §4.1 / §4.2 ∥ §6.1 ∥ §7 ∥ §10）∥ `docs/desktop/design/UI.md`（§1 菜单体系本批注）逐字迁入；原址保位指针在册（as-of 2026-10-02）；迁移前历史见 `docs/desktop/design/PROJECT.md` 变更记录。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**设置菜单升级批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §1 ∥ §2 · 台账 #817 · 需求 D38 ∥ D39）：§1 增 **KD-67**（设置组改造——改名 ∥ 设置… 入口 ∥ 七组项 ⇒ 弹窗 ∥ 维护 ∥ 关于与快捷键两子组 ∥ `ev:menu` 五 ⇒ 六 + `value` 携主二 ∥ 词面 +三键 + `settingsSectionLabels` 读器 ∥ 边界 + 被否四候选）；§2 增本批注；**§3.3 新立**（本批块——菜单五档 + 弹窗族 + 批内件 + 设计档）；§4 增本批块；§5 增交叉行；§6 增 **DI**。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**设置菜单升级批 · 修正轮（评审轮 1 · 发现 1–8 ∥ 10 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §3 轮次 1 · 台账 #817）：**KD-65 ①** 树形同拍收正（旧「维护」组两项式 ⇒ 设置组新形——原「维护」改名 + 子组化；与 ② 同口径）+ §2.1 项 1 同拍；§3.3 设计档行 IPC 改动面补列 `:52` ∥ `:88`；§4 机检腿 ① 补**跨面闭集一致性**（`SETTINGS_GROUPS` ≡ `SECTIONS` 名序——按行宽拆行）+ 批注悬指改实（本档 §3.3 ∥ §4）；§6 **DI** ④ 转「已收正」（引需求卷行）+ ⑤ 增（D39「多子菜单」读法登记）+ 四披露 ⇒ 五披露。`docs/desktop/design/SETTINGS.md` ∥ `docs/desktop/design/IPC.md` 同拍（各档明细另见其变更行）。**产品码零触 · 零新语义**（收正 ∥ 登记 ∥ 指位）。明细 = 批档 §2 修正轮块。
- 2026-10-02（**设置菜单组项收窄批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-settings-menu-trim.md` §1 ∥ §2 · 台账 #820 · 需求 D39 收正〔用户 16:53 走查裁〕）：**组项集 七 ⇒ 六**——「模型与档位」不入菜单（设置页面七段零动）；**KD-65** ①② ∥ **KD-67** 头 ∥ ①（六组项——序 = `SECTIONS` 去「模型与档位」）∥ ②（`value`——菜单发出闭集六名 ∥ 渲染面校验 `SCOPES` 七名宽容）∥ ③（读器投影枚举收六）；§2 增本批注 + §2.1 项 1 随正；**§3.4 新立**；§4 增本批块（#817 批内件预期红注）；§5 增交叉行；§6 增 **DJ**。`docs/desktop/design/SETTINGS.md` ∥ `docs/desktop/design/IPC.md` ∥ `docs/desktop/design/SHELL.md` 同拍（明细另见各档变更行）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**设置菜单组项收窄批 · 修正轮（评审轮 1 · 发现 1–4 · 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-settings-menu-trim.md` §3 轮次 1 · 台账 #820）：§3.3「设置菜单升级批」块翻「实读（实施落盘）」（标题 ∥ 说明 ∥ 表头 ∥ 行值以 §3.1 实读为准：menu-words **115** ∥ app-menu **143** ∥ window **288** ∥ menu-actions **44** ∥ app.mjs **321**）；§3.4 设计档行补「§6 **DJ**」；§3.4 零触面行需求卷条目补「收正已落」引（`docs/desktop/requirements/SETTINGS.md:18` ∥ `:24`）。**产品码零触 · 零新语义**（收口 ∥ 登记 ∥ 指位）。明细 = 批档 §2 修正轮块。
- 2026-10-02（**文档清账轮 · 行宽清账（#806 · 轮 6）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-settlement-round.md` §2.12：① §3.2 零触面行短形锚补前缀（`thincoder-desktop/renderer/search.mjs`）；② 宽面 2 行折行（21 ∥ 104——语义零改）。台账 #806。）
- 2026-10-02（**桌面发布·阶段二批 · 设计轮（菜单半）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §1 · 台账 #810）：**KD-65** ①（帮助组 +「检查更新…」项——`host("update")` 主进程更新面）/ ②（`onNative` 自办四项——+`update`）/ ⑦（边界「检查更新」行翻正——桌面发布·阶段二批落）；**§3.5 新立**（本批块——菜单三档 + 零改面 + 设计档行）；`docs/desktop/design/PACKAGING.md`（§1 **KD-71** ∥ §2.8.1 全规——词表键集 32 ⇒ 43）为机制单源。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-03（**桌面发布·阶段二批 · 修复轮（评审轮 1 · 发现 3 ∥ 5 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §3 轮次 1 · 台账 #810）：§2 增本批注（菜单半）+ 项 1 帮助组补首项「检查更新…」（行 29 按语义边界折行——消超宽）+ 项 5 边界随正（「检查更新」移出不做系列 ⇒ 本批落标）；§3.5 行 3 补越线在册（登记 = `docs/desktop/design/PROJECT.md` §4.1 越层段本批行）。**零新语义**（收正 ∥ 登记）。明细 = 批档 §2 修复轮块。
- 2026-10-03（**桌面发布·阶段二批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §2 ∥ §5 · 台账 #810）：§1 **KD-65 ④** 重建点 五 ⇒ **六**（+更新面状态迁移径——实读 `window.mjs:111-113`）；§3.5 翻「实施落盘」形态（标题 ∥ 说明 ∥ 表头 ∥ 三行实读回填：menu-words **145** ∥ app-menu **158** ∥ window **336**）；§3.1 两行走读齐平（menu-words ∥ app-menu——含 `onNative` 四项随正）。**零新语义**（回填 ∥ 收正）。明细 = 批档 §2 回填轮块。
