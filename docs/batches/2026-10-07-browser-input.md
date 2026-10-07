# 2026-10-07 · browser-input
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 14:49「点火。」——承 14:48 范围令「我希望在CDP支持的程度内做到最大化支持。」+ 14:46 追问；需求档扩展 = F-BT9–F-BT14 / N-BT7–N-BT8（`docs/core/requirements/BROWSER-TOOL.md`）。。
> 台账 = #1018（core · 归批）。前情 = docs/batches/2026-10-07-browser-tool.md §6（已收口 2026-10-07）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-07）**

### 1.1 来源与点火

- 来源 = 用户 14:46 追问「通过cdp能够完整的模拟键盘和鼠标操作吗？」→ 我答以 CDP `Input` 域实读面（`dispatchKeyEvent` ∥ `dispatchMouseEvent` ∥ `dispatchTouchEvent` ∥ `insertText` ∥ `imeSetComposition` ∥ `synthesize*Gesture` ∥ `dispatchDragEvent`——含受信事件机制）→ 用户 14:48 令「**我希望在CDP支持的程度内做到最大化支持。**」→ 14:49「**点火。**」。
- 范围钉死 = **CDP Input 域全量**（14:49 表 1–8 项）+ 使能基建（几何 / 聚焦 / 滚动到视）；需求档扩展已落（`docs/core/requirements/BROWSER-TOOL.md` F-BT9–F-BT14 / N-BT7–N-BT8——主 agent 笔）。
- 承批 = `docs/batches/2026-10-07-browser-tool.md`（已收口）——本批 = 其输入面扩展（八动作基线**零回归**）。

### 1.2 合并扫描（点火前——依批次纪律）

| 候选 | 判 | 理由 |
|---|---|---|
| #1016（`session.mjs` 拆档评估——436 行超 300 软线） | **并入** | 同一文件面：本批必触 `session.mjs`（新动作落点）——「该档下次结构改动先到即拆」条件正达；拆档决策归本批设计（结构决策 = 设计时钉） |
| #1011 / #1012 / #1013（WEBVIEW / 端差句 / §13 面） | 不并 | 文档面 ≠ 输入域面 |
| #1014 / #1015（doc-check 漂移 / 报告面） | 不并 | 文档闸面 |

### 1.3 授权口径

- 本批 = 用户逐点驱动（14:49「点火。」仅点火）——**评审点火权 ∥ §4 批准权 = 用户腿**（未授权代签）；父侧自缚沿惯例（需新范围 ∥ 用户口径裁决 ⇒ 停）。
- 设计两处裁项（已随 14:49 表亮明）：① 门面逐动作判定表（拟值 = press ∥ mouse ∥ drag ∥ touch 点按过门；hover ∥ wheel ∥ insert 免审）② `click` / `type` 是否迁 Input 域（需求侧已钉「对外语义零回归」——内部选型归设计）。

### 1.4 范围增补（用户 14:51「那还是要的。」）

- **剪贴板保真读写入批**（原 14:49 表的边界外项——用户裁定拉入）：需求档已补 **F-BT15**（写：工具侧写系统剪贴板 ∥ 页面复制动作真达系统剪贴板；读：读系统剪贴板文本 ∥ 页面粘贴真取剪贴板；无头 ∥ 有头双支持；权限路径 = CDP Browser 域或等价）+ **N-BT9**（隐私面：读写两侧过门拟值 ∥ 读回执受限额 ∥ 不落盘）；§4 边界行剪贴板子句**删**（入需求）。
- 设计轮 #30 = 在飞——范围增补经 `send` 转达（含「原禁止清单剪贴板项作废」口径）；台账 = **#1019**（并本批）。

### 1.5 授权增补（用户 14:51「也自动跑完吧。」）

- **全链自动授权**（排空模式——本仓惯例同形）：射程 = 本批（**#1018 ∥ #1019 剪贴板 ∥ #1016 拆档**）全链——① 设计评审点火权（父侧代点火）② §4 用户批准权（代签）③ 修正轮 / 实施轮派发 ④ 收口核销 / 提交 / 推送 / token 耗。
- **父侧自缚三条**：① 代签仅当三条件齐备（评审 **pass 0🔴** ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ **停**、只摆那一条；③ 破坏性 / 不可逆 ⇒ 先停。
- §1.3 之「评审点火权 ∥ §4 批准权 = 用户腿（未授权代签）」句**由本条覆盖**（自本条起代行）。

- **父侧代笔（跨批件·机械随动·可回退——承实施轮 #35 上抛·2026-10-07）**：`docs/batches/2026-10-07-browser-tool.test.mjs` 两处随动（该档绑定 browser-tool 批 ⇒ 跨批守卫拒子代理写，父侧直执）：`:134` 标题「八动作枚举」⇒「十六动作枚举」∥ `:138` 枚举 deepEqual ⇒ 十六项（序 = 设计 §2.2 表序：navigate…close + press, hover, wheel, mouse, drag, touch, insert, clipboard）∥ `:479` frobnicate `— actions:` 串同枚举同序。已 `send` 知会 #35（实现侧按该序对齐）。

