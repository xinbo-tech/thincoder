# 2026-09-29 · doc-sync-carryover
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 20:39 直令「赶紧都清了」——池面 triage 产出：文档随动族合批（台账 #639 ∕ #644 ∕ #646 ∕ #647 ∕ #648 ∕ #650）。
> 台账 = #639 ∕ #644 ∕ #646 ∕ #647 ∕ #648 ∕ #650（文档随动族 · 归批）。前情 = 无（独立批——承各批收口「随下笔」残留）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（2026-09-29 20:42 · 立批——设计轮已派）

- **来源** = 用户 20:39 直令「赶紧都清了」；触发 = 池面 triage——今日各批收口残留的**文档随动族**合批清理（零语义收正，各条判据/证据在台账行）。
- **本批条目（六条 · 台账指针）**：
  - **#639**：`thincoder-desktop/src/main/agent-bridge.mjs:26 ∕ :280` 注句仍引 `agent.mjs:285`（onWait 旧址）——改指核 `chat-call.mjs:33`（代码注释级）。
  - **#644**：`PROJECT.md` 坐标族 5 处（`:847` ∕ `:54` ∕ `:175` ∥ 实读 318 ∕ `:105` ∕ `:464`）+ 链序注漏 `core-markdown`（沿革性）。
  - **#646**：`UI.md:168` 措辞第三形（会话控制面条体）+ 仓根 `README.md:4` render-core 并存句（产品文本面——设计轮给处置建议）。
  - **#647**：doc-check 残族——死引用 ∥ 陈旧数（`PROJECT.md` §4.1 四处）∥ 坐标 3 处 ∥ 2 句 ∥ 注释残 2 处（**需求档部分 = 父侧笔——设计师零触、清单上抛**）。
  - **#648**：端差批文档残五点（`UI.md:93` ∥ `PROJECT.md:79/:530/:863` ∥ `WEBVIEW-PROTOCOL.md:122`）。
  - **#650**：文档值随动族（chat-scroll ∥ activity-new ∥ chat-model ∥ frame-dispatch ∥ RENDER-CORE 估值 + `PROJECT.md:1087/:1089` CH ∥ CJ 转「已落」+ doc-check 行数面差异 11 条——**届盘重读为准**）。
- **口径**：零语义收正（坐标 ∥ 计数 ∥ 措辞 ∥ 注记）；改前逐处实读（禁低置信批量改指）；需求档零触（父侧笔）；冻结批档零触。
- **边界**：产品码仅 #639 两注释行；其余零产品码。
- **授权** = 13:52 ∕ 17:02 全权（代点火+代批+代签）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（文档随动族收正轮（六条台账残留逐条收正；doc-check 届盘复跑：悬空 30 = 基线 · 行宽 65 ≤ 基线 66 · 行数面差异 1 条留 RF 波 4））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批次任务与设计（eng-designer · 2026-09-29 · 文档随动族收正轮）**

### 任务面
承 §1 六条台账残留（#639 ∕ #644 ∕ #646 ∕ #647 ∕ #648 ∕ #650）——逐条「原处读 → 现盘实读 → 改 → 复读」**零语义收正**（口径 = 坐标 ∕ 计数 ∕ 措辞与现盘对齐，不新增语义）。**零触面**：产品码（除 #639 两注释行）· 需求档 · 冻结批档 · 不发评审。

