# 2026-09-28 · 状态栏对齐（屏面为准）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 05:34 走查「关于『对齐』二字，你我分歧真的是很大」+ 05:38「这还要怀疑吗？！」裁定——标尺 = 屏面（同刻同信息 · 形态该像的像）；「旁置 / 不适用」等账面打折项逐项重审。
> 台账 = #483（桌面需求档 · 归批）。前情 = 2026-09-28-desktop-vsc-visual-parity（同主题：对齐——本批承接「屏面为准」标尺收正）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-28 05:34 走查「关于『对齐』二字，你我分歧真的是很大」+ 05:38「这还要怀疑吗？！」——**裁定：标尺 = 屏面**（「对齐」以屏面可见行为准；「旁置 / 不适用 / 缺入站面」等账面打折项逐项重审，不得静默打折）。

### 1.2 已核事实（父侧源码直读）

- **CLI 状态栏地面实况** = `thincoder-cli/src/tui/render-frame.mjs`：`renderStatus`（`:219-240`——banner 前缀 AUTO/PLAN/ADVISOR/ENG + 注意力 chip + 宽度预算）· `buildStatusLine`（`:344-428` 段集）。**打开态（静息）可亮** = statusText + `✓N/M`（tasks——盘面水合）+ context N%（ctxCache）+ title + **键位尾簇**（`:427` 固定注入）；有态时 banner / scroll / ledger 常驻标记 / timer；模态覆盖径（`:348-377`）整行替换。
- **桌面现状** = `thincoder-desktop/renderer/views/statusline.mjs` 12 段冻结集 + 跨会话告警位；UI.md `:105-125` 15 段逐项裁定表（承载 12 · 旁置 2 · 不适用 1）。
- 首版差表（父侧）：① 静息状态词——CLI 常显首位 / 桌面无该段【**重审①**】② tasks / context——D17 在飞（残余批 #26）【在飞】③ title——已闭 ④ 键位尾——桌面裁「不适用」（用户 09-26 裁定只覆盖「斜杠命令不是必须项」）【**重审③**】⑤ banner——桌面旁置会话头 + 裁「PLAN/ADVISOR 本端无该两态」（桌面有 planMode 槽 / advisor 配置——该裁待核）【**重审②**】⑥ 滚动位——桌面旁置药丸【**重审④**】。

### 1.3 批面

四项重审 + 打开态逐段对读差表（含每段处置：补 / 明确同义 / 坐实理由）；需求侧 = **D22**（同笔）；链 = 设计 → 评审 → 批准 → 实施。

### 1.4 追加条目（父侧 · 2026-09-28 06:1x——「挂账不修」整治）

两条原拟另行挂账、现**就地并入本批**（非独立债）：

- **① #491（`flags` 落地 ⇒ U175 首屏回执键集锁例同笔更新）** —— 归本批**实施面**：实现时 U175 键集锁例随 `flags` 键同笔更新（预期内红转绿），不另立账。
- **② #490（D17 播种窄窗「零覆盖语义」）** —— 归本批**设计面**（定形 = 播种只填空白——切片已有活数据 ⇒ 零写；落点 = `UI.md` D17 注 + 用例面；与 `renderer/events.mjs` 同域）；已 steer 修正轮 #30 作第 11 项一并落。

**§1.4 订正（父侧 · 06:1x）**：第 ② 项（#490 零覆盖语义）的 steer **因 #30 已先结算而未达**——该项改随 #30 报告落定后的**微轮**落（并入本批设计面不变；批档 §1.4 前文的「已 steer…一并落」以本订正为准）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 修正十条全落 + 收尾微轮两项全落（评审轮 2 发现 2 + #490）· doc-check 悬空 47 / 行宽 31（净增 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（initial 轮 · 「屏面为准」重审 · banner 落点 = 父侧裁定 **A**）

### 本批条目（覆盖）

需求 §4 **D22**（状态栏对齐 · 屏面为准 · 台账 #483）——本批覆盖：① 打开态逐段差表（15 段行逐段处置）② 四项重审裁定 + 判据句 ③ 屏面形态落点（`thincoder-desktop/renderer/views/statusline.mjs` / UI.md 15 段表 / 会话头回三值）④ 验收 = 打开态真机对照（T-DSK39）。
边界（不改）：CLI 源码（只读——判据源）· 核（`thincoder-core/**` 零改）· 其他在途批面（#26 残余批已闭 tasks / context 两项——本批不重开）。

### 打开态逐段差表（CLI 段 × 打开态形态 × 桌面处置）

| # | CLI 段 | 打开态 CLI 形态 | 桌面现状 | 处置 |
|---|---|---|---|---|
| 1 | banner 四态 | 真态时行首前缀（`PLAN│AUTO│ADVISOR│ENG│`） | 无（会话头 ON/OFF 两枚裸串） | **补（重审②）**——四态上状态行行首（段锚 `plan` / `auto` / `advisor` / `eng`）；会话头回三值 |
| 2 | 注意力 chip | 挂起时 chip | attention 段（`approval` 码） | 明确同义（打开态两侧皆无） |
| 3 | 状态文本 | 恒显（静息 `Ready`） | 无静息词（忙态「运行中」） | **补（重审①）**——`state` 段两态（就绪 / 运行中） |
| 4 | 当前工具 | 忙态内联 | tool 段（忙态） | 明确同义（打开态皆无） |
| 5 | 耗时 | 忙态内联 | elapsed 段（忙态） | 明确同义（打开态皆无） |
| 6 | 任务计数 | 有任务时 | tasks 段（D17 播种） | 明确同义（已闭——勿重开） |
| 7 | 回合 N/M | 有回合帧时 | turn 段 | 明确同义（回合域——打开态皆无） |
| 8 | 令牌 | 有计时 | tokens 段 | 明确同义（打开态皆无） |
| 9 | 上下文 % | 有读数 | context 段（D17 播种） | 明确同义（已闭——勿重开） |
| 10 | 滚动位 | 偏离底 `scrolled N` | 药丸 / 摘要块 | **维持旁置（重审④）** + 坐实（行数读数无对位物） |
| 11 | 台账标记 | 有台账时「台账 N·M」常驻（+ 超阈警示色） | ledger 段（只承超阈「可开批」）；计数住左列信息行 | 明确同义（计数 = 左列项目信息恒显；超阈 = 状态行） |
| 12 | 计时 ⏰N | 在途时 | timer 段 | 明确同义（打开态皆无） |
| 13 | 会话标题 | 有标题时 | title 段 | 明确同义（打开态两皆在场） |
| 14 | 输入提示（enterHint） | 恒显（静 `Enter: send` / 忙排队句） | queue 段（忙 / 有队；静息无） | **补（重审③）**——`enter` 段三态 |
| 15 | 键位组四件 | 恒显 | 无 | **不适用（重审③逐件）**：`/:`（09-26 裁定覆盖）· wheel/PgUp/PgDn（原生滚动自述）· Ctrl+I（本端无 inject 功能）· Ctrl+C（窗口级 + 同键异义） |

### 四项重审裁定（+ 判据句）

