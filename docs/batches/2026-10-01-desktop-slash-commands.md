# 2026-10-01 · 桌面 slash 命令
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 02:23–02:26 走查（敲 `/model` 无反应）+「要啊」+「开批」——桌面 composer 认 slash 命令；轻通道轮四同夜、独立批。。
> 台账 = #761（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-01）**

- **本批性质**：用户走查能力缺口修复批——桌面 composer 敲 `/model` 无反应（原样进文本）⇒ 认 slash 命令。
- **用户原话（逐字）**：① 02:23 敲「/model」（无反应——实读：`renderer/` 全域零 `/xxx` 文本命令解析）；② 02:23「要啊。」（记一笔 ⇒ 立为需求 #761）；③ 02:26「开批」（立批）。
- **旧裁处置**：2026-09-26「桌面输入面板对齐批」§1.1「斜杠命令不是必须项」= 已废（本轮以 02:23 口径为准；记录面留史）。
- **批件**：① 用户令 = 桌面 composer 认 slash 命令（首例 `/model`）；② 行为标杆 = CLI 实形（两端逐字对位）；③ 复用优先（核/共享件优先）。
- **状态行**：进行中（设计完成——§2 在盘；评审待用户点火）。

**增量（用户 04:15 直斥）**：「你他妈的help都没有，你做slash命令谁知道怎么用啊？」——`/help` 原归「另批 14」**判错**：可发现性 = slash 功能的入口（没有它 = 功能残废）；**现拉回本批**：增量设计轮点火（`/help` = 桌面可用命令表 + 逐命令用法（含别名）；内容单源 = 命令表本体；输出形式选型 = 对位既有面（浮层 ∥ 流内信息行 ∥ toast 扩展）；未实装呈现按「零假面」纪律；未知命令反馈顺携「/help」指引；键位补全（Tab）仍挂用户裁定）。

**上抛/列报清付（父侧直执行 · 可回退 —— 2026-10-01 06:1x）**：承 §5 上抛 1 ∥ 2——**设计档收正已落**：`RENDER-CORE.md` ×7 处（`:78` ∥ `:235`×2 ∥ `:236` ∥ `:237` ∥ `:238` ∥ `:389`——「转发形」残句 ⇒ **端侧表构造期闭包注入**实态：`deps.slash = { commands }`（打印口不在 deps 键内）∥ `ctx` 零改 ∥ panel 489 零触/硬限余 11）∥ `PROJECT.md` ×2 处（`:1149` panel 行零触收正 ∥ `:329` i18n 实读 **404** + 续期句）。**记录面**：§2.10 中段残句（`:251` ∥ `:257` ∥ `:269`）= 以同档终形块（`:386-388`）∥ §3 轮次 3 裁单 ∥ §5 上抛表为准（留史，不回改）。**列报 3**（注释残句：`panel.mjs:31` ∥ `views/chat.mjs:29-43`）= 留档随该二档下次触碰；**列报 4**（E13 常驻机检空缺）= 需另批立探针件（零动作）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计轮 initial + 修复轮 1–3 + 增量块（/help · §2.10）落位 · 2026-10-01）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（设计轮 initial · 2026-10-01）

### §2.1 本批条目（覆盖 · 需求档落笔 = 父侧——建议文本见 §2.9）

| # | 条目（= 需求行候选） | 判据（机检面） |
|---|---|---|
| E1 | **机制**：桌面 composer 认 slash 命令——触发判据同 CLI（trim 后首字符 `/`；命令名大小写不敏感；别名解析）；命中 ⇒ **本地执行、不进消息径**（零 `msg:send` ∕ `queuedUserMessage` 上行 · 零用户块 · 零 loading）。 | 核件纯函数单测（批内件）+ 真机：`/model` ⇒ 菜单在场 ∧ 输入框清空 ∧ 零 user 块 |
| E2 | **首例 `/model`**：开模型菜单（与模型 chip 点击**同一菜单、同一函数**）；忙态 ∕ 挂起期同门（拒 + toast）。 | 真机：`.mm-overlay` 在场；忙态 ⇒ 拒且文本保留 |
| E3 | **同钮同径三条**：`/auto`（含 AUTO 开启确认门）· `/plan`（含 ENG×PLAN 互斥）· `/eng`（含宿主入口门）——与三钮同函数。 | 真机各一条（钮态翻转 ∕ 确认 popover 在场） |
| E4 | **未知命令回落（CLI 同判——不发送）**：本端 = toast `slash.unknown <name>` + **文本保留** + 不入历史。 | 真机：`/nope` ⇒ toast 在场 ∧ 文本保留 ∧ 零 user 块 |
| E5 | **忙态 ∕ 挂起期口径**：命令与钮同门（模型径拒；模式三钮可用——机制差异在册）。 | 真机 |
| E6 | **命令表纪律**：在册命令与别名 ⊆ CLI 表（不得自创命令）。 | 批内单测读 CLI 档断言 |

### §2.2 设计档落点

- **核面（机制单源）** = `docs/render-core/design/RENDER-CORE.md`：本批增 **KD-RC-12**（斜径机制入核 ∥ 命令表归端）+ §5 接口面（`composer/slash.mjs` 纯函数 ∥ 面板 `deps.slash` 注入面 ∥ 动作句柄面）+ §6 随动 + §9 边界（补全 ∥ 其余命令）。
- **端面（桌面输入面语义）** = `docs/desktop/design/UI.md`：输入区行指针 + 本批注（slash 命令面）+ 表行 15（`/:` 键位组）收正。
- **端面（文件账）** = `docs/desktop/design/PROJECT.md` §4.2 本批行（现行 ⇒ 预期）。
- 需求档（D 行）**= 父侧笔**（本舱零触；建议文本 = §2.9）。

### §2.3 行为对位表（第一交付物）

**坐标（实读）**：CLI = `thincoder-cli/src/tui/slash-commands.mjs`（表 `:40-68` ∥ 别名 `:71` ∥ 分发 `:113-131` ∥ 补全 `:134-186`）· `turn-face.mjs:37-41`（触发）· `key-handler-busy.mjs:24-27`（忙态门）；VSC = `thincoder-vscode/webview/**` 零斜杠面 + 核 `thincoder-core/queued.mjs:48`（队列分类）；桌面 = `thincoder-render-core/composer/panel.mjs:281-344`（提交面现无斜径）。

| 面 | 命令集 | 触发判据 | 补全 | 未知命令回落 | 忙态 ∥ 流式期 |
|---|---|---|---|---|---|
| **CLI** | 27 条 + 别名 7（`/h /x /m /p /t /c /n`） | 提交文本 trim 后 `startsWith("/")`；首 token 小写 + 别名解析；命中 ⇒ 本地面执行、**不入 agent 环**（`turn-face.mjs:35-41`） | **Tab**：命令名前缀候选 + 参数面候选（`/model` ⇒ 渠道名 ∕ `/think` ⇒ 档位枚举…），Tab 循环替换（`:172-186`） | **流内错误行** `Unknown command: X`（`:130`）——**不发送**（无 handler 即返回） | 忙（processing 含 digest）：**全吞 + 提示**（`key-handler-busy.mjs:24-27`——斜杠禁发，文本保留）；挂起空闲 ⇒ 直走 submit（可执行） |
| **VSC** | **无命令面**（webview 零解析：`handleSlash` ∕ `SLASH_COMMANDS` ∕ `Unknown command` 全树零命中） | — | — | — | — |
| **VSC（队列面·核件）** | 无执行面；`/` 条目仅按核 `planQueuedInput` 分类为**单条取**（保序 ∕ 不合并——`queued.mjs:48`；取项后按**普通消息投递**：`queued-pickup.mjs:40` ∕ VSC `panel-turn-stages.mjs:244-249`） | | | | |
| **桌面（本批后）** | **4 条在册**（`/model` ∥ `/auto` ∥ `/plan` ∥ `/eng`）+ 别名 2（`/m` ∥ `/p`——CLI 表子集） | 同 CLI 判据（trim 后首字符 `/`；大小写不敏感；别名解析）；命中 ⇒ **本地执行、零上行**（面板提交面拦截） | **不做**（边界 §2.8 + 另批——Tab = Web 焦点键，接管需用户裁定） | **toast** `slash.unknown: <name>` + **文本保留**（差异在册：CLI = 清框 + 流内错误行；桌面无本地面流写入 ⇒ toast） | **同钮门**：`/model` 非 idle 拒（= 模型钮 `disabled` 同判据）+ toast `slash.busy`、**文本保留**；模式三钮无门 ⇒ 可执行（**机制差异在册**：CLI 忙态全吞——桌面钮径本就忙期可用，命令面与钮面同门为一致性优先） |

### §2.4 命令面范围（CLI 现表实读 = **27 条** · 别名 7 · `thincoder-cli/src/tui/slash-commands.mjs`）

三值处置：**本批**（实施）· **另批**（有对位面 ∕ 有明确路径，下批候选）· **不做**（无对位面 ∕ 语义不适用）。

| CLI 命令 | CLI 语义（实读） | 桌面既有对位面 | 处置 | 理由 |
|---|---|---|---|---|
| `/model` | 裸 = 开模型 picker；携参 = 会话级直切（`cmd-model.mjs`） | 模型钮两级菜单（核件） | **本批** | 首例；同一菜单第二入口；携参形另批（候选校验面） |
| `/auto` | 直翻 auto-approve | AUTO 钮（核件） | **本批** | 同钮同径；桌面保留开启确认门（差异在册） |
| `/plan` | 直翻 plan mode（ENG ⇒ 拒） | PLAN 钮（核件） | **本批** | 同钮同径（ENG 互斥由钮门承载） |
| `/eng` | 直翻工程模式（ON 向入口门） | ENG 钮（核件） | **本批** | 同钮同径（宿主门 = 核 `resolveEngineeringManifest` 单源） |
| `/think` | Auto ∥ Thinking 开关 ∥ 档位 = 三族菜单 | 推理档位下拉（半面） | **另批** | 面不齐——先补 thinking 面（Auto/开关两族）再开口（不开口 = 零假承诺） |
| `/advisor` | model ∥ thinking ∥ guard 配置菜单 | ADVISOR 钮（仅 guard）+ 设置面 advisor 段 | **另批** | 同上（配置族住设置面——随段锚批） |
| `/submodel` | 子代理模型逐类 | 设置面 agent 段（六槽） | **另批** | 需设置面段锚口（现 `openSettings()` 无参） |
| `/shell` | bash 工具 shell 设置 | 设置面 env 段 | **另批** | 同上（段锚口） |
| `/config` | agent 配置（embedding ∥ proxy ∥ turns ∥ …） | 设置面七段 | **另批** | 同上（段锚口） |
| `/mcp` | MCP 服务器管理 | 设置面 MCP 段 | **另批** | 同上（段锚口） |
| `/reindex` | 重建记忆索引 | 设置面 tools 段（索引行） | **另批** | 同上（段锚口 + 动作面） |
| `/new` | 新会话 | 会话控制「新建」钮 | **另批** | 需会话控制面句柄口 |
| `/session` | 会话列表 ∕ 切换 | 会话控制选择器 | **另批** | 同上 |
| `/rename` | 改名当前会话 | 行内改名形 | **另批** | 同上 |
| `/goal` | 目标 set ∕ view ∕ cancel | 目标卡（仅读面） | **另批** | 需写入面 |
| `/timers` | 计时只读列表 | 状态行 ⏰N（读数） | **另批** | 需列表面 |
| `/help` | 命令列表 | — | **另批** | 需列表面（候选 = 核件浮层族；随命令面扩展批） |
| `/copy` | 复制末条助手回复 | — | **另批** | 需剪贴板面复立（自建复制面已随对齐批退场） |
| `/undo` | 撤销近期文件改动 | — | **不做** | 无对位面（桌面无检查点 ∕ 撤销面） |
| `/restore` | 恢复检查点 | — | **不做** | 同上 |
| `/clear` | 终端清屏 | — | **不做** | 终端屏语义——对话流域无对位（会话数据面另有新建 ∕ 切换） |
| `/fold` | 全局结果折叠开关 | — | **不做** | 无全局折叠态（工具卡逐卡折叠为既有形态） |
| `/init` | 生成 AGENTS.md 骨架 | — | **不做** | 无对位面（需生成 ∕ 预览面） |
| `/skills` | 技能列表 | — | **不做** | 无对位面 |
| `/extract` | 会话知识蒸馏 | — | **不做** | 无对位面（CLI distill 工作流） |
| `/upgrade` | 检查更新 ∕ 升级 | — | **不做** | 桌面为封装应用——升级走分发面（无 CLI 式应用内升级语义） |
| `/exit` | 退出 | — | **不做** | 窗口级——系统 ∕ 窗口控件承载（命令面无对位） |

**计数（D3）**：本批 **4** ∥ 另批 **14** ∥ 不做 **9** = **27**（与 CLI 表现读逐名相等）。**未在册者一律走未知回落**（不解析为半成品面——二级「未实装」反馈类 = 被否候选，见 §2.8）。

### §2.5 机制设计（要点——机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-12 ∥ §5；端面语义单源 = `docs/desktop/design/UI.md` 本批注）