- **机制收正（fix 轮 · eng-designer#38 · 2026-10-07）**：承实施轮真 Edge 实测——§6 KD-14（tap/doubleTap/swipe ⇒ 显式 `dispatchTouchEvent` 序列；pinch 保持 `synthesizePinchGesture`）∥ §3.5（描述符名 ⇒ `clipboard-read`/`clipboard-write`；`grantPermissions`（PermissionType 形）回落保留 ∥ 无头 = 会话内剪贴板 / 有头 = 真系统剪贴板 实测登记 `:240`）∥ §2.2 touch 行 `:97` ∥ §7 F-BT12 引用随正 ∥ 变更记录 `:433`；判据/验收句零改（逐条核读在案）；doc-check 悬空 0 · exit 0。父侧抽核四处全证实。**对账项（待收口 §5/§6）**：冒烟含 **S15a**（无头页↔页——设计 §7/§8 未列）；批内件实况 4 档（test ≈274 ∥ clipboard.test ≈152 ∥ harness ≈151 ∥ smoke ≈342）vs 设计 §5「两新档（≈480/≈330）」——harness 为增出档——收口时对账落定。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-07
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 批次任务与设计（eng-designer · 设计轮 · 2026-10-07）

**本批 = browser 工具输入域最大化（台账 #1018）+ 剪贴板保真读写（#1019）+ session.mjs 拆档评估（#1016）**。
设计权威 = `docs/core/design/BROWSER-TOOL.md`（281 ⇒ 427 行——本批扩写：十六动作 ∥ 输入基建 §2.7 ∥ 键面 §2.8 ∥ 门面逐动作表 §3.1 ∥ 剪贴板面 §3.5 ∥ 拆分决定 §5 ∥ KD-10–17 ∥ 用例面 T16–T26 + S8–S18）。

**覆盖表（需求 → 设计节 → 机验判据——三链同源，与设计 §7 逐格一致）**

| 需求 | 设计落点 | 机验判据 |
|---|---|---|
| F-BT9 键盘真输入 | §2.2 press ∥ §2.7 聚焦 ∥ §2.8 键面 | 单测 T16/T17 ∥ 冒烟 S8（真按键驱表单 + `isTrusted` 读回） |
| F-BT10 指针真输入 | §2.2 hover/wheel/mouse ∥ §2.7 坐标解析 | 单测 T18/T19 ∥ 冒烟 S9–S11 |
| F-BT11 拖拽 | §2.2 drag ∥ §6 KD-16 | 单测 T20 ∥ 冒烟 S12/S12b（含 html5 分支） |
| F-BT12 触屏 | §2.2 touch ∥ §6 KD-14 | 单测 T21 ∥ 冒烟 S13/S13b/S13c |
| F-BT13 文本 / IME | §2.2 insert ∥ §6 KD-17 | 单测 T22 ∥ 冒烟 S14（组合中间态 + 终文） |
| F-BT14 输入基建 | §2.3 几何 ∥ §2.7 | 单测 T19 ∥ 冒烟 S17（屏外 ref 自动滚动后驱动成立） |
| F-BT15 剪贴板 | §3.5 ∥ §2.2 clipboard | 单测 T23/T24 ∥ 冒烟 S15/S16（工具写 ⇒ 系统读回 ∥ 系统写 ⇒ 工具读回——PowerShell 对照） |
| N-BT7 写面门覆盖 | §3.1 扩展表 ∥ §2.1 | 单测 T25（逐动作分类全表 + 旧八动作分类零变） |
| N-BT8 兼容与不回归 | §5 ∥ §7 | 旧单测 21/21（唯一随动 = T1 枚举断言 8⇒16——见披露）∥ 旧冒烟 S1–S7 ∥ 新用例 T16–T26/S8–S18 |
| N-BT9 剪贴板隐私面 | §3.5 ∥ §3.1 | 单测 T24（全量过门 + read 上限截断 + 无落盘）∥ T23（write 回执不回显） |

（基线 F-BT1–F-BT8 ∥ N-BT1–N-BT6 = 零回归面；不在本批 = 需求 §4 边界全体。）

**两处裁项（设计定稿——授权内自主裁）**
① **门面逐动作分类**（§3.1 表 + KD-11）：过门 = click ∥ evaluate + press ∥ mouse ∥ drag ∥ touch 点按 ∥ clipboard 全量；免审 = navigate ∥ type ∥ snapshot ∥ screenshot ∥ wait ∥ close + hover ∥ wheel ∥ insert ∥ touch 手势（swipe/pinch）。判据沿 F-BT7（不可逆 / 提交类）逐动作推得；同一 `isReadonlyAction(args)` 钩子按参数分类——机制零新增（需求 §4）。
② **click / type 内部选型**（KD-10）：**不迁** Input 域——零回归（回执 / 寻址 / 旧用例面逐条）+ 语义分工互补（click = DOM 级语义激活 ∥ mouse = 真指针）；迁移会重写旧验收证据、对遮挡 / `pointer-events` 面行为起变。新真输入需求由 press / mouse / insert 全覆盖。

