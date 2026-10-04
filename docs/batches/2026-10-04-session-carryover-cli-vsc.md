# 2026-10-04 · CLI ∥ VSC 会话选定写回 + 反向句收正
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 11:03「要」（承 11:02「#883是啥事儿？」+ 父侧解释与「另批」建议）——CLI ∥ VSC 推广「会话选定写回 ⇒ 新会话起点自动采用上次选择」（同 #880 判据）+ 两端反向句与文案同拍收正。
> 台账 = #883（core · 归批）。前情 = docs/batches/2026-10-03-default-model-carryover.md §1（已收口 2026-10-04）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 11:0x · 主 agent）**：**来源** = 用户 11:02「#883是啥事儿？」+ 11:03「要」（承 #880 批设计轮上抛 U1）。**条目** = ① **两端落地「会话选定写回」**（用户显式选定 ⇒ config `defaultModel` 同拍写回——判据单源 = `docs/core/design/SESSION.md` §6.21 判据句 6；与桌面 #880 同判据）；② **两端反向句 / 文案同拍收正**（CLI `thincoder-cli/src/tui/model-picker.mjs:221` ∥ VSC `thincoder-vscode/src/extension/panel-messages.mjs:230`——对齐 #880 桌面已落形：实变判据 ∥ 覆盖式 ∥ 失败不反扑）。**授权口径** = 全链（设计 → 用户点火评审 → 批准 → 实施；每步停走）。**设计轮已派**（eng-designer · #3）；落定核读 ⇒ 候用户点火评审。**台账** = #883（在途 · task_book 已锚本档）。

**父侧处置（2026-10-04 11:2x · 设计轮交回）**：**核读** = 全过（§2 :12–116 三块齐 ∥ 判据句 6 尾句 `SESSION.md:740-742` ∥ 两端写面单点（`config-helpers.mjs` ∥ `settings-panel-write.mjs:184` 在盘）∥ 文案清册 14 处逐处对读）。**U2 裁定** = 需求卷落点：**零新行**——CLI ∥ VSC 需求卷无对应行为行可收正（实读扫零；反向句类全文扫 = 零命中——无矛盾面）；跨端推广落批指针已补入 `docs/desktop/requirements/COMPOSER.md` D6 行尾 + 变更记录（父侧直接执行 · 可 revert）。**U3 采纳** = 保守判（空槽窗口 ⇒ 零写回——与边界表「无槽面 ⇒ 无判据」同源；窗口内写回不立）。**U4 已就地修**（父侧直接执行）：`WEBVIEW-PROTOCOL.md:520` 坐标 `:212` ⇒ `:229` + 该行注补 §4.10 指针。**状态** = 候用户点火评审。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 + 评审 §3 轮次 1 修正轮（发现 1–4）均已落位；产品码归实施轮）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-04 · initial 轮）**

**本批条目（覆盖 · 台账 #883 · 用户 2026-10-04 11:03「要」——#880 判据推广落地令；另批不并入 #880 已收口批）**

- **R1 · CLI 端选定写回**：CLI 会话内用户显式选定模型（picker `switch` ∥ `/model provider:model` 直参——同一 `selectModel` 漏斗；会话级模型面**实变**）⇒ 同拍写回 config `defaultModel = "<provider>:<model>"`（覆盖式——「上次选择为准」）。
- **R2 · VSC 端选定写回**：VSC 面板下拉显式选定（`selectModel` 消息；**写前读**槽复合基线实变）⇒ 同拍写回 `defaultModel`。
- **R3 · 触发判据（负向锁 · 两端同判据句 6）**：系统同步写（会话切换 ∥ 候选推送回声 ∥ 空槽首回合播种）**不写**；复合等值（重选当前 ∥ `defaultModel` 现值同串）**零写**；写回失败**不反扑**会话写（槽 ∥ 内存照旧；记错零静默）。
- **R4 · 端差成对定形**：写后探 ∥ 刷新点逐端（VSC = 复用 M9 探 + `_pushStatus`；CLI = 明书差异不设——无消费面）；桌面（#880）面零触。
- **R5 · 反句与文案同拍收正**：两端代码反句 + CLI 用户可见文案（4 处）+ 设计档（2 处）——逐处 file:line 与改文在收正清册（实施轮执行）。
- **R6 · 测试面**：批内件两端可机判腿（选定 ⇒ 实写 ∥ 回声零写 ∥ 新会话起点采用——先红后绿两相）。

**设计档落点**（机制单源 = 判据句；本批已落笔 · 产品码零触）：
- `docs/core/design/SESSION.md`：§6.21 判据句 6 尾句三端落地收正 + 边界表补「槽写未发生 ⇒ 零写回」行 ∥ 失败行端差明书 + 验收回指 ⑤ 三端批号 + §6.8 D-S2 提示行文案 + §5 落点指针 + 变更记录；
- `docs/core/design/PROVIDER.md`：§6.22 三端明示表 CLI 行 `fallback` 格字面收正 + 变更记录；
- `docs/cli/design/TUI-COMMANDS.md`：§5.3 增 `/model` 条（端侧契约）+ 变更记录；
- `docs/vsc/design/WEBVIEW.md`：新增 §4.10（会话模型选定写回——VSC 端契约）+ §4.8 动作落点行收正 + 变更记录。

**机制设计（判据句 = `SESSION.md` §6.21 判据句 6——本批零改判据本体，只补三端落地与端差）**

