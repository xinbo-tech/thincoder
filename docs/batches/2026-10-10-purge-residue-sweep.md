# 2026-10-10 · purge-residue-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10「全清了」直令 + 清账轮批档簇Ⅳ = #1090 ∥ #1121 ∥ #1125 ∥ #1126 ∥ #1127（退役残迹收束）。
> 台账 = #1121（desktop · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 簇Ⅳ）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10「全清了」——本批 = 清账轮簇Ⅳ（`docs/batches/2026-10-10-ledger-full-triage.md` §1 ②）；授权 = 会话全自动沿用。

**条目（5）**：
- `#1121`（行为面——全链主体）：桌面模型菜单——provider 整行点击 = 静默无操作 ∥ 选中→生效链缺口 ∥ 写失败静默；修向重定 = 行（分组/展开、无选中语义）、全链不得有「渠道默认模型」概念（用户 12:07 重申）。
- `#1090`：A案退役键残迹收束——`renderer/store.mjs:127` none 态三键形 ∥ `views/settings.mjs:207` env.proxy.model 投影 ∥ `cmd-config.mjs` 写径归一（seturi :136 ∥ toggleweb :143）∥ M604 seed `:255/:439` ∥ T8 扩腿 2 行。
- `#1125`：`findVisionChannel`（`thincoder-core/vision-reader.mjs:34-43`）判定源重定——条件命中（provider 面轮到视觉链 = 本批）+ 用户口径待呈（恢复快乐径 ∥ 明书不恢复）。
- `#1126`：桌面死面清理——`views/settings.mjs:205` env.proxy.model 投影无消费者 ∥ renderer `settings.defaultModel` 写而不读。
- `#1127`：`thincoder-vscode/src/extension/vision-channel.mjs` 零 import——先核动态引用/激活面再裁存废。

**边界**：桌面 renderer/main ∥ VSC extension ∥ 核 vision-reader ∥ CLI cmd-config；与 `#1167` 批 ∥ 他簇零交叠。

**授权口径**：会话全自动（2026-10-10 03:07「全自动」+ 03:44「全清了」）——设计 → 评审（用户点火）→ 批准 → 实施。

**父裁（2026-10-10）**：① `#1125` 口径——默认取推荐 A（恢复贴图降级快乐径 = `models[]` 勾选集 × `specForModel.multimodal`）；用户如有异议一句话翻 B，仅行为表 + AC 一行随动；② 10-08 代理件 T4/W2 两红——随本批实施臂同拍修（断言随现文、零产品码；判据 = 该件复跑 10/10 绿）；③ 历史批件夹具 `proxy.model` 残留 ≥8 件 → 归批 台账 `#1176`（清单以 §2 为准）。

**父裁（2026-10-10 · 评审 #71 changes-required 回执）**：🔴2 ∥ 🟡1 ∥ 🔵3 逐条——F1（#1125-A 载体退场：`PROVIDER.md:572` D-PR11 ∥ `config.mjs:5` ∥ `config-migrate.mjs:50` ∥ `model-ref.mjs:7` ∥ `config-io.mjs:153-154` 五实读确认）⇒ **按 B 落**（B 为唯一可实施案；A 降为待裁——须先定义载体，上抛留档）∥ F2（T5 断言将红）⇒ 受影响表增 `docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs` 行 + 随正登记 ∥ F3（§1 父裁② 与 §2 上抛项 3 相抵）⇒ §2 归位父裁②（T4/W2 随本批修 +「该件复跑 10/10 绿」AC）∥ 🔵 F4/F5/F6 随正或「维持」。**修复轮 = eng-designer #82**（fix · 定点逐号）；报告回后复评（round 2）——复评窗口与 §2 改动面冻结同步。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（5 条目全覆；修复轮逐号收正——#1125 落 B ∥ 跨批件两件纳落地表 · 2026-10-10）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖 5 条 · 三方链入口）**

| # | 条目（台账） | 面 | 本批动作 | 验收（见下「验收对照」） |
|---|---|---|---|---|
| 1 | `#1121`（requirement · desktop） | 桌面模型菜单（共享渲染核 `thincoder-render-core`） | 三修：① 行 = 分组/展开控件、行点击 = 展开⇄收起（**读 A**）；② 选中→生效链（拾取单点 + 零静默丢点）；③ 写失败可见（失败行 + 零乐观写 + 写回码） | AC-1121/1–3 |
| 2 | `#1090`（tech_todo · proxy） | 退役键 `model` 残迹 | 四处随正（store 种子 ∥ views 投影 ∥ cmd-config 写径归一 ∥ M604 夹具）+ T8 扩腿 2 行 | AC-1090/1–5 |
| 3 | `#1125`（tech_todo · core） | 视觉渠道判定源（贴图降级） | 落 **B**（恒 `null` +「明书不恢复」写实为常规态）；A 载体不存在——降为上抛项 2 | AC-1125/1 |
| 4 | `#1126`（tech_todo · desktop） | 桌面死面清理 | `env.proxy.model` 投影（与 `#1090` ② 同一行——一笔两账）∥ `settings.defaultModel` 切片删除 | AC-1126/1–2 |
| 5 | `#1127`（tech_todo · vsc） | `vision-channel.mjs` 存废 | 裁 **删**（零静态 ∥ 零动态引用——本席实读）+ 三处 doc 指针随正 | AC-1127/1–2 |

**设计档落点（本批触碰面 · 实施轮落笔）**

| 文档 | 节 | 内容 |
|---|---|---|
| `docs/core/design/PROVIDER.md` | §6.16「UI / 交互决策（已定）」（`:306`）∥ 面板接线句（`:363`） | 行语义一句（行 = 分组/展开控件——零选中语义、零槽写；点击 = 展开⇄收起）+ 选中仅在模型条目 + 写失败可见口径 |
| `docs/render-core/design/RENDER-CORE.md` | §2（KD-RC 新行）∥ §5（接口契约：模型菜单条目）∥ §6 行数 ∥ §7 验收判据 ∥ 变更记录 | 核件行语义 ∥ `onPick` 单点与 `row` 键（向后兼容）∥ 组体/菜单层开合解耦 |
| `docs/desktop/design/COMPOSER.md` | §1（KD 新行）∥ §2（本批注）∥ §4 验收回指 ∥ §5 用例 ∥ 变更记录 | 桌面写面：失败行源（`prefs-failed`）∥ 零乐观写回滚 ∥ 选择链读数（槽实写 + 施加 + 写回） |
| `docs/desktop/design/IPC.md` | §2「会话级偏好注」 | `session:prefs` 回执叠加 `carryover` 失败码（槽写不反扑语义保留） |
| `docs/desktop/design/SETTINGS.md` | §2（env 段本批注）∥ §3.1/§3.2 行数 | env.proxy 两键形（none 种子 ∥ 面投影 ∥ 写即归一） |
| `docs/core/design/PROXY.md` | §4（口径单源） | 写径归一（`{uri, web}` 两键；退役键零回读零保留） |
| `docs/core/design/API-CONTRACT.md` | 导出行（`:3298`） | `findVisionChannel` 指针改指核单源（删 VSC 薄壳后） |
| `docs/core/design/MODEL-SPECS.md` | `spec.multimodal` 消费点清单（`:179` ∥ `:215` ∥ `:2136`） | 该消费点退场 + 计数随动（八 ⇒ 七——以实读为准） |
| `docs/core/design/CORE-UNIFICATION.md` | `:328`（端特有档盘点） | 枚举随正（`vision-channel` 退场） |
| `docs/core/design/PROVIDER.md` | §6.18（贴图降级链） | 落 B（明书不恢复——恒 `null` 写实为常规态）；「判定源重定在途」措辞清零 |

**机制设计 · `#1121`（桌面模型菜单 · 三修）**