**拆分决定（#1016 · 钉死——设计 §5）**：`session.mjs` 拆五档（session ≈270 + actions ≈190 + input ≈270 + input-actions ≈230 + clipboard ≈150）；依赖单向无环（动作模块经会话句柄取能力，不 import session）。

**受影响文件（设计 §5 表为准）**：新增 4 档引擎（`actions` / `input` / `input-actions` / `clipboard`——拟新增）+ 改 5 档（`session.mjs` / `snapshot.mjs` / `tools/browser.mjs` / `tool-docs/browser.md` / `permission.mjs`）+ 批内件 2 新档（test / smoke——拟新增）+ 旧批单测 1 行随动 + 登记面（本设计档 ∥ TOOLS §6.7 ∥ README §4——已落）+ API-CONTRACT 生成区（收口 `--write`——生成器唯一笔）。

**随动披露（评审请过目）**：旧单测 T1 的「动作枚举 deepEqual」断言在十六动作下无法保持——**随动改 8 ⇒ 16**（F-BT9+ 接口扩展的必然导出；其余断言逐条零改）。设计 §5 ∥ §7 与设计 §8 同披露（唯一旧用例面随动）。

**批内件**：`docs/batches/2026-10-07-browser-input.test.mjs`（拟新增——T16–T26）∥ `docs/batches/2026-10-07-browser-input.smoke.mjs`（拟新增——S8–S18；剪贴板端到端 = 本机 OS 面）。先红后绿，读数回填 §5。

**机检读数**：开工 = 悬空 0 · exit 0 · 行宽 OK（拟新增 51 / 迁移期引文 323）。收笔（设计档 + TOOLS / README 登记落盘后复跑）= **悬空 0 · OK(锚) · OK(行宽) · exit 0**（候选 51867 · 拟新增 53 · 用例号 2144 / 悬空 0 · 行数面差异 13 条 = 桌面档报告态既存项）。

**零触声明**：需求档零笔（主 agent 面）∥ 产品码零触 ∥ `scripts/**` 零触 ∥ 提示词零触 ∥ 本批文件面 = 设计档 + TOOLS / README 两处登记 + 本档 §2。

**上抛 / 未决**：无（两裁项在设计权内；无需求级冲突、无归属不明）。评审轮待父侧触发。

### 设计评审轮 1 修正块（发现 10 条落修 · 2026-10-07 · eng-designer）

**段位**：本轮 = 评审轮 1（§3 轮次 1 · pass · 🔴 0 / 🟡 5 / 🔵 4）修正轮——按发现号 1–10 逐条落修（父侧 10/10 受理）；设计档就地面落 + `TOOLS.md` 两处收正；判据 / 机制语义零改；产品码零触；需求档零笔（主 agent 面）；批档 §1 / §3 / §4 零触。细目 = 本块逐号（`docs/core/design/BROWSER-TOOL.md` 变更记录 +1 条 ∥ `TOOLS.md` 变更记录 +1 条——同笔）。

**逐号落修**：

