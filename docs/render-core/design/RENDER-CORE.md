# 渲染核（RENDER-CORE）· 设计

> 板块 = **扩展端 / 桌面端共用宿主无关渲染核**的落点 · 加载形 · 边界 · 逐模块判定 · 逐机制对位 · 分期。
> 本档 = 核面权威；两端接入面只在此留指针（桌面对位细节 = `docs/desktop/design/UI.md` / `docs/desktop/design/IPC.md`；VSC 接入面 = `docs/vsc/design/WEBVIEW.md`）。
> 需求侧 = `docs/desktop/requirements/PROJECT.md` §3.6 + §4 D17–D20（状态行对齐 CLI ∥ 会话面板对齐 VSC ∥ 会话流经共享渲染核对齐 VSC ∥ 右列 = 子 agent 面板）。
> 相关档：`docs/core/design/CORE-UNIFICATION.md`（`@thincoder/core` 的链接 / 物化 / 发布纪律——本档发行面同源）· `docs/core/design/ARCHITECTURE.md`（模块地图与硬约束）。

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
4. **入站分发与装配**——VSC 消息循环（`webview/chat-messages.js:48` 唯一监听点）；桌面订阅 + 帧装配（`renderer/events-subscribe.mjs` / `thincoder-desktop/renderer/app.mjs`）。

### 1.3 落点与加载形（零构建下两端如何取核）

**落点 = 新顶层目录 `thincoder-render-core/`**（真包：`name: "@thincoder/render-core"`，零运行期依赖、零 devDep）；**文件形 = `.mjs`**。

判据：桌面 `app://` 供给面 MIME 白名单含 `.mjs` 不含 `.js`（`thincoder-desktop/src/main/protocol.mjs:22-29`）；VSC webview 已有 `.mjs` 模块实跑先例（`thincoder-vscode/webview/tool-card-restore.mjs`；R2 换接后七拆档同径直接 import 核包 `.mjs`）。

**扩展端加载形**：webview 模块以**静态相对路径**取核（`../node_modules/@thincoder/render-core/xxx.mjs`）。

- 判据：webview 资源根 = 扩展安装目录（现仓**未设** `localResourceRoots`——代码面 grep 零命中，默认根含扩展目录）⇒ `node_modules/**` 落在根内；`index.html` 资源引用 = `asWebviewUri` 占位符注入（`src/extension/chat-panel.mjs:413-425`）；相对 import 由浏览器按各模块自身 URL 解析 ⇒ **零占位符新增 · 零 `localResourceRoots` 改动 · 零 importmap**。
- 发行面：`.vscodeignore` 增反排除行（照核先例 `thincoder-vscode/.vscodeignore:3-4` 的「`node_modules/**` + 反排除」两行式）+ `scripts/check-vsix.mjs` 增断言（照其 `:56-63` 断言 B 形：核包存在且版本逐字相等）。
- **内嵌面收窄规则**：vsix 只携核包运行必需件（`.mjs` + `package.json`）——`test/` / `docs/` 不入；现行反排除形（`thincoder-vscode/.vscodeignore:5`）在 link 形下随 `--follow-symlinks` 会把被链源树测试一并纳入（实测 7 档）⇒ 补排除行（形：`node_modules/@thincoder/render-core/test/**`）。
- 先例坑同源：dev 期 `npm link`（junction）——`vsce` 不打包 symlink；**实测**：物化路线（`npm install --install-links`）对其不可执行——vsce 默认依赖检测（`npm list --production`）报 `ELSPROBLEMS/invalid` ⇒ 打包硬失败；
  可行形 = **link 形 + `--follow-symlinks`**（R1 打包窗实测 475 件；render-core 内嵌带发、永不发布——§2 KD-RC-1）· `@thincoder/core` 面「发布前物化（registry 解析）」纪律（`docs/RELEASE.md:141` §5.5 步 1）不动。

**桌面端加载形**：主进程解析包路径（`createRequire(import.meta.url).resolve("@thincoder/render-core/package.json")`）⇒ `app://` 供给面**双根**：
`/` → `renderer/`（现状 · `thincoder-desktop/src/main/protocol.mjs:17` `RENDERER_ROOT`）· `/rc/` → 核包目录；渲染面以**同源绝对路径** import（`/rc/xxx.mjs`）。

- 判据：`protocol.mjs` 逃逸门（`relative()` 判据——`:53-54`）对各根同式施加 ⇒ 双根 = 显式登记第二条根 + 各根各留逃逸门（供给语义不变）。
- **渲染面静态闭包纪律**（零裸包 / 零 `@thincoder/core`）：`/rc/` 前缀白名单在册；**裸包禁令不变**（核经 URL 前缀取，不经 `node_modules` 裸名）。
- **装载面分层（「对齐第二批」修复轮）**：桌面渲染档分两档（node-safe ∥ 浏览器专属）——档记 / 判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」条；本加载形面（`/rc/` 供给）受该条约束；违例 = 主进程装载崩 · 窗口永不出。
- 发行面：`thincoder-desktop/package.json` `dependencies` 增该包（electron-builder 打包生产依赖）；`scripts/check-dist.mjs` 增产物断言（R1 已落 1 条——`CHECKS` 表 `:18-24`：asar 包内 `node_modules/@thincoder/render-core/package.json` 在册）。

**零构建判定**：两形皆无构建步骤、无打包器——核 = 源码直跑；发行纪律（链接 / 物化 / 断言 + 永不发布——单源 = §2 KD-RC-1）不是构建步。

### 1.4 与仓级约束的关系

- 无构建步骤（`docs/core/design/ARCHITECTURE.md:20` · `thincoder-vscode/AGENTS.md:11`）：核为源码目录、无产物。
- 零第三方运行期依赖：核自身零依赖（纯浏览器标准面）。
- 桌面零框架（`docs/desktop/design/PROJECT.md` §2 KD-4）：核 = 手写 DOM + 纯函数。

