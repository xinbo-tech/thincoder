# 2026-10-06 · console-provider-redo
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 21:35「Provider与模型我希望改成 Provider，页面上就显示 Provider 列表，现在添加 Provider 的方式很奇怪，我希望改成点击添加按钮弹窗添加，Provider 列表点击弹出详情页，上面是 Provider 的基本信息，下面是提供的模型的列表，用户可以勾选，选中的加入服务的模型。」——功能点 18（需求档 §2:18 + AC-18）；同域串行：随控制台面（六面/弹窗两批已收口）落地后开。。
> 台账 = #980（server · 归批）。前情 = 无（独立批——承功能点 18；前情批 = docs/batches/2026-10-06-console-modals.md（已收口 2026-10-06））。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-06 21:3x-21:4x）**

- **来源**：用户 21:35 功能点 18 原话 ∥ 21:36「上游发现，不用手动补充」∥ 21:4x「参考一下 vsc 端添加的方式」∥（跨引）21:39「ACDE」+ 21:40「A 需要保留，不能被 Provider 页吸收……退役……只能在服务模型页面操作」——逐条已入需求档（§2:18/§2:17 + 变更记录）。
- **授权**：父侧按「直到完工为止，不需要再问我」直落（登记 → 设计轮点火）。
- **设计轮 `#87`** 已交卷（§2 在盘）；**评审判待 `#88`**（R24 轮——同档共写 WEBUI.md/PROJECT.md/API.md）落定后两轮并行点火（避免评审读移动目标）。

**§1 补记（主 agent · 2026-10-06 23:2x——光通道笔）**：`thincoder-server/src/gateway/provider-admin.mjs` 残留收正——4 条 502 尾句「——可手填模型清单降级」（:187 ∥ :194 ∥ :201 ∥ :205）⇒「——请检查上游可达性后重试」∥ 档头 :12「手填降级照常」⇒「（控制面提示 + 重试——**无手填兜底**）」。缘由 = R24 实施棒上抛 U2（实现与 21:36 裁定 / R28 收正相抵）；**光通道类别②（缺陷修复）——父侧直接执行 · 可 revert**；全仓扫描：`src/` 余量零（`config.mjs:22` = D 组「说明」输入，正道）；旧测试 ⑤ 腿（`-console-providers.test.mjs`）= API 级手填路径——行为零改、无需随正。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮 #94 九条受理落地（行号锚 = §2 修正块；三裁定与 R28–R30 在案））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 批次任务与设计（功能点 18 ∥ 台账 #980——2026-10-06 · eng-designer）

**本批条目（覆盖）**：功能点 18 全条——① 导航项/页标题 ⇒「Provider」；② 添加 = 页首钮 + 弹窗（预设/自定义两径——内联添加面撤除）；③ 详情弹窗 = 信息段 + 模型勾选列表（勾选集 = 服务集 ⇒ `/v1/models` 随动）；添加流基准 = VSC（21:4x 补录——取形实读）；裁定 = 21:36（候选只走上游发现——无手填）∥ 21:40（A 保留服务模型页——退役模型生命周期）。
**边界（本条不含）**：服务模型页 A/C/D/E 落字段（另轮——R24 已裁）；服务端派发/计量零改；零新增端点。

**设计档落点（本轮实改——file:line 逐处可核）**：
- `docs/server/design/webui/WEBUI.md`：§1 视图档句 :11 ∥ JS 档数 :16 ∥ §2 providers 行 :29 ∥ §2.2 键族登记 :65-67 ∥ §2.4 标题 :93 + ④ :119-132（机制全文）∥ §5 拆分两档 :155-156 ∥ style/i18n 行 :163-166 ∥ 小计 :168 ∥ §6 AC-18 行 :183 + AC-11 行随正 + 档目 18 ∥ 19 五处 ∥ §7 KD-SV-33 :196 ∥ §8 :203 ∥ 变更记录 :224。
- `docs/server/design/PROJECT.md`：§2.1 webui 行 :29 ∥ §4 索引 :84/:120 ∥ §6 预算 :134 + 随动表 :168-169 + 注⑦ :178-179 ∥ §7 AC-18 行 :202 + AC-11 行随正 ∥ §9 R24 :243 + R28–R30 :248-250 ∥ 变更记录 :280。
- `docs/server/design/gateway/API.md`：§2.2 发现行 :56 ∥ §5 AC-11 行 :115 ∥ 变更记录 :186（端点表零改——零新端点）。
- 本批档 §2（本段）。

