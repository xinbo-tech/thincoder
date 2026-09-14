# 设计评审凭证结算（DESIGN-TOKEN-SETTLEMENT）· 工程模式凭证链板块

> 板块 = **工程模式凭证链（结算面）**——评审通过后 token 的**结算 / 持久化 / 回读 / 消费**。
> 相邻权威 = `docs/core/design/ENG-TOKEN-BINDING.md`（token 生命周期语义：TTL / 格式 / 跨模式存活——本档**不重述**，D2）· `docs/core/design/CONSULTATION.md`（评审引擎）· `docs/core/design/SESSION.md`（会话槽文件与序列化）。
> 需求侧 = `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`（批 5 建档——源 = VSC 树需求档）；CLI 树需求档 `thincoder-cli/docs/requirements/DESIGN-TOKEN-SETTLEMENT.md` **未迁**（后续批）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/DESIGN-TOKEN-SETTLEMENT.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与问题

**结构性基线**：CLI 的 agent 对象是**进程常驻单对象**（跨回合 / 挂起复用）——因此 **无** VSC 端的死对象 bug、无挂起入场快照、无 onComplete 清零类似物。CLI 侧真实隐患两条：

1. **重启序列化窗口**：挂起期评审 settle 把 token 写**内存** Map，但磁盘槽停留在 settle 前的上次 `saveSession`（回合尾才存盘）。此刻进程被杀 / 崩溃 / OOM → 该 token **从未落盘** → 重启恢复读到旧槽 → token 丢。
   窗口 = settle 完成 → 下个回合尾 saveSession（正常几秒内；digest 未触发或用户强杀则拉长）。
2. **门禁读取分裂**：`dispatch` 写门读**单值镜像** `_engDesignToken`，`spawn` 门读多槽 Map——**两套真相**。

**现行设计（D1–D3）**：槽文件 = **权威结算台账**；settle 当场落盘；门禁 miss 回读槽；单值镜像退役。

## 2. D1 —— settle 当场同步落盘

- settle 是唯一结算点 ⇒ **settle 当场把 token 字段持久化到槽文件**（不等下个回合尾 `saveSession`）。
  - 落点：`thincoder-core/agent-tools/advisor-settle.mjs:152`（结算）→ `:163`（`persistEngTokens(agent)` 当场落盘）。
  - 落盘函数：`thincoder-core/token-ttl.mjs:233`（`persistEngTokens`）——复用 `engTokenSlotFields` 序列化 + session 安全写 / 轮转（`guardForeignSlotFile`，`thincoder-core/session-guard.mjs:26`——与 `saveSession` 同一份守卫，**勿裸写文件**）。
  - 内存 Map 仍为当前进程缓存（常驻、与槽一致）。
- **写失败语义**：settle 的槽写须同步 await——**失败即 settle 失败**（token 不注册、无 Approved 回显、可重评）：不静默吞错、不产生「内存有盘上无」态。回滚点：`advisor-settle.mjs:171`–`:172`（失败恢复 settle 前的 Map）。

## 3. D2 —— spawn 门禁读权威（miss 回读槽）

- 门禁先读内存 Map；**miss 时回读槽文件权威台账**（reconcile + 判定）——覆盖「进程重启后槽有但 Map 未及回填 / 缓存与槽不一致」。TTL 过滤保留。
- 落点：`thincoder-core/agent-tools/subagent-spawn.mjs:112`（`resolveDesignSlot`）· 回读函数 `thincoder-core/token-ttl.mjs:187`（`reconcileEngTokensFromSlot`）· 只读原语 `:164`（`readEngTokensFromSlot`）。

## 4. D3 —— 单值镜像退役 + dispatch 写门问活槽

- `_engDesignToken` 单值镜像**退役**：settle / restore / consume / TTL / `new` 一律不再维护它（**零写**）。
  - 序列化面只产多槽表：`thincoder-core/token-ttl.mjs:112`（`engTokenSlotFields`）。
  - agent 对象**无该字段初始化**：`thincoder-core/agent.mjs:69`–`:71`。
  - 会话复位不再清镜像：`thincoder-core/session.mjs:437`–`:438`。
