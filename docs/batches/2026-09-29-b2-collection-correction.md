# 2026-09-29 · b2-collection-correction
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 台账 #562（B2 收正批：六注释 + 三死指针收正）+ 分诊轮 #143 放行判（阻塞 = B1-P3 取核已落）。
> 台账 = #562（cli ∕ core · 归批）。前情 = 分诊轮（2026-09-29）「现可发」判 + B1-P3 落定。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 条目与判据（父侧 · 2026-09-29）

- **台账 #562（B2 收正批）**：六注释 + 三死指针收正——B2 收编批遗留的注释 ∕ 死指针残留（清单位于 #562 证据行）。阻塞 = B1-P3 取核（已落）⇒ 分诊轮 #143 放行（可发）。
- **判据**：逐处「现况 file:line → 收正形 → 验收（grep ∕ 读回）」。

### 1.2 授权与边界

- 本批 = 注释 ∕ 指针级收正（**零行为**）；产品码注释面改动随设计逐处列明（面 = 产品码，实施经 eng-coder）。
- 链 = 设计（本档 §2）→ 评审 → §4 → 实施 → §6；零评审点火 ∕ 零夹带。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（含设计评审修正轮 1——§3 轮次 1 五条逐条落地）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（b2-collection-correction · 2026-09-29 · eng-designer）**

> 口径：注释 ∕ 指针级收正——**零行为改动 ∕ 零新语义 ∕ 零测试件**；清单源 = 台账 #562（全量）+ 分诊轮放行判；逐处「现况」= 本轮实读（as-of 2026-09-29 12:0x——五码档 + 两设计档实读；清单内坐标漂移一律以「现况（届盘）」列为准）。

**0. 覆盖对账（#562 逐条有行）**
- ① 六注释 = A1–A6 ✓；②′ ∕ ③′ ∕ ③″ = B1–B3 ✓；② `thincoder-desktop/src/main/ipc.mjs:183-186`（`aborted` reason 码注释）= 明示归 **B8**（#562 原判不变——本批零触）。

**1. 逐项表（现况 → 收正形 → 验收）**

**波 1 · 码面注释六处**——「门禁不可达」字面残存；核心语义（判据 ∕ 分支 ∕ 导入 ∕ 行为）零触，仅换失效措辞（逐字替换，行内换写）。

| # | 落点（届盘实读） | 现况（逐字） | 收正形（逐字替换） | 验收 |
|---|---|---|---|---|
| A1 | `thincoder-cli/src/tui/queued-pickup.mjs:17` | 入队门禁不可达的防御面（斜杠 busy 禁发——`TUI-INPUT-BOX.md` §4.1 条件 3）⇒ 不消费， | 防御面（斜杠 busy 禁发 ⇒ 队内不应出现——`TUI-INPUT-BOX.md` §4.1 条件 3）⇒ 不消费， | AC2 |
| A2 | `thincoder-cli/src/tui/suspension-drive.mjs:112` | `/cmd` 首动作 = 门禁不可达防御面 ⇒ null 零动作（条目不消费，落核第 2 步）。 | `/cmd` 首动作 = 防御面（斜杠 busy 禁发 ⇒ 队内不应出现）⇒ null 零动作（条目不消费，落核第 2 步）。 | AC2 |
| A3 | `thincoder-core/queued.mjs:76` | `slash` 首动作（入队门禁不可达的防御面）⇒ 零动作 `{ item: null, merged: null }`。 | `slash` 首动作 ⇒ 零动作 `{ item: null, merged: null }`。 | AC3 |
| A4 | `thincoder-vscode/src/extension/panel-turn-stages.mjs:245` | `if (!item) return // /cmd 首动作（门禁不可达防御面）——零动作` | `if (!item) return // /cmd 首动作（防御支——#429 取批面放行：`slash` ∕ `turn` 同判可消费，恒不触）——零动作` | AC4 |
| A5 | `thincoder-vscode/src/extension/suspension.mjs:138` | 首动作不可消费（`/cmd` 门禁不可达防御面） | 首动作不可消费（防御支——#429 取批面放行：`slash` ∕ `turn` 同判可消费，恒不触） | AC4 |
| A6 | `thincoder-vscode/src/extension/suspension.mjs:280` | `if (!item) break // /cmd 首动作（门禁不可达防御面）——不消费（防死循环）` | `if (!item) break // /cmd 首动作（防御支——#429 取批面放行：`slash` ∕ `turn` 同判可消费，恒不触）——不消费（防死循环）` | AC4 |

