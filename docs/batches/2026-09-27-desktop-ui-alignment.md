# 2026-09-27 · desktop UI 对齐（渲染核 + 三面重定位）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 20:45 桌面端走查三点 + 20:48「可以。改吧」（前端共用宿主无关渲染核改判）——台账 #466–#468。
> 台账 = #466–#468（归批）。前情 = 桌面可见面修复批 `2026-09-27-desktop-visible-face-fix.md`（已收口——其五件修复 = 本批对齐的现状基线）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）

### 1.1 条目与口径（父侧 · 2026-09-27 20:5x ✓）

**来源** ✓：用户 20:45 三点走查（原文三句——见需求档 §3.6）+ 20:48「可以。改吧」（**前端共用口径改判**：桌面与扩展端共用宿主无关渲染核，两端各自适配；原 2026-09-25「自持、不共用 Webview 代码」撤销）。

**需求落点** ✓：`docs/desktop/requirements/PROJECT.md` —— §2 前端行改判 · §3.6 三方向 + 勘察摘要 · **§4 新增 D17–D20**（状态行对齐 CLI ∥ 会话面板对齐 VSC ∥ 会话流经共享渲染核对齐 VSC ∥ 右列 = 子 agent 面板）；台账 #466–#468。

**本批 = 设计批**：设计覆盖渲染核抽取（VSC 拆核 + 桌面接核）+ 三面重定位 + 会话面板对位；**实施分批由设计提出**（可拆多轮——各轮另有批档）。

### 1.2 勘察摘要（#109 报告蒸馏 · 细读以源码为准）

- **CLI 状态行**：底部 1 行、**15 段**（banner / 注意力 chip / 状态文本 / 当前工具 / 耗时 / 任务计数 / 回合 N/M / 令牌 / 上下文% / 滚动位 / 台账标记 / 计时 / 会话标题 / 排队句 / 键位组）+ 模态让位；装配 = `thincoder-cli/src/tui/render-frame.mjs:344`（`renderStatus` 纯函数）；banner 四段 = `planMode` / `autoApprove` / `advisor.guard` / `engineering`（`:221-225`）；**provider / model / effort 在顶栏**（`:42-56`）——对位勿并。
- **VSC live 面板**（`#subagent-activity`）：实体 = **子 agent 实例**（键 `sub:<role>#<id>`），射程五类（sync spawn / async 池 / consult / escalate / advisor-async——`thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`）；数据四源（relay token / 内容 chunk / **2s 心跳补发** `suspension.mjs:144-159` / 消化回收 `:107`）；位置 = 消息区与输入区之间固定带（**非右栏**——桌面为角色对位）；块面 = 头（sync|async · model · Ns · turn N/M）+ 状态词 + tail-3 + 停止钮 + 未读计数。
- **桌面现状要点**：① 状态行仅上下文占用 + 标签告警（`renderer/views/chrome.mjs:178-239`）；② 右列 = **工具调用行**（入 `renderer/events.mjs:117-122` / 收束不摘除 `:140-156`）；**relay 事件宿主已解析**（`src/main/agent-bridge.mjs:15-27`）**而渲染面丢弃**（`renderer/events.mjs:220-221`）；已登记未落两项 = `docs/desktop/design/IPC.md:35`（`ev:tool-result.subKey`）+ `docs/desktop/design/PROJECT.md:386`（上抛 L）；③ 对话流零 Markdown（既定口径 `docs/desktop/design/UI.md:19`）· **活流推理未接线**（`agent-bridge.mjs` 九回调无 `onReasoning`）· 无代码块复制 / 文件链接 / 搜索；④ 会话面板 = 左列 + 多标签（对 vs VSC 单栏下拉——元数据族缺 `provider · N msgs · updated`）。
- **宿主胶水分布（可抽性判据）**：VSC 侧唯一 API 获取点 = `webview/state.js:10`；postMessage 散布于交互模块（chat / input / send / session-bar / permission / question / settings 族 / autocomplete〔注入式〕）；**结构上最接近宿主无关** = `md.js` · `lib.js` · `tool-summary.js` · `activity-view.js` · `activity.js`（`streaming.js` 内联 1 处 `--vscode-*`）；CSS 变量经 `base.css:8-20` 映射层 + 直用散布（`chat.css` / `controls.css` / `status-bar.js:38` / `streaming.js:197`）。桌面侧 = `window.thincoder.invoke/on`（`src/preload/preload.cjs:21-33` 白名单；零直连 IPC）；`views/*` 全纯（唯二出站 = `views/approval.mjs:146` / `views/question.mjs:98`）。

### 1.3 设计命题（eng-designer 须裁）

