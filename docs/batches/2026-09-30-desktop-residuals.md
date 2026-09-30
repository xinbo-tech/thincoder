# 2026-09-30 · 桌面残债清付（ipc 拆分 ∥ 拒绝面 ∥ providers 草稿保真 ∥ 四径声明 ∥ 档值回填）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #685 ∕ #686 ∕ #671 ∕ #679 ∕ #683 ∕ #687 ∕ #692 ∕ #689 ∕ #690（归批凝集）；2026-09-30 00:1x 用户令「能开批的都开」点火。
> 台账 = #685 ∕ #686 ∕ #671 ∕ #679 ∕ #683 ∕ #687 ∕ #692 ∕ #689 ∕ #690（桌面残债 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-30
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与点火

- 台账凝集（归批）：**#685**（ipc 拆分 331 ⇒ ≈275 + `ipc-relays.mjs`——拆点在 #673 §2.2⑤ 已定）· **#686**（`pushLedgerLines` 拒绝面未接线）· **#671**（providers 读面背景读清未提交草稿）· **#679**（草稿失效面其余四径声明未落）· **#683**（`PROJECT.md:271` 值 88 ⇒ 90 + §2.4 措辞）· **#687**（撤会话头批值回填 + 两处登记）· **#692**（§4.2 本批块回填 + `:811` 计数）· **#689**（`chat-chrome.mjs:144` JSDoc ∕ `chat.mjs:127` 尾组漂移 ∕ 批内件夹具）· **#690**（三件批内件形态随动 + #670 残项三件）。
- 2026-09-30 00:1x 用户令「能开批的都开」点火。

### 1.2 口径与避碰

- **在界**：上述九项（码面 4 + 档面 3 + 批内件/注文 2）。
- **出界**：#694 堆修复面（同刻在跑——档面改动排队在其设计席之后）；#691（.mcp.json 对齐——特征项，另轮）。
- **与 #2 席（跨线清零）去重**：#685 ∕ #686 已由父侧点名转入本批（#2 已收去重令）。

### 1.9 授权（用户 2026-09-30 00:14 · 会话级 · 同文已录各在途批）

用户原话：「**后续这些任务你自动跑**。」射程 = 本批全链：设计评审点火 ∕ §4 代签 ∕ 修正轮与实施轮派发 ∕ 收口核销提交——父侧全自动执行，不必逐次请点。自缚三条：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 需新范围（射程外条目点火）或用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性 ∕ 不可逆动作先停。

### 1.4 修正轮上抛裁定（父侧 · 2026-09-30 02:00）

- **① #687② 补录写靶 = §10 CO③ 括注（live 面）**：**同意**（沿 #683②「冻结转 live 面」同判）——届盘照 §2.11 句形落。
- **② 数值复核存差**：**以同口径实读为单源**（exits = **227** ∕ registry = **86**——皆 ≡ 登记值；chat-chrome = **214**（真实 +1，届盘随 #689① 一并收正）；i18n 届盘对表）——认可，无阻塞。

### 1.5 跨批旧件父侧代落（跨批写门 · 2026-09-30 02:1x）

- **触发**：实施舱（eng-coder）遭跨批写门拦截（两件属 2026-09-29 批次——机制正确，未绕过）。
- **父侧直执行**：① `docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs:67`——`pushLedgerLines` 缺省替身 ⇒ `async` 恒 Promise 形（§2.6 M-686 守卫链之 R1 前提，改前该件对新 `.catch` 形必 TypeError）。② `docs/batches/2026-09-29-model-menu-parity.test.mjs:123-125`——处理体在场检查 ⇒ **两源并查**（`ipc.mjs` ∪ `ipc-relays.mjs`——#685 拆分后 24 转口名居 relays 档）。〔父侧直接执行 · 可 revert〕
- **复跑核绿** = 实施舱收尾（coder 复跑两件并入 §5）。

### 1.6 实施交付上抛裁定（父侧 · 2026-09-30 02:2x）

- **U1（化石句订正靶悬空）**：**重挂完成** —— 现靶 = `thincoder-desktop/src/main/ipc-relays.mjs:34`（「设置族十二项」随 #685 搬入——原登记 = `docs/batches/2026-09-27-desktop-chat-panel-b.md:94 ∕ :658`「两处同笔 · 随零语义收正轮」）∥ `preload.cjs:11`；已立台账 **#699**（归批 = 下一桌面码面触碰轮）。
- **U2（批内件 469 vs §2.4「≤300」）**：**KD-4 豁免括注**径（批内件不计线）——由档面轮在 §2.4 行 12 落括注。
- **附（设计漂移披露受领）**：`§2.2.8①` 的 `RENDERER.md §2` 笔误（实住 §1.1）⇒ 档面轮顺笔；API-CONTRACT.md 生成区机械重生（越表披露 ①）= 受领在案。
- **实施验证（父侧独立复核）**：批件 **15/15** ∧ 旧件 `ledger-emit-fix` **7/7** ∧ `model-menu-parity` **9/9** ∧ `enddiff-clearance` **11/11** ∧ `api-contract --check` 零漂移（2695 条 · 604 档）；新档 `ipc-relays.mjs` 70 行实读核 ✓。

### 1.6 档面轮交付裁定（父侧 · 2026-09-30 02:5x）

- **上抛① 越层段计数 = 「十三档」：确认**——`ipc.mjs` **265** ≤300 ⇒ 拆档兑现须除名（十四 − 1 = 十三）；`PROJECT.md:306 ∕ :819` 两处同值正确，`:307` ∕ `:314` 除名正确。
- **上抛② `chrome.css:231` 死行号注：维持存栏**（沿设计 §2.2.6③ 原判「随该档下次触碰」——不在本轮扩码面；§2.12 `:214` 存根在册）。
- **存差披露受领**：① `app.mjs` ∕ `i18n.mjs` 按**执行时实读**落值（**289 ∕ 391**——批末提示 285 ∕ 388，后继落盘随动，已披露）；② §4.1 存量漂移 7 处（agent-host ∕ agent-assemble ∕ loop-sampler ∕ events ∕ compress-status ∕ core-markdown ∕ block.mjs）⇒ **归批立行 #703**（下个 §4.1 回填轮）。
- **收读**：§2.12 在位（`:203-232`）；三档回读 + 机检读数（所改行逐对通过；新增引用零悬空）——父侧抽读并入 §6。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 + 实施后档面轮（§2.12）已落地——2026-09-30）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批条目表（九项 · 判定 ∕ 面 ∕ 落点）

