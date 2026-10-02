# 2026-10-02 · desktop-settings-menu-upgrade
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 15:13 提出（设置界面在菜单里无入口——「维护」改名「设置」+ 设置入口 + 按桌面端特点把配置界面重构为多子菜单弹窗形态，作为现有设置页的升级；现有页先留着）+ 15:19「先按照a做吧」（**A 案 = 应用内模态弹窗**——用户体验裁定）。
> 台账 = #817（desktop · 设置体系升级）。前情 = docs/batches/2026-10-02-desktop-menu-system.md（在途——待核销；本批 = 其设置侧续件）∥ docs/batches/2026-10-02-desktop-settings-layout.md（在途——待核销）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
**本批条目** = D38（菜单侧：改名 + 入口 + 维护子组 + 动作五⇒六）∥ D39（弹窗化主体：多子菜单 ⇒ 应用内模态〔A 案〕；现有设置页零动并存）；**关键判据** = 用户 15:13 原话 ∥ 15:19「先按照a做吧」（B 独立窗 = 明令不做）；**授权口径** = 设计 → 用户点火评审 → 修正 → 用户批准 → 实施（**普通门**——非自动窗）；**父侧裁（应设计开放项）** = **U1 维持设计取法**（「设置…」⇒现有设置页——最贴用户原话；后续撤旧页时再议重指）∥ **U2 准**（「关于与快捷键」= 第二入口，帮助组零动——纯加法）。

**开批登记（2026-10-02 15:2x · 主 agent）**：用户 15:13 提出（设置界面菜单无入口——「维护」改名「设置」+ 设置入口；并按桌面端特点把配置界面重构为多子菜单弹窗形态、作为现有设置页升级，现有页先留着）+ 15:19「先按照a做吧」（**A 案 = 应用内模态弹窗**——用户体验裁定）。**父侧三裁**：① Q1 = **A**（应用内模态——快改快回 ∥ 主题/词表/失败面零割裂 ∥ 复用既有链，质量可控；B 独立窗的两处胜势〔非阻塞 ∥ 并排对照〕不敌其执行风险）；② 分组基线 = 现有七段 + 维护 + 关于与快捷键（细目设计定）；③ 排期 = 波 1 菜单侧先行（改名 + 入口 + 维护子组）∥ 波 2 弹窗化主体随后（同批两波）。

**需求落笔（待讨论 → 待设计）**：**D38** = `docs/desktop/requirements/MENU.md:13`（设置菜单入口）∥ **D39** = `docs/desktop/requirements/SETTINGS.md:18`（设置弹窗化 · A 案 · 现页保留）；总览 `requirements/PROJECT.md` §4 索引随动（37 ⇒ **39** ∥ 计数线 ∥ 变更记录）；台账 **#817**。

**设计轮点名（#42 · eng-designer）**：一案两波（波 1 小可先行）；落点 = 设计 `MENU.md`（KD-65 邻：动作集 +1「打开设置」∥ 词表 maintenance⇒settings）∥ `SETTINGS.md`（KD-66 邻：弹窗化 KD- 新条）∥ `UI.md`（弹窗视觉底）；复用链指名（七段读写/确认/失败 ∥ `settings-confirm.mjs` 弹层先例）；禁改面 = 七段值面语义 ∥ 现页 ∥ B 案。

**【自动跑授权（用户 2026-10-02 15:34「好，你先自动跑完我看结果吧」）】** 射程 = 本批全链自动：设计评审点火（代点火）∥ 修正轮派发 ∥ §4 代签（三条件齐备时）∥ 实施派发 ∥ 收口核销 ∥ 提交；**自缚** = 新范围 ∥ 用户口径裁决 ∥ 复核 🔴 ∥ 验证不过 ⇒ 即停；发布类不可逆 = 用户门。**设计评审已点火**（代点火——范围 = 六设计档 + 需求卷两枚 + 批档挂载 §3）。

**评审轮 1 裁定（2026-10-02 15:5x · 父侧）**：评审 #2 = **changes-required**（§3 轮次 1 在册：🔴1 / 🟡2 / 🔵7）——**逐条裁定 = 全采纳**（无 Not an issue ∥ 无 Deferred）。**修复轮已派**（eng-designer · 九项：#1 IPC :52/:88 六动作收正 + MENU:78 改动面补列 ∥ #2 MENU :13/:24 树形收正 ∥ #3 SETTINGS :214 store.mjs 触属性补判 ∥ #4 DI ④⑤ 改已收正 ∥ #5 MENU:100 悬指改实 ∥ #6 SCOPES 定格 + 闭集关系 ∥ #7 向导占槽腿补/登记 ∥ #8 D39 读法入 DI ∥ #10 双面面态归属明写）。**#9 = 父侧已修**（需求九卷档头「D1–D37 全表查卷口」⇒「D1–D39」——含范围外同族七卷，同类同修；父侧机械笔）。修复落定核读后 ⇒ **评审轮 2 复评（仅核前表）** ⇒ pass ⇒ §4 代签 ⇒ 实施派发。

**锚回线机械笔（父侧 · 可 revert）+ 评审轮 2 点火（2026-10-02 16:0x）**：门复核发现锚 **121 ⇒ 128（+7）**——归因 = #817 设计新引七处（新档 `settings-modal.mjs/css` 未带「拟新增」标〔新档判据 = 认「拟新增」字面〕∥ 四处裸路径形式未解析）；**父侧机械笔七处收正**（`MENU.md:14` `views/settings.mjs` ⇒ 全路径 ∥ `SETTINGS.md:29`×3（`settings-modal.css`+拟新增标 ∥ `settings.css:16` ∥ `settings.css:33-34` 全路径）∥ `:209` ∥ `:210`「本批新档」⇒「拟新增 · 本批新档」∥ `:216` 全路径——**零语义 · 可 revert**）⇒ **锚回线 = 121（= 基线 Δ0 ✓）**；行宽 **105**（本批三档 12 行违例集不变——同日他档差 = `LIGHT-CHANNEL.md` 并发写，非本批）。**评审轮 2 已点火**（收敛协议：仅核前表 ∥ 修复落地物）。

**评审轮 2 = pass + 实施点火（2026-10-02 16:1x · 父侧）**：轮 2（仅核前表）——十项全 **Fixed** 核讫、新问题 0 ⇒ **pass**；token 签发（值不落档）⇒ **§4 代签** ⇒ **eng-coder 实施轮已派**（两波同轮：波 1 菜单侧 ∥ 波 2 弹窗主体 + 批内件六腿）。落定核读后 ⇒ 批内件六腿父侧复跑 + 真机腿（T-DSK59 · 用户面）⇒ §6 收口。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两波一案（设置组改造 D38 ∥ 设置弹窗化 D39）；设计档六档同拍已落，读回见 §2.10；修正轮（评审轮 1 · 九项全采纳）已落——见 §2.11；上抛/披露见 §2.7 ∥ 开放项见 §2.10 末行）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

# §2 批次任务与设计（eng-designer · 设计轮 · 2026-10-02）

> 两波一案（同一批档承载）——**波 1 · 菜单侧**（改名 ∥ 入口 ∥ 子组 ∥ 窄通道 +1 ∥ 词面）∥ **波 2 · 设置弹窗化主体（A 案）**（七组项 ⇒ 应用内模态弹窗 ∥ 现有页零动并存）。**本轮纯设计——产品码零触**。

## 2.1 本批覆盖需求条目（需求回指 = D38 ∥ D39 · 台账 #817）

