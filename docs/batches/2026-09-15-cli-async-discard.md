# CLI 子代理丢弃提醒对称（CLI-ASYNC-DISCARD）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 用户「那先把那5批和零成本的处理掉吧」（2026-09-15 21:36）+ 父侧台账分类轮（同日 21:33）。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
> **状态：设计轮待发**（2026-09-15——§1 已落；§2 待 eng-designer；设计评审未发起）。
>
> **导航（父侧维护）**：§1（裁定与讨论）= 本档 §1；§2 当前任务书 = 本档 §2（designer 追加面）。
> **条目指针（三方一致）**：本批 = 台账 `docs/TODO.md` 技术待办一条——§2 条目 ↔ 设计档验收回指 ↔ 需求档条目须逐条对齐。
> 台账行号 = **as-of 2026-09-15**（批次档落笔时点；此后台账增删会使其漂移，指针以条目名称为准）。
> 上游：台账 `docs/TODO.md` · 权威设计档 = `docs/core/design/AGENT-LOOP.md`（核心统一 W1–W17 后）。

---

## §1 讨论（主 agent 记）

### 状态

**设计轮待发 2026-09-15**——父侧完成台账分类（31 条未决 → 5 批 + 1 零成本项），
用户 21:36「可以」同批批准三点：① 5 批划分 + 推进方式 ② 台账 S3b 条判「已废弃」并归档 ③ 顺序 = 不排序、5 批并行（分 2 波）。
本档 = **批 4**（CLI 侧子代理丢弃提醒对称）的 §1；§2 由 eng-designer 追加。

### 用户裁定与澄清（2026-09-15）

| 时点 | 内容 |
|---|---|
| 21:33 | 父侧台账分类轮——用户「你把这些分分类，看看有哪些容易做的，先分几批出来做掉」 |
| 21:36 | 用户「可以」= 三点同批批准：① 5 批划分 + 推进方式 ② 台账 S3b 条判「已废弃」并归档 ③ 顺序 = 不排序、5 批并行（分 2 波） |

### 批次条目（本批 = 台账技术待办一条；原文与证据以台账为准——本档不重述）

| # | 台账条目 | 症状 / 根因（台账所载） | 消解路径（台账所载） |
|---|---|---|---|
| 1 | `docs/TODO.md:47`（2026-09-13 旧 VSC issue #6 核查所得——**方向反转**）CLI 侧无「子 agent 被丢弃」提醒与丢弃终态（与 VSC 侧不对称） | 原报告是「修复只落在 CLI、扩展端没同步」，而今 **VSC 有墓碑 + 整批提醒、CLI 无**；CLI 中止分支 `thincoder-core/agent/run-stages.mjs:168-169`（`subPool?.clear(); advPool?.clear()`）与 `thincoder-cli/src/tui/suspension-drive.mjs:260` 仍**静默清池**；CLI 侧 `discarded` 提醒文案全仓零命中 ⇒ 模型只能猜「报告到底到没到」 | CLI 侧对称实现 + 双侧一致用例 |

### 设计输入与已知事实（父侧已核——designer 不必重探）

1. **对侧参照实现在位**：`thincoder-vscode/src/agent-tools/async-discard.mjs`（判定 `:55-56` · 共享 `discardRole:70-87`（动作序 = 墓碑→出池→汇总→整批一次提醒→一条 `ev:discarded`）· 文案 `:37-44`）。
   **父侧收正注（2026-09-16）**：本条原写 `thincoder-vscode/src/agent/async-discard.mjs:57-74`——**少一层目录**（实为 `src/agent-tools/`）且行号未对齐；按本批 designer 前轮实核收正。零语义改动。
2. **参照用例在位**：`thincoder-vscode/test/async-parity.test.mjs`（T-D6 `:254` · T-D8 `:315-328` · T-D13 `:454`）。
3. **VSC 侧登记面**：`thincoder-vscode/docs/design/AGENT-LOOP.md:740`（§12.8 #2，原注「CLI 属他批」）。
4. **重锚要求（重要）**：核心统一 W1–W17 已把 AGENT-LOOP 面迁核 ⇒ 权威设计档 = `docs/core/design/AGENT-LOOP.md`；
   `thincoder-vscode/docs/**` = **迁移期参照历史（保留 ≠ 维护）**（`docs/README.md:4`）⇒ 设计轮须**先按现状实核重锚**上述坐标，再定落点。
5. **分工口径**（改到哪模块 ⇒ 同步修该模块权威档）= 承 `docs/batches/2026-09-15-vsc-core-wiring.md` §1（三层分工）。
6. **对称语义**：本条**不要新语义**——墓碑 / 整批提醒 / 事件三件套的行为以对侧为准；CLI 与 VSC 若必须不同，须显式登记端差。

### 批次边界（明确不做）

1. 只做 CLI 侧对称——**不改 VSC 侧既有实现**（它已是对侧基准）。
2. 不重定义丢弃语义（差异须显式登记，不静默偏离）。
3. 不改台账 / 不改本档 §1。

---

### 父侧裁定（2026-09-16 · 前向引用悬空锚 = 非缺陷）

用户 2026-09-16 04:28 裁定「按建议」：本批设计档引用**实施轮才会创建的档**（`thincoder-core/test/async-discard.test.mjs` · `docs/core/design/AGENT-LOOP-DISCARD.md`）产生权威域悬空锚 **10 条中的 4 条** ⇒ **不当作缺陷**——前向引用，实施轮落档后自然消失。
> **验收口径收正**：本批三机检判据 = **零新增（非前向引用类）**；父侧原写「根域悬空 0」有误（实测权威域存量 10），属父侧判据句 bug。机制缺口（锚引擎缺「拟新增」豁免族）已登记台账技术待办。

### 父侧裁定（2026-09-16 · 复审 pass 后的两条剩余项）

- **🟡 需求层收窄（评审轮 2 #8 部分落地）**：`docs/core/requirements/AGENT-LOOP.md:174` 的「`discarded` 全仓零命中」未随设计层收窄 ⇒ **父侧当场对齐**（改为「丢弃墓碑状态与丢弃提醒文案……（该词在核内另有 4 处，均为其他语义）」）——D>F 取齐，零语义新增。
- **🔵 记录层旧文面**：本档 §2 表体旧行（`:73` / `:92` / `:93` / `:112`）与 §3 订正块（`:127` 起「本块为准，上文行文不改」）并存——**append-only 惯例内 ⇒ 不处置**，仅记录（提醒单独翻 §2 表体者先读订正块）。

### 父侧裁定（2026-09-16 · 评审 #4 轮次 3 的 🔴 收正）

评审 #4 判 **changes-required**（1🔴）：本批 §6.20.3 接线点① 改写的「回合收尾清池」分支，在**母档** `docs/core/design/AGENT-LOOP.md:204` 仍作「无条件清 `_asyncSubagents`」表述，
而 §6.20.4 受影响文件表未含母档 ⇒ 落地后同一机制两处互斥。

**父侧当场收正（小修改口径 · 已打标）**：母档 `:204` 该句改写为「**只清已死条目**（`discardAbortedPool` / `discardAbortedAdvisors`）；存活 / 已 settle 条目留池；死条目写 `discarded` 墓碑 + 一条整批提醒」+ 挂指针 → `AGENT-LOOP-SUBAGENT.md` §6.20（D4 指针形态）。

**评审 #4 其余项（建议面，随实施轮 / 收口处置）**：U9 前提绑生产者（🟡）· 用例表补接线点② 桩例行（🔵）· escalate 族归属登记（🔵）· R24a 读数刷新（🔵，含 `suspension-drive.mjs` 已越 300 软线）。

## §2 批次任务（eng-designer）

### 批次任务书（eng-designer · 2026-09-15）

**目标**：CLI 侧中止分支清池与 VSC 侧对称——被丢弃的后台子代理 / 评审条目留终态墓碑、出池、整批一次提醒、一条 `ev:discarded`；并把依赖终态判据（C-6）同批收口。
**为什么**：CLI 侧 `discarded` 在 `thincoder-core/**` + `thincoder-cli/**` 全仓零命中（实核）⇒ 中止后模型只能猜「后台报告到没到」；台账 `docs/TODO.md` 技术待办一条（§1 条目 1）。

#### 本批条目（三方一致：本条 ↔ 设计档 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20 验收回指 ↔ 需求档 `docs/core/requirements/AGENT-LOOP.md` §4.10）