## 2. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-RC-1 | 核落点 = **新顶层真包 `thincoder-render-core/`**（`@thincoder/render-core`，零依赖） | 与 `@thincoder/core` 同式（共享物 = 独立包——`docs/core/design/CORE-UNIFICATION.md` §2.6.1）；**链接 / 物化 / 断言三纪律 + 永不发布**：前三条复用（物化面 = 打包形实测，单源 = 本档 §1.3）；永不发布 = `private: true` / 零 `publishConfig`——两端内嵌带发、零 registry 端消费者（用户裁定；未发布即 E404） |
| KD-RC-2 | 核**文件形 = `.mjs`** | 桌面 MIME 白名单（`thincoder-desktop/src/main/protocol.mjs:22-29`：有 `.mjs`、无 `.js`）；VSC 已有 `.mjs` 实跑先例（`thincoder-vscode/webview/tool-card-restore.mjs`） |
| KD-RC-3 | 核**输出形态 = DOM 构件 + 纯函数**（浏览器原生；不引框架、不定 HTML 字符串契约） | 两端渲染面同为 Chromium DOM；DOM 非宿主特权（§1.2）；VSC 现状 = DOM 命令式、桌面现状 = 描述符树——核构件（返回 DOM 节点）可被两端各挂各的壳（桌面挂载面直接 append） |
| KD-RC-4 | 桌面**「零 Markdown」口径改判**：对话流文本面 ⇒ 经核 Markdown 呈现（`md.mjs` 单源；助手块 / 用户块同径） | 用户走查第 3 点「会话流…应该跟 VSC 对齐」+ D19 明列 Markdown；对齐须经同核（同文本 ⇒ 同渲） |
| KD-RC-5 | 桌面**文件链接承载**（核 `linkifyPaths` 消费 + 宿主验存链 ⇒ `file:open`；行定位 = 外部编辑器 CLI 探测） | 「对齐第三批」D19（端差清算）：验存闸 = 核值（宿主 `extractFileLinks` 同源 + 核包裹 + `file:open`）——单源 = `docs/desktop/design/PROJECT.md` §2 **KD-39** |
| KD-RC-6 | 桌面**子 agent 面内容 chunk 四面分流 + 回显 tail-3**（KD-RC-6 收正——「对齐第二批」项 3） | 需求 §3.6「对齐」口径 + D4（内容回显 = 核件 tail-3 / 展开）+ D20 块形；四面 = text / think / 工具调用行 / 工具输出行（桥面出站 `ev:subchunk`——载荷 / 在场单源 = `docs/desktop/design/IPC.md` §1 该行）；现状漏 = 带 `role#id/` 前缀的内容 chunk **原样进主流**（`thincoder-desktop/src/main/agent-bridge.mjs:57-63` 只剥 `⟦ev⟧` 协议段，其余前缀不剥）⇒ 分流 = 修漏 + 定形 |
| KD-RC-7 | 核**构件类名沿用被抽档现行名**（逐字搬迁纪律）；样式变量面 = 各端映射（桌面新增「核类名 → 桌面变量」样式档） | VSC 侧 CSS（`chat.css` / `controls.css`）与逐字文案锁按现行名成文 ⇒ 改名 = 全量机械重构、收益为零；桌面样式自有（`styles.css` 340 行） |
| KD-RC-8 | **块级跟滚原语**（`initBlockFollow` / `maybeScrollBlock`）**入核**；**让位语义收正 + 出口钮自持 + 两半归属定死**（用户裁定留端清算） | 纯 DOM 零调度依赖（先例 = 核 `paintReasoningTarget` 即写 `scrollTop`）；同一份十余行逻辑要求每端复刻 ⇒ 注定再漏（实证 = 桌面块内容区跟滚零接线）。**让位修复三律**：① 近底（gap < 24px）无条件翻真（自愈）② 远离底仅凭用户手势门（`wheel` / `touchmove` / `pointerdown` · 600ms）翻假 ③ 非手势位移（复位回波 / 程序写 / 布局）不改旗标；**键盘位移**（键盘滚动——无手势标记）同路（不改旗标）——可达性 unverified（需真机核）⇒ **残余登记**（消解路 = 真机核，可达 ⇒ 纳手势集另立小修；过期 = 真机核落地；登记落点 = `docs/desktop/design/UI.md` §1「批注（块跟滚让位修复）」项 5）；**出口钮** `sub-follow-btn` = 原语自持面（让位期 `open ∧ 非冻结 ∧ 可滚` ⇒ 可见；两态词键 `sub.follow.new` / `sub.follow.bottom`；点击 ⇒ 回底 + 复跟）——两端随核同收。**两半归属**：① **原语 ∕ 旗标语义 ∕ 出口钮 = 核**；② **应用时机契约 = 核**（应用点清单 = 本档 §5 单源：追加后 · 挂载后 · 帧尾复核——端只在宿主时刻按清单调用核应用器；端侧遗漏应用点 = **违约缺陷**，机检用例逐端在册；四点 ∕ 帧尾 ∕ 归档径三漏即契约缺位所致）；③ **触发源 = 端**（桌面 = store 变更 ⇒ 调核帧合并件 `mark`；VSC 面零改——流式装配现走核 `createStreamRenderer`，改接 = 排后另议）——**帧合并 ∕ 更新纪律已收核**（rAF 属浏览器原生面——§1.2 定性内，先例 = `createStreamRenderer`；单源 = §2 **KD-RC-9**）；④ **滚动策略族 = 核抽核件**（块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流四载体：近底 < 24px 判据 ∕ 旗标门 `!== false` ⇒ 写 `scrollTop = MAX` ∕ 不夺阅读位 ∕ 清账三路——**留端清算收正：判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件入核**（`thincoder-render-core/scroll.mjs`（一处实现四件）——导出面 = 本档 §5「滚动策略族」）；端 = **工厂消费**（只留帧调用点 ∕ 计数呈现 ∕ 钮形——逐端置换零行为变更；③ 帧模型不收核——不破定性边界）；对拍用例升级 = **工厂单源 + 消费面断言**（判据漂移 = 缺陷；载体 = 批次本地机检件）） |
| KD-RC-9 | **更新纪律收核**（用户报障 + 真机实锤）：核新增**帧合并件 `flow/frame.mjs`**（`createFrameMerge`——**脏标记 ∕ 帧合并 ∕ 应用器契约**；`FRAME_MIN_MS` = 50 · 单飞 rAF · `flush` 同步尾帧）+ **`appendToolOutput`**（O(1) 工具输出追加原语——自 VSC `chat-messages.js:77-96` 上提，VSC 改指零行为变更；桌面工具卡消费）。**应用器契约**：① 每键面每帧至多绘一次（增量更新为默认——尾块就地 ∕ O(1) 追加 ∕ 面内差分；整面重挂仅判据命中）② 布局节俭（禁逐 chunk 强制布局——读数仅帧内、按档裁剪）③ 帧尾动作（滚动 ∕ 钉底 ∕ gating）落面尾段、每帧至多一次 ④ 每 chunk 同步成本禁 ∝ 累计文本 ⑤ `apply` 抛错语义——脏集于调用前快照并清空（apply 内新 `mark` ⇒ 落下一帧；抛错帧不重试同脏集）· 异常不吞（直抛）· 单飞标记 `try/finally` 复位 ⇒ 帧链不断（抛错后后续 `mark` 照常起帧）。**触发源留端**（宿主事件 / store 变更 ⇒ `mark`）；`flush` = 顺序保真点（回底）+ 测试 ∕ 探针确定性 | 用户报「桌面输出速度好慢」+ 斥「VSC 早就处理了的毛病又搞出来——渲染核干了啥」；真机计时实锤（单块流式每 chunk 重挂成本随文本**线性增长** 10KB=0.9ms ∕ 40KB=4.5ms ∕ 80KB=5.9ms）；VSC 已付轮子 = rAF 节流（其 `CHANGELOG`「Stop 卡顿」——每 chunk 全文重渲 ∕ DOM 重建 ⇒ O(n²)）；桌面缺该层 ⇒ 触发源留端（KD-RC-8③ 收正）· 更新纪律收核 |
| KD-RC-10 | **增量 md 重渲**（用户报障）：尾块流式文本面（`paintStreamTarget` ∕ `paintReasoningTarget` 消费面）由「每帧全量 `md()` + 整面 `innerHTML`」改 **冻结切点 + 热区换代**——新核件两档（单档 ≈538 超 500 硬限）：`thincoder-render-core/flow/live-scan.mjs`（**351 行**——`liveCut` 扫描器）+ `thincoder-render-core/flow/live-md.mjs`（**179 行**——`paintLiveMd` 画件；`liveCut` 经其再出口保签名——两端调用点零改）。**三段定界**：① **md 渲染段** = 冻结前缀零重渲——单帧渲染量 = 冻结增量 + 热区跨度（禁 ∝ 累计文本）② **DOM 写面段** = 已冻结节点零触碰——提交段追加 + 热区节点换代（禁整面 `innerHTML`）③ **样式重算段** = 失效面 ∝ 热区——冻结节点身份不变（引擎无失效理由）。**增量单元 = 段落 ∕ 块**：段内（paragraph）按行内构造封闭点冻结；列表 ∕ 表格 ∕ 引用 ∕ 围栏 = 块级单元（块闭才冻结，开启块 = 块级热区）。**保守律**：无法证明已冻结者一律留热区（尾段换行串 ∕ 悬空构造 ∕ 行首块标记未定型 ∕ 尾转义 ∕ 尾 `*` 串）；热区跨度上界 = 最近未闭构造跨度（病态：长未闭构造期间帧成本退全量 md 同阶——登记）。**画件契约**：无缓存 ∕ 复位径 = **分片全绘**（head ∕ 开段 ∕ 热区三段——与 `md(raw)` 分片恒等）；增帧 = 提交段追加（段内 `mdInline` 语境 ∕ 块级 `md` 语境）+ 热区换代；非前缀扩展（编辑 ∕ 回放 ∕ 换文）∕ 热区失连 ⇒ 复位全绘；异常 ⇒ `textContent = raw`（现状语义）**+ 复位**（内部冻结态清空——冻结切点 ∕ 已挂节点账弃；下一帧增径起点 = 分片全绘径）。**语义机检** = 分片恒等式（语料）+ 真 DOM 逐步对拍（增量面 ≡ 全量参照） | 用户报障尾账（层消后残留）：真机实测 80KB 帧 p95 = **15.4ms**（基线段）∕ **31.8ms**（密文段 = markdown 密度 ≈2× 变体），根因 = 全量 md 重渲 + 活 `innerHTML` 整面替换（诊断分解：`innerHTML` ≈5–6ms + `md` ≈1.5ms + 样式重算 ∕ 帧尾扫描 ≈2–4ms）；探针负载 = 单段 80KB（无空行）⇒ 块级冻结零收益、段内冻结为必需形 |
| KD-RC-11 | **续写支文本节点合并（`appendAdvisorChunk` 两处）**：文本 ∕ 推理续写支（`:63-66`）与 toolOutput 续行支（`:47-49`）由逐 chunk `createTextNode` + `appendChild`（永不合并）改**并入末文本节点**——末子为文本节点 ⇒ `appendData(str)`（原地并写）；末子非文本节点 ⇒ 维持新建（兜底）；首行 `textContent = str` 不动。**语义等价**：RAW 拼接逐字同（`textContent` 读出恒等）· **零视觉差**（节点边界不参与布局 ∕ 样式；`tailLines` ∕ 行合并判据 ∕ 复制等消费面全按读出串工作）· 消费面（`renderSubagentChunk` 调用侧）零改 | 实测命中：冻结窗 DOM 文本节点 **102,179** ∕ 元素 3,014——`DIV.advisor-text.advisor-think` 族 ≥12 个、单 div 直属文本子节点至 **16,272**（逐 chunk 建节点 ⇒ 节点洪峰 ≈95K+）；文本节点 ∕ 行 O(chunks) ⇒ **O(1)**；承载面遍历成本随节点数增长的冻结签名（四案在册）——E2「钉点命中才动」分支兼现 |
| KD-RC-12 | **斜径机制入核 · 命令表归端**：核增纯函数档 `thincoder-render-core/composer/slash.mjs`——`parseSlash(text)` ∥ `routeSlash(text, commands)`（判据 = trim 后首字符 `/`、首 token 小写、别名解析；条目形 = `{ name, aliases?, rejectKey?, run(ctx) → boolean }`）；输入面板缝 = `deps.slash = { commands, actions }`（**可选——不传 ⇒ 现行为零变**）；命中 ⇒ 本地执行、**不进消息径**（**零消息径上行**——零 `msg:send` ∥ `queuedUserMessage`、零用户块、零 loading；**模式三钮动作照走 `session:flags`——同钮径不变**）；`run` 返真 = **已受理**（已执行 ∨ 二段交互在场——`/auto` 确认 popover 径同判）⇒ 清框 + 入历史 ∥ 返假 = 未受理（门拒）⇒ 文本保留（+ 条目 `rejectKey` 反馈）；未知 ⇒ toast `slash.unknown <name>`（键 ↔ 发射点单表 = §5 条 6）。**动作句柄面** `actions = { openModelMenu, toggleAuto, togglePlan, toggleEng }` = 钮 handler 提取的同一函数（**同钮同门**——单一实现；键形 ∥ 落点 = §5 条 6）；反馈两键（`slash.unknown` ∥ `slash.args`）经端注册面供给（先例 = `input.slotFull`）。**（`/help` 增量）**`/help` = **流内打印形**（对位 CLI `cmd-help` 实盘：标签 ∥ 组序 ∥ `名字 (别名)` ∥ 描述逐行）；核增 `formatHelp(commands, t)`（表→行集 · 纯函数）∥ `/help` 打印口 = **端侧表构造期闭包注入**（`createSlashCommands(printHelp)`——`deps.slash` 与 `ctx` 零改，见 §5 条 6）；`/h` 别名在册；未知反馈携 `/help` 指引。**边界**：键位补全 = 不做；其余 22 条 CLI 命令 = 另批 ∥ 不做；VSC 零接缝（不传 `deps.slash`）。 | 用户走查（桌面敲 `/model` 无反应；「要啊」）；复用优先核查 = 全树无既有斜杠机制（CLI 表 = CLI 自持 ∥ 核 `queued.mjs` 只做队列分类 ∥ VSC 无面）⇒ 新建机制落共享层 · 命令表归端 |
| KD-RC-13 | **附件面扩文本/源码档 · 发送时内联「路径头 + fenced 段」**：核 `thincoder-render-core/composer/attach.mjs` 采集面扩文本/源码族——受纳判据 = 扩展名 ∈ `TEXT_EXTS`（导出）∨ `text/*` 前缀（`isTextFile`）；选择器 `accept` 同源派生（`"image/*,text/*," + TEXT_EXTS`）；三限 = 单档 ≤ **256 000** B（`TEXT_MAX_BYTES`）· **每回合**（= 每次发送前的未发列表——发送即清列）≤ **4** 档（`TEXT_TURN_MAX_FILES`）· 合计 ≤ **512 000** B（`TEXT_TURN_MAX_BYTES`；**KB = 1000 B** 口径——词面同）——**档数 ∥ 合计两限含在飞档**（判据 = 已入列 + 在飞：`pendingCount` ∥ `pendingBytes`——受理即入账、读毕 / 失败销账）；读 = `readAsArrayBuffer` ⇒ 前 8000 B NUL 扫描（二进制判据——git `buffer_is_binary` 同窗）⇒ UTF-8 解码入列 `{ name, size, text }`（读失败（`error` ∥ `abort`）⇒ 出声拒）；拒面一律出声（六键 toast——`composer.attach.{tooLarge,tooMany,totalLimit,binary,unsupported,readFailed}`）；发送时（`panel.mjs` `send()` 两径 = 忙态排队 ∥ 直发——满队拒收判之后）`withAttachedFiles(text, files)` 内联——每档 = 头行 `[Attached file: <文件名>]` + fenced 段（围栏 = 反引号 × max(3, 内容最长串 + 1)；info string = 扩展名去点）；**回显 ∥ 上行 ∥ 迟到补写三面同串**（`message` 单值）；图片道（栅格门 ∥ 粘贴径 ∥ `images` 列 ∥ `toImages` ∥ 宿主落盘 ∥ 降级）**零改**。 | 用户走查（「attach 其实只能传图片……我自己贴了文件路径你才读到的」）；采集 ∕ 芯片 ∕ 发送三面已在核（一端两处同源）⇒ 一处扩展两端同收；内容入消息 = 不经落盘（零临时件 ∥ 零清理面；跨工作区文件同可达）；文件名 = 两端可得之最全标识 |
| KD-RC-14 | **模型菜单行 = 分组/展开控件**：行件 `role="option"` + `aria-selected` 退场 ⇒ **`role="button"` + `aria-expanded`**（随本行组体开合同拍；「当前模型归属」由组体内条目 ✓ 勾选承载）；行点击 = **展开⇄收起**（未展开 ⇒ 沿 `openFlyout` 全行为：一次一浮出 ∥ 过滤框聚焦；已展开 ⇒ 组体退场）+ **组体开合与菜单层开合解耦**（行点击不关菜单——点外 ∥ Esc ∥ 条目拾取照旧关）；行径**恒零 `post` 零槽写**（零 `selectModel` / `selectReasoning`）；**拾取单点 = `click`**（`mousedown` 仅 `preventDefault` + `stopPropagation`——消双发 ∥ 避「mousedown 关菜单 ⇒ 幽灵点击」）+ **`onPick({ provider, model, row })` 携 `row`**（= 渲染时行对象；新键 · 向后兼容——缺 ⇒ 回查，查无 ⇒ `console.error` 一行；菜单在场期候选换行集零丢点）；**组体收起单点 = `closeFlyout`**（摘件 + 行标 `data-flyout-open` + `aria-expanded` 同拍——悬停移出 ∥ 行点击两径共一门） | 用户口径「行 = 分组/展开、无选中语义」（旧账「行点击只保浮出」注文退场）+ 缺陷名「整行点击静默无操作」；核件单源 ⇒ 两端同收 |
| KD-RC-15 | **子块内容面四律**（嵌套子标 ∥ 状态词写点 ∥ 顾问名 ∥ `started` 幂等）：① **行首子标**——`flow/block.mjs` `appendLineText`（`:87-94`）：`sub` 在场 ⇒ 行首 `span.advisor-sub` 渲 `<sub> · `，无 `sub` ⇒ 纯文本；两接入点 = `:63` 工具行 ∥ `:79` 文本/思考行；`toolOutput` 同工具同 `sub` 续写并入末文本节点（`:55-57`，判据含 `dataset.sub`）⇒ 子标只一份。② **状态词写点 = `subblocks/activity-view.mjs` `noteChunk` 单函数三支**（`:203`）：工具行支 `:209-212` ∥ 顾问名支 `:213-219` ∥ think 例外支 `:222-230`；think 只在 `stateWord == null ∧ m.sub` 非空时写 `<sub>/<think 词>`，已有状态词零改写（CLI `currentTool` 同规）。③ **顾问名**——`face === "toolOutput" ∧ tool === "advisor"` ⇒ 写 `<sub>/advisor`（顶层 `advisor`），**只写名字**：顾问产出走 `toolOutput` 通道而输出面按设计不入状态词 ⇒ 不写名字则整段空白。④ **`started` 幂等**——`subblocks/state.mjs:177` `if (block.queued) block.stateWord = null`（`:178` 置 `queued = false`）：清空只在 `queued → running` 那一次成立，心跳重发不清（否则标题每 ~2 s 闪回裸词）。形态单源 = `docs/vsc/design/WEBVIEW.md` §5.2 ∥ §5.6；用例 = T-A33 ∥ T-A38 ∥ T-A41–T-A45 | 用户三次现象倒逼（2026-09-07 子代身份无处显示 ∥ 2026-10-20∘21 think 吃掉子代理名 ∥ 2026-10-21 标题闪回 + 顾问整段无名）：共同点 = **父子是两个实体**——块头是父的，子的事必须在行面看得见；而「谁的 ∕ 什么事 ∥ 什么内容」三件事各有承载面：身份进行首（子标）、此刻做什么进状态词（工具行）、正文只进块体（状态词不搬正文）。清空语义只在「排队标注要撤掉」成立——超出该语义的清空是语义外溢，表现为标题闪回 |

## 3. 核边界 · 逐模块判定表（VSC webview 50 档 · 单源）

三值判定：**核**（整体入核：零宿主特权仍可运行）· **拆**（纯迁移 / 呈构件入核 + 出站 / 句柄 / 分发留端注入）· **端**（留适配层：端协议 / 端结构 / 端能力）。
依据 = 勘察实读行号（宿主三张：A = `state.js` import · B = 直用 `postMessage` · C = `--vscode-*` 直用）——**行号 = 勘察时点读数**（会随代码漂移；以源码为准，本表不回填）。

