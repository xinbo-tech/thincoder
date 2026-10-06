# Thincoder Server · 计量（metering/METERING）

> 板块 = server ∥ 本档 = metering 域（记账 ∥ 配额 ∥ 查询）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 需求单源 = `docs/server/requirements/PROJECT.md`（功能点 3 ∥ 4）；本域回指 = `PROJECT.md` §7（AC-3 ∥ AC-4 判据 = 本档 §4）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构）。

## 1. 记账（usage）

- 落库 = **请求终结后单条 INSERT**（请求结束 ∥ 流终结 ∥ 客户端断开时）——KD-SV-8（§6）；表结构 = `store/STORE.md` §2。
- 行形 = 一行/请求：成员 × 模型 × 时段（`ts`） × token（三列 + 状态/端点/流式标记/耗时）；token 三列 = **上游 usage 原值**（逐值不加工——AC-3 判据单源）；上游未回 ⇒ 三列 NULL（status 照记实况）。
- `model` 列 = **对外标识**（`provider/model` 前缀形——记账以对外标识记；上游余段不单独入账）。
- 提取来源 = gateway 侧 tap 扫描（`gateway/API.md` §2.1）。
- 保留 = **保留窗（配置化——`usageRetentionDays`，`ops/OPS.md` §1）**：缺省 90 天（论证 = 配额周期 = 月 ⇒ 跨月可见必需；统计回看惯例 = 一季 ⇒ 90 天覆盖；表只增不减 = 无界增长面 ⇒ 缺省窗收口）；`null` = 不限（保留全量——显式开）；非正整数 ⇒ 拒启。
- 清理 = **删除式**（`pruneUsage`——`thincoder-server/src/metering/usage.mjs`）：`DELETE FROM usage WHERE ts < now - 窗`（走 `idx_usage_ts`——`store/STORE.md` §2）；时机 = **启动一次 + 每 24h**（实现常量；入口接线 = `thincoder-server/bin/thincoder-server.mjs`）；无归档面（§8）。
- **审计事件同窗同清**：`audit_events`（v3）清理复用本保留窗与调度点（启动一次 + 24h——`accounts/ACCOUNTS.md` §2.1；保留治理单旋钮）。
- **清理失败口径 = 启动 fail-closed ∥ 周期 fail-open**：启动一次（抛 ⇒ `startup_failed` + 退出码 1） ∥ 周期（`usage_prune_failed` warn 续跑）。
- **查询面口径**：保留窗不涉查询契约（窗外行自然不在结果——`from` 早于窗界亦同；非错）；端点面随本批（报表两端点——§3）。

## 2. 配额（成员月度 token 累计·准入）

- 额度单位/周期 = token ∥ 自然月（服务器本地时区）∥ 时点 = 准入（读已记账累计，不预估在途）；超额 ⇒ 429 `quota_exceeded`（message 含已用/额度）——KD-SV-6（§6）。
- 成员月累计 = `SUM(total_tokens)`（窗口 = 当月、NULL 不计）；额度字段 = `members.quota_tokens`（null = 不限——`store/STORE.md` §2）。
- 已知边界：单笔可越顶（准入不知本笔产出——同「不估 token」取舍）。

## 3. 查询与额度端点（本域）

（错误形 = `gateway/API.md` §3；写端点仅收 `application/json`；同族其余端点 = `accounts/ACCOUNTS.md` §3）

