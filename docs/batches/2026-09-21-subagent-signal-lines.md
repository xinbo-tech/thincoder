# 子代理信号提示行（SIGNAL-LINES）· 批次记录（2026-09-21）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 01:5x · 来源 = 用户 01:55 报告 + 01:58 口径（**全档 × 双端**）。
> 台账 = #166 · 需求档 = `docs/core/requirements/AGENT-LOOP.md`（本批新增条目）。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-21（实施验证通过 · 三端全绿 · 台账 #166 已核销；记录冻结）

**用户原始报告（2026-09-21 01:55 / 01:58）**：

> 「现在不管是子agent完工，还是中间有上行消息提问，主会话提示都是：[auto-turn: continuing background work…] ，这个很令人迷惑，我想子agent报交的时候应该跟vsc端一样显示 digesting xxxx那样的消息，而是子agent上行消息，应该明确是是收到谁的提问，问题是啥。」
> 「normal也得带吧？两端都要处理，cli和vsc应该都处理。」

**缺陷本体（实勘 2026-09-21 01:5x 全实读）**：

- **标签判别** = `thincoder-cli/src/tui/suspension-drive.mjs:173-175`：`manual ? (upstream ? "answering a subagent's in-flight message…" : "digesting finished subagent reports…") : "continuing background work…"`——**AUTO 档（autoApprove）双因塌成一标** ✓；VSC 同构（2026-09-20 显示面消差批 M4 对齐——`panel._autoApprove` + `upstreamWaiting` 同判据）。
- **系已登记缺口**：2026-09-19 上游通道批 §5-CLI.5-3「【登记 · 设计未定义组合】AUTO 档 ask 轮提示行维持既有字面——若父侧要求对称 = `:174` 一行 + 用例一条（零机制影响）」✓。
- **数据可得（「谁 + 啥」零新数据面）**：`_childUpstream` 条目 = `{seq, from, kind, message, ts}`（`thincoder-core/agent-tools/parent-channel.mjs:107-117`）——`from` = `role#id`（如 `eng-coder#31`）、`message` = 问题原文（≤ `UPSTREAM_MSG_MAX` 1500）✓。
- **digest 起跑面**：核 i18n 已备 `digest.start`（「正在消化 ${n} 份后台报告…」——VSC 在消费（`webview/chat.js:356-402`）✗ CLI 未消费）；CLI 现有 = 起跑三档标签 + 轮尾 `digest.done`/`aborted`（X9 · `suspension-drive.mjs:186-191`）✓。

**本批范围（用户 01:58 口径 = 全档 × 双端）**：

1. **按因分流全档化**——manual 与 AUTO 两档下 digest / ask 两因各得其标（AUTO 档泛句退场或降兜底 = 设计钉）；
2. **ask 携「谁 + 啥」全档化**——manual 第三档（现为泛句）与 AUTO 档一并升级为携提问者与问题摘要（截断口径设计钉）；
3. **digest 起跑对位 VSC**——CLI 消费既有 `digest.start`（带计数）；
4. **双端同判**——CLI + VSC 一并处理（提示行 / 协议档 / 测试同步）。

**边界（不做什么）**：唤醒 / 开轮 / 域文本机制零改（本批只动「可见提示面」）· 轮尾 X9 行（`digest.done`/`aborted`）不动 · ask 队列结构与 `UPSTREAM_*` 常量零改（只读消费）· 提示词面零改 · 不新增机械门。

### 1.0 用户授权（父侧代点火 + 代批准 · 时限「自动跑」）（2026-09-21 01:58）

**依据**：用户 01:55 报告 + 01:58 口径（「normal 也得带」「cli 和 vsc 应该都处理」）+（01:21）「自动跑」⇒ 本批链上**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**，至本批完结 ✓。

**父侧自缚（代签条件）**：① 代签仅当「评审 pass（0 🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 代签在 §4 写明「父侧代签（用户 01:58 口径 + 01:21 授权）+ 依据」；③ 需新范围或用户口径裁决 ⇒ 停下 ✓。

（父侧小项收正（2026-09-21 · 可 revert）：评审 #44 发现 #1/#2/#8 就地处置——`docs/vsc/design/WEBVIEW-PROTOCOL.md:285` D-P11 计数「十三项 → 十四项」· 同档 `:193` 括注改「ask-only 轮（`n = 0`）」· `docs/vsc/design/WEBVIEW.md:544` 回指行「digest 三档 → 两档」。）

## §2 批次任务与设计（eng-designer）

（待设计——设计档落点 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.5 D（提示行三档）+ 对位节。）

**回指**：需求 `docs/core/requirements/AGENT-LOOP.md` §4.12 **F-UC8**（`:226`）· 台账 #166。设计落点 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` **§6.27.12.5 D**（提示行权威节，改写为 F-UC8 现态）+ **§6.27.12.13**（新增——本批设计簇：矩阵 / 携参 / 起跑行 / 决策 / 契约 / 文件表 / 用例 / 验收 / 边界 / 登记）+ §6.27.12.12 ④·⑥ 收正；对位档 = `docs/vsc/design/WEBVIEW-PROTOCOL.md`（§3 · §3.2 · §5 · §6.3 · §13）与 `docs/vsc/design/WEBVIEW.md`（§5.1 · D-W35 · U-W19）。

