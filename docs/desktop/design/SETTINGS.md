# 桌面端（DESKTOP）· 设置域（SETTINGS）

> 板块 = **桌面端设置域**——设置面板（七段） / 首启向导 / 渠道族形态 / 模型 / agent 参数 / MCP ∥ env ∥ 工具与服务 ∥ 模型清单段 / 样式收正（D37）——本域设计单源档。
> 需求侧 = 需求分卷（本域卷 = `docs/desktop/requirements/SETTINGS.md`；查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；功能点 ∥ 验收面 ∥ 依赖面——**范围数随需求卷现文**；本域回指 = 总览 §3.3 首启链 ∥ **D16** ∥ **D37** ∥ **D39** ∥ **D24**（住 `docs/desktop/requirements/UI.md`））。
> 同部分相关档：总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md` · 宿主适配层 = `docs/desktop/design/SHELL.md` · 主 ↔ 渲染通道契约 = `docs/desktop/design/IPC.md` · 界面形态与交互 = `docs/desktop/design/UI.md` · 渲染面实现工艺 = `docs/desktop/design/RENDERER.md`。
> 域档：会话域 = `docs/desktop/design/SESSIONS.md` · 输入区域 = `docs/desktop/design/COMPOSER.md` · 活动池与消化面域 = `docs/desktop/design/ACTIVITY.md` · 对话流域 = `docs/desktop/design/CHAT.md`。
> 域档续：菜单体系 = `docs/desktop/design/MENU.md` · 打包与发行 = `docs/desktop/design/PACKAGING.md` · 端到端测试基建 = `docs/desktop/design/E2E-TESTING.md` · web 快筛 = `docs/desktop/design/WEB-QUICKCHECK.md`。
> 核机制面（配置 / 供应商与模型 / MCP / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> **迁移状态（波 2b）**：本档 = 文档体系重组批（DOC-MIGRATION）· 波 2b 迁入——来源 = `docs/desktop/design/PROJECT.md` §2（**KD-10** ∥ **KD-11** ∥ **KD-12** ∥ **KD-13** ∥ **KD-44** ∥ **KD-45** ∥ **KD-46** ∥ **KD-49** ∥ **KD-66**）∥ `docs/desktop/design/UI.md` §1（设置面 ∥ 启动态 ∥ 首启向导行 + 各本域批注块）迁入；
> 迁入 = 逐字（长行按语义边界折行；迁入文本内「本档 §x」回指按新落点改指）；原址各留一行指针。
> **文件账（§4.1 settings-* 族行）**已随「2c 前置步 · 文件账分片轮」迁入——见 §3。
> 域内余量：零（§4.2 批块 ∥ §6.1 ∥ §7 ∥ §10 涉行 已随 2c 前置步（含切片 4 终篇）迁入——见 §3/§4/§5/§6；记录在册 = 批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2）。
> 建档：2026-10-02（域拆分 · 波 2b）；本档坐标 = as-of 2026-10-02 届盘实核（仓根 = `thincoder/`）。
> **行数纪律（500 建议 ∕ 800 硬限）只对代码档**（`.mjs` ∕ `.cjs` ∥ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。

## 1. 关键决策记录（迁自 `PROJECT.md` §2——本域行）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-10 | 设置面写路径 = **核唯一执行体**（`writeConfigAtomic`——`stat → read → mutate → 原子写`四步住核）；端侧零自写盘、零 provider 形状构造 | 原子性 / mtime 冲突 / `.bak` 留现场与 CLI 同源一处；值面（preset 展开 · key 落位 · 激活渠道保护）全在核变更子，端侧只给 `mutate` | **端侧自写盘**（read-modify-write 第二份实现 = 漂移 + 竞态）· **端侧 provider 形状表**（第二份协议形 = 双源）· **`saveConfig`**（核无此导出——全仓 grep 零命中） |
| KD-11 | **探活口径有意分歧**：`provider:verify` 探不通**仍可保存**（只出读数，`reason` 闭集 `timeout` / `malformed` / `unavailable`）∥ `mcp:save` 探活失败 ⇒ **零写盘** | 渠道 key 的可用性不只在探测当下（离线 / 代理不得阻断首启）；MCP 服务器配错必连不上（先例 = `thincoder-cli/src/tui/cmd-mcp.mjs`）——卡面须明示「未校验通过」 | **统一为「探不通零保存」**（渠道面会阻断离线首启）· **统一为「只出读数」**（会把连不上的服务器写进配置） |
| KD-12 | 首启向导：闸 = **配置档存在性**（读数 = `config:read` 回执 `configured`——`thincoder-core/config-io.mjs:39`；口径差有意：CLI `isConfigured` = key 可解析、更严，**勿统一**）；三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）；表单出口**复用设置面导出面**（单一 owner）；配置坏 ⇒ 不静默重置（设置面可进 + 明示不可读） | 需求 §3.3 逐字（已配 ⇒ 跳过）；零副本 ⇒ 向导与设置面同源同形（沿批 7 操作区描述符先例） | **自拟判据「有渠道 + key 才算已配」**（与需求字面冲突）· **向导自带第二份渠道表单**（双源）· **坏配置静默重置**（抹用户数据） （机检豁免——端侧语汇） |
| KD-13 | `locale` = **端无关偏好键**（任一端写、他端读；非属主型状态）⇒ 本端 `config:write` 为**首写者**；切换即时生效（`config:write` 成功**同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷词表——**免二跳重调**，**零新事件通道**） | 核无 locale 持久化写点（实读 `thincoder-core/i18n.mjs` 全档）；§6.2 A2「不增跨端共享可变字段」针对属主型状态——本键无写竞争 | **按属主字段禁写**（语言偏好本就跨端共享）· **新增 `ev:settings` 推送**（无首个必需消费面） |
| KD-44 | **模型菜单一级扇出面 = 主进程（A 案）**：全渠扇出住主进程（`thincoder-desktop/src/main/settings.mjs` `modelCatalog()`）——结构对位 VSC（探针窗口族住宿主面、webview 零探针；`thincoder-vscode/src/extension/provider-probe-window.mjs` 全族 + `thincoder-vscode/src/extension/settings.mjs:341` `fullStatus`） | 单次往返；探针 ∕ 代理 ∕ 落账单源（核 `probeChannelModels` + `probeTargetOf`）；密钥面沿用现状（零入渲染面） | **渲染面扇出（B 案）**——结构反 VSC（渲染面自持调度 ∕ 在飞 ∕ 重探）· N 次往返 · 失败 ∕ 代理口径缺口续存 |
| KD-45 | **新通道 `model:catalog`**（不扩 `model:list` 语义）：契约纯增 ∥ 操作单一（无载荷全渠扇出）∥ 回执单形 `{ ok, models, unavailable }` | B8 `model:list` 行 #19 零动（既有行不重写）；两既有消费者（`mount-settings-reads.mjs` ∕ `mount-settings-segments-models.mjs`——恒传 `provider`）零影响；失败诊断天然承载 `unavailable` | **扩 `model:list` 语义**——双形（`{models}` ∥ `{models, unavailable}`）⇒ 消费面守卫面增 · 两探针语义相斥（单渠裸径 ∥ 全渠核探针径）· B8 已评审行重写 |
| KD-46 | **探针单源 = 核 `probeChannelModels` + `probeTargetOf`**（含代理 + 落账）；`model:list` 同径对齐（同批附带件——U1 受理）——回执行逐字零变 | 逐渠探针单源 ∕ 代理 ∕ 落账三面一致（对位 VSC `_probeChannelInto` 同径）；`hostBusy` 档 = **消（补做——欠做，非能力缺失）**：宿主忙采样器 = 新档 `loop-sampler.mjs` + `failure` 键贯链（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` §2.8①；同拍 = `docs/desktop/design/PROJECT.md` §10 **CG**） | **复用裸 `listModels` 径**（两探针语义并存 · 代理缺陷续存 · 不落账） |
| KD-49 | **`settings:agent` 通用保存 = patch 显式清除面 + slot 权威键拒写**（parity-b10 W3 · S10 ∕ S11 ∕ S14）：① patch 值 = `null` ⇒ **删键**（沿核 `_checkKnownKeyValue`「null = 显式清除」语义——S10 槽清空 ∕ S11 中性档两径即用）；② `agent.advisor.guard` ∕ `agent.engineering` = **会话槽权威键**（唯一写面 = `session:flags` 槽写——跨端同槽）⇒ 通用保存**拒写**（拒码 `slot-authority` + 零写；拒位先于值校验 ∕ 混合 patch 整拒）；guard 设置面开关写经 `session:flags`（回执后 `ev:flags` 随动） | 拒写依据 = VSC 侧同裁（`agent.engineering` 白名单删项 ∕ `agent.advisor.guard` 非 payload 字段——`thincoder-vscode/src/extension/settings-panel-write.mjs`）+ #475「通用保存不可达该键」先例；`null = 删除` = 核侧既有语义 ⇒ 「patch 表达不了删键」旧口径消解（单源 = `docs/desktop/design/IPC.md` §2 设置族注项 10） | 被否：**guard 键走通用 patch**（与会话级语义分家——跨端槽面失守）· **`agent.engineering` 写面放行**（槽权威面失守）——泛化行读面形：随 **#635① 全消**（2026-10-04）整体退役（登记 = 本档 §6 **CH**） |
| KD-66 | **设置面样式收正（D37）= 全七段按 VSC 形态收正——渠道两行卡为锚**（设置面样式收正批 · 2026-10-02 · 台账 #812；需求卷 **D37**）：① **范围与口径**——收正 = 形态 ∥ 密度 ∥ 断行 ∥ 层次（值源 = VSC 实读）；功能面不删 ∥ 七段信息架构保持（段集 ∥ 段序零改）∥ 布局面零动（48rem 居中列——2026-10-02 实证）；② **渠道行 = 两行卡列**（锚）——主行 = 名 + 钥面 + 当前标 + 动作簇（修改 ∥ ✕ ∥ 校验 ∥ 移除名——四件全保留、序恒定 = 现盘序保持；VSC 对位 = 前两件同序，`thincoder-vscode/webview/settings-providers.js:183-186`；**#635⑤ 保留裁定（2026-10-04）**：行级「校验」钮保留——差异在位置不在能力（VSC 对位方向 = 行内校验，如需）；位置类端差，登记）；副行 = `模型 · URL` + 代理开关；条件第三行 = 不可用原因；断行恒定 = nowrap + 中段单点省略；编辑态 = 行内换形（输入 + 存/消）；**校验反馈就地化（轮六 · 2026-10-02 · 轻通道 · 台账 #819）**——`verify` 结果携行名：匹配行 ⇒ 本行呈现（校验钮态短形「校验通过」∕「校验失败」+ 本行明细行）；无行渲出结果（名不在列表 ∥ kind 表外）⇒ 段末回退（单源 = 本档 §2.12）；③ **行族通则**——`.settings-row` nowrap + `.settings-row-value` 省略四件 + 动作簇 `~` 零化（修多钮各自 auto 散开）；**补则（代码评审落形 · 2026-10-02）**——**MCP 展开面 = 全显豁免**：`.settings-mcp-detail` 域内值面（工具行描述 ∥ params ∥ 回执词行）恢复自然折行（`white-space: normal` + `overflow-wrap: anywhere`）——豁免独立成则，行族通则本体零动（折叠面摘要行 ∥ 工具行名零动）；④ **复选 = 拨杆形**（VSC `.switch` 照搬；文本输入细边 = D24 保留面零动）；⑤ **卡界 = VSC 实形**——1px 描边（`--line`）+ 圆角 6px（实读 `thincoder-vscode/webview/settings.css:155-159`；卡底零独立填充；用户 2026-10-02 10:27 裁「尽量跟 VSC 一致」——D24 描边归零基线全局零动 ∥ 仅本卡界让位）；⑥ **零新变量 ∥ 零新断点**（D24 ∥ D29 基线）；⑦ **拆档**——渠道族出档 `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（D37 拆档产出 · 已落——先拆后改 · 越层消解窗口兑现；re-export 面零改）；⑧ **边界** = 交互语义 ∥ 功能增删 ∥ IA ∥ 布局面 ∥ 核 ∥ VSC 零触。值面 ∥ 判据 ∥ 端差明细单源 = `docs/desktop/design/UI.md` §1「本批注（设置面样式收正 · D37 · 2026-10-02）」（本档 §2.5）；明细 = 批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §2。 | 需求 D37（用户 10:05「我希望至少跟 vsc 端样式上对齐」+ 10:03 锚样本实拍）；VSC 实读 = `thincoder-vscode/webview/settings-providers.js:178-193`（两行卡）∥ `thincoder-vscode/webview/settings.css:155-203`（卡值）∥ `thincoder-vscode/webview/settings.css:222-257`（拨杆）；桌面现状实读 = `thincoder-desktop/renderer/settings.css:145-154`（单行 wrap）∥ `thincoder-desktop/renderer/views/settings-sections.mjs:129-153`（单行内联 5–7 件）；D24 ∥ D29 ∥ 扁平化基线在册 | **被否**：保留单行内联只压间距（锚点明指两行卡——折行参差为被诉本体）· 全段照搬标上行表单（48rem 列宽域——端差判）· 全像素复刻（宿主主题变量不存在——取值即自铸） |
| KD-68 | **设置弹窗化（D39 ∥ A 案）= 每菜单组项 ⇒ 应用内模态弹窗（单组 · 复用链指名 ∥ 现有页零动并存）**（设置菜单升级批 · 2026-10-02 · 台账 #817；需求卷 **D39**）：① **面形（沿 `settings-confirm` 先例）**——背板（`document.body` 直挂 ∥ `fixed inset 0` ∥ z-**20** ∥ `--overlay`）+ 居中卡（`fixed` 居中 ∥ z-**21** ∥ `width: min(48rem, calc(100vw - 2*var(--gap)))` ∥ `max-height: calc(100vh - 2*var(--gap))` ∥ 内 `overflow: auto` ∥ `--bg-raised` + 1px `--line` 描边 + `--shadow`；**头行粘顶（轮六 · 2026-10-02 · 轻通道 · 台账 #819）**——卡内滚 ⇒ `header.settings-head` sticky 常驻（`top: 0` + 底 `--bg-raised` + `z 1`——标题 ∥ ✕ 不随体滚出）；**页 ∥ 向导面同径（头行粘顶批 · 2026-10-07 · 轻通道 · 台账 #1030）**——整层滚 ⇒ `.settings-head, .wizard-head` 同法（`position: sticky` ∥ `top: 0` ∥ `z-index: 1` ∥ 底 `--bg`——页底同色；弹窗专指规则（`.settings-modal .settings-head`）专指度更高、不受影响）；单源 = 本档 §2.12）；**z 族** = 设置面 10 < 弹窗 20/21 < 确认弹层 40/41（确认盖弹窗——删除确认族零改）< 引导层 200；**零新变量 ∥ 零新断点**（D24 ∥ D29 基线）；**新档 `thincoder-desktop/renderer/settings-modal.css`（本批新档 · 已落）**（不进 `settings.css`——在册越线档零结构触碰；`index.html` 链序 = settings.css 后）。② **卡结构** = `header.settings-head`（标题 = 组名（`settings.section.*` 段名）+ ✕（`.settings-close` 形复用；`data-action="settings:modalClose"`；aria-label = `settings.close`））+ `div.settings-modal-body`（失败串（`notice.scope` = 本组 ∨ `panel`）+ 段态词 + 段体——段标题不复述）。③ **单组内容 = 复用链（指名）**：组 → 段体组件 → 读取链 → 出口链（= 同一 `exits.handlers` 全表注入——视图 `data-action` 同域，零第二份；**七行**：providers → `providersBody`（`views/settings-sections-providers.mjs`）→ `loadProviders()` → providerSegments+exits 表；model → `modelBody`（`-sections.mjs`）→ `loadProviders()`（含模型候选随动）→ 同前；agent → `agentBody`（`-agent.mjs`）→ `loadAgent()` → agentSegments 表；mcp → `mcpBody`（`-sections-mcp.mjs`）→ `loadMcp()` → segments 表 MCP 族；env → `envBody`（`-sections-env.mjs`）→ `loadEnv()` → segments 表 env 族；tools → `toolsBody`（`-sections-tools.mjs`）→ `loadTools()` → segments 表工具族；models → `modelsBody`（`-sections-models.mjs`）→ `loadAgent()`（models 块——R7 同拍）→ modelSegments 表）——**零第二实现 ∥ 零值面语义改**（读写 ∥ 确认 ∥ 失败链与页同源）。④ **状态 ∥ 开合**——`settings.modal`（store 切片 +1：`null ∥ 十值闭集`（七段名 + `providerAdd`（三端对齐批）∥ `mcpForm` ∥ `consultAdd`（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054——§2.18）= 校验面 `SCOPES`；菜单侧发出集 = 六名——收窄批 #820）；重绘走既有 `SETTINGS_KEYS`）；开（`openSettingsModal(group)`）= `SCOPES` 闭集验证（**既有**——定义位 = `thincoder-desktop/renderer/mount-settings.mjs:48`，自视图 `SECTIONS`（`thincoder-desktop/renderer/views/settings.mjs:35`）派生——同源单份零双抄；表外 ⇒ 记错零动作）→ 向导占槽期拒（`occupies`——沿设置族占槽口径，记错）→ 切片写 + `notice:null` + **本组面态复位**（providers → `edit/probe/draft/keyDraft`；mcp → `form`——沿 `openSettings` 同口径限本组）→ **本组读取链**；关（`closeSettingsModal()`）= 切片清 + 本组面态复位 + `closeSettingsConfirm()`（子确认同清——沿 `closeSettings` 同形）；`closeSettings()` 同拍清 `modal`；**闭集关系（源 ∕ 镜像——2026-10-02 收窄批 #820 收正）**——`SECTIONS`（视图单源，七段）→ `SCOPES`（装配面派生——设置页对齐）∥ `SETTINGS_GROUPS`（菜单侧镜像闭集同导出——`thincoder-desktop/src/main/app-menu.mjs`；主 ∕ 渲染分层无直 import，先例 = `THEME_VALUES`）——**菜单发出闭集 = 六名**（= `SECTIONS` 名序**去「模型」**（原「模型与档位」）——「模型」不入菜单，用户 16:53 走查裁）；**校验面 `SCOPES` = 十名**（七段名 + `providerAdd`（三端对齐批 · 2026-10-07——§1 **KD-75**）∥ `mcpForm` ∥ `consultAdd`（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054——§2.18）；菜单侧仍不发「模型」——支 A 原旨保持）；漂移检测 = 批内件跨面源扫（`SETTINGS_GROUPS` ≡ `SECTIONS` 名序**去「模型」**）。⑤ **重绘 ∥ 草稿保真**——弹窗体 = **第二闸**（沿 #604 同形：卡片根捕获 ∕ 重建 ∥ 复填；**独立残件变量** `modalResidue`；失效集（#652）一次性同滤两捕获、整轮末清）；`refreshSettings` 在场判据 +`settings.modal != null`（外档写盘 ⇒ 弹窗在场同复读）。⑥ **交互 ∥ 键盘**——关三路：背板点击 ∥ ✕ ∥ 卡内 Esc（**`stopPropagation`**——不连带触 F-Esc 关页；`mount-settings-exits.mjs` 键面闸增 `modal != null` 守卫）；初始焦点 = ✕（+50ms，沿确认件先例）；键盘全可达（原生控件序）；**零焦点陷阱**（边界）；`role="dialog"` + `aria-modal="true"` + `aria-label` = 组名。⑦ **双面并存**——现有设置页**零动**（「设置…」⇒ 页）；两面可同开（弹窗盖顶；关弹窗不动页）；**面态归属 = 单树共享**（`settings.providers` 族 `edit/probe/draft/keyDraft` ∥ `settings.mcp.form`——页 ∥ 弹窗同源一份，零第二份）⇒ 开 ∥ 关的**本组面态复位 = 两面同效**（页侧同组未提交编辑态同清——**明示接受**；接受由 = 单树复用零第二份 ∥ 复位限本组、不动他组）；⑧ **边界** = 七段值面语义 ∥ 现有页 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触；独立设置窗口（B 案）不做。 | 需求 D39（用户 15:13 提出 + 15:19 裁 A「先按照a做吧」）；先例实读 = `thincoder-desktop/renderer/settings-confirm.mjs`（背板 + 弹框 + 挂 `document.body` + Esc 拦截 + 默认焦点）；页零动判据 = D39「现有设置页保留（升级件并存——验收 OK 后再议撤）」；z 实读 = `thincoder-desktop/renderer/settings.css:16`（10）∥ `renderer/chrome.css:170-175`（backdrop 40）∥ `:176-181`（confirm 41） | 被否：**独立设置窗口（B 案）**（用户明令不做）· **slot 内渲染**（`[data-slot="settings"]` 的 `:empty`/`[data-state="closed"]` 退场规则 + 48rem 列形态打架——`thincoder-desktop/renderer/settings.css:33-34`）· **复用 `.auto-backdrop`/`.auto-confirm` 族**（22rem 宽 ∥ 确认语义 ∥ z 40/41 与确认叠序冲突——需动确认族）· **设置页改造成弹窗**（现有页零动 = 需求）· **每开记全量五读**（页口径——弹窗限本组，省空转） |