### 六条处置（逐条）
- **#639（已落）**：`thincoder-desktop/src/main/agent-bridge.mjs:28 ∕ :287` 两注句 `agent.mjs:285` ⇒ `chat-call.mjs:33`（实核 `chat-call.mjs:33` = `onWait: callbacks.onWait`）。**报告级发现（未改——超「两行」授权）**：`:283` 的 `agent.mjs:353`（onUsage 引）亦陈——实核现址 = `thincoder-core/agent/turn-loop.mjs:154`。
- **#644（已落）**：① T-DSK20（`PROJECT.md:901`）`chrome.css:145` ⇒ `session-list.css:16`；省略三件 `:188-189 ∕ :203-204` ⇒ `:59-60 ∕ :74-75`。② KD-16（`:54`）接线面指针 ⇒ `session-wire.mjs`（`deleteSession:168` ∕ `takeover:191`；`openSession` 写者 = `events.mjs:237`、调用面 = `session-wire.mjs:81`）。③ `:176` agent-bridge 表行 **325 = 实读 325**（已由后续轮收正，仅注明）。④ `:105` 切走会话坐标 `mount-sessions.mjs:125-128` ⇒ `session-wire.mjs:123`（`activateSession`）。⑤ `.session-ledger-notice` 落点 `:222` ⇒ `session-list.css:93`。**报告项（产品码 · 零触）**：`index.html:19` 链序注漏 `core-markdown`——相邻五产品档头注使实序 = `chat-fixes → core-markdown → core → …`（归桌面 CSS 注释轮）。
- **#646（已落）**：`UI.md` 五处「会话控制面条体」⇒「会话控制面」（`:27 ∕ :65 ∕ :66 ∕ :164 ∕ :167`；先例 = E2E-TESTING「会话控制面项目钮」）；仓根 `README.md:4` 补 render-core 并存句（产品文本面）。
- **#647（已落 + 上抛）**：① 死引用族——`docs/core/design/DOC-DISCIPLINE.md` **12 处**（§3.4 ∕ §3.8 ∕ §4.2.7 ∕ §5）收正为「批次本地件（自测护栏惯例——名随批次档）+ 常驻重建挂台账 #590 面」（句式沿本档 `:1336` doc-check-face 已收正形）；`docs/core/design/CONFIG.md:149` `DOC_CHECK_NESTED` 行 ⇒ 退场句；`docs/cli/design/CLI-DEBT.md` B8 行（`test/doc-check.test.mjs` **340**）移 `§4-D5` + 表 B 计数 **8 ⇒ 7**。② 四处陈旧数（`:299 ∕ :302 ∕ :303 ∕ :305`）已由队列边缘文档轮收正（复核注明）；⑤ ≈265 已由性能尾账轮收正（注明）；⑥ `UI.md:432` `i18n-views` **282 ⇒ 332**。③ 坐标二处收正：`DOC-DISCIPLINE.md:928`（`:21 ⇒ :25`）· `DOC-MIGRATION.md:313`（`:20-33 ⇒ :24-38`）；第三处 `PROJECT.md:393`（原 :384——`:22-24` 引）**未改**——届盘实读该句前提已变（现盘 `PROJECT-MANIFEST.json` docRoot = 五根含 desktop 两树，「仅 docs 一域」失据）⇒ 留待原报告批 ∕ 下一文档轮指认（不猜）。④ `docs/core/design/ENGINEERING-MODE-V2.md:154` 校验句补「`checkConfig.lineCounts` 元素层形态（#546）」（对齐 `MANIFEST.md:99`）。**上抛**：需求档 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:39` 同族引 = 需求档笔权（主 agent）。**报告项（产品码 · 零触）**：`views/chat-guide.mjs:26` ∕ `views/chat-model.mjs:66` 注句死引 `doc-check.test.mjs`。
- **#648（已落 4/5）**：① `UI.md:93` 计划行条改述归核体（端壳 `planCardNode` 直取 `thincoder-render-core/cards/panel.mjs` `renderTaskPanel`；端侧零行构树）。② `PROJECT.md:79` KD-39 按 #627 收正（打开能力 = 外部编辑器 CLI 探测 + `shell.openPath` 兜底——实现 `thincoder-desktop/src/main/editor-open.mjs`）。③ `:539`「`onTurnEnd` ⇒ `turnBreak`」⇒「`onSubTurnBreak` ⇒ `turnBreak`（#628 窄义改挂）」。④ `:902` T-DSK21 大 patch 句按核卡时代改述（`.diff-preview` 全量 + `.view-diff` 单径 `file:open`；apply_patch 形 ⇒ 钮退场——#629）。⑤ `docs/vsc/design/WEBVIEW-PROTOCOL.md:122`（`onTurnEnd` 引）**未定位应改点**——届盘实读 VSC `panel-turn-loop.mjs:113 ∕ :123 ∕ :221` 仍以 `onTurnEnd` 为工具推送腿（#628 = VSC 零码改），句与代码一致 ⇒ 留待原报告批指认（不猜改）。
- **#650（已落 + 1 留）**：①②④ 全落——`chat-scroll` 103 ⇒ **109** ∕ `activity-new` 109 ⇒ **112**（口径 = `wc -l` ∕ doc-check 实读）· `chat-model` ≈95 ⇒ **104** · `RENDER-CORE.md:340` `frame.mjs` ≈60 ⇒ **69**、`stream.mjs` ≈135 ⇒ **135** · CH ∕ CJ 两行「落点 = 下一…轮」⇒「**已落**（desktop-residuals-round3 波 C——2026-09-29）」。⑤ 行数面 **17 行收正**（PROJECT.md §4.1；值以 doc-check 实读为准、逐行届盘复读）；**`views/activity.mjs`（154 ⇒ 181）留**——RF 波 4（#608 留端未接）在飞 · 档属其射程邻位 ⇒ 留待 RF 收口轮。③ RF `suspActiveOf` 措辞 = RF 收口轮承运（留、注明）。