1. **复用优先核查结论（实读）**：全树**无既有斜杠机制**可复用——CLI 表 = CLI 自持（Node 侧 `thincoder-cli/src/tui/slash-commands.mjs`，渲染面不可引）；核 `thincoder-core/queued.mjs:48` 只做队列分类（无执行面）；VSC 无面。⇒ **新建机制落共享层**（render-core），命令表归端：
   - **核件 `composer/slash.mjs`（拟新增 · 纯函数）**：`parseSlash(text)`（判据 = trim 后首字符 `/`；首 token 小写；余 = `args`）· `routeSlash(text, commands)` → `{ kind:"command", cmd, args }` ∥ `{ kind:"unknown", name }` ∥ `null`（非斜径）。条目形 = `{ name, aliases?, run(ctx) → boolean }`。
   - **核件 `composer/panel.mjs`**：`deps.slash = { commands }`（**可选——不传 ⇒ 现行为零变**，VSC 零接缝）；`send()` 在「空文本 → 无会话守卫」之后、「忙态入队」之前拦截斜径：命中 ⇒ `cmd.run(ctx)`（`true` = 已执行 ⇒ **清框 + 入历史**；`false` = 未执行 ⇒ **文本保留**）；未知 ⇒ toast + 文本保留。`ctx = { args, raw, post, actions }`。
   - **动作句柄面（同钮同径实装）**：`actions = { openModelMenu, toggleAuto, togglePlan, toggleEng }`——各 = **钮 handler 提取出的同一函数**（`model-menu.mjs` ∥ `controls.mjs` 提函数 + 导出面；面板装配注入）；门 = 钮自己的门（忙态门 ∥ ENG 互斥 ∥ AUTO 确认门 ∥ 宿主入口门）。
   - **命令表（端侧）**：`thincoder-desktop/renderer/slash-commands.mjs`（拟新增）——4 条 + 别名 `/m` `/p`；`run` 只调 `ctx.actions`（零第二实现）。
2. **反馈三键（×2 语入 `renderer/i18n-views.mjs` 第二档——经注册面进核字典，先例 = `input.slotFull`）**：`slash.unknown`（含 `${name}`——en 逐字 CLI 前段）· `slash.busy`（忙态拒——本端拟定）· `slash.args`（携参不支持——本端拟定）。`/plan` 在 ENG 态拒 ⇒ 复用既有键 `toolbar.planDisabled`。
3. **零上行保证**：斜径不触任何 `post` 消息类型、不置 loading、不写用户块、不触 `onTurnStart` ∥ `onUserEcho`（拦截点 = 提交面首段）。
4. **边界（不做）**：补全（Tab）∥ `/help` ∥ 其余 23 条命令 ∥ 携参直切 ∥ VSC 命令面（如需 = 另批上抛）。VSC 命令面如开 = 另批（本批零接缝）。
5. **行数风险**：`panel.mjs` 现读 **439**（硬限余 61）；本批 ≈ +35 ⇒ ≈474（余 26）。**实施轮触及 500 硬限 ⇒ 先落册在册拆档预案（忙态派生段出档）**。

### §2.6 受影响文件与测试面（现行 = 本舱实读 · 内容行数口径）

**核包（`thincoder-render-core/`）**

| # | 档 | 现行 ⇒ 预期 | 注 |
|---|---|---|---|
| 1 | `composer/slash.mjs`（拟新增） | — ⇒ ≈70 | 纯函数两件（parse ∥ route）+ 条目形注 |
| 2 | `composer/panel.mjs` | **439 ⇒ ≈474** | `deps.slash` ∥ 斜径拦截 ∥ actions 装配 ∥ 反馈；硬限余 26——越限先落拆档 |
| 3 | `composer/model-menu.mjs` | **448 ⇒ ≈460** | 钮 handler 提函数（`open`）+ 导出面——零行为改 |
| 4 | `composer/controls.mjs` | **205 ⇒ ≈222** | 三 toggle 提函数 + 导出面——零行为改 |

**桌面渲染面（`thincoder-desktop/renderer/`）**

| # | 档 | 现行 ⇒ 预期 | 注 |
|---|---|---|---|
| 5 | `slash-commands.mjs`（拟新增） | — ⇒ ≈80 | 命令表 4 条 + 别名 2（全调 `ctx.actions`） |
| 6 | `mount-composer.mjs` | **276 ⇒ ≈282** | +import +`slash` deps（一处装配） |
| 7 | `i18n-views.mjs` | **336 ⇒ ≈343** | +3 键 × 2 语 |

**零触**：`composer-wire.mjs` ∥ `composer-sync.mjs` ∥ `app.mjs` ∥ `index.html` ∥ `composer.css` ∥ `docs/desktop/design/IPC.md`（**零新通道**——全走既有 `session:prefs` ∥ `session:flags` ∥ 设置面出口）；外舱 = CLI 全树 ∥ VSC 全树 ∥ `thincoder-core`（`queued.mjs` 分类面零改）。

**文档面**：`docs/render-core/design/RENDER-CORE.md`（KD-RC-12 + §5 + §6 + §9 + 变更记录）· `docs/desktop/design/UI.md`（输入区行 + 本批注 + 表行 15 + 变更记录）· `docs/desktop/design/PROJECT.md` §4.2 本批行。

**测试面**：批内单元件 `docs/batches/2026-10-01-desktop-slash-commands.test.mjs`（拟新增 · 平 node——parse ∥ route ∥ 表纪律 E6 ∥ 回落判据）；真机腿 = 用户走查（E1–E5）；集成套件 = 现盘空清单（2026-09-28 全清重置）——本批不重建，用例候选登记 = §2.9 U4。仓套件不写 ∕ 不改 ∕ 不跑（口径不变）。

### §2.7 验收对照（条目 → 判据 → 机检面）

| 条目 | 判据 | 机检面 |
|---|---|---|
| E1 | `routeSlash` 语义：`"/model"` ⇒ command；`"/MODEL"` ⇒ command（大小写）；`"/m"` ⇒ `/model`（别名）；`"/nope"` ⇒ unknown；`"foo /model"` ⇒ `null`（非首字符）；`"/"` ⇒ unknown | 批内件（平 node） |
| E2 | 真机：`/model` ⇒ `.mm-overlay` 在场 ∧ 输入框清空 ∧ `[data-block-kind="user"]` 零增 | 真机走查 |
| E3 | 真机：`/plan` ⇒ PLAN 钮态翻转；`/auto` ⇒ 确认 popover 在场 | 真机走查 |
| E4 | 真机：`/nope` ⇒ `#paste-toast.visible` 携 `slash.unknown` 文案 ∧ 输入框文本保留 ∧ 零 user 块 | 真机走查 |
| E5 | 真机：忙态 `/model` ⇒ toast `slash.busy` ∧ 菜单不在场 ∧ 文本保留；忙态 `/plan` ⇒ 钮态翻转 | 真机走查 |
| E6 | 批内件读 CLI 档断言：表内 name ⊆ CLI `SLASH_COMMANDS` 名集；aliases ⊆ CLI 别名键集 | 批内件（平 node） |

### §2.8 关键决策（本批 KD）

| # | 决策 | 理由 · 被否候选 |
|---|---|---|
| KD-S1 | 机制落 **render-core 共享层**（面板缝 + 纯函数），**命令表归端** | 复用优先核查 = 无既有面；面板 = 两端共用件（VSC 将来接入零再实现）；不传 `deps.slash` ⇒ VSC 零行为变。**被否**：桌面自持（面板提交面不可缝 ⇒ 唯有 post 层拦截——与面板状态机打架）；CLI 表直引（Node 侧 ∥ 渲染面静态闭包禁令） |
| KD-S2 | **同钮同径**：`run` = 钮 handler 提取的同一函数（单一实现） | 双入口同门同形——防第二实现漂移；门单源 = 钮自己的门。**被否**：命令各写本地动作 |
| KD-S3 | 未知回落 = **toast + 文本保留**（不发送——CLI 同判） | CLI 判据 = 无 handler 不发送；桌面无本地面流写入 ⇒ toast 承载。**被否**：按普通消息发送（歪掉）；清框（改错要重打） |
| KD-S4 | 忙态 = **同钮门**（非 CLI 全吞） | 桌面钮径本就忙期可用（模式三钮）；两入口同门 = 一致性优先；模型钮既有忙态门（防旧快照覆写）⇒ 命令同拒。差异登记 = §2.3。**被否**：CLI 全吞对齐（两入口行为分叉） |
| KD-S5 | 补全 ∥ `/help` ∥ 其余 23 条 = **不做 ∥ 另批**（零假面） | Tab = Web 焦点键（接管 = 无障碍成本，需用户裁定）。**被否**：27 名全表 + 「未实装」二级反馈（状态面随分期漂移 ∥ 维护面 > 收益） |
| KD-S6 | 携参形（`/model p:m`）**本批不做**（toast `slash.args`） | 直切需候选校验面（CLI `parseModelRef` 对位）+ 写失败面；本批 = 菜单径。另批候选 |

### §2.9 上抛项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| U1 | **需求档收正（父侧笔）**：`docs/desktop/requirements/PROJECT.md` §3.5 边界行（现文 = 斜杠命令族「非必须项 ✗ ⇒ 桌面端不对齐此项」）+ 新增 D 行 ∥ 验收行 | 需求档 | 用户 2026-10-01 走查 + 「要啊」+「开批」= 改判。**建议文本**：边界行 ⇒「**斜杠命令族 = 要**（分期在册——本批 4 条；逐条处置 = 批档 §2.4）」；D 行候选 =「D34 桌面 composer 支持斜杠命令（触发 ∥ 回落 ∥ 忙态口径 = 设计档）」 |
| U2 | **需求档计数差**：`requirements/PROJECT.md:104` 现文「CLI 26 条」vs CLI 实读 **27 条** | 需求档 · 计数 | 父侧落笔时同拍收正（本舱零触） |
| U3 | **UI.md 表行 15 收正**（`/:` 键位组）：原依据句随本批退场——裁定「提示不入段」保留，依据重锚 | 设计档 · 已落（本舱） | 见 UI.md 变更记录 |
| U4 | **集成用例候选登记**（3 条：`/model` 开菜单 ∥ `/nope` 回落 ∥ 忙态拒）——E2E 套件现盘空清单，重建批纳 | 集成面 ∥ 台账 | 重建时 E2E-TESTING 面登记 |
| U5 | **命令面分期 = 建议**（本批 4 ∥ 另批 14 ∥ 不做 9）——用户 ∥ 评审可改判（机制已备：加表项 + run） | 用户裁定面 | 另批首选序 = `/new` `/session` `/rename`（会话控制面句柄口）⇒ `/help`（列表面）⇒ 设置面段锚族 |

### 修复轮 1（评审轮 1 · 七发现逐号 · eng-designer · 2026-10-01）

**轮性质** = fix（钉死七号；不全探索）；**授权** = 评审（本批 §3 轮次 1 = changes-required（🔴 1 ∥ 🟡 6）；父侧裁定 = **全收**——逐条按 `Suggestion` 列执行；处置执行人 = 本席）；**落笔面** = `docs/render-core/design/RENDER-CORE.md`（三处 + 变更记录一行）∥ `docs/desktop/design/UI.md`（三处 + 变更记录一行）∥ `docs/desktop/design/PROJECT.md`（五处 + 变更记录一行）∥ 本块。**本轮不做（明示）**：产品码零触 ∥ 需求档零触（U1 ∥ U2 父侧已落——本舱只按「已转正」口径重锚）∥ 其它发现零夹带 ∥ §2.4 命令面分期零动（U5 待用户）∥ §2.7 既有腿语义零动（只补不删）。

**坐标核（现盘重核 · 2026-10-01）**：评审引 `UI.md:679 ∕ :681 ∕ :682 ∕ :685` ⇒ 现盘 **`:683 ∥ :685 ∥ :686 ∥ :689`**（该档注间他批落笔位移 +4——以现读为准，按符号名核）；余坐标（`RENDER-CORE.md:78 ∥ :233-235 ∥ :383`；`PROJECT.md:64 ∥ :80 ∥ :332 ∥ :1137`；本档 `:27 ∥ :50 ∥ :96 ∥ :129 ∥ :131 ∥ :133 ∥ :145`）现盘即读数 ✓。

**逐号点修（号 → 处置 → file:line——写入后现读）**：

