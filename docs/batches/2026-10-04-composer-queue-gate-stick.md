# 2026-10-04 · 排队守卫假满队（_qLocal 粘住）修复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 12:56 报「主会话处理中——排队已满 8 条…不让再发指令；感觉是不是队列消费后没清理」+ 侦察 #29 实证（根因 = `thincoder-render-core/composer/panel.mjs` `_qLocal` 只增不减、收敛条件失效；宿主队列与渲染镜像均干净；VSC 同病 ∥ CLI 无）。
> 台账 = #911（tech_todo——升级为批）。前情 = 无（独立批——侦察 #29 实证在册）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 13:0x · 主 agent）**：**来源** = 用户 12:56 报（「排队已满 8 条…不让再发指令」）+ 侦察 #29 实证（根因 = `thincoder-render-core/composer/panel.mjs` 影子计数器 `_qLocal` 只增不减 ∥ 收敛条件「值变才清」失效——实现偏离设计句；宿主队列与镜像均干净；VSC 同病 ∥ CLI 无）。**条目** = 修复「排队守卫假满队」（把实现拉回设计句：「本地先行自增 + **host 快照收敛**」——设计句权威，方向无待裁）。**授权口径** = 全链（设计 → 评审 → 批准 → 实施——用户 12:18「都自动跑吧」授权在效）。**设计轮已派**（eng-designer——首轮）。**边界** = 禁动宿主队列（干净）∥ 禁动 CLI ∥ 保住同 tick 防连击意图 ∥ 三端同步（render-core ∥ 桌面渲染面 ∥ VSC 核件副本 ∥ 物化拷贝）∥ 需求档零触（主 agent 域）。**止血（在册）**：重载窗口/重启应用即复位。

- **改判登记（2026-10-04 13:2x · 主 agent——评审 #34 处置）**：用户 13:09 直裁 ⇒ 修复形 = **影子计数器退役**（满队门 = 宿主镜像计数如实直读；同 tick 空窗以宿主权威兜底）——开批登记条目行所书「本地先行自增 + host 快照收敛」方向**以本登记为准退场**；设计轮 §2 已按直裁改判（F1–F5 择由在档）。评审 #34 = **pass**（🔴0 ∥ 🟡3 ∥ 🔵5 + 域外注记 1——逐条处置见 §4）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮（用户 13:09 直裁改判 · F1–F5 逐项裁断）+ 评审 #34 修正轮（全采纳——修正块 + 自检追记在档）· 机检复跑 OK 2026-10-04）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 本批任务与设计（initial 轮 · eng-designer · 2026-10-04）

**本条（覆盖）**：修复「排队守卫假满队（`_qLocal` 粘住）」——用户 12:56 报（「排队已满 8 条…不让再发指令」）；侦察 #29 实证根因 = 核件影子计数器 `_qLocal` 只增不减 ∥ 收敛条件「值变才清」失效（`thincoder-render-core/composer/panel.mjs:292-330`）。**用户 13:09 直裁改判**（原话「输入这个为啥要用影子计数器啊！直接用队列长度不可以吗？搞这种东西，不是故意造问题吗？」）——修复形以此为准：**满队门 = 宿主快照计数（如实单读；同 tick 以宿主权威兜底）**；影子计数器（`_qLocal` ∥ `_qHostSeen` ∥ 「值变才清」逻辑）一并退役；任务书原「保住同 tick 防连击意图」句**作废**。台账 #911。**三链同源**：本条 ↔ 设计档（`UI.md` ∥ `WEBVIEW-INPUT.md`）↔ 需求面（缺环——上抛①）。

**条目外（不在本批）**：宿主队列 ∥ consuming 径（干净——零触）∥ CLI（无病——零触）∥ 需求档（主 agent 域）∥ 挂起窗残值早退径疑似漏点（登记另批——上抛②）。

**机制（修复形）**：
- 端侧满队门 = `state.queue()?.count ?? 0` **如实单读**（`queueCount()` 收为单读；≥ `QUEUED_MAX_ITEMS`(8) ⇒ 不出泡 / 不清框 + toast `input.slotFull`——`panel.mjs:326-329` 现行守卫面零改）。
- **删面**（`panel.mjs:292-330` 内逐处）：`let _qHostSeen` / `let _qLocal` / 值变重置行 / 提交径 `_qLocal += 1` 退役；注释面同步收正（`:288-291` 块 ∥ `:323-325` 邻注 ∥ `:330` 行随删）。
- **同 tick 空窗 = 以宿主权威兜底**（端侧零影子态）：同 tick 二连 Enter 双双过端门（镜像未及更新）⇒ 宿主满 8 门拒第二条 ⇒ 回执 `{ ok:false, reason:"queue-full" }` ⇒ **端侧可见形已在场（实读得证——用户裁定③ = 「有 ⇒ 在档记录」，零新增最小项）**：桌面 = B21 失败行（`composer-wire.mjs:165` `recordFailure("queuedUserMessage", …)` → `failedNotice` 产 `[data-notice="send-failed"]` 行——`composer-sync.mjs:78-85`）+ 稿留输入历史（`↑`；`panel.mjs:331-332` 提交即入历史）；VSC = `showWarningMessage` 提示 + `pushBusyQueued` 重推实况（`panel-messages.mjs:166-169`）。零丢失、零静默。
- **设计句更新（同笔收正 · 实读落点）**：派单引 `COMPOSER.md` KD-40 句——**实读 KD-40 全文（`:18`）不含影子计数器句**（COMPOSER.md 亦无）；对位句实居 ① `docs/desktop/design/UI.md:28`（「镜像计数（宿主快照 + 本地先行增量）」）② `docs/vsc/design/WEBVIEW-INPUT.md:31`（「于提交受理时本地先行自增…host 推送权威收敛」）∥ `:53`（「本地先行置位」）——已逐处收正（见受影响表）；`2026-09-24` 旧批档 = 记录面零触（历史句留档）。

