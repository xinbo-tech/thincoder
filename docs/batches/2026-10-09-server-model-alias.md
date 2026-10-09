# 2026-10-09 · server-model-alias
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 20:32 「服务模型需要加一个别名字段，如果配置了，对外模型名称用别名」+ 20:36 「别名当然需要唯一，不允许重名。其他可以按照你建议，嵌入面不相干」+ 20:37 「并批吧」；台账 #1153（核心）+ 并批五条（点火前合并扫描裁定）。
> 台账 = #1153（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 讨论与并批（主 agent）

**来源**：用户 2026-10-09 20:32「服务模型需要加一个别名字段，如果配置了，对外模型名称用别名」→ 父侧口径四问 → 20:36「别名当然需要唯一，不允许重名。其他可以按照你建议，嵌入面不相干」→ 20:37「并批吧」（点火 + 并批令）。台账 **#1153**；需求档 = `docs/server/requirements/PROJECT.md` §2:29 + AC-29（功能点二十九条）。

**口径（用户裁定 + 呈报默认）**：

- 配置形 = `models` 条目升级对象 `{ name, alias }`（纯字符串 = 无别名——旧形兼容；别名缺省/空 = 走现形 `provider/model`）。
- 对外 = 配了别名**一律用别名**（`/v1/models` 清单 ∥ 客户端请求 `model=`）；**配了只认别名**（旧 `provider/model` 名不再解析 ⇒ 404 明示）。
- **唯一性** = 别名**全服唯一**——别名撞别名 ∥ 别名撞带前缀名（含新增项）⇒ 拒（拒启 ∥ 保存 400——口径设计轮定）；别名非空、不含斜杠。
- 成员面 = 配额键/禁用键/记账对外标识统一别名形；内部仍存上游真名。嵌入面零涉。

**并批裁定表（同板全扫——点火前合并扫描）**：

| 台账 | 题 | 裁定 | 依据/原因 |
|---|---|---|---|
| #1008 | 成员配额/禁用键形：带空白键静默通过——收紧 | **并入** | 同面——本批触配额/禁用键形面（别名形入键） |
| #1010 | 模型元数据三处设计口径留白（设计档补记） | **并入** | 同文档面——本批触 `gateway/API.md` ∥ `webui/WEBUI.md`（其触发 = 设计档下一触碰批） |
| #1152 | 嵌入解耦批 🔵：缺段判据 accessor vs 设计字面（单源化） | **并入** | 同面——本批触 `routes.mjs` 派发面 |
| #967 | 种子导入边角 `env:` 缺位 nuance——README/运维注记 | **并入** | 同面——本批触 `providers.mjs`/README（一句注记） |
| #1151 | 嵌入解耦批 🔵：缺段态向量卡「用法」行语义 | **并入** | 归批（控制台设面——小改随收） |
| #955 | DGX 集群模型路由与负载均衡分工 | 不并 | 条件未满足（集群未就位） |
| #959 | AC-8 真机面残项（systemd `enable --now`） | 不并 | 运维/环境面（root 窗三命令——非代码批） |
| #979 | 弹窗悬留跨路由（`closeActiveModal` + `route()` 收口） | 不并 | 不同面（modal/route 生命周期——本批不触） |
| #989 | SQLite 量级翻案条件 | 不并 | 条件未满足（量级未至） |
| #1056 | `statCard` 两处并存去重 | 不并 | 结构轮候选（非同面） |
| #1057 | me 用量批 🔵 三条 | 不并 | 认账不排期（现行口径） |
| #1114 | bin 入口判据同族清理（13 处） | 不并 | 不同面（bin 判据面——本批不触） |
| #1137 | proxy 看门狗慢消费者腿 | 不并 | 不同面（代理面——另立测试腿） |
| #1146 | 探活 `textExcerpt` 有界读 | 不并 | 认账不排期（现行口径） |

**本批范围** = #1153（核心）+ 并入五条（#1008 ∥ #1010 ∥ #1152 ∥ #967 ∥ #1151）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（7 域档 + 板总览已落；十条收正已落（#10 无动作）；机检 EXIT 0）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批次任务与设计（eng-designer · 设计轮 · 2026-10-09）**

**批次**：server-model-alias（服务模型别名）——设计轮交付。**产品码零触**（本段 = 设计，实施 = eng-coder）。
**需求单源** = `docs/server/requirements/PROJECT.md`：§2:29 功能点 29（`:144-149`）+ AC-29（`:188`）——用户 2026-10-09 20:32/20:36 两条令。
**台账**：#1153（核心）+ 并入 #1008 ∥ #1010 ∥ #1152 ∥ #967 ∥ #1151。

### 覆盖需求条目（本批）

| # | 条目 | 需求指针 | 设计落点（单源） |
|---|---|---|---|
| 1 | 功能点 29 / AC-29（模型别名——核心 #1153） | `requirements/PROJECT.md:144-149` ∥ `:188` | 全域（见下） |
| 2 | #1008 成员键形校验（拒首尾空白；裸名 = 别名形合法） | 并入 | `metering/METERING.md` §3 ∥ `accounts/ACCOUNTS.md` §2.2/§5 |
| 3 | #1010 ①模型元数据撤销面口径 ②`displayName` 源规则 ③富项各占独立列 | 并入 | `gateway/API.md` §2.2 ∥ `webui/WEBUI.md` §2.4④ |
| 4 | #1152 `embedding` 字段判据改指运行时 accessor | 并入 | `gateway/API.md` §2.3 |
| 5 | #967 种子导入 nuance（一次性/无回滚/先修 env） | 并入 | `ops/OPS.md` §1 ∥ `thincoder-server/README.md` 一行 |
| 6 | #1151 向量卡「用法」行未配置态不渲染 | 并入 | `webui/WEBUI.md` §2.1 |

