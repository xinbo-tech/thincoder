# 2026-09-30 · 消化回流归位（留档块落位 · 避开尾巴）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 18:43 走查质问（「子agent固化回流…仍在消化轮最末尾…搞不定了吗？」）+ 父侧真机取证（DOM 位次同比 ∥ 锚点与归约代码实读）。
> 台账 = #738（desktop · 归批）。前情 = docs/batches/2026-09-30-digest-persistence.md §6（已收口 2026-09-30）· #720 轻通道轮一（同面补笔）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-30
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：进行中（设计舱点火 · 需求源 = 台账 #738）

**本批性质**：用户走查质问的**未达项修复批**——「被消化的子 agent 块固化回流的落位」：应居其消费消化行族**之前**（用户 2026-09-30 14:44 已裁口径），现仍落流尾（用户 18:43 二报：「仍在消化轮最末尾……放不到消化轮的头部？」）。

**用户原话**：「你查一下为啥子agent固化回流的时候仍然在消化轮最末尾？还是没有放到消化轮的头部？这个问题是搞不定了吗？」

**父侧取证（2026-09-30 18:4x · 真机 + 代码双证）**：
- 落点锚 = `thincoder-desktop/renderer/views/chat-digest.mjs:288-298`（`digestBoundaryOf`）——守卫 = 「尾位连续消化行族首元素（唯当末节点为消化行元素、且其后零 `[data-block-kind]` 块节点）」；守卫不过 ⇒ `fallback` = 常规插入点 = **尾插**。
- 归档（回流）时点 = `thincoder-render-core/subblocks/state.mjs:237-238`（`awaitingDigest` 收 `done` 才 `archive`）→ 经 `thincoder-desktop/renderer/subagent-reduce.mjs:190` `appendBlock` 尾追进流。
- 真机实据：18:43 屏面 = [消化行族 144–154][会话输出 155–156][归档块 **157**]（最尾）；本轮又一枚归档（#16）= 落流尾，与 #14 同形 ⇒ **守卫的成立格近乎从不满足**（#720 补笔只在「族恰为流尾」一格生效 ⇒ 实际形同虚设）。
- 硬约束（设计须正面处置）：「DOM 块序 ≡ 模型块序」不变式 + 对齐步 ⇒ 族后已有块时，块**跳不到**族前 ⇒ 须改**时点**（A：归档提前至消费轮起跑窗）或改**不变式**（B：留档块跨块前插），二择一。

**授权口径**：用户 18:28「自动跑完」——设计 → 评审 → 批准 → 实施全自动；停点 = 需新范围 ∥ 需口径（含核语义改动）。

**本批条目**：① 归位方案定形（A ∥ B + 实证先行）② 落点与判据（含真机三径：单轮 ∥ 多轮累积 ∥ 族后已有内容）③ 交付与收口复验。

**上抛预留**：核语义（`done` 发送时点）若须动 = 上抛待裁。

**评审/修复**：设计舱 = eng-designer（本刻派发）；设计评审 = 收件后父侧点火。

**接手登记（2026-09-30 20:4x · 父侧）**：本批户主（台账 #738 executor）= 重启前桌面进程（`16296-…`）随 20:04 重启而死（台账面「属主已死」标记）⇒ **归属转本会话**（slot 33 · `17356-1790769850480-r13u9m`，用户 20:41 指令「可以接手」）。**接手时实况**：实施舱 #33 已交（§5）→ 真机核验暴露落位缺陷（轮终态后行漂移，用户 20:21 抓）→ **修复轮 #3 在跑**（同一设计Token）；§6 未写。批链状态不变，仅归属对齐。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（归档起跑窗 + 只留当前轮 + 记录面零动（落点四档同轮））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**

① **归档时点提前 = 消化起跑窗**（用户 18:49 直令「你digest的时候直接把它挂进去不就完了吗？！何必等到消化完再挂？」）——`done` 发送点自 reclaim（消化完成后）移至 `ev:digest start` 发帧点；归档块居其消费行族之前。
② **消化痕显示面 = 只留当前消化的这一轮**（用户 15:4x 字面「没必要把历史上消化过的都挂着——只需要现在消化的这个」+ 18:53 字面「每次都给我搞些历史垃圾不清」——以 18:53 字面为准）：新轮起跑 ⇒ 清旧终态行（历史行不留 ∥ 不挂 ∥ 不串）；重载 ∥ 切走切回 ⇒ 复列**最新一条**（不重挂历史串）。
③ **当轮行集收正**：终态非 ask 档**标签行退场**（消「digesting 悬挂」观感——用户 18:53「真清不干净了吗」）；ask 档标签保留（每轮独有信息）。
④ **记录面零动**（用户 14:42/14:48 原话两条：刷新/恢复不丢 + 子 agent 块恢复）：轮记录三型**全量**照留；归档快照照留。显示面与记录面分离。
⑤ **设计档涉句收正**：与「只留当前」相抵的「行入流·都留」式转写（15:53 误译面）按用户字面收正。

**实证读数（file:line ∥ 真机）**

