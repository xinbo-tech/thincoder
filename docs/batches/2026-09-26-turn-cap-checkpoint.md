# 2026-09-26 · 撞帽续期检查点（turn-cap checkpoint · F8 + N7）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-26 · 来源 = 用户 2026-09-26 10:05「撞帽续期应让主 agent 检查是否续期」+ 10:09 裁定 **A+C**（续期检查点 + 零产出护栏）；触发 = eng-coder#83 跑飞（3240 轮 · 3h04m · 零产出——180 轮/段 × 18 次静默续期）。
> 台账 = #409（撞帽续期检查点 · 归批 · 本批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-26 10:05：「eng-coder 的上限现在设置的是 180 turns，3172 轮是因为自动模式下有自动续期机制，你检查一下是不是。我觉得，这个自动续期机制应该改一下，应该在轮次跑满时让主 agent 检查一下是否应该续期，这样才能真的实现巡检，否则你光说巡检，其实没有激活机制。」→ 10:09 裁定 **A+C**（续期检查点 + 零产出护栏）。

**触发事件**：实施舱 **#83** 跑飞——**3240 轮**（180 轮/段 × **18 次静默续期**）· **3h04m** · **磁盘零产出**；父侧 3 小时未巡检 ⇒ 机制侧无任何提示（F6 原文即「永不弹卡 · AUTO 自动续跑」）。

### 1.2 本批目标

**撞帽续期改为「续期检查点」+ 零产出护栏**（需求权威 = `docs/core/requirements/TURN-CAP-CONTINUE.md` **F8 / N7**，同日落）：

1. **F8（裁定 A）**：撞帽（`ContinueError`）**不再静默自动续期**——子执行体 ⇒ **报请父代理**（父代理答「续期」⇒ `resume:true` 重入 · 答「停」⇒ 部分成果 + turn-cap 标记）；depth-0（主 agent）⇒ **回用户**（既有继续卡）；**续期留痕**（池 / 状态面可查累计轮次与段数）。
2. **N7（裁定 C）**：连续 **K 轮无实质进展** ⇒ 主动停并报（**非次数帽**——与 N1 相容）；「实质进展」判据与 **K 值**由设计定（父侧记实测约束：正常读档窗口可达 ~60 轮）。
3. **全执行体覆盖（F3）**：主 agent · 子 agent · 飞刀 · 会诊。

### 1.3 判据（机器可核 · 待 §2 细化）

① 四执行体撞帽均走检查点（假 `ContinueError` 驱动 · 脱壳直测）；② 答「续期」⇒ 同执行体 `resume` 重入且**不重注入任务文本**（F2 不变量）；③ 答「停」/ 无父代理 ⇒ 部分成果 + turn-cap 标记（F4）；④ N7：连续 K 轮零进展 ⇒ 停并报，**且正常读档窗口不误杀**（边界用例）；⑤ 零回归（现全量套件不红 · 三包增量零 · doc-check 本批面零新增）；⑥ **F5（用户 Stop 优先）与 N1（无次数帽）不被破坏**。

### 1.4 边界（本批不含）

不建 live 头逐轮跳动（需求档 §4 既有边界）· **不改段内帽判定（`turn < maxTurns`）与 `ContinueError` 载荷语义**（N6）· 不改继续提示文案 · **不设次数上限**（N1）· **「无人值守不再无限续跑」= 已接受后果**（需求档 §4 —— 脚本 / CI / headless 侧按此预期调整）。

### 1.5 已知事实 / 依赖（勘面坐标 · 父侧已实读）

- **核**：`thincoder-core/agent.mjs:420`（`ContinueError` 抛点）· `agent/helpers.mjs:242-243`（`turnFrame`）· `agent/run-stages.mjs:141`（停因 `maxTurns`）。
- **CLI**：`thincoder-cli/src/tui/agent-turn.mjs:199-203`（**AUTO 档无面板自动续跑支体**——本批要改的点 · **父侧机械直改**：原载 `:194-196` = 该支的 `catch` + `autoTurn` 守卫，**非删除目标**）· `:208-229`（人工档询问路径 · 原载 `:233` 实为 provider-retry 注释）· `:40-41`（`attention` 位排除自动续跑 ⇒ AUTO 续期期间用户看不到）。
- **VSC**：`thincoder-vscode/src/extension/panel-turn-loop.mjs:107` / `:128-130`（**与 CLI 同位**的 AUTO 分支）· `panel-turn-stages.mjs:133`（人工档询问 + 落盘）。
- **子代理续跑环两处**：`runChild` / `escalate-async`（设计权威 `docs/core/design/TURN-CAP-CONTINUE.md` §4；VSC `src/agent/run-helpers.mjs:33`）——**设计前须实读**（勘面未逐行读 ⇒ **unverified**）。
- **设计权威 = `docs/core/design/TURN-CAP-CONTINUE.md`**（四执行体 + 双端坐标 + 续跑循环）；**需求权威 = `docs/core/requirements/TURN-CAP-CONTINUE.md` F1–F8 / N1–N7**。
- **自举面**：本仓自身即运行平台 ⇒「子代理续跑环」= 仓内 `agent-tools/subagent-*` + 宿主（CLI / VSC）——改的是**我们正在跑的机制**（须特别防「改坏了跑不动」）。
- 台账：**#409**。

### 1.6 授权：本批全链自动落地（用户 · 2026-09-26 10:13）

- **原话**：「**这条也自动落地**」⇒ 批 3 档 §1.11 的四条自缚**适用本批**（全链代签：设计 → 评审 → 修复轮 → **§4 代签** → 实施 → 父侧核验 → §6 收口）。
- **四条复述（自缚）**：① **代签须三条件齐备**（评审通过 + 修复主张经父侧核验 + token 已签发）；② **每次代签在 §4 写明依据**；③ **硬门仍停**（射程外新范围 / **产品裁决** / **不可逆** / 跨仓写）—— **本批特有风险 = 自举面**（改的是我们正在跑的机制）⇒ 凡触及「改坏了跑不动」的不可逆面，**停下来问**；④ **诚实优先**（跑不动就报，不美化）。
- **自举说明（记录）**：本批实施面 = 核 / CLI / VSC + 子代理续跑环 ⇒ 对**当前在跑的本会话不即时生效**（代码随进程加载；生效 = 应用重启 / 重载之后）⇒ 实施期**不会中断在飞子代理** ✓；但**验证必须覆盖「新行为真的生效」**（改了等于没改 = 不通过）。
- **射程**：本批（**#409** · `docs/batches/2026-09-26-turn-cap-checkpoint.md`）——**不含其它批**；桌面端批 8 的授权另计（用户 2026-09-25 22:17）。

### 1.7 设计轮冲突裁定：F8 的「子执行体」射程（父侧 · 2026-09-26 10:17）

- **#86 上抛**：F8「子执行体 ⇒ 向父代理报请」未分同步 / 异步——同步族（阻塞子代理 / 同步飞刀）的父代理**正被本次调用阻塞**，ask 应答**不可达**（本平台纪律原文：同步子代「回复不可达 ⇒ 应改派后续任务」）⇒ 按 A 读法同步族恒 partial ⇒ **N3（会诊继续语义）成死条**、用户卡路径退役 ✗。
- **裁定 = B**（#86 倾向 · 父侧加判据「同步族应答物理不可达」）：
  1. **异步族**（后台子代理 / 异步飞刀 / 会诊）⇒ **父代理检查点**（替换静默自动续期——#83 类正是此族 ✓）；
  2. **同步族**（阻塞子代理 / 同步飞刀）⇒ **保留既有用户卡路径**（且同步子代挂起不可续——累计 history 随调用返回丢弃；异步子代有池条目保活）；
  3. **AUTO 档一律不再自动批准续期**（同步族无人应答 ⇒ partial）。
- **需求档随动（父侧笔 · 已落）**：F8 判定句**就地收窄**（异步 / 同步两族 + AUTO 不再自动批准）+ 变更记录追加 ✓。
- **#86 获准继续**：两读法共有部分照落；B-only 支（同步族用户卡存废）= **已裁（保留）**，不再 open。
- **记功**：设计舱在**需求文本射程歧义**上停下报请，并给出两条读法的后果链（N3 死条 · history 丢弃）✓ —— 正是要的纪律。

### 1.8 设计落盘核验 + 上抛裁定（父侧 · 2026-09-26 10:22）

- **设计落盘**（#86）：设计档就地改 + 批档 §2 五节（5187 字符）+ 状态行 = 设计完成 ✓。**父侧抽检在盘**：
  - `#7 撞帽检查点`：异步 / 同步分族 + **可答判据（机械）= `child._upstream?.parent` 在场且 `sync !== true`** + **段边界挂起**（不 settle / 不重派）✓；
  - `#8 零产出护栏`：**K = 120** · 参数化 `agent.barrenTurnLimit` · 计数单点 `agent/post-turn.mjs:16` · 写盘单点 `advisor-settle.mjs:48` ✓；
  - D-TC12–D-TC17：含**否决项与代价披露**（D-TC16 的 K 依据 = 实测读档上界 ~60 的两倍；D-TC17 代价 = 默认预算 100 &lt; K 120 ⇒ 最坏多烧 1 段，加固选项登记 open）✓。
- **上抛裁定（六条）**：
  1. **① 核坐标漂移**（`agent.mjs:420` ⇒ **`:432`**）= **收**（父侧实读确认：`throw new ContinueError(maxTurns)` 在 `:432`）⇒ 需求档 F8 **已机械收正** + 变更记录 ✓。
  2. **② CLI 坐标「收正」= 不予确认** ✗ —— 父侧实读 `thincoder-cli/src/tui/agent-turn.mjs`：`:194` = `if (error instanceof ContinueError) {` · `:195` = `if (autoTurn) {` · `:196` = `// …§6.8 digest turn-cap 规则…` · `:233` = `// 询问（复用 permission 机制…` ⇒ **原载 `:194-196` / `:233` 正确**；设计舱的 `:199-203` / `:208-229` 与之相抵（疑读 `.thincoder/tmp/cli-pkg/…` 发布拷贝，或锚粒度不同）⇒ **批档 §1 不改**，两说**交评审核**（父侧不擅改设计档）。
  3. **③ 设计档 §3.2 死指针就地收正** = **收**（一致性面 ✓）。
  4. **④ 会诊 `_upstream` 补赋 ⇒ consultant 获 `notify_parent` 能力** = **收**（F8 要求会诊族能报请 ⇒ 能力必须给；上行通道纪律本身对 ask 有条件过滤 ✓）。
  5. **⑤ `cancel` 对挂起 child 的现档行为** = **收**（**实施期实核项** · 随 §2.6 上抛）。
  6. **⑥ doc-check 本批面零新增** ✓。
- **评审**：**已发**（#87 —— 目标 = §2 + 设计档改动面 + 需求 F8/N7；重点 = 四执行体落点 · 双端同位 · **相容证明（F2/F4/F5/N1/N6）** · N7 两向边界 · 坐标准确性）。
- **同刻他线**：桌面批 8 两舱在飞（#84 **145**/180 · #85 **132**/180 · 落盘健康）；#85 报面 = `npm test` 清单闸红两处**归 8a**（`test/files.mjs` 登记 + 白名单计数 10 → 13 随动）——**已在 8a 派单域内**，不另处置 ✓。