1. **🟡 校验枚举补齐**（发现 1）：`BROWSER-TOOL.md` §2.2 校验枚举——+`mouse requires ref or x,y`；+`insert requires text`（同句「按逐动作行补齐」顺带项——评审未列、同类面，报备）；`touch` 改手势条件式（tap / doubleTap ⇒ 落点；swipe ⇒ from + to；pinch ⇒ 落点 + scale）；`wheel` 与「至少一非零」对齐（全零（0,0）同拒明示）；该句行宽故拆两行（`:102` / `:103`）。
2. **🟡 S18 补定义 + 映射**（发现 2，与 4 同解）：S18 = 本地有头（`headless:false`）抽样复跑——`press` + `clipboard` 两动作（沿 S7「仅本地跑，CI 面可跳」先例）；落 = §7 N-BT8 判据格（`:338`）+ §8 新增 **U51** 行（`:395`）；三处引用（§5 `:277` ∥ §8 `:398` ∥ 变更记录 `:429`——原评审坐标 `:276` / `:396` / `:426`，行插 +2 平移）随动成立。
3. **🟡 测试档拆分处置**（发现 3）：§5 两新测试档各补处置句（批内件不拆 + 触发 = 破 500 硬限 + 拆位）；`browser-tool.test.mjs` 499±1 档注「破 500 即拆」（`:276`–`:278`）。
4. **🟡 N-BT8 有头覆盖格**（发现 4）：= 发现 2 同解（遵派发形——N-BT8 行判据列加 S18 格；未另立他形）。
5. **🟡 加速键平台分支**（发现 5）：§3.5 `copy` / `paste` ⇒ darwin 用 Meta+C/V、win32 / linux 用 Ctrl+C/V（`:236` / `:237`）；需求侧「Ctrl+C 类」容此解（`docs/core/requirements/BROWSER-TOOL.md:39`——实读）；§2.8 / §10.5 无涉（零随动）。
6. **🟡 TOOLS §6.2 枚举**（发现 6）：**成立**（§6.2 全文零 browser 命中；`thincoder-core/tools/index.mjs:28` 注册已在册）——「其余」组补 browser（`TOOLS.md:174`）；组计数零动（D3 核）。
7. **🔵 数字口径统一**（发现 7）：§5 判据② / KD-12 统一为「拆后五档合计 ≈1,110 行（net ≈+674）——不拆单档破 500 硬限」（`:283` / `:305`；「≈400 / ≈840」退场）。
8. **🔵 TOOLS 行数收正**（发现 8）：实读 = 读取显示 1,346 ∥ `wc -l` 1,345（开工——按 `TOOLS.md:613` 口径确认）；本修轮 TOOLS 触面净 +2 行（§6.2 ∥ §6.11 行内改 + 变更记录）⇒ 行值按收笔实读落 **1,347（`wc -l` 口径）**（`BROWSER-TOOL.md:279`——口径注随行）。
9. **🔵 tool-docs 计数**（发现 9）：**成立**——实读 `thincoder-core/tool-docs/` = **49 档**（含 `browser.md`；零子目录）⇒ `TOOLS.md:282`「48 ⇒ 49 档」收正。
10. **🔵 依赖分层统一**（发现 10）：§1 依赖行（`:36`）统一为 §5 口径——`session → {actions / input-actions / clipboard} → {input / snapshot / cdp}`。

**机检读数（修轮复跑）**：`node scripts/doc-check.mjs`（cwd = `thincoder/`）——开工 = **悬空 0 · 行宽 OK · exit 0**（候选 51,867 · 用例号 2,144 · 拟新增 53）；收笔 = **悬空 0 · 行宽 OK · exit 0**（候选 51,874 · 用例号 2,148 · 拟新增 53 · 行数面差异 13 条 = 桌面档既有存量）。两读差异 = 逐条行号随动（BROWSER-TOOL 行插 +2）+ 新增行候选（U51 / S18 等）——**零新增悬空 ∥ 零新增行宽命中**。

**守界自检**：需求档零笔 ∥ 产品码 / `scripts/**` / 提示词零触 ∥ 批档 §1 / §3 / §4 零触 ∥ 用例编号体系零重排（U51 = 追加）∥ 本轮文件面 = `BROWSER-TOOL.md` + `TOOLS.md`（§6.2 ∥ §6.11 ∥ 变更记录）。

**附察（10 号外——报备，未改）**：① `BROWSER-TOOL.md` §2.6 `:146` 坐标 `:19-27` / `:29-37` vs `thincoder-core/tools/index.mjs` 实读 `:20-29` / `:31-40`（差 1–3 行——疑为 browser 注册行加入前读数）；② §5 `docs/README.md` 行「160」vs 实读 `wc -l` 161 / 显示 162（同 #8 类报数口径；评审未列）。

