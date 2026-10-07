# 2026-10-07 · console-layout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 07:24–07:29 走查控制台三条（表格视口高壳+页脚计数 ∥ 主内容左对齐 ∥ Provider 弹窗模型列表表格化）+ 07:29「就这些」——需求档 §2:20 + AC-20。。
> 台账 = #985（server · 归批）。前情 = docs/batches/2026-10-06-console-list-style.md §6（已收口 2026-10-07）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-07 07:2x–07:3x）**

**走查源**：用户 07:24 起连续三条 + 07:29「就这些」——①「表格应该适应页面高度，页头页脚固定，表行滚动」（补「页脚至少要有行计数」+「布局表不算」）∥ ②「页面既然导航栏在左侧，页面主内容区也应该左对齐」∥ ③「provider 弹窗里的模型列表应该用表格，风格也应该跟主页面一致」。

**定形（与用户逐条对齐）**：

- ① 数据表五页（成员 ∥ Provider ∥ 服务模型 ∥ 审计 ∥ 用量明细）= 视口高壳：页头（页题/工具条）固定 ∥ 表格区吃满剩余高度（表头吸附 · 行区滚动）∥ 底部框固定；**页脚 = 行计数**（纯前端派生，零新端点）；矮视口回退整页滚；布局/信息表与 key 清单不适用。
- ② 撤 `main` auto 居中（内容左靠；max-width 沿用——拉满宽/改宽值未提，不加戏）。
- ③ Provider 双弹窗（详情勾选 + 添加预设信息段）的模型清单 ⇒ 表格形，风格随全站表格族。
- 后续项（用户「至少」口径）：分页/筛选类 = 不入本条，需要时另立。

**批边界**：三件 = 本批全部；不改列/数据语义 ∥ 纯前端（服务端零触）∥ 零依赖/零构建不变。

**需求对账**：需求档 `docs/server/requirements/PROJECT.md` §2:20 + AC-20 已增（父侧笔 · 可 revert）；计数行收正（17 ⇒ 20——18/19 两步漏更）；台账 #985 已立行。

**§1 补记（主 agent · 2026-10-07 07:33——走查补条）**：④ 用户 07:32「用户弹窗的key列表也要用表格」——指**成员详情弹窗**的 key 清单（全站唯一含 key 清单的弹窗；`views-admin.mjs:105-113`：`ul.key-list > li.key-item`——每项 = 密钥 hint ∥ 最后使用 ∥ 本窗用量 ∥ 吊销钮；空态 `p.hint`）⇒ 表格形（列 = 密钥 ∥ 最后使用 ∥ 本窗用量 ∥ 操作；风格随全站表格族）。需求档 §2:20 ④ + AC-20 已同步（父侧笔 · 可 revert）。设计棒 #111 已中途同步（非阻塞）。

**§1 补记（主 agent · 2026-10-07 07:4x——第五页裁定）**：设计棒 #111 上抛「『用量明细』第五页归属不明」（`#/me/usage` 与 `#/admin/usage` 各含同名明细段；后者前置报表卡无界）。裁定 = **仅 `#/me/usage`**（贴壳：提示条+摘要卡有界 + 明细表）；**`#/admin/usage` = 看板页不入壳**（报表区无界，与有界壳不相容；如需并入另轮）。需求档 §2:20 同拍（父侧笔 · 可 revert）。

**§1 授权（主 agent · 2026-10-07 07:46）**：用户「自动跑完吧」= 本批全链授权——**设计评审点火（代点火）∥ §4 代签 ∥ 修正轮·实施轮派发 ∥ 收口核销提交推送**；排空模式（跑到本批收口）。

**父侧自缚四条**（本仓惯例——先例同形）：① 代签仅当**三条件齐备**（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）+ §4 写明依据（评审 id / 核验结论 / 发现处置表）；② 需要**新范围**或**用户口径裁决** ⇒ 停下上抛；③ **破坏性/不可逆** ⇒ 先停；④ **验证不过即停**（硬门即停）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（WEBUI.md §2.6 机制全文 + §6 AC-20 两行 + §5 实读回填；五页钉表（#/me/usage）；随正五件在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-07）**

