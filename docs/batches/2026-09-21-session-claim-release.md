# 会话认领释放与拒绝零副作用（SESSION-CLAIM）· 批次记录（2026-09-21）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 01:4x · 来源 = 用户 01:46 报告（「为什么 CLI 会同时持有两个会话？这个明显不合理」）+ 01:49 委托（「排批这两个问题都处理吧」）。
> 台账 = #165（认定漏释放）+ #161②（拒绝路径副作用）· 需求档 = `docs/core/requirements/SESSION.md` §2.3（本批新增）。
> 关联：#161①（提示面）= 用户 01:46 裁「不改」✓ 不入本批。

## §1 讨论（主 agent）

**状态行**：🔄 进行中

**用户原始报告（2026-09-21 01:46 / 01:49）**：

> 「如果是真实被占当然现在的处理可以，不用改，但是为什么cli会同时持有两个会话？这个明显不合理。」
> 「排批这两个问题都处理吧。」

**缺陷甲（#165 · 认领只增不减）**——机制实勘（2026-09-21 01:4x 全实读）：

- 事实：`D:\teamcode` manifest `slotSessions = {39: 面板宿主, 40: ★本 CLI, 41: ★本 CLI, 43: 面板宿主}`——本 CLI 同时持有 40（09-18 旧会话「Node环境代理变量检查命令」，19:55 曾被本进程写过）+ 41（本会话）；面板宿主（pid 1760）同族双持 39+43。
- 机制：认领加点多处——`resumeSlot`（启动恢复）/ `newSession`（`thincoder-core/session-lifecycle.mjs:214-215`）/ `switchToSlot`（同档 `:279-282` 空闲则认领）/ `activeSlot` 绑定路径；**全仓释放原语为零**——`delete slotSessions` 仅三处死主清理（`session-lifecycle.mjs:186` · `session-slots-manifest.mjs:146` · `session-slots.mjs:210`）⇒ 进程生命周期内**认领只增不减**。
- 设计档核查：`docs/core/design/SESSION.md` 通读（认领序 / 占用 / 清理 / 切换 / marker 全枚举）**无「保留旧认领」意图条款** ⇒ 定性 = 设计缺口（漏释放）。
- 安全性核：释放**不损**互覆保护——他端认领旧槽后本进程再切入 ⇒ `slotOccupancy`（`session-lifecycle.mjs:294-305`）判占 ⇒ 不认领 + 下次保存 fork（防互覆不依赖旧认领）⇒ 可释放。
- 代价（用户所见）：CLI/面板活着期间，其访问过的槽在其他端一律打不开，且随会话时长累积。

**缺陷乙（#161② · 拒绝路径先写后判）**——实勘：

- `thincoder-vscode/src/extension/panel-messages-session.mjs:42` 在占槽检查（`:49-52`）**之前**先调 `switchToSlot`；核实现（`session-lifecycle.mjs:272-287`）无条件 `m.active = slot`（`:277`）+ `saveManifest({setActive:true})`（`:283`）⇒ **被拒的切换仍把共享 active 指针翻到目标槽**（实测 active 41→40 与用户切 40 窗口吻合；端标记未动）。
- 与甲相互放大：脏 active + `_slot` 空位时，save 经 `activeSlot` 绑定可致误绑旧槽（本进程 40 的一类可能入口）。

**本批范围（两条条目 · 1 批）**：F-CR1 认领随绑定（离开即释放 · 双端对称）· F-CR2 拒绝零副作用（共享指针 / 端标记 / 认领集三不动）。需求落点 = `docs/core/requirements/SESSION.md` §2.3（父侧落笔 ✓）。

**边界（不做什么）**：不改槽文件格式 / 端标记语义 / 不引入跨端共享可变字段（NF1）/ 不新增机械门 / 提示面（#161①）不动（用户裁 ✓）/ 删除面释放语义（`deleteSlot` 既有 ✓）不动。

### 1.0 用户授权（父侧代点火 + 代批准 · 时限「自动跑」）（2026-09-21 01:49）

**用户原话**：「排批这两个问题都处理吧。」+（01:21）「自动跑」⇒ 本批链上**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**，至本批完结 ✓。

**父侧自缚（代签条件）**：① 代签仅当「评审 pass（0 🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 代签在 §4 写明「父侧代签（用户 01:49 委托 + 01:21 授权）+ 依据」；③ 需新范围或用户口径裁决 ⇒ 停下 ✓。

## §2 批次任务与设计（eng-designer）

**状态行**：✅ 已收口 2026-09-21（实施验证通过 · 三端全绿 · 台账 #161②/#165 已核销；记录冻结）

**本批条目（覆盖）**：F-CR1（认领随绑定 / 离开即释放）· F-CR2（拒绝零副作用）；F-CR3 = 零回归约束（不新增改动面）。需求档 = `docs/core/requirements/SESSION.md` §2.3。

**设计档落点**（`docs/core/design/SESSION.md`，就地并入）：§5 `:57-58`（本批落点指针）· §6.2 `:103-106`（**新增认领释放条**）· §6.5 `:136` / `:139`（`/new` 与 `/session N` 落点补释放）· §6.15 `:276-278`（打开历史会话 = 判据前置）· `:301-302`（**新增本节单源条**：F-CR2 收正 + 端壳释放）· §7 `:419-420`（**新增 D-SE32 / D-SE33**）· **新增 §6.16 `:335-383`**（判据句 / 边界情形表 / 本批落点表 / 测试面 / 验收回指）· 变更记录 `:485-486`。

**F-CR1 设计（释放判据 · 条件 / 时机 / 落点）**：
- 谓词：`slotSessions[A]` 为本进程 ∧ `A ∉ 保留集` ⇒ 释放 A；**保留集 = 本次绑定落点槽 ∪ 本进程其他活绑定槽**（同 cwd manifest 内）。
- 时机 = **绑定迁移落点**（非定时 / 后台清扫）。落点（核 + 端壳对称）：① 核 `newSession`（保留集 = 新槽）——CLI `/new` 调用面传 `releaseStale` 选项，**ACP 四个调用点不动**（`handlers-session.mjs:152` / `handlers-slots.mjs:106/159/190`——多会话多认领属其设计，F-CR3）；② 核 `switchToSlot`（未占 ⇒ 保留集 = {目标}；**被占 ⇒ 保留集 = 空**——不认领目标 + 旧认领一并释放，下次保存 fork 既有语义）；③ 核 `claimSlot`（保留集 = 认领槽——`resumeSlot` 恢复落点，TUI 启动 / VSC 端壳包装同源）；④ VSC 端壳 `newSlot` / `switchToSlot`（保留集 = 落点槽；端壳 = WebviewViewProvider 单实例视图 ⇒ 单绑定——`chat-panel.mjs:107-116`）。
- 落盘：释放集并入各落点**既有那一次** `saveManifest` 的 `deletions.slotSessions`（防 fresh 复活——D-SE4 同型）；`active` / `m.slots` / 槽文件 / 端标记零动（只删属主条目）。
- 安全性：释放不损互覆保护（他端认领 ⇒ 本端再切入 `slotOccupancy` 判占 ⇒ 不认领 + `allocateFresh` fork）——需求档 §2.3 验收③ / §1 安全性核成立。
- 边界情形表（空闲切换 / 被占 fork / 重选当前槽 / 无绑定窗口 / 删槽 / 混合版本）→ 设计档 §6.16。

