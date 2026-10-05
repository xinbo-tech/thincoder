# 2026-10-05 · subagent-zero-write-watchdog
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 12:11「我希望实现一个功能：eng-designer/eng-coder/advisor 在50轮没有落笔时自动向主代理推一条提醒，让主代理查看一下。」+ 12:13「开批」（= 立批放行：设计 → 评审 → 批准 → 实施常规全链）。
> 台账 = #934（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（双族看门狗；§4.16 需求行 + §6.32 在盘；评审轮 1 七项修正已落（D-ZW9 新增；doc-check exit 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖 6）**：#934 零落笔看门狗（子代理 ∥ 评审的自动上行提醒）——① 触发判据（子代理族：eng-coder / eng-designer 连续 50 回合无文件写）② 触发判据（评审族：advisor 连续 50 轮无评审文本产出——父侧 12:2x 裁定 A）③ 防轰炸（闩 + 写后重臂）④ 文案（双族单行英文 · 候父侧定稿）⑤ 送达（复用上行队列 note · 零唤醒）⑥ 边界（只推提醒 / 触面三角色 / 零回归）。

**设计档落点**：`docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.32（机制单源 · :1013 起）+ 机制叶档 `thincoder-core/agent-tools/zero-write-watch.mjs`（拟新增）。
**需求行落点**：`docs/core/requirements/AGENT-LOOP.md` §4.16（F-ZW1–F-ZW6 / N1–N3 · :304 起——本批派单委托代笔，定稿权 = 主代理）。

**机制设计（要点）**：触发点 = 回合环采集点邻单点（`thincoder-core/agent/turn-loop.mjs:73` 邻——streak 更新与越阈判定同点；采样面 = `_touchedFiles`（六写工具，与 #417 同源面）；
新字段 `_zeroWriteStreak` / `_zeroWriteAlerted`——`!resume` 复位、跨段存活）；评审族 = 环路局部 `silentRounds`（上一轮无文本 token ⇒ +1、有 ⇒ 归零）+ 可选钩子（缺省 ⇒ 零行为）。
防轰炸 = 闩 + 写后重臂（每连续零写段恰一条）。文案 = 单行英文（携 `role#id` + 轮数；单源 = 叶档）。送达 = `pushChildUpstream`（note 类——同队列同消费点；不唤醒；零新容器 / 零新闸 / 零新事件）。
边界 = 只推提醒（不杀 / 不转向 / 不代父侧动作）。

**受影响文件与测试面**：6 源档 + 2 新档（叶档 + 批件测档 `docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs`（拟新增））+ 2 文档档 + 本批档（行数表 = §6.32.7）。
实施轮入口 = 批件直跑（拟新增件 `docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs`——`node --test` 直跑，cwd = 仓根）+ `cd thincoder-core && npm test`。

**验收对照**：A-ZW1–A-ZW6（设计档 §6.32.9——逐条回指 F-ZW1–F-ZW6）+ 本设计轮闸：`node scripts/doc-check.mjs` 悬空 = 0（读数与行宽面见披露⑦）。
**关键决策**：D-ZW1–D-ZW8（§6.32.11）——连续 vs 累计 · 跨段存活 · note / 不唤醒 · 防轰炸形 · 单源落点（否决落 `docs/core/design/AGENT-LOOP-SUBAGENT.md`）· 评审改锚（A 裁定）· 单点采集 · 「不设零产出阈值」相容句。

