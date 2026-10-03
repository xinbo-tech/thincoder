# 桌面端（DESKTOP）· 设置域（SETTINGS）

> 板块 = **桌面端设置域**——设置面板（七段） / 首启向导 / 渠道族形态 / 模型与档位 / agent 参数 / MCP ∥ env ∥ 工具与服务 ∥ 模型清单段 / 样式收正（D37）——本域设计单源档。
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
> **行数纪律（300 建议 ∕ 500 硬限）只对代码档**（`.mjs` ∕ `.cjs` ∥ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。

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
| KD-49 | **`settings:agent` 通用保存 = patch 显式清除面 + slot 权威键拒写**（parity-b10 W3 · S10 ∕ S11 ∕ S14）：① patch 值 = `null` ⇒ **删键**（沿核 `_checkKnownKeyValue`「null = 显式清除」语义——S10 槽清空 ∕ S11 中性档两径即用）；② `agent.advisor.guard` ∕ `agent.engineering` = **会话槽权威键**（唯一写面 = `session:flags` 槽写——跨端同槽）⇒ 通用保存**拒写**（拒码 `slot-authority` + 零写；拒位先于值校验 ∕ 混合 patch 整拒）；guard 设置面开关写经 `session:flags`（回执后 `ev:flags` 随动） | 拒写依据 = VSC 侧同裁（`agent.engineering` 白名单删项 ∕ `agent.advisor.guard` 非 payload 字段——`thincoder-vscode/src/extension/settings-panel-write.mjs`）+ #475「通用保存不可达该键」先例；`null = 删除` = 核侧既有语义 ⇒ 「patch 表达不了删键」旧口径消解（单源 = `docs/desktop/design/IPC.md` §2 设置族注项 10） | 被否：**guard 键走通用 patch**（与会话级语义分家——跨端槽面失守）· **`agent.engineering` 写面放行**（槽权威面失守）——读面形（泛化行是否留可编辑）另裁：登记 = `docs/desktop/design/PROJECT.md` §10 **CH** |
| KD-66 | **设置面样式收正（D37）= 全七段按 VSC 形态收正——渠道两行卡为锚**（设置面样式收正批 · 2026-10-02 · 台账 #812；需求卷 **D37**）：① **范围与口径**——收正 = 形态 ∥ 密度 ∥ 断行 ∥ 层次（值源 = VSC 实读）；功能面不删 ∥ 七段信息架构保持（段集 ∥ 段序零改）∥ 布局面零动（48rem 居中列——2026-10-02 实证）；② **渠道行 = 两行卡列**（锚）——主行 = 名 + 钥面 + 当前标 + 动作簇（修改 ∥ ✕ ∥ 校验 ∥ 移除名——四件全保留、序恒定 = 现盘序保持；VSC 对位 = 前两件同序，`thincoder-vscode/webview/settings-providers.js:183-186`）；副行 = `模型 · URL` + 代理开关；条件第三行 = 不可用原因；断行恒定 = nowrap + 中段单点省略；编辑态 = 行内换形（输入 + 存/消）；**校验反馈就地化（轮六 · 2026-10-02 · 轻通道 · 台账 #819）**——`verify` 结果携行名：匹配行 ⇒ 本行呈现（校验钮态短形「校验通过」∕「校验失败」+ 本行明细行）；无行渲出结果（名不在列表 ∥ kind 表外）⇒ 段末回退（单源 = 本档 §2.12）；③ **行族通则**——`.settings-row` nowrap + `.settings-row-value` 省略四件 + 动作簇 `~` 零化（修多钮各自 auto 散开）；**补则两件（代码评审两裁落形 · 2026-10-02）**——**只读字段行收束**：`.settings-field-readonly` 补缩省略四件（`min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`——沿行族同四件；值面 = 路径 ∥ 标量）；提示词面 `.settings-readonly-hint` 定尺寸不缩（`flex: 0 0 auto`——短词面禁截）；**MCP 展开面 = 全显豁免**：`.settings-mcp-detail` 域内值面（工具行描述 ∥ params ∥ 回执词行）恢复自然折行（`white-space: normal` + `overflow-wrap: anywhere`）——豁免独立成则，行族通则本体零动（折叠面摘要行 ∥ 工具行名零动）；④ **复选 = 拨杆形**（VSC `.switch` 照搬；文本输入细边 = D24 保留面零动）；⑤ **卡界 = VSC 实形**——1px 描边（`--line`）+ 圆角 6px（实读 `thincoder-vscode/webview/settings.css:155-159`；卡底零独立填充；用户 2026-10-02 10:27 裁「尽量跟 VSC 一致」——D24 描边归零基线全局零动 ∥ 仅本卡界让位）；⑥ **零新变量 ∥ 零新断点**（D24 ∥ D29 基线）；⑦ **拆档**——渠道族出档 `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（D37 拆档产出 · 已落——先拆后改 · 越层消解窗口兑现；re-export 面零改）；⑧ **边界** = 交互语义 ∥ 功能增删 ∥ IA ∥ 布局面 ∥ 核 ∥ VSC 零触。值面 ∥ 判据 ∥ 端差明细单源 = `docs/desktop/design/UI.md` §1「本批注（设置面样式收正 · D37 · 2026-10-02）」（本档 §2.5）；明细 = 批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §2。 | 需求 D37（用户 10:05「我希望至少跟 vsc 端样式上对齐」+ 10:03 锚样本实拍）；VSC 实读 = `thincoder-vscode/webview/settings-providers.js:178-193`（两行卡）∥ `thincoder-vscode/webview/settings.css:155-203`（卡值）∥ `thincoder-vscode/webview/settings.css:222-257`（拨杆）；桌面现状实读 = `thincoder-desktop/renderer/settings.css:145-154`（单行 wrap）∥ `thincoder-desktop/renderer/views/settings-sections.mjs:129-153`（单行内联 5–7 件）；D24 ∥ D29 ∥ 扁平化基线在册 | **被否**：保留单行内联只压间距（锚点明指两行卡——折行参差为被诉本体）· 全段照搬标上行表单（48rem 列宽域——端差判）· 全像素复刻（宿主主题变量不存在——取值即自铸） |
| KD-68 | **设置弹窗化（D39 ∥ A 案）= 每菜单组项 ⇒ 应用内模态弹窗（单组 · 复用链指名 ∥ 现有页零动并存）**（设置菜单升级批 · 2026-10-02 · 台账 #817；需求卷 **D39**）：① **面形（沿 `settings-confirm` 先例）**——背板（`document.body` 直挂 ∥ `fixed inset 0` ∥ z-**20** ∥ `--overlay`）+ 居中卡（`fixed` 居中 ∥ z-**21** ∥ `width: min(48rem, calc(100vw - 2*var(--gap)))` ∥ `max-height: calc(100vh - 2*var(--gap))` ∥ 内 `overflow: auto` ∥ `--bg-raised` + 1px `--line` 描边 + `--shadow`；**头行粘顶（轮六 · 2026-10-02 · 轻通道 · 台账 #819）**——卡内滚 ⇒ `header.settings-head` sticky 常驻（`top: 0` + 底 `--bg-raised` + `z 1`——标题 ∥ ✕ 不随体滚出；单源 = 本档 §2.12））；**z 族** = 设置面 10 < 弹窗 20/21 < 确认弹层 40/41（确认盖弹窗——删除确认族零改）< 引导层 200；**零新变量 ∥ 零新断点**（D24 ∥ D29 基线）；**新档 `thincoder-desktop/renderer/settings-modal.css`（本批新档 · 已落）**（不进 `settings.css`——在册越线档零结构触碰、消解窗口不触发；`index.html` 链序 = settings.css 后）。② **卡结构** = `header.settings-head`（标题 = 组名（`settings.section.*` 段名）+ ✕（`.settings-close` 形复用；`data-action="settings:modalClose"`；aria-label = `settings.close`））+ `div.settings-modal-body`（失败串（`notice.scope` = 本组 ∨ `panel`）+ 段态词 + 段体——段标题不复述）。③ **单组内容 = 复用链（指名）**：组 → 段体组件 → 读取链 → 出口链（= 同一 `exits.handlers` 全表注入——视图 `data-action` 同域，零第二份；**七行**：providers → `providersBody`（`views/settings-sections-providers.mjs`）→ `loadProviders()` → providerSegments+exits 表；model → `modelBody`（`-sections.mjs`）→ `loadProviders()`（含模型候选随动）→ 同前；agent → `agentBody`（`-agent.mjs`）→ `loadAgent()` → agentSegments 表；mcp → `mcpBody`（`-sections-mcp.mjs`）→ `loadMcp()` → segments 表 MCP 族；env → `envBody`（`-sections-env.mjs`）→ `loadEnv()` → segments 表 env 族；tools → `toolsBody`（`-sections-tools.mjs`）→ `loadTools()` → segments 表工具族；models → `modelsBody`（`-sections-models.mjs`）→ `loadAgent()`（models 块——R7 同拍）→ modelSegments 表）——**零第二实现 ∥ 零值面语义改**（读写 ∥ 确认 ∥ 失败链与页同源）。④ **状态 ∥ 开合**——`settings.modal`（store 切片 +1：`null ∥ 组名七值闭集`（= 校验面 `SCOPES`；菜单侧发出集 = 六名——收窄批 #820）；重绘走既有 `SETTINGS_KEYS`）；开（`openSettingsModal(group)`）= `SCOPES` 闭集验证（**既有**——定义位 = `thincoder-desktop/renderer/mount-settings.mjs:46`，自视图 `SECTIONS`（`thincoder-desktop/renderer/views/settings.mjs:35`）派生——同源单份零双抄；表外 ⇒ 记错零动作）→ 向导占槽期拒（`occupies`——沿设置族占槽口径，记错）→ 切片写 + `notice:null` + **本组面态复位**（providers → `edit/probe/draft/keyDraft`；mcp → `form`——沿 `openSettings` 同口径限本组）→ **本组读取链**；关（`closeSettingsModal()`）= 切片清 + 本组面态复位 + `closeSettingsConfirm()`（子确认同清——沿 `closeSettings` 同形）；`closeSettings()` 同拍清 `modal`；**闭集关系（源 ∕ 镜像——2026-10-02 收窄批 #820 收正）**——`SECTIONS`（视图单源，七段）→ `SCOPES`（装配面派生，**七名**——设置页对齐）∥ `SETTINGS_GROUPS`（菜单侧镜像闭集同导出——`thincoder-desktop/src/main/app-menu.mjs`；主 ∕ 渲染分层无直 import，先例 = `THEME_VALUES`）——**菜单发出闭集 = 六名**（= `SECTIONS` 名序**去「模型与档位」**——「模型与档位」不入菜单，用户 16:53 走查裁）；**校验面 `SCOPES` = 七名宽容**（菜单不发第七名——零改 `SCOPES`；支 A 裁定）；漂移检测 = 批内件跨面源扫（`SETTINGS_GROUPS` ≡ `SECTIONS` 名序**去「模型与档位」**）。⑤ **重绘 ∥ 草稿保真**——弹窗体 = **第二闸**（沿 #604 同形：卡片根捕获 ∕ 重建 ∥ 复填；**独立残件变量** `modalResidue`；失效集（#652）一次性同滤两捕获、整轮末清）；`refreshSettings` 在场判据 +`settings.modal != null`（外档写盘 ⇒ 弹窗在场同复读）。⑥ **交互 ∥ 键盘**——关三路：背板点击 ∥ ✕ ∥ 卡内 Esc（**`stopPropagation`**——不连带触 F-Esc 关页；`mount-settings-exits.mjs` 键面闸增 `modal != null` 守卫）；初始焦点 = ✕（+50ms，沿确认件先例）；键盘全可达（原生控件序）；**零焦点陷阱**（边界）；`role="dialog"` + `aria-modal="true"` + `aria-label` = 组名。⑦ **双面并存**——现有设置页**零动**（「设置…」⇒ 页）；两面可同开（弹窗盖顶；关弹窗不动页）；**面态归属 = 单树共享**（`settings.providers` 族 `edit/probe/draft/keyDraft` ∥ `settings.mcp.form`——页 ∥ 弹窗同源一份，零第二份）⇒ 开 ∥ 关的**本组面态复位 = 两面同效**（页侧同组未提交编辑态同清——**明示接受**；接受由 = 单树复用零第二份 ∥ 复位限本组、不动他组）；⑧ **边界** = 七段值面语义 ∥ 现有页 ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触；独立设置窗口（B 案）不做。 | 需求 D39（用户 15:13 提出 + 15:19 裁 A「先按照a做吧」）；先例实读 = `thincoder-desktop/renderer/settings-confirm.mjs`（背板 + 弹框 + 挂 `document.body` + Esc 拦截 + 默认焦点）；页零动判据 = D39「现有设置页保留（升级件并存——验收 OK 后再议撤）」；z 实读 = `thincoder-desktop/renderer/settings.css:16`（10）∥ `renderer/chrome.css:170-175`（backdrop 40）∥ `:176-181`（confirm 41） | 被否：**独立设置窗口（B 案）**（用户明令不做）· **slot 内渲染**（`[data-slot="settings"]` 的 `:empty`/`[data-state="closed"]` 退场规则 + 48rem 列形态打架——`thincoder-desktop/renderer/settings.css:33-34`）· **复用 `.auto-backdrop`/`.auto-confirm` 族**（22rem 宽 ∥ 确认语义 ∥ z 40/41 与确认叠序冲突——需动确认族）· **设置页改造成弹窗**（现有页零动 = 需求）· **每开记全量五读**（页口径——弹窗限本组，省空转） |

