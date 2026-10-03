# 2026-10-03 · default-model-carryover
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 22:49 原话「所以这就是问题啊！逻辑上应该以用户在会话中选定的模型作为默认模型，下一次新开会话时自动采用用户上次选择的模型。」+ 22:54 落地令「可以，默认模型就照这个也落地」——台账 #880。
> 台账 = #880（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与点火**：用户 2026-10-03 22:49 原话（见档头）+ **22:54 落地令**「可以，默认模型就照这个也落地」= 本批点火令。

**需求（复述 + 对账）**：需求 = **会话内用户显式选定的模型应写回 `defaultModel`（新会话起点）——下一次新开会话自动采用用户上次选择的模型**。
对账（实读现状）：
- 会话内快选（输入区模型菜单 `selectModel`）= `renderer/composer-wire.mjs:232` → `session:prefs` → `sessionMeta[key]`（**仅本会话**；消费面 = 菜单候选回显 `composer-sync.mjs:213-221`）——**不外溢**；
- `defaultModel` 写点全清 = 保存渠道（active 追加 `src/main/providers.mjs:175` ∥ 仅缺失补全 `:195`）∥ 设置面采用出口（`renderer/mount-settings-exits.mjs:132`）∥ onboarding ∥ 迁移（`config-migrate.mjs`）——**会话快选不在其列**；
- 故新会话起点永远只看 `defaultModel`——上次快选不被采用（fallback 长挂成因之一，与 #841 族现场同源）。

**读法两条（22:49 已摆、用户未纠——设计轮据此定形；如与用户原意相抵，以用户纠为准）**：
1. 「选定」= **用户显式挑选**（系统回退自动采用的模型**不写**——防「系统自动改写用户配置」类行为）；
2. 优先关系 = 「上次选择」为准（会话快选写回与设置面显式默认的先后时序/覆盖语义 = 设计轮定形——候选：快选即写覆盖 ∥ 仅缺失时写 ∥ 其他）。

**边界（明示不做）**：不动 fallback 解析链（#841 纯只读回退）；不动 #843（桌面设置面缺 `defaultModel` 态补设路径——在册另件）；不引入系统自动改写用户配置；**主面 = 桌面**（报告来源）；**CLI ∥ VSC 适用性 = 设计轮核**（本条不预先断言）。

**验收方向**：① 会话内快选后 ⇒ `defaultModel` 实写回（读盘可核）；② 新会话起点 = 上次快选（新会话装配可核）；③ 四端写点清单 ∥ 受影响表随动；④ 零回归（现四写点语义 ∥ fallback 解析链照旧）。

**坐标收正（父侧 · 2026-10-03 23:1x——承 §2 U4）**：① 批单② 记 `src/main/settings.mjs:273/:315-326`（写后探）——实读 = `:259-267`（helpers）+ `:327`（调用点，前读漂移）；② 本 §1 边界行「不动 #843」实为 **#842**（桌面设置面缺 `defaultModel` 补设路径；#843 = ACP 协议面提示通道）——两件皆本批零触边界内，登记口径随正。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 + 修复轮（承 §3 轮次 1 发现 1–7 ∥ 9——已逐号收正，修复轮块见节尾；doc-check 复跑 exit 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-03 · initial 轮）**

**本批条目（覆盖 · 台账 #880 · 用户 2026-10-03 22:49 原话 + 22:54 落地令）**

- **R1 · 选定写回（桌面）**：用户显式选定模型（输入区模型菜单 `selectModel`；槽面**实变**）⇒ 同拍写回 config `defaultModel = "<provider>:<model>"`（新会话起点随动）。
- **R2 · 触发判据（负向锁）**：系统同步写（会话切换 ∥ 候选推送回声——同值回写）**不写**；只改档位（`selectReasoning`）**不写**；`busy` / `bad-key` / `slot-missing` 拒径零写（判序不变）；系统回退自动采用**不写**（防系统自动改写用户配置——§1 读法①）。
- **R3 · 回执面**：选定写回径成功回执携 `providerState`（写后核读——第四刷新点）⇒ 提示带（fallback 明示行）即时重派生；键缺席 ⇒ 渲染面零写（负向锁）。
- **R4 · 优先关系（§1 读法②）**：「上次选择为准」= 覆盖式（选定 ⇒ 覆盖设置面既有显式默认；设置面其后「采用」照旧覆盖）——不设来源标记 ∥ 不设「只升不降」类第二状态。
- **R5 · 失败面**：写回失败（`mtime-conflict` 等）**不反扑**会话写（回执仍 `ok:true`——本会话已生效）；主侧 `console.error` 记错（零静默）；定序 = 槽先配置后；复合等值 ⇒ 零写（防盘面抖动 ∥ 探针空转）。
- **不覆盖（边界）**：CLI ∥ VSC 写回落地（判定 = 同判据适用——见 U1）；fallback 解析链（`thincoder-core/model-ref.mjs` 零改）；#842 ∥ #843 面；现四写点语义（设置面「采用」∥ 渠道保存（含 #840 补写）∥ 向导 ∥ 迁移）；系统自动改写用户配置类行为；新通道 ∥ 新词键 ∥ 白名单项。