- **CLI 数据流**：`selectModel(item)`（picker ∥ `cmd-model.mjs` 直参同漏斗）⇒ 写前读 `loadSlotFile(agent.cwd, agent._slot)`（`_slot == null` ⇒ `null`）⇒ 内存态写（`activeProvider/activeModel`）⇒ `saveSession(agent)`（槽写照旧）⇒ 槽面实变（复合串 `provider:model` 变化；档缺 ⇒ 真）⇒ 写回单点 `carryoverDefaultModel({ provider, model, slotBefore })`（`config-helpers.mjs` 新导出——**定序 = 槽先配置后**）⇒ 成功 ⇒ 内存镜像 `agent.config.defaultModel`（/config 显示面新鲜——沿 `wizard.mjs:210-211` 先例）；失败 ⇒ `console.error` 不反扑。
- **VSC 数据流**：webview 下拉选定 ⇒ `selectModel` 消息 ⇒ 写前读 `loadSlot(cwd, slot)`（既有面——槽复合基线）⇒ `_saveLines(..., { activeProvider, activeModel }, slot)`（槽写照旧）⇒ 槽面实变 ⇒ 写回单点 `carryoverDefaultModel({ provider, model, slotBefore })`（`settings-panel-write.mjs` 新导出——经 `vscPersistRaw`）⇒ 成功 ⇒ `probeDefaultModelChannel(composite)`（复用 M9 写后探）+ `panel._pushStatus()`（providerStatus 重推——`fallback` 横幅即时退场）；失败 ⇒ `console.error` 不反扑。
- **写回单点（两端各一 · 同形）**：`carryoverDefaultModel({ provider, model, slotBefore })`——① 槽面门（`slotBefore` 复合串 = 选定复合 ⇒ 零写——回声 ∕ 重选）；② 等值门（现值同串 ⇒ 零写——防盘面抖动 ∥ 探针空转；现值读面：CLI = `loadConfig().defaultModel` ∥ VSC = `loadRaw().defaultModel`）；③ 写（CLI = 核 `writeConfigAtomic` + `_configPath()` ∥ VSC = `vscPersistRaw`——`$schema` 注入保持）；④ try/catch 不抛（畸形档 ∥ 写错误 ⇒ `{ ok:false, reason }`）。返回 `{ ok:true, written:boolean }` ∥ `{ ok:false, reason }`。
- **回声/系统写零写（两端同判）**：CLI——回声源 = `/model p:m` 重发同值（槽面未变）；恢复 ∥ 切换 ∥ 首跑播种不经 `selectModel` ⇒ 零触。VSC——回声源 = `models` 推送 → `handleModelsMessage` 自动同值回写（槽面未变）；首回合空槽播种（`resolveTurnModelAndStamp` → `saveLines`）不经消息 ⇒ 零触。
- **被否（本批）**：复用桌面 IPC 形态（两端无 IPC 面——同进程 ∥ 扩展进程直写）；核面落写回（「端侧各自实现、判据单源」既定——核 `model-ref.mjs` 零触）；写回门挂核 `saveSession` ∥ `_saveLines`（核函数 ∥ 高频保存面——触面远大于本需求）；CLI 强设写后探（无消费面 = 死代码）。

**关键决策（KD-883-1–4）**

- **KD-883-1 门内聚**：两门（槽面实变 ∥ 复合等值）落写回单点自身——桌面形态的「实变回执」由 `writeSlotPrefs` 给出；CLI `saveSession`（核）∥ VSC `_saveLines`（高频保存面）均无此回执且不宜改 ⇒ 门住新单点，比较单元（复合串）构造单源。被否：call-site 各算复合串（比较单元双写）。
- **KD-883-2 触发支 = 既有显式入口单点**（CLI `selectModel` ∥ VSC `selectModel` case）——零新增入口、零协议改（VSC 零新消息 ∥ CLI 零新命令）。
- **KD-883-3 端差成对定形**：写后探——VSC 复用 M9（`probeDefaultModelChannel`）∥ CLI 明书不设（无准入展示面）；刷新点——VSC `_pushStatus`（#841 即时退场同判）∥ CLI 内存镜像（/config 面新鲜）；回执——两端无（桌面回执 `providerState` 面照旧）。
- **KD-883-4 失败 = 记错不反扑（三端同）**：CLI ∥ VSC `console.error`（沿各端既有点：VSC `panel-messages.mjs:251` ∥ CLI `tool-events.mjs` 同形）。

**受影响文件表（file:line 级 + 行数预算——口径 = 内容行数 · 实读 as-of 2026-10-04 设计轮；「预期」= 设计预算，实施轮按盘回填）**