| KD-75 | **provider 添加 = 专用弹窗（骑 D39 弹窗宿主）+ 单表对齐 VSC 源（字段序 ∥ 走 proxy 开关 ∥ 探面同判定）**（三端对齐批 · 2026-10-07 · 台账 #1027–#1029）：① **入口 ∥ 载体**——渠道段体尾「+ 添加」钮（新词键 `settings.addProvider`）⇒ `openSettingsModal("providerAdd")`（弹窗值集 **七 ⇒ 八**；`MODAL_READS` +1 行 = `loadProviders`；卡体 = 单表（`channelFormTree` 内容演进——名不换）——第二闸草稿保真 ∥ 背板 ∥ Esc ∥ z 族 20/21 全复用 ∥ 零新 CSS）；② **单表形态** = 类型 `select name="preset"`（预设项 + `custom`）+ 预设信息行 + 条件块 A（名称 ∥ baseURL ∥ 格式）+ key + 「走 proxy」复选（拨杆形 ∥ 同词键 `settings.proxyRow`）+ 条件块 B（拉取行 ∥ 模型）+ 保存 ∥ 取消——**原双表（`addPreset`/`addCustom` 常显内联）退场**；`active` 复选从设置面表单退场（激活面 = 模型段「采用」∥ B① 首跑补全承载）；向导步 1 `activeDefault` 复选随 2026-10-09 清除批退场（`active` 参退场 ⇒ 死控——无 active 写路；等价路径 = 模型段「采用」）；③ **字段序 = 用户填写序**（名称→baseURL→格式→API key→走 proxy→拉取→模型——VSC 源逐元素对齐；逐元素表 = 批档 §2）；④ **写面**——`provider:save` 载荷 + `proxy`（勾选 ⇒ `true`）；核 `addProviderEntry` 迁受 `proxy`（条目同批落 `proxy:true`；缺 ∥ 非真 ⇒ 零键）；行开关（`provider:setProxy`——`true` 写 ∕ `false` 删键）零改——同一字段；⑤ **探面同判定（缺陷修复并本批）**——`provider:models` = 探面同判定（核 `probeTargetOf` 同判定；`thincoder-desktop/src/main/providers.mjs:276-288`——目标 `:281`；勾选 ⇒ 逐渠判定（`proxy: true` ∧ `uri`——2026-10-08 去全局闸）；未勾 ∥ 缺省 ⇒ 直连）；载荷 + `proxy`（可选）；口径落点 = `docs/core/design/PROVIDER.md` §6.19（单源 = `docs/core/design/PROXY.md` §4）∥ 核 `thincoder-core/provider-flows.mjs:79-90`；⑥ **边界** = 行族 ∥ 行开关 ∥ 探针落账 ∥ 七段值面 ∥ 核运行期代理语义 ∥ VSC ∥ CLI 零触（CLI 共三条 = 批档 §2 同径表） | 用户 2026-10-07 18:10「桌面端的配置界面为啥要别出心裁搞个不一样的」（逐字 = 批档 §1.1）+ 18:07 三端令；VSC 源实读 = `thincoder-vscode/webview/settings-providers.js:200-224`；D39 宿主 = 本档 §1 **KD-68**（面形 ∥ 交互 ∥ 第二闸全复用） | **被否**：双表并一但保留 `active`（VSC 无此元素——「全表对齐」实指逐元素同形）· 独立弹层（第二弹窗宿主 = 新基建；D39 单弹窗面既定）· 桌面前取全局 web 旗（#1026 已判相抵）· 类型选择用两枚按钮（VSC = select）· 模型控件降级为 select（拉取失败手输兜底 = B10 W2 既定能力） |
| KD-76 | **MCP 表单 env ∥ headers = 行式键值编辑器（两端同形 · 本批定形）**（MCP 键值行式输入批 · 2026-10-07 · 台账 #1036）：① **形**——三组各一份行集（stdio `env` ∥ http `headers` ∥ ws `headers`——与 VSC 三容器同形），行 = 键格 + 值格 + ✕，行集下「添加行」钮；**零项 ⇒ 零行**（存量回显 ∥ 新增态起手同判——起手三组皆零行，行由「添加行」钮落）；标签 ∥ 钮 ∥ 占位词两端逐字同值（新键 4 + 值改 2——计数 = 本档 §2.17 项 6）。② **提交四判据**——键 ∥ 值 trim；空键 ∥ 空值行不提交（空值 = 旧 `k=` 删项语义延续）；重复键后行胜；全空 ⇒ 字段删除；**值 = 字面**（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——旧串式的成对引号剥离退场，口径变化点明示）。③ **粘贴 = 零解析**（不引「按换行分行」——取舍 = 批档 §2 KD-4）；值格 = 单行 `input`（值内换行不可录入——边界）。④ **桌面行令牌态** = `form.kv = { env ∥ headers ∥ wsHeaders: [{ t, k, v }] }`——令牌单调递增、**永不复用**（草稿闸按 `id` 定位——`renderer/view-state.mjs:168-174`；索引键会在删行后把残值灌进新行）；行件携 `data-draft`；加删出口与类型切换出口同拍同步行集；`readMcpForm` 草稿快照**不采行件**。⑤ **拆档（先拆后改）**——MCP 族出口出档 `thincoder-desktop/renderer/mount-settings-segments-mcp.mjs`（已落 · **299** 行；缝 = 同形工厂 `create*Exits(deps)`；装配点 `mount-settings-exits.mjs` 装配即合并、单一 `handlers` 表对外零改；触发 = 本档 §3.1 在册预案「MCP 族再出一档」——本批 = MCP 族结构性触碰）；VSC 侧同拍拆档（`webview/settings-mcp.js`——硬限所迫，详 `docs/vsc/design/SETTINGS.md` §2.10）。⑥ **零新 CSS ∥ 零新变量 ∥ 零新断点**（复用 `.settings-field-row` ∥ `.settings-field` ∥ `.settings-row-action` ∥ `.settings-submit`——避触本档 `settings.css` 在册越线拆分窗口）；落盘形 ∥ 通道载荷零改（`{name, config}`；`env` ∥ `headers` 仍对象）。 | 台账 #1036（用户 2026-10-07 19:04「3开小批now」）；病征 = VSC 表单逗号串（值含逗号即坏——`webview/settings-tools.js:66 ∥ :389-404`）+ 桌面同形同病（`renderer/views/settings-sections-mcp.mjs:92-96` ↔ `renderer/mount-settings-segments.mjs:30-44`）；源对齐 doctrine = VSC 为准、桌面逐元素对齐（本仓现行）；批档 = `docs/batches/2026-10-07-mcp-kv-input.md` §2 | **被否**：保留单行 + 转义语法（自造第三套口径）· JSON textarea（S8 已判退场）· 每项小弹窗（操作面 ≫ 收益）· 粘贴换行分行（值可含换行 ⇒ 误拆）· 逗号分行（= 复刻病灶）· VSC 减量保限不拆档（贴 500 顶格零余量 = 结构债） |
| KD-77 | **添加入口统一 = 表单类添加 ⇒ 弹窗（骑 D39 宿主）；本端三面落形**（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054）：① **MCP 表单 ⇒ 新组弹窗 `mcpForm`**——段体（页 ∥ 组弹窗两面）不再常驻表单（`mcpBody` = 行族 + 「+ Add Server」入口钮（新键 `settings.mcpAdd`——值逐字同 VSC）——读链不遮入口）；表单（新增 ∥ 编辑同框复用——标题逐态 `settings.mcp.addTitle` ∥ `settings.mcp.editTitle`；编辑态 name 只读 ∥ 预填）+ **新增态补取消钮**（词 `settings.cancel`）；弹窗值集 八 ⇒ 九；`MODAL_READS` +1 = `loadMcp`；`resetFacets("mcpForm")` = `form` 清（开 = 新增态；**编辑态 = 开径后写 `form.editing`（先开后写）**）；提交成功径（add ∥ update）= 切片复位 + `closeModal()`（沿 KD-75 ⑥）；取消 = 关弹窗（切片复位随关）。② **会诊添加 ⇒ 新组弹窗 `consultAdd`**——两 select（provider ∥ model——选型面照现）+「+ Add consult model」提交（词 `settings.consultAdd` 既有）；入口钮（段尾；同词）在 consult 行数 ≥ 5 ⇒ `disabled`（对齐「行未满才可用」；提交守卫同判据——清假可供性）；成功 ⇒ `closeModal()`；**取消 = `settings.cancel` 钮（与 `mcpForm` 同形）= 关弹窗（切片复位随关）**；弹窗值集 九 ⇒ 十；`MODAL_READS` +1 = `loadAgent`；`resetFacets("consultAdd")` = `models.picker` 复位。③ **页脚「Add provider…」直开**——`composer-wire` 映射 `addProvider` ⇒ `openSettings?.(ADD_MODAL_GROUP)`（`app.mjs` 双口提升同供 `menuActions` + `attachComposer`；常量自 `thincoder-desktop/renderer/views/settings.mjs` 引——单源）。④ **模态体段态词恰一（同笔收正）**——`settingsModalTree` 去非 add 支叠渲件（修前 loading 态双「Loading…」——六组同病）。⑤ **零新 CSS ∥ 零新变量 ∥ 零新断点**（D39 全套复用）；通道 ∥ 载荷零改；边界 = 段集 ∥ 段序 ∥ 现有页 ∥ 核 ∥ VSC ∥ CLI 零触 | 用户 2026-10-07 22:01 判据句（批档 §1.1——「添加也在弹窗里」+ 全仓扫面统一）；上游先例 = KD-75（providerAdd——同宿主同链）；D39 宿主 = 本档 §1 **KD-68**（面形 ∥ 第二闸全复用）；VSC 源 = `docs/vsc/design/SETTINGS.md` §2.17 | **被否**：MCP 编辑态复用 `mcp` 组弹窗承载（形态表枚举面无编辑态——须新立且与页/弹窗双面共享打架）· 新组名 `mcpAdd`（同框服务编辑态 ⇒ 名实不符——取体面名 `mcpForm`）· 页脚经宿主中转 + 新推送（二跳；直开 = 零协议零新面）· 会诊入口常开 + 提交时才判满（假可供性）· 保留段体常驻表单（= 病征本体） |

## 2. 界面形态与交互（迁自 `UI.md` §1——本域行与批注块）

### 2.1 设置面（行）

| 面 | 形态 |
|---|---|
| 设置面 | **形态 = 窗口级覆盖层面**（挂载根 = `index.html` 单容器 `[data-slot="settings"]`）· **开** = 输入区控件行出口（`openSettings`——`#settings-btn` 核件面板控制行（`thincoder-render-core/composer/controls.mjs:51`）；接线 = `thincoder-desktop/renderer/mount-composer.mjs:90` ∕ `:160`；否决「会话头部」位）· **关** = 面板内控件 `data-action="settings:close"`（退场 = 清空容器 ⇒ 主 UI 可用）；**面头语言控件** = 面板头内、`settings:close` 左侧（en ↔ zh 切换按钮 · 锚 `data-action="settings:lang"`——沿开 / 关锚命名；**否决「状态栏」位**（语言非状态量））；点按 ⇒ `config:write`（`locale`）⇒ **同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷（**免二跳**）；标签 = 词表键（两语各一键 · 随当前语言出串）；**语言非新段**——**七段**闭集不动；**保留裁定（2026-10-04 · #635②）**：本控件保留——桌面独立 app 无宿主语言面（VSC 语言面 = 宿主 `vscode.env.language`）——宿主能力类端差（登记）；**主题切换（D33 · 2026-09-30）**：面头三态钮族（语言控件邻位——`data-action="settings:theme"`）——`docs/desktop/design/UI.md` §1「本批注（主题切换 · D33 · 2026-09-30）」；**Esc 关闭（对齐第三批 · 重核处置）**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；对位 = VSC Esc 关设置面；向导态不在本项——既有键盘面 = 审批卡根 `keydown`（`thincoder-desktop/renderer/views/approval.mjs`）与会话控制面选择器（`docs/desktop/design/SESSIONS.md` §2.1）两处）；面 = **七段**（渠道 / 模型 / agent 参数 / MCP / env（proxy ∕ shell） / tools（embedding ∕ websearch 两 key + 索引状态行） / models（consult ≤5 ∕ advisor 两 picker）——R7 落）；**该段写面 = 全局 config**（`settings:agent`——设置面默认值）；**会话级切换在输入区控件行**（`docs/desktop/design/COMPOSER.md` §2——两面不互相顶替（需求 §3.5 项 5 / 项 6）），各段**三态**（未配 / 载入中 / 已配），供给未落 ⇒ 零节点（禁止假造）；写面全经核唯一执行体 `writeConfigAtomic`（端侧零自写盘——本档 §1 KD-10）；失败面可见（零静默）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注（项 8——`FORMATS` 端侧枚举判定 · `defaultModel` 两写口）· **外壳降噪（D24）**：同规则带上（结构框归零 + 次级键四值族 + 行族卡界让位（升底让位 ∥ 1px 描边 + 圆角 6px——随 D37 收正））——`docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」项 5；**对齐第三批**：类型加工（三控型）/ agent 具名控件 + 即改即存 / Esc 关闭——本档 §2.3（P14 / P15）∥ §2.4（F-Esc）；**parity-b10-ui（设置面余面 · 2026-09-29）**：渠道行控件族（密钥设 ∕ 改 ∕ 删三路 · 渠级代理复选 · sub 行）· 删除确认门（四门）· MCP 编辑 ∕ 重连与结构化表单 · agent 段（子代理模型槽六件 ∕ advisor 档枚举 ∕ guard 开关）· index 空态（`no-key`）——形 / 锚 / 判据 = 本档 §2.2；S3 端差（行标未携 `failure` 分档）= **消（补做三件）**——同注项 7；**样式收正（D37 · 2026-10-02）**：本档 §2.5 |

### 2.2 parity-b10-ui 注（设置面余面 + 首屏引导门 · 2026-09-29）

**本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）**：本注补本档 §2.1「设置面」行与 §2.6「启动态」行的 parity-b10-ui 落面（两行已就地指针；来源 = `docs/batches/2026-09-29-parity-b10-ui.md` §2.6 修法表 S1–S14 ∕ R1 + §5 三舱实施记录）。本注只述端侧形态与锚；语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2**（设置族与项目级信息族注 ∕ 白名单面），不在此重述。

1. **渠道行控件族（S1 ∕ S4 ∕ S5）**——行内三路：设 ∕ 改钥钮与删钥钮（**静止 ∕ 编辑两态**——编辑态 = 密码输入 + 存 ∕ 消）；渠级代理**行内复选**（行 `proxy` 投影随动）；**sub 段** = `baseURL` 非空才显（空值 ⇒ 零节点——禁假造）；渠道条目不携模型（2026-10-09 清除批）。
2. **渠道校验（S2 收窄 · 2026-10-09 清除批）**——原「拉取模型」钮收为渠道校验（探针 + 状态行三态）；**模型输入件 ∥ `datalist` 退场**（渠道单值模型退场）；探针不落盘；探果重挂 ⇒ `draft` 快照回填未落盘输入。
3. **预设项标签形（S7）**——`name — desc`（值直取核 `PROVIDER_PRESETS`——端侧零表；缺段不落空分隔符）。
4. **删除确认门（S6）**——不可复得类删除前置确认弹层：四门 = 渠移除 ∕ 删钥 ∕ 密钥行删除 ∕ MCP 移除；驳回（否 ∕ 背板 ∕ 框内 Escape）⇒ **零写**；构件 = **新档** `thincoder-desktop/renderer/settings-confirm.mjs`（`.auto-confirm` 族复用——**零新 CSS**；`onConfirm` = 开框时捕获闭包）；关面 ∕ 开面同清。
5. **MCP 段（S8 ∕ S9）**——行补**编辑**钮（表单预填 = 现值；名只读）与**重连**钮（先断后连——失败面在场）；增表单 = 结构化三型字段组 + token ∕ headers（对位 VSC 同族——JSON textarea 退场）。
6. **agent 段（S10 ∕ S11 ∕ S14b）**——子代理模型槽六件 = `select` + 复合候选 + 占位（清空 ⇒ 删键）；advisor 推理档 = 选项控件（Auto + off + 逐模型枚举）；guard 开关 = `session:flags` 槽写（值 = `sessionFlags` 投影；未知 ⇒ `disabled`——禁假造）；
   **slot 权威键 `agent.engineering`** = 会话槽面键——**设置面零行**（泛化编辑器全消——#635① · 2026-10-04；写面 = `session:flags` 槽写 ∥ 输入区模式钮）；写面归属 ∕ 拒码 = 本档 §1 **KD-49**。
7. **S3 端差处置（消——2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`）**——行标面补 VSC `failure` 分档（hostBusy ⇒「宿主繁忙」+ 抑制失败句）：原「能力缺失」不成立（欠做）⇒ 补做三件 =
   ① 新档 `thincoder-desktop/src/main/loop-sampler.mjs`（port ≈45 行——源 = `thincoder-vscode/src/extension/loop-sampler.mjs:67-76`）
   ② 行面 `failure` 键贯链（`thincoder-desktop/src/main/providers.mjs:105-107` → 通道 → 渲染——渲染档点名 = `thincoder-desktop/renderer/views/settings-sections.mjs`）
   ③ 词键（落 `renderer/i18n-settings.mjs`——#614 第四档，词面阻已除）；判据 = 同宿主忙态两端行面同词 + 同抑制形。上抛行 = `docs/desktop/design/PROJECT.md` §10 **CG**（同拍定形）。
8. **首屏引导门（R1）**——`data-boot` 补渲染消费：`≠ "ok"` 期间引导层在场；`"error"` ⇒ 错误面（可读原因）；`"ok"` ⇒ 撤（**零残留**）；写者单点零改（`thincoder-desktop/renderer/dom.mjs`）。
   **CJ 裁定落（#617-CJ · 波 C 已落）**：`error` 态 = **顶部横幅非模态**（载原因不覆盖交互——`inset: 0 0 auto` ∕ `pointer-events: none` ∕ z 序（9）低于设置面（10））⇒ 设置面可进可出 ∧ 原因可见；`ok` ∕ `loading` 两态零改；裁定行 = `docs/desktop/design/PROJECT.md` §10 **CJ**；真机复读 = 父侧（D16）。
9. **index 空态（S12）**——embedding key 缺 ⇒ `no-key` 态（提示词 + 构建钮禁用——对位 VSC `settings-tools.js:337-341` 同判）；有 key ⇒ 既有 built ∕ not-built 两态零变。
10. **计数（D3）**——通道 **0** 新（六出口 = 既有设置族）；段集七段零改；**新档 3**（`settings-confirm.mjs` ∕ `mount-settings-segments-providers.mjs` ∕ `mount-settings-segments-agent.mjs`）；判据 = 批内件 + 真机（父侧闭合）。

### 2.3 对齐第三批 · 设置面两件（P14 · P15）

14. **设置面·类型加工**——现状：agent 段全 `type:"text"`（布尔 / 数值键写不进）。对齐形：控件型按 `field.kind` 三值（`string` ⇒ `text` ∥ `number` ⇒ `number` ∥ `boolean` ⇒ `checkbox`）；
    出值规范化 = 数值 ⇒ `Number(v)`（空 / 非数 ⇒ **零发送**——不写盘 · 零乐观改 · 控件回退现值）· 布尔 ⇒ `.checked`。落点 = `thincoder-desktop/renderer/views/settings-agent.mjs`（`namedFieldNode`——具名行控型）+ `thincoder-desktop/renderer/mount-settings-segments-agent.mjs`（`namedOut`——出值面）。
    端差登记 = **VSC 删键（`Number(v) || undefined` 径）∕ 桌面零发送**（父侧裁定 2026-09-28；消解路 = 主侧写链 + 核清除形扩族——另批）。
15. **设置面·agent 形态**——**对齐形 = 具名控件区**（键集 ∥ 词键 ∥ 表定控型三面单源 = `NAMED_FIELDS`——**十八键**（P15 十键 + R7 `autoThink` + B10 W3 七键）；词键标签 + 表定控型 + 锚 `data-field-name`）
    + **即改即存**（`change` ⇒ 单键 patch 直发；回执 ⇒ 就地刷新；失败 ⇒ 回退 + 可见失败面——零保存键）；**表外标量键 = 不再行面呈现**（泛化编辑器全消——#635① · 2026-10-04：兜底行 ∥ 保存键 ∥ 只读行族整体退役；桌面同 VSC = 纯具名）。
    落点 = `thincoder-desktop/renderer/views/settings-agent.mjs`（`agentBody` ∥ `NAMED_FIELDS`——经 `views/settings-sections.mjs` re-export 面）+ `thincoder-desktop/renderer/mount-settings-segments-agent.mjs`（单键 patch 写路）+ `thincoder-desktop/renderer/i18n-settings.mjs`（词面）。

### 2.4 对齐第三批 · 设置面 / 向导 Esc 关闭（F-Esc）

- **设置面 / 向导·Esc 关闭**（原「零 Esc 绑定」：出处 = 流程自划「有意」；对位面 = VSC Esc 关设置面）⇒ **入本批**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；向导态不在本项）；其余浮层族（下拉 / 菜单 / 中断模式）桌面零对位面 ⇒ 零动。
  判据：**机检** = 真 Electron 面（用例面 = 随批单元证据）——真点设置入口（输入区控件行出口）⇒ `keyboard.press("Escape")` ⇒ `[data-slot="settings"]` 清空（T-DSK43 ⑤）；**真机复核** = 人工走查。

### 2.5 设置面样式收正批注（D37 · 2026-10-02 · 台账 #812）

**本批注（设置面样式收正 · D37 · 2026-10-02 · 台账 #812）**：本批定形桌面设置面**样式面对齐 VSC 端**（锚 = 渠道段实拍对比；用户 2026-10-02 09:43 走查「设置界面的样式很凌乱」+ 10:05「我希望至少跟 vsc 端样式上对齐」；需求卷 **D37**）；批档 = `docs/batches/2026-10-02-desktop-settings-layout.md`。
决策单源 = 本档 §1 **KD-66**。本注只述端侧形态 / 落点 / 判据 / 边界——值源 = VSC 实读（两行卡 = `thincoder-vscode/webview/settings-providers.js:178-193` + `thincoder-vscode/webview/settings.css:155-203`；拨杆 = `thincoder-vscode/webview/settings.css:222-257`）。

1. **收正四则（全七段通则）**——① **断行恒定**：行族不再按内容折行（`.settings-row` `flex-wrap: wrap ⇒ nowrap`）；行内中段可变内容 = 单点省略（`min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`——泛用面 = `.settings-row-value`；不可用原因句豁免 = `[data-unavailable-reason]` 档保 `white-space: normal`）。
   **补则（代码评审 · 2026-10-02）——MCP 展开面 = 全显豁免**：`.settings-mcp-detail` 域内值面 `white-space: normal` + `overflow-wrap: anywhere`——行族通则本体 ∥ 折叠面摘要行零动。
   ② **动作紧凑右对齐**：动作钮全集 = 行尾单簇（簇首 `margin-left: auto` 既有；簇内续钮 `margin-left: 0`——`~` 兄弟规则，修现状多钮各自 auto 致散开）。
   ③ **卡界 = VSC 实形**：行 = 1px 描边（`--line`）+ 圆角 6px（实读 `thincoder-vscode/webview/settings.css:155-159`——`border: 1px solid var(--border)` ∥ `border-radius: 6px`；卡底零独立填充；用户 2026-10-02 10:27 裁「尽量跟 VSC 一致」——D24 描边归零基线全局零动 ∥ 仅本卡界让位）。
   ④ **层次/密度**：行内层次 = 主行（名 + 钥面）∥ 副行（muted 元数据）∥ 条件第三行（提示句）；密度 = 两行间距 4px ∥ 卡内边距 6px 8px（保持）。
2. **渠道段（锚点首段）= 两行卡列**——行根（`[data-provider]`）纵排：**主行**（`.settings-row-main`）= 名 + 钥面（masked ∥ 未设词）+ 当前标 + **动作簇**；**副行**（`.settings-row-sub`）= `模型 · baseURL`（串形照 VSC——缺段不落空分隔符）+ 不可用标 + 行尾代理开关。
   **动作簇 = 桌面动作全集**（功能面不删：修改/设钥 ∥ ✕删钥 ∥ 校验 ∥ 移除名——四件全保留、**序恒定 = 现盘序保持**）；**编辑态**（钥行编辑中）= 行内换形（沿 VSC `keyRowEdit`）：主行 = 名 + 钥面 + 输入（伸缩）+ 存 ∥ 消；代理 ∥ 移除 ∥ 校验暂撤（取消即回——既有行为零改）；**第三行**（条件）= 不可用原因句（`!hostBusy` 时——S3 分档保持；色 = `--accent`，对齐 VSC 失败句红系语义）。
   「不采用」（端差）：**状态点**（VSC `●`——键面已载配置态，加 = 净增密度）。
3. **其余六段——行族通则带上（逐段点清）**：模型（当前 ∥ 候选行——nowrap + 省略；`使用` 右对齐既有）· agent 参数（字段行 nowrap；复选换拨杆）· MCP（行 = 名 + 形词 + 摘要省略中段 + 五动作右簇；展开面工具行 = 竖排三段 + 缩进 24px——VSC `.mcp-tool-row` 同形）· env（字段行 nowrap；两复选拨杆；测试行 nowrap）· 工具与服务（键行 ∥ 索引行 nowrap + 动作右簇）· 模型清单（consult ∥ advisor 行 nowrap + 省略 + 动作右）。
4. **复选控件 = 拨杆形**（源 = VSC `.switch`）：`input.settings-field[type="checkbox"]` ⇒ `appearance: none` + 轨道 30×16（圆角 8px · 底 `--line`）
   + 圆钮 12px（`#fff` 字面——两主题同值，沿 VSC）+ 选中轨道 `--accent` + 钮右移（`left: 16px`）。**文本输入 ∥ 下拉细边保持（D24 保留面零动）**——仅复选子域换形。
5. **端差登记（逐条给由 · 不追）**：① 圆角——VSC 6px 族（实读 `thincoder-vscode/webview/settings.css` 八处——卡仅一例）∥ 桌面 `--radius: 0`（扁平化定版）；**卡界（`.prov-row`）例已随用户 10:27 裁定同形**（项 1 ③）——余域不追；② 状态点不采用（项 2）；③ 字级——VSC 12px/600 ∥ `--fs` 14px/400（D29 基线）；④ 表单标位——VSC 标上行 ∥ 桌面标左（`flex: 0 0 6rem`——48rem 列宽域；本批保持）。
6. **判据**——机检 = 批内件 `docs/batches/2026-10-02-desktop-settings-layout.test.mjs`（**已建成 · 219 行 · 五腿 · 9 用例**：行结构断言 ∥ 断行恒定源扫 ∥ 样式纪律（零新变量 ∥ 零新断点）∥ 拨杆四规则 ∥ 卡界源扫（`1px solid var(--line)` + 圆角 6px））；真机面 = **T-DSK58**（用户实拍可比）。测试档随修随加——不占设计面条目（2026-09-27 裁定）。
7. **边界**——交互语义 ∥ 功能增删 ∥ 七段信息架构（段集 ∥ 段序）∥ 布局面（48rem 居中列——零动）· 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 侧零触 · 主题变量表 ∥ 断点 ∥ D29 基线零改（**零新变量 ∥ 零新断点**）。
8. **计数（D3）**——收正段 **7** · 渠道卡结构件（两行 + 一条件行）· 端差 **4** · 新增变量 **0** · 新断点 **0** · 词键 **0**（零新文案）· 新档 **1**（拆档产出）。

### 2.6 启动态 ∥ 首启向导（行）

| 面 | 形态 |
|---|---|
| 启动态 | 无当前项目 ⇒ 打开目录入口 = 会话控制面**项目钮**（`project:open`——恒在场，词面经 `aria-label`；R13 后原左列入口面退场）· **中区引导面在场**（`data-guide="no-project"`——落点 = 对话流挂载根；见 `docs/desktop/design/UI.md` §1「批 B 追加注」项 1）· **parity-b10-ui 增（首屏引导门 · R1）**：`data-boot ≠ "ok"` 期间引导层在场 ∕ `"error"` ⇒ 错误面（可读原因）∕ `"ok"` ⇒ 撤——形 / 锚 = 本档 §2.2 项 8 |
| 首启向导 | 闸 = `config:read` 回执 `configured` 假 ⇒ 冷启动进向导（已配 ⇒ 跳过）；**容器 = 同设置面**（`[data-slot="settings"]` 单容器——两树互斥 · `configured` 假 ⇒ 向导占槽）；三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）——**零终端可完成**；**退场 = 清空容器**（主 UI 可用）· **幂等可重入**（中途退出 / 配置仍缺 ⇒ 下次冷启动再进）；**档不可读（畸形）⇒ 向导不进 · 容器空 + 设置面可进 + 明示不可读**（错误串直传 · **不静默重置**——本档 §1 KD-12；`data-boot` 保持 `error`）；表单出口**复用设置面导出面**（单一 owner · 零副本）；形态 = 纯描述符树 + 薄挂载（`docs/desktop/design/RENDERER.md` §1.1）；**步界 / 步体闭集**（单源）= `STEPS` 三步闭集（表外值回落步 1——`thincoder-desktop/renderer/views/onboarding.mjs:20` / `:30`）· `stepBody` 三分支（步 1 / 2 / 其余 ⇒ 目录步——`:84`） （机检豁免——端侧语汇） |

