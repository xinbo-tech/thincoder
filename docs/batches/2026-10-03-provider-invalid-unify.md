# 2026-10-03 · 无效渠道态逻辑归一
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 13:07 原则裁定「三端界面可以不一样，但是逻辑应该是一样的」→ 父侧列 U1/U2/U3 三档 + 倾向 U3 → 13:10 用户「按你倾向走」= 取 U3（台账 #841）。
> 台账 = #841（core · 归批）。前情 = 无（独立批——与 #840 同族但独立：本批 = 三端口径归一 ∥ #840 = 桌面单端修复）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-03
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
**状态行**：设计完成（修正轮 #12：实施后回填轮——行数账按盘回归 + 实施轮文档漂移收正；产品码零触 · doc-check exit 0）
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

**§2 修正块（设计评审轮 1 收正 · 发现 1–12 逐条 ∥ 宿主标注引用重锚 ∥ #840 回填轮 #9 报账③ 顺笔 · 修正轮 #9 · 2026-10-03 · eng-designer）**

**来源**：批档 §3 轮次 1（发现 1–12；父侧逐条裁决 = **采纳**——Suggestion 即收正方向）∥ 宿主核验标注（`SESSION.md:202` ∥ `SESSION.md:870`——实读重锚，见下）∥ #840 回填轮 #9 报账③（父侧裁 = 转本席顺笔）。**产品码零触**；落点 = 设计档五档 + 批档。

**逐条处置（号 → 改动 file:line；行号为修正后现盘）**

1. 🔴 D-S4 三处同解：`SESSION.md:206`（D-S4 触发收正为 **invalid 类**（无 provider/key——不可运行）；明写 `fallback` ⇒ stderr 一行 + 继续运行）· `SESSION.md:199`（TUI 路径改 `state === "invalid"`）· `PROVIDER.md:429`（CLI invalid 格补 headless = D-S4 退出）——D-S2 ∥ D-S4 ∥ 原批档 R3 三处同解。
2. 🟡 断言 A 钉定：`PROVIDER.md:435` 断言①改**两腿**——运行面 = 三端同喂**同一假槽**按 `{state, source, channel, model, provider.name, provider.model}` 逐字段相等；config 级（`loadConfig()` 无槽入参）= **只比 `state`**；含槽行（S9）单列口径（config 级 `state` = `ok` ∥ 运行渠道断言归假槽腿）。§2 上文 `:104` 断言 A / `:106` 断言 C / `:120-130` 矩阵——读法以本块为准。
3. 🟡 `model=null` 档：`PROVIDER.md:411`（模型面 ④ 补「明示词形随缺——仅渠道名」）+ `:429`（CLI 格 `<渠道>[:<模型>]`）+ `SESSION.md:202`（fallback 词形同拍）+ `:437`（断言③补 null 档）；矩阵**补 S10** = 渠道持 key ∧ 无 `defaultModel` ∧ 渠道无单值模型 ⇒ `fallback` + `model=null` ⇒ 词形仅渠道名。
4. 🟡 invalid 类合成式（U-4 裁 = **两字段并存 + 成文**，不合并）：`PROVIDER.md:419`（全式 = `state === "invalid"` ∨ `providerInvalidReason` 非空）· `SESSION.md:201`（D-S2 门）· `WEBVIEW.md:201`/`:204` · `COMPOSER.md:122` · `IPC.md:232`/`:236`；载荷面补 `invalidReason`（`WEBVIEW.md:200` · `IPC.md:233-234` · `COMPOSER.md:121`——合成式可算，发现 4 的直接导出）；断言③负向锁改「`ok` ∧ `providerInvalidReason` 空」。
5. 🟡 `keyOk` 钉定：`WEBVIEW.md:204` 新增行——**`keyOk := 非 invalid 类`**（= `state !== "invalid"` ∧ `invalidReason` 空——核态派生**单判据**，去第二判据；欢迎面 ∥ 向导面既有消费随此派生）。
6. 🟡 D-S1 就地改写：`SESSION.md:197-198`（新正文 =「运行时 provider = 统一解析入选渠道；**不可运行 ⇒ 置空 `{}`**」）；修订式括注**去净**（规范面死正文清零）；收正史 = 该档变更记录 `:1282`。
7. 🟡 第三刷新点（择「设置写回执」径）：`COMPOSER.md:124` + `IPC.md:235`——`settings:agent` ∥ `provider:save` **成功回执**携 `providerState`（写后核读）⇒ 同写点落切片 ⇒ 即时退场；载荷面同拍（`COMPOSER.md:121` · `IPC.md:233`）。零新通道（回执内字段）；「设置面关闭」径未取（回执携键 = 最小形）。
8. 跟踪项：U-1 ∥ U-5 ∥ U-6（§2 `:144-149`）——**派单时核销**（dependsOn ∥ 收口清单 ∥ 实施轮清单）；本轮零改。
9. 随动两处收正：`PROVIDER.md:297`（§6.19 ⑤ 括注「VSC 独立实现」⇒「**核转口（#841）**」）· `SESSION.md:861`（§6.24 判据句 2 合并式补 key 门 + 模型面序）∥ `SESSION.md:869-870`（边界情形 ② 补「槽渠道无 key」径）。**受影响文件表追加（对 `:73-100` 表）**：行 18（PROVIDER.md——§6.19 ⑤ 行内改，净 0 行）· 行 19（SESSION.md——§6.24 两处）。
10. 🔵 槽值不迁移：`SESSION.md:203`（D-S3 补「跳过不写槽——原槽值保留」）。「随保存迁移」未取——绕过用户显式选择 = 静默改写，与「零静默」相抵。
11. 🔵 两新键 zh ∥ en 钉定：`WEBVIEW.md:202`——`banner.defaultModelFallback` zh「⚠ 默认模型未设置或无效 — 正在使用可用渠道」∥ en「⚠ Default model missing or invalid — using an available channel」；`banner.chooseDefaultModel` zh「选择默认模型」∥ en「Choose default model」。（zh 由「正在使用渠道默认模型」收正——`model=null` 档同词。）
12. 🔵 >300 注记口径（本单裁）：「越层在册——续期」注**仅桌面族档行**适用（挂 `PROJECT.md` §4.1 越层段）；core ∥ VSC 档行以「现行 ⇒ 预期」读数 + 尺度结论句承载（500 硬线内 ∥ 无结构改动 ⇒ 无拆分需要）；本批三档（`config.mjs` 432 ∥ `session-lifecycle.mjs` 390 ∥ `settings.mjs` 370）**免注**。行数真值 = 实施轮按盘回填（表内已声明）。

**重锚对照（宿主标注三处 · 实读复核 + 旧 ⇒ 新行号）**：全仓实扫——「`SESSION.md:870`」字面引用零命中；「`SESSION.md:202`」引用仅 §3 发现 4 单处。逐处实读定位 =：① `SESSION.md:202` = D-S2 invalid 门行（旧引用形 `_providerInvalid ∥ !agent.provider`）⇒ 收正为合成式——**新址 `:201`**；② 同段 fallback 行（第二引称——词形）⇒ **新址 `:202`**；③ `SESSION.md:870` = §6.24 边界情形行（旧形「渠道已删 ⇒ fallback」）⇒ 补无 key 径——**新址 `:869-870`**。**连带全量复核（本批 SESSION 行号引用 · 旧 ⇒ 新）**：`:207`⇒`:206` ∥ `:203`⇒`:202` ∥ `:208`⇒`:207` ∥ `:197`⇒`:197`（同位）∥ `:198-199`⇒并入 `:197-198` ∥ `:862`⇒`:861` ∥ `:204-205`⇒`:203-204` ∥ `:870`⇒`:869-870`。§3 发现表行号 = 评审轮 as-of（记录面）——后续引用以本对照为准。