### 设计要点（决策 = `gateway/API.md` §6 KD-SV-59；KD-SV-4 随正）

- **存储**：`providers.models_json` 条目两形——字符串 = 无别名 ∥ 对象 `{name, alias}`（别名缺省/空 ⇒ 归一字符串形）；**零迁移**（结构版本保持 v10——`store/STORE.md` §2 v2 段/§3）。
- **校验/唯一性**：别名非空 ∥ 不含斜杠 ∥ 无首尾空白；**全服唯一**（别名撞别名 ⇒ 拒启/保存 400；别名 vs 带前缀名 = 形上不相交——唯一可能撞法 = 别名含斜杠 ⇒ 形校验拒）；三径同助手（载入 ∥ 启动构建/种子 ∥ 保存）。
- **派发**：对外标识（配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`）精确匹配；**配了只认别名**（旧前缀名 ⇒ 404 `model_not_found` 消息含别名）；`/v1/models` 清单同口径。
- **成员面随动**：配额键/禁用键/记账对外标识 = 别名形（内部 `provider`∥`model` 真名零改）；读面回映射单源 = `thincoder-server/src/gateway/providers.mjs` 别名索引（明细/导出/报表两维序/成员月表）；`model` 过滤先经别名反查。
- **编辑面**：服务模型页详情弹窗「G · 别名」组（+4 i18n 键）；保存 = 别名变更才随携 `models` 全量数组（其余条目保形——无别名仍字符串；清空 ⇒ 回落字符串形）。
- **改别名/清别名 ⇒ 当即生效**（无历史/迁移；旧形键 = 离表键恒保留、不生效）。

### 受影响文件与行数预算（设计估 ⇒ 实施后回填）

| 域 | 档 | 行数 |
|---|---|---|
| gateway | `thincoder-server/src/gateway/providers.mjs` | 183 ⇒ ≈208 |
| gateway | `thincoder-server/src/gateway/provider-admin.mjs` | 305 ⇒ ≈322 |
| gateway | `thincoder-server/src/gateway/forward.mjs` | 208 ⇒ ≈210 |
| metering | `thincoder-server/src/metering/usage.mjs` | 170 ⇒ ≈182 |
| metering | `thincoder-server/src/metering/aggregates.mjs` | 173 ⇒ ≈183 |
| metering | `thincoder-server/src/metering/report.mjs` | 226 ⇒ ≈252 |
| webui | `thincoder-server/public/views-models.mjs` | 209 ⇒ ≈240 |
| webui | `thincoder-server/public/views-providers-modals.mjs` | 385 ⇒ ≈395 |
| webui | `thincoder-server/public/i18n-zh-admin.mjs` ∥ `i18n-en-admin.mjs` | 137 ∥ 141 ⇒ ≈141 ∥ ≈145（+4 键/表） |
| ops | `thincoder-server/src/ops/config.mjs` | 311 ⇒ ≈316 |
| ops | `thincoder-server/README.md` | 256 ⇒ ≈259 |

accounts/store 域 **±0**（键形校验助手归 gateway 别名层——接点零行）；`thincoder-server/package.json` ±0（`prepublishOnly` 清单 33 ⇒ 34——本批件入链）；档目 30 ∥ 31 不变。产品面估 ≈+146（实读回填 = 实施后轮）。

### 验收判据（回指 AC-29 ①–⑤；判据全文 = 域档 §5/§6/§7）

| 需求 AC | 判据落点 |
|---|---|
| AC-29①（配置形 ∥ 控制台编辑面） | `gateway/API.md` §5 AC-29 行（两形/非法 400·拒启）∥ `webui/WEBUI.md` §6 AC-29① 行（G · 别名组 ∥ 列表外标）∥ `ops/OPS.md` §7 AC-29①③ 行（种子/配置面） |
| AC-29②（对外别名生效） | `gateway/API.md` §5 AC-29 行（清单 `id` = 别名 ∥ 请求命中且转发真名 ∥ 旧前缀名 404 明示） |
| AC-29③（唯一性） | `gateway/API.md` §5 ∥ `ops/OPS.md` §7（拒启/400 逐值；形上不相交） |
| AC-29④（成员面随动） | `metering/METERING.md` §4 AC-29④ 行 ∥ `accounts/ACCOUNTS.md` §5 AC-29④ 行 |
| AC-29⑤（嵌入面零涉） | 设计边界（`gateway/API.md` §8 ∥ `webui/WEBUI.md` §8——嵌入面零行）+ 批内件断言 |

**用例**：`gateway/API.md` §7 N35/B25/E26 ∥ `metering/METERING.md` §7 N34/B26/E23 ∥ `accounts/ACCOUNTS.md` §7 N35 ∥ 各域常规回归。**载体** = 批内件（新建 `docs/batches/2026-10-09-server-model-alias.test.mjs`——估 ≈350 行）+ 收口轮（浏览器实走：服务模型页别名组编辑 ∥ 成员面键显示）。

### 不在本批（边界——域档 §8）

别名历史/迁移 ∥ 别名批量编辑/导入导出 ∥ 候选面编辑别名（Provider 候选面零文本输入口径保持）∥ 别名级独立配额/限流配置面 ∥ 嵌入面别名 ∥ 别名与带前缀名交叉排歧（形上不相交——无需）。

### 上抛与披露（R48——`design/PROJECT.md` §9）

- **待裁（语义面——只报不改）**：需求档边界行 `requirements/PROJECT.md:209`「v1 不做**模型别名**/路由（已降级为后续可选）」与功能点 29 + AC-29 相抵（同一文档内一「做」一「不做」）——建议删「模型别名」（留路由）或改写为「模型别名 = 在」，并记变更记录（主 agent 笔）。
- **随正件（实施轮同拍）**：门禁件数断言 N ⇒ N+1（现值 33 ⇒ 34——七件注释同拍）+ `thincoder-server/package.json`（`prepublishOnly` 33 ⇒ 34）；旧断言件核预计零（既有断言无别名配置——外标仍回落 `provider/model`）。
- **披露（不阻塞）**：四并入项落修在册（#1008 键形 ∥ #1010 ①②③ ∥ #1152 accessor ∥ #967 README 一行 ∥ #1151 显隐）；CLI `usage reconcile` 读数 = 内部真名（运维面）；结构版本保持 v10（零迁移）。

**设计文字面**：`gateway/API.md`（§2/§2.1/§2.2/§2.3/§4/§5/§6/§7/§8）∥ `metering/METERING.md` ∥ `accounts/ACCOUNTS.md` ∥ `store/STORE.md` ∥ `webui/WEBUI.md` ∥ `ops/OPS.md` ∥ `design/PROJECT.md`（§4/§6/§7/§9）。
**机检**：`node scripts/doc-check.mjs` = EXIT 0（悬空 0；行宽 0——本批面）。

**修复轮（设计评审轮 1 收正——2026-10-09 · eng-designer）**

承接：本档 §3 轮次 1（VERDICT pass · 🔴0 ∥ 🟡4 ∥ 🔵6）——十条逐号落笔（#10 = 限制声明，无动作）。**零新语义**（全部 = 评审发现直接导出项）。

- **#1（判据指针收正）**：`webui/WEBUI.md:549` §6 AC-17 行「判据 = AC-29⑤ 行」⇒ **AC-29① 行**（与 `:567` AC-29① 判据行 ∥ `design/PROJECT.md:345` 映射同指——全档唯一 AC-29⑤ 残留，已清）。
- **#2（需求档回笔翻正）**：`design/PROJECT.md:411` R48① 由「只报不改」翻 **「已办」（2026-10-09）**——回指需求档 `docs/server/requirements/PROJECT.md` 边界行 `:209` 现文（「v1 不做**模型路由**（已降级为后续可选）；」——「模型别名」已删）∥ 变更记录 `:293` 在册 ∥ AC-29 编号零增（`:188`）。
- **#3（随正件登记）**：`design/PROJECT.md` §6 增**注⑮**（`:303-310`）：门禁件数断言件七件（**33 ⇒ 34**——注释同拍；断点以当刻盘面为准）∥ 逐件实读 ⇒ 明写 ±0（`-console-list-style` **240** ∥ `-server-auto-update` **498** ∥ `-console-layout` **495** ∥ `-me-usage-charts` **228** ∥ `-provider-model-metadata` **494** ∥ `-quota-per-model` **447** ∥ `-quota-v2-member-models` **741**）∥ 旧断言件核清单（三族——含**配置组数断言族**（必改：`-console-modals` `:369` 6 ⇒ 7 ∥ `:359`「四组」同拍 ∥ `-models-config-ui` `:303`「五组」⇒「六组」））∥ `package.json` `prepublishOnly` 33 ⇒ 34 ∥ 新批内件一件（估 ≈350 行）；本批块行数注指针改「随正件/行数注 = 注⑮」（`:212`）+ R48② 补「清单 = §6 注⑮」。
- **#4（停用径载荷形明写）**：`webui/WEBUI.md:226` ∥ `:549`——A·停用 = `PATCH models`（**全量数组**——其余条目按名匹配**保形**携带（别名不丢）；本条目离数组）——与 `:234`/`:256` 同句同源。
- **#5（预算链算术平——四链 + 同源随动）**：① `webui/WEBUI.md:536`：+≈48 ⇒ **+≈49** ∥ ≈4035 ⇒ **≈4036**（分项和 = 31 + 10 + 4 + 4）；② `gateway/API.md:136`：+≈42 ⇒ **+≈44**（补 `forward` ≈210——与 `:207` 同拍）∥ ≈1887 ⇒ **≈1889**；③ `ops/OPS.md:229`：≈306 ⇒ **实读 311**（embed 批实读——盘面复读 311；alias 链 ⇒ ≈316 平）；④ `ops/OPS.md:242`：链 ⇒ **±0（embed 实读收正——基线 256）⇒ ≈257**（≈259 陈值收正）∥ `:243` embed 增量 +≈7 ⇒ **+10**（`config.mjs` +10 ∥ `README.md` ±0）；随动：`design/PROJECT.md:207` 产品面 ≈+146 ⇒ **≈+147** ∥ `:210` webui ≈+48 ⇒ **≈+49**、域档小计 ≈4035 ⇒ **≈4036** ∥ `:211` README ⇒ **≈257**。基线实读（本轮回读）= `README.md` **256** ∥ `config.mjs` **311** ∥ `providers.mjs` **183** ∥ `provider-admin.mjs` **305** ∥ `forward.mjs` **208**。README 定 **≈257** 之据 = embed 批 ±0 实读在案（`design/PROJECT.md:204`）——链上 258/259 两步陈估随实读收正。
- **#6（alias 口径闭合）**：① `gateway/API.md:75`/`:152`/`:166`——归一集写实：`alias` 缺省 ∥ `null` ∥ `""` ⇒ 归一无别名；数字/布尔/对象/数组 ∥ 含 `/` ∥ 首尾空白 ⇒ 400；② `webui/WEBUI.md:229`/`:567`——占位 = **静态文案**（`admin.models.aliasPh`——键值 = 固定文本；非动态外标）。
- **#7（AC-29⑤ 判据指）**：`design/PROJECT.md:345` 补 ⑤ 嵌入面零涉（设计句 = `gateway/API.md` §6 KD-SV-59 ∥ §8 不做项「嵌入面别名」；回归面 = 嵌入面判据零动——批内件断言）。
- **#8（披露补条）**：`design/PROJECT.md:411` R48③ 补停用/重开换外标条（停用 = 离表 ∥ 重开 = 字符串形重建 ⇒ 旧别名 404 `model_not_found`；如需保留 = 另轮）。
- **#9（标记翻正）**：`design/PROJECT.md:29` webui 行 `views-system-config.mjs`「——本批」⇒「——2026-10-09 配置控制台批落盘」。
- **#10**：无动作（评审自述限制面）。
- **设计轮 §2 表随正两处**（append-only 段——在此登记）：本批行数表 `README.md`「256 ⇒ ≈259」收正为 **≈257**；「产品面估 ≈+146」收正为 **≈+147**（随 webui 分项和 = 49）。
- **变更记录**：四档逐档一行在册（WEBUI `:685` ∥ API `:278` ∥ OPS `:361` ∥ `design/PROJECT` `:474`——record face 原行零动）。批内件估算 ≠ 设计轮表值处无（表值 = 估 ≈350 行不变）。
- **机检**：`node scripts/doc-check.mjs`（仓根 `thincoder`）= **EXIT 0**；读数 = 悬空 **0** ∥ 行宽（源域）**无 >300 单行** ∥ 行数面差异 **0** 条。

**在查未动项（范围边界——呈报待裁，本轮未触，非静默）**：`webui/WEBUI.md` §6 各 AC 行「本批」标记族（约 6 处——档目链尾「本批后 **30 ∥ 31**」∥ `:547` 向量卡「配置面（本批——…）」等——均 = 前批记录面残留，沿既有先例 `配置面批后` 式命名将在后续触碰批收正）∥ `WEBUI.md:542`「（本批——`views-system-config.mjs`）」同类无时点标记。

**补记（指针核——2026-10-09 · 收正后复读）**：需求档 `docs/server/requirements/PROJECT.md` 行号在本轮期间仍在漂移（收正时刻值 `:209` ⇒ 当刻 `:216` ∥ `:293` ⇒ `:300` ∥ `:188` ⇒ `:194`——源 = 该档持续增长：含 21:06 用户令之新登记「功能点 30（代理设置独立入口 + 测试功能——台账 #1158 · 未点火）」等在册）。活面指针（`design/PROJECT.md:411` R48①）已按当刻盘面收正（`:216`/`:300`/`:194`——带「当刻盘面」限定）；本块 #2 行所列坐标为收正时刻值（记录面）。**报告项**：需求档后续增长（#1158 等）归属该档主笔（主 agent）——本批不触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | 判据指针悬空：`webui/WEBUI.md:549` 载「判据 = AC-29⑤ 行」，而本档唯一 AC-29 判据行 = `webui/WEBUI.md:567`（`AC-29①（功能点 29——配置形：控制台编辑面`）；需求侧 AC-29 ⑤ = `嵌入面零涉`（`docs/server/requirements/PROJECT.md:188`），与 G·别名组（配置形面）不对应——板级同指 = `design/PROJECT.md:337` 之 `webui/WEBUI.md` §6 AC-29① 行（G · 别名组 ∥ 列表外标）`。 | 指针收正为 `AC-29①`（或先落「AC-29⑤」行再引）——保持 §6 判据链机检可达。 |
| 2 | Doc state（跨档滞账） | 🟡 | `design/PROJECT.md:403` R48① 仍按未决登记需求档相抵（引文 `v1 不做**模型别名**/路由（已降级为后续可选）` ∥ `相抵`），但 `docs/server/requirements/PROJECT.md:209` 现文 = `- v1 不做**模型路由**（已降级为后续可选）；`，且 `docs/server/requirements/PROJECT.md:293` 变更记录已载 `§4 行 209 逐字替换`（已办）——R48① 与盘面不一致（陈旧报项）。 | R48① 翻转「已办」并回指需求档变更记录（沿 R23/R7 先例）——报面与实态同拍。 |
| 3 | Affected-file size annotations | 🟡 | 本批随正件未逐件登记：`design/PROJECT.md:212` 仅写 `随正件 = §9 R48②（实施后回填轮——实读收正）`；R48②（`:403`）只载 `门禁件数断言 N ⇒ N+1（现值 33 ⇒ 34——七件注释同拍）`——七件名未列、无逐件「实读 ⇒ ≤±N」注；「旧断言件核（预计零）」亦未点名被核对象（同日先例 = 注⑭逐件在册，`:299` `门禁件数断言件七件（32 ⇒ **33**——注释同拍；断点以当刻盘面为准）`；配置组数断言先例 = 注⑧ `（配置四组断言改点）`——本批 4⇒6 组）。 | 补注⑮：七件名 + 逐件「实读 ⇒ ≤±N」（断言文本就地收正 ⇒ 可明写行数 ±0）+ 被核旧断言件清单（含配置组数断言族）。 |
| 4 | Clarity | 🟡 | 两层条目形下 A·停用径 `models` 写载荷未定形：`webui/WEBUI.md:226` 只写 `PATCH `models` 减项`（AC-17 行 `:549` 同）；「全量数组 + 条目保形」只写在保存线 `:234`（`其余条目**保形**（无别名条目仍字符串）`）与 Provider 脚区 `:256`（`新增条目 = 字符串形`）——A 径若按扁平外标重建条目，将静默改写其余条目形（含别名丢失）。 | A 行明写载荷形（全量数组 ∥ 其余条目按上游名匹配原样携带）——与 `:234`/`:256` 同句同源。 |
| 5 | Numbers | 🔵 | 预算链算术不闭（抽查四处）：① `webui/WEBUI.md:536` `+≈48 = \`views-models\` +≈31 ∥ \`views-providers-modals\` +≈10 ∥ i18n 两表 +4/表`——分项和 = 49（总账 ≈4035 ⇒ 应 ≈4036）∥ ② `gateway/API.md:136` `+≈42 = providers ≈208 ∥ provider-admin ≈322——实读待回填` 未含 `forward.mjs` +≈2（同批在 `design/PROJECT.md:208`：`forward.mjs` 实读 **208** ⇒ ≈210（派发查表换用外标解析 +≈2）`；`:207` `gateway ≈+44`）∥ ③ `ops/OPS.md:229` 链 `⇒ ≈306（2026-10-09 embed 解耦批：\`embedding\` 可选分支 ∥ 告警一行 +≈5——实读待回填）` 后接 +≈5 ⇒ 应 ≈311，却写 ≈316（embed 批实读 = 311——`design/PROJECT.md:204` `ops \`config.mjs\` **311**`）∥ ④ `ops/OPS.md:242` `⇒ ≈259（2026-10-09 alias 批：#967 注一行 +≈1——实读待回填）` 与 `design/PROJECT.md:211` `\`README.md\` 实读 **256** ⇒ ≈259（#967 注一行 +≈1）`（Δ=3 与 +≈1 字面不合；链上中间估 ≈258）。 | 三链逐处算术平或明写基线（实读/估）——沿既往「算术平」口径；实施后回填轮一并收正。 |
| 6 | Clarity | 🔵 | 别名字段两处口径未闭合：① `alias: null` 读法——`gateway/API.md:75` `\`alias\` 缺省/空 ⇒ 归一无别名`（KD-SV-59① 同）vs `gateway/API.md:152` `\`alias\` 非字符串 ∥ 含 \`/\` ∥ 首尾空白 ⇒ 400`；② G 组占位——`webui/WEBUI.md:229` `占位 = 当前外标（\`admin.models.aliasPh\`）`（`:567` 同）vs 静态键文案 `webui/WEBUI.md:107` `\`admin.models.aliasPh\`（「留空即用 provider/model 前缀名」/ 英文同义）`。 | 逐点择一写实（null ⇒ 400 或归一；占位 = 静态文案或动态值 + 键形承载方式）。 |
| 7 | Acceptance criteria | 🔵 | AC-29⑤（`docs/server/requirements/PROJECT.md:188` `嵌入面零涉`）在设计侧无判据行：`design/PROJECT.md:337` `分五面判据` 后仅映射 ①–④ 与 `store/STORE.md` §2 v2 段；⑤ 只以决策/边界散文在册（如 `gateway/API.md:166` `嵌入面零涉；不做别名历史/迁移（改别名 = 当即生效）`）。 | §7 行或域档判据行明示 ⑤ 的判据指（设计档句 + 回归面）——与需求「机检 = 批内件 + 收口轮」同拍。 |
| 8 | Scope（披露面） | 🔵 | 停用/重开两径的别名静默丢失后果未披露：`webui/WEBUI.md:226` 停用 = `PATCH \`models\` 减项`；重开 = Provider 页勾选、条目按 `webui/WEBUI.md:256` `新增条目 = 字符串形` 重建 ⇒ 别名不再存在，旧别名请求 ⇒ 404（= `gateway/API.md:152` `旧 \`provider/model\` 名 ⇒ 404 \`model_not_found\` 消息含别名` 同判）；R48③ 披露栏（`:403`）只覆盖成员键离表。 | 披露栏补一条（停用/重开换外标——旧别名 ⇒ 404；如需保留 = 另轮）——沿 R39/R48③ 披露格式。 |
| 9 | Doc hygiene | 🔵 | 板级档目句残留无时点「本批」标记：`design/PROJECT.md:29` `\`views-*\` 十一档（+ \`views-system-config.mjs\`——本批）`——该档已落盘（`webui/WEBUI.md:516` `实读 105`），当前批 = alias 批且 `零新档——档目 30 ∥ 31 不变`（`design/PROJECT.md:212`）。 | 标记翻正（去「——本批」或改注落盘批次/日期）——沿「拟新增」翻正口径。 |
| 10 | Methodology（限制声明） | 🔵 | 评审限制（声明项）：本仓未声明项目标准档，「方法学合规」仅能按 Project Guide 与评审准则判；未见文档地图 ⇒「文档归属」判据降级——只能按三层结构（板 → 域 → 档）核落点。本设计集之内：机制全文集中 `gateway/API.md` §6 KD-SV-59，配置/存储/成员/界面各归其域，无新档、未见跨档重复或相抵表述（除 #2 所列滞账）。 | 无需动作（限制项披露）；如后续立文档地图 ⇒ 本项随正。 |

