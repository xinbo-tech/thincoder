# 2026-09-29 · 桌面：撤会话头（三值归输入区）+ 工具头色 VSC 逐值
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 21:35 走查两条（① 撤会话头模型选择栏「有点多余，应该去掉」② 工具标题色回 VSC 逐值「更喜欢原来的颜色」）+ 21:38「开」。
> 台账 = #668 ∕ #669（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

- 用户 2026-09-29 21:35 走查两条：①「会话区上面还有一个模型选择栏，那个有点多余，应该去掉」②「工具标题用的颜色跟vsc和cli不一样，这个颜色不好看，我还是更喜欢原来的颜色」。
- 21:38：「**开**」——批点燃（一件批两条目）；同刻「**后续你自己跑完吧**」= 全链授权（评审代点火 ∕ 批准代签——沿自缚三条件核验）。

### 1.2 已核事实（父侧实读 · 2026-09-29 21:3x）

**① 会话头（`[data-slot="session-head"]`）**

- 结构：`renderer/index.html:41` `<header class="session-head" data-slot="session-head">`；内容 = 仅 provider ∕ 模型 ∕ 档位三值面。接线 = `renderer/mount-head.mjs`（155 行：候选面 + 写路 `session:prefs` + 回执刷行）+ `renderer/views/chrome.mjs` 头段 + `chrome.css:49`。
- **在册身份 = U-R1-1**（`docs/batches/2026-09-28-desktop-input-vsc-align.md:456`「会话头三值 × 面板控件行 · 重复面待裁」——候选 ㈠保留头（当时倾）∕ ㈡撤三值 ∕ ㈢随会话面板轮）——用户本条 = 裁定**整行撤除（含槽）**（父侧默认读法获「开」确认）。
- **判据句（撤面不丢能力）**：撤前须实核输入区控件行**三值覆盖**（模型浮层 = provider→模型两级 ∕ 档位面）——覆盖缺 ⇒ **stop and report**。
- **退役前须逐函数实核** `mount-head.mjs` 实际接线：其档头 ∕ 文档行（设计 `PROJECT.md:276`）含「状态栏读数节点（`data-usage`）」字样，而 `data-usage` 现读只命中 `views/statusline-segments.mjs:176`——**疑文档滞后**；以实读为准，防误撤活面。

**② 工具头行色**

- **设计已裁在先**（`docs/desktop/design/UI.md`「本批注（对齐第三批 · 小修族）」项 2——「#38 裁定 · 2026-09-29 · 本句为准」〔父侧收正，原引 `:356-358`〕）：`name` 段 = `color: var(--accent)`（VSC `.tool-call-name` 逐值）· `args` 段 = `color: var(--fg)`；**两态色归 `status` 段内联**（`[data-status]` 整行两态色退场）；耗时段一行（11px ∕ .6）随落。
- **代码未落**：`renderer/chat.css:92-107` 旧形（`[data-status="done"] ⇒ 整行 #4ec9b0` ∕ `error ⇒ #f14c4c`；`[data-seg="name"]` 无 accent；`args` 无 `--fg`；无 time 段规则）；`:101-107` 注释「停报待设计面决策」**已过时**（决策已有）。
- VSC 逐值基准（只读）= `thincoder-vscode/webview/chat.css:216-244` + 状态色内联 `thincoder-render-core/flow/tool-card.mjs:111/:114`。

### 1.3 批面（授权口径）

- ① 撤会话头：需求档 `docs/desktop/requirements/PROJECT.md` §3.1 修订 + 设计三档随动（`UI.md` ∕ `SHELL.md` ∕ 设计 `PROJECT.md`）+ 实施面定形（`index.html` ∕ `app.mjs` ∕ `mount-head.mjs` 退役 ∕ `views/chrome.mjs` 头段 ∕ `chrome.css` ∕ i18n 键 ∕ 测试与行数表）；
- ② 工具头色：按已裁 `UI.md:356-358` 落码（`chat.css` 段改 + 过时注释收正）；设计面随检（若需互校微调）；
- **边界**：不触 #666 ∕ #667（在飞）；核件（`thincoder-render-core` ∕ VSC 树）零改（VSC 面仅作逐值基准——只读）；不重开 U-R1-1 以外的历史裁项。

### 1.4 判据与验收

- ① 真机：会话区上方**无**模型选择栏（槽退骨架 ∕ 零节点）∧ 三值仍可改（输入区控件行）；
- ② 真机：工具卡头行 = **accent 色标题**（与 VSC 逐值并读）；done 工具不再整行绿；
- 机检：批内件按设计轮定形；真机对照 = 父侧跑；
- 链：设计 → 评审（代点火）→ 批准（代签）→ 实施 → 父侧真机复核。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（撤 ∕ 色两目全覆盖；三件必备核齐备（撤面无缺口 ∕ 退役安全 ∕ 键族退场范围）——设计档五档随动已落；需求档 §3.1 修订已落（父侧落笔——需求档 `:269` 变更记录同笔）；评审轮 1 十条修正已载 §2.10（2026-09-29））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目表（两条目 · 台账 #668 ∕ #669）

| # | 条目 | 来源 | 判据（机检 ∕ 真机） |
|---|------|------|---------------------|
| B-1 | **撤会话头**：`[data-slot="session-head"]` 整行含槽退场（`renderer/index.html:41`）——三值（provider / 模型 / 档位）唯一居所 = 输入区控件行；U-R1-1 裁定 = 整行撤除（含槽） | 用户 2026-09-29 21:35 走查① · 台账 #668 | 机检：骨架零该槽 · 头面模块面退役 · `head.field.*` 词键退场 · 输入区三值写路存续；真机：会话区上方零节点 ∧ 三值仍可改（父侧） |
| B-2 | **工具头行色 VSC 逐值落码**：`chat.css` 段级（`name` → `--accent` ∕ `args` → `--fg` ∕ 整行两态退场 ⇒ `status` 段两态 ∕ `time` 段 11px ∕ .6 ∕ 过时注释收正）——承已裁 `docs/desktop/design/UI.md:356-358`（#38 裁定 · 本句为准） | 用户 2026-09-29 21:35 走查② · 台账 #669 | 机检：规则逐值锁（段级）；真机：accent 标题 ∧ done 不整行绿（父侧与 VSC 并读） |

