# 2026-09-30 · 块到达时点归位
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 20:48（原话「子agent返回时你是直接就插进会话流了……而不是在 auto-turn digest 的时候插的，把会话流插乱了」）+ 修复轮 #3 异源裁定（核件 settle 即发 `done` ⇒ 桌面归档尾追即时入流——`async-settle.mjs:272-278` ∥ `relay.mjs:135` ∥ `subagent-reduce.mjs:186-190`）。
> 台账 = #746（desktop · 归批）。前情 = 承 `docs/batches/2026-09-30-digest-reflow-anchor.md`（#738——块轮对拆位的**第二源**：块到达时点面）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**需求（用户判据逐字）**：块与轮**同刻同邻**——**绝不长进「别人正在跑的话」里**（用户 2026-09-30 20:48：「子agent返回时你是直接就插进会话流了，直接插进了正在跑的对话里，而不是在 auto-turn digest 的时候插的，把会话流插乱了」）。

**父侧实读证据（20:48 DOM）**：`129t→132t→133S(=[✓ advisor#6])→134t→136t`——块夹于当轮工具块列内部；其消化轮 `D@138`（19.4s）落于回复之后 ⇒ **块先到（回合中途）∥ 轮后到（另处）** = 对拆 + 串流。

**根因链（修复轮 #3 异源裁定 · 已核实）**：发射器 = **核件 settle 时点**（非宿主起跑窗）——`thincoder-core/agent-tools/async-settle.mjs:272-278`（非挂起期 = 回合运行中 settle ⇒ `else` 支立即发 `⟦ev⟧done`）⇒ `thincoder-render-core/subblocks/relay.mjs:135` ⇒ `thincoder-desktop/renderer/subagent-reduce.mjs:186-190` `archiveIntoFlow`**当刻尾追**。两端 done 语义分叉（CLI 定格 = 原地冻结 ∥ 桌面 = 归档尾追）= 真根因候选。

**授权**：本会话 00:14「排空」/ 18:28「自动跑完」全链授权。**前情** = #738（第一源已修：起跑窗挂 ∥ 座次面——本批 = 第二源，块到达时点面）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（核面发射器收正（非挂起态 settle ⇒ ⟦ev⟧settled）∥ 归档统一随 #738 消费窗管线 ∥ 桌面产品码零触）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**

① **发射器收正**：非挂起态 settle 不再发 `⟦ev⟧done`（改发 `⟦ev⟧settled`）——归档触发点自「settle 时点」归位至「消费时点」（`thincoder-core/agent-tools/async-settle.mjs:272-278`）。
② **判句落定**：J1 流内不变式（S 块不出现于任一运行中回合块列内部）∥ J2 [块][轮] 对不拆（归档 ≡ 消费同刻；起跑窗形居消费行族之前）∥ J3 块可见（驻留 → 归档全程可见、零删块）。
③ **与 #738 衔接**：同类归位统一走既有消费窗管线（起跑窗补发 ∥ reclaim 兜底 ∥ 退出 freeze）——零新机制、零 #738 回退。
④ **记录面零改 ∥ 「只留当轮」零改**：归档时 `record:append` 照发（形 ∥ 通道 ∥ 折叠单源零触）；#738 显示面口径零触。
⑤ **验收**：机检两形腿 + 真机一条（父侧真跑闭合）。

**设计档落点（本席已落 · 同轮）**

- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8：「**settle 延迟冻结（两态统一 · #746）**」条（原「挂起态 settle 延迟冻结 ∥ 正常回合内完成即冻结」分流退场；`⟦ev⟧done` = 消费面补发）+ 时序边界句 ∥ 回合尾语义句同拍 + 变更记录一行。
- `docs/desktop/design/RENDERER.md`：§1 挂起窗行（块归档句补「驻留块来源 = 全族 settle」）∥ §1.1 块归档面（`settled` 驻留块含非挂起态 settle——`⟦ev⟧done` 不再自 settle 点发射）+ 变更记录一行。
- `docs/desktop/design/PROJECT.md`：**KD-36**（块侧句）∥ §6.1 **D4** 行（本批判据）∥ §7「**块到达时点归位批注**」（判句 + 两形腿 + 真机一条）∥ §4.2 本批「现行 ⇒ 预期」块 + 变更记录一行。

**机制设计（判句 + 判由）**