### 1.9 评审轮次 1（#87）裁定 + 修复轮（父侧 · 2026-09-26 10:29）

- **#87 = changes-required**（🔴 3 · 🟡 5 · 🔵 3 · §3 已写入 · 无 token）⇒ **十一条全收**（其中 2 条父侧本轮自处置）⇒ 修复轮 **#88**（逐号 · 修后为准）。
- **§1.8② 判语作废（父侧自纠 · 记过）**：我先前「原载 `:194-196` / `:233` 正确、设计与之相抵」的判断**错**——评审实读判决：**设计锚点为准**（改点 `:199-203` = AUTO 自续支体 · 落点 `:204-206` · 人工卡 `:208-229`；`:233` 实为 provider-retry 注释）；批档数字疑取自发布快照 `.thincoder/tmp/cli-pkg/…:193-197`（**旧版** 375 行）；且 `:194-196` = `catch` + `autoTurn` 守卫（**不可作删除目标**）。
  **教训**：我只 `grep` 了 `ContinueError|autoTurn` 就下了判语——**锚点核验必须核到"被指的那块本体"**，不是"那个词在某行出现"。（§1.5 的 CLI 行已按此**机械直改**；§1.8② 原文**保留可见**以存错痕。）
- **逐条裁定（十一条）**：
  1. 🔴1（CLI 锚点两说）= **Fixed**（§1.5 机械直改 + 本块；设计锚点为准）。
  2. 🔴2（F8 答复侧无接线点 · 答复侧两档标 ±0 · `subagent-actions.mjs` **496** 距 500 硬限 4 行）= **Dispatched**（#88：写明兑现调用点 + 按实增量 + 拆分/落点方案）。
  3. 🔴3（#5 队列语义相抵）= **Dispatched**（#88：改写作「队列消费者 = 会诊 · 同步族 = `_permQueue` · depth-0 = 直接卡」；删绝对表述）。
  4. 🟡4（N7 射程未写明：VSC 主 agent 无计数点 · depth-0 无跳闸点）= **Dispatched**（#88）。
  5. 🟡5（两新增计数的复位落点未标注）= **Dispatched**（#88）。
  6. 🟡6（§3.1 遗留锚点 6 处）= **Dispatched**（#88）。
  7. 🟡7（需求档旧坐标 F1/F2/F4/F6/N3）= **Fixed（父侧笔 · 本轮做）**：五处加「迁移期引文」标（沿 F3 先例）+ 变更记录。
  8. 🟡8（规范面「原载…」残句 3 处）= **Dispatched**（#88）。
  9–11. 🔵9 / 🔵10 / 🔵11 = **Dispatched**（#88）。
- **排程**：#88 落 → 父侧核验 → **评审轮次 2**（通过才发 token）→ §4 代签 → 实施。
- **同刻他线**：桌面批 8b **自拆完成**（报备：`renderer/events-subscribe.mjs` 67 · `test/events-page.test.mjs` 172；原两档回层内 286 / 155）；**`test/files.mjs` 十七 → 十八档** 归 8a —— **已转达** #84 ✓。

### 1.10 修复轮 #88 落地 + 父侧 🟡7 收正 + 基线位移归因（父侧 · 2026-09-26 10:45）

- **#88 交付 = 9/9 全落**：🔴2 兑现接线（`send` 两处 +1 行 · `subagent-actions.mjs` **496 → 499**，余量 1 行，超限备选在册）· 🔴3 队列语义重写 · 🟡4 N7 射程 · 🟡5 复位落点 · 🟡6 六坐标 · 🟡8 残句清除 · 🔵9 / 🔵10 / 🔵11；批档 §2.7 + 状态行 = 设计完成 ✓。
- **父侧核验**（抽读在盘）：设计档 `:21`（队列 = **会诊唯一** · 同步族 `_permQueue` · depth-0 直弹卡 ✓）· `:29`（N7 射程 = 子代段边界 · depth-0 无跳闸 · **VSC 主 agent 无计数点** ✓）· `:30`（复位落点 = `agent.mjs:143-147` ✓）· `:82`（**send 兑现两处** + 496 → 499 ✓）· `:142`（逃逸三分档 ✓）✓。
- **父侧 🟡7 收正（本轮已落）**：需求档 **F1 / F2 / F4 / F6 / N3** 五行加「（迁移期引文）」标（沿 F3 先例）+ F1 行内语法收正 + 变更记录 ✓；检查器判该五处为「**标记冗余——报告面 · 不入闸**」（路径按后缀可解析 ⇒ 非闸面；语义上仍标"迁移期" ✓）。
- **闸基线位移归因（新发现 · 记录）**：全仓悬空 **7 → 13**（+6）——六条**全为 `session-io.mjs` 家族锚**（`SESSION.md:33/37/300/822/850` · `ENG-TOKEN-BINDING.md:98`）；**两档 mtime 为旧**（09-25 / 09-18）且本批**从未触碰** ⇒ **非本批面**；实读归因 = `thincoder-vscode/src/extension/session-io.mjs` 处于**未提交修改态**（`git status` = `M`）⇒ 系**另一活跃实例（pid 17904）的在途工作面** ⇒ **本席不触碰**（跨会话边界 ✓）。本批自面（设计档 + 需求档 + 本档）**零悬空** ✓。
- **新债入册**：**#411**（`_turnSeqBase` 无生产者 · 条件型 · 修复轮上抛）。
- **评审**：**轮次 2 已发**（#89 —— 核 9 条修复主张 + 2 条父侧自处置 + 坐标准确性）。

### 1.11 实施中裁定：VSC 半 AUTO 豁免补足（父侧 · 2026-09-26 11:45）

- **#90 上抛**：用例 10 VSC 半——设计只写一处落点（`panel-callbacks.mjs:276` 除名），**实跑证伪**（AUTO 开 + 键形 `onPermissionRequest(&quot;continue&quot;, …)` ⇒ `resolved:true` / `_permissionQueue=0` / 零 `permissionRequest` 卡）——键形分支委派 `permissionGate(panel)`，其 live-AUTO 读（`permission-gate.mjs:61`）**无卡直批** ⇒ F8「AUTO 一律不再自动批准续期」在 VSC **未达成** ✗。
- **裁定 = 授权补足（最小面）**：
  1. **依据** = F8 为**用户裁定级**（+ D-TC15 + 用例 10）⇒ **不可收窄**（收窄 = ship 违反已裁行为的路径 ✗）；设计漏落点 = **设计面缺口**，补足非新范围 ✓（同 §1.14 先例）。
  2. **红线**：新增 opt **默认关**（仅 `continue` 分支置位 ⇒ 他路径零变化）· **两臂**（`continue` 路 —— AUTO 不出 auto-approve / 落卡待答 ⇒ 无人应答 partial；**反例臂** —— 非 `continue` 既有 AUTO 直批不变）· 仅两清单外档（`thincoder-vscode/src/extension/permission-gate.mjs` 认 opt · `thincoder-core/agent-tools/child-permission.mjs` 透传）+ `panel-callbacks.mjs` 置位——**再扩面须再报** · CLI 半已绿**不动**。
- **披露**：两清单外档 + 设计档缺口（§2.3 / D-TC15 落点不完整）= 实施舱 **§5 如实列**；**设计档补正 = 实施后修正轮（designer）** ✓。
- **记功**：实施舱**实跑证伪后停下报请**（未照设计字面交货）✓ —— 正是「设计缺口 ⇒ 停并报」纪律。

### 1.12 交付核验 + 修正轮派发（父侧 · 2026-09-26 12:22）

- **#90 交付 = 全绿**。**父侧亲跑**：新用例档 ⇒ **12/12 pass** ✓；**core 全量套件 ⇒ 702/702 · 0 fail** ✓（其报 CLI **865** / VSC **1009** 亦全绿）；`checkpoint.mjs`（117 行）**逐行实读** ✓ —— 三档逃逸 ✓ · **「先臂后报请」竞态防御记功**（`rec.resolve` 与 abort 监听在 `pushChildUpstream` **前**就位——否则同步唤醒窗口内「登记已写 / resolve 未挂」⇒ **兑现假成功、挂起不收敛**）✓ · 零依赖叶 ✓ · 注册后复检沿 `permission-gate.mjs:80-81` 同款序 ✓。
- **A1–A8 八条判定线全落** ✓（含 §1.11 授权补足：`permission-gate.mjs:66` 认 `forceAsk` · core `child-permission.mjs:36/:42` 透传——**三条红线实核**：默认 `false` · 置位唯二（均 `continue` 名分支）· 他名零变 ✓）；越清单 9 项（两授权档 + 测试面 6 + `AGENT-PARAMS` 1）**全披露** ✓。
- **上抛裁定（六条）**：
  1. **行号复漂全族**（本批自身插入所致 ⇒ 设计档 11 处 + `post-turn.mjs:14` **错档指针**）= **收** ⇒ **需求档 F8 坐标父侧本轮机械直改（`:432` ⇒ `:439`）** ✓ + 设计档族 ⇒ **#95**；
  2. **AUTO × 同步族撞帽落卡**（无人应答 ⇒ partial）= **收** ⇒ #95 明文化；
  3. **新串语言 = 英文**（沿核内报告面既有形态 · 面向模型面）= **收**（不改）；
  4. **§2.6 ④ 会诊 `_upstream` / `notify_parent` 能力** = **已裁**（§1.8 项 4「收」）⇒ **确认** ✓；
  5. `AGENT-PARAMS.md` 由实施舱改 1 行 + 变更行（父侧派单曾注「勿改设计档」· §2.3 表却列该档）⇒ **收**（披露 ✓ · **歧义在父侧** ⇒ 教训入档）；
  6. `subagent-actions.mjs` **499/500**（余量 1 行）⇒ **拆分层条件型待办 #413 已记**（该档下次被触碰的批**先拆后改**）✓。
- **修正轮 #95 已派**（designer · 实施后修正轮）：设计档族坐标复核（11 处 · 旧 ⇒ 新对照）· `post-turn.mjs:14` 错档指针 · **用例 14 登记**（异步飞刀族）· 测试面 6 档登记 · AUTO × 同步族落卡明文化 · `AGENT-PARAMS` 校验。
- **排程**：#95 落 → 父侧核验 → **§6 收口**——**撞帽机制就此落地，「跑飞无人知」绝迹** ✓。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-09-26（修复轮 #95：六项派发 + 🟡12 全落（§2.8）；设计档族坐标 = 实施后现盘实核；用例 14 + 测试面登记入 §2.3；🔵13 留 §6 收口）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批次**：撞帽续期检查点 · 台账 #409
**设计档**：`docs/core/design/TURN-CAP-CONTINUE.md`（本轮就地改：§1 新增 #7/#8 + 随动收正 · §2 表与 CLI 段 · §3.1 新增 9 行 / §3.2 收正与退役登记 · §4 段数留痕 · §5 D-TC12–D-TC17 · 变更记录一行）
**需求档**：`docs/core/requirements/TURN-CAP-CONTINUE.md`（F1–F8 / N1–N7；F8 = 父侧 2026-09-26 就地收窄版）

### 2.1 本批覆盖的需求条目（判定线逐条可机核）

