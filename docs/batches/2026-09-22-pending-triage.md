# 2026-09-22 · pending-triage
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-22 · 来源 = 用户 2026-09-22 09:21「1/2/3 都走」（承 09:19 台账消化——本批 = E 面小件 11 条 · 二选一者须给结论式推荐）。
> 台账 = #23 #56 #87 #168 #170 #171 #174 #175 #185 #186 #208（11 条 · 待裁与微修 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-22 09:21「1/2/3 都走」——E 面小件 11 条）**

**收录**：#23（机制性指令注入位置——二选一）· #56（压缩侧 effort 派生差两则——多选一）· #87（VSC 端壳取消 / 观察面对位——先裁缺口定义再排批）· #168（释放未覆盖面三则）· #170（VSC 翻转残窗——收下 / 加门）· #171（受占分支返回值语义）· #174（VSC 激活链端到端实测——先测量后裁）· #175（memory.db origin 级删除判据）· #185（端差登记项全面复核）· #186（提示词面纪律实体落地——携改后条文）· #208（git / 进程族残留：树杀三份收口等）。

**本批规矩**：凡「二选一 / 多选一」条目——§2 须给**结论式推荐 + 理由**（不得只列选项）；涉产品级新能力者（新增机械门 / 新机制）标注「待用户裁」并停在设计面。**先测量后裁**者（#174）设计面只出测量方案 + 判据。

**未收录（另议）**：#204（`read_history` B/C/E）· #205（会话索引库——大件 · 待用户放行，若立项须单独立批）；#93（认账不排期 · 保持）。

**角色**：#186 提示词内容权 = 主 agent（落笔 eng-coder）；其余按面分工（§2 定）。

**链**：§2 → §3 → §4 → 实施 → §6。

**用户裁决（2026-09-22 09:25「可以，都按建议」——九项裁点全按父侧推荐）**

| # | 裁（含一行理由） |
|---|---|
| 23 | **a 落码**（`_spawnSystemBlock` + `prepareRun` 实施面入本批实施轮——设计已定稿，选「标待实现」= 让设计档写谎） |
| 56 | **认账**（压缩侧保持现判序；压缩 = 机械归纳，不设思考） |
| 87 | **b 归档**（端侧取消走核 `executeCancelAction`、观察面已有对位 ⇒ 字面「现存缺口」无对象） |
| 168 | **②③ 做 · ① 认账**（跨 cwd 释放 + VSC 端壳机判入实施面；ACP `session/close` 属多会话进程语义面，认账） |
| 170 | **a 收下**（边界登记；不加机械门——无残留、下轮 hydrate 自愈） |
| 171 | **a 补**（设计补「受占 ⇒ 可区分信号」+ 端壳 / 面板对位） |
| 174 | **做**（分件探针实测；设计只出测量方案 + 判据） |
| 175 | **a 立**（写入面归一化强制 + 死 origin sweep 判据） |
| 205 | **a 立批 · 设计先行**——另档 `docs/batches/2026-09-22-session-index.md`（不进本批） |

**无需裁三件（按推荐推进）**：#185（端差登记项逐项二态）· #186（提示词实体落地携改后条文）· #208（树杀单源化）。

**修正裁（用户 2026-09-22 09:27「acp那个1，认账不合适，还是做掉比较好，老挂账不是办法」）**

**#168 ① 认账 → 撤销，改为「做」**：ACP `session/close` 释放认领入实施面——`thincoder-cli/src/acp/handlers-session.mjs:193-206` 现值零释放调用（`found.session.cancel()` + `sessions.delete(...)` + `log(...)`）⇒ 补 release 调用，对齐 `thincoder-core/session-slots-manifest.mjs` 既有 release 语义（exit-claim-release 批先例）。

**批面 #168 = ①②③ 全做**（① ACP close 释放 · ② 跨 cwd 释放 · ③ VSC 端壳释放面机判）。

**台上余项（保持原定性，性质各异）**：#56 认账（用户 09:25 已批 · 压缩侧不设思考）· #93 认账不排期（自唤醒 = 新机制 · 待裁）· #179 认账不排期（GC 快照 · 无感则不动）· #170 收下（边界登记 · 无残留）。

**用户授权（2026-09-22 09:29「都自动跑吧」）**：本批链上——① 设计评审点火权 ② §4 用户批准权（代签）③ 修正轮 / 实施轮派发 ④ 收口核销（提交 / 推送 / 台账迁移）——均**委托父侧自动执行**，至本批收口。**父侧自缚**：① 代签仅当「评审 pass（0 🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 09:29 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 需**新范围**或**用户口径裁决** ⇒ 停下（不因授权扩张射程）。

**设计轮核验 + 4 待裁裁定（父侧 · 2026-09-22 09:3x）**

- **核验**：§2 11/11 在档（`:47`–`:310`）+ 设计档面 5 处同步 ✓。
- **待裁①（#186 落点形态）**：**采「新增节」**——实体面缺该节（`thincoder-core/prompts/**` 零命中）⇒ 落法 = 新增；内容 = 设计档 §6.1 逐字稿（内容权 = 主 agent，落笔 eng-coder）。
- **待裁②（#174 仪表形态）**：**采「一次性临时探针」** ✓（常驻另裁）。
- **待裁③（#168 需求笔 F-CR3）**：**主 agent 收正**——但 `requirements/SESSION.md` 现处 id=18 评审冻结窗 ⇒ **解冻后落**（已入父侧队列）。
- **待裁④（#23 链补）**：**采**（评审覆盖 §6.26 → 批准 → 独立实施轮）✓。
- **发现④（#185 登记面异状 7 项）**：并入 #185 实施面（21 行二态清单 + A/B/C 分流 + 7 异状逐项收正或在案列报）。
- **发现⑤（#208 台账外第 4 份副本 `shell.mjs:118`）**：并入方案 ✓。
- **发现⑥（unverified 两项）**：实施轮以实测为准（#175 行数 / `_bak` 存亡 · #174 读数）。
- **面外注（#96/#97 状态错配）**：父侧另核后按实迁移（入父侧队列）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-09-22（修正轮 1 已落地：11/11 方案在档 · 4 条待裁定已逐条裁定（§1）· 11 条评审发现逐条处置（见 §2 修正块）· 无实施）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**轮次**：initial（设计轮）· 2026-09-22 · 承 §1 讨论 + 用户 09:25「都按建议」（九项裁定）+ 09:27 修正裁（#168 ① 撤销认账改「做」⇒ #168 = ①②③ 全做）。**本节不再列选项——直接按裁决成方案**（凡实读核出裁决不可执行者 ⇒ 停手上报，不自行改判）。坐标 = 2026-09-22 实读。

**覆盖**：11/11 条 —— #23 #56 #87 #168 #170 #171 #174 #175 #185 #186 #208。**不碰**（§1 未收录）：#204 / #205 / #93；#205 已裁「另档立批」（不进本批）。

---

### #23 · 子代理「机制性指令」注入位置收正（裁定 = a 落码）

**结论**：实施落码——机制性指令改走 system 固块（`child._spawnSystemBlock`）+ `prepareRun` 拼接。**设计零改**（`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.26 已是目标态：D23-1–D23-7 / 用例 U1–U7 / 判据 A23-1–A23-6 / 受影响文件表齐备）。

**实施面**（4 件）：

1. `thincoder-core/agent-tools/subagent-spawn.mjs`（现 479 行）：① `summarizeEngTaskBook`（`:44-80`）与审计模板构造体（`:394-437`）**外提**新档（下条）；② `input` 面只留任务书（`:388` 基形）——`:394`（批次档行）与 `:402-438`（审计模板六段拼接）改为 `spawnBlocks` **收集**；③ `child._spawnSystemBlock = spawnBlocks.join("\n\n")` 单点绑定（`:442` 邻位 · `buildSpawnChild` 内，sync / async 同点）；④ `role === "eng-coder"` 的 `_engTaskInput` 语义 = **纯任务书**（不含固块）。
2. `thincoder-core/agent-tools/audit-block.mjs`（拟新增 · ~95 行）：`buildAuditBlock(ctx)` 纯函数 = touched 快照 + `summarizeEngTaskBook(ctx.agent._engTaskInput)` + 模板**逐字搬移**（块内文本零改 —— 含块内自指词，整块搬移不改真值）。
3. `thincoder-core/agent/setup.mjs`：`prepareRun` 在 `:214`（`let systemPrompt = base`）之后、`:221` 项目指令之前插固块拼接（3 行）——拼接位 = 槽位装配之后、项目指令之前（`_spawnSystemBlock` 为 null ⇒ 分支不进，depth-0 / explore / plan / consult 逐字节同改前）。
4. 测试面：新档 `thincoder-core/test/spawn-system-block.test.mjs`（U1–U7 · 含先红 U1/U2/U3/U7）；既有断言改指固块字段 = `thincoder-cli/test/batch-doc-gate.test.mjs:98/:115-119/:127/:143-146/:185` · `thincoder-cli/test/eng-designer-role.test.mjs:162-168/:202/:207` · `thincoder-vscode/test/eng-designer-role.test.mjs:167`（负控补固块字段断言 —— **防改后空转，必须同轮补**）· `thincoder-vscode/test/subagent-audit-summary.test.mjs:39-45`。

**前置（链）**：`docs/batches/2026-09-18-prompt-face.md` §3/§4/§5 空（设计从未过评审 / 未获批准）⇒ 本批 §3 须覆盖 §6.26 全文，§4 批准后由 eng-coder 落码。**建议独立实施轮**（跨三包 7 档），不并入本批微修轮。

**验证面**：A23-1–A23-6（§6.26 `:1011-1020` 逐条判据）；零回归 = `cd thincoder-core && npm test` · `cd thincoder-cli && npm test` · `cd thincoder-vscode && npm test` 三绿；`node scripts/doc-check.mjs` 本批触碰档零新增。

**理由**：① 设计完备（选型 / 契约 / 决策 / 用例 / 判据齐，无需重设计）；② 缺陷真实（现态机制锚进 `input` user 首条 ⇒ 压缩吞首条即丢 —— U3 先红即病根复现）；③ 文档为准（设计档已按目标态书写，**码向文档收正**）；④ 缓存契约相容（固块值在 child 生命周期内恒定 ⇒ run 内前缀逐字节稳定 —— §6.26 有兼容证明）。

---

### #56 · 压缩侧 effort/thinking 派生差两则（裁定 = 认账）

**口径句（认账 · 落设计档）**：**压缩侧不设思考** —— `thinking: null` 是需求 N1 的字面（`docs/core/requirements/CONTEXT-COMPACTION.md:74`「摘要调用必须 `thinking:null`」；设计 D9 同：`docs/core/design/CONTEXT-COMPACTION.md:115`）；压缩调用 = `thincoder-core/context.mjs:313`（`{ ...agent.provider, thinking: null }`，**不覆盖** `reasoningEffort` = v3 同源形）。
① **百炼 qwen 族**：`thinking === null` 首判命中（`thincoder-core/config.mjs:137`）⇒ 压缩侧 `enable_thinking:false`（回合侧携 effort ⇒ `:138` ⇒ true）—— 该差 = **压缩侧不思考的派生结果，非缺陷**（`:135-136` 双前置门把该分支限定在 qwen 族 + 百炼主机）。
② **autoThink turn-0 窗口**：压缩检查（`thincoder-core/agent.mjs:241`）先于 turn-0 分类（`:251`）⇒ turn-0 触发的压缩携**分类前**档位（该窗内 ≠ 回合请求同源）—— **认账为已知边界**：影响有界（仅 turn-0 且长史触阈；其后各轮同源）。

**落点**：设计档 `docs/core/design/CONTEXT-COMPACTION.md:312` 尾句「派生差两则（百炼 qwen 族 / autoThink 窗口）⇒ 台账 #56 登记」**收正为上口径句** + 该档变更记录一行。台账 #56 处置 = 父侧（认账销项）。**需求档零改**（N1 字面即认账依据）。

**见证依据**：`docs/batches/2026-09-18-compression-continuation.md:434`（评审 #1 原始发现）· `:444`（两选一上抛）· `:465`（残留登记 ⇒ 台账 #56）；派生序坐标三处（config / context / agent）。

**验证面**：① `git diff --stat -- thincoder-core/config.mjs thincoder-core/context.mjs thincoder-core/agent.mjs thincoder-core/auto-think.mjs` = **空**（本项零码改）；② 设计档收正句在位 + doc-check 零新增。

---

### #87 · VSC 端壳取消 / 观察面对位（F8 残项③）（裁定 = b 归档）

**口径句（已消解归档 · 落设计档）**：「F8 残项③（端壳取消 / 观察面对位）**已消解 · 现存缺口 = 零**：端 ⏹ 取消走**核单源** `executeCancelAction`（`thincoder-vscode/src/extension/panel-messages-turn.mjs:113-125` —— 动态 import 核 `agent-tools/subagent-async.mjs`，`callbacks` 携事件中继）；观察面对位在位（`thincoder-vscode/src/agent/setup-tooltable.mjs:150-174` `vscSubagentFace` —— 收窄 `panel` 动作 + `isReadonlyAction` 含 `status` / `observe`）；F8 主体（端壳消费点 + 载体两字段）已随 09-19 设计 / 09-20 实现落地（§6.27.12.12）。」

**落点（设计档一致性收正 · 本席写域）**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` **F8 语族六处逐点**收正为**现态陈述**（含两见证坐标）：`:1121`（F8 表行尾「**未并入项** = 端壳取消 / 观察面对位（另案）」）· `:1283`（§6.27.6 ▸ 载体清单位点「**残余另案** = 端壳取消 / 观察面对位」）· `:1297`（§6.27.7 注「**另案三项**」称谓 + 「**第三项未并入**（另案）」）· `:1411`（§6.27.12.11 边界 6「**残余边界** = 端壳取消 / 观察面对位（F8 未并入项——另案）」）；另 `:1795`（§6.27.12.12 回指「F8 已知面 + **另案三项**」）· `:1862`（§6.27.12.12 ⑤「其 ③ …不在本批」）同收正；**+ 变更记录一行**（历史留记录面）。