面：`thincoder-render-core/composer/model-menu.mjs`（桌面 ∥ VSC 同源核件）· 桌面侧消费 = `thincoder-desktop/renderer/composer-sync.mjs`（候选推送）+ `renderer/composer-wire.mjs`（写面）+ `src/main/agent-host.mjs`（槽写与写回）。

**修 ① 行 = 分组/展开控件（无选中语义；点击 = 展开⇄收起 · 读 A —— 父侧 2026-10-10 裁定）**

- 行件（`providerRow`，`model-menu.mjs:152-254`）：`role="option"` + `aria-selected=String(!!current)`（`:157-158`——行携「当前项」选中态）**退场** ⇒ `role="button"` + `aria-expanded`（随该行组体开合同拍）；「当前模型归属」仍由组体内条目的 ✓ 勾选承载（`:214-221` 不动）。
- 行点击（`:252`）：`openFlyout()`（只保浮出）⇒ **toggle** —— 未展开 ⇒ 展开（沿现 `openFlyout` 全部行为：一次一浮出 ∥ 过滤框聚焦）；已展开（本行组体在场）⇒ 收起（移除该行组体 + 清 `data-flyout-open` + `aria-expanded=false`）。
- **层级解耦（旧账覆盖 · 显式）**：行 toggle 只作用于**组体**（`.mm-flyout` = 该渠模型子列）；**菜单层**（`.mm-overlay` + `.mm-panel`，含 footer 管理三项）**恒不因行点击而关**（点外点击 ∥ Esc ∥ 选中模型仍即时关菜单——`:130` ∥ `:71` ∥ 条目拾取径照旧）。**注**：档内先例注文 `:248-252`（GitHub #4「行点击只保浮出」档）随本形退场——本次为有意行为（用户 12:07 口径「行 = 分组/展开」+ 缺陷名「整行点击静默无操作」），实施轮该注文须重写为现形描述（不留前朝规范句）。
- 零写负向锁：行路径**恒零 `post`**（不产 `selectModel` ∥ `selectReasoning` ∥ `session:prefs`）——「无选中语义」机检判据；行点击后槽档、`defaultModel`、钮文本三面零动。
- 触摸/无 hover 径：点击即展开（组体功能完整）；键盘面本菜单不设（沿「webview 无键盘导航」，`PROVIDER.md:363`）。

**修 ② 选中→生效链（唯一条目拾取面；零静默丢点）**

- 拾取单点：条目行现两处触发同函数（`mousedown` ∥ `click`，`:222-223`）⇒ 收为 **click 单点**（`mousedown` 仅 `preventDefault` + `stopPropagation`）——一为消双发（双同拍 post），二为避「mousedown 关菜单 ⇒ 后续 click 落到菜单下方元素」的幽灵点击面。
- 行对象直传（闭「查无即静默丢」）：`openModelMenu` 的 `onPick({ provider, model })` 定义在 `createModelMenu` 内（`open()`，`:303-305`），消费侧按 `_models.find((x) => x.id === model && (x.provider||"") === provider)` **回查**；而菜单在场期一旦收到新候选推送（`applyModels` 整换 `_models`，`:396`）⇒ 菜单渲染行集与 `_models` 脱离 ⇒ 按旧行拾取 = 查无 ⇒ **静默零动作零写**（用户可见：菜单关了、钮未变、槽未写）。改：`onPick` 增携 `row`（= 渲染时该行对象，新键、向后兼容——VSC 三消费面 `settings-models.js` ∥ `settings-providers.js` ∥ `settings-consult-dialog.js` 不读该键 ⇒ 零影响）；桌面 `onPick` 优先取 `row`；缺 `row` 时保回查 + **查无 `console.error` 一行**（零静默）。
- 生效链（现状核，不改语义）：条目拾取 ⇒ `selectModel(m)`（`:363-375`：本地选中态 + 钮文本 + 关菜单 + `post`）⇒ 桌面 `writePrefs`（`composer-wire.mjs:240-241`）⇒ `session:prefs` ⇒ 槽实写（`agent-host.mjs:243-245` ⇒ `session-slots.mjs:231-242`）+ 本键已装配 ⇒ `loadAgentSlot` 施加（在飞 ⇒ `_pendingPrefsApply` 回合尾施加，`:254-260`）⇒ 槽面实变 ∧ `provider`+`model` 同在 ⇒ `defaultModel` 写回（`:249-253`）。
- 「渠道默认模型」零残留（用户口径）：本批不改 `defaultModel` 写回（= 新会话起点，非渠道默认模型）；扫面 = 本批触碰档零「渠道默认模型」字样、零渠道单值模型读取（负向锁）。

**修 ③ 写失败可见（零静默）**

- 渲染面（`writePrefs`，`composer-wire.mjs:208-220`）：失败径现仅 `console.error`（`:212-215`）⇒ 复用既有失败行通道（`recordFailure` 单点，`:69-74`：入失败态 + 记错 + `repaint`）——提示行带出「模型切换未生效」行；行属性按来源分 `data-notice="prefs-failed"`（区别于发送失败的 `send-failed`）；词 = **新键**（两语）`composer.prefs.failed`（`{reason}` 位携回执码）——理由：既有 `composer.send.failed` 为「发送失败」词，用之于模型切换未生效 = 一词两义（失实）。
- **零乐观写**落实：`selectModel` / 档位条目点击现已先行改钮文本与本地选中态（`:363-365`），失败 ⇒ UI 与槽相抵。改：失败径 ⇒ 钮文本与本地选中态**由槽现值重派生**（读 `sessionMeta[key]`；缺 ⇒ 钮回「空」态），并出上条失败行。
- 主进程面（写回失败）：`carryoverDefaultModel` 失败现仅 `console.error`（`agent-host.mjs:249-253`）+ 回执不携键 ⇒ 渲染面零感知。改：回执叠加 `carryover: { ok: false, reason }`（成功径零变；槽写仍 `ok:true`——「不反扑」保留）⇒ 渲染面据该键出同一条失败行。`IPC.md` §2 注随正。

**行为表 · `#1121`（现状复现读数 ⇒ 修后验收读数）**

| 面 | 现状（复现读数 · 证据） | 修后（验收读数） | 机检法 |
|---|---|---|---|
| provider 行（核件） | 点击 = `openFlyout()`；hover 已开 ⇒ 零可观测效果、零 post（`model-menu.mjs:247-252`）；行携 `role=option` + `aria-selected`（`:157-158`） | 点击 = 展开⇄收起（两态可观测）；行零选中语义（`role=button` + `aria-expanded`）；两态皆零 post、零槽写、不关菜单层 | 批件腿 a：hover ⇒ 点击 ⇒ 组体退场 ∧ `aria-expanded=false` ∧ 菜单层在场；再点 ⇒ 组体在场 ∧ `true`；`post` 记录全程空 |
| provider 行（桌面实测） | 全槽扫描 0 处 `testserver` 写入；`config.json` mtime = 11:47:37（CLI 写回）——桌面零写入（台账 `#1121` 证据行） | 行径零写不改——**修后桌面唯一写面 = 模型条目**；条目选中后复扫：槽档 `activeProvider/activeModel` 落值 | 负向锁（同行）+ 真机复扫（父侧/用户） |
| 模型条目（拾取） | 双触发（`mousedown`+`click`）；消费侧回查 `_models`；菜单在场期候变换 ⇒ 拾取查无 ⇒ 静默零动作零写 | 恰一次拾取（click 单点）；`row` 直传 ⇒ 零查无丢失；恰一发 `session:prefs` | 批件腿 b：双事件序 ⇒ 恰一次 `onPick`；在场期换行集 ⇒ 拾取仍生效 |
| 选中→生效 | 链在盘（拾取 ⇒ `session:prefs` ⇒ 槽写 + 施加 + `defaultModel` 写回），桌面实测「零写入」待修后复扫 | 槽档落值 + 钮文本/勾选 = 槽现值 + 下一回合取新模型（装配施加 ∥ 在飞顺延） | 真机（父侧）+ 批件腿 b（调用面） |
| 写失败 | `writePrefs` 失败 ⇒ 仅 `console.error`（`composer-wire.mjs:212-215`）+ 钮已乐观改；写回失败 ⇒ 仅 `console.error`（`agent-host.mjs:251`） | 失败 ⇒ ① 失败行在场（`prefs-failed` + 码）② 钮/选中态回滚槽现值③ 槽零写；写回失败 ⇒ 回执 `carryover` 码 + 同行可见，槽写不反扑 | 批件腿 c/d：喂失败回执 ⇒ 行在场 ∧ 钮回滚 ∧ 槽零写；喂写回失败 ⇒ 回执携码 |