**计数**：🔴 0 ∥ 🟡 4 ∥ 🔵 6（共 10）；🔴 逐条复核 = 无。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent）**

**状态行**：✅ 已批准（2026-10-09 · 全链自动授权下代签）

- **授权依据**：用户 2026-10-09 21:10「刚才说的哪些都点火开工吧」（全链自动——代点火 ∥ 代签 ∥ 派发尽在其中；沿 2026-10-07「也自动跑完吧」先例）。
- **代签三条件核**（逐条）：
  ① **评审 pass**：设计评审轮 1 VERDICT = pass（🔴0 ∥ 🟡4 ∥ 🔵6）；引文面因路径前缀失配（机检 0/16）经父侧逐条亲核——四条已验属实、余条随修正轮复核。
  ② **修正轮落地并核过**：十条逐号落笔；父侧亲核抽验 —— #1 `webui/WEBUI.md:549` 判据指针 ⇒ **AC-29①** ✓ ∥ #2 `design/PROJECT.md:411` R48① ⇒ **已办** ✓ ∥ #5 `gateway/API.md:136` ⇒ **≈1889**（+≈44 含 `forward`）✓ ∥ `ops/OPS.md:242` ⇒ **≈257** ✓；`doc-check` EXIT 0（设计轮实跑）。
  ③ **token 已签发**（评审回执）。