**来源** = 批档 §1.1；**边界** = 不触 #666 ∕ #667 在飞批面 · 核件（`thincoder-core` ∕ `thincoder-render-core`）零改 · VSC 树零改（只读基准）。条目 2.2–2.7 续后。

### 2.2 覆盖核结论（三件必核 · 实读为凭——撤前核）

**Ⓐ 输入区三值覆盖（「撤面不丢能力」判据句）= 齐备（无缺口——不触发 stop）**：

- 写路实读在：`thincoder-desktop/renderer/composer-wire.mjs:217` `selectModel` ⇒ `session:prefs { key, patch: { model, provider } }`（**双键同送**——核 `model-required` 约束满足）· `:218` `selectReasoning` ⇒ `{ effort: effortOf(payload.reasoning) }`（档位两向映射 = `composer-sync.mjs:36-39`：`none ⇄ "off"` ∕ `"" ⇄ "auto"`）。
- 菜单实读在（核件 `thincoder-render-core/composer/model-menu.mjs` 零改）：`:298-300` `onPick: ({ provider, model })` ⇒ `selectModel(m)`；`:360` `post("selectModel", { model: m.id, provider: m.provider || "" })`——**provider → 模型两级选取同拍出站**；`:410` `post("selectReasoning", { reasoning })`。
- ⇒ provider ∕ 模型 ∕ 档位三值皆可自输入区控件行就地改；回执 `meta` ⇒ `sessionMeta[key]` 切片写（`composer-wire.mjs:186-194`）——头面退场后该切片仍由输入区候选面消费（写径既有）。

**Ⓑ `mount-head.mjs` 逐函数接线（防误撤活面）= 纯会话头面，退役安全**：

- 全档实读（155 行）：`attachHead({ host, onRepaint })` 三出口——① 候选面 = `provider:list` ∕ `model:list`（`:62-96`）；② 写路 = `session:prefs` + 回执 `meta` 刷 `sessionMeta`（`:99-136`）；③ 随动 = 候选缓存同步（`:139-152`）。**无状态栏面 · 无 `data-usage` 字样**。
- 状态栏活面实读在位：`renderer/mount-status.mjs`（43 行 · `STATUS_KEYS` + `attachStatus`）+ `views/statusline*.mjs`；`data-usage` 实读命中 = `views/statusline-segments.mjs:176`——**`docs/desktop/design/PROJECT.md:276` 与 `SHELL.md:84` 两处文档句（「mount-head 承状态栏读数节点」）为滞后** ⇒ 随批收正（§2.3 ∕ §2.4）。
- 消费面全清：`attachHead` 全仓引用 = `renderer/app.mjs` 六处（`:14` 注释 ∕ `:34` 导入 ∕ `:68` 实例 ∕ `:94` 刷行 ∕ `:280` 候选首取 ∕ `:285` 面表）——退场面闭合。

**Ⓒ i18n `head.*` 键族（退场范围）= 3 键 × 2 语**：

- 定义：`thincoder-desktop/renderer/i18n.mjs:189-191`（en：`head.field.provider` ∕ `.model` ∕ `.effort`）+ `:297-299`（zh：渠道 ∕ 模型 ∕ 档位）+ 段注 `:100`。
- 消费：`renderer/views/chrome.mjs:139`（`aria-label`）与 `:214`（就地更新 label）——**仅此两处**（随头族退场）。
- 退场范围 = 上述 6 行 + 段注收正；他键零动。

### 2.3 设计档落点（逐档逐处 · 本轮已落）

**① `docs/desktop/design/UI.md`**：档头板块清单去「会话头」· §1 布局行（中区 = 会话控制条 + 对话流 + 输入区）· §1 **会话头行整行退役**（原第三行——三值内容归输入区行）· §1 输入区行增「撤会话头随动」句（三值唯一居所 + 忙态写门承接）· §1 设置面行「会话级切换在会话头」⇒ 输入区控件行 · §1 批 B 注：前言五行 ⇒ 四行 + 项 1 改写（三值居所句）+ 项 5 两处名收正 · 「对齐第三批」项 **23 删**（题头 25 ⇒ 24 + 正文计数句）+ 项 28 指涉收正 · D24 注六处（骨架线 4 ⇒ 3 ∕ 控件族 8 ⇒ 7 ∕ `.head-field` 特例 ∕ `.head-pick` 边界 ∕ 上抛① 三处销 ∕ 计数·命中面随动）· 状态栏对齐注（注头「两行」⇒ 一行 + 表行 1 删「会话头回三值」句）· 重建保真注项 2 去「会话头三控件」· 变更记录一行。

**② `docs/desktop/design/SHELL.md`**：§1 树去 `mount-head.mjs` 行（退役 · 删档——「状态栏读数节点（`data-usage`）」旧述为文档滞后，一并销）· 变更记录一行。

**③ `docs/desktop/design/PROJECT.md`**：§4.1 八行随动（`index.html` ∕ `chrome.css` ∕ `skin.css` ∕ `app.mjs` ∕ `i18n.mjs`（值 + 描述两处）∕ `chat.css` ∕ `frame-dispatch.mjs`（五面）∕ `views/chrome.mjs`）+ `mount-head.mjs` 行删（删档）+ 越层段 i18n 值随动 · **KD-17 ∕ KD-18 ∕ KD-30 ∕ KD-48** 面名句收正 · **D6 / D22 / T-DSK7 / T-DSK43** 四行随动 · §4.2 增本批「现行 ⇒ 预期」块（12 行）· §10 增 **CO** 行 · 变更记录一行。

**④ `docs/desktop/design/RENDERER.md`**（派单「三档」外之第四档——实读所得同族残引）：§1.1 重建保真身份清单去「会话头 `[data-field]`」· 重挂径「其余五面」⇒ 四面 · §1.2 帧分派「六面」⇒ **五面** + 逐面落点句 · 变更记录一行。

**⑤ `docs/desktop/design/IPC.md`**（同④之第五档）：`session:prefs` 行（键闭集 ∕ `meta` ∕ 就地刷句）· `history:page` 行（`meta` 句）· 「会话级偏好注」项 1 · 「模式位投影注」项 4 · 「档位控件注」现值条——「会话头三值」⇒ **「会话级三值」**（五处）· 变更记录一行。**通道集 ∕ 载荷 ∕ 白名单计数零变**。

