# 2026-09-29 · parity-b1-vsc-core
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户全修令（2026-09-29 04:25）+ parity-closeout §2 归批表 B1（VSC 收口核·大件）——annex :33 :37 :43 :44 :114 :117 + 反①–④。
> 台账 = #565（vsc ∕ core · 归批）。前情 = `docs/batches/2026-09-29-parity-closeout.md` §2 归批表 **B1**（全修令下）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:3x）
- **来源**：用户**全修令**（04:25「为啥不都修啊？」⇒ 全修；04:26 真端差重审令）+ `docs/batches/2026-09-29-parity-closeout.md` §2 归批表 **B1**。
- **射程**：annex `:33 :37 :43 :44 :114 :117` + 反①–④（VSC 五件自持副本收编）。
- **口径**：**形不乱动**（核件 carrier 注入已兼容 VSC 形——VSC 侧改接）；VSC 行为零变；前置 = vsc↔core 逐档对位勘察。
- **台账**：#565。

### 1.3 实施期裁定（父侧 · 2026-09-29 05:1x）

- **P4-I 家族工具装饰缝**（实施轮 #89 发现的设计缺口——家族段「装配取核」未携端壳装饰面）：裁定 **取 ①**——核 `thincoder-core/agent/setup.mjs` 的 `prepareRun` 增 `opts.toolDecorate` 透传（`assembleFamilyTools({ decorate })`；缺省零变）；② 改共享状态（脆）与 ③ 留三项用户可见差（违零变前提）均否。
- **连带**：端侧 decorator 体自带 role 面（取核拷贝；差额按 §2.5 登记）。
- 该点差额（§2.5 A ∕ B 清单之外的核 ≈2–4 行）由 §5 披露、§6 收口对账。

### 1.4 P5 增补（父侧 · 2026-09-29 05:1x）

- **陈旧消费注收正**（#87 P1 交付射程外注记 2）：`thincoder-vscode/src/agent/setup-tooltable.mjs:35-36`「本端 loader 形态 = 同步实现（…与核同构语义）」——P1 转口后**失实**（纯转口）⇒ **P5（#93）同笔收正**（一行注释；不新写语义）。
- 另：批级对拍归档件（`docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs`）= P5 落位（#87 按 tmp 先行；父侧 copy 收位——沿 #545 先例）。

### 1.5 实施期裁定（父侧 · 2026-09-29 05:2x · P3 波 #91 发现）

- **① C 缝形**：设计「`pushInput` + `ctx.takeInput(queue)`」发现第三消费面（步边界 pickup ∕ 容量守卫 ∕ 快照 ∕ CLI 渲染皆读宿主既有数组）⇒ 双队列失配风险。裁定 = **增可选 `ctx.inputQueue`**（宿主既有数组交核驱动消费——同数组、零同步面；缺省核内新建 = 现行为零变）+ 两件照设计落。
- **② digest 帧宿主面**：核钩在非 Abort 失败径 ∕ 会话中止径不出 end ⇒ 注册 `onDigest` 将丢 end 帧与 `digest:stopped` 日志（现形 finally 必发）= 行为差。裁定 = **帧 ∕ 日志整体留 host `runTurn` 包装，不注册 `onDigest`**（逐字保形优先）。
- 两处差额由 §5 决策透明表披露、§6 收口对账。

### 1.6 并行面事故与对账（父侧认账 · 2026-09-29 05:3x）

- **事故**：P2（#88）派单 `files` 声明 **欠四档**（`execute-tools.mjs` ∕ `run-stages.mjs` ∕ `setup-reminders.mjs` ∕ `setup.mjs`——§2.3 件 5 点名连带面）⇒ 调度器未检出与 P4-I（#89）重叠 ⇒ 同档并发（P2 落笔时 P4 已删 execute-tools ∕ run-stages、改写 run-helpers ∕ setup-reminders ∕ setup.mjs）。**父侧派单缺陷，认账。**
- **对账**：P2 的 peer 接线意图（`recordPeerWrites` 写成功 ∕ `flushPeerDomains` 回合收尾 ∕ `pushPeerReminder` 装配）须在 **P4 终态承接**——已向 #89 发对账指令（三接点 → 新家逐点披露 ∕ 缺则补）；§6 收口核销时**逐点验三接点在场**。
- **教训入册**：派单 `files` 必须列全「设计点名的连带消费面」——欠声明 = 调度器失明（本次为反例在册）。

### 1.7 实施期裁定（父侧 · 2026-09-29 05:3x · P4-I #89 设计自相抵）

- **冲突**：件 1 行 2「上下文注入组 → 取核（`prepareRun:52-128`，读点 = `agent.memory`）」vs §2.6 表注「**除 `memory` 项**」——照表注落 ⇒ VSC 三块注入（依赖大纲 ∕ 文档召回 ∕ 记忆召回）全失效 = 可见行为丢失，违零变前提。
- **裁定 = ①**：host 装配置 `agent.memory = await memoryFor(cwd)`（`embed-config.mjs:169` 句柄；形兼容实证 `.db`/`docSearch`/`search`/`buildSummary`；停用 ⇒ null ⇒ 核静默跳过 = 旧端同形；≈3–5 行）；② 否。
- §2.6 表注「除 memory 项」的处置 = 装配置补齐（§5 同笔收正差额登记）。

### 1.8 P4-I 射程外路由（父侧 · 2026-09-29 05:5x · #89 交付裁定）

- **🔴 `callbacks.onComplete(content, agentState)` 缝**（核 loop 零调用点 + 端 `agentState` 零消费者 ⇒ 干净回合槽回写 ∕ webview `complete` 不复触发）= **路由 P4-II（#92）闭**——循环包装在核 `runAgent` 干净返回处补调（或另裁缝位）；P4-II 启动时父侧补发携带指令。
- **🟡 四项去向**：① E1 ∕ E2 核 `dispatch.mjs` 面 = P4-II 射程；② A2 尾块子代理传递面 = **§6 实证**（父侧收口——原态残留核对）；③ 面板推送腿（`syncToolDrivenDisplayState` 零消费者）= P4-II 钉缝 `callbacks.onTurnEnd`；④ `panel-turn-loop.mjs:17` `import { runAgent }`（装载期报错 · KNOWN 表在册）= P4-II 边界波同笔清。
- 行数账差额（`setup` 298 超估带 ∕ `tool-table` 182 低估带）= §5 已披露、§6 收口对账。

### 1.9 P3 交付裁定与跨波注（父侧 · 2026-09-29 05:5x · #91 交付）

- **W8 跨波注**：扩边 W8 扫描检出 `node:sqlite` 静态可达链（`extension.mjs → chat-panel → panel-messages → image-handler.mjs:15 → 核 vision-reader.mjs → 核 agent.mjs → setup.mjs → memory/schema.mjs`）——`vision-reader.mjs` = **#84（B4-W1）在途面**（该波自述 W8 经动态 import；本扫描时点 = 在途中间态）。**收口动作**：#84 落定后**复跑闭包扫描**（B1 §6 前）；届盘仍静态可达 ⇒ 缺陷另裁（B4 面）。
- **§2.6 表档籍补记**：`thincoder-core/agent-tools/async-discard.mjs`（清单外 +4 行载体守卫——已披露）= **§6 对账注册**（设计段表未含）。
- 其余登记项（CLI 210 行 +20 ∕ 核 +16 ∕ 三处收窄 ∕ `digestTurn` 失败径 unverified ∕ `entry.cwd` 死参 ∕ VSC `async-discard` 取核后孤儿副本）= §5 已披露，§6 收口逐项核销。

### 1.10 W8 契约②第二条链（父侧裁 · 2026-09-29 05:5x · #112 实证）

- **发现**：#112 修完 vision 链后复扫，BFS 首径遮蔽解除 ⇒ 第二条静态链浮出 = vsc `suspension.mjs:29`（→ 核 `agent/suspension.mjs`）∕ `:35`（→ 核 `parent-channel.mjs`）→ `async-settle → subagent-scheduler ∕ subagent-async → agent.mjs → setup → memory → schema.mjs`——**本批 P3 新边**；本档 `:703` 自述「净」= **漏检**（扩边前 `memory.mjs:7` re-export 边不可见）——收口对账更正。
- **割边模拟**：vsc 侧恰 2 条边双割 ⇒ 0 违规（收敛已证）。
- **裁定**：归 **B1 面另派修单**（不动 B4 面 ∕ 不撞 #92——调度按域排队于其后）；形 = 两边动态化 + 六消费点随动（最小随动为准）；验收 = 扫描件转净 + 消费点语义零变对拍。
- B4 面（#112）= vision 链已收 + 第二链披露（部分满足 AC② · 不静默）。

### 1.11 P4-II 交付裁定与路由（父侧 · 2026-09-29 06:1x · #92 交付）

- **🔴 `onComplete` 闭证已落**（核干净返回处补调 · 槽回写 + webview `complete` 帧实证 ✓）；③④⑤ 携行全闭；E1 ∕ E2 落（14/14）；G1–G6 68/68；新静态边逐档净。——**B1 主循环族收编完成**。
- 路由：① `src/agent/tool-table.mjs:29-31` 陈旧注（E1 已落 ⇒ 注文失效；`:150` 实为 `:154`）= **P5 同笔收正**；② `panel-turn-loop` **312 行超带**（≤500 硬限内）= §6 处置（拆档 ∕ 债务登记）；③ `image-handler` 旧行数带（130–140）与 §2.6 注 = P5 刷新；④ W8 第二链（端壳 `extension/suspension.mjs` 静态边）= **#113 已发**（本报告与 #112 互证——链形逐跳一致）。
- 批级对拍归档件 = **P5 落位**（tmp 先行先例在册）。

### 1.12 W8 第二链修复交付（父侧 · 2026-09-29 06:3x · #113）

- 两条边动态化 + 预载缓存（形 = 最小随动 · sync 出口保形 · fail-fast 不吞错）+ 扫描**转净**（193 档闭包 · 双探针不可达）+ 六消费点 SAME 11 ∕ DIFF 0 + P3 回归 23/34/23。——**W8 契约②两条链全断**（父侧亲跑扫描复核在案）。
- 路由：① `suspension.mjs` 291 行（超 P3 带上界 11 · ≤300 内）· 行数账与 `VSC-DEBT §12.1` → **P5 ∕ §6 收正窗口**；② `panel-callbacks` `onAsyncSettled` 定义无调用点（全仓仅定义）→ **§6 核**（是否退休面遗留）；③ P3 回归读数缺修后日志（unverified 标记）→ **§6 复跑落 log**；④ 批级归档件 = P5 落位。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 r1 已并入——评审 12 条逐条落位（§2.11）；核侧增补 6 组 9 小项 · 受影响 VSC 23 ∕ CLI 3 ∕ 核 6 档 + 测试面；待裁两项缺省取向 = 取核形（§2.10——§4 报请））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态与口径（设计轮）

- 本批 = **VSC + CLI 收口核（大件）· 设计轮**——产品码零写 ∕ 测试零写；唯一落盘 = 本 §2 段。
- **设计档落点** = 本 §2 自持（先例 = `docs/batches/2026-09-15-vsc-core-wiring.md` §2「批次任务书（eng-designer）」承载迁移设计；机制结论于实施轮并入权威档）。实施轮须**同笔收正的权威档清单** = §2.9（防漏改）。
- 射程 = 归批表 B1 全行（annex `:33` `:37` `:43` `:44` `:114` `:117` + 反①–④ `:178–:181`）；**含 CLI 半**（父侧 2026-09-29 判决：「B1 实为 VSC+CLI 收口核」）。
- 行数口径 = `readFileSync(...).split("\n").length`（含末行空元素）；坐标 as-of 2026-09-29 04:3x–05:0x 实读。
- 证据标注：本席实读（read ∕ grep）· 「舱报」= explore 舱读数（关键项已抽核；未逐条复读者随标）。

### 2.1 本批条目（覆盖）与边界

**覆盖**（逐行 → 本批处置）：

| 行 | 面 | 本批动作 |
|---|---|---|
| :33 | depth-0 主循环（VSC fork） | 收编取核（件 1）+ CLI 循环面勘察结论（§2.4-1） |
| :37 | 阶段函数族（VSC fork） | 收编取核（件 1-③） |
| :43 ∕ :44 | 挂起会话驱动 ∕ 池判据清扫计数 | VSC+CLI 双双收编取核（件 3 ∕ §2.4-2） |
| :114 | skills | VSC 转口取核（件 4） |
| :117 | peers | VSC 三档取核（件 5） |
| 反① :178 | suspension 未消费（VSC+CLI） | 同上（件 3 ∕ §2.4-2） |
| 反② :179 | skills 未消费 | 件 4 |
| 反③ :180 | peers 镜像 | 件 5 |
| 反④ :181 | runAgent ∕ run-stages fork | 件 1 ∕ 件 1-③ |
| 前置（未核① :190a） | vsc↔core 逐档对位 | 本 §2.2–§2.3 完成（勘察闭合，报告列） |
| 前置（未核② :190b · B1 半） | CLI 装配点 | 本 §2.4-1 勘察结论（闭合） |

**不复**（相邻批——本批零触）：

- **B2 ∕ #566 队列族**（`queued-merge` ∕ `queued-pickup` ∕ `_asyncQueue` 队表 ∕ 合并策略 ∕ 步边界 pickup 策略）——本批挂起收编**不动既有调用面**（对 `queued-pickup.mjs` 的引用保持原样；实施序须与 B2 同拍——§2.7 序注）。
- **B4 ∕ #567 小件族**（file-links ∕ attachments ∕ notify ∕ 2s 拍 ∕ provider-flows）。
- **B7 规则面**（rules-face 判据 ∕ `.cursor/rules` ∕ stream 规则合并）——本批仅登记对位、保留载位（§2.5-A2）。
- **B3 timer 族** ∕ **B5 装配序上提**——VSC `setup.mjs` 只做「host 装配 ∕ 核装配」拆分归位，不改语义。

**不做**：核件重设计 ∕ 新机制；顺带 UI 改动；产品码 ∕ 测试码写入（本批 = 设计轮）。

### 2.2 前置勘察（一）· VSC 循环族逐档对位表（主档 + 13 档）

列义：**度** = (a) 纯重复核逻辑 ∕ (b) 端壳 adapter（薄包核件）∕ (c) 端壳独有；**处置** = 收编形态（删 ∕ 转口 ∕ adapter ∕ 留）。

| # | 档（行 · 实读） | 角色 | 核对位（实读/舱报） | 度 | 差额点（实读/舱报） | 处置 |
|---|---|---|---|---|---|---|
| 0 | `src/agent.mjs`（456） | depth-0 主循环 fork | 核 `agent.mjs:102 runAgent`（462）；子代已走核（`subagent-async.mjs:16-19`） | 重复（端壳形） | ① 签名 `(provider,cwd,input,callbacks,signal,autoApprove,opts)` ≠ 核 `(agent,input,callbacks,opts)`；② agent 装配在环内（`hydrateRun`/`setupAgentRun` :112-114）vs 核 `prepareRun`；③ 响应段外提（response-stages）vs 核内联；④ 推回/蒸馏/收尾在端壳 run-stages；⑤ W9 调用期载体镜像（:384-412——provider/tasks/planMode/goal）；⑥ carrier 访问器绑定（:142-159 · CARRIER_FIELDS 14 款）；⑦ 循环头三点（turnInput/drainChildUpstream/consumeQueuedInput :202-214） | **退役**：主循环本体删；`ContinueError` 转口（:7/:48 保面）；⑤ 镜像面保留为装配期绑定（含 goal→面板推送改挂宿主回调面——差额核查项 §2.3-件1①）；⑥ 随件 3 決策 |
| 1 | `agent/agent-state.mjs`（159） | 端壳状态纯函数层（复位/eng 槽 reconcile/槽映射/显示同步） | 核无同名；`token-ttl.mjs:187 reconcileEngTokensFromSlot`（分歧孪生·登记在 `token-ttl.mjs:181-186`）· `session-lifecycle.mjs:86 applySession` | (c) 端壳 | 两处登记差（同 id 冲突槽优先 vs 内存优先；droppedExpired 回写为惰性） | **留** |
| 2 | `agent/context-injections.mjs`（216） | 上下文注入编排（#1–#6 + 单点入口） | 核 `agent/setup.mjs:52-128` + `agent/helpers.mjs:328/:387`（舱报） | (a) 重复 | ① `listWorkDir`/`loadProjectInstructions` 近逐字（端 sync ∕ 核 async）；② recall 门端 `depth!==0∥resume∥autoTurn` ∕ 核 `!resume`+depth0；③ 无 indexed 后缀（核 `setup.mjs:106-107`） | **删**（核注入块接管） |
| 3 | `agent/execute-tools.mjs`（421） | 工具派发器（批量/门禁/权限/钩子/记账） | 核 `dispatch.mjs:31` + `dispatch-run.mjs` + `record-results.mjs`（178）+ `post-turn.mjs`（67） | (b)+重复 | 端独有 8 项（§2.3-件1③）；核读点缺字段表（舱报 §5：`_currentTurn/_maxTurns/_logId/_inflightTools/agent.memory` 等） | **删**（取核 dispatch）+ 端独有逐项归置 |
| 4 | `agent/response-stages.mjs`（74） | 响应后处理外提 | 核 `agent.mjs:319-369`（内联） | (a) 重复 | `traceStop` 宿主面；次序注（核 ruleTriggered 先于 interrupted——两标志互斥无观测差） | **删**（traceStop 调用点按需留端壳） |
| 5 | `agent/rules-face.mjs`（120） | 规则面（A stream ∕ B `.cursor/rules`） | 读取已取核（`rules.mjs:33/:72`）；`mergeFileRules` ≈ CLI `make-agent.mjs:44-48`；B 面端独有 | 混合 | 档头自注：B 面三分类/JIT 判据 = VSC | **留（B7 面）**——本批仅保留 prompt 尾块载位（§2.5-A2） |
| 6 | `agent/run-helpers.mjs`（269） | 循环辅助（常量/纯函数） | 核 `helpers.mjs`（473）+ `context.mjs:7 pushReal` + `advisor/repos` `hasCodeMutations` | 混合 | 拆分明细见 **表注①** | **拆**（转口/删同位/留独有） |
| 7 | `agent/run-stages.mjs`（422） | 阶段函数族（压缩/蒸馏/收尾/推回/提醒） | 核 `agent/run-stages.mjs` 四导出（267） | 重复（fork） | 端差：共享 history 原位回收（:212-219/:254-258）· 蒸馏信号分离（:280-289）· guardCarry 形（:411-413）· 池挂 history（:402-405）· Stop 载荷 `_turnSeq`（:304-312）；`injectResponseReminders` 与核逐字同级 | **删**（取核四导出）+ 端差迁往件 1 |
| 8 | `agent/setup-reminders.mjs`（142） | 提醒族（核转口表 + 端独有） | 核 `agent/setup-reminders.mjs` + `helpers.mjs` 域常量 | (b) | 端独有：envStateLine 端身份 · restart 闸 · peer SWR（随件 5）· time 尾位推送；核 prepareRun 自带 env/peer/time 段 ⇒ 端同名调用点消失 | **瘦身转口**（envStateLine ∕ restart 闸 ∕ time 尾位 三项落点 = §2.3 件 1「输入段三项落点」专段） |
| 9 | `agent/setup-tooltable.mjs`（103） | 装配层缝接线（batch 账/verify 诊断/skill loader/eng 镜像） | 核缝四件（`batch.mjs:56` ∕ `verify.mjs:30` ∕ `skill.mjs:12` ∕ `eng.mjs:30`） | (b) | `vscodeDiagnosticsSection` 端独有 | **留** |
| 10 | `agent/setup.mjs`（429） | 装配入口（hydrateRun/setupAgentRun） | 核 `prepareRun`（241） | 大规模对位 | 端额外：config 读/槽 reconcile/工具表装饰/[4] 层扩展/manifest 附着/editor 注入/贴图指针；核已有：注入组/提示词装配/工具家族/输入推入 | **拆**（件 1-②） |
| 11 | `agent/tool-gates.mjs`（167） | 前置门禁 + 批权限扫描 | 核 dispatch Phase-1 + `dispatch-gates.mjs` + `write-gate.mjs:74/:133` | (b)+拷贝 | `isSubagentConsumeDesignAction` 字面拷贝（核 :106）· `agentHasLiveEngSlot` 重实现（核 `token-ttl.mjs:211`）· D5 面端含 `file_ops` ∕ 核不含 | **删**（取核门禁）+ 谓词面增补（§2.5-E1） |
| 12 | `agent/tool-table.mjs`（251） | 工具表装配 + 装饰 | 核 `family-tools.mjs`（188）+ `setup.mjs:159-172` | (b)+拷贝 | `withPool`/`modeRoleField` 拷贝（核 `family-tools:38/:46-78`）；`vscSubagentFace`/终结态回声端独有 | **留装饰面**（装配取核；拷贝项取核或登记差额） |
| 13 | `agent/turn-domains.mjs`（38） | 回合域文本（核基座 + 端 overlay） | 核 `helpers.mjs:436–459` + `agent.mjs:182` | (b) | overlay 串端独有；核 push 点只推基座 ⇒ 端组合面须保留载位 | **留**（核增补后组合点回端——§2.5-A3） |

**表注①（run-helpers 拆分明细）**：转口核 = `FILE_MUTATORS`（核 `helpers.mjs:86`）· `turnFrame`（核 helpers）· `hasCodeMutations`（核 `advisor/repos`）· `pushReal`（核 `context.mjs:7`）· `escapeXml`（核 helpers）· `MAX_ADVISOR_PUSHBACKS`（核 helpers）；核有同物（端删）= `configuredMaxTurns`（核 `prepareRun` 读 `agent.config.agent.maxTurns`）· `MAX_VERIFY_PUSHBACKS/RETRIES` ∕ `MAX_EMPTY_RETRIES` ∕ `STALL_*`（核 `completion.mjs` ∕ `post-turn.mjs`）· `offloadToolResult`（核 `dispatch-run.mjs:126`）；端独有留 = `safeSliceUTF16` ∕ `safeSliceUTF16Tail` ∕ `buildHeadTailPreview` ∕ `agentState`；`runWithLimit` ∕ `reinjectAfterCompaction` 随件 1 处置（前者消费者随 execute-tools 删减——实扫待定；后者 = 核 `runCompactionCheck` 的 `ensureAutoReminder` 对位 ⇒ 删）。

### 2.3 五件收编方案（含端壳 adapter 面界定）

#### 件 1 · 循环族（`src/agent.mjs` + `agent/*`）→ 取核 `runAgent`

**目标形**（与 desktop ∕ CLI 同构——对照实读）＝「端壳装配（host build/hydrate）→ 核 `runAgent(agent, text, callbacks, opts)` → 端壳续跑循环（resume ∕ ContinueError ∕ Ctrl+I 三段保留）」：

