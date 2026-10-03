# 2026-10-03 · 无效渠道态逻辑归一
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 13:07 原则裁定「三端界面可以不一样，但是逻辑应该是一样的」→ 父侧列 U1/U2/U3 三档 + 倾向 U3 → 13:10 用户「按你倾向走」= 取 U3（台账 #841）。
> 台账 = #841（core · 归批）。前情 = 无（独立批——与 #840 同族但独立：本批 = 三端口径归一 ∥ #840 = 桌面单端修复）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-03 13:1x）**

**来源**：用户 13:07 原则裁定「**三端界面可以不一样，但是逻辑应该是一样的**」（= 项目既有架构原则「机制同源 ∥ 接入面各自独立」的落判）→ 父侧列 U1 ∥ U2 ∥ U3 三档（倾向 U3，理由 = 房风「零静默」+ 不打断）→ 13:10 用户「**按你倾向走**」= **取 U3**。台账 #841。

**现状（三套逻辑 · 实读）**：
- **核**（判据源）= 严格：运行时 provider 由 `defaultModel` 解析（`thincoder-core/model-ref.mjs`；无效 ⇒ `{}`）+ `providerInvalidReason`（`config.mjs:328-335`，文案本身 = 「去补它」的指引）。
- **CLI** = 严格 + 引导：切题面弹模型选择器 + 准确提示行（`cli/src/tui/index.mjs:56-68`）。
- **桌面** = 严格 + 错报（**#840 在修**：真因透传 + 保存补写）。
- **VSC** = **宽松（接入面自建回退链、绕过核判据）**：槽渠道（有 key）→ 激活渠道 → 首个持 key 渠道（`vscode/src/extension/panel-turn-stages.mjs:57-78`）+ 渠道默认模型回退（`presets.mjs:107-117`）；全空才报 `error.provider`（词 = 桌面现词基准，`locales/zh.json:53`）。

**本批（U3）射程**：① **核级统一回退解析**（回退序 = 与 VSC 现链同形：会话槽 → 激活渠道 → 首个持 key 渠道 + 渠道默认模型；「无有效 defaultModel」不再等同「无效 provider」）；② **明示必达**（各端界面自定但必须可见：CLI 提示行 ∥ VSC banner ∥ 桌面提示行/动作按钮——用户 13:09 口径「**按钮倾向**」= 引导面给可点按动作）；③ 三端消费同一判据（VSC 自建链收正为核级；CLI picker 保留但判据来源 = 核）。
**与 #840 的边界（勿重复）**：#840 = 桌面报错真因 + 桌面保存时补写；本批**不重做这两件**（保存补写的**核面归位**若设计认定必要，列上抛项由父侧裁归属）。

**流程**：完整链（设计 → 用户点火评审 → 批准 → 实现）；设计轮**排队**（等 #840 设计落定，避免两稿互踩同一批档）。

**§1 父侧裁断（设计轮 #2 上抛批复 · 2026-10-03 13:2x）**——评审射程按此口径：

| 项 | 裁 | 理由 |
|---|---|---|
| **U-1**（实施序依赖 #840 落地） | **确认** | #841 实施轮排在 #840 交付之后（复用其键/钮/KD-8 槽复验）；派单时以 dependsOn 咬合 |
| **U-3**（桌面 invalid 态静置期零明示） | **维持最小**（评审可推翻） | 「明示必达」射程 = fallback 态（运行中必须披露）；invalid 态 = 发送时引导（CLI 的启动 picker 属其界面自定，非逻辑面）——UI 可异 |
| **U-4**（双字段收并） | **交评审判** | 属设计内部取舍，评审面裁 |
| **U-5**（需求条目） | **收口时主 agent 落** | 需求档笔权 = 本席；本批判据「同态同解 + 明示必达」拟入需求一句（D7 同步时落） |
| **U-6**（`API-CONTRACT.md` 生成区重跑） | **实施轮职责** | 随实施派单声明 |

**另**：本批与 #840 的先后 = **#840 先交付、#841 后实施**（U-1）；两批的评审独立点火（#840 评审 `a317df8d` 在飞）。

**§1 父侧更正（2026-10-03 13:43）**：本档 §1 所引「用户 13:09 口径『按钮倾向』」**系父侧误读、作废**——原话 = 「**按你倾向走**」（= 采纳父侧倾向，非界面钮）。波及面：`COMPOSER.md:119-126`（本批明示行批注）之钮件（`composer.send.chooseModel` ∥ handler `panelOf()?.openModelMenu`——该句柄实不可达（核件返回面 `panel.mjs:482-489`；`#5` 实读）——与 #840 同病）⇒ 明示行终形 = **词面-only**（`composer.send.noDefaultModel`）。修正轮 **`#8`** 已派收正；本批评审口径随之（设计面零钮件）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 #8：词面-only 终形收正（用户 13:43 · 钮件作废）· 设计档五档已落笔 · 产品码零触）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-03 · initial 轮）**