| # | 档 | 判定 | 依据 / 说明 |
|---|---|---|---|
| 1 | `activity-diag.js` | 端 | 诊断留痕上行（`:81` 上行 `panelDiag`）——端观测面（**痕迹族 = 端观测面 ⇒ 桌面不接——无诊断上行面；缺省 no-op ⇒ 零行为差异（给由）**；留端清算） |
| 2 | `activity-new.js` | 端 | 活动区计数钮（`:21` / `:33`）；桌面**同面补装**（R10 落——`thincoder-desktop/renderer/views/activity-new.mjs`（实读 **100**）；未跟底计新生 ∕ 点钮回底清账——单源 = 本档 §2 同族裁定） |
| 3 | `activity-view.js` | **核** | 块头 / 状态词 / 尾 3 行 / ⏹ 控件（核 `thincoder-render-core/subblocks/activity-view.mjs`——`refreshBlock` ∥ `updateStopButton` ∥ `noteChunk` ∥ `tailLines`；VSC 端档 `thincoder-vscode/webview/activity-view.js` = 2 行 `export *` shim，零逻辑）——零 A / B / C；块头与状态词形态单源 = `docs/vsc/design/WEBVIEW.md` §5.2；行首子标形态单源 = `docs/vsc/design/WEBVIEW.md` §5.6 |
| 4 | `activity.js` | **拆** | 块态机（出生 `thincoder-render-core/subblocks/state.mjs:103` / 接管 `:124` / 冻结 `:47` / 归档 `:93` 的**迁移判据**）入核；出生位 / 归档入流的 DOM 编排留端（`thincoder-vscode/webview/activity.js:48` / `:104`）；**块级跟滚原语入核**（`thincoder-render-core/subblocks/block.mjs` `initBlockFollow` / `maybeScrollBlock`——提核；**应用时机契约在核 ∕ 触发源在端**（帧合并 ∕ 更新纪律收核）——单源 = §2 KD-RC-8 ∕ KD-RC-9） |
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
| 20 | `lib.js` | **核** | 纯工具集（`:15` `tailTruncate` · `:27` `MAX_TOOL_OUTPUT` · `:73` `toolFailureStatus` · `:94`）——零 DOM 零宿主 |
| 21 | `loading.js` | 端 | 忙态门 / 按钮换位（`:67` / `:86`） |
| 22 | `md.js` | **核** | Markdown 渲染 + **全量转义闸**（`:67` / `:106` / `:146` / `:151`） |
| 23 | `mode-buttons.js` | 端 | 端模式钮（桌面端面自持——**模式钮住输入区控件行（写路 `session:flags`）∥ 四态呈现 = 状态行行首 banner 四段**；撤会话头批后收正） |
| 24 | `model-menu.js` | 端 | 端选择器（内联 CSS 用宿主变量 `:40-69`） |
| 25 | `model-picker.js` | 端 | 端模型钮 + 推理下拉（`:13` / `:40-68`） |
| 26 | `onboarding.js` | 端 | 端引导（桌面首启向导自持） |
| 27 | `panels.js` | **拆** | 任务 / 目标面板**构树 + 显隐判据**入核（`thincoder-render-core/cards/panel.mjs:17` / `:26` / `:67` / `:74`）；挂起 / 回合态 / 目标消息分流留端（`thincoder-vscode/webview/panels.js:81` / `:108` / `:118`） |
| 28 | `permission.js` | **拆** | 审批卡面构树入核（`thincoder-render-core/cards/permission.mjs:60` / `:105`）；`postMessage` 三出口留端注入（`thincoder-vscode/webview/permission.js:15-19`） |
| 29 | `question.js` | **拆** | 提问卡面构树入核（`thincoder-render-core/cards/question.mjs:13`）；出站留端（`thincoder-vscode/webview/question.js:15-18`） |
| 30 | `pending-band.js` | **端** | 待发送带面（`ensureBand` ∥ `renderBand` ∥ `paintPendingOverflow` ∥ `applyBusyQueued` ∥ `clearPendingBand`）——纯 DOM 与快照来源留端；机制单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 ⑦ |
| 31 | `scroll.js` | 端 | 回底钮与可见性（`:13-20`） |
| 32 | `search.js` | **拆** | 会话内搜索（Ctrl+F）——实现整件入核（`thincoder-render-core/search.mjs` `createSearch`——R6 上提）；端壳留 `root` 绑定（VSC `ctx.messagesEl` ∕ 桌面 `[data-slot="flow"]`）——键位注册随核件工厂（两端同件单源 = `docs/desktop/design/UI.md` §1 交互行）；**披露缝 `deps.reveal`（可选）**：命中件展现前置钩，缺省零变（VSC 调用面单 `root` 逐字不动；桌面供巨块隐藏段放窗） |
| 33 | `send.js` | 端 | 发送路径与守卫（`:13` / `:23-26` / `:32-`） |
| 34 | `session-bar.js` | 端 | D18 = **对位**而非共用（多标签结构不削）；元数据形见 `docs/desktop/design/UI.md` §1「批注（对齐重定位）」项 4 |
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

**计数（D3）**：50 档 = **核 9**（`activity-view` · `diff` · `highlight` · `i18n` · `lib` · `md` · `toast` · `tool-card-restore.mjs` · `tool-summary`）· **拆 7**（`activity` · `panels` · `permission` · `question` · `search` · `streaming` · `ui`）· **端 34**。

**静置面（本轮不改动）**：`activity-new.js` / `activity-diag.js` / `autocomplete.js` 三档在本轮核化射程外（端差或后议）。

## 4. 逐机制对位表（22 机制 × 桌面 · 单源）

口径：机制清单 = VSC webview 会话流呈现机制归并（勘察逐档清点）——**22 行**；列 4 = 桌面接核判定四值：
**自然成立**（接核即有 · 无桌面增量）· **需补面**（桌面侧须补入站 / 归约 / 形态）· **显式裁**（有意不承载或口径改判——须登记理由与被否）· **改判**（原判定随「对齐」口径收正——行 16）。

| # | 机制 | VSC 承载（file:line） | 核承载件 | 桌面接核判定 |
|---|---|---|---|---|
| 1 | Markdown 渲染（含转义闸） | `md.js:67` / `:106` / `:146` | `md.mjs` | **显式裁（改判）**：桌面由 `pre-wrap` 纯文本改为经核 Markdown——KD-RC-4 |
| 2 | 语法高亮 | `highlight.mjs:165`（R1 迁核） | `highlight.mjs` | **自然成立**（随 md；代码块面由核给 `<pre class="code-block">`） |
| 3 | 流式增量渲染（rAF 降频缝合） | `streaming.js:36-79` / `:112` | 核缝合件 | **需补面**（核件分件消费 · 桌面外壳留存）：帧尾就地重渲经核 `paintStreamTarget`；**推理面经核 `paintReasoningTarget`**（专用画笔 = 通用画笔 + `scrollTop = scrollHeight` 钉底——「对齐第二批」项 1；不接则思考块不跟底）；流式档位分派 / 落位留桌面（`renderer/events.mjs` `onToken` + `thincoder-desktop/renderer/views/chat-stream.mjs`）；**更新纪律已收核**（帧合并件 `flow/frame.mjs` 桌面接装：触发源 = store 变更 ⇒ `mark`；单源 = §2 **KD-RC-9**） |
| 4 | 推理块（think） | `streaming.js:81-107` | 核推理块构件 | **需补面**：核回调 `onReasoning`（`thincoder-core/agent.mjs:273`）未接——桌面 `agent-bridge.mjs` 补回调（现九键）+ 新通道 + 归约块型（块型 `reasoning` 已在桌面五型内） |
| 5 | 帧 / 块容器（回合块与 idx） | `ui.js:176-189` | 核块容器构件 | **需补面**（核件分件消费 · 桌面外壳留存）：块容器 = 桌面描述符树留存（三锚 `data-block-kind` / `data-block-id` / `data-seg` 不动）；文本面 / 推理内容经核 `md`——否「整件替换核 DOM」 |
| 6 | 工具卡面 | `ui.js:203` / `:281` / `:329` | 核工具卡构件 | **需补面**（核件分件消费 · 桌面外壳留存）：工具结果面经核 `capText`（渲染单源）；卡壳四段头 / 折叠 / 耗时 / 改动摘要留存（`thincoder-desktop/renderer/views/chat-tool.mjs`）；`formatToolSummary` / `isToolFailure` **不消费**（非缺口——卡面单源 = `docs/desktop/design/UI.md:25`「四段头 + 改动摘要」· 成败判据单源 = `docs/desktop/design/IPC.md:40` 载荷 `ok`） |
| 7 | 工具摘要单源 | `tool-summary.js:35` | `tool-summary.mjs` | **显式裁（不消费 · 非缺口）**：桌面摘要住**主进程**（`thincoder-desktop/src/main/agent-bridge.mjs` `summarizeArgs`）——核 `formatToolSummary` 不消费（登记句 = 本表行 6） |
| 8 | 工具输出增量（含 64K 截断） | `chat-messages.js:70-89` · `lib.js:27` | 核截断 + 呈现件 | **自然成立**（桌面 `ev:tool-output` 通道 + `events.mjs:125-135` 累积已在；截断口径随核） |
| 9 | 工具结果收尾（成败 / 耗时 / 折叠） | `ui.js:318-326` · `lib.js:73` / `:94` | 核判据 + 卡面 | **自然成立**（桌面 `events.mjs:140-156` 收尾 + `durationMs` 已在；成败判据单源 = `docs/desktop/design/IPC.md:40` 载荷 `ok`——核 `isToolFailure` 不消费 · 登记句 = 本表行 6） |
| 10 | 行级 diff（审批预览） | `diff.js:13` / `:90` | `diff.mjs` | **显式裁（不消费）**：桌面审批卡无 `changes` 预览面且需求 §3.1:50 明写「不做 diff」——核含、桌面不消费 |
| 11 | 代码块复制 | `streaming.js:218-231` | 核复制控件 | **需补面**：桌面现只有块级 / 末条复制（KD-22）⇒ 真代码块复制随核落 |
| 12 | 文件链接 | `ui.js:247` · `chat.js:71-79` | 核 linkify | **承载（「对齐第三批」D19）**：验存链 + 核包裹 + `file:open`（行定位 = 编辑器 CLI 探测）——单源 = `docs/desktop/design/PROJECT.md` §2 **KD-39**；核侧 `linkify` 消费面在 |
| 13 | 消息窗口裁剪 | `ui.js:446-454`（150 块） | 不入核 | **已消（对齐）**：VSC `MAX_MESSAGE_BLOCKS`（`ui.js:204`）= 150（DOM 裁帽 · 滚动上取回填）∥ 桌面 `MAX_RENDER_BLOCKS`（`chat-scroll.mjs:25`）= **150**（150 方向裁已落；回填链已在）；「非同判据」判定经复核改记（差为机制性：>150 块会话可见）——**两端窗值对齐、端差零残留**；核不夺 |
| 14 | 懒历史回填 | `history.js:43-88` | 不入核 | **显式裁（各自）**：桌面回填 / 补偿算式已在册（`docs/desktop/design/RENDERER.md` §3）；核化候选另议（§9） |
| 15 | 跟滚 / 回底 | `ui.js:426-468` · `scroll.js:13-20` | 不入核 | **显式裁（各自）**：桌面跟滚 / 药丸已在册（`docs/desktop/design/RENDERER.md` §3 判据） |
| 16 | 队列标记（待发送） | `webview/pending-band.js`（派生带面；机制单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 ⑦） | 核 `flow/queued-mark.mjs`（`QUEUED_MAX_ITEMS:15` ∥ `paintLabel:18` ∥ `markPending:26` ∥ `clearPending:34`） | **改判（对齐第二批）**：桌面**接核标记原语**（`markPending` / `paintLabel`——标记类与标签两形态字面单源）+ **队列按会话分键**（`pending: { [会话键]: [{ text, ts }] }`）⇒ **输入区上方待发送带（非流内）**（单源 = `docs/desktop/design/UI.md` §1「批注（对齐第二批 · 六件）」项 2） |
| 17 | 忙态门 / 载入态 | `loading.js:86` / `:67` | 不入核 | **自然成立**（桌面忙态 = 位标 `running` + 输入区判据已在） |
| 18 | 审批卡 | `permission.js:21` / `:86` | 核卡面 | **按 ② 同判（卡族外壳留存）**：桌面 `thincoder-desktop/renderer/views/approval.mjs` 自持卡面（三出口 / 批形已在）；不迁核卡面件（VSC 形态——与桌面锚系 / 用例相抵） |
| 19 | 提问卡 | `question.js:10` / `:59-76` | 核卡面 | **按 ② 同判（卡族外壳留存）**：桌面 `thincoder-desktop/renderer/views/question.mjs` 自持卡面（两作答路已在）；不迁核卡面件 |
| 20 | 计划 / 任务面板 | `panels.js:16` / `:39` | 核面板构树 | **按 ② 同判（面板外壳留存）**：桌面计划卡（`thincoder-desktop/renderer/views/plan.mjs`）自持构树；不迁核面板件；搜索（`search.js`）**桌面已承载**——核件 `createSearch` 直取（端壳 = `thincoder-desktop/renderer/search.mjs`——R6 落） |
| 21 | 子代理活动区（live 面板） | `activity.js` · `activity-view.js` | 核块态机 + 块面 | **需补面**：桌面右列重定位为子 agent 面板（D20——通道 / 归约 / 形态三面 + **出生自愈**：宿主存活投影 2s 再断言（拍体沿 `thincoder-vscode/src/extension/panel-messages.mjs:42-74` 语义——只发在飞实例）；见 `docs/desktop/design/IPC.md` §1）；**块面直消费（对齐第二批）**：`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` / `renderSubDesc`（内容回显 = tail-3 / 展开）+ **归档入流**（终态 ⇒ 流内尾追块；表项墓碑 `region: "flow"`；核 effects 表不逐条执行——端面动作由模型态幂等派生）；单源 = `docs/desktop/design/UI.md` §1「批注（对齐第二批 · 六件）」项 3 / 5 |
| 22 | 状态栏 / 状态行 | `status-bar.js:13` | 不入核 | **显式裁**：桌面状态行**对齐 CLI**（D17）而非共用 VSC 状态栏——15 段逐项裁定表住 `docs/desktop/design/UI.md` §1 批注 |