**⑥ 需求档 `docs/desktop/requirements/PROJECT.md` §3.1 修订 = 拟文案在册（§2.8）——落笔 = 主 agent（笔权）。**

### 2.4 实施清单（逐档：撤 ∕ 改 ∕ 删——供 eng-coder）

| # | 档 | 动作 | 要点（落点判据） |
|---|---|---|---|
| 1 | `renderer/index.html` | 撤 | 会话头槽行（:41）删；骨架注释「中区四槽」⇒ 三槽（`session-control` / `flow` / `composer`） |
| 2 | `renderer/app.mjs` | 撤 | 头接线八处：文档行（:14）· `import { attachHead }`（:34）· `import { mountHead }`（:44）· `HEAD_SLOT`（:57）· `attachHead` 实例（:68）· `paintHead`（:93-95）· 候选首取（:280）· 面表 `head` 键（:285） |
| 3 | `renderer/mount-head.mjs` | **删（退役）** | 整档删除——实读其面 = 纯会话头接线（§2.2Ⓑ）；消费面全清 |
| 4 | `renderer/frame-dispatch.mjs` | 改 | `HEAD_KEYS` 导出删 + `FRAME_FACES` 头面行删（六面 ⇒ 五面）+ 头部注释同拍 |
| 5 | `renderer/views/chrome.mjs` | 改（大撤） | 头族全段删（`headModel` / `headTree` / `mountHead` / `pickNode` / `optionSet` / `effortOptions` / `acceptPick` / `syncPick` / `syncHead` / `fieldNode` / `fieldOf` / `candidateFace` / `listOf` / `providerNameOf` / `FIELD_ORDER` / `PICK_FIELDS` / `EFFORT_NONE` / `sessionMetaOf`）+ 相关 import ∕ 注释；**留守面勿动**：`BADGE_WORD` / `busyOf` / `suspActiveOf` / 状态行三再出口 |
| 6 | `renderer/chrome.css` | 撤 | `.session-head`（:49-53）· `.head-fields` ∕ `.head-field` 族 + 相关注释（:63 同族句 ∕ :218 注） |
| 7 | `renderer/skin.css` | 撤 | `.head-field` 交互态三值行（:11-13）+ 注（:10） |
| 8 | `renderer/i18n.mjs` | 撤 | `head.field.provider` ∕ `.model` ∕ `.effort` 两语各三行（en :189-191 ∕ zh :297-299）+ 段注（:100）收正 |
| 9 | `renderer/chat.css` | 改（② 落码） | 头行三整行规则（:92-100）退场 ⇒ `[data-status="error"] [data-seg="status"]` ∕ `[data-status="done"] [data-seg="status"]` 两条 + `[data-seg="name"]` 补 `color: var(--accent)` + `[data-seg="args"]` 补 `color: var(--fg)` + 新 `[data-seg="time"] { font-size: 11px; opacity: 0.6 }` + 注释（:101-107）收正（去「停报 / 相抵 / 待决策」）——逐值承 `UI.md:356-358`（#38 裁定 本句为准） |
| 10 | 测试面 | 新增 | 批内件一件：`docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs`（批次本地件 · 不登记仓套件 · 随批留存）——用例面 = §2.5 |

**行数预期**（§4.1/§4.2 已落 · ≈值）：`index.html` 56 ⇒ ≈55 · `app.mjs` 299 ⇒ ≈287 · `mount-head.mjs` 155 ⇒ 0 · `views/chrome.mjs` 252 ⇒ ≈60 · `chrome.css` 291 ⇒ ≈278 · `skin.css` 18 ⇒ ≈14 · `i18n.mjs` 393 ⇒ ≈386 · `chat.css` 327 ⇒ ≈330 · `frame-dispatch.mjs` 55 ⇒ ≈50。

### 2.5 测试面与判据

**批内件（机检 · 批次本地件——一案一件 · 随批留存 · 不入仓套件）**：

- T1 骨架：`index.html` 零 `session-head`（词面零命中）∧ 余槽四（`session-control` / `flow` / `composer` / `status`）在场（结构不变量）。
- T2 模块面：`views/chrome.mjs` 导出集——头族全无 ∧ 留守面在（`BADGE_WORD` / `busyOf` / `suspActiveOf`）∧ 状态行三再出口同名在（消费面零改）；`frame-dispatch.mjs` `FRAME_FACES` = 五面 ∧ 无 `HEAD_KEYS`。
- T3 词键：两语 `head.field.*` 零命中（`i18n.mjs` 源面扫描）∧ 余键零动（计数差 = −3）。
- T4 写路存续（「撤面不丢能力」机检腿）：stub 窄桥下 `post.selectModel({ model, provider })` ⇒ `session:prefs { key, patch: { model, provider } }`；`post.selectReasoning({ reasoning })` ⇒ patch `{ effort }`。
- T5 ② 规则锁（`chat.css` 源面断言）：`[data-seg="name"]` 含 `color: var(--accent)` ∧ `args` 含 `color: var(--fg)` ∧ `[data-status="error"] [data-seg="status"]` 含 `#f14c4c` ∧ `done` 含 `#4ec9b0` ∧ `[data-seg="time"]` 含 `11px` ∧ `.6` ∧ 整行裸规则零残留（三形零命中）。
- （可选负向对照：还原任一腿 ⇒ 对应断言红——沿批内件惯例。）

**真机对照配方（父侧 · D16）**：① 撤面——开桌面 ⇒ 会话区上方 = 会话控制条直连对话流（DOM 查 `[data-slot="session-head"]` = null）；输入区模型钮开菜单（两级：渠道行 → 模型）∨ 推理钮开列表 ⇒ 改值 ⇒ 切会话再切回 = 值保持（槽往返）——「三值仍可改」；② 头色——跑一工具 ⇒ 头行标题 = accent（与 VSC 并读同色）· done ⇒ 整行不变绿（色只在状态词段）· 失败 ⇒ 状态词段红 · 耗时段 11px ∕ 降显。

### 2.6 关键决策（含被否）