**本批条目（覆盖 · 台账 #841 · 用户 13:07 原则「三端界面可以不一样，但是逻辑应该是一样的」+ 13:10 取 U3 档）**

- **R1 · 核级统一解析（单源）**：核 `thincoder-core/model-ref.mjs` 增统一回退解析函数族（导出）；`loadConfig` 运行时 `provider` 取值切换至该函数——CLI ∥ 桌面经装配自动同源；VSC 回合面直调（接入面自建链收正）。
- **R2 · 两类状态分界**：`ok` ∥ `fallback`（无有效 defaultModel——**可运行 + 明示**）∥ `invalid`（无 provider/key——**真无效 + 引导配置**）；`loadConfig` 落 `providerState`（三值）+ `providerStateReason`（state≠ok 非空）；`providerInvalidReason` 语义不变。
- **R3 · 三端明示面**（界面各自自定 ∥ 判据同源）：CLI 启动提示行（+ headless stderr 一行）∥ VSC 横幅三态 + 动作钮 ∥ 桌面 composer 态明示行（**复用 #840 键与钮**——零新键）。
- **R4 · VSC 自建链收正**：`panel-turn-stages.mjs` 链改核函数 ∥ `presets.mjs` `resolveDefaultModel` 改核转口；**可用性不得降**（渠道+key 已配 ⇒ 三端仍直接可发——事实标准不回退）。
- **不覆盖（边界）**：改用户既有非空 `defaultModel` 的语义；重做 #840 两件（桌面报错真因透传 ∥ 桌面保存补写）；静默兜底（U3 必带明示）；渠条目结构要件（`baseURL` 等）并入回退序；`env` 作密钥源；新第三方依赖；发布链。
- **需求档合规检查**：核心需求 `PROJECT.md` C1（配置共享 = `providers[]` + 顶层 `defaultModel`）与桌面需求卷（D 表）本批**零抵触**（两档无 defaultModel ∥ provider-无效态相关条目）；需求档本批零改（笔 = 主 agent；如需条目见 U-5）。

**设计档落点**（机制单源 = 本段；长期同源 = `docs/core/design/PROVIDER.md` §6.22）：`docs/core/design/PROVIDER.md` §6.22（新——统一判据全文）· `docs/core/design/SESSION.md` §6.8（收正——D-S1/D-S2/D-S3 处置）· `docs/vsc/design/WEBVIEW.md` §4.8（新——横幅面）· `docs/desktop/design/COMPOSER.md` §2（本批注——明示行）· `docs/desktop/design/IPC.md` §2（「provider 态投影注」）。五档本轮已落笔（产品码零触）。

**统一解析判据定义（含回退序逐步 + 两类状态分界）**

**核函数（单源）**：`resolveProviderPlan({ providers, defaultModel, slot })`（纯函数 · 零 I/O）→ `{ state, source, channel, model, provider, reason }`；「持 key」= `providers[].apiKey` trim 非空（`config.mjs:11`——env 不是密钥源）。

**回退序（渠道面 · 逐步）**：① **会话槽渠道**：`slot.provider` 在场 ∧ 在册 ∧ 持 key ⇒ 入选（`source="slot"`）；② **defaultModel 渠道**：`parseModelRef` 通过 ∧ 该渠道持 key ⇒ 入选（`source="defaultModel"`）；③ **首个持 key 渠道**：按 `providers` 表序首个持 key 者 ⇒ 入选（`source="registry"`）；④ 无 ⇒ `state="invalid"`（渠表空 ∥ 全表无 key）。槽无 key ⇒ 跳过（不把不可运行渠道钉进运行态——VSC 同判）。

**模型面（逐步）**：① 入选来源 = 槽 ∧ 槽带模型 ⇒ 槽模型；② `defaultModel` 解析通过 ∧ 其渠道 == 入选渠道 ⇒ defaultModel 模型段；③ 入选渠道单值 `providers[].model`；④ 无 ⇒ `null`（合法——消费者沿既有「model 缺失」处置）。

**两类状态分界（明示口径 · 本判据核心）**：`ok` = defaultModel 独立成立（解析通过 ∧ 该渠道持 key）⇒ 零明示；`fallback` = 「**无有效 defaultModel**」类（缺 ∥ 不可解析 ∥ 渠道不在册 ∥ 渠道无 key）∧ 全局有可运行渠道 ⇒ 可运行 + 明示（语义源 = `plan.reason`）；`invalid` = 「**无 provider/key**」类（渠表空 ∥ 全表无 key）⇒ 真无效 + 引导配置。

