# 2026-10-07 · 我的用量页图表化
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 22:03 指令（原话逐字见 §1.1）——控制台「我的用量」页图表化增强（参考 DeepSeek 用量页）。
> 台账 = #1055（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源（用户原话 · 逐字）

- 2026-10-07 22:03：「我也看了一下服务器，我的用量那个界面感觉单薄，我觉得需要更多的图表，你可以参考一下deepseek的界面」
- 附：父侧已请用户提供 DeepSeek 用量页截图（可选——细节对齐用；未到不影响设计起步）。

### 1.2 现状（父侧亲看 + explore #3 侦察 · 2026-10-07 22:0x）

- **亲看**（`.thincoder/tmp/console-look-10-me-usage.png`，走查同拍）：3 卡（向量服务提示 ∥ 本月摘要 1 行表 ∥ 用量明细空表）——**零图表**。
- **对比**（admin「全队用量」，同走查 `:6` 截）：六筛选件 ∥ KPI 卡 ×2 ∥ **纯 CSS 柱图**（`views-usage.mjs:90-97` + `style.css:149-153`——零依赖现成件）∥ 按模型/按成员两栏。
- **数据面（可复用，大半零新 SQL）**：`usageSummary({ memberId })`（`src/metering/report.mjs:110-145`——按日零填充趋势 + byModel + byMember，**已支持本人过滤**）；`monthlyCountersByMember`（`aggregates.mjs:81-95`）——且**已随 `GET /api/me` 下发为 `memberView.modelUsage`**（`accounts/routes.mjs:46`，前端未消费 = 纯显示面缺口）；`usageTotals`（`report.mjs:80-86`）。
- **缺口**：① 成员侧汇总端点缺失（`/api/usage/summary` = admin 硬门 `metering/routes.mjs:89` ⇒ 须新增 `GET /api/me/usage/summary` 或给 `/api/me/usage` 挂 trend/totals）；② 小时/周粒度无（日/月两键为限）；③ **成本/金额 = 不做项**（`METERING.md:130`）——DeepSeek 参考图的金额类不能 1:1 映射，以 tokens/请求数替代；④ 图表库 = 违约束（KD-SV-29 已否）——走**零依赖手绘**（复用现成 CSS 柱件）。

### 1.3 边界翻案记（须随正 · 凭据 = 本条）

- 三处已裁边界明文「我的用量页不做趋势/聚合（管理面专属）」：`docs/server/design/metering/METERING.md:131` ∥ `docs/server/design/webui/WEBUI.md:505`（§8）∥ `WEBUI.md:486`（KD-SV-29 否决栏）。
- **用户 22:03 原话 = 新裁定**（本人面要图表）——设计轮须随正三档（改判 + 变更记录）；
- 另：`/api/me` 的 `modelUsage` 现为「已下发未消费」——本次一并消费（纯显示面）。

### 1.4 父侧元素建议（供设计轮对齐；细节随用户截图/裁）

- **KPI 卡行**：请求数 ∥ 总 tokens（prompt/completion 拆）∥ 本月已用（+配额面）。
- **按日趋势图**（柱/折线——复用 admin 现成 CSS 柱机制）+ 时间范围筛选（近 7 / 30 日 ∥ 本月）。
- **按模型分布**（排行表 ∥ 占比条——`modelUsage` 直消费）+ **按端点细分**（chat/embeddings）。
- **明细表**（现成；补模型/时间筛选）+ 导出（admin 有 CSV = admin 硬门；me 侧去留 = 设计轮定）。

### 1.5 参考截图（用户实拍 · 2026-10-07 22:06）

- 文件 = `d:\teamcode\.thincoder\tmp\paste-muy6l6a14v0p-0.png`（DeepSeek「用量信息」页实拍——用户提供）。
- **元素清单（父侧亲看）**：① 页头说明条（时区 ∥ 数据延迟说明）② 峰谷提示 banner ③ 两概览卡（充值余额 ∥ 累计消费金额——**金额族**）④ 筛选行（时间维度「近 7 天」∥ API Key ∥ 清除筛选条件 ∥ 导出钮）⑤ KPI 卡 ×3（消费金额 ∥ API 请求次数 ∥ Tokens）⑥ 主柱图卡（标题携金额 + 图例切换「模型 ∥ API Key」+ 按日柱图 10/1–10/7）⑦ **分模型区**——逐模型两块并排（请求数**面积图** ∥ Tokens **柱图**）。
- **映射到本服务器（无金额面——不做项）**：金额 ∥ 余额两族**不映射**（替代 = 请求数/tokens；「本月已用」对配额面）；主图 = **按日 tokens**（维度可切端点/模型）；KPI = 请求数 ∥ 总 tokens（prompt/completion 拆分）；分模型区 = 逐模型「请求数 + tokens」（`modelUsage` 已下发直消费）；筛选 = 时间维度（近 7 / 30 天 ∥ 本月）+ 端点；导出 = me 侧去留（设计轮定）。

### 1.6 全链授权（用户 2026-10-07 22:09）

- 原话：「可以，这两条线都自动跑到交付。」
- 射程 = 代点火设计评审 ∥ 修正轮派发 ∥ §4 代签 ∥ 实施派发 ∥ 复核 ∥ 收口核销 ∥ 签入（双远端）。
- 自缚三条（仓惯例）：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正全落并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停；③ 破坏性/不可逆 ⇒ 先停。

### 1.7 设计评审轮（advisor · 2026-10-07 22:26）处置

- **结果：pass（🔴0 ∥ 🟡3 ∥ 🔵6）**——findings 表在 §3（评审写入）。
- **裁定（逐条 → 修正轮执行）**：🟡1 = **条件式**收正（views-me「若实施实读越 300 方拆」——194+85≈279 不越；§1/§5/§6/§2 口径一体）∥ 🟡2 = 收纳口径三选一收正（报表卡 max-height+自滚 ∥ page-area 自滚+明细卡 min-height 下限 ∥ 明示整页滚退化并披露——与 §2.6① 理由对齐，链条表同步）∥ 🟡3 = 行数注补（测试件 + package.json）∥ 🔵4 = 殿后行 × 端点过滤规则明写（含嵌入口径）∥ 🔵5 = AC-26② 补「（日对齐窗）」∥ 🔵6 = 实现接缝钉死（`usageSummary({memberId})` + 拆 totals 查询；admin 响应组装零触）∥ 🔵7 = 残留名收正 ∥ 🔵8 = 算术微差当场平。
- 修正后父侧核验 → §4 代签 → 实施。
- 设计令牌：已签发（值不落档——运行时凭据）。