1. **会话头行退役形 = 整行删除**（沿「标签条行退役」先例）——不设墓碑句 ∕ 不留失效表述；题头计数同拍（小修族 25 ⇒ 24）。
2. **`mount-head.mjs` 整档删**——实读证明无状态栏活面（§2.2Ⓑ）；两处滞后文档句（设计 `PROJECT.md` mount-head 行 ∕ `SHELL.md` 树行）随批收正。
3. **覆盖核 = 撤面不丢能力**（§2.2Ⓐ）——写路 + 两级菜单实读在；覆盖缺 ⇒ stop 条件未触发。
4. **P23 删除而非改写**（该注项既有删项先例——A 面编号 1,2,3,5… 即历史上删项留隙之证）；忙态门承接句入输入区行（保位不隐藏）。
5. **② 落码严格按 `UI.md:356-358`**（#38 裁定「本句为准」）：整行三规则（含 `running` 行级——同属 `[data-status]` 整行机制，VSC 无行级色）一并退场；`status` 段两态段级落法照裁定「码面落法」句。
6. **巡查扩展三处同族面**（派单坐标外）：`skin.css` 交互态行 ∕ `RENDERER.md` 面数句 ∕ `IPC.md` 面名句——均「会话头退场」直接派生的死指针 ⇒ 随批收正（逐处已落）。
7. **边界守**：核件零改（`thincoder-core` ∕ `thincoder-render-core`）· VSC 树零改 · #666 ∕ #667 面零触（IPC 仅动五处面名句，与 #667 的「设置族注项 6」不重叠）。

### 2.7 上抛项

1. **需求档 §3.1 修订**——拟文案 §2.8 齐备；**落笔 = 主 agent**（需求档笔权；本档未写入——沿在册口径）。
2. 派单坐标清单差已处置（`skin.css` ∕ `RENDERER.md` ∕ `IPC.md`——§2.6⑥）；批档 §1.3「设计三档」实为四 + 一（含 IPC）——上报。
3. 档案观察（零动作）：`docs/batches/2026-09-29-desktop-rebuild-fidelity-{M606.test,P2P5.probe}.mjs` 含会话头行为用例——随面退场成档案件（不重跑，零动作）。
4. 观察：UI.md §1 形态行 25 ⇒ 24；现存「25 行」表述 = 历史条目（如设计 `PROJECT.md` §10 批 B 落形句）不追改（无现值断言——复核在案）。

### 2.8 需求档 §3.1 修订拟文案（供主 agent 落笔——本档不写入）

逐处（`docs/desktop/requirements/PROJECT.md`）：

- **§3.1 图**：`│ 会话头：provider / 模型 / 档位               │` ⇒ `│ 输入区：模型 / 推理档位（控件行就地可改）      │`
- **§3.1 面板行**：`：会话头 + 对话流 +` ⇒ `：对话流 +`
- **§3.1 会话头段（整段替换）**：原「**会话头（每会话）**：provider / 模型 / 推理档位——**会话级可改三值**（随会话槽持久化，切会话即随之切换，与 CLI / 扩展端同一份槽；**推理档位槽字段 = `effort`**——本节要求会话级、核尚未有 ⇒ 设计落点 = `docs/core/design/SESSION.md` §6.21 ✓）」⇒「**输入区（面板内底行）**：**三值（provider / 模型 / 推理档位）唯一居所 = 控件行**（模型钮（两级：渠道 → 模型）· 推理钮）——**会话级可改**（随会话槽持久化，切会话即随之切换，与 CLI / 扩展端同一份槽；**推理档位槽字段 = `effort`**——核侧已落，判据单源 = `docs/core/design/SESSION.md` §6.21 ✓）（2026-09-29 走查裁定：会话头面退场）。」（同段「模式四位住状态行行首」句与「工程模式属会话级」句**不动**——两事实仍在）
- **§3.1 状态栏行去重句**：`三值配置项住会话头、模式四位住状态行行首` ⇒ `三值配置项住输入区控件行、模式四位住状态行行首`
- **变更记录（+1 行 · 时间序末）**：「- 2026-09-29（**撤会话头随动 · 主 agent 落笔**——承批 `docs/batches/2026-09-29-desktop-head-toolcolor.md` §2 · 用户 2026-09-29 21:35 走查裁定）：§3.1 会话头行撤（整行含槽退场）；**三值归属句随动**——三值配置项住**输入区控件行**；§3.1 图同笔。设计定形 = `docs/desktop/design/UI.md` §1（已就地）。」

### 2.9 补记（收尾轮 · 全档扫「会话头」所得）

1. **`docs/desktop/design/E2E-TESTING.md`**（§2.3 清单外之第六档——全档扫描捕捉）：§6 `T-DSK43` 行 ③ 句「会话头三值控件 `disabled`」⇒「输入区模型 ∕ 推理钮 `disabled`」（与设计 `PROJECT.md` T-DSK43 行同笔）+ 变更记录一行。
2. **`UI.md` D21 注项 1 边界句**：枚举「块壳 / 卡族 / 会话头 / 标签条 / …」去「会话头 / 」——枚举死项移除（守「失效表达式即删」）。
3. **扫描面登记（全档扫「会话头」一词 · 设计域）**：净后存活命中 = 三类**记录面**，不追改——① 各档变更记录 ∕ §4.2 批行（历史条目：如 `PROJECT.md:433/:472/:476/:779`、`UI.md:600/:630/:654/:661/:680`、`IPC.md:366`、`PROJECT.md:1175/:1329`）；② 被否候选句（KD-30 三列「四态全留会话头」等 = 当时候选记录）、测试面历史覆盖清单（`PROJECT.md:963/:1011/:1023`）、批注前言作用域句（`UI.md:220` D24 注前言「五行」清单）；③ 历史 Δ 计数（`UI.md:200` 状态栏对齐批「会话头字段 5 ⇒ 3」）。口径 = 与 §2.7 观察 4 同（历史 belongs to 记录面）。
4. **收尾状态**：批档 §2 全节（2.1–2.9）+ 状态行「设计完成」；设计档六档随动全落（`UI` ∕ `SHELL` ∕ `PROJECT` ∕ `RENDERER` ∕ `IPC` ∕ `E2E-TESTING`）；需求档零写入（拟文案在册 §2.8——笔权 = 主 agent）。

