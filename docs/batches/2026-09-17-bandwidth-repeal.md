# 批次档 · 2026-09-17 · F3 带宽裁撤（bandwidth-repeal）

> 段位：工程模式 v2（ENGINEERING-MODE-V2）follow-on —— M5 委派门 **F3 带宽**裁撤。
> 触发：用户 2026-09-17 20:05 裁定「**不要这个概念，纯属过度工程，我是要治理委派滥用，但是不是这个治法。**」
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。

## §1 讨论（主 agent）
**状态行**：✅ 已收口 2026-09-17（F3 带宽裁撤 · M5 follow-on）

### 1.1 裁定

**用户原话**：「不要这个概念，纯属过度工程，我是要治理委派滥用，但是不是这个治法。」

- **裁撤对象 = F3「带宽机械限制」**：`resolveBandwidth(agent)` 读 manifest `access` → 并发实施批上限（from-zero=1 · mid-梳理中=2 · mid-已梳理=4）；在飞实施批数 ≥ 带宽 → 新实施批 spawn 机械拒发（报「带宽已满」）。
- **保留目标 = 委派滥用治理**（v2 §8.2 名下）——**替代治法另议，不在本批范围**。
- **不动**：F2（任务书强制字段 + round）· F6（files 声明面拦截）——**只拆 F3**。

### 1.2 背景（父侧溯源实证 —— 2026-09-17 20:03 用户追问后全链核查）

| 环节 | 时间 | 谁 | 证据 |
|---|---|---|---|
| 概念：E5「三旋钮 → manifest + 带宽声明」 | 2026-09-17 | eng-designer 写 · 批过审（方向层） | 设计档 `ENGINEERING-MODE-V2.md:25` / `:291-301` |
| 架构档明说：阈值「到模块设计定」（只定方向、零数值） | 同上 | — | 同档 `:301` / AC9 `:373` |
| 模块设计轮：数值留占位符 `<待定>` +「实现前主 agent 确认回写」硬前置 | 同上 | eng-designer + 评审 🟡#9 | 批档 `2026-09-17-engine-mode-v2-moddesign-gate.md:112` |
| **数值 1/2/4 落定——「主 agent 裁定」，全程无用户裁定痕迹** | 同上 | 主 agent | 模块设计档（已归档）`:49` / `:84` / `:107` 三处同写 |
| 进代码 | 2026-09-17 15:37 | — | commit `b9f439c9` → `spawn-gates.mjs:81-93` |

**治理缺口（本批缘起）**：数值确认的承诺句写成「实现前**主 agent** 确认回写」——承诺人与执行人同方 ⇒ 数值从未呈到用户面前；用户 20:03 追问「这带宽是谁什么时候设计进去的」即由此而来。

### 1.3 裁撤范围（全链活点 —— 父侧只读定位）