| 方法 + 路径 | 鉴权/角色 | 语义 |
|---|---|---|
| `GET /api/me/usage` | 会话 | 本人用量明细（成员固定 = 本人；列同下；过滤：`endpoint`） |
| `GET /api/usage` | admin | 全队用量明细（过滤：member ∥ model ∥ endpoint ∥ from ∥ to ∥ limit——缺省 100 ∥ 上限 500）；返回 `{ "rows": [ { "id", "ts", "member", "keyHint", "endpoint", "model", "status", "stream", "promptTokens", "completionTokens", "totalTokens", "durationMs" } ] }`（`ts` 原样 unix ms——页面本地化显示） |
| `GET /api/usage/summary` | admin | 用量报表读数（功能点 15②）：过滤面同上；时段缺省 = **近 30 天**（`USAGE_SUMMARY_DAYS`）；返回 `{ totals: { requests, totalTokens }, trend: [{ day, requests, totalTokens }], byModel: [{ model, requests, totalTokens }], byMember: [{ member, requests, totalTokens }] }`——trend = 按日（服务器本地日界）**零填充**全序列；byModel/byMember = 降序聚合（聚合与排行同数据面——降序即排行） |
| `GET /api/usage/export` | admin | 同过滤面 ⇒ **CSV 下载**（`text/csv; charset=utf-8` ∥ `Content-Disposition: attachment; filename="usage.csv"`）：列 = `ts,member,key_hint,endpoint,model,status,stream,prompt_tokens,completion_tokens,total_tokens,duration_ms`（表头英文——机器面）；`ts` = ISO 8601（UTC）∥ `stream` = 1/0 ∥ NULL token = 空单元格；RFC 4180 引号规则 + 行尾 CRLF + UTF-8 BOM（Excel 中文兼容）；行数上限 `USAGE_EXPORT_MAX = 100000`（超 ⇒ 400「收窄时段」；常量注入口径） |
| `POST /api/members/:id/quota` | admin | 设额度：`{quotaTokens: N|null}`（null = 不限） |

（过滤参数 `endpoint` ∈ `chat` ∥ `embeddings`（缺省 = 不过滤；非法值 ⇒ 400 `invalid_request_error`）——四读端点同门（两明细 ∥ summary ∥ export）；聚合/导出与明细**同源**——同一 WHERE 构建器，过滤语义逐值一致。）

## 4. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-3（功能点 3） | mock usage 回传 `{prompt_tokens, completion_tokens}` ⇒ `/api/usage` 返回该笔记录（成员 × 模型 × 时段 × token 四列齐 ∥ token 与上游回传**逐值相等**） | 批内件 |
| AC-4（功能点 4） | 额度 = N ∥ 已用 ≥ N ⇒ 下一请求 **429 + `quota_exceeded` + 可读提示**；未超额 ⇒ 放行（200） | 批内件 |
| AC-13⑥（功能点 12——用量保留；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 窗内旧行删除（注入时钟：刚出窗的行删、窗内行留）∥ `null` ⇒ 零删 ∥ 启动清理 + 24h 周期接线（批内件直调 `pruneUsage` + 断言入口接线）∥ 查询面三端点回归零变 | 批内件 |
| AC-15②（功能点 15——用量看板升级；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 与 `/api/usage` **同源**（同一过滤构建器）：注入行集 ⇒ `summary.totals` 逐值 = 明细归并 ∥ trend 按日归并逐值 + 零填充全长 ∥ byModel/byMember 降序逐值；CSV = 同过滤行集（列形 ∥ RFC 4180 转义 ∥ ISO ts ∥ 空单元格 ∥ BOM）；空集 ⇒ 空数组/totals 0/仅表头（零错）；`endpoint` 过滤（两合法值生效 ∥ 非法 400——四读端点同门）∥ `summary`/`export` 判权三态（user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200） | 批内件 |
| AC-15⑥（功能点 15——key 明细数据面；已落需求档） | `keyUsageStats`：`lastUsedAt` = `MAX(ts)`（key_id 归因）∥ `windowTokens` = 近 30 天 `SUM(total_tokens)`（`KEY_USAGE_WINDOW_DAYS`）——逐值 = 注入 usage 行推导；从未使用 ⇒ `null`/0；`/api/me` 与 `/api/members` key 行同形（单源 = `memberView`） | 批内件 |

