# 2026-10-07 · 配额面 v2 · 成员模型面
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 11:16 控制台走查三意见 + 11:54 读法裁定（A＝模型表进成员弹窗本体直显）——扫并 #1001/#994/#995/#988（§1 合并扫描）。
> 台账 = #1002（server · 归批）。前情 = docs/batches/2026-10-07-quota-per-model.md §6（已收口 2026-10-07）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户控制台走查（2026-10-07 11:16 配额面四条腿走查后）三意见 + 11:54 一字裁定。

## 需求点

- **#1002 成员弹窗模型表直显 + 逐行已用**——读法裁定 = **A（模型表进弹窗本体直显）**〔11:54「A」；原话「用户弹窗里，模型列表最好不要放在弹窗里，直接放进弹窗」〕。
  - 逐行已用（原话「已用应该显示在每行吧？现在只显示一个总的已用，我都不知道数据来源，难道用量统计没分开？」）——数据面实读：逐模型计数**已存在**（`quota_counters`：成员×provider×模型×月）；缺 = 显示面 + 逐模型已用 API 字段。口径勘明 = 设计轮必含（月粒度 vs 报表窗一致性）。
- **#1003 服务模型页列表行显示配额**——现配额仅在模型配置弹窗 F 组（`public/views-models.mjs:182-185`）。
- **#1004 成员模型禁用**——新机制：「用户模型默认可用，勾选即禁用」；服务端执行（被禁模型调用 ⇒ 拒）。

## 合并扫描（点火前池面扫描——#996 纪律）

**并入（4）**：#1001（#992 四小项——同实施面〔server/metering + quota〕；② 覆盖键形校验恰同机制〔成员覆盖表〕）∥ #994（i18n 死键 `col.actions`——同表，v2 必增键）∥ #988（en 单复数「1 items」——同表）∥ #995（审计页双标题同文——同面微项）。

**不并（理由）**：#993（app.mjs ≈317 拆分 = 结构性轮）∥ #976（i18n 拆表 = 结构轮——与键增量非同窗）∥ #984（Provider 弹窗交互面——非同组件）∥ #979（弹窗机制/路由面——v2 不触机制）∥ #967 ∥ #989 ∥ #955 ∥ #959（面不同 / 条件未至）。

## 边界（明确不做）

结构轮（#993 / #976）∥ 弹窗机制面（`public/app.mjs` 路由 ∥ `modal.mjs`）∥ Provider 面 ∥ 运维/部署面。禁引「默认禁用」形（裁定 = 默认可用、勾选即禁用）。

## 设计棒

eng-designer 已 spawn（2026-10-07 11:5x）——设计面 = 三需求点 + 四并入随窗；落点 = server 设计档（按项目文档约定）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初轮 · 2026-10-07 · 三需求点 + 四并入项五档落点）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 批次任务（条目覆盖）

| 条目 | 类 | 覆盖内容 | 设计落点 | 验收判据 |
|---|---|---|---|---|
| #1002 | 需求 | 成员弹窗查看态 = 模型表直显（读法 A）+ 逐行已用（API 增量） | `webui/WEBUI.md` §2.4② ∥ `accounts/ACCOUNTS.md` §3（`memberView` 两字段）∥ `metering/METERING.md` §2.3（`monthlyCountersByMember`） | WEBUI §6 AC-23① 行 + METERING §4 AC-23 行 |
| #1003 | 需求 | 服务模型页列表配额列（与 F 组单源） | `webui/WEBUI.md` §2.4③ | WEBUI §6 AC-23② 行 |
| #1004 | 需求 | 成员模型禁用（默认全可用 ∥ 勾选即禁用 ∥ 服务端执行） | `accounts/ACCOUNTS.md` §2.2（机制全文）∥ `gateway/API.md` §2.1（执行）+ §2 `/v1/models` ∥ `store/STORE.md` §2 v6 段 | ACCOUNTS §5 AC-23 行 ∥ API §5 AC-23 行 ∥ WEBUI §6 AC-23③ 行 |
| #1001① | tech | `reconcile --fix` 并发窗闭合（`BEGIN IMMEDIATE` + 事务内重算） | `metering/METERING.md` §2.5 | 批内件 |
| #1001② | tech | 覆盖键形校验（首斜杠两段非空——与禁用键同助手） | `accounts/ACCOUNTS.md` §2.2/§3 ∥ `webui/WEBUI.md` §6 AC-21 行 | 批内件（裸名 ⇒ 400） |
| #1001③ | tech | `keyUsageStats` 窗沿 ≡ 30 个本地日（与报表同构） | `metering/METERING.md` §3/§4 | 批内件（窗沿逐值） |
| #1001④ | tech | 批内件清理腿固定基准时刻（消月界假红） | `docs/batches/2026-10-07-quota-per-model.test.mjs` | 批内件复跑 |
| #994 | tech | i18n 死键删净（`col.actions` ∥ `quotaEmptyHint` 随直显退役） | `i18n-zh.mjs` ∥ `i18n-en.mjs` | 批内件（零残留） |
| #995 | tech | 审计页双标题 ⇒ 单标题（h3 删） | `views-audit.mjs:57-58` | 批内件（`audit.title` 引用一次） |
| #988 | tech | en 单复数分形（`Intl.PluralRules` + `.one` 族 7 枚） | `i18n.mjs` ∥ `i18n-en.mjs` | 批内件（取形直测） |

**不在本批**（§1 钉表原样）：#993 ∥ #976 ∥ #984 ∥ #979 ∥ #967 ∥ #989 ∥ #955 ∥ #959。

### 2.2 需求侧增量（报父侧核落 `docs/server/requirements/PROJECT.md`——功能点 23 + AC-23）