| # | 项 | 判定 | 面 | 落点（file:line） | 判据腿 |
|---|---|---|---|---|---|
| #685 | `ipc.mjs` 拆档（331 ⇒ ≈275 + `ipc-relays.mjs`） | 消（拆档落形） | 码面 | `thincoder-desktop/src/main/ipc.mjs:280-331` ⇒ 新档 `src/main/ipc-relays.mjs`；`ipc-registry.mjs:14-25`；`ipc.mjs:50-57 ∕ :114-122 ∕ :257-260` | M-685a–e |
| #686 | `pushLedgerLines` 拒绝面（void 吞拒） | 消（调用点挂拒绝处理器） | 码面 | `src/main/ipc.mjs:176-178`；注随动 `src/main/project-info.mjs:111 ∕ :154` | M-686a–c |
| #671 | providers 读面清未提交草稿 | 消（两写并持 + 复位语义裁定） | 码面 | `renderer/mount-settings-reads.mjs:53 ∕ :60-65` | M-671a–d |
| #679 | 草稿失效声明四径 | 消 3 径 + 免 1 径（agent 无对象） | 码面 | MCP = `renderer/mount-settings-segments.mjs:207-209 ∕ :269-271`；tools = 同档 `:153-155` + `views/settings-sections-tools.mjs:94`；env = 同档 `:94-95` + `views/settings-sections-env.mjs:133`；注入 = `mount-settings-exits.mjs:150-152` | M-679a–d |
| #683 | desktop 收口随动（值 90 + §2.4 措辞） | 消（值核）+ 载体转写（冻结档 ⇒ live 面） | 档面 | `docs/desktop/design/PROJECT.md:275 ∕ :361`；后案行 = 同档 §4.2 desktop-carryover 块（`:816-841`） | M-683a–b |
| #687 | 撤会话头值回填 + 两登记（③触发式） | 消 | 档面 | §4.1 八行 `:207 ∕ :249 ∕ :214 ∕ :241 ∕ :209 ∕ :211 ∕ :234 ∕ :212`；§4.2 块 `:843-858`；§7 `:1081`；登记补录 `:1166` 邻域（补 `:247`） | M-687a–c |
| #692 | #673 批 §4.2 块回填 + 计数 | 消 | 档面 | `PROJECT.md:860-878`（块头状态翻 + 15 行实读）；计数 `:817` | M-692a–b |
| #689 | 压缩行批注记三件 | 消 2 + 存栏 1 | 码面（①②）+ 批内件（③） | `views/chat-chrome.mjs:142-144`；`views/chat.mjs:26 ∕ :125-127`；③ = `docs/batches/2026-09-29-desktop-compress-row-pin.test.mjs`（触发式） | M-689a–c |
| #690 | 三件批内件随动 + #670 残项三件 | 存栏（触发式；本批零改） | 批内件 | `docs/batches/2026-09-29-desktop-residuals-round3.test.mjs:407-423` ∕ `…compress-row-pin.test.mjs:23-173` ∕ `…structure-split-2.test.mjs:113 ∕ :131`；残项 = `PROJECT.md:314` ∕ `events-wake.mjs:46` ∕ `chat-digest.mjs:138-139` | M-690a–c |

**裁定计数**：判「消」= 7 项（#685 ∕ #686 ∕ #671 ∕ #679 ∕ #683 ∕ #687 ∕ #692）；「消 + 存栏混合」= 2 项（#689 ∕ #690）。子项级：落修 = 12 组（#679 三径在内）；存栏触发式 = #689③ ∕ #690①（三件）∥ #687③ ∕ #690②（两残项——在册 ∕ 豁免之改判口径）；例外 = 2（#679 agent 径 = 无对象免；#683② = 载体冻结转 live 面）。

### 2.1 面与序

- **码面（→ 实施舱）**：#685 ∕ #686 ∕ #671 ∕ #679 ∕ #689①②——落点全住 `thincoder-desktop/**`（清单 = §2.4）；设计 token 签发后常规舱。
- **档面（设计笔）**：#683 ∕ #687 ∕ #692 + 实施随动（#685 拆档档面 ∕ #671 ∕ #679 设计注面）——落点住 `docs/desktop/design/{PROJECT,IPC,SHELL}.md` + `docs/batches/2026-09-29-structure-split-round.baseline.json`；**排队在「#1 席（heap-freeze 设计）之 `PROJECT.md` 争写窗口」之后；执行时序 = 父侧调度**；执行时逐值实读对表（口径 = 内容行数）。
- **批内件（存栏升级）**：#689③ ∕ #690——本批零改；触发句 + recipe 在册（§2.2.8③ ∕ §2.2.9①）。
- 需求面：九项皆技术债 ∕ 收口随动——无需求档条目变更，需求档零写。

### 2.2 逐项设计

#### 2.2.1 #685 · `ipc.mjs` 拆档（判定 = 消）

- 拆点（#673 §2.2⑤ 已定）：`:280-331` 转口群 24 函数 ⇒ 新档 `thincoder-desktop/src/main/ipc-relays.mjs`。群清单 = `indexBuild`(:283) ∕ `indexStatusChannel`(:284) ∕ 设置三项(:291-293) ∕ provider 八(:297-309) ∕ model 两(:311/:313) ∕ `settingsAgentChannel`(:315) ∕ mcp 五(:317-325) ∕ 尾三(:327 ∕ :329 ∕ :331)。
- 跨档接线（定形）：
  - import 拆分：`:51-54`（settings-env ∕ settings-tools ∕ providers ∕ mcp-servers）四行整行随群；`:50` 留 `isConfigured`（群取 `configWrite ∕ indexStatus ∕ modelCatalog ∕ modelList ∕ settingsAgent`）；`:55` 留 `pushLedgerLines`（群取 `batchStatus ∕ ledgerRead`）；`:57`（index-status）随群；`currentCwd`(:44) 两档同取。
  - `liveAgents`(:257-260)：留 `ipc.mjs` 并**新导出**（mcp 四转口 `:319 ∕ :321 ∕ :323 ∕ :325` 依赖件）；relays 以 `import { liveAgents } from "./ipc.mjs"` 取用（单向 relays → ipc，零环）。
  - 导出面：`ipc.mjs:114-122` 去 24 转口名；`ipc-registry.mjs:14-25` import 拆两源（核心面自 `ipc.mjs` ∕ 转口面自 `ipc-relays.mjs`）；`HANDLERS` 表 ∕ 注册序 ∕ 白名单 ∕ `main.mjs` 零改；两档档头面名随动。
- 行数：`ipc.mjs` 331 ⇒ ≈275（≤300 回线 ⇒ 越层段除名）；新档 ≈70。
- 判据腿：**M-685a** 行数——`ipc.mjs` 内容行 ≤300（目标 ≈275）+ 新档在位；**M-685b** 注册面零改——`HANDLERS` 全 45 项解析为函数 + 白名单 45 项无缺；**M-685c** 转发行为——转口抽查（替身注入 ⇒ 回执恒等直传）；**M-685d** 旧件复跑对表——`desktop-ledger-emit-fix.test.mjs`（抽取锚住 `sessionResume`，拆点之外 ⇒ 预期零破）· `model-menu-parity.test.mjs:123-124`（源文本读面 ⇒ 断则随修）· `enddiff-clearance.test.mjs:180`（真 import `fileOpen` ⇒ 预期零破）；**M-685e** `node scripts/api-contract.mjs --write` ⇒ `--check` 零漂移。
- 档面随动（队列）：`docs/desktop/design/IPC.md:3 ∕ :399` 邻域 · `PROJECT.md:168 ∕ :312` + §4.1 新行 · `SHELL.md:23-24`。

#### 2.2.2 #686 · 拒绝面接线（判定 = 消）