### 2.8 重建保真 · 设置 ∕ 向导草稿保真（#604）

1. **设置 ∕ 向导草稿保真（#604）**——任一 settings 切片写落地不得清未提交草稿：`paintSettings` 单闸（`thincoder-desktop/renderer/mount-settings.mjs:207-222`——两树唯一重绘点）捕获 ∕ 复填；捕获域 = 携 `[data-draft]` 申报控件；非申报控件取新模型值（负向锁）；真机 P1（设置 + 向导两径）。单源 = 批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.2。
2. **两腿重锚（2026-10-08 · 台账 #1059）**——三端对齐批（#1027–#1029）后渠道两形表单入 `providerAdd` 弹窗体且单形渲染 ⇒ 波 1 机检两腿重锚：腿一 = 弹窗体富形（`addShape:"custom"`）+ 页槽（工具 key ∥ env shell）两宿主两轮重绘保真；
腿二 = 弹窗卡根在途窗（`mcpForm` 跨 `loading`）携带（草稿 ∕ 焦点 ∕ 光标 ∥ 卡滚位）。机检件 = `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（验收 = 8/8 全绿）；重锚设计 ∥ 「两形同刷」覆盖缺口与去处 = 批档 `docs/batches/2026-10-08-residue-sweep.md` §2。**受影响文件（本批 · 含本项机检件行）小表 = 本档 §2.19**。

### 2.9 半行指针（本域半边在其本档）

- **设置面头主题控件半**：主题主条 = `docs/desktop/design/UI.md` §1「主题」行 ∥ §1「本批注（主题切换 · D33 · 2026-09-30）」；本域半边 = 本档 §2.1（面头三态钮族）。
- **空态 ∥ 启动态「引导向导」半**：空态 ∥ 启动态主条 = `docs/desktop/design/CHAT.md` §2（2a 已收编——空态）/ 本档 §2.6（启动态）；引导面全形 = `docs/desktop/design/UI.md` §1「批 B 追加注」。
- **会话级三值 ↕ 设置面默认值半**：会话级主条 = `docs/desktop/design/COMPOSER.md` §2（批 B 注项 1 ∥ 输入区行）；本域半边 = 本档 §2.1（模型段）。

### 2.10 设置菜单升级批注（D39 ∥ D38 · 2026-10-02 · 台账 #817）

**本批注（设置菜单升级 · D39 ∥ D38 · 2026-10-02 · 台账 #817）**：本批定形**设置弹窗化（A 案）**——设置菜单七组项 ⇒ **应用内模态弹窗**（单组 ∥ 读写 ∥ 确认 ∥ 失败链全复用）；**现有设置页零动并存**（升级件——验收 OK 后再议撤，D39）。决策单源 = 本档 §1 **KD-68**；菜单侧（组树 ∥ 通道 ∥ 词面）= `docs/desktop/design/MENU.md` §1 **KD-67**；批档 = `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md`。

1. **弹窗体（形 ∥ 交互）**——背板（z-20）+ 居中卡（z-21；宽 ≤48rem；高 ≤视口；内滚）；三关 = 背板 ∥ ✕ ∥ 卡内 Esc（stopPropagation）；初始焦点 = ✕；`role="dialog"` + `aria-modal`；零焦点陷阱（边界）。
2. **七组复用链（表 · 指名）**——渠道 ∥ 模型 ∥ agent 参数 ∥ MCP ∥ 运行环境 ∥ 工具与服务 ∥ 会诊与审查：
  段体组件（`providersBody` ∥ `modelBody` ∥ `agentBody` ∥ `mcpBody` ∥ `envBody` ∥ `toolsBody` ∥ `modelsBody`）+ 读取链（`loadProviders` ∥ `loadProviders` ∥ `loadAgent` ∥ `loadMcp` ∥ `loadEnv` ∥ `loadTools` ∥ `loadAgent`）+ 出口链（同一 `exits.handlers` 全表）——逐行全名 = 本档 §1 **KD-68** ③。
3. **开合 ∥ 状态**——`settings.modal` 切片（`null ∥ 组名`）；开 = 验证（`SCOPES`——`SECTIONS` 派生，定义位 = `thincoder-desktop/renderer/mount-settings.mjs:48`）→ 占槽拒（向导期）→ 切片写 + 本组复位 + 本组读取；关 = 清 + 本组复位 + 确认同清；`closeSettings()` 同清。
4. **重绘 ∥ 草稿保真**——第二闸（沿 #604 同形）+ 独立残件 + 失效集同滤；`refreshSettings` 在场判据 +`modal`。
5. **判据**——机检 = 批内件（波 2 三腿——本档 §4）；真机 = **T-DSK59**（本档 §5）；零新词键（复用段名 + `settings.close`）。
6. **边界**——现有页 ∥ 七段值面语义 ∥ 独立窗口（B）∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触；确认族叠序保留（40/41 在弹窗上）。

### 2.11 设置菜单组项收窄批注（D39 收正 · 2026-10-02 · 台账 #820）

**本批注（设置菜单组项收窄 · 2026-10-02 · 台账 #820）**：菜单组项集 **七 ⇒ 六**——「模型」不入菜单（模型选择归输入面板——用户 2026-10-02 16:53 走查裁）；**设置页面七段零动**。
本批**设置域（渲染面）零触**——弹窗校验面（`SCOPES`）保持**七名宽容**（菜单不发第七名——零改，支 A 裁定；**as-of 本批——现值十名**：三端对齐批（2026-10-07）增 `providerAdd`（§1 **KD-75**）∥ 添加入口弹窗统一批（2026-10-07 · 台账 #1054）增 `mcpForm` ∥ `consultAdd`（§2.18））；
`settings.modal` 切片 ∥ 复用链（七行——本档 §2.10 项 2）∥ `MODAL_READS`（定义位 = `thincoder-desktop/renderer/mount-settings.mjs:52`）（**as-of 本批七组——现值八组**：+`providerAdd` → `loadProviders`；**本批 +2 行 ⇒ 十组**（`mcpForm` → `loadMcp` ∥ `consultAdd` → `loadAgent`——§2.18 项 3）；
设置页对齐；菜单可达面 = 六组弹窗）。决策单源 = 本档 §1 **KD-68** ④（闭集关系句）∥ 菜单侧 = `docs/desktop/design/MENU.md` §1 **KD-67**；批档 = `docs/batches/2026-10-02-settings-menu-trim.md`。

### 2.12 轻通道轮六批注（走查续调六 · 2026-10-02 · 台账 #819）

**本批注（轻通道轮六 · 2026-10-02 · 台账 #819）**：本注定形两笔走查续调（源 = 用户 2026-10-02 16:43 ∥ 16:56 走查——设置菜单升级批（#817）走查分流；批档 = `docs/batches/2026-10-02-light-round-6.md`）。

1. **渠道校验反馈就地化（笔一）**——`verify` 结果携行名（`name`）；**匹配行 ⇒ 本行呈现**（校验按钮态短形：`ok` ⇒「校验通过」∥ `fail` ⇒「校验失败」+ 锚 `data-verify-state`；结果明细行 = 既有 `verifyNode` 形落于本行）；**无行渲出结果**（名不在列表 ∥ kind 表外）⇒ 段末回退（`fallbackVerifyNode`）。
   **编辑态 = 校验钮 ∥ 结果明细行同撤**（校验暂撤口径含明细；取消即回——`settings-sections-providers.mjs:162` `|| editing` 径）。**结果跨开面留存 = 有意**（语义 = 「上次校验读数」：提交成功 ∥ 移除 ∥ 下次校验起手均已清（`mount-settings-exits.mjs:85 ∥ :117 ∥ :98`）；开面不清——零实现改）。
   **落档四（as-of 2026-10-02 实读）**：`thincoder-desktop/renderer/mount-settings-exits.mjs:102 ∥ :105`（结果携 `name: target`——零增行）∥ `thincoder-desktop/renderer/views/settings-controls.mjs:127`（`verifyControl` 三参——`state` 缺省零变 ⇒ 向导径原位）；
   `thincoder-desktop/renderer/views/settings-sections-providers.mjs:42 ∥ :133 ∥ :136 ∥ :162 ∥ :190`（`fallbackVerifyNode` 定义 ∥ `providerRowNode` 四参 ∥ 本行态 ∥ 本行明细）∥
   `thincoder-desktop/renderer/i18n-settings.mjs:67-68 ∥ :132-133`（+2 键 × 两语：`settings.providers.verify.okShort` ∥ `.failShort`）。**零契约 ∥ 零通道 ∥ 零 store 形改**（`verify` 对象 +1 字段）。
2. **弹窗头行粘顶（笔二）**——卡内滚 ⇒ `.settings-modal .settings-head` sticky 常驻（`position: sticky` ∥ `top: 0` ∥ `z-index: 1` ∥ 不透明底 = `--bg-raised`——标题 ∥ ✕ 不随体滚出）。落档一（as-of 2026-10-02 实读）：`thincoder-desktop/renderer/settings-modal.css:37-43`（零新变量 ∥ 零新断点）。
   **页 ∥ 向导面同径（头行粘顶批 · 2026-10-07 · 轻通道 · 台账 #1030）**——整层滚（`[data-slot="settings"]` `overflow: auto`）⇒ `.settings-head, .wizard-head` 同法
   （`position: sticky` ∥ `top: 0` ∥ `z-index: 1` ∥ 不透明底 = `--bg`——页底同色；标题 ∥ ✕ 不随体滚出）；落档一（as-of 2026-10-07 实读）：`thincoder-desktop/renderer/settings.css:43-57`（+7 = 注释 3 + 声明 4）。
   **a11y 补 = 两滚动层 `scroll-padding-top`（2026-10-10 · 台账 #1039）**——页层（`settings.css` `[data-slot="settings"]`）∥ 弹窗层（`settings-modal.css` `.settings-modal`）各增一行：
   `scroll-padding-top: calc(var(--fs) * var(--lh) + 2 * var(--gap));`（≈ 42.2px = 头行 27.2px + 余量——沿 #819 ∥ #1030 粘顶批同形）；**效 = 键盘 Tab ∥ 焦点滚入 ⇒ 目标件不被粘顶头遮挡**；滚动手势零介入（`scroll-padding` 只改滚入对位——鼠标观感零变；**无媒体钩 ⇒ 不可只键盘态补**）。（父侧拆行 2026-10-10 · 可 revert）
   弹窗面专指规则（上半）不受影响（专指度更高——真机复核：弹窗头底色仍 `--bg-raised`）；批档 = `docs/batches/2026-10-07-settings-heads-sticky.md`（红绿对 ∥ 逐条核点 = §1.1 ∥ §1.2）。
3. **两面同效**——渠道段体 = 页 ∥ 弹窗共用单源（本档 §2.10 项 2 ∥ §1 **KD-68** ③——零第二实现）⇒ 笔一在两面向同效；笔二（#819）= 弹窗体起手；页 ∥ 向导面同径承接（#1030——项 2 下半）。
4. **判据 ∥ 测试**——笔一（触及可执行行为面）：批内件 `docs/batches/2026-10-02-light-round-6.test.mjs`（已建成——三径：匹配行本行态 ∥ 无行渲出结果段末回退 ∥ 空态零节点）+ 真机走查；笔二（视觉细部）：真机走查读数（走查即验收读数本——亮 ∥ 暗；卡内滚终态）。验收回指 = 本档 §4 本批块；用例面 = §5 随动（T-DSK58 ① ∥ T-DSK59 ③）。
5. **边界**——零契约 ∥ 零通道 ∥ 零 store 形改 ∥ 零新变量 ∥ 零新断点；段集 ∥ 段序 ∥ 其余交互语义 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触。

### 2.13 P1 读数端面消费批注（KD-69 · 桌面侧 · 2026-10-02 · 台账 #697）

**本批注（P1 读数端面消费 · KD-69 · 桌面侧 · 2026-10-02 · 台账 #697）**：本批定形桌面设置面「工具与服务」段两读上屏（库大小行 ∥ 逐 origin 行数行——KD-69 ② 桌面半）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-69**（本注 = 该行 ⑤ 入档行的解冻回填）；批档 = `docs/batches/2026-10-02-desktop-ux-closeout.md` §2.4；实施读数 = 本档 §3.1。

1. **词键（两语同增）**——`settings.indexDbSizeLabel`（行面名键——名 ∕ 值两列式；组成式 ≠ VSC 同名键 `settings.indexDbSize` 整行模板）∥ `settings.indexOriginCounts`（计数片段——两语值逐字同 VSC `locales` 同名键）；落点 = `thincoder-desktop/renderer/i18n-views.mjs`。
2. **形**——库大小行 = `div.settings-row` 带 `data-index="db"`（名 ∥ 值两列）；逐 origin 行 = 每 origin 一行 · `data-index="origin"`（名 = origin 原样；值 = 计数片段）；落点 = `thincoder-desktop/renderer/views/settings-sections-tools.mjs`（`dbSizeRowNode` ∥ `originRows`——段体尾）。
3. **缺位 ⇒ 零节点**（禁假造）——`dbBytes` 非有限 ∥ 负 ⇒ 库大小行不落；`origins` 缺 ∥ 非数组 ∥ 空 ⇒ 零行；字节归一 = `formatBytes`（B ∥ KB ∥ MB ∥ GB 一位小数）。
4. **刷新拍** = 与既有索引读数同拍（设置面加载 ∥ 构建后推送——**零新通道 ∥ 零新计时器**；KD-69 ④）；供给链 = `thincoder-desktop/src/main/index-status.mjs`（`readIndexCounts` 回执透传——端侧零 SQL）→ `thincoder-desktop/src/main/settings.mjs`（`indexStatus()` 回执透传）。

**边界**：常驻状态栏段不做（状态行段集闭集——KD-69 ⑤）；产品码零触（本注 = 设计档回填）。

### 2.14 首跑渠道提示修复批注（2026-10-03 · 台账 #840）

- **来源**：用户 12:56 走查（已配渠道+key 仍提示「未配置 API 密钥」）＋ 12:59 裁「A+B」＋ 13:43 更正（13:09 口径系拼音误打——原话「按你倾向走」＝采纳父侧倾向；终形 = 词面-only）；批档 = `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 更正块；契约面 = `docs/desktop/design/IPC.md` §2；词面 = `docs/desktop/design/COMPOSER.md` §2 本批注。
- **首跑补全（`provider:save` 补写）——已随 2026-10-09 清除批退场**：渠道单值模型退场 ⇒ 补写源（`name:model`）不存在；`defaultModel` 写入面 = 视图出口 ∥ 选定写回（`docs/desktop/design/IPC.md` §2 注 8①）。
- **向导收尾（`finishWizard`——评审轮 1 改档口径）**：完成径 = **现行为零改**（复读 `configured` ⇒ 落槽 ⇒ 退场/重进——**不阻断完成**）；不设「默认模型」守卫——
  守卫态（渠道非空 ∧ `defaultModel` 缺）的提示 = 输入区发送失败行（词 `composer.send.noDefaultModel`——`docs/desktop/design/COMPOSER.md` §2 本批注）；
  判由 = 模型步候选同源零候选（见下「边界 ∥ 上抛」bullet）。
- **向导模型步「采用」接线**：`createWizard` 增注入 `useModel`（单一实现 = 出口族 `onUseModel`；注入点 = `thincoder-desktop/renderer/mount-settings.mjs`）——步 2 候选行「采用」由禁用转可操作（原接线缺口 = 既有；U-2 裁定纳入——步 2 可操作面闭合）。
- **本域相关边界 ∥ 上抛**：设置面「模型」段 ∥ **向导模型步**候选**同源**——皆按**激活渠道**取数（`renderer/mount-settings-reads.mjs:33-39` / `:74-78`——**2026-10-09 清除批：激活渠道 ∥ 「当前模型」两读数改由 `defaultModel` 复合串直读**（渠道条目不携模型）；
  向导步入径 = `renderer/mount-onboarding.mjs:55-58`）——`defaultModel` 缺失态两处**同零候选**（向导步「采用」钮判据三件含 `model.provider !== null`——`renderer/views/settings-sections.mjs:70-72`）
  ∥ 渠道行族无「设为当前」动作（`renderer/views/settings-sections-providers.mjs:133-165`）⇒ 该态 config 级补设路径缺失（**候选消解 = 本批 #842 落——设置面 ∥ 向导步两处同链同效，见 §2.15**；批档 §2 U-9 登记收口）。
- **判据 ∥ 边界**：D11 不抵触（向导完成径零改）；`provider:setKey` ∥ `delKey` ∥ `setProxy` ∥ `settings:agent` 写语义零改；配置档 ∥ 设置页 ∥ 弹窗面零结构改；机检 = 批内件 T3 / T4 ∥ 源码判据。

### 2.15 缺激活渠道态补设路径（2026-10-04 · 台账 #842 · 设计轮）

- **病灶**（#840 设计轮 U-9 ∥ 批档 §2）：设置面「模型」段候选**按激活渠道取数**（`thincoder-desktop/renderer/mount-settings-reads.mjs` `loadModels`——`:74-89`）；
  `defaultModel` 缺 / 不可解析 ⇒ 激活渠道 = `null` ⇒ 段归 `none` **零请求零候选**（禁假造候选）；渠道段行族无「设为当前」动作 ⇒ **config 级无 in-UI 补设路径**（死端）。
- **修法 = 全渠扇出补设（复用既有通道——零新 IPC ∥ 零新写面）**：`loadModels` 于 `provider` 空时改取 **`model:catalog`**（无载荷全渠扇出——白名单位次 39；单源 = `docs/desktop/design/IPC.md` §2「模型清单注」）
  ⇒ 候选行族 = `{ provider, id }`（全渠——渠失败零行沿 catalog 口径）；行「采用」经**既有出口** `onUseModel(provider, id)`（`renderer/mount-settings-exits.mjs` `useModel`——写 `settings:agent { patch: { defaultModel } }`）
  ⇒ 写后 `loadProviders` 回读 ⇒ 激活渠道出现、段转常规面。**写面 / 载荷 / 白名单零新**（两条既有通道）。
- **视图形**：`modelChoicesTree` / `modelRowNode`（`renderer/views/settings-sections.mjs`）候选行扩**带渠形**——行显示 `provider · id`（对齐 consult 行族先例 `views/settings-sections-models.mjs:54`）；
  「采用」判据由「激活渠非空」改「**行自带渠非空**」（全渠态下每行自携 provider）；当前项判定 = `current === "<provider>:<id>"`；空态 / 失败面沿既有（零候选 ⇒ 空态词；catalog 失败 ⇒ 段 `none` + `report`——零静默）。
- **投影档穿透（表外件①——#842 随批落面 · 2026-10-04）**：候选行渠字段经 `thincoder-desktop/renderer/views/settings.mjs` 投影透传（`:162-163` 保留 `{ id, provider }`——行自带渠的前提；缺 ⇒ 视图形不可达）。
- **向导模型步同源（实读钉死——结局 = 同效）**：向导步 2 复用 `modelChoicesTree`（单一 owner），且候选复读 = **同一注入引用** `loadModels`（注入点 = `mount-settings.mjs:214`；调用点 = `mount-onboarding.mjs:59-62` 步入步 2）；
  「采用」同经同一 `onUseModel` 出口（`:216`）——**同链 ⇒ #842 修法在向导态自然同效、向导死端同消解**（零向导档改动）。**断言** = T-DSK62 ⑤（向导腿——同链推证）。
- **边界**：渠道行不加「设为当前」动作（被否——写面须先有模型，两步合成「采用」单步已足）；输入区指路句（`docs/desktop/design/COMPOSER.md` §2 本批注「本态零候选 ⇒ 不作指路」）**前提随本批改变**——指路随正候选（登记；随该域下次触碰）。

### 2.16 provider 添加弹窗批注 · 扩面随动（三端对齐批 · 2026-10-07 · 台账 #1027 / #1028 / #1029 / #1031 / #1032 / #1033 / #1035）

**本批注（三端 provider 配置面对齐 · 2026-10-07）**：本批定形**桌面渠道添加 = 专用弹窗 + 单表照 VSC 源**（用户 18:07 三端令 / 18:10 不许另搞一套 / 18:13「点了添加不弹窗」；逐字 = 批档 `docs/batches/2026-10-07-provider-config-parity.md` §1.1）。
决策单源 = 本档 §1 **KD-75**；VSC 源 = `docs/vsc/design/SETTINGS.md` §2.16；逐元素对齐表 ∥ 字段序三端表 = 批档 §2；探面同判定口径落点 = `docs/core/design/PROVIDER.md` §6.19（单源 = `docs/core/design/PROXY.md` §4）∥ `docs/desktop/design/IPC.md` §2（本批行）。

1. **面形（弹窗体）**——骑 D39 宿主（零新基建）：`settings.modal` 值 + `"providerAdd"`（`SCOPES` 七 ⇒ 八——定义位 = `thincoder-desktop/renderer/mount-settings.mjs:48`；`MODAL_READS` +1 行 = `loadProviders`）；
卡 = `header.settings-head`（标题 = `settings.addProviderTitle`）+ `div.settings-modal-body`（失败串（scope = `providers` ∥ `panel`）+ 段态词 + 单表）；
开 ∥ 关 ∥ Esc ∥ 背板 ∥ 初始焦点 = 首控件（源对齐——KD-68 ⑥「焦点落 ✕」之表单例外，登记）∥ 第二闸草稿保真（#604）∥ z 族 20/21 = 沿 KD-68 全套；**零新 CSS ∥ 零新变量 ∥ 零新断点**。
`resetFacets("providerAdd")` = `providers` 面态复位（`addShape` 回 `"preset"` ∥ `probe` ∥ `draft` 清）。
2. **入口（渠道段体）**——`providersBody`（`renderer/views/settings-sections-providers.mjs:179-194`）尾「+ 添加」钮（词键新增 `settings.addProvider`——两语 "+ Add" ∥ "+ 添加"，逐字同 VSC；锚 `data-action="settings:addProvider"`）；**原双表单（常显内联）退场** ⇒ 段体 = 行族 + 校验回退 + 添加钮（页 ∥ 七组弹窗两面同效——单源段体）。
3. **单表（`channelFormTree` 内容演进——落点 `renderer/views/settings-controls.mjs`；名不换 ⇒ 调用面零改）**——节序 = 类型 `select name="preset"`（标签 `settings.providers.presetLabel`；预设项 = `presetLabel` 串形 `name — desc`；末项 `settings.providers.customChoice`（新键））
+ 预设信息行（`data-preset-info`；`baseURL`，缺段不落空分隔符——D37 口径）+ 条件块 A（`name="name"` ∥ `name="baseURL"` ∥ `name="format"`（`formats` 闭集））
+ `name="key"` + `name="proxy"`（拨杆形——D37；词 ∥ title = `settings.proxyRow` ∥ `.proxyRowTitle` 同键）+ 条件块 B（拉取行（既有 `fetchRowNode`）——渠道校验钮；`name="model"` 输入件退场（2026-10-09 清除批））
+ 提交（`settings.save`；`data-action` 按形出锚 `settings:addCustom` ∥ `settings:addPreset`——锚名不碎）+ 取消（`settings.cancel`；`data-action="settings:modalClose"`）；形状唯一源 = `providers.addShape` 切片（`"preset"` 缺省），切换 = 重绘（第二闸复填在编输入——**系统值面**（模型预填等）；**用户草稿不跨形携带**＝「换形净起步」，沿 `M-604b·作用域锁`；父侧注 2026-10-10 · 可 revert）；
**弹窗体三件（类型切换接线 ∥ 自定末项 ∥ 预设信息行）随 `onAddShape` 在场、取消钮随 `onCloseModal` 在场——条件渲染**（`thincoder-desktop/renderer/views/settings-controls.mjs:97 ∥ :114 ∥ :122 ∥ :126 ∥ :183`）；向导步 1 不携两 handler ⇒ 保持预设单选（**设计字面，非静默发散**——项 5）。
4. **字段序（现行 → 目标）**——自定形现 `name→baseURL→[拉取]→model→format→key→active` ⇒ 目标 `preset→[info]→name→baseURL→format→key→proxy→[拉取]`（2026-10-09 清除批：`model` 位退场）；预设形现 `[preset选择]→key→active` ⇒ 目标 `preset→[info]→key→proxy`（逐元素表 = 批档 §2.4；桌面独有：`active` 复选 ∥ 双表形态——处置 = 退场）。
5. **`active` 退场（登记）**——设置面表单不再设「当前渠道」（VSC 无此元素）；等价路径 = 模型段候选行「采用」（`renderer/views/settings-sections.mjs` `modelRowNode`）；`backfillDefaultModel`（首渠自动）随 2026-10-09 清除批退场；向导步 1 表单（`views/onboarding.mjs`）`activeDefault` 复选随 2026-10-09 清除批退场（`active` 参退场 ⇒ 死控——无 active 写路；等价路径 = 模型段「采用」）；
表单构建器该复选条件渲染随同退场（`activeDefault` 参删——设置弹窗 ∥ 向导全径零节点）；**向导步 1「走 proxy」在场（明写）**——`proxy` 件无条件渲染 ⇒ 向导步 1 同在场（未勾 ⇒ 提交零键——项 6 读法）；
**向导步 1 预设单选 = 设计字面（明写）**——弹窗体三件随 handler 在场（项 3）；向导不携两 handler ⇒ 选型无回环（信息行必失真）∥ 无弹窗宿主（取消钮无动作）⇒ 条件化渲染、零死控；**非静默发散**。
6. **写面（`providers[].proxy` 同一键）**——`provider:save` 载荷 + `proxy`（勾选 ⇒ `true`）⇒ `addProviderEntry` 迁受（同批落条））；行开关（`provider:setProxy`）语义零改；表单初值 = 未勾（新条目无旗）；向导步 1 提交同携 `proxy`（`submitChannel` 共用——读 `data.get("proxy") !== null`）。
7. **探面同判定（缺陷修复并本批——父裁）**——现读链 = 渲染面 `mount-settings-segments-providers.mjs:137`（`ask("provider:models", { baseURL, apiKey, format, ...proxy })`——勾选 ⇒ 携 `{ proxy: true }`（`:130`）；未勾 ∥ 缺省 ⇒ 缺位）
⇒ 主面 `thincoder-desktop/src/main/providers.mjs:276-288`（目标 = `probeTargetOf({ name: "", baseURL, apiKey, format, proxy: payload?.proxy === true })`——`:281`；同判定（条目 `proxy` ∧ 代理 `uri` 在案 ⇒ `proxy.uri`——逐渠独立，2026-10-08）；缺省 ∥ 未勾 ⇒ 直连）
⇒ `probeChannelModels("", target)`（`:282`）；回执行 ∥ 落账（名传空串）零改。
8. **判据**——机检 = 批内件四件（按舱拆）：`docs/batches/2026-10-07-provider-config-parity-cli.test.mjs`（**127**）∥ `docs/batches/2026-10-07-provider-config-parity-vsc.test.mjs`（**412**）∥
`docs/batches/2026-10-07-provider-config-parity-desktop.test.mjs`（**377**）∥ `docs/batches/2026-10-07-provider-config-parity-vsc-harness.mjs`（**210**——VSC 测试台公档 · 非测试档）
（树面：单表节序 ∥ 条件块随 `addShape` ∥ 段体无表单节点 + 添加钮；
导出面：`channelFormTree` 节点序；主面：`providerSave` 携 proxy 落条 ∥ `providerModels` 目标带 `proxyUri`（逐渠判定 ∥ 直连两径）；开径：添加钮 `data-action="settings:addProvider"` click ⇒ `openSettingsModal("providerAdd")`）；
真机 = 人工走查（弹窗四径 ∥ 字段序 ∥ 勾选落盘 + 行面勾选随动 ∥ 拉取随勾选 ∥ 向导步 1「走 proxy」在场 + 勾选落盘）。用例号 = 拟 **T-DSK63**（自铸——父侧可并号）。
9. **计数（D3）**——词键 +3（`settings.addProvider` ∥ `settings.addProviderTitle` ∥ `settings.providers.customChoice`）− 2（`settings.providers.addCustom` ∥ `.addPreset`——设置面退场后无消费者，随实现净删）；
通道 +0（复用 `provider:save` ∥ `provider:models`——载荷增字段）；弹窗值集 七 ⇒ 八；store 切片 +1 键（`providers.addShape`——非结构性，消解窗口顺延）；
新档 0；导出面 ±0（`channelFormTree` 演进——名不换）；**扩面随动（父并 #1031–#1035）**：词值改 6 键（`settings.providers.keyLabel` ∥ `.noKey` ∥ `settings.addKey` ∥ `settings.deleteKey` ∥ `model.setKey` ∥ `composer.send.noProvider`——「API Key」形统一，键数不变）；
#1031 ∥ #1032 ∥ #1033 本端零改（手输+datalist = 源基线 ∥ 无「选择模型…」元素 ∥ 表单串皆入表；明细 = 本档 §2.16 尾）。