判据注：
- A4–A6「防御支 ∕ 恒不触」= `consumableAction`（`thincoder-vscode/src/extension/queued-merge.mjs:24-26`——`slash` ∕ `turn` 同判可消费）∧ 计划面仅产两类动作（`thincoder-core/queued.mjs:41-56`）⇒ 非空队取批恒有条目（三调用点空队均上游已判——`panel-turn-stages.mjs:243` ∕ `suspension.mjs:278` ∕ `queued-pickup.mjs:33`）。#429 落形实读在盘（`docs/vsc/design/WEBVIEW-INPUT.md:52-53` 细则⑧）。
- A1–A2「防御面」= CLI 双门禁在盘：busy 吞 slash（`thincoder-cli/src/tui/key-handler-busy.mjs:24-27`）+ 挂起面 slash 走 submit 径（`docs/cli/design/TUI-INPUT-BOX.md` §4.1 条件 3）⇒ slash 不入队（B2 裁决表 §2.3-⑤ 同判「cli 门禁禁 ⇒ 不可达」）。
- A3 = 仅撤失效括号（`takeQueuedBatchItem` 零动作早退语义本体不动——核件与端壳放行面（`consumableAction`）的对齐归**行为轮**：B2 §2.3-⑤⑦⑨⑩「若动」方案 + §2.8-N8 排轮在册）。

**波 2 · 设计档三处 + 记录面两行**

| # | 落点 | 现况（逐字） | 收正形（逐字替换） | 验收 |
|---|---|---|---|---|
| B1 | `docs/vsc/design/WEBVIEW-INPUT.md:184` | · `queue-visible-vsc.test.mjs`（细则⑦ 面——逐条标记 / 单条清标 / 多条合并成形 / Reload 重建 / 容量守卫 / 合并常量 / **步边界 pickup**（端壳循环头回调——history 序 + 快照推送；用例表 = 批档 §2））· | · 细则⑦ 面对拍锁 = `docs/batches/2026-09-29-parity-b2-queued.test.mjs`（批次本地件）· | AC5 |
| B2 | `docs/vsc/design/WEBVIEW-INPUT.md:24` | （8——双端同名常量） | （8——核单源常量） | AC6 |
| B3 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:400` | （`thincoder-cli/src/tui/queued-merge.mjs`） | （`thincoder-core/queued.mjs`） | AC7 |

- B1 依据 = F3 死指针第三处（`test/queue-visible-vsc.test.mjs` 随全清令退场；第一处 vsc 档头已由 B2 收正、第二处 `thincoder-render-core/flow/queued-mark.mjs:27` 归 #564 面）。收正形沿 B2 先例句形（「对拍锁 = `docs/batches/2026-09-29-parity-b2-queued.test.mjs`（批次本地件）」）；已死档的用例描述随换退场（不让死档描述改嫁新锁）。
- B2 依据 = B2 落形先例（同档 `AGENT-LOOP-ASYNC-POOL.md:22`「核单源常量」）。
- B3 依据 = #562「核单源为 `thincoder-core/queued.mjs`」+ 同档先例（`:435` 同款指针收正如 `:764` 变更记录在册）。

记录面（两档变更记录各 +1 行——实施笔）：
- `docs/vsc/design/WEBVIEW-INPUT.md` 末行追加：`- 2026-09-29（**批 b2-collection-correction · 收正轮 · eng-coder**——承台账 #562）：§9 用例面死指针收正（`queue-visible-vsc.test.mjs` ⇒ 对拍锁 `docs/batches/2026-09-29-parity-b2-queued.test.mjs`）；§1 C-B2-6 细则①「双端同名常量」⇒「核单源常量」。**零新语义**。`
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 末行追加：`- 2026-09-29（**批 b2-collection-correction · 收正轮 · eng-coder**——承台账 #562）：§6.30.2 载体候选行合并计划引用 `thincoder-cli/src/tui/queued-merge.mjs` ⇒ `thincoder-core/queued.mjs`（核单源）。**零新语义**。`

