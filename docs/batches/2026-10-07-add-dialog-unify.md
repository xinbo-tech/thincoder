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

### 1.8 评审轮 2 首跑（#13）机检未过 → 复跑（主 agent · 2026-10-07 23:07）

- **#13 = 机检裁定非通过**（token 未签发）：四档修正实体均落位（其逐项核对 = 10/10 修正 + 无 🔴；父侧抽读同证——§1.7 在案），但 **4 条引文含省略号（非连续子串）⇒ 0/4 过校验** ⇒ 整体降级 changes-required。**非实质发现**（评审侧引文格式所致）。
- 处置 = **复跑轮 2**（附引文规范提示：完整路径 + 连续子串；禁省略号/拼接）。

### 1.9 评审轮 2 复跑（#15）通过 + 代签 + 实施派发（主 agent · 2026-10-07 23:12）

- **#15 = Approved**（token 已签发——运行时凭据不落档；机检列表内条为日志回声噪声，裁定面无未决 🔴）。修正 10/10 逐项复核在案（§1.7/§1.8）。
- 残余 🔵（变更行「六腿」vs 腿集七项计数不一）= 非阻塞——下一笔（实施后回填轮）对齐或注明。
- **代签 + 实施派发**：两舱并行——VSC 11 件（#17）∥ 桌面 15 件（#18）；批内件舱（两舱落后续派——dependsOn）。

（舱号勘正：§1.9 预记 #17/#18 为误——实派 = **VSC 舱 #18** ∥ **桌面舱 #19**（并行在跑）∥ 批内件舱 = 挂 dependsOn（#18 ∥ #19 settle 后自动开跑）。）

（批内件舱扩编重派：原 **#20**（仅新件 1 档）经取消 ⇒ 重派 **#21**（写入域 = 新件 + 随正四件，5 档——并入设计 :102 已裁读的既有测试面随动名单：`2026-10-07-mcp-kv-input` ∥ `2026-09-30-desktop-residuals` ∥ `2026-10-02-desktop-settings-menu-upgrade` ∥ `2026-09-29-parity-b10-ui-w3`）；仍挂 dependsOn（#18 ∥ #19）。）

（批内件舱再扩编：#21（5 档）经取消 ⇒ 重派 **#22**（**7 档**）——并入 #19 上抛两项实锤：⑥ `2026-10-07-provider-config-parity-desktop.test.mjs`（:211 钉旧八值 `SCOPES` 正则——#19 实跑红；设计随动表未列，父裁随动必改）∥ ⑦ `2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（#19 审计新发现：自页槽取 MCP 表单）。仍挂 dependsOn（#18 ∥ #19——均已交，应即启）。）

（设计档陈标记收正（**父侧直接执行**〔可 revert〕· 2026-10-07 23:5x——D8 陈标记清除）：批内件 13/13 已落 ⇒ 三处「（拟新增」⇒「（**已落**」——vsc `SETTINGS.md:555` ∥ 桌面 `SETTINGS.md:237` ∥ `:388`；零新语义。另：他批残余一处未动——桌面 `SETTINGS.md:437`（`mcp-kv-input.test.mjs` 行——归该线收口随正）。）

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

### 交付回填轮（2026-10-07 · 设计面 · eng-designer）
**动因**：两舱已交付（VSC #18 ∥ 桌面 #19，均 clean）⇒ 设计档与实读对齐（三档：`docs/vsc/design/SETTINGS.md` ∥ `docs/desktop/design/SETTINGS.md` ∥ `docs/vsc/design/VSC-DEBT.md`——明细 = 各档变更行 ∥ 交付报告）。**随正名单更新（父裁 4 ⇒ 6）**：上列「既有测试面随动」**补两件**——第 5 件 = `docs/batches/2026-10-07-provider-config-parity-desktop.test.mjs`（来源 = **桌面舱实跑红**：`:211` 钉旧八值 `SCOPES` 正则 ⇒ 随十值收正）∥ 第 6 件 = `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`（来源 = **桌面舱审计新发现**：自页槽取 MCP 表单 ⇒ 随新面收正）。**零新语义**（实读值 ∥ 计数 ∥ 注 ∥ 登记）；产品码零触（回填轮）。

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

### 轮次 2（评审子代理）

**轮 2 · 验修正（findings 1–10 逐项 · 四档 fresh read）**

