# 2026-10-06 · console-list-style
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 22:00「我发现不同的列表样式会有区别，比如hover行的背景色会不一样，有的还没有，我希望你统一规划一下列表样式，做到风格统一。」——功能点 19（需求档 §2:19 + AC-19）；同域串行：两在跑设计轮（Provider 重做 / R24 配置）后的第三棒。。
> 台账 = #982（server · 归批）。前情 = 无（独立批——承功能点 19；同域串行：排 `console-provider-redo` / `models-config` 后）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-06 22:00-22:01）**

- **来源**：用户 22:00 列表样式统一起意（原话在需求档 §2:19）∥ 22:01 扩裁「还有哪些你觉得应该统一规划的样式也都一起规划一下」——功能点 19 扩为**样式族总体**（十族目 = 父侧拟案：列表面 ②按钮 ③表单 ④间距 ⑤字排 ⑥色板 ⑦卡片 ⑧弹窗内构 ⑨空/错态 ⑩变量单源；设计轮勘误增删）。
- **授权**：父侧按「直到完工为止」直落（登记 → 设计轮点火）。
- **设计轮**：`#91`（列表族版）作废替换 → 新版排在 `#88` 后（同档串行）。
- **批名注**：本批 topic 仍为 `console-list-style`（文件名不改——范围扩裁在 §1/§2 与需求档在案）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮——评审 #96 七条逐号落位（修正块在 §2 末））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 批次任务与设计（功能点 19 ∥ 台账 #982——2026-10-06 · eng-designer）

**本批条目（覆盖）**：功能点 19 全条——全控制台样式族统一（用户 22:00 列表起意 + 22:01 扩裁）；设计轮实读现盘 → 散置/不一致清单 S1–S17 → 收束一套（变量族底座 + 十族值表/逐族套用表）。**族目勘误**：九族维持 ∥ 增「码面」（第 10 族——`code`/`snippet`/密钥字面量现盘跨 ⑤⑦ 无主）∥ 「变量单源」由并列族重定位为底座。**纯样式收束**（不动列/数据/交互语义 ∥ 版式骨架沿用 ∥ 与「系统基线统一」（一字族/一字号 13px/行距 1.5/零粗体·色区分）对齐）。

**边界（本条不含）**：产品码零写 ∥ 测试档零写 ∥ 需求档零笔 ∥ 版式/结构重设计零 ∥ 类名体系改名（仅删死类 + `.error` 态修饰）∥ 动画/过渡 ∥ 暗色主题（未裁）。

**设计档落点（本轮实改——file:line 逐处可核）**：
- `docs/server/design/webui/WEBUI.md`：§2.5 新增（:143–312——口径五条 ∥ 散置清单 S1–S17 ∥ 变量族底座 ∥ 族值表+逐族套用表 ①–⑩ ∥ #87/#88 接续标注 ∥ 实施面）∥ §5 style.css 行 :345 + 小计 :349 ∥ §6 AC-19 两行 :367–368 ∥ §7 KD-SV-36 :384 ∥ §8 边界 :393 ∥ 变更记录 :416。
- `docs/server/design/PROJECT.md`：§2.1 webui 行 :29 ∥ §4 索引（标题 1–35 ⇒ 1–36；KD-SV-36 :123）∥ §6 预算（本批段 :140 + 总账链 :149 + 随动表 :178）∥ §7 AC-19 行 :214 ∥ §9 R36–R38 :268–270 ∥ 变更记录 :302。
- 本批档 §2（本段）。

**机制设计（全文 = `webui/WEBUI.md` §2.5）**：底座 = `style.css` `:root` 变量族（色 19 ∥ 间距 7 级 2/4/6/8/12/16/20 ∥ 圆角 3 级 4/6/8 ∥ 字排/线宽/布局——单源；`:root` 外零颜色字面量）；族 = ①列表（悬停全数据行 `--hover` 单值 ∥ 表头 `--fill` ∥ 可点行三件套：指针/焦点环/键盘）②按钮（主/次/危险/链接/图符——常态+悬停+禁用）③表单（控件 `--r-2` ∥ 聚焦环 ∥ checkbox `accent-color`）④间距刻度（就近取级 ∥ 等距取小）⑤字排（一字族 ∥ 一字号 13px ∥ `--lh` 1.5 ∥ 零粗体——强调=色通道；层级=结构通道）⑥色板状态（健康/KPI 三态同源）⑦卡片（`.card` 基 + 三变体）⑧弹窗内构（宽 `--modal-w` ∥ 头/体/脚内距）⑨空/错/加载态（错 = `.hint error`）⑩码面（`--mono` 唯一族例外——同号同重）。可点行/不可点行判据 = ① 内（可点 = `.row-clickable` 三件套；悬停两族同值）。