**本批条目（覆盖——需求 §2:20 四条）**：

| # | 条目（需求） | 设计落点 |
|---|---|---|
| ① | 数据表页视口高壳——页头（页题/工具条）固定 ∥ 表格区吃满剩余高度（表头吸附 · 行区滚动）∥ 底部框固定；矮视口回退整页滚 | `WEBUI.md` §2.6①② |
| ② | 页脚行计数（「共 N 项」随内容与刷新实时对；纯前端派生，零新端点） | §2.6③ |
| ③ | 主内容区左对齐（撤 `main` 居中；max-width 沿用） | §2.6④ |
| ④ | 弹窗内列表表格化（Provider 双弹窗模型清单〔详情勾选 ∥ 添加预设信息段〕+ 成员详情弹窗 key 清单——用户 07:32 补条） | §2.6⑤ |

**套用面（钉表——父侧 07:4x 裁定）**：成员 `#/admin/members` ∥ Provider `#/admin/providers` ∥ 服务模型 `#/admin/models` ∥ 审计 `#/admin/audit` ∥ 用量明细 `#/me/usage`（我的·用量页）。
**排除面（在册）**：`#/admin/usage` 看板页（报表区无界——与有界壳不相容）∥ 布局/信息表（系统页四表 ∥ 账户页表 ∥ 摘要表）∥ key 清单（页级 `#/me/keys` ul）。

**设计档落点**：`WEBUI.md`——§2（壳指针句）∥ §2.2（键族登记 +5 键）∥ §2.4②④（表格形指针）∥ §2.5（三处随正：`.model-picks` 退役 ∥ 表单容器行 ∥ 接续标注）∥ **§2.6（新增——机制全文）** ∥ §5（预算实读回填 + 本批增量）∥ §6（AC-20 两行）∥ §7（KD-SV-37）∥ §8（边界）∥ 变更记录。

**机制设计（全文 = `WEBUI.md` §2.6；实现要点）**：
- 三段壳 = `.page-head`（页题/工具条/过滤——固定）∥ `.page-area`（表卡——吃剩高）∥ `.page-foot`（行计数——固定）；`ctx.dataShell(mount, { head, area })` 构建 → 返回 `{ setCount }`。
- `body.data-shell` 由 `route()` 按 `SHELL_PAGES`（五路径）切换（登录/登出径清除）；高度链 = §2.6② 声明表（`100dvh` flex 链 → `.table-slot` → `.table-wrap` 滚区）；`thead th` 吸附（`position: sticky; top: 0; z-index: 1`——选择器限 `main`——弹窗内表不吸附）。
- 行计数 = 渲染行数（每次取数渲染后 `setCount(行数)`；空/错 = 0；初值空）；消费键 = `common.rowCount`。
- 回退 = `@media (max-width: 760px), (max-height: 600px)` ⇒ 撤高度链（整页滚；吸附随壳失效）。
- 弹窗表格形 = 单列「模型」（勾选表——行 = `label`（勾选 + 模型名））∥ 单列「模型」（预设模型清单——`code` 行）∥ 四列（成员 key：密钥 ∥ 最后使用 ∥ 近 30 天 ∥ 操作）。

**受影响文件与测试面（当前行数 = 实读 2026-10-07；增量为设计估）**：