**① 静息状态词 = 补**——实读钉定：CLI 静息值 = `Ready`（`thincoder-cli/src/tui/tui-state.mjs:43`；回合尾回 `Ready` = `thincoder-cli/src/tui/agent-turn.mjs:301`）；桌面无该词。判据句：活动会话在位 ∧ 位标集 ∩ {`running`, `approval`} = ∅ ⇒ **就绪**（词键 `status.ready`）在场；含 `running` ⇒ 运行中；无活动会话 ⇒ 段零节点。
**② banner = 四态上状态行行首**（父侧裁定 = A；会话头回三值）——实读推翻旧裁：「PLAN / ADVISOR 本端无该两态」**不实**（`thincoder-core/session-lifecycle.mjs:115` `planMode` / `:124-127` `engineering` / `:132-134` `advisor` 随会话槽恢复可为真）。判据句：四态判定 = **活值口径**（与 CLI banner 同源 = `thincoder-cli/src/tui/render-frame.mjs:221-225`）——`planMode` ∨ `autoApprove` ∨ `advisor.guard === true` ∨ `agent.engineering === true` ⇒ 该段在场；假 / 缺 ⇒ 零节点（负向锁）。供面 = `history:page` 回执新键 `flags`（agent 在场时叠加；缺席 ⇒ 键缺席零写）——单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」。
**③ 键位尾 = 一件补 + 四件不适用**——`Enter: send`（enterHint 静息值）⇒ 补（表行 14 三态：静 `Enter: send` / 忙排队句 / 有队条数句）；`/:` · wheel/PgUp/PgDn · Ctrl+I · Ctrl+C ⇒ 不适用（逐件理由 = UI.md 15 段表行 15）。
**④ 滚动位 = 维持旁置**——药丸承载（判据单源 = `docs/desktop/design/RENDERER.md` §3）；判据句：偏离底部（`!following`）⇒ 药丸在场 · 回底 ⇒ 退场（同信息）；行数读数（HTML 渲染行 ≠ 终端行）无对位物 ⇒ 不搬；观感复核 = T-DSK39。

### 用例面（验收）

- **机检（构树级）**：`thincoder-desktop/test/views-statusline.test.mjs` 原址补例——段集 = 16 码闭集 + 序；banner 四段两态（flags 真 ⇒ 在场 / 假 / 缺 ⇒ 零节点）；`state` 两态；`enter` 三态；`STATUS_SEGMENTS.length = 16` 计数锁。
- **契约（main 侧）**：`thincoder-desktop/test/history-page.test.mjs` / `thincoder-desktop/test/session-contract.test.mjs` 原址补例——回执 `flags` 两向（agent 在场 ⇒ 四布尔 / 缺席 ⇒ 键缺席）。
- **词表**：`thincoder-desktop/test/views-chrome-vocab.test.mjs` 计数随动 **139 ⇒ 145**（新 6 键两语齐）。
- **真机（E2E · D16 义务）**：**T-DSK39 statusline-align**（新档 `thincoder-desktop/test/integration/statusline-align.test.mjs`（拟新增））——打开态逐段断言 + PNG 落点 `thincoder-desktop/test/artifacts/statusline-align.png`（父侧 CLI 同刻对照面）；断言序 = `docs/desktop/design/PROJECT.md` §7 **T-DSK39** 行。
- CLI 侧零改（只读判据源）。

### 尺度（受影响文件与行数 · 实施面）

| 文件 | 现行 ⇒ 预期 | 说明 |
|---|---|---|
| `thincoder-desktop/renderer/views/statusline.mjs` | **256 ⇒ ≈310** | banner 四段 + 状态词两态 + 输入提示三态 + 段闭集 12 ⇒ **16**；越 300 建议线 ⇒ 拆档预案 = banner 段组拆出 `thincoder-desktop/renderer/views/statusline-banner.mjs`（拟新增 · 预计 ≈45） |
| `thincoder-desktop/renderer/views/chrome.mjs` | **163 ⇒ ≈150** | 会话头回三值——`FIELD_ORDER` 撤两键 |
| `thincoder-desktop/renderer/i18n.mjs` | **407 ⇒ ≈420** | 词键 +6（两语同形）——139 ⇒ **145** |
| `thincoder-desktop/renderer/events.mjs` | **≈470 ⇒ ≈478** | `META_FIELDS` 三键 + `flags` 切片写 |
| `thincoder-desktop/renderer/mount-status.mjs` · `renderer/store.mjs` | **24 ⇒ ≈26** · **328 ⇒ ≈332** | `STATUS_KEYS` 增键 · `sessionFlags` 初形 |
| `thincoder-desktop/src/main/ipc.mjs` · `agent-host.mjs` · `session-slots.mjs` | **214 ⇒ ≈222** · **≈300 ⇒ ≈315** · **≈195 ⇒ ≈195** | 转口叠加 `flags` · `flagsOf(key)` 活值投影 · `slotMeta` 三值收正（净 0 行） |
| `thincoder-desktop/test/**` | 随动 + 新档（拟新增 · ≈110） | 六档原址补例 + 集成新档 + `test/files.mjs` 22 ⇒ 23 |
| 设计档（UI.md / IPC.md / PROJECT.md / E2E-TESTING.md） | **已落**（本批设计轮） | 见「设计档落点」 |

### 设计档落点（已落）

- `docs/desktop/design/UI.md`：§1 增**本批注（状态栏对齐 · 屏面为准）**（打开态段集 16 · 四项重审裁定 + 判据句 · 计数随动 · 桌内翻转 open）+ 15 段表就地收正（行 1 旁置 ⇒ **承载** · 行 3 两态词 · 行 10 坐实 · 行 14 三态 · 行 15 逐件 · 计数行 12 ⇒ **16**）+ 会话头 / 状态栏两行指针。
- `docs/desktop/design/IPC.md`：§2 `history:page` 行补 `flags` + `meta` 收正**三值** + 增**「模式位投影注」**（六项）；`session:prefs` 行 / 会话级偏好注项 7 / 会话族注项 5 同笔。白名单 28 项 / 十二通道计数零动。
- `docs/desktop/design/PROJECT.md`：§2 增 **KD-30** + **KD-25 收正** · §4.2 本批行 · §6.1 表头 `D1–D22` + **D22 行**（D17 / T-DSK33 两处计数随动）· §7 增 **T-DSK39** 行 · §10 增 **AS / AT**。
- `docs/desktop/design/E2E-TESTING.md`：§4 增 `statusline-align.test.mjs` 行 + §6 增 `T-DSK39` 行 + 表下「按批读」同笔。

### 关键决策 / 上抛项

- **关键决策**：banner 落点 = A（四态上状态行 + 会话头回三值——父侧已裁；依用户 05:38 屏面标尺）· 段集 12 ⇒ 16 · `flags` 活值口径（零算法副本——与 CLI banner 判定同源）。
- **上抛项（AT）**：桌内翻转刷新（always 放行置位后 `flags` 即时刷新）**未落**——open（消解路 = 出站事件携 flags / 回合尾重投影——另批）；打开态验收面（D22 / T-DSK39）不受影响。
- **需求档 §3.1:47 / §3.1:52 收正 = 父侧同笔**（回复已确认）。
- **doc-check 读数**：悬空 **47**（= 基线 · 净增 0）· 行宽 **31**（= 基线 · 净增 0）· 拟新增 30 ⇒ 31（+1 = `statusline-banner.mjs` 预案行——「（拟新增）」格式列报不入闸）。

### 设计评审轮 1 修正（eng-designer · 2026-09-28）

来源 = §3 轮次 1 发现表 10 条（1🔴 / 7🟡 / 2🔵 · VERDICT = changes-required）；父侧逐条裁定接受 = 本修正轮射程。**逐号点修，十条全落**（禁全量重探；#8 = 并入本批定形）：