| 面 | 文件 | 活点 |
|---|---|---|
| 代码 | `thincoder-core/agent-tools/spawn-gates.mjs` | 头注 F3（`:4`）· `BANDWIDTH_BY_ACCESS`（`:81`）· `resolveBandwidth`（`:83-93`） |
| 代码 | `thincoder-core/agent-tools/subagent-spawn.mjs` | import（`:29`）· 调用点 + 拒发逻辑（`:283` 起） |
| 测试 | `thincoder-core/test/spawn-gates.test.mjs` | T-F3（`:130`）/ T-F3b（`:139`）/ T-F3c（`:147`）+ import（`:20`） |
| 设计档 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22 | F3 行（`:564`）· 门序句（`:558`）· 落点句（`:569`）· 验收表 AC-M5-4（若在） |
| 设计档 | `docs/core/design/ENGINEERING-MODE-V2.md` | E5 行（`:25`）· E5 节（`:291+`）· AC9（`:373`） |
| 需求档 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md` | ① 目标句（`:7`）· ②.3（`:19`）· AC-M5-4（`:37`）· 需求依据（`:48`） |
| 需求档 | `docs/core/requirements/ENGINEERING-MODE-V2.md` | §9.3 带宽声明句（原 `:477`——父侧已删；§9.2「接入」墓志归 manifest-closeout 批） |

**不回改**：已归档模块设计档（`docs/core/design/_archive/modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md`——时序存档）· 批档（时序日志）。

**连带登记**：裁撤后 `access` 字段暂无代码消费方（带宽曾是唯一消费点）——该字段的行为旋钮化归**需求池 #28**（manifest 值注入路径），不另立条目。

### 1.4 段序

1. 需求档同步（**父侧直接执行**——主 agent 写域，本档同轮落地）；
2. 设计档修订（eng-designer——`AGENT-LOOP-SUBAGENT.md` §6.22 + `ENGINEERING-MODE-V2.md` E5/AC9）；
3. **用户发起**设计评审（发起权在用户）；
4. 父侧裁决 → 用户批准；
5. eng-coder 实施（拆码 + 测试面删除 + 核验证读绿）；
6. 父侧收口（§6）。

> 本节之后由 eng-designer 接手写 §2 批次任务与设计档修订；设计就绪后由**用户发起**设计评审（发起权在用户）。

## §2 批次任务（eng-designer）

### 2.1 条目与范围

**本批唯一语义条目 = F3「带宽机械限制」裁撤**——用户 2026-09-17 20:05 裁定：「不要这个概念，纯属过度工程，我是要治理委派滥用，但是不是这个治法。」（批档 §1.1）。

- **拆**：`resolveBandwidth` 全链（读 manifest `access` → 并发实施批上限 from-zero=1 · mid-梳理中=2 · mid-已梳理=4 → 越带宽 spawn 机械拒发）——代码活体（核 2 档 + 测 1 档，见 2.3）· 设计档活体引用（16 处——已落，见 2.2）· 需求档（父侧已同步，见 2.7）。
- **不拆**：F2（任务书六强制字段 + `round`）· F6（files 声明面拦截）· `batchDoc` 门（F1）· token 门（继承）· 门序其余环节（批档 §1.1「只拆 F3」）。
- **保留目标**：委派滥用治理（v2 §8.2 名下）——替代治法另议，**出批**（见 2.8）。
- **性质**：裁撤批（需求收窄）——不新增需求条目 / 不新增功能 / 不新增测试用例（U4）。
- **本批门禁前提**：spawn 必带 `batchDoc`（F1）+ `round` 字段（F2）——派单侧已满足。

### 2.2 设计面逐处（16 处 · 行号 = 改后实测）

设计档修订**已落**（设计者写域；本批 coder 零写）：

| 档 | 处数 | 落点（行号 = 改后实测） |
|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22（606 行） | 七处 | `:556` 定位句 · `:558` 门序链 · `:564` F3 行墓志 · `:565` F4 行注记去 F3 指针 · `:569` 落点句 · `:577` AC-M5-4 裁撤 · `:586` 变更记录 |
| `docs/core/design/ENGINEERING-MODE-V2.md`（399 行） | 九处 | `:25` E5 行 · `:68` M5 行 · `:102-106` 依赖图删 M5 分支行 · `:282` 机械面表行 · `:300`+`:302` E5 节（带宽声明墓志 + 轮次窄带去活体化）· `:319` 依赖表（M4/M6/M8/M9 → M1）· `:325` 依赖表（M5 → M1 零读面）· `:374` AC9 · `:398` 变更记录 |

（行数 = 设计轮 read 实测口径，含尾行。）

### 2.3 受影响文件表（三档 + F-6 注释收正一行）

| # | 档 | 文件 | 现况（read 实测） | 本批动作（file:line） | 预计后 |
|---|---|---|---|---|---|
| 1 | 核·源 | `thincoder-core/agent-tools/spawn-gates.mjs` | 115 行 | 头注 `:4-5` 去 F3 条 · `:8` 去「+ F3 带宽」· `:11` 零依赖句改写 · 删 `:14` import `readManifest`（死 import）· 删 `:80-93` F3 块 | ~100 行 |
| 2 | 核·源 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 484 行（read 口径 485，含尾行） | `:29` import 面去 `resolveBandwidth` · `:30` 去 `getAsyncPool`（死 import——唯一消费 = 被删守卫 `:284`）· 删 `:278-289` F3 守卫段（12 行） | ~472 行 |
| 3 | 核·测 | `thincoder-core/test/spawn-gates.test.mjs` | 149 行（读取 150 行，含尾行） | 头注 `:9` 删 T-F3 行 · `:14-16` 死 import 收口 · `:19-21` import 面去 F3 符号 · `:23` 去 `_setProjectRootForTest`（死——使用点随 T-F3/T-F3b 删除）· 删 T-F3 族 `:128-149`（注释 + 三用例，22 行） | ~126 行 |
| 4 | 核·测·F-6 增补（一行注释） | `thincoder-core/test/spawn-gates.test.mjs:3` | seam 指针 = `thincoder-cli/test/spawn-task-gate.test.mjs`（零存在） | 改指 `thincoder-cli/test/batch-doc-gate.test.mjs`（存在——父侧 glob 实核） | 行数不变 |
| 5 | 文档·设计（已落·本批零写） | `AGENT-LOOP-SUBAGENT.md` · `ENGINEERING-MODE-V2.md` | — | 见 2.2（16 处） | — |
| 6 | 文档·需求（父侧已落·本批零写） | `SPEC-DELEGATION.md` · v2 需求档 | — | 见 2.7 | — |

设计档 `AGENT-LOOP-SUBAGENT.md:569` 对第 2 行给定「回落 ~469」估数——本表精测口径 = 484 − 12（守卫段）+ import 面收正 ⇒ **~472**；两数为同一估算面，**实施后以 coder 实测回写 §5 为准**。

> **父侧直接执行（2026-09-17 · 评审后机械收正 · 可 revert）**：按设计评审发现 1/2 对当前磁盘重测——§2.3 第 3 行三数收正（147→149 · `:127-146`→`:128-149` · ~125→~126）· 第 2/3 行补录两处死 import（`getAsyncPool` · `_setProjectRootForTest`）· §1.3 用例坐标系收正（`:129/:137/:144`→`:130/:139/:147`）· A1 符号集增补 `getAsyncPool`；U4 坐标系同步。零新语义。

### 2.4 eng-coder 任务书（六强制字段——spawn 必备）

**① 目标与理由**——落用户 2026-09-17 20:05 裁定：拆除 F3「带宽机械限制」全链代码活体与测试面，使 spawn 门只余 F1/F2/F5/F6（设计档 §6.22 已改墓志）。理由：带宽属过度工程——数值由主 agent 自定、从未呈用户（批档 §1.2 溯源）。

**② 轮次**——`initial`（本批首轮实现轮；后续修正走 `fix` 轮）。

**③ 已知事实**——
- 触发 / 裁决 / 不回改清单：批档 §1.1–§1.3；设计档修订 16 处已落（2.2）。
- `readManifest` 全仓消费点（父侧 grep 实核）= `write-gate.mjs:46` · `batch-segment.mjs:79,128` · `spawn-gates.mjs:90`——**本批只删最后一处**（其余属 M4/M3，零交）。
- `resolveBandwidth` / `BANDWIDTH_BY_ACCESS` 全仓消费面 = 定义（`spawn-gates.mjs:81/:88`）+ `subagent-spawn.mjs:29,283` + `spawn-gates.test.mjs:20,129-145`——本批全清。
- seam 用例档 = `thincoder-cli/test/batch-doc-gate.test.mjs`（存在）；旧指针档 `thincoder-cli/test/spawn-task-gate.test.mjs` 零存在（父侧 glob 实核）。
- 门禁前提：`batchDoc` + `round`（F1/F2）派单侧已满足；token 门（M4）照常。

**④ 设计要点与禁止范围**——
- 拆除点 = 2.3 表 1–4 行（逐处 file:line）；**纯删除 + 注释 / import 收口**，删后各档须自洽（无死 import · 无悬空注释 · 头注与代码一致）。
- **禁夹带**：不加替代机制 / 不写新门禁 / 不动 F2·F6 判据与门序 / 不改 token 门·`batchDoc` 门 / 不放宽任何既有拒绝路径。
- **禁触**：需求档 · `_archive/**`（时序存档）· 提示词面（M9）· manifest schema 与 `access` 字段（归后续批——见 2.8）· CLI / VSC 面（端经核单源 import——零改）。
- 行数回落**实测回写 §5**（三档：改前 → 改后）。

**⑤ 验收标准**——2.5 表 A1–A6（逐条机判；报告逐条给读数）。

**⑥ 交付报告格式**——交付表（A1–A6 逐条状态）+ 触碰面清单（file:line 区间 + 行数）+ 行数实测（改前 → 改后）+ 验证命令与读数（grep 零命中 · 动态 import 键集断言 · `npm test` 结果）+ 出批边界外所见（若有）。实施记录自写批档 §5（`batch_segment`，段 = §5）。

### 2.5 验收标准（A1–A6 · 逐条机判）

| # | 验收标准 | 判据（命令 / 断言） |
|---|---|---|
| A1 | 源档零残留：`spawn-gates.mjs` 无 `resolveBandwidth` / `BANDWIDTH_BY_ACCESS` / `readManifest`；`subagent-spawn.mjs` 无 `resolveBandwidth` / `bandwidth` / `getAsyncPool`（死 import——评审核实） | `grep -n` 逐符号零命中 |
| A2 | 导出面不存在：`spawn-gates.mjs` 模块键集不含 `resolveBandwidth` / `BANDWIDTH_BY_ACCESS` | 动态 `import()` 取 `Object.keys` 断言缺席 |
| A3 | 拒发路径不可达 + F2 存活：文案 `bandwidth full` 零命中；`validateTaskBookFields(args)` 调用在册 | `grep` 零命中 + 一命中 |
| A4 | 测试面收敛：无 T-F3 / T-F3b / T-F3c；import 面无 F3 符号；死 import 已清 | 读档断言 + `npm test` 绿 |
| A5 | （F-6 增补）头注指针所指档存在：`:3` 所指 `thincoder-cli/test/batch-doc-gate.test.mjs` 存在；旧指针档零存在 | glob 两断言（父侧已实核；实施后复跑） |
| A6 | 零回归 + 范围守恒：项目测试链全绿；diff 触面 ⊆ 2.3 表 | `npm test` + `git diff --stat` 比对 |

### 2.6 用例表（U1–U5）

| # | 场景 | 输入 / 前提 | 预期输出 |
|---|---|---|---|
| U1 | 正常 | 工程角色六字段任务书 + `round=initial` | 照常放行（F2 判据零变——裁撤零影响） |
| U2 | 边界 | 原「带宽满」场景：3 实施批在飞再 spawn 实施批 | **不再拒发**（守卫段已删——该路径不可达）；`batchDoc` / token 门照常判 |
| U3 | 错误 | 残留引用（任何档 import `resolveBandwidth` / `BANDWIDTH_BY_ACCESS`） | 导入面不存在 ⇒ 取值为 `undefined` / 导入报错；本批以 A1 grep 零命中前置清零 |
| U4 | 删除面 | T-F3 族（`spawn-gates.test.mjs:130/139/147`——评审核实坐标，族区间 `:128-149`）删除 | **不补替代用例**——结构覆盖 = 导出面不存在（A2）+ grep 零命中（A1）（父侧 2026-09-17 裁定，确认草案默认） |
| U5 | 头注 | `spawn-gates.test.mjs:3` seam 指针 | 改指存在的 `batch-doc-gate.test.mjs`（A5 机判） |

### 2.7 三方一致（批次档 §2 ↔ 设计档 ↔ 需求档）

| 链 | 载体 | 条目 |
|---|---|---|
| 批档 §2 | 本档 2.1 | F3「带宽机械限制」裁撤（用户 2026-09-17 20:05 裁定） |
| 设计档 | `AGENT-LOOP-SUBAGENT.md` §6.22（`:564` F3 墓志 · `:577` AC-M5-4 裁撤）+ `ENGINEERING-MODE-V2.md`（`:300` E5 墓志 · `:374` AC9 裁撤） | 同一条目（零新增设计语义） |
| 需求档 | `SPEC-DELEGATION.md` ②.3 裁撤注（`:24`）· ④ 表（AC-M5-4 已移出）· ⑤ 上游 = M4（`:43`）；v2 需求档 §9.3 带宽句已清 | 同一条目（零新增需求条目） |

本批 = 裁撤批：三方同源一致（需求收窄，非新增）；实施面只拆 F3，不动条目语义。

### 2.8 出批边界（本批不做）

1. 委派滥用治理**替代治法**——另议（批档 §1.1 保留目标；本批不含）。
2. `access` 字段 +「接入」概念全链裁撤 = 台账 **#29** → 后续批 `docs/batches/2026-09-17-manifest-closeout.md`（其 §1.4 明写设计派单排在本批交付核验后——防撞）；本批零碰（含设计档 E5 旋钮表 / 需求档 §9.2 的后续收正）。
3. manifest 值注入路径 = 台账 **#28** → 同归后续批。
4. 时序存档不回改：`_archive/**`（含 M5 模块档）· 各批档（批档 §1.3 同裁定）。
5. F2 / F6 / `batchDoc` 门 / token 门 / 门序其余环节零改；CLI / VSC 零写（端经核单源 import——设计档 M5 行接线表）。
6. 提示词面（M9）零改；不新增需求条目；不新增测试用例（U4）。

### 2.9 发现与处置（F-1–F-10）

| # | 发现 | 处置 / 状态 |
|---|---|---|
| F-1 | 需求档带宽活体引用（`SPEC-DELEGATION` ①②④ + v2 需求 §9.3 带宽句）——需求档写域在父侧 | **已处置**：父侧同轮同步——②.3 裁撤注（`:24`）· ④ 表（AC-M5-4 移出）· ⑤ 上游（`:43`）；v2 带宽句已清（§9 现结构 `:463-475`） |
| F-2 | 时序存档保留带宽语义（`_archive/modules/ENGINEERING-MODE-V2-MODULE-DELEGATION.md` · 各批档） | **已处置**：不回改——时序存档（批档 §1.3 同裁定） |
| F-3 | `access` 字段裁撤后零代码消费方（带宽曾唯一消费点） | **已处置**：连带登记——台账 #28 / #29 承载；本批不另立条目（批档 §1.3） |
| F-4 | `SPEC-DELEGATION` ⑤ 上游行残留 manifest 读面语义 | **已裁定**：父侧就地收正——⑤ 上游 = M4（活 token 门）；M5 零 manifest 读面（父侧 grep 实核 `readManifest` 消费点 = `write-gate.mjs:46` / `batch-segment.mjs:79,128` / `spawn-gates.mjs:90`〔本批删〕） |
| F-5 | 台账 #28 证据行含 `spawn-gates` 指针（裁撤后悬空） | **已处置**：父侧收正——#28 证据行已无 spawn-gates 指针（无需再动） |
| F-6 | `spawn-gates.test.mjs:3` 头注 seam 指针指向不存在的档（旧 = `thincoder-cli/test/spawn-task-gate.test.mjs` 零存在；实 = `batch-doc-gate.test.mjs`） | **已裁定**：纳入本批实施范围——一行注释收正（2.3 表 #4 + A5 机判据；父侧 glob 实核） |
| F-7 | 原 AC9 裁撤后 N4（耗时）指标是否需新立机械 AC | **已裁定**：不新立——N4 由 F2 任务书「轮次」字段承载（设计档 AC9 行已注记 `:374`） |
| F-8 | `PROMPT-SYSTEM.md:254` 变更记录行仍列「带宽」入纪律分流清单（历史行） | **新增·待父侧裁**：是否收正由父侧定（该档不在本批设计面——本批零碰） |
| F-9 | 设计档 `ENGINEERING-MODE-V2.md:302`「`phase`/`access` 字段本身保留」句已被用户 20:11 / 20:13 裁定超车（access 删、「接入」概念一并裁撤） | **新增·归属已定**：收正权归后续批 `2026-09-17-manifest-closeout.md`（#29——其 §1.4 明写 E5 旋钮表归它）；本批零碰（防撞） |
| F-10 | 注释按档名引用已归档档 `ENGINEERING-MODE-V2-MODULE-DELEGATION`（现址 `_archive/modules/`）：核 `:2/:17/:46/:69/:96` · spawn `:27/:270` · 测头注 `:2`（§ 号引用、非路径形态；F3 段内 2 处随批删） | **新增·待父侧裁**：F-6 弱同族（指针所指档存在性）——是否随批收正请裁；本批默认不动 |

## §3 设计评审（评审子代理）

> 写入方式 = **父侧誊录**（评审子代理的 `batch_segment` 写入因本节骨架缺失被拒——工具 fail-closed；以下文字按评审报告**逐字**誊录，零改写）。评审轮 = 轮次 1（设计评审 · 重试轮）。

**评审面**：五档全文已读（AGENT-LOOP-SUBAGENT §6.22 · ENGINEERING-MODE-V2 · SPEC-DELEGATION · v2 需求 · 批档 §2）。
**限制声明**：无文档地图（Document ownership 按被审档自身规则 §6.0/§6.3 降级核对——未见另起炉灶、全部就地墓志化）；无项目标准档（方法论合规按 Project Guide + 批档/设计档既有规范判定：六段序、写权矩阵、墓志先例均符合）。

**抽查实核（criterion 8 证据面，均对当前磁盘）**：

- 设计档修订 16 处落位逐处实核 ✓（§6.22 七处 `:556/:558/:564/:565/:569/:577/:586`；EMV2 九处 `:25/:68/:102-106/:282/:300/:302/:319/:325/:374/:398`）。
- 需求同步 ✓：SPEC `:24` 裁撤注 / ④ 表 AC-M5-4 已移出 / `:43` 上游 = M4 / `:48` 无残留；v2 需求 §9.3 零「带宽」命中。
- 代码抽查：`spawn-gates.mjs` 115 行 ✓（`:4-5/:8/:11/:14/:80-93` 逐处一致）· `subagent-spawn.mjs` 484 行（读 485 含尾行）✓（`:29` · `:278-289`=12 行 · 文案 `bandwidth full` 在 `:287`）· 全仓 `bandwidth`/F3 符号零额外命中（CLI/VSC 零改成立）✓ · F-6 seam 存在性 ✓（`batch-doc-gate.test.mjs` 存在 / `spawn-task-gate*` 零存在）· `spawn-gates.test.mjs` 行数/区间 ✗（见发现 1）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响档标注（criterion 8） | 🟡 | 批档 §2.3 第 3 行（`docs/batches/2026-09-17-bandwidth-repeal.md:86`）标注 `thincoder-core/test/spawn-gates.test.mjs` 现况「147 行」、动作「删 `:127-146` T-F3 族」；实测磁盘：该档 149 内容行（读取显示 150 行，含尾行），T-F3 族在 `:128-149`（区段注释 `:128` · T-F3 `:130-137` · T-F3b `:139-145` · T-F3c `:147-149`）⇒ 所给区间不含 T-F3c，照抄执行会留下第三个用例，与同批 A4（`:123`「无 T-F3 / T-F3b / T-F3c」）及 §1.3/U4 所给 `:129/:137/:144`（实测 `:130/:139/:147`）相抵。非阻断——A4 符号级判据 + `npm test` 会兜住。 | 以当前磁盘重测并收正该行三数（区间 / 现况行数 / 预计后），或把该行坐标显式降级为 as-of 参考、申明符号级 A4 为唯一执行判据。 |
| 2 | 清晰度 · 验收覆盖（死 import 漏列） | 🟡 | F3 拆除产生两处死 import，§2.3 编辑清单均未点名：(a) `thincoder-core/agent-tools/subagent-spawn.mjs:30` 的 `getAsyncPool` import——唯一消费 = 被删守卫（`:284`）；第 2 行（批档 `:85`）只列 `:29` + `:278-289`，A1 符号集（批档 `:120`）不含该符号 ⇒ A1–A6 无一条可抓（抽查 `core-hygiene.test.mjs`：只查 import 可解析 + 档位，不查死 import）；(b) `spawn-gates.test.mjs:23` 的 `_setProjectRootForTest`——使用点 `:132/:141` 随 T-F3/T-F3b 删除 ⇒ 变死（A4「死 import 已清」可兜、清单未点名）。两处本已由 ④（批档 `:107`）「删后各档须自洽（无死 import）」要求。 | 把两行补入 §2.3 第 2/3 行编辑清单；并考虑为两个源/测档各加一条「孤儿符号零命中」grep 断言，使清理落机判而非自觉。 |
| 3 | 档内一致性（卫生） | 🔵 | 拆 F3 后已无模块读 `phase`/`access`（`ENGINEERING-MODE-V2.md:302`「裁撤后暂无代码消费方」· `:325`「M5 → M1 零读面」），但同档本批编辑过的两行仍将其列为读面：依赖图头 `:102`「被读面：… phase / access …」与接口行 `:319` 字段列表含 `phase`/`access`——列表与 `:302/:325` 陈述不再一致（access 半边属排除面）。 | 再触该两行时去 `phase`/`access`，或加「暂无消费方」注；access 部分可并入 #29 清扫。 |
| 4 | 需求层留痕 | 🔵 | v2 需求 §9.3 带宽句已清（该档 `带宽` 零命中）且 SPEC ②.3/④/⑤ 同步齐，但删除未留档内痕迹（对照 §9.2「已裁撤」标题式墓志，`docs/core/requirements/ENGINEERING-MODE-V2.md:469`）；需求层可追溯性全落在 SPEC + 批档。 | 若需求层需自证留痕，§9.3 补一行裁撤指针（对齐 §9.2 形态）；若有意清面，无需动作。 |

**批外注记（不赋级）**：① F-9 面（`ENGINEERING-MODE-V2.md:302`「`phase`/`access` 字段本身保留」vs 用户裁定）——属排除面（manifest-closeout），批档 §2.9 已登记，本轮不评；② 存量/批外：v2 需求 §13.1 D1「需求/设计档 = eng-designer」（`:582`）与 §7.1/§7.3「需求档 = 主 agent」（`:285`/`:345`）相抵——与本批零关；③ 批档自列待裁项 F-8（`PROMPT-SYSTEM.md:254`）/ F-10 属正常留白，非缺陷。

**计数**：🔴 0 · 🟡 2 · 🔵 2

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-17 21:52 · 用户批准**（会话面原话：「批准」）——批准范围：

1. **设计**：F3 带宽裁撤全链修订（设计档 16 处 · 需求档同步 · 设计评审轮次 1 **PASS**：🔴0 / 🟡2 / 🔵2，发现 1/2/4 已修、3 转 #29）；
2. **实现**：spawn `eng-coder`（任务书 = 本节 §2；设计凭证已签发——值不落档，运行时凭证）；
3. **实施面 = §2.3 四行**（三档删除 + F-6 注释一行收正）；出批边界 = §2.8。

## §5 实施记录（eng-coder）

### 5.1 交付摘要

**落用户 2026-09-17 20:05 裁定：F3「带宽机械限制」全链裁撤（代码面）**——纯删除 + 注释 / import 收口，零新语义、零新用例（U4）。触碰面 = 核源 2 档 + 核测 1 档（批档 §2.3 表 1–4 行；第 4 行 = 第 3 行档内一行注释）。

**零改面（逐条）**：F2 判据（`validateTaskBookFields` / `ROUND_VALUES` / `ENG_TASK_BOOK_MIN`）· F6 谓词（`rejectEngineeringFilePaths`）· F1 batchDoc 门 · token 门 · 门序（batchDoc → F2 → token）· `subagent-scheduler.mjs` · manifest `phase` / `access` 字段 · CLI / VSC 面 · 文档 / 需求 / `_archive`（零写）。

### 5.2 三档行数实测（改前 → 改后）

| 档 | 改前（content / split） | 改后（content / split） | 净变 |
|---|---|---|---|
| `thincoder-core/agent-tools/spawn-gates.mjs` | 115 / 116 | 95 / 96 | −20 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 484 / 485 | 470 / 471 | −14 |
| `thincoder-core/test/spawn-gates.test.mjs` | 149 / 150 | 121 / 122 | −28 |

口径：content = read 显示口径（非空终止行）；split = `split("\n").length`。三档均以换行结尾、无尾随空行（node 实测）。净变与 diff 删行算术逐档吻合（设计档 §6.22:569 估「回落 ~469」→ 实测 470，估数面收口即本表）。

### 5.3 逐处改动（含原坐标 · 改后 file:line 见 5.4 引注）

| 档 | 改动 |
|---|---|
| `spawn-gates.mjs` | 头注并条：删原 `:4-5` F3 条 · 原 `:8` 去「+ F3 带宽」· 原 `:11` 零依赖句改写「本模块零 import（叶子——纯谓词层）」· 删原 `:14` 死 import `readManifest`（连尾随空行）· 删原 `:80-93` F3 块（`BANDWIDTH_BY_ACCESS` + `resolveBandwidth` + 注释，连尾随空行） |
| `subagent-spawn.mjs` | 原 `:29` import 面去 `resolveBandwidth` · 删原 `:30` 死 import `getAsyncPool` · 删原 `:278-289` F3 守卫段（12 行，连尾随空行） |
| `spawn-gates.test.mjs` | 原 `:3` seam 指针改指 `thincoder-cli/test/batch-doc-gate.test.mjs` · 头注删原 `:9` T-F3 列项 · 删原 `:14-16` 死 import 组（`node:fs` / `node:os` 整删 · `node:path` 留 `resolve`）· 原 `:20` import 面去 F3 双符号 · 删原 `:23` 死 import `_setProjectRootForTest` · 删原 `:128-149` T-F3 族（区段注释 + T-F3 / T-F3b / T-F3c，连前置空行） |

### 5.4 验收读数（A1–A6 · 原文摘录）

- **A1 ✅** — `spawn-gates.mjs`（`resolveBandwidth|BANDWIDTH_BY_ACCESS|readManifest|bandwidth`，忽略大小写）→ `(no matches)`；`subagent-spawn.mjs`（`resolveBandwidth|bandwidth|getAsyncPool`，忽略大小写）→ `(no matches)`；全仓 `**/*.mjs`（`resolveBandwidth|BANDWIDTH_BY_ACCESS|bandwidth full`）→ `(no matches)`；全仓 `**/*.{cjs,js,json,ts}`（同符号集 + `getAsyncPool`）→ `(no matches)`。
- **A2 ✅** — 动态 `import()` 读数：`keys=["ENG_TASK_BOOK_MIN","ROUND_VALUES","rejectEngineeringFilePaths","validateTaskBookFields"]` · `forbidden_present=[]` · `required_missing=[]` → `A2 PASS`。
- **A3 ✅** — `bandwidth full` 代码面零命中；`validateTaskBookFields(args)` 恰 1 命中 = `subagent-spawn.mjs:274`。
- **A4 ✅** — 读档断言：`T-F3|resolveBandwidth|BANDWIDTH|_setProjectRootForTest|mkdtempSync|writeFileSync|tmpdir` 全档 grep → `(no matches)`；`node --test test/spawn-gates.test.mjs` → `tests 14 · pass 14 · fail 0`；核全量 `npm test` → `tests 278 · pass 278 · fail 0`。
- **A5 ✅** — `thincoder-cli/test/batch-doc-gate.test.mjs` 存在（glob）；`thincoder-cli/test/spawn-task-gate*` 零存在（glob 实核，实施后复跑）。
- **A6 ✅** — 三端测试链：核 `278 pass / 0 fail` · CLI `603 pass / 0 fail` · VSC `588 pass / 0 fail`；`git status` 工作树 = 本批 3 档 + 父侧批档；`git diff` 读面 ⊂ 三档（无 CLI / VSC / 文档 / manifest 触面）。

### 5.5 决策透明表

| # | 决策 | 理由 |
|---|---|---|
| D1 | 删除区段连相邻空行一并收口（原 `:80-94` / `:278-290` / `:127-149`） | 「删后自洽」要求：不留双空行 / 尾随空行；净变与 §2.3 预计（−20 / −14 / −28）逐一吻合 |
| D2 | F3 不在代码头注留墓志（对照 F4 / F5 先例） | 批档 §2.3 行 1 明示「去 F3 条」＝纯删除；F3 墓志在设计档 §6.22 与批档在册，代码面加墓志非本批授权动作 |
| D3 | `escapeXml` 死 import（`subagent-spawn.mjs:15`）不动 | 存量（非 F3 拆除所致——本批删行算术已被编辑面精确占满）；出批边界外，见 5.7 |
| D4 | 不补替代用例 / 不加新断言 | U4 裁定（父侧 2026-09-17）：覆盖 = 导出面不存在（A2）+ grep 零命中（A1） |

### 5.6 审计与评审轮次

- **内部偏差审计**（explore · read-only）：4 轮工具调用——**CLEAN**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST 四类均未发现）。
- **内部 advisor 代码评审**（轮次 1）：**VERDICT: pass**——🔴 0 · 🟡 1（存量 advisory：`subagent-spawn.mjs` 470 行超 300 软线、低于 500 硬限、非 must-fix）· 🔵 1（§5 待写——本段即回写）。
- **fix 轮**：0（无 🔴 / 无 must-fix，代码零修正）；**终态 = clean**。

### 5.7 出批观察项（所见上报，本批零动作）

1. `subagent-spawn.mjs:15` `escapeXml` 死 import（本档其余位置零出现）——存量，本批 diff 未触及。
2. `subagent-scheduler.mjs:44` 注释称黑名单「族 = ledger.db / CHANGELOG + scripts/**」，与 `spawn-gates.mjs:74`（`PROCESS_BASENAMES = new Set(["changelog.md"])`）及 `spawn-gates.test.mjs:100`（`ledger.db` 放行断言）相抵——存量注释陈旧。
3. `spawn-gates.test.mjs:80` 用例名「schema enum 同源单点」与实现不符（schema 枚举实为 `subagent.mjs:154` 内联字面量；`ROUND_VALUES` 唯一消费方 = 该测档自身）——F2 面存量。
4. F-10 族（注释按档名引用已归档档 `ENGINEERING-MODE-V2-MODULE-DELEGATION`）维持「默认不动」——批档 §2.9 已登记待裁。

## §6 验证与收口（父代理）

**父侧核验（不采信自述——读档 + 复跑）**：

- 三档实读逐处相符：`spawn-gates.mjs` 95 行（F3 块 / `readManifest` 死 import / 头注 F3 条全清，模块零 import）· `subagent-spawn.mjs` 470 行（`:29` import 面净 · `getAsyncPool` 死 import 清 · 守卫段无存）· `spawn-gates.test.mjs` 121 行（seam 指针已改指 `batch-doc-gate.test.mjs` · T-F3 族清 · 死 import 组清）。
- 核套件父侧独立复跑：`npm test` = **278 / 278 pass · 0 fail**（10.7s）——与 §5 读数一致。
- `git diff --stat` 触面 = 恰 4 档（三码档 + 本批档）——A6 范围守恒成立。
- A1–A6 其余读数（grep 零命中 / 动态 import 键集 / seam 存在性 / CLI 603 · VSC 588）采信 §5 原文 + 抽查一致。

**角色表**

| 段 | 作者 | 状态 |
|---|---|---|
| §1 讨论 | 主 agent | 已收口 |
| §2 任务书 | eng-designer | 完成（4 裁定并录） |
| §3 设计评审 | 评审子代理 | 轮次 1 PASS（🔴0 / 🟡2 / 🔵2） |
| §4 用户批准 | 主 agent | 2026-09-17 21:52 |
| §5 实施记录 | eng-coder | 完成（clean——审计 CLEAN + 内部评审 pass + 0 fix 轮） |
| §6 验证与收口 | 父代理 | 本节 |

**验收逐项（A1–A6）**：全 ✅（读数见 §5.4 + 父侧复跑）；评审发现 1/2/4 = Fixed、3 = Deferred（归 #29）。

**出批观察（§5.7 登记项）**：存量四项（`escapeXml` 死 import · scheduler 注释陈旧 · 用例名与实现不符 · F-10 族）——非本批面，维持登记。

**状态**：**已收口 2026-09-17**。本档冻结（不再回改）。

**尾巴指针**：

- 后续批：`docs/batches/2026-09-17-manifest-closeout.md`（#28 注入 + #29 access/「接入」裁撤）——设计派单前置条件（本批交付核验）已满足。
- 设计档：`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22 · `docs/core/design/ENGINEERING-MODE-V2.md`（E5 / M5 / 依赖表）。
- 需求档：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md` · `docs/core/requirements/ENGINEERING-MODE-V2.md` §9.3。