**三端明示面对照表**（词形 + 动作按钮落点）

| 端 | 明示面 | `fallback` 词形 | `invalid` 词形 | 动作（按钮倾向） |
|---|---|---|---|---|
| CLI | 启动提示行（TUI）∥ stderr 一行（headless） | 新行「尚未设置默认模型：本次使用 `<渠道>:<模型>`——/config → 默认模型 设置一次；/model 仅改本会话」 | D-S2 picker + 提示行（措辞收正 = 渠道 ∥ 密钥——`/config`） | picker（invalid）· `/model` ∥ `/config` 入口（fallback；**不弹 picker = 不打断**） |
| VSC | 横幅 `#provider-banner`（`webview/ui.js` `showBanner`） | 新键 `banner.defaultModelFallback`（zh「⚠ 默认模型未设置或无效 — 正在使用渠道默认模型」∥ en 成对）+ 动作钮「选择默认模型」→ `openSettings()` 设置面「模型与档位」段（段锚以现盘 `SCOPES` 为准） | 现键 `banner.notConfigured` 逐字不变（无钮） | 钮 → 设置面（真修口——不开会话级模型菜单：死端避让同 #840 KD-3） |
| 桌面 | composer 提示带「态明示行」（`renderer/composer-sync.mjs` `paintNotices`） | 词 `composer.send.noDefaultModel` + 钮 `composer.send.chooseModel`（**逐字复用 #840 键**——态陈述行，非失败行） | 本行零行——归发送失败行（#840 面：`providerKind` 类 → 词 ∥ 钮） | 钮 → `panelOf()?.openModelMenu`（同模型钮同门；候选 = 全渠扇出 ⇒ 本态可用） |

**受影响文件表（file:line 级 · 现行 ⇒ 预期——行数口径 = 内容行数，实读 as-of 2026-10-03 设计轮；「预期」= 设计预算，实施轮按盘回填）**

| # | 文件 | 现行 ⇒ 预期 | 改动点 |
|---|---|---|---|
| 1 | `thincoder-core/model-ref.mjs` | 66 ⇒ ≈150 | + `resolveProviderPlan`（回退序 ∥ 模型面 ∥ 状态 ∥ reason）+ `resolveChannelModel`（模型面单值——VSC 转口面） |
| 2 | `thincoder-core/config.mjs` | 432 ⇒ ≈444 | `:328-335` 取值切换（plan）+ `providerState` / `providerStateReason` 两键 |
| 3 | `thincoder-core/session-lifecycle.mjs` | 390 ⇒ ≈400 | `applySession` `:162-205` 槽面（key 门 + 模型面序——KD-841-2） |
| 4 | `thincoder-cli/src/tui/index.mjs` | 246 ⇒ ≈256 | `promptProviderIfInvalid` `:56-68` 分流（fallback 行 ∥ invalid picker）+ 措辞 + `:223-225` 注 |
| 5 | `thincoder-cli/src/command-interactive.mjs` | 186 ⇒ ≈191 | headless：fallback 一行 stderr（`:33-40` 邻域） |
| 6 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 250 ⇒ ≈243 | 链 `:41-101` 改核调用（净减——自建链退场） |
| 7 | `thincoder-vscode/src/extension/presets.mjs` | 198 ⇒ ≈192 | `resolveDefaultModel` `:107-117` 改核转口 |
| 8 | `thincoder-vscode/src/extension/settings.mjs` | 370 ⇒ ≈378 | `providerStatus()` `:69-102` + `pushStatus` `:316-319` 携 `providerState` |
| 9 | `thincoder-vscode/webview/chat-messages.js` | 264 ⇒ ≈270 | `providerStatus` case `:144-149` 三态横幅 |
| 10 | `thincoder-vscode/webview/ui.js` | 222 ⇒ ≈235 | `showBanner` `:53-69` 三态 + 动作钮 |
| 11 | `thincoder-vscode/locales/zh.json` ∥ `en.json` | 各 276 ⇒ 278（+2 键 ×2 语） | `banner.defaultModelFallback` ∥ `banner.chooseDefaultModel` |
| 12 | `thincoder-desktop/src/main/turn-input.mjs` | 119 ⇒ ≈125 | 成功回执携 `providerState`（+ #840 `providerKind` 判据换源——「渠表非空」⇒「有持 key 渠道」） |
| 13 | `thincoder-desktop/src/main/session-slots.mjs` | 235 ⇒ ≈245 | `history:page` 页读回执携 `providerState`（投影族） |
| 14 | `thincoder-desktop/src/main/ipc.mjs` | 276 ⇒ ≈278 | `historyPage` ∥ `msgSend` 出口随动 |
| 15 | `thincoder-desktop/renderer/composer-wire.mjs` | 262 ⇒ ≈268 | 回执 `providerState` 落写 |
| 16 | `thincoder-desktop/renderer/composer-sync.mjs` | 302 ⇒ ≈312 | `paintNotices` 明示行 + 清位（**越层在册——续期**） |
| 17 | `thincoder-desktop/renderer/store.mjs` | 331 ⇒ ≈335 | `providerState` 切片（**越层在册——续期**） |
| 18 | `docs/core/design/PROVIDER.md` | 495 ⇒ ≈555（本轮 +§6.22 + 变更记录） | 已落 |
| 19 | `docs/core/design/SESSION.md` | 1273 ⇒ ≈1276 | §6.8 收正 + 变更记录（已落） |
| 20 | `docs/vsc/design/WEBVIEW.md` | 800 ⇒ ≈811 | §4.8 + 变更记录（已落） |
| 21 | `docs/desktop/design/COMPOSER.md` | 267 ⇒ ≈277 | 本批注 + 变更记录（已落） |
| 22 | `docs/desktop/design/IPC.md` | 509 ⇒ ≈519 | 两行 + 投影注 + 变更记录（已落） |
| 23 | `docs/core/design/API-CONTRACT.md` | 生成区重跑（`node scripts/api-contract.mjs --write`——实施轮；新导出入生成区） | 机制面 |
| 24 | `docs/batches/2026-10-03-provider-invalid-unify.test.mjs` | 新档 ≈180 | 批内件（T1–T5） |