- 修法：`ipc.mjs:177` = `pushLedgerLines({…})` 挂 `.catch((error) => { console.error("[ipc] ledger emit failed:", error) })`（不 await——`void` 语义锁保持）；注 `:175` 同笔。注句随动：`project-info.mjs:111 ∕ :154` 按新形收正（拒绝兜底 = 调用点）。
- 批内件随动：`desktop-ledger-emit-fix.test.mjs` R1 替身（`:67` 返回 `undefined`）⇒ 改返 Promise（`.catch` 形所必需）；R2 语义锁（`:92-103`）零动。
- 判据腿：**M-686a**（主腿）源码抽取 + 替身注入（沿旧件 `:33-68` 先例）——注入恒拒 ⇒ `console.error` 落 ∧ `sessionResume` 回执正常返回（应用存活）∧ 零未处理拒绝逃逸；**M-686b** 不复 await（回执先于 `setImmediate` 哨兵 settle）；**M-686c** 静态面零裸 `void pushLedgerLines` + 旧件（随动后）复跑绿。

#### 2.2.3 #671 · 读面并持 + 复位语义裁定（判定 = 消）

- 修法（`mount-settings-reads.mjs`）：失败写 `:53` ∕ ready 写 `:60-65` 改并持——`providers: { ...store.get().settings?.providers, state: … }`（`:50` loading 写已并持，零改）。
- 复位语义（核心裁定）：四切片 `edit ∕ keyDraft ∕ probe ∕ draft` = **读面恒并持、零复位**；复位权仅在显式点——`edit ∕ keyDraft`：开面(`mount-settings-exits.mjs:182`) ∕ 关面(`:196`) ∕ 取消(`mount-settings-segments-providers.mjs:45-49`) ∕ 钥存成功(`:70`) ∕ 删钥成功(`:83`)；`probe ∕ draft`：开 ∕ 关面 + 下一探针写(`:125 ∕ :128 ∕ :133`)。列表刷新后行已不存在 ⇒ 编辑态惰性（零匹配行 ⇒ 零节点；下次显式点复位）——读面不作判别（有意从简）。
- 判据腿（批内件 · 假 DOM 手法沿 carryover c1 先例）：**M-671a** 编辑中触背景读 ⇒ `edit` + 键行输入值保真；**M-671b** `keyDraft` 种子保真；**M-671c** `probe ∕ draft` 保真；**M-671d**（负控）四显式复位点仍恒清。

#### 2.2.4 #679 · 草稿失效声明四径（判定 = 消 3 + 免 1）

- 机制沿 #652：`invalidateDrafts(scope)` 一次性集 ⇒ 重绘 `dropDrafts` 过滤（`view-state.mjs:158-163`——无作用域件（scope=null）永不被命中）。现实调用 3 处（`exits:75` ∕ `segments-providers:47 ∕ :68`）——四径补声明 + 两作用域面：
- **MCP 增 ∕ 改**（作用域件已在 `views/settings-sections-mcp.mjs:167`）：声明点 = `segments.mjs` `addMcp:207-209` ∕ `updateMcp:269-271` 成功径（复位写前；作用域自表单件自携）。
- **tools 钥存**：先补作用域面 `views/settings-sections-tools.mjs:94`（值 = `tools:<kind>`）；声明点 = `segments.mjs` `keySave:153-155`（+ 删钥 `:165-167` 同族随修）。
- **env**：先补作用域面 `views/settings-sections-env.mjs:133`（值 = `env:shell`）；声明点 = `segments.mjs` `saveEnv:94-95`。
- **agent（免——例外判定）**：`views/settings-agent.mjs` 零 `data-draft` ∕ 零作用域件（即改即存 + 回执就地刷——无未提交草稿面）⇒ 声明无对象；不补申报（不扩面）。
- 注入补传：`mount-settings-exits.mjs:150-152`（段族）；agent 族 `:163` 零改。
- 判据腿：**M-679a** MCP 成功 ⇒ 该表单草稿零复活 ∕ 失败零声明（保真）；**M-679b** tools 同 + 作用域件在场（`tools:<kind>`）；**M-679c** env 同 + 作用域件在场（`env:shell`）；**M-679d**（负控）scope=null 永不被误伤 + agent 径零改。

#### 2.2.5 #683（判定 = 消 + 载体转写）

- ① 值核：`PROJECT.md:275`（mount-onboarding；`:271` 指针已漂移）+ `:361`——现载「88 ⇒ 90」⇒ 值 = **90**（≡ 盘上实读 90）；执行时按 §4.1 定居口径核（若届盘要求单值形 ⇒ 微收，零语义）。
- ② 载体：原载体 `docs/batches/2026-09-29-desktop-carryover.md` §2.4 真机腿（`:78`；缺口登记 `:230 ∕ :350`）——**该档已收口**（`:6` ∕ `§6:452`）⇒ 冻结档零回改；转写 = `PROJECT.md` §4.2 desktop-carryover 块（`:816-841`）补「后案」行 + 本批档在册（内容 = §2.4 真机腿「providers 背景读」腿于 #671 落后可达；原收窄要求因载体冻结转 live 面）。
- 判据腿：**M-683a** 值 ≡ 执行时实读 90；**M-683b** 后案行在位 + 冻结档 diff 零命中。

#### 2.2.6 #687（判定 = 消；③触发式存栏）

- ① 值回填（执行时实读对表；口径 = 内容行数）：§4.1 八行 = `index.html:207` → **55** ∕ `views/chrome.mjs:249` → **35** ∕ `app.mjs:214` → **285** ∕ `frame-dispatch.mjs:241` → **52** ∕ `chrome.css:209` → **268** ∕ `skin.css:211` → **13** ∕ `i18n.mjs:234` → **≈391**（台账给 388——以实读为准 ⚠） ∕ `chat.css:212` → **329**；§4.2 撤会话头块(`:843-858`)九档同拍；§7 `:1081` 句（`mount-head.mjs` 退场 + 余值对 §4.1 单源）。
- ② 登记补录：原登记 = §10 CO①（`:1166` 邻域）「`…baseline.json:233`（`.session-head` 快照）」⇒ 补第二处 **`:247`**（注释句）；来源 = head-toolcolor §2.10#5 ∕ §6:272（「并入 #687」）。
- ③ `chrome.css:231`（`:393` 死行号 ⇒ 引符号不引行号）：存栏——触发 = 该档下次触碰；本批零改。
- 判据腿：**M-687a** 八档值 ≡ 执行时实读；**M-687b** `:247` 补录在位 + `:233` 句保留；**M-687c** ③在册句无缺。

#### 2.2.7 #692（判定 = 消）

- 块 = `PROJECT.md:860-878`：块头「**待实施**——E10 方向裁…」⇒ 状态翻「实施完成（#673 · 2026-09-29——届盘实读回填）」；15 行值列 ⇒ 执行时逐档实读（`ipc.mjs` 行随 #685 先后定——届盘对表）。
- 计数：`:817`「**十一档**」⇒ 执行时 §4.1 越层段读值（现盘十四档；#685 先落 ⇒ 十三——**单源，禁双值并存**）。
- 判据腿：**M-692a** 块头零「待实施」残留 + 15 行值 ≡ 盘上实读；**M-692b** `:817` 计数 ≡ §4.1 越层段计数（两读相等）。

#### 2.2.8 #689（判定 = 消 2 + 存栏 1）

