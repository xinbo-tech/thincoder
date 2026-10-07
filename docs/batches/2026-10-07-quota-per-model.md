# 2026-10-07 · quota-per-model
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 09:28「配额总体我是希望分模型配置的…」（全句在需求档 §2:21）+ 09:30「配额应该都是按自然月管理的」+ 09:31「嵌入模型不受配额管理限制」+ 09:31「可以，技术上如何保证性能你要考虑好」（= 点火 + 性能硬要求）。。
> 台账 = #992（server · 归批）。前情 = docs/batches/2026-10-07-console-tfoot.md §6（已收口 2026-10-07——#990/#991 自该轮体量实测立行）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-07 09:28–09:3x）**

**来源（用户原话 = 唯一标尺）**：
- 09:28「配额总体我是希望分模型配置的。每种服务模型我希望都能够分别设置配额，每个模型应该有个每人每月的默认用量设置，不设置就是不限，这个配置可以在服务模型页面设置，每个用户也应该有分模型的每月用量设置，这个应该在成员管理用户弹窗里设置，不设置就是用平台配置，设置了可以覆盖平台设置。」（全句在需求档 §2:21）
- 09:30「配额应该都是按自然月管理的。」∥ 09:31「嵌入模型不受配额管理限制。」∥ 09:31「可以，技术上如何保证性能你要考虑好。」（= 点火 + 性能硬要求）

**规格（已入需求档 §2:21 + AC-21——此处只钉父侧口径）**：
- ① 平台层（模型级「每人每月默认用量」——服务模型页；不设 = 不限）∥ ② 成员层（分模型覆盖——成员弹窗；不设 = 平台）∥ ③ 生效序三级（成员×模型 ⇒ 平台 ⇒ 不限）∥ ④ 检查 = 网关请求路径**仅 chat**；窗口 = 自然月（服务器本地时区——`monthStart` 口径）∥ ⑤ 嵌入不受配额管理（计量照记）。
- 父侧默认（不对即纠）：单位 = token（`total_tokens`；金额不涉）∥ 旧 `members.quota_tokens` 退役（被①+②取代）。

**性能硬要求（用户 09:31 点名——设计必答项）**：每请求检查须给**目标读数 + 实测法**。判据锚 = #991 实测（现况 21.4ms/请求 @500k 行 ∥ 覆盖索引 21.4→0.14ms 150× 在案）；设计含：**未配置 ⇒ 零查询短路** ∥ 配置读取代价 ∥ 检查查询形 + 覆盖索引 + EXPLAIN 计划预期。

**关联**：#991（配额检查性能——随本批处置）∥ #992（本行）∥ #990（报表/统计面——**未裁，本批零触**）。

**§1 补记（父侧实读 · 2026-10-07 09:3x——短路口动因坐实）**：现 `quota.mjs:12-17` = **SUM 无条件先跑**（`:15` `monthlyTokensForMember` → `:16` 才判 `quota === null`）⇒「不限」成员也每请求白付一次全量 SUM（500k 行 ≈ 21ms）。**短路口 = 两步对调**（先配置判定「三级全无 ⇒ 不限」⇒ 零查询；有门槛才进 SUM）。已同步设计棒 #125（任务书补充）。

**§1 补记二（用户直令 · 2026-10-07 09:34——检查机制定形）**：用户原话「**你不能每次算sum，应该是在固定的字段里计数好的，每次sum哪来得及啊！这还怎么扛压力？**」⇒ **检查主径 = 维护计数（非每次 SUM）**：① 计数载体 = 按「成员 × 模型 × 自然月」键的计数字段；② 随记账**同事务**原子累加（单写点）；③ 检查 = **点查计数（O(1)）**——不进请求路径做 SUM；④ 月翻滚 = 新键自然归零；⑤ 期初 = 迁移自 usage 一次性聚合回填；⑥ 对账 = 计数 vs usage 重算校验（防漂移兜底）。原「覆盖索引」条降为对账/兜底候选（其实测读数 150× 留作参照）。已同步设计棒 #125（任务书再补充）。

**§1 补记三（用户 09:39/09:40——统计性能并入本批）**：用户追问「统计你准备怎么做？这一块的性能问题很大的，你有解决方案了吗？」→ 父侧方案（**预聚合日表**：写入同事务累加 ∥ 读取不扫明细 ∥ `usage` 明细真源保留 ∥ 重算对账兜底）→ 用户 **09:40「可以」= 批准并入本批**（同一 v5 迁移：配额计数 + 模型标识两字段 + 日聚合，一次做完）。已作为第 5 条直令同步设计棒 #125（含读数实测复核要求 ∥ API 契约不变 ∥ 备选 A = 仅覆盖索引降为兜底）。#990 同拍转正（task_book = 本档）。

**§1 补记四（用户 09:54「自动跑完」= 全链授权）**：射程 = 本批全链自动——设计评审**代点火** ∥ §4 代签 ∥ 修正轮/实施轮派发 ∥ 收口核销 ∥ 提交推送（不逐次请点）。**父侧自缚三条（本仓惯例）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停（只摆那一条）；③ 破坏性/不可逆 ⇒ 先停。另：上抛六条父侧已裁定（①–④⑥ 同意落 ∥ ⑤ 旧 `quota_tokens` 删列按退役落——「旧值不保留」已披露，未获异议即随批准生效）。

**§1 补记五（评审 #126 裁定与修正轮 · 2026-10-07 10:0x）**：设计评审 #126 = **changes-required**（🔴1 · 🟡4 · 🔵5——发现表全文 = §3 轮次 1；token 未签发）。**父侧逐条裁定：1–10 全部接受**（无一驳回）：①【🔴】`PROJECT.md` §2.2 [7] 记账描述收正为三写形（与 §2.1/METERING §1 同拍）；②【🟡】PROJECT 三处按声明收正（§4 标题 1–41 ∥ §6 链补 metering/store 读数 ∥ §7 补 AC-21/AC-22 行）；③【🟡】受影响文件表补测试面标注（8 随正件「实读 ⇒ ≤±N」+ 基准件与 v5 读点 ∥ `-chat` 498 近线预案 ∥ 新批内件估算+拆档预案 ∥ `overview.mjs` 带读数）；④【🟡】派生键时基准钉为 `usage.ts`（同回填表达式）+ 跨零点用例；⑤【🟡】`model` 过滤补 `endpoint=embeddings` 兜底优先级；⑥–⑩【🔵】逐条文字/复算/销项收正。**修正轮已派发**（eng-designer · round=fix——落毕复评（round 2）后才入 §4 代签）。