**2. 波划分与实施序**
单轮两波：波 1 码面 5 档（零依赖）→ 波 2 档面 2 档（句 ∕ 指针 + 变更记录行）。无并行冲突面；实施序 = 波 1 → 波 2 → 全量 AC 复跑。若拆两舱：files 面 = 波 1 五档 ∕ 波 2 两档（写入面零交叠）。

**3. 受影响文件表（7 档 · 现读 → 预期 Δ）**

| 树 | 档 | 现读（内容行） | 预期 Δ |
|---|---|---|---|
| cli | `thincoder-cli/src/tui/queued-pickup.mjs` | 34 | 0（行内换写） |
| cli | `thincoder-cli/src/tui/suspension-drive.mjs` | 210 | 0 |
| core | `thincoder-core/queued.mjs` | 90 | 0 |
| vsc | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 250 | 0 |
| vsc | `thincoder-vscode/src/extension/suspension.mjs` | 290 | 0 |
| 文档 | `docs/vsc/design/WEBVIEW-INPUT.md` | 236（修正轮 +1 行后） | +1（实施变更记录行——届盘 237；`:184` 行宽 294 ⇒ ≈206——行宽面带减） |
| 文档 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 820 | +1（变更记录行） |

跨档限：七档均无越限面（码档远离 300 顾问线；文档 touched 行 ≤294 ⇒ 收正后 ≤245；无 >300 字符新行）。

**4. 验收对照（AC1–AC9 · 全机检）**

| # | 判据 | 命令 ∕ 读回 | 期望 |
|---|---|---|---|
| AC1 | 六处残迹归零 | grep `门禁不可达` ∈ {thincoder-cli/src, thincoder-core, thincoder-vscode/src, thincoder-desktop/src} | 0 命中 |
| AC2 | A1 ∕ A2 落位 | grep `队内不应出现` ∈ thincoder-cli/src | 2（queued-pickup.mjs ∕ suspension-drive.mjs 各 1） |
| AC3 | A3 落位 | `thincoder-core/queued.mjs:76` 读回 ∧ grep `入队门禁` 同档 | 行 = `* \`slash\` 首动作 ⇒ 零动作 \`{ item: null, merged: null }\`。` ∧ 0 命中 |
| AC4 | A4–A6 落位 | grep `#429 取批面放行` ∈ thincoder-vscode/src | 3（panel-turn-stages 1 ∕ suspension 2） |
| AC5 | B1 落位 | `WEBVIEW-INPUT.md:184` 读回含 `docs/batches/2026-09-29-parity-b2-queued.test.mjs`；grep `queue-visible-vsc` 全文 | 行含对拍锁路径 ∧ 命中仅存 `## 变更记录` 段（记录面） |
| AC6 | B2 落位 | grep `双端同名常量` ∕ `核单源常量` ∈ `WEBVIEW-INPUT.md` | live 面（`## 变更记录` 之前）0 ∕ `:24` 含 `核单源常量` |
| AC7 | B3 落位 | `AGENT-LOOP-ASYNC-POOL.md:400` 读回 ∧ grep `thincoder-cli/src/tui/queued-merge.mjs` 同档 | 行含 `thincoder-core/queued.mjs` ∧ live 面 0 命中；记录面命中允许（`:764` + 本批新追加行） |
| AC8 | 零行为 | `git diff --stat` + 5 码档 `node --check` | 恰 7 档；代码 token 逐字不变（仅注释文本 ∕ 文档行变更——A4 ∕ A6 两处 = 带尾注分支行本体，diff 必现此两行）；check 绿 |
| AC9 | 记录面 | 两档变更记录段末 +1 行（内容 = 上录；WEBVIEW-INPUT.md 另含修正轮 +1 行——KD-9 收正，本 AC 计实施笔） | 读回在册 |

AC 域注：记录面历史命中豁免（`## 变更记录` 段 ∕ `:764` ∕ `:213`）；live 面判定 = 变更记录段之前。