- **功能点 23（成员模型面 v2）**：① 成员弹窗查看态 = 成员信息 + 模型表直显（列 = 模型 ∥ 每月用量（覆盖 ∥ 未设 = 按平台）∥ 平台默认 ∥ 本月已用（逐行——自然月，与配额检查同源同窗）∥ 禁用勾选）；② 服务模型页列表行显示配额（未设 = 不限；嵌入行 = —；与 F 组单源）；③ 成员模型禁用：默认全可用 ∥ 勾选即禁用（即时写）∥ 服务端执行（被禁 ⇒ 404 `model_not_found` 消息明示；`/v1/models` 对该成员随动滤除）∥ 存储 = 成员 × 模型禁用集（JSON 列）。
- **AC-23（三条·全文在设计档）**：① 弹窗查看态（WEBUI §6 AC-23 行）∥ ② 列表配额列 ∥ ③ 禁用写/读/执行三面（ACCOUNTS §5 ∥ API §5 ∥ WEBUI §6）。设计档内标记 = 「候补——报父侧核落需求档」。

### 2.3 设计档落点

- `docs/server/design/webui/WEBUI.md`：§2 表两行 ∥ §2.2（计数复数形 + 键族登记）∥ §2.4②（查看态重写 + 禁用勾选条；编辑态/刷新口径/不做随正）∥ §2.4③（列表配额列 + 同源口径句）∥ §5（六行实读 + 小计）∥ §6（AC-21 ② 重写 ∥ AC-17 ① 随正 ∥ 增 AC-23 两行）∥ §7（KD-SV-43/44）∥ §8。
- `docs/server/design/accounts/ACCOUNTS.md`：§2.1 边界句 ∥ 增 §2.2（禁用机制全文）∥ §3（`/api/me` ∥ `/api/members` 字段 + 新端点行）∥ §4（四行实读 + 小计 ⇒ ≈872）∥ §5（AC-23）∥ §6（KD-SV-42）∥ §7（N29/N30 ∥ B26/B27 ∥ E22）∥ §8。
- `docs/server/design/gateway/API.md`：§2（chat 行 ∥ `/v1/models` 行）∥ §2.1（禁用准入条）∥ §3（404 括注）∥ §4（routes 实读 104 ⇒ ≈112）∥ §5（AC-23）∥ §7（N26 ∥ B19）∥ §8。
- `docs/server/design/metering/METERING.md`：§2.3（计数读面两形）∥ §2.5（`--fix` 事务合围）∥ §3（窗注）∥ §4（AC-15⑥ 收正 + AC-23 行）∥ §5（aggregates 141 ⇒ ≈160 ∥ report 169 ⇒ ≈170）∥ §8。
- `docs/server/design/store/STORE.md`：§1（版本 5 ⇒ 6）∥ §2 v6 段 ∥ §3 迁移链 v6 ∥ §4（db 202 ⇒ ≈214）。

### 2.4 机制设计摘要（全文在各档）

① **弹窗（WEBUI §2.4②）**：查看态模型表直显——进窗惰性拉 `GET /api/admin/providers`（查看/编辑两态共用；失败 ⇒ 窗内状态行 + 重试）；行 = 全 chat 模型（`deriveModels` 序）+ 离表覆盖键注行（`quotaOffListNote`——保留）；列 = 模型 ∥ 每月用量（覆盖 ∥「按平台」）∥ 平台默认（∥「不限」）∥ 本月已用 ∥ 禁用勾选。
② **已用口径（勘明）**：逐行已用 = **自然月**（`quota_counters`——与配额检查同源同窗；缺 ⇒ 0）；成员总额 = 本月累计（含嵌入——现口径保持）；报表/key 窗 = 近 30 个本地日（#1001③ 收正对齐）——三窗各自单源，不互称一致。
③ **API 增量**：`memberView` + `modelUsage`（map——当月） + `modelDisables`（map）；新端点 `POST /api/members/:id/model-disables`（键级合并；`true` = 禁 ∥ `null` = 删键；返回 `{id, modelDisables}`）；`/v1/models` 成员禁用滤除。
④ **禁用（ACCOUNTS §2.2 全文）**：存储 `members.model_disabled_json`（v6）；执行 = 派发命中后/配额前（404 `model_not_found`——消息明示；零新码）；**禁用优先于配额**；仅 chat（嵌入面零涉）；审计零增。
⑤ **#1001①–④ 修法**：① `--fix` 路径 `BEGIN IMMEDIATE` 先行 + 事务内重算快照（`busy_timeout=5000` 在盘）∥ ② 键形助手 = 两 merge 共用（裸名/空段 ⇒ 400）∥ ③ 窗沿 = `localDayStart(now, -(KEY_USAGE_WINDOW_DAYS-1))` 同构 ∥ ④ 用例固定基准时刻（本地正午中点日）——消月界假红。
⑥ **#994/#995/#988**：死键 2 枚删净；审计页 h3 删（保 `head` 的 h2）；`t()` 取形 = `Intl.PluralRules`（按语言缓存）——en 增 `.one` 7 枚，键集口径随正（除自称号族 + `.one` 族）。

### 2.5 受影响文件与行数（实读 = 本设计轮；末行无尾空行计）

| 档 | 实读 ⇒ 预估 | 增量 |
|---|---|---|
| `src/store/db.mjs` | 202 ⇒ ≈214 | v6 段（ALTER + 迁移段） |
| `src/accounts/members.mjs` | 192 ⇒ ≈210 | `parseModelDisables` ∥ `mergeMemberModelDisables` ∥ 键形助手 |
| `src/accounts/keys.mjs` | 102 ⇒ ≈108 | 鉴权行携 `model_disabled_json` |
| `src/accounts/routes.mjs` | 113 ⇒ ≈122 | `memberView` 两新字段 + 装配 |
| `src/accounts/routes-admin.mjs` | 95 ⇒ ≈112 | `model-disables` 端点行 |
| `src/metering/aggregates.mjs` | 141 ⇒ ≈160 | `monthlyCountersByMember` ∥ `--fix` 合围 |
| `src/metering/report.mjs` | 169 ⇒ ≈170 | key 窗沿收正 |
| `src/gateway/routes.mjs` | 104 ⇒ ≈112 | 禁用准入条 ∥ 列表过滤 |
| `public/views-admin.mjs` | 275 ⇒ ≈325 | 查看态模型表 ∥ 勾选 handler ∥ providers 取数两态共用（**越 300 软线——在册**：拆分预案 = 成员弹窗面迁 `views-admin-modal.mjs`；本批不触发） |
| `public/views-models.mjs` | 207 ⇒ ≈216 | 列表配额列 |
| `public/views-audit.mjs` | 91 ⇒ 90 | h3 删（#995） |
| `public/i18n.mjs` | 110 ⇒ ≈120 | 复数形取键 |
| `public/i18n-zh.mjs` | 345 ⇒ ≈345 | +2 键 ∥ −2 死键 |
| `public/i18n-en.mjs` | 341 ⇒ ≈348 | +2 ∥ −2 ∥ +7 `.one` |
| 零动面 | —— | `public/app.mjs`（321）∥ `modal.mjs`（68）∥ `style.css`（224）∥ `nav.mjs`（88）∥ `gateway/providers.mjs`（167）∥ `gateway/provider-admin.mjs`（220） |
| 批内件 | 新 ≈450 ∥ 旧 446 ⇒ ≈455 | `docs/batches/2026-10-07-quota-v2-member-models.test.mjs`（新）∥ `2026-10-07-quota-per-model.test.mjs` 随正；`prepublishOnly` 链 十九 ⇒ 二十件 |