**择由（F1–F5 逐项 · 用户 13:09 直裁后）**：
- **F1（推送即收敛——版本号 / 到达计数）**：不取——影子计数器退役 ⇒ 无物可收敛（版本信号面 = 跨端 `queue()` 增字段 + 镜像写入点改动，随影子态一并退场）。
- **F2（回执即收敛）**：不取——同由（端门 = 直读；回执面只承担可见形兜底，不改判据）。
- **F3（删本地先行自增）**：**取**（= 本批形）——**不标「违设计」**：设计句以用户直裁为准更新（上句）；同 tick 空窗以宿主权威兜底。
- **F4（回合翻转复位）**：不取——止血不完整（同回合内节奏仍漂移）；随影子计数器退役消解。
- **F5（宿主侧修）**：不取——宿主零改（满 8 门 ∥ 拒收回执既有且干净——本批仅消费其回执可见形）；修复落点违设计（判据 = 端侧镜像读面）。
- **窄窗语义（留存披露）**：端门与宿主判决间一拍空窗存在（镜像滞后 ⇒ 端放行 / 宿主拒收）——由宿主拒收径可见形兜底；宿主权威 = 唯一守卫权威即用户裁定的守卫语义。

**落点**：
- 核件（唯一源码改点）：`thincoder-render-core/composer/panel.mjs`（`queueCount()` 收为单读 + 注释收正）。
- 三端同步面（逐处点名 · 实测）：① 核件源 = 上档；② `thincoder-vscode/node_modules/@thincoder/render-core` = **Junction**（实读 `LinkType: Junction` → `thincoder-render-core`）⇒ 源改即达；打包 = `vsce package --follow-symlinks`（`thincoder-vscode/package.json:142`）；③ `thincoder-desktop/node_modules/@thincoder/render-core` = **Junction**（实测同）⇒ 源改即达；打包期物化 = `thincoder-desktop/scripts/materialize-deps.mjs:22-25`（源树直拷）⇒ 重打包自动取新。**运行期用户所见 = 旧 asar ⇒ 修复只在新包生效（重打包 = 生效前提）**。
- 零改面（实读核对）：桌面渲染面（`composer-sync.mjs:135-138` provider `{count}` 如实镜面 ∥ `composer-wire.mjs` 回执径 ∥ `queue.mjs` / `events-slices.mjs` / `page-read.mjs`）∥ VSC webview（`input.js:67` ∥ `queued-mark.js` ∥ `state.js`）∥ 宿主（`queued-input.mjs` / `turn-input.mjs` / `turn-chain.mjs` / `window-queue.mjs` / `suspension-drive.mjs`）∥ CLI。⇒ **核件旧形 provider（`{count}`）即新语义所需——两端渲染接线零改**。

**受影响文件表（as-of 2026-10-04 · 行数 = 总行）**：

| 档 | 文件 | as-of | 动作 | 预计 |
|---|---|---|---|---|
| 核·源 | `thincoder-render-core/composer/panel.mjs` | **490** | `queueCount()` 收为单读（删两变量 ∥ 值变重置 ∥ 提交自增；三处注释收正） | **≈486**（−4） |
| 档·VSC | `docs/vsc/design/WEBVIEW-INPUT.md` | **257** | 细则① 判据源句收正 + 断行 1 处 + 细则⑦ 标记句收正 + 变更记录 +1 | **259**（实读落） |
| 档·桌面 | `docs/desktop/design/UI.md` | **810** | 输入区行满队面① 收正（判据句 + 陈旧坐标去号）+ 变更记录 +1 | **811**（实读落） |
| 测·批内件 | `docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs`（拟新增） | — | 批档本地单元件（T1–T4——先红后绿；随批留存 · 不入仓套件） | **≈170–200** |

