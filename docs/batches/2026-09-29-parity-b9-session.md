# 2026-09-29 · parity-b9-session
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 三端对位收编 §2 归批表 B9（会话模型尾账）+ 用户「都处理」令。
> 台账 = #573（desktop · 归批）。前情 = `docs/batches/2026-09-29-parity-closeout.md` §2 归批表 B9 + §3⑤（annex :119）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（尾账核对轮 · 评审 #141 修正轮 1 已落（十发现全收——2.8 修正块在册）；零实施）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态与口径（尾账核对轮 · 零实施）
- **本批 = B9 会话模型尾账（台账 #573）**：交付物 = 本节（逐面核对表 ∕ 残留件清单 ∕ 缺口修法表 ∕ 波划分 ∕ 评审范围清单）——**不另立设计档**（先例 = `docs/batches/2026-09-29-parity-closeout.md` §2.0 清账轮）；本轮零实施。
- **来源链**（三链同源）：`docs/batches/2026-09-29-parity-closeout.md` §2 归批表 B9 + §2.9 ⑤（「多会话标签+左列」模型 = 收编在握、非例外；尾账 = 三档残余逐面核）＝ 本批条目；裁定 = 用户 2026-09-28 19:04 ∕ 19:0x（`docs/desktop/requirements/PROJECT.md` §3.1）；基线 = R13 各轮交付已落为准（`docs/batches/2026-09-28-desktop-flow-vsc-align.md` §5.12 ∕ §5.16–§5.20）。
- **状态三态**：**已落**（契约面在盘 + 消费链完整）· **缺口**（与裁定 ∕ 机制单源相抵，或现时指涉已裁面）· **不适用**（该面在本模型下不成立 ∕ 已裁保留）。
- **证据**：届盘实读 2026-09-29（`file:line`）+ 实跑件（2.4）；行数 = read 工具同源口径（`wc` 同源 −1——两法差 1 不入判，沿 flow 批 §2.10）。
- **零触面**：产品码 ∕ 测试面 ∕ annex（`docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md`）零触；R13 交付与已核销项不重开；本轮唯一落盘 = 本段。
- **覆盖 ∕ 不覆盖**：覆盖 = annex `:119` 列余面（desktop 三档 ∕ VSC 二档 ∕ CLI 二档 ∕ 核二件 ∕ 模型差三条）+ R13 会话轮未闭项四项复勘；不覆盖 = 实施、他批面（B1–B10 余面）、设计档他族。

### 2.1 逐面核对表（annex `:119` 具名面）

| # | 面 | 状态 | 届盘证据（file:line） | 核结论 |
|---|---|---|---|---|
| A1 | desktop `projects.mjs`（当前项目 ∕ 最近目录 ∕ 物化 ∕ picker 注入） | 已落 | `src/main/projects.mjs:15` ∕ `:74-88` ∕ `:105-110`；消费 = `src/main/ipc.mjs:35` ∕ `:116-125` | 模型面中性——服务 VSC 形项目钮；核 `groupSessionEntries` 已消费；单项目 ∕ VSC 多根 = 宿主差异（R13 适配 a 在册） |
| A2 | desktop `sessions.mjs`（`sessions:list` 投影 · 字段闭集 · 账本注记） | 已落（残留 → G-3） | `src/main/sessions.mjs:15-17` ∕ `:37-45`；消费 = `renderer/mount-sessions.mjs:254` ∕ `:259` | 行源 = 核 `listSlots`（盘面实读）；下拉列表 = 唯一消费面 |
| A3 | desktop `session-actions.mjs`（五通道 + 信封 + 三档整形 + 末项门） | 已落（微 → G-5） | `src/main/session-actions.mjs:37` ∕ `:44` ∕ `:51` ∕ `:62-65` ∕ `:69` | 零算法副本（核直转）；末项门对位锚坐标漂移两处 |
| A4 | 认领面（`:119` 核列 `releaseClaimsAll`） | **缺口 → G-2** | 消费面 = `thincoder-vscode/src/extension/panel-project.mjs:35-38` ∕ `chat-panel.mjs:100/:125/:145`；`thincoder-cli/src/tui/index.mjs:202` ∕ `key-handler-ctrlc.mjs:112`；**desktop 全树零消费**（grep） | 桌面切项目后旧 cwd 认领残留（活进程属主）——对端用户可感：VSC 切槽拒（`panel-messages-session.mjs:52-57`）∕ CLI 提示后 fork（`cmd-session.mjs:90-92`） |
| A5 | VSC `panel-project.mjs` | 已落 | `:18-24` ∕ `:35-38` | 多根切换 + 认领释放单点 `releaseOldCwdClaims` |
| A6 | VSC `panel-session.mjs` | 已落 | `:46-61` ∕ `:70-81` ∕ `:212-228`（末项门实坐标 `:220-221`） | 单面板槽绑定 ∕ 认领单飞 ∕ 恢复 ∕ 翻页 |
| A7 | CLI `startup.mjs` | 已落 | `:1` ∕ `:13-14` | 恢复面 ∕ 历史页吃核单源 |
| A8 | CLI `cmd-session.mjs` | 已落 | `:1` ∕ `:8` ∕ `:42` ∕ `:92` | `/rename` ∕ `/session` 直取核；占用提示在册 |
| A9 | 核 `session-stale.mjs groupSessionEntries` | 已落 | `thincoder-core/session-stale.mjs:56-70`；消费 = `desktop/src/main/projects.mjs:15` ∕ `core/session-slots.mjs:208`（re-export） | 清单面单源已消费 |
| A10 | 「多会话标签 + 左列」模型裁撤 | 已落 | `renderer/index.html:32-45`（零 `.rail` ∕ info ∕ tabs 槽）；`renderer/views/{tabbar,sessions,info-row}.mjs` 不在盘；`renderer/store.mjs:4-7`；renderer 状态面 `needsCloseConfirm ∕ tabbar ∕ activeTab ∕ pendingClose` 零命中 | R13-A ∕ B 交付为准；状态面零残留（历史注记形保留） |
| A11 | 「每键一槽（`session:<n>`）」 | **缺口 → G-1** | 全树唯一命中 = `src/main/session-io.mjs:14`；现行键形 = `String(slot)`（`src/main/session-slots.mjs:111`） | 裁定句 = 需求档 §3.1「每键一槽（`session:<n>`）随之下线」 |
| A12 | 「在飞表按会话分键」 | 不适用（保留） | `src/main/turn-driver.mjs:44-45` ∕ `:59-60` ∕ `:101` ∕ `:113`；`queued-input.mjs:26` | 非残余——需求 §3.5 待设计形（同项目多会话并行跑）⇒ 系承载面，不得按裁撤处置 |
| A13 | 「池模型（每会话一份 · 随活动会话切换）」 | 已落 | 需求档 §3.1:56 ∕ §3.4；`renderer/store.mjs:47-58`（按会话键切片）；R10 交付（flow 批 §5 在册） | 全局常驻池不存在——与裁定一致 |
| A14 | `project:recent` 通道 | 已落（在册保留） | `src/main/ipc.mjs:127-129`；`renderer/mount-sessions.mjs:246-259`（cwd 面消费 ∕ recent 面形状判据） | 「R13 后无渲染消费面（保留）」= `docs/desktop/design/IPC.md:122` 在册 |