| # | 处置（号 → 改动） | 落点（file:line） |
|---|---|---|
| 1 🔴 | 「就绪」**入状态词闭枚举**（6 词 ⇒ 7 词）——词形来源**实读单列** = CLI 静息值 `Ready`（`thincoder-cli/src/tui/tui-state.mjs:43`）；核 i18n 全表实读**无同源词** ⇒ 例外注明（不假造「同源」） | `docs/desktop/design/UI.md:16`（闭集句）· `:111`（表行 3 括注）· `:204`（本批注项 3）· `:228`（借用项 9）· `:212`（§2 项 1 计数句）· `docs/desktop/design/PROJECT.md:68`（KD-30） |
| 2 🟡 | 五处 D 号档头 `D1–D21 ⇒ D1–D23`（实读确认需求档含父侧刚落 D23）+ AN 行同笔 | `docs/desktop/design/PROJECT.md:6` · `docs/desktop/design/UI.md:4` · `docs/desktop/design/IPC.md:4` · `docs/desktop/design/RENDERER.md:4` · `docs/desktop/design/SHELL.md:4` · `PROJECT.md:511`（AN 行） |
| 3 🟡 | 四项**逐项坐实 = 已落（R3a）**（实读：读数槽四住归约面 + `ev:usage` 两键扩 + `ev:activity` turn 首帧——非「缺入站面」，不再挂已结算 R3a） | `UI.md:113/115/116/120`（表行 5/7/8/12）· `:125`（计数行）· `PROJECT.md:63`（KD-25）· `:344`（D17 行）· `:507`（AH 行转已落 · 收口） |
| 4 🟡 | 口径收正 = **读数切片段（12）**；banner 四段补裁决句（**非 seed 面**——供面 = `flags`，每次页读皆携） | `UI.md:172`（播种面单源句）· `:183`（模式四位 bullet）· `IPC.md:124`（打开态播种注项 1） |
| 5 🟡 | 拆分预案**钉定 + 消解窗口**：**本批执行拆分**——装配面（`assembleFor` + `DEFAULT_DEPS` / `teamConfig` / `gitAuthor` / `validateProvider`）拆 `thincoder-desktop/src/main/agent-assemble.mjs`（拟新增 · ≈105 · 原路径同名 re-export）；随列越 300 段 | `PROJECT.md:112`（§4.1 行）· `:179`（越层段计数句）· `:192-194`（本批触碰四档行）· `:306`（§4.2 行） |
| 6 🟡 | T-DSK39 ① 步**点名真点路径**（最近目录项〔`project:open` + `data-path`〕⇒ 自动续会话开页；备路 = 会话行〔`session:switch`〕）+ **夹具前置**（第二枚临时目录作项目根 · 槽 `cwd` = `PROJ`） | `PROJECT.md:415`（T-DSK39 行）· `docs/desktop/design/E2E-TESTING.md:163`（§6 行）· `:128`（§4 行） |
| 7 🟡 | **段序单源定谳**：判据句 = 实读 CLI（`:229-230` chip → `:221-225` banner〔PLAN → AUTO → ADVISOR → ENG〕→ `:427` 状态段簇）+ 明写「表列序 = 逐项裁定序，判据序 = `STATUS_SEGMENTS`」 | `UI.md:105-106`（表头注）· `:197-199`（本批注项 1） |
| 8 🟡 | **并入本批定形**（见下「#8 定形」）；open 登记撤销 | `UI.md:209-211` · `IPC.md:68`（回执行）· `IPC.md:139`（投影注项 5）· `PROJECT.md:305-307`（§4.2 行）· `:517`（AT 转已裁） |
| 9 🔵 | T-DSK33 机检面**改指已落档** + 本批原址补例面 | `PROJECT.md:409`（T-DSK33 行） |
| 10 🔵 | §4.1 补 **R3 期六档行**（`statusline` / `mount-status` / `subagent-face` / `chat-text` / `chat-cards` / `core.css`）+「单源」口径收正 | `PROJECT.md:161-166`（六行）· `E2E-TESTING.md:139`（口径句） |

**#8 定形（桌内翻转即时刷新 · 最小可落路径）**：`approval:respond` **成功径**回执叠加 `{ key, flags }`（宿主 `flagsOf(key)` 活值投影——与 `history:page` 回执**同一函数**，零算法副本；提问门径 / 失败径零叠加）⇒ 渲染面 `submitVerdict` 以回执写 `sessionFlags[key]` 切片（写点 = 归约面纯动作 `applyFlags`，与页读同点）⇒ 状态行随切片重挂（`STATUS_KEYS` 已含该键）。
零新通道 / 零新白名单项 / 零乐观写。用例面 = `thincoder-desktop/test/agent-host.test.mjs`（回执两向）+ `thincoder-desktop/test/events-page.test.mjs`（`submitVerdict` 写切片 / 失败零写）+ `thincoder-desktop/test/views-statusline.test.mjs`（切片 ⇒ `auto` 段在场）。
射程边界（登记）：本路径闭合**桌内翻转**（always 放行置位）；**跨端翻转**（他端改本槽）仍以页读为刷新点——不在本批射程。

**随动（顺笔）**：§4.1 三值按盘收正（`ipc.mjs` **214**〔批 B 末 201 ⇒ R3b 增至 214〕· `run.mjs`·`files.mjs` **43 / 22**〔残余批集成档入册〕· `session-slots.mjs` **180**）；§4.2 events 值收正 **473 ⇒ ≈482**（`applyFlags` 导出）+ 增 `mount-pool.mjs` 行（57 ⇒ ≈63）+ 用例面补 `agent-host` / `events-page`。

**登记（报告面 · 不改）**：① 设计 §6.1 表头仍 `D1–D22` 且无 D23 行——D23（列表计数不撒谎）设计映射面归**台账可靠批**（`docs/batches/2026-09-28-ledger-reliability.md`），本批零写；② §4.1 尚有若干批间未回填值（`agent-bridge` 77 / `sessions.mjs` 34 / `session-slots` 154 / `events` 行「351 ⇒ 369 ⇒ 500」/ `i18n` 363 / `store` 313 / `chrome` 239 / `activity` 177 等）——盘点面回填留后续「按盘回填」轮；③ `PROJECT.md` 变更记录内 `D1–D21` 等历史记法按**记录面留档**不改。

**上抛（需求档面 · 归父侧）**：需求 §4 **D22** 主句「打开 / 切回既有会话（**及任意时刻**）」——桌内时窗已由 #8 闭合；「任意时刻」是否须含**跨端翻转** ⇒ 需求档措辞定尺 = 父侧笔权，本设计面不改。

**doc-check 读数**（`cd thincoder && node scripts/doc-check.mjs --root .`）：悬空 **47**（= 在册基线 47 · **净增 0**——新引未落档路径全带「（拟新增）」列报）· 行宽 **31**（= 基线 31 · **净增 0**——新行 ≤300，表格行按判据豁免）。零全仓勘察。

**收尾微轮（评审轮 2 发现 2 + #490 · eng-designer · 2026-09-28）**：逐项点修（fix 轮——禁全量重探；零全仓勘察）——两项落点齐：

| 项 | 处置（号 → 改动） | 落点（file:line） |
|---|---|---|
| ① 评审轮 2 发现 2 | 批 B 注项 1 残留括注「工程模式 / AUTO 两位不在本项，沿其既有点按出口」（指向已撤面——会话头回三值）⇒ 按父侧裁定句收正：**两态呈现面单源 = 状态行段**（指针 = UI.md §1「本批注（状态栏对齐 · 屏面为准）」项 2） | `docs/desktop/design/UI.md:41` |
| ② #490（§1.4 ②） | 播种零覆盖语义定形 = **播种只填空白：切片已有活数据（非播种来源）⇒ 零写**（在既有「本键在飞（回合未尾）⇒ 种不落——零写」之上补——闭合回合尾窗口；表述同「零写」族；零新机制） | `docs/desktop/design/UI.md:178` · `docs/desktop/design/IPC.md:127` |

**用例面（验收）补登（#490 · D17 面）**：切片已有活数据（非播种来源）⇒ 零写——机检面 = `thincoder-desktop/test/events-page.test.mjs` 原址补例（与 `thincoder-desktop/renderer/events.mjs` 首屏播种支同域）；**同档收正例**：既有「回合尾（位标无 `running`）⇒ 种落」臂（`thincoder-desktop/test/events-page.test.mjs:204-205`）与新区分**相抵**——活数据在场 ⇒ 新法零写（该臂判据随新法收正——实施轮随动）。

**变更记录**：`docs/desktop/design/UI.md` / `docs/desktop/design/IPC.md` 各 +1 笔（两注同拍）。

**doc-check 读数**（`cd thincoder && node scripts/doc-check.mjs --root .`）：悬空 **47**（= 基线 47 · **净增 0**）· 行宽 **31**（= 基线 31 · **净增 0**——新行 ≤300：实读 187 / 226 / 233 / 172 / 170）。

**未动项**：实现码 / 需求档 / 核档（`docs/core/design/SESSION.md`——他舱在写）/ 其他在途批面零触碰；`docs/desktop/design/PROJECT.md` 零动——「用例面」按本段用例面（验收）落（如需同步 §7 残余批注 ⑤〔D17 验收面〕请指明）。