**§1 补记六（跨批写闸发现与处置 · 2026-10-07 10:2x）**：B 舱撞「cross-batch batch-record write」机械拒——**随正 8 件均属旧批档 companion 文件，子代理不可写**（机制 = 他批档由父侧处理）。处置裁定（B 舱提三选项，父侧取 ②）：**舱写 `.thincoder/tmp/<舱>-随正/`（原文件名 + 映射单 + 静态自检）⇒ 父侧文件级搬入 ⇒ 父侧跑件（收口轮并核）**。A 舱已预置同步。影响 = §2 受影响文件表「随正 8 件」的实施面：舱供稿 ∥ 父侧落地——设计面零变。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮 2026-10-07——评审 #126 十点逐条落位（initial 轮四合一：#990/#991/#992/§2:21/§2:22））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-07 · initial 轮）**

**本批条目（覆盖——需求档 §2:21/§2:22 为单源，本段回指）**：
1. 功能点 21 + AC-21（配额分模型：#992；平台层「每人每月默认」∥ 成员层分模型覆盖 ∥ 三级回退；检查点 = 网关仅 chat；自然月；嵌入不受配额）。用户 09:28/09:30/09:31 原话。
2. 功能点 22 + AC-22（模型标识两字段存：记账行 ∥ 计数行 ∥ 模型维度新表；统计按 provider ∥ 模型 ∥ 两者聚合；迁移拆列回填；对外契约不变）。用户 09:38 直令。
3. #991 转正（配额检查性能——09:34 用户直令：「不得每次 SUM——用量维护在固定计数字段」）。
4. #990 并入（报表面性能——09:39 追问 + 09:40「可以」批准同窗：预聚合日表）。父侧条件挂账由点令解除。
本批不覆盖：零延展（无暂缓项）。嵌入面照记不检查、限流（KD-SV-35）零触、金额/计费零触。

**设计档落点（机制全文单源）**：
- `store/STORE.md` §2 v5 段（全 DDL 逐字）+ §3（迁移链 v5 + 判据/耗时）+ §4 + §5 KD-SV-40。
- `metering/METERING.md` §1（记账三写）+ **§2（分模型三级·计数准入——性能目标与实测法全文）** + §3（端点）+ §4（AC-21/AC-22 判据行）+ §6 KD-SV-38/39 + §7 用例。
- `gateway/API.md` §2/§2.1（检查点 = 派发命中后/转发前；429 形）+ §2.2（settings `quotaTokens`）+ §5 AC-21 行。
- `accounts/ACCOUNTS.md` §3（memberView `modelQuotas`）+ §4/§5 随正。
- `webui/WEBUI.md` §2.4②（成员弹窗分模型覆盖面）/③（F 组）+ §2.2 键族 + §6 AC-21 行 + §7 KD-SV-41。
- `ops/OPS.md` §1（保留窗三表同窗）+ §3（CLI）。
- 板总览 `PROJECT.md` §2（控制台链）+ §4 索引（KD-SV-38–41）。

**机制设计（链）**：
① 数据面（v5 一次迁移）：`usage` 拆 `provider`/`model` 两字段（拆列判据 = `endpoint='chat'` + 首斜杠；嵌入行 `provider=''`）∥ `usage_daily`（日×成员×key×provider×model×endpoint 预聚合）∥ `quota_counters`（成员×provider×模型×自然月计数）∥ `members.model_quotas_json` ∥ 删 `members.quota_tokens`（退役）∥ 两表期初回填。
② 写面：`recordUsage` 单写点 = **同事务三写**（usage INSERT + 两 upsert；失败整滚——零漂移）。
③ 检查面（仅 chat）：三级解析（覆盖 ⇒ settings `quotaTokens` ⇒ 不限）→ 全无 ⇒ **零 SQL 短路**（收正现状缺陷：旧实现「不限」亦白付 SUM——`quota.mjs:15` 排序病）→ 命中 ⇒ 计数表点查 O(1)；超限 ⇒ 429 `quota_exceeded`（message 含模型外标）。
④ 读面：汇表面（summary/totals/key 窗/成员月累计）换读 `usage_daily`（本地日粒度窗——含端日；API 形零变）；明细/导出/审计 = `usage` 真源毫秒精度零改。
⑤ 对账：`usage reconcile [--month YYYY-MM] [--fix]`（两派生表 vs usage 重算）。
⑥ 配置面：服务模型页 F 组（`quotaTokens`——PATCH settings 单键全对象）∥ 成员弹窗分模型覆盖表（`POST /api/members/:id/model-quotas` 键级合并——不在清单键恒保留）。

**性能目标与实测读数（同构探针 @500k 行；`.thincoder/tmp` 零落仓，本轮两探针已清理）**：
- 配额检查点查 **p50 0.004ms ∥ p95 0.005ms**（目标 p95 ≤0.05ms——10× 余量）；短路路径零 SQL（JSON 解析 0.08–0.28µs/请求）；对照旧 SUM 路径 21.4ms（#991 立案）∥ 本轮复测 3.3–7.0ms（分布/机差——两读并陈）。
- 报表面 30 天窗四查合计 **p50 ≈11ms**（totals 0.81 ∥ trend 1.30 ∥ byModel 6.21 ∥ byMember 2.71）——对照明细口径 ≈2.7s（本轮）∥ #990 立案 4.8s；成员月累计 0.49ms（原 1214ms）∥ key 窗 2.7ms（原 1220ms）。
- 写路径：三写同事务 **p50 0.070ms ∥ p95 0.180ms**（单 INSERT 对照 p50 0.038ms——增负 ≈+0.03ms/请求）。
- 迁移回填（一次性）：日表 ≈1.2s ∥ 计数 ≈3.4s；对账重算 ≈1.0s。EXPLAIN 预期：计数点查 = 唯一键 autoindex；日窗 = `day` 前缀扫描。
- 目标读数 + 实测法（预热后 ≥1000 次采样报 p50/p95）全文 = METERING §2.4（可复跑）。覆盖索引 = 对账面候选（不采——读数留参照；判据在册）。