**根因（承 §1 已核实链，本席复读实证）**：核件 settle 时点分支——非挂起期（回合运行中）settle ⇒ `else` 支立即发 `⟦ev⟧done`（`thincoder-core/agent-tools/async-settle.mjs:272-278`）⇒ `thincoder-render-core/subblocks/relay.mjs:135` 映射 ⇒ `thincoder-desktop/renderer/subagent-reduce.mjs:186-190` `archiveIntoFlow` **当刻尾追入流**——块夹进运行中回合块列（真机 20:48：`129t→132t→133S→134t→136t`；其消化轮 D@138 后到 ⇒ 对拆）。

**选中方案（a · 核面发射器收正）**：非挂起支与挂起支同发 `⟦ev⟧settled`（发射行自 `if/else` 提级；**驻留分流保留**——挂起态 ⇒ 入 `_pendingAsyncResults` + 出池；非挂起态 ⇒ 留池 done-in-pool，回合尾直注入兜底 ∥ 挂起会话 sweep 两消费链照旧）；归档随 #738 已落消费窗管线入流。

**判由（三连）**：
① **事件语义与消费路由一致化**——`done` 发射句自陈的前提（「回合内 settle ⇒ 立即冻结 + 回合尾 `collectSettledAsync` 直注入」）对全部 UI 端不成立（CLI ∥ VSC ∥ 桌面三端皆 `suspDriven: true`，回合尾直注入已撤——报告的消费路由恒为 digest）；`settled` =「已结算、驻留待消费」——正是本症所需语义，且为闭集既有事件（relay ∥ 态机 ∥ 驻留面 ∥ 消费窗补发面全既有）。
② **#738 管线全量复用**——起跑窗补发 `done`（`thincoder-desktop/src/main/suspension-drive.mjs:139-142`）∥ `hooks.reclaim` 兜底（`:213`）∥ 退出 freeze（`:214-218`）三点即消费窗；非挂起态 settle 归一后，**全部归档触发点仅落回合边界**（起跑前 ∥ 回合止后 ∥ 无回合在跑）——「S 不夹运行中回合」成为结构不变式。
③ **桌面产品码零触**——`settled` 通路既有（`thincoder-desktop/src/main/agent-bridge.mjs:52` ∥ `thincoder-desktop/renderer/subagent-reduce.mjs:35` 闭集 ∥ 核态机 `awaitingDigest` 驻留支既有）——本批不新增桌面机制。

**判句（落本批验收 · 亦落设计档）**：
- **J1 同刻同邻（流内不变式）**：归档块 S（`kind:"subagent"`）**不出现于任一运行中回合的块列内部**（S 流内位次 ∉（运行中回合首块，运行中回合末块）——文档序）；机制等价判句 = 桌面归档入流的全部触发点（起跑窗补发 ∥ reclaim 补发 ∥ 退出 freeze 补发）只落回合边界；核非挂起态 settle 零 `⟦ev⟧done` ⇒ 回合运行中零归档触发器。
- **J2 [块][轮] 对不拆**：块的归档时刻 ≡ 其消费时刻——起跑窗形 ⇒ 块居消费行族**之前**（#738 座次面：插入点纪律条 ∥ 帧尾落位）；reclaim 形 ⇒ 居消费回合之后。同一消费面 `done` = 唯一归档触发。
- **J3 块可见（零删块）**：结算后至归档前，块驻活动区（冻结 + `done · awaiting digestion`）；归档时照发 `record:append`——块全程可见、记录面照留。

**与 #738 已落机制的衔接**：起跑窗挂点 = `suspension-drive.mjs:139-142`（`reemitDone`——零改）；座次面 = `renderer/views/chat-digest.mjs` `syncDigest` ∥ `digestBoundaryOf` · `renderer/views/chat-digest-seat.mjs`（零改）；#738 六腿 ∥ 四档零回退。本批补**发射器侧**：把「挂起期 settle 才驻留」扩为「settle 恒驻留」——#738 管线自此收全族。

**受影响文件与测试面（产品码面 · 实施轮）**

