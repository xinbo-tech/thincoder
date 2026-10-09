# 2026-10-09 · server-console-testkey-fix
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 11:38「那这是个bug啊！都保存进去了还测试个鬼，当然应该是用还没保存的key测试啊！」+ 11:40「存进去的key测试连接是可以的，你先把这个bug修了。」——控制台 provider 详情弹窗「测试连接 ∥ 刷新候选」用库内 key、未用表单未保存 key。
> 台账 = #1120（server · 归批）。前情 = docs/batches/2026-10-09-server-test-env-ecs.md §1（在途——测试环境批；缺陷于其控制台使用中暴露）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-09）**

**来源与授权（用户逐字）**：11:38「那这是个bug啊！都保存进去了还测试个鬼，当然应该是用还没保存的key测试啊！」+ 11:40「存进去的key测试连接是可以的，你先把这个bug修了。」⇒ 口径 = **测试连接应以表单里未保存的 key 为准**（库内 key 测通已由用户确认）；本批 = 该缺陷修复批（台账 #1120，条件触发命中）。

**范围**：详情弹窗（编辑既有 provider——`public/views-providers-modals.mjs`）两处调用点：「测试连接」(`:288`) ∥「刷新候选」(`:268`) 现只送 `{baseURL, providerId}`（走库内 key）⇒ 改为「明填 ⇒ 明传 `apiKey`；留空（掩码未动）⇒ 回落 `providerId`」。**服务端零动**（`provider-admin.mjs:224-230` 已支持明传优先：`apiKey` > `providerId`）；新增弹窗（`:178-188`）已是明传形——参照面，非改动面。

**在册**：① 部署收尾 = 镜像重建 + 重收敛 + 用户复测原流程（`public/**` 在镜像内——修复落地后父侧执行）；② 同线在途 = bin 修复批（`docs/batches/2026-10-09-server-bin-guard-fix.md`——两批独立；本批设计舱因 `design/PROJECT.md` 写面与在飞的 bin 修复轮冲突，随调度排队自动串行）。

**§1 授权（用户 2026-10-09 11:41「这个也直接跑完吧。」）**：本批全链授权（循本仓先例）——设计评审点火权（代点火）∥ §4 用户批准（父侧代签）∥ 修正轮 ∥ 实施轮派发 ∥ 收口核销 · 提交 · 推送 · token 耗。

**父侧自缚三条（本仓惯例）**：① 代签仅当三条件齐备（评审 pass〔0🔴〕∧ 修正轮已落地并逐条核验 ∧ token 已签发）——代签在 §4 写明「父侧代签（用户 11:41 授权）+ 三条件依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆（数据 ops ∥ 强杀 ∥ 外仓写）⇒ 先停。

**射程说明**：含部署收尾（镜像重建 + 重收敛 + 用户复测原流程——§1 在册）；不含相邻缺陷面（另册：同族 #1114 等）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-09——设计落 WEBUI.md §2.4④/§6/§7 KD-SV-54 + PROJECT.md §4/§6/§7/§9 R44；评审轮次 1 #1–#3 收正 · 修正块在册；复评/批准 = 父侧）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 批次任务与设计（控制台测试 key 缺陷修复 ∥ 台账 #1120——2026-10-09 · eng-designer）

**轮次**：initial（缺陷修复批——用户 11:38/11:40 裁定 = §1）。

**本批条目（覆盖）**：1 条——「测试连接 ∥ 刷新候选」（含详情弹窗首开自动拉取）key 口径收正：两处调用点须以**表单未保存的 key（草稿态）**为准（现码只送 `providerId` ⇒ 库内旧 key——用户实测缺陷）。

| # | 条目（来源回指） | 设计落点 | 状态 |
|---|---|---|---|
| 1 | 测试/发现以未保存的 key 为准（用户 11:38/11:40；台账 #1120；需求档回笔 = 主 agent 笔，见上抛） | `webui/WEBUI.md` §2.4④（机制全文）∥ §6 AC-18 行（机检子句）∥ §7 KD-SV-54 | ✅ 覆盖 |

