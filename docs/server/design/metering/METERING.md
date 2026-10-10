# Thincoder Server · 计量（metering/METERING）

> 板块 = server ∥ 本档 = metering 域（记账 ∥ 配额 ∥ 查询）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 3 ∥ 4）；本域回指 = `PROJECT.md` §7（AC-3 ∥ AC-4 判据 = 本档 §4）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 记账（usage）

- 落库 = **请求终结后同一事务三写**（请求结束 ∥ 流终结 ∥ 客户端断开时）：`usage` 行 INSERT + `usage_daily` upsert（计数 +1 ∥ token/时长/错误数累加） + `quota_counters` upsert（token 累加）——单写点 `recordUsage`（KD-SV-8 修订——§6）；
  两 upsert 的 `day`/`month` 键 = 行 `ts` 推导（`strftime(…, ts / 1000, 'unixepoch', 'localtime')`——与 v5 回填/对账 SQL 同表达式；非入账时刻）；
  任一步失败 ⇒ 整事务回滚（两派生面零漂移）；表结构 = `store/STORE.md` §2 v5 段。
- 行形 = 一行/请求：成员 × key × 模型（**`provider` ∥ `model` 两字段** = 内部真名（转发/存储零涉）——对外显示 = **别名回映射**（配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`；回映射单源 = `thincoder-server/src/gateway/providers.mjs` 别名索引——KD-SV-59）；`model` 可含斜杠；嵌入行 `provider = ''`——无前缀命名空间，仅统计照记） × 时段（`ts`） × token（三列 + 状态/端点/流式标记/耗时）；
  token 三列 = **上游 usage 原值**（逐值不加工——AC-3 判据单源）；上游未回 ⇒ 三列 NULL（status 照记实况；派生日表该行 token 计 0）。
- 提取来源 = gateway 侧 tap 扫描（`gateway/API.md` §2.1）。
- **派生两表 = 汇表面读源 ∥ 检查面点查源**（`usage_daily` ∥ `quota_counters`——粒度/字段 = §2.3；**可随时自 usage 重算**——对账命令 = §2.5）；仅 `usage` 为真源——明细/导出/审计毫秒精度零改。
- 保留 = **保留窗（配置化——`usageRetentionDays`，`ops/OPS.md` §1）**：缺省 90 天（论证 = 配额周期 = 月 ⇒ 跨月可见必需；统计回看惯例 = 一季 ⇒ 90 天覆盖；表只增不减 = 无界增长面 ⇒ 缺省窗收口）；`null` = 不限（保留全量——显式开）；非正整数 ⇒ 拒启。
- 清理 = **删除式**（`pruneUsage`——`thincoder-server/src/metering/`）：usage（`ts <` 界 ∥ 走 `idx_usage_ts`） + `usage_daily`（`day <` 界日） + `quota_counters`（`month <` 界月）**三删同事务同窗**；时机 = **启动一次 + 每 24h**（实现常量；入口接线 = `thincoder-server/bin/thincoder-server.mjs`）；无归档面（§8）。
- **审计事件同窗同清**：`audit_events`（v3）清理复用本保留窗与调度点（启动一次 + 24h——`accounts/ACCOUNTS.md` §2.1；保留治理单旋钮）。
- **清理失败口径 = 启动 fail-closed ∥ 周期 fail-open**：启动一次（抛 ⇒ `startup_failed` + 退出码 1） ∥ 周期（`usage_prune_failed` warn 续跑）。
- **查询面口径**：保留窗不涉查询契约（窗外行自然不在结果——`from` 早于窗界亦同；非错）∥ **明细面（`/api/usage` ∥ `/api/me/usage` ∥ export ∥ 审计）= `usage`（真源——毫秒精度）** ∥ **汇表面（summary/totals/key 窗/成员月累计）= `usage_daily`（本地日粒度——窗沿取整含端日；API 形零变——KD-SV-39）**。

## 2. 配额（分模型三级·计数准入——KD-SV-38）

### 2.1 三级生效（需求 §2:21——用户 09:28）

- ① **成员 × 模型覆盖** = `members.model_quotas_json`（JSON map——键 = 对外标识（别名 ∥ `provider/model`）；值 = ≥0 整数；未设 = 用平台） ⇒ ② **模型平台默认** = `providers.settings_json[上游模型名].quotaTokens`（未设 = 不限） ⇒ ③ **不限**。覆盖 = 整值替换（可高于 ∥ 低于平台——用户 09:28「覆盖平台设置」字面）。
  **键随别名随动**（2026-10-09 alias 批——KD-SV-59）：写面键形 = 当前对外标识（配别名模型 ⇒ 别名形）；别名变更 ⇒ 旧形键落入离表键（恒保留、不生效——无历史/迁移）。
- 单位 = token（`total_tokens` 口径） ∥ 周期 = 自然月（服务器本地时区；月键 = `'YYYY-MM'`——平台 ∥ 覆盖同窗，用户 09:30）。
- 配置落点 = 服务模型页配置弹窗（平台——`webui/WEBUI.md` §2.4③） ∥ 成员弹窗（覆盖——§2.4②）；写面 = `POST /api/members/:id/model-quotas`（键级合并——§3） ∥ PATCH `settings`（平台）。

### 2.2 检查点与超限形

- 检查点 = **派发命中后、转发前**（与模型限流准入并列——「准入前拒打不落用量」不变）；**仅 chat**——嵌入面零涉（用户 09:31 裁；旧实现的嵌入总额检查已移除——收正）。
- 超额 ⇒ 429 `quota_exceeded`（message 含模型外标 + 已用/额度——如「模型 p/m 本月 token 额度已用尽（已用 X / 额度 Y）」）；**他模型不受累**（按请求模型判）。
- 嵌入不受配额管理（计量照记——含嵌入计数行）。已知边界：单笔可越顶（准入不知本笔产出——同「不估 token」取舍）。

### 2.3 派生两表维护（计数面 ∥ 汇表面）

- **`quota_counters`**（检查面）：粒度 = 成员 × provider × 模型 × 自然月（`tokens` 列）；维护 = 随记账**同事务 upsert 累加**（§1——单写点防漂移）；全记账行照计（含嵌入——检查只读 chat 键）；月翻滚 = 新月份键自然归零（零翻转逻辑）；期初 = v5 迁移自 usage 一次性聚合回填。
- **`usage_daily`**（汇表面——#990）：粒度 = 日 × 成员 × key × provider × model × endpoint（请求数 ∥ 三 token 和 ∥ 时长和 ∥ 错误数）；维护 = 同事务 upsert 累加（同上）；日键翻滚自然归零；期初 = v5 回填。
- **计数表读面两形**（配额 v2 批）：① 点查（准入——§2.4）∥ ② 成员月表读（`monthlyCountersByMember`——成员弹窗逐行已用：Map 成员 → 外标 → tokens；外标回拼 = **读面回映射**：配别名 ⇒ 别名 ∥ 未配 ⇒ `provider = '' ? model : provider + '/' + model`；`memberId` 给定 ⇒ 唯一键前缀查询 ∥ 缺省 = 全员一次装配（免 N+1））。
- 两表 = 可重算派生面（真源 = usage）；保留/清理同窗（§1）；**键时基 = 行 `ts` 同源**（`day`/`month` 随 `usage.ts` 推导——与回填/对账同表达式；跨零点/月初终结请求 ⇒ 键归 `ts` 所在日/月——对账零幻影漂移；§1）。

### 2.4 检查查询与性能（用户 09:31 点名——硬要求；#991 转正）

- **检查 = 点查固定计数字段**（非 SUM——用户 09:34 直令）：`SELECT tokens FROM quota_counters WHERE member_id = ? AND provider = ? AND model = ? AND month = ?`——O(1)（唯一键点查；EXPLAIN 预期 = `SEARCH … USING INDEX sqlite_autoindex_…`）。
- **三级全无 ⇒ 零 SQL 短路**：成员 map 随鉴权行（解析一次）+ 平台值随运行时快照（`settingsFor`——内存）⇒ 无限额 ⇒ 直接放行、不触库（现状缺陷收正：旧 `checkQuota` 先跑 SUM 后判「不限」——不限成员每请求白付全量 SUM，已两步对调）。
- **目标读数**（@500k 行同构库）：配置命中路径 ≤ 0.05ms（p95） ∥ 短路路径零 SQL（µs 级——JSON 解析 0.08–0.28µs/请求）。**本轮探针读数**：点查 p50 **0.004ms** ∥ p95 **0.005ms**；对照 = 旧 SUM 路径 21.4ms/请求（#991 立案实读）∥ 本轮同构复测 3.3–7.0ms（分布/机器差——两读并陈）。
- **实测法** = 同构探针：临时库同形 500k 行 + 同 SQL/同参数——预热后 ≥1000 次采样报 p50/p95（探针 = `.thincoder/tmp` 零落仓；读数随批档 §2 在册）。
- **不加缓存 ∥ 不加批量**（判据：点查读数优于目标一个量级——余量 10×+；缓存失效面 ∥ 批写路径复杂度无对应收益——宁简勿繁；负载升档 = #989 升级阶梯）。
- 对账面候选（不采）：覆盖索引 `usage(member_id, provider, model, ts, total_tokens)`——#991 实测 21.4→0.14ms（150×）但读数仍随明细行数线性涨；判据 = 检查已与行数解耦（固定字段）——索引仅常数提速，无对应收益（读数留作对账/报表参照；对账高频化 ∥ 报表批再触即评估）。

### 2.5 对账与修复（防漂移兜底）

- `node src/ops/cli.mjs --config <档> usage reconcile [--month YYYY-MM] [--fix]`（本机直开库——`ops/OPS.md` §3）：对账面 = `usage_daily` + `quota_counters` **vs usage 重算**（缺省窗 = 当本月；重算 = 同回填 SQL 逐值）；只报缺省——`--fix` = 以重算值覆写；读数 = 漂移行清单 + 合计；
  `--fix` 路径 = **读快照与覆写同事务**（`BEGIN IMMEDIATE` 先行——CLI 对账 × server 记账的跨进程并发窗闭合；报告路径（无 `--fix`）零改——#1001① 收正）。
- 口径注：对账只对**完整月**有意义（当本月 ∥ 指定月；保留窗切割月含清理残差——读数自明）；两派生表自 usage 全量可重算（真源单点）。

## 3. 查询与额度端点（本域）

（错误形 = `gateway/API.md` §3；写端点仅收 `application/json`；同族其余端点 = `accounts/ACCOUNTS.md` §3）

| 方法 + 路径 | 鉴权/角色 | 语义 |
|---|---|---|
| `GET /api/me/usage` | 会话 | 本人用量明细（成员固定 = 本人；列同下；过滤：`model` ∥ `endpoint` ∥ `from` ∥ `to` ∥ `limit`——读端点同过滤器） |
| `GET /api/me/usage/summary` | 会话 | 本人用量报表（me 用量图表化批——成员固定 = 本人）：过滤 `model` ∥ `endpoint` ∥ `from` ∥ `to`（同过滤器；缺省窗 = 近 30 个本地日——`USAGE_SUMMARY_DAYS`）；返回 `{ "totals": { "requests", "promptTokens", "completionTokens", "totalTokens" }, "trend": [ { "day", "requests", "totalTokens" } ], "trendByEndpoint": [ { "day", "endpoint", "requests", "totalTokens" } ], "trendByModel": [ { "day", "model", "requests", "totalTokens" } ], "byModel": [ { "model", "requests", "totalTokens" } ] }`——数值列 = number ∥ `day` = 本地日键 `YYYY-MM-DD` ∥ `model`/维值 = 回拼外标；`trend` = 按日零填充全序列 ∥ 两维序 = 逐（维值 × 日）零填充（维值集 = 窗口内有数据者；缺日计 0）∥ `byModel` 降序（与 `/api/usage/summary` 同口径；`promptTokens`/`completionTokens` 拆 = 本端点独有）；实现 = `memberUsageSummary`：调 `usageSummary({ memberId })`（成员固定——既有函数零改）+ 独立拆 totals 查询（同窗同过滤——prompt/completion 拆值）+ 两维序查询；admin 端点/读函数/响应组装零触（KD-SV-50） |
| `GET /api/usage` | admin | 全队用量明细（过滤：member ∥ model ∥ endpoint ∥ from ∥ to ∥ limit——缺省 100 ∥ 上限 500）；返回 `{ "rows": [ { "id", "ts", "member", "keyHint", "endpoint", "model", "status", "stream", "promptTokens", "completionTokens", "totalTokens", "durationMs" } ] }`（`ts` 原样 unix ms——页面本地化显示） |
| `GET /api/usage/summary` | admin | 用量报表读数（功能点 15②；数据源 = `usage_daily`——KD-SV-39）：过滤面同上；时段缺省 = **近 30 天**（`USAGE_SUMMARY_DAYS`）；返回 `{ totals: { requests, totalTokens }, trend: [{ day, requests, totalTokens }], byModel: [{ model, requests, totalTokens }], byMember: [{ member, requests, totalTokens }] }`——trend = 按日（服务器本地日界）**零填充**全序列；byModel/byMember = 降序聚合（聚合与排行同数据面——降序即排行）；`byModel` = provider×model **两列聚合**（`model` 字段 = 回拼对外标识——形不变） |
| `GET /api/usage/export` | admin | 同过滤面 ⇒ **CSV 下载**（`text/csv; charset=utf-8` ∥ `Content-Disposition: attachment; filename="usage.csv"`）：列 = `ts,member,key_hint,endpoint,model,status,stream,prompt_tokens,completion_tokens,total_tokens,duration_ms`（表头英文——机器面）；`ts` = ISO 8601（UTC）∥ `stream` = 1/0 ∥ NULL token = 空单元格；RFC 4180 引号规则 + 行尾 CRLF + UTF-8 BOM（Excel 中文兼容）；行数上限 `USAGE_EXPORT_MAX = 100000`（超 ⇒ 400「收窄时段」；常量注入口径） |
| `POST /api/members/:id/model-quotas` | admin | 设分模型覆盖（键级合并）：`{quotas: {"<对外标识（别名 ∥ provider/model）>": N|null}}`——值 null = 删键 ∥ ≥0 整数；未出现键不动；**键形校验** = 非空 ∥ 无首尾空白 ∥ 含斜杠时两段非空（裸名 = 别名形合法——#1008 收正）∥ 非法键 ⇒ 400（库零变）；返回 `{id, modelQuotas}` |

（过滤参数 `endpoint` ∈ `chat` ∥ `embeddings`（缺省 = 不过滤；非法值 ⇒ 400 `invalid_request_error`）——五读端点同门（两明细 ∥ 两报表 ∥ 导出）；`model` 过滤 = 对外标识形；解析优先级：`endpoint = embeddings` 在场 ⇒ 全串按 `provider = ''`（嵌入命名空间——嵌入名可含斜杠，不切分）∥ 否则**先经别名索引反查**（命中 ⇒ 真名对——KD-SV-59）∥ 未命中且含斜杠 ⇒ `(provider, model)` 逐值对 ∥ 否则 ⇒ `provider = ''`。
  **读面回映射**（2026-10-09 alias 批）：明细行 `model` ∥ 报表 `byModel`/`trendByModel` 维值 ∥ 成员月表 —— 配别名 ⇒ 显示别名（改别名 ⇒ 当即随动——无历史；映射单源 = `thincoder-server/src/gateway/providers.mjs` 别名索引）。
  **数据源分面**：明细 ∥ 导出 = `usage`（真源——毫秒精度零改）∥ 报表两面（`summary`——管理面 ∥ 本人面）/totals/key 窗/成员月累计 = 预聚合日表 `usage_daily`（本地日粒度——窗沿取整含端日；API 形零变）；**key 窗 ∥ 报表缺省窗 = 近 30 个本地日（今日起回溯——同构；`KEY_USAGE_WINDOW_DAYS` ∥ `USAGE_SUMMARY_DAYS`；#1001③ 收正）**。）

**派发 ∥ 过滤两径不对称**（澄清——事实源 = `thincoder-server/src/metering/report.mjs:48-56`（过滤） ∥ `gateway/API.md:32-33`（派发））：派发 = 对外标识精确匹配、未命中 ⇒ **404 `model_not_found`**（配了别名只认别名）；过滤 = **逐值可达**——`model` 过滤值不校可达性（别名反查命中 ⇒ 真名对 ∥ 未命中 ⇒ 逐值对回落）——**过滤值不必是可达的派发名**：已配别名模型的 `provider/model` 名派发 404、过滤照经逐值对命中既有行；两径互不代偿。

## 4. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-3（功能点 3） | mock usage 回传 `{prompt_tokens, completion_tokens}` ⇒ `/api/usage` 返回该笔记录（成员 × 模型 × 时段 × token 四列齐 ∥ token 与上游回传**逐值相等**；存储 = `provider`/`model` 两字段——回拼无损） | 批内件 |
| AC-4（功能点 4） | 额度 = N ∥ 已用 ≥ N ⇒ 下一请求 **429 + `quota_exceeded` + 可读提示**；未超额 ⇒ 放行（200） | 批内件 |
| AC-13⑥（功能点 12——用量保留；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 窗内旧行删除（注入时钟：刚出窗的行删、窗内行留）∥ `null` ⇒ 零删 ∥ 启动清理 + 24h 周期接线（批内件直调 `pruneUsage` + 断言入口接线）∥ 查询面三端点回归零变 | 批内件 |
| AC-15②（功能点 15——用量看板升级；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 与 `/api/usage` **同源**（同一过滤面；数据源 = 预聚合日表——本地日粒度）：注入行集（日对齐窗）⇒ `summary.totals` 逐值 = 明细归并 ∥ trend 按日归并逐值 + 零填充全长 ∥ byModel（provider×model **两列聚合**——回拼展示）/byMember 降序逐值；CSV/明细 = 真源行集（列形 ∥ RFC 4180 转义 ∥ ISO ts ∥ 空单元格 ∥ BOM）；空集 ⇒ 空数组/totals 0/仅表头（零错）；`endpoint` 过滤（两合法值生效 ∥ 非法 400——五读端点同门）∥ `summary`/`export` 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ 实测：30 天窗四查合计 p50 ≈11ms @500k（原明细口径 ≈2.7–4.8s——同构探针；KD-SV-39） | 批内件 |
| AC-21（功能点 21——配额分模型；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 平台「每人每月默认用量」= settings `quotaTokens`（PATCH 保存即热生效 ∥ 非法 ⇒ 400 库与运行时零变）∥ ② 成员覆盖可设（`POST /api/members/:id/model-quotas` 键级合并 ∥ null 删键 ∥ 非法 400 ∥ 404）∥ ③ 三级序逐级生效（覆盖 > 平台 > 不限；短路 = 零 SQL——计数探针注入）∥ ④ 检查 = 仅 chat（派发命中后/转发前）∥ 窗口 = 自然月（服务器本地时区——月键 `'YYYY-MM'`；跨零点/跨月（含月初终结）键随行 `ts`、新月键零起）∥ 超限 ⇒ 429 `quota_exceeded`（message 含模型）且他模型不受累 ∥ ⑤ 嵌入零检查（旧总额检查已移除）∥ 旧总量字段退役（旧列不在 schema ∥ 旧端点 404）（判据全文 = `webui/WEBUI.md` §6 AC-21 行 + `gateway/API.md` §5 AC-21 行） | 批内件 |
| AC-23（功能点 23①——逐行已用数据面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | `monthlyCountersByMember`：逐值 = 注入记账归并（自然月键——与配额检查同源同窗）∥ 外标回拼无损（`model` 带斜杠 ∥ 嵌入行单段）∥ `memberId` 给定（唯一键前缀）与全员装配逐值相等 ∥ 控制面字段形 = `webui/WEBUI.md` §6 AC-23 行 | 批内件 |
| AC-22（功能点 22——模型标识分字段；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ① 记账 ∥ 计数行备 `provider`/`model` 两字段（回拼无损——含 `model` 带斜杠 ∥ 嵌入 `provider = ''`）∥ ② 统计聚合 = 列直操作（provider ∥ model ∥ 两者——`summary.byModel` 两列聚合；无字符串切分）∥ ③ 迁移拆分回填抽样比对（与旧复合值首斜杠拆逐值相等）∥ 对外契约不变（API/展示斜杠形——回拼） | 批内件 |
| AC-15⑥（功能点 15——key 明细数据面；已落需求档） | `keyUsageStats`：`lastUsedAt` = `MAX(ts)`（key_id 归因——读 `usage`） ∥ `windowTokens` = 近 30 个本地日（今日起回溯——与报表窗同构；读 `usage_daily`；`KEY_USAGE_WINDOW_DAYS`——#1001③ 收正）——逐值 = 注入 usage 行推导；从未使用 ⇒ `null`/0；`/api/me` 与 `/api/members` key 行同形（单源 = `memberView`） | 批内件 |
| AC-26（功能点 26——我的用量页图表化） | `GET /api/me/usage/summary`：① 判权 = 本人（无会话 ⇒ 401；user ∥ admin 会话 ⇒ 200 且恒本人——双成员注入 ⇒ 响应只含本人值）∥ ② 逐值/零填充（totals 四字段 = 明细归并（日对齐窗）——prompt/completion/total 各自相等 ∥ trend 按日零填充全长 ∥ 两维序逐（维值 × 日）零填充（缺日 = 0） ∥ byModel 降序）∥ ③ 过滤器同门（model ∥ endpoint ∥ from/to 生效；非法 endpoint ⇒ 400——五读端点同门）∥ ④ 空集 ⇒ totals 全 0 + trend 全零全长 + 两维序/排行空数组（零错）∥ ⑤ admin 端点零动（`/api/usage/summary` 响应形与既有件回归零改） | 批内件 |
| AC-29④（功能点 29——成员面随动；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 配额/禁用键 = 对外标识（配别名模型 ⇒ 别名形写入；键形校验 = 非空 ∥ 无首尾空白 ∥ 含斜杠时两段非空（裸名 = 别名形合法——#1008））∥ 记账对外标识 = 别名（读面回映射：`/api/usage` 行 `model` ∥ 导出 ∥ summary/totals 维值 ∥ `/api/me/usage/summary` 两维序 ∥ `memberView.modelUsage`——逐值 = 别名；内部两字段真名零改）∥ `model` 过滤 = 对外标识（别名先解析）∥ 改别名/清别名 ⇒ 读面当即随动（旧形键 = 离表键保留、不生效——无历史/迁移）；用例 = §7 N34/B26/E23 | 批内件 + 收口轮 |

## 5. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/metering/usage.mjs`（已落盘） | **147 ⇒ ≈230**（2026-10-06 实读）**⇒ 实读 278 ⇒ ≈255**（本批：记账三写 +≈18 ∥ 拆列/回拼 +≈9 ∥ `model` 过滤两字段 +≈10 ∥ 报表读族迁出 −≈60）⇒ **实读 170（2026-10-07——实施后回填轮复读；对估 ≈255 差 85——前账估差随小计实读收口）⇒ ≈182**（2026-10-09 alias 批：明细行回映射（两字段选择 + 映射助手接入）+≈12——实读待回填） | 记账（单写点） ∥ 明细查询 ∥ 导出 ∥ 过滤构建 ∥ 保留清理 ∥ 时间助手 |
| `thincoder-server/src/metering/aggregates.mjs`（已落盘） | **≈150**（设计估）**⇒ 实读 141 ⇒ ≈160 ⇒ 实读 173（2026-10-07）**（配额 v2 批落地：`monthlyCountersByMember`（月表读两形） ∥ `--fix` 事务合围重排；+32——越估 13）**⇒ ≈183**（2026-10-09 alias 批：月表回映射（外标回拼换形）+≈10——实读待回填） | 派生两表写（`usage_daily` ∥ `quota_counters` upsert） ∥ 计数点查 ∥ 成员月表读 ∥ 对账重算 ∥ 派生清理 |
| `thincoder-server/src/metering/report.mjs`（已落盘） | **≈105**（设计估——自 usage.mjs 迁出）**⇒ 实读 169 ⇒ ≈170 ⇒ 实读 168（2026-10-07）⇒ ≈223（me 用量图表化批：`memberUsageSummary` 新增 +≈55——调 `usageSummary({ memberId })` + 独立拆 totals 查询 + 两维序；admin 读函数/响应组装零触）⇒ 实读 226（2026-10-07——本批落地后；估 ≈223——越估 3）**（配额 v2 批落地：key 窗沿同构收正——#1001③；死常量 `DAY_MS` 随删）**⇒ ≈252**（2026-10-09 alias 批：`byModel`/`trendByModel` 回映射（映射后排序）+ 过滤别名反查 +≈26——实读待回填） | 汇表面读（summary ∥ totals ∥ key 窗 ∥ 成员月累计——读 `usage_daily`） |
| `thincoder-server/src/metering/quota.mjs`（已落盘） | **27 ⇒ ≈55**（本批 +≈28 = 三级解析 ∥ 覆盖 map 读 ∥ 计数点查准入 ∥ 短路 ∥ 429 形（模型口径））⇒ **实读 40（2026-10-07——实施后回填轮复读；对估 ≈55 差 15——前账估差随小计实读收口）** | 配额准入（点查——非 SUM） ∥ 429 形 |
| `thincoder-server/src/metering/routes.mjs`（已落盘） | **59 ⇒ ≈120**（2026-10-06 实读）**⇒ 实读 111（2026-10-07 复读——含 quota 端点换形）⇒ ≈119**（me 用量图表化批：`/api/me/usage/summary` 路由 +≈8）⇒ 实读 117（2026-10-07——本批落地后；估 ≈119——低于估 2） | 用量查询 ∥ 配额设置端点（分模型覆盖） |
| **小计** | **≈260 ⇒ 218 ⇒ 233 ⇒ ≈377 ⇒ 实读 416 ⇒ ≈690**（配额分模型批：+2 新档（aggregates ≈150 ∥ report ≈105） ∥ 三档净 +≈19）**⇒ ≈710**（配额 v2 批：aggregates +≈19 ∥ report +≈1）**⇒ ≈773**（me 用量图表化批：report +≈55 ∥ routes +≈8——余档零动）⇒ **实读 726（2026-10-07——本批落地后；五档实读和；对链上 ≈773 差 47——累计估差收口）⇒ ≈774**（2026-10-09 alias 批：+≈48 = usage ≈182 ∥ aggregates ≈183 ∥ report ≈252——quota/routes 零动；实读待回填） | —— |