**用例设计（批内件 · 先红后绿）**：
- 车具（实读得证）：`@happy-dom/global-registrator` **在盘**（`thincoder-vscode/node_modules/@happy-dom/**`；devDep 声明 = `thincoder-vscode/package.json:152`）——`GlobalRegistrator.register()` 起真 DOM；核件面板直引（`thincoder-render-core/composer/panel.mjs`；平路径——无 `/rc/` 钩子需求）。复跑（cwd = 仓库根）：`node --test docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs`。
- **T1（红→绿：假满队根径）**：provider `queue: () => ({ count: 0 })` 恒零；9 轮「清框 → 提交」。现行为（红）= 第 9 轮起拒（toast）∧ `post` 零调用；修复后（绿）= 9 轮全受理（`post("queuedUserMessage")` 各恰 1 次；零 toast）。
- **T2（绿锁：镜像 8 ⇒ 拒发）**：provider 恒 8 ⇒ 提交 ⇒ `post` 零调用 ∧ 输入框文本保留 ∧ toast 文本 = 核 `t("input.slotFull")`（注册面喂词——逐字断言）。
- **T3（绿锁：宿主计数如实读）**：provider 序列 {0→受理；3→受理；7→受理；8→拒}（同一面板多轮）——端门读值 = provider 即读即用（零累计）。
- **T4（绿锁：宿主 `queue-full` 可见面 · 桌面）**：wire `sendQueued` 收 `{ ok:false, reason:"queue-full" }` ⇒ `failure()` = `{ reason:"queue-full", kind:null }`（行源在场）；渲染形源面锁 = `[data-notice="send-failed"]`（先例 = `docs/batches/2026-09-29-desktop-carryover-c3.test.mjs` M4/M5）。
- 负控：T1 在修复前必须红（实施轮以「红 → 绿」两读入 §5）。

**验收对照**：

| # | 条目（来源） | 判据（机检 / 读回） |
|---|---|---|
| 1 | 用户 12:56 报「假满队」 | T1（9 轮全受理）+ 真机复核（父侧——忙态连发 9 条） |
| 2 | 用户 13:09 直裁「直接用队列长度」 | T3（如实读）+ 代码读回（`queueCount()` 单读 ∥ 零影子变量） |
| 3 | 宿主 `queue-full` 端侧可见面 | 实读在档（桌面失败行链 ∥ VSC `showWarningMessage` + 重推）+ T4 |
| 4 | 三端同步 ∥ 副本/物化面 | 两 Junction 实测 ∥ `materialize-deps.mjs` 重打包取新（披露） |
| 5 | 设计档收正 | 逐处读回（`UI.md:28/:810` ∥ `WEBVIEW-INPUT.md:31-32/:53/:258`） |

**关键决策（本批）**：**KD-QG1（满队门 = 宿主快照计数如实单读；同 tick 以宿主权威兜底）**——用户 2026-10-04 13:09 直裁；被否 = 本地先行自增（粘住根因）∥ F1 版本收敛 ∥ F2 回执收敛 ∥ F4 回合复位 ∥ F5 宿主侧修。**KD-QG2（宿主拒收回执 = 同 tick 兜底；端侧可见形零新增）**——桌面 ∥ VSC 两径可见形实读得证。决策单源落点 = 本轮收正的 `UI.md` §1 输入区行 ∥ `WEBVIEW-INPUT.md` §1 C-B2-6 细则①。

**边界（不做）**：宿主队列 ∥ consuming 径 ∥ CLI ∥ 需求档 ∥ 挂起窗早退径（另批）∥ 词键零增 ∥ 协议零变（`busyQueued` / `ev:queue` 载荷零改）∥ 仓套件不写 ∕ 不改 ∕ 不跑（全清令——批内件随批留存）。

**机检读数（设计轮自跑 as-of 2026-10-04）**：`node scripts/doc-check.mjs`（cwd = 仓库根）⇒ **锚 OK（0 悬空——扫描 177 档）∥ 行宽 OK（0 条 >300，区带豁免在效）∥ 行数面 = 12 条差异（报告态——存量，含 `composer-wire.mjs` 表 276 ⇒ 实读 281 等，非本批面）∥ exit 0**。首跑曾因本席改写句 1 行超宽（`WEBVIEW-INPUT.md:31` = 323 字符）FAIL ⇒ 当场断行收正（复跑 OK）。

**上抛项（主 agent）**：
1. **需求档面缺环（检查结论——非阻塞）**：全需求档实扫（`docs/desktop/requirements/**` ∥ `docs/vsc/requirements/**`）零「满队门 / 第 9 条拒 / `input.slotFull`」句——三链在需求面缺环；D25（`docs/desktop/requirements/COMPOSER.md:14`）载队列机制句但不含满队判据。建议主 agent 裁：是否在 D25 ∥ VSC 需求卷补「满 8 拒 + 提示 + 文本保留」句（本席无需求档笔）。
2. **旁项登记（另批）**：挂起窗残值续发早退径疑似「已倾出条目零帧」（`suspension-drive.mjs` `resumeResidual` tombstone ∕ `!stillHeld` 两 break 径 ∥ `:245` 中止清队径——`window-queue.mjs:77` `drain` 零帧实读在场；可达性未实证；禁动区）⇒ 建议台账 tech_todo（复现判据 = 窗残值 + 中止/占位摘除时序 + `ev:queue` 帧计数对拍）。
3. **重打包披露**：用户现跑 asar 为旧包——修复只在新包生效。
4. **派单引述修正（披露）**：派单引 `COMPOSER.md` KD-40「本地先行自增 + host 快照收敛」句——实读 KD-40（`:18`）不含该句；对位句实居 `UI.md:28` ∥ `WEBVIEW-INPUT.md:31/:53`（已逐处收正）。
5. **陈旧坐标披露**：`UI.md:28` 内 `panel.mjs:304-306` 已漂移（实读门 = `:326`；修复后 ≈`:322`）——本批去号（函数锚 `send()`），免再生漂移。