**验证面**：机检 = **F8 语族六处逐点核**（`:1121` / `:1283` / `:1297` / `:1411` / `:1795` / `:1862`——各点零 pending 词（`未并入项` / `另案`）∧ 现态陈述在位）∧ 两见证坐标在位 ∧ doc-check 零新增；**命中面限定于该六处**（该档活面 `另案` 另有 ≥14 处与 F8 无关的正当用法——全文统计口径不适用）。台账 #87 处置 = 父侧（归档销项）。

---

### #168 · 释放未覆盖面三则（裁定 = ①②③ 全做 · 承 09:27 修正裁）

**① ACP `session/close` 释放**：`thincoder-cli/src/acp/handlers-session.mjs:193-206`（现值 = `cancel` + `sessions.delete` + `log`，**零释放**）⇒ 补释放。语义 = §6.16 公式代入（`docs/core/design/SESSION.md:360`：释放 A ⟺ `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`）：**保留集 = 本进程其余在存会话的活绑定槽（同 cwd）**，释放集 = 被关闭会话认领的槽；按 cwd 分组（manifest 按 cwd 一份）；落盘判据三条沿用（§6.16:363 —— fresh 同次快照 / 值条件删除 / 内存认领表移除）；**零新增写盘次数**（并入既有 `saveManifest` —— 核 `opts.release` 已实现：`thincoder-core/session-slots-manifest.mjs:63-99` + `:111-126`；先例 = exit-claim-release 批 CLI 双接线 + VSC `session-io.mjs` 三落点）。被关闭会话的 (cwd, slot) 取值点 = **ACP 会话记录容器**（会话 Map：`id → session`——`handlers-slots.mjs:89` / `:108` 读 / 写 · `handlers-session.mjs:202` 删）+ **槽取值 = `session.agent._slot`**（认领写入同源 = `handlers-slots.mjs:96-100`）；`session/close` 经 `findSession(params)` 定位记录（`handlers-session.mjs:197`）——**实施轮先出定位报告（取值点 + 保留集数据集）再落码**。

**② 跨 cwd 释放（VSC 项目切换）**：现状 = 释放谓词单 cwd 面（`session-slots-manifest.mjs:114-120` 只过滤单个 manifest）∧ VSC 项目切换面（`thincoder-vscode/src/extension/panel-messages.mjs:77-89` + `chat-panel.mjs:96-104`）对**旧 cwd** manifest 零释放 ⇒ 旧 cwd 认领保留至进程退出。实施 = 项目切换落点对旧 cwd manifest 补一次同语义释放：**保留集 = 空**（切换后该 cwd 内本进程已无活绑定）；口径沿用 §6.16:366 的**假定 + 复核条件**（同 cwd 出现多活绑定 ⇒ 按活绑定全集计算保留集 —— 不得释放他端活认领）。

**③ VSC 端壳释放面机判**：`session-io.mjs` `newSlot`（`:128-163`，release 并入 deletions 见 `:158-163`）· `switchToSlot`（`:178-194`，`:190` `saveManifest(..., { release: [slot] })`）的 release 传参现仅经核 `saveManifest` 单源**间接**验证 ⇒ 补**端壳级用例**：断言 = 未占落点携带 release 语义 ∧ 被占分支零释放零写（判据 = §6.16 边界情形表）。

**设计档落点**（`docs/core/design/SESSION.md`）：§6.16:365（「ACP = 各在存会话…**本批不入释放面**，F-CR3 零回归」）改**现态**（ACP 在存会话 = 活绑定集来源；`session/close` ⇒ 释放）；§6.16:369-375 ACP 调用面表标题（「『ACP 不入释放面』可核清单」）+ **新增 `session/close` 行**（释放态 + 保留集口径）；§6.15:318-319 邻位补 close 释放句；**§6.2:109 / §6.16:398 / §6.18:511 / §6.18:526 四处旧句收正为现态**（认领释放语境零 pending 词）；§7 补 **D-SE48**（释放覆盖面）；变更记录一行。

**需求面上抛（主 agent 笔）**：`docs/core/requirements/SESSION.md` §2.3 **F-CR3** 现文（「ACP 四点不传 `releaseStale`」族）与本次裁定**相抵** ⇒ 须收正为「ACP `session/close` 入释放面；保留集 = 其余在存会话槽」。

**验证面**：① `cd thincoder-cli && node --test test/acp-contract.test.mjs` + ACP close 新用例（关闭 ⇒ 该槽认领条删除 ∧ 同 cwd 其余在存会话槽**保留**）；② VSC 端壳用例（newSlot / switchToSlot release 传参 + 被占零释放 + 项目切换旧 cwd 释放）；③ `cd thincoder-core && npm test`（`session-slots-manifest` 零回归）。

---

### #170 · VSC 翻转在飞回合残窗（裁定 = a 收下 · 边界登记句）

**结论**：收下为设计边界 —— **不加机械门**（VSC 真值 = 槽权威，现设计已如此）。

**落点**：`docs/core/design/ENGINEERING-MODE-V2.md` 端差面节（`:369-378` 之后）补边界句：「**在飞回合翻转窗（边界 · 收下）**：VSC 翻转点（`thincoder-vscode/src/extension/panel-messages-settings.mjs:171-186` `handleSetEngineeringEnabled` / `chat-panel.mjs:349-364` `_setPlanMode`）在**在飞回合内**只收正槽位 —— 活体 `agent.config.agent.engineering` / `planMode` 由下一次 hydrate 收正 ⇒ 该回合剩余轮次内 `planMode` 可仍为 true、当轮表内仍有 `plan`。**不新增机械门**（真值 = 槽权威）；**零残留**（下一轮 hydrate 收正）。」+ 变更记录一行。

**验证面**：机检 = 该句在位 + doc-check 零新增；行为面**零新用例**（沿用 `docs/batches/2026-09-21-eng-plan-exclusion.md` T10 面既有断言）。

**理由**：窗口 = 过渡态 + 零残留；消除须「回合内即时应答」= **新增机械门**（产品级新能力 ⇒ 须另裁），且与既有设计边界相抵；收下 = 与设计一致的最低成本形态。

---

### #171 · VSC 端壳受占分支返回值语义（裁定 = a 补）

**结论**：补 —— 设计补「受占 ⇒ 返回可区分信号」+ 端壳 / 面板对位。

**实施面**：① `thincoder-vscode/src/extension/session-io.mjs:185` 现值 `if (occ.occupied) return data`（零写但返回与成功**不可区分**）⇒ 改返回**可区分信号**（具体形态由实施轮定；语义 = 调用面可判别；**零写语义不变**）；② 面板路径 `thincoder-vscode/src/extension/panel-messages-session.mjs:51-61`：前置判据（`:51-57`）之外补**第二判** —— TOCTOU 窗内收到受占信号 ⇒ **保持 `_slot` 现值**（不钉他端活槽）+ 提示 + `_loadSession()` 重绑本端原槽（**第二判路载荷 = 保持现值**；前置判据路载荷 = `_slot = null` + 缓存重绑——§6.15 受占条 · §6.16 判据句）。

**设计档落点**（`docs/core/design/SESSION.md`）：§6.15（`:294-295` 邻位）补「端壳 `switchToSlot` 受占分支 = **零写 + 可区分信号**（调用面可判别；判据前置**不替代**函数内判据）」+ 两条受占路径**载荷分述**（前置路 = `_slot = null` + 缓存重绑 ∥ 第二判路 = 保持现值 + `_loadSession()`）+ §6.16 判据句邻位同补 + §7 补 **D-SE49** + 变更记录一行。

**验证面**：`cd thincoder-vscode && node --test test/session-boot.test.mjs`（端壳族就近档）——新断言 = 受占信号形态 ∧ 面板保持原槽（不钉他端活槽）；核零改（`thincoder-core/session-slots.mjs` diff 空）。

---

### #174 · VSC 激活链端到端实测（裁定 = 做 · 方案 + 判据）

**方案（三段读数 · 双口径）**：

- **口径 A（真机旁证 / 补证——非主读数）**：`thincoder-vscode/.vscode/launch.json` 两配制（`Launch Extension`）启动扩展宿主；锚点 = `%APPDATA%\Code\logs\<session>\window1\exthost\exthost.log` 的激活行（`ExtensionService#_doActivateExtension … activationEvent: 'onView:thincoder.chat'`，毫秒时间戳在位 —— 本机 2026-09-20 日志实证）+ **临时打点**（activate 始/末 · `resolveWebviewView` 始/末 · webviewReady 接收 · providerStatus 发包 · loading 揭幕）——打点走**核共享通道 `logEvent`**（`thincoder-core/log.mjs` —— 双端共用 / 按天轮转 / `THINCODER_LOG_DIR` 可隔离），**一次性探针形态**（测后撤除 —— 同 CLI 先例 = 临时命令级实测、无常驻仪表；先例 `docs/batches/2026-09-21-startup-latency.md`）。
  **定位 = 旁证 / 补证**：只用于探针不可覆盖的两面（宿主调度排队 / 真实绘制），且**须先经待裁第 2 条点头**（一次性探针形态）后始得执行。
- **口径 B（无头分段主读数）**：复用既有三件套 —— 真 `activate()` 直调（`thincoder-vscode/test/prompts-async-guidance.test.mjs:288-327`）+ 假 view 驱动 `resolveWebviewView`（`test/session-boot.test.mjs:153`）+ happy-dom webview（`test/helpers/webview-env.mjs`）⇒ 分段计时（模块图 / `applyEngineFloorGuard` 探针 / locale / `ChatPanel` 构造 / resolve / 握手 / 揭幕）。**不覆盖**：宿主调度排队、真实绘制（happy-dom 不排版）。
- **采样与噪声**：每态 ≥5 次重载；**不设绝对阈值**（先例血证：静默窗结构性噪声底 6.6–8.1s —— `docs/batches/2026-09-18-init-block.md:933-935`）；判别式 = 常态带分离 / 自身对照。

**判据（先测量后裁用）**：

| # | 判据 | 形态 |
|---|---|---|
| J-1 | 首屏时延（探针口径）= `activate → 握手 → providerStatus 揭幕` 的无头分段合计；真机旁证若做，另记一行对照（`activate 行 → loading 揭幕`） | 中位 + 分布（n ≥ 5），记入读数档 |
| J-2 | 段占比 = 每对打点差值 / 总时长 | 任一**单一**段 > 40% 总时长（或 > 1s 且属非结构性面）⇒ **补批候选** |
| J-3 | 与核修同愈面核验 | GC / traces / 同步阻塞段读数 ≈ 0（VSC 全包零 `execSync`/`spawnSync` ∧ `session-io.mjs:35/:89` 纯转口）⇒ 若仍显著 ⇒ 定位到端壳自有段 |
| J-4 | 二态结论 | 无单段超线 ⇒ 判「**无需 VSC 面补批**」（读数入册 + 归档）；有 ⇒ **立批**（段名 + 读数 + 候选修法） |