**设计档落点（本设计轮已落——`file:line` 逐处可核）**：

- `docs/server/design/webui/WEBUI.md`：§2.4④ 详情弹窗行 :228 ∥ 勾选段行 :229 ∥ §5 `views-providers-modals.mjs` 行 :493（367 ⇒ ≈375）∥ 小计行 :514（⇒ ≈3704）∥ §6 AC-18 行 :529 ∥ §7 表尾增 KD-SV-54 :569 ∥ §8 增本批不做面句 :587 ∥ 变更记录尾 :646。
- `docs/server/design/PROJECT.md`：§4 标题 :84（KD-SV-1–53 ⇒ 1–54）+ 索引行 :141 ∥ §6 预算行 :171 + 随动表行 :214 ∥ §7 AC-18 行 :269 ∥ §9 增 R44 :339 ∥ 变更记录尾 :391。
- 本批档 §2（本段）。

**机制设计（全文 = `webui/WEBUI.md` §2.4④）**：

- **修改坐标与最终形**（`thincoder-server/public/views-providers-modals.mjs`——两处调用点同修）：①「刷新候选」/首开自动拉取 `loadCandidates()` :261-279——请求体行 **:268**；②「测试连接」`testConnection()` :283-291——请求体行 **:288**。
  最终形 = 两处同源一助手（详情弹窗体 `clearKey`/`keyInput` 就位区间 :249-253 之后新增，拟名 `draftKey()`）——判定三支：清除勾 ⇒ `{ apiKey: "" }` ∥ 明填（trim 非空）⇒ `{ apiKey: <草稿值> }` ∥ 否则 ⇒ `{ providerId: provider.id }`；调用点收形 = `body: { baseURL, ...draftKey() }`（两处逐字同形）。
  注释随正（D8——失效表述删净）：文件头 :12 ∥ `loadCandidates` 注释 :260 ∥ `testConnection` 注释 :282——三处「`providerId` 取库内 key / key 取库内」表述 ⇒ 草稿 key 口径。
- **三支判定**（与保存的 key 判定同式——保存 :330-331）：① 明填 ⇒ 明传 `apiKey`（`env:` 引用原文照送——服务端解析，前端零解析）；② 留空且未勾清除 ⇒ 省略 `apiKey`、携 `providerId`（库内 key 回落——现状形；首开自动拉取即此支）；③ 清除勾 ⇒ 显式空 `apiKey: ""`（= 保存语义镜像——保存清空后不发 Authorization 头）。
- **服务端零动（已就绪）**：`provider-admin.mjs:223-230` 明传优先（`apiKey` 在场（非 `undefined`/`null`）⇒ 明传 ∥ 否则 `providerId` ⇒ 库内 ∥ 皆缺 ⇒ 空）；`apiKey: ""` ⇒ `resolveProviderKey("")` = `""`（`providers.mjs:69-77`）⇒ `provider-admin.mjs:236` 不发 Authorization 头。契约零改（`gateway/API.md` §2.2 发现行原样——`{ baseURL, apiKey?, providerId? }`）。

**关键决策**：

- **①「清除密钥」勾选 × 测试 = 显式空**（保存语义镜像）。理由 = 用户口径「用未保存的 key」的自然延伸：测试 = 表单草稿态保存后真实行为的镜像；清除勾下若回落库内 key，即重演本缺陷类（测试无视表单意图）。被否 = 忽略清除勾（测试回落库内 key——同上）。另：另填值 ∧ 清除勾 ⇒ 以清除为准（保存同式 :330）。
- **② 两处调用点同修**（同因同面——只修一处留同病；助手单源使两处判定恒同）。
- **③ 结果行文案零动**（`testing`/`testOk`/错误映射原样）：结果行语义 = 连通/失败——不示 key 来源；key 来源差异由表单（掩码占位 ∥ 输入）承载；免新键与两表翻倍。被否 = 加「以草稿 key 测试」注文（无判据收益）。

**受影响文件与测试面**：