**机制设计（全文 = `webui/WEBUI.md` §2.4④）**：列表页（标题 + 添加钮 + 行点击 ⇒ 详情；零内联面）∥ 添加弹窗（VSC 面板 [+ Add] 取形：类型一选（预设（首开惰性拉表——已配名剔除）/自定义）+「获取模型」探针 ⇒ 候选勾选；写入 = POST 全字段）∥ 详情弹窗（信息段（名/baseURL 预填输入 + 密钥输入/清除 + 测试连接 + 删除）+ 勾选段（候选 = 上游发现集；勾选态 = 现配置；「刷新候选」；退役项只读注 + 恒保留）+ 单脚区保存/取消）∥ 发现失败 = 提示 + 重试（无手填；保存不受阻）∥ 同源链 = 勾选集 ⇒ provider `models` ⇒ `/v1/models` ⇒ 服务模型页数据源。

**受影响文件与测试面**：
- 产品码（实施轮）：`thincoder-server/public/views-providers.mjs`（重做——页面 ≈110）∥ `thincoder-server/public/views-providers-modals.mjs`（拟新增——添加/详情流 ≈260）∥ `thincoder-server/public/style.css`（+≈25）∥ `thincoder-server/public/i18n-zh.mjs` ∥ `i18n-en.mjs`（改值 2 ∥ 新增 ≈13 ∥ 退役 ≈14）；`app.mjs` ∥ `nav.mjs` ∥ `modal.mjs` ∥ `views-models.mjs` = 零触。
- 批内件：`docs/batches/2026-10-06-console-provider-redo.test.mjs`（拟新增）——腿：① nav 值「Provider」（两表）∥ ② 页面（列表 + 钮 + 零内联面——桩 DOM）∥ ③ 添加弹窗两径 ∥ ④ 详情弹窗（信息段 + 勾选；零手填；退役注行）∥ ⑤ 勾选保存 ⇒ PATCH `models` = 勾选集（桩 api 断言）∥ ⑥ 热生效链（PATCH ⇒ `/v1/models`——内存库 API 级复跑）∥ ⑦ 静态面/两表/直发。
- 随正五件（父侧——跨批写门禁）：`-console-providers`（:426 名单 18 ⇒ 19）∥ `-console-completeness-2`（:434）∥ `-console-modals`（:334）∥ `-server-gateway-webui-deploy`（:239 ∥ :272-:274 ∥ 头注）∥ `-server-i18n`（:120 JS 档单 15 ⇒ 16）+ `thincoder-server/package.json`（`prepublishOnly` 十三 ⇒ 十四件——添本批件）。

**验收对照（AC-18 逐条——判据全文 = `webui/WEBUI.md` §6 AC-18 行）**：① nav 直测 = `nav.page.admin.providers` 值「Provider」（两表）——腿①；② 添加 = 弹窗 + 零内联面——腿②③；③ 详情弹窗（信息段 ∥ 勾选列表）+ 测试同窗——腿④；④ 勾选变更保存 ⇒ 热生效——腿⑤（PATCH bodies）+ 腿⑥（`/v1/models` 随动）+ 收口轮浏览器实走；⑤ 退役项只读注 / 无手填——腿④结构断言 + 旧手填键退役断言。

**关键决策**：KD-SV-33（全文 = `webui/WEBUI.md` §7 :196）——列表 + 双弹窗；零新端点（PATCH `models` 全量数组单写——批量勾选天然覆盖）；候选 = 上游发现（无手填）；退役项只读注 + 恒保留（A 归服务模型页）；添加流取形 VSC 面板形（QuickPick 形不移植）；单脚区保存；拆分两档（拆由 = 双弹窗叠加破 300 软线）。

**机检读数（`node scripts/doc-check.mjs --root d:/teamcode/thincoder`）**：改前 = 悬空 67 ∥ 超宽 1（`docs/server/requirements/PROJECT.md:73`）；改后 = 悬空 67 ∥ 超宽 1（同上——需求档 21:40 收正后 848 字符）⇒ **触面（本批三档）新增悬空 0 ∥ 新增超宽 0**；本批新档 `views-providers-modals.mjs` 锚 = 拟新增（列报 · 不入闸，`WEBUI.md:156`）。

**上抛项**：
- R28（需求档回笔——主 agent 笔）：AC-11 行「手填降级」措辞收正（21:36 裁定——控制面候选手填入口撤除；服务端 502 语义零改）；设计侧已收正（`gateway/API.md` §5 ∥ `webui/WEBUI.md` §6）。
- R29（实施后回填轮）：预算实读 + 随正五件核销（+ `prepublishOnly` 十四件）。
- R30（披露——退役模型停用过渡窗）：本批落地后至服务模型页 A 开关轮之间，退役模型控制面无停用入口（API 级 PATCH 可）；建议 A 轮紧随。
- 披露（主 agent 面——需求档）：`requirements/PROJECT.md:73` 行宽 848 字符（超宽 FAIL）+ `:73`/`:173` 两条悬空锚（`src/extension/provider-flows.mjs`——建议带全路径 `thincoder-vscode/src/extension/provider-flows.mjs`）。
- R24 接续关系（跨引——非本轮范围）：A（开放/停用）与功能点 18 勾选机制同源（勾选集 = 开放集——服务模型页同款开关 = 后续轮）；C/D/E = 服务模型页配置面（本批零触）。