## 2. 界面形态与交互（迁自 `UI.md` §1——本域行与批注块）

### 2.1 设置面（行）

| 面 | 形态 |
|---|---|
| 设置面 | **形态 = 窗口级覆盖层面**（挂载根 = `index.html` 单容器 `[data-slot="settings"]`）· **开** = 输入区控件行出口（`openSettings`——`#settings-btn` 核件面板控制行（`thincoder-render-core/composer/controls.mjs:51`）；接线 = `thincoder-desktop/renderer/mount-composer.mjs:90` ∕ `:160`；否决「会话头部」位）· **关** = 面板内控件 `data-action="settings:close"`（退场 = 清空容器 ⇒ 主 UI 可用）；**面头语言控件** = 面板头内、`settings:close` 左侧（en ↔ zh 切换按钮 · 锚 `data-action="settings:lang"`——沿开 / 关锚命名；**否决「状态栏」位**（语言非状态量））；点按 ⇒ `config:write`（`locale`）⇒ **同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷（**免二跳**）；标签 = 词表键（两语各一键 · 随当前语言出串）；**语言非新段**——**七段**闭集不动；**主题切换（D33 · 2026-09-30）**：面头三态钮族（语言控件邻位——`data-action="settings:theme"`）——`docs/desktop/design/UI.md` §1「本批注（主题切换 · D33 · 2026-09-30）」；**Esc 关闭（对齐第三批 · 重核处置）**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；对位 = VSC Esc 关设置面；向导态不在本项——既有键盘面 = 审批卡根 `keydown`（`thincoder-desktop/renderer/views/approval.mjs`）与会话控制面选择器（`docs/desktop/design/SESSIONS.md` §2.1）两处）；面 = **七段**（渠道 / 模型与档位 / agent 参数 / MCP / env（proxy ∕ shell） / tools（embedding ∕ websearch 两 key + 索引状态行） / models（consult ≤5 ∕ advisor 两 picker）——R7 落）；**「模型与档位」段档位控件形（批 B 落）** = `select`（选项 = **Auto + off 族 + 逐模型档位枚举**——**off 在场判据 = 核 `thinkOffPath(spec)` 投影**〔判定对象 = 该段当前所选模型；真 ⇒ off 选项在场 · 假 ⇒ 缺席〕；枚举单源 = 核 `reasoningEffortEnum` 投影；**现值 = `provider:list` 行投影 `effort`**（离线——本档 §2.7 项 1）· **表外现值 ⇒ 自成一选项**（不吞）· **现值恒在场（含不可选态）** · `defaultModel` 缺 / 模型段空 ⇒ 控件零节点）；**该段写面 = 全局 config**（`settings:agent`——设置面默认值）；**会话级切换在输入区控件行**（`docs/desktop/design/COMPOSER.md` §2——两面不互相顶替（需求 §3.5 项 5 / 项 6）），各段**三态**（未配 / 载入中 / 已配），供给未落 ⇒ 零节点（禁止假造）；写面全经核唯一执行体 `writeConfigAtomic`（端侧零自写盘——本档 §1 KD-10）；失败面可见（零静默）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注（项 8——`FORMATS` 端侧枚举判定 · `defaultModel` 两写口）· **外壳降噪（D24）**：同规则带上（结构框归零 + 次级键四值族 + 行族卡界让位（升底让位 ∥ 1px 描边 + 圆角 6px——随 D37 收正））——`docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」项 5；**对齐第三批**：类型加工（三控型）/ agent 具名控件 + 即改即存 / Esc 关闭——本档 §2.3（P14 / P15）∥ §2.4（F-Esc）；**parity-b10-ui（设置面余面 · 2026-09-29）**：渠道行控件族（密钥设 ∕ 改 ∕ 删三路 · 渠级代理复选 · sub 行）· 删除确认门（四门）· MCP 编辑 ∕ 重连与结构化表单 · agent 段（子代理模型槽六件 ∕ advisor 档枚举 ∕ guard 开关）· index 空态（`no-key`）——形 / 锚 / 判据 = 本档 §2.2；S3 端差（行标未携 `failure` 分档）= **消（补做三件）**——同注项 7；**样式收正（D37 · 2026-10-02）**：本档 §2.5 |

### 2.2 parity-b10-ui 注（设置面余面 + 首屏引导门 · 2026-09-29）

**本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）**：本注补本档 §2.1「设置面」行与 §2.6「启动态」行的 parity-b10-ui 落面（两行已就地指针；来源 = `docs/batches/2026-09-29-parity-b10-ui.md` §2.6 修法表 S1–S14 ∕ R1 + §5 三舱实施记录）。本注只述端侧形态与锚；语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2**（设置族与项目级信息族注 ∕ 白名单面），不在此重述。

1. **渠道行控件族（S1 ∕ S4 ∕ S5）**——行内三路：设 ∕ 改钥钮与删钥钮（**静止 ∕ 编辑两态**——编辑态 = 密码输入 + 存 ∕ 消）；渠级代理**行内复选**（行 `proxy` 投影随动）；**sub 段** = `model` ∕ `baseURL` 非空才显（空值 ⇒ 零节点——禁假造）。
2. **自定形「拉取模型」（S2）**——钮 + `datalist` 下拉候选（探回模型集）+ 状态行三态；**手输兜底**（模型框恒为文本输入——零阻断保存）；探针不落盘；探果重挂 ⇒ `draft` 快照回填未落盘输入。
3. **预设项标签形（S7）**——`name — desc (model)`（值直取核 `PROVIDER_PRESETS`——端侧零表；缺段不落空括号）。
4. **删除确认门（S6）**——不可复得类删除前置确认弹层：四门 = 渠移除 ∕ 删钥 ∕ 密钥行删除 ∕ MCP 移除；驳回（否 ∕ 背板 ∕ 框内 Escape）⇒ **零写**；构件 = **新档** `thincoder-desktop/renderer/settings-confirm.mjs`（`.auto-confirm` 族复用——**零新 CSS**；`onConfirm` = 开框时捕获闭包）；关面 ∕ 开面同清。
5. **MCP 段（S8 ∕ S9）**——行补**编辑**钮（表单预填 = 现值；名只读）与**重连**钮（先断后连——失败面在场）；增表单 = 结构化三型字段组 + token ∕ headers（对位 VSC 同族——JSON textarea 退场）。
6. **agent 段（S10 ∕ S11 ∕ S14b）**——子代理模型槽六件 = `select` + 复合候选 + 占位（清空 ⇒ 删键）；advisor 推理档 = 选项控件（Auto + off + 逐模型枚举）；guard 开关 = `session:flags` 槽写（值 = `sessionFlags` 投影；未知 ⇒ `disabled`——禁假造）；
   **slot 权威键泛化行 = 只读行（#617-CH · 波 C 已落）**——`agent.advisor.guard` ∕ `agent.engineering` 泛化行出值 + 提示词键 `settings.reason.slotAuthority` · 锚 `data-readonly` · **零控件**（段尾保存判据同排除——不入提交 patch）；写面归属 ∕ 拒码 = 本档 §1 **KD-49**。
7. **S3 端差处置（消——2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`）**——行标面补 VSC `failure` 分档（hostBusy ⇒「宿主繁忙」+ 抑制失败句）：原「能力缺失」不成立（欠做）⇒ 补做三件 =
   ① 新档 `thincoder-desktop/src/main/loop-sampler.mjs`（port ≈45 行——源 = `thincoder-vscode/src/extension/loop-sampler.mjs:67-76`）
   ② 行面 `failure` 键贯链（`providers.mjs:105-107` → 通道 → 渲染——渲染档点名 = `thincoder-desktop/renderer/views/settings-sections.mjs`）
   ③ 词键（落 `renderer/i18n-settings.mjs`——#614 第四档，词面阻已除）；判据 = 同宿主忙态两端行面同词 + 同抑制形。上抛行 = `docs/desktop/design/PROJECT.md` §10 **CG**（同拍定形）。