| # | 需求条目 | 判定线 |
|---|---|---|
| 1 | **F8 · 异步族 ⇒ 父代理检查点**（后台子代理 / 异步飞刀 / 会诊） | 后台 async 子代撞帽 ⇒ **不自动续期**；父代理侧可见 ask（载段数 / 跨段累计轮次 / 零进展轮数 + 去向一句话）；父答 `send` ⇒ `resume:true` 重入、history 保留、任务文本不重注入（F2）；父答 `cancel` ⇒ 返回文本含 `TURN_CAP_MARK` |
| 2 | **F8 · 同步族 ⇒ 用户卡保留**（阻塞子代理 / 同步飞刀） | 阻塞子代 / 同步飞刀撞帽 ⇒ 仍发 `onPermissionRequest("continue", …)`（卡面出现）；父侧调用方**不被挂起**；**不新增检查点式挂起**、同步族阻塞语义不变（用户卡保留） |
| 3 | **F8 · AUTO 不再自动批准续期** | AUTO 档下 `continue` 请求**不**被短路批准（CLI `interaction.mjs:68` / VSC `panel-callbacks.mjs:279` 对 `continue` 名排除）——无自动放行、无自动重入 |
| 4 | **F8 · depth-0 无人值守档不再自续** | CLI `agent-turn.mjs:195-201` / VSC `panel-turn-loop.mjs:128-135` 的 AUTO 自续支删除 ⇒ 落既有停止行（partial）；人工档卡（CLI `:203-224` / VSC `:142-152`）行为不变 |
| 5 | **F8 · 挂起不 settle / 不重派**（D-TC12） | 挂起期间池条目**仍在飞**（`status` / `observe` 可见）；无新 child 对象、无新池条目；兑现后同一 `id` 继续 |
| 6 | **N7 · 零产出护栏**（K = 120） | 连续 K 轮无实质进展（`_mutationSeq` 零增 ∨ 无用例 / 断言增）⇒ 段边界**硬停并报**（直接 partial + 零进展原因，**不询问**）；正常读档链（≈60 轮）不跳闸 |
| 7 | **N2 / N3 / F2 / F5 不回归** | 续期 = 新段预算（会诊 watchdog 同重置——N3）；不重注入任务文本、history 保留（F2）；abort / Stop 优先（挂起期间 Stop ⇒ 立即 partial，F5） |
| 8 | **续期留痕**（F8 尾句） | 池摘要**文本**面可读「段数 S · 累计 N 轮 · 零进展 X」（桥字段零新增） |

### 2.2 显式不在本批（边界）

- **段中跳闸**（N7 只在段边界；加固选项登记 `open`——设计档 §5 D-TC17）。
- **新动作 `action:'resume'`**（否决——复用既有 `send` / `cancel`；设计档 D-TC13）。
- **同步族改走检查点**（裁定 B：用户卡保留）。
- **会诊子代 `notify_parent` 能力限制**（`_upstream` 补赋的副作用——登记并上抛，见 2.6）。
- **桥字段 / 事件新增**（零新增；留痕走摘要文本面）。
- **提示词面 · 需求档 · 非本仓面**（权在主代理）。
- **需求档 F8 的核坐标漂移**（`:420` 实为 `:432`）——reported，不在本批改（见 2.6 ①）。

### 2.3 受影响文件（行数 = as-of 2026-09-26 实核；增量 = 预计）

| 文件 | 行数 | 增量 | 改动 |
|---|---|---|---|
| `thincoder-core/agent-tools/checkpoint.mjs` | 新增 | +~70 | 新零依赖叶（5 导出：`registerTurnCapCheckpoint` / `settleTurnCheckpoint` / `settleConsultCheckpoint` / `resumedSendResult` / `turnCapTrace`）：ask 载荷 / 挂起登记 / 单一兑现点（幂等）/ 逃逸三分档 / 留痕文本构造 |
| `thincoder-core/agent/spawn-child.mjs` | 259 | +~30 | `runWithContinue`：段计数 + ask 反馈支（`resume` 语义零改） |
| `thincoder-core/agent/post-turn.mjs` | 71 | +~15 | N7 计数单点（`_mutationSeq` 增量 ⇒ `_barrenTurns`） |
| `thincoder-core/agent/helpers.mjs` | 464 | +3 | `DEFAULT_BARREN_TURN_LIMIT = 120`（默认值单源） |
| `thincoder-core/agent-tools/subagent-run.mjs` | 226 | +~15 | async 子代 askContinue ⇒ 检查点 |
| `thincoder-core/agent-tools/escalate-async.mjs` | 303 | +~12 | async 飞刀 askContinue ⇒ 检查点；**`consumeInjected` 补配 +~2**（既有缺口） |
| `thincoder-core/agent-tools/consult.mjs` | 472 | +~14 | 会诊 ask 分支改报请（`continueQueue` 串行保留）+ `_upstream` 补赋；**`consumeInjected` 补配 +~2** |
| `thincoder-core/agent-tools/subagent-actions.mjs` | 496 | **+3 ⇒ 499** | send 兑现两处（`:312` 池未命中分支 `settleConsultCheckpoint` · `:323` `settleTurnCheckpoint`）+ import 1 行；留痕行**下沉新叶**（余量 1 行——超限即停并报，备选见设计档 §3.1 超限缓冲） |
| `thincoder-core/agent-tools/subagent-async.mjs` | 457 | **±0（已实核）** | `cancel` 走既有 abort 信号链（`:174` 停单点 · running 面 `:206-210` `entry.controller.abort`）⇒ `askContinue=false` ⇒ `onDeclined` partial + `TURN_CAP_MARK`——非免接线 |
| `thincoder-core/agent.mjs` | 443 | +~4 | 三计数复位并点：`_turnSeq`（既有 `:146-155`）+ `_barrenTurns` / `_continueSegments` 并入同点 |
| `thincoder-cli/src/tui/interaction.mjs` | 143 | +3 | AUTO 短路排除 `continue` 名 |
| `thincoder-cli/src/tui/agent-turn.mjs` | 385 | −5 | AUTO 自续支删 ⇒ 落既有停止行 |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 189 | −5 | 同上（VSC） |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | 308 | +3 | live AUTO 短路排除 `continue` 名 |
| `thincoder-core/test/turn-cap-checkpoint.test.mjs` | 新增 | ~200 | 本批用例（2.5 表） |
| `docs/core/design/AGENT-PARAMS.md` | — | +1 行 | 参数登记 `agent.barrenTurnLimit` |

**测试面登记（#95 · 派发项 ④ · 现盘实读）**：

| 档 | 行数 | 用例 / 面 |
|---|---|---|
| `thincoder-core/test/child-ask-attribution.test.mjs` | 133 | T-A3 退役（语义迁新档用例 3——在档注明） |
| `thincoder-core/test/core-hygiene.test.mjs` | 211 | 新档行数登记 `:94-98` / 注册集合 `:114` |
| `thincoder-cli/test/permission-transit.test.mjs` | 144 | 用例 10 CLI 半（`:127`） |
| `thincoder-cli/test/provider-error-surface.test.mjs` | 309 | 用例 11 CLI 半（`:130` · T-CAP1） |
| `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs` | 303 | 用例 10 VSC 半（`:214`） |
| `thincoder-vscode/test/integration/vsc-turn-cap-digest.test.mjs` | 104 | **新档**——用例 11 VSC 半 |
| `thincoder-vscode/test/integration/files.mjs` | 24 | 新档注册（`:23`） |

说明：上列 = 6 测试档 + 1 注册档（清单外改动，本块补登记；逐条原因见 §5.5）。本批新档 `turn-cap-checkpoint.test.mjs` 实施值 = **498 行**（本表上方表列预估 ~200——差距与拆分建议见 §5.5 / §5.6-5）。核 / CLI 无测试档清单闸（测试收集单层 glob）⇒ 仅 VSC 侧有注册动作；两授权档（`agent-tools/child-permission.mjs` · `extension/permission-gate.mjs`）= §1.11 授权面、§5.5 披露面，不入本表。

### 2.4 验收标准（逐条回指 2.1）

| AC | 回指 | 判定 |
|---|---|---|
| A1 | 1 | 用例 1 / 2 / 3 / **13** / **14** / 9 全绿 |
| A2 | 2 | 用例 10 的同步族面（卡面出现 + 父不挂起）· 用例 7（headless ⇒ 不挂起） |
| A3 | 3 | 用例 10 |
| A4 | 4 | 用例 11 |
| A5 | 5 | 用例 1 的挂起期断言（池条目在飞、无新条目、同 id 继续） |
| A6 | 6 | 用例 4（跳闸 + 不询问）· 用例 5（K 下界不跳闸）· 用例 6（K 上界跳闸） |
| A7 | 7 | 用例 3（watchdog 重置）· 用例 8（Stop 优先） |
| A8 | 8 | 用例 12 |

### 2.5 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| 1 | 正常 | async 后台子代（预算 2 轮）撞帽；父 `send` 续期 | 父侧可见 ask（段数 / 累计轮次 / 零进展）；挂起期池条目在飞；续后同 id 完成，history 保留、任务文本未重注入 |
| 2 | 正常 | 同 1；父 `cancel` | 返回文本含 `TURN_CAP_MARK`；条目标 partial |
| 3 | 边界 | 会诊（`consultTurns` 小）撞帽；父 `send` | ask 可见；续期 ⇒ 新段预算 + **watchdog 重置**（N3）；`continueQueue` 串行不破 |
| 4 | 边界 | K 注入小值（3）· 子代 3 轮零进展 | 段边界**跳闸**、**无 ask**、partial 含零进展原因 |
| 5 | 边界 | **正常读档链 ≈60 轮零写盘** + K = 120 | **不跳闸**（K 下界：不得误杀读档期） |
| 6 | 边界 | **180 轮 / 段单段（#83 形态）** + K = 120 | 段边界跳闸（K 上界：抓得住本批缺陷） |
| 7 | 错误 | **同步族** · 无 `onPermissionRequest`（headless） | 不挂起，直接 partial |
| 8 | 错误 | 挂起期间 Stop / abort | 立即 partial；无 ask 残留、不重入（F5 优先） |
| 9 | 错误 | 挂起后父代不再应答（会话收尾） | 条目收为 partial；无悬挂进程 |
| 10 | 正常 | AUTO 档（CLI / VSC）· 同步子代撞帽 | `continue` 卡**不被**自动批准；父调用方不被挂起 |
| 11 | 正常 | AUTO + digest 无人值守 · 主 agent 撞帽 | 原自续行消失 ⇒ 直接停止（partial） |
| 12 | 正常 | `status` / `observe` | 摘要文本含「段数 / 累计轮次 / 零进展」 |
| 13 | 边界 | **异步族** · 无 `onPermissionRequest`（headless 档） | 仍登记检查点**挂起**（等父 `send`）——不因 handler 缺席降级 partial（答复通道 = 父 `send`，非权限 handler） |
| 14 | 正常 | **异步飞刀族**（F8 第二执行体）· 飞刀（`subagentTurns` 小值）撞帽；父 `send` 续期 / `cancel` 两向 | ask 经池载具可见（`escalate#…` · 「segments 1 · accumulated 2 turns · barren 2」+ `send` / `cancel` 指引）；挂起期 `status: running`、池 1 条、不经 `_permQueue`；`send` 返 `resumed:true` · 新段 TASK 恰一次 + 续期文本恰一次、`_continueSegments:2`、同 id 收口；`cancel` ⇒ partial 匹 `stopped: turn cap reached (2 turns)`、不再起新段 |