**验收对照（回指本批条目 + 可机检断言设计）**

- **断言 A（解析一致——「同一配置态 ⇒ 三端解析结果一致」）**：夹具矩阵每行 P（临时配置路径缝 `_setConfigPathForTest` + 假槽）：`loadConfig()` 的 `{state, provider.name, provider.model}` ≡ VSC `resolveTurnStage` 核读 ≡ 桌面同径（`assembleFor` 经核装配）——**逐字段相等**（矩阵 ≥9 行：S1–S9 见下表）。
- **断言 B（单源）**：VSC 树零自建回退扫描（源码判据：`panel-turn-stages.mjs` 无 `providerNames()` 扫描循环；`presets.mjs` `resolveDefaultModel` = 核转口）；CLI ∥ 桌面取值点唯一 = `loadConfig().provider`。
- **断言 C（明示必达 + 负向锁）**：`state === "fallback"` ⇒ 三端明示节点在场（CLI 行文本 ∥ VSC 横幅三态键 ∥ 桌面行节点）；`state === "ok"` ⇒ 三端零节点；`state === "invalid"` ⇒ 端面导引节点（CLI picker ∥ VSC 现词 ∥ 桌面失败行）。

| 条目 | 验收判据 | 机检 / 实证面 |
|---|---|---|
| R1 | `resolveProviderPlan` 回退序三步逐档 + `loadConfig` 三键逐档 | 批内件 T1 ∥ T2 |
| R2 | 两态分界矩阵（S1–S9）逐行 `state` 断言 | 批内件 T2 |
| R3 | 断言 C 三分支 + 负向锁 | 批内件 T3（三端各面在场/缺席） |
| R4 | 断言 A + VSC 回归对拍（S1/S2/S6 新读数 == 现读数——可用性不降） | 批内件 T4 ∥ T5 |
| 边界 | `git diff --name-only` 全数落四树 + `docs/**`；零第三方依赖 ∥ 零发布链 | 实施轮核对 |

**复现基（三端现行读数——本轮真核实跑，as-of 2026-10-03 设计轮）与新读数对照表**

夹具 = 临时家目录 + 真核（`loadConfig` 实跑）∥ VSC 链按 `panel-turn-stages.mjs:57-74` + `presets.mjs:107-117` 逐行语义实算；**新读数 = 本设计的 `resolveProviderPlan`**。

