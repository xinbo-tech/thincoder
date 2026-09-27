# 渲染核（RENDER-CORE）· 设计

> 板块 = **扩展端 / 桌面端共用宿主无关渲染核**的落点 · 加载形 · 边界 · 逐模块判定 · 逐机制对位 · 分期。
> 本档 = 核面权威；两端接入面只在此留指针（桌面对位细节 = `docs/desktop/design/UI.md` / `docs/desktop/design/IPC.md`；VSC 接入面 = `docs/vsc/design/WEBVIEW.md`）。
> 需求侧 = `docs/desktop/requirements/PROJECT.md` §3.6 + §4 D17–D20（状态行对齐 CLI ∥ 会话面板对齐 VSC ∥ 会话流经共享渲染核对齐 VSC ∥ 右列 = 子 agent 面板）。
> 相关档：`docs/core/design/CORE-UNIFICATION.md`（`@thincoder/core` 的链接 / 物化 / 发布纪律——本档发行面同源）· `docs/core/design/ARCHITECTURE.md`（模块地图与硬约束）。
> 建档：2026-09-27（批 `docs/batches/2026-09-27-desktop-ui-alignment.md` 设计轮）；坐标 as-of 2026-09-27 实核（仓根 = `thincoder/`）。

## 1. 方案与理由

### 1.1 模块目标

一句话：把扩展端 webview 中**与宿主无关的会话流呈现机制**抽成一份共享核（新顶层包 `thincoder-render-core/`），两端各自适配宿主胶水——
桌面端由此**不自建第二份呈现实现**即可让会话流 / 状态行 / 子 agent 面的语义与另两端对齐（用户口径「基本对齐」由**同核不同壳**结构性成立）。

### 1.2 核的定性：什么算「宿主无关」（判定口径 · 本档单源）

核 = **浏览器原生能力内可运行的 ESM**（`document` / `navigator` / `requestAnimationFrame` 允许——两端渲染面都跑在 Chromium 上下文，DOM 不是任何一端的特权）；
**宿主特权四条一律不入核**：

1. **宿主句柄获取**——VSC `acquireVsCodeApi()`（唯一获取点 = `thincoder-vscode/webview/state.js:10`）；桌面预载桥（`thincoder-desktop/src/preload/preload.cjs:21-33` 白名单）。
2. **出站消息**——VSC `postMessage`（散布 20 档 65 处；代表性 = `webview/send.js:55` / `webview/permission.js:58` / `webview/session-bar.js:10`）；桌面 `invoke`。
3. **主题变量命名空间**——VSC `--vscode-*`（映射层 `webview/base.css:8-20`；直用：`chat.css` 14 行 / `controls.css` 10 行 / `status-bar.js:38` / `streaming.js:197`）；桌面自有变量（`renderer/styles.css`）。
4. **入站分发与装配**——VSC 消息循环（`webview/chat-messages.js:48` 唯一监听点）；桌面订阅 + 帧装配（`renderer/events-subscribe.mjs` / `renderer/app.mjs`）。

### 1.3 落点与加载形（零构建下两端如何取核）

**落点 = 新顶层目录 `thincoder-render-core/`**（真包：`name: "@thincoder/render-core"`，零运行期依赖、零 devDep）；**文件形 = `.mjs`**。
判据：桌面 `app://` 供给面 MIME 白名单含 `.mjs` 不含 `.js`（`thincoder-desktop/src/main/protocol.mjs:22-29`）；VSC webview 已有 `.mjs` 模块实跑先例（`thincoder-vscode/webview/tool-card-restore.mjs`；R2 换接后八拆档同径直接 import 核包 `.mjs`）。

**扩展端加载形**：webview 模块以**静态相对路径**取核（`../node_modules/@thincoder/render-core/xxx.mjs`）。

- 判据：webview 资源根 = 扩展安装目录（现仓**未设** `localResourceRoots`——代码面 grep 零命中，默认根含扩展目录）⇒ `node_modules/**` 落在根内；`index.html` 资源引用 = `asWebviewUri` 占位符注入（`src/extension/chat-panel.mjs:413-425`）；相对 import 由浏览器按各模块自身 URL 解析 ⇒ **零占位符新增 · 零 `localResourceRoots` 改动 · 零 importmap**。
- 发行面：`.vscodeignore` 增反排除行（照核先例 `thincoder-vscode/.vscodeignore:3-4` 的「`node_modules/**` + 反排除」两行式）+ `scripts/check-vsix.mjs` 增断言（照其 `:56-63` 断言 B 形：核包存在且版本逐字相等）。
- **内嵌面收窄规则**：vsix 只携核包运行必需件（`.mjs` + `package.json`）——`test/` / `docs/` 不入；现行反排除形（`thincoder-vscode/.vscodeignore:5`）在 link 形下随 `--follow-symlinks` 会把被链源树测试面一并纳入（实测 7 档）⇒ 补排除行（形：`node_modules/@thincoder/render-core/test/**`）。
- 先例坑同源：dev 期 `npm link`（junction）——`vsce` 不打包 symlink；**render-core 实测收正**：物化路线（`npm install --install-links`）对其不可执行——vsce 默认依赖检测（`npm list --production`）报 `ELSPROBLEMS/invalid` ⇒ 打包硬失败；
  可行形 = **link 形 + `--follow-symlinks`**（R1 打包窗实测 475 件；render-core 内嵌带发、永不发布——§2 KD-RC-1）· `@thincoder/core` 面「发布前物化（registry 解析）」纪律（`docs/RELEASE.md:141` §5.5 步 1）不动。

**桌面端加载形**：主进程解析包路径（`createRequire(import.meta.url).resolve("@thincoder/render-core/package.json")`）⇒ `app://` 供给面**双根**：
`/` → `renderer/`（现状 · `protocol.mjs:17` `RENDERER_ROOT`）· `/rc/` → 核包目录；渲染面以**同源绝对路径** import（`/rc/xxx.mjs`）。

- 判据：`protocol.mjs` 逃逸门（`relative()` 判据——`:53-54`）对各根同式施加 ⇒ 双根 = 显式登记第二条根 + 各根各留逃逸门（供给语义不变）。
- 渲染面静态闭包守卫随动：`thincoder-desktop/test/guard-closure.test.mjs:70`「渲染面零裸包 / 零 `@thincoder/core`」⇒ 新增 `/rc/` 前缀白名单；**裸包禁令不变**（核经 URL 前缀取，不经 `node_modules` 裸名）。
- 发行面：`thincoder-desktop/package.json` `dependencies` 增该包（electron-builder 打包生产依赖）；`scripts/check-dist.mjs` 增产物断言（R1 已落 1 条——`CHECKS` 表 `:18-24`：asar 包内 `node_modules/@thincoder/render-core/package.json` 在册）。

