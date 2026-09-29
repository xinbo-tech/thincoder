# 2026-09-29 · desktop-micros
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 04:57「不能当场做你就不能排队做？」——台账 #576 ∕ #578 家族排队入场（桌面微件：timer 起算面 + 残余族续四项）。
> 台账 = #576 ∕ #578（desktop · 排队入场）。前情 = 2026-09-29 波后微件（用户「排队做」令下）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:5x）
- **来源**：用户排队令「不能当场做你就不能排队做？」——本批 = 台账 **#576 ∕ #578** 的排队入场（原仅登记待排 ⇒ 现进场）。
- **射程**：#576 窗内起算面未包判据（`suspension-drive.mjs:298`；**行为变更——§4 报请**）∥ #578 残余族续四项（`notify.mjs:9` 收正句 · 亮色低对比 `--mode-plan` ∕ `--warn` · `deleteSession` 失败径 · `UI.md` 短引文）。
- **口径**：与在飞批同域串行（`#575` 残余族 ∕ B1 实施面零触）；行为变更项须写明用户可见面变化。

### 1.2 父侧注（2026-09-29 05:1x）
- **批件三链**：① #576 真面 = CLI `thincoder-cli/src/tui/suspension-drive.mjs:298`（桌面 `:60` = 合规对照）——**坐标勘误见 §2 §0**（派单 ∕ 台账原记桌面坐标不成立）；② #578 四项逐件（② 色值定值 ∕ ③ 失败 toast ∕ ④ 引文收正 ∕ ① 档面句）；③ 行为变更 = 关态窗内零自动唤醒（§4 报请句在 §2）。
- **评审**：设计评审 #94 pass（🔴0 · 7 条）；修正轮在册接办。
- **避让**：五档冻结轮在飞 ⇒ 文档笔落排后（让先关系在 §2 档面笔清单）。

### 1.x 波间登记（父侧 · 2026-09-29 06:3x · #106 码面波交付）

- `src/main/file-links.mjs:5` 同款悬挂括注（同 `#578①` 族）= **归档面波（gated）同笔**（设计面收正时消解；已两次披露在册）。
- `renderer/i18n.mjs:44-53` 键数链落后 2 = **承接 #544**（别批在飞让先，在册）。
- 批内件终位 = 父侧 §6 copy 收位（现态可跑已核）。
- 届盘适配两处（CLI `:298`→`:164-166`（B1-P3 重写所致）· mount-sessions `reasonOf` 同族形）**受理**（审计 + 评审双向复核在册）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（逐项定形 5 行（#576 + #578 四项）· 判据句 J-1–J-6 · 受影响文件表 + 实施序 · 坐标勘误（#576 真面 = CLI）· 修正轮 findings 1–7 逐号收口 + 档面笔清单（含 B4 让先）· 五档笔落排后 ∕ 同档让先 · 2026-09-29）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（desktop-micros · 2026-09-29 · eng-designer）**

> 任务书依据 = 派单（目标与理由 + 已知事实 + 设计要点）+ 台账 #576 ∕ #578 逐行（`ledger_query` 实读）+ 本档 §1.1。
> **口径（as-of 2026-09-29 04:5x–05:0x 逐处实读）**：本轮零产品码 ∕ 零设计档笔（只出方案）；五档（`UI.md` ∕ `PROJECT.md` ∕ `SHELL.md` ∕ `RENDERER.md` ∕ `IPC.md`）在飞批写域 ⇒ 本批涉五档笔落**一律排后**（含 #578① ∕ ④ 落点——避让条件 = 在飞批落定 ∕ 解冻宣告，§5）；在飞批同档让先 = `#575` 残余族（`theme.css` ∕ `mount-sessions.mjs` ∕ `i18n-views.mjs` 三档同文件——其后一笔）；B1 实施面零触 ∕ B3 ∕ B4 ∕ A 批 ∕ #561 相容性逐条核（§3）。
> **需求面核对**：本批 = 技术债交收（台账 #576 ∕ #578）+ 在册判据句（`AGENT-LOOP-ASYNC-POOL.md` §6.30.10）的码面兑现——无需求档（`requirements/`）条目变更；各项判据见 §2；#576 = 行为变更，走 §4 报请（可见面引句在册）。

**0. 坐标勘误（findings ① —— 派单 ∕ 台账 #576 坐标与在册源相抵）**

- 派单 ∕ 台账 #576 记「`thincoder-desktop/src/main/suspension-drive.mjs:298` 直取 `pendingTimerDeadline`」；**实读相抵**：① 该档现读 **279** 行（无 `:298`）；② 该档 `:60` 已包判据（`deadline: () => (timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null)`）——**桌面 = 对照组（合规，零触）**。
- 在册源三处一致指向 **CLI**：`AGENT-LOOP-ASYNC-POOL.md` §6.30.10（「现盘 CLI 窗内起算面未包判据（`thincoder-cli/src/tui/suspension-drive.mjs:298` 直取 `pendingTimerDeadline`）⇒ 码面补包判据在册」）· B3 批档 §2.8① · `tech-debt-closeout.md:892` 疑点原句（「`agent.timerWake: false` 时挂起窗仍开 timer 轮」）。
- 实读确认（真面）：CLI `thincoder-cli/src/tui/suspension-drive.mjs:298` = `const why = await waitForSettleOrWake(agent, state, { deadline: pendingTimerDeadline(agent), timer: ctx.timer, clear: ctx.clear })`——**未包判据**。
- **处置**：本批按实读坐标执行（CLI 面）；本勘误供父侧收正台账 #576 ∕ 派单转记（§8①）。

**1. 逐项定形表（5 行 = #576 一项 + #578 四项）**