**上抛项 / 披露**：
① 「不设零产出阈值」字面收窄建议（`docs/core/design/TURN-CAP-CONTINUE.md` §1 行 6——域外 · 另案：本机制不触续跑决策）；
② 落笔口径窄面（`batch` §2 追加 / `file_ops` 不计入 `_touchedFiles`——纯 §2 长跑不计为落笔；如实登记）；
③ `thincoder-core/agent-tools/advisor-async.mjs` 494/500 逼近硬限（余量 ~3——实施轮守限）；
④ 需求行系派单委托代笔（D1 名义归主代理——请核稿）；
⑤ 消化账务批在飞禁触面零触已核；`thincoder-core/agent/turn-loop.mjs` 系其近期落痕面——实施轮按届盘复核坐标；
⑥ 文案逐字候父侧定稿；
⑦ 机检观察（非本批）：复跑时 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:870 / :873 / :968` 三行超 300 字符——在飞批实时笔迹（本批开工基线 = exit 0；本批零触碰该档——见交付报告）。

**设计评审轮 1 修正（fix 轮 · eng-designer · 2026-10-05）**——承 §3 轮次 1（#58：0🔴 / 4🟡 / 3🔵）七条逐项定点落位（零全量重写；产品码零触；他批在飞面零触）：
1. 🟡 A-ZW5 零回归——`AGENT-LOOP-UPSTREAM.md` §6.32.9 改钉**现役可红面**（批件用例 U-ZW1–U-ZW8——U-ZW5 已含「`_zeroWriteTurns` 读数改前逐字同」断言）+ 补「核清单自 2026-09-28 空置（`thincoder-core/test/run.mjs:42-45`——空清单 ⇒ 零用例 = 绿 · exit 0）· `cd thincoder-core && npm test` = 形式过门」注。
2. 🟡 §6.32.7 行 6——补在册引用（`docs/core/design/CORE-UNIFICATION.md` §2.8.1 行 8 = `advisor-runs.mjs` 外提方案 · 消解条件 = 下次实质改动时）+ 触评句（本批 = `entry.start` 内加一回调键的行级改动 · 零新函数 ∥ 零导出面变 ⇒ 不构成「下次实质改动」触发、计划续挂；增量守 ≤500：494 ⇒ ≈497）。
3. 🟡 送达时效——新增 **D-ZW9**（§6.32.11）：维持 note 不唤醒（有意选择——父侧定稿）+ 代价（默认流首个唤醒恒 = 子代理自身 settle——§6.27.12.1 实证）+ 替代路径登记（§6.27.12.11-7 单行改法——代价 = 每条 note 一次父侧轮）；§6.32.10-3 补指针。
4. 🟡 TURN-CAP 字面张力——裁定①落：`docs/core/design/TURN-CAP-CONTINUE.md` §1 行 6 加对象限定（该裁定对象 = 续跑决策的自动动作面）+ 交叉指针（§6.32）。**披露①结案**（原「域外 · 另案」⇒ 已落）；同拍 = D-ZW8 尾句由「收窄建议挂账」收正为「字面收窄已落」。
5. 🔵 变更记录重复条——去重（×2 ⇒ ×1）；行数读数回填 = §6.32.7 行 8 自指（1222 ⇒ **1224**）。
6. 🔵 复位点两锚——§6.32.2 ① 钉单一锚（`run-start.mjs:123`——`_touchedFiles = []` 邻）+ 与 `:111` 分支差别注；§6.32.6 载体重置行与 D-ZW2 括注同拍。
7. 🔵 评审族「恒零抛」——`pushAdvisorAlert` 契约句 + 环路钩子呼点注（与子代理族 §6.32.6 对称——实现面兜底捕获兑现）。
产出读数：`node scripts/doc-check.mjs`（cwd = 仓根）**exit 0**（锚悬空 0 · 行宽 0 违规）；本修正轮触碰 = `AGENT-LOOP-UPSTREAM.md`（1222 ⇒ **1224** 行）∥ `TURN-CAP-CONTINUE.md`（224 ⇒ **226** 行）——两档均档面修正（零产品码）。
扫描判断（同轮记录）：`TURN-CAP-CONTINUE.md:145` D-TC18 同含「不设零产出阈值」词——对象 = N7 撤销裁定行内陈述（行内自明），按定点纪律未触（后核如需同款指针，一句话可加）。
域外观察（非本批 · 报父侧）：历史验收行 `cd thincoder-core && npm test` 系字面（本档 `:751` ∥ `:992-994`）同受 2026-09-28 核清单空置影响（形式过门）——本批只收正 A-ZW5，其余面未触（另议）。

**实施后终收笔（fix 轮 · eng-designer · 2026-10-05）**——承 §5 实施记录（7 档落地 · 9/9 绿 · 三门过；终态 clean）与父侧裁定（随条注）——父侧五条逐项落位 + 批收口核销连带（**零新语义**：收正 / 回填 / 登记面；产品码零触；判据 / 阈值 / 文案零改；批档 §1 / §3–§6 零触；他批面零触）：

1. **§6.32.6 简记收正**——两族文案函数签名 `(rounds)` ⇒ **`(from, rounds)`**（与 §6.32.4 定稿模板自洽——实现以定稿为准；§5 已证字节相等）；`maybeZeroWriteAlert` 内部呼点对齐（`zeroWriteAlertText(child._upstream.label, child._zeroWriteStreak)`）；`pushAdvisorAlert(parent, from, rounds)` 呼点核对 = 已对齐（零改）。
2. **§6.32.7 as-built 回填**——行 1–7 终值实测（**267** ∥ **157** ∥ **77** ∥ **310** ∥ **204** ∥ **497** ∥ **319**；Δ +14 / +5 / 新增 / +22 / +4 / +3 / 新增）+ 表头读法注（现量 = 设计轮实读 · 终值 = 实施后实读）+ 行 8 自指读数随拍（1224 ⇒ **1227**）。
3. **>300 越线全扫 + 补行**——实读 7 触档：`thincoder-core/advisor/loop.mjs` **310**（>300 咨询线——增量以注释为主 ⇒ 非结构性触碰；本批不拆；拆分预案随该档下次结构性触碰登记）∥ `thincoder-core/agent-tools/advisor-async.mjs` **497**（≤500 守限兑现——行 6 在册维持）∥ 其余 ≤300（叶档 77 / turn-loop 267 / run-start 157 / run 204）；批件测档 **319** > 300（批内件口径——随批留存 · 不进仓套件 ⇒ 记录接受；先例 = `docs/batches/2026-10-04-core-patch-batch.test.mjs` 342 行同判）；文档档（`.md`）免档位判定。
4. **钩子链残余登记（父侧裁 = 接受登记，不补腿）**——`thincoder-core/agent-tools/advisor-async.mjs:431` ∥ `thincoder-core/advisor/run.mjs:146` 两行转发无已执行证据（批件按设计以钩子注入定形）⇒ **登记接受**（静态核对：供点 / 转发点 / 环路取值链逐行在盘 + 叶档 / 环路单元面覆盖）；真入口腿留作可选加固。
5. **NaN 卫生注（父侧裁 = 接受）**——`_zeroWriteStreak` 未初始化面 NaN——门「整数判」拦下（零动作同效）、无显示面；可选加固留档（§6.32.2 ①）。
6. **批收口核销连带**——「拟新增」标记清零（↔ 受影响文件表：叶档 / 批件测档已落）；表下注「在飞」字样与 `:184-186` 坐标按盘收正（`:198-200`）。

产出读数：`node scripts/doc-check.mjs` = **exit 0**（悬空 0 · 行宽 0 违规 · 行数面差异 18 条 = 存量报告态，全在 desktop 域——本批零触）；本轮触碰 = `docs/core/design/AGENT-LOOP-UPSTREAM.md`（1224 ⇒ **1227** 行——档面收正 / 回填 / 登记；零产品码）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | A-ZW5（`docs/core/design/AGENT-LOOP-UPSTREAM.md:1183`）把零回归落实为「本批批件用例（U-ZW1–U-ZW8）全绿 + `cd thincoder-core && npm test` 绿」——但核 `thincoder-core/test/` 自 2026-09-28 全清后仅存 `run.mjs` / `slow.mjs`，`thincoder-core/test/run.mjs:42-45` 显式「test manifest is empty — zero tests = green」并 `process.exit(0)` ⇒ 该分句**不可能红**，对 N1「零回归」零判别力。 | 把零回归判据改钉现役可红面（批件测档 U-ZW1–U-ZW8——其中 U-ZW5 已含「`_zeroWriteTurns` 读数改前逐字同」类断言）；或保留该句但补注「核清单空置（`test/run.mjs:42-45`）· 形式过门」字样，免读者误读为真回归门。 |
| 2 | Affected-file size annotations | 🟡 | §6.32.7 行 6（`:1154`）对 `thincoder-core/agent-tools/advisor-async.mjs`（现量 494 · >300 咨询线 · 本批触碰）只写「494 ≤ 500 硬限，余量 ~3：实施轮守限（越限即就地收敛或拆档）」——未引在册拆分计划、亦无触评结论句；该档在 `docs/core/design/CORE-UNIFICATION.md:1133`（§2.8.1 行 8）已带完整方案（「**>300——须带**：**实例注册表 + 启动解析面**」…外提 `advisor-runs.mjs`；「消解条件 = 下次实质改动时」+ 2026-10-04「批·五触评」注），同仓先例 = `docs/batches/2026-10-04-issue-fix-round5.md:78`（「在册 = `CORE-UNIFICATION.md` §2.8.1 行 8」+ 触评句）。 | 行 6 补两笔：① 在册引用（CORE-UNIFICATION.md §2.8.1 行 8 = `advisor-runs.mjs` 外提方案）；② 触评句（本批 = `entry.start` 内加一回调键的行级改动 · 零新函数 ∥ 零导出面变 ⇒ 不构成「下次实质改动」触发、计划续挂；增量守 ≤500）。 |
| 3 | Scope / coordination | 🟡 | 送达时效取舍已披露但未被摆到父侧定稿面：note 不唤醒 ⇒ 默认流（父挂起）里提醒只在父侧下一次自然苏醒被读到（`:1079`「父挂起 ⇒ 随下次自然苏醒」；默认流实证 = §6.27.12.1 五次挂起首个唤醒恒 = 子代理自身 settle）⇒ 越阈提醒常在子代理结束后才达父侧，与用户原话「让主代理查看一下」的「及时」预期有落差（§6.32.10-3 `:1190` 已记「挂起期即时唤醒 = 另案」）。 | 补一行显式决策（D-ZW 或边界句）：no-wake = 有意选择 + 代价（迟到）；替代路径 = §6.27.12.11-7 已登记的单行改法（「若父侧要求 note 一并唤醒，改动 = `upstreamWaiting` 谓词一行」；「代价 = 每条 note 一次父侧轮」）——交父侧定稿裁，需求 F-ZW5 同句随动。 |
| 4 | Doc-state（跨档字面） | 🟡 | `docs/core/design/TURN-CAP-CONTINUE.md:23` 仍含无限定字面「防卡死靠用户 Stop（**不设零产出阈值**——2026-09-26 裁定）」，与在盘的 §6.32 零产出 / 零写 50 轮阈值提醒并存；D-ZW8（`:1208`）已作相容分析并把「字面收窄建议 = 域外登记（另案）」挂账（批档 §2 披露① `docs/batches/2026-10-05-subagent-zero-write-watchdog.md:29`）。 | 二选一落一行：① 同轮给该行加对象限定（对象 = 续跑决策的自动动作面）；② 明示「另案登记」成立并写下登记去向与判据句——不留无限定字面与在盘机制并存。 |
| 5 | Doc hygiene | 🔵 | `AGENT-LOOP-UPSTREAM.md` 变更记录内同一 2026-10-05「批 subagent-zero-write-watchdog · 设计轮」条目逐字重复两条（`:1212` 与 `:1221`）。 | 删去其中一条（记录面去重），行数读数按去重后回填。 |
| 6 | Clarity | 🔵 | `_zeroWriteStreak` 复位点两锚并述：`:1043`「**复位条件 = 同 `_turnSeq`**」＋「与 `_touchedFiles = []`（`:123`）同点」；现盘两锚分支不同——`agent._turnSeq = 0`（`thincoder-core/agent/run-start.mjs:111`）在 `!resume` 块顶（链起点恒执行），`agent._touchedFiles = []`（`:123`）在 `_inheritedGuard` 的 else 支内（有继承 guard 时不执行）。对触面（eng 子代理恒无继承 guard）两锚同效，但语义句与落点位不自洽。 | 钉单一锚（建议以 `:123` 邻为准，`:1143` 同锚）并把与 `:111` 的分支差别补成一句注（或语义句改述为「链起点且无继承 guard」）。 |
| 7 | Clarity / robustness | 🔵 | 「恒零抛」契约只写在子代理族（`:1097`「恒零抛；返回布尔（测试面）」）；评审族 `pushAdvisorAlert` / 环路钩子呼点（`:1102` · `thincoder-core/advisor/loop.mjs` 的 `seams.onStallRound?.()`）无同款句——钩子住 `runAdvisorToolLoop` 内，一旦抛错会被 `runAdvisorReview` 的 catch 收成「Advisor: review failed」形态（新增失败面）。 | 给 `pushAdvisorAlert`（或钩子呼点）补同款「恒零抛」契约句（实现面以兜底捕获兑现），与子代理族对称。 |

**计数：🔴 0 · 🟡 4 · 🔵 3**（发现表 7 条 · 已核实项：turn-loop.mjs 253 / run-start.mjs 152 / advisor-async.mjs ≈494 行数标注抽查吻合；`_role` / `_upstream` / `_touchedFiles` / `seams` / `entry.start` / `checkpoint.mjs` 先例 / `pushChildUpstream` 闸位 / `FILE_MUTATORS` 六工具 / 批件测档先例 / doc-check 脚本 = 逐点在盘核过）

**VERDICT: pass**

## §4 用户批准（主 agent）

**2026-10-05 12:4x 父侧代签**——依据用户 2026-10-05 12:13「后续都自动跑」（排空模式：评审代点火 / §4 代签 / 派发 / 收口核销提交双推 token 终消费——父侧自缚三条在册）。

**三条件核验**：
① **设计评审 pass** ✓——§3 轮次 1：🔴 0 · 🟡 4 · 🔵 3（无阻塞项）。
② **修正轮落地并逐条核验** ✓——`#60` 七条（A-ZW5 现役面收正 `AGENT-LOOP-UPSTREAM.md:1183` ∥ 行 6 在册引用 + 触评 `:1154` ∥ D-ZW9 送达决策 `:1209` ∥ TURN-CAP 对象限定 + 交叉指针 `TURN-CAP-CONTINUE.md:23` ∥ 变更记录去重 ∥ 复位点单锚 ∥ 评审族「恒零抛」契约）——父侧实读四处核过；连带对齐（D-ZW2 括注收正 / D-ZW8 尾句同拍）已披露。
③ **token 已签发** ✓（运行态不入档）。