- desktop 形：`turn-face.mjs:89-121` 自有循环 + `run(agent, text, bridge(key), { signal, resume, autoTurn, upstreamTurn, timerTurn, suspDriven, consumeQueuedInput })`（`:91-99`）；agent = 核 `createAgent`（`agent-assemble.mjs:93`）。
- CLI 形：`agent-turn.mjs:185-286` 自有循环 + `runAgentImpl(agent, text, callbacks, {...})`（`:187`）。
- VSC 形（迁移后）：`panel-turn-loop.mjs` 保留三段循环与 controller 语义；`runAgent` 调用改核（件 2）。

**逐段对位（VSC `agent.mjs` + `setup.mjs` → host 装配 ∕ 核 `prepareRun`）**：

| 段 | 现 VSC 落点（实读） | 迁移后 | 处置 |
|---|---|---|---|
| agent 对象 | `buildTopLevelAgent`（`setup.mjs:80-104`） | **留 host**（对象形保留；核字段面按核 `runAgent` 读写实扫清单补齐） | 核读点缺字段表 → §2.6 注 |
| config 读 ∕ 槽 reconcile | `hydrateRun:155-217` | **留 host**（config 读 + `applySlotSessionState`） | 零改 |
| 工具表 | `buildToolTable`（装饰 + baseSet） | **留 host**（baseSet → `agent.tools`；家族段核追加） | 核 `prepareRun:163-172` 同序——实施轮对齐核 |
| 提示词装配 | 端 `assemblePrompt` + [4] 层扩展（`setup.mjs:284-300`） | **取核**（`prepareRun:187-235`） | [4] 层端扩展 = §2.5-A2；skills 清单取核 |
| 上下文注入组 | `injectRunContext`（#1–#6） | **取核**（`prepareRun:52-128`） | 端差两处登记（§2.2 表行 2） |
| 输入推入 ∕ env ∕ peer ∕ time | `hydrateRun:392-419` | **取核**（`prepareRun:129-150`） | env 身份行 ∕ restart 闸 ∕ time 尾位 三项落点 = 下方专段；editor 注入 = §2.5-A1 |
| 贴图指针 | `appendImagePointer`（`:419`） | **adapter**：端以核函数（`setup-reminders.mjs` 已导出）在**调用前**对 input 串施用 | 零核改（实施轮验函数纯性） |
| manifest 附着 ∕ sessionStart ∕ `_fullHistory` ∕ eng 三字段 | `hydrateRun:333-365` | **留 host** | 零改 |
| 主循环本体（chat ∕ 工具批 ∕ 响应段 ∕ 推回 ∕ 压缩 ∕ 蒸馏 ∕ 收尾） | 端 fork | **取核** | 端差迁往 §2.5-B（蒸馏信号）；history 锚 = §2.8 KD-3 |
| 面板推送腿（planMode ∕ goal ∕ eng ∕ settings ∕ tasks） | 环内镜像 + `syncToolDrivenDisplayState`（`agent.mjs:400-417`） | **adapter——钉缝 = `callbacks.onTurnEnd(agent, turn)`**（核 `post-turn.mjs:65` 每工具执行轮末恰一次，`agent.mjs:445` 调用；工具期中断支 `agent.mjs:434` 同触）：回填 ∕ 比对块（`:398-417`）逐字迁入该回调——① tasks ref 比（`!==` ⇒ 回写）；② planMode 布尔比（`=== "boolean" && !==` ⇒ 回写 + `callbacks.onPlanMode`）；③ goal 基准跨批保留（`_goalShownRef ∕ _goalShownStatus`，每次回调末更新——批间无 goal 写点 ⇒ 等价现值「批前快照」）+ `syncToolDrivenDisplayState` 原样；前向镜像（`:384-388`）落 host 装配段（每 run 一次）；task 腿走核 `_onTaskUpdate` 缝（`task.mjs:90`）零改 |
| `getAuto` live 闭包 | 入参形态（`:69`） | **留 host**：`agent.autoApprove` 访问器（`setup.mjs:243` 已具） | 零改 |
| `sessionSignal` ∕ `inheritedGuard` ∕ `guardCarry` ∕ `distillState` | opts 字面量 | **留 host**：调用前落 `agent._sessionSignal` ∕ `agent._inheritedGuard`；autoTurn 后取回 `_inheritedGuard` → `panel._guardCarry` | 零核改（核字段读点已在） |

**输入段三项落点（env 身份行 ∕ restart 闸 ∕ time 尾位——取定）**：

- **env 身份行（二择一 · 取定 = ①核单源）**：① **核单源 + 端名缝**——核 `setup-reminders.mjs:41` 的 `${END}` 改 `${sessionEnd()}`（缝已在 = `session-slots.mjs:113-115`；VSC 模块求值期已声明端名——`src/extension/session-slots.mjs:51` `setSessionEnd("vscode")`）⇒ 核 env 行在 VSC 进程输出 `env: vscode`（逐字零变）；VSC 自持 `envStateLine` ∕ `pushEnvStateReminder` 退役；resumed 载体改指 `agent._envResumed`（VSC 武装点同条件——`_resumedPending` 名退场）。② 端自持保留——核 env 段须加端侧抑制门（核面加开关 + 双行风险）——**弃**。①的成本 = 核 ≈2 行（§2.5-F）。
- **restart 闸（留 host）**：VSC 模块级 `restartDetectionDone` + `detectRestoredSession`（`setup-reminders.mjs:110-121`——extension-host 重载语义）保形；触发时置 `agent._processRestartPending = true`，核 `prepareRun:82-90` 消费发句——句文本（VSC 现句 `context-injections.mjs:186` ∕ 核句 `setup.mjs:89` 逐字同）与序位（git → OS → restarted → outline）零变；落点 = 端装配段（runAgent 调用前）。
- **time 尾位（取核）**：核 `prepareRun:146-150` 尾位推送（编辑器注入（§2.5-A1）之后——VSC 现 `setup.mjs:413→:415` 同序）；端 `pushTimeReminder` 退役。登记 = 核模板带 `|| "local"` 时区兜底（VSC 现无——正常环境逐字同）。

**端独有 8 项归置（`execute-tools.mjs` 面）**：① 规则 JIT = B7 载位（保留注入点——实施轮与 B7 同拍）；② 权限卡 diff 预览 → adapter（handler 内自算——核 ask 两参已够）；③ 动作谓词钩子 → §2.5-E1；④ manifest 门 L3 + 认领/足迹 → 件 5（取核后由核 dispatch 调核 peer 面；门与文案差额逐条登记）；⑤ 每项 abort 预检 → 核为批级检查（`dispatch.mjs` + `agent.mjs:393/401`）——差额登记（项级 vs 批级）；⑥ 派发级并发帽 4（`run-helpers:86` `MAX_PARALLEL_SUBAGENTS` ∕ `:150` `runWithLimit`；消费点 `execute-tools.mjs:321`）→ **缺省取向 = 取核形**（核 `dispatch.mjs:224` Phase-2 无帽 `Promise.all`）；行为变更登记句 = §2.10-①；⑦ 派生内停滞检测 → 核 `post-turn.mjs:31-45`（同义换位）；⑧ 多模态提交 → 核 `record-results.mjs:45-73`（核更防御——取核形）。

#### 件 2 · 回合面（`panel-turn-loop` 187 ∕ `panel-turn-stages` 241 ∕ `panel-chat` 260）→ 改接核调用

- **`panel-turn-loop.mjs`**：`runTurnLoop` 内调用点 `:118` 改核 `runAgent(agent, text, callbacks, { signal, resume, autoTurn, upstreamTurn, timerTurn, suspDriven:true, consumeQueuedInput, ... })`；`ro` 字段分流 = `mcpServers/skills/engState/engPersist/batchDoc/images/injections/distillState/distillSignal/guardCarry/agent` 归 host 装配段（不进核 opts）、`sessionSignal` → `agent._sessionSignal`、`resume` 保留；`newTurnController` ∕ `bindPanelAgent` ∕ 三段循环（`:114-181`）保留。
- **`panel-turn-stages.mjs`**：`resolveTurnStage` ∕ `finalizeTurn` ∕ `enterSuspensionTurn` ∕ `deliverBusyQueued` **全部保留**（host）；仅 `enterSuspensionTurn` 的挂起入口随件 3 改核驱动（`:201-215`）；`ro.skills` 行随件 4 删。
- **`panel-chat.mjs`**：`runPanelChatImpl` 的 provider 解析 ∕ 行加载 ∕ 回调装配 ∕ `panel._liveLines` ∕ `prevDistill` 等待 ∕ `ensurePanelAgent` 保留；`runTurnLoop` 入参面随 ro 改造。
- **新增消费点（实读发现——须入受影响表）**：`image-handler.mjs:92`（130 行）以 **fork 签名**调 `runAgent(provider, cwd, task, {}, signal, true, { depth:1, role:"explore", maxTurns:10 })`（F-1 降级读图跑者）——签名随主循环退役：adapter = 端壳建子 agent + 核 `runAgent(agent, task, {}, { depth:1, role:"explore", maxTurns:10, ... })`（动态 import 保 W8）。

#### 件 3 · 挂起会话驱动（`suspension.mjs` 484）→ 取核 `startSuspension`

**对照**（desktop = 取核范本）：`suspension-drive.mjs:22` 取 `{ backgroundCounts, poolLive, startSuspension }`；`:195-210` 装配 `carrier: agent` + `runTurn` + `injectResidual` + `timerFace` + `hooks{ onCounts, reclaim, freezeAll }`；digest 帧由宿主包装层发（`:13-14` 不注册 `hooks.onDigest`——零双帧先例）。

**VSC 装配（迁移后）**：`carrier = history`（现形——核 `suspension.mjs:10-13` 明载 VSC 形兼容）；`runTurn` = 现 `entry.runTurn` 闭包；`abortSignal = susp.abort.signal`；`injectResidual` = 现残余注入器（`injectAsyncResult`/`injectConsultResult` + `{history,_fullHistory}` 载体）；`timerFace = { deadline: () => pendingTimerDeadline(panel._agent), deliver: () => deliverExpiredTimers(panel, { lines }).length > 0 }`；hooks = onCounts → `postSuspension`/`_publishTurnState` · onDigest → webview digest 帧（tier/ask 携参在 start 自算）· reclaim → `reclaimDigestedBlocks` · freezeAll → `postSuspensionEnd`；`handle.pushInput/wake/done` 替换 `susp.pendingInput` 直写与 `panel._suspWake` 单槽。

**VSC 侧差额点（逐条处置）**：

| # | 差额（实读坐标） | 处置 |
|---|---|---|
| 1 | step-1 输入面：端 = 富条目 + 合并批（`takeQueuedBatchItem(susp.pendingInput)` `:304`；容量 8）∥ 核 = `String(msg)` 单条 shift（核 `:198-209`） | **核增补 C**（§2.5）；合并策略归 host（B2 面） |
| 2 | abort 清场：端 = 只清已死 + 会诊清理 + pending 清（`:407-415`）∥ 核 `finishSuspension` aborted 支全清两池（核 `:107-115`） | **核增补 D**（§2.5——与核 run-stages §6.20 口径对齐） |
| 3 | 退出残余：端 finally 注入器（`:420-435`）+ 残输入兜底（`:449-457`）∥ 核 `residualInput` 返回 + `injectResidual` 钩 | 取核钩 + `handle.done` 残输入消费（host） |
| 4 | 计数：端 `backgroundStatus`（`:125`）consult 计会话数 ∥ 核 `backgroundCounts`（核 `:78`）计 children；端 `poolLive` 计 `_consultSessions.size>0` ∥ 核计 running children（核 `:57`） | **取核形**（停止会话不吊窗——行为收窄；登记） |
| 5 | 等唤醒：端双注册（`panel._agent` ∪ `history` `:195-218`）∥ 核单注册 carrier | 取核（访问器别名下同数组；实施轮核） |
| 6 | `history._suspended` 翻转 ∕ 用户回合普通语义（`:314-319`） | 核同形（核 `:201-206`）——零改 |
| 7 | 1s ticker ∕ `panel._susp` 投影 ∕ `abortControllers` 快照 ∕ 退出落盘 ∕ `syncTimerWatch` | **留 host**（会话外壳面） |
| 8 | queued 计数口径：CLI 读 `_asyncQueue.length`（CLI `:168`）∥ 核读池条目 status（核 `:87`） | 实施轮实核两源同值性；不等则登记 |

#### 件 4 · skills（`extension/skills.mjs` 119）→ 转口取核

- 核五导出（`skills.mjs:92 loadSkills` async · `:117 formatSkillListing` · `:131 readSkill` · `:214 loadSkillsSync` · `:224 readSkillSync`）——端面逐条同源（舱报：`tryReadSkill` ∕ `loadSkillsFromDir` ∕ `loadSkills` ∕ `formatSkillListing` ∕ `readSkill` 逐字对位；`NAME_RE` 同）。
- **转口形**：本档 → `export { loadSkillsSync as loadSkills, readSkillSync as readSkill, formatSkillListing } from "@thincoder/core/skills.mjs"`（三消费点零改：`setup.mjs:35` · `setup-tooltable.mjs:20`（喂核 `skill.mjs:12 configureSkillLoader`）· `panel-turn-loop.mjs:19/:84`）。
- 差额处置：① sync 面取核 `*Sync`（核档 `:156-159` 自注正对本件）；② 端 `readSkill` stat 门多一 syscall（行为等价——取核形）；③ `ro.skills`（`panel-turn-loop:84`）与端 listing 追加（`setup.mjs:296-300`）随件 1 改由核 `prepareRun:231-235` 供应 ⇒ 端两处删；④ 端档头陈旧坐标注（「cli skills.mjs」）实施轮收正。
- 行数账：119 → **≈6 行**；核零改。

#### 件 5 · peers（`peer-claims` 208 ∕ `peer-domains` 265 ∕ `peer-instances` 183）→ 取核

| 档 | 核件 | 差额点（舱报） | 处置 |
|---|---|---|---|
| `peer-claims.mjs`（208） | `core/peer-claims.mjs`（264） | ① 载体：端模块级（`:69-71`）∥ 核 `agent._peerClaims*`（`:98-100`）；② 写盘 cwd 端原文（`:151`）∥ 核 `normalizeCwd`（`:179`）；③ 名差表（`readRecord/registerClaims/flushClaims/markPeerNoted` ↔ 核 `readPeerRecord/recordPeerClaims/flushPeerClaims/markClaimNoted`）；④ `peersDir` 端 = `dirname(sessionsDir())/peers`（`:46-48`）∥ 核 configDir | **取核**：读写面转口（③ 端侧 alias 保消费面）；① ② 取核形（登记）；④ 宿主根解析保留（核缝参数化） |
| `peer-domains.mjs`（265） | `core/peer-domains.mjs`（295） | ① 查询形：端绑定对象 `peerDomains(cwd).conflicts/claimConflicts`（`:158-201`）∥ 核数组 + `conflicts(cwd,targets,{now})`；② 条目形扁平 ∥ 核分组 `{target,by[]}`；③ `claimConflicts` 端独有 ↔ 核 `claimHits`+拼装；④ `aggregate` 宽松三处（无 cwd 记录 ∕ 由 sessionId 推 pid ∕ **无 `batchAlive→null` 支**——核 `:125-126` 明为「未知不删」，端靠 catch 兜住＝偶然正确）；⑤ 缓存键 `{mtimeMs,size}` ∥ 核 mtime-only；⑥ `peerNotes` 输入端 ∥ 核 `peerCollabNote(agent,tool,args)`；⑦ 分隔符 `\n\n` ∕ `\n`（**在册有意端差**——`MULTI-INSTANCE-COLLAB.md:171`） | **取核**（读面 API 归核形）+ 端 adapter（execute-tools 调用点改核形）；④ 取核（偶然正确面消除）；⑦ 保留（在册端差；其双改纪律随取核消失——登记句实施轮收正）；① ② ⑥ = 调用点改造 |
| `peer-instances.mjs`（183） | `core/peer-instances.mjs`（180） | ① 读形：端 sync SWR + 预热（`:148-160`）∥ 核 async；② 端独有 `peerInstancesAsync/prewarmPeerInstances`；③ 探针缝名差；④ 工具描述逐字同串；⑤ `putSnapshot` 驱逐守卫微差（`:78`） | **取核**：`peer_instances` 工具取核（核心 `peerInstancesTool:167` 已具）；SWR 同步读消费面（`setup-reminders:88` 端 peer 提醒）随件 1 改由核 `prepareRun:136-139` 的 `await pushPeerReminder(agent)` ⇒ **SWR 壳退役**（`MULTI-INSTANCE-COLLAB.md:109`「端同步读形非结构性约束 ⇒ 端差默认＝消」正对本面）；② ③ ⑤ 随删 |

- 行数账：656 → **≈40–70 行**（宿主根解析 + alias 转口 + 接缝）；核零改（三档导出已齐——`MULTI-INSTANCE-COLLAB.md:102` 聚合半段单源先例同法）。
- 端差登记句三处（`:171` 分隔符 ∕ SWR 面 ∕ 载体差）实施轮同笔收正（§2.9）。

### 2.4 CLI 半（父侧 2026-09-29 判入）

#### 2.4-1 · CLI 循环面 + 装配点勘察（未核② 之 B1 半）——闭合结论：**无缺口（零动作）**

- CLI `agent-turn.mjs:17/:187` 已取核 `{ runAgent, ContinueError }`；`make-agent.mjs:3/:112` 以核 `createAgent` 装配；回合装配（注入组/提示词/工具家族）由核 `prepareRun`（经核 `runAgent` 内部调用）承载——「CLI 树 `prepareRun` 零 import」＝**间接消费**（与 desktop 同构），非缺口；`command-interactive.mjs:135` 单条注释面实施轮顺带核。
- CLI 侧装配点三层（实读）：`assembleAgent`（`make-agent.mjs:24-138`——config/memory/规则合并/MCP/工具/`attachManifest`/`validateProvider`）= 会话装配；核 `prepareRun` = 回合装配；两段无第三序。

#### 2.4-2 · CLI 挂起驱动收编（`cli/src/tui/suspension-drive.mjs` 372）→ 取核 `startSuspension`

- 现状实读：全树对 `agent/suspension` 零 import（仅 `:308` 一条镜像注释）——语义已入核（核档 `suspension.mjs:4`「语义（两端同源，逐字承两端现行挂起驱动）」），面未消费。
- 装配（desktop 形）：`carrier = agent`（CLI 形——核 `:10-13` 兼容）；`runTurn = (text, opts) => runAgentTurn(ctx, text, { ...opts, skipSession: true })`；`abortSignal = agent._sessionAbort.signal`；`injectResidual` = CLI 注入器（含 `releaseSettledEntry`——OOM 释放面，与核 runAgent 注入点同款）；`timerFace = { deadline: () => pendingTimerDeadline(agent), deliver: () => deliverExpiredTimers(ctx) > 0 }`；hooks = onCounts → `backgroundStatusText` + render · reclaim → `freezeReclaimDigestedBlocks(state, allPendingEntries(agent))` · freezeAll → `freezeAllSubTasks(state)` + `sweepToolBlocks(state)` + Ready。
- 差额点（逐条处置）：

| # | 差额（实读坐标） | 处置 |
|---|---|---|
| 1 | step-1 输入面：`state.pendingInput` + `planQueuedInput(...)[0]` 批取 ∕ `/cmd` 防御面 ∕ `[sending queued message]` 回执行（`:261-276`） | **核增补 C**（§2.5）+ host runTurn（回执行与批取归 host） |
| 2 | abort 清场：只清已死 + pending 清 + 队列回搬 `state.queue` + 提示行（`:329-348`）∥ 核全清（核 `:107-115`） | **核增补 D** + `handle.done` 残输入映射（`residualInput` → `state.queue`） |
| 3 | digest 可见面：tier 两档 ∕ 起跑与收尾行 `pend0>0` 守卫 ∕ `digest:*` 日志（`:189-217`） | **host runTurn**（desktop 先例：不注册 onDigest——零双帧） |
| 4 | 1s 状态 ticker ∕ `state.suspAbortArmed` ∕ `_suspAborted` ∕ `state._suspWake`（`:244-249/:238-243/:327-328`） | **留 host**（`_suspWake` 单槽 → `handle.wake`） |
| 5 | queued 计数口径：`:168 agent._asyncQueue.length` ∥ 核池条目 status | 实核两源同值性（件 3 差额 8） |
| 6 | `agent._sessionSignal/_sessionAbort` 生命周期（`:241/:322-325`） | **留 host**（desktop `:193-194/:216` 同款） |

- 行数账：372 → **≈150–190 行**（driver 壳 + 渲染 + 注入器；状态机本体出核）；`agent-turn.mjs`（416）尾段调用面微调（`suspensionSession(ctx)` 调用点与 `poolLive(agent)` ∕ `poolCounts` ∕ `pendingFamilyCount` 等导出消费面 :295/:318/:391-402 **保留名**——薄化转口）。
- 剩留登记（非本批）：`backgroundStatusText` 文案（中文状态行）实施轮保形；`_asyncQueue` 与池条目双表示实核随差额 5。

### 2.5 核侧增补（装载缝增补——6 组 9 小项；逐项 additive ∕ 缺省＝现行行为）

> 口径：**核件形不乱动**（无重设计、无新机制、零端名分支）；下列皆「可选键 ∕ 缺省零变」形——CLI ∕ desktop 不传即零变。原预算（+2~3 导出）为「纯导出增补」估计；实勘后为 6 组 9 小项（含 2 项核内不一致修正 + F 端名缝取用）——偏离理由逐项在列，**可降级项已标**（降级＝登记差额 + 影响面在册；缺省取向见 §2.10，§4 报请）。