| # | 状态 | 实读证据（as-of 2026-09-29 04:5x–05:0x） | 修法 | 落点 | 分类 |
|---|---|---|---|---|---|
| #576 | 仍真（**真面 = CLI**——§0 勘误；桌面已合规） | CLI `tui/suspension-drive.mjs:298` deadline 实参未过 `timerWakeEnabled`；对照：闩面已过（`tui/timer-watch.mjs:67`）· 桌面已过（`src/main/suspension-drive.mjs:60`）· 交付面不加判据（`deliverExpiredTimers` 唯一可达径 = 已注册 deadline）。后果（`timerWake:false` 时）：窗内 deadline 仍注册 ⇒ 到期交付并开 timer 轮（`:301-303`）——关态仍自动开轮 | deadline 实参改判据包形（与桌面 `:60` 同形同源）：`const deadline = timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null`（+1 行 + 注释）；导入面 `:23` 自 `./timer-watch.mjs` 增 `timerWakeEnabled`（B3 后该名 = 核 re-export，名恒在） | `thincoder-cli/src/tui/suspension-drive.mjs:297-298` + 设计档 `AGENT-LOOP-ASYNC-POOL.md` §6.30.10 判据句收正（排后——§5） | 行为变更（出零变边界——§4 报请；可见面 = §2） |
| #578① | 仍真 | `desktop/src/main/notify.mjs:9` 与 `core/notify-policy.mjs:12-13` 自载「设计档收正归设计面轮」；设计档现态 = `IPC.md:99-100`（「持有面 = 主进程自持」）+ `PROJECT.md:158` 行尾（「词键 = 主进程自持〔zh ∕ en 常量对〕」）——R6 上提（2026-09-28）后实态 = **核件 `thincoder-core/notify-policy.mjs` `NOTIFY_TEXTS` 持有**（locale 经核 `normalizeLocale(agent.config?.locale)`） | 设计档两处句收正（持有面 = 核件；消费 ∕ 装配面 = 桌面 `notify.mjs` re-export + `main.mjs` 装配）+ 变更记录各一行；`notify.mjs:9` 悬挂括注消解（1 行）；`notify-policy.mjs` 同句 = **只报**（核件零触——§8②） | 设计档 = `IPC.md` §1 词键注 + `PROJECT.md` §4.1（**冻结 gated**）；码 = `notify.mjs:9` | 文档收正（一行级 ×2 + 注释 ×1） |
| #578② | 仍真 | `desktop/renderer/theme.css:14-15`（亮色）`--warn: #bf8803`（对 `--bg #f7f8fa` **2.93:1** ∕ 白 3.12）· `--mode-plan: #0598bc`（**3.18:1** ∕ 3.37）——两值皆 <4.5；同族已修 = `--mode-advisor`（#534，`#575` 在飞 `:16`）；消费面 = `chrome.css:421-424`（banner AUTO/PLAN ∕ warn 段）· `core.css:144/:280` · `chat.css:253` · `chat-fixes.css:41` | **定值（同色相暗化 · 与 #534 同形）**：`--warn ⇒ #8a6100`（hue 42.2°≈原 42.4°；对 bg **5.21:1** ∕ `--bg-raised` 5.54）· `--mode-plan ⇒ #047990`（hue 189.9°≈原 191.8°；对 bg **4.77:1** ∕ 5.07）——两值两底 ≥4.5 ✓；暗色两值（`:50-51`）**零动**（CLI 忠实值）；亮色注释按新出处收正（与 #534 同形） | `theme.css:14-15`（值 + 注释） | 当场落（让先 #575 L1——同档） |
| #578③ | 仍真 | `mount-sessions.mjs:378-380`（回执非 ok ⇒ console.error + `return false`）· `:385-387`（catch 同）——两失败径零可见面；先例 = `session.openFailed`（`:335 ∕ :346` showToast 已落）+ #556 `session.renameFailed`（#575 在飞 L6）；词面组 = `i18n-views.mjs` ⑤ 组（en `:74-76` ∕ zh `:195-197`）；UI 侧 ✕ 控件 >1 才显（`views/session-control.mjs:15/:160`）⇒ `last-session` 常态不可达（真实失败面 = race `slot-missing` ∕ 抛） | 两失败径各补 `showToast(t("session.deleteFailed", { reason }))`（回执径 reason = `String(receipt?.reason ?? "")`；catch 径 = `String(error?.message ?? error)`——沿 openFailed 形）+ 词表 ⑤ 组增一键 ×2 语（zh「会话删除失败（${reason}）」∕ en "Could not delete the session (${reason})"）+ 组注释计数随键增同笔（与 #556 键同组——按其落定形续） | `mount-sessions.mjs:378-380 ∕ :385-387` + `i18n-views.mjs`（两语组） | 当场落（一行级 + 一键；让先 #575 L6——同档 ∕ 同词表组） |
| #578④ | 仍真（按现盘重读——坐标集补齐） | `UI.md:100`（「`render-frame.mjs:344` 起（`buildStatusLine`）+ banner（`:221-225`）+ 注意力 chip（`:229-230`）+ 键位组（`:427` 尾段）」）· `UI.md:193`（「注意力 chip 行首（`:229-230`）→ banner 四态（`:221-225`）→ 状态段簇（`:427`）」）；现盘实读（CLI `render-frame.mjs`，434 行）：`buildStatusLine` = **:350** · banner 四行 = **:227-230**（`bannerPrefix` :231）· chip = **:235-236** · 合成行（簇 + 键位组尾段） = **:433**（+6 漂移族；chip ∕ banner 两侧已由残余族批解出，`:350` ∕ `:433` 本书补齐） | 两行引文全量收正（旧值零残留）：`:344 ⇒ :350` · `:221-225 ⇒ :227-230` · `:229-230 ⇒ :235-236` · `:427 ⇒ :433`（两行七处）+ 变更记录一行 | `UI.md:100 ∕ :193`（**冻结 gated**；注：同两行亦载 #535 冻结子集——收正取并集一笔，零重复改；`:105 ∕ :198` = #535 面，不属本批） | 当场落（解冻后笔） |

**2. 判据句（批内件 ∕ 真机面）**

- **J-1（#576 · 结构核）**：`thincoder-cli/src/tui/suspension-drive.mjs` 内 `pendingTimerDeadline` 调用点计数 = 1 ∧ 该调用处为判据包形（`timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null`——与桌面 `:60` 同形）；导入面含 `timerWakeEnabled`（自 `./timer-watch.mjs`）。
- **J-2（#576 · 行为 · 真机面——父侧）**：`agent.timerWake: false` + 挂起窗 + 在途 timer ⇒ 到期零自动开轮（窗内不落提醒行）；下一回合边界到达 ⇒ 既有注入面（`post-turn` 轮询）顺延送达。缺省（未显式关）⇒ 行为逐字等价。
- **J-3（#578① · 档面实读）**：`IPC.md` §1 词键注 ∕ `PROJECT.md` §4.1 notify 行 = 持有面核件（`notify-policy.mjs`）；该注面「主进程自持」零命中；`notify.mjs:9` 内「设计档收正归设计面轮」零命中。
- **J-4（#578② · 批内件 L-B）**：theme.css 亮色两值提取 = `#8a6100 ∕ #047990` ∧ WCAG 复算对 `--bg` ∕ `--bg-raised` 皆 ≥4.5 ∧ 暗色块两值零动（diff 白名单 = 亮色两行）。
- **J-5（#578③ · 批内件 L-C + 真机）**：`mount-sessions.mjs` 含 `session.deleteFailed` 恰 2 处（两失败径）∧ `i18n-views.mjs` 该键恰 2 处（两语）；失败注入不可稳造 ⇒ 结构核 + 判据句为准（`slot-missing` 径若易造 ⇒ 父侧顺手核）。
- **J-6（#578④ · 档面实读）**：`UI.md:100 ∕ :193` 两行内旧值四字面（`:344` ∕ `:221-225` ∕ `:229-230` ∕ `:427`）零命中 ∧ 新值（`:350` ∕ `:227-230` ∕ `:235-236` ∕ `:433`）全命中；同档他行零动。

**#576 行为变更可见面（§4 报请句 · 原文）**

> 「`agent.timerWake: false`（显式关）时：挂起窗内 timer 到期**不再自动唤醒**——不自动开 timer 轮、提醒行不入流；到期件顺延至下一回合边界的既有注入面送达。默认态（未显式关）**零变化**。此为在册判据（`AGENT-LOOP-ASYNC-POOL.md` §6.30.10「关的射程：关 ⇒ 窗内 `deadline` 亦 `null`」）的码面兑现——CLI 现盘未包、本批补包。」

**批内件** = `docs/batches/2026-09-29-desktop-micros.test.mjs`（拟新增；全清令现行制：名随批次档 ∕ 住 `docs/batches/` ∕ 不进仓套件 ∕ 实施者自写自跑 · 随批留存；复跑 = `node --test docs/batches/2026-09-29-desktop-micros.test.mjs`）。腿三：**L-A**（J-1 结构核——源扫描断言：调用点计 1 ∧ 包形正则 `timerWakeEnabled\(agent\)\s*\?\s*pendingTimerDeadline\(agent\)\s*:\s*null`）· **L-B**（J-4 值核——提取亮色两值 + WCAG 复算两底 ≥4.5）· **L-C**（J-5 结构核——两档键面计数）。#578① ∕ ④ 不设机检腿（档面 = 实读判据——零文锚测试）。**#545 写门立即形** = 实施者写 `.thincoder/tmp/` → 父侧 copy 至终位。

**3. 与在飞批的相容性核查**