8. **首屏引导门（R1）**——`data-boot` 补渲染消费：`≠ "ok"` 期间引导层在场；`"error"` ⇒ 错误面（可读原因）；`"ok"` ⇒ 撤（**零残留**）；写者单点零改（`thincoder-desktop/renderer/dom.mjs`）。
   **CJ 裁定落（#617-CJ · 波 C 已落）**：`error` 态 = **顶部横幅非模态**（载原因不覆盖交互——`inset: 0 0 auto` ∕ `pointer-events: none` ∕ z 序（9）低于设置面（10））⇒ 设置面可进可出 ∧ 原因可见；`ok` ∕ `loading` 两态零改；裁定行 = `docs/desktop/design/PROJECT.md` §10 **CJ**；真机复读 = 父侧（D16）。
9. **index 空态（S12）**——embedding key 缺 ⇒ `no-key` 态（提示词 + 构建钮禁用——对位 VSC `settings-tools.js:337-341` 同判）；有 key ⇒ 既有 built ∕ not-built 两态零变。
10. **计数（D3）**——通道 **0** 新（六出口 = 既有设置族）；段集七段零改；**新档 3**（`settings-confirm.mjs` ∕ `mount-settings-segments-providers.mjs` ∕ `mount-settings-segments-agent.mjs`）；判据 = 批内件 + 真机（父侧闭合）。

### 2.3 对齐第三批 · 设置面两件（P14 · P15）

14. **设置面·类型加工**——现状：agent 段全 `type:"text"`（布尔 / 数值键写不进）。对齐形：控件型按 `field.kind` 三值（`string` ⇒ `text` ∥ `number` ⇒ `number` ∥ `boolean` ⇒ `checkbox`）；
    出值规范化 = 数值 ⇒ `Number(v)`（空 / 非数 ⇒ **零发送**——不写盘 · 零乐观改 · 控件回退现值）· 布尔 ⇒ `.checked`。落点 = `thincoder-desktop/renderer/views/settings-sections.mjs`（`agentFieldNode`）+ `mount-settings.mjs`（取值面）。
    真删键在 `patch` 链不可达（`docs/desktop/design/IPC.md` §2 档位控件注「`patch` 表达不了删键」· 核 `thincoder-core/agent-tools/settings.mjs:134-145` 类型表对 `null` 抛错——「显式清除」语义现只对形状表键族）⇒ 端差登记 = **VSC 删键（`Number(v) || undefined` 径）∕ 桌面零发送**（父侧裁定 2026-09-28；消解路 = 主侧写链 + 核清除形扩族——另批）。
15. **设置面·agent 形态**——现状：点分路径泛化表单 + 保存键。对齐形：**具名控件区**（十键 = `maxTurns` / `subagentTurns` / `poolLimits.{engCoder,other,advisor}` / `compactThreshold` / `verifyGuard` / `consultTurns` / `consultTimeoutMs` / `advisor.reasoningEffort`——词键标签 + 三控型 + 锚 `data-field-name`）
    + **即改即存**（`change` ⇒ 单键 patch 直发；回执 ⇒ 就地刷新；失败 ⇒ 回退 + 可见失败面——零保存键）；表外标量键 = 泛化行兜底（保留编辑 + 保存键——零能力削减）。
    落点 = `thincoder-desktop/renderer/views/settings-sections.mjs` + `mount-settings.mjs` + `i18n.mjs`。**端差（保留零动——端差清算批裁 · 2026-09-29）**：VSC 全具名（桌面保留泛化兜底行——反向差：对位令单向（VSC 有 ⇒ 桌面必有；反向未含）∥ 项目钮族先例）。

### 2.4 对齐第三批 · 设置面 / 向导 Esc 关闭（F-Esc）

- **设置面 / 向导·Esc 关闭**（原「零 Esc 绑定」：出处 = 流程自划「有意」；对位面 = VSC Esc 关设置面）⇒ **入本批**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；向导态不在本项）；其余浮层族（下拉 / 菜单 / 中断模式）桌面零对位面 ⇒ 零动。
  判据：**机检** = 真 Electron 面（用例面 = 随批单元证据）——真点设置入口（输入区控件行出口）⇒ `keyboard.press("Escape")` ⇒ `[data-slot="settings"]` 清空（T-DSK43 ⑤）；**真机复核** = 人工走查。

### 2.5 设置面样式收正批注（D37 · 2026-10-02 · 台账 #812）

**本批注（设置面样式收正 · D37 · 2026-10-02 · 台账 #812）**：本批定形桌面设置面**样式面对齐 VSC 端**（锚 = 渠道段实拍对比；用户 2026-10-02 09:43 走查「设置界面的样式很凌乱」+ 10:05「我希望至少跟 vsc 端样式上对齐」；需求卷 **D37**）；批档 = `docs/batches/2026-10-02-desktop-settings-layout.md`。
决策单源 = 本档 §1 **KD-66**。本注只述端侧形态 / 落点 / 判据 / 边界——值源 = VSC 实读（两行卡 = `thincoder-vscode/webview/settings-providers.js:178-193` + `thincoder-vscode/webview/settings.css:155-203`；拨杆 = `thincoder-vscode/webview/settings.css:222-257`）。

1. **收正四则（全七段通则）**——① **断行恒定**：行族不再按内容折行（`.settings-row` `flex-wrap: wrap ⇒ nowrap`）；行内中段可变内容 = 单点省略（`min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`——泛用面 = `.settings-row-value`；不可用原因句豁免 = `[data-unavailable-reason]` 档保 `white-space: normal`）。
   **补则两件（代码评审两裁 · 2026-10-02）**——只读字段行收束：`.settings-field-readonly` 补缩省略四件 + 提示词面 `.settings-readonly-hint` `flex: 0 0 auto` 定尺不缩（短词面禁截）；**MCP 展开面 = 全显豁免**：`.settings-mcp-detail` 域内值面 `white-space: normal` + `overflow-wrap: anywhere`——行族通则本体 ∥ 折叠面摘要行零动。
   ② **动作紧凑右对齐**：动作钮全集 = 行尾单簇（簇首 `margin-left: auto` 既有；簇内续钮 `margin-left: 0`——`~` 兄弟规则，修现状多钮各自 auto 致散开）。
   ③ **卡界 = VSC 实形**：行 = 1px 描边（`--line`）+ 圆角 6px（实读 `thincoder-vscode/webview/settings.css:155-159`——`border: 1px solid var(--border)` ∥ `border-radius: 6px`；卡底零独立填充；用户 2026-10-02 10:27 裁「尽量跟 VSC 一致」——D24 描边归零基线全局零动 ∥ 仅本卡界让位）。
   ④ **层次/密度**：行内层次 = 主行（名 + 钥面）∥ 副行（muted 元数据）∥ 条件第三行（提示句）；密度 = 两行间距 4px ∥ 卡内边距 6px 8px（保持）。
2. **渠道段（锚点首段）= 两行卡列**——行根（`[data-provider]`）纵排：**主行**（`.settings-row-main`）= 名 + 钥面（masked ∥ 未设词）+ 当前标 + **动作簇**；**副行**（`.settings-row-sub`）= `模型 · baseURL`（串形照 VSC——缺段不落空分隔符）+ 不可用标 + 行尾代理开关。
   **动作簇 = 桌面动作全集**（功能面不删：修改/设钥 ∥ ✕删钥 ∥ 校验 ∥ 移除名——四件全保留、**序恒定 = 现盘序保持**）；**编辑态**（钥行编辑中）= 行内换形（沿 VSC `keyRowEdit`）：主行 = 名 + 钥面 + 输入（伸缩）+ 存 ∥ 消；代理 ∥ 移除 ∥ 校验暂撤（取消即回——既有行为零改）；**第三行**（条件）= 不可用原因句（`!hostBusy` 时——S3 分档保持；色 = `--accent`，对齐 VSC 失败句红系语义）。
   「不采用」（端差）：**状态点**（VSC `●`——键面已载配置态，加 = 净增密度）。
3. **其余六段——行族通则带上（逐段点清）**：模型与档位（当前 ∥ 档位 ∥ 候选行——nowrap + 省略；`使用` 右对齐既有）· agent 参数（字段行 nowrap；复选换拨杆）· MCP（行 = 名 + 形词 + 摘要省略中段 + 五动作右簇；展开面工具行 = 竖排三段 + 缩进 24px——VSC `.mcp-tool-row` 同形）· env（字段行 nowrap；两复选拨杆；测试行 nowrap）· 工具与服务（键行 ∥ 索引行 nowrap + 动作右簇）· 模型清单（consult ∥ advisor 行 nowrap + 省略 + 动作右）。
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

### 2.7 批 B 注 · 设置面档位控件（项 5）