**上抛 / 未决**：无（10/10 落修；附察两项待父侧处置）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（BROWSER-TOOL 扩展轮 · 十六动作 + 输入基建 + 门面表 + 剪贴板 + 拆档）——发现表：

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | Clarity | 🟡 | §2.2 参数校验枚举与逐动作行不一致：缺 `mouse requires ref or x,y`（行 95 必填 ref∥x+y；U33 行 376 已有该句，校验枚举行 102 未列）；行 102 `touch requires ref or x,y` 对 swipe（必填 from/to）与 pinch（scale 必填——行 97）不成立；wheel「至少一非零」（行 94）与枚举句「requires deltaX or deltaY」（行 102）口径不一（全零输入无判据） | 校验枚举按逐动作行补齐：+mouse 句；touch 改手势条件式（tap/doubleTap/pinch ⇒ 落点、swipe ⇒ from+to、pinch ⇒ scale）；wheel 句与「至少一非零」对齐 |
| 2 | Acceptance | 🟡 | 冒烟编组范围「S8–S18」三处引用（行 276 / 396 / 426），但 §7/§8 全表最大只编到 S17（行 334 / 390）；S18 无定义格 | 补定义 S18 或把范围收正为 S8–S17（若 S18 在批档另有定义——批档不在本评审范围——§7/§8 也应补映射格） |
| 3 | File size | 🟡 | 两新测试档预估越 300 软线（行 275 ≈480 / 行 276 ≈330）——无拆分审视或触发登记（对照 session.mjs 在 §5 有钉死拆分决定）；browser-tool.test.mjs 499±1 = 500 恰压硬限、零余量（行 277） | 两新档各补一句处置（不拆 + 触发条件 / 拆档位），并注明 499 档破 500 时的拆档触发 |
| 4 | Acceptance | 🟡 | N-BT8 的「新动作无头 ∥ 有头双支持」（行 337）无用例格：新动作冒烟面 = 无头（行 328），有头格 S7 只覆盖旧八动作（行 316）；clipboard 恰有无头专属分支（行 238 focus emulation） | 补一格本地有头复跑（沿 S7「仅本地跑」先例）或注明模式正交论证致豁免 |
| 5 | Feasibility | 🟡 | §3.5 copy/paste 无条件写「发 Ctrl+C / Ctrl+V」（行 235-236），而工具声明 darwin 支持（行 251 候选表）——darwin 复制/粘贴加速键为 Cmd（Meta）+C/V，按字面实现该平台功能失效 | 加速键按平台分支（darwin ⇒ Meta+C/V）或把该限制登记入 §3.5 界限 |
| 6 | Doc state | 🟡 | TOOLS.md §6.2 内置工具枚举（TOOLS.md:173）未含 browser，与设计注册面（BROWSER-TOOL.md:146「builtinTools 两处登记」）不一致——文档状态滞后（报告不代改） | 本次 TOOLS.md 触碰面顺带收正 §6.2 枚举（或加 as-of 注） |
| 7 | Numbers | 🔵 | §5 判据②/KD-12 的「本批增量 ≈400 行 ⇒ 单档累计 ≈840 行」（行 282 / 304）与 §5 表不成口径：四新档合计 = 190+270+230+150 = 840（行 265-268）、拆后五档合计 ≈1110、net 增 ≈670——「≈400」与任一读法均不合 | 统一口径重述拆分判据数字（「不拆破 500」结论不受影响） |
| 8 | Numbers | 🔵 | TOOLS.md 行列「现行 1,344」（行 278）；实读（read 工具）= 1,346 行，按 TOOLS.md:613 自述口径（wc -l = 显示值 −1）为 1,345——差 1–2 行（.md 行按判据豁免，属报数口径） | 复核并收正该行现行数（或标注读数口径/时点） |
| 9 | Numbers | 🔵 | TOOLS.md:282「48 档随包发布」：该读数 as-of 2026-10-05；tool-docs/browser.md 已建档（BROWSER-TOOL.md:273 现行 28 行）⇒ 计数疑应 +1（49）——目录面未在评审范围，unverified | 实读 tool-docs/ 目录复核计数并收正 |
| 10 | Consistency | 🔵 | 依赖 DAG 两处表述不一致：行 36（§1）将 input 与其余三新档同层列于 session 下游；行 284（§5）为 session → {actions, input-actions, clipboard} → {input, snapshot, cdp}（input 在动作组之下一层） | 统一为一种分层表述（§5 口径） |

口径注：无独立 project standards 档在册（方法论合规按 AGENTS.md + 三档自述口径判定）· 无 document map（归属按三档自述权威面判定）· 评审清单外源档行数不可复读（数字类发现仅就评审范围内可读面抽核；TOOLS.md 自身实读）。

计数：🔴 0 · 🟡 5 · 🔵 4
VERDICT: pass

## §4 用户批准（主 agent）

### §4 用户批准（主 agent · 代签 · 2026-10-07）

- **授权依据**：用户 14:51「也自动跑完吧」（排空模式——本批全链自动授权，§1:37 在案）。
- **自缚三条核验**：① 评审 pass（🔴 0——§3 轮次 1）✓ ② 修正轮 10/10 落地并经逐条核验（§2 修正块 + 父侧抽核实读）✓ ③ token 已签发 ✓。
- **代签**：本批设计（十六动作接口扩展 + 输入基建 + 剪贴板面 + `session.mjs` 拆五档）**准予实施**——实施轮随即派发（eng-coder · initial）。
- **核验纪要（父侧实读）**：修正轮逐号抽核 = 10/10 相符（校验枚举 `:102-103` ∥ 测试档处置 `:276-278` ∥ 数字口径 `:279`/`:283` ∥ S18 格 `:338` ∥ `TOOLS.md:174`/`:282` ∥ 依赖分层 `:36`）；**两笔机械校正（父侧直执——可回退）**：`BROWSER-TOOL.md:147` 坐标 `:19-27`/`:29-37` ⇒ `:20-29`/`:31-40`（实读 `thincoder-core/tools/index.mjs`）∥ `:280` README 行值 `160` ⇒ `161（wc -l 口径）`（实读 = 161 换行）。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-07）**

**状态行**：实施完成（fix 轮 1 已落 · 复核轮在飞）

### 5.1 交付面（实读行数——≤500 硬限全绿）