**前置 / 边界**：① 新仪表常驻化 = **待裁**（见待裁清单 —— 本方案默认一次性探针）；② webview 内 `performance` 标记 = 可选（真画唯一证据，须另裁 —— 默认不加，真画证据留待真机 QA #162）；③ 本批只出方案 + 判据；**实测执行 = 独立轮**（需本机 VS Code）。**验证面（方案自身）**：探针撤除后 `git diff` 空；读数留档（`.thincoder/tmp/` 或核 logs 目录）。

---

### #175 · memory.db origin 级删除 / 死 origin sweep（裁定 = a 立 · 出判据）

**判据（设计面 · 两条）**：

- **写入面归一化强制**：`normalizeOrigin`（`thincoder-core/memory/origin.mjs:18-24` —— 分隔符 `/` · 盘符大写 · 去尾斜杠 · 幂等）为**唯一**归一函数；判据 = ① 写面所有 origin 赋值点经归一（现面已如此：`memory.codeOrigin` / `projectOrigin` 各赋值点 + `code-sync.mjs:193` / `docs.mjs:26` / `core.mjs:213,264` 族）；② 机检 = 变体折叠断言（既有族 `thincoder-cli/test/memory-origin-normalize.test.mjs`）+ 写面结构检查（origin 落库前经 `normalizeOrigin`）。旧版本再写（无归一代码的已发布版）不入机检面 —— 由 sweep 面兜。
- **死 origin sweep（二信号）**：**信号 A** = `normalizeOrigin(o) !== o`（非归一变体）⇒ **折叠，不删**（`MEMORY.md` §6.11 迁移形态）；**信号 B** = `!existsSync(o) ∧ !existsSync(normalizeOrigin(o))` ⇒ **可删**（树亡；探针**仅 ENOENT 判亡** —— 其他错误 fail-safe 保留，先例 `thincoder-core/session-stale.mjs:124-127`）。删除面 = `code_chunks(+fts)` / `doc_chunks(+fts)` / `files(+fts)` 三表（FTS 由触发器随行同步 —— `memory/schema.mjs:344-359` 等）；`entries` 无 origin 列（不涉）；`meta.last_indexed_commit` 全局单键（不涉）。
- **无冷窗**：`code_chunks` / `doc_chunks` 无行级写入时间戳（仅源文件 `mtime_ms`）⇒ **不以时间作删除判据**；回收形态（trash rename / 直接删 + `VACUUM`）与命令面（复用显式清理面先例 = `/reindex`）**归实施轮**；低风险依据 = `MEMORY.md:91`「磁盘为真相 · DB = 可重建索引」。

**设计档落点**：`docs/core/design/MEMORY.md` 新增 **§6.13**（判据 + 面表 + 边界：别名路径 / 可移动介质假阳 + fail-safe）+ 变更记录一行。

**验证面**：① sweep 判据单测（三态：变体 / 亡树 / 活树 —— 折叠 vs 删 vs 保留）；② 折叠面既有单测零回归；③ 库面读数（三表 origin 分布 + `_bak` 零命中 + `PRAGMA quick_check`）由实施轮实测留档（**本席未实测** —— 见上抛项）。

---

### #185 · 端差登记项全面复核（裁定 = 按推荐推进 · 逐项二态清单 + 判据）

**判据（二态 · 机检化）**：**保留** 须**三件齐备**：① 结构性不对称（仅单侧存在 / 依赖面特有宿主能力 —— 可判形式 = 该面对象在另一面无同类实现）；② 证据（坐标 / 实测读数）；③ **显式裁定**（日期 + 裁定人 + 落点，且**活面可核**）。缺任一件 ⇒ **消**（归单一权威源 / 两端口径对齐 + 登记行改「消解路径 + 到期条件」）；已消解者 = **不重开**（零动作）。

**逐项二态清单**（坐标 = 2026-09-22 实读；他流在途写入致 1–2 行漂移者已按修正轮实读回填（第 7 / 8 行）——其余为 as-of 读数，不追值）：

| # | 登记项 | 二态 | A9（①②③） | 动作 |
|---|---|---|---|---|
| 1 | `docs/cli/design/TUI.md:370-371` VSC 嵌套活动「子标」 | **消** | ✗✗✗（自陈未齐） | 排批：两端口径统一（嵌套归属标语义）+ 登记行改消解路径 |
| 2 | `docs/cli/design/TUI.md:650` VSC webview「非同机制」 | **保留** | ①✓（渲染宿主不同 = 结构性不对称 —— 与 `CORE-UNIFICATION.md:340` 统一判据）②✗③✗ | 补 ②③（裁定回填活面） |
| 3 | `docs/cli/design/TUI-INPUT-BOX.md:305` VSC 首行 ↑ no-op | **消** | ✗✗✗ | 排批：↑ 回落语义对齐 + 登记行收正 |
| 4 | `docs/core/design/PROMPT-SYSTEM.md:172` 端特有段（A16/C2/A18） | **保留** | ①半②半③✓（2026-09-13 裁定可解析） | 证据句就地补（同档 `:115/:118/:128-130` 已携坐标） |
| 5 | 空窗差（`cli/design/TUI.md:584-586` ∥ `core/design/SESSION.md:164-167` ∥ `vsc/design/WEBVIEW.md:137`） | **保留** | ①②③✓（裁定 = 2026-09-21 批档 `vsc-block-title-align:50-51`） | ③ 回填活面（裁定来源改现态可核形） |
| 6 | `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:34/:39-40`（载体一项） | **保留** | ①✗②✓③✗ —— 节头称「已裁保留」而条目无裁定号（自相矛盾） | 补 ① 论证 + ③ 裁定号（否则按默认消） |
| 7 | `docs/core/design/SESSION.md:278-283`（修正轮实读）§6.15 端壳保留两款 | **保留** | ①②✓③半 | ③ 回填 + 补状态词「已裁保留」 |
| 8 | `docs/core/design/SESSION.md:317-318`（修正轮实读）记录面写条件（核无条件 ∥ 端条件） | **保留-likely** | ①✗②✓③半（父侧 2026-09-19，住批档） | 补 ① 论证或转消解；③ 回填 |
| 9 | `docs/core/design/CORE-UNIFICATION.md:321-328`/`:347-352` 端特有桶 ④ 4 行 | **保留（类级）** | ①②✓③半（类级裁定 2026-09-13） | 类级即裁定 ⇒ 逐项免；登记注补一句 |
| 10 | `docs/core/design/CORE-UNIFICATION.md:337`（`history-window` 归核） | **已消解** | — | 零动作（不重开样板） |
| 11 | `docs/core/design/CONFIG.md:48` · `MEMORY.md:38` · `TOOLS.md:107/:109` | **保留（段级）** | ✓/✓/✗；`MEMORY.md:38`（#135）**前提陈旧** | 保留 + `MEMORY.md:38` 前提句收正（#125 端差已注销） |
| 12 | `docs/core/design/AGENT-LOOP.md:122-126` 端特有面 ④ 段 | **混合** | 半/✗/✗ | 逐条收正（第 3 条「差异随核内归一消失」= 已判消 —— 留陈述） |
| 13 | `docs/core/design/WORKSPACE.md:19` 端特有运维面（2026-09-20） | **保留** | ✓/半/✗ | 补 ②（盘上实核读数）+ ③ 或转消解路径 |
| 14 | `docs/core/design/BATCH-RECORD.md:295-300` 端特有段处置（**裸保留句**） | **消/收正** | ✗✗✗ | 收正为现态（或加例外回指 —— 四选一不许并存） |
| 15 | `docs/core/design/MEMORY.md:294` 工具契约端差 ∥ `I18N.md:32` 双源冻结 | **消解候选** | ✗/✓/半 | 排批（摘除候选登记已有）或补 ①③ |
| 16 | `docs/core/design/AGENT-LOOP.md:134`/`:75` · `AGENT-LOOP-SUBAGENT.md:2237` 驱动面判保留 | **保留** | 半/半/✓（2026-09-20 裁定） | ② 证据句回填（① 论证在批档 §2.21） |
| 17 | `docs/core/design/MULTI-INSTANCE-COLLAB.md:100-102`（+`:213/:214`）端侧缓存端差 | **保留-likely** | 半/✓/半 | 补 ①③ 或转消解；需求侧同扫 |
| 18 | `docs/core/design/CONTEXT-COMPACTION.md:589` · `SETTINGS-TOOL.md:83`（带升级路径） | **保留（带到期）** | 半/✓/半（D-CC27 = 2026-09-21 批准 A） | 正面样板；补状态词「已裁保留（带升级路径）」 |
| 19 | `docs/core/design/PROVIDER.md:278` `resolveKey` env 语义差 | **消** | ✗✓✗（活行为差 —— 非结构差） | 排批：两端口径统一（密钥源语义） |
| 20 | VSC 面登记三表（`vsc/requirements/WEBVIEW.md:105-134` 约 20 行 · `vsc/design/WEBVIEW.md:115-139/:167` · `WEBVIEW-PROTOCOL.md:220-234` 6 行）+ 端特有键族（`:277-280` 等） | **混合** | 多数 ✗✗；③ 仅个别 | 按 VSC 文档面批**逐行二态化**（保留 = 补 ①②③；否则消解路径）；端特有键族补「结构性不对称」论证句 |
| 21 | 需求层 §4 端差登记表（`requirements/{SESSION:149 · MEMORY:151-160 · MCP:76-92 · CHECKPOINT:78 · CONSULTATION:69 · CONTEXT-COMPACTION:82 · AGENT-LOOP:159/:168 · ADVISOR-CONVERGENCE:198-201}`） | **混合** | 多 ✗✗✗（as-of 迁移前现状） | 按档归并复核（每档一条裁定行）——**需求笔 = 主 agent** |

**已消解 · 不重开（零动作）**：冷 cwd（D-SE38）· CONTEXT-COMPACTION W6 · PROVIDER W10 · MEMORY 存储 / 索引两行 · ESCALATE §4 · display-parity 族已消项。

**异状（本席实读核出 · 逐条列报）**：① **行号三处漂移**（#185 evidence 与批档落点表全部失真）：`TUI.md:369-370`→`:370-371` · `:616/617`→`:650` · `TUI-INPUT-BOX.md:240`→`:305`；② **死指针 1 处**：`docs/vsc/design/WEBVIEW.md:419` 引 `TUI.md:360-361` —— 现值非登记行（登记行现 = `:370-371`）；③ **口径相抵**：`TUI.md:650` 判「A9 未齐」vs `CORE-UNIFICATION.md:340` 同型理由判合法保留 ⇒ 须统一判据（本清单第 2 行已按统一判据判**保留**）；④ **登记面自相矛盾**：三行清单同句并存「登记面 = 已裁保留项」+「本项状态：待裁」；⑤ **陈旧前提**：`core/design/MEMORY.md:38`（#135）以已注销的 #125 为据；⑥ **裁定住记录面**：4 处 ③ 只在批档（须回填活面或改「消解路径」形态）；⑦ **类集漏列**：`docs/cli/design/TUI-COMMANDS.md:7` · `TUI-SESSION-VIEW.md:7` 两处裸读法未列（本席补入清单）。

**动作分流**：**A 类（纯登记面收正 —— 文档卫生轮）** = ① ② ④ ⑤ ⑥ ⑦ + 三处「待裁」行改写 + 第 4/5/6/7/8/9/11/12/13/14/16/18 行的补件（**第 9 行** = 类级登记注补句 · **第 11 行** = `MEMORY.md:38` 前提句收正〔以已注销的 #125 为据〕· **第 12 行** = 端特有面 ④ 段逐条收正 · **第 16 行** = ② 证据句回填〔① 论证 = 2026-09-20 批档 §2.21 · ③ = 同批裁定 ⇒ 回填即三件齐〕）；**B 类（消解对齐 —— 产品工作，排批）** = 第 2 行补证 + 第 1/3/19 行对齐 + 第 15 行摘除 + VSC 面逐行二态化；**另案（父侧派单 · 带到期条件）** = **第 17 行**（MULTI-INSTANCE-COLLAB 端侧缓存端差）——须补 ① 结构性论证 + ③ 裁定号，或转消解路径；**到期条件 = 第 21 行（需求层登记表）复核批同批处置**（需求侧同扫）；**C 类（已消解）** = 零动作。**本批不夹带任何一条**（A 类归文档卫生轮 —— 与 #216 / #225 / #201 / #202 / #203 / #206 家族同批；B 类 / 第 17 行按台账排期）。

---