| # | 处置（改动） | 落点 |
|---|---|---|
| 1 🔴 | 「零上行」口径收一 + 补注（模式三钮动作照走 `session:flags`——同钮径不变）：KD-RC-12「零上行」⇒「**零消息径上行**（零 `msg:send` ∥ `queuedUserMessage`）」+ 补注；UI 本批注项 3 补注同拍；本档两处（§2.3 桌面行 ∥ §2.5 项 3）收正句 = 本块（append-only——以本块为准） | `RENDER-CORE.md:78` ∥ `UI.md:685` ∥ 本块 |
| 2 🟡 | 需求依据句重锚（以 §3.5 **已转正**文为准）：KD-25「键位组不适用 = 需求 §3.5 斜杠命令边界」⇒「**提示不入段**（`/:` 命令面已在册——可发现性入口另议；单源 = `UI.md` §1 表行 15）」+ 同行被否句「（违 §3.5 斜杠边界）」⇒「（违「提示不入段」裁定）」；KD-40「桌面无斜杠面（需求 §3.5）⇒「两处皆零动作」造死结不采纳」⇒「**斜杠提交面拦截、不进队**（队列侧 = 防御语义保留）」；UI 回合中插入项 5 同式 | `PROJECT.md:64` ∥ `:80` ∥ `UI.md:444` |
| 3 🟡 | 验收枚举对齐：UI 本批注项 6「走查四腿」⇒「走查 ≥ 六腿（`/model` 清框 ∥ `/nope` 回落 ∥ 忙态 `/model` 拒 ∥ `/plan` 翻转 ∥ `/auto` popover（受理径）∥ 忙态 `/plan` 翻转）——全表（携参拒 ∥ 无会话守卫 ∥ ENG 态拒）= 批档 §2.7」 | `UI.md:689` |
| 4 🟡 | §2.7 补三行判据（E7 携参拒 ∥ E8 无会话守卫 ∥ E9 ENG 态拒）+ E3 收正（框态半判）+ E1 补例（`/p`）——逐行 = 本块「§2.7 补行 ∕ 收正」 | 本块 |
| 5 🟡 | 接口契约定形：§5 条 6 补 `deps.slash` 完整键形（`{ commands, actions }`——条目形 `{ name, aliases?, rejectKey?, run(ctx) → boolean }`；键键形 ∥ 落点逐一点名）+ `send()` 拦截段序 + `run` 返值 + 反馈键发射点一行表（`slash.unknown` = 面板层 ∥ `slash.args` = run 前门 ∥ `slash.busy` = 面板层（`run` 返假径——`rejectKey` 声明）；同类 `/plan` ENG 态 = `toolbar.planDisabled`）；KD-RC-12 同拍 | `RENDER-CORE.md:233-238` ∥ `:78` |
| 6 🟡 | `/auto` 布尔语义定形（**已受理**——popover 径给由在册：popover 在场 = 提交面职责已完成、文本使命已尽）+ E3 补框态半判（判据句一处收口 = §5 条 6 ∥ §2.7 E3） | `RENDER-CORE.md:78` ∥ `:233-238` ∥ `UI.md:685` ∥ 本块 |
| 7 🟡 | 越层处置句两档：`model-menu.mjs`（448 ⇒ ≈460——续期说明（机械提取零新面 ⇒ 非结构性触碰）+ 拆分预案（菜单族按段出档）+ 消解窗口（下次结构性触碰的批）；距 500 硬限余 ≈40）∥ `i18n-views.mjs`（336 ⇒ ≈343——键行 = 非结构性触碰 ⇒ 续期；预案 = 词族按视图面续拆） | `RENDER-CORE.md:386` ∥ `PROJECT.md:1137` ∥ `PROJECT.md:1136` ∥ `PROJECT.md:332` |

**§2.7 补行 ∕ 收正（以本块为准）**：

| 条目 | 判据 | 机检面 |
|---|---|---|
| E1 补例 | `"/p"` ⇒ `/plan`（别名）——并入 E1 例集（余例零动） | 批内件（平 node） |
| E3 收正 | 真机：`/plan` ⇒ PLAN 钮态翻转；`/auto` ⇒ 确认 popover 在场 **∧ 输入框清空**（受理径——返真语义；判据句单源 = `RENDER-CORE.md` §5 条 6） | 真机走查 |
| E7 | 携参拒（KD-S6）：`routeSlash("/model p:m", …)` ⇒ `{ kind:"command", args:"p:m" }`（拒判前置面）；真机：`/model p:m` ⇒ toast `slash.args` ∧ 文本保留 ∧ 零 user 块 | 批内件 + 真机走查 |
| E8 | 无会话守卫：无活动会话 ⇒ `/model` ⇒ toast `workspace.required` ∧ 文本保留（守序 = 工作区守卫先于斜径拦截——同发送守卫） | 真机走查 |
| E9 | ENG 态 `/plan` 拒：ENG 开 ⇒ `/plan` ⇒ toast `toolbar.planDisabled` ∧ 文本保留 ∧ 钮态不翻转（门 = 钮 handler ENG 互斥守卫——同钮同门） | 真机走查 |

**本档收正句（append-only——以本块为准）**：

- §2.3 桌面行（触发 ∥ 上行格）⇒「同 CLI 判据（trim 后首字符 `/`；大小写不敏感；别名解析）；命中 ⇒ **本地执行、零消息径上行**（面板提交面拦截；模式三钮动作照走 `session:flags`——同钮径不变）」。
- §2.5 项 3 ⇒「**零消息径上行保证**：斜径不触 `msg:send` ∥ `queuedUserMessage` 上行、不置 loading、不写用户块、不触 `onTurnStart` ∥ `onUserEcho`（拦截点 = 提交面首段）；**模式三钮动作照走 `session:flags`——同钮径不变**（同钮同径机制面）」。
- §2.5 项 1（返值句）⇒「`true` = **已受理**（已执行 ∨ 二段交互在场——`/auto` 确认 popover 径同判）⇒ 清框 + 入历史；`false` = 未受理（门拒）⇒ 文本保留（条目 `rejectKey` 反馈）」——机制单源 = `RENDER-CORE.md` §5 条 6。

**语义零变声明（逐条）**：① = 口径收一（绝对口径 ⇒ 消息径限定——与同钮同径机制相抵面消）+ 补注 · ② = 依据重锚（历史归变更记录 ∥ 本块）· ③ = 枚举对齐（补两腿 + 全表指针）· ④ = 判据补行（E1 补例 = 纯增；E3 补半判）· ⑤ = 接口定形（既有行为落契约位——零行为增）· ⑥ = 返值定形（popover 径 = 已受理——给由在册）· ⑦ = 越层处置句补登（行数为设计估算——实施批按盘回填）。产品码零触 ✓；需求档零触 ✓；§2.4 ∥ §2.8 ∥ §2.9 零动 ✓；不 re-run 评审 ✓。

**读回（D6）**：`RENDER-CORE.md` `:78` ∥ `:233-238` ∥ `:386` ∥ `:530`（变更记录 +1）✓ ∥ `UI.md` `:444` ∥ `:685` ∥ `:689` ∥ `:886`（+1）✓ ∥ `PROJECT.md` `:64` ∥ `:80` ∥ `:332` ∥ `:1136` ∥ `:1137` ∥ `:1938`（+1）✓。

**列报（评审未列 · 零触——请裁）**：`PROJECT.md:1382` §8「本批（批 B）不做」行含「斜杠命令（需求档 §3.5 边界裁定）」——同 2 号谱系残句（该行已有「另裁已落」在行先例〔真代码块面〕；如需统一口径，建议同式补「已转正落批」标记）。按他批记录面 ∥ 评审未列 ⇒ 本舱零触。

**残留** = 0（七号全数落位；① ∥ ② ∥ ④ ∥ ⑥ 的本档收正句 = 本块）。

**修复轮 2 收正句（复核轮 2 残差 · 单点 · append-only）**：§2.5 项 1（首两 bullet · 键形句）⇒「条目形 ∥ `deps.slash` 键形以 §5 条 6 为准 = `{ name, aliases?, rejectKey?, run(ctx) → boolean }` ∥ `{ commands, actions }`（原 bullet 句以本句为准）」。

### 修复轮 3（实施轮上抛 1 ∥ 2 收正 · 二点 · eng-designer · 2026-10-01）

**轮性质** = fix（钉死两号；不全探索）；**授权** = 实施轮上抛（批档 §5 审计 F1 ∥ F2 + 代码评审 R1 ∥ R2）+ 父侧派单——**设计档随实况收正、产品码零改**。**落笔面** = `docs/render-core/design/RENDER-CORE.md`（两处 + 变更记录一行）∥ 本块。**本轮不做（明示）**：产品码零触 ∥ RENDER-CORE 其余面零触（KD-RC-12 ∥ §6 ∥ §9 零动）∥ `PROJECT.md` 现值回填 = 收口轮（非本轮）∥ 不夹带 ∥ 不 re-run 评审。

**逐号点修（号 → 处置 → file:line——写入后现读）**：

| # | 处置（改动） | 落点 |
|---|---|---|
| 上抛 1（F1 ∥ R1） | `actions` 注入句按实况收正：**装配 = 面板从两工厂实例导出面取**（`createModelMenu` ∥ `createControlsRow` 返回面——同函数性只能在实例处成立）；端侧注入 = `{ commands }` | `RENDER-CORE.md:236` |
| 上抛 2（F2 ∥ R2） | 注入面计数句随动：五项 ⇒ **六项**（枚举补 `slash`——D3 计数 ∥ 列表同拍；与 `panel.mjs` 档头逐字对齐） | `RENDER-CORE.md:231` |

**取证（实读）**：`composer/panel.mjs` `:259` ∥ `:264`（两工厂实例化）∥ `:277-284`（`actions` 装配 = `modelMenu.open` ∥ `controls` 三 toggle）∥ `:368-394`（`handleSlash`——`ctx.actions` 消费）∥ `:14`（档头六项——含 ⑥ `slash`）；端侧注入实读 = `mount-composer.mjs:248`（`slash: { commands: SLASH_COMMANDS }`）。

**语义零变声明**：① = 措辞按实况收正（机制 ∥ 行为零变——同函数性只能在实例处成立）；② = 计数收正（档头六项 = 实态）。产品码零触 ✓；需求档零触 ✓；KD-RC-12 ∥ §6 ∥ §9 零动 ✓。

**残留** = 0（两号全数落位；① ∥ ② 的收正句 = `RENDER-CORE.md` 现文）。

**读回（D6）**：`RENDER-CORE.md` `:231` ∥ `:236` ∥ `:531`（变更记录 +1）✓。

### §2.10 增量块（`/help` · initial 轮 · eng-designer · 2026-10-01）

**轮性质** = initial（增量块 · 不全探索——目标面 = CLI `cmd-help` 实盘 ∥ 端流内承载面）；**授权** = 用户 04:15 直斥「你他妈的help都没有，你做slash命令谁知道怎么用啊？」+ 04:18「你去好好看看cli的斜杠命令代码，别自己生造。」+ 父侧派单（重下——前版简报含父侧未核猜测「浮层选型」已撤）。**唯一依据 = CLI 实盘形**（父侧全文实读 + 本舱现盘复核——坐标见下）。**落笔面** = `docs/desktop/design/UI.md` ∥ `docs/desktop/design/RENDERER.md` ∥ `docs/render-core/design/RENDER-CORE.md` ∥ `docs/desktop/design/PROJECT.md` ∥ 本块。**本轮不做（明示）**：产品码零触（设计轮）∥ Tab 零实现（⑤ 挂起不变）∥ 需求档零触（父侧笔——随动 = 上抛 P1）∥ 其余 22 条命令零动 ∥ 不 re-run 评审 ∥ 零夹带。

**依据坐标（现盘实读 2026-10-01②）**：CLI `thincoder-cli/src/tui/cmd-help.mjs:6-27`（流内打印：`pushLabel("❯ Help")` `:17` → 组序常量 `["Agent","Session","Project","System"]` `:10` → `  ${group}:` `:21` → `    ${name.padEnd(12)}…(${alias})… ${desc}` `:24`；内容源 = `SLASH_COMMANDS` 本体 + `SLASH_ALIASES` 反查 `:9`——零第二清单）· `slash-commands.mjs:67`（`/help` 条：group `System` ∥ desc `this list`）· `:43`（`/eng` desc 全文 = `toggle engineering mode — strict methodology enforcement`）· `:71`（`"/h": "/help"`）· `:130`（`Unknown command: ${rawCmd} (/help for available commands)`——携指引）。**桌面现值**：`thincoder-desktop/renderer/slash-commands.mjs:20-41`（4 条；条目形无 `group` ∥ 无 `desc`）· `renderer/i18n-views.mjs:195`（`slash.unknown` 无指引）· 流内非块行族先例 = `[data-timer]`（`renderer/views/chat-chrome.mjs:44-63`——切片 → 帧尾态刷 → 锚位 ∥ 内容等价零写）。

#### §2.10.1 CLI 实盘对位表（第一交付物）

| 面 | CLI 实盘（实读坐标） | 桌面增量（本块定形） |
|---|---|---|
| 触发 | `handleSlash` 命中 `/help`（别名 `/h`——`:71`） | 同判据（`routeSlash` 不变）；表增 `/help` 条 + 别名 `/h` |
| 输出位置 | 流内打印（`pushLabel`/`pushLine` `:17-25`；终端 scrollback 留屏） | **流内非块行族 `[data-help]`**（尾组槽位 = 台账行组后 ∥ 卡序列前；非块 ⇒ 不动 `data-blocks` 不变式） |
| 形 | 三段：标签 `❯ Help`（bold）→ 组行 `  Agent:`（dim）→ 命令行 `    /model       (/m)      select model & manage providers` | **同三段**：标签行 `❯ Help`（加重）∥ 组行 `Agent:`（dim）∥ 命令行 `/model (/m)  select model & manage providers`——**零 padEnd**（比例字体——列对齐为终端渲染机制，非形本体） |
| 组序 | `["Agent","Session","Project","System"]`（`:10`；组缺者跳过；无组条目跳过 `:13`） | 同序常量（核 `formatHelp` 内）；实有组 = Agent ∥ System；组内序 = **端表本体顺序**（单源——零第二份排序清单） |
| 内容源 | `SLASH_COMMANDS` + `SLASH_ALIASES` 反查（单源） | 端表本体（条目形 + `group` + `descKey`）+ 核 `formatHelp`——零第二清单；desc 经 `t()`（en = CLI 逐字 ∥ zh 逐译） |
| 未知回落 | 流内错误行 `Unknown command: X (/help for available commands)`（`:130`——不发送） | toast `slash.unknown` **值收正携指引**（en = `:130` 逐字 ∥ zh 本端拟定）+ 文本保留（桌面差异在册——无本地面流写入；§2.3） |
| 别名 | `/h ⇒ /help`（`:71`） | **落**：`aliases: ["/h"]`（表纪律 = ⊆ CLI 别名键集；不落 = CLI 有 ∥ 桌面 unknown 分叉——违「对位」） |
| 参数 | `/help` 忽略余参（handler 零参 `cmd-help.mjs:6`） | 通用 run 前门：`/help x` ⇒ 拒 `slash.args`（**既有 KD-S6 口径不变**——差异登记） |
| 忙态 | 全吞 + 提示（`key-handler-busy.mjs`） | 无门 ⇒ 忙期可用（打印零状态写；沿 §2.3 桌面「同钮门」口径） |
| 交互 | 零 | 零（**禁浮层 ∥ 禁 toast 主体 ∥ 禁交互式列表**——逐条对齐） |
| 生命周期 | 终端 scrollback（留屏至清屏） | **运行期痕**：驻留至首屏页读整置（重开 ∥ 切会话即失——同 `[data-timer]` 族；非落盘件） |
| 受理 | submit 后清框 | `run` 返真 ⇒ 清框 + 入历史（既有受理语义）+ **回底**（打印 = 出内容 ⇒ 复跟回底——「发送后回底」先例） |