**F-CR2 设计（改正形态 = 判据前置）**：
- VSC `handleSwitchSession`（`panel-messages-session.mjs:42`）：先 `slotOccupancy`（纯读判据）；**受占 ⇒ 拒绝分支（不调 `switchToSlot`）**——warning 文案不变 + `panel._slot = null` + `_loadSession()` 重绑本端原槽 ⇒ 共享指针 / 端标记 / 认领集 / 解析缓存**四不动**。
- 端壳 `switchToSlot`（`session-io.mjs:169-187`）判据序收正：占用判定前置于 `m.active` 赋值——受占分支零写（含共享指针）；核 `switchToSlot` 受占语义不变（CLI 切换成立：指针 / 记录按 D-6 / D-4；fork 面依赖指针翻至目标槽——实读确认，见下「实读结论④」）。
- 回滚形态否决：回滚窗口内他端可读脏指针 + 二次写窗口更大。
- 测试定形：`session-boot.test.mjs` 组⑮（`:379-410`）现断言「共享 active 指针仍翻（D-6 保留）」⇒ 按 F-CR2 改为四不动断言（`m.active` 与前态逐字段相等）。

**受影响文件表（as-of 2026-09-21 · 行数 = 实读）**：

| 文件 | 行数 | 改动面 |
|---|---|---|
| `thincoder-core/session-slots-manifest.mjs` | 264 | 新增「释放集」计算（判据单源）；`claimSlot` 释放并入既有 `saveManifest`（`deletions`） |
| `thincoder-core/session-lifecycle.mjs` | 310 | `switchToSlot` 释放并入（保留集 = 被占 ? 空 : {目标}）；`newSession` 增 `releaseStale` 选项 + 释放并入（与既有死主 deletions 合流） |
| `thincoder-cli/src/tui/cmd-new.mjs` | 38 | `/new` 落点传 `releaseStale`（ACP 四点不动） |
| `thincoder-vscode/src/extension/session-io.mjs` | 221 | `newSlot` / `switchToSlot` 释放并入；`switchToSlot` 判据序收正（受占零写）；头注与 `:166-168` 注释随改 |
| `thincoder-vscode/src/extension/panel-messages-session.mjs` | 92 | `handleSwitchSession` 判据前置（受占 ⇒ 不调 `switchToSlot`；文案与 `_slot = null` / `_loadSession()` 语义不变） |
| 测试（三档内扩展，见下） | — | `thincoder-core/test/session-slot-write.test.mjs`（218）· `thincoder-cli/test/manifest-flip-refusal.test.mjs`（184）· `thincoder-cli/test/integration/session-resume.test.mjs`（260）· `thincoder-vscode/test/session-boot.test.mjs`（440——组⑮ 断言定形） |

模块尺度：改动后各档仍远低于 500 行硬限（最大 `session-lifecycle.mjs` ≈ 320）——无拆分需要。

**测试面（用例判据 = 需求档 §2.3 验收四条）**：① 切换释放 + 重认领 → 核 `session-slot-write.test.mjs` + CLI `session-resume.test.mjs`；② 拒绝四不动 → `session-boot.test.mjs` 组⑮（断言定形）；③ 他端认领后本端再切入 ⇒ 判占 + fork → `session-resume.test.mjs`；④ 双端对称 → 核三原语 × 端壳三件同判据（保留集口径 / `deletions` 落盘 / 占用判据单源 `slotOccupancy`）。

**实读结论（父侧「待实读钉定」五项）**：
① **VSC 端壳 `switchToSlot` 实现体**（`session-io.mjs:169-187`）= 先读槽（`loadSlotFile`，null ⇒ 不产生幻影指针）→ `m.active = slot` **无条件**（`:174`）→ `slotOccupancy` 判占（`:175`）→ 未占才认领（`:176-179`）→ `saveManifest(setActive:true)`（`:180`）→ 未占才写 marker + 解析缓存（`:182-185`）⇒ **缺陷乙的副作用面 = 仅共享指针**（端标记 / 缓存 F-MI7 已收敛）；`newSlot`（`:123-157`）= 核同源步骤（选号 / 死主清理 / 释放面待加）+ 活认领跳号 + 写 marker + 缓存。
② **`resumeSlot` 与释放的交互**：resume 认领落点 = `claimSlot`（`session-slots.mjs:291`）；D-SE31 P1–P5 只约束绑定 / 缓存 / 记录三面（认领集不在 P 条内）⇒ 释放判据落 `claimSlot` 与 P 条零冲突（P3 的「绑定随槽释放」= `deleteSlot` 既有语义，不动）。
③ **ACP `sameProcessPinned` 不依赖「旧认领保留」**：判据 = 按各在存会话 `_slot` 比槽（`handlers-slots.mjs:89/145`）+ 每次 load/resume 前查 ⇒ 与认领集无耦合；但 **ACP 进程合法多认领**（每在存会话一槽）⇒ 两条纪律：释放**不得**进 `ensureActive` / `activeSlot`（裸调用面会放掉真绑定——见 ④），`newSession` 释放**必须调用面 opt-in**（ACP 四点不传）——否则 F-CR3 破。
④ **`activeSlot` 绑定写面**（`session-slots-manifest.mjs:165-193` / `:260-264`）：`ensureActive` 分支 1（`:186`）为「指针槽认领」，**裸调用面实存**（`cmd-eng.mjs:94` / `cmd-advisor.mjs:30` / `cmd-session.mjs:12`——后两者为路径读 / 已带 `_slot ??` 守卫，`cmd-eng.mjs:94` 为无守卫写面）⇒ 认领可**脱离绑定**产生（缺陷甲入口之一）；本批以**释放覆盖**处置（下次迁移落点清残留），源侧改正另案（未决项 1）。核 `switchToSlot` 受占分支的「指针翻至目标槽」为 fork 语义所依赖（`_slot = null` 后首次保存经 `activeSlot` → 被占 ⇒ `allocateFresh`）——核侧不改。
⑤ **设计档通读复核**：`docs/core/design/SESSION.md` 无「保留旧认领」意图条款（认领序号列 / 清理处枚举均无保留语义）⇒ 定性维持 = 设计缺口（漏释放）；D-SE32 / D-SE33 为该面首个判据条款。