### 1.8 评审轮 2 处置 + 代签 + 实施派发（主 agent · 2026-10-07 22:42）

- **轮 2 = pass**（🔴0 ∥ 🟡1 ∥ 🔵3——残余四项）。残余处置：① §1 i18n 增量 +≈22 ⇒ +≈23 ∥ ② `routes` ≈120 ⇒ ≈119 ∥ ③ §2.3 节题补后批面归属 ∥ ④ §3 地图 webui 行 +§2.3/§2.6 指针——**父侧直接执行〔可 revert〕**（一行/表级、零语义；三档变更记录各追一行）。
- **需求档回笔（R41①）已落**：功能点 26 + AC-26 + 计数行（二十六条）+ 变更记录——提交 `34c18e55`（已双推）。
- **§4 代签落**（三条件齐备：轮 2 pass 0🔴 ∥ 修正全落并逐条核验 ∥ token 已签发〔值不落档〕）——**实施舱已派**（设计档 = 任务书；token/designId = 运行时凭据）。

### 1.9 随正扩展 + 门禁计数收正（主 agent · 2026-10-07 22:5x）

- **#12 上抛照准**：本批入链 = **两件**（`-me-usage-charts.test.mjs` + `-me-usage-charts-ui.test.mjs`——沿 me-keys 域/UI 分档先例）⇒ 门禁清单 24 ⇒ **26**（设计 注⑪「+1」为估——随正清单一并扩）。
- **父侧直接执行〔可 revert〕**：五件断言件计数收正（`-console-list-style:234/:236` ∥ `-server-auto-update:9/:439/:480` ∥ `-provider-model-metadata:18/:491/:493` ∥ `-quota-per-model:19/:440/:442/:444` ∥ `-quota-v2-member-models:24/:424/:426/:428`——断言 + 注释 + 题面同拍 24 ⇒ 26）；`-console-layout:442/:444` 归 #12 件内（更正指令已发）。
- 设计面随正（注⑪ 扩为六件 + 两新件入链）= 回填轮随 §5 实读一并收。
- 另：#1 服务态（8787）= 1h 超时收割后已重启（bash#14，24h 时限）——运行态不受影响。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-07（实施后回填轮落盘（§2.9——实读收正；门禁复跑 server 域零新增））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- **B1 三档翻案**（凭据 = §1.3 用户 22:03 原话）：`metering/METERING.md` §8 ∥ `webui/WEBUI.md` §8（二轮不做面条目删） ∥ `WEBUI.md` §7 KD-SV-29 否决栏条目删——「我的用量页不做趋势/聚合」改判为「本人面轻量图表（数据面本人过滤复用；管理面专属面收窄 = 跨成员过滤/排行 ∥ CSV 导出 ∥ 管理看板页）」；KD-SV-29「图表库被否 ∥ 零依赖 CSS 柱」不动。
- **B2 页面设计**（落点 = `webui/WEBUI.md` §2.3⑦ 全文）：概览卡行 ∥ 筛选行四控件（时间维度三档 ∥ 端点 ∥ 模型 ∥ 清除）∥ KPI 行（请求数 ∥ tokens+拆分注）∥ 按日堆叠柱主图（维度切换 = 端点/模型——零依赖柱件复用）∥ 分模型区（逐模型 请求数 ∥ tokens ∥ 本月已用——`modelUsage` 直消费）∥ 明细表（现件 + 同过滤面）；导出 = 判否（理由在档）；元素对照截图逐条可追（含不映射名单）。
- **B3 端点设计**（落点 = `metering/METERING.md` §3 新行）：`GET /api/me/usage/summary`（会话——本人固定）——判据 = KD-SV-50（与 admin 同构：summary 与明细分端点 ∥ 明细面不吞报表体 ∥ 既有断言零动）；响应形状给全（totals 四字段 ∥ trend ∥ trendByEndpoint ∥ trendByModel ∥ byModel）；复用 `usageSummary`（成员固定）+ 两维序 + 携拆 totals；**admin 门与既有 admin 端点零动**。
- **B4 验收面**：AC-26 两行（`webui/WEBUI.md` §6——候补）∥ AC-26 一行（`metering/METERING.md` §4——候补）∥ 用例 N32/N33 ∥ B25 ∥ E22；不做单（WEBUI §8 + §2.3⑦）。
- **B5 消费面收口**：`memberView.modelUsage`（已下发未消费）⇒ 分模型区「本月已用」列直消费（缺 = 0；自然月 = 配额窗）。

### 2.2 设计档落点（项 → 改动 file:line）

| 项 | 改动 | 落点 |
|---|---|---|
| B1 | §8 边界随正（本人面图表 = 在；管理面专属面收窄；本人面导出/小时粒度未设） | `docs/server/design/metering/METERING.md` §8（L138） |
| B1 | §8 二轮不做面条目删 + 本批不做面增 | `docs/server/design/webui/WEBUI.md` §8（L553 ∥ L563） |
| B1 | KD-SV-29 否决栏条目删（图表库被否不动） | `WEBUI.md` §7（L533） |
| B2 | 页面设计全文（页形/主图/分模型/数据面/窗换/导出判否/statCard 复用/元素对照/不做单） | `WEBUI.md` §2.3⑦（新增——L132 起）+ §2 路由行（L27） |
| B3 | 端点契约（新行全文 + 五读端点同门 + 数据源分面） | `METERING.md` §3（L64 ∥ L70-71） |
| B3 | 关键决策 KD-SV-50 | `METERING.md` §6（L108） |
| B4 | AC-26 候补行 | `METERING.md` §4（L85）∥ `WEBUI.md` §6（L523-524） |
| B4 | 用例 N32/N33 ∥ B25 ∥ E22 + E21 计数随正 | `METERING.md` §7（L124 ∥ L130-133） |
| B5 | 分模型「本月已用」列 | `WEBUI.md` §2.3⑦ |
| 随动 | 键族登记（+8 ∥ −1；`me.usage.summary` 退役） | `WEBUI.md` §2.2（L94-96） |
| 随动 | 预算（实读收正 + 增量） | `WEBUI.md` §5（L480 ∥ L486 ∥ L492 ∥ L494-496）∥ `METERING.md` §5（L93 ∥ L95-96） |
| 随动 | §2.5 新面登记 + §2.6② 高度链 +2 行 | `WEBUI.md` §2.5（L406）∥ §2.6②（L432-434） |
| 随动 | 板档索引/预算/验收对照/上抛/变更记录 | `docs/server/design/PROJECT.md` §4（L84 ∥ L136-137）∥ §6（L159-161）∥ §7（L251）∥ §9（L310） |