**计数（D3）**：22 行 = 自然成立 **4**（行 2 / 8 / 9 / 17）· 需补面 **9**（行 3 / 4 / 5 / 6 / 11 / 18 / 19 / 20 / 21）· 显式裁 **8**（行 1 / 7 / 10 / 12 / 13 / 14 / 15 / 22）· 改判 **1**（行 16）。

**「显式裁（各自）· 核不夺」口径限定（与 KD-RC-8 ④ 关系随拍）**：核不夺 = **实现载体**不夺（行 13 ∕ 行 14 实现各端自持）；**滚动策略族四载体**（块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流）：族实现 = **核抽核件**（`thincoder-render-core/scroll.mjs`——判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件一处实现；端 = 工厂消费——帧调用点 ∕ 计数呈现 ∕ 钮形；零行为变更）；
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

**跨包对拍锁**：文法副本漂移锁 = `relayPathOf` ∕ `RELAY_PREFIX_RE` ∥ 权威 `thincoder-core/agent/relay-prefix.mjs` 逐字对；`routeSubToken` ∥ `relayEventToSubPatch` 语义同判（F2 ∕ F4）；

**落位不变式（两条 · 留端清算）**：① **出生位 = 活动区区尾 append**（端实现锚 = VSC `thincoder-vscode/webview/activity.js:60`；桌面 `thincoder-desktop/renderer/views/pool-subagents.mjs:85-95`）；

  ② **归档入流 = 消费轮边界前插入、边界失效 ⇒ 常规块插入点退化**（VSC `thincoder-vscode/webview/activity.js:104-110`；桌面 = 同形——`insertBefore(块, 边界)`：边界 = `ev:digest start` 标签行、收帧清边界；座次入模；三端消化面统一——单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）——与核效果表 `archive`（`atBoundary`）同口径。

3. **构件族（DOM）**——`renderBlock({ idx, withLabel })` · `renderToolCard({…})` / `finishToolCard(ref, name, text, links, truncated, deps?)` / `renderToolHistory(name, text, idx)` · `renderReasoning(model, deps?)`（默认态见本节推理块默认态条）；
   `renderApprovalCard(model, deps?)` / `renderBatchApprovalCard(model, deps?)` · `renderQuestionCard(model, deps?)` · `renderTaskPanel(progress, deps?) → { el, visible }` / `renderGoalPanel(goal, deps?)` ·

   `renderSubBlock(model)` / `refreshBlock(block)` / `renderSubagentChunk` / `renderSubDesc`（子 agent 块面与归档块面——消费面段 ③）；

   `initBlockFollow(block)` / `maybeScrollBlock(block)`（块内容区跟滚原语——接线 ∕ 应用；旗标 = 手势门控让位 + 无条件近底自愈，让位期出口钮 `sub-follow-btn` 随原语自持（`sub.follow.*` 两键）；**应用时机契约在核（应用点清单：追加后 · 挂载后 · 帧尾复核）∕ 触发源在端**（帧合并 ∕ 更新纪律收核）——单源 = §2 KD-RC-8 ∕ KD-RC-9）；

   `attachCopyButtons(container, deps?)` · `showToast(text)` · `linkifyPaths(bodyEl, links)`（VSC 消费） · `createSearch({ root, reveal? })`（会话内搜索面——Ctrl+F 键位注册 + 扫描 ∕ 高亮；两端端壳供 `root`）；

   `appendToolOutput(el, text, deps?)`（**工具输出 O(1) 追加**——
  占位清（`deps.initial`）∕ 超 `MAX_TOOL_OUTPUT` 截断（注字面 = `capText` 缺省注单源）∕ `_capped` 停收；VSC 活卡消费改指 ∥ 桌面工具卡消费）。

   `reveal(el)` = **可选披露缝（尾行收口）**——命中件展现前置钩：`showCurrentMatch(scroll)` 真值径 ⇒ `reveal` 先于 `scrollIntoView`；探针抛错 ⇒ `console.error` 一条 + 跳转照常；缺省零变（VSC 调用面单 `root` 逐字不动）。

    **推理块默认态**：默认展开——`renderReasoning` `details.open = true`（`thincoder-render-core/flow/reasoning.mjs:16`）；恢复径 `thincoder-render-core/flow/block.mjs` `buildAssistantRestore` 同拍（`<details class="reasoning-block" open>`——`:108`）——实时径与恢复径同一默认态，重开会话不改变呈现；手动折叠仍可只看摘要。

    **理由**：折叠态在界面上等同「没有活动」——看不出模型在跑还是在卡（用户 2026-10-19 14:23「感觉像没在动一样，默认不要折叠」）。原裁定 #875（2026-10-04「默认折叠」）由此推翻；两处档头注释随推翻就地收正（`reasoning.mjs:8`–`:9` ∥ `block.mjs:99`–`:101`——「默认折叠」的现行口径删掉，#875 只作 as-of 出处）。

    **三面一致**：核缺省改一处，消费面同收——VSC 两径（`thincoder-vscode/webview/streaming.js` 活流块 ∥ `thincoder-vscode/webview/ui.js` 恢复帧）∥

    服务器成员面网页（`thincoder-server/public/views-me-chat.mjs:12` `:244`，经 `/rc/*` 取核包——`thincoder-server/src/webui/static.mjs:56`）∥ 成员面回读径（`thincoder-server/public/views-me-chat-messages.mjs:13` `buildAssistantRestore`）。

    **构造点 = 两处（成员面 live 径不新增构造点）**：成员面 live 径的 `<details>` 亦由 `renderReasoning` 造（`thincoder-server/public/views-me-chat.mjs:244` `renderReasoning({})` 取其 `el`）。

    重渲器只画内容——`thincoder-render-core/flow/stream.mjs:28`–`:31` `paintReasoningTarget(el, raw)` = 画件 + 尾钉底，全篇零 `details` 构造（`:72` 消费 `deps.reasoning()` 取回的 `el`）。

    桌面不消费本件（自持 `thincoder-desktop/renderer/views/chat-text.mjs:55` `open: true`——默认态已是展开）。

    **弃选 = 按端参数化**（`renderReasoning(model, deps)` 收 `deps.expanded`、`buildAssistantRestore(msg, deps)` 同收，VSC 传真、成员面留假）：同一核件不设无理由的端差——差异只允许来自宿主能力差（用户 2026-10-19 14:26「体验要一致」）；参数化另给 VSC 两径各加一处传参面。

   **`configureActivityView({ tailLines })`**：折叠预览行数缝（模块级 setter——沿 `configure*` 先例；缺省 3 ∥ 允许 0；消费 = VSC `ui-prefs.js` 随 `uiPrefs` 应用）。

    **子块内容面三件（§2 KD-RC-15）**：`appendAdvisorChunk(block, kind, text, sub, meta)`（核 `flow/block.mjs:42`）——第 4 位 `sub` = 行首子标来源：非空 ⇒ 行首 `span.advisor-sub`（`appendLineText` `:87-94`）、缺席 ⇒ 纯文本；第 5 位 `meta` = 续写合并判据（`face` ∥ `tool`——`:55-57`）+ 续写并入末文本节点（子标一份）；

    `noteChunk(block, kind, text, m)`（核 `subblocks/activity-view.mjs:203`）——状态词写点单函数三支（工具行 ∥ 顾问名 ∥ think 例外）；`started` 支（核 `subblocks/state.mjs:177`）——状态词只在 `queued → running` 清一次。

    形态 ∥ 判据单源 = `docs/vsc/design/WEBVIEW.md` §5.2 ∥ §5.6（本档只给机制与坐标，不重述规则）。

4. **调度族（更新纪律 · KD-RC-9）**——`createFrameMerge(deps)`（**帧合并件**：脏标记 `mark(keys)` ∕ 单飞 rAF ∕ `FRAME_MIN_MS`(50) 最小间隔 ∕ `flush()` 同步尾帧；`deps = { apply(dirtyKeys), raf?, now?, minMs? }`——应用器契约 = §2 KD-RC-9）· `FRAME_MIN_MS`（常量——与核 `STREAM_RENDER_MIN_MS` 同值同意）；
   ＋ **增量 md 画件（§2 KD-RC-10）**——`liveCut(raw, from = 0) → { cut, blockStart, inline }`（**冻结切点扫描器**——纯件；保守判定：段内构造封闭点 ∕ 块闭点；无法证明者留热区）· `paintLiveMd(el, raw)`（**分片画件**——冻结段提交 ∕ 热区换代 ∕ 兜底复位；`paintStreamTarget` ∕ `paintReasoningTarget` 同签名改走本件——VSC ∕ 桌面调用点零改）。

   **实施落形 = 两档**：扫描器 `liveCut` 住 `thincoder-render-core/flow/live-scan.mjs`（**351 行**）· 画件 `paintLiveMd` 住 `thincoder-render-core/flow/live-md.mjs`（**179 行**——`liveCut` 经本档再出口，签名不变）。

5. **滚动策略族（`thincoder-render-core/scroll.mjs` · KD-RC-8 ④ 收正——留端清算）**——`NEAR_BOTTOM_PX`（= 24 · **唯一数值源**；`thincoder-render-core/subblocks/block.mjs` ∕ `views/chat-scroll.mjs` 改再出口保名）；
   `nearBottom(el)`（三读数归一 + 严格小于——判据逐字同式）· `applyPin(el, gate)`（旗标门 `!== false` ⇒ 写 `scrollTop = MAX`——超值不读 `scrollHeight`；写口单源）；

   `createPinWatch(el, { holder = el, flagKey, gestureGateMs, onNearBottom, onGesture }) → { read, set, attach, detach }`（**旗标维护单源 = `holder[flagKey]`**——近底 ⇒ 无条件翻真（自愈）＋ `onNearBottom`；远离底 ⇒ `gestureGateMs` 内手势翻假（块 = 600）∥ `gestureGateMs = 0` ⇒ 滚动事件按近底直写——活动区 ∕ 池列 ∕ 对话流现行语义 · 零行为变更）；

   `createUnreadCounter(el, { countKey })`（计数簿记 `bump` ∕ `clear` ∕ `read`——清账三路：钮点击 ∕ 近底 ∕ 换代）；

   端消费 = 帧调用点 ∕ 计数呈现 ∕ 钮形（逐端置换零行为变更）——核 `thincoder-render-core/subblocks/block.mjs` 改薄包 ∕ VSC `thincoder-vscode/webview/ui.js` 四函数（旗标宿主 `ctx`）· 桌面 `views/activity-new.mjs` ∕ `views/chat-scroll.mjs`。

