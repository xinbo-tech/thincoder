# 2026-10-06 · console-completeness-2
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 19:18「这些先落地，以上全做，做完我再看」（承 19:0x 界面走查「需求覆盖程度不高」+ 19:16「向量模型完全没有落地面」）——六面：向量可见 ∥ 用量看板 ∥ 管理总览 ∥ 审计/安全 ∥ 健康可见 ∥ key 细节；需求档 = `docs/server/requirements/PROJECT.md` §2:15 + AC-15。
> 台账 = #972（server · 归批）。前情 = docs/batches/2026-10-06-first-release-completeness.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-06 19:2x）**

**来源与授权**：
- 用户 19:0x 控制台走查：「我看了一下server的界面，感觉需求覆盖程度不高啊」；19:16 点名：「比如向量模型，我就完全没有看到落地面」（父侧实证：服务端全链在跑 ∥ 控制台零落地面——`public/**` grep「embedding」零命中）。
- 19:18「这些先落地，以上全做，做完我再看」= **六面全量授权 + 自动全链**（设计 → 评审代点火 → 修正 → §4 代签 → 实施派发 → 复核 → 收口核销 ∥ 双推提交）。自缚：新范围 / 用户口径裁决 ⇒ 停；破坏性 ⇒ 先停。

**六面（= 需求档 §2:15 / AC-15）**：① 向量服务可见面（卡 + 试跑 + endpoint 区分）∥ ② 用量看板升级（趋势/聚合/排行/导出）∥ ③ 管理总览（`/admin/overview` 落地页）∥ ④ 审计/安全面（事件落库 + `/admin/audit`）∥ ⑤ 健康可见（状态灯 + 系统页块 + 自动刷新）∥ ⑥ key 细节（最后使用/用量——`key_id` 归因存量已有）。

**关键判据**：零依赖（图表 = SVG/纯 CSS 手绘）∥ 服务端只加所需（事件表 v3 迁移 ∥ 聚合端点）∥ i18n 双表随新增键（zh/en 同步 ∥ en 零 CJK）∥ IA 服从 KD-SV-20（新页入列——导航/档目/测试随动）。

**边界（不做）**：引擎起停仍手动 ∥ 告警推送不做 ∥ 图表库不加 ∥ embeddings 转发/计量语义零改。

**父侧随政面（实施时同拍——跨批写门禁 ⇒ 父侧直接执行）**：`-console-providers.test.mjs`（nav 路径断言 + 静态档目断言）∥ `-webui-deploy.test.mjs`（档目断言）∥ `-server-i18n.test.mjs`（键集/键数断言）——设计轮登记。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-06 · 设计轮 initial）**

**本批条目（覆盖——需求 §2:15 六面 / AC-15；台账 #972）**：① 向量服务可见面 ∥ ② 用量看板升级 ∥ ③ 管理总览 ∥ ④ 审计/安全面 ∥ ⑤ 健康可见 ∥ ⑥ key 细节。**逐面设计落点**：
① = `docs/server/design/gateway/API.md` §2.4（`GET /api/admin/embedding` ∥ `POST /api/admin/embedding/test`）+ `docs/server/design/webui/WEBUI.md` §2.1/§2.3①（系统页向量卡 ∥ 用户面提示条 ∥ endpoint 列/过滤）；
② = `docs/server/design/metering/METERING.md` §3（`/api/usage/summary` ∥ `/api/usage/export`）+ `webui/WEBUI.md` §2.3②；
③ = `gateway/API.md` §2.4（`GET /api/overview`）+ `webui/WEBUI.md` §2/§2.3③（落地页变更）；
④ = `docs/server/design/store/STORE.md` §2 v3 + `docs/server/design/accounts/ACCOUNTS.md` §2.1/§3 + `webui/WEBUI.md` §2.3④；
⑤ = `webui/WEBUI.md` §2.3⑤ + `gateway/API.md` §2.3（`/api/system` 扩展）；
⑥ = `metering/METERING.md` §4⑥ + `accounts/ACCOUNTS.md` §4（`memberView` 归并）+ `webui/WEBUI.md` §2.3⑥。

**机制设计（要点与判定）**：
- **端点形（判定）**：总览/审计 = 各一专属端点（一次装配 ∥ admin 判权单处 ∥ 前端一跳）；用量趋势/聚合/排行与导出 = **服务端 SQL / 服务端 CSV**（前端算被否——明细分页上限 500 撑不起全量）；向量探活/试跑 = **服务端代发**（引擎 key 代持——浏览器零涉）；健康 = 复用公开 `/healthz`（前端 30s 轮询——零新端点）；key 细节 = **并入现有面**（`/api/me` ∥ `/api/members` 行形扩展——不设新端点）。
- **④**：v3 迁移段（`audit_events` 九型 CHECK + 快照名 + 三索引——含 `idx_usage_key_ts`）；写入点九处（HTTP 路由 + CLI，逐点坐标 = `ACCOUNTS.md` §2.1 表；`login_locked` 经 `login-guard` 的 `onLock` 回调）；保留 = 与用量同窗同清（`usageRetentionDays` 单旋钮同调度点）。
- **①**：配置真值经 admin 端点（零密钥字段）；探活/试跑单端点 + 诊断自含形（四 kind：timeout/unreachable/http_error/bad_response）；**不落库不计量**；引擎地址 = admin 面 ∥ 模型名经 `/api/system` 下发用户面（snippet 落 `#/me/usage` 提示条）。
- **③**：admin 登录落 `#/admin/overview`；`#/admin` 重定向同指；卡集六枚（今日请求/token ∥ 成员数 ∥ 健康 ∥ 更新 ∥ 快捷入口）。
- **⑤**：灯三态（绿/黄/红——黄 = 503 degraded）∥ 30s（`HEALTH_POLL_MS`）∥ meta 槽（`nav-health`）+ 系统页块 + 总览卡（`ctx.onHealth` 订阅）。
- **⑥**：`lastUsedAt`（MAX(ts)）∥ `windowTokens`（近 30 天窗——`KEY_USAGE_WINDOW_DAYS`）。

**受影响文件与测试面**：
- 产品面（24 档）：服务端 15（`store/db.mjs` ∥ `accounts/audit.mjs` 新 ∥ `accounts/routes.mjs` ∥ `routes-admin.mjs` ∥ `login-guard.mjs` ∥ `members.mjs` ∥ `metering/usage.mjs` ∥ `metering/routes.mjs` ∥ `gateway/embedding-admin.mjs` 新 ∥ `gateway/overview.mjs` 新 ∥ `gateway/system.mjs` ∥ `ops/cli.mjs` ∥ `bin/thincoder-server.mjs` ∥ `package.json` ∥ `README.md`）+ 前端 11（`app.mjs` ∥ `nav.mjs` ∥ `views-me.mjs` ∥ `views-admin.mjs` ∥ `views-system.mjs` ∥ `views-usage.mjs` 新 ∥ `views-overview.mjs` 新 ∥ `views-audit.mjs` 新 ∥ `style.css` ∥ `i18n-zh.mjs` ∥ `i18n-en.mjs`）。逐档行数预算 = 各域档「本域文件与行数预算」节 + `design/PROJECT.md` §6 总账（推算 **≈6344 行 ∥ 53 档**——+6 新档；实施后回填轮校正）。
- 测试面：新批内件 `docs/batches/2026-10-06-console-completeness-2.test.mjs`（实施轮；写面受阻 ⇒ `.thincoder/tmp/` 父侧 copy——沿先例）；**随正五件（父侧——跨批写门禁）** = `-console-providers`（nav 断言 ∥ 静态档目 15/16） ∥ `-server-gateway-webui-deploy`（档目） ∥ `-server-i18n`（键集 ∥ labelKeys 9 ⇒ 11 ∥ JS 档单 ∥ 新三档直发） ∥ `-server-gateway-accounts`（key 行形断言五处） ∥ `-first-release-completeness`（`/api/system` 深比断言）——登记于 `PROJECT.md` §6 随动表。

**验收对照（AC-15 六面 → 设计判据行）**：① `gateway/API.md` §5 AC-15①③ 行 + `webui/WEBUI.md` §6 AC-15 行；② `metering/METERING.md` §4 AC-15② 行 + webui 同；③ `gateway/API.md` §5（总览与报表同源断言）+ webui 同；④ `accounts/ACCOUNTS.md` §5 AC-15④ 行 + `store/STORE.md` §3（v3 判据）；⑤ `webui/WEBUI.md` §6（灯三态 ∥ 浏览器实走 = 收口轮）；⑥ `metering/METERING.md` §4 AC-15⑥ 行 + webui 同。三链同源：本段条目 = 设计判据行 = 需求 §2:15/AC-15。