## 6. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-6 | **配额周期/单位口径 = 自然月（服务器本地时区）∥ token；时点 = 准入（不预估在途）**——机制（三级 ∥ 计数 ∥ 点查）= KD-SV-38 | 用户 09:30 裁（自然月）；单位 = token（与计量同口径，金额不涉）；准入不预估（本笔产出未知——单笔可越顶在案） | 预估/预扣（须 tokenizer——第三方依赖且测不准）· 金额额度（计费 = 不做项）· 限速式 RPM/TPM（归 C 面——KD-SV-35） |
| KD-SV-8 | **计量写入 = 请求终结后同事务三写**（`usage` 行 INSERT + `usage_daily`/`quota_counters` 两 upsert；WAL `synchronous=NORMAL`） | 单行/请求 + 团队量级；派生面同事务 = 零漂移（明细可重算——对账兜底）；写增负实测 p50 0.070ms（单 INSERT 对照 0.038ms——同构探针） | 每 chunk 增量写（无意义）· 异步批写（复杂度无收益）· 派生面异步回填（两写路径 = 漂移面）· 同档 fsync（延迟成本无对应收益） |
| KD-SV-22 | **用量保留 = 配置化保留窗（缺省 90 天）+ 删除式清理（启动 + 24h）**：`usageRetentionDays`（`null` = 不限；非法 ⇒ 拒启）；三表同窗同删（`usage` ∥ `usage_daily` ∥ `quota_counters`——§1）；启动 + 周期 = 无外部调度依赖 | 表只增不减 = 无界增长面（实核）；90 天 = 配额月 + 季回看；删除式 = 零归档复杂度；启动 + 周期 = 无外部调度依赖 | 全量不做（无界——现状被点名）· 归档表（保留窗的替代面——复杂度过大）· 按行数限（语义不如时间窗）· 外部 cron 清理（部署面两套——进程内周期足）；明细导出（CSV）= 另条（KD-SV-27——非归档语义） |
| KD-SV-27 | **用量报表 = 服务端聚合与导出**：趋势/聚合/排行 = 服务端 SQL（`/api/usage/summary` 单端点一次装配；缺省窗 30 天；数据源 = 预聚合日表——KD-SV-39）；导出 = 服务端 CSV（`/api/usage/export`——机器表头英文 ∥ ISO ts ∥ RFC 4180 ∥ BOM）；导出与明细**同源**（同一过滤面——真源 `usage`） | 前端算被否：明细行分页上限 500 撑不起趋势/聚合（多跳拉全量违分页纪律 ∥ 口径易漂）；CSV 服务端生成 = 全量导出一跳 + 转义单源；图表口（趋势）需零填充窗口——服务端产全序列（前端只画） | 前端拉行前端归并（上限 500 ∥ N+1 跳）· JSON 导出另设（`/api/usage` 即 JSON 面——重复）· 导出走前端 blob 组装（转义/文件头两端维护）· 图表库（违零依赖——`webui/WEBUI.md` §7） |
| KD-SV-38 | **配额分模型 = 三级（成员×模型覆盖 ⇒ 平台默认 ⇒ 不限）+ 计数固定字段点查准入**：覆盖 = `members.model_quotas_json`（JSON map——随鉴权行零查询）∥ 平台 = settings `quotaTokens`（运行时快照——零查询）∥ 检查 = `quota_counters` 点查（O(1)）∥ 三级全无 ⇒ 零 SQL 短路 ∥ 检查点 = 派发命中后/转发前（仅 chat） ∥ 计数 = 记账同事务（§1） ∥ 对账 = `usage reconcile` | 用户 09:28/09:30/09:31/09:34 直令 + 性能硬点（#991→#992）；实测：点查 p50 0.004ms（目标 p95 ≤0.05ms——余量 10×+） | 每请求 SUM（21.4ms/请求 @500k——#991；且旧实现「不限」成员亦白付——现状缺陷已收正）· 覆盖索引（0.14ms 但随明细行数线性涨——降对账面候选，读数在案）· 日表当检查源（O(天数)——非固定字段）· 缓存/批量（读数已达标——无收益）· 成员覆盖存新表（键查 + 列表 N+1 面；JSON 列随鉴权行零查询——settings 先例同形） |
| KD-SV-39 | **汇表面（报表/成员页/汇总）= 预聚合日表 `usage_daily`**（#990 并入本批——用户 09:39/09:40 批）：粒度 = 日 × 成员 × key × provider × model × endpoint；写 = 记账同事务 upsert（§1）；读 = summary/totals/key 窗/成员月累计（明细/导出/审计零动——真源）；迁移回填 + `usage reconcile` 对账；**API 契约不变**（实现替换数据源——窗沿按本地日取整） | 实测（同构探针 @500k）：30 天窗四查合计 p50 **≈11ms**（原来 ≈2.7s 复测 ∥ #990 立案 4.8s）——≈250×；行数 = 组合数（与明细解耦）；写增负 ≈+0.03ms/请求 | 覆盖索引兜底（读数随明细线性涨——仅常数提速；判据 = 读侧增长速度）· 前端聚合（上限/口径漂移——KD-SV-27 在案）· 明细表当汇表面（4.8s/加载——#990 立案）· 缓存层（失效面 ∥ 重启冷） |
| KD-SV-50 | **本人用量报表 = 新端点 `GET /api/me/usage/summary`**（me 用量图表化批——用户 22:03 令）：契约 = §3；实现 = 复用 `usageSummary`（成员固定）+ 逐日维序两面（`trendByEndpoint` ∥ `trendByModel`——零填充逐维值 × 日）+ totals 携 prompt/completion 拆；**admin 端点/门零动**（`/api/usage/summary` 形与读面色零变） | 本人面要图表（用户 22:03）；与 admin 面同构（summary 与明细分端点——单职责 ∥ 前端两读同拍沿 admin 先例）；隔离面最小——既有端点断言零动 | 扩展 `/api/me/usage` 挂 `trend`/`totals`（明细面每次吞大报表体 ∥ 触既有响应形断言）· 放宽 `/api/usage/summary` 对 user 自服务（翻判权三态——AC-15② 在案）· 前端聚合（KD-SV-27 在案） |