### 2.1b R13 会话模型轮未闭项复勘（flow 批 §5.19 在册——届盘复核）

| # | 项（R13 §5.19） | 状态 | 届盘证据 | 结论 |
|---|---|---|---|---|
| B1 | -1 `mount-sessions.mjs` 越硬限 | 已落 | R13-B 拆分（flow 批 §5.12：588 ⇒ 387 + 新档 `views/session-control.mjs`）；届盘 = `mount-sessions.mjs` 407 ∕ `session-control.mjs` 225 行 | 硬限内；>300 顾问线拆点「再拆两手」在册续期 |
| B2 | -2 新建会话首存前不入列表 | 不成立（届盘实跑） | 实跑件①（2.4）：`newSession` ⇒ 槽文件 + 摘要条目 + 认领三写即时落盘（`core/session-lifecycle.mjs:254-263`）；`listSlots` 即时含新槽（实测） | 「按下无痕」前提届盘不成立 ⇒ 登记项建议闭合（上抛①） |
| B3 | -3 注释残留 ∕ 死规则 | 部分缺口 | 会话面 = R1 ∕ R2（→ G-3 ∕ G-1）；跨面 = R3 ∕ R4；他批 = R5 ∕ R6；设计档 = R7（→ G-4） | 归属分包（2.1c + 上抛②） |
| B4 | -4 `no-session` 引导态近不可达 | 不适用（保留） | flow 批 §5.19-4（词键 ∕ 分支保留；first-run-smoke 步已改锚） | 保留——不裁 |

### 2.1c 残留件清单（届盘扫描 · 逐件）

| # | 件（file:line） | 现状 | 归属建议 |
|---|---|---|---|
| R1 | `src/main/sessions.mjs:3` ∕ `:13` | 现时指涉「左列」（已裁） | **B9 收（G-3）** |
| R2 | `src/main/session-io.mjs:14`（并 `:8`「多标签」半句） | 裁定下线名 `session:<n>`（全树唯一命中） | **B9 收（G-1，两处同笔）** |
| R3 | `src/main/suspension-drive.mjs:169` | 「切标签零影响」——现应为「切会话」 | 随面（annex `:43` ∕ B1）——提请顺带 |
| R4 | `renderer/views/statusline-segments.mjs:180` | 「与标签条 ∕ 左列同源同投影」——两面已裁 | 随面（状态行面）——提请顺带 |
| R5 | `renderer/settings.css:7` ∕ `:248` | 「左列底行」现时句 + `[data-slot="info"]` 死规则（`index.html` 零该槽） | B10 ∕ 清扫面（上抛②） |
| R6 | `docs/desktop/design/UI.md:150-158` | D21 项 2 表 9 行 `.rail-*` 选择器（现盘 = `.session-*`——`renderer/chrome.css:156-260`） | B10 ∕ 设计面轮（上抛②） |
| R7 | `docs/desktop/design/PROJECT.md:170-172` | 「→ 左列行」措辞 + 行数两法 ±1 | **B9 收（G-4）** |

### 2.2 缺口修法表

| # | 缺口 | 判据（可检 ∕ 可判） | 改动面 | 验收 |
|---|---|---|---|---|
| G-1 | `session:<n>` 命名残留（＋「多标签」半句） | 桌面树 `/session:<n>` 现时指涉零命中；键名单源 = `String(slot)`（`src/main/session-slots.mjs:111`） | `src/main/session-io.mjs:14`（并 `:8`——同笔） | grep 零命中；注释零语义（无需机检面） |
| G-2 | 桌面切项目未释放旧 cwd 认领（活进程残属主） | 切项目（cwd 实变）后旧 cwd manifest `slotSessions` 本进程条目零残余；同 cwd ⇒ 零写早退（核 `releaseClaimsAll` 容忍形——无 manifest ∕ 零认领零写） | `src/main/ipc.mjs` `openProjectChannel`（`:116-125`）增行：`receipt.cwd !== before && before` ⇒ `releaseClaimsAll(before)`（核直取——单源 `@thincoder/core/session-slots-manifest.mjs`）；子项 = `main.mjs` 退出释放（上抛③） | 定向探针②：起 app（项目 A 认领在盘）⇒ 切 B ⇒ 读 A manifest 本进程零残余；反例：重开同 path ⇒ manifest mtime 零变。测试面 = 重建期（`test/files.mjs = []`）⇒ 探针落 `.thincoder/tmp/`，批内单测随实施批补 |
| G-3 | `sessions.mjs` 注释两处现时指涉「左列」 | 会话面注释现时指涉已裁面零命中（历史注记形「原…随裁撤退场」保留） | `src/main/sessions.mjs:3` ∕ `:13` | grep 零命中；零语义 |
| G-4 | 设计档 §4.1 三行：措辞 + 两法 ±1 | `:171`「→ 左列行」⇒ 会话控制条目；行数按在册口径（read 工具同源）统一回填 = sessions 46 ∕ session-actions 74 ∕ projects 121（现行 45 ∕ 73 ∕ 120——两法差 1） | `docs/desktop/design/PROJECT.md:170-172` | 实读对照三档；`doc-check` 无新增悬空 |
| G-5 | 对位锚坐标漂移两处 | 引 VSC 末项门实坐标 = `panel-session.mjs:220-221`（判句 `slots.length <= 1`） | `src/main/session-actions.mjs:9` ∕ `:60` | 抽验坐标命中判句；零语义 |