- **A 批（`2026-09-29-desktop-window-queue-parity` ∕ #564）**：受影响面 = 桌面 `suspension-drive.mjs`（`pushInput` ∕ `driveTurn` ∕ `resumeResidual` ∕ `prepare` 注入——+8~12）· `turn-driver.mjs`（+2~4）· 三设计档；**不触** `timerFaceOf`（`deadline` ∕ `deliver`）区、不触 CLI ∕ VSC。本批 #576 = CLI 一笔 + 桌面**零触** ⇒ 零文件重叠 ∕ 零区块重叠 → **相容**。附：按派单原坐标读法（桌面 `:298`）——A 批落定后该档 ≈288–291 行（仍无 `:298`）且判据已包 ⇒ 无论何读法零相抵；桌面 `:60` 判据包形 = 本批修复形之**对照基准**（同形复制目标），A 批亦不动该行。
- **`#575` 残余族（在飞）**：同档三处让先（`theme.css:16`〔L1〕· `mount-sessions.mjs:356-364`〔L6〕· `i18n-views.mjs` 键面〔L6 连带〕）——本批对应落点在其**后一笔**（同文件串行，零并写）。
- **B1（VSC 核收编）**：本批 VSC 零触（§8② 同形缺陷只报）⇒ 零相抵。
- **B3（timer 三端收口）**：B3 触 CLI `tui/timer-watch.mjs`（判据副本 ⇒ 核 re-export）——本批触 `tui/suspension-drive.mjs`（不同档）；`timerWakeEnabled` 名义在 B3 前后恒在 ⇒ 导入面无时序约束；同族单触序建议 B3 先（非硬性）。B3「零触清单」已含本档（互认）。
- **B4（VSC 小件迁移族——含 notify）**：其面 = VSC 取核 + 删残留；本批 ① 涉 notify 设计档句 + 桌面注释、**核件零触** ⇒ 零相抵；实施时若 B4 已落且核心持有面有变 ⇒ 收正句按其落定态复核（无变即按本设计落）。
- **#561（挂起窗径「消费前流内零块」）**：面 = 端侧抑制 ∕ 回执 ∕ 归约——不触 timer 面 ⇒ 零相抵。

**4. 受影响文件表（实施轮）**

| 文件 | 现读 | 变更 | 归属 ∕ 让先 |
|---|---|---|---|
| `thincoder-cli/src/tui/suspension-drive.mjs` | **371** | #576：deadline 判据包（+1 行 + 注释）+ 导入名 +1；Δ ≈ +2（⇒ ≈373） | eng-coder · 无同档在飞（B3 零触清单含本档；B2 不触） |
| `thincoder-desktop/src/main/suspension-drive.mjs` | **279** | **零触**（对照组——已合规；A 批在飞同档，本批零笔） | — |
| `thincoder-vscode/src/extension/suspension.mjs` | — | **零触**（B1 面；同形缺陷只报——§8②） | — |
| `thincoder-desktop/renderer/theme.css` | **89** | #578②：亮色两值 + 注释两行；Δ ≈ ±0~+2 | eng-coder · 让先 #575 L1（`:16`） |
| `thincoder-desktop/renderer/mount-sessions.mjs` | **400** | #578③：两失败径 +2 行；Δ ≈ +2（⇒ ≈402） | eng-coder · 让先 #575 L6 |
| `thincoder-desktop/renderer/i18n-views.mjs` | **282** | #578③：+1 键 ×2 语 + 组注释续链；Δ ≈ +4 | eng-coder · 让先 #575 L6（同组） |
| `thincoder-desktop/src/main/notify.mjs` | **11** | #578①：`:9` 悬挂括注消解（1 行）；Δ ≈ ±0 | eng-coder |
| `thincoder-core/notify-policy.mjs` | **56** | **零触**（核件——同句只报，§8②） | — |
| `docs/desktop/design/IPC.md` | **374** | #578①：§1 词键注持有面句收正 + 变更记录一行；Δ ≈ +2 | eng-designer · **gated** |
| `docs/desktop/design/PROJECT.md` | **1121** | #578①：§4.1 notify 行句收正 + 变更记录一行；Δ ≈ ±1 | eng-designer · **gated** |
| `docs/desktop/design/UI.md` | **645** | #578④：`:100 ∕ :193` 两行收正 + 变更记录一行；Δ ≈ ±0~+1 | eng-designer · **gated**（与 #535 子集并笔） |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | **801** | #576：§6.30.10 判据句收正 + 变更记录一行；Δ ≈ +2~3 | eng-designer · 与 B3 实施轮串行 |
| 批内件 `docs/batches/2026-09-29-desktop-micros.test.mjs`（拟新增） | — | L-A ∕ L-B ∕ L-C 三腿；≈ 60–100 | 本批（#545 立即形） |

**5. 实施序**

0. **前置核**：① 在飞批落定态（`#575` §5 ∕ B3 §5 ∕ A 批 §5 ∕ copy ∕ susp-queue 五档笔落状态）；② 五档解冻判（本批三处档面笔以解冻为前置）；③ 同档让先项实读（`theme.css:16` · `mount-sessions.mjs:356-364` · `i18n-views.mjs` 键面）。
1. **#576**（CLI 一笔 + L-A）——可先落（零相抵）。
2. **#578①**（`notify.mjs:9` 注释一行）。
3. **#578②**（theme.css——`#575` L1 落定后）。
4. **#578③**（mount-sessions + i18n-views——`#575` L6 落定后；组注释计数按落定形续）。
5. **档面**（eng-designer）：⑤a `AGENT-LOOP-ASYNC-POOL.md` §6.30.10 收正（B3 实施轮落定后一笔；若届时 VSC ∕ 核同句已由他轮收 ⇒ 按届盘实读只收残余）；⑤b 冻结五档三笔（`IPC.md` ∕ `PROJECT.md` ∕ `UI.md`——解冻后；UI 两行与 #535 子集并笔；一笔一 read-back）。
6. **收尾**：批内件亲跑 + `node scripts/doc-check.mjs` 复跑（读数入 §5）+ 真机面（父侧：J-2 关态 ∕ #578② 亮色目视 ∕ #578③ 失败面）。

**6. 验收对照（回派单 ①–④ + 附加）**

| 派单验收 | 落点 | 判据（机检 ∕ 实读） |
|---|---|---|
| ① 逐项定形表（#576 + #578①②③④） | §1 | 表行数 = 5；id 集合 = {576, 578①, 578②, 578③, 578④}；每行六列齐（状态 ∕ 实读证据 ∕ 修法 ∕ 落点 ∕ 分类） |
| ② 判据句（含行为变更可见面） | §2 | J-1–J-6 逐项判据 + #576 报请句原文在册（可见面 = 关态零自动唤醒 ∕ 默认态零变） |
| ③ 受影响文件表 + 实施序 | §4 ∕ §5 | 文件表 ⊇ 全部落点（含批内件）；实施序含前置核 ∕ 让先句 ∕ 收尾读数 |
| ④ §2 落盘 | 本 append 两连 + 状态行 | `batch append` ×2 + `status`（read-back 核） |
| 附加 A：冻结五档本轮零写（设计轮） | — | 五档零 diff；笔落排后（§5 条件在册） |
| 附加 B：坐标勘误在册（#576 真面 = CLI） | §0 ∕ §8① | 实读 file:line 三处（CLI `:298` ∕ 桌面 `:60` ∕ 桌面行数 279） |

**7. 关键决策（KD）**

- **KD-1** #576 按实读坐标执行（CLI 面）；桌面零触 ∕ VSC 只报（B1 面）——派单 ∕ 台账坐标勘误在册（§0）。
- **KD-2** #576 判据只住起算面（`deadline` 现算点）——交付面不加判据（唯一可达径 + 三端同形；零双判据）。
- **KD-3** #578② 定值 = `#8a6100 ∕ #047990`（≥4.5 硬判据 · 同色相暗化 · 暗色零动）。
- **KD-4** #578③ 键 = `session.deleteFailed`（#556 命名形 ∕ ⑤ 组 ∕ 值形同 `openFailed`）。
- **KD-5** #578④ 坐标集 = 现盘实读（+6 漂移族统一；含 #535 子集并笔）。
- **KD-6** 五档笔落排后 + 同档让先（#575 L1 ∕ L6）——不静默降级、不越窗写。
- **KD-7** #578① 落点 = 设计档两处 + 桌面注释一处；核件同句只报（核件零触）。