### 评审 #34 修正轮（fix · eng-designer · 2026-10-04）

父裁 = **全采纳**（🔴0 ∥ 🟡3 ∥ 🔵5 + 域外注记 1——逐条处置 = §4）。本块 = 修正声明（append——既有行零改；号 = §3 发现表号 ∥ 域外注记；**机制 ∕ 择由零改（F3 形 = 已批准面）· 零新语义**）。

**①（🟡1 · 注释收正清单扩两处 · 零码改）**：
- `thincoder-vscode/webview/state.js:134-135`：残句「提交受理时本地先行自增、host 推送权威收敛」⇒ 改述为现态 **「镜像 = host 快照如实写（端侧零本地增量——提交受理时不改写）」**；单源指针保持（`:135`「机制单源 = `WEBVIEW-INPUT.md` §1 C-B2-6」——随句同向）。
- `thincoder-vscode/src/extension/panel-messages.mjs:150-151`：残句「webview 镜像在提交受理时本地先行自增」⇒ 补因改挂 **「快照幂等 + 镜像滞后窗」**（＝推文须含归位路径之因：快照幂等 ⇒ 入口即推零副作用；镜像滞后窗 ⇒ 早推免挂起期守卫误拒）。
- **§2 零改面清单同拍收正**：`state.js` 自「VSC webview」零改面举**移出**（入上列注释收正清单）；余举不变（`input.js:67` ∥ `queued-mark.js`）。「核件（唯一源码改点）」口径复核：**代码面改点**仍唯一 = `panel.mjs`；注释级触碰 = `panel.mjs`（内含）+ 上两档。

**②（受影响表追加两行 · 注释级 · 行中性）**：

| 档 | 文件 | as-of | 动作 | 预计 |
|---|---|---|---|---|
| VSC·源 | `thincoder-vscode/webview/state.js` | **140** | 注释收正（`:134-135` 改述——零码改） | **140**（±0） |
| VSC·源 | `thincoder-vscode/src/extension/panel-messages.mjs` | **383** | 注释收正（`:150-151` 补因改挂——零码改） | **383**（±0） |

（as-of = read 面总行实读 2026-10-04。）

**③（🔵4 · 用例车具前提）**：T1 ∥ T2 ∥ T3 车具补 `turnState: () => "running"`（进队径判据 = `busyState() === "running"`——`panel.mjs:322`；缺之 ⇒ 走直发径、「先红」负控失据）；用例注一行「**红 = 影子态累计**」。

**④（🔵5 · 档头注记入收正面）**：`panel.mjs` 档头拆分债注记（`:38-39`）纳入注释收正清单；行数 ∕ 余量读数随本批**同笔收正**（预计 **486** ∥ 余 **14**——实施后实读落值；档头现文 489 与实读 490 之差随笔归零）；触发句保持。受影响表 `panel.mjs` 核行复核 = **490 ⇒ ≈486（−4）维持**。

**⑤（🔵6 · 读回坐标重锚）**：`WEBVIEW-INPUT.md:53` ⇒ **`:54`**（细则⑦ 标记句现落位——断行后下移一行；区带 `:52-58`）——三处同笔（本档行 25 ∥ 行 65 ∥ 行 77——`WEBVIEW-INPUT.md:53` 残留共三处，一并收）。

**⑥（🔵7 · 窄窗判据腿 · 二择一取增腿）**：增 **T5（绿锁 · 窄窗端到端腿 · 桌面渲染链）**——同 tick 双提交（`state.queue()` 恒真值 7——镜像滞后窗显形；车具同 T1）⇒ 端门如实读 ⇒ 两条皆 `post("queuedUserMessage")`（**端门连放两条**）；
   `post` 接 wire `sendQueued`（通道桩：第一条回 `{ ok:true, queued:true }` ∥ 第二条回 `{ ok:false, reason:"queue-full" }`——宿主权威兜底）⇒ 第二条落 `[data-notice="send-failed"]` 行（T4 同面）。
   **择由**：「宿主径既有用例承接」径核查 = 承接底载面**已退场**（桌面仓套件随 2026-09-28 全清令）；现存皆**分段**面（`2026-09-29-desktop-susp-queue.test.mjs` W4 实读 `:179-184`（wire 收 `queue-full` ⇒ 失败行源）∥
   `2026-09-29-desktop-window-queue-parity.test.mjs:311-316` ∥ 本批 T4）——即评审所指「仅分段覆盖」原状、无「同 tick 双提交」承接件 ⇒ 登记不能闭合缺口，取增腿。批内件同拍复核：用例面 **T1–T4 ⇒ T1–T5** ∥ 行数预估 **≈170–200 ⇒ ≈195–230**。