### #186 · 提示词面纪律实体落地（裁定 = 按推荐推进 · 落点与验证面）

**事实修正（本席实读核出 · 影响落点形态）**：**运行面现无「多实现面纪律」节** —— `thincoder-core/prompts/**` 全 dir 检索 `实现面|镜像|面间` **零命中**，实体两档（`thincoder-core/prompts/discipline-engineering.md` 节表 = 铁律 / 变更面分流 / 基本流程 / 任务边界 / 交付报告 / 测试纪律 / 文档纪律 / 并行调用；中文镜像同构）**均无该节**。该节曾在双仓期落于两端 `src/prompts/`（`thincoder-cli|thincoder-vscode` `docs/_archive/` 有在册批档），合仓 + 核统一后运行面未携 ⇒ 落地动作 = **新增节**（非「改写第 2/6 条」）。

**落点（两档 · 内容权 = 主 agent · 落笔 = eng-coder）**：

1. **运行面** = `thincoder-core/prompts/discipline-engineering.md`（英文 —— 装配实际执行面）：新增「多实现面纪律」节；文本 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §6.1 六条（`:203-208`）逐字内容 —— **第 2 条末句**「本条只描述实现形态，不构成差异保留依据（端差处置见第 6 条）」+ **第 6 条**「端差处置（默认与例外）」为本次落点核心；第 4 条按适用性保留；节位由父侧定（建议 = 文档纪律域内）。
2. **中文镜像** = `docs/core/design/prompts/discipline-engineering.md` 同节（中文逐字）；两档**语义同源、不做 byte-identical**（多面纪律自持）。
3. **「对端 VSC 副本」= 不存在**（VSC `src/prompts/` 已删 —— 2026-09-15 W2；`thincoder-vscode/prompts/` 无此档；仅 `docs/_archive/` 存参照历史）⇒ 原落点表 3–4 行按现态**不适用**（事实修正）。

**验证面**：① 结构 = 两档含该节（节标题 + 第 6 条关键句在位 —— 中英各自断言）；② 机检 = `cd thincoder-vscode && node --test test/prompts-mirror-anchors.test.mjs`（该测试读**运行面**核包档 `loadSlot("discipline-engineering.md")` —— 若父侧为新节加锚则须同批同步该档锚表；**新锚须结构性 / 机检形，禁散文锚** —— `docs/core/design/TESTING.md` §5）；③ 提示词**零维护者注**（禁日期 / 批号 / 评审号 —— 同档 `:114` 已有同款断言）；④ doc-check 零新增。

---

### #208 · git / 进程族残留（裁定 = 按推荐推进）

**① 表外同步 spawn 2 处**（`thincoder-core/tools/shared.mjs:221-225` `gitDiffOne` · `tools/patch.mjs:278` `ls-files` 探针）：命令**零交互**（非 #207 缺陷族）⇒ **登记随触碰**（不排批）；到期 = 该档因他因触碰时顺带评估异步化。

**② `killProcessTree` 收口（进程族卫生 · 设计如下）**：**实读盘点（2026-09-22 修正轮复核）** —— 单源已存在 = `thincoder-core/tools/process-tree.mjs:13`（`execute.mjs:30` / `git-run.mjs:14` 已消费）；余自持副本 **3 处**（台账记 3 处；本席原记 4 处 = 计数笔误，此处收正）：`thincoder-core/tools/bash.mjs:66`（`:143` 消费）· `thincoder-vscode/src/tools/shared.mjs:93`（`:145` / `:202` 消费）· `thincoder-vscode/src/tools/shell.mjs:118`（`:318` 消费 —— **台账未列 · 本席实读补出**）。**收口设计**：核内 = `bash.mjs` 改 `import { killProcessTree } from "./process-tree.mjs"`（删本地副本，零行为变）；VSC = 两处改经核单源（**静态 import** `@thincoder/core/tools/process-tree.mjs`〔实现轮偏离收正 D1：两处消费点均为同步调用，动态 import 会使 kill 延后至兑现 ⇒ 静态形；静态闭包仅 `node:child_process` ⇒ engine-floor 守卫绿——父侧直接执行 · 可 revert · 2026-09-22；详见 §5/§6〕）；**零新增语义**，用例 = 既有 `thincoder-core/test/tool-seams.test.mjs`（树杀缝）+ VSC 对位。

**验证面**：① 定义点机检 —— 三包源码域（`thincoder-core/` · `thincoder-cli/` · `thincoder-vscode/`——排除 `.thincoder/tmp/` 探针副本）内 `function killProcessTree` 定义命中 = **1**（核单源），`bash.mjs` / VSC 两档零本地定义；② 三包全绿（`cd thincoder-core && npm test` · `cd thincoder-cli && npm test` · `cd thincoder-vscode && npm test`）；③ engine-floor 守卫绿。

---

## ② 待裁清单（每条一句话 = 要裁什么 + 推荐）

1. **#186 落点形态**：实体面**缺该节** ⇒ 落法 = 「**新增节**」而非「改写两处」—— 要裁 = 是否按新增节落（**推荐：落** —— 内容取 §6.1 六条按适用性裁剪；不落则第 6 条例外句无处生效）。
2. **#174 仪表常驻化**：一次性探针 vs 常驻打点（常开 / gate）—— **推荐：一次性临时探针**（测完撤除，同 CLI 先例）；常驻仪表另裁；webview 内 `performance` 标记默认不加。
3. **#168 需求笔回填**：`requirements/SESSION.md` §2.3 **F-CR3** 与本次裁定相抵 —— **需求档收正由主 agent 落笔**（推荐：收正为「close ⇒ 释放；保留集 = 其余在存会话槽」）。
4. **#23 链补**：09-18 设计未过 §3 / §4 —— **推荐**：本批 §3 评审覆盖 §6.26 全文 → §4 批准 → 独立实施轮落地（跨三包 7 档）。

## ③ 受影响文件表（本案面 · 行数口径 = `find /c /v ""`；现量 = as-of 2026-09-22 实读，未逐档实测者标 `—`）

| # | 文件 | 现量 | Δ（估） | 归属批 / 写域 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 479 | −80 / +12 | #23 实施轮（eng-coder） |
| 2 | `thincoder-core/agent-tools/audit-block.mjs`（拟新增） | — | +~95 | 同上 |
| 3 | `thincoder-core/agent/setup.mjs` | 234 | +3 | 同上 |
| 4 | `thincoder-core/test/spawn-system-block.test.mjs`（拟新增） | — | +~120 | 同上 |
| 5 | `thincoder-cli/test/batch-doc-gate.test.mjs` | 188 | ±14 | 同上 |
| 6 | `thincoder-cli/test/eng-designer-role.test.mjs` | 269 | ±8 | 同上 |
| 7 | `thincoder-vscode/test/eng-designer-role.test.mjs` | 198 | ±3 | 同上 |
| 8 | `thincoder-vscode/test/subagent-audit-summary.test.mjs` | 118 | ±6 | 同上 |
| 9 | `thincoder-cli/src/acp/handlers-session.mjs` | 258 | ±8 | #168①（eng-coder） |
| 10 | `thincoder-vscode/src/extension/session-io.mjs` | 239 | ±8 | #168②③ / #171 |
| 11 | `thincoder-vscode/src/extension/panel-messages-session.mjs` | 106 | ±4 | #171 |
| 12 | `thincoder-vscode/src/extension/panel-messages.mjs` | 331 | ±6 | #168② |
| 13 | `thincoder-vscode/src/extension/chat-panel.mjs` | 486 | ±2 | #168② |
| 14 | `thincoder-cli/test/acp-contract.test.mjs` | 363 | +~30 | #168① 用例 |
| 15 | `thincoder-vscode/test/session-release-shell.test.mjs`（拟新增——#168②③ 释放面用例：newSlot / switchToSlot release 传参 + 项目切换旧 cwd 释放） | — | +~60 | #168②③ 用例（`session-boot.test.mjs` 现量 446——并入即越 500 硬限 ⇒ 另立新档） |
| 16 | `thincoder-core/tools/bash.mjs` | 277 | −9 | #208② |
| 17 | `thincoder-vscode/src/tools/shared.mjs` | 204 | −9 | #208② |
| 18 | `thincoder-vscode/src/tools/shell.mjs` | 338 | −9 | #208②（台账外补项） |
| 19 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 2239 | ±10 | #87（本席写域） |
| 20 | `docs/core/design/SESSION.md` | 656 | +~20 | #168①②③ / #171（本席写域） |
| 21 | `docs/core/design/CONTEXT-COMPACTION.md` | 726+ | ±2 | #56（本席写域） |
| 22 | `docs/core/design/MEMORY.md` | 565 | +~25（§6.13） | #175（本席写域） |
| 23 | `docs/core/design/ENGINEERING-MODE-V2.md` | 570 | +2 | #170（本席写域） |
| 24 | `thincoder-core/prompts/discipline-engineering.md` | 123 | +~12 | #186（内容权 = 主 agent · 落笔 = eng-coder） |
| 25 | `docs/core/design/prompts/discipline-engineering.md` | 120 | +~12 | 同上（中文镜像） |
| 26 | #185 A/B 类触碰面（多档） | — | — | **不在本批**（文档卫生轮 / 对齐批） |
| 27 | #174 读数留档 + 探针（撤除） | — | 0 | 独立测量轮 |

**跨文件上限与拆分计划**：`subagent-spawn.mjs` 479 → ~400（**下降**，越软线状态缓解）；`thincoder-core/agent-tools/subagent.mjs` 398 已在册（§6.20.4）；本批新增档 = 3（行 2 拟新增 ~95 · 行 4 拟新增 ~120 · 行 15 拟新增 ~60）。
**越 300 软线档位口径**（均 ≤500 硬限）：`thincoder-vscode/src/extension/panel-messages.mjs`（330 → ~336）· `thincoder-cli/test/acp-contract.test.mjs`（363 → ~393）· `thincoder-vscode/src/tools/shell.mjs`（338 → ~329）· `thincoder-vscode/src/extension/chat-panel.mjs`（486 → ~488）· `thincoder-vscode/test/session-boot.test.mjs`（446 → ~466——#171 改行 + 追加用例）——**均为就地改行 / 追加用例（结构未变 · 本批不拆）**；`session-boot.test.mjs` 与 500 硬限余量紧（446 → ~466）⇒ #168②③ 用例另立新档之由（行 15）。

## ④ 验收对照（逐条回指 · 可机检）

| # | 条目 | 判据（可机检） | 设计档锚 / 台账 |
|---|---|---|---|
| 1 | #23 | A23-1–A23-6（§6.26 `:1011-1020`）+ 三包 `npm test` 三绿 + U1/U2/U3/U7 由红转绿 | `AGENT-LOOP-SUBAGENT.md` §6.26 · 台账 #23 |
| 2 | #56 | 四档 diff 空（零码改）+ 设计档收正句在位 + doc-check 零新增 | `CONTEXT-COMPACTION.md:312` · 需求 N1（`:74`） |
| 3 | #87 | `AGENT-LOOP-SUBAGENT.md` **F8 语族六处逐点核**（`:1121` / `:1283` / `:1297` / `:1411` / `:1795` / `:1862`——各点零 pending 词 + 现态陈述在位）∧ 两见证坐标在位 | 同档 §6.27 F8 行 · §6.27.6 · §6.27.7 · §6.27.12.11 · §6.27.12.12 |
| 4 | #168① | ACP close 新用例（认领条删除 ∧ 同 cwd 其余在存会话槽保留）+ `test/acp-contract.test.mjs` 全绿 | `SESSION.md` §6.16 |
| 5 | #168② | 项目切换旧 cwd 释放用例（旧 cwd 认领条删除 ∧ 他端活认领不动） | `SESSION.md` §6.15 / §6.16 |
| 6 | #168③ | 端壳用例（release 传参 ∧ 被占零释放零写） | `session-io.mjs:128-163` / `:178-194` |
| 7 | #170 | 边界句在位 + doc-check 零新增 + 零新用例 | `ENGINEERING-MODE-V2.md:369-378` 邻位 |
| 8 | #171 | 端壳用例（受占信号形态 ∧ 面板保持原槽）+ 核 diff 空 | `SESSION.md` §6.15 |
| 9 | #174 | 方案 + J-1–J-4 判据在档；实测读数留档（独立轮） | 本节 · 台账 #174 |
| 10 | #175 | 三态单测（变体 / 亡树 / 活树）+ 既有折叠单测零回归 + 库面读数留档 | `MEMORY.md` §6.13（拟） |
| 11 | #185 | 逐项二态清单 + A/B/C 分流在档；A 类入文档卫生轮、B 类入台账排期 | 本节 · 台账 #185 |
| 12 | #186 | 两档含新节（关键句在位）+ mirror-anchor 测试绿 + 零维护者注 + doc-check 零新增 | `LEDGER-SELF-CONTAINED.md` §6.1 · §6.6 |
| 13 | #208② | `function killProcessTree` 全仓命中 = 1 + 三包全绿 + engine-floor 守卫绿 | 本节 · 台账 #208 |