**设计档落点**（机制单源 = 判据句；本批已落笔 · 产品码零触）：
- `docs/core/design/SESSION.md` §6.21 **判据句 6**（会话选定写回）+ 验收回指 ⑤ + 不做句（config 零写例外）+ 变更记录；
- `docs/desktop/design/IPC.md`：§2 `session:prefs` 行（选定写回径回执 `providerState`）∥「会话级偏好注」项 1 例外 + **项 8**（选定写回——触发判据 ∥ 写面 ∥ 回执 ∥ 边界）∥「provider 态投影注」项 3 第四刷新点 ∥ 设置族注 8① 写口两处 ⇒ 三处 + 变更记录；
- `docs/desktop/design/COMPOSER.md` §2 本批注（会话选定写回——默认模型随动）+ 变更记录。

**机制设计（判据句 = `SESSION.md` §6.21 判据句 6；端侧契约 = `IPC.md` §2「会话级偏好注」项 8）**

- **数据流**：`selectModel`（模型钮 ∥ `/model` 斜径——同一函数）⇒ `session:prefs { key, patch: { provider, model } }` ⇒ `agent-host.setPrefs`（判序：`bad-key` → `busy` → 载荷形判）⇒ 写槽（**写前读 ⇔ 写入值 = 实变判据 `changed`**）⇒ `changed ∧ provider+model 同在` ⇒ `carryoverDefaultModel(provider, model)`（复合等值 ⇒ 零写；否则 `writeConfigAtomic` + 写后探）⇒ 重施 `loadAgentSlot` ⇒ 回执 `{ ok, meta, providerState? }` ⇒ 渲染面：`sessionMeta` 写（既有）+ `providerState` 切片写（新）⇒ 提示带重派生。
- **触发判据（核心）**：写面只认「槽面实变」——回声（会话切换 / 闲时照发同值回写）与档位径天然落空。**被否**：任何 provider+model patch 即写（会话切换回声会改写全局默认——系统写违 §1 读法①）。
- **写什么**：`provider:model` 复合（形单源 = `parseModelRef` 首冒号分割语义；model 含冒号族（`ollama:llama3:70b`）往返解析不破）。
- **探测 ∥ 状态**：写成功 ⇒ 写后探一次（S3 同律——沿 `settings.mjs` 既有 `probeDefaultModelWrite`）；回执携 `providerState`（`providerStateOf(loadConfig())`——#841 投影单源复用）。
- **失败面**：写回体 try/catch（畸形档 ∥ 写错误 ⇒ `{ ok:false, reason }`——不抛）；会话写已成立 ⇒ 回执不改（`ok:true`）；主侧记错。

**关键决策（KD-880-1–5）与被否项**

- **KD-880-1 落点 = 宿主 `setPrefs` 单点**（单 IPC ∥ 单判点）。被否：渲染面二跳（`session:prefs` + `settings:agent` 两次往返——失败面分裂 ∥ 复合串渲染面构造）；核 `setSlotPrefs` 内落 config（跨层——槽写面不得碰 config；且 CLI 不经此口语义错位）；新专用通道（白名单增量 · 无必要）。
- **KD-880-2 判据 = 槽面实变**（写前读 ⇔ 写入值）——系统同步写天然排除（回声恒同值）。被否：来源标记（渲染面 `origin` 字段——协议面增量；实变门已等价达）；「任何写即回写」（会话切换劫持全局默认）。**已知边角（在案）**：跨端并发改槽 + 端内 `sessionMeta` 陈旧 ⇒ 回声可能实变槽面（既有行为——槽写本就照发）⇒ 写回随动（同一次实变的投影，非第二判据）；重选当前已选模型（槽值未变）⇒ 不回写（保守向——防回声误写）。
- **KD-880-3 优先关系 = 覆盖式（「上次选择为准」）**。被否：仅缺失时写（上次选择 ≠ 现值即永不跟进——违用户语义）；来源优先级表（第二状态面——无必要）。
- **KD-880-4 回执 `providerState`（第四刷新点）**。被否：只靠下次 `msg:send` 退场（违 #841「即时退场」纪律——选定修好默认模型后 fallback 行须即清）。
- **KD-880-5 失败不反扑（槽先配置后 ∥ 回执不改 ∥ 记错）**。被否：配置先写（槽失败 ⇒ 全局默认已改、会话未动——更差）；回执转败（槽已写而报败——渲染面 `sessionMeta` 不更新与盘面分叉）。

**受影响文件表（file:line 级 + 行数预算——口径 = 内容行数（文末换行不计）· 实读 as-of 2026-10-03 设计轮；「预期」= 设计预算，实施轮按盘回填）**