### 2.1 本批覆盖条目（= F-UC8 子句分解；条目号 = 设计档回指号）

| # | 条目 | 设计落点 | 判据（可机检） |
|---|---|---|---|
| 1 | **全档按因分流**——digest / ask 两因在 manual 与 AUTO 两档各得其标；AUTO 泛句**退场**（明裁） | §6.27.12.13 ① 档位矩阵 + ④ D-SL1（`digest.turnLabelAuto` 键删 · `tier` ∈ `ask`/`digest`） | U-SL1 / U-SL2 / U-SL3 / U-SL4 |
| 2 | **ask 轮携「谁 + 啥」**——`from`（`role#id`）+ message 摘要；截断口径 = **队首 ask · 单行归一 · 120 字符上限**（明钉） | §6.27.12.13 ② + ⑤a（核单点 `upstreamAskLabelVars`——选择 + 显示串同点） | T-SL1–T-SL4 · U-SL4 |
| 3 | **CLI digest 起跑对位 VSC**——消费既有 `digest.start`（带计数）；计数行/元素规则 = **`n > 0`** | §6.27.12.13 ③ + ④ D-SL2 + ⑤c | T-SL-C2 · U-SL2 |
| 4 | **双端同判**——CLI + VSC 同规（标签 / 计数 / 载荷） | §6.27.12.13 ⑤d–f + §6.27.12.12 ⑥ / ④；协议档与端档同步 | U-SL3 · U-SL4 · U-SL5 |

### 2.2 明确不在本批（边界）

- 唤醒 / 开轮 / 域文本机制零改；`UPSTREAM_*` 三常量与队列结构零改（只读消费）。
- **X9 轮尾行不动**（`digest.done` / `digest.aborted`）——ask-only 轮收尾行形态差 = §6.27.12.13 ⑩ 登记（须父侧先裁）。
- 提示词面 / `notify_parent` 工具描述与返回注零改（内容权 = 父侧）。
- 不新增 i18n 键（改值 1 + 删 1 + 复用 2）；`thincoder-vscode/locales/{en,zh}.json` 零改（核投影面）。
- 不做列宽口径截断（核无宽度叶）；不做 AUTO 档模式字面（模式可见性 = CLI `AUTO│` 横幅 / VSC `autoApprove` 广播）。

### 2.3 受影响文件（13 档 · 明细见 §6.27.12.13 ⑥）

核 2 档（`parent-channel.mjs` +19〔新导出〕· `i18n.mjs` −1〔键面〕）· CLI 3 档（`suspension-drive.mjs` +9 · `input-lock.test.mjs` ±6 · `digest-end-line.test.mjs` +20）· VSC 3 档（`src/extension/suspension.mjs` +2 · `webview/chat.js` +4 · `test/digest-visibility.test.mjs` ±22）· 核测试 2 档（`parent-channel.test.mjs` ±2〔导出面名单〕· `parent-channel-upstream.test.mjs` +30）。
设计档 3 档（本设计轮已落）：`AGENT-LOOP-SUBAGENT.md`（1975 → 2127）· `WEBVIEW-PROTOCOL.md`（539 → 545）· `WEBVIEW.md`（615 → 621）。

### 2.4 设计轮实读基线（as-of 2026-09-21 01:5x）

- `node scripts/doc-check.mjs --root .`：**悬空 0**（闸态 OK）；行宽 **3 行**超 300 字符——`docs/core/requirements/AGENT-LOOP.md:236`（317）/`:278`（322）= **父侧写域（本批需求行）**，`docs/core/requirements/SESSION.md:45`（399）= 他流写域 ⇒ 引擎退出码 = **1（存量面，非本批引入）**；本批触碰 4 档（3 设计档 + 批档）**零新增**悬空 / 行宽条目。
- 行数实读：`suspension-drive.mjs` 323 · `i18n.mjs` 106 · `parent-channel.mjs` 231 · `input-lock.test.mjs` 368 · `digest-end-line.test.mjs` 97 · `parent-channel.test.mjs` 291 · `parent-channel-upstream.test.mjs` 95 · `extension/suspension.mjs` 430 · `webview/chat.js` 445 · `digest-visibility.test.mjs` 250。

### 2.5 待父侧裁定 / 移交（非阻塞）

1. **需求档两行超宽**（`AGENT-LOOP.md:236` / `:278`——父侧写域）：折行后 doc-check 方可 exit 0；本批不代写（需求档笔 = 主 agent）。
2. **§6.27.12.13 ⑩ 登记两条**（ask-only 轮 CLI 收尾行形态差 · `digest.turnLabel` 多族措辞面）——本批不落，须父侧先裁才可另批。
3. **协议档 §13 `digest` 行坐标列**随实现位移（`extension/suspension.mjs:321` → `:322` 邻位）⇒ 实现轮按档内既有程序重出（`thincoder-vscode` 包 `test/protocol-coverage{,-reverse}.test.mjs --emit`）。
4. **§3 评审面**：§2.1 条目 1 含一条明裁（AUTO 泛句**退场**，非兜底）——评审请重点核 D-SL1 理由面（开轮因穷尽 + 模式可见性另有载体）。

