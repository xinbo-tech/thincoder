# 2026-09-29 · structure-split-2
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 20:42 直令——池面转批：结构次险族二轮（#620 ∥ #651）。
> 台账 = #620 ∥ #651（结构次险族二轮 · 归批）。前情 = structure-split 批（已收口）同族续。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（2026-09-29 20:44 · 立批——设计轮已派）

- **来源** = 用户 20:42 直令；触发 = 池面转批——结构次险族二轮（承 structure-split 批先例：拆分 = 结构零语义）。
- **条目**：**#620**（三档逼线：`thincoder-cli/src/tui/model-picker.mjs` **499**（距硬限 1 行）∥ `thincoder-core/provider/responses.mjs` **495** ∥ `thincoder-core/manifest.mjs` **482**）· **#651**（越层两档拆分预案：`thincoder-desktop/renderer/views/chat-chrome.mjs` **335** ∥ `thincoder-desktop/src/main/turn-driver.mjs` **311**——预案待裁）。
- **口径**：届盘重读为准（读数会漂）；拆分方案 = 设计给（切点 ∥ 宿主档 ∥ import 面）；拆后复跑该档相关批件锁（防回归）。
- **边界**：语义零改；**五档以外零结构 ∥ 语义改动**——注释指针面（§2.5）∥ 批件锁改指（2 处）为批内许可项（两越层在册档注级触碰在此许可内；其他越层档不动）。
- **授权** = 13:52 ∕ 17:02 全权。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（五档方案全备 ＋ §3 轮次 1 发现 1–6 ∥ 轮次 2 发现 1、3–5 全数落地——2026-09-29 fix 轮）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**实施轮 · eng-designer · 2026-09-29（initial 设计轮——不实施）**

**交付摘要**：五档拆分方案全备（切点届盘实读 file:line 级 ∥ 宿主 ∥ 新档 ∥ import 面 ∥ 缝 ∥ 预算）+ 拆分批顺序建议（风险序）+ 结构零语义验收判据 + 复跑 ∥ 改指清单 + 避让表；三端登记面随动（desktop PROJECT.md ∥ CLI-DEBT.md ∥ CORE-UNIFICATION.md ∥ MANIFEST.md——本设计轮已落）。

### 2.0 口径与范围（承 §1）

- 条目 = **#620**（三档逼线：`thincoder-cli/src/tui/model-picker.mjs` ∥ `thincoder-core/provider/responses.mjs` ∥ `thincoder-core/manifest.mjs`）+ **#651**（越层两档：`thincoder-desktop/renderer/views/chat-chrome.mjs` ∥ `thincoder-desktop/src/main/turn-driver.mjs`）；授权 = §1 全权（13:52 ∕ 17:02）。
- 口径 = **届盘重读为准**（本设计轮全量实读 2026-09-29——含工作树未提交态）；拆分 = **结构零语义**（纯结构搬——切点 ∥ 宿主 ∥ import 面零改 ∥ 拆后复跑该档相关批件锁）。
- 禁止面（遵守）：产品码零触（本段 = 设计轮）· 拆分实施归实施轮 · 不发起评审。
- 缝制式 = **同名再出口 ∕ 同名保名**（先例 = `structure-split-round` KD-SS-1）——消费者 import 面零改；装配面 = 工厂注入制（沿 `createModelPicker` / `createTurnDriver` 先例）。
- 设计档落点 = 本段 + 三端登记面随动（desktop `PROJECT.md` ∥ cli `CLI-DEBT.md` ∥ core `CORE-UNIFICATION.md` §2.8.1 + `MANIFEST.md` §2.3 注——**本设计轮已落**；实读回填 = 实施轮）。

### 2.1 届盘实读（as-of 2026-09-29 · 内容行数口径〔文末换行不计〕）

| # | 档 | 登记读数 | 届盘实读 | 备注 |
|---|---|---|---|---|
| 1 | `thincoder-cli/src/tui/model-picker.mjs` | 499 | **499** | 距 500 硬限 **1 行**——最高优先 |
| 2 | `thincoder-core/provider/responses.mjs` | 495 | **495** | 距 5 行 |
| 3 | `thincoder-core/manifest.mjs` | 482 | **493** | **收正 +11**（#546 行数键等笔后）——距 7 行 |
| 4 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | 335 | **335** | 越 300 顾问线 |
| 5 | `thincoder-desktop/src/main/turn-driver.mjs` | 311（read 总行） | **310** | 越 300 顾问线 |

**工作树笔（未提交）实读**（`git status` 2026-09-29）：五档中三档处于未提交态——`manifest.mjs`（#546 行数键 ∥ 头注两句）· `chat-chrome.mjs`（#541 cap 行族——desktop-residuals-round3 波 B）· `turn-driver.mjs`（#543 ∥ #632 ∥ #623 ∥ #625 四缝）；model-picker ∥ responses 两档 clean。**本设计全程以工作树为基**（届盘口径——先例「工作树在飞未提交 ⋯ 设计轮落笔前已届盘重读」）。

**登记面（本批切入面）**：desktop = `docs/desktop/design/PROJECT.md` §4.1 越层段（`docs/desktop/design/PROJECT.md:312/:313` 两行——「拆分预案 = 待裁」）；cli = `docs/cli/design/CLI-DEBT.md:32` A1 行（「触发式 · 不预拆」转正案——预案在册）；core = `docs/core/design/CORE-UNIFICATION.md:1121` §2.8.1 子表行 1（responses 本批执行）+ `docs/core/design/MANIFEST.md:198` §2.3 表下注（manifest 双拆方案在册）。

### 2.2 逐档拆分方案

#### A. `model-picker.mjs`（499 → 宿 ≈315 + 新档 `provider-admin.mjs` ≈200）

- **切点（两段非连续——先例 KD-SS-3）**：迁出 = ① `:309-471`（163 行——段注「═══ 渠道管理流 ═══」起 … `setContextFlow` 止：`probeChannelFlow` `:311-323` ∕ `addProviderFlow` `:325-372` ∕ `removeProviderFlow` `:374-397` ∕ `setKeyFlow` `:399-407` ∕ `setProviderKey` `:409-423` ∕ `setContextFlow` `:425-471`）；② `:476-499`（24 行——`cascadeRemoveProvider` 含头注）。合计 **187 行**。
- **宿主留** = 头注 ∥ `entryKey` ∥ `fmtContextK` ∥ `getApiKey` ∥ `defaultModelLabel` ∥ `restoreSelection` ∥ `openModelPicker`（L1 循环——四流调用点改 `admin.*`）∥ `openModelListForProvider` ∥ `buildProviderEntries` ∥ `buildModelEntriesForProvider` ∥ `loadingRow` ∥ `fillAvailableModels` ∥ `loadSessionModels` ∥ `buildSlotEntriesForProvider` ∥ `selectModel` ∥ `pickModelForSlot` ∥ `fetchSlotModels` ∥ return 面。
- **宿主改动**：增 `import { createProviderAdmin } from "./provider-admin.mjs"`（1 行）+ 装配（`const admin = createProviderAdmin({ agent, pushLine, persistRaw, askQuestion, maskKey, showPicker, confirmDelete, C })`——`createModelPicker` 内 2 行带注）；调用面改 `admin.addProviderFlow()` ∥ `admin.removeProviderFlow()` ∥ `admin.setKeyFlow()` ∥ `admin.setContextFlow()`（`:70-77` 四行行内改）+ `selectModel` 内 `admin.setProviderKey(...)`（`:250` 行内改）+ return 面两处转口（`:473` 行内改）；import 面收（`:16` 去 `PRESETS`；`:18` 去 `probeChannelModels`）。预算 ≈ 499 − 187 + 3 ≈ **315**（<400 移出线 ✓）。
- **新档** = `thincoder-cli/src/tui/provider-admin.mjs`（拟新增——沿 CLI-DEBT A1 在册名）：`export function createProviderAdmin(ctx)`（ctx 子集 = `{ agent, showPicker, askQuestion, pushLine, persistRaw, maskKey, confirmDelete, C }`）→ `{ addProviderFlow, removeProviderFlow, setKeyFlow, setProviderKey, setContextFlow }` + `export function cascadeRemoveProvider`（原样迁）。import = `{ PROVIDER_PRESETS as PRESETS, providerSpec }`（`@thincoder/core/config.mjs`）∥ `{ probeChannelModels }`（`./model-catalog.mjs`）。预算 ≈ 187 + 头注 10 + import 2 ≈ **200**。
- **缝**：宿主 re-export `cascadeRemoveProvider`（1 行——保历史导出面；实读零现行外部消费者〔仅本档自用 ∥ docs 归档 ∥ tmp log〕）；返回面五名保名（`pickers.mjs` **import ∥ 装配面零改**——同名同 ctx 装配面；注释指针一行级随批，§2.5）。装配位 = **档内装配**（对在册预案「`pickers.mjs` 装配 +3 行」的届盘修订——由 = import ∥ 装配面零改第三档 ∥ ctx 子集已在手 ∥ 依赖单向；KD-S2-1）。
- **零语义证据面**：迁出两段逐行对拍（基线冻结先例）+ 返回面 ∥ 导出面 identity + `pickers.mjs` import ∥ 装配面零改 + 行为面（渠道管理四流 ∥ 级联清理悬挂引用）＝**源审级证据**（逐行对拍 ∥ 实读——无批件锁；机检子面＝批内件「缝解析」——§2.5）。

#### B. `responses.mjs`（495 → 宿 ≈275 + 新档 `responses-request.mjs` ≈232）

- **切点**：迁出 = `:22-245`（**224 行**——`isStatefulHost` 头注起 … `buildBody` 尾）：`isStatefulHost` `:22-31` ∥ `isStoreRequiredHost` `:33-42` ∥ `isNonStatefulHost` `:44-53` ∥ `chainKey` `:55-64` ∥ `builtinToolsFor` `:66-79` ∥ `toItems` `:81-138` ∥ `toTools` `:140-148` ∥ `normalizeUsage` `:150-160` ∥ `buildBody` `:162-245`。
- **宿主留** = 头注 ∥ `isChainInvalidError` `:247-250` ∥ `parseStream` `:252-319` ∥ `readResponseStream` `:321-359` ∥ `handleEvent` `:361-413` ∥ `chat` `:415-481` ∥ `finish` `:483-495`。
- **宿主改动**：删 import 行 `:14`（`specForModel` ∥ `isBailianHost`——全在迁出面）；增 `import { buildBody } from "./responses-request.mjs"`（1 行——`chat` 用）+ re-export 块（`export { buildBody, isStoreRequiredHost, builtinToolsFor } from "./responses-request.mjs"`——2 行）。预算 ≈ 495 − 224 − 1 + 4 ≈ **275**。
- **新档** = `thincoder-core/provider/responses-request.mjs`（拟新增——沿在册预案「`responses-request.mjs` 式」）：请求构造面全量逐字 + 头注；import = `{ specForModel, isBailianHost } from "../config.mjs"`（1 行）。预算 ≈ 224 + 头注 6 + import 1 ≈ **232**（在册预案估 ≈226——届盘细化 224 行迁出）。
- **缝**：re-export 保三名（`buildBody` ∥ `isStoreRequiredHost` ∥ `builtinToolsFor`）——`thincoder-cli/test/smoke-responses-chain.mjs:33` 的 `buildBody` import 零改；`isChainInvalidError` 留宿主（`chat` 两处消费 `:443` ∥ `:462`）；`provider/core.mjs:156` 动态 import `./responses.mjs` 的 `chat` 零改。**零环**：宿主 → 新档单向。
- **零语义证据面**：迁出块逐行对拍 + 三名 identity（经宿主解析 ≈ 直引新档）+ smoke 件复跑（门控——见 §2.5）。

#### C. `manifest.mjs`（493 → 宿 ≈252 + 新档 `manifest-schema.mjs` ≈146 + `manifest-discovery.mjs` ≈112）

- **切点（两刀）**：
  - 刀 1 **校验 ∕ 默认族** 迁出 = `:240-369`（130 行）+ `isValidDocRootValue` `:194-205`（12 行）——**两段非连续**（先例 KD-SS-3）：`DEFAULT_MANIFEST` `:240-263` ∥ `MANIFEST_SCHEMA` `:265-278` ∥ `isNonEmptyStringArray` `:280-284` ∥ `isLineCountsValue` `:286-290` ∥ `validateManifest` `:292-345` ∥ `fillDefaults` `:347-369`；另段 = `isValidDocRootValue` `:194-205`（随刀 1 裁定——`validateManifest` ∥ `docRootPaths` 共引）。**合计 142 行**。
  - 刀 2 **发现 ∕ 归属族** 迁出 = `:39-143`（**105 行**）：`MANIFEST_REL` `:39-40` ∥ 测试注入三件 `:41-44` ∥ `scanChildren` `:46-63` ∥ `discoverProjects` `:65-88` ∥ `discoverRepos` `:90-110` ∥ `owningProject` `:112-131` ∥ `resolveProjectRoot` `:133-143`。