5. **设置面档位控件（⑥ · 批 B 设计修订轮）**——「模型与档位」段档位 `select` 的现值 / 候选 / 写 / 回退四事（语义与载荷单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）：
   现值 = 该段当前所选模型（`settings.defaultModel` 复合串**模型段**）的渠道条目投影——取 `provider:list` 行 `effort`（**离线**，零探针）；**表外现值 ⇒ 自成一选项**（不吞 · 零改写；仅设置面——会话级读侧归 `null` ⇒ 无此态）；选项集 = `Auto` + `off`（`thinkOff` 真时在场）+ 逐模型枚举；`defaultModel` 缺 / 模型段空 ⇒ 档位控件**零节点**（禁假造）。
   写 = `settings:agent` 载荷 `{ tier: { provider, model, level } }`；`ok` 真 ⇒ 重取 `provider:list` 刷现值（不整页重挂 · 零乐观写）；`ok` 假 ∥ 抛 ⇒ 控件值回退回执前值 + `console.error`（零静默）。
   边界：本控件 = **渠道条目级默认**；逐模型精确控制 = 会话级档位（`docs/desktop/design/COMPOSER.md` §2 批 B 注项 1 ∕ 输入区行）——两面不互相顶替（需求 §3.5 项 6）。

### 2.8 重建保真 · 设置 ∕ 向导草稿保真（#604）

1. **设置 ∕ 向导草稿保真（#604）**——任一 settings 切片写落地不得清未提交草稿：`paintSettings` 单闸（`thincoder-desktop/renderer/mount-settings.mjs:125-133`——两树唯一重绘点）捕获 ∕ 复填；捕获域 = 携 `[data-draft]` 申报控件；非申报控件取新模型值（负向锁）；真机 P1（设置 + 向导两径）。单源 = 批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.2。

### 2.9 半行指针（本域半边在其本档）

- **设置面头主题控件半**：主题主条 = `docs/desktop/design/UI.md` §1「主题」行 ∥ §1「本批注（主题切换 · D33 · 2026-09-30）」；本域半边 = 本档 §2.1（面头三态钮族）。
- **空态 ∥ 启动态「引导向导」半**：空态 ∥ 启动态主条 = `docs/desktop/design/CHAT.md` §2（2a 已收编——空态）/ 本档 §2.6（启动态）；引导面全形 = `docs/desktop/design/UI.md` §1「批 B 追加注」。
- **会话级三值 ↕ 设置面默认值半**：会话级主条 = `docs/desktop/design/COMPOSER.md` §2（批 B 注项 1 ∥ 输入区行）；本域半边 = 本档 §2.1（模型与档位段）+ §2.7。

### 2.10 设置菜单升级批注（D39 ∥ D38 · 2026-10-02 · 台账 #817）

**本批注（设置菜单升级 · D39 ∥ D38 · 2026-10-02 · 台账 #817）**：本批定形**设置弹窗化（A 案）**——设置菜单七组项 ⇒ **应用内模态弹窗**（单组 ∥ 读写 ∥ 确认 ∥ 失败链全复用）；**现有设置页零动并存**（升级件——验收 OK 后再议撤，D39）。决策单源 = 本档 §1 **KD-68**；菜单侧（组树 ∥ 通道 ∥ 词面）= `docs/desktop/design/MENU.md` §1 **KD-67**；批档 = `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md`。

1. **弹窗体（形 ∥ 交互）**——背板（z-20）+ 居中卡（z-21；宽 ≤48rem；高 ≤视口；内滚）；三关 = 背板 ∥ ✕ ∥ 卡内 Esc（stopPropagation）；初始焦点 = ✕；`role="dialog"` + `aria-modal`；零焦点陷阱（边界）。
2. **七组复用链（表 · 指名）**——渠道 ∥ 模型与档位 ∥ agent 参数 ∥ MCP ∥ 运行环境 ∥ 工具与服务 ∥ 会诊与审查：
  段体组件（`providersBody` ∥ `modelBody` ∥ `agentBody` ∥ `mcpBody` ∥ `envBody` ∥ `toolsBody` ∥ `modelsBody`）+ 读取链（`loadProviders` ∥ `loadProviders` ∥ `loadAgent` ∥ `loadMcp` ∥ `loadEnv` ∥ `loadTools` ∥ `loadAgent`）+ 出口链（同一 `exits.handlers` 全表）——逐行全名 = 本档 §1 **KD-68** ③。
3. **开合 ∥ 状态**——`settings.modal` 切片（`null ∥ 组名`）；开 = 验证（`SCOPES`——`SECTIONS` 派生，定义位 = `thincoder-desktop/renderer/mount-settings.mjs:46`）→ 占槽拒（向导期）→ 切片写 + 本组复位 + 本组读取；关 = 清 + 本组复位 + 确认同清；`closeSettings()` 同清。
4. **重绘 ∥ 草稿保真**——第二闸（沿 #604 同形）+ 独立残件 + 失效集同滤；`refreshSettings` 在场判据 +`modal`。
5. **判据**——机检 = 批内件（波 2 三腿——本档 §4）；真机 = **T-DSK59**（本档 §5）；零新词键（复用段名 + `settings.close`）。
6. **边界**——现有页 ∥ 七段值面语义 ∥ 独立窗口（B）∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触；确认族叠序保留（40/41 在弹窗上）。

### 2.11 设置菜单组项收窄批注（D39 收正 · 2026-10-02 · 台账 #820）

**本批注（设置菜单组项收窄 · 2026-10-02 · 台账 #820）**：菜单组项集 **七 ⇒ 六**——「模型与档位」不入菜单（模型选择归输入面板——用户 2026-10-02 16:53 走查裁）；**设置页面七段零动**。本批**设置域（渲染面）零触**——弹窗校验面（`SCOPES`）保持**七名宽容**（菜单不发第七名——零改，支 A 裁定）；
`settings.modal` 切片 ∥ 复用链（七行——本档 §2.10 项 2）∥ `MODAL_READS`（七组——定义位 = `thincoder-desktop/renderer/mount-settings.mjs:49`）保持七名（设置页对齐；菜单可达面 = 六组弹窗）。决策单源 = 本档 §1 **KD-68** ④（闭集关系句）∥ 菜单侧 = `docs/desktop/design/MENU.md` §1 **KD-67**；批档 = `docs/batches/2026-10-02-settings-menu-trim.md`。

### 2.12 轻通道轮六批注（走查续调六 · 2026-10-02 · 台账 #819）

**本批注（轻通道轮六 · 2026-10-02 · 台账 #819）**：本注定形两笔走查续调（源 = 用户 2026-10-02 16:43 ∥ 16:56 走查——设置菜单升级批（#817）走查分流；批档 = `docs/batches/2026-10-02-light-round-6.md`）。

1. **渠道校验反馈就地化（笔一）**——`verify` 结果携行名（`name`）；**匹配行 ⇒ 本行呈现**（校验按钮态短形：`ok` ⇒「校验通过」∥ `fail` ⇒「校验失败」+ 锚 `data-verify-state`；结果明细行 = 既有 `verifyNode` 形落于本行）；**无行渲出结果**（名不在列表 ∥ kind 表外）⇒ 段末回退（`fallbackVerifyNode`）。
   **编辑态 = 校验钮 ∥ 结果明细行同撤**（校验暂撤口径含明细；取消即回——`settings-sections-providers.mjs:162` `|| editing` 径）。**结果跨开面留存 = 有意**（语义 = 「上次校验读数」：提交成功 ∥ 移除 ∥ 下次校验起手均已清（`mount-settings-exits.mjs:85 ∥ :117 ∥ :98`）；开面不清——零实现改）。
   **落档四（as-of 2026-10-02 实读）**：`thincoder-desktop/renderer/mount-settings-exits.mjs:102 ∥ :105`（结果携 `name: target`——零增行）∥ `thincoder-desktop/renderer/views/settings-controls.mjs:127`（`verifyControl` 三参——`state` 缺省零变 ⇒ 向导径原位）；
   `thincoder-desktop/renderer/views/settings-sections-providers.mjs:42 ∥ :133 ∥ :136 ∥ :162 ∥ :190`（`fallbackVerifyNode` 定义 ∥ `providerRowNode` 四参 ∥ 本行态 ∥ 本行明细）∥
   `thincoder-desktop/renderer/i18n-settings.mjs:67-68 ∥ :132-133`（+2 键 × 两语：`settings.providers.verify.okShort` ∥ `.failShort`）。**零契约 ∥ 零通道 ∥ 零 store 形改**（`verify` 对象 +1 字段）。
2. **弹窗头行粘顶（笔二）**——卡内滚 ⇒ `.settings-modal .settings-head` sticky 常驻（`position: sticky` ∥ `top: 0` ∥ `z-index: 1` ∥ 不透明底 = `--bg-raised`——标题 ∥ ✕ 不随体滚出）。落档一（as-of 2026-10-02 实读）：`thincoder-desktop/renderer/settings-modal.css:37-43`（零新变量 ∥ 零新断点）。
3. **两面同效**——渠道段体 = 页 ∥ 弹窗共用单源（本档 §2.10 项 2 ∥ §1 **KD-68** ③——零第二实现）⇒ 笔一在两面向同效；笔二限弹窗体。
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
- **首跑补全（`provider:save` 补写）**：保存成功后条目有效（`name+model+baseURL`）∧ `defaultModel` 缺失 ⇒ 同批补写 `defaultModel = "<name>:<model>"`（既有非空零覆盖；`active:true` 支照旧）；触面 = 任意保存（非「首个渠道」）；条件 = 仅缺失（无效非空不触碰——由词面准确引导）。单源 = `thincoder-desktop/src/main/providers.mjs` `providerSave`。
- **向导收尾（`finishWizard`——评审轮 1 改档口径）**：完成径 = **现行为零改**（复读 `configured` ⇒ 落槽 ⇒ 退场/重进——**不阻断完成**）；不设「默认模型」守卫——
  守卫态（渠道非空 ∧ `defaultModel` 缺）的提示 = 输入区发送失败行（词 `composer.send.noDefaultModel`——`docs/desktop/design/COMPOSER.md` §2 本批注）；
  判由 = 模型步候选同源零候选（见下「边界 ∥ 上抛」bullet）。