### 2.6 设计微修正轮（2026-09-21 02:0x · 父侧裁定纳入本批）

**由头**：§2.5-2 的 ⑩-1（ask-only 轮 CLI 收尾行形态差）经 **父侧 2026-09-21 02:0x 裁定纳入本批**。**范围收正**：§2.2「X9 轮尾行不动」行 → **X9 收尾行加 `pend0 > 0` 守卫一处**（其余轮尾机制零改）。本条与 §2.2 / §2.5 对应行冲突时，以本条为准。

**落位（设计档 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.13）**：

1. ③ 尾条 = **X9 收尾行 `pend0 > 0` 守卫**（ask-only 轮零收尾行；**done / aborted 两形态同判**——VSC 侧零动作守卫先于 `ok` 判，实读 `thincoder-vscode/webview/chat.js:425-426`；两端形态对齐）；射程句 / §6.27.12.5 D 尾注同扫收正。
2. ⑩-1 改「已裁纳入」+ 落点；⑨-2 边界改写为「收尾行 guard 一处，其余零改」。
3. ⑦ 用例 **T-SL-C3**（ask-only 轮 `pend0 = 0` ⇒ 零收尾行——ok / aborted 两形态；对照态 `entries = 2` ⇒ 收尾行在场）+ ⑧ U-SL2 回指含 C3。
4. ⑤c 守卫口径 + ⑥ 文件表 Δ 收正两行：`thincoder-cli/src/tui/suspension-drive.mjs` **+9 → +10** · `thincoder-cli/test/digest-end-line.test.mjs` **+20 → +40**（§2.3 对应读数以本条为准）。

**机检读数**（cwd = 仓根 `D:\teamcode\thincoder`）：`node scripts/doc-check.mjs --root .` ⇒ **悬空 0 · 行宽 0（>300 字符）· 引擎 exit 0**——本微修轮触碰档（设计档 + 本批档）零新增悬空 / 行宽条目。

**遗留（本席未动 · 报父侧）**：

1. 需求档 §4.12 **F-UC8 边界列「不动 X9 轮尾行」**与本批新范围相抵 ⇒ 须父侧收正（需求档笔 = 主 agent；设计档 §6.27.12.13 ⑧ U-SL5「三方同源」判据随此成立）。
2. `docs/cli/design/TUI.md` §6.9（CLI 消化轮可见面权威节）现述「起跑标签三档」+「收尾行」二句——与本批「两档 + 起跑行 + 收尾行守卫」存在口径差，且未入本批文件表（⑥）⇒ 落点待裁（设计档笔 = 本席，可另轮收正）。

### 2.7 设计微修二轮（2026-09-21 02:1x · 父侧裁定纳入本批 · TUI 档同步）

**由头**：§2.6 遗留 2——`docs/cli/design/TUI.md` §6.9（CLI 消化轮可见面权威节）现述「起跑标签三档」+「收尾行（无守卫）」二句，与本批新口径（两档 + 起跑数行 + 收尾行 `pend0 > 0` 守卫）相抵且未入本批文件表。**父侧裁定 = 纳入本批**（该节正是本批改动的面，不换乘别批）。

**落位（三项）**：

1. **`docs/cli/design/TUI.md` §6.9 就地同步**（`:509-515`——行数 630 → 635）：起跑标签**两档**（ask 携参 / digest——manual / AUTO 同判 · `auto` 泛句退场）·
   **起跑数行**（`pend0 > 0` ⇒ `digest.start`）· 收尾行 **`pend0 > 0` 守卫**（ask-only 轮零收尾行——done / aborted 两形态同判）；口径单源回指设计档 §6.27.12.13 ①–③ + 该档变更记录一行（`:601-602`）。
2. **设计档 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.13 ⑥ 文件表 13 → 14 行**（新增行 14 = `docs/cli/design/TUI.md`——现量 630 → 635 · Δ 0〔实现轮零改〕）+ 变更记录一行（微修二轮）。
3. §2.3「13 档」与本条「14 档」冲突时以本条为准（新增 = 设计档一档；实现轮零改）。

**机检读数**（本微修二轮落位后 · cwd = 仓根 `D:\teamcode\thincoder`）：`node scripts/doc-check.mjs --root .` ⇒ **悬空 0 · 行宽 0（>300 字符）· 引擎 exit 0**；本微修二轮触碰档（`TUI.md` + 设计档）零新增闸态条目（报告面 `符号·宽` 随 `TUI.md:511` 新提 `upstreamAskLabelVars` +1——该面不入闸，逐条已标）。

**遗留**：无新增。§2.6 遗留 1（需求档 §4.12 F-UC8 边界行）**父侧本轮已同步**（现读「X9 收尾行 `pend0 > 0` 守卫一处（`digest.done` / `digest.aborted` 两形态同判，其余零改）」——
`docs/core/requirements/AGENT-LOOP.md:226`；需求档笔 = 主 agent，本席零改）。