| # | 条目 | 判据（可机检） |
|---|---|---|
| F1 | 丢弃判定单点复用（只清已死） | 判定 = `entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(ctx, entry) === true`——复用核 `thincoder-core/agent-tools/async-settle.mjs:130` 单点，**零新谓词** |
| F2 | 丢弃动作序（族三件套） | 每丢弃项：写 `discarded` 墓碑（`writeTombstoneTo`）→ 出池 → 汇总；整批：**一次** user 提醒注入 + **一条** `ev:discarded`（有丢弃才记，零丢弃零噪音） |
| F3 | 接线点两处 + 一处登记不接线 | ① `thincoder-core/agent/run-stages.mjs:168-170`（回合尾中止，双池）② `thincoder-cli/src/tui/suspension-drive.mjs:260-262`（挂起中止，双池）；③ `thincoder-core/agent/suspension.mjs:97-101` `finishSuspension` **不接线**（判据登记在档） |
| F4 | 依赖终态判据收口（C-6） | `thincoder-core/agent-tools/subagent-scheduler.mjs:124` `depInfo` 对 `discarded` 墓碑**不得**判 `ok`——依赖者走「报告不会到达」口径（非 AUTO 锁住 / AUTO 可启动） |
| N1 | 对称语义（零新语义） | 提醒文案 / 动作序 / 事件名与对侧 `thincoder-vscode/src/agent-tools/async-discard.mjs:37-44,70-87` 同源；CLI 与 VSC 若必须不同须显式登记端差 |
| N2 | 可机检 | 断言面 = 墓碑状态 / 出池后池内容 / 存活条目留池 / 提醒注入 / `ev:discarded` 计数 / 依赖终态非 ok |
| N3 | 尺度与可回退 | 触碰源档守 500 硬限，越 300 软线如实登记 + 拆分规划；改动 = 纯增量接线 + 单点判据，整批可回退 |

#### 明确不在本批（边界）

1. **VSC 侧零写入**（`thincoder-vscode/**` 与 `thincoder-vscode/docs/**`）——对侧已是对照基准；其与本批核内新档的重复实现收敛（核单源化）与装饰 / 悬空名退场 = **另案**（父侧登记）。
2. 不接线收尾站③（`finishSuspension`）——判据见设计档 §6.20.1（carrier 形无注入目标）。
3. 不改 `subagent status` / 面板显示面（不新增 `discarded` 显示）；**不触碰** `thincoder-core/agent-tools/subagent-actions.mjs`（488 行，贴 500 硬限）。
4. 不重定义丢弃 / cancel / failed 语义，不新增枚举值（`depInfo` 只改 `discarded` 一类归属）；不改台账、不改本档 §1、不改提示词实体。

#### 受影响文件（当前行数 as-of 2026-09-15 实核 / 预计增量）

| 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/async-discard.mjs` | —（新建） | +~120 | 核内单点：判定 / 墓碑 / 出池 / 汇总 / 提醒 / 事件；双导出 |
| `thincoder-core/agent/run-stages.mjs` | 244 | +4 / −3 | 接线点① |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 299 | +5 / −3 | 接线点②（落地后越 300 软线——如实登记 + 拆分规划） |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 394 | +2 / −1 | F4 判据（既有越 300 软线在案） |
| `thincoder-core/test/async-discard.test.mjs` | —（新建） | +~150 | 单点用例（正常 / 边界 / 错误） |
| `thincoder-core/test/async-family.test.mjs` | 177 | +~10 | F4 用例（discarded 墓碑 → 依赖终态） |
| `thincoder-cli/test/input-lock.test.mjs` | 204 | +~30 | 接线点② 桩驱动用例（`suspensionSession` 既有缝，`:14` import） |
| `thincoder-cli/test/integration/subagent-lifecycle.test.mjs` | 167 | +~45 | 业务可观察集成用例（集成资产面） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 272 | +~150 | §6.20 设计层 + R24a 行数更新 + 变更记录 |
| `docs/core/requirements/AGENT-LOOP.md` | 186 | +~22 | §4.10 需求条目 |
| `docs/batches/2026-09-15-cli-async-discard.md` | 64 | 各段 | §2（本次）/ §3 §5 §6 由各自作者追加 |

#### 验收标准（逐条回指条目；可机检）

| # | 验收 | 回指 |
|---|---|---|
| A1 | 中止时已死条目出池 + 墓碑 `status = "discarded"`；存活条目与 done-in-pool 留池 | F1 |
| A2 | 提醒**恰好一次**（user 注入，含丢弃数与名单）；`ev:discarded` **恰好一条**；零丢弃时二者皆无 | F2 |
| A3 | 接线点①② 生效（中止路径产出 A1/A2 结果）；`thincoder-core/agent/suspension.mjs` 文件零改动 | F3 |
| A4 | `depInfo` 对 `discarded` 墓碑不再返回 `ok`；依赖者非 AUTO 走 depc、AUTO 可启动 | F4 |
| A5 | 文案 / 动作序 / 事件名与对侧同源（逐字模板在档）；差异清单为空或已显式登记端差 | N1 |
| A6 | 用例表逐条有对应断言；`lint` / `test:full` / `test:integration` 全绿 | N2 |
| A7 | 触碰源档行数 ≤500 硬限；越软线档在档内如实登记（含拆分规划） | N3 |

#### 交付报告要求（eng-coder）

交付表逐条对 F1–F4 / N1–N3（✅ / ⚠️ / ❌ 三态，无「defer」列）；附：改了哪些文件（file:line）/ 怎么验证（命令 + 结果）/ 未决与偏差。**本节 + 设计档 §6.20 为任务书**——偏离即停下打回，不自行改语义。

**本段交付确认（2026-09-15 · eng-designer）**

- ② 设计档已落地：`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20（含 R24a 档位节 + 变更记录一行）。
- ① 需求档条目已落地：`docs/core/requirements/AGENT-LOOP.md` §4.10（F1–F4 / N1–N3）。
- **计数口径**：本段表内「当前行数 / 预计增量」为**落地前估算**；落地后实测值见设计档 §6.20.4（本档 272 → **440 行**；需求档 186 → **207 行**）。条目编号面（F1–F4 / N1–N3 ↔ A1–A7）无变化——三方一致照旧。

**计数订正（eng-designer · 同上）**：上条「本档 272 → 440 行」为增量后、订正行落笔**前**的瞬时值；两档写毕实测 = 设计档 **442 行**（需求档 **207 行**）。三方条目面（F1–F4 / N1–N3 ↔ A1–A7）不受行数订正影响。三档当前 >300 字符长行 = 0（批次档 §1 条目行除外——非本角色写域）。

**§3 修正轮订正（2026-09-16 · eng-designer——评审轮 1 十二发现落地后的口径对齐；本块为准，上文行文不改）**

- 条目编号面（F1–F4 / N1–N3 ↔ A1–A7）**零变化**——三方一致照旧；以下仅订正被修正的行文口径。
- F1 行（本表 :72）`parentAborted(ctx, entry)`：本批接线口径定为 **`parentAborted(null, entry)`**（controller 支——与对侧有效判据同判；候选对比与理由见设计档 D-AD6；评审 #3 / #4）。
- F2 行（本表 :73）写点 `writeTombstoneTo`：改为 **`writeTombstone`**（载体吸收单点——避免 CLI 载体形下写 / 读分叉致 F4 失效；**评审 #1 硬门**）。
- A6 行（本表 :112）：补**核用例执行入口 = `thincoder-core` 下 `node --test`**（CI 同式 `.github/workflows/test.yml:36-46`；CLI 三命令不覆盖核用例；评审 #2）。
- 受影响文件表：`async-discard.mjs` 估算统一 **+~130**（原 :91 行 +~120 作废）；`run-stages.mjs` / `suspension-drive.mjs` 预计 **+3 / −3（含 import 行——净 ≈0）**（原 :92 / :93 行 +4/−3 · +5/−3 作废）；`suspension-drive.mjs` **贴 300 软线未越**（原 :93「落地后越 300 软线」句作废——以设计档 §6.20.4 为准；拆分规划保留；评审 #3 / #9）。
- 本档 :66「`discarded` … 全仓零命中」：收窄为**丢弃墓碑状态 / 提醒文案**零命中（该词在核内另有 4 处其他语义出现——机制面零命中成立；评审 #8）。
- 行数订正再续（接上方「计数订正」块）：设计档评审修正轮 1 后再实测 = **450 行**（批前 272）；需求档仍 **207 行**（本轮未改）。
- 用例前提与残差登记（评审 #1 / #5 / #7 / #11 / #12）：U9 墓碑 Map 次序前提 · U7 直调前提 · 队列 `position` 重编号与 ⟦ev⟧ 块头残差 · D-AD8c status 回显面 · consult 族残留 · 对侧 `thincoder-vscode/docs/design/AGENT-LOOP.md:751` 行更新归父侧另案——均已落设计档 §6.20.1 / §6.20.3 / §6.20.6 / §6.20.8。

**机检卫生收尾订正（2026-09-16 · eng-designer——修正轮 1 机检卫生轮终态；本块为准，上文行文不改）**

