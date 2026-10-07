# 2026-10-07 · 添加入口弹窗化统一
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 22:01 指令（原话逐字见 §1.1）——MCP 添加服务器弹窗化 + 全仓添加入口扫面统一。
> 台账 = #1054（settings · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源（用户原话 · 逐字）

- 2026-10-07 22:01：「MCP添加服务服务器那个界面不好，我希望添加也在弹窗里实现，再见检查一下，还有没有别的地方添加不在弹窗里的，我希望这个行为统一一下。」

### 1.2 扫面结果（explore #2 · 只读 · 2026-10-07 22:0x）

全仓「添加」入口 16 项（VSC 7 ∥ 桌面 8 ∥ CLI TUI 1——CLI 向导另面，不归本次）。**非弹窗实况**（= 统一面候选）：

| 组 | 项（面 × 对象） | 现行形态 | 入口（file:line 要点） |
|---|---|---|---|
| **A 你点名的** | VSC MCP 添加服务器 | **内联表单（卡内）** | 钮 `settings-tools.js:57` ∥ 表单 `settings-mcp.js:52-77` ∥ 开 `:253-273`——仅存/消两路（无 Esc/背板/面板关同清）；name 空 ⇒ 静默 return |
| | 桌面 MCP 添加服务器 | **内联表单（段体内，常驻）** | `views/settings-sections-mcp.mjs:173-234` ∥ `mount-settings-segments-mcp.mjs:144-164`——新增态**无取消钮** |
| **B 同类表单族** | VSC 添加会诊模型 | 内联（卡内追加空行，两段式：先加行再浮层选） | `settings-agent.js:58` → `settings-models.js:200-212` |
| | 桌面 添加会诊模型 | 内联表单（两 select + Add；未齐 disabled） | `views/settings-sections-models.mjs:137-147` |
| **C 单字段凭证** | 添加 Key ×4（VSC 渠道行 ∥ VSC 工具两行 ∥ 桌面渠道行 ∥ 桌面工具两行） | **行内就地编辑**（1 字段 password + 存/消 + Enter/Esc） | `settings-providers.js:122` ∥ `settings-tools.js:104/:117` ∥ `views/settings-sections-providers.mjs:112-133` ∥ `views/settings-sections-tools.mjs:68-79` |
| **D 首启/宿主专面** | VSC composer 页脚「+ 添加 provider…」 | 宿主 QuickPick 流（不在 webview） | `webview/input.js:32` → `panel-messages-settings.mjs:89-91` |
| | 桌面 composer 页脚 | 仅转设置面（不直开添加） | `composer-wire.mjs:246` |
| | VSC 欢迎面板（首启） | 独立覆盖面板 | `webview/index.html:73-90` + `onboarding.js:54-67` |
| | 桌面 向导步 1（首启） | 向导独占设置槽 | `views/onboarding.mjs:56-64` |
| **E 表单内部件** | MCP kv「添加行」×2 | 行追加（表单内） | 随 A 弹窗迁——不单列 |

### 1.3 父侧口径建议（**待裁**——用户一句话定统一范围）

- **建议判据（一条线）**：**「表单类添加 ⇒ 弹窗；单字段就地编辑 ⇒ 保持行内；首启/宿主原生面 ⇒ 各守其面」**。
- 按此线：**A（MCP ×2）改弹窗**（本次主体——对齐 add-provider 弹窗先例：独立框体 ∥ 关闭五路 ∥ 开框重置 ∥ 初始焦点 ∥ 在飞弃果代际；VSC 现缺三路关，桌面新增态缺取消，同批补齐）+ **B（会诊模型 ×2）改弹窗**；**C（Key ×4）保持行内**（是「编辑」非「添加表单」——弹窗化更重、收益负）；**D 首启两面保持**（欢迎面板 ∥ 向导步 1——首启专面）+ **页脚两处可选**：VSC 页脚改为直开同一弹窗 ∥ 桌面页脚改为直开 providerAdd 弹窗（各一处映射——你点头即含）。
- **待裁题**：统一范围 = ① 仅 A ∥ ② A+B ∥ ③ A+B+页脚 ∥ ④ 全部含 Key（连 C 也弹窗化）？——默认取 **②+页脚**（A+B+D 页脚直开；C 保持行内）。

### 1.4 范围裁定（父侧 · 2026-10-07 22:08——用户授权「自己评估，定个方案就落地」）

