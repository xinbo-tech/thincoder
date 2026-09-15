# async 设计评审 token 结算根治（VSC 端）

> 板块：设计评审凭证结算（async settlement）。状态：**已批准 + 已实现**（2026-09-08 双 eng-coder clean 交付——D1-D5 + D6 union 全落地——eng-settlement.test.mjs 现 14 用例）。用户裁定：不再打补丁，按合理结构根治 + 废旧单值镜像 + 双端一起做（CLI/VSC 各自独立文档，同机制语义）。
> 背景：VSC 端 async 设计评审通过后 token/designId 反复丢失（`designId not found`）——explore 一手核实（2026-09-08）定位根因在 VSC extension 层双源设计。

## 1. 问题与根因（explore 一手核实）

async design 评审（`advisor async:true`）在**挂起会话**期间 settle（完成）时，其签发的 token/designId 无法可靠到达后续 spawn eng-coder 的校验门。explore 核实（file:line 见各断点）：

**结构性差异**：VSC agent 对象**每 run 重建**（`src/agent/setup.mjs:244` 注释"rebuilt on every runAgent call"），settle 回调闭包持的 `parent` = **launch 回合已废弃的死对象**（`advisor-async.mjs:214-227`）→ `settleDesignReview` 写 `parent._engDesignTokens`（`advisor-async.mjs:288-290`）落到死对象，内存 token 不跨 run。

三处 VSC 独有断点：
1. **快照永不刷新（断点②）**：挂起会话入口一次性捕获 `susp.engState`（`suspension.mjs:248`），会话内回合复用（`panel-chat.mjs:193`），**从不重读槽文件** → 会话内回合（digest）用陈旧空快照重建 Map → spawn 门禁读空 Map → `designId not found`。
   （D3 修复：会话内回合从槽新读。）
2. **写侧清零（断点②b——最硬根因）**：会话内回合正常完成时 `onComplete` 携 `agentState(agent)` 落盘
   （`panel-callbacks.mjs:105-107`），而 `agentState` 恒含 `engDesignToken/engDesignTokens` 两键（`run-helpers.mjs:229-240`）→
   `panel-session.mjs:105,110` 键存在性写**用空态覆盖槽** → 把 settle 刚落盘的 token 钉 null。**时序必杀**：settle 写 token →
   唤醒 digest → digest 空态 onComplete 清零 → token 在 digest 后必死。
   （D2/D6 修复：空态保留槽 + union 合并。）
3. **F2g fire-and-forget（断点③⑦）**：settle 的 `_engPersist` 槽直写（`advisor-async.mjs:294-305`）动态 import `.then` **不 await**——settle 后进程死/落盘前 → token 只死在内存。

另：spawn 门禁（`subagent-spawn-gate.mjs` resolveDesignSlot）只读当前 run 的内存 Map（`parent._engDesignTokens`）；dispatch 写门（`execute-tools.mjs:75`）读单值镜像 `_engDesignToken`——**门禁读取分裂**（Map vs 镜像两套真相）。

## 2. 需求（用户裁定 2026-09-08）

- **R1**：async 设计评审 settle 的 token/designId 可靠结算——后续 spawn eng-coder（同会话/挂起会话内/进程重启后）校验通过，不再 `designId not found`。
- **R2**：**废旧单值镜像** `_engDesignToken`（用户选 B）——门禁判断资格改问权威槽"任一活槽存在"，不再看镜像。
- **R3**：**双端一起做**——CLI/VSC 各自独立文档，同机制语义高度一致（settle 即落盘权威台账）。
- **R4**：**不落文档约束保持**——token/designId VALUES 只进槽文件（会话态），永不进设计文档。

## 3. 设计（VSC 端落地）

### D1 槽文件为权威结算台账，settle 当场同步写

- **现状**：token 结算写"评审运行时死对象"内存 + F2g fire-and-forget 槽写（不 await）。
- **改**：settle 是唯一结算点 → **settle 当场同步写槽文件权威台账**（designId 键控持久，token 随会话 slot 持久化跨进程）。F2g 的 `_engPersist` 直写**去 fire-and-forget**：改同步 `await setSlotEngDesignTokens`，写失败即 settle 失败（可重评，不静默吞错）。agent 内存 Map 降级为**当前进程缓存**（每次 run 从权威水合）。
- 落点：`src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）` settle 路径 + `src/extension/session-slot-write.mjs`。

### D2 修写侧清零器（断点②b）

