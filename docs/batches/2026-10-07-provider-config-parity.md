# 2026-10-07 · provider 配置面三端对齐
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 18:07 + 18:10 + 18:13 三条原话（逐字见 §1）——「改吧」= 点火。
> 台账 = #1027/#1028/#1029（vscode · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源（用户原话 · 逐字）

- 18:07：「客户端的provider的配置界面上增加一个走不走proxy的开关，另外apikey放在最后根本不符合用户使用习惯，字段的布置应该按照填写顺序来，三个端都查一下。」
- 18:10：「另外，桌面端的配置界面为啥要别出心裁搞个不一样的？我他妈的在vsc端搞了这么久，做桌面端你要让我重新来一遍？你他妈的也太不尊重我的劳动了吧？」
- 18:13：「改吧，vsc里其实也很差，我就不知道为什么点了添加不弹窗，是不会啊还是咋的，搞得这么反人类。」

### 1.2 本批条目（三条 = 同一张表单面，一批做掉）

- **#1027 三端开关**：provider 配置面补「走 proxy」开关。现状：VSC 行 ∥ 桌面行已有（`settings-providers.js:190` ∥
  `settings-sections-providers.mjs:11`）；VSC 添加表单 ∥ 桌面表单 ∥ CLI 全无。运行期已读 `providers[].proxy`
  （`thincoder-core/proxy.mjs:50-55`）——缺的只是设置入口，零新语义。
- **#1028 字段序 + 桌面对齐**：API key 不垫底（用户填写序）；**源 = VSC 表单（VSC 为准，D21 精神）**，桌面**逐元素**照
  VSC（不止 key 位——格式位 ∥ 拉取行位 ∥ active 等全表对齐），CLI 字段序 ∥ 开关语义同向（TUI 不强行 1:1，差异上抛）。
- **#1029 弹窗形态**：VSC 添加渠道现为**内联就地展开**（`:195` `_toggleAddForm(true)`——打开时列表让位，`:258`），
  非弹窗——用户报「点了添加不弹窗…反人类」⇒ 改「弹窗」形态；桌面照搬同形。

### 1.3 父侧口径（不漂）

- **VSC = 源**（用户长期定型的面 + D21「值以 VSC 实值为准」）；桌面逐元素照搬；**禁自创第三套形态**（父侧前一条
  「三端统一序」自作主张已被用户斥，作废）。
- 运行期代理语义 ∥ 行/列表侧既有开关 ∥ #1026 已修面（探针路由）∥ 服务端面 = **零动**。
- CLI 面差异（TUI 无法 1:1 克隆浏览器表单）⇒ 设计轮逐条上抛，不许硬凑。

### 1.4 勘察坐标（已实读——设计轮免重复勘察）

- VSC：`webview/settings-providers.js:190`（行开关）∥ `:195-224`（表单：name→url→format→[拉取]→model→key，key 垫底）∥
  `:116-128`（探针消息）∥ `src/extension/settings.mjs:129-136`（行开关写面）——设计档家位 = `docs/vsc/design/SETTINGS.md` ∥
  `docs/vsc/design/WEBVIEW-PROTOCOL.md`；需求家位 = `docs/vsc/requirements/WEBVIEW.md`。
- 桌面：`renderer/views/settings-controls.mjs:69-121`（channelFormTree：name→baseURL→[拉取]→model→format→key→active）∥
  `renderer/views/settings-sections-providers.mjs:11`（行开关）∥ `src/main/providers.mjs:63`（行载荷 proxy）∥ `:273`（探针）；
  设计档家位 = `docs/desktop/design/SETTINGS.md`。
- CLI：`tui/provider-admin.mjs:39-86`（addProviderFlow）∥ `:113-137`（setKeyFlow）∥ `tui/wizard.mjs:75`（WIZARD_NEXT 步骤链）∥
  `/config` 代理菜单 = `tui/cmd-config.mjs:113-165`（仅全局面）。

### 1.5 勘察补充（2026-10-07 18:2x · 父侧——用户「桌面端也一起看」后补盘 · 设计轮输入）

**桌面结构事实（对齐表素材）**：
- **桌面设置 = 弹层宿主**（`renderer/settings-modal.mjs`：背板 + 居中卡 + Esc + 初始焦点=✕ ∥ `settings-confirm.mjs`：删除确认弹层「背板+两键+焦点落取消」）
  ——**VSC = 侧栏面板**（`webview/index.html:65-71` `#settings-panel`），**无弹层先例**。⇒ #1029 弹窗落形可用桌面这套现成件形作参照。
- 桌面渠道卡 = **两形表单常驻**（`views/settings-sections-providers.mjs:182-188` 预设表单 + 自定表单无条件入体）；VSC = 一张表单、按钮唤出（`:195/:70-82`）。
- 桌面行动作簇 = 四件（改键 ∥ ✕删钥 ∥ **校验** ∥ 移除，`:121-141`）；VSC = 两件（「密钥」+ `−`，`settings-providers.js:183-186`）。
- 桌面表单含「设为当前渠道」勾（`settings-controls.mjs:106-110`）+ 行显「当前」标；VSC 表单无、行不显（`:178-193`）。
- 桌面自定形 model = **可手输**文本框（+ 探果 datalist 候选，`settings-controls.mjs:88-91`）；**VSC 自定形 model = 拉取下拉**，空 ⇒ 拒存（`settings-providers.js:133-138`「请先拉取模型」）。
- 桌面行字段序（自定形）= 名称→baseURL→[拉取]→模型→格式→key→当前（`settings-controls.mjs:85-110`）——与 VSC 现行序不同（VSC：名→url→格式→[拉取]→模型→key）。

**设计注意（#1027 开关语义——须给用户可裁选项）**：运行期 = `entry.proxy ∧ proxy.model` 双条件（`core/proxy.mjs:50-55`）；现状 UI 里行勾选在全局 `proxy.model` 关时**静默无效**（仅 tooltip 说明）；文案露代码 token（`settings.proxyModel` zh = 「模型请求（proxy: true 的 provider）」）。用户 18:07 口径「每个 provider 单独选」⇒ 双条件的去留 = 设计轮摆选项上抛。

**父侧盘点清单（VSC 真渲染 + 两端码面实读，2026-10-07 18:2x——清单已交用户圈点；圈中项=新条目/并批，未圈项不留悬浮）**：自定渠道「不拉取存不了」死路（VSC `_paSave:133-138`）∥「选择模型…」空表静默无反应（`_defaultModelMenu:104`）∥ 硬编码英文串（`:25/:189` + title `:168`）∥ 删除 glyph 不一致（`−` vs `✕`）∥ MCP env 逗号分隔串 ∥ 术语漂移（「密钥」/「API Key（可选）」/「API 密钥」——对照 2026-10-07 16:43 定音「API Key」）。

### 1.6 评审转记与勘误（2026-10-07 18:3x · 父侧）