| 组 | 项 | 目的（对应的端侧面） | 形态（建议） | 估行 | 备选（零核改）与行为差 |
|---|---|---|---|---|---|
| A1 | `opts.injections` | VSC 编辑器上下文注入（现 `setup.mjs:413` `pushInjections`——序位：peer 后 ∕ time 前） | `prepareRun` 序位插入（`opts.injections` 串数组，transient user 消息） | ≈5 | 走 `_pendingReminders`（核 `:152-157` 排空）——落点变 time 之后（消息序差） |
| A2 | `opts.promptTail` | VSC `.cursor/rules` 常驻集尾块（现 `setup.mjs:295` `scopedRulesBlock`；**判据面属 B7**——本项只保留载位） | skills 清单后追加 | ≈4 | 无（系统提示面不可端侧改） |
| A3 | `opts.turnDomainText` | VSC 回合域文本组合（`turn-domains.mjs:30`——核基座 + 端 overlay；核现只推基座 `agent.mjs:182`） | 域文本推送点改 `opts.turnDomainText ?? 核基座` | ≈3 | 基座 + overlay 分两条（`_pendingReminders`）——消息边界差 |
| B | `opts.distillSignal` | VSC 蒸馏信号分离（AC6a——运行 controller 重建不杀蒸馏；现 `run-stages.mjs:280-289`） | `summarizeRunExplorations(…, opts.distillSignal ?? signal, …)` | ≈3 | 无（蒸馏随 Stop 中止＝行为差） |
| C | 挂起输入缝 | VSC ∕ CLI step-1 富条目 + 合并批（两件 3 差额 1） | `pushInput(msg)` 保留原值（去 `String()`）+ `ctx.takeInput(queue) → item`（缺省 `shift`） | ≈6 | 无（合并批不可省——B2 面在册） |
| D | `finishSuspension` aborted 支对齐 §6.20 | 两件 3 差额 2（核内不一致：run-stages 已「只清已死」，suspension 仍全清） | aborted 支改 `discardAbortedPool/discardAbortedAdvisors`（核 run-stages 同口径；`async-discard.mjs` 已具） | ≈6 | 无（全清会杀存活子代＝两件现行为相抵） |
| E1 | 动作谓词采纳 | 端工具钩子 `isReadonlyAction/isControlAction`（VSC 超集——planMode 放行 ∕ 权限豁免面） | 核 dispatch 分类面：`tool.isReadonlyAction?.(args) ?? isSubagentReadonlyAction(…)` 同式 | ≈6 | 无（取核旧形＝plan 模式 git 只读动作被拒——用户可见差） |
| E2 | D5 冻结面 `file_ops` 覆盖面 | 端宽（`FILE_MUTATORS ∪ file_ops`）∥ 核窄（`dispatch.mjs:129` 仅 `FILE_MUTATORS`） | 核面补 `file_ops`（一行集合）——**缺省取向 = 取核形**（§2.10-②） | ≈2 | 登记差额（罕见路径）——降级留实施实证退路（§2.10-②） |
| F | 核 env 行端名缝取用 | VSC env 身份行（`env: vscode`——件 1 输入段三项之一） | 核 `setup-reminders.mjs:41` `${END}` → `${sessionEnd()}`（缝已在 = `session-slots.mjs:113-115`；`END` 仅剩模块级初值） | ≈2 | 无（CLI 零声明即得 `cli`——逐字零变；端自持方案弃——见 §2.3 输入段） |

> **可降级标注**：E2（罕见路径）与件 1-⑥（派发级并发帽——取核后无帽）**缺省取向 = 取核形**（§2.10；§4 报请 · 用户可翻转）；其余各项为「行为零变」硬依赖。
> **核侧总估**：≈35–45 行（逐项合计 ≈37 · 行级合计 ≈42——带宽含注释与微调）；核测补面（B ∕ C ∕ D ∕ E 各一用例——宿主 = 批档对拍件，§2.6 测试面行）随实施轮。

### 2.6 受影响文件表（VSC 23 档 + CLI 3 档 + 核若需）· 行数账

> 行数 = 现值（实读）→ 迁移后估算；硬限 ≤500 ∕ 软线 300（项目约定）。

| 树 | 文件 | 现值 | → 估 | 动作 |
|---|---|---|---|---|
| VSC | `src/agent.mjs` | 456 | **≈5–10** | 主循环退役；`ContinueError` 转口保 import 面（`run-stages` ∕ `panel-turn-loop` 两处消费者） |
| VSC | `src/agent/agent-state.mjs` | 159 | 159 | 留（端壳） |
| VSC | `src/agent/context-injections.mjs` | 216 | **0**（删） | 核注入块接管 |
| VSC | `src/agent/execute-tools.mjs` | 421 | **0**（删） | 取核 dispatch |
| VSC | `src/agent/response-stages.mjs` | 74 | **0**（删） | 核内联段 |
| VSC | `src/agent/rules-face.mjs` | 120 | 120 | 留（B7 面） |
| VSC | `src/agent/run-helpers.mjs` | 269 | **≈60–90** | 转口 + 端独有（表注①） |
| VSC | `src/agent/run-stages.mjs` | 422 | **0**（删） | 取核四导出 |
| VSC | `src/agent/setup-reminders.mjs` | 142 | **≈40–60** | 瘦身转口 |
| VSC | `src/agent/setup-tooltable.mjs` | 103 | 103 | 留（缝接线） |
| VSC | `src/agent/setup.mjs` | 429 | **≈180–240** | host 装配保留；注入/提示词/输入段删 |
| VSC | `src/agent/tool-gates.mjs` | 167 | **0**（删） | 取核门禁 |
| VSC | `src/agent/tool-table.mjs` | 251 | **≈200–240** | 装饰留；拷贝项取核 |
| VSC | `src/agent/turn-domains.mjs` | 38 | 38 | 留（转口 + overlay） |
| VSC | `src/extension/panel-turn-loop.mjs` | 187 | **≈180–200** | 调用面改核 + ro 分流 |
| VSC | `src/extension/panel-turn-stages.mjs` | 241 | **≈235–240** | 挂起入口随件 3；`ro.skills` 行删 |
| VSC | `src/extension/panel-chat.mjs` | 260 | **≈255–265** | 入参面微调 |
| VSC | `src/extension/suspension.mjs` | 484 | **≈230–280** | 核驱动装配 + hooks + 外壳保留 |
| VSC | `src/extension/skills.mjs` | 119 | **≈6** | 转口 |
| VSC | `src/extension/peer-claims.mjs` | 208 | **≈30–50** | 取核 + 根解析/alias |
| VSC | `src/extension/peer-domains.mjs` | 265 | **≈60–100** | 取核 + 调用点 adapter |
| VSC | `src/extension/peer-instances.mjs` | 183 | **≈10–20** | 取核（SWR 壳退役） |
| VSC | `src/extension/image-handler.mjs` | 130 | **≈130–140** | 读图跑者改核调用（F3 新增档） |
| VSC | **小计** | **5344** | **≈2180–2300（中线带——逐档上下界合计 ≈2040–2360；−57%±）** | —— |
| CLI | `src/tui/suspension-drive.mjs` | 372 | **≈150–190** | 取核 + 壳/渲染/注入器 |
| CLI | `src/tui/agent-turn.mjs` | 416 | **≈410–416** | 尾段调用面微调；导出面保留名；**tier 结论 = 保留 + 债务登记**（>300 软线——本批不拆） |
| CLI | `src/command-interactive.mjs` | 187 | ±0 | 注释面收正（实施轮实扫） |
| 核 | `agent/setup.mjs` | 241 | **+≈12** | A1 ∕ A2 ∕ A3（序位插入 + 尾块 + 域文本） |
| 核 | `agent.mjs` | 462 | **+≈6** | B（distillSignal）；**tier 结论 = 登记拆分债务**（`runAgent` ≈360 行函数——父侧另挂台账）+ **本批增量最小化注记**（仅 B 一改点——本批不拆） |
| 核 | `agent/suspension.mjs` | 281 | **+≈12** | C（输入缝）+ D（清场对齐） |
| 核 | `agent/dispatch.mjs` ∕ `dispatch-gates.mjs` | 241 ∕ 126 | **+≈10** | E1 ∕ E2（含 gates 面） |
| 核 | `agent/setup-reminders.mjs` | 256 | **+≈2** | F（env 行端名缝） |
| 核 | **小计** | —— | **+≈35–45 行 · 0 新导出**（行级合计 ≈42——同一带宽；口径见 §2.5） | 核测补面随实施轮（宿主 = 下二行） |
| 测试 | `docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs` | —（未建） | **新增**（判据 1 对拍族 + 核增补 B ∕ C ∕ D ∕ E 四用例；实施者自写自跑 ∕ 随批档归档——`node --test` 直跑；先例 = `2026-09-28-tech-debt-closeout-r*.test.mjs`） | 批次本地对拍 |
| 测试 | `thincoder-core/test/`（run.mjs ∕ slow.mjs） | 零用例（2026-09-28 全清重置——空清单即绿） | **±0**（用例归批档对拍件；核 `test/` 树现状不变） | 核测树 |

**表注（核读点缺字段——host 装配须补）**（舱报 §5 抽核）：`_currentTurn/_maxTurns`（批准事件计数）· `_logId`（工具日志 child 标签）· `_inflightTools`（observe 面）· `_advisorAsyncAcks/_advisorSyncCalls`（软读——懒建）· `_engTaskAuthorized`（子代面）· `goalTurns`；`agent.memory` = 端无句柄（VSC 记忆经 `embed-config` 句柄——**差额登记**）；`_recordStore/_historyWindow`（核 `pushReal` store 面 ∥ 端走 `panel-callbacks` 持久化——实施轮实核差额）。处置建议 = host 装配以访问器 ∕ 空值补齐（与 `autoApprove` 访问器同法），除 `memory` 项。

### 2.7 回归判据 + 实施序

**现状实读（回归面地基）**：`thincoder-vscode/test/` = `files.mjs` + `integration/files.mjs`（**两册均空**）+ `run/slow` + `smoke-provider.mjs` ∕ `smoke-settings.mjs`；`thincoder-cli/test/` = `run/slow` + `smoke-qwen-thinking.mjs` ∕ `smoke-responses{,-chain}.mjs`——**存量对拍用例面为零**（2026-09-28 全清令后未重建）。

**判据四类**：

1. **批次本地对拍件**（`docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs`——实施者自写自跑，随批档归档）：skills 转口输出 ∥ 核 sync 面逐字；peers 三面（认领 ∕ 足迹 ∕ 实例 + AC-IC11 逐字锚）；suspension 状态机（step1–4 ∕ 退出清场 ∕ 残输入 ∕ abort 只清已死）；loop 关键臂（空响应重试 ∕ 中断 ∕ 续跑 ∕ 压缩后共享数组回收 ∕ guard 推回 ∕ 蒸馏发射 ∕ 载体访问器 ∕ 域文本组合；核增补 B ∕ C ∕ D ∕ E 四用例同档承载——宿主 ∕ 现值 ∕ Δ = §2.6 测试面两行）。
2. **端侧冒烟（真机）**：VSC = `smoke-provider` + 行为臂清单（普通回合 ∕ 压缩 ∕ AUTO ∕ Stop ∕ Ctrl+I ∕ Continue ∕ 挂起会话（digest ∕ timer 轮 ∕ 队列 ∕ 取消）∥ 换槽恢复 ∥ 工程模式门 ∥ 子代理全族 ∥ 贴图降级读图）；CLI = 冒烟三件 + TUI 行为臂（回合 ∕ 挂起 ∕ digest ∕ queue ∕ Stop）。
3. **结构机检**：W8 静态闭包（端壳静态链不到达 `node:sqlite`——判据在册 `engine-floor-guard`；现盘用例状态实施轮实扫）；端 ∕ 核行数硬限（≤500）；`node scripts/doc-check.mjs` 文档闸。
4. **对拍锚（逐字面）**：AUTO ∕ ENG ∕ timer ∕ upstream 域文本 ∕ peer 软提示文案（AC-IC11）∥ `ContinueError` ∕ 各类注入文案——核单源后断言「端侧零第二份字面」（结构扫描）。

**实施序**：

| 段 | 内容 | 依赖 | 回退半径 |
|---|---|---|---|
| P1 | skills 转口（VSC） | 无（核 sync 面已在） | 单档 |
| P2 | peers 三档取核 + 调用点改造（VSC） | 无（核三档导出已齐） | 3 档 |
| P3 | 挂起收编（VSC+CLI） | 核增补 C ∕ D；**与 B2 同拍**（队列调用面不动——若 B2 先落则本段适配） | 2 档 |
| P4 | 循环族 + 回合面（VSC） | 核增补 A ∕ B ∕ E；件 1 逐段对位表 | 大（VSC 树） |
| P5 | 文档面收正（§2.9 清单）+ `VSC-DEBT §12.1` 读数刷新 + 台账核销 | P1–P4 落定 | 文档面 |

> 序理：小件独立先落（回退半径小）→ 挂起（中）→ 循环（大、依赖核增补）→ 文档收正。核增补（§2.5）随 P3 ∕ P4 分批落，单项一提交（可回退）。

### 2.8 验收对照 · 关键决策 · 上抛项

**验收对照**（对 §2.1 覆盖表逐条回指）：

| AC | 判据 | 落点 | 状态 |
|---|---|---|---|
| AC1 | 逐档对位表（13 档 × 差额点） | §2.2（主档 + 13 档逐行） | ✓ |
| AC2 | 五件收编方案（含端壳 adapter 面界定） | §2.3（件 1–件 5） | ✓ |
| AC3 | 受影响文件表（VSC + CLI + 核「若需」） | §2.6（VSC 23 档 ∕ CLI 3 档 ∕ 核 6 档 + 测试面 + 行数账） | ✓ |
| AC4 | 回归判据列表 + 实施序 | §2.7 | ✓ |
| AC5 | §2 落盘 | 本段 | ✓ |
| AC6 | CLI 半方案（父侧 2026-09-29 判入） | §2.4（§2.4-1 勘察闭合 + §2.4-2 收编方案） | ✓ |

**关键决策**：

- **KD-1** 设计档落点 = 本 §2 自持（先例 = `docs/batches/2026-09-15-vsc-core-wiring.md` §2）；机制结论随实施轮并入权威档（清单 = §2.9）。
- **KD-2** 迁移形态 = **host 装配（保留端壳对象/槽/工具装饰/回调面）+ 核 `runAgent` 主循环**——不采「核内嵌端装配钩子」形态（防核内端名分支 ∕ 契约 5/10）。
- **KD-3** **history 锚**：VSC 维持 history 载体形（`CARRIER_FIELDS` 14 绑定不变）；`history` 数组稳定性 = **访问器锚**（`agent.history` 访问器 setter 原位回收——VSC 既有访问器先例 `agent.mjs:149-155` 同法）；核替换点审计 = `context.mjs:219/:227/:242/:426` 四处（若审计发现「赋值后仍持新数组局部」的核路径 ⇒ 改采备选 `opts.historyAnchor` ∕ 核内窄改，+≈8 行）。
- **KD-4** 核侧增补 = §2.5（6 组 9 小项，全 additive ∕ 缺省零变）；不做核件重设计；可降级项（E2 ∕ 件 1-⑥）缺省取向 = 取核形（§2.10——§4 报请）。
- **KD-5** 回归面 = 批次本地对拍件 + 冒烟 + 结构机检（不在本批重建端侧全量套件——存量已清，F4）。
- **KD-6** 边界 = B2 ∕ B3 ∕ B4 ∕ B7 零触（§2.1）；挂起收编与 B2 同拍（调用面保持）。
- **KD-7** CLI 半同批（父侧判）。

**上抛项（发现逐条）**：

- **F1（已裁）** 文档冲突 = 09-20 §2.21「判保留 ∕ 参考实现 ∕ 端侧接线不构成义务」4 档语句 vs 本批收编——父侧 2026-09-29 裁定 **取新（收编）**；收正形与坐标见 §2.9；窗口 = 同实施轮。
- **F2（对照前提修正）** 「对照组：desktop ∕ CLI 已消费核件」对**循环面**成立、对 **CLI 挂起面不成立**（`cli/src/tui/suspension-drive.mjs` 未消费核件——已在射程内，§2.4-2）。
- **F3（新增受影响档）** `image-handler.mjs:92` 第三 `runAgent` 消费点（fork 签名）不在原 21 档清单 ⇒ 受影响表 +1（§2.6）。
- **F4（登记）** 端侧测试树全清 ⇒「行为零变」无存量对拍面；判据改按 §2.7 四类（非本批修复面）。
- **F5（预算偏离）** 核侧实点 6 组 9 小项（原估 +2~3 导出）；偏离理由逐项在 §2.5；可降级项缺省取向见 §2.10。
- **F6（核内不一致）** `finishSuspension` aborted 全清 ∥ 核 run-stages 已「只清已死」（§6.20 批 4 归一）——核增补 D 修正（desktop 同受益）。
- **F7（行为收窄）** 取核形使若干端差收窄（suspension 计数口径 ∕ `aggregate` 宽松 ∕ D5 `file_ops` 覆盖面——缺省取核形，§2.10-②）——逐条在册（§2.3 ∕ §2.5），随设计评审核。
- **F8（档面）** `VSC-DEBT.md §12.1` 读数实施后大幅变动（5344 → ≈2187）——实施轮同笔刷新。

### 2.9 实施轮须收正的权威档清单（防漏改 · 逐处给行号）

> **依据链（取代 09-20 §2.21 裁定）**：① 指令优先级——用户 2026-09-29 04:25 全修令（批档 `docs/batches/2026-09-29-parity-closeout.md` §1.2–§1.3）＞ 09-20 批内裁定（旧措辞本身即「登记后保留」形态）；② 在案判据（2026-09-28）「用户可见端差 = 缺陷；唯一例外 = 宿主能力面（须实证）；登记后保留通道已废」——挂起驱动分叉**无宿主约束**；③ 全修射程含「VSC ∕ CLI 收口核」（归批表 B1）。
> **取代句（收正形 · 无修订式残句）**：「核 `thincoder-core/agent/suspension.mjs`（`startSuspension`）= **参考实现**（唯一消费者 = 核测）；挂起面**权威 = 两端驱动**（已分叉 · 判保留）」⇒「**挂起面单源 = 核驱动（三端消费）**——CLI ∕ VSC ∕ desktop 皆以 `startSuspension` 为唯一驱动，端差只在装配面（carrier ∕ hooks ∕ 输入缝）」。

| 档 | 逐处坐标 | 收正内容 |
|---|---|---|
| `docs/core/design/AGENT-LOOP.md` | `:77-78`（§2.3 现态块）· `:136`（验收点 5「驱动面判保留」）· `:66`（§2.2 #184 行）· `:71` ∕ `:74`（行数句——旧读数 362 ∕ 299 ∕ 234；实读 484 ∕ 372 ∕ 281）· §6.18 表 | 现态块 ⇒ 取代句；验收点 5「驱动面不退化 ∕ 核档 = 参考实现」⇒ 单源句；§6.18 补 VSC 接线事实（核 runAgent ∕ 核驱动装配面）；`:71` ∕ `:74` 行数句按实施后读数刷新 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | `:977` | 同句 ⇒ 取代句（含依据链一行） |
| `docs/core/design/AGENT-LOOP-UPSTREAM.md` | `:431` | 同句 ⇒ 取代句 |
| `docs/core/design/CORE-UNIFICATION.md` | `:1094`（表 10 行）· `:1300`（载体行「端侧判保留」）· `:1325`（#184 行「判保留」）· `:1946-1947` | 逐处 ⇒ 单源句（载体行 ⇒ 「VSC 传 `history` ∕ CLI 传 `agent`——装配面注入，见 `AGENT-LOOP.md` §2.3」） |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | §6.8 端壳驱动现状句（实施轮实扫定位） | 端壳驱动 ⇒ 核驱动消费事实 |
| `docs/vsc/design/VSC-DEBT.md` | §12.1 读数表（逐档行） | 行数刷新（§2.6 估） |
| `docs/core/design/WORKSPACE.md` | 技能面 VSC 自持句（实施轮实扫） | VSC 转口事实 |
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | `:171`（分隔符端差句）· `:109`（SWR 消解句）· `:99-102`（镜像 ∕ 单源句） | 取核后事实（端差句退场——双改纪律随取核消失） |
| `docs/vsc/design/WEBVIEW*.md` | 挂起 ∕ 循环接线句（实施轮实扫） | 端接线事实收正 |
| `thincoder-vscode/AGENTS.md` | 模块表（实施轮实扫） | 删档随动 |

> **窗口**：收正与实施轮**同笔**（相抵期至实施轮末——与 B2 先例同款）；上表为防漏改清单，实施轮逐处核销。

### 2.10 待裁项（缺省取向已写定——§4 报请 · 用户可翻转）

| # | 项 | 现状对照（实读） | 缺省取向 | 行为面 | 翻转 ∕ 退路 |
|---|---|---|---|---|---|
| ① | 件 1-⑥ 派发级并发帽 4 | VSC 单批只读工具并发帽 4（`run-helpers:86` `MAX_PARALLEL_SUBAGENTS`——`execute-tools.mjs:321` `runWithLimit(batch, runOne, …)`）∥ 核无派发级帽（`dispatch.mjs:224` Phase-2 `Promise.all` 无上限） | **取核形**（帽随取核取消） | **行为变更登记**：单批只读工具并发上限由 4 取消——并发度 = 批内条数（时序 ∕ 资源占用面，用户可见差） | 用户可翻转 = 保留端帽（host 包装层）；翻转落 §2.3 件 1-⑥ 行 |
| ② | E2 D5 冻结面 `file_ops` 覆盖面 | 端宽（`FILE_MUTATORS ∪ file_ops`）∥ 核窄（`dispatch.mjs:129` 仅 `FILE_MUTATORS`） | **取核形**（核面补 `file_ops` 一行集合——§2.5-E2） | 冻结门覆盖面与端对齐（罕见路径——取核后门禁不因收编变窄） | **降级留实施实证退路**：实施轮实证罕见路径无影响 ⇒ 退降级（登记差额 + 影响面在册）；翻转落 §2.5-E2 行 |

> 口径：两项缺省已写定 ⇒ P4（循环收编）可进；§4 报请后若用户翻转，按「翻转 ∕ 退路」列改对应行。

### 2.11 修正轮记录（评审轮次 1 · 12 条逐条落位）

> 评审 = §3 轮次 1（pass · 🟡10 ∕ 🔵2，12 条）；处置执行 = eng-designer（父侧逐条裁定接受）。下表 = 发现号 → 落点（节内锚）。