**受影响文件（预估 · 若 W1 ∕ W2 落）**：`src/main/session-io.mjs`（45 → 注释 2 处 ∕ ±0）· `src/main/sessions.mjs`（45 → 注释 2 处 ∕ ±0）· `src/main/session-actions.mjs`（73 → 注释 2 处 ∕ ±0）· `src/main/ipc.mjs`（294 → +2~4 行）· `docs/desktop/design/PROJECT.md`（§4.1 三行 → ±0）。（行数 = `wc` 同源；read 同源 +1。）

### 2.3 波划分
- **W1（零语义收正——注释 ∕ 设计档；可随任一批顺带）**：G-1 ∕ G-3 ∕ G-4 ∕ G-5（＋R3 ∕ R4 顺带候选）。
- **W2（产品码——单批设计令牌 + eng-coder）**：G-2（`ipc.mjs` 释放补线 + 探针②）；子项 W2b = 退出释放（上抛③裁后定）。
- 序：W1 ∥ W2 零依赖（不同文件面）；W2 内序 = 先补线后探针。

### 2.4 证据与复跑配方
- **实跑件①（核沙箱 · 2026-09-29）**：`_setSessionsDirForTest(临时目录)` ⇒ `await newSession(cwd)` ⇒ `listSlots(cwd)`；读数 = 槽文件 + 摘要条目 + 认领三写即时落盘、新槽即时入列（B2 依据）。复跑 = node 脚本 import `thincoder-core/session-lifecycle.mjs` ∕ `session-slots.mjs` 两档。
- **消费面 grep**：`releaseClaimsAll`（VSC ∕ CLI 有 ∕ 桌面零）· `slotOccupancy`（VSC ∕ CLI）· `session:<n>`（唯一命中 `session-io.mjs:14`）· tab 族 ∕ 左列（残留件清单）。
- **行数**：read 工具同源口径（`wc` 同源 −1；两法差 1 不入判）。

### 2.5 评审范围清单（§3 送审对象）
1. **核对表**（2.1 ∕ 2.1b ∕ 2.1c）——逐行状态判定与证据抽验；重点 = A4 缺口归因线（用户可见端差判据）、A10 零残留结论、A12 ∕ B4「不适用（保留）」判定、残留件归属分包。
2. **修法表**（2.2）——判据可执行 ∕ 改动面准确 ∕ 验收可跑（G-2 探针②配方）。
3. **波划分**（2.3）——W1 零语义边界 ∕ W2 令牌面。
4. **证据面**（2.4）——复跑配方可重现。
5. **三链一致**——本节条目 ↔ closeout B9 归批 ↔ 需求档 §3.1 裁定；边界（零实施 ∕ R13 交付不重审 ∕ annex ∕ 已核销零触）。
- **非审查面**：产品码实施细节；他批面（R5 ∕ R6 归属）；R13 交付本体。

### 2.6 关键决策（含被否候选）
- **KD-1** 交付形态 = §2 自持（不另立设计档）——先例 = closeout §2.0；被否 = 另立核对报告档（分离于批档 = 与「段一作者 ∕ 批档承载」相抵）。
- **KD-2** 三态判据（2.0）——被否 = 沿用清账轮五值（半落等——核对对象是「残余面」而非「机制完成度」，五值过细）。
- **KD-3** A4 判「缺口」（非真端差保留）：09-28 18:57 判据（用户可见端差 = 缺陷；唯一例外 = 宿主能力面实证）——释放无宿主约束（核件在盘、VSC ∕ CLI 已落）⇒ 桌面面补齐；被否 = 登记保留。
- **KD-4** 残留判定 = 「现时指涉 vs 历史注记」二分——历史注记形保留（不制造无谓 diff）；被否 = 全量清「左列 ∕ 标签」字面（会删沿革注记——过杀）。
- **KD-5** A12 判「不适用（保留）」——需求 §3.5 多会话并行待设计形 ⇒ 系承载面；被否 = 按「裁撤」处置（扩大化，无裁定依据）。

### 2.7 上抛项（父侧裁）
① R13 §5.19 未闭项处置：-2 建议闭合（届盘不成立）；-3 归属分包（会话面入 W1；余 → ②）；-4 保留。
② R5 ∕ R6 归属——B10 ∕ 清扫面（B9 不认领，列报）。
③ W2b 退出释放收不收（对位：CLI 收 `index.mjs:202` ∕ VSC 只收切根；死属主由核属主清理面 `cleanDeadOwners` 兜底 ⇒ 默认可不收）。
④ 台账转单：G-1–G-5（父侧笔；#573 现态 = 待讨论）。

### 2.8 修正轮 1（评审 #141 十发现落地 · 2026-09-29 · eng-designer）

**来源** = 本档 §3 轮次 1（0🔴 ∕ 7🟡 ∕ 3🔵 · pass）；父侧裁定 = 1–10 全收；处置 = 本席逐条落。**本块为准，上文行文不改**（承修正块先例）；本轮**零实施**（产品码 ∕ 测试面 ∕ §3 面零触）。**本块计数**：十发现全落（①–⑩）；2.1c 增行 **R8–R19**（12 行——其中 R18 ∕ R19 = 已消解）；2.1 补行 **A4b**；2.2 ∕ 波面 ∕ 2.4 各收正（见下）；上抛 ②扩 + ⑤新。**行数口径** = `wc` 同源（内容行数 · 文末换行不计；`read` 同源 = +1）——2.0 句 ∕ 2.2 句就此统一。