- 行数终值：设计档 = **457 行**（订正上块「450」；链 = 450 → 修正轮内后段落笔 +4 → 454 → 机检卫生 +3（折行 +2 · 变更记录行 +1）→ **457**）；设计档三处活读数（§6.20.4 表 · R24a 节 · 变更记录）同值。需求档 **207 行** 不变（本轮未触碰）。
- 机检读数（as-of = 本收尾轮实跑，2026-09-16）：**宽度** `check-doc-width.mjs` = 本档 0 行超 300；闸 FAIL 由 4 存量档承载（`2026-09-15-check-tooling-debt.md:205` · `core-defect-fixes.md:189` · `doc-contract-reconcile.md:221` · `eng-discipline-prompts.md:214`——他批写域，不入本批）。
  **锚** `doc-anchors.mjs --domain .` = 闸态悬空 10（全为前向引用——用户 2026-09-16 04:28 裁定非缺陷）；本档 4 条 = `:364`/`:409`（引 `thincoder-core/test/async-discard.test.mjs`）· `:378`/`:442`（引 `docs/core/design/AGENT-LOOP-DISCARD.md`）；**「零新增（非前向引用类）」口径达成**（本轮消 1 条：§6.20.1 裸短路径 → `thincoder-core/` 全限定）；符号·宽报告面 583 条不入闸。
  **台账** = 0 违规（基线空）。