#### §2.10.2 本增量条目（E10–E13；E1–E9 零动）

| # | 条目 | 判据（机检面） |
|---|---|---|
| E10 | **`/help` = 流内打印形**（对位 CLI 实盘三段形；内容单源 = 表本体）：核 `formatHelp(commands, t)` → 行集（`{ kind: "label" \| "group" \| "cmd", text }`）；行族落流内（非块）；零交互。 | 批内件：行集逐条（标签 ∥ 组序 Agent→System ∥ 命令行 5 条 = 表本体序；name/aliases/desc 逐条）∥ **en desc == CLI desc 逐字**（读 CLI 源档提取——现盘提取面；沿 E6 同法）∥ 键在册盾；真机：敲 `/help` ⇒ 形态与内容 |
| E11 | **未知反馈携指引**：`slash.unknown` 两语值收正（en = CLI `:130` 前段逐字 + `(/help for available commands)`；zh = 本端拟定携 `/help` 指引）。 | 批内件（两语值逐字 + 键在册盾）；真机：`/nope` ⇒ toast 携 `/help` |
| E12 | **流内承载（面板 → 切片 → 画件）**：① 命中 ⇒ `ctx.printHelp` 恰一调 ∥ 清框 + 入历史 + 回底 ∥ 零消息径上行 ∥ 零 hooks；② `setHelpLines` 纯动作五判（键无效 ⇒ 原引用 ∥ 行集非数组 ∥ 空 ⇒ 清键 ∥ 同值 ⇒ 原引用）；③ `chatModel.help` 投影（缺 ⇒ `null`——禁假造）；④ `syncHelp` 画行族（逐行 `data-help-line` + `data-help-kind`）∥ 内容等价 ⇒ 零写 ∥ 缺席 ⇒ 摘 ∥ 缺 ∧ 在场 ⇒ 锚位插入；⑤ `blockAnchor` 链含 `[data-help]`（新块恒居其前）。 | 批内件（假 DOM——沿既有件法）+ 真机：`/help` ⇒ 行族在场 + 回底 |
| E13 | **生命周期 ∥ 非块**：运行期痕（首屏页读整置即失——`clearHelpLines`）；行族零 `data-block-id` ⇒ `data-blocks` 不变式零破。 | 批内件（零 `data-block-id` ∥ `chromeProps` 计数不含行族）；真机：重开会话 ⇒ 行族失 |

#### §2.10.3 机制设计（要点——机制单源 = `RENDER-CORE.md` §2 KD-RC-12 增量句 ∥ §5 条 6 增量句；端面语义单源 = `UI.md` 本批注项 8；端工艺单源 = `RENDERER.md` §1.1 帮助行族条）

1. **核（`thincoder-render-core/composer/slash.mjs` 扩展）**：增 **`formatHelp(commands, t)`** 纯函数 + 组序常量（CLI `:10` 同序）——`commands` = 端表本体；`t` = 词函数（参数注入——保纯度 ∥ 平 node 直测）；出**行集** `{ kind, text }[]`：label = `t("slash.help.label")` ∥ group = `${group}:`（按序过滤；无组条目跳过——CLI `:13` 同判）∥ cmd = `${name}${aliases?.length ? ` (${aliases.join(", ")})` : ""}  ${descKey 在册 ? t(descKey) : ""}`（**双空格分隔** = 列间隔近似——零 padEnd；CSS `pre-wrap` 保形）。零依赖 ∥ 零 DOM ∥ 零端句柄。
2. **核（`composer/panel.mjs`）**：`deps.slash` 键形 ⇒ `{ commands, printHelp? }`（**可选——不传 ⇒ 现行为零变**——VSC 零接缝）；`ctx` 增转发键 `printHelp`（`ctx = { args, raw, post, actions, printHelp }`；缺 ⇒ `undefined`——条目侧可选链）——**面板零 help 语义（纯转发）**；行数 489 ⇒ ≈494（硬限余 ≈6——越 500 触发在册拆档预案（忙态派生段出档））。
3. **端承载链（端渲染面）**：① 表（`renderer/slash-commands.mjs`）：4 条补 `group` ∥ `descKey`；+ `/help` 条（`aliases: ["/h"]` ∥ `run: (ctx) => ctx.printHelp?.() === true`）。② 打印口（`renderer/mount-composer.mjs` `printHelp`）：键空 ⇒ `false`（防御——守卫先于斜径，不可达）→ `store.set(returnToBottom(setHelpLines(store.get(), key, formatHelp(SLASH_COMMANDS, t))))` → `true`。③ 切片（`renderer/store.mjs`）：顶层槽 `helpLines`（按会话键——行集）+ 纯动作 `setHelpLines(state, key, rows)`。④ 帧键（`frame-dispatch.mjs`）：`CHAT_KEYS` += `helpLines`。⑤ 模型（`views/chat-model.mjs`）：`help` 字段 = `helpLinesOf(state)`。⑥ 画件（`views/chat-chrome.mjs`）：`helpGroupNode` ∥ `syncHelp`（幂等——同 `syncTimer` 形）∥ `helpAnchorOf`（`[data-card] ?? [data-pill]`）∥ **锚链四件随动**（`blockAnchor` / `timerAnchorOf` / `stoppedAnchorOf` / `ledgerAnchorOf` 各补 `[data-help]` 位——族序 `… → 台账行组 → 帮助行族 → 卡`）；`views/compress-status.mjs` `compressAnchorOf` 同拍（补 `[data-help]`）；`views/chat-tree.mjs` 帮助行族入树（重建径）。⑦ 清点（`page-read.mjs`）：`clearHelpLines`（首屏页读整置——运行期痕**五清**）。⑧ 样式（`chat-fixes.css`）：三行类（标签加重 ∥ 组行 dim ∥ 命令行常规 + `white-space: pre-wrap`）。**零新通道**（零 IPC 行——全走本地面）。
4. **零消息径上行**：打印口不触 `post` ∥ 不置 loading ∥ 不写用户块 ∥ 不触 `onTurnStart` ∥ `onUserEcho`；`run` 返真 ⇒ 清框 + 入历史 + 回底（零第二实现）。
5. **边界（不做）**：Tab（挂起不变）∥ 其余 22 条命令（另批 13 ∥ 不做 9）∥ **未实装命令不上表**（help 只列在册——零假面，承 KD-S5）∥ 携参（既有通用前门拒）∥ VSC（不传 `deps.slash` 零变）。

#### §2.10.4 受影响文件与测试面（现行 = 现盘实读 2026-10-01② · 内容行数口径）

**核包（`thincoder-render-core/`）**

| # | 档 | 现行 ⇒ 预期 | 注 |
|---|---|---|---|
| 1 | `composer/slash.mjs` | **43 ⇒ ≈88** | +`formatHelp` ∥ 组序常量 ∥ 档头注随动 |
| 2 | `composer/panel.mjs` | **489 ⇒ ≈494** | +`deps.slash.printHelp` 读面 ∥ `ctx` 转发键（硬限余 ≈6——越 500 触发在册拆档预案） |

**桌面渲染面（`thincoder-desktop/renderer/`）**

| # | 档 | 现行 ⇒ 预期 | 注 |
|---|---|---|---|
| 3 | `slash-commands.mjs` | **41 ⇒ ≈66** | 4 条补 `group`/`descKey` + `/help` 条（别名 `/h`） |
| 4 | `mount-composer.mjs` | **283 ⇒ ≈296** | +`formatHelp` import ∥ `printHelp` 口 ∥ deps 装配补键 |
| 5 | `store.mjs` | **307 ⇒ ≈322** | +`helpLines` 槽 ∥ `setHelpLines` 纯动作（**越层在册：结构性触碰**——见 P2） |
| 6 | `views/chat-model.mjs` | **105 ⇒ ≈117** | +`help` 字段 ∥ `helpLinesOf` |
| 7 | `views/chat-chrome.mjs` | **221 ⇒ ≈252** | +`helpGroupNode` ∥ `syncHelp` ∥ `helpAnchorOf` ∥ 锚链四件随动 |
| 8 | `views/chat-tree.mjs` | **151 ⇒ ≈153** | 帮助行族入树（台账行组后） |
| 9 | `views/compress-status.mjs` | **75 ⇒ ≈76** | `compressAnchorOf` 链补 |
| 10 | `frame-dispatch.mjs` | **53 ⇒ ≈56** | `CHAT_KEYS` += `helpLines` |
| 11 | `page-read.mjs` | **282 ⇒ ≈294** | +`clearHelpLines`（运行期痕五清） |
| 12 | `i18n-views.mjs` | **348 ⇒ ≈364** | +6 键 × 2 语 + ⑬ 组注（越 300 在册——键行 = 非结构性触碰 ⇒ 续期） |
| 13 | `i18n.mjs` | **401 ⇒ ≈404** | 键数链回填：`VIEWS_DICT` **129 ⇒ 135** ∥ `HOST_DICT` **302 ⇒ 308** |
| 14 | `chat-fixes.css` | **118 ⇒ ≈126** | 帮助行族三行类 |
| 15 | 批内件 `docs/batches/2026-10-01-desktop-slash-commands.test.mjs` | **345 ⇒ ≈430** | +腿 8–11（`formatHelp` ∥ 表纪律扩（`group`/`descKey`——en desc == CLI 逐字）∥ `/help` 面板径 ∥ 行族画件/锚位）；既有腿 3/5/6/7 随动收正（别名集 + `/h` ∥ `/help` 条 ∥ `slash.unknown` 新值） |

**零触**：`composer-wire.mjs` ∥ `composer-sync.mjs` ∥ `app.mjs` ∥ `index.html` ∥ `docs/desktop/design/IPC.md`（**零新通道**）∥ 外舱 = CLI 全树 ∥ VSC 全树 ∥ `thincoder-core`。**测试面**：批内件（随批留存——不进仓套件；桌面 `test/files.mjs` 现盘空清单）；真机腿 = 用户走查（E10–E13）；仓套件不写 ∥ 不改 ∥ 不跑（口径不变）。

#### §2.10.5 文档收正（逐处）

- `UI.md`：本批注项 2（**5 条 + 别名 3**——`/help` 括注）∥ 项 5（+6 键值面指针 ∥ `slash.unknown` 改值）∥ 项 6（+`/help` 腿）∥ 项 7（**边界句「`/help`（需列表面）」删除**；「其余 23 条」⇒「其余 22 条」）∥ **增项 8**（本增量全述）∥ 输入区行指针（在册 5 条 + 别名 3）∥ 对话流行补帮助行族指针 ∥ 变更记录 +1。
- `RENDERER.md`：§1.1 三处——流内非块节点族条（+帮助行族）∥ 插入点纪律条（族序 ∥ 根子序 ∥ 帮助行族槽位）∥ 帧尾态刷条（+帮助行族）；变更记录 +1。
- `RENDER-CORE.md`：KD-RC-12（**增量句** + 边界句收正——`/help` = 本批 ∥ 其余 22 条）∥ §5 条 6（`deps.slash` 键形 ∥ 条目形（+`group?`/`descKey?`）∥ `ctx`（+`printHelp`）∥ `formatHelp` 入件族 ∥ 发射面注）∥ §6（本批随动段续行）∥ §9 `:430`（② 收正）∥ 变更记录 +1。
- `PROJECT.md`：§4.2 本批行（增量 15 行「现行 ⇒ 预期」）∥ §4.1 越层段两处（`store.mjs` 结构性触碰登记（P2）∥ `i18n-views.mjs` 续期随动）∥ 变更记录 +1。

#### §2.10.6 关键决策（KD-S7–KD-S11）