| # | 文件 | 现值（as-of 设计轮实读） | 预期 | 改动 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/async-settle.mjs` | **302** | **≈306** | `:272-278`：非挂起支 `⟦ev⟧done` ⇒ `⟦ev⟧settled`（发射行自 `if/else` 提级——驻留分流保留）+ `:180-183` ∥ `:268-270` 注文收正 |
| 2 | 批内件（新档）`docs/batches/2026-09-30-block-arrival-timing.test.mjs` | — | **≈120–160** | 两形腿（见验收）+ 幂等腿；随批留存 · 不进仓套件 |
| 3 | 设计档三档 + 变更记录 | — | — | 见上「设计档落点」（本席已落） |

**零触面**：桌面产品码（`thincoder-desktop/**`——`settled` 通路既有）∥ `thincoder-render-core/**` ∥ 协议（relay 映射单源零改）∥ 记录面（形 ∥ 通道 ∥ 折叠单源）∥ #738 已落四档 ∥ 「只留当轮」语义。

**测试面**：实施轮跑 —— 批内件（`node --test docs/batches/2026-09-30-block-arrival-timing.test.mjs`）；邻批件连跑 = `docs/batches/2026-09-30-digest-reflow-anchor.test.mjs`（#738 十腿——须零回归）；核侧无既有单测涉面（`thincoder-core/test/` 两档不涉）⇒ 覆盖面全在批内件。

**验收对照**

- **腿 A「S 不夹运行中回合」**：(a) 发射器级——`settleAsyncEntry`（桩 parent 无 `_suspended` ∧ 桩 ctx 捕 `onToken`）：捕获 token 含 `⟦ev⟧settled` ∧ 不含 `⟦ev⟧done`；条目仍在池（`done === true`——驻留分流保留）。(b) 渲染级——`onSubagent` 收 `settled` patch ⇒ `blocks` 零 `kind:"subagent"` 增项（运行中回合块列不被插入）∧ 该块 `awaitingDigest === true` ∧ 未归档（`region !== "flow"`）。
- **腿 B「[块][轮] 对不拆」**：消费窗 `done` patch（起跑窗补发形）⇒ 归档入流——`blocks` 尾增 `kind:"subagent"` 且其下标 > 运行中回合全部块下标；重复 `done`（reclaim 兜底形）⇒ 幂等零增（已归档墓碑零动作）；配座次面（假 DOM，沿 #738 批件脚手架）——[块挂载][行族渲染] 两序 ⇒ 文档序 [块][行族]。
- **真机一条**：结件于回合运行中 ⇒ 块**待轮**（驻留活动区、`done · awaiting digestion`、不入流）、回合止后随起跑窗归档、居消化行族之前；DOM 序 = 无 S 块夹于运行中回合块列内部（父侧真跑闭合——D16 义务）。

**关键决策（含被否）**

- **KD-746-A（选型 = 核面发射器收正）**：判由三连见上。**被否 (b) 渲染面缓置**（任务候选 b）——消费时机知识在宿主（起跑前 pending 快照 ∥ `consumedByRun` 回收集）；渲染面缓置须自建边界定义（回合尾 ∥ 起跑窗 ∥ reset ∥ 重载——「缓置窗口的边界定义」即其不可约风险）+ 第二时机权威（违 D2 精神）。**被否「宿主抑制 done 帧」** = (b) 同类（边界定义同题——层级上移一档）。
- **KD-746-B（事件取值 = `settled` 而非新事件型 ∕ `done` 携旗标）**：闭集既有（`relay.mjs:134` ∥ 态机 `settled` 支 ∥ 三端消费面全既有）；零协议面扩。被否「新事件型」（三端映射面扩 + 闭集改）。
- **KD-746-C（非挂起支「共停靠」被否）**：若非挂起支亦 `parkAsyncPending`（全量同挂起态）——违 headless 回合尾直注入兜底枚举面（`collectSettledAsync` 扫池；单回合直连调用结果将滞留 pending 不注入 ⇒ 回归）⇒ 驻留分流保留、仅事件面统一。
- **KD-746-D（桌面零触）**：不新增桌面机制；#738 四档 ∥ 十腿 ∥ 座次面零触（#738 已落修复零回退 = 本批禁止项）。
- **KD-746-E（记录面）**：记录形零改——归档时 `record:append` 照发；归档 idx 随消费窗（与 #738「记录 idx 随动」裁定同向，非新例）。

**上抛 / 列报**

