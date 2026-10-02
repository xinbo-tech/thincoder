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
3. **主题变量命名空间**——VSC `--vscode-*`（映射层 `webview/base.css:8-20`；直用：`chat.css` 14 行 / `controls.css` 10 行 / `status-bar.js:38` / `streaming.js:197`）；桌面自有变量（`thincoder-desktop/renderer/theme.css`）。
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
- **装载面分层（「对齐第二批」修复轮）**：桌面渲染档分两档（node-safe ∥ 浏览器专属）——档记 / 判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」条；本加载形面（`/rc/` 供给）受该条约束；违例 = 主进程装载崩 · 窗口永不出。
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
| KD-RC-5 | 桌面**文件链接承载**（核 `linkifyPaths` 消费 + 宿主验存链 ⇒ `file:open`；行定位 = 外部编辑器 CLI 探测） | 「对齐第三批」D19 收正（2026-09-29 端差清算 · #627 消解）：验存闸 = 核值（宿主 `extractFileLinks` 同源 + 核包裹 + `file:open`）——单源 = `docs/desktop/design/PROJECT.md` §2 **KD-39** | **落链接 + 无出口**（假控件）；**核删 linkify**（VSC 消费面在——核不夺）；**端侧自析路径**（无验存闸 ⇒ 假链接） |
| KD-RC-6 | 桌面**子 agent 面内容 chunk 四面分流 + 回显 tail-3**（KD-RC-6 收正——「对齐第二批」项 3） | 需求 §3.6「对齐」口径 + D4（内容回显 = 核件 tail-3 / 展开）+ D20 块形；四面 = text / think / 工具调用行 / 工具输出行（桥面出站 `ev:subchunk`——载荷 / 在场单源 = `docs/desktop/design/IPC.md` §1 该行）；现状漏 = 带 `role#id/` 前缀的内容 chunk **原样进主流**（`thincoder-desktop/src/main/agent-bridge.mjs:57-63` 只剥 `⟦ev⟧` 协议段，其余前缀不剥）⇒ 分流 = 修漏 + 定形 | **原样留主流**（前缀字面泄漏入对话流）；**剥前缀后并入主流正文**（子代理内容冒充主会话正文——三端语义分叉）；**改判（2026-09-28 · 对齐第二批）**：原否「照 VSC 回显 tail-3（违 D4 语义面）」⇒ 随 D4 句收正**改采**（单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3） |
| KD-RC-7 | 核**构件类名沿用被抽档现行名**（逐字搬迁纪律）；样式变量面 = 各端映射（桌面新增「核类名 → 桌面变量」样式档） | VSC 侧 CSS（`chat.css` / `controls.css`）与逐字文案锁按现行名成文 ⇒ 改名 = 全量机械重构、收益为零；桌面样式自有（`styles.css` 340 行） | **改命名空间 `rc-*`**（VSC 全量 CSS + 测试靶重构）；**核搬整套 CSS**（两端主题体系打架——KD-RC-7 即为此面裁定） |
| KD-RC-8 | **块级跟滚原语**（`initBlockFollow` / `maybeScrollBlock`）**入核**（2026-09-29）；**让位语义收正 + 出口钮自持 + 两半归属定死**（2026-09-29 · 批 `docs/batches/2026-09-29-subblock-follow-resume.md` · 用户裁定留端清算） | 纯 DOM 零调度依赖（先例 = 核 `paintReasoningTarget` 即写 `scrollTop`）；同一份十余行逻辑要求每端复刻 ⇒ 注定再漏（实证 = 台账 #518：桌面块内容区跟滚零接线）。**让位修复三律**：① 近底（gap < 24px）无条件翻真（自愈）② 远离底仅凭用户手势门（`wheel` / `touchmove` / `pointerdown` · 600ms）翻假 ③ 非手势位移（复位回波 / 程序写 / 布局）不改旗标；**键盘位移**（键盘滚动——无手势标记）同路（不改旗标）——可达性 unverified（需真机核）⇒ **残余登记**（消解路 = 真机核，可达 ⇒ 纳手势集另立小修；过期 = 真机核落地；登记落点 = `docs/desktop/design/UI.md` §1「本批注（块跟滚让位修复 · 2026-09-29）」项 5）；**出口钮** `sub-follow-btn` = 原语自持面（让位期 `open ∧ 非冻结 ∧ 可滚` ⇒ 可见；两态词键 `sub.follow.new` / `sub.follow.bottom`；点击 ⇒ 回底 + 复跟）——两端随核同收。**两半归属**：① **原语 ∕ 旗标语义 ∕ 出口钮 = 核**；② **应用时机契约 = 核**（应用点清单 = 本档 §5 单源：追加后 · 挂载后 · 帧尾复核——端只在宿主时刻按清单调用核应用器；端侧遗漏应用点 = **违约缺陷**，机检腿逐端在册；#518 四点 ∕ #603 帧尾 ∕ 归档径三漏即契约缺位所致）；③ **触发源 = 端**（桌面 = store 变更 ⇒ 调核帧合并件 `mark`；VSC 面本批零改——流式装配现走核 `createStreamRenderer`，改接 = 排后另议）——**帧合并 ∕ 更新纪律已收核**（rAF 属浏览器原生面——§1.2 定性内，先例 = `createStreamRenderer`；单源 = §2 **KD-RC-9**）；④ **滚动策略族 = 核抽核件**（块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流四载体：近底 < 24px 判据 ∕ 旗标门 `!== false` ⇒ 写 `scrollTop = MAX` ∕ 不夺阅读位 ∕ 清账三路——**2026-09-29 留端清算收正：判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件入核**（`thincoder-render-core/scroll.mjs`（拟新增·一处实现四件）——导出面 = 本档 §5「滚动策略族」）；端 = **工厂消费**（只留帧调用点 ∕ 计数呈现 ∕ 钮形——逐端置换零行为变更；③ 帧模型不收核——不破定性边界）；对拍腿升级 = **工厂单源 + 消费面断言**（判据漂移 = 缺陷；载体 = 批次本地机检件——单源 = `docs/desktop/design/PROJECT.md` §4.2 本批行「测试面 ∕ 探针面」）） | **端侧留端**（每端复刻——已证漏）；**端侧复刻**（桌面第二实现 + 双源漂移面）；**核持触发源（核订阅 ∕ 驱动宿主事件面）**（触发源属宿主——§1.2 四条；帧合并 ∕ 更新纪律收核后触发源仍留端——单源 = §2 KD-RC-9）；**让位单边翻真**（拖条让位丢失——下一帧夺回阅读位）；**事件溯源式非手势识别**（摘离标记 / MutationObserver——重机具 · 跨端不可移植）；**出口钮端侧各建**（双实现面）；**出口钮计数（↓ N 新行）**（行合并致 N 语义不闭合） |
| KD-RC-9 | **更新纪律收核**（2026-09-29 · 批 `docs/batches/2026-09-29-render-perf.md` · 台账 #609 · 用户报障 + 真机实锤）：核新增**帧合并件 `flow/frame.mjs`**（`createFrameMerge`——**脏标记 ∕ 帧合并 ∕ 应用器契约**；`FRAME_MIN_MS` = 50 · 单飞 rAF · `flush` 同步尾帧）+ **`appendToolOutput`**（O(1) 工具输出追加原语——自 VSC `chat-messages.js:77-96` 上提，VSC 改指零行为变更；桌面工具卡消费）。**应用器契约**：① 每键面每帧至多绘一次（增量更新为默认——尾块就地 ∕ O(1) 追加 ∕ 面内差分；整面重挂仅判据命中）② 布局节俭（禁逐 chunk 强制布局——读数仅帧内、按档裁剪）③ 帧尾动作（滚动 ∕ 钉底 ∕ gating）落面尾段、每帧至多一次 ④ 每 chunk 同步成本禁 ∝ 累计文本 ⑤ `apply` 抛错语义——脏集于调用前快照并清空（apply 内新 `mark` ⇒ 落下一帧；抛错帧不重试同脏集）· 异常不吞（直抛）· 单飞标记 `try/finally` 复位 ⇒ 帧链不断（抛错后后续 `mark` 照常起帧）。**触发源留端**（宿主事件 / store 变更 ⇒ `mark`）；`flush` = 顺序保真点（回底）+ 测试 ∕ 探针确定性 | 用户 13:45 报「桌面输出速度好慢」+ 13:48 斥「VSC 早就处理了的毛病又搞出来——渲染核干了啥」；真机计时实锤（`thincoder/.thincoder/tmp/perf-probe.mjs`：单块流式每 chunk 重挂成本随文本**线性增长** 10KB=0.9ms ∕ 40KB=4.5ms ∕ 80KB=5.9ms）；VSC 已付轮子 = rAF 节流（其 `CHANGELOG`「Stop 卡顿」——每 chunk 全文重渲 ∕ DOM 重建 ⇒ O(n²)）；桌面缺该层 ⇒ 触发源留端（KD-RC-8③ 收正）· 更新纪律收核 | **维持现状（每写即绘）**（成本 ∝ 文本长度——实锤在册）；**端各自优化（桌面自建节流）**（第二实现 = 双源漂移；VSC 已付轮子不复用 = 核「统更新纪律」落空）；**核持触发源（核订阅 ∕ 驱动）**（触发源属宿主——核不持宿主句柄，§1.2 四条）；**独立 frameEnd 槽**（跨面收尾消费者为零——死 API；帧尾纪律入应用器契约条③）；**帧界批内顺带做全文增量 md（真 O(1) DOM）**（该批射程外——增量 md 机制另立 = §2 **KD-RC-10**）；**核内两套帧件归一（`createStreamRenderer` ⇒ `createFrameMerge` 单件）**（不给由——两件分工：单目标流式缝合（VSC 流式档现行）∥ 多面脏键集合并（桌面六面）；VSC 改接 = 排后另议——本批零改；防第三份 = 新面须择两件之一复用） |
| KD-RC-10 | **增量 md 重渲**（2026-09-29 · 批 `docs/batches/2026-09-29-perf-residuals.md` · 台账 #619）：尾块流式文本面（`paintStreamTarget` ∕ `paintReasoningTarget` 消费面）由「每帧全量 `md()` + 整面 `innerHTML`」改 **冻结切点 + 热区换代**——新核件两档（实施拆档——单档 ≈538 超 500 硬限）：`thincoder-render-core/flow/live-scan.mjs`（**351 行**——`liveCut` 扫描器）+ `thincoder-render-core/flow/live-md.mjs`（**179 行**——`paintLiveMd` 画件；`liveCut` 经其再出口保签名——两端调用点零改）。**三段定界**：① **md 渲染段** = 冻结前缀零重渲——单帧渲染量 = 冻结增量 + 热区跨度（禁 ∝ 累计文本）② **DOM 写面段** = 已冻结节点零触碰——提交段追加 + 热区节点换代（禁整面 `innerHTML`）③ **样式重算段** = 失效面 ∝ 热区——冻结节点身份不变（引擎无失效理由）。**增量单元 = 段落 ∕ 块**：段内（paragraph）按行内构造封闭点冻结；列表 ∕ 表格 ∕ 引用 ∕ 围栏 = 块级单元（块闭才冻结，开启块 = 块级热区）。**保守律**：无法证明已冻结者一律留热区（尾段换行串 ∕ 悬空构造 ∕ 行首块标记未定型 ∕ 尾转义 ∕ 尾 `*` 串）；热区跨度上界 = 最近未闭构造跨度（病态：长未闭构造期间帧成本退全量 md 同阶——登记）。**画件契约**：无缓存 ∕ 复位径 = **分片全绘**（head ∕ 开段 ∕ 热区三段——与 `md(raw)` 分片恒等）；增帧 = 提交段追加（段内 `mdInline` 语境 ∕ 块级 `md` 语境）+ 热区换代；非前缀扩展（编辑 ∕ 回放 ∕ 换文）∕ 热区失连 ⇒ 复位全绘；异常 ⇒ `textContent = raw`（现状语义）**+ 复位**（内部冻结态清空——冻结切点 ∕ 已挂节点账弃；下一帧增径起点 = 分片全绘径）。**语义机检** = 分片恒等式（语料）+ 真 DOM 逐步对拍（增量面 ≡ 全量参照） | 用户报障尾账（#609 层消后残留）：真机实测 80KB 帧 p95 = **15.4ms**（基线段）∕ **31.8ms**（密文段 = markdown 密度 ≈2× 变体），根因 = 全量 md 重渲 + 活 `innerHTML` 整面替换（诊断分解：`innerHTML` ≈5–6ms + `md` ≈1.5ms + 样式重算 ∕ 帧尾扫描 ≈2–4ms）；探针负载 = 单段 80KB（无空行）⇒ 块级冻结零收益、段内冻结为必需形 | **整面重挂保底（维持全量 md）**（8ms 预算不达——在册读数；16ms 收正 = 过渡基线）；**整段级冻结（仅按 `\n\n` 分段）**（探针负载 = 单段无空行 ⇒ 零收益）；**DOM diff（文本节点级 patch）**（构造开闭改节点树——diff 面不可界 + 重机具）；**固定字数滑窗热区**（非保守——未证区被冻结，正确性不可保）；**md 移 worker**（DOM 写必在主线程——帧内成本不消 + 顺序保真面）；**md 引擎重写（流式 tokenizer）**（双源——`md.mjs` 单源不动）；**段内虚拟化**（滚动 ∕ 选区 ∕ 复制面破——窗口 200 已界） |
| KD-RC-11 | **续写支文本节点合并（`appendAdvisorChunk` 两处）**（2026-09-30 · 批 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.13 · 台账 #694）：文本 ∕ 推理续写支（`:63-66`）与 toolOutput 续行支（`:47-49`）由逐 chunk `createTextNode` + `appendChild`（永不合并）改**并入末文本节点**——末子为文本节点 ⇒ `appendData(str)`（原地并写）；末子非文本节点 ⇒ 维持新建（兜底）；首行 `textContent = str` 不动。**语义等价**：RAW 拼接逐字同（`textContent` 读出恒等）· **零视觉差**（节点边界不参与布局 ∕ 样式；`tailLines` ∕ 行合并判据 ∕ 复制等消费面全按读出串工作）· 消费面（`renderSubagentChunk` 调用侧）零改 | 实测命中：冻结窗 DOM 文本节点 **102,179** ∕ 元素 3,014——`DIV.advisor-text.advisor-think` 族 ≥12 个、单 div 直属文本子节点至 **16,272**（逐 chunk 建节点 ⇒ 节点洪峰 ≈95K+）；文本节点 ∕ 行 O(chunks) ⇒ **O(1)**；承载面遍历成本随节点数增长的冻结签名（四案在册）——E2「钉点命中才动」分支兑现（批档 §1.3c） | **维持逐 chunk 建节点**（实测命中在册——节点洪峰 ≈95K+）；**`textContent += str` 全量重写**（O(n) 串重写 + 整节点替换——非 O(1) 并写） |
| KD-RC-12 | **斜径机制入核 · 命令表归端**（2026-10-01 · 批 `docs/batches/2026-10-01-desktop-slash-commands.md` · 台账 #761）：核增纯函数档 `thincoder-render-core/composer/slash.mjs`（拟新增）——`parseSlash(text)` ∥ `routeSlash(text, commands)`（判据 = trim 后首字符 `/`、首 token 小写、别名解析；条目形 = `{ name, aliases?, rejectKey?, run(ctx) → boolean }`）；输入面板缝 = `deps.slash = { commands, actions }`（**可选——不传 ⇒ 现行为零变**）；命中 ⇒ 本地执行、**不进消息径**（**零消息径上行**——零 `msg:send` ∥ `queuedUserMessage`、零用户块、零 loading；**模式三钮动作照走 `session:flags`——同钮径不变**）；`run` 返真 = **已受理**（已执行 ∨ 二段交互在场——`/auto` 确认 popover 径同判）⇒ 清框 + 入历史 ∥ 返假 = 未受理（门拒）⇒ 文本保留（+ 条目 `rejectKey` 反馈）；未知 ⇒ toast `slash.unknown <name>`（键 ↔ 发射点单表 = §5 条 6）。**动作句柄面** `actions = { openModelMenu, toggleAuto, togglePlan, toggleEng }` = 钮 handler 提取的同一函数（**同钮同门**——单一实现；键形 ∥ 落点 = §5 条 6）；反馈三键（`slash.unknown` ∥ `slash.busy` ∥ `slash.args`）经端注册面供给（先例 = `input.slotFull`）。**（`/help` 增量 · 同批 2026-10-01②）**`/help` = **流内打印形**（对位 CLI `cmd-help` 实盘：标签 ∥ 组序 ∥ `名字 (别名)` ∥ 描述逐行）；核增 `formatHelp(commands, t)`（表→行集 · 纯函数）∥ `/help` 打印口 = **端侧表构造期闭包注入**（`createSlashCommands(printHelp)`——`deps.slash` 与 `ctx` 零改，见 §5 条 6）；`/h` 别名在册；未知反馈携 `/help` 指引。**被否**：浮层 ∥ toast 主体 ∥ 交互式列表。**边界**：键位补全 = 不做；其余 22 条 CLI 命令 = 另批 ∥ 不做（逐条处置 = 批档 §2.4）；VSC 零接缝（不传 `deps.slash`）。 | 用户 2026-10-01 走查（桌面敲 `/model` 无反应；「要啊」+「开批」）；复用优先核查 = 全树无既有斜杠机制（CLI 表 = CLI 自持 ∥ 核 `queued.mjs` 只做队列分类 ∥ VSC 无面）⇒ 新建机制落共享层 · 命令表归端 | **桌面自持**（面板提交面不可缝 ⇒ 唯有 post 层拦截——与面板状态机打架）；**CLI 表直引**（Node 侧 ∥ 渲染面静态闭包禁令）；**核持命令表**（端动作面不可入核——§1.2 四条）；**「未实装」二级反馈全表**（状态面随分期漂移 ∥ 维护面 > 收益） |