### 2.3 机制设计（摘要——全文见落点）

- 数据面：新端点 `GET /api/me/usage/summary`——复用 `usageSummary({memberId})`（成员固定）+ 逐日维序两面（`trendByEndpoint`/`trendByModel`——逐（维值 × 日）零填充）+ totals 携 prompt/completion 拆；admin 端点/门零动（隔离面最小）。
- 页面：壳内两卡（报表卡不承缩 + 明细卡承缩）；主图 = 纯 CSS 堆叠柱（`.bar-stacked`/`.bar-seg`；段色 = `--accent` 透明度阶梯 [1 / 0.7 / 0.45 / 0.3]）；维度切换 = 本地重画（数据一次取齐）。
- 单过滤面四区同拍（`Promise.all` 两读——KPI ∥ 主图 ∥ 分模型 ∥ 明细同参同刷）；即选即查；清除 = 四控件复位。

### 2.4 受影响文件与测试面

| 档 | 现状实读 | 预期 | 改动点 |
|---|---|---|---|
| `thincoder-server/src/metering/report.mjs` | 168 | ≈225 | `memberUsageSummary`（复用 + 两维序 + 拆 totals；admin 读函数零改） |
| `thincoder-server/src/metering/routes.mjs` | 111 | ≈120 | 新路由 1 行 |
| `thincoder-server/public/views-me.mjs` | 194 | ≈280 | 用量页图表化重写（§2.3⑦；越 300 软线 ⇒ 拆分预案：迁 `views-me-usage.mjs`（拟新增）） |
| `thincoder-server/public/views-overview.mjs` | 74 | ≈75 | `statCard` 导出（1 词——函数体零改） |
| `thincoder-server/public/style.css` | 218 | ≈240 | 堆叠段件 ∥ 切换钮 ∥ 图例点 ∥ `.page-area` gap ∥ `.report-card`（零新颜色变量） |
| `thincoder-server/public/i18n-zh.mjs` ∥ `i18n-en.mjs` | 375 ∥ 378 | ≈382 ∥ ≈385 | +8 键 ∥ −1 键（`me.usage.summary` 退役） |
| 产品码其余面 | —— | 零动 | gateway/accounts/store/ops 零触；admin 页（views-usage ∥ app ∥ modal）零改 |

**测试面**：
- 新批内件（拟新增）：`docs/batches/2026-10-07-me-usage-charts.test.mjs`（拟 ≈400 行——端点逐值/零填充/判权 + 页面结构/柱件/键集）。
- 随正件：`docs/batches/2026-10-07-console-layout.test.mjs`（me 页用例——路由桩补 `/api/me/usage/summary` ∥ 页头断言改点〔`me.usage.summary` 键退役〕）+ `thincoder-server/package.json`（`prepublishOnly` 23 ⇒ 24）。
- 回归零改面：`-server-gateway-metering`（me usage 过滤器/判权断言零动）∥ `-quota-*`（汇表面函数零改）∥ `-console-completeness-2`（管理用量页断言零动）。

### 2.5 验收对照（三向一致）

| 本批条目 | 设计判据（落盘） | 需求档 |
|---|---|---|
| B1 三档翻案 | METERING §8 ∥ WEBUI §8 ∥ KD-SV-29 否决栏（已落盘） | 用户 22:03（§1.1）——功能点 26 落点 = 主 agent（待回笔） |
| B2 页面 | WEBUI §6 AC-26 两行（候补） | 同上 |
| B3 端点 | METERING §4 AC-26 行（候补） | 同上 |
| B4 不做单 | WEBUI §8 + §2.3⑦ | 同上 |

### 2.6 关键决策（录）

- **KD-SV-49**（`WEBUI.md` §7）：我的用量页 = 本人面轻量图表；导出不设；壳面五页维持（高度链 +2 行）。
- **KD-SV-50**（`METERING.md` §6）：本人报表 = 新端点（与 admin 同构 vs 扩展既有端点——被否候选在档）。

### 2.7 上抛项

- ① 需求档落点（主 agent 笔）：功能点 26 + AC-26 行——设计侧候补已在（`WEBUI.md` §6 ∥ `METERING.md` §4）。
- ② 披露（不阻塞）：壳面五页钉表维持——报表卡不承缩 + 明细承缩（高度链 +2 行）；如偏好参考图式自由滚动页 ⇒ 需求 §2:20 改判另轮。
- ③ 披露：`statCard` 两处并存（`views-overview` 变参 ∥ `views-usage` 单值）——本批复用 overview 件；去重 = 结构轮候选（未立账）。
- ④ 在册口径（本设计轮实读收正）：views-me 实读 194 vs §5 估 ≈211（已随正）；仓级 doc-check 读数（非本批面）= 悬空 25 ∥ 行宽 40——全在 core/desktop/vsc 域（并行会话在写），server 域零闸内项（本批新增符号均为「报告面 · 不入闸」）。

### 2.8 评审修正轮（评审轮次 1 · 2026-10-07）

- 范围：findings 1–8 逐项落修（findings 全文在 §3；#9 = 评审限制，非缺陷、零改）；**零新语义**（口径 ∥ 算术 ∥ 措辞 ∥ 行数注只——与设计轮同源）；需求档零动（主 agent 笔）；产品码零触。
- 路径简写（同 §3）：`WEBUI.md` = `docs/server/design/webui/WEBUI.md` ∥ `METERING.md` = `docs/server/design/metering/METERING.md` ∥ `PROJECT.md` = `docs/server/design/PROJECT.md`。

**号 → 处置 → 落点（fix 后盘面行号）**：