**机制设计 · `#1090` + `#1126`（退役键残迹 + 死面清理）**

| 序 | 落点（实读） | 现状 | 修法 | 判据 |
|---|---|---|---|---|
| ① | `thincoder-desktop/renderer/store.mjs:127` | `env: { …, proxy: { uri: "", web: true, model: false }, … }`——none 态种子三键形（退役键 `model`） | 种子改两键 `{ uri: "", web: true }` | 源扫零 `model` 键（store 档该行） |
| ② | `thincoder-desktop/renderer/views/settings.mjs:205` | 面模型投影 `model: settings.env?.proxy?.model === true,`（`#1090` ② 与 `#1126` ① 同一行——一笔两账） | 该行删（投影余项零动；envBody 本已忽略该键 ⇒ 功能零影响） | 源扫零 `proxy?.model` 命中 |
| ③ | `thincoder-cli/src/tui/cmd-config.mjs:135-139`（seturi）∥ `:144`（toggleweb） | 写径不归一：seturi `{ ...raw.proxy, uri: newUri }` **保留盘上任意残键**；toggleweb `{ ...pc, web }` 归一重建（`pc` = 已归一 `{uri, web}`） | 口径统一 = **写即归一**：seturi 亦 `{ uri, web }` 两键重建（`web` 缺省 true 沿现口径 `!pc.web ? OFF : ON`） | 两写径读回同形（`{uri,web}`）；盘上残键读后即清 |
| ④ | `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs:255 ∥ :437` | 两处夹具 seed 仍携 `proxy: { …, model: false }` | 去 `model` 键（夹具随现形；**断言面零改**） | 该件实跑 8/8 绿（本席 2026-10-10 实读）；夹具零 `model` 字面 |
| ⑤ | `docs/batches/2026-10-08-proxy-per-channel.test.mjs:318-347`（T8） | T8 覆盖三档（`views/settings-sections-env.mjs` ∥ `mount-settings-reads.mjs` ∥ `src/main/settings-env.mjs`）；`:323` 注自陈「**store ∥ views 两档残留已登记**（§5 A案 报表项 2）」 | **扩腿 2 行**：加 `renderer/store.mjs` ∥ `renderer/views/settings.mjs` 两档零残断言（容错形 = `proxy.model` ∥ `proxy?.model` ∥ `proxy: {…model…}` 三形态零命中）；本体三档断言零动 | T8 实跑绿（本席实读）；两新档断言在场 |
| ⑥ | `thincoder-desktop/renderer/store.mjs:119`（种子）∥ `mount-settings-exits.mjs:173` ∥ `mount-settings-reads.mjs:71`（两写点） | 切片 `settings.defaultModel` **写而不读**（renderer 全域实读零读点——本席 grep） | **删**（种子 + 两写点的 `defaultModel:` 键；同拍余键零动） | 源扫 `settings.defaultModel` 零命中（**留面明辨**：`provider:list` **回执**的 `defaultModel` 键 = 活面，`mount-settings-reads.mjs:35-39` `activeModel()` 直读——**不动**） |

**机制设计 · `#1125`（视觉渠道判定源 · 落 B「明书不恢复」——父裁 2026-10-10）**

现状（实读）：`thincoder-core/vision-reader.mjs:31-36` `findVisionChannel(providers, currentName)` 恒 `null`（判定源 = 渠道单值模型，随 2026-10-09 清除批退场）；消费方（核 `runVisionReader` 内 `:45-46`；VSC `image-handler.mjs` ∥ 桌面 `src/main/attachments.mjs` 降级适配器）`null` ⇒ 走既有「无视觉渠道」可读报错径（F-IDG-2——不静默丢图）。

| 案 | 内容 | 成本/收益 | 边界 |
|---|---|---|---|
| **B（明书不恢复——落定 · 活判据）** | 保留恒 `null`，把「非视觉 + 贴图 ⇒ 可读报错」写实为常规态 | 成本 = 两处措辞；收益 = 零新增判定面 | 「判定源重定在途」措辞清零（D8） |
| A（恢复快乐径——降为上抛项 2：须先定义载体） | 判定源 = 渠道 `models[]` 勾选集 × `specForModel(m).multimodal`（逐渠扫其勾选集，命中真值 ⇒ `{ provider, model }`，同渠名优先 `currentName`） | —（载体现盘不存在 ⇒ 暂不可实施） | 若要 A 须先裁定载体是什么；立 A 亦须零网络（不引运行期探针——沿 M9） |

**裁定 = B（父裁 2026-10-10；收正 §1 父裁① 之 A-默认径，§1 不改）**。依据（评审 §3 发现 1 逐点核读）：A 的判定源载体「渠道 `models[]` 勾选集」现盘不存在——`models[]` 整字段随 2026-10-09 清除批退场（`PROVIDER.md:572` D-PR11 ∥ `thincoder-core/config.mjs:5` ∥ `config-migrate.mjs:50` ∥ `model-ref.mjs:7` ∥ `config-io.mjs:153-154`（渠条一律删 `p.model`）；VSC `presets.mjs:107`）；零网络约束（M9 禁运行期探针）下无逐渠模型源可扫 ⇒ 核侧渠条目零模型信息，A 按现盘恒 `null`（与 B 行为等价）⇒ **落 B**；A 降为上抛项 2。

**机制设计 · `#1127`（`vision-channel.mjs` 存废裁决）**

裁决 = **删**。依据（本席实读）：该档 11 行 = 纯 re-export（`export { findVisionChannel } from "@thincoder/core/vision-reader.mjs"`，档头自陈「仓内零 import——2026-10-09 复核」）；`thincoder-vscode` 全树静态 ∥ 动态引用零命中（余皆 `.vsix` 打包件 ∥ `_archive` 文档 ∥ tmp 清单）；「留形备引」自 parity-b4 D-6/D-7 起从未被引（D-7 已登记 dead module）。随动 = 三处 doc 指针（否则 D4 悬空）：`docs/core/design/API-CONTRACT.md:3298` 导出行改指核单源（`thincoder-core/vision-reader.mjs`）∥ `docs/core/design/MODEL-SPECS.md:179 ∥ :215 ∥ :2136`（消费点清单）该点退场 + 计数随动（八 ⇒ 七；若实读为其他值以实读为准）∥ `docs/core/design/CORE-UNIFICATION.md:328`（端特有档盘点）枚举随正。备引面若日后需要 ⇒ VSC 直引核件（与 `image-handler.mjs` 同形），不重建薄壳。

**受影响文件与测试面（现行 = 本席实读 2026-10-10；实施轮首步对盘实读为准）**