### §2 修正块（fix 轮——评审 #94 九条受理落地 · 2026-10-06）

**行号锚修正**（发现 #3——以**节名锚为权威引用**；当刻行号 = 本修正块落时盘面，此后漂移以最新盘面为准；上文「设计档落点」行号 = 历史面）：

- `docs/server/design/webui/WEBUI.md`：「§2 IA 表 providers 行」= :30 ∥「§2.4④ Provider 管理面」= :128-141 ∥「§2.5 #87/#88 接续标注」= :310 ∥「§5 拆分两档」= :335-336 ∥「§5 style/i18n 行」= :345-348 ∥「§5 小计」= :349 ∥「§6 AC-18 行」= :364（空行删后）∥「§6 AC-19 两行」= :365-366 ∥「§7 KD-SV-33 行」= :379。
- `docs/server/design/PROJECT.md`：「§6 本批预算行」= :137 ∥「§7 AC-18 行」= :213 ∥「§9 R24」= :256 ∥「§9 R28–R30」= :260-262。
- `docs/server/design/gateway/API.md`：「§1 静态面行」= :16 ∥「§2.2 发现行」= :57 ∥「§7 E15 行」= :159。
- 本轮**新增触面**（原落点清单未含）：`webui/WEBUI.md` §2.5（发现 #5）∥ `PROJECT.md` §6（#6）∥ `gateway/API.md` §1 ∥ §7（#9 ∥ #1）。

**批内件腿③④修正**（发现 #2）：③ 补「预设拉取失败 ⇒ 提示 + 自定义径照常」；④ 补「发现失败 ⇒ 段内提示 + 「刷新候选」重试可达候选 ∥ 失败态保存不丢现配置（草稿无损）」。腿③④以本行为准（原文 = 本段上文）；同拍 = `webui/WEBUI.md` §6 AC-18 行（已补错误径）。

**逐号落地**（#1–#9——与交付报告「号 → 改动 file:line」同源）：#1 E15 行收正（`gateway/API.md` §7——「手填降级可用」⇒「控制面提示 + 重试；无手填兜底」）∥ #2 AC-18 行补错误径 + 腿③④（上）∥ #3 本修正块 ∥ #4 残留删净（`webui/WEBUI.md` §2.4④「收正项」句 ∥ `PROJECT.md` §7 AC-11 行「手填降级」句——校正历史留 §9 R28/变更记录）∥ #5 旧表单族类去留 = **新面复用**（`.provider-form`/`.key-clear`/`.stack-models`/`.model-picks`——零死类 ∥ S14 零登记；`webui/WEBUI.md` §2.4④ ∥ §2.5）∥ #6 i18n 净增量口径统一 = **净 ≈−1/表**（`webui/WEBUI.md` §2.2 ∥ §5 双表行/小计 ∥ `PROJECT.md` §6；聚合估数（≈2840 ∥ ≈6940）未随重算——避免级联他批链值，回填轮实读收正）∥ #7 §6 空行删（单表块回归）∥ #8 「测试连接」= discover 复用句（`webui/WEBUI.md` §2.4④）∥ #9 档数收正（`gateway/API.md` §1——`views-*` 十档）。变更记录三行同落（`webui/WEBUI.md` :415 ∥ `PROJECT.md` :303 ∥ `gateway/API.md` :201）。