### flags 供面口径修订轮（eng-designer · 2026-09-28 · fix 轮——实施座实测上抛 + 父侧确认）

**来源**：实施座实测发现 T-DSK39 ②（四真 fixture）与「模式位投影注」项 3（agent 在场才供 `flags`）**不能同真**——设计内矛盾。实读两面：① 桌面打开会话不装配 agent（`thincoder-desktop/src/main/agent-host.mjs:188-198` `ensure` 唯一调用点 = `msg:send` `:220`）⇒ 页读时无活态；② `planMode ⊥ engineering`（`thincoder-core/session-lifecycle.mjs:126-133` ⇒ `clearPlanMode`（`thincoder-core/agent-tools/plan.mjs:50-56`））⇒ **四真不可达**。父侧裁定 = **合并口径 + 夹具按可达态修正**。

**口径修订（三支）**：`flags` = **活值优先**（agent 在场 ⇒ 四布尔直读活态）· **不在场 ⇒ 以会话槽字段投影**（`autoApprove` / `planMode` / `advisor.guard` / `engineering`——与 D17 `seed` 同源同形；`history:page` 处槽数据已在手 ⇒ 零额外 I/O）· **槽亦读不出（缺 / 坏档）⇒ 键缺席**（该槽零写——「禁假造」边界收窄至此）。理由 = D22 屏面为准：桌面打开态须与 CLI 同见 banner——原口径令打开态恒暗，与批目标相抵。

**落点（逐项 → 改动 file:line）**：
- ① `docs/desktop/design/IPC.md`：「模式位投影注」项 3 在场条件收正（三支 + 理由句）→ `:143-146`；项 2「活值口径」⇒「活值优先口径」→ `:141`；`history:page` 行「agent 在场时在场」同拍 → `:65`；变更记录 +1 笔 → `:283-284`。
- ② `docs/desktop/design/E2E-TESTING.md`：§6 `T-DSK39` 夹具改**两臂可达态** + ② 断言随臂收正 → `:176`；变更记录 +1 笔 → `:238-239`。
- ③ `docs/desktop/design/UI.md`：本批注项 2 供面句 + 判定句收正 → `:202-203`；本批注（D17 / D19）项 1「模式四位」bullet 同拍 → `:185`；表行 1「活值口径」标签同拍 → `:110`；项 3 行折行（329 字符 ⇒ ≤300）→ `:204-205`；变更记录 +1 笔 → `:375-376`。
- ④ `docs/desktop/design/PROJECT.md`：§7 `T-DSK39` 行同 ②（该档自名「断言序单源 = `PROJECT.md` §7 T-DSK39 行」——E2E §6 行 ⇒ 两处不同拍即留矛盾）→ `:432`；变更记录 +1 笔 → `:720-721`。

**落点校正（报告面）**：派发点名「E2E-TESTING.md §3.6」——实读该节 = `T-DSK40` 账本警示面序（无 T-DSK39 内容）；T-DSK39 夹具 / 断言面实读 = **§6 行 + `PROJECT.md` §7 行** ⇒ 落此两处。项 7 桌内翻转句（UI `:210`）与 IPC 项 5（`:145`）实读无「agent 在场时叠加」字样（该径 agent 恒在场 = 活值支）⇒ 未改（点检）。

**doc-check 读数**（`cd thincoder && node scripts/doc-check.mjs --root .`）：悬空 **47**（= 在册基线 · **净增 0**）· 行宽 **31**（现盘 32 中本批既有 `UI.md:204`（329 字符）折行收口：32 ⇒ 31 ⇒ 对在册基线净增 0——本座新行皆 ≤300）。零全仓勘察。

**未动项**：实现码（实施座在写）· 需求档 / 核档 / 其他批面零触碰。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

状态栏对齐批（D22 · 屏面为准）文档集（requirements/PROJECT.md §3.1 三处随动 + §4 D22 ∥ design/UI.md · IPC.md · PROJECT.md · E2E-TESTING.md）——设计评审发现表。

口径限制：项目标准档与文档地图未声明 ⇒ 方法论合规按 AGENTS.md（Project Guide）+ 本档集在册规范（单源 / 引符号 / 同族书证 / 越层预案）判定（Document ownership 维度降级判定）；CLI / 核源码按评审声明不在评审面——本表所引其 `file:line` 判据句未复核（unverified），各发现均以五档内文互证成立。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | 同一机制两处不同描述：状态词源 =「闭枚举 6 词（排队中/运行中/待审批/完成/已停止/错误）——界面各处取词一律出自本集，不得自造词」（`thincoder/docs/desktop/design/UI.md:16`）；而状态行表行 3 明写「**两态词**（词出本档状态词闭枚举）…静 ⇒ **就绪**（词键 `status.ready`）」（`thincoder/docs/desktop/design/UI.md:111`，同句见 `UI.md:200` · `thincoder/docs/desktop/design/PROJECT.md:68` KD-30）——就绪 不在 6 词闭集内，其词形来源 = CLI `Ready`（非「核 i18n / 需求档同源」）⇒ 闭集纪律与其使用者两处相抵 | 二择一收正并同笔随动：①「就绪」入闭枚举（6 词 ⇒ 7 词——词形同源句 · `UI.md:16` · 借用清单项 9（`UI.md:226`）同拍）；或 ② 撤表行 3「词出闭枚举」句、另点名状态行词族来源与闭集边界——两处判据须同拍 |
| 2 | Document ownership | 🟡 | D 号档头滞后：`docs/desktop/design/PROJECT.md:6` / `UI.md:4` / `IPC.md:4`（另 `RENDERER.md:4` / `SHELL.md:4` 同族）仍记「§4 功能点 **D1–D21**」，而 §6.1 表头已 `D1–D22`（`PROJECT.md:315`）、需求档自 2026-09-28 起 D 表 = D1–D22（`docs/desktop/requirements/PROJECT.md:216`）；AN 行在册口径 =「D 号诸处同改」（`PROJECT.md:502`；D16 / D21 先例皆五处同笔）——本批未随动 | 五处档头同笔收正为 D1–D22（若有意推迟，在批档点名该随动面与窗口——勿静默滞后） |
| 3 | Requirements | 🟡 | 「缺入站面 × 4 · 实施批 R3a」记账与 R3 实落相抵：`UI.md:125`（+ `:113` / `:116` / `:120` 逐行）· `PROJECT.md:63` KD-25 · `:335` D17 行 · `:498` AH 行仍以「耗时 / 令牌 / 计时 / 回合 N/M 缺入站面——实施批 R3a」记；而同档集已记 R3（含 R3a）结算实落（`PROJECT.md:666` 按实读回填：agent-bridge 174 / agent-host 300 / events 500 …），且以 statusline.mjs **256**（R3a 新档）为本批基线（`PROJECT.md:295`）——或把已落项记成未落，或把缺口挂在已收口批上（死工单） | 四项逐项坐实并改记：已落 ⇒「已落（R3a）」；未落 ⇒ 点名缺口本体、不得再挂 R3a（已结算）；KD-25 与 D17 行同句随动 |
| 4 | Requirements | 🟡 | 播种面清单口径差 4 段：单源句声明「播种面（**承载段全量清单**——2026-09-28 重审后 **16 段**）· 逐段裁定 · **零静默省略**」（`UI.md:172` · 同句 `IPC.md:124`），而清单只裁 12 行（播种 2〔行 6 / 9〕+ 不播种 10〔行 2 / 3 / 4 / 5 / 7 / 8 / 11 / 12 / 13 / 14〕——`UI.md:178` / `:179`）；banner 四态（行 1 四段）无裁决句（其供面 = `flags`——`IPC.md:132-140`） | 补 banner 四态裁决句（明示「非 seed 面——供面 = `flags`，每次页读皆携」）或收正「全量清单（16 段）」口径为「读数切片段（12）」；`UI.md` / `IPC.md` 两档同拍 |
| 5 | File size annotations | 🟡 | `thincoder-desktop/src/main/agent-host.mjs` **≈300 ⇒ ≈315** 越 300 层（`PROJECT.md:297`），其拆档句仅「越 300 在册预案承前」；本档集内未检得该档拆分预案（§4.1 行 `PROJECT.md:112` 只记已成出档三面——回调桥 / 待决门 / 槽 I-O；越 300 层段 `:173` / `:177` 未列该档；同批 store / i18n 的「承前」皆有具名在册预案可比对） | 给该档拆分预案 + 消解窗口（或把「承前」所指预案钉到具体句），并随列入 §4.1 越 300 层段 |
| 6 | Clarity | 🟡 | T-DSK39 首步不可机读直译：`PROJECT.md:406` / `E2E-TESTING.md:163`「① 真点**左列会话行**（带 `data-path` 形）开页」——`data-path` 在册单义 = `project:open` 最近目录项（`E2E-TESTING.md:107` / `:109`：「只点带 `data-path` 者」）；会话行锚 = `session:switch`（`UI.md:28`），无 `data-path` 形；且夹具（`{"locale":"en"}` + 槽档）未给项目根 / 槽 `cwd`（对比 T-DSK32 前置「另建第二枚临时目录作项目根（记 `PROJ`）」——`E2E-TESTING.md:99` / `:100` · `PROJECT.md:399`） | 点名真点路径（最近目录项〔`project:open` + `data-path`〕⇒ 自动续会话 ∥ 会话行〔`session:switch`〕——二择一或给全序）并补夹具前置（项目根临时目录 + 槽 `cwd`——保证左列条目 / 会话行在场） |
| 7 | Clarity | 🟡 | 段序两说：`UI.md:195`「段序 = **CLI 序**（**注意力** → banner 四态 → 状态词 → …）」vs 15 段表枚举序（行 1 = banner · 行 2 = 注意力 chip——`UI.md:109` / `:110`，其引据句附 CLI 坐标序 `:105`）；且「= CLI 序」该句无判据源；T-DSK39 ② 又以「相对序 = 闭集序」立为机检（`PROJECT.md:406` / `E2E-TESTING.md:163`） | 定段序单源（附 CLI 判据句），令 `STATUS_SEGMENTS` 序 / 表列枚举 / T-DSK39 断言三处同拍（若两序各有其用，明写「表列序 = 逐项裁定序，判据序 = `STATUS_SEGMENTS`」） |
| 8 | Requirements | 🟡 | D22 主句「打开 / 切回既有会话（**及任意时刻**）两侧状态行段信息一致」（`docs/desktop/requirements/PROJECT.md:151`）与桌内翻转时窗未闭合：`flags` 供面 = 页读时刻，桌内 AUTO 翻转（always 放行）后即时刷新**未落**（`UI.md:204` · `IPC.md:139` · `PROJECT.md:508` AT 行）——该时窗桌面 banner 落后于 CLI（验收面 = 打开态，故未阻断本批验收） | 射程口径二择一收正：打开态对照即满足 ⇒ 需求档主句措辞定尺（「打开 / 切回」）；须「任意时刻」⇒ 消解路（出站事件携 flags / 回合尾重投影）并入本批或立批承接 + 台账行 |
| 9 | Clarity | 🔵 | T-DSK33 机检面陈旧：`PROJECT.md:400` 仍记「**新增用例档**（状态行族——名实施批定）+ `views-chrome.test.mjs` 原址补例」，而状态行族档**已落**（`views-statusline.test.mjs`——`PROJECT.md:164` 值列 **285**），本批亦按「`views-statusline` … 原址补例」记（`PROJECT.md:298`） | 随动 T-DSK33 机检面（改指已落档 + 本批原址补例面），与 §4.1 / §4.2 两处同拍 |
| 10 | Document ownership | 🔵 | §4.1（`E2E-TESTING.md:139` 声明「全盘现值**单源** = `docs/desktop/design/PROJECT.md` §4.1」）未含 R3 期六档——含本批主档 `statusline.mjs` / `mount-status.mjs`（现值只见于 §4.2 批行 `PROJECT.md:295` / `:296`；`:164` 用例模块行仅列测试档）——单源口径与实际覆盖面不符 | §4.1 下次触碰时补入六档行（或收正「单源」口径为「§4.1 存量档现值 + §4.2 各批行」）——消解单源悬空 |