- **批准**：本批设计集（七档）＝ 准予实施；派 eng-coder 落实施轮。
- **不做项（披露）**：`webui/WEBUI.md` §6「本批」标记族（约六处）＝ **不随本批**——超修正轮边界，已入池归批（随后续触碰批收正）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（批内件 21/21 pass；门禁链失败 6 条/5 文件全数归属旧断言面随正件；发散审计 1 轮（0 🔴）∥ 代码评审 1 轮 pass（0 🔴 ∥ 2 🟡 非阻塞 ∥ 4 🔵）；fix round 1 轮 → 终态 clean）



**交付摘要**（功能点 29 服务模型别名 + 并入 #1008 ∥ #1010 ∥ #1152 ∥ #967 ∥ #1151；机制全文 = `docs/server/design/gateway/API.md` §6 KD-SV-59；产品面 16 档 + 批内件 1 件）

- `src/gateway/providers.mjs`（183 ⇒ **253**）：`modelEntriesOf` 条目归一取读 ∥ `createAliasIndex` 别名索引（内部真名 ⇄ 对外标识双图——单源）∥ `providerAliasIndex(db)`（DB 源构建；读面每读重建 ⇒ 改别名当即随动）∥ `isExternalModelRef`（键形判单源——#1008）∥ `dispatch` 对外标识精确匹配（配了别名只认别名；旧前缀名 ⇒ 404 `model_not_found` 消息含别名）∥ `/v1/models` id = 外标；`engineModel()` 签名零动。
- `src/ops/config.mjs`（311 ⇒ **360**）：`normalizeModelEntry`（两形归一：alias 缺省/`null`/`""` ⇒ 归一无别名）+ `validateProviderEntry` 条目形判（数字/布尔/对象/数组/含 `/`/首尾空白 ⇒ 拒）+ `assertAliasesUnique`（全服唯一单源；单条内 ∥ 批量 ∥ 保存径对既有集三径同助手）+ 载入/构建/保存三接线。
- `src/gateway/provider-admin.mjs`（305 ⇒ **312**）：保存径 `assertAliasesUnique`（撞 ⇒ 400，库与运行时零变）+ `filterModelMeta` 按名求交（两形）。
- `src/metering/usage.mjs`（170 ⇒ **175**）∥ `report.mjs`（226 ⇒ **248**）∥ `aggregates.mjs`（173 ⇒ **176**）：读面回映射单源（明细/导出/summary.byModel/trendByModel/成员月表 = 外标）+ `model` 过滤反查（优先级：embeddings 在场 ⇒ `provider=''` 零切分 ⇒ 别名反查真名对 ⇒ 含斜杠逐值对 ⇒ 裸名 `provider=''`）；`MODEL_REF_SQL` 删净。
- `src/accounts/members.mjs`（241 ⇒ **239**）：`assertModelRefKey` 改委托 `isExternalModelRef`（键形单源——#1008：裸名合法 ∥ 首尾空白/空段 ⇒ 400 库零变）；值形两条 400 报文补「对外标识（别名（裸名） ∥ provider/model 前缀形）」双形。
- `src/gateway/system.mjs`（57 ⇒ **61**）+ `bin/thincoder-server.mjs`（180 ⇒ **180**）：#1152 —— `/api/system.embedding.model` 判据单源 = `providerRuntime.get().engineModel()`（缺段 ⇒ `null`，与派发面同判；一行接线）。
- `public/views-models.mjs`（209 ⇒ **267**）：`deriveModels` id = 外标（别名单点）∥ `modelsWithout`/`modelsWithAlias` 保形（两形 + 别名；清空 ⇒ 回落字符串形）∥ `aliasDraftInvalid` 形判 ∥ 详情弹窗**六组 A/C/F/G/D/E**（G = 别名输入 + 提示）∥ 保存「仅别名变更」随携 `models` 全量数组。
- `public/views-providers-modals.mjs`（385 ⇒ **387**）：候选勾选保形（`models` 提交存量条目原样携带——别名不丢）∥ 退役注按名匹配。
- `public/views-system.mjs`（237 ⇒ **237**）：#1151 —— 向量卡「用法」行缺段 ⇒ **零节点**（字面「不渲染」）；在场 ⇒ `p.hint`（模型名入句）。
- i18n `i18n-zh-admin.mjs`（137 ⇒ **141**）∥ `i18n-en-admin.mjs`（141 ⇒ **145**）：+4 键两表（`admin.models.aliasLabel` ∥ `aliasPh` ∥ `aliasHint` ∥ `ruleAlias`——文案逐字沿 `webui/WEBUI.md` §2.2 键族登记）。
- `thincoder-server/README.md`（256 ⇒ **258**）：#967 —— 种子条目两形/别名一行 nuance。
- 批内件 `docs/batches/2026-10-09-server-model-alias.test.mjs`（实读 **694** 行；21 例：A 配置·注册表 3 ∥ B 保存径·热生效 4 ∥ C 成员面 2 ∥ D 读面回映射 4 ∥ E 界面面 5 ∥ F 嵌入零涉·#1152·import 扫描 3）。