**受影响文件与测试面**：
- 产品码（实施轮）：`thincoder-server/public/style.css`（重排——139 ⇒ ≈216（三批叠加）；死规则删（`.key-line`））∥ `views-admin.mjs` ∥ `views-me.mjs` ∥ `views-models.mjs` ∥ `views-usage.mjs` ∥ `views-audit.mjs` ∥ `views-providers.mjs`（`.hint error` 共 7 处）∥ `views-overview.mjs` + `views-usage.mjs`（`stat` 类串删 2 处）∥ `app.mjs`（`view` 类串删 2 处）；`nav.mjs` ∥ `modal.mjs` ∥ i18n 两表 = 零触；**零新档**（档目 19 ∥ 20 不变）。
- 批内件：`docs/batches/2026-10-06-console-list-style.test.mjs`（拟新增——实施轮新建）——腿：① `style.css` 机检（`:root` 块外零颜色字面量 ∥ `font-weight` ≤400 ∥ `font-size` 全 `var(--fs)` ∥ padding/margin/gap ∈ `--sp-*`/0/auto ∥ 唯一行悬停声明 ∥ 聚焦环单形）∥ ② 类名双向闭合（`public/*.mjs` 类字面量 vs `style.css` 选择器）∥ ③ 死类零残留（`key-line`/`stat`/`view`）。
- 随正件 = **无**（无新档 ∥ 无断点——类串微改/行数零变；既有档目/直发/类面断言零触——实读在案）。

**验收对照（AC-19 逐条——判据全文 = `webui/WEBUI.md` §6 AC-19 行（+续行））**：① 样式族规范落盘（变量单源族 + 族值表）——判据 = §6 机检行（style.css 文本断言）；② 逐族套用表在册（含 #87/#88 接续标注）——§2.5 各族套用面 + 接续块；③ 散置/不一致清单（改前实读）在册——S1–S17；④ 视觉收口轮实走——浏览器（悬停/聚焦/空错态/弹窗/两语言）。

**关键决策**：KD-SV-36（全文 = `webui/WEBUI.md` §7——变量单源 + 一套刻度 + 系统基线对齐；一字族/一字号 13px/行距 1.5/零粗体·色区分；悬停全交互面同值；可点行三件套；族目勘误 = +⑩ 码面 ∥ 变量单源为底座；被否 = 多字号/字重 ∥ 逐组件一次性样式 ∥ 新 CSS 档/框架 ∥ 过渡动画 ∥ 暗色（未裁）∥ 14px 单号）。

**机检读数（`node scripts/doc-check.mjs --root d:/teamcode/thincoder`）**：改前 = 悬空 65 ∥ 超宽 2（`docs/server/requirements/PROJECT.md:72` 315 字符 ∥ `:78` 565 字符——存量）；改后 = 悬空 65 ∥ 超宽 2（同两行）⇒ **触面（本批两设计档）新增悬空 0 ∥ 新增超宽 0**（候选报告面 +22 条——符号·宽报告态，不入闸）。

**上抛项 / 披露**：
- R36（实施后回填轮）：预算实读（`style.css` 三批叠加断点收正——§6 ≈7491 推算值 ∥ webui 小计 ≈3180）∥ 批内件行数 ∥ 随正件 = 无误核。
- R37（需求档收正——主 agent 笔）：`docs/server/requirements/PROJECT.md:72` ∥ `:78` 两行超宽（改前存量；`:78` = 功能点 19 行）——建议拆行（判据 300）；本批设计侧零新增超宽。
- R38（披露——字排/悬停两口径的后果，供评审/用户复核）：一字号 + 零粗体下页题（h2）∥ KPI（`stat-value`）∥ 卡题与正文同号同重——层级 = 结构通道；悬停统一 = 全数据行（含不可点表——可点性由指针/焦点环承担——用户原句「有的还没有」按「统一加」收口）。如用户要求保留字号层级或「仅可点行悬停」⇒ 回笔需求 §2:19 边界句（值表单点调整）。
- **族目勘误结论（增删/合并）**：九族维持 ∥ 增「码面」= 第 10 族（依据 = 现盘 `code` 芯片/`snippet` 块/密钥字面量跨 ⑤⑦ 无主——`style.css:40`/`:69`/`:56`）∥ 「变量单源」重定位为底座（机制面——非并列族）。
- **#87/#88 接续说明**：新面（Provider 工具条/双弹窗/勾选列表 ∥ 服务模型配置四组/停用流/元数据行）已入各族套用面并标「随其落地」；本批实施轮以当刻盘面并入；其产品面晚于本批 ⇒ 由其落地轮按 §2.5 套用（§2.5 = 全域样式单源——后续新增面按族表套用）。
- 披露（非阻塞）：既有两设计档的「拟新增/迁移期引文」列报项照常（`views-providers-modals.mjs` ∥ `model-specs-snapshot.mjs`——不入闸）；需求档两行超宽为改前存量（R37）。