- 现状 done 发送点 = `thincoder-desktop/src/main/suspension-drive.mjs:206`（`reclaim: (consumed) => reemitDone(key, consumed)`）∥ `:67-73`（`reemitDone`）——消化完成（reclaim）后逐条补发 ⇒ 归档晚于消化轮全部内容（真机 = 18:43 档 [行族 144–154][输出 155–156][归档块 157]；#16 ∥ #14 两枚新归档均落流尾）。
- **起跑信号（本轮核心实证）= 已存在且与将消费集同源**：同档 `:130-136`（`driveTurn` boundary 支 = `ev:digest start` 发帧点；`n = backgroundCounts(agent).pending` 起跑读——`thincoder-core/agent/suspension.mjs:86-98` 直传 `_pendingAsyncResults.length`）∥ 将消费集 = 起跑注入者（`thincoder-core/agent/run-start.mjs:33-45` `pendingAsync.splice(0)` **全量消费**）∥ 核回收对账（`suspension.mjs:196-202` `consumedByRun` = before−after ⇒ 起跑快照 ⊇ 回收集）。⇒ 桌面宿主在起跑点即可精确判定「本轮将消费哪些驻留条目」。
- 归档链 = `thincoder-desktop/renderer/subagent-reduce.mjs:186-190`（done ⇒ `archiveIntoFlow` ⇒ `appendBlock`）∥ 核态机 `thincoder-render-core/subblocks/state.mjs:236-238`（frozen ∧ awaitingDigest ∧ done ⇒ archive）；幂等面 = `state.mjs:236-240`（重复 done ⇒ `drop-frozen`）+ `subagent-reduce.mjs:154`（已归档墓碑跳过）。
- 落位链 = `thincoder-desktop/renderer/views/chat-digest.mjs:288-298`（`digestBoundaryOf` 守卫 = 尾位连续族首）∥ `views/chat.mjs:144`（mountTail 逐枚现读插点）。
- **竞争窗判定**：帧内序 = `settleFrame` ① 挂尾段 → ③ `syncChrome`（单源 = `RENDERER.md` §3 六步）；⇒ 挂早（轮行未渲染）= 轮行随落其后（syncDigest 流末插）∥ 挂晚（轮行已渲染）= 守卫前插族首——**两径皆 [归档块][行族]**；危险窗（挂晚于本轮输出首块）**不可达**（`done` 出站先于 `runTurn`〔同 tick 序〕+ 帧挂载按模型序——本轮首块必后于归档块挂载）。
- 起跑信号缺失兜底 = `boundary` 假之轮（timer 轮 `:118` ∥ 用户回合）无 `ev:digest start` ⇒ 保持现状（reclaim 触发——**落位 = 消费行族之前**）——行为不变。
- 显示面现状（墙）= `thincoder-desktop/renderer/events-wake.mjs:48-75`（多轮累积）∥ `views/chat-digest.mjs:74-79`（每轮恒出标签行）∥ 真机 11 连排「digesting + Digested N（Ns）」。
- 记录面时点 = `suspension-drive.mjs:134-135`（digest start 发帧 ∥ 记录同点）∥ `turn-face.mjs:142-143` ∥ `:174-175`（cap ∥ end）；归档快照 = `subagent-reduce.mjs:124-137`（`record:append`）。

**机制设计**

A. 归档起跑窗（触发点改写）：宿主 `driveTurn` boundary 支（`ev:digest start` 发帧点）⇒ 对本轮将消费驻留条目（`agent._pendingAsyncResults` 起跑快照）逐条补发 `ev:subagent { status: "done" }`（复用 `reemitDone`）。`hooks.reclaim` 径**保留为兜底**（重复 done 幂等——见实证幂等面）；用户回合 ∥ timer 轮消费径仍走 reclaim。**核语义零改**（done 发送点本在端侧 reclaim 钩、非核内——`suspension.mjs` 两钩 ∥ `run-start.mjs` 注入零触）。
B. 显示面只留当轮：归约面 `events-wake.mjs onDigest`——`start` ⇒ 切片 = [本轮]（全替——旧轮退场）；`cap`/`end` 就本轮更新（不变）。页读 `page-read.mjs`——`foldDigest` 只产**最新一条**终态轮；`withFoldedDigest` 合并 = 场内存续（未结末轮）优先 ∥ 否则折叠最新（合并后 ≤1）。渲染面 `chat-digest.mjs`——行集随 `status`（终态非 ask ⇒ 标签行退场；`syncRound` 改按轮元素定位行族——标签行可增删；`syncDigest` 配对同步按轮元素）；`clearDigest` 未结末轮保（不变）。
C. 记录 idx 随动与重建径：归档记录自 reclaim 时点 ⇒ 起跑窗时点（宿主 digest-start 记录之后 + 一 IPC 回程；**记录形 ∥ 通道 ∥ 折叠单源零改**）。重建复列（`chat-tree.mjs:84-103` `pushFlow` 按 `at`）⇒ 归档块落于其消费轮**记录位次之后**（[轮][归档块][轮输出]）——与活流 [归档块][轮行族] 相邻序微差，**如实登记**（两面各自正确：活流 = 挂入时点序；重建 = 记录写序；均「块随其轮、居输出之上」）；设计裁决 = **不另设重建特例**（保持「按记录位次复列」单规则）。

**设计档落点（本席已落 · 同轮）**

- `docs/desktop/design/RENDERER.md`：§1 挂起窗行（块归档句 = 起跑窗 + reclaim 兜底）；§1.1 归约面条（只留当轮 + 记录/显示两面分离）、流内消化行族条（当轮元素 ≤1 · 行集 · 终态标签退场 · 形面收正差）、在场/出现/更新/退场条（换代 = 旧轮退场）、块归档面（起跑窗语义）、插入点纪律条（补时点句）、根子序条（当轮元素 + 复列最新一条）、留档记录条（折叠最新一条）。
- `docs/desktop/design/UI.md`：§1 对话流行 digest 句收正（只留当前轮 + 行集 + 记录面）。
- `docs/desktop/design/IPC.md`：§1 `ev:digest` 行收正（只留当轮 + 显示/记录两面）。
- `docs/desktop/design/PROJECT.md`：§2 KD-36 ∥ KD-55 ∥ §2.2 ∥ §7 D4 行 ∥ §10 CR 涉句收正。
- 变更记录（四档）同日落一行。

**受影响文件（产品码面 · 实施轮）**