### 2.10 修正轮记录（评审轮 1）

承 §3 轮次 1（发现 10 条：🔴 0 · 🟡 6 · 🔵 4——父侧裁定全收）；逐号处置如下（**#4 已由父侧直接落笔** `docs/desktop/requirements/PROJECT.md:169`——本轮零触）。设计面修正已随笔落盘；本节为 §2 行面（append-only）内两处过时状态句的现行口径。

1. **#1 状态句收正（五处）**：本节状态行（随本笔更新）· §2.7① ∕ §2.9.4 · 设计 `PROJECT.md:850`（§4.2 行 12）· `:1166`（§10 CO①）——统一口径 =「**需求档 §3.1 修订已落（父侧落笔 · 2026-09-29；需求档 `:269` 变更记录同笔）**」；设计档两处随笔落盘，本节为该两处之现行口径。
2. **#2 类名 ∕ 档名面收正**：`UI.md:70` 形句去「与 `.session-head` 底边线同语」死参照 · 设计 `PROJECT.md:87`（KD-45）消费者列 **3 ⇒ 2**（`mount-head.mjs` 删档）——均随笔落盘。
3. **#3 计数分裂收正（实点）**：实点 `UI.md` B 表 = **12 项**（编号 1–3 ∕ 5–7 ∕ 12 ∕ 14–15 ∕ 22 ∕ 26 ∕ 28）；`UI.md:378` 表头「13 项」⇒ **12 项** · `:421` D 计数句「外围 13 = 25」⇒ **外围 12 = 24**（`:341` 题头「小修族 24」为对）——随笔落盘。
4. **#5 档案登记增补**：§2.7③ 登记并入三件（同条观察；口径沿「不重跑 · 零动作」）：`docs/batches/2026-09-29-render-perf.test.mjs:25`（导入 `HEAD_KEYS`）· `:245`（断言 `FRAME_FACES[1][1] === HEAD_KEYS`——本批删导出 ⇒ 该件复跑必红：**日后复跑批内件须先补 render-perf 件**）· `docs/batches/2026-09-29-i18n-split.baseline.json:121-123` ∕ `:418-420`（`head.field.*` 六条）· `docs/batches/2026-09-29-structure-split-round.baseline.json:233`（`.session-head` 快照）——合 rebuild-fidelity 两件 共 **五件**（设计 `PROJECT.md:1166` ③ 已同拍）。
5. **#6 注释死指针点名**：§2.4#1 ∕ #2 ∕ #4 落点补点三处——`renderer/index.html:33`（「会话控制条 + 会话头 + 对话流」）· `renderer/app.mjs:59`（「六面重挂触发切片（`SESSION_KEYS` / `HEAD_KEYS` / `CHAT_KEYS`）」）· `renderer/frame-dispatch.mjs:27`（「六面表…会话控制条 → 会话头 → 状态行…」）；统一句 = **「六面 ∕ 会话头 ∕ `HEAD_KEYS` 三词注释面零残留」**（收正随实施轮）。
6. **#7 引坐标改符号指涉**：本批凡引 `UI.md:356-358` 三处（§1.2 ∕ §2.1 ∕ §2.4#9）——坐标过时（同内容现盘 = `UI.md:349-351`）；**正确指涉 = 「本批注（对齐第三批 · 小修族）」项 2**——本条 = 三处之现行口径；§1.2 行住 §1（笔权 = 主 agent）⇒ 已随报请父侧同拍收正。
7. **#8 槽数口径澄清**：§2.4#1 注释补括注 **「中区三槽；`status` = 窗口级底行另计」**（中区清单 ∕ 全档不变量两面）。
8. **#9 批内件规模预期**：`docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs` **≈130 行 · 5 用例**（T1–T5；≤300 惯例内）——§2.4#10 同笔；设计 `PROJECT.md:849`（§4.2 行 11）已落。
9. **#10 计数面收正**：`UI.md:214` 宿主键总数 **147 ⇒ 144**（退 `head.field.*` 3 键）· 设计 `PROJECT.md:1068`（§9 现值句；评审坐标 `:1052` 同句）收正为**形态行 21 ∕ 合计 23**（实点 2026-09-29；计法 = §1 表行条目数；后继各批落形句转标时点读数）——均随笔落盘；**§2.7 观察 4 更正**：「不追改」射程收窄至各批落形句——§9 现值句属现值面，已随本次收正。