- ① `views/chat-chrome.mjs:142-144` JSDoc 补压缩行例外句（「压缩行 = 流元素冻结点、不在块插入点上——插入点纪律单源 = `docs/desktop/design/RENDERER.md` §2」）。
- ② `views/chat.mjs:26 ∕ :125-127`：口径统一沿设计档单源（`RENDERER.md:71`）——**尾组 = 四名（压缩行除外）**；压缩行单独列名（五名总序 = 压缩行 → 消化行组 → 到期触发行组 → 停止痕 → 台账行）；两注收正，行为零改。
- ③ `docs/batches/2026-09-29-desktop-compress-row-pin.test.mjs`（339 行 > 300）：存栏——批内件不计线（KD-4）；recipe = 入仓（进仓套件）时假 DOM（`:23-173`）提共享夹具；触发 = 入仓 ∕ 第二件需同夹具。
- 判据腿：**M-689a** 注面口径统一（零「五尾组」残留——grep）；**M-689b** 零行为改（既有批内件复跑绿）；**M-689c** ③存栏句（触发 + recipe）在册。

#### 2.2.9 #690（判定 = 存栏触发式；本批零改）

- ① 三件（皆批内件 · 不进仓套件；触发 = 各件下次复跑 ∕ 触碰批顺笔）：`desktop-residuals-round3.test.mjs` ⑩臂（`:407-423`）——复跑红 ⇒ 按届盘形态收正断言；`compress-row-pin.test.mjs` 夹具——recipe 同 §2.2.8③；`structure-split-2.test.mjs:113 ∕ :131`——`DIGEST` 冻结导出名集缺 `clearDigest`（digest-parity 批新增 ⇒ 复跑必红）⇒ 复跑时补集（+ 届盘他集对表）。
- ② 残项三件：`chat.css` 越线在册（`PROJECT.md:314`——预案 `chrome-denoise.css`；零改）· cap 支豁免（`events-wake.mjs:46` 现注；改即偏离已批准文本 ⇒ 零改）· `syncRounds` 注文（`chat-digest.mjs:138-139`——补记 recipe：下次触碰该档的批随记「收缩后位序复用」语义；本批零改——保「交付物 = 受审物」）。
- 判据腿：**M-690a** 本批对三件 + 残项零触（diff 零命中）；**M-690b** 触发句 + recipe 在册；**M-690c** `:314` ∕ 豁免 ∕ 现注三处在位。

### 2.3 分面清单

| 面 | 项 | 落点 | 调度注意 |
|---|---|---|---|
| 码面 → 实施舱 | #685 ∕ #686 ∕ #671 ∕ #679 ∕ #689①② | `thincoder-desktop/**`（§2.4 表） | 设计 token 签发后常规舱 |
| 档面 → 设计笔 | #683 ∕ #687 ∕ #692 + 实施随动 | `docs/desktop/design/{PROJECT,IPC,SHELL}.md` + `…baseline.json` | **排队 #1 席（heap-freeze）争写后 · 父侧调度**；执行时实读对表 |
| 批内件 → 存栏升级 | #689③ ∕ #690① | `docs/batches/*.test.mjs` 三件 | 本批零改；触发式 recipe |
| 存栏（触发·零动作） | #687③ ∕ #690② | `chrome.css:231` ∕ `chat-digest.mjs:138-139` | 触发 = 该档下次触碰 |

### 2.4 受影响文件与测试面（行数 = 届盘读 ∕ 预期——执行时实读为准）

| # | 文件 | 现读 ⇒ 预期 | 项 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/ipc.mjs` | 331 ⇒ ≈275 | #685 ∕ #686 |
| 2 | `thincoder-desktop/src/main/ipc-relays.mjs` | 新档 · ≈70 | #685 |
| 3 | `thincoder-desktop/src/main/ipc-registry.mjs` | ≈87 ⇒ ≈89 | #685 |
| 4 | `thincoder-desktop/src/main/project-info.mjs` | ±0（两注句；行数届盘对表） | #686 |
| 5 | `thincoder-desktop/renderer/mount-settings-reads.mjs` | 189 ⇒ ≈192 | #671 |
| 6 | `thincoder-desktop/renderer/mount-settings-segments.mjs` | 356 ⇒ ≈364（越线续增——无形态变 ⇒ 消解窗口顺延，不触发拆分） | #679 |
| 7 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | 228 ⇒ ≈230 | #679 |
| 8 | `thincoder-desktop/renderer/views/settings-sections-tools.mjs` | 163 ⇒ ≈164 | #679 |
| 9 | `thincoder-desktop/renderer/views/settings-sections-env.mjs` | 137 ⇒ ≈138 | #679 |
| 10 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | 214 ⇒ ≈215 | #689① |
| 11 | `thincoder-desktop/renderer/views/chat.mjs` | 299 ⇒ ≈299 | #689② |
| 12 | `docs/batches/2026-09-30-desktop-residuals.test.mjs` | 新（本批件 · ≤300） | M-671 ∕ M-679 ∕ M-685 ∕ M-686 腿 |
| 13 | `docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs` | 149 ⇒ ±2（R1 替身随动） | #686 |
| 14 | 档面档（§2.3 行 2） | 逐件在册 | #683 ∕ #687 ∕ #692 + 随动 |

- **测试面**：本批件 = `docs/batches/2026-09-30-desktop-residuals.test.mjs`（批次本地件 · 不登记 · 随批留存；复跑 = `node --test docs/batches/2026-09-30-desktop-residuals.test.mjs`）；仓套件（`thincoder-desktop/test/files.mjs` 空清单）零写 ∕ 零改 ∕ 零跑；集成面（`test/integration/` 空）零动。
- 跨限面：`ipc.mjs` 越 300 ⇒ 本项即其拆分解（≤300 回线）；余档零越 500 硬限。

### 2.5 不做清单（显式）

1. 本设计轮产品码零触（码面改动 = 实施舱事项）。
2. 不触 #694 堆面 ∕ heap-freeze 档面（排队其后）。
3. 冻结档零回改（#673 ∕ desktop-carryover ∕ head-toolcolor 等已收口记录——#683②按此转 live 面）。
4. 仓套件零动（不登记 ∕ 不新增集成件）。
5. 不扩新项（发现 ⇒ 上抛；本批 2 条）。
6. 邻面零触：#691（.mcp.json）· #677（跨线清零）· #649（性能余账）等。
7. 档面批量改动不在本设计轮落笔（争写避碰——父侧调度）。

### 2.6 上抛（2 条）

- **U1 · #683② 载体冲突**：台账载体 = `desktop-carryover.md` §2.4（已收口 ⇒ 不可改）。我裁 = 转 live 面（`PROJECT.md` §4.2 块「后案」行 + 本批档）；请父侧核载体选择。
- **U2 · #679 agent 径 = 免（实落三径）**：agent 面零草稿申报件 ⇒ 失效声明无对象；我裁 = 免、不补申报（不扩面）。请父侧知悉；若判须补 ⇒ 属扩面另轮。
- 附发现（非上抛）：① `i18n.mjs` 台账给值 388 vs 现盘实读 ≈391——按「执行时实读为准」处置；② `PROJECT.md:271` 指针已漂移（mount-onboarding 行现 = `:275`）；③ `invalidateDrafts` 以 `undefined` 入落 `console.error`（`mount-settings.mjs:109`）——providers 两现调点边界形（#652 遗留，报而不改）。

### 2.7 验收对照