| # | 文件 | 现行 ⇒ 预期 | 改动点 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/agent-host.mjs` | **306 ⇒ ≈318** | `setPrefs`（`:222-235`）选定写回支：`written.changed` 门 + `carryoverDefaultModel` 调用 + 失败记错 + 回执 `providerState`；档头 ⑤ 句一行。**越层在册**——触属性评估 = 增量支（非段级结构变更）⇒ 拟判「非结构性 ⇒ 续期」；注册预案「装配表维护面出档评估」结论 = 本批不并拆（U3） |
| 2 | `thincoder-desktop/src/main/settings.mjs` | **331 ⇒ ≈356** | 新导出 `carryoverDefaultModel(provider, model)`（等值零写 ∥ `writeConfigAtomic` 写 + catch ∥ 写后探（复用私有 `probeDefaultModelWrite`）∥ 成功回携 `providerState`）；**越层在册**（续期类） |
| 3 | `thincoder-desktop/src/main/session-slots.mjs` | **259 ⇒ ≈267** | `writeSlotPrefs`（`:224-230`）：写前读（`loadSlotFile`）+ `changed` 判据（provider/model 面实变——`before === null` ⇒ 真）+ 回执键；生产调用面唯一 = `agent-host.setPrefs`（测试面直调在册——`.ok` 判据零破） |
| 4 | `thincoder-desktop/renderer/composer-wire.mjs` | **276 ⇒ ≈281** | `writePrefs`（`:201-212`）成功径：回执 `providerState` 在场 ⇒ 落切片（键缺席 ⇒ 零写；`setProviderState` 已在档 import） |
| 5 | `docs/core/design/SESSION.md` | **1284 ⇒ 1291（本批已落实读）** | §6.21 判据句 6 + 验收回指 ⑤ + 不做句 + 变更记录（已落笔） |
| 6 | `docs/desktop/design/IPC.md` | **526 ⇒ 536（本批已落实读）** | 五行（`session:prefs` 行 ∥ 会话级偏好注项 1/8 ∥ 投影注项 3 ∥ 设置族注 8①）+ 变更记录（已落笔） |
| 7 | `docs/desktop/design/COMPOSER.md` | **283 ⇒ 293（本批已落实读）** | §2 本批注 + 变更记录（已落笔） |
| 8 | `docs/batches/2026-10-03-default-model-carryover.test.mjs` | — ⇒ **新档 ≈150**（批内件——随批留存 ∥ 不进仓套件） | T1–T7（下节） |

**零触面**：`thincoder-core/model-ref.mjs`（fallback 解析链）∥ `thincoder-render-core/**`（核件）∥ CLI 全树 ∥ VSC 全树 ∥ `renderer/composer-sync.mjs`（`providerNotice` 既有消费面——零改）∥ i18n ∥ preload ∥ 通道集 ∥ 白名单 ∥ 现四写点语义（设置面「采用」∥ 渠道保存（含 #840 补写）∥ 向导（`useModel` 同一实现）∥ 迁移）。

**批内用例设计（可机判 · 先红后绿可行 · 落点 = 批内件；运行 = 从仓根 `node --test docs/batches/2026-10-03-default-model-carryover.test.mjs`）**

- **T1 选定写回正径**（红 → 绿）：夹具 = `_setConfigPathForTest`（临时 config：`providers:[p1…]` ∥ `defaultModel:null`）+ `_setSessionsDirForTest` + 真 `createAgentHost` + 真槽（`newSession(cwd)`）；`setPrefs("1", { provider:"p1", model:"m2" })` ⇒ ① 回执 `ok:true` ∧ `providerState` 在场；② 读盘 `loadConfig().defaultModel === "p1:m2"`（验收①口径）；③ 槽 `meta.model === "m2"`（槽写照旧）。**改前红**（回写未落 ⇒ ② 失败）。
- **T2 新会话起点**（红 → 绿）：承 T1 ⇒ `loadConfig()` 运行时 `provider.name === "p1"` ∧ `provider.model === "m2"` ∧ `providerState === "ok"`（新会话无槽 ⇒ defaultModel 入选——核 `resolveProviderPlan` 实跑；验收②口径）。
- **T3 回声负控**：槽已 `p1:m1`；config `defaultModel` 置 `p1:keep`；重发同值 patch ⇒ `defaultModel` 保持 `p1:keep`（**零写**——系统同步不劫持全局默认）。
- **T4 档位径负控**：`setPrefs("1", { effort:"off" })` ⇒ 回执无 `providerState` 键 ∧ `defaultModel` 不变。
- **T5 失败不反扑**：config 路径指向目录（写必失败）⇒ `setPrefs` 回执仍 `ok:true` ∧ 槽已写 ∧ `console.error` 记错（console 捕获断言）∧ 零进程抛。
- **T6 渲染面消费**（红 → 绿）：`createComposerWire` 桩桥——`session:prefs` 回执携 `providerState` ⇒ store 切片写入；回执无键 ⇒ 零写（负向锁）。
- **T7 源判据（结构机检）**：`agent-host.mjs` 含 `carryoverDefaultModel` 调用 ∥ `session-slots.mjs` 含 `changed` 判据（防「只活在本用例」——沿 #840 T6 先例）。
- **回归复跑**：`2026-10-03-desktop-firstrun-provider-notice.test.mjs`（#840——T7 经 `setPrefs` 同径）∥ `2026-10-03-provider-invalid-unify.test.mjs`（#841）——预计绿。
- **真机面（父侧闭合）**：快选取模型 ⇒ config 实写（读盘）；新开会话 ⇒ 起点 = 上次选择（fallback 明示行不再复现——用户原症状闭合）。

**验收对照（回指 §1 验收方向四条）**

- **① 会话内快选后 ⇒ `defaultModel` 实写回（读盘可核）** → T1（机检）+ 真机走查（父侧）。
- **② 新会话起点 = 上次快选（新会话装配可核）** → T2（`loadConfig` 运行时解析实跑）+ 真机（新开会话起点）。
- **③ 四端写点清单 ∥ 受影响表随动** → 本表 1–8 行 + `IPC.md` 设置族注 8①「写口两处 ⇒ 三处」（已落）+ U1（CLI ∥ VSC 写点清单本批零动——判定在案）。
- **④ 零回归（现四写点语义 ∥ fallback 解析链照旧）** → 零触面 + T3–T5 负向锁 + 回归复跑 + `model-ref.mjs` 零改（`git diff --name-only` 名面判据）。