- 引证复核：`thincoder-cli/src/tui/key-handler.mjs:83`（会话 controller 先中止 → `:86` 唤醒 driver ⇒ 收尾晚于中止）· `thincoder-core/agent-tools/async-settle.mjs:88-98`（`bindChildController` 双路）——与设计 §6.20.3 文本对齐；变更记录折行位「:333」→「:334」勘正（现状帧计）。
- 条目面（F1–F4 / N1–N3 ↔ A1–A7）**零变化**——三方一致照旧。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：设计（批 4 CLI-ASYNC-DISCARD）——`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20 + `docs/core/requirements/AGENT-LOOP.md` §4.10 + 本档 §2。
**评审范围限制**：无文档地图声明（Document ownership 维度降级——按 Project Guide 判落点）；无项目标准档声明（方法论合规按 Project Guide + 评审维度判）。
**发现计数：🔴 1 / 🟡 5 / 🔵 6**

| # | 类别 | 严重级 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | Requirements / Feasibility | 🔴 | §6.20.3:313 指定墓碑写点 `writeTombstoneTo(parent.history ?? parent, …)`——该 holder 表达式是 **VSC 载体形**写法。VSC 在 depth-0 run 起始把 `agent._asyncTombstones` 定为 history 字段的**访问器别名**（`thincoder-vscode/src/agent.mjs:39-43` · `:137-150`），故其写/读同一 Map；CLI 无此绑定（`thincoder-core`/`thincoder-cli/src` 全仓无 `_asyncTombstones` 绑定命中），载体形 = **字段挂 agent**（`thincoder-core/agent-tools/async-settle.mjs:50-54`）。`writeTombstoneTo`（`:61-65`）无「借用」逻辑，而读取单点 `tombstoneOf`（`:75-78`）经 `carrierField` **父对象优先** ⇒ 只要本会话先出现父形态墓碑写入（报告注入即写 consumed / cancel——`thincoder-core/agent-tools/subagent-async.mjs:372` · `:198`），丢弃墓碑就落在 `agent.history._asyncTombstones`，与 `agent._asyncTombstones` 分叉；F4 的 `depInfo`（`thincoder-core/agent-tools/subagent-scheduler.mjs:123`）读不到 ⇒ 返回 `unknown` ⇒ `describeBlockers`（`:138`）归「依赖未完成」，依赖者 **wait 而非 depc**（A4 不成立，且比现状更差）。CLI 用例树亦以 `agent._asyncTombstones` 读墓碑（`thincoder-cli/test/integration/subagent-lifecycle.test.mjs:162`）——佐证 CLI 侧账本在 agent 上。 | 写点走**带载体吸收的父形态单点**（或在接线点把写 holder 与读面绑为同一容器）；并让 U9（§6.20.6:397）夹具复现「载体自有墓碑 Map 已存在」的次序——否则用例在「丢弃先写」的次序下会假绿。 |
| 2 | Acceptance criteria | 🟡 | A6（§6.20.7:416）的三条命令与用例落点不匹配：U1–U8／U9 落在 `thincoder-core/test/**`，而 `lint`＝`scripts/check-syntax.mjs`、`test:full`／`test:integration` 只 glob CLI 包 `test/*.test.mjs`（`thincoder-cli/package.json:36-43` · `test/run-fast.mjs:19` · `run-full.mjs:9` · `run-integration.mjs:17`）；核测试由 CI 另跑（`.github/workflows/test.yml:36-46` `node --test`）。按 A6 字面执行可「全绿」而未跑过任何新单元用例。 | A6 补核侧执行入口（`thincoder-core` 下 `node --test`）或声明核用例的验收执行人/命令。 |
| 3 | Clarity | 🟡 | §6.20.3 内部抵触：判定单点段写「接线点②走 controller 支（该处 `agent._sessionAbort` 已置 null）」（:310-311），同节接线点②却写「`:248` 处先捕获 `abortSignal` … `{ signal: abortSignal }`」（:334-338）。两说不能同真；且实际调用点（:258-262）在 `:253` 置 null **之后**，捕获值本就在手。 | 统一接线点②的判据输入口径（显式 signal 还是 controller 支），删去成因已不成立的括注。 |
| 4 | Symmetry / 端差登记 | 🟡 | D-AD6（:381）称「语义同源 = 同一 `parentAborted` 单点」，但**对侧有效判据 = controller 支**：对侧 `discardable` 传的是死参（`thincoder-vscode/src/agent-tools/async-discard.mjs:49-56` 自述「核建条目无 `signal` 字段 ⇒ 实为死参」），核侧显式回合 signal ⇒ 在「ctx.signal 非 interrupt 中止 ∧ 条目 controller 未中止」的角落，核侧丢弃 / 对侧保留**结果不同**（核侧此处会丢存活子代报告 = 对侧注释所述孤儿形态）。该角落未登记为端差（§6.20.3:324-327 只列 D-AD8a/b）。 | 把 ctx 来源差异显式登记（含「与现行清场口径一致」的取舍理由），或收窄判据使两端同判。 |
| 5 | Symmetry / 端差登记 | 🟡 | **status 回显面不对称未登记**：对侧丢弃 id 经 `subagent status` 回显 `discarded`（`thincoder-vscode/src/agent/setup.mjs:226-227` 墓碑回读；对侧用例 T-D8／T-D13，`thincoder-vscode/test/async-parity.test.mjs:293` · `:436`），CLI 侧除 `depInfo` 外**零墓碑读取调用点**（grep 全仓：仅 `subagent-scheduler.mjs:123`）⇒ 丢弃 id 在 CLI 状态面依旧不可见。设计仅以边界项写「不改 status 面、不新增 `discarded` 显示」（:423），未按 N1 登记端差。 | 按 N1 登记该端差与后续收敛方向（或明示「CLI 无 status 墓碑面 ⇒ 本条不适用」）。 |
| 6 | 范围协调（R5） | 🟡 | 批次 §1 输入 #3 的坐标 `thincoder-vscode/docs/design/AGENT-LOOP.md:740` 实为 **§12.8 #2 行 `:751`**（内容「CLI 面无丢弃提醒与丢弃终态记录 … 登记（CLI 属他批/后续批）」）；本批即该后续批 ⇒ 落地后该注过时。输入 #4（§1:43）要求设计轮先按现状实核重锚，设计 §6.20 未提该登记面（VSC 零写入 ⇒ 更新责任归父侧另案）。 | 父侧另案登记该行更新（或在 §6.20 加一句协调项指针），避免对侧登记面过期。 |
| 7 | 残留登记 | 🔵 | consult 族在两接线点仍**静默**清场（`cleanupConsultSessions`，§6.20.8:424「不改 consult 族清场」）——无墓碑、无提醒；设计只按「已知残留」登记了收尾站③（D-AD5），本条未同口径登记，A3「任一 Stop 路径均不静默」对 consult 族不成立（需求句只点子代理/评审，且与对侧一致 ⇒ 不阻塞）。 | 按 D-AD5 同口径补一行已知残留（或明示需求面只覆盖两池）。 |
| 8 | 文档卫生（R7c） | 🔵 | 「`discarded` 在 `thincoder-core/**` + `thincoder-cli/**` 全仓零命中」（§6.20.1:271；本档 §2:66 同句）**字面不成立**：`thincoder-core/agent.mjs:398`、`tools/bash.mjs:158`、`memory/code-sync.mjs:158`、`prompts/discipline-normal.md:169` 及 CLI 两设计档均有该词。 | 收窄为「无 `discarded` 墓碑状态 / 提醒文案」（机制面零命中）。 |
| 9 | 文档卫生（R7c） | 🔵 | 数字漂移包：① §6.20.4 表脚注（:363）称「本表行数为 as-of 落笔实测」，但本档行 `64`（:361）非实测——该档 §1+§2 已落，现值 ≥130 行；② 新档估算两处不一（本档 §2:91 `+~120` vs 设计 §6.20.3:302 `预计 ~130 行`）；③ 抽检部分行数与读取工具口径差 1（`run-stages.mjs` 245 vs 244 · `suspension-drive.mjs` 300 vs 299 · `input-lock.test.mjs` 205 vs 204；`subagent-actions.mjs` 488 · `async-family.test.mjs` 177 · `subagent-lifecycle.test.mjs` 167 · `async-discard.mjs` 126 · `async-settle.mjs` 279 相符）——档位结论不受影响（`suspension-drive.mjs` 无论如何越 300 软线，拆分计划在 §6.20.4:367 已登记）。 | 表脚注限定「实测 = 本档/需求档两行」，或把批次档行改为「各段追加（不计入增量）」。 |
| 10 | 引用精度 | 🔵 | §6.20.6:405 把「断言语义 = 行为面 / 禁散文锚」引作 `docs/core/requirements/TESTING.md` §2——§2 = 分层与寿命（F1–F14，`:16-33`），禁令本体 = F19（同档 §5.2 `:105`）；§2 指针只支撑同句的寿命分类。 | 双指针（生命周期 → §2；行为面禁令 → §5.2 F19）。 |
| 11 | 用例边界 | 🔵 | U7（:395）期望「`{}` 条目保守判不丢弃」只在 ctx 无中止 signal 时成立：`parentAborted` 的 ctx 支（`async-settle.mjs:130-133`）不校验条目本身，故 ctx 已中止时 `{}` 会被判丢弃 ⇒ 墓碑键 `String(undefined)`、名单出现 `undefined#undefined`。 | U7 显式固定夹具前提（ctx 未中止），或补一条 ctx 已中止下的形态断言。 |
| 12 | 状态一致性 | 🔵 | 队列剔除（D-AD4 / §6.20.2 轴 8）只滤 id：存活 queued 条目的 `entry.position`（`thincoder-core/agent-tools/subagent-run.mjs:187` 写）不重编号，而重编号唯一路径 `refreshQueuedTokens` 在两接线点未被调用 ⇒ 面板/status 的 `queued · position N` 与队列内容不一致（该面被列为不改，但状态会漂）。 | 在模块内或接线点补一次队列态刷新，或登记为已知的显示面残差。 |

**VERDICT: changes-required**（存 1 条 🔴——第 1 条须在设计层收正后方可进入用户批准/实施）

**计数**：🔴 1 · 🟡 5 · 🔵 6（共 12）

### 轮次 2（评审子代理）

**评审对象**：设计（批 4 CLI-ASYNC-DISCARD）· 修正轮后复审（轮次 2）——`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20（今 457 行）+ `docs/core/requirements/AGENT-LOOP.md` §4.10（207 行）+ 本档 §2。逐条核验轮次 1 的 12 发现（三档全文重读；本档 §2 的订正块为「本块为准，上文行文不改」惯例所许）。
**范围限制**：本轮指令面的「review surface」行写 `docs/cli/design/ACP-CLIENT.md`，与机械声明目标（本批三档）不一致——按声明执行（该档头部 40 行实读与本批丢弃面无关）。

**逐条核验（11 条全落地 · 1 条部分落地）**

| 轮次1# | 状态 | 本轮实读证据（现状行文） |
|---|---|---|
| 1 🔴 | ✅ 已消解 | §6.20.3:317 改 `writeTombstone(parent, …)`（载体吸收单点，注明「父对象无自有 `_asyncTombstones` 而 `history` 有 ⇒ 借用同一 Map，不另建分叉」）；:318 明文**禁用** `writeTombstoneTo(parent.history ?? parent, …)` 并写明分叉机理；U9（:406）夹具次序前提在位（「先经 `writeTombstone` 落一条父形态既有墓碑」） |
| 2 🟡 | ✅ 已消解 | §6.20.7:425 A6 补「核用例入口 = `thincoder-core` 下 `node --test`（CI 同式 `.github/workflows/test.yml:36-46`——CLI 三命令不覆盖核用例）」 |
| 3 🟡 | ✅ 已消解 | :313「**本批两接线点均不传 `ctx`** ⇒ 判据 = controller 支」· :339/:343 两接线点调用形均 `discardAbortedPool(agent)`「不传 ctx」；原「② 走 controller 支（`_sessionAbort` 已置 null）」与「先捕获 `abortSignal`」的双说已删，:344 改为「:248 判据行…在 :253 置 null 之前——既有写法已安全…不变」 |
| 4 🟡 | ✅ 已消解 | D-AD6（:390）重写为「判据口径 = controller 支，两接线点均不传 ctx（收窄消差——两端同判）」，并登记候选 1 否决理由（显式 ctx.signal 支会把存活子代当死条目丢弃）；A5（:424）同步写入「判据口径 = controller 支（与对侧同判）」 |
| 5 🟡 | ✅ 已消解 | :334 新增 **D-AD8c status 回显面（评审轮 1 #5）**（对侧 `setup.mjs:226-227` 回读 / T-D8·T-D13）· :336 取舍 + 收敛方向 · D-AD8（:392）扩为 a·b·c · 边界 §6.20.8-3（:433）指回 D-AD8c |
| 6 🟡 | ✅ 已消解 | §6.20.8-1（:431）登记**协调项**：对侧登记行 `thincoder-vscode/docs/design/AGENT-LOOP.md:751` 本批落地后过时、更新归父侧另案，并注明 §1 输入 #3 所载 `:740` 为旧坐标 |
| 7 🔵 | ✅ 已消解 | §6.20.1:287 新增**已知残留（consult 族）**段 + D-AD5（:389）同口径（「均登记为已知残留」） |
| 8 🔵 | ⚠️ **部分落地** | 设计 :271-272 已收窄且枚举**逐条实核正确**（核内 4 处：`agent.mjs:398` · `tools/bash.mjs:158` · `memory/code-sync.mjs:158` · `prompts/discipline-normal.md:169`；CLI `src/**` 零出现；两处设计档 = `AGENT-LOOP.md:100` · `TUI-TOOL-OUTPUT.md:43`）、本档 §2:134 已订正；**但需求层未收窄**（见下「剩余问题」#1） |
| 9 🔵 | ✅ 已消解 | §6.20.4:372 脚注改写为行数口径说明（`wc -l` 同口径 + 读取工具尾行 +1 说明）、本档行改「—（各段追加，不计入增量）」；新档估算统一 +~130（:293/:305/:360）；两接线点增量改 +3/−3（含 import 行）+「贴 300 软线」口径（:361-362，与 §2:133 一致） |
| 10 🔵 | ✅ 已消解 | §6.20.6:414 双指针（寿命分类 → `requirements/TESTING.md` §2；行为面禁令 → 同档 §5.2 F19） |
| 11 🔵 | ✅ 已消解 | U7（:404）补前提「前提 = ctx 未中止（直调——接线口径不传 ctx）」 |
| 12 🔵 | ✅ 已消解 | :318 队列剔除含「存活条目 `position` 重编号——与取消路径 `subagent-async.mjs:190` 同式」；:353-354 登记 ⟦ev⟧ 块头残差（`refreshQueuedTokens` 需 `onToken`，随下一次队列事件自然重发）；U6（:403）补重编号断言 |

**新增面核查（本修复引入）**：D-AD6 改判据后，接线点② 依赖「Stop 时子代 controller 已逐链中止」——实读 `thincoder-cli/src/tui/key-handler.mjs:83: for (const c of agent._sessionAbortAll ?? (agent._sessionAbort ? [agent._sessionAbort] : [])) c?.abort({ abortTrigger: "stop", abortDetail: "session-stop" })` 与 `:78`
  （回合平 abort，无 interrupt）⇒ 设计 :345 断言成立，判据收窄不产生新缺口；
  interrupt 场景由 controller 未中止自然零丢弃（与 §6.20.3:314 一致）。无新增缺陷。

**剩余问题**

| # | 类别 | 严重级 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档状态滞后（R7a·跨层） | 🟡 | 轮次 1 #8 仅在设计层 / 本档落地：需求层仍留未收窄句——`docs/core/requirements/AGENT-LOOP.md:174: \`thincoder-cli/src/tui/suspension-drive.mjs:260-262\`），且 \`discarded\` 在 \`thincoder-core/**\` + \`thincoder-cli/**\` 全仓零命中。` 与设计 §6.20.1:271-272 的收窄表述（该词另有 6 处其他语义）矛盾（D > F ⇒ 设计层为准）。不影响机制与实现，不阻塞。 | 父侧按 D>F 收正需求层 :174 措辞（收窄为「丢弃墓碑状态 / 提醒文案零命中」）。 |
| 2 | 记录层文面（低） | 🔵 | 本档 §2 上文行文未改（`:73` 仍写 `writeTombstoneTo` · `:92`/`:93` 仍写 +4/−3 · +5/−3 · `:112` A6 未含核用例入口），由 :127-136 订正块 supersede——项目 append-only + 「本块为准」惯例内，非缺陷；仅供单独翻阅 §2 的读者注意。 | 无需处置（若后续轮次重写 §2 表体时并入即可）。 |

**VERDICT: pass**（0 🔴——轮次 1 的 🔴#1 已按「核内载体吸收单点 + U9 夹具次序前提」双件落地并实核消解；修复未引入新 🔴）

**计数**：轮次 1 = 🔴1 / 🟡5 / 🔵6（12）；剩余 = 🔴0 / 🟡1 / 🔵1；落地 = 11 条全消解 + 1 条部分落地（#8 需求层）。

### 轮次 3（评审子代理）

**评审对象**：设计（批 4 CLI-ASYNC-DISCARD）· 全量复核（轮次 3）——`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20（457 行）+ `docs/core/requirements/AGENT-LOOP.md` §4.10（207 行）+ 本档 §2（含三处订正块）。声明聚焦面 = 墓碑写点 = 核内载体吸收单点 `writeTombstone`（禁用旧形）+ U9 夹具次序前提 · 判据口径 = controller 支（两接线点不传 ctx，D-AD6）· 端差登记 D-AD8a/b/c。
**范围限制**：无文档地图声明（Document ownership 按 Project Guide + 评审维度判）；无项目标准档声明（方法论合规按 Project Guide 判）。
**声明三项实核结论（全部在位且语义成立）**：① §6.20.3:317 `writeTombstone(parent, …)` 与 `thincoder-core/agent-tools/async-settle.mjs:68-72`
（`carrierField` 吸收 = 父对象无 Map 而 `history` 有 ⇒ 借用同一 Map）逐字相符；:318 禁用旧形句在位；② U9 次序前提在位（§6.20.6:406）；
③ :313 / :339 / :343 两接线点调用形不传 ctx，`parentAborted(null, entry)` 实走 controller 支（`async-settle.mjs:130-134` 语义核）。
D-AD8a（`context.mjs:184-194` 机器线 + 人读线 / 对侧 `async-discard.mjs:83` 直 push）· D-AD8b（`helpers.mjs:89` 仅转义插值 / 对侧整条转义）·
D-AD8c（对侧 `setup.mjs:226-227` 回读 + T-D8 `async-parity.test.mjs:293` · T-D13 `:436`；CLI 侧墓碑读取点唯 `subagent-scheduler.mjs:124`）逐条成立。
**发现计数**：🔴 1 / 🟡 2 / 🔵 4（共 7）

| # | 类别 | 严重级 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | Document ownership / 机制级互斥 | 🔴 | 收正集漏母档：`docs/core/design/AGENT-LOOP.md:204` 现存「回合收尾清池分支（`aborted && !interrupt` → **无条件清 `_asyncSubagents`**）」——正是本批 §6.20.3:339（接线点①，`run-stages.mjs:164` 同判据）改写的那条分支；落地后同一机制两处互斥（「无条件清」vs「只清已死——存活 / 已 settle 留池」）。§6.20.4 受影响文件表（:358-370）只列本档 + 需求档，§6.20.8 边界六条亦未提该行（同批却登记了对侧档 `thincoder-vscode/docs/design/AGENT-LOOP.md:751` 协调项——:431）。已核无矛盾：§6.8:148「全停（清池…）」（全停 ⇒ key-handler 逐链中止全部 controller ⇒ 全为死条目 ⇒ 池实为空）· `LOGGING.md:77/:80`（`ev:stopped` 语义未变）· `suspension.mjs`（收尾站③不接线，原句仍准）。 | 把母档该行纳入本批文档收正集（受影响文件表补行 + 同步其同节其余句），或**显式登记为具名协调项**（与 :431 对侧行同式）——二者任一即可消矛盾；评审只报不改（母档不在本轮三档声明域，按 Document ownership 维度作证据面引用）。 |
| 2 | Acceptance / 验证强度（U9） | 🟡 | U9「夹具次序前提」（§6.20.6:406）只钉住读 / 写**同点同容器**，未钉住**写入者**：用例表无一条在「载体已有父形态 `_asyncTombstones` **且** `history` 在场」的夹具上驱动生产入口（`discardAbortedPool` / `discardAbortedAdvisors`）——而 §6.20.3:318 的禁用句（`writeTombstoneTo(parent.history ?? parent, …)`）恰只有该夹具才可判别（单点实读：`async-settle.mjs:68-78`，`tombstoneOf` 经 `carrierField` 回退 `history`）；按现表形状，U1（:398）夹具无既有父形态 Map ⇒ 禁用形同样满足 A1（§6.20.7:420）。 | 用例表行内把前提绑到生产者（明写「丢弃墓碑由接线入口产出」），或补一例「先落父形态墓碑 → 走生产入口 → 断 `tombstoneOf` / `depInfo`」；否则「禁用旧形」缺机械守门（不影响设计正确性——写点本身已正确收窄）。 |
| 3 | 文档状态（R7a / R7c） | 🟡 | 本档 :7 状态头仍写「设计轮待发（……设计评审未发起）」，与 §2（任务书 + 三订正块）· §3（两轮评审已落）脱节；且核侧实现与核用例已落盘而 §4 / §5 / §6 空（域外观察见下）。 | 父侧写 §4–§6 时同批收正状态头（纯文案，零语义）；R7e——不因文档状态矛盾卡通过。 |
| 4 | 用例表完整性（可核性） | 🔵 | 接线点② 的桩驱动用例只出现在落点（§6.20.6:410「`input-lock.test.mjs`（扩，桩驱动 `suspensionSession`，`:14` import）」）与受影响文件表（:366「+~30」），**用例表无编号行**（输入 / 期望输出 / 回指皆缺）⇒ A3（:422）的 ② 半边与 A6「用例表逐条有对应断言」无机械载体（I1 :407 走真管线 + 父回合中止，覆盖的是 ① 侧语义）。 | 补一行编号用例（或把该桩例的输入 / 期望 / 回指写进行内），使 A3 / A6 对 ② 有对象。 |
| 5 | 族边界登记 | 🔵 | 两接线点按**池**作用（`getAsyncPool` 对 role ∉ {advisor, consult} 一律返 `_asyncSubagents`——`async-settle.mjs:106-109`）⇒ escalate 族条目同被判丢弃、写 `discarded` 墓碑，并进入「background subagent(s) … re-spawn if the work is still needed」措辞的提醒（名单含 `escalate#N`）；§6.20.1 只登记了 consult 族与收尾站③（:285-287），未提 escalate 归属（与对侧同形 ⇒ 非端差）。 | 同口径补一行已知归属 / 措辞说明；并核对 `docs/core/design/ESCALATE.md:86`「aborted → 出池丢弃（中止清池不注入）」措辞是否需随批校准（报告类注入 ≠ 报告注入）。 |
| 6 | Criterion 8 / 数字与坐标抽检 | 🔵 | 本轮实读（`wc -l` 同口径）与设计表标注不符：`suspension-drive.mjs` **现 301 行**（末行 `}` = `:301`）——:362 标「**299** · 贴 300 软线**未越**」⇒ 该断言现状不成立（已越 300 软线；拆分计划 :376 已在册 + `thincoder-cli/test/doc-consistency.test.mjs:261` 只守 ≤500 ⇒ **A7 仍成立**）；`run-stages.mjs` 现 246（标 244）· `subagent-scheduler.mjs` 现 398（标 394；拆分计划行记 ~396）· `async-family.test.mjs` 现 202（标 177 + ~10）· 新档 `async-discard.mjs` 139（估 ~130）；另 `refreshQueuedTokens` 坐标标 `subagent-scheduler.mjs:327-340`，实读函数体 `:332-345`（§6.20.3:354 同句）。**未核项**：上述差值是否全由本批实施引入（本轮未见 §5 实施记录 ⇒ 标注 unverified）。 | 实施记录 §5 同批刷新 R24a 读数（含「`suspension-drive.mjs` 已越 300 软线」的档位句）并校正 :354 坐标。 |

**域外观察（不计严重级）**：本批核侧实现与核用例已落盘——`thincoder-core/agent-tools/async-discard.mjs`（139 行）· `agent/run-stages.mjs:17,171-172`（接线点①）·
`thincoder-cli/src/tui/suspension-drive.mjs:24,263-264`（接线点②）· `agent-tools/subagent-scheduler.mjs:126-128`（F4）· 核用例 `thincoder-core/test/async-discard.test.mjs`
+ `async-family.test.mjs:109-132`（U9）；CLI 侧两处用例面（接线点② 桩驱动 · I1）在 `thincoder-cli/test/**` 未见（该目录 grep `discard` 零命中；
`input-lock.test.mjs` 204 行 = 设计标注值、`integration/subagent-lifecycle.test.mjs` 167 行 = 设计标注值，均未见扩例）——本项属实施面，不在本轮设计评审声明域，供父侧协调（R5）。

**VERDICT: changes-required**（存 1 条 🔴——母档同机制互斥表述须先纳入设计收正集或登记为具名协调项）

**计数**：🔴 1 · 🟡 2 · 🔵 4（共 7）

### 轮次 4（评审子代理）

**评审对象**：设计（批 4 CLI-ASYNC-DISCARD）· 修正后复核（轮次 4）——声明聚焦 = 母档 `docs/core/design/AGENT-LOOP.md:204` 收正核验（同机制两处一致）；其余 🟡/🔵 作现状复核。范围 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20 · `docs/core/requirements/AGENT-LOOP.md` §4.10 · 母档全文 · 本档 §1–§3。
**🔴 收正核验（轮次 3 #1）= 已消解（实核）**：母档 `:204` 现文 = 「回合收尾清池分支（`aborted && !interrupt` → **只清已死条目**——`discardAbortedPool(agent)` / `discardAbortedAdvisors(agent)`）：
存活 / 已 settle 条目**留池**；死条目写 `discarded` 墓碑 + **一条整批提醒**（`subPool?.clear()` 式无条件清已废除——`AGENT-LOOP-SUBAGENT.md` §6.20）」
——与 §6.20.3 接线点① / 判定单点 / 动作序（零丢弃零噪音）/ D-AD6 逐元素一致；指针形态合规。
同节其余句实读无第二处清池表述；母档其余「清池/清空」命中（`:73` · `:118` · `:99` · `:207`）均为其他语义或收尾站③（本批不接线、§6.20.1 已登记）。
**范围限制**：无文档地图声明（Document ownership 按 Project Guide + 评审维度判）；无项目标准档声明（方法论合规按 Project Guide 判）。
**发现计数**：🔴 0 / 🟡 3 / 🔵 4（共 7）

| # | 类别 | 严重级 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | Document ownership / 母档记录层残留 | 🟡 | 收正在位且自洽，但母档同分支仍有两处「清空」表述：`:41`（§2.2 #111 前提校验列「中止时 CLI 清空子代理池 `:168-169` / VSC 只清已死 `:296-297,312-313`」）与 `:133`（§3.1 A23 左端行为列「中止时**直接清空**异步子代理池与评审池（`:168-169`）」+ 影响面②「被清还是被留」）。二者属**逐字搬入的审计 / 裁定行**（快照语境、引旧树坐标），故按记录层滞后判 🟡（R7a；非 R1 例外的机制级 🔴——活体机制描述已单源且一致）；但落地后该两行与 `:204`/§6.20 互斥，且 §6.20.4 受影响文件表未含母档。 | 按 §2 既有行内注解惯例（cf. `:36`/`:55`/`:56`/`:57`「已退役 / 现体 =」形）给该两行挂「2026-09-15 批 4：中止清池 → 只清已死 + 墓碑 + 提醒 → §6.20」；或按 §6.20.8-1 同式登记具名协调项。可选：§6.20.4 补母档行（纯 .md ⇒ 行数注解豁免）留痕。 |
| 2 | Acceptance / 验证强度（U9） | 🟡 | 轮次 3 #2 未变：§6.20.6 U9 行前提只钉「先经 `writeTombstone` 落父形态墓碑」的**次序**，未绑**生产者**；设计表内无「既有父形态 Map + 走生产入口」用例 ⇒ 禁用形（`writeTombstoneTo(parent.history ?? parent, …)`）按表列用例仍可通过（U1 夹具无既有父形态 Map）。 | 轮次 3 原建议：U9 行内明写「丢弃墓碑由接线入口产出」，或补一行编号用例；随 §5/§6 同步（实现侧已落 U9b——见域外观察）。 |
| 3 | 文档状态（批次档） | 🟡 | 本档 `:7` 状态头仍为「状态：设计轮待发（……§2 待 eng-designer；设计评审未发起）」，与 §2（任务书 + 三订正块）· §3（三轮评审已落）脱节；§4–§6 空。父侧轮次 3 余项清单（`:73`）未列本条。 | 父侧写 §4–§6 时同批收正状态头（R7e——不阻塞）。 |
| 4 | 用例表完整性（可核性） | 🔵 | 轮次 3 #4 未变：接线点② 桩驱动用例只出现在落点句（§6.20.6:410）与受影响文件表（:366），用例表无编号行 ⇒ A3 的 ② 半边 / A6 无表内对象。 | 补一行编号用例（输入 / 期望 / 回指），或写明该桩例并入 §5 记录。 |
| 5 | 族边界登记 | 🔵 | 轮次 3 #5 未变：两接线点按**池**作用（`getAsyncPool` 对非 advisor/consult 一律返 `_asyncSubagents`）⇒ escalate 族同被判丢弃 + 计进「background subagent(s)」名单；§6.20.1 只登记 consult 族与收尾站③，未提 escalate 归属。 | 同 D-AD5 / consult 残留口径补一行归属说明；并核对 `ESCALATE.md:86`「aborted → 出池丢弃」措辞（档外，父侧判）。 |
| 6 | Criterion 8 / 数字与坐标抽检 | 🔵 | 轮次 3 #6 未变，本轮实读（读取工具口径）：`suspension-drive.mjs` **301**（表标 299「贴 300 软线**未越**」——现已越；拆分计划在册 ⇒ A7 仍成立；本档 `:147` 同句同收）· `run-stages.mjs` 246（标 244）· `subagent-scheduler.mjs` 399（标 394；`depInfo` 现 `:112`、修点 `:127`；`refreshQueuedTokens` 现 `:332` vs 标 `:327-340`）· `async-family.test.mjs` 202（标 177 + ~10）· `async-discard.mjs` 139（估 ~130）· `input-lock.test.mjs` **268**（标 204 + ~30——实际 ≈ +64）· `subagent-lifecycle.test.mjs` **229**（标 167 + ~45——实际 ≈ +62）。 | §5 实施记录同批刷新 R24a 读数（含「已越 300 软线」档位句）；读数口径沿用 §6.20.4 脚注说明。 |
| 7 | Criterion 8 / 母档体量 | 🔵 | `docs/core/design/AGENT-LOOP.md` 现 **517 行**（>500 硬限；§9 自登记 +17、拆分候选「待裁定」）——本批收正集已就地触碰该档（净 ±0）。R3 挂债口径：不升级、不重复纠结。 | 下次实质改动该档时把候选拆分面并入裁定；本轮不需处置。 |

**域外观察（不计严重级）**：实施面已先于 §5 落盘——`thincoder-core/agent-tools/async-discard.mjs`（139 行；双导出 `:125`/`:136`）· 接线点① `thincoder-core/agent/run-stages.mjs:17,170-172`（注释挂 §6.20）·
接线点② `thincoder-cli/src/tui/suspension-drive.mjs:24,263-264` · F4 `thincoder-core/agent-tools/subagent-scheduler.mjs:109,127` ·
核用例 U1–U8（`thincoder-core/test/async-discard.test.mjs:84-212`）+ U9 `:110` / **U9b `:135-155`（标「评审轮 3 #2」——生产者绑定已在实现侧落）** ·
CLI 侧 `input-lock.test.mjs:212`（接线点② 桩例）· I1（`integration/subagent-lifecycle.test.mjs:212-222` 区：`(was queued — never started)` / `ev:discarded` 恰一条 / 存活送达）。
轮次 3「CLI 侧用例未见」观察已消解。另：`ev:discarded` 事件名是否需在事件词汇 / 日志档登记未能核验（unverified——档外，父侧判）。

**VERDICT: pass**（0 🔴——轮次 3 的母档机制互斥项已就地收正并实核消解；本轮修复未引入新 🔴；存 3🟡 / 4🔵 均不阻塞）

**计数**：🔴 0 · 🟡 3 · 🔵 4（共 7）

## §4 用户批准（主 agent）

2026-09-16 用户**总批准**（原话：「直接执行完，浪费了太多时间了」）——授权本波（批 1–5）在设计评审 pass 后直接推进实施与收口；本批据此进入实施（设计轮 pass 记录见 §3）。

## §5 实施记录（eng-coder）


**交付摘要**（分支状态：代码冻结；git 未提交——由父侧统一收口）

| 文件 | 状态 | 一行说明 |
|---|---|---|
| `thincoder-core/agent-tools/async-discard.mjs` | 新（138 行） | 丢弃收尾单点：两族 spec（subagent/advisor）+ 私有核 `discardRole`；导出 `discardAbortedPool` / `discardAbortedAdvisors` |
| 同上（行为契约） | — | 墓碑走 `writeTombstone(parent,id,"discarded",roleOf)`（库不导出 `writeTombstoneTo`）；动作序 = 墓碑 → 出池 → 队列剔除（存活 `position` 重编号 1..n）→ 汇总；整批恰一次 `pushReal`（user）+ 恰一条 `ev:discarded`；零丢弃 ⇒ 零注入零事件 |
| `thincoder-core/agent/run-stages.mjs` | 改（246 行） | 接线点①：回合尾中止分支的三行无条件清池 → `discardAbortedPool(agent)` + `discardAbortedAdvisors(agent)`（不传 ctx ⇒ controller 支） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 改（301 行） | 接线点②：挂起会话中止分支同改走单点；其余（`_pendingAsyncResults` 清场、consult 清场）零改动 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 改（399 行） | F4：`depInfo` 的丢弃墓碑归 `cancelled` 口径（`:127` 三态判前置行）；其余分支零改动 |
| `thincoder-core/test/async-discard.test.mjs` | 新（234 行） | U1–U8：只清已死 / 评审族 / 零噪音 / 载体缺失 / interrupt 豁免 / 队列重编号 / 残缺条目 / 提醒形态与转义 |
| `thincoder-core/test/async-family.test.mjs` | 改（225 行） | U9（F4 依赖口径）+ U9b（F1↔F4 生产者绑定） |
| `thincoder-cli/test/input-lock.test.mjs` | 改（267 行） | U10：接线点② 端到端（出池 + 墓碑 + 两族各一条提醒/事件 + 存活留池） |
| `thincoder-cli/test/integration/subagent-lifecycle.test.mjs` | 改（243 行） | I1：真回合中止集成（真调度器 + 真子代理管线；已死出池 + 墓碑 + 恰一条提醒/事件 + 存活条目仍能结算注入） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 改（462 行） | §6.20 设计节（动机 / 契约 / 动作序 / 受影响文件 / 用例表 / 边界 / 端差 D-AD8a-b-c） |
| `docs/core/requirements/AGENT-LOOP.md` | 改（207 行） | §4.10 需求节（F1–F4 + 验收；条目三处一致） |
| `docs/core/design/AGENT-LOOP.md` | 改（518 行） | 清池分支口径收正（只清已死；无条件清池已废除——§6.20） |
| `docs/batches/2026-09-15-cli-async-discard.md` | 新（288 行） | 本批任务书 §1–§3（§5 = 本段） |

**关键决策（本轮内）**：`async-discard.mjs:54` 判定行按设计字面对齐（`parentAborted(ctx, entry)`，去掉 `ctx ?? {}` 局部默认）——行为恒等（`parentAborted` null-safe，controller 支同判），纯字面对齐。

**内部偏离审计（第 1 轮 · read-only explore）**：0 功能面偏离 / 0 静默简化 / 0 超域未披露；1 🟡 = §5 空缺（即本段，已落）+ 5 🔵 文档漂移（下表《透明披露》第 3–5 条）。
逐条复核全绿：
A1 墓碑单源（CLI 树 `writeTombstoneTo` 零命中）· A2 两接线点均不传 ctx · A3 动作序与计数（队列剔除仅挂 subagent spec）· A4 F4 映射 ·
A5 清池洁净（全仓生产码 `_asyncSubagents.clear()` / `_asyncAdvisors.clear()` / `_asyncQueue = []` 零命中）·
A6 用例落点与 §6.20.6 表逐条吻合 · A7 尺度 · 模块图叶子向无环（`import` 面仅 async-settle / context / agent/helpers / log）。

**内部代码评审（第 1 轮 · advisor code）**：`VERDICT: pass`——0 🔴 / 2 🟡（均非 must-fix）/ 4 🔵。
验收回指逐条经实读核验成立（F1–F4 / N1–N3），并独立复核两处设计声明：两模板与对侧 VSC 逐字符同源；「controller 已中止 = 条目真死」前提成立（三族条目均持已链结 controller；CLI 回合信号经 `agent-turn.mjs:147` → `agent.mjs:426` 抵达 `finalizeAgentTurn`）。

**裁决表（评审发现 → 处置）**

| # | Action | Detail |
|---|---|---|
| 1 | Not an issue | 🟡 提醒/事件粒度：实现按池族各一次（`async-discard.mjs:94-95`），一次 Stop 双族皆有死条目 ⇒ 2 提醒 + 2 事件。设计用例表 U10（`AGENT-LOOP-SUBAGENT.md:411`「两族各一条提醒」）与对侧基准（VSC `async-discard.mjs:81-84` 同在 `discardRole` 内注入）同粒度 ⇒ 按 D>F 实现合规，属需求 F2 / 验收 A2「恰好一次」措辞未随设计收窄（文档面，见《透明披露》第 6 条）。 |
| 2 | Not an issue | 🟡 尺寸 advisory：`suspension-drive.mjs` 301 行 / `subagent-scheduler.mjs` 399 行越 300 软线——设计 §6.20.4 已登记 + 拆分计划在册，本批只登记不执行（R3）。 |
| 3 | Deferred | 🔵 `wait_for "subagent id:N done"` 面：丢弃条目出池后既有「不在池 = done」判据（`ops.mjs:169`）对该 id 报 done（vacuous-done，与 cancel 先例同形）。设计仅登记 `subagent status` 面端差（D-AD8c）——该消费面登记与否属设计者/父侧裁定，本批不扩面改判据。 |
| 4 | Deferred | 🔵 Stop 后池残留显示面：保留 done-in-pool / 存活条目 ⇒ 池可非空（`run-stages.mjs` 分支），`agent-turn.mjs:39` 的 `userNeededAtTurnEnd` 不再置 attention 位（数据零丢失，仅提示面残差）。需父侧判是否登记该显示面。 |
| 5 | Not an issue | 🔵 `pushReal` 使 `[System reminder: …]` 进人读线 + record store（`context.mjs:185-193`），与 `context.mjs:170-172` 声明的「机器线消息不经 pushReal / 不进 `_fullHistory`」形成语义张力；本批沿核内取消提醒三处先例（`async-settle.mjs:231/236/246`）且设计已登记 D-AD8a ⇒ 先例一致、非本批新偏离。若要统一，属四处同改的另案。 |
| 6 | Fixed | 🔵 I1 墙钟窗口脆弱面（R4）：原夹具靠 mock `(slow)` 500ms 维持存活条目在飞 ⇒ 高负载下可能先 settle。已改为**确定性闸门**（`openGate` marker + 显式 `release`；`setTimeout` 分支保留给既有兄弟用例不动）——`subagent-lifecycle.test.mjs:47-55` / `:74-77` / `:201-204` / `:231-233`；复跑 `npm run test:integration` = 26/26 ✓（I1 单例 662.1ms）。 |

**归册清点（D-T6 慢门——本批新增/扩写用例逐例实测）**

- 本批 0 条标 `slow()`。判据：门控作用于**快层**（`thincoder-cli/test/slow.mjs:14-18`：快层里 `slow()` 全 skip，「pass 且超阈」⇔ 未归册；归册线 500ms / 拦截线 800ms）。
- 逐例实测：core U1–U9b 最大 **21.9ms**（U1）· CLI 快层 U10 **48.8ms** · CLI 集成 I1 **662.1ms**。
- I1 不归册理由：集成层是独立重层（`npm run test:integration`，8 个集成档零 `slow()` 用法），不在快层扫描域；快层本批最大 48.8ms，远低于 500ms 归册线。
- 门红（非本批）：`advisor-chain-guards.test.mjs:476` T-CG18 1122.8ms · `ledger.test.mjs:135` T96 1455.9ms——两档均非本批 file 域，归属他批/存量。

**复跑读数（本批收口 —— 命令 + 结果）**

- `node --test`（thincoder-core）：**225 tests / 225 pass / 0 fail / 0 skipped**（12.8s）。
- `npm run test:integration`（thincoder-cli）：**26 tests / 26 pass / 0 fail**（36.3s）。
- `npm run test:full`（thincoder-cli）：**617 tests / 616 pass / 1 fail**——唯一红 = T-V5-15②（`test/doc-anchors.test.mjs:257` 断言 CLI 包自身 docs 树零悬空锚，实 37 ≠ 0；37 条全在 `thincoder-cli/docs/**` 遗留镜像树，git 未改、无本批内容）。
- 快层 `node test/run-fast.mjs`（thincoder-cli）：617 例 / **558 pass / 59 skipped / 0 fail**；D-T6 门红 = 上列非本批 2 例（本批用例全绿：U10 48.8ms）。
- 仓根悬空锚全域扫描：本批 3 个 docs 档 **0 悬空**。

**透明披露（超域 / 未改项 / 漂移 —— 逐条带理由）**

1. 越软线在册：`suspension-drive.mjs` 301 行（拆分候选 = finally 收尾块抽 `suspension-teardown.mjs`）、`subagent-scheduler.mjs` 399 行（拆分候选 = 依赖族抽 `subagent-deps.mjs`）——本批只登记不执行。
2. `docs/core/design/AGENT-LOOP.md` 518 行（>500）= 母档存量债（该档 §9 自登记），本批净 ±1 行（口径句改写）。
3. 设计档行数/坐标漂移（**设计档属 eng-designer，本角色未自改，交父侧/设计者处置**）：`AGENT-LOOP-SUBAGENT.md` 自身登记「实测 457」→ 现 **462**（+5）；`subagent-lifecycle.test.mjs` 登记「228」→ 现 **243**（+15，本轮评审修复 #6 引入闸门夹具）；§6.20.4 拆分坐标 `suspension-drive.mjs:246-266` 应作 `:248-284`（`finally` 起 `:248`）。
4. 批次档 §1 状态行陈旧（「状态：设计轮待发」）——§1 属主 agent，本角色只写 §5，未自改。
5. 对侧 VSC：本批**零写入**（红线遵守）；`thincoder-vscode/test/async-parity.test.mjs` 的 depInfo 钉子断言（discarded→ok）在 F4 落地后为红 = 对侧预期对齐项，归父侧另案（D-AD7 双实现重复 + D-AD8a/b/c 端差已登记）。
6. 需求 F2 / 验收 A2 的「整批一次提醒 + 一条事件」措辞与设计 U10（每族各一条）不一致——实现按设计 U10 / 对侧同源粒度落地；措辞收窄建议交设计层。

**终态：clean**（0 🔴 未决；无未落地的 Dispatched 行；1 轮审计 + 1 轮评审 + 1 轮修复已收敛）。

**§5 收尾补记（2026-09-16 · 收口会话 · 证据补强，代码冻结后复跑）**

- **两红归属（逐条机检实证）**
  1. CLI `npm run test:full` 唯一红 = `T-V5-15②`（`thincoder-cli/test/doc-anchors.test.mjs:257`，3807.6ms；断言「本仓扫描域零悬空锚」，实 37）。
     37 条**逐条枚举** = `thincoder-cli/docs/**` 11 档：design/AGENT-LOOP.md 8 · SETTINGS-TOOL.md 8 · LEDGER-SELF-CONTAINED.md 5 · 
     PROVIDER.md 4 · CONTEXT-COMPACTION.md 3 · LOGGING.md 2 · QUICKFIX-BATCH-3.md 2 · VERIFY-REDESIGN.md 2 · PORTABILITY.md 1 · TWO-REPO-MERGE.md 1（+:404）+ requirements/PORTABILITY.md 1；
     形态 = 旧树路径（`src/...`）与跨产品路径（`thincoder-vscode/src/...`）。**本批 3 个 docs 档零命中**，且 `git status` 中 `thincoder-cli/docs/**` **零修改** ⇒ 存量欠账、非本批引入（与 :340 判一致）。
  2. 跨时点 byte-identical：`anchors-cli.log`（23:30）与 `anchors-cli2.log`（23:54）sha256 `6aaa53641918d0bd` · 56580 bytes 全同 ⇒ 冻结后读数稳定（非抖动）。
  3. VSC 唯一红 = `T-D9`（`thincoder-vscode/test/async-parity.test.mjs:351`；fast 1.7ms / full 6.0ms）：断言 `discarded → depInfo = ok`，实得 `{state:"cancelled"}`；用例标题自标「§5 未决」⇒ F4 落地后**对侧待同步**（本批零写入；同《透明披露》第 5 条）。
- **慢门（D-T6）清点（复跑实测）**：快层本批 **0 未归册**（U1–U8 最大 21.9ms · U10 48.8ms；I1 662.1ms 属集成重层，不在快层扫描域）。
  门红均非本批：CLI fast 2 例（`advisor-chain-guards.test.mjs:476` T-CG18 1122.8ms · `ledger.test.mjs:135` T96 1455.9ms）；VSC fast **12 例**（全在 `thincoder-vscode/test/edit-tool-improvement.test.mjs:41/49/57/65/124/188/196/204/222/234/274/298`，800.1–2267.1ms——VSC 存量，本批零写入）。
- **他门读数**：CLI lint **182 档 OK** · 台账机检 **0 违规**（基线 0 条）· core `node --test` **225/225**（8.2s）· CLI `test:integration` **26/26** · 
  CLI fast **617 例 / 558 pass / 0 fail / 59 skipped** · VSC full **560 / 559 pass / 1 fail**（即 T-D9）· VSC fast **560 / 524 pass / 1 fail / 35 skipped**。
  `check-doc-width` **FAIL = 4 档 20 行**（`docs/batches/2026-09-15-{check-tooling-debt,core-defect-fixes,doc-contract-reconcile,eng-discipline-prompts}.md`——**均他批档，本档零命中**）。
- **收口提醒（父侧用）**：仓根 = `d:\teamcode\thincoder`（git 工具需 `workdir='thincoder'`；无 `workdir` 时报告 clean/no-commits = 误读）。现工作树 **43 改 / 13 未跟踪**，含他批在飞改动 ⇒ 本批提交须按上文《交付摘要》的 **12 档清单**限定路径，勿整树提交。
- **另案（本轮新查、未处置）**：`docs/core/design/AGENT-LOOP.md:41` / `:133` 记录层「中止时清空子代理池」表述与落地后机制不符——已由评审轮 4 #1（🟡）在案并建议按行内注解惯例挂注；母档属父侧/设计者域，本角色未改。

## §6 验证与收口（父代理）

**批次状态：已收口 2026-09-16**（设计 = 轮 1–3 + 修正后复核（轮 4）pass · 实施 = eng-coder 终态 clean（内部审计 1 轮 + 代码评审 1 轮 + 修复收敛；评审 0🔴 / 2🟡 / 4🔵）· 门读数见下）

| # | 核销同步清单（D7） | 收口值 |
|---|---|---|
| 1 | 角色表 | §1 父侧 / §2 eng-designer / §3 评审子代理（轮 1–4）/ §5 eng-coder / §6 父代理——零越段 |
| 2 | 状态行 | 本节「已收口 2026-09-16」 |
| 3 | 计数 | 交付 = `async-discard.mjs` 新档 + 两接线点（`run-stages.mjs:171-172` · `suspension-drive.mjs:263-264`）+ F4（`subagent-scheduler.mjs:127`）；用例 **U1–U10 · U9b · I1** |
| 4 | 指针 | 三方一致 = 需求 `docs/core/requirements/AGENT-LOOP.md` §4.10 ↔ 设计 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20 ↔ 本档 §2 |
| 5 | 变更记录 | 母档 `docs/core/design/AGENT-LOOP.md` 回合收尾清池句 → 实测现位 `:205-206`（已收正 + 指针 → §6.20，评审 #4 🔴 消解） |
| 6 | 待办勾销 | 台账 `docs/TODO.md:52`（CLI 侧无「子 agent 被丢弃」提醒，与 VSC 不对称）→ **本收口轮内父侧执行**：`已核销` → 逐条移入 `docs/TODO-archive.md` |
| 7 | 台账可见面 | 收口行 = 台账 `--summary` 汇总面输出（组计数与列表同改 D3） |

**发布门（父侧独立实跑）**：core `node --test` **225/225** ✓ · CLI lint ✓ · 快层 **558 pass / 0 fail** ✓（归册清点：本批 0 条未归册）· `test:integration` **26/26** ✓ · 台账机检 0 违规 ✓ · 本批 3 档锚 **0 悬空** ✓。

**存量 / 另案（逐条带归属）**：① `test:full` 唯一红 = `T-V5-15②`（`thincoder-cli/docs/**` 11 档 37 条旧树路径锚——存量；双时点 byte-identical 读数佐证非抖动）⇒ 归**「存量清账批」** 
② **VSC `T-D9` 红**（`thincoder-vscode/test/async-parity.test.mjs:351`——F4 语义收窄后对侧钉子断言待同步；本批 VSC 零写 ⇒ **对侧另案**，已登记台账）
③ 宽度闸 4 档 20 行（全在批次档§3/§5 面）⇒ **最终扫尾**统一折行 ④ 母档 `:41` / `:133` 记录层残留（评审 #4 🟡）⇒ 父侧按行内注解惯例挂注 
⑤ VSC 快层 12 例存量未归册（`thincoder-vscode/test/edit-tool-improvement.test.mjs`）⇒ 台账登记。