| # | 文件 | 现行 ⇒ 预期 | 改动点 |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/model-picker.mjs` | **316 ⇒ ≈346** | 档头语义句（`:5-6`）∥ 反句（`:221/:232/:241`）收正；写前读 + 写回节（实变门 + `carryoverDefaultModel` + 记错 + 内存镜像——`saveSession` 后） |
| 2 | `thincoder-cli/src/tui/config-helpers.mjs` | **46 ⇒ ≈88** | 新导出 `carryoverDefaultModel`（两门 + 核 `writeConfigAtomic`/`_configPath` + catch 不抛）+ 档头一句 |
| 3 | `thincoder-cli/src/tui/cmd-model.mjs` | **25 ⇒ 25** | 档注（`:8`）+ 用法行（`:21`）收正 |
| 4 | `thincoder-cli/src/tui/index.mjs` | **263 ⇒ 263** | 提示行文案收正（`:71` ∥ `:79`——逐字见收正清册） |
| 5 | `thincoder-cli/src/command-interactive.mjs` | **196 ⇒ 196** | stderr 一行文案收正（`:48`） |
| 6 | `thincoder-cli/src/tui/wizard.mjs` | **246 ⇒ 246** | 引导文案收正（`:165`） |
| 7 | `thincoder-vscode/src/extension/settings-panel-write.mjs` | **184 ⇒ ≈226** | 新导出 `carryoverDefaultModel`（两门 + `vscPersistRaw` + `probeDefaultModelChannel` 复用）+ 档头一句 |
| 8 | `thincoder-vscode/src/extension/panel-messages.mjs` | **374 ⇒ ≈392** | 选定 case：实变门 + 写回调用 + `_pushStatus` + 记错（`:229-253`）；反句收正（`:230-234`）；import 一行 |
| 8a | `thincoder-vscode/src/extension/settings.mjs`（**实施轮表外补行——父侧小笔 · 2026-10-04 · 可 revert**） | **391 ⇒ 402**（+11） | 宿主簿记 `_lastPushedPrefs` + `lastPushedPrefs()`（`:348-353`）∥ 推送点记录（`:386-389`）——播种回声门簿记面（方案案择②在册） |
| 9 | `docs/core/design/SESSION.md` | **1299 ⇒ 本批已落实读** | §5 指针 + §6.8 文案 + §6.21（尾句 ∥ 边界表 ∥ ⑤）+ 变更记录（已落笔） |
| 10 | `docs/core/design/PROVIDER.md` | **587 ⇒ 本批已落实读** | §6.22 表 CLI 行 + 变更记录（已落笔） |
| 11 | `docs/cli/design/TUI-COMMANDS.md` | **213 ⇒ 本批已落实读** | §5.3 `/model` 条 + 变更记录（已落笔） |
| 12 | `docs/vsc/design/WEBVIEW.md` | **845 ⇒ 本批已落实读** | §4.10 + §4.8 动作行 + 变更记录（已落笔） |
| 13 | `docs/batches/2026-10-04-session-carryover-cli-vsc.test.mjs` | — ⇒ **新档 ≈160**（批内件——随批留存 ∥ 不进仓套件） | 用例见下 |

**零触面**：`thincoder-core/**`（`model-ref.mjs` 零改——fallback 解析链）∥ 桌面全树（#880 已收口）∥ VSC webview 全树（下拉 ∥ 忙态门零改）∥ 需求档全卷 ∥ 通道集 ∥ i18n 词表（横幅键 ∥ 标语零改）∥ 核 `saveSession` ∥ VSC `_saveLines` ∥ `/submodel`（`pickModelForSlot`——非会话模型面）∥ `/config → 默认模型`（显式默认口，语义零改）。

**批内用例设计（可机判 · 先红后绿可行 · 落点 = 批内件；运行 = 从仓根 `node --test docs/batches/2026-10-04-session-carryover-cli-vsc.test.mjs`）**

CLI 组（夹具 = 核 `_setConfigPathForTest`（临时 config）+ `_setSessionsDirForTest`（会话目录缝——#880 同款）+ 最小 `agent` 假体（providers ∥ cwd ∥ history）+ `createModelPicker` 桩 ctx + 真 `selectModel`）：
- **T-C1 选定写回正径**（红 → 绿）：`selectModel({ provider:"p1", model:"m2" })` ⇒ ① 读盘 `loadConfig().defaultModel === "p1:m2"`；② 槽 `activeProvider/activeModel` = p1/m2（槽写照旧）；③ `agent.config.defaultModel` 已镜像。**改前红**（写回未落 ⇒ ① 失败）。
- **T-C2 回声零写**：槽基线已 `p1:m1` ⇒ `selectModel({ provider:"p1", model:"m1" })` ⇒ ① config 内容字节不变（写前快照 compare）；② 槽写照旧。（改前亦绿——负控真值，在案。）
- **T-C3 新会话起点采用**：承 T-C1 ⇒ `loadConfig()` 运行时 `provider.name === "p1"` ∧ `provider.model === "m2"` ∧ `providerState === "ok"`（槽面无源 ⇒ `defaultModel` 档入选——核 `resolveProviderPlan` 实跑）。
- **T-C4 失败不反扑**：config 路径指向目录（写必失败）⇒ `selectModel` 零抛 ∧ 槽已写 ∧ `console.error` 记错（console 捕获断言）∧ 内存镜像不落（`ok:false` 径）。
- **T-C5 源判据（结构机检）**：`model-picker.mjs` 含 `carryoverDefaultModel` 调用 ∥ `config-helpers.mjs` 含两门判据（防「只活在本用例」——沿 #880 T7 先例）。