**扩面随动（#1031–#1035 · 父侧 2026-10-07 一次并入——本批同稿）**：① **#1031 零改**——本端自定形 model 已 = 手输 + 探果 datalist（`renderer/views/settings-controls.mjs:88-91`）∥ 保存不依赖拉取（**源对齐基线**——VSC 向本形看齐）；
② **#1032 无此元素**——桌面无「选择模型…」行（模型选择 = 模型段候选行；差异登记）；
③ **#1033 零改**——本端表单串皆经 `t()`；
④ **#1035 词值统一**（实体名 = 「API Key」——zh 保留英文形，裸「密钥」退场）：`settings.providers.keyLabel`（en "API key" ⇒ "API Key" ∥ zh「API 密钥」⇒「API Key」）∥ `settings.providers.noKey`（"No API key" ⇒ "No API Key" ∥「未配置密钥」⇒「未配置 API Key」）∥
`settings.addKey`（"Add Key" ⇒ "Add API Key" ∥「添加 Key」⇒「添加 API Key」）∥ `settings.deleteKey`（"Delete key" ⇒ "Delete API Key" ∥「删除密钥」⇒「删除 API Key」）∥
`model.setKey`（`renderer/i18n-composer.mjs`——zh「设置密钥…」⇒「设置 API Key…」+ en 同拍）∥
`composer.send.noProvider`（`renderer/i18n-views.mjs`——zh「未配置 API 密钥…」⇒「未配置 API Key…」）；键数不变（值级改写）。

**边界**：行族 ∥ 行开关 ∥ 探针落账 ∥ 七段信息架构 ∥ 现有设置页 ∥ 核运行期代理语义（`injectProxy`）∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触；独立弹层基建设不做；#1034 裁讫 · A（删除符 = `✕`——**本端 `✕` 不动**（删钥）；VSC 渠道行 `−` ⇒ `✕`——批档 §2.9①）∥ #1036（MCP env 串）批外另立。

### 2.17 MCP 键值行式输入批注（2026-10-07 · 台账 #1036）

**本批注（MCP 表单 env ∥ headers = 行式键值 · 两端）**：VSC 为准、桌面逐元素对齐（本仓现行源对齐 doctrine）；决策单源 = 本档 §1 **KD-76**；VSC 面 = `docs/vsc/design/SETTINGS.md` §2.4 ∥ §5 **U-S17**；明细 = 批档 `docs/batches/2026-10-07-mcp-kv-input.md` §2。

1. **行件形**——三组各一份行集（stdio `env` ∥ http `headers` ∥ ws `headers`，与 VSC 三容器同形）：行 = `.settings-field-row` + 键格 ∥ 值格（`.settings-field`；占位 `settings.mcp.kvKey` ∥ `.kvValue`）+ ✕（`.settings-row-action`；`aria-label = settings.mcp.kvRemove`）；
行集下「添加行」钮（`.settings-submit`；词 `settings.mcp.kvAdd`）；**零项 ⇒ 零行**；**零新 CSS**（复用列出的既有类——避触本档 `settings.css` 在册越线的拆分窗口）。
2. **行令牌态（切片）**——`settings.mcp.form.kv = { env ∥ headers ∥ wsHeaders: [{ t, k, v }] }`（表单开时自 config 生成、随 `form` 生命周期复位—— `resetFacets` 现径同拍）；令牌 `t` = 表单内单调递增、**永不复用**（草稿闸按 `id = mcp-<group>-<k|v>-<t>` 定位——`renderer/view-state.mjs:168-174`；索引键会在删行后把残值灌进新行）；行件携 `data-draft`（#604 两闸捕获 ∥ 复填保输入）。
3. **两出口**——`onMcpKvAdd(group)` ∥ `onMcpKvRemove(group, t)`：先自读 DOM 行集（无 DOM ⇒ 空转——同 `readMcpForm` 退化式）→ 写切片 → 重挂；**类型切换出口**同拍同步当前组行集（**行值捕获径 = 与加删出口同一「自读 DOM 行集」面**——不采 `readMcpForm` 快照；切换不丢手——沿 `draft` 先例）；`readMcpForm` 草稿快照**不采行件**（重复 `name` 单值槽会塌缩——行值保真归令牌 + 草稿闸两层）。
   **现读面（实施落盘 2026-10-07）**：`mcpFormNode()` = 文档序末位 `[data-form="mcp"]`（页体 ∥ 组弹窗体两宿主同判——弹窗体挂 `body` 尾 ⇒ 在场即交互面）；加删 ∥ 类型切换两出口与 `readMcpForm` 同一读面（`thincoder-desktop/renderer/mount-settings-segments-mcp.mjs:85-90`）。
4. **提交**—— `mcpConfigFrom` 自 FormData 按 DOM 序配对（`getAll("<group>-k")` ∥ `getAll("<group>-v")`）：trim；空键 ∥ 空值行不提交；重复键后行胜；全空 ⇒ 字段键缺席（`env` ∥ `headers` 删除——沿现判）。
5. **拆档（先拆后改）**——MCP 族出档 `thincoder-desktop/renderer/mount-settings-segments-mcp.mjs`（已落 · **299** 行；沿 `-models.mjs` / `-providers.mjs` / `-agent.mjs` 先例；缝 = 同形工厂 `create*Exits(deps)`；装配点 `mount-settings-exits.mjs` 装配即合并——单一 `handlers` 表对外零改）；触发 = 本档 §3.1 该行在册预案（「MCP 族再出一档」——本批 = MCP 族结构性触碰）。
6. **计数（D3）**——词键 +4（`settings.mcp.kvAdd` ∥ `.kvRemove` ∥ `.kvKey` ∥ `.kvValue`）∥ 值改 2（`.env` ∥ `.headers`——去「comma-separated」形）；通道 0 新（`mcp:save` ∥ `mcp:update` 载荷形零改——仍 `{name, config}`，env ∥ headers 仍为对象）；store 键 +1（`settings.mcp.form.kv`——表单面态内部形，非切片新族）；新档 1；CSS 0。
7. **判据**——机检 = 批内件 `docs/batches/2026-10-07-mcp-kv-input.test.mjs`（L1 构树 ∥ L2 出口配对四态 ∥ L3 VSC 真 webview ∥ L4 词面源扫）；真机 = 人工走查（设置页 ∥ 弹窗两态：值含逗号 token 存取 ∥ 加删行 ∥ 类型切换保真 ∥ 保存后重开回显逐字同）。

### 2.18 添加入口弹窗统一批注（2026-10-07 · 台账 #1054）

**本批注（MCP 表单 ∥ 会诊添加 ⇒ 弹窗；页脚直开）**：统一判据 = 表单类添加 ⇒ 弹窗（单例 ∥ 五路关：保存（守卫通过才发 + 关）∥ 取消 ∥ 背板 ∥ Esc ∥ `closeSettings()` 同清；开框重置；初始焦点 = 首控件）；单字段就地编辑 ⇒ 行内；首启 ∥ 宿主原生专面 ⇒ 各守其面。决策单源 = 本档 §1 **KD-77**；VSC 面 = `docs/vsc/design/SETTINGS.md` §2.17；明细 = 批档 `docs/batches/2026-10-07-add-dialog-unify.md` §2。

1. **面形（两新组）**——`mcpForm`（MCP 表单模态——新增 ∥ 编辑两态共用；标题逐态 `settings.mcp.addTitle` ∥ `settings.mcp.editTitle`）∥ `consultAdd`（会诊添加模态）。
两卡 = `header.settings-head` + `div.settings-modal-body`（失败串（scope = 本组）+ 段态词恰一 + 体件）；开 ∥ 关 ∥ Esc ∥ 背板 ∥ 初始焦点 = 首控件（`data-initial-focus="field"` 声明——源对齐）∥ 第二闸草稿保真 ∥ z 族 20/21 = 沿 D39 全套；**零新 CSS**。
2. **入口（段体）**——MCP 段体（`views/settings-sections-mcp.mjs`）：行族 + 「+ Add Server」钮（新键 `settings.mcpAdd`——值逐字同 VSC `settings.mcpAdd`；锚 `settings:mcpAddOpen`）；原常驻表单出段体 ⇒ 改由弹窗体分支渲出（导出面 +`mcpFormBody`——`sectionBody("mcpForm")` 复用同件，零第二份）。
会诊：模型段尾「+ Add consult model」钮（词 `settings.consultAdd` 既有；锚 `settings:consultAddOpen`；`consult.length >= 5` ⇒ `disabled`）；原表单块改由弹窗体分支渲出（导出面 +`consultAddBody`）。**MCP 入口钮恒在场（loading 态亦然——读链不遮入口，沿 `providersBody` 先例）**。
3. **开合 ∥ 写径**——mcpForm：开 = `openSettingsModal("mcpForm")`（`resetFacets` 清 `form` ⇒ 新增态——三组行集零行（「零项 ⇒ 零行」同判 ∥ 两端同值））；**编辑态 = 开径后写 `form.editing`（先开后写——`openSettingsModal` 内复位会覆盖先写值）**；
add ∥ update 成功 ⇒ 切片复位（`form: null`）+ `if (store.get().settings?.modal === MCP_FORM_MODAL_GROUP) closeModal()`（沿 KD-75 ⑥）；取消（两态同名钮 `settings:mcpCancel`——**新增态补钮**）= 关弹窗。
consultAdd：开 = `openSettingsModal("consultAdd")`（`resetFacets` 复位 `models.picker`——`provider: ""` ∥ `rows: []` ∥ `model: null`）；`consultAdd` 成功 ⇒ `closeModal()`；**取消 = 钮（词 `settings.cancel`；锚 `settings:consultCancel`——与 `mcpForm` 同形）= 关弹窗（切片复位随关）**。**关（`closeSettingsModal`）** = 切片清 + 本组面态复位（两新组同径）。
4. **页脚直开（本端）**——`composer-wire.mjs` `case "addProvider"` ⇒ `openSettings?.(ADD_MODAL_GROUP)`（`ADD_MODAL_GROUP` 自 `thincoder-desktop/renderer/views/settings.mjs` 引——单源）；
`app.mjs` 双口提升 `openSettings(group?)` 同供 `menuActions` + `attachComposer`（现 `:68` 单口 ⇒ 双口——沿 `:76` 同形）；`mount-composer.mjs` 两处 dep 转口（`:160` ∥ `:196`）。`removeProvider` ∥ `setKey` 两映射零改（设置面事）。
5. **段态词恰一（同笔收正）**——`thincoder-desktop/renderer/views/settings.mjs` `settingsModalTree` 现对非 add 组叠渲段态词（段体自带一件 + 支内再供一件）⇒ 去叠渲件（修前设计轮实测：`env` 组 loading = 2 节点 ∥ `providerAdd` = 1）。
6. **计数（D3）**——词键 +4（`settings.mcpAdd` ∥ `settings.mcp.addTitle` ∥ `settings.mcp.editTitle`（i18n-settings.mjs）∥ `settings.consultAddTitle`（i18n-views.mjs）——两语）；弹窗值集 **八 ⇒ 十**（+`mcpForm` ∥ `consultAdd`——`SCOPES` 派生随动）；
`MODAL_READS` 八组 ⇒ 十组（+2 行）；`store.mjs` 闭集注释 八值 ⇒ 十值（注释级）；通道 0 新（`mcp:save` ∥ `mcp:update` ∥ `settings:agent` 载荷形零改）；新档 0；CSS 0。
7. **判据**——机检 = 批内件 `docs/batches/2026-10-07-add-dialog-unify-desktop.test.mjs`（**已落 · 5/5**——树面：两新组卡 ∥ 段体零表单 + 两入口钮 ∥ 焦点声明；出口面：入口 ⇒ `openSettingsModal` 两值 ∥ 成功径 ⇒ `closeModal` ∥ 取消 ⇒ 关框；页脚：`addProvider` ⇒ `openSettings(ADD_MODAL_GROUP)`；词面：四新键两语在场）；
真机 = 人工走查（MCP 新增 ∥ 编辑两态：五路关 ∥ 开框重置 ∥ 拒径不关框 ∥ 提交成功后列表随动；会诊：入口满 5 禁用 ∥ 提交成功关框；页脚直开）。
8. **边界**——MCP 字段集 ∥ 型组 ∥ kv 行式机制 ∥ 探测 / 重连语义零改；会诊行渲染 ∥ effort 档 ∥ advisor 面零改；七段值面其余语义 ∥ 现有页 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触。

### 2.19 段出口密钥现读宿主无关化（2026-10-08 · 台账 #1052）

**来源** = 残渣清扫批复核（病征确认——组弹窗体宿主经菜单径可达：`src/main/app-menu.mjs:36` 六名 ⇒ `openSettingsModal` ⇒ 段体入卡（`thincoder-desktop/renderer/views/settings.mjs:378`））。
**病征**：`keySave` ∥ `saveProviderKey`（含 `cancelKeyEdit`）按槽作用域现读 ⇒ 组弹窗内改钥保存取不到件（或取到页槽空件）⇒ 空值零发送 = 死保存。
**修 = 宿主无关现读**（文档序末位 = 交互面——沿 `mcpFormNode` 先例；`keySave` `renderer/mount-settings-segments.mjs:102` ∥ `saveProviderKey` ∥ `cancelKeyEdit` `renderer/mount-settings-segments-providers.mjs:61 ∥ :52`）。
**边界**：`verifyChannel` 无名径 `presetValue(slot)`（`renderer/mount-settings-exits.mjs:124`）= 向导占槽径（槽内表单即正确宿主）——保持。**判据** = 批内件 `docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`（两组弹窗径 + 页槽径回归 + **源面锁**）。
**源面锁（判据第三腿 · 定义）**：扫描域 = 本修两件（`renderer/mount-settings-segments.mjs` ∥ `renderer/mount-settings-segments-providers.mjs`）；判据形状 = ① 负向——槽作用域现读形（选择器模板串含 `${slot}` 插值）零残留；② 正向——`document.querySelectorAll` 末位取件形在每个现读点在场；③ 三读点逐点断言（`keySave` ∥ `saveProviderKey` ∥ `cancelKeyEdit`）。
**同族出口覆盖（点名 + 结论）**：现读点全集 = 上述三件（扫描域内）；**删钥径**（`keyDelete` `renderer/mount-settings-segments.mjs:133` ∥ `deleteProviderKey` `renderer/mount-settings-segments-providers.mjs:95`）= 零 DOM 现读（按名发送）⇒ **非同面 · 零改**；其余出口无槽作用域现读（`fetchModels` = `FormData(formOf(event))` 直读——宿主无关形）；向导占槽径 = 上句边界保持。

**受影响文件（本批 · #1052 ∥ #1058 ∥ #1059 · 现行（设计轮）⇒ 实读（实施落盘）· 内容行数口径（文末换行不计））**：

| # | 文件 | 现行（设计轮） | 实读（实施落盘） | 面 |
|---|---|---|---|---|
| 1 | `thincoder-desktop/renderer/mount-settings-segments.mjs` | **164** | **164**（±0——现读改 + `slot` 依赖净删） | #1052 |
| 2 | `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | **160** | **162**（+2——两读点改 + `slot` 依赖净删） | #1052 |
| 3 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **307** | **307**（±0——两注入键删；`presetValue(slot)` 保持） | #1052 |
| 4 | `thincoder-vscode/webview/settings-models.js` | **214** | **217**（+3——委托替换逐行绑定） | #1058 |
| 5 | `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（批内件） | **522** | **529**（+7——两腿重写 + 两轮注 + 跑法行收正；重锚落讫） | #1059 |
| 6 | `docs/batches/2026-10-08-residue-sweep.test.mjs`（批内件 · 新） | **0** | **109**（新档） | #1058 |
| 7 | `docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`（批内件 · 新） | **0** | **387**（新档——假 DOM 脚手架随件自携；≤500 ✓） | #1052 |

全量（含设计档自身行账）= 批档 `docs/batches/2026-10-08-residue-sweep.md` §2.6；本表行数 = 实施落盘实读（2026-10-08——届盘回填）。

### 2.20 `env.proxy` 两键形批注（#1090 · 2026-10-10 · purge-residue-sweep 批）

**来源** = 残渣清扫批 `#1090`（`model` 键随 2026-10-09 清除批退场 ⇒ 「三键形」残渣清）；批档 = `docs/batches/2026-10-10-purge-residue-sweep.md` §2；单源 = `docs/core/design/PROXY.md` §4（代理面语义 ∥ 写径）+ `docs/desktop/design/IPC.md` §2 `settings:env` 行（投影）。
**面**：`env.proxy` 形 = **两键**（`{ uri, web }`）——三面同拍：
1. **种子**：`thincoder-desktop/renderer/store.mjs`—— `env.proxy` 切片种子 = `{ uri: "", web: true }`（`model` 键零残）。
2. **投影**：`thincoder-desktop/renderer/views/settings.mjs`——投影两键（`model` 键零残）；`env` 段体 `settings-sections-env.mjs`（proxy ∥ shell 两子节）形面零改。
3. **写径归一**：`thincoder-cli/src/tui/cmd-config.mjs`——`seturi` **写即归一**（两键重建 `{ uri: newUri, web }`——不再「原样保留」⇒ 残键随写清零）；`toggleweb` 径照旧（归一态两键）；**两径读回同形**。
**判据**（AC-1090/1–5）：① 种子两键 ② 投影行零命中 ③ `cmd-config` 两写径读回同形（残键清零）④ M604 夹具零 `model` 字面 ⑤ 批内件 T8 覆盖 `store` / `views` 两档（零残断言在场——实跑绿）。
**边界**：proxy 语义 ∥ 通道 ∥ 载荷 ∥ 白名单零改（形面只涉「未配置投影」与「写径归一」两处）；`env.proxy.model` 键本身随 2026-10-09 清除批退场（批 `docs/batches/2026-10-09-provider-default-model-purge.md`）——本批 = 残留面清。

## 3. 文件账（本域）