**⑦（域外注记 · 父裁纳入 · 设计档面）**：`docs/desktop/design/COMPOSER.md:20` KD-52 陈旧坐标去号——③ 先例句 ∥ 依据对位句两处（`panel.mjs:304-306` ⇒ 函数锚 `send()` 满队门——同 `UI.md:28` 策略）；变更记录 +1 行。**已落**（本修正轮设计档笔）。

**修正块自检**：逐号读回（落点逐处复读——交付回报）；机检复跑 = `node scripts/doc-check.mjs`——读数随自检追记（紧随本块）。

**修正块自检追记（2026-10-04 · 落地后）**：`node scripts/doc-check.mjs`（cwd = 仓库根）复跑 ⇒ **锚 OK（0 悬空——扫描 177 档）∥ 行宽 OK（0 条 >300——区带豁免在效）∥ 行数面 = 15 条差异（报告态——存量；初始轮 12 条 ⇒ 现 15 条 = 报告态随动，非本席变更面）∥ exit 0**。
首跑曾见 1 新红（本席变更记录行自引入裸坐标 token——锚闸判「路径/坐标」；落点 = `docs/desktop/design/COMPOSER.md:296`）⇒ 当场收正（全路径形——同 `thincoder-core/session.mjs:120-138` 先例）⇒ 复跑 OK。逐号读回 = 落点逐处复读在档（`COMPOSER.md:20` 两处去号 ∥ `:296` 变更记录 +1；读数见交付回报）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**面向**：排队守卫假满队修复（影子计数器退役——满队门 = 宿主镜像如实直读）——设计档 `UI.md` ∥ `WEBVIEW-INPUT.md` 收正 + 批档 §2（对象状态 = 待评审）。
**核读面（本轮）**：批档全文；`UI.md`（输入区行 `:28` 收正句 ∥ 变更记录 `:811`）；`WEBVIEW-INPUT.md`（`:30-34` ∥ `:52-58` ∥ `:172` ∥ `:178` ∥ `:258`）。实证抽读（设计自陈的坐标面）：`thincoder-render-core/composer/panel.mjs`（实读 490 行；门 `:322-329`；影子态 `:292-297` ∥ `:330`；档头注记 `:9` ∥ `:38-39`）· `thincoder-desktop/renderer/composer-sync.mjs:78-85/:135-138` · `composer-wire.mjs:165` · `thincoder-vscode/src/extension/panel-messages.mjs:150-151/:163-170` · `webview/queued-mark.js:31` · `webview/state.js:134-135` · `webview/input.js:67` · `thincoder-core/queued.mjs:26`（`QUEUED_MAX_ITEMS = 8`）· `thincoder-vscode/package.json:152`（`@happy-dom/global-registrator` 在盘）。
**核读结论（摘）**：门句「如实单读」可落（`:294-298` → 单读）；同 tick 兜底为真（桌面 `turn-input.mjs:59/:65` ∥ VSC `panel-messages.mjs:166-169` 满队拒收 + 可见形在场）；VSC 镜像确无本地增量（`queued-mark.js:31` 由 `plan.count` 写）⇒ `:31`/`:32` 收正与代码同向；`panel.mjs` 行数注（490/≈486）、`WEBVIEW-INPUT.md` 收正落 `:31-32`/`:54`、`UI.md:28` 去号——三项与现盘一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（跨面状态滞后） | 🟡 | 同机制的两处 VSC 代码注释未纳入本批注释收正面，且仍把 `WEBVIEW-INPUT.md` 指为机制单源：`thincoder-vscode/webview/state.js:134-135`「提交受理时本地先行自增、host 推送权威收敛」+「机制单源 = `WEBVIEW-INPUT.md` §1 C-B2-6」；`thincoder-vscode/src/extension/panel-messages.mjs:150-151`「webview 镜像在提交受理时本地先行自增」（推文补因句）。而收正后 `WEBVIEW-INPUT.md:31` 现文 = `**端侧零本地增量**——提交受理时不改写`；两档在 §2 落点均点名 `state.js` 为**零改面** ⇒ 残句随批留场、指针反向。 | 两处注释句纳入注释收正清单（改述为现态：镜像 = host 快照如实写；panel-messages 补因改挂「快照幂等 + 镜像滞后窗」）；`WEBVIEW-INPUT.md` 单源指针随句同向。 |
| 2 | 记录面同步（批档 §1） | 🟡 | 批档首读面仍为改判前方向：`:6`「把实现拉回设计句「本地先行自增 + host 快照收敛」——方向无待裁」+ `:7` 同义条目句；而 §2（`:14` ∥ `:20` ∥ `:27`）已按用户 13:09 直裁改判（影子计数器退役）⇒ 首读面与设计面方向相左（记录面滞后，设计面胜）。 | §1 追加一句改判登记（用户 13:09 直裁 ⇒ 满队门 = 宿主镜像如实直读；原「本地先行自增」方向退场），使首读面与 §2 同向。 |
| 3 | Requirements 覆盖（协调项） | 🟡 | 需求面缺环（设计 §2 上抛① 自陈）——本席实读复核成立：`docs/vsc/requirements/**` 零「满队 / `input.slotFull`」命中；`docs/desktop/requirements/**` 无「满队 / `input.slotFull`」句（命中行皆「排队」类）；D25（`docs/desktop/requirements/COMPOSER.md:14`）载队列机制句（含「**队列 = 宿主单源 + 渲染面镜面**」）但无满队判据。裁决源 = 用户直裁，本批形不受阻。 | 需求卷补「满 8 拒 + 提示（`input.slotFull`）+ 文本保留」句（D25 ∥ VSC 需求卷对称句）；条数阈 8 与词键作判据面。 |
| 4 | Clarity（用例车具） | 🔵 | T1 未载明忙态前提：进队径 = `busyState() === "running"`（`panel.mjs:322`）——车具无 `turnState` provider 时提交走直发径，红腿（第 9 轮起拒 + `post` 零调用）不成立 ⇒ 「先红」负控失据。 | T1 车具补 `turnState: () => "running"`（T2 ∥ T3 同）并在用例注一行「红 = 影子态累计」前提。 |
| 5 | 受影响文件注记（数值漂移） | 🔵 | `panel.mjs` 档头拆分债注记（`:38-39`）读数「本档 **489 行**」∥「距 500 硬限余 **11**」+ 触发句「触发 = 越 500 前 ∕ 下次实质触碰」；本批 −4 后该读数不随动（删面列 `:288-291` ∥ `:323-325` ∥ `:330`，未列档头）。 | 档头注记行数 / 余量读数随本批同笔收正（或补一行「拆分触发仍待下次实质触碰」）。 |
| 6 | 验收对照（坐标） | 🔵 | 验收对照 #5 与 §2 行 22 的读回坐标 `WEBVIEW-INPUT.md:53`：按现盘 `:53` = 「判据源 = host **队列快照**」，细则⑦ 标记句在本批断行（`:31`/`:32` 拆行）后落 `:54`。 | 读回坐标按现盘重锚（`:54`）或写作 `:52-58` 区带。 |
| 7 | 验收（窄窗披露的判据腿） | 🔵 | 同 tick 空窗（端门连放两条 ⇒ 宿主拒第二条）为本批唯一语义取舍（§2「窄窗语义（留存披露）」），现仅分段覆盖（T3 如实读 ∥ T4 回执可见形），无「端门连放两条」端到端腿。 | 增一腿（同 tick 双提交 ⇒ 第一条受理、第二条落 `send-failed` 行）或在验收表登记「由宿主径既有用例承接」。 |
| 8 | Document ownership（存量结构） | 🔵 | `UI.md:19` 导读声明「域面行（按域分持 · 已迁指针）= … 输入区 …——单源 = 各域档 §2」，而本批收正句居 `UI.md:28`（未尽指针化）；同域 `COMPOSER.md:29` 载队径句，两处语义不冲突（已核），但句面居所与导读单源声明存分歧。 | 沿现址收正无碍本批；分持轮可二择一（端门判据句并域档 §2 ∥ 收正导读声明）。 |