**一、2.1c 增行（评-1「rail 命名族」逐处 · 实读复核后落）**——归属 = **KD-4 保留（命名沿革）并给由**（非 W1 改名；由 = 语义均已在 R13 收编至会话面，改名零语义且牵动键面机检 ∕ 邻测试面）：

| # | 件（file:line） | 现状 | 归属 |
|---|---|---|---|
| R8 | `renderer/store.mjs:166` `deriveTabBadge`（消费 = `renderer/views/session-control.mjs:61` · `renderer/views/statusline.mjs:84`）＋邻名 `tabBadges` 切片（键表 = `renderer/app.mjs:57-58`） | 名沿「Tab」；语义 = 会话位标 ∕ 跨会话告警位 | KD-4 保留（命名沿革）——改名零语义、牵动三档 |
| R9 | `renderer/mount-sessions.mjs:252` `refreshRail`（消费 = `renderer/app.mjs:36 ∕ :103 ∕ :212`） | 名沿「Rail」；语义 = 会话列表唯一写路径 | KD-4 保留（命名沿革）——同上（三消费坐标实读在册） |
| R10 | `renderer/i18n.mjs:102-108 ∕ :263-269`（`rail.*` 七键 × 两语） | 键名沿「rail」；现义 = 会话控制条 ∕ 引导面两消费面同用 | KD-4 保留（命名沿革）——本档 `:71-73` 自注在册（「会话控制条残余族……保留键 = 会话控制条 ∕ 引导面两消费面同用」）；键面机检（键集相等 · 键序并行）⇒ 改名 = 无谓 diff |
| R11 | `renderer/views/chat-guide.mjs:29-30`（消费 `rail.action.*` 两键） | 引导面消费 R10 两键 | KD-4 保留（随 R10） |
| R12 | `renderer/i18n.mjs:109 ∕ :270` `tab.badge.approval`（消费 = `renderer/views/chat-tool.mjs:31` · `renderer/views/chrome.mjs:43` · `renderer/views/activity.mjs:140`） | 键名沿 `tab.badge.*` 族（标签裁撤后保留） | KD-4 保留（命名沿革）——本档 `:34-37` 自注在册（「`tab.badge.approval` 保留——位标词键沿 `tab.badge.*` 族」）；评-1 顺带补全（同族逐处） |

**A10 结论边界收正（评-1）**：「状态面零残留」之界 = **状态字段 ∕ 渲染结构 ∕ 槽面**（见证 = 四符号零命中 + `renderer/index.html:32-45` 三槽零命中 + 三视图档不在盘）；**命名族（R8–R12）为活命名沿革**（语义均已迁会话面）——按 KD-4 保留，**非状态残留**；结论与其见证面同界。

**二、2.1c 增行（评-2 · flow 批 §5.19-3 具名件 mini 归属表——届盘实读后列）**

| # | 件（file:line） | 现状 | 归属 |
|---|---|---|---|
| R13 | `renderer/views/settings.mjs:15` | 注释指**已删** `renderer/views/info-row.mjs`（`reasonWord` 供给句） | **本批不认领——随 B10 ∕ 清扫面**（上抛② 扩） |
| R14 | `renderer/views/settings.mjs:276` | 同上（`syncHostProps` 共用面句） | 同上 |
| R15 | `renderer/views/chat-tool.mjs:46` | 注释指**已删** `renderer/views/sessions.mjs:161`（接线两态通则） | 同上 |
| R16 | `renderer/views/chat.mjs:31` | 同上 | 同上 |
| R17 | `renderer/settings.css:9`（头注树面锚指 `views/info-row.mjs`）＋ `.info-entry` 族（`:69 ∕ :80 ∕ :95 ∕ :282 ∕ :286 ∕ :290`——渲染面 `.mjs` 零消费命中） | 死指针 ＋ 死规则候选 | **随 B10 ∕ 清扫面**（与 R5 同档同面） |
| R18 | `renderer/mount-settings-exits.mjs:288`（流批具名） | 现档 **275** 行——原坐标越档末；档内「`sessions.mjs` ∕ `styles.css` ∕ tabbar ∕ info-row」零命中 | **已消解**（不在盘） |
| R19 | `renderer/views/chat-copy.mjs:12`（流批具名） | 档不在盘（工作树删除态） | **已消解** |

**B3 行注（评-2）**：§5.19-3 具名件落位见 R13–R19；会话面分包已在册（`renderer/views/sessions.mjs` 指涉 = R15 ∕ R16 注释面；主进程 `sessions.mjs` ∕ `session-io.mjs` = R1 ∕ R2）；**余件本批不认领——随 B10 ∕ 清扫面**。

**三、2.1 补行 A4b（评-3 · A4 归因线两侧对称）**

| # | 面 | 状态 | 届盘证据（file:line） | 核结论 |
|---|---|---|---|---|
| A4b | desktop `slotOccupancy` 消费面（受占切换受理） | **缺口（「警告 ∕ 提示」半幅）→ 顺带** | 端壳转口在盘、桌面全树零消费 = `thincoder-desktop/src/main/session-slots.mjs:64`（grep 实读）；核内建占用语义 = `thincoder-core/session-lifecycle.mjs:334-342`（受占不认领 + 释放旧认领 + 次存 fork）；对位 = VSC 拒 + 告知（`thincoder-vscode/src/extension/panel-messages-session.mjs:52-57`）· CLI 提示后 fork（`thincoder-cli/src/tui/cmd-session.mjs:90-92`） | 判据 = 09-28 18:57（用户可见端差 = 缺陷；唯一例外 = 宿主能力面——此处零约束）+ 非面板侧在册表述「切换成立（**警告** + 继续）」（`docs/core/requirements/SESSION.md:41`）⇒ 桌面（核直转 ∕ 非面板）余「警告 ∕ 提示」半幅未落；归置 = 顺带（认领 ∕ 占用族——随 G-2 同族轮面；受理形 ∕ 词键为未裁项，随该轮设计定） |