| 文件 | 现值（as-of 设计轮实读） | 预期 | 改动 |
|---|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs` | ≈285 | ≈293 | 起跑窗补发 done（boundary 支 +注释收正） |
| `thincoder-desktop/renderer/events-wake.mjs` | 读数未逐行（设计轮仅段读 `:48-75`） | +1..4 | `onDigest` start 支全替 |
| `thincoder-desktop/renderer/page-read.mjs` | 207 | +2..8 | `foldDigest` 最新一条 + 合并口径 |
| `thincoder-desktop/renderer/views/chat-digest.mjs` | ≈299 | ±40 | 行集随 status + 行族定位重构 |
| 批内件（新档 · `docs/batches/2026-09-30-digest-reflow-anchor.test.mjs`） | — | ≈120 | 机检腿六条（见验收） |

零触面：核包 ∥ 协议 ∥ 记录面（形 ∥ 通道 ∥ 折叠单源）∥ `subagent-reduce.mjs` ∥ `state.mjs` ∥ `chat-tree.mjs`。

**验收对照（批档 §1 验收四条）**

① 起跑信号实证读数 = 上文实证块（含「已存在 + 同源 + 兜底」三面）✓。
② 机制定形 = 上文 A/B/C（触发点改写 + 记录面时点关系 + 竞争窗处置 + 起跑信号缺失兜底）✓。
③ 判据落定——真机三径（**新归档块须落于其消费行族之前**）：**径 1 单轮** = [内容][归档块][当轮行族]；**径 2 多轮**（收正后 = 轮换代）= 轮 N 终结（行族在场）⇒ 轮 N+1 起跑（旧行退场 + 新归档挂入）⇒ 居轮 N+1 行族之前（历史行零在场）；**径 3 行族后已有内容** = 轮 N 输出居其行族之后 ⇒ 轮 N+1 起跑 ⇒ 新归档两径（守卫前插 ∥ 内容尾尾插）皆落轮 N+1 行族之前。+ 批内件机检腿六条：起跑窗补发序（done 先于回合执行）∥ done 幂等（重复零动作）∥ start 全替（切片 = [本轮]）∥ foldDigest 最新一条（含未结末轮优先）∥ 行集（终态非 ask 标签退场 ∥ ask 保留 ∥ live 双行）∥ 落位两序（假 DOM：挂早/挂晚皆 [块][族]）。真机三径 = 父侧 D16 义务（实施后跑）。
④ §2 落全 + 读回（D6）自查 = 见本节末。

**关键决策（含被否）**

- KD-A 归档时点 = 起跑窗（用户 18:49 直令）；**被否** = 方案 B「改不变式让块跨块前插」（违 DOM ≡ 模型块序 + 对齐步）。
- KD-B 取点 = 宿主端侧（`driveTurn` boundary 支）——核语义零改；**被否** = 动核 `onDigest`/`reclaim` 时点（无必要——发送点本在端侧回收钩；核两钩 ∥ 注入零触）。
- KD-C 显示 = 只留当轮（用户 15:4x ∥ 18:53 字面）；**收正** = 「行入流·都留」式转写（15:53 误译面——设计档同轮收正；需求侧笔在父侧）。
- KD-D 记录面零改（全量 + 形 ∥ 通道 ∥ 折叠单源）。
- KD-E 重建 = 单规则「按记录位次复列」+ 复列最新一条（不设重建特例）。
- KD-F 当轮终态行集 = 标签行退场（非 ask）；ask 标签保留。

**上抛 / 列报**

- ① **需求侧笔（父侧）**：`docs/desktop/requirements/PROJECT.md` §4 D28 行 + 变更记录 `:274`（15:4x「屏上只留当前一轮……体 = 废」）∥ `:275`（15:53「行入流……前注体 = 废」）——两行按 18:53 字面重写（「只留当前」= 现行规格，非废）；`requirements/PROJECT.md:173` D28 判据句与五腿口径同步。
- ② **跨端面（归属收正 · 父侧直接执行 2026-09-30 · 可 revert）**：CLI ∥ VSC 同症（**非挂起结件当刻入流**——VSC = 尾追（`activity.js:109`）∥ CLI = 流内原地冻结（`subagent-blocks.mjs:257-267`）；非「reclaim 后挂」——两端 reclaim 径落位均在消费行族**之前**）+ 多轮链条；对齐归属 = 统一批（`docs/batches/2026-09-30-triple-end-digest-unify.md`——暂缓候口径）。
- ③ **重建相邻序微差**（KD-E 登记面）——重载后 [轮][归档块] vs 活流 [归档块][轮]：如实登记；若用户走查认存取舍另裁（换法 = 归档记录写点前移至 digest-start 记录之前——须动记录写序，本席不建议）。

**收正轮（评审轮 1 · 发现 1–8 逐号 · 2026-09-30 · eng-designer）**

承 §3 轮次 1——八号全采纳、逐号点修；评审引用与现盘出入一处：发现 4 引 `UI.md:469`，现盘实为 `:471`（组注项后批追加偏移）——已按现盘收正并披露。

1. **① 🔴（归档面两说）已收一**：PROJECT.md **KD-34** 归档句 ∥ §4.1 `suspension-drive.mjs` 行**同拍起跑窗口径**——归档面 = `ev:digest start` 发帧点逐条补发 `done`；`hooks.reclaim` = 兜底幂等（用户回合 ∥ timer 轮消费径仍走 reclaim）——与 RENDERER.md §1.1 块归档面同字（`:73` ∥ `:175`）。
2. **② 🟡** RENDERER.md §1.1 帧尾态刷成员句 ⇒ **当轮元素〔在场 ≤ 1〕 · 流内就地**（消同档两义——原「逐轮元素」；`:69`）。
3. **③ 🟡** RENDERER.md §1.1 在场 ∕ 出现 ∕ 更新 ∕ 退场条**换代钉径**：复用径亦须末位重锚——新轮行族落位唯一（恒居流末；`:45`）。
4. **④ 🟡** UI.md 间距注项 5 **轮间死句收正**（`.chat-digest + .chat-digest` 不可达 ⇒ 单元素在场口径；`:471`）。
5. **⑤ 🟡** PROJECT.md §6.1 **D4** 行补本批判据（旧轮终态行零节点负判 ∥ 标签行两态 ∥ 归档块与消费行族文档序）+ §7 增「消化回流归位批注」（机检六腿载体 + 真机三径三腿；`:1035` ∥ `:1171`）。
6. **⑥ 🟡** PROJECT.md §4.2 增本批「现行 ⇒ 预期」块（四档 + 批内件 + 设计档；`views/chat-digest.mjs` **298** 贴层 ∥ 越 300 拆分预案在册——现值行数沿 §4.1；`:1001`）。
7. **⑦ 🔵** ask 例外给由 + 终态行文取值（`digest.turnLabelAsk`——本轮独有信息；终态不换词）+ `digest.done` ∕ `digest.aborted` 可达面（计数行终态文）——RENDERER.md §1.1 ∥ UI.md §1 对话流行 ∥ IPC.md §1 `ev:digest` 行**三处同拍**。
8. **⑧ 🔵** PROJECT.md 变更记录指位收正（「§7 D4 行」⇒「§6.1 D4 行」）。

**残留登记（≤2 · 非八号射程披露）**：① `thincoder-desktop/renderer/chat.css:58` `.chat-digest + .chat-digest` 选择器随「在场 ≤ 1」不可达——产品码零触（未动；本批受影响档表未含该档——实现面清理候选，供父侧裁量）；② 记录面历史条目（`RENDERER.md:264` ∥ `UI.md:793` 等「逐轮元素」表述）按记录面纪律保留（dated history——不属残留）。**另披露**：四档变更记录各增修复轮行（本档 `:1736`）；doc-check 现盘红（悬空 60 ∥ 行宽 172——repo-wide 既存态、非本批引入；本批新增行 ∥ 引用避新增——四档行宽计数 Δ0）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | `PROJECT.md:73`（KD-34）仍载「回收 = 消化完成逐条 `⟦ev⟧done` 补发（**归档面**）」；本批已把块归档面收正为**消化起跑窗**（`RENDERER.md:24` ∕ `RENDERER.md:46`：「`ev:digest start` 发帧点 = 对本轮将消费驻留条目逐条补发 `ev:subagent { status: "done" }`；`hooks.reclaim` 径保留 = 兜底幂等」；`PROJECT.md:75` KD-36 同口径）⇒ **同机制（块归档时点 ∕ 归档面）两处不同描述**，与批内自身收正口径相抵；`PROJECT.md:175`（§4.1 `suspension-drive.mjs` 行「回收 ⇒ 逐条补发 `done`」）同族未同拍。批内变更记录自陈收正清单（`PROJECT.md:1717`）= KD-36 ∥ KD-55 ∥ §2.2 ∥ D4 行 ∥ §10 CR——KD-34 未入清单。 | 把 KD-34 归档句与 §4.1 该行同拍为起跑窗口径（归档面 = `ev:digest start` 点补发；`reclaim` = 兜底幂等 ∕ 用户回合 ∥ timer 轮消费径仍走 reclaim），与 `RENDERER.md:46` 逐字一致。 |
| 2 | Doc-state | 🟡 | `RENDERER.md:69`（帧尾态刷成员）仍写消化行族「**逐轮元素 · 流内就地**」（#706 旧义 = 多轮元素并存——`RENDERER.md:264` 记录面可证），与同批收正后的 `RENDERER.md:42` ∕ `RENDERER.md:81`「**当轮元素**〔在场 ≤ 1〕」不一致（同档两义）。 | 该半句同拍「当轮元素〔在场 ≤ 1〕」，或改指针句（在场 ∕ 更新 ∕ 退场 = §1.1 归约面条）。 |
| 3 | Clarity | 🟡 | `RENDERER.md:45` 换代句给两可径「（**原位元素换代复用** ∥ 摘——零历史串）」而未钉**新轮行族落位**：同条「出现 = `start` 帧**流末插本元素**」只覆盖元素缺席径 ⇒ 「原位复用」径下新轮标记驻留旧轮位（旧轮产出已随流居其下），与「流内就地 ∕ 常规新块随流居消化行元素之下」的排布口径可发散（实现面可见位两解）。 | 钉定单径（或补半句：复用径亦须末位重锚），使换代后行族落位唯一。 |
| 4 | Doc-state | 🟡 | `UI.md:469`（本批注（流内竖向间距）项 5）仍立「轮间 = `.chat-digest + .chat-digest`」——该选择器预设两轮元素相邻；本批后在场 ≤ 1（`UI.md:18` ∕ `RENDERER.md:42`）⇒ 该半句不可达（死规则），且反向暗示多轮元素可并存。 | 删 ∕ 标注不可达，或改写为单元素在场下的上距口径（与「在场 ≤ 1」同拍）。 |
| 5 | Acceptance criteria | 🟡 | 本批三项新可见行为——新轮起跑清旧终态行 ∥ 终态非 ask 标签行退场 ∥ 起跑窗挂块（归档块居消费行族之前）——在 §6.1 ∕ §7 无带**负断言**的判据落点：`PROJECT.md:1022`（D4 行）只携「显示面只留当前轮（重建复列最新一条）」半句，真机用例指 `PROJECT.md:1147`（T-DSK49）——该用例①–④ 仅断言在场，无「旧轮行不留」负判，亦不覆盖标签行退场与挂块次序。 | 在 D4 行 ∕ §7 补本批判据（旧轮终态行零节点负判 + 标签行在 ∕ 不在场两态 + 归档块与消费行族的文档序），或点名本批机检腿载体（若批档 §2 已携 ⇒ 本档补指针即可）。 |
| 6 | Affected-file size | 🟡 | 本批设计未携受影响档注记：§4.1 ∕ §4.2 无本批行（全档 grep「归位 ∕ reflow」仅四处变更记录命中）；而本批语义（归约面只留当轮 ∥ 行集 ∕ 换代 ∥ 起跑窗补发）预计触碰 `thincoder-desktop/renderer/views/chat-digest.mjs`（**298**——`PROJECT.md:250`「<300 距线 2 行 ⇒ 贴层在册」）、`thincoder-desktop/renderer/events-wake.mjs`（88——`PROJECT.md:224`）、`thincoder-desktop/src/main/suspension-drive.mjs`（285——`PROJECT.md:175`）等档 ⇒ 缺现值 ∕ 增量注记与触线预案。 | 补本批受影响档行与增量估（含蓄势档 `views/chat-digest.mjs` 的贴层 ∕ 越 300 拆分预案）；若批档 §2 已携该表 ⇒ §4.2 补行指位（行数收录随回填轮惯例）。 |
| 7 | Clarity | 🔵 | 终态标签行退场为「**非 ask** 档」限定（`RENDERER.md:42` ∕ `UI.md:18` ∕ `IPC.md:25`），与题面「终态标签退场」存在档位差；ask 档终态留住之给由未落字，且留住的标签行在 ask 终态的行文（`digest.turnLabelAsk` ∕ `digest.done` ∕ `digest.aborted`——七键面 = `IPC.md:100`）未定 ⇒ 非 ask 轮终态两词键的可达面亦悬。 | 补 ask 例外给由 + ask 终态行文取值（并明示 done ∕ aborted 可达面），或登记该收窄为未定性。 |
| 8 | Clarity（记录面） | 🔵 | `PROJECT.md:1717` 变更记录指位「§7 **D4** 行」于本档 §7（用例表 = `T-DSK*` 行）无对应行；实指 = §6.1 D4 行（`PROJECT.md:1022`）。 | 指位收正（记录面，零语义）。 |

计数：🔴 1 ∕ 🟡 5 ∕ 🔵 2（共 8 条）。射程限制：批档 §2 ∕ §3（用户 18:53 ∥ 15:4x 字面、本批文件清单、机检腿载体）与需求档不在本次评审射程（#5 ∕ #6 的「若批档已携则降级」判定未验证）。

VERDICT: changes-required（🔴 1 条阻断）。

### 轮次 2（评审子代理）

**轮次 2 复核（逐号核 8 条收正）——发现表（核验结果）**：

| # | Orig# | 档 | 严重度 | 状态 | 证据（本轮现读原文） |
|---|-------|----|--------|------|----------------------|
| 1 | 1 | `thincoder/docs/desktop/design/PROJECT.md` | 🔴 | Fixed（收正） | KD-34 已同拍起跑窗口径——`PROJECT.md:73`：「**归档面 = 消化起跑窗**（`ev:digest start` 发帧点 = 对本轮将消费驻留条目逐条补发 `ev:subagent { status: "done" }`——`driveTurn` 支）∥ 回收（`hooks.reclaim` 径保留）= **兜底幂等**」；§4.1 `suspension-drive.mjs` 行同拍（`:175` 现读「回收 ⇒ 兜底幂等（**归档面 = 消化起跑窗**）」）——与 `RENDERER.md:46` ∥ KD-36（`:75`）同字，跨档两义消。 |
| 2 | 2 | `thincoder/docs/desktop/design/RENDERER.md` | 🟡 | Fixed | `:69` 帧尾态刷成员句现读「**当轮元素〔在场 ≤ 1〕 · 流内就地**」（原「逐轮元素」收一）。 |
| 3 | 3 | `thincoder/docs/desktop/design/RENDERER.md` | 🟡 | Fixed | `:45` 换代句已钉径：「（原位元素换代复用 ∥ 摘——零历史串；**复用径亦须末位重锚**——新轮行族落位唯一〔恒居流末，与「出现 = 流末插」同序〕）」。 |
| 4 | 4 | `thincoder/docs/desktop/design/UI.md` | 🟡 | Fixed | `:471` 项 5 死句收正：「`.chat-digest`——**在场 ≤ 1**（单元素在场口径）；轮间相邻选择器（`.chat-digest + .chat-digest`）**不可达**」。 |
| 5 | 5 | `thincoder/docs/desktop/design/PROJECT.md` | 🟡 | Fixed | §6.1 D4 行（`:1035`）补本批判据（「新轮起跑 ⇒ 旧轮终态行**零节点**（负判）∥ 终态非 ask 标签行退场（ask 档保留）∥ 归档块居其消费行族**之前**（文档序）」）+ §7 增「消化回流归位批注」（`:1171-1174`：机检六腿 + 真机三径三腿）+ §4.2 批内件行（`:1009`）。 |
| 6 | 6 | `thincoder/docs/desktop/design/PROJECT.md` | 🟡 | Fixed | §4.2 增本批「现行 ⇒ 预期」块（`:1001-1012`）——四码档（`suspension-drive.mjs` 285 ⇒ ≈293 ∥ `events-wake.mjs` 88 ⇒ +1..4 ∥ `page-read.mjs` 207 ⇒ +2..8 ∥ `views/chat-digest.mjs` 298 ⇒ ±40，**贴 300 层 + 拆分预案在册**〔位次面续拆 ∥ 消解窗口 = 本批〕）+ 批内件 + 设计档 + 零触面句。 |
| 7 | 7 | `RENDERER.md` ∥ `UI.md` ∥ `IPC.md` | 🔵 | Fixed | ask 档例外给由落字（`RENDERER.md:42`「ask 档终态保留〔给由 = 行文 `digest.turnLabelAsk` 携 `from` ∕ `msg`——本轮独有信息；终态不换词〕」）+ 终态文宿主点名（「`n > 0` 计数行（**终态文 = `digest.done` ∕ `digest.aborted`**——两键可达面 = 本行）」）——三档同拍。 |
| 8 | 8 | `thincoder/docs/desktop/design/PROJECT.md` | 🔵 | Fixed | 变更记录指位收正（`:1735` 现读「§6.1 **D4** 行」）+ 修复轮记录在册（`:1737`「变更记录**指位收正**（「§7 D4 行」⇒「§6.1 D4 行」——发现 8）」）。 |
| — | (new) | — | — | 无 | 本轮未见修复引入的新 🔴 ∕ 崩溃 ∕ 数据丢失 ∕ 逻辑错误；🟡/🔵 亦零新增（8/8 收正全闭）。 |

计数：🔴 0 ∕ 🟡 0 ∕ 🔵 0（原 8 条全部收正；无新增发现）。
VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30）**：依据 = 用户 18:28「自动跑完」授权 + 用户 18:43–18:55 三条字面（起跑即挂 ∥ 只留当前一轮 ∥ 记录面照留）+ **设计评审通过**（轮次 1 = changes-required〔🔴 KD-34 归档面同拍 ∥ 🟡×5 ∥ 🔵×2〕→ 修复轮落定 → **轮次 2 = pass**〔8/8 收正全闭；无新面〕）。

**实施舱**：eng-coder（设计Token 已签发——值不入档）。**实施范围** = §4.2 本批块（`suspension-drive.mjs` **285 ⇒ ≈293** ∥ `events-wake.mjs` **88 ⇒ +1..4** ∥ `page-read.mjs` **207 ⇒ +2..8** ∥ `views/chat-digest.mjs` **298 ⇒ ±40**〔贴 300 层——越 300 ⇒ 拆分预案在册〕）+ 批内件新档（六腿）+ **清理单**：`chat.css` `.chat-digest + .chat-digest`（不可达——随实施清 ∥ 标注，二择一给判由）。

**验收** = §7「消化回流归位批注」：机检六腿（起跑窗补发序 ∥ `done` 幂等 ∥ `start` 全替 ∥ `foldDigest` 最新一条 ∥ 行集 ∥ 落位两序）+ 真机三径三腿（父侧真跑闭合）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（修复轮 · #738 行漂移归位：批内件十腿 10/10（先红后绿）∥ 审计四类零命中 ∥ 代码评审 pass（无 🔴）∥ 20:48 异源裁定在册 · 2026-09-30）

**交付摘要（产品四档 + 批内件 + 清理单 —— 落点 = §4.2 本批块）**

| 档 | 实读行数（终值） | 改动 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs` | 293 | **起跑窗补发**：`driveTurn` boundary 支（`:133-143`）对 `agent._pendingAsyncResults` 起跑快照逐条补发 `done`（先于 `runTurn`；`:142`）；`reclaim` 径保留 = 兜底幂等（`:213`）；头注 ∥ 方法注收正 |
| `thincoder-desktop/renderer/events-wake.mjs` | 90 | `onDigest` `start` **全替**（切片 = [本轮]；`:50-58`）——旧轮退场；`cap` ∥ `end` 就本轮更新不变；头注同拍收正 |
| `thincoder-desktop/renderer/page-read.mjs` | 214 | `foldDigest` ⇒ **最近一条终态轮** + 截断闸（`:109-137`）∥ `withFoldedDigest` 合并 **≤ 1**（场内存续优先；`:138-146`） |
| `thincoder-desktop/renderer/views/chat-digest.mjs` | 113 | 帧面留守（`syncDigest` ∥ **换代末位重锚** `:65-68` ∥ `clearDigest` `:83-93` ∥ `digestBoundaryOf` `:102-112`）+ 位次四件 ∥ 构树件再出口（旧 import 面零改） |
| `thincoder-desktop/renderer/views/chat-digest-seat.mjs`（**新档**） | 223 | 构树件（行集随 `status`：终态非 ask 标签行退场 ∥ ask 档保留 ∥ 计数行终态文）+ 行集同步 `syncRound`（按轮元素定位行族）+ 位次面（四件 ∥ `roundAt` ∥ `nodeAt` ∥ `buildRound`）——**拆分预案执行**（新档名实施批定） |
| `thincoder-desktop/renderer/chat.css` | — | **清理单执行**：`.chat-digest + .chat-digest` 死规则退场 + 邻注收正（判由落注释） |
| `docs/batches/2026-09-30-digest-reflow-anchor.test.mjs`（**批内件**） | 473 | 机检六腿（腿 1 起跑窗补发序 ∥ 腿 2 `done` 幂等 ∥ 腿 3 `start` 全替 ∥ 腿 4 `foldDigest` 最新一条 ∥ 腿 5 行集 ∥ 腿 6 落位两序 + 换代重锚）；含假 DOM 脚手架（沿 2026-09-30-digest-persistence 先例） |