1. **渲染核落点与形态**：核 = 宿主无关 ESM（零框架）——落点（新包 / 共享目录 / 单树 + 依赖法）· 两端加载形（VSC webview import 路径 + `localResourceRoots` / CSP；桌面 renderer 加载路径）· **零构建纪律不变**（AGENTS.md「无构建步骤、无打包器」）· 发行面（**先例坑**：`@thincoder/core` 曾因 symlink 不进 vsix——需 `--install-links`）· 核边界（逐模块判定：入核 / 留适配层——以 §1.2 胶水分布为起点）。
2. **状态行逐段裁定**（D17）：CLI 15 段 × 桌面架构（多标签 / 会话头已有 provider-model-effort / 无终端）逐段 = 承载 / 旁置 / 不适用 + 数据源（已有切片 vs 缺入站面）。
3. **右列子 agent 面**（D20）：数据链（host 已解析 relay ⇒ 入站面形——新通道 ∥ 复用 `ev:activity`；内容 chunk 分流与否）；块态机（出生 / 折叠 / 归档）与核复用度；**既有工具行去留**（`ev:tool-call` 行 ⇒ 对话流 ∨ 删——显式裁决）。
4. **会话流逐机制对位**（D19）：表 B 22 机制 × 桌面 = 接核自然成立 ∥ 需补面（Markdown · 推理活流 · 代码块复制 · 文件链接 · 帧容器…）；**「零 Markdown」口径改判须显式裁决**（改判 = 登记理由与被否）。
5. **会话面板对位**（D18）：元数据族逐项 + 交互对位；**多标签结构不削**。
6. **实施分批建议**（核抽取先行 ⇒ 两端接线 ⇒ 三面重定位；各批文件面 / 判据 / 串行序）。

### 1.4 边界与禁令

- **CLI 端不入核**（ANSI 面）——D17 = 语义对位、非代码共用；CLI 代码本批零触碰。
- VSC 接核 = **行为零回归**（其套件锁大量逐字文案 / 断言——用例面随修随加归实施轮）。
- 桌面多标签 / 多会话并行结构 **不削**；桌面零框架纪律不变。
- 退役批（#108 在飞）文件为零触碰面之核对项（实施分批须与在飞批串行核对文件面）；桌面批 / 豁免批文件零触碰。
- 需求档笔权 = 父侧（上抛只报）。

### 1.5 设计核验与上抛处置（父侧 · 2026-09-27 21:0x ✓）

**核验** ✓（父侧实读 `docs/render-core/design/RENDER-CORE.md` 全档 + 四档落点抽查）：
- 核定性四条宿主特权面（句柄 / 出站 / 主题变量 / 分发装配）· 落点 = 新真包 `thincoder-render-core/`（`.mjs` · 零依赖——判据 = 桌面 MIME 白名单 + VSC `.mjs` 先例）· 双端加载形（VSC 静态相对路径〔零占位符 / 零 `localResourceRoots`〕· 桌面 `app://` 双根 `/rc/` + 逃逸门 + guard 白名单）· 被否五候选在册。
- KD-RC-1–7 各带理由与被否（含「零 Markdown」改判 KD-RC-4 · 文件链接不承载 KD-RC-5 · 内容 chunk 取工具名丢内容 KD-RC-6）。
- 逐模块表 **51 档**（核 9 · 拆 8 · 端 34——计数自洽）；逐机制表 **22 行**（自然 5 · 补面 10 · 显式裁 7——计数自洽）；接口契约（纯函数 / 状态机 / DOM 构件三族 + `deps` 注入）· 判据 C1–C8 · 分批 R1–R3c（含 #108 文件面核对前置 + 两探针）。
- 邻档抽查 ✓：`PROJECT.md` KD-25/KD-28 + T-DSK33/36 + AG/AI 行在位；`IPC.md` `ev:reasoning` / `ev:subagent` / `subagent:stop`（白名单 27 ⇒ 28）+ 回调面收正（十一回调 ⇒ 十通道）在位。

**上抛处置** ✓：
| # | 处置 |
|---|---|
| A 文件链接 × §5.1 暂缓 | **采信 KD-RC-5「不承载」**——暂缓边界不动；日后承载须先解 §5.1（另裁） |
| B 新包入发布序列 | 父侧笔——**随 R1 实施批落**（`docs/RELEASE.md` §5.5 物化窗口同源） |
| C README 地图 + ARCHITECTURE 模块表补行 | 父侧笔——**随 R1 实施批落**（或父侧直接执行） |
| D #108 文件面核对 | R1 前置（实施批执行；冲突 ⇒ 串行） |
| E 两探针 | R1 首跑即测；失败回退路径（物化 + `localResourceRoots` 显式扩面）在案 |
| F 计时新鲜度窗 | 登记采信（沿状态行目标读，不显倒计时） |

**下一步** ✓：点火设计评审（20:08 全链授权代点火）。

### 1.6 布局收正轮与路径追溯（父侧 · 2026-09-27 21:4x ✓）