| # | Orig# | 文件 | 严重度 | 状态 | 备注 |
|---|---|---|---|---|---|
| 1 | 1 | `docs/desktop/design/SETTINGS.md` | — | Fixed | KD-68 ④ 计数收齐（:29）——「`null ∥ 十值闭集`（七段名 + `providerAdd`（三端对齐批）∥ `mcpForm` ∥ `consultAdd`…）= 校验面 `SCOPES`」∥「**校验面 `SCOPES` = 十名**（七段名 + `providerAdd`…）」；「七名」句退场、「八名」无残留；旁证 §2.11 现值十名（:130）∥ §2.18 项 6 弹窗值集 八 ⇒ 十（:235） |
| 2 | 2 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 判据 / 机检面在位（:555）——批内件腿集（五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见 ∥ 跨框互清 ∥ 页脚零出站 ∥ 词面五新键两语）+ 真机走查 |
| 3 | 3 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 受影响文件表十一行在位（:557–:573）；四实读收正入表（`settings-provider-dialog.js` 282 ∥ `input.js` 125 ∥ `panel-messages-settings.mjs` 236 ∥ `provider-flows.mjs` 38）；`settings.css` 412 >300 随注（:573） |
| 4 | 4 | `docs/desktop/design/SETTINGS.md` | — | Fixed | §2.10 项 3 定义位 :46 ⇒ :48（:122），与 KD-68 ④（:29）∥ §2.16 项 1（:194）同值 |
| 5 | 5 | vsc+desktop SETTINGS | — | Fixed | 行集起手口径两端收齐「起手零行」：vsc :530（三组行集零行）∥ §2.4 :51（存量回显 ∥ 新增态起手同判）；desktop KD-76 ①（:32）∥ §2.18 项 3（:229） |
| 6 | 5 | `docs/desktop/design/SETTINGS.md` | — | Fixed | §2.11 现值收正（:130/:131）——十名 ∥ 八组 + 本批 +2 ⇒ 十组（`MODAL_READS` 定义位 :52）；§3.1 `MODAL_READS` 九 ⇒ 八组（:265） |
| 7 | 6 | `docs/desktop/design/SETTINGS.md` | — | Fixed | §3.2 本批块 17 行（15 ⇒ 17）：+`store.mjs`（:384）∥ +`i18n.mjs`（:385） |
| 8 | 7 | `docs/desktop/design/SETTINGS.md` | — | Fixed | `consultAdd` 取消钮补位：KD-77 ②（:33）∥ §2.18 项 3（:231）——词 `settings.cancel`、锚 `settings:consultCancel`，与 `mcpForm` 同形 |
| 9 | 8 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 ② 层序前提在位（:541–:543）——浮层 1000/1001/1002 与弹窗 999/1000、同层挂载序「后开者在上」 |
| 10 | 9 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 ③ 页脚改裸调用（:550）——`window._openAddProviderDialog()`、不取防御式回退 |
| 11 | 10 | `docs/desktop/design/UI.md` | — | Fixed | §4.1 三行 #1054 触碰登记（:499/:500/:502：`i18n.mjs` ≈421 ∥ `i18n-views.mjs` ≈408 ∥ `i18n-settings.mjs` ≈158）+ 变更行（:820） |
| 12 | (new) | `docs/vsc/design/SETTINGS.md` | 🔵 | New（非阻塞） | 变更行「六腿：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见 ∥ 跨框互清 ∥ 页脚零出站」（:683）与 §2.17 腿集枚举（:555，含「词面五新键两语」——共七项）数目不一；建议下一笔对齐或注明 |

计数：🔴 0 · 🟡 0 · 🔵 1（原 findings 1–10 全 Fixed；新 🔵 1）
VERDICT: pass

### 轮次 3（评审子代理）

**轮 2 复跑（引文收正 · findings 1–10 逐项 · 四档 fresh read）**