- **向导模型步「采用」接线**：`createWizard` 增注入 `useModel`（单一实现 = 出口族 `onUseModel`；注入点 = `thincoder-desktop/renderer/mount-settings.mjs`）——步 2 候选行「采用」由禁用转可操作（原接线缺口 = 既有；U-2 裁定纳入——步 2 可操作面闭合）。
- **本域相关边界 ∥ 上抛**：设置面「模型与档位」段 ∥ **向导模型步**候选**同源**——皆按**激活渠道**取数（`renderer/mount-settings-reads.mjs:33-39` / `:74-78`；
  向导步入径 = `renderer/mount-onboarding.mjs:55-58`）——`defaultModel` 缺失态两处**同零候选**（向导步「采用」钮判据三件含 `model.provider !== null`——`renderer/views/settings-sections.mjs:70-72`）
  ∥ 渠道行族无「设为当前」动作（`renderer/views/settings-sections-providers.mjs:133-165`）⇒ 该态 config 级补设路径缺失（**候选消解 = 本批 #842 落——见 §2.15**；批档 §2 U-9 登记收口）。
- **判据 ∥ 边界**：D11 不抵触（向导完成径零改）；`provider:setKey` ∥ `delKey` ∥ `setProxy` ∥ `settings:agent` 写语义零改；配置档 ∥ 设置页 ∥ 弹窗面零结构改；机检 = 批内件 T3 / T4 ∥ 源码判据。

### 2.15 缺激活渠道态补设路径（2026-10-04 · 台账 #842 · 设计轮）

- **病灶**（#840 设计轮 U-9 ∥ 批档 §2）：设置面「模型与档位」段候选**按激活渠道取数**（`thincoder-desktop/renderer/mount-settings-reads.mjs` `loadModels`——`:74-89`）；
  `defaultModel` 缺 / 不可解析 ⇒ 激活渠道 = `null` ⇒ 段归 `none` **零请求零候选**（禁假造候选）；渠道段行族无「设为当前」动作 ⇒ **config 级无 in-UI 补设路径**（死端）。
- **修法 = 全渠扇出补设（复用既有通道——零新 IPC ∥ 零新写面）**：`loadModels` 于 `provider` 空时改取 **`model:catalog`**（无载荷全渠扇出——白名单位次 39；单源 = `docs/desktop/design/IPC.md` §2「模型清单注」）
  ⇒ 候选行族 = `{ provider, id }`（全渠——渠失败零行沿 catalog 口径）；行「采用」经**既有出口** `onUseModel(provider, id)`（`renderer/mount-settings-exits.mjs` `useModel`——写 `settings:agent { patch: { defaultModel } }`）
  ⇒ 写后 `loadProviders` 回读 ⇒ 激活渠道出现、段转常规面。**写面 / 载荷 / 白名单零新**（两条既有通道）。
- **视图形**：`modelChoicesTree` / `modelRowNode`（`renderer/views/settings-sections.mjs`）候选行扩**带渠形**——行显示 `provider · id`（对齐 consult 行族先例 `views/settings-sections-models.mjs:54`）；
  「采用」判据由「激活渠非空」改「**行自带渠非空**」（全渠态下每行自携 provider）；当前项判定 = `current === "<provider>:<id>"`；空态 / 失败面沿既有（零候选 ⇒ 空态词；catalog 失败 ⇒ 段 `none` + `report`——零静默）。
- **向导模型步同源**：向导步 2 复用 `modelChoicesTree`（单一 owner）；**结构零改**——若读取链随 `loadModels` 收敛，向导态自然同效（实施轮实读确认——不扩结构）。
- **边界**：渠道行不加「设为当前」动作（被否——写面须先有模型，两步合成「采用」单步已足）；输入区指路句（`docs/desktop/design/COMPOSER.md` §2 本批注「本态零候选 ⇒ 不作指路」）**前提随本批改变**——指路随正候选（登记；随该域下次触碰）。

## 3. 文件账（本域）