**验证读数**

- 批内件：`node --test docs/batches/2026-10-09-server-model-alias.test.mjs` ⇒ **21/21 pass**（单件直跑）。
- 门禁链（33 件既有 + 本批件 = 34 件）：失败 **6 条 / 5 文件**，全数 = 旧断言面随正件（父侧落，本轮零写）：`-console-modals:346`（字段枚数 6 ⇒ 7；同件 `:338` 注释「配置四组」）∥ `-models-config-ui:315`/`:316`（输入值/型数组 6 ⇒ 7；`:303` 用例名「配置五组」）∥ `-console-list-style:171`（`"hint error"` 计数 24 ⇒ 25）∥ `-quota-v2-member-models:228`（`{m:true}` 400 面）+ `:409`（裸名不再抛）∥ `-server-public-structure:42`/`:43`（i18n 指纹）+ `:52`/`:53`（键数 369/374 ⇒ **373/378**）。
- 随正件读数（父侧同拍用）：zh 指纹 = `7d71992f82e94039d2503f38e1153c91c4c108c9d20a4b649da2cfeaef42d5c5`（373 键）∥ en 指纹 = `592bc570f95efa097c3cd1a3624c7a7435aeb9d67fdc16bf202efc8d2cd2c2f8`（378 键）；门禁件数断言七件 33 ⇒ 34 ∥ `package.json` `prepublishOnly` 33 ⇒ 34（**父侧落**——本轮按简报零触；未同拍则发布链红）。
- 静态：`node scripts/doc-check.mjs` ⇒ **EXIT 0**（锚 0 悬空 ∥ 行宽零 FAIL ∥ 行数面差异 0——本批落盘当刻读数；同刻复跑读数见「范围外发现」①）。
- 行数对账（设计估 ⇒ 实读）：`providers.mjs` ≈208 ⇒ **253**（+45）∥ `provider-admin.mjs` ≈322 ⇒ **312**（−10）∥ `forward.mjs` ≈210 ⇒ **208** ∥ `config.mjs` ≈316 ⇒ **360**（+44）∥ `usage.mjs` ≈182 ⇒ **175** ∥ `aggregates.mjs` ≈183 ⇒ **176** ∥ `report.mjs` ≈252 ⇒ **248** ∥ `members.mjs`（±0 声明）⇒ **239**（−2——助手改委托）∥ `views-models.mjs` ≈240 ⇒ **267**（+27）∥ `views-providers-modals.mjs` ≈395 ⇒ **387** ∥ `i18n-{zh,en}-admin` ≈141/≈145 ⇒ **141/145** ∥ `README.md` ≈257 ⇒ **258** ∥ `bin` ±0 ⇒ **180** ∥ 批内件 ≈350 ⇒ **694**。设计估集合计 ≈+147 vs 实读 ≈+226（差 ≈+79；超估三档 = providers ∥ config ∥ views-models——归一/校验/索引助手与注释实体量）⇒ 回填轮收正。
- 未跑：全仓套件（归父侧收口轮）∥ `prepublishOnly`（随正件未落 ⇒ 必红）。