## 7. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| B2 | 边界 | 流结束无 usage（上游忽略注入） | 照常透传；usage 行 `tokens=NULL` + `status='ok'`（记录不静默） |
| B4 | 边界 | 准入通过的单笔超长请求（产出越过额度线） | 本笔照常；**下一笔**被 429（已知边界——KD-SV-6） |
| E2 | 错误 | 超额成员请求（某模型） | 429 `quota_exceeded`（含模型外标 + 已用/额度）；他模型不受累 |
| N25 | 正常 | 注入时钟：窗界外一行 + 窗内一行 ⇒ `pruneUsage` | 界外删、窗内留；返回删除数 |
| B20 | 边界 | `usageRetentionDays: null` + `pruneUsage` | 零删（不限档） |
| B21 | 边界 | 启动（bin 接线——批内件断言） | 启动即清一次 + 24h 周期注册（常量） |
| N26 | 正常 | 注入行集（跨两日 ∥ 两模型 ∥ 两成员）⇒ `GET /api/usage/summary` | totals 逐值 = 明细归并；trend 按日零填充全序列；byModel/byMember 降序逐值 |
| N27 | 正常 | 同过滤 `GET /api/usage/export` | CSV：英文表头 ∥ 行数 = 过滤行数 ∥ 逗号/引号转义 ∥ ISO ts ∥ `attachment` 头 |
| B22 | 边界 | 空行集 ⇒ summary ∥ export | 空数组 + totals 0（零错）；CSV 仅表头 |
| B23 | 边界 | 行数 > `USAGE_EXPORT_MAX`（注入口径） | 400 `invalid_request_error`（收窄时段提示） |
| E21 | 错误 | `endpoint=audio`（非法值——五读端点） | 400 `invalid_request_error` |
| N28 | 正常 | 三级序：仅平台设 N ∥ 成员覆盖 N′ ∥ 都无 | 覆盖优先（N′） ⇒ 平台（N） ⇒ 不限放行（短路——零 SQL） |
| N29 | 正常 | 一次 chat 记账 + 一次嵌入记账 | 计数行逐值累加（chat 键 ∥ 嵌入键照计）；日表两键各 +1 |
| B24 | 边界 | 注入时钟跨月 ∥ 跨零点/月初终结请求（`ts` 在前日/前月、入账在后） | 新月份键零起（旧月行保留；旧键不读——月翻滚零逻辑）；终结行键随 `ts`（与回填同表达式）——对账零幻影行 |
| N30 | 正常 | `usage reconcile`：注入漂移（改一行计数） | 检出漂移行明细；`--fix` 覆写 ⇒ 复查零漂 |
| N31 | 正常 | 注入行集 ⇒ 30 天窗四查（日对齐） | 与明细日对齐归并逐值相等（summary/totals/排行）；trend 零填充全长 |
| N32 | 正常 | 注入行集（跨两日 ∥ 两模型 ∥ 两端点 ∥ 两成员）⇒ `GET /api/me/usage/summary`（成员 A 会话） | totals 四字段逐值 = A 明细归并；trend 按日零填充全长；两维序逐（维值 × 日）零填充；byModel 降序；B 的行零涉（本人固定） |
| N33 | 正常 | 同过滤参数 ⇒ `/api/me/usage/summary` ∥ `/api/me/usage` | 两读同源（同过滤器）：summary 逐值 = 明细日对齐归并（窗沿取整含端日——KD-SV-39 口径） |
| B25 | 边界 | 空行集 ⇒ `/api/me/usage/summary` | totals 全 0；trend 全零全长；trendByEndpoint/trendByModel/byModel = 空数组（零错） |
| E22 | 错误 | 无会话 ⇒ `GET /api/me/usage/summary` | 401 `unauthorized`（本人面端点判权——非 403） |
| N34 | 正常 | 注入：provider `mock` 模型 `mock-chat` 配别名 `fast`；两笔记账（请求名 = `fast`） ⇒ `/api/usage` ∥ `/api/usage/summary` ∥ `monthlyCountersByMember` ∥ `model=fast` 过滤 | 行 `model` = `fast`（别名回映射）∥ byModel 维值 = `fast` ∥ 月表键 = `fast` ∥ 过滤 `model=fast` 命中同一笔（真名对反查）；库内两字段仍 = `mock`/`mock-chat`（真名零改） |
| B26 | 边界 | 别名改后（`fast` ⇒ `quick`）读历史行（记账在 `fast` 期）∥ 过滤旧名 `fast` | 读面当即显示 `quick`（无历史/迁移）；过滤 `fast` 零命中（旧别名 = 离表键语义） |
| E23 | 错误 | 成员键写入：`{" mock/m": 1}`（首尾空白）∥ 键 = 裸名（别名形——合法） | 400（首尾空白——#1008 收正；库零变）∥ 裸名键照收（别名形——形状面单源） |