**落点汇总**：设计档两档随笔（`UI.md`：:70 ∕ :214 ∕ :378 ∕ :421 + 变更记录一行；设计 `PROJECT.md`：:87 ∕ :849 ∕ :850 ∕ :1068 ∕ :1166 + 变更记录一行）；批档 §2 状态行同笔；需求档零写入（#4 父侧已落）。**本轮零新语义**（状态句 ∕ 计数 ∕ 登记 ∕ 规模预期）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（10 项：🔴 0 · 🟡 6 · 🔵 4）**

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 文档状态（R7a/R1） | 🟡 | 需求档 §3.1 修订**已落**（`docs/desktop/requirements/PROJECT.md:51` ∕ `:57` ∕ 变更记录 `:269`），而设计面四处仍作「待落笔」态：批档 §2 状态行 ∕ §2.7①（`:131`）· §2.9.4（`:151`）· 设计 `PROJECT.md:834`（§4.2 行 12）· `:1150`（§10 CO①）——「本档未写入 ∕ 拟文案在册」与实况矛盾 | 四处状态句随批收为「已落（同笔 = 需求档 `:269`）」或标闭项；口径 = 与需求档变更记录同源 |
| 2 | 死指针（扫描面） | 🟡 | 面名扫描以中文词「会话头」为唯一模式 ⇒ 类名 ∕ 档名引用漏网：`docs/desktop/design/UI.md:70`（可见面修复注项 1 形句以 `.session-head` 底边线为参照——该规则本批随 `chrome.css` 删）· 设计 `PROJECT.md:87`（KD-45 仍列 `renderer/mount-head.mjs` 为 `model:list` 三既有消费者之一——删档后成二） | 扫描模式并入 `.session-head` ∕ `mount-head` ∕ `head.field` 类名面；两处随批收正（沿 §2.6⑥ 同族先例） |
| 3 | 数值不自洽 | 🟡 | 同一注内计数分裂：`UI.md:341` 题头「小修族 24 + 相抵 2」 vs `UI.md:378`「B. 外围面（13 项）」（实列 12 项）· `UI.md:421`「对话流 12 + 外围 13 = 25」——§2.3① 声称的「正文计数句」随动未落盘 | `:378` ∕ `:421` 按实列改 12 ∕ 24（或注明计法口径） |
| 4 | 需求档残留 | 🟡 | `requirements/PROJECT.md:169`（D24 行）外壳面枚举仍含「会话头」（§3.1 已裁「整行含槽退场」⇒ 同档两处对同一面族表述不一）；§2.8 拟文案射程仅 §3.1 | 同笔去「会话头 / 」或按 §2.9③ 口径登记为历史枚举（二者择一） |
| 5 | 档案登记不全 | 🟡 | §2.7③ 只登记 rebuild-fidelity 两件；实测 `docs/batches/2026-09-29-render-perf.test.mjs:25` 导入 `HEAD_KEYS` ∧ `:245` 断言 `FRAME_FACES[1][1] === HEAD_KEYS`（本批删导出 ⇒ 该件复跑必红）；`docs/batches/2026-09-29-i18n-split.baseline.json:121-123` ∕ `:418-420`（`head.field.*` 六条）· `docs/batches/2026-09-29-structure-split-round.baseline.json:233`（`.session-head` 快照）同族 | 三条并入同一条档案观察登记（口径沿「不重跑 · 零动作」）；若日后复跑批内件 ⇒ 须先补 render-perf 件 |
| 6 | 实施清单漏点 | 🟡 | 撤面清单未点三处注释死指针：`renderer/index.html:33`（「会话控制条 + 会话头 + 对话流」——UI.md §1 布局行已改「+ 输入区」）· `renderer/app.mjs:59`（「六面重挂触发切片（`SESSION_KEYS` / `HEAD_KEYS` / `CHAT_KEYS`）」）· `renderer/frame-dispatch.mjs:27`（「六面表…会话控制条 → 会话头 → 状态行…」）；同批已按同标准点名 `chrome.css:63` ∕ `:218` 与 frame-dispatch 头部注释 ⇒ 标准不一 | §2.4#1/#2/#4 落点判据点名三处，或加统一句「六面 ∕ 会话头 ∕ `HEAD_KEYS` 三词注释面零残留」 |
| 7 | 引证坐标 | 🔵 | 批档 §1.2 ∕ §2.1 ∕ §2.4#9 三处引 `UI.md:356-358` 为 #38 裁定坐标；现盘 `:349-351` 才是该裁定，`:356-358` =「对齐第三批」项 5（中止·未结算卡清扫）——差 7 行（内容已逐字引，误读风险低） | 改引符号指涉（「本批注（对齐第三批 · 小修族）」项 2）——仓规既有「引符号不引行号」（`requirements/PROJECT.md:85`） |
| 8 | 口径澄清 | 🔵 | §2.4#1 注释改写为「三槽（`session-control` / `flow` / `composer`）」，而 T1（§2.5）断言「余槽四（含 `status`）」——两处槽数口径不同（中区清单 ∕ 全档不变量）未标注 | §2.4#1 括注「中区三槽；`status` = 窗口级底行另计」 |
| 9 | 行数注解 | 🔵 | 批内测试件 `docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs`（§2.4#10 ∕ `PROJECT.md:833`）未给规模预期（仓例：批内件标「N 行 · M 用例」） | 补规模预期一行（并守批内件 ≤300 惯例） |
| 10 | 计数面残余 | 🔵 | 数字面漏扫：`UI.md:214`「宿主键总数 147」= 本批退 3 键 × 两语前旧值（144）；设计 `PROJECT.md:1052-1057`「形态行 23 ∕ 合计 25 行」现值句未随动（本批删行 ⇒ 22 ∕ 24；实点 §1 表 21 行（批前 22）——计法未定）；§2.7 观察 4 以「历史条目」登记但 `:1052` 属 §9 现值指针句 | 两处随笔收正 ∕ 在 §2.7 观察 4 点名并给计法（历史读数 ⇔ 现值句分列） |

**覆盖核复核（实读）**：Ⓐ 写路存续 ✓（`renderer/composer-wire.mjs:217` `selectModel ⇒ session:prefs { model, provider }` ∕ `:218` `selectReasoning ⇒ { effort }`；核件两级菜单 `thincoder-render-core/composer/model-menu.mjs:298-300` `onPick ⇒ selectModel`）· Ⓑ 退役安全 ✓（`views/chrome.mjs` 消费面实读 = `app.mjs:44`（删面）∕ `composer-sync.mjs:25` ∕ `mount-composer.mjs:57`（`busyOf`/`suspActiveOf` 留守）∕ `views/session-control.mjs:24` ∕ `views/statusline.mjs:36`（`BADGE_WORD` 留守）——留守集齐备、零断裂）· 行数注解抽检 ✓（`index.html` 56 ∕ `chat.css` 327 ∕ `views/chrome.mjs` 252 ∕ `app.mjs` 299 ∕ `i18n.mjs` 393 ∕ `mount-head.mjs` 155 ∕ `frame-dispatch.mjs` 55——内容行数口径，与盘一致）· 越 300 档（i18n ≈386 ∕ chat.css ≈330）在册预案 ✓ · B-2 可实现性 ✓（`renderer/views/chat-tool.mjs:102-110` `time` 段已在产出面 ⇒ 仅 CSS 段级改动，无需视图面改）。

**计：🔴 0 · 🟡 6 · 🔵 4（共 10 条）· VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 批准（父侧代签 · 2026-09-29 22:4x）

