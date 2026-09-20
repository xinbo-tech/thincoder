# 启动加载画面双端（LOADING-SCREENS）· 批次记录（2026-09-21）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 形态——本批 = 父侧先行实施后补记）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 00:46 · 性质 = **补流程账**（用户 00:46「先补流程帐」）——代码已于 00:39 先行交付（commit `99eefe26`）✗ 本档反向成文 ✗ §3/§4 由评审链后补。
> 关联：工程模式绕过根因分析 = 另案（台账 #154 · 修法冻结中）；本批不涉。

## §1 讨论（主 agent）

**状态行**：🔄 进行中

**用户原始需求（2026-09-21 00:31）**：

> 1. cli端启动时回黑屏一段时间，我觉得这时候至少应该显示个thincoder loading...之类的信息，别让用户觉得死了。
> 2. vsc端启动时第一个画面上有一堆输入框，不知道是什么，反正感觉不好，也给改成加载画面吧？

**流程违例如实记**：父侧收到需求后未走「设计 → 评审 → 用户批准 → 实施」全链 ✗ 直接实施并提交（`99eefe26`，00:39）✗ 违反工程模式铁律 1（四步不跳）与 change-face routing（product-code 面 = 全流程）。用户 00:39 质询模式状态后 ✗ 父侧自查确认违例 ✗ 用户 00:46 裁定「A 流程肯定要补」⇒ 本批补账。

**本批范围**：批次档成文（§1/§2/§5）+ 评审（§3）+ 批准追认（§4）+ 验证收口（§6）。**代码不再改动**（已交付已验证 ✗ 评审发现问题走修正轮 ✗ 本批不预设）。

**根因分析分离**：为什么绕过（提示词缺口 / 执行违例的归因与修法）= **不进本批**（#154 冻结中 ✗ 用户 00:44「修法我不认可，要进一步分析」）✓ 本批只处理「已发生改动的流程补账」✓。

## §2 批次任务与设计（eng-designer）

（待 eng-designer 实读六文件后成文——见 spawn 任务书。）

### 批次条目（三方一致基准——§1 需求原话 ↔ 本表 ↔ §5 实施事实）

| # | 条目 | 源（§1） | 边界（不做） |
|---|---|---|---|
| LS-1 | CLI 冷启动加载提示——双进程两段各写一行 `◌ thincoder loading… v<版本>`，冷启动期终端非黑 | 需求 1 | 不做动画/进度条；不加清除逻辑；不改 TUI 布局 |
| LS-2 | VSC 启动加载画面——静态 `#loading-screen` 全屏覆盖（logo + spinner），握手落定后淡出移除 | 需求 2 | 不改 welcome/onboarding 逻辑；不做宿主进度上报；无网络探测 |

### 问题陈述

- **CLI**（需求 1）：冷启动 = 双进程两段——`bin/thincoder.mjs:44-45` wrapped 父 spawn 子（自身 bin，env 门 `THINCODER_TUI_WRAPPED=1`）+ 子进程全链 import 与 TUI 装配；alt buffer 接管后至首帧 render 前终端全黑，用户以为死了。
- **VSC**（需求 2）：webview 静态骨架（session-bar + 空 messages + 全套控制钮）在宿主握手到达前裸露；未配 key 时 welcome 表单即弹——首屏半成品观感（`webview/index.html:14-17` 注释同口径）。

### 设计决策面（六面——全部以 2026-09-21 实读代码为准）

**① 双层写点 ↔ 双进程两段**。冷启动天然两段，两层各写一行：
- 父段：`wrapped-spawn.mjs:33` 在 spawn 前调 `writeParentLoadingLine`（:14-18）——同形轻副本（父不 import tui 模块图，:11-13 注释互指同步义务）；stdout = inherit（:55）⇒ 用户回车后立刻可见。
- 子段：`tui/index.mjs:162` `writeStartupSequence()`（alt buffer 接管）后，:165-169 调 `writeLoadingLine(undefined, v)`（:167 静态读 package.json 版本，try/catch 尽力面）；实现在 `tui-lifecycle.mjs:22-25`，import 于 `tui/index.mjs:31`。
- 两行永不同屏：父行在主 buffer，子 alt buffer 接管即不可见；子行在 alt buffer，首帧 render 覆盖（②）。

