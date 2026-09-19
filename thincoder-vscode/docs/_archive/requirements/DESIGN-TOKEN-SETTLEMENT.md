# DESIGN-TOKEN-SETTLEMENT（设计评审凭证结算）— 需求（VSC 仓）

> 板块：设计评审凭证结算（settle 当场落盘 / 门禁读权威 / 废旧镜像）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`DESIGN-TOKEN-SETTLEMENT（CLI 仓·需求）§2`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见 `DESIGN-TOKEN-SETTLEMENT（本仓·设计）`；关联面 = `ENG-TOKEN-BINDING（本仓·需求）`（凭证语义 / TTL）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

async 设计评审通过后签发的 token / designId 必须在**挂起会话、同进程后续回合、进程重启 resume** 后可靠到达 spawn eng-coder 的校验门——
settle 即落盘权威台账；凭证值只进槽文件（会话态），永不进文档。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-D1 | **settle 当场落盘（结算可靠）**：settle = 唯一结算点——同步写槽文件权威台账；写失败 = settle 失败（可重评，不静默吞错）；内存 Map 降级为当前进程缓存（每次 run 从权威水合）。证据 = `src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）:364-392` | settle 后：① 同进程后续回合 spawn 通过；② 挂起会话 digest 回合 spawn 通过；③ 重启 resume 后 spawn 通过——均不再 `designId not found`。用例 = `test/eng-settlement.test.mjs`（D1 组） | 不做 fire-and-forget 落盘（去 F2g）；token 值不落文档（N-D1） |
| F-D2 | **门禁读权威（miss 回读）**：spawn 门读内存 Map，miss 回读槽权威台账（reconcile）；TTL 过期永不授权（fail-closed）；not found 机械拒（错误串含在持 id 概览）。证据 = `src/agent-tools/subagent-spawn-gate.mjs（W12 已迁核——现体见批次档 §5）:37-58/70-82` | 内存 miss + 槽有 → 通过（回读生效）；槽空 → 拒（not-found）；过期 → 清理 + 拒。用例 = `test/eng-settlement.test.mjs`（D4 组） | 不改门禁拒值文案语义；不给过期项授权通道 |
| F-D3 | **写侧不误清 / 不覆盖**：空态保存不把 settle 已落盘值钉 null；保存 = union 合并（同 key 以新 mint 者胜——expiresAt 比较；槽独有项保留）。证据 = `src/extension/session-slot-write.mjs:161-166` · `src/extension/panel-session.mjs:107-113` | 空态 saveLines → 槽值保留；忙时非全量 save → 槽独有项不丢；同 key → 后 mint 胜（双向）；不可证新者不覆盖槽。用例 = `test/eng-settlement.test.mjs`（D2 / D6 组） | 空态不当清空指令；consume / TTL / new 之外的清理不做（union 不复活 consume 已清项） |
| F-D4 | **废单值镜像**：`_engDesignToken` 单值镜像退役——settle 不写 / 水合不恢复 / consume·TTL·new 不清；唯一一次性迁移读（槽有残留且 Map 空）。证据 = `src/agent/agent-state.mjs:43-46/102-104` · `src/agent/run-helpers.mjs:222-242` | 运行时零镜像读写（迁移读点单处）；写门 / 门禁不再读镜像。用例 = `test/eng-settlement.test.mjs`（镜像面） | 不恢复镜像双真相；历史文档提及保留（形态面另论） |
| F-D5 | **写门资格 = 任一活槽**：工程模式父侧写产品代码前判定 = 任一未过期格式有效 token 存在（内存 Map 或槽回读）——fail-closed。证据 = `src/agent/tool-gates.mjs:28-53` | 有任一活槽 → 放行；无 → 拦（错误串指向 advisor 设计评审路径）；畸形 / 过期不构成活槽。用例 = `test/eng-settlement.test.mjs` + `DESIGN-TOKEN-SETTLEMENT（本仓·设计）§5` AC4 | 不做单值判据（镜像已废）；不放宽畸形 token |
| F-D6 | **链终消费**：`consume-design` 动作清槽（单 designId / 无 id 清整账本）；消费后同 id spawn 机械拒。证据 = `src/agent-tools/subagent-spawn-gate.mjs（W12 已迁核——现体见批次档 §5）:139-145` · `src/agent/tool-gates.mjs:117-126` | consume 后同 id spawn → 拒（机械）；单设计会话无 id → 整账本清。用例 = `test/eng-settlement.test.mjs`（D2 ① 组） | 不清兄弟 designId（单键清）；consume 不并入 control 豁免（planMode 拒绝——与 cancel 不同门） |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-D1 | 凭证不落文档 | token / designId 值只进槽文件（会话态）——设计 / 需求 / 批次档零值 | `DESIGN-TOKEN-SETTLEMENT（本仓·设计）§5` AC5 巡检；文档面 grep 零凭证值 |
| N-D2 | 跨进程存活 | 槽文件 = 权威台账（持久）；进程重启 resume 后可结算 | 用例 = `test/eng-settlement.test.mjs`（重启面 / 挂起会话 digest） |
| N-D3 | 双端同源 | 与对端同机制语义（settle 即落盘 / 废镜像 / 凭证纪律）；各端独立实现 | 本档 §4 端差登记（已登记差异 = 零） |
| N-D4 | 可机判 | 用例 = `test/eng-settlement.test.mjs`（D1 / D4 / D2 / D6 组） | 快层全绿；档名在册 |

## 4. 对位与端差登记（对位 = `DESIGN-TOKEN-SETTLEMENT（CLI 仓·需求）§2`）

- 语义对位：R1（结算可靠 / 不再 `designId not found`）· R2（废单值镜像）· R4（凭证不落文档）逐条同源；R3「双端一起做」= 本档即本端自持面。
- 端差登记：本档登记面未见差异（语义同源）；结算载体各端自持（本端 = 会话槽 `engDesignTokens` 多槽表——`src/extension/session-slot-write.mjs:108-166`）。
- 本端断点修复面（快照 / 写侧清零 / 落盘时序）= 本端实现史实，语义结果两端一致（settle 即落盘）。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 B 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