**批准范围** = 本批全量（6 档 + 叶档 + 批件测档——实施 = #62）。**边界** = 只推提醒（不杀 / 不转向）∥ 触面 = eng-coder ∥ eng-designer ∥ advisor ∥ 阈值 50 ∥ note 不唤醒（D-ZW9——有意）∥ `advisor-async.mjs` ≤500 守限。

## §5 实施记录（eng-coder）

**状态行**：实施完成（7 档落地（含叶档 + 批件测档）；批件 9/9 绿 · 先红 8 红 ∥ 1 绿 · 相邻复跑零回退 · doc-check exit 0；偏离审计 + 代码评审各 1 轮——终态 clean（🟡3/🔵4 非阻塞随报告上抛））

### 落地表（file:line → Δ；行数口径 = 换行符计数）

| 档 | 落点（file:line） | Δ |
|---|---|---|
| 1 · 叶档（拟新增→落盘） | `thincoder-core/agent-tools/zero-write-watch.mjs`（全档 77 行——阈值单源 / 两族文案 / 两族推送；唯一静态 import = parent-channel 的 `pushChildUpstream`） | +77（设计估 +~45） |
| 2 · 子代理族采集点 | `thincoder-core/agent/turn-loop.mjs:53-56`（动态 import 扩一名 `maybeZeroWriteAlert`）· `:74-87`（轮顶单点：streak +1 / 越阈呼 / 有写归零 + 清闩——#417 `_zeroWriteTurns` 语义逐字未动） | 253→**267**（+14） |
| 3 · 载体重置 | `thincoder-core/agent/run-start.mjs:123-128`（`!resume` 块内 `_touchedFiles = []` 邻加 `_zeroWriteStreak = 0` / `_zeroWriteAlerted = false`） | 152→**157**（+5） |
| 4 · 评审族环路 | `thincoder-core/advisor/loop.mjs:96-98`（循环局部 silentRounds / stallAlerted / roundHadText）· `:103-106`（阈值单源——函数域动态 import）· `:137-144`（轮顶结上一轮 + 越阈恰一次 + 钩子 try/catch 兜底）· `:180`（onToken：文本 ⇒ 归零） | 288→**310**（+22） |
| 5 · 钩子转发 | `thincoder-core/advisor/run.mjs:143-147`（`{ onStallRound: callbacks?.onStall }`） | 200→**204**（+4） |
| 6 · 钩子供点 | `thincoder-core/agent-tools/advisor-async.mjs:68-69`（import 叶档）· `:432`（`entry.start` 回调对象加 `onStall: (rounds) => pushAdvisorAlert(parent, \`advisor#${id}\`, rounds)`） | 494→**497**（+3；≤500 硬限 ✓） |
| 7 · 批件测档（拟新增→落盘） | `docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs`（U-ZW1–U-ZW8 + A-ZW4 送达/静态腿 = 9 用例；直驱法沿 `2026-10-04-core-patch-batch.test.mjs` 先例；核侧全真件 + fetch 桩（SSE）+ 真写工具） | +319（设计估 +~150） |