### 3.1 本端文件清单与行数预算（设置族行 · 迁自 `PROJECT.md` §4.1——逐字）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/src/main/settings.mjs` | **297**（实读 2026-10-09——清除批实施落盘（300 ⇒ 297；行数账回填）；前读 **300**（实读 2026-10-04——渠道档位退役批实施落盘（331 ⇒ 300——`tierAgent` ∥ `VANISHED` ∥ `hasTier` 支净删 + 载荷顶层有效键闭集收窄；**回线 ✓**）；前读 **331**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（325 ⇒ 331——`settings:agent` 两写径成功回执携 `providerState`（写后核读——第三刷新点主侧半））；前读 **325**（实读 2026-10-02——桌面 UX 收尾批（#697）实施落盘（320 ⇒ 325——`indexStatus()` 回执 +2 键透传（`dbBytes` ∥ `origins`）；**≤500 ✓（500/800 口径更换批）**）；前读 **320**（实读 2026-09-29——desktop-residuals-round3 波 C（S14a 随迁）后））） | 设置写面（`config:write`——键白名单仅 `locale`）+ 模型面（`model:list`——**批 B 补逐模型元素投影 `{ id, effortEnum, thinkOff }`**：主进程引核 `specForModel(model).reasoningEffortEnum` / `thinkOffPath(spec)` = 零副本，KD-18；**模型菜单全渠批**：`modelCatalog()` 全渠扇出处理体（`hasKeyOf` 渠滤 + `Promise.allSettled` 逐渠核探针 + `unavailable` 诊断项）+ `modelList` 探针径对齐（U1——过代理 ∕ 落账；回执行逐字零变）；单源 = `docs/desktop/design/IPC.md` §2「模型清单注」）+ agent 参数面板（`settings:agent`）——三面共用核 `loadConfig` / `writeConfigAtomic`（零自写盘）；**parity-b10**：patch 清除面（`null` ⇒ 删键）· slot 权威键拒（`slot-authority`）· advisor 档 helper 单源（`applyAdvisorEffort`）；**本批（#697 · 2026-10-02）**：`indexStatus()` 回执透传 `dbBytes` ∥ `origins`（核只读出口——端侧零 SQL） |
| `thincoder-desktop/src/main/providers.mjs` | **302**（实读 2026-10-09——清除批实施落盘（324 ⇒ 302；行数账回填）；前读 **324**（实读 2026-10-08——届盘实读收正（表载 317 ⇒ 324；文档卫生批行数面回填）；前读 **317**（实读 2026-10-04——渠道档位退役批实施落盘（339 ⇒ 317——`effortOf` 整件 ∥ 行 `effort` ∥ 四引用离导入面；**≤500 ✓（500/800 口径更换批）**）；前读 **339**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（335 ⇒ 339——`provider:save` 成功回执携 `providerState`（第三刷新点主侧半））；前读 **335**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（315 ⇒ 335——B① 保存补写支 + `backfillDefaultModel`（仅缺失 ∥ 既有非空零覆盖 ∥ 排他 `active:true`））；**≤500 ✓（500/800 口径更换批）**；前读 **315**（实读 2026-09-29——口子清零二轮（S3 `failure` 键贯链）后））） | provider 族**八通道**（`provider:list` / `save` / `remove` / `verify` + **parity-b10 S1 ∕ S2 ∥ S5 四增**：`setKey` / `delKey` / `models` / `setProxy`——值面住核，端侧零形状构造；S3 写后探单点）；**本批（#840 · 2026-10-03）**：`provider:save` 补写支（`defaultModel` 仅缺失——批档 §2 KD-5） |
| `thincoder-desktop/src/main/mcp-servers.mjs` | **262**（实读 2026-09-29 · W6 届盘复读——parity-b10 W3 两增 + R7 `mcp:tools`） | MCP 族**六通道**（`mcp:list` / `save` / `remove` / `tools` + **parity-b10 S8 ∕ S9 两增**：`update`（原位替换——仅落盘） ∕ `reconnect`（先断后连）——探活失败 ⇒ 零写盘） |
| `thincoder-desktop/src/main/settings-values.mjs`（R7 拆档产出） | **106**（实读 2026-10-04——渠道档位退役批实施落盘（118 ⇒ 106——`deepEqual` 随净删）；前读 **118**（实读 2026-09-29——desktop-residuals-round3 波 C（S14a 随迁 ∕ `slotAuthority` 五键）后） | 设置族值面 ∕ 遮罩族（`MASK = MASKED`（**核单源**——S13 import 核 `thincoder-core/agent-tools/settings.mjs`）∕ 叶展平 ∕ 点分路径写——自 `settings.mjs` 拆出） |
| `thincoder-desktop/src/main/config-watch.mjs`（R8 落子壳） | **41**（实读 2026-09-29） | config.json 外部写盘感知落子壳（事件源；去抖 ∕ 自写抑制在核件） |
| `thincoder-desktop/src/main/index-status.mjs`（R2 新档） | **72**（实读 2026-10-02——桌面 UX 收尾批（#697）实施落盘（67 ⇒ 72——`readIndexCounts` 回执扩 `dbBytes` ∥ `origins`（KD-69——核出口透传，端侧零 SQL））；前读 67（实读 2026-09-29——R2 落形后）） | 语义索引面处理体（`index:build` ∕ `index:status` 两通道）；**#697**：`readIndexCounts` 透传 `dbBytes` ∥ `origins`（KD-69） |
| `thincoder-desktop/src/main/settings-env.mjs`（R7 拆档产出） | **93**（实读 2026-10-08——届盘实读收正（表载 95 ⇒ 93；行数账回填）；前读 **95**（实读 2026-09-29 · W6 届盘复读——parity-b10 S17 候选面出档净减 −43）） | 主侧 env 族处理体（`settings:env` 读 ∕ 写 ∕ TestProxy 三支——写经核 `writeConfigAtomic`；**S17**：shell 候选 = 核单源 `thincoder-core/shell-candidates.mjs` 薄壳 re-export） |
| `thincoder-desktop/src/main/settings-tools.mjs`（R7 拆档产出） | **79**（实读 2026-09-29） | 主侧 tools 族处理体（`settings:tools` 读 ∕ 写两支——密钥值零下发） |
| `thincoder-desktop/renderer/views/settings.mjs` | **436**（实读 2026-10-10——purge-residue-sweep 批（#1090）实施落盘（437 ⇒ 436——投影行删）；前读 **437**（实读 2026-10-09——清除批实施落盘（439 ⇒ 437；行数账回填）；前读 **439**（实读 2026-10-08——届盘实读收正（表载 419 ⇒ 439；文档卫生批行数面回填）；前读 **419**（实读 2026-10-07——三端对齐批（2026-10-07）实施落盘（398 ⇒ 419——Δ 实读 +21））；前读 **398**（实读 2026-10-04——渠道档位退役批实施落盘（399 ⇒ 398——`tierFace` 导入 ∥ `tier:` 装配键净删）；前读 **399**（实读 2026-10-04——issue 修复批·五 实施落盘（398 ⇒ 399——#842 投影带渠穿透：`{ id, provider }` 保留）；前读 **398**（实读 2026-10-02——设置体系升级批（#817）实施落盘（364 ⇒ 398：+`settingsModalTree` 单组树导出——组合既有私有面、零既有结构变更；**触属性复核（#817 收口 · 父侧裁）= 非结构性维持** ⇒ 拆档评估不触发）；前读 **364**（实读 2026-10-01——复核扫面收正批实施后（365 ⇒ 364——M7 悬引收正）；更前实读 2026-10-01——主题切换批实施后（336 ⇒ 365：面头三态钮族 + `themeNode`）；前读 336（实读 2026-09-29——desktop-residuals-round3 波 C（#615②）后）；**≤500 ⇒ 免拆（500/800 口径更换批）**）） | 设置面七段（段体族住 `thincoder-desktop/renderer/views/settings-sections*.mjs`；**批 B**：模型候选消费随 `model:list` 元素形——逐项 `.id`，随动一行；**parity-b10**：控件族 ∕ 空态 ∕ 确认门 ∕ 拒码词键——形单源 = `docs/desktop/design/UI.md` §1「本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）」） |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | **96**（实读 2026-10-08——届盘实读收正（表载 95 ⇒ 96；文档卫生批行数面回填）；前读 **95**（实读 2026-10-07——三端对齐批（#1027–#1035）实施落盘（93 ⇒ 95——`providerAddBody` re-export）；前读 **93**（实读 2026-10-04——渠道档位退役批实施落盘（169 ⇒ 93——五件净删 `EFFORT_NONE` ∥ `tierFace` ∥ `tierOptions` ∥ `acceptTier` ∥ `tierRowNode` + `modelBody` 收两段）；前读 **169**（实读 2026-10-04——issue 修复批·五 实施落盘（164 ⇒ 169——#842 `modelChoicesTree` / `modelRowNode` 带渠行（行自带渠优先 · 显示 `provider · id` · 采用 `onUseModel(provider,id)`））；前读 **164**（实读 2026-10-02——D37 实施落盘（309 ⇒ 164：渠道族出档（先拆后改）——re-export 面零改；越 300 消解——回线 ✓）；前读 **309**（实读 2026-09-29——口子清零二轮（S3 行标分档渲染）后））） | 设置面段体面（渠道 / 模型 / MCP 三体 + 四出档段体 re-export——自 `thincoder-desktop/renderer/views/settings.mjs` 拆出〔批 9 拆分落形 · 300 行层 · 零语义变化〕；导出 `modelHeadNode` / `modelChoicesTree` 供首启向导第二步复用（单一 owner）——零 import 反向〔无环〕） |
| `thincoder-desktop/renderer/views/settings-agent.mjs`（R8 拆档产出） | **188**（实读 2026-10-04——泛化编辑器退役批实施落盘（230 ⇒ 188——泛化兜底行整件净删：`agentFieldNode` ∥ 段末保存钮；`agentBody` 收「具名唯出」）；前读 **230**（实读 2026-09-29——desktop-residuals-round3 波 C（#617-CH 只读行）后）） | 设置面 agent 段体（具名控件表 `NAMED_FIELDS` + `agentBody`——**纯具名**（泛化编辑器全消——#635① · 2026-10-04：桌面同 VSC）；**parity-b10**：子代理模型槽六件 ∕ advisor 档枚举 ∕ guard 开关） |
| `thincoder-desktop/renderer/views/settings-controls.mjs`（R7 拆档产出） | **188**（实读 2026-10-09——清除批向导死控退场收尾（198 ⇒ 188）；前读 **198**（实读 2026-10-09——清除批实施落盘（215 ⇒ 198；行数账回填）；前读 **215**（实读 2026-10-07——三端对齐批（#1027–#1035）实施落盘（145 ⇒ 215——单表节点序 ∥ `data-initial-focus` ∥ 条件渲染五件）；前读 **145**（实读 2026-10-02——轻通道轮六 校验控件态参（137 ⇒ 145：`state` 三态 ∥ 短形词两键 ∥ `data-verify-state` 锚）；前读 **137**（实读 2026-09-29——桌面收尾批（#652 两形 `data-draft-scope` 作用域取值面）后；parity-b10 W2 S2 ∕ S7（+47）＋ RF 波 1 后）） | 设置面两导出面（`channelFormTree` ∕ `verifyControl`——渠道段与向导第二步共用单 owner；**parity-b10**：拉取模型控件 ∕ 预设标签形） |
| `thincoder-desktop/renderer/views/settings-sections-env.mjs`（R7 拆档产出） | **129**（实读 2026-10-08——届盘实读收正（表载 137 ⇒ 129；行数账回填）；前读 **137**（实读 2026-09-30——桌面残债批 #679 作用域面（`env:shell`）后；Δ0）） | 设置面 Environment 段体（proxy ∕ shell 两子节 + TestConnection） |
| `thincoder-desktop/renderer/views/settings-sections-mcp.mjs`（R7 拆档产出） | **261**（实读 2026-10-08——届盘实读收正（表载 241 ⇒ 261；文档卫生批行数面回填）；前读 **241**（实读 2026-10-07——MCP 键值行式输入批（#1036）实施落盘（185 ⇒ 241——kv 行构树 ∥ 加删钮 ∥ 三组渲染；原估 ≈250）；前读 **185**（实读 2026-10-02——D37 实施落盘（183 ⇒ 185：摘要省略标记 ∥ 工具行竖排注））） | 设置面 MCP 段体（行 + Tools ∕ Test 两展开面 + **parity-b10**：编辑 ∕ 重连钮与结构化三型表单；**#1036**：env ∥ headers = 行式键值行件——§2.17） |
| `thincoder-desktop/renderer/views/settings-sections-models.mjs`（R7 拆档产出） | **186**（实读 2026-10-08——届盘实读收正（表载 164 ⇒ 186；文档卫生批行数面回填）；前读 **164**（实读 2026-09-29） | 设置面 Consultation & Advisor 段体（consult 行族 ≤5 + advisor 两 picker） |
| `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（D37 拆档产出 · 已落） | **已落 · 210**（实读 2026-10-09——清除批实施落盘（211 ⇒ 210；行数账回填）；前读 **211**（实读 2026-10-07——三端对齐批（#1027–#1035）实施落盘（194 ⇒ 211——段体 = 行族 + 校验回退 + 添加钮、原双表单退场）；前读 **194**（实读 2026-10-02——轻通道轮六 校验反馈就地化（182 ⇒ 194：档头 ③ 注 ∥ `fallbackVerifyNode` 段末回退 ∥ 本行态 + 本行明细行）；前读 **182**（实施落盘——2026-10-02 实读；渠道段体 + 两行卡重构：行族 ∥ 动作簇 ∥ 编辑态 ∥ 第三行）） | 设置面渠道段体（`providersBody` + 行族：两行卡 ∥ 动作簇 ∥ 编辑态 ∥ 第三行——自 `thincoder-desktop/renderer/views/settings-sections.mjs` 出档；决策单源 = 本档 §1 **KD-66**） |
| `thincoder-desktop/renderer/views/settings-sections-tools.mjs`（R2 拆档产出） | **208**（实读 2026-10-02——桌面 UX 收尾批（#697）实施落盘（163 ⇒ 208——两读行（库大小 ∥ 逐 origin 行数——`data-index="db"` ∥ `"origin"`））；前读 **163**（实读 2026-09-30——桌面残债批 #679 作用域面（`tools:<kind>`）后；Δ0）） | 设置面「工具与服务」段体（embedding ∕ websearch 键行 + 索引状态行 + **S12** index 空态（`no-key`））；**#697**：索引状态行增两读（库大小 ∥ 逐 origin 行数——缺位 ⇒ 零节点） |
| `thincoder-desktop/renderer/views/onboarding.mjs` | **161**（实读 2026-10-09——清除批向导死控退场收尾（162 ⇒ 161）；前读 **162**（实读 2026-10-09——清除批实施落盘（161 ⇒ 162；行数账回填）；前读 **161**） | 首启向导（无终端可完成；闸 = `config:read` 回执 `configured`（配置档存在性）——形态单源 = `docs/desktop/design/UI.md` §1 首启向导行） |
| `thincoder-desktop/renderer/mount-settings.mjs` | **264**（实读 2026-10-08——届盘实读收正（表载 259 ⇒ 264；文档卫生批行数面回填）；前读 **259**（实读 2026-10-07——三端对齐批（#1027–#1035）实施落盘（251 ⇒ 259——`SCOPES` 八名闭集（含 `ADD_MODAL_GROUP`）∥ `MODAL_READS` 八组）；前读 **251**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（249 ⇒ 251——B③ `createWizard` 注入 `useModel`——同一引用））；前读 **249**（实读 2026-10-02——设置体系升级批（#817）实施落盘（181 ⇒ 249：弹窗第二闸（捕获 ∕ 重建 ∕ 复填 + `modalResidue`）+ 开 ∕ 关装配 + 本组复位复用 + face 返回 + 读链扩 + `refreshSettings` 在场判据扩））；前读 **181**（实读 2026-10-02——菜单体系批实施落盘（179 ⇒ 181）；前读 **179**（实读 2026-10-01——复核扫面收正批实施后（184 ⇒ 179——M7 链删））；更前实读 2026-09-29——桌面收尾批（#652 失效集注入 ∕ 捕获后过滤）后；模型菜单全渠批 ＋ RF 波 1（#604）后；R8 三族出档；在册例外消解） | 设置面 / 向导接线出档（自 `app.mjs` 拆出——批 9 拆分落形；通道接线与表单装配，视图构树住 `thincoder-desktop/renderer/views/settings.mjs` / `thincoder-desktop/renderer/views/onboarding.mjs`；读数供给 ∕ 出口 ∕ 段出口三族另档 = 下行四行；**模型菜单全渠批**：`onProvidersChanged` 注入转口） |
| `thincoder-desktop/renderer/mount-settings-reads.mjs`（R8 拆档产出） | **210**（实读 2026-10-10——purge-residue-sweep 批（#1126）实施落盘（211 ⇒ 210——`defaultModel` 写点键删）；前读 **211**（实读 2026-10-09——清除批实施落盘（206 ⇒ 211；行数账回填）；前读 **206**（实读 2026-10-08——届盘实读收正（表载 204 ⇒ 206；文档卫生批行数面回填）；前读 **204**（实读 2026-10-04——渠道档位退役批实施落盘（注释两处随正；Δ0）；前读 **204**（实读 2026-10-04——issue 修复批·五 实施落盘（192 ⇒ 204——`loadModels` 缺渠 ⇒ `model:catalog` 全渠扇出）；前读 **192**（实读 2026-09-30——桌面残债批 #671 读面三写并持后；前读 189）） | 设置面七段读数供给族（各段 load 面 + 激活渠道投影）——**parity-b10 零改**（S10 候选改由 `model:list` 切片派生——设计 +≤8 预算未用） |
| `thincoder-desktop/renderer/mount-settings-exits.mjs`（R8 拆档产出） | **310**（实读 2026-10-09——清除批实施落盘（307 ⇒ 310；行数账回填）；前读 **307**（实读 2026-10-08——届盘实读收正（表载 289 ⇒ 307；文档卫生批行数面回填）；前读 **289**（实读 2026-10-07——MCP 键值行式输入批（#1036）实施落盘（254 ⇒ 289——装配点：import ∥ 工厂调用 ∥ 合并展开；原估 ≈258）；前读 **254**＝实读 2026-10-04——渠道档位退役批实施落盘（270 ⇒ 254——`setTier` 块 ∥ `onTier` 接线净删）；前读 **270**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（264 ⇒ 270——设置写回执 `providerState` 落切片（设置面写出口族——第三刷新点渲染侧半））；前读 **264**（实读 2026-10-02——轻通道轮六 内容随动（`verify` 结果携 `name: target` 两处——零增行：264 ⇒ 264）；前读 **264**（实读 2026-10-02——设置体系升级批（#817）实施落盘（248 ⇒ 264：F-Esc 闸 `modal != null` 守卫 + `closeSettings` 同清 `modal` + 本组复位复用））；更前 **248**（实读 2026-10-02——菜单体系批实施落盘（242 ⇒ 248）；前读 **242**（实读 2026-10-01——复核扫面收正批实施后（238 ⇒ 242——M2 专件同清））；更前实读 2026-10-01——复查回填（机检对比；原表 227）；前史：桌面残债批 #679 `invalidateDrafts` 注入补传后；Δ0（≡ `PROJECT.md` §2.11#5 复核值）；前史：桌面收尾批（#652 `invalidateDrafts` 注入 ∕ 两形提交成功径声明）后；W6 届盘复读 = parity-b10 W2：S1 ∕ S2 ∕ S5 渠道段出口按族出档净减 −76））） | 设置面出口族 + 写路辅助（形式取值 ∕ Esc 关闭绑定；**模型菜单全渠批**：deps 解构 + 两写成功点调用——`provider:save` ∕ `provider:remove` ⇒ `onProvidersChanged`；**parity-b10**：渠道段出口出行——见 `mount-settings-segments-providers.mjs`） |
| `thincoder-desktop/renderer/mount-settings-segments-mcp.mjs`（MCP 键值行式输入批（#1036）拆档产出 · 已落） | **已落 · 327**（实读 2026-10-08——届盘实读收正（表载 299 ⇒ 327；文档卫生批行数面回填）；前读 **299**（实读 2026-10-07——实施落盘：MCP 族出口搬移 + kv 令牌件与配对；原估 ≈240） | 设置面 MCP 段出口族（增 ∕ 改 ∥ 编辑 ∥ 类型切换 ∥ 移除 ∥ 工具 ∥ 探活 ∥ 重连 + **kv 行令牌两出口**——自 `mount-settings-segments.mjs` 出档；缝 = 同形工厂 `create*Exits(deps)`；装配点 `mount-settings-exits.mjs` 装配即合并——单一 `handlers` 表对外零改） |
| `thincoder-desktop/renderer/mount-settings-segments.mjs`（R7 拆档产出） | **164**（实读 2026-10-07——MCP 键值行式输入批（#1036）实施落盘（364 ⇒ 164——MCP 族出档；**越 300 在册预案触发 ⇒ 本批执行**（先拆后改）；**回线 ✓** ⇒ 越层除名；原估 ≈195）；前读 **364**（实读 2026-09-30——桌面残债批 #679 三径声明后；更前 356（W6 届盘复读））） | 设置面段出口族（env ∥ 工具与服务；**#1036**：MCP 族出档 `mount-settings-segments-mcp.mjs`） |
| `thincoder-desktop/renderer/mount-settings-segments-models.mjs`（R7 拆档产出） | **192**（实读 2026-10-08——届盘实读收正（表载 169 ⇒ 192；文档卫生批行数面回填）；前读 **169**（实读 2026-09-29） | 设置面 models 段出口族（consult ∕ advisor 八出口） |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs`（parity-b10 W2 拆出档） | **161**（实读 2026-10-09——清除批实施落盘（162 ⇒ 161；行数账回填）；前读 **162**（实读 2026-10-08——届盘实读收正（表载 160 ⇒ 162；行数账回填）；前读 **160**（实读 2026-10-07——三端对齐批（#1027–#1035）实施落盘（150 ⇒ 160））；前读 **150**（实读 2026-10-01——复核扫面收正批实施后（147 ⇒ 150——M2 注）；更前实读 2026-09-29——桌面收尾批（#652 钥存 ∕ 取消径 ∕ 两形提交成功径声明）后；desktop-residuals-round3 波 C（#615②）后） | 设置面渠道段出口族（S1 ∕ S2 ∕ S5 六出口——自 `mount-settings-exits.mjs` 按族续拆，债注③预案落形；**桌面收尾批**：两形提交 ∕ 钥存 ∕ 取消径三处声明缝） |
| `thincoder-desktop/renderer/mount-settings-segments-agent.mjs`（parity-b10 W3 拆出档） | **98**（实读 2026-10-04——泛化编辑器退役批实施落盘（156 ⇒ 98——五件净删：`currentFields` ∥ `rowValue` ∥ `agentPatch` ∥ `saveAgent` ∥ `onSaveAgent`；`listOf` 保留 = 父裁（`applyNamedField` 消费面）；`handlers` 键集 = 恰 `{onNamedField, onToggleGuard}`）；前读 **156**（实读 2026-09-29）） | 设置面 agent 段出口族（S10 ∕ S11 ∕ S14b 出口与单键 patch 写路——**即改即存**（零保存键：泛化批净删；写面 = `namedOut` 单键 patch）） |
| `thincoder-desktop/renderer/settings-confirm.mjs`（parity-b10 W2 新档 · S6） | **80**（实读 2026-09-29） | 设置面删除确认件（不可复得类四门前置确认——`.auto-confirm` 族复用 · 零新 CSS；`onConfirm` = 开框时捕获闭包；形对位 VSC `settings-widgets.js:77-105`） |
| `thincoder-desktop/renderer/settings-modal.mjs`（设置体系升级批（#817）新档 · 已落） | **已落 · 70**（实读 2026-10-07——三端对齐批（#1027–#1035）实施落盘（63 ⇒ 70——`data-initial-focus="field"` 例外 ∥ 焦点判据）；前读 **63**（实施落盘——2026-10-02 实读；单例弹层宿主——建 ∕ 刷 ∕ 关三件 + 树面 re-export（单源 = `thincoder-desktop/renderer/views/settings.mjs` `settingsModalTree`）） | 设置组弹窗宿主（背板 z-20 ∥ 居中卡 z-21；挂 `document.body`——沿 `settings-confirm.mjs` 先例；决策单源 = 本档 §1 **KD-68**） |
| `thincoder-desktop/renderer/settings-modal.css`（设置体系升级批（#817）新档 · 已落） | **已落 · 51**（实读 2026-10-10——desktop-behavior-residues 批（#1039）实施落盘（49 ⇒ 51——a11y `scroll-padding-top`：+2 = 声明 + 注）；前读 **49**（实读 2026-10-02——轻通道轮六 头行粘顶（41 ⇒ 49：sticky ∥ `top: 0` ∥ `z 1` ∥ 底 `--bg-raised`）；前读 **41**（实施落盘——2026-10-02 实读；背板 ∥ 居中卡 ∥ 卡体 ∥ 体列；零新变量 ∥ 零新断点））） | 设置组弹窗样式（不进 `settings.css`——在册越线档零触） |
| `thincoder-desktop/renderer/mount-onboarding.mjs`（批 B · ⑥ 拆档） | **96**（实读 2026-10-07——三端对齐批（#1027–#1035）实施落盘（95 ⇒ 96——`presetValue` 选择器随单表改名）；前读 **95**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（89 ⇒ 95——B③ 模型步「采用」接线（`useModel` 注入消费——缺 ⇒ 不落键）+ 注））；前读 **89**（实读 2026-10-01——复核扫面收正批实施后（90 ⇒ 89——M7 步 3 删）；更前实读 2026-09-30——#667 批后；批 B 末实读 88 ⇒ 90——判据两处 + 头注锚） | 向导接线族（自 `thincoder-desktop/renderer/mount-settings.mjs` 拆出——`presetValue` / `pickDir` / `nextStep` / `finishWizard` / `wizardHandlers`；共享项 `submitChannel` / `verifyChannel` / `loadModels` 留原档 ⇒ deps 注入）；通道面 = `docs/desktop/design/IPC.md` §2 设置族注；形态单源 = `docs/desktop/design/UI.md` §1 首启向导行 |
| `thincoder-desktop/renderer/settings.css` | **306**（实读 2026-10-10——desktop-behavior-residues 批（#1039）实施落盘（304 ⇒ 306——a11y `scroll-padding-top`：+2 = 声明 + 注；**越 300 咨询线在册** ∥ ≤500 ✓）；前读 **304**（实读 2026-10-09——stale-fixes 批（#1044）实施落盘（303 ⇒ 304——档头「越 300 在册」自携句回位 +1；≤500 ✓）；前读 **303**（实读 2026-10-07——头行粘顶批（#1030 · 轻通道）实施落盘（296 ⇒ 303——页 ∥ 向导头行粘顶：+7 = 注释 3 + 声明 4；**≤500 ✓（500/800 口径更换批）**）；前读 **296**（实读 2026-10-04——泛化编辑器退役批实施落盘（304 ⇒ 296：死类族净删 + 档头「越 300 在册」自携句随消））；前读 **304**（实读 2026-10-02——D37 实施落盘（268 ⇒ 304））））） | 设置面板 / 向导样式（分档理由 = `styles.css` 实读 284 贴 300 层——沿 `chat.css` / `pool.css` 先例）；**主题钮族（D33）带上**——次级键族成员（计数镜随 #713 收口以 `docs/desktop/design/UI.md` §1 为单源） |

**行数面机检**：`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`，运行根单读）**逐条声明节域——本表为其一**（本域值行单源）；后续本域新档由落盘批在本表补值行，`docs/desktop/design/PROJECT.md` §4.1 同拍补指针行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

### 3.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字；块内「本档」类回指已按新落点改指）

**本批（模型菜单全渠批 · 2026-09-29）行「实读落值」**（实读 2026-09-29——内容行数口径；机制 ∕ 判据单源 = 本档 §1 **KD-44–KD-46** · `docs/desktop/design/IPC.md` §2「模型清单注」 · `docs/desktop/design/UI.md` §1 输入区行；批档 = `docs/batches/2026-09-29-model-menu-parity.md` §2）：