| 面 | 档 | 行数 | 内容 |
|---|---|---|---|
| 引擎·输入 | `thincoder-core/browser/input.mjs` | 256 | 键面（命名键 + US 布局单字符 + 大写字自动 Shift）/ `normalizeModifiers`（未知修饰抛出——不静默）/ `pressSequence`（keyDown∥rawKeyDown 规则、phase、repeat）/ `mouseSequence`（double ⇒ clickCount 1,2）/ `wheelSequence` / `dragSequence`（`release:false` 供 html5）/ `touchSequence`（tap∥doubleTap 显式序列、pinch `synthesizePinchGesture`、swipe 插值）/ `parseTargetSpec` / `clampSteps(2–50)` |
| 引擎·输入动作 | `thincoder-core/browser/input-actions.mjs` | 196 | 七动作（press / hover / wheel / mouse / drag / touch / insert）+ `targetOf`（ref ⇒ pointExpression 滚动到视 + 中心点；x,y 直读；缺省视口中心）+ `html5Drag`（拦截链）+ `settleScroll`（≤800ms） |
| 引擎·剪贴板 | `thincoder-core/browser/clipboard.mjs` | 142 | read / write / copy / paste + 授权链（描述符名 → `grantPermissions` 回落 → 皆败明示错）+ focus emulation（一次性）+ `acceleratorSequence`（darwin ⇒ Meta）+ read 8000 上限 + 零 fs |
| 引擎·基线动作 | `thincoder-core/browser/actions.mjs` | 160 | 旧八动作迁出（`WAIT_*` / `NETWORK_QUIET_MS` / `MAX_EVAL_CHARS` 常量随迁） |
| 引擎·会话 | `thincoder-core/browser/session.mjs` | 354 | 生命周期 / 串行队列 / 页原语 / 安全助手 / 分发表 + `sessionHandle`（10 能力）+ ACTION_TABLE（基线 + 输入 + 剪贴板三表合并） |
| 工具面 | `thincoder-core/tools/browser.mjs` | 146 | 十六动作枚举（序 = 设计 §2.2 表序）+ 校验句（逐字 + 互斥句）+ schema + `isReadonlyAction` 逐动作表 |
| 门面 | `thincoder-core/permission.mjs` | 112 | browser 分支 + §10.5 逐动作文案 |
| 描述档 | `thincoder-core/tool-docs/browser.md` | 39 | 新动作 / 门面分类 / 剪贴板模式事实 / US 布局字符面 |
| 几何 | `thincoder-core/browser/snapshot.mjs` | 270 | geo / inViewport / `[outside]`（在 value / new / disabled 之后）+ pointExpression / focusExpression |
| 批内件 | test 277 ∥ clipboard.test 154 ∥ harness 150 ∥ smoke 356 | 937 | T16–T26 ∥ S8–S18（拆位见 5.3 #4） |

### 5.2 跑法读数（真跑——收笔态）

| 面 | 命令（cwd = `thincoder/`） | 读数 |
|---|---|---|
| 本批单测 | `node --test docs/batches/2026-10-07-browser-input.test.mjs docs/batches/2026-10-07-browser-input.clipboard.test.mjs` | **11/11 绿**（T16–T26） |
| 本批冒烟（无头面） | `node docs/batches/2026-10-07-browser-input.smoke.mjs` | **14/14 绿** + S18 skipped（S8–S17 + S15a；含 S15/S16 有头真跑）——连跑两遍稳定 |
| 本批冒烟（有头抽样） | 同上 `--headed` | **14/14 + S18 ran——failed=0** |
| 旧单测 | `node --test docs/batches/2026-10-07-browser-tool.test.mjs` | **21/21 绿**（唯一随动 = T1 枚举 8⇒16——父侧代笔） |
| 旧冒烟 | `node docs/batches/2026-10-07-browser-tool.smoke.mjs` | **6/6 绿** + S7 有头 skipped |
| 语法 | `node --check` ×13 档 | 全绿 |
| 行数 | 实读 | 最大 354（session.mjs）∥ 批内件最大 356（smoke）——≤500 硬限全绿 |

真跑要点：S8 press 真按键（`isTrusted` 读回 + Enter 驱表单 `/two?q=a`）· S13 tap ⇒ 真 click ∥ doubleTap ⇒ dblclick（detail=2）· S13b pinch scale 1→≈2 · S13c swipe ⇒ scrollY≈505–528 · S12 / S12b 目标态变化 + dataTransfer payload · S15 / S16 系统剪贴板双向实证（PowerShell 对照）· S17 屏外 ref `[outside]` → 自动滚动 → 点击成立。

### 5.3 决策透明表（偏离 / 收正 / 披露——逐条带依据）