## 3. 核边界 · 逐模块判定表（VSC webview 51 档 · 单源）

三值判定：**核**（整体入核：零宿主特权仍可运行）· **拆**（纯迁移 / 呈构件入核 + 出站 / 句柄 / 分发留端注入）· **端**（留适配层：端协议 / 端结构 / 端能力）。
依据 = 勘察实读行号（宿主三张：A = `state.js` import · B = 直用 `postMessage` · C = `--vscode-*` 直用）。

| # | 档 | 判定 | 依据 / 说明 |
|---|---|---|---|
| 1 | `activity-diag.js` | 端 | 诊断留痕上行（`:81` 上行 `panelDiag`）——端观测面（**痕迹族 = 端观测面 ⇒ 桌面不接——无诊断上行面；缺省 no-op ⇒ 零行为差异（给由）**；2026-09-29 留端清算） |
| 2 | `activity-new.js` | 端 | 活动区计数钮（`:21` / `:33`）；桌面**同面补装**（R10 落——`thincoder-desktop/renderer/views/activity-new.mjs`（实读 **100**）；未跟底计新生 ∕ 点钮回底清账——单源 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md` §2.8 R10） |
| 3 | `activity-view.js` | **核** | 块头 / 状态词 / 尾 3 行 / ⏹ 控件（`:118` `refreshBlock` · `:152` · `:184`）——零 A / B / C |
| 4 | `activity.js` | **拆** | 块态机（出生 `thincoder-render-core/subblocks/state.mjs:103` / 接管 `:124` / 冻结 `:47` / 归档 `:93` 的**迁移判据**）入核；出生位 / 归档入流的 DOM 编排留端（`thincoder-vscode/webview/activity.js:48` / `:104`）；**块级跟滚原语入核**（`thincoder-render-core/subblocks/block.mjs` `initBlockFollow` / `maybeScrollBlock`——2026-09-29 提核；**应用时机契约在核 ∕ 触发源在端**（帧合并 ∕ 更新纪律收核——2026-09-29 收正）——单源 = §2 KD-RC-8 ∕ KD-RC-9） |
| 5 | `autocomplete.js` | 端 | 输入面端能力（`@` 补全 / 粘贴上传） |
| 6 | `base.css` | 端 | 宿主变量映射层（`:8-20`）；核契约 = KD-RC-7 |
| 7 | `chat-messages.js` | 端 | 52-case 分发 = 端协议（`:48` 唯一监听点） |
| 8 | `chat-status.js` | 端 | 压缩 / digest 状态文案（核机制钩子面）；**桌面消化状态行同判**（端侧自持——词键直取核字典 ⇒ 值同源；单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」） |
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
| 23 | `mode-buttons.js` | 端 | 端模式钮（桌面端面自持——**模式钮住输入区控件行（写路 `session:flags`）∥ 四态呈现 = 状态行行首 banner 四段**；撤会话头批（2026-09-29）后收正） |
| 24 | `model-menu.js` | 端 | 端选择器（内联 CSS 用宿主变量 `:40-69`） |
| 25 | `model-picker.js` | 端 | 端模型钮 + 推理下拉（`:13` / `:40-68`） |
| 26 | `onboarding.js` | 端 | 端引导（桌面首启向导自持） |
| 27 | `panels.js` | **拆** | 任务 / 目标面板**构树 + 显隐判据**入核（`thincoder-render-core/cards/panel.mjs:17` / `:26` / `:67` / `:74`）；挂起 / 回合态 / 目标消息分流留端（`thincoder-vscode/webview/panels.js:81` / `:108` / `:118`） |
| 28 | `permission.js` | **拆** | 审批卡面构树入核（`thincoder-render-core/cards/permission.mjs:60` / `:105`）；`postMessage` 三出口留端注入（`thincoder-vscode/webview/permission.js:15-19`） |
| 29 | `question.js` | **拆** | 提问卡面构树入核（`thincoder-render-core/cards/question.mjs:13`）；出站留端（`thincoder-vscode/webview/question.js:15-18`） |
| 30 | `queued-mark.js` | **拆** | 待发送标记口径 / 防悬空纯逻辑入核（`thincoder-render-core/flow/queued-mark.mjs:39` / `:47` / `:74`）；DOM 与快照来源留端（`thincoder-vscode/webview/queued-mark.js:26-39`） |
| 31 | `scroll.js` | 端 | 回底钮与可见性（`:13-20`） |
| 32 | `search.js` | **拆** | 会话内搜索（Ctrl+F）——实现整件入核（`thincoder-render-core/search.mjs` `createSearch`——R6 上提 · `docs/batches/2026-09-28-desktop-feature-parity.md`）；端壳留 `root` 绑定（VSC `ctx.messagesEl` ∕ 桌面 `[data-slot="flow"]`）——键位注册随核件工厂（两端同件单源 = `docs/desktop/design/UI.md` §1 交互行） |
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

**计数（D3）**：51 档 = **核 9**（`activity-view` · `diff` · `highlight` · `i18n` · `lib` · `md` · `toast` · `tool-card-restore.mjs` · `tool-summary`）· **拆 9**（`activity` · `ledger-line` · `panels` · `permission` · `question` · `queued-mark` · `search` · `streaming` · `ui`）· **端 33**。
**静置面（本轮不改动）**：`activity-new.js` / `activity-diag.js` / `autocomplete.js` 三档在本轮核化射程外（端差或后议）。

## 4. 逐机制对位表（22 机制 × 桌面 · 单源）

口径：机制清单 = VSC webview 会话流呈现机制归并（勘察逐档清点）——**22 行**；列 4 = 桌面接核判定四值：
**自然成立**（接核即有 · 无桌面增量）· **需补面**（桌面侧须补入站 / 归约 / 形态）· **显式裁**（有意不承载或口径改判——须登记理由与被否）· **改判**（原判定随「对齐」口径收正——行 16，2026-09-28）。

| # | 机制 | VSC 承载（file:line） | 核承载件 | 桌面接核判定 |
|---|---|---|---|---|
| 1 | Markdown 渲染（含转义闸） | `md.js:67` / `:106` / `:146` | `md.mjs` | **显式裁（改判）**：桌面由 `pre-wrap` 纯文本改为经核 Markdown——KD-RC-4 |
| 2 | 语法高亮 | `highlight.mjs:165`（R1 迁核） | `highlight.mjs` | **自然成立**（随 md；代码块面由核给 `<pre class="code-block">`） |
| 3 | 流式增量渲染（rAF 降频缝合） | `streaming.js:36-79` / `:112` | 核缝合件 | **需补面**（核件分件消费 · 桌面外壳留存）：帧尾就地重渲经核 `paintStreamTarget`；**推理面经核 `paintReasoningTarget`**（专用画笔 = 通用画笔 + `scrollTop = scrollHeight` 钉底——「对齐第二批」项 1；不接则思考块不跟底）；流式档位分派 / 落位留桌面（`renderer/events.mjs` `onToken` + `thincoder-desktop/renderer/views/chat-stream.mjs`）；**更新纪律已收核**（2026-09-29——帧合并件 `flow/frame.mjs` 桌面接装：触发源 = store 变更 ⇒ `mark`；单源 = §2 **KD-RC-9**） |
| 4 | 推理块（think） | `streaming.js:81-107` | 核推理块构件 | **需补面**：核回调 `onReasoning`（`thincoder-core/agent.mjs:273`）未接——桌面 `agent-bridge.mjs` 补回调（现九键）+ 新通道 + 归约块型（块型 `reasoning` 已在桌面五型内） |
| 5 | 帧 / 块容器（回合块与 idx） | `ui.js:176-189` | 核块容器构件 | **需补面**（核件分件消费 · 桌面外壳留存）：块容器 = 桌面描述符树留存（三锚 `data-block-kind` / `data-block-id` / `data-seg` 不动）；文本面 / 推理内容经核 `md`——否「整件替换核 DOM」 |
| 6 | 工具卡面 | `ui.js:203` / `:281` / `:329` | 核工具卡构件 | **需补面**（核件分件消费 · 桌面外壳留存）：工具结果面经核 `capText`（渲染单源）；卡壳四段头 / 折叠 / 耗时 / 改动摘要留存（`thincoder-desktop/renderer/views/chat-tool.mjs`）；`formatToolSummary` / `isToolFailure` **不消费**（非缺口——卡面单源 = `docs/desktop/design/UI.md:25`「四段头 + 改动摘要」· 成败判据单源 = `docs/desktop/design/IPC.md:40` 载荷 `ok`） |
| 7 | 工具摘要单源 | `tool-summary.js:35` | `tool-summary.mjs` | **显式裁（不消费 · 非缺口）**：桌面摘要住**主进程**（`thincoder-desktop/src/main/agent-bridge.mjs` `summarizeArgs`）——核 `formatToolSummary` 不消费（登记句 = 本表行 6） |
| 8 | 工具输出增量（含 64K 截断） | `chat-messages.js:70-89` · `lib.js:27` | 核截断 + 呈现件 | **自然成立**（桌面 `ev:tool-output` 通道 + `events.mjs:125-135` 累积已在；截断口径随核） |
| 9 | 工具结果收尾（成败 / 耗时 / 折叠） | `ui.js:318-326` · `lib.js:73` / `:94` | 核判据 + 卡面 | **自然成立**（桌面 `events.mjs:140-156` 收尾 + `durationMs` 已在；成败判据单源 = `docs/desktop/design/IPC.md:40` 载荷 `ok`——核 `isToolFailure` 不消费 · 登记句 = 本表行 6） |
| 10 | 行级 diff（审批预览） | `diff.js:13` / `:90` | `diff.mjs` | **显式裁（不消费）**：桌面审批卡无 `changes` 预览面且需求 §3.1:50 明写「不做 diff」——核含、桌面不消费 |
| 11 | 代码块复制 | `streaming.js:218-231` | 核复制控件 | **需补面**：桌面现只有块级 / 末条复制（KD-22）⇒ 真代码块复制随核落（§10 Y 消解） |
| 12 | 文件链接 | `ui.js:247` · `chat.js:71-79` | 核 linkify | **承载（「对齐第三批」D19 收正 · 2026-09-29 落）**：验存链 + 核包裹 + `file:open`（行定位 = 编辑器 CLI 探测）——单源 = `docs/desktop/design/PROJECT.md` §2 **KD-39**；核侧 `linkify` 消费面在 |
| 13 | 消息窗口裁剪 | `ui.js:446-454`（150 块） | 不入核 | **已消（对齐 · 2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）**：VSC `MAX_MESSAGE_BLOCKS`（`ui.js:204`）= 150（DOM 裁帽 · 滚动上取回填）∥ 桌面 `MAX_RENDER_BLOCKS`（`chat-scroll.mjs:25`）= **150**（原 200 ⇒ 150——方向裁 = 批 §4 建议㈠，已落；回填链已在）；#607「非同判据」判定经复核改记（差为机制性：>150 块会话可见）——**两端窗值对齐、端差零残留**；核不夺 |
| 14 | 懒历史回填 | `history.js:43-88` | 不入核 | **显式裁（各自）**：桌面回填 / 补偿算式已在册（`RENDERER.md` §3）；核化候选另议（§9） |
| 15 | 跟滚 / 回底 | `ui.js:426-468` · `scroll.js:13-20` | 不入核 | **显式裁（各自）**：桌面跟滚 / 药丸已在册（`RENDERER.md` §3 判据面） |
| 16 | 队列标记（待发送） | `queued-mark.js:29` / `:63` | 核标记逻辑 | **改判（对齐第二批）**：桌面**接核标记原语**（`markPending` / `paintLabel`——标记类与标签两形态字面单源）+ **队列按会话分键**（`pending: { [会话键]: [{ text, ts }] }`）⇒ **输入区上方待发送带（非流内）**（单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 2）；`planBusyQueued` / `clearPending` 不消费（宿主快照对账面 = VSC 专有 ∥ 桌面交接 = 节点换代——登记 = §9「对齐第二批」②） |
| 17 | 忙态门 / 载入态 | `loading.js:86` / `:67` | 不入核 | **自然成立**（桌面忙态 = 位标 `running` + 输入区判据已在） |
| 18 | 审批卡 | `permission.js:21` / `:86` | 核卡面 | **按 ② 同判（卡族外壳留存）**：桌面 `thincoder-desktop/renderer/views/approval.mjs` 自持卡面（三出口 / 批形已在）；不迁核卡面件（VSC 形态——与桌面锚系 / 用例相抵） |
| 19 | 提问卡 | `question.js:10` / `:59-76` | 核卡面 | **按 ② 同判（卡族外壳留存）**：桌面 `thincoder-desktop/renderer/views/question.mjs` 自持卡面（两作答路已在）；不迁核卡面件 |
| 20 | 计划 / 任务面板 | `panels.js:16` / `:39` | 核面板构树 | **按 ② 同判（面板外壳留存）**：桌面计划卡（`thincoder-desktop/renderer/views/plan.mjs`）自持构树；不迁核面板件；搜索（`search.js`）**桌面已承载**——核件 `createSearch` 直取（端壳 = `thincoder-desktop/renderer/search.mjs`——R6 落） |
| 21 | 子代理活动区（live 面板） | `activity.js` · `activity-view.js` | 核块态机 + 块面 | **需补面**：桌面右列重定位为子 agent 面板（D20——通道 / 归约 / 形态三面 + **出生自愈**：宿主存活投影 2s 再断言（拍体沿 `thincoder-vscode/src/extension/panel-messages.mjs:42-74` 语义——只发在飞实例）；见 `docs/desktop/design/IPC.md` §1）；**块面直消费（对齐第二批）**：`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` / `renderSubDesc`（内容回显 = tail-3 / 展开）+ **归档入流**（终态 ⇒ 流内尾追块；表项墓碑 `region: "flow"`；核 effects 表不逐条执行——端面动作由模型态幂等派生）；单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3 / 5 |
| 22 | 状态栏 / 状态行 | `status-bar.js:13` | 不入核 | **显式裁**：桌面状态行**对齐 CLI**（D17）而非共用 VSC 状态栏——15 段逐项裁定表住 `docs/desktop/design/UI.md` §1 本批注 |

**计数（D3）**：22 行 = 自然成立 **4**（行 2 / 8 / 9 / 17）· 需补面 **9**（行 3 / 4 / 5 / 6 / 11 / 18 / 19 / 20 / 21）· 显式裁 **8**（行 1 / 7 / 10 / 12 / 13 / 14 / 15 / 22）· 改判 **1**（行 16）。

**「显式裁（各自）· 核不夺」口径限定（2026-09-29 · 与 KD-RC-8 ④ 关系随拍 · 同日留端清算收正）**：核不夺 = **实现载体**不夺（行 13 ∕ 行 14 实现各端自持）；**滚动策略族四载体**（块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流）：族实现 = **核抽核件**（`thincoder-render-core/scroll.mjs`（拟新增）——判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件一处实现；端 = 工厂消费——帧调用点 ∕ 计数呈现 ∕ 钮形；零行为变更）；
  行 15（跟滚 / 回底——对话流载体）随族同源；行 13（窗裁）∕ 行 14（回填）非族成员（判据各端自持）。

## 5. 接口契约（核导出面 · 端注入面 · 样式契约）

**核导出面（五族）**：

1. **纯函数族**——`md(text)` / `mdInline(text)` / `esc(s)` / `highlight(code, lang)` / `lineDiff(a, b)` / `renderDiff(...)` / `formatToolSummary(name, text)` / `t(key, vars)` / `setStrings(dict)`；
   `lib` 各纯函数（`tailTruncate` / `capText` / `fmtK` / `fmtTime` / `patchLineType` / `toolFailureStatus` / `isToolFailure`）。
2. **状态机族**——`relayEventToSubPatch(token, scope, deps?) → patch | null`（**映射单源**：VSC 扩展侧 / 桌面主进程两端共用；`scope` = `createRelayScope()` 实例，**必给**——缺 scope fail-closed 报错，不静默降级）；
   `relaySubContentChunk(face, a, b) → chunk | null`（**内容 chunk 构形单源**——B7 2a 落：前缀剥除 ∕ 四面 gate（`text` ∕ `think` ∕ `toolCall` ∕ `toolOutput`；非四面 ∕ 无前缀同口 `null`）全在本件；`chunk` 不携频道键 `ch`——宿主由 `role`+`id` 重导；宿主副作用（`noteContentFirst` ∕ `emitToolPanel`）留端）；
   `subBlocksReduce(list, patch, deps?) → { list, effects }`（出生 / 终态折叠 / 归档三态机；`effects` = DOM 效果表——端按序执行）+ `ensureSubBlock(list, key, deps?)`（内容 chunk 出生闸）+ `subBlocksFreezeAll(list, deps?)`（会话退出兜底）；判据族（键文法 / 终态 kind / 补桩表 / 补桩前置）= `channel.mjs`。
   先例 = VSC 自持表（`thincoder-vscode/src/extension/panel-subagent-relay.mjs`——**B7 2a 换接 rc 单源后已删**：现盘该档只余转口壳 ⇒ **VSC 差分 = 零**；下表「先例」列行号 = 搬迁时采样，不解析现盘）。**token → patch 全表（单源 · 本表）**：

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
**跨包对拍锁** = `docs/batches/2026-09-29-parity-b7-minor.test.mjs`（F2——文法副本漂移锁 ∕ RM-4 复建：`relayPathOf` ∕ `RELAY_PREFIX_RE` ∥ 权威 `thincoder-core/agent/relay-prefix.mjs` 逐字对；F4——CLI `routeSubToken` ∥ rc `relayEventToSubPatch` 语义同判）；
  旧件 `thincoder-vscode/test/render-core-relay-map.test.mjs`（RM-3 ∕ RM-4）已随 B7 退场。

**落位不变式（两条 · 2026-09-29 留端清算）**：① **出生位 = 活动区区尾 append**（端实现锚 = VSC `thincoder-vscode/webview/activity.js:60`；桌面 `thincoder-desktop/renderer/views/pool-subagents.mjs:85-95`）；
  ② **归档入流 = 消费轮边界前插入、边界失效 ⇒ 常规块插入点退化**（VSC `thincoder-vscode/webview/activity.js:104-110`；桌面 = 同形——`insertBefore(块, 边界)`：边界 = `ev:digest start` 标签行、收帧清边界；座次入模；三端消化面统一批 · #747——单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）——与核效果表 `archive`（`atBoundary`）同口径。

3. **构件族（DOM）**——`renderBlock({ idx, withLabel })` · `renderToolCard({…})` / `finishToolCard(ref, name, text, links, truncated, deps?)` / `renderToolHistory(name, text, idx)` · `renderReasoning(model, deps?)`；
   `renderApprovalCard(model, deps?)` / `renderBatchApprovalCard(model, deps?)` · `renderQuestionCard(model, deps?)` · `renderTaskPanel(progress, deps?) → { el, visible }` / `renderGoalPanel(goal, deps?)` ·
   `renderSubBlock(model)` / `refreshBlock(block)` / `renderSubagentChunk` / `renderSubDesc`（子 agent 块面与归档块面——消费面段 ③）；
   `initBlockFollow(block)` / `maybeScrollBlock(block)`（块内容区跟滚原语——接线 ∕ 应用；旗标 = 手势门控让位 + 无条件近底自愈，让位期出口钮 `sub-follow-btn` 随原语自持（`sub.follow.*` 两键）；**应用时机契约在核（应用点清单：追加后 · 挂载后 · 帧尾复核）∕ 触发源在端**（帧合并 ∕ 更新纪律收核——2026-09-29）——单源 = §2 KD-RC-8 ∕ KD-RC-9）；
   `attachCopyButtons(container, deps?)` · `showToast(text)` · `linkifyPaths(bodyEl, links)`（VSC 消费） · `createSearch({ root })`（会话内搜索面——Ctrl+F 键位注册 + 扫描 ∕ 高亮；两端端壳供 `root`） · `appendToolOutput(el, text, deps?)`（**工具输出 O(1) 追加**——
  占位清（`deps.initial`）∕ 超 `MAX_TOOL_OUTPUT` 截断（注字面 = `capText` 缺省注单源）∕ `_capped` 停收；VSC 活卡消费改指 ∕ 桌面工具卡消费——2026-09-29）。

4. **调度族（更新纪律 · 2026-09-29 · KD-RC-9）**——`createFrameMerge(deps)`（**帧合并件**：脏标记 `mark(keys)` ∕ 单飞 rAF ∕ `FRAME_MIN_MS`(50) 最小间隔 ∕ `flush()` 同步尾帧；`deps = { apply(dirtyKeys), raf?, now?, minMs? }`——应用器契约 = §2 KD-RC-9）· `FRAME_MIN_MS`（常量——与核 `STREAM_RENDER_MIN_MS` 同值同意）；
   ＋ **增量 md 画件（2026-09-29 · §2 KD-RC-10）**——`liveCut(raw, from = 0) → { cut, blockStart, inline }`（**冻结切点扫描器**——纯件；保守判定：段内构造封闭点 ∕ 块闭点；无法证明者留热区）· `paintLiveMd(el, raw)`（**分片画件**——冻结段提交 ∕ 热区换代 ∕ 兜底复位；`paintStreamTarget` ∕ `paintReasoningTarget` 同签名改走本件——VSC ∕ 桌面调用点零改）。
   **实施落形 = 两档（实读 2026-09-29）**：扫描器 `liveCut` 住 `thincoder-render-core/flow/live-scan.mjs`（**351 行**）· 画件 `paintLiveMd` 住 `thincoder-render-core/flow/live-md.mjs`（**179 行**——`liveCut` 经本档再出口，签名不变）。

5. **滚动策略族（`thincoder-render-core/scroll.mjs`（拟新增）· 2026-09-29 · KD-RC-8 ④ 收正——留端清算 ∕ 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md`）**——`NEAR_BOTTOM_PX`（= 24 · **唯一数值源**；`thincoder-render-core/subblocks/block.mjs` ∕ `views/chat-scroll.mjs` 改再出口保名）；
   `nearBottom(el)`（三读数归一 + 严格小于——判据逐字同式）· `applyPin(el, gate)`（旗标门 `!== false` ⇒ 写 `scrollTop = MAX`——超值不读 `scrollHeight`；写口单源）；
   `createPinWatch(el, { holder = el, flagKey, gestureGateMs, onNearBottom, onGesture }) → { read, set, attach, detach }`（**旗标维护单源 = `holder[flagKey]`**——近底 ⇒ 无条件翻真（自愈）＋ `onNearBottom`；远离底 ⇒ `gestureGateMs` 内手势翻假（块 = 600）∥ `gestureGateMs = 0` ⇒ 滚动事件按近底直写——活动区 ∕ 池列 ∕ 对话流现行语义 · 零行为变更）；
   `createUnreadCounter(el, { countKey })`（计数簿记 `bump` ∕ `clear` ∕ `read`——清账三路：钮点击 ∕ 近底 ∕ 换代）；
   端消费 = 帧调用点 ∕ 计数呈现 ∕ 钮形（逐端置换零行为变更）——核 `thincoder-render-core/subblocks/block.mjs` 改薄包 ∕ VSC `thincoder-vscode/webview/ui.js` 四函数（旗标宿主 `ctx`）· 桌面 `views/activity-new.mjs` ∕ `views/chat-scroll.mjs`。