① **跨端面（CLI ∥ VSC——事件面收敛，行为差登记）**：本核改后，非挂起态 settle 在三端一律驻留、冻结落其 reclaim ∥ freezeAll 点。CLI：块位置**不变**（`_freezeAt` = settle 时刻流位置——`thincoder-cli/src/tui/subagent-blocks.mjs:250`；与旧「done 即冻」同值）、冻结时机移后（settle 时刻 ⇒ 首发 reclaim）；VSC：归档落流仍其 reclaim 面（`thincoder-vscode/src/extension/suspension.mjs:112-119`——「reclaim 后挂」既有形）。**产品码零触**；**注释 ∥ 档句漂移清单**（收正候选——随本批补笔 ∥ 对齐批，父侧裁）：`thincoder-cli/src/tui/subagent-blocks.mjs:37-39` ∥ `:205-206` ∥ `docs/cli/design/TUI.md:341` ∥ `:414-415` ∥ `:452`（「done＝settle 时发」句族）；VSC 对位注释同族。
② **同族发射器（未覆盖 · 既有）**：consult 子块 settle 亦发 `⟦ev⟧done`（`thincoder-core/agent-tools/consult.mjs:248-250`——per-child、无消费窗补发面）——桌面同形可夹；**不入本批射程**（根因链点名面 = `async-settle.mjs`；子块归档时机须另定消费面）——报父侧裁。
③ **历史批件结构断言重锚面**：`docs/batches/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs:285` ∥ `docs/batches/2026-09-29-desktop-residuals-sweep-waveB.test.mjs:100`（对 `async-settle.mjs` 行内容 ∥ 行号断言）——本件改动后须重锚（实施轮随跑核）。
④ **需求侧笔（父侧）**：需求档 `docs/desktop/requirements/PROJECT.md` D3 ∥ D20 行「子 agent 完成块归档入流（终态折叠 + 流内留场）」与现行不抵（时点精度归设计层）；如需以需求判据锁「同刻同邻」= 父侧笔。

**边界（本批不做）**：#738 回退零触 ∥ 记录形零改 ∥ 「只留当轮」零改 ∥ 零删块（块全程可见）∥ CLI/VSC 产品码零触（行为收敛仅登记）∥ consult 子块（列报）∥ 会话中止残窗（settle → 即中止 ⇒ 块随会话清——驻留块清场面既有语义，非本批引入）。

**修复轮（评审轮 1 · 发现 #1–#4 逐号 · 2026-09-30 · 父侧裁 = 全采纳）**

- **#1（越线登记）**：核档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.20.4 拆分计划增 `thincoder-core/agent-tools/async-settle.mjs` 行（**302 → ≈306**——触碰后越 300 软线；候选拆分面 = **墓碑族**（`carrierField:53` ∥ `writeTombstoneTo:64` ∥ `writeTombstone:74` ∥ `tombstoneOf:87`——≈50 行）抽 `async-tombstone.mjs`；消解窗口 = 该档下次结构性触碰的批）；同块「未触碰」句旧读数 279 退场（该档读数单源 = 登记行）。`docs/desktop/design/PROJECT.md` §4.2 行 1 补登记指针。
- **#2（规范面残句删净）**：核档 §6.8 条删「原「非挂起态 ⇒ 回合内立即发 `⟦ev⟧done`（完成即冻结）」分流退场」；`docs/desktop/design/RENDERER.md` §1.1 块归档面删「`⟦ev⟧done` 不再自 settle 点发射」——两处只留现行口径（历史已载两档变更记录面）。
- **#3（跨端验证点登记）**：落 `docs/desktop/design/PROJECT.md` §10 **CZ** 行——含「CLI『无补发』下冻结触发面」核点（`thincoder-cli/src/tui/subagent-blocks.mjs:250` 设锚 ∥ 消费窗两钩 `thincoder-cli/src/tui/suspension-drive.mjs:173-174`）；VSC 对位 = `thincoder-vscode/src/extension/suspension.mjs:112-119`；端差 ⇒ 落端档登记面（`docs/cli/design/TUI.md` ∕ `docs/vsc/design/WEBVIEW.md`）。§4.2 零触面句补核点指针。
- **#4（批内件规模预期）**：`docs/desktop/design/PROJECT.md` §4.2 行 2 补「**≈120–160 行 · 用例 = 两形腿 + 幂等腿**」。

**三档变更记录均增修复轮行 ∥ 零新语义 ∥ 产品码零触 ∥ §1 ∥ §3–§6 零触。**