## 5. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/metering/usage.mjs`（已落盘） | **147 ⇒ ≈230**（实读 2026-10-06——本批 +≈83 = endpoint 过滤 ∥ 共用 WHERE 构建 ∥ `usageTotals`/`usageSummary`（趋势零填充 ∥ 聚合） ∥ `keyUsageStats` ∥ 导出查询上限） | 行落库 ∥ 明细查询 ∥ 成员月累计 ∥ 保留窗清理 |
| `thincoder-server/src/metering/quota.mjs`（已落盘） | **27**（实读 2026-10-06——设计估 ≈50） | 月度累计查询 ∥ 准入判定 ∥ 429 形 |
| `thincoder-server/src/metering/routes.mjs`（已落盘） | **59 ⇒ ≈120**（实读 2026-10-06——本批 +≈61 = summary 路由 ∥ export 路由 + CSV 序列化 ∥ endpoint 参数接线） | 用量查询 ∥ 配额设置端点（三端点 ⇒ 五端点） |
| **小计** | **≈260 ⇒ 218 ⇒ 233 ⇒ ≈377**（#963 实读：+15；本批 +≈144） | —— |

## 6. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-6 | **配额 = 成员月度 token 累计 ∥ 准入检查**（超额 ⇒ 429 + `quota_exceeded` + 已用/额度可读提示） | 额度单位/周期 = 本设计定形（需求未点名）：单位 = token（与计量同口径）∥ 周期 = 自然月（服务器本地时区）∥ 时点 = 准入（读已记账累计，不预估在途）。已知边界：单笔可越顶（同「不估 token」取舍） | 预估/预扣（须 tokenizer——第三方依赖且测不准）· 金额额度（计费 = 不做项）· 限速式 RPM/TPM（未在功能点内——§8 边界） |
| KD-SV-8 | **计量写入 = 请求终结后单条 INSERT**（WAL `synchronous=NORMAL`） | 单行/请求 + 团队量级 ⇒ 无需外置 WAL/fsync 管道（掉电丢尾部若干行的档位差登记） | 每 chunk 增量写（无意义）· 异步批写（复杂度无收益）· 同档 fsync（延迟成本无对应收益） |
| KD-SV-22 | **用量保留 = 配置化保留窗（缺省 90 天）+ 删除式清理（启动 + 24h）**：`usageRetentionDays`（`null` = 不限；非法 ⇒ 拒启）；`DELETE FROM usage WHERE ts < 界`（索引直删） | 表只增不减 = 无界增长面（实核）；90 天 = 配额月 + 季回看；删除式 = 零归档复杂度；启动 + 周期 = 无外部调度依赖 | 全量不做（无界——现状被点名）· 归档表（保留窗的替代面——复杂度过大）· 按行数限（语义不如时间窗）· 外部 cron 清理（部署面两套——进程内周期足）；明细导出（CSV）= 另条（KD-SV-27——非归档语义） |
| KD-SV-27 | **用量报表 = 服务端聚合与导出**：趋势/聚合/排行 = 服务端 SQL（`/api/usage/summary` 单端点一次装配；缺省窗 30 天）；导出 = 服务端 CSV（`/api/usage/export`——机器表头英文 ∥ ISO ts ∥ RFC 4180 ∥ BOM）；聚合与导出与明细**同源**（同一过滤构建器） | 前端算被否：明细行分页上限 500 撑不起趋势/聚合（多跳拉全量违分页纪律 ∥ 口径易漂）；CSV 服务端生成 = 全量导出一跳 + 转义单源；图表口（趋势）需零填充窗口——服务端产全序列（前端只画） | 前端拉行前端归并（上限 500 ∥ N+1 跳）· JSON 导出另设（`/api/usage` 即 JSON 面——重复）· 导出走前端 blob 组装（转义/文件头两端维护）· 图表库（违零依赖——`webui/WEBUI.md` §7） |