**机检读数**（`node scripts/doc-check.mjs --root d:/teamcode/thincoder`——本 fix 轮）：开工 = 悬空 65 ∥ 超宽 0（候选 50292）；落点 = 悬空 65 ∥ 超宽 0（候选 50294——中间态一笔超宽已于当轮收正）⇒ **触面（本批三档）新增悬空 0 ∥ 新增超宽 0**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（设计评审——功能点 18 Provider 管理面重做；范围 = `webui/WEBUI.md` ∥ `PROJECT.md` ∥ `gateway/API.md` 全读 + 批次档 §2）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | `gateway/API.md` 同一机制两处相反：§2.2 模型发现行「**无手填兜底**——用户 2026-10-06 21:36 裁定」（`gateway/API.md:57`）vs §7 用例 E15 行「502 `upstream_error`（可读消息——手填降级可用）」（`gateway/API.md:159`）；「手填降级」正是本批宣告收正的措辞（`PROJECT.md:260` R28），21:36 裁定 = 候选面零手填（`webui/WEBUI.md:140`）。 | 收正 E15 输出列（发现失败 = 提示 + 重试 ∥ 无手填兜底），与 §2.2/§5 同拍；废止表述只留记录面（变更记录/§9）。 |
| 2 | Acceptance criteria | 🟡 | 发现失败径「失败 ⇒ 段内提示 + 「刷新候选」重试；候选面零文本输入（无手填入口）；保存不受阻（草稿 = 现配置未动 ⇒ 无损）」（`webui/WEBUI.md:140`）与添加弹窗预设拉取失败径「失败 ⇒ 提示 + 自定义径照常」（`webui/WEBUI.md:132`）在 AC-18 判据行（`webui/WEBUI.md:365`）与批内件腿①–⑦（`docs/batches/2026-10-06-console-provider-redo.md:34`）均无机检点。 | AC-18 行与腿③④补错误径断言：失败 ⇒ 段内提示 + 重试可达候选；失败态保存不丢现配置（无损口径）。 |
| 3 | Doc-state | 🟡 | 批次档 §2「设计档落点（本轮实改——file:line 逐处可核）」（`docs/batches/2026-10-06-console-provider-redo.md:25`–`:27`）行号与当刻盘面不符：「§2 providers 行 :29」（实 = 成员行；providers 行 = `webui/WEBUI.md:30`）∥「④ :119-132」（实 = `webui/WEBUI.md:128-141`）∥「§5 拆分两档 :155-156 / style-i18n :163-166 / 小计 :168」（实 = `webui/WEBUI.md:335-336`/`:345-348`/`:349`）∥「§6 AC-18 :183」（实 = `webui/WEBUI.md:365`）∥「§7 KD-SV-33 :196」（实 = `webui/WEBUI.md:381`）∥「PROJECT §7 AC-18 :202」（实 = `PROJECT.md:213`）∥「§9 R24 :243 / R28–R30 :248-250」（实 = `PROJECT.md:256`/`:260-262`）∥「API §2.2 发现行 :56」（实 = `gateway/API.md:57`）；节名锚仍可达。 | 以节名锚为权威引用；行号刷新或加 as-of 标注（回填轮同拍），免「逐处可核」失实。 |
| 4 | Doc hygiene | 🟡 | 已废止措辞以「收正项」形态留在规范面：`webui/WEBUI.md:140`「与 AC-11「手填降级」措辞差异 = 本批收正项」∥ `PROJECT.md:206`「发现失败「手填降级」措辞收正 = 本批（无手填——用户 21:36 裁定；需求档回笔 = §9 R28）」。 | 规范面只留收正后表述；校正历史并入记录面（变更记录/§9 R28）——R28 落地后删净引文残留。 |
| 5 | Scope coordination | 🟡 | 旧内联表单撤除（`webui/WEBUI.md:130`「**零内联添加/编辑面**（旧表单撤除——判据 = §6 AC-18 行）」）后，`.provider-form` 族规则（在册 `webui/WEBUI.md:231`/`:234`）是否有新消费者、成死类与否未述；本批 style 面仅 +≈25（`webui/WEBUI.md:345`），样式族批 S14 死类清单（`webui/WEBUI.md:174`）与「类名双向闭合」（`webui/WEBUI.md:368`）不覆盖此类——两批接缝。 | 述明 `.provider-form` 等旧内联面样式规则的去留（新面复用 ∥ 本批删净 ∥ 登记入 S14 清单），保双向闭合机检可过。 |
| 6 | Budget | 🔵 | i18n 增量口径自相矛盾：`webui/WEBUI.md:347`/`:348`（zh **312 ⇒ ≈311** ∥ en **308 ⇒ ≈307**——≈+13 键/退役 ≈14 键 ⇒ 净 ≈−1/表）vs `webui/WEBUI.md:349` + `PROJECT.md:137`「i18n 两表 +≈12」。 | 统一净增量口径（≈−2 或补 +≈12 依据）；回填轮以实读收正。 |
| 7 | Doc format | 🔵 | `webui/WEBUI.md` §6 AC-18 行（:365）被空行（:364 ∥ :366）隔断，AC-19 两行（:367–:368）悬空无表头——渲染面非表格（机检不受影响，人读面割裂）。 | 删空行，§6 回归单表块。 |
| 8 | Clarity | 🔵 | 详情弹窗「测试连接」（同窗；`providerId` 取库内 key）（`webui/WEBUI.md:135`）未写明落哪个端点；「零新端点」声明（`docs/batches/2026-10-06-console-provider-redo.md:39`）依赖其 = `POST /api/admin/providers/discover` 复用（`gateway/API.md:50`）这一未言明映射——实施轮有自造端点风险。 | §2.4④ 补「测试连接 = discover 复用（providerId 取库内 key）」句，钉死零新端点口径。 |
| 9 | Doc-state | 🟡 | `gateway/API.md:16` 前端静态面行仍记「`app.mjs` ∥ `nav.mjs` ∥ `views-*` 八档 ∥ `style.css`」，与 `webui/WEBUI.md:17`（views-* 十档）∥ `PROJECT.md:29`（public 十九档——含 `views-*` 十档）不符；本批新增 `views-providers-modals.mjs` 而 `gateway/API.md` 触面清单（`docs/batches/2026-10-06-console-provider-redo.md:27`）未含 §1 行。 | 随本批把 §1 静态面口径收正（或改不计数表述），三档单源。 |