**收正轮（对帐后收正 · ①–④ 逐号 · 2026-09-30 · 父侧裁定 + 用户口径修正〔三端对帐之目的 = 统一——差异出路 = 消除；「登记保留」通道已撤销〕）**

- **①（VSC 半句 · 半错收正 + 行为差补录）**：上抛① 块 VSC 半句「归档落流仍其 reclaim 面」半错——**挂起期 settle ⇒ reclaim ✓；非挂起期 settle：现盘 = 当刻尾追**（`thincoder-render-core/subblocks/state.mjs:249-253` ∥ `thincoder-vscode/webview/activity.js:109`）；#746 落地后该径行为将变为**回收面边界前插**（`thincoder-vscode/src/extension/suspension.mjs:112-119` → `state.mjs:236-238` → `activity.js:108`）⇒ **该行为差补录**（前登记面只有「注释 ∥ 档句漂移」——现并此差）。
- **②（「后挂」措辞收回 · 重述）**：「reclaim 后挂」措辞收回——两端实况 = **触发点 = reclaim ∥ 落位 = 消费行族之前**：CLI `thincoder-cli/src/tui/subagent-freeze.mjs:233/:242`；VSC `thincoder-vscode/webview/activity.js:102` ∥ `docs/vsc/design/WEBVIEW.md:209/:218`（「块在 digest 文本前」∕「边界之前」）。（`docs/batches/2026-09-30-digest-reflow-anchor.md:50/:99` 同措辞两处 = 其收正另轮 · 本轮零触。）
- **③（缺失差项照补 · 框 = 待统一差异）**：`docs/desktop/design/RENDERER.md` §1.1 消化行族条补**待统一差异**两条（**不作「本端收正差」既成列**）——a) **VSC 无轮容器**（并列兄弟——`thincoder-vscode/webview/chat-status.js:72-89`）vs 桌面单轮容器（`thincoder-desktop/renderer/views/chat-digest-seat.mjs:93-95`）；b) **cap 行位置**：VSC 内容之后尾追（`chat-status.js:97-105`）vs 桌面轮行组内（`chat-digest-seat.mjs:82-88`）；**统一方向待裁**。同句副本 `docs/desktop/design/IPC.md:25` 同拍（一致性面）。
- **④（统一待办落 §10）**：`docs/desktop/design/PROJECT.md` §10 增 **DA** 行——**统一待办形**（逐条 = 三端现状坐标 + **统一方向待裁**）：① 显示面轮数——只留当轮（桌面）vs 全量累加（CLI ∥ VSC：`thincoder-cli/src/tui/suspension-drive.mjs:90-91` ∥ `thincoder-vscode/webview/chat-status.js:72-89`）；② 行族结构——单轮容器 ∥ cap 行位置差（坐标详 DA 行）。落位判由 = 待裁项归 §10「上抛与报告项」（CZ 同批先例）；§7 批注 = 验收面 ∥ §2 = 已决 KD 面——均不合待裁项。不落「已裁 ∥ 不统一 ∥ 登记接受」形。