- **存量兼容**：旧会话槽文件可能残留镜像字段值——恢复时**一次性**读取迁入 Map（**唯一迁移读点**，此后不写不读）：`thincoder-core/token-ttl.mjs:131`（`restoreEngTokens`）；落盘时该 legacy 字段被一并删除（`token-ttl.mjs:270`）。
- **dispatch 写门**：资格判定改问**「任一活槽存在」**——`thincoder-core/token-ttl.mjs:211`（`anyLiveDesignSlot`），调用点 `thincoder-core/agent/dispatch.mjs:196`。

## 5. consume 落盘对称（交付 🔴 复活洞修复）与用例面

- **复活洞**：D1 + D2 叠加后，consume-design 删内存槽 → 回合尾 save 窗口内 spawn 门禁 miss 回读 → 会从**盘上复活**已消费 token。
- **修法**：consume-design 删内存槽后**当场同步落盘删除**（写空槽）——`thincoder-core/agent-tools/subagent-spawn.mjs:177`（`removeDesignTokenSlot`）→ `:179`（`persistEngTokens`）。落盘失败 ⇒ 回滚内存槽 + 抛错可重试（不留半消费态）。
- **消耗语义**：消费后同 designId 再 spawn = `resolveDesignSlot` not found 机械拒（`subagent-spawn.mjs:140`–`:145` 注释即此契约）。

**用例面**（`thincoder-cli/test/design-token-settlement.test.mjs` · 9 例）：

| 类 | 场景 | 期望 |
|---|---|---|
| 正常 | settle 当场落盘 → 进程 kill（不等回合尾）→ resume → spawn | 门禁从槽读到 token，通过 |
| 正常 | 缓存 miss 回读 | 内存 miss → 回读槽文件 → 命中 |
| 正常 | consume 后 kill → restart → 同 designId 再 spawn | **不复活**（旧台账已删） |
| 正常 | dispatch 写门任一活槽判定 | 有活槽放行 / 无活槽拦 |
| 边界 | 过期 token 槽 | 恢复 / 门禁 TTL 过滤——过期拒 |
| 边界 | 残留镜像一次性迁移 | 迁入 Map，随后不再写镜像 |
| 错误 | settle 落盘失败 | settle 失败可重评，不留半结算态 |
| 错误 | consume 落盘失败 | 回滚内存槽 + 抛错可重试 |

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| settle 当场落盘 | `thincoder-core/agent-tools/advisor-settle.mjs:152` · `:163` | 在位 |
| settle 失败回滚 | `thincoder-core/agent-tools/advisor-settle.mjs:171`–`:172` | 在位 |
| 落盘函数 + 槽台账 I/O | `thincoder-core/token-ttl.mjs:233` · `:164` · `:187` · `:211` | 在位 |
| 槽序列化 / 恢复 | `thincoder-core/token-ttl.mjs:112` · `:131` | 在位 |
| spawn 门禁解析 | `thincoder-core/agent-tools/subagent-spawn.mjs:112` | 在位 |
| consume 落盘对称 | `thincoder-core/agent-tools/subagent-spawn.mjs:177` · `:179` | 在位 |
| dispatch 写门 | `thincoder-core/agent/dispatch.mjs:196` | 在读任一活槽 |
| 镜像零写 | `thincoder-core/agent.mjs:69`–`:71` · `thincoder-core/session.mjs:437`–`:438` | 无字段初始化 |
| 轮转守卫（拆分产物） | `thincoder-core/session-guard.mjs:26` | 与 `saveSession` 共用 |
| 凭证工具组（拆分产物） | `thincoder-core/agent-tools/design-token.mjs` | 签发 / 校验 / 结算纯函数 |
| 测试 | `thincoder-cli/test/design-token-settlement.test.mjs` | 9 例在位 |

### 6.2 双端与依赖方向