| # | 处置 | 落点 |
|---|---|---|
| 1 | 🟡 条件式收正：views-me 句改「194+85≈279——未越 300 软线；若实施实读越 300 ⇒ 拆分预案在册（不拆为实）」；同拍 `≈280` ⇒ `≈279` | `WEBUI.md:482` ∥ `PROJECT.md:160` |
| 2 | 🟡 收纳口径收正（三选一取 a——根因直修）：报表卡「上限 = 页区高 55%（超限卡内自滚）」⇒ 明细卡恒得剩余高；与 §2.6① 判否理由（报表卡无界——与有界壳不相容）对齐 | `WEBUI.md:139`（页区句）∥ `:436`（链行——`flex: none; max-height: 55%; overflow-y: auto`）∥ `:525`（AC-26④）∥ `:526`（AC-26 续）∥ `PROJECT.md:313`（R41③） |
| 3 | 🟡 行数注补（沿注⑩体例）：§6 添注⑪（`-console-layout` **490** ⇒ ≤±6 ∥ `package.json` **26** ⇒ ±0）∥ 随正件句 `prepublishOnly` 件数实读收正 + R41② 回指行数注 | `PROJECT.md:221-223`（注⑪ 三条）∥ `:161` ∥ `:313` |
| 4 | 🔵 殿后行 × `endpoint` 过滤口径明写（殿后行源 = 月窗含嵌入；过滤只裁窗表——chat 下嵌入照显殿后） | `WEBUI.md:149`（新行） |
| 5 | 🔵 AC-26② 补「（日对齐窗）」（与 AC-15② 同拍） | `METERING.md:85` |
| 6 | 🔵 实现接缝钉死：调 `usageSummary({ memberId })` + 独立拆 totals 查询；admin 端点/读函数/响应组装零触（§3/§5 两说归一） | `METERING.md:64` ∥ `:93` |
| 7 | 🔵 残留名收正：「我的用量摘要表」⇒「我的用量页报表卡（分模型表——随卡自滚；非壳表链）」 | `WEBUI.md:420` |
| 8 | 🔵 算术当场平（不待回填）：`report` ≈225 ⇒ **≈223**（168+55）∥ `views-me` ≈280 ⇒ ≈279 ∥ `views-overview` ≈75 ⇒ **±0**（1 词改）∥ webui ≈+125 ⇒ **≈+121** ∥ i18n 两表 +≈16 ⇒ +≈14 ∥ 小计 ≈3630 ⇒ **≈3626** ∥ 产品面 ≈+188 ⇒ **≈+184** | `METERING.md:93` ∥ `WEBUI.md:482/488/498` ∥ `PROJECT.md:159/160` |
| 9 | 🔵 评审限制（非缺陷）：承接 = R41①（需求档回笔后复核 AC-26 文本 × §2.3⑦ 页形逐条一致） | ——（本轮零改） |

**附记**：
- `prepublishOnly` 件数实读 = **24**（原「23 ⇒ 24」为陈——me-keys 批两件已入链）⇒ 预期 25；`-console-layout` 实读 **490** 行。
- **门禁复跑**（`node scripts/doc-check.mjs`，仓根——交付前一次性）：悬空 **25** ∥ 行宽 **40**——与设计轮读数同基线（皆 core/desktop/vsc 域，并行会话在写）；**server 域零闸内项 ∥ 本批面零新增**（新符号皆「报告面 · 不入闸」）。
- 三档变更记录各追加一行（fix 轮）——在落（`WEBUI.md` ∥ `METERING.md` ∥ `PROJECT.md` §变更记录）。

### 2.9 实施后回填轮（fix 轮——零新语义：实读值 ∥ 计数 ∥ 注 ∥ 登记只）

**范围**：§5 实读回填（WEBUI ∥ METERING ∥ PROJECT §6 本批行）∥ 注⑪ 收正 ∥ §2.5 补 `.bar-legend` ∥ 记录面收正（「单件 ∥ 24 ⇒ 25 ∥ 拟 ≈400」⇒「两件 228 ∥ 403 ∥ 26」）∥ 同源随动（WEBUI §2.2 表体量）；AC-26 无件数/行数断言 ⇒ 零触。产品码零触 ∥ §1/§4/§5 零动 ∥ 需求档零动 ∥ 批外档零触。

**号 → 改动 file:line**：

| # | 项 | 落点 |
|---|---|---|
| 1 | WEBUI §5 五档实读 | `docs/server/design/webui/WEBUI.md`：`views-me` **194 ⇒ 295**（L482——拆分预案不触发，「拟新增」句删） ∥ `style.css` **218 ⇒ 228**（L494） ∥ i18n 两表 **382 ∥ 385**（L496 ∥ L497） ∥ `views-overview` **74**（L488——±0 保持） ∥ 小计 **3619**（= public 19 档 3541 + `static.mjs` 78；对链上 ≈3626 差 7——累计估差收口）（L498） |
| 2 | METERING §5 实读 | `docs/server/design/metering/METERING.md`：`report` **226**（L93） ∥ `routes` **117**（L95） ∥ 小计 **726**（L96——五档实读和；对链上 ≈773 差 47）；另补两行实读：`usage` **170**（L91） ∥ `quota` **40**（L94）——前账欠项「设计档回填轮随正」（`docs/batches/2026-10-07-quota-per-model.md`:181 在册）随拍收口，使小计可逐行核验 |
| 3 | PROJECT §6 本批行 | `docs/server/design/PROJECT.md` L159–161：产品面 **≈+184 ⇒ 实读 +189**（metering +64 ∥ webui +125）；批内件 **两件 228 ∥ 403**（越 500 硬线拆档）；`prepublishOnly` 24 ⇒ **26** |
| 4 | 注⑪ 收正 | `PROJECT.md` L221–223：随正件 = **六件断言件** + `-console-layout` me 页两处断点；门禁件数 24 ⇒ **26**；新批内件 = 两件（228 ∥ 403）；原「单件 ∥ 24 ⇒ 25 ∥ 拟 ≈400」类措辞收正（陈） |
| 5 | §2.5 补登 | `WEBUI.md` L408：新面登记补 `.bar-legend`（内审 🟡「设计面清单滞后一件」落修） |
| 6 | 记录面 | 三档变更记录各追一行（均注「实施后回填轮」）：`WEBUI.md` L619 ∥ `METERING.md` L158 ∥ `PROJECT.md` L358 |
| 7 | 同源随动 | `WEBUI.md` L96（键族表体量 ⇒ 实读 382 ∥ 385） ∥ `PROJECT.md` L313（R41② 同拍——六件 + 断点 + 26） |
| 8 | AC-26 零触 | 无件数/行数断言 ⇒ 不改（`WEBUI.md` §6 ∥ `METERING.md` §4） |

**闸面读数**（`node scripts/doc-check.mjs`——仓根；回填前后同基线）：悬空 **28 ⇒ 28** ∥ 行宽 **29 ⇒ 29**；**server 域零闸内项 ∥ 本批面零新增**（两处列报 = 迁移期引文·不入闸；报告面条目逐条同前）。行数面（报告态）15 条——非本批面。