- **勘误**（机械更正 · 父侧直执行 · 评审 #1026 发现 4 转记）：§1.2 ∥ §1.4 ∥ §1.5 三处引 `core/proxy.mjs:50-55`（运行期双条件）——`isLoopbackTarget` 插入后实为 **`:67-70`**（`injectProxy` :67 ∥ 判定式 :70）。
- **实现轮携带项**（评审 #1026 发现 7 移交）：`thincoder-vscode/src/extension/settings.mjs:225` 注释「`config.proxy.web` 只管 websearch/fetch」与权威档相抵（PROXY.md §4：web 旗唯一活消费面 = CLI Test connection 探针；web 工具走逐次 `args.proxy`）——本批实现轮同面改述（该函数 220-234 本就随本批改签名），不另开笔。

### 1.7 设计评审轮 1 与裁决（2026-10-07 18:5x · 父侧）

- **独立评审**（advisor design · 代点火 · 自动跑授权内）：**VERDICT: changes-required**——🔴 1 ∥ 🟡 7 ∥ 🔵 4（全表 = §3 轮次 1，含逐条证据 file:line）；因未决 🔴 ⇒ 本轮无批准信号（token/designId 未落）。
- **🔴 实核与定调**（父侧实读）：#1031 落形与 `docs/core/design/PROVIDER.md:291/:296`（M8/M9「无手输绕过」∥「不加 UI 手输行」——『open 项：无』）∥ `:515`（D-PR16 准入判据）机制级相抵；桌面对形已存（`docs/desktop/design/SETTINGS.md:197`「#1031 零改——手输 + 探果 datalist ∥ 保存不依赖拉取（源对齐基线）」）⇒ 裁决 = **收正/限定 + 取代关系登记**（依据 = 用户 18:31 授权内含 #1031 + 桌面既成形基线；非推翻）。
- **处置**：#1–#6、#8–#12 → **修复轮已派**（eng-designer · round=fix · 只按号定点收正）；#7（A2 双闸）= 父侧 §4 批准面呈请（含 A 案可见后果）。
- **续链**：修复轮落定 → 父侧核验 → 重评审（轮 2）→ pass 出 token → §4（你的待裁项一并呈上）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成（接手轮（前轮中断接稿）——审计前轮 6 档草稿 + 扩面四件（#1031–#1035）一次成稿；覆盖 #1027–#1036 全列；上抛 6 项见 2.9）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**接手轮（2026-10-07 · 前轮 designer 外部中断接稿）：**本稿 = 通读审计前轮 6 档未提交草稿 → 对照批档 §1 ∥ 父侧扩面令（18:31）补全 → 一次成稿。§2 内容 = 2.1–2.10。

### 2.1 本批条目（覆盖 · 父侧 2026-10-07 一次并入——此后不再增量）

| # | 条目 | 落法一句话 |
|---|---|---|
| **#1027** | 三端「走 proxy」开关（用户 18:07） | 添加入口补开关：VSC 表单 `#pa-proxy` ∥ 桌面单表 `name="proxy"` ∥ CLI 添加流代理问句——写同一键 `providers[].proxy`（`true` 写 ∥ 缺 ∥ 非真 ⇒ 零键）；行侧既有开关零动 |
| **#1028** | 字段序（API Key 不垫底） | 源 = VSC 表单：名称→baseURL→格式→API Key→走 proxy→拉取→模型；桌面逐元素照搬；CLI 同向（proxy 问句 + 探针收敛；残余问序端差登记——2.9⑤） |
| **#1029** | VSC 添加渠道 = 弹窗（用户 18:13） | 新档 `settings-provider-dialog.js`（`.auto-backdrop` + `#prov-add-dialog` + `.settings-dialog`）；桌面骑 D39 宿主（`settings.modal` 值 +`providerAdd`）同形 |
| **#1031** | VSC「拉取失败不可存」死路 | `#pa-model` 改手输文本框 + 候选 datalist（对齐桌面形）；不拉取可存；model 空 ⇒ 新词 `settings.modelRequired`（`fetchModelsFirst` 随实现净删） |
| **#1032** | 「选择模型…」空表静默 | 空表 ⇒ `#defaultmodel-hint` 行内提示（新词 `settings.pickModelEmpty`）+ 零菜单 |
| **#1033** | 三处硬编码英文 ⇒ 词表 | `(no default model)` ×2 ⇒ `settings.noDefaultModel`；`:168` title ⇒ `settings.defaultModelTitle`；审计补：同线中文硬编码两处 ⇒ `settings.providerHostBusy` ∥ `settings.providerUnavailable`（en 面现显中文 = 缺陷类） |
| **#1035** | 术语统一「API Key」（用户 16:43 定音） | 两端 i18n 词值改：VSC 6 键 ∥ 桌面 6 键（zh 裸「密钥」清零、en「Key ∥ API key」规范化）；键数不变 |
| **#1034** | `−` vs `✕` 符号 | **待裁登记**（选项 + 建议 = 2.9①；本批不实施） |
| **#1036** | MCP env 逗号分隔串 | **批外另立**（不碰） |

**零动面（冻结）**：运行期代理语义（核判据体）∥ 核 `probeTargetOf` 判据体 ∥ 行/列表侧既有开关 ∥ #1026 已修面（不回归）∥ 服务端面。
**探针耦合裁定（父裁 · 已载 VSC §2.16 ③′ · 不翻案）**：勾选 ⇒ 拉取按 `probeTargetOf` 同判定；未勾 ∥ 缺省 ⇒ 直连；桌面「取全局 `proxy.web` 旗」= #1026 镜像缺陷本批修；CLI 三探针点向同一判定收敛。

### 2.2 设计档落点（六档 · 本批修订 + 逐档动作）

| 档 | 落点 | 动作 |
|---|---|---|
| `docs/vsc/design/SETTINGS.md` | §2.16（新增）+ 扩面块 + §5 U-S14–16 + 变更记录 | **改+补**（本轮落：弹窗 ∥ 字段序 ∥ 开关 ∥ 拉取路由 ∥ 扩面四件） |
| `docs/desktop/design/SETTINGS.md` | §1 KD-75（+ ⑨ 计数随动）∥ §2.16 尾扩面块 ∥ 变更记录 | **改+补**（本轮落：桌面同形 + 扩面随动） |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | §13 两行（`addProvider` ∥ `testProvider` 载荷 +`proxy`） | 留（审计通过） |
| `docs/core/design/PROVIDER.md` | §8 代理条（写面 + 探针单源指针） | 留（审计通过） |
| `docs/desktop/design/IPC.md` | §2 两行（`provider:save` ∥ `provider:models` 载荷 +`proxy`） | 留（审计通过） |
| `docs/desktop/design/PROJECT.md` | §2 KD 索引 +KD-75 | 留（审计通过） |