**8. 上抛项（findings——逐条）**

1. **坐标勘误**（#576：台账 ∕ 派单 vs 在册源）——供父侧收正台账 #576 evidence（`thincoder-desktop/...` ⇒ `thincoder-cli/...`；桌面 = 合规对照组，见 §0）。
2. **只报（零触）**：① VSC `thincoder-vscode/src/extension/suspension.mjs:376` 直取 `pendingTimerDeadline`（同缺陷未包判据）——B1 实施面零触 ⇒ 建议归 B1 收正轮 ∕ 其后小轮（1 行同形修）；② `thincoder-core/notify-policy.mjs:12-13` 悬挂句同（核件零触）——建议随核面触碰轮消解；③ `AGENT-LOOP-ASYNC-POOL.md` §6.30.10「桌面 ∕ VSC 面 `timerWakeEnabled` 单源同判」句在 VSC 面现不实——⑤a 收正时按届盘实读一并处置。
3. **#578④ 与 #535 冻结子集同两行**（重叠登记）——收正取并集一笔（防两批各改半）；归属 = 解冻后首触该两行的批（建议随 #535 落）。
4. **#578① 邻面观察**（只报）：`PROJECT.md:73` KD-35 句「通知出档 notify.mjs（策略面零 electron 依赖…）」——R6 后策略体住核，句面可按实收（与 ① 同笔一并裁，gated）。
5. **测试制度**：批内件写门相抵（#545）——本批沿用立即形（tmp → 父侧 copy）；长期形仍归判据语义面（他批）。

**9. 边界（不做）**

- 核件机制零改（`timers.mjs` ∕ `notify-policy.mjs` ∕ suspension 核件——零触）；VSC ∕ B1–B10 射程零触；A 批 ∕ #561 ∕ `#575` 实施面零触。
- 桌面 code 零触（#576 对照组）；无新机制 ∕ 无新通道 ∕ 无新需求面 ∕ 无白名单项。
- `UI.md:105 ∕ :198`（#535 面）不属本批；#578① 的档面收正只及该注面两处（KD-35 邻面只报）。
- 其它批触发词（「随下一桌面轮」族）不扩面。

**10. 写后核（D6）**

- read-back：`append` ×2 + `status` 均已落盘并逐段回读核（表头 ∕ 表体 ∕ 尾段齐）。

**修正轮（findings 1–7 逐号收口 · 依据 = §3 轮次 1 + 父侧逐条裁定 · as-of 2026-09-29 05:1x–05:2x · eng-designer）**

> 处置执行人 = eng-designer（§3 `Suggestion` 列 = 建议面，父侧已逐条裁定接受）。本轮零产品码 ∕ 零测试件 ∕ 零核件 ∕ 零冻结档写；落点 = 本块（记录面）+ 档面笔清单（下块）+ §4 素材。**本块与 §2 早期文本相抵处以本块为准**——下列逐项（删除 ∕ 收正 ∕ 补行）落地后，对应旧文不再作为在册项。

**（1）逐号收口表（1..7）**

| 号 | 严重度 | 处置 | 改动（本档 ∕ 清单） | 备注 |
|---|---|---|---|---|
| 1 | 🟡 | 已办——两档档位结论在册（本块（3））+ 两处登记值刷新并入清单 | 本块（3）；清单 P5（`docs/cli/design/CLI-DEBT.md:55` B5 341⇒371）· P3（`docs/desktop/design/PROJECT.md:278` 400⇒402） | 落排 = 解冻后 ∕ 让先与发现 4 同判 |
| 2 | 🟡 | 已办——现盘复核零命中 ⇒ 本项删除 + 引句收正 | 本块（2）：收正 as-of `:41` ∕ `:81`（56⇒51）∕ `:122` | 真落点 = desk `file-links.mjs:5` ∕ `notify.mjs:9` |
| 3 | 🟡 | 已办——登记进清单 | 清单 P1②（`docs/desktop/design/UI.md:462`） | 与 #534 改值取并集一笔 |
| 4 | 🟡 | 已办——记录面补行 + 步 0 并入 | 本块（4）：相容表 B4 行 + §5 步 0 前置核 | 清单 P1 ∕ P2 ∕ P3 让先列同载 |
| 5 | 🔵 | 已办——标明（无动作变更） | 本块（5） | 「并入步 1」支不取（与 B3 让先相抵） |
| 6 | 🔵 | 父侧笔 · 零触 | —（§1 面归父侧） | 指针已载（§1.2「坐标勘误见 §2 §0」） |
| 7 | 🔵 | 已办——可见面素材供 §4 | 本块（6） | 取「并入 §4 报请句素材」支 |

**（2）发现 2——核件复核与收正（本项删除）**

- **复核（现盘实读）**：「设计档收正归设计面轮」字面在 `thincoder-core/notify-policy.mjs`（现行 **51** 行）**零命中**；真落点 = desk `src/main/file-links.mjs:5` ∕ desk `src/main/notify.mjs:9`（两处均在盘）。
- **收正（以本块为准）**：
  - ① 逐项定形表 #578① 行（评审记 `:36`；as-of `:41`）：证据列「与 `core/notify-policy.mjs:12-13` 自载『设计档收正归设计面轮』」段——**删除**（核件无此句）；修法列末段「`notify-policy.mjs` 同句 = **只报**（核件零触——§8②）」——**删除**。
  - ② 受影响文件表 `thincoder-core/notify-policy.mjs` 行（评审记 `:76`；as-of `:81`）：现读 **56 ⇒ 51**；括注「同句只报」随 ③ 删——本批对该档零笔（读数已收正）。
  - ③ §8 第 2 条 ②（评审记 `:117`；as-of `:122`）：「`thincoder-core/notify-policy.mjs:12-13` 悬挂句同（核件零触）——建议随核面触碰轮消解」——**删除**（只报项落空）。
- **保留面**：#578① 本体不变（三落点 = desk `notify.mjs:9` ∕ `IPC.md:99-100` ∕ `PROJECT.md:158`；落点笔 = 清单 P2 ∕ P3 + 码笔步 2）。

**（3）发现 1——越档件档位结论（两档 · 本批只登记不拆）**

- `thincoder-cli/src/tui/suspension-drive.mjs`（**371 → ≈373**，Δ≈+2 = deadline 判据包 + 导入名）：无新模块职责 ∕ 无新导出族 ⇒ **本批只登记不拆**；**拆分候选面 = `finally` 收尾块（清场 + 计数日志）抽 `suspension-teardown.mjs`**（在册 = `AGENT-LOOP-ASYNC-POOL.md` §6.20.4 拆分计划行；数据 ∕ 触发活面 = `docs/cli/design/CLI-DEBT.md:55` B5 行）。消解条件 = 越 500 硬限前 ∨ 该档下次实质改动时。
- `thincoder-desktop/renderer/mount-sessions.mjs`（**400 → ≈402**，Δ≈+2 = 两失败径补 `showToast`）：无新职责 ∕ 无新导出族 ⇒ **本批只登记不拆**；**拆分候选面 = 续拆两手〔开页链 ∕ 刷新面——拆点名实施批定〕**（在册 = `docs/desktop/design/PROJECT.md` §4.1 `:209` 行 ∕ `:278` 登记行）。消解窗口 = 「各自下次被触碰的批」——本批 = 该窗口但只登记不拆（值刷新见清单 P3）。

**（4）发现 4——相容表补行（B4 · 文档笔面）+ §5 步 0 前置核并入**