| # | 项 | 类型 | 依据 | 状态 |
|---|---|---|---|---|
| 1 | tap / doubleTap 改 `dispatchTouchEvent` 显式序列（双击 = 两条序列 + 60ms 间隔）；pinch 保持 `synthesizePinchGesture` | 机制收正（实测推翻设计前提） | 实测（本机 Edge）：`synthesizeTapGesture` 不产 click（无头 ∥ 有头、加 touchEmulation 同）；显式序列 ⇒ 全链 mousedown / mouseup / click（`isTrusted`）；双击 60ms 内两次 ⇒ click:2 + dblclick:2（计数由浏览器管）。父侧裁示①；设计档 KD-14 已收正 | 落 |
| 2 | 剪贴板系统面：无头 = 会话内剪贴板（页↔页保真）∥ 有头 = 真系统剪贴板 | 实测登记 + 用例面调整 | 实测：无头 PS 读不到浏览器写、浏览器读不到 PS 写；有头双向通。父侧裁示②：S15 / S16 有头真跑（断言不变）+ 新增 S15a 无头页↔页 | 落 |
| 3 | `setPermission` 用描述符名 `clipboard-read` / `clipboard-write`（回落 `grantPermissions` 保留） | 机制收正（名面实测） | 实测：`{name:"clipboardReadWrite"}` 被拒（Invalid PermissionDescriptor name）；描述符名 ok。父侧裁示③ | 落 |
| 4 | 批内件拆档：单测 547 行破 500 硬限 ⇒ 拆三档（test 277 / clipboard.test 154 / harness 150） | 设计触发句 | 设计档 §5「破 500 硬限 ⇒ 拆位 = 输入面（T16–T22）∥ 剪贴板 / 门面（T23–T26）」；harness = 表外第三档（测试台公档——父侧收口对账项，批档 §1 在案） | 落 |
| 5 | `ref` 与 `x,y` 同时给 ⇒ `Error: <action> requires exactly one of ref or x,y`（hover / mouse / wheel / touch 四处） | 设计落面（此前静默取 ref） | 设计档 §2.2:101「互斥项冲突 ⇒ `Error`」+ wait 的 `exactly one of` 先例；评审轮 1 发现 #6 | 落 |
| 6 | `html5Drag` 拦截等待 promise 加占位消费者（防早退路径 unhandled 拒绝） | 评审轮 1 must-fix | 代码评审发现 #1：`sendAll` 抛出 ⇒ 5s 后 `once()` 超时拒绝无人消费 ⇒ 宿主进程级 fatal（CLI `handleFatal` / 桌面 `fatal`） | 落 |
| 7 | 冒烟剪贴板四读面改**有界轮询**（`waitForValue`，≤4s） | 真跑暴露的竞态 | 重跑 S16 实测 `copy ⇒ 系统读回` 偶发读到上一步值（浏览器剪贴板写异步落位 vs 立即回读）；改后连跑稳定 | 落 |
| 8 | 冒烟环境闸：S15 / S16 / S18 加 `SYSTEM_CLIPBOARD = process.platform === "win32"`（非 win32 跳过，步骤标题明示）；S18 真跑失败计入 exit code | 评审轮 1 🔵 #8 / #9 | 无 PowerShell 面必红 ⇒ 其余无头格连带不可用；S18 不计入属假绿面 | 落 |
| 9 | `tools/browser.mjs` 静态 import `input.mjs`（`parseTargetSpec` / `TOUCH_GESTURES`）+ `clipboard.mjs`（`CLIPBOARD_OPS`） | 披露（常量面复用） | DAG 未破（tools → 引擎单向；动作模块仍零 session 依赖——T16 断言在档） | 落 |
| 10 | wheel / pinch 回执坐标取整（`Math.round`）——pinch 携 ref 亦落坐标形 | 披露（对齐设计模板） | 设计 §2.2:97 模板 `at <x>,<y>`；评审轮 1 附注 b | 落 |
| 11 | 描述档 press 行补「US-layout printable character (a-z, 0-9, punctuation)」 | 描述面收正 | 评审轮 1 🔵 #5：原文「任意可打印字符」会让模型误试非 ASCII 单字符；对齐设计 §2.8 键面（US 布局表） | 落 |
| 12 | `session.mjs` 354 行（设计预估 ≈270——>300 软线、<500 硬限）；smoke 356 行（批内件——设计 §5 裁「不拆」） | 披露（评审轮 1 🟡 #2 / 🔵 #10——报告项） | 拆后五档合计 1,108 ≈ 设计判据「≈1,110」；收口对账面归父侧 / 设计侧 | 报告 |

### 5.4 审计与代码评审轮次与终态

- **独立偏离审计**（subagent explore · 只读 · 1 轮）：功能面逐条实读未命中新增实质偏差（动作契约 / 回执句 / 枚举序 / 门面分类 / DAG / 行数 / 语法机检 13/13 全绿）；硬项 = §5 未落（本段即补）；低项两条（S15a 未列设计 §7/§8 ∥ harness 增出档）确认属实、已在批档 §1 登记为收口对账项；附注 b（pinch 模板）已落修（上表 #10）。
- **advisor 代码评审轮 1**（独立 · 交付前）：无 🔴；🟡 4（must-fix 1 = 上表 #6；报告 3：session 行数 / 批档 §5 / 设计档对账）+ 🔵 6——逐条处置：must-fix 与 🔵 五项落修（上表 #5–#8、#11），报告项按界留父侧 / 设计侧（上表 #12）。
- **轮次 2（fix 复核）**：待落——结论随复核追加。
- **终态**：clean / stalled——待定（复核后追加）。