- 产品码（实施轮）：`thincoder-server/public/views-providers-modals.mjs`（实读 **367** ⇒ ≈375——助手 +≈6 ∥ 两调用点与三处注释随正）；`i18n-*` ∥ `style.css` ∥ `views-providers.mjs` ∥ `src/**` = **零触**（服务端 = 禁止面）。
- 板级件：`thincoder-server/package.json`（`prepublishOnly` 清单添本批件——拟新增；单行清单行数零变）。
- 批内件：`docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`（拟新增——估 ≈160 行；实现者写、实现者跑）。形态 = **轻量打桩**（桩 DOM 驱动真弹窗 + 桩 ctx 收请求体——沿 `2026-10-06-console-provider-redo.test.mjs` 先例）；运行 = 自 `thincoder/` 仓根 `node --test docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`。
- 随正件：无（零新档 ∥ 零新键 ∥ 档目 29 ∥ 30 不变 ∥ 零断点）。

**验收对照（行为判据——机检；批内件腿）**：

| 腿 | 场景（详情弹窗） | 断言：`POST /api/admin/providers/discover` 请求体 | 现码（红）/修后 |
|---|---|---|---|
| ① | 密钥框填 `sk-new-123` ⇒「测试连接」 | 含 `apiKey: "sk-new-123"`（与草稿值一致） | 红（现送 `{ baseURL, providerId }`）⇒ 绿 |
| ② | 密钥框留空 ⇒「刷新候选」 | = `{ baseURL, providerId: <id> }`（不含 `apiKey`） | 绿（回归保持） |
| ③ | 密钥框留空 ⇒「测试连接」（首开自动拉取同支） | 同② | 绿（现状形保持） |
| ④ | 清除勾（留空 ∥ 另填两态）⇒「测试连接」/「刷新候选」 | = `{ baseURL, apiKey: "" }`（不含 `providerId`） | 红 ⇒ 绿 |
| ⑤ | 添加弹窗参照面回归：「获取模型」留空 ⇒ 无 `apiKey`；明填（含 `env:` 引用）⇒ `apiKey` 原文照送 | 同现状 | 绿（参照面零改） |

腿①④ = 红→绿核心；腿②③⑤ = 回归守护。机检载体 = 批内件（上述）；真机复测 = 收尾用户原流程。

**边界（不做）**：服务端 `src/**` 零触 ∥ 添加弹窗语义零改（参照面）∥ 结果行文案零动 ∥ 零新依赖 ∥ 相邻同族缺陷面（另册——#1114 等）不入本批 ∥ 需求档（主 agent 笔——回笔项 = 上抛）。

**收尾注记（父侧执行项——§1 在册）**：镜像重建（含修复）+ 重收敛 + 用户复测原流程（「填新 key ⇒ 测试连接」应通；`public/**` 在镜像内）。

**上抛项**：〔上抛·知会〕需求档回笔（主 agent 笔）——功能点 18③ / AC-18 行补「测试连接 ∥ 刷新候选 key = 草稿口径（未保存 key）」判据句；设计侧行已随正（`webui/WEBUI.md` §6 AC-18 行）。

### 机检收正（本设计轮同日落账——行宽 ∥ 路径锚）

`doc-check`（仓根 `node scripts/doc-check.mjs`）两闸初红 ⇒ 逐条收正 ⇒ 复跑全绿（**exit 0** ∥ 悬空 0 ∥ 超宽 0——2026-10-09 实跑）：