| 文件 | 现读（行） | 改动 | 预期 |
|---|---|---|---|
| `thincoder-render-core/composer/model-menu.mjs` | 455 | 行件语义 + toggle + 拾取单点 + `row` 键 + 注文重写 | ±0 量级（净 ±10 内） |
| `thincoder-desktop/renderer/composer-wire.mjs` | 286 | `writePrefs` 失败 ⇒ 失败态 + 回滚钩 | +≈8 |
| `thincoder-desktop/renderer/composer-sync.mjs` | 328 | 失败行词路由（`prefs-failed`） | +≈4 |
| `thincoder-desktop/renderer/mount-composer.mjs` | 299 | 回滚钩注入（槽现值读面） | +≈2（**注意 ≤300 顾问线**——越线则拆点登记） |
| `thincoder-desktop/renderer/i18n-views.mjs` | 410 | 新键 `composer.prefs.failed`（两语） | +2 |
| `thincoder-desktop/src/main/agent-host.mjs` | 333 | 回执叠加 `carryover` 码 | +≈3 |
| `thincoder-desktop/renderer/store.mjs` | 370 | ① 种子两键 ⑥ `defaultModel` 种子删 | −1 |
| `thincoder-desktop/renderer/views/settings.mjs` | 437 | ② 投影行删 | −1 |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | 310 | ⑥ 写点键删 | ±0 |
| `thincoder-desktop/renderer/mount-settings-reads.mjs` | 211 | ⑥ 写点键删 | ±0 |
| `thincoder-cli/src/tui/cmd-config.mjs` | 487 | ③ seturi 写即归一 | ±2 |
| `thincoder-core/vision-reader.mjs` | 69 | `#1125` 落 B：恒 `null` 保持 + 措辞写实 | ±2 |
| `thincoder-vscode/src/extension/vision-channel.mjs` | 11 | **删档** | −11 |
| `docs/batches/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs` | 526 | ④ 夹具两处去键 | ±0 |
| `docs/batches/2026-10-08-proxy-per-channel.test.mjs` | 448 | ⑤ T8 扩腿 2 行 + T4/W2 两断言随现文（父裁②） | +2 ∥ 断言改 2 处（零产品码） |
| `docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs` | 187 | T5 两断言随正（切片退场 ⇒ 断言随正；跨批件 · 处置面 = 父侧笔类） | ±0（断言面） |
| `docs/batches/2026-10-10-purge-residue-sweep.test.mjs` | 新 | 批内件（随批留存，不入仓套件） | 新 |

**批内件（`docs/batches/2026-10-10-purge-residue-sweep.test.mjs` · 腿）**：a）行 toggle 三判（展开 ⇒ 收起 ⇒ 再展开；两态零 post；菜单层恒在场）；b）拾取单点 + `row` 直传（双事件序 ⇒ 恰一次；在场期换行集 ⇒ 仍生效）；c）写失败 ⇒ 失败行在场 + 钮回滚 + 槽零写；d）写回失败 ⇒ 回执携 `carryover` 码。**真机面**（父侧/用户）：桌面模型菜单走查 + 复扫槽档（修前「0 处 `testserver` 写入」⇒ 条目选中后落值）。

**验收对照（批次条目 ↔ 判据 ↔ 回指）**

| 判据 | 内容（机检法） | 回指 |
|---|---|---|
| AC-1121/1 | 行 = 分组/展开控件：点击 = 展开⇄收起；两态皆**零 post 零槽写零 `defaultModel` 写**；行零选中语义（`role=button` + `aria-expanded`，无 `aria-selected`）；组体开合与菜单层开合解耦（行点击不关菜单）；共享核件两端同源——VSC 端三消费面（`settings-models.js` ∥ `settings-providers.js` ∥ `settings-consult-dialog.js`）随核件同拍生效 = 有意（非回归）——批件腿 a | 批件腿 a ∥ 设计档 `RENDER-CORE.md` §5/§7 ∥ `PROVIDER.md` §6.16 |
| AC-1121/2 | 条目拾取恰一次（click 单点）；`row` 直传（菜单在场期换行集仍生效——零静默丢点）；选中后槽档 `activeProvider/activeModel` 落值 ∧ 钮文本/勾选 = 槽现值 ∧ 下一回合取新模型（施加 ∥ 在飞顺延）——批件腿 b + 真机复扫 | 批件腿 b ∥ `COMPOSER.md` §2/§4 ∥ 真机（父侧/用户） |
| AC-1121/3 | 写失败 ⇒ 失败行在场（`data-notice="prefs-failed"`）∧ 钮/选中态回滚槽现值 ∧ 槽零写；写回失败 ⇒ 回执携 `carryover` 码 ∧ 同行可见 ∧ 槽写不反扑——批件腿 c/d | 批件腿 c/d ∥ `IPC.md` §2 ∥ `COMPOSER.md` §2 |
| AC-1090/1–5 | ① store 种子两键 ② views 投影行零命中 ③ cmd-config 两写径读回同形（残键清零）④ M604 夹具零 `model` 字面 ⑤ T8 覆盖 store/views 两档（零残断言在场，T8 实跑绿） | T8 扩腿件 ∥ `SETTINGS.md` §2 ∥ `PROXY.md` §4 |
| AC-10-08/1 | `docs/batches/2026-10-08-proxy-per-channel.test.mjs` 复跑 10/10 绿（T4 ∥ W2 断言随现文——零产品码） | §1 父裁② ∥ 该件实跑 |
| AC-1125/1 | B（活判据）：`findVisionChannel` 恒 `null` ∧「明书不恢复」写实在位 ∧「判定源重定在途」零命中 ∧ 非视觉贴图 ⇒ 可读报错径（不静默丢图） | 设计档 `PROVIDER.md` §6.18 ∥ `vision-reader.mjs` 措辞读回 |
| AC-1126/1–2 | ① `env.proxy.model` 投影零命中（= `#1090`②）② `settings.defaultModel` 切片零命中（种子 + 两写点）+ **回执 `defaultModel` 活面保留**（`activeModel()` 径不动）③ 跨批件 `2026-10-09-provider-default-model-purge-desktop.test.mjs` T5 两断言随正（切片退场 ⇒ 断言随正；该件复跑绿） | 源扫负向锁 ∥ `SETTINGS.md` §2 本批注 ∥ 跨批件（父侧笔类） |
| AC-1127/1–2 | ① 档删（盘上零件；仓内零 import 复核）② 三处 doc 指针不再指向该档（改指核单源 / 退场 + 计数随动） | 源扫 + doc 指针读回 ∥ `API-CONTRACT.md` ∥ `MODEL-SPECS.md` ∥ `CORE-UNIFICATION.md` |

**需求档回指（待主 agent 落笔 · 本席不写需求档）**：`#1121` 的 `req_doc` = `docs/desktop/requirements/PROJECT.md`——建议落一行判据句（行 = 分组/展开、零选中语义、零写；选中仅在模型条目且链全通、写失败可见）。`#1090`（board = proxy）∥ `#1125`（core）∥ `#1126`（desktop）∥ `#1127`（vsc）皆 `tech_todo`（`req_doc` 空）——三方链以「批次条目 ↔ 设计档落点 ↔ 本表判据」闭合，不开需求档行。

**关键决策（含被否形）**