**决策透明表**

① 列表外改动三档（各有设计条款背书，随实现披露）：`src/gateway/system.mjs` ∥ `bin/thincoder-server.mjs`（#1152——`gateway/API.md` §2.4 随正条）∥ `public/views-system.mjs`（#1151——`webui/WEBUI.md` §2.1/§6）。
② `README.md` 改 +2 行（设计预算 +≈1）：一句含「两形/别名/启动校验」三事——超预算 1 行，父侧裁。
③ `-quota-v2-member-models` 两条失败 = 设计注⑮「外标键族 预计零」被实读推翻（#1008 使裸名合法 ⇒ 旧 400 断言相抵）——设计自注「断点以实施实读为界」，故按实读报父侧随正。
④ `-server-public-structure` 指纹件不属设计注⑮任何族（i18n +4 键 ⇒ 指纹与键数必动）——实测补登随正。
⑤ 批内件实读 694 行（设计估 ≈350；> 500 建议线 ∥ < 800 硬线）：**单件不拆**（设计「批内件一件」+ 仓先例 741 行门禁件）；评审列 🟡 advisory（非阻塞）。
⑥ 「用法」行缺段取**零节点**（字面「不渲染」）：节点由槽 `replaceChildren` 条件挂载（零新样式类；档行数 ±0）。
⑦ `models` 对象条目经服务端往返只保规范两字段（`{name, alias}`——非规范字段静默丢弃）：前端注释与批内件措辞已收正为「两形与别名不动」（评审 🔵，措辞级；元数据列已独立 ⇒ 零功能影响）。
⑧ 成员面键形判据 = 「外标」而非「别名」（裸名合法——#1008 字面）；配额/禁用键值形非法（`false`/非数）判据沿既有单源。