## ⑤ 边界（本批不做）

不实施（本批 = 设计轮；实施 = §5 / 独立轮）· 不做产品级新决策（新机械门 / 新机制一律入待裁清单）· 不扩扫 11 条以外（#204 / #205 / #93 不碰）· 不改判据面（需求档一律上抛主 agent）· #185 A/B 类不夹带本批 · #23 不并入微修轮（独立实施轮）· #174 不建常驻仪表。

## ⑥ 上抛项（逐条）

1. `requirements/SESSION.md` §2.3 **F-CR3** 收正（需求笔 = 主 agent · 与 #168 裁定相抵）。
2. #186 实体面缺该节 = **事实修正**（落法由「改写」变「新增」）—— 见待裁清单 1。
3. #174 仪表形态（一次性 vs 常驻）= 待裁 —— 见待裁清单 2。
4. #23 链补（§3 / §4 空）—— 见待裁清单 4。
5. #185：A 类（文档卫生轮）与 B 类（对齐批）排期归父侧；第 21 行（需求层 **8 档**登记表）**需求笔 = 主 agent**；第 17 行 = 另案（父侧派单 · 到期条件 = 第 21 行复核批同批处置）。
6. **未实测项**（本席无 DB / 真机口径）：#175 的「239 行现值」「`_bak` 表确亡」= 未核（实施轮实测清单在册）；#174 全部读数为**文档记载值**（非本席复测）。
7. 台账外发现并入方案：#208② 台账外补项 `thincoder-vscode/src/tools/shell.mjs:118`（三包源码域 `function killProcessTree` 定义共 4＝核单源 1 + 自持副本 3）；#87 的 pending 词 6 处（`:1121/:1283/:1297/:1411/:1795/:1862`——含 `:1283` / `:1795` 补入）。

### 修正轮 1（评审 id=19 · changes-required：🔴2 · 🟡7 · 🔵3）逐条落位 · 2026-09-22 · eng-designer

| 号 | 落位（file:line → 落位内容） |
|---|---|
| 1 🔴 | `docs/core/design/SESSION.md:109`（ACP 释放面 = `session/close` 释放 + 其余调用面零释放）· `:404`（§6.16 不做——删「跨 cwd 释放 / ACP close」两项旧边界）· `:517`（§6.18 ACP 进程退出行 = 「`session/close` 释放 = 会话级」）· `:532`（§6.18 边界同删）；本节 #168 落点清单补列四处 |
| 2 🔴 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:1283`（残余另案 → 已对位现态）· `:1297`（「另案三项」→ 三项均已对位 + 逐项现态）· `:1795`（§6.27.12.12 回指同称谓）；判据改 **F8 语族六处逐点核**（`:1121` / `:1283` / `:1297` / `:1411` / `:1795` / `:1862`——不再用全文「另案 = 0」）；本节 #87 落点 + 验证面 + ④ 表 row 3 同改 |
| 3 🟡 | 本档 ③ 表现量回填：行 3 = 234 · 行 13 = 486 · 行 18 = 338 · 行 24 = 123 · 行 25 = 120；行 15 具名 = `thincoder-vscode/test/session-release-shell.test.mjs`（拟新增——`session-boot.test.mjs` 现量 446，并入即越 500 硬限）+ 越 300 档位口径句（均 ≤500 · 就地改行 / 追加用例 · 结构未变 · 本批不拆） |
| 4 🟡 | `docs/core/design/SESSION.md:636`（§7 标题 → D-SE1–D-SE49）· `:687` D-SE48（释放覆盖面）· `:688` D-SE49（受占可区分信号）· `:729` 变更记录一行 |
| 5 🟡 | 本档 #185 动作分流段：第 9 / 11 / 12 / 16 行 → **A 类**（逐行注动作与依据）· 第 17 行 → **另案（父侧派单）+ 到期条件**（第 21 行复核批同批处置）；⑥ 上抛项 5 同步 |
| 6 🟡 | 本档 #208②：计数收正 **3 处**（具名三档；原「4 处」= 计数笔误）· 判据加三包源码域限定（排除 `.thincoder/tmp/` 探针副本）· ⑥ 上抛项 7 + ③ 表行 18 同步 |
| 7 🟡 | `docs/core/design/ENGINEERING-MODE-V2.md:503` AC12 · `:505` AC14 · `:522` T12（窗口限定 = 仅 VSC · 在飞回合内 · 下一轮 hydrate 收正）· `:381` 边界句回指三行 · `:528` 变更记录一行 |
| 8 🟡 | 本档 #174：`:156` 改「口径 A（真机旁证 / 补证——非主读数）」+ `:157` 定位句 · `:158` 口径 B = 主读数 · `:165` J-1 改探针口径；**尾部修正段已删除**（语义就地折算——零丢失） |
| 10 🔵 | 本档 #171 实施面 `:144`（第二判路载荷 = 保持现值）· `docs/core/design/SESSION.md:297`（前置判据路载荷 = `_slot = null` + 缓存重绑）· `:326`（两路分述） |
| 11 🔵 | 本档 #168① `:114`：ACP 会话记录容器（会话 Map `id → session`——`handlers-slots.mjs:89` / `:108` · `handlers-session.mjs:202`）+ 槽取值 `session.agent._slot`（认领写入同源 `handlers-slots.mjs:96-100`）+ 「先出定位报告再落码」判据 |
| 12 🔵 | 本档 ⑥ 上抛项 5（「7 档」→「8 档」）· §2 状态行收正（4 条待裁已逐条裁定）· #185 清单 as-of 口径句 + 第 7 / 8 行坐标就地回填（`SESSION.md:278-283` / `:317-318`） |
| 补 1–6 | ① `SESSION.md:324-328` 折行 · ② `AGENT-LOOP-SUBAGENT.md:1297` 折行 · ③ `CONTEXT-COMPACTION.md:309-313` 折行（**超派单清单 · 如实披露**）· ④ `ENGINEERING-MODE-V2.md:379-381` 折行 · ⑤ `MEMORY.md:472-474` 悬空锚 → 全限定改指（`thincoder-core/memory/core.mjs:213`——**超派单清单 · 如实披露**）· ⑥ `AGENT-LOOP-SUBAGENT.md:2101` 读数收正（`thincoder-vscode/src/agent/setup.mjs` 现量 421 · as-of 2026-09-22） |

**边界（本轮不做）**：#9（F-CR3 需求档 = 父侧队列，不在本轮）· 机制本体零动（#168 判据 / 释放语义 · #171 语义 · #175 / #186 内容）· 需求档 / 冻结档 / 台账 / 源码零触 · 不扩扫。

**读数（本轮末 · cwd = `thincoder/`）**：`node scripts/doc-check.mjs --root .` = 悬空 **16** / 行宽 **12**（= 基线；本轮 authored **零新增**——改动后读数不高于所动实测基线）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-09-22-pending-triage.md`（§1/§2 全文）· 设计档面 `docs/core/design/{CONTEXT-COMPACTION, SESSION, MEMORY, ENGINEERING-MODE-V2, AGENT-LOOP-SUBAGENT}.md`（全文实读）。**局限**：无项目标准档 / 无文档地图（文档归属维度按 Project Guide + 项目既有约定判）；按指令未读仓内代码档 ⇒ 源码坐标与代码档行数为「未由本席复核」项（仅核设计档内自洽与文档面口径）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（同机制两处不同描述） | 🔴 | #168 收正不完整：新收正句（`SESSION.md:369`「`session/close` 入释放面」·`:373`/`:380` ACP 调用面新增 close 行 ·`:323` ②③）与本档四处活面旧句相抵——`:109`「**ACP 不入释放面**」·`:398`「不做（边界）：跨 cwd 释放（…另案登记）· ACP 会话关闭面释放（…另存待办）」·`:511`「`session/close` 语义 = #168① 另案不动」·`:526`「ACP `session/close`（#168① 另案）· 跨 cwd 认领释放不入本批」；§2 落点清单（`2026-09-22-pending-triage.md:120`）未含这四处 | 把 `SESSION.md:109/:398/:511/:526` 一并收正为现态（与 `:369`/`:380` 同口径），落点表补列这四处；判据 = 认领释放语境下「不入释放面 / 另案」零命中 |
| 2 | Acceptance criteria | 🔴 | #87 判据不可达 + 收正漏点：`:108`/`:296` 定「`AGENT-LOOP-SUBAGENT.md` 内 `未并入项` / `另案` 命中 = 0」，但该档活面 `另案` 命中 ≥16（`:342/:469/:510/:511/:543/:605/:857/:985/:1283/:1286/:1287/:1297/:1793/:2099/:2148/:2212`），多数与 F8 无关；且收正清单漏 `:1283`（「**残余另案 = 端壳取消 / 观察面对位**」）与 `:1793`（「F8 已知面 + 另案三项」）——仍把 F8 残项③ 写成未决，与已收正的 `:1121`「已对位 … 台账 #87 归档」/`:1860` 相抵 | 判据改按 F8 语族 / 逐点核（如 `:1121/:1283/:1297/:1409/:1793/:1860` 六处均为现态陈述且零 pending 词）；收正清单补 `:1283`/`:1793`（含 `:1297`「另案三项」称谓） |
| 3 | Affected-file annotations（criterion 8） | 🟡 | ③ 表对将改动的代码 / 提示词档留空「现量」：`thincoder-core/agent/setup.mjs`（`:262`，`—`；`AGENT-LOOP-SUBAGENT.md:973` 自载 234）· `thincoder-vscode/src/extension/chat-panel.mjs`（`:272`，`—`；本批 `:132` 自引 `:349-364` ⇒ ≥364 行）· `thincoder-vscode/src/tools/shell.mjs`（`:277`，`—`；`#208②` 自引 `:318` ⇒ ≥318 行）· 「VSC 端壳 / 项目切换用例档（就近族）」（`:274`，未具名）· prompts 两档（`:283-284`）；越 300 软线档（另 `panel-messages.mjs` 331→~337 · `acp-contract.test.mjs` 363→~393）无档位 / 拆分立场句 | 逐档回填现量并补「档位 / 拆分立场」句（越 300 档按先例「结构未变 · 本批不拆」或给计划）；VSC 用例档给出文件名 |
| 4 | Document state（声明落点未落盘） | 🟡 | #168 / #171 落点均写「§7 补决策一条」（`:120`/`:146`），但 `SESSION.md:623` 标题仍 `D-SE1–D-SE47`、末行 `:673` = D-SE47，无 D-SE48；该档变更记录 `:712` 亦未提新增决策 ⇒ 静默漏项 | 补 D-SE48（#168 释放覆盖面）/ D-SE49（#171 受占可区分信号），或删该落点句并说明；变更记录一行同步 |
| 5 | Coverage（#185 分流） | 🟡 | `:221` A/B/C 分流未覆盖全部清单行：第 9（类级登记注补句）·11（`MEMORY.md:38` 前提句收正）·12（逐条收正）·16（② 证据句回填）·17（补 ①③ 或转消解）五行有动作却无类别归属 ⇒ 落地无人接 | 五行逐条归 A 类 / B 类或明列「另案 + 到期条件」；第 11 行（`:38` 以已注销的 #125 为据——`SESSION.md:35` 已记注销）建议入 A 类 |
| 6 | Consistency（计数 vs 枚举） | 🟡 | `:243` 写「余自持副本 **4 处**（台账记 3 处——本席实读补出第 4 处）」，正文只枚举 3 处（`bash.mjs:66` · `shared.mjs:93` · `shell.mjs:118`），③ 表亦只列这三档；而 `:306` 判据 = 「`function killProcessTree` 全仓命中 = 1」——第 4 处若在 ⇒ 判据必红，若不在 ⇒ 计数错 | 具名第 4 处（或把计数收正为 3），③ 表与判据同步 |
| 7 | Consistency（#170 边界 vs 验收表） | 🟡 | 新增边界句（`ENGINEERING-MODE-V2:379`：「在飞回合内…当轮表内仍有 `plan`」）与同档 §3.1 的 AC12（`:501` 装配名集不含 `plan`）、AC14（`:503` `planMode` 恒 false（内存 + 槽位））、T12（`:520`）无口径衔接 ⇒ 同一机制出现「窗口例外」与「无条件断言」两种读法 | 在 AC12 / AC14 / T12 就地加窗口限定（仅 VSC · 在飞回合内 · 下一轮 hydrate 收正）或令边界句回指这些判据行 |
| 8 | Doc hygiene（#174 失效表达） | 🟡 | `:156` 仍以「**口径 A（真机主读数）**」为标题，`:322` 修正段却声明「主读数 = 口径 B 分件探针、口径 A 降为旁证」——失效表述留在规范面靠尾段兜（项目既裁：失效表达须删除、不留修订式残留） | 直接把 `:156` 改「旁证 / 补证」并同步 `:157-166` 口径措辞，删尾部修正段 |
| 9 | Coordination（R5） | 🟡 | #168 需求面 F-CR3 收正被 `requirements/SESSION.md` 的 id=18 评审冻结窗阻塞（`:52` 已入父侧队列）⇒ 解冻前需求档与设计档 §6.16 新口径相抵，实施轮若以需求档为准会落错口径 | 保持登记，并在实施轮任务书显式标注「F-CR3 未收正前以设计档 §6.16 口径为准」；解冻后同批收正 |
| 10 | Clarity（受占载荷） | 🔵 | `:143` 写「不钉槽（`_slot` 保持）」，同档 F-CR2 判据句（`SESSION.md:296`）写「不钉槽（`_slot = null`）」——同一措辞两种载荷（前置判据路 / TOCTOU 第二判路） | 两处各自写明路径与载荷（前置路 = `_slot = null` + 缓存重绑；第二判路 = 保持现值 + `_loadSession()`），或统一为一套语义 |
| 11 | Clarity（坐标缺口） | 🔵 | `:114` 把被关闭会话的 (cwd, slot) 取值点留给「实施轮按 ACP 会话记录实读定位（`findSession` 面）」——本批其余落点均给到 file:line | 给出 ACP 会话记录容器与槽取值点（与 `handlers-slots.mjs` 认领写入同源），或明写「实施轮先出定位报告再落码」的判据 |
| 12 | Numeric drift（R7c） | 🔵 | 同批内计数口径小差：`:318`「需求层 **7 档**」vs `:215` 列 8 档；`:60` 状态行仍「待裁 4 条」而 `:47-53` 已逐条裁定；#185 在仓档坐标为 1–2 行 as-of 漂移（`SESSION.md:315-316` 现 = `:317`；`:276-283` 现 = `:278-283`） | 计数 / 状态行随裁定收正；坐标加 as-of 口径或就地回填 |