- **行宽 2 行**（>300 字符——文档人类可读判据，超宽行 ①②）：① `WEBUI.md` :228 原 416 字符 ⇒ 拆主行 + 子行（主行 ≈256 ∥ 子行 ≈190）；② `PROJECT.md` :171 原 414 字符 ⇒ 拆两行（≈130 + ≈200）。
- **悬空锚 2 条**（属闸态——阈值 0）：`provider-admin.mjs:223-230` 两处（WEBUI §7 ∥ §8 各一——basename 二义：`thincoder-cli/src/tui/provider-admin.mjs` 同名）⇒ 改全路径形 **`thincoder-server/src/gateway/provider-admin.mjs:223-230`**。
- **落点序号位移（+1——本收正后实读，详见 §2 上节之「设计档落点」同项）**：`WEBUI.md` — 详情弹窗主行 **:228**（不变）∥ key 口径子行 **:229**（新）∥ 勾选段 :229 ⇒ **:230** ∥ §5 行 493 ⇒ **:494** ∥ 小计 514 ⇒ **:515** ∥ §6 AC-18 529 ⇒ **:530** ∥ §7 KD-SV-54 569 ⇒ **:570** ∥ §8 句 587 ⇒ **:588** ∥ 变更记录尾 646 ⇒ **:647**；`PROJECT.md` — §4 标题 **:84** ∥ 索引行 **:141**（不变）∥ §6 预算行 **:171-172**（拆两行）∥ 随动表行 214 ⇒ **:215** ∥ §7 AC-18 269 ⇒ **:270** ∥ §9 R44 339 ⇒ **:340** ∥ 变更记录尾 391 ⇒ **:392**。
- **后续读取口径**：§2「设计档落点」节序号 = 本收正前实读（序差 +1）；评审/实施轮请以本收正列出的序号读档。

### 修正块（fix 轮——评审轮次 1 #1–#3 收正；父侧裁定全收 · 2026-10-09）