**顺笔（#840 回填轮 #9 报账③）**：`IPC.md:314-315` 设置族注 8④ 机检指针收正——`thincoder-desktop/test/views-onboarding.test.mjs:71/:153/:158` 盘上无档（2026-09-28 测试树重置后 `thincoder-desktop/test/` 仅余基建三档）⇒ 改记「机检 = 批内件（端侧机检现形 = `docs/batches/*.test.mjs` 批内件族）」；注余部零改。

**行数随动（按盘实读 · 修正后）**：`PROVIDER.md` **564**（+4——合成式 +2 ∥ 变更记录 +2）∥ `SESSION.md` **1284**（净 +2：§6.8 −1 ∥ 变更记录 +3 ∥ §6.24 折行 +1）∥ `WEBVIEW.md` **814**（+2）∥ `COMPOSER.md` **279**（+1——变更记录）∥ `IPC.md` **524**（+3——投影注折行 +2 ∥ 变更记录 +1）。表列「预期」以本行为准；实施轮仍按盘回填。

**验收对照（本轮）**：① 12 条逐条落位 = 上表；② 三处引用重锚 = 上「重锚对照」（实读）；③ `node scripts/doc-check.mjs` = **exit 0**——「OK(锚): 0 条悬空」+「OK(行宽): 源域全部 .md 无 >300 字符单行」（修正中间态曾 3 行超宽，已按语义折行消解）；行数面报告 1 条 = `E2E-TESTING.md:249`（他档读数差 Δ+1——报告态，非本批）；④ 五档变更记录各 +1 行在盘。

**零改面**：产品码 ∥ #840 面 ∥ #7/#8 已收正面 ∥ 其他档——零触。

**修正块补记（读回自纠 · 2026-10-03 · eng-designer）**：上「行数随动」行两处净增量笔误——按 git 对盘（HEAD ⇒ 工作区 · 内容行口径）收正：`PROVIDER.md` 净 **+5**（合成式 +2 ∥ 变更记录 +3；误记 +4）∥ `SESSION.md` 净 **+3**（§6.8 −1 ∥ 变更记录 +3 ∥ §6.24 折行 +1；误记净 +2——其括注合数原即 +3）。余数复核无误（`WEBVIEW.md` +2 ∥ `COMPOSER.md` +1 ∥ `IPC.md` +3）；诸档「修正后」绝对值（564 ∥ 1284 ∥ 814 ∥ 279 ∥ 524）无误。

**§2 修正块（实施轮 A 单漂移回裁 · 修正轮 #10 · 2026-10-03 · eng-designer）**

**来源**：批档 §5（A 单实施记录）上抛 1 ∥ 2——① `PROVIDER.md:419` 括注与实现实况（核产出者 `config.mjs:337` = name 面）不符；② ACP 面（第四消费面）未入本批明示表。父侧派本修正轮（两件二择一 · 本席裁定落文）。**产品码零触 ∥ 其他档零触（纯设计/记录面）。**

**① 处置 = （a）收窄措辞。** 不取 (b)，理由三条：㈠ (b) 须改 `providerInvalidReason` 产出面或给合成式加第三腿（`_providerInvalid`）= **重开 #840 已裁路由**（结构不全角 = #840 `provider` 类发送失败面）；㈡ KD-841-4 明拒「链内预检结构」（判据增殖 + 与校验点语义重叠）——(b) 正是该被否支；㈢ 码改 + 跨端行为变更 + 已钉机检件（A 单 T3 结构腿 `:212-225`）重做——超修正轮射程；且 picker 不修该角真因（缺 `baseURL`）。

逐处改动（file:line · 行号 = 修正后现盘）：
1. `PROVIDER.md:419-420`：面收正「provider 不完整面——`validateProvider` 判」⇒「**name 面**——`config.mjs:337` 产出：入选渠道具名 ⇒ null ∕ 无入选渠道 ⇒ 非空」；「「持 key 但结构不全」由此归导引类」⇒「**不在合成式内——归发送 ∕ 装配失败面**（装配标记 `_providerInvalid` 载体：桌面发送门〔#840 `provider` 类词〕∥ ACP `session/new` 装配后检查；CLI ∥ VSC 落发送期失败面），非导引节点（断言③负向锁互洽）」。
2. `PROVIDER.md:422`（同述连改）：「provider 不完整时非空——装配校验 `validateProvider` 消费面照旧」⇒「无入选渠道时非空——`config.mjs:337` 产出，`validateProvider` 消费面照旧〔reason 优先源〕」。
3. `PROVIDER.md:448`（KD-841-4 同述连改）：「⇒ 落既有标记 ⇒ 归「真无效 + 引导配置」类」⇒「⇒ 落既有标记（`_providerInvalid`）⇒ 归**发送 ∕ 装配失败面**（#840 `provider` 类词面照旧——非启动导引面）」。
4. `:437` 桌面导引节点句**顺核 = 无需同步**——其射程 = 合成式命中类；结构不全角在合成式外、由 `:419-420` 注承接；负向锁句与实测互洽（A 单 T3 结构腿同钉）。

**② 处置 = （b）明写边界。** 不取 (a)，理由：(a) 的「放行是否需提示面/何时提示」= ACP 协议面**新机制设计**（无既有提示通道；`configOptions` 只带 id/name 不带值）——修正轮不夹带新语义；且其码改按派单属「仅出规格」⇒ B/C 单外再开 ACP 单 = 范围扩张。取 (b) 防翻修 = 行为变更在案 + 边界明写。

落文（ACP 行为变更记录）：
- **变更**：`thincoder-cli/src/acp.mjs` 门判据（`defaultIsConfigured` = `loadConfig().provider?.apiKey?.trim()`）**随核取值切换连动**——「持 key ∧ 无有效 `defaultModel`」档由「拒（携 reason——ACP-CLIENT.md §11.5 ② 分支）」变「**放行**」，协议面零提示行。
- **定性**：**U3 判据的自然导出**（可运行 ⇒ 放行——旧「拒」系旧严格逻辑之下场；非缺陷）。
- **边界**：本批明示射程 = 三端 UI 面；ACP = 外部编排器协议面（无既有提示通道）——协议面提示通道**未决，如需另立设计**。
- **落点**：`PROVIDER.md` §6.22 新增「第四消费面（ACP）注」（`:436-437`）+ 变更记录（`:570-571`）；**受影响表不追 ACP 行**（明写边界——`acp.mjs` 非本批改动档；行为变更系核切换连带）。
- **连带（其他档零触 · 请父侧裁）**：`docs/cli/design/ACP-CLIENT.md` §11.5 现状段「强绑 `defaultModel`」前提已换、② 分支默认接线不可达、§11.7-4「② 必点名 `defaultModel`」与 2026-09-18 批 AC12 随之失效——该档本轮零触。

**受影响文件表随动（对 `:73-100` 表）**：行 18（`PROVIDER.md`）计数按盘收正 = **564 ⇒ 571**（本轮净 +7：`:419` 折行 +1 ∥ ACP 注 +3 ∥ 变更记录 +3）；其余 23 行零动。

**§5 上抛余项（不在本单射程 · 留在案）**：3（#840 批内件三条旧读数腿归属）∥ 4（U-6 生成区重跑）∥ 5（入选条目无 `name` 窄档——本轮零改；name 面表述已按实况收正，该窄档处置仍留观）。

**验收对照（本轮）**：① 两处落文 + 读回（D6）——五处实读在盘（`:419-420` ∥ `:422` ∥ `:436-437` ∥ `:448` ∥ `:570-571`）；② `node scripts/doc-check.mjs` = **exit 0**（「OK(锚): 0 条悬空」∥「OK(行宽): 源域全部 .md 无 >300 字符单行」；行数面报告 10 条 = 桌面族他档报告态〔非本批文件；A 单 §5 记 1 条之差的成因未探〕）；③ 产品码 ∥ 其他档零触——本轮唯一新改档 = `PROVIDER.md`（`git status` 核对）。