**审计与代码评审轮次与终态**

- 发散审计（explore · 1 轮）：判定 **DEVIATIONS** —— PARTIAL 4（随正件未落=父侧面 ∥ `system.mjs` 行数漏账 ∥ doc-check 读数未列 ∥ 行数对账需回填——后三条本轮已补）∥ OUT-OF-LIST 2（`members.mjs` −2 行 ∥ system/bin/views-system，判「已报告可接受」）∥ SILENT-SIMPLIFICATION 0 ∥ DOC-DRIFT 0；**无 🔴**。语义面逐条核（两形 ∥ 唯一性三径 ∥ 派发 ∥ 读面回映射与过滤 ∥ 成员面 ∥ 控制台六组 ∥ 五并入项）**零分歧**。
- 代码评审（advisor type=code · 1 轮）：`VERDICT: pass` —— **0 🔴** ∥ 2 🟡（批内件空断言 `:260`——恒真断言 ∥ 批内件 694 行越 500 建议线）∥ 4 🔵（`members.mjs` 值形报文只写前缀形 ∥ 「用法」行 hidden vs 不渲染字面 ∥ 「保形」措辞 ∥ 记录面回填）。
- fix round：**1 轮**（6 处：批内件空断言改真断 `.miss.status === 404` ∥ 「用法」行改零节点（合 §6 字面）∥ `members.mjs` 两条值形报文补双形 ∥ `views-models.mjs` 措辞收正 ∥ 批内件同拍措辞 ∥ E5 断言随新实现）——产品语义零改；复跑批内件 **21/21 pass**，复跑门禁链失败集不变（6 条/5 文件，同前）。
- 终态：**clean**。
- 范围外发现（父侧裁）：① `docs/core/design/PROMPT-SYSTEM.md:888` 380 字符单行（mtime 2026-10-09 21:40:12——**他方并发写**，非本批）⇒ doc-check 复跑 EXIT 1（本批落盘当刻 = EXIT 0）；② 别名机制落盘后旧口径注释/报文未随拍（`src/metering/quota.mjs:10` ∥ `src/gateway/routes.mjs:4`/`:66` ∥ `src/store/db.mjs:65` ∥ `src/metering/routes.mjs:112` ∥ `src/accounts/routes-admin.mjs:104`）——六处均在本批文件表外，未触，待父侧裁路线。