**需求档合规检查（检查面——笔 = 主 agent）**：本批需求（#880）五要素在 §1 已备（目标 ∥ 边界 ∥ 验收四方向 ∥ 依赖链）；需求卷（`docs/desktop/requirements/`）**零抵触**、**零条目**——正式条目落笔 = 主 agent（U2）。

**上抛项**

- **U1 · CLI ∥ VSC 写回落地去向**：判定 = **同判据适用**（两端均有「会话内显式选定」入口——CLI `thincoder-cli/src/tui/model-picker.mjs:223-256` ∥ VSC `thincoder-vscode/src/extension/panel-messages.mjs:227-253`；且「新会话起点 = `defaultModel`」机制同构）。注：VSC 新会话已在观感上「沿用上次选择」（下拉沿用 + 空槽首回合播种——`thincoder-vscode/src/extension/turn-model.mjs:8-11/19-26`），但其 `defaultModel` 面不写 ⇒ 跨端共享面不成立。两端落地面均载在册反向裁定句（CLI「绝不写 config」`model-picker.mjs:221` ∥ VSC「选择不再串扰 config 全局」`panel-messages.mjs:230`）与用户可见文案（`docs/core/design/SESSION.md` §6.8「/model 仅改本会话」——#841 落笔）须同拍收正 ⇒ 建议**另批**（各自端独立实现）；请父侧 ∥ 用户裁：另批（倾向）∥ 并批 ∥ 明书不适用。
- **U2 · 需求卷条目**：本批 #880 建议随 D7 同步在需求卷落一行（笔 = 主 agent）。
- **U3 · agent-host 越层窗口**：本批触属性 = 增量支（非段级结构）⇒ 拟判「非结构性 ⇒ 续期」；注册预案「装配表维护面出档评估」本批结论 = **不并拆**（对象异域 ∥ 热路径扰动 ∥ 306 ⇒ ≈318 ≪ 500 硬限）——窗口拟重立为「装配表维护 ∥ 无效态判定族 下次触碰批」；请评审确认分类与处置。
- **U4 · 批单坐标对账（发现）**：① 批单 ② 记 `src/main/settings.mjs:273/:315-326`（写后探）——实读为 `:259-267`（helpers）+ `:327`（调用点），系前读漂移；② 批单「#843（设置面补设路径）」在册实为 **#842**（#843 = ACP 协议面提示通道）——两件皆本批零触边界内，登记口径随正（零静默）。

**§2 修正（行数对账 · 2026-10-03 同轮）**：受影响文件表 5–7 行「已落实读」按盘收正——`docs/core/design/SESSION.md` **1289**（1284 ⇒ 1289）∥ `docs/desktop/design/IPC.md` **534**（526 ⇒ 534）∥ `docs/desktop/design/COMPOSER.md` **292**（283 ⇒ 292）。产品码四行（1–4）保持**设计预算**（实施轮按盘回填）。

**§2 修复轮块（eng-designer · 2026-10-03 · 修复轮——承 §3 轮次 1 发现 1–7 ∥ 9 逐号；父侧裁定 = 全采纳；号 8 = 父侧账目处置（台账 #883）——本侧零触）**

- **号 1（验收面 · 端到端）**：`docs/core/design/SESSION.md:753-754`——§6.21 验收回指 ⑤ 扩端到端判据（选定 ⇒ 新建会话 ⇒ 运行模型 = 最近一次显式选定）+ 取数链点名（新槽创建 = 核 `newSession`（`thincoder-core/session-lifecycle.mjs:226`）∥ 装配取数 = 核 `loadConfig` 归一链 `resolveProviderPlan`（`thincoder-core/config.mjs:332` ∥ `thincoder-core/model-ref.mjs:113`/:126——槽面无源 ⇒ `defaultModel` 档入选））。
- **号 2（写口计数统一）**：`docs/desktop/design/IPC.md:316-320`——设置族注 8① 收为**两轴明书**：「IPC 写口」三处（视图出口 ∥ `provider:save`（两支）∥ 选定写回；#880 后）∥「全链写点」= IPC 写口 + 向导 ∥ 迁移（向导 = `useModel` 同一实现；迁移 = 核 `config-migrate.mjs`）；`:211`（全链轴标注）∥ `:536`（记录行轴标注）同拍。
- **号 3（实变比对单元）**：`docs/core/design/SESSION.md:735`——判据句 6 钉定：比对单元 = 复合串 `provider:model` 是否变化（`provider` 同值而 `model` 变——同渠道换模型——亦触发；写盘前读 ⇔ 写入值比对）。
- **号 4（边界表）**：`docs/core/design/SESSION.md:749-751`——§6.21 边界情形表补选定写回三行（复合等值零写 ∥ 配置面写失败不反扑 ∥ 回声零写）。
- **号 5（回执面）**：`docs/desktop/design/IPC.md:118` ∥ `:204`——`session:prefs` 信封括注 ∥ 项 7 各补半句：选定写回径成功另携**条件性 `providerState`**（项 8）。
- **号 6（第四刷新点落点）**：`docs/desktop/design/IPC.md:244`——补落点行（主侧写点 = `thincoder-desktop/src/main/settings.mjs` `carryoverDefaultModel` ∥ 触发支 = `agent-host.mjs` `setPrefs`；渲染面消费档 = `composer-wire.mjs` `writePrefs`）；`docs/desktop/design/COMPOSER.md:134`——本批注项 3 点名消费档。
- **号 7（自写抑制交互登记）**：`docs/desktop/design/IPC.md:38`——`ev:config` 行补覆盖判据：选定写回宿主自写同经核 `writeConfigAtomic`（写成功同步回调 `onConfigSelfWrite` 刷新监视基线）⇒ 零推送；候选面复读六径②不触；不另立写点登记（覆盖在写面单点）。
- **号 9（受影响文件标注 + §5 指针）**：`docs/core/design/SESSION.md:74`——§5 补本批落点指针行；行数 ∥ 增量 = 本档 §2 受影响文件表 1–8 行（**在册**）。
- **复核**：`node scripts/doc-check.mjs` 复跑 **exit 0**（悬空 0 ∥ 行宽零新增 ∥ 行数面差异 1 = 原在册项）；报告面新增 1 行（符号·宽 `carryoverDefaultModel`——设计在册未实现符号，不入闸）；三档变更记录各 +1 行（`SESSION.md:1295` ∥ `IPC.md:537` ∥ `COMPOSER.md:293`）；产品码 ∥ 需求卷零触。
- **在册观察**：修复期间 `IPC.md` 遇他批并行写者（ledger-family-aggregate · 台账 #882 设计轮——§1 `ev:ledger` 行 ∥ 其记录行）——区域不重叠，双方内容读回无损。