**关键决策（本批新增）**：KD-SV-27（用量报表 = 服务端聚合与导出）∥ KD-SV-28（审计事件 = 库表 v3 + 名快照 + 同保留窗）∥ KD-SV-29（可见面二轮 = 服务端聚合/代发 + 零依赖前端——CSS 柱 ∥ 三态轮询）∥ KD-SV-30（向量服务面 = 配置真值经 admin 端点 + 服务端代探/代试）——索引 = `PROJECT.md` §4（1–30）。

**上抛项 / 披露**：
- **R19（需求档回笔——待主 agent）**：AC-12 行与 §2:15③④ 冲突面——「管理 4 ⇒ 6 ∥ `#/admin` 重定向 ⇒ `/admin/overview` ∥ 静态九档 ⇒ 15/16」（「九档」自 i18n 轮后已陈）；设计侧行已随正（`webui/WEBUI.md` §6），需求档笔 = 主 agent。
- **R20（披露——需求措辞面裁定）**：§2:15④「成员增删」之「删」全库零既有路径（控制台/CLI 皆无成员删除——实核）；审计面只覆盖「增」（`member_create`）；「成员删除」功能不在任何功能点内——回笔 or 立后续项。
- **R21**：实施后回填轮（预算实读 ∥ 批内件行数 ∥ 随正五件核销）；**R22**：随正五件父侧落地登记。
- 非阻塞观察：`docs/README.md` 仓地图未见 server 行（R1 未办——先例在案；本批零触）。

**边界（不做——沿 §1 + 设计补充）**：引擎起停仍手动 ∥ 告警推送不做 ∥ 图表库不加（趋势 = 纯 CSS 柱）∥ embeddings 转发/计量语义零改 ∥ JSON 导出不另设（`/api/usage` 即 JSON 面）∥ 我的用量页不做趋势/聚合（管理面专属）∥ 成员删除功能不做（零既有路径）∥ 审计不做不可篡改面/告警推送 ∥ 总览不做图表。

**文档一致化去向**：七设计档同拍收正（`store/STORE.md` ∥ `metering/METERING.md` ∥ `accounts/ACCOUNTS.md` ∥ `gateway/API.md` ∥ `webui/WEBUI.md` ∥ `ops/OPS.md` ∥ `design/PROJECT.md`）——含三处存量语句收正（`METERING.md` §1「无归档/导出面」⇒ 导出在；§1「查询面零改」⇒ 端点面随本批；`ACCOUNTS.md` §2 事件日志句补审计同拍）；需求档零笔（回笔项 = 上抛 R19/R20）。

**§2 批次任务与设计（eng-designer · 2026-10-06 · fix 轮——评审 #69 十项处置）**

**随正清单补录（五件 ⇒ 七件）**：补 `docs/batches/2026-10-06-server-gateway.test.mjs`（网关基准件——v2 断言随本批 v3 迁移整体失效；断言改点：SCHEMA_VERSION/readVersion ⇒ 3 ∥ 索引数 3 ⇒ 6 ∥ migrate 返回 ⇒ 3 ∥ 失败探针 `v: 3` ⇒ `v: 4`（错误消息断言同步）∥ `:9`/`:164` 标题文本随正 ∥ `:170` 表清单补 `audit_events` ∥ `:208` readVersion 同型点——逐点登记 = `PROJECT.md` §6 注④⑤）∥ 补 `docs/batches/2026-10-06-server-auto-update.test.mjs`（`:480` 门禁件数 11 ⇒ 12 ∥ 断言消息「应列十一件」⇒ 十二件 ∥ `:9`/`:439` 段头注释同拍）。**门禁件数登记（确定入列——沿先例）**：本批件入 `prepublishOnly`——件数 11 ⇒ 12（十二件 = 八 + #962 件 + #963 件 + i18n 件 + #972 件）；落点 = `thincoder-server/package.json:13` 清单单行添项（添件不增行）；设计侧已同拍（`ops/OPS.md` §5.1 ∥ `design/PROJECT.md` §6）。

**行数标注（随正七件 + 新批内件）**：现值 ⇒ 预期增量：`-console-providers` 479 ⇒ ≤±4 ∥ `-webui-deploy` 322 ⇒ ≤±6 ∥ `-server-i18n` 298 ⇒ ≤±10 ∥ `-server-gateway-accounts` 493 ⇒ ≤±5 ∥ `-first-release-completeness` 497 ⇒ ≤±3 ∥ 基准件 `-server-gateway` **496**（实读收正——原「486 行」陈）⇒ ≤±2 ∥ `-server-auto-update` 498 ⇒ ≤±1；新批内件（拟新增）估算 ≈450 行；越 500 硬线预案 = 基准件抽 `③ db 迁移链` 段独立成件 ∥ `-accounts` 抽 CLI/入口段独立成件（沿按域拆档先例）。

**合数/档数口径注明**：产品面 = **24 代码档 + `package.json` ∥ `README.md` 两非代码档 = 26 条目**（服务端 15 = 13 代码 + 2 ∥ 前端 11 = 全代码）；合数收正 ≈+1237 ⇒ **≈+1270**（分项和）；`package.json` +1 = 清单添件项——落点 = `prepublishOnly` 单行（行数不增）。

**设计档同拍收正**：`design/PROJECT.md`（KD-SV-20 ⇒ 九页 ∥ §6 随正七件行 + 注①–⑤ ∥ §9 R21/R22 七件）∥ `webui/WEBUI.md`（KD-SV-20 管理列举补「总览/审计」∥ AC-12 行残留删 ∥ 档目行注「本批后 ⇒ 15 ∥ 16」）∥ `accounts/ACCOUNTS.md`（§3 两行 key 行形补 `lastUsedAt`/`windowTokens`——单源 = `memberView`）∥ `metering/METERING.md`（AC-15② 补判权三态）∥ `gateway/API.md`（AC-13③ 补 `embedding` 字段）∥ `ops/OPS.md`（§5.1 十二件）。