清单外改动 = 0（实动 7 档 ⊆ §6.32.7 行 1–7）。

### 红绿两读（先红后绿）

**红（改前码）**：8 红 ∥ 1 绿——`node --test docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs`（cwd = 仓根）：
- U-ZW1 / U-ZW2 / U-ZW4 / A-ZW4 = `ERR_MODULE_NOT_FOUND`（单源叶「拟新增」缺席——最直接红态）；
- U-ZW3 = 队列 0 ≠ 2 条 note；U-ZW5 = 队列 0 ≠ 1（同夹具 `_zeroWriteTurns=51` 与显示面逐字断言**批前即绿** = #417 零变面先证）；U-ZW6 = streak 49 ≠ 50；U-ZW7 = 钩子零调用 ≠ `[{rounds:50,at:50}]`；
- U-ZW8 = 绿（零行为锁定面——缺钩子 ⇒ 零推零抛，批前批后均绿）。
- 红跑共两轮：首轮暴露夹具笔误 2 处（`calls` 取数未串、U-ZW5 期望串 51/52 笔误），修正后复跑得上述逐条红读。

**绿（落地后）**：**9/9 pass**（U-ZW1–U-ZW8 + A-ZW4）；读数：越阈恰 +1 且文案逐字 / 阈下与已闩零动作 / 写后重臂两条（真写落盘 `_zeroWriteTurns=100`）/ 角色门与缺字段零抛 / 回合环 51 零写轮恰 1 条（`_zeroWriteTurns=51`、显示串逐字）/ 跨段 49+1=50 越阈（新段计数复位 1）/ 评审 50 轮恰一次携 50（文本后归零，触发时点 50、81 各验）/ 无钩子零行为 / 送达 drain 合并注入恰一条 + 静态零引唤醒面。