### 2.8 设计微修三轮（评审 #44 设计档面四项 · 2026-09-21 02:2x）

**由头**：§3 轮次 1（评审 #44 = **pass** · 3🟡 / 5🔵）8 条中设计档面四项（#3 / #4 / #5 / #6）经父侧逐条裁定接受 ⇒ 本轮逐号处置（§3 其余四项：**#1 / #2 / #8 属父侧本轮笔域**、**#7 归实现轮 grep**——本席零改）。

**落位（设计档 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.13）**：

1. **#3（🟡 档位标注）**——⑥ 表后补「**越线核查**」段（`:1978-1983`；对照 §6.27.12.7 ①–③ 先例）：行 3 / 5 / 8 / 9 四档逐档档位口径——行 3 既有在册（§6.20.4 拆分计划）· 行 5 既有在册（§6.27.12.7 ② + 触发式计划）· 行 8 读数登记面 = `docs/vsc/design/VSC-DEBT.md` §12.1（登记归父侧派单）· 行 9 未列档（补登归父侧派单）；四档均 ≤500 硬限、结构未变 ⇒ 本批不拆。
2. **#4（🔵 as-of 口径）**——行 11–14 补「**读数口径**」注（`:1985-1986`）：设计档四档 = **as-of 读数 · 不追值**；实测终态另见 §2.3 / §2.7（本档 2127 · 545 · 621 · 635——本微修三轮复测 545 / 621 / 635 相符）⇒ 统一归实现轮。
3. **#5（🔵 代码块）**——⑤a 代码块**改用 `ASK_LABEL_MSG_MAX`**（`:1912-1926`；留常量定义行、截断式 = `ASK_LABEL_MSG_MAX - 1` + `…`）——消「常量已声明未引用」情形（二选一之另一支「删常量留数值」未采：数值此处两用，常量更利单源）。
4. **#6（🔵 理由面）**——⑨-5 补理由句（`:2018`）：CLI 手边同档宽度叶不引之由 = 跨端单源（D2）+ 宽字符折行 = 已知形态。

**清单外机械项（1 项 · 已报父侧 · 可 revert）**：`docs/core/design/ENGINEERING-MODE-V2.md:419` 行 306 字符（**FR31 批 02:19 提交引入**——超 300 行宽判据，阻塞 doc-check exit 0）⇒ **折为两行**（逐字不变 · 零语义）+ 该档变更记录一行（`:554`）；FR31 批已收口（非冻结窗）、该档属设计档写域 ⇒ 按「form 面当场修 + 逐条上报」处置。

**机检读数**（cwd = 仓根 `D:\teamcode\thincoder`）：`node scripts/doc-check.mjs --root .` ⇒ **悬空 0 · 行宽 0 · 引擎 exit 0**；本微修三轮触碰档（设计档 + 清单外一档）零新增悬空 / 行宽条目。

**遗留**：无新增——§3 余下四项（#1 / #2 / #7 / #8）不在本席本轮笔域。

## §3 设计评审（评审子代理）

（待评审——父侧代点火。）

### 轮次 1（评审子代理）

**评审范围（实读全档）**：批档 `docs/batches/2026-09-21-subagent-signal-lines.md`（§1 · §2 含 §2.6/§2.7 微修两轮，全文）· 设计档 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.5 **D**（`:1565-1577`）/ **§6.27.12.13 全节**（`:1867-2013`）/ §6.27.12.12 ④⑥ · `docs/cli/design/TUI.md` §6.9（`:509-515`）+ 变更记录 · `docs/vsc/design/WEBVIEW-PROTOCOL.md`（§3 `digest` 行 :59 · §3.2 行 11/14 :91/:94 · §5 :184-199 · §6.3 :236-269 · §13）· `docs/vsc/design/WEBVIEW.md`（§5.1 :192-195 · §6 D-W35 :455 · §8 U-W19 :510）· 需求 `docs/core/requirements/AGENT-LOOP.md` §4.12 **F-UC8**（`:226` + 由头 `:236` + 变更记录）。