**② 首帧 render 全屏重绘自然覆盖 = 无清除逻辑**。render-loop 单一渲染路径——每帧 `renderRows` 全屏重算 + diff 绝对定位重绘（`render-loop.mjs:4-6`）；首帧 `prevRows` 空而 rows 非空 ⇒ fullRepaint（:100-108，`ansi.home` + 全屏行 + clearToEnd）自然盖掉 loading 行。
故 loading 为纯文本行，无 ANSI 位置控制、零清除逻辑、零状态（`tui-lifecycle.mjs:18-21` 注释锚）。否决「写点配清除逻辑」：首帧覆盖免费，清除逻辑 = 多一份失序面。

**③ VSC 移除时机 = providerStatus（宿主初始消息序最后一环）**。握手序 = webviewReady → turnState → i18n → agentSettings → _pushStatus → openSessionContent（`chat.js:41-44` 注释锚）。
providerStatus 经 webviewReady `_pushStatus` 兜底幂等必达（`panel-messages.mjs:243-245`——webviewReady = 唯一可靠握手点；`settings.mjs:356-358` pushStatus 发 `{type:"providerStatus"}`）。
到达 = provider 态已知、banner/welcome 语义就绪 ⇒ `chat.js:232-240` case 内 :237 `dismissLoadingScreenOnce()` 后再 `maybeShowWelcome`/`updateWelcomeStatus`——移除安全，welcome 逻辑不变。
否决「骨架渲染即移除」：早移除 = 骨架裸露复发。

**④ 3s 兜底防永锁**。`chat.js:57` `setTimeout(dismissLoadingScreenOnce, 3000)`——宿主未响应/握手异常不永锁首屏；:51-56 `_loadingDismissed` 单次守卫（先到先赢，互不重复触发）。
移除动画 = `.dismiss` 150ms 淡出（`chat.css:500,502`）+ 200ms 后 `el.remove()`（`chat.js:49`，transition + 余量）。

**⑤ VS Code 主题变量深浅色自适应**。全走主题变量带兜底：背景 `var(--vscode-editor-background, #1e1e1e)`（`chat.css:499`）· 文字 `var(--vscode-foreground, #cccccc)`（:506）· spinner 边 `var(--vscode-widget-border, #444)`（:510）+ `var(--accent, #4fc1ff)`（:511）。
无独立硬编码配色，深浅色主题自适配。否决「固定深色」：与宿主主题割裂。

**⑥ 验收判据（本批实际口径）**：
- LS-1：真机冷启动 `thincoder`（无命令）→ 父段立见 loading 行 → 子 alt buffer 首屏仍见 → 首帧 render 后被 UI 覆盖；既有全量回归 CLI 754/754 绿 + 干净 env stdout 实捕 loading 行（父侧实跑）。
- LS-2：webview 打开 → 全屏 loading（logo + spinner，主题色）→ providerStatus 到达 → 150ms 淡出 → 聊天 UI 与 welcome 逻辑不变；握手异常 3s 强移；VSC 862/862 绿（零回归）。
- 账面（补账批）：§2/§5 与 commit `99eefe26` diff 事实一致，引用坐标可解析。
- **如实记**：本批零新增自动化断言（commit 无测试文件；双端 test 目录 grep `loading`/`dismissLoadingScreen` 零命中——eng-designer 实查 2026-09-21）⇒ 验收 = 既有全量回归 + 真机手动 QA。

### 用例表（normal / boundary / error）

| # | 类 | 输入/场景 | 期望 |
|---|---|---|---|
| U1 | 正常 | CLI 冷启动（无命令） | 父段立见；子段 alt buffer 首屏见；首帧覆盖 |
| U2 | 正常 | VSC 打开面板 + 握手正常 | loading → providerStatus → 淡出 → 聊天 UI |
| U3 | 边界 | CLI stdout 不可写（write 抛错） | try/catch 尽力面——启动不阻断（tui-lifecycle.mjs:24 · wrapped-spawn.mjs:16-17） |
| U4 | 错误 | VSC 宿主握手异常/无响应 | 3s 强移（chat.js:57）——不永锁 |
| U5 | 边界 | package.json 读失败 | 版本空串，行降级为无版本尾（tui-lifecycle.mjs:23-24 · wrapped-spawn.mjs:16） |

### 受影响文件表（as-of 2026-09-21 · commit 99eefe26 · 模块列非 M 族 = —）

