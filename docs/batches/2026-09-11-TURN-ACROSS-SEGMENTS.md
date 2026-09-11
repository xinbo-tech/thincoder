# turn 跨段累计（双端 live 头回合编号）· 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分）**：本档对端（VSC）份已由 VSC 仓 `docs/batches/2026-09-11-TURN-ACROSS-SEGMENTS（VSC 仓）` 逐字承载（D10——零改写）；本档保留本仓份。
> 移出条目（对端份）清单：§2 VSC 行（as-of `:86`）——条目计数（对端份 / 本仓份）= 6 / 3（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 12:59 · 来源 = 用户 12:48「你都自动推进，授权到下午两点」窗口内立项（残余侦察 id=22 确认的真缺口）。

---

## §1 讨论（主 agent 记）

### 需求来源

- 侦察报告（id=22，2026-09-11——只读核旧 checklist 4 条遗留）**唯一确认真缺口**：T130③「turn 跨段累计」；
- 用户 2026-09-11 12:48 授权全自动推进（窗口 12:48 → 14:00）→ 父侧立项；
- 相关登记（相邻面，VSC 端）：`ARCHITECTURE.md:21` / `AGENT-LOOP.md:27`「live 头缺逐轮 turn 段……记录在案，无跟进计划」。

### 缺陷事实（as-of 2026-09-11 12:51——侦察一手读码）

| 端 | 位置 | 现象 |
|---|---|---|
| VSC | `src/agent.mjs:125`（`for (let turn = 0; …)`）+ `:129`（`callbacks.onAgentTurn?.(turn + 1)`） | 回合号从 1 起 |
| VSC | `src/agent-tools/subagent-run.mjs:76`（`for (let resume = false; ; resume = true)`——回合帽续跑分段）+ `:113-118`（`entry.turn = t`） | **续跑后计数器从 1 重起——`entry.turn` 不跨段累计** |
| CLI | `src/agent.mjs:186`（`⟦ev⟧turn\x1e${turn + 1}\x1e`） | 同构 |

**影响**：live 头逐轮编号在长任务（触发回合帽续跑）后重置——用户可见的进度语义失真；协议段语义是否受影响由设计裁定。

### 待设计裁定

1. **目标语义**：跨段累计（唯一序列）vs 分段显式（段号 + 段内号）vs 其他——给选型表与理由；
2. **双端实现点**（各端独立实现——语义同源，非 byte-identical）；
3. **协议面**：`⟦ev⟧turn` 段语义（是否受影响 / 兼容性 / 既有解析点消费方式）；
4. 受影响文件全清单（行数/增量）+ 用例 + AC（逐条回指本 §1）；
5. 与相邻登记（`ARCHITECTURE.md:21` / `AGENT-LOOP.md:27`）的关系——本批是否收口该行；
6. 纪律核对（双端独立实现 · D1 · 与 TUI 上抛类既有登记零重叠）。

### 已核事实（供 designer 免重复勘察）

- 缺陷位置与形态 = 上表（两处 VSC + 一处 CLI 同构）——**行号 as-of，须现场复核**；
- live 头渲染消费面：CLI `src/tui/subagent-panel.mjs` / VSC webview 对应面（渲染层是否已假设"从 1 起"需核）；
- 回合帽续跑机制 = SUBAGENT-TAIL / 异步链既有面（`subagent-run.mjs`），改动须守既有测试锁。

### 范围边界（明确不做）

- 只动回合编号语义与 live 头显示；不改回合帽/续跑机制本身；不碰他批在途档；
- **不得自行新建档**（必须新建 → 停下打回主 agent）。

### 状态

**已收口 2026-09-11**（自动窗口内立项）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）

**状态：任务书就绪**（2026-09-11——设计已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：
- 需求 = `docs/requirements/TURN-CAP-CONTINUE.md`（F7 §2 · N5/N6 §3 · §4 边界追加）；
- CLI 设计+测试 = `docs/design/TURN-CAP-CONTINUE.md` §跨段累计编号（19.1-19.8）；
- VSC 设计+测试 = VSC 仓 `docs/design/TURN-CAP-CONTINUE` §跨段累计编号（19.1-19.8——需求随 CLI 仓 requirements 档；VSC 仓无 requirements/ 目录，惯例同 A2-SUMMARY-PARITY）。

**归属裁定（现场——偏离候选名单，理由随报）**：设计落点 = TURN-CAP-CONTINUE 双端（非 AGENT-LOOP）——① 缺陷只源于「续跑分段」，本板块即分段/续跑语义权威；② CLI `docs/design/AGENT-LOOP` 正被第 14 批（SWEEP-FOLLOWUP）设计者占用（在途档避让）；③ 显示形态零改动 → `TUI.md` 零必要面。

**本批条目（三方一致锚——§2 = 设计档 AC = 需求档）**：

| # | 条目 | 需求 | CLI 设计 | VSC 设计 | 验收（用例） |
|---|---|---|---|---|---|
| 1 | 编号跨段累计（目标语义 = 唯一单调序列） | F7 | 19.2 选型 #1 · 19.3 契约 · AC1-AC2 | 19.2 #1 · 19.3 · AC1′-AC2′ | CLI T1-T6 · VSC T1-T5 |
| 2 | 协议兼容（`⟦ev⟧turn` 格式 / 解析点零改动） | N5 | 19.3 发送表 · AC2-AC4 | 19.3 零改动面 · AC2′ | CLI T6-T7 · VSC T5-T7 |
| 3 | 零机制改动（段内帽 / 续跑语义不破） | N6 | D-19e · AC6 | D-19e′ · AC5′ | CLI T8 · VSC T8 |

**§1 六问裁定（结论摘要）**：

1. **目标语义 = 跨段累计**（唯一单调序列；`turn n/max`：n = 链内累计已跑轮数，max = 累计已授予预算）——三候选对比表见设计档 19.2（否决：分段显式 = 协议字段 + 显示面扩张；单端改 = 破双端同源）。
2. **双端实现点**：CLI = `src/agent.mjs` 循环 + `helpers.mjs` `turnFrame`；VSC = `src/agent.mjs` + `run-helpers.mjs` `turnFrame`/`applyTurnFrame`
   + 两消费点（`subagent-run.mjs` / `subagent-escalate-async.mjs`）。**同因核实**：CLI 同构面 = `src/agent/spawn-child.mjs:214` 共享骨架 `runWithContinue`（resume 重跑 runAgent）——与 VSC 内联循环（`subagent-run.mjs:76`）**同因、载体不同**。