**覆盖核**（未列为发现）：F-UC8 三子项（全档按因分流 / ask 携「谁 + 啥」/ CLI 起跑对位）与边界四项（不加新机制 · X9 `pend0 > 0` 守卫 · `UPSTREAM_*` 与队列结构零改 · 提示词面零改）逐条有落点与可机检回指；D-SL1 理由面（开轮因穷尽 + 模式可见性另有载体 = `TUI.md:559` `AUTO│` 横幅 / `WEBVIEW-PROTOCOL.md:39`+`:352` `autoApprove` 广播）成立；[裁] 择「退场」在需求允许面内（`AGENT-LOOP.md:226`「退场或降兜底」）；三档面（设计 §6.27.12.13 ①–③ / `TUI.md` §6.9 / `WEBVIEW.md` §5.1 / `WEBVIEW-PROTOCOL.md` §5）口径一致；⑥ 表无新档 ⇒ 无登记义务缺口；接口契约 a–f 与用例/验收逐条可机检。**未复核面（unverified）**：各代码坐标与行数读数（源码 / 测试档不在评审范围）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state / 计数纪律（D3） | 🟡 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:285` **D-P11** 仍书「**十三项**登记（§3.2）」，而同档 §3.2 头注已为「十四项」（`:77`）+ 表体行 1–14 在案（`:81-94`）；本批变更记录自称「登记 **十三项 → 十四项**，D3 计数与列表同改」（`:473`）——D-P11 未同改（该档先例 = `:533`「§7 增 D-P14 · D-P11 计数同改（七项 → 八项）」）。 | D-P11 计数收正为「十四项」（或改写为「见 §3.2 登记表（只增不改）」不携数），使 §3.2 头注 / 表体 / D-P11 三处同值。 |
| 2 | Doc-state / 残留档位计数 | 🟡 | `docs/vsc/design/WEBVIEW.md:544`（§10 回指行 15）仍书「digest **三档**（X6 · X10 · X11 · M4）」，而本批已把 digest 档位收为**两档**（D-W35 `:455` · §5.1 `:192`）；该行不在本批触碰清单（设计 §6.27.12.13 ⑤f / ⑥ 行 13 只列 §5.1 · D-W35 · U-W19）⇒ 同档两处档位计数不一。 | 该行收正为「digest 两档（按因 ask / digest——M4 · F-UC8）」，或改述为「digest 起跑档位与计数元素（M4）」不带数。 |
| 3 | Affected-file size annotation | 🟡 | 设计 §6.27.12.13 ⑥ 表 4 档现量已越 300 软线而全表无档位结论 / 拆分计划 / 越线登记指针：`suspension-drive.mjs` 323→~333（`:1962`）· `input-lock.test.mjs` 368（`:1964`）· `extension/suspension.mjs` 430→~432（`:1967`）· `webview/chat.js` 445→~448（`:1968`）——对照先例 §6.27.12.7「越线核查」①–③（`:1699-1709`）与 CLI 侧「拆分立场 = 本批不拆 + 触发式计划」（`:1705-1707`）逐档有结论。 | 逐档补一句档位口径（「既有在册 · 结构未变」/ 引 §6.27.12.7 触发式拆分计划 / `VSC-DEBT.md` §12.1 登记指针），或比照 §6.27.12.7 增设「越线核查」段。 |
| 4 | 数值面 / as-of 口径（criterion 8 抽查） | 🔵 | ⑥ 行 11（`:1970`）记 `docs/core/design/AGENT-LOOP-SUBAGENT.md` **1975 +95（≈2070）**，而批档 §2.3（`docs/batches/2026-09-21-subagent-signal-lines.md:64`）记本设计轮终态 **2127**；现盘实读 ≈**2139** 行 ⇒ 三口径并存（现量为 as-of 戳 / Δ 为估值 / 批档为实测面）。行 12/13 同类（估值与实测面不同源）。 | 按 §6.27.12.7 尾注④先例给行 11–14 加「**as-of 读数 · 不追值**（统一归实现轮）」注，或按实测回填。 |
| 5 | Clarity / 代码块与注释不一致 | 🔵 | ⑤a 代码块用字面 `120` / `slice(0, 119)`（`:1921`），同段注释却声明 `ASK_LABEL_MSG_MAX`（120——模块内常量，不导出）（`:1915`）——照抄将得「常量已声明但未被引用」或双值。 | 代码块改用 `ASK_LABEL_MSG_MAX`（或删该常量声明、仅留注释中的数值）。 |
| 6 | Clarity / 边界理由面 | 🔵 | ⑨-5 不做列宽口径截断的理由只写「核无宽度叶（`sliceByWidth` 住 `thincoder-cli/src/tui/render.mjs:46`；引核 = 新结构面）」（`:2005`），未说明 CLI 侧本就在手的同档叶为何不用于显示点截断——理由面读来不完整。 | 补一句（跨端单源 D2：截断须与 VSC 同源 ⇒ 只取字符口径；或显式登记 CLI 侧宽度折行为已知形态）。 |
| 7 | 端差 / 风险复核（unverified） | 🔵 | ⑨-6「`thincoder-vscode/locales/{en,zh}.json` 零改（核投影面）」（`:2006`）依赖「本地档不含 `digest.turnLabel*`」这一前提；端侧 i18n = 核投影 + 本地叠加（**本地键胜**，出处 = `docs/core/design/AGENT-LOOP.md:422`——范围外档仅作出处）⇒ 若本地档存在旧值将静默屏蔽核侧新携参值（VSC 侧「携谁 + 啥」不生效）。locale 档不在评审范围 ⇒ 该前提 **unverified**。 | 实现轮先 grep 两 locale 档 `digest.turnLabel` 命中；命中即同轮删旧值（或改值）并复核 §2.2 / ⑨-6 的「零改」句。 |
| 8 | Doc hygiene / 残留措辞 | 🔵 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:193` 把「无计数元素 ⇒ end 零动作」的情形括注为「（ask 轮）」，而新规则下该情形 = **`n = 0`（ask-only 轮）**（同档 `:190`）——含 pending 的 ask 轮**有**计数元素（两因同轮：设计 `:1903` D-SL2）⇒ 括注与规则相抵。 | 括注改「ask-only 轮（`n = 0`）」，与同档 `:190` 同值。 |