草稿修正两处（本轮复核改）：① `providerAddFormTree` 命名弃 ⇒ `channelFormTree` 内容演进（名不换 ⇒ 调用面零改，省 rename 波及）；② 桌面初始焦点 ✕ ⇒ 首控件（源对齐——登记）。

### 2.3 机制设计

**VSC（源）**
- **弹窗（#1029）**：新档 `webview/settings-provider-dialog.js`——背板 `.auto-backdrop`（`composer.css:407-413`，z 999）+ 卡 `#prov-add-dialog.settings-dialog`（z 1000；`role="dialog"` + `aria-modal="true"` + `aria-label` = `settings.addProviderTitle`）挂 `document.body`；开 = `_openAddProviderDialog()`（`#prov-add-btn` onclick——`:195`）；关五路（保存 ∥ 取消 ∥ 背板 ∥ 框内 Esc〔`stopPropagation`〕∥ `closeSettings()` 增调 `closeAddProviderDialog()`——`settings.js:163-172` 与 `closeConfirmPopover()` 同拍）；初始焦点 `#pa-type`（+50ms）；`_addDialogEpoch` 护在飞探果。
- **字段序（#1028）+ 模型控件（#1031）**：`pa-type → pa-preset-info → [pa-name → pa-url → pa-format] → pa-key → pa-proxy → [拉取行 → pa-model] → 保存 ∥ 取消`；`#pa-model` = `<input id="pa-model" list="pa-model-candidates">` + datalist；探通填候选（不自动选中）、探败清候选零清键入；model 空 ⇒ `settings.modelRequired`；**不拉取可存**（走查要点）。
- **开关写面（#1027）**：`addProvider` 载荷 +`proxy` ⇒ `panel-messages-settings.mjs:70-71` ⇒ `settings.mjs:124`（纯透传）⇒ 核 `addProviderEntry`（`config-io.mjs:223`）受 `proxy`：`=== true` ⇒ `entry.proxy = true` 同批落盘；缺 ∥ 非真 ⇒ 零键。行开关 `handleSetProviderProxy`（`settings.mjs:129-136`）零改。
- **拉取路由（③′）**：`testProvider` 载荷 +`proxy` ⇒ `handleTestProvider`（`panel-messages-settings.mjs:142-146`）⇒ `testProviderConnection({ baseURL, apiKey, format, proxy })`（`settings.mjs:220-234`）⇒ 目标 = `probeTargetOf({ name: "", baseURL, apiKey, format, proxy: proxy === true })` ⇒ `listModels(target)`。
- **空表提示（#1032）**：`_defaultModelMenu`（`:94-113`）空表 ⇒ `#defaultmodel-hint`（`.prov-hint` 形复用；词 `settings.pickModelEmpty`）+ return。
- **词面（#1033 / #1035）**：两语 locales——净 +5 键（+6 −1）+ 值改 6 键；明细 = VSC §2.16 ④。

**桌面（照源）**
- **弹窗（#1029）**：骑 D39 宿主——`settings.modal` 值 +`providerAdd`（`SCOPES` 七 ⇒ 八；`mount-settings.mjs:46`）；`MODAL_READS` +1 = `loadProviders`（`:49-57`）；`settingsModalTree` `providerAdd` 支 = 标题 `settings.addProviderTitle` + 体 = 单表；关/背板/Esc/第二闸/z 族 20/21 全复用；初始焦点 = 首控件（源对齐——KD-68 ⑥ ✕ 默认之表单例外，登记）。
- **单表**：`channelFormTree` 内容演进（名不换 ⇒ 调用面零改；`settings-controls.mjs:69-122`）——类型 `select[name=preset]` + 预设信息行 + 条件块 A（name/baseURL/format）+ key + proxy（D37 拨杆；`proxyRow`/`proxyRowTitle` 同词键）+ 条件块 B（拉取行 + model〔手输+datalist 既有〕）+ 保存/取消；`active` 复选条件渲染（`activeDefault !== undefined`——向导步 1 保留）。
- **段体（页 ∥ 弹窗两面同源）**：双表单退场 ⇒ 添加钮（`settings:addProvider`；词 `settings.addProvider` = "+ Add"/"+ 添加"——新键）。
- **写面**：`provider:save` 载荷 +`proxy` ⇒ `providerSave`（`src/main/providers.mjs:131-160`）⇒ `addProviderEntry` 同键；**探面收敛**：`mount-settings-segments-providers.mjs:132` 载荷 +`proxy` ⇒ `providers.mjs:273-275` 改 `probeTargetOf`（修 `proxy.web` 旗取用）。
- **词面（#1035）**：6 键值改（`keyLabel` ∥ `noKey` ∥ `addKey` ∥ `deleteKey` ∥ `model.setKey` ∥ `composer.send.noProvider`）。

**CLI（同向）**
- **添加流**（`tui/provider-admin.mjs:39-86`）：两支各 +代理问句（key 后、流尾探针前；picker 两行——「No (direct)」缺省 ∥「Yes (proxy)」⇒ `cfg.proxy = true` + 同批 `persistRaw` 落条；Esc/No ⇒ 零键零写）。
- **探针收敛**：`probeChannelFlow`（`:27-28`）∥ `cmd-config.mjs:296` ∥ `wizard.mjs:216` 目标改 `probeTargetOf(...)` 构（执行体 `tui/model-catalog.mjs:63` 与返形零改；`setup-wizard.mjs:60` 未落盘 ⇒ 无旗 ⇒ 直连缺省，零改）。
- **问序**：name→baseURL→model→format→key→proxy→探针（残余端差登记——2.9⑤）。

**核**：`addProviderEntry` 受 `proxy`（`config-io.mjs:221-259`——`=== true` ⇒ `entry.proxy = true`）；`probeTargetOf`（`provider-flows.mjs:79-90`）∥ `injectProxy`（`proxy.mjs:67-72`）**零改**（本批 = 消费面扩面）。

### 2.4 逐元素对齐表（VSC 每元素 → 三端落点）