**5. 用例表（正常 ∕ 边界 ∕ 错误）**

| 类 | 场景 | 期望 |
|---|---|---|
| 正常 | A1–A6 逐处 grep 命中新措辞（AC2–AC4） | 命中数如 AC |
| 正常 | B1–B3 逐处读回（AC5–AC7） | 行含新文 ∧ 旧字面 live 面零 |
| 边界 | 记录面历史命中（变更记录 ∕ 批档行） | 允许（历史面——不计入归零） |
| 边界 | 注释行宽 ∕ 档行数 | 无 >300 字符新行；无越限 |
| 错误 | 任一 AC 未达（残迹再现 ∕ 误改行为行） | 红 ⇒ 回退重做（fail-loud） |

**6. 关键决策（含否决备选）**
- KD-1 **收正形 = 现态句**：失效前提「入队门禁不可达」整体替换——零修订式表达 ∕ 零「旧…收正」残句（历史归记录面）。否决「仅加注不改句」= 失效措辞续存。
- KD-2 **VSC 三处判「防御支 ∕ 恒不触」**：#429 取批面放行后 `consumableAction` 全真（实读判据在盘）——否决「保留『防御面』原措辞」= 续存失效前提。
- KD-3 **CLI 两处保「防御面」语义**：busy 禁发在盘——仅措辞收正；否决「整句重写」（越注释级射程）。
- KD-4 **核件零行为**：A3 仅撤括号；`slash` 零动作早退 = 行为面，与端壳对齐归行为轮（B2 §2.3 + N8）——本批「零行为」口径下不动。
- KD-5 **B1 沿 B2 F3 先例**：改指新锁档 + 「批次本地件」；死档用例描述随换退场。否决「只改名留描述」= 死档描述改嫁新锁（误导）。

**7. 边界 / 不做**
- 零行为改动 ∕ 零测试件 ∕ 零评审点火 ∕ 零新语义；产品码改动面 = **注释级仅此六处**（逐处列明如上）。
- **不含（明示）**：`ipc.mjs:183-186`（归 B8）；行为族（核取项 1 行收正 + `consumableAction` 退场 + desk busy 取项改消费 + 窗载具两差——B2 §2.3「若动」方案，届时报请）；核件头注 `queued.mjs:10-11` 改句（B2 §2.8-N4——随 take-item 面轮）；他批射程零触。
- 文档面：仅 B1–B3 三处 + 记录面两行；两设计档其余行零触。

**8. 上抛 ∕ 观察（逐条报告）**
- O1 `docs/cli/design/TUI-INPUT-BOX.md:148` 同族措辞残存（「`/cmd` 首动作 = 入队门禁不可达的防御面——留给既有消费点」）——CLI 面语义仍真、措辞同体；#562 清单外 ⇒ 本批零触。**同判登记（修正轮补）**：本处与 A1–A2 收正口径同判——同一短语族「入队门禁不可达」（A1–A2 已换失效措辞、「防御面」语义保留——KD-3）；本处保留事由 = CLI 面语义仍真（成文如上）；短语族统一退役 ∕ 保留理由成文，裁结随 O5 一并（主 agent）。
- O2 `docs/vsc/design/WEBVIEW-INPUT.md:183-184` 其余测试档名（`webview-input-enter.test.mjs` 等 7 处）同随全清令成死引用——#562 仅点 F3 第三处；面级清点建议随文档面轮（本批零触）。
- O3 派单锚勘正：分诊轮锚记 `thincoder-cli/src/tui/queued.mjs:76`——该路径不存在（glob 实证）；核单源实档 = `thincoder-core/queued.mjs:76`（与 #562 行所记一致——逐处以其为准）。
- O4 坐标漂移登记（清单 as-of → 届盘）：`suspension-drive.mjs:263 ⇒ :112`；`panel-turn-stages.mjs:235 ⇒ :245`；`suspension.mjs:304 ∕ :452 ⇒ :138 ∕ :280`（B1-P3 重写后——六处总数不变）。延后项 ② 锚补登：`thincoder-desktop/src/main/ipc.mjs:183-186` ⇒ 届盘 = `historyPage` 函数体（非注释）；`aborted` reason 注释实位 `:193-198`（`:197`）——随延后项移交 B8。
- O5 `docs/vsc/design/WEBVIEW-INPUT.md:53` KD-9 收结句含「旧「入队门禁不可达」预设…随本落形收正」修订式措辞（§1 细则⑧ normative face；KD 记录与现态声明之争）——**修正轮处置（父侧接受评审发现 2——本批纳入）**：按 KD-1 口径收正为现态句（「slash 可达且就地消费」保留；修订式对照删除）；该档变更记录 +1 行（记录面保历史）。