| # | 处置 | 落点 |
|---|---|---|
| 1 | 现值补 + Δ 标注 | §2.6 `dispatch-gates.mjs` 行（241 ∕ **126**）· CLI `command-interactive.mjs` 行（**187** ∕ ±0） |
| 2 | 路径收正 | §2.6 CLI 行 → `src/command-interactive.mjs` |
| 3 | tier 结论句 ×2 | §2.6 CLI `agent-turn.mjs` 行（保留 + 债务登记）· 核 `agent.mjs` 行（登记拆分债务 + 本批增量最小化注记） |
| 4 | env 身份行二择一 + 取定 + restart 闸 ∕ time 尾位落点 | §2.3 件 1「输入段三项落点」专段（§2.2 行 8 ∕ 输入段行指针同改） |
| 5 | 指针收正 §2.5-D → §2.5-E1 | §2.2 行 11 · §2.3 件 1-③ |
| 6 | 删勘误行 + 「CLIT」收正 | §2.7（勘误行删除——其内容已兑现于 §2.4-1）· §2.4-1「CLI 侧」 |
| 7 | 测试面入表 | §2.6 测试面两行（对拍件 + 核测宿主 + 现值 ∕ Δ）+ §2.7 判据 1 交叉指 |
| 8 | 缺省取向写定（⑥ ∕ E2 = 取核形） | §2.10 待裁节（§2.3 件 1-⑥ ∕ §2.5-E2 ∕ 可降级标注 ∕ KD-4 同步） |
| 9 | 面板推送腿钉缝 | §2.3 件 1 逐段对位「面板推送腿」行（回调名 `onTurnEnd` + 载荷 `(agent, turn)` + 比对规则三腿） |
| 10 | 维持（同笔窗口已在册） | 不改——§2.9 窗口句 + F1；兑现于 P5 文档面收正 |
| 11 | 数值口径统一 | §2.5 总估句（35–45 带 + 逐项 ∕ 行级合计）· §2.6 核小计（+≈35–45）· VSC 小计（中线带注明） |
| 12 | §2.9 补坐标 | §2.9 `AGENT-LOOP.md` 行（`:71` ∕ `:74` 行数句） |

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = `docs/batches/2026-09-29-parity-b1-vsc-core.md` §2（设计轮）· 只读本档。
**限制声明**：未提供 Project Standards ∕ Document Map ⇒ 方法论合规与文档归属判据按根 `AGENTS.md` + 本档自身规范评定（降级）；归批表 B1 ∕ annex 原文不在评审范围 ⇒ 需求逐行覆盖只对本档 §2.1 映射表自洽性核，**annex 侧未复验**。
**实读抽查（仅供计数 ∕ 坐标核对，非扩面评审）**：现值列 13 档全中——VSC `agent.mjs` 456 ∕ `agent/setup.mjs` 429 ∕ `agent/run-stages.mjs` 422 ∕ `extension/suspension.mjs` 484 ∕ `extension/skills.mjs` 119 ∕ `extension/peer-claims|domains|instances.mjs` 208 ∕ 265 ∕ 183；CLI `tui/suspension-drive.mjs` 372 ∕ `tui/agent-turn.mjs` 416；核 `agent.mjs` 462 ∕ `agent/suspension.mjs` 281 ∕ `agent/dispatch.mjs` 241。坐标亦中：`image-handler.mjs:92` fork 签名、`agent.mjs:39-43` CARRIER_FIELDS 14 款、`:149-155` 载体访问器、`setup.mjs:413` 注入序位（peer 后 ∕ time 前）、`panel-turn-loop.mjs:118`、核 `suspension.mjs:107-115`（aborted 全清）、`dispatch.mjs:119-129`（D5 面仅 FILE_MUTATORS）、`agent-turn.mjs:17/:187`、`AGENT-LOOP.md:66/:77-78/:136`。**未复验**（随标）：VSC 测试两册「均空」、CLI 树对 `agent/suspension` 零 import 的穷尽性、件 4 ∕ 件 5 所列核导出清单、`VSC-DEBT §12.1` 读数、§2.9 中 `CORE-UNIFICATION.md` ∕ `MULTI-INSTANCE-COLLAB.md` ∕ `WORKSPACE.md` 坐标。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size | 🟡 | §2.6 现值列两处留空：「核 `agent/dispatch.mjs` ∕ `dispatch-gates.mjs`」行（:229「241 ∕ —」）与 CLI `command-interactive.mjs` 行（:225「—」）。两档均可实读计得（抽查：`thincoder-core/agent/dispatch-gates.mjs` ≈126 行 · `thincoder-cli/src/command-interactive.mjs` ≈187 行）⇒ 当前行数 ∕ 预期 Δ 标注不完整 | 两行补现值 + 预期 Δ 标注（口径同 §2.6 表头 `readFileSync(...).split("\n").length`） |
| 2 | Clarity | 🟡 | §2.6 CLI 行路径不准：:225 写作 `src/tui/command-interactive.mjs`，实档在 `thincoder-cli/src/command-interactive.mjs`（`src/tui/` 下无此档；`list` ∕ `glob` 仅此一份） | 该行路径改为 `src/command-interactive.mjs` |
| 3 | Affected-file size | 🟡 | 变更后仍居 >300 线的两档无拆分评审句：核 `agent.mjs` 462 → ≈468（:227——其 `runAgent` 自 :102 起至档尾 :461 闭合，≈360 行，函数层首判据）· CLI `tui/agent-turn.mjs` 416 → ≈410–416（:224）。<500 硬限未破 | 两行各补 tier 结论（主动拆分评审 ∕ 「保留 + 债务登记」句） |
| 4 | Clarity | 🟡 | `envStateLine` 归置 = 悬空引用：§2.2 :68「（envStateLine 二择一**见件 1-④**）」与 §2.3 :96「（**下 ④**）」所指的 ④ = :104「manifest 门 L3 + 认领/足迹 → 件 5」——二择一的选项从未列出；同行 `restart 闸` ∕ `time 尾位包装` 亦无明确落点 | 写明二择一选项 + 取定结论，并补 `restart 闸` ∕ `time 尾位包装` 的归置落点 |
| 5 | Clarity | 🟡 | §2.5 组号指针陈旧：:71（§2.2 行 11）与 :104（件 1-③）把动作谓词面指到「§2.5-D」，而 §2.5 :187 该面标号 = **E1**（D = `finishSuspension` aborted 支对齐，:186） | 两处指针改为 §2.5-E1 |
| 6 | Doc hygiene | 🟡 | 设计面留修订式残句：§2.7 :257「**勘误**：§2.4-1 首行「CLIT 侧」＝「CLI 侧」」；且 :155 的「CLIT 侧」未改（勘误指位与实际残留位不符——:154 首行无该笔误） | 删 :257 勘误行（历史归记录面），并把 :155 的「CLIT 侧」改为「CLI 侧」 |
| 7 | Acceptance | 🟡 | 测试面未入受影响表：§2.7 :240 判据 1 的新档 `docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs`（实施者自写自跑）与 §2.6 :230「核测补面（对 B ∕ C ∕ D ∕ E 各一用例）随实施轮」的目标档，均无行 ∕ 无现值 ∕ 无 Δ | 在 §2.6（或 §2.7 邻位）列出测试面：对拍件 + 核测各用例宿主档 + 现值 ∕ Δ |
| 8 | Scope | 🟡 | 两项待裁未定、且为 P4 前置（协调项）：件 1-⑥ 派发级并发帽 4（:104「建议取核形 ∕ 用户裁」——取核形 = 用户可见行为变更）与 E2 `file_ops` 覆盖面（:188 可降级项，:190 ∕ :277 登记），缺省取向未定 | 把 ⑥ ∕ E2 的裁定与缺省取向写定并入册后再进 P4；若判「取核形」同步补行为面登记句 |
| 9 | Clarity | 🟡 | 面板推送腿迁移形态留待实施轮：:100「**adapter**：改挂宿主回调面（`onToolResult` 尾部比对 ∕ `onTaskUpdate` 既有缝）| 差额核查项——实施轮定形」——本批硬约束 = 「VSC 行为零变」，该臂无可机检定形 | 钉到单一缝（回调名 + 载荷 + 比对规则），使行为等价在 P4 可判 |
| 10 | Document ownership | 🟡 | 权威档现载旧机制、与本档 §2.9 取代句相抵至实施轮：`AGENT-LOOP.md:77-78`（「= **参考实现**（唯一消费者 = 核测）；挂起面**权威 = 两端驱动**……**判保留**」）与 `:136`（「**驱动面判保留**」）实测仍在。已登记（F1 + §2.9 逐处坐标 + 用户裁定取新）⇒ 按登记态报告，不阻塞 | 兑现 §2.9「同笔」窗口：收正按「取代」落文（非并注），与 P1–P4 同轮完成 |
| 11 | Affected-file size | 🔵 | 数值漂移：核侧总估 §2.5 :191「≈35–45 行」∥ §2.6 :230「+≈40–45 行」（§2.5 逐项合计 = 35）；VSC 小计 :222「≈2180–2300」与逐档区间合计 2041–2361 不吻合（现值合计 5344 自洽 ✓，−57% 与 §2.6 :291 一致） | 统一核侧总估口径；小计区间与逐档上下界对齐，或注明为中线带 |
| 12 | Document ownership | 🔵 | §2.9 防漏改清单未覆盖 `AGENT-LOOP.md:71` ∕ `:74` 的行数句（362 ∕ 299 ∕ 234 行——实读已 484 ∕ 372 ∕ 281，实施后更远） | §2.9 的 `AGENT-LOOP.md` 行补 `:71` ∕ `:74` 两处坐标 |

**计数**：🔴 0 ∕ 🟡 10 ∕ 🔵 2（合计 12）——无阻塞项：射程 ∕ 五件方案 ∕ CLI 半 ∕ 核增补 ∕ 回归判据 ∕ 实施序齐备，坐标与现值抽查全中，KD-1–KD-7 与 §2.9 防漏改清单在册。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 2026-09-29 05:0x）

- **依据** = 十批全修令 + 排空授权执行口径（三条件：评审 pass ∧ 修正落地核验 ∧ token 在位）——评审 **#71 pass**（0🔴）；修正轮 **#74 落地已核**（12 条：11 落 + 1 维持〔同笔窗口在册，评审建议自述不阻塞〕）；token 在位。
- **§2.10 两项缺省取向 = 取核形**（① 派发级并发帽 · ② E2 `file_ops`）——按设计缺省报请；行为变更登记句在册；**可翻转**（用户一句话即改）。
- **F 项随修正轮取定**（核 ≈2 行：`setup-reminders.mjs:41` 端名缝取用）——计数同步 **6 组 9 小项 ∕ 核 6 档**（修正轮披露在册）；VSC ∕ CLI 零端差。
- **观察项在册**：① desktop `envStateLine` 自持面未实证（实施后复核）；② desktop `.thincoder/tmp/_c5-*.log` 陈旧报错行（另挂台账——父侧裁）。
- **实施 = P1–P4 分波**（§2.7）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（P5 收口波：文档面 §2.9 逐处 + src 注两处；审计 CLEAN ∕ 评审 pass（1 修正轮））

### 5.P1 交付摘要

- **落位（单档）**：`thincoder-vscode/src/extension/skills.mjs`（119 → **6 行**，§2.0 口径实读）；转口形逐字合 §2.3 件 4——`:5` `export { loadSkillsSync as loadSkills, readSkillSync as readSkill, formatSkillListing } from "@thincoder/core/skills.mjs"`；档头陈旧坐标注（旧注引「cli skills.mjs :51-109 ∕ :116-122 ∕ :130+」）随转口收正（件 4-④）。
- **调用面零改**（硬约束 · 实证）：三消费档未动——`src/agent/setup.mjs:35`（loadSkills ∕ formatSkillListing）· `src/agent/setup-tooltable.mjs:20`（loadSkills ∕ readSkill → `:83` 喂核 `configureSkillLoader`）· `src/extension/panel-turn-loop.mjs:19/:84`（loadSkills）。本席本波落笔面 = 该单档；工作树其余变更属平行批 ∕ 在途，非本波。
- **单源达成**：VSC `src/` 内零第二实现（`loadSkillsFromDir|tryReadSkill|NAME_RE` grep 零命中）；核 sync 面已在（`thincoder-core/skills.mjs:117` formatSkillListing ∕ `:214` loadSkillsSync ∕ `:224` readSkillSync）。
- **行为零变**：纯再导出 ⇒ 消费者取得 = 核函数本体（同引用三断）；另以旧端快照差分对拍 23 断全过（见下）。
- **射程纪律**：核 `skills.mjs` 零改 ✓ ∕ CLI 零触 ✓ ∕ 其余 VSC 档零触 ✓（本波落笔 = 单档）。

### 5.P1 改动表（file:line）

| 档 | 变更 |
|---|---|
| `thincoder-vscode/src/extension/skills.mjs` | 全档改写 119 → 6 行：`:1-4` 新档头（单源 = 核 ∕ 同步 loader 面 ∕ 消费者保形）；`:5` 再导出句（设计转口形逐字）；旧自持实现全删（5 函数 + `NAME_RE` + `node:fs`/`node:path`/`node:os` 三 import） |
| `.thincoder/tmp/p1-skills-parity.mjs` | 新建（验证面 · gitignored）：对拍件终版 |
| `.thincoder/tmp/p1-vsc-skills-baseline.mjs` | 新建（验证面 · gitignored）：旧端快照（差分旧侧） |
| `.thincoder/tmp/p1-skills-parity.log` | 新建（验证面 · gitignored）：运行读数日志 |

### 5.P1 验证（命令与读数）

- `node .thincoder/tmp/p1-skills-parity.mjs` ⇒ **ALL PASS（0 fail）**（日志 = `.thincoder/tmp/p1-skills-parity.log`）：
  - 读值：新档 **6** 行 ∕ 旧档快照 **119** 行；导出面 = `formatSkillListing,loadSkills,readSkill`（旧 = 新，无面收窄）。
  - 身份：`loadSkills === core.loadSkillsSync` · `readSkill === core.readSkillSync` · `formatSkillListing === core.formatSkillListing`。
  - 行为夹具：项目层发现 `alpha,gamma,beta`（子目录段先 ∕ 扁平段后 ∕ 无效名跳过 ∕ 同名子目录胜扁平）；`readSkill` 6 例（命中 ×2 形 ∕ 未命中 ∕ `../evil` ∕ 含空格名）；`formatSkillListing` 0/1/3/5 项。
  - 用户层支（子进程 `USERPROFILE` 换夹具 home）：项目层胜（alpha 唯一条 · 用户层同名跳过）· 用户层独有 `zeta` 追加 · 段序「项目层段先于用户层段」。
  - 说明符实路：`@thincoder/core/skills.mjs` 经 VSC 包解析 = `D:\teamcode\thincoder\thincoder-core\skills.mjs`（junction 活核树）。
- `npm run lint`（thincoder-vscode = `node scripts/check-syntax.mjs`）⇒ `check-syntax: 140 JS files OK`。
- **出货路径补证（消解评审 🟡-1）**：`npm pack @thincoder/core@0.9.5`（integrity 与 `thincoder-vscode/package-lock.json` 所锁同件）⇒ 包内 `package/skills.mjs` 与活核档 **byte-identical**（8713 B · sha256 `49d09471b83f9300…`），含 `loadSkillsSync ∕ readSkillSync ∕ formatSkillListing` ⇒ 干净安装（`npm ci` → registry 件）路径链接安全。
- 读回核验（D6）：新档 5 内容行 + 尾空行 = 6（口径同 §2.0）。

### 5.P1 决策透明表

| # | 决策 | 理由 | 消解 ∕ 登记 |
|---|---|---|---|
| 1 | 验证面落 `.thincoder/tmp/`（对拍件 + 旧端快照 + 夹具 + 日志） | 本波任务书明示「自建临时脚本（`.thincoder/tmp/`）」；tmp = gitignored | 批级归档件 `docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs` 未建——留 P5 ∕ §6 处置（评审 🟡-2 协调项） |
| 2 | 交付形态 = 纯再导出（6 行） | 逐字合设计转口形；行为零变 = 结构性保证（同引用） | — |
| 3 | 双证 = 身份断 + 旧端快照差分 | 差分补用户层 ∕ 无效名 ∕ 未命中支（审计命题） | 旧端快照出处未记 blob（评审 🔵-5，建议项） |
| 4 | 不触消费者注释 ∕ 核 ∕ CLI ∕ 其余档 | 「调用面零改」硬约束 + 单档射程 | `setup-tooltable.mjs:35-36` 陈旧注留 P5（评审计射程外注记） |

### 5.P1 审计与代码评审（轮次 · 终态）

- **explore 发散审计（轮 1）**：6/7 一致（转口形逐字 ∕ 行数 ∕ 调用面零改 ∕ 陈旧注收正 ∕ 核 sync 面在 ∕ 越界零）；1 条偏离 = §5 未落（本段即消解）⇒ 归零。
- **fix round 1（自修 · 采纳审计命题）**：① 对拍件加用户层夹具（子进程 `USERPROFILE`）；② 期望值动态化（机器无关）；③ 加旧档 `===119` 断言；④ 运行读数落 `.log`。
- **advisor 代码评审（轮 1）**：**pass**（0 🔴）。🟡2（均 advisory ∕ 非 must-fix）：① registry 0.9.5 干净安装路径未实证 → **评审轮后已补证消解**（上「出货路径补证」）；② 批级对拍归档面 = 协调项（本波授权 tmp；留 P5 ∕ §6）。🔵3（对拍件 :120 精确行数断言 ∕ :132 正则保形面 ∕ 旧端出处）——**不改动**（均非 must-fix；改动使评审对象失稳，已上抛）。
- **终态**：**clean**（0 未决 must-fix；未决面 = 🟡-2 与 🔵×3，均协调 ∕ 建议项，随交付报告上抛）。

### 5.P2 · peers 三档取核 + 调用点改造（VSC）· eng-coder · 2026-09-29

**交付摘要**（§2.3 件 5 逐条落位；射程 = 三档 + 该件点名调用点）：

| 档 | 现 | 后（`split("\n")` 口径） | 动作 |
|---|---|---|---|
| `src/extension/peer-claims.mjs` | 208 | **35** | 核单源转口（24 名）+ 旧名 alias（5 名）+ 根缝转口 |
| `src/extension/peer-domains.mjs` | 265 | **33** | 核单源转口（读面归核形）+ 认领面名面保形 |
| `src/extension/peer-instances.mjs` | 183 | **21** | 核单源转口（SWR 壳 ∕ 异步对偶 ∕ 端缝名退役）+ `prewarmPeerInstances` 薄转口 |

**调用点改造**（§2.3 件 5「端 adapter 改核形」）：`agent/execute-tools.mjs` L3 块 → 核 `peerCollabNote(agent,tool,args)`（执行前合成）+ `recordPeerWrites(agent,tool,args)`（写成功）+ `markClaimNoted`；`agent/run-stages.mjs` 回合收尾 → `flushPeerDomains(agent)`（去重集清空 = 其首步）；`agent/setup-reminders.mjs` peer 提醒 → 核 `pushPeerReminder` 转口（本地 SWR 同步读实现删）；`agent/setup.mjs` 装配点 → `await pushPeerReminder(agent)`。

**已登记差异**（取核形登记项，逐条给行为面）：
1. **认领载体**：端模块级 → 核 `agent._peerClaims*`（会话级 agent 内等价；agent 重建即重置——§2.3 件 5 ①「取核形（登记）」兑现）；
2. **落盘 cwd**：端原文 → 核 `normalizeCwd`（路径大小写归一——同上 ②）；
3. **记录 `end` 字段**：核 `END` 常量 "cli"（端原 "vscode"）——**用户可见面 = 跨端软提示 who 串误标**；父侧 2026-09-29 裁定 = 归核侧小件另单（本波只报不改核）；修法 = 核 `END`→`sessionEnd()`（同 §2.5-F 取缝，≈2 行）；
4. **分隔符**：多行提示行间 ∕ 附加分隔符 `\n\n` → 核形 `\n`（分隔符不属逐字锚——`MULTI-INSTANCE-COLLAB.md` §4.3 在册）；
5. **④ 面实缺陷修正（方向 = 修正）**：旧端 aggregate「由 sessionId 推 pid 未入判活批量」⇒ 该记录被误判死 unlink；取核后结构非法按缺失保留（实证：对拍 `D_retention` 旧 `f5002:false` → 新 `true`）；
6. **`prewarmPeerInstances` 薄转口保留**（父侧 2026-09-29 裁定 (A)）：`panel-session.mjs` 零改 ∕ 行为零变（取核后 = 核缓存预热）。

**验证读数**（自建临时脚本，`.thincoder/tmp/`；真目录零触——sessions ∕ peers 双缝注入）：见 §5 验证行的下一次 append。

### 5.P2 改动表（file:line）

| 档 | 变更 |
|---|---|
| `src/extension/peer-claims.mjs` | 全档改写 208 → 35 行：`:17-24` 核 24 名逐名转口（路径缝 ∕ 时钟缝 ∕ 读写面 ∕ 判据 ∕ 文案）；`:27-34` 旧名 alias 面（`readRecord` ∕ `registerClaims` ∕ `flushClaims` ∕ `markPeerNoted` ∕ `clearPeerNoted` ∕ `claimsOverlap`）；零本地实现（原模块级载体 ∕ `peersDirOverride` ∕ `readRecord` 等全删） |
| `src/extension/peer-domains.mjs` | 全档改写 265 → 33 行：`:20-24` 核读面转口（`peerWriteTargets` ∕ `peerDomains` ∕ `conflicts` ∕ `peerCollabNote` ∕ `recordPeerWrites` ∕ `flushPeerDomains` ∕ 两缝）；`:27-32` 认领面名面保形转口（旧 re-export 15 名 ⊂ 新面 + `markClaimNoted`）；原绑定对象查询 ∕ 聚合实现 ∕ `peerNotes` 全删 |
| `src/extension/peer-instances.mjs` | 全档改写 183 → 21 行：`:13-15` 核读面 + 工具转口；`:18-20` `prewarmPeerInstances` 薄转口；SWR 快照 ∕ inflight ∕ 端缝桥 ∕ `putSnapshot` 全删 |
| `src/agent/execute-tools.mjs` | `:17-19` import 改核三函数；`:190-193` L3 预检改 `peerCollabNote`（门控保持：`l3Paths.length > 0 && existsSync(manifestPath(cwd))`）；`:252-257` 写成功改 `recordPeerWrites` + `markClaimNoted` + `"\n" + text` |
| `src/agent/run-stages.mjs` | `:43` import 改 `flushPeerDomains`；`:414-419` 回合收尾改 `flushPeerDomains(agent)`（原 `clearPeerNoted + flushDomains(cwd)` 两行合一行）；`:300` ctx 解构去除已无消费者的 `cwd` |
| `src/agent/setup-reminders.mjs` | 删 `peerInstances` import + 本地 `pushPeerReminder`（12 行实现）；`pushPeerReminder` 入核转口面（`@thincoder/core/agent/setup-reminders.mjs`）；档头两处陈旧句随改 |
| `src/agent/setup.mjs` | `:407-410` 装配点 → `await pushPeerReminder(agent)`（核 async 形；时序不变：env-state 后 ∕ 编辑器注入与 time 尾位前） |

注：后四档为**消费面连带改动**（§2.3 件 5 点名 = execute-tools 调用点 + `setup-reminders:88` peer 提醒消费链；run-stages ∕ setup.mjs 为其直接消费面）——**P4 波在途**（件 1 将删 execute-tools ∕ run-stages ∕ 重写 setup∘setup-reminders），本波在其接管前保持树一致；`setup-reminders.mjs` 已于本波后被 P4 重写（`pushPeerReminder` 入其退役面——与取核方向一致）。

### 5.P2 验证（命令与读数）