**§2 复评残余修复块（eng-designer · 2026-10-03 · 修复轮——承 §3 轮次 2 发现 1–3 逐号；父侧裁定 = 号 1–3 归 eng-designer；号 4 = 父侧笔（已办）——本侧零触）**

- **号 1（写口计数 · 时态限定）**：`docs/desktop/design/IPC.md:211`——「现四写点（**全链写点轴**——…四）」⇒「**#880 前既有四写点**（**全链写点轴**——…四）」；与 `:316` 两轴公式对轴（全链轴：#880 前 = 四 ∥ #880 后 = 五〔= 四 + 选定写回〕——两值各归其时态，消「同轴两值」误读）。**零语义改**（时态限定词）。
- **号 2（「恒非空」范围限定）**：`docs/core/design/SESSION.md:137` ∥ `:198`（收正前 `:197`——折行 +1）——实证（读码）：`newSlotData`（`thincoder-core/session-slot-write.mjs:46-54`）规范结构**无** `activeProvider` / `activeModel` 两键；`newSession`（`thincoder-core/session-lifecycle.mjs:265-266` 写 `newSlotData(cwd)`）∥ 开关写面空槽径（`session-slot-write.mjs:133`）同源无两键 ⇒ **实况站 `:755` 侧**（旧 `:754` 取数链——空槽前提真）；保存面取值链 = `saveSession`（`thincoder-core/session.mjs:129-133`——「有 provider 即携带具体复合值」裁句）。两处补限定：**限定 = 保存面成对写入**〔有 provider 即携带具体复合值〕；**全新空槽规范结构无此两键**。**语义本体（恒非空）零改**。附：`:137` 字段集行按行宽 300 折行（两行 ⇒ 三行）。
- **号 3（措辞统一）**：`docs/desktop/design/IPC.md:204`——「成功携 `meta`（信封三键）」⇒「成功 = 信封 + `meta`（三键）」（与 `:118` / `:183` 同形；`:182`「四键齐备」零触）。**零语义改**。
- **复核**：`node scripts/doc-check.mjs` 复跑 **exit 0**——悬空 **0** ∥ 行宽 OK（无 >300 字符单行）∥ 行数面差异 5 条（报告态——代码档行数表随 #32 在飞 ∥ 他批随动，非本笔）。变更记录：两档各 +1 行（`SESSION.md:1297` ∥ `IPC.md:539`）。
- **路遇观察（范围外 · 本轮零触 · 上抛）**：`docs/desktop/design/IPC.md:329`「「`patch` 表达不了删键」旧说已消解」= 修订式表述（规范面残留）；不在本轮判决表内 ⇒ 未动；提请父侧处置。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（设计评审 · 会话选定写回批 default-model-carryover · 台账 #880）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 验收 / 需求覆盖 | 🟡 | 目标句含用户可见结果「下一次新开会话时自动采用」（`thincoder/docs/desktop/requirements/COMPOSER.md:12` ∥ `thincoder/docs/core/design/SESSION.md:735`），验收面只列写回半——`thincoder/docs/core/design/SESSION.md:749` ⑤ = 「实写回 ∥ 等值 ∥ 回声 ∥ 回退径零写」；「新会话起点」取数链未点名（`thincoder/docs/core/design/SESSION.md:196` 仅结论句）⇒ 结果半无端到端判据 | 补端到端判据（选定 ⇒ 新建会话 ⇒ 运行模型 = 最近一次显式选定）＋点名该链落点（或加指针至既有单源） |
| 2 | 一致性 / 清晰 | 🟡 | 同一写入口集合三种计数并见：`thincoder/docs/desktop/design/IPC.md:316`「写口三处（#880 增）」∥ `thincoder/docs/desktop/design/IPC.md:211`「现四写点语义零改」∥ `thincoder/docs/desktop/design/IPC.md:534`「写口两处 ⇒ 三处」；`thincoder/docs/desktop/design/IPC.md:316-318` 同段实列四条入径（视图出口 ∥ `provider:save` `active:true` ∥ 首跑补写 ∥ 选定写回） | 统一「写口 ∕ 写点」计数口径（是否分计 `provider:save` 两支）并回填两处计数 |
| 3 | 清晰 | 🔵 | 「槽面实变」比对单元未钉定：`thincoder/docs/core/design/SESSION.md:735`「`provider` + `model` 两键写入 ∧ 槽值实际改变」可读作「两键都变」——照此实现则同渠道换模型（`provider` 同值）不触发写回 = 主径失守 | 明写判据 = 复合串 `provider:model` 是否变化（与 `thincoder/docs/desktop/design/IPC.md:207`「写盘前读 ∥ 写入值比对」同拍） |
| 4 | 清晰 / 边界 | 🔵 | §6.21 边界情形表（`thincoder/docs/core/design/SESSION.md:742-747`）未增选定写回行（复合等值 ∥ 配置面失败 ∥ 回声）；该批边界仅住 `thincoder/docs/desktop/design/IPC.md:211` 括注 | 表内补行，或明写「写回径边界单源 = `IPC.md` §2 项 8」 |
| 5 | 一致性 / 清晰 | 🔵 | `session:prefs` 成功回执面三处未同拍：`thincoder/docs/desktop/design/IPC.md:118` 信封括注 `{ ok, reason, cwd, slot, meta }` 与 `thincoder/docs/desktop/design/IPC.md:204` 项 7「成功携 `meta` · 失败缺 `meta` 键」未提条件性 `providerState`（该键只见于 `IPC.md:118` 后段 ∥ 项 8） | 两处补半句或改指针至项 8——免「信封键集 = 五键」被读成闭合 |
| 6 | 清晰 | 🔵 | 「第四刷新点」（`thincoder/docs/desktop/design/IPC.md:243`）未给落点（主侧写点 ∥ 渲染面消费档），与第三刷新点（`thincoder/docs/desktop/design/IPC.md:242` 已给实落三处坐标）不成对；`thincoder/docs/desktop/design/COMPOSER.md:134` 亦未点名消费档 | 点名两处落点（或落批档落点表） |
| 7 | 集成边界 | 🔵 | 新增宿主自写盘（`defaultModel`）与 `ev:config` 自写抑制 ∥ 候选面复读六径②（`thincoder/docs/desktop/design/IPC.md:38` ∥ `thincoder/docs/desktop/design/IPC.md:348`）的交互未在档；同批判据句 6 已立意「防探针空转」（`thincoder/docs/core/design/SESSION.md:735`）⇒ 该门是否自动覆盖未见判据 | 一句登记（自写抑制覆盖判据；若须登记写点则点名） |
| 8 | 范围 | 🟡 | `thincoder/docs/core/design/SESSION.md:736` 声明「CLI ∥ VSC 判定 = 同判据适用、落地另批」⇒ 同一 config 下三端行为分叉期（用户原话未限端，`thincoder/docs/desktop/requirements/COMPOSER.md:20`）——协调项（非缺陷） | 排批续落 ∥ 分叉期入台账登记 |
| 9 | 受影响文件标注 | 🔵 | 四档均未见本批受影响文件行数 ∥ 预期增量；落点 = `thincoder/docs/desktop/design/IPC.md:209` 两档（`settings.mjs` ∥ `agent-host.mjs`——在档坐标 `IPC.md:242` `settings.mjs:330` ∥ `COMPOSER.md:18` `agent-host.mjs:335-336` 旁证两档越 300 顾问线）；`thincoder/docs/core/design/SESSION.md:63-73` §5 未增本批落点指针（2026-10-0x 系列同况）；落点表住批档 §2（**范围外 ⇒ 未验证**） | 落点表附行数 ∥ 增量 + 越层审视结论；§5 补指针行 |