**缺陷甲 40 认领向量（实读钉定 · manifest 直读 2026-09-21 01:5x）**：
- 实据：`slotSessions` = `{39: 1760-…, 40: 19148-1789891848089-7s3dyw, 41: 19148-…-7s3dyw, 43: 1760-…}`；pid 19148 = `D:\teamcode\thincoder` CLI TUI（启动 2026-09-20 16:10:47）⇒ **40 / 41 由同一进程实例持有**；`.cli` marker = `{"slot":41, updatedAt:16:12:37}`（此后未再写）；`active` = 40（父侧实验：面板切 40；`.vscode` marker = 39 @ 01:31:39 佐证端侧活动）。
- 判定：40 认领与当前绑定（41）分离、marker 自 16:12:37 无对应写 ⇒ 认领产生点在 marker 面之外。两候选向量**均被新判据覆盖**：ⓐ 启动绑定 40（16:10:47）+ 16:12:37 `/session 41` 切换未释放（marker = 41 一致——最契合物证）；ⓑ 裸 `activeSlot()` 认领（`cmd-eng.mjs:94` 面——不写 marker）。
- 40 槽文件 19:55:56 的最后写入 = 完整保存（`updatedAt` 与摘要 `ts` 同刻），而本进程 marker 无对应写 ⇒ 判为**外部写入者**（他进程 / 旧实例），不属本进程绑定链——与缺陷甲判定无关（「认领脱离绑定」本身已足证）。
- **父侧一处引用更正**：`saveSession`（`session.mjs:140-142`）与 `persistEngTokens`（`token-ttl.mjs:234-236`）在首认领时**都写 marker**（`claimedNow` 分支）⇒ 「save 时 `_slot ??= activeSlot()` 绑定（不写 marker）」不成立（批档 §1 候选描述之一）。

**未决项 / 上报（不本批 · 逐条）**：
1. `/eng` 持久化裸 `activeSlot`（`cmd-eng.mjs:94`）：与绑定无关的认领源 + 指针 ≠ 绑定时**写错目标槽**（工程标志写进他人会话文件）——源侧改正另案（本批释放面仅兜残留）。
2. ACP `session/close`（`handlers-session.mjs:188-201`）不释放认领（多会话进程属其设计面）——登记待办。
3. 跨 cwd 释放（VSC 项目切换时旧 cwd 认领保留至进程退出）——另案登记。
4. 面板宿主双持 39+43 的定性（单实例视图下同属本缺陷类；如需物证级确认需在 VSC 侧加读数——本批按单视图假定设计，若用户存在多窗口 / 多面板形态则该假定需复核）。

**自检**：需求覆盖 F-CR1/F-CR2 判据 + F-CR3 零回归面逐条 ✓；验收四条回指 ✓；受影响文件表（file 级 + 行数）✓；测试面（四档）✓；无「保留旧认领」残留引用（设计档通读）✓；机检 = `node scripts/doc-check.mjs --root .` exit 0（锚 0 悬空 / 行宽 0 超限）✓。

**补注（实读精度收正 · 同轮）**：上文「实读结论④」的裸调用面精度——`cmd-advisor.mjs:30`（`slotPath(agent.cwd, activeSlot(agent.cwd))`）为**无守卫** `activeSlot` 调用（亦为认领源；不写槽文件、只取路径）；`cmd-session.mjs:12`（`agent._slot ?? activeSlot(agent.cwd)`）**已带 `_slot ??` 守卫**（仅在未绑定时认领）；`cmd-eng.mjs:94` 为无守卫且**写槽**（`persistEngineering` → `writeSessionFile`）——三者同属「认领可脱离绑定」入口，本批按释放覆盖处置。

**补注二（批档面残留 · 上报父侧）**：§2 首行占位句「（待设计——设计档落点 = …）」由 append-only 写入面保留（工具面不删既有行）——与本轮「设计完成」状态行并存；建议父侧于 §3/§4 轮次按批档面清理。

### 修正记录（评审轮 1 · #2–#7）（eng-designer · 2026-09-21）

（#1 / #8 = 父侧处置面（需求档作用域钉死 + 占位句删除）；本表 = 本代理处置面——承 §3「Suggestion」列 + 父侧逐条接受裁定。设计面单源 = `docs/core/design/SESSION.md`；下行坐标为修正后实读。）

| # | 发现摘要（§3） | 处置 | 落点（设计档坐标） |
|---|---|---|---|
| 2 | 释放集两表述并存；ACP 调用面仅 `newSession` 侧枚举（`switchToSlot` / `claimSlot` 未证明不经过） | 保留集**唯一公式**（落点槽 ∪ 该进程其余活绑定槽；被占 ⇒ 空）+ 各落点 = 公式代入；新增 **ACP 调用面实读表**——`newSession` 四点不传 `releaseStale`（`thincoder-cli/src/acp/handlers-session.mjs:152` / `thincoder-cli/src/acp/handlers-slots.mjs:106` / `:159` / `:190`）；`switchToSlot` / `claimSlot` ACP 零调用点（`handlers-slots.mjs:84` 仅语义引注；`claimSlot` 调用面 = `thincoder-core/session-slots.mjs:291` + 端壳 `thincoder-vscode/src/extension/session-slots.mjs:131`；ACP 认领 = 直写 `m.slotSessions`——`handlers-slots.mjs:96-99` / `:151-154`） | §6.2 `:103-105` · §6.16 `:341-358` · §6.5 `:138` `:141` · §6.15 `:303` |
| 3 | 尺寸注记缺预期增量；>300 档无审视结论 | 逐档补预期增量 + >300 档审视（行数实读复核）——见下「行数读数刷新」表；设计 §6.16 保留尺度结论 + 指针（#6 单一承载面裁定后清单不双写） | §6.16 `:371-372` · 下表 |
| 4 | 释放写入纪律未钉（fresh 快照 / 内存移除） | 补**落盘判据三条**：① 写盘同一次 fresh 快照计算 / 校验 ② 值条件删除（fresh 属主仍为本进程）③ 内存认领表 `m.slotSessions` 同步移除（防条目级合并复活回写） | §6.16 `:346-347` · §6.2 `:106` |
| 5 | 缺 `## 7.` 节标题（档内 §7 回指悬空） | 决策表前补回 `## 7. 关键决策记录（D-SE1–D-SE33）` | §7 `:379` |
| 6 | 落点表 / 测试面表双处承载（行数双写） | file 级清单**唯一承载面 = 批档 §2**（本表）；设计 §6.16 该两表移出（保留判据 / 边界 / 决策 + 指针）；§5 落点表指针同改 | §6.16 `:371` · §5 `:58` |
| 7 | VSC 单实例假定两档表述不一（设计 = 实读口径 / 批档 = 假定口径） | 统一为「**假定 + 复核条件**」：假定 = 单实例视图 ⇒ 同宿主单绑定；复核条件 = 同 cwd 多于一个活绑定 ⇒ 该落点不释放 | §6.16 `:349` · §6.15 `:303` |