计数：🔴 ×1 · 🟡 ×7 · 🔵 ×2（共 10 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 轮 2（复评）· 核验修正落点

**口径限制**：CLI / 核源码按评审声明不在评审面——其被引坐标未复核（unverified）；项目标准档与文档地图未声明 ⇒ 方法论合规按 AGENTS.md + 本档集在册规范判定（Document ownership 维度降级判定）。核验方式 = 五档 + 需求档逐行实读（as-of 现盘）。

**逐号核验（轮 1 十条 · 号 → 结果）**：

1 ✓ 状态词闭枚举 6 词 ⇒ 7 词（就绪入集）——五处同拍实读核在（`UI.md:16` · `:112` · `:205` · `:233` · `:217`；`PROJECT.md:68` KD-30）；
2 ✓ 五处档头 `D1–D23` + AN 行——六处实读核在（`PROJECT.md:6` / `:511` · `UI.md:4` · `IPC.md:4` · `RENDERER.md:4` · `SHELL.md:4`）；
3 ✓ 四项（耗时 / 令牌 / 计时 / 回合 N/M）改记「已落（R3a）」——`UI.md:114` / `:116` / `:117` / `:121` / `:126` + `PROJECT.md:63` / `:344` / `:507` 实读核在；
4 ✓ 播种面口径 = 读数切片段 12（banner 四段 = 非 seed 面）——`UI.md:174` / `:185` · `IPC.md:124` 实读核在；
5 ✓ agent-host 拆分预案钉定（`agent-assemble.mjs` ≈105 · 消解窗口 = 本批实施轮）+ 越层段入册——`PROJECT.md:112` / `:179` / `:192-194` / `:306` 实读核在；
6 ✓ T-DSK39 ① 真点路径点名 + 夹具前置——`PROJECT.md:415` · `E2E-TESTING.md:128` / `:163` 实读核在；
7 ✓ 段序单源定谳（表列序 = 逐项裁定序 · 判据序 = `STATUS_SEGMENTS`）——`UI.md:105-106` / `:197-199` 实读核在；
8 ✓ 桌内翻转并入本批定形——`UI.md:209-211` · `IPC.md:68` / `:139` · `PROJECT.md:305-307` / `:517` 实读核在（零新通道 / 零新白名单项句在）；
9 ✓ T-DSK33 机检面改指已落 `views-statusline.test.mjs` + 本批原址补例——`PROJECT.md:409` 实读核在；
10 ✓ §4.1 补 R3 期六档行（statusline / mount-status / subagent-face / chat-text / chat-cards / core.css）+ E2E 单源口径句——`PROJECT.md:161-166` · `E2E-TESTING.md:139` 实读核在。

**本笔两项（父侧直执）**：§4.1 按盘回填七行（`PROJECT.md:695` 记录同拍：agent-bridge 174 · sessions 37 · events 473 · i18n 407 · store 328 · chrome 163 · activity 248）✓——**例外 = session-slots（见发现 1）**；D22 需求措辞定尺（`docs/desktop/requirements/PROJECT.md:152` / `:221`）✓。