### 门读数

- `node --check` × 7 触档 = **exit 0**（叶档 / turn-loop / run-start / advisor-loop / advisor-run / advisor-async / 批件测档）。
- `node scripts/doc-check.mjs` = **exit 0**（悬空锚 0；报告态行数差 18 条全在 desktop 域——本批零触该域）。
- 相邻件复跑零回退：`2026-10-05-digest-accounting.test.mjs` **14/14** ∥ `2026-10-05-digest-accounting-exit-seam.test.mjs` **2/2** ∥ `2026-10-04-subagent-panel-live-face.test.mjs` **21/21**（全 exit 0）。
- `cd thincoder-core && npm test` = 形式过门（核清单自 2026-09-28 空置——`thincoder-core/test/run.mjs:42-45`；本批零改该树）。

### 审计与代码评审轮次与终态

- **偏离审计（内部 explore，轮 1）**：2 条发现——① §5 未落（= 本段落盘即结）② §6.32.6 简记与实现签名漂移（文档面）；**无部分实现 / 无静默简化 / 零超清单改动**；三条实现口径（文案函数 `(from, rounds)`、loop 阈值函数域 import、轮顶 `turns > 1` 防首轮虚计）经逐条判为可接受。
- **代码评审（内部 advisor code，轮 1）**：**VERDICT pass**——🔴 0 / 🟡 3 / 🔵 4；🟡 = ① §6.32.6 简记收正（文档面，报告不代改）② `advisor/loop.mjs` 310 > 300 咨询线（增量以注释为主；未收敛——建议设计面登记或后续收缩）③ 评审族钩子链两行（`advisor-async.mjs:432` ∥ `advisor/run.mjs:146`）无已执行证据（批件按设计以钩子注入定形；建议补「真入口」腿或收口面登记接受残余）。🔵 = `_zeroWriteStreak` 未初始化面的 NaN 卫生（门仍拦、无显示面）/ §6.32.7 行数表未回填 / 批档本段曾空 / 批件测档 319 行（本地件，先例 342 行同判）。
- **终态 = clean**：无必须修正项 ⇒ 零返工轮；🟡②③ 与 🔵 各项随本报告上抛（收口面处置）。