计数：🔴 **0** ∥ 🟡 **3** ∥ 🔵 **5**（另：域外注记 1 条，未赋级——`docs/desktop/design/COMPOSER.md:20` KD-52 ③ 仍带本批已去号的陈旧坐标 `panel.mjs:304-306`）。
核读限制：无项目标准档 ∥ 无文档地图（给定上下文未提供）⇒ Document ownership 判据以实读为准（降格）；两 Junction 声明（`node_modules/@thincoder/render-core`）工具面不可判 link 类型——未独立复核（非疑点，标状态）。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（initial 轮 · 2026-10-04 · eng-coder）


**交付摘要（5 档 · 写域自证）**

- **核件（唯一码改点）**：`thincoder-render-core/composer/panel.mjs` —— `queueCount()` 收为**单读**（`:293-295` `return state.queue?.()?.count ?? 0`）；四处删面退役（`let _qHostSeen` ∥ `let _qLocal` ∥ 值变重置行 ∥ 提交径 `_qLocal += 1`——`_qLocal`/`_qHostSeen` 全树零残留）；满队门判据行零改（`:323-326` `queueCount() >= QUEUED_MAX_ITEMS` ⇒ `showToast(t("input.slotFull"))` + 不出泡 + 不清框）；三处注释收正（`:288-292` 块 ∥ `:320-322` 邻注 ∥ `:330` 行随删）；档头拆分债注记读数同笔收正（`:38` **486 行** ∥ `:39` 距 500 硬限余 **14**——口径 = 总行数（末换行计一行，`read` 工具同源；同设计 §2.6 表头注），档头注与实读之差归零）。
- **注释收正两处（评审 #1 · 零码改 · 修正块 ①）**：`thincoder-vscode/webview/state.js:134`（残句「提交受理时本地先行自增、host 推送权威收敛」⇒「镜像 = host 快照如实写（端侧零本地增量——提交受理时不改写）」；单源指针 `:135` 保持）∥ `thincoder-vscode/src/extension/panel-messages.mjs:150-151`（补因改挂「快照幂等 + 镜像滞后窗」）。
- **批内件（新档）**：`docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs`（**188 行**；T1–T5；车具 = happy-dom 真 DOM + 通道桩 + 真桌面渲染链（wire ∥ sync）；T1∥T2∥T3∥T5 带 `turnState` provider——修正块 ③；「红 = 影子态累计」注在档）。