| # | 决策 | 理由 · 被否候选 |
|---|---|---|
| KD-S7 | `/help` 承载形 = **流内非块行族 `[data-help]` · 尾组槽位（台账行组后 ∥ 卡前）** | 对位既有系统行先例（`[data-timer]` 形：切片 → 帧尾态刷 → 锚位 ∥ 内容等价零写）；非块 ⇒ 块序不变式零破；**槽位固定 ⇒ 重挂径零位次记忆**（座次机刚拆除——零搬移纪律）；行族常驻流底 = 可发现性（正治用户「谁知道怎么用」）。**被否**：浮层/toast 主体（父侧禁）· 交互式列表（CLI 零交互）· **打印点冻结形**（重印不可见 + 位次记忆 = 被拆机具复辟）· 块形（七型扩面 + 落盘语义错位）· 直写 DOM（越帧尾单点 ∥ 重挂即失无恢复源） |
| KD-S8 | 内容单源 = **表本体经核 `formatHelp`**；条目补 `group`（CLI 同组逐条——/help 属 System）∥ `descKey` | 零第二份清单；组序 = CLI 同序常量；组内序 = 表序。**被否**：端侧自组行文（第二清单漂移）· desc 直携双语串（绕词表纪律） |
| KD-S9 | `/h` **随落**（`aliases: ["/h"]`） | CLI `:71` 在册 ∥ 表纪律机检通过；不落 = CLI 有 ∥ 桌面 unknown 分叉（违本增量依据）。**被否**：不落（与「对位 CLI」相抵） |
| KD-S10 | `/help` **无忙态门**；携参走**既有通用前门拒**（`slash.args`） | 打印 = 零状态写（忙期安全）；前门 = 既有 KD-S6 口径不动（`/help x` 与其余命令同判）。**被否**：为 `/help` 特例放行携参（破通用前门一致性——差异登记） |
| KD-S11 | 受理径 + **回底**（`returnToBottom`） | 打印 = 出内容 ⇒ 复跟回底（「发送后回底」先例）；防「敲了没反应」类缺陷复现（内容在流底不可见）。**被否**：不回底（离底用户零可见变化） |

#### §2.10.7 既有块收正句（append-only——以本块为准）

- §2.3 桌面行「**4 条在册**（`/model` ∥ `/auto` ∥ `/plan` ∥ `/eng`）+ 别名 2」⇒「**5 条在册**（+ `/help`）+ 别名 3（+ `/h`）」；同格「未命中 ⇒ toast + 文本保留」句的键值随 E11（携指引）。
- §2.4 `/help` 行：处置「**另批**」⇒「**本批**」；理由句「需列表面（候选 = 核件浮层族；随命令面扩展批）」⇒「**流内打印形**（浮层候选退场——单源 = `RENDER-CORE.md` §5 条 6 增量句）」；计数行「本批 **4** ∥ 另批 **14** ∥ 不做 **9** = 27」⇒「本批 **5** ∥ 另批 **13** ∥ 不做 **9** = 27」。
- §2.8 KD-S5 句「补全 ∥ `/help` ∥ 其余 23 条 = 不做 ∥ 另批」⇒「补全 ∥ **其余 22 条** = 不做 ∥ 另批（`/help` 已落——KD-S7）」；§2.5 项 4 边界句同式收正。

#### §2.10.8 上抛 ∥ 列报

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| P1 | **需求档随动（父侧笔）**：`docs/desktop/requirements/PROJECT.md:104`（§3.5）∥ `:179`（D34）现值「本批 4 条（… + 别名 `/m` `/p`）」⇒ 增量后 **5 条 + 别名 3**（`/help` + `/h`） | 需求档 | 父侧笔随拍收正（本舱零触） |
| P2 | **`store.mjs` 越层在册 ∥ 本增量 = 结构性触碰**（新切片 `helpLines` + 纯动作 `setHelpLines` ⇒ 拆档评估窗口触发——对照 #719 判例「无新面 ∥ 净删 = 行级小修」） | 设计档 · 处置待裁 | 建议 = **续期**（由：增量小面 ∥ 307 ⇒ ≈322 距 500 硬限远 ∥ 预案「切片族续拆」= 独立结构性轮）；消解窗口 = 该档下次触碰 ∥ 或父侧裁本批执行 |
| P3 | CLI ∥ 桌面未知反馈名形差（CLI `rawCmd` 原样 ∥ 桌面小写归一名——既有 #761 口径）——本增量只补指引，名形差异保持登记 | 登记 | 保持（本批零动） |
| P4 | 集成用例候选（`/help` 行族在场 ∥ 未知携指引）——E2E 套件现盘空清单，重建批纳 | 集成面 ∥ 台账 | 重建时登记（承 U4） |

**§2.10 补笔（文档面一处补充 · 同日）**：`UI.md` 表行 15 随动——「可发现性入口另议——不入本批」⇒「可发现性入口 = `/help` 命令面——2026-10-01 增量已落；状态行键位提示仍不入段」（`UI.md` §2 表行 15；「提示不入段」裁定本体零动）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审基础（#761 设计轮 · 设计评审）**：对象 = 批档 §2 ∥ `docs/render-core/design/RENDER-CORE.md` ∥ `docs/desktop/design/UI.md` ∥ `docs/desktop/design/PROJECT.md`（四档全文实读）。限制：无 Project Standards 档（方法学按 AGENTS.md + 各档自述纪律判）；无 Document Map（所有权按各档「单源」指针 + AGENTS.md 判）；码档不在评审范围（行数按册面对盘——`panel.mjs` 439 ∥ `model-menu.mjs` 448 ∥ `controls.mjs` 205 ∥ `mount-composer.mjs` 276 ∥ `i18n-views.mjs` 336 与在册行一致）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档所有权 ∕ 一致性 | 🔴 | 「零上行」保证同一机制两处描述不一且绝对口径为假——批档 §2.5 项 3（`2026-10-01-desktop-slash-commands.md:96`）「斜径不触任何 `post` 消息类型」∥ §2.3 桌面行（`:50`）「零上行」∥ 核 KD-RC-12（`RENDER-CORE.md:78`）「不进消息径（零上行…）」；而 UI 本批注项 3（`UI.md:681`）∥ E1（批档 `:27`）已按「零消息径上行（零 `msg:send` ∥ `queuedUserMessage`）」限定。机制实读：`/auto` ∥ `/plan` ∥ `/eng` = 钮 handler 同函数（KD-S2；批档 `:93`），模式钮写路 = `session:flags`（`RENDER-CORE.md:109` §3 行 23；唯一写面单源 = `PROJECT.md:91` KD-49）⇒ 绝对口径与同钮同径机制相抵。 | 四处收一为「零消息径上行」并补注（模式三钮动作照走 `session:flags`——同钮径不变）：KD-RC-12（`RENDER-CORE.md:78`）括注 ∥ 批档 §2.5 项 3（`:96`）∥ §2.3 桌面行（`:50`）∥ 与 UI 项 3（`UI.md:681`）同笔。 |
| 2 | 文档状态 ∕ 跨档滞后 | 🟡 | 需求 §3.5 依据句三处残存、未随 U1（`批档:151` §3.5 边界改判）∥ U3（表行 15 已收正，`UI.md:114`）同拍——桌 KD-25（`PROJECT.md:64`「键位组不适用 = 需求 §3.5 斜杠命令边界」）· KD-40 边界句（`PROJECT.md:80`「桌面无斜杠面（需求 §3.5）」）· UI「回合中插入」项 5（`UI.md:444`「桌面无斜杠面〔需求 §3.5〕」）——本批后该边界反转且桌面已有斜杠面 ⇒ 三句失据。 | 三句依据重锚（键位组 ⇒「提示不入段」；队列句 ⇒「斜杠提交面拦截、不进队」）并纳入 U1 同拍收正清单。 |
| 3 | 文档状态 ∕ 跨档滞后 | 🟡 | 验收枚举两档不等——UI 本批注项 6（`UI.md:685`）「真机 = 走查四腿」仅列 `/model` ∥ `/nope` ∥ 忙态 `/model` ∥ `/plan`，缺 §2.7 的 `/auto` 确认 popover（批档 `:131` E3）与忙态 `/plan`（`:133` E5）两腿。 | 项 6 与 §2.7 对齐（补两腿，或改「至少四腿 + 全表指针 = 批档 §2.7」）。 |
| 4 | 验收 | 🟡 | 三条已定形行为无验收判据——携参拒 `slash.args`（KD-S6；批档 `:145`）· 无会话守卫 `workspace.required`（`UI.md:679`）· ENG 态 `/plan` 拒 `toolbar.planDisabled`（`UI.md:682`）；另 E1 别名例只列 `/m`（`/p` 未列，批档 `:129`）。 | §2.7 补三行判据（可含批内件 + 真机腿两档）并补 `/p` 别名例。 |
| 5 | 清晰度 | 🟡 | 接口契约两处未定形——① `ctx.actions` 注入键：§5 条 6（`RENDER-CORE.md:234-235`）∥ KD-RC-12 ∥ `deps.slash = { commands }` 只列 commands，「面板装配注入」（批档 `:93`）未点名键形 ∕ 落点；② 反馈键发射点：仅 `slash.unknown` 点名住面板层（`RENDER-CORE.md:235`），`slash.busy` ∥ `slash.args` 无归属，且 `run` 面限定「只调 `ctx.actions`」（批档 `:94`）。 | §5 条 6 补 `deps.slash` 完整键形（含 actions 注入位）与三键发射点一行表（面板层 ∥ run 前门）。 |
| 6 | 清晰度 | 🟡 | `/auto` 确认门（两段动作）下 `run()` 布尔语义未定形——「已执行 ⇒ 清框 + 入历史 ∥ 未执行 ⇒ 文本保留」（批档 `:92` ∥ `UI.md:681`）未覆盖「popover 已开、待用户确认」态；E3 判据只查 popover 在场、不钉输入框清留（批档 `:131` ∥ `:29`）。 | 定形该径返值（给由）＋ E3 补框态半判（判据句一处收口）。 |
| 7 | 受影响文件行数标注 | 🟡 | 越层（>300）处置句缺两档（数字本身经对盘无误）——`model-menu.mjs` **448 ⇒ ≈460**（`RENDER-CORE.md:383` ∥ `PROJECT.md:1137` 只给数；同批 `panel.mjs` 439 已带「越 500 先落拆档」预案，不对称）· `i18n-views.mjs` **336 ⇒ ≈343**（该档在册越层：`PROJECT.md:332`「续期——预案 = 词族按视图面续拆」；本批 +7 触碰未见处置句）。 | 两档补越层处置句（续期说明 ∥ 拆分预案 + 不拆依据 / 消解窗口），沿 `PROJECT.md:744` 先例形。 |

**计数**：🔴 1 · 🟡 6 · 🔵 0（共 7 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核轮 2（评审子代理 · 修复轮 1「七发现逐号」复核 + 现盘新发现）**：评审基础 = 四档现盘实读（批档 ∥ `RENDER-CORE.md` ∥ `UI.md` ∥ 桌面 `PROJECT.md`）；坐标按现盘重核（轮 1 三条引注因 UI.md +4 位移未过机检——本轮按现盘读数，轮 1 引注坐标已失效）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | RENDER-CORE.md:78 ∥ UI.md:685 ∥ 批档收正句块（:187-188） | 🔴 | Fixed | 四处收一落位：KD-RC-12 现文「本地执行、**不进消息径**（**零消息径上行**——零 `msg:send` ∥ `queuedUserMessage`、零用户块、零 loading；**模式三钮动作照走 `session:flags`——同钮径不变**）」；UI 项 3 同口径 + 同补注；批档 §2.3 桌面行 ∥ §2.5 项 3 经收正句块（「以本块为准」）覆盖。全域 grep（零上行 ∥ 不触任何）：RENDER-CORE ∥ UI ∥ PROJECT 三档零残留（批档仅原句 + 收正句 + 史录）。 |
| 2 | 2 | PROJECT.md:64 ∥ :80 ∥ UI.md:444 | 🟡 | Fixed | KD-25 现文「键位组不适用 = **提示不入段**（`/:` 命令面已在册——可发现性入口另议；单源 = `docs/desktop/design/UI.md` §1 表行 15）」+ 被否句同拍；KD-40 现文「**斜杠提交面拦截、不进队**（…；队列侧 = **防御语义保留**）」；UI 回合中插入项 5 同式。全域 grep（无斜杠面 ∥ 斜杠命令边界）四档零残留。 |
| 3 | 3 | UI.md:689 | 🟡 | Fixed | 项 6 现文「真机 = 走查 ≥ 六腿（… ∥ `/auto` ⇒ 确认 popover 在场 ∧ 输入框清空（受理径）∥ 忙态 `/plan` ⇒ 钮态翻转）——**全表（含携参拒 ∥ 无会话守卫 ∥ ENG 态 `/plan` 拒）= 批档 §2.7**」⇒ 枚举与 §2.7 腿集对齐 + 全表指针。 |
| 4 | 4 | 批档 §2.7 补行块（:175-183） | 🟡 | Fixed | E7（携参拒 `slash.args`）∥ E8（无会话守卫 `workspace.required`——守序句「工作区守卫先于斜径拦截」在册）∥ E9（ENG 态 `/plan` 拒 `toolbar.planDisabled`）+ E3 收正（`/auto` ⇒ popover ∧ **输入框清空**）+ E1 补例（`"/p"` ⇒ `/plan`）逐行在册。 |
| 5 | 5 | RENDER-CORE.md:235-238 ∥ :78 | 🟡 | Fixed（残差 → #8） | §5 条 6 现文：`deps.slash = { commands, actions }` 完整键形（条目形 `{ name, aliases?, rejectKey?, run(ctx) → boolean }`；`actions` 落点 ∥ 注入面逐一点名）∥ `send()` 拦截段 ∥ `run` 返值 ∥「**反馈键发射点（一行表）**：`slash.unknown` = 面板层（route 未知径）· `slash.args` = **run 前门**（`cmd.run` 调用前——`args` 非空通用拒）· `slash.busy` = 面板层（`run` 返假径——条目 `rejectKey` 声明）· 同类 = `/plan` ENG 态拒 ⇒ `rejectKey = toolbar.planDisabled`」；KD-RC-12 同拍。 |
| 6 | 6 | RENDER-CORE.md:78 ∥ :237 ∥ UI.md:685 | 🟡 | Fixed | `/auto` 径定形：返真 = **已受理**（已执行 ∨ 二段交互在场——`/auto` 确认 popover 径同判：popover 在场 = 提交面职责已完成、文本使命已尽）⇒ 清框 + 入历史；E3 收正补「∧ 输入框清空（受理径——返真语义）」半判（判据句单源 = §5 条 6）。 |
| 7 | 7 | RENDER-CORE.md:386 ∥ PROJECT.md:1136 ∥ :1137 ∥ :332 | 🟡 | Fixed | `model-menu.mjs` 448 ⇒ ≈460 带「**越 300 在册** ⇒ 处置 = **续期说明**：提取 + 导出（≈+12 · 机械提取零新面 ⇒ 非结构性触碰）；不拆依据 = 距 500 硬限余 ≈40；**拆分预案** = 菜单族按段出档；**消解窗口** = 该档下次**结构性**触碰的批」；`i18n-views.mjs` 336 ⇒ ≈343 带「**越 300 在册**——键行 = 非结构性触碰 ⇒ 续期；预案 = 词族按视图面续拆」（§4.2 行 3 ∥ §4.1 越层在册行同拍）。 |
| 8 | (5) | 批档 :91-92 | 🟡 | New（残差——advisory，不阻塞） | §2.5 项 1 首两 bullet 未随接口定形同步：`:92` 仍「`deps.slash = { commands }`（**可选——不传 ⇒ 现行为零变**，VSC 零接缝）」、`:91` 仍「条目形 = `{ name, aliases?, run(ctx) → boolean }`」——与现盘单源（`{ commands, actions }` ∥ 含 `rejectKey?`）相抵；收正句清单（:185-189）仅覆盖返值句 ⇒ 修复块「**残留** = 0」（:197）句略过宽。§2.5 头（:88）已声明单源 = RENDER-CORE ⇒ 实现面无歧义；建议补一条收正句（或注明该两 bullet 以 §5 条 6 为准）收口。 |