### 2.6 待核与上抛（reported，非本批改动）

① 需求档 F8 载核坐标 `thincoder-core/agent.mjs:420` —— 实核为 `:432`（抛点）：**漂移，上抛主代理**（需求档笔在主代理）。
② 批档 §1 载 `agent-turn.mjs:194-196` / `:233` ⇒ 实为 `:199-203` / `:208-229`；`:420` ⇒ `:432`：**漂移，上抛**。
③ 设计档 §3.2 端 `agent-tools/*` 行 = **死指针**（`thincoder-vscode/src/agent-tools/` ENOENT 实核，现存仅 `async-discard.mjs` / `index.mjs`）——已就地收正为**退役登记**（一致性面，逐条已报）。
④ 会诊子代 `_upstream` 补赋 ⇒ consultant 获 `notify_parent` 上行工具能力（**副作用**）——需主代理裁定是否接受；不接受则检查点通道另择（本档按接线落）。
⑤ 本批 **doc-check 面零新增**（不新增机核规则；三闸不变）。

### 2.7 修复轮 #88 · §3 轮次 1 逐号处置（2026-09-26）

**处置结果（分派 9 条全落 · 号 → 落点）**：落点 = 设计档 `docs/core/design/TURN-CAP-CONTINUE.md`（行号 as-of 本轮实核）· 批档 = 本段就地收正。

| §3 号 | 处置 | 落点 |
|---|---|---|
| 🔴2 | 接线落盘 + 增量按实际收正 | 设计 §3.1 表注 `:82`（兑现两处 + 496 → 499）· `:83`（兑现判定序：池命中 → 会诊登记 → miss 回落）· `:84-85`（兑现后消费路径 + `consumeInjected` 缺口登记）；§2.3 两行改 `subagent-actions.mjs` **±0 → +3 ⇒ 499** · `subagent-async.mjs` **±0（已实核）** |
| 🔴3 | 队列语义改写（删绝对表述） | 设计 `:21`（#5：消费者 = **会诊（唯一）**（`agent-tools/consult.mjs:321-322`；检查点报请串行其上）· 同步族 = `_permQueue`（`agent-tools/subagent.mjs:313` / `escalate-async.mjs:237`）· depth-0 直弹卡 · 异步族 = 上行报请（无队列））；`:83` 同源 |
| 🟡4 | N7 射程写明 | 设计 `:28-29`（计数口径 = 仅带工具执行的回合（`agent/post-turn.mjs:16` 计数体内 `:54-60`）· 跳闸点 = **子代段边界**（`agent/spawn-child.mjs:272-273` 前）· 计数单点 = `thincoder-core/agent.mjs:436` · depth-0 无跳闸点 · VSC 主 agent 无计数点（内联回合尾 `thincoder-vscode/src/agent.mjs:421-438`）） |
| 🟡5 | 复位落点归表 | 设计 `:30`（`_barrenTurns` / `_continueSegments` 复位落点 = `thincoder-core/agent.mjs:143-147`）；§2.3 新增行 `thincoder-core/agent.mjs` 443 行 **+~4** |
| 🟡6 | 遗留坐标逐条收正 | 设计 §3.1 遗留行 / §5：（本轮实核 ✓）骨架 `agent/spawn-child.mjs:233` · `TURN_CAP_MARK` 再导出 `:35` · 镜像层（子代理）`agent-tools/subagent-run.mjs:123-139`（正则 `:129`）· 镜像层（飞刀）`agent-tools/escalate-async.mjs:212-216`（正则 `:212`）· 主 agent `makeController` `thincoder-cli/src/tui/agent-turn.mjs:132`/`:137` · D-TC11 = `agent-tools/subagent-actions.mjs:472`（`ctx._subagentKey = escId`）；同一锚点单一行号 |
| 🟡8 | 规范面修订式表述清除 | 设计规范面 `原载…` 残句 0 命中（三处逐条清：§1 #1、§3.1 两处）；沿革归 `:182` 变更记录条 |
| 🔵9 | 计数口径写明 | 设计 `:28` |
| 🔵10 | 用例族位标定 + 对位新增 | §2.5 用例 7 标「**同步族**」· 新增用例 13（**异步族**对位：headless 仍挂起）；§2.4 A1（用例引用 → 7 + 13）· A2（+ 用例 7）随动 |
| 🔵11 | 判定线改写 | §2.1 #2 补句「**不新增检查点式挂起**；同步族阻塞语义不变（用户卡保留）」 |

**增量收正表（§2.3 就地改毕 · 逐条）**：

- `agent-tools/checkpoint.mjs`：+~90 → **+~70**（5 导出）。
- `agent-tools/subagent-actions.mjs`：±0 → **+3（496 → 499）**——① import ② `:306` 池未命中分支（`if (!entry)` 内、advisor 判后）`settleConsultCheckpoint(agent, key, message)` ③ `:320` `entry._injected.push` 后 `settleTurnCheckpoint(entry)`；余量 1 行，超限备选 = `executeObserveAction` 迁零依赖叶（先例 `:336`）。
- `agent-tools/escalate-async.mjs`：+~10 → **+~12**（含 `consumeInjected` 补配 +~2）。
- `agent-tools/consult.mjs`：+~12 → **+~14**（同配）。
- `thincoder-core/agent.mjs`：**新增行 443 行 +~4**（复位点并入 `_barrenTurns` / `_continueSegments`）。
- `agent-tools/subagent-async.mjs`：**±0（已实核）**——`cancel` 走既有 abort 信号链（`:174` 停单点 · running 面 `:206-210` `entry.controller.abort({abortTrigger:"cancel"})`）⇒ `askContinue=false` ⇒ `onDeclined` partial + `TURN_CAP_MARK`，非免接线。

**新发现（reported · 非本批引入）**：

① **`consumeInjected` 缺口**：唯一提供点 = `thincoder-core/agent-tools/subagent-run.mjs:156`（`drainInjectedQueue` 导出 `:33`；消费点 = 核 `agent.mjs:235`）；**异步飞刀 / 会诊未配** ⇒ `send` 到在飞飞刀 / 会诊的文本**现档静默丢弃**——本批续期文本正依赖该通道 ⇒ 同批补配（+~2/档）。
② **`_turnSeqBase` 无生产者**：`thincoder-core` + `thincoder-vscode/src` 全域仅 1 命中（消费者 `thincoder-vscode/src/agent.mjs:173`）；该档 `:168` 注释「本端子代理面每段续跑 = 新 agent 对象」与核单源管线事实（`agent-tools/subagent-async.mjs:305-308` `runChildPipeline` → 核 `runAgent`）不一致 ⇒ 载体疑陈迹 / 既有缺陷——**本档不自改，上抛主代理**。
③ **三闸实跑一次（交付前）**：本档 **0 悬空 / 0 超宽**；全档 = 悬空 14 · 行宽 18（全在他人档 / 需求档面；含需求档 `docs/core/requirements/TURN-CAP-CONTINUE.md:78` `agent.mjs:420` = §2.6 ①）。
④ **§2 面就地收正清单（一致性面 · 已逐条报）**：§2.1 #2 判定线补句 · §2.3 六处（4 增量改 + 2 新增行）· §2.4 A1/A2 用例引用 · §2.5 用例 7 族位 + 用例 13 新增 · §2.6 五条（原 ⑤「`cancel` 未实核」已销号删除，原 ⑥ doc-check 条并作 ⑤ ⇒ 上抛 6 条 → **5 条**）。

> 未入本轮处置表的 2 条：🔴1（CLI 续跑锚点两说相抵——批档 §1 面）· 🟡7（需求档坐标滞后）——**各自笔在主代理**，本轮未动。

### 2.8 实施后修正轮 #95 处置（2026-09-26 · eng-designer）

**派发** = §1.12 六项（① 设计档族坐标复核 ② `post-turn.mjs:14` 错档指针 ③ 用例 14 登记 ④ 测试面 6 档登记 ⑤ AUTO × 同步族落卡明文化 ⑥ `AGENT-PARAMS` 校验）+ §4.1 🟡12（轮次 2 新项 · Deferred ⇒ 本轮处置）。**六项全落**——落点 = 设计档 `docs/core/design/TURN-CAP-CONTINUE.md`（坐标 as-of 本轮现盘实核）+ 本段就地收正 6 处 + §2.3 测试面登记块（本轮新增）。

#### ① 设计档族坐标复核（旧 ⇒ 新 · 逐对现盘实核）

| 面 | 旧载 | 现盘实核 |
|---|---|---|
| 撞帽抛点（核） | `agent.mjs:432` | `agent.mjs:439`（`throw new ContinueError(maxTurns)`） |
| N7 计数单点（`injectPostTurn` 调用） | `agent.mjs:429` | `agent.mjs:436`——分支注释「Model is executing tools」在 `:429`（两者分行；§1 #8 注「`:429` 起…」即指注释行） |
| `runAgent` 入口（含 `consumeInjected` 形参） | `agent.mjs:96` | `agent.mjs:101` |
| 三计数复位落点 | `agent.mjs:143-147` | `agent.mjs:146-155`（`_continueSegments` 承载式赋值 `:145`） |
| `consumeInjected` 消费点（核） | `agent.mjs:235` | `agent.mjs:242` |
| 续跑骨架 / 循环头 | `spawn-child.mjs:233` / `:248` | `spawn-child.mjs:250`（`runWithContinue` 定义行）/ `:265` |
| 段边界判定点 | `spawn-child.mjs:253` | `spawn-child.mjs:272-273`（跳闸判 `:272` · `askContinue` 调用 `:273`） |
| N7 阈值 / 跳闸 / 硬停文案（实施新增面） | — | `spawn-child.mjs:222-224`（`barrenLimit`）· `:227-228`（`barrenTrip`）· `:232-233`（`barrenStopNote`） |
| N7 计数体 | `post-turn.mjs:54-60` | 不变（`injectPostTurn` 定义行 `:16` 亦不变） |
| async 子代：报请面 / `consumeInjected` 提供点 | `subagent-run.mjs:176` / `:156` | `subagent-run.mjs:174` / `:157` |
| async 飞刀：报请面 / `_permQueue` 权限面 | `escalate-async.mjs:247` | `escalate-async.mjs:252`（`askContinue`）/ `:242`（`enqueueAsk(… "_permQueue" …)`） |
| 会诊报请面 | `consult.mjs:304`/`:319`/`:322`/`:324` · `:316-330` | `consult.mjs:329-340`（检查点块）· `continueQueue` `:331` · runner `:313` |
| send 兑现两处（实施新增面） | — | `subagent-actions.mjs:312`（池未命中分支）/ `:323`（`entry._injected.push` 后） |
| 检查点叶（实施新增档） | — | `checkpoint.mjs`（117 行）——ask 载荷 `:81-82` / 早返体 `:115` |
| CLI 主 agent 续跑 | `agent-turn.mjs:194-196`（§1 载） | `agent-turn.mjs:194`（捕 `ContinueError`）· AUTO 支退役 `:195-201` · `continue` 卡 `:203-224` |
| VSC 端三类 / 抛点 / 回合尾（N7 对位） | `:7` / `:46` / `:441` · `:421-438` | 实核不变（本轮复读 ✓） |