**受影响文件与测试面**（行数 = wc -l 实读 2026-10-07；逐档增量 = 各域档 §4/§5/§6）：
- src：`store/db.mjs` 150 ⇒ ≈205 ∥ `metering/aggregates.mjs`（新）≈150 ∥ `metering/report.mjs`（新）≈105 ∥ `metering/usage.mjs` 278 ⇒ ≈255 ∥ `quota.mjs` 27 ⇒ ≈55 ∥ `metering/routes.mjs` 111 ⇒ ≈125 ∥ `gateway/routes.mjs` 101 ⇒ ≈115 ∥ `forward.mjs` 196 ⇒ ≈204 ∥ `accounts/keys.mjs` 98 ⇒ ≈105 ∥ `members.mjs` 166 ⇒ ≈190 ∥ `accounts/routes.mjs` 112 ⇒ ≈118 ∥ `ops/config.mjs` 252 ⇒ ≈262 ∥ `ops/cli.mjs` 189 ⇒ ≈215 ∥ `gateway/overview.mjs`/`routes-admin.mjs`/`session.mjs`/`providers.mjs`/`provider-admin.mjs` ±0。
- public：`views-admin.mjs` 185 ⇒ ≈255 ∥ `views-models.mjs` 199 ⇒ ≈218 ∥ `views-me.mjs` 122 ⇒ ≈126 ∥ `app.mjs` 317 ⇒ ≈320 ∥ `i18n-zh.mjs` 334 ⇒ ≈344 ∥ `i18n-en.mjs` 330 ⇒ ≈340 ∥ `style.css` 223 ⇒ ≈228。
- 批内件（拟新增）：`docs/batches/2026-10-07-quota-per-model.test.mjs`；`package.json` 门禁清单 18 ⇒ 19 件。
- 随正件（旧批内件——触旧列/旧形实读为界）：`-server-gateway-metering` ∥ `-chat` ∥ `-accounts` ∥ `-webui-deploy` ∥ `-console-modals` ∥ `-console-layout` ∥ `-models-config` ∥ `-models-config-ui` ∥ 余实施轮全扫。

**验收对照**：AC-21/AC-22 判据行已落设计档（METERING §4 + WEBUI §6 + API §5）；既有 AC 随动 = AC-15②（数据源 = 日表 + 日对齐相等）/AC-15⑥/AC-3/AC-4（消息含模型）——判据全文在各域 §4/§5/§6。形式 = 批内件 + 收口轮（浏览器实走两语言）。
**关键决策**：KD-SV-38（配额 = 三级 + 计数字段点查 + 零 SQL 短路；CHECK 点位移；覆盖索引降对账面候选）∥ KD-SV-39（汇表面 = 预聚合日表；覆盖索引兜底判据 = 读侧增长速度）∥ KD-SV-40（v5 迁移口径：两字段/`''` 嵌入维/DROP COLUMN/`endpoint` 拆列判据/回填）∥ KD-SV-41（配置面两落点）。

**上抛项（供父侧/用户裁——不阻塞设计评审）**：
1. §2:22②「三种聚合」落法：数据面两列直操作 + `summary.byModel`（provider×模型两列）已落；**provider 单维/模型单维未增接口字段**（理由 = 用户词「将来」+ 未增端点零性能回声）——如需现在暴露，一句话即加。
2. 嵌入行 `provider = ''`（无前缀命名空间；回拼 = `model` 单段）：09:37/09:38 未明示该格取值；备选 = 展示名「embedding」（有损回拼）——已按 `''` 落。
3. 检查点位移：配额准入从「体读前」移到「派发命中后/转发前」（404 先于 429-quota——旧反向）；嵌入面旧总额检查移除（与 09:31 裁对齐）。按 AC-21「行为细节随设计裁」落。
4. 汇表面窗沿 = 本地日取整（含端日——API 形不变、语义微调；UI 缺省窗本就日对齐）。
5. 旧 `members.quota_tokens` = 删列退役（需求 §2:21 注「待用户一句核」——设计按退役落，§4 批准即含）。
6. `usage.mjs` 触 300 软线 ⇒ 拆 `aggregates.mjs`/`report.mjs`（本批顺带收正——沿拆分先例）。

**§2 补记（fix 轮 · 评审 #126 十点——2026-10-07 · eng-designer）**

**上抛六条销项**（评审 #126 #8；裁定全文 = §1 补记四）：①–④⑥ 同意落 ∥ ⑤ 旧 `members.quota_tokens` 删列按退役落（「旧值不保留」已披露）——六条不再待裁。

**测试面标注**（评审 #126 #3；实读 = 2026-10-07 本次复核；口径 = 内容行 ∥ 文末换行不计）：

- 随正 8 件「实读 ⇒ ≤±N」：`-server-gateway-metering` **188** ⇒ ≤±45（配额两条用例整段换形：三级 ∥ `model-quotas` 端点 ∥ 计数点查——旧「置额度 ∥ `checkQuota` ∥ `monthlyTokensForMember`」断言退役；记账调用随两字段）∥ `-chat` **499** ⇒ ≤±12（记账两字段断言（`:241` ∥ `:484`）∥ 准入三级改点（`:461` ∥ `:490`））∥ `-accounts` **493** ⇒ ≤±15（`/api/me` ∥ 成员列表行形 `modelQuotas`（`:222` ∥ `:341`）∥ 403 清单端点名（`:322`）∥ CLI `member quota` 换形（`:389` ∥ `:410`））∥ `-webui-deploy` **322** ⇒ ≤±8（`seedMember` 旧列退役——`quota_tokens` INSERT 随正（`:48`–`:51`）；档目 19 ∥ 20 零变）∥ `-console-modals` **397** ⇒ ≤±30（成员弹窗编辑态换形：分模型覆盖面 ∥ 惰性 providers（`:176` ∥ `:206`–`:213`）∥ 配置区五组）∥ `-console-layout` **484** ⇒ ≤±10（成员行形夹具 `modelQuotas`（`:229` ∥ `:366`））∥ `-models-config` **267** ⇒ ≤±20（settings 子字段 `quotaTokens`——draft/线形/校验断言随正）∥ `-models-config-ui` **467** ⇒ ≤±25（配置四组 ⇒ 五组（F）∥ 输入面 5 ⇒ 6 枚（`:297` ∥ `:317`））。
- `-chat` **近硬线预案**：实读 **499**（离 500 硬线 1 行）——增量后越 500 ⇒ 拆档：单件面（tap ∥ 注入）段抽独立成件（沿注③先例）。
- **基准件 v5 读点逐点**（`-server-gateway` 实读 **495** ⇒ ≤±4；行号以当刻盘面为准）：`:9` 头注「六表 + 六索引 + `user_version=4`」⇒「八表 + 六索引 + `user_version=5`」（追加句 = v5 两派生表 + usage 拆列 + 成员配额列——2026-10-07 配额分模型批）∥ `:164` 标题文本同拍 ∥ `:167` `SCHEMA_VERSION` ⇒ 5 ∥ `:168` `readVersion` ⇒ 5 ∥ `:170` 表清单补 `usage_daily` ∥ `quota_counters`（八表）∥ `:171`–`:172` 索引数 6 ⇒ 6（不变——两新表主键 autoindex 不落 `idx_%` 面）∥ `:186` `migrate` 返回 ⇒ 5 ∥ `:201` `readVersion` ⇒ 5 ∥ `:205` 失败探针 `v: 5` ⇒ `v: 6`（`v5_probe` ⇒ `v6_probe`——`:209` 同拍）∥ `:207` 消息 `（v5）` ⇒ `（v6）` ∥ `:208` `readVersion` ⇒ 5。
- **新批内件**：`docs/batches/2026-10-07-quota-per-model.test.mjs`（拟新增）估算 **≈480 行**；越 500 硬线 ⇒ 拆档预案（配额检查腿 ∥ 派生表/对账腿 ∥ 汇表面腿——沿注③按域拆档先例）；`package.json` 门禁清单 18 ⇒ 19 件（`prepublishOnly` 添本批件）。
- `gateway/overview.mjs` 带读数（±0 组）：`overview.mjs` **27** ∥ `routes-admin.mjs` **95** ∥ `session.mjs` **95** ∥ `providers.mjs` **167** ∥ `provider-admin.mjs` **220**（全 ±0——本批零动；实读 = 2026-10-07 本次复核）。