**口径**：七设计档逐点收正（登记/收正/删残留——零新语义）；需求档零笔；产品码/测试档零写（实施面未开）；随正七件 + 门禁清单文本 = 父侧实施轮落地；机检读数（改前后）= `PROJECT.md`/域档报告面。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（轮 1）**——范围 = 七设计档（`webui/WEBUI.md` ∥ `gateway/API.md` ∥ `store/STORE.md` ∥ `accounts/ACCOUNTS.md` ∥ `metering/METERING.md` ∥ `ops/OPS.md` ∥ `design/PROJECT.md`）+ 批档 §2；需求档不在审（六面覆盖按设计档内引用的 §2:15/AC-15 核对）；标注数 spot-check 通过（db 124 ∥ usage 147 ∥ app 240 ∥ nav 82 ∥ views-admin 139 ∥ package.json 26——与实读逐值一致）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 测试面完整性（受影响测试件） | 🔴 | 随正清单缺「网关基准件」：`thincoder/docs/batches/2026-10-06-server-gateway.test.mjs` 的 v2 断言随本批 v3 迁移整体失效——`assert.equal(DB.SCHEMA_VERSION, 2)`（:167）∥ `assert.equal(indexes.length, 3)`（:172）∥ 失败探针段 `{ v: 3, up: (handle) => {`（:205——与真 v3 同号后不再触发）∥ readVersion/migrate 返回值断言（:168 ∥ :186 ∥ :201）——与本批 STORE 判据「判据（批内件）= 空库结构版本读数 3」（`thincoder/docs/server/design/store/STORE.md:111`）正面冲突，而批档随正清单未列该件（`thincoder/docs/batches/2026-10-06-console-completeness-2.md:47`「随正五件（父侧——跨批写门禁）」）。 | 补入随正清单并登记断言改点：SCHEMA_VERSION/readVersion ⇒ 3 ∥ 索引数 3 ⇒ 6 ∥ migrate 返回 3 ∥ 失败探针段 `v: 3` ⇒ `v: 4`（错误消息断言同步）。 |
| 2 | 测试面完整性（门禁件数） | 🔴 | 本批件入 `prepublishOnly`（沿 11 件清单先例）后件数断言失效——`batchFiles.length, 11`（`thincoder/docs/batches/2026-10-06-server-auto-update.test.mjs:480`）；`thincoder/docs/server/design/ops/OPS.md:94`「批内件十一件（八 + #962 件 + #963 件 + i18n 件）」与 `thincoder/thincoder-server/package.json:13` 的清单（`"prepublishOnly": "node --check bin/thincoder-server.mjs` …）均无本批更新登记（`thincoder/docs/server/design/PROJECT.md:133` 同记「清单现十一件…」）；`package.json` 预算 `+1` 未说明落点（该清单为单行——添件不增行）。 | 随正清单补该件（件数 11 ⇒ 12 ∥ 注释同拍）；OPS §5.1 件数文本随正；package.json 清单添本批件并注明 `+1` 落点；若本批件确定不入列，亦在档内明示该口径。 |
| 3 | 文档一致性（决策索引） | 🟡 | KD-SV-20 两处索引行未随九页 IA 收正——`thincoder/docs/server/design/PROJECT.md:107`「控制台 IA = 侧栏分组导航 + 一页一职责（七页；hash 路由扩展；旧链重定向）」∥ `thincoder/docs/server/design/webui/WEBUI.md:137`「管理（成员/provider 与模型/用量统计/系统）」（缺总览/审计）——与 `PROJECT.md:62`「九页两区（`#/login` ∥ 我的三页 ∥ 管理六页——IA = `webui/WEBUI.md` §2）」及 §2 九页表并陈矛盾。 | 两处 KD-SV-20 行收正（七页 ⇒ 九页；管理页列举补 总览/审计）。 |
| 4 | 文档一致性（端点契约） | 🟡 | `thincoder/docs/server/design/accounts/ACCOUNTS.md` §3 未随 ⑥ 面字段扩展收正——`GET /api/members` 行仍记「各成员 key 清单（`[{ "id", "hint" }]`——提示形 + id；仅列未吊销）」（:65）∥ `GET /api/me` 行仅「本人 key 清单（提示形）」（:62）——与 `thincoder/docs/server/design/metering/METERING.md:47`「`/api/me` 与 `/api/members` key 行同形（单源 = `memberView`）」及 `webui/WEBUI.md:86`「管理列表同形，本批管理表不加列」不自洽（随正件按「key 行形断言五处」动）。 | 两行行形补 `lastUsedAt`/`windowTokens`（或注「行形 = `memberView`——含最后使用 ∥ 近 30 天用量」），与 AC-15⑥ 断言口径对齐。 |
| 5 | 验收标注（受影响文件行数） | 🟡 | 随正五件与新批内件均无行数标注（`PROJECT.md:156` 仅「随正（行数微动；实施后回填核销）」——无现值 ∥ 无 `≤±N`；新批内件无估算），其中数件已处 490+ 行量级（如 `-accounts` 493——`PROJECT.md:149` ∥ 基准件现读 ≈496），越 500 硬线与否不可判；另基准件标注「实读 486 行」（同行）与现读不符（spot-check：read 计 496 行）。 | 逐件补现值与预期增量（≤±N）+ 新批内件给估算；基准件读数收正；增后若越 500 行，于设计内附拆档计划。 |
| 6 | 数字漂移 | 🔵 | 合数/档数不自洽——`PROJECT.md:129`「产品面 ≈+1237（gateway ≈+185…」括号分项和 = 1270（185+153+144+36+702+49+1）；批档 `2026-10-06-console-completeness-2.md:46`「产品面（24 档）：服务端 15」与随附清单 15+11=26 项不一致（24/26 口径未说明）。 | 合数按分项收正（或注明口径差）；档数口径统一或注明（代码档 24 ∥ 条目 26）。 |
| 7 | 文档一致性（计数时点） | 🔵 | 档目口径同表并陈未注明时点——`webui/WEBUI.md:125`「口径 = UI 代码档 12 ∥ 含 favicon 全目录 13」与 `:127`「静态档目随正（15 ∥ 16）」（另 :129 AC-14 行同 12/13）——本批后口径应为 15 ∥ 16。 | 旧行补「本批后 ⇒ 15 ∥ 16」注（或统一为单一口径）。 |
| 8 | 验收判据（响应形） | 🔵 | `thincoder/docs/server/design/gateway/API.md:116` AC-13③ 行响应形未含本批新增字段——「会话 ⇒ 200 `{ version, update:{ mode, lastCheckAt, latest } }`」，而 §2.3 已定 `embedding: { model }`（:66）。 | 行内补 `embedding` 字段（或标「+ `embedding.model`」）。 |
| 9 | Doc hygiene（规范面残留） | 🟡 | 验收判据行残留修订式表述——`thincoder/docs/server/design/webui/WEBUI.md:127`「原「管理 4」语句随正」（AC-12 行内）；历史应归记录面（批档 §2 R19 与各档变更记录已有）。 | 删该括注（行内只留现值）。 |
| 10 | 验收判据（判权覆盖） | 🔵 | AC-15② 判据未含 summary/export 判权三态（`metering/METERING.md:46` 仅「四读端点同门」= endpoint 参数面）；同批其余新端点均断言（`gateway/API.md:117`「admin 三态（user ⇒ 403 ∥ 无会话 ⇒ 401）」∥ `accounts/ACCOUNTS.md:97`「判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）」）。 | 补一行判权三态断言（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）。 |

**计数**：🔴 2 ∥ 🟡 4 ∥ 🔵 4（共 10 条）。
**VERDICT: changes-required**

### 轮次 2（评审子代理）

**设计评审（轮 2——修正主张逐号核验；修正轮 #70 十项）**——范围 = 七设计档 + 批档 §2 修正块（:63–73）+ 随正件行数 spot-check；结论 = 旧项 10/10 Fixed；新增非阻塞 🔵×2；未决 🔴 = 0。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/batches/2026-10-06-server-gateway.test.mjs`（登记 = 批档 :65 ∥ `design/PROJECT.md` §6 注④⑤） | 🔴 | Fixed | 随正清单补录（五件 ⇒ 七件）＋断言改点逐点登记；现盘核对在位：`:167` `assert.equal(DB.SCHEMA_VERSION, 2)` ∥ `:172` `assert.equal(indexes.length, 3)` ∥ `:205` `{ v: 3, up: (handle) => {` ∥ `:207` `/迁移失败（v3）/)`（⇒3 ∥ ⇒6 ∥ ⇒`v: 4` ∥ 消息同步）。 |
| 2 | 2 | `ops/OPS.md`:94 ∥ `design/PROJECT.md`:133 ∥ `thincoder-server/package.json`:13 | 🔴 | Fixed | OPS "批内件十二件（八 + #962 件 + #963 件 + i18n 件 + #972 件）"；PROJECT "`prepublishOnly` 清单十二件（八 + #962 件 + #963 件 + i18n 件 + #972 件——本批件入列）"；落点登记 = 批档 :65（package.json:13 单行添项）；物改/测试文本（`:480` 11⇒12 ∥ `:9`/`:439` 注释）登记 = 实施轮父侧（批档 :73 口径）。 |
| 3 | 3 | `design/PROJECT.md`:107 ∥ `webui/WEBUI.md`:137 | 🟡 | Fixed | "（九页；hash 路由扩展；旧链重定向）" ∥ "管理（总览/成员/provider 与模型/用量统计/审计/系统）"。 |
| 4 | 4 | `accounts/ACCOUNTS.md`:62/:65 | 🟡 | Fixed | 行形 = "`memberView`：`{ id, hint, lastUsedAt, windowTokens }`" ∥ "行形同 `GET /api/me`——单源 = `memberView`"。 |
| 5 | 5 | 批档 :67 ∥ `design/PROJECT.md` 注①②③ | 🟡 | Fixed | 七件现值 + ≤±N、新批内件 ≈450、越 500 拆档预案齐；486 ⇒ 496 已收正（spot-check 残留 = 第 12 行）。 |
| 6 | 6 | `webui/WEBUI.md`:127 | 🟡 | Fixed | "原「管理 4」语句随正" 已删（现值 "管理 6（二轮后——§2）"）；历史句移入 :162（记录面）。 |
| 7 | 7 | `design/PROJECT.md`:129 ∥ 批档 :69 | 🔵 | Fixed | "产品面 ≈+1270（分项和）"；24/26 口径注明（残留 = 第 11 行）。 |
| 8 | 8 | `webui/WEBUI.md`:125/:129 | 🔵 | Fixed | "本批后 ⇒ 15 ∥ 16" 已注。 |
| 9 | 9 | `gateway/API.md`:116 | 🔵 | Fixed | AC-13③ 行含 "embedding:{ model }"。 |
| 10 | 10 | `metering/METERING.md`:46 | 🔵 | Fixed | AC-15② 含 "`summary`/`export` 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）"。 |
| 11 | (new) | 批档 :69 ∥ `design/PROJECT.md`:129/:136 | 🔵 | New | "`package.json` +1 = 清单添件项——落点 = `prepublishOnly` 单行（行数不增）。" vs "package.json **≈30 ⇒ 25 ⇒ 26 ⇒ 27**"（+1 行，且合数含 +1）——两口径未闭合，择一收正（非阻塞）。 |
| 12 | (new) | `docs/batches/2026-10-06-server-gateway.test.mjs` | 🔵 | New | 行数 spot-check：基准件 read 计 496（末内容行 `:495: })`）；其余六件均 = 标注 = read 计 −1（如 `-accounts`:493 标 ∥ read 计 494）⇒ 按「内容行 ∥ 文末换行不计」疑为 495（±1；未能完全判定，非阻塞）。 |

**计数**：旧项 10/10 Fixed（🔴×2 ∥ 🟡×4 ∥ 🔵×4）；New 🔵×2（非阻塞）；未决 🔴 = 0。
**VERDICT: pass**