6. **输入面板族（`composer/`——2026-09-28 输入面板上提批落核；本档 2026-10-01 补登）**——`createComposerPanel(deps)`（输入行 ∥ 键位 ∥ 提交面 ∥ 忙态派生；
   注入面六项 = `root` ∥ `post` ∥ `state` ∥ 取词注册面 ∥ `hooks` ∥ `slash`——逐项面单源 = `thincoder-render-core/composer/panel.mjs` 档头）· `createModelMenu(deps)`（`openModelMenu({…})` ∥ `closeModelMenu()` 模块级导出同源）·
   `createControlsRow({…})` · `createAtMenu({…})` · `createAttachBar({…})`；消费面 = VSC `thincoder-vscode/webview/input.js` 等接线档 ∥ 桌面 `thincoder-desktop/renderer/mount-composer.mjs` 装配。
   **斜径面（2026-10-01 · §2 KD-RC-12 · 批 `docs/batches/2026-10-01-desktop-slash-commands.md`）**：`thincoder-render-core/composer/slash.mjs`（拟新增）——`parseSlash(text) → { name, args } | null` ∥
   `routeSlash(text, commands) → { kind:"command", cmd, args } ∥ { kind:"unknown", name } ∥ null` ∥ **`formatHelp(commands, t) → { kind:"label"|"group"|"cmd", text }[]`**（表→行集——标签 ∥ 组头（CLI 同序；组缺者与无组条目跳过）∥ 命令行 `名字 (别名)  描述`；`/help` 增量（2026-10-01②）用——纯函数，`t` 参数注入）。
   **`deps.slash` 完整键形（可选——不传 ⇒ 现行为零变）**：`deps.slash = { commands }`（**打印口不在 deps 键内**）——`commands` = 命令表（条目形 `{ name, aliases?, group?, descKey?, rejectKey?, run(ctx) → boolean }`；端侧构造，落点 = `thincoder-desktop/renderer/slash-commands.mjs`；
  `group` ∥ `descKey` = `/help` 增量（2026-10-01②）增面）；**`/help` 打印口 = 端侧表构造期闭包注入**（`createSlashCommands(printHelp)`——行文 = 端表本体经核 `formatHelp`；返 boolean——`true` = 已打印；`ctx` 零改——下拦截段句）；
   `actions` = 动作句柄表 `{ openModelMenu, toggleAuto, togglePlan, toggleEng }`（各 = 钮 handler 提取的同一函数——门随函数；落点 = `composer/model-menu.mjs` ∥ `composer/controls.mjs` 导出面；**装配 = 面板从两工厂实例导出面取**（`createModelMenu` ∥ `createControlsRow` 返回面——同函数性只能在实例处成立）；
  端侧注入 = `{ commands }`（`thincoder-desktop/renderer/mount-composer.mjs`——打印口 = 表构造期闭包））。
   **`send()` 拦截段**（「空文本 → 无会话守卫」后、「忙态入队」前）：`routeSlash` ⇒ 未知 ⇒ `showToast(t("slash.unknown", { name }))` + 文本保留；命中 ⇒ `cmd.run({ args, raw, post, actions })`（`/help` 条经闭包打印口——`printHelp?.() === true` 可选链）——**`run` 返值**：返真 = **已受理**（已执行 ∨ 二段交互在场——
  `/auto` 确认 popover 径同判：popover 在场 = 提交面职责已完成、文本使命已尽）⇒ 清框 + 入历史；返假 = 未受理（门拒）⇒ 文本保留 + （条目 `rejectKey` 在场 ⇒ `showToast(t(rejectKey))`）。
   **反馈键发射点（一行表）**：`slash.unknown` = 面板层（route 未知径——**值携 `/help` 指引**（CLI `thincoder-cli/src/tui/slash-commands.mjs:130` 前段逐字；`/help` 增量收正））· `slash.args` = **run 前门**（`cmd.run` 调用前——`args` 非空通用拒；本批在册命令均不收参）· `slash.busy` = 面板层（`run` 返假径——条目 `rejectKey` 声明；
  判据（忙态门）= 钮 handler 提取函数内置——同钮同门）；同类 = `/plan` ENG 态拒 ⇒ `rejectKey = toolbar.planDisabled`（复用既有键）。`run` 本体只调 `ctx.actions`（`/help` 条经闭包打印口——零第二实现）。
   注：§3 表判读 as-of 2026-09-27——`input.js` ∥ `loading.js` ∥ `model-menu.js` ∥ `model-picker.js` 四行随 2026-09-28 上提批的落定面以本条为准（§3 收正 = 登记项——归该表下次触碰）。

**端注入面（核不持句柄）**：`deps = { emit(type, payload), t, now? }`——出站一律经 `emit`（VSC 绑 `postMessage`；桌面绑 `invoke`）；R2 构件件另注入端事实读取族（`connectedOf` / `regionOf` / `trace` / `syncLiveOf` / `onStripped`——逐件件头）；核内零全局单例（现 VSC 的 `ctx` / `S` 全局态属端）。

**桌面消费面（对齐第二批扩 · 单源 = 本段；机制 / 判据措辞单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」）**：① 纯函数 / 状态机族扩 = `paintReasoningTarget`（推理钉底——项 1）；
② `queued-mark` 两导出（`markPending` / `paintLabel`——用户块标签两形态与待发送标记；项 2 / 4；`planBusyQueued` / `clearPending` 不消费——登记 = 本档 §9 ②）；
③ 构件族四件（`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` / `renderSubDesc`——右列子 agent 块面与归档块面；项 3 / 5）；
④ **核件取词接线（`setStrings` 注册单点）**（核件内取词走核 i18n——注册单点 = `thincoder-desktop/renderer/app.mjs`（`setStringsSink(setStrings)` 一次注册）；`initDict` 合并式经注册端出（`thincoder-desktop/renderer/i18n.mjs` = node-safe 档——零 `/rc/` 静态导入；判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」）；
核件所需 VSC 侧键（`sub.*` / `msg.*` / `queued.pending`）入宿主表，**值逐字同 VSC locales**——沿 `msg.copy` / `msg.copied` 先例）。
⑤ **调度族 + 追加原语（更新纪律收核批 · 2026-09-29）**：`createFrameMerge`（帧合并——触发源 = store 变更 ⇒ `mark`；桌面接装单点 = `thincoder-desktop/renderer/app.mjs`） · `appendToolOutput`（工具卡结果区 O(1) 追加——`thincoder-desktop/renderer/views/chat-tool.mjs` 消费；VSC 同件改指 `thincoder-vscode/webview/chat-messages.js:77-96`——零行为变更）。