- **#1（影响面登记 🔴）**：随正件登记补列（原「受影响文件与测试面」随正件句 =「无」——以本块为准）。**门禁件数断言七件 N ⇒ N+1——注释同拍**（N 以实施当刻盘面实读为准——本 fix 轮实读 2026-10-09 = 28 ⇒ 29；在途批入链先后影响绝对值）：`docs/batches/2026-10-06-console-list-style.test.mjs:237` ∥ `docs/batches/2026-10-06-server-auto-update.test.mjs:480` ∥ `docs/batches/2026-10-07-console-layout.test.mjs:449` ∥ `docs/batches/2026-10-07-me-usage-charts.test.mjs:225` ∥ `docs/batches/2026-10-07-provider-model-metadata.test.mjs:491` ∥ `docs/batches/2026-10-07-quota-per-model.test.mjs:444` ∥ `docs/batches/2026-10-07-quota-v2-member-models.test.mjs:428`（皆 `assert.equal(batchFiles.length, …)`——断言消息含现值与入链来源，随正同拍；行数 ±0——断言文本就地收正）。
- **#1 续（文档链随正）**：28 ⇒ 29 链写已落 = `docs/server/design/ops/OPS.md` §5.1（`:102`）∥ `docs/server/design/PROJECT.md` §6 板级行（`:180-181`）。落点实读（已落）：批档 = 本块 ∥ `design/PROJECT.md` §6 本批预算行随正件行（`:173-174`）∥ §9 R44③（`:342`）。
- **读差注（供复评）**：评审发现①谓「七件现断 27」——实读现值 = **28**（bin 批实施已随正——断言消息「二十六 ⇒ 二十八——结构轮批件入链 ∥ 10-09 bin 修复批件入链」在证）；本批件入链后 ⇒ 29。绝对值以实施当刻盘面为准（本批登记取 N ⇒ N+1 相对式）。
- **#2（文档状态 🟡）**：`docs/server/design/PROJECT.md` §9 R44① 收正为**已办**（2026-10-09——需求档变更记录在册）：回指 `docs/server/requirements/PROJECT.md:265`（§2:18 草稿口径句 ∥ `:77` 口径句 ∥ `:157` AC-18 判据句）；② 部署收尾条保留（未动）。
- **#3（口径表述 🔵）**：`docs/server/design/webui/WEBUI.md` §2.4④ 机制行（`:229`）同句补优先序半边（**清除勾 ⊃ 明填**——另填值 ∧ 清除勾 ⇒ 以清除为准；保存同式——不新起行）；§6 AC-18 行（`:530`）点名两调用点（「测试连接」∥「刷新候选」——含首开自动拉取）。
- **机检读数（fix 轮收正后复跑）**：`node scripts/doc-check.mjs`（仓根）⇒ **EXIT 0** ∥ OK(锚)：0 条悬空 ∥ OK(行宽)：无 >300 字符单行。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 影响面登记 | 🔴 | 本批把新批内件加入 `prepublishOnly` 链（批档 `:60`：「`prepublishOnly` 清单添本批件——拟新增；单行清单行数零变」），但随正件记「**随正件**：无（零新档 ∥ 零新键 ∥ 档目 29 ∥ 30 不变 ∥ 零断点）」（批档 `:62`）。实读 `thincoder/thincoder-server/package.json:13` 清单现 28 项（末项 = 在途 bin 批件），而七件既有断言件以硬编码件数断言 `assert.equal(batchFiles.length, 27, …)`：`thincoder/docs/batches/2026-10-06-console-list-style.test.mjs:237` ∥ `thincoder/docs/batches/2026-10-06-server-auto-update.test.mjs:480` ∥ `thincoder/docs/batches/2026-10-07-console-layout.test.mjs:449` ∥ `thincoder/docs/batches/2026-10-07-me-usage-charts.test.mjs:225` ∥ `thincoder/docs/batches/2026-10-07-provider-model-metadata.test.mjs:491` ∥ `thincoder/docs/batches/2026-10-07-quota-per-model.test.mjs:444` ∥ `thincoder/docs/batches/2026-10-07-quota-v2-member-models.test.mjs:428`——本批件入链后七件必红（门禁链非零退）。先例 = `design/PROJECT.md` §6 注⑩/注⑪/注⑫④（「门禁件数」随正逐批登记）；本批设计两处（`design/PROJECT.md:172`/`:215`）只记 package.json ±0/＋1 件，未登记该随正面。 | 随正件登记补列「门禁件数断言七件（上列 file:line）N ⇒ N+1——注释同拍」，同为落点 = 批档 §2 ∥ `design/PROJECT.md` §6 预算行/§9 R44；N 以实施当刻盘面实读为准（在途批入链先后影响绝对值）。 |
| 2 | 文档状态 | 🟡 | `thincoder/docs/server/design/PROJECT.md:340` R44① 仍记需求档回笔为待办：「① 需求档回笔（主 agent 笔——随本批评审/收口）」——而需求档已回笔在盘：`thincoder/docs/server/requirements/PROJECT.md:265`「§2:18 补测试/发现 key 草稿口径句」+ `:77`/`:157` 判据句在册（变更记录署名「承批 `2026-10-09-server-console-testkey-fix` 设计轮 R44①」）——跨档状态滞后（R7a 类）。 | R44① 收正为「已办（2026-10-09）」并回指 `requirements/PROJECT.md:265`；② 部署收尾条保留。 |
| 3 | 口径表述 | 🔵 | `thincoder/docs/server/design/webui/WEBUI.md:229` 三支未明写「清除勾 ∧ 明填」优先序（序读可两解）；批档 `:53` 决策①已定「另填值 ∧ 清除勾 ⇒ 以清除为准（保存同式 :330）」，实现镜像 = 保存 `:330-331`（清除勾先判）。另 AC-18 行（`WEBUI.md:530`）子句主语仅点「测试同窗」，「刷新候选」调用点未点名（KD-SV-54 已含两处）。 | 机制行补半句优先序（清除勾 ⊃ 明填——保存语义同式）；AC-18 机检子句可点名两调用点（测试连接 ∥ 刷新候选——含首开自动拉取）。 |

范围外注（无 severity）：`package.json` 单行清单 = 在途 bin 批（#1113）与批共同追加面；件数绝对值随两批落地先后浮动——非本批评审面，仅登记。

**核验读数**（criterion-8 抽查与落点实读）：`views-providers-modals.mjs` 实读 **367** 行（与 `WEBUI.md:494` ∥ `design/PROJECT.md:171` 一致；367 ⇒ ≈375，未越 500 软线）；两调用点 `:268`/`:288`、保存镜像 `:330-331`、注释三处 `:12`/`:260`/`:282`、助手落点 `:249-253` 实读命中；设计档落点（`WEBUI.md` `:229`/`:530`/`:570` ∥ `design/PROJECT.md` `:84`/`:141`/`:171-172`/`:215`/`:270`/`:340`）逐处实读命中；批档 §2 机检收正序差 +1 已声明在案。