- **B4（VSC 小件迁移族——文档笔面；`docs/batches/2026-09-29-parity-b4-vsc-small.md`）**：落定稿 W3 含 desk 三档文档收正（`:163`：`IPC.md:213` · `UI.md:48` · `PROJECT.md:59 ∕ :698`）；评审残留 R3（`:280`）把 `IPC.md:99`（`notify.*` 键注 = 本批 #578① 同一行）登记为 D3 随动必改项 ⇒ **同三档（`IPC.md` ∕ `UI.md` ∕ `PROJECT.md`）同行为重 = 同档串行：按解冻序先落者先，本批对应笔排后 ∕ 落时按届盘实读收残余**。原 :67 行判（机制面——VSC 取核 ∕ 核件零触 ⇒ 零相抵）不动，本行补文档笔面判。
- **§5 步 0 前置核清单并入**：在飞批落定态清单一并含 **B4 §5 落定态**——步 0 = 「在飞批落定态（`#575` §5 ∕ B3 §5 ∕ A 批 §5 ∕ copy ∕ susp-queue 五档笔落状态 **+ B4 §5**）+ …」。

**（5）发现 5——步 1 ↔ 5a 短暂相抵（标明）**

- 窗口期 = 步 1（CLI 码笔）落定 ~ 步 5a（`AGENT-LOOP-ASYNC-POOL.md` §6.30.10 收正）落定——其间 `:575` 句「现盘 CLI 窗内起算面未包判据」与实际（已包）不符；原因 = B3 实施轮让先（步 5a 条件在册）。
- 处置 = **标明**（无动作变更）；「判据句收正并入步 1」支**不取**——与步 5a 的 B3 让先条件相抵。

**（6）发现 7——§4 报请句素材（#578②③ 可见面 · 供 §4 并入）**

- **① #578②（亮色两值暗化）**：`--warn` `#bf8803 ⇒ #8a6100`（对 `--bg` 2.93⇒5.21 ∕ `--bg-raised` 3.12⇒5.54）· `--mode-plan` `#0598bc ⇒ #047990`（对 `--bg` 3.18⇒4.77 ∕ `--bg-raised` 3.37⇒5.07）；暗色两值零变。可见面 = 亮色下 banner（AUTO ∕ PLAN）与 warn 文本颜色变深、对比达标（无功能变化）。
- **② #578③（删除失败提示）**：会话删除失败时新增可见提示（此前两失败径静默）——zh「会话删除失败（${reason}）」∕ en "Could not delete the session (${reason})"；仅失败面出现（`last-session` 常态不可达——✕ 控件 >1 才显）。
- 性质 = 修复级可见面变化（非机制行为变更）；父侧裁定二支取「并入 §4 报请句素材」支（§4 = 主 agent 笔）。

**档面笔清单（本批 · as-of 2026-09-29 05:1x——findings 1 ∕ 3 ∕ 4 并入）**

> 范围内全部文档笔（执行面 = eng-designer，§5⑤b）；落笔条件 = 解冻 ∕ 让先落定（本轮零档面写）；一笔一 read-back；各笔落笔时按届盘实读收残余。**B4 让先（同三档）**：`IPC.md` ∕ `UI.md` ∕ `PROJECT.md` 与 `docs/batches/2026-09-29-parity-b4-vsc-small.md`（W3 ∕ R3）同行为重 ⇒ 按解冻序先落者先，本批对应笔排后。

| # | 档（落点） | 笔 | 同档并笔 ∕ 让先 ∕ 落排 |
|---|---|---|---|
| P1 | `docs/desktop/design/UI.md`（冻结） | ① `:100 ∕ :193` 两行坐标收正（#578④）+ 变更记录一行；② `:462` 值记录行收正（#578② mode-plan 半——发现 3） | ① 与 #535 冻结子集并笔（同两行）；② 与 #534 改值取并集一笔；B4 同档串行（W3 `UI.md:48`——解冻序先落者先、本笔排后收残余） |
| P2 | `docs/desktop/design/IPC.md`（冻结） | §1 词键注收正（#578①）+ 变更记录一行 | **B4 让先**（R3 `IPC.md:99` = 同一行 ∕ D3 随动必改——解冻序先落者先、本笔排后按届盘收残余） |
| P3 | `docs/desktop/design/PROJECT.md`（冻结） | §4.1 notify 行收正（#578①）+ 变更记录一行 + `:278` 登记值刷新 **400 ⇒ 402**（发现 1，同笔） | B4 同档串行（W3 `PROJECT.md:59 ∕ :698`——解冻序先落者先、本笔排后收残余） |
| P4 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | §6.30.10 判据句收正（#576）+ 变更记录一行 | B3 实施轮落定后一笔（步 5a）；届盘实读收残余 |
| P5 | `docs/cli/design/CLI-DEBT.md:55`（B5 行） | 登记值刷新 **341 ⇒ 371**（发现 1） | 解冻后；让先与发现 4 同判 |

**（7）写后核（D6）**

- read-back：`append` ×2（修正块 ∕ 档面笔清单）+ `status` 均已落盘并逐段回读核（表体 ∕ 尾段 ∕ 状态行齐；无截）。

**档面波落定回执（desktop-micros · 2026-09-29 · eng-designer）**

> 范围 = 本档 §2 档面笔清单 P1–P5（⑤b 冻结三档 + ⑤a §6.30.10 + P5）。口径 = 届盘实读收残余（已由他轮落定者零重复）。禁止面核：产品码 ∕ 其它批记录 ∕ 历史冻结面 = 零触。

**（1）逐项落位表**

| # | 在册笔 | 届盘实读（2026-09-29 11:5x–12:2x） | 处置（file:line） |
|---|---|---|---|
| P1① | UI.md `:100 ∕ :193` 两行坐标（#578④） | 已落——残余族清账批同域笔（`docs/batches/2026-09-29-desktop-residuals-sweep.md` §2 ②）；现读 `:101 ∕ :194`：旧值四字面零命中，新值 `:350` ∕ `:227-230` ∕ `:235-236` ∕ `:433` 全命中（`thincoder-cli/src/tui/render-frame.mjs` 逐处复读同真） | 零重复（零改） |
| P1② | UI.md `:462` 值记录行（#578② mode-plan 半 + #534 并笔） | 仍陈旧（亮色两值为旧值） | **落**：`docs/desktop/design/UI.md:462`——亮色两值 ⇒ `#047990 ∕ #0a7b0a`（同色相暗化 · 对比 ≥4.5:1）· 暗色两值零动；变更记录一行（`:654-655`） |
| P2 | IPC.md §1 词键注（#578①） | 已落——parity-b4（该批记录「文档收正逐处表」#10）；现读 `:100-101`：单键 ∕ 键值归核单源 ∕ 持有面 = 核策略档 | 零残余（零改） |
| P3 | PROJECT.md §4.1 notify 行（#578①）+ `:278`（现 `:281`）值刷新 | 已落——B4（变更记录 `:1170`）；`:281` = **406** = 届盘实读同值（内容行口径复读） | 零残余（零改） |
| P4 | AGENT-LOOP-ASYNC-POOL.md §6.30.10（#576）+ 变更记录一行 | 主句已落（父侧微收正——`:754`）；残余三处 | **落**：`:571`（镜像源 `:219-226 ⇒ :234-240`）· `:576`（闩面指针 ⇒ 核闩内判据）· `:579`（端面镜像 ⇒ 取核后现态）+ 变更记录一行（`:748-749`） |
| P5 | CLI-DEBT.md `:55`（B5 值刷新） | 仍陈旧（341） | **落**：`:55` **341 ⇒ 210**（B1-P3 取核重写后届盘）+ 变更记录一行（`:110`） |
| — | 派单已知事实：`notify.mjs:9` 自载句 | 已落（§5 码面波——「设计档收正归设计面轮」零命中） | 产品码面零触（非本域）· 核毕零失效令 |

**（2）读数（`node scripts/doc-check.mjs` · cwd = `thincoder/`）**

- 前（开工刻）：悬空 **133** ∕ 行宽 **41**。后（落毕）：悬空 **133** ∕ 行宽 **41**——净 Δ0。
- 中间读数（首轮落笔后）= 134 ∕ 42（本笔自引入两处：UI 变更记录行 341 字符 ∕ 变更记录行 1 悬空）——两处均自清（分行 ≤300 ∕ 旧坐标去全形锚）；终读数即上。
- 闸态存量（悬空 133 ∕ 行宽 41）= 既有在册项，非本波。