**修正块补记（写面口径 · 2026-10-03 · eng-designer）**：上「③ 产品码 ∥ 其他档零触——本轮唯一新改档 = `PROVIDER.md`」句收窄——本席写面 = `PROVIDER.md` + 本批档 §2；`git status` 中桌面族 ∥ VSC 族在途改动系**并行在途实施**所写（本席零触），非本单写面。

**§2 修正块（#10 上抛一续 · ACP 面随 #841 收正 · 修正轮 #11 · 2026-10-03 · eng-designer）**

**来源**：父侧派单（#10 修正块 `:221`「连带（其他档零触 · 请父侧裁）」→ 父裁定 = 本席收正）。权威口径 = `PROVIDER.md:419-422`（name 面 ∥ 结构不全角归发送 ∕ 装配失败面）∥ `:436-437`（ACP 第四消费面注）∥ 本档 §2 修正块 `:202-227`。**产品码零触 ∥ 其他档零触**（写面 = `docs/cli/design/ACP-CLIENT.md` + 本批档 §2）。

**逐处改动（号 → 改动 file:line；行号 = 收正后现盘）**

主单四处：
1. `docs/cli/design/ACP-CLIENT.md:541-544`（§11.5 现状段）：「强绑 `defaultModel`」前提退场 ⇒ 统一解析 `resolveProviderPlan` 口径（任一渠道持 key ⇒ 核必选中 ⇒ 门**放行**；仅「无 provider/key」类 ⇒ `-32000`）。
2. `:558-566`（§11.5「同时修」门文案段）：「② 的判据·落点（… AC12 的载体）」⇒「判据拆分与门失败文案」；`ok` ∥ `keyPresent` ∥ `reason` 三行按实况收正（`reason` = name 面）；新增「#841 口径」行（`fallback` 放行 ∥ 协议面零提示行 ∥ 提示通道未决 ∥ ② 分支默认接线不可达）；删 ② 分支旧文案行（AC12 `defaultModel` 点名句）。
3. `:593`（§11.7-4）：「① / ② 分流（② 必点名 `defaultModel`）」⇒ 门失败 = 「无 provider/key」一档 + `fallback` 放行（零提示行）。
4. `:649`（变更记录）：本收正 +1 行，「2026-09-18 批 AC12 随之失效」留痕（AC12 本体住 2026-09-18 批档 = 记录面，不改）。

邻域自查（同轮所及）：
5. `:162`（§4）：「两种情形 ①② … 点名 `defaultModel`」⇒ 单档（无 key ⇒ 指引）+ `fallback` 放行句。
6. `:553`（§11.5 裁定理由 2）：「D15 与下方 `defaultModel` 弱文案」⇒ 仅 D15（弱文案项随 #841 消解）。
7. `:368`（D17 行）：「D15 与 `defaultModel` 弱文案」⇒ 「D15（认证闩锁）」。
8. `:546`（§11.5 漂移面括注）：修订式残句「旧写的行号不再适用」删净（用户 2026-09-18 裁定项 · 一致性面——同轮所及）。
9. `:567`（§11.5 装配后检查行）：「门拦的是『key 缺失 / `defaultModel` 不可解析』」⇒ 「无 provider/key」；结构不全角明写归发送 ∕ 装配失败面（与 `PROVIDER.md:419-422` 互洽）。

**验收对照（本轮）**：① 主单四处 + 邻域五处收正、读回（D6）= 在盘（上列行号即读回后现盘）；② 旧表述清零——本档实跑 grep：`强绑` ∥ `必点名` ∥ `点名…defaultModel` ∥ `弱文案` ∥ `AC12`（除变更记录行）∥ `① / ②` 全零命中；全仓残余仅记录面（2026-09-18 批档 `:24`/`:330` ∥ 本批档 `:221`——历史在案）；③ `node scripts/doc-check.mjs` = **EXIT 0**（「OK(锚): 0 条悬空」∥「OK(行宽): 源域全部 .md 无 >300 字符单行」；行数面 = 报告态 11 条）；④ 变更记录 +1 行在盘。

**非射程发现（报父侧）**：① 需求档 `docs/cli/requirements/ACP-CLIENT.md:84`（R-A5.6 第二半句「key 在位而 `defaultModel` 不可解析 ⇒ 点名 `defaultModel`」）= 同源旧表述活体残留——需求笔权 = 主 agent，建议收口时收正；② 观察（报告面）：`ACP-CLIENT.md:602-603`（§11.8 回归面）所引 `thincoder-cli/test/acp-channel.test.mjs` ∥ `test/manifest-flip-refusal.test.mjs` 全仓无档（glob 实核）——doc-check 列「迁移期引文」类（不入闸）；非本单面，未动。

**零改面**：产品码 ∥ 其他设计档 ∥ 需求档——零触。

**§2 修正块（#841 实施后回填轮 · 行数账按盘回归 + 实施轮文档漂移收正 · 修正轮 #12 · 2026-10-03 · eng-designer）**

**来源**：父侧派单（三单实施终态 clean 后 · 收口前文档层收齐）——① 行数账（doc-check 行数面实跑）② B 单报文档漂移四处 ③ ACP §11.8 死引两处（#21 上抛）④ C 单设计层两项 ⑤ 受影响表按盘回归 + 越层段四档续期。**产品码零触 ∥ 测试档零触 ∥ 零新语义。**

**逐条落位（行号 = 收正后现盘）**

**① 行数账（本批面 11 条——全数按盘落位）**：`SHELL.md:184`（`turn-input.mjs` **141 ⇒ 146**）∥ `IPC.md:352`（`ipc.mjs` **277 ⇒ 283**）∥ `SESSIONS.md:122`（`session-slots.mjs` **235 ⇒ 259**）∥ `SETTINGS.md:179`（`settings.mjs` **325 ⇒ 331**）∥ `SETTINGS.md:180`（`providers.mjs` **335 ⇒ 339**）∥ `SETTINGS.md:199`（`mount-settings-exits.mjs` **264 ⇒ 270**）∥ `CHAT.md:139`（`page-read.mjs` **278 ⇒ 280**）∥ `COMPOSER.md:142`（`mount-composer.mjs` **297 ⇒ 299**）∥ `COMPOSER.md:143`（`composer-wire.mjs` **266 ⇒ 276**）∥ `COMPOSER.md:144`（`composer-sync.mjs` **306 ⇒ 322**）∥ `RENDERER.md:330`（`store.mjs` **331 ⇒ 341**）。**计数口径注**：父侧列 11 条 + `mount-composer` 单列「另」 = doc-check 实跑 **12 条**之全数；非本批 1 条留报不改（`E2E-TESTING.md:249` `.gitignore` 8 ⇒ 9——既有在册线）。

**② B 单报文档漂移（四处——全数落位）**：`thincoder-vscode/AGENTS.md:92`（发射点 `settings.mjs:317` ⇒ **`:340`** + 载荷补 `status.providerState`（三态投影 + `keyOk := 非 invalid 类`——#841））∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md:434`（② 列 `settings.mjs:358` ⇒ **`:340`**；③ 列 `chat-messages.js:138` ⇒ **`:144`**；⑤ 列补载荷注）∥ `:417`（② 列 `panel-turn-stages.mjs:77` ⇒ **`:74`**）∥ `:423`（② 列 `:160` ⇒ **`:156`**）。

**③ ACP §11.8 死引注记（#21 上抛——取最小正确形）**：`docs/cli/design/ACP-CLIENT.md:602` 回归面两档标注**不在盘**（2026-09-28 测试树全清重置后——引文 = 迁移期引文类；判据原文保留为历史记录）。**不改指**——两档全仓零命中（glob 实核；`thincoder-cli/test/` 现仅 runner + smoke，无继任档）。