**计数**：七号复核 = **7/7 Fixed**（原 🔴 1 ∥ 🟡 6 全消）；新发现 **1**（🟡 · 残差——advisory）；阻塞项 **🔴 = 0**。

**列报复核**（修复块 :195 请裁项）：`PROJECT.md:1382` §8 行现盘已带「**已转正落批**：2026-10-01 §3.5 转正 + §4 **D34**；批 `docs/batches/2026-10-01-desktop-slash-commands.md`」标记 ⇒ 无需动作。

VERDICT: pass

### 轮次 3（评审子代理）

**评审基础（#761 · `/help` 增量块设计评审——用户 04:41 直斥「设计过重」后重瞄最简落形）**：对象 = 批档 §2.10 ∥ `RENDER-CORE.md`（KD-RC-12 增量 ∥ §5 条 6 ∥ §6:389）∥ `UI.md`（本批注项 2 ∥ 5 ∥ 6 ∥ 7 ∥ 8 ∥ 表行 15 ∥ 补笔）∥ `RENDERER.md`（§1.1 三条 ∥ 变更记录）。限制 = 无 Document Map（所有权按各档单源指针判）∥ `docs/desktop/design/PROJECT.md` 不在评审范围（P2 ∥ §4.2 引用面未能对盘）。**行数抽核（现盘实读——逐值与在册一致，标注可信）**：CLI `cmd-help.mjs` 27 ✓ · 核 `composer/slash.mjs` 43 ✓ · 核 `composer/panel.mjs` 489 ✓ · 端 `renderer/slash-commands.mjs` 41 ✓ · `renderer/mount-composer.mjs` 283 ✓ · `views/chat-chrome.mjs` 221 ✓ · `renderer/store.mjs` 307 ✓ · `views/compress-status.mjs` 75 ✓ · 批内件 345 ✓；CLI 对位坐标（`slash-commands.mjs` 表 `:40-68`＝27 条 ∥ 别名 `:71` ∥ `/help` `:67` ∥ Unknown `:130` ∥ `cmd-help.mjs:17/21/24` 三段形）与 UI 六键 en 值逐字核过 ✓。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Scope ∥ 受影响文件行数（问③） | 🟡 | `panel.mjs` **489 ⇒ ≈494** 可回避——截段（`panel.mjs:371-394`）已含「`run` 返真 ⇒ 清框 + 入历史」全语义，打印能力属端侧（`mount-composer.mjs:248` 构造点 + 同档 `printHelp` 口位）；为传 `printHelp` 增 `deps.slash` 读面 + `ctx` 转发键（≈+5 行）把 500 硬限余由 **11** 压到 **≈6**——余量 6 的实际命中面薄（上轮估值 +35 实测 **+50**） | 打印口经端侧构造点**闭包注入**（命令表构造时绑定 `print`；`run` 仍只返布尔）⇒ 面板 ∥ `ctx` 零改、余量保 11；如保留转发形 ⇒ 设计面补「余量 6」实证 |
| 2 | Scope ∥ 验收判据（问④） | 🟡 | 腿 8–11 与既有腿重叠（对照 §5:392 腿集）：腿 9（表纪律扩 `group`/`descKey`/en desc）= 腿 4 同面延伸；腿 10（`/help` 面板径）= 腿 6A–6I 同 harness 新例；批内件 **345 ⇒ ≈430（+85）** 与「机检膨胀核减」纪律（测试不当交付物 ∥ 验证=一行读数）相抵 | 腿 9 并入腿 4 ∥ 腿 10 并入腿 6 组一例 ∥ 腿 11 裁至 `setHelpLines` 纯动作一例、画件/锚位交真机一行读数（E12/E13）——净增 ≈ **+30–40** |
| 3 | Scope ∥ 方法学（问②） | 🟡 | `KD-S9 ∥ S10 ∥ S11` 为既有口径 ∥ 直接推论（`/h` = 对位直接产物；无忙态门 + 携参前门拒 = 既有 KD-S6 域；受理 + 回底 = `run` 返值既有语义）——独立 KD 行与「最简落形」目标相抵 | KD 收至 **S7 ∥ S8** 两条；S9/S10/S11 各降为机制文一句（内容零删） |
| 4 | 越层 ∥ 协调项 | 🟡 | `store.mjs` **307 ⇒ ≈322** 判「结构性触碰、处置待裁」（P2）——预案（切片族续拆）∥ 消解窗口已在册，裁未落 | 按「续期」在册（协调项，非缺陷）；本批无需动作 |
| 5 | 文档一致性 | 🔵 | `RENDER-CORE.md:389` `/help` 随动行逐档枚举缺 `renderer/i18n.mjs`（**401 ⇒ ≈404**——批档 §2.10.4 #13 在册） | 随动行补该档一行（或注明逐档数单源 = `PROJECT.md` §4.2） |
| 6 | CLI 对位（登记差异） | 🔵 | 两处有意差异在两档登记在册：「组内序 = 端表本体序」（CLI 相对序 = `/plan→/auto→/eng→/model`（CLI `:41-45`）∥ 端表 = `/model→/auto→/plan→/eng`）∥ `/help x` 前门拒（CLI 忽略余参——`cmd-help.mjs:6` 零参） | 保持登记即可；如求逐字对位 ⇒ 端表 4 条按 CLI 相对序重排（零成本、仍单源） |

**逐问裁（用户四问）**：
- **① 承载面无更简既有面**（实据）：`[data-timer]` = 单切片单组且 **≤3 行 + `…`**（`chat-chrome.mjs:36-47`）∥ `[data-stopped]` = 常文单行（`:67-69`）∥ `[data-ledger]` = 核行产 + 同引用短路替换（`:73-83`）∥ `[data-compress]` = 单元素（`compress-status.mjs`）∥ toast = 2.6s 瞬态（§5 R6）∥ 块形 = 六型全员落盘 ∥ 页读域——均不能载 7 行可读打印；`[data-help]` 已是 `[data-timer]` 最简先例的同形克隆。**锚链四件（+`compressAnchorOf` 一件）= 入尾组中位的固有代价**（实读五条链式：`blockAnchor`/`timerAnchorOf`/`stoppedAnchorOf`/`ledgerAnchorOf` 各一式一行；改槽位不省）——非过重主因。
- **② 必要 = S7（承载形）∥ S8（内容单源）；可并 = S9 ∥ S10 ∥ S11**（各降一句；内容零删）。
- **③ 可回避**（端侧闭包注入——见发现 1）；回避 ⇒ 硬限余 11 保持、越 500 风险面清零。
- **④ 部分重合**（9⇒腿 4 ∥ 10⇒腿 6 组 ∥ 11 裁至纯动作一例 + 真机一行读数——见发现 2）。

**最简可落结论**：
- **终形** = 原落点表 15 行（14 产品档 + 批内件）出列 `panel.mjs` ⇒ **13 产品档 + 批内件**（14 行账）：`/help` = 流内非块行族 `[data-help]`（标签 ∥ 组 ∥ 命令行逐行；内容单源 = 端表本体经核 `formatHelp(commands, t)`）；尾组槽位（台账行后 ∥ 卡前）；运行期痕（页读整置清）；`run` 返真 ⇒ 清框 + 入历史 + 回底；别名 `/h`；未知回落携指引；词键 6 × 2 语；表补 `group`/`descKey`。
- **被砍项** = ① `panel.mjs` 触面（printHelp 端侧闭包注入）② KD 五条 ⇒ 两条 ③ 测试净增 +85 ⇒ ≈+30–40；**维持项** = 锚链随动 5 处 ∥ 6 词键 ∥ `formatHelp` 入核 ∥ 回底 ∥ store 切片链（实核 = 该架构下 in-flow 行族的最小面——沿 `[data-timer]` 先例）。
- **判据** = E10–E13（+ `data-blocks` 不变式 ∥ 零消息径上行）+ 真机一行读数：`/help` ⇒ `[data-help]` 在场（三段形）+ 回底 ∧ 重开即失。

**计数**：🔴 0 ∥ 🟡 4 ∥ 🔵 2（共 6 条）——无阻塞项。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（代签 · 2026-10-01 03:19——承用户「全自动跑完」授权）**：设计 = 本批 §2（含修复轮 1 收正块 ∥ 修复轮 2 单点收正句 `:199`）；评审链 = §3 轮次 1（changes-required · 七发现）→ 修复轮 1 → §3 轮次 2 = **pass**（七条全消 ∥ 残差 1 = 单点已收）；单源 = `RENDER-CORE.md` §2 KD-RC-12 ∥ §5 条 6 ∥ UI 本批注。批准 ⇒ 实施舱点火（eng-coder · 持 designToken · 落点 = §2.6 七档 + 批内件；真机腿 E1–E5/E7–E9 = 用户走查）。

**用户批准（2026-10-01 05:45）**：用户原话「你先把之前评审完的那个发出去，走起来。我们再继续讨论这个765。」——**`/help` 增量（评审 #77 = pass）批准放行实施**（= 「评审完的那个」；解 04:43 冻结令之本件）。实施舱 = eng-coder（设计令牌持——凭据不入档）；实施记录随 §5 落。**范围**：仅 `/help` 增量；slash 其余存量（提交 ∥ 全量真机走查 ∥ Tab ∥ 别名裁定等）**仍待点名解冻**。批准门凭据（令牌 ∥ designId）= 运行时状态。

## §5 实施记录（eng-coder）
**状态行**：实施完成（`/help` 增量（台账 #761）：13 产品档 + 批内件在盘；18/18 + 器械 29/29 全绿；审计 1 轮 + 代码评审 1 轮（pass）+ fix 1 轮；上抛 2 项（设计/记录面收正句）；2026-10-01②）



**§5 实施记录（eng-coder · 2026-10-01 · 台账 #761 · 轮次 = initial）**

**落点表「§2.6 预期 ⇒ 实读」**（内容行数口径 = 文末换行不计）：

| # | 档 | §2.6 预期 | 实读 |
|---|---|---|---|
| 1 | 核 `composer/slash.mjs`（新增） | ≈70 | **43**（`parseSlash` ∥ `routeSlash` 两纯函数 + 条目形注；零依赖/零 DOM） |
| 2 | 核 `composer/panel.mjs` | 439 ⇒ ≈474 | 439 ⇒ **489**（`deps.slash` 读面 ∥ 斜径拦截段 ∥ `actions` 装配 ∥ 反馈；硬限余 **11**） |
| 3 | 核 `composer/model-menu.mjs` | 448 ⇒ ≈460 | 448 ⇒ **456**（钮 handler 提 `open` + 导出面——零行为改） |
| 4 | 核 `composer/controls.mjs` | 205 ⇒ ≈222 | 205 ⇒ **219**（三 toggle 提函数 + 导出面——零行为改） |
| 5 | 端 `renderer/slash-commands.mjs`（新增） | ≈80 | **41**（4 条 + 别名 2；`run` 只调 `ctx.actions`；零 import） |
| 6 | 端 `renderer/mount-composer.mjs` | 276 ⇒ ≈282 | 276 ⇒ **283**（+import + `slash` deps 一处装配） |
| 7 | 端 `renderer/i18n-views.mjs` | 336 ⇒ ≈343 | 336 ⇒ **348**（+3 键 × 2 语 + ⑬ 组注） |
| 8 | 批内件 `docs/batches/2026-10-01-desktop-slash-commands.test.mjs`（新增） | — | **332** 行 · **14 例** |
| 9 | **表外随动**：端 `renderer/i18n.mjs` | — | 397 ⇒ **401**（键数链回填——设计明示「同回填计数链 = 实施轮」；见决策 3） |