**四、G-2 改动面补（评-4 · 与 G-4 同笔）**
- ① `thincoder-desktop/src/main/turn-driver.mjs:254-258`——`abortSuspensions` 级联枚举注释：随 G-2 补「旧 cwd 认领释放」入级联（实现 ∕ 注释同笔）；
- ② `docs/desktop/design/PROJECT.md:110`（中止墓碑 ∕ 级联单源行）：补「切项目 ⇒ 旧 cwd 认领释放」元素；
- ③ `thincoder-desktop/src/main/ipc.mjs:123`（行内枚举注释）：随新行随动；
- ④ `docs/desktop/design/PROJECT.md:155`——`ipc.mjs` 行数随动（寄存器行；G-2 落笔时按实施轮实读回填）。

**五、G-4 ∕ R7 锚收正（评-5 · 实读复核）**：措辞行 = `docs/desktop/design/PROJECT.md:172`（现记 `:171`——`:171` = session-actions 行）；行数集 = `:171` ∕ `:172` ∕ `:173`（区间 **`:171-173`**——`:170` = session-maintenance 行不入改动集）；R7 行（2.1c）区间 `:170-172` ⇒ 改 `:171-173`，G-4 行（2.2）改动面同改。复核：`:172` = sessions 行（「核 `listSlots` 条目 → 左列行」措辞在册）· `:171` = session-actions（73）· `:173` = projects（120）。

**六、A9 第二坐标收正（评-6 · 按实读改述）**：清单面单源 = `thincoder-core/session-stale.mjs:56-70`；消费 = `thincoder-desktop/src/main/projects.mjs:15`（import；调用点 `:76` ∕ `:107`）；**另口 = 端壳 `thincoder-desktop/src/main/session-slots.mjs:208`（`listStaleCwds` 转口——同源档另一出口，非 `groupSessionEntries` 转口）**。原记「`core/session-slots.mjs:208`（re-export）」**不成立**（thincoder-core 零 `groupSessionEntries` 命中——届盘 grep）。

**七、W1 面收正（评-7 · R3 ∕ R4 归位——取「在册」支）**：R3 ∕ R4 自「顺带候选」转 **W1 在册项**（文件集定）——
- 受影响表 **+2 行**：`src/main/suspension-drive.mjs`（**326** → 注释 1 处 ∕ ±0——`:169`「切标签零影响」⇒ 会话语义；`PROJECT.md:158` 行级小修不计窗口在册 ⇒ 不触拆点）· `renderer/views/statusline-segments.mjs`（**198** → 注释 1 处 ∕ ±0——`:180`「与标签条 ∕ 左列同源同投影」⇒ 两面已裁、收正措辞）；
- W1 句改：G-1 ∕ G-3 ∕ G-4 ∕ G-5 **＋ R3 ∕ R4（定件）**。

**八、2.2 受影响行 · 口径自洽收正（评-8）**：口径 = **`wc` 同源**（= 寄存器口径「内容行数 · 文末换行不计」）；逐件实读复核（2026-09-29 修正轮）：`src/main/session-io.mjs` **46**（原记 45——收正）· `src/main/sessions.mjs` **45** · `src/main/session-actions.mjs` **73** · `src/main/ipc.mjs` **294**（工作树现值；`read` = 295；寄存器行 `PROJECT.md:155` 记 293 = #28 提交值——差 1 = 工作树未提交注释面 +1，他批在飞，见「他批观察」）· `docs/desktop/design/PROJECT.md`（±0）。层判定不受影响（294 + 4 = 298 < 300）。

**九、G-4 口径收正（评-9）**：原「统一回填 `read` 口径 = 46 ∕ 74 ∕ 121」句**退役**——§4.1 表头已有口径声明（`docs/desktop/design/PROJECT.md:142`「行数口径 = 内容行数（文末换行不计）」= 本档统一口径）；复核 = 三行现值（45 ∕ 73 ∕ 120）与在册**逐件一致**（两法差 1 = `read` +1，不入判）⇒ **行数回填 = 零动作**；G-4 实质 = 措辞行 `:172` 收正（评-5）；若刷「实读」日期随 G-4 同笔、按 `wc` 口径。

**十、探针②判据补（评-10 · 2.4 增补——与实跑件① 同级）**
- **manifest 路径模式** = `manifestPath(cwd)` = `sessionPath(cwd) + ".manifest"`（核 `thincoder-core/session-slots.mjs:99` ∕ `:92-95`）⇒ `<sessions 根>/<sha1(normalizeCwd(cwd))>.json.manifest`；sessions 根 = `configDir/sessions`（核 `session-slots.mjs:89`；测试缝 `_setSessionsDirForTest` 可改根）；
- **前置态断言** = 起 app 于项目 A 完成一次会话动作（打开即续 ∕ 新建）⇒ 复读 A manifest：`slotSessions` 含**本应用进程条目**——识别法 = 动作前后两读**值集差**（新增值 = 应用进程 sessionId `S`，形 `<pid>-<ts>-<rand>`；单源 = 核 `session-slots.mjs:64` `getSessionId`）；
- **本进程条目比对法** = app 内切 B 后复读 A manifest：`slotSessions` 值集内 **`S` 零残余**（逐条 `值 === S`）；加严可选 = 核 `_releaseStats.calls` 恰增（桌面主进程外观测受限 ⇒ 以盘面读为准）；
- **反例** = ① 同 path 重开（`receipt.cwd !== before` 假 ⇒ 释放分支不触发）：A manifest **mtime 零变**；② 无 manifest ∕ 零认领项目切出：`releaseClaimsAll` 早退 `false`、零写不造盘面（容忍形 = `thincoder-core/session-slot-claims.mjs:215-223`：无 manifest ∕ 零认领 ⇒ 零写 ∕ 永不抛出）；
- 落位 = `.thincoder/tmp/`（`test/files.mjs = []` 重建期）；批内单测随实施批补（原 G-2 行在册）。