### 轮次 3（评审子代理）

**轮 2 核验（分片 1/2：域档四项修正——只验修正主张，不猎新项）**

核验矩阵（修正主张 ⇒ 盘上证据 ⇒ 结论）：

| # | 域/修正主张 | 盘上证据（file:line） | 结论 |
|---|---|---|---|
| 1 | WEBUI · KD-SV-20 收正——管理列举补「总览/审计」 | `webui/WEBUI.md:137` 现读「组 = 我的（key/用量/账户设置）∥ 管理（总览/成员/provider 与模型/用量统计/审计/系统）」——六项，与 §2 表六页（:26–:31）同集 | ✓ 落盘 |
| 2 | WEBUI · 残留删——AC-12 行「管理 4」随正 | `webui/WEBUI.md:127` 现读「我的 3 ∥ 管理 6（二轮后——§2） ∥ admin 组仅 admin」；四域档内「管理 4」零残留（仅 :162 记录面存出处引文） | ✓ 落盘 |
| 3 | WEBUI · 时点注——档目行补「本批后 ⇒ 15 ∥ 16」 | `webui/WEBUI.md:125`「= i18n 三档叠加后；本批后 ⇒ 15 ∥ 16」∥ `:129`「档目随正（12 ∥ 13——本批后 ⇒ 15 ∥ 16）」；`:127`/`:130` 携目标值（15 ∥ 16）——12/13 + 三新档 = 15/16 算术自洽 | ✓ 落盘 |
| 4 | ACCOUNTS · key 行形（§3 两行） | `accounts/ACCOUNTS.md:62`「行形 = `memberView`：`{ id, hint, lastUsedAt, windowTokens }`」∥ `:65`「行形同 `GET /api/me`——单源 = `memberView`：提示形 + id ∥ `lastUsedAt` ∥ `windowTokens`；仅列未吊销」；与 `metering/METERING.md:47`（AC-15⑥）∥ `webui/WEBUI.md:86` 逐值同拍 | ✓ 落盘 |
| 5 | METERING · 判权三态（AC-15②） | `metering/METERING.md:46`「`summary`/`export` 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）」；与 :33/:34 端点表（admin）∥ `accounts/ACCOUNTS.md:73` 双角色规则互洽 | ✓ 落盘 |
| 6 | API · embedding 字段（AC-13③） | `gateway/API.md:116`「会话 ⇒ 200 `{ version, update:{ mode, lastCheckAt, latest }, embedding:{ model } }`」；与 :66 ∥ :70（§2.3）∥ :117（AC-15①③「含 `embedding.model`（两角色）且零地址字段」）同源 | ✓ 落盘 |

发现计数：🔴 0 ∥ 🟡 0 ∥ 🔵 0（六条细项全落，零新发现——严格限执行）

局限披露：无项目标准档 ∥ 无文档地图声明（Document ownership 判据降级——按 Project Guide 复核未见归属异常）。

VERDICT: pass

### 轮次 4（评审子代理）

**设计评审（轮 2 重跑 · 分片 2/2——登记面四项修正核验）**——范围 = `design/PROJECT.md`（随正七件登记 ∥ 门禁十二件 ∥ 行数标注 ∥ 合数收正）∥ `ops/OPS.md`（件数文本）∥ 批档 §2 修正块（:63–73）；引证面抽查 = 两测试件断点行 ∥ `thincoder-server/package.json:13` ∥ `store/STORE.md` v3 三索引；严格限 = 只验修正主张。结论 = 四项修正在盘 ∥ 引证逐点相符 ∥ 未决 🔴 = 0；残留 = 前轮在册 🔵×2（复核仍成立）。

**核验表**

| # | 修正主张 | 结果 | 证据 |
|---|---|---|---|
| 1 | 随正七件登记 | 在盘 ✅ | `design/PROJECT.md:156`（五件行）∥ `:157`（"随正七件（续——本 fix 轮补入两件）"）∥ `:159–164`（注①–⑤）∥ `:223`/`:224`（R21/R22 七件）；与批档 `:65` 声称一致 |
| 2 | 断点引证（基准件——注④⑤） | 逐点相符 ✅ | `docs/batches/2026-10-06-server-gateway.test.mjs`：`:164`（"五表 + 三索引 + user_version=2"）∥ `:167`（"assert.equal(DB.SCHEMA_VERSION, 2)"）∥ `:168` ∥ `:170` ∥ `:172`（"assert.equal(indexes.length, 3)"）∥ `:186` ∥ `:201` ∥ `:205`（"{ v: 3, up: (handle) => {"）∥ `:207` ∥ `:208` |
| 3 | 断点引证（自动更新件） | ✅ | `docs/batches/2026-10-06-server-auto-update.test.mjs`：`:480`（"assert.equal(batchFiles.length, 11, `prepublishOnly 应列十一件：${batchFiles.length}`)"）∥ `:9`/`:439` 段头"prepublishOnly 十一件" |
| 4 | 门禁十二件 | ✅ | `design/PROJECT.md:133`（"`prepublishOnly` 清单十二件（八 + #962 件 + #963 件 + i18n 件 + #972 件——本批件入列）"）∥ `ops/OPS.md:94`（"批内件十二件（八 + #962 件 + #963 件 + i18n 件 + #972 件）"）∥ 在盘 `thincoder-server/package.json:13` 单行现 11 件（八 + 三）——添件不增行可行 |
| 5 | 行数标注 | ✅ | `design/PROJECT.md:159–161`（七件现值 + ≤±N ∥ 新批内件 ≈450 ∥ 拆档预案）；spot-check（read 计 ⇒ 标注）：479(480) ∥ 322(323) ∥ 298(299) ∥ 493(494) ∥ 497(498) ∥ 498(499) 六件全符（read−1）；基准件 496(496) 见残留 #2 |
| 6 | 合数收正 | ✅ | `design/PROJECT.md:129`（"产品面 ≈+1270（gateway ≈+185 ∥ accounts ≈+153 ∥ metering ≈+144 ∥ store ≈+36 ∥ webui ≈+702 ∥ ops ≈+49 ∥ package.json +1"）= 分项和 1270 ∥ `:135` 合计 ≈6317 ∥ `:136` 总账 ≈6344 = 5074+1270 = 6317+27；规范面无 1237 残留（`:250`/`:251` 记录面在册） |
| 7 | OPS 件数文本 | ✅ | `ops/OPS.md:94` 十二件；记录面 `:298`（"十一件 ⇒ 十二件"）；规范面无「十一件」残留 |
| 8 | 批档修正块 | ✅ | 批档 `:63`/`:65`/`:67`/`:69`/`:71`/`:73` 与盘逐点一致（含 `:69` "24 代码档 + `package.json` ∥ `README.md` 两非代码档 = 26 条目"口径注明） |

**残留（非阻塞——前轮在册，本轮复核仍成立）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 数字口径（前轮 #11） | 🔵 | `package.json`「+1」（`design/PROJECT.md:129`/`:136` "≈30 ⇒ 25 ⇒ 26 ⇒ 27"）与批档 `:69` "落点 = `prepublishOnly` 单行（行数不增）"两口径未闭合（在盘落点 = 单行添项，行数实不增） | 择一收正：或删合数 +1，或删除「行数不增」括注 |
| 2 | 行数标注（前轮 #12） | 🔵 | 基准件标注 496 与「内容行 ∥ 文末换行不计」口径疑差 +1（末内容行 `:495`；其余六件均 = 标注 = read 计 −1） | 复核后收正 495 或注明计数口径 |

**计数**：🔴 0 ∥ 🟡 0 ∥ 🔵 2（均前轮在册残留，非新增）。
**VERDICT: pass**

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（G 面=网关运维管 · 七档+临时探针；审计 1 轮 CLEAN · advisor 1 轮 pass（修复后终态 clean）；门禁第 12 件待 T 面落地（在册））



**§5 实施记录（eng-coder · 2026-10-06 · 实施轮 initial —— S 管 = 服务端核心管）**

**交付摘要**：八档全部落盘（v3 事件表 + 审计面 + 用量报表/导出 + key 归因）；测试档零写 ∥ 需求/设计档零笔 ∥ 他面（gateway/ops/public/bin）零触。终态 = **clean**（内部偏差审计 1 轮 clean ∥ advisor 代码评审 1 轮 pass ∥ fix 轮 0）。

**逐档改动坐标（file:line——供 T 面批内件 + 父侧随正对照）**：