**被否候选**：

1. **直接拷贝一份进某一端树**——用户 2026-09-27 20:48 已否（改判 = 抽共享核）；拷贝 = 双源漂移面。
2. **单树相对引用核源码**（`../../thincoder-render-core/…`）——桌面 `app://` 逃逸门拒；VSC 发行面 vsix 内不存在该路径 ⇒ 生产不可达。
3. **打包器 / 构建步骤**——违仓级「无构建步骤」硬约束（`docs/core/design/ARCHITECTURE.md:20` 硬约束表第 2 行）。
4. **importmap / 运行时注入 base 再动态 import**——桌面 CSP 零 `unsafe-inline`（`thincoder-desktop/renderer/index.html:5-8`）⇒ 内联 importmap 不可行；动态 import 把各消费档改为 TLA 异步模块 = 初始化时序新面（VSC 侧虽含 `'unsafe-inline'`（`chat-panel.mjs:417`）但双端须同法）。
5. **把核放进某一端树内、另一端跨树供给**——端间所有权交叉（物化 / 断言 / 版本三面全部借道单端，违 `CORE-UNIFICATION.md` 单源纪律）。

**零构建判定**：两形皆无构建步骤、无打包器——核 = 源码直跑；发行纪律（链接 / 物化 / 断言 + 永不发布——单源 = §2 KD-RC-1）不是构建步。

### 1.4 与仓级约束的关系

- 无构建步骤（`docs/core/design/ARCHITECTURE.md:20` · `thincoder-vscode/AGENTS.md:11`）：核为源码目录、无产物。
- 零第三方运行期依赖：核自身零依赖（纯浏览器标准面）。
- 桌面零框架（`docs/desktop/design/PROJECT.md` §2 KD-4）：核 = 手写 DOM + 纯函数。

## 2. 关键决策记录

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-RC-1 | 核落点 = **新顶层真包 `thincoder-render-core/`**（`@thincoder/render-core`，零依赖） | 与 `@thincoder/core` 同式（共享物 = 独立包——`docs/core/design/CORE-UNIFICATION.md` §2.6.1）；**链接 / 物化 / 断言三纪律 + 永不发布**：前三条复用（物化面 = 打包形实测收正，单源 = 本档 §1.3）；永不发布 = `private: true` / 零 `publishConfig`——两端内嵌带发、零 registry 端消费者（用户 2026-09-27 22:00 裁定；未发布即 E404） | 见 §1.3 被否 1 / 2 / 5 |
| KD-RC-2 | 核**文件形 = `.mjs`** | 桌面 MIME 白名单（`protocol.mjs:22-29`：有 `.mjs`、无 `.js`）；VSC 已有 `.mjs` 实跑先例（`thincoder-vscode/webview/tool-card-restore.mjs`） | **`.js`**（须改桌面协议白名单；两端扩展名混用）；**只搬 `.js` 到核再让桌面加白名单**（白增一面，无收益） |
| KD-RC-3 | 核**输出形态 = DOM 构件 + 纯函数**（浏览器原生；不引框架、不定 HTML 字符串契约） | 两端渲染面同为 Chromium DOM；DOM 非宿主特权（§1.2）；VSC 现状 = DOM 命令式、桌面现状 = 描述符树——核构件（返回 DOM 节点）可被两端各挂各的壳（桌面挂载面直接 append） | **纯逻辑核（不碰 DOM）**（桌面须保第二份 DOM 实现 ⇒「共用核」名存实亡——用户改判对象即此）；**HTML 字符串核**（转义闸责任漂移 + 桌面现制零 HTML 注入面全量重构）；**引框架**（违零框架裁定） |
| KD-RC-4 | 桌面**「零 Markdown」口径改判**：对话流文本面 ⇒ 经核 Markdown 呈现（`md.mjs` 单源；助手块 / 用户块同径） | 用户 2026-09-27 20:45 走查第 3 点「会话流…应该跟 VSC 对齐」+ D19 明列 Markdown；对齐须经同核（同文本 ⇒ 同渲） | **保留纯文本 `pre-wrap`**（背离走查原话；D19 列举失守）；**桌面自写第二份 md**（第二实现 = 漂移面）；**只渲助手块、用户块保纯文本**（同流两制 = 读感断层；VSC 用户块亦走 md） |
| KD-RC-5 | 桌面**文件链接不承载**（核含 `linkify`，桌面不消费 ⇒ 零链接节点） | 需求 §5.1：**文件视图与编辑器（打开 / 编辑 / 保存 / 内置 diff）暂缓**——链接出口 = 「打开文件」⇒ 落链接即假控件（违「诚实非死控」律 `docs/desktop/design/RENDERER.md:43`） | **落链接 + 无出口**（假控件）；**落链接 + 系统程序打开**（越暂缓边界，须需求侧先裁）；**核删 linkify**（VSC 消费面在——核不夺） |
| KD-RC-6 | 桌面**子 agent 面内容 chunk 分流 = 取工具名 · 丢内容** | 需求 §3.1:51 / D4 逐字「粒度 = 工具名 + 状态，**不回显内容**」；现状漏 = 带 `role#id/` 前缀的内容 chunk **原样进主流**（`thincoder-desktop/src/main/agent-bridge.mjs:57-63` 只剥 `⟦ev⟧` 协议段，其余前缀不剥）⇒ 分流 = 修漏 + 定形 | **照 VSC 回显 tail-3**（违 D4 语义面）；**原样留主流**（前缀字面泄漏入对话流）；**剥前缀后并入主流正文**（子代理内容冒充主会话正文——三端语义分叉） |
| KD-RC-7 | 核**构件类名沿用被抽档现行名**（逐字搬迁纪律）；样式变量面 = 各端映射（桌面新增「核类名 → 桌面变量」样式档） | VSC 侧 CSS（`chat.css` / `controls.css`）与逐字文案锁按现行名成文 ⇒ 改名 = 全量机械重构、收益为零；桌面样式自有（`styles.css` 340 行） | **改命名空间 `rc-*`**（VSC 全量 CSS + 测试靶重构）；**核搬整套 CSS**（两端主题体系打架——KD-RC-7 即为此面裁定） |

## 3. 核边界 · 逐模块判定表（VSC webview 51 档 · 单源）

三值判定：**核**（整体入核：零宿主特权仍可运行）· **拆**（纯迁移 / 呈构件入核 + 出站 / 句柄 / 分发留端注入）· **端**（留适配层：端协议 / 端结构 / 端能力）。
依据 = 勘察实读行号（宿主三张：A = `state.js` import · B = 直用 `postMessage` · C = `--vscode-*` 直用）。