**决策透明表**

- **KD-A**（归档时点 = 起跑窗）：按 §2 落；`reclaim` 兜底保留并机检实测「起跑发 + 兜底再发」两发（腿 1 —— 二次 `done` 幂等归渲染面腿 2）。
- **KD-B**（显示只留当轮）：`onDigest` 全替 + `clearDigest` 未结末轮保 + 合并 ≤ 1，三面同拍（腿 3 ∥ 腿 4）。
- **解释性判定 ㈠（已上报 · 父侧 2026-09-30 回示确认「不动、落 §5」）**：`withFoldedDigest` = 「**现轮集非空 ⇒ 原样；空 ⇒ 采折叠最新**」。判由：字面替换径（终态现轮亦被折叠轮替换）在**回填径**会把更新轮换成更旧折叠轮（可见回退，违「历史轮不入显示 ∥ 只留当前」本意）；**首屏径两读法恒同**（`clearDigest` 先清终态轮 ⇒ merge 时场内存续只有未结末轮或空）；批内件腿 4 锁此判据。
- **解释性判定 ㈡**：`foldDigest` = 「**最近一条终态轮**；末轮未结 ⇒ 不产该轮、仍产上一终态轮」。推定依据 = 旧批件 `docs/batches/2026-09-30-digest-persistence.test.mjs:332-382`（同一夹具「末轮无 end 不产」原本即产上一终态轮）与 §2「只产最新一条终态轮」并读；实施中被该旧批件红态实证回正（初版误读「末轮未结 ⇒ 全页零产」）。
- **KD-C**（记录面零动）：`appendRecord` 调用点/记录形/通道零改；归档记录 idx 随起跑窗前移（§2 C 段在册）。
- **KD-E**（重建单规则）：重建径按记录位次复列，不另设特例（相邻序微差照 §2 登记）。
- **拆分执行**：`views/chat-digest.mjs` 贴 300（净增必越）⇒ 按在册预案拆「位次面（位次四件 ∥ 对位算法）」并随迁构树件与行集同步（落位建元素与行集同步同族）；旧 import 面经再出口零改（`chat-tree.mjs` ∥ `chat.mjs` ∥ `chat-chrome.mjs` 零触）——新档名 = `views/chat-digest-seat.mjs`。
- **清理单（二择一）**：择「清理」——死规则退场（判由：在场 ≤ 1 选择器不可达；「不可达」事实已载 `docs/desktop/design/UI.md:471`；零第二消费者）。