**他批观察（报告 · 非本批处置）**：① `thincoder-desktop/src/main/ipc.mjs` 工作树带未提交改动（`git diff` 实读 = `msg:send` 注释块扩「非视觉带图径」句 + `aborted` 枚举，净 +1 行——他批在飞）⇒ 评-8 的 293↔294 差 1 之源；② `docs/batches/2026-09-29-parity-b8-ipc.md` §2.5 实施轮亦列 `ipc.mjs`（A7 = `:122` ∕ A8 = `:133`）——与 G-2 改面（`:116-125` 同函数）碰撞 ⇒ 排批注意（父侧）。

**上抛项更新（父侧裁）**：**⑤（新）** A4b 受占受理面——归批建议 = 随 G-2 同族轮面（或另批）；受理形 ∕ 词键未裁。**②（扩）** R5 ∕ R6 → **R5 ∕ R6 ＋ R13–R17**（B10 ∕ 清扫面）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（尾账核对轮 · 零实施）——发现表 + VERDICT + 计数**

抽验基础（实读 2026-09-29，逐处 file:line）：G-2 落点与核件语义成立（`thincoder-desktop/src/main/ipc.mjs:116-125` 已有 `before` ∕ `:123` 既有级联比较；`thincoder-core/session-slot-claims.mjs:215-223` 容忍形「无 manifest ∕ 零认领 ⇒ 零写 ∕ 永不抛出」；`thincoder-desktop/src/main/turn-driver.mjs:259-268` `abortSuspensions` 经 `forgetAll` 级联清装配 ⇒ 旧 cwd 本进程已无活绑定，与 VSC `panel-project.mjs:32-37` 的释放理由同判据）；`releaseClaimsAll` 桌面全树零消费（grep）；`session:<n>` 唯一命中 `src/main/session-io.mjs:14`；G-5 目标坐标 `panel-session.mjs:220-221` 命中判句 `slots.length <= 1`（:221）；A10 见证 `renderer/index.html` 零 `.rail` ∕ info ∕ tabs 槽；R6 对照成立（`renderer/chrome.css:156-260` 用 `.session-*`，`docs/desktop/design/UI.md:150-158` 仍写 `.rail-*`）；需求裁定句实读 `docs/desktop/requirements/PROJECT.md:31`；`test/files.mjs` = `export default []`（G-2 延后单测之由成立）；`scripts/doc-check.mjs` 在盘。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/覆盖 | 🟡 | 残留清册漏「活的 rail 命名族」：`renderer/store.mjs:166` `deriveTabBadge`（消费 = `renderer/views/session-control.mjs:61` ∕ `renderer/views/statusline.mjs:84`）· `renderer/mount-sessions.mjs:252` `refreshRail`（会话列表唯一写路径，`renderer/app.mjs:36/:103/:212` 消费）· `renderer/i18n.mjs:102-108` ∕ `:263-269` `rail.*` 键族（该档 `:71` 自注「会话控制条残余族」）· `renderer/views/chat-guide.mjs:29-30`；A10 仅以 `needsCloseConfirm ∕ tabbar ∕ activeTab ∕ pendingClose` 四符号零命中证「状态面零残留」 | 2.1c 增行逐处列 `file:line` + 归属（收 W1 改名 ∕ 或按 KD-4 登记「保留（命名沿革）」并给由），使「零残留」句与其见证面同界 |
| 2 | Requirements/覆盖 | 🟡 | flow 批 §5.19-3 具名件未逐件落位：`renderer/views/settings.mjs:15 ∕ :276`（指已删 `views/info-row.mjs`）· `renderer/views/chat-tool.mjs:46` ∕ `renderer/views/chat.mjs:31`（指已删 `views/sessions.mjs:161`）等在盘未收；B3 仅「部分缺口 + 归属分包」，上抛②只覆盖 R5 ∕ R6 | §5.19-3 具名件按 R1–R7 体例补 mini 归属表，或在 B3 行显式写「本批不认领——随 B10 清扫面」 |
| 3 | Requirements/归因线 | 🟡 | A4 归因线只收「释放」侧：桌面端壳已备 `slotOccupancy` 转口（`src/main/session-slots.mjs:64`）却零消费（grep 实读）；VSC ∕ CLI 对位门在册（`panel-messages-session.mjs:52-57` ∕ `cmd-session.mjs:92`），核 `switchToSlot` 已内建占用语义（`thincoder-core/session-lifecycle.mjs:334-342`——受占不认领 + 释放旧认领）⇒ 残余 = 端层「受占 ⇒ 拒 ∕ 提示」策略面；2.4 载此 grep 事实但 2.1 ∕ 2.1c ∕ 2.2 无行收 | 增一行判定（缺口 → 顺带 ∕ 或「不适用（保留）」并给由，沿 A12 ∕ B4 体例），使 A4 归因线两侧对称 |
| 4 | Document ownership | 🟡 | G-2 改动面只列 `src/main/ipc.mjs`：级联枚举面未随动——`thincoder-desktop/src/main/turn-driver.mjs:254-258` 注释枚举级联五件 · `docs/desktop/design/PROJECT.md:110`（中止墓碑 ∕ 级联单源行）· `ipc.mjs:123` 行内枚举；且被 G-2 改行数的 `ipc.mjs` 不在 G-4 回填集（寄存器行 `docs/desktop/design/PROJECT.md:155` 现「293」+ 越 200 在册预案） | 改动面补三项：级联单源措辞一行 + `PROJECT.md:155` 行数随动 + 行内枚举随动；与 G-4 同笔 |
| 5 | Clarity | 🟡 | G-4 单行锚不命中：`:171`「→ 左列行」实读在 `docs/desktop/design/PROJECT.md:172`（`:171` = session-actions 行）；R7 区间 `:170-172` 含 session-maintenance 行而漏 `:173`（projects 行——G-4 亦改其行数） | 锚改逐行 `:172`（措辞）∥ `:171 ∕ :173`（行数），或区间改 `:171-173`；判据行同步 |
| 6 | Evidence | 🟡 | A9 第二消费坐标不成立：`thincoder-core/session-slots.mjs` 零 `groupSessionEntries` 命中（该档 `:208` = 行投影 `updatedAt: meta.updatedAt ?? meta.ts`）；`:208` 的 session-stale 转口实在端壳 `thincoder-desktop/src/main/session-slots.mjs:208`，且该行转口 = `listStaleCwds`（非 `groupSessionEntries`）。结论仍由 `projects.mjs:15` 成立 | 路径 ∕ 符号按实读收正（或改述为「端壳同源档另一出口转口」） |
| 7 | Affected-file annotations | 🟡 | W1「（＋R3 ∕ R4 顺带候选）」使该波文件集不定：若采纳则 `src/main/suspension-drive.mjs`（327 行）· `renderer/views/statusline-segments.mjs`（199 行）被改却不在受影响文件表（判据 8 要求逐件标注；`PROJECT.md:158` 载该档「注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计」拆点窗口） | 二选一：把 R3 ∕ R4 从 W1 摘出另册上抛，或在受影响文件表补两行「注释 1 处 ∕ ±0」 |
| 8 | Numeric/口径 | 🔵 | 2.2 表声明「行数 = `wc` 同源」但 `ipc.mjs` 记 294（= read 工具实读口径；寄存器行 `PROJECT.md:155` 记 293）；同表其余三件按 wc 记（45 ∕ 45 ∕ 73） | 表内逐件标口径或 ipc 记 293；层判定不受影响（294 + 4 = 298 < 300） |
| 9 | Numeric/口径 | 🔵 | G-4「统一回填 read 口径」只动 3 行，而 §4.1 其余行按现行口径记（抽验 8 行皆 read − 1：`session-slots.mjs` 在册 226 ∕ read 227 · `turn-driver.mjs` 275 ∕ 276 · `sessions.mjs` 45 ∕ 46 · `session-actions.mjs` 73 ∕ 74 · `projects.mjs` 120 ∕ 121；annex `:119` 同件 = read 口径 121 ∕ 46 ∕ 74）⇒ 回填后同表混口径 | 表头声明本表行数口径（或全表统一）；否则按设计自订「差 1 不入判」维持现状 |
| 10 | Acceptance | 🔵 | G-2 探针②「本进程零残余」观测法未定（判「本进程条目」= sessionId 逐条比对 ∕ 前读后读 diff）；2.4 复跑配方只含实跑件① | 补探针②判据（manifest 路径模式 + 比对法 + 前置态「A 认领在盘」断言），与实跑件① 同级 |