**范围限制（判定降级声明）**：项目未声明文档地图与项目标准档 ⇒ 文档归属按 `AGENTS.md` 与本四档内互指判定；方法论合规按四档既有体例（判据句 ∥ 边界情形 ∥ 验收回指 ∥ 落点表指针）判定。

**范围外注记（不评严重度）**：`thincoder/docs/desktop/design/IPC.md:197` ∥ `:211` 引「需求 §3.5:94 ∥ 项 5・6」（住 `docs/desktop/requirements/PROJECT.md`——评审范围外，未读）——该卷是否需同拍收正「config 零写」原文 = 待核项（**unverified**）。

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 6。
VERDICT: pass

### 轮次 2（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（写口计数） | 🟡 | `thincoder/docs/desktop/design/IPC.md:211`「现四写点（**全链写点轴**——设置面「采用」∥ 渠道保存（含 #840 补写）∥ 向导（`useModel` 同一实现）∥ 迁移；…）语义零改」= 4 项、未含选定写回；同档 `:316`「**IPC 写口三处**（#880 后）= 视图出口 ∥ `provider:save` ∥ 选定写回；**全链写点 = IPC 写口 + 向导 ∥ 迁移**」⇒ 全链轴 = 5。两处同轴不同值、均无时态限定（「现」字下可读作同轴两值）。 | `:211` 补时态限定（#880 前既有）或补列第五项（选定写回）——与 `:316` 两轴公式同值同义。 |
| 2 | Document ownership（同档相抵） | 🟡 | `thincoder/docs/core/design/SESSION.md:754` 新增端到端前提「空槽规范结构无会话级 provider/model」与同档 `:137`「`activeProvider` + `activeModel`（槽双字段**恒非空**）」、`:197`「双字段恒非空」严格读法相抵：按恒非空读，则 ⑤ 的「槽面无源 ⇒ `defaultModel` 档入选」前提不成立；按 `:754` 读（与 `:204` D-S3「槽 `activeModel` 缺省」、§6.24 边界①「无 activeProvider / 无 activeModel」、`:150`「有值才带」同向）则「恒非空」句过强。 | 对 `:137` / `:197` 的「恒非空」补范围限定（保存后 ∥ 成对写入），或对 `:754` 补「未载槽值」限定——任一侧限定即可消歧。 |
| 3 | Clarity（措辞） | 🔵 | `thincoder/docs/desktop/design/IPC.md:204`「成功携 `meta`（信封三键）」与同档 `:182`「统一信封 `{ ok, reason, cwd, slot }`——四键齐备」相抵；`:183` / `:118` 的写法为「信封 + `meta`（三键）」。 | 统一为「信封 + `meta`（三键）」写法（与 `:118` / `:183` 同形）。 |
| 4 | Document ownership（数字漂移） | 🔵 | `thincoder/docs/desktop/requirements/COMPOSER.md:4`「（D1–D41 全表查卷口）」与同档 `:20` 变更记录「（D 表仍 D1–D42）」差一（D 表范围以总览现文为准）。 | 对盘总览 `docs/desktop/requirements/PROJECT.md` 现文后对齐两处范围数（或对头行标 as-of 口径）。 |