**红 → 绿两读（先红逐条）**

- **红（修复前基线）**：T1 ✖ `受受受受受受受受拒 · posts=8 · toast="主会话处理中——排队已满 8 条消息，请等其处理完成后再发送"`（第 9 轮被影子态误拒）∥ T5 ✖ `posts=["queuedUserMessage"]`（同 tick 第二提交被端门误拒：镜像 7 + `_qLocal`(1) = 8）；T2 ∥ T3 ∥ T4 ✔（绿锁——修复前后同绿）。合计 = pass 3 ∥ fail 2。
- **绿（修复后）**：T1 ✔ `受受受受受受受受受 · posts=9 · toast=null` ∥ T2 ✔（镜像 8 ⇒ 零 post ∥ 文本保留 ∥ toast = `t("input.slotFull")` 逐字）∥ T3 ✔（0/3/7 受 · 8 拒 · 回 0 再受——零累计）∥ T4 ✔（`failure() = { reason:"queue-full", kind:null }` + `[data-notice="send-failed"]` 行落锚 + 受理径清行负控）∥ T5 ✔（端门连放两条 ⇒ 通道桩第二条 queue-full ⇒ 失败行）。合计 = **5/5 pass**。
- 复跑：`node --test docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs`（cwd = 仓库根）。

**机检读数**

- `node --check`：四档（panel.mjs ∥ state.js ∥ panel-messages.mjs ∥ 批内件）exit **0**。
- `node scripts/doc-check.mjs`（cwd = 仓库根）：改前基线 = 锚 OK（**0 悬空**——177 档）∥ 行宽 **2 条**（`PROJECT.md:418` 357 字符 ∥ `RENDERER.md:271` 309 字符——他批在途存量、非本批面）∥ 行数面差异 **6 条**（报告态）；改后复跑读数逐字同基线 ⇒ **本批面零红**（写域零新增锚/行宽红；panel.mjs 不在行数比对节域内；exit 1 随存量行宽红——非本批引入）。
- 行数（read 总行口径）：`panel.mjs` **490 ⇒ 486**（−4）∥ `state.js` **140**（±0）∥ `panel-messages.mjs` **383**（±0）。
- 零越表自证：`git status` 写面 = 本批 5 档（三码档 + 批内件 + 批档本体）；面内他档改动 = 他批（并发写者）与设计轮在途（如 `WEBVIEW-INPUT.md` 收正 = 设计轮已落）。

**决策透明表**

| # | 决策 | 由 |
|---|---|---|
| 1 | `queueCount()` 保留函数形（`return state.queue?.()?.count ?? 0`）而非内联 | 满队门读面单点保留；行数按设计 −4 恰落 486（余 14） |
| 2 | T3 增「回 0 再受理」腿（在批档序列 0/3/7/8 之外） | 同判据（「即读即用——零累计」）强化；零新语义 |
| 3 | T4 增「受理径清行」负控 | 同面负向锁（失败行 = 失败径驱动）；零新语义 |
| 4 | T4 ∥ T5 落行断言走**真桌面渲染链**（wire ∥ sync + happy-dom） | 修正块 ⑥「T4 同面」的强势实现（行源 + 落锚双证）；先例 = `2026-09-29-desktop-susp-queue.test.mjs:179-184` |
| 5 | 批内件 **188 行**（低于修正块预估 ≈195–230） | 用例面齐全（T1–T5 逐条在）——预估差登记，零缺省 |
| 6 | 顾问 🔵（panel.mjs:291 陈旧坐标 `send.js:41` ∥ `state.js:130`）**未改** | 该句 = 既有注释（非本批引入）；修正块未列 ⇒ 报告不改（候下次实质触碰一并收） |
| 7 | 顾问 🔵（T4 ∥ T5 `settle(20)` 墙钟）**未改** | 批内件沿先例同式；实跑余量充足（`call` 仅微任务结算）⇒ 记录在案 |

**审计与代码评审轮次与终态**