**结论**：十条内容修正全落（落点文件正确）；#30 修正表对 `UI.md` 部分行号引用有 1–5 行漂移（内容在——见发现 3）；随动所报 `§4.1 session-slots 180` 未见落点（见发现 1）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | File size annotations | 🟡 | 修正轮 #30 所报「§4.1 三值按盘收正（…`session-slots` **180**）」**未核达**——`docs/desktop/design/PROJECT.md:116` 仍记 **154**（批 B 末实读）；同档 §4.2 两值并存（`:289`「154 ⇒ ≈195」· `:306`「180 ⇒ ≈180」）⇒ §4.1 与 §4.2 的现行值相抵，`thincoder-desktop/src/main/session-slots.mjs` 现行行数不可判 | §4.1 该行按盘收敛为一值（或按在册 as-of 口径注明取值基准），与 §4.2 两行同拍；#30 所报未核达项补落 |
| 2 | Clarity | 🟡 | 本批已裁「会话头回三值——撤 `engineering` / `autoApprove` 两显示位」（`docs/desktop/design/UI.md:110` · `:203` · `docs/desktop/design/PROJECT.md:68` KD-30），而 `docs/desktop/design/UI.md:41`（批 B 注项 1）仍留括注「工程模式 / AUTO 两位不在本项，**沿其既有点按出口**」——该两位已不在会话头、亦无点按出口可沿（两态呈现面单源 = 状态行段）⇒ 指向已撤面的残留句 | 该括注二择一收正：删 ∥ 改写为「两态呈现面单源 = 状态行段（本档 §1「本批注（状态栏对齐 · 屏面为准）」项 2）」——与「会话头回三值」同拍 |
| 3 | Clarity | 🔵 | #30 修正表对 `UI.md` 的行号引用部分与现盘漂移（借用项 9 报 `:228`／现 **:233** · §2 项 1 计数句报 `:212`／现 **:217** · 表行 3 报 `:111`／现 **:112** · 播种面两句报 `:172` / `:183`／现 **:174** / **:185**）——「号 → 改动 file:line」不可逐字跟读（同轮自插行所致） | 引用改锚文本 / 符号名（仓内先例 = `docs/desktop/requirements/PROJECT.md:81`「引符号不引行号」）；须给行号时按定稿后复核 |
| 4 | Document ownership | 🔵 | 五处档头已收正 `D1–D23`（`PROJECT.md:6` · `UI.md:4` · `IPC.md:4` · `RENDERER.md:4` · `SHELL.md:4`；AN 行 = `PROJECT.md:511`），而 `PROJECT.md:324` §6.1 表头仍「功能点 D1–D22」且无 D23 行——滞后已在批档 §2 登记（归台账可靠批 · 本批零写），设计档面未加就地限定 | 维持登记；如需免读者误读为漏项，§6.1 表头就地加半句限定（D23 设计映射归台账可靠批）——二择一 |
| 5 | Scope | 🔵 | 本批 §1.4 ②（#490「播种零覆盖语义」= 切片已有活数据 ⇒ 零写）复核**未见设计档落点**（仅「本键在飞 ⇒ 种不落」时序半句在册——`docs/desktop/design/IPC.md:127` · `docs/desktop/design/UI.md:178`）；批档 §1.4 订正在册（改随 #30 报告后微轮落） | 按在册落点补落（`UI.md` §1 本批注项 1 + `IPC.md` §2 打开态播种注 + 用例面）——本轮仅登记未落状态 |

计数：🔴 ×0 · 🟡 ×2 · 🔵 ×3（共 5 条）。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-28 05:12「都自动跑吧」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass**：轮 1 = 1🔴 / 7🟡 / 2🔵（评审 #28）→ 修正轮 #30 十条全落 → **轮 2 = pass**（评审 #32 = 0🔴 · 2🟡 / 3🔵——父侧裁定：发现 1 / 4 **Fixed**（§4.1 `session-slots` 值 = 180 · §6.1 表头 `D1–D23` + D23 行）· 发现 2 / 5 **Dispatched**（收尾微轮 #34——已全落核验）· 发现 3 **Not an issue**（历史记录件））；
- ② **修正落地核验** ✓：#30 十条 + #34 两项（`UI.md:41` 残留括注收正 · #490「播种只填空白」入 UI/IPC 两注 + 用例面）+ 父侧三笔（D22 定尺 / §4.1 回填 / §6.1 D23）——全部实读核过；
- ③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：§2 定稿设计（16 段闭集 · banner 四态 · 静息词 · 键位尾 · 会话头三值 · `flags` 供面 · 桌内翻转刷新 · `agent-host` 拆 `agent-assemble` · T-DSK39）；实施写域 = 桌面 **view 面** + **wiring 面**（分两座派，wiring 依 view）；U176 臂改判（`events-page.test.mjs:204-205` 与「零覆盖」相抵）由实施轮随动——§2 用例面已登记。

## §5 实施记录（eng-coder）

**状态行**：实施完成（view 面首座 · 内部审计 1 轮 + 内部代码评审 2 轮 · 终态 = clean；wiring 面次座 · 内部审计 1 轮 + 内部代码评审 1 轮 · 终态 = clean）

### 交付摘要（本座 = view 面；wiring 面 / E2E 集成档归另座）

- **段集 12 ⇒ 16**（闭集 = `renderer/views/statusline.mjs` `STATUS_SEGMENTS`，序 = CLI 序实读对位 `render-frame.mjs:229-239` / `:427`）：
  `attention → plan / auto / advisor / eng → state / tool / elapsed / tasks / turn / tokens / context / ledger / timer / title / enter`。
- **banner 段组拆档**（新 · 25 行）= `renderer/views/statusline-banner.mjs`（`BANNER_CODES` + `bannerSegments`）；
  源 = `sessionFlags[key]` 四布尔（`planMode` / `autoApprove` / `advisorGuard` / `engineering` —— 与 `IPC.md` §2「模式位投影注」项 2 同名），
  严格真 ⇒ 在场 · 假 / 缺 / 非布尔 ⇒ 零节点（负向锁，逐码用例在册）。
- **`state` 段两态**：`running` ⇒ 运行中（`sub.running`）· 位标集 ∩ {`running`, `approval`} = ∅ ⇒ 就绪（`status.ready`）；
  第三态（审批在挂 ∧ 非忙）⇒ 段零节点（见决策表 #1）。
- **`enter` 段三态**：静 ⇒ `Enter: send`（新键）· 忙 ∧ 队空 ⇒ `status.queue.enter` · 队 ≥ 1 ⇒ `status.queue.n`（队优先）。
- **会话头回三值**：`FIELD_ORDER` = provider / model / effort（供给仍携两撤键 ⇒ 不渲染 —— 负向锁）。
- **词表 +6 键**（`status.ready` · `status.enter.send` · `status.banner.plan|auto|advisor|eng`）两语齐；139 ⇒ **145**。
- **`mount-status.mjs`** `STATUS_KEYS` 增 `sessionFlags`（切片键面 = 16 段数据源全集 —— 零漏键）。
- **行数（内容行数）**：`statusline.mjs` 256 ⇒ **269**（≤300）· 新档 **25**（≤100）· `chrome.mjs` 163 ⇒ **164**（设计 ≈150 未达 —— 决策表 #2）·
  `i18n.mjs` 407 ⇒ **421**（≈420）· `mount-status.mjs` 25 ⇒ **26**（≈26）· 用例档：`views-statusline.test.mjs` 285 ⇒ **298**（≤300）。

### 决策透明表

| # | 决策 | 依据 / 处置 |
|---|---|---|
| 1 | `state` 段第三态（位标含 `approval` ∧ 不含 `running`）⇒ **段零节点**（不落第三词、不落「就绪」） | 设计判据句只给两态；「就绪」的 ∩ 判据显式排除 `approval` ⇒ 零节点 = 唯一自洽读法；代码注释就地声明，用例（`views-statusline.test.mjs` U155）锁死；设计面补半句归父侧（内部评审轮 1 发现 3） |
| 2 | `chrome.mjs` 行数 **164**（设计预期 ≈150）未达 | `FIELD_ORDER` 撤两键本身不产生减行；差额 = 该档既有文档密度（本座净 +1 行）；未为凑数删既有文档句；≤300 建议线未越（披露待父侧裁） |
| 3 | `status.enter.send` 两语同形 = `Enter: send` | 对位 CLI enterHint 静息字面（`render-frame.mjs:411` 硬编码英文）；设计未给中文形 ⇒ 不发明（zh 同用该字面） |
| 4 | `host-floor.test.mjs`（臂清单登记）按 **net 0 行**落形（新档并入既有状态行族注 / 行） | 该档现盘 301 行（HEAD 即 301）已越 300 建议线 ⇒ 不为已越线档再增行；登记面滞后 + 自检档自豁免归父侧（内部评审轮 1 发现 2） |
| 5 | `test/files.mjs` **零改** | 本座不新增用例档（新档 = 渲染侧源档，非 `test/*.test.mjs`）；设计行「22 ⇒ 23」的登记项 = E2E 集成新档（归另座） |
| 6 | 表外用例两档随动：`test/views-chrome.test.mjs` · `test/views-head.test.mjs` | 旧断言与新代码直接相抵（字段序五值 / 读数节点「独子」）⇒ 交付必需；两档均在 §4.2 随动清单；改动为加强（负向锁 + 16 计数锁），零判据削弱 |
| 7 | 表外注释随动：`renderer/app.mjs` 两处 `D17 承载 12 段 ⇒ D17 / D22 承载 16 段` | 装配面档，本座改值的旧计数引用（注释级零行为）—— 内部审计发现①就地收口 |
| 8 | banner 四段词 = 代号字面 `PLAN` / `AUTO` / `ADVISOR` / `ENG`（两语同形） | 设计逐字（`UI.md` §1 本批注项 1 括注） |