计数：🔴 0 · 🟡 7 · 🔵 3。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 依据 = 用户 2026-09-29 令「都处理 ∕ 赶紧跑完」+ 排空授权三条件）

**三条件齐备** ✓：① **设计评审 pass** ✓（§3 轮次 1 · 🔴 0 · 🟡 7 ∕ 🔵 3 全收）；② **修正轮已落地并逐条核验** ✓（§2.8 修正块 `:103-166`——父侧抽核逐处读回：R8–R19 ∕ A4b ∕ G-2 补 ∕ G-4 锚 ∕ A9 坐标 ∕ W1 归位 ∕ 口径自洽 ∕ 探针②判据）；③ **token 在位** ✓（评审 #141 签发）。

**授权面**：W1（G-1 ∕ G-3 ∕ G-4 ∕ G-5 ＋ R3 ∕ R4——零语义收正）∥ W2（G-2 认领释放 + 级联枚举随动；产品码）。**A4b**（受占受理半幅）= 顺带归置（受理形 ∕ 词键未裁——随轮面）。
**实施舱划分**：码面（注释 + `ipc.mjs` + `turn-driver.mjs`）= eng-coder；文档面（`PROJECT.md` 三处）= eng-designer。**排批注**：`ipc.mjs` 与 B8 实施面同档——调度器按 files 串行（不手排）。
**真机 ∕ 探针**：探针②（释放零残余）由父侧跑（`test/files.mjs = []` 重建期 · 落 `.thincoder/tmp/`）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-29 尾账批码面 W1+W2；内审 clean · 自评审 pass · fix 0 轮；探针②归父侧）



### 实施记录（尾账批码面 · W1 零语义收正 ＋ W2 产品码）

**范围与边界**：码面 7 档 = 批档 §2.2 ∕ §2.8 七 受影响集；`docs/**`（PROJECT.md 三处 = 文档舱）· 测试面 · §2 ∕ §3 ∕ §6 零触。清单外改动 = 0（探针件 `.thincoder/tmp/b9-w2-selfcheck.mjs` = 设计指定落位 scratch —— §2.2 G-2 ∕ §2.8 十「探针落 `.thincoder/tmp/`」，非测试面）。

**逐处改动（号 → file:line）**

| 号 | file:line | 改动 |
|---|---|---|
| G-1 | `thincoder-desktop/src/main/session-io.mjs:8` | 「多标签 / 跨端切槽」→「切会话 / 跨端切槽」（注释） |
| G-1 | `thincoder-desktop/src/main/session-io.mjs:14-15` | 死名 `/session:<n>` → 「会话键（`String(slot)`）」（注释） |
| G-3 | `thincoder-desktop/src/main/sessions.mjs:3` | 「→ 左列行」→「→ 会话控制条目」（注释） |
| G-3 | `thincoder-desktop/src/main/sessions.mjs:13` | 「非左列所需」→「非会话控制条目所需」（注释） |
| G-5 | `thincoder-desktop/src/main/session-actions.mjs:9` ∕ `:60` | 引 VSC 坐标 `:217-218` → `:220-221`（抽验：判句 `slots.length <= 1` 命中 `panel-session.mjs:221`） |
| R3 | `thincoder-desktop/src/main/suspension-drive.mjs:169` | 「切标签零影响」→「切会话零影响」（注释） |
| R4 | `thincoder-desktop/renderer/views/statusline-segments.mjs:180` | 「与标签条 / 左列同源同投影」→「与会话控制条目同源同投影」（注释） |
| G-2 | `thincoder-desktop/src/main/ipc.mjs:34` | ＋import `releaseClaimsAll`（核直取 `@thincoder/core/session-slots-manifest.mjs`；VSC `panel-project.mjs:10` 同 specifier） |
| G-2 | `thincoder-desktop/src/main/ipc.mjs:124-127` | `openProjectChannel` 级联块：`if (receipt?.cwd !== before) { agentHost?.abortSuspensions(); if (before) releaseClaimsAll(before) }` —— 语义等价 §2.2 条件 `receipt.cwd !== before && before`；行内枚举注释随动 |
| G-2 | `thincoder-desktop/src/main/turn-driver.mjs:258-259` | `abortSuspensions` 级联枚举注释补「旧 cwd 认领释放」 |