**④ C 单设计层两项（COMPOSER.md §2 本批注）**：(a) 行锚 `data-notice="provider-fallback"` **入注**（`COMPOSER.md:124`——行面项；与失败行锚 `send-failed` 分判——机检面）。(b) 第三刷新点句**收窄为实落写点三处**（`settings.mjs:230` ∥ `:330` ∥ `providers.mjs:181`——`COMPOSER.md:121`/`:126` ∥ `IPC.md:235-236`）。**二择一理由**：取「按盘回归」形（不取 `ask()` 边界句）——㈠ 盘上实落 = 显式三写点，无 `ask()` 边界聚合机制（写该形 = 新机制语义，与盘相抵）；㈡ 修轮零新语义 ∥ 产品码零触约束下，`ask()` 形等于把「集中化」写成设计义务（范围扩张）；㈢ 与既有「写点与 `meta` 同族」表述同形续用。

**⑤ 受影响表按盘回归（对 `:73-100` 表 · 「现行 ⇒ 预期」⇒「现行 ⇒ 实读（实施落盘）」；实读 2026-10-03 · 内容行数口径）**

- 行 1–17 逐行实读落值（「预期」= 设计预算，超 ∕ 欠预算如实照录）：`model-ref.mjs` 66 ⇒ **159**（≈150）∥ `config.mjs` 432 ⇒ **436**（≈444）∥ `session-lifecycle.mjs` 390 ⇒ **399**（≈400）∥ `tui/index.mjs` 246 ⇒ **263**（≈256）∥ `command-interactive.mjs` 186 ⇒ **196**（≈191）∥ `panel-turn-stages.mjs` 250 ⇒ **246**（≈243）∥ `presets.mjs` 198 ⇒ **192**（≈192）∥ VSC `settings.mjs` 370 ⇒ **391**（≈378）∥ `chat-messages.js` 264 ⇒ **265**（≈270）∥ `ui.js` 222 ⇒ **241**（≈235）∥ `zh ∥ en.json` 各 276 ⇒ **278**（278）∥ `turn-input.mjs` 119 ⇒ **146**（≈125）∥ `session-slots.mjs` 235 ⇒ **259**（≈245）∥ `ipc.mjs` 276 ⇒ **283**（≈278）∥ `composer-wire.mjs` 262 ⇒ **276**（≈268）∥ `composer-sync.mjs` 302 ⇒ **322**（≈312 ⇒ 更正 ≈308）∥ `store.mjs` 331 ⇒ **341**（≈335）。
- 表外披露件（随表补录）：`mount-composer.mjs` 297 ⇒ **299** ∥ `page-read.mjs` 278 ⇒ **280** ∥ 桌面 `settings.mjs` 325 ⇒ **331** ∥ `providers.mjs` 335 ⇒ **339** ∥ `mount-settings-exits.mjs` 264 ⇒ **270**；批内件 `2026-10-03-provider-invalid-unify.test.mjs` ≈180 ⇒ **320**。
- 行 18–22（设计档五档）实读：`PROVIDER.md` 495 ⇒ **571**（≈555）∥ `SESSION.md` 1273 ⇒ **1284**（≈1276）∥ `WEBVIEW.md` 800 ⇒ **814**（≈811）∥ `COMPOSER.md` 267 ⇒ **283**（≈277；本轮回填后）∥ `IPC.md` 509 ⇒ **526**（≈519；本轮回填后）。
- 行 23（`API-CONTRACT.md` 生成区重跑 = U-6）= **父侧动作在途**（未跑——原判照旧）。
- 越层段四档续期（`docs/desktop/design/PROJECT.md` §4.1）：`composer-sync.mjs` **322** ∥ `store.mjs` **341** ∥ `settings.mjs` **331** ∥ `providers.mjs` **339**（各携前读链；均非结构性触碰 ⇒ **续期**）+ 贴层段新入册 `mount-composer.mjs` **299**（+1 行即越线）。

**盘读更正（报父侧）**：`panel-turn-stages.mjs` 内容行实读 = **246**（`countContentLines` 同口径双读；与「行移 −4」自洽）——B 单 §5 自报 247 系笔误（父侧派单沿用）；本轮回填取盘读 **246**。

**非射程观察（报父侧 · 未改）**：`WEBVIEW-PROTOCOL.md` §12 表三行重锚后仍存**表级陈旧坐标**（非 #841 面 ∥ 非本单射程）：如 `error` 行 ③ 列 `:105`（实读 `:108`）∥ `busyQueued` 行 ③ 列 `:102`（实读 `:105`）∥ `agentSettings` 行 ③ 列 `:156`（实读 `:159`）——表级全量重锚宜另立一轮（提取器 `protocol-coverage.test.mjs` 随测试树重置退场 ⇒ 今为手维）。