**VERDICT: pass**（计数 = 🔴 0 · 🟡 3 · 🔵 5；无阻塞项）。评审范围限制如实登记：源码 / 测试档与 `scripts/doc-check.mjs` 不在评审范围 ⇒ 代码坐标、行数与机检读数未独立复跑（`unverified`）；项目标准档与文档地图未声明 ⇒ Document ownership 维度按批档声明对位面 + 三档同步实读判定。

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 01:55 报告 + 01:58 口径「全档 × 双端」+ 01:21「自动跑」授权 · 代签三条件齐备）**：

- 依据 ① **评审 pass**：§3 轮次 1 = 🔴 0 · 🟡 3 · 🔵 5（无阻塞项）；父侧逐条裁定——**#1 / #2 / #8 = 父侧直改已落地**（`WEBVIEW-PROTOCOL.md:285` D-P11 计数 / `:193` 括注 / `WEBVIEW.md:544` 回指行；批档 §1 尾已标可 revert）· **#3 / #4 / #5 / #6 = 设计微修三轮已落地**（设计档 `:1978-1986` / `:1912-1926` / `:2018`）· **#7 = 入实施轮任务书**（locale 复核 · 父侧预授权命中即收正）；
- 依据 ② **修正轮已落地并逐条核验**：微修一轮（#41 · ⑩-1 裁定）· 二轮（#42 · TUI.md 同步）· 三轮（#46 · #44 四项）逐号核验 ✓ · doc-check 独立复跑 exit 0 ✓（含 #46 清单外折行一处——父侧认可）；
- 依据 ③ **token 已签发**（评审通过即发——不落值）。

**批准 = 本批设计（F-UC8 信号提示行 · §6.27.12.13 ①–⑩ + §6.27.12.5 D + 三处对位档 + 需求 §4.12 F-UC8）为正式设计，准予实施** ✓。

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成（10 档落地）· 三端测试全绿 · 偏离审计 + 代码评审终态 = **clean**（0 🔴 · 1 🟡〔advisory · 既有在册〕· 4 🔵 · 2 范围外注）

**交付摘要**：F-UC8 信号提示行**全档 × 双端**落地——① 按因两档：ask（携「谁 + 啥」）/ digest，manual 与 AUTO **同判**（`auto` 泛句键与档值退场，无生产者）；② 携参单源 = 核新导出 `upstreamAskLabelVars`（队首 ask · 单行归一 · 120 字符上限——两端零副本）；③ CLI 起跑数行（消费既有 `digest.start`，对位 VSC `.digest-status`）；④ X9 收尾行加 `pend0 > 0` 守卫（ask-only 轮起跑行与收尾行两行皆不出，done / aborted 两形态同判）。

**一、改动表（10 档 · 行数口径 = read 实测；「改前」= 设计 ⑥ 表现量）**

| # | 文件 | 改前 → 改后 | 落点（现盘 file:line） |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/parent-channel.mjs` | 231 → 249（+18） | `:104` `ASK_LABEL_MSG_MAX`（内部）· `:109-115` `upstreamAskLabelVars` · 头注 `:33-34` |
| 2 | `thincoder-core/i18n.mjs` | 106 → 107（+1） | `:38-41` 键面：`digest.turnLabelAsk` 改值携参 + `digest.turnLabelAuto` 删 + 零新增键 |
| 3 | `thincoder-cli/src/tui/suspension-drive.mjs` | 323 → 334（+11） | `:26-28` import +1 名 · `:12-16` 头注 · `:166-202` digestTurn（取数前置 `:178` / 两档标签 `:182-183` / 起跑行 `:185` / 收尾行守卫 `:201`） |
| 4 | `thincoder-cli/test/digest-end-line.test.mjs` | 97 → 145（+48） | T-SL-C1 `:88-108` · T-SL-C2 `:110-122` · T-SL-C3 `:124-144`（原「三档」用例就地收正） |
| 5 | `thincoder-cli/test/input-lock.test.mjs` | 368 → 386（+18） | `:19-20` 核容器断言 import · T-CL-U1 `:245-267`（ask 档携参）· T-CL-U2 `:270-307`（五格：note / manual·ask / manual·digest / AUTO·digest / AUTO·ask） |
| 6 | `thincoder-core/test/parent-channel.test.mjs` | 291 → 295（+4） | A4 导出面 `:268-277`（+1 名 `upstreamAskLabelVars`，常量仍恰 3 个） |
| 7 | `thincoder-core/test/parent-channel-upstream.test.mjs` | 95 → 147（+52） | T-SL1 `:83-91` · T-SL2 `:93-109` · T-SL3 `:111-122` · T-SL4 `:124-130` |
| 8 | `thincoder-vscode/src/extension/suspension.mjs` | 430 → 433（+3） | `:276` 动态 import 解构 +1 名 · `:322-324` `tier` 两档 + 携参与载荷展开 |
| 9 | `thincoder-vscode/webview/chat.js` | 445 → 449（+4） | `:392-396` 标签两档取键 + 携参 · `:399-405` 计数元素随 `n > 0` · `:426-427` end 零动作注 |
| 10 | `thincoder-vscode/test/digest-visibility.test.mjs` | 250 → 260（+10） | T-SL-V1 `:198-225` · T-SL-V2 `:227-259`（T-D9 / T-D10 就地收正） |