| # | 档 | 判定 | 依据 / 说明 |
|---|---|---|---|
| 1 | `activity-diag.js` | 端 | 诊断留痕上行（`:81` 上行 `panelDiag`）——端观测面 |
| 2 | `activity-new.js` | 端 | 活动区计数钮（`:21` / `:33`）；桌面右列常驻不需该钮（端差登记） |
| 3 | `activity-view.js` | **核** | 块头 / 状态词 / 尾 3 行 / ⏹ 控件（`:118` `refreshBlock` · `:152` · `:184`）——零 A / B / C |
| 4 | `activity.js` | **拆** | 块态机（出生 `thincoder-render-core/subblocks/state.mjs:103` / 接管 `:124` / 冻结 `:47` / 归档 `:93` 的**迁移判据**）入核；出生位 / 归档入流的 DOM 编排留端（`thincoder-vscode/webview/activity.js:48` / `:104`） |
| 5 | `autocomplete.js` | 端 | 输入面端能力（`@` 补全 / 粘贴上传） |
| 6 | `base.css` | 端 | 宿主变量映射层（`:8-20`）；核契约 = KD-RC-7 |
| 7 | `chat-messages.js` | 端 | 52-case 分发 = 端协议（`:48` 唯一监听点） |
| 8 | `chat-status.js` | 端 | 压缩 / digest 状态文案（核机制钩子面） |
| 9 | `chat.css` | 端 | 会话流域样式（核类名契约住本档 §5） |
| 10 | `chat.js` | 端 | 装配 / 启动握手（`:135` · `:147`） |
| 11 | `controls.css` | 端 | 控制面样式 |
| 12 | `diff.js` | **核** | 纯函数行级 diff（`:13` / `:90`）；VSC 消费、桌面不消费（§4 行 10） |
| 13 | `highlight.js` | **核** | 零依赖分词器（`:165`）；消费面 = `md.js:17` |
| 14 | `history.js` | 端 | 回填壳（触发 / 补偿 `:57-61` / `:79-88`）；两端口径各自（核化候选另议——§9） |
| 15 | `i18n-dom.js` | 端 | 静态 DOM 套用（`:8`） |
| 16 | `i18n.js` | **核** | `t()` / 插值 / 缺键回落（`:18` / `:26`）；字符串表来源端各给 |
| 17 | `index.html` | 端 | 每端骨架（VSC 占位符制 `:6` / `:93`；桌面相对直引） |
| 18 | `input.js` | 端 | 输入框键位 / 中断模态（`:21` / `:46` / `:58`） |
| 19 | `ledger-line.js` | **拆** | 行构造与类名入核（`thincoder-render-core/flow/ledger-line.mjs:8`）；跟滚耦合（`maybeScrollDown` 依赖）留端注入（`thincoder-vscode/webview/ledger-line.js:11-12`） |
| 20 | `lib.js` | **核** | 纯工具集（`:15` `tailTruncate` · `:27` `MAX_TOOL_OUTPUT` · `:73` `toolFailureStatus` · `:94`）——零 DOM 零宿主 |
| 21 | `loading.js` | 端 | 忙态门 / 按钮换位（`:67` / `:86`） |
| 22 | `md.js` | **核** | Markdown 渲染 + **全量转义闸**（`:67` / `:106` / `:146` / `:151`） |
| 23 | `mode-buttons.js` | 端 | 端模式钮（桌面会话头自持） |
| 24 | `model-menu.js` | 端 | 端选择器（内联 CSS 用宿主变量 `:40-69`） |
| 25 | `model-picker.js` | 端 | 端模型钮 + 推理下拉（`:13` / `:40-68`） |
| 26 | `onboarding.js` | 端 | 端引导（桌面首启向导自持） |
| 27 | `panels.js` | **拆** | 任务 / 目标面板**构树 + 显隐判据**入核（`thincoder-render-core/cards/panel.mjs:17` / `:26` / `:67` / `:74`）；挂起 / 回合态 / 目标消息分流留端（`thincoder-vscode/webview/panels.js:81` / `:108` / `:118`） |
| 28 | `permission.js` | **拆** | 审批卡面构树入核（`thincoder-render-core/cards/permission.mjs:60` / `:105`）；`postMessage` 三出口留端注入（`thincoder-vscode/webview/permission.js:15-19`） |
| 29 | `question.js` | **拆** | 提问卡面构树入核（`thincoder-render-core/cards/question.mjs:13`）；出站留端（`thincoder-vscode/webview/question.js:15-18`） |
| 30 | `queued-mark.js` | **拆** | 待发送标记口径 / 防悬空纯逻辑入核（`thincoder-render-core/flow/queued-mark.mjs:39` / `:47` / `:74`）；DOM 与快照来源留端（`thincoder-vscode/webview/queued-mark.js:26-39`） |
| 31 | `scroll.js` | 端 | 回底钮与可见性（`:13-20`） |
| 32 | `search.js` | 端 | 端搜索面（`:160-161` Ctrl+F）；桌面本轮不承载（§4 行 20 注） |
| 33 | `send.js` | 端 | 发送路径与守卫（`:13` / `:23-26` / `:32-`） |
| 34 | `session-bar.js` | 端 | D18 = **对位**而非共用（多标签结构不削）；元数据形见 `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 4 |
| 35 | `session.css` | 端 | 会话栏样式（零宿主变量） |
| 36 | `settings-agent.js` | 端 | 设置面（端） |
| 37 | `settings-env.js` | 端 | 设置面（端） |
| 38 | `settings-models.js` | 端 | 设置面（端；零 A / B / C——但端结构面） |
| 39 | `settings-providers.js` | 端 | 设置面（端） |
| 40 | `settings-state.js` | 端 | 设置面共享态（端） |
| 41 | `settings-tools.js` | 端 | 设置面（端） |
| 42 | `settings-widgets.js` | 端 | 设置面控件（端） |
| 43 | `settings.css` | 端 | 设置面样式 |
| 44 | `settings.js` | 端 | 设置面板编排（`:25` / `:38-48`） |
| 45 | `state.js` | 端 | 宿主句柄唯一获取点（`:10`）+ 全局单例（`:13` / `:71`） |
| 46 | `status-bar.js` | 端 | D17 = 桌面**对齐 CLI**（非共用 VSC 状态栏）；且其快照面 = 端协议 |
| 47 | `streaming.js` | **拆** | rAF 降频缝合 / md 重渲 / 推理块构件 / 代码块复制钮 / 子代理 chunk 构图入核（`thincoder-render-core/flow/stream.mjs:36` · `:95`；`thincoder-render-core/flow/reasoning.mjs:11`；`thincoder-render-core/subblocks/block.mjs:41`）；`ctx` / `S` 交互留端（`thincoder-vscode/webview/streaming.js:117`） |
| 48 | `toast.js` | **核** | 通用轻提示构件（`:10` / `:21`）——零 A / B / C |
| 49 | `tool-card-restore.mjs` | **核** | 完成卡纯构树（`:24` / `:44` / `:73-77`）——依赖仅 md / lib / i18n |
| 50 | `tool-summary.js` | **核** | 工具摘要单源（`:35`）——活卡与恢复卡共用 |
| 51 | `ui.js` | **拆** | 块容器（`thincoder-render-core/flow/block.mjs:111`）/ 工具卡（`thincoder-render-core/flow/tool-card.mjs:56` / `:95` / `:147`）/ 恢复面（`thincoder-render-core/flow/block.mjs:93` / `:121`）/ 错误横幅（`thincoder-render-core/flow/block.mjs:133`）入核；唯一出站（`retry`）留端注入（`thincoder-vscode/webview/ui.js:164-166`） |

**计数（D3）**：51 档 = **核 9**（`activity-view` · `diff` · `highlight` · `i18n` · `lib` · `md` · `toast` · `tool-card-restore.mjs` · `tool-summary`）· **拆 8**（`activity` · `ledger-line` · `panels` · `permission` · `question` · `queued-mark` · `streaming` · `ui`）· **端 34**。
**静置面（本轮不改动）**：`search.js` / `activity-new.js` / `activity-diag.js` / `autocomplete.js` 四档在本轮核化射程外（端差或后议）。

## 4. 逐机制对位表（22 机制 × 桌面 · 单源）

口径：机制清单 = VSC webview 会话流呈现机制归并（勘察逐档清点）——**22 行**；列 4 = 桌面接核判定三值：
**自然成立**（接核即有 · 无桌面增量）· **需补面**（桌面侧须补入站 / 归约 / 形态）· **显式裁**（有意不承载或口径改判——须登记理由与被否）。

| # | 机制 | VSC 承载（file:line） | 核承载件 | 桌面接核判定 |
|---|---|---|---|---|
| 1 | Markdown 渲染（含转义闸） | `md.js:67` / `:106` / `:146` | `md.mjs` | **显式裁（改判）**：桌面由 `pre-wrap` 纯文本改为经核 Markdown——KD-RC-4 |
| 2 | 语法高亮 | `highlight.mjs:165`（R1 迁核） | `highlight.mjs` | **自然成立**（随 md；代码块面由核给 `<pre class="code-block">`） |
| 3 | 流式增量渲染（rAF 降频缝合） | `streaming.js:36-79` / `:112` | 核缝合件 | **需补面**：桌面换接核缝合（现制 = `renderer/events.mjs` `onToken` 追加 + `thincoder-desktop/renderer/views/chat-stream.mjs` 档位分派——语义不变、实现收口） |
| 4 | 推理块（think） | `streaming.js:81-107` | 核推理块构件 | **需补面**：核回调 `onReasoning`（`thincoder-core/agent.mjs:273`）未接——桌面 `agent-bridge.mjs` 补回调（现九键）+ 新通道 + 归约块型（块型 `reasoning` 已在桌面五型内） |
| 5 | 帧 / 块容器（回合块与 idx） | `ui.js:176-189` | 核块容器构件 | **需补面**：桌面块五型容器换接核容器（现制 = `thincoder-desktop/renderer/views/chat.mjs` 描述符树） |
| 6 | 工具卡面 | `ui.js:203` / `:281` / `:329` | 核工具卡构件 | **需补面**：桌面 `thincoder-desktop/renderer/views/chat-tool.mjs` 换接核卡面（现制含折叠 / 耗时 / 改动摘要——对齐项） |
| 7 | 工具摘要单源 | `tool-summary.js:35` | `tool-summary.mjs` | **需补面**：桌面摘要现住**主进程**（`src/main/agent-bridge.mjs:30-48` `summarizeArgs`）⇒ 换引核单源（Node 侧可 import 核 `.mjs`） |
| 8 | 工具输出增量（含 64K 截断） | `chat-messages.js:70-89` · `lib.js:27` | 核截断 + 呈现件 | **自然成立**（桌面 `ev:tool-output` 通道 + `events.mjs:125-135` 累积已在；截断口径随核） |
| 9 | 工具结果收尾（成败 / 耗时 / 折叠） | `ui.js:318-326` · `lib.js:73` / `:94` | 核判据 + 卡面 | **自然成立**（桌面 `events.mjs:140-156` 收尾 + `durationMs` 已在；判据换核单源） |
| 10 | 行级 diff（审批预览） | `diff.js:13` / `:90` | `diff.mjs` | **显式裁（不消费）**：桌面审批卡无 `changes` 预览面且需求 §3.1:50 明写「不做 diff」——核含、桌面不消费 |
| 11 | 代码块复制 | `streaming.js:218-231` | 核复制控件 | **需补面**：桌面现只有块级 / 末条复制（KD-22）⇒ 真代码块复制随核落（§10 Y 消解） |
| 12 | 文件链接 | `ui.js:247` · `chat.js:71-79` | 核 linkify | **显式裁（不承载）**：需求 §5.1 暂缓面——KD-RC-5 |
| 13 | 消息窗口裁剪 | `ui.js:446-454`（150 块） | 不入核 | **显式裁（各自）**：桌面窗限 = 200 块 + 摘要块（`RENDERER.md` §2，判据面自持）——数值差登记 · 核不夺 |
| 14 | 懒历史回填 | `history.js:43-88` | 不入核 | **显式裁（各自）**：桌面回填 / 补偿算式已在册（`RENDERER.md` §3）；核化候选另议（§9） |
| 15 | 跟滚 / 回底 | `ui.js:426-468` · `scroll.js:13-20` | 不入核 | **显式裁（各自）**：桌面跟滚 / 药丸已在册（`RENDERER.md` §3 判据面） |
| 16 | 队列标记（待发送） | `queued-mark.js:29` / `:63` | 核标记逻辑 | **自然成立**（桌面队列族 + flush 机制已在——`store.mjs` `enqueue` / `drainQueue`） |
| 17 | 忙态门 / 载入态 | `loading.js:86` / `:67` | 不入核 | **自然成立**（桌面忙态 = 位标 `running` + 输入区判据已在） |
| 18 | 审批卡 | `permission.js:21` / `:86` | 核卡面 | **需补面**：桌面 `thincoder-desktop/renderer/views/approval.mjs` 换接核卡面（三出口 / 批形已在） |
| 19 | 提问卡 | `question.js:10` / `:59-76` | 核卡面 | **需补面**：桌面 `thincoder-desktop/renderer/views/question.mjs` 换接核卡面（两作答路已在） |
| 20 | 计划 / 任务面板 | `panels.js:16` / `:39` | 核面板构树 | **需补面**：桌面计划卡（`thincoder-desktop/renderer/views/plan.mjs`）换接核构树；搜索（`search.js`）桌面**本轮不承载**（VSC 端面） |
| 21 | 子代理活动区（live 面板） | `activity.js` · `activity-view.js` | 核块态机 + 块面 | **需补面**：桌面右列重定位为子 agent 面板（D20——通道 / 归约 / 形态三面 + **出生自愈**：宿主存活投影 2s 再断言（拍体沿 `thincoder-vscode/src/extension/panel-messages.mjs:42-74` 语义——只发在飞实例）；见 `docs/desktop/design/IPC.md` §1） |
| 22 | 状态栏 / 状态行 | `status-bar.js:13` | 不入核 | **显式裁**：桌面状态行**对齐 CLI**（D17）而非共用 VSC 状态栏——15 段逐项裁定表住 `docs/desktop/design/UI.md` §1 本批注 |

**计数（D3）**：22 行 = 自然成立 **5**（行 2 / 8 / 9 / 16 / 17）· 需补面 **10**（行 3 / 4 / 5 / 6 / 7 / 11 / 18 / 19 / 20 / 21）· 显式裁 **7**（行 1 / 10 / 12 / 13 / 14 / 15 / 22）。

## 5. 接口契约（核导出面 · 端注入面 · 样式契约）

**核导出面（三族）**：

1. **纯函数族**——`md(text)` / `mdInline(text)` / `esc(s)` / `highlight(code, lang)` / `lineDiff(a, b)` / `renderDiff(...)` / `formatToolSummary(name, text)` / `t(key, vars)` / `setStrings(dict)`；
   `lib` 各纯函数（`tailTruncate` / `capText` / `fmtK` / `fmtTime` / `patchLineType` / `toolFailureStatus` / `isToolFailure`）。
2. **状态机族**——`relayEventToSubPatch(token, scope, deps?) → patch | null`（**映射单源**：VSC 扩展侧 / 桌面主进程两端共用；`scope` = `createRelayScope()` 实例，**必给**——缺 scope fail-closed 报错，不静默降级）；
   `subBlocksReduce(list, patch, deps?) → { list, effects }`（出生 / 终态折叠 / 归档三态机；`effects` = DOM 效果表——端按序执行）+ `ensureSubBlock(list, key, deps?)`（内容 chunk 出生闸）+ `subBlocksFreezeAll(list, deps?)`（会话退出兜底）；判据族（键文法 / 终态 kind / 补桩表 / 补桩前置）= `channel.mjs`。
   先例 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`（逐字搬迁——R2 后 VSC 差分 = 零）。**token → patch 全表（单源 · 本表）**：

   | token | 产物 patch | 先例 |
   |---|---|---|
   | `⟦ev⟧async` | `null`（只入 pending 集——随 `[model]` 出生） | `:102-107` |
   | `[model]` | `{ status: "started", role, id, pool, model, startedAt, syncLive }`——`syncLive` = **端侧补注**（端 registry 供给——`!pool && syncLiveOf(panel, path.head)` 只读采样宿主 `_syncChildAborts`；**核不可算**）；async 块（`pool` 真）恒 `false` | `:108-113` |
   | `⟦ev⟧queued` | `{ status: "queued", role, id, kind?, position?, waiting?, reason? }` | `:114-129` |
   | `⟦ev⟧turn` | `{ status: "turn", role, id, turn, maxTurns }` | `:141-144` |
   | `⟦ev⟧cancelled` | `{ status: "cancelled", was: "queued", role, id }` | `:130-134` |
   | `⟦ev⟧stopped` | `{ status: "cancelled", role, id }`——**不产 `stopped` 值** | `:138` |
   | `⟦ev⟧settled` | `{ status: "settled", role, id }` | `:139` |
   | `⟦ev⟧done` | `{ status: "done", role, id }` | `:140` |
   | 表外 `⟦ev⟧`（`approval` 等） | `null`（消费不泄漏） | `:145` |
   | 非协议行 / 内容 chunk | `null`（内容分流面另判——KD-RC-6） | `:146` |

   **存活投影变体（宿主 2s 再断言）**：亦发 `[model]` 形、携 `syncLive: false`（硬编码——投影只枚举池条目〔async〕⇒ 恒假；`thincoder-vscode/src/extension/suspension.mjs:156`）。

   **状态值闭集（两端同源）= `started` / `queued` / `turn` / `done` / `settled` / `cancelled`**；两值裁定：
   - `stopped` = **先例兼容**——闭集不载（`⟦ev⟧stopped` ⇒ `cancelled`）；桌面终态词由端侧映射（`cancelled` ⇒ 词表「已停止」——`docs/desktop/design/UI.md` §1 状态词行）。
   - `error` = **不载（有意收窄 · 说明在案）**——核 relay 谱无错误 token：sync 错误径 ⇒ `⟦ev⟧stopped`（`thincoder-core/agent-tools/subagent.mjs:360`）· async 错误径 ⇒ `⟦ev⟧done` / `⟦ev⟧settled`（`thincoder-core/agent-tools/async-settle.mjs:273` / `:275`）；
     VSC webview 终态词表的 `error` / `failed` / `terminated` 成员 = 自述面遗留（`onSubagent` 回调在核内零发射点——`thincoder-vscode/src/extension/panel-callbacks.mjs:164` 仅定义）⇒ 无活上游，桌面不复制；错误可见面在对话流（工具卡 / 报告），不在本块面。