| # | 决策 | 依据 | 被否形（理由） |
|---|---|---|---|
| KD-PRS-1 | 行点击 = **展开⇄收起**（组体开合与菜单层开合解耦） | 用户 2026-10-09/10 口径「行 = 分组/展开、无选中语义」+ 缺陷名「整行点击静默无操作」；父侧 2026-10-10 裁定 A（覆盖 GitHub #4 旧账注文 `model-menu.mjs:248-252`——有意行为） | ① 维持「只保浮出」（= 现形——静默无操作不成立）② 仅展开不收起（展开态缺陷存续）③ 行点击 = 选渠（用户明确否决「渠道默认模型」概念） |
| KD-PRS-2 | 拾取 = **click 单点 + `row` 直传** | 双触发 ⇒ 双发/幽灵点击；回查在菜单在场期换行集 ⇒ 静默丢点（零写） | ① 双触发保留（`mousedown`+`click`）② 保回查（静默丢点）③ 版本号/代际校验（加机器，过重） |
| KD-PRS-3 | 写失败 = **既有失败行通道 + 零乐观写回滚 + 回执 `carryover` 码** | 复用 B21 单点（`recordFailure`）；「写失败静默」全链治；词须与「发送失败」分家 | ① 仅 console（现形）② 新增独立提示机制（第二实现）③ 保留乐观写 + 事后纠正（UI 说谎窗） |
| KD-PRS-4 | `#1125` 落 **B**（恒 `null` +「明书不恢复」写实）——父裁 2026-10-10 | A 载体「渠道 `models[]` 勾选集」现盘不存在（2026-10-09 清除批整字段退场；评审核读）；零网络（M9）下无逐渠模型源 ⇒ A 按现盘恒 `null`（与 B 等价） | ① A 案暂不可实施（降为上抛项 2——须先定载体）② 现场探针（违 M9「运行期零探测」）③ 会话链（本会话模型即非视觉模型——非视觉源） |
| KD-PRS-5 | `#1127` **删**档 + 三处 doc 指针随正 | 11 行纯 re-export；全树零静态 ∥ 零动态引用（实读）；dead 登记已 12 天 | ① 保留备引（零引用 ∥ 无到期条件——例外须带resolution window）② 改薄壳为注释占位（零收益） |

**上抛项**

1. **[已裁·父侧回执 2026-10-10]** `#1121` 行点击两读 ⇒ **读 A**：按 A 落（本段行为表 + AC 收口）；旧账覆盖句在位（「组体开合与浮出层开合解耦」）；若用户后改裁 B ⇒ 仅行为表 + AC 一行随动。
2. **[上抛·待裁]** `#1125` **A 案载体**：现盘无任何 per-channel 勾选集载体（`models[]` 整字段随 2026-10-09 清除批退场——评审 §3 发现 1 核读）；若要 A **须先裁定载体是什么**（该载体写径/读径随入受影响面与 AC）。本批已落 B（AC-1125/1）。
3. **[父裁 2026-10-10]** `docs/batches/2026-10-08-proxy-per-channel.test.mjs` T4/W2 两红（本席实跑 8/10）随本批修（T4 = VSC `providerFromConfig` 径断言 ∥ W2 = TUI 向导「渠道条目携 `model`」旧口径断言；断言随现文、零产品码；判据 = 该件复跑 10/10 绿）——已纳入落地表（受影响表 + AC-10-08/1）。
4. **[上抛·知会]** 历史批件夹具 `proxy.model` 残留（`#1090`④ 只圈 M604，本批零触其余）：实读 ≥8 件——`2026-09-29-desktop-carryover-c1.test.mjs:328/:374` ∥ `2026-09-30-desktop-residuals.test.mjs:192/:202/:344` ∥ `2026-10-01-audit-remediation.test.mjs:160/:169` ∥ `2026-10-02-desktop-settings-menu-upgrade.test.mjs:123/:153` ∥ `2026-10-02-light-round-6.test.mjs:67` ∥ `2026-10-07-add-dialog-unify-desktop.test.mjs:77/:134` ∥ `2026-10-07-provider-config-parity-desktop.test.mjs:92` ∥ `2026-10-08-residue-sweep-desktop.test.mjs:265`；处置 = 随各自面下次触碰 ∥ 另立小项。
5. **[上抛·知会]** 坐标 as-of 漂移（§1 载值 ⇒ 本席实读；同对象同语义；本 §2 用实读值，§1 不动——D4 行号只作 as-of）：`views/settings.mjs:207`⇒`:205` ∥ `cmd-config.mjs:136/:143`⇒`:135-139/:144` ∥ M604 `:255/:439`⇒`:255/:437` ∥ `vision-reader.mjs:34-43`⇒`:31-36`。
6. **[上抛·知会]** M604 件现跑 **8/8 绿**（本席实跑）——此前轮次在册「`:517 ∥ :525` 两断言已红」在现盘不成立；本批对 M604 的动作 = 夹具随正（零断言改）。
7. **[上抛·知会]** `#1127` 删除引动 `MODEL-SPECS.md` 消费点计数（八 ⇒ 七）；该表 as-of 面另有陈旧（`vision-channel.mjs:17` 早已非实读门）——本批只做因删除而生的差额，余表陈旧归文档面。

**边界（零触确认）**：需求档（`docs/desktop/requirements/**` ∥ `docs/core/requirements/**`）= 主 agent 笔，本批只回指不写；`#1167` 批与它簇零触（`thincoder-core/model-specs.mjs` ∥ `thincoder-vscode/src/specs.mjs` ∥ `thincoder-server/public/model-specs-snapshot.mjs` 零动）；prompt 面 ∥ server 面 ∥ 已冻结批档 ∥ 冻结记录零改（历史批**测试件**随正三份：M604 夹具 ∥ 10-08 件（T8 扩腿 + T4/W2）∥ 10-09 件（T5 随正——跨批件 · 父侧笔类））；`thincoder-render-core/composer/panel.mjs`（470）本批零改（回写门 `writebackBlocked` 不动）；工作树现含前轮未提交改动——实施轮基线 = 当刻盘，本批不整树提交（提交随实施轮按面收）。**交付形态 = 设计轮 + 修复轮（2026-10-10）；产品码零改。**