## 8. 本域边界（不做的面）

- 归档面不做（清理 = 删除式保留窗——§1；`null` 可关）∥ 阈值告警（80% 等——需求 §4 不做）∥ 金额/计费（对外计费 = 不做项）∥ token 预估/预扣（无 tokenizer——不做）。
- **明细导出 = 在**（CSV——§3；「导出」= 当前数据集下载，非归档语义——不涉保留窗）；JSON 导出不另设（`/api/usage` 即 JSON 面）∥ **汇表面 = 预聚合日表**（本批——#990；覆盖索引未采——§2.4）∥ 明细面毫秒精度不变（真源）∥ **我的用量页图表 = 在**（me 用量图表化批——本人过滤复用：`GET /api/me/usage/summary`；管理面专属面收窄 = 跨成员过滤/排行 ∥ CSV 导出 ∥ 管理看板页——`webui/WEBUI.md` §2.3⑦）；本人面导出不另设（本批判否）∥ 小时/周粒度未设（日/月两键为限）。
- 成员面读（逐模型已用）= 与配额同窗（自然月——§2.3）；报表/key 面 = 近 30 个本地日——两窗并存为设计（配额周期 = 自然月——KD-SV-6）；成员总额（`usedTokens`）含嵌入行（现口径保持）。
- 别名面不做（2026-10-09 alias 批——KD-SV-59）：记账/计数存储 = 真名两字段零改（对外标识 = 读面回映射）；别名历史/迁移不做（改别名 ⇒ 读面当即随动、旧形键 = 离表键保留）；CLI `usage reconcile` 读数 = 内部真名（运维面——非成员对外面）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——metering 域：记账 ∥ 配额 ∥ 查询与额度端点；KD-SV-6/8；用例 B2/B4/E2。
- 2026-10-06：实施后回填轮（fix）——§5 行数按实读回填（小计 ≈260 ⇒ 218）。
- 2026-10-06：小收尾轮（fix）——§1 补 `model` 列语义注（对外标识 `provider/model`——记账以对外标识记；上游余段不单独入账）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12⑥ ∥ 台账 #963）——§1 保留条重写（保留窗/删除式清理/查询零改）∥ §4 补 AC-13⑥ 候补行 ∥ §5 预算（usage 132 ⇒ ≈150；小计 ≈236）∥ §6 增 KD-SV-22 ∥ §7 增 N25 ∥ B20/B21 ∥ §8 边界随正。
- 2026-10-06：AC-13 行候补标记收正（父侧直接执行 · 机械 · 可 revert——已落需求档验收表）。
- 2026-10-06：实施后回填轮（R16——批 `docs/batches/2026-10-06-first-release-completeness.md`）：§1 补清理失败口径句（启动 fail-closed ∥ 周期 fail-open）∥ §5 usage 实读 **147**（小计 ⇒ **233**）。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 保留条随正（审计事件同窗同清）∥ §3 增用量报表两行（summary ∥ export CSV）+ `endpoint` 过滤（四读端点同门）∥ §4 补 AC-15②⑥ 候补行 ∥ §5 预算（usage ⇒ ≈230 ∥ routes ⇒ ≈120；小计 ⇒ ≈377）∥ §6 增 KD-SV-27 ∥ §7 增 N26/N27 ∥ B22/B23 ∥ E21 ∥ §8 边界随正（导出 = 在——非归档语义）。
- 2026-10-06：fix 轮（评审 #69——批 `docs/batches/2026-10-06-console-completeness-2.md` §3 十项，本档面）：§4 AC-15② 行补判权三态断言（`summary`/`export`：user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200——沿同批新端点口径）。
- 2026-10-07：配额分模型批设计轮（批 `docs/batches/2026-10-07-quota-per-model.md`——需求 §2:21 ∥ §2:22 ∥ 台账 #990/#991/#992）——§1 记账重写（同事务三写 ∥ 两字段 （`provider`/`model`）∥ 派生两表 ∥ 三表同窗清理 ∥ 查询面分面）∥ §2 重写为「分模型三级·计数准入」（三级 ∥ 检查点 ∥ 计数维护 ∥ 点查与短路（现状缺陷收正）∥ 性能目标与实测法 ∥ 对账命令∥覆盖索引降对账面候选）∥ §3 quota 端点换形（`model-quotas`）+ `model` 过滤两字段解析 + 数据源分面句 ∥ §4 AC-15② 重写 + AC-3/AC-15⑥ 随正 + 新增 AC-21/AC-22 行 ∥ §5 预算（+ `aggregates.mjs` ≈150 ∥ `report.mjs` ≈105；小计 ⇒ ≈690）∥ §6 KD-SV-6/8/22/27 随正 + 新增 KD-SV-38/39 ∥ §7 E2 随正 + N28–N31/B24 ∥ §8 边界随正（汇表面 = 日表；覆盖索引未采）；同源随动 = `store/STORE.md` §2/§3 ∥ `gateway/API.md` §2/§2.1/§3 ∥ `webui/WEBUI.md` §6。
- 2026-10-07：fix 轮（评审 #126——批 `docs/batches/2026-10-07-quota-per-model.md` §3 十项，本档面）：§1/§2.3 钉派生 upsert 键时基（`day`/`month` = 行 `ts` 同源——回填/对账同表达式）∥ §3 `model` 过滤补解析优先级（`endpoint = embeddings` 在场 ⇒ `provider = ''` 兜底）∥ §4 AC-21 行编号对齐（①–⑤）+ 自然月窗口断言点入行内 ∥ §7 B24 扩跨零点/月初终结断言。
- 2026-10-07：配额 v2 · 成员模型面批设计轮（批 `docs/batches/2026-10-07-quota-v2-member-models.md`——需求 §2:23 ∥ 台账 #1002/#1003/#1004 + 并入 #1001）——§2.3 增计数表读面两形（`monthlyCountersByMember`）∥ §2.5 `--fix` 事务合围（#1001①）∥ §3 窗注（key 窗∥报表同构——#1001③）∥ §4 AC-15⑥ 窗沿收正 + 增 AC-23 行 ∥ §5 两档实读回基 + 小计 ⇒ ≈710 ∥ §8 两窗并存句；同源随动 = `accounts/ACCOUNTS.md` §3 ∥ `webui/WEBUI.md` §2.4②。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-quota-v2-member-models.md` §3 六发现，本档面）：§4 AC-23 行「候补」标记收正（已落需求档——沿 AC-13/AC-14 先例）。
- 2026-10-07：me 用量图表化批设计轮（批 `docs/batches/2026-10-07-me-usage-charts.md`——用户 22:03 令 ∥ 台账 #1055）——§3 增 `GET /api/me/usage/summary` 行（契约全文）+ `GET /api/me/usage` 过滤面随正（`model`/`from`/`to` 补记）+ 五读端点同门口径 ∥ §4 增 AC-26 候补行 ∥ §5 预算（report ⇒ ≈225 ∥ routes ⇒ ≈120；小计 ⇒ ≈773）∥ §6 增 KD-SV-50 ∥ §7 增 N32/N33 ∥ B25 ∥ E22 ∥ §8 边界随正（本人面图表 = 在；管理面专属面收窄；本人面导出/小时粒度未设）；同源随动 = `webui/WEBUI.md` §2.3⑦/§6/§7/§8 ∥ `design/PROJECT.md` §4/§6/§7/§9。
- 2026-10-07：fix 轮（评审轮次 1——批 `docs/batches/2026-10-07-me-usage-charts.md` §3 八发现〔🟡1–3 ∥ 🔵4–8〕，本档面 = 🔵5/6/8）：§3 实现接缝钉死（调 `usageSummary({ memberId })` + 独立拆 totals 查询——§5 同拍归一；admin 端点/读函数/响应组装零触）∥ §4 AC-26② 补「（日对齐窗）」（与 AC-15② 同拍）∥ §5 `report` 算术平（**≈225 ⇒ ≈223**——168 + ≈55 之平；小计 ≈773 不动）。
- 2026-10-07：轮 2 残余小收正（主 agent 直接执行 · 可 revert——评审轮次 2 残余 ②）：§5 `routes` ⇒ ≈120 ⇒ **≈119**（111 + ≈8 之平）。
- 2026-10-07：实施后回填轮（me 用量图表化批——批 `docs/batches/2026-10-07-me-usage-charts.md`）：§5 四档实读收正（`report` **226**（估 ≈223——越估 3） ∥ `routes` **117**（估 ≈119——低于估 2） ∥ `usage` **170** ∥ `quota` **40**——后两行 = 前账欠项随拍，使小计可逐行核验）+ 小计按实读平账（**726**——对链上 ≈773 差 47，累计估差收口）；同源随动 = `webui/WEBUI.md` §5 ∥ `design/PROJECT.md` §6。
- 2026-10-09（**server-model-alias 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-model-alias.md` §2 · 台账 #1153 + 并入 #1008 ∥ #1152；需求 §2:29 + AC-29）：§1 行形条随正（两字段 = 内部真名；对外显示 = 别名回映射）∥ §2.1 覆盖键随别名随动句 ∥ §2.3 月表读回映射 ∥ §3 `model-quotas` 行键形（对外标识 + 首尾空白收正——#1008）+ 过滤面别名反查优先级 + 读面回映射句 ∥ §4 增 AC-29④ 行 ∥ §5 预算（usage ⇒ ≈182 ∥ aggregates ⇒ ≈183 ∥ report ⇒ ≈252；小计 ⇒ ≈774）∥ §7 增 N34/B26/E23 ∥ §8 增别名面不做句。**产品码零触（设计轮）**。
- 2026-10-10：清账轮簇Ⅱ server 面小收批（批 `docs/batches/2026-10-10-server-face-residues.md` · 台账 #1161 + 并入 #1162 ∥ #1169 ∥ #1170；2026-10-10 实施轮）：§3 增「派发 ∥ 过滤两径不对称」澄清句（#1162——派发 404 ∥ 过滤逐值可达；事实源 = `thincoder-server/src/metering/report.mjs:48-56` ∥ `gateway/API.md:32-33`）；同源随动 = `thincoder-server/src/metering/routes.mjs` 报文句（#1161 句族收正）。**机制零变**（澄清 ∥ 句面）。
- 2026-10-10（**server-exec-sandbox 批 · 残差对齐（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 残差项 ②；父侧裁定：收口前对齐）：§3 前言补写端点 JSON 门例外括注——**例外** = `POST /api/runner/checkpoint`（octet-stream——`gateway/API.md` §2.6）；与 `accounts/ACCOUNTS.md` §3 ∥ `client/CLIENT.md` §2 逐字同拍。**零新语义**（KD-SV-77 路由级豁免的残差对齐）。
- 2026-10-10（**runner-admin-console 批 · 设计档随正 · eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 · 台账 #1252）：§3 前言去端点 JSON 门例外括注（随执行面重定——`gateway/API.md` §2.6 退场）；与 `accounts/ACCOUNTS.md` §3 ∥ `client/CLIENT.md` §2 逐字同拍。**零新语义**。