**9. 机制设计 ∕ 接口契约 ∕ 测试面**
- 机制设计 = 无（零新语义——措辞 ∕ 指针收正）；接口契约 = 无（零接口 ∕ 零行为变动）。
- 测试面 = **零**（纯注释 ∕ 文档面——不新增批次本地件；集成面零触）。仓套件 = 未跑（收口跑 = 父侧）。

**设计评审修正轮 1（eng-designer · 2026-09-29）——承 §3 轮次 1（5 项 · 🔴0 / 🟡2 / 🔵3）· 父侧逐条裁定「全数接受 1..5」**

**逐号处置（发现号 → 改动 file:line；落点 = 收正后实读行号）**

| # | 处置 | 改动落点 |
|---|---|---|
| 1 | 已收正——AC7 期望句（「命中仅 `:764`」不可达：本批新追加行逐字含旧路径 ⇒ 记录面命中 = 2）⇒ 对齐 AC5 句形 | 本档 §2 AC7 行 `:91` |
| 2 | 已收正——O5 卫生处置（本批纳入）：KD-9 收结句 ⇒ 现态句（修订式对照删除）；该档记录面 +1 行 | `docs/vsc/design/WEBVIEW-INPUT.md:53` + `## 变更记录` 段末 `:236` |
| 3 | 已收正——AC8 判据显式化：「代码 token 逐字不变（仅注释文本 ∕ 文档行变更）」——A4 ∕ A6 带尾注分支行本体 diff 必现（按「代码 token 不变」判读） | 本档 §2 AC8 行 `:92` |
| 4 | 已补登——延后项 ② 锚漂移：`ipc.mjs:183-186` ⇒ 届盘 `historyPage` 函数体；`aborted` reason 注释实位 `:193-198`（`:197`）；随延后项移交 B8 | 本档 §2 O4 行 `:123` |
| 5 | 已补登——O1 同判登记：与 A1–A2 收正口径同判（同一短语族）；保留事由成文；裁结随 O5 | 本档 §2 O1 行 `:120` |

**就地同步（计数 ∕ 状态句——派生自 1–5）**：O5 行 `:124`（「本批零触」⇒ 修正轮处置）；受影响文件表 `:76`（`WEBVIEW-INPUT.md` 现读 235 ⇒ 236——修正轮 +1 行；实施笔届盘 237）；AC9 行 `:93`（补「另含修正轮 +1 行」注）。

**读回（AC7 ∕ AC8 期望列逐字）**：
- AC7 期望列 = 行含 `thincoder-core/queued.mjs` ∧ live 面 0 命中；记录面命中允许（`:764` + 本批新追加行）
- AC8 期望列 = 恰 7 档；代码 token 逐字不变（仅注释文本 ∕ 文档行变更——A4 ∕ A6 两处 = 带尾注分支行本体，diff 必现此两行）；check 绿

**边界核对**：改动面 = 本档 §2（就地七处 + 状态行 + 本块）＋ `docs/vsc/design/WEBVIEW-INPUT.md`（`:53` + 记录段 +1 行）；产品码 ∕ 测试件 ∕ §1 ∕ §3–§6 ∕ 其它档零触；本批写域 `.md` 行宽零新增 ≥301（本修正轮新增 ∕ 改动行最大 294）。**零新语义**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审限制**：未提供文档地图 ∕ 项目标准档——文档归属与方法论合规按 Project Guide（AGENTS.md）+ 在盘文档 ∕ 批档先例实证判定。