| # | 元素 | VSC 源（file:line） | 桌面落点 | CLI 落点 |
|---|---|---|---|---|
| 1 | 添加入口钮 | `settings-providers.js:195`（`#prov-add-btn`；词 `settings.addProvider` = "+ Add"/"+ 添加"） | 段体添加钮（新；`settings:addProvider`；同词） | `addProviderFlow`（model-picker 链路唤起） |
| 2 | 遮罩 | `.auto-backdrop`（`composer.css:407-413`，z 999） | `settings-modal-backdrop`（`settings-modal.css:10-15`——D39 宿主） | 无（TUI） |
| 3 | 卡 | `#prov-add-dialog` + `.settings-dialog`（新段；z 1000；role/aria-modal/aria-label） | `div.settings-modal`（`views/settings.mjs:358-362`——宿主既有） | 无 |
| 4 | 标题 | `.settings-subtitle`（`:201`；`settings.addProviderTitle`） | `header.settings-head` 标题 = `settings.addProviderTitle`（新键） | picker 标题 "Add Provider"（`provider-admin.mjs:47`） |
| 5 | 开 | `_openAddProviderDialog()`（单例；重置；焦点） | `openSettingsModal("providerAdd")`（`mount-settings.mjs:144-157`） | `addProviderFlow()` |
| 6 | 关·保存 | `:234`（发消息后关） | 提交 ⇒ 宿主关（KD-68 关径） | 流程落盘后自退 |
| 7 | 关·取消 | `#pa-cancel-btn`（`:223`/`:235`） | 取消钮（`settings:modalClose`） | Esc 全程可退（`:48`） |
| 8 | 关·背板 | 背板点击 | `settings-modal-backdrop` onClick | 无 |
| 9 | 关·框内 Esc | 卡 keydown + `stopPropagation` | 卡内 Esc + `stopPropagation`（`views/settings.mjs:362`） | 无（Esc = 退流） |
| 10 | 关·面板同清 | `closeSettings()`（`settings.js:163-172`）→ `closeAddProviderDialog()` | `closeSettings` 同拍清 modal（KD-68 既有） | 无 |
| 11 | 初始焦点 | `#pa-type`（+50ms） | 首控件（源对齐；KD-68 ✕ 默认例外——登记） | 首问（name） |
| 12 | 类型选择 | `#pa-type`（`:203-206`；预设项 + `customChoice`） | `select[name=preset]`（新；预设项 + `customChoice` 新键） | 预设 picker（`:40-47`——既有） |
| 13 | 预设信息行 | `#pa-preset-info`（`:208`；`:21-25`） | `[data-preset-info]`（新） | picker 行 text 含 desc/model（`:43`） |
| 14 | 名称 | `#pa-name`（`:210`） | `input[name=name]`（`:85`） | `askQuestion`（`:50`） |
| 15 | baseURL | `#pa-url`（`:211`） | `input[name=baseURL]`（`:86`） | `askQuestion`（`:53`） |
| 16 | 格式 | `#pa-format`（`:212-214`） | `select[name=format]`（`:92-97`） | picker（`:57-61`） |
| 17 | API Key | `#pa-key`（`:221`；词 `keyOptional`） | `input[name=key]`（`:105`；词 `keyLabel`——#1035 值改） | `askQuestion`（`:68`/`:83`）+ `setProviderKey` |
| 18 | 走 proxy | `#pa-proxy`（新；词 `proxyRow`/`proxyRowTitle`） | 复选 `name="proxy"`（新；D37 拨杆；同词键） | 代理问句（新；key 后） |
| 19 | 拉取行 | `#pa-fetch-btn` + `#pa-conn-status`（`:215-218`） | `fetchRowNode`（`settings-controls.mjs:54-65`——既有；载荷 +`proxy`） | **无**（手输模型 + 流尾探针——差异登记 2.9⑤） |
| 20 | 模型 | `#pa-model`（`:219`）⇒ 手输 + datalist（#1031 改） | `input[name=model]` + datalist（`:88-91`——既有；**源基线**） | `askQuestion`（`:55`——手输） |
| 21 | 保存 | `#pa-save-btn`（`:222`/`:234`） | 提交钮（`settings:addCustom`/`settings:addPreset`） | 流程式（无钮） |
| 22 | 取消 | `#pa-cancel-btn`（`:223`/`:235`） | 取消（`settings:modalClose`） | Esc |
| 23 | 表头 | `.settings-subtitle`（`:201`） | 卡标题（modal head） | picker 标题 |
| 24 | 行代理开关 | `:190`（词 `proxyRow`/`proxyRowTitle`） | `settings-sections-providers.mjs:94-103`（同词键） | /config 全局面（`cmd-config.mjs:113-170`；行级不适用） |
| 25 | 「设为当前」 | **无**（VSC 表单无此元素） | 表单退场（KD-75 ⑤；等价 = 模型段「采用」∥ B① 补全） | defaultModel 子菜单（`:289-335`） |
| 26 | 行删除符 | `−`（`:48` ∥ `:185`） | `✕`（`keyDelete` 值）+「移除」词（`:139`） | removeProviderFlow（词） |
| 27 | 默认模型行 ∥ 空表 | `:166-172` ∥ `:94-113`（#1032 提示落此） | **无对应元素**（模型段候选行——差异登记） | /config defaultModel 子菜单（差异登记） |
| 28 | 键编辑钮词 | `setKey`/`addKey`（#1035） | `changeKey`/`addKey`（#1035） | `setKeyFlow`（`:113-121`——零改） |

### 2.5 弹窗落形锚（全量）

**VSC**：背板 `.auto-backdrop`（body 直挂；z 999）∥ 卡 `#prov-add-dialog.settings-dialog`（z 1000；`role="dialog"` + `aria-modal="true"` + `aria-label` = `settings.addProviderTitle`）∥ 体 `.settings-card-body` + 首件 `.settings-subtitle`（同词）∥ 件：`#pa-type` ∥ `#pa-preset-info` ∥ `#pa-custom-fields`（`#pa-name` ∥ `#pa-url` ∥ `#pa-format`）∥ `#pa-key` ∥ `#pa-proxy` ∥ `#pa-custom-tail`（`#pa-fetch-btn` ∥ `#pa-conn-status` ∥ `#pa-model` + `#pa-model-candidates`）∥ `#pa-save-btn` ∥ `#pa-cancel-btn` ∥ 开 = `window._openAddProviderDialog()` 单例 ∥ 关五路（2.4 行 6–10）∥ 焦点 `#pa-type` ∥ `_addDialogEpoch` 代际。
**桌面**：卡 = 宿主 `div.settings-modal`（role/aria 既有）+ `settings-modal-backdrop` ∥ 头 `header.settings-head`（标题 `settings.addProviderTitle`；✕ = `settings:modalClose`）∥ 体 `div.settings-modal-body`（失败串 scope = `providers` ∥ `panel` + 单表）∥ 单表件 = `channelFormTree` 节点（`data-form="preset"|"custom"`；`data-preset-info`；`name=proxy` 复选；`data-action` 提交/取消）∥ 开 = `settings:addProvider` ⇒ `openSettingsModal("providerAdd")` ∥ 焦点 = 首控件。

### 2.6 受影响文件与测试面

**受影响文件（行数 = 本轮实读（as-of 2026-10-07）；Δ = 预估）**