- 九项全覆（§2.0）+ 判据腿逐项（M-685a–e ∕ M-686a–c ∕ M-671a–d ∕ M-679a–d ∕ M-683a–b ∕ M-687a–c ∕ M-692a–b ∕ M-689a–c ∕ M-690a–c）✓；
- 分面清单成表（§2.3）✓；上抛 = 2 ✓；
- 三链同源：§2.0 九行 = 台账 #685–#690 一一对应，无扩项。

### 2.11 修正轮（评审轮 1 发现 1–7）

**口径**：逐条落修（1–7 全采——父侧裁定 · 2026-09-30）；本节 = 修正后口径（append-only——原文字不改，以本节为准）。落笔前逐处实读复核（2026-09-30）；主锚引符号，行号一律降 as-of 注。

- **1 · #687② 落点重锚（符号锚）**：原登记 = `PROJECT.md` §10 **CO 行·档案观察条（③）**〔as-of `:1206`〕——条内载「批内件五件（含 `…structure-split-round.baseline.json` `.session-head` 快照）随面退场成档案件 · 不重跑 · 零动作；逐件登记 = 批档 `2026-09-29-desktop-head-toolcolor.md` §2.10」；`:233` 字面住该批档 §2.10#5（**非** PROJECT.md §10——「§10 全段」引法收正）。补录 = 同档 **`.session-head` 第二处 = 注释句条**（`.session-bar` 族头注释「…沿 `.session-head` 同族」；as-of `:247`——引符号不引行号）。**落点 = §10 CO③ 条括注增补**（live 面——批档 §2.10 已随批冻结 ⇒ 沿 #683②「冻结转 live 面」同判；件数不变 = 同一件内第二处）+ 本批档在册。**句形**（届盘可同义收正）：「…；逐件登记 = 批档 §2.10；**补：`docs/batches/2026-09-29-structure-split-round.baseline.json` 内 `.session-head` 第二处**（注释句条——同「不重跑 · 零动作」口径）」。
- **2 · `baseline.json` = 只读引证（零写）**：#687② 写靶 = §10 CO③ 条（live 面）；`…structure-split-round.baseline.json` **本体零写**（仅引证其内 `.session-head` 两处）。⇒ §2.1 ∕ §2.3 档面落点列**移出该件**（落点 = `docs/desktop/design/{PROJECT,IPC,SHELL}.md`）；§2.5#3 冻结口径不动（零写 ⇒ 无相抵）。
- **3 · §2.4 标注补全**：① 第 4 行 `project-info.mjs` 现行行数 = **181**（实读复核 2026-09-30 ≡ §4.1 行 as-of `:191`）⇒ 预期 **181**（Δ 0——两注句同形改写；届盘增行则对表）；② 补条件改动测试件两件（近第 13 行）：**13a** `docs/batches/2026-09-29-model-menu-parity.test.mjs`（**条件改动**——源文本读面（`:123-124` 邻域）断则随修 · 届盘定形）；**13b** `docs/batches/2026-09-29-enddiff-clearance.test.mjs`（**预期零破**——真 import `fileOpen` 面 · 随 M-685d 复核）。
- **4 · 本批自身档面登记（§2.1 ∕ §2.3 补）**：三件——① §4.1 行随动（本批触碰码面 11 档 + 新档 1；「现读 ⇒ 预期」逐行 = §2.4 表）② **§4.2 本批块**（**§2.4 表即该块内容**；式样沿近批块——as-of `:817 ∕ :844 ∕ :861`）③ 变更记录行（沿近批散条先例——as-of `:1534 ∕ :1536 ∕ :1550 ∕ :1554`）。**落笔窗口 = 本批执行窗口**（排队 #1 席（heap-freeze）争写后 · 父侧调度；实施落盘后实读回填）。
- **5 · §4.1 三行随拍收正（挂执行窗口）**：复核实读（2026-09-30 · 内容行数口径——文末换行不计）`mount-settings-exits.mjs` **227**（as-of `:269` 登记 227——≡）· `views/chat-chrome.mjs` **214**（as-of `:242` 登记 213——**+1**）· `ipc-registry.mjs` **86**（as-of `:168` ∕ W6 块 `:368` 登记 86——≡）；评审轮 1 报值（228 ∕ 214 ∕ ≈87）与本节复核存计法差 ⇒ **收正口径 = 本批执行窗口同口径实读落值**（与 §4.1 行随动同拍，不抢做——避 #1 席争写窗口）；i18n 行同拍对表（台账 388 ∕ 现盘 ≈386 ∕ 设计 ≈391——届盘实读为准，沿 M-687a）。
- **6 · segments 拆案点名（§2.4 第 6 行补）**：`mount-settings-segments.mjs` 356 ⇒ ≈364——**点名既有拆案** = 「MCP 族再出一档」（§4.1 行 as-of `:270` ∥ 越层段同档条 as-of `:308`）；**顺延判据** = #679 插句（声明点 ∕ 注句级 = 行级小修）**不属结构性触碰** ⇒ 消解窗口顺延、不触发拆分（零新增拆审判定）。
- **7 · #683① 两分支产物定形**：**A（默认）** = 保持「88 ⇒ 90」文本零改（两处：§4.1 行 as-of `:275` ∥ §4.2「批 B · ⑥ 拆分落形」条 as-of `:362`）+ 核值 ≡ 实读；**B（触发 = §4.1 定居口径判单值形）** = 两处同收「**90**」单值形（零语义）。**M-683a 追加**：A ⇒ 「88 ⇒ 90」在位 ∧ 值 ≡ 实读 90；B ⇒ 单值「90」在位 ∧ ≡ 实读 90。

**核验**：7 条逐号在位（本节即修正后口径）✓；实读复核（2026-09-30——`baseline.json:233 ∕ :247` · §10 CO③ · §4.x 各锚 · 行数面）✓；冻结档 ∕ 避让面零写 ✓。

### 2.12 实施后档面轮（2026-09-30 · 执行窗实读）

**口径**：设计档就地收正 + 逐处实读（内容行数口径——文末换行不计；父侧提示值仅线索，以现盘实读为单源）；产品码零触（本舱零 `thincoder-desktop/**` 码面写）；`…baseline.json` 本体零写（§2.11#2——只读引证）。

**#683（值核 ∕ 单值收形）**：两处同收单值形（§2.11#7 **B 支**——§4.1 定居口径判单值形）：§4.1 `mount-onboarding.mjs` 行 ⇒ **90**（实读 ≡）；§4.2「批 B · ⑥ 拆分落形」条 ⇒ 「本档 **90**」。**M-683a 核销**：单值「90」在位 ∧ 值 ≡ 实读 **90** ✓。

**#687（值回填 + 两登记）**：
- ① §4.1 八行 + §4.2 撤会话头块九档（同拍）实读落值：`index.html` **55** ∕ `views/chrome.mjs` **35** ∕ `chrome.css` **268** ∕ `skin.css` **13** ∕ `app.mjs` **289** ∕ `i18n.mjs` **391** ∕ `chat.css` **329** ∕ `frame-dispatch.mjs` **52**；`mount-head.mjs` = 删档。
- **存差披露（⚠）**：`app.mjs` ∕ `i18n.mjs` 现读 **289** ∕ **391** ≠ 批末记 285 ∕ 388（差 +4 ∕ +3——后继批次落盘随动，未逐笔归因）；以现盘为断（父侧提示值 285 ∕ 388 未采——M-687a「执行时实读」口径）。
- §7 注（`host-floor` U95 臂清单句）随动：`mount-head.mjs` 删档句 + 余值对 §4.1 单源。
- ② 补录落位 = §10 **CO③** 条括注增补（`docs/batches/2026-09-29-structure-split-round.baseline.json` 内 `.session-head` 第二处——注释句条；写靶 = live 面，沿 §1.4① 裁定；写门未触——`baseline.json` 零写）。**M-687b** ✓。
- ③ 存栏在册：`chrome.css:231` 注释死行号（`:393`）⇒ 「引符号不引行号」；触发 = 该档下次触碰——本批零改（产品码零触，不为即改；由 head-toolcolor §5.5#2 转承）。**M-687c** ✓。