VERDICT: changes-required

**计数**：🔴 1 ∥ 🟡 1 ∥ 🔵 1（共 3 发现）

### 轮次 2（评审子代理）

**轮次 2（复评——验修正声明 · 承轮次 1 三发现）**

| # | Orig# | 项 | 状态 | 核验（本轮实读） |
|---|-------|----|------|------------------|
| 1 | 轮1 #1（🔴 影响面登记） | 门禁件数断言随正登记 | ✅ Fixed | 批档修正块 `:93` 补列「门禁件数断言七件 N ⇒ N+1——注释同拍（N 以实施当刻盘面实读为准——本 fix 轮实读 2026-10-09 = 28 ⇒ 29；在途批入链先后影响绝对值）」+ `:94` 文档链随正；`design/PROJECT.md:173-174`（随正件行）∥ `:342` R44③ 同拍；链写实读 = `ops/OPS.md:102`「批内件 28 ⇒ 29 件（八 + #962/#963/i18n/#972 件 + 后续各批 16 件）」∥ `design/PROJECT.md:180-181`「`prepublishOnly` 清单 28 ⇒ 29 件」。盘面核：七件断言现读 **28**（`-console-list-style:237` ∥ `-server-auto-update:480` ∥ `-console-layout:449` ∥ `-me-usage-charts:225` ∥ `-provider-model-metadata:491` ∥ `-quota-per-model:444` ∥ `-quota-v2-member-models:428`）+ `thincoder-server/package.json:13` 清单实读 **28** 项 ⇒ 「28 ⇒ 29」现值准确、相对式（N 以实施当刻盘面为准）成立；轮 1「现断 27」读数已由批档 `:95` 读差注透明收正（以实读为基）。 |
| 2 | 轮1 #2（🟡 文档状态） | R44① 状态滞后 | ✅ Fixed | `design/PROJECT.md:342` R44① 已收正为「需求档回笔（**已办**——2026-10-09；主 agent 笔）……回笔在盘 = `docs/server/requirements/PROJECT.md:265`（变更记录在册：§2:18 草稿口径句 ∥ `:77` 口径句 ∥ `:157` AC-18 判据句）」；② 部署收尾条保留；`design/PROJECT.md` 变更记录 `:395` 同拍。需求档 `:77`/`:157`/`:265` 实读在盘。 |
| 3 | 轮1 #3（🔵 口径表述） | 优先序 + 两调用点点名 | ✅ Fixed | `webui/WEBUI.md:229` 已补「**清除勾 ⊃ 明填**——另填值 ∧ 清除勾 ⇒ 以清除为准（保存同式）」；`:530` AC-18 行已点名「「测试连接」∥「刷新候选」（含首开自动拉取）同窗（key = 草稿口径——明填 ⇒ 请求体 `apiKey` = 草稿值 ∥ 留空且未勾清除 ⇒ 省略 `apiKey`、携 `providerId` ∥ 清除勾 ⇒ `apiKey: ""`；批内件断言——2026-10-09 修复批）」；KD-SV-54 `:570` 与之同拍；变更记录 `:648` 落账。 |

**新发现**：无（修复未引入新 🔴/🟡/🔵）。
**核验读数**：WEBUI 落点 `:229`/`:494`/`:515`/`:530`/`:570`/`:588` 逐处实读命中（修复 = 行内收正 + 变更记录尾增行——序差零，§2 落点表坐标仍有效）；`doc-check` 复跑读数按 fix 轮在册声明采信（本面无执行工具——未复跑）。

**计数**：轮 1 三发现 = 3/3 Fixed（🔴1 ∥ 🟡1 ∥ 🔵1）∥ 新发现 0。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（父侧代签 · 2026-10-09）**