3. **协议面 = 受影响**（值语义累计——非格式）：`⟦ev⟧turn` 字段数 / phase / 剥离形态零变化；消费点（镜像 ×2 / TUI 块解析 / 终态快照 / render 剥离）**零改动**即得累计值——兼容策略 = 值语义变更 + 解析面不动。
4. **受影响文件 / 用例 / AC**：见本节下表 + 设计档 19.5-19.7（AS-of 行数 = `wc -l`）。
5. **相邻登记两行（VSC `docs/design/ARCHITECTURE` :21-23 / VSC `docs/design/AGENT-LOOP` :27-29）**：**本批不关该行**（live 逐轮跳动仍缺——需桥通道）；但该行降级口径的「真实终值」前提被本批修正（多段任务此前实为最后一段计数）。登记行补指针 + hook 措辞同步 = **父侧排程**（他批在途面 / 禁写面——本设计者未改）。
6. **纪律核对**：双端独立实现、语义同源（各端以本端代码为准，不互为镜像）✔ · D1 写权（需求/设计 = eng-designer——coder 不写文档；父侧维护文件 coder 不列 `files`）✔ ·
   与「TUI 上抛类」既有登记**零重叠**（全仓 grep「上抛」仅本批次档 §1 自身命中；TUI.md 零改动）✔。

**受影响文件（实施面——coder 声明 `files`；行数口径 = `wc -l`，as-of 2026-09-11）**：

CLI：`src/agent.mjs`(400 → ~406) · `src/agent/helpers.mjs`(372 → ~382) · `test/turn-across-segments.test.mjs`(新 ~90)
VSC：`src/agent.mjs`(353 → ~358) · `src/agent/run-helpers.mjs`(276 → ~292) · `src/agent-tools/subagent-run.mjs`(184 → ~185) · `src/agent-tools/subagent-escalate-async.mjs`(216 → ~217) · `test/turn-across-segments.test.mjs`(新 ~90)

**验收标准（机器可验证——逐条）**：= 设计档 CLI AC1-AC9（19.7）+ VSC AC1′-AC6′（19.7）；最低门：
① 两仓新增用例全绿（T1-T8）；② 既有全量回归绿（CLI `node test/run-full.mjs` · VSC `npm test` / test:full）；③ 两仓 `node scripts/check-doc-width.mjs` 新增违规 0；④ 源码锚（AC2/AC3/AC4 · AC2′/AC3′）驻留。

**明确不在本批**（边界）：分段显式（选型否决）· 继续提示文案（D-19d——`open`）· VSC live 头逐轮跳动（登记行保持开放——`open`）· `TUI.md` / 桥面零改动 · 段内帽与 `ContinueError` 载荷零改动。

**父侧排程（coder / 设计者均不写）**：CLI `docs/TODO.md` + checklist 核销（两仓 checklist 均查无 T130 条目——核销以本档 §1 为源）· VSC `docs/design/AGENT-LOOP` :27-29 登记行指针 + :129 hook 措辞同步 · VSC `docs/design/ARCHITECTURE` :21-23 同款指针（两处同改防漂移）。

**交付报告格式**：改动文件 + 行数（实际）· AC 逐条证据（用例名 / 断言 / 命令输出）· 偏差表（有则列：设计↔实现差异 + 理由）· 未落地项与去向 · 既有回归结果。

### 修正轮（轮次 1 后——2026-09-11）

**背景**：设计评审（轮次 1）VERDICT = changes-required（🔴 1 · 🟡 2 · 🔵 3——发现表见 §3 轮次 1）。父侧裁定：6 条全部落修（#1 按父侧方向——以「公式 + 期望输出」为锚，seq 口径 = 该轮累计序数；公式文字零改动）。本轮 = 修正轮（**只改文档、不碰实现**；未新建档；`src/**` 零改动、未 commit）。

**落点映射（逐条——file:line as-of 落修后）**：

| 轮次 1 # | 级别 | CLI 落点（`docs/design/TURN-CAP-CONTINUE.md`） | VSC 落点（VSC 仓同档） | 说明 |
|---|---|---|---|---|
| 1 | 🔴 | :110-:113（T2-T5 向量/扫描）；公式 :67 零改动 | :133-:135（T2-T4 向量/扫描）；公式 :96 零改动 | seq 口径统一 = 该轮累计序数（1 起 = 段前累计 + 段内 turn + 1）：向量首参对齐（CLI T2 `(100,99,100)` / T3 `(101,0,100)` / T4 `(238,37,100)`；VSC T2/T3 同值）；扫描限可达域（段内 `turn ∈ [0, max)`、`seq ≥ turn + 1`）——三条不变式全域成立 |
| 2 | 🟡 | :52 + 注① :56-:57 | :81 + 注① :85-:86 | 全量命中枚举落档（两仓 `test/` 逐条分类：文件:行 + 注入式/夹具值/键面） |
| 3 | 🟡 | :75（19.3 phase 注）+ :114（T6 相位字面 → `llm`） | —（本端无 token 协议） | 以实际发射行为为准（`src/agent.mjs:186`——相位段值 `llm`）；解析点只取前两参（`subagent-run.mjs:111` / `escalate-async.mjs:203` / TUI `SUB_EVENT_RE` ev[2]/ev[3]）——相位段不参与判定 |
| 4 | 🔵 | — | :103（19.3 sync 路径判定句） | sync 飞刀 `subagent-escalate.mjs` 无池条目、子回调集不含 `onAgentTurn`（:161-170）→ 不在改动面；sync spawn 面由 `applyTurnFrame` 空条目分支 no-op 兜底（T6） |
| 5 | 🔵 | — | :150（AC4′ 改命名清单「webview 两文件 `activity.js` / `activity-view.js`」） | 与 19.3 零改动面统一 |
| 6 | 🔵 | :101（md 行口径）+ :102（需求档实测 44） | :125（md 行口径） | `wc -l` 口径：CLI 45→173 · VSC 70→183 · 需求 35→44；源文件行数复核全相符（CLI 400/372；VSC 353/276/184/216） |

**两仓对齐自证**：CLI T3 ↔ VSC T2（`turnFrame(101, 0, 100) → {101, 200}`）· CLI T4 ↔ VSC T3（`(238, 37, 100) → {238, 300}`）· 扫描（CLI T5 / VSC T4）同构造同不变式——同源口径、各端独立文本（不互为镜像）。CLI T2（段 1 末轮 `(100, 99, 100) → {100, 100}`）为 CLI 侧补充复核点。

**AC1 / AC1′ 复核（父侧要求）**：修正后「T1-T5 / T1-T4 绿」全部可达成——向量首参 = `_turnSeq` 运行时值（复位 0、每轮 +1）；扫描限可达域后 `turn ≥ 1`、`turn ≤ maxTurns`、`maxTurns = 段前累计 + 段预算` 全域成立。AC 文字无需改动（CLI :124 / VSC :147）。

**行口径注**：md 行 = 全档行数（`wc -l`；本批增补前 → 落修后实测）。评审轮次 1 记 170 / 178 与落修前 `wc -l`（169 / 177）差 1 行——计数口径约定差（本次已注明 `wc -l`，供复审对齐）。

**落档后质检**：`node scripts/check-doc-width.mjs`——VSC 仓 OK（0 违规）；CLI 仓本次触碰文件 0 违规（检查器现存报错均在其他在途档 / prompt 档 / 本档 §3（他段）长行——非本轮落修面）。需求档零改动（预期不涉）。

**下一节点**：修正轮落档完成——父侧核验后重发轮次 2（取 token）；本设计者不发起评审。