- **裁定 = ③ + 页脚直开**：**A MCP 添加 ×2 ⇒ 弹窗**（主体）∥ **B 会诊模型 ×2 ⇒ 弹窗**（同属表单类添加——VSC 两段式合为一框 ∥ 桌面两下拉包框）∥ **页脚直开 ×2**（桌面 = 一处映射 `ADD_MODAL_GROUP`；VSC = 页脚项路由到 webview 添加弹窗——现 QuickPick 径去向由设计轮 trace 调用点后判）∥ **C Key ×4 ⇒ 保持行内**（判据：单字段「就地编辑」非「添加表单」——目标绑定在行，弹窗反而割裂绑定、增操作面）∥ **D₂ 首启两面 ⇒ 不动**（欢迎面板 ∥ 向导步 1 = 首启专面）。
- **统一判据（本批单源）**：**表单类添加 ⇒ 弹窗；单字段就地编辑 ⇒ 行内；首启/宿主原生专面 ⇒ 各守其面**。
- **落地授权** = 用户 22:08「定个方案就落地吧」——全链（设计 → 评审 → 实施），父侧代签节奏照今日先例。

### 1.5 全链授权（用户 2026-10-07 22:09）

- 原话：「可以，这两条线都自动跑到交付。」
- 射程 = 代点火设计评审 ∥ 修正轮派发 ∥ §4 代签 ∥ 实施派发 ∥ 复核 ∥ 收口核销 ∥ 签入（双远端）。
- 自缚三条（仓惯例）：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正全落并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停；③ 破坏性/不可逆 ⇒ 先停。

### 1.6 设计评审轮（advisor · 2026-10-07 22:28）处置

- **结果：changes-required**（🔴1 ∥ 🟡5 ∥ 🔵4——findings 表在 §3 轮次 1；未签 token）。
- **裁定：10/10 全收**（无争议项）——修正轮在派：🔴1 = SCOPES 值集计数收齐（十 or as-of——不得两值并存；KD-68 ④ 两处 + §2.11 两处现值标记）∥ 🟡2 = VSC §2.17 补判据/机检面行（与桌面 §2.18 项 7 同件名）∥ 🟡3 = VSC 受影响文件表补（现行 ⇒ ≤±N）∥ 🟡4 = 桌面本批块 +`store.mjs` + `i18n.mjs` 两行 ∥ 🟡5 = 行集初值口径边界明写（「零项 ⇒ 零行」适用面 + 新增态起手两端同值）∥ 🟡6 = `consultAdd` 取消面明写 ∥ 🔵7 = §2.10 `:46`/`MODAL_READS` 基数两残余收正 ∥ 🔵8 = 页脚 `?.` 口径统一（§2.10 纪律）∥ 🔵9 = 会诊弹窗层序前提补句 ∥ 🔵10 = UI.md 本批变更行补。
- 修正落 → 父侧核验 → 复评（轮 2——验修正）→ §4 代签 → 实施。

### 1.7 修正轮（#10）交付核验（主 agent · 2026-10-07 22:47）

- **核验**：10/10 落点抽读——桌面 KD-68 ④（:29「校验面 `SCOPES` = 十名…」+「十值闭集」两处同拍、七名句已退）∥ VSC §2.17 判据行（:555——腿集 + 真机 + 五新键）+ 受影响文件表（:557-573 十一行，实读 282 ∥ 125 ∥ 236 ∥ 38）——**通过**。
- **形式面折行（14 行 · 零语义 · 应运）**：门读 行宽 43 ⇒ 29（本批触碰行零命中）∥ 锚 28（零新增）——**准**。
- **观测三条处置**：① `openSettings?.` 既有形 ⇒ 零动 **照准**；② §2 记录面两处读数差（「四新键」vs「+5 键」∥ 现读 ±1）——**照准**（记录面 as-of 保留 + §2 修正块 :124/:125 已载照正，不追改原文——合「记录面不 back-edit」纪律）；③ 存量门红他批归属 **照准**。
- 复评（轮 2——验修正）已点火。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（板档四份落毕 + 评审轮 1 修正 10/10 落（§2 修正块）+ 行宽收正 14 行（追记：触碰面零命中）；机检面 = 批内件（实施轮建））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

## 批次任务与设计（eng-designer · 设计轮 2026-10-07）

**统一判据（本批单源 · 两端同判）**：**表单类添加 ⇒ 弹窗**（单例 ∥ 五路关：保存（守卫通过才发 + 关）∥ 取消 ∥ 背板 ∥ 框内 Esc ∥ 关面板同清 ∥ 开框重置 ∥ 初始焦点 = 首控件）；**单字段就地编辑 ⇒ 行内**；**首启 ∥ 宿主原生专面 ⇒ 各守其面**。

### 1) 覆盖条目（↔ 台账 #1054）