- **问题**：会话内回合 `onComplete` 用陈旧空态 `agentState` 键存在性覆盖 slot，把 settle 已落盘的 token 钉 null。
- **改**：保存时**不得用内存空态覆盖槽里已由 settle 写好的 token**——区分"内存真无 token"（agent 从未有//new 清）vs"token 由 async settle 已落盘"（内存空但槽有值）。槽有值而内存空 → **保留槽值，不钉 null**。空态不能当"清空指令"。
- 落点：`src/extension/panel-callbacks.mjs` onComplete + `src/extension/panel-session.mjs` saveLines 合并语义。
- **槽失效触发（评审 #3——空态≠清空，但槽须有明确清理路径）**：①**consume-design 后清**（链终消费显式 delete 该槽）；②**/new 会话重置清**（resetSessionState 对在跑池 abort + 清该会话账本）；③**TTL 过期清**（restore/门禁拒时删过期槽）。三触发之外，空态 agentState 保存**不触发清理**（只防误清 settle 已落盘 token）。
- 落点：`src/extension/panel-callbacks.mjs` onComplete + `src/extension/panel-session.mjs` saveLines 合并语义 + consume//new/TTL 清理点。

### D3 修读侧空快照（断点②）

- **问题**：挂起会话内回合用入场快照 `susp.engState`，看不到 settle 刚落盘的 token。
- **改**：会话内回合（digest/用户回合）**从槽新读 engState** 而非复用入场快照（会话绑定 turnSlot 固定、切换被禁，重读安全）——digest 能看到刚结算的 token。
- 落点：`src/extension/panel-chat.mjs` + `src/extension/suspension.mjs`。

### D4 spawn 门禁读权威（miss 回读槽）

- **现状**：resolveDesignSlot 只读当前 run 内存 Map（会话内回合 = 空快照 → 拒）。
- **改**：门禁读内存 Map，**miss 时回读槽文件权威台账**（reconcile 内存缓存 + 判定）——会话内回合也能从槽读到 settle 落盘的 token。TTL 过滤保留。
- 落点：`src/agent-tools/subagent-spawn-gate.mjs（W12 已迁核——现体见批次档 §5）`。

### D6 写侧 merge 补 union（2026-09-08 二次观察实证——D2 只修半边）

- **实证**：D1-D5 落地后 async 评审 token 仍偶发丢失（评审 digest 显示 Approved + 槽数 9，盘上槽 8）。用户观察：**主会话空闲时 settle 落盘成功、主会话忙时丢失**。
- **根因（代码核实）**：`engTokensMergeForSave`（session-slot-write.mjs:160-167——D2 语义）只修了"incoming 空 + 槽有值 → 保留槽"半边，**没修"incoming 非空但不完整"半边**：
  ```js
  incoming 非空 → return incoming        // ← 用内存表整体覆盖槽表
  incoming 空 + 槽有值 → return existing  // ← D2 已修
  ```
  忙时场景：settle 落盘 9 项到槽 → **settle 只更新闭包 parent（发起评审的 agent 实例）的 `_engDesignTokens`
  （advisor-async.mjs:322-323），主会话当前 agent 内存 Map 仍是旧 8 项**（settle 发生在其回合处理中途，回合开始时水合
  早于 settle）→ 主会话回合尾 saveLines → agentState 携 incoming = 8 项（非空）→ `return incoming` →
  **8 项整体覆盖槽的 9 个条目 → 新 token 被抹**。空闲时无后续 saveLines → 槽保留 9 个条目。
- **改（用户确认 union 方案）**：merge 改 **union 合并**——`{ ...existing, ...incoming }`：
  - **同 key 以新 mint 者胜（评审 #3——比较 token 尾部 `:expiresAt`——同 TTL 源下 expiresAt 大 = 后 mint = 新）**——非盲目 incoming wins：续跑 round 同 designId 新 token 覆盖旧值（incoming 新）✓；async 重评审同 designId（F2h 复用 id——settle 落槽新 token 而主会话内存仍是旧 token——incoming 旧 vs existing 新）→ **existing（新）胜**——不丢新 token
  - **槽独有项保留**（incoming 缺的——如 settle 刚落盘而主会话内存未同步的项）——多写者（settle/consume/跨端）互不覆盖
  - 槽 = 权威台账：回合尾保存永不丢弃槽里自己内存不知道的项
  - consume 安全：consume = "内存删 + 对称删盘"——槽已无该项 → union 不复活
  - TTL 过期：由 setup 水合 TTL 过滤清——回合尾 union 保留无害（spawn 门禁会滤）——过期项最终由既有 TTL 三触发清（评审 #6 注记：union 失去 D2 全量覆写"顺带丢陈旧槽项"的副作用——行为仍正确，仅死台账滞留至触发清）
- 落点：`src/extension/session-slot-write.mjs` engTokensMergeForSave 一个函数 + `test/eng-settlement.test.mjs` **改用例 + 补用例**（评审 #2：现 overwrite 断言 eng-settlement.test.mjs:148-150 与文件头注释 :10-11 钉 D2 覆盖语义——union 后该用例断言改为 `{...existing, ...incoming}` 并集结果——非只增不改）。