### 修复轮（§3 轮次 1 逐号收正 · 2026-10-10 · eng-designer）
**依据** = §3 轮次 1 发现表（🔴2 ∥ 🟡1 ∥ 🔵3 · VERDICT: changes-required）+ 父侧修复轮派单逐号裁定。
**逐号处置（号 = §3 发现号）**：
1. （🔴）`#1125` 落 **B**（恒 `null` +「明书不恢复」写实、零在途句）——A 载体不存在 ⇒ 降为上抛项 2（须先定载体）；行为面/AC 随动（AC-1125/1 = B 活判据）；并收正 §1 父裁① 之 A-默认径（§1 档不动）。
2. （🔴）受影响表增 `docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs` 行（T5 两断言随正——跨批件 · 处置面 = 父侧笔类）；AC-1126/1–2 机检句补 ③ 条。
3. （🟡）上抛项 3 收正为「[父裁 2026-10-10] T4/W2 两红随本批修（断言随现文、零产品码；判据 = 该件复跑 10/10 绿）——已纳入落地表」；受影响表 10-08 行 + AC-10-08/1 补行。
4. （🔵）行数口径**维持**（±1 惯例——评审核读无需动作）。
5. （🔵）漂移清单并入两处：M604 `:255/:439`⇒`:255/:437` ∥ `vision-reader.mjs:34-43`⇒`:31-36`。
6. （🔵）AC-1121/1 补 VSC 端同源句（三消费面随核件同拍生效 = 有意，非回归）。
**就地修正 17 处（含 2 处新增行——本作者段内）。边界：产品码 ∥ §1 ∥ §3 ∥ 他批档零触。**

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = `docs/batches/2026-10-10-purge-residue-sweep.md` §2（设计轮 · 待评审态）｜范围限制：无 doc 地图（Document ownership 判据降级 · 按 Project Guide 判）；结论基于 §2 全文 + 对盘抽读（`model-menu.mjs` ∥ `composer-wire.mjs` ∥ `agent-host.mjs` ∥ `store.mjs` ∥ `views/settings.mjs` ∥ `mount-settings-*` ∥ `cmd-config.mjs` ∥ `vision-reader.mjs` ∥ `vision-channel.mjs` ∥ `config-io.mjs`/`config.mjs`/`config-migrate.mjs`/`model-ref.mjs` ∥ M604 ∥ T8 ∥ 10-09 purge 桌面件等）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Feasibility ∕ Requirements | 🔴 | `#1125` 案 A 的判定源载体「渠道 `models[]` 勾选集」（批档 `:107`「判定源重定为**渠道 `models[]` 勾选集 × `specForModel(m).multimodal`**」）在现盘不存在：候选清单字段已随 2026-10-09 清除批整体退场——`PROVIDER.md:572`「| D-PR11 | `models[]` 候选清单**整字段退场**」· `config.mjs:5`「the candidates list field models[] is gone」· `config-migrate.mjs:50`「if (p.models !== undefined) { delete p.models; changed = true }」· `model-ref.mjs:7`「候选清单字段 `models[]` 均已退场」· VSC `presets.mjs:107`「候选清单字段已退场」；且 `resolveProviders()` 并删渠条目单值模型（`config-io.mjs:153`「渠道不携模型——一律删，不落任何回退」+ `:154` `delete p.model`）⇒ 核侧 `findVisionChannel(providers, …)` 拿到的渠条目零模型信息。设计自设「零网络（**不引运行期探针**——沿 M9「运行期零探测」）」（`:107`）⇒ 唯一现存的逐渠模型源（运行期 `GET /models`）被排除。故按现设计 A 恒 `null`（无载可扫），A 与 B 行为等价——AC-1125/1 的 A 支（`:147`「A ⇒ `findVisionChannel` 命中（勾选集含视觉模型时非 null）」）不可达，而 §1 父裁①把 A 设为默认路径 ⇒ 默认径被堵；设计自陈「A 的不确定面仅「勾选集是否普遍在位」」（`:110`）低估实况（不是「是否在位」——是无载体）；受影响面单列 `vision-reader.mjs` +≈15（`:131`）的成本模型也装不下「建载体 + 写径 + 读径」。⇒ 呈用户的 A ∥ B 二选一在现盘 A 侧失实 | A 的判定源须点名现盘**实际存在**的持久载体（连同该载体的写径/读径列入受影响文件表与 AC）；若零网络约束下不存在这种载体 ⇒ 默认口径须改落 B（或先补载体面再裁 A）——二者择一落实到设计面 |
| 2 | Requirements coverage ∕ Affected files | 🔴 | `#1126`② 删 `mount-settings-reads.mjs:71` 的 `defaultModel:` 写键（批档 `:99`「**删**（种子 + 两写点的 `defaultModel:` 键；同拍余键零动）」+ 受影响表 `:129`「⑥ 写点键删」），但该写点被现存批件断言直读：`docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs:117`「assert.equal(hit.settings.defaultModel, "alpha:m1", "存储切片 `defaultModel` 应同源落值")」（同件 `:124` 断 `null`；assert 源 = `node:assert/strict`（`:13`）；T5 的 drive 以 `settings: {}` 起手、直调真 `loadProviders`（`:94-108`））⇒ 删键后 T5 必红。该件既不在受影响文件表、也不在「≥8 件夹具残留」披露面（上抛项 4）；批档 `:173` 明言历史批测试件「仅两份…随正：M604 夹具 ∥ T8 扩腿」⇒ 按设计实施即产生未披露红件 | 受影响面与 AC 补该件（T5 断言随正 ∥ 明记「切片退场 ⇒ 该断言退场」），或撤回该写键删除 —— 二择一 |
| 3 | Methodology ∕ scope（doc-state） | 🟡 | §1 父裁②（`:24`「10-08 代理件 T4/W2 两红——随本批实施臂同拍修（断言随现文、零产品码；判据 = 该件复跑 10/10 绿）」）与 §2 上抛项 3（`:167`「**不在本批射程**（§1 只圈 T8 扩腿）⇒ 处置请裁（随本批随正 ∥ 另立小项 ∥ 归原批回访）」）相抵；§2 受影响文件表与验收对照均未载 T4/W2 断言随正，也未载「10/10 绿」判据 | §1 ∥ §2 收为单一状态：把父裁②落进 §2（受影响文件 + AC 一行），或明记该裁决被取代 —— 择一收口 |
| 4 | Affected-file size annotations | 🔵 | 行数抽检 14 档：读回与表值全在 ±1 内（read 口径 +1 八档：`model-menu.mjs` 456∥455 · `composer-wire.mjs` 287∥286 · `store.mjs` 371∥370 · `views/settings.mjs` 438∥437 · `mount-settings-exits.mjs` 311∥310 · `mount-settings-reads.mjs` 212∥211 · M604 527∥526 · T8 449∥448；逐值全同：`agent-host.mjs` 333 · `vision-reader.mjs` 69 · `vision-channel.mjs` 11 · `mount-composer.mjs` 299 · `i18n-views.mjs` 410；`panel.mjs` ≈470）；无档越 500/800 层；`mount-composer` 299+2⇒301 越自引 300 线已自披露（「越线则拆点登记」） | 无需动作（±1 口径沿项目在册惯例） |
| 5 | Clarity（坐标） | 🔵 | §1 两处坐标漂移未入上抛项 5 清单：§1 #1090 载 M604 `:255/:439`（现盘实读 `:255/:437`——§2 已用 `:437`）· §1 #1125 载 `vision-reader.mjs:34-43`（§2 实读 `:31-36`）；§2 自身用实读值 | 可把两处并入上抛项 5 漂移清单（D4 as-of 口径）或维持 |
| 6 | Clarity ∕ scope | 🔵 | 行语义变更住共享核件 `model-menu.mjs`（`:57`「（桌面 ∥ VSC 同源核件）」）：`providerRow`/`openFlyout` 由 VSC 设置族三档（`settings-models.js:127` ∥ `settings-providers.js:85` ∥ `settings-consult-dialog.js:147`）经 `openModelMenu` 同源消费 ⇒ 行点击「展开⇄收起」在 VSC 端同拍生效；AC-1121/1–3 与回指面只点名桌面 + 核件 | AC 或回指面补一句 VSC 端同源非回归（或明记两端同源为有意） |

**计数**：🔴 2 ∥ 🟡 1 ∥ 🔵 3（另：`#1127` 三处 doc 指针均实读存在——`API-CONTRACT.md:3298` ∥ `MODEL-SPECS.md:179/:215/:2136` ∥ `CORE-UNIFICATION.md:328`；核件/批件其余断言面复读全对，不再列）

**VERDICT: changes-required**

### 轮次 2（评审子代理）