**（3）findings（逐条）**

1. **只报（零触）· PROJECT.md §4.2 两处同族陈旧**（桌面空闲唤醒批块）：`:483`（notify.mjs 行「— ⇒ **47**」+「提示面策略」）· `:494`（「`notify.*` **两键** = **主进程** notify.mjs（已落 · 实读 **47**）**自持**」）——届盘真值 = 11 行 re-export ∕ 单键 ∕ 核件持有。归属 = parity-b4 的 D3 ∕ R6 随动面（其 §4.1 已收、§4.2 未及）；超本批 §9 边界（「#578① 只及该注面两处」）⇒ 未改，供父侧裁。
2. **只报（零触）· CLI-DEBT 表 A 读数面**：A12 `src/tui/render-frame.mjs` **423** vs 届盘实读 **434**（内容行）——同表刷新面（B5 已刷），未改。
3. **只报（零触）· AGENT-LOOP-ASYNC-POOL.md `:466` 桌面块计数**：「`timer-watch.mjs`（已落 · 实读 **79**）」vs 届盘实读 **76**（`docs/desktop/design/PROJECT.md:159` 记 **76** 为真）——§6.30.11 桌面块（非本笔 §6.30.10）⇒ 未改，供父侧裁。
4. **P4 依据披露**：`:571` 新值 = 届盘实读（核件消化支 catch 块现位）；`:576` 改「核闩内判据」= 承 §6.30.16「实施后重锚清单①」（`:738`——清单行未动，归 B3 面）+ CLI `timer-watch.mjs` 档头自述（「零自持闩 ∕ 零判据副本」）；`:579` 现态句沿 §6.30.11 同式（「容纳逻辑住核 `startSuspension` 等待面」）。`notify.mjs:9` 残留句（「原『词键持有面 = 主进程自持』句随上提改归属（核件持有）」）= 产品码注释面（非本域）——复核为历史回溯句、零失效工作令。

**（4）写后核（D6）**

- 逐处读回：UI.md `:462 ∕ :654-655` · CLI-DEBT `:55 ∕ :110` · AGENT-LOOP `:571 ∕ :576 ∕ :579 ∕ :748-749`（edit 回执 + 复查）；`:462` 旧值两字面全档零命中；§6.30.10 旧坐标三处正文全退场（记录面留档除外）。
- 本轮零产品码 ∕ 零其它批记录 ∕ 零历史冻结面 ∕ 零测试件（纯档面笔）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

审阅对象 = §2 设计轮交付（本档全档实读）；范围仅本档。无项目标准档 ∕ 无文档地图（上下文未声明）⇒ 方法学合规与文档归属按 AGENTS.md + 本档自身在册约定判；台账 #576 ∕ #578 原文不可读（无 ledger 面）⇒ 覆盖度按 §1.1 射程核对，外档坐标按现盘实读抽验（file:line 逐处）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations | 🟡 | 受影响文件表（本档 :69 ∕ :73）触及两个越 300 档——CLI `thincoder-cli/src/tui/suspension-drive.mjs` **371**（⇒≈373）与 `thincoder-desktop/renderer/mount-sessions.mjs` **400**（⇒≈402）——两行均无档位审视 ∕ 拆分结论 ∕ 债务簿指针；在册口径要求被触碰的 >300 档给结论或「只登记不拆」（先例 = `2026-09-27-timer-wake.md:112` 🟡；登记行 = `CLI-DEBT.md:55` B5（suspension-drive **341**——现盘 **371**，值陈旧）· `PROJECT.md:278`（mount-sessions **400**，消解窗口 = 「各自下次被触碰的批」= 本批）） | 为两档各补一行档位结论（「本批只登记不拆」+ 拆分候选面），并刷新两处登记值（B5 341 ⇒ 371；`PROJECT.md:278` 400 ⇒ 402——与 §4.1 同笔） |
| 2 | Clarity（证据面） | 🟡 | #578① 证据列（本档 :36）与 §8②（:117）断言核件 `core/notify-policy.mjs:12-13` 自载「设计档收正归设计面轮」——现盘该档零命中（该句字面仅存 `thincoder-desktop/src/main/file-links.mjs:5` 与桌面 `notify.mjs:9`），且该档现读 **51** 行（本档 :76 记 56）⇒ 被点名的「悬挂句」不存在，只报项落空（该行实际三处落点 —— `notify.mjs:9` · `IPC.md:99-100` · `PROJECT.md:158` —— 均已在盘核验 ✓） | 按现盘复核该句：命中则改引真坐标，未命中则删本项并收正 :36 ∕ :76 ∕ :117 的引句与读数 |
| 3 | Document ownership（档面） | 🟡 | #578② 改亮色 `--mode-plan` ∕ `--warn` 值，而记该值的在册行 `UI.md:462`（「值 = VSC 终端 ANSI 同码默认（`--mode-plan` = `#0598bc` ∕ `#11a8cd` · `--mode-advisor` = `#14ce14` ∕ `#23d18b`）」）既不在受影响文件表（本档 :72 ∕ :79 只记 `theme.css:14-15` 与 `UI.md:100 ∕ :193`），也未入 §8 只报——本批已写 `UI.md`（§5⑤b）⇒ 同档值面与值记录相抵 | 把 `UI.md:462` 值记录行登记进本批档面笔（与 §5⑤b 同笔；该行另一半随 #534 改值 ⇒ 取并集一笔），或在 §2 判据句旁标只报指针 |
| 4 | Scope（协调项 · R5） | 🟡 | §3 对 B4 判「零相抵」（本档 :62），但 B4 落定稿 W3 含 desk 三档文档收正（`2026-09-29-parity-b4-vsc-small.md:163`：`IPC.md:213` · `UI.md:48` · `PROJECT.md:59 ∕ :698`），其评审残留 R3（同档 :280）另把 `IPC.md:99`（`notify.*` 键注 —— 本批 #578① 同一行）登记为 D3 随动必改项；本批 §5 步 0 前置核清单（:85）未含 B4 ⇒ 同档（同行为重）串行关系未在册 | 在 §3 相容性表补 B4 行（同三档 ⇒ 同档串行：`IPC.md` §1 同行按解冻序让先 ∕ 排后），并把 B4 §5 落定态并入 §5 步 0 前置核清单 |
| 5 | Doc-state（跨文件滞后） | 🔵 | #576 码面先在步 1 落（:86），而 `AGENT-LOOP-ASYNC-POOL.md:575` 判据句「**现盘 CLI 窗内起算面未包判据**」要到步 5a（:90）才收正——其间该句与实际不符（B3 串行所致，已在册） | 在步 1 ∕ 步 5a 之间标明该短暂相抵（或把判据句收正并入步 1 收尾笔） |
| 6 | Doc hygiene（§1 面） | 🔵 | §1 仍留模板占位行（:7）与占位状态括号（:6「🔄 进行中（…）」）；§1.1 射程句的 #576 坐标（:11 `suspension-drive.mjs:298`）为勘误前口径（§0 已收正，§1 面自身无指针） | 占位行按需替换为本批结论行；§1.1 补「坐标勘误见 §0」指针（append-only ⇒ 新增一行收正） |
| 7 | Requirements（可见面） | 🔵 | 本批三项触用户可见面：#576（已入 §4 报请句，:52）、#578②（状态行亮色两值暗化）、#578③（新增删除失败 toast）；后两项未在 §4 报请句出现（§1.1 口径只写「行为变更项须写明用户可见面变化」） | 若该口径覆盖全部可见面变化，把两处（亮色对比变化 ∕ 新失败提示文案）并入 §4 报请句；否则在 §2 注明二者不属「行为变更」口径 |