## §6 验证与收口（父代理）

**实施验证（父侧实跑 · 2026-10-09）**：
- **整链门禁复跑（34 件）**：`node --test <prepublishOnly 清单 34 件>` ⇒ **EXIT 0，全绿**（批内件 21 例在内；本批件已入链——`thincoder-server/package.json` `prepublishOnly` 33 ⇒ 34）。
- 三 `node --check` 靶（`bin/thincoder-server.mjs` ∥ `src/ops/update.mjs` ∥ `deploy/converge.mjs`）= OK。
- （npm 壳读数为环境面问题，非本批写面；链读数以直跑为准。）

**随正件（父侧直接执行 · 可 revert——承 §5【父侧待落】清单）**：
- 断言件 5：`-console-modals.test.mjs:369`（字段六 ⇒ 七）∥ `-models-config-ui.test.mjs:303/:324/:326/:327`（组数五 ⇒ 六 ∥ 枚数 6 ⇒ 7 ∥ 两数组 6 ⇒ 7）∥ `-console-list-style.test.mjs:168/:171`（计数 24 ⇒ 25）∥ `-quota-v2-member-models.test.mjs:226/:228/:397/:399/:408-415`（键形四例改空白例——裸名合法 = #1008）∥ `-server-public-structure.test.mjs`（指纹两枚随正 + 键数 369/374 ⇒ **373/378**）。
- 门禁件数断言七件 33 ⇒ 34（`-console-list-style` ∥ `-server-auto-update` ∥ `-console-layout` ∥ `-me-usage-charts` ∥ `-provider-model-metadata` ∥ `-quota-per-model` ∥ `-quota-v2-member-models`）+ `package.json` `prepublishOnly`。

**行数对账（父侧裁）**：设计估 ≈+147 vs 实读 ≈+226（超估三档：`providers.mjs` 253 ∥ `config.mjs` 360 ∥ `views-models.mjs` 267——均 < 500；批内件 694 < 800 硬线）⇒ **接受**；README +2（一句含三事）⇒ **接受**。
**披露处置**：列表外三档（`system.mjs` +4 ∥ `bin/thincoder-server.mjs` ±0 ∥ `views-system.mjs` ±0——各有设计随正条款）⇒ 接受；六处旧口径注释（`quota.mjs:10` ∥ `routes.mjs:4/:66` ∥ `db.mjs:65` ∥ `metering/routes.mjs:112` ∥ `routes-admin.mjs:104`）⇒ 台账归批（#1161）；`METERING.md` §3 澄清句 ⇒ 台账归批（#1162）；AC-29③ 措辞差 ⇒ 设计解析在册，需求面零改（知悉）。
**暂缓批复核**：无（本批零暂缓项）。
**结算**：台账 #1153 ⇒ 已核销（落地 = 16 产品档 + 批内件 + 随正件 13 档触；证据 = §5/§6 + 整链 EXIT 0 读数）。
**六段角色表**：§1 主 agent ∥ §2 设计者 ∥ §3 评审 ∥ §4 主 agent（代签）∥ §5 eng-coder ∥ §6 主 agent —— 齐。