### 2.6 验收对照（机检口径——实施轮照此落）

- 迁移：空库读数 6 ∥ v5 库升 6 ∥ 幂等 ∥ 新列常量默认在场。
- 接口 200 + 字段形：`/api/me` ∥ `/api/members` 行含 `modelUsage`（map——键 = 外标）∥ `modelDisables`；`POST model-disables` ⇒ 200 `{id, modelDisables}` ∥ 400（键形/值）∥ 404 ∥ 403/401。
- 执行面（真 HTTP）：禁 ⇒ 404 `model_not_found` + 消息含「已对该成员禁用」+ 零用量行；`/v1/models` 不含；恢复后回列；禁用先于配额（被禁 ∧ 超额 ⇒ 404）；他成员不受累；即时生效。
- 计数读面：`monthlyCountersByMember` 逐值 = 记账归并（自然月）∥ 外标回拼无损 ∥ 两形（`memberId` 给定 ∥ 全员）逐值相等。
- i18n：新 2 键两表在场 ∥ 死 2 键零残留 ∥ `.one` 仅 en（7 枚）∥ 基键集双向相等 ∥ en count=1 单形直测。
- 前端静态：`views-admin` 5 列逐头 + handler ∥ `views-models` 配额列三态 ∥ `views-audit` 单标题 ∥ 档目 19 ∥ 20 不变 ∥ 零新 `:root` 变量 ∥ 零新悬停规则 ∥ 行宽 ≤300。
- 口径：零 CJK 断言不破（新键值不涉代码档）∥ 门禁清单二十件。

### 2.7 关键决策

KD-SV-42（成员模型禁用——`accounts/ACCOUNTS.md` §6）∥ KD-SV-43（弹窗模型表直显 + 逐行已用——`webui/WEBUI.md` §7）∥ KD-SV-44（i18n 计数复数形——`webui/WEBUI.md` §7）。三行含被否候选与何故否。

### 2.8 上抛与披露

[上抛·知会] 需求档落位（功能点 23 + AC-23 全文）待父侧核落——本 §2.2 已备全文，设计档内标「候补」。
披露：① 行数惯例 = 末行无尾空行计（本设计轮实读）；`#983` 回填轮旧读数（usage 171 ∥ report 170）与本轮实读（170 ∥ 169）差 1——计数口径差，非内容差（#983 为本轮域外待办，原样保留）。② `public/views-providers-modals.mjs` 现恰 300 行（域外存量——未触碰；随 #983/后续轮处置）。③ 需求档 §2:23 引文形态（`用户弹窗 模型列表 直接放进弹窗`）= 用户速记原文在册——11:54「A」裁定即读法裁决（读法 B「移出弹窗」否）。④ `quotaEmptyHint` 键随查看态重写退役（死键删——沿 #994 口径）；`views-audit.mjs` 的 h3 删后 `audit.title` 仍由 `head` 的 h2 单点引用（不破键引用闭合）。

**§2 修轮更正块（fix 轮 · 2026-10-07 · eng-designer · 应 §3 轮次 1 六发现——①–⑥ 逐号处置：①–③⑤ 批档侧见下 ∥ ④⑥ = 设计档侧 in-place 收正（`webui/WEBUI.md` §1 越线清单 ∥ §2.4② 注行）；原 §2.4–§2.8 文面不改——记录面追加）**

- **①（发现 1——上抛句收口）**：§2.8 上抛句（需求档落位待父侧核落——设计档内标「候补」）已收口——需求档已落：功能点 23（`docs/server/requirements/PROJECT.md` §2:23）∥ AC-23（同档验收表 `:140`）∥ 入面记（`:232`）。设计档四处标记本修轮已改「已落需求档——`docs/server/requirements/PROJECT.md` 验收表」（`webui/WEBUI.md:442` ∥ `accounts/ACCOUNTS.md:110` ∥ `gateway/API.md:131` ∥ `metering/METERING.md:81`）；§2.2 末句（设计档内标记 = 候补）随之失效——以本块为准。
- **②（发现 2——读数更正）**：`public/views-providers-modals.mjs` 盘面实读 = **300 行**（本 fix 轮实测——末行无尾空行计）；§2.8② 原述「现恰 300 行」经复核属实（原样保留）；`webui/WEBUI.md` §5 该行读数链已 in-place 收正（「实读 272（2026-10-07）⇒ ≈280（本批 +≈8…）」⇒「实读 300（2026-10-07——本 fix 轮复核）」）；§5 小计实读 3170 已按 300 在账——零随动。
- **③（发现 3——披露句改述）**：需求档实文 = 「模型表进弹窗本体直显」（`docs/server/requirements/PROJECT.md` §2:23——用户 11:54 读法裁定 A）；「用户弹窗里，模型列表最好不要放在弹窗里，直接放进弹窗」= 用户速记原句——批档 §1 在册（需求档零此句——全档检索「直接放进弹窗」「速记」零命中）；§2.8③ 原述「需求档 §2:23 引文形态……= 用户速记原文在册」按此收正。
- **⑤（发现 5——零动面读数核）**：本 fix 轮盘面实读（末行无尾空行计）——`public/app.mjs` **321** ∥ `modal.mjs` **68** ∥ `style.css` **224** ∥ `nav.mjs` **88** ∥ `gateway/providers.mjs` **167** ∥ `gateway/provider-admin.mjs` **220**——六读数与 §2.5 零动面行一致（零收正）。设计侧旧链（`webui/WEBUI.md:402` 实读 317 ∥ `:417` 实读 223 ∥ `gateway/API.md:111` 实读 146 ∥ `:112` 实读 197）滞后于盘面——回填随实施轮（评审建议在案）。