VSC 组（夹具 = 临时 config（`_setConfigPathForTest`）+ 直接驱动写回单点——`settings-panel-write.mjs` 为 vscode-free 模块，头注既定）：
- **T-V1 选定写回正径**（红 → 绿）：`carryoverDefaultModel({ provider:"p1", model:"m2", slotBefore:null })` ⇒ ① `{ ok:true, written:true }`；② 读盘 `loadRaw().defaultModel === "p1:m2"`；③ `$schema` 注入保持（在场）。
- **T-V2 回声零写**：`slotBefore = { activeProvider:"p1", activeModel:"m1" }` ∧ 选定 p1:m1 ⇒ `{ ok:true, written:false }` ∧ config 内容字节不变。
- **T-V3 等值零写**：`slotBefore = null` ∧ config `defaultModel` 已 = `p1:m2` ⇒ `written:false` ∧ 字节不变（防盘面抖动）。
- **T-V4 新会话起点采用**：承 T-V1 ⇒ 核 `resolveProviderPlan({ providers, defaultModel: loadRaw().defaultModel, slot: null }).channel === "p1"` ∧ 本端模型解析（`presets.mjs` `resolveDefaultModel`）⇒ `"m2"`。
- **T-V5 失败不反扑**：config 路径指向目录 ⇒ `{ ok:false, reason }` 零抛 ∧ 零进程抛。
- **T-V6 源判据（结构机检）**：`panel-messages.mjs` 选定 case 含 `carryoverDefaultModel` 调用 ∧ 传 `slotBefore`（写前读）——防「只活在本用例」。
- **回归面**：CLI 测试树零 `selectModel` 既有命中 ∥ VSC 两清单空（实读在案）⇒ 零回归面；批内件自体 = 唯一机检件；真机面（父侧闭合）= 两端各一次：选定 ⇒ 读盘 ⇒ 新开会话起点。

**验收对照（回指批单验收五条）**

- **① 批档 §2 逐端落（读回）** → 本节（append 后读回）。
- **② 反句与文案收正在案（逐处 file:line 与改文）** → 收正清册（下）。
- **③ 设计档随动落笔（读回）** → 设计档落点四条（已落笔 ∥ 读回在报告）。
- **④ `node scripts/doc-check.mjs` exit 0** → 自跑读数（报告面）。
- **⑤ §2 状态行更新（设计完成）** → batch status 工具（本节落定后）。

**收正清册（反句 ∥ 文案——逐处 file:line 与改文；实施轮执行）**