| 档 | 改动坐标 |
|---|---|
| `src/store/db.mjs`（143 行） | `DDL_V3`（`audit_events` 九型 CHECK + 名快照 + 三索引，逐字 = STORE.md §2 v3 段）`:72-88` ∥ 迁移链追段 `{ v: 3, up }` `:93` ∥ `SCHEMA_VERSION` 自动 ⇒ 3 `:97` |
| `src/accounts/audit.mjs`（新——108 行） | `AUDIT_TYPES` 九型 `:12-22` ∥ `AUDIT_LIMIT_DEFAULT/MAX` = 100/500 `:24-25` ∥ `recordAudit(db, { type, actor, actorId, target, targetId, detail, ts })` `:33-43` ∥ `queryAudit(db, { type, memberId, from, to, limit })` `:50-90`（member 匹配 actor_id∥target_id `:61` ∥ 倒序 `:77` ∥ 行形 `{id,ts,type,actor,actorId,target,targetId,detail}` `:80-89`）∥ `pruneAuditEvents(db, { now, retentionDays })` `:94-99` |
| `src/accounts/routes.mjs`（112 行） | `memberView` key 行归并（`keyStats` 一次装配参数；`{id,hint,lastUsedAt,windowTokens}`）`:31-47` ∥ 审计写点：`login_failure :69` ∥ `login_success :73` ∥ `password_change :100` ∥ `key_rotate :109` |
| `src/accounts/routes-admin.mjs`（95 行） | `resolveMemberFilter` `:21-26` ∥ `auditQueryOf`（type/member/from/to/limit）`:30-40` ∥ `/api/members` keyStats 一次装配 `:49-50` ∥ 写点：`member_create :62` ∥ `key_revoke :75` ∥ `password_reset :87` ∥ `GET /api/audit` 注册 `:91-94` |
| `src/accounts/login-guard.mjs`（125 行） | `onLock = null` 参数 `:36` ∥ 置锁处回调 `onLock?.({ username, ip, dimension, retryAfterS })` `:82`（固定窗不重复触发） |
| `src/accounts/members.mjs`（166 行） | `countMembers(db)` `:100-102` |
| `src/metering/usage.mjs`（278 行） | 常量 `USAGE_SUMMARY_DAYS/KEY_USAGE_WINDOW_DAYS/USAGE_EXPORT_MAX` `:17-19` ∥ `buildUsageWhere`（四读同源）`:96-121` ∥ `mapUsageRow` `:123-141` ∥ `queryUsage`（+endpoint）`:144-153` ∥ `usageTotals(db, { from })` `:155-161` ∥ `localDayStart` `:165-171` ∥ `usageSummary` `:186-222` ∥ `exportUsageRows`（上限常量注入口径）`:228-233` ∥ `keyUsageStats` `:240-255` ∥ `parseUsageEndpoint` `:274-278` |
| `src/metering/routes.mjs`（111 行） | `resolveMemberFilter` `:16-20` ∥ `usageFiltersOf`（四读同门）`:30-38` ∥ CSV（表头 `:41` ∥ 转义 `:44-48` ∥ 序列化 CRLF+BOM `:51-71`）∥ summary 注册 `:88-91` ∥ export 注册 `:93-98` ∥ me/usage 注册 `:76` |

**自跑读数（命令 + 结果）**：
- `node --check` ×8（lint 逐档）：全 `Syntax OK`。
- v3 迁移直驱（临时库 · execute 实跑）：空库 ⇒ `user_version=3` ∥ 索引 6 枚（含 `idx_audit_ts` ∥ `idx_audit_type_ts` ∥ `idx_usage_key_ts`）∥ v1/v2 旧库启动自动升 ⇒ 3 ∥ 升后再开幂等 ∥ 九型 CHECK 拒外型 ∥ 九型全可插 + `target_name` 缺省空串 —— **20/20 PASS · FAILURES: 0**。
- 审计/报表 HTTP 直驱（in-process 服务 + fetch · fixture 3 members ∥ 2 keys ∥ 3 usage rows）：审计八型 13 行落库（`key_issue` 归 CLI/G 面）∥ `GET /api/audit` 行形/倒序/`type`·`member`（展示名 = id 同集）·`from`·`limit` 过滤/判权三态（401 ∥ 403 ∥ 200）全过 ∥ summary：totals{} ∥ trend 30 槽零填充（今日 {2,150} ∥ 昨日 {1,0}——SQL localtime = JS 本地日一致）∥ byModel/byMember 降序逐值 ∥ endpoint 同门 + 非法 400 ∥ 空态 ∥ `usageTotals(db,{from:localDayStart(now)})` = 同源 —— 全过 ∥ export：`text/csv; charset=utf-8` + `attachment; filename="usage.csv"` ∥ 表头逐字 ∥ ISO ts(UTC) ∥ CRLF ∥ **原始字节核 BOM = EF BB BF** ∥ NULL token 空单元格 ∥ 超上限 ⇒ 400「收窄时段」∥ 空集仅表头 ∥ 判权三态 ∥ me/usage·usage endpoint 过滤 ∥ key 行 `lastUsedAt/windowTokens` 单源（从未使用 ⇒ null/0）∥ `pruneAuditEvents` 窗外删/窗内留/null 零删 ∥ `countMembers` —— 全 PASS。
- 测具自身修正 2 处（非产品码）：write 端点须 JSON content-type；fetch `res.text()` 按编码规范剥 BOM ⇒ 改按原始字节核。

**决策透明表（设计未钉死处的实现取法——供回填/复核）**：

| # | 项 | 取法 | 依据 |
|---|---|---|---|
| 1 | 审计名快照 forms | login 三型 = 提交用户名 ∥ 成员型（key_rotate/password_change）= 本人展示名 ∥ 管理型 = admin 展示名 ∥ target = 展示名 ∥ CLI = `cli` | STORE DDL 注释「用户名 ∥ 展示名 ∥ 'cli'」+ §2.1 表逐行（login 行显式写 username） |
| 2 | `recordAudit` 校验 | `type` ∈ 九型（Error）∥ `actor` 须 string（容许空串——空提交名边界不炸 500）∥ `target` 缺省 `""` | 防编码错误（对齐 `recordUsage` 校验先例） |
| 3 | summary 缺省窗 | 近 30 天 = 今日起回溯 30 个本地日（`localDayStart(now, -(30-1))`——含今日 30 槽） | 「按日…零填充全序列」+ 趋势 30 柱直觉（设计仅「近 30 天」——登记披露） |
| 4 | summary 仅给 `to` 时 | 缺省 `from` 仍锚 `now`（交窗 [now−30d, to]） | 字面「时段缺省」；评审 🔵#5 登记建议改锚 `to`——未自改（见下） |
| 5 | trend 日归并 | SQL `strftime('%Y-%m-%d', ts/1000, 'unixepoch', 'localtime')` GROUP BY + JS 本地日键零填充 ∥ 日槽迭代 = 正午锚进位（时区跳变不跨日） | KD-SV-27（服务端 SQL）；直驱实证 SQL/JS 同日 |
| 6 | byModel/byMember 降序 | `total_tokens DESC, 名称 ASC`（平手定序） | 「降序即排行」+ 可复算定序 |
| 7 | export 行序 | `ts DESC, id DESC`（同明细口径） | 「同过滤面」一致性 |
| 8 | `windowTokens` 窗 | 滚动 `now − 30×24h`（异于 summary 日界窗——登记披露） | 「近 30 天」duration 直读 |
| 9 | 审计 limit | 复用 `parseUsageLimit`（100 ∥ 正整数校验）+ `queryAudit` 夹 500 | 「沿用量口径」 |
| 10 | `localDayStart` 导出 | 供 G 面 `overview.mjs`「今日」窗（`usageTotals(db, { from: localDayStart(now) })`）**同源** | gateway/API.md §2.4「同一聚合函数」 |

**审计与代码评审轮次与终态**：
- 内部偏差审计（explore · 1 轮 · read-only）：**clean** —— 九写入点在位/参数逐值 ∥ DDL 逐字 ∥ 端点契约 ∥ 零越界/零新依赖 ∥ 零静默降级；登记项仅行数预算残差（归回填轮）。
- advisor 代码评审（1 轮 · 评审面 = 本八档）：**VERDICT pass** —— 🔴 0 ∥ 🟡 1（可选，非 must-fix：`resolveMemberFilter` 双份实现 `metering/routes.mjs:16` ∥ `routes-admin.mjs:21`）∥ 🔵 5（模板字面量键注释理由不可核 ∥ `recordAudit` 显式 `target:null` 无兜底 ∥ 两「近 30 天」窗形未钉 ∥ 仅 `to` 的缺省窗锚 `now` ∥ 行数超设计预算标注）。
- fix 轮：**0** —— 审计 clean；评审零 must-fix ⇒ 六项可选发现**保持冻结不自改**（改码会使已评审修订失配），全部登记上抛（见下）。
- 终态：**clean**。