| # | 档 | 改动 | 增量 |
|---|---|---|---|
| 1 | `public/app.mjs`（300） | `dataShell` 助手（`page-head`/`page-area`/`page-foot` + `setCount`）∥ `SHELL_PAGES`（五路径）∥ `route()` 切换 `body.data-shell`（登录/登出径清除）∥ `viewCtx()` +`dataShell` | +≈16 ⇒ ≈316（越 300 软线——拆分预案在册、本批未触发） |
| 2 | `public/style.css`（198） | 高度链声明表（§2.6②）∥ `.table-slot` ∥ `thead th` 吸附 ∥ `.page-foot` ∥ 回退媒体查询 ∥ `main` 撤 auto ∥ `.model-picks` 规则删净 | +≈24 ⇒ ≈222 |
| 3 | `public/views-admin.mjs`（169） | 成员页壳化（head = h2 ∥ 秘密区 ∥ 新建行；卡 = 表槽；`reload` 后 `setCount`）∥ 弹窗查看态 key 表（四列；空态 `.hint` 不变量） | +≈20 ⇒ ≈189 |
| 4 | `public/views-providers.mjs`（56） | 壳化（head = 工具条；卡 = 表槽；`loadList` 后 `setCount`） | +≈8 ⇒ ≈64 |
| 5 | `public/views-models.mjs`（194） | 壳化（head = 页题；卡 = 表槽；`load` 后 `setCount`） | +≈8 ⇒ ≈202 |
| 6 | `public/views-audit.mjs`（88） | 壳化（head = 页题；卡 = [h3 ∥ 过滤行 ∥ 表槽]；`loadEvents` 后 `setCount`） | +≈8 ⇒ ≈96 |
| 7 | `public/views-me.mjs`（117） | 我的用量页壳化（head = 页题 ∥ 提示条 ∥ 摘要卡；卡 = [h3 ∥ 端点过滤 ∥ 表槽]；`loadUsage` 后 `setCount`）——key ∥ 账户两页零动 | +≈8 ⇒ ≈125 |
| 8 | `public/views-providers-modals.mjs`（272） | `renderPicks` 表格形（单列——`label`（勾选 + 模型名）行）∥ 添加弹窗预设信息段模型清单表（单列——`code` 行）∥ `.model-picks` 字面删净 | +≈8 ⇒ ≈280 |
| 9 | `public/i18n-zh.mjs` ∥ `i18n-en.mjs`（328 ∥ 324） | +5 键（`common.rowCount` ∥ `admin.members.colKey` ∥ `admin.members.colLastUsed` ∥ `admin.members.colWindowTokens` ∥ `admin.members.windowTokensCell`）——两表逐键同步 ∥ en 零 CJK | +≈6/表 ⇒ ≈334 ∥ ≈330 |
| 10 | `thincoder-server/package.json`（26） | `prepublishOnly` 清单添本批件（十七 ⇒ 十八——以实施盘面为准） | 行数不变 |
| 11 | 批内件 `docs/batches/2026-10-07-console-layout.test.mjs`（新——实施轮建） | 腿 A–G（见「验收对照」） | —— |
| 12 | 随正三件（父侧跨批写门禁） | `-console-provider-redo` ∥ `-console-modals` ∥ `-models-config-ui`：stub ctx 补 `dataShell`（语义近似——各 1–4 行；头注注明）——旧件渲染面 = provider/model 两页（成员/审计/我的用量三页旧件零渲染） | —— |
| 13 | 随正两件（门禁计数——父侧） | `-server-auto-update.test.mjs:480`（17 ⇒ 18；`:9`/`:439` 注同拍）∥ `-console-list-style.test.mjs:231`（17 ⇒ 18；`:20` 注同拍） | —— |