**零新语义 ∥ 产品码零触 ∥ 端侧行为改动 = 零 ∥ 机制本体零改 ∥ 三档变更记录（RENDERER ∥ IPC ∥ PROJECT）均增收正轮行 ∥ §1 ∥ §3–§6 零触（本席只笔 §2）。**

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**独立设计评审（#746 块到达时点归位设计 · 设计轮）——发现表（逐字）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Affected-file size annotations（判据 #8） | 🟡 | 受影响表列 `thincoder-core/agent-tools/async-settle.mjs` **302 ⇒ ≈306**（`docs/desktop/design/PROJECT.md:1047`）——改动后越/在 300 顾问线上，但三档评审面内无该档**拆分预案 ∥ 越线登记**：核档既有登记块（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:320-322`）对该档仍载旧读数 **279**（「未触碰」句）且本批未同拍；同档先例（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:117`「越软线拆分面（`subagent-scheduler.mjs` 398）已在 §6.20.4 登记，不重复」）表明越软线档须带登记面。行数标注未独立抽查（源档不在本次声明评审范围——`unverified`）；302 ∥ ≈306 两值均 >300，±数行漂移不改变越线事实。 | 为该档补拆分预案（候选拆分面 + 消解窗口）或给出既有越线登记指针（登记若在本批未审档面 ⇒ 注明档名与行）；核档内该档读数与登记面同拍。 |
| 2 | Doc hygiene（规范面残句） | 🟡 | 新增规范行留修订式残句：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:76`「原「非挂起态 ⇒ 回合内立即发 `⟦ev⟧done`（完成即冻结）」分流退场」；同族实例 = `docs/desktop/design/RENDERER.md:47`「`⟦ev⟧done` 不再自 settle 点发射」。失效表述的历史归记录面（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:834` 变更记录行等已载）。 | 规范行只留现行口径（「settle 一律发 `⟦ev⟧settled`；`done` = 消费面补发」∥「含非挂起态 settle」），失效表述自规范面删去。 |
| 3 | Scope coordination（跨端面） | 🟡 | `docs/desktop/design/PROJECT.md:1051` 断言「跨端面（CLI ∥ VSC——…冻结落其 reclaim ∥ freezeAll 点；产品码零触——上抛父侧）」，`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:76` 列两端消费点（VSC = reclaim ∥ 退出 freeze；CLI = 本端 reclaim ∥ freezeAll 冻结，无补发）——均系端侧行为断言；端档 ∥ 端码不在本次三档评审面（`unverified`）。协调项（非缺陷）。 | 登记协调项：非挂起态 settle 改 `settled` 后两端「驻留 → 消费点冻结 ∥ 归档」链行为核（含 CLI「无补发」下冻结触发面）；核出的端差落端档登记面。 |
| 4 | Test-face annotation（`≤±N` 惯例） | 🔵 | 受影响表行 2（`docs/desktop/design/PROJECT.md:1048`）批内件只述「两形腿」、无规模预期（既有惯例 = 「≈N 行 · M 用例」；先例 = 堆取证 E4-JS 评审发现 5）；批内件不计线（KD-4）豁免在案、不触发判据 #8。 | 补规模预期（≈N 行 · M 用例）或就地加「批内件不计线（KD-4）」括注。 |

**VERDICT: pass**（计数：🔴 0 ∥ 🟡 3 ∥ 🔵 1）

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30 22:0x）**：依据 = 用户 2026-09-30 00:14「排空」/ 18:28「自动跑完」全链授权 + **设计评审通过**（本会话轮 1 = pass〔🟡1 ∥ 🔵3〕——评审发现全部经收正轮落位）+ 三端对帐（#17）完成及其乱源收正（#18）落位。

**实施舱** = eng-coder（设计令牌已签发——值不入档）。**实施范围** = 核面 `thincoder-core/agent-tools/async-settle.mjs`（唯一产品码改动）+ 批内件（最小）。

**验收** = 设计判句（**S 块不入运行中回合块列内部** ∥ **[块][轮] 对不拆**）+ 真机 = 父侧。

**【补笔说明（父侧如实披露）】**：本段按流程应在派舱**前**落笔；实际派舱（22:03）时漏落、**事后补记**（22:06）。机械门（设计令牌）不受影响——令牌 = 评审签发之物；本漏 = 记录面漏笔，不是机械绕过。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-30 · 终态 clean（审计 CLEAN ∥ 评审 pass ∥ 修正轮 1））

**交付摘要**

- **产品码（唯一改动面）**：`thincoder-core/agent-tools/async-settle.mjs`——非挂起态 settle 改发 `⟦ev⟧settled`（不再当场发 `⟦ev⟧done`）：`else` 支发射行删除、发射提级为两态单点（`:279`），驻留分流保留（`:272-275`：挂起态 ∥ consult ⇒ `parkAsyncPending` + 出池；非挂起态 ⇒ 留池 done-in-pool）；`:180-183` ∥ `:268-271` 注文收正 + `:276-278` 新注。
- **批内件（新档）**：`docs/batches/2026-09-30-block-arrival-timing.test.mjs`——5 腿：A-a 发射器级 ∥ A-c relay 一跳 ∥ A-b 渲染级 ∥ B-模型（归档位次 + `record:append` 照发 + 重复幂等）∥ B-座次（假 DOM 真视图两序 ⇒ 文档序 [块][行族]）；随批留存 · 不进仓套件。
- **零触面确认**：`git diff` 仅 1 档产品码（桌面 ∥ VSC ∥ CLI 零触）；`consult.mjs` 同族零触；#738/#747 已落面零回退；记录形 ∥ 协议 ∥ 「只留当轮」零触。
- **实读行数**：`async-settle.mjs` = **302 内容行**（口径 `split("\n").length−1`；read 工具报 303 行；改前 301——净 +1 行）；批内件 = **325 行**。