| # | Orig# | 文件 | 严重度 | 状态 | 备注 |
|---|---|---|---|---|---|
| 1 | 1 | `docs/desktop/design/SETTINGS.md` | — | Fixed | KD-68 ④ 两处计数收齐（:29「`null ∥ 十值闭集`」与「**校验面 `SCOPES` = 十名**（七段名 + `providerAdd`（三端对齐批 · 2026-10-07——§1 **KD-75**）∥ `mcpForm` ∥ `consultAdd`」同格并在；「七名」句已退）；§2.11 现值十名（:130）∥ §2.18 项 6「弹窗值集 **八 ⇒ 十**（+`mcpForm` ∥ `consultAdd`——`SCOPES` 派生随动）」（:235） |
| 2 | 2 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 判据 / 机检面在位（:555——「腿集：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见（name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留）∥ 跨框互清（各弹窗只清自身两件）∥ 页脚零出站（`addProvider` = 本地面动作——零 `postMessage`）∥ 词面五新键两语」+ 真机走查） |
| 3 | 3 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 受影响文件表十一行在位（:557-:573）；四实读收正入表：:564「`thincoder-vscode/webview/settings-provider-dialog.js` | **282 ⇒ ≈280**」∥ :567「`thincoder-vscode/webview/input.js` | **125 ⇒ ≈125**」∥ :568「**236 ⇒ ≈225**」∥ :569「**38 ⇒ ≈36**」；跨 300 面注在（:573「**跨 300 面**：`settings.css` **412**（>300 在册——本批 `±0` ⇒ 拆分窗口顺延；单源 = §3 样式档行）」） |
| 4 | 4 | `docs/desktop/design/SETTINGS.md` | — | Fixed | §3.2 本批块补两行（15 ⇒ **17 行**）：:384「`thincoder-desktop/renderer/store.mjs` | **370 ⇒ ≈370**（±0——闭集注释 八值 ⇒ 十值（注释级）」∥ :385「`thincoder-desktop/renderer/i18n.mjs` | **420 ⇒ ≈421**（键数链注续链」 |
| 5 | 5 | vsc+desktop SETTINGS | — | Fixed | 行集起手零行两端收齐：vsc :530「三组行集零行——「零项 ⇒ 零行」同判（起手零行，行由「添加行」落）」∥ vsc §2.4 :51「**零项 ⇒ 零行**（零假造——存量回显 ∥ 新增态起手同判：起手三组皆零行，行由 `[+ 添加行]` 落——加行 = 尾附一空行）」∥ desktop KD-76 ① :32「**零项 ⇒ 零行**（存量回显 ∥ 新增态起手同判——起手三组皆零行，行由「添加行」钮落）」∥ desktop §2.18 项 3 :229「三组行集零行（「零项 ⇒ 零行」同判 ∥ 两端同值）」 |
| 6 | 6 | `docs/desktop/design/SETTINGS.md` | — | Fixed | `consultAdd` 取消钮补位：KD-77 ② :33「**取消 = `settings.cancel` 钮（与 `mcpForm` 同形）= 关弹窗（切片复位随关）**」∥ §2.18 项 3 :231「**取消 = 钮（词 `settings.cancel`；锚 `settings:consultCancel`——与 `mcpForm` 同形）= 关弹窗（切片复位随关）**」 |
| 7 | 7 | `docs/desktop/design/SETTINGS.md` | — | Fixed | §2.10 定义位 :48（:122「定义位 = `thincoder-desktop/renderer/mount-settings.mjs:48`」）∥ §2.11 `MODAL_READS` 定义位 :52 +「**本批 +2 行 ⇒ 十组**」（:131）∥ §3.1 读数（:265「`SCOPES` 八名闭集（含 `ADD_MODAL_GROUP`）∥ `MODAL_READS` 八组」） |
| 8 | 8 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 ③ 页脚裸调用（:550「（`window._openAddProviderDialog()`——**裸调用 ∥ 不取防御式回退**：门由 `initSettings`（`webview/settings.js:39`）安装、同文档 ⇒ 点击前必已安装；缺门响亮失败——沿 §2.10 纪律）」） |
| 9 | 9 | `docs/vsc/design/SETTINGS.md` | — | Fixed | §2.17 ② 层序前提在位（:541「**层序前提（浮层与弹窗同屏——本面）**」∥ :543「**同层（1000）以挂载序破平——后开者在上**：浮层由弹窗内点按开启（晚于弹窗挂载）⇒ 恒在弹窗之上」） |
| 10 | 10 | `docs/desktop/design/UI.md` | — | Fixed | §4.1 三行 #1054 触碰登记（:499「**≈421**（本批 #1054 触碰登记——键数链注续链；实施后回填）」∥ :500「**≈408**（本批 #1054 触碰登记——+1 键 × 两语（`settings.consultAddTitle`）；实施后回填）」∥ :502「**≈158**（本批 #1054 触碰登记——+3 键 × 两语（`settings.mcpAdd` ∥ `settings.mcp.addTitle` ∥ `settings.mcp.editTitle`）；键族 60 ⇒ 63；实施后回填）」）+ 变更行（:820） |
| 11 | (new) | `docs/vsc/design/SETTINGS.md` | 🔵 | New（非阻塞） | 变更行 :683「六腿：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见 ∥ 跨框互清 ∥ 页脚零出站」与 §2.17 :555 腿集枚举七项（含「词面五新键两语」）计数不一；建议下一笔对齐或注明 |