**文档一致化去向**：两设计档同拍（`webui/WEBUI.md` ∥ `design/PROJECT.md`）；需求档零笔（R37——主 agent）；产品码/测试档零写（实施面未开）。

### §2 修正块（fix 轮——评审 #96 七条逐号落位 · 2026-10-06 · eng-designer）

**背景**：§3 评审（轮次 1 · #96）VERDICT: pass ∥ 发现 7 条（0🔴 ∥ 5🟡 ∥ 2🔵）逐条裁定**全部受理**。本块 = 七条逐号落位记录（append-only——上文与之冲突处以下列为准）；**零新语义 / 零新范围**；需求档零笔（R37 在需求档侧已办——本笔只收正设计侧状态）；产品码/测试档零写。

| # | 处置 | 落点（改动面——当刻盘面行号） |
|---|---|---|
| 1 🟡 | **错态面补列（取「补列」不取「排除」）**：系统页向量诊断失败面入 ⑨ 错态 canon——`thincoder-server/public/views-system.mjs:47` 状态行失败文案 ⇒ `.error` ∥ `:50` 试跑结果行 ⇒ `.hint error`（文案点 `:66`/`:87`）；实施面 + 受影响文件清单同步 | `docs/server/design/webui/WEBUI.md` §2.5 ⑨ 行（:297）∥ 实施面（:314–315）；本档「产品码（实施轮）」清单 |
| 2 🟡 | **悬停口径收正**：口径④「全交互面同值」限定为「列表行/中性面同值」（钮/链接悬停逐型在 ②——非同值面）；**ul 类清单行（key 清单）纳入行悬停**（`li.key-item:hover`）；机检口径同拍为「行悬停声明清单」 | `docs/server/design/webui/WEBUI.md` §2.5 口径④（:155）∥ S1（:162）∥ ① 表（:205–206 ∥ :211）∥ §6 AC-19 续（:369）∥ §7 KD-SV-36（:385）；`docs/server/design/PROJECT.md` §4 索引（:123） |
| 3 🟡 | **行数标注随实读收正（当刻盘面复核）**：`views-me.mjs` ≈122 ⇒ **117** ∥ `views-admin.mjs` ≈210 ⇒ **169**；`views-usage`/`views-overview`/`views-audit` = 已落盘 **139 ∥ 74 ∥ 88**（前 fix 轮已收正——本轮复核一致，零改）；随 #1 收正 `views-system.mjs` ≈150 ⇒ **168** | `docs/server/design/webui/WEBUI.md` §5（views-me :336 ∥ views-admin :337 ∥ views-system :340） |
| 4 🟡 | **批内件规模标注**：新批内件估算 **≈400 行**；越 500 硬线 ⇒ 拆档预案（类名双向闭合 + 死类零残留 两腿合段抽独立成件——沿注③先例） | 本档「批内件」行 + `docs/server/design/PROJECT.md` §6 注⑨（:194）+ 随动表本批行（:180） |
| 5 🟡 | **文档地图**：webui 行 + 「样式族规范（§2.5）」 | `docs/server/design/PROJECT.md` §3（:81） |
| 6 🔵 | **R37 销项**：收正为已办（需求档拆行已落地——主 agent 直接执行 · 可 revert；原引行号已失效删除） | `docs/server/design/PROJECT.md` §9 R37（:273） |
| 7 🔵 | **行标句收正**：两句限定时点 + 越线在册（`app.mjs` ≈301 拆分预案 ∥ i18n 双表 312 ∥ 308——R25） | `docs/server/design/webui/WEBUI.md` §1（:17）；`docs/server/design/PROJECT.md` §6 口径句（:134） |

**腿① 口径随正（#2 同拍）**：上文「腿① `style.css` 机检（…唯一行悬停声明…）」⇒「行悬停声明清单（`.nav-item:hover` ∥ `tbody tr:hover` ∥ `li.key-item:hover`——同取 `var(--hover)`；清单外零行悬停声明）」；机制摘要「悬停两族同值」与关键决策摘要「悬停全交互面同值」同拍为「悬停底同值 = 列表行/中性面」。