**设计档收正落位**（评审 #126 #1/#2/#4–#7/#9/#10——各档就地落位）：`PROJECT.md` §2.2/§4/§6/§7（[7] 三写形 ∥ 标题 1–41 + KD-SV-37 行补 ∥ 域链补 metering 实读 416 ⇒ ≈690 ∥ store 实读 150 ⇒ ≈205 ∥ AC-21/AC-22 判据行 ∥ AC-17 行配置组数）∥ `METERING.md` §1/§2.3/§3/§4/§7（派生键时基 ∥ `model` 过滤优先级 ∥ AC-21 行编号/窗口 ∥ B24 扩）∥ `WEBUI.md` §5/§6/变更记录（小计复算 ∥ AC-15 同拍 ∥ AC-17 五组）∥ `ACCOUNTS.md` §4（小计 ≈822）。

**机检复跑（fix 轮）**：`node scripts/doc-check.mjs`——行宽 0 超限 ∥ 悬空 65（= #958 基线，不新增）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

对象 = 配额分模型批设计（四合一 · initial 轮）；评审面 = 批档 + 七设计档全读（机检 = 数值复算 ∥ 跨档引用闭合）。限制注记：① 未声明项目标准档/文档地图 ⇒ Document ownership 按仓内判例（「机制全文/判据全文」回指惯例）+ AGENTS.md 判（降级）；② 需求档不在评审面 ⇒ 需求覆盖按批档 §1 引用原话与 §2:21/§2:22 转述判（AC 全文未逐字核）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（机制两处描述不一） | 🔴 | `PROJECT.md:48` 聊天链 [7] 仍称「记账（usage 行落库——请求结束/流终结/客户端断开时单条 INSERT）」；同档 `PROJECT.md:27` 已改「记账（同事务三写：usage + 派生两表）」，`METERING.md:9`「落库 = **请求终结后同一事务三写**」——同一机制（记账写入）两处不同描述（单条 INSERT vs 同事务三写），退役表述未删净 | [7] 按三写形收正（usage 行 INSERT + `usage_daily`/`quota_counters` 两 upsert；时点表述不动），与 §2.1/METERING §1 同拍 |
| 2 | 文档状态（板总览声明 vs 落盘） | 🟡 | PROJECT.md 本批变更记录三处声明与正文不符：① `PROJECT.md:84` 标题仍「## 4. 决策索引（KD-SV-1–36）」（`PROJECT.md:315` 称「§4 索引增 KD-SV-38–41（标题 1–36 ⇒ 1–41）」）；② §6 无 metering ⇒ ≈690（全档仅变更记录行出现 ≈690；§6 链存量 = metering 233/≈377、store ≈155）；③ §7 无 AC-21/AC-22 行（表以 `PROJECT.md:222` AC-19 收尾；AC-20/KD-SV-37 亦缺——承 #985 面） | 三处按声明收正（标题 ⇒ 1–41 ∥ §6 链补 metering 实读 416 ⇒ ≈690 与 store ⇒ ≈205 ∥ §7 补 AC-21/AC-22 行）；或修正变更记录陈述 |
| 3 | 受影响文件标注（测试面） | 🟡 | 测试面无「实读 ⇒ 增量」标注：`2026-10-07-quota-per-model.md:72`「随正件（旧批内件——触旧列/旧形实读为界）」八件仅列名、未含基准件 `-server-gateway`（v4 读点先例 = `PROJECT.md:197`）/v5 读点逐点；`PROJECT.md:168` 在册「`-chat` 498」离 500 硬线 2 行而设计未给增量上限/拆档预案；`2026-10-07-quota-per-model.md:71` 新批内件无估算（先例 = `PROJECT.md:187`「新批内件（拟新增）估算 ≈450 行；越 500 硬线预案 = 注③」）；`gateway/overview.mjs` 仅「±0」未带读数 | 逐件补「实读 ⇒ ≤±N」+ v5 读点逐点（SCHEMA_VERSION/user_version/migrate 返回/表清单/索引数）；近硬线件与新批内件补拆档预案 |
| 4 | 语义悬空（派生键时基准） | 🟡 | 两派生表 upsert 的 `day`/`month` 键取时基准未钉：`STORE.md:43` ts = 「unix ms（请求开始）」而入账发生在请求终结（`METERING.md:9`）；回填/对账按 ts 重算（`STORE.md:154`）——若实现按 now 计键，跨零点/跨月请求将产生对账幻影漂移行 | 在 §1/§2.3 明写派生 upsert 键与 `usage.ts` 同源（同回填 SQL 表达式）；用例 B24 扩跨零点断言 |
| 5 | 边界（过滤可达性） | 🟡 | `model` 过滤解析（`METERING.md:65`「含斜杠 ⇒ `(provider, model)` 逐值对」）与嵌入 `provider=''` 相抵：嵌入名含 `/`（`STORE.md:192` 自认可含）时该过滤不可达（旧逐值匹配可达） | 过滤解析补优先级（如 `endpoint=embeddings` 在场 ⇒ `provider=''` 兜底）或注明边界与替代收窄径 |
| 6 | 一致性（判据行计数） | 🔵 | `WEBUI.md:422` AC-17 行「配置四组在册」却列举 A/C/D/E/F 五组（`WEBUI.md:126` 已称「配置区（五组——chat 行）」） | 计数随列举收正（F 保留「判据 = AC-21 行」指向） |
| 7 | 数值漂移（小计复算） | 🔵 | `WEBUI.md:409`「全表实读和 = public 19 档 2854 + `static.mjs` 78」——表内 19 档实读值相加 = 2922（差 68 ≈ `modal.mjs` 68，疑漏计）；`ACCOUNTS.md:87`「≈785 ⇒ ≈820（+≈37）」而 785+37 = 822 | 两处小计复算随正（或注明口径） |
| 8 | 文档卫生（销项） | 🔵 | `2026-10-07-quota-per-model.md:77` 上抛项段仍标「供父侧/用户裁」，而 `:29` 已载六条裁定（①–④⑥ 同意落 ∥ ⑤ 按退役落） | 上抛段落补销项/指向一行（或下轮 §2 append 收正） |
| 9 | 清晰（判据编号/窗口断言） | 🔵 | `METERING.md:76` AC-21 行子项编号 ① ② ④（③ 缺位，「④ 三级序」承接 ③ 内容）——与 §2.1 及批档 §1 规格编号不同源；行内未含「自然月（本地时区）」断言（仅用例 B24 载） | 编号对齐（或注明沿用需求档编号）；窗口断言点入行内 |
| 10 | 清晰（同源措辞） | 🔵 | `WEBUI.md:420` AC-15 行仍称看板「与 `/api/usage` 同源」，而数据源已分面（`METERING.md:75`「数据源 = 预聚合日表——本地日粒度」） | 与 METERING §4 同拍限定（同一过滤面；日对齐窗逐值相等） |