| 文件 | 实读落值（构成） | 批 |
|---|---|---|
| W1 四件套：`thincoder-desktop/src/main/settings.mjs` ∕ `ipc.mjs` ∕ `ipc-registry.mjs` ∕ `thincoder-desktop/src/preload/preload.cjs` | **257** ∕ **303** ∕ **79** ∕ **72**（实读 2026-09-29——222 ⇒ 257〔`modelCatalog()` 全渠扇出 + `modelList` 探针径对齐 U1；回执行零变〕· 298 ⇒ 303〔转口 + 头注——**越 300** ⇒ 越层在册 + 预案 = 在册「按面拆分」句〕· 77 ⇒ 79〔import 列 + `HANDLERS` 行 + 表头「三十九」〕· 70 ⇒ 72〔`CHANNELS` 末位 +1 = **39 项**〕） | 模型菜单全渠批 |
| W2 六档：`thincoder-desktop/renderer/composer-sync.mjs` ∕ `store.mjs` ∕ `mount-composer.mjs` ∕ `mount-settings.mjs` ∕ `mount-settings-exits.mjs` ∕ `app.mjs` | **282** ∕ **298** ∕ **244** ∕ **153** ∕ **276** ∕ **271**（实读 2026-09-29——188 ⇒ 282〔候选面重写：六径 + 重探链 + 缓存 + 签名；**设计估 ≈243——实增逐项可追**〕· ±0〔切片 `{ models, unavailable }` 形收正——**贴 300 层回线内 = 本批即其消解窗口**〕· 243 ⇒ 244〔`refreshCandidates` 透传〕· 151 ⇒ 153〔`onProvidersChanged` 转口〕· 274 ⇒ 276〔两写成功点调用〕· 269 ⇒ 271〔`onConfig` 增线 + deps 增键——复制面对齐批落值口径〕） | 模型菜单全渠批 |
| 测试面 | 单元测试档 `docs/batches/2026-09-29-model-menu-parity.test.mjs`（**300** 行 · 9 用例——handler 面（真核探针径 + 本地回环 HTTP 桩）· 通道四件套结构机检 · store 纯动作 · 六径 + 尾随一轮 + 三态；随批留存 · 不入仓套件〔全清令〕；复跑 = `node --test docs/batches/2026-09-29-model-menu-parity.test.mjs`）；**集成档未建**（回退载体 = 真机 R5 ∕ R6） | 模型菜单全渠批 |
| `docs/desktop/design/{IPC,UI,PROJECT,E2E-TESTING}.md` | 本批 W3 文档轮落定（IPC `model:catalog` 行 + 「模型清单注」+ 白名单 **39**；UI 输入区候选面句；PROJECT.md KD-44–46 ∕ §4.1 ∕ §4.2 ∕ §6.1 ∕ §7 ∕ §10；E2E §4 ∕ §6 行） | 本批（已落） |

**本批（parity-b10-ui · 三舱实施 + W6 收口轮）行「实读落值」**（实读 2026-09-29 · W6 届盘复读——内容行数口径；波面 = `docs/batches/2026-09-29-parity-b10-ui.md` §2.7 ∕ §5 三舱记录；设计 = 同档 §2）：

| 文件 | 实读落值（构成） | 舱 |
|---|---|---|
| W1+W4 舱（端）：`thincoder-desktop/renderer/app.mjs` ∕ `thincoder-desktop/renderer/index.html` ∕ `renderer/skin.css` ∕ `renderer/chrome.css` ∕ `thincoder-desktop/renderer/i18n.mjs` ∕ `views/statusline-segments.mjs` ∕ `i18n-composer.mjs` | **293** ∕ **55** ∕ **18** ∕ **450** ∕ **500** ∕ **224** ∕ **92**（R1 引导门：静态层 + `settleBoot` + 两样式档；I2–I5 键面 ∕ 注释；届盘复读与 §5 记录差见批档 §2.16） | W1+W4 |
| W1+W4 舱（VSC ∕ 核）：VSC `settings-panel-write.mjs` ∕ `presets.mjs` ∕ `thincoder-vscode/src/extension/settings.mjs` ∕ `locales/zh.json` ∕ 核 `thincoder-core/agent-tools/settings.mjs` | **183** ∕ **197** ∕ **350** ∕ 两值改 ∕ **271**（E1 改指核 `probeTargetOf`（`thincoder-core/provider-flows.mjs:79`）；S13 遮罩字面单源——核 `thincoder-core/agent-tools/settings.mjs:26` `MASKED` 转 export（随正 2026-10-02），桌面 ∕ VSC 同 import） | W1+W4 |
| W2 舱：`providers.mjs` ∕ `ipc.mjs` ∕ `ipc-registry.mjs` ∕ `preload.cjs` ∕ `thincoder-desktop/src/main/settings.mjs` ∕ `mount-settings-exits.mjs` ∕ `mount-settings-segments.mjs` ∕ `views/settings-sections.mjs` ∕ `views/settings-controls.mjs` ∕ `views/settings-sections-tools.mjs` ∕ `thincoder-desktop/renderer/views/settings.mjs` ∕ `store.mjs` | **300** ∕ **322** ∕ **86** ∕ **78** ∕ **324** ∕ **224** ∕ **356** ∕ **297** ∕ **130** ∕ **161** ∕ **334** ∕ **300** | W2 |
| W3 舱：`mcp-servers.mjs` ∕ `settings-values.mjs` ∕ `settings-env.mjs` ∕ `views/settings-agent.mjs` ∕ `views/settings-sections-mcp.mjs` ∕ 核 `shell-candidates.mjs`（新） ∕ `think-off.mjs` ∕ VSC `settings-panel-write.mjs`（再触碰） | **262** ∕ **109** ∕ **95** ∕ **227** ∕ **178** ∕ **78** ∕ **49** ∕ **183** | W3 |
| 新档三件：`renderer/settings-confirm.mjs` ∕ `renderer/mount-settings-segments-providers.mjs` ∕ `renderer/mount-settings-segments-agent.mjs` | **80** ∕ **134** ∕ **154**（新档落盘随批登记——本表；`docs/desktop/design/SHELL.md` §1 树同拍） | W2 ∕ W3 |
| `renderer/mount-settings-reads.mjs` | **189 零改**（S10 候选改由 `model:list` 切片派生——设计 +≤8 预算未用） | W3 |
| 测试面 | 三舱批内件（`.thincoder/tmp/b10-w1w4.test.mjs` ∕ `b10-w2.test.mjs` ∕ `b10-w3.test.mjs`）+ **W6 汇总件按舱分件**（`docs/batches/2026-09-29-parity-b10-ui-w1w4.test.mjs` ∕ `-w2.test.mjs` ∕ `-w3.test.mjs`——单件必越 500 上限 ⇒ 裁定分件；父侧收位） | 三舱 ∕ W6 |
| `docs/desktop/design/{IPC,UI,SHELL,PROJECT}.md` + `docs/core/design/PROVIDER.md` + `docs/render-core/design/RENDER-CORE.md` + `docs/vsc/design/{SETTINGS,WEBVIEW}.md` | W6 文档随动八档（逐档改动点 = 批档 §2.16；PROVIDER ∕ RENDER-CORE 两档 = W1 已落、复读一致） | W6（已落） |

**本批（设置面样式收正 · D37 · 2026-10-02 · 台账 #812 · 批 `docs/batches/2026-10-02-desktop-settings-layout.md`）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-02——内容行数口径（文末换行不计）；机制 ∥ 判据单源 = 本档 §1 **KD-66** ∥ `docs/desktop/design/UI.md` §1「本批注（设置面样式收正 · D37 · 2026-10-02）」；**实施落盘——2026-10-02**）：

| # | 文件 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/settings-sections.mjs` | **309 ⇒ 164**（实施落盘）（−145：渠道族出档（先拆后改）——re-export 面保持零改；越 300 消解——回线 ✓） | 段体面 |
| 2 | `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（本批拆档产出 · 已落） | **无 ⇒ 182**（实施落盘）（新档——渠道段体 + 两行卡重构：行族 ∥ 动作簇 ∥ 编辑态 ∥ 第三行） | 渠道段体 |
| 3 | `thincoder-desktop/renderer/settings.css` | **268 ⇒ 304**（实施落盘）（+36：行族通则（nowrap ∥ 省略四件 ∥ 动作簇零化）+ 两行卡结构 + 拨杆形 + MCP 展开面竖排 + ①④ 补则；**≤500 ⇒ 免拆**（500/800 口径更换批）） | 样式面 |
| 4 | `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` | **183 ⇒ 185**（实施落盘）（+2：摘要省略标记 ∥ 工具行竖排注） | MCP 段体 |
| 5 | 零改面 | `thincoder-desktop/renderer/views/settings.mjs`（364——re-export 面零改；拆档零波及）· `thincoder-desktop/renderer/views/settings-controls.mjs`（137）· `thincoder-desktop/renderer/views/settings-agent.mjs`（230）· `thincoder-desktop/renderer/views/settings-sections-{env,models,tools}.mjs`（137 ∕ 164 ∥ 163——CSS 覆盖径）· `thincoder-desktop/renderer/mount-settings*.mjs` **七档**（`mount-settings.mjs` ∥ `-reads` ∥ `-exits` ∥ `-segments` ∥ `-segments-{models,providers,agent}`） · `thincoder-desktop/renderer/i18n-settings.mjs`（零新词键）· 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC | 零触 |
| 6 | 批内件 | `docs/batches/2026-10-02-desktop-settings-layout.test.mjs`（**已建成 · 219 行 · 五腿 · 9 用例**——腿集 = `PROJECT.md` §6.1 本批块（修复轮：四 ⇒ 五——+卡界腿）；随批留存 · 不进仓套件） | 全批 |
| 7 | 设计档 | 本档 §1 **KD-66** ∥ `PROJECT.md` §4.1（新行一 + 两处随动）∥ 本档 §3.2（本块）∥ `PROJECT.md` §6.1 本批块 + 表头 **D1–D36 ⇒ D1–D37** ∥ §7 批注 + **T-DSK58** ∥ §8 本批边界行 ∥ §10 **DH**；`docs/desktop/design/UI.md` §1 本批注 + 设置面行行内指针；四档档头 **D1–D36 ⇒ D1–D37**（`docs/desktop/design/{UI,RENDERER,IPC,SHELL}.md`——机制面零触） | 全批 |

零触面：`renderer/theme.css`（变量表零动——零新变量）∥ 其余外壳档 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 侧（值源零改）∥ 交互语义（四动作行为零改）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（设置菜单升级批 · D39 ∥ D38 · 2026-10-02 · 台账 #817）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-02——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 本档 §1 **KD-68** ∥ `docs/desktop/design/MENU.md` §1 **KD-67**；**实施落盘——2026-10-02**）：

| # | 文件 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/settings-modal.mjs`（本批新档 · 已落） | **无 ⇒ 63**（实施落盘）（弹窗宿主——树纯函数 `settingsModalTree(state, group, handlers)` + 单例挂载 ∕ 刷新 ∕ 关闭 + Esc ∥ 焦点 + `closeSettingsConfirm` 同清；沿 `settings-confirm.mjs` 先例） | 弹窗宿主面 |
| 2 | `thincoder-desktop/renderer/settings-modal.css`（本批新档 · 已落） | **无 ⇒ 41**（实施落盘）（**#819 承接 +8 ⇒ 49**——见 §3.2 轻通道轮六块）（背板 z-20 ∥ 居中卡 z-21 ∥ 卡体 ∥ 体列；零新变量 ∥ 零新断点） | 弹窗样式面 |
| 3 | `thincoder-desktop/renderer/views/settings.mjs` | **364 ⇒ 398**（实施落盘）（+`settingsModalTree` 导出（单组树——复用档内私有 `noticeNode` ∥ `sectionStateNode` ∥ `sectionBody`）；本批触属性 = 导出面 +1（非结构性——**≤500 ⇒ 免拆**）） | 视图面 |
| 4 | `thincoder-desktop/renderer/mount-settings.mjs` | **181 ⇒ 249**（实施落盘）（弹窗第二闸（捕获 ∕ 重建 ∕ 复填 + `modalResidue`）+ `openSettingsModal` ∥ `closeSettingsModal` 装配 + face 返回 + 读取链表 + `refreshSettings` 在场判据扩） | 装配面 |
| 5 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **248 ⇒ 264**（实施落盘）（F-Esc 闸 +`modal != null` 守卫；`closeSettings` 同清 `modal` + 本组复位复用） | 出口面 |
| 6 | `thincoder-desktop/renderer/store.mjs` | **330 ⇒ 331**（实施落盘）（settings 切片 +`modal: null`；本批触属性 = 既有切片 +1 键（**非结构性**——无新切片 ∕ 切片族结构零变）——**≤500 ⇒ 免拆（500/800 口径更换批）**） | 状态面 |
| 7 | `thincoder-desktop/renderer/index.html` | **56 ⇒ 57**（实施落盘）（+`settings-modal.css` 链行——settings.css 后） | 骨架面 |
| 8 | 零改面 | `thincoder-desktop/renderer/settings.css`（304——**≤500 ⇒ 免拆**——新样式入新档）∥ `renderer/settings-confirm.mjs`（80——只读复用 `closeSettingsConfirm`）∥ `views/settings-sections*.mjs`（六档）∥ `mount-settings-segments*.mjs`（四档）∥ `mount-settings-reads.mjs` ∥ `i18n-settings.mjs`（**零新键**——复用段名 + `settings.close`）∥ `views/onboarding.mjs` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC | 零触 |
| 9 | 批内件 | `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（已建成——**波 2 腿**：④ 弹窗树 ∥ ⑤ 复用链 ∥ ⑥ 样式 ∥ 链序——腿集 = 本档 §4） | 全批 |
| 10 | 设计档 | 本档 §1 **KD-68** ∥ §2.10 ∥ §3.2 本块 ∥ §4 ∥ §5 **T-DSK59** ∥ §6 **DI（设置半）**；`docs/desktop/design/MENU.md` §1 **KD-67**；`docs/desktop/design/IPC.md` §1 `ev:menu` 行；`docs/desktop/design/{SHELL,UI}.md`；`docs/desktop/design/PROJECT.md` §2 ∥ §6.1 ∥ §7 ∥ §10 | 全批 |

零触面：七段值面语义（读写 ∥ 确认 ∥ 失败链全复用——零第二实现）∥ 现有设置页全链（「设置…」仍开页）∥ `settings.css` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批块（设置菜单组项收窄批 · D39 收正 · 2026-10-02 · 台账 #820）**：设置域（渲染面）**零档改动**——弹窗校验面 `SCOPES` 七名宽容（支 A 裁定：菜单不发第七名——零改）；文件账明细 = `docs/desktop/design/MENU.md` §3.4。

**本批块（轻通道轮六 · 走查续调六 · 2026-10-02 · 台账 #819）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-02——内容行数口径（文末换行不计）；机制 ∥ 判据单源 = 本档 §1 **KD-66** ② ∥ **KD-68** ① ∥ §2.12；批档 = `docs/batches/2026-10-02-light-round-6.md`）：

| # | 文件 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/settings-sections-providers.mjs` | **182 ⇒ 194**（+12：档头 ③ 注 ∥ `fallbackVerifyNode` 段末回退 ∥ 本行态 + 本行明细行） | 渠道段体 |
| 2 | `thincoder-desktop/renderer/views/settings-controls.mjs` | **137 ⇒ 145**（+8：`verifyControl` 态参 `state = null` ∥ 短形词两键 ∥ `data-verify-state` 锚；向导径缺省零变） | 校验控件面 |
| 3 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **264 ⇒ 264**（零增行——内容随动：`verify` 结果携 `name: target` 两处） | 出口面 |
| 4 | `thincoder-desktop/renderer/i18n-settings.mjs` | **152 ⇒ 156**（+4：`settings.providers.verify.okShort` ∥ `.failShort` 两键 × 两语；`SETTINGS_DICT` 两语各 60 ⇒ 62 键——文件账 = `docs/desktop/design/UI.md` §4.1） | 词面 |
| 5 | `thincoder-desktop/renderer/settings-modal.css` | **41 ⇒ 49**（+8：头行粘顶块——sticky ∥ `top: 0` ∥ `z 1` ∥ 底 `--bg-raised`；零新变量 ∥ 零新断点） | 弹窗样式面 |
| 6 | 批内件 | `docs/batches/2026-10-02-light-round-6.test.mjs`（已建成——腿 = 笔一三径（匹配行 ∥ 无行渲出结果回退 ∥ 空态）；随批留存 · 不进仓套件） | 全批 |
| 7 | 零改面 | `thincoder-desktop/renderer/views/settings.mjs` ∥ `thincoder-desktop/renderer/settings-modal.mjs` ∥ `thincoder-desktop/renderer/settings.css` ∥ 余设置族档 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC | 零触 |

零触面：段集 ∥ 段序 ∥ 七段值面语义 ∥ 现有页 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批块（MCP 键值行式输入批 · 2026-10-07 · 台账 #1036）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-07——内容行数口径；机制 ∥ 判据单源 = 本档 §1 **KD-76** ∥ §2.17；批档 = `docs/batches/2026-10-07-mcp-kv-input.md` §2 ∥ §5）：

| # | 文件 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/mount-settings-segments-mcp.mjs`（已落） | **0 ⇒ 299**（MCP 族出口搬移 + kv 令牌件与配对） | MCP 出口族 |
| 2 | `thincoder-desktop/renderer/mount-settings-segments.mjs` | **364 ⇒ 164**（MCP 族出档——越 300 预案兑现；**回线 ✓**） | 出口族 |
| 3 | `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` | **185 ⇒ 241**（kv 行构树 ∥ 加删钮 ∥ 三组渲染） | MCP 段体 |
| 4 | `thincoder-desktop/renderer/i18n-views.mjs` | **398 ⇒ 406**（+4 键 × 两语 + 值改 2——词值类 ⇒ 非结构性） | 词面 |
| 5 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **254 ⇒ 289**（MCP 族装配点——import ∥ 工厂调用 ∥ 合并展开；对外单一 `handlers` 表零改） | 装配 |
| 6 | 零改面 | `thincoder-desktop/renderer/settings.css` ∥ `src/main/mcp-servers.mjs` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 结构（VSC 同批自改——本端零触） | 零触 |
| 7 | 批内件 | `docs/batches/2026-10-07-mcp-kv-input.test.mjs`（已落 · 390 行 · 四腿 13 例；随批留存 · 不进仓套件） | 全批 |

零触面：段集 ∥ 段序 ∥ 七段值面其余字段语义 ∥ 现有页 ∥ 通道载荷形 ∥ 核 ∥ `thincoder-render-core` ∥ CLI；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批块（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-07——内容行数口径；机制 ∥ 判据单源 = 本档 §1 **KD-77** ∥ §2.18；批档 = `docs/batches/2026-10-07-add-dialog-unify.md` §2 ∥ §5）：

| # | 文件 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/settings.mjs` | **419 ⇒ 439**（+两新组支 ∥ 标题逐态 ∥ 段态词恰一收正 ∥ 常量/副件） | 模态树面 |
| 2 | `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` | **241 ⇒ 261**（+`mcpFormBody` 导出 ∥ 入口钮 ∥ 新增态取消钮） | MCP 段体 |
| 3 | `thincoder-desktop/renderer/views/settings-sections-models.mjs` | **164 ⇒ 186**（+`consultAddBody` 导出 ∥ 入口钮） | 模型段体 |
| 4 | `thincoder-desktop/renderer/views/settings-sections.mjs` | **95 ⇒ 96**（re-export 两件） | 段体 hub |
| 5 | `thincoder-desktop/renderer/mount-settings.mjs` | **259 ⇒ 264**（`SCOPES` +2 ∥ `MODAL_READS` +2） | 装配 |
| 6 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **289 ⇒ 307**（`openModal` ∥ `closeModal` 同注入两段族 ∥ `resetFacets` +2 支；两入口 handler 住两段族内（行 7 ∥ 行 8——实装口径）——**≤500 ⇒ 免拆（500/800 口径更换批）**） | 出口面 |
| 7 | `thincoder-desktop/renderer/mount-settings-segments-mcp.mjs` | **299 ⇒ 327**（入口/编辑开径 ∥ 成功径关框 ∥ 取消改关框——**≤500 ⇒ 免拆（500/800 口径更换批）**） | MCP 出口族 |
| 8 | `thincoder-desktop/renderer/mount-settings-segments-models.mjs` | **169 ⇒ 192**（入口 handler ∥ 成功径关框） | 模型出口族 |
| 9 | `thincoder-desktop/renderer/composer-wire.mjs` | **283 ⇒ 286**（`addProvider` 映射改直开 + import） | 装配 |
| 10 | `thincoder-desktop/renderer/mount-composer.mjs` | **299 ⇒ 300**（两 dep 转口携组名——**恰在 300 线上未越**） | 装配 |
| 11 | `thincoder-desktop/renderer/app.mjs` | **335 ⇒ 336**（双口提升） | 装配 |
| 12 | `thincoder-desktop/renderer/i18n-settings.mjs` | **152 ⇒ 158**（+3 键 × 两语；`SETTINGS_DICT` 60 ⇒ 63） | 词面 |
| 13 | `thincoder-desktop/renderer/i18n-views.mjs` | **406 ⇒ 408**（+1 键 × 两语） | 词面 |
| 14 | `thincoder-desktop/renderer/store.mjs` | **370 ⇒ 370**（±0——闭集注释 八值 ⇒ 十值（注释级）；**≤500 ⇒ 免拆（500/800 口径更换批）**） | 状态面 |
| 15 | `thincoder-desktop/renderer/i18n.mjs` | **420 ⇒ 425**（键数链注续链；**≤500 ⇒ 免拆（500/800 口径更换批）**） | 词面 |
| 16 | `thincoder-desktop/renderer/mount-settings-reads.mjs`（出表件） | **204 ⇒ 206**（`loadMcp` 成功 ∥ 失败两径改「并持现切片」——新弹窗编辑态前提；批档 §5.2 决策 #1） | 读面 |
| 17 | 零改面 | `thincoder-desktop/renderer/settings-modal.mjs` ∥ `thincoder-desktop/renderer/settings.css` ∥ `renderer/settings-modal.css` ∥ `src/main/**` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC（VSC 同批自改——本端零触） | 零触 |
| 18 | 批内件 | `docs/batches/2026-10-07-add-dialog-unify.test.mjs` ∥ `docs/batches/2026-10-07-add-dialog-unify-desktop.test.mjs`（**已落** · 8/8 ∥ 5/5；随批留存 · 不进仓套件） | 全批 |

零触面：段集 ∥ 段序 ∥ 七段值面语义 ∥ 现有页 ∥ 通道载荷形 ∥ 核 ∥ `thincoder-render-core` ∥ CLI；测试面随修随加——不占设计条目（2026-09-27 裁定）。

## 4. 验收回指（本域需求条目 · 判据全文——迁自 `PROJECT.md` §6.1 本域行 · as-of 2026-10-02）