**披露 / 上抛（父侧）**：
1. **G 面依赖**（接线未落即功能缺口）：`bin/thincoder-server.mjs` 须（a）`onLock` 接线落 `login_locked`（读 `{username, ip, dimension, retryAfterS}`；建议 `findMemberByUsername` 解析 `actorId`——同 login_failure 口径）；（b）`pruneAuditEvents(db, { retentionDays: config.usageRetentionDays })` 启动 + 24h 同调度点；（c）CLI 四命令 `recordAudit`（契约 = `{ type, actor: "cli", actorId, target, targetId, detail }`——`target` 无对象用 `""` 勿传 null）。
2. **评审可选发现（登记不自改）**：`resolveMemberFilter` 双份（建议抽共享）；两「近 30 天」窗形（AC-15⑥ 建议钉死窗形）；仅 `to` 时缺省 `from` 锚 `now`（建议改锚 `to`）；`recordAudit` 对显式 `target:null` 无兜底（现调用点均正确）；模板字面量键注释所引「批内件扫描正则」现盘不可核（T 件落地后复核）。
3. **读数回填（R21）**：`usage.mjs` 实读 278 行 vs 设计估 ≈230（实际 +131 vs 估 +83）∥ `audit.mjs` 108 vs ≈90 —— 回填轮按实读收正（均在 300 软线内，无需拆档）。
4. **设计档陈句（父侧文档层）**：`ACCOUNTS.md:109` KD-SV-21 理由「内存 = 零表零写（登录热路径不落库）」与本批 login 写点并陈相抵——建议加限定「限守卫计数（阈值状态）」。
5. **批内件（T 面）落点**：`docs/batches/2026-10-06-console-completeness-2.test.mjs` 现盘不存在（glob 零命中）——上表 file:line 坐标即其驱动面。

**§5 实施记录（eng-coder · 2026-10-06 · G 面 = 网关运维管）**

**交付摘要（七档——逐档 file:line 坐标）**：

- `thincoder-server/src/gateway/embedding-admin.mjs`（**新 96 行**——批预算 ≈110）：`GET /api/admin/embedding`（`:44`-`:47`——`{ baseURL, model }` 配置真值、`apiKey` 零下发）∥ `POST /api/admin/embedding/test`（`:49`-`:95`——服务端代发 `:57`-`:62` ∥ 四 kind 归类 `:64`/`:70`-`:74`/`:81`/`:88` ∥ 自含 200 形 `:24`-`:26` ∥ 超时 10s `:18`/`:54` ∥ 不落库不计量——全档零 usage/quota 依赖）。
- `thincoder-server/src/gateway/overview.mjs`（**新 27 行**——批预算 ≈70）：`GET /api/overview`（`:19`-`:26`）——`today` 同源 = `usageTotals` + `localDayStart`（`:21`）∥ `members.count` = `countMembers`（`:24`）∥ 判权 `requireAdmin`（`:20`）。
- `thincoder-server/src/gateway/system.mjs`（55 ⇒ **57 行**）：`/api/system` 响应补 `embedding: { model }`（`:55`）；注册参 `embedding`（`:33`）只读 `.model`——地址不下发。
- `thincoder-server/src/ops/cli.mjs`（179 ⇒ **189 行**）：四审计写点——`member_create`（`:78`）∥ `password_reset`（`:106`）∥ `key_issue`（`:130`）∥ `key_revoke`（`:140`-`:141`，对象 = key 失主）；`actor = "cli"`、无对象 target = `""`（行形 NOT NULL）。
- `thincoder-server/bin/thincoder-server.mjs`（153 ⇒ **176 行**）：审计清理启动一次 + 24h 同调度点（`:106`-`:121`——周期独立捕获 `audit_prune_failed`）∥ `onLock` 审计接线（`:124`-`:134`——`actorId` 经 `findMemberByUsername` 解析，同 `login_failure` 口径）∥ 系统面 `embedding` 注入（`:143`）∥ 两注册行（`:145`-`:146`）。
- `thincoder-server/package.json`（**26 行——行数不增**）：`prepublishOnly` 清单 11 ⇒ **12 件**（`:13` 单行添项 = `docs/batches/2026-10-06-console-completeness-2.test.mjs`）。
- `thincoder-server/README.md`（241 ⇒ **244 行**）：§6 控制台节随正（九页 ∥ 状态灯 30s 三态 ∥ 审计页 ∥ 旧链 `#/admin ⇒ #/admin/overview`——`:104`-`:110`）∥ §10 向量调用句（用户面 `#/me/usage` 提示条 ∥ 管理面 `#/admin/system` 卡——`:197`-`:198`）。
- 临时证据（非交付档、gitignore 内）：`.thincoder/tmp/cc2-g-probe.mjs`——38 断言。

**自跑读数（命令 + 结果）**：① `node --check` ×5（system ∥ embedding-admin ∥ overview ∥ cli ∥ bin）+ `JSON.parse(package.json)` ⇒ 全绿；门禁件数实读 = **12**。② `node .thincoder/tmp/cc2-g-probe.mjs` ⇒ **38/38 全绿**：四 kind 实读（A7 http_error ∥ A8 bad_response ∥ A9 unreachable ∥ A10 timeout）∥ 配置真值零密钥（A1 ∥ D5）∥ 判权三态（A2/A3/A11/A12 ∥ C4/C5）∥ 同源断言（C2：`overview.today` = `usageTotals` 同窗逐值）∥ 空窗 0（C3）∥ 真实 bin 冒烟（D1 `/healthz` 200 ∥ D3 `/api/system` 200 含 model 零地址零密钥 ∥ D4 `/api/overview` ∥ D5/D6 向量面 ∥ D7 `/v1/models` 200 旧端点 ∥ D8 `login_locked` 审计 actorId 解析）∥ CLI 四命令审计 + `pruneAuditEvents`（E1-E8）。③ 回归快跑（只读）：`-first-release-completeness` 14 件 12 过——失败 2 = `/api/system` 深比（随正 R22 在册）∥ 系统页描述符（F 面前端在途）；`-server-gateway` 13 件 11 过——失败 2 = db v2⇒v3 断言（随正注④⑤在册）；`-server-gateway-accounts` 13 件 11 过——失败 2 = key 行形（随正「key 行形五处」在册）；其 CLI 七命令实跑件全绿。零新增回归。

**决策透明（实施微决策）**：

| 决策 | 内容 | 依据 |
|---|---|---|
| 跨写者接口 | 按 ask 所得契约落（`usageTotals(db,{from})` ∥ `countMembers(db)` ∥ `recordAudit(db,{type,actor,actorId,target,targetId,detail})` ∥ `pruneAuditEvents(db,{retentionDays})` ∥ `onLock(info={username,ip,dimension,retryAfterS})`）——与 S 落盘逐项对拍一致（R1/R4） | 父侧确认（#74）∥ S 落盘签名 |
| 超时判据 | `AbortSignal.timeout` + `signal.aborted`（实证：timeout ⇒ aborted=true ∥ 拒连 ⇒ TypeError 且 aborted=false） | 沿发现家族同机制（§2.4「超时 10s 沿发现家族」） |
| http_error 消息 | 带响应摘录（≤200 字符） | 「不吞细节」（KD-SV-30） |
| 审计周期失败日志名 | `audit_prune_failed`（独立捕获——互不拖累） | 设计未点名——沿 `usage_prune_failed` 样式 |

**fix rounds（内部）**：R1 = 审计调用侧对 S 落盘签名对齐（`target: null ⇒ ""`（`target_name NOT NULL`）∥ `detail: null ⇒ {}`；cli ×2 ∥ bin ×1）∥ R2 = `overview.mjs` 日界改用 S 的 `localDayStart`（同源收口、去重复机制）∥ R3 = advisor 后修复（bin 补传 `log` ∥ README §10 落点 ∥ textExcerpt 注释精确化 ∥ 探针 ROOT 改相对）∥ R4 = `login_locked` actorId 解析（`findMemberByUsername`——同 login_failure 口径）+ 探针补断言。

**审计与代码评审轮次与终态**：
- 内部 explore 分歧审计：**1 轮 · CLEAN**（四类偏差零命中；提示 = 门禁第 12 件未落盘（T 面）∥ `OPS.md:94` 措辞系既有（非本批）∥ 预算估算差（R21）∥ 探针清理项）。
- 内部 advisor 代码评审：**1 轮 · VERDICT pass**（🟡×2 ∥ 🔵×4；无 🔴）。响应：🟡#2（bin 漏传 log）已修 ∥ 🔵#3/#4/#6 已修 ∥ 🟡#1（门禁第 12 件）与 🔵#5（行数漂移）不修——归 T 面/父侧与 R21 回填轮（见披露）。
- 终态：**clean**（修复后复跑 38/38 + node --check 全绿）。

**披露/上抛（非阻塞）**：
1. **门禁链当前跑红（协调项）**：`package.json:13` 第 12 件 `docs/batches/2026-10-06-console-completeness-2.test.mjs` 盘上未落（T 面在途）——`npm run prepublishOnly` 会因缺档失败；T/父侧落地后自消（G 面测试档零写）。
2. **行数实读 vs 设计估算（R21 回填轮收正）**：system 57（≈60）∥ overview 27（≈70）∥ embedding-admin 96（≈110）∥ cli 189（≈195）∥ bin 176（≈172）∥ README 244（≈255）∥ package.json 26（「+1 行」口径实落 = 单行添件、行数不增——前轮 🔵#11 可据此收口）。
3. **规格面（父侧写域）**：`-first-release-completeness` 的 `/api/system` 深比需按新形 + `embedding` 注入面随正（R22 在册）；`-server-gateway-accounts` key 行形五处随正（在册）——均为父侧写域。