范围外注（无严重度）：`webui/WEBUI.md:131` 两处仓内锚（`thincoder-vscode/webview/settings-providers.js:200` ∥ `thincoder-core/provider-flows.mjs:136`）评审范围内不可核——`unverified`；批次档 `:47` 披露把需求档悬空锚的建议修正路径写作 `thincoder-vscode/src/extension/provider-flows.mjs`——两处 provider-flows 是否同指一档，建议交叉核验。机检读数（悬空/超宽——批次档 `:41`）未复跑，`unverified`。

计数：🔴 × 1 ∥ 🟡 × 5（#2–#5 ∥ #9）∥ 🔵 × 3（#6–#8）——共 9 条。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2 核验表（评审 #94 九条 fix 核验——三档全读 + 定点复核；fix 轮 claims 逐条对盘）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | gateway/API.md | 🔴 | Fixed | §7 E15 行收正：「502 `upstream_error`（可读消息——控制面提示 + 重试；无手填兜底）」（`gateway/API.md:160`）；与 §2.2 发现行（`:57`「**无手填兜底**——用户 2026-10-06 21:36 裁定」）∥ §5 AC-11 行（`:122`「502 + 控制面提示/重试——**无手填兜底**」）三处一致——原机制矛盾闭合。 |
| 2 | 2 | webui/WEBUI.md ∥ 本批档 | 🟡 | Fixed | AC-18 判据行补错误径：「错误径（发现失败 ⇒ 段内提示 +「刷新候选」重试可达候选 ∥ 失败态保存不丢现配置——草稿无损；预设拉取失败 ⇒ 提示 + 自定义径照常）」（`webui/WEBUI.md:367`）；本批档 §2 修正块（`:59`）腿③④修正同口径（「腿③④以本行为准」）。 |
| 3 | 3 | 本批档 | 🟡 | Fixed | §2 修正块（`:52`）按受理口径落地：「以**节名锚为权威引用**；当刻行号 = 本修正块落时盘面，此后漂移以最新盘面为准」；残留漂移为块落后盘面续动（如 §2.4④ 现 `:129-:142` ∥ §5 拆分两档现 `:338`–`:339` ∥ §6 AC-18 行现 `:367`——块内 `:128-141`/`:335-336`/`:364`）——由块内免责句覆盖。 |
| 4 | 4 | PROJECT.md ∥ webui/WEBUI.md | 🟡 | Fixed | 规范面引文删净：`webui/WEBUI.md:141` 已无「收正项」句（句止于「保存不受阻（草稿 = 现配置未动 ⇒ 无损）。」）；`PROJECT.md:210` §7 AC-11 行已无「手填降级」字样（全档 grep 残存仅 `:264` R28 ∥ `:308` 变更记录 = 记录面/指针面——正是受理建议的落点）。 |
| 5 | 5 | webui/WEBUI.md | 🟡 | Fixed | 去留述明 = 新面复用：「旧表单族类（`.provider-form` ∥ `.key-clear` ∥ `.stack-models` ∥ `.model-picks`）随双弹窗复用——零死类」（`:131`）+ §2.5 接续标注（`:312`「随双弹窗复用——零死类（S14 零登记）」）——与 AC-19 续双向闭合口径相容。 |
| 6 | 6 | webui/WEBUI.md ∥ PROJECT.md | 🔵 | Fixed | i18n 净增量口径统一：`webui/WEBUI.md:350`/`:351`/`:352` ∥ `PROJECT.md:138` 均「i18n 两表 ≈−2（净 ≈−1/表）」——原「+≈12 vs 净 −1/表」矛盾闭合。 |
| 7 | 7 | webui/WEBUI.md | 🔵 | Fixed | §6 单表块回归：`:356`–`:369` 连续无空行（AC-18 行 = `:367`；AC-19 两行 = `:368`–`:369`；表头 `:356`/`:357` 在场）。 |
| 8 | 8 | webui/WEBUI.md | 🔵 | Fixed | 「测试连接」（同窗；= discover 复用——`POST /api/admin/providers/discover`，`providerId` 取库内 key；零新端点）（`:136`）——零新端点口径钉死。 |
| 9 | 9 | gateway/API.md | 🟡 | Fixed | §1 静态面行 =「`app.mjs` ∥ `nav.mjs` ∥ `views-*` 十档 ∥ `style.css`」（`:16`）——与 `webui/WEBUI.md:17` ∥ `PROJECT.md:29` 单源。 |
| 10 | (new) | PROJECT.md ∥ webui/WEBUI.md | 🔵 | New | 预算子项和与聚合值不自洽：「产品面 ≈+196（webui ≈+195——`views-providers` 拆分（214 ⇒ ≈110 + 新档 ≈260）∥ style +≈25 ∥ i18n 两表 ≈−2（净 ≈−1/表）」（`PROJECT.md:138`）子项和 ≈+179；#6 换口径后聚合未重算（修正块 `:61` 已披露「聚合估数（≈2840 ∥ ≈6940）未随重算——避免级联他批链值，回填轮实读收正」）；`webui/WEBUI.md:352` 小计同型。 |