（Δ 与设计 ⑥「Δ（估）」列有出入的档如实登记：行数差来自测试注释体量与两处注释收正，非范围扩面。）

**二、决策透明表**

| 决策 | 理由 | 备选（未采） |
|---|---|---|
| 标签字面 = 核容器键（CLI 改读 `t("digest.turnLabelAsk" / "digest.turnLabel")`） | D2 单源（CLI 原持硬编码字面 = 第二份）；CLI 既有 `t()` 先例（`:29` / `:201`） | CLI 保留硬编码（两端逐字漂移面） |
| 携参在核新增导出（选择 + 显示串同点） | 选择须走 `carrierField` 吸收（父字段 / 载体别名两形态）；截断 / 归一字面跨端一致 | 两端各自读原始字段（载体形态漏读 ⇒ 与 tier 判据分叉） |
| 起跑数 `pend0` 取数点前移至标签行之前 | 起跑行与轮尾收尾行同源（皆 = 起跑口径）；两点间零 await ⇒ 读数与改前恒等（零语义差） | 起跑行另取一次（两读数面） |
| webview 计数元素规则由「非 ask 档」改 `n > 0` | 两因同轮时 digest 计数不丢（D-SL2）；两端规则同式 | 按档判（ask 档吞计数） |
| 注释内 `file:line` 坐标改符号锚（`webview/chat.js` `showDigestStatus` / `suspension.mjs` 起跑 post） | 本批自身即令两端位移 ⇒ 行号当轮失效（失效表达不留场） | 保留旧行号（当轮即错） |
| `locales/{en,zh}.json` 零改 | 复核：命中面仅 `digest.turnLabel`（核容器**同值副本**，本地键恒胜但值不变）；本批改值键 `digest.turnLabelAsk` 与删键 `digest.turnLabelAuto` 在两档**零命中** ⇒ 核侧新值不被屏蔽；且核域键本地同值副本已是登记态（`thincoder-vscode/src/i18n.mjs:19-20`「双源冻结 · 摘除候选登记」） | 同轮删本地副本（超 #7 预授权面：非「旧值」，且将连带改 `T-D4a` 落档断言） |

**三、读数（cwd = `D:\teamcode\thincoder`）**

- **U-SL1** `thincoder-core`：`node test/run.mjs` ⇒ **tests 456 · pass 456 · fail 0**。
- **U-SL2** `thincoder-cli`：`node test/run.mjs` ⇒ **tests 764 · pass 764 · fail 0（exit 0）**。
- **U-SL3** `thincoder-vscode`：`node test/run.mjs` ⇒ **tests 865 · pass 865 · fail 0（exit 0）**。
- **U-SL4** 结构机检（ASCII 令牌 · 单行 `node -e`：4 查 + 2 否定）⇒ **OK**（核容器含 `digest.turnLabelAsk` ∧ `${from}` ∧ 不含 `digest.turnLabelAuto`；`suspension-drive.mjs` 含 `t("digest.turnLabel` ∧ `digest.start` ∧ 不含 `[auto-turn:`；VSC `suspension.mjs` 含 `upstreamAskLabelVars(`；`chat.js` 不含 `digest.turnLabelAuto`）。
- **U-SL5** 文档一致：`node scripts/doc-check.mjs --root .` ⇒ **悬空 0 · 行宽 0（>300 字符）· 引擎 exit 0**；本批触碰档（代码 / 测试 / 本档）零新增闸态条目（报告面列报项 = 存量 · 不入闸）。
- **locale 复核（评审 #44 发现 #7 前置项）**：`grep digest.turnLabel` ⇒ `locales/en.json:72` / `zh.json:72` **仅 `digest.turnLabel` 一命中**（与核容器逐字同值）；`digest.turnLabelAsk` / `digest.turnLabelAuto` 两档**零命中** ⇒ 「VSC 侧携谁 + 啥被本地旧值静默屏蔽」不成立 ⇒ **locales 零改成立**（§2.2 / ⑨-6 句不动）。

**四、审计与代码评审（轮次 + 终态）**