### D5 废旧单值镜像（R2 用户选 B）

- **现状**：dispatch 写门（`execute-tools.mjs:75`）读 `_engDesignToken` 镜像拦产品代码写；spawn 读 Map——两套真相。
- **改**：`_engDesignToken` 单值镜像**退役**。dispatch 写门判断资格改问权威槽**"任一活槽存在"**（查内存 Map 或槽文件任一未过期 designId）——有任一活槽即有资格写产品代码。**存量兼容：旧 slot 文件可能残留镜像值——setup 水合 engState 时一次性读迁进 Map（唯一迁移读点，此后零读零写）**，settle 不再写镜像、setup 不再恢复镜像、consume/TTL/new 不再清镜像。
- **迁移读点（评审 #1）**：setup 水合处——slot 有残留 `engDesignToken` 且 Map 空 → 一次性迁入 Map（legacy 标），随后不再写镜像；AC3 的 grep 清扫**排除此单点**（其余镜像读写零命中）。
- 落点：`src/agent/execute-tools.mjs` + settle 不再写镜像 + setup 不再恢复镜像（改唯一迁移读）+ consume/TTL/new 不再清镜像。

## 4. 受影响文件（VSC，thincoder-vscode）

- 修改：`src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）`（settle 同步落盘 D1/D5）、`src/agent-tools/subagent-spawn-gate.mjs（W12 已迁核——现体见批次档 §5）`（miss 回读 D4/D5）、
  `src/agent/execute-tools.mjs`（写门问槽 D5）、`src/agent/run-helpers.mjs`（agentState 去镜像 D5）、`src/agent/setup.mjs`（水合去镜像 D1/D5）、
  `src/extension/panel-callbacks.mjs`（onComplete 保留槽 D2）、`src/extension/panel-session.mjs`（saveLines 合并调用点 D2——**评审 #1：仅调用不变**）、
  **`src/extension/session-slot-write.mjs`（engTokensMergeForSave union 改造——D6 实际改动文件——评审 #1 补入；当前 168 行——delta ≤±10——评审 #4）**、
  `src/extension/panel-chat.mjs` + `suspension.mjs`（读槽 D3）
  + `test/eng-settlement.test.mjs`（D6 改用例 + 补忙时用例——评审 #2；当前 166 行——delta ≤±30——评审 #4）
- 文档：本设计 + README 地图登记

## 5. 验收

AC1 = async design 评审 settle 后：①同进程后续回合 spawn eng-coder 通过 ②挂起会话 digest 回合 spawn 通过 ③settle 落盘后进程重启 resume → spawn 通过——均不再 `designId not found`；AC2 = 会话内回合 onComplete 不再把 settle 已落盘 token 钉 null/抹掉（槽值保留——D2 空态半边 + D6 union 补半边：
  incoming 非空但不全时忙时 saveLines 不覆盖 settle 刚落盘的项）；AC3 = `_engDesignToken` 镜像全仓退役（grep 零运行时读写，仅历史/文档提及）；AC4 = dispatch 写门读"任一活槽存在"判定资格；AC5 = 凭证不落文档巡检通过；AC6 = CLI/VSC 同机制语义一致（各自独立文档）。

## 变更记录

- 2026-09-08：D6 实现交付 clean（eng-coder）——union 合并 + tokenExpiryMs 内联解析（!p[0] 空 uuid 校验）——测试 11→14。历史注：D6 主体 30/40 行随 a0fabf8（agent 生命周期并发 commit——共享 git index 竞态）落入——修正增量 433a00a 补——内容正确全绿接受现状。

- 2026-09-08：D6 评审 6 项采纳——#1 §4 补 session-slot-write.mjs（实际改动文件）+ panel-session 改"仅调用不变"/#2 测试改"改用例+补用例"（现 overwrite 断言钉 D2 语义须改）/#3 同 key 改 expiresAt 比较新者胜（防 async 重评审同 designId 丢新 token）/#4 行数标注（session-slot-write 168/delta≤±10、test 166/delta≤±30）/#5 D2/D5 重复句清理/#6 TTL 注记。
- 2026-09-08：D6——写侧 merge 补 union（二次观察实证：忙时 settle 落盘被主会话 saveLines 覆盖抹——
  engTokensMergeForSave 只修了空态半边，补"incoming 非空但不全"的 union 合并）。
- 2026-09-08：立项。基于会诊（4 模型收敛：槽文件权威台账 + settle 同步落盘 + 门禁读权威）+ explore VSC 一手核实（断点②快照/②b写侧清零/③F2g/④门禁/⑤镜像）+ 用户裁定（B：连镜像一起废；双端一起做；各一份文档）。