| 需求 | 机检判据（点回需求卷） | 验证面 |
|---|---|---|
| **D7** | provider 增删 + key 校验 + preset 三协议 + i18n 两语各往返（批 9 落：`provider:*` 四通道 + `config:write` 的 `locale` 键——用例面 = 随批单元证据） | T-DSK8 |
| **D8** | 索引状态读数可达（**已落——桌面功能对位批 R2**：`index:status` 读数 + `index:build` 构建两通道，核只读出口 `memoryStatus()` 随落；本端不直读核内表——单源 = `docs/desktop/design/IPC.md` §2 该两行）；记忆 / 检索**只经 agent 工具面**（无 UI 搜索框） | T-DSK9 |
| **D9** | MCP 服务器增删后工具入口状态随动（批 9 落：`mcp:*` 三通道 + 探活失败 ⇒ 零写盘——用例面 = 随批单元证据） | T-DSK10 |
| **D11** | 无 config 时向导可完成并进入主界面；有 config 时跳过向导（批 9 落：闸 = 配置档存在性（读数 = `config:read` 回执 `configured`）；**入口 = 输入面板控制行 `#settings-btn`**（核件面板——`thincoder-render-core/composer/controls.mjs:51`；出口 = `openSettings`）；用例面 = 随批单元证据） | T-DSK13 / T-DSK32 |
| **D16** | 两态引导在场（`no-project` ⇒ 含 `button[data-action="project:open"]` · `no-session` ⇒ 含 `button[data-action="session:create"]`）+ 控件在场 ⟺ 句柄在场（零假按钮）+ 空态分态（`none` ⇒ 零块节点 + 引导节点〔`data-guide`〕· `no-message` ⇒ 复用既有空态节点）——判据四值 = `chatModel.guide`；单源 = `docs/desktop/design/UI.md` §1 批 B 追加注；机检面 = 随批单元证据（测试树 2026-09-28 全清重置） | T-DSK32 |
| **D37** | 设置面样式对 VSC 端对齐——收正全七段；功能面不删 ∥ 七段信息架构 ∥ 布局面零动——判据 = 下批块 + 本档 §2.5；真机面 = 本档 §5 `T-DSK58` | T-DSK58 |
| **D24**（设置面面） | 外壳视觉降噪——设置面映射 9 面（6 改 + 3 保留）；主条 = `docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」；本档半边 = §2.1（外壳降噪句）+ §2.5 项 1 ③（卡界让位） | 本档 §2 各节 |

**设置面样式收正批（验收面 · 2026-10-02 · 台账 #812 · 全文迁入）**：需求回指 = **D37**（设置面样式对 VSC 端对齐——收正全七段；功能面不删 ∥ 七段信息架构 ∥ 布局面零动）；设计单源 = 本档 §1 **KD-66** ∥ 本档 §2.5。
机检面 = 批内件 `docs/batches/2026-10-02-desktop-settings-layout.test.mjs`（**已建成 · 219 行 · 五腿 · 9 用例**：① 行结构断言（渠道行平 node 直测：两行结构 ∥ 动作簇四件序 = 修改 ∥ ✕ ∥ 校验 ∥ 移除名（现盘序——本档 §1 KD-66 ②））；
② 断行恒定（`thincoder-desktop/renderer/settings.css` 源扫：`.settings-row` `nowrap` ∥ 省略四件 ∥ 原因句豁免（`[data-unavailable-reason]`——置位 = `thincoder-desktop/renderer/views/settings-sections-providers.mjs:81`）保 `white-space: normal`；
补则——MCP 展开面豁免（`.settings-mcp-detail` 域值面 `white-space: normal`——行族通则本体零动））；
③ 样式纪律（零新变量（`--` 定义数 0）∥ 零 `@media`（零新断点））；④ 拨杆形四规则在位；⑤ 卡界源扫（`.settings-row` = `1px solid var(--line)` 描边 + 圆角 `6px` 在位——用户 2026-10-02 10:27 直裁形落））；随批留存 · 不进仓套件。
真机面 = **T-DSK58**（用户实拍可比：渠道两行卡 ∥ 长 URL 省略不折 ∥ 窄窗恒定 ∥ 编辑态 ∥ 拨杆——亮 ∥ 暗两模式 ∥ 全七段行族零参差折行）；**离线不可产面**（真渲染视觉）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**设置菜单升级批（验收面 · 设置半 · 2026-10-02 · 台账 #817 · 需求 D39 ∥ D38）**：需求回指 = **D39**（A 案弹窗 ∥ 七组读写/确认/失败链复用 ∥ 现有页保留 ∥ 边界三不做）；设计单源 = 本档 §1 **KD-68** ∥ §2.10（菜单侧 = `docs/desktop/design/MENU.md` §1 **KD-67**）。
机检面 = 批内件 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（已建成——**波 2 腿**：④ 弹窗树结构（背板 ∥ 卡 `role=dialog`+`aria-modal` ∥ 头锚 ∥ 组体恰一组（段体平 node 直测——注入桩）∥ notice 过滤（本组 ∨ panel 显 ∥ 他组隐）∥ Esc/背板/✕ 接线在场）
  ⑤ 复用链（七组 → 段体 ∥ 读取 ∥ 出口映射在场；`settings.modal` 闭集验证；表外组 ⇒ 记错零动作；**占槽拒**——向导占槽期开 ⇒ 拒 + 记错 + 零动作）
  ⑥ 样式 ∥ 链序（`settings-modal.css`：z 20/21 ∥ 零 `--` 定义 ∥ `settings.css` 零触 ∥ `index.html` 链在 settings.css 后））；随批留存 · 不进仓套件；
真机面 = **T-DSK59**（用例行 = 本档 §5——两波合一走查）；**离线不可产面**（真渲染视觉 ∥ 真交互）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

（§6.1 本域行迁讫（D7 ∥ D8 ∥ D9 ∥ D11 ∥ D16 全文；D37 由批块承载——上；D24 主条住 `docs/desktop/design/UI.md`——本档半边列上）。）

**设置菜单组项收窄批（验收面 · 设置半 · 2026-10-02 · 台账 #820 · 需求 D39 收正）**：需求回指 = **D39** 收正句（菜单组项 七 ⇒ 六；设置页面七段零动）；本批设置域零触——校验面 `SCOPES` 七名宽容（支 A 裁定——零改）；决策单源 = 本档 §1 **KD-68** ④。
机检面 = 批内件 `docs/batches/2026-10-02-settings-menu-trim.test.mjs`（已建成 · 3/3 绿）腿③（弹窗仍达六组 + `model` 宽容受理——单源 = `docs/desktop/design/MENU.md` §3.4 ∥ §4）；真机面 = **T-DSK59**（条目面随正——六组项）；**离线不可产面**= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计面条目（2026-09-27 裁定）。

**轻通道轮六（验收面 · 设置半 · 2026-10-02 · 台账 #819）**：需求回指 = **D7**（key 校验面——反馈呈现）+ **D37**（渠道段行形态——校验钮态）+ **D39**（弹窗体——头行粘顶）；设计单源 = 本档 §1 **KD-66** ② ∥ **KD-68** ① ∥ §2.12。
机检面 = 批内件 `docs/batches/2026-10-02-light-round-6.test.mjs`（已建成——笔一三径：匹配行本行态（`data-verify-state` ∥ 本行明细）∥ 无行渲出结果段末回退 ∥ 空态零节点）；真机面 = **T-DSK58**（① 行结构——校验钮态）+ **T-DSK59**（③ 弹窗体——头行粘顶）；**离线不可产面**（真渲染视觉 ∥ 真交互）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计面条目（2026-09-27 裁定）。

## 5. 用例（本域 · 全文迁自 `PROJECT.md` §7 涉行 · as-of 2026-10-02）

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK8 | 正常 · 设置与凭据 | 新增 provider + 填 key（真调校验）→ 切换语言 | 校验通过后可用；语言切换后界面文案随动；key 落共享配置文件 | — |
| T-DSK9 | 正常 · 记忆与检索 | 让 agent 调一次记忆检索 | 工具卡显示检索结果；**界面无独立搜索框**（D8 边界） | — |
| T-DSK10 | 正常 · MCP | 添加一个 stdio MCP 服务器 | 服务器列表出现该条；其工具入口随动可见 | — |
| T-DSK13 | 边界 · 首启分叉 | ① 无共享 config ② 已有共享 config | ① 进向导并在完成后可用 ② 跳过向导直接进主界面 | — |
| T-DSK62 | 正常 / 边界 · 缺激活渠道态补设（#842） | ① `defaultModel` 缺 ∧ 双已配渠 ⇒ 开设置面模型段 ② 行「采用」点击 ③ catalog 失败（探针不可达） ④ 无已配渠 ⑤ 缺激活渠道态入向导步 2（同链推证） | ① 段 `ready` + 全渠候选行（`provider · id`） ② `settings:agent` 写 `defaultModel=<provider>:<id>` ⇒ 回读后段转常规（激活渠出现） ③ 段 `none` + 失败面（零静默）+ 零假造候选 ④ 候选空 + 空态词（禁假造——既有） ⑤ 向导候选面 = 全渠（同一 `loadModels` 注入引用）∧「采用」⇒ 落 `defaultModel` | 批内件（#842 腿四：全渠候选 ∥ 采用写盘 ∥ 空 / 失败态 ∥ 向导同链） |
| T-DSK32 | 正常 · 首启空态引导（真 Electron） | 空 fixture 家（无 config ⇒ 无项目 / 无会话；另**预置**会话槽族档一枚〔`cwd` = 项目根——resume 开页落点〕）——新装首启 | ① 向导退场后：`[data-guide="no-project"]` 在场（含 `button[data-action="project:open"]`）∧ 输入框 `disabled` ② **真点**会话控制面项目钮（`button.session-project`——对话框夹具 `PROJ`，照 `docs/desktop/design/E2E-TESTING.md` §3.5 第 6 步）⇒ `[data-guide="no-message"]` ∧ 输入框非 `disabled` ③ 键入 + Enter ⇒ 输入值保留 ∧ `data-blocks="0"` ∧ console 出 `[composer] msg:send failed: `（不静默丢文本） | 机检面 = 单元测试档惯例（原集成档 `first-run-smoke.test.mjs` 随 2026-09-28 全清重置退场——重建时按 §4.1 登记）；十序断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 |
| T-DSK43 ④⑤ | 正常 · 小修族（设置面面 · 对齐第三批） | 设置面 agent 段具名控件 + `change` 即改即存；设置面开 ⇒ `Escape` ⇒ 关闭 | ④ 设置面 agent 段 = 具名控件 ∧ `change` ⇒ 即改即存（回执后回读同值）——离线可产；⑤ 设置面开 ⇒ `Escape` ⇒ 关闭（`[data-slot="settings"]` 清空）——离线可产（**F-Esc 判据**） | 判据载体 = 本档 §2.4；单源行（T-DSK43 全行）= `docs/desktop/design/PROJECT.md` §7（混装行——留原址） |
| T-DSK58 | 正常 / 边界 · 设置面样式收正（D37 · 真 Electron） | 真 Electron（fixture 家 `{"locale":"en"}`——`isConfigured` = 档存在）⇒ 启动 ⇒ 开设置面（`[data-slot="settings"]`） | ① 渠道段每行 = 两行卡（主行：名 + 钥面 + 动作簇（修改 ∥ ✕ ∥ 校验 ∥ 移除名）∥ 副行：`模型 · URL` + 代理开关）（**轮六**：校验钮触发 ⇒ 该行按钮 = 态短形（校验通过 ∥ 校验失败——锚 `data-verify-state`）+ 该行明细行；无行渲出结果（名不在列表 ∥ kind 表外）⇒ 段末回退）；② 长名 ∥ 长 URL ⇒ 省略不折、动作簇恒右对齐（窄窗拖至 ~800px 结构不变）；③ 钥编辑态 = 输入 + 存/消（代理 ∥ 移除 ∥ 校验暂撤——取消即回）；④ 复选控件 = 拨杆形（选中 `--accent`——亮 ∥ 暗两模式）；⑤ 全七段行族零参差折行；⑥ 全程零 `pageerror` | 机检面 = 批内件 `docs/batches/2026-10-02-desktop-settings-layout.test.mjs`（已建成 · 219 行 · 五腿 · 9 用例；随批留存 · 不进仓套件）；用例号自铸披露 = 本档 §6 **DH**（在册） |
| **T-DSK64** | 正常 / 边界 · MCP 键值行式输入（#1036 · 真 Electron） | 真 Electron：设置页 ∥ 弹窗两态——① stdio 新增：env 加两行（① `A=1` ② `TOKEN=va,lue`）⇒ 保存 ⇒ 重开编辑 ② http 新增：headers 加一行（`Authorization=Bearer x`——值含空格）∥ ✕ 删一行 ∥ 加空行不填 ∥ 类型切 http↔ws↔stdio 来回 | ① 值含逗号逐字存活（config.json `env.TOKEN === "va,lue"`）；重开回显 = 两行两格逐字 ② headers 值含空格存活；✕ ⇒ 行即摘；空行保存后消失（不落盘）；切换来回 ⇒ 已输入行不丢（令牌不复用 ⇒ 无残值复活）；零 `pageerror` | 机检面 = 批内件 `docs/batches/2026-10-07-mcp-kv-input.test.mjs`（拟新增 · 四腿；随批留存 · 不进仓套件）；用例号自铸（T-DSK64——若并行批占号 ⇒ 父侧并号裁定） |
| **R1** | 正常 · 一级全渠与选取（真机） | 配 ≥2 有 key 渠（含自定义） | 菜单一级行数 = 渠数 ∧ 行序 = 配置序 ∧ 每渠悬停列模型 ∧ 选取 ⇒ 槽写生效（跨端同槽复核） | 真机（父侧收口 · 桌面 + VSC 同配置对拍） |
| **R2** | 正常 · 跨端集合对照（真机） | 桌面 ∥ VSC 同 config | 桌面一级行集合 = VSC 一级行集合（集合相等——按 provider 键取集合，勿按显示文本：桌面分组标题 = 渠名 ∕ VSC = `providerLabel`） | 真机（父侧收口） |
| **R3** | 错误 · 失败渠诊断（真机） | 一渠 key 作废 | 该渠零行、零崩、控制台零静默（核落账失败项在） | 真机（父侧收口） |
| **R4** | 正常 · 会话切换随动（真机） | 会话 A/B 同渠不同模型 ⇒ 切换 | 模型钮随会话（同值回写不报错） | 真机（父侧收口） |
| **R5** | 正常 · 外部改档随现（真机） | 外部改 config（CLI 加渠） | 菜单随现（免重启） | 真机（父侧收口） |
| **R6** | 正常 · 设置面加渠随现（真机） | 设置面加渠 ⇒ 回输入区 | 菜单随现（免重启） | 真机（父侧收口） |
| **R7** | 边界 · 已配渠集 → 空（真机） | 设置面逐渠删至零 | 菜单保持现状（旧行驻留——有意边界；零崩、控制台零静默）；重新配渠 ⇒ 随推送复现（免重启） | 真机（父侧收口） |
| T-DSK59 | 正常 / 边界 · 设置菜单升级（D38 ∥ D39 · 真 Electron） | 真 Electron（fixture 家已配）⇒ 逐项走查（两波合一） | ① 菜单「设置」组在场（组名双语；条目序 = 设置… ∥ **六组项**（渠道 ∥ agent 参数 ∥ MCP ∥ 运行环境 ∥ 工具与服务 ∥ 会诊与审查——收窄批 #820）∥ 维护▸（两项）∥ 关于与快捷键▸（两项））② 「设置…」⇒ **现有设置页**开（`[data-slot="settings"]` 非空——零动）③ **六组项**逐开：弹窗在场（背板 + 居中卡 + 组名标题 + ✕）∥ 内容 = 该组段（态词 ∥ 行 ∥ 表单）∥ 真操作一面（如渠道段展开编辑态 ⇒ 存/消在）∥ 渠道段校验触发 ⇒ 本行按钮态短形 + 本行明细（**轮六**）∥ **头行粘顶（轮六）**：卡内滚 ⇒ 标题 ∥ ✕ 不随体滚出④ 关三路：Esc ∥ 背板 ∥ ✕（各关后 DOM 零残留；**页未被连带关**——同开场景）⑤ 键盘：开后焦点 = ✕ ∥ Tab 可达组内控件 ∥ 卡内 Esc 不冒（页保持开）⑥ 主题切换（亮 ∥ 暗）∥ 语言切换（en ∥ zh）⇒ 弹窗随动 ⑦ 维护两项 = 原生对话框零改 ∥ 关于 = 原生面板零改 ∥ 命令与快捷键 = `/help` 流内打印零改 ∥ 帮助组零改 ⑧ 现有页两入口（⚙ ∥ footer）零改 ⑨ 全程零 `pageerror` | 机检面 = 批内件 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（已建成 · 六腿；随批留存 · 不进仓套件）；用例号自铸披露 = 本档 §6 **DI（设置半）** |

（本域用例全文迁讫（T-DSK8 ∥ 9 ∥ 10 ∥ 13 ∥ 32 ∥ 58 + **R1–R7**——真机条目，模型菜单全渠批）；
  批注齐平 = **模型菜单全渠批注**（机检面 = 单元测试档 `docs/batches/2026-09-29-model-menu-parity.test.mjs`（**300** 行 · 9 用例——handler 面（真核探针径 + 本地回环 HTTP 桩）· 通道四件套结构机检 · store 纯动作 · 触发六径；复跑 = `node --test docs/batches/2026-09-29-model-menu-parity.test.mjs`）；
  **不新增 T-DSK 用例号**——真机收口面，沿 flow 批「真机走查面登记」先例；**离线不可产面**（真 provider 往返 ∥ 真机交互）⇒ 人工走查 + 父侧真跑闭合（D16 义务））。
（T-DSK27（E2E 域）∥ T-DSK43 余项（外围混装）∥ T-DSK16–19 留 `docs/desktop/design/PROJECT.md` §7 原址。批内件（单元测试档）随批次档留存。）

## 6. 上抛（本域 · 迁自 `PROJECT.md` §10 涉行 · as-of 2026-10-02）

| 行 | 项 | 类型 | 处置建议 |
|---|---|---|---|
| **CG** | **S3 行标面未携 VSC `failure` 分档**（hostBusy ⇒「宿主繁忙」+ 抑制失败句） | **已裁 = 消（补做——2026-09-29 · 批 #673）**：桌面无宿主采样器 = **欠做**（非能力缺失）；补做三件 = `loop-sampler.mjs`（port ≈45 行）· `failure` 键贯链 · 词键（`i18n-settings.mjs`） | 单源 = `docs/desktop/design/UI.md` §1「本批注（parity-b10-ui…）」项 7（同拍收正）；判据 = 同宿主忙态两端同词 + 同抑制形 |
| **CH** | **`agent.engineering` 泛化行读面形未裁**（S14a 只裁写面——写必拒 `slot-authority` 而读面仍呈可编辑泛化行） | **裁：读面收窄**（假可供性消除——沿 D-TO11 判旨；已落（desktop-residuals-round3 波 C——2026-09-29；台账 #617））；**随 #635① 全消（2026-10-04）泛化行整体退役——设置面 agent 段纯具名，本项闭合** | 写面判据 = 本档 §1 **KD-49**；单源 = `docs/batches/2026-09-29-parity-b10-ui.md` §5 W3 报告级发现⑤ |
| **DH** | **`T-DSK58` 用例号自铸披露 + 设置面样式收正批（#812）两项已裁**（沿 T-DSK37–T-DSK57 先例——本批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **卡界载体 = 已裁**——按 VSC 实形收（1px 描边 + 圆角 6px——实读 `thincoder-vscode/webview/settings.css:155-159`；D24 描边归零基线全局零动——仅本卡界让位；用户 2026-10-02 10:27）；③ **拨杆形 = 已裁**——保留（**零改**限定对象 = 值面照搬 VSC（`thincoder-vscode/webview/settings.css:222-257`）；**相对现盘 = 新增四规则**（现盘复选无形——`thincoder-desktop/renderer/settings.css:213` 仅 `align-self`）；形变可逆——单点回退：删四规则还原原生复选）；**附 · 原则句**：跨端差异项后续变更两端保持同步（用户 2026-10-02 10:27「以后要改一起改」——本裁定 = 首例） | **已裁（自铸披露在册 · ②③ 两裁落——引用户 2026-10-02 10:27）** | 单源 = 本档 §1 **KD-66** ∥ 批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §2 |
| **DI（设置半）** | **设置菜单升级批（#817）设置侧披露**（菜单半 = `docs/desktop/design/MENU.md` §6 **DI**）：① 弹窗体 z 20/21（确认族 40/41 保留其上——删除确认叠序零改）；② 零焦点陷阱 = 边界（Tab 可出卡——沿确认件 ∥ 现状零陷阱）；③ 双面并存（页 ∥ 弹窗可同开；关弹窗不动页）；④ `settings.css` **≤500 ⇒ 免拆**（新样式入新档）；⑤ **需求侧已收正**（主 agent 笔面——已落）：D36 动作集「五」⇒ **六**（+`openSettings`）——引需求卷 `docs/desktop/requirements/MENU.md:12` D36 行内收正句 ∥ `:19` 变更行 | 登记（披露） | 单源 = 本档 §1 **KD-68** ∥ 批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §2 |

（上列三行全文已迁讫（CG ∥ CH ∥ DH）；§10 本域余行（CT ∥ CV ∥ CX ∥ CY ∥ DB ∥ DD② 等他域行）留 `docs/desktop/design/PROJECT.md` §10 原址。）

## 变更记录

- 2026-10-09（**provider-default-model-purge 批 · 实施期收正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §2 ∥ §5 舱3 · 台账 #1122）：向导步 1 `activeDefault` 复选随 2026-10-09 清除批退场（`active` 参退场 ⇒ 死控——父侧裁定；等价路径 = 模型段「采用」）——KD-75② ∥ §2.16 项 5（尾 ∥ 条件渲染句）三处同拍收正。**零新语义**（裁定落地）。明细 = 批档 §2 收正块。

- 2026-10-09（**provider-default-model-purge 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §3 轮次 1 · 台账 #1122）：批内注记名统一「2026-10-09 清除批」（§2 渠道行 ∥ §2.2 渠道校验 ∥ §2.14 补全行 ∥ §3 字段面——逐处七笔）。**零新语义**（注记名收正）。明细 = 批档 §2 修复轮块。

- 2026-10-07（**添加入口弹窗统一批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-07-add-dialog-unify.md` §2 · 台账 #1054）：新增 **§1 KD-77**（添加入口统一：两新组弹窗 `mcpForm` ∥ `consultAdd` + 页脚直开 + 段态词恰一收正）+ **§2.18**（批注八项）+ **§3.2 本批块**（十五行）；**§1 KD-68 邻域**的 `SCOPES` 计数（八 ⇒ 十）随 §2.18 项 6 落（KD-68 ④ 本体内计数句 → 实施后回填）。**零新语义**（定形 + 落点；明细 = 批档 §2）。