### 披露

1. **实现决断①**：两族文案函数取 `(from, rounds)`（§6.32.6 速记 `(rounds)` 与 §6.32.4 逐字模板 `${from}` 不自洽——单参物理上产不出定稿串；实现以定稿文案为准）。两族文案已与设计 §6.32.4 逐字**字节相等**（程序比对：设计 `:1068`/`:1072` 模板代入后 ≡ 叶档产出 ≡ 批件断言串）。
2. **实现决断②**：`advisor/loop.mjs` 的阈值 import 落**函数域**动态 import——模块域版本实测触发加载期 TLA 死锁（`unsettled top-level await`：叶 → parent-channel → async-settle ↔ advisor-async → 本档既有环），改函数域后解析即通；设计未钉 import 形，零新增静态边意图保持。
3. **逐字零改面核验**：`parent-channel.mjs` / `notify_parent` 工具面 / 唤醒面（`upstreamWaiting`·`wakeAsyncWaiters`·域文本）/ `_zeroWriteTurns` 显示面 / 端面 / 提示词面 / 三角色外派发面 = 本批零触（git diff 仅 7 档；A-ZW4 静态机检 + U-ZW5 显示串断言双锁）。
4. **行数披露**：`advisor-async.mjs` 494→**497**（≤500 硬限——守限成立，余量 3）；`advisor/loop.mjs` 288→**310**（>300 咨询线，非硬限）；其余实测见上表（与 §6.32.7 估值有出入——建议收口轮回填）。
5. **C 面单源**：阈值 / 文案 / 判据均与 §6.32 逐字一致；本段零新语义（无配置键 / 无新事件 / 无新容器 / 无新字段于交付面——推送条目走既有 `{seq, from, kind, message, ts}`）。
6. **脚本手段零用**：本段全部文档/代码写入经工具逐处落笔（无正则批量替换 / 无脚本代写）。