VERDICT: pass · 计数：🔴 0 · 🟡 2 · 🔵 2

范围外注（不赋级）：① 本批受影响文件行数/增量表住批档 §2（评审范围外未读）——`SESSION.md:74` 指针自述「含受影响文件行数 ∥ 增量」，数值与 >300/500 档拆分预案无法机检；② 前表（轮次 1）发现 #8 → 父侧台账 #883：范围外，未核；③ `SESSION.md:737`「CLI ∥ VSC 判定 = 同判据适用、落地另批」的排期/台账登记属父侧面，未核；④ 设计档所引代码坐标（file:line）未复读源码核验（本轮范围限四档文档）；⑤ 无文档 map / 未声明标准档——文档归属与方法论合规按档内自述口径与 AGENTS.md 评估（降级）。

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-03 23:14「都自动跑完」授权）**——三条件齐备：① **设计评审 pass** ✓（#23 · 🔴 0 ∥ 🟡 3 ∥ 🔵 6——号 1–7 ∥ 9 收正；号 8 = 台账 #883 处置）；② **收正轮已落地并逐条核验** ✓（#25 八号全落 + 父侧抽样核验：判据句 6 比对单元钉定 ∥ 验收回指 ⑤ 端到端取数链 ∥ 边界表三行 ∥ 写口两轴；doc-check exit 0——提交 `9d9bcd4a`）；③ **凭据已签发** ✓（值不落档——沿纪律；实施派发即用）。另：复评 #31（同 doc-set · 收正后终态）在飞 = 双保险。⇒ **实施轮已派发**（eng-coder · initial · 四档实现 + 批内件 T1–T7）。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-03 · initial 轮 ＋ 修正轮 1）**

**状态行**：实施完成（initial 轮 ＋ 修正轮 1（评审发现 5 序对齐）· 内部差异审计 1 轮 clean ∥ 内部代码评审 2 轮 pass · 终态 clean）

**交付摘要（号 → 改动 file:line）**

| # | 件 | 落点（file:line） | 读数 |
|---|---|---|---|
| 1 | `setPrefs` 选定写回支（`written.changed` 门 ∥ `carryoverDefaultModel` 调用 ∥ 失败记错不反扑 ∥ 回执 `providerState`） | `thincoder-desktop/src/main/agent-host.mjs:229-251`（档头 ⑤ `:8-9` ∥ import `:42-43`） | T1 ∥ T5 ∥ T7 |
| 2 | 写回单点 `carryoverDefaultModel(provider, model)`（复合等值零写 ∥ `writeConfigAtomic` ＋ catch 不抛 ∥ 写后探复用 `probeDefaultModelWrite` ∥ 成功回携 `providerState`） | `thincoder-desktop/src/main/settings.mjs:271-296`（档头 `:9-11`） | T1 ∥ T2 ∥ T3 ∥ T5 ∥ T7 |
| 3 | `writeSlotPrefs` 写前读 ＋ `changed` 判据（复合串 `provider:model`；`before === null` ⇒ 真）＋ 回执键 | `thincoder-desktop/src/main/session-slots.mjs:221-241` | T3 ∥ T7 |
| 4 | `writePrefs` 成功径 `providerState` 切片写（键缺席 ⇒ 零写） | `thincoder-desktop/renderer/composer-wire.mjs:201-217`（落切片 `:216`） | T6 |
| 5 | 批内件 T1–T7（新档） | `docs/batches/2026-10-03-default-model-carryover.test.mjs`（244 内容行） | 见下 |

**测试读数（从仓根 `thincoder/` 运行；仓级套件不跑——父侧收口跑）**

- 红基线（实现前 · 先红后绿之红）：`node --test docs/batches/2026-10-03-default-model-carryover.test.mjs` ⇒ tests 7 · **pass 2 · fail 5**（exit 1）——
  T1（回执无 `providerState`）∥ T2（`defaultModel` 未写回）∥ T5（零记错）∥ T6（切片未写）∥ T7（源判据未在档）红；
  T3 ∥ T4 绿 = 负控真值（未实现 ⇒ 无写自然零写），非实现达标。