**验收读数（本轮实跑）**：① `node scripts/doc-check.mjs` = **exit 0**（`OK(锚): 0 条悬空` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行`；行数面 **1 条** = `E2E-TESTING.md:249`（非本批——留报）；本批 11 条全数消解）；② 逐条读回在盘（上列行号 = 收正后现盘）；③ 读回自纠两件：三处变更记录行初写用短名 `settings.mjs:NNN` ⇒ 锚面悬空 3 条 ⇒ 改全路径后锚面回零；`COMPOSER.md:123` 初写超宽（357 字符）⇒ 折行后回线。

**零改面**：产品码 ∥ 测试档 ∥ 需求档 ∥ #7–#11 已收正面 ∥ 非本单点名档——零触。写面 = 设计档 10（`SHELL` ∥ `IPC` ∥ `SESSIONS` ∥ `SETTINGS` ∥ `CHAT` ∥ `COMPOSER` ∥ `RENDERER` ∥ desktop `PROJECT` ∥ `WEBVIEW-PROTOCOL` ∥ `ACP-CLIENT`）+ `thincoder-vscode/AGENTS.md` + 本批档 §2。

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

### 轮次 2（评审子代理）

**轮次 2 核验（修正轮 #9 修复声明逐条 · 对现盘全文重读）**

> 限制：本轮不读码——码面 / 行数真值标 unverified（可从在档交叉者已核）；无项目标准档声明 ∥ 无文档地图 ⇒ 方法论合规按项目既有惯例判、文档归属按 D2 惯例判。

| # | Orig# | 文件 | 级别 | 状态 | 核验（现盘引文） |
|---|---|---|---|---|---|
| 1 | 1 | SESSION.md | 🔴 | Fixed | D-S4 触发收正为 invalid 类并明写 fallback 径：「遇 **invalid 类**（无 provider/key——不可运行）⇒ `console.error` 可读消息 + `exitSoon(1)`（不弹 UI、明确退出码）；**`fallback`（无有效 defaultModel 但可运行）⇒ stderr 一行明示 + 继续运行**（不退出——D-S2 同态同解）」（`SESSION.md:206`）；TUI 路径改 `state === "invalid"`（`:199`）；CLI invalid 格补 headless（`PROVIDER.md:429`）——D-S2 ∥ D-S4 ∥ 批档 R3 三处同解、无残冲突。 |
| 2 | 2 | PROVIDER.md | 🟡 | Fixed | 断言①两腿钉定：「**运行面** = 三端同喂**同一假槽**…按 `{state, source, channel, model, provider.name, provider.model}` **逐字段相等**」（`PROVIDER.md:435`）∥「**config 级**（`loadConfig()` 无槽入参…）= **只比 `state`**；含槽行（S9）单列口径…」（`:436`）——S9 行不再按字面必红。 |
| 3 | 3 | PROVIDER.md / SESSION.md | 🟡 | Fixed | `model=null` 词形补齐：「**明示词形随缺**——仅渠道名，见下表」（`PROVIDER.md:411`）∥ CLI 格「本次使用 `<渠道>[:<模型>]`——…（`model` 缺省 ⇒ 仅渠道名）」（`:429`）∥ 断言③补 null 档（`:437`）∥ SESSION fallback 词形同拍（`SESSION.md:202`）。 |
| 4 | 4 | PROVIDER / SESSION / WEBVIEW / COMPOSER / IPC | 🟡 | Fixed | invalid 类合成式成文（U-4 裁 = 两字段并存 + 成文）：「`state === "invalid"` ∨ `providerInvalidReason` 非空——…（三端同一合成式 · 单判据）」（`PROVIDER.md:419`）；载荷补 `invalidReason`（`WEBVIEW.md:200` · `IPC.md:233` · `COMPOSER.md:121`）；负向锁改「`ok` ∧ `providerInvalidReason` 空」（`PROVIDER.md:437` · `IPC.md:236` · `COMPOSER.md:122`）。 |
| 5 | 5 | WEBVIEW.md | 🟡 | Fixed | `keyOk` 判据钉定：「`keyOk := 非 invalid 类`（= `state !== "invalid"` ∧ `invalidReason` 空）——端侧布尔收正为**核态派生（单判据）**，去第二判据」（`WEBVIEW.md:204`）；三态 = state 单判据直映射（`:201-203`）。 |
| 6 | 6 | SESSION.md | 🟡 | Fixed | D-S1 就地改写：「运行时 provider = 统一解析（`resolveProviderPlan`）入选渠道；**不可运行 ⇒ 置空 `{}`** + `providerInvalidReason`」（`:197`）——修订式括注去净（`:197-198` 无「收正」残句）。 |
| 7 | 7 | COMPOSER.md / IPC.md | 🟡 | Fixed | 第三刷新点落「设置写回执」径：「**设置写回执**（`settings:agent` ∥ `provider:save` 成功回执——**第三刷新点**）」（`COMPOSER.md:121`）∥「设置面修好 `defaultModel` 后**即时**退场——不再等下次发送 / 开页」（`:124`）∥ IPC 投影注同拍（`IPC.md:235`「**第三刷新点（评审发现 7）**…即时刷新」）。 |
| 8 | 8 | 批档 | 🟡 | Fixed | 跟踪项处置：「U-1 ∥ U-5 ∥ U-6（§2 `:144-149`）——**派单时核销**（dependsOn ∥ 收口清单 ∥ 实施轮清单）；本轮零改」（`批档:184`）——协调项在册（非缺陷，随派单核销）。 |
| 9 | 9 | PROVIDER.md / SESSION.md | 🟡 | Fixed | 随动两处收正：§6.19 ⑤ 括注「VSC 独立实现」⇒「**核转口（#841）**」（`PROVIDER.md:297`）；§6.24 合并式补 key 门 + 模型面序（`SESSION.md:861`）∥ 边界情形 ② 补「槽渠道无 key」径（`:869-870`）；受影响表追加行 18/19 已登记（`批档:185`）。 |
| 10 | 10 | SESSION.md | 🔵 | Fixed | 槽值不迁移：「**槽无 key ⇒ 跳过（落 config 链——不把不可运行渠道钉进运行态；跳过不写槽——原槽值保留）**」（`SESSION.md:204`）；U-3 维持最小（父侧的裁在案，无桌面静置行新增）。 |
| 11 | 11 | WEBVIEW.md | 🔵 | Fixed | 两新键 zh ∥ en 钉定：「zh `⚠ 默认模型未设置或无效 — 正在使用可用渠道` ∥ en `⚠ Default model missing or invalid — using an available channel`」∥「zh `选择默认模型` ∥ en `Choose default model`」（`WEBVIEW.md:202`）。 |
| 12 | 12 | 批档 | 🔵 | Fixed | >300 免注口径成文：「「越层在册——续期」注**仅桌面族档行**适用…本批三档（`config.mjs` 432 ∥ `session-lifecycle.mjs` 390 ∥ `settings.mjs` 370）**免注**」（`批档:188`）。 |
| 13 | (宿主) | SESSION.md | 🔵 | Fixed | 引用重锚复核：`SESSION.md:201` = D-S2 invalid 门（合成式）∥ `:202` = fallback 词形行 ∥ `:869-870` = §6.24 边界情形②——旧⇒新映照（`批档:190`）与现盘逐条一致；旧 `:202`/`:870` 失锚两处消。 |
| 14 | (new) | 批档 | 🔵 | New：非阻断 | S10 随动计数漂移——修正块声明「矩阵**补 S10** = 渠道持 key ∧ 无 `defaultModel` ∧ 渠道无单值模型 ⇒ `fallback` + `model=null` ⇒ 词形仅渠道名」（`批档:179`），但验收行仍作「两态分界矩阵（S1–S9）逐行 `state` 断言」（`:111`）∥ 批内件声明仍作「S1–S9 夹具矩阵 + T1–T5」（`:132`）。建议实施轮按修正块行事（S1–S10）并同步两处计数句。 |

计数：14 行 = Fixed 13（前轮 12 项 + 宿主引用重锚 1 项）∥ 新增 🔵 1（#14，非阻断）；🔴 0 ∥ 🟡 0。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签 · 2026-10-03 14:4x）**

- **授权**：用户对 #841 链的既有授权（自动链；自缚三条 = 代签三条件 ∥ 新范围停 ∥ 破坏性停）+ 14:09「收口，剩下的自动跑完」。
- **三条件** ✓：① **评审 pass**——轮 1（`1🔴+8🟡+3🔵`）→ 修正轮 `#13` 全采收正 → **轮 2 = pass**（0 新 🔴；🔵 残留 1 = 非阻断）；② **修复落位 + 核验**——父侧抽验（🔴/关键 🟡 实读逐条相符）+ `doc-check` exit 0 + 三处引用重锚在盘；③ **无新范围**——12 条 + 重锚 + 顺笔，零新语义。
- **代签**：批准入实施。实施分三单（产品面 18 档 >15 ⇒ 按平台拆）：**A = 核 + CLI + 批内件**（`#17` 在跑）∥ **B = VSC** ∥ **C = 桌面**（B/C `dependsOn` A）。U-1 依赖已解（#840 落地 = `cf3ea937`）；U-6（`API-CONTRACT.md` 生成区重跑）= 实施后父侧直接执行；U-5（需求条目）= 收口时落。
- **凭据**（designToken/designId）= 运行时态，**不落档**。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-03 14:5x · A 单 = 核 + CLI + 批内件）**

**状态行**：实施完成（A 单 ∥ C 单（桌面面）已入档 · C 终态 clean（2026-10-03））

**范围**：批档 §2 受影响表行 **1–5 + 行 24**；B 单（VSC）∥ C 单（桌面）零触；设计档五档零触（产品码面）。

**逐号 → 改动 file:line（行号 = 落位后现盘）**