**勘误（落档后实读回核）**：本节上文两处 `advisor-async.mjs:432` ⇒ 实读 **:431**（`:432` = `}, designToken, documents, paths, object, designId)` 行）——即 `entry.start` 钩子供点 = `advisor-async.mjs:431`「onStall: (rounds) => pushAdvisorAlert(parent, \`advisor#${id}\`, rounds)」。其余落点实读复核全部吻合（turn-loop `:53-56` / `:74-87` · run-start `:123-128` · advisor-loop `:96-98` / `:103-106` / `:137-144` / `:180` · advisor-run `:143-147` · advisor-async `:68-69`）。

## §6 验证与收口（父代理）

**2026-10-05 13:1x · 收口**

**交付验证（实施 #62 单舱 + 终收笔 #64 + 修正轮 #60）**：

| 面 | 终值 | 核验读数 |
|---|---|---|
| 叶档（新） | `zero-write-watch.mjs` **77**——阈值 50 ∥ 两族文案（定稿字节相等）∥ `maybeZeroWriteAlert` / `pushAdvisorAlert`（恒零抛） | 批件 U-ZW1–U-ZW8 + A-ZW4 = **9/9**（红读 8 红在册） |
| 子代理族 | `turn-loop.mjs:74-87`（streak + 越阈 + 写后重臂；#417 逐字未动 ∥ **267**）∥ `run-start.mjs:123-128`（复位 ∥ **157**） | 父侧实读两处 ✓ ∥ 批件 U-ZW6/7 + A-ZW4 |
| 评审族 | `advisor/loop.mjs:96-144` / `:180`（silentRounds + 钩子 + 兜底 ∥ **310**）∥ `advisor/run.mjs:143-147`（**204**）∥ `advisor-async.mjs:431`（**497 ≤ 500** 守限兑现） | 批件 U-ZW5/8 ✓ ∥ 钩子链残余 = 登记接受（§6.32④） |
| 档面（#64 + 父侧机械笔） | §6.32.6 签名收正 ∥ §6.32.7 as-built 七行回填 ∥ >300 补行（`advisor/loop` 310）∥ 残余 / NaN 注 ∥ 「拟新增」标记清零 ∥ 「父侧定稿」字样收正 | `doc-check` exit 0 |

**父侧核验**：9/9（红绿对在册）∥ `node --check` 7/7 ∥ `doc-check` exit 0 ∥ 相邻复跑零回退（digest 16/16 ∥ panel-live-face 21/21）∥ 实读（turn-loop / run-start / §6.32.6 / §6.32.7）。

**收口结算同步清单（D7）**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（阈值 / 文案 / 七档读数）∥ 指针（§6.32 终态）∥ 变更记录（多轮）∥ 待办勾销 = **#934** ∥ 前批遗留跨核 = **无** ∥ 台账面 = 核销行。

**提交与推送**：提交 = `0eb742ef`（产品 · 6 档——**`turn-loop.mjs` ∥ `run-start.mjs` 随车消化批半改动**（其 §6 已记；#417 逐字面在先））∥ `18e08107`（文档 · 4 档）∥ 冻结笔 = 本记录（随落）；推送 = 双远端（origin/gitee ∥ github）。**凭证** = 本批 designId 槽位**终消费**（链终——槽值不入档）。