- **授权基础**：用户 2026-09-29 21:38「后续你自己跑完吧」——全链授权（评审代点火 ∕ 批准代签，沿自缚三条件）。
- **自缚三条件核验**：
  - ① 设计评审 **pass**——§3 轮次 1（🔴0 · 🟡6 · 🔵4，10 条全收）；宿主机检两旗复核 = **误报**（`UI.md:308` ∕ `:198` 实读与引文逐字相符）。
  - ② 修正轮 **9/9 落地**并经父侧抽验——§2.10（`:153-167`）在位；抽验：`UI.md:70`（死参照去）· `:214`（147 ⇒ 144）· `:378`（12 项）· `:421`（12 = 24）· 设计 `PROJECT.md:87`（KD-45 3 ⇒ 2）· `:1068`（形态行 21 ∕ 合计 23 + 计法句）· `:1507`（变更记录同笔）；**上抛收口**：批档 §1.2 引坐标 `UI.md:356-358` ⇒ 符号指涉（父侧落笔 `:25`，标记「父侧收正」）。
  - ③ 设计 **token 在位**（值不落档——运行时凭证）。
- **批准结论**：**准予实施**——① 撤会话头（整行含槽退役 · 三值归输入区）② 工具头色（`chat.css` 段改）；批内件按 §2.10 条 8（≈130 行 · 5 用例）。
- **实施注意**：`app.mjs` 299 ∕ `chrome.css` 291 贴线（实施后实读复核）；需求档已由父部落笔（`:269`）——实施轮不再触；多线并发在写（邻线 pid=21400）——**落笔前逐档实读复核**。
- **附**：真机复核 = 父侧（模型栏消失 + 头行 accent 逐值 ∕ VSC 并读）；台账 #668 ∕ #669 收口归 §6。

## §5 实施记录（eng-coder）

**状态行**：实施完成（§2.4 十行全落 · 批内件 5/5 绿 · 审计轮 1 = 除 §5 缺项外 clean · 评审轮 1 = pass）

### 5.1 实施摘要（逐档落点 · 实读行数）

| # | 档 | 落点（要点） | 实读（修前 ⇒ 修后） |
|---|---|---|---|
| 1 | `renderer/index.html` | 会话头槽行整行删；注释收正（中区三槽 + `status` 窗口级底行另计） | 56 ⇒ 55 |
| 2 | `renderer/app.mjs` | 头接线八处退场（import ×2 ∕ `HEAD_SLOT` ∕ 实例 ∕ `paintHead` ∕ 候选首取 ∕ 面表 `head` 键 ∕ 文档行）+ 六面句五处收正 | 299 ⇒ 285 |
| 3 | `renderer/mount-head.mjs` | **删档**（退役）——全仓码面零引用 | 155 ⇒ 0 |
| 4 | `renderer/frame-dispatch.mjs` | `HEAD_KEYS` 导出删 + `FRAME_FACES` 五面 + 头部注释 | 55 ⇒ 52 |
| 5 | `renderer/views/chrome.mjs` | 头族全段删；留守 = `BADGE_WORD` ∕ `busyOf` ∕ `suspActiveOf` + 状态行三再出口 | 252 ⇒ 35 |
| 6 | `renderer/chrome.css` | `.session-head` ∕ `.head-fields` ∕ `.head-field` 族 + 两注收正 | 291 ⇒ 268 |
| 7 | `renderer/skin.css` | `.head-field` 交互态三值行 + 注 | 18 ⇒ 13 |
| 8 | `renderer/i18n.mjs` | `head.field.*` 两语 3 + 3 行退场 + 段注收正 + 计数链续笔 | 393 ⇒ 388 |
| 9 | `renderer/chat.css` | 整行三规则退场 ⇒ `[data-status="error"\|"done"] [data-seg="status"]` 段级两态 + `name` → accent ∕ `args` → fg + 新 `time` 段 11px ∕ .6 + 注释收正 | 327 ⇒ 329 |
| 10 | `docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs` | 新增批内件（T1–T5 · 5 用例） | — ⇒ 135 |

### 5.2 批内件读数（修前红 ∕ 修后绿）

- 跑法（cwd `thincoder/`）：`node --test docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs`
- **修前**（实施未落）：T1 ∕ T2 ∕ T3 ∕ T5 红（`session-head` 命中 3 · 导出集含头族 5 名 · 源面 `head.field.` 命中 6 · `name` 无 accent）；T4 绿（存续腿）⇒ 1 pass ∕ 4 fail。
- **修后**（实施已落）：**5/5 绿** —— 读数：`index.html` `session-head` 命中 0 ∧ 余槽四在场 · 导出锁集（`BADGE_WORD` ∕ `busyOf` ∕ `mountStatus` ∕ `statusModel` ∕ `statusTree` ∕ `suspActiveOf`）· `FRAME_FACES` = `sessionBar → status → chat → pool → cards` · `HOST_DICT` **292/292**（修前 295 —— 差 −3）· 写路 `selectModel ⇒ { model, provider }` ∕ `selectReasoning ⇒ { effort }`（`none ⇒ off` ∕ `"" ⇒ auto`）· `chat.css` name=accent ∕ args=fg ∕ status 两态段级 ∕ time=11px/.6 ∧ 整行裸规则三形 0。

### 5.3 决策透明（清单外改动逐处 —— 码面注释，零语义）

承 §2.6⑥「会话头退场直接派生的死指针 ⇒ 随批收正」同族标准（逐处已披露）：

| 档 | 处 | 理由 |
|---|---|---|
| `renderer/composer-wire.mjs` | `:184-185` | 死指针（`renderer/mount-head.mjs` 已删档）⇒ 改「输入区控件行 = 三值唯一居所」 |
| `renderer/page-read.mjs` | `:16-17` ∕ `:20` | 死指针（`views/chrome.mjs:8-9` 判据随头族退场）⇒ 自含句「会话级三值字段白名单」 |
| `renderer/store.mjs` | `:42-43` | 失效归属句（「`views/chrome.mjs` 会话头读 `sessionMeta`」）⇒ 消费面改指输入区候选面 |
| `renderer/views/settings-sections.mjs` | `:39` | 失效对照句（「沿会话头同口径」）⇒ 自含「档位闭集口径」 |
| `src/main/session-slots.mjs` | `:120-121` | 失效命名 + 死指针（「会话头三值」+ `views/chrome.mjs:8-9`）⇒ 「会话级三值」（与设计面同笔口径） |
| `renderer/chat-fixes.css` | `:9-10` | B-2 派生（旧括注「两段，后随 `running`」失效——整行色退场）⇒ 段级形述（评审轮 1 范围外注 1 同点） |
| `renderer/i18n.mjs` | `:67-68` | 计数链续笔（该档惯例「届盘实读续链」：**295 ⇒ 292**） |