- **三档对拍（old = HEAD 副本 `.thincoder/tmp/_p2-old/` ∕ new = 现树；同 fixtures 逐例）**：`node .thincoder/tmp/_p2-parity.mjs old|new` + `_p2-diff.mjs` ⇒ 14 例中 **SAME 8 ∕ DIFF 7**，差项逐条 = 已登记面：`end` 常量（A ∕ A续 ∕ B ∕ F 记录 + E self 条 = 登记 3）· 分隔符（`C_multi` = 登记 4）· ④ 面（`D_retention` = 登记 5）；`consts` ∕ `pathRoot` ∕ 单行提示文本（认领 ∕ 足迹）· 无命中 ∕ 门控 ∕ 工具输出（逐字）· 工具描述 = **逐字同**。
- **调用点对拍（executeToolBatches 实跑 ∕ finalizeAgentTurn 实跑 ∕ 核 `pushPeerReminder` vs 旧接线逐字复刻）**：`node .thincoder/tmp/_p2-callsite.mjs old|new` + `_p2-cs-diff.mjs` ⇒ 11 项 **掩码后 SAME 9 ∕ DIFF 2**（余 2 = 附加分隔符 `\n\n`→`\n`，即登记 4）；去重集 ∕ 记录 ∕ 无写入跳过 ∕ 提醒行（逐字 + transient）全同。**注**：new 侧末次重跑被 P4 在途阻断（`run-helpers.mjs` 已删 `MAX_PARALLEL_SUBAGENTS`）——上读数取自 P4 落笔前的稳定树；P4 落定后该对拍面随 dispatch 归核自然退役。
- **名面自检**：`_p2-surface.mjs` ⇒ `SURFACE: OK`（claims 30/30 · domains 26/26 · instances 3/3；消费档 `panel-session.mjs` ∕ `tools/index.mjs` import 名在位）。
- **结构对账**：`_p2-imports.mjs` ⇒ 本波面 17 档零问题（悬空 import 零）；**P4 在途面另有 24 处（`runAgent` ∕ `pushTimeReminder` 等——属件 1 在途，非本波）**。
- **行数（读回 · `split("\n")` 口径）**：35 ∕ 33 ∕ 21（结构机检 = `node --check` 三档 + 四消费档全过）。
- **定向复核（审计命题 C-E 序）**：同 self-pid 下 old ∕ new 两序逐例同（小 pid 同伴 ⇒ `[同伴, self]`；大 pid ⇒ `[self, 同伴]`——同一 `pid` 升序谓词，非行为差）。

### 5.P2 决策透明表

| # | 决策 | 理由 | 消解 ∕ 登记 |
|---|---|---|---|
| 1 | 三档取核形纯转口（端本地实现零保留） | §2.3 件 5「取核」逐条；防单源漂移 | 已登记差异 1–6（上段） |
| 2 | 旧名 alias 保留（6 名；签名 = 核形） | §2.3 件 5 ③「端侧 alias 保消费面」 | 评审 🔵：旧公开名 `_resetPeerClaimsForTest` 未获 alias ∕ `flushClaims` 实为旧内部名——随 P5 名差表按实读收正 |
| 3 | 调用点四档连带改动（execute-tools ∕ run-stages ∕ setup-reminders ∕ setup.mjs） | §2.3 件 5 点名 execute-tools 调用点 + `setup-reminders:88` 消费链；run-stages ∕ setup.mjs 为其直接消费面 | 报告已披露；P4 在途接管（件 1：删两档 ∕ 重写两档） |
| 4 | `prewarmPeerInstances` 薄转口保留 | 父侧 2026-09-29 裁定 (A)（`panel-session.mjs` 零改 ∕ 行为零变） | 已登记差异 6 |
| 5 | 分隔符取核形 `\n` | §2.9「端差句退场」+ 取核单源 | 已登记差异 4；评审 🟡-1：§2.3 该行「⑦ 保留」与 §2.9 同项措辞相抵 ⇒ §6 ∕ §2.9 收口定稿 |
| 6 | 沙箱根耦合退役（peers 根不再自动跟随 sessions 缝） | 核缝参数化（端壳零自持根状态）——沙箱测试改双缝注入 | **补登记**（审计 🟡-2）：VSC 测试树重建时按「sessions ∕ peers 双缝注入」约定（§2.7 判据 1） |
| 7 | 不触核件（`END`→`sessionEnd()` 等） | 本单禁触核件；END 项父侧裁归核侧小件另单 | 已登记差异 3；该单落地后回填核销 |

### 5.P2 审计与代码评审（轮次 · 终态）

- **explore 发散审计（轮 1）**：VERDICT = diverged——必改 1 项 = **§5.P2 未落**（本段即消解 ⇒ 归零）。另申报 3 项：① E 面数组序差 → **证伪**（同 self-pid 下 old ∕ new 两序逐例同：小 pid 同伴 ⇒ `[同伴, self]`、大 pid ⇒ `[self, 同伴]`——同一 `pid` 升序谓词；原差 = 两次进程 pid 值不同所致的排序落位，非行为差）；② `MULTI-INSTANCE-COLLAB.md` 收正窗口（§2.3「实施轮同笔」∥ §2.7 P5——**归 P5 明置**，本波零触文档）；③ 行数账 ∕ 口径漂移 ⇒ §6 ∕ P5 刷新。**越界 ∕ 静默降级 = 零**（审计原文）。
- **fix round 1（自修 · 采纳审计必改项）**：§5.P2 全段落盘（交付摘要 ∕ 改动表 ∕ 已登记差异 6 条 ∕ 验证读数）+ 补登记「沙箱根耦合退役」（采纳审计 🟡-2）。
- **advisor 代码评审（轮 1）**：**pass**（0 🔴）。🟡4（均 advisory ∕ 非 must-fix）：① 分隔符项设计两处措辞相抵（⇒ §6 收口定稿）；② 沙箱根耦合登记（本段已补）；③ 调用点四档**当前树不可复核**（P4 在途阻断——建议 §6 按核侧落点 `dispatch-run.mjs:52/64/65/115/133` ∕ 核 `run-stages.mjs:154` 核销）；④ `end` 登记项实效面复核成立（父侧已裁归核侧单）。🔵3：① 名差表按实读收正；② `peer-domains.mjs` 档头调用点指位随 P4 失效；③ 数值漂移四处（§2.6 peer-domains 估 60–100 ∕ 实 33 · peer-instances 估 10–20 ∕ 实 21 · §5「alias 5 名」实 6 · §5「14 例中 SAME 8 ∕ DIFF 7」和不符）——**不改动**（非 must-fix；P4 在途再改添乱，随 P5 清扫）。范围外注记 2 条：`session-slots.mjs:23-25/:55` 陈旧消费注 ∕ `panel-session.mjs:322-323` SWR 陈旧注 ⇒ 建议并入 P5 清扫。
- **终态**：**clean**（0 未决 must-fix；未决面 = 评审 🟡×4 + 🔵×3 + 范围外注记 2 条，均协调 ∕ 建议项，随交付报告上抛）。

**收尾补记（P2 · 同轮复核）**：登记差异 3（记录 `end`）已被**核侧小件落地消解**——实读核 `peer-claims.mjs:178` `payload.end = sessionEnd()` · `peer-domains.mjs:285` `end: sessionEnd()` · `peer-instances.mjs:149` `end: sessionEnd(), self: true`（另 `agent/setup-reminders.mjs:41` `${sessionEnd()}` = §2.5-F 同笔）；VSC 进程内 `setSessionEnd("vscode")` ⇒ 跨端 who 串零误标。**对拍复跑（核侧落地后）**：15 例 **逐字同 11 ∕ 仅实时戳差 2（B ∕ F 的 `updatedAt`）∕ 登记差 2**（`C_multi` = 登记 4 分隔符；`D_retention` = 登记 5 ④ 面修正）；原 7 差项中 `A_claimWrite ∕ A_claimRenew ∕ E_instances ∕ F_gate` 的 `end` 差**归零**。⇒ 未决差异仅余 4 项（1 载体 ∕ 2 cwd 归一——登记面；4 分隔符——待 §6 定稿；5 ④ 修正——方向 = 修正）。

### 5.F · 核端名缝小件（F 取定 + peers 写点）· eng-coder · 2026-09-29

**交付摘要**（射程 = 任务书：四写点 `END` → `sessionEnd()`；常量本体不动；核树其余 ∕ vsc ∕ desk 零触）：

- **四写点切换**（设计依据 = §2.5-F 取定 + §5.P2 登记差异 3「核侧小件另单」）——核侧写「端名」的硬编码常量 `END`（"cli"）全量改走端名缝 `sessionEnd()`：① `agent/setup-reminders.mjs:41` env 身份行；② `peer-domains.mjs:285`（`flushPeerDomains` 记录 `end`）；③ `peer-claims.mjs:178`（`flushPeerClaims` 记录 `end`——fill-if-missing 支）；④ `peer-instances.mjs:149`（`peerInstances` self 自述条 `end`）。
- **常量本体不动**：`session-slots.mjs:105` `export const END = "cli"` ∕ `:111` `let _end = END` ∕ `session.mjs:43` re-export 三处原样（初值语义保留——CLI 零声明即得 "cli" ⇒ **CLI 零变**）。
- **效果面**：B1-P2 后 VSC ∕ desktop 经核写 peers 记录 ∕ env 行 ⇒ `end` 不再误标 "cli"。VSC 模块求值期 `setSessionEnd("vscode")`（`thincoder-vscode/src/extension/session-slots.mjs:51`）⇒ 记录 ∕ 行取 "vscode"；desktop 声明点 = `thincoder-desktop/src/main/session-slots.mjs:72`（任务书已知事实）同法受益。

**改动表（file:line）**：

| 档 | 变更 |
|---|---|
| `thincoder-core/agent/setup-reminders.mjs` | `:32` import `END` → `sessionEnd`；`:41` `${END}` → `${sessionEnd()}`；`:6` 头注机制句收正（「END 常量先例：静态常量」→「端名先例：值 = 进程端名（§6.20 端名缝 sessionEnd()）」）；`:37` 档注收正（「pure, unit-testable」→「对入参 + 进程端名确定」——fix round 1 · 评审 🔵） |
| `thincoder-core/peer-domains.mjs` | `:24` import `END` → `sessionEnd`；`:285` `end: END` → `end: sessionEnd()` |
| `thincoder-core/peer-claims.mjs` | `:26` import `END` → `sessionEnd`；`:178` `payload.end = END` → `payload.end = sessionEnd()` |
| `thincoder-core/peer-instances.mjs` | `:29` import `END` → `sessionEnd`；`:149` self 条 `end: END` → `end: sessionEnd()` |
| `.thincoder/tmp/b1-end-seam.mjs` | 新建（验证面 · gitignored）：临时验证脚本（缺省 ∕ 声明两态 × 四写点 + 常量本体 + 静态面 ∕ 全核不变量；fix round 1 扩计数自证 + 全核扫描） |
| `.thincoder/tmp/b1-end-seam.log` | 新建（验证面）：运行读数（19 checks ∕ 0 fail） |
| `.thincoder/tmp/b1-end-fixture/` | 新建（验证面）：双缝夹具（sessions ∕ peers-a ∕ peers-b——真目录零触） |

**验证（命令与读数）**：

- `node .thincoder/tmp/b1-end-seam.mjs` ⇒ **ALL PASS (19 checks, 0 fail)**（读数 = `.thincoder/tmp/b1-end-seam.log`；脚本经 `pathToFileURL` 直引真模块、sessions ∕ peers 目录缝注入夹具）：
  - 缺省态（零 setSessionEnd）：`sessionEnd()==="cli"`；envStateLine 逐字 `env: cli`；`flushPeerClaims` ∕ `flushPeerDomains` 记录 `end==="cli"`；`peerInstances` self 条 `end==="cli"`（5 断言）；
  - 声明态（`setSessionEnd("vscode")`）：同上四写点全 = "vscode"（5 断言——跨端误标面消解实证）；
  - 常量本体：`END === "cli"` + session-slots.mjs 仍载 `export const END = "cli"`（2 断言）；
  - 静态面：四改动档零 `\bEND\b` 残留（4 断言）+ 全核取值位不变量（设计句「END 仅剩模块级初值」机检——全核 .mjs 扫描；允许位 = 常量本体 ∕ 模块初值 ∕ re-export 表；注释面跳过）（1 断言）。
- 读回核验（D6）：四档 grep 实读——`END` 取值引用零残留；核内剩余 `\bEND\b` = 常量本体 ∕ 初值 ∕ re-export 表 ∕ 注释无关词（explore 审计与 advisor 复核各自独立同判）。

**决策透明表**：

| # | 决策 | 理由 | 消解 ∕ 登记 |
|---|---|---|---|
| 1 | 注释面随写点收正两处（`:6` 机制句 ∕ fix round 的 `:37` 档注） | 注释与代码同步纪律——原句在切缝后失准 | 超 §2.5-F 估（≈2 行 = import + 写点）2 行；已披露 |
| 2 | peers 两档语义形逐字保留（claims = fill-if-missing；domains = 无条件重写） | 「只改写点取值」原则 | 语义后果在册（旧 "cli" 记录由后续写回合 domains 重写修复，窗口窄——审计观察） |
| 3 | 验证面落 `.thincoder/tmp/`（脚本 ∕ 日志 ∕ 夹具） | 任务书明示「自建临时脚本（`.thincoder/tmp/`）」；tmp = gitignored | **上抛**：§6 收口宜摘录本件读数（tmp 随清扫消失）——advisor 两轮 🟡 同向（§2.6 测试面代 B ∕ C ∕ D ∕ E 无 F 例；批档暂无 b1-end-seam 记录） |
| 4 | 射程 = 四核档；vsc ∕ desk ∕ cli 树 ∕ 其余核档零写 | 任务书禁止范围 | 零越界（审计 ∕ 复核双方核） |

**审计与代码评审（轮次 · 终态）**：

- **explore 发散审计（轮 1）**：**clean**——PARTIAL ∕ SILENT-SIMPLIFICATION ∕ DOC-DRIFT ∕ OUT-OF-LIST 四类全空；独立复核：全核 `\bEND\b` 逐条分类（无 MISSED 写点）· CLI 零变语义（`session-slots.mjs:111/113/115`）· 验证件判别力自检（未改则声明态断言必红）· 注释卫生（观察 2：log 计数簿记 ∕ fill-if-missing 窗口——前者随 fix round ② 消解）。
- **advisor 代码评审（轮 1）**：**pass**（0 🔴）——🟡2（批档设计侧足迹滞后 ∕ 验证面未锚定；均非 must-fix、协调项）+ 🔵3（`:37` 档注陈旧 ∕ 汇总行无计数 ∕ 静态面收窄）。
- **fix round 1（自修 · 采纳 🔵×3）**：① `:37` 档注收正；② 汇总行自证计数（`ALL PASS (19 checks, 0 fail)` 可复现）；③ 静态面扩为全核取值位不变量扫描（+1 断言）——重跑 19 ∕ 0。
- **advisor 代码评审（轮 2 · 修复 claim 复核）**：**pass**——三修复逐项复核成立；两项 🟡 仍开放、**非阻断**（待 §6 收口回填——§5.P2 决策 7「该单落地后回填核销」已在册）；残 1 可选加固（`VALUE_END_RE` 未覆盖 `return END` 类形——当前树零命中，非 must-fix）；轮 1 范围外注记（`classifyEnd` 对 desktop 端标签面）不变、无定级。
- **终态**：**clean**（0 未决 must-fix；开放面 = 批档 §6 回填 ∕ tmp 读数摘录，均父侧收口项）。

### 5.P3 · 挂起收编（VSC+CLI 取核装配 + 核增补 C ∕ D）· eng-coder · 2026-09-29

**交付摘要**（任务书 = §2.3 件 3 ∕ §2.4-2 ∕ §2.5 C ∕ D；与 B2 同拍——B2 已落（#69 ∕ §6）⇒ 本段适配其形：`queued-merge` 转口 ∕ `queued-pickup` 引用保持原样，均零触）：

- **核增补 C**（`agent/suspension.mjs`）：`ctx.inputQueue`（**可选** —— 宿主既有队列数组交驱动就地消费；缺省核内新建＝零变）· `ctx.takeInput(queue)` 取项缝（缺省 `shift`；可异步；返 null ⇒ 本步零动作落第 2 步）· `pushInput` 保留原值（去 `String()`）。≈+10 行。
- **核增补 D**（同档）：`finishSuspension` aborted 支改 `discardAbortedPool ∕ discardAbortedAdvisors`（§6.20 只清已死——存活 ∕ 已 settle 留池；与核 run-stages 回合尾中止同式）+ pending 单容器清 + 会诊清理两行保留。≈+6 行。
- **VSC 取核装配**（`extension/suspension.mjs` 484 → **265**）：状态机出核；本档留装配（carrier=history ∕ runTurn ∕ injectResidual ∕ timerFace ∕ hooks）+ 外壳（`panel._susp` 投影 ∕ abortControllers 快照 ∕ 退出落盘 ∕ 残输入兜底 ∕ `syncTimerWatch`）；`backgroundStatus ∕ poolLive` 薄化转口核面（`backgroundCounts ∕ poolLive`），`reassertLiveChildren` 保留，四消费档零改。
- **CLI 取核装配**（`tui/suspension-drive.mjs` 372 → **210**）：同上；导出面 6 名全保留（`poolCounts ∕ pendingFamilyCount ∕ pendingFamiliesNonEmpty ∕ allPendingEntries ∕ poolLive ∕ suspensionSession`——`agent-turn.mjs` 零改）；壳面（ticker ∕ `_suspAborted` ∕ `_suspWake` ∕ `backgroundStatusText` 文案 ∕ 渲染）保形。
- **父侧裁定两处形（本波实施，§1.5 在册）**：① C 缝含**可选 `ctx.inputQueue`**（VSC `susp.pendingInput` ∕ CLI `state.pendingInput` 有本波外的第三消费面——步边界 pickup（`queued-pickup.mjs`）∘ 容量/快照（`busyQueueItems`）∘ CLI 渲染——双队列必失配 ⇒ 同数组；`pushInput` 原值 + `takeInput` 缝照设计落）；② digest 帧 ∕ `digest:*` 日志**整体落 host runTurn 包装、不注册核 `hooks.onDigest`**（核钩在「非 Abort 失败」与「会话中止」两径不出 end——注册钩会丢 end 帧（ok=false）与 `digest:stopped` 日志＝行为差；desktop ∕ CLI 同款先例）。
- **清单外改动（1 档 · 披露）**：`thincoder-core/agent-tools/async-discard.mjs` `:97-101` 注入面载体守卫（`if (parent?.history) pushReal(...)`）——D 的数组载体必需：VSC 挂起 carrier = history 数组本体，`pushReal` 执行 `agent.history.push`（`context.mjs:102`）必崩；与对侧 VSC copy 的 `parent?.history` 守卫同判（§6.20.1「carrier 形无注入目标」先例）——agent 形（CLI ∕ 桌面 ∕ run-stages）仍走 `pushReal`（机器+人读双线，零变），数组形跳过注入但墓碑 ∕ `ev:discarded` 照发。

**改动表（file:line）**：

| 档 | 变更 |
|---|---|
| `thincoder-core/agent/suspension.mjs` | `:19-25` ctx 文档（inputQueue/takeInput 两缝）；`:113-128` D（discard 两单点）；`:180-190` 解构 + `pendingInput`（inputQueue 优先）；`:208-222` 步 1 取项缝（`await takeInput(...)` ∕ 缺省 shift ∕ null ⇒ 零动作）；`:289-291` `pushInput` 原值 |
| `thincoder-vscode/src/extension/suspension.mjs` | 全档改写 484 → 265：核驱动装配（`:193-225`）+ `driveTurn` 包装（digest 帧/日志 `:132-159`）+ `takeQueuedInput` 缝（`:122-128`）；`reassertLiveChildren`（`:60-89`）∕ `poolCounts`（`:45-50`）保留；`backgroundStatus ∕ poolLive` 薄化转口（`:42`） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 全档改写 372 → 210：核驱动装配（`:156-176`）+ `poolSnapshot` 读数单点（`:35-50`）+ `digestTurn`（`:85-101`）+ `driveTurn`（`:105-109`）+ `takeTurnInput` 缝（`:113-119`）+ `injectResidual`（`:122-131`）；壳面 ∕ 残输入映射（`:184-207`） |
| `thincoder-core/agent-tools/async-discard.mjs` | `:97-101` 注入面载体守卫（清单外 · 已披露） |
| `.thincoder/tmp/p3-*.mjs` ∕ `*.log` | 验证面（gitignored）：核 C∕D 对拍件 ∕ CLI ∕ VSC 宿主对拍件 ∕ 结构机检 ∕ W8 静态闭包扫描 ∕ vscode 桩+loader 三件 ∕ 5 日志 |

**验证（命令与读数）**（cwd = 仓根 `thincoder/`）：

- `node .thincoder/tmp/p3-core-suspension-parity.mjs` ⇒ **PASS 34 · FAIL 0**（C1 缺省 shift + 原值引用 ∕ C2 inputQueue 同数组批取 ∕ C3 takeInput⇒null 零动作不挂 ∕ C4 pushInput+wake ∕ C5 timer 第四态；D1 abort 只清已死（死出池/活留池/墓碑/提醒/会诊清/pending 清不注入）∕ D2 idle 残余直注入逐条；R1 计数与 poolLive 口径）。
- `node .thincoder/tmp/p3-cli-suspension-parity.mjs` ⇒ **PASS 23 · FAIL 0**（真模块直驱 `suspensionSession`：入口置位 ∕ 同数组消费 + 回执行 ∕ digest 三行（核 i18n 单源） ∕ 退出复位 ∕ 中止径残输入→state.queue+提示行+只清已死 ∕ idle 回填 ∕ 导出面）。
- `node --import ./.thincoder/tmp/p3-vscode-loader-register.mjs .thincoder/tmp/p3-vsc-suspension-parity.mjs` ⇒ **PASS 22 · FAIL 0**（真模块直驱 + `vscode` loader 桩（仓内 mock 符号链接随 09-28 测试树全清失效）：外壳 ∕ 进入退出帧 ∕ 忙态广播 ∕ 富条目消费 + busyQueued ∕ digest start/end 帧 + 回收帧 ∕ 中止帧 interrupted ∕ 残输入续发 ∕ settle 尾唤醒单注册可达（差额 5 实证） ∕ `reassertLiveChildren` 回归）。
- `node .thincoder/tmp/p3-host-structure-check.mjs` ⇒ **PASS 26 · FAIL 0**（导出面 4+6 名 ∕ 装配缝逐键 ∕ 不注册 onDigest ∕ 退役符号零残留 ∕ 核 C∕D 逐点 ∕ 行数读数）。
- `node .thincoder/tmp/p3-w8-scan.mjs` ⇒ **零 `node:sqlite` 静态可达**（可达 214 档；探针：核 `agent/suspension.mjs` ∕ `agent-tools/async-settle.mjs` 经新静态引可达且净）。
- `npm run lint`：VSC = `check-syntax: 135 JS files OK`；CLI = `116 file(s) OK`。
- 行数读数（§2.0 口径 `split("\n").length`）：VSC **265**（带 ≈230–280 ✔）· CLI **210**（带 ≈150–190，上浮 +20——见决策表 5）· 核 **297**（281→+16：C ≈+10 ∕ D ≈+6）。
- 差额实核：**CLI 差 5**（queued 口径 `agent._asyncQueue.length` ∥ 核池 `status==="queued"`）⇒ **同值**（入队/出队与 status 翻转同点：`subagent-run.mjs:206-208` ∕ `subagent-scheduler.mjs:386` `queue.splice(pick,1)[0].start()`）——`backgroundStatusText` 口径无需改；**CLI §2.4-1**（`command-interactive.mjs:135` 注释面实扫）⇒ 注文「prepareRun 发句即清」与核 `agent/setup.mjs` restart 消费自洽 ⇒ **准确、±0 零改**。