**验收（批内件实跑）**：`node --test docs/batches/2026-10-01-desktop-slash-commands.test.mjs` ⇒ **tests 14 ∥ pass 14 ∥ fail 0**（duration ≈2.7s）。腿集：
腿 1–3（E1 例集含 `"/p"` ∥ 回落判据 ∥ E7 携参）· 腿 4（E6 表纪律：端表 name ⊆ CLI `SLASH_COMMANDS` ∥ aliases ⊆ CLI `SLASH_ALIASES`——读 CLI 源档提取）· 腿 5（表契约：`run` 只调 `ctx.actions` ∥ post 零触 ∥ 返值直传 ∥ `rejectKey` 两键）· **腿 6A–6H（面板拦截段假 DOM 实跑**：`/model` ⇒ 同一菜单 `.mm-overlay` 在场 + 清框 + 零消息径上行 + 零 hooks + `↑` 可召回 ∥ `/nope` ⇒ toast `未知命令：/nope` ∥ 忙态 `/model` ⇒ `slash.busy` 拒 ∥ 携参 ⇒ `slash.args` 拒 ∥ ENG 态 `/plan` ⇒ `toolbar.planDisabled` 拒 ∥ 忙态 `/plan` ⇒ `setPlanMode` 执行 ∥ 无会话守卫先于斜径 ∥ 非斜径照普通消息径）· 腿 7（词键三键 × 2 语逐字）。
另：逐档 `node --check` 全过（9 档）；新两档 import 面 = 零（静态闭包判据）。

**机制落形（对 §2.5 ∥ §5 条 6 逐条）**：① `deps.slash` 可选（不传 ⇒ 现行为零变——VSC 零接缝，实读 VSC `input.js:74` 未传）；② 拦截段序 =「空文本 → 无会话守卫」之后、「忙态入队」之前（`panel.mjs:314-316`）；③ `cmd.run({ args, raw, post, actions })`；返真 ⇒ 清框 + 入输入历史，返假 ⇒ 文本保留 + `rejectKey` toast（`panel.mjs:382-393`）；④ 未知 ⇒ toast `slash.unknown` + 文本保留、不发送；⑤ `args` 非空 ⇒ run 前门 `slash.args`；⑥ 反馈键发射点 = §5 条 6 一行表（`slash.unknown` ∥ `slash.args` = 面板层 · `slash.busy` ∥ `toolbar.planDisabled` = 条目 `rejectKey`）；⑦ `actions` 四件 = 钮 handler 提取的**同一函数**（`model-menu.mjs` `open` ∥ `controls.mjs` `toggleAuto/togglePlan/toggleEng`——导出面），门随函数（同钮同门）；⑧ 零消息径上行（腿 6A/6B/6C/6D/6E/6G 以 `posts` 空表机检）。

**决策透明表**：

| # | 决策 | 理由 · 影响 |
|---|---|---|
| 1 | **`actions` 装配位**：端侧注入 `{ commands }`（mount-composer §2.6 一处装配）；`actions` 由**面板装配**（两工厂实例导出面） | §2.5 项 1「面板装配注入」∥ §5 条 6「注入 = 端侧 mount-composer.mjs 装配」两处措辞取「端侧注入点 + 面板装配内容」合成：**同一函数性只能在实例处成立**（钮 handler 为工厂内闭包，端侧无句柄），故 `actions` 值只能由面板装配；完整对 `{ commands, actions }`（§5 条 6 键形）在机制面成立。**零行为影响**——请设计舱按需收正措辞 |
| 2 | **行数**：panel 初稿实读 **501**（越 500 硬限）⇒ 就地把本批新增注释面压到工程密度 ⇒ **489**（≤500） | §2.5 项 5 触发面复核：越限成因 = **本批新增注释面**（设计估 +35 行；初稿 +62），非机制/代码必需体量 ⇒ 取「贴合设计面（≈474 同量级）」而非动拆档。**零行为改、零判据句删减**（三条判据句口径全保：零消息径上行 ∥ 返值语义 ∥ 发射点表）。**拆档预案未触发**（最终态未越限）；如审查认定须按「初稿触限即拆档」口径处置：预案 = 忙态派生段出档（`applyModelSwitchGate` ∥ `applyBusyLock` ∥ `setLoading`——§2.5 项 5 在册面），可另起小批 |
| 3 | **表外随动一档**：端 `renderer/i18n.mjs`（键数链回填 +4） | 依据 = 设计明示「**同回填计数链 = 实施轮**」（`docs/desktop/design/PROJECT.md` §4.2 本批行 3）——链住该档档头（产品码注释），非本批注释则链停留滞后值。实读 = `VIEWS_DICT` **126 ⇒ 129** ∥ `HOST_DICT`（合并表）**299 ⇒ 302**（两语同拍）。已在落点表 #9 明列 |
| 4 | **`name` 形含首 `/`**（`/model` 非 `model`） | E6 表纪律「name ⊆ CLI `SLASH_COMMANDS` 名集」直比（CLI 名含 `/`）；`slash.unknown` 的 `${name}` 逐字 = CLI 前段形（`Unknown command: /nope`——腿 6B 实跑取真值「未知命令：/nope」） |
| 5 | **`raw` 载荷** = trim 后提交文本（设计未定形） | `ctx = { args, raw, post, actions }` 的 `raw` 取整条提交文本（`args` = 余串）；本批无消费者（4 条 `run` 零参），记口径待后批沿用 |
| 6 | **批内件腿集扩**：设计枚举（parse ∥ route ∥ E6 ∥ 回落）**加**腿 6A–6H（面板拦截假 DOM）+ 腿 7（词键面） | 「只测本批改动面」内——面板拦截 = 本批主改动面；AGENTS.md「每个改动必须跑过」⇒ 把「written but never run」压零（真机腿 E1–E9 仍归用户走查，不替代）。假 DOM 沿批内件先例（`2026-09-29-desktop-compress-row-pin` ∥ `digest-parity` 同法） |

**未列面（零触确认）**：零触面（`composer-wire.mjs` ∥ `composer-sync.mjs` ∥ `app.mjs` ∥ `index.html` ∥ `composer.css` ∥ `IPC.md`）逐档零改；外舱（CLI ∥ VSC ∥ `thincoder-core` 全树）零改（本批改动全落 8 档 + 批内件）；设计档（`RENDER-CORE.md` ∥ `UI.md` ∥ `PROJECT.md`）零触 ✓。

**审计轮 1（内部 explore 发散审计 · 只读 · 2026-10-01）**——对象 = 本交付（设计面 = 批档 §2 ∥ `RENDER-CORE.md` KD-RC-12/§5 条 6 ∥ `UI.md` 本批注）。**计数：🔴 0 ∥ 🟡 1 ∥ 🔵 3**（① 部分实现 0 ∥ ② 静默简化 0 ∥ ③ 文档漂移 3 ∥ ④ 清单外 1〔已消解〕）——**代码 ∥ 行为面零阻塞**（同钮同门单一实现 ∥ 零消息径上行 ∥ 段序 ∥ 返值语义 ∥ 零触面 ∥ 表纪律逐条判「一致」）。

| # | 严重度 | 事实 | 本舱处置 |
|---|---|---|---|
| F1 | 🟡 | `actions` 装配位措辞：实现取「端侧注入 `{ commands }` + 面板装配 `actions`」（同 §5 决策 1 已披露）；`deps.slash.actions` 键零读。审计确认该形为**唯一可行形**（同钮同门要求）且行为面无影响 | **零代码改动**（改读 `actions` 会造第二实现面）⇒ **上抛**：设计措辞收正（`RENDER-CORE.md` §5 条 6 `:236`）或父侧裁准该口径——设计档非本舱笔（零触） |
| F2 | 🔵 | 计数不一：`RENDER-CORE.md` §5 条 6 `:230-232`「注入面**五项**」vs `panel.mjs:14` 档头「**六项**」（含 ⑥ `slash`）——同句自指「逐项面单源 = panel 档头」 | **零代码改动**（档头六项 = 实态）⇒ **上抛**同上：设计档计数随动（父侧/设计舱） |
| F3 | 🔵 | §5 落点表 #8 误记批内件「332 行」 | **已收正**：实读 **326** 行（`test(` 恰 14 处 ⇒「14 例」无误）——本节即更正句 |
| F4 | 🔵 | 实施期临时假 DOM 探针 `.thincoder/tmp/slash-panel-probe.mjs`（审计 touched-list 项） | 已清（零残留）：探针内容移植入批内件腿 6A–6H 后删除——审计时已不在盘（同目录 `*slash*` 仅存设计核读 `.txt` 三件，非本舱） |

**fix 轮 1**（承审计）：F3 收正（本块）；F1 ∥ F2 = 上抛项（设计档措辞/计数，非本舱笔）；代码面零改动（审计 ①/② = 0 ⇒ 无静默简化、无部分实现）。

**代码评审核（内部 advisor · code · 2026-10-01）**——对象 = 9 档（8 产品档 + 批内件）∥ 设计面三档。**VERDICT: pass**（🔴 0 ∥ 🟡 5 ∥ 🔵 1——皆建议级，零 must-fix）。响应表（逐条）：

| # | 级 | 发现 | 响应 |
|---|---|---|---|
| R1 | 🟡 | `deps.slash.actions` 键零读（设计说端侧装配；实现 = 面板装配） | 采纳为**报告项**：代码零改（同钮同门唯一可行形；改读端侧 `actions` 会造第二实现面 ⇒ 反违 KD-S2）⇒ **上抛**设计面措辞收正（同审计 F1） |
| R2 | 🟡 | `RENDER-CORE.md:231`「注入面五项」vs `panel.mjs:14` 档头「六项」 | 采纳 ⇒ **上抛**设计档计数收正（设计档非本舱笔；同 F2） |
| R3 | 🟡 | `panel.mjs` 489 越 300 顾问线（≤500 硬限内） | 采纳为**在册债**（档内 `:38-40` 注记在盘 + 触发 + 拆档候选）；本轮零动作（R3 口径：在册债不升级） |
| R4 | 🟡 | model-menu 456 ∥ i18n-views 348 ∥ i18n.mjs 401 越 300（皆在册续期）+ 档面现值行滞后（336/394 vs 实读 348/401） | 三档拆分处置在册（键行 ∥ 机械提取 = 非结构性触碰 ⇒ 续期成立）；**收口轮按盘实读回填**（父侧/设计舱） |
| R5 | 🟡 | 批内件 326 行（>300，无在册预算行）+ 腿 6E/6G **断言恒真**（期望取同源词表 —— 缺键时两侧同回落键名）+ 缺「不传 `deps.slash`」不变量腿 | **已修（fix 轮 2）**：① 6E/6G 补「键须在册」非恒真盾（`notEqual(t(key), key)` + 词表相等断言双保）；② 新增**腿 6I**（`slash: null` ⇒ `/model` 照普通消息径 + 零菜单）——VSC 零接缝不变量机检面；③ 批内件体量 = 批内件属性（不进仓套件、无在册预算行），保留并披露 |
| R6 | 🔵 | 核 toast 真 `setTimeout(…, 2600)` 未清 ⇒ 跑批时长绑墙钟（实跑 ≈2743ms） | **已修（fix 轮 2）**：`toastText()` 读取后清 `showToast._t` ⇒ 复跑 duration ≈**173ms** |

**fix 轮 2 后复跑（终次）**：`node --test docs/batches/2026-10-01-desktop-slash-commands.test.mjs`（仓根 `thincoder/`）⇒ **tests 15 ∥ pass 15 ∥ fail 0**（duration ≈173ms）。

**轮次与终态（本舱）**：实施（initial）⇒ 内部探索发散审计 **1 轮**（🔴0 ∥ 🟡1 ∥ 🔵3；代码/行为面零阻塞）⇒ fix 轮 1（F3 §5 记录收正）⇒ 内部 advisor 代码评审核 **1 轮**（**pass**）⇒ fix 轮 2（R5 ∥ R6 批内件收正）⇒ **终态 = clean**（无未决阻塞项；上抛 2 项 = 设计档措辞/计数收正，归父侧/设计舱——`RENDER-CORE.md` §5 条 6 `:236` 注入句 ∥ §5 条 6 `:231` 计数词）。

**读数总表（本舱终态 · 内容行数口径）**：`slash.mjs` 43 ∥ `panel.mjs` 489 ∥ `model-menu.mjs` 456 ∥ `controls.mjs` 219 ∥ `slash-commands.mjs` 41 ∥ `mount-composer.mjs` 283 ∥ `i18n-views.mjs` 348 ∥ `i18n.mjs` 401（表外随动）∥ 批内件 335（腿 6I 后；15 例）。全部 `node --check` 过。

**读数收正（同节末）**：批内件实读 = **345 行**（腿 6I + 断言盾 + 定时器清理后；上句「335」系笔误——以本句为准）；余八档读数与上表逐字相等（489 ∥ 456 ∥ 219 ∥ 43 ∥ 41 ∥ 283 ∥ 348 ∥ 401）。

**§5 实施记录（eng-coder · 2026-10-01② · 台账 #761 · 轮次 = `/help` 增量 · initial）**

**交付摘要**：照批档 §2.10 全段 + §3 轮次 3 四项砍单（终形 = **13 产品档 + 批内件**）实施：`/help` = **流内非块行族 `[data-help]`**（标签 ∥ 组行 ∥ 命令行逐行；内容单源 = 端表本体经核 `formatHelp(commands, t)`）；打印口 = **端侧构造点闭包注入**（`panel.mjs` ∥ `ctx` **零触**——500 硬限余保 11）；槽位 = 尾组（台账行组后 ∥ 卡前）；生命周期 = 运行期痕（首屏页读整置清——运行期痕**五清**）；`run` 返真 ⇒ 清框 + 入历史 + **回底**；别名 `/h`；未知反馈携 `/help` 指引；词键 6 新键 × 2 语；en desc = CLI `desc` 逐字（机检）。