### 3.1 本端文件清单与行数预算（设置族行 · 迁自 `PROJECT.md` §4.1——逐字）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/src/main/settings.mjs` | **331**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（325 ⇒ 331——`settings:agent` 两写径成功回执携 `providerState`（写后核读——第三刷新点主侧半））；前读 **325**（实读 2026-10-02——桌面 UX 收尾批（#697）实施落盘（320 ⇒ 325——`indexStatus()` 回执 +2 键透传（`dbBytes` ∥ `origins`）；**越 300 ⇒ 续期**（在册——`docs/desktop/design/PROJECT.md` §4.1 越层段；≤500 ✓））；前读 **320**（实读 2026-09-29——desktop-residuals-round3 波 C（S14a 随迁）后））） | 设置写面（`config:write`——键白名单仅 `locale`）+ 模型面（`model:list`——**批 B 补逐模型元素投影 `{ id, effortEnum, thinkOff }`**：主进程引核 `specForModel(model).reasoningEffortEnum` / `thinkOffPath(spec)` = 零副本，KD-18；**模型菜单全渠批**：`modelCatalog()` 全渠扇出处理体（`hasKeyOf` 渠滤 + `Promise.allSettled` 逐渠核探针 + `unavailable` 诊断项）+ `modelList` 探针径对齐（U1——过代理 ∕ 落账；回执行逐字零变）；单源 = `docs/desktop/design/IPC.md` §2「模型清单注」）+ agent 参数面板（`settings:agent`）——三面共用核 `loadConfig` / `writeConfigAtomic`（零自写盘）；**批 B · ⑥**：`settings:agent` 增 `{ tier }` 写径（主进程局部 `deleteKeyPath`（镜像 `setKeyPath`）+ 核 `thinkOffShape` / `thinkOffPath` 判据——单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）；**parity-b10**：patch 清除面（`null` ⇒ 删键）· slot 权威键拒（`slot-authority`）· advisor 档 helper 单源（`applyAdvisorEffort`）；**本批（#697 · 2026-10-02）**：`indexStatus()` 回执透传 `dbBytes` ∥ `origins`（核只读出口——端侧零 SQL） |
| `thincoder-desktop/src/main/providers.mjs` | **339**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（335 ⇒ 339——`provider:save` 成功回执携 `providerState`（第三刷新点主侧半））；前读 **335**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（315 ⇒ 335——B① 保存补写支 + `backfillDefaultModel`（仅缺失 ∥ 既有非空零覆盖 ∥ 排他 `active:true`））；**越 300** ⇒ 续期（在册——见 `docs/desktop/design/PROJECT.md` §4.1 越层段；≤500 ✓）；前读 **315**（实读 2026-09-29——口子清零二轮（S3 `failure` 键贯链）后））） | provider 族**八通道**（`provider:list` / `save` / `remove` / `verify` + **parity-b10 S1 ∕ S2 ∥ S5 四增**：`setKey` / `delKey` / `models` / `setProxy`——值面住核，端侧零形状构造；S3 写后探单点）；**批 B · ⑥ 增**：`provider:list` 逐行 `effort` 档位现值投影（离线——引核 `thinkOffShape` / `specForModel`，零副本）；**本批（#840 · 2026-10-03）**：`provider:save` 补写支（`defaultModel` 仅缺失——批档 §2 KD-5） |
| `thincoder-desktop/src/main/mcp-servers.mjs` | **262**（实读 2026-09-29 · W6 届盘复读——parity-b10 W3 两增 + R7 `mcp:tools`） | MCP 族**六通道**（`mcp:list` / `save` / `remove` / `tools` + **parity-b10 S8 ∕ S9 两增**：`update`（原位替换——仅落盘） ∕ `reconnect`（先断后连）——探活失败 ⇒ 零写盘） |
| `thincoder-desktop/src/main/settings-values.mjs`（R7 拆档产出） | **118**（实读 2026-09-29——desktop-residuals-round3 波 C（S14a 随迁 ∕ `slotAuthority` 五键）后） | 设置族值面 ∕ 遮罩族（`MASK = MASKED`（**核单源**——S13 import 核 `thincoder-core/agent-tools/settings.mjs`）∕ 叶展平 ∕ 点分路径写 ∕ `deepEqual`——自 `settings.mjs` 拆出） |
| `thincoder-desktop/src/main/config-watch.mjs`（R8 落子壳） | **41**（实读 2026-09-29） | config.json 外部写盘感知落子壳（事件源；去抖 ∕ 自写抑制在核件） |
| `thincoder-desktop/src/main/index-status.mjs`（R2 新档） | **72**（实读 2026-10-02——桌面 UX 收尾批（#697）实施落盘（67 ⇒ 72——`readIndexCounts` 回执扩 `dbBytes` ∥ `origins`（KD-69——核出口透传，端侧零 SQL））；前读 67（实读 2026-09-29——R2 落形后）） | 语义索引面处理体（`index:build` ∕ `index:status` 两通道）；**#697**：`readIndexCounts` 透传 `dbBytes` ∥ `origins`（KD-69） |
| `thincoder-desktop/src/main/settings-env.mjs`（R7 拆档产出） | **95**（实读 2026-09-29 · W6 届盘复读——parity-b10 S17 候选面出档净减 −43） | 主侧 env 族处理体（`settings:env` 读 ∕ 写 ∕ TestProxy 三支——写经核 `writeConfigAtomic`；**S17**：shell 候选 = 核单源 `thincoder-core/shell-candidates.mjs` 薄壳 re-export） |
| `thincoder-desktop/src/main/settings-tools.mjs`（R7 拆档产出） | **79**（实读 2026-09-29） | 主侧 tools 族处理体（`settings:tools` 读 ∕ 写两支——密钥值零下发） |
| `thincoder-desktop/renderer/views/settings.mjs` | **398**（实读 2026-10-02——设置体系升级批（#817）实施落盘（364 ⇒ 398：+`settingsModalTree` 单组树导出——组合既有私有面、零既有结构变更；**触属性复核（#817 收口 · 父侧裁）= 非结构性维持** ⇒ 拆档评估不触发）；前读 **364**（实读 2026-10-01——复核扫面收正批实施后（365 ⇒ 364——M7 悬引收正）；更前实读 2026-10-01——主题切换批实施后（336 ⇒ 365：面头三态钮族 + `themeNode`）；前读 336（实读 2026-09-29——desktop-residuals-round3 波 C（#615②）后）；**越 300** ⇒ 拆分预案 = 段体续拆） | 设置面七段（段体族住 `thincoder-desktop/renderer/views/settings-sections*.mjs`；**批 B**：模型候选消费随 `model:list` 元素形——逐项 `.id`，随动一行；**parity-b10**：控件族 ∕ 空态 ∕ 确认门 ∕ 拒码词键——形单源 = `docs/desktop/design/UI.md` §1「本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）」） |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | **164**（实读 2026-10-02——D37 实施落盘（309 ⇒ 164：渠道族出档（先拆后改）——re-export 面零改；越 300 消解——回线 ✓）；前读 **309**（实读 2026-09-29——口子清零二轮（S3 行标分档渲染）后）） | 设置面段体面（渠道 / 模型与档位 / MCP 三体 + 四出档段体 re-export——自 `thincoder-desktop/renderer/views/settings.mjs` 拆出〔批 9 拆分落形 · 300 行层 · 零语义变化〕；导出 `modelHeadNode` / `modelChoicesTree` 供首启向导第二步复用（单一 owner）——零 import 反向〔无环〕）；**批 B**：`模型与档位`段 `effort` 改 `select`（候选 = Auto + off 族 + 逐模型档位枚举——枚举单源 = 核 `reasoningEffortEnum` 投影；**off 在场判据 = 逐模型 `thinkOff`**；写面 `settings:agent` = 全局默认）；**⑥ 增**：现值取 `provider:list` 行投影（离线）· 表外现值自成一选项 · 失败回退（零静默）——单源 = `docs/desktop/design/UI.md` §1 批 B 注项 5 |
| `thincoder-desktop/renderer/views/settings-agent.mjs`（R8 拆档产出） | **230**（实读 2026-09-29——desktop-residuals-round3 波 C（#617-CH 只读行）后） | 设置面 agent 段体（具名控件表 `NAMED_FIELDS` + `agentBody` + **parity-b10**：子代理模型槽六件 ∕ advisor 档枚举 ∕ guard 开关） |
| `thincoder-desktop/renderer/views/settings-controls.mjs`（R7 拆档产出） | **145**（实读 2026-10-02——轻通道轮六 校验控件态参（137 ⇒ 145：`state` 三态 ∥ 短形词两键 ∥ `data-verify-state` 锚）；前读 **137**（实读 2026-09-29——桌面收尾批（#652 两形 `data-draft-scope` 作用域取值面）后；parity-b10 W2 S2 ∕ S7（+47）＋ RF 波 1 后）） | 设置面两导出面（`channelFormTree` ∕ `verifyControl`——渠道段与向导第二步共用单 owner；**parity-b10**：拉取模型控件 ∕ 预设标签形） |
| `thincoder-desktop/renderer/views/settings-sections-env.mjs`（R7 拆档产出） | **137**（实读 2026-09-30——桌面残债批 #679 作用域面（`env:shell`）后；Δ0） | 设置面 Environment 段体（proxy ∕ shell 两子节 + TestConnection） |
| `thincoder-desktop/renderer/views/settings-sections-mcp.mjs`（R7 拆档产出） | **185**（实读 2026-10-02——D37 实施落盘（183 ⇒ 185：摘要省略标记 ∥ 工具行竖排注）；前读 **183**（实读 2026-09-29——parity-b10 W3 S8 ∕ S9（+52）＋ RF 波 1 后）） | 设置面 MCP 段体（行 + Tools ∕ Test 两展开面 + **parity-b10**：编辑 ∕ 重连钮与结构化三型表单） |
| `thincoder-desktop/renderer/views/settings-sections-models.mjs`（R7 拆档产出） | **164**（实读 2026-09-29） | 设置面 Consultation & Advisor 段体（consult 行族 ≤5 + advisor 两 picker） |
| `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（D37 拆档产出 · 已落） | **已落 · 194**（实读 2026-10-02——轻通道轮六 校验反馈就地化（182 ⇒ 194：档头 ③ 注 ∥ `fallbackVerifyNode` 段末回退 ∥ 本行态 + 本行明细行）；前读 **182**（实施落盘——2026-10-02 实读；渠道段体 + 两行卡重构：行族 ∥ 动作簇 ∥ 编辑态 ∥ 第三行）） | 设置面渠道段体（`providersBody` + 行族：两行卡 ∥ 动作簇 ∥ 编辑态 ∥ 第三行——自 `thincoder-desktop/renderer/views/settings-sections.mjs` 出档；决策单源 = 本档 §1 **KD-66**） |
| `thincoder-desktop/renderer/views/settings-sections-tools.mjs`（R2 拆档产出） | **208**（实读 2026-10-02——桌面 UX 收尾批（#697）实施落盘（163 ⇒ 208——两读行（库大小 ∥ 逐 origin 行数——`data-index="db"` ∥ `"origin"`））；前读 **163**（实读 2026-09-30——桌面残债批 #679 作用域面（`tools:<kind>`）后；Δ0）） | 设置面「工具与服务」段体（embedding ∕ websearch 键行 + 索引状态行 + **S12** index 空态（`no-key`））；**#697**：索引状态行增两读（库大小 ∥ 逐 origin 行数——缺位 ⇒ 零节点） |
| `thincoder-desktop/renderer/views/onboarding.mjs` | **161** | 首启向导（无终端可完成；闸 = `config:read` 回执 `configured`（配置档存在性）——形态单源 = `docs/desktop/design/UI.md` §1 首启向导行） |
| `thincoder-desktop/renderer/mount-settings.mjs` | **251**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（249 ⇒ 251——B③ `createWizard` 注入 `useModel`——同一引用））；前读 **249**（实读 2026-10-02——设置体系升级批（#817）实施落盘（181 ⇒ 249：弹窗第二闸（捕获 ∕ 重建 ∕ 复填 + `modalResidue`）+ 开 ∕ 关装配 + 本组复位复用 + face 返回 + 读链扩 + `refreshSettings` 在场判据扩））；前读 **181**（实读 2026-10-02——菜单体系批实施落盘（179 ⇒ 181）；前读 **179**（实读 2026-10-01——复核扫面收正批实施后（184 ⇒ 179——M7 链删））；更前实读 2026-09-29——桌面收尾批（#652 失效集注入 ∕ 捕获后过滤）后；模型菜单全渠批 ＋ RF 波 1（#604）后；R8 三族出档；在册例外消解） | 设置面 / 向导接线出档（自 `app.mjs` 拆出——批 9 拆分落形；通道接线与表单装配，视图构树住 `thincoder-desktop/renderer/views/settings.mjs` / `thincoder-desktop/renderer/views/onboarding.mjs`；读数供给 ∕ 出口 ∕ 段出口三族另档 = 下行四行；**模型菜单全渠批**：`onProvidersChanged` 注入转口） |
| `thincoder-desktop/renderer/mount-settings-reads.mjs`（R8 拆档产出） | **192**（实读 2026-09-30——桌面残债批 #671 读面三写并持后；前读 189） | 设置面七段读数供给族（各段 load 面 + 激活渠道投影）——**parity-b10 零改**（S10 候选改由 `model:list` 切片派生——设计 +≤8 预算未用） |
| `thincoder-desktop/renderer/mount-settings-exits.mjs`（R8 拆档产出） | **270**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（264 ⇒ 270——设置写回执 `providerState` 落切片（`submitChannel` ∥ `useModel` ∥ `setTier` 三出口——第三刷新点渲染侧半））；前读 **264**（实读 2026-10-02——轻通道轮六 内容随动（`verify` 结果携 `name: target` 两处——零增行：264 ⇒ 264）；前读 **264**（实读 2026-10-02——设置体系升级批（#817）实施落盘（248 ⇒ 264：F-Esc 闸 `modal != null` 守卫 + `closeSettings` 同清 `modal` + 本组复位复用））；更前 **248**（实读 2026-10-02——菜单体系批实施落盘（242 ⇒ 248）；前读 **242**（实读 2026-10-01——复核扫面收正批实施后（238 ⇒ 242——M2 专件同清））；更前实读 2026-10-01——复查回填（机检对比；原表 227）；前史：桌面残债批 #679 `invalidateDrafts` 注入补传后；Δ0（≡ `PROJECT.md` §2.11#5 复核值）；前史：桌面收尾批（#652 `invalidateDrafts` 注入 ∕ 两形提交成功径声明）后；W6 届盘复读 = parity-b10 W2：S1 ∕ S2 ∕ S5 渠道段出口按族出档净减 −76）） | 设置面出口族 + 写路辅助（形式取值 ∕ Esc 关闭绑定；**模型菜单全渠批**：deps 解构 + 两写成功点调用——`provider:save` ∕ `provider:remove` ⇒ `onProvidersChanged`；**parity-b10**：渠道段出口出行——见 `mount-settings-segments-providers.mjs`） |
| `thincoder-desktop/renderer/mount-settings-segments.mjs`（R7 拆档产出） | **364**（实读 2026-09-30——桌面残债批 #679 三径声明后；前读 356（W6 届盘复读——parity-b10 W3 S8 ∕ S9 +110）；**越 300** ⇒ 拆分预案 = MCP 族再出一档（本批 = 行级小修——非结构性触碰 ⇒ 消解窗口顺延）） | 设置面段出口族（env ∕ 工具与服务 ∕ MCP + **parity-b10**：MCP 编辑 ∕ 重连出口） |
| `thincoder-desktop/renderer/mount-settings-segments-models.mjs`（R7 拆档产出） | **169**（实读 2026-09-29） | 设置面 models 段出口族（consult ∕ advisor 八出口） |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs`（parity-b10 W2 拆出档） | **150**（实读 2026-10-01——复核扫面收正批实施后（147 ⇒ 150——M2 注）；更前实读 2026-09-29——桌面收尾批（#652 钥存 ∕ 取消径 ∕ 两形提交成功径声明）后；desktop-residuals-round3 波 C（#615②）后） | 设置面渠道段出口族（S1 ∕ S2 ∕ S5 六出口——自 `mount-settings-exits.mjs` 按族续拆，债注③预案落形；**桌面收尾批**：两形提交 ∕ 钥存 ∕ 取消径三处声明缝） |
| `thincoder-desktop/renderer/mount-settings-segments-agent.mjs`（parity-b10 W3 拆出档） | **156**（实读 2026-09-29） | 设置面 agent 段出口族（S10 ∕ S11 ∕ S14b 出口与单键 patch 写路） |
| `thincoder-desktop/renderer/settings-confirm.mjs`（parity-b10 W2 新档 · S6） | **80**（实读 2026-09-29） | 设置面删除确认件（不可复得类四门前置确认——`.auto-confirm` 族复用 · 零新 CSS；`onConfirm` = 开框时捕获闭包；形对位 VSC `settings-widgets.js:77-105`） |
| `thincoder-desktop/renderer/settings-modal.mjs`（设置体系升级批（#817）新档 · 已落） | **已落 · 63**（实施落盘——2026-10-02 实读；单例弹层宿主——建 ∕ 刷 ∕ 关三件 + 树面 re-export（单源 = `thincoder-desktop/renderer/views/settings.mjs` `settingsModalTree`）） | 设置组弹窗宿主（背板 z-20 ∥ 居中卡 z-21；挂 `document.body`——沿 `settings-confirm.mjs` 先例；决策单源 = 本档 §1 **KD-68**） |
| `thincoder-desktop/renderer/settings-modal.css`（设置体系升级批（#817）新档 · 已落） | **已落 · 49**（实读 2026-10-02——轻通道轮六 头行粘顶（41 ⇒ 49：sticky ∥ `top: 0` ∥ `z 1` ∥ 底 `--bg-raised`）；前读 **41**（实施落盘——2026-10-02 实读；背板 ∥ 居中卡 ∥ 卡体 ∥ 体列；零新变量 ∥ 零新断点）） | 设置组弹窗样式（不进 `settings.css`——在册越线档零触） |
| `thincoder-desktop/renderer/mount-onboarding.mjs`（批 B · ⑥ 拆档） | **95**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（89 ⇒ 95——B③ 模型步「采用」接线（`useModel` 注入消费——缺 ⇒ 不落键）+ 注））；前读 **89**（实读 2026-10-01——复核扫面收正批实施后（90 ⇒ 89——M7 步 3 删）；更前实读 2026-09-30——#667 批后；批 B 末实读 88 ⇒ 90——判据两处 + 头注锚） | 向导接线族（自 `thincoder-desktop/renderer/mount-settings.mjs` 拆出——`presetValue` / `pickDir` / `nextStep` / `finishWizard` / `wizardHandlers`；共享项 `submitChannel` / `verifyChannel` / `loadModels` 留原档 ⇒ deps 注入）；通道面 = `docs/desktop/design/IPC.md` §2 设置族注；形态单源 = `docs/desktop/design/UI.md` §1 首启向导行 |
| `thincoder-desktop/renderer/settings.css` | **304**（实读 2026-10-02——D37 实施落盘（268 ⇒ 304：行族通则 + 两行卡 + 拨杆 + MCP 展开面 + ①④ 补则）；**越 300 ⇒ 在册越线不拆**（可读性优先——父裁 2026-10-02）——拆分预案 = 控件族出档评估（拟新增 `thincoder-desktop/renderer/settings-controls.css`）· 消解窗口 = 本档下次结构性触碰的批；前读 **268**（实读 2026-10-01——扁平化随动收口批（#713）落盘后（304 ⇒ 268——死面族出清））） | 设置面板 / 向导样式（分档理由 = `styles.css` 实读 284 贴 300 层——沿 `chat.css` / `pool.css` 先例）；**主题钮族（D33）带上**——次级键族成员（计数镜随 #713 收口以 `docs/desktop/design/UI.md` §1 为单源） |