- **审计轮**（explore · 只读差分审计 · 1 轮）：判定 = DEVIATIONS（**1 项：§5 未写——时序性**；部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越表 四类零偏差）。处置 = 随本笔 §5 落笔闭合（记录面）。
- **代码评审轮**（advisor · code · 轮 1 · 全量）：**VERDICT: pass** —— 🔴 **0** ∥ 🟡 **4**（① 批档读回坐标滞后（`:53`/`:810`/`:322`——报告态）∥ ② §5 未写（协调项——随本笔落）∥ ③ panel.mjs 486 越 300 顾问线（存量·注记在册）∥ ④ panel-messages 383 越 300（存量））∥ 🔵 **3**（⑤ panel.mjs:291 陈旧坐标 ∥ ⑥ `settle` 墙钟 ∥ ⑦ UI.md 813 vs 811（他批回填随动——非本批面））。
- **fix round**：码面**零修**（发现全为报告/协调/存量态，无 must-fix）；记录面 **1 修**（§5）。终态 = **clean**（收敛交付）。

**读数追记（收笔前终跑 · 2026-10-04）**：`node scripts/doc-check.mjs` 终读 = 锚 OK（0 悬空）∥ 行宽 **OK**（`PROJECT.md:418` ∥ `RENDERER.md:271` 两条存量红已随他批收正——非本批写面）∥ 行数面差异 **9 条**（报告态；较本批基线 6 条 +3 = 他批在飞随动；逐条核对**零本批档**——9 条全为 desktop 族他批档）∥ exit **0**。批内件终跑 = **5/5 pass**（T1 `受×9 · posts=9 · toast=null`）· exit 0。§5 写入自证 = 本段读回在档（本条 = 终笔追记）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（排队守卫假满队修复（影子计数器退役）——批链：设计 → 评审 #34（🔴0/🟡3/🔵5 全裁）→ 修正轮 #35 逐号 → §4 代签 → 实施 #37（审计 1 项闭合 ∥ 代码评审 pass）→ 本节核销）

- **判据链**：批内件 T1–T5 **先红 2✖/3✔ → 后绿 5✔/0✖**（父侧收口复跑：仓根 `node --test docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs` = **exit 0 · tests 5**；红态 = T1 第 9 轮误拒（影子态累计）∥ T5 同 tick 第二提交误拒——均为本征）∥ `node --check` 四档 exit 0 ∥ as-built：`thincoder-render-core/composer/panel.mjs` **490 ⇒ 486**（`queueCount()` 单读 `:293-295` ∥ 满队门 `:323-326` **零改** ∥ `_qLocal` ∥ `_qHostSeen` 全树零残留）∥ `thincoder-vscode/webview/state.js` **140** ∥ `thincoder-vscode/src/extension/panel-messages.mjs` **383**（±0——注释级）。
- **收口测试行**：本批单元件 = `docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs`（188 行 · 5 例 · 随批留存——happy-dom 真 DOM + 真桌面渲染链）；集成面 = 无新增 ∥ 无修订；仓套件 = 未跑（仓 `test/` 树空清单——批内件复跑为本批唯一运行）。
- **doc-check**：**exit 0**（父侧收口直跑：锚 0 ∥ 行宽 0）。基线曾现两处行宽违例（`RENDERER.md:271` ∥ `PROJECT.md:418`）= **父侧随动笔自引入**——当场折行收正，基线回 OK（经过在案）。
- **收口笔（父侧 · 逐处可 revert）**：① **需求面缺环裁补**（评审 #3 处置）——`docs/desktop/requirements/COMPOSER.md` D25 补「满 8 拒收」判据句 + `docs/vsc/requirements/WEBVIEW.md` F-W5 对称句（+ 两条变更行）；② 设计句面随正已在设计/修正轮落（`docs/desktop/design/UI.md:28` ∥ `docs/vsc/design/WEBVIEW-INPUT.md:31-32/:54` ∥ `docs/desktop/design/COMPOSER.md:20` 去号）。
- **在册（非阻断）**：① §2 坐标族（行 25/65/77 `:53` ∥ 验收 #5 `UI.md:810` ∥ 块③ `panel.mjs:322`）——**以修正块为准**（其自声明「本块为修正面准据」），收口按盘核在案；② 既有注释两处陈旧坐标（`send.js:41` ∥ `state.js:130`——非本批引入）候下次实质触碰；③ 挂起窗残值早退径疑似零帧漏点 = **入账 tech_todo**（可达性未实证）；④ **重打包披露**：运行中旧 asar 仍旧行为——修复只在新包生效（VSC = `vsce package --follow-symlinks` ∥ 桌面 = `materialize-deps.mjs` 源树直拷自动取新）；⑤ 真机（忙态连发 9 条）= 在册（随用户实操）；⑥ VSC 拒收提示英文硬编码存量（本批零触）。
- **前批遗留交叉核**：无（独立批）。
- **结算**：台账 #911 核销 ∥ 签入（双远端）。