- **双端**：CLI 与 VSC 各自实现、**语义同源**（同一批「结算即落盘 / 门禁读权威 / 镜像退役」三条）。CLI 无 VSC 的快照 / 清零修复面（不存在对应 bug），**不引入**。
- **已知有意差异**（非偏差）：`reconcileEngTokensFromSlot` 同 id 冲突**以槽为准**（本仓——「槽 = 权威」）；VSC 版为内存优先，且 VSC 有当场权威台账回写一步，本形态回写为**惰性**（随下次 `persistEngTokens` / `saveSession` 携带清理后的 Map）——源码注释逐字登记（`thincoder-core/token-ttl.mjs:181`–`:186`）。
- **依赖环（有意、安全）**：`token-ttl.mjs` 只 import 底层槽 I/O（`session-slots.mjs` + `session-guard.mjs`）；`session.mjs` 同时 import `token-ttl.mjs` → 静态环，与既有 session ↔ session-slots 环同构（函数声明实例化期已初始化，环安全）。

### 6.3 VSC 端结算接线（B 式并入 · 实核 as-of 2026-09-15）

> 来源 = `thincoder-vscode/docs/design/DESIGN-TOKEN-SETTLEMENT.md`（VSC 产品档——旧档一字未改、留参照历史）。VSC 结构性基线不同：agent 对象**每 run 重建**（`thincoder-vscode/src/agent/setup.mjs`——非 CLI 常驻单对象）⇒ 结算面多出
> 「死对象 / 快照 / 清零」三类 VSC 独有断点——D1–D6 全部落地后与 CLI **同机制语义**（settle 即落盘权威台账 / 门禁读权威 / 镜像退役）。生命周期语义 / TTL / 格式 = `thincoder-vscode/src/agent-tools/advisor.mjs`（基准层并入面 = `docs/core/design/ENG-TOKEN-BINDING.md` §6.3——本档不重述）。

| 面 | VSC 落点（实核） |
|---|---|
| settle 当场同步落盘（D1——去 fire-and-forget） | `thincoder-vscode/src/agent-tools/advisor-async.mjs:364`–`:392`（settle 路径——`:369` `_engPersist` · `:375` 同步 `setSlotEngDesignTokens`——写失败即 settle 失败，可重评、不静默吞错） |
| token 入槽 + Approved 后缀（echo 即裁决） | `thincoder-vscode/src/agent-tools/advisor-async.mjs:389`（`parent._engDesignTokens.set`）· `:392`（`buildApprovedSuffix`） |
| 门禁读权威（miss 回读槽——D4） | `thincoder-vscode/src/agent-tools/subagent-spawn-gate.mjs:70`（`resolveDesignSlot`）· `:124`（`authorizeEngCoderDesignToken`——TTL 过滤保留） |
| 写侧保留槽 + union 合并（D2 + D6——忙时不清 settle 落盘项） | `thincoder-vscode/src/extension/session-slot-write.mjs:166`（`engTokensMergeForSave`——`{...existing, ...incoming}`；同 key 以新 mint 者胜——比较 `:expiresAt` 尾部）· 调用 `thincoder-vscode/src/extension/panel-session.mjs:113`（键存在性写：缺键 → 保 slot——空态不钉 null） |
| 会话内回合从槽新读（D3——快照已删） | `thincoder-vscode/src/extension/suspension.mjs:202`–`:203`（不再捕获入场 engState 快照）· `thincoder-vscode/src/extension/panel-chat.mjs:369`–`:370`（每轮从槽新读——settle 落盘后 digest 可见） |
| 单值镜像退役（D5） | `_engDesignToken` 单值镜像**零运行时读写**（dispatch 写门资格问「任一活槽存在」——经 `resolveDesignSlot`）；仅 `thincoder-vscode/src/agent/agent-state.mjs:63` 一次性迁移读（legacy 残留——`ENG-TOKEN-BINDING.md` §6.3 已列） |
| 消费落盘对称（consume 后不复活） | `thincoder-vscode/src/agent-tools/subagent-spawn-gate.mjs:145`（`executeConsumeDesignAction`——删内存槽 + 盘面清理，无半消费态） |
| 测试面 | `thincoder-vscode/test/eng-settlement.test.mjs`（14 用例——settle 落盘 / union 忙时 / restore / consume 不复活） |