**决策透明表**：

| # | 决策 | 理由 | 消解 ∕ 登记 |
|---|---|---|---|
| 1 | C 缝增可选 `ctx.inputQueue` | 宿主队列有第三消费面（步边界 pickup ∕ 容量快照 ∕ 渲染）；双数组必失配（重复投递/残留） | 父侧裁定 ① 采纳；核 ≈+2 行（超 §2.5-C 估 ≈6 行面）；已披露 |
| 2 | digest 边界帧/日志留 host runTurn 包装（不注册 onDigest） | 核钩两径不出 end ⇒ 注册即丢帧/丢日志＝行为差 | 父侧裁定 ② 采纳；与 desktop ∕ §2.4-2 CLI 行同款 |
| 3 | `async-discard.mjs` 注入面载体守卫（清单外） | 数组载体 `pushReal` 必崩；agent 形零变 | 清单外 1 档（已披露）；对侧 VSC copy 同判先例 |
| 4 | 日志读数时机登记：abort 径 `ev:stopped.poolN` ∕ `susp:exit` 读值 = 核 D 清场后 | 核 finally 先清场、host 外壳后置（迁移前为 finally 内清场前读数）；丢弃明细另有 `ev:discarded` | 登记（日志面读数；用户可见面零差） |
| 5 | CLI 210 行（带 ≈150–190 上浮 +20） | 导出面 6 名全保留（§2.4-2 指令）∥ `backgroundStatusText` 文案面 ∥ 注入器/壳；硬限 500 未破 | 登记——§6 对账面（估算带，非机制句） |
| 6 | 残输入成功径取核 `done.residualInput`，失败径回落共享数组实况 | 非 Abort 失败径 `done` 拒绝 ⇒ 兑现值不物化（与 desktop 投影同因） | 行为零变（两条失败径 = 迁移前同源） |
| 7 | 验证面落 `.thincoder/tmp/`（授权面） | 任务书明示「自建临时脚本」；tmp = gitignored | 上抛：批档归档件（`docs/batches/*.test.mjs`）未建——P1 ∕ P2 先例，随 §6 处置 |

**审计与代码评审（轮次 · 终态）**：见下条补记。

### 5.P4-I（P4-I 波段 · 2026-09-29 · VSC agent 树退役 + 核增补 A ∕ B + 裁定①②）

**交付摘要**（射程 = VSC `src/agent.mjs` + `src/agent/*` 树 + 核 `agent/setup.mjs` ∕ `agent.mjs` 增补 + 裁定①`toolDecorate` ∕ ②memory 装配置）

- 删五档：`agent/context-injections.mjs` ∕ `execute-tools.mjs` ∕ `response-stages.mjs` ∕ `run-stages.mjs` ∕ `tool-gates.mjs`；`src/agent.mjs` 退役为**转口面**（仅 `ContinueError`）。
- 收缩四档：`run-helpers.mjs`（核单源转口 + `pushReal` 双数组 adapter + `agentState` ∕ 三 VSC 独有件）· `setup-reminders.mjs`（四域文本基座 ∕ `appendImagePointer` 转口 + R5 重启闸）· `setup.mjs`（host 装配：config ∕ 槽 ∕ 基础集 ∕ 镜像 ∕ 历史 ∕ manifest ∕ 记忆句柄 ∕ A2 ∕ A3 ∕ 贴图）· `tool-table.mjs`（基础集 + `vscSubagentFace` 装饰体）；`setup-tooltable.mjs` 仅缝保面（零结构改动）。
- 核增补（全 additive、缺省零变）：A1 `pushInjections`（序位 env → peer → injections → time）· A2 `opts.promptTail` 透传 → `prepareRun` skills 后追加 · A3 域文本推送 `turnDomainText ?? domainBase` · B 蒸馏 `distillSignal ?? signal` · 裁定① `toolDecorate` 透传 → `assembleFamilyTools({ decorate })`。

**决策透明表**（实际决断 — 依据 — 结果）

| # | 决策 | 依据 | 结果 |
|---|---|---|---|
| 1 | A1 ∕ A2 ∕ 裁定① 另需核 `agent.mjs` 三行 opts 透传 | 核 `runAgent` → `prepareRun` 传递面 | 已落；设计 §2.5 未列此三行 ⇒ 计入差额 |
| 2 | A3 落核 `agent.mjs` 域文本推送点（非 `setup.mjs`） | §2.5-A3「推送点」原文 | 已落 |
| 3 | `pushReal` = 核单源 + 双数组 2 行 adapter（非纯 re-export） | 保 `rules-face` ∕ `queued-pickup` 双数组消费面零破 | 已落（读数 V1） |
| 4 | `MAX_ADVISOR_PUSHBACKS` 未转口 | 核 helpers 无该导出；本波后零消费者 | 差额登记 |
| 5 | `escapeXml` 取核形（多转义 `'`、签名 `String(s)`） | §2.3 件 1「核单源」；端残留消费者 `async-discard` 行为微差 | 已落 + 登记 |
| 6 | memory 句柄 = 裁定②「装配置」 | 零可见变硬约束 + 形兼容实证（`.db` ∕ `docSearch` ∕ `search` ∕ `buildSummary`） | 已落；§2.6 表注「除 `memory` 项」**收正**为装配置补齐 |
| 7 | `goalTurns` 随 config 归一（缺省 null ⇒ 核默认 200） | §2.6 表注「host 装配须补」 | 已落（读数 V5c） |
| 8 | E1 ∕ E2（核分类面 ∕ D5 冻结面）本波不落 | 射程 = A ∕ B + 裁定①② | 路由（末段） |

**§2 A ∕ B 清单差额（实落 vs 设计 §2.5）**：① §2.5 只写 `prepareRun` 面，实落额外需 `agent.mjs` 三行 opts 透传（`injections` ∕ `promptTail` ∕ `toolDecorate`）；② `MAX_ADVISOR_PUSHBACKS` ∕ `shouldStopAfterToolBlock`（核 helpers 无对应导出）本波后零消费者，未转口；③ A3 ∕ B 缺省语义以 `??` 一字表达，与「默认零变」同判据。

**P2↔P4 三接点对账**（父侧指令 · 接点 → 新家逐点）

| 接点（P2 落点） | P4-I 终态新家 | 读数 |
|---|---|---|
| `recordPeerWrites`（写成功记录） | 核 `agent/dispatch-run.mjs:65` ∕ `:115`（工具执行点；`peerCollabNote` ∕ `markClaimNoted` 同址） | 同一性 + 调用点 + 沙箱动态（足迹登记 → 回合末整写）|
| `flushPeerDomains`（回合收尾） | 核 `agent/run-stages.mjs:154`（`finalizeAgentTurn` 内，VSC 经核 `runAgent` finally 到达；**首步清认领去重集**，旧端 `clearPeerNoted` 步被其吸收） | 空回合零落盘 ∕ 沙箱落盘 + 去重集清空 |
| `pushPeerReminder`（装配期） | 核 `agent/setup.mjs:141`（`prepareRun`；A1 注入块紧随其后，序位零变） | 无同伴 ⇒ 零提示零注入 |

结论：三接点**全部由核单源承接**，端侧零自持（VSC 转口面与核函数同一性已实证）——P2 端侧接线点（`execute-tools` ∕ `run-stages`）随本波删档自然退场，无遗失。

**登记句**（取核形 ∕ 行为变更，逐条）

- 并发帽（§2.10-①）：取核形 ⇒ 单批只读工具**无并发帽**（端旧 4 帽取消）——行为变更登记。
- 端独有 ⑤⑥⑦⑧（§2.3 件 1-③）：⑤ 每项 abort 预检 → 核批级；⑥ 并发帽（同）；⑦ 派生内停滞 → 核 `post-turn` 同义换位；⑧ 多模态提交 → 核 `record-results`（核更防御）。
- 贴图指针函数纯性：实核 = `appendImagePointer` 只改传入的临时消息对象（读数 V7a ∕ b ∕ c）。
- `_recordStore` ∕ `_historyWindow`（§2.6 表注）：端不挂 ⇒ 核 `pushReal` 走安全分支（无 eviction）；持久化仍走 `panel-callbacks`。
- `_logId` ∕ `_currentTurn` ∕ `_maxTurns` ∕ `_inflightTools` ∕ `_advisorAsyncAcks` ∕ `_advisorSyncCalls` ∕ `_engTaskAuthorized`：实核**零差**（核侧每轮写 ∕ 懒建 ∕ 子代面）——host 无需补齐。
- A2 尾块子代面：`opts.promptTail` 仅 host `hydrateRun` 写 ⇒ 核 spawn 的子代理不带该尾块（旧端子的子代理经端装配曾含——**残留未核**，路由第 3 条）。

**行数账**（实读 `split("\n").length`）：`agent.mjs` 10 ∕ `run-helpers` 89 ∕ `setup-reminders` 42 ∕ `setup` 298 ∕ `tool-table` 182 ∕ `setup-tooltable` 103 ∕ 核 `agent/setup.mjs` 253（+12）∕ 核 `agent.mjs` 467（+5）；删五档。`setup` 超 §2.6 估带（180–240）登记（≤300 咨询线内）。

**验证读数**（命令 → 结果）

- `node .thincoder/tmp/p4i-import-face.mjs` → 扫 440 档 **CLEAN**（唯一 KNOWN = `panel-turn-loop → ../agent.mjs : runAgent` = P4-II 边界）。
- `node .thincoder/tmp/p4i-w8-closure.mjs` → 本波 9 档静态闭包 **9/9 clean**（端壳入口违例链 = 他波 P3 `suspension` 在途）。
- `node .thincoder/tmp/p4i-core-additions.mjs` → **8/8**（缺省零变 · A1 序位 · A2 尾位 · 裁定①同一性 · A3 显式 ∕ 缺省 · B 显式 ∕ 缺省）。
- `node --import .thincoder/tmp/p4i-register-vscode.mjs .thincoder/tmp/p4i-vsc-host.mjs` → **16/16**（转口同一性 · pushReal · agent-state · 重启闸 · 域文本 · hydrateRun 端到端 · 装饰体 · 贴图三态 · 子代理路径 · settings 面 · 记忆句柄两态 · goalTurns）。
- `node --import .thincoder/tmp/p4i-register-vscode.mjs .thincoder/tmp/p4i-peer-wiring.mjs` → **5/5**（三接点）。
- 结构：五档删后无悬挂 import；本波 9 档零 `node:sqlite` 静态边。

**审计与代码评审轮次与终态**

- 偏离审计（explore ∕ read-only ∕ 1 轮）：2 条 PARTIAL（① §2.6 表注「host 装配须补」未落 + memory 无登记；② 本段未落）；SILENT-SIMPLIFICATION ∕ DOC-DRIFT ∕ OUT-OF-LIST 三类零发现 ⇒ 处置：① `goalTurns` 补齐 + memory 裁定② + 逐字段判读登记；② 本段。
- 代码评审（advisor ∕ code ∕ 1 轮）：VERDICT `changes-required`——🔴1（旧循环 `callbacks.onComplete` ∕ `agentState` 缝断：核 loop 零调用点 + 端 `agentState` 零消费者 ⇒ 干净回合槽回写与 webview `complete` 不复触发）· 🟡5（§2.5-E1 未落致端谓词零消费者 · P4-II `panel-turn-loop` 边界 · A2 子代尾块 · 面板推送腿回填零消费者 · 本段缺失）· 🔵2（行数漂移 · tmp KNOWN 陈旧）。
- fix round（射程内）：`tool-table` 头注收正（E1 实态）· tmp KNOWN 清陈旧（复读 CLEAN）· 本段落盘（含裁定①② ∕ 三接点 ∕ 差额 ∕ 读数）。
- **终态：本波射程内收敛；跨波 ∕ 需裁定项 5 条逐条路由（下）——1 🔴 交父侧裁决，不静默。**

**路由（交父侧 ∕ P4-II）**：① 🔴 `callbacks.onComplete(content, agentState)` 缝 —— 核 loop 无该调用，须 P4-II 循环包装在核 `runAgent` 干净返回处补调（或另裁缝位）；本波文件面不可闭。② 🟡 §2.5-E1（动作谓词采纳）+ E2（D5 冻结面 `file_ops`）= 核 `dispatch.mjs` 面改动，射程外——归 P4-II ∕ 另单。③ 🟡 A2 尾块子代理传递面（未核残留注明）。④ 🟡 面板推送腿回填（`syncToolDrivenDisplayState` 零消费者）= P4-II 钉缝（`callbacks.onTurnEnd`）。⑤ 🟡 P4-II `panel-turn-loop.mjs:17` 仍 import `runAgent`（装载期报错）。

### 5.P3 审计与代码评审（轮次 · 终态）· eng-coder · 2026-09-29

- **explore 发散审计（轮 1）**：VERDICT = deviations——必改 1 = **§5.P3 未落**（本段即消解 ⇒ 归零）；🟡2 = 行数带（CLI 210 上浮 +20 ∕ 核 297 +16——本段决策 5 ∕ §6 对账面）+ 清单外 1 档（`async-discard` 载体守卫——已披露）；四类中「静默简化 = 零」；连带观察两项（CLI 差 5 ∕ `command-interactive.mjs:135` 注释面）本段补记——**差额 5 实核 = 同值**（`subagent-run.mjs:206-208` 入队与 status 翻转同点 ∕ `subagent-scheduler.mjs:386` `queue.splice(pick, 1)[0].start()` 出队即转 running）⇒ `backgroundStatusText` 口径零改；**注释面实扫 = 准确、±0**（注文「prepareRun 发句即清」与核 `agent/setup.mjs` restart 消费自洽）。
- **fix round 1（自修 · 采纳审计必改项）**：§5.P3 全段落盘 + VSC 套件补 V5 settle-唤醒单注册用例（21 → **23**——差额 5「访问器别名下同数组」实证）+ W8 扫描件覆盖扩（下条）。
- **advisor 代码评审（轮 1）**：**pass**（0 🔴）——🟡2（均非 must-fix：CLI 行数带〔决策 5 在册〕∥ 批级归档件未建〔决策 7 上抛〕）+ 🔵6（读数漂移 ∕ W8 扫描件覆盖缺口 ∕ `thincoder-vscode/src/agent-tools/async-discard.mjs` 取核后成孤儿重复实现 ∕ CLI `digestTurn` 失败径 parity **unverified**（P3 前置版不在工作树）∥ 三处取核收窄需 §6 核销 ∥ `entry.cwd` 死参）。
- **fix round 2（自修 · 采纳 🔵）**：① **读数更正**——VSC 套件实计 **PASS 23 · FAIL 0**（V5 后补；上段「PASS 22」以本条为准）；② W8 扫描件正则扩 `export … from` 边后复跑（检出并行波 1 处违规——见下，非 P3 面）；③ 🔵×4（重复实现 ∕ digest 失败径 ∕ 收窄核销 ∕ 死参）与 🟡2 均属 §6 ∕ P5 ∕ 他波面 ⇒ 登记上抛，不阻塞。
- **终态**：**clean**（0 未决 must-fix；未决面 = 🟡2 + 🔵6，均协调 ∕ 登记项，随交付报告上抛）。
- **并行波观察（非 P3 面 · 供父侧）**：W8 扫描（扩边后）检出静态闭包 1 处 `node:sqlite` 可达——路径 = `extension.mjs → src/extension/chat-panel.mjs → panel-messages.mjs → image-handler.mjs:15（import { runVisionReader } from "@thincoder/core/vision-reader.mjs"）→ core vision-reader.mjs → core agent.mjs → agent/setup.mjs → memory.mjs:7（export … from "./memory/schema.mjs"）→ memory/schema.mjs`；`thincoder-core/vision-reader.mjs` = **未跟踪新档**（并行波在途）；**P3 新增静态边**（`extension/suspension.mjs:29` → 核 `agent/suspension.mjs`）经探针 ∕ 链路抽查 = **净**（不改 P3 结论）。

### 5.P4-II · 循环族后半（extension 面板 + 核增补 E ∕ 四项处置）· eng-coder · 2026-09-29

**交付摘要**（射程 = §2.3 件 2 四档 ∕ §2.3 件 1 后段三行 ∕ §2.5 E1 ∕ E2 ＋ 父侧 §1.8 携带指令 ①②③④）：

- **`panel-turn-loop.mjs`（187 → 310）全档重写为「host 装配 → 核 `runAgent` → 端壳续跑循环」**：`ro` 分流（host 装配载荷 = mcpServers ∕ images ∕ history ∕ fullHistory ∕ injections ∕ distillSignal ∕ engPersist ∕ 三段旗标 ∕ sessionSignal；`skills` 行删、`resume` 归核 opts）；装配 = `hydrateRun`（复用）∕ `setupAgentRun`（新建）**首段一次**（旧端每段重 hydrate 的形态随主循环退役）；核 opts 12 键全齐（signal ∕ resume ∕ autoTurn ∕ upstreamTurn ∕ timerTurn ∕ suspDriven ∕ consumeQueuedInput ∕ injections ∕ promptTail ∕ turnDomainText ∕ distillSignal ∕ toolDecorate）；三段循环（Ctrl+I ∕ ContinueError ∕ 错误面）保留。
- **三处 host 适配面**：① 载体面 `bindCarrierFace`（14 字段访问器别名 + 六容器预建 + `agent.history` 访问器锚——KD-3 原位回收）；② 完成面 `callbacks.onComplete(content, agentState(agent))` 落核**干净返回处**（🔴 P4-I 断缝闭证）；③ 推送腿 `attachToolDrivenLegs`（钉缝 `callbacks.onTurnEnd`——旧端 `agent.mjs:397-417` 块逐条迁入 + `syncToolDrivenDisplayState` 尾接）。
- **核增补 E1**（`tool.isReadonlyAction?.(args) ?? isSubagentReadonlyAction(…)` 同式两谓词 + dispatch 两门禁位消费）· **E2**（D5 冻结面外门扩 `file_ops`；批次档腿判据集不变 = `FILE_MUTATORS`）。
- **零改两档（核验为真）**：`panel-turn-stages.mjs`（两子项均在他处闭合：`ro.skills` 删点在 panel-turn-loop；`enterSuspensionTurn` 挂起入口 = P3 已落核驱动）· `image-handler.mjs`（前提已被 B4-W1 抽核改写——读图跑者现住核 `vision-reader.mjs`：核 `runAgent(child, task, {}, { depth:1, maxTurns:10, signal })` 签名 + 函数体内动态 import；端壳零 `runAgent` 调用，52 行）。

**改动表（file:line）**