**门读数（本修轮 · `node scripts/doc-check.mjs --root d:/teamcode/thincoder`）**：悬空 **66**（改前 66 ⇒ 改后 66——持平）∥ 行宽 **0** ∥ 本修轮触面零新增命中（✗ 集合逐条比对零增零减）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc-state（需求侧对齐） | 🟡 | 需求侧落位已毕，设计四档 AC 行与批档上抛仍持「候补」形：`webui/WEBUI.md:440` ∥ `accounts/ACCOUNTS.md:110` ∥ `gateway/API.md:131` ∥ `metering/METERING.md:81` 四处均含「候补——报父侧核落需求档」；批档 `:112` 仍书「需求档落位（功能点 23 + AC-23 全文）待父侧核落」——而需求档已落（`requirements/PROJECT.md:140` AC-23 行 ∥ `:232` 入面记「AC-23 同拍」）。 | 四处标记改「已落需求档——`docs/server/requirements/PROJECT.md` 验收表」（沿 AC-13/AC-14 收正先例）；批档 §2.8 上抛句同拍收正。 |
| 2 | Doc-state（行数读数） | 🟡 | `public/views-providers-modals.mjs` 行数两档冲突（差 20+ 行，涉 300 软线界值）：批档 `:113` ②「`public/views-providers-modals.mjs` 现恰 300 行（域外存量——未触碰；随 #983/后续轮处置）」vs `webui/WEBUI.md:406`「实读 272（2026-10-07）⇒ ≈280（本批 +≈8 = 勾选表 ∥ 预设模型表）」——两读数必有一非（软线在册口径受影响）。 | 以实施轮实读收正两处读数（口径 = 批档 §2.8① 末行无尾空行计），一并落 #983/结构轮账。 |
| 3 | Clarity（披露准确性） | 🔵 | 批档 `:113` ③ 声明「需求档 §2:23 引文形态（`用户弹窗 模型列表 直接放进弹窗`）= 用户速记原文在册」；需求档实文无此句（`requirements/PROJECT.md:104` 载「11:54 读法裁定 A——「模型表进弹窗本体直显」」；全档检索「直接放进弹窗」∥「速记」零命中——该原句仅见批档 §1）。 | 披露句按需求档实文改述（或需求档回笔补记原句——二者取一，以落位文为准）。 |
| 4 | Doc hygiene（读数滞后） | 🔵 | `webui/WEBUI.md:17` §1 越线清单滞后两批：句内「`app.mjs`（实读 300 ⇒ ≈316——拆分预案 = §5）」vs §5 `:400`「实读 317 ⇒ ≈320」；i18n 双表 §1「实读 328 ⇒ ≈334 ∥ 324 ⇒ ≈330」vs §5 `:417`「实读 345 ⇒ ≈345」∥ `:418`「实读 341 ⇒ ≈348」；本批新越线档 views-admin（`:404`「实读 275 ⇒ ≈325」）未入 §1 清单。 | §1 句随 §5 实读链收正（补 views-admin 越线条目）。 |
| 5 | Doc hygiene（数值漂移） | 🔵 | 零动面读数与各档 §4/§5 差 ±1–5：批档 `:93`「`public/app.mjs`（321）∥ `modal.mjs`（68）∥ `style.css`（224）∥ `nav.mjs`（88）∥ `gateway/providers.mjs`（167）∥ `gateway/provider-admin.mjs`（220）」vs `webui/WEBUI.md:400`「实读 317 ⇒ ≈320」∥ `:415`「实读 223 ⇒ ≈228」∥ `gateway/API.md:111`「146 ⇒ ≈165」∥ `:112`「197 ⇒ ≈225」（实读 vs 估算时点差；被改 14 项标注两档一致——已核）。 | 实施轮回填时以盘面实读统一收正（各 ≤±5——沿惯例）。 |
| 6 | Clarity（口径消歧） | 🔵 | 查看态注行口径未言离表禁用键：`webui/WEBUI.md:120`「离表覆盖键 ⇒ 注行「另有 N 项不在服务清单（保留）」（`quotaOffListNote`——查看/编辑两态同注，恒不触碰）」；而离表禁用键同口径恒保留（`accounts/ACCOUNTS.md:154`「键恒保留（与覆盖键同口径——重开即再禁）」），弹窗内无显示/清理面（仅 map 面可读）。 | 口径句补一句（禁用键是否计 N ∥ 是否列示 ∥ 恢复路径 = 重开回行后取消勾选），消歧义。 |

VERDICT: pass

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 4（发现合计 6）——无 🔴，设计过。

## §4 用户批准（主 agent）

**§4 用户批准（主 agent）——父侧代签**（用户 2026-10-07 12:25「自动跑」授权——排空模式）。

- **三条件齐备**：① 设计评审 **pass**（§3 轮次 1——🔴 0 ∥ 🟡 2 ∥ 🔵 4）；② 修正轮已落地并逐条核验（修轮 #4——六条 + 批档更正块 `:115-122`；父侧读实核验在案：四档标记收正 ∥ 读数链 300 ∥ §1 越线清单 ∥ 注行补句）；③ 设计令牌已签发（值不入档）。
- **批准范围** = 本批实施全链（A/B 双棒派发 + 收口核销 + 提交推送）。依据登记 = §3 ∥ §2 ∥ 批档更正块。可撤回。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-10-07（A 棒（后端）8 档 + B 棒（前端）6 档 + 门禁链 + 新批内件（十二腿）；B 随正 7 件 tmp 待搬）