**验收对照（AC-20 ①–④ ⇒ 批内件腿）**：
- 腿 A（壳机制源扫）：`app.mjs`——`dataShell` 三件构建 + `common.rowCount` 引用 ∥ `SHELL_PAGES` 五路径逐条钉表 ∥ `route()` 切换 `data-shell`。
- 腿 B（CSS 声明扫描）：高度链声明表逐条 ∥ `position: sticky` + `top: 0` ∥ 回退媒体查询 ∥ `main` margin 无 `auto` ∥ `.model-picks` 零残留（规则 + 字面两向）。
- 腿 C（五页壳行为——stub ctx）：逐页渲染 N 行 ⇒ `setCount` 收 N；空/错 ⇒ 0；`head`/`area` 传参形状在册。
- 腿 D（弹窗表格形——DOM 桩）：详情勾选表（表头「模型」∥ 行 = `label`（勾选 + 模型名））∥ 预设模型表（「模型」+ `code` 行）∥ 成员 key 表（四列头 ∥ 吊销钮行内 ∥ 空态 `noKeys` 不变量）。
- 腿 E（左对齐）：`main` 规则 `max-width: 1100px` 在 ∥ margin 无 `auto`。
- 腿 F（i18n）：5 键两表在册（非空 ∥ 占位符一致 ∥ en 零 CJK）∥ `t` 引用闭合。
- 腿 G（门禁）：`prepublishOnly` 含本批件 + 清单在盘（件数以实施盘面为准）。
- 附加：AC-19 canon 不破（零新 `:root` 变量 ∥ 零新悬停规则 ∥ 内距 ∈ 刻度 ∪ {0, auto} ∪ 布局组 ∥ 类名双向闭合）；旧件复跑 = 父侧门禁链（本侧不跑仓套件）。

**关键决策**：KD-SV-37（全文 = `WEBUI.md` §7）。细点：① 五页钉表（第五页 = `#/me/usage`）∥ ② 壳机制落 `app.mjs` + ctx 注入（沿 `table`/`usageTable` 先例——零新档）∥ ③ 行计数 = 渲染行数派生 ∥ ④ 回退阈值 = ≤760px 宽 ∥ ≤600px 高 ∥ ⑤ 勾选表取单列 `label` 形（交互保持 + 旧件断言零随正）；两列形被否。

**上抛/披露**：
1. `app.mjs` 300 ⇒ ≈316——越 300 软线加深（拆分预案在册：健康轮询迁 `health.mjs`——本批未触发；建议独立结构轮排期）。
2. i18n 双表 328 ∥ 324——越 300 软线（R25 在册——拆表独立结构轮）。
3. 随正面（父侧）：stub 三件 + 门禁计数两件（表 12/13）；本批零新档（档目 19 ∥ 20 不变）。
4. 裁定回执：第五页钉 `#/me/usage`（父侧 07:4x 裁定；需求档已同拍）；`#/admin/usage` 看板页排除在册。
5. 勾选表形 = 单列 `label`（勾选 + 模型名）——理由 = 交互零改（点题名同切换）+ `-console-provider-redo` 旧件断言零随正（`label` 直父 ∥ `children[1]` = 模型名）；两列形被否（KD-SV-37 在册）。
6. 列头文案「近 30 天」取既有窗口口径（`me.keys.windowTokens` 同族）——批档 §1 补记措辞「本窗用量」为同义缩写；如需逐字另裁。

**设计自检**：行宽——新增散行 ≤300（表行沿档内既有形——与邻行同规）∥ 锚/计数纪律：D3——五页 ∥ 五路径 ∥ 5 键 ∥ 随正五件（3+2）计数与列表同拍；D4——指针 = `WEBUI.md` §2.6 ∥ §6 ∥ §7 ∥ §5（无相对指针）∥ 四轴说明：套用面（五页钉表）∥ 不适用面（看板页 ∥ 布局信息表 ∥ 页级 key 清单）∥ 回退机制（媒体查询——撤链整页滚）∥ 零死类（`.model-picks` 删净）。

**§2 补正（键数收正 5 ⇒ 6 · 2026-10-07 · eng-designer · append-only——原行零改）**：

本批 i18n 新增键数收正：**5 ⇒ 6**；补登一键 = **`admin.members.colActions`**（「操作」表头——成员 key 表四列最右列表头 ∥ 吊销钮行内）。§2 内键数/键单处（前文「5 键」系 #113 收正前口径）一律以本段为准：

- ① `:50` 设计档落点行「§2.2（键族登记 +5 键）」⇒ **+6 键**。
- ② `:71` 受影响文件表 #9 行键单五键 ⇒ **六键**（补 `admin.members.colActions`）；两表逐键同步与行差列（+≈6/表 ⇒ ≈334 ∥ ≈330）零改——已与 6 键自洽。
- ③ `:83` 腿 F「5 键」⇒ **6 键**两表在册（非空 ∥ 占位符一致 ∥ en 零 CJK 不变）。
- ④ `:97` 自检 D3「5 键」⇒ **6 键**。