**行数面机检**：本表迁出后，`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`）读取面 = `docs/desktop/design/PROJECT.md` §4.1（运行根单读）——本表行按同值同步；后续本域新档由落盘批在本表补行（沿 §4.1 纪律）。
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
| W1+W4 舱（端）：`renderer/app.mjs` ∕ `thincoder-desktop/renderer/index.html` ∕ `renderer/skin.css` ∕ `renderer/chrome.css` ∕ `thincoder-desktop/renderer/i18n.mjs` ∕ `views/statusline-segments.mjs` ∕ `i18n-composer.mjs` | **293** ∕ **55** ∕ **18** ∕ **450** ∕ **500** ∕ **224** ∕ **92**（R1 引导门：静态层 + `settleBoot` + 两样式档；I2–I5 键面 ∕ 注释；届盘复读与 §5 记录差见批档 §2.16） | W1+W4 |
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
| 3 | `thincoder-desktop/renderer/settings.css` | **268 ⇒ 304**（实施落盘）（+36：行族通则（nowrap ∥ 省略四件 ∥ 动作簇零化）+ 两行卡结构 + 拨杆形 + MCP 展开面竖排 + ①④ 补则；**逾 300 ⇒ 在册越线不拆**（可读性优先——父裁 2026-10-02）——拆分预案 = 控件族出档评估（拟新增 `renderer/settings-controls.css`）· 消解窗口 = 本档下次结构性触碰的批） | 样式面 |
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
| 3 | `thincoder-desktop/renderer/views/settings.mjs` | **364 ⇒ 398**（实施落盘）（+`settingsModalTree` 导出（单组树——复用档内私有 `noticeNode` ∥ `sectionStateNode` ∥ `sectionBody`）；**越 300 在册**（拆分预案 = 段体续拆）——本批触属性 = 导出面 +1（非结构性）） | 视图面 |
| 4 | `thincoder-desktop/renderer/mount-settings.mjs` | **181 ⇒ 249**（实施落盘）（弹窗第二闸（捕获 ∕ 重建 ∕ 复填 + `modalResidue`）+ `openSettingsModal` ∥ `closeSettingsModal` 装配 + face 返回 + 读取链表 + `refreshSettings` 在场判据扩） | 装配面 |
| 5 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **248 ⇒ 264**（实施落盘）（F-Esc 闸 +`modal != null` 守卫；`closeSettings` 同清 `modal` + 本组复位复用） | 出口面 |
| 6 | `thincoder-desktop/renderer/store.mjs` | **330 ⇒ 331**（实施落盘）（settings 切片 +`modal: null`；**越 300 在册**——本批触属性 = 既有切片 +1 键（**非结构性**——无新切片 ∕ 切片族结构零变；对照 #761 ∥ #764「有新增面」入册判据）⇒ 消解窗口顺延） | 状态面 |
| 7 | `thincoder-desktop/renderer/index.html` | **56 ⇒ 57**（实施落盘）（+`settings-modal.css` 链行——settings.css 后） | 骨架面 |
| 8 | 零改面 | `thincoder-desktop/renderer/settings.css`（304——新样式入新档；在册越线零触 ∥ 消解窗口未触发）∥ `renderer/settings-confirm.mjs`（80——只读复用 `closeSettingsConfirm`）∥ `views/settings-sections*.mjs`（六档）∥ `mount-settings-segments*.mjs`（四档）∥ `mount-settings-reads.mjs` ∥ `i18n-settings.mjs`（**零新键**——复用段名 + `settings.close`）∥ `views/onboarding.mjs` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC | 零触 |
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
补则两件——只读字段行收束（`.settings-field-readonly` 四件 ∥ 提示面 `.settings-readonly-hint` `flex: 0 0 auto`）∥ MCP 展开面豁免（`.settings-mcp-detail` 域值面 `white-space: normal`——行族通则本体零动））；
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
| T-DSK31 | 正常 / 边界 · 设置面档位控件（批 B · ⑥） | ① 「模型与档位」段选档位 = Auto / off / 枚举档各一例 ② 现值 = 表外字面串 ③ 陈旧面提交表外档位 / 表外 `provider` ④ `defaultModel` 缺 / 模型段空 ⑤ 不可 `off` 模型 ⑥ 写盘失败（mtime 冲突） | ① 载荷 `{ tier: { provider, model, level } }` ⇒ `ok` 真 ⇒ 重取 `provider:list` 后该行 `effort` = 所选档（**写后投影恒等**）；键面形 = Auto 删两键 / off 落 `thinkOffShape(spec)` + 删 `reasoningEffort` / member 清关思考记号（值 deep-equal `thinkOffShape(spec)` 时删 `thinking`）后置 `reasoningEffort` ② 现值**自成一选项**（不吞 · 零改写）③ 拒 `bad-level` ∥ `unknown-provider`——两径零写 + 控件回退回执前值 ④ 档位控件**零节点**（禁假造）⑤ off 选项缺席（该模型 `thinkOff` 假）⑥ 核 reason 直传（`mtime-conflict`）+ 零写 + 回退 | 机检面 = 单元测试档惯例（原三档随 2026-09-28 全清重置退场——现值投影 ∕ 选项集 ∕ 表外自成一选项 ∕ tier 三径两 reason ∕ 行 `effort` 投影两向） |
| T-DSK62 | 正常 / 边界 · 缺激活渠道态补设（#842） | ① `defaultModel` 缺 ∧ 双已配渠 ⇒ 开设置面模型段 ② 行「采用」点击 ③ catalog 失败（探针不可达） ④ 无已配渠 | ① 段 `ready` + 全渠候选行（`provider · id`） ② `settings:agent` 写 `defaultModel=<provider>:<id>` ⇒ 回读后段转常规（激活渠出现） ③ 段 `none` + 失败面（零静默）+ 零假造候选 ④ 候选空 + 空态词（禁假造——既有） | 批内件（#842 腿三：全渠候选 ∥ 采用写盘 ∥ 空 / 失败态） |
| T-DSK32 | 正常 · 首启空态引导（真 Electron） | 空 fixture 家（无 config ⇒ 无项目 / 无会话；另**预置**会话槽族档一枚〔`cwd` = 项目根——resume 开页落点〕）——新装首启 | ① 向导退场后：`[data-guide="no-project"]` 在场（含 `button[data-action="project:open"]`）∧ 输入框 `disabled` ② **真点**会话控制面项目钮（`button.session-project`——对话框夹具 `PROJ`，照 `docs/desktop/design/E2E-TESTING.md` §3.5 第 6 步）⇒ `[data-guide="no-message"]` ∧ 输入框非 `disabled` ③ 键入 + Enter ⇒ 输入值保留 ∧ `data-blocks="0"` ∧ console 出 `[composer] msg:send failed: `（不静默丢文本） | 机检面 = 单元测试档惯例（原集成档 `first-run-smoke.test.mjs` 随 2026-09-28 全清重置退场——重建时按 §4.1 登记）；十序断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 |
| T-DSK43 ④⑤ | 正常 · 小修族（设置面面 · 对齐第三批） | 设置面 agent 段具名控件 + `change` 即改即存；设置面开 ⇒ `Escape` ⇒ 关闭 | ④ 设置面 agent 段 = 具名控件 ∧ `change` ⇒ 即改即存（回执后回读同值）——离线可产；⑤ 设置面开 ⇒ `Escape` ⇒ 关闭（`[data-slot="settings"]` 清空）——离线可产（**F-Esc 判据**） | 判据载体 = 本档 §2.4；单源行（T-DSK43 全行）= `docs/desktop/design/PROJECT.md` §7（混装行——留原址） |
| T-DSK58 | 正常 / 边界 · 设置面样式收正（D37 · 真 Electron） | 真 Electron（fixture 家 `{"locale":"en"}`——`isConfigured` = 档存在）⇒ 启动 ⇒ 开设置面（`[data-slot="settings"]`） | ① 渠道段每行 = 两行卡（主行：名 + 钥面 + 动作簇（修改 ∥ ✕ ∥ 校验 ∥ 移除名）∥ 副行：`模型 · URL` + 代理开关）（**轮六**：校验钮触发 ⇒ 该行按钮 = 态短形（校验通过 ∥ 校验失败——锚 `data-verify-state`）+ 该行明细行；无行渲出结果（名不在列表 ∥ kind 表外）⇒ 段末回退）；② 长名 ∥ 长 URL ⇒ 省略不折、动作簇恒右对齐（窄窗拖至 ~800px 结构不变）；③ 钥编辑态 = 输入 + 存/消（代理 ∥ 移除 ∥ 校验暂撤——取消即回）；④ 复选控件 = 拨杆形（选中 `--accent`——亮 ∥ 暗两模式）；⑤ 全七段行族零参差折行；⑥ 全程零 `pageerror` | 机检面 = 批内件 `docs/batches/2026-10-02-desktop-settings-layout.test.mjs`（已建成 · 219 行 · 五腿 · 9 用例；随批留存 · 不进仓套件）；用例号自铸披露 = 本档 §6 **DH**（在册） |
| **R1** | 正常 · 一级全渠与选取（真机） | 配 ≥2 有 key 渠（含自定义） | 菜单一级行数 = 渠数 ∧ 行序 = 配置序 ∧ 每渠悬停列模型 ∧ 选取 ⇒ 槽写生效（跨端同槽复核） | 真机（父侧收口 · 桌面 + VSC 同配置对拍） |
| **R2** | 正常 · 跨端集合对照（真机） | 桌面 ∥ VSC 同 config | 桌面一级行集合 = VSC 一级行集合（集合相等——按 provider 键取集合，勿按显示文本：桌面分组标题 = 渠名 ∕ VSC = `providerLabel`） | 真机（父侧收口） |
| **R3** | 错误 · 失败渠诊断（真机） | 一渠 key 作废 | 该渠零行、零崩、控制台零静默（核落账失败项在） | 真机（父侧收口） |
| **R4** | 正常 · 会话切换随动（真机） | 会话 A/B 同渠不同模型 ⇒ 切换 | 模型钮随会话（同值回写不报错） | 真机（父侧收口） |
| **R5** | 正常 · 外部改档随现（真机） | 外部改 config（CLI 加渠） | 菜单随现（免重启） | 真机（父侧收口） |
| **R6** | 正常 · 设置面加渠随现（真机） | 设置面加渠 ⇒ 回输入区 | 菜单随现（免重启） | 真机（父侧收口） |
| **R7** | 边界 · 已配渠集 → 空（真机） | 设置面逐渠删至零 | 菜单保持现状（旧行驻留——有意边界；零崩、控制台零静默）；重新配渠 ⇒ 随推送复现（免重启） | 真机（父侧收口） |
| T-DSK59 | 正常 / 边界 · 设置菜单升级（D38 ∥ D39 · 真 Electron） | 真 Electron（fixture 家已配）⇒ 逐项走查（两波合一） | ① 菜单「设置」组在场（组名双语；条目序 = 设置… ∥ **六组项**（渠道 ∥ agent 参数 ∥ MCP ∥ 运行环境 ∥ 工具与服务 ∥ 会诊与审查——收窄批 #820）∥ 维护▸（两项）∥ 关于与快捷键▸（两项））② 「设置…」⇒ **现有设置页**开（`[data-slot="settings"]` 非空——零动）③ **六组项**逐开：弹窗在场（背板 + 居中卡 + 组名标题 + ✕）∥ 内容 = 该组段（态词 ∥ 行 ∥ 表单）∥ 真操作一面（如渠道段展开编辑态 ⇒ 存/消在）∥ 渠道段校验触发 ⇒ 本行按钮态短形 + 本行明细（**轮六**）∥ **头行粘顶（轮六）**：卡内滚 ⇒ 标题 ∥ ✕ 不随体滚出④ 关三路：Esc ∥ 背板 ∥ ✕（各关后 DOM 零残留；**页未被连带关**——同开场景）⑤ 键盘：开后焦点 = ✕ ∥ Tab 可达组内控件 ∥ 卡内 Esc 不冒（页保持开）⑥ 主题切换（亮 ∥ 暗）∥ 语言切换（en ∥ zh）⇒ 弹窗随动 ⑦ 维护两项 = 原生对话框零改 ∥ 关于 = 原生面板零改 ∥ 命令与快捷键 = `/help` 流内打印零改 ∥ 帮助组零改 ⑧ 现有页两入口（⚙ ∥ footer）零改 ⑨ 全程零 `pageerror` | 机检面 = 批内件 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（已建成 · 六腿；随批留存 · 不进仓套件）；用例号自铸披露 = 本档 §6 **DI（设置半）** |