**#692（块回填 + 计数）**：
- §4.2 口子清零二轮块：块头翻「实施完成（2026-09-29——E10 方向裁已落）」+ 表头翻「实读落值」+ 十五行按现盘实读回填（`queued-mark` **105** ∕ `activity-view` **205** ∕ `core.css` **332** ∕ `core-markdown.css` **190** ∕ `providers` **315** ∕ `loop-sampler` **77** ∕ `agent-host` **277** ∕ `agent-assemble` **102** ∕ `turn-driver` **252** ∕ `i18n-settings` **141** ∕ `chat-scroll` **112** ∥ VSC `ui.js` **222** ∕ VSC `session.css` **223** ∕ `ipc.mjs` **265**（#685 后）；测试面 **325** 行）。
- 计数：carryover 块头注「十一档」⇒ **十三档**——单源 = §4.1 越层段读值（十四 − `ipc.mjs` 除名〔265 ≤300〕= **十三**；父侧提示「十四」未采——拆档兑现须除名，两处禁双值）。**M-692a** 块头零「待实施」残留 ∧ 十五行值 ≡ 实读 ✓；**M-692b** 计数两处同值 ✓。

**本批自身档面登记（§2.11#4 兑现）**：
- §4.1 行随动：11 码档实读落值（`ipc.mjs` **265** ∕ `ipc-registry.mjs` **89** ∕ `project-info.mjs` **181**〔Δ0〕∕ `mount-settings-reads.mjs` **192** ∕ `mount-settings-segments.mjs` **364** ∕ `mount-settings-exits.mjs` **227** ∕ `settings-sections-tools.mjs` **163** ∕ `settings-sections-env.mjs` **137** ∕ `views/chat-chrome.mjs` **215** ∕ `views/chat.mjs` **299**）+ **新档行** `ipc-relays.mjs` **70**；越层段 `ipc.mjs` 除名（十四 ⇒ **十三档** ∕ 条目删）+ 贴层段 `app.mjs` 解消（**289**）；次大两档句随动（**364** ∕ **337**）。
- §4.2 本批「现行 ⇒ 实读落值」块新增（十五行 + 越表披露一行——§2.4 表即其内容）。
- 变更记录行落（三档同拍）：`PROJECT.md` ∕ `docs/desktop/design/IPC.md`（档头分发面计数 331 ⇒ **265** + `ipc-relays.mjs` **70** 新登）∥ `docs/desktop/design/SHELL.md`（§1 树增节点行）。
- 越表披露（1 项）补登：`docs/core/design/API-CONTRACT.md` 生成区机械重生（M-685e——生成器唯一笔；2695 条 · 604 档；§5.1 建议条兑现）。
- **§2.4 回填（append-only——以本节为准）**：
  - 行 12：标注「≤300」⇒ **KD-4 豁免括注（批内件不计线）**——实读 **468** 行（§5.2 记 469——文末行计法差 1；不计线判定不受影响；**U2 至此落定**）；
  - 行 6：拆案点名 = 既有「MCP 族再出一档」（§4.1 行 ∕ 越层段同源）；#679 三径声明属行级小修 ⇒ 消解窗口顺延、不触发拆分（§2.11#6 兑现）；
  - 行 4：`project-info.mjs` 现行 **181**（≡，Δ0）；**13a** `model-menu-parity.test.mjs` 实读 **302**（条件改动届满盘定形）；**13b** `enddiff-clearance.test.mjs` 实读 **456**（零破——复跑 11/11 绿）；
  - §2.2.8① 笔误顺笔：「`RENDERER.md` §2」⇒ **§1.1**（插入点纪律条实住 §1.1；实施已按 §1.1 落——`views/chat-chrome.mjs` 例外句）。
- §2.1 ∕ §2.3 档面落点列按 §2.11#2 收正：`…baseline.json` 移出写靶（只读引证；落点 = `docs/desktop/design/{PROJECT,IPC,SHELL}.md` 三档 + 本批档——以本节为准）。

**核验**：逐条实读复核（2026-09-30——§4.1 ∕ §4.2 各锚 · 三档同拍 · 计数两处同值）✓；冻结档零写 ✓；产品码零触 ✓。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审批次落档（审阅对象 = 本档 §2 设计 · 九项；范围 = 本档 + `thincoder/docs/desktop/design/PROJECT.md`；未声明项目标准档、文档地图缺失 ⇒ 方法合规 ∕ 文档归属两维降级判定）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（落点锚） | 🟡 | #687② 的「原登记」锚错位：设计称登记在「§10 CO①（`:1166` 邻域）」（本档 `:95`），但现盘 `PROJECT.md:1206` 才是 CO 行、其登记之条为 **③**（档案观察——逐件登记指向批档 §2.10），`:1166` 现为 BC 行；且被引字面「`…baseline.json:233`（`.session-head` 快照）」在 PROJECT.md §10 全段不现（只经 CO③ 转指批档）⇒ `:247` 补录落点不可定位 | 按符号重锚（「§10 CO 行·档案观察条」／全文搜 `baseline.json`＋`.session-head`），并写明 `:247` 补录句的落点与句形；行号锚随档漂移，宜引符号不引行号 |
| 2 | Clarity（落点边界） | 🟡 | §2.1 档面落点列含 `docs/batches/2026-09-29-structure-split-round.baseline.json`（本档 `:47`），但 §2 无任何子项说明该件要改什么；而 §2.5#3 又宣「冻结档零回改（已收口记录）」（本档 `:153`）——编辑 ∕ 只读边界不明，执行侧可误改已收口批产基线件 | 明确该件为「只读引证」（#687② 引证面）还是「随动目标」；若随动，写清改动面并与 §2.5#3 冻结口径对齐；若只读，移出「落点」列 |
| 3 | 受影响文件标注（判据 8） | 🟡 | §2.4 对 `project-info.mjs` 未给现行行数（仅「±0（两注句；行数届盘对表）」——本档 `:134`；现行值在 `PROJECT.md:191` = 181）；另 M-685d 声明对 `model-menu-parity.test.mjs:123-124`「断则随修」（本档 `:61`），而 §2.4 只登记 `desktop-ledger-emit-fix.test.mjs` 一件（本档 `:143`）——条件性改动测试件未入表 | 补 `project-info.mjs` 现行行数与 Δ；把「断则随修」的测试件（含预期 Δ）列入 §2.4，或注明「条件改动、届盘定形」 |
| 4 | 完整性（档面落点） | 🟡 | 本批自身实施面的档面登记未列：§2.1 ∕ §2.3 档面清单只含 #683 ∕ #687 ∕ #692 ＋ #685 ∕ #671 ∕ #679 随动（本档 `:47 ∕ :122-124`），未含本批触碰约 11 档码面 + 1 新档的 §4.1 行随动与 §4.2「现行 ⇒ 预期」本批块——而近批惯例逐批在案（`PROJECT.md:843 ∕ :860 ∕ :879` 各块；变更记录 `:1534 ∕ :1536 ∕ :1550 ∕ :1554` 均载「§4.2 增本批块」） | 在 §2.1 ∕ §2.3 明确本批自身 §4.1 行随动 + §4.2 本批块（内容 = §2.4 表）的落笔时点；或明说 §2.4 表即该块内容并登记其落笔窗口 |
| 5 | 数值稽核（判据 8 抽查） | 🔵 | §2.4 现读与 PROJECT.md 登记值微漂（1 行量级）：exits 228 vs `:269`=227；chat-chrome 214 vs `:242`=213；registry ≈87 vs `:168 ∕ :367`=86；i18n ≈391 vs `:234`≈386（台账 388——设计已自标 ⚠）。设计已统一「执行时实读为准」——报告项 | 执行时以实读落值；顺带把 §4.1 对应三行（exits ∕ chat-chrome ∕ registry）随本批实读收正，免生新滞后 |
| 6 | 结构层（>300 档） | 🔵 | `mount-settings-segments.mjs` 356 ⇒ ≈364（越 300）——§2.4 仅注「无形态变 ⇒ 消解窗口顺延，不触发拆分」，未点名既有拆案（「MCP 族再出一档」= `PROJECT.md:270 ∕ :307`），亦未给「#679 插句不属结构性触碰」的判据 | §2.4 行内点名既有拆案与顺延判据（无案则补一次性拆审判定），沿越 300 档带案在册惯例 |
| 7 | #683① 交付物 | 🔵 | ① 「值核」对象文本已是「88 ⇒ 90」（`PROJECT.md:275 ∕ :361`），M-683a 仅核「值 ≡ 实读 90」——「是否收单值形 ∕ 零改」的分支条件留给届盘，执行前交付物边界略糊 | 明确两分支产物（保持「88 ⇒ 90」= 零改并核值；或收「90」单值形），M-683a 追加对应断言 |