- **用户裁定**（21:2x）：「目录要分开」= **模块镜像**（`thincoder-<X>/` ↔ `docs/<X>/`）——`RENDER-CORE.md` 迁 `docs/render-core/design/`（第五部分立；先例 = desktop 2026-09-25「新增部分 = 设计笔」）。
- **收正轮**（重派舱 #1——前舱 #114 因会话重启被 Stop 腰斩 · 零残留 · 父侧核过）落：迁移 + 引用面设计侧 20 处 + `DOC-SYSTEM.md`/`README.md` 四→五部分 + **N1**（§5 全表 `[model]` 行 `syncLive` 端侧补注 + 存活投影变体行）+ `IPC.md` 坐标（`:75`/`:158`/`:170` 逐坐标实读收正）。**doc-check 父侧亲跑 = 悬空 49 · 行宽 34（净增 0）** ✓。
- **批档路径串**（**父侧直接执行**〔例外②③〕 · 可 revert）：本档 §1/§2 内旧址路径 ⇒ 新址（6 行——`:42`/`:88`/`:105`/`:139`/`:141`/`:151`）；**§3 记录面不追改**——轮 1 / 轮 2 发现表内路径 = 评审当时形（历史）。
- **P5 收正采信**：`DOC-SYSTEM.md` §5.1 P5 补「模块镜像（§4 判据句）优先于 P1」——采信（独立代码目录 ⇒ 独立部分，优先于「被 ≥2 部分引用 ⇒ core」）。
- **需求侧残留**：`docs/core/requirements/DOC-SYSTEM.md:3/:13/:24` 三处「四部分」⇒ 父侧收正（同轮）；他档「部分」残留（desktop 批记录面 · `MANIFEST.md:362` · `TWO-REPO-MERGE` · `VSC-MIGRATION` 沿革叙述）= 记录面 ⇒ 留。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成（批级判据见 2.10 · 轮 1 点修已落——明细 = 2.11 · 2026-09-27）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：✅ 设计完成（2026-09-27 · 批级判据见 2.10）

### 2.1 覆盖条目（本批设计射程）

- 需求条目：**D17**（状态行对齐 CLI）· **D18**（会话面板对齐 VSC）· **D19**（会话流经共享渲染核对齐 VSC）· **D20**（右列 = 子 agent 面板）；台账 **#466–#468**；口径来源 = 用户 2026-09-27 20:45 走查三点 + 20:48 共用口径改判（§1.1）。
- 本批 = **设计批**：交付 = 设计档 + 逐模块判定表 + 逐机制对位表 + 判据线 + 实施分批建议；**实施分批另立批档**（R1–R3c——文件面与串行序 = 核档 §8）。
- 明确**不在本批**（§1.4 边界）：CLI 代码面零触碰（D17 = 语义对位）· 需求档零触碰（笔权 = 父侧）· 桌面批 / 豁免批 / 退役批文件零触碰（开工前置 = 与 #108 在飞批核对文件面）。

### 2.2 六命题裁决（§1.3 逐条 · 理由与被否）

1. **核落点与形态** = 新顶层真包 `thincoder-render-core/`（`@thincoder/render-core` · `.mjs` · 零依赖 · DOM 构件 + 纯函数；宿主特权四条不入核）。**加载形**：VSC = webview 相对路径取 `node_modules`（零占位符 / 零 `localResourceRoots` / 零 importmap）+ `.vscodeignore` 反排除 + `check-vsix` 断言 + 发布前 `install-links` 物化（核先例同纪律）；桌面 = `app://` **双根**（`/rc/` → 核包目录）+ guard 前缀白名单 + `check-dist` 断言。零构建成立（物化 = 既有发行纪律，非构建步）。**被否五候选** = 拷入某端树 / 单树相对引用（生产不可达）/ 打包器 · 构建步（违硬约束 2）/ importmap · 动态 import（CSP + 时序新面）/ 核住单端跨树供给（所有权交叉）——核档 §1.3。
2. **状态行逐段裁定** = 15 段：**承载 12 / 旁置 2（banner · 滚动位）/ 不适用 1（键位组——斜杠命令需求 §3.5 边界）**；承载四项缺入站面（耗时 / 令牌 / 计时 = `ev:usage` 载荷扩；回合 N/M = 归约槽）。表 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1。被否 = 照搬全 15 段 / 并 VSC 状态栏 / 维持现状。
3. **右列 = 子 agent 面** = 数据链：宿主 relay 分流 ⇒ 新通道 `ev:subagent`（前缀剥除；映射单源 = 核 `relayEventToSubPatch`）+ 内容 chunk **取工具名 · 丢内容**（KD-RC-6——修现状前缀泄漏）；块态机 = 出生 / 终态折叠 / **归档 = 该会话下回合起清已终态**（修池单调增长）；**工具调用行摘除**（工具面 = 对话流工具卡）；停止出口 = `subagent:stop`（核既有取消出口）。
4. **会话流逐机制对位** = **22 行全表**（核档 §4）：自然成立 5（2 / 8 / 9 / 16 / 17）· 需补面 10（3 / 4 / 5 / 6 / 7 / 11 / 18 / 19 / 20 / 21）· 显式裁 7（1 / 10 / 12 / 13 / 14 / 15 / 22）。**「零 Markdown」改判** = KD-RC-4（理由 = 走查第 3 点 + D19；被否 = 保纯文本 / 自写第二份 md / 助手块单侧渲染）；文件链接 = 不承载（KD-RC-5——暂缓面）。
5. **会话面板对位** = 元数据族三值（provider · N msgs · updated；provider = 端壳行投影补 `activeProvider`——零核改）+ 交互对位（点选 / 改名 / 删除已在册）；**多标签结构不削**（用户明令）。
6. **实施分批** = **R1**（核纯函数层 + 双端加载管道）⇒ **R2**（核构件层 + VSC 换接）⇒ **R3a / R3b / R3c**（桌面状态行 / 右列 / 会话流 + 会话面板）；文件面 · 串行序 · 前置核对 = 核档 §8。

### 2.3 判据线（机器可检）