**机检读数（`node scripts/doc-check.mjs --root d:/teamcode/thincoder`——设计档落笔后）**：改前 = 悬空 65 ∥ 超宽 0（前读数「超宽 2」已随 R37 拆行归零——存量）；改后 = 悬空 65 ∥ 超宽 0 ⇒ **本 fix 轮触面新增悬空 0 ∥ 新增超宽 0**。

**行数复核口径与参考值差（如实披露）**：本笔行数复核口径 = 本档既定（内容行数 ∥ 文末换行不计——与在册值 139/74/88/214/139 同口径）；与评审复核实读参考值（`views-me` 118 ∥ `views-usage` 140 ∥ `views-overview` 75 ∥ `views-audit` 89）存 +1 差（口径差——参考值含文末空行计数）；其中三档既有在册值（139/74/88）与本轮复核一致 ⇒ 零改；`views-me` 按既定口径落 **117**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage | 🟡 | 「空/错/加载态」族（§2.5 ⑨）的错态套用面不闭合：错 = `.hint error`（`webui/WEBUI.md:295`——「``.hint error``（``--danger`` 字——七处「加载失败」面：…」）只列「加载失败」七处，而系统页探活/试跑失败面不在册——`thincoder-server/public/views-system.mjs:50`（`testResult` = `h("p", { class: "hint" })`）在 `:87` 收 `vector.fail` 文案 ∥ `:47`（`statusValue`——无类）在 `:66` 收同文案；`views-system.mjs` 亦未列入实施面（`webui/WEBUI.md:312`）——与 ⑨ 套用面「十页空/加载/错态」（`webui/WEBUI.md:297`）不符 | 补列该错态面（或明示排除动态诊断结果面）并同步受影响文件清单 |
| 2 | Clarity | 🟡 | 悬停口径的适用范围不闭合：口径④「悬停 = 全交互面同值」（`webui/WEBUI.md:154` ∥ KD-SV-36 同句 `:384`）与 ② 各型钮悬停取值（主钮「底/边 ``--accent-hover``」`:215` ∥ 危钮「``--danger-fill`` 底」`:217`）字面不一致；且唯一行悬停声明 `tbody tr:hover`（`:204`——「``tbody tr:hover`` 单一声明——全数据行覆盖」）覆盖不到 ① 套用面所列 key 清单（`views-me.mjs:20` `ul.key-list` ∥ `:24` `li.key-item`） | 把「同值」限定到列表行/中性面悬停底，并写明 ul 类列表行是否纳入（机检「唯一行悬停声明」口径同拍） |
| 3 | Affected-file size annotations | 🟡 | 本批所改档的当前行数标注未随盘面收正（本轮复核实读）：`views-me.mjs` 标 ≈122（`WEBUI.md:333` ∥ 盘面 118）∥ `views-admin.mjs` 标 ≈210（`:334` ∥ 盘面 169）∥ `views-usage.mjs` 标「（拟新增）」≈170（`:338` ∥ 盘面 140 ∥ §1 `:10` 已标「（已落盘——全队用量 + 看板——§2.3②）」）∥ `views-overview.mjs` 标「（拟新增）」≈100（`:339` ∥ 盘面 75）∥ `views-audit.mjs` 标「（拟新增）」≈100（`:340` ∥ 盘面 89）——已对上：`style.css` 139 ∥ `views-providers.mjs` 214 ∥ `views-models.mjs` 77 ∥ `app.mjs` 301 | 以当刻实读收正这几档行数与「拟新增」标记（可并入既有回填轮），使本批「行数零变」的基线计数为实读 |
| 4 | Affected-file size annotations | 🟡 | 批内件（`2026-10-06-console-list-style.test.mjs`——拟新增）无规模标注与拆档预案：批档 §2（`:35`）与 `design/PROJECT.md:178` 均未给估算行数；其余各批均有「新批内件（拟新增）估算 ≈450 行；越 500 硬线 ⇒ 沿注③拆档预案」注（`design/PROJECT.md:186`/`:188`/`:190`） | 补估算行数 + 越 500 拆档预案句（沿注③先例） |
| 5 | Document ownership | 🟡 | 文档地图（`design/PROJECT.md:81`）webui 行未含「样式族规范（§2.5）」，与 §2.1 职责行（`:29` 已含「样式族规范（§2.5）」）不同拍——先例 = 弹窗机制入地图行（`:298`——「§3 文档地图 webui 行（+ 弹窗机制）」） | 地图行补「样式族规范（§2.5）」 |
| 6 | Document ownership | 🔵 | R37（`design/PROJECT.md:269`——处置列「随本批评审/收口」）与需求档已落地状态不同拍：需求档变更记录已记「R37 拆行 · 主 agent 直接执行 · 可 revert」（`requirements/PROJECT.md:190`）——R37 已在需求档侧办结 | 收口轮销项（R37 引用的 :72/:78 两行超宽读数随拆行落地已过时） |
| 7 | Affected-file size annotations | 🔵 | 「≤300 软线内」总述句与实读不同拍（前批存量）：`webui/WEBUI.md:17`「各档 ≤300 软线内」∥ `design/PROJECT.md:134`「全部单档 **≤300 行软线内**」——`app.mjs` 实读 301（拆分预案 `webui/WEBUI.md:330`）、i18n 双表越线（R25 `design/PROJECT.md:257`）在其后 | 两句限定时点或随实读收正 |