**§5 实施记录（eng-coder · 2026-10-06 · F 面——控制台前端管）**

**交付摘要（11 档 = 8 改 + 3 新；全在 `thincoder-server/public/`）**

新三档（机制 = `WEBUI.md` §2.3）：
- `views-usage.mjs`（139 行）：管理·全队用量看板——过滤 + 端点（`:21-38`）∥ 明细/报表同拍（`:44-60`）∥ 概览卡 + 纯 CSS 柱趋势（`:78-102`）∥ 聚合/排行两表（`:109-115`）∥ 导出 blob（`:117-139`）；自 `views-admin.mjs` 迁出。
- `views-overview.mjs`（74 行）：总览六卡（`:29-35`）∥ `GET /api/overview` 三值（`:37-45`）∥ 健康卡订阅（`:19-27`）∥ 更新卡（`:53-60`）∥ 快捷入口五链（`:62-74`）。
- `views-audit.mjs`（88 行）：过滤三轴 + 九型下拉（`:27-48`）∥ 五列表（同名「—」）（`:60-72`）∥ 按型详情模板（`:80-88`）∥ 空态（`:63`）。

改档（8）：
- `app.mjs`（240 ⇒ 299）：健康轮询块（`:92-140`——`HEALTH_POLL_MS`/三态/`#nav-health` 直更/`onHealth` 订阅）∥ 三新档接线（`:19-21` ∥ `PAGES` 九页 `:205-216`）∥ route 启动轮询 + 清订 + 灯回填（`:258-271`）∥ fail/logout 停轮询（`:192-201`/`:274-287`）。
- `nav.mjs`（82 ⇒ 87）：管理 6（`:19-26`）∥ `#/admin` ⇒ `/admin/overview`（`:32`）∥ 默认页收正（`:37-40`）∥ meta 槽 `#nav-health`（`:82`）。
- `views-system.mjs`（60 ⇒ 168）：四节（`:161-168`）——向量卡（`:41-109`：配置真值 ∥ 自动探活 + 重新检测 ∥ snippet ∥ 用法 ∥ 试跑 ∥ kind 四分类）∥ 服务健康块（`:111-136`）。
- `views-me.mjs`（87 ⇒ 117）：key 行细节（`:21-31`——最后使用/从未使用/近 30 天）∥ 用量页端点过滤（`:58-78`）∥ 向量提示条（`:81-89`）。
- `views-admin.mjs`（139 ⇒ 100）：用量页迁出（管理表零改——§2.3⑥）。
- `style.css`（89 ⇒ 122）：灯三色点（`:82-87`）∥ 卡集/柱图/细节行/提示条（`:89-113`）。
- `i18n-zh.mjs`（198 ⇒ 292）∥ `i18n-en.mjs`（194 ⇒ 288）：新增 84 键（vector 20 ∥ health 10 ∥ overview 8 ∥ usageReport 14 ∥ audit 27 ∥ nav 2 ∥ me.keys 3）；两表键集相等（250 ⇔ 248，差 = 自称名族 2）。

**决策透明（实施轮新增）**：① 查询键 `from`/`to` 以模板字面量书写——沿 D1 件扫描正则先例（行为等价；src 侧同形注释同拍）；② me/usage 端点过滤 = 即选即查（单控件；管理页多字段面走提交钮）；③ 系统页节序 = 版本/接入/向量/健康（照 §2.1 列举序）；④ 灯未知态 = 中性灰 + 空文案（瞬时——登录即轮询收敛）；⑤ 试跑与可达性共用单端点渲染（kind 四分类单源 `KIND_KEYS`）；⑥ audit 详情 = 在场字段渲染（等效按型模板）。

**审计与代码评审轮次与终态**：
- 内部 explore 偏差审计（只读）：**clean**——四类偏差零命中（逐条对照矩阵 12 行 + 局限披露 7 条）。
- advisor 代码评审（type=code，同步）：**pass**——0 🔴 ∥ 0 must-fix 🟡 ∥ 5 🔵（可选）。响应表：① statCard 双实现 / ② snippet 双拼串 / ⑤ pollHealth 守卫超时 = **Deferred**（共享助手落点受制：`app.mjs` 贴 300 软线 + 批令「除新三档外不新增 JS 档」——建议下个控台批收编/登账）；③ audit >100 静默截断提示 = Deferred（设计 §2.3④ 未要求——非缺口）；④ app.mjs 贴线 + §5 预算漂移 = **非缺陷**（未越线；读数收正归 R21 回填轮——批档 `:56` 已登记）。
- **fix round：0 轮**（两审计零必修项；🔵 全量响应表在案）。

**机检读数**：`node --check` 10/10 绿（服务端零触）；专项自检 `.thincoder/tmp/f-verify.mjs`（临时件——gitignored）**ALL PASS**：档目 16（UI 代码档 15）∥ `public/**` 零 http(s):// 与 @import ∥ 两表键集/占位符/en 零 CJK ∥ t 字面量 + 裸点分闭包 ∥ import 图 + D1 预检 ∥ nav 直驱（管理 6 ∥ `#/admin` ⇒ overview ∥ 默认页 ∥ denied ∥ labelKey 11）∥ 七页描述符冒烟 ∥ 逐档 ≤300。`node --test docs/batches/2026-10-06-server-i18n.test.mjs` = **4/6 绿**——两红 = 存量断言（JS 档单 8 ⇒ 11 ∥ labelKeys 9 ⇒ 11），系本批登记的**父侧随正项**（批档 §2 `:47`/`:65`），非本面缺陷。

**越清单披露**：零（实触 = 声明 11 档 + `.thincoder/tmp/` 临时自检件；`index.html`/服务端/测试档/需求设计档零触）。**零写测试档**（T 管）。

**§5 实施记录（eng-coder · 2026-10-06 · T 管 = 批内件管——AC-15 六面判据载体）**

**交付摘要**：新档 `docs/batches/2026-10-06-console-completeness-2.test.mjs`（**499 行** ≤500 硬线；产品码零写 ∥ 他批测试档零触 ∥ 需求/设计档零笔 ∥ `.thincoder/tmp/` 零件）。终态 = **clean**（内部偏差审计 1 轮 findings 3 → 全修 ∥ advisor 代码评审 1 轮 pass ∥ fix 轮 2（advisor 后两项））。

**逐面覆盖坐标（file:line——断言 ↔ 判据）**：