**平账说明**：小计按实读重基（webui **3619** ∥ metering **726**）；链上估差 7 ∥ 47 随本行收口；WEBUI 行「实施后回填轮统一收正」尾句兑现（原文删）。PROJECT §6 总账/域链（L162–173）未动——滞账在册（§9 R40②，先于本批）。

**§2.9 附记（交付前终跑）**：`node scripts/doc-check.mjs` ⇒ 悬空 **19** ∥ 行宽 **29**（仓级悬空较回填期下移 9——并行会话修入，非本批面）；server 域条目与基线逐条同（2 列报·不入闸 + 24 报告面）——**本批面零新增**；行数面 17 条皆 `docs/desktop/**`（并行会话在写）——非本批面。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 一致性（档内矛盾） | 🟡 | `webui/WEBUI.md:481` 声明 views-me「⇒ ≈280（本批：用量页图表化重写 +≈85；越 300 软线 ⇒ 启用拆分预案：用量页迁 `views-me-usage.mjs`（拟新增——沿 views-usage 先例））」，而 194+85≈279 实未越 300；同档 §6 AC-26 机检口径（`WEBUI.md:525`）与 §5 小计（`WEBUI.md:497`）、`design/PROJECT.md:160` 均断言「档目 19 ∥ 20 不变（零新档）」；§1 越线清单（`WEBUI.md:17`）亦未列本档——是否新建档两说 | 收正其一：把 §5 句改为条件式（「若实施实读越 300 ⇒ 拆分预案在册」）并同步 §1/§5 措辞；或明示本批即拆并同步 AC-26「零新档」与档目断言 |
| 2 | 范围/收纳（壳内无界报表卡） | 🟡 | `#/me/usage` 保持壳面（`WEBUI.md:419`）却在壳内放不承缩报表卡（`WEBUI.md:139`「（`report-card`——不承缩）」）+ 链声明 `WEBUI.md:435`「`flex: none`（报表卡——自然高不承缩；明细卡仍走上行承缩链——me 用量图表化批）」；明细卡侧 = `flex: 1; min-height: 0`（`WEBUI.md:434`）——§2.6① 当初排除 `#/admin/usage` 的理由恰是「报表卡无界——与有界壳不相容」（`WEBUI.md:419`）。「页头 + 报表卡超出视口」的收纳规则未定（按声明，明细卡可被压至零高、页区溢出 100dvh 壳）——常见桌面高度下明细表可能不可用 | 明写收纳口径（报表卡 max-height + 自滚 ∥ 明细卡 min-height 下限 ∥ 或明示极端态退化为整页滚并披露），与 §2.6① 既定理由对齐 |
| 3 | 受影响件注（criterion 8） | 🟡 | 本批将改 `docs/batches/2026-10-07-console-layout.test.mjs`（`PROJECT.md:161` ∥ `WEBUI.md:525` 在册）却未注当前行数 + 预期增量（≤±N），与既定注式先例（`PROJECT.md:217`「`-console-layout` **490** ⇒ ≤±4」）不一致；`thincoder-server/package.json` 亦只注件数（`prepublishOnly` 23 ⇒ 24——`PROJECT.md:161`）未注行数增量 | 补两件行数注（实读 ⇒ ≤±N／±0），沿注⑩体例落注⑪；如该注已在批档 §2 载明，则回指批档为准 |
| 4 | 清晰性（过滤×殿后行） | 🔵 | 分模型区殿后行与端点过滤的交互未定：`WEBUI.md:148`「行序 = `byModel` 降序 + 范围无行而本月有量者殿后（月量降序）」；殿后行源 = `member.modelUsage`（自然月），而计数含嵌入行（`METERING.md:39`「全记账行照计（含嵌入——检查只读 chat 键）」）——`endpoint = chat` 过滤下，仅月窗有量的嵌入模型会以 0/0 殿后出现 | 明写殿后行是否受 `endpoint` 过滤约束（或注明「含嵌入 ∥ 仅 chat」口径） |
| 5 | 清晰性（判据措辞） | 🔵 | AC-26②（`METERING.md:85`）「totals 四字段 = 明细归并」缺「（日对齐窗）」限定，与 AC-15②（`METERING.md:80`「注入行集（日对齐窗）⇒ `summary.totals` 逐值 = 明细归并」）不同；数据源 = `usage_daily`（日粒度——`METERING.md:19`） | 补「（日对齐窗）」限定与 AC-15② 同拍（防测试按原始明细直比——口径已在 N33/§1） |
| 6 | 清晰性（实现接缝） | 🔵 | 「实现 = 复用 `usageSummary`（成员固定）+ 两维序查询 + 携拆 totals——admin 端点零动」（`METERING.md:64`）与「`memberUsageSummary` 新增 +≈55——复用 + 两维序 + 携拆 totals；admin 读函数零改」（`METERING.md:93`）两说并存；admin 面 totals 无 prompt/completion 拆（`METERING.md:66`）——拆字段自何处产出未钉，而接缝即 AC-26⑤「admin 端点零动（`/api/usage/summary` 响应形与既有件回归零改）」（`METERING.md:85`）被触之路 | 钉实现接缝（调 `usageSummary({memberId})` + 独立拆 totals 查询，或共享内部助手），并注 admin 响应组装零触 |
| 7 | 文档卫生（残留指名） | 🔵 | `WEBUI.md:419` 排除面仍列「我的用量摘要表」，而本批已重做该表（`WEBUI.md:96`「退役 1 键——`me.usage.summary`（「本月摘要」——摘要表重做后零消费者，删净）」） | 随正为现形（如「我的用量页报表卡（非壳）」），免后读将已废件当活件 |
| 8 | 预算抽检（微差） | 🔵 | 抽检微差：`METERING.md:93`「实读 168（2026-10-07）⇒ ≈225（me 用量图表化批：`memberUsageSummary` 新增 +≈55」——168+55=223；`WEBUI.md:487`「74 ⇒ ≈75（me 用量图表化批：`statCard` 导出〔1 词——函数体零改〕）」——按词改不加行；`WEBUI.md:497` 小计「+≈125 = views-me +≈85 ∥ style +≈22 ∥ i18n 两表 +≈16 ∥ views-overview +1」——分项和 124、i18n 两表行增实为 +7/+7 | 实施后回填轮统一收正（≈噪声内） |
| 9 | 评审限制 | 🔵 | 无项目标准档与文档地图（按 Project Guide 判）；需求单源 `docs/server/requirements/PROJECT.md` 与批档 `docs/batches/2026-10-07-me-usage-charts.md` §2 不在评审范围——功能点 26/AC-26 需求侧文本、criterion 8 的本注是否另载均不可核；需求覆盖仅按 `WEBUI.md:133`（用户 22:03 原话）与设计侧候补行判（R41① 登记需求档回笔） | 需求档回笔（R41①）落定后复核 AC-26 文本与 §2.3⑦ 页形逐条一致；行数注缺口以批档 §2 为准则回指批档 |