**计数**：🔴 0 ∥ 🟡 5 ∥ 🔵 2（发现 7 条；🔴 零 ⇒ 通过）。

**本轮评审要点（附）**：设计档落点逐处 file:line 可核已复核（WEBUI.md §2.5 :143–312 ∥ §5 :345/:349 ∥ §6 :367–368 ∥ §7 :384 ∥ §8 :393 ∥ 变更记录 :416；PROJECT.md :29 ∥ :123 ∥ :140/:149/:178 ∥ :214 ∥ :268–270 ∥ :302 全对）；S1–S17 改前实读抽查全对（style.css 139 行逐处核到值）；七处 `.hint` 面与 `stat`/`view`/`.key-line` 死类实核相符；既有测试档未见类面断言（`hint`/`row-clickable`/`key-line` 零命中）⇒ 「类面断言零触」成立。

VERDICT: pass

### 轮次 2（评审子代理）

**轮次 2（修复核验——评审 #96 发现 1–7 修复 claims · fix 轮 §2 修正块 :54–72）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Methodology compliance | 🟡 | 修正块 #1 落点列含「本档『产品码（实施轮）』清单」（本档 :60），声称同步——实盘该行（本档 :34）未含 `views-system.mjs`（append-only 未变），与 `webui/WEBUI.md:314` 实施面（已含「`views-system.mjs`（诊断失败面 2 处——`.error` 修饰）」）不同拍；#4 落点「本档『批内件』行」同型（本档 :35 未变——估算/拆档预案实体在修正块 #4 行 + `PROJECT.md:194` 注⑨，无实质缺） | 落点列改指「§2 修正块（本行）」（或在该两行旁补注「以 §2 修正块为准」） |
| 2 | Document ownership | 🔵 | R25（`design/PROJECT.md:261`「弹窗批后 zh ≈309 ∥ en ≈305（估——双表均越 300 软线）」）与收正句所引实读「312 ∥ 308」（`webui/WEBUI.md:17` ∥ `design/PROJECT.md:134`）不同拍——同一指针（R25）两处数字不一 | R25 数字随实读收正，或引句注「估/实读」分列 |
| 3 | Clarity | 🔵 | ⑨ 行系统页面（`webui/WEBUI.md:297`「`views-system.mjs:47` 状态行 ⇒ `.error`」）仅携 `.error`（该面现无类），而 canon 记法 = 「错 = `.hint error`」——未明写 `.error` 须为独立生效选择器（若实施写成 `.hint.error` 复合选择器，该面不着色） | 口径句补「`.error` 独立生效（`.hint` 面同取）」一句，或该面并携 `.hint` |

**计数**：🔴 0 ∥ 🟡 1 ∥ 🔵 2（发现 3 条；🔴 零 ⇒ 通过）。