VERDICT: changes-required
计数：🔴 1 ∥ 🟡 4 ∥ 🔵 5 —— token 未签发（有 🔴 未决：第 1 条）。

### 轮次 2（评审子代理）

对象 = 配额分模型批设计（fix 轮十点落位后 · 复评）；机检 = 前轮十项逐条重读核对 + 残留扫（「单条 INSERT」∥「配置四组」∥ 旧小计值 2854/2932/820）+ 新读数交叉核（域档预算行）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | PROJECT.md | 🔴 | Fixed | `thincoder/docs/server/design/PROJECT.md:48` 现为「记账（请求结束/流终结/客户端断开时——同事务三写：usage 行 INSERT + usage_daily/quota_counters 两 upsert）」——与 `PROJECT.md:27`「记账（同事务三写：usage + 派生两表）」及 `thincoder/docs/server/design/metering/METERING.md:9`「落库 = **请求终结后同一事务三写**」同拍；「单条」残留全档扫零（仅变更记录 2026-10-07 行引述在案） |
| 2 | 2 | PROJECT.md | 🟡 | Fixed | `PROJECT.md:84` = 「## 4. 决策索引（KD-SV-1–41）」；`:124` KD-SV-37 行在（「| KD-SV-37 | 控制台布局收正 = 数据表五页视口高壳 + 左对齐 + 弹窗列表表格化 | `webui/WEBUI.md` §7 |」）；`:152` §6 链补「metering **≈260 ⇒ 218 ⇒ 233 ⇒ ≈377 ⇒ 实读 416 ⇒ ≈690**」+ store ⇒ ≈205；`:225`/`:226` AC-21/AC-22 行在 |
| 3 | 3 | 批档 §2 补记 | 🟡 | Fixed | `thincoder/docs/batches/2026-10-07-quota-per-model.md:93`「随正 8 件「实读 ⇒ ≤±N」」逐件在（含断言改点）∥ `:94`「- `-chat` **近硬线预案**：实读 **499**（离 500 硬线 1 行）」∥ `:95`「**基准件 v5 读点逐点**（`-server-gateway` 实读 **495** ⇒ ≤±4；行号以当刻盘面为准）」∥ `:96`「估算 **≈480 行**」+ 拆档预案 ∥ `:97` ±0 组全带读数 |
| 4 | 4 | METERING.md | 🟡 | Fixed | `METERING.md:10`「两 upsert 的 `day`/`month` 键 = 行 `ts` 推导」；`:39`「**键时基 = 行 `ts` 同源**」；`:121` B24 扩（「终结行键随 `ts`（与回填同表达式）——对账零幻影行」） |
| 5 | 5 | METERING.md | 🟡 | Fixed | `METERING.md:67`「解析优先级：`endpoint = embeddings` 在场 ⇒ 全串按 `provider = ''`（嵌入命名空间——嵌入名可含斜杠，不切分）」（嵌入含斜杠名经 endpoint 过滤可达） |
| 6 | 6 | WEBUI.md | 🔵 | Fixed | `thincoder/docs/server/design/webui/WEBUI.md:422`「配置五组在册」（列举 A/C/D/E/F 自洽；`PROJECT.md:221` AC-17 行同拍「详情/配置五组（A/C/D/E/F——F 判据 = AC-21 行）」） |
| 7 | 7 | WEBUI.md ∥ ACCOUNTS.md | 🔵 | Fixed | `WEBUI.md:409`「全表实读和 = public 19 档 2922 + `static.mjs` 78」（⇒ ≈3112 ⇒ ≈3233 链算术闭）∥ `thincoder/docs/server/design/accounts/ACCOUNTS.md:87`「**⇒ ≈822**（配额批：+≈37 = members +≈24 ∥ keys +≈7 ∥ routes +≈6）」（785+37 = 822） |
| 8 | 8 | 批档 §2 补记 | 🔵 | Fixed | `2026-10-07-quota-per-model.md:89`「**上抛六条销项**（评审 #126 #8；裁定全文 = §1 补记四）」+「①–④⑥ 同意落 ∥ ⑤ 旧 `members.quota_tokens` 删列按退役落（「旧值不保留」已披露）——六条不再待裁。」（原 §2 段沿 append-only 留存，销项块在其后） |
| 9 | 9 | METERING.md | 🔵 | Fixed | `METERING.md:78` 序号对齐 + 窗口断言入行：「③ 三级序逐级生效（覆盖 > 平台 > 不限；短路 = 零 SQL——计数探针注入）∥ ④ 检查 = 仅 chat（派发命中后/转发前）∥ 窗口 = 自然月（服务器本地时区——月键 `'YYYY-MM'`；跨零点/跨月（含月初终结）键随行 `ts`、新月键零起）」 |
| 10 | 10 | WEBUI.md | 🔵 | Fixed | `WEBUI.md:420`「与 `/api/usage` 同一过滤面（数据源 = 预聚合日表；日对齐窗逐值相等——口径 = `metering/METERING.md` §4）」 |
| N | (new) | 批档 §2 补记 ∥ gateway/API.md | 🔵 | New | 同一文件两处「实读」同日不一：`2026-10-07-quota-per-model.md:97`「`overview.mjs` **27**」+「（全 ±0——本批零动；实读 = 2026-10-07 本次复核）」vs `thincoder/docs/server/design/gateway/API.md:115`「**≈70 ⇒ 实读 28 ⇒ ≈30**」——`gateway/overview.mjs` 为本批改行件（`usageTotals` 迁址），两读应一致。建议：二者取一（行式以当刻盘面校准；回填轮核销）或注明口径差。不阻塞 |