| # | 条目 | 落形（端） | 判据（机检面） |
|---|---|---|---|
| A | MCP 添加服务器 ⇒ 弹窗 | VSC：新档 `settings-mcp-dialog.js`（`#mcp-dialog`）∥ 桌面：新组 `mcpForm` 弹窗（骑 D39） | 五路关在案 ∥ 开框重置 ∥ name 空 ⇒ 拒因可见（VSC `settings.mcp.nameRequired`）+ 不关框 ∥ 编辑态 name 只读 |
| A′ | MCP 编辑同框复用 | 两端同框（add/edit 态） | 编辑预填 ∥ 提交后关框 + 列表随动 |
| B | 会诊添加 ⇒ 弹窗 | VSC：新档 `settings-consult-dialog.js`（`#consult-add-dialog`）∥ 桌面：新组 `consultAdd` 弹窗 | 两字段 + 提交 ∥ 上限 5（入口 disabled ∥ 提交守卫）∥ 提交 ⇒ 追加行 + 保存链 + 关框 |
| C | 页脚「+ Add provider…」⇒ 直开 | VSC：`webview/input.js` OUT 表接本地面动作（零宿主往返）∥ 桌面：`composer-wire` 映射 ⇒ `openSettings(ADD_MODAL_GROUP)` | 页脚点击 ⇒ 添加弹窗在场 ∥ VSC 宿主无载荷支净删（畸形载荷 ⇒ fail-loud 零动作） |

### 2) 明确不入本批（扫面判出——各守其面/行内）

- **键 ×4 保持行内**（VSC 三处 + 桌面一处：单字段就地编辑 ⇒ 判据第二句已纳，本批零动）。
- **首启两面不动**（VSC 首启板 ∥ 桌面向导步 1——宿主专面）；**CLI 交互面零动**（QuickPick 面保留——判据第三句）。
- #1036（MCP kv 行式）∥ #1046（CLI 串式端差）——批外既有归属。

### 3) 设计落点（三链同源：本节 ↔ 板档 ↔ 台账 #1054）

- **VSC**：`docs/vsc/design/SETTINGS.md` **§2.17**（判据 + 三面机制）∥ **§5 U-S18** ∥ §1 两卡行 ∥ §2.4 面形指针 ∥ §2.10 判据域档数（10 ⇒ 12 ∥ 合域 11 ⇒ 13）；`docs/vsc/design/WEBVIEW-PROTOCOL.md` §13 三行（`addProvider` 发送列收正 ∥ `editMcp`/`saveMcpServer` 改指新档）。
- **桌面**：`docs/desktop/design/SETTINGS.md` **§1 KD-77** ∥ **§2.18**（八项）∥ **§3.2 本批块**（十五行）∥ KD-68 ④ 闭集计数（八 ⇒ 十）；`docs/desktop/design/UI.md` §4.1 三行（i18n 账：i18n.mjs ∥ i18n-views ∥ i18n-settings）。
- **机检**：批内件 `docs/batches/2026-10-07-add-dialog-unify.test.mjs`（实施轮建——树面两新组 ∥ 段体零表单 + 入口钮 ∥ 页脚映射 ∥ 五路关/拒径 ∥ 词面四新键两语）。
- **既有测试面随动**（表单宿主换位 ⇒ 断言须改写）：`docs/batches/2026-10-07-mcp-kv-input.test.mjs`（L1/L2 桌面构树自 `mcpBody` 取表单 ⇒ 改 `mcpFormBody`；L3 VSC `openMcpForm`/`#mcp-form` display 断言 ⇒ 改弹窗口径）∥ `docs/batches/2026-09-30-desktop-residuals.test.mjs:289/:300`（`settings:addMcp` 定位面）∥ `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs:147` ∥ `docs/batches/2026-09-29-parity-b10-ui-w3.test.mjs:371`（新增态补取消钮 ⇒ 钮集断言 += `settings:mcpCancel`）。

### 4) 关键决策

1. **VSC 页脚 = 本地面动作**（`input.js` OUT 表，零宿主往返；与桌面「post 映射 = 本地面」对称）；被否：宿主中转 + 新推送（二跳）∥ 核 footer 加 hook（改共享件面）。
2. **桌面页脚 = 双口提升**（`app.mjs` `openSettings(group?)` 同供 menuActions + attachComposer；`mount-composer` 两 dep 转口）。
3. **桌面 MCP 组名 = `mcpForm`**（同框服务 add ∥ edit ⇒ 取体面名；被否 `mcpAdd`——名实不符）∥ 会诊 = `consultAdd`。
4. **弹窗清理收窄（机制修复 · 同笔）**：`closeAddProviderDialog` 现将按 `.settings-dialog*` 类全扫 ⇒ 收窄为各框只清自身两件（防第二框互清）；`closeSettings()` = 三清。
5. **VSC MCP 拒因可见**：name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留 ∥ `#mcp-status` 显 `settings.mcp.nameRequired`（僵默退场——#1031 同判）。
6. **桌面段态词恰一（发现项 · 同笔收正）**：`settingsModalTree` 非 add 组叠渲段态词（修前实测：`env` loading = 2 节点）⇒ 去叠渲件。