1. `thincoder-core/model-ref.mjs`（66 ⇒ **161**）：`:14-32` 档头消费面表随动；`:78-81` 新增 `hasKey`（「持 key」判据单源——apiKey trim 非空）；`:83-95` 新增 `resolveChannelModel`（模型面单值——VSC 转口面）；`:97-159` 新增 `resolveProviderPlan`（回退序三步 `:118-130` ∥ 模型面四步 `:132-133` ∥ 三态 `:135-137` ∥ reason 逐档 `:139-149` ∥ 返回面 `:151-158`）；`resolveRuntimeProvider` 档注补「#841 后由 `resolveProviderPlan` 取代」。
2. `thincoder-core/config.mjs`（432 ⇒ **436**）：`:16` 导入面 + `:26` 导出面增两名；`:328-339` 取值切换——`plan = resolveProviderPlan({ providers, defaultModel })` ∥ `merged.provider = plan.provider` ∥ `merged.providerState` ∥ `merged.providerStateReason` ∥ `providerInvalidReason` 语义不变（name 面判，文案源补 `plan.reason ??` 兜底）。
3. `thincoder-core/session-lifecycle.mjs`（390 ⇒ **400**）：`:22-23` 引入核单源；`:163-172` 槽面判据 = 统一解析第 1 步（在册门 + key 门——KD-841-2；零第二判据）；`:173-186` 槽值设 + 模型面序（`slotPlan.model` 单源：槽模型 → defaultModel 属本渠道 ⇒ 其模型段 → 渠道单值 → null）；`:187-210` 阈值重算 ∥ 档位块零改；`:212-214` 跳过径（落 config 链；不写槽——原槽值保留）。
4. `thincoder-cli/src/tui/index.mjs`（246 ⇒ **263**）：`:49-58` 档注重写；`:59-84` `promptProviderIfInvalid` 分流——invalid 类（合成式 `:64-66`：`state === "invalid"` ∨ `providerInvalidReason` 非空）⇒ picker + 取消提示行（`:71`，措辞 = 渠道 ∥ 密钥）；`fallback` ⇒ **不弹 picker** + 明示行（`:75-81`；词形「尚未设置默认模型：本次使用 \`渠道[:模型]\`——…」，`model` 缺省 ⇒ 仅渠道名）；`:238-241` 调用点注随动。
5. `thincoder-cli/src/command-interactive.mjs`（186 ⇒ **196**）：`:33-49` headless 分流——invalid 类（合成式 `:38-40`）⇒ `console.error` + `exitSoon(1)`（`:41-45`）；`fallback` ⇒ stderr 一行 + **继续运行**（`:46-49`）；`:128-131` TUI 路径前置清位收正为 `state === "invalid"`（D-S1）。
24. `docs/batches/2026-10-03-provider-invalid-unify.test.mjs`（新档 · **320** 行）：矩阵 S1–S10 `:66-76`（含 S10 = 修正块 `:179` 定义）；T1 `:115-158` ∥ T2 `:161-180` ∥ T3 `:183-260` ∥ T4 `:263-287` ∥ T5 `:289-317`；断言 A 两腿（config 级只比 `state`；运行面 = 三端同喂同一假槽 `{state, source, channel, model, provider.name, provider.model}` 逐字段）；三侧核实例逐设缝 `:43-52`（junction 不折叠 = 实读所得，逐侧 `_setConfigPathForTest`）。

**验收读数（本单实跑）**

- ① `node --test docs/batches/2026-10-03-provider-invalid-unify.test.mjs` → **T1–T4 全绿（pass 4 / fail 1）**。
  T5 唯一红点 = `:315`「panel-turn-stages 零自建扫描链（B 单）」——**预期红**（VSC 链收正属 B 单；同组前两组「VSC 回归对拍 S1/S2/S6」∥「CLI·桌面取值点唯一」已绿）。
- ② `node scripts/doc-check.mjs` → **exit 0**：`OK(锚): 0 条悬空` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行`；行数面 1 条报告 = `E2E-TESTING.md:249`（他档 Δ+1——非本批）。
- ③ 行数随动（现行 ⇒ 实际；批档「预期」列为设计预算，按盘回填如下）：`model-ref.mjs` 66⇒161（≈150）∥ `config.mjs` 432⇒436（≈444）∥ `session-lifecycle.mjs` 390⇒400（≈400）∥ `tui/index.mjs` 246⇒263（≈256）∥ `command-interactive.mjs` 186⇒196（≈191）∥ 批内件新档 320（≈180）。

**审计与代码评审轮次与终态**

- **内部探索分歧审计（只读 explore）轮 1**：发现 🔴 1（headless 门原用装配标记 `_providerInvalid`，非设计合成式 ⇒ S10 档误退出、fallback 明示不达）→ **已收正**（`command-interactive.mjs:38-45` 改合成式；批内件 T3 headless 腿断言随动 `:226-234`）；其余面（回退序 ∥ 模型面 ∥ 三态 ∥ reason ∥ `applySession` ∥ TUI 分流 ∥ 批内件可失败性）逐条抽检通过。
- **内部 advisor 代码评审（type=code）轮 1**：**VERDICT: pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 5）。已收正两条低成本项：`model-ref.mjs` `resolveRuntimeProvider` 档注补取代关系 ∥ 批内件 T2 清理面改 `resetConfigPaths()`（与 T3/T4 同式）。余项上抛（见下）。
- **终态 = clean**（审计 ∥ 评审均收敛；无 must-fix 残留）。

**上抛/待父侧与设计层处置（本单不触）**

1. 「invalid 类」第二腿归位差（advisor #1）：`PROVIDER.md:419` 明写「持 key 但结构不全」由 `providerInvalidReason` 归导引类，而核产者 `config.mjs:337` 为 name 面（具名渠道恒 null）⇒ 该档端面实际归发送失败面（实现侧注释 `tui/index.mjs:63` 与批内件 `:218`/`:224` 已按此钉死）。设计档收窄或改核载体二择一——归设计层/父侧裁。
2. ACP 面（CLI 第四消费面）未入本批明示表：`acp.mjs:41` 门判据随核取值切换对 S1/S2 档由「拒（携 reason）」变「放行」且无提示行；`docs/cli/design/ACP-CLIENT.md:541` 描述词随动。请父侧裁（本批三端明示表未列 ACP）。
3. #840 批内件三条读数腿（`docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs:89`/`:90`/`:105`）系旧读数，按本批 U-2 规应随本批收正——归属请裁。
4. U-6：`API-CONTRACT.md` 生成区未重跑（`:844` 导出清单缺 `resolveProviderPlan`/`resolveChannelModel`；`:1150` 仍列 `resolveRuntimeProvider`）——按 §4 属父侧动作。
5. 窄档（advisor #6）：入选条目无 `name`（手写配置）时 fallback 被判 invalid 类且明示行缺席——留观（本单不加新语义门）。

**§5 读回自纠（行数口径 · 2026-10-03）**：上「逐号」与「验收读数 ③」两处行数笔误——按盘**内容行**口径收正（与批档表同口径）：`model-ref.mjs` 66 ⇒ **159**（误记 161）∥ `session-lifecycle.mjs` 390 ⇒ **399**（误记 400）。余数复核无误（`config.mjs` 432 ⇒ 436 ∥ `tui/index.mjs` 246 ⇒ 263 ∥ `command-interactive.mjs` 186 ⇒ 196 ∥ 批内件新档 320）。

**§5 实施记录（eng-coder · 2026-10-03 15:3x · B 单 = VSC 面）**

**范围**：批档 §2 受影响表行 **6–11**（VSC 面七档）+ 表外接线一档 `webview/chat.js`（动作钮出口——`initMessageLoop` deps 注入 `openSettings`；**表外自报**）。
A/C 单写域 ∥ 设计档零触；批内件只跑不改（腿零删）。

**逐号 → 改动 file:line（行号 = 落位后现盘 · 内容行口径）**

- 行 6 `thincoder-vscode/src/extension/panel-turn-stages.mjs`（250 ⇒ **247**）：`:22-24` 导入面（+`loadRaw` +`resolveProviderPlan`；`providerNames` 退场）。
  链面 `:61-74` 改核调用（`slot` = 显式 `providerName` ∥ 槽复合——KD-841-5；`resolvedName = plan.channel`）；`:79-88` 早退/构建径词面不变（对象改 `resolvedName`）；`:92` ∥ `:101-102` 随动；`:42-44` ∥ `:50-51` 注。
- 行 7 `thincoder-vscode/src/extension/presets.mjs`（198 ⇒ **192**）：`:23` 导入 `resolveChannelModel`；`:103-111` `resolveDefaultModel` = 核转口（自持解析退场）。
- 行 8 `thincoder-vscode/src/extension/settings.mjs`（370 ⇒ **391**）：`:13` 导入 `loadConfig`；`:105-119` `providerState` 载荷（`{state, channel, model, reason, invalidReason}`——三键直读 + 入选渠道面）。
  `:334-341` `pushStatus`：`keyOk := 非 invalid 类`（单判据——去 configured 扫描）；`:362-366` `fullStatus` 探针门改核态（表外列点——行为等价，见 D1）。