- **批准**：本批设计（§2 ∥ `WEBUI.md` §2.4④/§6/§7 KD-SV-54）**准予实施**。
- **代签依据**：用户 2026-10-09 11:41「这个也直接跑完吧。」= 本批全链授权（§1 在册）；父侧自缚三条件齐备——① 评审 pass（§3 轮次 2 `VERDICT: pass`——0🔴 ∥ 新发现 0）② 修正轮已落地并逐条核验（轮 1 三发现 3/3 Fixed——§3 轮次 2 在册）③ 设计 token 已签发。
- **射程确认**：产品码 `thincoder-server/public/views-providers-modals.mjs` ∥ 板级件 `thincoder-server/package.json`（清单 +1 件——28 ⇒ 29）∥ 批内件（新建——实现者写、实现者跑）∥ 随正件七件断言（**父侧落地**——28 ⇒ 29 + 注释同拍，§2 修正块 #1 在册）。部署收尾（镜像重建 + 重收敛 + 用户复测原流程）= 父侧，实施落地后执行（§2 收尾注记）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（initial 轮——红绿两轮与静态读数落段（2026-10-09））



**§5 实施记录（eng-coder · 2026-10-09——initial 轮）**

**交付摘要**：详情弹窗「测试连接 ∥ 刷新候选」改以表单未保存 key（草稿口径）为准——新增单源助手 `draftKey()`（三支判定：清除勾 ⇒ `{ apiKey: "" }` ∥ 明填（trim 非空）⇒ `{ apiKey: <草稿值> }`（`env:` 引用原文照送）∥ 否则 ⇒ `{ providerId: provider.id }` 库内回落；与保存 key 判定同式——清除勾先判）；两处调用点逐字同形 `body: { baseURL, ...draftKey() }`；注释随正（D8——失效表述删净）；板级 `package.json` 清单 +1 件（28 ⇒ 29）。

**改动清单（含净行差）**：
- `thincoder-server/public/views-providers-modals.mjs` —— 367 ⇒ 376 行（净 +9）；助手 `:262-267` ∥ `loadCandidates` 调用点 `:277` ∥ `testConnection` 调用点 `:297` ∥ 注释四处 `:12`/`:230`/`:269`/`:291`。
- `thincoder-server/package.json` —— `:13` 清单末位添本批件（行数 ±0）。
- `docs/batches/2026-10-09-server-console-testkey-fix.test.mjs` —— 新建（201 行；评审后补腿④第 4 组合 +2）。

**机检读数（红绿两轮 + 静态检查）**：
- 红轮（修前现码——当刻批内件 199 行）：腿① 红（actual `{ baseURL, providerId: 7 }` vs expected `{ baseURL, apiKey: "sk-new-123" }`）∥ 腿④ 红（同 actual vs expected `{ baseURL, apiKey: "" }`）∥ 腿②③⑤ 绿——3/5 pass。
- 绿轮（修后复跑——含腿④补格，批内件 201 行）：同命令 **5/5 pass**。
- 命令 = 自 `thincoder/` 仓根 `node --test docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`。
- `node --check`：`views-providers-modals.mjs` Syntax OK ∥ 批内件 Syntax OK。
- `package.json` 清单：29 项 ∥ 去重 29 ∥ 末项 = 本批件（在盘）。

**决策透明表**：

| # | 决策点 | 决定 | 依据 |
|---|---|---|---|
| 1 | `:230` 注释（设计列举三处之外的第 4 处失效表述） | 同拍删净改述 | D8「失效表述删净」为类规则，三处列举 = 设计侧扫描清单；同文件同批准面，交付报告已声明（非静默超范围） |
| 2 | 腿④ 组合覆盖（评审 🔵） | 评审后补第 4 组合（清除勾+另填 ⇒ 刷新候选），复跑全绿 | 验收表「留空 ∥ 另填两态 × 两钮」逐格对齐；成本 2 行 |
| 3 | 行数（设计「367 ⇒ ≈375」） | 实读 367 ⇒ 376（净 +9） | 以实施当刻盘面为准（回填轮校正项） |