6. **输入面板族（`composer/`）**——`createComposerPanel(deps)`（输入行 ∥ 键位 ∥ 提交面 ∥ 忙态派生；
   注入面六项 = `root` ∥ `post` ∥ `state` ∥ 取词注册面 ∥ `hooks` ∥ `slash`——逐项面单源 = `thincoder-render-core/composer/panel.mjs` 档头）· `createModelMenu(deps)`（`openModelMenu({…})` ∥ `closeModelMenu()` 模块级导出同源）·

   **模型菜单候选三态（`createModelMenu` · 空表 ≠ 未到）**：候选供给为 `null`（未到）⇒ 渲「加载中」行；为**空数组**（已到且空）⇒ 渲「无可用模型」行、不渲分组（两态文案各持一键）；锚元素无 CSS 盒（零矩形）⇒ 面板落位取视口居中兜位，不落视口左上角。

   **两态文案键的载体**：`model.loading`（既有）∥ `model.empty`（新增）**只住端侧字典**——`thincoder-server/public/i18n-zh-core.mjs` ∥ `i18n-en-core.mjs`、`thincoder-desktop/renderer/i18n-composer.mjs`（en ∥ zh 两块）、`thincoder-vscode/locales/en.json` ∥ `zh.json`。

   核字典 `thincoder-core/i18n.mjs` 不收 `model.*`——该容器边界 = 核域文案（压缩 / 消化 / 限流 / 异步池 / 会诊 / 任务 / goal / 思考状态），面板文案归端侧；VSC 面缺键时 `t()` 回退返回键名（`thincoder-vscode/src/i18n.mjs:66`）。

   `createControlsRow({…})` · `createAtMenu({…})` · `createAttachBar({…})`；消费面 = VSC `thincoder-vscode/webview/input.js` 等接线档 ∥ 桌面 `thincoder-desktop/renderer/mount-composer.mjs` 装配。

   **候选面三纯件（随 `#1529` 实装登记）**：`thincoder-render-core/composer/model-menu-state.mjs` **10** 行——`menuStateOf(models) → "loading" ∥ "empty" ∥ "list"`（三态判定单源，渲面与单测共用）；

   `thincoder-render-core/composer/model-menu-place.mjs` **23** 行——`computePlacement({ anchorRect, viewport, panelHeight, panelWidth = 270, up }) → { left, top }`（零矩形 ⇒ 视口居中兜位）；

   `thincoder-render-core/composer/model-menu-labels.mjs` **16** 行——`PROVIDER_SHORT` ∥ `shortName`（逐字迁自 `model-menu.mjs`）。`model-menu.mjs` 侧 = 三处接线（`place()` 退化为「取矩形 → 纯件 → 写样式」）。

   **附件面扩文本/源码档（§2 KD-RC-13）**：`createAttachBar` 返回面补 `files`（列 = `{ name, size, text }`；与 `images` 同式 `length = 0` 保身份清点）；

   增导出面 = `TEXT_EXTS` ∥ `isTextFile(file)` ∥ 三限常量（`TEXT_MAX_BYTES` ∥ `TEXT_TURN_MAX_FILES` ∥ `TEXT_TURN_MAX_BYTES`）∥ `formatFileBlock({ name, text })` ∥ `withAttachedFiles(text, files)`（末两件 = 内联形成纯函数——`panel.mjs` `send()` 消费）；

   `send()` 两径（忙态 ∥ 直发——满队拒收判之后）就地快照清列 + 内联，回显 ∥ 上行同用内联后串（`message` 单值）。

   **斜径面（§2 KD-RC-12）**：`thincoder-render-core/composer/slash.mjs`——`parseSlash(text) → { name, args } | null` ∥

   `routeSlash(text, commands) → { kind:"command", cmd, args } ∥ { kind:"unknown", name } ∥ null` ∥ **`formatHelp(commands, t) → { kind:"label"|"group"|"cmd", text }[]`**（表→行集——标签 ∥ 组头（CLI 同序；组缺者与无组条目跳过）∥ 命令行 `名字 (别名)  描述`；`/help` 增量用——纯函数，`t` 参数注入）。

   **`deps.slash` 完整键形（可选——不传 ⇒ 现行为零变）**：`deps.slash = { commands }`（**打印口不在 deps 键内**）——`commands` = 命令表（条目形 `{ name, aliases?, group?, descKey?, rejectKey?, run(ctx) → boolean }`；端侧构造，落点 = `thincoder-desktop/renderer/slash-commands.mjs`；

  `group` ∥ `descKey` = `/help` 增量增面）；**`/help` 打印口 = 端侧表构造期闭包注入**（`createSlashCommands(printHelp)`——行文 = 端表本体经核 `formatHelp`；返 boolean——`true` = 已打印；`ctx` 零改——下拦截段句）；

   `actions` = 动作句柄表 `{ openModelMenu, toggleAuto, togglePlan, toggleEng }`（各 = 钮 handler 提取的同一函数——门随函数；落点 = `composer/model-menu.mjs` ∥ `composer/controls.mjs` 导出面；**装配 = 面板从两工厂实例导出面取**（`createModelMenu` ∥ `createControlsRow` 返回面——同函数性只能在实例处成立）；

  端侧注入 = `{ commands }`（`thincoder-desktop/renderer/mount-composer.mjs`——打印口 = 表构造期闭包））。

   **`send()` 拦截段**（「空文本 → 无会话守卫」后、「忙态入队」前）：`routeSlash` ⇒ 未知 ⇒ `showToast(t("slash.unknown", { name }))` + 文本保留；命中 ⇒ `cmd.run({ args, raw, post, actions })`（`/help` 条经闭包打印口——`printHelp?.() === true` 可选链）；

   **`run` 返值**：返真 = **已受理**（已执行 ∨ 二段交互在场——
  `/auto` 确认 popover 径同判：popover 在场 = 提交面职责已完成、文本使命已尽）⇒ 清框 + 入历史；返假 = 未受理（门拒）⇒ 文本保留 + （条目 `rejectKey` 在场 ⇒ `showToast(t(rejectKey))`）。

   **反馈键发射点（一行表）**：`slash.unknown` = 面板层（route 未知径——**值携 `/help` 指引**（CLI `thincoder-cli/src/tui/slash-commands.mjs:130` 前段逐字；`/help` 增量收正））· `slash.args` = **run 前门**（`cmd.run` 调用前——`args` 非空通用拒；在册命令均不收参）·

   `slash.busy` = **已退役**（模型钮忙态门随解锁放开——`/model` 恒受理、条目零 `rejectKey`；端两语键随退役）；同类 = `/plan` ENG 态拒 ⇒ `rejectKey = toolbar.planDisabled`（复用既有键）。`run` 本体只调 `ctx.actions`（`/help` 条经闭包打印口——零第二实现）。

   **解锁批注（模型切换解锁）**：模型 ∥ 推理两钮**全放开**（任意忙态可点 / 可开——`modelSwitchBlocked` ∥ `applyModelSwitchGate` 退场；`disabled` / `aria-disabled` / 进忙关浮层三事全消）；**回写门保留 + 更名 `writebackBlocked`**（`models` 推送自动回写忙态零回写——防陈旧推送回声覆写）；

   写面保护 = **偏好键单写者**（回合关联落盘不携 `activeProvider` / `activeModel` / `effort`——播种除外）；桌面施加顺延单源 = `docs/desktop/design/COMPOSER.md` §1 **KD-19**；VSC 落盘保护 = `docs/vsc/design/WEBVIEW.md` §4.2。

   **模型菜单条目（单源 = §2 KD-RC-14）**：`openModelMenu({ anchorEl, models, value, onPick, footer?, up? })`——provider 行 = 分组/展开控件（`role="button"` + `aria-expanded` 随本行组体开合同拍；行点击 = 展开⇄收起；行径零 `post`）；菜单层（`.mm-overlay` / `.mm-panel`）**不因行点击而关**（组体 ∥ 菜单层两级解耦；组体收起单点 = `closeFlyout`）；

   条目拾取单点 = `click`（`mousedown` 仅 `preventDefault` + `stopPropagation`）；`onPick({ provider, model, row })`——`row` = 渲染时行对象（**新键 · 向后兼容**：
   VSC 三消费面（`settings-models.js` ∥ `settings-providers.js` ∥ `settings-consult-dialog.js`）不读该键 ⇒ 零影响）；消费者优先取 `row`、缺 ⇒ 回查 `_models`、查无 ⇒ `console.error` 一行（零静默）。

   VSC 侧消费 = 10 行 re-export shim（`thincoder-vscode/webview/model-menu.js:10`——逐字不动）。

**端注入面（核不持句柄）**：`deps = { emit(type, payload), t, now? }`——出站一律经 `emit`（VSC 绑 `postMessage`；桌面绑 `invoke`）；R2 构件件另注入端事实读取族（`connectedOf` / `regionOf` / `trace` / `syncLiveOf` / `onStripped`——逐件件头）；核内零全局单例（现 VSC 的 `ctx` / `S` 全局态属端）。

**桌面消费面（对齐第二批扩 · 单源 = 本段；机制 / 判据措辞单源 = `docs/desktop/design/UI.md` §1「批注（对齐第二批 · 六件）」）**：① 纯函数 / 状态机族扩 = `paintReasoningTarget`（推理钉底——项 1）；

② `queued-mark` 两导出（`markPending` / `paintLabel`——用户块标签两形态与待发送标记；项 2 / 4）；`clearPending` 桌面不消费——消费面单源 = 本档 §9「对齐第二批」②；

③ 构件族四件（`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` / `renderSubDesc`——右列子 agent 块面与归档块面；项 3 / 5）；

④ **核件取词接线（`setStrings` 注册单点）**（核件内取词走核 i18n——注册单点 = `thincoder-desktop/renderer/app.mjs`（`setStringsSink(setStrings)` 一次注册）；`initDict` 合并式经注册端出（`thincoder-desktop/renderer/i18n.mjs` = node-safe 档——零 `/rc/` 静态导入；判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」）；

核件所需键入宿主表（`sub.*` / `msg.*`——**值逐字同 VSC locales**，沿 `msg.copy` / `msg.copied` 先例）；
`queued.pending`（核 `thincoder-render-core/flow/queued-mark.mjs:30` 取词）在 VSC 侧零键——值源 = 桌面表 `thincoder-desktop/renderer/i18n.mjs:211` / `:319`）。

⑤ **调度族 + 追加原语（更新纪律收核）**：`createFrameMerge`（帧合并——触发源 = store 变更 ⇒ `mark`；桌面接装单点 = `thincoder-desktop/renderer/app.mjs`） · `appendToolOutput`（工具卡结果区 O(1) 追加——`thincoder-desktop/renderer/views/chat-tool.mjs` 消费；VSC 同件改指 `thincoder-vscode/webview/chat-messages.js:77-96`——零行为变更）。

**样式契约**：核构件类名 = 被抽档现行名（KD-RC-7）；**内容面视觉对齐 VSC（值以 VSC webview 实值为源）**；**外壳 = 端侧自有面（VSC 无对位件——不构成端差）**——VSC 沿用 `chat.css` / `controls.css`（零改）；
  桌面 = `thincoder-desktop/renderer/core.css`（核类名 → 桌面值映射）+ 值变量单源 = 主题表 `thincoder-desktop/renderer/theme.css`（亮暗两套）。
  落定 = 需求 §4 **D21** · 用户走查裁定 B。

**「会话流经核」= 渲染逻辑单源**（核件分件消费：`md` / `attachCopyButtons` / `renderReasoning`〔推理块壳 · 结构同形〕/ `capText`）；**桌面外壳留存**（三锚 / 滚动 · 回填 · 窗口裁剪——核不夺）。

**内容面视觉映射口径（三律 · 下表判据）**：

1. **宿主主题色角色对位**——VSC `--vscode-*` 族（前景 / 边框 / 链接 / 错误）落桌面主题表对应变量（`--fg` / `--line` / `--accent` / `--warn`）：**角色对齐 · 值随端主题**（桌面主题体系零动——需求 D21 边界）。
2. **语义常量值照搬**——语法配色 / 叠加层 rgba / 尺寸 / 圆角 / 透明度 / 字号比例：VSC 实值逐字为源（新增变量入主题表亮暗两套）；**字族栈例外 = `--mono`**（角色对位 / 近似——宿主编辑器字族，见变量表）；**排版通道限定（D29）**——字族 ∥ 字号 ∥ 行高 ∥ 字距以 §5「排版统一覆盖」块为准（本律「字号比例」枚举于该通道被接管；结构 ∥ 盒值 ∥ 色面零改）。
3. **盒层单层律**——文本面**内嵌件**（代码块 / 表格 / 引用 / 行内码 / 复制钮）的盒模型值照搬；**块壳已承载者不搬**（块内边距 / 边框 / 圆角归桌面壳层 `chat.css`）——两处内边距叠加即观感偏离（端差登记 = §9）。

**桌面主题表新增变量（12 个 · 亮 / 暗两值 · 单源 = `thincoder-desktop/renderer/theme.css`）**：