计数：🔴 0 ∥ 🟡 3 ∥ 🔵 6（合计 9）

VERDICT: pass

### 轮次 2（评审子代理）

评审轮 2——验修正 claims（findings 1–8 逐项）：三档变更记录所列修正项逐条回验，均在规范面落位（此轮无 🔴）——
🟡1（views-me 条件式+算术平）：`webui/WEBUI.md:482`（「194+85≈279——未越 300 软线；若实施实读越 300 ⇒ 拆分预案在册」）∥ `webui/WEBUI.md:498`（小计 ≈3626 = 3505 + 121）∥ `design/PROJECT.md:160`；算术核 194+85=279 ✓ ∥ 85+22+14=121 ✓ ∥ 3505+121=3626 ✓；
🟡2（报表卡上限口径）：`webui/WEBUI.md:139` ∥ `:436`（`flex: none; max-height: 55%; overflow-y: auto`）∥ `:525`④ ∥ `design/PROJECT.md:313`③——四处同口径，且与 §2.6① 判否理由显式对齐；
🟡3（随正件件数收正）：`design/PROJECT.md:161` ∥ `:222` ∥ `:313`（`prepublishOnly` 24 ⇒ 25）——与注⑪ 内断点自洽；
🔵4（§2.6① 排除面残留名）：`webui/WEBUI.md:420` 已为「我的用量页报表卡（分模型表——随卡自滚；非壳表链）」；
🔵5（实现接缝）：`metering/METERING.md:64`（「调 `usageSummary({ memberId })`（成员固定——既有函数零改）」）+ §5（`:93`）同拍归一；
🔵6（日对齐窗）：`metering/METERING.md:85`（「totals 四字段 = 明细归并（日对齐窗）」）；
🔵7（AC-26 两行随拍+殿后行口径）：`webui/WEBUI.md:525` ∥ `:526` ∥ `:149`；
🔵8（算术平）：`metering/METERING.md:93`（168 ⇒ ≈223）∥ `design/PROJECT.md:356`；产品面 ≈+184 = 63 + 121 ✓。

残余发现（4——🟡1 ∥ 🔵3，皆不阻塞）：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档状态（数字漂移） | 🔵 | `webui/WEBUI.md:17` §1 越线清单把 me-keys 批增量标为「实读 352 ∥ 355 ⇒ 本批 +≈22/表」，而 §5 链（`:496` ∥ `:497`——实读 375 ∥ 378 ⇒ +23/+23）与 `:614` 已收正「净 ≈+22 ⇒ **≈+23**」——同一增量两处差 1，§1 未同拍 | §1 括注收正为 +≈23/表，或删该冗余增量（仅留 §5 叠加链） |
| 2 | 预算（加和零差） | 🔵 | `metering/METERING.md:95` 与 `design/PROJECT.md:160` 同拍：routes.mjs「实读 111（2026-10-07 复读——含 quota 端点换形）⇒ ≈120」+「路由 +≈8」——加和 111+8=119，与 ≈120 差 1 未注明取整 | 收正为 ≈119，或明写「≈120（取整）」 |
| 3 | 文档口径（标题计数） | 🔵 | `webui/WEBUI.md:101` 节题「### 2.3 可见面二轮（六面机制——功能点 15）」，节内已含 ⑦（功能点 26——`:133`）且 ⑥ 为功能点 25 面（`:120`）——「六面」计数与功能点括注未随正 | 节题括注随正（计数与功能点归属对齐），或加节内归属注 |
| 4 | 文档地图（跨档指针滞后） | 🟡 | `design/PROJECT.md:81` §3 地图 webui 行未含 §2.3（可见面二轮）/§2.6（数据表壳布局）指针——本批在两节皆有落笔（§2.3⑦ ∥ §2.6②）而随动清单（`:355`）未含 §3；前批亦未补——跨档指针滞后 | 地图行补「可见面二轮（§2.3）∥ 数据表壳布局（§2.6）」指针（随本批或清账轮并入） |

VERDICT: pass

计数：🔴 0 ∥ 🟡 1 ∥ 🔵 3

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**父侧代签（用户 2026-10-07 22:09「可以，这两条线都自动跑到交付。」= 全链授权）——三条件齐备**：① 设计评审 = 轮 1 changes-required（🔴1∥🟡5∥🔵4）→ 修正轮 8/8 落 + 抽核 ✓ → **轮 2 pass**（🔴0 ∥ 🟡1 ∥ 🔵3——残余四项逐条处置〔§1.8〕）；② 修正全落并逐条核验（轮 2 回验 8/8）；③ token 已签发（值不落档——运行时凭据）。

**批准范围 = 本批全量**：端点（`GET /api/me/usage/summary`）∥ 页面（`WEBUI.md` §2.3⑦ 六区）∥ `style`/`i18n`/`views-overview` 随动 ∥ 批内件 + 随正件两笔。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-10-07（产品面 8 档 + 批内件两件 + `package.json` 门禁 24 ⇒ 26；本批两件实跑 9/9 绿 ∥ 跨批补件 8/8、7/7 绿；内审 findings（1 高 = 跨批在册件 ∥ 1 低 = 记录面）∥ 内评 VERDICT pass（0🔴 ∥ 🟡2 ∥ 🔵3）；`-console-layout` 跨批写门拒 ⇒ 补件待父侧落）

**交付摘要（逐档；行数 = 本会话实读〔内容行，末行无尾空行计〕；估值 = 批档 §2.4）**