**relay 文法零依赖副本登记**：relay 前缀文法（`role#id/`）权威 = `thincoder-core/agent/relay-prefix.mjs`（`:10` / `:16-32`）；核包零依赖约束下不可 import ⇒ 副本逐字移植于 `thincoder-render-core/subblocks/relay.mjs`（`:20` / `:25`，漂移登记在件头）；
**跨包对拍锁** = `thincoder-vscode/test/render-core-relay-map.test.mjs` RM-3（`:95`）· RM-4（`:117`——`RELAY_PREFIX_RE` 正则 `.source` 逐字）。

3. **构件族（DOM）**——`renderBlock({ idx, withLabel })` · `renderToolCard({…})` / `finishToolCard(ref, name, text, links, truncated, deps?)` / `renderToolHistory(name, text, idx)` · `renderReasoning(model, deps?)`；
   `renderApprovalCard(model, deps?)` / `renderBatchApprovalCard(model, deps?)` · `renderQuestionCard(model, deps?)` · `renderTaskPanel(progress, deps?) → { el, visible }` / `renderGoalPanel(goal, deps?)` · `renderSubBlock(model)`；
   `attachCopyButtons(container, deps?)` · `showToast(text)` · `linkifyPaths(bodyEl, links)`（VSC 消费）。

**端注入面（核不持句柄）**：`deps = { emit(type, payload), t, now? }`——出站一律经 `emit`（VSC 绑 `postMessage`；桌面绑 `invoke`）；R2 构件件另注入端事实读取族（`connectedOf` / `regionOf` / `trace` / `syncLiveOf` / `onStripped`——逐件件头）；核内零全局单例（现 VSC 的 `ctx` / `S` 全局态属端）。