**正向核对（与现盘一致，逐处实读）**：CLI `tui/suspension-drive.mjs:298` 直取 `pendingTimerDeadline`（`timerWakeEnabled` 零导入 ∕ 调用点计 1）✓ · `waitForSettleOrWake:123` `deadline != null` 零注册 ⇒ 修法可落 ✓ · 桌面 `src/main/suspension-drive.mjs:60` 已包判据 ∕ 现读 279 ✓ · 桌面无 `:298` ✓ · `theme.css:14-15` 旧值与暗色 `:50-51` 零动面 ✓、新值 WCAG 复算 5.21 ∕ 5.54 ∕ 4.77 ∕ 5.07 与 hue 42.2° ∕ 189.9° 全复现 ✓ · 消费面 `chrome.css:421-424` · `core.css:144/:280` · `chat.css:253` · `chat-fixes.css:41` ✓ · `mount-sessions.mjs:378-380 ∕ :385-387` 两失败径 + `:335/:346` 先例 ✓ · `i18n-views.mjs` ⑤ 组 en `:74-76` ∕ zh `:195-197` ✓ · `render-frame.mjs` `:350 ∕ :227-230 ∕ :235-236 ∕ :433`（434 行）✓ · `UI.md:100 ∕ :193` 旧值 ∕ `:105 ∕ :198`（#535 面）✓ · `IPC.md:100` · `PROJECT.md:158 ∕ :73` ✓ · `notify.mjs:9` 悬挂句 ✓ · `AGENT-LOOP-ASYNC-POOL.md:575`「关的射程」句 + `tech-debt-closeout.md:892` 疑点句 ✓ · B3 零触清单含 CLI `suspension-drive.mjs` ✓ · `#575`＝residuals-sweep（L1 `theme.css:16` ∕ L6 `mount-sessions ∕ i18n-views`）✓ · A 批 279 ∕ +8~12 且不触 timerFace ✓ · VSC `suspension.mjs:376` 同形缺陷在盘 ✓。
**未复现（unverified）**：台账 #576 ∕ #578 原文（无 ledger 面）；`node scripts/doc-check.mjs` 读数；「本轮零产品码 ∕ 零设计档笔」claim（无 git 面可核）。

计数：🔴 0 · 🟡 4 · 🔵 3 = 7 条
VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 2026-09-29 05:2x）

- **依据** = 十批全修令 + 排空授权执行口径（三条件：评审 pass ∧ 修正落地核验 ∧ token 在位）——评审 **#94 pass**（0🔴 · 4🟡 ∕ 3🔵）；修正轮 **#100 落地已核**（7 号：6 已办 + 1 父侧笔零触）；token 在位。
- **可见面并入**（评审发现 7 素材）：① `#578②` 状态行亮色两值暗化（`--warn ⇒ #8a6100`〔5.21:1 ∕ 5.54:1〕· `--mode-plan ⇒ #047990`〔4.77:1 ∕ 5.07:1〕——暗色两值零动）；② `#578③` `deleteSession` 失败径新增 toast（键 `session.deleteFailed`）。二者随实施落（用户可见；非行为语义变更）。
- **行为变更报请**（在册）：`#576` 关态（`agent.timerWake:false`）窗内零自动唤醒；默认态零变。
- **实施 = 三波**：码面（#576 + #578①③ + 值）**即发** → 档面波（冻结解冻 ∕ B3 后；含 `UI.md:462` 与 #534 并集一笔）→ 收尾（批内件 + 真机面）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（码面波（#576 ∕ #578①③②）落位 · 5/5 腿绿 · 审计 ∕ 评审 pass · fix round 0 · 2026-09-29）



### 码面波实施记录（desktop-micros · 2026-09-29 · eng-coder）

**范围** = §4「实施 = 三波」之第一波（码面）：#576 + #578①（码面笔）+ #578② + #578③（码面 + 词表）。
**不在本波**：档面笔 P1–P5（冻结 ∕ 让先 gated，eng-designer）· ⑤a `AGENT-LOOP-ASYNC-POOL.md` §6.30.10 判据句收正 · 真机面（J-2 关态 ∕ #578② 亮色目视 ∕ #578③ 失败面 —— 父侧）。

**（1）逐项改动表（file:line = 落定后现盘；五处落位全读回）**

| # | 文件:行 | 改动 | Δ |
|---|---|---|---|
| #576 | `thincoder-cli/src/tui/suspension-drive.mjs:17` | 导入面增 `timerWakeEnabled`（自 `./timer-watch.mjs` —— 核 re-export 名恒在） | ±0 |
| #576 | `thincoder-cli/src/tui/suspension-drive.mjs:164-166` | 注释续注（§6.30.10 关的射程）+ deadline 实参改判据包形 `() => (timerWakeEnabled(agent) ? pendingTimerDeadline(agent) : null)`（与桌面 `timerFaceOf` 同形同源） | +1 |
| #578① | `thincoder-desktop/src/main/notify.mjs:9` | 悬挂括注「设计档收正归设计面轮」消解（余句 = 核件持有） | ±0 |
| #578② | `thincoder-desktop/renderer/theme.css:14-15` | `--warn: #bf8803 ⇒ #8a6100` · `--mode-plan: #0598bc ⇒ #047990`；两注释按 #534 形收正（亮色暗化 + 色相源 + 旧⇒新对比 + 暗色零动句） | ±0 |
| #578③ | `thincoder-desktop/renderer/mount-sessions.mjs:384 ∕ :392` | `deleteSession` 两失败径各补 `showToast(t("session.deleteFailed", …))`（回执拒 ∕ 抛）；函注 `:373-374` ∕ 档头纪律句 `:27` 枚举随改 | +3 |
| #578③ | `thincoder-desktop/renderer/i18n-views.mjs:80 ∕ :203` | 两语 +1 键（en `Could not delete the session (${reason})` ∕ zh「会话删除失败（${reason}）」）+ 组注「三键 ⇒ 四键」×2 + 档头 ⑤ 组句增键行 | +3 |
| 批内件 | `.thincoder/tmp/2026-09-29-desktop-micros.test.mjs`（候选终位 = `docs/batches/2026-09-29-desktop-micros.test.mjs`） | 腿三 L-A ∕ L-B ∕ L-C（断言 5 条）；#545 立即形（待父侧 copy 收位） | 新增 |

**（2）届盘实读 vs 设计表（让先漂移）**

| 文件 | 设计读（⇒估）· 落点 | 届盘实读（⇒本波后）· 落点 | 漂移因 |
|---|---|---|---|
| CLI `tui/suspension-drive.mjs` | 371（⇒≈373）· `:297-298` | **210 ⇒ 211** · `:164-166` | B1-P3（取核驱动装配）整档重写已落 |
| `renderer/mount-sessions.mjs` | 400（⇒≈402）· `:378-380 ∕ :385-387` | **404 ⇒ 407** · `:382-385 ∕ :390-393` | #575 L6（#556 renameFailed 两径 + 档头句）已落 |
| `renderer/i18n-views.mjs` | 282（Δ≈+4）· 组注「三键」 | **286 ⇒ 289**（Δ+3）· 组注「四键」 | 同上（#575 L6 落定形已载） |
| `renderer/theme.css` | 89 · 让先 #575 L1 在飞 | **89**（Δ0）—— `:14-15` 未被触碰（#575 落点 = `:16` 已在盘）⇒ 直接落，零适配 | — |
| `src/main/notify.mjs` | 11 | **11**（Δ0）—— B4 D3 已改 3-6 行；核件持有面未变 ⇒ 按本设计落 | B4 已落（复核句 satisfied） |

**（3）决策透明表（适配 ∕ 随改 ∕ 披露 ∕ 只报）**

