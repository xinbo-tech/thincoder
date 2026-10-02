# 2026-10-02 · 桌面设置面布局收正
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 09:43「设置界面的样式很凌乱，你检查一下，改进一下」+ 09:55 补答（语言钮/✕ 可见）——父侧实查（截图 ∥ 像素采样 ∥ 窗口几何 ∥ 装机 asar 比对）后开批；台账 #812。
> 台账 = #812（桌面设置面布局 ∥ 样式收正 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）**

- **来源**：用户 2026-10-02 09:43「设置界面的样式很凌乱，你检查一下，改进一下」+ 09:55 补答（语言钮/✕ 可见）。台账 **#812**。
- **检查（父侧实查 · 09:44–09:55）**：① 截图 + 像素采样：设置内容列**右移**——内容（行面/文字）实测 [~1133..1920] ∥ 左 60% = 纯 `--bg`(#15171c) 空板（y=200/560/900 三线逐点采样，非目测）；② 长 URL 疑出血至右缘（`…ht`/`aliyuncs.con`——割面待探针核）；③ **【撤回】** 语言钮/✕ 可见性——用户 09:55 实答「有，可见」⇒ 头排完整（父侧截图误读，撤回该子项）；④ 行内换行凌乱（按钮掉行 ∥ URL 独占行）+ 纵向节奏不匀（视觉面）；⑤ 窗口 = 最大化全屏实测 1933×1045（排除「窗口小」）；⑥ 装机 app.asar（index.html ∥ settings.css）与仓库**逐字节同** ⇒ 源码「槽位 body 末位 + fixed inset:0 + 内容列 max 48rem 居中」与现场右移不符 = **布局异象，成因待运行面量测**（范式先例 = #801 触因定位）。
- **处置路线（用户令 = 检查 ✓ + 改进）**：设计轮 ① **运行面复现探针**（fixture-home dev 实例 + 量 `[data-slot=settings]` ∥ `.settings` 树 ∥ 行几何 ∥ `documentElement.clientWidth` ∥ zoom）钉成因；② 修复布局归位（头排控件全部可达）；③ 行样式收正（URL 换行/截断策略 ∥ 按钮族 ∥ 纵向节奏——归位后按实况定毫）。量级预估 = 探针 1 档 + 修复 1–2 档 + 样式 1–2 档（对账前置：先钉因再定毫）。
- **边界**：交互语义不动 ∥ D29 排版基线不动（一种字体一个字号）∥ 设置面七段信息架构保持（重组另议）。
- **冻结窗注意**：设计轮点火**待 #811 菜单批评审结算**（被审七档在冻结窗内——含本批将触的设计档）。
- **下一步**：设计舱（等冻结解除即点火）→ 探针定标 → 设计定形 → 评审（用户点火）→ 批准 → 实施。

**09:55–10:01 复核（父侧更正 · 截图采集面翻案）**：用户 09:55 实答「有，可见」+ 10:01 用户实拍（`d:\teamcode\.thincoder\tmp\paste-muqbh2r047gi-0.png`）＝ **设置面板居中 ∥ 头排（含 English ∥ ✕）全可见 ∥ 行内容完整（长 URL 未断）**。对照父侧 09:46 ∥ 09:50 ∥ 09:57 三次抓屏（CopyFromScreen）互不一致 ⇒ **「内容列右移」读数 = 采集面瑕疵（云桌面合成层），撤回**（先例 = 2026-09-30 截图呈现差）；设计源码行为正确（槽 = body 末位 + fixed inset:0 + 内容列 48rem 居中——与用户屏一致）。**残留待定位** = 用户原始诉求「样式很凌乱」所指：按用户实拍可见候选 =（a）渠道行密度/控件数（一排 5–7 件）∥（b）断行点参差（同构行折行不一）∥（c）下方各段（工具 ∥ env ∥ MCP ∥ 模型清单）——待用户一句话定位后开设计轮。**纪律入册**：本机屏幕抓取不得作画面证据（用用户实拍 ∥ 应用内元素探针）。

**10:03 用户贴 VSC 端设置面实拍（对标锚点 · `paste-muqbkfissg5h-0.png`）**：对比（图像实读）——VSC 端渠道 = **两行卡列**（行 1：`● 名 ★…` + 右对齐 `Key ∥ −`；行 2：`模型 · URL` + 右对齐 `proxy` 开关；卡间描边分隔 ∥ 断行恒定）；桌面端 = **单行内联 5–7 件**（`••••(masked)` ∥ `[当前]` ∥ `□代理 ∥ 修改 ∥ ✕ ∥ 校验 ∥ 移除 xx`），长短内容下折行参差 ⇒ 用户所指「凌乱」＝**渠道行形态**——设计轮目标落定：**按 VSC 收正**（两行卡 ∥ 动作紧凑右对齐 ∥ 断行恒定 ∥ 卡界）；**功能面不删**（校验 ∥ 修改 ∥ 移除等桌面既有动作保留——只收形与密度）；信息架构（七段）∥ 其余段零动。

**10:05 用户令**：「我希望至少跟 vsc 端样式上对齐」——方向确认（设置面样式面对齐 VSC；上条对比 = 其锚读）。需求落表 **D37**（`docs/desktop/requirements/PROJECT.md` §4 + 变更记录——本轮）。设计轮已提交（files 与 #9 菜单修复轮重叠 ⇒ 调度器排队，落档自动续跑）。

**10:27 用户裁定**：「待裁两项：尽量跟vsc一致吧，以后要改一起改。」——① 卡界 = **按 VSC 实形收**（边框载体——升底让位）∥ ② 拨杆形 = **保留**（已与 VSC 一致）∥ ③ 原则句入册：跨端差异项后续变更**两保持同步**。设计补笔已派（修复轮——队列在 #11 后）。

**【自动窗口（用户 2026-10-02 10:59 授权）】**（口径同本日各批：窗口 = 至用户返回；设计评审点火 ∥ §4 代签 ∥ 修正/实施派发 ∥ 收口核销 = 父侧自动，不逐次请点；自缚 = 代签三条件齐备 ∥ 需新范围、用户口径裁决、复核 🔴、验证不过 ⇒ 即停；外部发布 = 用户门。）**本批现状**：设计（含卡界补笔）在册——首评点火候菜单修复轮 #15 落定（防冻结撞：两批共享同一档集），随后全链自动。

**评审轮 1 处置（父侧 · 逐条裁定 = 全采纳）**：发现 7（需求侧两处）= **父侧笔 · 已落**（`docs/desktop/requirements/PROJECT.md:182` D37 行尾 ⇒ 指向已落设计 KD-66 ∥ `:169` D24 行补 10:27 卡界例外指引 ∥ 变更行 `:302`）；发现 1–6 ∥ 8 ∥ 9（含 🔴 行底残留——方向 = 按批内既定裁定「卡底升底让位」收正）+ 父侧补面两件（披露① 活动行 mix 基色收口 ∥ `UI.md:248` 同拍）= **修复轮 #19 在飞**（eng-designer · 设计档两档）。收敛表随评审轮 2 落 §4。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（五档已落；两项待裁已裁（用户 2026-10-02 10:27）；评审轮 1 修复落（§2.13）；代码评审两裁设计面收正落（§2.14）；文档回填轮落（§2.15——§4.1 ∥ §4.2 实读齐平 + settings.css 在册收记）；门复跑悬空 123 ∥ 行宽 121 ∥ 行数面 7——本席零新增（余差外部））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2.1 本批条目（覆盖 · 逐条可核）

| # | 条目 | 源 | 判据回指（设计档） |
|---|---|---|---|
| 1 | 设置面样式对 VSC 收正（**全七段**——渠道段 = 锚点首段；收正面 = 形态 ∥ 密度 ∥ 断行 ∥ 层次） | 需求 §4 **D37**（用户 2026-10-02 09:43 走查「设置界面的样式很凌乱」+ 10:05「我希望至少跟 vsc 端样式上对齐」） | `docs/desktop/design/UI.md` §1「本批注（设置面样式收正 · D37 · 2026-10-02 · 台账 #812）」①–③ + 机检四腿 + **T-DSK58** |
| 2 | 渠道行 = **两行卡列**（主行 = 名 + 钥面 + 当前标 + 动作簇 ∥ 副行 = `模型 · URL` + 代理开关 ∥ 条件第三行 = 不可用原因；断行恒定 + 中段单点省略；编辑态 = 行内换形） | D37 锚样本实拍（渠道段双端对比）+ VSC 实读 | UI.md §1 项 2 + 机检腿 ①② |
| 3 | **功能面不删**（校验 ∥ 修改 ∥ ✕ ∥ 移除名 ∥ 当前标 ∥ masked 钥——四件全保留 ∥ 序恒定；无新增动作） | D37 边界句 | UI.md §1 项 2 ∥ 7 + 机检腿 ①（功能面全保留断言） |
| 4 | 行族通则 + 复选拨杆形（全七段带上；**零新变量 ∥ 零新断点**） | VSC 实读 ∥ 桌面现状实读 | UI.md §1 项 1 ∥ 3 ∥ 4 ∥ 8 + 机检腿 ② ∥ ③ ∥ ④ |
| 5 | **越层消解（结构响应）**：`thincoder-desktop/renderer/views/settings-sections.mjs` 渠道族出档（**先拆后改**） | 越层在册（该档 **309** 越 300——消解窗口 = 结构性触碰；本批 = 结构性） | 拆后 ≈185 回线 + re-export 面零改（§2.7 行数表 ∥ 设计档 §4.2 行 1–2） |

### §2.2 设计落点与值表单源

- 决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-66**（八款 + 被否四候选）；端侧形态 ∥ 落点 ∥ 判据 ∥ 端差明细单源 = `docs/desktop/design/UI.md` §1 本批注（八项）。
- 值源（VSC 实读 · 行号已验）：两行卡 = `thincoder-vscode/webview/settings-providers.js:178-193`；卡值族 = `thincoder-vscode/webview/settings.css:155-203`；复选拨杆 = `thincoder-vscode/webview/settings.css:222-257`（30×16 ∥ 圆角 8 ∥ 钮 12px `#fff` ∥ 选中 `--accent` ∥ `left: 16px`）。
- 桌面现状实读（· 行号已验）：`thincoder-desktop/renderer/settings.css:145-154`（`.settings-row { flex-wrap: wrap }`）∥ `thincoder-desktop/renderer/views/settings-sections.mjs:129-153`（`providerRowNode`——单行内联 5–7 件 ∥ 编辑态换形既有）。
- **锚样本披露**：用户实拍锚图（`.thincoder/tmp/paste-*.png`）**不在盘**（tmp 已清）⇒ 本批以双端源码实读为据；观感面判据 = 真机 **T-DSK58**。

### §2.3 双端逐段对照表（收正设计骨——七段）

| 段 | VSC 值源 | 桌面现状 | 判（对齐 ∥ 保持 ∥ 端差） |
|---|---|---|---|
| 渠道（锚首段） | `settings-providers.js:178-193` 两行卡（`prov-main` ∥ `prov-sub`）+ 行尾 `Key ∥ −`；`settings.css:155-203` | `views/settings-sections.mjs:129-153` 单行内联（wrap） | **对齐**：两行结构 ∥ 断行恒定 ∥ 动作尾簇 ∥ 中段省略 ∥ 条件第三行（`.prov-hint` 红系）；**保持**：四动作全集 ∥ [当前] ∥ 校验钮（VSC 无）；**端差**：描边 ∥ 状态点 ∥ 圆角 ∥ 字重 |
| 模型与档位 | `settings-providers.js` default-model 行形（名 + 值 + 右动作） | `views/settings-sections.mjs`（当前行 ∥ 档位行 ∥ 候选行） | **对齐**：行族通则；**保持**：候选行族（IA 零改）；端差：无（观感面） |
| agent 参数 | `settings-agent.js` 具名控件 + `.switch` | `views/settings-agent.mjs`（标左 6rem 字段行 + 原生复选） | **对齐**：拨杆 ∥ nowrap；**保持**：标左（48rem 列宽域——端差 ⑤） |
| MCP | `settings-tools.js` 单行键行 + 展开面工具行（竖排） | `views/settings-sections-mcp.mjs`（单行多件 wrap；工具行内联） | **对齐**：摘要省略 ∥ 动作尾簇 ∥ 展开面竖排三段；**保持**：五动作全集 |
| env | `settings-env.js` 标上行 + `.switch` | `views/settings-sections-env.mjs`（标左 + 原生复选） | **对齐**：拨杆 ∥ nowrap；**保持**：标左 ∥ 测试行内联 |
| 工具与服务 | `settings-tools.js` 键行 + 索引行 | `views/settings-sections-tools.mjs` | **对齐**：动作尾簇（`~` 零化）∥ nowrap；**保持**：键行两钮 ∥ 索引行 |
| 模型清单 | `settings-agent.js` consult 行 + advisor 两 picker | `views/settings-sections-models.mjs` | **对齐**：nowrap ∥ 省略 ∥ 动作右；**保持**：advisor 两 picker ∥ ≤5 上限 |

### §2.4 收正设计落形（形态定形——逐件）

- **四则**：① `flex-wrap: wrap ⇒ nowrap`（`.settings-row`——渠道 / 模型 / MCP / 键行 / consult 族共形单源）；② 中段单点省略（`min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`——泛用 `.settings-row-value`；原因句 `has-reason` 档保 `normal`）；③ 动作簇 = 行尾单簇（首 `margin-left: auto` 既有；续钮 `~` 零化）；④ 层次/密度 = 主行 ∥ muted 副行 ∥ 条件第三行；两行间距 4px ∥ 卡内边距 6px 8px（保持）。
- **渠道卡解剖**（两行 + 条件行；串形照 VSC `${model} · ${baseURL}` 缺段不落空分隔符）；**编辑态** = 名 + 钥面 + 输入（伸缩）+ 存 ∥ 消（代理 ∥ 移除 ∥ 校验暂撤——取消即回；沿既有 `providerRowNode` 换形）。
- **拨杆形**（复选子域）：`appearance: none` + 轨道 30×16（圆角 8 · 底 = 桌面次级键族值） + 钮 12px `#fff` + 选中 `--accent` + `left: 16px`——**桌面主题令牌取值**（VSC `--border` ∥ 桌面等价 = 次级键族；实施批取值）。
- **零新变量 ∥ 零新断点**——值全取既有令牌（D24 ∥ D29 基线）。

### §2.5 边界（不做）

交互语义 ∥ 功能增删 ∥ 七段信息架构（段集 ∥ 段序）· 布局面（48rem 居中列——2026-10-02 实证正确）· VSC 边框 ∥ 圆角 ∥ 600 字重 ∥ 标上行表单（端差登记）· 主题变量表 ∥ 断点 · 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 侧零触。

### §2.6 验收路径

- **机检** = 批内件 `docs/batches/2026-10-02-desktop-settings-layout.test.mjs`（**拟新增 · ≈250 行 · 四腿**：① 行结构断言（渠道行描述符树平 node 直测：两行 ∥ 动作簇四件序 ∥ 编辑态换形 ∥ 第三行条件 ∥ 功能面全保留）；② 断行恒定（`settings.css` 源扫）；③ 样式纪律（零新变量（`--` 定义数 0）∥ 零 `@media`）；④ 拨杆四规则在位）；随批留存 · 不进仓套件。
- **真机** = **T-DSK58**（用户实拍可比：渠道两行卡 ∥ 长 URL 省略不折 ∥ 窄窗恒定 ∥ 编辑态 ∥ 拨杆——亮 ∥ 暗两模式）。
- **离线不可产面**（真渲染视觉）= 人工走查 + 父侧真跑闭合（D16 义务）。
- **门实跑**：设计轮写入前基线 = 悬空 **129** ∥ 行宽 **121** ∥ 行数差 **9**（存量——非本批引入）；写入后复跑比对——**零新增**为目标。

### §2.7 行数预算与越层处置（内容行数口径——文末换行不计）

| 档 | 现行 ⇒ 预期 | 处置 |
|---|---|---|
| `thincoder-desktop/renderer/views/settings-sections.mjs` | **309 ⇒ ≈185** | 渠道族出档（先拆后改——拆出 `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（拟新增 · ≈165）；re-export 面零改；越 300 消解——除名归实施批回填） |
| `thincoder-desktop/renderer/settings.css` | **268 ⇒ ≈292** | 四则 ∥ 两行卡 ∥ 拨杆 ∥ MCP 展开面竖排；**设计目标 ≤300**——若实施逾 300 ⇒ 归父侧裁（拆分预案在册） |
| `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` | **183 ⇒ ≈186** | 摘要省略标记 ∥ 工具行竖排注 |

### §2.8 上抛 ∥ 待裁（登记 —— 设计档 §10 **DH** 同拍）

① **卡界载体待裁**——VSC 1px 边框 ∥ 桌面升底（D24 描边归零基线保持中；如需边框 = 一行规则可加——用户裁）；② **拨杆形复选 = 观感变化项**（形变可逆——单点回退：删四规则还原原生复选）。

### §2.9 发现与报告面（逐条）

① 锚样本图不在盘（披露见 §2.2——以双端源码实读为据）；② 越层窗口触发（`settings-sections.mjs` 结构性触碰确认）——处置 = 拆档（非阻塞）；③ `settings.css` ≈292 = 设计估算——阈值裁归父侧（见 §2.8 邻项）；④ 需求 D37 现文引言措辞（「凌乱」）与勘验结论（以样式面为主 ∥ 功能面仅作边界）一致；如需措辞细化 = 需求侧笔权（主 agent）——本席未触需求档；⑤ 门存量 FAIL 两条（锚 129 ∥ 行宽 121）系存量——非本批引入（披露）。

### §2.10 三链一致 + 落点清单

- **三链同源**：§2.1 批次条目 ↔ 设计档验收回指（§6.1 本批块 + T-DSK58）↔ 需求档 **D37**（父侧已落——本席零触）。
- **设计档落点**（本批笔迹）：`docs/desktop/design/PROJECT.md` §2 **KD-66** · §4.1 新行一 + 两处随动 · §4.2 本批块 · §6.1 本批块 + 表头 **D1–D36 ⇒ D1–D37** · §7 批注 + **T-DSK58** · §8 本批边界行 · §10 **DH** · 变更记录；`docs/desktop/design/UI.md` §1 本批注八项 + 设置面行行内指针 + 变更记录；四档档头 **D1–D36 ⇒ D1–D37**（`docs/desktop/design/{UI,RENDERER,IPC,SHELL}.md`——机制面零触）。
- **产品码零触（设计轮）**；实施面（拆分 ∥ CSS ∥ 段体 ∥ 批内件）归实施轮。

### §2.11 门复跑读数（设计轮写后 · 2026-10-02）

- **悬空 129 ⇒ 129**（＝ 基线 ∥ 零新增——写后首跑曾 +4（`settings-sections-providers.mjs` 标注词序 ∥ `renderer/views/settings.mjs` 裸路径），已逐条修净复跑）；
- **行宽 121 ⇒ 121**（＝ 基线 ∥ 零新增——写后首跑曾 +3（§本批二行 ∥ UI 本批注导语一行），已拆分 ∥ 收敛复跑）；
- **行数面 9 ⇒ 10**（报告态**非闸**：+1 ＝ 新档 `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（拟新增）登记行「盘无档」——随实施落盘消解）；
- **拟新增桶 41 ⇒ 45**（不入闸桶——本批新档 ∥ 批内件 ∥ 拆出档等引用入桶）；
- 记录面：`.thincoder/tmp/doccheck-before.txt` ∥ `doccheck-after.txt`（前后清单可 diff）。

### §2.12 修复轮附记（用户 2026-10-02 10:27 两项裁定落地 · 2026-10-02 · eng-designer）

- **裁定源**：用户 10:27「待裁两项：尽量跟vsc一致吧，以后要改一起改。」——① 卡界 = 按 VSC 实形收 ∥ ② 拨杆形 = 保留（零改）∥ ③ 原则句：跨端差异项后续变更两端保持同步（本裁定 = 首例）。
- **① 落笔（卡界）**：`docs/desktop/design/PROJECT.md` §2 **KD-66 ⑤** 收正 = 「卡界 = VSC 实形——1px 描边（`--line`）+ 圆角 6px（实读 `thincoder-vscode/webview/settings.css:155-159`）；卡底零独立填充；D24 描边归零基线全局零动——仅本卡界让位」＋被否列清「照搬 VSC 边框 ∥ 圆角」尸条；`docs/desktop/design/UI.md` §1 本批注项 1 ③ 同拍（含 VSC 实读原值）+ 项 2 去「卡界描边」不采用条 + D24 注两处残句清（`.settings-row` 行移出升底 ∥ 活动行注去「行自持升底」）＋ 设置面行（§1 表）同句补注；同档 §8 边界行同拍（去「VSC 边框」）。
- **② 落笔（拨杆 ∥ 端差②条判）**：拨杆形 = 保留（已与 VSC 一致——零改；回退配方在册——DH ③ 同拍）。**端差②条「与卡界裹挟关系实读后判」= 收窄为余域**——实读：VSC `settings.css` 6px 族八处（卡 ∥ 钮 ∥ 输入 ∥ 横幅——面级族），卡界（`.prov-row`）仅一例；裁定射程 = `:155-203`（卡域）⇒ 卡例并入对齐（项 1 ③ 同形）、余域留登记不追；UI 本批注项 5 端差 **5 ⇒ 4**（项 8 计数同拍）。
- **③ 落笔（原则句）**：DH 行附「跨端差异项后续变更两端保持同步」（用户 10:27——本裁定 = 首例）。
- **披露（非阻塞）**：活动 / 当前行混同基色仍为 `--bg-raised`（D24 原文）——卡底让位后基色是否随改 = 未裁定，本轮零动（归实施轮 ∥ 父侧裁）。
- **门复跑（修复轮写后）** = 悬空 **129** ∥ 行宽 **121** ∥ 行数面 **10**——零新增；**产品码零触（纯设计笔）**。明细 = 本附记 ∥ 设计档（PROJECT.md ∥ UI.md）。

### §2.13 修复轮 1 附记（设计评审轮次 1 · 发现 1–6 ∥ 8 ∥ 9 逐号落修 · 父侧裁 = 全采纳 · 2026-10-02 · eng-designer）

- **裁定源**：批档 §3 轮次 1（changes-required · 🔴1 ∥ 🟡6 ∥ 🔵2）；父侧裁 = 全采纳。第 7 号（需求档两处）= 父侧笔权——本席零触（不在落修面）。
- **逐号落修（号 → 改动 file:line）**：
  - 1（🔴）行底残留收正——`docs/desktop/design/UI.md` §1 设置面行（`:29`）：「行升底」⇒「行族卡界让位（升底让位 ∥ 1px 描边 + 圆角 6px——随 D37 收正）」；两族复扫（`行升底` ∥ `独立填充`）规范面零残（残留 = dated 记录面：两档变更记录 ∥ 批档）。
  - 2（🟡）豁免锚点名——UI.md 本批注项 1① `has-reason` ⇒ `[data-unavailable-reason]`（既有锚；置位 = `thincoder-desktop/renderer/views/settings-sections.mjs:83-84`）；机检腿 ② 扫描面同拍（`docs/desktop/design/PROJECT.md` §6.1 批块）。
  - 3（🟡）动作簇序明示——核 VSC 实序（`thincoder-vscode/webview/settings-providers.js:183-186` = 设钥 ∥ 删钥——与现盘同序）⇒ 判「保持现盘（修改 ∥ ✕ ∥ 校验 ∥ 移除名）」：KD-66 ② ∥ UI.md 项 2 ∥ T-DSK58 ① 三处括注改现盘序 + 机检腿 ① 序基线明示；非收正 ⇒ 不涉「变更」列。
  - 4（🟡）走查面清单对齐——T-DSK58 腿 ④ 补「亮 ∥ 暗两模式」；§6.1 ∥ §7 清单补「全七段行族零参差折行」⇒ §7「五面 ⇒ 六面」。
  - 5（🟡）卡界腿补——机检四腿 ⇒ 五腿（+⑤ 卡界源扫 = `.settings-row` 1px `--line` 描边 + 圆角 6px——用户 10:27 直裁形落）；三处同拍（§6.1 ∥ §4.2 行 6 ∥ UI.md 项 6）。
  - 6（🟡）D24 注验收面同拍——项 7 负向锁 `--line` 值列纳 `.settings-row`；真机腿「静息四边 `rgba(0,0,0,0)`」补豁免注（卡界静息非透明）。
  - 8（🔵）计数收正——§4.2 行 5 `mount-settings*.mjs` 四 ⇒ 七档（枚举：`mount-settings.mjs` ∥ `-reads` ∥ `-exits` ∥ `-segments` ∥ `-segments-{models,providers,agent}`）。
  - 9（🔵）§10 DH ③「零改」限定对象（值面照搬 VSC ∥ 相对现盘 = 新增四规则——现盘复选仅 `align-self`）；回退句保留。
- **父侧补面两件（同轮）**：a = 活动 / 当前行 mix 基色收正（`--bg-raised` ⇒ `--bg`——判由 = 行域静息底一致；卡底让位后行域静息底 = `--bg`）；b = UI.md D24 注项 5 同族句随 a 同拍。§2.12 披露① 随此收口。
- **记录面收口附注**：§2.4「原因句 `has-reason` 档保 `normal`」表述随本轮收正——现行单源 = UI.md §1 本批注项 1①；§2.6 腿集 ∥ 真机清单同拍——现行 = PROJECT.md §6.1 批块（五腿 ∥ 六面清单）。
- **门复跑（修复轮 1 写后）** = 悬空 **123**（基线 129——−6：外部〔菜单批实施落盘 4 档消解〕；本席零新增）∥ 行宽 **121**（持平——其一 D33 §8 行 315 ⇒ 346 = 他批随动笔，非本席）∥ 行数面 **10 ⇒ 20**（报告态非闸——外部：菜单批实施落盘表-实差 12 档）。
- **产品码零触（纯设计笔）**。明细 = 设计档两档变更记录（PROJECT.md ∥ UI.md）。

### §2.14 代码评审两裁设计面收正轮（①④ 定形 + ⓐⓑ 收正 · 2026-10-02 · eng-designer）

- **裁定源**：批档 §5 五①⑤⑥（in-child 代码评审三披露——🟡① = agent 只读行三件无收束出口；🔵④ = MCP 展开面词行/描述受通用省略截断）+ §6.1（两裁处置 + ⓐⓑ 收正令）。本轮 = **docs-first 设计面钉死**（为随后 coder 修复轮提供依据）。**零新语义**（已裁项定形 ∥ 一字级/坐标收正）。
- **① 定形（只读字段行收束——选 ① 弃 ②）**：实体 = `thincoder-desktop/renderer/views/settings-agent.mjs:156-161`（只读支三件 = label + 值 span + 提示 span）；落形 = `thincoder-desktop/renderer/settings.css` 只读两件邻域（`:247-251`）——`.settings-field-readonly` 补缩省略四件（`min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`——沿行族 `:157-158` 同四件）；**提示 span 同拍处置 = `.settings-readonly-hint` 定尺寸不缩（`flex: 0 0 auto`——短词面禁截）**。**披露**：弃 ②（折行豁免）——由 = 行族一致性（四件式）+ 值面（路径 ∥ 标量）省略可接受；代价 = 值长于行宽时省略（提示词恒全显）。
- **④ 定形（MCP 展开面 = 全显豁免——作用域二择定形）**：实体 = `thincoder-desktop/renderer/views/settings-sections-mcp.mjs:70`（工具行描述）∥ `:87-88`（回执词行——加载 ∥ 探活 ∥ 重连 ∥ 失败）；落形 = `thincoder-desktop/renderer/settings.css` MCP 展开面段（`:172-175` 邻域）——`.settings-mcp-detail .settings-row-value { white-space: normal; overflow-wrap: anywhere; }`。**披露**：作用域定形 = `.settings-mcp-detail`（容器类——覆盖描述 ∥ params ∥ 回执词行全体）；候选 `[data-mcp-detail]` 仅覆词行（描述 span 无该锚）⇒ 弃；`overflow-wrap: anywhere` = 增量（长串软折——「全显 ∥ 零出血」双保）；**行族通则本体（`:157-158`）零动**（豁免独立成则；折叠面摘要行 ∥ 工具行名零动）；对齐由 = VSC `.mcp-tool-desc` 本就全显（`thincoder-vscode/webview/settings.css:380`）。
- **判据面（四号共生项——形落须有红，沿卡界腿先例）**：批内件 `docs/batches/2026-10-02-desktop-settings-layout.test.mjs` 腿 ② 扫描面扩——只读收束（`.settings-field-readonly` 四件 ∥ 提示面 `flex: 0 0 auto`）∥ 展开面豁免（`.settings-mcp-detail` 域值面 `white-space: normal`）——**随 coder 修复轮落**。
- **落盘（逐处读回）**：`docs/desktop/design/PROJECT.md` §2 **KD-66 ③** 补则两件（`:111`）；§6.1 腿 ② 扫描面扩 + 豁免锚坐标收正（`settings-sections.mjs:83-84` ⇒ `settings-sections-providers.mjs:81`——现行置位，`:1510-1511`）；§7 **T-DSK58 ③** 括注收齐三件（代理 ∥ 移除 ∥ 校验暂撤，`:1596`）；变更记录一行（`:2293`）。`docs/desktop/design/UI.md` §1 本批注项 1① 补则同拍（`:634`）+ 变更记录一行（`:939`）。
- **ⓐⓑ 收正**：ⓐ `:1596` ③ 括注补「校验」（收齐形态单源 = UI.md 编辑态三件）；ⓑ `:1510` 豁免锚坐标随拆档失效收正（置位 = `settings-sections-providers.mjs:81`）。
- **范围纪律**：点修四号（不全探索 ∥ 不重勘前轮）；未触 §4.1/§4.2 行数回填（候 coder 修复轮落定——另轮）∥ 其它批文档（菜单 ∥ 重组 ∥ 打包）；评审面未重开。
- **门复跑（本轮写前 ⇒ 写后）** = 悬空 **123 ⇒ 123** ∥ 行宽 **121 ⇒ 121** ∥ 行数面 **11 ⇒ 11**——本批裁面零新增（候选 +4 全数落定——零新悬空 ∥ 零新超宽）；记录面 = `.thincoder/tmp/doccheck-d37-codefix-{before,after}.txt`（可 diff）。**产品码零触（纯设计笔）**。
- **承接**：coder 修复轮（CSS 两则 + 批内件腿 ② 扩 + 批内件复跑）→ §4.1/§4.2 行数回填轮 → §6 收口候 T-DSK58。

- **预算观察（非阻塞 · 供 coder 修复轮预置——§2.14 补记）**：`thincoder-desktop/renderer/settings.css` 现读数 = **299** 行（距 ≤300 设计目标余 1）；①④ 两则落码（各 ≥1 行——合计 ≥ +2 行）**将逾 300** ⇒ 触发 §2.7 既定条款（**归父侧裁**——拆分预案在册）；本席未预裁（候 coder 修复轮落码后按实读裁）。

### §2.15 行数回填轮（实施后 · §4.1 ∥ §4.2 实读齐平 + settings.css 在册收记 · 2026-10-02 · eng-designer）

**轮性质** = fix（目标钉死 = 五面：§4.1 行数齐平 · §4.2 本批块翻实读 · §2.14 预算观察补记（本段顺延收记）· 两档变更记录 · 门零新增；沿菜单批（#811）文档回填轮（其档 §2.10）同模式；全案不重勘）；**授权** = 父侧派单；**落笔面** = `docs/desktop/design/PROJECT.md` ∥ `docs/desktop/design/UI.md` ∥ 本档 §2——**产品码零触** ∥ 需求档零触 ∥ 其它批文档（菜单 ∥ 重组 ∥ 打包）零触 ∥ **§7 用例表零触**（T-DSK58 行已收正）。

**「面 → 改动 file:line（D6 逐处读回在盘）」逐条**：

1. **§4.1 四行实读齐平**（口径 = 内容行数（文末换行不计）；实读 2026-10-02）：`thincoder-desktop/renderer/views/settings-sections.mjs` **164**（`:279`——309 ⇒ 164：越 300 消解）∥ `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` **185**（`:283`——183 ⇒ 185）∥ `thincoder-desktop/renderer/views/settings-sections-providers.mjs` **已落 · 182**（`:285`——「（拟新增）」转正）∥ `thincoder-desktop/renderer/settings.css` **304**（`:319`——268 ⇒ 304——**在册越线不拆**（可读性优先）+ 预案 ∥ 窗口同口径收记）。
2. **§4.1 越层段收记**：`views/settings-sections.mjs` 拆档兑现 ⇒ **除名兑现**（`:350`——309 ⇒ 164；十五 ⇒ 十四）∥ `settings.css` 覆盖式**新入册**（`:351`——304；十四 ⇒ 十五——净十五，与档数链快照互洽；口径 = `thincoder-desktop/renderer/settings.css:10` 头注）。
3. **§4.2 本批块翻「现行 ⇒ 实读（实施落盘）」**（`:1316` 块首行 + `:1318` 表列头）：四产品行实读回填（**309 ⇒ 164** ∥ **无 ⇒ 182** ∥ **268 ⇒ 304** ∥ **183 ⇒ 185**）+ **批内件行转正**（`:1325`——**已建成 · 219 行 · 五腿 · 9 用例**——先红后绿（8/9 ⇒ 9/9；修复轮 ①④ 补则入扫））。
4. **判据面「（拟新增）」转正**：§6.1 机检面（`PROJECT.md:1510`）∥ `docs/desktop/design/UI.md` §1 本批注项 6（`:644`）同拍。
5. **§2.14 预算观察补记（本段顺延收记）**：其文记「本席未预裁——候 coder 修复轮落码后按实读裁」⇒ **裁定已出 = 在册越线（304）不拆**（可读性优先）——同口径落于 §4.1 行 ∥ 越层段 ∥ §4.2 行 ∥ `thincoder-desktop/renderer/settings.css:10` 头注四处。
6. **两档变更记录各一行**：`docs/desktop/design/PROJECT.md`（`:2295`）∥ `docs/desktop/design/UI.md`（`:940`）。

**未触（披露——父侧钉定面外）**：`PROJECT.md` 三处「（拟新增）」标记按点修纪律留档——KD-66 ⑦（`:111`）· §7 T-DSK58 行（`:1597`）∥ §7 批注（`:1669`）（§7 两处 = 父侧「不动 §7 用例表」；KD-66 ⑦ = 决策面未在钉定面内）；如需同拍 ⇒ 父侧一句话。

**门实跑（M8 doc-check · before ∥ after 双读）**：锚 悬空 **123 ⇒ 123**（±0——逐族同值）∥ 行宽 **121 ⇒ 121**（±0）∥ 行数面 差异 **11 ⇒ 7**——**本批 4 条销项**（§4.1 四行全清；余 7 条 + 1 行式异常系他批存量）；拟新增 41 ⇒ 45 ∥ 候选 43218 ⇒ 43230（信息面——不入闸）。记录面 = `.thincoder/tmp/doccheck-d37-backfill-{before,after}.txt`（可 diff）。**本批裁面零新增**；**产品码零触**（纯设计笔）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设置面样式收正批（#812）· 设计档 KD-66 · 设计评审（轮 1 · 独立评审）**

被评件 = 六档全读（`PROJECT.md` §2 KD-66 ∥ §4.1 ∥ §4.2 本批块 ∥ §6.1 本批块 ∥ §7 T-DSK58 + 批注 ∥ §8 ∥ §10 DH；`UI.md` §1 本批注（设置面样式收正 · D37）+ D24 注；`requirements/PROJECT.md` §4 D37 并 D24 对照）。评级口径：无项目标准档 / 无文档地图（清单未给）——方法学与归属判据按 AGENTS.md + 在档惯例。旁证核读（以设计所引源码坐标 spot-check 关键实读）：VSC `webview/settings.css:155-159` = `border: 1px solid var(--border)` + `border-radius: 6px` ✓ ∥ `:222-257` 拨杆五值 ✓ ∥ 桌面 `settings.css:145-154` 单行 wrap ✓ ∥ `settings-sections.mjs:129-153` 单行内联 5–7 件 ✓；行数账抽核四处一致（`settings-sections.mjs` **309** ∥ `settings.css` **268** ∥ `settings-sections-mcp.mjs` **183** ∥ `views/settings.mjs` **364**）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档归属（同机制两处相抵） | 🔴 | `.settings-row` 行底两说并存且相抵：`UI.md:29`（设置面行 D24 句）仍写「结构框归零 + **行升底**」；而 `PROJECT.md:111`（KD-66 ⑤）与 `UI.md:635` 同题写「**卡底零独立填充**」，`UI.md:934`（本批修复轮记录）并称已做「`.settings-row` 行去升底」。现盘 `thincoder-desktop/renderer/settings.css:153` = `background: var(--bg-raised)`（升底在盘）——实施者无法唯一确定该行使否保留底色；T-DSK58 六腿与机检四腿均不判行底 ⇒ 猜错不落红。 | 定一：若卡界 = VSC 实形（无填充）⇒ `UI.md:29` 的「行升底」删/限定（同句已有「行族卡界已随 D37 收正」）；若保留升底 ⇒ `KD-66 ⑤` ∥ `UI.md:635` 的「卡底零独立填充」改写为「卡底保持升底」并补端差登记。三处（KD-66 ⑤ ∥ UI.md 设置面行 ∥ UI.md:247）同拍。 |
| 2 | 清晰度 | 🟡 | 「不可用原因句豁免档」未点名锚：`UI.md:633` 记「豁免 = `has-reason` 档保 `white-space: normal`」，机检腿 ②（`PROJECT.md:1509`）扫面亦写「原因句豁免档」；全仓 grep 无 `has-reason` 符——现盘锚 = `[data-unavailable-reason]`（`settings-sections.mjs:83-84`）。 | 点名豁免选择器（用既有 `[data-unavailable-reason]` 锚，或显式声明新增标记 `data-has-reason` 与置位点），机检腿 ② 扫描面同拍。 |
| 3 | 清晰度 | 🟡 | 动作簇规范序未定及与现盘不一致：`PROJECT.md:111`（KD-66 ②）∥ `UI.md:638` ∥ T-DSK58 ①（`PROJECT.md:1593`）记「校验 ∥ 修改 ∥ ✕ ∥ 移除名——序恒定」，而现盘 DOM 序 = 修改 ∥ ✕（删钥）∥ 校验 ∥ 移除（`settings-sections.mjs:143-151`）；设计未标该序为收正亦未标「保持现状」——机检腿 ①「动作簇四件序」基线不明。 | 明示规范序；若 = 收正（位变）⇒ §4.2 本批块「变更」列补记；若「序恒定」指保持现状 ⇒ 括注序改为现盘序。 |
| 4 | 验收判据 | 🟡 | 真机面清单两处逐项不齐：§7 批注（`PROJECT.md:1665`）「走查五面——清单 = §6.1 本批块」∥ §6.1（`PROJECT.md:1510`）五面末项 = 「拨杆——亮 ∥ 暗两模式」，而 T-DSK58 行（`PROJECT.md:1593`）腿 ④ 仅「拨杆形（选中 `--accent`）」、腿 ⑤「全七段行族零参差折行」在 §6.1 ∥ §7 清单无对应。 | 两处清单逐项对齐（补/撤「亮 ∥ 暗两模式」项；补「全七段零参差折行」腿于 §6.1 ∥ §7 清单）。 |
| 5 | 验收判据 | 🟡 | 10:27 卡界裁定（1px 描边 + 圆角 6px）无判据载体：机检四腿（`PROJECT.md:1509` ∥ `UI.md:643`）与 T-DSK58 六腿均无卡界腿——本批唯一用户直裁的形落无红可落。 | 补一条卡界腿（源扫 `.settings-row` 的 `border: 1px solid var(--line)` + `border-radius: 6px`，或真机 computed 读数），挂机检或 T-DSK58 其一。 |
| 6 | 文档状态 | 🟡 | D24 注验收面未随卡界例外同拍：`UI.md:247`（项 5）已把 `.settings-row` 收正为 1px 描边 + 圆角 6px，但同注项 7（`UI.md:259`）负向锁仍只列 accent 值列（`.permission-prompt` ∥ `.question-card`）+ `--line` 值列（`#input-row` ∥ `.plan-card`），未纳 `.settings-row` 的 `--line` 1px 界；项 7 真机腿（`UI.md:260`）「静息四边 `rgba(0,0,0,0)`」无该例外出口。 | 项 7 负向锁 `--line` 值列补 `.settings-row`（或加例外指句）；真机腿补豁免注（卡界静息非透明）。 |
| 7 | 需求侧协调（R5） | 🟡 | 需求档两处未随批收正：`requirements/PROJECT.md:182` D37 行尾仍「实现形待设计」（设计 KD-66 已落——沿 D36 先例，需求行收正为指向设计）；同档 `:169` D24 判据句（设置面板静息描边归零 + 保留面清单）未携 10:27 卡界例外的指引——按 AGENTS.md「Docs conflict → stop and report」，需求面须留例外指句免后读按旧判据判红。 | D37 行尾状态改指已落设计（KD-66）；D24 判据句补 10:27 例外指引（「仅设置面行族卡界让位」一句）。 |
| 8 | 值面漂移（R7c） | 🔵 | §4.2 零改面（`PROJECT.md:1323`）记「`mount-settings*.mjs` 四档」，盘面该 glob 命中 **7 档**（`mount-settings.mjs` ∥ `-reads` ∥ `-exits` ∥ `-segments` ∥ `-segments-{models,providers,agent}`）——「四」非盘面数。 | 计数收正（四 ⇒ 七），或把「四档」限定为不含 `-segments-*` 三档的枚举范围。 |
| 9 | 措辞（R7c） | 🔵 | §10 DH ③（`PROJECT.md:1812`）「拨杆形 = 已裁——保留（已与 VSC 一致——零改；形变可逆——单点回退：删四规则还原原生复选）」与 `UI.md:641` 项 4 ∥ 机检腿 ④（新增拨杆四规则）字面张力：现盘 = 原生复选（`settings.css:213` 仅 `align-self`）⇒ 相对现盘属换形。 | 「零改」限定对象（值面照搬 VSC ∥ 相对现盘 = 新增四规则），回退句保留。 |

**计数**：🔴 1 · 🟡 6 · 🔵 2
**VERDICT: changes-required**

### 轮次 2（评审子代理）

设置面样式收正批（#812）· 设计档 KD-66 · 复评（核验轮 · 轮 2）——核轮 1 发现表（1🔴/6🟡/2🔵）落修 + 明显新问题。

核读面 = `docs/desktop/design/PROJECT.md`（KD-66 ∥ §4.2 本批块 ∥ §6.1 本批块 ∥ §7 批注/T-DSK58 ∥ §8 ∥ §10 DH ∥ 变更记录）∥ `docs/desktop/design/UI.md`（§1 本批注 ∥ D24 注 ∥ 变更记录）∥ `docs/desktop/requirements/PROJECT.md`（D24/D37）。旁证（设计所引源码坐标 spot-check 四处，皆属实）：`settings-sections.mjs:83-84`（`[data-unavailable-reason]` 锚）∥ `:142-151`（现盘子序 = keyControls[修改,✕] → verifyControl → remove ⇒ 修改∥✕∥校验∥移除）∥ `settings.css:213`（复选仅 `align-self`）∥ `settings-providers.js:183-186`（VSC `.prov-actions` = [Key,−]——前两件同序）。

| # | Orig# | 位置 | 状态 | 本轮实读证据 |
|---|-------|------|------|--------------|
| 1 | 1 | UI.md:29 ∥ :247-248 ∥ PROJECT.md:111 | Fixed | `:29` 残句收正 =「行族卡界让位（升底让位 ∥ 1px 描边 + 圆角 6px——随 D37 收正）」；`:247` =「卡界（`.settings-row` · `:141-157`）⇒ 1px 描边 + 圆角 6px（**VSC 实形**——用户 2026-10-02 10:27 裁定…）」；`:248` mix 基色收正 =「`color-mix(in srgb, var(--accent) 14%, var(--bg))`（…卡底让位后 = `--bg`）」——行底两说相抵消解（「升底」仅存 dated 记录面，合规）。 |
| 2 | 2 | UI.md:633 ∥ PROJECT.md:1510 | Fixed | 「不可用原因句豁免 = `[data-unavailable-reason]` 档保 `white-space: normal`」；机检腿 ② 同拍 +「置位 = `thincoder-desktop/renderer/views/settings-sections.mjs:83-84`」——坐标 spot-check 属实。 |
| 3 | 3 | PROJECT.md:111 ∥ :1509 ∥ :1595 ∥ UI.md:638 | Fixed | 「序恒定 = 现盘序保持（修改 ∥ ✕ ∥ 校验 ∥ 移除名——VSC 对位 = 前两件同序，`…settings-providers.js:183-186`）」；T-DSK58 ① 与机检腿 ① 同序；现盘序源码 spot-check 属实。 |
| 4 | 4 | PROJECT.md:1512 ∥ :1595 ∥ :1667 | Fixed | §6.1 清单含「全七段行族零参差折行」；T-DSK58 ④「亮 ∥ 暗两模式」+ ⑤「全七段行族零参差折行」在场；§7 批注 =「走查六面——清单 = §6.1 本批块」——两处逐项齐。 |
| 5 | 5 | PROJECT.md:1511 ∥ :1324 ∥ UI.md:643 | Fixed | 「⑤ 卡界源扫（`.settings-row` = `1px solid var(--line)` 描边 + 圆角 `6px` 在位——用户 2026-10-02 10:27 直裁形落）」；批内件行 6 =「≈250 行 · 五腿——腿集 = §6.1 本批块（修复轮：四 ⇒ 五——+卡界腿）」；UI.md:643 五腿同拍。 |
| 6 | 6 | UI.md:259-260 | Fixed | 负向锁 `--line` 值列 =「`#input-row` / `.plan-card` / `.settings-row`（设置面行族卡界——D37 收正例外，1px `--line` 在位）」；真机腿 =「静息四边 `rgba(0, 0, 0, 0)`（**设置面行族卡界例外**——…1px `--line` 在位 ∥ 底填充让位…）」。 |
| 7 | 7 | requirements/PROJECT.md:169 ∥ :182 | Fixed | D24 行 =「【2026-10-02 补】设置面行族卡界让位（…1px 描边 + 圆角 6px + 卡底升底让位；仅设置面行族一处例外…）设计 KD-66」；D37 行尾 =「实现形 = 批 `…settings-layout.md`（设计 KD-66 已落）」——「实现形待设计」退场。 |
| 8 | 8 | PROJECT.md:1323 | Fixed | 零改面 =「`mount-settings*.mjs` **七档**（`mount-settings.mjs` ∥ `-reads` ∥ `-exits` ∥ `-segments` ∥ `-segments-{models,providers,agent}`）」。 |
| 9 | 9 | PROJECT.md:1814 | Fixed | DH ③ =「**零改**限定对象 = 值面照搬 VSC（…）；**相对现盘 = 新增四规则**（现盘复选无形——`thincoder-desktop/renderer/settings.css:213` 仅 `align-self`）」——坐标 spot-check 属实。 |

新发现（本轮）：无。
计数：🔴 0 · 🟡 0 · 🔵 0（轮 1 计 1🔴/6🟡/2🔵 全数落修核讫）。
VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-10-02 10:59 全自动窗口 ✓）

**时点**：2026-10-02 11:32。

**三条件齐备 ✓**：① **评审 pass**——复评（核验轮 2）**0 新发现**（轮 1 的 1🔴/6🟡/2🔵 全数落修核讫；§3 轮次 2 在册）；② **修复轮落地并逐条核验**——修复轮 1（#19）1–6 ∥ 8 ∥ 9 落修，父侧逐处读回 **8/8** ✓（`UI.md:29` 卡界让位句 ∥ D24 注 `:248/:259/:260` ∥ KD-66 ② 现盘序 ∥ 零改面七档 ∥ 机检五腿 `:1509-1511` ∥ T-DSK58 六面 ∥ DH ③）；③ **token 已签发** ✓（运行态——不入档）。

**发现处置收敛**（轮 1：1🔴/6🟡/2🔵；轮 2 = 无新发现）：#1–#9 **全部 Fixed**（收敛核读证据 = 复评轮 2 报告 ∥ 父侧 8/8 读回；需求侧第 7 号 = 父侧笔·已落）。

**代签后**：实施轮派发（eng-coder · initial · 文件集 = 本档 §2 表；任务书 = 本档 §2）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（五档落讫 + fix round 1 clear + fix round 2 落讫（①④ 补则 ∥ 腿②扩 ∥ >300 在册标注——复跑 9/9 绿〔先红后绿〕）；审计 1 轮 clean ∥ 代码评审 1 轮 pass——终态 clean）

**一、交付摘要（五件 · 逐件落值）**

- **新** `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（**182 行**）：渠道族先拆后改出档——段体 `providersBody`（`:167-182`）+ 行族（`keyFaceNode` ∥ `subLineWord`（`:50-53` 串形缺段不落空分隔符）∥ `subRowNode`（`:59-73` 串 + 不可用标 + 代理）∥ `reasonNode`（`:76-82` 第三行条件）∥ `proxyNode` ∥ `keyControls` ∥ `providerRowNode`（`:124-153` 两行卡）∥ `verifyNode` ∥ `probeFace`）。主行 = 名 + 钥面 + 当前标 + 动作簇（修改 ∥ ✕ ∥ 校验 ∥ 移除名——现盘序、四件全保留）；编辑态 = 主行换形 [名 + 钥面 + 输入（伸缩）+ 存 ∥ 消]，代理 ∥ 移除 ∥ 校验暂撤（`:146` 门 + 编辑态抽代理）。
- **改** `thincoder-desktop/renderer/views/settings-sections.mjs`（**309 ⇒ 164** · 回线 ✓）：渠道族出档；re-export 一件（`:32`）——消费面 `views/settings.mjs:25` 零改（批内件腿①E 断言 = 同一函数对象）。
- **改** `thincoder-desktop/renderer/views/settings-sections-mcp.mjs`（**183 ⇒ 185**）：摘要中段省略标记 `data-mcp-summary`（`:50`）+ 工具行竖排注（`:62`）。
- **改** `thincoder-desktop/renderer/settings.css`（**268 ⇒ 299** ≤300 ✓）：四则（`:147` nowrap ∥ `:157-158` 省略四件 ∥ `:171` 簇内续钮零化）+ 渠道卡（`:160-164` 纵排 ∥ 4px 间距 ∥ 副行代理锚定）+ 第三行（`:169` `--accent` + 折行豁免）+ 卡界（`:151-152` 1px `--line` + 圆角 6px；升底让位）+ 活动/当前行 mix `--bg`（`:154-155`）+ 拨杆形（`:223-245`）+ MCP 展开面（`:172-175` 竖排三段 + 缩进 24px）。零新变量 ∥ 零 `@media`。
- **新** `docs/batches/2026-10-02-desktop-settings-layout.test.mjs`（**206 行** · 五腿九用例）：腿①A–E（两行结构 ∥ 动作簇四件序 ∥ 串形缺段 ∥ 第三行条件 + hostBusy 分档 ∥ 编辑态 + 三撤 ∥ re-export 零改）+ 腿②–⑤（CSS 源扫）。
- **零触**：`views/settings.mjs` ∥ `settings-controls.mjs` ∥ `settings-agent.mjs` ∥ `settings-sections-{env,models,tools}.mjs` ∥ `mount-settings*` 七档 ∥ `i18n-settings.mjs`（零新词键）∥ `theme.css`（零新变量）∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC。

**二、行数实读（父侧回填用；口径 = 内容行数，文末换行不计）**

| 档 | 改前 | 实读（改后） | 预期（§2.7 ∕ §4.2） | 判定 |
|---|---|---|---|---|
| `…/views/settings-sections.mjs` | 309 | **164** | ≈185 | ✓ 回线（≤300） |
| `…/views/settings-sections-providers.mjs`（新） | — | **182** | ≈165 | 注（+17 = 头注 + 两行卡三件拆分；离硬限余量足） |
| `…/renderer/settings.css` | 268 | **299** | ≈292 | ✓（≤300 目标达成——余量 1 行） |
| `…/views/settings-sections-mcp.mjs` | 183 | **185** | ≈186 | ✓ |
| `docs/batches/…settings-layout.test.mjs`（新） | — | **206** | ≈250 | ✓ |

**三、验证读数**

- **机检（批内件直跑 · 自 `thincoder/` 根）**：`node --test docs/batches/2026-10-02-desktop-settings-layout.test.mjs` ⇒ **9/9 绿**（tests 9 ∥ pass 9 ∥ fail 0；~123ms）——五腿全绿（腿①A–E + ②–⑤）。
- **全树冒烟（`settings.mjs` 分派面 · 平 node 直装）**：`settingsTree(settingsModel(state), {})` 构建零异常；渠道行 = `settings-row-main` + `settings-row-sub` 在场 ∥ hostBusy 行副行 = [标, 代理]（零串节点）∥ 第三行零节点。
- **静态**：三 JS 档 `node --check` 全过（编辑面同拍）。
- **仓套件** = 父侧收口唯一跑点（本舱零跑——空清单既定态）。

**四、决策透明表**

| # | 决策 | 依据 ∥ 代价 |
|---|---|---|
| 1 | 活动/当前行删旧 `border-color: transparent`（保留 `--line` 卡界） | KD-66 ⑤ 族级陈述无状态限定 + UI.md:260「设置面行族卡界例外：1px `--line` 在位」；反读 = UI.md:248 只涉 mix 基色。代价 = 一行回改面（若父裁相反） |
| 2 | 编辑态校验钮一并暂撤（旧码编辑态保留校验） | UI.md:638 ∥ KD-66 ② ∥ §2.4 三源同文；代价 = 编辑态停校验（取消即回） |
| 3 | 编辑态副行保留（仅抽代理件） | 撤单未列副行 ∥「既有行为零改」；代价 = 编辑态仍见 `模型 · URL`（信息保留） |
| 4 | 「摘要省略标记」落为 `data-mcp-summary` + `flex: 1 1 auto` | 设计仅言「标记」未点名；对位 VSC 摘要 `flex:1`；代价 = 新属性一枚（CSS 面消费） |
| 5 | `.settings-row-name` 与 `.settings-row-value` 同取省略四件 | T-DSK58 ② 长名省略不折（name 须可缩）；代价 = 超设计文本「泛用面 = `.settings-row-value`」一点（评审 🔵③ 在册，保留） |
| 6 | 第三行原因句未加缩进 | 设计未点名（VSC `.prov-hint` 15px 未入点名项）；代价 = 与 VSC 一处观感差（归 T-DSK58 面） |
| 7 | fix round 1：副行代理件 `margin-left: auto`（无串态行尾锚定） | 评审 🔵② 落修——UI.md:637「行尾代理开关」全态成立；一行规则 + 批内件一条断言（`:168`）；代价 = 0 |

**五、披露/上抛（非阻塞）**

① **设计档观察两件**（本舱不改设计档——授权面外；供父侧回填轮处置）：**ⓐ** T-DSK58 ③（`PROJECT.md:1595`）撤单括注 =「代理 ∥ 移除暂撤」，UI.md:638 =「代理 ∥ 移除 ∥ **校验**暂撤」——实现从 UI.md（形态单源）+ 批内件腿①D；建议回填轮将 T-DSK58③ 收齐三件（一字级）。**ⓑ** §6.1 腿②豁免锚坐标（`PROJECT.md:1510`「置位 = `views/settings-sections.mjs:83-84`」）随拆档失效——现行置位 = `views/settings-sections-providers.mjs:81`。
② **零改面指针未随动（跨档）**：`views/settings.mjs:153` ∥ `mount-settings-segments-providers.mjs:10`（两处指 `settings-sections.mjs` `keyControls`——现住 `settings-sections-providers.mjs:99`）∥ `i18n-settings.mjs:17-20`（消费面「9 档」枚举未含新档——`settings.providers.*` 词键已核住该档）∥ `i18n-views.mjs:31`（存量）。改指针 ∥ 保零改登记 = 父侧裁。
③ **装机副本滞后（真机面前提）**：`dist-r4/…/app.asar/renderer/settings.css:147` 仍为改前形（`flex-wrap: wrap;`）⇒ T-DSK58 不得以现存 asar 为据，须源码 ∥ 重打包件。
④ 批内件 206 行 vs 估 ≈250（−18%）——成因 = 九用例断言密度；如需对账，本节即实测值。
⑤ **评审 🟡①（非阻塞 · 设计面二择）**：`.settings-field-row` nowrap（CSS `:202`）与省略面之间的覆盖缺口——agent 只读行三件文本（`settings-agent.mjs:158-160`）无收束出口（CJK 压条 ∥ 长串横向溢出）；二择（补缩省略四件 ∥ 折行豁免）归设计面小补 + T-DSK58 走查点名。
⑥ **评审 🔵④（登记）**：MCP 展开面词行（`settings-sections-mcp.mjs:87`）随通用省略四件变为单行截断；若失败串需全显 ⇒ 豁免面补 `[data-mcp-detail]`（设计面裁）。

**六、审计与代码评审轮次与终态（内部）**

- **explore 对置审计 1 轮 = clean**：四类偏差（未足量 ∥ 静默简化 ∥ 设计漂移 ∥ 写域外）全零（18 项核对逐条 clean）；两条设计档观察（= 本段五①）转记录面。
- **advisor 代码评审 1 轮 = pass**（🔴0 ∥ 🟡1 ∥ 🔵4——无 must-fix）：🟡① 字段行覆盖缺口（五⑤）∥ 🔵② 副行代理行尾锚定——**已落修**（四#7）∥ 🔵③ name 省略超集（四#5 在册，保留）∥ 🔵④ MCP 词行截断（五⑥）∥ 🔵⑤ §5 记录面——**已以本段落定**。
- **fix round = 1**（评审后一处修复：CSS `:164` 一行 + 批内件 `:168` 一条断言；复跑 **9/9 绿**）——**终态 = clean**。
- 复跑口径：仓根 `node --test docs/batches/2026-10-02-desktop-settings-layout.test.mjs` ⇒ 9/9 绿；真机 T-DSK58 归父侧/用户面（本舱零真机面 = `unverified`）。

**七、fix round 2 —— ①④ 补则 + 腿②扫描面扩 + >300 在册标注（2026-10-02 · eng-coder）**

- **承**：§2.14（①④ 定形 + 判据面）∥ §6.1 两裁处置——定点修复轮（三面钉死）。**未触**：行族通则本体 ∥ 折叠面摘要行 ∥ 其它档 ∥ 设计档 ∥ §4.1/§4.2 行数回填（候另轮）。
- **落码（逐处读回）**：
  - ① 只读行收束 —— `thincoder-desktop/renderer/settings.css:255` `.settings-field-readonly { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }` ∥ `:256` `.settings-readonly-hint { flex: 0 0 auto; font-size: var(--fs); }`（四件沿行族同四件 ∥ 提示面定尺不缩；原合色块 `:250-253` 零动）。
  - ④ MCP 展开面全显豁免 —— `:178` `.settings-mcp-detail .settings-row-value { white-space: normal; overflow-wrap: anywhere; }`（独立成则；折叠面摘要行住 `.settings-mcp-detail` 域外——兄弟结构 ⇒「摘要行零动」结构性成立）。
  - >300 在册标注 —— `:10` 头注在册句（落码后实读 **304**；拆 = 299 + 头注 1 + ④ 2 + ① 2；拆分预案 = 控件族出档评估（`renderer/settings-controls.css`）· 消解窗口 = 本档下次结构性触碰的批）。
- **批内件腿②扩**：`docs/batches/2026-10-02-desktop-settings-layout.test.mjs:157`（题改）+ `:172-182`（断言 +9）——**先红后绿**：先红 = 8/9（腿② 败「只读值面规则在盘（补则①）」· ERR_ASSERTION · exit 1）⇒ 落码 ⇒ 后绿 = **9/9**（exit 0）。
- **读数**：`settings.css` **299 ⇒ 304**（内容行数口径；≤500 硬限内——父裁在册）∥ 批内件 **206 ⇒ 219 行 · 用例 9 ⇒ 9**（断言面 +9）∥ `node --check`（批内件）过。
- **决策透明表**：

| # | 决策 | 依据 ∥ 代价 |
|---|---|---|
| 1 | ① 四件独立成则（原合色块保留） | 设计「补缩省略四件」；最小触及。代价 = 0 |
| 2 | `flex: 0 0 auto` 并入既有 `.settings-readonly-hint` 行 | 同实体单点；代价 = 0 |
| 3 | ④ 复合选择器单行规则（逐字照定形） | §2.14 落形逐字；特异性 (0,2,0) 盖通则 (0,1,0)。代价 = 0 |
| 4 | 头注在册句给数 + 预案 + 窗口 | 父裁在册形（沿 `app.mjs` 319 先例）；代价 = 回填轮按实读复核字面 |
| 5 | 提示面断言用全档正则（非 `blockOf`） | `blockOf` 首命中落合色块（无 `flex`）⇒ 正则跳过后落独立规则；代价 = 断言面略宽（不锁「同一规则」——已核无现实误绿路径，保留） |

- **审计与代码评审（内部）**：explore 对置审计 **1 轮 = clean**（四类偏差全零）∥ advisor 代码评审 **1 轮 = pass**（🔴0 ∥ 🟡1〔记录面滞后——report-only，R7e 不阻塞〕∥ 🔵2〔304 在册无动作 ∥ 可选负向锁建议保留〕）；评审后 fix round = **0**；**终态 = clean**。
- **披露（非阻塞）**：① 头注「父侧裁 2026-10-02」= 本修复轮派单所载父裁；§2.14 补记（预算观察）尚记「本席未预裁（候 coder 修复轮落码后按实读裁）」——裁定记录面归 §6 收口 ∕ 回填轮同拍（一行）；② §4.1/§4.2 行数回填（`settings.css` 299 ⇒ 304 ∥ 批内件 206 ⇒ 219）候另轮（本席零触，遵派单）。

## §6 验证与收口（父代理）

### 6.1 实施核验 + 两裁处置（2026-10-02 11:5x · 父侧）

**实施轮（#24）交付核验 ✓**：批内件**父侧亲跑 9/9 绿**（~130ms · 五腿全对）；新档全读（`settings-sections-providers.mjs` 182——两行卡 ∥ 动作簇现盘序 修改∥✕∥校验∥移除名 ∥ 第三行锚 ∥ 编辑态换形 ✓）；`settings.css` 实读（:135-259——卡界 1px `--line` + 6px ∥ 卡底零独立填充 ∥ 活动行 mix 基色 `--bg` ∥ 簇内续钮零化 ∥ 拨杆四规则 ∥ 零新变量 ∥ 零 `@media` ✓）；re-export 面（`settings-sections.mjs:32` + 头注 ✓）；桌面套件**空清单绿**（exit 0）。落值：providers **182** ∥ sections **164** ∥ mcp **185** ∥ css **299** ∥ 批内件 **206**。

**代码评审两裁**（in-child advisor 🟡1 ∥ 🔵4 · 无 must-fix）：🟡① agent 只读行三件无收束出口（`settings-agent.mjs:156-161`——两 span 无 clamp，nowrap 下有出血风险）⇒ **修**；🔵④ MCP 展开面词行/描述受通用省略截断（`settings-sections-mcp.mjs:87-88`——展开面语义 = 全显）⇒ **修**（豁免面定形归设计）。另两披露：ⓐ §7 T-DSK58③ 括注补「校验」（实现从 `UI.md:638`）⇒ 设计面收正；ⓑ §6.1 腿②豁免锚坐标 `settings-sections.mjs:83-84 ⇒ settings-sections-providers.mjs:81` ⇒ 收正。**零改面指针**（`views/settings.mjs:153` ∥ `mount-settings-segments-providers.mjs:10` ∥ `i18n-settings.mjs:17-20` ∥ `i18n-views.mjs:31`）**裁定 = 保零改**（re-export 使被指模块仍为有效消费面——指针不假；随四档下次触碰核，台账条件轨登记）。**装机副本（dist-r4）滞后** ⇒ **T-DSK58 走查须以源码 ∥ 重打包件**（在册）。

**修复链（在飞）**：设计面补轮（四号：①④ 两裁 + ⓐⓑ）→ coder 修复轮（token 复用）→ 行数回填轮 → §6 收口候 T-DSK58。

### 6.2 回填轮核讫 + 末笔 + 收口准备（2026-10-02 12:2x · 父侧）

**回填轮（#28）核讫 ✓**：§4.1 四行实读齐平（`:279` **164** ∥ `:283` **185** ∥ `:285` **已落 · 182** ∥ `:319` **304**——在册越线不拆 + 拆分预案在案）∥ §4.2 本批块翻「实读（实施落盘）」（`:1316`–`:1326`：309 ⇒ 164 ∥ 无 ⇒ 182 ∥ 268 ⇒ 304 ∥ 183 ⇒ 185 ∥ 批内件 **已建成 · 219 行 · 五腿 · 9 用例**）∥ 越层段收记（sections 除名兑现 ∥ css 新入册——净十五）∥ 门 **±0 零新增**（锚 123 ∥ 行宽 121 ∥ 行数面 11 ⇒ 7——本批 4 条销项）。

**父侧末笔（机械标面 · 可 revert）**：菜单 ∥ 设置两批「批内件（拟新增）」陈标族六处 + `docs/desktop/design/UI.md` 一处翻「已建成」（两档变更记录各行在册——`PROJECT.md:2296` ∥ `UI.md:941`）。

**开放项**：① 文档面全清 ✓；② **T-DSK58 真机走查**（六面——用户面；**须以源码 ∥ 重打包件**——dist-r4 副本滞后在册）；③ 收口结算（候 ②）。**阶段态**：设计 ✓ 评审 ✓（双轮）批准 ✓（代签）实施 ✓（converged）补轮 ✓（#26–#28 核讫）——候 ②。

### 6.3 走查收束 + 收口结算（2026-10-02 17:0x · 父侧）

**走查收束**：用户 16:59 令——**走查期发现分流**：渠道段校验反馈出视口（本批设置面域）⇒ **轻通道轮六 笔一**（就地化——已落；批 `docs/batches/2026-10-02-light-round-6.md`）；未再报本批其余 ⇒ **通过**。

**结算**：阶段态全绿（设计 ✓（KD-66）∥ 评审 ✓（双轮）∥ 批准 ✓（代签）∥ 实施 ✓（converged ∥ 补轮 #26–#28 核讫）∥ 走查 ✓ 收束）⇒ **收口（2026-10-02）**——记录冻结；台账 **#812 核销**。