| 夹具 | 现 · 核（CLI ∥ 桌面装配） | 现 · VSC | 新 · 统一（三端） | 明示 |
|---|---|---|---|---|
| S1 provider+key（无 defaultModel） | `{}` 无效（reason「defaultModel 未设置…」）⇒ CLI 弹 picker ∥ 桌面报「未配置 API 密钥」 | deepseek:deepseek-flash 直接可发（零提示） | `fallback` ⇒ deepseek:deepseek-flash | 三端明示 |
| S2 defaultModel「deepseek:」（空模型段） | `{}` 无效（reason「model part is empty」） | 同上 | `fallback` ⇒ deepseek:deepseek-flash | 明示 |
| S3 正常号 | deepseek:deepseek-v4-pro | deepseek:deepseek-v4-pro | `ok` | 零 |
| S4 无渠道 | `{}` 无效（「未配置任何 provider」） | 无 ⇒ error.provider | `invalid` | 引导配置 |
| S5 渠道无 key | `{}` 无效（「defaultModel 未设置…」——**核不查 key**） | 无（无 key ⇒ null） | `invalid` | 引导配置（密钥） |
| S6 双渠道 · 默认 kimi | kimi:kimi-k3 | kimi:kimi-k3 | `ok` | 零 |
| S7 未知渠道「nope:x」 | `{}` 无效（「unknown provider nope」） | deepseek:deepseek-flash（**无声**） | `fallback` ⇒ deepseek:deepseek-flash | 明示 |
| S8 默认渠道无 key ∧ 他渠有 key | **deepseek:x（核不查 key——装配过 ⇒ 请求期炸）** | kimi:kimi-k3 | `fallback` ⇒ kimi:kimi-k3 | 明示 |
| S9 槽 = deepseek（有 key）∧ 默认 kimi | 核 = kimi ∥ 槽面 = deepseek（不看 config） | deepseek:deepseek-flash | `ok`（config 级）+ 运行 = deepseek:deepseek-flash（槽） | 零（槽 = 会话选择） |

**批内单测件落点声明**：`docs/batches/2026-10-03-provider-invalid-unify.test.mjs`（随批留存 · 不进仓套件 · 实施轮由实施者编写并实跑；S1–S9 夹具矩阵 + T1–T5；UTF-8 断言）。

**关键决策（KD-841-1–4，全文同源 `PROVIDER.md` §6.22）**

- KD-841-1 落点 = 核导出统一解析 + `loadConfig` 取值切换（非「核内实现 + 端面缝」——VSC 回合面要槽复合，纯核内法不可达 ⇒ 端面必复刻链 = 被归一对象）。被否：新核档 ∥ 纯 loadConfig 内联。
- KD-841-2 槽渠道 key 门入核（统一序第 1 步「槽渠道（有 key）」）⇒ `applySession` 槽应用面同收（CLI ∥ 桌面共享——行为变更，见 U-2）。被否：槽面无 key 门（三端再分叉）。
- KD-841-3 状态 = **config 级**（槽不参与三态判定——槽改写「谁在跑」，不改「默认模型是否有效」）。被否：按运行渠道 == defaultModel 渠道判（用户每换会话模型即误报）。
- KD-841-4 结构要件（`baseURL` 等）**不并入回退序**（仍归 `validateProvider` 单判据）；结构不全 ⇒ 既有标记 ⇒ 归 `invalid` 类（#840 `provider` 类词照旧）。
- KD-841-5（增量）VSC 显式 `providerName`（dropdown echo）并入候选（key 门同核）；构建失败径不变（`error.failedProvider`）；仅「显式渠道无 key ∧ 他渠有 key」从「报错」变「回退」（更多可用 ∥ 与链同判）。

**上抛项**

- **U-1 实施序**：本批桌面面复用 #840 的新键 ∥ 钮 ∥ KD-8 槽复验（`turn-input.mjs` `providerKind` 判据换源同址）⇒ **实施须在 #840 落地后（或同轮接续）**；若先实施，按盘以 #840 §2 契约为准接线。
- **U-2 行为变更披露**：KD-841-2 使 CLI ∥ 桌面在「槽渠道无 key」时不采用槽渠道（原：采用 ⇒ 请求期炸）——既有单测若有断言该行为 ⇒ 随本批收正；请评审确认边界。
- **U-3 桌面 invalid 态静置面**：本批桌面只补 `fallback` 明示行；`invalid`（真·无 key）在桌面**静置期零明示**（仅发送失败面 #840）——与 VSC 横幅 ∥ CLI picker 对「明示必达」的字面差；是否补静置行 = 请裁（本批最小化未做）。
- **U-4 双 reason 字段并存**：`providerInvalidReason`（不完整时）∥ `providerStateReason`（state≠ok 时）语义重叠——是否收并为派生，请评审（本批保持零改面）。
- **U-5 需求侧**：如需需求条目记录本归一（核心 ∥ 桌面卷），笔 = 主 agent（本设计轮零改需求档）。
- **U-6 `API-CONTRACT.md` 生成区重跑**归实施轮（`node scripts/api-contract.mjs --write`——新导出自动入区；语义区可选补行）。