**VSC 侧差异**（有意——§6.2「已知有意差异」的 VSC 载体坐标）：`engTokensMergeForSave` 同 key 冲突以 **expiresAt 大者胜**（新 mint——防 async 重评审同 designId 丢新 token）；CLI 侧 `reconcileEngTokensFromSlot` 同 id 冲突以槽为准（两处源码注释逐字登记）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-S1 | **settle 即落盘**（不等回合尾） | settle 是唯一结算点——窗口内被杀即丢凭证；否决「靠回合尾 saveSession 兜」 |
| D-S2 | 落盘失败 = **settle 失败** | 宁可结算失败可重评，也不留「内存有盘上无」半结算态；否决「失败静默、下次再存」 |
| D-S3 | 门禁 **miss 回读槽**（槽 = 权威） | 重启后 Map 未回填时不能凭缓存 miss 就拒；否决「只信内存」 |
| D-S4 | 单值镜像**退役**（零写 + 仅一次性迁移读） | 两套真相必然分叉；否决「双写双清维持同步」（多处同步成本 + 漂移源） |
| D-S5 | dispatch 写门改问**任一活槽** | 与 spawn 门同源（同一 reconcile）；否决「写门继续读镜像」 |
| D-S6 | consume 删槽**当场落盘** | 不落盘则 D1+D2 叠加出复活洞；否决「等下次 save 自然清」 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/DESIGN-TOKEN-SETTLEMENT.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已批准 + 已实现」+ 交付 commit 号 + 测试 9/9） | 时点状态行 / commit 号 | 批次语境——现行态已入 §2–§5 |
| 旧档 §1 的逐行 `file:line` 现状剖析 | 一次性 explore 一手核实的行号锚（迁移前坐标） | 陈旧坐标——现行坐标已入 §6.1（行号面按现状实核） |
| 旧档 §4「受影响文件（CLI）」 | 单次改动的文件 × 动作清单 | 一次性材料——现行落点入 §6.1 |
| 旧档 §5 验收行 AC1–AC7 / §「测试用例表」 | 一次性验收清单与表 | 批次材料——现行用例面已入 §5 |
| 旧档变更记录（2026-09-08 两条） | 立项 / 扩展流水（会诊 4 模型收敛等） | 历史叙述——本档自有变更记录 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 与 VSC 共享的同构语义清单（旧档 §1 末段） | 逐项镜像/对齐标准（含「D3 双端同步退役」括注） | 已被 §6.2 现行差异登记取代——旧括注为一次性镜像清单 |
| 需求侧正文 | CLI 树需求档 | 需求档未迁——后续批并入既有档 |
| VSC 端设计档 | VSC 树对应文档 | **已并入（批 6）**——§6.3 VSC 结算接线（VSC 保持独立实现、语义同源） |
| VSC 源档 §1 断点剖析（死对象 / 快照 / 清零 file:line 追查） · §2 需求 R1–R4 · §4 受影响文件 · §6 变更记录 | 一次性核实 / 批次材料 / 流水 | **不并**——断点结论已落 §6.3 各落点；R1–R4 为批次需求（机制已落地）；D1–D6 与本档 §2–§5 同源（(d) 类） |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **145 行**（并入批 6 后 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/DESIGN-TOKEN-SETTLEMENT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  坐标改写为现状路径并实核（`token-ttl.mjs` · `agent-tools/advisor-settle.mjs` · `agent-tools/subagent-spawn.mjs` · `agent/dispatch.mjs` · `session.mjs` · `session-guard.mjs` · `agent-tools/design-token.mjs`）。
  生命周期语义（TTL / 格式 / 跨模式存活）按 D2 归 `ENG-TOKEN-BINDING.md`，本档只留结算面；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-09-15（**B 式迁移轮 · VSC 第 6 批 · 并入 · eng-designer**）：新增 §6.3 VSC 端结算接线——自 `thincoder-vscode/docs/design/DESIGN-TOKEN-SETTLEMENT.md` 并入（settle 同步落盘 / union 合并 / 门禁回读 / D3 每轮读槽 / 镜像退役 / 消费对称逐项实核；与 §6.2「已知有意差异」互指）；VSC 源档核实材料与批次需求登 §8.2 不并（(d) 类）；需求侧头注随批 5 建档收正。