### 5.4 审计与代码评审轮次与终态

- **内部审计（explore · 只读分叉审计）轮 1**：发现表 1 条 = §5 未写入（时序性缺项——本笔补即闭）；其余项 **clean**（十行落点全落零降级 · 行数申报逐档吻合 · 清单外改动均注释面死指针派生 ∕ 零新语义 · `thincoder-desktop/**` 撤面词面（`session-head` ∕ `HEAD_KEYS` ∕ `head.field` 及头族符号 + `mount-head`）零命中）。
- **代码评审（advisor · code）轮 1**：**VERDICT: pass**（🔴 0 · 🟡 0 · 🔵 3：`chrome.css:231` 注释死行号 `:393`（先于本批，非本批引入——非阻断）· i18n 头清单 ∕ `skin.css:2` 记录面「会话头」留存（在册口径无需动作）· 批内件硬编码锁（已内注复跑协议）；范围外注三项见 §5.5）。
- **fix round**：**0**（审计 ∕ 评审零 must-fix）；唯一收正 = `chat-fixes.css:9-10`（评审范围外注 1 驱动的同族收正，随本笔落盘）＋ 本节 §5。
- **终态**：`clean`（must-fix 0 · 三词码面零残留 · 批内件 5/5 绿）。

### 5.5 上抛（父侧事项）

1. **行数 ≈ 值回填**：实读（内容行）= `index.html` 55 ∕ `app.mjs` 285 ∕ `views/chrome.mjs` 35 ∕ `chrome.css` 268 ∕ `skin.css` 13 ∕ `i18n.mjs` 388 ∕ `chat.css` 329 ∕ `frame-dispatch.mjs` 52 ∕ 批内件 135 ∕ `mount-head.mjs` 0（删）；偏差点 = `views/chrome.mjs`（预期 ≈60 ∕ 实读 35——头族删后留守面更瘦，功能面 = T2 锁集全在，零降级）。
2. `chrome.css:231` 注释死行号 `:393`（先于本批；评审 🔵 非阻断）——裁量 = 随下次触碰改「引符号不引行号」。
3. `docs/core/design/API-CONTRACT.md:1724` 生成区 `HEAD_KEYS` 行——父侧收口跑 `node scripts/api-contract.mjs --write` 随动（生成区勿手改）。
4. 设计档 `PROJECT.md:1063`（§7 注仍列 `mount-head.mjs` 于「批 B 新档三档」——同注有 `chat-copy.mjs 删档` 先例）+ 归档登记补录 `docs/batches/2026-09-29-structure-split-round.baseline.json:247`（`.session-head` 第二处；§2.10#5 只登 `:233`）——评审 ∕ 审计范围外观察，父侧裁量。

## §6 验证与收口（父代理）

### 6.1 验证（父侧 · 2026-09-29 23:0x）

- **批内件复跑（父侧独立）**：`node --test docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs` ⇒ **`pass 5 / fail 0`** ✓（修前红读 = 1 pass ∕ 4 fail——实施轮读数在册）。
- **撤面零残留复核（父侧实读）**：`session-head` ∕ `HEAD_KEYS` ∕ `head.field` ∕ `mount-head` 在 `thincoder-desktop/**` **零命中**（仅 `.thincoder/tmp/*.log` 草稿日志除外）；`mount-head.mjs` **文件不存在** ✓；`views/chrome.mjs` 回读 = 35 行 + 六名锁集（`mountStatus` ∕ `statusModel` ∕ `statusTree` ∕ `BADGE_WORD` ∕ `busyOf` ∕ `suspActiveOf`）✓。
- **真机腿（父侧 · selftest 复跑 + 基线归档）**：`A.boot.slots = ["session-control","flow","composer","pool","status","settings"]`（**无 `session-head`**）✓；`A.boot.sessionHead = null` ✓；`composerControls` 携 `model-btn` ∕ `reasoning-btn`（三值面控件在场）✓；`A.consoleErrors` = 4 条（与批前同集——**零新增**）✓。
- **API 契约随动（父侧收口跑）**：`node scripts/api-contract.mjs --write` ⇒ 生成区整区替换（2637 条 · 截断 5 行）；`--check` ⇒ **骨架零漂移（2637 条 · 597 档）** ✓。生成区勿手改。
- **套件面**：not repo-suite verified（清令——仓套件不跑；父侧收口跑 = 本节）。

### 6.2 超面注与上抛处置

1. **行数实读表**（入册）：`views/chrome.mjs` **35** ∕ `i18n.mjs` **388** ∕ `chrome.css` **268** ∕ `app.mjs` **285** ∕ `chat.css` **329** ∕ `index.html` **55** ∕ `skin.css` **13** ∕ `frame-dispatch.mjs` **52** ∕ 批内件 **135**——设计 `PROJECT.md` §4.1 ∕ §4.2 ∕ §7:1063 值回填 = **归批**（台账 #687）。
2. `chrome.css:231` 注释死行号（先于本批 · 非阻断）：随下次触碰改「引符号不引行号」（登记）。
3. 归档登记补录（`2026-09-29-structure-split-round.baseline.json:247` `.session-head` 第二处）：并入 #687。
4. 真机**视觉半**（头行 accent 与 VSC 并读 ∕ done 不整行绿）= 用户腿（机器半已过；`chat.css` 逐值 = T5 已锁）。
5. 清单外改动七处（决策透明 §5.3）与评审范围外注（`chat-fixes.css:9-10`）均注释面零语义——收。

### 6.3 结算（D7）

- **角色表**：§1 讨论（主 agent）· §2 设计（eng-designer · 含 §2.10 修正）· §3 评审（评审子代理 · 轮 1 pass）· §4 批准（主 agent 代签）· §5 实施（eng-coder · 终态 clean）· §6 本段（父侧）。
- **状态行**：§1 → 已收口 2026-09-29；全档冻结。
- **台账**：#668 ∕ #669 → 已核销（依据 = 本节 + §5 + 真机读数）。
- **欠账**：值回填一条（#687 归批）——批内零其它欠账。
- **指针 ∕ 计数**：§2.10 十处修正落点核讫；批件 135 行在位；API 契约 2637 条零漂移。