**审计与代码评审轮次与终态**

- **内部偏离审计（explore · 只读）轮次 1**：四类（未达 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）**零命中**；观察 O1（设计档新档登记/终值回填）∥ O3（注释残句）∥ O4（邻批旁物）处置：本批触碰档注释已收正（`events-wake` 头注 ∥ `chat.css` 邻注）；零触档残句（`chat.mjs:12` ∥ `chat-chrome.mjs:7` ∥ `chat-model.mjs:33`「逐轮元素」）**报告父侧**（越 §4.2 落点未动）；O1/O4 归父侧文档/备案面。
- **代码评审（advisor · code）轮次 1**：**VERDICT pass**（无 🔴；🟡 4 ∥ 🔵 2 —— 逐条处置见下「评审回应」）。
- **fix round 1（采纳评审发现 2）**：`foldDigest` 增**截断闸**（本页未见 `start` 的 `cap`/`end` 不入折 —— 消并轮错位；批内件腿 4 增三断言：孤立记录零并轮零借位 ∥ 纯孤立终态零产）；复跑 15/15 绿。
- **评审回应表**（发现 → 处置）：① 批内件 ≈473 行 >300 建议线 + 估值漂移（设计记 ≈120）→ **报告父侧回填轮**（或抽共用假 DOM 件）；② `foldDigest` 截断并轮错位 → **已修**（fix round 1）；③ `reemitDone` 缺 VSC 同面会诊族守卫（`thincoder-vscode/src/extension/suspension.mjs:115` `role === "consult"` 跳过）→ **未动 · 报告父侧裁**（设计未定该过滤；语义变更不擅入）；④ 换代重锚未计入帧尾动作预判 → **报告**（修须触零触档 `chat.mjs`）；⑤ 新档登记行缺（`PROJECT.md` §4.1）→ **报告**（设计档面）；⑥ 本 §5 空段 → **已补**（本段）。**终态 = clean**（fix round 1 闭环；无 stalled 项）。