| 档 | 变更 |
|---|---|
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 全档重写 187 → 310：`:26-33` import 面（`ContinueError` 保转口 ∕ 新增 `hydrateRun` ∕ `setupAgentRun` ∕ `agentState` ∕ `syncToolDrivenDisplayState`；`loadSkills` 删）；`:74-80` `CARRIER_FIELDS`（14 款，源 = 旧端 `agent.mjs:39-43`）；`:82-111` `bindCarrierFace`；`:113-141` `attachToolDrivenLegs`；`:151-310` `runTurnLoop`（`:160-171` ro 分流 ∕ `:180-193` coreOpts ∕ `:203-207` 循环头逐段取 `resume`+`signal` ∕ `:210-226` 首段装配 + 三适配面 + adapter 三键转交 ∕ `:227-231` 核调用 + 完成面 ∕ `:233-296` 三段 catch ∕ `:301-307` 取回面） |
| `thincoder-vscode/src/extension/panel-chat.mjs` | 两处注释收正（`:145-149` 蒸馏载具说明 → 核 `agent._pendingDistill` + 回合末回填；`:158-162` 核侧 N1 await 语义）；零逻辑改 |
| `thincoder-core/agent/dispatch-gates.mjs` | `:113-123` 新增 `readonlyActionOf` ∕ `controlActionOf`（钩子优先、`??` 回落核名面谓词；CLI ∕ desktop 零钩子零变） |
| `thincoder-core/agent/dispatch.mjs` | `:17-20` import 面（两谓词入、两旧谓词出）；`:57` planMode 门禁位换式；`:151` 权限短路位换式；`:119-133` E2 外门扩 `file_ops` + 批次档腿内移（判据集不变）；`:113-114` 旧注收正 |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs` | **零改**（核验：全档零 `skills` 命中；挂起入口经 P3 已核驱动） |
| `thincoder-vscode/src/extension/image-handler.mjs` | **零改**（核验：B4-W1 抽核后无 fork 签名调用；静态闭包 80 档零 sqlite） |

**验证（命令与读数）**（自建临时脚本 `D:\teamcode\thincoder\.thincoder\tmp\`——gitignored；批级归档件（`docs/batches/*.test.mjs`）= P5 落位，本波按 #87 先例 tmp 先行）：

- `node --import ./.thincoder/tmp/p4ii-register.mjs .thincoder/tmp/p4ii-loop-harness.mjs` ⇒ **PASS 68 · FAIL 0**（载体 = `vscode` ∕ 核 `runAgent` ∕ host 装配三桩 + **真** `buildPanelCallbacks`；日志 `p4ii-loop-harness.log`）：G1 装配/载体/完成/推送（39）· G2 Ctrl+I 续跑（6：核抛无 `.reason` ⇒ 回落 `signal.reason` 判据实证）· G3 ContinueError 两档（11）· G4 错误面（4）· G5 autoTurn guard 回收 ∕ Stop 不续跑（4）· G6 首段装配抛错不二次抛（4）。
- `node .thincoder/tmp/p4ii-core-dispatch.mjs` ⇒ **PASS 14 · FAIL 0**（真 `executeToolCalls`）：E1 ①–⑦（钩子优先 ∕ 回落 ∕ 钩子权威 ∕ 核内零钩子回归）· E2 ①–⑦（`file_ops` 冻结腿命中 move ∕ copy 两形、未命中放行、`FILE_MUTATORS` 冻结回归、批次档腿判据集不变、只读回归）。
- `node .thincoder/tmp/p4ii-structure.mjs` ⇒ **PASS 21 · FAIL 0**：行数账（见下）· 11 缝位断言（`runAgent` 静态引已清 ∕ 动态 import ∕ `onComplete` ∕ `onTurnEnd` ∕ 载体面 ∕ 首段装配 ∕ `ro.skills` 零残留 ∕ 逐段 signal ∕ 导出面三名）· VSC 全树 82 档零悬空静态 import · W8 静态闭包读数（见「登记」）。
- `cd thincoder-vscode && npm run lint` ⇒ `check-syntax: 135 JS files OK`；`node --check` 五改动档全过。
- 端 ∕ 核测试树：`thincoder-vscode && npm test` / `thincoder-core && npm test` ⇒ 两册 manifest 均空（2026-09-28 全清）⇒ **零用例 = 绿**；**未跑仓级套件**（父侧收口轮跑）。
- 行数读数（§2.0 口径）：`panel-turn-loop` **310**（带 180–200 —— 超带，见决策 1）· `panel-turn-stages` **241**（零改；带 235–240）· `panel-chat` **261**（带内）· `image-handler` **52**（旧带 130–140 已作废——B4-W1 抽核）· 核 `dispatch` **245**（241→+4）· `dispatch-gates` **138**（126→+12）。

**决策透明表（实际决断 — 依据 — 结果）**

| # | 决策 | 依据 | 结果 ∕ 登记 |
|---|---|---|---|
| 1 | 载体面 + 推送腿落 `panel-turn-loop.mjs`（非 `src/agent/setup.mjs`） | 派单禁触 `src/agent/*` 树（P4-I 域）；设计 件 1-⑥「随件 3 決策」未定落点、⑤「装配期绑定」只给类别 | 已落；**`panel-turn-loop` 310 超 §2.6 带（+110）**——超带构成 = 载体面 38 行 + 推送腿 29 行 + 首段装配/取回面 ~20 行 + 注释（设计带未预算 ⑥ 与 ③① 两项发现）；≤500 硬限未破、>300 建议线已破 ⇒ §6 收口处置（拆档 ∕ 债务登记） |
| 2 | 核 `runAgent` = **动态 import**（同档其余静态边全为净件） | W8 契约②（核 agent 链静态达 `node:sqlite`）；派单 ④「端接核 `runAgent` 的正式调用点即本波形」 | 已落；四条新静态边闭包实测净（114 ∕ 49 ∕ 45 ∕ 9 档，零 sqlite） |
| 3 | `signal` ∕ `resume` **逐段取**（coreOpts 初值 null，循环头赋值） | controller 重建（Ctrl+I ∕ ContinueError）后核必须拿新 signal（旧 signal 已 abort）；旧端调用点在循环内天然同义 | 已落；G2 ∕ G3 对拍实证（续段 signal ≠ 首段）——**实施中发现并自修**（首版快照式，harness 首跑红） |
| 4 | 装配只在**首段**（旧端每段重 hydrate 的形态退役） | 设计 件 1 目标形「装配 → runAgent → 续跑循环」；核 `resume` 语义要求段间保留 guard ∕ 变更记账（重 hydrate 的 `resetRunState` 会抵消） | 已落；G2 实证「装配不重入」（hydrateRun 恒 1 次） |
| 5 | goal 基准用**闭包**（`goalRef` ∕ `goalStatus`）承载（设计点名为 `_goalShownRef` ∕ `_goalShownStatus`） | 闭包随 `attachToolDrivenLegs` 每回合新建、自 hydrate 后 `agent._goal` 播种 ⇒ 跨批保留成立且基准不跨 run 陈旧 | 已落；审计判 🔵 形式项（非静默——注释述等价理由）；语义等价（批间无 goal 写点） |
| 6 | Ctrl+I 判据 = `e.reason ?? (回退) controller.signal.reason` | 核 interrupted-response 抛出物**不设** `.reason`（`agent.mjs:363` 只标 `abortInfo`）——旧端 `.reason` 由旧 response-stages 自设（`git show HEAD:…:50` 实证） | 已落；G2 实证（无 `.reason` 抛错仍续跑）；Stop（无 reason）两源皆空 ⇒ 中止分支语义与旧端同（G5） |
| 7 | 蒸馏载具桥：回合末 `agent._pendingDistill` → `panel._distillState.pending` | 核承载体 = `agent._pendingDistill`；面板 `prevDistill` 等待（AC6a：行加载**前** await）必须保有载具 | 已落；G1 实证回填；`panel-chat` 注释同笔收正 |
| 8 | 面板推送腿落本档（非 `panel-callbacks.mjs`） | 派单文件面 = 四档 + 核；`buildPanelCallbacks` 已 317 行（>300 既有面） | 已落；出单面改变为零（`panel-callbacks.mjs` 零改） |
| 9 | 首段装配抛错径补 `agent?.` 空守卫 | 装配（`hydrateRun` ∕ `setupAgentRun`）抛错 ⇒ `agent` 仍 null，取回面二次 TypeError 会掩盖原错 | 已落（审计 🔵 采纳）；G6 实证「不二次抛」 |
| 10 | `panel-turn-stages.mjs` ∕ `image-handler.mjs` 零改 | 两档任务书子项均已在他处闭合（见交付摘要）；`image-handler` 前提被 B4-W1 改写 | 已落（核验为真）；`image-handler` 旧带 130–140 属 §2.6 陈旧读数 ⇒ §6 ∕ P5 刷新 |

**登记（取核形 ∕ 行为变更 ∕ 跨波）**

- **E2 取核形兑现**（§2.10-②）：D5 冻结面外门 = `FILE_MUTATORS ∪ { file_ops }` —— 冻结门覆盖面与端壳对齐（收编不变窄）；**批次档写门判据集不变** = `FILE_MUTATORS`（`file_ops` 不入，与端壳旧形逐字同）。
- **E1 取核形兑现**：动作谓词钩子优先（VSC 装饰体 —— `git` ∕ `memory` ∕ 子代面）⇒ planMode 放行 git 只读动作、免审批；CLI ∕ desktop 零钩子 ⇒ `??` 回落核名面谓词，**逐字零变**（对拍 ⑥ 实证）。
- **件 1-⑥（派发级并发帽）**：取核形 = 无帽 —— 该形已在 P4-I 落（`run-helpers.mjs:8` 仅存退役注），本波零改点；行为变更登记句在册（§2.10-①）。
- **W8 静态闭包（跨波观察 · 非本波面）**：入口 `extension.mjs` 闭包 248 档仍可达 `node:sqlite` —— 链 = `extension.mjs → chat-panel → panel-messages → suspension.mjs → 核 agent/suspension.mjs → async-settle → spawn-child → agent.mjs → agent/setup.mjs → memory.mjs → memory/schema.mjs`；链内四边（核侧）**HEAD 已在册**，端壳暴露面 = P3 的 `extension/suspension.mjs` 静态边（P3 域，本波禁触）⇒ **§6 复扫裁决**（B4 面另裁）。
- **A2 尾块子代理传递面（父侧指令 ⑤ 顺带实证）**：`opts.promptTail` 仅有 host→核 单点（`hydrateRun` 写 ∕ 核 `prepareRun:247` 消费）；**子代装配全在核**（`spawn-child.mjs` → 核 `runAgent`，无 `promptTail` 传递面）⇒ VSC 通用子代理**无端差**（其装配历来内核侧）。唯一端壳子代理路径 = 旧读图跑者（深度 1），随 B4-W1 抽核后同样不带 host 尾块 —— 该子代理任务 = 一次性读图，尾块（`.cursor/rules`）无用户可见影响；差异登记（窄面）。
- **`src/agent/tool-table.mjs:29-31` 陈旧注**（审计 🟡）：注文仍述「§2.5-E1 未落」——E1 本波已落 ⇒ 注文失效；该档属派单禁触面（`src/agent/*`）⇒ **本波不改**，随 P5 文档面 ∕ 另轮收正（上抛）。
- **`image-handler.mjs` 旧行数带（130–140）**：B4-W1 抽核后现盘 52 —— §2.6 表读数陈旧，归 §6 ∕ P5 刷新。

**审计与代码评审（轮次 · 终态）**：见下条补记。

### 5.P4-II 审计与代码评审（轮次 · 终态）· eng-coder · 2026-09-29

- **explore 发散审计（轮 1）**：VERDICT = `diverged`——必改 1 = **§5.P4-II 未落**（本段即消解 ⇒ 归零）；四类偏差中「静默简化」「清单外改动」**零**；另报 ③ DOC-DRIFT 1 项（`src/agent/tool-table.mjs:29-31` 陈旧注——见「登记」）· 形式项 1（goal 基准载体 = 闭包 `goalRef ∕ goalStatus` vs 设计点名 `_goalShownRef ∕ _goalShownStatus`；审计判「语义等价且非静默」）· 健壮性 1（取回面空 agent 二次抛——已自修）。审计的两项 `unverified`（旧端逐字等价 ∕ 空 agent 径旧端同形）由本席以 `git show HEAD:…` 对读消解：旧端载体表 `agent.mjs:39-43`、绑定块 `:142-159`、onComplete 调用点 `:354`（`callbacks.onComplete?.(response.content, agentState(agent))`）、镜像回填块 `:397-417` 逐段与落形一致；旧端 `.reason` 自设点 `response-stages.mjs:50`（本波判据两源之据）。
- **fix round 1（自修 · 采纳审计命题）**：① 🔴 本段落盘（含改动表 ∕ 读数 ∕ 决策表 ∕ 登记）；② 取回面两处补空守卫（`agent?._inheritedGuard` ∕ `agent?._pendingDistill`——首段装配抛错径不得二次 TypeError 掩盖原错）+ harness 补 G6 组（4 断言）对拍；③ `p4ii-structure.mjs` 的 W8 断言改**实断言**（四条新静态边逐档闭包净 + panel-turn-loop 链归属既有边——替换原恒真打印式断言）。
- **advisor 代码评审（轮 1 · code）**：**pass**（0 🔴）——🟡1（`panel-turn-loop.mjs` **310 行**破 ≤300 建议线（≤500 硬限未破）；§5 决策 1 已登记 ⇒ advisory 非阻断）+ 🔵2（`:114` 注释「每工具执行轮末恰一次」与核 `completion.mjs:41/66/84/97/112/140` 六处同触不符（行为面超集调用、本腿幂等 ⇒ 零用户可见差）；§2.6 核侧估 +≈10 vs 实读 +16 的账差待 §6 回填）。评审另复核：🔴 三条携带指令（`onComplete` 缝 ∕ E1+E2 ∕ 装载期 import 清缝）**逐条为闭**；KD-3 替换点审计独立复读一致（核六替换点赋值后无新数组局部滞留）；行数读数与 §5 表逐项吻合；零发现三档（`panel-chat.mjs` ∕ `panel-turn-stages.mjs` ∕ `image-handler.mjs`）核验成立。
- **fix round 2（自修 · 采纳 🔵-①）**：`panel-turn-loop.mjs:113-115` 注释收正（改「轮末主触 + completion 段续跑支同触 ⇒ 超集调用，本腿幂等」）。重跑三件：**68 ∕ 14 ∕ 21 全绿**；行数 `panel-turn-loop` 310 → **312**（注释 +2；超带结论不变，随决策 1 交 §6）。🔵-②（§2.6 账差）属文档面 ⇒ 不触，随 §6 收口。
- **终态**：**clean**（0 未决 must-fix；未决面 = 🟡-① 拆档/债务登记（§6）+ 🔵-② 账差回填（§6）——均协调项，随交付报告上抛）。
- **范围外注记（不赋定级 · 交父侧路由）**：① `src/agent/tool-table.mjs:29-31` 陈旧注（「§2.5-E1 未落」）——该档属派单禁触面（`src/agent/*`，P4-I 域）⇒ 本波不改，随 P5 ∕ 另轮收正；② W8 端壳闭包仍达 `node:sqlite`（P3 域静态边暴露；链内核侧四边 HEAD 已在册）⇒ §6 复扫裁决（B4 面另裁）；③ 批级对拍归档件未建（P5 落位；本波 tmp 先行，先例 #87）。

### 5.P4-II 交回摘要（父侧指令面逐条回执）

| 父侧指令 | 落形 | 读数 |
|---|---|---|
| ① 🔴 `onComplete` 闭证（本波必修） | `panel-turn-loop.mjs:227` 核干净返回 → `:231` `callbacks.onComplete?.(content, agentState(agent))`；核侧零第二调用点 | harness G1 4 断言（`complete` 帧 ∕ 槽回写 `{...slotStamp, ...agentState}` ∕ `_pushSessions` ∕ 非 digest 通知） |
| ② E1 ∕ E2（核） | `dispatch-gates.mjs:113-123` 两谓词；`dispatch.mjs:57/:151` 两门禁位消费；`:120` D5 外门扩 `file_ops`、`:126` 批次档腿判据集不变 | `p4ii-core-dispatch.mjs` 14/14 |
| ③ `panel-turn-loop:17` 清缝 | 静态引改 `:25` 仅 `ContinueError`；核 loop = `:225` 动态 import | 结构件 B 组 11 断言 + VSC 全树 82 档零悬空 |
| ④ 面板推送腿 `onTurnEnd` | `attachToolDrivenLegs`（`:118-142`）——tasks ∕ planMode ∕ goal 三腿 + `syncToolDrivenDisplayState` 尾接 | harness G1（推送腿 6 断言：`_tasks` ∕ `_planMode` + 帧 ∕ goal `complete→done` 帧 ∕ eng+settings 两腿） |
| ⑤ A2 尾块子代理传递面（顺带实证） | 实证 = 子代装配全在核（`spawn-child.mjs` → 核 `runAgent`，无 `promptTail` 传递面）⇒ VSC 通用子代理**无端差**；唯一端壳子代理（旧读图跑者）随 B4-W1 抽核后同样不带 host 尾块（一次性读图任务，无用户可见影响）——窄面差异登记 | 见「登记」段 |
| ⑥ §5（含 🔴 闭证） | 本段（两 append：交付摘要 + 改动表 + 读数 + 决策表 + 登记 + 审计/评审轮次 + 交回摘要） | 批档 §5 已落（verify：`batch` 工具回执「appended 7483 characters」+ 本 append） |

### 5.W8 · W8 契约②第二条链修单（VSC 两边动态化 + 预载两点）· eng-coder · 2026-09-29

**交付摘要**（任务书 = 本档 §1.10 修单：两条静态核边动态化 + sync 出口六消费点随动；射程 = 两边 + 六点，不扩）：

- **边 1**（`suspension.mjs` → 核 `agent/suspension.mjs`）：静态引改**动态装载 + 模块级缓存**（`_core` ∕ `_coreLoad`，`loadSuspensionCore()` 单飞共享 promise）；`backgroundStatus ∕ poolLive` 两 sync 出口转读缓存引用（核单源不变 = `_core.backgroundCounts ∕ _core.poolLive` 实参直传）；会话装配面 `core.startSuspension`。
- **边 2**（同档 → 核 `agent-tools/parent-channel.mjs`）：`driveTurn` 内 `await import()`（仅上行轮取用；ESM 缓存 ⇒ 重复 import 微任务级）；`upstreamAskLabelVars` 提取先于计时起点 `d0`（`ms` 读数口径与迁移前同）。
- **最小随动形**（父侧两形择一取定）= **预载 + 缓存引用保 sync 出口**：预载三点 = `suspensionSession` 入口（先于 `panel._susp` 暴露 ⇒ 「susp 在场 ⇔ 已装载」不变量）+ `panel-turn-stages` 释放窗口两判据点（各一行预载 await；判据子项序 ∕ 短路零变）。四会话活跃消费点（`panel-callbacks` ×1 ∕ `panel-messages` ×2 ∕ `panel-turn-stages:155` ×1）调用形逐字零改。
- 两出口对外语义零变（差分对拍 + 回归双证，见下）。

**改动表（file:line）**：

| 档 | 变更 |
|---|---|
| `thincoder-vscode/src/extension/suspension.mjs` | 265 → **291** 行：`:21-24` 档头 W8 段；`:42-60` 装载面（`loadSuspensionCore` ∕ `backgroundStatus` ∕ `poolLive`——原 `:29` 静态核边与 `export { backgroundCounts as … }` 行退场）；`:155-160` `driveTurn` 上行装载点（先于 `d0`）；`:198` 会话入口装载 await（先于 `:199` `panel._susp` 暴露）；`:219` `core.startSuspension` |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 241 → **251** 行：`:28` import 面 + `loadSuspensionCore`；`:147-152` `finalizeTurn` 预载点 + `prewindow` 拆分（判据等价）；`:172-175` 事件窗注句收正（零 macrotask 让渡 ∕ 微任务续段）；`:185-190` `enterSuspensionTurn` 预载点 |
| `.thincoder/tmp/w8f-*.mjs` ∕ `*.json` ∕ `*.log` | 验证面（gitignored · 非产品码）：对拍件 ∕ 差分件 ∕ `vscode` 桩三件（register ∕ hooks ∕ stub）∕ 两读数 JSON（old ∕ new）∕ 四日志（扫描 ∕ 差分 ∕ 结构 ∕ P4-II 循环） |

**验证（命令与读数）**（cwd = 仓根 thincoder/）：

- **AC②** `node .thincoder/tmp/p3-w8-scan.mjs` ⇒ **✔ 零 node:sqlite 静态可达**（可达 193 档——248 → 193；探针核 `agent/suspension.mjs` ∕ `agent-tools/async-settle.mjs` 皆**不可达**；`dynamic import("node:sqlite") 命中档 = 1` 不入静态链）；日志 = `.thincoder/tmp/w8f-w8-scan.log`。
- **AC③ 六消费点语义零变对拍**：`node --import ./.thincoder/tmp/w8f-register.mjs .thincoder/tmp/w8f-parity.mjs old`（改动前基线 = `w8f-old.json`）∕ `… new`（现值 = `w8f-new.json`）⇒ `node .thincoder/tmp/w8f-diff.mjs` = **SAME 11 · DIFF 0**（11 键 = 六点投影：B1 `finalizeTurn` ×4 径 · B2 `enterSuspensionTurn` ×3 径 · B3 `onAsyncSettled` 两态 · B4 `webviewReady` ×2 · A 两出口十夹具电池）；另 **B5 上行帧值断言**（新树独有，声明非差分；旧树缺席 + 帧↔期望深比 + `sameAsCoreFn` 三重断言）= `{tier:"ask", n:0, from:"eng-coder#7", msg:"hello world"}` = 核函数直算；日志 = `.thincoder/tmp/w8f-diff.log`。
- **回归**：P3 宿主件 `p3-vsc-suspension-parity.mjs`（真驱动直驱，含退出 ∕ 中止 ∕ settle 唤醒）**PASS 23 · FAIL 0**；核件 34 ∕ CLI 件 23 同绿；`p3-host-structure-check.mjs` **PASS 26 · FAIL 0**；`p4ii-loop-harness.mjs` **PASS 68 · FAIL 0**；`p4i-import-face.mjs` = **CLEAN**（441 档零悬空）；`p4ii-structure.mjs` **PASS 21 · FAIL 0**（其 W8 读数：`node:sqlite 可达 = false`）。
- **结构**：`node --check` 四档（两改动 + 两零改消费者）全过；`thincoder-vscode && npm run lint` = `check-syntax: 135 JS files OK`。
- **行数**（§2.0 口径 `split("\n").length`）：`suspension.mjs` **291**（265 → +26——超 P3 带 ≈230–280 上界 11 行，≤300 建议线内）· `panel-turn-stages.mjs` **251**（241 → +10）。

**决策透明表**：

| # | 决策 | 理由 | 消解 ∕ 登记 |
|---|---|---|---|
| 1 | 形 = 预载 + 缓存引用保 sync 出口（非六点全 async） | 最小随动：四会话活跃点调用形零改；两 `poolLive` 点随动 = 各一行预载 await（已装载 ⇒ 微任务级） | 对拍 SAME 11 · DIFF 0；§1.10 两形择一之授权形 |
| 2 | 装载失败保持 fail-fast（不吞错） | 吞错须择错误径语义（池活 ⇒ 判不活 = 静默丢会话窗）——违静默降级纪律；该径仅在核链不可装载环境可达（该环境 agent 本不可运行），且由 `chat-panel.mjs:404-414` F-C1a 兜底（idle + error 帧） | 登记：`_coreLoad ??=` 无重试 ⇒ 该环境后续回合尾预载同错复现（逐回合走 F-C1a）；评审 🟡-2 同面（不采纳理由如上） |
| 3 | `driveTurn` 装载点提至计时起点前 | `ms` 读数口径与迁移前同（不把模块装载计入 digest 时长） | — |
| 4 | 验证面落 `.thincoder/tmp/`（对拍 ∕ 差分 ∕ 桩 ∕ 读数 ∕ 日志） | 派单「六消费点行为读数」自建临时件；tmp = gitignored | 上抛：批级归档件未建（P1 ∕ P2 ∕ P3 同款先例，随 §6 处置）；读数摘录已入本段保值 |
| 5 | 审计建议采纳：扫描读数落 log（`w8f-w8-scan.log`）+ 差分读数落 log（`w8f-diff.log`） | 机器读数可复现、防 tmp 清扫失据 | 已落 |

**审计与代码评审（轮次 · 终态）**：

- **explore 发散审计（轮 1）**：**clean**——四类（partial ∕ silent simplification ∕ doc drift ∕ out-of-list）全空；独立复核：两边动态化（VSC 全树零静态引该两核档）· 「先装载后暴露」序（`:198 → :199`）· 两预载不改子项序 ∕ 短路 · 六点实况与不变量溯源（`panel._susp` 全树单一赋值点）· 档头 ∕ 注句与代码一致；观察 3 项（§5 未落 ∕ 预窗 await 窗口 ∕ 基线时序分粒度）逐条在册。局限声明：无 shell ⇒ 未复跑脚本（以读回 + mtime + 逐键比对替代）。
- **advisor 代码评审（轮 1）**：**changes-required**——🔴1 = §5 记录未落（本段即消解 ⇒ 归零）；🟡2 = `_core` 裸解引用 ∕ 装载失败粘滞（非 must-fix：仅核件装载失败径可达；**不采纳**——守卫须择错误径语义，违静默降级纪律，已入决策 2 登记）· 🟡3 = 两消费者档位 317 ∕ 355 行越 300 线（本单零改的存量面，债务登记）；🔵2 = 对拍件 sleep 等待 ∕ A 电池顺序耦合（**不采纳**：改动对拍件将损害 old ∕ new 双跑可比性——按声明态上抛；§6 若重建可顺手改事件等待）· `w8f-diff` NEW_ONLY 只声明不校验（**采纳**：补旧树缺席断言 + 帧↔期望深比）。
- **fix round 1（自修）**：① 🔴 闭证——本段落盘（含 §1.10 修单坐标对照）；② 采纳 🔵——`w8f-diff.mjs` NEW_ONLY 分支补三重真断言后复跑，读数不变 = **SAME 11 · DIFF 0**（`w8f-diff.log`）；③ 🟡2 ∕ 🟡3 ∕ 🔵1 登记不阻塞。
- **终态**：**clean**（0 未决 must-fix；未决面 = 🟡2（错误径语义抉择 · 登记）+ 🟡3（存量档位 · 债务）+ 🔵1（对拍件形 · 上抛），均登记 ∕ 上抛项）。

**收尾补记（W8 · 评审轮 2 · fix-claim verification）**：advisor 轮 2 VERDICT = **pass**——三声称逐条成立（① §5 本段落盘、坐标与代码新鲜读零漂移；② `w8f-diff.mjs` NEW_ONLY 三重真断言且对实际记录有牙——旧树缺席（grep 零命中）∕ 新树在场（`w8f-new.json:375` `sameAsCoreFn:true`）∕ 复跑读数不变；③ 未采纳 ∕ 债务三项在册，决策 2 依赖的 F-C1a 兜底实测在场）。轮 2 新增两条（均非 must-fix，登记待 §6）：① 🟡 ——本段 :815 的 P3 宿主 ∕ 核 ∕ CLI 回归读数仅与 21:47 归档日志（改动落盘前）吻合，标 **unverified**（结构 ∕ loop ∕ 扫描 ∕ 差分四项有修后日志 22:25–22:33，不受影响）——§6 宜补跑落 log 或注「沿 P3 读数（未复跑）」；② 🔵 ——`w8f-diff.mjs` 值断言在 `frame ∕ expect` 缺字段时静默通过（当前记录三字段俱在 ⇒ 零实际影响）。**终态：clean**（0 未决 must-fix）。

### 5.P5 收口波（文档面收正 + src 注）· 2026-09-29 · eng-coder

**范围** = 批档 §2.9 收正清单逐处 + §1.4 明示的 src 注两处；码面（P1–P4 / W8）不在本波（本波零 .mjs 逻辑改动，仅注释面）。

**取代句（逐字，规范面直落）**：「**挂起面单源 = 核驱动（三端消费）**——CLI ∕ VSC ∕ desktop 皆以 `startSuspension` 为唯一驱动，端差只在装配面（carrier ∕ hooks ∕ 输入缝）」。

**交付面（14 档）**：
- 规范面（取代句/单源句直落）：`AGENT-LOOP.md`（:66 ∕ :71 ∕ :74 ∕ :77 ∕ :135 + §6.18 五面 :422/:426/:428/:429/:430）· `AGENT-LOOP-UPSTREAM.md`（:428-431）· `CORE-UNIFICATION.md`（:1094 ∕ :1300 ∕ :1325）· `AGENT-LOOP-ASYNC-POOL.md`（§6.8 :17/:43）· `MULTI-INSTANCE-COLLAB.md`（:99-102 ∕ :104 ∕ :106 ∕ :108-109 ∕ :170-171）· `WORKSPACE.md`（:35）· `WEBVIEW.md`（:15 ∕ :75 ∕ :205 ∕ :287 ∕ :309）· `WEBVIEW-INPUT.md`（:19 ∕ :31 ∕ :33）· `WEBVIEW-PROTOCOL.md`（:114 ∕ :122 ∕ :166 ∕ :208 ∕ :389 ∕ :416 ∕ :418）· `thincoder-vscode/AGENTS.md`（:42-43 模块表删档随动 + :110 ∕ :122-123 ∕ :125 Testing 按 2026-09-28 全清重置收正）。
- 记录面（原文保留 + 带日期取代注）：`AGENT-LOOP-SUBAGENT.md`（:977 原文保留 + :980-982 取代注）· `AGENT-LOOP.md`（:595 取代注——对 2026-09-20 条）· `CORE-UNIFICATION.md`（:1946-1947 原文保留 + :1982-1984 取代注）。
- src 注两处：`thincoder-vscode/src/agent/setup-tooltable.mjs:35-36`（端 loader = 核单源转口）· `thincoder-vscode/src/agent/tool-table.mjs:29-31`（E1 已落事实）。
- 读数登记：`VSC-DEBT.md` §12.1 B1 读数刷新块（23 档 5344 ⇒ 2304（split ∕ −57%）· 五档退役登记关闭 · `panel-turn-loop.mjs` 311 >300 首登 · CLI 面 371 ⇒ 210（wc-l））。
- 各档变更记录同笔落（AGENT-LOOP :598-599 等 11 档）。

**清单外纳入并披露（自决——同族一致性所需）**：UPSTREAM 挂起驱动坐标块刷新 · WEBVIEW-INPUT :42-43 三调用点坐标 · MULTI-INSTANCE :171 字面规范面句 ∕ :103-104 聚合半段条 · WEBVIEW.md 五处 · ASYNC-POOL §6.8 :43 pickups · **`AGENT-LOOP.md §6.18 #127 行现态注（评审轮 1 🔴 修复——:437-439）** · AGENTS.md :110 ∕ Testing 两处 · src 注两处。

**取代形依据**（父侧裁定已收执）：记录面 = 原文保留 + 带日期取代注；规范面 = 取代句直落（不留划改尸标）。依据链 = 用户 2026-09-18「历史归记录面」＋ 2026-09-28「用户可见端差 = 缺陷；登记后保留通道已废」。

**审计与代码评审轮次与终态**：
- 审计（explore · 只读偏差审计）轮 1：偏差点 1（PARTIAL = §5 P5 段未落——即本条，已闭）；其余 CLEAN（§2.9 逐处 ∕ 读数 ∕ 披露项全对盘）。`git diff` 逐 hunk ∕ `node --test` 复跑 = 审计席无 shell 未执行（盘面替代证据已给足）。
- 代码评审（advisor · code）轮 1：VERDICT = **changes-required**（1 🔴 ∕ 1 🟡 ∕ 4 🔵）。
- 修正轮 1（4 项落 5 处）：🔴 `AGENT-LOOP.md §6.18 #127 行` → 表后「①–⑦ 现态」注（⑦ 显式「端 = 核单源转口」消抵 `MULTI-INSTANCE-COLLAB.md §3.1`）；🟡 `AGENT-LOOP-ASYNC-POOL.md §6.30.11 VSC 面` → 四行现态收正（核 `startSuspension` + `timerFace` 装配；死坐标明标已死）；🔵 `VSC-DEBT.md:328` 前值改「455 ⇒ 9」（本批前实读 ∕ wc-l）；🔵 `AGENT-LOOP.md:595` 记录面取代注补落；🔵 `thincoder-vscode/AGENTS.md` Testing 节（:122-123 ∕ :125）。行宽两次复跑收口（本波文件零 >300 字符行）。
- 代码评审轮 2（fix-claim verification）：VERDICT = **pass**（前轮 🔴/🟡 均核销；修复未引入新缺陷；残留 = 🔵 三条〔批档 §5.P3 行数口径一句 ∕ #127 注内两处锚点精度 ∕ 行数口径混用——均非阻塞〕）。
- **终态 = clean**（审计 CLEAN + 评审 pass；🔵 残留已交 §6）。

**测试**：批内件 `.thincoder/tmp/2026-09-29-parity-b1-vsc-core.test.mjs` —— `node --test`（cwd = `thincoder/`）**22/22 pass**（日志同目录 `.log`）；本波仅注面、码零改，G7 行数读数复测不变。**未跑仓库全量套**（发布闸 = 父侧收口单跑）。

**闸态（实跑 `node scripts/doc-check.mjs`）**：锚悬空 **233**（基线 2026-09-28 18:30 = 170；B1 五档删除直接致命 ≈63——67 条 B1 删档引用跨 ~20 档、含清单外档 TOOLS.md ∕ PORTABILITY.md ∕ MODEL-SPECS.md 等——**建议归「悬空清账轮」**）· 行宽 **40**（全在 docs/desktop ∕ requirements——非本波文件）。

**台账材料（交父侧执笔——本单不写台账）**：
① **#565（B1 对位收编）→ 可核销**：五件取核全落（runAgent ∕ run-stages ∕ suspension ∕ skills ∕ peers）+ 测试 22/22 + §2.9 逐处收正 + 读数 5344 ⇒ 2304；依据 = 本档 §5（P1–P5）∕ §6。
② **#576（窗内起算面判据）→ 半片核销 + 改述**：CLI 面随 B1 重写已按修形落（`thincoder-cli/src/tui/suspension-drive.mjs:166` = `deadline: () => (timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null)`）；仅剩 VSC 面（`thincoder-vscode/src/extension/suspension.mjs:236` = `deadline: () => pendingTimerDeadline(panel._agent)` 未包判据）——建议改述为仅 VSC 面。
③ **#579（核 agent.mjs 拆分债）→ 读数更新**：B1 后 = 466（split 口径）；拆分债维持归轮。
④ 建议新挂（如父侧认可）：**doc-check 悬空清账**（B1 删档 67 条 + 既有存量——一次性重锚轮）。

### 5.B1R · B1 收正轮（三件小修：#582 ∕ #576 VSC 半片 · #584 · B3 注记①）· eng-coder · 2026-09-29

**交付摘要**（派单 = 本档 §1 收正轮 + 台账 #582 ∕ #576 ∕ #584 ∕ B3 射程外注记①；三件 = 族内小修，零扩）：

- **① `#582` ∕ `#576` VSC 半片**（`thincoder-vscode/src/extension/suspension.mjs`）：timerFace.deadline 原为裸取 `pendingTimerDeadline(panel._agent)`（未包开关判据）⇒ 收正为判据包形 `timerWakeEnabled(panel._agent) ? pendingTimerDeadline(panel._agent) : null`（与桌面 `thincoder-desktop/src/main/suspension-drive.mjs:60` ∕ CLI `thincoder-cli/src/tui/suspension-drive.mjs:166` 同形同源——逐字读回比对实证）；导入面增核 `timerWakeEnabled`。原记 `:376` 随 P3 重写漂移 ⇒ **届盘实读定位** = 改写前 `:236`、改写后现址仍 `:236`（注释并入原行、行数不变）。
- **② `#584`**（`thincoder-core/process-probe.mjs`）：**修法以实读定**——真机捕获桌面进程 cmdline（`electron .` 形态：最小 Electron 应用 cwd=thincoder-desktop、argv=`["."]`，经核 `probeCmdlines` 真路径读回）：`"D:\teamcode\thincoder\thincoder-desktop\node_modules\electron\dist\electron.exe" .`；基线读数 = `isProductProc=false`（原两族皆不命中）· `classifyEnd="cli"`（误标）。收正 = 新增桌面端标记族 `DESKTOP_END_RE = /thincoder-desktop/i` + `classifyEnd` 三支化（vscode → desktop → cli 回落）+ **同笔补入 `isProductProc` 第三族**（理由：不补则读面把桌面同伴整条过滤（`peer-instances.mjs:142-145` 身份过滤）且清理面把活桌面属主判死（`ownerState` 身份不符 ⇒ dead）——设计档 `MULTI-INSTANCE-COLLAB.md` §3.1「标记族假阴性」的消解路径即「实测形态补入标记族，单源改点 = `isProductProc`」）。
- **③ B3 注记①**（`thincoder-core/agent/timers.mjs:84`）：体注释自指「（同 CLI）」删（CLI 自持闩体已随 B3 退场——对照对象不存在）；零代码改动。

**改动表（file:line）**

| 档 | 变更 |
|---|---|
| `thincoder-vscode/src/extension/suspension.mjs` | `:34` 注释扩（「核到期件读面 **+ 开关判据**」）；`:35` import 增 `timerWakeEnabled`（核 `@thincoder/core/agent/timers.mjs` 同源两件）；`:235` 注释同址扩（开关关（§6.30.10）⇒ `null`（零注册，判据包形同桌面 `timerFaceOf` ∕ CLI）——并入原行，行数保持 291）；`:236` deadline 判据包形（清单第 1 件本体） |
| `thincoder-core/process-probe.mjs` | `:43-46` 新增 `DESKTOP_END_RE = /thincoder-desktop/i`（注释 3 行含真机捕获串 + 常量；315 → 323 行，+8）；`:216` `isProductProc` 注释三族化；`:221` 增第三族析取；`:224` `classifyEnd` 注释三支化；`:226-231` 三支（undefined 早退保留；VSC 标记优先于桌面 token——杂串防御） |
| `thincoder-core/agent/timers.mjs` | `:84` `/* 已触发 / 不可清——尽力面（同 CLI） */` → `/* 已触发 / 不可清——尽力面 */`（114 行 ∕ 零代码） |
| `.thincoder/tmp/p84-cmdline-probe.mjs` ∕ `p84-cmdline.json` ∕ `p84-cmdline.log` | 新建（验证面 · gitignored）：真机捕获件（electron 夹具 + 核 probeCmdlines 读回） |
| `.thincoder/tmp/p582-vsc-deadline-wrap.mjs` ∕ `.log` | 新建（验证面）：① 包形读数件（逐字提取三端 deadline 行 + 两态直算） |
| `.thincoder/tmp/p584-classify-end.mjs` ∕ `.log` | 新建（验证面）：② classifyEnd 断言件（真模块：判据面 + 声明态投影 + 清理面） |
| `.thincoder/tmp/p84-electron-app/` | 新建（验证面）：最小 Electron 应用夹具（无窗口，自退） |

**验证（命令与读数）**（cwd = 仓根 `thincoder/`）：

- **逐件读回（D6）**：三档目标行实读逐字相符（含注释与导入面）；行数（§2.0 split 口径）= `suspension.mjs` **291**（不变——G7 行数锁零漂移）· `process-probe.mjs` **323**（315 +8）· `timers.mjs` **114**（零变）。
- **① 包形读数**：`node .thincoder/tmp/p582-vsc-deadline-wrap.mjs` ⇒ **ALL PASS (13 checks, 0 fail)**：
  - 逐字提取：VSC `:236` = `(timerWakeEnabled(panel._agent) ? pendingTimerDeadline(panel._agent) : null)`；桌面 `:60` ∕ CLI `:166` = 同式（`agent` 句柄）；句柄归一后**三端串逐字相同**（同形同源实证）。
  - 两态直算（执行 VSC 落盘表达式本体 × 核真函数）：**关态 ⇒ `null`**（在途 timer 亦不发——零注册）· **开态 ⇒ 777**（最近到期时点）· 缺省（键未设）⇒ 777（默认开）· 开态无在途 ⇒ `null`；开 ∕ 关两态读数 VSC ≡ 桌面。
- **② classifyEnd 断言**：`node .thincoder/tmp/p584-classify-end.mjs` ⇒ **ALL PASS (19 checks, 0 fail)**：
  - 判据面：桌面真机捕获串 ⇒ `"desktop"`（本笔收正）· `isProductProc(桌面) = true`（补族）· 回归零变（CLI ⇒ cli · VSC ⇒ vscode · undefined ∕ 空串 ⇒ undefined · 他进程 isProductProc=false）· VSC 标记优先（杂串 ⇒ vscode）。
  - **声明态投影（判据句）**：`setSessionEnd("desktop")` 后 `peerInstances(cwd)` 投影 = self 条 `end="desktop"` + 同伴条（cmdline 注入 = 真机捕获串）`end="desktop"` 在列（改前：同伴被身份过滤不出条）。
  - 清理面：`filterDeadOwners(活, 桌面 cmdline) = false`（不判死——原族外误删方向消解）；他进程 cmdline ⇒ true ∕ CLI cmdline ⇒ false（回归零变）。
- **真机捕获基线（判别力自证）**：`node .thincoder/tmp/p84-cmdline-probe.mjs` ⇒ 捕获串落 `p84-cmdline.json`，同件读数 = `isProductProc=false ∕ classifyEnd="cli"`（先于改动落盘——脚本对应断言改前必红）。
- **回归**：p3 VSC 挂起宿主件 ⇒ **PASS 23 · FAIL 0**；`b1-end-seam.mjs` ⇒ **19/0**；批内件 `node --test .thincoder/tmp/2026-09-29-parity-b1-vsc-core.test.mjs` ⇒ **tests 22 ∕ pass 22 ∕ fail 0**（含 G7 行数锁 291——零漂移）；`cd thincoder-vscode && npm run lint` ⇒ `check-syntax: 135 JS files OK`；三改动档 `node --check` 全过。
- 未跑：仓库全量套（发布闸 = 父侧收口单跑）。

**决策透明表**

| # | 决策 | 理由 | 消解 ∕ 登记 |
|---|---|---|---|
| 1 | ② 修法含 `isProductProc` 补族（超出「classifyEnd 单点」字面） | 实读：桌面 cmdline 原两族皆不命中 ⇒ 只改 classifyEnd 则判据在投影不可达（同伴被过滤）；设计 §3.1 已定「消解路径 = 实测形态补入标记族，单源改点 = isProductProc」 | 已落；行为面 = 桌面同伴在读面可见（原整条不可见）· 清理面活桌面属主不再被判死（原误删方向）——派单「修法以实读定」授权范围内，取证在册 |
| 2 | 桌面族标记 = `/thincoder-desktop/i`（产品树路径段） | 真机捕获 = 唯一稳定 token（electron.exe 路径含产品树名；打包件 exe 名同族） | 已落；其他启动形态出现时按设计「实测补入」续族（单源改点） |
| 3 | ① 注释并入原行（非另起一行） | 行数 291 保持 ⇒ 批内件 G7 行数锁零漂移（另起一行曾致 292 ⇒ G7 红，已回收） | 已落（复核 = 批内件 22/22 复绿） |
| 4 | 验证面落 `.thincoder/tmp/`（p84 ∕ p582 ∕ p584 + 夹具 + 日志）；批内归档件零触 | 派单明示「临时脚本」；tmp = gitignored（`git check-ignore` 实证）；子代理对 `docs/batches/*.test.mjs` 写门拒（#545） | 读数摘录已入本段保值 |
| 5 | 设计档漂移两处登记（设计面零触） | §3.1「端字段」句（`:56`）∕「标记族」句（`:71`）现为两族写法 vs 现码三族；`CORE-UNIFICATION.md:1123` 行 10 读数 315 ⇒ 323 且「消解条件 = 该档下次实质改动时」触发（拆分未做 = 禁扩） | 上抛父侧 ∕ §6（设计面收正 ∕ 拆分债另轮） |

**审计与代码评审（轮次 · 终态）**：见下条补记。

**5.B1R 审计与代码评审（轮次 · 终态）** · eng-coder · 2026-09-29

- **explore 发散审计（轮 1）**：VERDICT = deviations——必改 1 = **§5 未落**（本段即消解 ⇒ 归零）；另 2 条已知披露复核成立（`MULTI-INSTANCE-COLLAB.md` §3.1 `:56` ∕ `:71` 两族句；`CORE-UNIFICATION.md:1123` 行 10 读数 315 → 323 + 消解条件触发）；四类中「静默简化 ∕ 射程外」= 零；判别力复核成立（`p84-cmdline.json` 基线在盘——捕获先于落笔）；独立复核（三档逐字 ∕ 行数 ∕ 代码位坐标）全对。旁注（转父侧核对）：本档 §1 未见「收正轮」派单字样（父侧笔面空缺——非本席偏差）。
- **fix round 1（自修 · 采纳审计必改项）**：§5.B1R 全段落盘（交付摘要 ∕ 改动表 ∕ 验证读数 ∕ 决策透明表——即前一条 append）。
- **advisor 代码评审（轮 1 · code）**：VERDICT = **pass**（0 🔴）——🟡4（均报告面 ∕ 协调项，非 must-fix）：① `MULTI-INSTANCE-COLLAB.md` §3.1 两族句（已由决策 5 登记——报告面）；② **需求档 `MULTI-INSTANCE-COLLAB.md:34` F-MI6 两族枚举未随**（漂移登记面缺口——决策 5 只点了设计档，未含验收层）；③ `AGENT-LOOP-ASYNC-POOL.md:576` §6.30.10「现盘 CLI 窗内起算面未包判据」残留陈述（实读 CLI 已在 `:166` 包判据、被引 `:298` 越 EOF 211 ⇒ 已闭环未随动——正是 ① 的设计依据行）；④ `process-probe.mjs` 322 内容行 >300 咨询线 + 消解条件触发（既有债务 ∕ 父侧协调项）。🔵4：`:45`「打包件 exe 名同族」树内无据（无 `electron-builder.yml`，打包未跑）· `:46` 裸路径 token 过配面（补已知局限登记建议）· 本档 `:881` 桌面坐标记 `:60` 而现盘实读 `:66`（仅存档读数陈旧——脚本模式提取复跑自正，码注释不引数）· 核测试树空清单（2026-09-28 全清重置）⇒ 本轮核判据 durable 覆盖 = 0（核套件重建时补用例）。范围外注记 2：批内归档件精确行数锁形状脆性（本轮为锁把注释并入原行——建议下次重建改阈值锁）；无 shell ⇒ 全部读数按引用对待（未复跑自证）。
- **终态**：**clean**（0 未决 must-fix；未决面 = 🟡×4 + 🔵×4 报告 ∕ 协调 ∕ 债务项 + 范围外注记 2，随交付报告上抛父侧 ∕ §6；其中 🟡-②（F-MI6 需求档）与 🟡-③（§6.30.10 残留陈述）为本轮新登记面，设计档面零触）

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**收口读数（父侧亲跑 · 冻结版）**：
- 批内件 `docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs` = **22/22 pass**（终位归位 = 父侧 2026-09-29 07:5x；复跑 = `node --test docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs`）。
- 全量批内件收口跑 = **124/124**（14 件 · 同刻一次性 · 含本批）——冻结版终跑。
- 四端套件（core ∕ cli ∕ vsc ∕ desktop）= **空清单绿**（全清令制——现行制度态；仓套件不写 ∕ 不改 ∕ 不跑）。
- W8 双链断 = #112 扫描净清单 **0**（193 档）+ 恒等复测 true；`dev-link --check` = **0 漂移**（以上 = 父侧亲跑，读数在轮在册）。

**波面（全落）**：P1 skills · P2 peers · 端名缝 · P3 suspension · P4-I 退役 · P4-II 主循环 · P5 收正 + W8 两链断 + **收正轮**（#118：#582 VSC 包判据 ∕ #584 classifyEnd 桌面族 ∕ timers 注释）——逐波批内件绿 + 域外审计 ∕ 代码评审终态 clean。

**结算面（D7）**：
- 台账 **#565** → **已核销**（五件取核全落 + `VSC-DEBT` 读数 5344 ⇒ 2304）；
- **#576**（CLI 半片 ∕ VSC 半片）→ **已核销**（两半皆落：CLI `suspension-drive.mjs:166` ∕ VSC `suspension.mjs:236`）；
- **#582 ∕ #584**（收正轮两件）→ **已核销**（#118 落位 + p584 断言件 19/19）；
- **#589**（B5 残引族）∕ **#590**（收正轮上抛族）→ 挂册在途（另有载体）。

**真机面（父侧义务 · D16）**：VSC 面板同伴显示（desktop 族可见）· 会话槽清理面（活桌面不判死）——人工走查；清单随本轮真机汇总行。

**状态行**：已收口 2026-09-29。