**计数**：发现 12 条 —— 🔴 2 · 🟡 7 · 🔵 3。
**其余维度核验（通过面）**：#56 认账句在位（`CONTEXT-COMPACTION.md:310` + 变更记录 `:728`）· #87 两见证坐标在位（`AGENT-LOOP-SUBAGENT.md:1121`）· #170 边界句 + 变更记录在位（`ENGINEERING-MODE-V2.md:379`/`:526`）· #175 §6.13 + 变更记录在位（`MEMORY.md:470-478`/`:547`）· #185 逐项二态清单 21 行 + 异状 7 项在档、`CONTEXT-COMPACTION.md:589` 等坐标实读相符 · #186 事实修正与落点（运行面 + 中文镜像 + 节位待父侧）在档、内容权归属与角色矩阵一致 · #208① 登记 / #23 设计零改 + 链补（§3 覆盖 §6.26 → §4 → 独立实施轮）与 §6.26 用例 / 判据 / 受影响表内部一致 · 范围纪律（不夹带 #185 A/B 类、不碰 #204/#205/#93）成立；11/11 条目均有方案与验证面。
**VERDICT: changes-required**（2 🔴 —— 见发现 1 / 2；两 🔴 均属「同一机制两处不同描述 / 判据不可达」类，须先处置方可放行。）

### 轮次 2（评审子代理）

**评审对象（轮 2 = 核验修正轮 1）**：`docs/batches/2026-09-22-pending-triage.md`（§1/§2 全文含 `### 修正轮 1` 块）· 五档设计档受影响区实读（`CONTEXT-COMPACTION` / `SESSION` / `MEMORY` / `ENGINEERING-MODE-V2` / `AGENT-LOOP-SUBAGENT`）。**局限**：承轮 1（未读仓内代码档 ⇒ 源码坐标 / 代码档行数为「未由本席复核」项）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/core/design/SESSION.md` | ✅ Fixed | 四处旧句实读已收正——`:109`「**ACP 释放面（2026-09-22 · 台账 #168①）**：`session/close` ⇒ 释放该会话槽…其余可核调用面（`newSession` 四点 / `switchToSlot` / `claimSlot`——逐条实读零释放）= §6.16 表。」· `:404`（不做——旧两项「跨 cwd 释放 / ACP 会话关闭面释放」已删）· `:517`「`session/close` 释放 = **会话级**（入 §6.16 调用面表——非本退出释放面）」· `:532`「本释放面域 = **退出 cwd 单 manifest**（会话级 close 与跨 cwd 释放住 §6.15 / §6.16）」 |
| 2 | 2 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | ✅ Fixed | 六处 F8 逐点均为现态陈述：`:1121`（「端壳取消 / 观察面对位 = **已对位**…台账 #87 归档」）· `:1283`（「**端壳取消 / 观察面对位已对位**…F8 残项③ 已消解 · 台账 #87 归档」）· `:1297`（三项「**均已对位**」）· `:1411`（边界 6 = 已对位）· `:1795`（回指 = 均已对位）· `:1862`（台账 #87 关系 = 已对位）；判据口径已收窄（`:108`「**命中面限定于该六处**（该档活面 `另案` 另有 ≥14 处与 F8 无关的正当用法——全文统计口径不适用）」） |
| 3 | 2 残（新） | `docs/batches/2026-09-22-pending-triage.md` | 🟡 | New：判据 / 锚坐标滞后（修正轮折行后未回填，两实例）——`:108` / `:298` / `:322` 仍写 `:1409` / `:1793` / `:1860`，而现态陈述实位 = `:1411` / `:1795` / `:1862`（同档 `:329` 修正轮行自载正确值，自相矛盾）；`:297`（④ 表 row 2）锚写 `CONTEXT-COMPACTION.md:310`，收正句实位 = `:312`。按字面执行将误红；正确值同档可核 ⇒ 不阻塞放行，建议验收执行前回填 |
| 4 | 3 | `docs/batches/2026-09-22-pending-triage.md` | ✅ Fixed | ③ 表现量回填：行 3 = 234 · 行 13 = 486 · 行 18 = 338 · 行 24 = 123 · 行 25 = 120；行 15 具名 `session-release-shell.test.mjs`（附「`session-boot.test.mjs` 现量 446——并入即越 500 硬限 ⇒ 另立新档」之由）；`:290` 越 300 档位口径句在档（均 ≤500 · 结构未变 · 本批不拆） |
| 5 | 4 | `docs/core/design/SESSION.md` | ✅ Fixed | `:636` 标题 = D-SE1–D-SE49 · `:687` D-SE48 · `:688` D-SE49 · `:727`/`:730` 变更记录行 |
| 6 | 5 | `docs/batches/2026-09-22-pending-triage.md` | ✅ Fixed | `:222` 第 9 / 11 / 12 / 16 行入 A 类（逐行注动作与依据）· 第 17 行入**另案（父侧派单 · 带到期条件）**；⑥ 上抛 5 同步 |
| 7 | 6 | `docs/batches/2026-09-22-pending-triage.md` | ✅ Fixed | `:244` 计数收正 = **3 处**（「本席原记 4 处 = 计数笔误，此处收正」）· `:246` 判据加三包源码域限定（排除 `.thoderc` 探针副本口径：`.thincoder/tmp/`）· 上抛 7 同口径 |
| 8 | 7 | `docs/core/design/ENGINEERING-MODE-V2.md` | ✅ Fixed | AC12 `:503` · AC14 `:505` · T12 `:522` 就地加窗口限定（仅 VSC · 在飞回合内 · 下一轮 hydrate 收正）· 边界句 `:381` 回指三行 · `:528` 变更记录 |
| 9 | 8 | `docs/batches/2026-09-22-pending-triage.md` | ✅ Fixed | `:156`「**口径 A（真机旁证 / 补证——非主读数）**」· `:158`「**口径 B（无头分段主读数）**」· 尾部修正段已删（语义就地折算） |
| 10 | 9 | `docs/core/requirements/SESSION.md` | 🟡 | Open（协调项，非缺陷）：F-CR3 收正受 id=18 冻结窗阻塞——已登记（§1 `:52` + §6 上抛 1）；修正块边界句明示「#9（F-CR3 需求档 = 父侧队列，不在本轮）」 |
| 11 | 10 | `docs/core/design/SESSION.md` | ✅ Fixed | `:297`「不钉槽（`_slot = null`——**前置判据路载荷**）」· `:326`「**第二判路载荷 = 保持现值**，与前置判据路（`_slot = null` + 缓存重绑）分述」；批档 `:144` 同述 |
| 12 | 11 | `docs/batches/2026-09-22-pending-triage.md` | ✅ Fixed | `:114` 补 ACP 会话记录容器（会话 Map `id → session`——`handlers-slots.mjs:89` / `:108` · `handlers-session.mjs:202`）+ 槽取值 `session.agent._slot` + 「实施轮先出定位报告再落码」判据 |
| 13 | 12 | `docs/batches/2026-09-22-pending-triage.md` | ✅ Fixed | ⑥ 上抛 5 = 需求层 **8 档** · `:60` 状态行收正（4 条待裁已逐条裁定 · 11 条发现逐条处置）· `:192` as-of 口径句 · 第 7 / 8 行坐标回填（`:318` 实读在位） |

**计数**：🔴 0 · 🟡 2（1 新收正残留 · 1 协调项）· 🔵 0。**附**：修正轮自陈的「超派单清单」两项（`CONTEXT-COMPACTION.md:309-313` 折行 · `MEMORY.md:472-474` 全限定改指）已如实披露且实读在位。
**VERDICT: pass**（0 🔴——轮 1 两 🔴 实质已解；🟡 两项为「报出即过」项。）

## §4 用户批准（主 agent）

**批准（代签 · 2026-09-22 · 主 agent）**

- **授权依据** = 用户 2026-09-22 09:29「都自动跑吧」（四批 = 点火 + 代签 + 派发 + 收口全自动）；**自缚三项齐备**：① 评审 pass ✅（轮 2 · 0🔴 / 2🟡 / 0🔵）② 修正落地核验 ✅（轮 1 十二项 = 评审复核 + **父侧独立实读**：`SESSION.md:404`/`:517`/`:532` 旧句确删 · `AGENT-LOOP-SUBAGENT.md:1411`/`:1795`/`:1862` 现态在位 · `CONTEXT-COMPACTION.md:312` 认账句在盘——宿主机检引文警（unverified）经复核 = 引文格式伪警，实质全数落位）③ token 已签发 ✅。
- **父侧巡检修正（父侧直接执行 · 机械回填 · 可 revert）**：评审轮 2 🟡 两实例就地回填——#87 判据六处坐标 `:1409/:1793/:1860` → `:1411/:1795/:1862`（本档 `:106`/`:108`/`:298`/`:322`）；#56 锚 `CONTEXT-COMPACTION.md:310` → `:312`（`:94`/`:297`）。
- **#186 内容裁决（提示词内容权 = 主 agent）**：① 节位 = **文档纪律域内**（承设计建议）；② 加**一条结构性锚** = 新节标题行（运行面 + 中文镜像各一；机检形 · 禁散文锚——承 `docs/core/design/TESTING.md` §5）⇒ **表外必改一档** `thincoder-vscode/test/prompts-mirror-anchors.test.mjs`（锚表同步；实施轮如实披露）；③ 文本 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §6.1 六条逐字（第 2 条末句 + 第 6 条为核心；第 4 条按适用性保留）。
- **实施域** = §2 ③ 表行 1–18（#23 核面 · #168①–③ · #171 · #208②）+ 行 24/25（#186 两档）+ 表外一档（上）；收口后台账 #23 / #56 / #87 / #168 / #170 / #171 / #174 / #175 / #186 / #208 逐项处置。

## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 0🔴 · 代码评审 round1 1🔴→round2 pass（收敛 clean）· 三包 558/800/938 全绿）



**轮次**：initial（承 §2 修正轮 1 + §4 批准块；实施域 = §2 ③ 表行 1–18 + 行 24/25 + 表外一档）。坐标 = 2026-09-22 实读。

### ① #23 · 子代理系统固块（A23-1–A23-6 全达）

| 落位 | file:line（实施后） | 读数 |
|---|---|---|
| 审计块外提（`summarizeEngTaskBook` + `buildAuditBlock` 纯函数） | `thincoder-core/agent-tools/audit-block.mjs:1-106`（**新档**） | 106 行（设计估 ~95） |
| spawn 档只收集 + 固块单点绑定 | `thincoder-core/agent-tools/subagent-spawn.mjs:33-35`（import）· `:341-369`（`spawnBlocks` 收集）· `:372`（`_spawnSystemBlock` 绑定） | 406 行（479 → 406；设计估 ~400） |
| `prepareRun` 拼接（槽位装配之后、项目指令之前） | `thincoder-core/agent/setup.mjs:214-220` | 240 行（+6——设计估 +3：注释 5 行 + 代码 1 行） |
| 新测档 U1–U7（含先红四项） | `thincoder-core/test/spawn-system-block.test.mjs` | 242 行（设计估 ~120——7 例含夹具与注释） |

- **文本零改机检（D23-4）**：以 HEAD 版 `subagent-spawn.mjs` 的模板表达式 λ 求值 vs `buildAuditBlock(ctx)` — 两夹具（touched 2 条 / 空 touched + `_engTaskInput=null`）均 **byte-identical: true**（块长 2730 / 2598）。
- **先红 → 绿（设计 U 表四项，实测）**：新测档对**改前快照**（`.thincoder/tmp/core-pkg/package/` = 479 行版）实跑 = **U1/U2/U3/U7 4 红** ∧ U4/U5/U6 3 绿；对本仓改后实跑 = **7/7 绿**。
- **既有断言改指固块字段（防改后空转）**：`thincoder-cli/test/batch-doc-gate.test.mjs:99-101/:117-121/:132-136/:147-152/:190-192`（固块含行 ∧ `input` 反转「不含」 ∧ `_engTaskInput === input`）；`thincoder-cli/test/eng-designer-role.test.mjs:161-172/:203-212`（负控补 `_spawnSystemBlock === undefined`）；`thincoder-vscode/test/eng-designer-role.test.mjs:168`（T57c 负控同补）；`thincoder-vscode/test/subagent-audit-summary.test.mjs:30-58`（A2 读取面由 `input` 改指 `child._spawnSystemBlock` + 前置断言 `input` 只留任务书）。
- **边界 4 实施轮复核项**：全仓扫 `_spawnSystemBlock` = **仅核面**（setup.mjs / audit-block.mjs / subagent-spawn.mjs + 四测档）⇒ **端侧无第二条子代理装配路径携带该字段**，无需补行。
- A23-5：§6.26 分类裁定表 **14 行**逐行有裁定（实读计数 = 14）。A23-6：doc-check 零新增（见「验证读数」）。

### ② #168① · ACP `session/close` 释放（含定位报告）

- **定位报告（先出后落码——设计 §2 判据）**：会话记录容器 = `ctx.sessions`（`Map<id, session>` — `thincoder-cli/src/acp.mjs:98` 单容器，经单一 ctx 传四 handler 族）；槽取值 = `session.agent._slot`（认领写入同源 = `handlers-slots.mjs:96-100`（load）· `:151-155`（resume）· `handlers-session.mjs:152`（new — 经核 `newSession`）· `:106`/`:159`/`:190`（fork / 重钉））；`session/close` 定位 = `findSession`（`handlers-session.mjs:110-114`）；**保留集数据集 = 删被关闭者之后的 `sessions.values().map(agent._slot)`**（同 cwd — ACP 单 cwd 模型）。
- 落位：`thincoder-cli/src/acp/handlers-session.mjs:116-131`（`releaseClosedSessionSlot`）· `:221-227`（close 体内「先出容器再释放」）· import 面 `:16-20`（`loadManifest` / `saveManifest` 自核 `session.mjs`；`staleClaims` 直引 `session-slots-manifest.mjs` — core `session.mjs` 未 re-export 该名，先例 = VSC 端壳退出释放）。
- 落盘判据三条 = 核 `saveManifest` `opts.release` 自动继承（fresh 同次快照 / 值条件删除 / 内存认领表移除）；**无残留认领 ⇒ 零写早退**（`staleClaims` 判据单源，同核 `releaseClaimsAll` 早退形）——读法见偏离披露 D2。
- 用例：`thincoder-cli/test/acp-contract.test.mjs:194-252`（T-CR-ACP1 关闭 ⇒ 该槽认领条删 ∧ 同 cwd 其余在存会话槽保留 ∧ 逐个关闭 ⇒ 零残留；T-CR-ACP2 未知会话静默 `{}` ∧ 盘面逐字节零动 + 对照落盘）— 该档 461 行。

### ③ #168②③ + #171 · VSC 释放面与受占信号

- **#168②**（跨 cwd 释放）：落点实读 = `thincoder-vscode/src/extension/panel-project.mjs:38-53`（`applyProjectSwitch` —— **非**设计表列的 `panel-messages.mjs:77-89` / `chat-panel.mjs:96-104`：那两处坐标随分档漂移，现态切换体住 panel-project.mjs）；`oldCwd` 先记 → `setProjectFolder` 成功后 `releaseClaimsAll(oldCwd)`（核薄函数：无 manifest / 无本进程认领 ⇒ 零写早退；永不抛出）。
- **#168③**（端壳机判）：新档 `thincoder-vscode/test/session-release-shell.test.mjs`（138 行）T1/T2 = 未占落点 release 传参在效（残留认领释放；保留集 = {落点槽}）；T3 = 被占分支零释放零写 + 可区分信号；T4 = 项目切换 ⇒ 旧 cwd 认领释放（真 `applyProjectSwitch` 驱动）。
- **#171**（受占信号）：`thincoder-vscode/src/extension/session-io.mjs:166-175`（`SLOT_OCCUPIED` 冻结信号常量）+ `:193`（被占分支返回信号 — 替原「返回 data，与成功不可区分」）；面板第二判 = `thincoder-vscode/src/extension/panel-messages-session.mjs:61-69`（**保持 `_slot` 现值** + 提示 + `_loadSession()` 重绑本端原槽）。面板级用例 = `thincoder-vscode/test/session-boot.test.mjs` 组 ⑰（TOCTOU 窗：两判探测序反相 — 前置判空闲 / 函数内撞占；断言 `_slot` 保持 1 ∧ 共享指针 / 认领集 / 标记 / 缓存四不动 ∧ 提示恰一次）— 该档 490 行。

### ④ #208② · 树杀单源收口

- `thincoder-core/tools/bash.mjs`：删本地副本 → `import { killProcessTree } from "./process-tree.mjs"`（265 行；−12）。
- `thincoder-vscode/src/tools/shared.mjs`：删本地副本 → 核单源 import + `export { killProcessTree }`（195 行；−9；导出面零改）。
- `thincoder-vscode/src/tools/shell.mjs`：删本地副本 → 核单源 import（329 行；−9）。
- 判据①：三包源码域（排除 `.thincoder/tmp/`）`function killProcessTree` 定义命中 = **1**（`thincoder-core/tools/process-tree.mjs:13`）✓。
- 机制读数（**偏离披露 D1**）：设计写「动态 import」，实现用**静态 import**。

### ⑤ #186 · 提示词「多实现面纪律」节

- 运行面 `thincoder-core/prompts/discipline-engineering.md`：`## Doc discipline` 域内、`### Docs & ledger repo-self-contained` 之后、`### Rules & exceptions` 之前新增 `### Multi-implementation-face discipline`（+15 行 → 138 行）；6 条与 §6.1 语义同源（英文面）。
- 中文审核面 `docs/core/design/prompts/discipline-engineering.md`：同位置新增 `### 多实现面纪律`（+11 行 → 131 行）；6 条 = `LEDGER-SELF-CONTAINED.md:203-208` **逐字**。
- 零维护者注：两面新节无日期 / 批号 / 评审号（机检断言落在锚测 ⑦）；提示词面禁带文档引用（J1/J2/J3）实跑绿。
- 表外一档（§4 裁决）：`thincoder-vscode/test/prompts-mirror-anchors.test.mjs:87-110` 新增测试 ⑦ = 结构锚（两面节标题逐字 + 首条 / 末条逐字 + 零维护者注切片扫）— 机检形、禁散文锚。