| 变量 | 亮 | 暗 | VSC 源（实值同字面；例外 = `--mono` 行——角色对位 / 近似） |
|---|---|---|---|
| `--mono` | `"Cascadia Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Microsoft YaHei UI", "Microsoft YaHei", monospace` | 同亮 | **角色对位 / 近似**（宿主编辑器字族 `--vscode-editor-font-family`，随宿主设置）——字面出处 = `thincoder-desktop/renderer/core.css:29`（上收为主题变量）；`thincoder-vscode/webview/base.css:74` 该行回退栈 = 系统 UI 栈；**栈形态（轻通道轮三）**——首字 Cascadia Mono + 中文雅黑入栈；系统依赖在册（Cascadia 用户级安装〔两档 + 两注册〕，未装回落 Consolas——仓内零资产） |
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
| 2 | 段落 + 首尾留白 | `thincoder-vscode/webview/chat.css:68-69`（`p { margin: 0 0 6px }` · `p:last-child { margin-bottom: 0 }`） | `p { margin: 0 0 6px }` + `p:last-child { margin-bottom: 0 }`；**删首子归零规则**（现 `core.css:12-15` 的 `> :first-child`）——VSC 首件保留自身上边距（**直接值**）；**容器级收窄**：`> :last-child { margin-bottom: 0 }` ⇒ **`p:last-child` 单条**（逐字对齐 VSC——非 p 尾件〔代码块 ∕ 表格〕底距两端同；落点 = `renderer/core-markdown.css:25-30`） |
| 3 | 标题 h1–h6 | `thincoder-vscode/webview/chat.css:63-66` · `:126`（h5）· `:127`（h6） | 逐级字号 / 边距 / 字重：h1 `1.3em` `12px 0 6px` `700` · h2 `1.15em` `10px 0 4px` `700` · h3 `1.05em` `8px 0 4px` `600` · h4 `1em` `6px 0 2px` `600` · h5 `0.95em` `5px 0 2px` `600` · h6 `0.9em` `4px 0 2px` `600` **+ `opacity: 0.8`**（VSC `--textSecondary` 未定义 ⇒ 回退 `--fg`）；现制「一律 `1em` / `600` / `10px 0 4px`」⇒ 本值（**直接值**） |
| 4 | 列表 ul / ol / li + 嵌套 | `thincoder-vscode/webview/chat.css:111-112` · `:129` · `:130-132` | `ul { margin: 4px 0 6px; padding-left: 20px }`（圆点标记 ≈8px——零动）· `ol { margin: 4px 0 6px; padding-left: calc(5ch + 2px) }` · `ol { list-style: decimal }` · `li { margin: 2px 0; line-height: 1.5 }` · 嵌套三条同值（**直接值**）；现值 `8px 0` / `22px` ⇒ 本值；**编号列表缩进**：标记盒 =「`<n>. `」**含尾空格**、右缘贴内容线 ⇒ 所需缩进 =（位数 + 2）ch——值 = `calc(5ch + 2px)`（≈43.0px@`--fs` 14，随字号自适应；1–3 位全容；**来源 = 核渲染面**）；**4 位不设防**（用户裁）；VSC 侧同值（`:129`——纯对齐 + 富余预置，无紧贴裁切缘；技术待办随该修复核销（核销依据 = 源级读链——VSC 实机复现未做））；**实机取证法 = 逐行字形簇计数**（标记区簇数 = 位数 + 1——被裁则减一；来源 = 核渲染面） |
| 5 | 引用 blockquote | `thincoder-vscode/webview/chat.css:134-141` | `margin: 6px 0` · `padding: 6px 12px` · `border-left: 3px solid var(--line)`（**复用**）· `background: var(--hover-bg-strong)`（**新增变量**）· `border-radius: 0 4px 4px 0`（**直接值**）· **`color` 撤 `--fg-muted`**（VSC `--textSecondary` 未定义 ⇒ `--fg`） |
| 6 | 行内码 code | `thincoder-vscode/webview/chat.css:71-78` | `font-family: var(--mono)` · `font-size: 0.9em` · `background: var(--hover-bg-strong)`（**新增变量**）· `padding: 1px 5px` · `border-radius: 3px` · `word-break: break-word`（**直接值**） |
| 7 | 代码块壳 `pre.code-block` | `thincoder-vscode/webview/chat.css:80-88` | `margin: 8px 0` · `padding: 0` · `border: 1px solid var(--line)`（**复用**）· `border-radius: 6px ⇒ 0`（**扁平化——代码块族归零**——单源 = `docs/desktop/design/UI.md` §1「批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行）」项 2；推理内残留 6px ∥ 3px 观察在册） · `overflow: hidden` · `background: var(--overlay)`（**新增变量**）· `position: relative`（既有）；现值 `padding: 8px 10px` / `overflow: auto` / `var(--bg)` ⇒ 本值 |
| 8 | 语言条 `.code-lang` | `thincoder-vscode/webview/chat.css:90-98` | `display: block` · `padding: 3px 10px` · `font-size: 10px` · `color: var(--fg)`（**复用**）· `opacity: 0.5` · `border-bottom: 1px solid var(--line)` · `font-family: var(--mono)`；现值 `--fg-muted` / `12px` / `margin-bottom: 4px` ⇒ 本值 |
| 9 | 代码体 `.code-block code` | `thincoder-vscode/webview/chat.css:100-109` | `display: block` · `padding: 8px 10px` · `overflow-x: auto` · `font-family: var(--mono)` · `font-size: 0.88em` · `line-height: 1.5` · `background: transparent` · `border-radius: 0`；现值 `12.5px` / `padding: 0` ⇒ 本值 |
| 10 | 语法高亮 `tk-*`（9 类） | `thincoder-vscode/webview/base.css:371-379`（变量 = `thincoder-vscode/webview/base.css:27-33` / `:51-57`） | **桌面现零 `tk-*` 规则 = 高亮不可见（首要缺口）** ⇒ 9 条规则照落：`.tk-keyword` → `--syn-kw` · `.tk-string` → `--syn-str` · `.tk-comment` → `--syn-cmt` + `font-style: italic` · `.tk-number` → `--syn-num` · `.tk-type` → `--syn-type` · `.tk-property` → `--syn-prop` · `.tk-atrule` → `--syn-atrule` · `.tk-class` → `--syn-type` · `.tk-id` → `--syn-atrule`（**新增变量 7**） |
| 11 | 表格 | `thincoder-vscode/webview/chat.css:154-159` | `border-collapse: collapse` · `margin: 8px 0` · `font-size: 0.9em` · `width: 100%`（**直接值**）；现值缺 `font-size` / `width` |
| 12 | 表头 / 单元格 | `thincoder-vscode/webview/chat.css:161-170` | `th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left }` · `th { background: var(--hover-bg-strong); font-weight: 600 }`（**新增变量**）；现值 `2px 8px` / 无表头底色 ⇒ 本值 |
| 13 | 链接 a | `thincoder-vscode/webview/chat.css:114-115` | `color: var(--accent)`（**复用**）· `text-decoration: none` · `a:hover { text-decoration: underline }`（**直接值**） |
| 14 | 行内强调 strong / em / s | `thincoder-vscode/webview/chat.css:123-124` · `:143` | `strong { font-weight: 700 }` · `em { font-style: italic }` · `s { text-decoration: line-through; opacity: 0.7 }`（**直接值**；核 `md` 产 `<s>`） |
| 15 | 图片 img | `thincoder-vscode/webview/chat.css:172-175` | `max-width: 100%`（既有）· `border-radius: 4px`（**直接值**） |
| 16 | 分隔线 hr | `thincoder-vscode/webview/chat.css:117-121` | `border: 0` · `border-top: 1px solid var(--line)`（**复用**）· `margin: 10px 0`（既有同值） |
| 17 | 任务清单勾选 `.task-check` | `thincoder-vscode/webview/chat.css:145-151` | `margin-right: 6px` · `vertical-align: middle`（既有）· `pointer-events: none` · `[disabled] { opacity: 0.85 }`（**直接值**） |
| 18 | 推理摘要 `.reasoning-summary` | `thincoder-vscode/webview/chat.css:286-294` | `font-size: 12px` · `color: var(--fg)`（**复用**）· `opacity: 0.5` · `font-style: italic` · `cursor: pointer` · `user-select: none`；**`padding: 4px 10px`（VSC 逐值）**；尾缀 `content: "…"`（字形面）保留 |
| 19 | 推理内容区 `.reasoning-content` | `thincoder-vscode/webview/chat.css:393-401` | `padding: 6px 10px`（VSC 逐值）· `border-top: 1px solid var(--line)`（**复用**）· `font-size: 12px` · `opacity: 0.65` · `line-height: 1.45` · `max-height: 200px` · `overflow-y: auto` · `word-break: break-word` · `color: var(--fg)`（有效前景——VSC 不单设、继承 `body`）｜`margin-top: 6px` / `--fg-muted` 承接**均收** |
| 20 | 推理块内 Markdown（标题 / 段 / 行内码 / 列表） | `thincoder-vscode/webview/chat.css:404-414` | `h1, h2, h3 { font-weight: 700; margin: 8px 0 4px }` · `p { margin: 0 0 5px }` + `p:last-child { margin-bottom: 0 }` · `code { font-family: var(--mono); background: rgba(127,127,127,.15); border-radius: 3px; padding: 1px 4px; font-size: 0.92em }`（**直接值**＝ VSC `--bg2` 缺省回退值）· `ul { margin: 4px 0 6px; padding-left: 18px }` · `ol { margin: 4px 0 6px; padding-left: calc(5ch + 2px) }`（编号标记富余——判据 ∕ 取证法同面 4；值住 `renderer/core.css`——晚载后落者胜）· `li { margin: 2px 0 }` · `strong` / `em` 同 14 行；**代码块来推（消——VSC `:408-409` 覆盖段照落 + `.code-lang` 零样式）** |
| 21 | 代码块复制钮 `.code-copy-btn` | `thincoder-vscode/webview/base.css:386-401` | `position: absolute; top: 6px; right: 6px`（既有）· `padding: 3px 8px` · `font-size: 11px` · `border: 1px solid var(--line)`（**复用**）· `border-radius: 4px` · `background: var(--overlay)`（**新增变量**）· `color: var(--fg)`（**复用**）· `opacity: 0.4` · `transition: opacity 0.15s, background 0.15s` · `:hover { opacity: 1; background: var(--hover-bg-strong) }` · `.copied { opacity: 1; color: var(--green); border-color: var(--green) }`（**新增变量**）；现值 `--fg-muted` / `--bg-raised` / `.copied` 用 `--accent` ⇒ 本值 |

**计数（D3 · 内容面口径）**：**21 面**（1–21 = 正文 ∥ 段落 ∥ 标题 ∥ 列表 ∥ 引用 ∥ 行内码 ∥ 代码块壳 ∥ 语言条 ∥ 代码体 ∥ 高亮 ∥ 表格 ∥ 表头单元格 ∥ 链接 ∥ 强调 ∥ 图片 ∥ 分隔线 ∥ 勾选框 ∥ 推理摘要 ∥ 推理内容 ∥ 推理内 md ∥ 复制钮）；新增变量 **12**（`--mono` / `--hover-bg` / `--hover-bg-strong` / `--overlay` / `--green` / `--syn-*` 七）；端差 **0**（内容面——
  ① 盒层单层 已落 ∕ ② 推理内代码块同形 消）。

**排版统一覆盖（D29 · 桌面侧）**——需求 §4 D29 ∥ 决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-57**；本块修正**桌面侧**排版通道（字族 ∥ 字号 ∥ 行高 ∥ 字距 ∥ 字重强调通道）——上表（21 面）相应面按本块收正；**结构 ∥ 盒值 ∥ 色面 ∥ 语法配色仍随 VSC**（D21 三律余域零改）；**VSC 侧 ∥ 核包零改**。

基线与修饰（桌面侧）——基线 = 字族 `--font`（⇒ `--mono` 栈）∥ 字号 `var(--fs)`（14px——轻通道轮五定版〔12 ⇒ 14〕）∥ 行高 `var(--lh)`（1.3——轻通道轮四定档）∥ 字距 `var(--ls)`（`normal`）；修饰 = **相对（em）或非尺度通道**（粗体 ∥ 斜体 ∥ 色 ∥ 底 ∥ 边框）——**绝对 px 清零**。逐面收正（面号 = 上表）：

- 面 1 正文：`line-height: 1.55 ⇒ var(--lh)`；族 ∥ 号取基线变量（值同现——零观感位移）。
- 面 3 标题 ∥ 面 6 行内码 ∥ 面 9 代码体 ∥ 面 11 表格：**相对修饰值不动**（1.3–0.9em ∥ 0.9em ∥ 0.88em ∥ 0.9em——「基线 + 相对修饰」；语义来源 = 用户「除了 markdown 里标了的」；**读法待核准**）。
- 面 8 语言条：`font-size: 10px ⇒ var(--fs)`（绝对岛清零）。
- 面 12 表头 ∥ 面 14 行内强调：`th 600` ∥ `strong 700` **不动**（markdown 标记豁免）。
- 面 18 推理摘要 ∥ 面 19 推理内容：`12px ⇒ var(--fs)`；面 19 行高 `1.45 ⇒ var(--lh)`。
- 面 21 复制钮：`11px ⇒ var(--fs)`。
- 余面（2 ∥ 4 ∥ 5 ∥ 7 ∥ 10 ∥ 13 ∥ 15 ∥ 16 ∥ 17 ∥ 20）：**零改**（间距 ∥ 盒 ∥ 色 ∥ 结构面）。
- 落点 = `thincoder-desktop/renderer/core-markdown.css` ∥ `thincoder-desktop/renderer/core.css`（值改零增行）；核包（`thincoder-render-core/**`——含 `composer/composer.css` 逐字锁）**零改**——核件消费面（输入面板 ∥ 模型菜单 ∥ 搜索条）收敛走桌面覆盖段（`thincoder-desktop/renderer/chat-composer.css`）。
- ★上抛①（字族）= **全端排版基线**（`--font: var(--mono)`——观感变化最大一项）；否决 ⇒ 回退配方 = `docs/desktop/design/PROJECT.md` §2 **KD-57** ⑥。
- **`select` 本体行高豁免（真机判据 · 平台面）**：Blink 把 `select` 本体 computed `line-height` 固定 `normal`（内联 ∥ 表则 ∥ `!important` 均不可达——页面 CSS 不可承载）⇒ 白名单外平台豁免（同壳 `option` ∥ `input` ∥ `button` 可控已归基线）；证据 = 单元测试档读数 `selectExemption` 段。
**会话面板面（桌面会话控制面）映射表 = `docs/desktop/design/UI.md` §1 批注项 2**（端壳面，非核产出件——本档不重述）。
**落点与预算（内容面口径）**：`thincoder-desktop/renderer/core.css`（行数判时现读，内容行数口径）；
  `thincoder-desktop/renderer/theme.css`（行数判时现读，内容行数口径；主题表 12 变量在册）；逐面真机比对 = 需求 §4 D21 验收。

## 6. 受影响文件与测试（三端）

口径：内容行数（文末换行不计）；「结构不变」= 档职责边界不动；「现行」列 = 该行落笔时的读数，判时按盘现读（不载 as-of 快照）。

**核包（新建——R1 已落）**：`thincoder-render-core/package.json` · `md.mjs` · `highlight.mjs` · `diff.mjs` · `lib.mjs` · `tool-summary.mjs` · `i18n.mjs`（R1——逐字搬迁：行数 = VSC 原档现行值，见下表） ·

  `flow/*.mjs`（块 / 工具卡 / 推理 / 缝合）· `cards/*.mjs`（审批 / 提问 / 计划）· `subblocks/*.mjs`（态机 / 块面）（R2） · `test/*.test.mjs`（平 node 直测——**纯函数层 + 态机层**）。

  **DOM 构件层用例宿主 = 消费端测试树**（非核包）——核包自身零 devDep（C1 机检恒可过），不引 happy-dom ∥ 不另立第二假 root。