| 端 | 文件 | 现 | Δ（预估） |
|---|---|---|---|
| VSC | `thincoder-vscode/webview/settings-provider-dialog.js` | **新** | ≈200（表单族迁入 + 弹窗开合） |
| VSC | `thincoder-vscode/webview/settings-providers.js` | 287 | ≈−90（表单族 ∥ pa 绑定 ∥ `updateTestProviderResult` 迁出；+`#defaultmodel-hint`） |
| VSC | `thincoder-vscode/webview/settings.js` | 191 | +≈3（import 收正 + `closeSettings` 增调 `closeAddProviderDialog()`） |
| VSC | `thincoder-vscode/webview/settings.css` | 386 | +≈14（`.settings-dialog` 小段——越 300 在册档，结构零触碰） |
| VSC | `thincoder-vscode/locales/en.json` ∥ `zh.json` | 285（282 键） | 键净 +5（+6 −1）⇒ ≈287 键 ∥ ≈291 行 |
| VSC | `thincoder-vscode/src/extension/settings.mjs` | 404 | +≈8（`testProviderConnection` +`proxy`；越 300 在册档 ✓ <450） |
| VSC | `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 237 | +≈2（payload 两处 +`proxy`） |
| 桌面 | `thincoder-desktop/renderer/views/settings-controls.mjs` | 146 | +≈30（单表演进：序 ∥ proxy ∥ active 条件化 ∥ 预设信息行） |
| 桌面 | `thincoder-desktop/renderer/views/settings-sections-providers.mjs` | 195 | −≈10（双表退场 ∥ 添加钮） |
| 桌面 | `thincoder-desktop/renderer/views/settings.mjs` | 399 | +≈6（`settingsModalTree` `providerAdd` 支） |
| 桌面 | `thincoder-desktop/renderer/mount-settings.mjs` | 252 | +≈2（`SCOPES` ∥ `MODAL_READS`） |
| 桌面 | `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | 150 | +≈2（载荷 +`proxy`） |
| 桌面 | `thincoder-desktop/renderer/store.mjs` | 369 | +1 键（`providers.addShape`——非结构性） |
| 桌面 | `thincoder-desktop/src/main/providers.mjs` | 318 | +≈5（探面收敛 + `provider:save` +`proxy`；越 300 在册档 ✓） |
| 桌面 | `thincoder-desktop/renderer/i18n-settings.mjs` | 151 | 键 +3 −2（净 +1）∥ 值改随 #1035 |
| 桌面 | `thincoder-desktop/renderer/i18n-views.mjs` | 399 | ±0（值改：`addKey` ∥ `deleteKey` ∥ `composer.send.noProvider`） |
| 桌面 | `thincoder-desktop/renderer/i18n-composer.mjs` | 93 | ±0（值改：`model.setKey`） |
| 核 | `thincoder-core/config-io.mjs` | 278 | +≈3（`addProviderEntry` +`proxy`） |
| CLI | `thincoder-cli/src/tui/provider-admin.mjs` | 214 | +≈12（问句 ×2 支 + 收敛 + import） |
| CLI | `thincoder-cli/src/tui/cmd-config.mjs` | 488 | ≈+1（`:296` 收敛） |
| CLI | `thincoder-cli/src/tui/wizard.mjs` | 247 | ≈+1（`:216` 收敛） |
| 测试 | `docs/batches/2026-10-07-provider-config-parity.test.mjs` | **新** | 批本地件（随批归档 · 不入仓套件） |

**测试面（断言点名——批本地件）**

- **VSC（假 DOM harness ∥ 源锁——沿 `docs/batches/2026-09-29-vsc-carryover-settings.test.mjs` 先例）：**
  - V1 新档+锚源锁：`settings-provider-dialog.js` 在案且含 `#prov-add-dialog` ∥ `role="dialog"` ∥ `aria-modal` ∥ 五路关；`settings-providers.js` 零 `prov-add-form` 字面。
  - V2 元素序源锁（indexOf 序）：`pa-type → pa-custom-fields（name→url→format）→ pa-key → pa-proxy → pa-fetch-btn → pa-model → save/cancel`。
  - V3 行为腿：开框 ⇒ body 两件（`.auto-backdrop` + `#prov-add-dialog`）单例；关五路逐验；`closeSettings()` ⇒ 框净。
  - V4 行为腿（#1031）：无拉取 + 填 model ⇒ `addProvider` posted（携 model）；model 空 ⇒ `settings.modelRequired` 显 ∥ 零发。
  - V5 行为腿（#1032）：`SS.getModels()` 空 ⇒ `_defaultModelMenu()` ⇒ `#defaultmodel-hint` 显 ∥ 零菜单。
  - V6 载荷腿：`testProvider` 携 `proxy` = 勾选态；探果 ok ⇒ datalist 选项数 = models 数 ∥ 输入值不清；代际不符 ⇒ 弃。
  - V7 词面锁：#1033 三处字面零残留（`(no default model)` ∥ `宿主繁忙` ∥ `不可用`）；两语键集相等；`fetchModelsFirst` 缺席；#1035 六值改毕（zh 零「密钥」）。
  - V8 扩展侧文本锁：`testProviderConnection` 体含 `probeTargetOf(` ∥ 零 `proxyUri: null` 硬编码；`handleTestProvider` 透传 `proxy`；`handleAddProvider` 链携 `proxy`。
- **核（行为腿——tmp config 直驱）：** C1 `addProviderEntry` 三径（`proxy:true` ⇒ 条目带旗 ∥ 缺 ⇒ 零键 ∥ `false` ⇒ 零键）。
- **桌面（树面 ∥ 主面）：** D1 `providersBody` 树 = 行族 + 校验回退 + 添加钮（零表单节点）；D2 `channelFormTree` 节点序（custom/preset 两形 + `activeDefault` 条件化）；D3 `settingsModalTree("providerAdd")` = 标题 + 单表；`SCOPES` 含 `providerAdd`；`MODAL_READS.providerAdd === "loadProviders"`；D4 主面：`providerSave` 携 proxy 落条 ∥ `providerModels` 目标携 `proxyUri`（双门槛 ∥ 直连两径；源锁 `probeTargetOf(` ∥ 零 web 旗）；D5 词面锁：#1035 六值。
- **CLI（源锁 + 人工走查）：** L1 `provider-admin.mjs` 含 `probeTargetOf(` ∥ `cfg.proxy = true`（两支）∥ 代理问句；`cmd-config.mjs` ∥ `wizard.mjs` 探针行含 `probeTargetOf(`。
- **真机（父侧）：** 三端添加流走查——弹窗四径 ∥ 字段序 ∥ 不拉取保存 ∥ 勾选落盘 + 行面勾选随动 ∥ 拉取随勾选 ∥ CLI 问句。
- 计数/枚举随动（D3）：台账条目 #1027–#1036 全列（2.1）；断言 V1–V8 ∥ C1 ∥ D1–D5 ∥ L1 = 15 组点名。

### 2.7 验收对照（条目 → 机检点名）

| 条目 | 机检 | 真机 |
|---|---|---|
| #1027 | V6 ∥ V8 ∥ C1 ∥ D4 ∥ L1 | 勾选落盘 + 行面勾选随动 |
| #1028 | V2 ∥ D2 ∥ L1（问序） | 三端添加流走查 |
| #1029 | V1 ∥ V3 ∥ D3 | 弹窗四径 |
| #1031 | V4 ∥ V7（`fetchModelsFirst` 缺席） | 不拉取保存 |
| #1032 | V5 | 空表提示 |
| #1033 | V7（字面零残留） | — |
| #1035 | V7 ∥ D5 | — |
| ③′ 拉取路由 | V8 ∥ D4 ∥ L1 | 拉取随勾选 |