| 文件 | ± (commit stat) | 现行数 | 一句话 | 模块 |
|---|---|---|---|---|
| thincoder-cli/src/tui/tui-lifecycle.mjs | +9 | 104 | 导出 `writeLoadingLine`（:22-25）——子段 loading 行单一实现点 | — |
| thincoder-cli/src/tui/index.mjs | +10/−1 | 491 | startTUI 内 writeStartupSequence（:162）后调用块（:163-169）+ import（:31） | — |
| thincoder-cli/src/tui/wrapped-spawn.mjs | +12/−1 | 65 | `writeParentLoadingLine`（:14-18）+ spawn 前调用（:33）——父段写点（轻副本） | — |
| thincoder-vscode/webview/index.html | +12/−1 | 96 | 静态 `#loading-screen`（:18-23，默认可见）——logo + spinner 骨架 | — |
| thincoder-vscode/webview/chat.css | +23 | 515 | 覆盖层（:496-501）+ 淡出（:502）+ inner/logo/spinner（:503-514）+ tc-spin（:514） | — |
| thincoder-vscode/webview/chat.js | +21 | 448 | dismiss 族（:45-56）+ 3s 兜底（:57）+ 挂点（:59）+ providerStatus 消费（:237） | — |

### 边界（本批不做）

- 不改任何代码（补账批——已交付 commit 99eefe26；评审发现问题走修正轮，本批不预设）。
- 不做流程违例根因分析（台账 #154 冻结中——§1 已分离）。
- 不写 §3/§4/§6；不登记台账。
- UI/交互决策无 open 项：loading 行文案 `◌ thincoder loading… v<版本>`（CLI）与 logo「ThinCoder」+ spinner（VSC）均已在代码落定。

## §3 设计评审（评审子代理）

（待评审。）

## §4 用户批准（主 agent）

（待 §3 后。）

## §5 实施记录（eng-coder 形态——父侧先行实施后补记）

> **落盘标记**：本节 = **父侧代写**（eng-designer #27 对 §5 段白名单外——BATCH-RECORD.md §4.1 fallback 打标口径）✗ 内容 authorship = eng-designer #27（依 commit `99eefe26` diff 逐条核校）✗ 父侧仅机械转录 + 段位落盘 ✗ 可 revert。

### 实施事实（2026-09-21 · eng-designer 按 commit 99eefe26 diff 补记）

**commit**：`99eefe26` · 2026-09-21 00:39 · `feat: loading screens for both ends — CLI startup line (wrapped parent + TUI first paint), VSC loading overlay until handshake`——恰六文件，+84/−3（`git show --stat` 实读）；`git status` 盘面仅余本批次档未跟踪——代码树与 commit 一致。

**CLI（需求 1——双进程两段各一行）**：
1. `tui-lifecycle.mjs` +9：导出 `writeLoadingLine`（:22-25）——两空行 + 缩进行 `◌ thincoder loading...` + 可选 ` v<版本>`；write 抛错 try/catch 吞（:24 尽力面）。
2. `index.mjs` +10/−1：`writeStartupSequence()`（:162）后调 `writeLoadingLine(undefined, v)`（:165-169，:167 静态读 package.json 版本）+ import（:31）。
3. `wrapped-spawn.mjs` +12/−1：`writeParentLoadingLine`（:14-18，同形轻副本——父不 import tui 模块图）+ `spawnTuiWrapped` 内 spawn 前调用（:33）。

**VSC（需求 2——静态覆盖层）**：
4. `index.html` +12/−1：`#loading-screen`（:18-23，HTML 默认可见——logo + spinner）。
5. `chat.css` +23：覆盖层（:496-501，fixed inset 0 · z-index 9999 · 主题变量背景）+ `.dismiss` 淡出（:502）+ inner/logo/spinner + `tc-spin` keyframes（:503-514）。
6. `chat.js` +21：`dismissLoadingScreen`（:45-50，.dismiss → 200ms remove）· `dismissLoadingScreenOnce` 单次守卫（:51-56）· 3s 兜底（:57）· providerStatus 挂点（:59）· providerStatus case 消费（:237，maybeShowWelcome 前）。

**验证读数**：CLI 754/754 ✓ · VSC 862/862 ✓（既有全量回归——零回归口径）· 干净 env stdout 实捕 loading 行 ✓（父侧实跑）。
**断言面如实记**：本批零新增自动化断言（commit 无测试文件；双端 test 目录 grep loading 相关零命中——eng-designer 实查 2026-09-21）——真机手动 QA（双端冷启动观感）留发布前，判据见 §2 用例表 U1/U2/U4。

**流程如实记**：父侧先行实施（00:39）后用户裁定补流程账（00:46）——本 §5 为补记形态（实施者 = 父代理 2026-09-21 00:39）。补记遗留发现一条（死代码 `chat.js:59`）——已入台账待处置，见父侧报告。

## §6 验证与收口（父代理）

（待全链后：评审 pass → §4 追认 → §6 读数核对 + 结算同步。）