**扩展端（判定表 16 档 + 发行三件）**——逐档「现行 ⇒ 预期」（核 9 = 迁核；拆 7 = 纯面迁核 · 端留守）：

| 档（`thincoder-vscode/webview/`） | 现行 | 预期 | 判定 | 迁出面 / 注（越层档带拆分预案） |
|---|---|---|---|---|
| `md.js` | 266 | 核 ±0（266） | 核 | 逐字搬迁；VSC 侧原档不再持逻辑——2 行 shim（零逻辑再导出） |
| `highlight.js` | 198 | 核 ±0（198） | 核 | 核 `highlight.mjs` 逐字搬迁；VSC 原档**删除**（零消费面——原唯一消费者 `md.js` 已核化） |
| `diff.js` | 99 | 核 ±0（99） | 核 | 核 `diff.mjs:6` = 逐字性**唯一例外**（引用行重指 `esc as escHtml` ← 核内 `./md.mjs`——`escHtml`〔`ui.js:419-421`〕 ≡ `esc`〔核 `md.mjs:151-153`〕同构；对拍 225 项 0 mismatch）；VSC 档 = 2 行 shim；桌面不消费——§4 行 10 |
| `lib.js` | 99 | 核 ±0（99） | 核 | 核 `lib.mjs` 逐字搬迁；VSC 档 = 2 行 shim |
| `tool-summary.js` | 122 | 核 ±0（122） | 核 | 核 `tool-summary.mjs` 逐字搬迁；VSC 档 = 2 行 shim |
| `i18n.js` | 33 | 核 ±0（33） | 核 | 核 `i18n.mjs` 逐字搬迁；VSC 档 = 2 行 shim |
| `activity-view.js` | 200 | 核 ±0（200） | 核 | 核 `subblocks/activity-view.mjs` 逐字搬迁（`:10` 一处引用行重指）；VSC 侧 = 2 行 `export *` shim |
| `toast.js` | 22 | 核 ±0（22） | 核 | 核 `toast.mjs` 字节全同；VSC 侧 = 2 行 `export *` shim（`showToast._t` 同一函数对象） |
| `tool-card-restore.mjs` | 82 | 核 ±0（82） | 核 | 核 `thincoder-render-core/flow/tool-card-restore.mjs` 逐字搬迁（`:12-14` 三处引用行重指）；VSC 侧 = 2 行 shim（仅测试消费） |
| `activity.js` | 450 | ≈ 260–320 | 拆 | 迁出态机迁移判据 ⇒ 核 `subblocks/state.mjs` + `subblocks/channel.mjs`；低于带（实迁出量大于估值——另承接 `renderSubBlock` / 判据族等原档内联段）⇒ 拆分预案消解（未误拆） |
| `ui.js` | 469 | **222**（内容行数口径） | 拆 | 迁出四构件面（块容器 / 工具卡 / 恢复面 / 错误横幅）⇒ 核 `thincoder-render-core/flow/block.mjs` + `thincoder-render-core/flow/tool-card.mjs`；带内 ⇒ 拆分预案消解（未误拆） |
| `streaming.js` | 262 | ≈ 150–190 | 拆 | 迁出 rAF 缝合 + md 重渲 + 推理块 + 复制钮 + chunk 构图 ⇒ 核 `thincoder-render-core/flow/stream.mjs` / `thincoder-render-core/flow/reasoning.mjs` / `thincoder-render-core/subblocks/block.mjs`；带内 |
| `panels.js` | 142 | ≈ 90–110 | 拆 | 构树 + 显隐判据 ⇒ 核 `thincoder-render-core/cards/panel.mjs`；略高于带（端侧保 2s 定时器与消息分流）；挂起 / 回合态 / 分流留守 |
| `permission.js` | 122 | ≈ 80–95 | 拆 | 构树 ⇒ 核 `thincoder-render-core/cards/permission.mjs`；低于带（实迁出量大于估值）；三出口留守（端注入） |
| `question.js` | 89 | ≈ 60–70 | 拆 | 构树 ⇒ 核 `thincoder-render-core/cards/question.mjs`；低于带；出站留守 |
| `search.js` | 165 | 改指核件 ⇒ **18**（内容行数口径） | **拆** | 端壳（`root` 绑定 + 侧效应注册）——实现整件入核 `thincoder-render-core/search.mjs` |

**发行三件 + 测试**：`thincoder-vscode/package.json`（依赖 +1）· `.vscodeignore`（反排除 +1 行）· `scripts/check-vsix.mjs`（断言 +1）。

**桌面端**：`thincoder-desktop/package.json`（依赖 +1）· `src/main/protocol.mjs`（双根 + `/rc/`）· `scripts/check-dist.mjs`（产物断言）· `renderer/*` 三面重定位（R3a–R3c）。

  `renderer/core.css` ∥ `renderer/theme.css` 的现行读数见本档 §5「落点与预算」；两值规则——值源 = `thincoder-vscode/webview/chat.css:467-468`。

**文档面**：本档（新）· `docs/desktop/design/{UI,IPC,PROJECT,RENDERER}.md` · `docs/vsc/design/WEBVIEW.md`（接入形）· `docs/core/design/ARCHITECTURE.md` + `docs/README.md`（模块地图补行——父侧面，§10 上抛）。

**测试面**：单元测试档（平 node · 随批留存）；集成测试不写 ∕ 不改 ∕ 不跑（全清令）。


## 7. 验收判据（机器可检 · 回指 D19）

| # | 判据 | 机检 |
|---|---|---|
| C1 | 核包在盘且零依赖（`dependencies` / `devDependencies` 皆空）；核档内 `.mjs` 全档 `node --check` 过 | `node --check` + 包面断言 |
| C2 | VSC 接核零回归：其集成测试全绿（逐字文案锁不动）+ **映射差分锁**（`⟦ev⟧stopped` ⇒ `{ status: "cancelled" }` 逐字 · 闭集零 `stopped` / `error` 产值——§5 全表负向） | `thincoder-vscode/test/run.mjs` |
| C3 | vsix 断言：核包在 vsix 内且版本逐字相等（照核先例断言形） | `thincoder-vscode/scripts/check-vsix.mjs` |
| C4 | 桌面加载形：`app://desktop/rc/**` 命中（`protocolStats.served` 计数）+ 逃逸门两向（负探针仍拒） | `thincoder-desktop/test`（协议面）+ 启动冒烟 |
| C5 | 桌面渲染面静态闭包：零裸包 + `/rc/` 前缀白名单成立 | 渲染面静态闭包机检 |
| C6 | 产物断言：桌面 dist 含核包 | `thincoder-desktop/scripts/check-dist.mjs` |
| C7 | 桌面 Markdown 面：含围栏代码块的文本 ⇒ 渲染含 `pre.code-block`；转义闸（注入样本 ⇒ 字面文本） | 桌面视图用例 |
| C8 | 桌面对位表 22 行在册且计数自洽（D3） | 本档 §4 |
| C9 | 帧合并件语义（脏键集合并 ∕ 单飞 rAF ∕ `minMs` 跳帧重排 ∕ `flush` 同步 ∕ `apply` 抛错不吞 ∕ 帧链不断——注入 `raf` ∕ `now`）平 node 全绿 | 单元测试档（全清令——核集成测试零触） |
| C10 | 桌面每 chunk 同步成本对文本长度近似平坦（真机探针 80KB 档 ≤0.3ms ∧ 10KB→80KB 比 ≤2——在册基线 0.0033ms ∕ 0.22）；**帧成本 p95 ≤8ms@80KB（基线段 ∕ 密文段同判；帧成本对文本长度平坦——10KB→80KB 帧成本比 ≤2）**；帧数 ≤ ⌈窗/50ms⌉+2（窗 = 1000-chunk 流的墙钟时长——探针侧读数） | 真机探针（单元测试档——R-1 ∕ R-6 ∕ R-7 ∕ R-8；两原件存续） |
| C11 | VSC 零回归：`appendToolOutput` 改指零行为变更——**复证形态**：修前副本 = git `cf48ba12~1:thincoder-vscode/webview/chat-messages.js`（可得——对拍参照 = 该副本 toolOutput 支逐字提取）+ 改动面 hunk 清点（除归因 hunk 外零改）+ 非串 `text` 域外差异一例登记；VSC 集成测试树零触（全清令——现盘空清单） | 单元测试档 + git 副本（只读取证） |
| C12 | 增量 md 语义：分片恒等式（段内 `mdInline` 分片复合 ≡ 整体 ∕ 块级 `md` 分片复合 ≡ 整体——语料逐例）∧ 画件协议（无缓存分片全绘 ∕ 增帧零重渲冻结区 ∕ 复位径 ∕ 异常回退 `textContent`（+ 复位））平 node 全绿；**运行时等价用例 = 真机探针 R-9**（真 DOM 增量面 ≡ 全量参照——`textContent` 逐字 + 结构归一） | 单元测试档 + 真机探针（R-9）；全清令——核集成测试零触 |
| C13 | 帧内组合（就地改 + 追加）不回落：`streamDelta` `patch-append` 判据 ∕ `alignPlan` combo 对齐（含滑窗 ∕ 守卫例）∘ `settleFrame` combo 支（尾节点就地 + 追加段挂载——假 DOM 节点身份存续）∧ 真机边界帧零重挂（R-8） | 单元测试档（平 node）+ 真机探针（R-8） |
| C14 | **模型菜单行语义**：provider 行 = 分组/展开控件（`role="button"` + `aria-expanded`；无 `aria-selected`）；点击 = 展开⇄收起，且菜单层恒不因行点击而关；两态零 `post` 零槽写；条目拾取恰一次（`click` 单点）∧ `onPick` 携 `row`（在场期换行集仍生效） | 单元测试档（用例 a ∥ b ∥ e-3；全清令） |
| C15 | **推理块默认展开（DOM 属性断言 · 非文本）**：① live 径 `renderReasoning({}).el.open === true`；② 恢复径 `buildAssistantRestore({ reasoning: "x" })` 内 `.reasoning-block` 元素 `open === true`；**负控（同宿主）**：`d.innerHTML = '<details class="reasoning-block"></details>'` ⇒ `d.querySelector(".reasoning-block").open === false`（证明宿主真解析属性集——串匹配桩在此必红）；**修前红**：同一档在改前代码（`open = false` ∕ 恢复径不携 `open`）下 ①② 红（先例 = `docs/vsc/design/WEBVIEW.md` §5.8 修前红对照条） | 单元测试档（`thincoder-vscode/test/2026-10-19-vsc-reasoning-expanded.test.mjs`——`files.mjs` 在册）；用例宿主 = happy-dom（`thincoder-vscode` devDep `@happy-dom/global-registrator` ^20.11.2，`thincoder-vscode/package.json:156`）——DOM 构件用例宿主 = 消费端测试树（§6 口径） |
| C16 | **推理块默认展开 · 桌面臂（结构性读数）**：`thincoder-desktop/renderer/views/chat-text.mjs:55` 仍 `open: true`；`grep -r "@thincoder/render-core" thincoder-desktop/renderer` 零命中；桌面树 `git diff --name-only` 不含 `thincoder-desktop/` | 结构性读数（grep / 目检——桌面树无 DOM 用例宿主，不进单测档） |
| C17 | **子块内容面四律**（§2 KD-RC-15 · 判据单源 = `docs/vsc/design/WEBVIEW.md` §5.2 ∥ §5.6）：① 嵌套行行首有 `span.advisor-sub`（文本 = `<sub> · `）且无 `sub` 的行零 span ② `toolOutput` 同工具同 `sub` 续写后子标恰 1 个 ③ think 在状态词非空时零改写、状态词空且有 `sub` 时写 `<sub>/<think 词>`、顶层 think 载体零写入 ④ `toolOutput ∧ tool === "advisor"` ⇒ 状态词 = `<sub>/advisor`（顶层 `advisor`）且不随输出文本变 ⑤ 重发 `started` 不清状态词、`queued → running` 清一次 | 单元测试档（用例 N1–N5 ∥ S1–S3 ∥ T-A33 ∥ T-A38 ∥ T-A41–T-A45；平 node + happy-dom） |

## 8. 实施分批建议（文件面 · 串行序）

**开工前置**：核包新建面 + `thincoder-vscode/webview/**` + 桌面 `renderer/**` 三面**逐档核对**——冲突 ⇒ 串行。

**共享档串行条（本表判据）**：`thincoder-desktop/src/main/agent-bridge.mjs` · `thincoder-desktop/renderer/events.mjs` · `docs/desktop/design/IPC.md` 三档被 R3a / R3b / R3c 共触（回调面九 ⇒ 十 ⇒ 十一键 · 归约面递增 · 通道面递增）⇒ **R3a ⇒ R3b ⇒ R3c 严格串行**；任何两批不并行编辑同档（同档并行须先按批序串行落定，后批基于前批末态）。R3b / R3c 另依赖 R2 核件（见下表）。