| 类 | 项 | 处置 | 依据 |
|---|---|---|---|
| 适配 | #578③ 回执径 reason 表达式 | 取届盘同族落定形 `reasonOf(receipt)`（同档 `:311` openFailed ∕ `:359` renameFailed 一致；`reasonOf` = 本档 toast 插值归一，`:274`）—— 弃设计字面 `String(receipt?.reason ?? "")` | 同修法句「沿 openFailed 形」+ 让先届盘适配；`session:delete` 核拒二值闭集（`last-session` ∕ `slot-missing`）恒非空串 ⇒ 两式行为等价，仅畸形回执回落值不同（`unknown` vs 空串） |
| 随改 | `mount-sessions.mjs:27` 档头纪律句 | 增「**#578③ 增删除失败两径**（回执拒 ∕ 抛）」 | #556 先例（函注 ∕ 档头句随改）；不随改即成失效枚举（D3 计数与列表同变） |
| 随改 | `mount-sessions.mjs:373-374` `deleteSession` 函注 | 增失败面可见提示句（`ok:false` ∕ 抛两径） | 同上 |
| 披露 | theme.css 两注释行 = 313 ∕ 361 字符 | 保留单行同形 + 原注全量引证（未折行） | 行宽机检仅扫 `.md` 源域；同族 `chrome.css:399` 既有 453 字符行；父侧如需 ≤300 可另笔收 |
| 披露 | CLI 落点 ∕ 行数漂移（371 ∕ `:298` ⇒ 210 ∕ `:166`） | 按届盘落（同点同语义） | 本批 §2 §0 已认「届盘实读为准」（B1-P3 重写该档） |
| 只报 | `src/main/file-links.mjs:5` 载同款悬挂括注（「设计档收正归设计面轮」） | 零触 | 不在本批文件表 |
| 只报 | `renderer/i18n.mjs:44-53` 键数链落后 2（届盘实读 `VIEWS_DICT` **108** ∕ `HOST_DICT` **271** vs 链句 106 ∕ 269；1 = #556 已由 #575 登记、1 = 本批 #578③） | 零收改（承接项 = #544） | #575 同判（#575 §5 发现 3：登记 · 零收改 · `i18n.mjs` 非本批写域） |

**（4）验证命令与读数（2026-09-29 06:1x–06:3x）**

- `node --test .thincoder/tmp/2026-09-29-desktop-micros.test.mjs` ⇒ **5/5 pass**（L-A ×2 ∕ L-B ∕ L-C ×2 · fail 0）。
- L-B WCAG 复算读数：`--warn #8a6100` 对 `#f7f8fa` = **5.21** ∕ `#ffffff` = **5.54**；`--mode-plan #047990` 对 `#f7f8fa` = **4.77** ∕ `#ffffff` = **5.07**（两值两底 ≥4.5 ✓）；暗色块两值 = `#cca700` ∕ `#11a8cd`（零动 ✓）。
- J-1 读数：`pendingTimerDeadline` 调用点计 = 1 ∧ 判据包形命中 ∧ 旧裸取形退场 ∧ 导入面 `timerWakeEnabled`（`timer-watch.mjs` 端转口在场）；CLI 模块动态导入 OK（导出面六名 = `allPendingEntries` ∕ `pendingFamiliesNonEmpty` ∕ `pendingFamilyCount` ∕ `poolCounts` ∕ `poolLive` ∕ `suspensionSession`）。
- J-5 读数：`mount-sessions.mjs` 该键 2 处 ∕ `i18n-views.mjs` 该键 2 处（两语值逐字命中）；先例对拍 = openFailed 4 处 ∕ renameFailed 2 处。
- J-3 码面读数：`notify.mjs` 内「设计档收正归设计面轮」= **0 命中**。
- 语法 ∕ 结构门：五档 `node --check` 全过（edit 回执）；theme.css 花括号 6/6 ∕ 注释 11/11 配平；i18n 键数实读 `VIEWS_DICT` 108 ∕ `HOST_DICT` 271（两语相等）。
- `node scripts/doc-check.mjs` 复跑：悬空 **223** ∕ 行宽 **39**（闸态存量为在册；本波零 `.md` 笔 ⇒ 净增判据不适用；终读数以父侧收口为准）。
- **未跑仓级套件**（repo suite = 发布门 · 父侧收口一次跑）。

**（5）写后核（D6）**：五处落位逐处读回（CLI `:17` ∕ `:164-166` · notify `:9` · theme `:14-15`（暗色 `:50-51` 零动复读）· mount-sessions `:384 ∕ :392` + 两注释 · i18n `:80 ∕ :203` + 组注 ∕ 档头句）；本 append 落盘后回读核。

**收敛块（审计 + 代码评审轮次与终态 · desktop-micros 码面波 · eng-coder · 2026-09-29）**

- **内部偏离审计（explore · 只读 · 轮次 1 即收敛）**：四类偏差（部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 越表改动）**零命中**；J-1 ∕ J-3（码面）∕ J-4 ∕ J-5 逐条静态复核全真；WCAG 独立复算与腿 L-B 逐字一致（5.21 ∕ 5.54 ∕ 4.77 ∕ 5.07）；禁区核（桌面 `src/main/suspension-drive.mjs` ∕ VSC ∕ 核件 ∕ `.md`）零触。审计附记 1 条：§5(4) 时段标注「06:1x–06:3x」末端未到（审计刻 06:23）——**更正**：实测时段 = 06:1x–06:2x（本 append 前刻 06:25），以本行为准（append-only）。
- **代码评审（advisor · code · 轮次 1 即收敛）**：findings 6 条 = 🟡 3（皆非阻塞）+ 🔵 3；**无 🔴 ∕ 无 must-fix**。逐条处置：① 档位咨询线（`mount-sessions.mjs` >300 行）= 在册债（设计修正轮(3) 裁「本批只登记不拆」）→ 零动作；② `UI.md` 值记录滞后（gated P1）= 报告面 → 零动作（父侧档面波收）；③ 批内件终位缺件（#545 立即形）= 父侧 §6 copy 收位 → 零动作；④ `i18n.mjs` 键链滞后 2 = 承接 #544（非本批写域）→ 零动作；⑤ 回执径 `reasonOf(receipt)` 适配 = 评审复核等价（核拒二值闭集恒非空串）→ 零动作；⑥ theme.css 长注释行 = 可选样式 → 维持（#534 单行同形）。
- **fix round = 0**（无 must-fix ⇒ 零修正轮）；**终态 = clean**（审计四类零偏差 · 评审 pass · 批内件 5/5 绿 · 语法 ∕ 结构门过 · 记录面更正 1 条已落）。
- **评审引证核验附记**：评审报告 5 条引证中 4 条因**路径形态**（相对路径 ∕ 记录内 `\teamcode\...` 形态）不可机械核——相关事实已由本波亲读 + 批内件断言 + 审计独立复核三向佐证；引证以现盘实读为准。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：① **码面波**（#106——五腿 5/5 绿 · 内部偏离审计四类零命中 · 代码评审 pass（🟡3 ∕ 🔵3 全处置 = 零动作）· fix round 0 · 终态 clean）；② **档面波**（#131——7 笔落：P1② `UI.md` 亮色两值 ∕ P4 镜像源重锚三处 ∕ P5 `CLI-DEBT.md` 读数刷新；3 条只报 → 父侧直执行修 4 处：`PROJECT.md:483/:494` · `AGENT-LOOP-ASYNC-POOL.md:466` · `CLI-DEBT.md:42`——标记父侧直执行 · 可 revert）。

**留册（不悬空）**：`i18n.mjs:23` 注释族陈旧（产品码面——随下一码面轮顺笔）。

**读数**：`node scripts/doc-check.mjs` = 悬空 **133** ∕ 行宽 **41**（档面波净 Δ0——首轮中间读数 134 ∕ 42 为自引入两处、已自清）。

**结算面（D7）**：#578 → **已核销**（四件全落：notify 收正句 ∕ 亮色三值 ∕ deleteSession 失败径 ∕ UI.md 短引文）；#534 ∕ #556 等先期已核销（幂等确认）。
**真机面**：随 #592 汇总同席。
**状态行**：已收口 2026-09-29。