### 2.8 关键决策

- **D1 源 = VSC**（父侧口径 + 用户 18:10 ∥ 18:13；桌面逐元素照搬；禁自创第三套形态）。
- **D2 拉取路由耦合**（父裁——勾选 ⇒ `probeTargetOf` 同判定；桌面修 web 旗取用；CLI 三探针点收敛；`setup-wizard` 零改）。
- **D3 #1031 落形** = model 手输 + datalist（对齐桌面形；`settings.modelRequired` 新词；`fetchModelsFirst` 净删）——「不拉取可存」= 验收核心。
- **D4 #1032 落形** = 点击触发行内提示（`#defaultmodel-hint`；`.prov-hint` 形复用、零新 CSS；非常显——修「点击静默」最小面）。
- **D5 #1033 扩补** = 同线中文硬编码两处同拍入表（en 面现显中文 = 缺陷类——审计发现）。
- **D6 #1035 范围** = 两端 i18n 词值各 6 键（值级；键数不变）+ zh 裸「密钥」清零 + en「Key ∥ API key」规范化。
- **D7 桌面单表 = `channelFormTree` 演进**（名不换 ⇒ 调用面零改；原稿 `providerAddFormTree` 命名弃）。
- **D8 桌面初始焦点 = 首控件**（源对齐；KD-68 ⑥ ✕ 默认之表单例外——登记）。
- **D9 CLI 探针收敛 = 目标构造走核 `probeTargetOf`**；执行体（`tui/model-catalog.mjs:63`——同名异签名）与返形零改。
- **D10 `active` 退场**（设置面表单；向导 `activeDefault` 保留 + 条件渲染）。

### 2.9 上抛项

- **① [上抛·待裁] #1034 删除符（`−` vs `✕`）**——选项：**A（建议）统一 `✕` 作破坏性删除符**——VSC 行 `−` ⇒ `✕`（`:48` ∥ `:185` 两处）；桌面不动（`keyDelete` 值 = "✕"——`i18n-views.mjs:176/:350`）；理由 = ✕ 为通用破坏性删除形、各端内自洽（桌面 ✕ = 删钥 ∥ VSC ✕ = 删条目——作用域各端自解释）。B 统一 `−`（桌面 ✕ ⇒ `−`）——不取（✕ 先例更广）。C 现状登记——如需零动。
- **② [上抛·待裁] A2 半开关（双闸去留）**——运行期 = `entry.proxy ∧ 全局 proxy.model`（`proxy.mjs:70`）；全局关 ⇒ 行/表单勾选静默无效（仅 tooltip 明示）；用户 18:07「每个 provider 单独选」指向逐渠独立。选项：**A（推荐本批）现状保持**（零动；双闸语义在册）；**B 去全局闸（逐渠独立）**——动核 `injectProxy` ∥ `probeTargetOf` + CLI `/config` 全局面语义重定 + 三端 UI 提示随动 ⇒ **超本批零动边界，需用户显式裁（另批）**；C 保持语义 + UI 明示增强（全局关时行面可见态——超本批）。
- **③ [上抛·登记] 桌面行动作簇四件 ∥ VSC 两件**——建议保持桌面四件（#635⑤ 先例「校验」保留、差异在位置）+ 登记；**发现项：VSC 无「仅删钥」入口**（`settings-providers.js:56 _delKey` 定义零调用 = 死码）；如需 1:1 再议（桌面削至两件 ∥ VSC 补删钥入口）。
- **④ [上抛·知会] 批档 §1 坐标漂移**——`thincoder-core/proxy.mjs:50-55`（§1.2 与 §1.5 引作「运行期 `providers[].proxy` 读取」）as-read = `isLoopbackTarget` 段（#1026 改动后）；双门槛判据在同档 `:67-72`（`:70`）。§1 笔 = 父侧（未改）。
- **⑤ [上抛·知会] CLI 残余端差（字段序）**——model↔format 问序（CLI 先 model——手输无拉取依赖）；key/代理在条目落盘后问（D-F5a 先盘后存结构决定）；无拉取行。如要 1:1 另议。
- **⑥ [上抛·知会] `settings.proxyModel` zh 露代码 token**（「模型请求（proxy: true 的 provider）」——`locales/zh.json:124`）——A2-C 材料。

### 2.10 边界（本批不做）

运行期代理语义（核判据体）∥ 行/列表侧既有开关 ∥ #1026 已修面 ∥ 服务端面 ∥ #1034 实施 ∥ #1036（MCP env 串——批外另立）∥ CLI TUI 1:1 克隆（差异登记）∥ 桌面行动作簇改造（登记）∥ 独立弹层基建（D39 宿主既定）。

**2.9④ 随动（父侧 §1.6 已落 · 2026-10-07 18:3x）**：批档 §1 坐标漂移已由父侧 §1.6 勘误收正（`isLoopbackTarget` 插入后 `proxy.mjs` 双门槛 = `:67-70`——`injectProxy` :67 ∥ 判定式 :70；与本稿 2.3 核条 `:67-72`（判定式 `:70`）同口径）——上抛④ 由「待处理」降为「已收正（知会归档）」。

**§1.6 移交项入本批实现轮（不另开笔）**：`thincoder-vscode/src/extension/settings.mjs:225` 注释句「`config.proxy.web` 只管 websearch/fetch」与权威档（父侧 §1.6 引 `PROXY.md` §4——web 旗唯一活消费面 = CLI Test connection 探针；web 工具走逐次 `args.proxy`）相抵——实现轮随 `testProviderConnection`（`settings.mjs:220-234`——本批本就改签名）同面改述该注释块；**设计面零随动**（本批探针路由 = 耦合裁定语，不依赖该注释句；已核：设计档零复述该相抵句）。

### 2.11 fix 轮（eng-designer · 2026-10-07）——父侧预审定点补缺：#1029 首启交棒调用面

**来源**（父侧预审 · 定点补缺 · 只此一件）：VSC 弹窗化（#1029）迁移表单族时，首启板「自定义（手动配置）」路径的唯一外档调用 `thincoder-vscode/webview/onboarding.js:62` 的 `window._toggleAddForm?.(true)` 会随旧名退场被**可选链静默吞掉**——不报错、开设置面板但不弹框（同类「点了不弹」回归）；2.3 / 2.4 行 5 的开-调用面、2.6 表、测试面未列该调用点与随动。本块 = 四处随动落定 + 决策行（补 2.8 族）。

**事实面（父侧 grep 全表实读 + 本席实读复核）**：`_toggleAddForm` 全部出现 = `onboarding.js:62`（唯一外档调用）∥ 定义 `settings-providers.js:70` ∥ `:150`（保存后收形）∥ `:195`（`#prov-add-btn` onclick）∥ `:235`（取消钮）。