依据 = 设计档 `WEBUI.md` §2.2 `:73`（6 键登记——含 `admin.members.colActions`）∥ §5 `:400`/`:401`（+6 键 ∥ zh 328 ⇒ ≈334 ∥ en 324 ⇒ ≈330）——fix 轮 #113 收正。零其他改动（§2 既有行 ∥ 设计档 ∥ 需求档 ∥ 产品码零触）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations（判据 8） | 🟡 | `app.mjs` 本批 实读 300 ⇒ ≈316（越 300 软线）：§5 同处既载预案触发口径「拆分预案（越线 ⇒ 启用）：健康轮询块迁独立小档 `health.mjs`（拟新增）」（WEBUI.md:381），又载「越 300 软线拆分预案在册、本批未触发」（WEBUI.md:381）——两句相抵，且未给本批不触发的理由 | 二者取一：触发在册拆分预案；或在本批行写明超线接受理由与重估时点——使触发条件与结论一致 |
| 2 | Completeness / Clarity（i18n 键族登记） | 🟡 | §2.2 登记本批新增 5 键（WEBUI.md:73），§2.6⑤ 成员 key 表为「四列 = 密钥（`code` hint） ∥ 最后使用（本地化 ∥ `neverUsed`） ∥ 近 30 天（`windowTokensCell`——既有窗口口径） ∥ 操作（吊销钮行内）」（WEBUI.md:362）——前三列表头 + 单元格 + 页脚 5 键已登记，「操作」列表头键未点名；且表体量差 +6 行（328 ⇒ ≈334 ∥ 324 ⇒ ≈330——WEBUI.md:398/399）与 5 键（先例 ≈+26 键 ⇒ +26 行——WEBUI.md:72）不平 | 点名「操作」表头的键（既有键或新登记），并把键数与行差对齐（5 键 ⇒ +5 行，或改记 6 键） |
| 3 | Document state（R1/R7a） | 🟡 | §1「现行越线在册：`app.mjs`（≈301——拆分预案 = §5） ∥ i18n 双表（312 ∥ 308——R25 独立结构轮）」（WEBUI.md:17）与 §5 的 2026-10-07 实读（300 ⇒ ≈316 ∥ 328 ⇒ ≈334 ∥ 324 ⇒ ≈330——WEBUI.md:381/398/399）相抵；本批 §5 实读回填未同步 §1 登记值 | 把 §1 越线登记三值随 §5 实读收正，或以「见 §5」指针取代数值 |
| 4 | Clarity / 可核性 | 🔵 | 「弹窗内表不吸附」的口径 =「选择器限 `main`——弹窗体自滚」（WEBUI.md:350）——成立取决于 `<dialog>` 的 DOM 挂载点在 `main` 之外；设计未钉明弹窗挂载点（壳 `ctx.dataShell(mount, { head, area })`（WEBUI.md:333）与 `main > section` 链的挂载关系同未钉明），该不变量目前仅浏览器收口轮可达 | 在 §2.6 写明弹窗挂载点与壳挂载点两条前提，或将吸附选择器的适用面收窄到壳滚区，使「弹窗内表不吸附」可核 |

**VERDICT: pass**
计数：🔴 0 ∥ 🟡 3 ∥ 🔵 1（共 4 条）

## §4 用户批准（主 agent）

**§4 用户批准（主 agent——父侧代签）**

**2026-10-07 07:5x · 父侧代签**（用户 07:46「自动跑完吧」全链授权——授权块 = §1 · 自缚四条在册）✓