### 修正轮（载体缺口——VSC 打回后，2026-09-11）

**状态：修正轮落档完成**（只改文档——VSC 设计档 1 档；`src/**` 零改动；未新建档；未 commit；未发起评审）。背景 = VSC coder §5 打回
（设计 §19.3 载体假设在 VSC 子代理面不成立：`agent.mjs:85` 每段新 agent 对象——`opts.agent` 仅 depth-0；两续跑循环不传 agent）
→ **父侧裁定修法 A**（段间种子经 `opts`；保 D-19a′「生成侧单点」）。

**落点映射（逐条——VSC 仓 `docs/design/TURN-CAP-CONTINUE.md`；file:line as-of 落修后）**：

| # | 落点 | 内容 |
|---|---|---|
| 1 | §19.3 :92-:106（种子 bullet :93 · 载体契约段 :96-:106 · 调用点 :111）· §19.2 :81 · §19.4 :128-:129（D-19f′） | 载体契约：`resume` 且 `_turnSeq == null` → 落 `opts._turnSeqBase`（缺省 0）；非空不覆盖；复位点唯一不变（`!opts.resume → 0`）；消费侧义务 = 循环局部「段前累计」（循环外声明）随 `onAgentTurn` 回调更新 → 续跑段传入；否决修法 B 落档（D-19f′） |
| 2 | §19.6 :155-:163（T9-T11 + 接缝注）· §19.7 :169-:173（AC1′ / AC2′ / AC3′ / AC5′） | 段间生产断言：T9 真 runAgent 直驱 ×3 段（段 2 首帧 = 段 1 累计 + 1；段 3 新链复位）；T10 真 runChild 接线（续跑支 `_turnSeqBase` = 段前累计 + `applyTurnFrame` 链路）；T11 源码锚（fail-when-unchanged） |
| 3 | §19.5 :135-:140 | 受影响文件复核：**清单不变**（5 档——两循环原已在列；`run-helpers` 保持零公式改动）；估值更新（agent.mjs ~362 / subagent-run ~190 / escalate-async ~220 / 新测档 ~140）+ 设计档行数 70 → 206 |
| 4 | 变更记录 :206 | 一行注记（载体缺口修正轮） |

**实测复核（本设计者现场核码——打回事实零出入）**：`agent.mjs:85`（depth-0 才复用 agent）、`:129`（`onAgentTurn?.(turn + 1)` 单参）；
`subagent-run.mjs:76` / `:81-121`（每段重调 runAgent、不传 agent）、`:108-112`（resume 重跑 setup——D-SF1 刻意语义）；
`subagent-escalate-async.mjs:73-84` / `:106`。全仓 `onAgentTurn` 消费点 = `subagent-run.mjs:113` + `subagent-escalate-async.mjs:104`（与设计一致）。

**休眠事实（透明披露——已写入 §19.3）**：escalate-async 续跑支当前不可达（`ContinueError` 全走 error-class return——
`subagent-escalate-async.mjs:119-124`；全档无 `continue`）——种子写入该支 = 同构契约驻留、零行为变化；其活消费点 = `applyTurnFrame`（照原设计）。
**唯一活种子消费方 = `subagent-run.mjs`**（sync + async spawn 两面——T10 锚定）。

**零改动面（复核）**：公式 `turnFrame` / 助手 `applyTurnFrame` / 回调契约零改动；需求档零改动（零新语义——载体契约属设计层）；
CLI 面设计 / 实现零改动（同一 child 对象载体成立——CLI 交付不受影响）。

**质检**：`node scripts/check-doc-width.mjs`（VSC 仓）= 宽度 OK（67 文件无 >300 单行）+ 一致性新增违规 0；CLI 仓复检 0 新增
（宽度检查器口径：表格行豁免——本修正块全部新行合规）。

**下一节点**：父侧核验 → 重发设计评审（载体修正面）/ token 裁定——本设计者不发起评审。

### 修正轮（单 🟡——设计评审「VSC 载体缺口修正轮单轮校验」后，2026-09-11）

**背景**：设计评审（VSC 载体缺口修正轮单轮校验）VERDICT = **pass**（🔴 0 · 🟡 1 · 🔵 0——发现 #1 详见 §3）。父侧裁定：落修（修法 = 假帧对齐 `(2, 101)`——与 T9 同口径，最简案；否决备选 = 注明 T10 段预算 / 意图）。本轮 = 单 🟡 修正轮（**只改文档**：VSC 仓 1 档；`src/**` 零改动；未新建档；未 commit；未发起评审）。

**落点映射（VSC 仓 `docs/design/TURN-CAP-CONTINUE.md`——file:line as-of 落修后）**：

| # | 落点 | 内容 |
|---|---|---|
| 1 | §19.6 :156（T10 期望列） | 终态通知 `{turn: 2, maxTurns: 200}` → `{turn: 2, maxTurns: 101}` |
| 2 | §19.6 :163（接缝注 T10 句） | 假帧 `onAgentTurn(2, 200)` → `onAgentTurn(2, 101)`（补 `= turnFrame(2, 0, 100)` 同口径注） |
| 3 | 变更记录 :207（新增） | 一行注记（假帧口径修正轮）；全档 `wc -l` = 206 → 207 |

**口径自证**：T10 夹具底座 = `opts._turnSeqBase === 1` + 标准段预算 100 → 段 2 首帧生成侧口径 = `turnFrame(2, 0, 100)` = `{turn: 2, maxTurns: 101}`（差额项 = 段前累计 1 + 段预算 100）；原 `(2, 200)` 需段预算 199 才可达（T10 未给该预算）。与 T9 段 2 首帧期望（:155 / :162）逐字同口径——假帧（T10）↔ 真帧（T9）同值互证。

**零新语义边界**：公式 / 用例结构 / 断言面 / 其余用例零改动；`onAgentTurn(1, 100)`（段 1 帧）与 `_turnSeqBase === 1` 断言不变；AC 面不涉（AC2′ 文字无数字值）。

**质检**：`node scripts/check-doc-width.mjs`（VSC 仓）= 宽度 OK（67 文件无 >300 单行）+ 一致性新增违规 0（存量基线 33）。回读核实（D6）：三落点逐字已核；`(2, 200)` 残遗扫描 = 仅变更记录行（旧值→新值注记——预期）。

**下一节点**：父侧核验（单轮校验面）——本设计者不发起评审。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