计数：旧 9 条 = 9 Fixed（🔴 × 1 收正 ∥ 🟡 × 5 ∥ 🔵 × 3）；新增 🔵 × 1；未闭 🔴 × 0 ∥ 未闭 must-fix 🟡 × 0。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 2026-10-06 23:0x——代执行）**

**代执行口径**（承用户 2026-10-06 22:05「好，后续你自动跑完」全链放行）：设计（§2 + 修正块）→ 评审轮 1（设计评审：**changes-required**——1🔴 + 5🟡 + 3🔵；§3 轮次 1 在档）→ 修复轮（§2 修正块 :50–63——九条逐号落地）→ **评审轮 2（修复核验）：pass**（旧九条全 Fixed ∥ 新 1🔵=预算聚合未重算——已披露非阻塞；§3 轮次 2 在档）⇒ **批准进入实施**。

**三条件核验**：① 评审 pass（0🔴）✓（reviewId 不落档——沿纪律）；② 修复轮已落地并经核验 ✓（修正块九条 + 核验轮逐处复核）；③ designToken 已签发 ✓（凭据值不落档）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 clean ∥ 代码评审 pass ∥ fix 0 轮——终态 clean；随正五件（父侧）当刻为红（实证在 D6））


**§5 实施记录（eng-coder · 2026-10-06 · console-provider-redo initial）**