迁移后：`:70` 定义退场（表单-列表换位语义随内联表单归零）· `:150` / `:195` / `:235` 三处随表单族迁入新档（2.3 既定）· `onboarding.js:62` 换名（本块 ①）。

**①（2.3 补 · 开-调用面列全）**：「开 = `_openAddProviderDialog()`」调用面 = **两处**：

- `#prov-add-btn` onclick（卡片件——`settings-providers.js:195`；既有句照旧）；
- **首启板交棒径（补）**：`onboarding.js:62` ⇒ `window._openAddProviderDialog?.()`（换名自 `window._toggleAddForm?.(true)`；`?.` 守卫形保留）；时序不变（`_openSettings?.()` 后随调）；面板 ∥ 框两处 +50ms 焦点定时器同拍序（框后调度 ⇒ 末位焦点 = `#pa-type`）。

**②（2.4 行 5 补 · 开）**：行 5 VSC 格读法 = `_openAddProviderDialog()`（单例；重置；焦点）+ **调用面两处**（`#prov-add-btn` ∥ 首启板交棒——`onboarding.js:62`）。

**③（2.6 补 · 受影响文件表 +1 行）**：

| 端 | 文件 | 现 | Δ（预估） |
|---|---|---|---|
| VSC | `thincoder-vscode/webview/onboarding.js` | 82 | ±1（`:62` 调用面换名 ∥ `:59` 注释句改述「add form」⇒「add-provider dialog」；两处行内、净行数持平） |

**④（测试面补 · V9 + 计数随动）**：**V9 首启交棒腿（源锁 + 行为腿）**——

- 源锁：`onboarding.js` 含 `window._openAddProviderDialog?.(` ∥ webview 全档 `_toggleAddForm` 字面**零残留**（定义 ∥ 四处调用全清）。
- 行为腿：装真档链（新档 + `onboarding.js`）+ 预置 `ctx.welcomeProvider.value = "custom"` ∥ `welcomeKey` 非空 + fire `welcomeSaveBtn` click ⇒ `_openSettings` 调 1 ∧ `document.body` 得 `.auto-backdrop` + `#prov-add-dialog` 两件（**可开框**）。
- 计数随动（D3）：断言点名 15 组 ⇒ **16 组**（V1–V9 ∥ C1 ∥ D1–D5 ∥ L1）；2.7 #1029 行机检随补 = `V1 ∥ V3 ∥ V9 ∥ D3`。

**决策（补 2.8 族 · D11）——落法取 ①（新档导出 + 换名统一），弃 ②（薄别名）**：

- **①（取）**：新档 `settings-provider-dialog.js` 导出 `window._openAddProviderDialog`；`onboarding.js:62` 改调 `window._openAddProviderDialog?.()`。由 = 迁移后 toggle 语义已死（别名名实不符）∥ 两名并存 ⇒ 调用面割裂、下次触点再理一次；代价 = onboarding 行内 1 处（已在 ③ 表内）。
- **②（弃）**：`settings-providers.js` 留薄别名 `window._toggleAddForm = () => window._openAddProviderDialog?.()`（onboarding 零改）。弃由 = 旧名残留（「切换」名下一律开框——读码需二次追源）；省 1 行不抵调用面长期两名并存。

**读法声明**：以上四处随动以本块为准（与上文对应句冲突处，以本块读法为准）；①–④ 即该四处的落定文本（原位并入与否由父侧处置）。