**审计与代码评审轮次与终态**：
- 内部背离审计（explore，read-only，blocking）：**CLEAN**——四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 名单外改动）均未发现；`:230` 超枚举处置独立判断 = 与设计意图一致（非静默超范围）。
- 内部代码评审（advisor code，sync）轮次 1：**VERDICT pass**——0🔴 ∥ 0🟡 ∥ 2🔵（① §5 记录空 → 本段落写 ② 腿④ 差一组合 → 已补）。
- fix round（本舱内）：评审后收正 = 腿④补格 + §5 落写；产品码评审后零改。

**评审轮次 2（fix 声明核验——advisor code，sync）**：**VERDICT pass**——轮 1 两 🔵 = 2/2 Fixed（§5 落写 ∥ 腿④补格 4/4），新发现 0；fix 面（批内件 +2 行 ∥ 批档 §5）复核一致，产品码评审后零改。终态 = `clean`。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-09 · 主 agent）**

**交付核验（父侧实读）**：`views-providers-modals.mjs` 367 ⇒ **376** 行（+9）——`draftKey()` `:262-267`（三支：清除勾 ⇒ `{ apiKey: "" }` ∥ 明填 ⇒ `{ apiKey: 草稿值 }` ∥ 否则 ⇒ `{ providerId }`；清除勾先判 = 保存镜像同式）∥ 两调用点逐字同形 `body: { baseURL, ...draftKey() }`（`:277` ∥ `:297`）∥ 注释四处随正（`:12`/`:230`/`:269`/`:291`——D8 失效表述删净）；`package.json:13` 清单实读 **29** 项（末项 = 本批件）。批内件红绿读数（交付报告）：红 3/5（腿①④）⇒ 绿 5/5；内部审计 CLEAN ∥ 代码评审两轮 pass（2🔵 已收）。

**门禁链随正（父侧直笔 · 机械计数 · 可 revert）**：七件断言 28 ⇒ 29（24 处：断言值 + 测试名/注释/消息链同拍——链加「10-09 控制台测试 key 修复批件入链」）；复跑八件（七门禁件 + 本批批内件）= **tests 62 · pass 62 · fail 0 · exit 0**。

**全库 doc-check**：`node scripts/doc-check.mjs`（仓根）⇒ **EXIT 0** ∥ OK(锚)：0 条悬空 ∥ OK(行宽)：源域无 >300 字符单行。

**设计档回填（父侧直笔 · 机械计数 · 可 revert）**：`WEBUI.md` §5 modals 行 ≈375 ⇒ **实读 376** + 小计 ≈3704 ⇒ ≈3705；`design/PROJECT.md` §6 预算行/随动表行「拟新增」⇒ 已落盘（批内件实读 201 行 ∥ 清单 28 ⇒ 29）∥ §6 随正件行与 §9 R44③「父侧落地」⇒「已落」；两档变更记录各 +1 行。

**部署收尾（父侧真机 · ECS）**：① 提交 `0473058a` 双远端推送（gitee ∥ github）→ 机上 `git pull`（HEAD 0473058）→ 镜像重建（新 ID `fef06380bc2d`——`thincoder-server/Dockerfile`）→ `docker compose up -d --force-recreate`；② 重收敛读数：`converge: version=0.1.0 source=installed` → `ready host 0.0.0.0 port 8787 routes:33 version 0.1.0` ∥ `Up (healthy)` ∥ `/healthz` = `{"status":"ok","version":"0.1.0","uptime":8,"db":"ok"}`；③ **修复在场实证**：served `GET /views-providers-modals.mjs` ⇒ **200** ∥ `draftKey` 命中 **×5**（容器内真身 = `/home/node/.npm-global/lib/node_modules/@thincoder/server/public/…`）。**用户复测 = 控制台详情弹窗填新 key ⇒「测试连接」（§1 原流程）。**

**套件行**：① 本批单元件 = `docs/batches/2026-10-09-server-console-testkey-fix.test.mjs`（201 行——随批留存，无处置）；② 集成面 = ECS 真机（上③——部署即集成验证）；仓集成套件零增改；本批不触 core/cli/desktop/vsc（not repo-suite verified 面 = 服务端门禁链已全绿——thincoder-cli 套件零涉未跑）。

**状态**：已收口（2026-10-09）。