| 面（腿 ↔ 轴） | 落点 | 断言要点 |
|---|---|---|
| ① store v3（STORE §3） | `:147-180` | 空库直落 3 + 六索引（含 v3 三索引）+ 九型 CHECK 全可插/枚举外拒 ∥ v2 旧库启动升 3（旧数据保留）∥ `DB.migrate` 幂等 ⇒ 3 ∥ 保留清理注入时钟（窗外 9 删 ∥ 窗内留 ∥ `null` 零删） |
| ② 审计 = AC-15④ | `:183-260` | **真 bin 起停**（`onLock` 真装配）——九型写入点实走：HTTP login 成/败/锁（5 连败 ⇒ 429 + `Retry-After`）+ rotate/password_change + revoke/reset/create ∥ CLI 四命令（actor=cli）∥ `/api/audit` 19 行/倒序/行形/过滤三轴（type ∥ member 名·id ∥ 时段）/limit/非法 400/判权三态 ∥ **启动清理同窗**（config `usageRetentionDays: 5` ⇒ 窗外 probe-gone 删 ∥ 窗内 probe-keep 留） |
| ③ 报表 = AC-15② + key 归因 = AC-15⑥ | `:266-341` | summary totals/trend 30 槽零填充/末槽逐值/byModel·byMember 降序 + **与明细归并同源** ∥ endpoint 四读同门（含 `/api/me/usage` 非法 400）∥ 判权三态 ∥ CSV 表头逐字/行数/CRLF/**BOM 原始字节**/ISO ts/NULL 空单元/**RFC 4180 转义**（`prov/b, "x"`）/attachment ∥ 空集仅表头 ∥ 行数上限 400「收窄时段」∥ key 行 `/api/me` ∥ `/api/members` 同形 + `MAX(ts)`/30 天 SUM 逐值 + **从未使用 ⇒ null/0**（第二枚 key） |
| ④ 总览 = AC-15③ | `:345-368` | 空集 0（零错）∥ 注入行集数值逐值 ∥ 与报表 trend 末槽同值 ∥ `usageTotals` 直调同源 ∥ 判权三态 |
| ⑤ 向量面 = AC-15① | `:372-431` | 真值 `{baseURL, model}` 零密钥 ∥ 试跑成功（出站逐值：引擎 URL ∥ `Bearer` 代持 ∥ `{model, input}`）∥ 四 kind 失败分类 + 形不符 ∥ **不落库不计量**（usage 零行）+ **配额零涉**（配额 0 照通）∥ `/api/system` 两角色含 `embedding.model`、零地址零密钥、键集全等 ∥ `/v1/models` 同源（引擎模型 `owned_by: embedding`） |
| ⑥ 静态面 + 健康 = AC-15⑤ | `:435-499` | 档目 15 ∥ 16 逐名 ∥ 零外链/零 `@import`（全档扫描）∥ 两表键集双向相等/en 零 CJK/占位符一致/五键族计数（vector 20 ∥ health 10 ∥ overview 8 ∥ usageReport 14 ∥ audit 27）∥ `t` 字面量 + 裸命名空间键闭包 ∥ nav 直驱（管理 6 ∥ `#/admin` 重定向 ∥ 默认页 ∥ denied）∥ 三新档直发 200 + mime + `no-cache` + 字节 = 磁盘 ∥ **健康三态**（绿 200 ok/`no-store` ∥ 黄 503 degraded（probeDb 注入）∥ 红 = 停机后 fetch 拒） |

**自跑读数（命令 + 结果）**：`node --test docs/batches/2026-10-06-console-completeness-2.test.mjs`（cwd = `thincoder/`）⇒ **tests 6 ∥ pass 6 ∥ fail 0**（duration ≈3.3s；逐例：① 21ms ∥ ② 1.68s ∥ ③ 0.49s ∥ ④ 0.48s ∥ ⑤ 0.45s ∥ ⑥ 31ms）；`node --check` 每改必跑全绿；行数实读 **499**（设计估 ≈450——R21 回填收正）。

**决策透明表（实施取法——设计未钉死处）**：

| # | 项 | 取法 | 依据 |
|---|---|---|---|
| 1 | ② 服务端形态 | **真 bin 子进程**（非进程内复刻）——`onLock` 审计接线 ∥ 启动清理同窗均得实证；CLI 走 in-process `runCli`（同库同文件） | 「真服务端起停 + 直驱」派单先例；G 面探针面升级为批内件durable 载体 |
| 2 | ② 事件计数 19 | 确定性夹具：九型写点逐一对照 + probe-* 两行（启动清理证据） | 「逐写入点实走」判据；锁定期快速拒绝不写 `login_failure`（实现 `routes.mjs:61-64` 无审计分支）与行数逐值互证 |
| 3 | ③ RFC 4180 转义 | 夹具 model = `prov/b, "x"`（逗号 + 引号）——转义分支不空转 | METERING §4 AC-15② 明文「RFC 4180 转义」 |
| 4 | ③ key 归因两分支 | 第二枚从未使用 key（`aKey2`）——`null`/0 分支 + key 级归因与成员级可比 | advisor #1（AC-15⑥ 残余）处置；METERING §4 AC-15⑥「从未使用 ⇒ null/0」 |
| 5 | ⑤ 引擎替身 | 注入口径 `fetchImpl` + `timeoutMs: 50`；超时 kind 判据 = `signal.aborted` | §2.4 注入口径（EMBEDDING `:41`）；四 kind 全实证 |
| 6 | ⑤ 配额零涉 | 调用者 `quota_tokens = 0` 仍照通 | API.md §5 AC-15①「不落库不计量（… ∥ 配额零涉）」 |
| 7 | ⑥ 健康三态 | 绿/黄 = 直驱（真 `/healthz` ∥ probeDb 注入）；红 = 停机后 fetch 拒；`HEALTH_POLL_MS`/`nav-health`/三态键 = 源断言（浏览器实走 = 收口轮） | WEBUI §6 AC-15⑤ 载体 = 「批内件 + 收口轮」 |
| 8 | 行数控制 | 起步 498 → 终稿 499（压缩批次与新增断言并行）；「≥500 按域拆」预案未触发 | 派单 ≈450 ≤500 硬线；批档 `:67` 拆档预案备而未用 |

**审计与代码评审轮次与终态**：
- 内部偏差审计（explore · 1 轮 · read-only）：**findings ×3**（🟡 AC-15⑥ key 数据面缺 ∥ 🟡 AC-15④ 保留清理缺 ∥ 🔵 四读同门缺 `me/usage`）——已全修落盘（key 归因断言 ∥ `pruneAuditEvents` 注入时钟 + bin 启动清理探测 ∥ `me/usage` 非法 400 入同门）。
- advisor 代码评审（**1 轮 · type=code** · 审面 = 本件 + 其直驱的九实现档）：**VERDICT pass**（**0 🔴** ∥ 🟡×2：① AC-15⑥ 残余＝「从未使用」分支 + key 级归因不可分；② 499 行 > 300 advisory（非阻断，未越 500）∥ 🔵×3：日界 wall-clock 窄窗 + `freePort` TOCTOU ∥ 档头腿↔轴号未对位 ∥ `usage.mjs:187/203` summary trend 随显式 `from` 无界——产品面低风险）。
- fix 轮（advisor 后）：**R1** = AC-15⑥ 残余处置（`aKey2` 从未使用 key + 断言行扩两行——key 级归因与成员级可比：320/null-0）；**R2** = 档头腿 ↔ 轴对照重写（七判据源，零行数变化）。🔵 三条**登记不自改**（wall-clock 属窄窗 ∥ 无界 trend 属产品面边界建议登账 ∥ 行数归回填轮）。
- 终态：**clean**（末次复跑 6/6 全绿；行数 499 ≤ 500）。

**披露 / 上抛（父侧）**：
1. **门禁面**：本件已列 `thincoder-server/package.json:13`（第 12 件——G 面落地，实读 12 件 ✓）；`-server-auto-update` 的「11 件」断言（随正七件）随正后本件即入全绿链。
2. **未跑 repo 套件**：本件为批内单测（随批留存、不入仓套件）；收口轮的父侧单次套件跑仍成立。
3. **登记项（非阻断——供收口/登账）**：日界断言墙钟窄窗（跨本地零点）∥ bin 段 `freePort` TOCTOU ∥ `usage.mjs:187/203` trend 随显式 `from` 无界（admin 面低风险——建议登账或 `METERING.md` §3 补口径）∥ 499 行 > 300 advisory（R21 回填轮把「≈450」收正为 499）。
4. **未决父侧随正项不变**：本批七件随正 + 需求档回笔（R19/R20）仍归父侧——T 面零触。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent · 2026-10-06 21:1x）**

- **全门禁（父侧唯一仓套件跑）**：`cd thincoder-server && npm run prepublishOnly` ⇒ **105/105 ∥ fail 0 ∥ exit 0**（12 件链——含 T 件第 12 位）。首跑 104/105（唯一红 = `-webui-deploy` 档目断言——随正漏件：十三档期望 ⇒ 十六档；已修，复跑全绿）。
- **批内件**：`docs/batches/2026-10-06-console-completeness-2.test.mjs`（499 行 ∥ 6/6 绿——AC-15 六面判据载体，随批留存）。
- **集成场景影响**：无新增（本批判据载体 = 批内件 + 各测试件随正；控制台浏览器实走 = 弹窗批实施后的控制台轮）。
- **随正七件核销**：`-server-gateway` 13/13 ∥ `-server-auto-update` 14/14 ∥ `-server-gateway-accounts` 13/13 ∥ `-console-providers` 9/9 ∥ `-server-i18n` 6/6 ∥ `-first-release-completeness` 14/14 ∥ `-server-gateway-webui-deploy`（修后入 105/105 链）——全绿。
- **R21/R27 回填面（残余——登记在册，非阻断）**：usage.mjs 278（估 ≈230）∥ audit.mjs 108（≈90）∥ overview 27 ∥ embedding-admin 96 ∥ cli 189 ∥ bin 176 ∥ README 244 ∥ system 57 ∥ T 件 499（估 ≈450）——设计档预算行回填 = 收口后回填轮（`design/PROJECT.md` §9 R21/R27 在册）。
- **T 登记项（非阻断——登记面）**：日界断言墙钟窄窗 ∥ freePort TOCTOU ∥ `usage.mjs:187/203` summary trend 随显式 `from` 无界（建议口径或登账）∥ T 件 499 > 300 advisory（R21 收正）。
- **交付链**：四管 §5 全在册（S :173 ∥ G :224 ∥ F :260 ∥ T :289）；G 面/ T 面零越清单；F 面 Deferred×3（共享助手收编 ∥ audit 截断提示——设计未要求）已披露。
- **designId 链**：`0f0f885d…` 全链终态 ⇒ consume（防复用）。
- **收口**：本档冻结；台账 `#972` 核销（evidence = 本档 + 105/105 读数）。