**验证读数**

- 复跑（cwd = 仓库根）：`node --test docs/batches/2026-09-30-digest-reflow-anchor.test.mjs` ⇒ **6/6 绿**（腿 1–6 逐条 ✔）。
- 邻批件连跑：`2026-09-30-digest-persistence.test.mjs` 9/9 ✔ ∥ `2026-09-30-desktop-digest-instream.test.mjs` 5/5 ✔ ∥ `2026-09-29-desktop-susp-queue.test.mjs` 10/10 ✔ ∥ `2026-09-29-desktop-window-queue-parity.test.mjs` 9/9 ✔ ∥ `2026-09-28-tech-debt-closeout-r8.test.mjs` 5/5 ✔。
- 旧批件红态面（**既有、非本批引入** —— 逐条实读归因）：`2026-09-29-desktop-digest-parity.test.mjs` W1/W2/W3/W9（多轮语义 superseded）∥ W6/W7（旧名 `digestGroupNode` 退役）+ W11（词键扫描面随拆出档迁移 ⇒ 扫 `chat-digest.mjs` 得零命中——**新档即键面新址**）；`2026-09-29-desktop-residuals-round3.test.mjs` ⑩⑫⑬（旧单对象 `digest` 形）；`2026-09-29-structure-split-2.test.mjs` A/B/C（core `manifest-schema.mjs` 漂移 + 旧导出名集冻结）。
- 设计评审（轮次 2）通过 + §4 代签 = 本批授权面（实现前既有）。

**残留（≤2）**