计数：findings 1–10 全 Fixed（无剩余）；新增非阻塞 🔵 1。
VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**父侧代签（用户 2026-10-07 22:09「可以，这两条线都自动跑到交付。」= 全链授权）——三条件齐备**：① 设计评审 = 轮 1 changes-required（10 发现）→ 修正 10/10 落 + 核验 ✓ → 轮 2 复跑 **Approved**（#15——首跑 #13 因评审侧引文格式被机检降级，非实质）；② 修正全落并逐条核验（§1.7/§1.8 在案）；③ token 已签发（值不落档——运行时凭据）。

**批准范围 = 本批全量**：VSC 三改（MCP 弹窗 ∥ 会诊弹窗 ∥ 页脚直开）∥ 桌面两弹窗 + 页脚直开（`mcpForm` ∥ `consultAdd`）∥ 批内件。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-07（终态 clean：偏差审计 1 轮 + 代码评审 1 轮 pass，无 must-fix）



### 实施轮 · VSC 舱（eng-coder · 2026-10-07）

**轮次**：initial。**终态 = clean**（内部 explore 偏差审计 = 零偏差 ∥ advisor 代码评审 = pass）。

**三改落盘（逐档——实施后实读）**：
- ① MCP 表单 ⇒ 弹窗：新档 `thincoder-vscode/webview/settings-mcp-dialog.js`（**219** 行——导出 `openMcpDialog`/`closeMcpDialog`；单例 ∥ 开框重置（新增态表单空 ∥ 三组行集零行 ∥ `#mcp-status` 清）∥ 初始焦点 `#mcp-name`（新增）/`#mcp-type`（编辑）+50ms ∥ 五路关（保存守卫通过才发+关 ∥ 取消 ∥ 背板 ∥ 框内 Esc stopPropagation ∥ `closeSettings()` 同清）∥ 拒因可见（name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留 ∥ `#mcp-status` 显 `settings.mcp.nameRequired`）∥ 无代际面（设计明写））。`webview/settings-mcp.js` **273 ⇒ 126**（只留列表 ∥ 探测结果 ∥ 状态；两入口 ⇒ `openMcpDialog(null)` / `openMcpDialog({...cfg,name})`）。`webview/settings-tools.js` **212**（卡内 `mcpFormHtml()` 引用净删——清单外改动，见下）。
- ② 会诊添加 ⇒ 弹窗：新档 `webview/settings-consult-dialog.js`（**151** 行——卡 `#consult-add-dialog`；两字段 provider ∥ model 显示值；模型选择件 = 复用 `openModelMenu`（点选回填两字段）；关框同清浮层；提交 = 追加完整行——复用行族 `mountSlot` ∥ `setRowModel`（`settings-models.js` 导出）⇒ 派 `consult-rows-changed`（既有保存链）⇒ 关框；守卫 = 不齐 ∥ 满 ⇒ 零发送）。`webview/settings-models.js` **217 ⇒ 214**（入口改开框 ∥ 行追加口出让 ∥ 上限 5 随刷（入口钮 disabled——`consult-rows-changed` 两径：追加 ∥ 删行）∥ 两件导出）。
- ③ 页脚直开（零宿主往返）：`webview/input.js` OUT 表 `addProvider` 条 ⇒ `() => window._openAddProviderDialog()`（**裸调用——不取 `?.`**）；宿主 `src/extension/panel-messages-settings.mjs` 无载荷 else 支退役（残留 = 畸形载荷 ⇒ `console.error` 零动作）；`src/extension/provider-flows.mjs` `addProviderFlow` 包装净删（import ∥ 函数两处——全树零残留引用）。
- ④ 跨框互清收正：`webview/settings-provider-dialog.js` 关径收窄为自身两件（原 `.settings-dialog*` 类全扫退场）；`webview/settings.js` `closeSettings()` = 三清同拍（provider ∥ mcp ∥ consult）。
- ⑤ 词面：`locales/en.json ∥ zh.json` **各 +5 键 × 两语**（296 键同序）：`settings.mcp.addTitle` ∥ `.editTitle` ∥ `.nameRequired` ∥ `settings.consultAddTitle` ∥ `settings.consultProvider`（值同桌面）。