### 审计与代码评审（轮次与终态）

- **内部一致性审计（explore · 只读）1 轮**：结论 DEVIATIONS —— 低警行数/注释面残留 2 项 + 其余命中面零发现（批面判据逐条 ✅）。
  处置：注释面残留即时收口（`app.mjs` 两处 · `views-chrome-vocab` 夹具注释一处）；行数项披露（决策表 #2）。
- **内部代码评审（advisor · 轮 1）**：VERDICT = **pass**（5 项：2 🟡 advisory 用例档行数〔318 / 301 —— 现盘既有越线，非本座新起〕·
  1 🟡 设计面缺口〔`state` 第三态，代码零改〕· 2 🔵 注释面）。
- **fix round（1 轮内）**：🔵 两项点修 —— `chrome.mjs` 双常量分工注 + 防御分支可达性注（零行数净增）· `i18n.mjs` 单源指针补新档名；修后套件复跑全绿。
- **内部代码评审（advisor · 轮 2 · fix 核）**：VERDICT = **pass**（两条 🔵 后修核实落地 · 两档零新引入问题 · 终态 = **clean**）。
- **机检**：`cd thincoder-desktop && npm test` —— tests 196 / pass 196 / fail 0（修前修后两跑皆绿）。

### 上抛 / 登记（本座不改 · 归父侧或另座）

- **设计面**：`UI.md` 表行 3 / 本批注项 3 补「审批在挂 ∧ 回合非忙 ⇒ 段零节点」半句（内部评审轮 1 发现 3）。
- **登记面**：`PROJECT.md` §4.1 值列按盘收正（`host-floor` 294 ⇒ 301 · `views-chrome-vocab.test.mjs` 298 ⇒ 318 · `views-statusline.test.mjs` 285 ⇒ 298）；
  用例档越 300 的拆档 / 登记（`views-chrome-vocab.test.mjs` 318 · `host-floor.test.mjs` 301）。
- **另座**：wiring 面（`events.mjs` `META_FIELDS` 五键 ⇒ 三键 + `flags` 写 + `applyFlags` · `store.mjs` `sessionFlags` 初形 · `agent-host` / `ipc` / `session-slots`）；
  E2E `test/integration/statusline-align.test.mjs`（T-DSK39）+ `test/files.mjs` 登记。

### 交付摘要（**wiring 面次座** —— 续 §5；view 面首座记录见上文）

- **`flags` 供面三径**（`docs/desktop/design/IPC.md` §2「模式位投影注」· **合并口径**〔实施期实测上抛 + 父侧裁定；设计座同轮收正〕）：
  ① **槽投影兜底** = `thincoder-desktop/src/main/session-slots.mjs` `slotFlags`（四布尔取自槽字段 `planMode` / `autoApprove` / `advisor.guard` / `engineering`）——`history:page` 回执**每次页读皆携**（首屏 / 回填同携）；失败回执无 `flags` 键（零写 —— 禁假造）；
  ② **活值置顶** = `thincoder-desktop/src/main/ipc.mjs` `historyPage` 转口叠加（agent 在场 ⇒ `agentHost.flagsOf(key)` 覆盖槽投影；不在场 / 无宿主 ⇒ 回执原样）；
  ③ **出站回执径** = `thincoder-desktop/src/main/agent-host.mjs` `respondTo`（`approval:respond` **成功径 ∧ 审批门** ⇒ 叠加 `{ key, flags }`；提问门径 / 失败径零叠加 —— 零乐观写）。
- **活值投影** = `agent-host.mjs` `flagsOf(key)`：`planMode` / `autoApprove` / `advisorGuard` = `agent.config?.advisor?.guard === true` / `engineering` = `agent.config?.agent?.engineering === true`（与 CLI banner 判定同源；agent 不在场 ⇒ `null`）。
- **切片写点** = `thincoder-desktop/renderer/events.mjs` `applyFlags`（**纯动作导出** —— 页读 / 出站回执两径同点）；`applyPage` 同笔写（`flags` 与 `meta` 同点、非活动键照写）；`thincoder-desktop/renderer/mount-pool.mjs` `submitVerdict` 成功径同点写 ⇒ **桌内翻转即时刷新**（always 放行置位 ⇒ 回执 `flags` ⇒ 切片 ⇒ 状态行重挂）。`thincoder-desktop/renderer/store.mjs` 增 `sessionFlags` 初形（`STATUS_KEYS` 该键由 view 面首座已落）。
- **`META_FIELDS` 五键 ⇒ 三键**（会话头回三值随动）+ `session-slots.mjs` `slotMeta` 三值收正（撤 `engineering` / `autoApprove` 两投影）。
- **#490 改判落形**：`seedPatch` 增「播种只填空白」——该槽切片键在场 ⇒ 零写（在既有「本键在飞（回合未尾）⇒ 种不落」之上）。
- **`agent-host.mjs` 拆档**：装配面（`assembleFor` + `DEFAULT_DEPS` / `teamConfig` / `gitAuthor` / `validateProvider`）**逐字搬运**至新档 `src/main/agent-assemble.mjs`；原路径**同名 re-export** 保名面（`agent-host.mjs` 300 ⇒ **254** · `agent-assemble.mjs` **95** —— 皆 ≤300）。
- **T-DSK39 真机例**（新档 `thincoder-desktop/test/integration/statusline-align.test.mjs` · **两臂可达态**夹具）：臂①（工程模式会话）= `auto` / `advisor` / `eng` 在场 + `plan` 零节点；臂②（真点会话行切槽）= `plan` 在场 + `eng` 零节点；两臂保留在场 = `state` / `tasks` / `context` / `title` / `enter`；在场段 ⊆ 16 码闭集 ∧ 相对序 = 闭集序（单源 = `STATUS_SEGMENTS`）；词面逐字（`Ready` / `Enter: send` / `✓0/2`）；PNG 落 `thincoder-desktop/test/artifacts/statusline-align.png` + magic；全程 `pageerror` 空。`test/files.mjs` 登记项 +1（新集成档打包入既有行 —— 行数 22 ⇒ 22）。
- **行数（内容行 · 现盘实读）**：`agent-host.mjs` **254** · `agent-assemble.mjs` **95** · `ipc.mjs` **221** · `session-slots.mjs` **194** · `events.mjs` **494** · `store.mjs` **331** · `mount-pool.mjs` **60** · 用例档：`agent-host.test.mjs` **338** · `events-page.test.mjs` **252** · `events-reduce.test.mjs` **312** · `history-page.test.mjs` **172** · `host-floor.test.mjs` **303** · `integration/statusline-align.test.mjs` **142**。

### 决策透明表（wiring 座）