### 5) 上抛 / 发现（父侧裁 · 本批未吸收）

- **[上抛·待裁] 跨端提交词差**：VSC 新增态提交 = `settings.save`（"Save"）↔ 桌面 = `settings.mcp.add`（"Add server"）——同类键名差：VSC `settings.model` ↔ 桌面 `settings.providers.modelLabel`（均 "Model"）。两词各无单点缺陷，差异本身 = 词面不一致；对齐方向（VSC 源 ↔ 桌面源）需裁 ⇒ 本批「照现」，未吸收。
- **[上抛·知会] 协议面残余条条件面**：#1053（保存徽标宿主后置拒无回执）∥ #1051（拉取探果跨框残余窗口——需协议携请求 id）条件 = 「VSC 面板协议面下次触碰评估」。本批触碰 `WEBVIEW-PROTOCOL.md`（**文档行随动，非协议结构改动**）⇒ 两残余延续；本批新弹窗沿用同残余（MCP 保存 = 发后关，宿主后置拒无回执可相关）。
- **[上抛·知会] 桌面三档越 300 建议线**（预估）：`mount-settings-exits` ≈302 ∥ `mount-settings-segments-mcp` ≈314 ∥ `mount-composer` ≈302——拆分评估登记（阈值 450 或各自下次结构改动）。

### 6) 受影响文件（现读 ⇒ 预估 · 内容行数口径；实施后回填）

**VSC 端**（批档面）：`webview/settings-mcp.js` **273 ⇒ ≈185**（表单族析出；列表 ∥ 探测 ∥ 状态留）∥ `webview/settings-mcp-dialog.js` **0 ⇒ ≈125**（新档）∥ `webview/settings-consult-dialog.js` **0 ⇒ ≈95**（新档）∥ `webview/settings-models.js` **217 ⇒ ≈205**（入口改开框 ∥ 行追加口出让）∥ `webview/settings.js` **195 ⇒ ≈200**（关面板径两增调 + import）∥ `webview/settings-provider-dialog.js` **283 ⇒ ≈280**（清理收窄为自身两件）∥ `webview/input.js` **126 ⇒ ≈126**（OUT 表 1 条改体）∥ `src/extension/panel-messages-settings.mjs` **237 ⇒ ≈225**（无载荷支 + import 净删）∥ `src/extension/provider-flows.mjs` **39 ⇒ ≈36**（`addProviderFlow` 包装净删）∥ `locales/en.json ∥ zh.json` **+5 键 × 两语**（`settings.mcp.addTitle` ∥ `.editTitle` ∥ `.nameRequired` ∥ `settings.consultAddTitle` ∥ `settings.consultProvider`）∥ `webview/settings.css` **412 ⇒ ±0**（类全复用：`.settings-dialog` ∥ `.settings-subtitle` ∥ `.key-field` ∥ `.key-status`——零新 CSS）。

**桌面端**：逐行表 = `docs/desktop/design/SETTINGS.md` §3.2 本批块（十五行——13 档 + 零改面 + 批内件）；要点 = `views/settings.mjs` 419 ⇒ ≈445 ∥ `mount-settings-exits.mjs` 289 ⇒ ≈302 ∥ `mount-settings-segments-mcp.mjs` 299 ⇒ ≈314 ∥ `mount-composer.mjs` 299 ⇒ ≈302（三档越 300 建议线 ⇒ 拆分评估登记）∥ 词键 +4 × 两语（`settings.mcpAdd` ∥ `.mcp.addTitle` ∥ `.mcp.editTitle` —— `i18n-settings.mjs`；`settings.consultAddTitle` —— `i18n-views.mjs`）。

**零触面**：核 ∥ CLI ∥ `thincoder-render-core` ∥ 桌面 `settings.css` ∥ `settings-modal.mjs` ∥ 首启两面 ∥ 键行就地编辑面。

### 修正轮 · 设计评审轮 1（发现 1–10 逐号收正 · 父侧裁 = 全采纳）（eng-designer · 2026-10-07）