VERDICT: pass

计数：🔴 0 · 🟡 4 · 🔵 3（🟡 ∕ 🔵 不阻批准）

## §4 用户批准（主 agent）

**已批准（代签 · 承用户 2026-09-30 00:14 会话级授权）**
- 条件① 评审通过：§3 轮次 1 = pass（0🔴）✓
- 条件② 修正轮落地并逐处核验：§2.11（发现 1–7）落地，父侧回读核验 ✓
- 条件③ token 已签发 ✓（值不入档）
- 批准范围：实施舱 = **码面**（§2.1「码面（→ 实施舱）」全项：#685 拆分 ∕ #686 拒绝面 ∕ #671 草稿保真 ∕ #679 四径声明 ∕ #689 ∕ #690 码面件 + 批内测试件）；**档面**（#683 ∕ #687 ∕ #692 + 随动 + §10 CO③ 补录）= 设计舱另轮（终值随码舱落定后收正）。
- 在册：上抛 2 条父裁 = §1.4；`:190` 类外批项零触。

## §5 实施记录（eng-coder）

### 5.0 状态线

**状态行**：实施完成（2026-09-30 · 码面全项 + 批内件；档面随动 = 设计舱另轮）

### 5.1 交付摘要（本舱笔 = 码面）

- 落点（§2.4 表内 12 件 + 1 项越表披露）：`src/main/ipc.mjs`（拆点 331 ⇒ **265**：24 转口群出档 · `liveAgents` 新导出 · #686 调用点 `.catch` · import ∕ 导出 ∕ 档头随动）· `src/main/ipc-relays.mjs`（**新档** · 70 行 · 24 纯转口 + `liveAgents` 单向取用 · 零环）· `src/main/ipc-registry.mjs`（import 拆两源；`HANDLERS` 表 ∕ 注册序 ∕ 白名单零改）· `src/main/project-info.mjs`（两注句随动 · Δ0）· `renderer/mount-settings-reads.mjs`（#671 三写并持）· `renderer/mount-settings-segments.mjs`（#679 三径声明 + 删钥同族随修）· `renderer/mount-settings-exits.mjs`（`invalidateDrafts` 注入补传；agent 族零改）· `renderer/views/settings-sections-tools.mjs` ∕ `…-env.mjs`（两作用域面）· `renderer/views/chat-chrome.mjs` ∕ `views/chat.mjs`（#689①② 注面收正 · 行为零改）· `docs/batches/2026-09-30-desktop-residuals.test.mjs`（**新件** · 15 用例）。
- 越表披露（1 项）：`docs/core/design/API-CONTRACT.md` 生成区 —— **M-685e 腿**的机械重生成产物（生成器唯一笔 ∕ 零人工语义笔）；§2.4 未列该件（建议档面收口轮补登）。
- 零碰面（栅面纪律）：`main.mjs` ∕ `heap-watch.mjs` ∕ `render-core/**` ∕ `mount-onboarding.mjs` ∕ 150 窗族 ∕ #690 三件批内件 ∕ #689③ 存栏件。
- 跨批写门两处（父侧直执行 · 非本舱笔，与 §2.2.2 ∕ §2.4 行 13/13a 同判）：`2026-09-29-desktop-ledger-emit-fix.test.mjs:67`（R1 替身 ⇒ Promise 形）· `2026-09-29-model-menu-parity.test.mjs:123-126`（处理体在场检查拆两源 `ipc.mjs ∪ ipc-relays.mjs`）——形态与拆档相容（已核）。

### 5.2 终值行数表（内容行口径 · 文末换行不计；对照 §2.4 预期列）

| 档 | §2.4 预期 | 终值 | 判定 |
|---|---|---|---|
| `src/main/ipc.mjs` | ≈275（≤300 回线） | **265** | ✓（M-685a ≤300 绿） |
| `src/main/ipc-relays.mjs` | 新档 ≈70 | **70** | ✓ |
| `src/main/ipc-registry.mjs` | ≈89 | **89** | ✓ |
| `src/main/project-info.mjs` | 181（Δ0） | **181** | ✓ Δ0 |
| `renderer/mount-settings-reads.mjs` | ≈192 | **192** | ✓ |
| `renderer/mount-settings-segments.mjs` | ≈364 | **364** | ✓（越 300 属在册 · §2.11#6 既有拆案点名 ∕ 顺延） |
| `renderer/mount-settings-exits.mjs` | 228 ⇒ ≈230 | **227** | ✓（≡ §2.11#5 裁定实读值 227） |
| `renderer/views/settings-sections-tools.mjs` | ≈164 | **163** | ✓ |
| `renderer/views/settings-sections-env.mjs` | ≈138 | **137** | ✓ |
| `renderer/views/chat-chrome.mjs` | ≈215 | **215** | ✓（214 + 例外句 1 行） |
| `renderer/views/chat.mjs` | ≈299 | **299** | ✓ 零行差（注面就地改） |
| `docs/batches/2026-09-30-desktop-residuals.test.mjs` | 新（本批件 · ≤300） | **469** | ⚠ 存差 —— 按 KD-4「批内件不计线」（§2.2.8③ 于 339 行兄弟件同判）单档不拆；请档面收口轮二择一归口（5.6 U2） |

### 5.3 判据腿读数（命令 + 结果）