- 核面：**C1–C8**（核档 §7）——核包零依赖 + `node --check` · VSC 接核零回归（套件全绿）· vsix 核断言 · 桌面 `/rc/` 双根（served + 逃逸负探针）· guard（零裸包 + `/rc/` 白名单）· 桌面 dist 断言 · Markdown / 转义闸 / 代码块 · 对位表 22 行计数自洽（D3）。
- 需求面：D17 / D18 / D19 / D20 逐条 = `docs/desktop/design/PROJECT.md` §6.1 四行 + §7 **T-DSK33–T-DSK36**；15 段裁定表（D17）与元数据族（D18）各自带机检判据（零节点判据 / 未至禁假造）。

### 2.4 设计档落点（本批已落）

- **新档**：`docs/render-core/design/RENDER-CORE.md`——核面单源（落点 / 加载形 / 边界 / 逐模块判定表 51 档 / 逐机制对位表 22 行 / 接口与样式契约 / 判据 C1–C8 / 分批 R1–R3c / 上抛）。
- **就地修订**：`docs/desktop/design/UI.md`（§1「本批注（对齐重定位）」四项 + 四处行内指针 + open 摘项）· `docs/desktop/design/IPC.md`（`ev:reasoning` / `ev:subagent` 两通道 + `ev:usage` 载荷扩 + `subagent:stop`；白名单 27 ⇒ 28）· `docs/desktop/design/PROJECT.md`（KD-25…KD-28 · §4.2 十行 · §6.1 D1–D20 · §7 四例 · §8 · §9 · §10 K / Y 转「已裁」+ AG / AH / AI）。
- **未落（随实施批 / 父侧）**：`docs/vsc/design/WEBVIEW.md` 接核接入形（随 R1）· `docs/core/design/ARCHITECTURE.md` + `docs/README.md` 模块地图补行（父侧面）· 需求档（笔权 = 父侧——上抛见 2.7）。

### 2.5 受影响文件与测试面（实施批面 · 逐档 = 核档 §6 / §8）

- **新建**：`thincoder-render-core/**`（核包 + 测试）· 桌面新档（右列视图 / 状态行族——名实施批定）。
- **扩展端**：`package.json`（依赖 +1）· `.vscodeignore` · `scripts/check-vsix.mjs` · `webview/**` 换接（判定表：核 9 + 拆 8）· `test/**`。
- **桌面**：`package.json` · `src/main/protocol.mjs`（双根）· `agent-bridge.mjs`（`onUsage` / `onReasoning` 两回调 + relay 分流）· `ipc.mjs` / `preload.cjs`（+1）· `sessions.mjs`（+`provider`）· `renderer/**`（三面）· `test/guard-closure.test.mjs` · `scripts/check-dist.mjs`。
- **测试面**：VSC 全套件 = 零回归基准；桌面新增族（状态行 / 右列 / 会话流 / 元数据）+ 原址补例（`views-chrome` / `views` / `events-reduce`）；用例号 = 实施批自铸段续编（U152 起）。

### 2.6 验收对照（D17–D20 → 设计落点）

| 需求 | 设计落点（验收回指） |
|---|---|
| D17 | `docs/desktop/design/UI.md` §1 本批注项 1（15 段表）+ KD-25 + T-DSK33 |
| D18 | 同注项 4 + KD-28 + T-DSK34（行投影补 `activeProvider`） |
| D19 | `docs/render-core/design/RENDER-CORE.md` §1 / §3（判定表 51 档）/ §4（对位表 22 行）+ KD-27 + KD-RC-1–7 + C1–C8 + T-DSK35 |
| D20 | `docs/desktop/design/UI.md` §1 本批注项 2 + `docs/desktop/design/IPC.md` §1/§2 + KD-26 + KD-RC-6 + T-DSK36 |

### 2.7 关键决策（本批）

KD-RC-1…KD-RC-7（核档 §2：落点 / `.mjs` / 输出形态 / 零 Markdown 改判 / 文件链接裁 / 内容 chunk 分流 / 样式契约）· KD-25…KD-28（desktop PROJECT.md §2：状态行口径 / 右列重定位 / 会话流经核 / 元数据族）。

### 2.8 上抛项（父侧处置）

1. **需求侧边界一例（只报）**：D19 列「文件链接」而需求 §5.1 把文件视图 / 打开列为暂缓 ⇒ 本设计裁「不承载」（KD-RC-5）；若需求侧要求承载 ⇒ 须先解暂缓边界。
2. **发布单元与地图**：新包入发布序列（R1 随发布单元登记）+ `docs/README.md` / `docs/core/design/ARCHITECTURE.md` 补行（父侧面）。
3. **实施前置两件**：① 与 #108 在飞退役批文件面核对（R1–R3 开工前置）② 两条加载形探针（VSC dev junction 取核 · 桌面 `/rc/` 双根）——任一失败 ⇒ 回核档改加载形（备选 = 物化后 `localResourceRoots` 显式扩面）。
4. **收口**：`docs/desktop/design/PROJECT.md` §10 **K / Y** 两行转「已裁」（原留白收口——K = 池归档口径 / Y = 真代码块面）。
5. **事实勘误（报明）**：① §1.3/§1.4 引「AGENTS.md『无构建步骤、无打包器』」——AGENTS.md 面为英文原句（`D:\teamcode\AGENTS.md:23` · `thincoder-vscode/AGENTS.md:11`），中文原句住 `docs/core/design/ARCHITECTURE.md:20`；② VSC 侧 `localResourceRoots` 全仓代码**零命中**（加载形据此定——默认根含扩展目录）；③ 桌面 `electron-builder.yml` **尚不存在**（核进产物声明面 = 随打包批）。
6. **D17 新鲜度窗**：计时段读数 = 核 `_pendingTimers`、刷新点 = 回合尾（不显倒计时）——登记（核档 §10 F）。