**样式契约**：核构件类名 = 被抽档现行名（KD-RC-7）；**内容面视觉对齐 VSC（值以 VSC webview 实值为源）**；**外壳 = 端侧自有面（VSC 无对位件——不构成端差）**——VSC 沿用 `chat.css` / `controls.css`（零改）；
  桌面 = `thincoder-desktop/renderer/core.css`（核类名 → 桌面值映射）+ 值变量单源 = 主题表 `thincoder-desktop/renderer/theme.css`（亮暗两套）。
  落定 = 批 `docs/batches/2026-09-28-desktop-vsc-visual-parity.md`（需求 §4 **D21** · 用户 2026-09-28 04:42 走查裁定 B）。
**「会话流经核」= 渲染逻辑单源**（核件分件消费：`md` / `attachCopyButtons` / `renderReasoning`〔推理块壳 · 结构同形〕/ `capText`）；**桌面外壳留存**（三锚 / 滚动 · 回填 · 窗口裁剪——核不夺）。

**内容面视觉映射口径（三律 · 下表判据）**：

1. **宿主主题色角色对位**——VSC `--vscode-*` 族（前景 / 边框 / 链接 / 错误）落桌面主题表对应变量（`--fg` / `--line` / `--accent` / `--warn`）：**角色对齐 · 值随端主题**（桌面主题体系零动——需求 D21 边界）。
2. **语义常量值照搬**——语法配色 / 叠加层 rgba / 尺寸 / 圆角 / 透明度 / 字号比例：VSC 实值逐字为源（新增变量入主题表亮暗两套）；**字族栈例外 = `--mono`**（角色对位 / 近似——宿主编辑器字族，见变量表）；**排版通道限定（2026-09-30 · 排版统一批（D29））**——字族 ∥ 字号 ∥ 行高 ∥ 字距以 §5「排版统一覆盖」块为准（本律「字号比例」枚举于该通道被接管；结构 ∥ 盒值 ∥ 色面零改）。
3. **盒层单层律**——文本面**内嵌件**（代码块 / 表格 / 引用 / 行内码 / 复制钮）的盒模型值照搬；**块壳已承载者不搬**（块内边距 / 边框 / 圆角归桌面壳层 `chat.css`）——两处内边距叠加即观感偏离（端差登记 = §9）。

**桌面主题表新增变量（12 个 · 亮 / 暗两值 · 单源 = `thincoder-desktop/renderer/theme.css`）**：

| 变量 | 亮 | 暗 | VSC 源（实值同字面；例外 = `--mono` 行——角色对位 / 近似） |
|---|---|---|---|
| `--mono` | `"Cascadia Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Microsoft YaHei UI", "Microsoft YaHei", monospace` | 同亮 | **角色对位 / 近似**（宿主编辑器字族 `--vscode-editor-font-family`，随宿主设置）——字面出处 = `thincoder-desktop/renderer/core.css:29`（上收为主题变量）；`thincoder-vscode/webview/base.css:74` 该行回退栈 = 系统 UI 栈；**栈收正（轻通道轮三 · 2026-10-01 · 台账 #758）**——首字 Cascadia Mono + 中文雅黑入栈；系统依赖在册（Cascadia 用户级安装〔两档 + 两注册〕，未装回落 Consolas——仓内零资产） |
| `--hover-bg` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` | `thincoder-vscode/webview/base.css:47` / `:22` |
| `--hover-bg-strong` | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.16)` | `thincoder-vscode/webview/base.css:48` / `:23` |
| `--overlay` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.3)` | `thincoder-vscode/webview/base.css:49` / `:24` |
| `--green` | `#1a8a4a` | `#4ec9b0` | `thincoder-vscode/webview/base.css:62` / `:40`（复制成功色） |
| `--syn-kw` | `#0000ff` | `#569cd6` | `thincoder-vscode/webview/base.css:51` / `:27` |
| `--syn-str` | `#a31515` | `#ce9178` | `thincoder-vscode/webview/base.css:52` / `:28` |
| `--syn-cmt` | `#008000` | `#6a9955` | `thincoder-vscode/webview/base.css:53` / `:29` |
| `--syn-num` | `#098658` | `#b5cea8` | `thincoder-vscode/webview/base.css:54` / `:30` |
| `--syn-type` | `#267f99` | `#4ec9b0` | `thincoder-vscode/webview/base.css:55` / `:31` |
| `--syn-prop` | `#795e26` | `#9cdcfe` | `thincoder-vscode/webview/base.css:56` / `:32` |
| `--syn-atrule` | `#af00db` | `#d7ba7d` | `thincoder-vscode/webview/base.css:57` / `:33` |

`--overlay` 两用（代码块底 ∥ 复制钮底）——VSC 侧 `thincoder-vscode/webview/chat.css:85` 取 `--vscode-textCodeBlock-background`，无宿主主题变量时回退 `--overlay`（桌面无宿主主题 ⇒ 取回退值）。

**逐面映射表（21 面 · 面 = 核产出件）**——VSC 侧选择器以 `.content`（助手消息 Markdown 面）为例；桌面侧两容器 = `.block-text`（消息正文）/ `.reasoning-content`（推理内容区）：

| # | 面 | VSC 实值（file:line） | 桌面落法（复用变量 ∥ 新增变量 ∥ 直接值） |
|---|---|---|---|
| 1 | 正文（字族 / 字号 / 行高） | 字族 = `thincoder-vscode/webview/base.css:74`（`--vscode-editor-font-family`）；字号 = `thincoder-vscode/webview/base.css:75`（`--vscode-editor-font-size`，缺省 `14px`）；`.bubble` 行高 `1.55` = `thincoder-vscode/webview/chat.css:50-55` | `font-family: var(--mono)`（**新增变量** ★上抛①）· `font-size: 14px`（与现值同）· `line-height: 1.55`；断词沿壳层 `.block` 的 `overflow-wrap: anywhere`（零重复落） |
| 2 | 段落 + 首尾留白 | `thincoder-vscode/webview/chat.css:68-69`（`p { margin: 0 0 6px }` · `p:last-child { margin-bottom: 0 }`） | `p { margin: 0 0 6px }` + `p:last-child { margin-bottom: 0 }`；**删首子归零规则**（现 `core.css:12-15` 的 `> :first-child`）——VSC 首件保留自身上边距（**直接值**）；**容器臂收窄（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）**：`> :last-child { margin-bottom: 0 }` ⇒ **`p:last-child` 单条**（逐字对齐 VSC——非 p 尾件〔代码块 ∕ 表格〕底距两端同；落点 = `renderer/core-markdown.css:25-30`） |
| 3 | 标题 h1–h6 | `thincoder-vscode/webview/chat.css:63-66` · `:126`（h5）· `:127`（h6） | 逐级字号 / 边距 / 字重：h1 `1.3em` `12px 0 6px` `700` · h2 `1.15em` `10px 0 4px` `700` · h3 `1.05em` `8px 0 4px` `600` · h4 `1em` `6px 0 2px` `600` · h5 `0.95em` `5px 0 2px` `600` · h6 `0.9em` `4px 0 2px` `600` **+ `opacity: 0.8`**（VSC `--textSecondary` 未定义 ⇒ 回退 `--fg`）；现制「一律 `1em` / `600` / `10px 0 4px`」⇒ 本值（**直接值**） |
| 4 | 列表 ul / ol / li + 嵌套 | `thincoder-vscode/webview/chat.css:111-112` · `:129` · `:130-132` | `ul, ol { margin: 4px 0 6px; padding-left: 20px }` · `ol { list-style: decimal }` · `li { margin: 2px 0; line-height: 1.5 }` · 嵌套三条同值（**直接值**）；现值 `8px 0` / `22px` ⇒ 本值 |
| 5 | 引用 blockquote | `thincoder-vscode/webview/chat.css:134-141` | `margin: 6px 0` · `padding: 6px 12px` · `border-left: 3px solid var(--line)`（**复用**）· `background: var(--hover-bg-strong)`（**新增变量**）· `border-radius: 0 4px 4px 0`（**直接值**）· **`color` 撤 `--fg-muted`**（VSC `--textSecondary` 未定义 ⇒ `--fg`） |
| 6 | 行内码 code | `thincoder-vscode/webview/chat.css:71-78` | `font-family: var(--mono)` · `font-size: 0.9em` · `background: var(--hover-bg-strong)`（**新增变量**）· `padding: 1px 5px` · `border-radius: 3px` · `word-break: break-word`（**直接值**） |
| 7 | 代码块壳 `pre.code-block` | `thincoder-vscode/webview/chat.css:80-88` | `margin: 8px 0` · `padding: 0` · `border: 1px solid var(--line)`（**复用**）· `border-radius: 6px ⇒ 0`（**扁平化（2026-09-30）收正**——代码块族归零；单源 = `docs/desktop/design/UI.md` §1「本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）」项 2；推理内残留 6px ∥ 3px 观察在册 = 批档 `docs/batches/2026-09-30-light-round-1.md` §2） · `overflow: hidden` · `background: var(--overlay)`（**新增变量**）· `position: relative`（既有）；现值 `padding: 8px 10px` / `overflow: auto` / `var(--bg)` ⇒ 本值 |
| 8 | 语言条 `.code-lang` | `thincoder-vscode/webview/chat.css:90-98` | `display: block` · `padding: 3px 10px` · `font-size: 10px` · `color: var(--fg)`（**复用**）· `opacity: 0.5` · `border-bottom: 1px solid var(--line)` · `font-family: var(--mono)`；现值 `--fg-muted` / `12px` / `margin-bottom: 4px` ⇒ 本值 |
| 9 | 代码体 `.code-block code` | `thincoder-vscode/webview/chat.css:100-109` | `display: block` · `padding: 8px 10px` · `overflow-x: auto` · `font-family: var(--mono)` · `font-size: 0.88em` · `line-height: 1.5` · `background: transparent` · `border-radius: 0`；现值 `12.5px` / `padding: 0` ⇒ 本值 |
| 10 | 语法高亮 `tk-*`（9 类） | `thincoder-vscode/webview/base.css:371-379`（变量 = `thincoder-vscode/webview/base.css:27-33` / `:51-57`） | **桌面现零 `tk-*` 规则 = 高亮不可见（本批首要缺口）** ⇒ 9 条规则照落：`.tk-keyword` → `--syn-kw` · `.tk-string` → `--syn-str` · `.tk-comment` → `--syn-cmt` + `font-style: italic` · `.tk-number` → `--syn-num` · `.tk-type` → `--syn-type` · `.tk-property` → `--syn-prop` · `.tk-atrule` → `--syn-atrule` · `.tk-class` → `--syn-type` · `.tk-id` → `--syn-atrule`（**新增变量 7**） |
| 11 | 表格 | `thincoder-vscode/webview/chat.css:154-159` | `border-collapse: collapse` · `margin: 8px 0` · `font-size: 0.9em` · `width: 100%`（**直接值**）；现值缺 `font-size` / `width` |
| 12 | 表头 / 单元格 | `thincoder-vscode/webview/chat.css:161-170` | `th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left }` · `th { background: var(--hover-bg-strong); font-weight: 600 }`（**新增变量**）；现值 `2px 8px` / 无表头底色 ⇒ 本值 |
| 13 | 链接 a | `thincoder-vscode/webview/chat.css:114-115` | `color: var(--accent)`（**复用**）· `text-decoration: none` · `a:hover { text-decoration: underline }`（**直接值**） |
| 14 | 行内强调 strong / em / s | `thincoder-vscode/webview/chat.css:123-124` · `:143` | `strong { font-weight: 700 }` · `em { font-style: italic }` · `s { text-decoration: line-through; opacity: 0.7 }`（**直接值**；核 `md` 产 `<s>`） |
| 15 | 图片 img | `thincoder-vscode/webview/chat.css:172-175` | `max-width: 100%`（既有）· `border-radius: 4px`（**直接值**） |
| 16 | 分隔线 hr | `thincoder-vscode/webview/chat.css:117-121` | `border: 0` · `border-top: 1px solid var(--line)`（**复用**）· `margin: 10px 0`（既有同值） |
| 17 | 任务清单勾选 `.task-check` | `thincoder-vscode/webview/chat.css:145-151` | `margin-right: 6px` · `vertical-align: middle`（既有）· `pointer-events: none` · `[disabled] { opacity: 0.85 }`（**直接值**） |
| 18 | 推理摘要 `.reasoning-summary` | `thincoder-vscode/webview/chat.css:286-294` | `font-size: 12px` · `color: var(--fg)`（**复用**）· `opacity: 0.5` · `font-style: italic` · `cursor: pointer` · `user-select: none`；**`padding: 4px 10px`（VSC 逐值——2026-09-29 落；端差① 已消）**；尾缀 `content: "…"`（字形面）保留 |
| 19 | 推理内容区 `.reasoning-content` | `thincoder-vscode/webview/chat.css:393-401` | `padding: 6px 10px`（VSC 逐值——2026-09-29 落）· `border-top: 1px solid var(--line)`（**复用**）· `font-size: 12px` · `opacity: 0.65` · `line-height: 1.45` · `max-height: 200px` · `overflow-y: auto` · `word-break: break-word` · `color: var(--fg)`（有效前景——VSC 不单设、继承 `body`）｜`margin-top: 6px` / `--fg-muted` 承接**均收**（2026-09-28 实施落） |
| 20 | 推理块内 Markdown（标题 / 段 / 行内码 / 列表） | `thincoder-vscode/webview/chat.css:404-413` | `h1, h2, h3 { font-weight: 700; margin: 8px 0 4px }` · `p { margin: 0 0 5px }` + `p:last-child { margin-bottom: 0 }` · `code { font-family: var(--mono); background: rgba(127,127,127,.15); border-radius: 3px; padding: 1px 4px; font-size: 0.92em }`（**直接值**＝ VSC `--bg2` 缺省回退值）· `ul, ol { margin: 4px 0 6px; padding-left: 18px }` · `li { margin: 2px 0 }` · `strong` / `em` 同 14 行；**代码块来推（2026-09-29 消——批 #673：VSC `:408-409` 覆盖段照落 + `.code-lang` 零样式）** |
| 21 | 代码块复制钮 `.code-copy-btn` | `thincoder-vscode/webview/base.css:386-401` | `position: absolute; top: 6px; right: 6px`（既有）· `padding: 3px 8px` · `font-size: 11px` · `border: 1px solid var(--line)`（**复用**）· `border-radius: 4px` · `background: var(--overlay)`（**新增变量**）· `color: var(--fg)`（**复用**）· `opacity: 0.4` · `transition: opacity 0.15s, background 0.15s` · `:hover { opacity: 1; background: var(--hover-bg-strong) }` · `.copied { opacity: 1; color: var(--green); border-color: var(--green) }`（**新增变量**）；现值 `--fg-muted` / `--bg-raised` / `.copied` 用 `--accent` ⇒ 本值 |

**计数（D3 · 内容面口径）**：**21 面**（1–21 = 正文 ∥ 段落 ∥ 标题 ∥ 列表 ∥ 引用 ∥ 行内码 ∥ 代码块壳 ∥ 语言条 ∥ 代码体 ∥ 高亮 ∥ 表格 ∥ 表头单元格 ∥ 链接 ∥ 强调 ∥ 图片 ∥ 分隔线 ∥ 勾选框 ∥ 推理摘要 ∥ 推理内容 ∥ 推理内 md ∥ 复制钮）；新增变量 **12**（`--mono` / `--hover-bg` / `--hover-bg-strong` / `--overlay` / `--green` / `--syn-*` 七）；端差 **0**（内容面——
  ① 盒层单层 已落 ∕ ② 推理内代码块同形 消；2026-09-29 · 批 #673）。