W1 五档 = 纯注释（零行为）；W2 = 唯一行为改动（一行 + 注释随动）。

**读数**
- `node --check` 7/7 通过（ALL-7-SYNTAX-OK）；`npm test` 空清单绿（重建期在册，`test/files.mjs = []`）。
- 词族四查（`session:<n>` ∕ `左列` ∕ `切标签` ∕ `标签条`）：W1 五档零命中；树级余命中 = 他档历史注记形（KD-4 保留面）。
- 行数（`wc` 同源 = 尾换行不计）：`ipc.mjs` **298**（=294+4，<300 顾问线）· `turn-driver.mjs` **276**（本批净 +1）· `session-io.mjs` 46 · `sessions.mjs` 45 · `session-actions.mjs` 73 · `suspension-drive.mjs` 326 · `statusline-segments.mjs` 198 —— 全 <500 硬限。
- `git diff` 净行：`ipc.mjs` +4（他批 `msg:send` hunk 原样未动）· `turn-driver.mjs` 本批净 +1（他批降级窗 hunk 未动）· 其余五档 ±0（唯本批 hunk）。
- 行为自检（代码层；`.thincoder/tmp/b9-w2-selfcheck.mjs`）：**4/4 PASS** —— ① 无 manifest ⇒ `false` ∕ 零写；② 本进程认领 ⇒ `true` ∕ 零残余；③ 他端认领 ⇒ `false` ∕ 零写（mtime ∕ 字节不变）；④ 混合 ⇒ 值条件删除只删本进程。
- 释放调用点可达 = `ipc-registry.mjs:28`「`project:open` → `openProjectChannel`」＋ 预载白名单（`preload.cjs:25`）。
- 真机探针②（app 切项目实测）＝ 父侧跑（本舱未出真机）。

**决策透明表**

| 决策点 | 取值 | 由 |
|---|---|---|
| 释放 import 面 | 核直取 `@thincoder/core/session-slots-manifest.mjs` | §2.2 G-2 载明单源；VSC 同 specifier 先例；端壳 `session-slots.mjs` 未转口该名（走端壳需改第二档 = 清单外） |
| 释放行形态 | 单谓词块（cwd 变判定单点） | 与 §2.2 条件语义等价；防两处谓词漂移 |
| 释放序 | `abortSuspensions()` → `releaseClaimsAll(before)` | 先中止 ⇒「切出后零活绑定」为真；墓碑（`revokeTurns`）保证陈旧回合尾零落盘 ∕ 零重认领 |
| W1 术语 | 「会话控制条目」∕「切会话」 | §2.8 指定（G-3 ∕ R3） |

**审计与代码评审轮次与终态**：内审（explore 只读 divergence audit）1 轮 → **clean**（部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 清单外改动 四类全零）；自评审（advisor code review）1 轮 → **pass**（0🔴；3 行非阻塞：`suspension-drive.mjs` 326 行超 300 线 = §2.8 七 已裁定 ∕ `ipc.mjs` 298 行余量提示 🔵 ∕ `session-actions.mjs:20` 措辞歧义 🔵）。**fix round = 0**（无 must-fix）。终态 = **clean**。

**边界诚实项**：① 词族余量（`statusline.mjs:11` ∕ `session-io.mjs:30 ∕ :43`〔label 义〕∕ `session-actions.mjs:20`）—— 非本批文件集 ∕ 非定件坐标，语义未取得判据（unverified），列报父侧；② 文档面回填候选（另一舱）：`PROJECT.md:155`（ipc 行 → 298）· `:157`（turn-driver 行 275 vs 现盘 276）· `:168`（「多标签」镜像措辞）；③ 探针② 真机面 = 父侧。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：W1 零语义收正（G-1 ∕ G-3 ∕ G-5 ＋ R3 ∕ R4——五档注释；词族四查零命中）· W2 产品码（G-2 释放行 `ipc.mjs:124-127` ＋ 级联枚举注释随动 `turn-driver.mjs:258-259`）· 文档面（`PROJECT.md:172 ∕ :110 ∕ :155` 三处 + 两行回填 `:157` 276 ∕ `:168` 镜像句——父侧直执行 · 可 revert）。

**读数（父侧亲跑 · 冻结版）**：
- **探针②（真机面 · 探针件 = `.thincoder/tmp/b9-w2-probe2.mjs` · 隔离家 + `--user-data-dir`）**：**5/5 PASS**——boot=ok · ① A manifest 认领在位（S=`<pid>-…`）· ② 切 B 后 A 的 S **零残余**（逐条值检查）· ②&apos; B manifest 新认领在位 · ③ 同 path 重开（cwd 未变）⇒ mtime 零变（释放分支不触发）。
- W1 词族 grep 零命中（`session:&lt;n&gt;` ∕ `左列` ∕ `切标签` ∕ `标签条`）；`node --check` 7/7；行数（wc 口径）：`ipc.mjs` 298 ∕ `turn-driver.mjs` 276 ∕ `session-io.mjs` 46 ∕ `sessions.mjs` 45 ∕ `session-actions.mjs` 73 ∕ `suspension-drive.mjs` 326 ∕ `statusline-segments.mjs` 198（≤500 内）。
- 行为自检 4/4（核函数级）· 内审 clean · 自评审 pass · fix round 0。

**结算面（D7）**：#573 → **已核销**；A4b（受占受理半幅）= 顺带归置在册（受理形 ∕ 词键未裁——随轮面）；上抛②扩（R13–R17 → B10 ∕ 清扫面）在册；`ipc.mjs` 与 B8 同体档 = 调度串行（在册）。
**状态行**：已收口 2026-09-29。