**行数读数刷新（as-of 2026-09-21 02:2x · 实读 · 计数 = 换行符数）与预期增量**（承上文「受影响文件表」——读数复核 + 逐档增量 + >300 档审视；#3 落地）：

| 文件 | 行数（实读） | 预期增量 | >300 档审视 / 拆分判断 |
|---|---|---|---|
| `thincoder-core/session-slots-manifest.mjs` | 264 | ≤ +25 | 预期 ≤ ≈290 < 300；结构不变（释放集判据单源） |
| `thincoder-core/session-lifecycle.mjs` | 310 | ≤ +15 | >300 档：结构不变（释放集判据外置单源档）；无拆分需要 |
| `thincoder-cli/src/tui/cmd-new.mjs` | 38 | ≤ +3 | 结构不变 |
| `thincoder-vscode/src/extension/session-io.mjs` | 221 | ≤ +15 | 结构不变 |
| `thincoder-vscode/src/extension/panel-messages-session.mjs` | 92 | ≤ +5 | 结构不变 |
| `thincoder-core/test/session-slot-write.test.mjs` | 218 | ≤ +40 | 结构不变 |
| `thincoder-cli/test/manifest-flip-refusal.test.mjs` | 184 | ≤ +30 | 结构不变 |
| `thincoder-cli/test/integration/session-resume.test.mjs` | 259（上文表读数 260 收正——计数口径 = 换行符数） | ≤ +40 | 结构不变 |
| `thincoder-vscode/test/session-boot.test.mjs` | 440 | ≤ +10 | >300 档：组⑮（`:379-410`）等量改写（断言定形不增用例）⇒ ≤450 < 500、余量 ≥50；无拆分需要 |

**读数更正（同轮实读）**：上文「受影响文件表」ACP 点 `handlers-session.mjs:147` 收正为 `:152`（`:147` = 注释行）；`thincoder-cli/bin/thincoder.mjs:335`（启动钉槽）· `thincoder-cli/src/tui/cmd-session.mjs:105`（`/session N` 调用面）· VSC 端壳三落点（`thincoder-vscode/src/extension/session-io.mjs:88` / `:123` / `:169`）实读核对成立。

**机检读数（本轮 · 收口）**：`node scripts/doc-check.mjs --root .`（仓根）= **exit 0**——OK(锚) 0 条悬空 · OK(行宽) 无 >300 字符单行。
**过程读数（同轮 · 02:0x 基线）**：exit 1——3 条行宽超限均非本代理笔域（`docs/core/requirements/SESSION.md:45`（399 字符）· `docs/core/requirements/AGENT-LOOP.md:236` / `:278`（317 / 322）——收口前已由他侧收正）；本代理一处 304 字符行宽（设计 §6.2 新条）当场收正 ≤300。

## §3 设计评审（评审子代理）

（待评审——父侧代点火。）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / 文档矛盾（机制级） | 🔴 | 同一机制（受占目标路径对共享 `active` 指针 / 端标记 / 认领集的效果）在两份在评文档中表述相反：需求档 F-CR2（`docs/core/requirements/SESSION.md:40`）与验收②（`:45`）把「拒绝认领 / 拒绝切换的路径」定为三不动，验收④（`:45`）要求双端同判据；设计档则把核 / CLI 的受占路径定为「切换成立」——指针 / 记录按 D-6 / D-4 落点 + 保留集 = 空释放旧认领（`docs/core/design/SESSION.md:301`、`:353`、`:420` D-SE33；`:140` 同义）。按字面读，CLI 受占路径属「拒绝认领」路径 ⇒ 指针 / 端标记（D-4「`switchToSlot` 成功后」写本端 marker，`docs/core/design/SESSION.md:185`）与认领集三者皆变 ⇒ 验收②可被判失败；且该字面读与验收③（要求 fork——设计 D-SE33 称 fork 依赖指针翻至目标槽）自相矛盾。作用域未在需求面钉死，实施 / 验证期必出口径冲突。 | 在需求档 §2.3 把 F-CR2 / 验收②④ 的作用域钉死（零副作用面 = 面板拒绝路径：受占 ⇒ 不进入 `switchToSlot`，共享指针 / 端标记 / 认领集 / 解析缓存四不动；核 / CLI 受占 = 切换成立——指针 / 记录按 D-6 / D-4 落点 + 保留集 = 空、fork 依赖该指针），或反向改设计并在验收②写明端归属；需求面与设计面对该机制只留一种表述。 |
| 2 | Clarity / F-CR3 边界 | 🟡 | 释放集两种表述并存且对多绑定端结果相反：一般式 = 落点槽 ∪ 本进程其他活绑定槽（`design/SESSION.md:103`、`:342`）vs 落点式 = 新槽 / 目标槽 / 认领槽（`:104`、`:137`、`:140`、`:352-354`）——单绑定端等价，ACP 多绑定端决定 F-CR3 是否被破；同时 ACP 调用面只在 `newSession` 侧枚举（`:365`：「ACP 四个调用点不动」），`switchToSlot` / `claimSlot` 的释放是无条件（`:104`），设计未证明 ACP 钉槽 / 载入路径不经过二者（源码不在评审范围 ⇒ 该调用面判断未验证），而 `:99` 明示 ACP 与粘性保存不重跑占用判定 ⇒ 若经过，将在存 ACP 会话的认领被释放 ⇒ 双写窗口。 | 保留集只留一条公式并逐落点注明取值（落点槽 ∪ 该进程其余活绑定槽；被占目标 ⇒ 空）；对三个释放原语逐条枚举 / 排除 ACP 调用面（或三者一律调用面 opt-in），把「ACP 不入释放面」写成可核的调用面清单而非一句断言。 |
| 3 | 受影响文件尺寸注记（评审准则 8） | 🟡 | 落点表只给 as-of 行数、无预期增量：源码五档 `design/SESSION.md:363-368`·测试四档 `:376-379` 均无 `≤±N` / structure unchanged；`:370` 的尺度句只对 500 硬限发言，未对 >300 主动拆分线表态——`session-lifecycle.mjs` 310 → 设计自述 ≈320、`session-boot.test.mjs` 440（离 500 上限 60 行）均在 >300 档内；`session-slots-manifest.mjs` 264 + 新增释放集计算是否破 300 无读数；行数本身未复核（源码不在评审范围 ⇒ unverified）。 | 每档补预期增量与跨档判断；>300 档补主动拆分审视结论（或注明「结构不变 + 增量 ≤N」），测试档同样给增量与容量余量。 |
| 4 | 并发落盘纪律（D-SE4 同型） | 🟡 | 释放集写入纪律未钉：设计只说并入各落点既有那一次 `saveManifest` 的 `deletions`（`design/SESSION.md:105`、`:302`、`:363-364`），未写两条——(a) 释放集是否按写盘同一次 fresh 读计算（vs 可能陈旧的内存 manifest）；(b) 写盘后是否同步从内存认领表移除该条目。`saveManifest` 条目级合并 = `{...fresh.slots, ...m.slots}`（`:114`），若内存仍留已释放条目，后续保存会将其复活回写（并覆盖他端新认领）——该型危险本档已列为一等纪律（`:92`：`deletions` + `deadParam` 按调用时状态过滤）。 | 在 §6.16 判据句补写：释放集来源 = 写盘同一次 fresh 快照；释放条目在写盘同时从内存认领表移除，或采用值条件删除（仅当磁盘值仍为本进程 sessionId 才删）。 |
| 5 | 文档结构 | 🟡 | 设计档缺 `## 7.` 节标题：决策表头（`design/SESSION.md:386`）直接落在 §6.16 末行（`:383`）之后，下一节为 `:422` `## 8.`；档内多处回指 §7（`:63`、`:304`、`:338`），需求档 / 批档亦按 §7 定位（批档 `docs/batches/2026-09-21-session-claim-release.md:48`）⇒ 回指无锚、决策表易被读作 §6.16 的附属面。 | 补回 `## 7. 关键决策记录（D-SE1–33）` 节标题（或明确 D-SE 表的节属），使档内 §7 回指有落点。 |
| 6 | Document ownership（重复承载） | 🟡 | §6.16 同时承载 file 级落点表（含逐档行数）与测试面表（`design/SESSION.md:359-380`），而本档 §8.1 自述「受影响文件全清单 / 用例表 / 验收清单」= 一次性批次材料、由批次档承载（`:447-448`）；批档 §2（`:63-76`）同步承载同一张表 ⇒ 同一清单两处维护、行数须双写同步。 | 一份材料只留一个家：设计面留判据句 / 边界情形 / 决策，清单与用例面留批档；或在两处之一明示权威、另一处退化为指针。 |
| 7 | 表述确定性 | 🔵 | VSC 单实例假定在两文档中确定性不一：设计档写作实读口径（`design/SESSION.md:345`、`:302`），批档未决项 4（`:95`）自述为「按单视图假定设计…如需物证级确认需加读数，多窗口 / 多面板形态则假定需复核」⇒ 若假定不成立，保留集口径会放掉另一视图的活绑定认领。 | 统一表述为「假定 + 复核条件」，或补一条保守行为（同进程存在多于一个活绑定时不释放），使假定失效时不产生他端活认领被释放。 |
| 8 | 批档卫生（记录面） | 🔵 | 批档 §2 首行占位句（`:42`「（待设计——…）」）与同节状态行（`:44`「设计完成 · 待评审」）并存（append-only 面不可删；批档 `:101` 已自报）。 | 后续轮次在批档面以一行覆盖式注记标明该占位句已作废（或按批档面清点节登记），避免占位句被读成活工作令。 |