- 新建/重写 `thincoder-server/src/metering/report.mjs`（168 ⇒ **226**，估 ≈225——在估）：`memberUsageSummary`（= `usageSummary` 复用〔成员固定〕+ 拆 totals 四字段 + 两维序）+ `dimensionSeries`（逐（维值 × 日）零填充；维值升序 × 日升序）；admin 读面零改（`usageSummary`/`usageTotals`/`byMember` 形体原样——admin 响应形回归含批内件断言）。
- `thincoder-server/src/metering/routes.mjs`（111 ⇒ **117**，估 ≈120——在估）：`GET /api/me/usage/summary`（`requireSession` 本人固定 ∥ `memberId` 取自会话——零查询参；过滤器同门）；头注收正。
- `thincoder-server/public/views-me.mjs`（194 ⇒ **295**，估 ≈280——越估 15，≤300 软线内、拆分预案未触发）：用量页图表化重写（§2.3⑦ 六区：页头四件〔页题 ∥ 向量提示条 ∥ 概览卡 2（`me.usage.used` ∥ `col.quota`）∥ 筛选四控件〕∥ 报表卡〔KPI 2 + `kpiSplit` 拆注 ∥ 主图堆叠柱/切换 2/图例/轴标/空态 ∥ 分模型表五列 + 殿后行〕∥ 明细卡〔`usageTable({ withMember: false, foot: true })`〕）；单过滤面 `Promise.all` 两读同参；窗三档（-6/-29/月首）；维度切换 = 本地重画零重取；失败 ⇒ 两区 `.hint error`；import += `statCard`；key/account 两面零改。
- `thincoder-server/public/views-overview.mjs`（74 ⇒ **74**，±0）：`statCard` 行 +`export `（1 词改、行数零变、函数体零改）。
- `thincoder-server/public/style.css`（218 ⇒ **228**，估 ≈240——在估）：新面 `.bar-stacked`/`.bar-seg`/`.bar-swatch`/`.chart-toggle`（含 `.active`）/`.bar-legend` + `.page-area` gap + `.page-area > .card.report-card`（`flex: none` + `max-height: 55%` + `overflow-y: auto`）；零新 `:root` 变量（38）∥ 零新悬停规则（七条）∥ 内距仅 `--sp-*`/0（批内件断言）。
- `thincoder-server/public/i18n-zh.mjs` ∥ `i18n-en.mjs`（375 ⇒ **382** ∥ 378 ⇒ **385**，估 ≈382 ∥ ≈385——在估）：+8 键（`me.usage.range/range7/range30/rangeMonth/clear/modelPh/used/kpiSplit`）∥ −1 键（`me.usage.summary` 退役——产品面零残留）。
- `thincoder-server/package.json`（26 ⇒ **26**，±0）：`prepublishOnly` 清单 24 ⇒ **26**（本批两件入链——单行清单、行数零变）。
- 新建批内件两件（**越 500 硬线拆档**——沿 me-keys 两件先例；合体 ≈631 行）：
  - `docs/batches/2026-10-07-me-usage-charts.test.mjs`（**228 行**——服务端腿：腿 A 端点真 HTTP（判权 401/恒本人 ∥ N32 逐值/零填充 ∥ 过滤器同门 + 非法 400 ∥ N33 同源 ∥ B25 空集 ∥ admin 端点零动回归）+ 腿 D 门禁 26 件）。
  - `docs/batches/2026-10-07-me-usage-charts-ui.test.mjs`（**403 行**——页面腿：腿 B 桩 DOM（六区 ∥ 两读同拍同参 ∥ 三档窗换算 ∥ 维度切换零重取 ∥ 殿后行 ∥ 空/错态）+ 腿 C 静态面（样式在册/链行 ∥ `:root` 38 ∥ 悬停七条 ∥ 键集 +8/−1 两表同步 ∥ `statCard` 导出 ∥ `views-me` ≤300 ∥ 零外链））。

**读数（本会话实跑 · cwd = `thincoder/`）**