**设计档落点** = §1 #1/#2/#3/#5/#7/#8 · §2 CLI 段 · §3.1 表与表注 · §3.2 · §4 · §5（D-TC8 / D-TC11 / D-TC13 / D-TC15）；设计档坐标现全为本轮现值；变更记录一行只载新值（修订式残句已清）。

#### ② `post-turn.mjs:14` 错档指针（收正）

实读：`post-turn.mjs:14` 在注释体内、无「Model is executing tools」字面串；该串实在核 `agent.mjs:429`（分支注释行），计数调用 = `:436`。设计 §1 #8 注与 §3.1 同款注已收正为「核 `thincoder-core/agent.mjs:429` 起…（支末调用计数单点 `:436`）」；`post-turn.mjs:16`（定义行）原判正确、未动。

#### ③ 用例 14 登记（异步飞刀族 · §5.6-2 上抛项）

§2.5 行 14 在案（§2.4 A1 引用已收正为「用例 1 / 2 / 3 / **13** / **14** / 9 全绿」）。用例 14 断言面 = 异步飞刀撞帽 ⇒ ask 经池载具可见（「segments 1 · accumulated 2 turns · barren 2」+ `send` / `cancel` 指引）· 挂起期条目 `status: running` · 父 `send` ⇒ `resumedSendResult`（新段 TASK 恰一次 + 续期文本恰一次 · `_continueSegments:2` · 同 id 收口）· `cancel` ⇒ partial + `TURN_CAP_MARK`。

#### ④ 测试面登记（派发项 ④）

§2.3 新增「测试面登记」块 = 6 测试档 + `files.mjs` 注册档（行数 = 现盘实读 133 / 211 / 144 / 309 / 303 / 104 + 24）；本批新档 `turn-cap-checkpoint.test.mjs` 实施值 = **498 行**（§2.3 表列预估 ~200——差距与拆分建议归 §5.5 / §5.6-5）。核 / CLI 无测试档清单闸（测试收集单层 glob）⇒ 仅 VSC 侧有注册动作；测试断言表不重述（权威面 = §5.5 与新档本体）。

#### ⑤ AUTO × 同步族落卡明文化（派发项 ⑤ · 上抛裁定 2）

设计 §1 #7 补句「**AUTO × 同步族**：AUTO 档对 `continue` 名不再短路（CLI `interaction.mjs:68` / VSC `panel-callbacks.mjs:279`）⇒ 卡在场待答；无人应答（headless / 无人值守）⇒ 落 #3 partial（非静默放行）」+ §2 表两行随动。新增文案语言 = 英文（§3.1 表注：三处坐标 `checkpoint.mjs:81-82` / `:115` · `spawn-child.mjs:232-233`）——沿裁定「不改」（§1.12 第 3 项）。

#### ⑥ `AGENT-PARAMS` 校验（派发项 ⑥）

`docs/core/design/AGENT-PARAMS.md`：参数登记 + 变更行在册 ✓（本轮实核）；单源 = `agent/helpers.mjs` 的 `DEFAULT_BARREN_TURN_LIMIT = 120` · 消费点 = `spawn-child.mjs:222-224` / `:227-228`；设计档（§1 #8 / §2 / §3.1）只列参数名、不重述默认值表（D2）✓。

#### ⑦ §2 随动清单（就地收正 6 处 · 一致性面）

§2.1 #3 / #4（坐标随设计档收正）· §2.3（表列 + 测试面登记块）· §2.4 A1（+ 用例 14）· §2.5 行 14（新增）· §2.7 🟡4 行（引用与行号随动）。**🟡12 结项**（§4.1 派发）：设计 :21 两处（`同步子代理` 收窄 + 会诊加注 ✓）+ `escalate-async.mjs:242` 复核 ✓（本轮实读）。**🔵13**（记录面状态词过期）= 沿裁 Deferred：状态行随本次 status 更新消解；§2.6① / §2.2 两处留 §6 收口销号（笔随 §6）。

#### ⑧ 未核披露 + 闸读数

- **本轮二次实读**：核 `agent.mjs:95-160 / :228-257 / :420-447` · `spawn-child.mjs:220-277` · `checkpoint.mjs:81-82 / :115` · CLI `agent-turn.mjs:188-232` · VSC `src/agent.mjs:421-441` · `escalate-async.mjs:232-257` · `post-turn.mjs:8-21` ✓。
- **沿本轮前段实核记录（未二次复读）**：`subagent-actions.mjs:312 / :323` · `consult.mjs:313 / :331 / :329-340` · `subagent-run.mjs:174 / :157` · `escalate-async.mjs:252` · `post-turn.mjs:16 / :54-60` · `interaction.mjs:68` · `panel-callbacks.mjs:279` · `helpers.mjs` 默认值 · `AGENT-PARAMS.md` 登记 / 变更行。
- **闸**：`node scripts/doc-check.mjs`（三闸）——本档 0 悬空 / 0 超宽（交付前复扫 · 尾段汇总实核）· 全档 = 悬空 32 · 行宽 18（全部他档预存债务 · 同 §1.10 #98 归因）。
- **禁动面**：本轮未触碰代码 / 需求档 / 他批档 ✓（仅设计档 + 本批档 §2 两面）。

## §3 设计评审（评审子代理）
**状态行**：评审完成 2026-09-26（轮次 2：VERDICT pass（🔴 0 · 🟡 1 · 🔵 1）；前轮 11 条（9 条分派 + 2 条父侧自处置）全 Fixed）



### 轮次 1（评审子代理）

**评审目标**：批档 §2（八条判定线 · 不做七条 · 受影响文件 15 项 · AC A1–A8 · 用例 12 条 · 上抛 6 条）↔ 设计档 §1（#7/#8 + #1/#3/#5/#6 随动）· §2（四执行体分族）· §3.1（新增 9 行）· §3.2（收正 + 退役登记）· §4（`_continueSegments`）· §5（D-TC12–D-TC17）↔ 需求档 F8/N7（+ F2/F4/F5/F6/N1/N3/N6 相容性）。焦点=四执行体分族落点 · 双端同位 · 相容证明 · N7 两向边界 · 坐标准确性。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（机制锚点两说相抵） | 🔴 | 批档 §1.5（`:194-196` / `:233`）与 §1.8②（判「原载正确；设计 `:199-203`/`:208-229` 与之相抵」）↔ 设计档 §2:41-42 / §3.1:57 就 **CLI 续跑锚点**相互矛盾。现盘判决（实读 `thincoder-cli/src/tui/agent-turn.mjs`）：**设计档正确**——`:194` = `if (error instanceof ContinueError) {`、`:195` = `if (autoTurn) {`、`:199-203` = digest AUTO 自续支（`:199 if (agent.autoApprove)`）、`:204-206` = 既有停止行、`:208-229` = continue 卡。批档 `:233` 实为 provider 失败重试（X8）注释，**不是**人工档询问路径；`:194-196` 含 catch + `autoTurn` 守卫（若被当作「删 AUTO 支」目标 = 破坏整个 CLI 继续机制）。批档数字疑取自发布快照（`.thincoder/tmp/cli-pkg/package/src/tui/agent-turn.mjs:193-197` = 旧版 AUTO 支体，其中 `:194-196` 恰为 `pushLine`/`makeController`/`continue`；该快照 375 行、文案更旧） | 以设计档锚点为准收正 §1.5/§1.8：改动点 = `:199-203`、落点 = `:204-206`、人工卡 = `:208-229`；`:233` 改标 provider-retry 面；撤「原载正确 / 两说相抵」判语，并注明 `:194-196` 含 catch 与守卫（非删除目标） |
| 2 | Requirements coverage / Feasibility（F8 答复侧无接线点） | 🔴 | 「父答 `send` ⇒ `resume:true` 重入」（批档 §2.1 #1 / AC A1 / 用例 1、2）在设计中**缺兑现接线点**：实读 `thincoder-core/agent-tools/subagent-actions.mjs:292-327`——`executeSendAction` 只做 `entry._injected.push`，而注入只在子 `runAgent` 回合头被消费（`thincoder-core/agent.mjs:235` / `agent-tools/subagent-run.mjs:156`），挂起子已退出段内 `runAgent`（`agent-core/agent/spawn-child.mjs:248-257`）⇒ 无新接线则挂起子永不复入；`:316` 又要求 `entry.status === "running"` 才可 send。而受影响文件表把两答复侧文件标为 `subagent-actions.mjs` **±0** / `subagent-async.mjs` **±0（实施核）**，与实际需增的调用不符；`subagent-actions.mjs` 现 **496** 行（距 500 硬限仅 4 行，且无拆分计划） | 设计中写明兑现调用点（`send`/`cancel` → checkpoint 叶「单一兑现点」；或写出等价唤醒路径与状态口径）；按实际修正两文件增量；若需多于约 4 行，须给 `subagent-actions.mjs` 的拆分/落点方案（500 硬限） |
| 3 | Document ownership（队列语义与需求/本文相抵） | 🔴 | 设计 #5（:21）「**队列主体（2026-09-26 起）= 用户卡面**（depth-0 主 agent + 同步族）——异步族…**不入队列**」与需求 F6（`docs/core/requirements/TURN-CAP-CONTINUE.md:25`「按会话级队列串行（`continueQueue`——consult）」）、设计 §2 会诊行（:33「+ `session.continueQueue` 串行」）、§3.1（:62「`continueQueue` 串行保留」）、批档 §2.3（:116）相抵。现盘实读：`continueQueue` 全仓唯一消费者 = **会诊**（`thincoder-core/agent-tools/consult.mjs:321-322`）；同步族串行走 **`_permQueue`**（`agent-tools/subagent.mjs:313` / `subagent-spawn.mjs:321` / `escalate-async.mjs:237`）；depth-0 直弹卡、无会话队列（`thincoder-cli/src/tui/agent-turn.mjs:211-216` / `thincoder-vscode/src/extension/panel-turn-loop.mjs:146-153`） | 改写 #5 与 §2/§3.1/F6 对齐：写清队列实际消费者 = 会诊（检查点报请仍串行其上）、同步族 = `_permQueue`、depth-0 = 直接卡；删除「异步族…不入队列」的绝对表述 |
| 4 | Requirements coverage（N7 射程未写明） | 🟡 | N7 覆盖边界未在任何在盘档写明：计数点 = 核 `agent/post-turn.mjs:16`（仅 core 循环，唯一调用点 `agent.mjs:429`）；跳闸点 = 子代段边界（`agent/spawn-child.mjs:253`）。后果：VSC 主 agent 走自持循环（`panel-turn-loop.mjs:17` → `../agent.mjs`，内联回合尾 `thincoder-vscode/src/agent.mjs:421-438`、该端无独立 post-turn）**无计数点**；depth-0 **无跳闸点**（CLI/VSC 本批对 depth-0 只有删自续支：`agent-turn.mjs` 385→−5、`panel-turn-loop.mjs` 189→−5）。AC A6 / 用例 4–6 仅覆盖子代面 | 在设计/批档显式写明 N7 射程（子代段边界；depth-0 与 VSC 主 agent 的处置及理由）；若判定 depth-0 也应「停并报」，补跳闸点与用例 |
| 5 | Clarity / 受影响文件标注 | 🟡 | 两个新增链级计数的**复位落点未归入任何已标注文件**：`_continueSegments`（设计 §4:99「复位条件同 `_turnSeq`（`!opts.resume`）」）、`_barrenTurns`（#8:24「仅 `!opts.resume` 重基线」）。核侧 `_turnSeq` 的唯一复位点 = `thincoder-core/agent.mjs:143-147`（`if (!resume) { agent._turnSeq = 0 … }`，注释自述「全档唯一复位点」），该档**不在** 15 项表内（443 行）；VSC 对位 `thincoder-vscode/src/agent.mjs:125-126` 同样不在 | 指明复位实现落点（如经已在表的 `agent/post-turn.mjs` 惰性复位），或把 `thincoder-core/agent.mjs`（及 VSC 对位档，若需）补入受影响表并给行数/增量 |
| 6 | 坐标准确性（设计档遗留行） | 🟡 | 设计 §3.1 遗留行锚点与现盘不符（实读值，逐条）：续跑骨架 `:213`→**`:233`**（同表 :59 已载 `:233`，同一函数两值自相抵）；`:33`（`TURN_CAP_MARK` 再导出）→**`:35`**；编号镜像层（子代理）`:105-112`→**`:123-139`**（正则 `:129`）；编号镜像层（飞刀）`:207-209`→**`:212-216`**（正则 `:212`）；主 agent 续跑 `:108`（实为 `state.reasoning = ""`）→ 应为 `makeController` **`:132`/`:137`**；D-TC11 `:456-460`→**`:472`**（`ctx._subagentKey = escId`） | 逐条按现盘收正；同一锚点（`runWithContinue`）在表内只留单一行号 |
| 7 | Doc-state / 跨档滞后 | 🟡 | 需求档残留旧坐标：F1（:20）VSC `:36`/`:371`——设计 #1（:17）同批已收正为 `:7`/`:46`/`:441`（同批只改了 F8 的 `:432`，见 requirements:78）；F2（:21）/F4（:23）/F6（:25）/N3（:35）仍指**已退役路径** `thincoder-vscode/src/agent-tools/*`（实读该目录仅存 `async-discard.mjs`/`index.mjs`；设计 §3.2:79-81 已登记退役）——F3（:22）带「迁移期引文」标，上述四行不带 | 需求档做一次坐标收正或统一加「迁移期引文」标（F8 同批已收正 ⇒ 沿同一路径） |
| 8 | 档卫生 | 🟡 | 设计**规范面**残留修订式表述（「原载 X ⇒ 收正 Y」）：`:17`（「原载 `:36`/`:371` 为迁移前坐标」）、`:57`（「2026-09-26 收正：原载 `:182`/`:201`」）、`:82`（「2026-09-26 收正：原载 `extension/panel-chat.mjs`（回合循环）」）——沿革已由变更记录（:163）承载 | 删去规范面的「原载…」残句（沿革留变更记录/§6），坐标系只留单一现值 |
| 9 | Clarity | 🔵 | 计数口径精度未写明：`injectPostTurn` 唯一调用点 = `thincoder-core/agent.mjs:429`（「Model is executing tools」分支）⇒ 纯文本 / 无工具回合不计入 `_barrenTurns` | 设计里写明「K 轮」的计数口径（是否含无工具回合），避免 K 语义歧义 |
| 10 | Clarity | 🔵 | 用例 7「无 `onPermissionRequest`（headless）⇒ 不挂起，直接 partial」未标族：异步族挂起判据 = `_upstream.parent && sync !== true`（handler 缺席只降级同步族；实读 `subagent-async.mjs`/`escalate-async.mjs:206`） | 用例 7 标明所测族（同步族），或补异步族对位用例 |
| 11 | Clarity | 🔵 | 批档 §2.1 #2（:88）「父侧调用方**不被挂起**」与 §1.7（:50）/设计 §2（:31）「父代理被本次调用阻塞」表述相抵（同步族本性即阻塞） | 改写为「不新增检查点式挂起；同步族阻塞语义不变（用户卡保留）」 |