计数：1 🔴 · 5 🟡 · 2 🔵。
评审范围限制：未声明项目标准档与文档地图 ⇒ 方法学合规按 AGENTS.md + 在评三档判断；文档归属准则按本档 §8.1 自述的分层纪律 + AGENTS.md 判断（降级判定）；落点表行数未复核（源码不在评审范围，标 unverified）。

VERDICT: changes-required

### 轮次 2（评审子代理）

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/requirements/SESSION.md | 🔴 | Fixed | 需求面作用域已钉死：`:40: **F-CR2（拒绝零副作用）**：目标槽被另一活进程占用而**拒绝切换**的路径（**作用域 = 面板路径**：受占 ⇒ 判据前置、不进入 `switchToSlot`）…**核 / CLI 受占路径不属本面**——切换成立（警告 + 继续）：指针 / 记录按 D-6 / D-4 落点 + 保留集 = 空释放旧认领（fork 依赖该指针——设计 D-SE33）。`；`:46` 验收②改「面板拒绝路径四不动 ∧ 核 / CLI 受占 = 切换成立 + 下次 fork」；`:47` ④改「同名落点同判据 + F-CR2 面 = 面板拒绝路径」。与设计 `:302`、`:415`（D-SE33）同一种表述 ⇒ 机制级矛盾消解。 |
| 2 | 2 | docs/core/design/SESSION.md | 🟡 | Fixed | 单一保留集公式 + 逐落点代入：`:103: **认领释放（F-CR1 · 2026-09-21 · SESSION-CLAIM 批）**：…**保留集公式** = 落点槽 ∪ 本进程其余活绑定槽（同 cwd manifest 内）…各落点 = 公式代入（`newSession` ⇒ {新槽} · `switchToSlot` 未占 ⇒ {目标} / 被占 ⇒ 空 · `claimSlot` ⇒ {认领槽}）…`；`:105` 指向 §6.16 ACP 调用面表（`:356-358`：`switchToSlot` / `claimSlot` 逐条实读 = 零调用点；`newSession` 四点不传 `releaseStale`）⇒ 可核清单成立。源级断言（调用面 / 坐标）不在评审范围 ⇒ unverified。 |
| 3 | 3 | docs/batches/2026-09-21-session-claim-release.md | 🟡 | Fixed | 逐档预期增量 + >300 档审视已补：`:118: | `thincoder-core/session-slots-manifest.mjs` | 264 | ≤ +25 | 预期 ≤ ≈290 < 300；结构不变（释放集判据单源） |`、`:119`（session-lifecycle 310 / ≤+15 / 「>300 档：结构不变…无拆分需要」）、`:126: | `thincoder-vscode/test/session-boot.test.mjs` | 440 | ≤ +10 | >300 档：组⑮（`:379-410`）等量改写…⇒ ≤450 < 500、余量 ≥50；无拆分需要 |`；设计 `:372` 保留尺度结论 + 指针。行数（实读）未复核（源码不在评审范围）。 |
| 4 | 4 | docs/core/design/SESSION.md | 🟡 | Fixed | 落盘纪律三条已钉：`:346: **落盘判据（D-SE4 同型）**：① 释放集按**写盘同一次 fresh 快照**计算 / 校验（不得以陈旧内存 manifest 直接构 `deletions`）；② 条目删除 = **值条件删除**（仅当该槽 fresh 属主仍为本进程 sessionId——防窗口内他人新认领被误删）；③ 写盘同时从**内存认领表** `m.slotSessions` 移除该条目（防后续保存经条目级合并复活回写）。`；`:106` 指针引用。 |
| 5 | 5 | docs/core/design/SESSION.md | 🟡 | Fixed | 节标题已补：`:379: ## 7. 关键决策记录（D-SE1–D-SE33）`，D-SE 表（`:381-415`）随其后 ⇒ 档内 `:63` / `:304` / `:338` 回指有锚。 |
| 6 | 6 | docs/core/design/SESSION.md + 批档 | 🟡 | Fixed | 清单唯一承载面收正：`:371: **落点与测试面（清单承载）**：file 级落点表（行数 / 预期增量 / >300 档审视）与测试覆盖档位 = **`docs/batches/2026-09-21-session-claim-release.md` §2**（一次性批次材料——§8.1 分层纪律；本档不复制，判据 / 边界 / 决策留本节）。`；`:58` §5 指针同改；§6.16 内已无 file 级清单 / 测试档表双写。 |
| 7 | 7 | docs/core/design/SESSION.md | 🔵 | Fixed | 口径统一为假定 + 复核条件：`:349: **VSC 单绑定（假定 + 复核条件）**：假定 = WebviewViewProvider 单实例视图 ⇒ 同宿主单绑定（依据 `thincoder-vscode/src/extension/chat-panel.mjs:107-116`）；复核条件 = 同 cwd 出现多于一个活绑定（多窗口 / 多面板）⇒ 该落点**不释放**（或按活绑定全集计算保留集）——假定失效不得释放他端活绑定认领。`；`:303` 同口径。 |
| 8 | 8 | docs/batches/2026-09-21-session-claim-release.md | 🔵 | Fixed | §2 首行占位句已不存在——`:42: **状态行**：🔄 设计完成 · 待评审（eng-designer · 2026-09-21）` 直接跟节标题（`:40`），占位句与状态行并存的记录面残留消解。 |
| 9 | (new) | docs/core/requirements/SESSION.md | 🔵 | New: 修正残留 | `:37: **模块目标**：多端并存下，槽认领与共享指针的纪律——**认领随绑定走**（离开即释放），**被拒操作零副作用**（不翻共享指针 / 不写端标记 / 不改认领集）。` ——零副作用清单仍为三项，与 F-CR2 `:40` / 验收② `:46` 的「四不动」（+ 解析缓存）不同口径；建议 §2.3 内同口径。 |
| 10 | (new) | docs/batches/2026-09-21-session-claim-release.md | 🔵 | New: 数值漂移 | `:67` 受影响文件表仍作 `handlers-session.mjs:147`，同节 `:128: **读数更正（同轮实读）**：上文「受影响文件表」ACP 点 `handlers-session.mjs:147` 收正为 `:152`（`:147` = 注释行）；…`；设计 `:356` 用 `:152` —— 同一（现指定的唯一）清单内双值并存，建议就地改写原值。 |
| 11 | (new) | docs/core/design/SESSION.md | 🔵 | New: 未随 F-CR2 同步（残余歧义） | `:300: 场景：打开被另一活进程占用的历史槽 ⇒ 核落 D-2③ 并写新槽记录；端不写 + `_slot = null` → 经缓存重绑本端原槽（占槽判定 `panel-messages-session.mjs:48-55`）。`——现判据下该场景 = 拒绝路径（`:277-278` 受占 ⇒ 不进入 `switchToSlot`；`§6.16:365` 面板对位），「核落 D-2③ 并写新槽记录」半句宜标明为核 / CLI 对位，防验证期按面板路径误读。 |