**本轮评审要点（附）**：七条修复声明逐条复核（设计档侧全中）——#1（`webui/WEBUI.md:297` ⑨ 行含系统页诊断失败面 ∥ :314 实施面含 `views-system.mjs`；残余 = 上表行 1 的记录面清单侧）∥ #2（口径④ :155 ∥ S1 :162 ∥ ① 表 :205–206/:211 ∥ AC-19 续 :369「行悬停声明清单（`.nav-item:hover` ∥ `tbody tr:hover` ∥ `li.key-item:hover`——同取 `var(--hover)`；清单外零行悬停声明）」 ∥ KD-SV-36 :385；`design/PROJECT.md:123`——两设计档全文零「唯一行悬停/全交互面/两族同值」残留，记录面三处（本档 :31 ∥ :35 ∥ :40）由修正块 :68 随正）∥ #3（:336/:337/:340——盘面复读 117/169/168 全中）∥ #4（`PROJECT.md:194` 注⑨ ≈400 行 + 拆档预案 ∥ :180；残余 = 上表行 1 尾注）∥ #5（`PROJECT.md:81`「样式族规范（§2.5）」）∥ #6（`PROJECT.md:273` R37「**需求档收正（已办）**」+ 原引行号已删；需求档侧在盘 = `requirements/PROJECT.md:190`「§2:17 ∥ §2:19 两行超宽（315 ∥ 565 字符）⇒ 拆行 ≤300。」）∥ #7（`WEBUI.md:17` ∥ `PROJECT.md:134` 限定时点 + 越线在册）。
盘面抽读（本轮实读）：`views-me.mjs` 117 ∥ `views-admin.mjs` 169 ∥ `views-system.mjs` 168 ∥ `views-usage.mjs` 139 ∥ `views-overview.mjs` 74 ∥ `views-audit.mjs` 88（read 末行号 = 既定「内容行数 ∥ 文末换行不计」口径——#3 收正全中）；`style.css` 139 ∥ `app.mjs` 301 ∥ `i18n-zh.mjs` 312 ∥ `i18n-en.mjs` 308（#7 引值全中）；七处「加载失败」面逐点命中（`views-admin.mjs:37` ∥ `views-me.mjs:72` ∥ `views-models.mjs:40` ∥ `views-usage.mjs:57` `:58` ∥ `views-audit.mjs:46` ∥ `views-providers.mjs:138`——末者文案键 = `admin.providers.listFailed`）；`views-system.mjs:47` 状态行无类 ∥ `:50` = `const testResult = h("p", { class: "hint" })` ∥ 文案点 `:66`/`:87` 全对（#1 补列面成立）；`li.key-item` 在盘（`views-me.mjs:24`）⇒ 行悬停新增可实施（#2）。
机检面（不可复跑——无 shell；按判据声明面核读）：行宽判据 = 超 `lineWidth` ∧ 非表格行 ∧ 非区带（`scripts/doc-check-width.mjs:82`；表格行谓词 :42；区带 = `PROJECT-MANIFEST.json:31`「变更记录/历史沿革」；扫描面 = :28「docs」）——两设计档落笔行全为表格行/区带内 ⇒ 「新增超宽 0」成立（spot-check）；「悬空 65」标 unverified。

**射程外注记（无严重度）**：§2 前段原落点坐标（本档 :26–28）与当刻盘面存差（例：`webui/WEBUI.md` §5「style.css 行」`:345` ⇒ 盘面 :348 ∥ §7 KD-SV-36 `:384` ⇒ :385；`design/PROJECT.md` §7 AC-19 `:214` ⇒ :218 ∥ §9 R36–R38 `:268–270` ⇒ :272–274）——as-of 坐标 + append-only 约束；修正块已按当刻盘面重引（逐处全对），不入闸。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 2026-10-06 23:0x——代执行）**

**代执行口径**（承用户 2026-10-06 22:05「好，后续你自动跑完」全链放行）：设计（§2 + 修正块）→ 评审轮 1（设计评审：**pass** + 7 条发现——🔴 0 ∥ 🟡 5 ∥ 🔵 2；§3 轮次 1 在档）→ 修复轮（七条逐号落地；§2 修正块 :54–72）→ **修复核验：pass**（7 条 claims 全核到落位 ∥ 残留 1🟡 + 2🔵 非阻塞）⇒ **批准进入实施**。

**三条件核验**：① 评审 pass（0🔴）✓（reviewId 不落档——沿纪律）；② 修复轮已落地并经核验 ✓（核验轮逐处复核 + 盘面复读全中）；③ designToken 已签发 ✓（凭据值不落档）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（impl 轮——批内件 7/7 绿 ∥ 内部分歧审计 1 轮 + 代码评审 2 轮：终态 clean）

### §5 实施记录（eng-coder · 功能点 19 ∥ 台账 #982——样式族总体统一 · 2026-10-06）

**交付摘要（落盘面——逐档 file:line，当刻盘面）**：