第 19 批设计评审（轮次 1）——评审对象：批次档 §2 · CLI/VSC 设计 §19.1-19.8 · 需求 F7/N5/N6+§4（节段只读；代码点未源码复核——unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收标准/清晰度 | 🔴 | 编号帧公式与用例向量/不变式不自洽（seq 口径 off-by-one，两仓同病）：公式 `turn = seq；maxTurns = seq - turn - 1 + maxTurns`（CLI 设计 :64 / VSC :93）按其「差额项 = 段前累计」gloss 要求 seq = 当轮累计序数，但 CLI T2 :107（`(1,99,100)` 期望 `(100,100)`——公式按字面得 (1,1)）、T3 :108（`(100,0,100)` 期望 `(101,200)`——得 (100,199)）、T4 :109（`(200,37,100)` 期望 `(238,300)`——得 (200,262)）、VSC T2 :128 / T3 :129 同病；CLI T5 :110 / VSC T4 :130 扫描含不可达组合（如 seq=100,turn=99,max=40 → maxTurns=40 而 turn=100），「恒 turn ≤ maxTurns」按字面不成立。→ AC1 :121 / AC1′ :142 按字面无法通过（§2 门① :88-89 同受牵连）。 | 先裁定 seq 唯一口径（同一口径：公式字面 / 向量首参 / 扫描构造三处对齐，两仓同步），再交实现——勿让 coder 在二者间自行取舍（会构成设计↔实现静默偏离）。 |
| 2 | 证据强度（选型判据①） | 🟡 | 「既有测试无编号发值断言（`⟦ev⟧` 字面全为注入式解析测试）」为全称断言、仅单例佐证：CLI :52 仅引 `test/subagent-tail-merge.test.mjs:285`、VSC :81 引 `activity-flow.test.mjs:288` 等。该前提支撑候选 #1「消费面零工具改动 / 既有锁不破」成本结论；本评审受节段只读约束未复核 test 面（unverified）。 | 补全量命中列举/计数（两仓 test/ 对 `⟦ev⟧turn` 逐条分类）坐实，或改述为回归门可验形态（§2 门② 全量回归可兜底检出，但结论口径宜先坐实）。 |
| 3 | 协议面（字面一致性） | 🟡 | T6 注入串 phase 字面与 19.3 发射格式不一致：CLI :111 注入 `⟦ev⟧turn\x1e101\x1e200\x1eturn\x1e` vs :72 发射 `…\x1ellm\x1e`；AC2 :122 锚「4 段 + phase 驻留」。两处字面（或 phase 合法取值域）至少其一需澄清。 | 对齐两处字面（以既有测试先例与实际发射行为为准）或注明 phase 取值域；核对 T6「形态同 subagent-tail-merge:285」的实际字面。 |
| 4 | 完整性（消费端清单） | 🔵 | VSC 19.1 :68-69 列 `subagent-escalate.mjs` 为「同款内联循环」，但消费端 :97 / 受影响面 :117-118 只含 `subagent-run.mjs` / `subagent-escalate-async.mjs`；T6 :132 以「sync 路径无池条目 → no-op」带过——sync 飞刀无需 `applyTurnFrame` 的判定依据未成文（第一参累计化可自动覆盖显示，第二参记账是否牵连不明）。 | 19.5/19.3 补一句注明 sync 路径（`subagent-escalate.mjs`）为何不在改动面（无池条目/不消费第二参），防实施者漏改或多改。 |
| 5 | 验收标准（清单漂移） | 🔵 | VSC AC4′ :145 称「webview 三文件 diff 零行」，而 19.3 零改动面 :100 仅列两档（`activity.js` / `activity-view.js`）——计数与清单不一致，验证时无从对齐。 | 统一为命名清单（或补第三档名并同步 19.3）。 |
| 6 | 行数标注（口径） | 🔵 | 19.5 md 行「45 → 169」（CLI :98）与「70 → 177」（VSC :120）同现档实测（170 / 178 行）不符，且未注明口径（文件现→预计 vs 本节新增前→后）；来源文件行数（400→406 等）本评审未复核（unverified）。两处 >300 行源文件维持既有 advisory 区间、未跨档——不作本批要求。 | 注明 md 行口径或改注「本节增补」；实施前顺手刷新来源行数。 |

其余重点核结论（无 finding）：② 同因主张档内自洽——CLI 端续跑集中于共享骨架（`:30` runWithContinue、同一 child 对象 resume 重跑）vs VSC 内联循环（VSC :68-69），载体差异与受影响面（CLI 2 源文件 vs VSC 4 文件）一致；④ D-19b 机制形状正确（两字段同点取帧 + approval 零改动读同对字段 ⇒ turn/approval 同帧，AC4 :124 以源码锚固化）；⑤ D-19c 取舍论证成立（同构面 + approval 无 depth 维度），代价已在 19.8 :133-140 披露；⑥ 归属落点（TURN-CAP-CONTINUE 双端、避让 AGENT-LOOP 三条理由）与地图登记相符，三方条目映射一致——均无 🔴。

VERDICT: changes-required

计数：🔴 1 · 🟡 2 · 🔵 3（共 6 条；1 条阻断）

### 轮次 2（评审子代理）

第 19 批 · 轮次 2（单轮校验——只核轮次 1 的 6 条处置落档）：6/6 已落 · 0 残遗 / 0 未落 / 0 新增矛盾。

| # | 轮次 1 判定 | 处置项（落点） | 状态 | 当轮读值证据 |
|---|---|---|---|---|
| 1 | 🔴 | seq 口径统一 = 该轮累计序数（向量首参对齐 · 扫描限可达域 · 公式文字零改） | ✅ 已落档 | CLI :110 `turnFrame(100, 99, 100)`→`{turn: 100, maxTurns: 100}` · :111 `(101, 0, 100)`→`{101, 200}` · :112 `(238, 37, 100)`→`{238, 300}` · :113「限可达域：段内 `turn ∈ [0, max)`、`seq ≥ turn + 1`」三不变式全域成立（复算恒真） · :67 公式零改 · VSC :133/:134 同值（CLI T3/T4 ↔ VSC T2/T3）+ :135 同构造 · AC1 :124 / AC1′ :147 按字面可达成 |
| 2 | 🟡 | 全量命中枚举 | ✅ 已落档 | CLI :52「（全量分类 = 19.2 注①）」+ :56-:57 逐条分类 · VSC :81 + :85-:86（`⟦ev⟧` 与 `onAgentTurn` 均 0 命中；其余按注入式/夹具值/键面逐条列名） |
| 3 | 🟡 | phase 字面以实际发射为准 = `llm` | ✅ 已落档 | CLI :75「phase 实际取值 = `llm`；解析点只取前两参」 · :114 T6 注入串 `⟦ev⟧turn\x1e101\x1e200\x1ellm\x1e`（旧 `\x1eturn\x1e` 字面已无） |
| 4 | 🔵 | VSC sync 判定句 | ✅ 已落档 | VSC :103「sync 路径零改动（判定依据）」：无池条目 / 子回调集不含 `onAgentTurn`（:161-170）/ `entry === null` no-op 兜底 |
| 5 | 🔵 | AC4′ 两文件命名清单 | ✅ 已落档 | VSC :150「webview 两文件（`activity.js` / `activity-view.js`——命名清单同 19.3）」 |
| 6 | 🔵 | md 行口径注 | ✅ 已落档 | CLI :101「全档 45 → 173 行（`wc -l`；本批增补前 → 现档）」 · :102「35 → 44 行（`wc -l` 实测）」 · VSC :125「70 → 183 行」 · 需求档尾行 = 44；行读与 `wc -l` 差 1 已注（§2 :116） |