**验证读数**：
- `node scripts/check-syntax.mjs` ⇒ `check-syntax: 139 JS files OK`（逐档 `node --check` 含在内）。
- `node test/smoke-settings.mjs` ⇒ `SMOKE-OK: settings panel split is behaviorally wired`。
- happy-dom 真机探针（临时件 `thincoder-vscode/.thincoder/tmp/add-dialog-probe.mjs`——**用后已删**）：**69/69 pass ∥ exit 0 ∥ stderr 零错**。覆盖 = MCP（开框重置/单例/五路关/拒因可见/编辑态预填+name 只读/型组与 kv 行机制保留）∥ 会诊（点选回填两字段/提交追加+保存链+关框/上限 5 双判据/五路关+同清浮层/重开开框重置）∥ 跨框互清（两向：关 provider 不伤 mcp、关 mcp 不伤 provider）∥ 初始焦点（两态+会诊）∥ 页脚直开（直开添加弹窗 ∧ `addProvider` 出站消息 = 0 条）。
- 既有测试面：`test/files.mjs` ∥ `test/integration/files.mjs` 皆空清单（2026-09-28 全清重置）⇒ 本面无既有测试可点跑；`smoke-provider.mjs` = 手工连通性脚本（纯核、不触设置面）。

**内部审计与代码评审（同会话环）**：
- **explore 偏差审计（1 轮）**：**clean**——五轴（部分未实现 ∥ 静默简化 ∥ 设计漂移 ∥ 清单外改动 ∥ 零触边界）零发现；清单外改动 `settings-tools.js` 披露核验 = 如实（设计 11 行表缺此行 ⇒ 建议回填轮补行）。
- **advisor 代码评审（1 轮）**：**pass**（🔴 0 ∥ 🟡 1 ∥ 🔵 3）。响应表（findings → 处置）：
  1. 🟡 会诊弹窗追加的行，其 ✕ 在「关面板→重开」前无监听（`settings-consult-dialog.js:142` 建行 ∥ `settings-models.js:210-211` 仅建面期逐行绑定 ∥ 面板推送不重建）→ **本轮不修（上抛待裁）**：核实为**既存行为**（改动前 `bindConsultRows` 同只绑现存行——旧径无删行绑定；本轮「行追加口出让」忠实照搬）+ 设计冻结面（§2.17 ④「会诊行渲染零改」）+ 任务书「零新语义」⇒ 建议父侧轻通道同笔修（容器级事件委托两行）或台账登记。
  2. 🔵 Esc 仅卡片内拦截（焦点在 body 时兜底为 chat.js 全局关面板）→ 沿确认弹框（`settings-widgets.js:98`）∥ provider 弹窗同形先例，维持；已披露。
  3. 🔵 行 markup 双份（新档 `:142` ↔ `settings-agent.js:53`）→ 择机抽行工厂（本批冻结面内不改）；已披露。
  4. 🔵 设计 §2.17 受影响文件表「实施后回填」未落（实测 **219/151/126** vs 估 ≈125/≈95/≈185）→ 归设计回填轮；读数供父侧。
- **fix round（≤5 轮内）**：**1 轮**——探针先红：+50ms 焦点定时器在框秒关后取 null 抛错（两新档同病；provider 先例持元素引用故安全）⇒ 修为**元素引用先行捕获**（`settings-mcp-dialog.js:172-173` ∥ `settings-consult-dialog.js:119-121`）⇒ 复跑绿、stderr 零错。评审后零代码改动。