### 5.5 复核轮结论（5.4 待落项收口 · eng-coder）

- **advisor 代码评审轮 2**（独立 · fix 复核 · 只核 fix 声明）：**pass**——must-fix（`html5Drag` 未处理拒绝面）复核 = Fixed（占位消费者在档，早退路径无 unhandled 面）；其余 fix 声明逐条 Fixed / Accepted（互斥校验四处 ∥ 断言随常量与互斥句 ∥ 描述面措辞 ∥ 冒烟环境闸·S18 计数·剪贴板有界轮询 ∥ 批档 §5 落盘）；**零新发现**（无新增 🔴/🟡）。回归核：旧批两档 grep 零 `x:` / `y:` 键 ⇒ 新互斥分支对旧用例不可达。
- **终态：clean**（轮次 2 = pass · 零未决 must-fix）。

## §6 验证与收口（父代理）

### 6.1 父侧核验（真跑——收口轮）

| 面 | 命令 | 读数 |
|---|---|---|
| 本批单测 | `node --test docs/batches/2026-10-07-browser-input.test.mjs docs/batches/2026-10-07-browser-input.clipboard.test.mjs` | **11/11 · fail 0** |
| 本批冒烟（无头面） | `node docs/batches/2026-10-07-browser-input.smoke.mjs` | **14/14 + S18(skipped) · failed=0** |
| 旧单测 | `node --test docs/batches/2026-10-07-browser-tool.test.mjs` | **21/21 · fail 0** |
| 旧冒烟 | `node docs/batches/2026-10-07-browser-tool.smoke.mjs` | **6/6 + S7(skipped) · failed=0** |
| 工具面实读 | `thincoder-core/tools/browser.mjs` 全档逐行 | 十六枚举（序 = 设计 §2.2 表序）∥ 校验句 / 互斥句 ∥ schema ∥ `isReadonlyAction` 门面（click/evaluate/press/mouse/drag/clipboard 过门；touch 点按过门、手势免审）——与 §2.1/§2.2/§3.1 逐条相符 |
| 行数实读 | 13 档 | 与 §5.1 逐档相符（最大 354 = session.mjs；硬限全绿） |
| API 契约生成 | `node scripts/api-contract.mjs --write` | WROTE 3235 条（生成区整区替换）· exit 0 |
| doc-check | `node scripts/doc-check.mjs` | 悬空 0（阈值 0）∥ 行宽 OK（区带豁免生效）· EXIT=0（列报项 = 报告态不入闸） |

### 6.2 对账项处置（§1 在案 + §5 报告项）

| # | 项 | 处置 |
|---|---|---|
| 1 | S15a 未列设计 §7 | **已随正**——设计 §7 F-BT15 行 += S15a（无头：页↔页保真——父侧裁示②增格）；**父侧直执 · 机械面 · 可回退**（同轮单处，`BROWSER-TOOL.md` 该行） |
| 2 | 批内件实况 4 档（harness 增出） | 记录在案——设计 §5 拆位触发句已覆盖（547 破 500 硬限 ⇒ 拆三档）；harness = 拆位配套公档（父侧认可，§5.3 #4 在册）——非设计缺漏 |
| 3 | session.mjs 354 行（预估 ≈270）∥ smoke 356 行 | 报告项（不立债务）：越 300 软线（<500 硬限全绿）；本次拆分即其缓解（拆后五档 1,108 ≈ 设计判据 ≈1,110）；软线 = 建议面 |
| 4 | 三处实测收正（裁示①②③） | 已落码 + 设计档 KD-14 / §3.5 / §2.2:97 已收正（#38 · 父侧抽核五处相符在案）——零未决 |

### 6.3 核销与提交

- **台账核销**：#1018（浏览器输入面）∥ #1019（剪贴板面）∥ #1016（session.mjs 拆分条件达成）——在途 ⇒ 待核销 ⇒ 已核销（evidence = 本档 §6 + 提交）。
- **提交**：（收口轮随补）
- **链终端**：designId 消费（收口毕）。
- **前批遗留**：无（provider-picks 记录冻结行同轮另笔提交——非本批欠账）。
- **暂缓批复核**：无（本批无暂缓件）。

- **提交**：`3764503c`（browser-input 面——20 档：引擎五档 + 工具/门面/描述 + 批内件五档 + 设计四档 + API-CONTRACT + README 登记）∥ `74214fde`（provider-picks 记录冻结行）——**双推 ✓**（origin = gitee ∥ github）。（本节随补——收口轮 2026-10-07。）