### 2.9 六命题之外的面（本批顺带闭合）

- 池切片「窗限 / 归档」留白（§10 K）＝ 已裁（归档 = 下回合起清终态）。
- 真代码块面（§10 Y）= 已裁（随核落，R3c）。
- `thincoder-desktop/renderer/events.mjs:215`「`n` / `max` 不落」＝ D17 回合段缺归约槽（R3a 补——有意取代，非缺陷）。

### 2.10 自检读数（交付前门）

- 三链同源：需求 D17–D20 ↔ §2.6 ↔ 设计档（UI / IPC / 核档）——**同源 ✓**。
- 文档面：核档判定表 51 档 + 对位表 22 行（计数自洽）✓；本批新增面无 revision-style 残留 ✓。
- **门读数（`node scripts/doc-check.mjs --root .` · 本席实跑 2026-09-27）**：总闸 **FAIL**（存量：悬空 54 · 行宽 38——含他档存量；**本批新增面 11 条已就地清**：核档 5 悬空 + 2 行宽、UI 2 行宽、IPC 1 行宽（事件映射行）、桌面 PROJECT 1 行宽；残差 = 存量档（`MODEL-SPECS` / `CORE-UNIFICATION` / `WEBVIEW` 等——非本批射程）。

### 2.11 设计评审轮 1 点修（eng-designer · 2026-09-27）

发现表 = §3 轮次 1（7 条）；父侧裁定全数接受；逐号落点如下（报告面 = 号 → 改动 file:line）。

1. **心跳补发补落点**（采「补落点」——「不承载」被否）：`docs/desktop/design/UI.md` 本批注项 2 补「数据链 = 宿主 relay 分流 + 存活投影 2s 再断言」（只发在飞实例 · 丢首发出生 ⇒ 一拍内复现 · 终态出表零再断言 · 键清点沿 `thincoder-vscode/src/extension/panel-session.mjs:123-126` 语义）；
   `docs/desktop/design/IPC.md` §1 `ev:subagent` 行产出方补「宿主存活投影 2s 再断言（拍体沿 `thincoder-vscode/src/extension/panel-messages.mjs:42-74` 语义）」；
   `docs/render-core/design/RENDER-CORE.md` §4 行 21 补出生自愈 + §8 R3b 文件面（存活投影 + 2s 拍体档 ∥ `agent-host.mjs` 起 / 停 / 清点）与判据（丢首发出生 ⇒ 一拍内复现 · 终态零再断言）；
   `docs/desktop/design/PROJECT.md` §6.1 D20 行补出生自愈句 + §7 T-DSK36 增 ⑤ 判据与机检面（存活投影拍体直驱）。
2. **逐档「现行 ⇒ 预期」**：`docs/render-core/design/RENDER-CORE.md` §6 重写——VSC 17 档逐档现行 ⇒ 预期（含 `ui.js` / `activity.js` 两越层档的迁出量与拆分预案 · 9 核档 = 迁核 / 8 拆档 = 纯面迁核端留守）+ 核包 + 桌面指针（→ `docs/desktop/design/PROJECT.md` §4.2 本批行）；
   `docs/desktop/design/PROJECT.md` §4.2 本批行逐档补数（现行 ⇒ 预期 · 结构不变 ∥ 越层预案）+ §4.1 越层段补本批触碰登记（越层三 + 贴层一）——§6 → §4.2 指针落地、原 §6 → §4.1 悬空解（指针成环消解）。
   口径注（实读勘误）：发现 2 引 `ui.js` 470 / `activity.js` 451——按仓内既定口径（内容行数——文末换行不计）实读为 **469 / 450**（先例同口径复核对齐：`attach.mjs` 146 / `mount-head.mjs` 147 均与档内值一致）。
3. **分批序重排**：§8 增**共享档串行条**（`thincoder-desktop/src/main/agent-bridge.mjs` / `thincoder-desktop/renderer/events.mjs` / `docs/desktop/design/IPC.md` 三档被 R3a / R3b / R3c 共触 ⇒ 三批严格串行）；R2 串行序改「与 R3a 可并行（无共享档）· 先行于 R3b / R3c（核件依赖）」；R3c「无文件交叠可并行」错述删。
4. **token→status 表补全 + 两值裁定**：§5 增 token → patch 全表（10 行——先例 `panel-subagent-relay.mjs:101-147` 逐字）；`stopped` = **先例兼容**（`⟦ev⟧stopped` ⇒ `cancelled`；闭集不载该值）；`error` = **有意收窄不载**（错误径归宿实读 = sync ⇒ `⟦ev⟧stopped`〔`thincoder-core/agent-tools/subagent.mjs:360`〕· async ⇒ `⟦ev⟧done` / `⟦ev⟧settled`〔`thincoder-core/agent-tools/async-settle.mjs:273` / `:275`〕；`onSubagent` 自述面在核内零发射点 ⇒ 无活上游）；
   同步 = `IPC.md` §1 闭集 · `UI.md` 项 2 终态列举 · `IPC.md` §2 `subagent:stop` 行判据（实收 `cancelled`）· `PROJECT.md` T-DSK36 ③；C2 判据补**映射差分锁**（`⟦ev⟧stopped` ⇒ `{ status: "cancelled" }` 逐字 + 闭集零 `stopped` / `error` 产值负向）。
