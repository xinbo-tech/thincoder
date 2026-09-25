# 设计评审凭证结算（DESIGN-TOKEN-SETTLEMENT）· 工程模式凭证链板块

> 板块 = **工程模式凭证链（结算面）**——评审通过后 token 的**结算 / 持久化 / 回读 / 消费**。
> **v2 就地更新**（2026-09-17 退役批）：M6 模块设计语义融入（评审凭证——见 §9；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-REVIEW-CREDENTIAL.md` 已归档 `_archive/modules/`）。
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
- **已知有意差异（二态化 · 2026-09-25 · 台账 #339）**：两项——① **同 id 冲突裁决**（本仓 = **槽为准**〔「槽 = 权威」〕；VSC = 内存优先——`thincoder-vscode/src/agent/agent-state.mjs:58-76` `reconcileEngDesignTokens`：`!map.has(id)` 才合入）——**A9 核查 = ① 不成立**（两面同具备 Map 与槽两载体，无单侧对象）⇒ 按「端差默认 = 消」转**消解路径 + 到期条件**：
  两面对齐同一裁决规则（方向 = token 结算 / 合并面设计轮裁定——候选 = 槽为准〔核现径〕∥ 内存优先〔端现径，防丢新铸〕）；**到期 = token 结算 / 合并面下次触碰**。
  ② **过期清理回写时序**（VSC = 当场权威台账回写；本形态 = 惰性〔随下次 `persistEngTokens` / `saveSession` 携带〕）——**形态（写回时序）· 语义零差**（清理对象 = 过期项——任何门禁均不授权，早清晚清不改变授权结果）⇒ 非登记项。源码注释逐字登记（`thincoder-core/token-ttl.mjs:181`–`:186`）。
- **依赖环（有意、安全）**：`token-ttl.mjs` 只 import 底层槽 I/O（`session-slots.mjs` + `session-guard.mjs`）；`session.mjs` 同时 import `token-ttl.mjs` → 静态环，与既有 session ↔ session-slots 环同构（函数声明实例化期已初始化，环安全）。

### 6.3 VSC 端结算接线（B 式并入 · 实核 as-of 2026-09-15）

> 来源 = `thincoder-vscode/docs/design/DESIGN-TOKEN-SETTLEMENT.md`（VSC 产品档——旧档一字未改、留参照历史）。VSC 结构性基线不同：agent 对象**每 run 重建**（`thincoder-vscode/src/agent/setup.mjs`——非 CLI 常驻单对象）⇒ 结算面多出
> 「死对象 / 快照 / 清零」三类 VSC 独有断点——D1–D6 全部落地后与 CLI **同机制语义**（settle 即落盘权威台账 / 门禁读权威 / 镜像退役）。生命周期语义 / TTL / 格式 = 核面单一权威（`docs/core/design/ENG-TOKEN-BINDING.md` §6.3——本档不重述）；原 VSC 镜像 `advisor.mjs` 等随 W12/W13 已删（删除记录见批次档 §5）。

| 面 | VSC 落点（实核 · W16 接线面收正） |
|---|---|
| settle 当场同步落盘（D1——去 fire-and-forget） | **W12 已迁核**——现体 = 核 `thincoder-core/agent-tools/advisor-settle.mjs`（settle 当场落盘 `:152` · `:163` · 失败回滚 `:171-172`）+ 核 `thincoder-core/token-ttl.mjs:233`（`persistEngTokens`）；原端侧 `src/agent-tools/advisor-async.mjs:364-392` 已删 |
| token 入槽 + Approved 后缀（echo 即裁决） | **W12 已迁核**——现体 = 核 `thincoder-core/agent-tools/design-token.mjs:22`（`buildApprovedSuffix`）· `:82`（`settleDesignReview`）；原 `advisor-async.mjs:389` / `:392` 已删 |
| 门禁读权威（miss 回读槽——D4） | **W12/W13 已迁核**——现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:112`（`resolveDesignSlot`——内存 miss 回读槽 reconcile + TTL 过滤保留）；原端侧 `src/agent-tools/subagent-spawn-gate.mjs:70` / `:124` 已删（`authorizeEngCoderDesignToken` 名随核化退场——核 `:158-169` 内联验证；仅过期拒才删槽） （迁移期引文） |
| 写侧保留槽 + union 合并（D2 + D6——忙时不清 settle 落盘项） | **W11 转口核**——端壳 `thincoder-vscode/src/extension/session-slot-write.mjs:23`（`engTokensMergeForSave` = 核 `mergeEngTokensForSave` re-export）→ 核 `thincoder-core/session-slot-write.mjs:156`（并集 + 同 key 新铸者胜）；原 `session-slot-write.mjs:166` 自持实现已删 （迁移期引文） |
| 会话内回合从槽新读（D3——快照已删） | 端壳 hydrate 面：`thincoder-vscode/src/agent/setup.mjs`（`hydrateRun` 每轮 `loadSlot` → `applySlotSessionState`）+ `thincoder-vscode/src/agent/agent-state.mjs:56`（`reconcileEngDesignTokens` 槽源合入——同 id 冲突**内存优先**〔状态词 = §6.2 ①〕；内存项永不清空——「槽 = 权威」仅指门禁读源 = D-S3）；原 `suspension.mjs` 快照 / `panel-chat.mjs` 回合读行随 W13 重排（旧坐标已退场） |
| 单值镜像退役（D5） | `_engDesignToken` 单值镜像**零运行时读写**（dispatch 写门资格问「任一活槽存在」——核 `resolveDesignSlot`（`thincoder-core/agent-tools/subagent-spawn.mjs:115`））；仅 `thincoder-vscode/src/agent/agent-state.mjs:70-71` 一次性迁移读（legacy 残留——`ENG-TOKEN-BINDING.md` §6.3 已列） |
| 消费落盘对称（consume 后不复活） | **W12/W13 已迁核**——现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:152`（`executeConsumeDesignAction`——删内存槽 + `persistEngTokens` 当场同步落盘 + 失败回滚 `:172-178`）；原 `subagent-spawn-gate.mjs:145` 已删 （迁移期引文） |
| 测试面 | `thincoder-vscode/test/eng-settlement.test.mjs`（14 用例——settle 落盘 / union 忙时 / restore / consume 不复活） |

**VSC 侧差异（二态化 · 2026-09-25）**：① `engTokensMergeForSave` 同 key 冲突「**expiresAt 大者胜**（新 mint）」——**已消解**（W11 转口后同一实现：端壳 = 核 `mergeEngTokensForSave` re-export；
  「新铸者胜」与「expiresAt 大者胜」= 同一规则——核档 `thincoder-core/session-slot-write.mjs:152-153`）；② `reconcileEngTokensFromSlot` 同 id 冲突以槽为准（VSC 版内存优先）——**消解路径 + 到期条件在册**（A9 核查与处置 = §6.2 ①）。

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

## 9. 评审凭证（v2——M6 增量）

**定位**：评审通过 ≠ 授权落地——通过只发「凭证」（designId + token），实现方拿凭证解锁写码；链收口后**同 designId 再 spawn = 机械拒**（链终消费）。v1 已完整实现凭证生命周期（签发 → TTL → 消费 → 移除），**v2 继承零改**，唯一变更 = **评审对象来源改读 manifest `docRoot`**（去硬编码 `docs/`）。

**五功能点**：

| # | 功能点 | 方案 |
|---|---|---|
| F1 | 评审通过 → 签发 designToken | **继承 v1**（`generateDesignToken` + `settleDesignReview` → designId+token） |
| F2 | 链终消费制 | **继承 v1**（`consume-design` → `resolveDesignSlot` + `removeDesignTokenSlot`——消费后同 designId 再 spawn = `designId not found` 机械拒；重复消费幂等 no-op） |
| F3 | 评审对象来源读 `docRoot` | `advisor.mjs` design-review 分支（文档分类）改读 `resolveReviewTargetPaths`（`agent/write-gate.mjs`，M4 产物——**同源单一权威，不重复实现**；不 import `dispatch.mjs`——簇间回边环风险）替代 `loadConventions`/`isDocPath` 分类 |
| F4 | 凭证值不落文档 | token / designId **值**永不落档（只记 `review passed`）——`sanitizeText`/`CRED_RE` 机械剥除已实证（继承） |
| F5 | 六 kind 不签发 | 非全绿（含 🔴）→ 不签发 token（fail-closed，继承） |

**验收（回指 AC-M6）**：

| # | 判据 |
|---|---|
| AC-M6-1 | 评审通过（全绿）→ 签发 token + 槽登记 |
| AC-M6-2 | 链终消费后同 designId 再 spawn → 拒 |
| AC-M6-3 | 评审对象 / 被审文件路径读 `docRoot`（grep 硬编码 `docs/` → 零命中） |
| AC-M6-4 | token / designId 值不落文档（只记 `review passed`） |
| AC-M6-5 | 六 kind 非全绿（含 🔴）→ 不签发 token |

**边界（本增量不做）**：不做评审判据本身（advisor 内部——继承）；不做凭证格式改造（`uuid:expiresAt` 继承 v1，不重设 HMAC/签名层——已随 2026-09-06 裁定退役）。

## 变更记录

- 2026-09-25（**end-diff-registry 批 · 设计评审修正轮 1（发现 #3）· eng-designer**——承 `docs/batches/2026-09-25-end-diff-registry.md` §3 轮次 1 · 父侧裁定接受）：§6.3 表 D3 行措辞收正——`reconcileEngDesignTokens` 「槽权威合入」→ **「槽源合入——同 id 冲突内存优先」**（与 §6.2 ① 口径一致；「槽 = 权威」限定为门禁读源〔D-S3〕）。**零新语义**（口径对齐）。

- 2026-09-25（**end-diff-registry 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-25-end-diff-registry.md` §1 · 台账 #339）：设计档侧同族复核（二项）——§6.2「已知有意差异」二项化（① reconcile 同 id 冲突裁决 = **消解路径 + 到期条件**〔A9 ① 不成立〕；② 过期清理回写时序 = 形态 · 非登记项）；§6.3 尾段「VSC 侧差异」收正（merge 规则差异 = **已消解**——W11 单源转口；余项 = §6.2 ①）。**零新语义**。