### 受影响文件（10 档）
`docs/desktop/design/PROJECT.md`（§4.1 18 处值 ∕ KD-16 ∕ KD-39 ∕ §2.2 ∕ §4.2 三处 ∕ T-DSK20 ∕ T-DSK21 ∕ CH ∕ CJ + 变更记录）· `docs/desktop/design/UI.md`（5 措辞 + `:93` + `:432` + 变更记录）· `thincoder-desktop/src/main/agent-bridge.mjs`（:28 ∕ :287）· `README.md`（:4）· `docs/core/design/DOC-DISCIPLINE.md`（12 处 + `:928` + 变更记录）· `docs/core/design/CONFIG.md`（`:149` + 变更记录）· `docs/cli/design/CLI-DEBT.md`（B8 ⇒ `§4-D5` + 计数 + 变更记录）· `docs/render-core/design/RENDER-CORE.md`（§6 两估值 + 变更记录）· `docs/core/design/ENGINEERING-MODE-V2.md`（`:154`）· `docs/core/design/DOC-MIGRATION.md`（`:313`）。

### 验收（机器可验）
1. `node scripts/doc-check.mjs`（届盘复跑）⇒ 悬空 **30**（= 基线 30——零新增；中途一处 `cards/panel.mjs` 相对形悬空已按全形收正归零）· 行宽 **65**（≤ 基线 66）· 行数面差异 **1 条**（仅 `views/activity.mjs`——RF 波 4 留项）· 拟新增 27 ∕ 迁移期引文 298（= 基线）。
2. 复读（D6）：改后原处抽读 ≥5 档（agent-bridge ∕ README ∕ UI.md ∕ PROJECT.md ∕ DOC-DISCIPLINE ∕ CLI-DEBT ∕ CONFIG ∕ RENDER-CORE）通过；「会话控制面条体」现役面归零（仅变更记录面 1 处历史述）· `agent.mjs:285` 于 agent-bridge 归零。
3. 冻结批档零触 · 需求档零触（合规面）。

### 边界（本批不做）
产品码（除 agent-bridge 两注释行）· 需求档 · 冻结批档 · 其余死引用族（`thincoder-cli/test/*.test.mjs` 坐标族 = #435 ∕ #469 扫面；E2E-TESTING 等档陈旧数族）· RF 波 4 留项 · 上抛项落笔。

### 上抛 / 报告项（主 agent 裁）
① 需求档 `…SPEC-MACHINE-CHECK.md:39` 同族引（需求档笔权 = 主 agent）。② 产品码注释族：`agent-bridge.mjs:283`（`agent.mjs:353` ⇒ `turn-loop.mjs:154`）· `chat-guide.mjs:26` ∕ `chat-model.mjs:66`（`doc-check.test.mjs` 死引）· 桌面五 CSS 头注链序漏 `core-markdown`（`index.html:19` 实序）。③ `WEBVIEW-PROTOCOL.md:122` 未定位项。④ `PROJECT.md:393` 坐标未定项。⑤ `views/activity.mjs` 行数留项。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**状态行**：✅ 已收口 2026-09-29

- **交付核验（父侧）**：① 抽读回验 2 处——`thincoder-desktop/src/main/agent-bridge.mjs:28`（注句已指 `chat-call.mjs:33` ✓）∥ `docs/desktop/design/PROJECT.md:473`（`.session-ledger-notice` 落点 `session-list.css:93` + 「修正轮 2 按盘收正」注 ✓）；② `doc-check` 届盘读数（#96 报）：悬空 **30**（= 基线，零新增；1 处相对形悬空已收正）· 行宽 **65**（≤ 基线）· 行数面差异 **1**（`views/activity.mjs`——RF 波 4 邻位留）· 拟新增 27（= 基线）。
- **逐条结算**：**#639 ✓**（两注句收正；第三处引号级发现如实报告）∥ **#644 ✓**（五处：T-DSK20 ∕ KD-16 接线面 ∕ `:105` ∕ `:473` + `:176` 注明）∥ **#646 ✓**（五措辞 + `README.md:4` 并存句）∥ **#647 ✓**（12 死引 + 2 坐标 + EM-V2 校验句收正；残项 → #662 ∥ #654）∥ **#648 ✓**（4/5 收正；⑤ `WEBVIEW-PROTOCOL.md:122` 经核 = **句与现盘代码一致 ⇒ 非缺陷**——假阳消化）∥ **#650 ✓**（§4.1 十七行 + `chat-model` 104 + RENDER-CORE 两估值 + CH ∕ CJ 转已落；`activity.mjs` 行留 RF 收口轮）。
- **残族归宿**：**#662**（`PROJECT.md:393` 句重写 + 码注四件——归批）∥ **#654**（父侧需求档笔族——吸收 SPEC-MACHINE-CHECK:39 + #469 requirements 12 档 24 行）∥ RF 收口轮（`activity.mjs` 行数）。
- **台账**：#639 ∕ #644 ∕ #646 ∕ #647 ∕ #648 ∕ #650 → 已核销（残族另册续办）。
- **收口对账（D7）**：角色表 = §1（主 agent）∕ §2（设计师逐条表）∕ §6（本行）；状态行 = 本行 + §1 冻结；计数 = 台账六条核销 + 残族两行在册；指针 = 各档坐标届盘实读；冻结 = 本档随 §1 冻结。