**行数实测（内容行数口径）**：`settings-mcp.js` **126** ∥ `settings-mcp-dialog.js` **219** ∥ `settings-consult-dialog.js` **151** ∥ `settings-models.js` **214** ∥ `settings.js` **199** ∥ `settings-provider-dialog.js` **284** ∥ `input.js` **128** ∥ `settings-tools.js` **212** ∥ `panel-messages-settings.mjs` **238** ∥ `provider-flows.mjs` **39** ∥ `locales/en.json ∥ zh.json` **298 / 298**。全档 <300（`settings.css` 412 未动、在册）。

**设计偏差**：**零**（§2.17 三改 × 五路关 × 词面五键逐条对表）。**观察两条**（非偏差）：① 死 ✕ = 既存行为（响应表 #1，待裁）；② `docs/batches/2026-10-07-mcp-kv-input.test.mjs` L3 腿引旧出口面（`openMcpForm`/`mcpFormHtml`）⇒ 随批内件舱改写（设计「既有测试面随动」已载）。

**零触核验**：`webview/settings.css` ∥ `webview/onboarding.js`（交棒行 `?.` 保持）∥ 桌面树 ∥ 核（thincoder-core ∥ render-core）∥ 服务端 ∥ `docs/**`（除本段）零触。

**实施记录（eng-coder · 桌面舱 #19 · 2026-10-07）**

**范围**：批 `2026-10-07-add-dialog-unify` 桌面舱 —— MCP 表单 ⇒ `mcpForm` 弹窗 ∥ 会诊添加 ⇒ `consultAdd` 弹窗 ∥ 页脚「Add provider…」直开；弹窗值集 八 ⇒ 十。

### 5.1 交付摘要（16 档，逐件）

| # | 文件（`thincoder-desktop/` 起） | 改动 | 实读行数 |
|---|---|---|---|
| 1 | `renderer/views/settings.mjs` | +两组常量（名单源）∥ `sectionBody` +两新组支 ∥ `settingsModalTree` 标题逐态（`mcpForm` 依 `form.editing` 两态词）+ **段态词恰一收正**（去非表单支叠渲）+ 两新卡 `data-initial-focus="field"` | 439 |
| 2 | `renderer/views/settings-sections-mcp.mjs` | `mcpBody` 去常驻表单、+入口钮（`settings:mcpAddOpen`）∥ +导出 `mcpFormBody`（载入中零表单）∥ 表单取消钮两态同名（新增态补钮） | 261 |
| 3 | `renderer/views/settings-sections-models.mjs` | 内联增行表单退场、段尾入口钮（`settings:consultAddOpen`；行满 5 ⇒ disabled）∥ +导出 `consultAddBody`（提交 `settings:consultAdd` ∥ 取消 `settings:consultCancel`） | 186 |
| 4 | `renderer/views/settings-sections.mjs` | re-export 两新件 | 96 |
| 5 | `renderer/mount-settings.mjs` | `SCOPES` 八 ⇒ 十 ∥ `MODAL_READS` +2（`mcpForm → loadMcp` ∥ `consultAdd → loadAgent`） | 264 |
| 6 | `renderer/mount-settings-exits.mjs` | `resetFacets` +2 支（`mcpForm` ⇒ `form` 清 ∥ `consultAdd` ⇒ `models.picker` 复位）；`openModal` ∥ `closeModal` 同注入两段族 | 307 |
| 7 | `renderer/mount-settings-segments-mcp.mjs` | 入口开径 ∥ **编辑开径 = 先开后写**（拒径零写零关）∥ add ∥ update 成功 ⇒ `form` 复位 + 本框在场关框 ∥ 取消 = 关弹窗 | 327 |
| 8 | `renderer/mount-settings-segments-models.mjs` | 入口开径 ∥ 取消（关弹窗）∥ 提交成功 ⇒ picker 复位 + 关框 | 192 |
| 9 | `renderer/composer-wire.mjs` | `addProvider` ⇒ `openSettings?.(ADD_MODAL_GROUP)`（删 ∥ 密钥仍页；常量自视图档引） | 286 |
| 10 | `renderer/mount-composer.mjs` | 两 dep 转口携组名（`:160` ∥ `:196`） | 300 |
| 11 | `renderer/app.mjs` | `openSettings(group?)` 双口提升（缺组 ⇒ 页 ∥ 携组名 ⇒ 组弹窗） | 336 |
| 12 | `renderer/i18n-settings.mjs` | +3 键 × 两语（`settings.mcpAdd` ∥ `.mcp.addTitle` ∥ `.mcp.editTitle`）；键族 60 ⇒ 63 | 158 |
| 13 | `renderer/i18n-views.mjs` | +1 键 × 两语（`settings.consultAddTitle`） | 408 |
| 14 | `renderer/store.mjs` | `modal` 闭集注释 八值 ⇒ 十值（注释级） | 370 |
| 15 | `renderer/i18n.mjs` | 键数链注续链（`SETTINGS_DICT` 60 ⇒ 63 ∥ `VIEWS_DICT` 144 ⇒ 149〔链前值滞后 4：#1036 四键未逐笔续计，按盘收正〕∥ `HOST_DICT` 319 ⇒ 323）+ `settings.*` 63 键 | 425 |
| 16 | **出表件** `renderer/mount-settings-reads.mjs` | `loadMcp` 成功 ∥ 失败两径改「并持现切片」（`{ ...held, ... }`）—— 见 5.2 决策 #1 | 206 |