**A 棒交付摘要（逐档 —— 行数 = 本会话实读，末行无尾空行计）**

- `src/store/db.mjs`（202 ⇒ **209**）：v6 段（`DDL_V6` = ALTER `members.model_disabled_json` + 链尾 `{v:6}`；常量默认 `'{}'`——`:146-150 ∥ :159`）。
- `src/accounts/members.mjs`（192 ⇒ **241**，估 ≈210——越估 31 披露）：`assertModelRefKey`（#1001② ——`model-quotas` ∥ `model-disables` 两 merge 共用；形规则单源 = 派发面 `splitModelRef`）∥ `parseModelDisables` ∥ `mergeMemberModelDisables`（true = 禁 ∥ null = 删键 ∥ 未现键不动 ∥ 校验先行）。
- `src/accounts/keys.mjs`（102 ⇒ **109**）：`verifyKey` SELECT 携 `model_disabled_json` ⇒ 成员行 `modelDisables` 随鉴权行（零额外查询）。
- `src/accounts/routes.mjs`（113 ⇒ **118**）：`memberView` + `modelUsage`（装配注入 ∥ 缺省就地取）+ `modelDisables`（九键行形）。
- `src/accounts/routes-admin.mjs`（95 ⇒ **109**）：新端点 `POST /api/members/:id/model-disables`（403/401 ⇒ 404 ⇒ 400 ⇒ 200 `{id, modelDisables}`；变更不入审计）∥ `/api/members` 增 `monthlyCountersByMember` 全员一次装配（免 N+1）。
- `src/metering/aggregates.mjs`（141 ⇒ **173**，估 ≈160——越估 13 披露）：`monthlyCountersByMember`（两形：memberId 前缀查询 ∥ 全员一次装配；外标回拼无损）∥ `reconcileUsage` 重排（`--fix` = `BEGIN IMMEDIATE` 先行 + 事务内重算快照；报告路径零改；零漂零覆写）。
- `src/metering/report.mjs`（169 ⇒ **168**）：`keyUsageStats` 窗沿 = `localDayStart(now, -(KEY_USAGE_WINDOW_DAYS-1))`（#1001③——与报表窗同构）；死常量 `DAY_MS` 随删。
- `src/gateway/routes.mjs`（104 ⇒ **111**）：① chat 禁用准入（派发命中后/配额前——404 `model_not_found` 消息明示「已对该成员禁用」；零新码；禁用优先于配额）② `/v1/models` 按调用者禁用集随动滤除。
- `thincoder-server/package.json`：门禁链 十九 ⇒ **二十件**（新批内件入链）。
- 新建 `docs/batches/2026-10-07-quota-v2-member-models.test.mjs`（**416 行**——估 ≈450；八腿：v6 迁移 ∥ 禁用写/读面 ∥ 执行面 ∥ 计数读面 ∥ #1001① ∥ #1001③ ∥ #1001② ∥ 门禁二十件；B 棒延长本件）。
- 随正 `docs/batches/2026-10-07-quota-per-model.test.mjs`：#1001④ 固定基准时刻（本地正午中点日）+ v6 链尾读数 + `/api/me` 行形两字段 + 门禁二十件。

**读数（本会话实跑 · 定向件）**