**样式契约**：核构件类名 = 被抽档现行名（KD-RC-7）；两端各供样式——VSC 沿用 `chat.css` / `controls.css`（零改），桌面新增「核类名 → 桌面变量」样式面（实施批 R3c 落）。

## 6. 受影响文件与测试面（三端 · 实施分批随动）

口径：现行 = 本批设计轮实读（2026-09-27 · 内容行数口径——文末换行不计）；预期 = 估值（R1 / R2 已按实读回填——行内「N 实读」旁注）；「结构不变」= 档职责边界不动。

**核包（新建 · 逐档拟新增）**：`thincoder-render-core/package.json`（拟新增） · `md.mjs` · `highlight.mjs` · `diff.mjs` · `lib.mjs` · `tool-summary.mjs` · `i18n.mjs`（R1——逐字搬迁：行数 = VSC 原档现行值，见下表） ·
  `flow/*.mjs`（块 / 工具卡 / 推理 / 缝合）· `cards/*.mjs`（审批 / 提问 / 计划）· `subblocks/*.mjs`（态机 / 块面）（R2） · `test/*.test.mjs`（平 node 直测——**纯函数层 + 态机层**）。
  **DOM 构件层用例宿主 = 消费端套件**（非核包）：VSC = `thincoder-vscode/test/**`（happy-dom devDep 既有）· 桌面 = `thincoder-desktop/test/fake-dom.mjs`（假 root 既有）——核包自身零 devDep（C1 机检恒可过），不引 happy-dom ∥ 不另立第二假 root。