- **宿主留** = `readManifest` ∥ `requireManifest` ∥ `resolveEngineeringManifest` ∥ `ambiguousProjectMessage` ∥ `writeManifest` ∥ `initManifest` ∥ `projectView` ∥ `viewAtRoot` ∥ `docRootBase` ∥ `docRootPaths` ∥ `isValidDocRootValue`？——**裁定**：`isValidDocRootValue` 随刀 1（`:194-205`——刀 1 两迁出段之一；`validateManifest` ∥ `docRootPaths` 共引）；`docRootPaths` ∥ `docRootBase` ∥ `writeRoot` ∥ `manifestFilePath` 留宿主（写 ∕ 读定位族）。
- **宿主改动**：增两 import（schema 四名 `{ DEFAULT_MANIFEST, isValidDocRootValue, validateManifest, fillDefaults }` ∥ discovery 四名 `{ MANIFEST_REL, discoverProjects, owningProject, resolveProjectRoot }`）+ re-export 两行块（迁出面全导出保名）。预算 ≈ 493 − 247 + 6 ≈ **252**。
- **新档 1** = `thincoder-core/manifest-schema.mjs`（拟新增）：校验族全量（**零 import**——纯 JS 谓词 ∥ 冻结常量）；预算 ≈ 142 + 头注 4 ≈ **146**（142 = 130 + 12 两段）。
- **新档 2** = `thincoder-core/manifest-discovery.mjs`（拟新增——沿 MANIFEST.md §2.3 注在册名）：发现族全量（import = `node:fs` ∥ `node:path`）；预算 ≈ 105 + 头注 6 + import 1 ≈ **112**。
- **缝**：主档 re-export 全迁移导出（`MANIFEST_REL` ∥ `discoverProjects` ∥ `discoverRepos` ∥ `owningProject` ∥ `resolveProjectRoot` ∥ `_setProjectRootForTest` ∥ `_resetProjectRootForTest` ∥ `DEFAULT_MANIFEST` ∥ `MANIFEST_SCHEMA` ∥ `isValidDocRootValue` ∥ `validateManifest`）——**13 个 import 点零改**（实读：`conventions.mjs:40` ∥ `ledger-cmd.mjs:16` ∥ `ledger-db.mjs:21` ∥ `ledger-migrate.mjs:15` ∥ `agent/setup-reminders.mjs:35` ∥ `agent/write-gate.mjs:31` ∥ `agent-tools/batch-paths.mjs:17` ∥ `agent-tools/eng.mjs:20` ∥ `tools/git.mjs:11`——九档十三名面）。**零环**：宿主 → 两新档 ∥ 两新档零互引。
- **对在册预案的修订**：在册（`MANIFEST.md:198`）= 单拆发现族（触发 = 越 500 或下次触碰发现族）；**本批修订 = +校验族第二刀**——由 = 单拆余量 ≈395 仍 >300，不达本族处置口径（结构次险族 = 回安全区 ≤300）；校验族 = 零依赖天然第二切面（KD-S2-2）。
- **零语义证据面**：两迁出块逐行对拍 + 全导出面 identity + 13 import 点零改 + 行为面（发现梯五级 ∥ 五态读侧 ∥ 校验 ∥ 入口决策树 ∥ 读写门）＝**源审级证据**（逐行对拍 ∥ 实读——无批件锁；机检子面＝批内件「缝解析」——§2.5）。

#### D. `chat-chrome.mjs`（335 → 宿 ≈226 + 新档 `chat-digest.mjs` ≈122）

- **切点（三段非连续——digest 全族）**：迁出 = ① `:30-88` 内 digest 部件：`countOf` `:30-33` ∥ `digestLabel` `:35-41` ∥ `digestCount` `:43-46` ∥ `countRowText` `:48-55` ∥ `countRowClass` `:57-62` ∥ `capText` `:64-68` ∥ `digestCapRow` `:70-77` ∥ `digestGroupNode` `:79-88`；② `:162-217`：`equivalentDigest` `:162-174` ∥ `updateDigestRows` `:176-184` ∥ `digestPresent` `:186-193` ∥ `syncDigest` `:195-217`；③ `:309-315`：`digestAnchorOf`。合计 **112 行**。
- **宿主留** = `chromeProps` ∥ `TIMER_CAP`+`timerLines` ∥ `timerGroupNode` ∥ `syncTimer` ∥ `stoppedNode` ∥ `ledgerGroupNode` ∥ `summaryNode` ∥ `pillNode` ∥ `syncTailNode` ∥ `syncLedger` ∥ `chromeSlot` ∥ `syncChrome` ∥ `focusAutofocus` ∥ `blockAnchor` ∥ `timerAnchorOf` ∥ `stoppedAnchorOf` ∥ `ledgerAnchorOf`。
- **宿主改动**：增 `import { digestAnchorOf, syncDigest } from "./chat-digest.mjs"`（1 行）+ re-export `digestGroupNode` ∥ `digestPresent`（2 行——保 `renderer/views/chat.mjs:52` 十名 import 零改）。预算 ≈ 335 − 112 + 3 ≈ **226**。
- **新档** = `thincoder-desktop/renderer/views/chat-digest.mjs`（拟新增）：digest 族全量逐字 + 头注；import = `{ build, text } from "../dom.mjs"` ∥ `{ t } from "../i18n.mjs"`（2 行）。预算 ≈ 112 + 头注 6 + import 2 ≈ **122**。
- **缝**：宿主 re-export 两名（`digestGroupNode` ∥ `digestPresent`——`chat.mjs` 构树 ∥ 帧尾两径消费）；`syncChrome`（`renderer/app.mjs:49` ∥ `chat.mjs:52`）保名在宿主。**零环**：宿主 → 新档单向。
- **零语义证据面**：三段逐行对拍 + 批件锁复跑（r6 ∥ residual3——`syncChrome` import 面零改；两锁全绿预期）+ 帧刷判据（幂等 ∥ 扩门在场判据 ∥ 锚链族内序——#541 随迁）。

#### E. `turn-driver.mjs`（310 → 宿 ≈222 + 新档 `turn-input.mjs` ≈113）

- **切点**：迁出 = `:177-269`（**93 行**——`send` 头注起 … `interrupt` 尾）：`send` `:177-255`（含头注 13 行）∥ `interrupt` `:257-269`（含头注 3 行）。**迁出界 = 「msg 双通道族」**（`msg:send` ∥ `msg:interrupt`）。
- **宿主留** = `flights` ∥ 墓碑四件（`turnEpochs` ∥ `epochOf` ∥ `revokeTurns` ∥ `turnGate`）∥ `queued`+`queueView` ∥ `prepare`+`degrade` ∥ `injectUserText` ∥ `askContinue` ∥ `onCapCancelled` ∥ `createTurnFace` 装配 ∥ `createTurnChain` 装配 ∥ `notifier` ∥ `suspension` 装配 ∥ `drive` ∥ `hold` ∥ `takeOver` ∥ `dispose` ∥ `abortSuspensions` ∥ return 面。
- **宿主改动**：增 `import { createTurnInput } from "./turn-input.mjs"`（1 行）+ 装配 `const { send, interrupt } = createTurnInput({ post, ensure, flights, queued, chain, suspension, drive, projects, denyGates })`（**置于 `suspension` 装配之后**——3-4 行；suspension 此时非 null）；imports 收（`:32` 去 `cleanupTurn`；`:35` `slotOfKey` 行删——随迁）；头注 ⑤ 句收（「send ∥ interrupt 出档 `turn-input.mjs`」）。预算 ≈ 310 − 93 − 1 + 5 ≈ **221-222**。
- **新档** = `thincoder-desktop/src/main/turn-input.mjs`（拟新增）：`export function createTurnInput({ post, ensure, flights, queued, chain, suspension, drive, projects, denyGates })` → `{ send, interrupt }`——两函数逐字迁 + 头注；import = `{ cleanupTurn, degradeTurnAttachments, prepareTurnAttachments } from "./attachments.mjs"` ∥ `{ slotOfKey } from "./session-slots.mjs"`（2 行）。预算 ≈ 93 + 头注 8 + import 2 + 工厂壳 10 ≈ **113**。
- **注入面（9 项）**：`post` ∥ `ensure` ∥ `flights`（Map 引用共享）∥ `queued` ∥ `chain` ∥ `suspension` ∥ `drive` ∥ `projects` ∥ `denyGates`——其余（`slotOfKey` ∥ `prepareTurnAttachments` ∥ `degradeTurnAttachments` ∥ `cleanupTurn`）新档自 import。
- **缝**：`createTurnDriver` 保名 ∥ 返回面 `send` ∥ `interrupt` 保名（`src/main/agent-host.mjs:48` import 零改）；`hold` ∥ `drive` 留宿主（链 ∥ 窗两装配注入时序在 input 面之前——不迁；KD-S2-3）。**零环**：宿主 → 新档单向。
- **零语义证据面**：迁出块逐行对拍 + 批件锁复跑（9 锁——2 处改指，见 §2.5）+ 行为判据（受理三态 ∥ 窗内路由 ∥ 跨中止闸 ∥ 中断携文 ∥ 占位查位）。

### 2.3 拆分批顺序建议（风险序）

| 序 | 档 | 由 |
|---|---|---|
| 1 | `model-picker.mjs` | **余 1 行**——任何增量破 500 硬限（最高优先） |
| 2 | `responses.mjs` | 余 5 行 |
| 3 | `manifest.mjs` | 余 7 行（且余量最小的三档中唯一双拆） |
| 4 | `turn-driver.mjs` | 顾问线；改指面已在案（2 处），先落则 chat-chrome 的批件锁复跑面独立 |
| 5 | `chat-chrome.mjs` | 顾问线；批件锁全绿预期，最短路径 |

- 三端文件零交 ⇒ 可并行实施；**建议同批全量落**（一次验收——批件锁复跑 ∥ `node --check` ∥ 三端 run.mjs 同轮跑毕）。
- desktop 两档（4 ∥ 5）置于避让序之后（见 §2.7）——RF 面落定 ∥ 工作树笔届盘复核后开工。

### 2.4 结构零语义验收判据（AC-S2——逐条机检可判）

- **AC-S2-1 落盘与行数**：五档拆后回落——`model-picker` ≈315（<400 移出线 ✓）· `responses` ≈275 · `manifest` ≈252 · `chat-chrome` ≈226 · `turn-driver` ≈222（core ∥ desktop **全 ≤300** ∥ cli <400）；新档**六件**落盘（≈200 ∥ 232 ∥ 146 ∥ 112 ∥ 122 ∥ 113——六个新档：provider-admin ∥ responses-request ∥ manifest-schema ∥ manifest-discovery ∥ chat-digest ∥ turn-input）。
- **AC-S2-2 逐字零变**：各档迁出块与原文逐行一致（diff 正负行对拍——基线冻结先例 KD-4）。
- **AC-S2-3 引用面**：消费者 import 面零改——`pickers.mjs` ∥ `provider/core.mjs` ∥ 13 manifest 点 ∥ `chat.mjs`∥`app.mjs` ∥ `agent-host.mjs`（逐档实读清单见 §2.2）。
- **AC-S2-4 缝**：迁移导出名经宿主解析与直引新档同引用（import identity）。
- **AC-S2-5 行为**：批件锁复跑（§2.5 清单——绿集对绿集；2 处改指后绿）+ `node --check` 全改档绿 + 三端 `node test/run.mjs` 绿（空清单）。
- **AC-S2-6 零环**：依赖单向（宿主 → 新档；新档不 import 宿主）。
- **AC-S2-7 登记面**：三端设计档随动落（本设计轮已落——§2.8 列点）+ 代码内注释指针随批（§2.5 清单）。

### 2.5 复跑清单（批件锁 ∥ 改指表 ∥ 指针面 ∥ 受影响档注记 ∥ 核端机检面）