**实读核验（本轮）**：A1–A6 六处「现况」逐字与在盘一致（`thincoder-cli/src/tui/queued-pickup.mjs:17` ∕ `thincoder-cli/src/tui/suspension-drive.mjs:112` ∕ `thincoder-core/queued.mjs:76` ∕ `thincoder-vscode/src/extension/panel-turn-stages.mjs:245` ∕ `thincoder-vscode/src/extension/suspension.mjs:138` ∕ `:280`）；受影响表七档行数与在盘一致（34 ∕ 210 ∕ 90 ∕ 250 ∕ 290 ∕ 235 ∕ 820，内容行口径）；AC1–AC7 检索面逐一在盘核过（码面 `门禁不可达` 残存恰为六处；`queue-visible-vsc.test.mjs` 已退场、对拍锁档 `docs/batches/2026-09-29-parity-b2-queued.test.mjs` 在盘；`thincoder-cli/src/tui/queued.mjs` 不存在；`WEBVIEW-INPUT.md:184` 行宽恰 294）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收标准 | 🟡 | AC7（`thincoder/docs/batches/2026-09-29-b2-collection-correction.md:91`）期望 `thincoder/docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 内 grep `thincoder-cli/src/tui/queued-merge.mjs`「命中仅 `:764` 变更记录行」——但本批自身记录行（批档 `:62`）逐字含该旧路径且追加于该档末 ⇒ 实施后记录面命中为 2（`:764` + 新追加行），字面期望不可能达成（现盘实证 = `:400` live ∕ `:764` 记录，恰两处） | 收正期望句为「live 面 0 命中；记录面命中允许（`:764` + 本批新追加行）」——对齐 AC5 句形 |
| 2 | 文档卫生 | 🟡 | O5 所指 `thincoder/docs/vsc/design/WEBVIEW-INPUT.md:53`（KD-9 收结句「旧「入队门禁不可达」预设…随本落形收正」）为修订式措辞、留在 §1 细则⑧ 规范面（批档 `:124` 已上抛、本批零触）——与 2026-09-18 文档卫生裁决（修订式残句须删除、历史归记录面）不符，且与本批 KD-1「零修订式表达」口径两态 | 同笔按 KD-1 口径改为现态句（保留 KD-9 结论面）；如确有保留理由，建议成文登记以防悬空 |
| 3 | 验收标准 | 🔵 | AC8（批档 `:92`）「diff 无判据 ∕ 分支行（注释 ∕ 文档行 only）」与 A4 ∕ A6 的实现形态相抵：两处改的正是带尾注的分支行本体（`thincoder/thincoder-vscode/src/extension/panel-turn-stages.mjs:245` ∕ `thincoder/thincoder-vscode/src/extension/suspension.mjs:280`），diff 必现这两行——朴素机检会误红 | 判据显式化为「代码 token 逐字不变（仅注释文本 ∕ 文档行变更）」，或对 A4 ∕ A6 两行给显式豁免说明 |
| 4 | 需求覆盖 | 🔵 | §2.0（批档 `:28`）将延后项 ② 锚在 `thincoder-desktop/src/main/ipc.mjs:183-186`——现盘该区间为 `historyPage` 函数体（无注释）；`aborted` reason 注释实位 ≈`:193-198`（`:197` 行）；O4 仅登记本批六处漂移、未含该项 | 补一条漂移登记（或按现盘重锚）随延后项一并移交，避免下游按旧锚取件 |
| 5 | 文档归属 | 🔵 | O1（批档 `:120`）所指 `thincoder/docs/cli/design/TUI-INPUT-BOX.md:148` 同族措辞「`/cmd` 首动作 = 入队门禁不可达的防御面」保留（设计判 CLI 语义仍真 + 上抛）——与 A1 ∕ A2 已换写的同族措辞两态并存（收正决策悬置） | 建议与 A1–A2 收正口径同判登记（若短语族统一退役）或将保留理由成文，随 O5 一并裁结 |

**计数**：🔴 0 · 🟡 2 · 🔵 3
**VERDICT**: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-29 13:52「别等我了，自己跑完」授权——自缚三条件核验）：**
① **评审 pass**：§3 轮次 1 = 通过（🔴0 · 🟡2 · 🔵3——评审 #197）；
② **修正轮已落地**：五条逐条落位（AC7 ∕ AC8 期望句收正 · O4 漂移补登 · O1 同判登记 · O5 卫生处置）——父侧抽验两处关键句 ✓（详见 §2）；
③ **token 在位**：设计评审签发之 token 于本会话槽内（值不落档）。
**据此代签，准予进入实施（§5）。** 实施 = 单舱（六注释 + 三档收正 + 缓存面）；口径以 §2 为准（**测试面 = 零新增批次件**——AC1–AC9 机检即验收；父侧派单中「落用例件」一句为指令偏移，以 §2 为准）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-29 · 实施轮 · eng-coder——改动集 = 五码档注释六处（A1–A6）+ 两设计档指针三处（B1–B3）+ 记录面两行（7 档，零清单外）；AC1–AC9 机检全达（grep ∕ read-back ∕ node --check ×5 绿）；内部审计 1 轮 clean + 代码评审 1 轮 pass（🟡1 ∕ 🔵2——均属用例件面，随父侧更正「测试面 = 零」撤件全消解）；fix round 0；终态 clean）


**交付摘要**（2026-09-29 · 实施轮 · eng-coder · 台账 #562 · 单舱两波）

- 波 1 · 码面注释六处（逐字替换——「入队门禁不可达」族退役；产品行为零变）：A1 `thincoder-cli/src/tui/queued-pickup.mjs:17` ∕ A2 `thincoder-cli/src/tui/suspension-drive.mjs:112`（«防御面（斜杠 busy 禁发 ⇒ 队内不应出现…）»）；A3 `thincoder-core/queued.mjs:76`（仅撤失效括号）；A4 `thincoder-vscode/src/extension/panel-turn-stages.mjs:245` ∕ A5 `thincoder-vscode/src/extension/suspension.mjs:138` ∕ A6 `:280`（«防御支——#429 取批面放行：`slash` ∕ `turn` 同判可消费，恒不触»）。
- 波 2 · 设计档三处 + 记录面两行：B1 `docs/vsc/design/WEBVIEW-INPUT.md:184`（死指针 ⇒ 对拍锁 `docs/batches/2026-09-29-parity-b2-queued.test.mjs`（批次本地件））；B2 `:24`（双端同名常量 ⇒ 核单源常量）；B3 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:400`（`thincoder-cli/src/tui/queued-merge.mjs` ⇒ `thincoder-core/queued.mjs`）；记录面 = `WEBVIEW-INPUT.md:238` ∕ `AGENT-LOOP-ASYNC-POOL.md:821`（逐字 = §2 `:61-62`）。
- **AC1–AC9 机检读数**（终态实跑）：AC1 `门禁不可达` ∈ 四树 = **0**（扫描 479 文件）· AC2 `队内不应出现` = **2**（queued-pickup.mjs:17 ∕ suspension-drive.mjs:112）· AC3 `queued.mjs:76` 逐字 ✓ ∧ 同档 `入队门禁` = 0 · AC4 `#429 取批面放行` = **3**（panel :245 ∕ suspension :138 ∕ :280）· AC5 `:184` 含锁路径 ✓ ∧ 旧名退场 ∧ live 0（记录 [213, 238]）· AC6 `:24` 含核单源常量 ✓ ∧ live 0 · AC7 `:400` 含核路径 ✓ ∧ 旧路径 live 0（记录 [764, 821]）· AC8 五码档 `node --check` 全绿 ∧ A4 ∕ A6 `//` 前代码段逐字 ✓（diff 必现两行 = 尾注文本本体，预期）· AC9 两行在册（WEBVIEW:238 = 现档末行；POOL:821 在册——其下 `:822-823` = 并发批 doc-sync-residuals 修正轮追加行，本批落笔后由他批追加，append-only 常态）。
- **用例件处置（承父侧更正）**：原派单「用例件落 `docs/batches/2026-09-29-b2-collection-correction.test.mjs`」= 指令偏移（§2 §9 ∕ §4 `:175`：测试面 = 零——不新增批次本地件）。本代理此前按原派单于 `.thincoder/tmp/` 暂存同名件（未落终位；曾用于一次性机检 11/11 绿），收更正后**已撤除**（delete）；终位 `docs/batches/…test.mjs` 从未创建。AC1–AC9 机检改一次性命令执行（读数如上）。