**扩展端（判定表 17 档 + 发行三件）**——逐档「现行 ⇒ 预期」（核 9 = 迁核；拆 8 = 纯面迁核 · 端留守）：

| 档（`thincoder-vscode/webview/`） | 现行 | 预期 | 判定 | 迁出面 / 注（越层档带拆分预案） |
|---|---|---|---|---|
| `md.js` | 266 | 核 ±0（266）· R1 实读 266 ✓ | 核 | 逐字搬迁；VSC 侧原档不再持逻辑——R1 实施注：2 行 shim（零逻辑再导出） |
| `highlight.js` | 198 | 核 ±0（198）· R1 实读 198 ✓ | 核 | R1 实施注：核 `highlight.mjs` 逐字搬迁；VSC 原档**删除**（零消费面——原唯一消费者 `md.js` 已核化） |
| `diff.js` | 99 | 核 ±0（99）· R1 实读 99 ✓ | 核 | R1 实施注：核 `diff.mjs:6` = 逐字性**唯一例外**（引用行重指 `esc as escHtml` ← 核内 `./md.mjs`——`escHtml`〔`ui.js:419-421`〕 ≡ `esc`〔核 `md.mjs:151-153`〕同构；对拍 225 项 0 mismatch）；VSC 档 = 2 行 shim；桌面不消费——§4 行 10 |
| `lib.js` | 99 | 核 ±0（99）· R1 实读 99 ✓ | 核 | R1 实施注：核 `lib.mjs` 逐字搬迁；VSC 档 = 2 行 shim |
| `tool-summary.js` | 122 | 核 ±0（122）· R1 实读 122 ✓ | 核 | R1 实施注：核 `tool-summary.mjs` 逐字搬迁；VSC 档 = 2 行 shim |
| `i18n.js` | 33 | 核 ±0（33）· R1 实读 33 ✓ | 核 | R1 实施注：核 `i18n.mjs` 逐字搬迁；VSC 档 = 2 行 shim |
| `activity-view.js` | 200 | 核 ±0（200）· R2 实读 200 ✓ | 核 | R2 实施注：核 `subblocks/activity-view.mjs` 逐字搬迁（`:10` 一处引用行重指）；VSC 侧 = 2 行 `export *` shim |
| `toast.js` | 22 | 核 ±0（22）· R2 实读 22 ✓ | 核 | R2 实施注：核 `toast.mjs` 字节全同；VSC 侧 = 2 行 `export *` shim（`showToast._t` 同一函数对象） |
| `tool-card-restore.mjs` | 82 | 核 ±0（82）· R2 实读 82 ✓ | 核 | R2 实施注：核 `thincoder-render-core/flow/tool-card-restore.mjs` 逐字搬迁（`:12-14` 三处引用行重指）；VSC 侧 = 2 行 shim（仅测试面消费） |
| `activity.js` | 450 | ≈ 260–320 · R2 实读 **190** | 拆 | 迁出态机迁移判据 ⇒ 核 `subblocks/state.mjs` + `subblocks/channel.mjs`；低于带（实迁出量大于估值——另承接 `renderSubBlock` / 判据族等原档内联段）⇒ 拆分预案消解（未误拆） |
| `ui.js` | 469 | ≈ 200–250 · R2 实读 **221** | 拆 | 迁出四构件面（块容器 / 工具卡 / 恢复面 / 错误横幅）⇒ 核 `thincoder-render-core/flow/block.mjs` + `thincoder-render-core/flow/tool-card.mjs`；带内 ⇒ 拆分预案消解（未误拆） |
| `streaming.js` | 262 | ≈ 150–190 · R2 实读 **182** | 拆 | 迁出 rAF 缝合 + md 重渲 + 推理块 + 复制钮 + chunk 构图 ⇒ 核 `thincoder-render-core/flow/stream.mjs` / `thincoder-render-core/flow/reasoning.mjs` / `thincoder-render-core/subblocks/block.mjs`；带内 |
| `panels.js` | 142 | ≈ 90–110 · R2 实读 **122** | 拆 | 构树 + 显隐判据 ⇒ 核 `cards/panel.mjs`；略高于带（端侧保 2s 定时器与消息分流）；挂起 / 回合态 / 分流留守 |
| `permission.js` | 122 | ≈ 80–95 · R2 实读 **39** | 拆 | 构树 ⇒ 核 `thincoder-render-core/cards/permission.mjs`；低于带（实迁出量大于估值）；三出口留守（端注入） |
| `question.js` | 89 | ≈ 60–70 · R2 实读 **25** | 拆 | 构树 ⇒ 核 `thincoder-render-core/cards/question.mjs`；低于带；出站留守 |
| `queued-mark.js` | 88 | ≈ 55–65 · R2 实读 **40** | 拆 | 纯逻辑 ⇒ 核 `flow/queued-mark.mjs`；低于带；DOM / 快照来源留守 |
| `ledger-line.js` | 18 | ≈ 10–12 · R2 实读 **13** | 拆 | 行构造 ⇒ 核 `flow/ledger-line.mjs`；带内（+1）；跟滚耦合留守 |