（本域用例全文迁讫（T-DSK8 ∥ 9 ∥ 10 ∥ 13 ∥ 31 ∥ 32 ∥ 58 + **R1–R7**——真机条目，模型菜单全渠批）；
  批注齐平 = **模型菜单全渠批注**（机检面 = 单元测试档 `docs/batches/2026-09-29-model-menu-parity.test.mjs`（**300** 行 · 9 用例——handler 面（真核探针径 + 本地回环 HTTP 桩）· 通道四件套结构机检 · store 纯动作 · 触发六径；复跑 = `node --test docs/batches/2026-09-29-model-menu-parity.test.mjs`）；
  **不新增 T-DSK 用例号**——真机收口面，沿 flow 批「真机走查面登记」先例；**离线不可产面**（真 provider 往返 ∥ 真机交互）⇒ 人工走查 + 父侧真跑闭合（D16 义务））。
（T-DSK27（E2E 域）∥ T-DSK43 余项（外围混装）∥ T-DSK16–19 留 `docs/desktop/design/PROJECT.md` §7 原址。批内件（单元测试档）随批次档留存。）

## 6. 上抛（本域 · 迁自 `PROJECT.md` §10 涉行 · as-of 2026-10-02）

| 行 | 项 | 类型 | 处置建议 |
|---|---|---|---|
| **CG** | **S3 行标面未携 VSC `failure` 分档**（hostBusy ⇒「宿主繁忙」+ 抑制失败句） | **已裁 = 消（补做——2026-09-29 · 批 #673）**：桌面无宿主采样器 = **欠做**（非能力缺失）；补做三件 = `loop-sampler.mjs`（port ≈45 行）· `failure` 键贯链 · 词键（`i18n-settings.mjs`） | 单源 = `docs/desktop/design/UI.md` §1「本批注（parity-b10-ui…）」项 7（同拍收正）；判据 = 同宿主忙态两端同词 + 同抑制形 |
| **CH** | **`agent.engineering` 泛化行读面形未裁**（S14a 只裁写面——写必拒 `slot-authority` 而读面仍呈可编辑泛化行） | **裁：读面收窄**（假可供性消除——沿 D-TO11 判旨；已落（desktop-residuals-round3 波 C——2026-09-29；台账 #617））〔父侧 · 2026-09-29 · 可 revert〕 | 写面判据 = 本档 §1 **KD-49**；单源 = `docs/batches/2026-09-29-parity-b10-ui.md` §5 W3 报告级发现⑤ |
| **DH** | **`T-DSK58` 用例号自铸披露 + 设置面样式收正批（#812）两项已裁**（沿 T-DSK37–T-DSK57 先例——本批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **卡界载体 = 已裁**——按 VSC 实形收（1px 描边 + 圆角 6px——实读 `thincoder-vscode/webview/settings.css:155-159`；D24 描边归零基线全局零动——仅本卡界让位；用户 2026-10-02 10:27）；③ **拨杆形 = 已裁**——保留（**零改**限定对象 = 值面照搬 VSC（`thincoder-vscode/webview/settings.css:222-257`）；**相对现盘 = 新增四规则**（现盘复选无形——`thincoder-desktop/renderer/settings.css:213` 仅 `align-self`）；形变可逆——单点回退：删四规则还原原生复选）；**附 · 原则句**：跨端差异项后续变更两端保持同步（用户 2026-10-02 10:27「以后要改一起改」——本裁定 = 首例） | **已裁（自铸披露在册 · ②③ 两裁落——引用户 2026-10-02 10:27）** | 单源 = 本档 §1 **KD-66** ∥ 批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §2 |
| **DI（设置半）** | **设置菜单升级批（#817）设置侧披露**（菜单半 = `docs/desktop/design/MENU.md` §6 **DI**）：① 弹窗体 z 20/21（确认族 40/41 保留其上——删除确认叠序零改）；② 零焦点陷阱 = 边界（Tab 可出卡——沿确认件 ∥ 现状零陷阱）；③ 双面并存（页 ∥ 弹窗可同开；关弹窗不动页）；④ `settings.css` 在册越线保持（新样式入新档——消解窗口未触发）；⑤ **需求侧已收正**（主 agent 笔面——已落）：D36 动作集「五」⇒ **六**（+`openSettings`）——引需求卷 `docs/desktop/requirements/MENU.md:12` D36 行内收正句 ∥ `:19` 变更行 | 登记（披露） | 单源 = 本档 §1 **KD-68** ∥ 批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §2 |

（上列三行全文已迁讫（CG ∥ CH ∥ DH）；§10 本域余行（CT ∥ CV ∥ CX ∥ CY ∥ DB ∥ DD② 等他域行）留 `docs/desktop/design/PROJECT.md` §10 原址。）

## 变更记录

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