**交付摘要（逐档 file:line）**：
- `public/views-providers.mjs`（重写 · 214 ⇒ **57**）：页首工具条（标题「Provider」+「添加」钮，:19–21）∥ 列表（名称 ∥ baseURL ∥ 密钥（掩码 ∥ 未配置）∥ 服务模型数，:39–56）∥ 行点击（Enter/Space 同开，:49–51）⇒ 详情弹窗；**零内联添加/编辑面**（旧表单撤除——批内件以 DOM 桩断言零表单控件）。
- `public/views-providers-modals.mjs`（新 · **273**）：候选勾选助手 `renderPicks`（双弹窗复用——空态/错误态 ⇒ 段内提示，:17–30）∥ `sameSet`（PATCH 变更判定，:33–35）∥ 添加弹窗（类型一选 + 预设首开惰性拉取 + 已配名剔除 + 失败 ⇒ 提示 + 自定义径照常，:104–117；预设信息行（地址 ∥ 模型清单——只读）:90–95；自定义径「获取模型」探针 ⇒ 候选勾选 :119–134；写入 = POST 全字段（无 `preset` 字段）:136–149）∥ 详情弹窗（信息段 :254–262——掩码占位「留空 = 不修改」:178–181 ∥ 清除密钥 ⇒ `apiKey:""` :241 ∥ 测试连接 = discover 复用 + `providerId` 取库内 key :204–212 ∥ 删除（confirm）:214–222；勾选段 :263–265——候选 = 上游发现（首开自动拉取 :270 ∥「刷新候选」重试 :201）∥ 勾选态 = 现配置 :174 ∥ 退役项只读注 + 恒保留 :231–233/:243–244；脚区保存 = PATCH 变更字段（`models` 全量数组；零变更 ⇒ 直接关窗）:237–252）。
- `public/style.css`（139 ⇒ **146**）：追加块 :60–:72——工具条 `.toolbar` ∥ 段头 `.pick-head` ∥ 危险钮行 `.info-actions` ∥ 模型清单码面（`.detail-grid dd code + code`）；`.provider-form`/`.key-clear`/`.stack-models`/`.model-picks` 沿用（双弹窗复用——零死类）。
- `public/i18n-zh.mjs`（312 ⇒ **302** 行 · 键 268 ⇒ 258）∥ `public/i18n-en.mjs`（308 ⇒ **298** 行 · 键 266 ⇒ 256）：改值 = `nav.page.admin.providers` ∥ `admin.providers.title` =「Provider」（两表，zh :56/:140 ∥ en :56/:136）∥ 新增 **8** 键（add ∥ addTitle ∥ customChoice ∥ colModelCount ∥ fetchModels ∥ refreshCandidates ∥ candidatesEmpty ∥ retiredNote）∥ 退役 **18** 键（内联面旧键——`modelPh` ∥ `addModel` ∥ `formNew` ∥ `formEdit` ∥ `save` ∥ `saveEdit` ∥ `cancel` ∥ `discover` ∥ `presetLoad` ∥ `presetLoaded` ∥ `presetHint` ∥ `presetTitle` ∥ `listTitle` ∥ `colModels` ∥ `modelsEmpty` ∥ `edit` ∥ `checklistEmpty` ∥ `modelLabel`；「手填」值级 **0 残留**）。
- `docs/batches/2026-10-06-console-provider-redo.test.mjs`（新 · **561**）：七腿——① nav/标题值「Provider」（两表）+ `labelKey` 面不破 ∥ ② 页面（列表/掩码/计数 + 添加钮 + 行点击 ⇒ 详情 + 零内联面 + 空/失败态）∥ ③ 添加弹窗两径（预设剔除/信息行/POST 全字段 ∥ 自定义探针 ⇒ 勾选 ⇒ POST ∥ 预设失败照常 ∥ 未选 ⇒ 提示不提交）∥ ④ 详情弹窗 + 错误径（失败 ⇒ 段内提示 +「刷新候选」重试可达 ∥ 失败态保存零 `models` 提交 = 无损 ∥ 退役注行 + 恒保留）∥ ⑤ 写路径（PATCH `models` 全量数组 ∥ 零变更关窗 ∥ 清除密钥 `apiKey:""` ∥ 测试连接 `providerId` ∥ 删除 confirm ∥ confirm 拒零请求）∥ ⑥ 热生效链（内存库 + 真网关：POST ⇒ PATCH `models` ⇒ `/v1/models` 随动）∥ ⑦ 静态面（档目 **19 ∥ 18** ∥ 零外链 ∥ 两表键集/占位符/en 零 CJK ∥ 键引用闭合 ∥ 退役键删净 ∥ 两档直发）。

**自跑读数**：`node --check` 五档全绿（两视图档 ∥ 两 i18n 表 ∥ 批内件；style.css 非 JS）∥ `node --test docs/batches/2026-10-06-console-provider-redo.test.mjs`（自 `thincoder/` 仓根）= **tests 8 ∥ pass 8 ∥ fail 0** ∥ 静态自检 = 档目 **19 ∥ 18**（全目录 ∥ UI 代码档）∥ `http(s)://`+`@import` **0 命中** ∥ 两表键集双向相等（除自称名族）∥ en 零 CJK ∥ 旧内联键 **0 残留**。**全门禁（仓套件）= 父侧唯一执行（本侧未跑）**。

**决策透明表（披露）**：