| # | 条目 | 设计落点（单源） | 判据 |
|---|---|---|---|
| 1 | **波 1 · 设置组改造**——顶级「维护」改名「设置」（双语词表随动）+「设置…」入口 ⇒ 现有设置页 + 原维护两项归「维护」子组（行为零改） | `docs/desktop/design/MENU.md` §1 **KD-67** ①④ | 批内件波 1 腿① + T-DSK59 |
| 2 | **波 1 · 窄通道动作 +1**——`ev:menu` 五 ⇒ **六**（+`openSettings`；`value` 携主二：`theme` 三值 ∥ `openSettings` 组名七值——缺 ⇒ 开设置面） | **KD-67** ② ∥ `docs/desktop/design/IPC.md` §1 `ev:menu` 行（同拍已收正） | 批内件波 1 腿③ |
| 3 | **波 1 · 词面收正**——`menu-words.mjs` +三键（`settings` ∥ `settingsOpen` ∥ `aboutShortcuts`）+ `settingsSectionLabels` 读器（HOST_DICT 投影——零第二份） | **KD-67** ③ | 批内件波 1 腿② |
| 4 | **波 2 · 组弹窗（A 案）**——七组项 ⇒ 应用内模态弹窗（单组 ∥ 七段读写 ∥ 确认 ∥ 失败链全复用；复用链指名 = 组 → 段体 → 读取 → 出口） | `docs/desktop/design/SETTINGS.md` §1 **KD-68** ①–③ | 批内件波 2 腿④⑤ + T-DSK59 |
| 5 | **波 2 · 开合 ∥ 状态 ∥ 重绘**——`settings.modal` 切片 ∥ 三关（Esc ∥ 背板 ∥ ✕）∥ 第二闸草稿保真 ∥ 双面并存 | **KD-68** ④–⑦ | 批内件波 2 腿④⑤ |
| 6 | **并存 ∥ 边界**——现有设置页零动 ∥ B 案（独立窗）不做 ∥ 七段值面语义不改 ∥ 帮助组零动 | **KD-67** ⑥ ∥ **KD-68** ⑦⑧ | T-DSK59 ⑦⑧ |

**本批不做（条目面）**：独立设置窗口（B 案——用户 15:19 明令）∥ 现有设置页撤除（保留并存——验收 OK 后再议撤）∥ 帮助组改动（「关于与快捷键」= 第二入口；移动 = 需求变更级）∥ 七段值面语义 ∥ 全量快捷键体系 ∥ 托盘 ∥ 自绘菜单。

## 2.2 设计块（两波一案 · 决策单源 = `MENU.md` §1 KD-67 ∥ `SETTINGS.md` §1 KD-68）

① **菜单树（波 1 + 波 2 菜单侧 · KD-67 ①）**：
设置[设置… → `ev:menu{openSettings}`（缺 `value`）⇒ **现有设置页**（零动） ∥ sep ∥ 七组项（渠道… ∥ 模型与档位… ∥ agent 参数… ∥ MCP… ∥ 运行环境… ∥ 工具与服务… ∥ 会诊与审查…——序 = 渲染面 `views/settings.mjs` `SECTIONS` 段序；label = HOST_DICT `settings.section.*` 投影 + 「…」后缀（菜单形））→ `ev:menu{openSettings, value:组名}` ⇒ 组弹窗 ∥ sep ∥ 维护▸[清理会话数据… → `host("gc")` ∥ 重建会话索引 → `host("index")`] ∥ 关于与快捷键▸[命令与快捷键… → `emit("help")` ∥ 关于 ThinCoder… → `host("about")`]]；
词键：`maintenance` 保留（值「维护」/「Maintenance」不变——现役 = 子组标签）；顶级 = 新键 `settings`（「设置」/「Settings」）。

② **窄通道（波 1 · KD-67 ②）**：`ev:menu` 动作闭集 五 ⇒ **六**；`value` 携主二；**零新通道**（事件 24 ∥ 白名单 47 ∥ `preload.cjs` ∥ `ipc-registry.mjs` 零触）；**KD-65 ② 同拍收正**（已落——`MENU.md` §1）。

③ **弹窗体（波 2 · KD-68 ①⑥）**：背板（`document.body` 直挂 ∥ `fixed inset 0` ∥ z-**20** ∥ `--overlay`）+ 居中卡（z-**21** ∥ 宽 ≤48rem ∥ 高 ≤视口−2gap ∥ 内滚 ∥ `--bg-raised` + 1px `--line` 描边 + `--shadow`）；z 族 = 设置面 10 < 弹窗 20/21 < 确认弹层 40/41 < 引导层 200；**新档 `renderer/settings-modal.css`**（`settings.css` 零触——在册越线零结构触碰）；三关（背板 ∥ ✕ ∥ 卡内 Esc〔stopPropagation〕）+ 初始焦点 ✕ + 零焦点陷阱（边界）+ `role="dialog"`/`aria-modal`。

④ **单组内容 = 复用链（波 2 · KD-68 ③——逐组指名）**：providers → `providersBody` ∥ `loadProviders()` ∥ providerSegments+exits 表；model → `modelBody` ∥ `loadProviders()`（含模型候选随动）∥ modelSegments 表；agent → `agentBody` ∥ `loadAgent()` ∥ agentSegments 表；mcp → `mcpBody` ∥ `loadMcp()` ∥ segments 表（MCP 族）；env → `envBody` ∥ `loadEnv()` ∥ segments 表（env 族）；tools → `toolsBody` ∥ `loadTools()` ∥ segments 表（工具族）；models → `modelsBody` ∥ `loadAgent()`（models 块——R7 同拍）∥ modelSegments 表——**出口 = 同一 `exits.handlers` 全表**（视图 `data-action` 同域——零第二份）。

⑤ **开合 ∥ 重绘（波 2 · KD-68 ④⑤）**：`settings.modal` 切片（`null ∥ 组名七值`）；开 = `SCOPES` 验证（表外 ⇒ 记错零动作）+ 占槽拒（向导期）+ 本组面态复位 + 本组读取；关 = 切片清 + 本组复位 + `closeSettingsConfirm()`（子确认同清）；`closeSettings()` 同拍清 `modal`；**第二闸**（沿 #604 同形：捕获 ∥ 重建 ∥ 复填 + `modalResidue` 独立残件 + 失效集一次性同滤两捕获）；`refreshSettings` 在场判据 +`modal != null`。

⑥ **两子组处置（父侧「你判」两项——本设计取）**：维护两项 = **原生对话框零改**（D38「行为零改」）；关于 = **原生面板零改**（D36 已裁）；命令与快捷键 = `/help` 打印零改（D36 已裁）——三缝全零改；**不做弹窗化**（无配置组语义——新内容面非本批射程）。

⑦ **设计档落点（同拍已落——读回见 §2.9）**：`MENU.md`（§1 **KD-67** ∥ §2 本批注 ∥ §3.3 本批块 ∥ §4 验收块 ∥ §5 交叉行 ∥ §6 **DI** ∥ 档头 D36 ∥ D38）∥ `SETTINGS.md`（§1 **KD-68** ∥ §2.10 ∥ §3.2 本批块 ∥ §4 ∥ §5 **T-DSK59** ∥ §6 **DI（设置半）** ∥ 档头 +D39）∥ `IPC.md`（§1 `ev:menu` 行 五 ⇒ 六 + `value` 携主二 ∥ §2 菜单面段）∥ `PROJECT.md`（§2 登记行 KD-67/68 ∥ §6.1 表头 D1–D39 + 本批批块指针 ∥ §7 T-DSK59 ∥ §8 本批边界行 ∥ §10 **DI**）∥ `SHELL.md`（§1 树 +`settings-modal.mjs` ∥ 静态资源行 +`settings-modal.css` ∥ `menu-actions.mjs` 行六动作 ∥ §2 菜单行）∥ `UI.md`（§1 本批注指针）。
**残余落点（随实施落盘批补齐——沿 D37 先例「后续新档由落盘批在本表补行」）**：`PROJECT.md` §4.1 新档行（`settings-modal.mjs` ≈95 ∥ `settings-modal.css` ≈40）+ §4.2 本批块登记。