**处置 = 10/10 全收**（无争议）；**产品码零触 ∥ 零新语义**（计数 ∥ 措辞 ∥ 注 ∥ 边界面只）。逐号（号 → 落盘）：

1. 🔴 **SCOPES 计数收齐**（桌面 `SETTINGS.md`）：KD-68 ④（:29）两处——「（装配面派生，**七名**——设置页对齐）」计数退场 ∥ 「**校验面 `SCOPES` = 八名**（…）」⇒ **十名**（+`mcpForm` ∥ `consultAdd`——同格仅存十值）；§2.11（:129）「as-of 本批——现值八名」⇒ **十名** ∥ （:130）「现值八组」+ **本批 +2 行 ⇒ 十组**（`mcpForm` → `loadMcp` ∥ `consultAdd` → `loadAgent`）。
2. 🟡 **VSC §2.17 补判据 / 机检面**（:549）：批内件 `docs/batches/2026-10-07-add-dialog-unify.test.mjs`（拟新增——腿集：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见 ∥ 跨框互清 ∥ 页脚零出站 ∥ 词面五新键两语）+ 真机走查项；与桌面 §2.18 项 7 同件名。
3. 🟡 **VSC §2.17 补受影响文件表**（:551-:567——十一行「现行 ⇒ 预估」+ 跨 300 面注）：**现行读值按实读收正四处**（本节 §6 原读 283 / 126 / 237 / 39 各 +1 差——实读 = 文末换行不计口径）：`settings-provider-dialog.js` **282** ∥ `input.js` **125** ∥ `panel-messages-settings.mjs` **236** ∥ `provider-flows.mjs` **38**；`settings.css` **412 ⇔ ±0**（>300 在册 ⇒ 窗口顺延随注）。
4. 🟡 **桌面 §3.2 本批块 +两行**（:375-:376）：`store.mjs` **370 ⇒ ≈370**（±0——闭集注释 八值 ⇒ 十值，注释级）∥ `i18n.mjs` **420 ⇒ ≈421**（键数链注续链）——块 **15 ⇒ 17 行**（零改面 ∥ 批内件顺延为 16 ∥ 17）。
5. 🟡 **行集初值口径边界明写**（VSC §2.4 :51 ∥ §2.17 ① :528 ∥ 桌面 KD-76 ① :32 ∥ §2.18 项 3 :225 四处同值）：**「零项 ⇒ 零行」= 存量回显 ∧ 新增态起手同判**（起手三组皆零行；行由「添加行」落——加行 = 尾附一空行）。**前提修正（报告项）**：评审依据的「vsc :528『三组行集各一空行』为 VSC 已明写」与两端实现不符——实读 VSC `settings-mcp.js:263`（`kvRowsInto(group, null)` ⇒ 零行插入）+ KV 批批内件（`openMcpForm(null)` ⇒ `[data-kv-row]` 恰 0）⇒ 该句收正为「零行」；端差 = 零（两端同值——桌面新态 `form.kv` 空 ⇒ 零行同判）。未新增行为（表单族零改）。
6. 🟡 **桌面 `consultAdd` 取消面**：KD-77 ②（:33）∥ §2.18 项 3（:225）两处——**取消 = `settings.cancel` 钮（锚 `settings:consultCancel`——与 `mcpForm` 同形）= 关弹窗（切片复位随关）**（五路关「取消」支落地；✕ ∥ 背板 ∥ Esc 原担不变）。
7. 🔵 **两处现值残余收正**（桌面）：（a）§2.10（:122）`SCOPES` 定义位 `mount-settings.mjs:46 ⇒ :48`；（b）`MODAL_READS` 基数钉死——§2.11（:130）「现值八组」+「本批 +2 行 ⇒ 十组」（同句定义位 `:49 ⇒ :52` 收正）∥ §2.18 项 6（:228）「`MODAL_READS` 八组 ⇒ 十组（+2 行）」；§3.1（:256）读数收正「`ADD_MODAL_GROUP` 八闭集 ∥ `MODAL_READS` 九」⇒「`SCOPES` 八名闭集（含 `ADD_MODAL_GROUP`）∥ `MODAL_READS` 八组」（实读 `mount-settings.mjs:52` 起对象恰 8 键——「九」为书写误差）。
8. 🔵 **页脚 `?.` ⇒ 裸调用**（VSC §2.17 ③ :545）：`window._openAddProviderDialog()`（**不取防御式回退**——门由 `initSettings`（`settings.js:39`）安装、同文档 ⇒ 点击前必已安装；缺门响亮失败——沿 §2.10 纪律）；首启交棒径（§2.16 ① :479）「守卫保留」句维持（本批零改其行）。
9. 🔵 **层序前提补句**（VSC §2.17 ② :538）：浮层（`model-menu.css:11 ∥ :13 ∥ :31`——1000 ∥ 1001 ∥ 1002；overlay 挂 `document.body` 尾）与弹窗（幕 999 ∥ 卡 1000——`webview/settings.css:292 ∥ :301`）**同层（1000）以挂载序破平——后开者在上**（浮层由弹窗内点按开启 ⇒ 恒在弹窗之上；`closeConsultDialog` 同清浮层）。
10. 🔵 **UI.md 变更记录补行**（:820）：本批 #1054 触碰登记补行（§4.1 三行——`i18n.mjs` ≈421 ∥ `i18n-views` ≈408（+1 键）∥ `i18n-settings` ≈158（+3 键；键族 60 ⇒ 63））；三行原「触碰登记」措辞保留（记录面自洽）。