**已实核无误项（供收口引用）**：抛点 `thincoder-core/agent.mjs:432` ✓（`:429` = `injectPostTurn` ✓）· 判点 `agent/spawn-child.mjs:253`（`askContinue(e)`）· 骨架入口 `:233` · 循环 `:248` ✓ · `TURN_CAP_MARK` 叶 `child-marks.mjs` 再导出 ✓ · 计数单点 `agent/post-turn.mjs:16` ✓ · 写盘单点 `agent-tools/advisor-settle.mjs:48` ✓ · checkpoint 叶 **不存在**（新增 ✓）· 异步族报请面 `subagent-run.mjs:176` ✓ / `escalate-async.mjs:247` ✓ / `consult.mjs:316-330` ✓ · 裁定通道 `subagent-actions.mjs:292` ✓ / `subagent-async.mjs:245` ✓ · 可答判据 `_upstream`（`sync:!wantAsync`，`subagent-spawn.mjs:431`）✓ · 会诊**无** `_upstream` 赋点（补赋 ✓）· `consult_start` 发后即返 `{id, models}`（`consult.mjs:428-440`）✓ · 双端同位：CLI `:199-203` vs VSC `:132-136`（各自 AUTO 自续支）✓、两人工卡（CLI `:208-229` / VSC `:146-153`）✓、两 AUTO 短路点（`interaction.mjs:66` / `panel-callbacks.mjs:276`）✓ · VSC 端 `agent-tools/*` 退役（现仅 `async-discard.mjs`/`index.mjs`）✓ · 受影响表行数 13/13 抽核相符（259/71/464/226/303/472/496/457/143/385/189/308 + 新增）✓ · 无文件跨 500 档 ✓ · 需求 F1–F8/N1–N7 逐条有落点 ✓ · 用例 5/6（K 两向边界）与 D-TC16/D-TC17 算术自洽 ✓。

**计数**：🔴 3 · 🟡 5 · 🔵 3（共 11 条）。

VERDICT: changes-required（🔴 3 条：① CLI 锚点两说相抵（设计对）· ② F8 答复侧无接线点 + ±0 标注相抵 · ③ #5 队列语义与 F6/§2/§3.1 相抵）。

### 轮次 2（评审子代理）

**评审目标（轮次 2 · #89）**：批档 §2.7 逐号对账（9 条分派）+ 父侧自处置 2 条（§1.9 / §1.10）+ 设计档修复面（`#5`:21 · `#8`:26-30 · §3.1 表注:77-87 · §4:112-113 · §5 D-TC11:142 · 变更记录:179-180）——核 9 条修复主张成立 + 2 条父侧自处置 + 无新引入。实读在盘三档全档（本轮限定文档面，未读源码）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 🔴1（父侧自处置） | 批档:34/:78-79 | — | **Fixed** | §1.5 已机械直改：「`thincoder-cli/src/tui/agent-turn.mjs:199-203`（**AUTO 档无面板自动续跑支体**——本批要改的点 · **父侧机械直改**：原载 `:194-196` = 该支的 `catch` + `autoTurn` 守卫，**非删除目标**）· `:208-229`（人工档询问路径 · 原载 `:233` 实为 provider-retry 注释）」；§1.9:78「**§1.8② 判语作废（父侧自纠 · 记过）**……**设计锚点为准**（改点 `:199-203` = AUTO 自续支体 · 落点 `:204-206` · 人工卡 `:208-229`；`:233` 实为 provider-retry 注释）」+ :79「§1.5 的 CLI 行已按此**机械直改**；§1.8② 原文**保留可见**以存错痕」。矛盾解除（与 §2.1 #4:117 一致）。 |
| 2 | 🔴2 | 设计档:77-87 · 批档:144-145 | — | **Fixed** | 接线落盘——`:79` `registerTurnCapCheckpoint(child, entry, payload) → Promise<boolean>`（登记 + 上行报请 + 挂起；`signal.abort ⇒ resolve(false)`）· `:80` `settleTurnCheckpoint(entry)`（幂等）+ `turnCapTrace` / `resumedSendResult` · `:82` send 兑现两处（`:306` 池未命中分支 + `:320` push 后；+1 import ⇒ **496 → 499**，余量 1 行）· `:83` 会诊判定序 · `:84-85` 消费路径 + `consumeInjected` 缺口登记（飞刀 / 会诊各 +~2）· `:86` cancel ±0（走既有 abort 链）· `:87` 超限缓冲。批档 §2.3:144「**+3 ⇒ 499**」· :145「**±0（已实核）**（`:174` 停单点 · `:206-210` `entry.controller.abort` ⇒ `askContinue=false` ⇒ `onDeclined` partial + `TURN_CAP_MARK`）」。 |
| 3 | 🔴3 | 设计档:21 | 🟡 | **Fixed**（残余见 #12） | #5 已重写：「会话级队列消费者 = **会诊（唯一）**（`continueQueue`——`agent-tools/consult.mjs:321-322`；检查点报请仍串行其上）；**同步族**走 `_permQueue`…；**depth-0 直弹卡、无会话队列**…；**异步族**经上行通道报请（无队列——#7）」——与需求 F6 / 设计:39 / :68 对齐；原「队列主体=用户卡面 / 异步族不入队列」绝对表述已删。残余见 #12。 |
| 4 | 🟡4 | 设计档:26-30 | — | **Fixed** | 新增「N7 口径与射程（2026-09-26 明）」块——`:28` 计数口径（仅「执行了工具」的回合；K = 连续 K 个带工具执行回合零进展）· `:29` 射程（跳闸点 = 子代段边界 `agent/spawn-child.mjs:253` 前；唯一计数调用点 `thincoder-core/agent.mjs:429`；**depth-0 无跳闸点**；**VSC 主 agent 无计数点**（`thincoder-vscode/src/agent.mjs:421-438`））· `:30` 基线（跨段累计；复位落点 `agent.mjs:143-147`；测试经 `agent.barrenTurnLimit` 注入小 K）。 |
| 5 | 🟡5 | 设计档:30/:113 · 批档:146 | — | **Fixed** | 设计:113「复位条件同 `_turnSeq`（`!opts.resume`——`_barrenTurns` / `_continueSegments` 复位同点并入 `thincoder-core/agent.mjs:143-147`）」；批档 §2.3:146 新增行「`thincoder-core/agent.mjs` | 443 | +~4 | 三计数复位并点」。 |
| 6 | 🟡6 | 设计档:62-63/:73-74 · :134 | — | **Fixed** | 逐条收正、本轮读核对一致——骨架 `:233` · `TURN_CAP_MARK` 再导出 `:35` · 镜像层（子代理）`:123-139` · 镜像层（飞刀）`:212-216` · 主 agent `makeController` `:132`/`:137` · D-TC11 `:472`；`runWithContinue` 表内单一行号 ✓。 |
| 7 | 🟡7（父侧自处置） | 需求档:20/:21/:23/:25/:35 · :79 | — | **Fixed** | F1:20 / F2:21 / F4:23 / F6:25 / N3:35 句尾均加「（迁移期引文）」（沿 F3 先例）；F1 行内语法收正；变更记录:79（10:47 条）在案。 |
| 8 | 🟡8 | 设计档:17/:63/:100 | — | **Fixed** | 规范面「原载……」残句 0 命中（全档通读核对：`:17` / `:63` / `:100` 均仅现值）；沿革归变更记录 `:180`「删迁移期漂移注（沿革入本记录）」。 |
| 9 | 🔵9 | 设计档:28 | — | **Fixed** | `:28`「仅「执行了工具」的回合——`post-turn.mjs:14` 的 "Model is executing tools" 分支；纯文本 / 无工具回合不计入」；§3.1:67 行内注同。 |
| 10 | 🔵10 | 批档:177/:183 · :158-159 | — | **Fixed** | 用例 7 标「**同步族**」；新增用例 13「**异步族**……仍登记检查点**挂起**（等父 `send`）」；A1:158「用例 1 / 2 / 3 / **13** / 9 全绿」；A2:159（+ 用例 7）。 |
| 11 | 🔵11 | 批档:115 | — | **Fixed** | §2.1 #2 补句「**不新增检查点式挂起**、同步族阻塞语义不变（用户卡保留）」——与 §1.7「父代理被本次调用阻塞」不再相抵（“不被挂起”= 无检查点式挂起）。 |
| 12 | 3（残余） | 设计档:21 ↔ :23/:38/:46 | 🟡 | New: 标签口径两处不谐（非 must-fix） | ①设计:21「**异步族**经上行通道报请（无队列——#7）」↔ :23「**异步族**（后台子代理 / 异步飞刀 / **会诊**）」+ :39「+ `session.continueQueue` 串行（全仓唯一消费者）」——同格首句已载会诊例外，建议加注「（会诊除外）」。②设计:21「**同步族**走 `_permQueue`」↔ :38「同步 ⇒ **用户卡保留**（直问用户——无 permQueue）」/ :46「同步飞刀 = 直问用户（无 permQueue——`thincoder-core/agent-tools/subagent-actions.mjs:452` 注）」——建议收窄为「同步子代理」；并列引用 `escalate-async.mjs:237`（异步飞刀档）宜一并复核。均不改实现语义（会诊串行 / 飞刀直问在他行已明），**非 must-fix · 不阻塞**。 |
| 13 | (new) | 批档:103/:187-188/:131 | 🔵 | New: 记录面状态词过期 | 批档 §2 状态行:103 仍载「需求档 F8 坐标 :420→:432 漂移**仍在上抛**」；§2.6:187 仍载「需求档 F8 载核坐标 `thincoder-core/agent.mjs:420` —— 实核为 `:432`（抛点）：**漂移，上抛主代理**」；§2.2:131 仍载「reported，不在本批改」——均已办结：需求档:27 载「撞帽（`ContinueError`——核 `thincoder-core/agent.mjs:432`）**不再静默自动续期**」、需求档:78 记 10:21 收正、批档:66「⇒ 需求档 F8 **已机械收正** + 变更记录 ✓」；§2.6②（批档 §1 锚点漂移）同状态。建议收口时沿 §2.7 ⑤ 销号先例统一销号。 |