### 验证读数（本轮末）

| 项 | 命令 | 读数 |
|---|---|---|
| 核包 | `cd thincoder-core && npm test` | **558 / 558 绿**（26.4 s） |
| CLI 包 | `cd thincoder-cli && npm test` | **798 / 798 绿**（42.2 s） |
| VSC 包 | `cd thincoder-vscode && npm test` | **936 / 936 绿**（50.7 s） |
| 引擎下限守卫 | `cd thincoder-vscode && node --test test/engine-floor-guard.test.mjs` | 6/6 绿（W8 契约②：端壳静态链零 `node:sqlite`） |
| 锚测 | `cd thincoder-vscode && node --test test/prompts-mirror-anchors.test.mjs` | 5/5 绿（含新 ⑦） |
| 提示词面文档引用锁 | `cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs` | 9/9 绿 |
| 核提示词面结构 | `cd thincoder-core && node --test test/core-prompt-face.test.mjs` | 5/5 绿 |
| #56 零码改 | `git diff --stat -- thincoder-core/{config,context,agent,auto-think}.mjs` | **空串**（零码改）· 设计档 `:312` 认账句在位 |
| #87 六处逐点核 | 实读 `AGENT-LOOP-SUBAGENT.md:1121/:1283/:1297/:1411/:1795/:1862` | 各点 pending 词 = 0 ∧ 现态陈述在位；两见证坐标（`executeCancelAction` / `vscSubagentFace`）在位 |
| #170 边界句 | 实读 `ENGINEERING-MODE-V2.md:379` | 在位 |
| doc-check | `node scripts/doc-check.mjs --root .` | 开工基线 = **悬空 16 / 行宽 12**；本轮末 = **悬空 4 / 行宽 4** ⇒ 本批触碰档**零新增**（读数下降 = 他批同期修） |

**#175 库面读数（实施轮实测留档 — `~/.thincoder/memory.db`，只读连接）**：库 1.67 GB；三表 origin 列齐备；`code_chunks` 85236 行（origin 分布：`D:/teamcode` 83920 · `D:/teamcode/thincoder` 805 · `thincoder-cli` 286 · `thincoder-vscode` 206 · `D:/dgx-spark` 15 · **`D:\dgx-spark` 4 = 非归一变体**）；`doc_chunks` 71606 行（含 **`D:\teamcode` 109 · `D:\dgx-spark` 126 = 非归一变体**）；`files` 8 行（layer=project · origin=`D:/teamcode/.thincoder/memory`）；**`_bak` 表零命中**（信号面确亡）；`PRAGMA quick_check(5)` = **ok**（14.3 s）。⇒ 信号 A 的活体目标实测存在（非归一变体 3 组），sweep 判据非空转。

### 偏离披露（逐条）