评审对象 = `docs/batches/2026-10-10-purge-residue-sweep.md` §2（round 2 · 修复轮逐号复核）。核验基准 = §2 修复轮块（`:179-188`）+ 对盘复读（`thincoder-core/vision-reader.mjs` ∥ `thincoder-desktop/renderer/{mount-settings-reads,mount-settings-exits,store,views/settings}.mjs` ∥ `thincoder-cli/src/tui/cmd-config.mjs` ∥ `thincoder-core/{config,config-io,config-migrate,model-ref}.mjs` ∥ M604 件 ∥ 10-08 件 ∥ 10-09 件 ∥ `docs/core/design/PROVIDER.md`）。范围限制：无 doc 地图（Document ownership 判据降级）；本工具面无执行器 ⇒ 各件「实跑读数」沿用设计席记录（未独立复跑，下表已注）。另：本轮调用附「review surface」清单首件实读为他批（`2026-10-10-server-face-residues.md` · 清账轮簇Ⅱ #1161/#1162/#1169/#1170）——与本批零交集，未纳入；本核验按机械声明执行。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `docs/batches/2026-10-10-purge-residue-sweep.md` | 🔴 | Fixed | `#1125` 落 B：§2:38「落 **B**（恒 `null` +「明书不恢复」写实为常规态）；A 载体不存在——降为上抛项 2」∥ :112「裁定 = B（父裁 2026-10-10；收正 §1 父裁① 之 A-默认径，§1 不改）」∥ AC-1125/1（:151）∥ 上抛项 2（:170）∥ §1 评审回执（:26「（B 为唯一可实施案；A 降为待裁——须先定义载体，上抛留档）」）。对盘核：`thincoder-core/vision-reader.mjs:34-35`「export function findVisionChannel(providers, currentName = "") {」∥「return null」——恒 null 属实；载体退场链在案：`model-ref.mjs:7`「候选清单字段 `models[]` 均已退场」∥ `config-migrate.mjs:50`「delete p.models; changed = true」∥ `config-io.mjs:154`「delete p.model」。 |
| 2 | 2 | 同 #1 ＋ `docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs` | 🔴 | Fixed | 受影响表 :137 增行「T5 两断言随正（切片退场 ⇒ 断言随正；跨批件 · 处置面 = 父侧笔类）」（现读 187——实读吻合）∥ AC-1126/1–2 ③（:152）∥ 边界 :177「历史批**测试件**随正三份：M604 夹具 ∥ 10-08 件（T8 扩腿 + T4/W2）∥ 10-09 件（T5 随正——跨批件 · 父侧笔类）」。完备性复核：全仓测试件仅该件读切片（:117「assert.equal(hit.settings.defaultModel, "alpha:m1"」∥ :124「assert.equal(missing.settings.defaultModel, null)」）；renderer/views 全域零读点（唯一命中 = `views/settings.mjs:148` 注释）⇒ 无第二红件。 |
| 3 | 3 | 同 #1 | 🟡 | Fixed | 上抛项 3（:171）归位父裁②「已纳入落地表（受影响表 + AC-10-08/1）」；受影响表 :136「⑤ T8 扩腿 2 行 + T4/W2 两断言随现文（父裁②）」∥ AC-10-08/1（:150「复跑 10/10 绿（T4 ∥ W2 断言随现文——零产品码）」）；与 §1 父裁② 单一状态。实读吻合：10-08 件 :165（T4）∥ :424（W2；:439「assert.equal(c.provider.model, "m-tui"」= 旧口径断言在案）。注：两红读数未独立复跑（本工具面无执行器）。 |
| 4 | 4 | 同 #1 | 🔵 | Accepted | 修复轮 :185「行数口径**维持**（±1 惯例——评审核读无需动作）」——带理由维持（非静默）。本轮抽核 8 档全 ±1 内：10-09 件 187∥187 · 10-08 件 448∥448 · M604 527∥526 · store.mjs 371∥370 · reads 212∥211 · views/settings.mjs 438∥437 · cmd-config 488∥487 · vision-reader.mjs 69∥69。 |
| 5 | 5 | 同 #1 | 🔵 | Fixed | 上抛项 5（:173）并入两处：M604 `:255/:439`⇒`:255/:437` ∥ `vision-reader.mjs:34-43`⇒`:31-36`；本轮实读吻合（M604:255/:437 夹具 `model: false` 在案；判定函数面在 :34-36）。 |
| 6 | 6 | 同 #1 | 🔵 | Fixed | AC-1121/1（:146）补「共享核件两端同源——VSC 端三消费面（`settings-models.js` ∥ `settings-providers.js` ∥ `settings-consult-dialog.js`）随核件同拍生效 = 有意（非回归）——批件腿 a」句。 |
| 7 | (new) | 同 #1 · `:112` 引用面 | 🔵 | New | §2 :112 证据链引「`PROVIDER.md:572` D-PR11」——实读该行在 `docs/core/design/PROVIDER.md:573`「| D-PR11 | `models[]` 候选清单**整字段退场**」（内容逐字吻合、仅 ±1 坐标）。D4 as-of 口径下不阻塞；可随实施轮坐标复核顺正。 |

**计数**：本轮新增 🔴 0 ∥ 🟡 0 ∥ 🔵 1；前表 6 项全收口（Fixed 5 ∥ Accepted 1）。

**VERDICT: pass**

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（产品码 12 档 + 删档 1 件 + 批内件 9/9 绿；分歧审计 1 轮（无功能偏离）∥ 代码评审 2 轮（round1 🔴 修 → round2 pass）；model-menu 净 +30 越设计预算、composer-wire/composer-sync 超 ≈4/≈11，已披露；父侧/ sibling 面（设计档 9 落点 ∥ 跨批件三档 ∥ 需求档回指）本轮不做）



**交付摘要（eng-coder · 实施轮）**

按 §2 落产品码 12 档 + 删档 1 件 + 批内件新档 1 件（`docs/batches/2026-10-10-purge-residue-sweep.test.mjs` · 腿 a–e · 现读 9/9 绿）。行数账（现读 Δ）：

| 文件 | 现读 | Δ | 改动 |
|---|---|---|---|
| `thincoder-render-core/composer/model-menu.mjs` | 485 | **+30**（超预算） | 行 = 分组/展开控件（`role=button`+`aria-expanded`，零 `aria-selected`）· 行点击 toggle · `closeFlyout` 单点 · 拾取单点（`mousedown` 只防默认）· `onPick` 携 `row` + 回查记错 · `applyModels` 回滚位支 + 回写门闭 · 注文重写 |
| `thincoder-desktop/renderer/composer-wire.mjs` | 298 | +12 | `writePrefs` 失败 ⇒ `recordFailure("session:prefs", receipt, "invalid-shape")`（B21 `source` 分量）+ 回滚钩；成功 ∧ `carryover.ok===false` ⇒ 同一条失败行 |
| `thincoder-desktop/renderer/composer-sync.mjs` | 343 | +15 | `failedNotice` 按 `source` 分家（`prefs-failed` + 新键）；`rollbackPrefs(key)` 导出（槽现值重推 + `rollback:true`） |
| `thincoder-desktop/renderer/mount-composer.mjs` | 300 | +1 | 回滚钩注入 1 行（**恰在 300 顾问线，未越**） |
| `thincoder-desktop/renderer/i18n-views.mjs` | 416 | +6 | 新键 `composer.prefs.failed`（两语 + 各 2 行承因注） |
| `thincoder-desktop/src/main/agent-host.mjs` | 337 | +4 | 写回失败码随回执叠出 `carryover:{ ok:false, reason }`（回执仍 `ok:true`——不反扑） |
| `thincoder-desktop/renderer/store.mjs` | 369 | −1 | ⑥ 种子 `defaultModel` 删 + `env.proxy` 去 `model` |
| `thincoder-desktop/renderer/views/settings.mjs` | 436 | −1 | ② 投影行删 |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | 310 | ±0 | ⑥ 写点键删 |
| `thincoder-desktop/renderer/mount-settings-reads.mjs` | 210 | −1 | ⑥ 写点键删 |
| `thincoder-cli/src/tui/cmd-config.mjs` | 486 | −1 | ③ seturi 写即归一（两键重建 `{ uri, web }`——退役残键随写清零） |
| `thincoder-core/vision-reader.mjs` | 70 | +1 | `#1125` 落 B：恒 `null` +「明书不恢复」写实（失效表述清零） |
| `thincoder-vscode/src/extension/vision-channel.mjs` | — | −11 | **删档**（零 import 复核在批内件腿 e-2） |

**决策透明表（实现面）**