- `thincoder-server/public/style.css` 全量重排：实读 **198 行**（157 ⇒ +41）——`:root` 变量族 38（色 19 + 遮罩 1 ∥ 间距 7 ∥ 圆角 3 ∥ 字排 4 ∥ 线宽 2 ∥ 布局 2；`:6–40`）∥ `:root` 块外零颜色字面量 ∥ `font-size` 全 `var(--fs)`（29 处）∥ `font-weight` 全 400 ∥ `line-height` 全 `var(--lh)` ∥ padding/margin/gap ∈ `--sp-*` ∪ {0,auto} ∪ 布局组（唯一例外 `.content{margin-left:var(--nav-w)}` `:56`——父侧已裁）∥ 行悬停三声明同取 `--hover`（`:52` `.nav-item:hover` ∥ `:70` `tbody tr:hover` ∥ `:106` `li.key-item:hover`；清单外零行悬停声明）∥ 聚焦环单形两处（`:72` 行内缩 −2px ∥ `:77` 控件外偏 +2px）∥ 钮族五型态面（`:85/:87/:89/:91` 悬停 ∥ `:92` 禁用）∥ `.error` 独立生效（`:96`）∥ 死规则 `.key-line` 删净。
- 错态 canon 逐面（`.hint error`）：七处「加载失败」= `views-admin.mjs:37` ∥ `views-me.mjs:72` ∥ `views-models.mjs:77` ∥ `views-usage.mjs:57/:58` ∥ `views-audit.mjs:46` ∥ `views-providers.mjs:33`；系统页诊断失败 2 处 = `views-system.mjs:65`（状态行 ⇒ `.error`）∥ `:88`（试跑行 ⇒ `.hint error`）；#103 段内错误面 = `views-providers-modals.mjs:19`（§2.5 接续条款——以当刻盘面并入）。
- 死类串删：`views-usage.mjs:106` ∥ `views-overview.mjs:50`（`stat`）∥ `app.mjs:248/:259`（`view`）。
- 门禁：`thincoder-server/package.json:13`——prepublishOnly 十五 ⇒ 十六（添本批件）。
- 批内件（新增）：`docs/batches/2026-10-06-console-list-style.test.mjs`（实读 **234 行**；七腿：① 底座单源 ∥ ② 一套刻度（含 UA 带字号元素覆盖面）∥ ③ 态面 ∥ ④ 错态 10 处逐面 ∥ ⑤ 类名双向闭合 + 死类零 ∥ ⑥ 档目 19∥20 + 零外链 + 直发 ∥ ⑦ 门禁十六件）。

**自跑读数**：批内件 `node --test`（自 `thincoder/` 仓根）= 7/7 绿；`node --check` 全 11 改动 JS 档绿；档目 19 ∥ 20 逐名同拍 ∥ `public/**` 零外链 ∥ style.css 直发 200 + text/css + 字节等于磁盘（腿⑥在盘）；变异验证（摘 h2 `font-size` ⇒ 腿②判红）= 覆盖面腿有牙。全门禁（仓库套件）= 父侧唯一执行（本侧不跑）。

**决策透明表**：

| # | 决定 | 依据 |
|---|---|---|
| 1 | `.content{margin-left:var(--nav-w)}` 落盘（AC-19 续字面白名单之外一处） | 上抛父侧已裁：底座布局行（`--nav-w` = 侧栏宽+内容缩进）/S15 具体条款为准；白名单由父侧补明「∪ 布局组变量」 |
| 2 | `input:not([type="checkbox"])`——勾选框走原生 + `accent-color` | §2.5 ③ 表「勾选框 = 原生 + accent-color（零自绘）」 |
| 3 | h4 = 单条通用规则（`--muted` ∥ `--sp-5 0 --sp-3` ∥ `--fs`）——卡内 ∥ 弹窗体单源 | §2.5 ⑤ 层级行「h4 = `--muted`」+ 代码评审轮 1 修复（原 `.card h4` 形态 + `.modal-body h4` 两规并源） |
| 4 | `pre.snippet`（原 `.snippet`）+ `font-size: var(--fs)` | ⑩「同号同重」+ UA 带字号元素覆盖面（代码评审轮 1 修复） |
| 5 | `button:disabled` = 字 `--muted` ∥ 底 `--fill` ∥ `cursor: default` 三件 | §2.5 ② 禁用口径（字面执行） |

**审计与代码评审轮次与终态**：内部分歧审计 1 轮（结论：1 🟡——设计档「实施面/受影响清单」未列 `views-providers-modals.mjs`；授权链在案（§2.5 接续条款 + 父侧指令）⇒ 归父侧回填轮补列；其余三类零发现）→ 自修 2 轮（R1 ∥ R2）→ 代码评审 2 轮（轮 1 = 1🔴 + 3🟡 + 1🔵；轮 2 复核修复声明 = **pass**）。**终态 = clean。**

**fix round 明细**：