**三条件核验**：① **评审 pass**（轮 1 · 🔴 0 ∥ 🟡 3 ∥ 🔵 1——四条全部处置：#113 设计档四处点修（读回验证——旧串 0 命中）∥ #114 批档 §2 计数随正（append-only 在档））；② **修正轮已落地并逐条核验**（#113/#114 回执 + 实读核讫）；③ **token 已签发**（值不落档——运行时凭证）。

**批准范围** = 本批全量：功能点 20 四件（① 五页视口高壳 + ② 页脚行计数 ∥ ③ 左对齐 ∥ ④ 弹窗内列表表格化三处）——实施面 = 批档 §2 任务表（1–11 行 + 批内件新档）；随正五件（stub ctx 三 + 门禁计数二）= 父侧收口面。**依据**：评审 #112（pass）∥ fix 轮 #113/#114 回执 ∥ 设计档 `WEBUI.md` §2.6/§6/§7。

## §5 实施记录（eng-coder）
**状态行**：实施完成（四件全实现 ∥ 批内件 8/8 绿 ∥ 审计 clean ∥ 代码评审 pass（零 must-fix））



**§5 实施记录（eng-coder · 2026-10-07）**

**交付摘要**：功能点 20 四件全实现——批档 §2 任务表 1–11 逐行落地 + 批内件新建；验收腿 A–G 全实现、8 测全绿。① 五页视口高壳（三段壳 ∥ 高度链 10 条声明 ∥ 表头吸附 ∥ 回退媒体查询）∥ ② 页脚行计数（`common.rowCount`——成功 = 渲染行数 ∥ 空/错 = 0；纯前端派生、零新端点）∥ ③ 主内容左对齐（`main` 撤 auto——`max-width: 1100px` 沿用）∥ ④ 弹窗内列表表格化三处（Provider 详情勾选表 ∥ 添加预设模型表 ∥ 成员 key 四列表）。

**逐档落点（file:line——实读 2026-10-07）**：

- `public/app.mjs`（318 行）：`dataShell` :94（行计数 :101）∥ `SHELL_PAGES` 恰五路径 :255 ∥ `route()` 切换 :274 ∥ 登录径清除 :263 ∥ `viewCtx` 注入 :239。
- `public/style.css`（215 行）：`main` 撤 auto :57 ∥ 高度链 :191-200 ∥ 回退媒体查询 :203-205 ∥ `.model-picks` 规则删净。
- `public/views-admin.mjs`（185 行）：成员页壳化（起 :21；计数 :42/:47）∥ 成员弹窗 key 四列表 :112-123。
- `public/views-providers.mjs`（61 行——:33/:37）∥ `views-models.mjs`（199 行——:77/:81）∥ `views-audit.mjs`（94 行——:44/:48）∥ `views-me.mjs`（125 行——:65/:69）：四页壳化 + `setCount` 双径接线（成功 = 行数 ∥ 空/错 = 0）。
- `public/views-providers-modals.mjs`（287 行）：`renderPicks` 单列 `label` 表 :18 ∥ `presetModelsTable` :39 ∥ `.model-picks` 字面删净。
- `public/i18n-zh.mjs`（334 行）+6 键（`common.rowCount` :16 ∥ 成员五键 :112-116）∥ `public/i18n-en.mjs`（331 行）同拍（:16 ∥ :108-112）。
- `thincoder-server/package.json`：`prepublishOnly` 添本批件（17 ⇒ 18 件——档行数不变）。
- 批内件（新）：`docs/batches/2026-10-07-console-layout.test.mjs`——腿 A–G + canon 附加（8 测）。

**决策透明表**：