1. **零触档注释残句**「逐轮元素」：`views/chat.mjs:12` ∥ `views/chat-chrome.mjs:7/165/193` ∥ `views/chat-model.mjs:33`——本批未动（越 §4.2 落点）；建议随下次触碰收正为「当轮元素〔在场 ≤ 1〕」。
2. **设计档回填面**（父侧/eng-designer）：`PROJECT.md` §4.1 缺 `chat-digest-seat.mjs`（223 行）登记行 ∥ §4.1/§4.2 `views/chat-digest.mjs` 值 298 ⇒ 终值 113（拆分落定，非 ±40 净增）∥ 批内件 ≈120 ⇒ 实读 473；另 `docs/core/design/API-CONTRACT.md` 生成区坐标随拆档失效（`scripts/api-contract.mjs --write` 刷新）。

**勘误（同段 · 读数码更正）**：前「验证读数」第二行邻批件连跑的 `2026-09-28-tech-debt-closeout-r8.test.mjs` 实读 = **8/8 绿**（`#429`×3 ∥ `#448`×2 ∥ `#515`×3 逐条 ✔；前句记「5/5」为笔误）。其余各件计数复核：`digest-persistence` 9 ∥ `digest-instream` 5 ∥ `susp-queue` 10 ∥ `window-queue-parity` 9 ∥ 批内件 6。

**评审轮次 2（复核 fix round 1 · 载体 = 产品四档修复主张）**：**VERDICT pass** —— 修复复核全闭：发现 2（`foldDigest` 截断闸）两项均在盘且具判别力（`page-read.mjs:117/124-125` + 批内件腿 4 `:360-368`；未修前末位孤立 `end` 会并进末轮，现产本页终态轮事实 —— 非恒真断言）；发现 6（§5 空段）已补；余四条报告项与「未改码」主张逐条一致；**新增 🔵 二（不阻断）**：① §5 `:192`「复跑 15/15 绿」未附命令 ∥ 文件面（本件单跑 6 测试 ⇒ 读数溯源缺口，本席无执行面未复现）；② `page-read.mjs:15-16` 悬空测试指针（`test/events-page.test.mjs` 等全仓零命中 ∥ 测试清单已空 —— **既存 · 非本修复引入**，全族同类建议随触碰轮统一收）。新 🔴 面 = 零（修复仅增函数内局部 `open` 闸，无新状态写面 ∥ 新 IPC ∥ 跨页残留）。**终态 = clean**。

**修复轮 · #738「终态后轮行漂移」（真机走查 2026-09-30 20:21 抓 · 父侧实据）· 2026-09-30 · eng-coder**

**交付摘要（产品三档 + 批内件腿四条）**

| 档 | 终值行数 | 改动（号 → file:line） |
|---|---|---|
| `thincoder-desktop/renderer/views/chat-digest-seat.mjs` | 233 | ① 窗下界 = **首枚已标块**位次（`:104-113` `floorOf`）——出窗折叠轮由 `shownDigestRounds`（`:115-125`，构树 ∥ 采纳 ∥ 帧刷 ∥ 落位四径同源）滤除 ⇒ 零插入；② `positionAnchor` **未标块不作锚**（`:174`）+ 无合格锚 ⇒ `null`（`:171-178`），调用面回落尾组锚（`seatDigestRounds` = `positionAnchor ?? anchor`）。 |
| `thincoder-desktop/renderer/views/chat-digest.mjs` | 117 | ③ `syncDigest` **残组对位**（`:55-57`）：未标（活）节点对残轮（**含位次轮**）——出生即定（活元素转位次 ⇒ 原元素存续），就地记标 `_digestAt`（`:74`）⇒ 缺位判据随闭，绝不再座。 |
| `thincoder-desktop/renderer/views/chat-tree.mjs` | 129 | ④ `pushFlow` `flush`：未标块（`bound === null`）不作边界（`:91`）——重建径同守「未标块不作锚」；余位次轮居块序列之后（与 §1.1 根子序「块序列 → 消化行族」同向）。 |
| `docs/batches/2026-09-30-digest-reflow-anchor.test.mjs`（批内件） | 647 | **落位腿四条**：腿 7（形 A：低于窗下界 ⇒ 零插入；无下界 ⇒ 落尾）∥ 腿 8（形 B：不落首枚未标块之前 ⇒ 尾组锚）∥ 腿 9（出生即定：原位存续零重座）∥ 腿 10（三径链 + 混窗剖面 `:630-647`）；父侧提示微修 = 死引 `chatScroll` 删（评审发现⑤关闭）。 |

**决策透明表（修复轮）**

- **KD-G（三判据落点）**：窗下界 = 首枚已标块 ∥ 未标块不作锚 ∥ 出生即定——同源 = `shownDigestRounds`（记录位次复列单源，四径同引）。
- **KD-H（父侧四项修复方向映射）**：①「出生即定 ∥ 永不重选」= 残组对位 + 记标；②「`positionAnchor` 加窗守卫 + 未标块不作锚 + 无合格锚 ⇒ 尾组锚」= 逐条落；③「折叠并入加窗守卫：`at ≥ 窗下界` 才可进**显示**」= 落显示闸（`floorOf`/`shownDigestRounds`）——**不落合并侧**（合并侧硬拦会杀「回填 ⇒ 按位次重建」：区域回填可见则轮按位次重建上屏）；④ 复现腿两形 = 腿 7/8。
- **KD-I（真机数据对表）**：形 A（旧折叠轮 `at <` 窗下界 ⇒ 零插入 ∥ 绝不插块#0 前）∥ 形 B（位次轮不落首枚未标块之前 ⇒ 尾组锚）——以 `.33` 会话真数据复现（150 块 ∥ 未标 109 ∥ 首枚未标 @38 ⇒ 修复后轮落 151/153 尾部；出窗轮零插入）；原判「运行期块 = 尾段」被真机读数推翻（首枚未标 @38 ≠ 尾），代码注释已同拍收正。
- **KD-J（20:48 追加实据 · 归档块直插运行中回合 · 异源裁定）**：实读钉——核件 settle 时点分支 `thincoder-core/agent-tools/async-settle.mjs:272-278`：**非挂起期**（= 回合运行中）settle ⇒ `else` 支**立即发** `⟦ev⟧done`（核注释自陈「回合内 → ⟦ev⟧done 立即冻结；条目留池」）⇒ `thincoder-render-core/subblocks/relay.mjs:135` 映射 `ev:subagent {status:"done"}` ⇒ `thincoder-desktop/renderer/subagent-reduce.mjs:186-190` `archiveIntoFlow` ⇒ `appendBlock` **当刻尾追入流**——该回合后续块落其后 ⇒ 块被夹进回合块列（真机 `129t → 132t → 133S → 134t → 136t`；轮 D@138 后到）。**≠ 宿主起跑窗补发**（`suspension-drive.mjs` boundary 支 = `autoTurn && !timerTurn` 独径，非「每回合边界」）——父侧判向精化：第三发射器 = **核件 settle 时点**。**非本修复覆盖**（本修复 = 轮行落位面；未触核件 settle 时点 ∥ relay 映射 ∥ 归档径 ∥ 块挂点——后者本批禁触）⇒ 修复后本症仍存。**建议（待父裁 · 未动）**：(a) 核面——非挂起期 settle 同发 `⟦ev⟧settled`（归档统一归宿主消化起跑窗驱动；两端 done 语义分叉为真根因：CLI 定格 = 流内原地冻结 ∥ 桌面 done = 归档尾追）；(b) 渲染面——在飞回合（`history.inFlight`）期中归档缓置至回合尾 ∥ 下一次消化起跑窗入流。**候选腿形（父侧已给）**：「S 块不出现于任一运行中回合的块列内部」+「[块][轮] 对不拆」。