- R1（审计后）：批内件「色 20」标注 ⇒ 「色 19 + 遮罩 1」（对齐批档 §2 口径）；腿②标题/头注同拍。
- R2（代码评审轮 1 后）：`style.css:60` h2 补 `font-size: var(--fs)`（页题一字号——UA 1.5em 撤）∥ `style.css:62` 补 h4 通用规则（单源）∥ `style.css:111` `pre.snippet` + `font-size: var(--fs)` ∥ 批内件 `:92–102` 补 UA 带字号元素覆盖面腿（变异验证有牙）。

**实读行数（本件口径 = 内容行数 ∥ 文末换行不计）**：style.css **198**（157 ⇒ +41）∥ views-system.mjs **172**（168 ⇒ +4——错态切换语句）∥ 余档 ±0：app.mjs 300 ∥ views-admin 169 ∥ views-me 117 ∥ views-models 194 ∥ views-usage 139 ∥ views-audit 88 ∥ views-providers 56 ∥ views-providers-modals 272 ∥ views-overview 74 ∥ 批内件 234。（估算差（§5 ≈216 ∥ 批内件 ≈400 ∥ providers-modals ≈260）= R36 回填轮收正项。）

**披露 / 上抛（4 条）**：

1. `views-system.mjs` +4 行（168 ⇒ 172）——错误面态切换所需语句；批档「类串微改/行数零变」在 views-system 一档有差（余档 ±0）。
2. 设计档「实施面/受影响清单」未列 `views-providers-modals.mjs`（段内错误面）——授权 = §2.5 接续条款 + 父侧指令；归父侧回填补列。
3. 既有他批批内件的 public 档目断言为旧名册（`console-modals.test.mjs:331` ∥ `console-providers.test.mjs:426` ∥ `console-completeness-2.test.mjs:431` ∥ `console-provider-redo.test.mjs:506` ∥ `server-gateway-webui-deploy.test.mjs:274`——缺 `model-specs-snapshot.mjs`/`views-providers-modals.mjs` 两档，与当刻盘面 20 档不符）——本批零触；父侧随正（否则全门禁红）。
4. 工作树含前两批（#103/#106）未提交改动（`git HEAD` 旧于盘面）——比对基准说明（本侧逐档以当刻盘面实读为据）。

**零触确认**：`nav.mjs` ∥ `modal.mjs` ∥ i18n 两表 ∥ 服务端档 ∥ 需求/设计档 = 零笔（实读 + 审计在案）；`public/` 零新档（19 ∥ 20 不变）。

## §6 验证与收口（父代理）

**§6 核验与收口（主 agent · 2026-10-07 00:5x）**

**实施（四棒浪第 4 棒）**：eng-coder #107（initial）——子内审计 1 轮（1🟡 = 设计档缺列）∥ 代码评审两轮（1🔴+3🟡+1🔵 → pass）∥ 自修两轮。落点：`style.css` 全量重排 157 ⇒ 198（`:root` 38 变量族 ∥ 块外零色字面量 ∥ 悬停三声明清单 ∥ 聚焦环单形 ∥ 死类 `.key-line` 删净）∥ 错态九面（含 #103/#106 新面——段内错误面 `.hint error`）∥ `views-system.mjs` +4（态切换语句）∥ `stat`/`view` 死类四删。

**批内件**：`-console-list-style.test.mjs`（234 行）——**7/7** 含变异验证（摘 h2 字号 ⇒ 判红——腿有牙）；**父侧门禁链内并入复跑通过**。

**父侧动作**：① 接缝裁定：#107 上抛「AC-19 续白名单 vs `.content{margin-left:var(--nav-w)}`」设计内部张力——裁定按具体条款（白名单 ∪ 布局组变量），设计档已小修落明（父侧直接执行 · 可 revert）；② 设计档实施面补列 `views-providers-modals.mjs`（见 `docs/batches/2026-10-06-console-provider-redo.md` §6 ④）；③ 随正（本批相关：门禁件数断言 16 ⇒ 17 ∥ 全档目链 ∥ `-console-providers` ⑧ 档目）。

**披露处置**：1 `views-system` +4 行 = 记账（批档「行数零变」在该档有差）∥ 2 设计档缺列 = 已补列 ∥ 3 他批红风险清单 = 父侧随正全扫已清 ∥ 4 工作树基线说明 = 记账 ∥ 5 咨询项（app.mjs 软线既有——登记；行数估算差 ⇒ #983 回填轮）。

**核验读数**：`npm run prepublishOnly` = **140/140 ∥ 0 fail ∥ exit 0**（2026-10-07 00:4x）。

**台账号**：#982 在途 ⇒ 待核销 ⇒ 已核销（evidence = 本 §6 + 门禁读数）。

**欠账（已入账）**：#983（回填轮——R36 实读：style.css 198 ∥ 批内件 234）。