## 2.3 受影响文件「现行 ⇒ 预期」（实读 2026-10-02；单源 = `MENU.md` §3.3 ∥ `SETTINGS.md` §3.2 本批块）

| # | 档 | 现行 ⇒ 预期（内容行数口径） | 波 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/menu-words.mjs` | **86 ⇒ ≈110**（+3 键 + `settingsSectionLabels`；键集 29 ⇒ 32） | 1 |
| 2 | `thincoder-desktop/src/main/app-menu.mjs` | **111 ⇒ ≈150**（设置组重组 + `sections` 注入 + `SETTINGS_GROUPS` 镜像闭集同导出） | 1 |
| 3 | `thincoder-desktop/src/main/window.mjs` | **283 ⇒ ≈287**（读 `settingsSectionLabels` + 注入） | 1 |
| 4 | `thincoder-desktop/renderer/menu-actions.mjs` | **37 ⇒ ≈45**（+`openSettings` 分支；deps +1） | 1 |
| 5 | `thincoder-desktop/renderer/app.mjs` | **319 ⇒ ≈321**（deps.`openSettings` 注入；**越 300 在册**——触属性 = 装配接线（非结构性）） | 1∥2 |
| 6 | `thincoder-desktop/renderer/settings-modal.mjs` | **无 ⇒ ≈95**（本批新档——弹窗宿主：树纯函数 + 单例挂载 ∥ 刷新 ∥ 关闭 + Esc ∥ 焦点；沿 `settings-confirm.mjs` 先例） | 2 |
| 7 | `thincoder-desktop/renderer/settings-modal.css` | **无 ⇒ ≈40**（本批新档——背板 ∥ 居中卡 ∥ 体列；零新变量 ∥ 零新断点） | 2 |
| 8 | `thincoder-desktop/renderer/views/settings.mjs` | **364 ⇒ ≈378**（+`settingsModalTree` 导出（单组树——复用档内私有 `noticeNode` ∥ `sectionStateNode` ∥ `sectionBody`）；**越 300 在册**——触属性 = 导出面 +1（非结构性）） | 2 |
| 9 | `thincoder-desktop/renderer/mount-settings.mjs` | **181 ⇒ ≈218**（第二闸 + `openSettingsModal` ∥ `closeSettingsModal` 装配 + face 返回 + 读取链表 + `refreshSettings` 判据扩） | 2 |
| 10 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **248 ⇒ ≈252**（F-Esc 闸 +`modal != null` 守卫；`closeSettings` 同清 `modal`） | 2 |
| 11 | `thincoder-desktop/renderer/store.mjs` | **330 ⇒ ≈331**（settings 切片 +`modal: null`） | 2 |
| 12 | `thincoder-desktop/renderer/index.html` | **56 ⇒ ≈57**（+`settings-modal.css` 链行——settings.css 后） | 2 |
| 13 | 零改面 | `renderer/settings.css`（304——新样式入新档；在册越线零触）∥ `renderer/settings-confirm.mjs`（80——只读复用）∥ `views/settings-sections*.mjs`（六档）∥ `mount-settings-segments*.mjs`（四档）∥ `mount-settings-reads.mjs` ∥ `i18n-settings.mjs`（**零新键**——复用段名 + `settings.close`）∥ `views/onboarding.mjs` ∥ `preload.cjs` ∥ `ipc-registry.mjs` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC | — |
| 14 | 批内件 | `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（拟新增 · ≈300 行 · 六腿——波 1 三 + 波 2 三） | 全批 |

## 2.4 机检腿（批内件 · 六腿——每波独立三条；随批留存 · 不进仓套件）

**波 1（三条）**：
① **菜单树结构**——组名 = 设置（双语）∥ 条目序 = [设置… ∥ sep ∥ 七组项（序 = `SECTIONS`）∥ sep ∥ 维护▸ 两项 ∥ 关于与快捷键▸ 两项]；七组项 emit = `("openSettings", undefined, 组名)` 闭集 ∥ `maintenance` 键值保持（「维护」）∥ `settings`/`settingsOpen`/`aboutShortcuts` 三键在位；
② **词面 ∥ 回落**——`settingsSectionLabels` = HOST_DICT `settings.section.*` 投影 ∥ 未知 / 缺 locale ⇒ en 回落 ∥ 缺键 ⇒ 键名终态；键集 29 ⇒ 32；与 `HOST_DICT` 零重叠键（菜单自持键面）；
③ **动作闭集六**——`menu-actions` 六动作派发正确（`openSettings` 两形：缺 `value` ⇒ 页 ∥ 携组名 ⇒ 弹窗）∥ 表外 action ⇒ 零动作 + 记错。

**波 2（三条）**：
④ **弹窗树结构**——`settingsModalTree` 平 node：背板 ∥ 卡 `role="dialog"` + `aria-modal` ∥ 头（组名标题 + ✕ 锚 `settings:modalClose`）∥ 体恰一组 ∥ notice 过滤两向（本组 ∨ panel 显 ∥ 他组隐）∥ Esc / 背板 / ✕ handler 在场；
⑤ **复用链 ∥ 状态**——七组 → 段体 ∥ 读取 ∥ 出口映射在场（逐组指名表）∥ `settings.modal` 闭集验证 ∥ 表外组 ⇒ 记错 + 零动作 ∥ `store` 初值 `modal: null`；
⑥ **样式 ∥ 链序**——`settings-modal.css`：z-20/21 在位 ∥ 零 `--` 定义（零新变量）∥ 零 `@media`（零新断点）∥ `settings.css` 零触（304 在盘 ∥ 无 modal 规则）∥ `index.html` 链行在 settings.css 后。

真机面 = **T-DSK59**（两波合一走查——清单 = `SETTINGS.md` §5；**离线不可产面**（真菜单 ∥ 原生对话框 ∥ 原生面板 ∥ 真渲染视觉）= 人工走查 + 父侧真跑闭合（D16 义务））。

## 2.5 验收对照（逐条回指）

- **D38**：① 改名 ✓（词键 `settings`；KD-67 ①）∥ ② 「设置…」⇒ 打开设置面 ✓（现有页——KD-67 ①④；备选登记 = U1）∥ ③ 维护两项归子组行为零改 ✓（KD-67 ①⑥——原生缝零触）——判据 = 波 1 腿①③ + T-DSK59 ①②⑦。
- **D39**：① A 案 ✓（KD-68 ①）∥ ② 多子菜单（七段 + 维护 + 关于与快捷键）✓（KD-67 ①）∥ ③ 每子菜单项 ⇒ 组弹窗 + 七段读写/确认/失败链复用 ✓（KD-68 ③——复用链指名）∥ ④ 现有页保留 ✓（KD-68 ⑦——零动）∥ ⑤ 边界（独立窗 ∥ 不删页 ∥ 值面语义）✓（KD-68 ⑧）——判据 = 波 2 腿④⑤⑥ + T-DSK59 ③–⑨。

## 2.6 关键决策（本案内 · 逐项给由）

- **「设置…」落面 = 现有设置页**——D38「打开设置面」字面 + D39「现有设置页保留」；备选 = 总览弹窗（未采——非派单口径；登记 U1）。
- **七组项 label = HOST_DICT `settings.section.*` 投影**（+「…」后缀 = 菜单形）——零第二份（沿 KD-65 ③ 编辑四值先例）；被否 = menu-words 自持七键（词值两源——段名改则菜单漂移）。
- **`value` 携主二**（theme ∥ openSettings 组名）——被否 = 新载荷键 `group`（键面净增；`value` 恰为其「动作参数」义位）。
- **弹窗不进 slot**——被否 = slot 内渲染（`:empty`/`[data-state]` 退场规则 + 48rem 列形态打架）∥ 复用 `.auto-backdrop`/`.auto-confirm` 族（22rem 宽 ∥ 确认语义 ∥ z 40/41 叠序冲突）。
- **维护 ∥ 关于与快捷键 = 行为零改（不弹窗化）**——D38 字面 ∥ D36 已裁；关于/快捷键弹窗版 = 新内容面（非本批射程）。
- **帮助组零动**（「关于与快捷键」= 第二入口）——移动 = 需求变更级（破 D36 五组枚举）⇒ 上抛 U2。

## 2.7 上抛项（父侧裁 ∥ 披露）

- **U1 · 「设置…」落面**——设计取「现有设置页」；备选 = 总览弹窗（全七组导航）——若父侧本意备选 ⇒ 裁（改动面小：入口转口一行 + 弹窗总览树）。
- **U2 · 「关于与快捷键」动静**——本设计 = 第二入口（帮助组零动）；若父侧裁「移动」（帮助组退场）⇒ 需求变更级（D36 五组枚举）。
- **U3 · 需求侧收正（主 agent 笔面）**——D36 动作集「五」⇒ **六**（+`openSettings`——沿上批「四 ⇒ 五」收正先例）。
- **披露 · §4.1 新档行未落**——`settings-modal.mjs` ∥ `settings-modal.css` 行随实施落盘批补（沿 D37 先例）。
- **披露 · T-DSK59 号自铸**（沿 T-DSK37–58 先例；若并行批占用同号 ⇒ 并号裁定）。

## 2.8 零触面 ∥ 界外发现（报告面）

**零触面**：`onNative` 三缝（`gc` ∥ `index` ∥ `about`——原生行为零改）∥ 帮助组 ∥ 键位面（零新加速键）∥ 通道集（事件 24 ∥ 白名单 47）∥ `preload.cjs` ∥ `ipc-registry.mjs` ∥ `settings.css`（越线在册保持）∥ `settings-confirm.mjs` ∥ `views/settings-sections*.mjs`（六档）∥ `mount-settings-segments*.mjs`（四档）∥ `i18n-settings.mjs`（零新键）∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC。

**界外发现（列报——本批不处置）**：
① `thincoder-desktop/renderer/mount-settings-exits.mjs:197` 注释「设置面开（**两入口**：信息行 ∕ 输入区控件行第 7 钮）」——「信息行」视图随会话模型轮 R13 已裁撤（同源句 = `mount-settings.mjs:5-6`「本档零信息行挂载面」）⇒ **陈旧残句**（现役入口 = 控件行第 7 钮 + `composer-wire.mjs` footer 三出口映射；派单文「两处入口」同据该残句——实况 = 唯一 UI 入口）；处置建议 = 该档本批在触（Esc 闸）⇒ 随实施批顺手收正注释，或列报另批。
② 批档 §1 正文仍为模板占位（`<§1 模板占位……>`；`**状态行**：🔄 进行中（…）`）——本设计以派单 brief + 需求卷 D38/D39 + 台账 #817 为据（口径自足）；**列报主 agent**（§1 回填 ∥ 或确认以 brief 为准）。

## 2.9 歧义自查（预评审——逐句「会不会被读成第二个意思」）

- **「设置面」**——本案一律写「现有设置页」/「现有设置面（零动）」，避免裸「设置面」被读成弹窗集；KD-68 ⑦ 显写「双面并存」。
- **「多子菜单」**——本设计 = 七组项为**平铺条目** + 维护 ∥ 关于与快捷键两枚**真子菜单**；若父侧原意「每组一条子菜单」⇒ 属 U1 同族细化（未采——细目授权在案）。
- **「关于与快捷键」**——显写「= 帮助组同二项之**第二入口**；帮助组零动」，防被读成「移动」。
- **「波 1 ∥ 波 2」**——同一批两波（非两批）；批档 §2 一案承载，实施可两舱并进。
- **「零动」**——限定对象 = **现有设置页行为面**；`views/settings.mjs` 的 +1 导出 = 纯加法（页行为零改）——KD-68 ⑦ 与 §3.2 行 3 同口径。
- **「零新通道」**——`ev:menu` 为既有通道；+1 = **动作**（非通道）；事件 24 ∥ 白名单 47 计数不动——已在 KD-67 ② ∥ IPC 行 ∥ §3.3 三处齐平。

## 2.10 设计档落点读回（本轮回读记录）

- `MENU.md`：KD-67 行（§1）✓ ∥ §2 本批注 ✓ ∥ §3.3 本批块 ✓ ∥ §4 验收块 ✓ ∥ §5 交叉行 ✓ ∥ §6 DI ✓ ∥ 变更记录 ✓ ∥ 档头 D36 ∥ D38 ✓ ∥ KD-65 ② 收正 ✓。
- `SETTINGS.md`：KD-68 行（§1）✓ ∥ §2.10 ✓ ∥ §3.2 本批块 ✓ ∥ §4 验收块 ✓ ∥ §5 T-DSK59 ✓ ∥ §6 DI（设置半）✓ ∥ 变更记录 ✓ ∥ 档头 +D39 ✓。
- `IPC.md`：§1 `ev:menu` 行（六值 + `value` 携主二 + 消费两落径）✓ ∥ §2 菜单面段 ✓ ∥ 变更记录 ✓。
- `PROJECT.md`：§2 登记行二 ✓ ∥ §6.1 表头 D1–D39 + 本批批块指针 ✓ ∥ §7 T-DSK59 ✓ ∥ §8 本批边界行 ✓ ∥ §10 DI ✓ ∥ 变更记录 ✓。
- `SHELL.md`：§1 树 +2 处（新档行 ∥ 静态资源行）✓ ∥ `menu-actions.mjs` 行 ✓ ∥ §2 菜单行 ✓ ∥ 变更记录 ✓。
- `UI.md`：§1 本批注指针 ✓ ∥ 变更记录 ✓。
- **未落（残余）**：`PROJECT.md` §4.1 新档行二 + §4.2 本批块登记（随实施落盘批补——沿 D37 先例）；需求侧收正（D36 五 ⇒ 六）= 主 agent 笔面（U3）。

## 2.11 修正轮（评审轮 1 采纳项 · 九项逐号落盘 · 2026-10-02）

**口径** = 父裁「全采纳」（无驳回）；**点修**（不重设计 ∥ 不扩面 ∥ 不重勘）；产品码零触。**逐号落盘（读回 `file:line`——仓根 = `thincoder/`）**：

| # | 落点（读回） | 改动摘要 |
|---|---|---|
| 1 | `docs/desktop/design/IPC.md:52` ∥ `:88`；`docs/desktop/design/MENU.md:78` | `ev:menu` 动作闭集两处残值「五」⇒「六」（+`openSettings`——与同档 `:39` 行同值）；MENU §3.3 设计档行 IPC 改动面补列 `:52` ∥ `:88` |
| 2 | `docs/desktop/design/MENU.md:13` ∥ `:24` | KD-65 ① ∥ §2.1 项 1 树形旧读「维护[现状两项]」⇒ 设置组新形（原「维护」改名 + 子组化——与 KD-67 ∥ KD-65 ② 收正同口径） |
| 3 | `docs/desktop/design/SETTINGS.md:214` | `store.mjs` 行补触属性判定 = 既有切片 +1 键（**非结构性**——无新切片 ∕ 切片族结构零变；对照 #761 ∥ #764「有新增面」入册判据）⇒ 消解窗口顺延 |
| 4 | `docs/desktop/design/MENU.md:108` ∥ `docs/desktop/design/SETTINGS.md:277` | DI ④ ∥（设置半）⑤「需求侧待收正」⇒「已收正」（引 `docs/desktop/requirements/MENU.md:12` D36 行内收正句 ∥ `:19` 变更行） |
| 5 | `docs/desktop/design/MENU.md:101` | 机检腿悬指（`PROJECT.md` §4.2 无本批条目）⇒ 改实指：本档 §3.3 ∥ §4 + `SETTINGS.md` §3.2 ∥ §4（二择一取「改实指」支——`PROJECT.md` 零触） |
| 6 | `docs/desktop/design/SETTINGS.md:29` ∥ `:124`；`docs/desktop/design/MENU.md:89` | `SCOPES` 定义位点名（**既有**——`thincoder-desktop/renderer/mount-settings.mjs:39`，自视图 `SECTIONS` 派生）+ 闭集三面（`SECTIONS` → `SCOPES` ∥ `SETTINGS_GROUPS`）源 ∕ 镜像关系句；波 1 腿 ① 补**跨面闭集一致性**（`SETTINGS_GROUPS` ≡ `SECTIONS` 名序——按行宽拆行，±0 语义；新拆行 = `MENU.md:90`） |
| 7 | `docs/desktop/design/SETTINGS.md:241` | 波 2 腿 ⑤ 补「向导占槽期拒」判据（占槽期开 ⇒ 拒 + 记错 + 零动作） |
| 8 | `docs/desktop/design/MENU.md:108` | DI 增 ⑤——D39「多子菜单」读法登记（细目设计定之内；沿 ② 先例）；四披露 ⇒ 五披露 |
| 10 | `docs/desktop/design/SETTINGS.md:29` | KD-68 ⑦ 补**面态归属 = 单树共享**（开 ∥ 关的本组复位两面同效——明示接受；接受由 = 单树复用零第二份 ∥ 复位限本组） |

（#9 = 父侧已修〔需求九卷档头 D1–D39〕——本轮零触。）

**设计档变更记录**（同拍）：`MENU.md:115` ∥ `SETTINGS.md:289` ∥ `IPC.md:496`（三档各一行）。

**门复跑**（`node scripts/doc-check.mjs`——仓根 = `thincoder/`）：① **锚** = 悬空 **437 ⇒ 437（零新增）**；本批三档违例行集不变（同 12 行同位）。② **行宽** = 106 ⇒ **105**——差额唯一 = `docs/core/design/LIGHT-CHANNEL.md:67`（**非本批文件**——届盘 git 状态 = M，他侧并发在写；两次门跑间该行不再超宽）——与本批零因果；本批拆行处全部 ≤300（`MENU.md:89` 300 ⇒ 257 ∥ `:90` 116）。③ 本批文件新增行 = 报告面（不入闸）符号·宽 **4** 条（`SETTINGS_GROUPS` 报备——拟新增符号，沿既有报告面先例）。④ 行数面差异 **0**（比对 156 行）。

**禁面零触**：需求档（#9 父侧笔）∥ 批档 §3 ∥ `PROJECT.md`（第 5 条取「改实指」支）∥ 记录面追改（仅各档新增变更行）。**残余落点保持**：`PROJECT.md` §4.1 新档行二 + §4.2 本批块登记——随实施落盘批补（沿 D37 先例，§2.10 末行在册）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 桌面设置体系升级批（#817）设计（KD-67 ∥ KD-68）；评审面 = 8 档（design/MENU ∥ SETTINGS ∥ IPC ∥ PROJECT ∥ SHELL ∥ UI + requirements/MENU ∥ SETTINGS）；代码面 ∥ 批档未读（表中标注处 unverified）。
引用约定（短名 = 全路径）：`MENU.md` = `thincoder/docs/desktop/design/MENU.md`；`SETTINGS.md` = `thincoder/docs/desktop/design/SETTINGS.md`；`IPC.md` = `thincoder/docs/desktop/design/IPC.md`；`PROJECT.md` = `thincoder/docs/desktop/design/PROJECT.md`；`requirements/MENU.md` = `thincoder/docs/desktop/requirements/MENU.md`；`requirements/SETTINGS.md` = `thincoder/docs/desktop/requirements/SETTINGS.md`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性 | 🔴 | `ev:menu` 动作闭集同档两处仍为旧值：`IPC.md:39`（§1 行）∥ `IPC.md:97`（菜单面段）已为「六值／六动作（+`openSettings`）」，而 `IPC.md:52`（事件映射段注——「动作闭集五 `newSession` ∕ `openProject` ∕ `find` ∕ `theme` ∕ `help`」）∥ `IPC.md:88`（载荷键集条——「闭集五动作」；该段自注「单源 = 本段」）未收正——同一机制两处描述不一致；本批 IPC 改动面（`MENU.md:78`）仅列「§1 `ev:menu` 行 + §2 菜单面段」，未含该两处 | 两处对齐六动作（并在 `MENU.md` §3.3 设计档行的 IPC 改动面补列 `:52` ∥ `:88`） |
| 2 | 文档一致性 | 🟡 | `MENU.md:13`（KD-65 ① 五组串含「维护[现状两项]」）∥ `MENU.md:24`（§2.1 项 1 同）未随 KD-67（`MENU.md:14` 顶级组 = 设置）收正——而本批已就地收正同档 KD-65 ②（五 ⇒ 六）；同档并存两套树形读数 | 两处同拍收正（或以「KD-67 起取代」注记标记——与 KD-65 ② 同口径） |
| 3 | 文件账 | 🟡 | `SETTINGS.md:214`（`store.mjs` 330 ⇒ ≈331——新增 `settings.modal` 面）未声明本批触属性；该档越 300 在册（`PROJECT.md:365` ∥ `:376`「两度结构性触碰（新增面）⇒ 评估窗口触发；父侧裁 = 续期」）——结构性判定悬空（三度触发？）；对照 `SETTINGS.md:211` ∥ `MENU.md:75` 两行均已声明「非结构性」（app.mjs 先例 = `PROJECT.md:386`） | 该行补注触属性判定（或将判定列入上抛） |
| 4 | 文档一致性 | 🔵 | DI ④ ∥ ⑤ 仍记「需求侧待收正」（`MENU.md:107` ∥ `SETTINGS.md:277`）；需求侧已收正（`requirements/MENU.md:12` D36 行内「2026-10-02 D38 收正：⇒ 六」∥ `:19` 变更记录），且 `MENU.md:13` KD-65 ② 称「收正先行」 | DI ④ ∥ ⑤ 改「已收正（引需求卷 D36 行 ∥ 变更行）」 |
| 5 | 文档一致性 | 🔵 | `MENU.md:100`「机检腿 = `PROJECT.md` §4.2 ∥ §6.1 本批块（波 1 三腿）」——`PROJECT.md` §4.2 无本批条目（全档「设置菜单升级」仅命中 `:182` ∥ `:917` ∥ `:1672`）；腿实体在 `MENU.md:89` ∥ `:88` 与 `SETTINGS.md:241` ∥ `:240` | 指向改「本档 §3.3 ∥ §4 + `SETTINGS.md` §3.2 ∥ §4」或补 `PROJECT.md` §4.2 本批条目 |
| 6 | 清晰度 | 🔵 | `SCOPES` 未点名出处 ∥ 新旧（`SETTINGS.md:29` KD-68 ④ ∥ `SETTINGS.md:124` §2.10 项 3——仅此两处）；`SETTINGS_GROUPS`（`MENU.md:72`「镜像闭集同导出」）∥ `SCOPES` ∥ `SECTIONS` 源 ∕ 镜像关系与漂移检测未述 | 点名 `SCOPES` 定义位（既有 ⇒ 指位；新 ⇒ 文件账补项）+ 可补跨面闭集一致性腿（`SETTINGS_GROUPS` ≡ `SCOPES`／`SECTIONS` 源扫） |
| 7 | 验收面 | 🔵 | 「向导占槽期拒」（`SETTINGS.md:29` KD-68 ④）无判据条目——波 2 三腿（`SETTINGS.md:241`）未含；T-DSK59 夹具 = 已配家（`SETTINGS.md:265`）向导径不可达 | 补一腿（占槽期开 ⇒ 拒 + 记错）或登记为接受缺口 |
| 8 | 需求覆盖 | 🔵 | D39 字面「设置菜单内多子菜单…每子菜单项 ⇒ 打开…弹窗」（`requirements/SETTINGS.md:18`）与设计「七组项平铺」读法（`MENU.md:14`）差异未登记（DI ② 先例 = `MENU.md:107`） | 该读法一并列入上抛登记（「细目设计定」之内） |
| 9 | 文档一致性 | 🔵 | 需求两卷档头指针「D1–D37 全表查卷口」（`requirements/MENU.md:4` ∥ `requirements/SETTINGS.md:4`）与卷内 D38（`requirements/MENU.md:13`）∥ D39（`requirements/SETTINGS.md:18`）时差（对账对象 = `requirements/PROJECT.md` §4——范围外，unverified） | 与需求总览 §4 现值对账后同拍 |
| 10 | 清晰度 | 🔵 | 双面同开交叠口径未载（面态是否双面共享无文档口径——unverified）：KD-68 ⑦「两面可同开」∥ ④ 开 =「本组面态复位」（`edit/probe/draft/keyDraft` ∥ `form`）（同 `SETTINGS.md:29`）——若面态共享，页侧同组未提交编辑态将被开面复位清掉 | 明确（或登记）双面同组交叠的面态归属 ∥ 复位范围 |

计数：🔴 1 · 🟡 2 · 🔵 7（共 10 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2 · 验前表（十项逐条核读——修复轮九项 + #9 父侧机械笔；全档现盘实读）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/desktop/design/IPC.md` | 🔴 | Fixed | `:52` = 「动作闭集**六** `newSession` ∕ `openProject` ∕ `find` ∕ `theme` ∕ `help` ∕ **`openSettings`**（设置菜单升级批 · #817 增——五 ⇒ 六）」；`:88` = 「闭集**六动作**（设置菜单升级批 · #817 增——五 ⇒ 六）」——与 §1 行（`:39`）∥ §2 菜单面段（`:97`）同值；`MENU.md` §3.3 设计档行补列 `:52` ∥ `:88`；变更行 `IPC.md:496` 在册 |
| 2 | 2 | `docs/desktop/design/MENU.md` | 🟡 | Fixed | `:13`（KD-65 ①）∥ `:24`（§2.1 项 1）= 「设置[设置… ⇒ 现有设置页 ∥ 七组项 ⇒ 组弹窗 ∥ 两子组（维护▸ ∥ 关于与快捷键▸）——**设置菜单升级批 · #817 重组**（原「维护」改名；单源 = 本档 §1 **KD-67**）]」——旧「维护[现状两项]」树形两处同拍收正 |
| 3 | 3 | `docs/desktop/design/SETTINGS.md` | 🟡 | Fixed | `:214`（store.mjs 行）= 「**330 ⇒ ≈331**（settings 切片 +`modal: null`；**越 300 在册**——本批触属性 = 既有切片 +1 键（**非结构性**——无新切片 ∕ 切片族结构零变；对照 #761 ∥ #764「有新增面」入册判据）⇒ 消解窗口顺延）」 |
| 4 | 4 | `docs/desktop/design/MENU.md` ∥ `SETTINGS.md` | 🔵 | Fixed | `MENU.md:108` DI ④ = 「**需求侧已收正**（主 agent 笔面——已落）…引需求卷 `docs/desktop/requirements/MENU.md:12` D36 行内收正句 ∥ `:19` 变更行」；`SETTINGS.md:277` DI（设置半）⑤ 同转；需求卷 `:12` 内嵌「〔2026-10-02 D38 收正：⇒ 六〕」∥ `:19`「D36 动作集收正（五 ⇒ 六）」核对一致 |
| 5 | 5 | `docs/desktop/design/MENU.md` | 🔵 | Fixed | `:101` = 「机检腿 = 本档 §3.3 ∥ §4（波 1 三腿）+ `docs/desktop/design/SETTINGS.md` §3.2 ∥ §4（波 2 三腿）」——悬指 `PROJECT.md` §4.2 改实指 |
| 6 | 6 | `docs/desktop/design/SETTINGS.md` | 🔵 | Fixed | KD-68 ④（`:29`）= 「`SCOPES` 闭集验证（**既有**——定义位 = `thincoder-desktop/renderer/mount-settings.mjs:39`，自视图 `SECTIONS`（`thincoder-desktop/renderer/views/settings.mjs:33`）派生——同源单份零双抄）」+「**闭集关系（源 ∕ 镜像）**——`SECTIONS`（视图单源）→ `SCOPES`（装配面派生）∥ `SETTINGS_GROUPS`（菜单侧镜像闭集同导出——`thincoder-desktop/src/main/app-menu.mjs`；主 ∕ 渲染分层无直 import，先例 = `THEME_VALUES`）——三面同值（七组名闭集）；漂移检测 = 批内件跨面源扫（波 1 腿①——`SETTINGS_GROUPS` ≡ `SECTIONS` 名序）」；§2.10 项 3 ∥ `MENU.md:89` 腿① 同拍 |
| 7 | 7 | `docs/desktop/design/SETTINGS.md` | 🔵 | Fixed | §4 波 2 腿 ⑤（`:241`）补 = 「**占槽拒**——向导占槽期开 ⇒ 拒 + 记错 + 零动作」 |
| 8 | 8 | `docs/desktop/design/MENU.md` | 🔵 | Fixed | `:108` DI ⑤ = 「**D39「多子菜单」读法登记**——设计读法 = 「七组项平铺 + 维护 ∥ 关于与快捷键两枚真子菜单」（细目设计定之内——沿 ② 先例）；若父侧原意「每组一条子菜单」⇒ …请裁」——四披露 ⇒ 五披露同拍 |
| 9 | 9 | requirements 九卷档头 | 🔵 | Fixed（父侧笔） | 九卷档头「D1–D37 全表查卷口」⇒「**D1–D39**」（`requirements/{ACTIVITY,CHAT,COMPOSER,MENU,PACKAGING,SESSIONS,SETTINGS,SHELL,UI}.md:4` 全量核对）；`requirements/PROJECT.md:144` = 「**D1–D39 已按域分卷**」；「D1–D37 全表查卷口」零残留 |
| 10 | 10 | `docs/desktop/design/SETTINGS.md` | 🔵 | Fixed | KD-68 ⑦（`:29`）= 「**面态归属 = 单树共享**（`settings.providers` 族 `edit/probe/draft/keyDraft` ∥ `settings.mcp.form`——页 ∥ 弹窗同源一份，零第二份）⇒ 开 ∥ 关的**本组面态复位 = 两面同效**（页侧同组未提交编辑态同清——**明示接受**；接受由 = 单树复用零第二份 ∥ 复位限本组、不动他组）」 |

新发现（修复引入）：**无**。

**计数**：核读 10 ∥ 未修 **0** ∥ 新 🔴 0 · 新 🟡 0 · 新 🔵 0（全 Fixed ⇒ 无阻断）。
**VERDICT: pass**

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**：**代签成立（2026-10-02 16:1x · 自动跑授权内）**——三条件核：① **设计评审 pass** ✓（评审 #2：轮 1 = changes-required〔🔴1/🟡2/🔵7〕→ 修复轮 #4（九项全采纳）+ #9 父侧笔 + 父侧锚回线机械笔七处 → **轮 2 = pass**〔仅核前表——十项全 Fixed 核讫；§3 两轮在册〕）；② **修复落地并逐条核验** ✓（父侧核读：🔴 IPC 两处六动作 ∥ 🟡 树形收正/触属性判定 ∥ 🔵×7 明写或登记；门：锚 121 = 基线 **Δ0** ∥ 行宽集不变）；③ **token 已签发** ✓（**凭据值不落档**——沿纪律）。**授权源** = 用户 2026-10-02 15:34「好，你先自动跑完我看结果吧」（射程 = 代点火 ∥ 修正派发 ∥ §4 代签 ∥ 实施派发 ∥ 收口；自缚在案）。**实施派发** = eng-coder 单舱两波同轮（13 档：波 1 菜单侧五档 + 波 2 弹窗七档 + 批内件一档）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（两波同轮（波1 菜单侧五档 ∥ 波2 弹窗主体七档 + 批内件；批内件 5/8 ⇒ 8/8 绿；审计 ∥ advisor 双 pass））



**实施轮（2026-10-02 · eng-coder · 两波同轮）**——按批档 §2 落地（波 1 菜单侧五档 ∥ 波 2 弹窗主体七档 + 批内件一档 = 13 档）；设计档 / 需求档 / 批档 §1–§4 零触；零新增面（事件 24 ∥ 白名单 47 ∥ `preload.cjs` ∥ `ipc-registry.mjs` 零触——批内件腿③源扫为证）。

**波 1 · 菜单侧（五档）**
- `thincoder-desktop/src/main/menu-words.mjs` **86 ⇒ 115**：+三键（`settings`「设置」/「Settings」∥ `settingsOpen`「设置…」/「Settings…」∥ `aboutShortcuts`「关于与快捷键」/「About & Shortcuts」；键集 **29 ⇒ 32**）+ `settingsSectionLabels(locale)` 读器（HOST_DICT `settings.section.*` 投影 ∥ en 回落 ∥ 缺键 ⇒ 键名终态）；`maintenance` 键值保持（子组标签）。
- `thincoder-desktop/src/main/app-menu.mjs` **111 ⇒ 143**：设置组重组（设置… ∥ sep ∥ 七组项（`sections` 注入 + 「…」后缀 + `emit("openSettings", undefined, 组名)`）∥ sep ∥ 维护▸（gc ∥ index——行为零改）∥ 关于与快捷键▸（help ∥ about——第二入口））；`SETTINGS_GROUPS` 镜像闭集同导出。
- `thincoder-desktop/src/main/window.mjs` **283 ⇒ 288**：`buildMenu` 读 `settingsSectionLabels` + 注入 `sections`；注面随正（「六动作」∥「`value` 携主二」）。
- `thincoder-desktop/renderer/menu-actions.mjs` **37 ⇒ 44**：+`openSettings` 分支（缺 `value` ⇒ undefined ∥ 携组名 ⇒ 组名归一透传；deps +1）。
- `thincoder-desktop/renderer/app.mjs` **319 ⇒ 321**：deps.`openSettings` 双口转接（缺组 ⇒ 现有设置页 ∥ 携组名 ⇒ 组弹窗）；注面随正。

**波 2 · 弹窗主体（七档）**
- 新档 `thincoder-desktop/renderer/settings-modal.mjs` **63 行**（单例宿主：建 ∕ 换卡 ∥ 关 + `settingsModalNode` 捕获面 + 初始焦点 = ✕（+50ms）+ 关同清子确认层）；新档 `thincoder-desktop/renderer/settings-modal.css` **41 行**（背板 z-20 ∥ 卡 z-21 ∥ 48rem ∥ 内滚 ∥ `--overlay`/`--bg-raised`/`--line`/`--shadow`；零新变量 ∥ 零断点）。
- `thincoder-desktop/renderer/views/settings.mjs` **364 ⇒ 398**：+`settingsModalTree(state, group, handlers)` 导出（单组树——复用档内私有 `noticeNode` ∥ `sectionStateNode` ∥ `sectionBody`；体节点携 `data-state` = 组段态（第二闸在途判据面）；表外组 ⇒ `null`）。
- `thincoder-desktop/renderer/mount-settings.mjs` **181 ⇒ 249**：`openSettingsModal` ∥ `closeSettingsModal` 装配（SCOPES 闭集验证 ∥ 占槽拒 ∥ 切片写 + notice 清 + 本组复位 + 本组读取；关 = 切片清 + 本组复位 + 子确认同清）+ `MODAL_READS` 七组读取链表（KD-68 ③ 逐行）+ 第二闸（卡根捕获 ∕ 重建 ∥ 复填 + 独立 `modalResidue` + 失效集一次性同滤两捕获）+ `refreshSettings` 判据 +`modal` + face 返回。
- `thincoder-desktop/renderer/mount-settings-exits.mjs` **248 ⇒ 264**：+`resetFacets(state, group)` 本组复位原语（modal 开 ∥ 关**限本组**；开 ∥ 关面整复位同源取用）+ 返回面 +`resetFacets`；`closeSettings` 同拍清 `modal`；F-Esc 闸 +`modal != null` 守卫（不连带关页）；§2.8 界外发现① 陈旧残句「信息行两入口」收正。
- `thincoder-desktop/renderer/store.mjs` **330 ⇒ 331**：settings 切片 +`modal: null`。
- `thincoder-desktop/renderer/index.html` **56 ⇒ 57**：+`settings-modal.css` 链行（settings.css 后）。

**批内件（六腿）**：`docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（**531 行 · 8 用例**——波 1 腿①②③ + 波 2 腿④/④b/④c/⑤/⑥；判据集 = 设计 §4）。
**先红后绿读数**：首跑 **5 pass / 3 fail**（红因逐条：① providers 特征锚 `data-provider` 与 models 行同名属性互斥不严；② 复位断言未计读取链同步段先落 `loading`；③ `@media` 判据被注释内字面误命中）⇒ 三处修后 **8/8 绿**（`node --test docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` ⇒ tests 8 ∥ pass 8 ∥ fail 0）；`npm test`（thincoder-desktop——空清单）绿；全部改动档 `node --check` 绿。

**行数对账（实读 vs 预算 §2.3）**：menu-words 115（≈110，+5）∥ app-menu 143（≈150，−7）∥ window 288（≈287，+1）∥ menu-actions 44（≈45，−1）∥ app 321（≈321，0）∥ settings-modal.mjs 63（≈95，−32）∥ settings-modal.css 41（≈40，+1）∥ views/settings 398（≈378，+20）∥ mount-settings 249（≈218，+31）∥ mount-settings-exits 264（≈252，+12）∥ store 331（≈331，0）∥ index.html 57（≈57，0）∥ 批内件 531（≈300，+231——六腿细分为 8 用例 + 装配面直测夹具）。产品 12 档净差 **+30**；差异成因逐档可追（单组树 + 第二闸 + 开合装配 + 本组复位原语较预算估乐观；`settings-modal.mjs` 低于预算与树面落位 `views/settings.mjs` 互为解释）。

**决策透明表（实施内裁量 —— 逐条给由）**
1. `settingsModalTree` 定义落 `views/settings.mjs`（复用其私有三件），`settings-modal.mjs` 同名 re-export —— 设计 §3.2 行 3（视图 +导出 ∥ 复用私件）与行 1（宿主「树纯函数」）由 re-export 两面同时满足，零第二实现。
2. 弹窗体 `.settings-modal-body` 携 inert 属性 `data-state` = 组段态 —— 第二闸「沿 #604 同形」的在途判据面（与页侧 `[data-state="loading"]` 同形）；设计未显写该属性（实现面细节，零视觉面）。
3. `openSettings` 二形转接拆于 `app.mjs` 注入面（menu-actions 只做 `value` 归一透传）—— 对位「deps +1」预算与 §2.3 行 5「设置面临时双口转接」。
4. `resetFacets` 落 `mount-settings-exits.mjs` 并随工厂返回 ——「本组复位复用」（装配面 modal 开 ∥ 关与页开 ∥ 关同源取用；零第二份）。
5. §2.8 界外发现① 陈旧残句随本批收正（设计建议「随实施批顺手收正注释」支）。
6. `window.mjs` ∥ `app.mjs` 注面「六动作 ∥ `value` 携主二」随正（交付面自洽）。

**审计与代码评审轮次与终态（终态 = clean）**
- **内部探索偏离审计**（read-only，对照设计逐档）：轮 1 = 有偏离清单——唯一交付面内发现 = `app.mjs` 陈注（已即修）；机制面零半落 ∥ 零静默简化 ∥ 零清单外文件；面外残留 2 处列报（`preload.cjs` ∥ `events-subscribe.mjs`「五动作闭集」陈注——前者设计定零触 ∥ 后者不在本单）⇒ 终态 = clean（口径：全部交付面内发现已修）。
- **内部 advisor 代码评审**：轮 1 = **pass**（2×🟡 非阻断：`window.mjs` 陈注（已收正）∥ 越 300 在册触属性判定面（父侧复核）；2×🔵：行数面「预期」值与实读漂移（已登记「实施落盘批补」）∥ 批内件钉 `settings.css` 304 行常量（有意零触判据））；轮 2（仅核 #1 修复）= **pass**，新问题 0。

**残余/界外面（父侧处置）**
1. `preload.cjs` ∥ `events-subscribe.mjs` 陈注「五动作闭集」（本批零触面/清单外，未动——列报）。
2. 旧批内件 `docs/batches/2026-10-02-desktop-menu-system.test.mjs`（#811）4/8 腿变红——其断言集（29 键 ∥ 维护组树形 ∥ 五动作）为旧快照，本批设计已改其全部所指（29⇒32 ∥ 设置组 ∥ 六动作）；本批未触该档（属该批记录面）——父侧裁处置。
3. 设计档 `PROJECT.md` §4.1 新档行二 + §4.2 本批块登记 = 设计已登记残余（「随实施落盘批补」）——设计档笔面，本批零触。
4. `views/settings.mjs` 398 越 300 在册（拆分预案 = 段体续拆）——本批触属性按设计记「导出面 +1（非结构性）」；advisor 建议父侧复核该判定（非阻断）。

## §6 验证与收口（父代理）

**§6 验证与收口（父侧 · 2026-10-02 16:5x）**

**① 实施核读（父侧实跑）**：批内件六腿复跑 `node --test docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` = **tests 8 ∥ pass 8 ∥ fail 0**（16:4x）；desktop 套件 = **空清单制度**（`npm test` ⇒「test manifest is empty — zero tests = green（2026-09-28 full reset）」——本批检验面 = 批内件；core ∥ cli ∥ vsc 本批零触，不复跑）；落盘抽读 = `settings-modal.mjs`（63 行——单例弹层 + 建 ∕ 刷 ∕ 关三件 + 树面 re-export）✓。

**② 范围外注记裁定（4 条）**：〔1〕#811 旧批内件复跑红 4/8 = **预期**（其断言 = #811 快照（29 键 ∥ 维护组树形 ∥ 五动作）——#817 设计已改其全部所指）⇒ 处置 = 该档头注一行（父侧机械笔 · 可 revert）+ 本 §6 互指（#811 记录零触、不追改；各档中 #811 期 as-of 记述（「五动作 ∥ 8/8 绿」类）= 历史面，以此为准）；〔2〕陈注「五动作闭集」残留 = **父侧机械笔收正已落**（`preload.cjs:48` ∥ `events-subscribe.mjs:13/:37` ⇒ 六动作；`MENU.md:39` 说明列同拍）；〔3〕设计档残余（`PROJECT.md` §4.1 新档行二 + §4.2 本批块）= **落盘批补已落** ✓（+ `SETTINGS.md` §3.1 新档行二 ∥ 十处行数值回填 ∥ §4.1 越层段三处同拍：`views/settings.mjs` 398 ∥ `store.mjs` 331 ∥ `app.mjs` 321）；〔4〕`views/settings.mjs` 触属性复核（advisor 建议）= **父侧裁 = 非结构性维持**（`settingsModalTree` = 组合既有私有面、零既有结构变更 ⇒ 拆档评估不触发；预案「段体续拆」不变；数值 398 已入册）。

**③ 门（终读数 · 回填后）**：`doc-check` = 锚 **121（= 基线 Δ0）** ∥ 行宽 **105**（本批三档 12 行违例集不变）∥ 行数面 **差异 0**（回填工单十项清讫）。**父侧机械笔全程打标（可 revert）**：锚回线七处 ∥ 十处回填 ∥ 新档行四（`PROJECT.md` §4.1 二 + `SETTINGS.md` §3.1 二）∥ §4.2 本批块一 ∥ 越层段三 ∥ 陈注三 ∥ 旧件注一 ∥ `LIGHT-CHANNEL.md:34` 折行一 ∥ 需求九卷档头九（早前）。

**④ 候真机走查（T-DSK59——菜单 ∥ 弹窗两波合一；全文 = `docs/desktop/design/SETTINGS.md` §5）** ⇒ 走过即收口（批档冻结 + 台账 #817 核销）。

### 6.1 走查收束 + 收口结算（2026-10-02 17:0x · 父侧）

**走查收束**：用户 16:59「走查先收口吧」= T-DSK59 走查收束令。**全程发现三项分流**：① 渠道段校验反馈出视口 ⇒ **轻通道轮六 笔一**（就地化——已落）；② 弹窗头行不粘顶（✕ 滚出视口）⇒ **轮六 笔二**（sticky——已落）；③ 菜单「模型与档位」项不必要 ⇒ **#820 承接**（批 `docs/batches/2026-10-02-settings-menu-trim.md`）。未再报其余 ⇒ **通过**。

**结算**：批内件 8/8 ∥ 门（锚 121 = 基线 Δ0 ∥ 行宽 105 ∥ 行数面差异 0）∥ §6 各段在册 ∥ 走查收束 ⇒ **收口（2026-10-02）**——记录冻结；台账 **#817 核销**；**凭证链终态消费 ✓**（designId 值不落档——沿纪律）。