VERDICT: pass

计数：🔴 0（前轮 1 已 Fixed） ∥ 🟡 0（前轮 4 全 Fixed） ∥ 🔵 1 新增（不阻塞）——前轮十项全数核销；新发现 1 项（读数不一）。

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签——用户 2026-10-07 09:54「自动跑完」授权）**

- **三条件齐备**：① 设计评审 **#128 = pass**（轮 2：前轮 1🔴 + 4🟡 + 5🔵 全数 Fixed ∥ 新增 🔵 1 项——读数不一，不阻塞）；② 修正轮 **#127** 已落地并经父侧逐点核验（十点全中——§1 补记五在案）；③ token 已签发（评审 Approved 回执在会话）。
- **评审链**：轮 1 = #126（changes-required：1🔴+4🟡+5🔵）→ 修正轮 #127（十点定点落位）→ 轮 2 = #128（十项全 Fixed）。新 🔵 处置 = 随实施回填轮以当刻盘面校准（`overview.mjs` 读数口径勘同）。
- **批准范围** = #992 批全链实施（四合一：分模型配额 ∥ 检查性能 #991 ∥ 模型标识两字段 §2:22 ∥ 预聚合日表 #990）+ 收口核销。
- **授权依据**：用户 09:54「自动跑完」（全链自动——设计评审代点火 ∥ §4 代签 ∥ 实施派发 ∥ 收口 ∥ 核销 ∥ 提交推送）；自缚三条在案（代签三条件 ∥ 新范围即停 ∥ 破坏性即停）——删列（旧 `quota_tokens`）披露已于 10:0x 呈报、「旧值不保留」在案。

## §5 实施记录（eng-coder）
**状态行**：实施完成（舱B（前端/控制台面）——public 七件落地 ∥ 四件随正 tmp 就绪待搬 ∥ 内审计+内评审 converged(clean)）



**§5 实施记录（eng-coder · 2026-10-07 · round=initial · 后端/数据面）**

**射程**：批档 §2 任务书六链落位（v5 一次迁移 ∥ 三写单写点 ∥ 配额三级检查 ∥ 汇表面换读日表 ∥ 对账命令 ∥ CLI 换形）+ 测试面（新批内件 + 门禁 18⇒19）。前端面 `public/**` 与 B 舱四件零触（父侧划界）。

**落点（机制链 → 代码坐标）**：
① v5 迁移 = `thincoder-server/src/store/db.mjs:95-144`（`DDL_V5` 与 `store/STORE.md` §2 v5 段**逐字**：拆列 ALTER+UPDATE（判据 `endpoint='chat'`+首斜杠；嵌入 `provider=''`）∥ `usage_daily` ∥ `quota_counters` ∥ 成员列增删 ∥ 两表期初回填）+ `MIGRATIONS` 尾段 `:150`；
② 三写单写点 = `src/metering/usage.mjs:70-86`（BEGIN → usage INSERT → `bumpDerived` → COMMIT；异常整滚）；
③ 派生两表 = `src/metering/aggregates.mjs:48-65`（upsert；键随行 `ts` 推导）+ `:68-76`（计数点查 O(1)）+ `:101-134`（对账重算/覆写）+ `:137-141`（派生清理）；
④ 检查面 = `src/metering/quota.mjs:15-40`（三级 ⇒ 零 SQL 短路 ⇒ 点查 ⇒ 429 形）+ `src/gateway/routes.mjs:49-51`（派发命中后/转发前；仅 chat；嵌入面零检查）；
⑤ 汇表面 = `src/metering/report.mjs:82-169`（summary/totals/key 窗/成员月累计读 `usage_daily`；明细/导出仍读 `usage`）+ `usage.mjs:22-32` 原址 re-export 保名面（读侧零改）；
⑥ 配置/端点 = `src/ops/config.mjs:21,163-190`（`quotaTokens` 子字段）+ `src/metering/routes.mjs:100-110`（`POST /api/members/:id/model-quotas` 键级合并 ∥ 旧端点退役 404）+ `src/accounts/{keys,members,routes}.mjs`（`modelQuotas` 随鉴权行/成员行）；
⑦ CLI = `src/ops/cli.mjs:80-91`（`usage reconcile [--month] [--fix]`）+ `:109-127`（`member list` 覆盖数列 ∥ `member quota <name> <model> <N|none>`）；
⑧ 门禁 = `thincoder-server/package.json:13`（十八 ⇒ **十九件**）+ 新批内件 `docs/batches/2026-10-07-quota-per-model.test.mjs`（实读 **446** 行——估 ≈480 未越线）。