| # | 决策 | 依据 / 处置 |
|---|---|---|
| 1 | `flags` 供面 = **合并口径**（活值优先 · 槽投影兜底 · 槽亦读不出 ⇒ 键缺席） | 实施期实测上抛：① 桌面**打开会话不装配 agent**（`ensure` 唯一调用点 = `msg:send`）⇒ 原「agent 在场时在场」口径令打开态 banner 恒暗 = D22 屏面失守；② 槽 `planMode ⊥ engineering`（核 ENG-PLAN-EXCLUSION）⇒ 夹具四真不可达。父侧裁定采纳；设计座同轮收正 IPC.md 项 2/3 + §2 `history:page` 行 + PROJECT.md §7 T-DSK39 行 |
| 2 | T-DSK39 夹具 = **两臂可达态** | 父侧裁定②；第二臂另盖 `plan` 点亮（判据 = 核 ENG-PLAN-EXCLUSION；四真不可达） |
| 3 | #490「播种只填空白」实现判据 = **该槽切片键在场 ⇒ 零写** | 设计句「播种只填空白」（IPC.md 项 3）；「非播种来源」限定不辨（零新机制）—— 语义悬空**随 §5 上抛**（父侧 / 设计座二择一收正；本座零行为改动） |
| 4 | **越声明面四档**（本座主动披露）：`src/main/session-slots.mjs` · `test/agent-host.test.mjs` · `test/store.test.mjs` · `test/host-floor.test.mjs` | ① session-slots = 裁定① 的槽投影落点（`slotFlags` + 回执行 + 档头 ⑦ ⇒ 180 ⇒ 194）；② agent-host.test = 设计用例面点名的「`respond` 回执两向」例入档 ⇒ 越 300（入在册例外面 + 拆分预案 = 门面用例拆出、档名实施批定）；③ store.test = 初态键集锁随动（该锁自述「增 / 减键须同改本锁」）；④ host-floor = 新档入 ≤300 臂 + 例外表一行（301 ⇒ 303 —— 自检档自豁免 + 登记面滞后，view 座已上抛、本座续报） |
| 5 | 用例面落点随实：`test/session-contract.test.mjs` **未**补 `flags` 例 | 实质覆盖已由 `history-page.test.mjs`（回执在场 / 失败两向）+ `agent-host.test.mjs` U178（活值四布尔 + 叠加两向）+ `events-page.test.mjs` U179（切片两径 + 出站径）+ `host-floor.test.mjs`（转口源面判据）承担；且该档在册已由账本可靠批预约增量（291 ⇒ ≈303）—— 避撞。落点差异随本报告披露 |
| 6 | 新用例号自铸 **U178 / U179** | U1–U177 已占用（续号自选 —— 沿 U154 起先例）；披露入本表 |

### 审计与代码评审（轮次与终态）

- **内部一致性审计（explore · 只读）1 轮**：结论 DEVIATIONS（2 项低警）——① T-DSK39 第二臂未断言「两臂保留在场」五段；② `history:page` 合成面「活值覆盖槽投影」无行为级用例（仅源面正则）。**处置**：① 即时补断言（第二臂五段 + 段序）；② 源面机检入 `host-floor.test.mjs`（一行判据）+ 行为级限制登记（`ipc.mjs` 依赖 `electron` ⇒ 不可直 import）。
- **内部代码评审（advisor · 轮 1）**：VERDICT = **pass**（8 项：5 🟡 / 3 🔵 —— 全为行数债 / 登记面 / 设计措辞缺口，**无一 must-fix**）。响应见下表。
- **fix round（1 轮内）**：第二臂断言补全 + host-floor 源面判据（审计两发现）· `applyFlags` 数组载体卫兵 · `seedPatch` 注释纠偏（评审发现 5）· `ipc.mjs` 错字（袠旧 ⇒ 照旧）· `history-page.test.mjs` 措辞收正。
- **机检**：`cd thincoder-desktop && npm test` —— tests **199 / pass 199 / fail 0**（修前修后四跑皆绿 · 含 T-DSK39 真机）。

**评审响应表（advisor 轮 1 · 8 项）**：

| # | 级 | 项 | 处置 |
|---|---|---|---|
| 1 | 🟡 | `renderer/store.mjs` 331 越 300 建议线（本座 +3） | **Report** —— 行数债 + 拆分预案登记归父侧 / 设计面（§4.2 值列收口轮按盘回填） |
| 2 | 🟡 | `renderer/events.mjs` 494（距 500 硬限余 6；在册例外面） | **Report** —— 拆分落点（页应用族出档）与窗口更新归父侧；本座未拆（超本次声明面） |
| 3 | 🟡 | `test/events-reduce.test.mjs` 312 未入越层例外面 | **Report** —— 既有越线（本座触碰净增减 ≈0）；登记归父侧（§4.1 面） |
| 4 | 🟡 | `test/host-floor.test.mjs` 303（本座 +2） | **Report** —— 自检档自豁免 + 登记滞后（view 座已上抛，本座续报）；不入册（§4.1 面归父侧） |
| 5 | 🟡 | `seedPatch` 判据与设计句「非播种来源」限定的语义悬空 | **Fixed（注释面）** —— 删除失实断言（「槽内数据恒为活数据」），注释改记实判据（键在场、不辨来源）+ 上抛指针；**口径二择一收正归父侧**（零行为改动） |
| 6 | 🔵 | §4.2 数字漂移（agent-host ≈210 / session-slots 净 0 行） | **Report** —— §5 已列现盘值；§4.2 回填归父侧 |
| 7 | 🔵 | `session-contract.test.mjs` 未补例（设计用例面点名） | **Not an issue（落点随实）** —— 实质覆盖在册（见决策表 #5）；本报告披露 |
| 8 | 🔵 | ipc 合成面仅源面机检 | **Report（登记限制）** —— 已加源面判据；行为级抽取归后续批 |

### 上抛 / 登记（wiring 座 · 不改 or 归父侧）

- **设计面（已由设计座同轮收正）**：IPC.md 项 2/3「活值优先 / 槽投影」· §2 `history:page` 行 · PROJECT.md §7 T-DSK39 两臂行。
- **设计面（未决）**：`seedPatch` 判据 vs 设计句「非播种来源」的二择一（评审发现 5；本座零行为改动）。
- **登记面（归父侧）**：① §4.2 值列按盘回填（254 / 95 / 221 / 194 / 494 / 331 / 60）；② §4.1 行数例外面补登（`test/events-reduce.test.mjs` 312 · `test/host-floor.test.mjs` 301 ⇒ 303）；③ 设计用例面「session-contract 原址补例」落点随实登记。
- **另座**：无（E2E 新档 + 登记本座已闭）。

**登记面补录（wiring 座 · 设计档 drift —— 本座 diff 触碰，不改档）**：① `docs/desktop/design/RENDERER.md` §1.1「事件归约面」条列 `reduce` / `applyPage` / `blockOfMessage` 三面，未含本批新增导出 `applyFlags`（module map 面收正归设计座）；② `docs/desktop/design/E2E-TESTING.md` §4 行与 `PROJECT.md` §4.2 测试行记新档「≈110」，现盘 **142** 行；③ `PROJECT.md` §4.2 用例档估值（`agent-host.test.mjs` 300 / `history-page` ≈150 / `events-page` ≈200）与现盘（338 / 172 / 252）漂移 —— 一并随 §4.2 回填轮。

## §6 验证与收口（父代理）

**§6 验证与收口（父侧 · 2026-09-28 08:2x）**

**交付**：实施两座——view 面（`statusline.mjs` 269 · 新档 `statusline-banner.mjs` 25 · 会话头回三值 · 词键 147）+ wiring 面（`events` / `mount-pool` / `store` / `agent-host` 254 + 新档 `agent-assemble` 95 + T-DSK39 双臂真机 142）；设计 / 口径收正：#30 十条 · #34 两项 · #39 供面口径 · 父侧三笔（第三态补句 · 按盘回填 · D23 行）。

**验收读数（父侧亲跑）**：desktop **202/202**（T-DSK39 ok——臂① `auto,advisor,eng,…` · 臂② `plan,auto,advisor,…`）；core / cli / vsc 终跑全绿（零回归）。

**提交**：`366bab1f`（桌面码——三链共笔）。

**评审**：#28 轮 1（1🔴 + 7🟡 + 2🔵）→ #30 全修 → **#32 轮 2 pass**（0🔴）。

**残项**：U176 已改判（#490「零覆盖语义」随 wiring 座落）· 无其余未决。

**结算**：台账 #483 → 已核销（证据行 = 本 §6）；前批遗留 = 无。