- 2026-10-07（**添加入口弹窗统一批 · 设计评审轮 1 修正（fix 轮 · 发现 1 ∥ 4 ∥ 5 ∥ 6 ∥ 7 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-07-add-dialog-unify.md` §3 轮次 1 ∥ §1.6 · 台账 #1054）：**KD-68 ④** 两处 `SCOPES` 计数收齐（「七名」句退场 ∥ 「八名」⇒ **十名**——+`mcpForm` ∥ `consultAdd`（同格仅存十值））；**§2.11** 现值收正（八名 ⇒ **十名** ∥ 八组 + **本批 +2 行 ⇒ 十组**（基数钉死）；`MODAL_READS` 定义位 `:49 ⇒ :52`）；**§2.10** 定义位 `:46 ⇒ :48`；**§3.1** 读数收正（`MODAL_READS` 九 ⇒ **八组**——实读对象恰 8 键）；**§3.2 本批块** +`store.mjs` ∥ `i18n.mjs` 两行（注释级 ∥ 链注——15 ⇒ **17 行**）；**KD-77 ②** ∥ **§2.18 项 3** 补 `consultAdd` 取消钮（词 `settings.cancel`；锚 `settings:consultCancel`——与 `mcpForm` 同形）；**KD-76 ①** ∥ **§2.18 项 3** 补行集起手口径（起手三组零行——「零项 ⇒ 零行」同判 ∥ 两端同值）。**产品码零触（fix 轮）· 零新语义**（计数 ∥ 措辞 ∥ 注 ∥ 边界面只）。明细 = 批档 §2 修正块。

- 2026-10-07（**添加入口弹窗统一批 · 实施后回填轮（设计面）· eng-designer**——承批档 `docs/batches/2026-10-07-add-dialog-unify.md` §5（两舱交付）· 台账 #1054）：**§3.2 本批块翻「实读（实施落盘）」**（**17 ⇒ 18 行**——产品件 **15 ⇒ 16**：+`mount-settings-reads.mjs` **204 ⇒ 206**（出表件——两径并持现切片）；全表实读回填（偏离 6 件：sections-mcp +5 ∥ sections-models +11 ∥ segments-mcp +13 ∥ segments-models +14 ∥ exits +5 ∥ i18n.mjs +4；`mount-composer.mjs` **300 恰在线上未越**——原「越线登记」句随正）；两档越线（exits **307** ∥ segments-mcp **327**——拆分评估登记保持））；**行 6 措辞收正**（「两入口 handler」⇒ 实装口径「`openModal` ∥ `closeModal` 同注入两段族；两入口 handler 住两段族内（行 7 ∥ 行 8）」）；零改面行样式档补 `thincoder-desktop/` 前缀（悬空锚收正）。**零新语义**（实读值 ∥ 计数 ∥ 措辞 ∥ 登记；附：悬空锚收正 1 条）。明细 = 批档 §2 回填轮块。

- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 2b · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：建档——本域单源档。迁入清单 = `PROJECT.md` §2（**KD-10 ∥ KD-11 ∥ KD-12 ∥ KD-13 ∥ KD-44 ∥ KD-45 ∥ KD-46 ∥ KD-49 ∥ KD-66**——逐字，表行形态）∥ `UI.md` §1（设置面行 ∥ 启动态行 ∥ 首启向导行 ∥ parity-b10-ui 注 10 项 ∥ 对齐第三批 P14 ∥ P15 ∥ F-Esc ∥ D37 注 8 项 ∥ 重建保真项 1 ∥ 批 B 注项 5——逐字，语义边界折行）；原址各留一行指针（`PROJECT.md` §2 · `UI.md` §1）。
  迁入文本内「本档 §x」回指按新落点改指（如「本批注（parity-b10-ui）」⇒「本档 §2.2」；「本批注（设置面样式收正 · D37）」⇒「本档 §2.5」）；**文件账未随本波迁入**（§4.1 settings-* 族行——随 2c）；域内余量（§4.2 批块 ∥ §6.1 ∥ §7 ∥ §10 涉行）未迁——随 2c 承接（批档 §2 同拍）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（续 · #35）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§3.1 新立**（设置族行 **28** 行——自 `PROJECT.md` §4.1 逐字迁入；原址各改一行指针）∥ **§3.2 新立**：批块 **3 块**（模型菜单全渠批 ∥ parity-b10-ui ∥ 设置面样式收正——迁自 §4.2；块内「本档」类回指按新落点改指）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 4 · 终篇）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4/§5/§6 域行全文迁讫**——§4 收 D7 ∥ D8 ∥ D9 ∥ D11 ∥ D16 五行全文 + 设置面样式收正批批块 + D37 ∥ D24 判据行（迁自 `docs/desktop/design/PROJECT.md` §6.1；原址各改一行指针）∥ §5 收 T-DSK8 ∥ 9 ∥ 10 ∥ 13 ∥ 31 ∥ 32 ∥ 58 + **R1–R7** 全文 + 模型菜单全渠批注齐平（迁自 §7）∥ §6 收 CG ∥ CH ∥ DH 三行全文（迁自 §10）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**设置菜单升级批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §1 ∥ §2 · 台账 #817 · 需求 D39 ∥ D38）：§1 增 **KD-68**（设置弹窗化 A 案——面形 ∥ z 族 ∥ 卡结构 ∥ 七组复用链指名 ∥ `settings.modal` 开合 ∥ 第二闸草稿保真 ∥ 交互键盘 ∥ 双面并存 ∥ 边界 + 被否五候选）；§2 增 **§2.10** 本批注；§3.2 本批块（新档二 + 改档五 + 零改面）；§4 验收块；§5 增 **T-DSK59**；§6 增 **DI（设置半）**。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**设置菜单升级批 · 修正轮（评审轮 1 · 发现 1–8 ∥ 10 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §3 轮次 1 · 台账 #817）：**KD-68 ④** 补 `SCOPES` 定义位（**既有**——`thincoder-desktop/renderer/mount-settings.mjs:39`，自 `SECTIONS` 派生）+ 闭集关系（源 ∕ 镜像）句（含漂移检测）；**KD-68 ⑦** 补**面态归属 = 单树共享**（开 ∥ 关的本组复位两面同效——明示接受）；§2.10 项 3 同拍指位；§3.2 行 6（`store.mjs`）补**触属性 = 既有切片 +1 键（非结构性）**⇒ 消解窗口顺延；§4 波 2 腿 ⑤ 补**占槽拒**判据；§6 **DI（设置半）** ⑤ 转「已收正」（引需求卷行）。`docs/desktop/design/MENU.md` ∥ `docs/desktop/design/IPC.md` 同拍（明细另见其变更行）。**产品码零触 · 零新语义**。明细 = 批档 §2 修正轮块。
- 2026-10-02（**设置菜单组项收窄批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-settings-menu-trim.md` §1 ∥ §2 · 台账 #820 · 需求 D39 收正）：**KD-68 ④** 闭集关系收正（菜单发出闭集六名 = `SECTIONS` 去「模型与档位」∥ 校验面 `SCOPES` 七名宽容——支 A 裁定；零改 `SCOPES`）+ `settings.modal` 切片注随正；§2.11 增本批注；§3.2 增本批块（设置域零档）；§4 增本批块；§5 **T-DSK59** 条目面随正（六组项）；菜单侧 = `docs/desktop/design/MENU.md` 同拍。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**轻通道轮六收尾 · 设计形式化 · eng-designer**——承批档 `docs/batches/2026-10-02-light-round-6.md` §1 · 台账 #819）：§1 **KD-66** ② 增校验反馈就地化句 ∥ **KD-68** ① 增头行粘顶句；§2 增 **§2.12** 本批注；§3.1 四行行数值随动（`views/settings-sections-providers.mjs` **182 ⇒ 194** ∥ `views/settings-controls.mjs` **137 ⇒ 145** ∥ `mount-settings-exits.mjs` **264 ⇒ 264**〔内容随动〕∥ `settings-modal.css` **41 ⇒ 49**）；§3.2 增本批块；§4 增本批验收块；§5 **T-DSK58** ① ∥ **T-DSK59** ③ 随动。`docs/desktop/design/UI.md` §4.1 同拍（`i18n-settings.mjs` **152 ⇒ 156**——`SETTINGS_DICT` 两语各 **60 ⇒ 62** 键）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**轻通道轮六收尾 · 修正轮（评审轮 1 · 发现 4-i ∥ 4-ii ∥ 5 ∥ 7 · 由设计落文）· eng-designer**——承批档 `docs/batches/2026-10-02-light-round-6.md` §2 修正行 · 台账 #819）：§2.12 项 1 三件收正——① 编辑态口径落文（编辑态 = 校验钮 ∥ 结果明细行**同撤**——校验暂撤口径含明细；取消即回）；② 结果跨开面留存裁（留存 = 有意——「上次校验读数」：提交成功 ∥ 移除 ∥ 下次校验起手均已清；开面不清——零实现改）；③ 回退口径修词（「无匹配行回退」⇒「**无行渲出结果**（名不在列表 ∥ kind 表外）⇒ 段末回退」）+ 落档四 `settings-sections-providers.mjs:41` ⇒ **`:42`**（定义行）。**产品码零触 · 零新语义**（口径 ∥ 坐标收正）。明细 = 批档 §2 修正行。
- 2026-10-02（**设置菜单组项收窄批 · 修正轮（评审轮 1 · 发现 1–4 · 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-settings-menu-trim.md` §3 轮次 1 · 台账 #820）：§3.2「设置菜单升级批」块翻「实读（实施落盘）」（说明 ∥ 表头 ∥ 行值以 §3.1 实读为准：settings-modal **63** ∥ css **49** ∥ views/settings **398** ∥ mount-settings **249** ∥ mount-settings-exits **264** ∥ store **331** ∥ index.html **57**；两新档行「拟新增」随翻——消行内矛盾）；§2.11 `MODAL_READS` 补定义位（`thincoder-desktop/renderer/mount-settings.mjs:49`）。**产品码零触 · 零新语义**（收口 ∥ 登记 ∥ 指位）。明细 = 批档 §2 修正轮块。
- 2026-10-02（**桌面 UX 收尾批 · 回填/随动轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §5 · 台账 #697）：§3.1 三行实读对盘（`thincoder-desktop/src/main/settings.mjs` **320 ⇒ 325**——`indexStatus()` 回执 +2 键（越 300 ⇒ 续期）∥ `thincoder-desktop/src/main/index-status.mjs` **67 ⇒ 72**——`readIndexCounts` 扩两键 ∥ `thincoder-desktop/renderer/views/settings-sections-tools.mjs` **163 ⇒ 208**——两读行）。**零新语义**（读数 ∕ 判定句）。明细 = 批档 §2。
- 2026-10-02（**桌面 UX 收尾批 · 收口补充轮（#31）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §1 ∥ §2 · 台账 #697）：§2 增 **§2.13**（KD-69 桌面侧详文回填——解冻兑付：两读 spec = 词键 ∥ 形 ∥ 缺位零节点 ∥ 刷新拍）；同轮记录行锚收正 3 处（短形路径引用 ⇒ 全形限定——消悬空；零语义）。**零新语义**（回填 ∥ 形收正）。明细 = 批档 §2。
- 2026-10-02（**文档清账轮 · 行宽清账（#806 · 轮 6）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-settlement-round.md` §2.12：① 锚面九处短形补前缀（`thincoder-vscode/src/extension/settings.mjs:380-408` ∥ `thincoder-core/agent-tools/settings.mjs` ×3 ∥ `thincoder-desktop/renderer/index.html` ∥ `thincoder-desktop/renderer/i18n.mjs` ∥ `thincoder-vscode/src/extension/settings.mjs` ∥ `thincoder-desktop/src/main/settings.mjs` ∥ `thincoder-desktop/renderer/views/settings.mjs`）；② 宽面 3 行折行（123 ∥ 290 ∥ 322——语义零改）。台账 #806。）
- 2026-10-03（**首跑渠道提示修复批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 · 台账 #840）：§2 增 **§2.14** 本批注（首跑补全——`provider:save` 缺失补写 ∥ 向导收尾守卫 ∥ 模型步「采用」接线；设置面模型段零候选死端登记）；**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-03（**首跑渠道提示修复批 · 修正轮（评审轮 1 · 发现 1–8 逐号）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 修正轮块 · 台账 #840）：§2.14 **向导收尾守卫改档**（不阻断完成——守卫态引导归输入区发送失败行（词+钮）；判由 = 模型步候选源实读同源零候选）；「边界 ∥ 上抛」bullet 补**向导模型步同源句**（「采用」钮判据三件）；接线 bullet 判由收正（U-2 裁定纳入）。**产品码零触 · 零新语义**。明细 = 批档 §2 修正轮块。
- 2026-10-03（**首跑渠道提示修复批 · 修正轮 #7（用户 13:43 更正——13:09 口径系拼音误打）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 更正块 · 台账 #840）：§2.14 收正为**词面-only** 终形——来源句改指 13:43 更正（13:09 原话「按你倾向走」）；发件行归纯词面（动作面 `composer.send.chooseModel` 引用 ∥ 「可行动形」句随删——扫面随动）。**产品码零触（修正轮）**。明细 = 批档 §2 更正块。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 ∥ §5 · 台账 #841）：§3.1 三行走读齐平（`settings.mjs` **325 ⇒ 331** ∥ `providers.mjs` **335 ⇒ 339** ∥ `mount-settings-exits.mjs` **264 ⇒ 270**——第三刷新点主 ∕ 渲染两侧半）。**零新语义**（读数）。明细 = 批档 §2 回填轮块。
- 2026-10-03（**首跑渠道提示修复批 · 实施后文档面回填轮（§3.1 三行走读齐平）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 ∥ §5 · 台账 #840）：§3.1 三行实读对盘（`providers.mjs` **315 ⇒ 335**——B① 补写支（越 300 ⇒ 续期）∥ `mount-settings.mjs` **249 ⇒ 251**——B③ `useModel` 注入 ∥ `mount-onboarding.mjs` **89 ⇒ 95**——B③ 接线）。**零新语义**（读数）。明细 = 批档 §5。
- 2026-10-04（**issue 修复批·五 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round5.md` §1 · 台账 #842）：§2 增 **§2.15**（缺激活渠道态补设路径——全渠扇出 `model:catalog` + 既有 `useModel` 出口）；§2.14「边界 ∥ 上抛」bullet 随正（候选消解 = 本批落）；§5 增 **T-DSK62**。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-04（**issue 修复批·五 · fix 轮（评审 #70 发现 5 · 父侧全采纳）· eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round5.md` §3 轮次 1）：§2.15 条件句收正为**同链钉死**（同一 `loadModels` 注入引用——`mount-settings.mjs:214` ∥ `mount-onboarding.mjs:59-62`；向导步同效、死端同消解）；§2.14 随正（两处同链）；§5 **T-DSK62** +⑤ 向导腿。**产品码零触 · 原判据零改**（结局钉死 ∥ 断言补）。明细 = 批档 §2。
- 2026-10-04（**issue 修复批·五 · 登记/回填轮 · eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round5.md` §2.8（父侧裁定）：§3.1 三行终态读数回填（`thincoder-desktop/renderer/views/settings.mjs` **398 ⇒ 399** ∥ `thincoder-desktop/renderer/views/settings-sections.mjs` **164 ⇒ 169** ∥ `thincoder-desktop/renderer/mount-settings-reads.mjs` **192 ⇒ 204**）；§2.15 增**投影档穿透**条（表外件①——`thincoder-desktop/renderer/views/settings.mjs:162-163` 带渠投影）。**零新语义**（读数 ∥ 落面登记）。
- 2026-10-04（**渠道档位退役批（desktop-channel-tier-retire）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §2 · 台账 #902）：「模型与档位」段档位控件形全消（KD-18 ⑥ 设置面半退场）· **§2.7 整节删** · §2.1 ∥ §2.2 两行收正 · §3.1 四行说明收正 · §5 用例行 T-DSK31 删（机检豁免——用例退场登记）；写径拒收形（载荷顶层有效键闭集——表外 ⇒ `invalid-patch`）随批落批档 §2。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-04（**泛化编辑器退役批（desktop-generic-editor-retire）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-desktop-generic-editor-retire.md` §2 · 台账 #903 · #635①∥②⑤）：**泛化编辑器全消**（前置名单核查 = 无具名化义务活键——§2.2 项 6 ∥ §2.3 项 14–15 收正 · KD-49 被否列收正 · KD-66 ③ ∥ §2.5 项 1 ∥ §4 本块「只读字段行收束」半净删 · §6 **CH** 转闭合）；**②⑤ 保留裁定两注**（§2.1 面头语言控件邻位 = 宿主能力类 ∥ KD-66 ② 动作簇邻位 = 位置类）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-04（**渠道档位退役批 · fix 轮（U1 段名收正——用户 11:53 裁「改」）· eng-designer**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §2 修正块 · 台账 #902）：设置面段名「模型与档位」⇒「**模型**」（en「Model & tier」⇒「Model」）——本档活面 10 行收正 + 首现注一处（**KD-68** ④ 首处释义句——防历史断链）；产品码落点（i18n 两语值 ∥ 注释族）= 实施轮落。**产品码零触（修正轮）**。明细 = 批档 §2 修正块。
- 2026-10-04（**泛化编辑器退役批 · 实施后面回填轮 · 父侧直接执行 · 可 revert**——承批档 `docs/batches/2026-10-04-desktop-generic-editor-retire.md` §5 · 台账 #903）：§3.1 三行走读齐平（`thincoder-desktop/renderer/views/settings-agent.mjs` **230 ⇒ 188** ∥ `thincoder-desktop/renderer/mount-settings-segments-agent.mjs` **156 ⇒ 98** ∥ `thincoder-desktop/renderer/settings.css` **304 ⇒ 296**——**回线 ⇒ 越 300 在册条目消解**）；`docs/desktop/design/UI.md` §4.1 `i18n-settings.mjs` 行同拍（**156 ⇒ 152** ∥ 键数 **62 ⇒ 60**——T 批终值 59 在飞）；`docs/desktop/design/PROJECT.md` §4.1 越层段同拍（回线除名额 + 十六 ⇒ 十五）。**零新语义**（读数）。
- 2026-10-04（**渠道档位退役批 · 实施后回填轮 · 父侧直接执行 · 可 revert**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §5 · 台账 #902）：§3.1 六行走读齐平（`thincoder-desktop/src/main/settings.mjs` **331 ⇒ 300**（**回线 ✓**）∥ `thincoder-desktop/src/main/providers.mjs` **339 ⇒ 317** ∥ `thincoder-desktop/src/main/settings-values.mjs` **118 ⇒ 106** ∥ `thincoder-desktop/renderer/views/settings.mjs` **399 ⇒ 398** ∥ `thincoder-desktop/renderer/views/settings-sections.mjs` **169 ⇒ 93** ∥ `thincoder-desktop/renderer/mount-settings-exits.mjs` **270 ⇒ 254**；`mount-settings-reads.mjs` **204**（Δ0）+ `i18n-settings.mjs` **150** ∥ `i18n.mjs` **413**——后三行账目见 `docs/desktop/design/UI.md` §4.1 ∥ `docs/desktop/design/PROJECT.md` §4.1 越层段）。**零新语义**（读数）。
- 2026-10-07（**provider 配置面三端对齐批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-07-provider-config-parity.md` §1 · 台账 #1027 ∥ #1028 ∥ #1029）：§1 增 **KD-75**（provider 添加 = 专用弹窗（骑 D39 宿主）+ 单表对齐 VSC 源：字段序 ∥ 走 proxy 开关 ∥ 探面同判定）；**KD-68 ④** 值集随正（`SCOPES` 七 ⇒ 八——+`providerAdd`）；§2 增 **§2.16** 本批注；`docs/desktop/design/PROJECT.md` §2 KD 索引 +KD-75 行；`docs/desktop/design/IPC.md` §2 两行载荷随正（`provider:save` ∥ `provider:models` +`proxy`——探面收敛 = 核 `probeTargetOf` 同判定，修 `proxy.web` 旗取用（#1026 镜像））。**扩面（#1031–#1035）**：KD-75 ⑨ 计数随动（词值 6 键——「API Key」形）；§2.16 尾增扩面块；#1031 ∥ #1032 ∥ #1033 桌面零改。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-07（**三端对齐批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-07-provider-config-parity.md` §3 轮次 1 ∥ 用户 2026-10-07 19:04 裁）：§2.11 七名句 as-of 收正（`SCOPES` ∥ `MODAL_READS`——现值八名（+`providerAdd`），接 §1 KD-75）；§2.16 项 5 补向导步 1「走 proxy」在场句 ∥ 项 8 判据 + 开径腿 + 向导走查 ∥ 边界 #1034 注记更新（本端 `✕` 不动——裁讫 · A）。**产品码零触（fix 轮）**。明细 = 批档 §2。
- 2026-10-07（**头行粘顶批（设置页 ∥ 向导）· 设计形式化轮 · eng-designer**——承批档 `docs/batches/2026-10-07-settings-heads-sticky.md` §1 ∥ §2 · 台账 #1030）：§1 **KD-68** ① 增页 ∥ 向导面同径粘顶句；§2.12 项 2 增本批落档（`thincoder-desktop/renderer/settings.css:43-57`——+7）；项 3 随正；§3.1 `settings.css` 行走读齐平（**296 ⇒ 303**——**回越 300 咨询线 ⇒ 再入册**）；`docs/desktop/design/UI.md` §1 面线坐标随正（`:44-51` ⇒ `:43-57`）；`docs/desktop/design/PROJECT.md` §4.1 越层段同拍（再入册 + 十四 ⇒ 十五）。**产品码零触（本笔）**。明细 = 批档 §2。
- 2026-10-07（**MCP 键值行式输入批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-07-mcp-kv-input.md` §1 ∥ §2 · 台账 #1036）：§1 增 **KD-76**（env ∥ headers = 行式键值编辑器——形 ∥ 提交四判据 ∥ 字面值 ∥ 粘贴零解析 ∥ 行令牌态 ∥ 先拆后改拆档 ∥ 零新 CSS ∥ 被否六候选）；§2 增 **§2.17** 本批注；§3.1 三行随动（`views/settings-sections-mcp.mjs` **185 ⇒ ≈250** ∥ `mount-settings-segments.mjs` **364 ⇒ ≈195**（越 300 在册预案触发 ⇒ 本批执行）+ 新档 `mount-settings-segments-mcp.mjs` **0 ⇒ ≈240**）；§3.2 增本批块；`docs/desktop/design/PROJECT.md` §4.1 越层段 + 拆档链登记同拍。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-07（**MCP 键值行式输入批 · 设计轮续笔核验（重启接续）· eng-designer**——承本批批档 §2 追记⑥ · 台账 #1036）：KD-76 ⑤ ∥ §2.17 项 5 ∥ §3.1 拆档行三处缝句按三先例实读收正（装配点 = `mount-settings-exits.mjs`——三先例调用位 `:152` ∥ `:156` ∥ `:162` ∥ 合并表 `:226-238`）；
  §3.1 +`mount-settings-exits.mjs` 行 ∥ §3.2 本批块 +1 行（受影响面 +1——**254 ⇒ ≈258**）；**产品码零触（续笔）**。明细 = 批档 §2 追记⑥。
- 2026-10-07（**MCP 键值行式输入批 · 设计评审修复轮（§3 轮次 1 · 发现 7）· eng-designer**——承批档 `docs/batches/2026-10-07-mcp-kv-input.md` §3 轮次 1 ∥ §2 修复轮块 · 台账 #1036）：§2.17 项 3 补机制句——**类型切换出口行值捕获 = 与加删出口同一「自读 DOM 行集」面**（`readMcpForm` 快照不采行件为前提——防实施轮误依赖 `draft`）。**零新语义**（机制名明示）。明细 = 批档 §2 修复轮块。
- 2026-10-07（**MCP 键值行式输入批 · 实施后回填轮（设计面）· eng-designer**——承批档 `docs/batches/2026-10-07-mcp-kv-input.md` §5 ∥ §2 追记⑧ · 台账 #1036）：§2.17 项 3 补**现读面机制句**（`mcpFormNode()` = 文档序末位 `[data-form="mcp"]`——页体 ∥ 组弹窗体）∥ §2.17 项 5 ∥ §1 **KD-76** ⑤ 去「拟新增」（**已落 · 299**）；§3.1 四行实读回填（`views/settings-sections-mcp.mjs` **241** ∥ `mount-settings-segments.mjs` **164**（回线 ⇒ 越层除名）∥ 新档 **已落 · 299** ∥ `mount-settings-exits.mjs` **289**）；§3.2 本批块翻「实读（实施落盘）」。**零新语义**（读数 ∥ 登记）。明细 = 批档 §2 追记⑧。
- 2026-10-07（**三端对齐批 · 收口回填轮（设计面）· eng-designer**——承批档 `docs/batches/2026-10-07-provider-config-parity.md` §5（舱三 §5.11 ∥ 评审 🟡②③）：§2.16 **项 3 ∥ 项 5 补直陈句**（弹窗体三件随 handler 在场——条件渲染；向导步 1 保持预设单选 = 设计字面，非静默发散）∥ **项 7 现读链收正**（渲染面 `mount-settings-segments-providers.mjs:137`（勾选 ⇒ `{ proxy: true }`——`:130`）⇒ 主面 `thincoder-desktop/src/main/providers.mjs:276-288`（目标 = `probeTargetOf`——`:281`））∥ **项 1 坐标 `mount-settings.mjs:46 ⇒ :48`**（同值实例 = §1 **KD-68** ④ 同拍）；§3.1 `thincoder-desktop/renderer/views/settings.mjs` 行走读齐平（**398 ⇒ 419**——实施落盘）。**零新语义**（读数 ∥ 坐标 ∥ 直陈）。明细 = 批档 §2 追记⑨。
- 2026-10-07（**三端对齐批（#1027–#1035）· 收口回填轮随笔（§3.1 余行齐平）· 父侧直接执行〔可 revert〕**——承批档 `docs/batches/2026-10-07-provider-config-parity.md` §1.11）：§3.1 七行走读齐平（`views/settings-sections.mjs` **93 ⇒ 95** ∥ `views/settings-controls.mjs` **145 ⇒ 215** ∥ `views/settings-sections-providers.mjs` **194 ⇒ 211** ∥ `mount-settings.mjs` **251 ⇒ 259** ∥ `mount-settings-segments-providers.mjs` **150 ⇒ 160** ∥ `settings-modal.mjs` **63 ⇒ 70** ∥ `mount-onboarding.mjs` **95 ⇒ 96**）。**零新语义**（读数）。
- 2026-10-07（**三端对齐批 · 收口轮设计随动（末笔）· eng-designer**——承批档 `docs/batches/2026-10-07-provider-config-parity.md` §5.16（收口轮 #14）∥ §2 追记⑩）：§2.16 项 8 机检指针收正——原单件名（已删）⇒ **四件实读名 + 行数**（cli **127** ∥ vsc **412** ∥ desktop **376** ∥ vsc-harness **210**——测试台公档）。**零新语义**（指针）。明细 = 批档 §2 追记⑩。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §2 · 台账 #1042）：§1 **KD-75** ⑤ ∥ §2.16 项 7 ∥ 项 8 判据 ⇒ 逐渠判定（全局 `proxy.model` 合取去净；条目 `proxy` ∧ `uri` 在案）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-08（**残渣清扫批（#1052 ∥ #1058 ∥ #1059）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-08-residue-sweep.md` §2 · 台账 #1052 ∥ #1059）：§2 增 **§2.19**（段出口密钥现读宿主无关化）；§2.8 增两腿重锚条 + `paintSettings` 坐标收正（`:125-133 ⇒ :207-222`）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-08（**proxy 逐渠独立批（去全局闸）· 设计评审轮 2 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-08-proxy-per-channel.md` §3 轮次 2 发现 6 · 台账 #1042）：§1 **KD-75 ⑤** ∥ §2.16 引言两处「口径单源并列」收正为**落点指针**（单源 = `docs/core/design/PROXY.md` §4——随 `docs/core/design/PROVIDER.md:342` 收述）。**产品码零触（fix 轮）**。明细 = 批档 §2。
- 2026-10-08（**残渣清扫批（#1052 ∥ #1058 ∥ #1059）· 设计评审轮 1 修正（fix 轮 · 发现 ① ∥ ③）· eng-designer**——承批档 `docs/batches/2026-10-08-residue-sweep.md` §3 轮次 1 · 台账 #1052 ∥ #1059）：§2.19 尾增**受影响文件（本批）小表**（7 行——源档 4 ∥ 批内件 3；现行 ⇒ 预期 ≤±N）+ 第三腿**源面锁腿定义**（扫描域 ∥ 判据形状 ∥ 同族出口点名 + 结论）；§2.8 项 2 补表指针。**产品码零触（fix 轮）· 零新语义**。明细 = 批档 §2.10。
- 2026-10-10（**桌面行为残渣批（#805 ∥ #809 ∥ #831 ∥ #912 ∥ #914 ∥ #979 ∥ #1039 ∥ #1041 ∥ #1071）· 实施期随动 · 父侧直接执行 · 可 revert**——承批档 `docs/batches/2026-10-10-desktop-behavior-residues.md` §2.3 行 21（Ⅷb 核验轮 2026-10-10 对位成立 · 台账同批九行）：§2.12 项 2 「a11y 补」增两滚动层 `scroll-padding-top` 句（`:148`/`:149`——页层 ∥ 弹窗层同值 ≈42.2px）+ §3.1 两行读数齐平（`settings-modal.css` **49 ⇒ 51** ∥ `settings.css` **304 ⇒ 306**——#1039）。**零新语义**（读数 ∥ a11y 补句后补记录行）。
- 2026-10-10（**purge-residue-sweep 批 · 设计档随动轮 · eng-coder**——承 `docs/batches/2026-10-10-purge-residue-sweep.md` §2 设计档落点表 · 台账 #1090 ∥ #1126）：§2 增 **§2.20**（`env.proxy` 两键形——种子 ∥ 投影 ∥ 写径归一三面 + AC-1090/1–5 + 边界）；§3.1 两行读数齐平（`thincoder-desktop/renderer/views/settings.mjs` **437 ⇒ 436**（投影行删）∥ `thincoder-desktop/renderer/mount-settings-reads.mjs` **211 ⇒ 210**（`defaultModel` 写点键删）——实读 2026-10-10 · 内容行数口径）。**零新语义**（形面 as-built 落档 ∥ 读数）。明细 = 批档 §2 ∥ §5。