**发行三件 + 测试面**：`thincoder-vscode/package.json`（依赖 +1）· `.vscodeignore`（反排除 +1 行）· `scripts/check-vsix.mjs`（断言 +1）· `thincoder-vscode/test/**`（happy-dom 直驱路径随动 + 核包 DOM 构件层用例宿主）。

**桌面端**：`thincoder-desktop/package.json`（依赖 +1）· `src/main/protocol.mjs`（双根 + `/rc/`）· `test/guard-closure.test.mjs`（前缀白名单）· `scripts/check-dist.mjs`（产物断言）· `renderer/*` 三面重定位（R3a–R3c）——逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行（**就地给数** · 指针不悬空）。

**文档面**：本档（新）· `docs/desktop/design/{UI,IPC,PROJECT,RENDERER}.md` · `docs/vsc/design/WEBVIEW.md`（接入形）· `docs/core/design/ARCHITECTURE.md` + `docs/README.md`（模块地图补行——父侧面，§10 上抛）。

## 7. 验收判据（机器可检 · 回指 D19）

| # | 判据 | 机检面 |
|---|---|---|
| C1 | 核包在盘且零依赖（`dependencies` / `devDependencies` 皆空）；核档内 `.mjs` 全档 `node --check` 过 | `node --check` + 包面断言 |
| C2 | VSC 接核零回归：其套件全绿（逐字文案锁不动）+ **映射差分锁**（`⟦ev⟧stopped` ⇒ `{ status: "cancelled" }` 逐字 · 闭集零 `stopped` / `error` 产值——§5 全表负向） | `thincoder-vscode/test/run.mjs` |
| C3 | vsix 断言：核包在 vsix 内且版本逐字相等（照核先例断言形） | `thincoder-vscode/scripts/check-vsix.mjs` |
| C4 | 桌面加载形：`app://desktop/rc/**` 命中（`protocolStats.served` 计数）+ 逃逸门两向（负探针仍拒） | `thincoder-desktop/test`（协议面）+ 启动冒烟 |
| C5 | 桌面渲染面静态闭包：零裸包 + `/rc/` 前缀白名单成立 | `thincoder-desktop/test/guard-closure.test.mjs` |
| C6 | 产物断言：桌面 dist 含核包 | `thincoder-desktop/scripts/check-dist.mjs` |
| C7 | 桌面 Markdown 面：含围栏代码块的文本 ⇒ 渲染含 `pre.code-block`；转义闸（注入样本 ⇒ 字面文本） | 桌面视图用例 |
| C8 | 桌面对位表 22 行在册且计数自洽（D3） | 本档 §4 |

## 8. 实施分批建议（文件面 · 串行序）

**开工前置**：与在飞退役批（#108）文件面**逐档核对**（核包新建面 + `thincoder-vscode/webview/**` + 桌面 `renderer/**` 三面）——冲突 ⇒ 串行；桌面批 / 豁免批文件零触碰。

**共享档串行条（本表判据）**：`thincoder-desktop/src/main/agent-bridge.mjs` · `thincoder-desktop/renderer/events.mjs` · `docs/desktop/design/IPC.md` 三档被 R3a / R3b / R3c 共触（回调面九 ⇒ 十 ⇒ 十一键 · 归约面递增 · 通道面递增）⇒ **R3a ⇒ R3b ⇒ R3c 严格串行**；任何两批不并行编辑同档（同档并行须先按批序串行落定，后批基于前批末态）。R3b / R3c 另依赖 R2 核件（见下表）。

| 批 | 内容 | 文件面 | 判据 | 串行序 |
|---|---|---|---|---|
| **R1** | 核抽取（纯函数层）+ 双端加载管道 | 核包 `md/highlight/diff/lib/tool-summary/i18n`；VSC 依赖 / 反排除 / 断言 / 六档换 import；桌面依赖 / `protocol.mjs` 双根 / guard / `check-dist` | C1–C6 + VSC 全绿 | 先行（其余批全部依赖） |
| **R2** | 核抽取（会话流构件层）+ VSC 换接 | 核包 `flow/cards/subblocks`；VSC `ui.js` / `streaming.js` / `permission.js` / `question.js` / `panels.js` / `activity*.js` / `ledger-line.js` / `queued-mark.js` 换接 | C2（零回归——含映射差分锁）+ 核档用例 | R1 后；**与 R3a 可并行**（文件面不交叠：核包 / VSC ∥ 桌面）；先行于 R3b / R3c（核件依赖） |
| **R3a** | 桌面状态行（D17） | 桌面 `agent-bridge.mjs`（`onUsage` 回调——九键 ⇒ 十键）· `agent-host.mjs`（回合尾结算携 `tokens?` / `timers?`）· `IPC.md` `ev:usage` 载荷扩 · `events.mjs` 归约（turn 槽 / currentTool / 回合起刻 / timers）· `renderer/views/chrome.mjs` + 状态行族档（拟新增 · 档名实施批定）· `i18n.mjs` · 测试面 | D17 十五段逐行判据 | R1 后（与 R2 可并行）；**R3b / R3c 随后串行**（共享三档——见上条） |
| **R3b** | 桌面右列 = 子 agent 面（D20） | 桌面 `agent-bridge.mjs`（relay 分流 → `ev:subagent`；前缀剥除；**存活投影挂点**）· 宿主存活投影 + 2s 拍体（档名实施批定 ∥ 附 `agent-host.mjs`——起 / 停 / 清点）· `IPC.md` 新通道 + `subagent:stop` · `ipc.mjs` / `preload.cjs`（白名单 +1）· `events.mjs`（新切片 + 摘工具行）· `renderer/views/activity.mjs` 重写 · `mount-*` · 测试面 | D20 四判据（五类射程 / 零工具行 / 块态机 / 停止往返）+ **出生自愈**（丢首发出生 ⇒ 一拍内复现 · 终态零再断言） | R2 后（需核态机）+ **R3a 后**（共享三档串行） |
| **R3c** | 桌面会话流经核 + 会话面板（D19 / D18） | 桌面 `renderer/views/chat*.mjs` 换接核构件 · `agent-bridge.mjs`（`onReasoning` 回调——十键 ⇒ 十一键）· `events.mjs`（`ev:reasoning` 归约）· `IPC.md`（`ev:reasoning`）· `sessions.mjs`（行投影 + `activeProvider`）· `thincoder-desktop/renderer/views/sessions.mjs`（元数据族）· `styles`（核类名映射）· 测试面 | C7 + D18 / D19 | R2 后（需核构件）+ **R3b 后**（共享三档串行） |

## 9. 边界（不做）