计数：🔴 0 · 🟡 0 · 🔵 0（残遗 / 未落 / 新增矛盾 = 0）
VERDICT: pass

### 轮次 3（评审子代理）

第 19 批设计评审（轮次 2——VSC 面载体缺口修正轮单轮校验）——评审对象：VSC 设计档 `thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md` 4 条落点（① 载体契约 §19.3 :92-:106+:111 + 连带 :81 / §19.4 :128-:129 / §19.8 :183；② 用例/AC §19.6 :155-:163 / §19.7 :169-:173；③ 清单 §19.5 :135-:140；④ 本档 §2 修正块 :122-:151 + 变更记录 :206）；只读锚点区间（±10 行）；发现 = 仅残遗/未落/新增矛盾。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | T10 假 `runAgent` 帧 `(2, 200)`（VSC 档 :156 / :163）与同夹具底座（:156 断言 `opts._turnSeqBase === 1`）的生成侧口径不一致：按 :109-:110 公式与 T9 同型帧口径 :162（base=1 → `turnFrame(2, 0, 100)` = `(2, 101)`），`(2, 200)` 需段预算 199 才可达（T10 未给段预算；标准预算 100 下生成侧不会发出该帧）——测试仍可执行、接线断言（resume / base / applyTurnFrame / 终态）均成立，非阻断 | 假帧对齐 `(2, 101)`（与 T9 同口径），或注明 T10 段预算 / 该值为任意可辨值的设计意图 |

落点核验：① 载体契约 ✓（种子 bullet :93 · 每段新 agent 实证 :96-:99 · 消费侧义务 :101-:103 · 调用点 :111 · 连带 :81 / :128-:129 / :183 均在位）② 用例/AC ✓（T9-T11 :155-:157 + 接缝注 :161-:163；AC1′/2′/3′/5′ :169-:171 + :173）③ 清单 ✓（五档不变 + 估值更新，与 §2 修正块 :134 口径一致）④ §2 修正块 :122-:151 + 变更记录 :206 ✓——未落/残遗 0；新增矛盾 1（上表，非阻断）。

VERDICT: pass
计数：发现 1 条（🔴 0 · 🟡 1 · 🔵 0）——非阻断。

### 轮次 4（评审子代理）

单轮校验——修正轮 id=106 三落点核验（VSC 面 `thincoder-vscode/docs/design/TURN-CAP-CONTINUE.md`；读窗 146–173 / 197–217）：

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| — | — | — | 0 发现（无残遗 / 无未落 / 无新增矛盾） | — |

- ① `:156` §19.6 T10 期望列含 `{turn: 2, maxTurns: 101}`（同行：`opts.resume === true` 且 `opts._turnSeqBase === 1`；`entry.turn === 2`）——落点 ✓
- ② `:163` 接缝注 `onAgentTurn(2, 101)`（= `turnFrame(2, 0, 100)`，与 T9 同口径）——落点 ✓
- ③ `:207` 变更记录新行（假帧口径修正轮：`(2, 200)` → `(2, 101)`；终态通知同步；其余零改动）——落点 ✓
- 口径自证：`_turnSeqBase === 1` + 段预算 100 → seq = 1 + 0 + 1 = 2 → `turnFrame(2, 0, 100)` = `(2, 101)`（maxTurns = (2−0−1) + 100 = 101），与 T9 段 2 首帧（`:155`/`:162`）同口径 ✓；旧值 `(2, 200)` 零残遗（仅存于 `:207` 变更记录历史表述）
- 读窗内 T1–T11 与不变量 `maxTurns = (seq − turn − 1) + max` 自洽（T1/T2/T3/T9/T10 逐项代验），无新增矛盾

VERDICT: pass
计数：🔴 0 / 🟡 0 / 🔵 0

## §4 用户批准（主 agent 记）

**2026-09-11 17:15 父侧代签**——用户 12:48 授权（13:38 延展至队列排空）；三条件**齐备**：

- **轮次 1**：**changes-required**（🔴 1 · 🟡 2 · 🔵 3——§3 轮次 1）；
- **修正轮落地**（6/6）经父侧实文核验 + **轮次 2 = pass**（单轮校验 6/6 已落 · 0 残遗 / 0 未落 / 0 新增矛盾——§3 轮次 2）；
- **token 已签发**（值不落档）。

**批准范围**：双端实施（CLI 3 档：`src/agent.mjs` · `src/agent/helpers.mjs` · 新测档；VSC 5 档：`src/agent.mjs` · `src/agent/run-helpers.mjs` · `src/agent-tools/subagent-run.mjs` · `src/agent-tools/subagent-escalate-async.mjs` · 新测档）——**各端独立实现、语义同源**。

**遗留（批准时登记）**：① 父侧排程面（VSC `AGENT-LOOP` :27-29 登记指针 + `:129` hook 双参措辞 · VSC `ARCHITECTURE` :21-23 同款——随该档下次设计轮/收口落）；② 继续提示文案口径（D-19d）与 VSC live 头逐轮跳动（登记保持开放）；③ commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

### 第 19 批 · VSC 面（2026-09-11）——实施未开始：设计缺口 → 打回父侧

**状态：打回（blocked，待父侧裁定）**。零代码改动（`src/**` · `test/**` 未触碰；未新建档；未 commit；未发评审）。
§2 任务书可读、VSC 设计 §19.1-19.8 已通读——打回原因 = **设计机制与本端实现冲突**（下表），非任务书缺失/不可读。

**缺口（实证）**：设计 §19.3 的载体假设 =「`agent._turnSeq` 跨续跑段保留（复位只在 `!opts.resume`）」。
该假设在 VSC **子代理面（本批唯一可观测面）不成立**：

| 事实 | 证据（file:line，as-of 2026-09-11） |
|---|---|
| VSC `runAgent` 内部自建 agent——`opts.agent` 仅 depth-0 复用 | `src/agent.mjs:85`（`existingAgent = (depth === 0 && opts.agent) || null`）；`src/agent/setup.mjs:128`（注释「opts.agent 仅 depth-0 honored」） |
| 两处续跑循环每段重新调 `runAgent`，均不传 agent | `src/agent-tools/subagent-run.mjs:76`（循环）+ `:81-121`（调用）；`src/agent-tools/subagent-escalate-async.mjs:73-84`（runOpts）+ `:106`（调用） |
| 子代理 resume 重跑 setup → 新 agent 对象 | `src/agent-tools/subagent-run.mjs:108-112` 注释（「a resume re-runs setup … re-binds the CURRENT run's object」——D-SF1 刻意语义） |

**实测探针**（真 `runAgent`、`depth:1`、两次调用 = 段 1 / 段 2（resume）、`stateSink` 采集；
provider 故意不可解析使 LLM 调用即抛——`onAgentTurn` 在循环头发射、先于 chat，足够观测）：

- `same agent object across segments: false`（段 2 = 新对象）；
- 段 1 与段 2 首轮 `onAgentTurn` 各收到 `turn=1`；`a2._turnSeq === undefined`。