- 新批内件：`node --test docs/batches/2026-10-07-quota-v2-member-models.test.mjs`（cwd = `thincoder/`）⇒ **8/8 全绿**。
- 随正 7 件（tmp 舱原样实跑）：**68/68 全绿**（逐件：server-gateway 13 ∥ console-completeness-2 6 ∥ accounts 13 ∥ list-style 7 ∥ auto-update 14 ∥ console-layout 8 ∥ quota-per-model 7）。
- 受影候选 5 件（在盘原样、零改）：**36/36 全绿**（chat ∥ metering ∥ webui-deploy ∥ model-ref ∥ first-release-completeness）。
- `node --check` 全部改件通过。**仓套件未跑** —— `not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**决策透明表**

| # | 决策 | 备选 | 何故 |
|---|---|---|---|
| 1 | 键形助手经 `splitModelRef`（`gateway/providers.mjs`）复用 | members.mjs 内自写判形 | 形规则单源（首斜杠两段非空 = 派发面同规则）；导入链无环（实核） |
| 2 | `/v1/models` 滤除在路由层按 `item.id` 过筛 | 改 `providers.mjs` `modelList(registry, disables)` | §2.5 零动面含 `providers.mjs`（零触实核）——滤面留路由层 |
| 3 | `--fix` 零漂移 ⇒ 零覆写（`fixed = false`；事务照开照收） | 恒覆写 | 「以重算值覆写」在零漂时无覆写语义；报告读数更准（既有 `fixed` 语义保持） |
| 4 | `monthlyCountersByMember` 内层 = 普通对象 | Map | HTTP JSON 直用；两形比较面直等 |
| 5 | 6 件受影旧批件随正走 tmp 舱 | 直写旧批 companion | 跨批写闸机械拒（预期内）；父侧搬入（前批先例） |

**接受不修（评审非阻塞项——父侧可裁）**：① 探针版本字面量（`{v:7,...}`——沿该件每版随正惯例，派生式改进留待父侧）；② 键形助手对带空白键不拒（`" mock/m"` 类通过——仅手写/curl 面可达、控制台按清单取值不触发；设计字面未禁 ⇒ 收紧即加规则，涉两 merge 共用面，交父侧裁）；③ 设计档行数回填（`ACCOUNTS.md` §4 ∥ `METERING.md` §5 实读读数——收口轮）；④ `STORE.md` §1「当前 = 7」= 并行批（模型元数据）设计前置、实施未落——非本棒面。

**审计与代码评审轮次与终态**

- ① 内探索背离审计（只读子代理；对照批档 §2 + 四设计档 + 验收三面）：**clean**——0🔴 ∥ 1🟡（§5 未写——本段即补）∥ 3🔵；四类背离（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）零命中；tmp 舱与映射单逐件相符。
- ② 内 advisor 代码评审（8 源档 + package.json + 新批内件 + tmp 舱 + 四设计档 + 批档）：**VERDICT pass**——0🔴 ∥ 2🟡（① tmp 待搬 = 父侧动作 ∥ ② §5 待写 = 本段）∥ 4🔵（上表接受不修四项）。
- fix round（自纠 ≤5）：实施中 2 轮自纠（新件 ②④ 两处期望值——审计行基线/工具默认值泄漏；均已修 + 复跑全绿）；评审后零 must-fix ⇒ 无追加修轮。
- 终态：**converged（clean）**。

**披露（偏离/越限/待搬）**

- **tmp 待搬**：7 件随正改稿 + `映射单.md` 在 `.thincoder/tmp/quota-v2-a-随正/`（跨批写闸机械拒——预期；父侧**同名覆盖搬入** `docs/batches/` + 收口轮门禁复跑）。
- **越清单**：除声明写域外 = 6 件旧批档 companion 测试件的随正改稿（4 件版本读数 ∥ 3 件件数读数 ∥ 2 件行形读数；与声明的 `quota-per-model` 合 7 件）——如实披露（tmp 舱在案）。
- **行数越估**：`members.mjs` +49（估 +18）∥ `aggregates.mjs` +32（估 +19）——两档 ≤300 软线；余 6 档在估内（db 209 ∥ keys 109 ∥ routes 118 ∥ routes-admin 109 ∥ report 168 ∥ gateway/routes 111）。
- **零动面实核（git status）**：`public/**` 零触 ∥ `gateway/providers.mjs` ∥ `gateway/provider-admin.mjs` ∥ `gateway/forward.mjs` ∥ `metering/usage.mjs` ∥ `accounts/session.mjs` 零触。

**§5 自我更正（同段追加 · 2026-10-07）**：上段「越清单」行计数口误——6 件旧批档 companion 件按改点分类应为：**2 件版本读数**（`-server-gateway` ∥ `-console-completeness-2`）∥ **3 件件数读数**（`-console-list-style` ∥ `-server-auto-update` ∥ `-console-layout`）∥ **1 件行形读数**（`-server-gateway-accounts`）；与声明的 `quota-per-model` 合 7 件。逐件改点与行号 = `.thincoder/tmp/quota-v2-a-随正/映射单.md` 搬入清单。

**§5 B 棒追加（前端面 · 2026-10-07）——交付摘要（逐档；行数 = 本会话实读，末行无尾空行计；估值 = §2.5）**

- `public/i18n.mjs`（110 ⇒ **137**，估 ≈120——越估 17 披露）：`t()` 计数复数形（KD-SV-44）——数字参 `count` ∥ `tokens` 任一 ⇒ `Intl.PluralRules`（按语言缓存）取形选键，查序 = `${key}.${form}`（当前表 → zh 表）→ 基键；占位替换抽 `fill` 共用（`lookup` 同用）。
- `public/i18n-zh.mjs`（345 ⇒ **345**——净 0，估 ≈345）：新 2 键（`admin.members.colDisabled` ∥ `admin.members.disableHint`）∥ 死键 2 枚删（`col.actions` ∥ `admin.members.quotaEmptyHint`）。
- `public/i18n-en.mjs`（341 ⇒ **348**，估 ≈348）：同上 2+2；另 `.one` 变体 7 枚（`common.rowCount` ∥ `common.modelQuotaCount` ∥ `admin.members.windowTokensCell` ∥ `admin.members.quotaOffListNote` ∥ `me.keys.windowTokens` ∥ `admin.providers.discovered` ∥ `admin.providers.testOk`——仅 en 表载体）。
- `public/views-admin.mjs`（275 ⇒ **331**，估 ≈325——越估 6 披露；越 300 软线在册）：查看态 = 模型表直显 5 列（模型 ∥ 每月用量（覆盖 ∥「按平台」）∥ 平台默认（未设 ⇒「不限」）∥ 本月已用（`modelUsage` 逐行——缺 ⇒ 0）∥ 禁用勾选）；离表注行（只数覆盖键）；表下 `disableHint`；禁用勾选即时写（`POST /api/members/:id/model-disables` 单键合并 true/null——在飞禁用 ∥ 成功静默 ∥ 失败回弹 + 窗内状态行）；providers 取数进窗即拉（查看/编辑两态共用；在飞不重拉）；`render()` 起始清窗内状态行（防跨态残留——内评审 🔵 已修）。
- `public/views-models.mjs`（207 ⇒ **216**，估 ≈216）：列表第四列 = 配额（`settings[上游].quotaTokens`；未设 ⇒「不限」 ∥ 嵌入行「—」——与 F 组单源）；保存 ⇒ `await reload?.()`（保存后列表刷新随动）。
- `public/views-audit.mjs`（91 ⇒ **91**，估 ≈90——越估 1 披露）：删卡内 h3（#995——单标题；`audit.title` 引用恰 1 处）。
- 延长 `docs/batches/2026-10-07-quota-v2-member-models.test.mjs`（416 ⇒ **745** 行）：B 棒四腿 ⑨–⑫（i18n 键面 + 复数取形直测 ∥ 成员弹窗查看态：5 列 ∥ 逐行已用 ∥ 禁用即时写「在飞/回弹/静默」∥ 两态共用取数 ∥ 重试在飞守卫 ∥ 服务模型页配额列三态 + 保存后刷新 + 审计页单标题 ∥ 静态面 canon）。

**读数（本会话实跑 · cwd = `thincoder/`）**

- 新批内件（A+B 十二腿）：**12/12 全绿**；B 改后复跑亦 12/12。
- 随正 7 件（tmp 舱原样实跑）：**48/48 全绿**（`-completeness-2` 6 ∥ `-console-modals` 6 ∥ `-provider-redo` 8 ∥ `-models-config-ui` 7 ∥ `-models-config` 7 ∥ `-server-i18n` 6 ∥ `-console-layout` 8）。
- 落盘前门禁二十件实测（在盘未搬入态）：**167 例 ∥ 158 pass ∥ 9 fail**——9 fail 全落随正 7 件（失败件集恰 = 7，无表外文件）；搬入即归零。
- 未触面复跑：`-console-list-style` ∥ `-console-providers` 零改且全绿；`"hint error"` 字面量全 public 总 15 不变（views-admin 4 处 = 复用既有节点/共享失败面构建器，零新增）。
- `node --check` 全部改件通过。**仓套件未跑** —— `not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**决策透明表（B 棒）**

| # | 决策 | 备选 | 何故 |
|---|---|---|---|
| 1 | 取形触发 = 数字参 `count` ∥ `tokens` 任一 | 只认 `count` | §2.5 预置 7 枚 `.one` 中 2 枚（`admin.members.windowTokensCell` ∥ `me.keys.windowTokens`）只有 `{tokens}` 参——count-only 使其成死件；`views-me.mjs` 不在本棒写域。**父侧裁：并集口径成立**（2026-10-07）；设计档 §2.2 / KD-SV-44 单句隨正 = 父侧小笔（收口轮落） |
| 2 | 查看态用一张模型表（非离表行表 + 新类） | 新增独立类/壳 | 零新 CSS（AC-19 canon 零触）；两态各按档面列头、同表形 |
| 3 | 服务模型页配额列头复用 `admin.models.quotaTitle`；未设值键复用 `common.quotaUnlimited` | 新键 | 本批键面只 +2（§2.2 键族登记）；设计未点名列头键 |
| 4 | 禁用勾选成功不重渲（勾选态自持） | 成功即重渲 | §2.4② 定则（即时写、无批提交面）；批内件以「表节点恒等」机检零重渲 |
| 5 | `render()` 起始清窗内状态行 | 不动 | 内评审 🔵：失败文案跨态残留（禁用失败 ⇒ 进编辑态仍带旧文案）；一行修 + 复跑全绿 |

**接受不修（评审非阻塞项——父侧可裁）**：① 会话失效早退跳过在飞解锁（`views-admin.mjs` `toggleDisable` 401 早退 ⇒ 尾行 `box.disabled = false` 不执行）——`fail()` 语义 = 导航登录（弹窗随路由退场）⇒ 无害；且与同档 `saveQuotas` ∥ `loadQuotaFace` 两处早退同形（单独改 = 风格不齐），留待清理轮。② 设计档 §2.5 行数回填（六档实读 + 批内件 745 行）——收口轮（设计/父侧面）。③ 批内件 ⑫ 对 `views-admin.mjs` 行数断区间 (>300, ≤500]、不钉精确值——软线在册口径（拆分轮随正）。④ 随正件 `-server-i18n` 两处模块解析形改 cwd 相对式（tmp 舱与 `docs/batches/` 层级不等 ⇒ 舱内可达性；载入目标逐字未变、语义零变）——映射单已披露。

**审计与代码评审轮次与终态（B 棒）**

- ① 内探索背离审计（只读子代理；对照批档 §2 + `WEBUI.md` §2.2/§2.4②③/§6 AC-23 + `ACCOUNTS.md` §2.2/§7 B26）：**clean**——0🔴 ∥ 2🟡/低（doc-drift：取形触发句（父侧已裁）∥ §5 行数回填（收口轮））∥ 2🔵（披露题：8 个 tmp 跑件器脚本 ∥ 「在飞重入守卫」无直测——已随修轮补测）。四类背离（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）零命中（A–H 八条声明面逐条核过）。
- ② 内 advisor 代码评审（public 六档 + 批内件 + tmp 舱 + 批档 + `WEBUI.md` + `ACCOUNTS.md`）：**VERDICT pass**——0🔴 ∥ 7 发现（🟡×5：① 取形触发档面句（父侧已裁）∥ ② 两舱重名件搬入次序（本舱两件 = 并集，须最后搬——映射单已补记）∥ ③ 随正搬入未落 ⇒ 仓门禁现红（父侧动作）∥ ④ 三档越 300 软线（在册债，本批不触发）∥ ⑤ §5 B 棒段未落（本段即补）；🔵×2：⑥ 窗内状态行跨态残留（已修）∥ ⑦ 会话失效早退跳过在飞解锁（接受不修①））。
- fix round（自纠 ≤5）：实施中 2 轮自纠（tmp 随正件编辑面——① 重复块误入（同句 `const` 重声明）∥ ② 桩字段误删（`fail`/`showSecret` 回归）——两处均即修并复跑）＋ 评审后 1 修（🔵⑥ 跨态残留 ⇒ 一行修 + 件与随正复跑 60/60 全绿）。
- 终态：**converged（clean）**。

**披露（B 棒——偏离/越限/待搬）**

- **tmp 待搬**：7 件随正改稿 + `映射单.md` 在 `.thincoder/tmp/quota-v2-b-随正/`（跨批写闸机械拒——预期；父侧**同名覆盖搬入** `docs/batches/` + 收口轮门禁复跑）。**搬入次序**：本舱 `-completeness-2` ∥ `-console-layout` 两件与 A 棒舱重名且为并集（已含 A 侧改点）⇒ 两件须最后搬（防回退 A 侧改点）。
- **越清单**：除声明写域（public 六档 + 批内件）外 = 7 件旧批档 companion 测试件的随正改稿（5 件 `.one` 键集族 ∥ 1 件 UI 行形（配额列 4 列）∥ 1 件查看态行断言；其中 2 件含 A/B 两棒改点）；无新增档、无删除档。
- **行数越估**：`i18n.mjs` +17 ∥ `views-admin.mjs` +6（越 300 软线在册）∥ `views-audit.mjs` +1；余三档在估内；批内件 416 ⇒ 745（B 四腿 ≈330 行——设计估 ≈450 未含 B 腿）。
- **零动面实核**：`app.mjs` ∥ `modal.mjs` ∥ `style.css` ∥ `nav.mjs` ∥ `model-specs-snapshot.mjs` ∥ `views-*.mjs` 余档（auth/me/overview/providers/providers-modals/system/usage）∥ 后端 `src/**` ∥ `package.json` 零触。
- **tmp 工具档**：8 枚跑件器/读数脚本（run ∥ gate ∥ gate-parse ∥ perfile ∥ diff ∥ hunks ∥ census ∥ keys ∥ final）住 `.thincoder/tmp/`——不随批留存、不进仓套件（内审计列为披露题）。

**§5 B 棒自我更正（同段追加）**：上段「tmp 工具档」行计数口误——B 棒跑件器/读数脚本实为 **9 枚**（`run` ∥ `gate` ∥ `gate-parse` ∥ `perfile` ∥ `diff` ∥ `hunks` ∥ `census` ∥ `keys` ∥ `final`），均住 `.thincoder/tmp/`、不随批留存、不进仓套件。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-07）**

**链条**：设计轮（§2 · eng-designer）→ 设计评审 pass（§3）→ 修正轮 #4（§2.9）→ **§4 代签**（在档——用户 12:25「自动跑」+ 13:01「可以，自动干到落地」全链授权 · 自缚三条）→ 实施 **A 棒 #7 + B 棒 #8**（各 converged：内审 clean ∥ 顾问评 pass ∥ fix 轮闭环）→ 父侧核验 + 收口。

**父侧核验读数（亲跑 · cwd = `thincoder/`）**：
- **随正 7 件搬入**（B 舱 `.thincoder/tmp/quota-v2-b-随正/`——映射单次序照守：并集两件 `-completeness-2` ∥ `-console-layout` 最后）⇒ 同名覆盖落 `docs/batches/`；
- **门禁二十件**（`thincoder-server` `prepublishOnly` 全跑）：搬入前 167 例 ∥ 158 pass ∥ 9 fail（失败集恰 = 7 件随正件）⇒ **搬入后 167 / 167 全绿**（9 处随正归零——与映射单预期逐字吻合）；
- **走查（真浏览器 · 父侧自跑——`scripts/console-walkthrough.mjs` 同法临时件）**：① 成员弹窗查看态五列实证 = **模型 ∥ 每月用量 ∥ 平台默认 ∥ 本月已用 ∥ 禁用**（`modalTable.headers` 机读在案）+「勾选 = 对该成员禁用（默认可用）」提示行在面（KD-SV-43 落面）；② 服务模型页第四列「配额」在册（`bge-m3 / embedding / embeddings / —`——嵌入行「—」恰为三态之一）；③ 审计页单标题（h3 删净）；④ 证据件 = `.thincoder/tmp/v2walk-*.png` ×6 + `v2walk.json`；
- **设计档行数回填（父侧笔 · 实读链）**：`WEBUI.md`（六档 + app ∥ style + 小计 ⇒ **实读 3269**——越估 ≈24 在册）∥ `ACCOUNTS.md`（四档 + 小计 ⇒ **实读 897**——越估 ≈25 在册）∥ `METERING.md`（aggregates 173 ∥ report 168）∥ `API.md`（routes 111）；METERING/API 小计聚合重算 = #983 域（在册）；
- **规范面随正（父侧笔）**：`WEBUI.md` §2.2 / KD-SV-44 补「数字参 `count` ∥ `tokens` 并集」（实读 `public/i18n.mjs:41` 坐实）+ §1 越线清单随正（app 321 ∥ i18n 双表 345/348 ∥ views-admin 331）；
- **doc-check**：悬空 65 = 基线持平 ∥ 行宽 OK；
- **API-CONTRACT 重生成 = 延迟**（防卷入在飞 #14——其写面含 server 树；三链全落一笔重跑）。

**接受不修（裁）**：B① 会话失效早退跳过在飞解锁（导航登录即退场——无害，留清理轮）∥ B③ 行数断言区间不钉精确值（软线在册口径）∥ B④ 随正件模块解析 cwd 相对式（语义零变——已披露）∥ A① 探针版本字面量（沿每版随正惯例）。**A② （键形助手对带空白键不拒）⇒ 父侧裁：登记入池**（新行——收紧候选，条件触发）。

**核销（七行）**：#988 ∥ #994 ∥ #995 ∥ #1001 ∥ #1002 ∥ #1003 ∥ #1004——在途 → 待核销 → 已核销（随本 §6）。**暂缓批复核**：无。**用户文档面**：需求档 `server/requirements/PROJECT.md` §2:23 三行（原话条目）在册 ✓。

**提交**：路径限定（产品面 15 档 + 文档面 5 档 + 批档 2 件 + 随正 12 件）；双推（origin/gitee ∥ github）。

**§6 补（同段追加 · 2026-10-07）**：提交面两档例外——`src/store/db.mjs` ∥ `public/i18n-zh.mjs` 在提交时刻已含在飞 **#14**（#1005 批）改稿（v7 段 ∥ key 面）⇒ 本批提交**排除该两档**（防未完成交付卷入）；其 v2 改动面（v6 段 ∥ 死键删）随 #1005 批收口提交嵌合入账（该批 §6 记）。

**§6 补（二 · 同段追加——排除面权威表）**：提交面排除**六档**（皆含 #1005 在飞/未提交笔，防混卷）：`thincoder-server/src/store/db.mjs`（v7 落盘）∥ `thincoder-server/public/i18n-zh.mjs`（#14 写面）∥ `docs/server/design/webui/WEBUI.md` ∥ `docs/server/design/gateway/API.md` ∥ `docs/server/design/store/STORE.md` ∥ `docs/server/requirements/PROJECT.md`（后四档 = v2 设计面 + #1005 设计面同档叠置）。**实际提交面（29 件）** = 产品面 13（public 六 + src 七 ∥ `package.json`）∥ 文档面 2（`ACCOUNTS.md` ∥ `METERING.md`）∥ 批档 2 ∥ 随正 12。排除面之 v2 改动（db v6 段 ∥ i18n-zh 死键删 ∥ 三设计档 v2 行 ∥ 需求档 §2:23）随 #1005 批收口提交嵌合入账（该批 §6 记同拍）。