- **偏离审计**（`explore` · **1 轮** · 只读）：10 项查核 **8 项符合**；2 项偏离——① 本段未写（即本写入，已消解）；② 协议档 §13 `digest` 行**坐标列未随实现重出**（`WEBVIEW-PROTOCOL.md:199` / `:357` 仍书 `suspension.mjs:321` / `:333` / `chat.js:257`；实读现盘 = `:324` / `:336` / `chat.js:276`）——设计档面 = 本轮**禁改面** ⇒ 零动作、报父侧。
- **代码评审**（`advisor type=code` · **1 轮** · **pass**）：**0 🔴**；🟡 1 = 四档越 300 软线（`suspension-drive.mjs` 334 · VSC `suspension.mjs` 433 · `chat.js` 449 · `input-lock.test.mjs` 386，均 ≤500 硬限；**既有在册**：设计 ⑥ 越线核查 `:1978-1983` 逐档「结构未变 · 本批不拆」⇒ R3 不重开）；🔵 4 = ① locale 同值副本的注释口径（`i18n.mjs:40` / `chat.js:393-394`）② CLI 语言面（核解析默认 en ⇒ 本批 zh 值 CLI 不可达——与设计 ⑤c 逐字同式，非偏离）③ 码元级截断边缘（`parent-channel.mjs:114`，设计②「口径 = 字符」明钉）④ 存量 2s 墙钟夹具（`input-lock.test.mjs:233-243`，非本批引入）。
- **自修订轮**：code 侧 **0 轮**（无 must-fix）；实施期自查发现 1 处并就地收正——`suspension-drive.mjs` 文件头遗留「提示行走第三档」措辞（F-UC8 后失效）→ 两档口径改写；同轮把两处注释内 `file:line` 改符号锚（本批自身位移所致）。
- **终态**：**clean**（无未收敛项；遗留 2 条范围外注转父侧裁定）。

**五、边界与披露**

- **表外档：零**（touched-union = 设计 ⑥ 表行 1–10 一一对应 + 本段；locales / 提示词档 / 设计档 / 需求档**未触碰**）。
- **机制面零改**（复核：`upstreamWaiting` 谓词 / `_asyncWaiters` / `upstreamTurn` 旗标 / 域文本 / `UPSTREAM_*` 三常量值与队列结构 / `digest:*` 日志事件形状与条件键 / drain 注入文案与注脚）。
- **遗留父侧**：① 协议档 §13 `digest` 行坐标列重出（档内既有程序现读数 = `src/extension/panel-callbacks.mjs:84/src/extension/suspension.mjs:324/src/extension/suspension.mjs:336` | `webview/chat.js:276` | `活`）；② `docs/vsc/design/VSC-DEBT.md` §12.1 补登 `webview/chat.js`（设计 ⑥ 越线核查尾条点名「补登归父侧派单」）；③ 可选跟进：CLI `agent-turn.mjs:194` / `:198` cap 行仍硬编码（与核容器 `digest.capAuto` / `digest.capStop` 逐字同值——同族单源候选，非本批射程）。

## §6 验证与收口（父代理）

**验证读数（父侧独立复跑 · 2026-09-21 02:4x）**：三端 `node test/run.mjs` = **核 456/456 · CLI 764/764 · VSC 865/865**（exit 0 ×3，与 §5 逐字一致）；U-SL4 / U-SL5 复跑读数一致（doc-check 悬空 0 · 行宽 0 · exit 0）。承重抽读 ✓：核 `parent-channel.mjs:109-115`（携参单点）/ `i18n.mjs:38-41`（改值 + 删键）；`suspension-drive.mjs:182-185`（两档标签 + 起跑行）/ `:201`（收尾守卫）；VSC `suspension.mjs:322-324`（tier 两档 + 携参载荷）；`chat.js:392-396`（分档取键——`tier:"ask"` 携参 / 缺省回退）。

**#7 locale 复核裁定**：✅ 零命中 ⇒ 本批「核单源」边界内零改成立（本地 `digest.turnLabel` 同值副本 = 既有登记态，非本批射程）。

**范围外注处置（§5 遗留三条）**：① 协议档 §13 `digest` 行坐标重出 = **父侧小项收正（机械坐标 · 可 revert）**——`WEBVIEW-PROTOCOL.md:199`（`:321` → `:324` · `:333` → `:336` · tier 判据同点 `:320` → `:322`）· `:357`（坐标列 `:324/:336` + `chat.js:276`）；② `VSC-DEBT.md` §12.1 补登 `webview/chat.js` **449** = **父侧小项收正（可 revert）**（§12.1 :287-288）；③ CLI `agent-turn.mjs:194/:198` cap 行硬编码 = **入册 #172**（归批——同族单源候选）。

**台账**：#166 = **已核销 2026-09-21**（随本档收口）；新登 **#172**。

**结算清单（D7 逐项）**：① 六段齐（§1–§6）✓ ② 状态行 = 已收口（档首已改）✓ ③ 计数 = 10 档实现 + 文档面在案 ✓ ④ 指针解析 = 需求 §4.12 F-UC8 ↔ 设计 §6.27.12.13 ↔ 本档 §2/§5 ✓ ⑤ 变更记录 = 设计档 / TUI.md / 协议 / 网面在案 ✓ ⑥ 台账核销 = #166 已核销 ✓ ⑦ 前批遗留交叉核对 = 无（本批自足）✓

**记录冻结**：本档自本行起**冻结**（不再回改）；后续项 = #172 与 §5 未做清单内的另案。