**批件锁（docs/batches/*.test.mjs——实读 2026-09-29）**：

| 档 | 锁 | 锁定面 | 拆后判定 |
|---|---|---|---|
| responses | `thincoder-cli/test/smoke-responses-chain.mjs:33`（buildBody——门控 smoke ∥ 手动跑） | import 面 | **绿预期**（re-export 保名） |
| chat-chrome | `docs/batches/2026-09-28-tech-debt-closeout-r6.test.mjs:157/:172` ∥ `2026-09-29-desktop-residuals-round3.test.mjs:475/:501` | `syncChrome` import | **绿预期**（保名在宿主） |
| turn-driver | `2026-09-28-desktop-session-title.test.mjs:24` ∥ `2026-09-29-desktop-residuals-round3.test.mjs:619` ∥ `2026-09-29-desktop-susp-queue.test.mjs:54` ∥ `2026-09-29-desktop-window-queue-parity.test.mjs:37/:461` ∥ `2026-09-29-missing-face-family.test.mjs:30` ∥ `2026-09-29-parity-b4-vsc-small.test.mjs:26` ∥ `2026-09-29-parity-b8-ipc.test.mjs:152` ∥ `2026-09-29-queue-pickup-edge.test.mjs:221/:312` ∥ `2026-09-29-send-busy-timing.test.mjs:35` | import ∥ mod ∥ 直测 ∥ 源文本 | **7 锁绿预期**（装配段 ∥ 保名面）＋ **2 处改指**（下行） |
| model-picker ∥ manifest | （零批件锁——实读） | — | — |

**改指表（2 处——均由「锁面迁出」所致；实施轮随批改指，沿 micros 先例「tmp 副本已落 ∥ docs 副本若写门拒 ⇒ 父侧收位」）**：

1. `docs/batches/2026-09-29-desktop-susp-queue.test.mjs:121`——`text("...turn-driver.mjs")` 锁窗支回执三态段（`suspension.pushInput(...) → "full" → queue-full → busy`）⇒ 随 `send` 迁出 ⇒ 改指 `text("...turn-input.mjs")`。
2. `docs/batches/2026-09-29-send-busy-timing.test.mjs:303`——`text("...turn-driver.mjs")` 锁「受理形发射单点」（`post("ev:activity", { key, event: "turn" })` 恰 1）⇒ 随 `send` 迁出 ⇒ 改指 `text("...turn-input.mjs")`。

**复核项（实施轮届盘）**：`2026-09-29-desktop-susp-queue.test.mjs:324`（turn-driver 字面入列——按清单上下文判，大概率保名绿）∥ `queue-pickup-edge:221` 锁装配行（留宿主——绿预期）。

**其它回归面（现状实读）**：三端 `node test/run.mjs` = **空清单绿**（2026-09-28 全清重置——零用例；core `run.mjs` 收集面自检 **在跑**——每次执行恒走：`fail` 出口（`:18`）∥ ②' 无漏收集 ∥ ②'' 软链目录拒绝 ∥ 空清单守卫（实读 `thincoder-core/test/run.mjs:17-45`）∥ desktop `run.mjs` 有 files.mjs 清单两向自检）⇒ 拆后跑法 = 同命令 ∥ 同绿（两新档落核根、不进 `test/` ⇒ 收集面零影响）；`node --check` 全改档（五宿主 + 六新档——先例口径）；desktop 批件锁跑法 = `node --import test/rc-resolve.mjs --test <file>`（rc 解析钩子——沿 RF 批档先例）。

**代码内注释指针面（随批一行级——实施轮届盘 grep 复核）**：chat-chrome 面——`renderer/views/compress-status.mjs:11/:69`（blockAnchor 联动注——仍真）∥ `chat.mjs:11/:13/:48/:52/:59` ∥ `events-wake.mjs:75` ∥ `store.mjs:15` ∥ `approval.mjs:15`（digest/帧尾面注——随迁后部分失真 ⇒ 判改指 ∥ 仍真两分）；turn-driver 面——`agent-host.mjs` 十处 ∥ `file-refs.mjs:6` ∥ `suspension-drive.mjs:139/:306` ∥ `turn-face.mjs:11/:59` ∥ `window-queue.mjs:64`（send ∥ interrupt 出入——多数仍真；「输入路由三径」句收）；model-picker 面——`pickers.mjs:124`（「渠道管理」句 ⇒ 加「迁 provider-admin.mjs」注）；responses ∥ manifest 面——文档坐标（.md）**报而不改**（归文档面——先例 KD-16 ∥ T-DSK20 口径）。

**五档以外受影响档注记（判据 8 补 · 现读 2026-09-29 · 内容行数口径〔文末换行不计〕）**：

| 档 | 现读 | 改动面 | 预期增量 |
|---|---|---|---|
| `docs/batches/2026-09-29-desktop-susp-queue.test.mjs` | **368** | 批件锁改指（改指表 1） | 锁改指 ∥ 净 0 |
| `docs/batches/2026-09-29-send-busy-timing.test.mjs` | **325** | 批件锁改指（改指表 2） | 锁改指 ∥ 净 0 |
| `thincoder-desktop/renderer/views/compress-status.mjs` | **74** | 注释指针（blockAnchor 联动注——仍真判） | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/renderer/views/chat.mjs` | **299** | 注释指针（digest ∕ 帧尾面注） | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/renderer/events-wake.mjs` | **84** | 注释指针 | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/renderer/store.mjs` | **302** | 注释指针（越层在册档） | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/renderer/views/approval.mjs` | **243** | 注释指针 | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/src/main/agent-host.mjs` | **262** | 注释指针（十处） | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/src/main/file-refs.mjs` | **19** | 注释指针 | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/src/main/suspension-drive.mjs` | **337** | 注释指针（越层在册档） | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/src/main/turn-face.mjs` | **173** | 注释指针 | 注释级 ∥ 净 0 / ±1 |
| `thincoder-desktop/src/main/window-queue.mjs` | **103** | 注释指针 | 注释级 ∥ 净 0 / ±1 |
| `thincoder-cli/src/tui/pickers.mjs` | **133** | 注释指针（`:124`「渠道管理」句加迁注） | 注释级 ∥ 净 0 / ±1 |
| `docs/batches/2026-09-29-structure-split-2.test.mjs` | **0**（拟新增） | 批内件——缝解析 ∥ 装配级 smoke（零锁两档证据载体；§2.5 ∥ §2.8） | 拟新增 0 → **218**（实读回填 2026-09-29——终位 · 五面全绿） |

- **零锁两档行为证据载体（model-picker ∥ manifest）**：机检子面 = 批内件 `docs/batches/2026-09-29-structure-split-2.test.mjs`（缝解析——迁移导出经宿主 re-export 与直引新档同引用 ∥ 装配级 smoke——`createProviderAdmin` 五名可解析 ∥ manifest 入口经 re-export 可解析；不触流程语义）；流程级行为面 = **源审级证据**（逐行对拍 ∥ 实读——本批零语义搬移 ⇒ 无行为级执行判据）。
- **核端机检面（core——本批相关）**：① 收集面自检**在跑**（明细见上「其它回归面」）；② **T54 改指** ＋ ③ **`SOFT_LINE_REGISTRY` 处置** = 实施轮同笔义务（明细见 §2.8）。

### 2.6 避让表（2026-09-29 届盘）

| 在写面 ∥ 在飞批 | 触点 | 与本批关系 |
|---|---|---|
| **RF（`2026-09-29-desktop-rebuild-fidelity`）** | 码面写域 = §2.9 表 24 行 ∥ 波 2 十产品档（实读——**不含本批五档**）；文档面 = `docs/desktop/design/PROJECT.md`（U2 ∥ 本批 §4.1/§4.2 同档区段） | 码面**零交**；文档面**同档双笔** ⇒ 串行落笔安全（本设计轮已先落）。**实施避让序 = 拆分先落**（纯搬零语义 = 稳定基——沿 U4 先例「拆分先落 ⇒ 他批行基与差分区段届盘重钉」）。**上抛①**（所指核对） |
| **工作树未提交笔**（本批三档 M 态） | `manifest.mjs`（#546）∥ `chat-chrome.mjs`（#541）∥ `turn-driver.mjs`（#543/#632/#623/#625）——内容属已收口批的积压笔 | 拆分以其为基（届盘读 = 含笔态）；实施轮开工届盘复核（若笔又动 ⇒ 切点按内容锚重钉） |
| `2026-09-29-desktop-carryover` ∥ `-core-carryover` ∥ `-vsc-carryover` ∥ 余 09-29 在飞批 | 桌面核面他档 ∥ 核面他档 | **零交**（不触本批五档——实读） |

### 2.7 关键决策（KD-S2）

- **KD-S2-1 装配位 = 档内装配**（model-picker 内 `createProviderAdmin`——对在册预案「`pickers.mjs` 装配 +3 行」的届盘修订）。由 = import ∥ 装配面零改第三档（`pickers.mjs` 133 行——结构面零触；注释指针一行级随批，§2.5）∥ ctx 子集已在手 ∥ 依赖单向（admin 不引 model-picker）。被否：`pickers.mjs` 装配（多改一档 + 中转面）。
- **KD-S2-2 manifest 双拆**（发现族 + 校验族——对在册单拆方案的修订）。由 = 单拆余量 ≈395 仍 >300（不达本族处置口径）；校验族 = 零依赖天然第二切面。被否：单拆发现族（399/395 仍须带拆分计划——半程处置）。
- **KD-S2-3 turn-driver 迁出界 = msg 双通道（`send`∥`interrupt`）**；`hold` ∥ `drive` 留宿主。由 = `hold`/`drive` 被链 ∥ 窗两装配注入（时序在 input 面之前——迁出引入时序转口）；`send` = 最大单体（79 行）且与 `interrupt` 同通道族语义。被否：全「输入路由四径」（`dispose`/`abortSuspensions` 与装配表清 ∥ 桥 scope 强耦合——注入面过宽）∥ 小刀（`dispose`+`abortSuspensions` 仅 −20 行——贴线无意义）。
- **KD-S2-4 chat-chrome 单刀 = digest 全族**（112 行）。由 = 迁后 ≈226（余量健康）∥ 族自洽（词面 ∥ 组构树 ∥ 帧刷 ∥ 锚一体）∥ 缝天然（两名 re-export）。被否：尾组多族全迁（过度——335 无此需要）。
- **KD-S2-5 缝 = 同名再出口统一制式**（六档同一手法——消费者 import 面零改；先例 KD-SS-1）。
- **KD-S2-6 批件锁 2 处改指**（susp-queue:121 ∥ send-busy-timing:303）——由 = 锁面（send 体）随迁；处置沿 micros 先例（实施轮改指 ∥ 写门拒则父侧收位）。

### 2.8 实施轮义务（拆落盘后）

- 五档拆落盘（六新档）+ 批内件 `docs/batches/2026-09-29-structure-split-2.test.mjs`（结构不变量：行数上界 ∥ 迁出块逐字 ∥ 导出 identity ∥ 零环源扫 ∥ **缝解析**〔零锁两档——re-export 同引用 ∥ 装配级 smoke〕）+ §2.5 复跑 ∥ 改指（2 处）+ `node --check` ∥ 三端 run.mjs + doc-check（本批写域零新增红）。
- **T54 改指（实施轮同笔）**：发现族迁出后 T54 源码面读点 `thincoder-core/manifest.mjs` ⇒ `thincoder-core/manifest-discovery.mjs`；`MANIFEST.md:84` 机判句 ∥ `:630` 用例行同笔收正（同族引用面 `:554` ∥ `:170` ∥ `:187` ∥ `:213` 复核）；用例执行体随 2026-09-28 全清重置暂空——改指落文档面同笔，落码随测试体系重建。
- **`SOFT_LINE_REGISTRY` 处置（实施轮同笔）**：manifest 拆后 ≈252 <300 ⇒ 自超线面移出（`CORE-UNIFICATION.md` §2.8.1 计数句 ∥ 子表行 19 兑现收正——沿子表行 2 已兑现先例）；两新档 ≈146 ∥ ≈112 ⇒ 复核为免登记；运行面（`core-hygiene.test.mjs` 的 Set——全清重置后现不在盘）按 §2.8.1 现口径随测试体系重建恢复时落册。
- **登记面实读回填**（实施轮）：desktop `PROJECT.md`（§4.1 五行 ∥ 越层段两档除名收句 ∥ §4.2 本批块实读）；`docs/cli/design/CLI-DEBT.md`（A1 行 ⇒ 拆后移 §4 已消解——读数 315 ∥ 200；`:28` 表 A 计数句「15 档」⇒ 14）；`docs/core/design/CORE-UNIFICATION.md` §2.8.1（行 1 与 manifest 行实读收 ∥ 计数句；`:1113`「距 500 硬限最近五档（496 / 495 / 495 / 491 / 481）」句——responses 495 ⇒ ≈275 后失真须重排）；`MANIFEST.md`（§2.3 表行 ∥ 注块实读）。
- **设计轮已落（本段同批）**：三端登记面预登——`PROJECT.md:312/:313` 两行（待裁 ⇒ 本批拆）∥ `CLI-DEBT.md:32` A1 行（本批执行 + 切点）∥ `CORE-UNIFICATION.md:1121` 行 1（本批执行）∥ `MANIFEST.md:198` 注（双拆修订）——四档已落笔（明细见报告）。

### 2.9 上抛项（父侧裁）

1. **「RF 在写文件」所指核对**：实读 `2026-09-29-desktop-rebuild-fidelity` 批档（§2.9 表 24 行 ∥ 波 2 十产品档 ∥ §5 全波）——其码面写域**不含**本批五档；而 `chat-chrome` ∥ `turn-driver` 的**工作树未提交笔为真**（内容 = residual3 波 B ∥ D3 补遗 ∥ 缺面族 ∥ 挂起窗径批）。避让序（拆分先落 + 届盘重钉）对两解均成立；若父侧另有所指（未落盘计划）请届盘核定。
2. **批件锁改指的写门**（2 处 docs/batches 存档件——若写门拒 ⇒ 父侧收位——沿 micros 先例）。
3. **manifest 读数收正扩散面**：登记面多处引 482（`MANIFEST.md:218` ∥ `:649` 等——两处**日期记录行**（482 为史值，行随档留）；本设计轮已收正 `MANIFEST.md:198` 注与 §2.3 表行；余处归其实施轮/文档轮）。
4. **`turn-driver` read 总行 311 ∥ 内容 310** 口径差（登记面已并存注明——实施轮收一致）。

### 2.10 边界（本批不做）

- 五档以外零**结构 ∥ 语义**改动——注释指针（§2.5）∥ 批件锁改指（2 处）为批内许可项（注释级 ∥ 指级）；五档本体语义零改（AC-S2-2）∥ 不实施（拆分归实施轮）∥ 不发起评审。
- 不做五档的进一步续拆（拆后余量健康者不再拆）；不并其他结构档。

### 设计修正轮（fix）· eng-designer · 2026-09-29

**承** = §3 轮次 1 发现 1–6（父侧全数裁定接受——`Suggestion` 列 = 处置建议，处置执行 = 本段；逐号落地）：

- 1（🟡）边界句收正——§2.10 改「五档以外零**结构 ∥ 语义**改动——注释指针（§2.5）∥ 批件锁改指（2 处）为批内许可项」；`pickers.mjs`「零改」限定为 **import ∥ 装配面零改**（§2.2-A 两处 ∥ §2.7 KD-S2-1 ∥ `docs/cli/design/CLI-DEBT.md:32` 同笔）。**§1:14 边界句转呈主 agent 收正**（非本段写域）。
- 2（🟡）五档以外受影响档注记补行（§2.5）——两锁档「锁改指 ∥ 净 0」**368** ∥ **325** + 11 注释档「注释级 ∥ 净 0 / ±1」现读（74 ∥ 299 ∥ 84 ∥ 302 ∥ 243 ∥ 262 ∥ 19 ∥ 337 ∥ 173 ∥ 103 ∥ 133）。
- 3（🟡）核端机检面（§2.5 ∥ §2.8）——core `run.mjs` 收集面自检明写**在跑**（实读 `:17-45`；两新档落核根 ⇒ 收集面零影响）；**T54 改指**（`MANIFEST.md:84` ∥ `:630` → 改读 `manifest-discovery.mjs`）＋ **`SOFT_LINE_REGISTRY` 处置**（拆后移出 ∥ 两新档免登记）＝实施轮同笔义务。
- 4（🔵）AC-S2-1「新档五件」⇒「**六件**」（§2.4）。
- 5（🔵）坐标重锚——MANIFEST.md `:197→:198`（§2.1 登记面 ∥ §2.2-C ∥ §2.8 ∥ §2.9）+ `:217/:648→:218/:649`（§2.9——两处日期记录行，史值随行留档）；**并查得** `CORE-UNIFICATION.md:1120→:1121`（§2.1 ∥ §2.8——评审未列，一并重锚）。
- 6（🔵）零锁两档行为证据载体指名（§2.5）——机检子面 = 批内件 `docs/batches/2026-09-29-structure-split-2.test.mjs`（缝解析 ∥ 装配级 smoke）；流程级行为面 = **源审级证据**（逐行对拍 ∥ 实读）。
- **读回核实（D6）** = 逐处重读为真（改点 file:line = 交付报告 ①）；产品码零触 ∥ 需求档零触 ∥ 未发起评审（门 = 父侧）。

### 设计修正轮（fix）· 轮 2 · eng-designer · 2026-09-29

**承** = §3 轮次 2 发现 1 ∥ 3 ∥ 4 ∥ 5（父侧裁定接受；发现 2 = 父侧直改——不在本段射程，§1 零触）：

- 1（🟡）`docs/cli/design/CLI-DEBT.md:116`（变更记录 · structure-split-2 行）「`pickers.mjs` 零改」⇒ 按 A1 行（同档 `:32`）现口径限定：**import ∥ 装配面零改**——注释指针一行级随批；同档两处口径一致。
- 3（🔵）`isValidDocRootValue` 届盘实读 `thincoder-core/manifest.mjs:194-205`（12 行——头注 `:194-200` 含，同 `DEFAULT_MANIFEST` `:240-263` 含头注口径）⇒ 并入刀 1 迁出量 ∥ 两档预算：刀 1 = `:240-369`（130 行）+ `:194-205`（12 行）= **142 行**（两段非连续——先例 KD-SS-3）；迁出合计 **247 行**；宿 ≈**252** ∥ schema ≈**146**。落点 = 本段 `:67` ∥ `:70` ∥ `:72` ∥ `:73` ∥ `:74` ∥ §2.4 `:114` ∥ §2.8 `:187`。**同数值笔（评审列 `docs/core/design/CORE-UNIFICATION.md:1139`）**：`:1139` ∥ `:2011` ∥ `docs/core/design/MANIFEST.md:189` ∥ `:198` ∥ `:793`（后四处评审未列——同缺陷类 ∕ 同数值一并收正）。
- 4（🔵）§2.8 登记面回填清单（`:188`）补两处汇总面逐处点名：`docs/core/design/CORE-UNIFICATION.md:1113`（「距 500 硬限最近五档（496 / 495 / 495 / 491 / 481）」句——responses 495 ⇒ ≈275 后失真须重排）∥ `docs/cli/design/CLI-DEBT.md:28`（表 A 计数句「15 档」——A1 移 §4 后应为 14）。
- 5（🔵）§2.5 注记表（`:146-161`）补批内新档行：`docs/batches/2026-09-29-structure-split-2.test.mjs`（**0** 拟新增 → **≈150**——校准近例 = `docs/batches/2026-09-29-structure-split-round.test.mjs` **146**；实施轮回填实读）。
- **零触面** = §1（发现 2 父侧笔）∥ §3 评审记录（表内旧数值 = 发现当时口径）∥ 需求档 ∥ 产品码；未发起评审（门 = 父侧）。
- **读回核实（D6）** = 逐处重读为真（改点 file:line = 交付报告 ①）。

### 实施收口轮（文档面回填 · fix）· eng-designer · 2026-09-29

**承** = 父侧收口轮派遣（四舱（#147 ∥ #148 ∥ #149 ∥ #150）实施后文档面回填；定点回填，零全量勘察）。**体例** = §2 append-only：终态口径逐项记录于此（上文各分节为设计轮口径，不重写）。**台账** = #620（核 ∕ CLI 面）· #651（desktop 面）。

**一、§2.2 各分节终态（实读 2026-09-29）**

- **A（ctx 枚举 8 ⇒ 10）**：+`fmtContextK` ∥ +`defaultModelLabel`（迁出流实引用两纯 helper——S1 决策 1）；读数 = `model-picker.mjs` 499 ⇒ **316** ∥ `provider-admin.mjs` **213**。
- **B**：`responses.mjs` 495 ⇒ **273** ∥ `responses-request.mjs` **237**（迁出 `:22-245` = 224 行逐字；宿主 import 收敛 `{ buildBody, normalizeUsage }`——S2 决策 1）。
- **C**：`manifest.mjs` 493 ⇒ **249** ∥ `manifest-schema.mjs` **155** ∥ `manifest-discovery.mjs` **119**（两刀合迁 247 行——两段非连续）；「13 import 点」⇒ 实读 **21** 消费档名面（S2 缝 identity 机检收正）。
- **D**：`chat-chrome.mjs` 335 ⇒ **213** ∥ `chat-digest.mjs` **133**；迁出三段实读 **122** 行逐字（设计记 112——漏段内空行口径 ⇒ 收正）。
- **E**：`turn-driver.mjs` ⇒ **252** ∥ `turn-input.mjs` **120**（迁出 101 行）；**届盘重钉**——设计读数 310 经 #656 落笔至 347 ⇒ 切点 `:202-302` 重钉（S4）；**注入面 9 ⇒ 11**（+`capPending` ∥ +`capQueued`——`interrupt` 入口预检读写两表）；**`slotOfKey` import 保留**（现盘 `reloadSlot` 消费——设计原述「行删」为漂移前口径，不采）。

**二、登记面回填落地（file:line = 实读终态）**

- `docs/cli/design/CLI-DEBT.md`：表 A 行 A1 ⇒ **316 ∥ 213** · 移 **§4-D6**（留证据行 · 防回潮）· 表 A **15 ⇒ 14 档**（§2.1 :28 · §4-D6 :79 · 变更记录 :118）——#620 面。
- `docs/desktop/design/PROJECT.md`：§4.1 **:168**（`turn-driver` **252**）∥ **:238**（`chat-chrome` **213** + 新档 `chat-digest.mjs` **133**）∥ 越层段 **:299–:300** 两行除名 + 计数 **十一档** ∥ §4.2 本批块 **:391–:396** 转「实读落值」∥ desktop-carryover 块 **:808** 留待项收口 ∥ **:823** `turn-driver` 行终值 **310 ⇒ 347 ⇒ 252** ∥ 变更记录 **:1504–1506**——#651 面。
- `docs/core/design/CORE-UNIFICATION.md`：§2.8.1 行 1（`:1121`）∥ 行 19（`:1139`）**兑现收正**；`距硬限五档` 句（`:1114`）按实读重排（**481 / 481 / 481 / 473 / 468**）；计数句（`:1108` 在册 **49 ⇒ 47** · `:1113` 其余 **29 ⇒ 27**）∥ 变更记录 `:2022–2025`——#620 面。
- `docs/core/design/MANIFEST.md`：§2.3 行 38（`:189`）∥ 行 14 注（`:199–201`）实读回填（**493 ⇒ 249** ∥ **119** ∥ **155**）；13 import 点 ⇒ **21**；**T54 读点改指** `manifest-discovery.mjs`（`:84` ∥ `:630`）；`SOFT_LINE_REGISTRY` 义务执行态 = 本档移出（`:246`）∥ 变更记录 `:799–801`。
- `docs/core/design/API-CONTRACT.md`：`:1835` ∥ `:1841` 两行（`digestGroupNode` ∥ `digestPresent`）**实居生成区**（区界 `:12–:2646`）⇒ 按「生成区零触」本轮零笔；**父侧待办** = `node scripts/api-contract.mjs --write` 重生成（同族失效行清单另列交付报告）。

**三、验证与披露**

- **读回核实（D6）** = 四档逐处重读为真（首轮两处锚点未中 ⇒ 工具原子中止零写入——复读修正后重发落盘，记录在案）。
- **doc-check 复跑**（`node scripts/doc-check.mjs --root .`）= 本批写域四档**行宽 ∥ 锚面零新增红**：本轮新引入 8 处行宽红全部折行清零（CORE `:1108` ∥ `:1114` ∥ `:2020` · MANIFEST `:84` ∥ `:198` ∥ `:795` · PROJECT `:299` ∥ `:1502`）+ 3 处歧义 token 加核内前缀（CORE `helpers` ∥ `shared` ∥ `provider/core`）+ **本批设计轮遗留 3 处行宽红同轮折行收正**（CORE `:2011` · MANIFEST `:793` · PROJECT 设计轮条）。余红 = 他批既存（如 PROJECT `:1507`（307 字符——撤会话头+工具头色批条）· PROJECT 锚面 `:86` ∥ `:166` 族——清单见交付报告）。
- **零触** = 产品码 ∥ 需求档 ∥ §1 ∥ §3–§5；未发起评审（门 = 父侧）。

**附：坐标微调（读回复核——折行后编号 · 2026-09-29）**

- CORE-UNIFICATION：子表行 1 = `:1123` ∥ 行 19 = `:1141`（上文首记 `:1121` ∥ `:1139`——折行后 +2）。
- MANIFEST：行 38 = `:190`（首记 `:189`）· T54 机判句 = `:85` ∥ 用例行 = `:633`（首记 `:84` ∥ `:630`）· `SOFT_LINE_REGISTRY` 义务注 = `:249`（首记 `:246`）。
- PROJECT：desktop-carryover 块 = `:809`（首记 `:808`）· `turn-driver` 行终值 = `:822`（首记 `:823`）· §4.2 本批块表 = `:393–:397`（首记 `:391–:396`）。
- 读回一致（无需微调）：CLI-DEBT `:28` ∥ `:80` ∥ `:118`；CORE `:1108` ∥ `:1113` ∥ `:1114` ∥ `:2023`；PROJECT `:168` ∥ `:238` ∥ `:299` ∥ `:1504–1506`；MANIFEST `:199–201` ∥ `:799–801`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审范围 = 批档 §2 设计 + 四登记面（`docs/desktop/design/PROJECT.md` ∥ `docs/cli/design/CLI-DEBT.md` ∥ `docs/core/design/CORE-UNIFICATION.md` ∥ `docs/core/design/MANIFEST.md`）；限制 = 无项目标准档 ∥ 无文档地图（按 Project Guide 判）· 代码档不在评审范围 ⇒ 设计内 code file:line 坐标声明 = **unverified**（登记面无内争）。
计数 = **0 🔴 · 3 🟡 · 3 🔵**。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Scope / 边界一致性 | 🟡 | §2.10:176「**不动五档以外的档**」与 §2.5 自列的批内改动物相抵：注释指针面（`:142`）计划改动 **11 档**（含越层在册 `renderer/store.mjs` **302**〔PROJECT.md:311〕· `src/main/suspension-drive.mjs` **337**〔PROJECT.md:306〕）+ 批件锁改指 **2 档**（`:133-136`）；且 §2.2-A:55（同句见 CLI-DEBT:32 ∥ KD-S2-1:154）称 `pickers.mjs` **零改**，而 `:142` 计划在 `pickers.mjs:124` 加「迁 provider-admin.mjs」注；§1:14 边界句更窄（「不动其他越层档」） | 边界句收为「五档以外零**结构 ∥ 语义**改动；注释指针（§2.5:142）∥ 批件锁改指（2 处）为批内许可项」；「零改」限定为 import ∥ 装配面零改 |
| 2 | 受影响文件注记（判据 8） | 🟡 | 五档以外将被改动的档无「现读行数 + 预期增量」注记：两枚锁档 `docs/batches/2026-09-29-desktop-susp-queue.test.mjs` ∥ `docs/batches/2026-09-29-send-busy-timing.test.mjs`（确定改指——`:133-136`）+ 注释指针 11 档（`:142`）；判据要求每个被改源码 ∥ 测试档带现读读数 + 增量（或「结构未变」） | 补行：两锁档「锁改指 ∥ 净 0」· 11 档「注释级 ∥ 净 0 / ±1」+ 现读读数 |
| 3 | 完整性（核端机检面） | 🟡 | manifest 拆分使核内结构断言 **T54** 失效——T54 读 `thincoder-core/manifest.mjs` 源码（`MANIFEST.md:630`；§2.2 机判句 `MANIFEST.md:84`：`readdirSync` 全档恰 1 处 ∧ 居 `scanChildren` 体内），迁移后二者居 `manifest-discovery.mjs`；拆分随 `SOFT_LINE_REGISTRY` 读写面成对义务（`CORE-UNIFICATION.md:1085`；先例 `:1121`「本档已移出 ✓ ∥ 新档已入模块清单 ✓」· `:1137` 行 18「同批义务 = `SOFT_LINE_REGISTRY` 补登该档」）。§2.5（`:128-142`）∥ §2.8（`:163-165`）未列 T54 改指与 registry 处置；`:140` 核端句（「core `run.mjs:18` 有 manifest check」）未言明该检查是否在跑 | 明写核端在跑检查面；T54 改指 + `SOFT_LINE_REGISTRY` 处置（移出 ∥ 复核）补进复跑 ∥ 义务清单（或给据判空场并落档） |
| 4 | 验收判据（数值） | 🔵 | AC-S2-1:114「新档**五件**落盘」与同句枚举「**六个**新档」（≈200 ∥ 232 ∥ 136 ∥ 112 ∥ 122 ∥ 113 六值 ∥ 六名）自相抵；§2.8:163 作「六新档」。抽检其余数字：段区间 ∥ 算式相符（335−112+3=226 · 493−235+6=264 · `:177-269`=93 等）；两处 ≈ 预算余 1–2 行（responses「−224−1+4≈275」实 274（列项 +3）；chat-digest「112+6+2≈122」实 120） | 「五件 ⇒ 六件」；≈ 预算维持、由实施轮实读回填（已在册） |
| 5 | 坐标漂移 | 🔵 | 本设计对 `MANIFEST.md` 的坐标因**自身插行**（§2.3 补行 38）整体 +1 而失准：`:197`（批档 `:45` ∥ `:77` ∥ `:165` 三处）现为 `:198`（`:197` = 行 16 `setup.mjs` 条）；`:217/:648`（批档 `:171`）现为 `:218` / `:649`（两处皆带日期记录行——482 为史值） | 四处坐标按现盘重锚（或一次注明 +1 位移） |
| 6 | 验收载体 | 🔵 | 两零锁档（`:131`）的 §2.2 证据面列「行为判据」（`:56`）∥「行为面」（`:78`），但 §2.5 ∥ §2.8 无对应载体（批内件 = 结构不变量，`:163`；AC-S2-5:118 只盖锁 ∥ `node --check` ∥ 空清单） | 指名承载该两面的批内件（re-export 解析 ∥ 调用面 smoke 一类），或明标「源审级证据」以免覆盖声明过实 |

**VERDICT: pass**

### 轮次 2（评审子代理）

评审范围 = 批档 `docs/batches/2026-09-29-structure-split-2.md`（§2 设计 + §1 边界 + §3 前置轮）+ 三登记面（`docs/cli/design/CLI-DEBT.md` ∥ `docs/core/design/MANIFEST.md` ∥ `docs/core/design/CORE-UNIFICATION.md` §2.8.1）；`docs/desktop/design/PROJECT.md`（desktop 登记面）不在评审范围 ⇒ 批档对其声明 = **unverified**。限制 = 无项目标准档 ∥ 无文档地图（Document ownership 按 Project Guide 降级判）· 代码档不在评审范围 ⇒ 设计内 code file:line 坐标声明 = **unverified**（三登记面间无内争；两处区间/枚举对照为文档内自证）。
计数 = **0 🔴 · 2 🟡 · 3 🔵**。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc-state 一致性（登记面） | 🟡 | `thincoder/docs/cli/design/CLI-DEBT.md:116`（变更记录 · structure-split-2 行）仍作未限定的「`pickers.mjs` 零改」——与同档 A1 行 `thincoder/docs/cli/design/CLI-DEBT.md:32`（「`pickers.mjs` **import ∥ 装配面零改**（注释指针一行级随批）」）及批档 §2.2-A（`docs/batches/2026-09-29-structure-split-2.md:57`）∥ KD-S2-1（`docs/batches/2026-09-29-structure-split-2.md:177`）现口径相抵；fix 轮第 1 项的「同笔」限定覆盖 A1 行、未覆盖该记录行 | 该行按现口径限定（import ∥ 装配面零改 + 注释指针一行级随批），或补一行收正记录，使同档两处「零改」口径一致 |
| 2 | Doc hygiene / 边界 | 🟡 | 批档 §1 并列两条边界陈述且 scope 不同：`docs/batches/2026-09-29-structure-split-2.md:14`「语义零改；不动其他越层档」vs `docs/batches/2026-09-29-structure-split-2.md:17`「五档以外零**结构 ∥ 语义**改动；注释指针面 ∥ 批件锁改指（2 处）为批内许可项（两越层在册档注级触碰在此许可内）」；`:17` 以「上文 `:14` 句以本行为准」覆盖——`renderer/store.mjs`（§2.5 注记 **302**）∥ `src/main/suspension-drive.mjs`（**337**）两越层在册档的注级触碰在 `:14` 字面下仍属「不动」⇒ 失效句留活面（修订式表达 · 边界面） | 边界陈述收敛为单条现行句（`:14` 旧句按失效表达处置；沿革如需保留另置记录面），使读者不必凭优先级句分辨哪条现行 |
| 3 | 受影响档 · 数值抽检（判据 8） | 🔵 | manifest 刀 1 迁出区间枚举（`docs/batches/2026-09-29-structure-split-2.md:72`：`:240-369` = 130 行，逐符号列尽）与 `:74` 裁定「`isValidDocRootValue` 随刀 1」不自洽——该符号不在两个迁出区间（`:240-369` ∥ `:39-143`）枚举内 ⇒「迁出合计 235 行」与宿 ≈264 ∥ schema ≈136 预算未含其行数；`docs/core/design/CORE-UNIFICATION.md:1139` 同以 `:240-369` = 130 行挂预算（code 面坐标不在评审范围——unverified；区间/枚举对照 = 文档内自证） | 把该符号的行区间并入迁出量与两档预算，或将「迁出合计」口径写明「以迁出符号集合为准 ∥ 实施轮实读回填」 |
| 4 | 登记面回填完整性 | 🔵 | §2.8 登记面回填清单（`docs/batches/2026-09-29-structure-split-2.md:189`）只点名 CORE-UNIFICATION §2.8.1「行 1 与 manifest 行实读收 ∥ 计数句」，未含两处将随落盘变陈的汇总面：`docs/core/design/CORE-UNIFICATION.md:1113`「距 500 硬限最近五档（496 / 495 / 495 / 491 / 481……）」（responses 495 ⇒ ≈275 后该句失真）∥ `docs/cli/design/CLI-DEBT.md:28` 表 A 计数句「15 档」（A1 移 §4 后应为 14；先例 = 同档 `:107` 计数随迁记录） | 把这两处汇总面逐处点名（file:line）补进 §2.8 的登记面回填清单 |
| 5 | 受影响档注记（判据 8 · 新档） | 🔵 | 本批新档 `docs/batches/2026-09-29-structure-split-2.test.mjs`（`docs/batches/2026-09-29-structure-split-2.md:186` 定为结构不变量承载件）为被本批新增的测试档，却未入 §2.5「五档以外受影响档注记」表（`docs/batches/2026-09-29-structure-split-2.md:146`）——无「拟新增 0 → ≈N」规模行（全批其余被触档均已注记） | 为该批内新档补一行规模注记（0 → ≈N），沿 `docs/core/design/MANIFEST.md:187`（新档行 = 0 ∥ +~150）先例 |

**VERDICT: pass**

（核查通过面抽记：三登记面 structure-split-2 落点实读在位——`CLI-DEBT.md:32` A1 行 ∥ `CORE-UNIFICATION.md:1121` 行 1 ∥ `CORE-UNIFICATION.md:1139` 行 19 ∥ `CORE-UNIFICATION.md:1110`/`:1116` 计数与子表题行 ∥ `CORE-UNIFICATION.md:2011` 变更行 ∥ `MANIFEST.md:189` 行 38 ∥ `MANIFEST.md:198` 注 ∥ `MANIFEST.md:793` 变更行；批档内 fix 轮 1–6 落地处逐处复核（AC-S2-1「六件」`docs/batches/2026-09-29-structure-split-2.md:116`、受影响档注记表 `:146-162`、T54/registry 义务 `:187-188`、坐标重锚 `:47`/`:198`/`:212`）；抽检算式相符（335−112+3=226 · 493−235+6=264 · 495−224−1+4≈275 · 310−93−1+5≈221 · `:177-269`=93 · `:39-143`=105 · `:22-245`=224）。）

## §4 用户批准（主 agent）

**批准（代签）· 2026-09-29 22:03**——依据 = 用户 13:52 ∕ 17:02 全权（代点火 + 代批 + 代签）。

- **评审状态**：**评审通过**（§3 两轮——轮 1 六项 + 轮 2 五项全数收口复核成立；零 🔴）。
- **批准范围** = §2 设计（五档拆分方案：cli 1 ∥ core 2 ∥ desktop 2；注释指针面 11 档；批件锁改指 2 处）+ 轮 2 收口修正（迁出量口径 247 ∥ 宿 ≈252 ∥ schema ≈146 ∥ 注记补行 ∥ 回填清单点名）。
- **实施切分** = 四舱：**S1**（cli）∥ **S2**（core）∥ **S3**（desktop-chat 面）∥ **S4**（desktop-turn 面——批件锁改指随舱，写门拒 ⇒ 父侧收位）；批内件（S1–S4 后落）。
- **验收** = AC-S2-1…7 + 批内件结构不变量（行数上界 ∥ 迁出块逐字 ∥ 导出 identity ∥ 零环源扫 ∥ 缝解析）+ `node --check` + 复跑（三端 run.mjs ∥ 锁复跑 ∥ doc-check）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（S1–S4 四舱 + fix 轮（批内件 218 行五面全绿 ∥ 注释两处收正）记录在册——审计 0 偏差 ∥ 评审 pass（1 🟡 coordination · 3 🔵 · 修正轮 1）· 终态 clean · 批内件收位 = 父侧）

**实施轮（initial · eng-coder · 2026-09-29）· S1（cli 舱）**

**交付摘要**：`thincoder-cli/src/tui/model-picker.mjs` 拆分落盘（迁出原 `:309-471`（渠道管理四流 163 行）+ `:476-499`（cascadeRemoveProvider 24 行）→ 新档 `provider-admin.mjs`）。实读：

- `model-picker.mjs` **499 ⇒ 316**（迁出 187 ∥ 空行收 1 ∥ import `createProviderAdmin` +1 ∥ 装配 +2 ∥ 档头指针收正 +1 ∥ 尾再出口净 +1；调用面 `:75/77/79/81` ∥ `:254` ∥ return `:313` 行内改）；尾 `export { cascadeRemoveProvider } from "./provider-admin.mjs"`（`:316`）。
- 新档 `provider-admin.mjs` **213**：`createProviderAdmin(ctx)`（五名返回）+ `cascadeRemoveProvider` 模块级导出；import 面 = `{ PROVIDER_PRESETS as PRESETS, providerSpec }`（core/config）∥ `{ probeChannelModels }`（./model-catalog）。
- `pickers.mjs` **133 ⇒ 134**（`:125` +1 注释行——迁注；import `:2` ∥ 装配 `:128-131` 零改）。

**决策透明表**：

| # | 决策 | 由 |
|---|---|---|
| 1 | 设计缺口处置：ctx 8 名 ⇒ **10 名**（+`fmtContextK` ∥ +`defaultModelLabel`——迁出流实引用两主档纯 helper；ctx 注入同 `maskKey` 先例） | 设计 §2.2-A 枚举缺（按字面装配 ⇒ `removeProviderFlow`/`setContextFlow` 调用即 TypeError）；「宿主留 ∥ 零环 ∥ 单源」三约束下唯一可行解；两档档头自述 + 报告披露；文档面收正归父侧 |
| 2 | 宿主档头指针收正（`:10-12`：2 行 ⇒ 3 行——「四流居 provider-admin.mjs」∥「定义同在 provider-admin.mjs」） | 指针真实性纪律（原「文件尾导出」拆后失真；§2.5「实施轮届盘 grep 复核」义务）——即 316 vs 预算 ≈315 之 +1 |
| 3 | 宿主 `:120`「本文件 setKeyFlow」⇒「provider-admin.mjs setKeyFlow」 | 同 2（自称「本文件」而对象已迁出） |
| 4 | 迁出后重空行收 1（原 `:472`） | 结构清理（迁出两块后宿主留单空行）；行账：316 = 499 − 187 − 1 + 5 |
| 5 | 再出口置档尾（非 import 区） | 「文件尾导出」位次语义守恒 |
| 6 | F-4 标签两读（`ISSUE-FIX-BATCH` ∥ `IKCDMR`）随迁原文照录、本批不动 | 零语义搬（评审 🔵 可选项——报而不改） |

**机检读数（全绿）**：

- 逐字对拍（基线冻结件 `.thincoder/tmp/structure-split-2-s1-baseline.json`——搬前机器冻结）：block1 163 行 ∥ block2 24 行 **逐行零差**（新档 `:23-185` ∥ `:190-213`；恒位移 286；`confirmDelete` 门行经基线核 = 迁出前原文）。
- 缝 identity（执行级 smoke）：`model-picker.mjs:316` 与 `provider-admin.mjs:195` 的 `cascadeRemoveProvider` **同引用**；`createProviderAdmin(ctx)` 五名可解析 + esc/no-op 路径跑通；`createModelPicker(ctx)` 返回面恰五名（`setProviderKey: admin.setProviderKey` ∥ `setContextFlow: admin.setContextFlow` 同实体）；级联清理行为经宿主再出口对拍成立。
- `node --check` 三改档绿；cli `check-syntax.mjs` = 117 文件 OK；cli `test/run.mjs` = 空清单绿（零用例——2026-09-28 全清重置）。
- 零环：`provider-admin.mjs` 无 import 宿主（源扫）；全仓仅 `pickers.mjs:2` 引 model-picker ∥ 仅宿主引 provider-admin。
- 引用面零改：`index.mjs` ∥ `cmd-config.mjs` ∥ `cmd-submodel.mjs` ∥ `slash-commands.mjs` ∥ `wizard.mjs` 消费名全在（实读）。
- `not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**审计 ∕ 评审轮次（自含闭环）**：

- **内部 explore 漂移审计 ×1**（read-only）：1 DEVIATIONS（ctx 8⇒10——**已披露属实**）；SILENT-SIMPLIFICATION 0 ∥ OUT-OF-LIST 0 ∥ 逐字 ∥ 零环 ∥ 引用面全 pass；独立复核确认无第三宿主依赖。
- **advisor 代码评审 ×1**（type=code）：**VERDICT: pass**（0 🔴；🟡 2 = ①设计面 ctx 枚举收正〔父侧文档面，代码零改〕∥ ②316 > 300 顾问线〔cli 裁定线 <400 已达成，非 must-fix〕；🔵 2 = 数值回填 316∥213 ∥ F-4 双名〔可选〕）；评审旁证：陈旧快照 `.wt-head-probe/`（2026-09-16）「新增门行」误读经基线证伪。
- **修正轮 0**（≤5）；**终态 = clean**（零 🔴；🟡 皆文档面 ∥ 已裁定，非 must-fix）。

**披露 ∕ 未做项**：

1. §2.2-A ctx 枚举与装配样例收正（+2 名）——归文档面父侧写域，代码零改。
2. 三端登记面实读回填（`CLI-DEBT.md:32` A1 行 ⇒ 读数 **316 ∥ 213**、移 §4）——不在 S1 射程（父侧批级）。
3. 批内件 `docs/batches/2026-09-29-structure-split-2.test.mjs` 未落——按 §4「S1–S4 后落」。
4. 工作树另有他批既存 M 态（`queued-pickup.mjs` ∥ `suspension-drive.mjs`，17:47 笔）——非本舱；S1 写域 = 三档（model-picker ∥ provider-admin ∥ pickers）。

**S4 舱（desktop · turn 面）· eng-coder · 2026-09-29（initial 实施轮）**

**状态行**：实施完成（S4（desktop-turn）——turn-driver **347 ⇒ 252** ∥ 新档 turn-input.mjs **120**；迁出块 101 行逐字对拍零差 ∥ 缝保名（agent-host.mjs 零改）；锁改指 3 处交接父侧（写门拒）；审计 ×1 ∥ 代码评审 ×1 = pass；终态 clean）

**交付摘要**（五档拆分之 5/5 · desktop turn 面；切点设计 = 批档 §2.2-E）：

- **迁出（结构零语义）**：msg 双通道族（`send` ∥ `interrupt`，含两段头注）= 迁出前 `:202-302` **101 行**逐字迁出 ⇒ 新档 `thincoder-desktop/src/main/turn-input.mjs`（**120** 行 = 头注 11 + import 2 + 工厂壳 2 + 迁出块 101 + 空 ∥ 尾 4）。基线冻结件 `.thincoder/tmp/S4-turn-driver.baseline.mjs:202-302` ≡ `turn-input.mjs:17-117` **逐行零差**（sha256 双侧一致；位移恒 −185）。
- **宿主**：`thincoder-desktop/src/main/turn-driver.mjs` **347 ⇒ 252**（−102 迁出 ∥ +1 import ∥ +5 装配；⑤ 句收 ∥ import 收 = 行内净 0）。`createTurnDriver` 保名 ∥ 返回面 7 名（`send ∥ interrupt ∥ dispose ∥ abortSuspensions ∥ takeOver ∥ busyOf ∥ queueSnapshot`）保名 ⇒ `agent-host.mjs` 零改（`:48` import ∥ `:259` 展平实读）∥ `ipc.mjs` 调用面零改（`:207/:212` 实读）。
- **缝**：`const { send, interrupt } = createTurnInput({ post, ensure, flights, queued, chain, suspension, drive, projects, denyGates, capPending, capQueued })` 置于 `suspension` 装配之后（`turn-driver.mjs:171`；suspension 于 `:155` 赋值 ⇒ 非 null）∥ **零环**（新档仅引 `attachments.mjs` ∥ `session-slots.mjs`；宿主 → 新档单向）。
- **注释指针**：`turn-driver.mjs:11` ⑤ 句收（加「（出档 `turn-input.mjs`）」）；§2.5 五档指针面（`agent-host.mjs` 十处 ∥ `file-refs.mjs:6` ∥ `suspension-drive.mjs:139/:306` ∥ `turn-face.mjs:11/:63` ∥ `window-queue.mjs:64`）逐处实读 = **全部仍真、零改**（所指 `injectUserText` ∥ `askContinue` ∥ 中止墓碑 ∥ 「窗优先」组合线皆留宿主；`turn-face` 坐标设计记 `:59` 实为 `:63`——届盘重锚，内容仍真）。
- **届盘重钉（设计 §2.1 ∥ §2.6 预授权）**：设计读数 310 已被 desktop-carryover 批（#656）于 **21:54** 落笔至 **347**（该批在册「拆分窗口 = 本拆分实施批」）⇒ 按内容锚重钉：切点 `:177-269` ⇒ `:202-302`；注入面 9 ⇒ **11**（+`capPending` ∥ `capQueued`——#656 两表，`interrupt` 预检读写、宿主 `askContinue` ∥ `dispose` ∥ 撤回臂共享引用；沿设计「Map 引用共享」原则）；`:35` `slotOfKey` 行**保留**（现盘 `reloadSlot` `:165` 消费——设计原述「行删」为漂移前口径）；`:32` 去 `cleanupTurn` 已随迁（新档 import 面）。
- **锁改指 3 处（写门拒 ⇒ 未落盘——父侧收位）**：设计 2 处（`docs/batches/2026-09-29-desktop-susp-queue.test.mjs:121` ∥ `docs/batches/2026-09-29-send-busy-timing.test.mjs:303`）+ 届盘新增 1 处（`docs/batches/2026-09-29-desktop-carryover-c3.test.mjs:243`——锁面随 `interrupt` 预检迁出；该锁随 #656 批晚于设计读）。精确 old→new 见交付报告；三处新目标经同正则模拟验证会绿。
- **读数**：宿主 **252** ∥ 新档 **120**（设计 ≈221-222 ∥ ≈113——差额 = #656 漂移 + 重钉所致；算式 347 − 101 + 1 + 5 = 252 自洽）；`node --check` 双档 Syntax OK；基线锁跑 `node --import ./thincoder-desktop/test/rc-resolve.mjs --test <10 锁档>` = **95/95 绿**。
- **not repo-suite verified — the parent-side closeout run is the only repo-suite run.**

**决策透明表**：

| # | 决策 | 由 |
|---|---|---|
| 1 | 切点按内容锚重钉（`:202-302` ∥ 101 行） | 设计读数已漂（#656 21:54 落笔 +37）；§2.6 预授权「若笔又动 ⇒ 切点按内容锚重钉」 |
| 2 | 注入面 9 ⇒ 11（+`capPending` ∥ `capQueued`） | `interrupt` 入口预检读写两表 ⇒ 须跨档共享引用（沿 `flights` 先例）；设计枚举为漂移前口径 |
| 3 | `slotOfKey` import 保留（设计原述「行删」不采） | 现盘 `reloadSlot`（`:165`）仍消费；删即断（设计文本为漂移前口径） |
| 4 | 改指 3 处（设计 2 + 届盘新增 1） | 「锁面迁出 ⇒ 改指」同规则；跨批写门拒 ⇒ 交接块（父侧收位，沿 micros 先例） |
| 5 | 指针五档零改（唯一动 = 宿主 ⑤ 句） | 逐处实读＝仍真（所指皆留宿主）；「输入路由三径」句收 = §2.5 预判项 |

**审计 ∕ 评审轮次（自含闭环）**：

- **内部 explore 漂移审计 ×1**（read-only）：四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）**零命中**；独立复核：迁出块 101 行逐字 ∥ 缝 7 名保名 ∥ `agent-host.mjs` 零改 ∥ 五档指针仍真 ∥ 行账闭合（347 − 102 + 1 + 5 = 252）；界外观察 1 条（`parity-b8-ipc.test.mjs:83` 注释坐标——报而不改）。
- **advisor 代码评审 ×1**（type=code）：**VERDICT: pass**（0 🔴；🟡 2 = ①§2.2-E 注入面枚举 9↔12 ∥ ②第三锁改指协调项——皆父侧收口面，非 must-fix；🔵 3 = 读数回填 ∥ prepare/degrade 参数面跨档同形（可选）∥ faces 清单未含新档（可选））。
- **修正轮 0**（≤5）；**终态 = clean**（零 🔴；🟡 皆文档 ∕ 协调面，非 must-fix）。

**披露 ∕ 未做项**：

1. 锁改指 3 处未落盘（跨批写门拒）——精确 old→new 见交付报告，父侧收位；落位后三红锁即绿（同正则模拟已验）。
2. §2.2-E 注入面枚举（9 ⇒ 11）∥ 预算读数（≈221-222 ∥ ≈113 ⇒ 252 ∥ 120）∥ `PROJECT.md:397` 同源读数——归父侧收口轮回填（文档面）。
3. `docs/batches/2026-09-29-parity-b8-ipc.test.mjs:83` 注释坐标 `turn-driver.mjs:186` 已陈旧（拆分前已失准——基线实位 `:235`；拆分后应指 `turn-input.mjs:50`）——报而不改（archive 注释坐标，归父侧斟酌）。
4. 批内件 `docs/batches/2026-09-29-structure-split-2.test.mjs` 未落——按 §4「S1–S4 后落」。

**状态行**：实施完成（S3 舱全落：宿主 335 ⇒ 213 ∥ 新档 133；逐字对拍 ∥ 缝 identity ∥ `node --check` ∥ 锁复跑 ∥ 读回 ∥ 零环全绿；审计 ×1 + 评审 ×1 pass + 修正轮 ×1）

**交付摘要（S3 · desktop · chat 面 · eng-coder · 2026-09-29）**

- `thincoder-desktop/renderer/views/chat-chrome.mjs`：**335 ⇒ 213**（迁出三段逐字 = 原 `:30-88` ∥ `:162-217` ∥ `:309-315` ＝ 122 行；另删三段邻空行 3 行；增 3 行 = `:19` 注 ∥ `:20` import ∥ `:21` re-export；头注 `:5` ∥ `:7` 按拆后实况就地收，净 0 行）。
- 新档 `thincoder-desktop/renderer/views/chat-digest.mjs`：**133**（头注 8 + import 2 + 空 1 + 迁出 122；段间直连无空行——沿 structure-split-round KD「零重排最小形」）。
- 缝 = 同名再出口（KD-S2-5）：宿主 `:20` `import { digestAnchorOf, syncDigest } from "./chat-digest.mjs"` ∥ `:21` `export { digestGroupNode, digestPresent } from "./chat-digest.mjs"`；消费者 `renderer/views/chat.mjs:52` 十名 import ∥ `renderer/app.mjs:49` 两名 import **零改**（解析已验）。
- 逐字对拍：迁出 **122/122 行逐字**；例外 **2 行** = `syncDigest` ∥ `digestAnchorOf` 声明行加 `export `（宿主 import 两件之缝的直接推论；新档头注已披露）。
- 注释指针面（§2.5 · 届盘 grep 复核）：**改指 1 处** = `chat.mjs:11`（「判据单源」chat-chrome ⇒ chat-digest）；**仍真 4 档零触** = `compress-status.mjs:11/:69`（blockAnchor 留宿主）∥ `events-wake.mjs:75` ∥ `store.mjs:15`（timer 族留宿主）∥ `approval.mjs:15`（focusAutofocus 留宿主）；`chat.mjs:13/:48/:52/:59` 判仍真。
- 零环：新档仅引 `../dom.mjs` ∥ `../i18n.mjs`（dom 零 import；i18n 仅三字典档）——无回引；宿主 → 新档单向。
- `docs/**` 零触（登记面实读回填 = §2.8 批级实施轮义务，未落——报父侧）。

**逐处表（file:line）**

| # | 处 | 变更 |
|---|---|---|
| ① | `renderer/views/chat-chrome.mjs:5` | 头注构树列表剔 `digestGroupNode`（收正） |
| ② | `renderer/views/chat-chrome.mjs:7` | 族内序补「消化行组〔structure-split-2 —— digest 全族出档 `renderer/views/chat-digest.mjs`（构树 ∥ 在场判据再出口；帧刷 ∥ 锚引调）〕」 |
| ③ | `renderer/views/chat-chrome.mjs:19-21` | 增：注 + import（`digestAnchorOf` ∥ `syncDigest`）+ re-export（`digestGroupNode` ∥ `digestPresent`） |
| ④ | `renderer/views/chat-chrome.mjs`（原 `:30-89` ∥ `:162-218` ∥ `:309-316`） | 三段 + 各段邻空行删除（125 行） |
| ⑤ | `renderer/views/chat-digest.mjs:1-133` | 新档（头注 8 ∥ import 2 ∥ 空 1 ∥ 迁出 122） |
| ⑥ | `renderer/views/chat.mjs:11` | 改指：`renderer/views/chat-chrome.mjs` ⇒ `renderer/views/chat-digest.mjs`（1 行内改） |

**读数（行数账 ∥ 对拍）—— 届盘实读 2026-09-29 · 内容行数口径〔文末换行不计〕**

| 档 | 拆前 | 拆后 | 账 |
|---|---|---|---|
| `renderer/views/chat-chrome.mjs` | 335 | **213** | 335 − 125（122 迁出 + 3 邻空）+ 3（注/import/re-export）= 213 |
| `renderer/views/chat-digest.mjs` | — | **133** | 8 + 2 + 1 + 122 |
| `renderer/views/chat.mjs` | 299 | **299** | 1 行注释改指（净 0） |
| 四指针档（compress-status **74** ∥ events-wake **84** ∥ store **302** ∥ approval **243**） | 现读 | 零改 | 判「仍真」未动（净 0） |

- 对拍口径：搬前冻结基线 `.thincoder/tmp/s3-chat-chrome-baseline.json`（全档文本 + 三段 sha16 = `fe480fdf…` ∥ `f80a8843…` ∥ `4688a91b…`）；拆后机检两式均 equality 为真：① 新档 = 头注 + import + 空 + 段1 + 段2′ + 段3′（′ = 各含 1 处 `export ` 前缀）；② 宿主 = 基线 − 三段 − 邻空 + 3 新增 + 2 头注行改。
- 机检：`node --check` 三档绿 ∥ 缝解析 ∥ 导出 identity（`host.digestGroupNode === dig.digestGroupNode` ∥ `digestPresent` 同）∥ 十名/两名 import 面解析 ∥ 零环源扫——全 PASS（舱内件 `.thincoder/tmp/s3-seam-check.mjs`）。
- 锁复跑：`docs/batches/2026-09-29-desktop-residuals-round3.test.mjs` **17/17 绿**（⑫⑬ 经 `syncChrome` 驾 digest start→cap→end ∥ 驻留 ∥ 自愈 ∥ 换代——执行面即新档）；`docs/batches/2026-09-28-tech-debt-closeout-r6.test.mjs` **7/8——绿集改前 ∥ 改后一致**（#425 chat 腿两跑同红：`TypeError: chatModel is not a function`——chatModel 出档 `chat-model.mjs` 未再出口之既存漂移，与本舱无因果）；desktop `node test/run.mjs` = 空清单绿；本舱**零锁需改指**（§2.5 改指 2 处属 S4/turn-driver）。

**决策透明表**

| # | 决策 | 依据 |
|---|---|---|
| 1 | 迁出块间不置空行（新档三段直连） | 沿 structure-split-round KD「迁出块间不置空行 ∥ 零重排最小形」；保「逐字对拍」为整段等值等式（advisor 🔵5 建议补空行 = 未采，由 = 先例裁定 + 对拍口径） |
| 2 | `syncDigest` ∥ `digestAnchorOf` 两声明行加 `export ` | 缝必需（设计「宿主 import `{ digestAnchorOf, syncDigest }`」；不 export 则缝不可立）；新档头注 + 本表披露 |
| 3 | 宿主删三段邻空行各 1（125 = 122 + 3） | 免双空行残留；junction 各存单空行（白空间级零语义） |
| 4 | 头注 `:5` ∥ `:7` 就地收正（净 0） | 指针真实性纪律（沿 structure-split-round 决策 3 先例） |
| 5 | `chat.mjs:11` 改指 chat-digest（非留 chat-chrome） | 「判据单源」= 逻辑所在处（再出口不改归属）；§2.5「判改指 ∥ 仍真两分」之改指支 |
| 6 | 四指针档零触 | 所指构件确留宿主 ⇒ 仍真（§2.5 同判） |
| 7 | 修正轮（评审后 · 注释级）：宿主 `:7`/`:19`「本批」⇒「structure-split-2」 | advisor 🔵6（同档「本批」两义：`:3` 旧批 vs 新注）——采纳；净 0 行 |

**审计与代码评审轮次与终态**

- **内部 explore 漂移审计 ×1**（read-only）：**DEVIATIONS 1 条 = 记录面**（§5 未落——本段即落，非代码）；代码面四类全清（PARTIAL ①–⑤ 逐条独立复核通过 ∥ SILENT-SIMPLIFICATION 0 ∥ DOC-DRIFT 0 ∥ OUT-OF-LIST 0）；审计另确认：122 行三段界 ∥ 恰 2 行 `export` 前缀 ∥ 缝 identity 静态成立 ∥ r6 红 = 既存漂移、非本舱因果。
- **内部 advisor 代码评审 ×1**（type=code · 同步）：**VERDICT: pass**——🔴 0 ∥ 🟡 1（coordination item · 非 must-fix：S3 冻结基线在 tmp——批内件「迁出块逐字」不变量落笔前需父侧收位 `docs/batches/`，沿 structure-split-round `.baseline.json` 先例）∥ 🔵 6（①迁出量 112/122 数值漂移——归文档面；②`chat.mjs:60` 计数与枚举相抵；③`chat.mjs:9`「本档自持」句；④段接缝空行；⑤宿主「本批」两义；⑥r6 #425 缝常驻机检缺）。
- **修正轮 1**（评审后 · 仅注释级）：采纳 🔵⑤（`:7`/`:19`「本批」⇒「structure-split-2」）；🔵①②③⑥ = 不采纳处置（②=文档面 ∥ ③=本舱射程外行/另批 F4 ∥ ⑥=批内件补强建议，随 §2.8 批内件落）；🔵④ = 未采（决策表 #1）。复跑：residual3 **17/17** ∥ 缝检查全 PASS ∥ 重建等式真（213）。
- **终端态 = clean**（0 must-fix 未决；唯一 🟡 = 父侧收位项）。

**实施轮 · eng-coder · 2026-09-29（S2 = core 两档双拆）**

**交付摘要**：§2.2-B ∥ §2.2-C 全量落盘——`responses.mjs` **495 ⇒ 273** + 新档 `provider/responses-request.mjs` **237**（迁出 `:22-245` = 224 行逐字）；`manifest.mjs` **493 ⇒ 249** + `manifest-schema.mjs` **155**（迁出 `:194-205` = 12 行 + `:240-369` = 130 行，两段非连续）+ `manifest-discovery.mjs` **119**（迁出 `:39-143` = 105 行）；缝 = 同名再出口（responses 三名 ∥ manifest discovery 七名 + schema 四名）；两新档头注自持；语义零改 ∥ 消费者 import 面零改。

**① 逐处表（file:line）**

| 档 | 改动处 | 内容 |
|---|---|---|
| `thincoder-core/provider/responses.mjs` | `:14-17` | import 面收（删 `specForModel ∥ isBailianHost` 行） |
| 〃 | `:18` | 增 `import { buildBody, normalizeUsage } from "./responses-request.mjs"`（normalizeUsage = 设计文本漏列件，宿主 `:43` 消费——同型 = §2.2-C `fillDefaults`；见决策表 1） |
| 〃 | `:19-21` | 缝注释 2 行 + `export { buildBody, isStoreRequiredHost, builtinToolsFor } from "./responses-request.mjs"` |
| 〃 | 原 `:22-246` 删 | 移出块 + 尾空行（迁出 = 原 `:22-245`）；余段 `:23` 起 = 原 `:20` 的 FETCH_TIMEOUT 注，宿主段零改（空行接缝去重 1 处） |
| `thincoder-core/manifest.mjs` | `:36-39` | import 面（fs 收 `readFileSync, writeFileSync` ∥ path 收 `join, resolve`；增 schema 四名 + discovery 四名） |
| 〃 | `:40-43` | 缝注释 2 行 + re-export 两行（discovery 七名 ∥ schema 四名） |
| 〃 | 原 `:39-144` ∥ `:194-206` ∥ `:240-370` 删 | 两刀迁出（含空行接缝去重 3 处）；宿主段零改 |
| `thincoder-core/provider/responses-request.mjs`（新） | `:1-11` 头注 ∥ `:12` import ∥ `:14-237` 迁出块 | 逐字（唯一差 = `:143` `export ` 前缀——normalizeUsage；宿主消费所需） |
| `thincoder-core/manifest-schema.mjs`（新） | `:1-11` 头注 ∥ `:13-24` + `:26-155` 迁出两块 | 逐字（唯一差 = `:136` `export ` 前缀——fillDefaults；宿主消费所需）；**零 import** |
| `thincoder-core/manifest-discovery.mjs`（新） | `:1-11` 头注 ∥ `:12-13` import ∥ `:15-119` 迁出块 | 逐字零差 |

**② 读数（行数账 ∥ 对拍）**

行数账（内容行数口径——文末换行不计；before = 冻结基线 `.thincoder/tmp/ss2/baseline-*.mjs`）：

| 档 | before | after | 设计预算 |
|---|---|---|---|
| `provider/responses.mjs` | 495 | **273** | ≈275 |
| `manifest.mjs` | 493 | **249** | ≈252 |
| `provider/responses-request.mjs` | — | **237** | ≈232 |
| `manifest-schema.mjs` | — | **155** | ≈146（头注实写 11 行 > 预算 4） |
| `manifest-discovery.mjs` | — | **119** | ≈112（头注实写 11 行 > 预算 6） |

对拍（`node .thincoder/tmp/ss2/rangediff.mjs`）：四迁出段 **471/471 行全等**（224 ∥ 105 ∥ 12 ∥ 130），差集恰 2 处 `export ` 前缀；宿主残留探针 281 行零命；6 条缝行在位。
行为对拍（`node .thincoder/tmp/ss2/ss2-check.mjs capture → verify`）：**35/35 键逐字节一致**（buildBody 四态 ∥ parseStream 五径 ∥ 谓词三件 ∥ validate 五形 ∥ 发现/归属/解析 12 cwd ∥ projectView ∥ read/require ∥ 写门两态 ∥ 决策树六出口 ∥ 覆盖位）；导出面 identity（responses **6=6** ∥ manifest **20=20**；新档 4/5/7 名精确集）；缝 identity 14 项（宿主解析 === 直引新档）；零环源扫（request 仅 `../config.mjs` ∥ schema 零 import ∥ discovery 仅 node:fs/node:path；两新档零互引）；消费者 **21** 档名面 ⊆ 宿主导出面。
执行面：`node --check` 五档全绿；core `node test/run.mjs` = 空清单绿；cli `test/smoke-responses-chain.mjs` = skip exit 0（门控）；三端 `node_modules/@thincoder/core` 裸包解析实证（responses 6 名 ∥ manifest 20 名 ∥ seam identity 成立）；doc-check 后置运行（`.thincoder/tmp/ss2/doc-check.log`）对本舱五档零 ✗ 行（唯一涉 manifest 字样行 = `MANIFEST.md:152` 符号宽报告面，与本舱无关；既有 vsc/desktop 红非本舱致因）。

**决策透明表**

| # | 决策 | 由 | 披露 |
|---|---|---|---|
| 1 | 宿主 import 收敛为 `{ buildBody, normalizeUsage }`（§2.2-B 文本只写 `{ buildBody }`） | 宿主 `parseStream`（`:43` seal）消费迁出块内私有件 `normalizeUsage`——不 import 即 ReferenceError；同型 = §2.2-C 设计自己把 `fillDefaults` 列入宿主 import。**未改**迁出区间（224 行）∥ 导出面（re-export 三名）∥ 语义 | 审计复核为「必需 ∥ 未夹带」；行数账不受影响 |
| 2 | manifest 两新档消费名收（fs 去 `existsSync/readdirSync` ∥ path 去 `dirname`） | 随迁出族私有化的必然（宿主零使用） | 对拍 ∥ 行为对拍覆盖 |
| 3 | 空行接缝去重（responses 1 处 ∥ manifest 3 处） | 块移除后双空行并一（纯空白） | 报告面披露；对拍/行为零影响 |

**审计与代码评审轮次与终态**

- **内部 explore 漂移审计 ×1（只读独立对拍）**：**DEVIATIONS 0 · SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0**——迁出 471 行逐行读比全等（差集 2 处 export 前缀）· 宿主保留段 100% 对读（仅空行接缝）· 缝/identity/零环/消费者复核 · 设计两处漏列判为「最小收敛 ∥ 非偏差」。（其无执行面——执行读数由本舱 runner 采信，见上。）
- **内部 advisor 代码评审 ×1**：**VERDICT: pass**（0 🔴 · 0 must-fix · 3 🔵）——🔵① 机检件消费者清单漏 3 个 scripts 档（**已修**，见 fix round）；🔵② 新档行数与设计 ≈ 预算漂移（归 §2.8 回填）；🔵③ 宿主 `responses.mjs:223` 注释裸行号「buildBody 217-224」出档后不可读（报而不改——归 §2.5/父侧指针面）。评审自携机检脚注：其**过程**引用 4 条 citation 机械校验不中（0/4——均为推理段引文，终判不依赖）。
- **fix round**：1 轮（仅证据件——🔵① 采纳：`ss2-check.mjs:205` 补 `scripts/doc-check{,-width,-anchors}.mjs` 三档；复跑 verify 全绿、consumers 18 ⇒ **21**）；产品码 fix 0（审计 0 偏差 ∥ 评审 0 must-fix）。
- **终态 = clean**。

**上报父侧（不在本舱 brief 射程 · 已披露）**

- §2.8 批级义务待收口：T54 改指（`MANIFEST.md:84`/`:630`）∥ `SOFT_LINE_REGISTRY` 处置（`CORE-UNIFICATION.md` §2.8.1）∥ 三端登记面实读回填（`CORE-UNIFICATION.md:1113`/`:2011` ∥ `MANIFEST.md:189`/`:198`/`:793` ∥ `CLI-DEBT.md:28`/`:32`——含「13 import 点」计数收正为实读 21 点口径）∥ 批内件 `docs/batches/2026-09-29-structure-split-2.test.mjs`（§4 排程 S1–S4 后落）。
- code 指针面（本舱搬迁致因，报而不改）：`thincoder-core/tools/git-run.mjs:36` 引「先例 `manifest.mjs:40-41`」（测试注入缝现居 `manifest-discovery.mjs:15-20`）；`thincoder-desktop/src/main/project-info.mjs:8`/`:9` 引 `manifest.mjs:334`/`:342`（拆分前即漂移、非本舱致因）。
- 文档坐标（.md，§2.5 报而不改）：`API-CONTRACT.md:991-1010`/`:1250-1253` ∥ `DOC-DISCIPLINE.md:578/:580` ∥ `MANIFEST.md:343/:445/:476` ∥ `TOOLS.md:520` ∥ `CONTEXT-COMPACTION.md:257` ∥ `MODEL-SPECS.md:1077` ∥ `PROXY.md:55` ∥ `IPC.md:124/:261/:274` ∥ `SHELL.md:133`——迁出 11 名坐标须重锚（机器不闸：同名再出口保「名在宿主文件内」，doc-check 两族零新红实测一致）。
- 证据件（父侧批内件可复用）：`.thincoder/tmp/ss2/{rangediff.mjs ∥ ss2-check.mjs ∥ golden.json ∥ baseline-{responses,manifest}.mjs ∥ doc-check.log}`。

**fix 轮（批内件 + 注释收正）· eng-coder · 2026-09-29**

**交付摘要**：① 批内件落盘——`docs/batches/2026-09-29-structure-split-2.test.mjs`（**218 行**；暂存 `.thincoder/tmp/` 同名件，收位 = 父侧）；五面结构不变量全绿：A 行数上界（11 档实数：316 ∥ 213 ∥ 273 ∥ 237 ∥ 249 ∥ 155 ∥ 119 ∥ 213 ∥ 133 ∥ 252 ∥ 120）· B 迁出块逐字（8 段 sha256 冻结内嵌——零 tmp 依赖）· C 导出 identity（11 档名集精确 ∥ 5 缝 17 名同引用）· D 零环源扫（6 新档 × 5 宿主零引 ∥ schema 零 import ∥ 零互引 ∥ 单向 6 边）· E 缝解析（pickers ∥ agent-host 零改面 + 装配级 smoke：admin 五名 ∥ picker 五名 ∥ manifest 入口 9 名 ∥ input 双名）。② 注释两处收正落盘（语义零改，净 0 行）。

**① 逐处表（file:line）**

| 档 | 处 | 变更 |
|---|---|---|
| （新）批内件 | `.thincoder/tmp/2026-09-29-structure-split-2.test.mjs`（收位 = `docs/batches/2026-09-29-structure-split-2.test.mjs`） | 批内件落盘：五面结构不变量（A–E 五 test）；复跑 = 仓根 `node --test docs/batches/2026-09-29-structure-split-2.test.mjs`（件内自注册 `/rc/` 钩子；亦兼容 `--import ./thincoder-desktop/test/rc-resolve.mjs`） |
| `thincoder-core/tools/git-run.mjs` | `:36` | 先例指针收正：`manifest.mjs:40-41` ⇒ `manifest-discovery.mjs:15-20`（现居测试态缝：MANIFEST_REL + 注入三件） |
| `thincoder-core/provider/responses.mjs` | `:223` | 裸行号收正：`buildBody 217-224` ⇒ `buildBody 的增量分支（responses-request.mjs:220-227）`（出档后跨档可读） |

**② 读数**：批内件 5/5 绿（三法：直跑 ∥ `--import rc-resolve` 前置 ∥ 异地 cwd——全绿）；`node --check` 三档（git-run ∥ responses ∥ 批内件）Syntax OK；注释两处读回为真（D6）；11 档读数逐档实读 = 冻结值（见 A 面读数行）；8 段段长/落点 = provider-admin `:23-185`(163) ∥ `:190-213`(24) ∥ responses-request `:14-237`(224) ∥ manifest-schema `:13-24`(12) ∥ `:26-155`(130) ∥ manifest-discovery `:15-119`(105) ∥ chat-digest `:12-133`(122) ∥ turn-input `:17-117`(101)。

**决策透明表**

| # | 决策 | 由 |
|---|---|---|
| 1 | 批内件暂存 `.thincoder/tmp/` 同名件（未直写 docs/batches） | 写门先例（跨批次档写门）+ 本轮 brief 明示「暂存 → 父侧收位」 |
| 2 | 收严 D 面源扫（评审 🔵 采纳，修正轮 1） | 原 line-based 正则只认单行 static import ⇒ 多行 ∥ 动态形态可致假绿；新增动态 import 扫 + `quotedMjs` 收严扫（引号 .mjs 串通吃）；复跑仍 5/5 |
| 3 | 冻结常量口径 = 当前新档迁出段 sha256（不依赖 tmp 基线件） | 批内件须自足（本轮 brief：逐字断言以冻结常量内嵌）；搬前原文对拍证据在 S1–S4 基线件（在册） |
| 4 | `git-run.mjs:36` 同句 `session-gc.mjs:136` 陈旧（实为 `:186`）——报而不改 | 本轮 brief 仅两处、且非本批拆分致因（沿革漂移）；评审 🔵 同判 |
| 5 | E 面「零改面」= import ∥ 装配面（源文本锁定该口径） | 承 §2.2-A 修正轮限定口径（评审/审计同判「非偏差」） |

**审计与代码评审轮次与终态**

- **内部 explore 漂移审计 ×1**（read-only）：四类偏差**零命中**（ACCEPTANCE-PARTIAL 0 ∥ SILENT-SIMPLIFICATION 0 ∥ DOC-DRIFT 0 ∥ OUT-OF-LIST 0）；独立复核确认 11 档行数 ∥ 8 段段界/段长 ∥ 缝/零环/名集全真；披露两条（运行时复跑不可复现〔其无执行面〕∥ `turn-input.mjs` 外部并发写申报——本舱复跑仍 5/5 绿，冻结面未变）。
- **内部 advisor 代码评审 ×1**（type=code · 同步）：**VERDICT: pass**（0 🔴；🟡 1 = coordination item（收位/回填/并发复跑——父侧面，非缺陷）∥ 🔵 3 = ①D 面源扫收严〔**已采纳**——修正轮 1〕②`session-gc.mjs:136` 沿革陈旧〔报而不改〕③`responses.mjs:73` 裸行号（非本批致因——报而不改））。
- **修正轮 1**（评审后 · 仅批内件 D 面收严）：复跑三法 5/5 绿 ∥ `node --check` 绿 ∥ 读回（D6）为真；产品码 fix 0（注释两处已为最终形）。
- **终端态 = clean**。

**披露 ∕ 未做项**

1. 批内件收位（`.thincoder/tmp/` ⇒ `docs/batches/`）未落——写门先例，父侧收位；收位后建议复跑一次（并发写台账见上）。
2. 评审 🟡 收口面（批档 §2.5 `:161` 预算 ≈150 ⇒ 实读 **218**；§6 收口；3 锁改指落盘复核）——父侧。
3. `session-gc.mjs:136`（git-run 同句）∥ `responses.mjs:73`（agent 层裸行号）两处沿革指针——报而不改（非本批致因；评审 🔵②/③）。
4. §2.2-A ctx 枚举（10 名）∥ §2.2-E 注入面（11 名）∥ §2.2-B/C 数值等 S1/S2/S4 在册文档面回填——仍归父侧（本舱未触 docs）。
- `not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**补记（届盘复核 · eng-coder · 截稿后）**：① §2 并行新增「实施收口轮（文档面回填 · fix）· eng-designer」（`:226-257`——「零触 §3–§5」自述经复读属实）⇒ 本段披露 4（§2.2-A/E 枚举 ∥ B/C/D 数值 ∥ 三端登记面 ∥ T54 ∥ registry）已由该轮收口；披露 2 的 §2.5 `:161` 行（≈150 ⇒ 实读 218）复读仍待收口。② 内部审计独立复核：S4 交接 3 锁改指已落盘且指向一致（`desktop-susp-queue.test.mjs:121` ∥ `send-busy-timing.test.mjs:303` ∥ `desktop-carryover-c3.test.mjs:243` → `turn-input.mjs`）。③ 本舱交付面无变——批内件 5/5 绿 ∥ `node --check` 三档绿（终态复跑）。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）· 2026-09-29**

- **交付核验**：四舱（#147 ∥ #148 ∥ #149 ∥ #150——五档拆分 + 六新档）+ S5 批内件（#153）逐处抽核在盘；批内件亲跑 **5/5**（终位 `docs/batches/2026-09-29-structure-split-2.test.mjs` **218** 行——五面：行数上界 ∥ 迁出块 sha256 逐字 ∥ 导出 identity ∥ 零环源扫 ∥ 缝解析；§2.5 `:161` 计数已回填）。
- **跨批锁改指（父侧执行）**：3 处（susp-queue ∥ send-busy-timing ∥ carryover-c3）——亲跑 **29/29** 全绿（原 3 红转绿）。
- **收口轮（#154）**：CLI-DEBT（A1 ⇒ 316 ∥ 213 · 表 A 14 档 · §4-D6）∥ PROJECT.md（§4.1 终值 ∥ 越层除名两行 ∥ 计数 11）∥ CORE-UNIFICATION（49⇒47 ∥ 五档句 ∥ 行 1/19 兑现）∥ MANIFEST（行 38 ∥ T54 ∥ registry 义务）——doc-check 写域零新增红。
- **API-CONTRACT 重生成**：**2644** 条 ∥ **597** 档 ∥ `--check` 零漂移。
- **台账**：#620 ∥ #651 ∥ #684 → 核销；#672 合并两注释指针（`git-run.mjs:36` 同句 session-gc 项 ∥ `responses.mjs:73`）。
- **状态**：本批收口。