- 2026-09-17（**v2 就地更新 · 退役批** · 主 agent）：M6 模块设计语义融合——新增 §9 评审凭证（F1/F2/F4/F5 继承 v1 零改 + F3 评审对象来源改读 `docRoot` 复用 M4 `write-gate.mjs` 同源导出；AC-M6 验收）；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-REVIEW-CREDENTIAL.md` 归档 `_archive/modules/`。

- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/DESIGN-TOKEN-SETTLEMENT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  坐标改写为现状路径并实核（`token-ttl.mjs` · `agent-tools/advisor-settle.mjs` · `agent-tools/subagent-spawn.mjs` · `agent/dispatch.mjs` · `session.mjs` · `session-guard.mjs` · `agent-tools/design-token.mjs`）。
  生命周期语义（TTL / 格式 / 跨模式存活）按 D2 归 `ENG-TOKEN-BINDING.md`，本档只留结算面；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-09-15（**B 式迁移轮 · VSC 第 6 批 · 并入 · eng-designer**）：新增 §6.3 VSC 端结算接线——自 `thincoder-vscode/docs/design/DESIGN-TOKEN-SETTLEMENT.md` 并入（settle 同步落盘 / union 合并 / 门禁回读 / D3 每轮读槽 / 镜像退役 / 消费对称逐项实核；与 §6.2「已知有意差异」互指）；VSC 源档核实材料与批次需求登 §8.2 不并（(d) 类）；需求侧头注随批 5 建档收正。
- 2026-09-15（**W16 实施轮 · eng-coder · 接线面收正**）：§6.3 表换「实核 · W16 接线面收正」版——VSC 端侧镜像 6 档随 W11/W12/W13 删旧：
  D1/D2（settle 落盘 + 门禁族 + consume 对称）= 核面坐标（`thincoder-core/agent-tools/advisor-settle.mjs` · `thincoder-core/agent-tools/design-token.mjs` · `thincoder-core/agent-tools/subagent-spawn.mjs`）；
  union 合并 = 端壳转口行 + 核 `thincoder-core/session-slot-write.mjs:156`；D3 = 端壳 hydrate 面（`thincoder-vscode/src/agent/setup.mjs` + `thincoder-vscode/src/agent/agent-state.mjs`）；
  D5 迁移读行号重核；§9 行数重核。