**§2 更正块（用户 13:43 更正 · 词面-only 终形收正 · 修正轮 #8 · 2026-10-03 · eng-designer）**

**来源**：用户 13:43 澄清——13:09 那条实为拼音误打，原话 =「**按你倾向走**」（采纳父侧倾向，与 13:10 同义），**非「界面加按钮」**；「按钮倾向」系父侧误读、作废（§1 已载——`:36`）。本块 = §2 末位终读件：与上文钮面句（`:48` ∥ `:65` ∥ `:67` ∥ `:71` ∥ `:144`）冲突处**以本块为准**。

**终形（桌面明示行）**：`fallback` 态明示行 ⇒ 词 `composer.send.noDefaultModel`（**逐字复用 #840 键**）——**词面-only ∥ 零动作面**；钮件（键 `composer.send.chooseModel` ∥ handler `panelOf()?.openModelMenu`）**作废**（句柄实不可达——核件返回面 `panel.mjs:482-489`，与 #840 同病同废）；`invalid` 态照旧归发送失败行（#840 面）。

**保留清单（零减）**：态明示行（`state === "fallback"` 在场）∥ `providerState` 数据面（`history:page` ∥ `msg:send` 回执三态载荷）∥ 回退链判据（单源 = `docs/core/design/PROVIDER.md` §6.22）∥ 零新键原则（桌面全键 = #840 复用）。

**§2 上文钮件字面逐行处置**：`:48`（R3「复用 #840 键与钮」）⇒ 钮面作废（保留「复用 #840 键」）∥ `:65` ∥ `:67` ∥ `:71`（三端表：导语「词形 + 动作按钮落点」∥ 表头「（按钮倾向）」∥ 桌面行「词 + 钮」）⇒ 桌面行收正为词面-only、导语 ∥ 表头源词随废（最新活形 = `PROVIDER.md` §6.22 表）∥ `:144`（U-1「新键 ∥ 钮」）⇒ 钮面退场（见下「上抛随动」）∥ `:69` ∥ `:70` ∥ `:86` ∥ `:87`（CLI 动作格 ∥ VSC 动作钮 ∥ VSC 两键）= **保留**（非射程）。扫描判据（§2 范围）= 字面「钮」∥ `chooseModel`；结果 = 除保留面（VSC 动作钮 ∥ CLI picker）外零残留——记录面留痕（本档 §1 ∥ §2 上文 ∥ `COMPOSER.md` `:275`/`:277` 变更记录）= 历史在案（活读以各更正件为准）。

**落点处置（逐面）**：
- `docs/desktop/design/COMPOSER.md` #841 批注（`:118-125`）：**#7 已收净**（`:119`「字面与钮」⇒「字面」∥ `:122` 钮半 ∥ `:125` 边界句）；**#8 读回核净——零残留**（父侧消重裁定「勿重做」——重叠件由此消重落地）。变更记录 = 该档 `:277`（#7 行已载）。
- `docs/desktop/design/IPC.md` §2「provider 态投影注」（`:232`）：**#7 已收净**；**#8 读回核净——零残留**。
- `docs/core/design/PROVIDER.md` §6.22 三端表（`:425-429`——父侧补点纳入本单）：**#8 本轮收正**——桌面行 `fallback` 格去「+ 钮 `composer.send.chooseModel`」⇒ 词面-only ∥ 动作格「钮 → 模型菜单（同钮同门）」⇒ `—（零动作面）`；表头「（按钮倾向）」⇒「动作」（误读源词去）；变更记录 +1 行（本档文末）。**列保留裁定（按该表语法）**：CLI 选择器 ∥ VSC 动作钮 = 非射程（各自动作面真在）⇒ 列不删、只收桌面行钮件引用。
- VSC 横幅动作钮（`WEBVIEW.md` §4.8 ∥ 键 `banner.chooseDefaultModel`）∥ CLI picker：**保留**（同上——非射程）。

**文件表随动（对 `:73-100` 表 · 如列钮件行）**：行 16（`composer-sync.mjs`）钮面退场 ⇒ delta 收窄 = `302 ⇒ ≈312` ⇒ **`302 ⇒ ≈308`**（仅词行 + 清位；越层在册续期照旧——实施轮按盘回填）∥ 行 18（`PROVIDER.md`）本更正含变更记录 +1 行（已计）∥ 行 21（`COMPOSER.md`）零改（#7 已落）∥ 行 10 ∥ 行 11（VSC 动作钮 ∥ 两键）= 保留行（非射程）∥ 余行照旧。