计数：0 🔴 · 0 🟡 · 3 🔵（前轮 #1–#8 全部落地 ✓；#9–#11 为非阻塞项）。
评审范围限制：未声明项目标准档与文档地图 ⇒ 方法学合规按在评三档自述纪律判断；源码不在评审范围 ⇒ 落点表行数 / 调用面坐标 / 新增 ACP 表断言均 unverified；`^.{301,}` 尝扫显示设计档 `:356` / `:358` 等行 ≥301 字符，但 doc-check 行宽口径（阈值 / 豁免面）不在评审范围 ⇒ 未判超限、不构成发现。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 01:49「排批这两个问题都处理吧」+ 01:21「自动跑」授权 · 代签三条件齐备）**：

- 依据 ① **评审 pass**：§3 轮次 2 = 🔴 0 · 🟡 0 · 🔵 3（#9–#11——非阻塞）；父侧裁定：**#9 / #10 = 已就地收正**（需求档 `:37` 模块目标改四不动口径 ✓；批档 `:50` 坐标 `:147`→`:152` ✓）；**#11 = 收下不改**（`§6.15:302` 已声明「本节单源 + F-CR2 收正」⇒ 旧登记块的指涉面由判据收正覆盖，风险受控）；
- 依据 ② **修正轮已落地并逐条核验**：轮 1 八项（🔴#1 作用域钉死 + 🟡#2–#6 + 🔵#7/#8）+ 轮 2 三项处置——父侧独立复核（2026-09-21 02:1x–02:2x）= 改档实读 ✓ · doc-check 复跑 exit 0 ✓；
- 依据 ③ **token 已签发**（评审通过即发——不落值）。

**批准 = 本批设计（F-CR1 认领释放 + F-CR2 拒绝零副作用 · §6.16 判据句 / 边界情形表 / ACP 调用面表 + D-SE32 / D-SE33）为正式设计，准予实施** ✓。

## §5 实施记录（eng-coder）

### 实施记录（eng-coder · 2026-09-21 · round = initial）

**状态行**：✅ 9 档落地 · 三端 `node test/run.mjs` 全绿 · 终态 = **clean**（内部审计 1 轮 + 内部代码评审 1 轮 → 1 fix round → 收敛；无阻断项）

**交付摘要**：F-CR1（认领随绑定 / 离开即释放）+ F-CR2（面板拒绝路径零副作用）按 `docs/core/design/SESSION.md` §6.16 判据句 / 边界情形表 / ACP 调用面表 + D-SE32 / D-SE33 实施；释放集**判据单源**（`staleClaims`），三落点共用；落盘三条纪律（fresh 快照 / 值条件删除 / 内存移除）落在 `saveManifest` 内部，各落点**零新增写盘次数**。

**逐档落点（file:line = 实施后实读）**