批内件（`docs/batches/2026-10-07-add-dialog-unify.test.mjs`）= 另舱，**本舱零写 `docs/batches/**`**。零触面实核：`settings-modal.mjs` ∥ `settings.css` ∥ `settings-modal.css` ∥ `src/main/**` ∥ 核 ∥ CLI ∥ VSC 零改（宿主初始焦点既有面即取 `form .settings-field`，两新卡直接落首控件）。

### 5.2 决策透明表

| # | 决策 | 依据 ∥ 备选 | 处置 |
|---|---|---|---|
| 1 | **出表件** `mount-settings-reads.mjs`：`loadMcp` 并持切片 | 设计句「编辑态 = 开径后写 `form.editing`」被弹窗读取链击败（`MODAL_READS.mcpForm` 开框即读，原码两径硬替换 mcp 切片、不带 `form` ⇒ 回执落地即丢编辑态）。备选 = 编辑径读后重写（双读 ∥ 乱序风险）、不动读面（交付面缺陷） | 取最小改：两径 `{ ...held, ... }`（同档 #671「读面并持现切片 · 复位权在出口族」口径）；已披露，审计与代码评审双核必要性成立 |
| 2 | 两入口 handler 落点：**住两段族内**，exits 只注入 + 装配合并 | 设计 §3.2 行 6「两入口 handler」∥ 行 7/8「入口/编辑开径」「入口 handler」两读冲突；取行 7/8（两行一致 ∥ 族内注册与 `openModal` 降级同址） | 实施即此；审计复核「行为等价，建议保留并按此收正行 6 措辞」—— 回填轮建议：设计行 6 措辞收正 |
| 3 | 三标题词值取 VSC 同批落地值 | 桌面设计未给三标题值（原拟派生）；核 VSC 已落盘 `locales/{en,zh}.json` 同名键 ⇒ 逐字取齐（`Add MCP Server` ∥ `Edit MCP Server` ∥ `Add Consult Model` / 中文同）—— 跨端同键同值 | 已取齐；审计 D4 复核两语全等 |
| 4 | 两弹窗体载闸各自沿旧：`mcpForm` = 非 `loading` ∥ `consultAdd` = `ready` | 各自旧闸（`mcpBody` 旧「loading 期零表单」∥ models 段 `ready` 门内原内联表单） | 实施即此 |
| 5 | 取消语义收正为「关弹窗」 | 设计明文（KD-77 ①②）；MCP 旧语义「回新增态」退场 | 实施即此（两弹窗同形） |

### 5.3 验证读数