**决策透明表**

| # | 决策 | 依据 ∕ 理由 |
|---|---|---|
| 1 | 用例件撤除 ∕ 机检改一次性命令 | 父侧更正（§4 `:175`：派单偏移作废；测试面 = 零）——撤除前 11/11 机检绿，读数沿用 |
| 2 | A4 ∕ A6 = 分支行尾注文本本体（diff 必现两行——非行为改动） | §2 AC8 修正版口径（代码 token 逐字不变）；报告显式标注防机检误红 |
| 3 | 六处落点行号 = 评审时值（届盘实读一致，无漂移重锚） | §2 §1 表 + 届盘复核（`:17` ∕ `:112` ∕ `:76` ∕ `:245` ∕ `:138` ∕ `:280`） |

**审计与代码评审轮次与终态**

- 内部 explore 背离审计（只读 · **1 轮**）= **CLEAN**：PARTIAL ∕ SILENT-SIMPLIFICATION ∕ DOC-DRIFT ∕ OUT-OF-LIST 四类零命中；九处收正逐字与 §2 一致（其装配无 shell ⇒ 未实跑 `node --test` 的限制，已由本代理实跑 11/11 绿覆盖〔撤件前〕）。
- advisor 代码评审（type=code · **1 轮**）= **pass**：🔴0 ∕ 🟡1 ∕ 🔵2——三条均以用例件为对象（🟡 用例件 vs §2 §9/§4 状态相抵；🔵① AC9 断言与并发追加耦合；🔵② AC8 仅机检半面）；随父侧更正（测试面 = 零）与撤件**全数消解**（无残留面）。
- **fix round = 0**（无代码面须修）· **终态 = clean**。