**上抛随动**：U-1「复用 #840 的新键 ∥ 钮 ∥ KD-8 槽复验」⇒ **「复用 #840 的新键 ∥ KD-8 槽复验」**（钮面退场——实施序依赖不变）；U-2…U-6 照旧。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审射程与限制**：射程 = 批档 §2 + 五档对应节（`PROVIDER.md` §6.22 ∥ `SESSION.md` §6.8 ∥ `WEBVIEW.md` §4.8 ∥ `COMPOSER.md` §2 批注 ∥ `IPC.md` §2「provider 态投影注」）；本轮不读码——行数/码面断言标 unverified。项目无标准档声明 ∥ 无文档地图 ⇒ 方法论合规按 AGENTS.md + 评审准则判，文档归属按 D2 既有惯例（机制单源分落）判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | SESSION.md §6.8 同段两处对「无有效 defaultModel」类的 headless 处置互斥：D-S4 仍作「遇无效 defaultModel ⇒ `console.error` + `exitSoon(1)`」（`docs/core/design/SESSION.md:207`），新写 D-S2 作「`fallback`（无有效 defaultModel 但可运行）⇒ 不弹 picker…；headless（D-S4）同态出 stderr 一行明示」（`SESSION.md:203`），批档 R3/受影响表同向（`docs/batches/2026-10-03-provider-invalid-unify.md:69`、`:81`），且「启动即退出」已列否决（`SESSION.md:208`）。新分界下「无效 defaultModel」= fallback（可运行）——同机制两描述（exit ∥ 运行+提示行）⇒ 实现者二选一即端间逻辑分叉。 | 把 D-S4 触发条件收正为 `invalid`（无 provider/key）并明写 `fallback` 下 headless = stderr 一行 + 继续运行——使 D-S2 ∥ D-S4 ∥ 批档 R3 三处同解。 |
| 2 | Acceptance criteria | 🟡 | 断言 A 要求「逐字段相等」且矩阵含槽行（`批档:104`、`:130` S9），但比较三项输入不同源：`loadConfig()` 无槽入参（KD-841-3 状态 = config 级）⇒ S9 出 config 级选择（kimi），VSC `resolveTurnStage` ∥ 桌面装配按含槽复合出运行渠道（deepseek）——按字面 S9 行必红；矩阵自身即示「ok（config 级）+ 运行 = deepseek…」（`批档:130`）。 | 钉定比较输入与字段：运行面 = 三端同喂假槽对拍；config 级 `loadConfig()` 只比 `state`（或对含槽行单列口径）。 |
| 3 | Acceptance criteria | 🟡 | 模型面第 ④ 步声明 `model=null` 合法（`PROVIDER.md:411`），但两类明示词均以模型插值：CLI「本次使用 `<渠道>:<模型>`」（`PROVIDER.md:427`）、VSC「正在使用渠道默认模型」（`WEBVIEW.md:202`）——`model=null` 档词形/机检未定义，S1–S9 无该行；断言 C（`PROVIDER.md:435`）亦未覆盖。 | 补 `model=null` 行明示词形（如仅报渠道名）并入矩阵/断言 C。 |
| 4 | Clarity | 🟡 | U-4（双 reason 字段）未定合成规则：KD-841-4 声明「入选渠道结构不全 ⇒ 落既有标记 ⇒ 归 invalid 类」（`PROVIDER.md:442`），但 `providerState` 只按 key 判（`PROVIDER.md:415-417`），端面按 `state` 出词（`WEBVIEW.md:201-203`、`COMPOSER.md:122`），CLI 门为 `_providerInvalid ∥ !agent.provider`（`SESSION.md:202`）——「持 key 但结构不全」态：CLI 出 picker（节点在场）∥ VSC/桌面零节点，与断言 C 的 state-only 负向锁（`PROVIDER.md:435`）相抵。 | 两字段可并存，但明写端面「invalid 类」合成式（建议 = `state==="invalid"` ∨ `providerInvalidReason` 非空）；U-4 裁 = 并存 + 成文（或收并为派生）。 |
| 5 | Clarity | 🟡 | VSC 横幅三态以 `keyOk`（旧门）+ `state` 双判据合成（`WEBVIEW.md:201-203`），两者关系未定义；同档三端表只写 `invalid ⇒ banner.notConfigured`（`PROVIDER.md:428`）。若 `keyOk` ≠「state≠invalid」（keyOk 现定义不在本单——unverified），「激活渠道无 key ∧ 他渠有 key」（fallback 类）会被第一支吃掉 ⇒ fallback 横幅不可达。 | 钉定 `keyOk` 与核态关系（建议 `keyOk := state !== "invalid"`，去第二判据）或写明两支优先级/等值条件。 |
| 6 | Doc hygiene | 🟡 | SESSION.md D-S1 规范面残留：「runtimeProvider 置空对象 `{}` + `providerInvalidReason`」（`SESSION.md:197`）对 fallback 类（该触发器的主类）已被推翻（provider = 入选渠道），收正只以括注追加（`:198-199`）——读者按正文即得死结论。 | 就地改写 D-S1 句（如「运行时 provider = 统一解析入选渠道；不可运行 ⇒ 置空 `{}`」），收正史留变更记录。 |
| 7 | Clarity | 🟡 | 桌面明示行清位只接两径（`history:page` ∥ 成功 `msg:send` 回执——`COMPOSER.md:121`/`:124`、`IPC.md:234`）；设置面修好 `defaultModel` 后（自写被 `ev:config` 自写抑制排除——`IPC.md:38`）行保持在场 = 陈旧假报，直至下次发送/开页；VSC 对位为「provider 写后」即刷（`WEBVIEW.md:200`）。 | 补第三刷新点（设置写回执 ∥ 设置面关闭 ∥ `ev:config`）或明写「修后至下次发送前可陈旧」为已认账。 |
| 8 | Scope | 🟡 | 协调项（非缺陷）：U-1 实施序依赖 #840（dependsOn 咬合 + 键名冻结）、U-6 `API-CONTRACT.md` 生成区重跑、U-5 需求条目（收口时落）——均已载 §2 上抛（`批档:144-149`），属父侧/实施轮 TODO。 | 派单时逐条核销（dependsOn ∥ 实施轮清单 ∥ 收口清单）。 |
| 9 | Document ownership | 🟡 | 随动面遗漏两处（均描述本批改装的机制面、未列入受影响文件表）：① `PROVIDER.md` §6.19 ⑤ 仍以「VSC 独立实现」描述 `resolveDefaultModel`（`PROVIDER.md:296-297`），而本批改其核转口（`PROVIDER.md:431`）；② `SESSION.md` §6.24 判据句 2 渠道合并式「命中渠道表 ⇒ `{...entry, model: data.activeModel || entry.model}`」（`SESSION.md:862`）自称与 applySession「模型合并支 ①」同判，而本批给该面加 key 门 + 模型面序（`SESSION.md:204-205`、`批档:79`）——「在册但无 key」与「缺 activeModel ∧ defaultModel 属同渠道」两角上两式不等值；批档 SESSION 行只列 §6.8（`批档:95`）。 | 两处同拍或登记随动（§6.19 ⑤ 括注 ⇒「核转口（#841）」；§6.24 合并式补 key 门 + 模型面序）。 |
| 10 | Clarity | 🔵 | 上抛裁决（回 U-2/U-3）：U-2 边界**可接受**（槽 key 门对齐 VSC 事实标准，消「请求期炸」）——但「槽被跳过」时槽值是否随下次保存改写（`activeProvider`/`activeModel` 静默迁移到回退渠道）未明写；U-3 桌面 invalid 静置期零明示**维持最小可**（「界面可异」+ 发送失败面兜底），无需补。 | 明写「跳过不写槽（原槽值保留）」或「随保存迁移」二者择一；U-3 维持现状（后续如补，走静置行同族）。 |
| 11 | Clarity | 🔵 | VSC 两新键 en 字面未定：`banner.defaultModelFallback` 只给 zh 字面 +「en 成对」，`banner.chooseDefaultModel` 只写中文标签（`WEBVIEW.md:202`）——词面为项目敏感面，两语成对为常态。 | 同轮钉定两键 zh ∥ en 字面（沿 #840 同批先例）。 |
| 12 | Affected-file size annotations | 🔵 | 行数注记抽查：可从在档交叉的读数一致（`ipc.mjs` 276 ✓ `IPC.md:3` ∥ `panel-turn-stages` 250 ✓ `COMPOSER.md:176` ∥ `composer-sync` 302 ✓ `COMPOSER.md:141`）；余为跨日读数差（`chat-messages.js` 264 vs `WEBVIEW.md:46` 238 as-of 09-28）——真值需实读源档（本单不读码，unverified）。另 >300 档中 `config.mjs`(432)∥`session-lifecycle.mjs`(390)∥`settings.mjs`(370) 无「越层在册」注，而 `composer-sync`/`store` 有（`批档:73-100`）——口径待明。 | 实施轮按盘回填（表内已声明）；对既存 >300 三档补「越层在册」注或写明免注口径。 |

计数：12（🔴1 ∥ 🟡8 ∥ 🔵3）。

VERDICT: changes-required

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