| # | 决策 | 依据 | 备选与否决 |
|---|---|---|---|
| 1 | 成员 key 表单元格取「去前缀」形：最后使用 = `ctx.fmtTs`（裸本地化）/`neverUsed`；近 30 天 = `windowTokensCell`（两表 = `{tokens} tokens`）——表头承载语义 | §2.6⑤「最后使用（本地化 ∥ `neverUsed`）∥ 近 30 天（`windowTokensCell`——既有窗口口径）」+ 列头 `colLastUsed`/`colWindowTokens` 已给语义 | 复用 `me.keys.lastUsed`/`me.keys.windowTokens`（携前缀——与表头重复）；设计未逐字指定 ⇒ 如另裁，改点 = i18n 两表各 1 键 + `views-admin.mjs:121` 一处 |
| 2 | `dataShell` 住 `app.mjs`、仅经 `ctx` 注入（未导出）——批内件以源扫 + stub ctx 行为 + 收口轮浏览器实走覆盖 | KD-SV-37 ②「零新档」；`app.mjs` 顶层有装配副作用（`boot()`）不宜 node 直 import | 拆独立小档（违零新档）· 导出助手仅测试用（无消费先例） |
| 3 | `.table-slot` = 各页既有取数容器本体（`listBox`/`membersBox`/`eventsBox`/`usageBox` 直接携类）——表/空态 `replaceChildren` 后 `.table-wrap` 为槽直子 | §2.6②「表卡内 = `.table-slot`……直持 `.table-wrap`」（高度链选择器 `.table-slot > .table-wrap` 需直持） | 槽外再包一层容器（表槽非直持——高度链断） |
| 4 | 页脚 `setCount` 恒传数（成功/空/错三径）；「未取数 = 空」由构造零文案承载 | §2.6③「每次取数渲染后 `setCount(行数)`；空/错态 = 0；未取数 = 空」 | 加 `null` 清空分支（零消费点） |

**审计与代码评审轮次与终态**：

- 内部偏差审计（explore·read-only）轮 1：四类偏差（部分实现 ∥ 静默简化 ∥ 档漂移 ∥ 超清单）**零命中**；4 条 🔵 观察（3 条 = 批内件弱断言：`SHELL_PAGES` 包含式 ∥ 页脚文案桩回声 ∥ 勾选 `change` 空转）。
- **fix round 1**（批内件加固，据审计 🔵 三条）：① 腿 A 改「恰五」逐字 `deepEqual` ∥ ② 腿 C 改 `counts` 全序列 `deepEqual`（`setCount` 恰一次）+ 删桩回声断言 ∥ ③ 腿 D 勾选改「勾选 ⇒ save ⇒ PATCH `models` = 勾选集」行为断言——复跑 8/8 绿。
- 内部代码评审（advisor·code）轮 1：**pass**（🔴 0 ∥ 🟡 2〔在册债务：`app.mjs` 318 行 ∥ i18n 两表 334/331 行——R3/R25 在册、不阻断〕∥ 🔵 2〔审计页 `h2`/`h3` 同文重复 = 设计行在册；腿 D `label.children[1]` = 桩形约定〕）——**零 must-fix**。
- 终态 = **clean**（审计 1 轮 ∥ fix 1 轮 ∥ 代码评审 1 轮——无 stalled）。

**自跑读数（命令 + 结果）**：

- `node --check` × 9 个改动 JS 档（`public/`——app ∥ views-admin ∥ views-providers ∥ views-models ∥ views-audit ∥ views-me ∥ views-providers-modals ∥ i18n-zh ∥ i18n-en）：全 OK（`style.css` 非 JS；批内件由 `node --test` 实跑）。
- `node --test docs/batches/2026-10-07-console-layout.test.mjs`：**pass 8 ∥ fail 0**。
- 旧件诊断复跑（非仓套件——全门禁 = 父侧唯一执行）：`-console-provider-redo` 7 pass/1 fail ∥ `-console-modals` 5/1 ∥ `-models-config-ui` 5/2 ∥ `-console-list-style` 6/1——**失败点全部 = 任务表 12/13 行随正面**（三件 stub ctx 缺 `dataShell` ⇒ TypeError ∥ 门禁计数 17 ⇒ 18）；`-server-i18n` 6/0 ∥ `-console-completeness-2` 6/0 ∥ `-console-providers` 9/0 ∥ `-models-config` 7/0 ∥ `-server-gateway-webui-deploy` 6/0——**零计划外破坏**（无第六件）。
- canon 仿真（list-style 提取器同形复算）：类名双向闭合两向零残 ∥ 悬停恰 8 条 ∥ 内距全在刻度 ∥ `"hint error"` 计数 10 ∥ `:root` 38 不变。