**排版统一覆盖（D29 · 桌面侧 · 2026-09-30 · 台账 #736）**——需求 §4 D29 ∥ 决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-57**；本块修正**桌面侧**排版通道（字族 ∥ 字号 ∥ 行高 ∥ 字距 ∥ 字重强调通道）——上表（21 面）相应面按本块收正；**结构 ∥ 盒值 ∥ 色面 ∥ 语法配色仍随 VSC**（D21 三律余域零改）；**VSC 侧 ∥ 核包零改**。
基线与修饰（桌面侧）——基线 = 字族 `--font`（⇒ `--mono` 栈）∥ 字号 `var(--fs)`（14px——轻通道轮五 2026-10-01 定版〔12 ⇒ 14〕）∥ 行高 `var(--lh)`（1.3——轻通道轮四 2026-10-01 收窄定档）∥ 字距 `var(--ls)`（`normal`）；修饰 = **相对（em）或非尺度通道**（粗体 ∥ 斜体 ∥ 色 ∥ 底 ∥ 边框）——**绝对 px 清零**。逐面收正（面号 = 上表）：

- 面 1 正文：`line-height: 1.55 ⇒ var(--lh)`；族 ∥ 号取基线变量（值同现——零观感位移）。
- 面 3 标题 ∥ 面 6 行内码 ∥ 面 9 代码体 ∥ 面 11 表格：**相对修饰值不动**（1.3–0.9em ∥ 0.9em ∥ 0.88em ∥ 0.9em——「基线 + 相对修饰」；语义来源 = 用户「除了 markdown 里标了的」；**读法待核准 = 批档 §2 上抛②**）。
- 面 8 语言条：`font-size: 10px ⇒ var(--fs)`（绝对岛清零）。
- 面 12 表头 ∥ 面 14 行内强调：`th 600` ∥ `strong 700` **不动**（markdown 标记豁免）。
- 面 18 推理摘要 ∥ 面 19 推理内容：`12px ⇒ var(--fs)`；面 19 行高 `1.45 ⇒ var(--lh)`。
- 面 21 复制钮：`11px ⇒ var(--fs)`。
- 余面（2 ∥ 4 ∥ 5 ∥ 7 ∥ 10 ∥ 13 ∥ 15 ∥ 16 ∥ 17 ∥ 20）：**零改**（间距 ∥ 盒 ∥ 色 ∥ 结构面）。
- 落点 = `thincoder-desktop/renderer/core-markdown.css` ∥ `thincoder-desktop/renderer/core.css`（值改零增行）；核包（`thincoder-render-core/**`——含 `composer/composer.css` 逐字锁）**零改**——核件消费面（输入面板 ∥ 模型菜单 ∥ 搜索条）收敛走桌面覆盖段（`thincoder-desktop/renderer/chat-composer.css`）。
- ★上抛①（字族）= **全端排版基线**（`--font: var(--mono)`——观感变化最大一项）；否决 ⇒ 回退配方 = `docs/desktop/design/PROJECT.md` §2 **KD-57** ⑥。
- **`select` 本体行高豁免（真机判据 · 平台面）**：Blink 把 `select` 本体 computed `line-height` 固定 `normal`（内联 ∥ 表则 ∥ `!important` 均不可达——页面 CSS 不可承载）⇒ 白名单外平台豁免（同壳 `option` ∥ `input` ∥ `button` 可控已归基线）；证据 = 批内件读数 `selectExemption` 段。
**会话面板面（桌面会话控制面）映射表 = `docs/desktop/design/UI.md` §1 本批注项 2**（端壳面，非核产出件——本档不重述）。
**落点与预算（内容面口径）**：`thincoder-desktop/renderer/core.css` **140 ⇒ 299（现读 2026-09-29）⇒ 本批 +面 20 段覆盖 ≈ +10（越 300 ⇒ 拆分预案 = 推理盒族出档 `thincoder-desktop/renderer/core-reasoning.css`（拟新增）· 消解窗口 = 下个结构性触碰的批——批 `docs/batches/2026-09-29-hatch-clearance-2.md` §2.8）**；
  `thincoder-desktop/renderer/theme.css` **R13 四拆后 = 89（现读 2026-09-29；主题表 12 变量在册）**；含会话面板面之全批预算 = `docs/desktop/design/PROJECT.md` §4.2；逐面真机比对 = 需求 §4 D21 验收面。

## 6. 受影响文件与测试面（三端 · 实施分批随动）

口径：现行 = 本批设计轮实读（2026-09-27 · 内容行数口径——文末换行不计）；预期 = 估值（R1 / R2 已按实读回填——行内「N 实读」旁注；#518 随动两档行同法回填〔2026-09-29〕）；「结构不变」= 档职责边界不动。

**核包（新建——R1 已落）**：`thincoder-render-core/package.json` · `md.mjs` · `highlight.mjs` · `diff.mjs` · `lib.mjs` · `tool-summary.mjs` · `i18n.mjs`（R1——逐字搬迁：行数 = VSC 原档现行值，见下表） ·
  `flow/*.mjs`（块 / 工具卡 / 推理 / 缝合）· `cards/*.mjs`（审批 / 提问 / 计划）· `subblocks/*.mjs`（态机 / 块面）（R2） · `test/*.test.mjs`（平 node 直测——**纯函数层 + 态机层**）。
  **DOM 构件层用例宿主 = 消费端套件**（非核包）：VSC = `thincoder-vscode/test/**`（happy-dom devDep 既有）· 桌面 = `fake-dom.mjs` 假 root 宿主档（已随 2026-09-28 测试树全清重置退场）——核包自身零 devDep（C1 机检恒可过），不引 happy-dom ∥ 不另立第二假 root。

**扩展端（判定表 18 档 + 发行三件）**——逐档「现行 ⇒ 预期」（核 9 = 迁核；拆 9 = 纯面迁核 · 端留守）：

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
| `ui.js` | 469 | ≈ 200–250 · **222**（实读 2026-09-29） | 拆 | 迁出四构件面（块容器 / 工具卡 / 恢复面 / 错误横幅）⇒ 核 `thincoder-render-core/flow/block.mjs` + `thincoder-render-core/flow/tool-card.mjs`；带内 ⇒ 拆分预案消解（未误拆） |
| `streaming.js` | 262 | ≈ 150–190 · R2 实读 **182** | 拆 | 迁出 rAF 缝合 + md 重渲 + 推理块 + 复制钮 + chunk 构图 ⇒ 核 `thincoder-render-core/flow/stream.mjs` / `thincoder-render-core/flow/reasoning.mjs` / `thincoder-render-core/subblocks/block.mjs`；带内 |
| `panels.js` | 142 | ≈ 90–110 · R2 实读 **122** | 拆 | 构树 + 显隐判据 ⇒ 核 `thincoder-render-core/cards/panel.mjs`；略高于带（端侧保 2s 定时器与消息分流）；挂起 / 回合态 / 分流留守 |
| `permission.js` | 122 | ≈ 80–95 · R2 实读 **39** | 拆 | 构树 ⇒ 核 `thincoder-render-core/cards/permission.mjs`；低于带（实迁出量大于估值）；三出口留守（端注入） |
| `question.js` | 89 | ≈ 60–70 · R2 实读 **25** | 拆 | 构树 ⇒ 核 `thincoder-render-core/cards/question.mjs`；低于带；出站留守 |
| `queued-mark.js` | 88 | ≈ 55–65 · R2 实读 **40** | 拆 | 纯逻辑 ⇒ 核 `flow/queued-mark.mjs`；低于带；DOM / 快照来源留守 |
| `ledger-line.js` | 18 | ≈ 10–12 · R2 实读 **13** | 拆 | 行构造 ⇒ 核 `flow/ledger-line.mjs`；带内（+1）；跟滚耦合留守 |
| `search.js` | 165 | 改指核件 ⇒ **18**（R6 落 · 实读 2026-09-29——内容行数口径） | **拆** | 端壳（`root` 绑定 + 侧效应注册）——实现整件入核 `thincoder-render-core/search.mjs`（R6 上提 · `docs/batches/2026-09-28-desktop-feature-parity.md`） |

**发行三件 + 测试面**：`thincoder-vscode/package.json`（依赖 +1）· `.vscodeignore`（反排除 +1 行）· `scripts/check-vsix.mjs`（断言 +1）· `thincoder-vscode/test/**`（happy-dom 直驱路径随动 + 核包 DOM 构件层用例宿主）。

**桌面端**：`thincoder-desktop/package.json`（依赖 +1）· `src/main/protocol.mjs`（双根 + `/rc/`）· `test/guard-closure.test.mjs`（前缀白名单）· `scripts/check-dist.mjs`（产物断言）· `renderer/*` 三面重定位（R3a–R3c）——逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行（**就地给数** · 指针不悬空）。

**块级跟滚提核随动（2026-09-29 · `docs/batches/2026-09-28-desktop-subblock-follow.md`）**：核 `thincoder-render-core/subblocks/block.mjs` **45 ⇒ ≈66**（+2 导出——纯搬移 · 档头留端清单同拍；**实读 2026-09-29 = 71**——#518 预测未回填；现行值见本节「块跟滚让位修复随动」段）；
VSC `thincoder-vscode/webview/activity.js` **190 ⇒ ≈176**（删两本地函数 ⇒ 改指核件；`thincoder-vscode/webview/streaming.js` **182** 零改——转口保留）；
桌面 `views/pool-subagents.mjs` **108 ⇒ ≈118**（**实读 2026-09-29 = 115**）· `views/activity-new.mjs` **100 ⇒ ≈109** · `views/activity.mjs` **259 ⇒ ≈262** · `renderer/core.css` **281 ⇒ ≈287**（+两值规则——值源 = `thincoder-vscode/webview/chat.css:466-467`）；
测试面 = 单元测试档 `docs/batches/2026-09-28-desktop-subblock-follow.test.mjs`（拟新增 · 随批留存）。

**块跟滚让位修复随动（2026-09-29 · `docs/batches/2026-09-29-subblock-follow-resume.md`）**：核 `thincoder-render-core/subblocks/block.mjs` **71 ⇒ ≈120**（+≤50：旗标手势门（600ms · `wheel` / `touchmove` / `pointerdown`）+ 出口钮三件（`sub-follow-btn` 建 / 更 / 删 + 两态词键 + 点击回底）+ 档注随改）——语义单源 = 本档 §2 **KD-RC-8**；
  VSC = 零逻辑改（随核同收）+ 两键入 `locales/{en,zh}.json` + `base.css` 钮样式；桌面 = 端面三轴（池壳原位领用 ∕ 帧尾逐块复钉 ∕ 归档重建径接线——逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行）。

**更新纪律收核随动（2026-09-29 · 批 `docs/batches/2026-09-29-render-perf.md` · 台账 #609）**：核 `flow/frame.mjs`（**新档** **69**（实读 2026-09-29）——帧合并件；单源 = §2 KD-RC-9）· 核 `flow/stream.mjs` **113 ⇒ 135**（+`appendToolOutput`；实读 2026-09-29）· 核 `thincoder-render-core/test/run.mjs` **82 ⇒ 82**（零改——帧归并用例住批内件；全清令）；
VSC `webview/chat-messages.js` **267 ⇒ ≈262**（toolOutput 支改指核件——零行为变更）；桌面逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行（就地给数）。

**性能尾账随动（2026-09-29 · 批 `docs/batches/2026-09-29-perf-residuals.md` · 台账 #619）**：核两档（拆档因 = 单档超 500 硬限）= `thincoder-render-core/flow/live-scan.mjs`（**新档 · 351 行**——冻结切点扫描器 `liveCut`）+ `thincoder-render-core/flow/live-md.mjs`（**179 行**——分片画件 `paintLiveMd`；`liveCut` 经其再出口保签名；单源 = §2 KD-RC-10）·
核 `flow/stream.mjs` **135 ⇒ 135**（实读——委托净零；`paintStreamTarget` 改走画件——签名 ∕ 兜底语义不变；`paintReasoningTarget` 同签名随动）· 核 `thincoder-render-core/test/run.mjs` **82 ⇒ 82**（零改——用例住批内件；全清令）；
桌面 `views/chat-stream.mjs` **77 ⇒ 101**（实读——`streamDelta` 增 `patch-append` 档 + `alignPlan` combo 支 + `paintPlan` 携 `appended`）· `views/chat.mjs` **284 ⇒ 290**（实读——未触越层预案；`patchTail` 携 `patchAt` + `settleFrame` combo 支）· `app.mjs` **299 ⇒ 299**（`alignPlan` 调用点一行形改——零净增）；
VSC `webview/**` ∕ 核 `subblocks/*` ∕ 两端套件 = 零触；
测试 ∕ 探针面 = 批内件两档（`docs/batches/2026-09-29-perf-residuals.test.mjs`（平 node——C12 ∕ C13 + 复证对拍）+ `-probe.mjs`（真机扩面——R-1 ∕ R-6 ∕ R-7 ∕ R-8 ∕ R-9）；`…render-perf.{test,probe}.mjs` 原件存续）；仓套件不写 ∕ 不改 ∕ 不跑（全清令）。

