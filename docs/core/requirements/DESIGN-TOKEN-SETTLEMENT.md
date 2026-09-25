# 设计评审凭证结算（DESIGN-TOKEN-SETTLEMENT）· 需求

> 板块 = **设计评审凭证结算**（settle 当场落盘 / 门禁读权威 / 废旧镜像）。
> 本档 = 该机制的**需求层权威**（F-D1–F-D6 / N-D1–N-D4 判定句）。
> 设计侧 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（实现坐标 / 双端与依赖方向——本档不重述，D2）。
> 关联面 = `ENG-TOKEN-BINDING.md`（凭证语义 / TTL——同层）· `docs/core/design/ENG-TOKEN-BINDING.md`。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 5**——`thincoder-vscode/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名需求档（`thincoder-cli/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> 逐节对账**零实质缺口**（R1–R4 ⇒ F-D1 / F-D4+F-D5 / N-D3 / N-D1 全覆），(d) 类入 §6.1。
> 实测口径 = **as-of 2026-09-15 实核**（坐标 = 仓根相对路径 + `:行`，逐条复核）。

## 1. 总体定位

async 设计评审通过后签发的 token / designId 必须在**挂起会话、同进程后续回合、进程重启 resume** 后可靠到达 spawn eng-coder 的校验门——
settle 即落盘权威台账；凭证值只进槽文件（会话态），永不进文档。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| **F-D1** | **settle 当场落盘（结算可靠）**：settle = 唯一结算点——同步写槽文件权威台账；写失败 = settle 失败（可重评，不静默吞错）；内存 Map 降级为当前进程缓存（每次 run 从权威水合）。证据 = `thincoder-vscode/src/agent-tools/advisor-async.mjs:363-392` | settle 后：① 同进程后续回合 spawn 通过；② 挂起会话 digest 回合 spawn 通过；③ 重启 resume 后 spawn 通过——均不再 `designId not found`。用例 = `thincoder-vscode/test/eng-settlement.test.mjs`（D1 组） | 不做 fire-and-forget 落盘；token 值不落文档（N-D1） |
| **F-D2** | **门禁读权威（miss 回读）**：spawn 门读内存 Map，miss 回读槽权威台账（reconcile）；TTL 过期永不授权（fail-closed）；not found 机械拒（错误串含在持 id 概览）。证据 = `thincoder-vscode/src/agent-tools/subagent-spawn-gate.mjs:40-58`（W12/W13 已迁核收口——现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:112` `resolveDesignSlot`；原端侧档已删） · `:71-82` | 内存 miss + 槽有 → 通过（回读生效）；槽空 → 拒（not-found）；过期 → 清理 + 拒。用例 = 同上（D4 组） | 不改门禁拒值文案语义；不给过期项授权通道 （迁移期引文） |
| **F-D3** | **写侧不误清 / 不覆盖**：空态保存不把 settle 已落盘值钉 null；保存 = union 合并（同 key 以新 mint 者胜——expiresAt 比较；槽独有项保留）。证据 = `thincoder-vscode/src/extension/session-slot-write.mjs:153-166` · `thincoder-vscode/src/extension/panel-session.mjs:110-113` | 空态 save → 槽值保留；忙时非全量 save → 槽独有项不丢；同 key → 后 mint 胜（双向）；不可证新者不覆盖槽。用例 = 同上（D2 / D6 组） | 空态不当清空指令；consume / TTL / new 之外的清理不做（union 不复活 consume 已清项） |
| **F-D4** | **废单值镜像**：`_engDesignToken` 单值镜像退役——settle 不写 / 水合不恢复 / consume·TTL·new 不清；唯一一次性迁移读（槽有残留且 Map 空）。证据 = `thincoder-vscode/src/agent/agent-state.mjs:43-46` · `:102-104` · `thincoder-vscode/src/agent/run-helpers.mjs:222-242` | 运行时零镜像读写（迁移读点单处）；写门 / 门禁不再读镜像。用例 = 同上（镜像面） | 不恢复镜像双真相；历史文档提及保留（形态面另论） |
| **F-D5** | **写门资格 = 任一活槽**：工程模式父侧写产品代码前判定 = 任一未过期格式有效 token 存在（内存 Map 或槽回读）——fail-closed。证据 = `thincoder-vscode/src/agent/tool-gates.mjs:29-53` | 有任一活槽 → 放行；无 → 拦（错误串指向 advisor 设计评审路径）；畸形 / 过期不构成活槽。用例 = 同上 + `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 验收面 | 不做单值判据（镜像已废）；不放宽畸形 token |
| **F-D6** | **链终消费**：`consume-design` 动作清槽（单 designId / 无 id 清整账本）；消费后同 id spawn 机械拒。证据 = `thincoder-vscode/src/agent-tools/subagent-spawn-gate.mjs:139-170`（W12/W13 已迁核收口——现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:152` `executeConsumeDesignAction`；原端侧档已删） · `thincoder-vscode/src/agent/tool-gates.mjs:117-126` | consume 后同 id spawn → 拒（机械）；单设计会话无 id → 整账本清。用例 = 同上（D2 ① 组） | 不清兄弟 designId（单键清）；consume 不并入 control 豁免（planMode 拒绝——与 cancel 不同门） （迁移期引文） |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| **N-D1** | 凭证不落文档 | token / designId 值只进槽文件（会话态）——设计 / 需求 / 批次档零值 | 设计侧验收巡检；文档面 grep 零凭证值 |
| **N-D2** | 跨进程存活 | 槽文件 = 权威台账（持久）；进程重启 resume 后可结算 | 用例 = `thincoder-vscode/test/eng-settlement.test.mjs`（重启面 / 挂起会话 digest） |
| **N-D3** | 双端同源 | 与对端同机制语义（settle 即落盘 / 废镜像 / 凭证纪律）；各端独立实现 | 本档 §4 端差登记（已登记差异 = 载体一项） |
| **N-D4** | 可机判 | 用例在册且 `npm test` 全绿 | `thincoder-vscode/test/eng-settlement.test.mjs`（D1 / D4 / D2 / D6 组） |

## 4. 端差登记（多实现面——语义同源、各端原文自持；登记面 = 已裁的保留项；端差默认 = 消；保留仅限结构性不对称 + 证据 + 显式裁定）

- 语义对位（对端 = `thincoder-cli/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md` §2，**已并入本档**——2026-09-15 CLI 尾部真批）：结算可靠（不再 `designId not found`）· 废单值镜像 · 凭证不落文档——逐条同源。
- 端差（本端实况 · 保留三件齐）：**结算载体** = 会话槽 `engDesignTokens` 多槽表（`thincoder-vscode/src/extension/session-slot-write.mjs:100-166`——对端 = persistState 单源面）；本端断点修复面（快照 / 写侧清零 / 落盘时序）= 本端实现史实，语义结果两端一致（settle 即落盘）。
  - **① 结构性不对称**：VSC 宿主基线不同——agent 对象**每 run 重建**（`thincoder-vscode/src/agent/setup.mjs`——非 CLI 常驻单对象）⇒ 结算面多出「死对象 / 快照 / 清零」三类 VSC 独有断点域；载体随端壳存储面走（CLI 无对应面，不引入）。
  - **② 证据**：设计档 §6.2 / §6.3 + 源码注释逐字登记（`thincoder-core/token-ttl.mjs:181-186`）+ 端 `test/eng-settlement.test.mjs` 14 例。
  - **③ 显式裁定**：设计档 §6.2「已知有意差异（非偏差）」声明（B 式迁移轮 2026-09-15 实核并入）。

## 5. 范围边界（不做）

- 不做 fire-and-forget 落盘（去 fire-and-forget 后 settle 同步写 = 唯一结算点）。
- 不恢复单值镜像双真相；不给过期 token 授权通道。
- 凭证值不进任何文档（设计 / 需求 / 批次档——N-D1）。

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）」 | 建档语境（旧树指针形态） | 批次语境——现行归属由基准层文档体系承载 |
| 旧档头注「实测口径 as-of 2026-09-12」 | 时点口径行 | 时点材料——本档口径行刷新为 2026-09-15 实核 |
| 旧档 §5 变更记录（2026-09-12 建档行） | 建档流水 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md`（2026-09-15 CLI 尾部真批对账并入——零新增文本）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注（板块行 + 状态行「已实现」+ 来源注「2026-09-10 自设计档抽取——需求层拆分批」） | 时点状态 / 批次语境 | 现行态已入 §1–§3 |
| 旧档 §2 R2 括注「（用户选 B）」 | 用户裁定语境 | 裁定结论已入 F-D4 / F-D5（废镜像 + 任一活槽）；「选 B」的选型语境留旧档参照 |

### 6.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档 §4「对位 = `DESIGN-TOKEN-SETTLEMENT（CLI 仓·需求）§2`」指针 | 对端正文参照 | 对端档**已并入本档**（2026-09-15 CLI 尾部真批——§4 对位句已更新） |
| CLI 侧同名需求档（`thincoder-cli/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md`） | CLI 产品需求正文 | **已并入（2026-09-15 CLI 尾部真批）**——零实质缺口，(d) 类入 §6.1 |

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md` 逐节对账——**零实质缺口**
  （R1 ⇒ F-D1 · R2 ⇒ F-D4 + F-D5 · R3 ⇒ N-D3 · R4 ⇒ N-D1），零新增正文；§4 对位句与 §6.2 两行销项（对端档已并）；(d) 类入 §6.1。
  旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 5**）：建档——`thincoder-vscode/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标全量改写为仓根相对路径并逐条实核（settle 落盘块起点：旧档记 364 行 → 现状 363 行起块，按现状收正）。