| # | 决策 | 依据 | 与设计的关系 |
|---|---|---|---|
| 1 | 回滚钩本体落 `composer-sync.mjs`（`rollbackPrefs` —— 复用 `prefsOf` + `push` 单点），`mount-composer.mjs` 只注入 1 行 | 核件只提供「推送 + `applyModels`」一条重派生通道；`prefsOf`（端 effort→核 reasoning 映射）住派生面档 | 设计表把该钩记在 `mount-composer`（「回滚钩注入（槽现值读面）」+≈2）——**落点微移**（注入仍在本档；本体取复用单点） |
| 2 | `models` 推送新增布尔位 `rollback`（回滚重推专属标记） | 需要可判别信号：① 满足「槽复合缺 ⇒ 钮回空态」（常规空复合推送须零变）；② 本轮 fix 后的回写门闭（`m.rollback !== true`）同吃该位 | 设计未点名该位——为实现设计句所必需的最小机制，已在代码注与本节披露 |
| 3 | 无界自激修复 = 核件回写门闭（`!blocked() && m.rollback !== true`），非写面加锁 | 单点（核）优于双实现；写面零第二条 | fix 轮自评审 🔴 收正（见下） |

**预期外 / 超预算**

- `model-menu.mjs` 净 **+30**（设计表载 455、预期「净 ±10 内」）——**越预算**，未越 500 硬限。构成 = 设计要求的四行为代码（toggle 4 ∥ `closeFlyout` 8 ∥ 行件语义 2 ∥ 回滚支 + 回写门 6 ∥ `row`/回查 2）+ 承因注文（D9「带因」）。父侧如需压回预算，建议只剩注文可压（如实读读数）。
- `composer-wire.mjs` +12（预算 +≈8）∥ `composer-sync.mjs` +15（预算 +≈4）∥ `i18n-views.mjs` +6（预算 +2）——同为承因注文 + 决策 1 的落点微移所致，如实报。

**审计与评审轮次 · 终态 = `clean`**

- 内部分歧审计（1 轮）：**无功能偏离**；唯一命中 = `model-menu.mjs` 行数超预算（🟡，见上）。AC-1121/1–3 ∥ AC-1090/1–3 ∥ AC-1125/1 ∥ AC-1126/1–2①② ∥ AC-1127/1 逐条比中。
- 代码评审（advisor · 2 轮）：**round1 = changes-required**（1 🔴：回滚重推复用核 `applyModels` 时走 `match` 支的自动回写 ⇒ 多余槽写 + 系统性失败（`slot-missing` 等）下「失败 ⇒ 回滚 ⇒ 回写 ⇒ 失败」无界自激；另 1 🟡-可选：写径成功无失败行清点；1 🟡：腿 c-1 负向锁不咬；3 🔵 报告项）⇒ **fix 轮 1 次** ⇒ **round2 = pass**（非阻塞剩余：1 🟡-可选 ∥ 3 🔵）。
- fix 轮（1 轮 · 红绿证）：临时撤修 ⇒ 腿 c-1 红（`回滚零回写…` 断言命中）⇒ 复修 ⇒ 批内件 9/9 绿。修 = `model-menu.mjs:438` 回写门加 `m.rollback !== true` + 腿 c-1 负向锁升级为全量 `session:prefs` 计数 + 60ms 自激窗。

**本轮不做（父侧 / sibling 面，已如实披露）**

- 设计档落点（§2 表列 9 档）+ `#1127` 三处 doc 指针与计数随动 ∥ 需求档回指行 ∥ 跨批件三档（10-08 T8 扩腿 + T4/W2 随正、10-09 T5 两断言、M604 夹具两处去键——**父侧笔类，本席只读**）。
- 🟡-可选（待裁）：写径成功后失败行（`prefs-failed`）无清点 ⇒ 随后成功切换仍滞留旧行至下一次发送受理。建议修 = 成功径按 `source === "session:prefs"` 清 `failed` 并 `repaint()`（需父侧裁行生命周期口径——设计未定）。
- 🟡-可选（待裁）：`composer-wire` 的 `failed` 单槽兼住发送 ∥ 偏好两源，清点规则分源需设计口径。
- 🔵 报告项：`model-menu.mjs` 行数超预算读数 ∥ `vision-reader.mjs:4` 档头仍指已删薄壳（沿革句未补）∥ `renderer/i18n.mjs` 键链台账未随本批 +1 键续计（该档不在受影响表）∥ `2026-10-03-default-model-carryover` T3 红 = 2026-10-09 批 load-time 迁移写回（`migrateLegacyModelFields`）所致，非本批因（诊断探针实证后即删）。

**只读复跑读数（无改动指令面）**

批内件 9/9 ∥ `2026-09-29-model-menu-parity` 9/9 ∥ `2026-10-04-desktop-model-switch-unlock` 6/6 ∥ `2026-10-01-batch-file-mount-normalize` 4/4 ∥ `2026-10-09-…-purge-core` 17/17 ∥ `…-purge-cli` 8/8 ∥ `2026-10-07-provider-config-parity-cli` 4/4 ∥ M604 10/10 ∥ 10-08 9/10（W2 红 · 跨批件）∥ 10-09 desktop 7/8（T5 红 · 切片退场，父侧笔）∥ `2026-10-03-default-model-carryover` 6/7（T3 红 · 非本批因）。

## §6 验证与收口（父代理）

**交付物**：产品面 7/7 ✅（eng-coder #101）—— `#1121`① 行件语义（`role="button"` + `aria-expanded`；点击 = 展开⇄收起；两态零 post）∥ ② 拾取单点（`mousedown` 仅 `preventDefault` + `onPick` 携 `row`）∥ ③ 写失败（`prefs-failed` 行 + 新键两语 + 钮/态回滚槽现值 + 槽零写；回执 `carryover:{ok:false,reason}`）∥ `#1090`/`#1126` 种子两键删 ∥ `#1125` 落 **B**（恒 `null` +「明书不恢复」；A 须先定义载体）∥ `#1127` 删档（`vision-channel.mjs` 除，仓内零 import）∥ 批内件 9/9。

**父侧验证读数**：批内件 **9/9 绿**（父侧实跑 · 867ms · `--import rc-resolve` 形）∥ **跨批件三件随正（父侧笔 · 8 处 · 可 revert）**：10-09 件 **8/8**（T5 两断言随切片退场）∥ 10-08 件 **10/10**（W2 旧口径翻转 + T8 扩腿 store/views 两档——三形态容错）∥ M604 **10/10**（夹具两处 `model:false` 去键——断言零改）。

**评审终态**：代码评审 2 圆——round1 changes-required（🔴1 回滚径再写槽/系统性失败无界自激 + 🟡1 腿锁不咬）→ fix 轮（回写门 `m.rollback !== true` + 腿升级全量写径计数 + 60ms 自激窗）→ round2 **pass**；探索审计 1 轮（唯一命中 = 行数超预算——已披露）；终态 = clean。

**上抛处置**：① `prefs-failed` 无成功径清点（评审 🟡-可选）⇒ 裁向 = 成功径清点——入账 **#1189** ∥ ② `rollback` 布尔位（设计未点名的最小判别信号；代码注 + §5 披露）⇒ **接受** ∥ ③ i18n.mjs 键链计数 +1 ⇒ 入账 **#1190** ∥ ④ `vision-reader.mjs:4` 沿革句 ⇒ 并入 **#1187** ∥ ⑤ carryover T3 红（非本批因——探针实证）⇒ 入账 **#1191**。

**未落项（归 #102 sibling 面）**：设计档落点 9 档 + `#1127` 三处 doc 指针/计数随动 + 需求档回指行（现读 `PROVIDER.md:328` ∥ `API-CONTRACT.md:3298` 仍为旧表述——doc-check 锚 5 项在飞）；真机走查（菜单展开⇄收起 ∥ 槽档落值复扫）= 用户面（不阻收口）。

**结算**：#1121 ∥ #1090 ∥ #1126 ∥ #1125 ∥ #1127 ⇒ 核销（evidence = 本档 + 9/9 读数）。**待办**：波尾 scoped commit；#102 文档面收尾。