**重建保真 ∕ 留端清算族随动（2026-09-29 · 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` · 台账 #604–#608 + #581）**：核 `thincoder-render-core/scroll.mjs`（拟新增 ≈120——四件；单源 = §2 KD-RC-8 ④ 收正）· 核 `thincoder-render-core/subblocks/block.mjs` **121 ⇒ ≈100**（改薄包——本地实现删、改调工厂 + `NEAR_BOTTOM_PX` 再出口保名；出口钮自持面保留）；
核 `thincoder-render-core/subblocks/state.mjs` **≈330 ⇒ 零码改**（档头留端句收正 ×2——痕迹给由 ∕ 端复位面；零行数变化）；
VSC `thincoder-vscode/webview/ui.js` **222 ⇒ 约 201**（四函数改工厂调用——旗标宿主 `ctx`；事件集 `wheel` ∕ `touchmove` ∕ `scroll` 保持；零行为变更）；
桌面逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行（就地给数）；测试 ∕ 探针面 = 批内件两档（`docs/batches/2026-09-29-desktop-rebuild-fidelity.{test,probe}.mjs`（拟新增）——M-607 a–c ∕ P6 含四载体）；仓套件不写 ∕ 不改 ∕ 不跑（全清令）。

**口子清零二轮随动（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · 台账 #673）**：核 `flow/queued-mark.mjs` **103 ⇒ ≈110**（`planBusyQueued` 补「本批新建泡」匹配——同文项不重复建泡；
  判据 = 平 node `append.length === 1`）· 核 `subblocks/activity-view.mjs` **200 ⇒ ≈205**（`CANCELABLE_ROLES` = 六员 ∪ consult ∕ escalate——停钮族集补；`FAMILY_ROLES` 本体零改）；
VSC `thincoder-vscode/webview/session.css` **215 ⇒ ≈219**（两钮（Rename ∕ Delete）`:focus-visible { opacity: 1 }` 两臂——用户 2026-09-29 裁定 §1.7）；桌面逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行（**就地给数**）；测试 ∕ 探针面 = 批内件（`docs/batches/2026-09-29-hatch-clearance-2.test.mjs`——
  首落 `.thincoder/tmp/` ⇒ 父侧 copy 终位）；仓套件不写 ∕ 不改 ∕ 不跑（全清令）。

**E2 命中分支随动（2026-09-30 · 批 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.13 · 台账 #694）**：核 `thincoder-render-core/flow/block.mjs` **145 ⇒ 153**（实读 2026-09-30——续写支两处改并入末文本节点——`:63-66` ∥ `:47-49`；语义等价——RAW 拼接逐字同 ∥ 零视觉差；单源 = §2 **KD-RC-11**）；
桌面 ∕ VSC 消费面零改（共享核单点修——两头同收；VSC 侧 `ui.js` 直 import 核件、无双实现）；测试面 = 批内件（随批留存——全清令）。

**斜径机制批随动（2026-10-01 · 批 `docs/batches/2026-10-01-desktop-slash-commands.md` · 台账 #761）**：核 `thincoder-render-core/composer/slash.mjs`（拟新增 · **新档** ≈70——纯函数两件；单源 = §2 KD-RC-12 ∥ §5 条 6）·
核 `thincoder-render-core/composer/panel.mjs` **439 ⇒ ≈474**（+`deps.slash` ∥ 斜径拦截 ∥ `actions` 装配——硬限余 ≈26，越 500 先落在册拆档预案）· 核 `thincoder-render-core/composer/model-menu.mjs` **448 ⇒ ≈460**（钮 handler 提函数 + 导出面——
  **越 300 在册** ⇒ 处置 = **续期说明**：本批 = 提取 + 导出（≈+12 · 机械提取零新面 ⇒ 非结构性触碰、不构成拆分窗口）；不拆依据 = 距 500 硬限余 ≈40；**拆分预案** = 菜单族按段出档（拟新增档名 = 实施批定）；**消解窗口** = 该档下次**结构性**触碰的批）· 核 `thincoder-render-core/composer/controls.mjs` **205 ⇒ ≈222**（三 toggle 提函数 + 导出面）；
桌面逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行（就地给数——渲染面三档）；VSC ∥ `thincoder-core` = 零触；测试面 = 批内件（`docs/batches/2026-10-01-desktop-slash-commands.test.mjs`（拟新增）——平 node · 随批留存）；`node scripts/api-contract.mjs --write`（生成区随动——实施轮后跑）。

**斜径机制批 · `/help` 增量随动（同批 2026-10-01② · 台账 #761）**：核 `thincoder-render-core/composer/slash.mjs` **43 ⇒ ≈88**（+`formatHelp` 表→行集 ∥ 组序常量）· 核 `thincoder-render-core/composer/panel.mjs` **489（零触**——打印口 = 端侧闭包注入；
  硬限余 11 保持）· 桌面 `thincoder-desktop/renderer/slash-commands.mjs` **41 ⇒ ≈66** · `renderer/mount-composer.mjs` **283 ⇒ ≈296** · `renderer/store.mjs` **307 ⇒ ≈322**（**越层在册——结构性触碰 ⇒ 拆档评估窗口触发；处置待父侧裁**——
  见批档 §2.10 P2）· `renderer/views/chat-chrome.mjs` **221 ⇒ ≈252** · `renderer/views/chat-model.mjs` **105 ⇒ ≈117** · `renderer/views/chat-tree.mjs` **151 ⇒ ≈153** · `renderer/views/compress-status.mjs` **75 ⇒ ≈76** · `renderer/frame-dispatch.mjs` **53 ⇒ ≈56** ·
  `renderer/page-read.mjs` **282 ⇒ ≈294** · `renderer/i18n-views.mjs` **348 ⇒ ≈364**（续期）· `renderer/chat-fixes.css` **118 ⇒ ≈126**；桌面逐档「现行 ⇒ 预期」= `docs/desktop/design/PROJECT.md` §4.2 本批行（就地给数）；VSC ∥ `thincoder-core` 零触；测试面 = 批内件续修（腿 8–11——随批留存）。

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
| C9 | 帧合并件语义（脏键集合并 ∕ 单飞 rAF ∕ `minMs` 跳帧重排 ∕ `flush` 同步 ∕ `apply` 抛错不吞 ∕ 帧链不断——注入 `raf` ∕ `now`）平 node 全绿 | 批内件（`docs/batches/2026-09-29-render-perf.test.mjs`；全清令——核套件零触） |
| C10 | 桌面每 chunk 同步成本对文本长度近似平坦（真机探针 80KB 档 ≤0.3ms ∧ 10KB→80KB 比 ≤2——在册基线 0.0033ms ∕ 0.22）；**帧成本 p95 ≤8ms@80KB（基线段 ∕ 密文段同判；帧成本对文本长度平坦——10KB→80KB 帧成本比 ≤2）**；帧数 ≤ ⌈窗/50ms⌉+2（窗 = 1000-chunk 流的墙钟时长——探针侧读数） | 真机探针（批内件 `docs/batches/2026-09-29-perf-residuals.probe.mjs`——R-1 ∕ R-6 ∕ R-7 ∕ R-8；`…render-perf.probe.mjs` 原件存续） |
| C11 | VSC 零回归：`appendToolOutput` 改指零行为变更——**复证形态（2026-09-29 性能尾账批）**：修前副本 = git `cf48ba12~1:thincoder-vscode/webview/chat-messages.js`（可得——对拍参照 = 该副本 toolOutput 支逐字提取）+ 改动面 hunk 清点（除归因 hunk 外零改）+ 非串 `text` 域外差异一例登记；VSC 套件零触（全清令——现盘空清单） | 批内件（`docs/batches/2026-09-29-perf-residuals.test.mjs`）+ git 副本（只读取证） |
| C12 | 增量 md 语义：分片恒等式（段内 `mdInline` 分片复合 ≡ 整体 ∕ 块级 `md` 分片复合 ≡ 整体——语料逐例）∧ 画件协议（无缓存分片全绘 ∕ 增帧零重渲冻结区 ∕ 复位径 ∕ 异常回退 `textContent`（+ 复位））平 node 全绿；**运行时等价腿 = 真机探针 R-9**（真 DOM 增量面 ≡ 全量参照——`textContent` 逐字 + 结构归一） | 批内件（`docs/batches/2026-09-29-perf-residuals.test.mjs`）+ 真机探针（`docs/batches/2026-09-29-perf-residuals.probe.mjs`——R-9）；全清令——核套件零触 |
| C13 | 帧内组合（就地改 + 追加）不回落：`streamDelta` `patch-append` 判据 ∕ `alignPlan` combo 对齐（含滑窗 ∕ 守卫例）∘ `settleFrame` combo 支（尾节点就地 + 追加段挂载——假 DOM 节点身份存续）∧ 真机边界帧零重挂（R-8） | 批内件（平 node）+ 真机探针（R-8） |

## 8. 实施分批建议（文件面 · 串行序）

**开工前置**：与在飞退役批（#108）文件面**逐档核对**（核包新建面 + `thincoder-vscode/webview/**` + 桌面 `renderer/**` 三面）——冲突 ⇒ 串行；桌面批 / 豁免批文件零触碰。

**共享档串行条（本表判据）**：`thincoder-desktop/src/main/agent-bridge.mjs` · `thincoder-desktop/renderer/events.mjs` · `docs/desktop/design/IPC.md` 三档被 R3a / R3b / R3c 共触（回调面九 ⇒ 十 ⇒ 十一键 · 归约面递增 · 通道面递增）⇒ **R3a ⇒ R3b ⇒ R3c 严格串行**；任何两批不并行编辑同档（同档并行须先按批序串行落定，后批基于前批末态）。R3b / R3c 另依赖 R2 核件（见下表）。

| 批 | 内容 | 文件面 | 判据 | 串行序 |
|---|---|---|---|---|
| **R1** | 核抽取（纯函数层）+ 双端加载管道 | 核包 `md/highlight/diff/lib/tool-summary/i18n`；VSC 依赖 / 反排除 / 断言 / 六档换 import；桌面依赖 / `protocol.mjs` 双根 / guard / `check-dist` | C1–C6 + VSC 全绿 | 先行（其余批全部依赖） |
| **R2** | 核抽取（会话流构件层）+ VSC 换接 | 核包 `flow/cards/subblocks`；VSC `ui.js` / `streaming.js` / `permission.js` / `question.js` / `panels.js` / `activity*.js` / `ledger-line.js` / `queued-mark.js` 换接 | C2（零回归——含映射差分锁）+ 核档用例 | R1 后；**与 R3a 可并行**（文件面不交叠：核包 / VSC ∥ 桌面）；先行于 R3b / R3c（核件依赖） |
| **R3a** | 桌面状态行（D17） | 桌面 `agent-bridge.mjs`（`onUsage` 回调——九键 ⇒ 十键）· `agent-host.mjs`（回合尾结算携 `tokens?` / `timers?`）· `IPC.md` `ev:usage` 载荷扩 · `events.mjs` 归约（turn 槽 / 回合起刻 / timers；`currentTool` 由视图段自 `blocks` 派生——零新槽 · 免双源）· `renderer/views/chrome.mjs` + 状态行族档（`views/statusline.mjs` + `mount-status.mjs`——R3a 已落）· `i18n.mjs` · 测试面 | D17 十五段逐行判据 | R1 后（与 R2 可并行）；**R3b / R3c 随后串行**（共享三档——见上条） |
| **R3b** | 桌面右列 = 子 agent 面（D20） | 桌面 `agent-bridge.mjs`（relay 分流 → `ev:subagent`；前缀剥除；**存活投影挂点**）· 宿主存活投影 + 2s 拍体（`src/main/subagent-face.mjs` ∥ 附 `agent-host.mjs`——起 / 停 / 清点）· `IPC.md` 新通道 + `subagent:stop` · `ipc.mjs` / `preload.cjs`（白名单 +1）· `events.mjs`（新切片 + 摘工具行）· `renderer/views/activity.mjs` 重写 · `mount-*` · 测试面 | D20 四判据（五类射程 / 零工具行 / 块态机 / 停止往返）+ **出生自愈**（丢首发出生 ⇒ 一拍内复现 · 终态零再断言） | R2 后（需核态机）+ **R3a 后**（共享三档串行） |
| **R3c** | 桌面会话流经核 + 会话面板（D19 / D18） | 桌面 `renderer/views/chat*.mjs` 核件分件消费（渲染逻辑单源 · 桌面外壳留存）· `agent-bridge.mjs`（`onReasoning` 回调——十键 ⇒ 十一键）· `events.mjs`（`ev:reasoning` 归约）· `IPC.md`（`ev:reasoning`）· `sessions.mjs`（行投影 + `activeProvider`）· `thincoder-desktop/renderer/views/sessions.mjs`（元数据族）· `styles`（核类名映射）· 测试面 | C7 + D18 / D19 | R2 后（需核构件）+ **R3b 后**（共享三档串行） |

## 9. 边界（不做）

- **CLI 不入核**：ANSI 面不同源（D17 = 语义对位）；CLI 代码本批零触碰。
- **核不持宿主句柄**：任何 `postMessage` / `invoke` / 主题变量 / 分发循环都不得进核（§1.2 四条）。
- **核不夺两端在册机制**：滚动 / 回填 / 窗口裁剪 / 状态行（各端判据面已在册——§4 行 13–15 / 22；核化候选另议，不在本轮）。
- **扩展端行为零回归**：VSC 侧接核 = 换实现不换行为（逐字文案锁 / 协议覆盖套件不动）。
- **桌面多标签结构不削**；桌面零框架纪律不变；提示词面与需求档零触碰（笔权在父侧）。
- **斜径命令面（2026-10-01 · 批 `docs/batches/2026-10-01-desktop-slash-commands.md` · #761）**：① 键位补全（Tab）= **不做**（Web 焦点键——接管需用户裁定；机制留缝 = `slash.mjs` 语义面扩展点）；② **`/help` = 本批（同批增量——流内打印形；单源 = §5 条 6）**；其余 **22** 条 CLI 命令 = **另批 ∥ 不做**（逐条处置 = 批档 §2.4——未在册一律走未知回落，零假面）；
  ③ **VSC 命令面 = 零接缝**（不传 `deps.slash` ⇒ 行为零变）——如开 = 另批。
- **「同文重项 + 盘面零气泡」——处置定形（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）**：
  ① **同文重项 ⇒ 消**：核 `flow/queued-mark.mjs` `planBusyQueued` 补「本批新建泡」匹配（items 逐条循环内本批已产出同文者不再重复建泡）——回源档 1 泡口径（Reload 冷启 ∕ 清屏重推 `items: ["x","x"]` ⇒ 1 泡）；判据 = 平 node（append 恰 1）+ VSC 真机复读；
  ② **盘面零气泡 = 不适用**（桌面面——需求 **D25**「消费前流内零块」：待发送件住输入区上方带，非流内块）。
- **R3 端差三项——全部处置（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）**：① `ev:usage` 帧门 = `percent > 0` ⇒ 取整 0 回合 `tokens` / `timers` 不达 ⇒ **修**（帧门判据改「`pct > 0` ∨ 本帧携新读数（tokens ∕ timers）」——落点 = `thincoder-desktop/src/main/agent-host.mjs` 帧发放点；判据 = 取整 0 回合三读数照达）；
  ② 「会话关闭 ⇒ 该键投影清」无端面 ⇒ **撤项**（原「标签关闭」前提随 R13 消解——标签面退役；现会话关闭径 = 删除（`dispose`——`ipc.mjs:164-170`）∥ 宿主退出，两径均覆盖——零缺口）；③ consult ∕ escalate 族无停止径 ⇒ **修**（核 `subblocks/activity-view.mjs` 停钮族集补 `consult` ∕ `escalate`（新常量 `CANCELABLE_ROLES`——`FAMILY_ROLES` 本体零改以保头词面语义）；判据 = ⏹ 在场 ∧ 点击生效）。
- **D21 内容面视觉端差——两项全处置（2026-09-29 · 批 #673）**：
  ① **盒层单层（推理块）= 已落**（现盘 = VSC 逐值：`renderer/core.css:33-59`——summary `4px 10px` ∕ 内容区 `6px 10px`；§5 行 18-19 同拍）；
  ② **推理块内代码块同形 ⇒ 消**：移植 VSC `thincoder-vscode/webview/chat.css:404-413` 覆盖（`:408` pre 灰底 ∕ 圆角 6 ∕ `padding: 8px 10px`；`:409` `pre code` 归零；`.code-lang` 在 `.reasoning-content` 内零样式）——落点 = `renderer/core.css` 面 20 段；判据 = 逐值对拍 + 真机观感。
- **D21 会话面板视觉端差——处置定形（2026-09-29 · 批 #673；全清单七条 = `docs/desktop/design/UI.md` §1 本批注项 2，本条列核心项——本档不重述端壳面）**：
  ① **行内动作钮键盘可达臂 ⇒ 消（增强向 · 用户 2026-09-29 裁定）**：VSC `session.css` 两钮（Rename ∕ Delete）补 `:focus-visible { opacity: 1 }` 臂（对齐桌面手势；桌面臂保留 `session-list.css:130-133`——a11y 不回退）；
  ② **「不追面」重审（2026-09-29 · 核心项列举——全清单七条 = `docs/desktop/design/UI.md` §1 本批注项 2）**——「不追面」分类词退场：面板容器皮肤 ∕ 会话选择器交互两条 = **已消**（R13 换装 + D21 后两端构同形——实读 `session.css:13-59` ⟷ `session-list.css:8-46`）；会话条对位句 = **已消**（对位物退役——标签条 R13 裁撤 ∕ 会话头退场；对位 = VSC `#session-bar` 三件，R13-A 形换装已落）；
  `#project-btn` = **不适用**（需求边界——本端单项目模型）；`.dropdown-section` 无对位句保留（说明）。
- **「对齐第二批」端差 / 登记（2026-09-28 · 源 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2）**：① 助手说话人标签原语收拢候选 = **撤项**（非端差——零可见差；2026-09-29 · 批 #673；§10 **G** 同拍）；② `queued-mark` 的 `planBusyQueued` / `clearPending` 不消费（宿主快照对账面 / 节点换代交接——登记）· 核 effects 表不逐条执行（端面动作由模型态幂等派生）；
③ 桌面归档边界物 = **已消**（三端消化面统一批 · #747——桌面收编 VSC 边界物形：`insertBefore(块, 边界)` ∥ 座次入模；单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）；④ **1s 走时刷新（块头 elapsed）已落**（VSC `panels.js` 同点——原归第三批「小修族」）；
  ⑤ 运行期可见面两件（待发送气泡 / 归档子 agent 块）——**归档子 agent 块半件已消解**（消化面留档批 · #719——块体入人读线记录 ∥ 页读重建）∥ **待发送气泡半件保持登记**（页读整置即失——有意行为）；单源 = `docs/desktop/design/PROJECT.md` §10 **BA**。
- **「桌面空闲唤醒」端差 ∕ 登记（2026-09-28 · 源 = `docs/batches/2026-09-28-desktop-idle-wake.md` §2）**：① 消化状态行 = 端侧自持（VSC `chat-status.js` 同判「端」——核不夺）；② 子 agent 块**回收面**（消化完成逐条发 `done` ⇒ 归档入流）住桌面宿主驱动（核件 hooks 供给——与 VSC `reclaimDigestedBlocks` 同形）；③ 状态行挂起句 = 端侧词表（zh = CLI 逐字 ∕ en = VSC 逐字——双端值源登记）。

## 10. 上抛与报告项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| A | **文件链接承载面**（D19 收正 · KD-39）：现裁 = 承载（验存链 + `file:open`；行定位 = 编辑器 CLI 探测）——需求 §5.1 暂缓面收窄为「文件视图 ∕ 编辑器本体 ∕ 内置 diff」（「打开」已由 D19 收正解暂缓） | 已裁定落（2026-09-29 端差清算 · #627） | 单源 = `docs/desktop/design/PROJECT.md` §2 KD-39 |
| B | **发布单元登记**：新包 `@thincoder/render-core` **不入发布序列**（永不发布——`private: true`；两端内嵌带发、零 registry 端消费者） | 记录面随动（父侧 / 发布轮） | 依据 = 用户 2026-09-27 22:00 裁定 + §2 KD-RC-1；发布档由父侧落笔 |
| C | **地图与架构档补行**：`docs/README.md` 地图 + `docs/core/design/ARCHITECTURE.md` 模块表补核包行 | 文档随动（父侧面为常例） | 随 R1 实施批（或父侧直接执行） |
| D | **退役批文件面核对**：R1–R3 开工前与 #108 在飞批核对（§8 前置） | 实施前置 | 实施批执行；冲突 ⇒ 串行 |
| E | **探针两件（实施批首跑）**：① VSC 真 webview 加载 `node_modules` 相对路径核模块（dev junction 形态下）② 桌面 `/rc/` 双根供给与逃逸门 | 实现面实证 | R1 首跑即测；任一失败 ⇒ 回本档改加载形（KD-RC-1 备选 = 物化后经 `localResourceRoots` 显式扩面） |
| F | **桌面「计时」段新鲜度窗**：读数 = 核 `_pendingTimers`（`thincoder-core/agent.mjs:84`）· 刷新点 = 回合尾（`ev:usage` 同点）——**空闲期到期 ⇒ 闩到点即开 timer 轮**（timer-wake 阶段 2 已解；单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11），读数于该轮回合尾刷新 | **已解（timer-wake 阶段 2）** | 沿状态行目标读（不显倒计时）不变；不再另裁推送面 |
| G | **核侧无「助手说话人标签」原语**（核内为 `thincoder-render-core/flow/block.mjs` `renderBlock` / `buildAssistantRestore` 内联字面；桌面助手标签 = 端侧同字面落形——词键同源 / 字形住样式档） | **已裁 = 撤项（2026-09-29 · 批 #673）** | 判定 = 非端差（两端同键同字面 ⇒ 零可见差；核侧收拢 = 无用户面收益的纯重构）——不再悬挂；核件零改 |
| H | **核件取词 = 端侧 `setStrings` 接线**（构件族签名无 `deps.t`——核内取词走模块级 `i18n.t`） | 登记（接线面） | 备选 = 核件签名改注入 `t`（改核件——另裁）；现状 = 桌面**注册单点** = `thincoder-desktop/renderer/app.mjs`（`setStringsSink(setStrings)` 一次注册；`initDict` 合并式经注册端出——判据单源 = `docs/desktop/design/SHELL.md` §1 + 本档 §5 桌面消费面段） |
| I | **需求侧性能阈值与测法**（`docs/desktop/requirements/PROJECT.md` §6 性能行「阈值与测法留设计轮」——本批定形）：每 chunk 同步成本 ≤0.3ms@80KB ∧ 10KB→80KB 比 ≤2；帧成本 p95 ≤8ms@80KB；测法 = 真机计时探针 + 平 node 机检（批内两件） | 需求档落笔 = 父侧（笔权；建议文本 = 批档 §2.8） |
| J | **批内探针 ∕ 走查项交接**：#190 会诊 C2 两腿（单位时间输出可见延迟 ∕ Stop 可响应）+ 探针扩面件 ⇒ 挂台账 **#592** 走查清单（防无人复启） | 台账随动（父侧） |
| K | **需求档性能行收正**（性能尾账批落定后阈值形）：帧 p95 ≤8ms@80KB（基线 ∕ 密文两段同判）+ 测法指针改本批内件——**父侧落笔**（需求档笔权；建议文本 = 批档 §2.9）；现行为 = ≤16ms 收正句 + 增量 md「另议挂账」句（本批机制落定后为过期形） | 上抛（父侧笔） | 单源 = `docs/batches/2026-09-29-perf-residuals.md` §2 |
| L | **批内件两档收位 + VSC 复证坐标登记**：`docs/batches/2026-09-29-perf-residuals.{test,probe}.mjs`（实施轮建；`docs/batches/` 写面被拒 ⇒ 沿先例退 `.thincoder/tmp/`、父侧 copy）；修前副本出处 = git `cf48ba12~1:thincoder-vscode/webview/chat-messages.js`（复证引用——记录面随父侧） | 归父侧 | 先例 = `docs/batches/2026-09-29-render-perf.md` §5.3-5 |

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
- 2026-09-28（**R3 结算随动 · 设计面收正微轮**——承 `docs/batches/2026-09-27-render-core-r3.md` §1.2–§1.4）：§2 KD-RC-6 与 §4 行 3 / 5 / 6 措辞收正（「换接核件」= 渲染逻辑单源——核件分件消费 · 桌面外壳留存；`formatToolSummary` / `isToolFailure` 不消费 = 非缺口登记）；
  §4 行 7 / 9 齐不消费口径 + 计数行随动（需补面 9 / 显式裁 8）；§5 样式契约落 `renderer/core.css`（实读 140）；§8 R3a `currentTool` 词项回填（由视图段自 `blocks` 派生——零新槽）· R3c 措辞同笔；§9 增 R3 端差三项。零新语义。
- 2026-09-28（**D21 会话流 / 会话面板视觉对齐批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` §1）：§5 样式契约句收正——**内容面视觉对齐 VSC（值以 VSC webview 实值为源）· 外壳自持**（原「视觉按端自持」口径取消，改判 = 需求 §4 D21 / 用户 04:42 走查裁定 B）；
  §5 增**内容面视觉映射口径三律** + **主题表新增变量表 12 个** + **逐面映射表 21 面**（VSC 实值带 `file:line` × 桌面落法）；§9 增 D21 端差两项（盒层单层 / 推理内代码块同形）+ 会话面板端差一项 + 不追面四条（会话面板映射表住 `docs/desktop/design/UI.md` §1 本批注——本档不重述）。
- 2026-09-28（**D21 视觉批 · 设计评审轮 1 点修**——逐号）：§5 变量表 `--mono` 行改标**角色对位 / 近似**（宿主编辑器字族，随宿主设置）+ 字面出处（现居 `thincoder-desktop/renderer/core.css:29`）；
  §5 计数行 / 落点预算行加**内容面口径**限定（含会话面板面之全批合计 → `docs/desktop/design/PROJECT.md` §4.2）；§5 映射表行 2 叙明容器级 `> :last-child` **保留理由**（盒层单层律的容器臂——VSC 仅零 `p:last-child`）。
  §5 落点预算基线 141 ⇒ 收正 **140**（141 = 含末空行的编辑器计数；在册口径〔内容行数 · 文末换行不计〕与 R3 结算实读均 140）。零新语义。
- 2026-09-28（**父侧直接执行〔可 revert〕**——评审轮 1 收尾笔）：口径律 2 与变量表表头补 `--mono` 例外句（角色对位 / 近似）——与 `:222` 行改标同笔收口（两处 · 零新语义）。
- 2026-09-28（**父侧直接执行〔可 revert〕· 实施随动**）：§5 行 19 值列补 `color: var(--fg)` 绑定（`--fg-muted` 承接尾注收）——同 `thincoder-desktop/renderer/core.css:219`（实施落）与 E2E 读数（`rgb(27, 31, 36)` = `--fg` 亮值）对盘。零新语义。
- 2026-09-28（**对齐第二批 · 六件 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-vsc-align-2.md` §1）：§4 行 3 / 16 / 21 三行收正（推理面接 `paintReasoningTarget` · 队列标记改「接核原语 + 流内气泡」（原「自然成立」撤销）· 子代理活动区直消费构件族四件 + 内容回显 + 归档入流）；
  §5 增**桌面消费面段**（构件族四件 + 标记三导出 + `paintReasoningTarget` + `setStrings` 单点接线 + 核件词键面）；§9 增「对齐第二批」端差 / 登记五条；§10 增 **G / H** 两行（助手标签原语候选 · 核件取词接线面）；
  机制 / 判据措辞单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」；通道面 = `docs/desktop/design/IPC.md` §1（`ev:subchunk`）。
- 2026-09-28（**对齐第二批 · 修正轮 1**——设计评审 §3 轮次 1 发现 2 / 5 / 6 逐号点修）：§2 KD-RC-6 收正（内容 chunk 四面分流 + 回显 tail-3；被否候选「照 VSC 回显 tail-3」移入改判登记）· §4 行 16 不消费 carve-out 补 `clearPending`；
  §5 构件族补三件（`refreshBlock` / `renderSubagentChunk` / `renderSubDesc`）+ 消费面段 ② 导出数收正（两导出）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**桌面空闲唤醒批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-idle-wake.md` §1）：§3 行 8（`chat-status.js` 端）补桌面消化状态行同判句；§9 增「桌面空闲唤醒」端差 ∕ 登记三条（消化状态行端侧自持 ∕ 块回收面住宿主驱动 ∕ 挂起句双端值源）。核件面零改（本批不动核包）。
- 2026-09-28（**口子收敛轮 · eng-designer**——承 `docs/batches/2026-09-28-hatch-closure.md` §2 + 用户 2026-09-28 裁定）：§5 样式契约句收正——「外壳自持」⇒「**外壳 = 端侧自有面（VSC 无对位件——不构成端差）**」（消「按端自持」类保留读法）；§9 三处端差登记行加**判据收窄处置句**（「用户可见端差 = 缺陷（唯一例外 = 宿主能力面，须实证）；取消「登记后保留」」⇒ 待消除（归对齐批））。**零机制语义**。
- 2026-09-28（**对齐第二批 · 复核轮收正轮 · eng-designer**——承批档 §3 轮次 3）：§1.3 桌面端加载形补**装载面分层**指针句（单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」条）；
  §5 桌面消费面段 ④ 与 §10 **H** 行取词接线改述（**注册单点** = `thincoder-desktop/renderer/app.mjs`——`setStringsSink(setStrings)` 一次注册；`initDict` 合并式经注册端出）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**timer-wake 阶段 2 批 · 设计收尾轮 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §2）：§10 **F** 行转**已解**（空闲期到期 ⇒ 闩到点即开 timer 轮——读数于该轮回合尾刷新；单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11）。零新语义。
- 2026-09-28（**桌面功能对位批 · 设计面收正轮（fix · #129）· eng-designer**——承 flow 批 R10 交付）：§3 表行 2（`activity-new.js`）收正——「桌面右列常驻不需该钮（端差登记）」⇒ **同面补装**（R10 落 · 实现 = `thincoder-desktop/renderer/views/activity-new.mjs`）。明细 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2。
- 2026-09-29（**子 agent 块跟滚批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-subblock-follow.md` §1 · 台账 #518）：§2 增 **KD-RC-8**（块级跟滚原语入核——纯 DOM 零调度依赖 + 防第三端再漏；调用时机留端）；§3 行 4 ∕ §5 构件族 ∕ §6 三处随动（+2 导出 · 三端行数账）。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚批 · 修复轮（评审轮 1 · 发现 1）· eng-designer**——承批档 §3 轮次 1 · 父侧裁定以 `docs/desktop/design/UI.md` 为准）：§3 行 32 `search.js` 判定收正（端 ⇒ **拆**——实现整件入核）+ 计数行（核 9 ∕ 拆 9 ∕ 端 33）重算 + 静置面句三档；§4 行 20 搜索句收正（桌面已承载——端壳 `thincoder-desktop/renderer/search.mjs`）；§5 构件族补 `createSearch`。明细 = 批档 §2 修复轮。

- 2026-09-29（**desktop-residuals-sweep 批 · 波 D（非冻结档面）· eng-designer**——承 `docs/batches/2026-09-29-desktop-residuals-sweep.md` §2 · 台账 #540）：存量悬空重锚——`styles.css` 五处按语义择一（变量 ∕ 主题表面四处 ⇒ `theme.css`；§9 容器皮肤一处 ⇒ `chrome.css`）；§6 `fake-dom.mjs` 假 root 宿主锚随 2026-09-28 测试树全清重置删除（留档名标退场）。**零新语义**。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-subblock-follow-resume.md` §1 · 台账 #603）：§2 **KD-RC-8 收正**（让位三律——近底无条件自愈 ∕ 手势门控让位（600ms）∕ 非手势位移不改旗标；出口钮 `sub-follow-btn` 随原语自持 + 被否四候选在册）；**留端边界清算（用户裁定 · 档面同笔）**——「调用时机留端」表述退场 ⇒ 两半归属定死（原语 ∕ 旗标 ∕ 出口 = 核 · 应用时机契约 = 核〔应用点清单〕· 宿主帧模型 = 端〔不收核给由在册〕· 滚动策略族契约同源〔端 = 适配器 + 对拍腿〕）；§3 行 4 与 §5 构件族两条目随动；§6 增让位修复随动段（核 71 ⇒ ≈120 · VSC 零逻辑改 ∕ 桌面端面三轴）。明细 = 批档 §2（含 §2.13 边界裁定）。
- 2026-09-29（**更新纪律收核批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-render-perf.md` §1 · 台账 #609 + #190 会诊终报）：§2 增 **KD-RC-9**（更新纪律收核——帧合并件 `flow/frame.mjs` + O(1) 追加原语 `appendToolOutput`；触发源留端）+ **KD-RC-8③ 收正**（「宿主帧模型 = 端」退场 ⇒ 触发源 = 端 · 帧合并纪律 = 核）与被否列同拍；§3 行 4 ∕ §4 行 3 ∕ §5 两条目随动；§5 增调度族 + 追加原语；§6 增本批随动段；§7 增 C9–C11；§10 增 I ∕ J。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 修复轮（评审轮 1 · 发现 1 / 3 / 5 + 增补 B）· eng-designer**——承批档 §3 轮次 1 · 父侧裁定逐条受理）：§2 KD-RC-8 补**键盘位移归属**（同③路 + 残余登记〔消解路 = 真机核〕）+ ④ 对拍腿补**载体单源指针**；§4 表后增「核不夺 = 实现载体」限定句（与 ④ 族契约关系——零新语义）；§6「块级跟滚提核随动」段补「实读 N」旁注（`block.mjs` 71 ∕ `pool-subagents.mjs` 115）+ 回填口径句随拍。明细 = 批档 §3。
- 2026-09-29（**parity-b10-ui 批 · W4 · R3 残余（核档收正）· eng-coder**——承 `docs/batches/2026-09-29-parity-b10-ui.md` §2.6 R3 行）：§5 状态机族补 `relaySubContentChunk` 导出行（B7 2a 落件）；「先例…R2 后 VSC 差分 = 零」句改述（VSC 自持表已随 B7 2a 删——差分 = 零；「先例」列行号标为搬迁时采样）；「跨包对拍锁」指针改指 B7 批内件（旧件 `render-core-relay-map.test.mjs` 已退场）。**零新语义**（残句收正）。
- 2026-09-29（**更新纪律收核批 · 修复轮（评审轮 1（#214）· 发现 2 ∕ 3 ∕ 5 ∕ 6 ∕ 9 ∕ 10）· eng-designer**）：KD-RC-8③ 触发源括注按端限定（桌面 ⇒ `mark`；VSC 零改——现行 `createStreamRenderer`，改接另议）；KD-RC-9 应用器契约补 ⑤ 异常语义 + 被否列补两套帧件分工给由；§5 导出面「三族 ⇒ 四族」；
  §6 更新纪律随动段 `thincoder-render-core/test/run.mjs` 行收正（**82 ⇒ 82 零改**——帧归并用例住批内件）+ §7 C9 载体收正（批内件——全清令）+ C10 补帧数判据与「窗」定义 + C11 载体收正。明细 = 批档 §2.9。
- 2026-09-29（**性能尾账批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-perf-residuals.md` §1 · 台账 #619）：§2 增 **KD-RC-10**（增量 md 重渲——三段定界 ∕ 增量单元 = 段落 ∕ 块 ∕ 保守律 ∕ 画件契约；被否七候选在册）+ KD-RC-9 被否列同口径收正（帧界批内顺带形 ⇒ KD-RC-10 另立）；
  §5 调度族增增量 md 画件（`liveCut` ∕ `paintLiveMd`）；§6 增本批随动段；§7 C10 收正（帧 p95 ≤8ms 两段 + 帧成本平坦比）+ 增 C12 ∕ C13 + C11 补复证形态；§10 增 K ∕ L。明细 = 批档 §2。
- 2026-09-29（**性能尾账批 · 修正轮（评审 #41 · 发现 3 ∕ 5）· eng-designer**——承批档 §3 轮次 1）：KD-RC-10 异常径补「**+ 复位**」（内部冻结态清空 ⇒ 下一帧起点 = 分片全绘径——与批档机制文 ∕ AC-3 单值化）；§7 C12 机检面补**真机探针 R-9**（真 DOM 增量面 ≡ 全量参照——运行时等价腿入持久判据位）+ C12 异常句同笔补「+ 复位」。明细 = 批档 §2 修正块。
- 2026-09-29（**desktop-rebuild-fidelity 批 · U2 设计档随动轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.1 ∕ §2.5 ∕ §2.6）：**KD-RC-8 ④ 消费面收正**（滚动策略族 = 核抽核件——判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件入核；端 = 工厂消费）+ **核不夺口径限定段随拍**（行 15 随族同源——与 ④ 落定即消）；
  §5 增**滚动策略族**导出面（「四族 ⇒ 五族」）+ **落位不变式两条**（出生位 ∕ 归档入流）；§4 行 13 窗限数值差判定收正（非同判据——给由）；§3 行 1 补痕迹族给由句；§6 增本批随动段。明细 = 批档 §2 记录块。
- 2026-09-29（**性能尾账批 · 实施后文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-perf-residuals.md` §5）：核件拆两档登记（`thincoder-render-core/flow/live-scan.mjs` **351** ∕ `thincoder-render-core/flow/live-md.mjs` **179**——`liveCut` 再出口保签名）——§2 KD-RC-10 ∕ §5 调度族 ∕ §6 本批随动段同拍；
  §6 桌面两档与 `stream.mjs` 按实读收正（**101** ∕ **290** ∕ **135**）。**零新语义**（登记随动）。明细 = 批档 §2。
- 2026-09-29（**doc-sync-carryover 批 · 文档随动族收正轮 · eng-designer**——承 `docs/batches/2026-09-29-doc-sync-carryover.md` §1 · 台账 #650）：§6 更新纪律随动段两估值按届盘实读收正——`flow/frame.mjs` **≈60 ⇒ 69** · `flow/stream.mjs` **≈135 ⇒ 135**（实读）。**零新语义**（读数收正）。明细 = 批档 §2。
- 2026-09-29（**口子清零二轮 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-hatch-clearance-2.md` §2 · 台账 #673）：端差全面处置落档——§2 KD-RC-5 收正（文件链接承载——D19 收正 ∕ KD-39）· §4 行 12 同拍；§5 行 2 容器臂收窄（`> :last-child` ⇒ `p:last-child` 单条）· 行 18-19 推理盒值落定收正 · 行 20 代码块来推（消）· 计数行端差 2 ⇒ 0；§9 三块全处置（同文重项 = 消〔核件补本批新建泡匹配〕· D21 内容面两项全处置 · D21 会话面板 = 消〔VSC 补 focus-visible〕+「不追面」分类词退场）；§10 A ∕ G 行定形（A 收正 ∕ G 撤项）；R3 端差三项处置（① 修 ∕ ② 撤项 ∕ ③ 修）。**零机制语义**（处置落档 ∕ 句面收正）。明细 = 批档 §2。
- 2026-09-29（**口子清零二轮 · 修正轮 2（评审轮 2 · 10 条逐号 · 发现 6 ∕ 7）· eng-designer**——承批档 §3 轮次 2）：§9 D21 会话面板块 ② 题头收正（「四条重审」⇒「核心项列举——全清单七条 = `docs/desktop/design/UI.md` §1 本批注项 2」）；§6 `ui.js` 两值收一（**222**——实读 2026-09-29）。**零新语义**（计法 ∕ 读数收正）。明细 = 批档 §2.9。
- 2026-09-29（**口子清零二轮 · 实施轮 · eng-coder**——承 `docs/batches/2026-09-29-hatch-clearance-2.md` §2 · §5）：§4 **行 13 定谳**（E10 消——桌面 `MAX_RENDER_BLOCKS` 200 ⇒ **150**（`chat-scroll.mjs`），对齐 VSC `MAX_MESSAGE_BLOCKS`（`ui.js:204`）；方向裁 = 批 §4 建议㈠；对位档 `docs/desktop/design/RENDERER.md` §2 三处同拍）；核件两处落形（`flow/queued-mark.mjs` 补「本批新建泡」匹配 · `subblocks/activity-view.mjs` `CANCELABLE_ROLES`）；§5 行 2 容器臂收窄与行 20 代码块来推随实施落盘（`renderer/core-markdown.css` ∕ `renderer/core.css`）。明细 = 批档 §5。
- 2026-09-29（**口子清零二轮 · 实施随动收正轮（父侧裁）· eng-designer**——承批档 `docs/batches/2026-09-29-hatch-clearance-2.md` §4 ∕ §5.6）：§9「对齐第二批」块残句收正——④ 走时刷新值 ∕ 态按盘收正（2s ∕ 不落 ⇒ **1s ∕ 已落**——镜像 = `docs/desktop/design/UI.md:308` 现文）；②③⑤ 实读与 owning 档（`docs/desktop/design/PROJECT.md` §10 AZ ∕ BA · KD-33）同拍零触。**零新语义**（值 ∕ 态收正）。明细 = 批档 §2.10。
- 2026-09-30（**桌面堆取证修复批 · E2 命中分支落档轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-heap-freeze.md` §1.3c ∕ §2.13 · 台账 #694）：§2 增 **KD-RC-11**（续写支文本节点合并——`appendAdvisorChunk` 两处；语义等价）；§6 增本批随动段（核 `thincoder-render-core/flow/block.mjs` **145 ⇒ ≈150**；后收正实读 **153**——
  2026-09-30 ∥ 桌面 ∕ VSC 消费面零改）。**零新语义**（实测命中登记 + 语义等价修设计）。明细 = 批档 §2.13。
- 2026-09-30（**排版统一批（D29）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-typography-unify.md` §1 · 台账 #736 · 需求 D29）：§5 增**排版统一覆盖块**（桌面侧排版通道收正——面 1 ∥ 3 ∥ 6 ∥ 8 ∥ 9 ∥ 11 ∥ 12 ∥ 14 ∥ 18 ∥ 19 ∥ 21 逐面；结构 ∥ 盒值 ∥ 色面仍随 VSC）+ ★上抛①（字族）随 D29 收正句。**零机制语义**（值域收正）。明细 = 批档 §2。
- 2026-09-30（**文档清账批 · eng-designer**——承台账 #708 · 批 `docs/batches/2026-09-30-doc-settlement.md`）：§5 落位不变式 ② 桌面侧形态收正（消费轮边界物形——`insertBefore(块, 边界)`：边界 = `ev:digest start` 标签行 ∥ 座次入模；三端消化面统一批 · #747 落形）+
  §9「对齐第二批」端差 ∥ 登记块 ③ 转 **已消**（桌面收编 VSC 边界物形——KD-33；单源 = 桌面 `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）。**零新语义**（跨板随动 ∥ 时态收正）。
- 2026-10-01（**文档清账批 · 修复轮（评审轮 1 · 发现 2）· eng-designer**——承批档 §3 轮次 1 · 明细 = 批档 §2 修复轮块）：§9「对齐第二批」端差 ∥ 登记块 ⑤ 收正——归档子 agent 块半件已消解（#719——块体入人读线记录 ∥ 页读重建）∥ 待发送气泡半件保持登记（页读整置即失——有意行为）；与 owning 档 `docs/desktop/design/PROJECT.md` §10 **BA** 同态。**零新语义**（镜像 ∥ 时态收正）。
- 2026-10-01（**轻通道轮三收尾 · 设计形式化 · eng-designer**——承 `docs/batches/2026-10-01-light-round-3.md` §1 · 台账 #758）：§5 变量表 `--mono` 行收正——栈字面随定版更新（**Cascadia Mono 首字 + 中文雅黑入栈**）+ 系统依赖在册（Cascadia 用户级安装〔两档 + 两注册〕；未装回落 Consolas——仓内零资产）+ 字面出处句时态收正（「现值 · 本批」含糊 ⇒ 「上收为主题变量」）。**零机制语义**（值面收正）。明细 = 批档 §2。
- 2026-10-01（**轻通道轮四收尾 · 设计形式化 · eng-designer**——承 `docs/batches/2026-10-01-light-round-4.md` §1 · 台账 #759）：§5 排版统一覆盖块基线行收正——行高 `var(--lh)`（**1.3**——轻通道轮四收窄定档：用户「行距有点大，能缩小点吗」→「再小点」）；余三值（字族 ∥ 字号 ∥ 字距）零动。**零机制语义**（值面收正）。明细 = 批档 §2。
- 2026-10-01（**斜径机制批 · 设计轮 · eng-designer**——承 `docs/batches/2026-10-01-desktop-slash-commands.md` §1 · 台账 #761）：§2 增 **KD-RC-12**（斜径机制入核 · 命令表归端——纯函数 ∥ 面板缝 ∥ 动作句柄面 ∥ 同钮同门 ∥ 边界）；§5 增**输入面板族（composer）**条（补登——2026-09-28 上提批落核面；含斜径面）+ §3 四行 stale 登记（归该表下次触碰）；§6 增本批随动段；§9 增「斜径命令面」边界条。明细 = 批档 §2。
- 2026-10-01（**轻通道轮四收尾 · §2 增量（笔 6–12）· eng-designer**——承 `docs/batches/2026-10-01-light-round-4.md` §1 ∥ §2 · 台账 #759）：§5 排版统一覆盖块基线行**字号**收正（`var(--fs)` **12px**——笔 11–12 收窄定档；前行高 1.3 已在册）；`--bg-raised` 值线**未载**（§5 变量表 = 内容面变量族——零触，本舱注明）。**零机制语义**（值面收正）。明细 = 批档 §2 增量块。
- 2026-10-01（**斜径机制批（桌面 slash 命令）· 修复轮 1（评审轮 1 · 七发现逐号）· eng-designer**——承 `docs/batches/2026-10-01-desktop-slash-commands.md` §3 轮次 1 · 台账 #761 · 明细 = 批档 §2 修复轮块）：**KD-RC-12** 收正——「零上行」⇒「**零消息径上行**」+ 补注（模式三钮动作照走 `session:flags`——同钮径不变）；`deps.slash = { commands, actions }` 完整键形（条目形补 `rejectKey?`）+ `run` 返值改述（返真 = **已受理**——`/auto` popover 径同判）；**§5 条 6** 补反馈键发射点一行表（面板层 ∥ run 前门）；**§6** 本批随动段 `model-menu.mjs` 行补越层处置句（续期 + 拆分预案 + 消解窗口）。**零机制语义**（口径收一 ∥ 契约定形 ∥ 处置句补登）。
- 2026-10-01（**斜径机制批（桌面 slash 命令）· 修复轮 3（实施轮上抛 1 ∥ 2 收正）· eng-designer**——承 `docs/batches/2026-10-01-desktop-slash-commands.md` §5（审计 F1 ∥ F2 · 代码评审 R1 ∥ R2）· 台账 #761 · 明细 = 批档 §2 修复轮 3 块）：§5 条 6 `actions` 注入句按实况收正——**装配 = 面板从两工厂实例导出面取**（同函数性只能在实例处成立）∥ 端侧注入 = `{ commands }`；
  注入面计数句随动（五项 ⇒ **六项**，与 `thincoder-render-core/composer/panel.mjs` 档头逐字对齐）。**零机制语义**（措辞 ∥ 计数按实况收正）。
- 2026-10-01（**斜径机制批 · `/help` 增量块（initial 轮）· eng-designer**——承本批 §1 增量（用户 04:15 ∥ 04:18 直斥 + 派单）· 台账 #761 · 明细 = 批档 §2.10）：**KD-RC-12** 增量句（`/help` = 流内打印形 ∥ `formatHelp` ∥ `printHelp` 键 ∥ 边界收正）；**§5 条 6** 收正（`deps.slash = { commands, printHelp? }` ∥ 条目形 +`group?`/`descKey?` ∥ `ctx` +`printHelp` ∥ `formatHelp` 入件族）；**§6** 随动段续行；**§9** 斜径边界条收正（`/help` = 本批 ∥ 其余 22 条）。**零机制语义**（增量落形 ∥ 键形扩展）。
- 2026-10-01（**轻通道轮五收尾 · 设计形式化 · eng-designer**——承 `docs/batches/2026-10-01-light-round-5.md` §1 · 台账 #808）：§5 排版统一覆盖块基线行字号收正（`var(--fs)` **14px**——轻通道轮五 2026-10-01 定版〔12 ⇒ 14〕；行高 1.3 保持）；余值零动。**零机制语义**（值面收正）。明细 = 批档 §2。
- 2026-10-02（**文档清账轮 · 执行轮 4 · eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：锚面 6 处 R1 改指（承接全路径，盘上实存——`thincoder-cli/src/tui/slash-commands.mjs:130` ∥ `thincoder-render-core/flow/block.mjs` ×2 ∥ `thincoder-desktop/renderer/slash-commands.mjs` ∥ `thincoder-vscode/webview/chat.css:404-413` ∥ `thincoder-render-core/composer/panel.mjs`）；宽面 15 行折行（§5 ∥ §6 ∥ §9 处——语义零改）。**零新语义**。