**同轮备注**（读取 / 枚举类残余，随号报告）：

- 本节「设计落点」行（:81）「词面**四新键**两语」与同节 §6（:101）「+5 键」自相抵——VSC 实列五键（`settings.mcp.addTitle` ∥ `.editTitle` ∥ `.nameRequired` ∥ `settings.consultAddTitle` ∥ `settings.consultProvider`）；桌面 +4（无 `.nameRequired` ∥ `settings.consultProvider` 两键面——consultProvider 词 VSC 侧新立）。修正面已按五键落（本轮 §2.17 判据行 ∥ 文件表）。
- 方案内四处现读（283 / 126 / 237 / 39）与本轮实读（282 / 125 / 236 / 38）差一——成因 = 设计读取口径差（文末换行）；四档内实读值已更（第 3 条），本节 §6 原句不追改（记录面）。
- 桌面 `openSettings?.(ADD_MODAL_GROUP)`（`composer-wire` 映射，§2.18 ④）属注入依赖「缺 ⇒ 零动作」既有形——非 §2.10 纪律射程，本轮零动（如后续统一评估，可另行登记）。

**三链同源复核（本修正轮后）**：板档 §2.17 判据 ∥ 文件表 ↔ 桌面板 §2.18 ∥ §3.2 ↔ 本节覆盖条目 A ∥ A′ ∥ B ∥ C（台账 #1054）同源在案。

### 行宽收正追记（同轮 · 形式面只 · eng-designer · 2026-10-07）

**动因**：交付前跑一次 `node scripts/doc-check.mjs`（判据 = manifest checkConfig——`lineWidth 300` ∥ `widthExemptZones = 变更记录 ∥ 历史沿革`；权威 = `docs/core/design/DOC-DISCIPLINE.md` §3.15）：本批触碰面 14 行超 300（设计轮残留 + fix 轮加重）⇒ 按「改动面零新增敲打」惯例一次性折行收正（先例 = 设置菜单组项收窄批 #820 同法门读）。

**折行（零语义——仅断行，字面零改 ∥ 零增删）**：桌面 `SETTINGS.md` 八行（:129 ∥ :130 ∥ §2.18 项 1 ∥ 2 ∥ 3 ∥ 4 ∥ 6 ∥ 7）∥ VSC `SETTINGS.md` 六行（§2.10 判据域边界 ∥ §2.17 ① 面形 ∥ ② 面形 ∥ ② 层序前提 ∥ ③ 落法 ∥ §5 在册 css 越线注）。折后 = 桌面 +9 行 ∥ VSC +6 行——**§2.11 ∥ §2.17 ∥ §2.18 ∥ §3.1–§3.2 ∥ 变更记录邻域行号整体漂移（+1~+17 as-of）**；「修正块」内坐标 = 折行前 as-of（终值 = 报告表）。

**门读（收正后）**：行宽 **43 ⇒ 29**（−14——移除者全为上述触碰行；余 29 = 他批在册：core 6 ∥ 桌面 `PROJECT.md` 4 ∥ 桌面 §2.16 / #1031–#1035 块 8 ∥ VSC §2.10 / §2.16 11——本轮零触）∥ 锚 **28 悬空（前後同——零新增）** ∥ 行数面 **15 条差异（报告态，前後同）**。本批触碰行 = **零命中**。