→ 照字面实现（复位 `!opts.resume`、每轮 `+1`）后，续跑段因新 agent 的 `_turnSeq === undefined` 而 `?? 0 → 1`——
**段 2 首轮仍发 1**（T2 期望 101），`entry.turn` 依旧重置，F7 未达。

**影响面（为何不能带病放过）**：VSC 唯一可观测编号面 = 子代理（D-19c′：本端主会话不显示 turn）——
池条目 `entry.turn` → 冻结身份头（`subagent-run.mjs:137` → `webview/activity-view.js:52`）+ `subagent status`（`subagent-actions.mjs:66`）。
照字面实现后**该面观测值零变化**（设计自举例：真实 130 轮仍显 30/100）。
且 VSC AC1′-AC6′ 全为纯函数 / fixture / 源码锚——**照字面实现可全绿而功能未达 F7（盲区）**。

**根因（同源翻译缺口）**：CLI 侧 `runAgent(agent, …)` 以对象参数接收 agent，续跑骨架
`runWithContinue`（CLI 仓 `src/agent/spawn-child.mjs:201-223`）**跨段复用同一 `child` 对象**——
CLI 设计「复位只在 `!resume`」因此成立（CLI 设计档 :30 明写「同一 child 对象，history 天然保留」）。
VSC 侧 `runAgent` 内部自建 agent 且子代理不复用（`opts.agent` 仅 depth-0）——
批次 §2 已注「同因、载体不同」，但 VSC 设计未把该载体假设在机制层补齐。

**可选修法（供设计裁定——本 coder 未自行选择，未落任何一行）**：

- **A（建议形态）**：段间种子经 opts——两消费循环持「段前累计」（`entry.turn` / 上次帧值），
  续跑段传 `opts._turnSeqBase`；`agent.mjs` 复位点保持唯一（`!opts.resume → 0`），
  resume 分支仅在 `_turnSeq == null` 时落种子。帧算式 / 回调契约 / `applyTurnFrame` 零改动。
- **B**：消费侧偏移（`applyTurnFrame(entry, base + t, base + mt)`，`base` 每段取一次）——削弱 D-19a′「生成侧单点」。
- 两案均需：设计档补一句载体契约 + AC 补一条可机器验证的段间断言（现 AC 面无法察觉本缺口）。

**未落地项/去向**：VSC 5 档（`src/agent.mjs` · `src/agent/run-helpers.mjs` · `src/agent-tools/subagent-run.mjs` ·
`src/agent-tools/subagent-escalate-async.mjs` · `test/turn-across-segments.test.mjs`）全部未落——
待父侧裁定（改设计重发 / 裁定修法后重派）一次落齐。§19.5 文件清单本身无需变更（修法只增种子机制，不改面）。

### 第 19 批 · CLI 面（2026-09-11）——实施完成：T1-T8 绿 · 内部审计 clean · 内部代码评审 pass

**状态：交付完成（本面零红）**。实施面 3 档：`src/agent.mjs` · `src/agent/helpers.mjs` · `test/turn-across-segments.test.mjs`（新）。
逐字照设计 `docs/design/TURN-CAP-CONTINUE.md` §19.1-19.8（含修正轮对齐值）落地；消费面四档 / VSC 仓 / `TUI.md` 零触碰；未 commit；
未向用户或父侧发起评审（内部偏离审计 + 内部代码评审 = §18 自含交付自动节点，非「发起评审」——无外部审批面）。

**实测行数**（`wc -l`；设计预估 → 实测）：`src/agent.mjs` 400 → **411**（预估 ~406）· `src/agent/helpers.mjs` 372 → **384**（预估 ~382）·
新测档 → **135**（预估 ~90）。两源档均在 500 硬限内（300-500 advisory 带 = 存量债，本批未跨档）。

**改动点**：
1. `src/agent.mjs:131`：`if (!resume)` 块内唯一复位点 `agent._turnSeq = 0`（与 mutation/guard 复位同条件同点）；
2. `src/agent.mjs:189-191`：循环内编号帧 `turnFrame(++agent._turnSeq, turn, maxTurns)` 同点赋值 `_currentTurn` / `_maxTurns`；`:197` 发射行改读两字段（4 段 + phase `llm` 形态零变化）；
3. `src/agent/helpers.mjs:213`：纯函数 `turnFrame(seq, turn, maxTurns)` → `{ turn: seq, maxTurns: seq - turn - 1 + maxTurns }`（唯一计算点）；
4. 新测档 T1-T8 照设计 `docs/design/TURN-CAP-CONTINUE.md` §19.6 向量逐字。

**测试实测值**：定向 `node --test test/turn-across-segments.test.mjs` = **8/8 绿**；快层 `npm test` = tests 463 · pass 450 · fail 2（11 skipped）；
全量 `node test/run-full.mjs` = tests 463 · pass 460 · fail 3。**本批三档零红**。

**红项归因（均非本批面——证据）**：
- T41 ① doc-consistency（快层 + 全量）：新增 V1 违规 2 条，均落**他批在途 docs**（`PORTABILITY.md` 自指段引用 §9 无对应节 · `TUI-SELECTION.md` 同型 §12.4 无对应节）——本批零触碰 docs；
- T40 eng-designer-role（快层 + 全量）：断言他批在途 `ENGINEERING-MODE.md` 稿「勾销未见『进设计档』字样」——本批零触碰 prompt / ENGINEERING-MODE；
- tui-stderr-capture AC-1/2/3/6（仅全量层）：**HEAD 干净 worktree 复跑同款失败** = 存量基线；本批面与该路径（wrapped-spawn / crash-reports）零交集。

**端到端冒烟**（仓外临时脚本、**真 runAgent** + mock-LLM 本地服务；非交付测试面——设计 §19.6 声明接缝式、无 runAgent 直驱先例）：
段 1 帧 `⟦ev⟧turn 1/3` → 续跑段（resume:true）帧 `⟦ev⟧turn 2/4`（累计：max = 段前累计 1 + 段预算 3）→ 新链（resume:false）复位 `1/3`；`_turnSeq` 1 → 2 → 1。

**AC1-AC9 透明表**：