**未核验声明（源码面，本轮未读）**：本轮新增/变更的源码锚点未做磁盘抽核——设计 §3.2:94 复位位 `:170-174`（前轮文档态记 `:125-126`，两值互斥，建议 §4 前抽核）· §1:28 `post-turn.mjs:14` 分支 · §3.1 表注:82 `:306`/`:320` 两兑现点 · :86 `:174`/`:206-210` cancel 链。前轮已实核锚点按其记录采信。

**计数**：🔴 0 · 🟡 1 · 🔵 1（阻塞项 0；前轮 11 条全 Fixed）

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 §4 批准 —— 父侧代签（用户 2026-09-26 10:13「这条也自动落地」授权）

- **三条件齐备**：① 设计评审 = **通过**（轮次 1 = changes-required（🔴 3）→ 修复轮 **#88**（9/9）→ **轮次 2 = pass**（前轮 **11 条全 Fixed** · 新 🟡1 / 🔵1 **非阻塞**））；② 修复主张经父侧核验（§1.10 抽读在盘 + 轮次 2 逐条复核）；③ **token 已签发**（按凭据纪律**不入档**）。
- **依据**：评审轮次 1 + 轮次 2（§3）· §1.6–§1.10 · §2.7「修后为准」。
- **批准射程** = §2 全节 + §2.7 修后文本 + 受影响的 15 项文件面 + 需求 F8 / N7；**不含**：live 头逐轮跳动（需求档 §4 既有边界）· 段内帽判定 / `ContinueError` 载荷语义（N6）· 续期次数上限（N1）· 他批面 / 需求档面 / `docs/vsc`。
- **轮次 2 两条新项处置**：🟡12（标签口径两处不谐）= **Deferred**（记录在案 · 实施后修正轮收窄为「同步子代理」并给会诊加注）；🔵13（记录面状态词过期）= **Deferred**（§6 收口时销号）——**均不属实施射程**（防夹带）。
- **派发** = eng-coder（round = initial）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-26 · 三包实跑全绿 · 交付审计 clean · advisor 两轮 pass）

### 5.1 交付摘要（逐档落点 · as-of 2026-09-26 现场实核）

**新档（新增面）**

- `thincoder-core/agent-tools/checkpoint.mjs`（117 行 · 5 导出 · 零 `node:` 外依赖）：`turnCapTrace:30`（留痕三元文本）· `registerTurnCapCheckpoint:51`（登记 + 父侧 ask；逃逸三分档 = `:54` 不可答不登记 / `:55`+`:73-75` 已中止立即降级 / `:76-83` 登记+报请）· `settleTurnCheckpoint:89`（池条目兑现 · 幂等 miss）· `settleConsultCheckpoint:99`（会诊会话兑现——注入键 `rec.child._injected`）· `resumedSendResult:110`（send 早返体 `resumed:true`）。
- `thincoder-core/test/turn-cap-checkpoint.test.mjs`（498 行 · 12 test = 用例 1–9 / 12 / 13 + 补例 14）。
- `thincoder-vscode/test/integration/vsc-turn-cap-digest.test.mjs`（用例 11 VSC 半 · T-DG1/T-DG2）。

**核（产品面）**

| 档 | 落点（现盘实读） |
|---|---|
| `agent/spawn-child.mjs` | `barrenLimit:222-224`（解析单源：child → `config.agent` → 常量）· `barrenTrip:227-228` · `barrenStopNote:232-233` · 段边界「先跳闸后报请」`:270-274`（`barrenTrip ⇒ onDeclined`，先于 `askContinue:273`）· `runWithContinue:250` |
| `agent/post-turn.mjs` | 计数单点 `injectPostTurn:16` 内 `:54-60`（读 `_mutationSeq` 增量——仅带工具执行回合） |
| `agent/helpers.mjs` | `DEFAULT_BARREN_TURN_LIMIT = 120`（`:29` · 常量单源 · 不进 `DEFAULTS`） |
| `agent.mjs` | 复位并入块 `:146-155`（`_turnSeq` / `_barrenTurns` / `_barrenSeq` / `_continueSegments`——仅 `!opts.resume`）· `consumeInjected` 形参 `:101` / 消费点 `:242` |
| `agent-tools/subagent-run.mjs` | 报请接线 `:174`（子代）· `consumeInjected` 既有提供点 `:157` |
| `agent-tools/escalate-async.mjs` | 报请接线 `:252`（异步飞刀）· `consumeInjected` 补配 `:231` |
| `agent-tools/consult.mjs` | 报请串行 `:329-340`（`session.continueQueue` = 唯一会话级队列消费者 `:331`；续期 ⇒ 新段预算 + watchdog 重挂）· `consumeInjected` 补配 `:322` |
| `agent-tools/subagent-actions.mjs` | send / cancel 兑现面：import `:28` · 池面 `:99` + `:263` · 会诊漏网分支 `:312` · 留痕消费 `:323` |
| `agent-tools/child-permission.mjs` | `forceAsk` 透传 `:36` / `:42`（默认 `false`——其余调用逐字零变化） |

**端（CLI / VSC）**

| 档 | 落点 |
|---|---|
| CLI `src/tui/interaction.mjs` | AUTO 除名 `:68`（`name !== "continue"`）——batch 面 `:90` 不承载 `continue`（工具批专用，实核无漏面） |
| CLI `src/tui/agent-turn.mjs` | digest AUTO 自续支退役 `:195-201`（撞帽 ⇒ `digest.capStop` + `stopped`）· depth-0 继续卡保留 `:203-224` |
| VSC `panel-callbacks.mjs` | 同步族不挂起面 `:279` · `forceAsk: tool === "continue"` `:302` / `:309` |
| VSC `panel-turn-loop.mjs` | 自续支退役 + 停面 `:128-134` |
| VSC `permission-gate.mjs` | `!opts?.forceAsk` `:66`（JSDoc `:52-55`） |
| VSC `test/integration/files.mjs` | 新档注册 `:23` |
| `docs/core/design/AGENT-PARAMS.md` | 参数登记 `:61` + 变更行 `:141` |

### 5.2 实跑读数（三包全绿 · exit 0）

| 包 | 命令 | 读数 |
|---|---|---|
| core | `npm test`（thincoder-core） | **702 pass / 0 fail** |
| CLI | `npm test`（thincoder-cli） | **865 pass / 0 fail** |
| VSC | `npm test`（thincoder-vscode） | **1009 pass / 0 fail** |

用例对照（§2.5）：核档承用例 1–9 / 12 / 13；**用例 10** = CLI `test/permission-transit.test.mjs:127`（T-PT6）+ VSC `test/integration/vsc-panel-rings.test.mjs:214`（T-R6）；**用例 11** = CLI `test/provider-error-surface.test.mjs:130`（T-CAP1）+ VSC 新档（T-DG1/2）。形态 = 真端到端（真子代理 / 会诊 / 池条目 / send / cancel 执行体），唯一替身 = `globalThis.fetch` SSE 桩（先例在册）；「带工具执行回合」由只读探针工具承载，写盘事实用既有 `noteMutations` 造（不真写盘）。

### 5.3 决策透明表（实现期自裁 + 理由）

| # | 决策 | 理由 / 后果 |
|---|---|---|
| 1 | 兑现 = `carrier._turnCapRec` 登记 + 幂等注销单点；miss ⇒ 回落既有注入路径 | send 语义向后兼容：非检查点 send 逐字零变化 |
| 2 | **先臂后报请**：`rec.resolve` + abort 监听在 `pushChildUpstream` **之前**就位，并做注册后复检 | 否则报请同步唤醒父侧时「登记已写、resolve 未挂」⇒ 兑现假成功、挂起不收敛（复检序同 `permission-gate.mjs:80-81`） |
| 3 | 会诊注入键 = `rec.child._injected` | 设计 §3.1 明载（子代 / 飞刀 = 池条目 `entry._injected`）——两形一源（同 `drainInjectedQueue`） |
| 4 | 跳闸顺序 = 先 N7 后 ask（`:272 → :273`） | 设计 #8 明文「硬停并报（不询问）」；且只在段边界（D-TC17 段中不跳闸） |
| 5 | `_barrenTurns` 快照式只读比较 `_mutationSeq` | 「实质进展」单点 = 写盘序号；测试档写入即写盘 ⇒ 用例 / 断言增量天然计入 |
| 6 | N7 + ask + `resumedSendResult` 文案 = **英文** | 沿核内报告面既有形态（既有 partial 文本亦英文）；若设计欲中文 ⇒ 一行改动（见 5.6-3） |
| 7 | **补例 14**（异步飞刀族）补测 | F8 明列「异步飞刀」为第二执行体，§2.5 用例表未列 ⇒ 本批补测并上抛登记（见 5.6-2） |
| 8 | VSC 半 AUTO 面按 §1.11 授权补足 `forceAsk` opt | 默认 `false` ⇒ 他名调用逐字零变化；置位唯二（均 `continue` 名分支）· 判据**名基**（与 CLI `name !== "continue"` 同口径） |
| 9 | 测试档 498 行（设计预估 ~200）**登记不拆** | 同族夹具共享（真端到端装配 + 桩）；拆分方案在册，建议下批先拆（见 5.6-5） |