5. **T-DSK34 机检档名收正**：`thincoder-desktop/test/sessions.test.mjs`（盘上不存在）⇒ `thincoder-desktop/test/session-contract.test.mjs` 原址补例（行投影 `activeProvider` 两向——U38 邻位；`thincoder-desktop/test/files.mjs` / `thincoder-desktop/test/run.mjs` 无需新档——清单随动已写进用例行）。
6. **§3 行 34 指针改指**：`RENDER-CORE.md` §3 行 34（`session-bar.js`）「元数据形见 §4 行 22」⇒ `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 4。
7. **DOM 面用例宿主定形**：核包 `test/*.test.mjs` = 纯函数层 + 态机层（平 node 直测）；**DOM 构件层用例宿主 = 消费端套件**（VSC `thincoder-vscode/test/**`（happy-dom devDep 既有）· 桌面 `thincoder-desktop/test/fake-dom.mjs`（假 root 既有））——核包自身零 devDep ⇒ **C1 机检恒可过**（不引 happy-dom · 不另立第二假 root）。

**自检读数**（`cd thincoder && node scripts/doc-check.mjs --root .` · 实跑 2026-09-27 · 点修前/后同档对比）：本批新增**悬空 0 · 行宽 0**；总闸 = 悬空 **49**（与点修前同——存量档，非本批射程）/ 行宽 **34**（点修前 **35**——含本批**修复存量 1 条**：`docs/render-core/design/RENDER-CORE.md:182` 307 字符行随 §6 重写消解）；新增 / 改写非表格行全 ≤300（表格行按机检口径结构性豁免——`doc-check-width.mjs:40` 表格行谓词）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

## 发现表（渲染核对齐批 · 设计评审 · 独立复核）

限制：评审上下文未给 project standards 档与文档地图 ⇒ 方法论 / 文档归属两维降级判读；CLI 代码面按声明排除（D17 段集未独立复核）。抽核实读：`protocol.mjs`（MIME 无 `.js` · `RENDERER_ROOT:13` · 逃逸门 `:39-41`）· `preload.cjs`（27 项 + 10 事件通道）· `check-dist.mjs:12`（`CHECKS = []`）· `.vscodeignore:3-4` · `renderer/index.html:5-8`（CSP 零 `unsafe-inline`）· `guard-closure.test.mjs:67` · `ui.js:10` · `chat-panel.mjs:413-425` · `state.js:10` · `chat.css` 14 / `controls.css` 10 处 `--vscode-*` · `agent-bridge.mjs`（九回调 + `:57-63`）· `agent.mjs:84/235/273/353` · `sessions.mjs:14-16` · `session-bar.js:40-41` · 核档 §3 计数 51=9+8+34 与 §4 计数 22=5+10+7 自洽。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🔴 | D20 数据源子句「+ 心跳补发」零落点且零登记：覆盖 D20 的四处列举全无此条——`docs/desktop/design/UI.md:127-130`（项 2）· `docs/desktop/design/IPC.md:16`（`ev:subagent`）· `docs/core/design/RENDER-CORE.md:161`（§4 行 21）与 `:212`（R3b 四判据 = 五类射程 / 零工具行 / 块态机 / 停止往返）· `docs/desktop/design/PROJECT.md:285` / `:348`（T-DSK36）；`docs/desktop/**` 内「心跳 / 补发 / 自愈」仅需求行 `docs/desktop/requirements/PROJECT.md:148` 命中（实 grep）；VSC 先例机制实在（`thincoder-vscode/src/extension/panel-messages.mjs:42-74` 心跳起拍 / 拍体 · `panel-session.mjs:123-125` 2s 拍源新鲜度注）⇒「替代 vsc 端 live 面板」的出生事件自愈面未随设计，属静默省略 | 补落点（宿主侧对在飞子 agent 周期再断言 → `ev:subagent`，映射仍走核 `relayEventToSubPatch` 单源；R3b 文件面与判据同笔入册）∥ 或显式裁「不承载」+ 理由 + 登记（上抛 / 边界行）——二择一，实施前落定 |
| 2 | Affected-file annotations | 🟡 | 本批受影响文件账缺「现行行数 + 预期增量」：`docs/core/design/RENDER-CORE.md:182-188`（§6）与 `docs/desktop/design/PROJECT.md:242-247`（§4.2 本批行）只给文件名与粗措辞；VSC 侧 17 档零行数账——其中 `thincoder-vscode/webview/ui.js` 实读 **470**、`activity.js` 实读 **451**（均 >300 层）；桌面 R3a–R3c 改动档（`agent-bridge.mjs` 实读 77 · `events.mjs` 369 · `views/chat.mjs` 299 贴层等）无本批增量估值；且指针成环（RENDER-CORE 指 §4.1，而 §4.1 值列未载本批任何值） | 逐档补「现行行数 ⇒ 预期（≤±N ∥ 结构不变）」并给越层档拆分预案；RENDER-CORE §6 与 PROJECT.md §4.1/§4.2 指针互不悬空（本批行就地给数） |
| 3 | Feasibility / 分批序 | 🟡 | §8 串行序自相矛盾：R3a 列「与 R2 / R3b 并行」（`RENDER-CORE.md:211`）· R3c 列「与 R3b 无文件交叠可并行」（`:213`），但同表文件面显示 R3a/R3b/R3c 共触 `thincoder-desktop/src/main/agent-bridge.mjs` 与 `thincoder-desktop/renderer/events.mjs`（回调面为九 ⇒ 十 ⇒ 十一键的同文件递增链），另 `IPC.md` 与测试面均重叠 ⇒「无文件交叠」不成立 | 按文件面重排（`agent-bridge` / `events` 收单一批，余批串行）或补「同档并行须先串行」例外条 |
| 4 | Clarity / 契约 | 🟡 | §5 `relayEventToSubPatch` 只给事件 token 谱、未给 token→status 投影，且与所引先例对不齐：先例实读 `⟦ev⟧stopped` ⇒ `status:"cancelled"`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:138`）且终态含 `error`（`webview/activity.js:200` / `:237` / `:240`）；桌面闭集 = `started/queued/turn/done/stopped/settled/cancelled`（`IPC.md:16`）多出 `stopped`、缺 `error`，`UI.md:128` 终态折叠同缺 `error` ⇒ 错误退出的子 agent 无态可落；R2 换接后 VSC 差分未定（牵 C2 零回归判据） | 补全 token→status 表并裁 `stopped` / `error` 两值归属（含先例兼容 / 有意分叉说明），同步 UI.md 终态列举与 C2 判据 |
| 5 | Acceptance | 🟡 | T-DSK34 机检面点名 `thincoder-desktop/test/sessions.test.mjs`——盘上不存在（`thincoder-desktop/test/*.test.mjs` 三十五档实读无该名），无「拟新增」标记、无 `test/files.mjs` / `test/run.mjs` 清单随动（`docs/desktop/design/PROJECT.md:346`） | 改点实际承载档（如 `session-contract.test.mjs` 原址补例）或标「拟新增」并把清单随动写进用例行 |
| 6 | Clarity / 指针 | 🔵 | `RENDER-CORE.md:112`（§3 行 34 `session-bar.js`）指「元数据形见 §4 行 22」——§4 行 22 = 状态栏 / 状态行（D17 面，`:162`），非 D18 元数据形；D18 元数据形实住 `docs/desktop/design/UI.md:135-137` | 改指 `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 4 |
| 7 | Feasibility / 测试面 | 🔵 | 核包测试面写「DOM 面经 happy-dom 或假 root」（`RENDER-CORE.md:182`），与「零 devDep」（`:64` KD-RC-1）/C1「deps / devDeps 皆空」（`:194`）相抵——happy-dom 系第三方 devDep（现仅 VSC 侧持有：`thincoder-vscode/package.json:135-141`），核包自身测试不可解析 | 明确 DOM 面用例宿主（核包内自持假 root 测试助手 ∥ 下放 VSC / 桌面消费套件），保 C1 机检恒可过 |

计数：🔴 1 · 🟡 4 · 🔵 2（共 7）

VERDICT: changes-required

### 轮次 2（评审子代理）

## 轮 2 复核（独立复审 · 轮 1 七条修复核验）

口径：轮 1 七条逐号对照 §2.11 修复声明 + 五档现行面全档重读；另抽实读代码坐标（token 全表先例逐行 / 错误径 / 心跳先例 / 测试档在盘 / 行数口径校准）——含 8 个核内文件（manifest / conventions / dispatch / verify / advisor-settle / repos / project-context / index-discover，属他批在飞实现面，与本批七条无涉，不列发现）。判读限制：未给 project standards 档与文档地图（惯例同上轮）；CLI 代码面按声明排除。

| # | 轮1# | 面 | Severity | Status | 本轮实读证据（修复核验） |
|---|---|---|---|---|---|
| 1 | 1 | 心跳补发落点（D20） | ~~🔴~~ | ✅ 已修 | `docs/desktop/design/UI.md:130`「**数据链 = 宿主 relay 分流 + 存活投影 2s 再断言**（出生自愈——只发在飞实例…）」；`docs/desktop/design/IPC.md:16` 产出方同补（拍体沿 `panel-messages.mjs:42-74` 语义）；`RENDER-CORE.md:161`（§4 行 21 出生自愈）+ `:258`（R3b 文件面「存活投影挂点 + 2s 拍体」＋判据「出生自愈（丢首发出生 ⇒ 一拍内复现 · 终态零再断言）」）；`PROJECT.md:296`（D20 行）+ `:359`（T-DSK36 ⑤ + 机检面「存活投影拍体直驱」）。先例实读在位：`export const LIVE_HEARTBEAT_MS = 2000`（panel-messages.mjs:45）· panel-session.mjs:123-126 清点语义 |
| 2 | 2 | 逐档行数账 | ~~🟡~~ | ✅ 已修 | RENDER-CORE §6 重写（口径句 :200 + VSC 17 档全表 :208-226，越层两档 activity.js 450 ⇒ ≈260–320 · ui.js 469 ⇒ ≈200–250 各带拆分预案）+ 核包 :202-204 + 桌面指针 :230 改指 PROJECT.md §4.2「就地给数」；PROJECT.md §4.2:244-258 逐档补数（agent-bridge 77 ⇒ ~125 … events 369 ⇒ ~450 …）+ §4.1:181 本批触碰登记。口径抽校：ui.js / activity.js / attach.mjs 读值 470/451/147 ⇔ 档内 469/450/146——−1 口径自洽 |
| 3 | 3 | 分批串行序 | ~~🟡~~ | ✅ 已修 | RENDER-CORE:251 共享档串行条（agent-bridge / events / IPC.md 三档共触 ⇒ R3a ⇒ R3b ⇒ R3c 严格串行）；:256 R2「与 R3a 可并行（文件面不交叠：核包 / VSC ∥ 桌面）；先行于 R3b / R3c」；:257/:258/:259 逐批串行序收正——原「无文件交叠可并行」错述已删 |
| 4 | 4 | token→status 全表 | ~~🟡~~ | ✅ 已修 | RENDER-CORE:173-191 全表 10 行 + 闭集六值 + 两值裁定（`stopped` ⇒ `cancelled` 先例兼容；`error` 不载——sync 错误径 `subagent.mjs:360` 实读 ✓ · async 径 `async-settle.mjs:273` / `:275` 实读 ✓ · `onSubagent` 核内零发射点 `panel-callbacks.mjs:164` 实读 ✓）；先例逐行对上（relay :102-107 / :108-113 / :114-129 / :130-134 / :138 / :139 / :140 / :141-144 / :145 / :146）；同步面 IPC.md:16 · UI.md:129 · IPC.md:67 · T-DSK36 ③ · C2 映射差分锁（RENDER-CORE:239） |
| 5 | 5 | T-DSK34 档名 | ~~🟡~~ | ✅ 已修 | PROJECT.md:357 改点 `thincoder-desktop/test/session-contract.test.mjs` 原址补例（U38 邻位 · files/run 无需新档）；盘上核验在位（285 行 · 档头「会话族读面三态（U38）」） |
| 6 | 6 | 指针 | ~~🔵~~ | ✅ 已修 | RENDER-CORE:112（§3 行 34 `session-bar.js`）改指 `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 4——与 UI.md:136-138 项 4 对位一致 |
| 7 | 7 | DOM 用例宿主 | ~~🔵~~ | ✅ 已修 | RENDER-CORE:203-204：核包 test = 纯函数层 + 态机层；DOM 构件层用例宿主 = 消费端套件（VSC `test/**` · 桌面 `fake-dom.mjs`（盘上在））——零 devDep 与 C1 相容 |
| N1 | (new) | `RENDER-CORE.md:178`（§5 全表 `[model]` 行） | 🟡 | New（非阻塞 · 建议 R2 前点补） | 实读行文 = `| `[model]` | `{ status: "started", pool, model, startedAt }` | `:108-113` |`——先例 `thincoder-vscode/src/extension/panel-subagent-relay.mjs:112` 实读含 `syncLive: !pool && syncLiveOf(panel, path.head)`；该字段有活消费与专用锁（`webview/activity-view.js:158` ⏹ 门控 `meta.syncLive === true` · `webview/activity.js:321` · `test/sync-block-stop.test.mjs` T-S1b/T-S1c/T-S2）⇒ 本表自称「单源 / 逐字 / R2 后 VSC 差分 = 零」，建议行内点名端侧补注（syncLive 由端 registry 供给——核不可算）或列入 deps |

计数：轮 1 七条 **7/7 已修**；新 1 条 🟡（**非阻塞**）；🔴 **0**。

另注（不计入发现 · 无严重度 · 他批致因）：`IPC.md:75` / `:158` 引 `thincoder-core/manifest.mjs:334` / `:233` / `:261`——本轮实读已漂移（`export function readManifest(cwd) {` = :366 · `export function manifestFilePath(cwd) {` = :236 · `phase: Object.freeze(["initial-dev", "production"]),` = :268），系他批（声明载体唯一化并入）改行所致；父侧可顺手收正，不涉本批。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：✅ 已批准（代签 · 2026-09-27 21:5x）

- **评审轨迹**：轮 1 = changes-required（1🔴 · 4🟡 · 2🔵）→ 点修轮七号全落 → **轮 2 = pass**（0🔴 · 1🟡 非阻塞〔`syncLive` 行补注——收正轮已落〕）。
- **修正落地核验** ✓：七号逐号抽读（父侧）+ 收正轮（迁移 / N1 / 坐标）亲核——doc-check 亲跑 **49/34 净 0**；引用面设计侧 20 处全收正；§5 全表 10 行在册。
- **代签依据** = 用户 2026-09-27 20:08「后续自动跑完吧」（全链授权）——三条件全满足（评审 pass ∧ 修正落地核验 ∧ 设计凭证在手）。
- **批准对象**：本批设计（`docs/render-core/design/RENDER-CORE.md` + `docs/desktop/design/{UI,IPC,PROJECT}.md` + `docs/desktop/requirements/PROJECT.md` 对应面）；实施分批 R1–R3c（核档 §8）——**R1 即刻派发**。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