| AC | 判据（设计 `docs/design/TURN-CAP-CONTINUE.md` §19.7） | 结果 | 证据 |
|---|---|---|---|
| AC1 | T1-T5 绿：段 2 首轮 = 段 1 累计 + 1（不重置 / 不倒退 / 恒 ≤ max） | ✅ | 定向 8/8；T3 `(101,0,100)→{101,200}`；T5 可达域三不变式扫描恒真；冒烟续跑段 2/4 |
| AC2 | 发射行取 `agent._currentTurn` / `_maxTurns`（fail-when-unchanged）+ `⟦ev⟧turn` 4 段 + phase 驻留 | ✅ | `src/agent.mjs:197`；T8 正 / 反向锚（旧字面 `${turn + 1}` 全档 0 命中）驻留绿 |
| AC3 | `_turnSeq = 0` 位于 `if (!resume)` 块内；全档无第二复位点（grep = 1） | ✅ | `src/agent.mjs:131`（块自 :127）；T8 计数 = 1 + 块内判定绿 |
| AC4 | approval 行零改动且读同对字段（T7 同帧） | ✅ | `src/agent/dispatch.mjs:296`（本批零 diff；该档含他批在途改动；设计引 :287 = as-of 漂移）；T7 同帧绿 |
| AC5 | 显示面三文件 diff 零行 + T6 绿 | ✅ | `subagent-panel.mjs` / `render-segments.mjs` / `subagent-blocks.mjs` 本批零改动；T6 面板头 `turn 101/200` 绿 |
| AC6 | 段内帽机制零改动：T8 源码锚 + 全量回归 | ✅ | `src/agent.mjs:183` 循环条件 + `:401` 抛点锚驻留；回归结果见上（本批面零红） |
| AC7 | 双端同源（VSC 侧 AC1′/AC2′ 同算式同口径） | ⏸ 非本面 | VSC 面另交付（§5 VSC 子节：已打回父侧）；CLI 算式 = 设计公式逐字（`docs/design/TURN-CAP-CONTINUE.md` §19.3） |
| AC8 | 三方条目一致（本表条目 = 需求 F7/N5/N6 = 批次档 §2 条目） | ✅ | 逐字可对：§2 表 3 行 ↔ `docs/requirements/TURN-CAP-CONTINUE.md` F7 / N5 / N6 ↔ 设计 §19.7 |
| AC9 | 相邻登记关系落档：关系句在位（可 grep） | ✅ | `docs/design/TURN-CAP-CONTINUE.md` §19.8「与相邻登记两行的关系」在位；登记行本体同步 = 父侧排程 |

**偏差披露**：实现 ↔ 设计 **零语义偏差**（逐字落地）。两点口径说明：
1. T7 注入串照**实际发射形态**（approval detail 无收尾 RS——`src/agent/dispatch.mjs:296`；设计表以 `…` 占位）——值语义不变；
2. 行数实测与预估有差（上表）——预估为 `~` 值，非验收项。

**内部审计 + 内部代码评审（§18 自动节点）**：
- explore 偏离审计（只读）：**clean**——四类偏离（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）零命中；观察项 5 个（NaN 可达性判定 = 生产不可达；`subagent-async.mjs:306` 报告扩写重跑复位数——裁决表 #1）；
- advisor 代码评审（轮次 1）：**VERDICT = pass**（🔴 0 · 🟡 2 · 🔵 2——均非阻塞；无 fix round）。

**评审发现裁决（逐条）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 报告扩写重跑（`src/agent-tools/subagent-async.mjs:306`）走 `!resume` 复位 → 同块编号回落 1/100。**设计覆盖缺口，非实现偏离**（复位条件 = `docs/design/TURN-CAP-CONTINUE.md` §19.3 逐字）——打回父侧 / 设计者裁定（明记「报告扩写 = 新链」口径，或后续批透传累计种子）；不阻断本批。 |
| 2 | Deferred | 🟡 文件体积 advisory（两源档 >300 行）——存量债（本批前 400 / 372），未近 500 硬限；不升级（R3）。 |
| 3 | Fixed | 🔵 行数标注漂移——本记录已按 `wc -l` 实测回填（上表）。 |
| 4 | Not an issue | 🔵 AC1 直证缺口——设计 `docs/design/TURN-CAP-CONTINUE.md` §19.6 明示接缝式取舍；交付照设计，仓外真 runAgent 冒烟补行为证据。 |

**未落地项与去向**：VSC 5 档（另 coder——§5 VSC 子节已打回父侧）· 报告扩写复位数裁定（父侧）· 相邻登记行指针（父侧排程）· commit（父侧）。

### 第 19 批 · VSC 面（2026-09-11）——修正轮后实施完成：T1–T11 绿 · 内部审计 clean · 内部代码评审 pass

**状态：交付完成（本面零红）**。实施面 6 档（设计 §19.5 清单 5 档 + `test/files.mjs` 登记 1 行——偏差披露见下）。
逐字照设计 `docs/design/TURN-CAP-CONTINUE.md` §19.1-19.8（含载体缺口修正轮修法 A + 假帧口径修正轮 `(2, 101)`）。
未 commit；未触碰 CLI 仓；未新建档（除新测档）；未向用户/父侧发起评审（内部偏离审计 + 内部代码评审 = §18 自含交付自动节点，非「发起评审」——无外部审批面）。

**实测行数**（`wc -l`；设计预估 → 实测）：`src/agent.mjs` 353 → **365**（预估 ~362）· `src/agent/run-helpers.mjs` 276 → **296**（~292）·
`src/agent-tools/subagent-run.mjs` 184 → **189**（~185）· `src/agent-tools/subagent-escalate-async.mjs` 216 → **220**（~217）·
新测档 → **220**（~140）· `test/files.mjs` 58 → **59**（+1 行登记）。四源档均未近 500 硬限（>300 advisory 带 = 存量债）。

**改动点**（4 源档 + 新测档）：

1. `src/agent.mjs:123-127`：复位/种子块——`if (!opts.resume) agent._turnSeq = 0`（复位点唯一，全档 1 处）；
   `else if (agent._turnSeq == null) agent._turnSeq = opts._turnSeqBase ?? 0`（段间种子——非空不覆盖）；
2. `src/agent.mjs:140-141`：循环头编号帧 `const frame = turnFrame(++agent._turnSeq, turn, maxTurns)` → `callbacks.onAgentTurn?.(frame.turn, frame.maxTurns)`（双参、每轮无条件递增）；
3. `src/agent/run-helpers.mjs:29-41`：`turnFrame`（唯一计算点——差额项 = 段前累计）+ `applyTurnFrame`（entry 空 no-op / maxTurns ≤ 0 不覆盖）；
4. `src/agent-tools/subagent-run.mjs:81 / :119-123 / :126`：循环外「段前累计」`let turnBase = 0`；onAgentTurn 双参（`turnBase = t` + `applyTurnFrame`）；续跑支 `_turnSeqBase: turnBase`；
5. `src/agent-tools/subagent-escalate-async.mjs:76 / :87 / :108`：同款（续跑支当前休眠——同构契约驻留，零行为变化）；
6. 新测档 `test/turn-across-segments.test.mjs`：T1-T11 照设计 §19.6 逐字；`test/files.mjs:58` 登记 1 行。

**测试实测**（先落盘再查）：定向 `node --test test/turn-across-segments.test.mjs` = **11/11 绿**；
快层 `npm test` = tests **459** · fail **0**；全量 `npm run test:full` = tests **459** · pass **459** · fail **0** · skipped **0**；
`npm run lint` = 246 JS files OK；`node scripts/check-doc-width.mjs`（VSC 仓）= 宽度 OK（67 文件）+ 一致性新增违规 0（存量基线 33）。**本批面零红**。

**T9/T10 生产路径证据（本缺口核心——非纯函数绿）**：