**边界核对**：改动面 = §2 受影响表七档（零清单外第 8 档）；产品行为零变（A4 ∕ A6 仅尾注文本；其余四处 = 注释行）；`WEBVIEW-INPUT.md:53` 零触（修正轮已处置）· §1 ∕ §3 ∕ §6 零触 · 他批射程零触（并发批对同两档记录面的追加行 = 他批笔，非本批）。**未做（明示）**：`ipc.mjs`（B8）· 行为族（B2 §2.3「若动」+ §2.8-N8）· `TUI-INPUT-BOX.md:148`（O1）· O2 面（其余死档名）· 仓套件（**not repo-suite verified**——收口跑 = 父侧）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：单实施舱 #208——A1–A6 六处码注释收正（`queued-pickup.mjs:17` · `suspension-drive.mjs:112` · `queued.mjs:76` · `panel-turn-stages.mjs:245` · `suspension.mjs:138 ∕ :280`）＋ B1–B3 三档收正（`WEBVIEW-INPUT.md` 对拍锁/常量句 · `AGENT-LOOP-ASYNC-POOL.md:400` 指向）＋ 两档变更记录各 +1 行；改动集恰 **7 档**。

**验证（父侧）**：① AC1–AC9 逐条读数全绿（舱报；`node --check` ×5 全绿）；② 父侧抽验——`队内不应出现` ∈ cli/src = 2 ✓ ∕ `#429 取批面放行` ∈ vscode/src = 3 ✓ ∕ `queued.mjs:76` = 净形 ✓；③ 舱内 explore 背离审计 1 轮 CLEAN ∕ advisor 代码评审 1 轮 pass（0🔴）· fix 0 轮 · 终态 clean；④ 用例件：按父侧更正撤除（**测试面 = 零**——AC 机检即验收，§4 口径）；**not repo-suite verified**（收口跑 = 父侧口径）。

**边界**：产品行为零变（注释文本 ∕ 档面收正）；并发行披露 ✓（`WEBVIEW-INPUT.md:237` ∕ `AGENT-LOOP:822-823` = doc-sync 批笔）；未做清单在 §5（desktop `ipc.mjs` 归一 B8 等）。

**结算（D7）**：**#562 → 已核销**（依据本节 + §2 ∕ §3 ∕ §5）。**状态行**：已收口 2026-09-29。