- `node --check` × 16 档全绿（含出表件）。
- **变更时回路**（临时件 `thincoder-desktop/.thincoder/tmp/add-dialog-unify.smoke.mjs`，不入仓）：**22/22 通过** —— 构树（两新组卡 ∥ 标题逐态 ∥ 焦点声明 ∥ 段态词恰一）∥ 段体（零表单 + 入口钮两态 ∥ 行满 5 禁用）∥ 出口（入口开径 ∥ 先开后写 ∥ 拒径零写 ∥ 两取消关框 ∥ 会诊提交成功关框 ∥ `resetFacets` 两支）∥ 读面并持（成功 ∥ 失败两径 `form` 存活）∥ 页脚映射 ∥ 源面锚。命令：`cd thincoder-desktop && node --import ./test/rc-resolve.mjs .thincoder/tmp/add-dialog-unify.smoke.mjs`。
- 既有批次测试点跑（非仓套件）：`2026-10-07-provider-config-parity-desktop.test.mjs` = 5 pass / 1 fail（唯一红 = D3 源正则钉旧八值 `SCOPES` 字面，:211）；`2026-10-07-mcp-kv-input.test.mjs` = L2-4 红（自 `mcpBody` 取表单）+ L3-1/2/3 红（VSC 侧 `mcpFormHtml` 缺 —— 另一舱在途，非本舱面）。
- 仓 `test/` 树零引用本舱触面（grep 零命中）⇒ 仓套件零预期影响；仓套件 = 父侧收口跑（本舱不跑）。
- 行数对表：多数 ≤ 预估；超者 6 行（sections-mcp +5 ∥ sections-models +11 ∥ segments-mcp +13 ∥ segments-models +14 ∥ exits +5 ∥ i18n.mjs +4；`mount-composer.mjs` 300 恰在线上未越）—— 全档 ≤ 500；新越 300 两档（exits 307 ∥ segments-mcp 327）设计已登记拆分评估。

### 5.4 审计与代码评审轮次与终态

- **内部偏差审计（explore · 轮 1）**：VERDICT = DEVIATIONS；**PARTIAL 0 ∥ SILENT-SIMPLIFICATION 0**；4 条已披露项经核成立（D1 出表件必要性成立 ∥ D2 行 6/7/8 读法行为等价、建议保留现实现 ∥ D3 临时件不入仓成立 ∥ D5 测试面失效核实）；新发现 2 条：N1 `mount-settings-exits.mjs:10` 陈旧计数「该族现十一」**已修**；N2 `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` 亦自页槽取 MCP 表单（设计随动清单与披露两处均漏）—— 批外，见 5.5。
- **fix round 1**：N1 计数收正（十一 ⇒ 十二）+ `i18n-settings.mjs:5` 键面首数收正（60 ⇒ 63）—— 复跑 `node --check` 全绿 + 回路 22/22 复绿。
- **内部代码评审（advisor · code · 轮 1）**：**VERDICT = pass**（🔴 0；🟡 3 均非 must-fix：① 出表件未登记设计 §3.2 ∥ ② 测试面随动五件 coordination ∥ ③ 两档越 300 已登记；🔵 3：预估偏差回填 ∥ `consultAdd` 读链失败面窗口〔继承形，非本批新病〕∥ 在册超线档）。无 must-fix ⇒ 无 fix round 2。
- **终态 = clean（收敛）**。

### 5.5 待办 / 上抛（父侧与回填轮）

- **出表件**（必改项，已落）：`mount-settings-reads.mjs` 两径并持 `form` —— 新弹窗编辑态前提；建议回填轮补入设计 §3.2 表（批档件数 15 ⇒ 16 同拍）。
- **设计文本待收正（父侧/回填轮）**：① §3.2 行 6「两入口 handler」措辞；② §3.2 行 1-15 预估行数按实读齐平（6 行有偏，见 5.3）。
- **测试面（另舱/父侧排期）**：随动五件未落 —— `2026-10-07-mcp-kv-input.test.mjs`（:59 自 `mcpBody` 取表单）∥ `2026-09-30-desktop-residuals.test.mjs`（:289/:300 页内 `settings:addMcp`）∥ `2026-10-02-desktop-settings-menu-upgrade.test.mjs`（:147）∥ `2026-09-29-parity-b10-ui-w3.test.mjs`（:348/:371）∥ **`2026-10-07-provider-config-parity-desktop.test.mjs`（:211 钉死旧八值 `SCOPES` 正则 —— 未列入设计随动表，必红）**；批内件 `…-add-dialog-unify.test.mjs` 未建；另审计 N2 件（M604）建议一并入批内件舱扫面。**请父侧确认 dependsOn「批内件舱」射程含此五件 + N2，否则收口前补派。**
- **越界声明**：`docs/batches/**` 零写（批内件另舱）；VSC 侧零触（同树并行舱在跑，其改动仅作词值对表来源）；临时件 `thincoder-desktop/.thincoder/tmp/add-dialog-unify.smoke.mjs` 不入仓。

## §6 验证与收口（父代理）