| # | file:line | 现行 | 改文 |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/model-picker.mjs:5-6` | 「selectModel 写**会话槽**（agent 内存态 + saveSession）——不写 config（/model 不再串扰全局默认——根治）。」 | 「selectModel 写**会话槽**（agent 内存态 + saveSession）；会话级模型面**实变** ⇒ 同拍写回 config.defaultModel（判据句 6——写面单点 = `config-helpers.mjs` `carryoverDefaultModel`；等值 ∕ 回声零写）。」 |
| 2 | `thincoder-cli/src/tui/model-picker.mjs:221` | 「F-3 /model 纯会话级：写槽（agent 内存态 + saveSession）——绝不写 config。」 | 「F-3 /model 会话级：写槽（agent 内存态 + saveSession）；选定实变 ⇒ 同拍写回 config.defaultModel（判据句 6——新会话起点随动；等值 ∕ 回声零写；写回失败不反扑会话写、记错零静默）。」 |
| 3 | `thincoder-cli/src/tui/model-picker.mjs:232` | 「// 内存态（agent 会话运行时）——不触碰 config」 | 「// 内存态（agent 会话运行时）——config 写仅经写回单点（下方实变节）」 |
| 4 | `thincoder-cli/src/tui/model-picker.mjs:241` | 「// 写会话槽（saveSession——槽双字段恒非空）——config 文件零写」 | 「// 写会话槽（saveSession——槽双字段恒非空）——写回单点在其后（槽先配置后）」 |
| 5 | `thincoder-cli/src/tui/cmd-model.mjs:8` | 「/model 是会话级操作（写槽——不写 config）——config 默认模型走 /config → 默认模型。」 | 「/model 是会话级操作（写槽）——选定实变即同拍写回 config.defaultModel（判据句 6——新会话起点随动）。config 默认模型显式设置走 /config → 默认模型。」 |
| 6 | `thincoder-cli/src/tui/cmd-model.mjs:21` | 「/model 用法: /model provider:model（会话级——config 默认走 /config → 默认模型）」 | 「/model 用法: /model provider:model（会话级——选定即成为默认模型）」 |
| 7 | `thincoder-cli/src/tui/index.mjs:71` | 「未配置有效渠道（渠道 ∥ 密钥缺位）：/config 设置渠道与密钥；/model 仅改本会话」 | 「未配置有效渠道（渠道 ∥ 密钥缺位）：/config 设置渠道与密钥；/model 选定后本会话生效并成为默认模型」 |
| 8 | `thincoder-cli/src/tui/index.mjs:79` | 「尚未设置默认模型：本次使用 \`…\`——/config → 默认模型 设置一次；/model 仅改本会话」 | 「…——/config → 默认模型 设置一次（或 /model 选定即成为默认模型）」 |
| 9 | `thincoder-cli/src/command-interactive.mjs:48` | 同 8 行字面（headless stderr） | 同 8 行改文（stderr 一字面） |
| 10 | `thincoder-cli/src/tui/wizard.mjs:165` | 「…新会话无起点：/config → 默认模型 设置一次（或 /model 仅改本会话）。」 | 「…（或 /model 选定即成为默认模型）。」 |
| 11 | `thincoder-vscode/src/extension/panel-messages.mjs:230-234` | 「selectProviderModel（config 写路径）已退役——选择不再串扰 config 全局。…」 | 「选定实变（槽面复合变化）⇒ 同拍写回 config.defaultModel（判据句 6——写面单点 = `settings-panel-write.mjs` `carryoverDefaultModel`；等值 ∥ 回声零写；失败不反扑）。旧 selectProviderModel 路径不复活。…（余句零改）」 |
| 12 | `docs/core/design/SESSION.md:204`（§6.8） | 「…（或 /model 仅改本会话）」 | 「…（或 /model 选定即成为默认模型）」（**本批已落**） |
| 13 | `docs/core/design/PROVIDER.md:444`（§6.22 表；**坐标收正——as-built 2026-10-04 · 父侧小笔**） | 同 12 行字面 | 同 12 行改文（**本批已落**） |
| 14 | `docs/vsc/design/WEBVIEW.md:205`（§4.8） | 「钮不开会话级模型菜单（写会话槽不修 `defaultModel`）…」 | 「…（会话级选定亦同拍写回 `defaultModel`——判据句 6；本钮仍指设置面）…」（**本批已落**） |

**扫过未改（核过——不含失效句，零改在案）**：`thincoder-cli/src/command-interactive.mjs:42`「或 /model 选择后以会话槽生效」（真值保持）∥ `thincoder-cli/src/tui/model-picker.mjs:207-219`（槽位面 `pickModelForSlot`——非会话模型面）∥ `thincoder-vscode/webview/` 全树（无「仅本会话」类可见句）∥ 归档档（`thincoder-cli/docs/design/_archive/MODEL-MERGE-SESSION.md` ∥ `thincoder-vscode/docs/_archive/**`——冻结档案，保留 ≠ 维护，零触）。

**上抛项**

- **U1 · §1 模板占位未填**：批头（来源 ∥ 台账行）与派发书已备本批事实；§1 正文仍为模板占位（`<§1 模板占位…>`）——请父侧按 D1 回填（笔 = 主 agent）；本侧按派发书 + 台账 #883 执行，未受阻断。
- **U2 · 需求卷条目**：#883 已在册（在途 · 板块 core）；需求卷正式条目落笔 = 主 agent（本批零触需求档）。
- **U3 · VSC 空槽窗口登记**：`_ensureSlot` 未解析窗口（`slot == null` 短路）⇒ 零写回（保守向——无槽面）；窗口内选定不进 `defaultModel`——如需窗口内也写回，另裁（本批判 = 保守）。
- **U4 · 观察（范围外 · 零触）**：`docs/vsc/design/WEBVIEW-PROTOCOL.md:520` `selectModel` 行坐标 `:212`（实读 `:229`——漂移非本批成因）；随该档下次触碰收正（在册）。

**§2 同轮附注（eng-designer · 2026-10-04）**：U1 已闭环——父侧同轮回填档头（`台账 = #883（core · 归批）`）与 §1 开批登记后，本 §2 append 于第二次尝试落定（首次尝试被骨架占位机械拒——零写入、零残留）；§2 状态行已随更新（设计完成）。

**§2 修正轮（评审 §3 轮次 1 · 发现 1–4 · 父侧裁定 = 全采纳）· eng-designer · 2026-10-04**

- **#1 · boot 播种径零写（机制定死）**：判零机制 = **宿主簿记**（候选族②——「最近下发 prefs」簿记判零）——推送侧（`settings.mjs` flush，沿 `_lastModelsPayload` 先例）记录**最近下发 prefs 复合**；写回单点 `carryoverDefaultModel` 增**播种回声门**（增参 `lastPushedPrefs` = 簿记读值；条件 = **槽基线档缺 ∧ 选定复合命中簿记** ⇒ 零写回——门内聚于单点，KD-883-1 同律）。择②之由：宿主侧单点（VSC 面内）∥ 可直驱机检；候选①（auto-apply 携来源标记）**否**——须触共享 render-core（`model-menu.mjs`）∥ 跨端面 ⇒ 超本批授权面（未扩域）。**跨端影响 = 零**：render-core ∥ CLI ∥ 桌面（#880 面）零触。已知边界：播种窗内重选播种同值 ⇒ 同判零（「重选当前 ⇒ 零写」族——判据句 6 自洽）。落点：`WEBVIEW.md` §4.10 写面单点行 + 回声句；`SESSION.md` §6.21 判据句 6（系统发起之写类目补 boot 播种径）∥ 边界表补行 ∥ 验收回指 ⑤ 随动。实施轮用例面随动：VSC 组增「播种回声 ⇒ 零写回」条（驱动 = `carryoverDefaultModel({ …, lastPushedPrefs })`——沿 T-V 族形）。
- **#2 · 坐标与描述收正**：`TUI-COMMANDS.md` §5.4 坐标终值 = `provider-admin.mjs:88` `removeProviderFlow` ∥ `:113` `setKeyFlow`（调用点 `model-picker.mjs:77`）；§1 `model-picker.mjs` 行括注终值 =「可 fetch `/models`；拉取失败 ⇒ 该渠道不可用——无预设回退」（择改不删——去伪「预设回退」，留候选面信息）。
- **#3 · 内引终值**：`WEBVIEW.md` §4.10 回声句内引 =（§4.2 ②）（`handleModelsMessage` 对应项）。
- **#4 · 清册坐标终值**：收正清册行 12（本档 :108）坐标 = `docs/core/design/SESSION.md:205`（§6.8——改文实文行；:204 = invalid 类行）。
- **号外观察（零触 · 候裁）**：`TUI-COMMANDS.md` §1 表 model-picker 行「+ `/model` Add / Remove / key 流程」仍归 model-picker——四流实居 `provider-admin.mjs`（structure-split-2 · 2026-09-29 迁出）；且该表无 `provider-admin.mjs` 行（结构性快照未随拆分回写）。本批逐号点修面外——未动，在册。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（#883 CLI ∥ VSC 会话选定写回批 · 设计评审）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | VSC 系统写零写枚举缺口——boot 播种径：`thincoder-vscode/src/extension/settings.mjs:375-378` 无槽复合时以 workspaceState prefs 兜底随 `models` 下发（`:383`），webview 侧 `applyModels` 命中即回写 `selectModel`（`thincoder-render-core/composer/model-menu.mjs:414-418`；M10 明载该形＝`docs/core/design/PROVIDER.md:258`）——该径经消息且槽面实变（「档缺 ⇒ 判真」＝`docs/vsc/design/WEBVIEW.md:219`），依本设计会触发写回（现值 ≠ 兜底串时）；批档 §2 回声句（`docs/batches/2026-10-04-session-carryover-cli-vsc.md:37`）与 `WEBVIEW.md:223` 只覆盖「同值回写（槽面未变）」径 | 在批档 §2 回声/系统写块与 `WEBVIEW.md` §4.10 回声句补该径（boot 播种 ⇒ 槽面实变 ⇒ 触发写回；值 = 最近使用 prefs），或按判据句 6「槽值未变之写」口径收正 R3 行并复核该径取舍 |
| 2 | Doc-state | 🟡 | `docs/cli/design/TUI-COMMANDS.md` 既有描述滞后（非本批成因——2026-09-29 provider-admin 结构拆分后未随动）：§5.4 `:152` 载「`thincoder-cli/src/tui/model-picker.mjs:374` `removeProviderFlow`」/「单一调用点 `:73`」——实为 `thincoder-cli/src/tui/provider-admin.mjs:88`（调用点 `model-picker.mjs:77`）；`:157` 载「`setKeyFlow`（`thincoder-cli/src/tui/model-picker.mjs:398`）」——实为 `provider-admin.mjs:113`（该档现 316 行，:374/:398 越 EOF）；§1 `:22`「可 fetch `/models`、失败回退预设」与实读不符（拉取失败 ⇒ `model-picker.mjs:197`「(no models — 该渠道不可用)」；无预设回退） | 按实读收正 §5.4 两坐标（`provider-admin.mjs:88` / `:113`；调用点 `model-picker.mjs:77`）与 §1 括注（改「拉取失败 ⇒ 该渠道不可用（无预设回退）」或删括注） |
| 3 | Clarity | 🔵 | `WEBVIEW.md:223` 内引「（§4.2 ①）」——§4.2 的 ① = 按钮点击、② = `models` 推送自动回写（`:111`）；`handleModelsMessage` 应对 ② | 内引改为（§4.2 ②） |
| 4 | Doc-state | 🔵 | 收正清册行 12（批档 `:108`）载「`docs/core/design/SESSION.md:204`（§6.8）」——该改文实文在 `:205`（`:204` = invalid 类行） | 坐标收正为 `:205` |

**抽核（第 8 条判据）**：受影响文件表 8 档行数与收正清册代码坐标 11 处逐处实读全对；写面原语在盘（`writeConfigAtomic`/`_configPath` ∥ `vscPersistRaw`/`probeDefaultModelChannel` ∥ `loadSlotFile` ∥ `loadSlot` ∥ `panel._pushStatus`）。

VERDICT: pass
计数：🔴 0 · 🟡 2 · 🔵 2

## §4 用户批准（主 agent）

**2026-10-04 12:18 父侧代签批准**（用户 12:18「都自动跑吧」——本会话全链自动授权：点火 ∥ 代签 ∥ 派发 ∥ 收口；经授权代签，非默认代签）。

**三条件核验**：① 评审 pass（#6 · 🔴 0 · 🟡 2 + 🔵 2 全数 Fixed/接受——裁定在册）；② 修正轮 #10 落地并经父侧逐处核验（§2 修正块 `:123-129` ∥ `WEBVIEW.md:220`（播种回声门 + `lastPushedPrefs`）∥ `:223-224` ∥ `SESSION.md:739/:757/:760`——实读）；③ token 已签发（运行态，不入档）。

**批准范围** = 本批全量（CLI ∥ VSC 会话选定写回 + 反句/文案 14 处 + 批内件两端腿）。派发 = 实施舱（eng-coder · initial）。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-04 · initial 轮）**

**状态行**：实施完成（initial 轮：两端写面单点 ∥ 文案代码 11 处 ∥ 批内件 11 腿（先红后绿）；偏离审计 ∥ 代码评审各 1 轮——终态 clean（评审 6 条全接受、零 must-fix））

**实施摘要**：两端「会话选定写回」落地（判据单源 = `SESSION.md` §6.21 判据句 6）+ 反句/文案**代码 11 处**逐字收正 + 批内件 11 腿（先红后绿）+ 宿主簿记 1 档（**表外**——修正块 #1「推送侧 `settings.mjs`」落点，随报表外）。

**改动清册（行数 = 内容行数口径（split 去文末空段——与设计轮「现行」同口径）；read 工具编号面 +1）**

| # | 文件 | HEAD ⇒ 现盘 | 改动点（file:line） |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/model-picker.mjs` | **316 ⇒ 325**（+9） | 档头语义句 `:5-8`；import（`loadSlotFile` + `carryoverDefaultModel`）`:19-20`；反句 `:223-224`；注释 `:237/:246`；写前读 `:235-236`；写回节 `:248-251`（调用 `:249` ∥ 记错 `:250` ∥ 内存镜像 `:251`） |
| 2 | `thincoder-cli/src/tui/config-helpers.mjs` | **46 ⇒ 79**（+33） | 档头一句 `:3-4`；新导出 `carryoverDefaultModel` `:49-71`（① 门 `:63` ∥ ② 门 `:64` ∥ 写 `:65` ∥ 不抛 `:68-70`）；`compositeOf` `:73-79` |
| 3 | `thincoder-cli/src/tui/cmd-model.mjs` | **25 ⇒ 26**（+1） | `:8-9` / `:22`（清册 #5/#6） |
| 4 | `thincoder-cli/src/tui/index.mjs` | **263 ⇒ 263**（±0） | `:71` / `:79`（清册 #7/#8） |
| 5 | `thincoder-cli/src/command-interactive.mjs` | **196 ⇒ 196**（±0） | `:48`（清册 #9） |
| 6 | `thincoder-cli/src/tui/wizard.mjs` | **246 ⇒ 246**（±0） | `:165`（清册 #10） |
| 7 | `thincoder-vscode/src/extension/settings-panel-write.mjs` | **184 ⇒ 219**（+35） | 档头一句 `:7-8`；新导出 `carryoverDefaultModel` `:188-211`（① `:201` ∥ ② 播种回声门 `:202` ∥ ③ `:203` ∥ 写 `:204` ∥ 写后探 `:206`）；`compositeOf` `:213-219` |
| 8 | `thincoder-vscode/src/extension/panel-messages.mjs` | **374 ⇒ 382**（+8） | import `:8-9`；case `selectModel` 写前读 `:249` / 写回 `:254` / 记错 `:255` / 刷新点 `:256`；注释收正 `:231-236`（清册 #11） |
| 9 | `thincoder-vscode/src/extension/settings.mjs`（**表外**——修正块 #1 点名） | **391 ⇒ 402**（+11） | 簿记 `_lastPushedPrefs` + 读口 `lastPushedPrefs()` `:348-353`；推送点记录 `:386-389` |
| 10 | `docs/batches/2026-10-04-session-carryover-cli-vsc.test.mjs`（新档·批内件） | — ⇒ **293 行** | 11 腿（CLI T-C1–C5 ∥ VSC T-V1–V6——播种回声腿 = T-V2 第二径） |

**红绿读数（先红后绿——同一命令：`node --test docs/batches/2026-10-04-session-carryover-cli-vsc.test.mjs`，仓根）**
- **红相（实施前）**：**1 通过 / 10 失败**——绿 = T-C2（负控——设计在案「改前亦绿」）；红 = T-C1/T-C3（读盘 `defaultModel` null ≠ "p1:m2"）∥ T-C4（无 `carryover failed` 记错）∥ T-C5（源判据缺）∥ T-V1–V6（`carryoverDefaultModel` 未导出 ∥ 源判据缺）。
- **绿相（实施后）**：**11/11 通过**（0 失败）。
- **自修 1 轮**（实施内）：首绿跑 T-C1/T-C3 双红——`_configPath` 自 `@thincoder/core/config.mjs` 取失败（该档未 re-export `_configPath`——仅 `config-io.mjs` 持有）⇒ 改双导（`loadConfig` ← config.mjs ∥ `writeConfigAtomic` + `_configPath` ← config-io.mjs；沿桌面先例 `thincoder-desktop/src/main/settings.mjs:32-33`）⇒ 全绿。

**验收读数（对照批单五条）**
- ① 批内件 11 腿全绿（上；红态读数在案）。
- ② `node --check`（经 lint 面）改动 9 产品档 ⇒ **9/9 `Syntax OK`**。
- ③ `node scripts/doc-check.mjs` ⇒ **exit 1**：唯一闸态失败 = `docs/cli/requirements/ACP-CLIENT.md:91（421 字符）`——**他批在飞未提交行**（`git diff` 该档 +4/−1，「R-A5.11」新增行 422 字符——非本批写域）；锚态 = `OK(锚): 0 条悬空`；全输出**零**「session-carryover」命中 ⇒ 本批**零新增闸态失败**（口径达标；字面 exit 0 因他批在飞不达——随报）。
- ④ `git status` 自证：写域恰 **10 档**（上表 1–10；表外 `settings.mjs` 已披露）；其余 M 项 = 他批在飞 / 设计轮已落笔（本席零触）。
- ⑤ 行数回填（上表）；vs 设计预算：四预算档**均低于**预算（model-picker −21 ∥ config-helpers −9 ∥ settings-panel-write −7 ∥ panel-messages −10）——行为面逐条核无缺件（判预算宽估；随报）。

**决策透明表**

| # | 决策 | 依据/说明 |
|---|---|---|
| 1 | 门内聚写面单点（call-site 零判据、零复合串） | KD-883-1（§2 `:42`）——两端各一 `compositeOf`（端侧各自实现、判据单源） |
| 2 | 非法入参早退 `{ ok:false, reason:"invalid model reference…" }` | 防御硬化（防半串写盘）；调用面已先拒空——非设计门，零行为面变化 |
| 3 | 内存镜像仅实写径（`written===true`） | 零写（回声 ∥ 等值）⇒ 盘未变，无条件镜像会造「显示与盘面不符」；等值径滞后窄面在册（评审 #5） |
| 4 | `settings.mjs` 表外改动 | 修正块 #1（`:125`）点名「推送侧 `settings.mjs` 记录最近下发 prefs 复合」——随报表外 |
| 5 | VSC 写后探仅实写径 | 「防探针空转」判据（§2 `:36`）——零写径零探 |

**实施期旁注（自披露）**：一次夹具探测经**旧** `persistRaw`（静态 `configPath`，不随核测试缝）误写真实用户 config（注入 `probe:1`）——已用核 `writeConfigAtomic` 就地删除还原（顶层键集复原；`defaultModel` 等原值未动；mtime 变动不可逆）；此事件即评审 #6 的现场证据。

**偏离审计 · 轮次 1**（内部 explore·只读）：DEVIATIONS 1（§5 未写——本轮随写落位）+ 记录面观察 2（受影响文件表缺 `settings.mjs` 行 ∥ 清册行 13 坐标 `PROVIDER.md:436` ⇒ 实文 `:444`）；设计元素逐条落位（零缺件/零静默简化）、11 处文案逐字、越表核 = 恰 10 档。

**代码评审 · 轮次 1**（advisor）：**VERDICT pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 4——全 report-only ∥ 存量债 ∥ 登记面，**无 must-fix**）。

**回应表（评审 6 条——全接受；修复轮 0）**

| # | 严重度 | 处置 | 说明 |
|---|---|---|---|
| 1 | 🟡 | 接受（登记不修） | 三档 >300 行（model-picker 325 ∥ panel-messages 382 ∥ settings.mjs 402——均 <500 硬线）= 存量体量债；拆分超本批授权面 ⇒ 随报父侧入册 |
| 2 | 🟡 | 接受（报而不改） | 批档受表缺 `settings.mjs` 行（修正块 #1 点名落点、实施实改）——§2 非本席写权，请父侧/设计笔回填 |
| 3 | 🔵 | 接受（报而不改） | 清册行 13 坐标回填 `:444`——同上，父侧笔 |
| 4 | 🔵 | 接受（登记） | 簿记扩展边界（跨面板陈旧；可达性 unverified——双向队列序论证回声通常先于下一次会话操作）⇒ 设计档边界行登记请父侧裁；代码零改 |
| 5 | 🔵 | 接受（不修·附由） | 现取法（仅实写径镜像）在回声径为避免「显示谎」的正确形；等值径滞后 = 显示面陈旧、非正确性；闭合需增读盘面 ∥ 改固定返回形（设计已定 `{ok,written}`）——超本批设计面，随报 |
| 6 | 🔵 | 接受（不修·附由） | `persistRaw` 与写回单点路径解析不一致（存量、本批零触该链；旁注即其现场证据）⇒ 另册（改 `_configPath()` 为行为微正但超批） |

**终态 = clean**（审计偏差随本节落位；评审无 must-fix；自修 1 轮在案）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（#883 会话选定写回（CLI ∥ VSC）——批链：设计 → 评审 #6（pass · 0🔴）→ 修正轮 #10（4/4）→ §4 代签（用户 12:18 授权）→ 实施 #16（审计无偏离 ∥ 代码评审 pass）→ 本节核销）

- **判据链**：批内件 11 腿 **先红 1/10 → 后绿 11/11**（父侧收口复跑：仓根 `node --test docs/batches/2026-10-04-session-carryover-cli-vsc.test.mjs` = **exit 0 · tests 11**）∥ `node --check` 9 档全过（席内读数）∥ as-built 行数：`model-picker.mjs` 325 ∥ `config-helpers.mjs` 79 ∥ `settings-panel-write.mjs` 219 ∥ `panel-messages.mjs` 382 ∥（表外）`settings.mjs` 402——四预算档均低于预算（预算 = 上界口径；行为面逐条核零缺件 ⇒ ±界内 ✓）。
- **收口测试行**：本批单元件 = `docs/batches/2026-10-04-session-carryover-cli-vsc.test.mjs`（293 行 · 11 腿 · 随批留存）；集成面 = 无新增 ∥ 无修订；仓套件 = 未跑（本批面 = CLI/VSC 产品码；仓 `test/` 树空清单（2026-09-28 重置后）——父侧批内件复跑为本批唯一运行）。
- **doc-check**：**exit 0**（父侧收口直跑：悬空 0）。实施舱报告的 exit 1 读数 = **折行前旧读数**（`docs/cli/requirements/ACP-CLIENT.md:91`——他批面，12:31 已归零）——更正在案。
- **真实 config 事件核验（承实施舱自披露）**：夹具探测曾误写真实用户 config（`probe:1`），席内已就地还原；**父侧实证 = 现盘零 `probe` 命中**（grep 无匹配）✓；mtime 变动不可逆（在册）。
- **收口修正（父侧小笔 · 可 revert）**：受影响表补行 8a（`settings.mjs` 391 ⇒ 402——表外面）∥ 清册行 13 坐标收正 ⇒ `docs/core/design/PROVIDER.md:444`（as-built）。
- **在册（非阻断）**：① 席内代码评审 🔵 4 条（簿记扩展边界 ∥ 镜像窄面 ∥ 两写径路径解析 ∥ 夹具复原机制）= 接受、零代码改（登记 ∥ 另裁候选在册）；② 真机面（两端各一次：选定 ⇒ 读盘 ⇒ 新开会话起点）= 随下次两端实操顺手闭合（在册）；③ `settings.mjs` 表外披露在案。
- **前批遗留交叉核**：无（#880 已收口；本批独立）。
- **结算**：台账 #883 核销 ∥ 签入（双远端）。