**跑测读数（一行式）**

- 批内件：`node --test docs/batches/2026-09-30-block-arrival-timing.test.mjs` = **5/5 绿**（A-a ∥ A-c ∥ A-b ∥ B-模型 ∥ B-座次）。
- 邻批件（#738 十腿）：`node --test docs/batches/2026-09-30-digest-reflow-anchor.test.mjs` = **10/10 绿**（零回归）。
- 敏化核（先红后绿）：发射行临时回改 `⟦ev⟧done` ⇒ 腿 A-a 红（「驻留事件在场」断言失败）；回改 ⇒ 复绿（断言对旧行为敏感）。
- 历史批件（§2 上抛③ 随跑核）：waveB 5/7（2 红先于本件——`subagent.mjs:271` ∥ `subagent-async.mjs:281`）；wave-a 4/7（3 红 = #731 断代失效在册）。两件非活门，未重锚（封存件零触）——报父侧裁。
- 仓套件：**未跑**（纪律：收口门在父侧单跑；`thincoder-core/test/` 两档不涉）。

**决策透明表（落码级）**

| # | 决策 | 依据 | 被否 / 替代 |
|---|---|---|---|
| 1 | 发射行提级两态单点；驻留分流原样保留 | §2 KD-746-A/C ∥ §6.8「settle 延迟冻结（两态统一）」 | 被否：非挂起支共停靠（KD-746-C——headless 回合尾直注入兜底回归） |
| 2 | 座次腿走真视图（`mountChat`/`settleFrame` + 假 DOM 内联） | §2 验收对照「假 DOM，沿 #738 批件脚手架」；#738 件无导出面 + 历史批件零触 ⇒ 只能内联 | 被否：纯模型座次断言（不覆盖 `digestBoundaryOf` 守卫前插径） |
| 3 | 追加腿 A-c（relay 一跳） | 顾问评审 🔵#5（发射器 ↔ 渲染面链闭合） | 增补，非替代（零产品码触） |

**审计与代码评审轮次与终态**

- 内部分歧审计（explore · 只读）轮 1：**CLEAN**——四类偏差均未发现；J1/J2/J3 逐条兑现；批内件规模判定 = 脚手架所必需（非简化）。
- 顾问代码评审（advisor · code）轮 1：**pass**（🔴 0 ∥ 🟡 3 非阻塞 ∥ 🔵 2）。
- 修正轮：**1 轮**——补腿 A-c（🔵#5）；§5 落档（🟡#3 消解）；🟡#1（302 > 300 顾问线）= §6.20.4 在册债务（不动）；🟡#2 ∥ 🔵#4（规模 / 行数预期 vs 实读）= 设计档同拍面 → 报父侧。
- **终态 = `clean`**（修正后复跑 5/5 绿、邻批 10/10 绿；无未决红）。

**残留 / 列报**

- ① 设计档读数同拍（报设计舱）：`docs/desktop/design/PROJECT.md:1061` ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:322` 载「302 ⇒ ≈306」——实读 302（净 +1）；`PROJECT.md:1062` 批内件 ≈120–160 行 vs 实读 325（脚手架内联；KD-4 不计线豁免在案）。
- ② 端侧陈旧句族 ∥ consult 同族（§2 上抛①/② 在册）：CLI/VSC「done = settle 时发」注释句族（例 `thincoder-cli/src/tui/subagent-blocks.mjs:38`）与 `consult.mjs:248-250` `⟦ev⟧done`——本批零触，报父侧裁。

**限定（同日补笔）**：上文「`git diff` 仅 1 档产品码」= **本席改动面**之谓——工作树全量 `git status` 另载前批未提交改动（如 [#738] `thincoder-desktop/renderer/views/{chat-digest-seat,chat-digest,chat-tree}.mjs` ∥ `docs/batches/2026-09-30-digest-reflow-anchor.test.mjs` 等），**非本席所触**；本席写面 = `thincoder-core/agent-tools/async-settle.mjs`（M）+ `docs/batches/2026-09-30-block-arrival-timing.test.mjs`（新增）+ 本段（§5）。

## §6 验证与收口（父代理）