- T9 真 `runAgent` 直驱 ×3 段：段 1 首帧 `(1, 100)` → 段 2 首帧 **`(2, 101)`**（`_turnSeqBase: 1` 种子生效——不回到 1）→ 段 3 新链复位 `(1, 100)`；
  消费面确认：全 src `_turnSeq` 写入点仅 `agent.mjs:124/125/126/140`（删种子 / 删 `++` / 旧单参 → 断言必翻红）；帧发射在循环头、先于 chat（fetch 桩只挡网络）；
- T10 真 `runChild`（假 runAgent 经生产参数缝 `runAgent` 注入）：段 1 帧 `(1, 100)` → 续跑段 `opts._turnSeqBase === 1`；`entry.turn === 2` / `entry.maxTurns === 101`；终态通知 `{turn: 2, maxTurns: 101}`。

**AC1′–AC6′ 透明表**：

| AC | 判据（设计 §19.7） | 结果 | 证据 |
|---|---|---|---|
| AC1′ | T1-T4 同算式同口径 + T9 段间生产断言（段 2 首帧 = 段 1 累计 + 1） | ✅ | 定向 11/11；T2 `turnFrame(101,0,100)→{101,200}`；T3 `(238,37,100)→{238,300}`；T4 可达域三不变式恒真；T9 `[[1,100]]→[[2,101]]→[[1,100]]`（真 runAgent） |
| AC2′ | `onAgentTurn` 双参（源锚）+ 两消费点经 `applyTurnFrame`（T5/T6）+ 消费侧接线（T10 + T11 锚） | ✅ | `agent.mjs:141` 双参发出；`subagent-run.mjs:119-121` / `escalate-async.mjs:108` 经 `applyTurnFrame`；T10 `_turnSeqBase === 1`；T11 两循环种子各 1 命中 |
| AC3′ | 复位条件 `!opts.resume` + 无第二复位点 + 种子仅 `_turnSeq == null` | ✅ | `agent.mjs:123-127`；全档 `_turnSeq = 0` 唯一；T8/T11 源锚驻留 |
| AC4′ | 终态快照行 + webview 两文件（`activity.js` / `activity-view.js`）diff 零行 + T7 绿 | ✅ | `subagent-run.mjs:140-143` 零改动（读 entry 累计值）；webview 两档本批零触碰（`activity-view.js:52` 逐字消费）；T7 冻结头含 `turn 130/200` |
| AC5′ | 段内帽 / 续跑语义零改动：T8 源锚 + VSC 全量回归绿 | ✅ | `agent.mjs:134` 循环条件 + `:349` 抛点锚驻留；循环结构仅增种子传参；全量 459/0/0 |
| AC6′ | 登记行关系落档——登记行本体同步 = 父侧排程 | ✅ | 设计 §19.8 关系句在位（本批零触碰）；登记行本体（AGENT-LOOP :27-29 / :134 hook 措辞 + ARCHITECTURE :21-23）= 父侧排程（批准时遗留登记） |

**偏差披露**：

1. `test/files.mjs` 登记 1 行 = **out-of-list**（设计 §19.5 清单未列）——**机械必需**：VSC 测试清单为显式注册
   （`test/run-fast.mjs` / `run-full.mjs` 只跑清单项），不登记则新测档在 `npm test` / `test:full` 永不执行；已披露且列入去向（设计档清单补行 = designer/父侧文档层）；
2. T9 fetch 桩形态 = 接缝注「不可解析 provider」的实现细节：无 baseURL 的 URL 在 `requestWithRetry` 内触发 1s/2s/4s 退避重试（实测单段 ~7.8s）；
   以 AbortError 桩（生产 `provider.mjs:252` 免重试分支）将其压到零等待 + 机械保证零网络——帧发射时序（循环头先于 chat）与断言面不变；
3. 行数实测与预估有差（上表；新测档 220 vs ~140——T9/T10/T11 生产断言与注释开销）——预估为 `~` 值，非验收项。

**内部审计 + 内部代码评审（§18 自动节点）**：

- explore 偏离审计（只读，blocking）：**代码行为面 clean**——四类偏离（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）仅 1 条 🔵（`test/files.mjs` 出清单——机械必要 + 已披露，建议设计档补行）；
- advisor 代码评审（轮次 1——全量）：**VERDICT = pass**（🔴 0 · 🟡 2 · 🔵 1，均非阻塞，无 fix round）；
- advisor 聚焦复核（轮次 2——T9/T10 生产路径非空性）：**VERDICT = pass**（0 新增发现）。

**评审发现裁决（逐条）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 设计 §19.5 文件清单未含 `test/files.mjs`——登记行机械必需且已披露；设计档补行属 designer/父侧文档层（本 coder 无设计档写权），随 §5/交付报告上报。 |
| 2 | Deferred | 🟡 文件体积 advisory（`src/agent.mjs` 365 行 >300 建议档）——存量债（本批前 353），远未近 500 硬限；随 CLI 面同口径不升级（R3）。 |
| 3 | Deferred | 🔵 撞墙拒绝/错误终态通知不携 turn/maxTurns（`subagent-run.mjs:179` / `:185`）→ 该态冻结头无编号段——属「live 头」既有登记开放面（D-19d′），§19 AC 不涉；若 F7 需覆盖，父侧另立条目（设计覆盖项，非本实现偏离）。 |

**未落地项与去向**：① 设计 §19.5 清单补 `test/files.mjs` 行（designer/父侧）；② 相邻登记行本体同步 + hook 措辞（父侧排程——批准时遗留）；③ commit（父侧）；④ 报告扩写重跑复位数（CLI 面已登记遗留——父侧裁定，非本面）。

**终态：clean**（审计 clean · 评审 pass 两轮 · fix round 0 轮）。

## §6 验证与收口（父代理自写）

**2026-09-12 03:25 父侧收口（VSC 面 + 全批）**（用户授权窗口 12:48→排空）。

### 父侧验证

- **T9 生产断言（核心门）真跑**：`[[1,100]] → [[2,101]] → [[1,100]]`——段 2 首帧 = 段 1 累计 + 1（不回 1）；T10 接线 `_turnSeqBase === 1` / `entry.turn === 2` / 终态 `{2,101}`；
- 定向 **11/11** · 快层 **459/0** · 全量 **459 pass / 0 fail / 0 skip** · lint 246 档 OK · VSC doc-width 新增 0；
- 内部：偏离审计 clean + 代码评审两轮 pass（🔴0）——**零修正轮**。

### 逐条验收结论

- **AC1′–AC6′ 全绿**（同算式/双参+消费点/复位唯一+种子/快照 webview 零 diff/段内帽零动/登记关系）；**Simplified 零 · Not done 零**；偏差如实（含 `test/files.mjs` out-of-list 机械必需）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean（CLI + VSC 两段）✓ · 计数：5+1 档实测 ✓ · 指针：设计 §19.5 ↔ 用例 T1–T11 ✓ · 待办：三项（下）✓

### 遗留项

1. 设计 §19.5 清单补 `test/files.mjs` 行（设计者/父侧文档层——随手批次）；
2. `src/agent.mjs` 365 行 >300 建议档（存量债登记）；live 头撞墙态无编号段（D-19d′ 开放登记）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