| # | 文件（行数＝换行符数） | 落点 | 要点 |
|---|---|---|---|
| 1 | `thincoder-core/session-slots-manifest.mjs`（297） | `:63` `saveManifest(cwd,m,deletions,opts)` · `:76` `dropStaleClaims`（内存先移除，先于 try ⇒ fresh 不可读亦生效）· `:88` `staleClaims(fresh, opts.release)` · `:90` 并入本次 `deletions.slotSessions` · `:114` `export function staleClaims(src, keep)` · `:289` `claimSlot` 传 `release: [slot]` | 释放谓词（唯一公式）= `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`；保留集 = 落点槽 ∪ 本进程其余活绑定槽；值条件 = `owner === mySessionId`（fresh 面 / 内存面双查） |
| 2 | `thincoder-core/session-lifecycle.mjs`（318） | `:169-177` `newSession(cwd, opts)` 文档 + opt-in 说明 · `:236` `opts.releaseStale ? {setActive:true, release:[slot]} : {setActive:true}` · `:296` `release: occ.occupied ? [] : [slot]` | 保留集代入：`/new` ⇒ {新槽}；未占切换 ⇒ {目标}；被占 ⇒ 空；核受占 = 切换成立（D-6/D-4 不动，`m.active` 与端标记仍写） |
| 3 | `thincoder-cli/src/tui/cmd-new.mjs`（38） | `:11` `const slot = await newSession(agent.cwd, { releaseStale: true })`（行尾注释） | 调用面 opt-in；行号与设计 §6.16:344 引用保持同坐标（`cmd-new.mjs:11`）；ACP 四点不传 |
| 4 | `thincoder-vscode/src/extension/session-io.mjs`（225） | `:157` `newSlot` 传 `release:[slot]` · `:174` 文档随改 · `:181-182` 占用判定前置于 `m.active` 赋值 + 受占分支 `return data`（零写）· `:183-185` 认领 · `:187` `release:[slot]` · `:188-189` marker + 解析缓存（未占才写穿） | F-CR2 判据序收正 = 受占分支四者零写（不认领/不翻共享指针/不写记录/不写缓存）；F-CR1 保留集 = {落点槽} |
| 5 | `thincoder-vscode/src/extension/panel-messages-session.mjs`（93） | `:45-51` `slotOccupancy` 判据前置 → 受占 ⇒ 警示 + `panel._slot = null` + `_loadSession()` + return（**不进入** `switchToSlot`）· `:54-57` 未占路径原语义 | 文案 / `_slot = null` / `_loadSession()` 语义不变；共享指针 / 端标记 / 认领集 / 解析缓存四不动 |
| 6 | `thincoder-core/test/session-slot-write.test.mjs`（284） | `:221-284` 新增 3 用例（切槽释放+重认领 / 落盘判据：值条件+内存移除 / opt-in） | 验收① 核侧机判 |
| 7 | `thincoder-cli/test/manifest-flip-refusal.test.mjs`（207） | `:188-207` 新增 1 用例（真实 `/session` 调用面 `cmd-session.mjs:105`） | 验收① CLI 侧机判 |
| 8 | `thincoder-cli/test/integration/session-resume.test.mjs`（299） | `:262-299` 新增 1 用例（甲离开 X ⇒ 释放 → 乙认领 → 甲再切入 ⇒ 判占 + fork） | 验收③ 机判（注入缝 = 核 process-probe，零真探测） |
| 9 | `thincoder-vscode/test/session-boot.test.mjs`（446） | `:380-411` 组⑮ 断言定形（拒绝前态基准 `before` ⇒ `active` / `slotSessions` 逐字段相等 + marker / 缓存 / `_slot` / 文案原有断言保持） | 验收② / ④ 面板侧机判 |

**判据实现要点（三条落盘纪律如何落地）**：① fresh 快照 = `saveManifest` 内部那一次 `readFileSync`（调用面只传**保留集**，不传删除名单——否则必然以陈旧内存构名单）；② 值条件删除 = 删除集按 fresh 面 `owner === mySessionId` 过滤（窗口内他端新认领不在集内）；③ 内存移除 = `dropStaleClaims(m, keep)` 于写盘同一时机执行（先于 merge ⇒ 条目级合并不复活回写）。

**测试读数（cwd = 各项目根 · `node test/run.mjs`）**

| 端 | 读数 | 备注 |
|---|---|---|
| thincoder-core | **456 tests · 456 pass · 0 fail**（ℹ suites 0 / cancelled 0） | 本会话早期一次读数为 452——差量来自**并行批**（subagent-signal-lines 批）对核测试档的并发编辑（`parent-channel*.test.mjs` mtime 02:30 `family-tools.test.mjs` 02:16），非本批改动面；末次连跑两次读名单逐条一致 |
| thincoder-cli | **764 tests · 13 suites · 764 pass · 0 fail** | 含本批 F-CR1 两用例（manifest-flip-refusal / session-resume） |
| thincoder-vscode | **865 tests · 865 pass · 0 fail** | 含组⑮ 四不动断言 |

**验收对位（需求档 §2.3 ①–④）**：① 核 `session-slot-write.test.mjs:232-254`（绑定 41 → 切 40 ⇒ 41 释放 / 40 = 本进程；回切 41 重认领）+ CLI `manifest-flip-refusal.test.mjs:188-207`（真实调用面）· ② `session-boot.test.mjs:401-411`（四不动）+ 端壳零写 `session-io.mjs:181-182` · ③ `session-resume.test.mjs:270-299`（判占 + `allocateFresh` fork）· ④ 核三原语 × 端壳三件同判据 = `staleClaims` 单源 + `saveManifest` 单源 + `slotOccupancy` 单源（落点见上表）。

**决策透明表（设计沉默处我所作的口径选择）**

| # | 决策 | 理由 / 影响 |
|---|---|---|
| D1 | 释放集**不在调用面构造删除名单**，改为 `saveManifest` 的 `opts.release`（保留集入参）内部按 fresh 快照计算 | §6.16:346 ① 要求「按写盘同一次 fresh 快照计算 / 校验」——调用面自建必然陈旧；落盘载体仍是各落点**既有那一次** `saveManifest` 的 `deletions.slotSessions`（零新增写盘次数） |
| D2 | VSC 端壳受占分支返回值**保持**既有 `return data`（设计只钉「零写」，未钉返回值）——未自创契约变更 | 残留缺口：面板前置判据与端壳内判据间若有并发认领（TOCTOU），调用面无法区分「成功」与「零写拒绝」⇒ 面板可能钉到他端活槽。**内部审计 #3 与内部代码评审 #2 双独立发现**；已随本段上报父侧 / 设计面裁定（候选：受占分支返回可区分信号） |
| D3 | VSC 端壳释放面（`newSlot` / `switchToSlot` 的 `release`）**未加机判用例** | 遵批档 §2 测试面（session-boot 档「等量改写不增用例」）；覆盖缺口如实登记（评审 #3） |
| D4 | `claimSlot` / `switchToSlot` 释放**无条件**（落点即绑定迁移）；`newSession` 释放**调用面 opt-in**（`releaseStale`） | §6.16 判据句 + ACP 调用面表：`claimSlot`/`switchToSlot` ACP 零调用点（实读复核 ✓），`newSession` 四点须不传 ⇒ opt-in |
| D5 | `cmd-new.mjs` 的 F-CR1 说明改**行尾注释**（不占独立行） | 保住设计 §6.16:344 引用的 `cmd-new.mjs:11` 坐标（避免自造引行漂移）；该档行数 ±0 |