- 复跑（实现后 · 逐腿）：T1 ✔ ∥ T2 ✔ ∥ T3 ✔ ∥ T4 ✔ ∥ T5 ✔ ∥ T6 ✔ ∥ T7 ✔ ⇒ tests 7 · **pass 7 · fail 0**；修正轮 1（序对齐）后复跑同读数。
- 回归复跑：`#841`（`2026-10-03-provider-invalid-unify.test.mjs`）⇒ tests 5 · pass 5 · **EXIT 0**（直跑）；
  `#840`（`2026-10-03-desktop-firstrun-provider-notice.test.mjs`）⇒ tests 7 · pass 7 · **EXIT 0**（**以隔离 `USERPROFILE` 复跑**——见「复跑须知」）。
- `node scripts/doc-check.mjs` ⇒ **EXIT 0**（悬空 0 ∥ 行宽 OK ∥ 行数面差异 5 条 = 本批 4 产品行 ＋ `E2E-TESTING.md:249` `.gitignore` 行（非本批面））。

**复跑须知（#840 T7 环境面 · 实施期发现）**

- 本批落形后 `#840` T7 的 `setPrefs` 会触发选定写回，而该件未设配置路径缝 ⇒ **不隔离复跑将写真实用户 config**
  （实证：隔离跑于临时 profile 生成 `{"defaultModel": "p1:m1"}`）。
- 复跑命令 = 先置 `$env:USERPROFILE="<临时目录>"` 再 `node --test docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs`
  （本次以 `%TEMP%\tc-dmc-iso840b` 隔离）。「预计绿」成立（隔离下 7/7）；**未隔离直跑有真实副作用**——父侧再复跑须带隔离。

**决策透明表（自决项）**

| 决策 | 取值 | 判由 |
|---|---|---|
| 回执 `providerState` 在场条件 | 仅**实写发生**在场；复合等值零写径键缺席 | 判据句 6「写成功 ⇒ 写后探」＋ 项 8「写后核读」——等值径无「写后」；「键缺席 ⇒ 渲染面零写」负向锁 |
| `#840` 回归复跑环境 | 隔离 `USERPROFILE`（临时目录） | 不隔离将写真实 config（上「复跑须知」）；同件同代码、仅 homedir 重定向 ⇒ 读数效力不变 |
| T3 含两负控（回声 ＋ 复合等值） | 并入 T3（设计表仅列回声一径） | 复合等值零写 = §6.21 边界表在册行；补覆盖（防盘面抖动），非偏离 |
| 修正轮 1 处置 | 代码侧对齐（重施移至写回之后） | 设计档为权威（§2 数据流逐位）；设计档不由本席改 |
| 测试夹具（T6）取真件 | `createStore()` 真 store（初版桩漏补丁合并语义 ⇒ 假红，自修） | 真件零桩漂移 |

**审计与代码评审轮次与终态**

- 内部差异审计（explore · 只读 1 轮）：**VERDICT clean**——四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）零命中；
  判据句 6 五事 ∥ 四负向锁 ∥ 受影响表 1–4/8 ∥ T1–T7 覆盖逐条「满足」。
- 内部代码评审（advisor · type=code · 2 轮）：轮 1 = **pass**（🔴 0 ∥ 🟡 2（文件越 300 顾问线——在册 ∥ 记录面回填未落）∥ 🔵 3（IPC 坐标漂移 ∥ 测试脆弱腿 ∥ 实现序与文档异序））；
  修正轮 1 = 序对齐；轮 2（fix 核验）= **pass**。**终态 = clean**。

**评审响应表**

| # | 评审项 | 处置 | 证据/判由 |
|---|---|---|---|
| 1 | 🟡 文件顾问线（`agent-host` 322 ∥ `settings` 360 >300） | 保留（在册·不升级） | 设计 U3 拟判「非结构性 ⇒ 续期」；均 <500 硬限 |
| 2 | 🟡 记录面回填（§5 ∥ §2 行数） | 本片落 §5 ＋ 行数实读；§2 表回填归父侧 | 本节「行数实读」 |
| 3 | 🔵 `IPC.md:242/:244` 坐标漂移 | 报父侧（设计档侧收正） | 不动设计档（本轮边界） |
| 4 | 🔵 测试脆弱腿（T3 mtime ∥ T7 源式） | 保留（内容逐字为主证；结构检沿 #840 先例） | T3 内容 ∥ mtime 双证；T7 设计指定 |
| 5 | 🔵 实现序 vs §2 数据流 | **已修**：重施移至写回之后 | `agent-host.mjs:238 → :244-248 → :249 → :250` |

**行数实读（届盘 · 内容行口径）**：`agent-host.mjs` **322**（设计预算 ≈318）∥ `settings.mjs` **360**（≈356）∥ `session-slots.mjs` **270**（≈267）∥ `composer-wire.mjs` **281**（＝281）∥ 批内件 **244**（预算 ≈150）。

**改动集自核**：本批触动 = 交付表 1–5 五档（4 产品 ＋ 批内件）；`thincoder-core/**` ∥ CLI ∥ VSC ∥ `thincoder-render-core/**` ∥ preload ∥ i18n ∥ 通道集 ∥ 白名单零触（`model-ref.mjs` 零改——fallback 解析链照旧）。

## §6 验证与收口（父代理）