**审计与评审轮次与终态（修复轮）**

- **内部偏离审计（explore · 只读）轮次 1**：四类（未达 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）**零命中**；O1–O5 处置：O1（邻批件 `2026-09-30-digest-persistence.test.mjs` 现态 4/9 红：腿 2/3/4/7）⇒ 修复前后同签（HEAD 基线 ∥ 现盘逐条同 4 红；签名在宿主页读/槽沙箱层 ENOENT/回执面）——**非本修复引入**，报父侧裁定；O3（绿证时序）⇒ 终版复跑消疑；O4（三径链腿修前红）⇒ 补混窗剖面，修前红证入册；O5 ⇒ 本段落。
- **代码评审（advisor · code）轮次 1**：**VERDICT pass**（无 🔴；🟡 3 ∥ 🔵 3）。
- **评审回应表（发现 → 处置）**：① 批内件 647 行越 500 线 → 报告父侧回填轮（R3 不升级；归口照旧 = 抽共用假 DOM 件 ∥ 在册登记终值）；② 修复轮三判据仅落代码注释（设计/批档零对应句）→ 报告父侧/eng-designer（设计档「随窗」句补半句，或批档承载 + 指针）；③ 批档 `:78` 零触面含 `chat-tree.mjs` ∥ `:177` 值 473/六腿 → **本段回填**（`chat-tree.mjs` 移入修复轮触面 ∥ 批内件终值 647/十腿）；④ `digestPresent` 注释陈旧 → 报告（下次触碰 ∥ #708 二择）；⑤ 死引 `chatScroll` → **已修**（复跑 10/10）；⑥ `until` 墙钟轮询 → 报告（判据效力不受影响）。**终态 = clean**（无 🔴；🔵 全处置）。

**验证读数**

- **先红后绿**（HEAD 三档基线 ∥ 批内件现版）：`tests 10 ∥ pass 6 ∥ fail 4`——腿 7「7a 落尾（绝不插流首）」∥ 腿 8「8a 落尾（不落块#38 式中段）」∥ 腿 9「元素身份存续（绝不再座）」∥ 腿 10「径3b 复列·混窗：落尾（不落流首/中段）」；7b/8b 复列径修前红以探针记录（修前树 = `DIGEST → …` 流首 ∥ `assistant → DIGEST → subagent → assistant` 中段）。
- **修后**：`node --test docs/batches/2026-09-30-digest-reflow-anchor.test.mjs` ⇒ **10/10 绿**（腿 1–10；原六腿零回归）。
- **邻批件连跑**：`digest-instream` 5/5 ∥ `susp-queue` 10/10 ∥ `window-queue-parity` 9/9 ∥ `tech-debt-closeout-r8` 8/8。
- **真机数据复核**（`.33`、修复后代码）：混窗 ⇒ 轮落 151/153 尾部；出窗轮 ⇒ 零插入。
- 仓套件未跑（发布门 = 父侧收口单次全跑）。

**残留（≤2）**

1. **20:48 异源症**（归档块直插运行中回合）：根因 + 两案建议在册（KD-J）——本轮未动（遵「勿扩面强修」）；候选腿形随附，由父侧裁后续轮次。
2. **设计档登记面**：修复轮三判据待设计档/批档承载（评审②）；`PROJECT.md` §4.1/§4.2 值列（`chat-digest.mjs` 113⇒117 ∥ `chat-digest-seat.mjs` 223⇒233 ∥ 批内件 473⇒647）随父侧回填轮收正（§5 残留②既有归口续）。

## §6 验证与收口（父代理）

**实施舱回执** = §5 在盘（初版 + 修复轮〔终态后轮行漂移〕两轮；各含内审 + 代码评审 —— 双轮 VERDICT pass ∥ 终态 clean）。

**父侧核验（2026-09-30 23:2x）**：批内件 `docs/batches/2026-09-30-digest-reflow-anchor.test.mjs` **as-of #747 落地 = 10 腿 1 绿 9 红**——红因 = **本批语义撤销在册**（腿 1/3/4/5/9/10 = 起跑窗补发 ∥ 全替 ∥ 折叠最新一条 ∥ 标签退场 ∥ 出生即定——皆经 #747 明撤；腿 6/7/8 = 轮容器 ⇒ 平铺行形态差——**保留面**〔窗下界 ∥ 未标块不作锚 ∥ 出生即定〕已由 #747 批内件腿 4d/4e 同判据实证）。**件留档冻结、不再维护**（后期批复跑以本注解释红；#747 前历史读数 10/10 在 §5）。

**残留结清（≤2 全闭）**：① **20:48 异源症**（归档块直插运行中回合 · KD-J）= **已由 #746（核面 settle 时点统一——非挂起态亦发 `⟦ev⟧settled`）+ #747（桌面消化面重写）消解**——KD-J 两案建议之 (a) 已落；② **设计档登记面** = 已随 #747 链收正（§4.1 值列 ∥ 新档行 ∥ §4.2 读数——#26 ∥ #29 修复轮）。

**收口核对（D7）**：角色表 ✓ ｜ 状态行 ✓ ｜ 指针 ✓ ｜ **台账 #738 → 核销** ✓。

**收口结论**：两轮实施（初版 + 修复轮）全闭（评审双 pass）＋ 残留双清 ＋ 后续根治链（`docs/batches/2026-09-30-block-arrival-timing.md` ∥ `docs/batches/2026-09-30-triple-end-digest-unify.md`）在册 ⇒ **收口**。