**披露（上抛）**：

1. 决策 1 两处单元格文案 = 设计未逐字指定处的实现取值（`windowTokensCell` = `{tokens} tokens`）——如逐字另裁，改点见决策表。
2. 行数实读 vs 设计估（估/实读）：`app.mjs` ≈316/318 ∥ `style.css` ≈222/215 ∥ `views-admin` ≈189/185 ∥ `views-providers` ≈64/61 ∥ `views-models` ≈202/199 ∥ `views-audit` ≈96/94 ∥ `views-me` ≈125/125 ∥ `views-providers-modals` ≈280/287 ∥ zh ≈334/334 ∥ en ≈330/331——均在容差；`app.mjs`/i18n 两表越 300 软线 = 在册债务（本批不触发——设计裁定）。
3. 随正五件（任务表 12/13 行）= 父侧收口面（stub ctx ×3 + 门禁计数 ×2）——本侧零触（未动其文件）；全门禁 = 父侧唯一执行。
4. 审计页 `h2`（页头）与卡内 `h3` 同文（`audit.title`）——设计行（批档 §2 #6）在册；去重与否 = 设计面裁定（本侧不动）。

## §6 验证与收口（父代理）

**§6 核验与收口（主 agent · 2026-10-07 08:2x）**

**实施（#115）**：eng-coder initial——子内偏差审计 1 轮零命中 → fix 1 轮加固 → 子内代码评审 1 轮 pass（零 must-fix）。落点：`app.mjs` 318（`dataShell` :94 ∥ `SHELL_PAGES` 恰五路径 :255 ∥ `route()` 切换 :274 ∥ 登录径清除 :263）∥ `style.css` 215（高度链 :191-200 ∥ 回退媒体查询 :203-205 ∥ `main` 撤 auto :57）∥ 七视图壳化/弹窗表形（`views-admin` 185 ∥ `views-providers-modals` 287——`renderPicks` 单列 `label` 表 :18 ∥ `presetModelsTable` :39）∥ i18n 334/331（+6 键）∥ `package.json` 18 件。

**批内件**：`docs/batches/2026-10-07-console-layout.test.mjs`（新——腿 A–G + canon 附加）——实施棒自跑 **8/8**；父侧门禁链内复跑通过。

**父侧动作**：① **随正五件**（父侧直接执行 · 可 revert · 跨批写门禁）：stub ctx 补 `dataShell` 三件（`-console-provider-redo` ∥ `-console-modals` ∥ `-models-config-ui`——语义近似 1–4 行，行内注明「随正（2026-10-07 控制台布局收正批）」）+ 门禁计数两件（`-server-auto-update` ∥ `-console-list-style`——17 ⇒ 18，注释同拍四处/三处）——修后五件复跑 **42/42**；② 设计小修两笔（#113 四处点修 ∥ #114 §2 计数随正——评审四条全处置，在案）。

**核验读数**：`cd thincoder-server && npm run prepublishOnly` = **148/148 ∥ 0 fail ∥ exit 0**（2026-10-07 08:2x；十八件链——本批件在列）。

**披露处置**：① 单元格口径（`fmtTs`/`neverUsed` ∥ `windowTokensCell`）采纳（表头承载语义）∥ ② 行数越线在册（`app.mjs` 318 ∥ i18n 334/331——结构轮候选）∥ ③ 随正已落（见上）∥ ④ **审计页 h2/h3 同文重复**（designer §2 #6 在册）= 待用户走查裁定；另记：既有零消费者键 `col.actions`（两表在册）= 清理候选（随回填轮处置）。

**台账号**：#985 待设计 ⇒ 在途 ⇒ 待核销 ⇒ 已核销（evidence = 本 §6 + 门禁读数）。

**欠账（已入账）**：#983（回填轮——行数实读面）。