- **本批件**：`node --test docs/batches/2026-09-30-desktop-residuals.test.mjs` ⇒ **15/15 绿**（pass 15 ∕ fail 0）。覆盖 = M-671a–d ∕ M-679a–d ∕ M-685a–c ∕ M-686a–c ∕ M-689a；M-689b ∕ M-685d ∕ M-685e = 命令面（下两条）。
- **旧件复跑**（§2.4 行 13 ∕ 13a ∕ 13b）：`desktop-ledger-emit-fix` **7/7** · `model-menu-parity` **9/9** · `enddiff-clearance` **11/11**（皆零失败）。
- **M-685e**：`node scripts/api-contract.mjs --write` ⇒ `--check` = **OK(零漂移)**（2695 条 · 604 档；生成区含并行在途批已落盘的导出面 —— 生成器唯一笔，零手工语义）。
- **卫戍敏感（本舱自检 · 三处就地变异）**：把 #671 ready 并持 ∕ #679 MCP 声明 ∕ #686 `.catch` 三处就地变异 ⇒ 本批件实读 **pass 8 ∕ fail 7**（判别力在位）；复原后复跑 15/15 绿。
- **仓套件**：**零跑**（全清令 —— 发布门 = 父侧收口唯一跑；`thincoder-desktop/test/files.mjs` 空清单 ∕ 集成面零动）。

### 5.4 决策透明表（实施舱自主裁定 + 披露）

| 项 | 裁定 | 依据 ∕ 影响 |
|---|---|---|
| #679 env 声明点取 patch 键判 | `patch?.shell !== undefined` 才声明 `env:shell`（proxy 写零声明） | 视图面 proxy 三控件 ∕ shell select 零 `data-draft`（实读）⇒ proxy 写无草稿面；无条件声明会在「shell 写失败 + proxy 写成功」窗误伤 shell 草稿（违「失败径零声明」） |
| #679 tools 作用域取构造值 `tools:${kind}` | keySave ∕ runKeyDelete 两处同值形（不读 DOM） | 删钥径静止态输入件离场（无在场输入可读）⇒ 两径同形一致；值形与视图 `settings-sections-tools.mjs:94` 同模板（M-679b 两侧对齐机检） |
| 引用面指针 | `chat-chrome.mjs:145` 例外句引 `RENDERER.md` **§1.1**（非设计句形「§2」） | 插入点纪律条实住 §1.1（行 71；该档 `:43` 自引「本档 §1.1 插入点纪律条」）⇒ 按可解析指针落；§2.2.8① 句形「§2」为笔误（内审同判） |
| 批内件行数 | 469 行（>300 顾问线 · <500 硬限）单档不拆 | KD-4 批内件不计线；拆档需新增文件（§2.4 未列）⇒ 宁保设计文件面、以披露代扩面 |
| 化石句「设置族十二项」随群搬入 | **零改**（不私改半笔） | 纯搬纪律；该句收正原登记靶（`preload.cjs:11` 两处同笔）因本批改写 ipc 档头而悬空 ⇒ 父侧协调（5.6 U1） |

### 5.5 审计与代码评审（轮次 + 终态）

- **内审（explore 背离审计 · 1 轮）：clean** —— 四类（部分实现 ∕ 静默简化 ∕ 档漂移 ∕ 越表）零命中；行数面逐档实读相符；三项四类外事实（§5 空座 ∕ 批内件行数 ∕ tmp 残影）本舱归口 —— §5 由本节落；行数见 5.2；残影 = `thincoder-desktop/.thincoder/tmp/digest-red/**` 旧文本副本（非活源码，建议顺带登记清理）。
- **代码评审（advisor · type=code · 1 轮 · 同步）：pass**（0🔴；2🟡 非 must-fix + 2🔵）。落修 1 处（本舱笔内）= `ipc-relays.mjs` 档头枚举补「配置写」（🔵）；其余 = 披露 ∕ 父侧归口：化石句（🟡 协调 · 5.4）· 批内件行数存差（🟡 · 5.2）· M-671d 负控射程 = 开 ∕ 关 ∕ 取消三径（🔵 —— 用例题面已自明射程；两钥径复位点 `mount-settings-segments-providers.mjs:48 ∕ :70` 实读成立、未机检）。
- **fix round：2 轮**（① 内审后微修 `segments.mjs:157` 注句措辞；② 评审后档头枚举补项）——皆注释面零语义；两轮后复跑 15/15 绿。**终态 = clean**。

### 5.6 上抛（2 条）

- **U1（协调 · 化石句订正靶悬空）**：原登记「`ipc.mjs:6-7` ∥ `preload.cjs:11` 两处同笔」因本批改写 ipc 档头 ⇒ 现余靶 = `ipc-relays.mjs:34` ∥ `preload.cjs:11`。请父侧重挂，或明示「纯搬化石随改档批收」。
- **U2（存差登记）**：批内件 469 行 vs §2.4 行 12「≤300」标注 —— 请档面收口轮二择一（KD-4 豁免括注 ∕ §2.2.8③ recipe 提共享夹具）。

## §6 验证与收口（父代理）

**验证读数（父侧独立复核）**

- 批件 `docs/batches/2026-09-30-desktop-residuals.test.mjs` ⇒ **15/15 pass**（父侧重跑）；旧件 `ledger-emit-fix` **7/7** ∧ `model-menu-parity` **9/9** ∧ `enddiff-clearance` **11/11**（父侧同批复跑）；`api-contract --check` 零漂移（2695 条 · 604 档）
- 新档 `ipc-relays.mjs` **70** 行实读（24 转口 · 单向 import `liveAgents` 零环）
- 档面轮：§2.12 在位（`:203-232`）；父侧抽读 `PROJECT.md:168-169`（265 ∕ 70 新行）· `:306-313`（十三档 + 除名句）· `:905-925`（§4.2 块十五行）✓
- 父侧直执行 2 笔（可 revert）：`2026-09-29-desktop-ledger-emit-fix.test.mjs:67` ∕ `2026-09-29-model-menu-parity.test.mjs:123-125`（跨批旧件同步——§1.5）
- 仓套件 = 本波共享树在飞（并行实施舱）**未跑**——发布门 = 全波落定后父侧统一跑〔如实披露〕

**结算清单（D7）**

- 六座：§1 ✓ ∕ §2 ✓（修正轮 + 档面轮）∕ §3 ✓（评审 pass）∕ §4 ✓（代签）∕ §5 ✓（实施完成）∕ §6 = 本段
- 台账：**#671 ∕ #679 ∕ #683 ∕ #685 ∕ #686 ∕ #687 ∕ #689 ∕ #690 ∕ #692 → 已核销**（本笔）；**#699**（化石句订正靶重挂——下一码面轮）在册；**#703**（§4.1 存量漂移 7 处）新立
- 前批遗留交叉核对：跨批旧件两处已落（§1.5）；`baseline.json` CO③ 补录已落（`PROJECT.md:1241`）
- 残留（入册不阻收）：真机腿（设置交互面）= 用户面复验留观察；`chrome.css:231` 死行号注 = 存栏（随该档下次结构性触碰）
- **暂缓批复核：无**

**收口**：全链闭合（点火 → 设计 → 评审 → 代签 → 实施 15/15 → 档面轮 → 收口），记录冻结（2026-09-30）。