- **D1 · #208② 机制读数（设计写「动态 import」→ 实现用静态 import）**：两处消费点均为**同步**回调（`shell.mjs` `onAbort` / `shared.mjs` `killTree`）——动态 import 无法在同步面保「零新增语义」（kill 延后到 import 兑现后；`import().then(kill)` 形态在未兑现窗内**静默空转**，是实回归）。`process-tree.mjs` 静态闭包仅 `node:child_process`（设计档原注即载此事实），且已由核 `tools/execute.mjs` 在**同一条端侧静态链**上引入 ⇒ engine-floor 守卫契约②判据不受影响 — 已实跑绿。AC#208② 三条全达（定义命中 1 / 三包绿 / 守卫绿）。
- **D2 · #168①「零新增写盘次数」读法**：`session/close` 原无写盘调用 ⇒ 本轮新增一处 `saveManifest`（**非新写盘机制** — `opts.release` 既有单源）；本进程无残留认领 ⇒ **零写早退**（同核 `releaseClaimsAll` 早退形）。读法如有异，归父侧裁。
- **D3 · 表外改动三处**：① `thincoder-vscode/src/extension/panel-project.mjs`（+11 — #168② 真实落点；设计表列的 `panel-messages.mjs:77-89` / `chat-panel.mjs:96-104` 坐标随分档漂移，**该两档本轮零改**）；② `thincoder-vscode/test/files.mjs`（+2 — 新测档 `session-release-shell.test.mjs` 入册；未登记 = fail-closed runner 永不执行）；③ `thincoder-vscode/test/prompts-mirror-anchors.test.mjs`（+33 — §4 裁决授权）。
- **D4 · 行数读数超估（无结构性影响）**：`spawn-system-block.test.mjs` 242（估 ~120）· `session-release-shell.test.mjs` 138（估 ~60）· `setup.mjs` +6（估 +3）· `handlers-session.mjs` 281（估 258+8=266）。**越 300 档**：`acp-contract.test.mjs` **461**（≤500 硬限；设计估 363→393 — 其余增量为他批同期写入）· `session-boot.test.mjs` **490**（≤500 硬限，**余量 10 行** — 下一批触及前须拆分；本轮就地追加 ⑰ 一例）。均「结构未变 · 本批不拆」。
- **D5 · 开工基线含他流在途红（已自行消解）**：开工时 VSC 包 1 红（`workspace-guard.test.mjs` → `thincoder-core/memory/fts-text.mjs` 缺）+ CLI 包中途 3 红（`session-store.test.mjs` T-RS8/8b/10 — `[object Promise]` JSON 解析）— 均属**他批在途写入**（session-index 批：未跟踪新档 + `read-history.mjs` / `memory/*` 改动）；本轮末两包已全绿。本轮触碰档与该红面无交集。

### 未决上抛

1. **D1 机制读数**是否回写设计档措辞 → 设计档 = eng-designer 写域（本席未改）。
2. **D2 零写早退读法**裁定。
3. `session-boot.test.mjs` **490 行（余量 10）** 拆分登记 → 归父侧派单。
4. **#174 实测**（独立测量轮 · 需真机 VS Code）与本批实施域无交集 — 本席未执行（设计 §2 明载「本批只出方案 + 判据」）。
5. **#185 / #175 sweep 本体 / #170 用例**：均为他轮或设计面（A/B 类归文档卫生轮；sweep 回收形态与命令面归后续实施轮；#170 明载零新用例）— 本批零夹带。

### 审计与代码评审轮次

（本轮审计 + 代码评审落地后追加于此）

### 审计与代码评审轮次（含 fix round）

**① 内部审计（explore 子代理 · 只读偏离审计）**：VERDICT = **deviations（0 🔴 · 2 🟡 · 4 🔵）**。四类偏离判定：**无 PARTIAL**（A23-1–A23-6 / #168①–③ / #171 / #186 / #208② 逐条有落地证据）；**无未披露的实质偏离**（核出两条未披露项均为 🔵）；两条 🟡 = ① `panel-project.mjs` 超清单落地（= 本席 D3① 已披露）② `SESSION.md:374`「零新增写盘次数」字面与 close 落点相抵（= 本席 D2 已披露，待父裁）；🔵 = `files.mjs` 入册（D3②）· 临时脚手架零残留 · #168② 复核条件分支未机械化 · #208② 静态 vs 动态（D1，审计独立复核理由成立）。审计独立复读面（全数在位）：`input` 单点 / 固块单点绑定 / 拼接位 / 块文本逐字 / 压缩不变量 / 先红与负控 / ACP 保留集与值条件 / 受占第二判载荷 / 两提示词档逐字与零维护者注 / 定义命中 = 1 / 禁止面零触碰。**审计局限**：审计席无 shell / git ⇒ 三包读数采信本席。

**② 内部代码评审（advisor · type=code · round 1 全量）**：VERDICT = **changes-required（1 🔴 · 2 🟡 · 2 🔵）**。

| 号 | 级别 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🔴 | **#168② 覆盖不全**：释放只接在显式切换器 `applyProjectSwitch`；**跟随活动编辑器的自动项目切换**（`chat-panel.mjs:88-93`）与**工作区兜底回落**（`:127-133`）仍换 cwd 零释放 ⇒ 原缺陷（旧 cwd 认领残留至进程退出）在真实可达路径上原样存在；§5 D3「坐标漂移」理由对 `chat-panel.mjs` 不成立（切换体仍在档内）；批档 ③ 表行 13 成空转 | **fix round 1 已修**：新增释放单点 `panel-project.mjs:30-38`（`releaseOldCwdClaims(oldCwd)` —— 同 cwd no-op；核 `releaseClaimsAll` 薄转口）；**三落点共用**（显式切换器 `:53` · follow 支 `chat-panel.mjs:91` · 兜底支 `chat-panel.mjs:137`）；用例 = `session-release-shell.test.mjs` **T5**（真 `ChatPanel` 构造 + 真 follow 监听器驱动：旧 cwd 认领删除 ∧ 新 cwd 重绑）+ **T6**（单点行为：同 cwd no-op / 异 cwd 释放 / 当前 cwd 不误放） |
| 2 | 🟡 | §6.16「假定 + 复核条件」未实现亦未披露（无条件 `releaseClaimsAll(oldCwd)`；多面板仅注释归另案） | **已补披露**（D6）；**不实现**——单绑定假定今日成立 + 复核条件机械化需新增面板注册表（新机制，非本批）⇒ 登记到期条件 |
| 3 | 🟡 | 行数超 300 软线三档（`acp-contract.test.mjs` 461 · `session-boot.test.mjs` 490 · `shell.mjs` 329）——批档已裁「结构未变 · 本批不拆」 | 零动作（登记更新：`chat-panel.mjs` 随 fix 轮 486 → **492**，余量 8） |
| 4 | 🔵 | T4 缺 §4 行 5 判据后半「他端活认领不动」机检 | **已补**：T4 fixture 加他端属主条目（`slotSessions[9]`）并断言切换后逐字零动 |
| 5 | 🔵 | `session/close` 新增 `saveManifest` 与「零新增写盘次数」字面读法（= 本席 D2） | 归父裁（R5 协调项）——机制面零新增（既有 `opts.release` 单源），D2 已如实披露 |

**③ fix round 1（自查 + 复跑）**：除上表 #1 / #4 两项外，另修一处 **flake** —— `spawn-system-block.test.mjs` 的 `afterEach` 直删 tmp 目录在 Windows 偶发 EPERM（depth-0 装配链句柄释放滞后）⇒ 改短重试兜底（同 `setup-reminders.test.mjs` / CLI `eng-designer-role.test.mjs` 先例）。**fix 轮终态**：三包复跑 = 核 **558/558** · CLI **800/800** · VSC **938/938** 全绿（VSC 增 2 例 = T5/T6）；审计 0 🔴 / 评审 1 🔴 已闭，无其它待修项。

### 偏离披露（续）

- **D6 · #168② 复核条件（评审 🟡#2 处置）**：三落点的释放恒取**保留集 = 空**，§6.16:376「假定 + 复核条件」中的**复核条件分支未机械化**（同 cwd 多活绑定 ⇒ 按活绑定全集算保留集）——现状仅以注释登记「本进程多面板（另案）」。依据：VSC 端壳单绑定假定今日成立（`WebviewViewProvider` 单实例视图）；他端进程认领由核值条件删除（`staleClaims` owner 判据）天然保护；机械化需新增面板注册表（= 新机制，非本批范围）。**到期条件** = 同 cwd 出现本进程多面板 / 多窗口绑定（假定失效）⇒ 该落点改为按活绑定全集算保留集或停释放。
- **D7 · 表外改动（fix 轮追加）**：`thincoder-vscode/src/extension/chat-panel.mjs`（+6 —— 评审 🔴#1 的 follow / 兜底两落点接线；同属 #168② 覆盖面，设计表行 13 原名该档）。

**读数更新（fix 轮后）**：`chat-panel.mjs` **492**（486 → 492；≤500 硬限，余量 8）· `panel-project.mjs` **118**（109 → 118）· `session-release-shell.test.mjs` **222**（138 → 222）· `spawn-system-block.test.mjs` **249** · `audit-block.mjs` 106 · `subagent-spawn.mjs` 406 · `setup.mjs` 240 · `handlers-session.mjs` 281。

**④ 内部代码评审 round 2（fix 校验 · advisor type=code）**：VERDICT = **pass**。fix round 1 的声明 ①–⑤ 逐条在现态找到落地证据：

- **声明①**（释放单点 + 三落点共用）：`panel-project.mjs:35-38`（`export function releaseOldCwdClaims(oldCwd)` —— 同 cwd no-op / `releaseClaimsAll` 薄转口）· 显式切换器 `:59` · follow 支 `chat-panel.mjs:96` · 兜底支 `chat-panel.mjs:138`；全仓调用点 = 3（+ 测试）⇒ **无重复 / 漂移释放点**；核契约支撑（`session-slots-manifest.mjs:301-309` 永不抛 + 零写早退；`:118` 值条件删除 owner 判据）⇒ 他端认领天然不动。
- **声明②**（T5 真监听器驱动 + T6 单点行为）：在位且非空转（`session-release-shell.test.mjs:181-190` 真 `ChatPanel` 构造 + `editors.length === 1` 注册断言 + 旧 cwd 释放 ∧ 新 cwd 重绑；`:204-222` T6 三态）。
- **声明③**（T4 他端断言）：`:127` 他端属主条目 seed + `:137` 逐字零动断言在位。
- **声明④**（EPERM 重试兜底）：`:48-53` 有界（≤11 次）+ `afterEach` async —— 无死循环。
- **声明⑤**（D6 披露）：批档 `:508` 三要素齐（假定依据 / 未机械化理由 / 到期条件）。
- 评审席新增扫描：fix 未引入崩溃 / 丢数据 / 逻辑错误；`chat-panel.mjs:110-121`（工作区**转空**支路未接释放）被列为**对象面外观察项（零严重级）**——归父侧 / 设计侧裁定，不影响本轮判定。
- **评审局限**：静态实读 + 批档对读；三包读数（558 / 800 / 938）采信本席实跑（评审席未自跑运行面）。

**终态**：审计 0 🔴（2 🟡 / 4 🔵 全为已披露项或零动作登记）· 代码评审 round 1 = 1 🔴（round 2 已闭）· round 2 = **pass** ⇒ **收敛（clean）**，无可修项。未闭项仅剩：设计档措辞收正（父侧 / eng-designer 写域）· D2 读法裁定 · 表外 / 行数余量登记 · `chat-panel.mjs` 转空支路（对象面外观察项）。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent · 2026-09-22）**

**核验**：① 抽核落点实读——`thincoder-vscode/src/extension/session-io.mjs:171` `export const SLOT_OCCUPIED = Object.freeze({ occupied: true })` + `:193` 受占分支「零写 + 可区分信号」✓；`thincoder-core/agent-tools/audit-block.mjs`（新档）· `subagent-spawn.mjs` 479→406 ✓；§5 状态行「实施完成（审计 0🔴 · 代码评审 r1 1🔴→r2 pass · 三包 558/800/938 全绿）」在位 ✓。② 套件 / 靶向档 / 先红证据 / 块文本 byte-identical 读数 = 采信交付报告实跑（子代理内部协议已审——父侧不重复审）。③ `doc-check` = 悬空 16 → **4** · 行宽 12 → **2**（本批触碰档零新增）。

**裁定（逐条）**：D1 静态 import = **已接受 + §2 措辞已回写**（`:244`）；D2「零新增写盘」读法 = **接受**（`saveManifest` 一处沿既有 `opts.release` 单源；无残留 ⇒ 零写早退）；D3/D7 表外四档 = **接受**（真实落点漂移 + §4 授权 + fail-closed 入册）；D4 贴线两档（`chat-panel.mjs` 492 / `session-boot.test.mjs` 490）= **已登记**（`docs/vsc/design/VSC-DEBT.md` §12.1 追加两行 + 触发条件）；D5 基线含他流在途红 = 记录接受（与本批面零交集）；D6 `#168②` 复核条件未机械化 = 知悉（到期条件在册：同 cwd 多面板/多窗口绑定 ⇒ 改算活绑定全集或停释放）。上抛 1/2 = 已办；上抛 3（`#174` 实测轮）= **不派**（设计明载独立轮 · 台账 #174 在册）；上抛 4（`chat-panel.mjs:110-121` 工作区**转空**支路）= **入册**（台账 · 归批 · 同族对照 #168②）；上抛 5（`.thincoder/tmp/core-pkg/`）= 保留（先红证据载体 · gitignore）。

**收口同步**：状态行 = **收口待提交**（提交随四批联合收口——工作树含跨批共享文档，路径限提交统一执行）；台账销项随联合收口；design 槽随联合收口消费。