## 7. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| B2 | 边界 | 流结束无 usage（上游忽略注入） | 照常透传；usage 行 `tokens=NULL` + `status='ok'`（记录不静默） |
| B4 | 边界 | 准入通过的单笔超长请求（产出越过额度线） | 本笔照常；**下一笔**被 429（已知边界——KD-SV-6） |
| E2 | 错误 | 超额成员请求 | 429 `quota_exceeded`（含已用/额度） |
| N25 | 正常 | 注入时钟：窗界外一行 + 窗内一行 ⇒ `pruneUsage` | 界外删、窗内留；返回删除数 |
| B20 | 边界 | `usageRetentionDays: null` + `pruneUsage` | 零删（不限档） |
| B21 | 边界 | 启动（bin 接线——批内件断言） | 启动即清一次 + 24h 周期注册（常量） |
| N26 | 正常 | 注入行集（跨两日 ∥ 两模型 ∥ 两成员）⇒ `GET /api/usage/summary` | totals 逐值 = 明细归并；trend 按日零填充全序列；byModel/byMember 降序逐值 |
| N27 | 正常 | 同过滤 `GET /api/usage/export` | CSV：英文表头 ∥ 行数 = 过滤行数 ∥ 逗号/引号转义 ∥ ISO ts ∥ `attachment` 头 |
| B22 | 边界 | 空行集 ⇒ summary ∥ export | 空数组 + totals 0（零错）；CSV 仅表头 |
| B23 | 边界 | 行数 > `USAGE_EXPORT_MAX`（注入口径） | 400 `invalid_request_error`（收窄时段提示） |
| E21 | 错误 | `endpoint=audio`（非法值——四读端点） | 400 `invalid_request_error` |

## 8. 本域边界（不做的面）

- 归档面不做（清理 = 删除式保留窗——§1；`null` 可关）∥ 阈值告警（80% 等——需求 §4 不做）∥ 金额/计费（对外计费 = 不做项）∥ token 预估/预扣（无 tokenizer——不做）。
- **明细导出 = 在**（CSV——§3；「导出」= 当前数据集下载，非归档语义——不涉保留窗）；JSON 导出不另设（`/api/usage` 即 JSON 面）∥ 报表缓存不做（实时 SQL——团队量级）∥ 我的用量页不做趋势/聚合（管理面专属——`webui/WEBUI.md` §2）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——metering 域：记账 ∥ 配额 ∥ 查询与额度端点；KD-SV-6/8；用例 B2/B4/E2。
- 2026-10-06：实施后回填轮（fix）——§5 行数按实读回填（小计 ≈260 ⇒ 218）。
- 2026-10-06：小收尾轮（fix）——§1 补 `model` 列语义注（对外标识 `provider/model`——记账以对外标识记；上游余段不单独入账）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12⑥ ∥ 台账 #963）——§1 保留条重写（保留窗/删除式清理/查询零改）∥ §4 补 AC-13⑥ 候补行 ∥ §5 预算（usage 132 ⇒ ≈150；小计 ≈236）∥ §6 增 KD-SV-22 ∥ §7 增 N25 ∥ B20/B21 ∥ §8 边界随正。
- 2026-10-06：AC-13 行候补标记收正（父侧直接执行 · 机械 · 可 revert——已落需求档验收表）。
- 2026-10-06：实施后回填轮（R16——批 `docs/batches/2026-10-06-first-release-completeness.md`）：§1 补清理失败口径句（启动 fail-closed ∥ 周期 fail-open）∥ §5 usage 实读 **147**（小计 ⇒ **233**）。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 保留条随正（审计事件同窗同清）∥ §3 增用量报表两行（summary ∥ export CSV）+ `endpoint` 过滤（四读端点同门）∥ §4 补 AC-15②⑥ 候补行 ∥ §5 预算（usage ⇒ ≈230 ∥ routes ⇒ ≈120；小计 ⇒ ≈377）∥ §6 增 KD-SV-27 ∥ §7 增 N26/N27 ∥ B22/B23 ∥ E21 ∥ §8 边界随正（导出 = 在——非归档语义）。
- 2026-10-06：fix 轮（评审 #69——批 `docs/batches/2026-10-06-console-completeness-2.md` §3 十项，本档面）：§4 AC-15② 行补判权三态断言（`summary`/`export`：user ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200——沿同批新端点口径）。