**未触碰**：`src/**` 与前端产品码（未到实施轮）∥ 批档 §1 ∥ §3–§6 ∥ 设计档（VSC / 桌面 / 核）∥ 他批档——本轮 = §2 单段补缺。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审计数：🔴 1 ∥ 🟡 7 ∥ 🔵 4（共 12 项）**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属（机制级相抵） | 🔴 | #1031 落形（自定形 model = 手输文本框 + 候选 datalist；不拉取可存——批档 `:76` ∥ `docs/vsc/design/SETTINGS.md:499`）与核档既有规则相抵：`docs/core/design/PROVIDER.md:291`「（不列候选 / 不可选 / 无静态兜底 / 无手输绕过）」（M8/M9 渠道准入，执行层 = 配置阶段含「加渠道」）∥ 同档 `:296`「**不加 UI 手输行**（命令面 `provider:model` 仍放行任意串，被否的只是「在 UI 里新造手输入口」）」∥ 同档 `:515`「渠道准入判据 = **`/models` 可用**；执行层 = **配置阶段**（运行期不加闸）」（D-PR16）。端面对形已存（`docs/desktop/design/SETTINGS.md:197`「**#1031 零改**——本端自定形 model 已 = 手输 + 探果 datalist」）；批档 §2.2 的 PROVIDER.md 修订面不含 §6.16 ∥ §7（该行只记「§8 代理条」——指位本身亦误，见 #3）⇒ 同一机制两处相反陈述，须先落定再实施 | 把 §6.16（M8/M9 ∥ UI 决策）与 §7 D-PR16 收正/限定为与落形一致的口径（准入判据适用面 = 模型候选面；自定形表单 model 手输兜底 = 端面既成形），并把 PROVIDER.md 记入 §2.2 修订面 + 变更记录；若判为需求取代 ⇒ 先向用户明示后登记取代关系 |
| 2 | 清晰度（受影响文件面） | 🟡 | 桌面新动作 `settings:addProvider`（`docs/desktop/design/SETTINGS.md:188`：锚 `data-action="settings:addProvider"`）的注册档未入批档 §2.6 表（桌面行 = 批档 `:174-181`）：`data-action` 分派走同一 `exits.handlers` 全表（同档 `:29`「出口链（= 同一 `exits.handlers` 全表注入——视图 `data-action` 同域，零第二份」），该档即承担提交 ∥ 移除等出口（同档 `:135`：提交成功 ∥ 移除 ∥ 下次校验起手均已清（`mount-settings-exits.mjs:85 ∥ :117 ∥ :98`））⇒ 须改而未列、未标行数/Δ | 受影响文件表补该行（现 ∥ Δ）；并把「添加钮 ⇒ 开弹窗」开径纳入机检腿（现 D1/D3 只覆盖树面与闭集） |
| 3 | 文档归属（指位 ∥ 记录面） | 🟡 | 批档 §2.2 PROVIDER.md 行（`:93`）指位「§8 代理条」与实况不符——本批实落 = 同档 §6.19 ② 写面句（`docs/core/design/PROVIDER.md:337`「**写面（三端对齐批 · 2026-10-07 · 台账 #1027–#1029）**」），而 §8 = 不并项与历史沿革（同档 `:537`）；该行动作记「留（审计通过）」与已落章的批内嵌句不自洽；PROVIDER.md 变更记录无 2026-10-07 条（末条 = 2026-10-04，同档 `:633`） | 指位收正为 §6.19 ②、动作改记改+补，并在 PROVIDER.md 变更记录补本批条目 |
| 4 | 计数/枚举（D3） | 🟡 | ① 批档 `:205`「台账条目 #1027–#1036 全列（2.1）」与 §2.1 表（`:71-81`）不符——**#1030 未列**且全档零处置；② `docs/vsc/design/WEBVIEW-PROTOCOL.md:486`（`addProvider` 行）标「（共 4 处）」而②列只列 3 处（`model-menu.mjs:303` ∥ `onboarding.js:65` ∥ 新档） | 逐处补处置或限定措辞（#1030 = 本批 ∪ 批外；协议行补第 4 处 ∥ 计数收正）——计数与列表同改 |
| 5 | 结构面（越线档拆分窗口） | 🟡 | 越线档「触属性 ∥ 拆分窗口」未表态：① VSC `webview/settings.css`（批档 `:170` 记「越 300 在册档，结构零触碰」）——在册触发含「设置面样式族下次结构改动」（`docs/vsc/design/SETTINGS.md:556`），本批新增 `.settings-dialog` 段是否即该触发未裁，登记行现值（**385**）亦未随动；② 桌面 `src/main/providers.mjs`（批档 `:180` 仅「越 300 在册档 ✓」）——在册窗口 = 拆分族所在面（`docs/desktop/design/PROJECT.md:417`「预案 = 验证 ∕ 探针族出档 `thincoder-desktop/src/main/provider-verify.mjs`（拟新增）· 消解窗口 = 下个**结构性**触碰的批」），本批正动探面收敛 + `provider:save`；③ 桌面 `renderer/views/settings.mjs`（批档 `:176`）同缺触属性句（对照同表 store.mjs 行给了「非结构性」） | 逐档补「结构性 ∥ 非结构性 + 执行 ∥ 顺延」句并同步在册登记行（settings.css ∥ providers.mjs 优先） |
| 6 | 文档卫生（规范面修订式表达） | 🟡 | 规范面留「原 …」类对照语：`docs/vsc/design/SETTINGS.md:471`（入口定义行）「（原 `window._toggleAddForm?.(true)`；`?.` 守卫保留、时序与焦点定时器同拍序——批档 §2.11；父侧直执行 · 单句收正 · 可回退）」∥ 批档 `:97`「草稿修正两处（本轮复核改）：① `providerAddFormTree` 命名弃 ⇒ …」∥ 批档 `:246`「上抛④ 由「待处理」降为「已收正（知会归档）」」 | 规范面直陈现行落形（沿用革归记录面）；§2.11 fix 块的读法声明（批档 `:282`）随原位并入一并对账 |
| 7 | 协调项（不阻塞） | 🟡 | 上抛②（A2 双闸去留；批档 `:236`）——取 A（本批零动）时新增开关在全局 `proxy.model` 关时静默无效（`docs/vsc/design/SETTINGS.md:488` ∥ `docs/core/design/PROVIDER.md:337`），与用户 18:07「每个 provider 单独选」口径的落法直接相关 | 把 A ∥ B ∥ C 选项连同「A 的可见后果」列入 §4 批准面请裁 |
| 8 | 文档状态（同档状态句滞后） | 🟡 | `docs/desktop/design/SETTINGS.md:127`「弹窗校验面（`SCOPES`）保持**七名宽容**」 vs 同档 `:187`（「`SCOPES` 七 ⇒ 八」）∥ `:29`（`null ∥ 八值闭集`）——同档两值并存（判为 dated 批注型状态句 ⇒ 非机制相抵；报告不编辑） | 该句补 as-of 限定或随本批收正（八名 ∥ `MODAL_READS` 八组） |
| 9 | 清晰度（术语） | 🔵 | 「双门槛」同节两枚举：`docs/vsc/design/SETTINGS.md:488`（`injectProxy` 双门槛 = 条目 `proxy` ∧ 全局 `model`）vs 同档 `:493`（`proxyUri` = 双门槛判定：勾 ∧ 全局 `uri` ∧ `model === true` ⇒ uri ∥ 否则 `undefined` ⇒ 直连） | 给唯一组成式（并注明 `uri` 是否参与运行期闸） |
| 10 | 数值/坐标漂移 | 🔵 | ① 同档两范围指同一判定体：批档 `:60`「`:67-70`」 vs `:121`「`proxy.mjs:67-72`」（均标判定式 `:70`）；② 批档 `:41`「`cmd-config.mjs:113-165`」 vs `:150`「`cmd-config.mjs:113-170`」；③ #1033 两处中文硬编码锚 `:189`（`docs/vsc/design/SETTINGS.md:501`）vs §2.12 状态词锚 `:186`（同档 `:376`）；④ 同一文件两值：批档 `:262`「`onboarding.js:62`」 vs `WEBVIEW-PROTOCOL.md:486`「`onboarding.js:65`」 | 逐处对齐（同值单一锚 ∥ 范围口径 ∥ 若指不同语句就地注明） |
| 11 | 端面完整性（向导径） | 🔵 | 单表构建器仅按 `activeDefault !== undefined` 条件化「设为当前」复选（`docs/desktop/design/SETTINGS.md:191`），而 §2.16 6 要求向导步 1 提交同携 `proxy`（同档 `:192`）⇒ 首启向导步 1 是否新显「走 proxy」开关未明写；验收面（三端走查 ∥ 弹窗四径）未覆盖向导径 | 明写该控件在向导步 1 的在场 ∨ 条件排除，并把向导径纳入走查/机检 |
| 12 | 交互边界（遮罩共用类） | 🔵 | 新框复用确认族共用类 `.auto-backdrop`，设计只声明关方向「双清幂等」（`docs/vsc/design/SETTINGS.md:473`：「背板类名 `.auto-backdrop` = 确认族共用类（`closeConfirmPopover` 帚扫本含背板——双清幂等；卡件归 `closeAddProviderDialog` 独清）」）；确认族**开框前**的单例清扫同样扫该背板（同档 `:236`）——框在场时该方向后果无用例钉住 | 补一条行为腿（框在场 ⇒ 确认族触发 ⇒ 框/幕状态断言）或给该背板独立标记 |

VERDICT: changes-required

**计数**：🔴 1 ∥ 🟡 7 ∥ 🔵 4（共 12 项）；因存在未决 🔴 ⇒ 本轮不出批准信号（token / designId 均不落）。

**评审计范围声明**（随表并入）：审阅面 = 批档 + 六档设计档全文；无项目标准档声明 ⇒ 方法学按 Project Guide（AGENTS.md）∥ 各档自持单源纪律（D2 ∥ D3）判；无文档地图 ⇒ 文档归属按各档自持「机制单源」指针判；本轮未读产品码 ⇒ 无法在审阅面内交叉核对的读数（如 `cmd-config.mjs` 488 行）按「申报未复核」对待。

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