**落点表「§2.10.4 预期 ⇒ 实读」**（内容行数口径 = 文末换行不计）：

| # | 档 | §2.10.4 预期 | 实读 |
|---|---|---|---|
| 1 | 核 `composer/slash.mjs` | 43 ⇒ ≈88 | **69**（+`formatHelp` ∥ `HELP_GROUPS` ∥ 档头三件句——只降不升） |
| 2 | 核 `composer/panel.mjs` | （裁单出列） | **489 零触** ✓ |
| 3 | 端 `renderer/slash-commands.mjs` | 41 ⇒ ≈66 | **65**（`createSlashCommands(printHelp)` 工厂 ∥ +`group`/`descKey` ∥ `/help` 条） |
| 4 | 端 `renderer/mount-composer.mjs` | 283 ⇒ ≈296 | **296**（+`formatHelp` import ∥ `printHelp` 口 ∥ 表构造 + `deps.slash` 装配） |
| 5 | 端 `renderer/store.mjs` | 307 ⇒ ≈322 | **322**（+`helpLines` 槽 ∥ `setHelpLines` 纯动作四判） |
| 6 | 端 `views/chat-model.mjs` | 105 ⇒ ≈117 | **117**（+`helpLinesOf` ∥ `help` 字段） |
| 7 | 端 `views/chat-chrome.mjs` | 221 ⇒ ≈252 | **252**（+`helpGroupNode` ∥ `syncHelp` ∥ `helpAnchorOf` ∥ 锚链四件随动） |
| 8 | 端 `views/chat-tree.mjs` | 151 ⇒ ≈153 | **153**（帮助行族入树——台账行组后 ∥ 卡前） |
| 9 | 端 `views/compress-status.mjs` | 75 ⇒ ≈76 | **75**（`compressAnchorOf` 链补） |
| 10 | 端 `frame-dispatch.mjs` | 53 ⇒ ≈56 | **53**（`CHAT_KEYS` += `helpLines`——行内改、零行增） |
| 11 | 端 `page-read.mjs` | 282 ⇒ ≈294 | **293**（+`clearHelpLines`——五清） |
| 12 | 端 `renderer/i18n-views.mjs` | 348 ⇒ ≈364 | **362**（+6 键 × 2 语 ∥ `slash.unknown` 值收正携指引） |
| 13 | 端 `renderer/i18n.mjs` | 401 ⇒ ≈404 | **404**（键数链回填：`VIEWS_DICT` 129 ⇒ 135 ∥ `HOST_DICT` 302 ⇒ 308） |
| 14 | 端 `renderer/chat-fixes.css` | 118 ⇒ ≈126 | **124**（帮助行族三行类 + `pre-wrap`） |
| 15 | 批内件 `2026-10-01-desktop-slash-commands.test.mjs` | 345 ⇒ ≈430（评审裁单 ≈+30–40） | **425**（18 例全绿；披露见下） |

**验收（实跑读数）**：
- `node --test docs/batches/2026-10-01-desktop-slash-commands.test.mjs` ⇒ **tests 18 ∥ pass 18 ∥ fail 0**（duration ≈140ms）。腿集 = 既有腿 1–7 随动收正（腿 1 补 `/h` 别名 ∥ 腿 2 去 `/h` `/help` ∥ 腿 3 补 `/help x` ∥ 腿 4 扩——组 ∥ `descKey` ∥ **en desc == CLI `desc` 逐字** ∥ 腿 5 扩——在册 5 条 + `/help` 闭包打印口返值直传 ∥ 腿 6A–6I + **腿 6J**（`/help` ⇒ 打印口恰一调 + 清框 + 入历史 + 零上行 + 零 hooks）∥ 腿 7 扩——九键 × 2 语逐字 + 两语键集相等）+ **腿 8**（`formatHelp` 三段形 ∥ 组序 = CLI 同序 ∥ 组内序 = 表序 ∥ 无组跳过）+ **腿 9**（`setHelpLines` 四判 ∥ 回底合成）。
- 逐档 `node --check` 全过（13 档 + 批内件）。
- **端侧链器械实跑**（临时探针 · `/rc/` 解析垫片 · 真装配 `attachComposer` ⇒ `/help` 提交 ⇒ 打印口 ⇒ store ⇒ 模型 ⇒ 行族）**29 项全过**：打印口落切片（8 行 · zh 标签 `❯ 帮助` · `Agent:`/`System:` 组行）∥ 受理径清框 + **回底**（离底态起手 ⇒ `following` 真 ∥ `pendingNew` 0）∥ `chatModel.help` 同引用投影 ∥ 构树含帮助行族 ∥ 帧刷 `[data-help]` 在场（8 × `data-help-line` + `data-help-kind`；**子序实读 = 台账行组 → 帮助行族 → 药丸（卡位）**——锚径实走）∥ 零 `data-block-id` ∥ 两锚（`blockAnchor` ∥ `compressAnchorOf`）命中行族（先于卡 ∥ 药丸）∥ 幂等（同容再刷零写 ∥ 节点身份不变）∥ 内容变 ⇒ 原位换（零搬移 ∥ 槽位零跳）∥ 缺席摘除 ∥ `CHAT_KEYS` 含 `helpLines` ∥ 首屏页读整置清点 + 回填径零动。
- 真机腿（用户走查）：`/help` ⇒ `[data-help]` 三段形在场 + 回底；重开会话 ⇒ 行族失（E10–E13）。

**决策透明表**：

| # | 决策 | 理由 · 影响 |
|---|---|---|
| 1 | **打印口 = 表构造期闭包注入**（`createSlashCommands(printHelp)`；`deps.slash` 只给 `{ commands }`） | 依 §3 轮次 3 裁单（闭包注入 ⇒ panel ∥ `ctx` 零触 ∥ 余量保 11）+ §2.10 终形（13 产品档）。**与 §2.10.3 项 2 ∥ §2.10.4 #2 ∥ E12① 的旧「转发形」措辞相抵**——见上抛 1 |
| 2 | **`/help` 条 `run` 零参**（`() => printHelp?.() === true`） | 面板 `run` 调用面仍传 `ctx`（实读 `panel.mjs:383`），条目忽略之；可选链 = 沿设计原形缺参防御（采纳代码评审核 🔵）——零行为变、零 throw 面 |
| 3 | **`syncHelp` 零写判据 = 内容逐行等价**（`kind + " " + text` 拼串比） | 依 E12④ ∥ `RENDERER.md:86` 字面「内容逐行等价 ⇒ 零写」∥ 设计句「同 `syncTimer` 形」；初稿取 `syncLedger` 同引用短路 ⇒ 审计判「规格字面差」⇒ fix 轮 1 改内容判（**重印同容 = 零写**；内容变 = 原位换） |
| 4 | **行数压线入预算**（`mount-composer` 296/296 ∥ `store` 322/322 ∥ `chat-chrome` 252/252 ∥ `chat-model` 117/117 ∥ `i18n` 404/404） | 各档 ≤ §2.10.4 预算（压注释密度入内；**零判据句删减**） |
| 5 | **批内件 345 ⇒ 425** | 超评审裁单估（≈+30–40）约 +40；驱动 = 行集逐条断言（腿 8）∥ 表纪律扩（腿 4）∥ 词键九键 × 2 语逐字（腿 7）；**腿集与裁单一致、零越集腿**；≤ 设计表 ≈430。披露见下 |

**审计轮 1（内部 explore 发散审计 · 只读）**——🔴 **0** ∥ 🟡 2 ∥ 🔵 6（四类内：DOC-DRIFT ×5 ∥ OUT-OF-LIST ×1）。**代码 ∥ 行为面零偏差**（机制断言 1–6 逐条「一致」；验收 ②③④ 一致）。本舱处置：① `syncHelp` 零写判据字面差 ⇒ **fix 轮 1 采纳**（改内容判）∥ ② 探针两件 = 临时器械 ⇒ **fix 轮 1 清道** ∥ 余 = 设计档/批档残句与注释残句（非本舱笔 ⇒ 上抛/列报）。

**代码评审核（内部 advisor · code）**——对象 = 13 产品档 + 批内件 ∥ 设计面。**VERDICT: pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 3）。响应表（逐条）：

| # | 级 | 发现 | 响应 |
|---|---|---|---|
| R1 | 🟡 | 批档 §2.10.3 项 2 ∥ §2.10.4 #2 ∥ E12① 仍述 `deps.slash = { commands, printHelp? }` + `ctx` 转发 + panel 489 ⇒ ≈494——与 §3 轮次 3 裁单 ∥ §2.10 终形相抵（实现取后者） | **采纳为报告项**（代码零改——实现按裁单）：= 上抛 1 |
| R2 | 🟡 | 越 300 顾问线四档：`store` 323（在册待裁）∥ `i18n-views` 362（在册续期）∥ `i18n` 404（本增量 +3 注释行——无在册处置句）∥ 批内件 425（批内件属性） | **采纳**：`i18n` 补在册续期句 = 上抛 2（设计档）；余三档零动作 |
| R3 | 🔵 | `createSlashCommands(printHelp)` 缺参无防御（缺 ⇒ `run` 抛）∥ 面板 `cmd.run` 无 try/catch | **已修（fix 轮 1）**：`run: () => printHelp?.() === true` |
| R4 | 🔵 | 本增量 13 档中 6 档无任何机检执行面（画件 ∥ 锚链 ∥ 清点 ∥ 帧键 ∥ 模型 ∥ 打印口端到端）；E13 机检判据句无对应腿 | **不采纳（附由）**：渲染面 import 面含 `/rc/` 根（`chat-chrome` → `chat-tool` → `/rc/lib.mjs` 链）⇒ 平 node 批内件不可达——此即评审轮 3 把画件/锚位裁归真机之由；**替代证据 = 端侧链器械实跑 29 项全过**（器械一次性、已清）。E13 机检面缺口随本表披露 |
| R5 | 🔵 | `syncHelp` 形参 `text` 遮蔽 `dom.mjs` 的 `text` 导入 | **已修（fix 轮 1）**：形参改名 `rowText` |

**fix 轮 1（承审计 + 代码评审）**：① `syncHelp` 零写判据 ⇒ 内容逐行等价；② `/help` `run` 补缺参可选链；③ 形参遮蔽收正。**fix 后复跑（终次）**：批内件 **18/18 全绿**（≈141ms）∥ 器械 **29/29 全过**。

**轮次与终态（本舱）**：实施（initial）⇒ 内部 explore 审计 **1 轮** ⇒ fix 轮 1 ⇒ 内部 advisor 代码评审核 **1 轮**（**pass**）⇒ fix 轮 1 后复跑 ⇒ **终态 = clean**。

**上抛 ∥ 列报（非本舱笔）**：

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| 上抛 1 | 「转发形」残句：`RENDER-CORE.md:78 ∥ :235-238 ∥ :389` ∥ `PROJECT.md:1149` ∥ 批档 §2.10.3 项 2（`:257`）∥ §2.10.4 #2（`:269`）∥ E12①（`:251`）——实态 = 闭包注入 ∥ panel 零触 | 设计/记录面 | 设计舱/父侧补收正句（以 §2.10 终形 ∥ §3 轮次 3 为准） |
| 上抛 2 | `renderer/i18n.mjs`（404）无越层在册处置句（§2.10.4 #13 只给行数） | 设计面 | 补在册续期句（键数链注释 = 非结构性触碰） |
| 列报 3 | `panel.mjs:31` 条目形句缺 `group?`/`descKey?`（零触档）；`views/chat.mjs:29-31 ∥ :38-43` 根子序/模型形注释缺帮助行族与 `help` 字段（设计表未列该档） | 注释残句 | 随该二档下次触碰收正 |
| 列报 4 | E13 机检判据句（零 `data-block-id` ∥ `chromeProps` 计数不含行族）现无批内件腿（渲染面 import 面不可达 ⇒ 归真机腿；器械已留读数） | 测试面 | 如需常驻机检 = 另批立探针件（本舱零立件） |

**零触面核（本舱零改）**：`panel.mjs` **489 零触** ✓ ∥ `composer-wire.mjs` ∥ `composer-sync.mjs` ∥ `app.mjs` ∥ `index.html` ∥ `IPC.md`（**零新通道**）∥ 外舱（CLI 全树 ∥ VSC 全树 ∥ `thincoder-core`）∥ 需求档 ∥ 设计四档。

**读回（D6）**：本节写入后现读回核（§5 状态行 + 本块落位）✓。

## §6 验证与收口（父代理）

- **读数回填（父侧 · 2026-10-01）**：§2.10 块「现行 ⇒ 预期」⇒「现行 ⇒ 实读（实施落盘）」**十五行全量回填**（slash.mjs 69 ∥ slash-commands 65 ∥ mount-composer 296 ∥ store 322 ∥ chat-chrome 252 ∥ chat-model 117 ∥ chat-tree 153 ∥ compress-status 75 ∥ frame-dispatch 53 ∥ page-read 293 ∥ i18n-views 362 ∥ i18n 404 ∥ chat-fixes.css 124 ∥ 批内件 425）；`PROJECT.md` §4.1 随动（含 `store.mjs` 越层续期裁落）。零新语义；明细 = `docs/desktop/design/PROJECT.md` 变更记录 2026-10-01 行。