| # | 决策/披露 | 理由 |
|---|---|---|
| D1 | 详情弹窗**首开自动拉取候选** | correction 块「发现失败 ⇒ 段内提示 + 重试 ∥ 失败态保存无损」以「开窗即可处失败态」为前提；「候选 = 上游发现集 ∥ 勾选态 = 现配置」需发现集在窗内成立；重试面 =「刷新候选」（同名钮）。 |
| D2 | i18n 净增为 **−10/表**（键 268 ⇒ 258；行 312 ⇒ 302），非设计估 ≈−1/表 | 新增 8 键 < 估 ≈13；退役 18 键 > 估 ≈14——逐键清单在 D2 上文（交付摘要）；实读读数入档，回填轮（R29）收正。 |
| D3 | 改值面 = 设计点名 2 键 + 复用键值随新面收正 5 处（`openList` ∥ `presetFailed` ∥ `presetNeeded` ∥ `listEmpty` ∥ `maskEmpty` ∥ `test`） | 新 UI 文案 = §2.4④ 引文（如「服务的模型（勾选 = 对团队开放）」）；「手填」收正为值级删净。 |
| D4 | 添加弹窗 apiKey 行为两径共用（自定义径置于探针之上） | 取形 VSC 面板（key 行径外共用——`settings-providers.js:221`）；探针需读已填 key（明传口径）。 |
| D5 | 错误态取纯 `.hint`（未加 `.error` 修饰）∥ 候选段无加载态 | 样式族批（§2.5 S16/⑨）尚未落地（`style.css` 当前零 `.error`/`.hint error` 规则——全档 grep）——本批不代改其面；接缝已上抛（评审 #1；§2.5:312 已含「以当刻盘面为准并入」条款）。 |
| D6 | 随正五件 + `package.json`（十三 ⇒ 十四件）**当刻未落**（父侧登记） | 四批内件档目/JS 档单仍旧盘面（实证：`-console-modals.test.mjs:331` [18,17] ∥ `-console-providers.test.mjs:426` 名单 ∥ `-server-i18n.test.mjs:120` JS_FILES ∥ `thincoder-server/package.json:13` 链尾）——随正 = 父侧收口轮（批档 §2 已登记）。 |
| D7 | 服务端 502 消息文本「可手填模型清单降级」保留 | 设计裁定「服务端 502 语义零改」；控制台不可见（`upstream_error` 走固定映射，不附服务端原文）——审计报备项，非本批面。 |

**审计与代码评审轮次与终态**：
- 内部发散审计（explore · 轮次 1）：**clean**——PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 四类均「无发现」；观察 3 项（§5 时点 ∥ 预算估漂移 ∥ 服务端 502 消息文本报备）。
- 独立代码评审（advisor · 轮次 1）：**pass（无 must-fix）**——🟡 3（跨批样式接缝 = D5 ∥ 随正五件在册 = D6 ∥ i18n 表 302 > 300 软线 = 在册债 R25）+ 🔵 4（估数漂移 ∥ 防御性 `preset.name` 解引用（`:142`）∥ 添加弹窗探针失败径测试缺口 ∥ 批内件 561 行惯例记录）。
- fix round：**0 轮**（无 must-fix；🟡/🔵 按「登记/上抛」处置，未改码）。
- **终态 = clean**（批内件 8/8 绿 ∥ 审计 clean ∥ 评审 pass ∥ 两次全读回核）。

## §6 验证与收口（父代理）

**§6 核验与收口（主 agent · 2026-10-07 00:5x）**

**实施（四棒浪第 1 棒）**：eng-coder #103（initial）——子内发散审计 1 轮 clean ∥ 代码评审 1 轮 pass（0 must-fix）∥ fix 0 轮。落点：`views-providers.mjs` 重写 214 ⇒ 57 ∥ 新档 `views-providers-modals.mjs` 273 ∥ `style.css` +7 ∥ i18n 两表（新 8 键 ∥ 退 18 键——净 −10/表）。

**批内件**：`-console-provider-redo.test.mjs`（561 行）——实施棒自跑 8/8；**父侧门禁链内并入复跑通过**。

**父侧动作**：① 随正全扫（八文件——本批相关：档目链 19 ∥ 20 三处、`-console-completeness-2` 档目、`-server-gateway` v3⇒v4、presets `settings: {}`、`-server-auto-update` 件数、`-server-i18n` JS 档单）；② **补漏**：本批批内件未入 `prepublishOnly` ⇒ 父侧补列（`package.json:13`——十六 ⇒ 十七件，`-server-auto-update` 断言同拍）；③ **光通道笔**（父侧直接执行 · 可 revert）：`src/gateway/provider-admin.mjs` 五处「可手填模型清单降级 / 手填降级照常」残句收正（详见 §1 补记）；④ 设计小修：`webui/WEBUI.md` §2.5 实施面补列 `views-providers-modals.mjs`（可 revert）。

**披露处置**：D1 采纳（详情弹窗首开自动拉取候选——「开窗即可处失败态」前提成立）∥ D2/D3 记账（i18n 净增实读 −10/表 ≠ 估 ≈−1——回填轮 #983）∥ D4 样式批接缝已随 #107 落盘并入 ∥ D5 已核销（随正落地）∥ D6 由光笔覆盖（502 文本已改——「保留」句不再成立）。

**核验读数**：`cd thincoder-server && npm run prepublishOnly` = **140/140 ∥ 0 fail ∥ exit 0**（2026-10-07 00:4x；十七件链——本批件在列）。

**台账号**：#980 在途 ⇒ 待核销 ⇒ 已核销（evidence = 本 §6 + 门禁读数）。

**欠账（已入账）**：#983（回填轮——R29/R34/R36 面）∥ #984（候选段加载态——D4 折出）。