- 行 9 `thincoder-vscode/webview/chat-messages.js`（264 ⇒ **265**）：`:6` ∥ `:46` ∥ `:52` deps 面（+`openSettings`）；`:144-152` `providerStatus` case——三态横幅入口（`providerState ?? null`）。
- 行 10 `thincoder-vscode/webview/ui.js`（222 ⇒ **241**）：`:59-88` `showBanner(ctx, ps, onChoose)`——invalid 类合成式首支 ∥ fallback 支（新键 + 动作钮）∥ ok 支；`:53-58` 档注。
- 行 11 `thincoder-vscode/locales/zh.json` ∥ `en.json`（各 276 ⇒ **278**）：`:145` ∥ `:146` 两新键 zh ∥ en 字面 = 修正块 `:187` 钉定值逐字。
- 表外 `thincoder-vscode/webview/chat.js`（138 ⇒ **142**）：`:133` deps 增 `openSettings`（缺 ⇒ 动作钮空转——必要性实读）；`:126-129` 注随动。

**验收读数（本单实跑）**

- ① 批内件整档：`node --test docs/batches/2026-10-03-provider-invalid-unify.test.mjs` → **T1–T5 全绿（pass 5 / fail 0）**——T5-③（VSC 零自建扫描链 + 核转口）转绿（A 单遗留唯一红点销账）。
- ② 语法闸：`thincoder-vscode` `node scripts/check-syntax.mjs` → **134 档 OK**；仓根 `node scripts/doc-check.mjs` → **exit 0**（锚 0 悬空 ∥ 行宽 OK；行数面 10 条 = 报告态）。
- ③ VSC 行为探针（temp 区件 `b-vsc-probe.mjs`——保留供复跑）：载荷 + keyOk（S1/S3/S4/S5 真模块 + 临时 config 缝）∥ `resolveDefaultModel` 与旧内联式 12 例逐例等价 ∥ `showBanner` 三态 + 钮（happy-dom + 真 locales 字面）→ **三面全绿**。
- ④ 行数随动（现行 ⇒ 实际；「预期」= 设计预算）：6⇒247（≈243）∥ 7⇒192（≈192）∥ 8⇒391（≈378）∥ 9⇒265（≈270）∥ 10⇒241（≈235）∥ 11⇒278（278）。超预算两档 = 行 8（+13）∥ 行 10（+6）——按盘回填口径。

**审计与代码评审轮次与终态**

- 内部探索分歧审计（只读 explore）轮 1：**零码面偏离**（无 PARTIAL ∥ 无静默简化 ∥ 无越界）；4 条文档漂移只报不改（`thincoder-vscode/AGENTS.md:92` 🟡 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md:434` ∥ `:417` ∥ `:423`——归收口面）。
- 内部 advisor 代码评审（type=code）轮 1：**VERDICT: pass**（0 🔴；1 🟡（>300 软线——修正块 #12 已裁免注）∥ 3 🔵）；**fix round = 0**（无 must-fix）。
- **终态 = clean**。

**决策透明表（裁量留档）**

| # | 取舍 | 依据 / 处置 |
|---|---|---|
| D1 | `fullStatus` 探针门改核态（`providerState.state === "invalid"`） | 设计「去第二判据」明令（`WEBVIEW.md:204`）；语义等价（invalid ⟺ 全表无 key）；审计 A1，报明 |
| D2 | 动作钮 = `openSettings()` 字面（无段锚滚动） | `WEBVIEW.md:202` 字面；面板首卡 = providers、首行 = 默认模型行 ⇒ 开即达；审计 A2 |
| D3 | 载荷缺 ⇒ `keyOk=false` ∥ 横幅 invalid 类兜底 | 保守向；与 `settings.mjs:118` ∥ `ui.js:69` 注释互约 |
| D4 | 钮样式类 = `.key-btn`（非横幅族孤件 `.setup-btn`） | 功能零差；评审 #4 = 🔵 可选，留观 |

**§5 实施记录（eng-coder · 2026-10-03 · C 单 = 桌面面）**

**状态行**：实施完成（C 单 = 桌面面 · 2026-10-03）

**范围**：批档 §2 受影响表行 **12–17**；A 单（核 + CLI + 批内件）∥ B 单（VSC）零触；设计档五档零触（产品码面）。

**逐号 → 改动 file:line（行号 = 落位后现盘）**

12. `thincoder-desktop/src/main/turn-input.mjs`（141 ⇒ **146**）：`:32-34` `providerKindOf` ③ 判据换源（「渠表非空」⇒「有持 key 渠道」——`apiKey` trim 非空，与核 `hasKey` 同判）；`:117-120` 成功回执携 `providerState`（degraded 两支同携）；档注 `:45` ∥ `:20-22` 随动。
13. `thincoder-desktop/src/main/session-slots.mjs`（235 ⇒ **259**）：`:151-165` 新增 `providerStateOf`（三回执族同形载荷单源）；`:205-213` `pageHistory` 回执携 `providerState`（每次页读；配置不可读 ⇒ 键缺席 + `console.error`）。
14. `thincoder-desktop/src/main/ipc.mjs`（277 ⇒ **283**）：`:167-171` ∥ `:195-199` 两出口注面随动（`historyPage` ∥ `msgSend` 透传；第三刷新点注在档）。
15. `thincoder-desktop/renderer/composer-wire.mjs`（266 ⇒ **276**）：`:32` 引入；`:114-115`（sendDirect）∥ `:141-145`（healLate）∥ `:164`（sendQueued）三路成功回执落切片（键缺席 ⇒ 零写；失败径零叠加）。
16. `thincoder-desktop/renderer/composer-sync.mjs`（306 ⇒ **322**）：`:87-97` `providerNotice`（`fallback` ∧ 非 invalid 类；词 `composer.send.noDefaultModel` 逐字复用；ok ∥ invalid ∥ 未达 ⇒ 零行）；`:162-164` 带尾追加；档注 `:28` ∥ `:147-150` 随动。
17. `thincoder-desktop/renderer/store.mjs`（331 ⇒ **341**）：`:99` `providerState` 切片（初值 `null`）；`:257-264` 新增纯动作 `setProviderState`。

**第三刷新点（修正块 :183）+ 披露补件（out-of-list——交付必需，逐档报由）**

- `thincoder-desktop/renderer/page-read.mjs`（278 ⇒ **280**）：`:248-249` 页读回执 `providerState` 落切片——由：「渲染面落 store 切片（与 `meta` 同写点）」为设计明文（IPC.md:236）。
- `thincoder-desktop/src/main/settings.mjs`（325 ⇒ **331**）：`:39-42` 引入 `providerStateOf`；`:230` ∥ `:330` `settings:agent` 两写径成功回执携 `providerState`（写后核读）——由：第三刷新点主侧半（IPC.md:235）。
- `thincoder-desktop/src/main/providers.mjs`（335 ⇒ **339**）：`:37-39` 引入；`:181` `provider:save` 成功回执携 `providerState`——由：同上。
- `thincoder-desktop/renderer/mount-settings-exits.mjs`（264 ⇒ **270**）：`:32` 引入；`:82` ∥ `:140` ∥ `:155` 三写点落切片——由：第三刷新点渲染侧半（设置面修好 `defaultModel` 后即时退场）。
- `thincoder-desktop/renderer/mount-composer.mjs`（297 ⇒ **299**）：`:72-76` `COMPOSER_KEYS` 补 `providerState`——由：**审计轮 1 发现 🔴**（切片写被订阅门吞 ⇒ 重派生不达 ⇒「即时退场」不成立）；补键后闭环（smoke L10 复跑绿）。
- （临时件：`.thincoder/tmp/c841-smoke.mjs`——本单自检冒烟 10 腿，非交付面。）

**验收读数（本单实跑）**

- ① `node --import ./thincoder-desktop/test/rc-resolve.mjs .thincoder/tmp/c841-smoke.mjs` → **10/10 绿**（L1 投影 ∥ L2 页读两径 ∥ L3 kind 换源 ∥ L4 send 回执 ∥ L5 切片纯动作 ∥ L6 wire 落写 ∥ L7 明示行三分支+负向锁 ∥ L8 设置回执 ∥ L9 出口落写 ∥ L10 `COMPOSER_KEYS` 闭环）。
- ② `node --test docs/batches/2026-10-03-provider-invalid-unify.test.mjs` → **5/5 全绿**（B 单 VSC 已在盘 ⇒ T5 亦绿）。
- ③ `node --test docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs` → **3 绿 / 4 红**（红 = 旧读数，非新缺陷：T1 `:89/:90/:91/:96/:100/:105/:106/:117/:122` ∥ T3 `:200/:208/:213/:218` ∥ T5 `:332/:334` ∥ T7 `:427`；**写闸拒跨批写**——父侧直接执行，逐行收正清单随交付报告附）。
- ④ `node scripts/doc-check.mjs` → **exit 0**（`OK(锚): 0 条悬空` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行`；行数面 11 条报告行 = 本批改动面读数差，回填归文档层）。
- ⑤ `node --check`：改动 11 档全绿；靶向既有单测扫面（本单改动面）：连带红仅「旧回执形状断言」类（跨批归档件：`2026-09-29-send-busy-timing.test.mjs:102` ∥ `2026-09-29-parity-b8-ipc.test.mjs:80/:164` ∥ `2026-09-29-parity-b4-vsc-small.test.mjs:173/:213` ∥ `2026-09-28-tech-debt-closeout-r8.test.mjs:311` ∥ `2026-09-29-desktop-residuals-round3.test.mjs:661` ∥ `2026-09-29-missing-face-family.test.mjs:266/:288`——父侧处置）；其余红为既有漂移（逐类实核归因：非本单成因）。

