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
- 清理 = **删除式**（`pruneUsage`——`thincoder-server/src/metering/usage.mjs`）：`DELETE FROM usage WHERE ts < now - 窗`（走 `idx_usage_ts`——`store/STORE.md` §2）；时机 = **启动一次 + 每 24h**（实现常量；入口接线 = `thincoder-server/bin/thincoder-server.mjs`）；无归档/导出面（§8）。
- **查询面零改**：三端点契约不变；窗外的行自然不在结果（`from` 早于窗界亦同）——非错。

## 2. 配额（成员月度 token 累计·准入）

- 额度单位/周期 = token ∥ 自然月（服务器本地时区）∥ 时点 = 准入（读已记账累计，不预估在途）；超额 ⇒ 429 `quota_exceeded`（message 含已用/额度）——KD-SV-6（§6）。
- 成员月累计 = `SUM(total_tokens)`（窗口 = 当月、NULL 不计）；额度字段 = `members.quota_tokens`（null = 不限——`store/STORE.md` §2）。
- 已知边界：单笔可越顶（准入不知本笔产出——同「不估 token」取舍）。

## 3. 查询与额度端点（本域）

（错误形 = `gateway/API.md` §3；写端点仅收 `application/json`；同族其余端点 = `accounts/ACCOUNTS.md` §3）

| 方法 + 路径 | 鉴权/角色 | 语义 |
|---|---|---|
| `GET /api/me/usage` | 会话 | 本人用量明细（成员固定 = 本人；列同下） |
| `GET /api/usage` | admin | 全队用量明细（过滤：member ∥ model ∥ from ∥ to ∥ limit——缺省 100 ∥ 上限 500）；返回 `{ "rows": [ { "id", "ts", "member", "keyHint", "endpoint", "model", "status", "stream", "promptTokens", "completionTokens", "totalTokens", "durationMs" } ] }`（`ts` 原样 unix ms——页面本地化显示） |
| `POST /api/members/:id/quota` | admin | 设额度：`{quotaTokens: N|null}`（null = 不限） |

## 4. 验收判据（机检面）

| 需求 AC | 设计级判据 | 载体 |
|---|---|---|
| AC-3（功能点 3） | mock usage 回传 `{prompt_tokens, completion_tokens}` ⇒ `/api/usage` 返回该笔记录（成员 × 模型 × 时段 × token 四列齐 ∥ token 与上游回传**逐值相等**） | 批内件 |
| AC-4（功能点 4） | 额度 = N ∥ 已用 ≥ N ⇒ 下一请求 **429 + `quota_exceeded` + 可读提示**；未超额 ⇒ 放行（200） | 批内件 |
| AC-13⑥（功能点 12——用量保留；候补——需求档回笔 = 主 agent 笔） | 窗内旧行删除（注入时钟：刚出窗的行删、窗内行留）∥ `null` ⇒ 零删 ∥ 启动清理 + 24h 周期接线（批内件直调 `pruneUsage` + 断言入口接线）∥ 查询面三端点回归零变 | 批内件 |

## 5. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/metering/usage.mjs`（已落盘） | **132**（实读 2026-10-06——设计估 ≈130；本批预期 ≈150 = +18：`pruneUsage`（保留窗删除）） | 行落库 ∥ 明细查询 ∥ 成员月累计 ∥ 保留窗清理 |
| `thincoder-server/src/metering/quota.mjs`（已落盘） | **27**（实读 2026-10-06——设计估 ≈50） | 月度累计查询 ∥ 准入判定 ∥ 429 形 |
| `thincoder-server/src/metering/routes.mjs`（已落盘） | **59**（实读 2026-10-06——设计估 ≈80） | 用量查询 ∥ 配额设置端点（三端点） |
| **小计** | **≈260 ⇒ 218 ⇒ 本批预期 ≈236**（+18） | —— |

## 6. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-6 | **配额 = 成员月度 token 累计 ∥ 准入检查**（超额 ⇒ 429 + `quota_exceeded` + 已用/额度可读提示） | 额度单位/周期 = 本设计定形（需求未点名）：单位 = token（与计量同口径）∥ 周期 = 自然月（服务器本地时区）∥ 时点 = 准入（读已记账累计，不预估在途）。已知边界：单笔可越顶（同「不估 token」取舍） | 预估/预扣（须 tokenizer——第三方依赖且测不准）· 金额额度（计费 = 不做项）· 限速式 RPM/TPM（未在功能点内——§8 边界） |
| KD-SV-8 | **计量写入 = 请求终结后单条 INSERT**（WAL `synchronous=NORMAL`） | 单行/请求 + 团队量级 ⇒ 无需外置 WAL/fsync 管道（掉电丢尾部若干行的档位差登记） | 每 chunk 增量写（无意义）· 异步批写（复杂度无收益）· 同档 fsync（延迟成本无对应收益） |
| KD-SV-22 | **用量保留 = 配置化保留窗（缺省 90 天）+ 删除式清理（启动 + 24h）**：`usageRetentionDays`（`null` = 不限；非法 ⇒ 拒启）；`DELETE FROM usage WHERE ts < 界`（索引直删） | 表只增不减 = 无界增长面（实核）；90 天 = 配额月 + 季回看；删除式 = 零归档复杂度；启动 + 周期 = 无外部调度依赖 | 全量不做（无界——现状被点名）· 归档表/导出面（复杂度与需求不符——不做项）· 按行数限（语义不如时间窗）· 外部 cron 清理（部署面两套——进程内周期足） |

## 7. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| B2 | 边界 | 流结束无 usage（上游忽略注入） | 照常透传；usage 行 `tokens=NULL` + `status='ok'`（记录不静默） |
| B4 | 边界 | 准入通过的单笔超长请求（产出越过额度线） | 本笔照常；**下一笔**被 429（已知边界——KD-SV-6） |
| E2 | 错误 | 超额成员请求 | 429 `quota_exceeded`（含已用/额度） |
| N25 | 正常 | 注入时钟：窗界外一行 + 窗内一行 ⇒ `pruneUsage` | 界外删、窗内留；返回删除数 |
| B20 | 边界 | `usageRetentionDays: null` + `pruneUsage` | 零删（不限档） |
| B21 | 边界 | 启动（bin 接线——批内件断言） | 启动即清一次 + 24h 周期注册（常量） |

## 8. 本域边界（不做的面）

- 归档/导出面不做（清理 = 删除式保留窗——§1；`null` 可关）∥ 阈值告警（80% 等——需求 §4 不做）∥ 金额/计费（对外计费 = 不做项）∥ token 预估/预扣（无 tokenizer——不做）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——metering 域：记账 ∥ 配额 ∥ 查询与额度端点；KD-SV-6/8；用例 B2/B4/E2。
- 2026-10-06：实施后回填轮（fix）——§5 行数按实读回填（小计 ≈260 ⇒ 218）。
- 2026-10-06：小收尾轮（fix）——§1 补 `model` 列语义注（对外标识 `provider/model`——记账以对外标识记；上游余段不单独入账）。
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12⑥ ∥ 台账 #963）——§1 保留条重写（保留窗/删除式清理/查询零改）∥ §4 补 AC-13⑥ 候补行 ∥ §5 预算（usage 132 ⇒ ≈150；小计 ≈236）∥ §6 增 KD-SV-22 ∥ §7 增 N25 ∥ B20/B21 ∥ §8 边界随正。