| 批 | 内容 | 文件面 | 判据 | 串行序 |
|---|---|---|---|---|
| **R1** | 核抽取（纯函数层）+ 双端加载管道 | 核包 `md/highlight/diff/lib/tool-summary/i18n`；VSC 依赖 / 反排除 / 断言 / 六档换 import；桌面依赖 / `protocol.mjs` 双根 / guard / `check-dist` | C1–C6 + VSC 全绿 | 先行（其余批全部依赖） |
| **R2** | 核抽取（会话流构件层）+ VSC 换接 | 核包 `flow/cards/subblocks`；VSC `ui.js` / `streaming.js` / `permission.js` / `question.js` / `panels.js` / `activity*.js` 换接 | C2（零回归——含映射差分锁）+ 核档用例 | R1 后；**与 R3a 可并行**（文件面不交叠：核包 / VSC ∥ 桌面）；先行于 R3b / R3c（核件依赖） |
| **R3a** | 桌面状态行（D17） | 桌面 `agent-bridge.mjs`（`onUsage` 回调——九键 ⇒ 十键）· `agent-host.mjs`（回合尾结算携 `tokens?` / `timers?`）· `docs/desktop/design/IPC.md` `ev:usage` 载荷扩 · `events.mjs` 归约（turn 槽 / 回合起刻 / timers；`currentTool` 由视图段自 `blocks` 派生——零新槽 · 免双源）· `renderer/views/chrome.mjs` + 状态行族档（`views/statusline.mjs` + `mount-status.mjs`——R3a 已落）· `i18n.mjs` · 测试 | D17 十五段逐行判据 | R1 后（与 R2 可并行）；**R3b / R3c 随后串行**（共享三档——见上条） |
| **R3b** | 桌面右列 = 子 agent 面（D20） | 桌面 `agent-bridge.mjs`（relay 分流 → `ev:subagent`；前缀剥除；**存活投影挂点**）· 宿主存活投影 + 2s 拍体（`src/main/subagent-face.mjs` ∥ 附 `agent-host.mjs`——起 / 停 / 清点）· `docs/desktop/design/IPC.md` 新通道 + `subagent:stop` · `ipc.mjs` / `preload.cjs`（白名单 +1）· `events.mjs`（新切片 + 摘工具行）· `renderer/views/activity.mjs` 重写 · `mount-*` · 测试 | D20 四判据（五类射程 / 零工具行 / 块态机 / 停止往返）+ **出生自愈**（丢首发出生 ⇒ 一拍内复现 · 终态零再断言） | R2 后（需核态机）+ **R3a 后**（共享三档串行） |
| **R3c** | 桌面会话流经核 + 会话面板（D19 / D18） | 桌面 `renderer/views/chat*.mjs` 核件分件消费（渲染逻辑单源 · 桌面外壳留存）· `agent-bridge.mjs`（`onReasoning` 回调——十键 ⇒ 十一键）· `events.mjs`（`ev:reasoning` 归约）· `docs/desktop/design/IPC.md`（`ev:reasoning`）· `sessions.mjs`（行投影 + `activeProvider`）· `thincoder-desktop/renderer/views/sessions.mjs`（元数据族）· `styles`（核类名映射）· 测试 | C7 + D18 / D19 | R2 后（需核构件）+ **R3b 后**（共享三档串行） |

## 9. 边界（不做）

- **CLI 不入核**：ANSI 面不同源（D17 = 语义对位）；CLI 代码零触碰。
- **核不持宿主句柄**：任何 `postMessage` / `invoke` / 主题变量 / 分发循环都不得进核（§1.2 四条）。
- **核不夺两端在册机制**：滚动 / 回填 / 窗口裁剪 / 状态行（各端判据已在册——§4 行 13–15 / 22；核化候选另议，不在本轮）。
- **扩展端行为零回归**：VSC 侧接核 = 换实现不换行为（逐字文案锁 / 协议覆盖集成测试树不动）。
- **桌面多标签结构不削**；桌面零框架纪律不变；提示词面与需求档零触碰（笔权在父侧）。
- **斜径命令面**：① 键位补全（Tab）= **不做**（Web 焦点键——接管需用户裁定；机制留缝 = `slash.mjs` 语义面扩展点）；② **`/help` = 在册（同批增量——流内打印形；单源 = §5 条 6）**；其余 **22** 条 CLI 命令 = **不做**（未在册一律走未知回落，零假面）；
  ③ **VSC 命令面 = 零接缝**（不传 `deps.slash` ⇒ 行为零变）——如开另议。
- **盘面零气泡处置**：**不适用**（桌面面——需求 **D25**「消费前流内零块」：待发送件住输入区上方带，非流内块）。
- **R3 端差三项处置**：① `ev:usage` 帧门 = `percent > 0` ⇒ 取整 0 回合 `tokens` / `timers` 不达 ⇒ **修**（帧门判据改「`pct > 0` ∨ 本帧携新读数（tokens ∕ timers）」——落点 = `thincoder-desktop/src/main/agent-host.mjs` 帧发放点；判据 = 取整 0 回合三读数照达）；
  ② 「会话关闭 ⇒ 该键投影清」无端面 ⇒ **撤项**（标签面退役；现会话关闭径 = 删除（`dispose`——`ipc.mjs:164-170`）∥ 宿主退出，两径均覆盖——零缺口）；③ consult ∕ escalate 族无停止径 ⇒ **修**（核 `subblocks/activity-view.mjs` 停钮族集补 `consult` ∕ `escalate`（新常量 `CANCELABLE_ROLES`——`FAMILY_ROLES` 本体零改以保头词面语义）；判据 = ⏹ 在场 ∧ 点击生效）。
- **D21 内容面视觉端差处置**：
  ① **盒层单层（推理块）= 已落**（现盘 = VSC 逐值：`renderer/core.css:33-59`——summary `4px 10px` ∕ 内容区 `6px 10px`；§5 行 18-19 同拍）；

  ② **推理块内代码块同形 ⇒ 消**：移植 VSC `thincoder-vscode/webview/chat.css:404-414` 覆盖（`:408` pre 灰底 ∕ 圆角 6 ∕ `padding: 8px 10px`；`:409` `pre code` 归零；`.code-lang` 在 `.reasoning-content` 内零样式）——落点 = `renderer/core.css` 面 20 段；判据 = 逐值对拍 + 真机观感。
- **D21 会话面板视觉端差处置（全清单七条 = `docs/desktop/design/UI.md` §1 批注项 2，本条列核心项——本档不重述端壳面）**：
  ① **行内动作钮键盘可达项 ⇒ 消（增强向 · 用户裁定）**：VSC `session.css` 两钮（Rename ∕ Delete）补 `:focus-visible { opacity: 1 }`（对齐桌面手势；桌面侧保留 `session-list.css:130-133`——a11y 不回退）；

  ② **「不追面」重审（核心项列举——全清单七条 = `docs/desktop/design/UI.md` §1 批注项 2）**——「不追面」分类词退场：面板容器皮肤 ∕ 会话选择器交互两条 = **已消**（R13 换装 + D21 后两端构同形——实读 `session.css:13-59` ⟷ `session-list.css:8-46`）；会话条对位句 = **已消**（对位物退役——标签条 R13 裁撤 ∕ 会话头退场；对位 = VSC `#session-bar` 三件，R13-A 形换装已落）；

  `#project-btn` = **不适用**（需求边界——本端单项目模型）；`.dropdown-section` 无对位句保留（说明）。
- **「对齐第二批」端差 / 登记（源 = 「对齐第二批」设计轮 §2）**：① 助手说话人标签原语收拢候选 = **撤项**（非端差——零可见差；§10 **G** 同拍）；② `queued-mark` 的 `clearPending` 桌面不消费（消费面 = 服务端两档 `thincoder-server/public/views-chat-composer.mjs:16` / `:288` ∥ `views-me-chat-composer.mjs:28` / `:398`）· 核 effects 表不逐条执行（端面动作由模型态幂等派生）；
③ 桌面归档边界物 = **已消**（三端消化面统一——桌面收编 VSC 边界物形：`insertBefore(块, 边界)` ∥ 座次入模；单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）；④ **1s 走时刷新（块头 elapsed）已落**（VSC `panels.js` 同点）；
  ⑤ 运行期可见面 · 归档子 agent 块 = **已消解**（块体入人读线记录 ∥ 页读重建）。
- **「桌面空闲唤醒」端差 ∕ 登记**：① 消化状态行 = 端侧自持（VSC `chat-status.js` 同判「端」——核不夺）；② 子 agent 块**回收面**（消化完成逐条发 `done` ⇒ 归档入流）住桌面宿主驱动（核件 hooks 供给——与 VSC `reclaimDigestedBlocks` 同形）；③ 状态行挂起句 = 端侧词表（zh = CLI 逐字 ∕ en = VSC 逐字——双端值源登记）。

- **附件面文本/源码档**：① PDF / Office / 二进制档 = **不做**（受纳 = 文本/源码族；二进制内容 ⇒ 拒 + toast）；
  ② 剪贴板**文件**粘贴（复制文件 → 粘贴）= **不做**（粘贴径 = 图片道零改；收集径 = 选择器）；③ 全路径头 = **不做**（不可得——见 §2 KD-RC-13）；④ 无扩展名源码档（`Dockerfile` / `Makefile` 类）= 不做（受纳 = 扩展名 ∨ `text/*`——拒面出声）；
  ⑤ 空文本 + 附件 ⇒ 提交零动作（沿图片道守卫现状）；

  ⑥ **受纳 = UTF-8 可解**（登记——不可解内容 = `TextDecoder` 缺省替换字符**原样解码送出**：不另检 ∥ 不出声；给由 = 二进制主体已由 NUL 扫描挡下、残余伪文本档的出声 ∕ 检出面代价 > 残余面）。

## 10. 上抛与报告项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| A | **文件链接承载面**（D19 · KD-39）：现裁 = 承载（验存链 + `file:open`；行定位 = 编辑器 CLI 探测）——需求 §5.1 暂缓面收窄为「文件视图 ∕ 编辑器本体 ∕ 内置 diff」 | 已裁定落 | 单源 = `docs/desktop/design/PROJECT.md` §2 KD-39 |
| B | **发布单元登记**：新包 `@thincoder/render-core` **不入发布序列**（永不发布——`private: true`；两端内嵌带发、零 registry 端消费者） | 记录面随动（父侧 / 发布轮） | 依据 = 用户裁定 + §2 KD-RC-1；发布档由父侧落笔 |
| C | **地图与架构档补行**：`docs/README.md` 地图 + `docs/core/design/ARCHITECTURE.md` 模块表补核包行 | 文档随动（父侧面为常例） | 父侧执行 ∥ 随 R1 批 |
| D | **退役批文件面核对**：R1–R3 开工前与在飞批核对（§8 前置） | 实施前置 | 冲突 ⇒ 串行 |
| E | **探针两件**：① VSC 真 webview 加载 `node_modules` 相对路径核模块（dev junction 形态下）② 桌面 `/rc/` 双根供给与逃逸门 | 实现面实证 | 任一失败 ⇒ 回本档改加载形（KD-RC-1 备选 = 物化后经 `localResourceRoots` 显式扩面） |
| F | **桌面「计时」段新鲜度窗**：读数 = 核 `_pendingTimers`（`thincoder-core/agent.mjs:84`）· 刷新点 = 回合尾（`ev:usage` 同点）——**空闲期到期 ⇒ 闩到点即开 timer 轮**（timer-wake 阶段 2 已解；单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11），读数于该轮回合尾刷新 | **已解（timer-wake 阶段 2）** | 沿状态行目标读（不显倒计时）不变；不再另裁推送面 |
| G | **核侧无「助手说话人标签」原语**（核内为 `thincoder-render-core/flow/block.mjs` `renderBlock` / `buildAssistantRestore` 内联字面；桌面助手标签 = 端侧同字面落形——词键同源 / 字形住样式档） | **已裁 = 撤项** | 判定 = 非端差（两端同键同字面 ⇒ 零可见差；核侧收拢 = 无用户面收益的纯重构）——不再悬挂；核件零改 |
| H | **核件取词 = 端侧 `setStrings` 接线**（构件族签名无 `deps.t`——核内取词走模块级 `i18n.t`） | 登记（接线面） | 备选 = 核件签名改注入 `t`（改核件——另裁）；现状 = 桌面**注册单点** = `thincoder-desktop/renderer/app.mjs`（`setStringsSink(setStrings)` 一次注册；`initDict` 合并式经注册端出——判据单源 = `docs/desktop/design/SHELL.md` §1 + 本档 §5 桌面消费面段） |
| I | **需求侧性能阈值与测法**（`docs/desktop/requirements/PROJECT.md` §6 性能行「阈值与测法留设计轮」——已定形）：每 chunk 同步成本 ≤0.3ms@80KB ∧ 10KB→80KB 比 ≤2；帧成本 p95 ≤8ms@80KB；测法 = 真机计时探针 + 平 node 机检（批内两件） | 需求档落笔 = 父侧（笔权；建议文本 = 本档 §9） | 单源 = 本档 §7 C10 / C12 |
| J | **批内探针 ∕ 走查项交接**：会诊 C2 两用例（单位时间输出可见延迟 ∕ Stop 可响应）+ 探针扩面件 ⇒ 挂走查清单（防无人复启） | 父侧 |
| K | **需求档性能行**：帧 p95 ≤8ms@80KB（基线 ∕ 密文两段同判）+ 测法指针改该单元测试档——**父侧落笔**（需求档笔权） | 上抛（父侧笔） | 单源 = 本档 §7 C10 / C12 |
| L | **单元测试档两档收位 + VSC 复证坐标登记**：两测试档；修前副本出处 = git `cf48ba12~1:thincoder-vscode/webview/chat-messages.js`（复证引用——记录面随父侧） | 归父侧 | 先例 = 本档 §7 C11 记录面 |