**读数（本会话实跑 · 定向件）**：10 件 **84 例全绿**——随正四件（metering 2 ∥ chat 9 ∥ accounts 13 ∥ webui-deploy 6）+ 全扫六件（server-gateway 13 ∥ model-ref 5 ∥ console-completeness-2 6 ∥ console-providers 9 ∥ server-auto-update 14 ∥ console-list-style 5 绿 + 1 条 B 舱前端面残留）+ 新批内件 7 例；`node --check` 全部改件通过。**仓套件未跑**——`not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**披露（偏离/越限/待搬）**：
- **tmp 待搬**：旧批档 companion 件受写入门禁机械拒（预期）⇒ 十件改后全文 + `映射单.md` 落 `.thincoder/tmp/quota-a-随正/`，**父侧搬入 + 父侧跑件**（本舱已在 tmp 内自检全绿）。
- **拆分口径**：`usage.mjs` 拆分采用「原址 re-export 保名面」（沿仓内先例）——`report.mjs` 除汇表面读外并载「过滤构建 + 日/月键助手」（避 `usage ↔ report` 循环依赖、保读侧零改）；与 `METERING.md` §5 职责列「过滤构建 ∥ 时间助手」留在 usage.mjs 的表述有差 ⇒ **设计档回填轮随正**（行数同步：usage 实读 171 ≈ 估 255 ∥ report 实读 170 ≈ 估 105——同域小计 ≈690 未越）。
- **越限**：随正 `-server-gateway-metering` 188 ⇒ **242（+54，超 ≤±45 约 9 行）**——超出部分 = 新面断言（嵌入命名空间过滤 ∥ 旧端点退役 ∥ 派生两表逐值），已按「越限即披露」在案。
- **B 舱连带（父侧并账）**：`-models-config.test.mjs:142` / `-models-config-ui.test.mjs:263,274` 期望值需加 `quotaTokens: null`（本舱 `validateProviderSettings` 归一化扩展所致）；`-console-layout.test.mjs:438` 门禁件数 18⇒19——均在父侧划定「零触」件内，本舱未改。
- **接受不修（评审非阻塞项）**：`reconcileUsage --fix` 重算快照在写事务之外（并发窗内入账增量可被覆写；派生面可重算自愈）∥ `mergeMemberModelQuotas` 覆盖键未做形校验（裸名键恒不生效）∥ `keyUsageStats` 日粒度窗较报表窗多含界日一天 ∥ 批内件 ④ 清理腿用 `Date.now()`+91d（月界跑件可假红）——四项已由代码评审在案，转父侧定夺/登记。

**审计与评审轮次**：内部审计（explore · 静态全量对照）= **DEVIATIONS 1 项**（本次已披露的职责/行数文档漂移；PARTIAL ∥ SILENT-SIMPLIFICATION ∥ OUT-OF-LIST 三类零）；自修轮 = 0（无需修正项）；内部代码评审（advisor · type=code）= **pass**（🔴 0；🟡 2（1 协调项 + 1 可选项）；🔵 5——逐条处置见上/交付报告）。**终态 = clean**。

**§5 实施记录（eng-coder · 舱B——前端/控制台面 · 2026-10-07）**

**范围**（批档 §2 任务书前端面；后端/迁移/CLI = 舱A 零笔）：服务模型页 F 组（`quotaTokens`）∥ 成员弹窗分模型覆盖表（查看/编辑两态 ∥ 惰性 providers ∥ 键级合并）∥ 成员列表/我的页覆盖计数行形 ∥ i18n 键族 ∥ style 微调。设计评审 #128 pass（token 在）。

**落点（实读 file:line——cwd = `thincoder/`）**：
- `thincoder-server/public/views-admin.mjs`（185 ⇒ 275）：成员表列 `col.quota` + 覆盖计数（`:59/:65`）∥ 查看态详情 + 分模型用量节（`:119-127`/`:147-153`）∥ 编辑态覆盖表（`:162-189`：全 chat 行 `deriveModels` 序 ∥ 空 = 按平台 placeholder ∥ 平台默认列只读 ∥ 不在清单键注行）∥ 惰性拉 providers + 失败窗内行/重试 + 会话失效踢登录（`:192-207`）∥ 保存 `POST /api/members/:id/model-quotas` 键级合并（`:222-248`；空 ⇒ 显式 null；非法 ⇒ 就地提示不提交；失败 ⇒ 窗内状态行）。
- `views-models.mjs`（199 ⇒ 207）：`NUMERIC_FIELDS` 增 `quotaTokens`/`nonNegativeInt`（`:36`）∥ `RULE_KEYS` 单源（`:38`）∥ draft/线形/读数（`:63/:156`）∥ F 组（`:182-185`——序 A/C/F/D/E；单键全对象提交含 quotaTokens）。
- `app.mjs`（317 ⇒ 321）：`fmtQuota` 退役 ⇒ `fmtModelQuotas`（`:67-70`——0 ⇒「按平台」∥ N ⇒「N 个模型」）∥ viewCtx 换供（`:243`）。
- `views-me.mjs`（122 ⇒ 122）：我的用量摘要行 = 覆盖计数（`:77`）。
- `i18n-zh.mjs`（334 ⇒ 345）/ `i18n-en.mjs`（330 ⇒ 341）：改值 1（`col.quota` ⇒「分模型配额」/「Model quotas」——列表列 ∥ 弹窗 ∥ 我的页三处同键）∥ 新增 12 键（登记 10 + 同族追加 2：`admin.members.quotaEmptyHint` ∥ `admin.members.quotaOffListNote`——§2.4② 强制文案原无登记键）∥ 退役 1（`admin.members.colQuota`——列表列改 `col.quota` 后零消费，删前全仓自核）。
- `style.css`（223 ⇒ 224）：`.quota-table td .hint` 就地提示收边（`--sp-2` 刻度内）；`input.quota` 90px 原值保留（唯一消费面 = 配额表内）。

**验收对照（自检 · 机检面）**：
- `node --check`：改件（public 六 mjs）全过；style.css 行宽/规范随静态扫描。
- i18n：两表键集 zh/en 双向相等（除自称名族）∥ en 值面零 CJK ∥ 占位符逐键一致 ∥ 新增 12 键两表在册 ∥ 旧键零残留 ∥ 键引用闭合（全 `public/**.mjs` `t("…")` 字面量 327 枚 ⊆ 表键，零悬空）。
- 行数（实读 vs §2 标注）：`app` 321（估 ≈320）∥ `views-admin` **275（估 ≈255，+20——越估披露）** ∥ `views-models` 207（≈218）∥ `views-me` 122（≈126）∥ `i18n` 345/341（≈344/≈340）∥ `style` 224（≈228）。
- 测试面：四件随正成稿在 `.thincoder/tmp/quota-b-随正/`（跨批写闸机械拒写 ⇒ 父侧裁定②：父侧文件级搬入 + 父侧跑件；映射单同目录）；**本舱内跑件 28/28 全绿**（`node --test`，cwd = `thincoder/`；A 舱后端与本批内件落地后复跑）。**not repo-suite verified — the parent-side closeout run is the only repo-suite run.**

**审计与代码评审轮次与终态**：
- ① 内探索背离审计（只读子代理；对照 WEBUI §2.2/§2.4②③/§2.6⑤/§6 AC-21/§7 KD-SV-41 + 批档 §2 + 契约三档）：**无「代码 vs 设计」实质背离**（无部分实现 ∥ 无静默简化 ∥ 无越清单）；发现 2🔵（记录面）：(a) 行增量越估项须落档披露（本段 + 交付报告已披露）；(b) **设计档面漂移**：`webui/WEBUI.md:67` §2.2 覆盖范围仍列「格式化助手（`fmtQuota`「不限」键化…）」而代码已退役 `fmtQuota`（替换者 `fmtModelQuotas`）——设计档 = eng-designer 面，本舱零改、报父侧随正。
- ② 内 advisor 代码评审（public 七件 + WEBUI/METERING/批档）：**VERDICT pass**。2🟡（`app.mjs` 321 行 ∥ i18n 345/341 行越 300 软线——**均为在册裁定债**：拆分预案在册（health.mjs）/ R25 拆表轮；非 must-fix）+ 5🔵。
- 处置：🔵（配置「四组」旧计数注释 5 处）⇒ **已修**（随正「五组（A/C/F/D/E）」）；🔵（`input.quota` 90px 被 110px 特指覆盖 → 原声明不可达）⇒ **已收正**（删多余覆盖行，90px 为唯一可达声明）；🔵（新增键 12 vs 登记 ≈10）= 父侧裁定①披露项（记录面）；🔵（`views-admin` 275 vs 估 ≈255）= 收口轮以实读校准。修后复跑：四件 28/28 绿 ∥ node --check 全过。
- 终态：**converged（clean）**——0🔴 ∥ 0 must-fix；余项 = 记录面/在册债务。

**决策透明表**：
| # | 决策 | 依据 |
|---|---|---|
| 1 | 新增 12 键（10 登记 + `quotaEmptyHint`/`quotaOffListNote`） | §2.4② 强制两文案无登记键；父侧裁定①（同族追加、≈10 容差内、披露即可） |
| 2 | `admin.members.colQuota` 删净 | 列表列改 `col.quota`（§2.2「三处同键」）后零消费（删前自核）；父侧裁定③ |
| 3 | F 字段标签 = `admin.members.colMonthlyQuota`（跨命名空间复用） | 登记键无字段标签键；跨面复用先例 = `admin.models.colModel`（Provider 弹窗表头） |
| 4 | 保存失败 ⇒ 窗内状态行（`mapError`）非 flash | KD-SV-41 引「弹窗反馈定则（#986——失败/加载落窗内）」 |
| 5 | 编辑态输入 = `text` + `inputmode`（非 `number`） | 沿 C/E 组先例（非法态可判——number 型被浏览器吞空） |
| 6 | 四件随正留 `.thincoder/tmp/quota-b-随正/` 待搬 | 跨批写闸机械拒写；父侧裁定②（父侧文件级搬入 + 父侧跑件） |

**fix round（自纠 ≤5 轮内）**：① `views-models.mjs` 保存读数缺 `quotaTokens`（F 输入值恒不提交）——随正件 ⑦b 腿抓出，已修（`:156`）。② 评审 🔵 收正 6 处（「四组」注释 ×5 ∥ style 覆盖 ×1）。③ 随正测试件自纠三轮（惰性拉取微任务时序 ∥ 提交体期望形 ∥ 清空路径夹具）。

**待搬/未写入项**：四件随正 + 映射单「**tmp 就绪待搬**」（父侧文件级搬入 `docs/batches/` + 父侧跑件）；`package.json` 门禁 18 ⇒ 19 = 舱A（已落）。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-07）**

**链条**：设计（§2 在档——两舱拆分 A/B）→ 设计评审（§3 在档）→ 实施 **#130（A 舱）∥ #131（B 舱）**（两舱内审 + 内评 converged）→ 父侧搬入 / 跑件 / 核验 → 收口。

**父侧核验读数**：收口门禁（`thincoder-server/package.json` `prepublishOnly`——3 查 + 19 批件全跑）**155/155 全绿**（148 旧 + 本批件 7）∥ 随正 / 全扫 14 件搬入后全绿（父侧亲跑：十件 83/84 含收正后全绿 ∥ 四件 35/35）∥ 批内件 **7/7** ∥ 实机 smoke（8787 `root`/`healthz`/`app` 全 200——dev 库自动迁 v5）∥ 核心路径亲读（`metering/quota.mjs` 短路口 ∥ `store/db.mjs` v5 段——与设计逐字一致）。

**用户走查**：2026-10-07 11:16 走查反馈三条 = **新范围（改进意见）**——不入本批收口；已入台账 **#1002**（成员弹窗模型表直显 + 逐行已用——数据面逐模型计数已存在，缺显示/API）∥ **#1003**（服务模型页列表显示配额）∥ **#1004**（成员模型禁用：默认可用 · 勾选即禁用 · 服务端执行）——归「配额面 v2 · 成员模型面」批（待用户 A/B 一句裁后点火）。本批 UI 面照设计交付（F 组 ∥ 成员弹窗覆盖表 ∥ 列表 / 我的页行形）。

**父侧直接执行（标注 · 可 revert）**：① `-console-list-style` ④ 计数 pin 12 ⇒ **15**（本批 +3 窗内状态行——题面/注释/断言三处）；② `WEBUI.md:67` `fmtQuota` ⇒ `fmtModelQuotas` 收正；③ 两舱 tmp → `docs/batches/` 文件级搬入（14 件）。

**核销**：#992（→ 已核销）∥ #990 ∥ #991（并入项 → 已核销）——台账随收口收正。**暂缓批复核**：无。**用户文档面**：无（内部管理台面——README / 对外档零涉）。

**跨批注**：① 「跨批写闸」两舱执行为新制首用（tmp 通道 + 父侧搬入）✓；② A 舱越估披露（`-server-gateway-metering` 随正 +54，超 ≤±45 约 9 行——新面断言，接受）；③ B 舱披露（`-console-modals` Δ+63 越 ≤±30——皆 §2.4② 必落行为，接受；`views-admin.mjs` 275——未越 300）；④ 设计档回填（METERING §5 职责 / 行数标注与实读不符）→ 台账 **#983** 文档面轮；⑤ 披露四小项（`--fix` 并发窗 ∥ 覆盖键形校验 ∥ 窗口差 ∥ 用例脆弱）→ 台账 **#1001**。

**提交**：随今日收敛波统一签入（路径限定——server 面 + public + 批档 + 批内件 + 移入件）。