### 5.4 审计与代码评审轮次 / 终态

| 轮 | 类型 | 结论 |
|---|---|---|
| 自修 1 | 实现期自查（段边界顺序 / 兑现幂等 / 中止窗口） | 先臂后报请 + 注册后复检 + 幂等注销三点落盘（决策表 1/2） |
| 自修 2 | 评审发现项修复 | 逐条修复（坐标一致性 / 注释 / 文案）+ `consumeInjected` 两处补配（飞刀 / 会诊） |
| advisor #1 | 代码评审（全量 · 内部） | 逐条处理后复验 |
| advisor #2 | 修复主张核验（内部） | **pass（all-clear）** |
| 交付审计 | explore 只读 · 对照设计与任务书 | **🔴 0 · 🟡 3 · 🔵 7**；明载「**PARTIAL / SILENT-SIMPLIFICATION：未发现**」（逃逸三分档在位 · N7 先跳闸再报请 · 四执行体报请面齐 · 双端 AUTO 除名 + digest 自续退役齐 · 叶零 `node:` 外依赖 · 用例 1–13 全有在盘测试） |

🟡 3 条**全在文档面 / 记录面，无代码修复项**：① 设计 + 需求档行号因本批插入复漂（见 5.6-1）；② 本段（§5）审计时点为空 ⇒ 本次写入即闭（审计还顺手复核了 §1.11 两授权档三条红线，逐条吻合：默认 `false` / 置位唯二 `continue` / 他名零变）；③ 端套件测试档超出 §2.3 表列 ⇒ 见 5.5 披露。**终态 = clean（非 stalled）**。

### 5.5 清单外改动（如实披露 · 逐条原因）

| 档 | 改动 | 原因 |
|---|---|---|
| `thincoder-core/agent-tools/child-permission.mjs` | `forceAsk` 参数 + 透传（`:36`/`:42`） | §1.11 授权补足（VSC 半 AUTO 面） |
| `thincoder-vscode/src/extension/permission-gate.mjs` | `!opts?.forceAsk`（`:66`）+ JSDoc | §1.11 授权补足（同上） |
| `thincoder-core/test/child-ask-attribution.test.mjs` | **T-A3 退役** + 在档注（新落点） | 会诊改走检查点 ⇒ 「consult continue 捕获」用例必然失效；语义迁至新档用例 3（未删断言面） |
| `thincoder-core/test/core-hygiene.test.mjs` | 新档行数登记 `:94-98` / 注册集合 `:114` | 核仓卫生闸要求新档登记（498 行 + 设计预估差已注明） |
| `thincoder-cli/test/permission-transit.test.mjs` | 用例 10 CLI 半（`:127`） | AC A3 / A4 要求端侧断言（设计把 10/11 放端套件） |
| `thincoder-cli/test/provider-error-surface.test.mjs` | 用例 11 CLI 半（`:130` · T-CAP1） | AC A4 |
| `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs` | 用例 10 VSC 半（`:214`） | AC A3 |
| `thincoder-vscode/test/integration/vsc-turn-cap-digest.test.mjs` | **新档** | AC A4 VSC 半 |
| `thincoder-vscode/test/integration/files.mjs` | 新档注册 `:23` | VSC 集成清单要求 |

说明：`§2.3` 受影响文件表只列核档 `turn-cap-checkpoint.test.mjs` 一行 ⇒ 上列端套件 5 档 + 1 新档 + 两授权档均在表列之外（审计 🟡③ 同判）；核 / CLI **无测试档清单闸**（`node test/run.mjs` 单层 glob 自动收集）⇒ 无登记动作。`core-hygiene.test.mjs` 该档 diff 混有他批行（非本批）——本人声明段仅限上列两处。

### 5.6 上抛（reported · 请父侧 / 设计修正轮处置）

1. **行号复漂（本批自身插入所致 · 全族同根 · 请设计修正轮收正）**——设计 / 需求档坐标 ⇒ 现盘实读：

| 设计 / 需求档载 | 现盘实读 | 说明 |
|---|---|---|
| `agent.mjs:432`（`throw new ContinueError`；需求档 F8 同） | `agent.mjs:439` | 复位块并入致下方 +7 |
| `agent.mjs:429`（`injectPostTurn` 调用 / N7 计数面） | `agent.mjs:436` | 同上；「Model is executing tools」字面串亦在此行 |
| `agent.mjs:143-147`（复位落点） | `agent.mjs:146-155` | 位移 + 跨度 |
| `agent.mjs:235`（`consumeInjected` 消费点） | `agent.mjs:242` | 位移 |
| `spawn-child.mjs:233`（`runWithContinue`） | `spawn-child.mjs:250` | 位移 |
| `spawn-child.mjs:253`（段边界调用） | `spawn-child.mjs:270-274` | 位移 |
| `consult.mjs:304`/`:319`/`:322`/`:324` · `:316-330` | `consult.mjs:313`（runner）/`:331`（continueQueue）/`:329-340`（检查点块） | 位移 |
| `subagent-run.mjs:176`（askContinue） | `subagent-run.mjs:174` | 位移 |
| `subagent-run.mjs:156`（`consumeInjected` 提供点） | `subagent-run.mjs:157` | 位移 |
| `escalate-async.mjs:247` | `escalate-async.mjs:252` | 位移 |
| `post-turn.mjs:14`（「"Model is executing tools" 分支」引文） | 该字面串实存于 `agent.mjs:429`（现 `:436`） | **错档指针**——引文在所指档不可解析（批档 §2.7 🟡4 同载，请同收正） |

   （`post-turn.mjs:16` = `injectPostTurn` 定义行——该条**仍准确**，不属漂移。）
2. **§2.5 用例表缺补例 14**：F8 明列「异步飞刀」为第二执行体，用例表 1–13 未覆盖该族 ⇒ 本批补测（与在盘测试同档）；请设计修正轮补登记（§2.5 + §2.4 A1 引用面）。
3. **文案语言**：N7 / ask 载荷 / `resumedSendResult` 现为英文（沿核内报告面既有形态）；设计对该三处只描述内容未定语言 ⇒ 若须中文，请修正轮明示（改动 = 一行）。
4. **🟡 AUTO × 同步族撞帽落卡（设计面取舍 · 请补写一句）**：D-TC14（同步族保留用户卡）与 D-TC15（AUTO 不再自动批准）交叠面——AUTO 档同步族撞帽 ⇒ 卡在场待答（无人应 ⇒ partial）。现盘行为如此，属设计面待明文化。
5. **`subagent-actions.mjs` 499 行（硬限余 1）**：本批未动（设计 §3.1 超限备选在册）；下次实质改动前须先拆。测试档 498 行同源建议（决策表 9）。
6. **本轮未核（如实披露）**：设计 §3.2 表未被审计全文复读；`consult.mjs:322`/`:324` 逐字对应未复读；三套件由实施侧实跑（审计为只读，未执行测试）。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-26 12:22）

- 新用例档 ⇒ **12/12 pass** ✓；**core 全量 ⇒ 702/702 · 0 fail** ✓（CLI 865 / VSC 1009 = 实施舱实跑读数）；`checkpoint.mjs`（117 行）**逐行实读** ✓（三档逃逸 · **「先臂后报请」竞态防御** · 零依赖叶）；**A1–A8 八条判定线全落** ✓；越清单 9 项**全披露** ✓。
- **§1.11 授权补足回核**：`permission-gate.mjs:66` 认 `forceAsk` · core `child-permission.mjs:36/:42` 透传——**三条红线逐条实核**（默认 `false` · 置位唯二均 `continue` 名 · 他名零变）✓。

### 6.2 修正轮核验（父侧 · 2026-09-26 12:47）

- **#95 六项 + 🟡12 全落** ✓：设计档族坐标逐对现盘实核 ✓ · `post-turn.mjs:14` **错档指针收正** ✓ · 用例 14 + 测试面 6 档登记 ✓ · AUTO × 同步族落卡明文化 ✓ · `AGENT-PARAMS` 校验 ✓。
- **本档闸面**：0 悬空 / 0 超宽 ✓（实跑尾段实核：全仓悬空 32 / 行宽 18 **全在他域** ✗ ⇒ 非本批面 ✓）。
- **记录面裁定（三条）**：🔵13（§2.6② 载值滞后）= **本块销号** ✓；`consumeInjected` 缺口 = 同批已补配（异步飞刀 / 会诊各 +~2 ✓）；测试档 498 vs 预估 ~200 = 归 §5.5 / §5.6-5 记录面 ✓。

### 6.3 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表 | ✅ §1 / §4 / §6 父侧 · §2 + §2.8 designer · §3 评审（**轮次 1 + 轮次 2**）· §5 coder |
| 状态行 | §1 → 已收口（本块后冻结） |
| 计数 | 新叶 `checkpoint.mjs` **117** · 改动 core 8 + CLI 2 + VSC 2 + 测试 9（新 3 / 改 6）· **用例 1–14** · **AC A1–A8** · 三包 **702 / 865 / 1009** 全绿 |
| 指针 | 台账 **#409 → 核销**（本块后两步迁移 ✓）· **#413** 条件型在册（`subagent-actions.mjs` 先拆后改）· #411 / #412 在册 |
| 变更记录 | 无（本仓首发行前） |
| 待办勾销 | 无独立行；🔵13 = 本块销号 ✓ |
| 台账可见面 | 已查 ✓ |
| 跨面四轴 | 需求（F8 / N7 + F6 改写 + §4 边界）↔ 设计档（#7 / #8 + §2 / §3.1 / §4 / §5）↔ 实施（核 / CLI / VSC + 子代理续跑环）**三面同值** ✓ |

### 6.4 结论

**撞帽续期检查点批（#409）收口**：F8（异步族 ⇒ **父代理检查点** · 同步族 ⇒ 用户卡 · depth-0 ⇒ 回用户 · **AUTO 一律不再自动批准**）+ N7（**K = 120** · 段边界硬停并报）+ 双端 AUTO 自续支退役 + 续期留痕；三包 **702 / 865 / 1009** 全绿 · 评审两轮 + 实施舱内审全留痕；**触发事件（#83 跑飞 3240 轮 / 3h04m 零产出）的形态就此绝迹**——新行为**应用重载后生效**（代码随进程加载）✓。