**产品码零触 ∥ 零新语义**（折行 = 人类可读判据的形式合规；内容逐字未动）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**审查对象** = 添加入口弹窗化统一（#1054）设计——四档全读（`docs/vsc/design/SETTINGS.md` §2.17 / U-S18 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §13 三行 ∥ `docs/desktop/design/SETTINGS.md` KD-77 / §2.18 / §3.2 本批块 ∥ `docs/desktop/design/UI.md` §4.1 三行）；批档 `docs/batches/2026-10-07-add-dialog-unify.md`（§1.4 扫面表 / §2 明细 / 用例面）属评审范围外——凡以「明细 = 批档 §2」外指的项未核，不作判据。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership（机制级描述冲突） | 🔴 | 同一机制（设置弹窗值集 = 校验面 `SCOPES`）在 `docs/desktop/design/SETTINGS.md` 内并存互斥计数：KD-68 ④（:29）本笔已写「`null ∥ 十值闭集`（七段名 + `providerAdd`（三端对齐批）∥ `mcpForm` ∥ `consultAdd`（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054——§2.18）= 校验面 `SCOPES`」，同格后文仍留「**校验面 `SCOPES` = 八名**（七段名 + `providerAdd`」与「`SCOPES`（装配面派生，**七名**——设置页对齐）」；§2.11（:129）「**as-of 本批——现值八名**」、（:130）「**as-of 本批七组——现值八组**」未随；§2.18 项 6（:228）本批目标 = 「弹窗值集 **八 ⇒ 十**」——同档两处「= SCOPES」活句给出 10 与 8 两个定义值（本笔只更新其一，矛盾落在规范面）。 | 把同档所有在册现值 / 定义句（KD-68 ④ 两处 SCOPES 句 + §2.11 两处现值标记）一次收齐到本批目标值 10（`mcpForm` ∥ `consultAdd` 两新组各 +1），或就地补 as-of 标记；变更记录（:453）「（KD-68 ④ 本体内计数句 → 实施后回填）」的缓办不解除规范面互斥——计数收齐属 D3 同批义务（先例 = 三端对齐批 fix 轮「§2.11 七名句 as-of 收正」）。 |
| 2 | Acceptance / 验收面 | 🟡 | VSC `docs/vsc/design/SETTINGS.md` §2.17（:516-:548）全文无「机检面 / 判据」指针（同档 §2.10 :316 ∥ §2.15 :469 ∥ §2.12 :391 均有；桌面同批 §2.18 项 7（:229）明写「机检 = 批内件 `docs/batches/2026-10-07-add-dialog-unify.test.mjs`（拟新增」+ 真机走查）——本端三改的验收面只剩「明细 = 批档 §2」外指，评审范围内不可见。 | 在 §2.17 补「判据 / 机检面」行（测试资产指针 + 腿集：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见 ∥ 跨框互清 ∥ 页脚零出站），沿 §2.10 / §2.15 体例；与桌面 §2.18 项 7 对齐同一批内件名。 |
| 3 | Affected-file annotations（受影响文件行数注） | 🟡 | VSC 侧本批无受影响文件表：§2.17 引入两新档（`settings-mcp-dialog.js`（:525）∥ `settings-consult-dialog.js`（:536））并触碰 `settings-mcp.js`（现 273——§3 :571 登记）∥ `settings-provider-dialog.js`（:532 跨框互清改）∥ `settings.js` ∥ `webview/input.js` ∥ 宿主 `panel-messages-settings.mjs` ∥ `provider-flows.mjs`（:545）——均无现行行数 / 预期 delta；§3 无本批登记行（桌面同批给出 15 行「现行 ⇒ 预估」）。 | 补 VSC 侧受影响文件行（现行行数 + `≤±N` / 结构不变；两新档给估值），沿桌面 §3.2 本批块体例；跨 300 者同步给拆分评估登记。 |
| 4 | Affected-file annotations / 跨档一致 | 🟡 | 桌面受影响文件块（:360-:376 十五行）漏两处本批触碰档：`store.mjs`（§2.18 项 6（:228）「`store.mjs` 闭集注释 八值 ⇒ 十值（注释级）」）∥ `i18n.mjs`（`docs/desktop/design/UI.md` :499「本批 #1054 触碰登记——键数链注续链」≈421）——两档均无现行行数 / delta；#817 先例在块内为 `store.mjs` 330 ⇒ 331 成行。 | 本批块补 `store.mjs` / `i18n.mjs` 两行（现行 ⇒ 预估，注明注释级 / 链注触碰），使块与 §2.18 项 6、UI.md §4.1 三行同口径。 |
| 5 | Clarity / 跨端一致 | 🟡 | 行集初值口径未收齐：VSC（:528）「新增态 = 表单空（type 回首项 ∥ 三组行集各一空行 ∥ `#mcp-status` 清）」与同档 §2.4（:51）「**零项 ⇒ 零行**（零假造）」并存的适用边界未写（何者为存量回显规则、何者为新增态起手）；桌面 KD-76 ①（:32）同写「**零项 ⇒ 零行**」而 KD-77（:33）/ §2.18 项 3（:225）未写新增态起手行数——两端「逐元素同形」标尺下存在未登记端差风险。 | 明写行集规则边界（「零项 ⇒ 零行」适用面 = 存量回显；新增态起手行数两端同值），桌面侧同步写明，或在批档登记端差。 |
| 6 | Completeness / 交互面 | 🟡 | 桌面 `consultAdd` 弹窗的「取消」面未落文：五路关判据（:221「五路关：保存（守卫通过才发 + 关）∥ 取消 ∥ 背板 ∥ Esc ∥ `closeSettings()` 同清」）要求取消面，`mcpForm` 已明写补钮（:225「取消（两态同名钮 `settings:mcpCancel`——**新增态补钮**）= 关弹窗」），而 `consultAdd`（KD-77 ② :33 / §2.18 项 2-3）只见「提交 / 成功 ⇒ `closeModal()`」；VSC 侧同项已明写（vsc :537「取消 = `settings.cancel`（既有）」）。 | 写明 `consultAdd` 的取消控件（钮 ∥ 键 ∥ 锚）或注明由 ✕ / 背板承担；两端同名同义优先（跨端词键惯例）。 |
| 7 | Doc-state / 坐标计数 | 🔵 | 同域两处现值残余：（a）`SCOPES` 定义位 §2.10（:122）「定义位 = `thincoder-desktop/renderer/mount-settings.mjs:46`」 vs KD-68 ④（:29）「定义位 = `thincoder-desktop/renderer/mount-settings.mjs:48`」（三端对齐批 fix 轮已把 §2.16 ∥ KD-68 同值实例收正 `:48`，§2.10 未随）；（b）`MODAL_READS` 基数 §2.11（:130）「现值八组」 vs §3.1（:256）「`MODAL_READS` 九」——§2.18 项 6「`MODAL_READS` +2 行」未钉基数。 | 两处随本批同域触碰一并收正（或就地标 as-of）；`MODAL_READS +2` 明写基数，使实施后回填可核。 |
| 8 | Discipline consistency | 🔵 | 页脚直开用防御式 `?.`：vsc :544「（`window._openAddProviderDialog?.()`）」；同档 §2.10（:312）对同族门明写「**不取防御式回退**（`window._confirmSecretDelete?.()`）」——且该入口与设置模块同文档、点击前必已安装（:311）⇒ `?.` 会把缺门静默化。 | 统一两处口径：页脚径按 §2.10 纪律取裸调用（缺门响亮失败），或明写 `?.` 的保留理由（沿 §2.16 :479 首启径先例），勿留两种未解释读法。 |
| 9 | Clarity / 层序前提 | 🔵 | 会诊弹窗的模型浮层与弹窗共层序前提未落文：vsc :537「**模型选择件 = 现有浮层复用**（`openModelMenu`——点选回填两字段；`closeConsultDialog` 同清浮层）」；同档 §2.10（:221）登记的层序事实 =「与 `mm-overlay` 1000 同层，无菜单在场即无遮挡」——「菜单须与弹窗同屏」的本面上该前提不成立，文档未给替代前提。 | 补一句层序前提（浮层与 `.settings-dialog` / `.settings-dialog-backdrop` 的 z 与挂载序，含「后开者在上」判据），沿 §2.16 ① 把既有 z 事实明文化的先例。 |
| 10 | Doc hygiene / 记录面 | 🔵 | `docs/desktop/design/UI.md` §4.1 三行（:499 ∥ :500 ∥ :502）已带「本批 #1054 触碰登记」，但该档变更记录（:574 起）无对应 #1054 行（同档其余批触碰均带变更行，如 :816 的 #1036 条）。 | 补一行 UI.md 本批变更记录（触碰行 = §4.1 三行），或删「本批 #1054 触碰登记」措辞使行值与记录面自洽。 |

**抽查通过项**：两端新键名逐字同（`settings.mcpAdd` ∥ `settings.mcp.addTitle` ∥ `settings.mcp.editTitle` ∥ `settings.consultAddTitle`）；统一判据句两端同句；会诊「满 5 ⇒ 禁用 + 提交守卫同判据」两端同规；桌面三行越 300（`mount-settings-exits` 289 ⇒ ≈302 ∥ `mount-settings-segments-mcp` 299 ⇒ ≈314 ∥ `mount-composer` 299 ⇒ ≈302）均带拆分评估登记（阈值 450 / 下次结构改动）；`settings-mcp.js` 273 ⇒ 抽取后收缩、无跨 500 面。

计数：🔴 1 · 🟡 5 · 🔵 4（共 10）。

VERDICT: changes-required

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