- 本批两件：`node --test docs/batches/2026-10-07-me-usage-charts.test.mjs docs/batches/2026-10-07-me-usage-charts-ui.test.mjs` ⇒ **9/9 全绿**（Tests 3 + 6 ∥ Fail 0 ∥ duration_ms ≈1091 ∥ 146）。
- 跨批写门拒（非越权披露）：`-console-layout.test.mjs`（属他批）写被机械拒（「cross-batch batch-record write」）⇒ 补件落 `.thincoder/tmp/me-usage-charts-verify/`：`console-layout-patched.test.mjs` ⇒ **8/8 绿** ∥ `console-list-style-patched.test.mjs` ⇒ **7/7 绿**（原件副本 + 改点；父侧可整档覆盖）。
- 现状红面（待父侧落件）：`-console-layout` ×2（腿 C me 用例〔桩缺 summary 路由 + 页头断言引退役键〕∥ 腿 G 计数 24 ⇒ 26）∥ `-console-list-style` ×1（④ 面计数：faceCount 7 ⇒ 8、`"hint error"` 19 ⇒ 21——用量页失败面两区 +2；补件已验绿）——其余四件父侧已落、复跑全绿。
- `node --check` 八档全过（`report` ∥ `routes` ∥ `views-me` ∥ `views-overview` ∥ i18n 两表 ∥ 两批内件）+ `package.json` JSON.parse OK。
- `node scripts/doc-check.mjs`（仓根）：悬空 **28** ∥ 行宽 **29**——皆 core/desktop/vsc/cli 域（并行会话在写）；**server 域零闸内项**（两处列报 = 迁移期引文·不入闸，非本批面）；本批零新增。
- **仓套件未跑** —— `not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**决策透明表**

| # | 决策 | 备选 | 何故 |
|---|---|---|---|
| 1 | 批内件拆两档（服务端腿 ∥ 页面腿） | 顺写单件（合体 ≈631 行） | 越 500 硬线 ⇒ 先拆后改（设计预书拆档形 = 迁移+端点腿 ∥ 页面静态面；沿 me-keys 两件先例） |
| 2 | `views-me.mjs` 重写压行至 295（≤300） | 触发拆分预案建 `views-me-usage.mjs` | 硬线未越；新建档击穿「档目 19 ∥ 20 不变（零新档）」AC-26 续 + 须触 `app.mjs` import（本批禁触面）——压行不损任何设计元素 |
| 3 | `-console-layout` 改点只落补件（`.thincoder/tmp/`） | 直写原件 | 跨批写门机械拒；不绕门；补件全绿供父侧整档覆盖（原件字节 = 副本减改点） |
| 4 | 段色阶梯 = 内联 `opacity`（`--accent` 单源） | 新颜色变量 | 设计明钉「零新颜色变量——段色 = `--accent` 透明度阶梯〔1/0.7/0.45/0.3〕」 |
| 5 | 维度切换 = 本地重画（同 `summary` 对象） | 切换即重取 | 设计明钉「维度切换 = 本地重画（零重取）」（AC-26 续机检口径同拍） |
| 6 | 随正清单按实读扩围并上抛 | 照设计件单（两件） | 实跑实证：件数断言散布六件（24 ⇒ 26）+ `-console-list-style` 错态计数面——注⑪ 只列一件 = 设计枚举缺项（已上抛知会，父侧已落五件） |

**审计与代码评审轮次与终态**

- ① 内探索背离审计（只读子代理；对照批档 §2 + `WEBUI.md` §2.3⑦/§6 AC-26 + `METERING.md` §3/§4）：**findings**——② 静默简化 ∥ ④ 越清单 **零命中**；① 部分实现 ×1（= `-console-layout` 旧件随正未落、现行必红——成因 = 跨批写门，补件在盘/已上抛）∥ ③ 文档漂移 ×1（记录面「单件/25」未收正——回填轮面）。挂账：行数回填（回填轮）。
- ② 内 advisor 代码评审（十档 + 三文档）：**VERDICT pass**——0🔴 ∥ 🟡2（`.bar-legend` 设计面清单滞后一件——回填轮随 §5 实读收 ∥ i18n 两表 382/385 行越 300 咨询线——在册结构轮 #976）∥ 🔵3（批内件壁钟锚定跨零点抖建议 ∥ `from` 键模板字面量避扫描正则〔先例在册〕∥ `usageSummary` 复用连带 `byMember` 聚合〔设计钉死接缝·非缺陷〕）。越界注记：console-layout/console-list-style 待落 ∥ 设计档数字旧值 ∥ 本段原空（即补）。
- fix round（自纠 ≤5）：**2 轮**——第 1 轮：批内件合体 610 行越 500 ⇒ 拆两档（决策 1）+ `views-me.mjs` 首版 325 行越 300 ⇒ 重写压行至 295（决策 2）；第 2 轮：批内件悬停清单断言未排序自纠（复跑全绿）。评审后零 must-fix ⇒ 无追加修轮。
- 终态：**converged（clean）**。

**披露（偏离/越限/待办）**

- **跨批件写门（非越权）**：`-console-layout.test.mjs` ∥ `-console-list-style.test.mjs`（及五件计数断言件）属他批 ⇒ 本子代理写被机械拒；补件两枚在 `.thincoder/tmp/me-usage-charts-verify/`（全绿）——父侧落件前门禁套件不可能全绿（在册待办）。
- **越清单**：无——除声明件目（批档 §2.4 表 + 批内件）外零改动；产品面零新档（档目 19 ∥ 20 不变）。
- **零触实核**：`gateway/**` ∥ `accounts/**` ∥ `store/**` ∥ `ops/**` ∥ `public/views-usage.mjs` ∥ `public/app.mjs` ∥ `public/modal.mjs` ∥ `public/nav.mjs` ∥ `public/index.html` ∥ 其余旧批测试件——零触。
- **行数越估**：`views-me.mjs` 295（估 ≈280——越估 15，软线内）；批内件 228 + 403（拟单件 ≈400 ⇒ 硬线拆档）。
- **设计枚举缺项（已上抛知会）**：注⑪ 随正清单只列 `-console-layout` 一件；实读另有五件件数断言（24 ⇒ 26）+ `-console-list-style` ④ 面计数两处（19 ⇒ 21 口径）——父侧已落五件；设计档数字「24 ⇒ 25」实为 **26**（回填轮随 §5 实读收）。
- 单测隔离：内存库（`:memory:`）+ 进程内 HTTP——零碰真库/生产数据；`.thincoder/tmp/` 补件 = 临时面（不随批留存）。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**收口日期：2026-10-07**（门禁 195/195 ∥ 双推齐 ∥ 核销 #1055 ∥ 设计槽已消费）

### 6.1 验证读数（父侧亲跑）
- 仓全量门禁 `npm run prepublishOnly`（thiencoder-server）= **195/195 pass ∥ 0 fail ∥ exit 0**——2026-10-07 23:08；26 件批内件全链 + 3×`node --check`（含本批两件）。
- 跨批补件两枚整档覆盖后实跑：`docs/batches/2026-10-07-console-layout.test.mjs` **8/8** ∥ `docs/batches/2026-10-06-console-list-style.test.mjs` **7/7**（23:07）。
- 本批批内件两件（`-me-usage-charts.test.mjs` 228 行 ∥ `-me-usage-charts-ui.test.mjs` 403 行）9/9 绿（#12 实跑；门禁同拍）。

### 6.2 交付物与提交
- 产品 8 档（`report.mjs` ∥ `routes.mjs` ∥ `views-me.mjs` ∥ `views-overview.mjs` ∥ `style.css` ∥ `i18n-zh/en.mjs` ∥ `package.json`）+ 批内件 2 件 + 随正件 2 件（console-layout 断点两处 ∥ console-list-style ④面）。
- 提交三笔：`39a9dd04`（交付——13 件 +927/−42）∥ `e5d994ed`（门禁名串同步）∥ `41211421`（批记状态同步）。
- 双推：origin ✓ ∥ github ✓（先前 5 连 500 为服务端故障，其后自愈——重推成功）。

### 6.3 回填轮（#16）落盘 + 上抛两项核准
- 落盘（§2.9）：§5 实读三档 ∥ 注⑪（六件 ∥ 24 ⇒ 26 ∥ 两件 228 ∥ 403）∥ `.bar-legend` 补登 ∥ 三档变更行；doc-check 本批面零新增。
- **核准两项**：① METERING §5 超枚举补登两行（`usage ⇒ 170` ∥ `quota ⇒ 40`）= **核准**（平账闭必需 + 配额批在册欠项 :181 兑现——实读值类零语义；不回调）；② 小计重基（**3619** ∥ **726**）= **核准**（小计 = 表行和——「按实读平账」即本轮之义）。

### 6.4 未决 / 转出
- 复核余条三条（🔵 非阻塞）→ 台账 **#1057**（认账不排期）。
- 真机走查（页六区视觉/交互——用户面）：**待用户**（列待）。
- 知会两项（PROJECT §6 总账滞账 = R40② 先于本批 ∥ METERING §5 职责列差）= 非本批面，在册不外扩。

### 6.5 核销与结算
- 台账 #1055：在途 ⇒ 待核销 ⇒ **已核销**（evidence = 本 §6 + 提交 `39a9dd04` + 门禁 195/195）。
- 设计槽：**consume-design 已执行**（值不落档——运行时凭据）。
- 结算清单：五段齐（§2 设计 + 回填轮 ∥ §3 评审两轮 ∥ §4 代签 ∥ §5 实施 ∥ §6 收口）∥ 计数同拍（24 ⇒ 26 六件断言件）∥ 指针解析（批档在盘）∥ changelog 面 = 无（本仓以批档 + 提交为痕）∥ 台账可见面 = 结算行随收口出。