**内部审计 / 代码评审轮次与终态**

- **内部审计（explore 子代理 · 只读比对设计）· 1 轮**：结论 = 四类偏离（partial / 静默简化 / doc-drift / 表外）**均未发现**；唯一 partial = 本段（§5）尚未写入（当场已修）；观察 5 项（行数读数漂移 / 端壳返回值缺口 / 修订式表达残留 / 端壳释放面覆盖缺口 / 设计引行漂移）；硬约束 5 条逐条实读成立（释放未进 `ensureActive`/`activeSlot` · ACP 四点零释放 · `switchToSlot`/`claimSlot` ACP 零调用点 · 核 `switchToSlot` 受占语义不变 · 表外档零改动）。
- **内部代码评审（advisor type=code）· 1 轮**：**VERDICT = pass**（6 项 advisory：🟡 档位 299→301 越线（已修）/ 🟡 端壳受占返回值与成功不可区分（= 审计 #3，非本批引入、非阻塞）/ 🟡 端壳面无机判覆盖（= 审计 #5）/ 🔵 四不动依赖解析缓存命中 / 🔵 成功路径占用判据双跑（设计既定代价）/ 🔵 批档行数读数与 §5 记录面待刷新）。
- **fix round · 1 轮（4 项，均已复跑验证）**：① 本段（§5）写入；② `session-boot.test.mjs` 断言消息与注释去「旧断言…按收正改」修订式表达（改纯陈述）；③ `cmd-new.mjs` 注释改行尾 ⇒ 设计引行 `:11` 复位；④ `session-resume.test.mjs` 压缩至 299 行（<300）并逐条复跑。
- **终态 = clean**：无未处置阻断项；D2 为已上报的设计缺口（残留窄竞态，双评审均判非阻塞）。

**面外披露 / 未做 / 偏差清单**

- **表外档：零改动**（git 工作区 diff 并集 = 设计受影响文件表 5 源档 + 4 测试档，无第十档；批档 §5 本段为例外授权面）。
- **未做（均在设计「不做」面内）**：跨 cwd 释放 · ACP 会话关闭面释放 · 提示文案（#161①，用户裁「不改」）· 槽文件格式 / `version` / 端标记语义 / 共享 active 语义 · 新增机械门。
- **偏差**：无（设计判据逐条落地）；D2 为设计沉默处缺口的**上报**（未自创变更）、D3 为覆盖缺口**登记**。
- **设计面维护项（非本代理笔域，报只不改）**：① `docs/core/design/SESSION.md` §6.10 D-4 四落点引行 `session-io.mjs:88/123/169/195` ⇒ 实施后 `:88/123/175/199`；② 同档 §6.15:279/:299 引 `session-io.mjs:182-185`（记录 / 缓存仅未占才写穿）⇒ 实施后 `:186-189`；③ 批档 §2 行数刷新表三档超预期（`session-slots-manifest.mjs` 264→297 预期 ≤≈290 · `session-slot-write.test.mjs` 218→284 预期 ≤258 · `session-resume.test.mjs` 259→299 预期 ≤299）；④ 设计 §6.16:349 VSC 单绑定「复核条件」在本批实施中**未代码化**（无多活绑定探测面——实施遵从假设；假定失效时的保守行为无落点，随 D2/D3 一并报父侧）。

## §6 验证与收口（父代理）

**验证读数（父侧独立复跑 · 2026-09-21 02:4x）**：三端 `node test/run.mjs` = **核 456/456 · CLI 764/764 · VSC 865/865**（exit 0 ×3，与 §5 读数逐字一致）；`node scripts/doc-check.mjs --root .` exit 0（#45 复跑 + 父侧复绿）。承重四处实读复核 ✓——`session-slots-manifest.mjs:114-126`（`staleClaims` 判据单源 + `dropStaleClaims`）/ `:76-92`（落盘三纪律：内存先移除 ⇒ fresh 快照 ⇒ 值条件删除并入本次 `deletions`）/ `session-io.mjs:181-182`（F-CR2 判据序收正 + 受占零写）/ `session-boot.test.mjs:401-411`（组⑮ 四不动逐字段断言）。

**§5 决策表裁定（D1–D5）**：D1 ✓ 采纳（保留集入参 + fresh 快照内部计算）· **D2 = 父侧裁定：本批按现值收口（不扩面——避免 fix-round 走私新语义）＋ 另案收正——入册 #171**（修法 = 设计面「受占 ⇒ 返回可区分信号」先行 + 端壳/面板对位，归批；窗口窄 + 四不动保护在位 ⇒ 非阻塞）· D3 = 登记，并入 **#168 第三则** ✓ · D4 ✓ / D5 ✓ 采纳。

**设计面维护项处置（①–④）**：① / ② = **父侧小项收正（机械坐标 · 可 revert）**——`docs/core/design/SESSION.md` `:262` / `:282` 引 `session-io.mjs :169/:195` ⇒ `:175/:199` · `:279` / `:299` 引 `:182-185` ⇒ `:186-189`；③ = 批档 §2 行数刷新在册（264→297 · 218→284 · 259→299——超预估值但均 ≤500 · 结构未变 · as-of 口径不追值）；④ = 随 #171 一并裁（VSC 单绑定复核条件的代码化与否）。

**台账**：#161② / #165 = **已核销 2026-09-21**；新登 **#171**（TOCTOU 返回值语义）· **#168 追第三则**（端壳释放面无机判）· #167（cmd-eng 裸 `activeSlot`）另案在册。

**结算清单（D7 逐项）**：① 六段齐（§1–§6 · 各自作者在案）✓ ② 状态行 = 已收口（§2 首行已改）✓ ③ 计数 = 9 档实现（5 源 + 4 测）+ 3 文档档 ✓ ④ 指针解析 = 需求 §2.3 ↔ 设计 §6.16 ↔ 本档 §2/§5（三方 ✓）⑤ 变更记录 = 设计 / 需求档在案 ✓ ⑥ 台账核销 = #161②/#165 已核销 ✓ ⑦ 前批遗留交叉核对 = 无（本批自足）✓

**记录冻结**：本档自本行起**冻结**（不再回改）；后续项 = #171 / #168 第三则与 §5 未做清单内的另案。