- **CLI 不入核**：ANSI 面不同源（D17 = 语义对位）；CLI 代码本批零触碰。
- **核不持宿主句柄**：任何 `postMessage` / `invoke` / 主题变量 / 分发循环都不得进核（§1.2 四条）。
- **核不夺两端在册机制**：滚动 / 回填 / 窗口裁剪 / 状态行（各端判据面已在册——§4 行 13–15 / 22；核化候选另议，不在本轮）。
- **扩展端行为零回归**：VSC 侧接核 = 换实现不换行为（逐字文案锁 / 协议覆盖套件不动）。
- **桌面多标签结构不削**；桌面零框架纪律不变；提示词面与需求档零触碰（笔权在父侧）。
- **「同文重项 + 盘面零气泡」端差在册**（父侧 2026-09-27 裁「接受并登记为在册端差」；登记 = `docs/batches/2026-09-27-render-core-r2.md` §6.2）：
  Reload 冷启 / 清屏重推形（`items: ["x","x"]`）核 `queued-mark` 按 items 逐条建泡（2 泡），源档第二条经 `lastBubbleWithRaw` 文本查重复用首条（1 泡）——裁因 = 核与队列计数镜像自洽（源档 1 泡 = 查重副产物），C2 面无锁该形；核不为此改形（回「1 泡」口径 = 新需求另裁）。

## 10. 上抛与报告项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| A | **需求侧边界一例**：D19 列「文件链接」而需求 §5.1 把文件视图 / 打开列为暂缓 ⇒ 本设计裁「不承载」（KD-RC-5） | 需求与设计边界差（只报） | 父侧知悉；若需求侧要求承载 ⇒ 须先解暂缓边界（另裁） |
| B | **发布单元登记**：新包 `@thincoder/render-core` **不入发布序列**（永不发布——`private: true`；两端内嵌带发、零 registry 端消费者） | 记录面随动（父侧 / 发布轮） | 依据 = 用户 2026-09-27 22:00 裁定 + §2 KD-RC-1；发布档由父侧落笔 |
| C | **地图与架构档补行**：`docs/README.md` 地图 + `docs/core/design/ARCHITECTURE.md` 模块表补核包行 | 文档随动（父侧面为常例） | 随 R1 实施批（或父侧直接执行） |
| D | **退役批文件面核对**：R1–R3 开工前与 #108 在飞批核对（§8 前置） | 实施前置 | 实施批执行；冲突 ⇒ 串行 |
| E | **探针两件（实施批首跑）**：① VSC 真 webview 加载 `node_modules` 相对路径核模块（dev junction 形态下）② 桌面 `/rc/` 双根供给与逃逸门 | 实现面实证 | R1 首跑即测；任一失败 ⇒ 回本档改加载形（KD-RC-1 备选 = 物化后经 `localResourceRoots` 显式扩面） |
| F | **桌面「计时」段新鲜度窗**：读数 = 核 `_pendingTimers`（`thincoder-core/agent.mjs:84`）· 刷新点 = 回合尾（`ev:usage` 同点）⇒ 空闲期到期不即时刷新 | 设计登记 | 沿状态行目标读（不显倒计时）；若须更强新鲜度 ⇒ 另裁推送面 |

## 变更记录

- 2026-09-27（**R2 结算随动 · 设计面收正微轮 · eng-designer**——承 `docs/batches/2026-09-27-render-core-r2.md`）：
  §5 按实件回填（`relayEventToSubPatch(token, scope, deps?)` 三参签名 · `subBlocksReduce` / `ensureSubBlock` / `subBlocksFreezeAll` / 判据族 `channel.mjs`；token 表各行 patch 补 `role, id`）；
  构件族名按实件（`showToast` / `linkifyPaths` / `renderTaskPanel(progress, deps?) → {el, visible}` / `renderSubBlock(model)` 等）；relay 文法零依赖副本登记 + 跨包对拍锁（RM-3 / RM-4）。**零新语义**。
  §6 逐档行数按 R2 实读回填（三核档补「VSC 侧 = 2 行 shim」注）；§3 拆 8 行行锚按迁核后实读重锚（拆面现住核件）；§9 增「同文重项 + 盘面零气泡」端差登记行（父侧裁）；§1.3 / §4 两处 basename 锚全路径消歧。

- 2026-09-27（**文档布局收正轮**——用户裁定「目录要分开」· 模块镜像）：本档自 `docs/core/design/` 迁 `docs/render-core/design/`（新部分 `docs/render-core/` ↔ `thincoder-render-core/`）；引用面随迁 · 档头相关档标签收正；§5 `[model]` 行补 `syncLive` 端侧补注（端 registry 供给 · 核不可算）+ 存活投影变体行——设计评审轮 2 发现 N1。

- 2026-09-27：建档（批 `docs/batches/2026-09-27-desktop-ui-alignment.md` 设计轮）——核定性 / 落点 / 加载形 / 边界（§1）· KD-RC-1–7（§2）· 逐模块判定表 51 档（§3）· 逐机制对位表 22 行（§4）· 接口与样式契约（§5）· 三端受影响面（§6）· 判据 C1–C8（§7）· 分批 R1–R3c（§8）· 边界（§9）· 上抛六项（§10）。
- 2026-09-27（**设计评审轮 1 点修**——逐号）：§5 增 token → patch 全表 + `stopped` / `error` 两值裁定（先例兼容 · 有意收窄——错误径归宿实读在案）；§4 行 21 与 §8 R3b 补**出生自愈**（宿主存活投影 2s 再断言——文件面 + 判据）；
  §6 重写为逐档「现行 ⇒ 预期」（VSC 17 档 + 核包 + 桌面指针 §4.2——解指针悬空）；§8 串行序重排（R3a ⇒ R3b ⇒ R3c + 共享三档串行条）；§3 行 34 指针改指 `docs/desktop/design/UI.md` §1 项 4；§6 DOM 构件层用例宿主定形（消费端套件——保 C1 恒可过）；§7 C2 补映射差分锁。
- 2026-09-27（**R1 结算微轮**——设计面收正 · 逐条）：§1.3 发行面/先例坑句按实测收正（物化路线对 render-core 不可执行 ⇒ link 形 + `--follow-symlinks`）+ 内嵌面收窄规则（vsix 只携运行必需件；`.vscodeignore` 补排除行）；
  §1.3/§2 行锚按终态实读收正（`protocol.mjs` `:17` / `:22-29` / `:53-54` · `guard-closure.test.mjs:70` · `check-dist.mjs:18-24` · `check-vsix.mjs:56-63`）；
  §6 六档行补 R1 实施注（含 `diff.mjs:6` 逐字性唯一例外）· §5 `formatToolSummary` 签名收正（`text`）· KD-RC-1 收正「链接 / 物化 / 断言三纪律 + 永不发布」（§10 B 同裁改「不入发布序列」）。