**行数随动（现行 ⇒ 实际）**：`turn-input.mjs` 141 ⇒ 146 ∥ `session-slots.mjs` 235 ⇒ 259 ∥ `ipc.mjs` 277 ⇒ 283 ∥ `composer-wire.mjs` 266 ⇒ 276 ∥ `composer-sync.mjs` 306 ⇒ 322 ∥ `store.mjs` 331 ⇒ 341 ∥ `page-read.mjs` 278 ⇒ 280 ∥ `settings.mjs` 325 ⇒ 331 ∥ `providers.mjs` 335 ⇒ 339 ∥ `mount-settings-exits.mjs` 264 ⇒ 270 ∥ `mount-composer.mjs` 297 ⇒ 299（末档为主档外披露补件）。（设计「预期」列 = 设计预算；越 300 四档皆已在册——续期。）

**审计与代码评审轮次与终态**

- **内部探索分歧审计（只读 explore）轮 1**：发现 🔴 1（第三刷新点重派生未闭环——`COMPOSER_KEYS` 无 `providerState`；设置写落切片被订阅门吞）→ **已收正**（`mount-composer.mjs:75` 补键；smoke 新增 L10 闭环腿复跑绿）；其余面（行 12–17 ∥ 载荷五键 ∥ invalid 合成式 ∥ 负向锁 ∥ `providerKind` 换源 ∥ out-of-list 四档一致性 ∥ 未声明改动普查）逐条抽检通过。
- **内部 advisor 代码评审（type=code）轮 1**：**VERDICT: pass**（🔴 0 ∥ 🟡 1〔文件规模——四档越 300 皆已在册：已裁债·可选不阻塞〕∥ 🔵 4〔新锚 `data-notice="provider-fallback"` 未入设计档 ∥ 第三刷新点消费面 3 处 vs 文档字面 ∥ key 三径 ∥ queued 径不携 `providerState`（设计射程内）∥ 写径三次 `loadConfig()`〕）。无 must-fix；余项上抛。
- **终态 = clean**（审计 ∥ 评审均收敛；must-fix 零残留）。

**上抛/待父侧与设计层处置（本单不触）**

1. **#840 批内件收正**（顺笔增项 (1)）：跨批写闸拒绝（本席绑定 #841；不绕闸）——父侧直接执行；逐行清单（file:line ∥ 旧断言 ∥ 新断言 ∥ 依据）随交付报告附全。
2. 设计层两项：① 新行锚 `data-notice="provider-fallback"` 宜入 `COMPOSER.md` §2 本批注（机检面）；② 第三刷新点设计句「设置写回执（`settings:agent` ∥ `provider:save` 成功回执）」宜收窄为实落三写点（或实现侧收至 `ask()` 边界——留设计裁）。
3. 设计射程确认：`provider:setKey` ∥ `provider:delKey` ∥ `provider:setProxy` 亦翻三态（key 门）但不携 `providerState`；queued 径同（合 IPC.md:122 枚举）。如需即时，key 三径补同字段（回执内字段——零新通道）。
4. 既有（非本单）靶向红：`tech-debt-closeout-r7` ∥ `hatch-clearance-2` ∥ `b10-ui-w2/w3` ∥ `b8-ipc`（计数/冻结/视图漂移类）等跨批归档件——未逐条处置（另案）。
5. 行数面：越 300 四档（`composer-sync.mjs` ∥ `store.mjs` ∥ `settings.mjs` ∥ `providers.mjs`）= 在册续期；`mount-composer.mjs` 299（贴层——+1 行即越线，下批触碰时登记）。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-03 15:5x）**

> **收口判词：已收口 2026-10-03**（设计评审 pass → 修正轮 → 代签 → 实施 A/B/C 三单 → 父侧核验 → U-6 → 本节核销 → 签入）

- **交付判据链**：轮 1 评审（`1🔴+8🟡+3🔵`）→ 修正轮全采 → **轮 2 pass** → §4 代签 → 实施（产品面 18 档 >15 ⇒ 按平台拆三单：**A** 核+CLI+批内件 ∥ **B** VSC ∥ **C** 桌面；B/C `dependsOn` A）→ 设计修正轮 `#10`（name 面收窄 ∥ ACP 边界明写）→ `#11`（ACP-CLIENT 四处）→ `#12`（实施后回填）。
- **实施终态**：三单全 **clean**（各：内部审计 + 代码评审 pass，0🔴）；批内件 `docs/batches/2026-10-03-provider-invalid-unify.test.mjs` = **5/5 全绿**（T5 红腿随 B 转绿销账）。
- **父侧核验读数**：`#840` 批内件 = **7/7 全绿**（父侧直接执行 12 处收正——写闸跨批拒绝，未绕闸；照 C 单逐行清单落笔）；**回执连带 6 档归档件逐处收正**（send-busy 带钩复跑 **13/13** ∥ b4-vsc T11/T12 ∥ missing-face ×2 ∥ r8 ∥ residuals 收正行）——本批连带红**零残留**；`API-CONTRACT.md` **U-6** 生成区重跑（2837 条整区替换）；`doc-check` exit 0（行数面余项 = 非本批 1 条）。
- **设计档回填（`#12`）**：行数账 12 条按盘回归 ∥ B 报漂移 4 处 ∥ ACP 死引 2 处标「迁移期引文」（零继任档，不改指）∥ C 设计层两项（行锚入注 ∥ 第三刷新点收窄为实落三写点——取「按盘回归」形）∥ 批档 §2 全表回归 + 越层段续期 + 十档变更记录。
- **挂账（在册）**：`#843`（ACP 协议面提示通道——条件）∥ `#844`（归档件存量红另案：`residuals-round3` ⑰①④⑩–⑭ ∥ `b8-ipc` ①②③⑤——条件）∥ `#845`（`WEBVIEW-PROTOCOL` §12 表级坐标陈旧——条件）。
- **用户门**：发布（**0.10.2**——按 2026-10-03「**一体发布**」裁定（`RELEASE.md` §5.8），三端 + 官网同轮；发布清单呈批中）。
- **结算**：交付完成 ∥ 台账 `#841` 核销 ∥ 双远端签入。
