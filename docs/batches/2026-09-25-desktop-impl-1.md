# 2026-09-25 · 桌面端实施批 1（壳骨架）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 17:59「批」（设计批 `docs/batches/2026-09-25-desktop-design.md` §4.1 批准 · 桌面端实施程序解锁）；本批 = 实施程序**第一段**（壳骨架可跑），设计锚 = 该设计**五档**（`docs/desktop/design/{PROJECT,SHELL,IPC,UI,RENDERER}.md`）+ §4.1 文件表 + §7 用例面。
> 台账 = #353（桌面端（第四端）· 归批——本批 = 其实施第 1 段）。前情 = docs/batches/2026-09-25-desktop-design.md §4.1（设计已批准 · 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 17:59「**批**」——设计批 `docs/batches/2026-09-25-desktop-design.md` §4.1 批准（四条清单第 3 条）⇒ **桌面端实施程序解锁**。本批 = 实施程序**第一段**。

### 1.2 本批交付目标（父侧裁定 · 首段切分）

**目标 = 壳骨架可跑**：`package.json` + 主进程骨架（`src/main/{main,window,protocol,ipc}.mjs`）+ 预载窄桥（`src/preload/preload.cjs`）+ 渲染面骨架（`renderer/{index.html,app.mjs,dom.mjs,styles.css}`）+ 测试面（`test/{run,files}.mjs` + 首批用例）+ `scripts/check-dist.mjs`。

**判据（本批验收面 · 机器可核）**：
1. `npm test` 在 `thincoder-desktop/` 可跑通（给 tests / pass / fail 三数）；
2. 应用**可启动**（启动自检按 KD-7 宿主下限 · `app://` 协议可服务 · 单实例锁生效）——给行为读数；
3. **一条通道往返**（取 `config:read`：预载白名单 → IPC → 主进程 → 返回值）——给行为读数；
4. `node scripts/doc-check.mjs` **零新增**闸态失败（基线 悬空 4 / 行宽 18）；
5. 三包（core / vsc / cli）**零回归**（未触碰面 ⇒ 给零 diff 读数）。

**本批不含（后续批）**：会话视图 / 项目面 / 设置视图 / 活动池 / 审批卡 / 打包与分发（`electron-builder` 面）——首段刻意收窄，避免过大。

### 1.3 设计锚（不得偏）

`docs/desktop/design/{PROJECT,SHELL,IPC,UI,RENDERER}.md` **五档**（已批准）+ `PROJECT.md` **§4.1 文件表**（逐文件预算）+ **§7 用例面**（21 条）+ **KD-1–KD-9**（零框架手写 · 沙箱 CJS 窄桥 · `app://` · 零新存储 · 主进程内存态 …）。

### 1.4 边界

- 本批 = **产品代码面**（新建 `thincoder-desktop/**`）；**不改** core / vsc / cli 产品码 · **不改**需求档 / 提示词 / `docs/desktop/**`（设计面已批准）——**设计档如需更正 ⇒ 上抛，不就地改**。
- 桌面端实施**分批**：本批只做 §1.2 目标面，超出面 ⇒ **报告不扩**。

### 1.5 §2 落地后的父侧裁定（2026-09-25 18:10）

- **R-2 = 认（附条件）**：`src/main/host-floor.mjs` 收为**设计 §4.1 表外新增行**（`main.mjs` 同面拆分 · 合计 80 行不超预算）——理由成立（下限自检须可被平 node 测试导入；`main.mjs` 顶层静态 `import electron` 必炸；对照先例 = 扩展端 `vscode: file:test/vscode-mock`）。**条件**：设计面同步（`PROJECT.md` §4.1 表 + `SHELL.md` §1 树）**随本批实施后的修正轮**落（与 R-5 同轮 · 笔 = eng-designer）——表/树不得与本批实际产物长期分叉。
- **R-1 = 认**：Electron 二进制下载可达性 unverified ⇒ 实施轮**实测**；不可达 ⇒ 走镜像或**上报**，**不得静默跳过判据 ②③**（跳过即判「判据未达成」，不判 pass）。
- **R-3 / R-4 = 认**：`--smoke` 不进通道表（= §5 验证面②的实施载体）；`check-dist.mjs` 本批只落入口 + 缺口 `exit 1` 显式，产物面断言随打包批。
- **R-5 = 认**（设计 §2.1 两项待实测读数回填 → 实施后修正轮 · 笔 = eng-designer）；**R-9 = 入账 #383**（「脏树上的零回归判据只能判增量零」实践沉淀——落点 = 测试 / 机检纪律面，随该面触碰定；候选 = `docs/core/design/TESTING.md` ∥ `DOC-DISCIPLINE.md` §3）。
- **R-6 = 已办**（`docs/README.md` 四部分口径 + `PROJECT-MANIFEST.json` docRoot 扩 `docs/desktop/**` —— 均已在落，父侧笔）；**R-7 = 认**（需求 §6 启动阈值 / 平台差异逐项定形 = 设计 §10 F 面，随视图批，本批不涉不扩）；**R-8 = 已办**（台账 #353 已挂本档 task_book）。
- **未核面如实入册**：U11（下限不足路径）= unverified-until-host；R-1 二进制下载可达性 = unverified。

### 1.6 收尾裁定（父侧 · 2026-09-25 18:25）

- **修复轮发现项 1–3 处置**：① 行宽集外因推移（19→18）**认**——反证 E-4 新主判（失败行集合无新增 + 实施时刻取基线）之必要；② 未提交计数 28→47 **认**（快照性质 · 旧行不回改）；③ 非本笔超宽行（§1:37 316 字符 + §3 七行）**认（不回改）**——批档为记录面（评审表逐字入档 + append-only 工具语义），后续父侧追加行按 <300 写。
- **轮 2 三条 🔵 处置（全 Deferred —— 并入实施后修正轮）**：① 收正⑤ 依据行算术（分项和 17 ≠ 21）· ② 两 traversal 探针的归属门覆盖质量（unverified ⇒ 由实施轮实跑读数核定，已写入实施派单已知事实）· ③「覆盖值清单」建议 —— 三条随**实施后修正轮**（= R-2 设计面同步〔§4.1 表 + `SHELL.md` §1 树〕+ R-5 待实测回填）**同轮落**，笔 = eng-designer。**Deferred 理由**：三条均非阻塞的档面精度项，且修正轮已排定同面，不另起轮。
- **批级状态**：设计评审两轮完成（轮 1 changes-required → 修复轮 §2.11 收正 → 轮 2 **pass**）⇒ **§2 定稿 = §2 正文 + §2.11（修后为准）**。

### 1.7 E-4 基线事实变更裁定（父侧 · 2026-09-25 18:48）

- **实施轮实测**：`node scripts/doc-check.mjs` = 悬空 **8** / 行宽 18（任务书 §2.1 E-4 记「悬空 4」= 旧基线）。**8 条全在他人档**（`docs/core/design/MODEL-SPECS.md` · `docs/core/design/SESSION.md` · `docs/vsc/design/WEBVIEW.md`），HEAD 既有、非在途新增；本批触碰面（`thincoder-desktop/**` + 本批次档）**零新增失败行** ✓。
- **裁定 = 按实质判据收 E-4**（§2.11④ 主判：失败行集合无新增 ⇒ 绿）——**「逐数等于 4」作废**（§2.11④ 已将其降为附注；§2.1 E-4 的旧数字 = 父侧派单沿用的旧基线，非本批义务）。
- **旧数字收正 = 并入桌面端实施后修正轮**（已排定：R-2 表/树同步 + R-5 回填 + 轮 2 三条 🔵 + 本条）——**不另起轮、不等待**。
- **明确不做**：不要求实施轮对根仓 4→8 条既有悬空锚行做越批修复（他批 / 他会话在途所致；闸绿归对应批）。

### 1.8 E-4 归因更正裁定（父侧 · 2026-09-25 18:56）

- **实施轮二次取证（更正 §1.7 首报口径）**：悬空 4→8 中**新增 4 条**（`docs/vsc/design/WEBVIEW.md:35/35/76/79` 的裸路径锚引 `index.html:…`）**确由本批新档 `thincoder-desktop/renderer/index.html` 触发**——引擎 `scripts/doc-check-anchors.mjs:166-174` 的 basename 唯一性规则（域内唯一 ∨ 仓根唯一 `=== 1`），manifest `anchors.domain = "docs"` ⇒ `index.html` 须靠仓根唯一过；本批前仓内 `index.html` 唯一（仅 vsc webview），新增第二枚 ⇒ 计数 1→2 ⇒ 四条翻悬空（该档正文未改、与 HEAD 逐字相同）。
- **裁定**：① **按字面判红**——§2.11④ 主判（失败行集合零新增）在实施时刻**未达成（+4）**；§5 交付表按「**新增 4 行（成因外档）**」记，并保留「首报 → 二次取证更正」留痕；② **修法在外档**（`WEBVIEW.md` 四处裸锚补全路径前缀，参照同档 `:30` 形态）⇒ **已并入在跑的 vsc 设计档修正轮（同轮落）**；③ **E-4 终态 = 修正落定后回归零新增（绿）**，以修正轮核验为准；④ **不动引擎**（basename 唯一性规则可辩护；规范面 = 文档须写无歧义锚）。
- **入账**：**#388**（跨批脆弱面：文档裸锚形态 × 引擎 basename 唯一性——新增同名档即翻红的通用现象，落点 = 文档面规范句或 sweep 口径）。

### 1.9 实施轮交付裁定（父侧 · 2026-09-25 19:13）

- **审计 D4（原生菜单 Edit 组 6 role 超出设计枚举）= 保留**：理由——① Edit 组走 Electron **内建 `role:` 机制**（非设计所禁的「菜单项 → 渲染面动作」**自定义通道**）⇒ **不违**「首版不设通道」；② 无 Edit role 则 macOS 的 Cmd+C/V/A 快捷键**不工作**（可用性硬需求）；③ 宿主平台惯例组成。**条件**：设计面登记（`docs/desktop/design/IPC.md` §1 菜单面 + `SHELL.md:44` 的枚举补「＋ 平台惯例 Edit 组（内建 role，非通道）」）→ **并入桌面端实施后修正轮**。
- **超预算 3 档（`main.mjs` 63>50 · `window.mjs` 97>90 · `guard-closure.test.mjs` 80>70）= 认**：预算 = 上界估计、非硬闸；实值远低于 300 软线；包级 906 ≤ 950 ✓；零功能删减 ✓（§5.5② 已披露）。
- **无锚新增 5 项 · 审计 D3 / D5 · stderr 行数更正（3→5）· 机械产物（`package-lock.json` / `node_modules`）= 认**（披露面完整；D3 阈值更严不产假绿；D5 属 append-only 形态）。
- **残余入账 #389**：门①（`path.relative` 逃逸判定）**运行期零覆盖**（三负探针全命门②；补 `../styles.css` 形态探针）· 收正① 增长条款（≥3 档阈值随模块增长生效）· `will-navigate` 未拦窗口自身导航 · U11 = unverified-until-host。
- **E-4**：按字面判红（§1.8）→ **绿门 = 外档修正轮（在跑）**；落定后核验转绿，并入 §6 收口。

### 1.10 E-4 终局（父侧核验 · 2026-09-25 19:14）

外档修正轮（vsc 三档 18 处 · #34）落定 + **父侧实跑** `node scripts/doc-check.mjs` = **悬空 4 / 行宽 18** ⇒ 失败行集合（4）**⊆ 实施时刻快照（8）** ⇒ **E-4 = 绿（修正后）** ✓。判据面闭环：**E-1–E-7 全绿**（E-4 走完「红 → 外档修 → 绿」全程留痕：§1.7 → §1.8 → §1.10）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮 1 收正块见 §2.11（评审 §3 轮次 1 · 10 条全采纳 · 修后为准））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批摘要（eng-designer · initial 轮）** — 本批 = 桌面端实施第 1 段「壳骨架可跑」。

交付面 = 批次档 §1.2 的批级判据 5 条 + 两个可自动化的守卫用例（T-DSK15 / T-DSK16）。
**骨架批不含任何完整功能点**——D1–D12 全部随后续批（见 §2.2 逐项列明）；故本表条目 = 判据 + 文件面，**不冒充功能点闭环**。
设计锚 = `docs/desktop/design/` 五档（PROJECT / SHELL / IPC / UI / RENDERER），本批**零新语义**：设计档已定者照指照抄，未定者一律进**上抛/报告项**（§2.8），不自造。

### 2.1 本批条目（覆盖面 · 逐条回指判据）

| # | 条目 | 本批内容 | 机检判据（读数形式） | 设计锚 |
|---|---|---|---|---|
| E-1 · 判据① | 测试面跑通 | `thincoder-desktop/` 下 `npm test`（=`node test/run.mjs`） | `# tests N / # pass N / # fail 0`，exit 0；清单↔盘上两向自检全过（盘上未登记 `.test.mjs` ⇒ 红） | `docs/desktop/design/PROJECT.md` §4.1 `test/run.mjs` · `test/files.mjs` 行 |
| E-2 · 判据② | 应用可启动 | 冒烟单行 JSON（契约 = §2.5） | `lock:"primary"` ∧ `floorMet:true` ∧ `sqlite:true` ∧ `window:true` ∧ `protocol.served>0`，exit 0；第二实例读数 `lock:"secondary"` ∧ `window:false` | `docs/desktop/design/PROJECT.md` §2 KD-7 · §5 验证面② · `docs/desktop/design/SHELL.md` §2 启动自检行 |
| E-3 · 判据③ | 一条通道往返 | `config:read`：预载白名单 → IPC → 主进程（核 `loadConfig`）→ 返回值 | 同次冒烟 `boot:"ok"` ∧ `channels:["config:read"]` ∧ `configKeys>0`；载荷形 = `{ config, locale, dict }` | `docs/desktop/design/IPC.md` §2 `config:read` 行 · `docs/desktop/design/PROJECT.md` §2 KD-3 |
| E-4 · 判据④ | 文档闸零新增 | 本批新增 docs 仅本批次档（锚面排除 `batches`） | `node scripts/doc-check.mjs` 读数**逐数等于基线**：`FAIL(锚) 4 条悬空` · `FAIL(行宽) 18 行超 300 字符`，且失败行集合无新增 | —（基线 = 本批实测 · 2026-09-25） |
| E-5 · 判据⑤ | 三包零回归 | 本批不触 core / vsc / cli 产品码 | 实施前后各跑 `git status --porcelain -- thincoder-core thincoder-vscode thincoder-cli`（+ `git diff --stat` 同路径），两次输出**逐字相等** | `docs/desktop/design/PROJECT.md` §8 边界 · 需求档 A4 |
| E-6 | 渲染面静态守卫 | `renderer/**` 静态闭包零 `node:` / 零 `@thincoder/core`；闭包非平凡；违规合成样本判红（防假绿） | `test/guard-closure.test.mjs` 全绿（随 E-1） | `docs/desktop/design/SHELL.md` §1 分层铁律 · 用例 T-DSK16 |
| E-7 | 宿主下限自检 | 纯谓词边界 + 探针分支 + 接线机检 | `test/host-floor.test.mjs` 全绿（随 E-1） | `docs/desktop/design/PROJECT.md` §2 KD-7 · 用例 T-DSK15 |

判据⑤的读数形态说明（**基线非空——实测**）：实施前仓内已有 28 项未提交改动（含 `thincoder-core/**` 多档）⇒「零回归」只能判**增量零**；按「绝对零 diff」读会得假红。

### 2.2 本批不覆盖（明示）

- **功能点**：D1–D12 无一本批闭环（骨架批）。用例面：T-DSK15 / T-DSK16 本批可跑；**T-DSK1 / 2 / 3 / 12 / 14 / 17–20 随后续批**。
- **文件（设计 §4.1 表内、本批不建）**：`electron-builder.yml` · `agent-host.mjs` · `session-slots.mjs` · `projects.mjs` · `settings.mjs` · `renderer/i18n.mjs` · `renderer/store.mjs` · `renderer/views/**`。
- **用例模块（设计 §4.1 五档中本批不建）**：`session-contract` · `projects` · `store`。
- **面**：打包与分发（`package` / `postpackage` 两 script 本批**声明但不跑**——`electron-builder.yml` 不在本批，跑必失败，见 §2.8 R-4）· 会话视图 / 项目面 / 设置 / 活动池 / 审批卡 · CI 矩阵（`.github/workflows`，P4/A3）· `PROJECT-MANIFEST.json` 的 docRoot 面与 `docs/README.md`（父侧笔权）· 核侧任何改动。
- **范围外的其它批**：台账 #371 / #372（`session-slots.mjs` `END` 参数化）不涉本批、无文件冲突。

### 2.3 受影响文件（本批新增 · 逐文件预算）

行数为**实施预算（上界）**；`thincoder-desktop/` 为整包新增（仓内尚不存在）。

| 文件（`thincoder-desktop/` 下） | 预算 | 本批内容 | 设计锚 |
|---|---|---|---|
| `package.json` | 45 | `type: module` · `main: src/main/main.mjs` · script 三条（`test` / `package` / `postpackage`） · devDeps `electron` / `electron-builder` · deps `@thincoder/core ^0.9.5` | `docs/desktop/design/PROJECT.md` §5 · §4.1 |
| `src/main/main.mjs` | 50 | 入口：旗标解析 · 单实例锁 · 下限自检调用 · 协议注册 · 窗口创建 · 冒烟读数与退出 | `docs/desktop/design/SHELL.md` §1 · §2 |
| `src/main/host-floor.mjs` | 30 | 宿主下限纯谓词 + `node:sqlite` 探针（**零 `electron` 导入**——见 §2.6 D-2） | `docs/desktop/design/PROJECT.md` §2 KD-7 |
| `src/main/protocol.mjs` | 60 | `app://` 特权 scheme 注册 + `handle` + 逃逸/扩展名防护 + MIME 表 | `docs/desktop/design/SHELL.md` §1 · §2 |
| `src/main/window.mjs` | 90 | `BrowserWindow` 装配（`contextIsolation` / `sandbox` / `nodeIntegration:false`）· 原生菜单（主进程动作面）· 系统主题 · 冒烟读回 | `docs/desktop/design/UI.md` §1 主题行 · `docs/desktop/design/SHELL.md` §2 |
| `src/main/ipc.mjs` | 90 | 通道注册与分发（本批 = `config:read` 一条）；白名单单源 = 预载常量（§2.6 D-3） | `docs/desktop/design/IPC.md` §1 · §2 |
| `src/preload/preload.cjs` | 45 | `contextBridge` 窄桥 + `CHANNELS` 白名单（本批 = `["config:read"]`） | `docs/desktop/design/IPC.md` §1 KD-3 |
| `renderer/index.html` | 45 | 三列骨架 + CSP meta（零内联脚本）+ 模块脚本入口 | `docs/desktop/design/UI.md` §1 布局行 · `docs/desktop/design/SHELL.md` §1 |
| `renderer/app.mjs` | 60 | 引导：一次 `config:read` 往返 + `documentElement.dataset.boot` 置位 | `docs/desktop/design/IPC.md` §2 · 本档 §2.5 |
| `renderer/dom.mjs` | 40 | DOM 工具最小面（建节点 / 文本 / 清空 / 事件） | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/RENDERER.md` §1 |
| `renderer/styles.css` | 120 | 三列栅格 + 主题变量（`nativeTheme` 映射）+ 900px 单断点常量 + 左列折叠骨架 | `docs/desktop/design/UI.md` §1 布局/断点/主题行 |
| `scripts/check-dist.mjs` | 60 | 产物校验骨架：入口 + 断言框架（只读 · fail-closed · 缺产物 ⇒ exit 1 + 显式提示） | `docs/desktop/design/PROJECT.md` §5 |
| `test/run.mjs` | 50 | 单测试入口：清单↔盘上两向自检 + `.test.mjs` 收集 + `node --test` 派发 | `docs/desktop/design/PROJECT.md` §4.1 |
| `test/files.mjs` | 20 | 显式清单（裸数组） | 同上 |
| `test/host-floor.test.mjs` | 60 | 用例模块（E-7 · §2.5） | `docs/desktop/design/PROJECT.md` §2 KD-7 |
| `test/guard-closure.test.mjs` | 70 | 用例模块（E-6 · §2.5） | `docs/desktop/design/SHELL.md` §1 |
| 合计 | ~810 | 16 档（含 `package.json`） | — |

**表 delta 一处（明标 · 报告项 R-2）**：`src/main/host-floor.mjs` **不在** `docs/desktop/design/PROJECT.md` §4.1 原表逐行之内——它是该表 `main.mjs` 行的**同面拆分**（拆分授权 = §4.1 按面拆分/拆分预案；行预算自 `main.mjs` 划出，两档合计 80 行 = 原表预算，不超）。
拆分的**强制理由**（非风格偏好）：下限自检必需可被**平 node 测试**导入，而 `main.mjs` 顶层静态 `import` `electron` ⇒ 平 node 导入必炸；`electron` 为真 devDep（无 mock 可用面，对照 = 扩展端 devDep `vscode: file:test/vscode-mock`，`thincoder-vscode/test/engine-floor-guard.test.mjs:17` 直接 `import "vscode"` 可行）⇒ 本端唯一干净解 = 谓词落**零 `electron` 依赖的叶子模块**。

### 2.4 接口契约（进程 / 启动序 / 冒烟读数 / 通道 / 协议 / 窗口）

**进程面三层**：`main`（ESM）· `preload`（CJS · sandbox）· `renderer`（ESM · `app://` 真实 origin）。三层**零共享模块**：渲染面不得 import 主进程码或预载码（`renderer/**` 静态闭包零 `node:` / 零 `@thincoder/core` = E-6）。

**启动序**（`main.mjs` 单线）：
`--smoke` 解析 → `requestSingleInstanceLock()` → 非主实例分支（不开窗）→ 宿主下限自检（`host-floor.mjs`）→ `registerAppScheme()`（**ready 前**）→ `await app.whenReady()` → `serveAppProtocol()` → `registerIpcHandlers()` → `createWindow()` → 窗口加载完成 → 冒烟读回 → 打单行 JSON → `app.exit(0)`。

**冒烟读数契约（`--smoke`，判据②③的读数源）**：stdout **单行 JSON**（日志一律走 stderr），字段闭集：

```
{"smoke":1,"lock":"primary|secondary","window":bool,"node":"x.y.z","sqlite":bool,"floorMet":bool,
 "protocol":{"served":N,"blocked":N},"boot":"ok|error|none","configKeys":N,
 "channels":["config:read"],"errors":[],"ok":bool}
```

- `ok`（主实例）= `floorMet && sqlite && window && protocol.served>0 && boot==="ok" && errors.length===0`；`ok`（第二实例）= `window===false`。
- 退出码：`0` = ok · `3` = 宿主下限不满足 · `4` = 冒烟超时（默认 20s）· `5` = 其它致命（`errors` 非空）。
- **超时与异常路径也必须打 JSON**（fail-closed 可机读），不得只抛栈。

**通道面（本批一条）**：`config:read` — 无入参；返回 `{ config, locale, dict }`。
`config` = 核 `loadConfig()`（`thincoder-core/config.mjs:228`）的合并配置对象；`locale` = 配置语言字段（缺 ⇒ 默认 `"en"`）；`dict` = 核 `projectDictionary(locale)`（`thincoder-core/i18n.mjs:101`）投影（扁平 `{key:value}`）。
预载面 = `window.thincoder.invoke(channel, payload)`；`channel ∉ CHANNELS` ⇒ **立即 reject**（不入 IPC）；`CHANNELS` 白名单单源 = 预载常量（主侧经 `createRequire` 读之，免 CJS→ESM 具名互转疑点）。

**协议面**：`app://<host>/…`（`standard:true, secure:true, supportFetchAPI:true`），host 为实现常量 `desktop`（单源 = `protocol.mjs`）。
路径 resolve 后必须落在 `renderer/` 根内（`path.relative` 不以 `..` 起），否则 404 + `blocked++`；扩展名白名单 `.html / .mjs / .css / .svg / .png / .woff2` + MIME 表。
CSP（`index.html` meta）= `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'`——**零 `unsafe-inline` / 零 `unsafe-eval`**。

**窗口面**：单窗口；`contextIsolation:true` · `sandbox:true` · `nodeIntegration:false` · `preload: src/preload/preload.cjs`；主题经 CSS `prefers-color-scheme` 消费（与主进程 `nativeTheme` 同一事实，本批零通道面）；菜单 = 原生菜单（主进程动作面；首版不承载渲染面动作）。

**渲染面启动面（判据③读数源）**：`app.mjs` 于 `DOMContentLoaded` 发一次 `invoke("config:read")` → 成功 ⇒ `documentElement.dataset.boot="ok"`，失败 ⇒ `="error"`；主进程以 `webContents.executeJavaScript` 读回该属性。

### 2.5 用例表（正常 / 边界 / 错误 · 输入 / 期望输出）

| # | 用例 | 类 | 输入 | 期望输出 | 落点 |
|---|---|---|---|---|---|
| U1 | 版本谓词边界 | 边界 | `hostFloorMet`：`22.13.0` / `22.13.1` / `24.19.0` / `22.12.9` / `22` / `22.14.0-rc.1` | 前三 true；后三 false（`22` 按 22.0 保守不过闸；含预发布 ⇒ 不过闸） | `test/host-floor.test.mjs` |
| U2 | sqlite 探针分支 | 错误 | `engineFloorMet({version:"22.18.0", loadSqlite: async()=>{throw new Error("No such built-in module: node:sqlite")}})`；对照组 `loadSqlite: async()=>{}` | false；对照 true（Node 够而 sqlite 缺 = Electron #47706 形态） | 同上 |
| U3 | 本机真探针 | 正常 | `engineFloorMet({version: process.versions.node, loadSqlite: () => import("node:sqlite")})` | true（兼环境契约：测试机即产品下限面） | 同上 |
| U4 | 接线机检 | 结构 | 读 `src/main/main.mjs` 源 + `package.json` | 下限自检调用点先于 `registerAppScheme(` / `serveAppProtocol(` / `createWindow(`；失败分支含显式退出（`app.exit(`）不抛；`main === "src/main/main.mjs"`；本档已登记清单 | 同上 |
| U5 | 渲染面闭包 | 正常 | 自 `renderer/app.mjs` 起静态闭包（注释剥离 · 只走静态 import/export-from 边） | `builtins` 空 ∧ 闭包内零 `@thincoder/core` / 零裸包 ∧ 档数 ≥ 3（非平凡） | `test/guard-closure.test.mjs` |
| U6 | 违规样本判红 | 错误 | 合成源（内存样本，**不写盘**）：`import fs from "node:fs"`；`import "@thincoder/core/config.mjs"` | 违规判定非空（防假绿反证） | 同上 |
| U7 | 零内联脚本 | 结构 | 读 `renderer/index.html` | 无内联 `<script>` 体 ∧ CSP 无 `unsafe-inline` / `unsafe-eval` | 同上 |
| U8 | 清单两向自检 | 边界 | 盘上未登记 `.test.mjs`；清单项不在盘 | 两向皆 exit 1 并给文件名（未登记 = 永不执行 ⇒ 反查即失败） | `test/run.mjs` |
| U9 | 冒烟主实例 | 正常 | `npx electron . --smoke` | 单行 JSON ∧ `ok:true` ∧ exit 0（`served>0` ∧ `boot:"ok"`） | 判据②③读数 |
| U10 | 冒烟第二实例 | 边界 | 主实例持锁时再起一实例 `--smoke` | `lock:"secondary"` ∧ `window:false` ∧ exit 0 | 同上 |
| U11 | 下限不足 | 错误 | 下限不满足的宿主（本机不可得 ⇒ 标 unverified-until-host） | exit 3 ∧ JSON `floorMet:false` ∧ `errors` 明示 ∧ 不崩栈 | 同上 |
| U12 | 协议逃逸 | 错误 | 冒烟内三探针：`app://desktop/index.html`；`app://desktop/../package.json`（含 `%2e%2e` 变体） | 正常请求 200 ∧ `served++`；逃逸请求 404 ∧ `blocked++` ∧ 文件未返回 | 同上（§2.6 D-4） |

U1–U8 属自动层（`npm test` 内）；U9–U12 属冒烟读数层（`npx electron . --smoke` 单次运行的 JSON；**不进 `npm test`**——CI 化归 P4/A3）。
U1/U2/U4 形态照扩展端先例：`thincoder-vscode/test/engine-floor-guard.test.mjs:35-95`（版本闸边界 + 探针分支 + 接线机检）与 `:101-127`（静态闭包helper）。

### 2.6 关键决策记录（实施分解 · 被否候选）

| # | 决策 | 理由 | 被否候选 |
|---|---|---|---|
| D-1 | 本批 = 骨架批，只落「可启动 + 一条通道往返 + 测试面 + 守卫」 | 判据①–⑤ 的可机检性要求最小可跑面；一次到位会同时触视图/项目面/设置面（判据反而不可读数） | 一次落三列视图骨架 + 通道面（否：读数面过宽，判据②③被视图噪声污染） |
| D-2 | 宿主下限谓词落**零 `electron` 导入**的叶子模块 `src/main/host-floor.mjs` | 开篇第 3 段理由（平 node 导入 `main.mjs` 必炸；`electron` 真包无 mock 面） | ① 谓词内联 `main.mjs`（否：T-DSK15 自动层不可跑）② 建 `test/electron-mock/` + `file:` devDep（否：`electron` 名位被真包占，二者不可同存） |
| D-3 | `CHANNELS` 白名单单源 = 预载常量的唯一副本；主侧 `createRequire` 读之并据以注册/分发 | 单源即消重（无需两副本 parity 测试）；白名单本属窄桥定义面 | ① 主侧另存副本 + parity 测试（否：两副本 = 漂移面，且本批无第三档可放该测试）② `channels.json`（否：表外新档） |
| D-4 | 冒烟含三探针：正常请求 200 / 逃逸请求 404 / 渲染面引导读数 | 判据②「`app://` 可服务」+「逃逸防护」同一读数可得，避免只靠「页面打开了」间接推断 | 只读 `boot`（否：逃逸防护零读数，半开不自知） |
| D-5 | `config:read` 处理体本批落 `ipc.mjs`（`settings.mjs` 抽出留后续批） | 本批只一条通道，先落地再按面抽；通道归属档（`docs/desktop/design/IPC.md` §2）不变 | 本批即建 `settings.mjs`（否：无第二处置，空档占位） |
| D-6 | `@thincoder/core` 以 `node_modules` **junction** 指向 `thincoder-core`（照 vscode 先例） | 仓内本地核即依赖源，零发布环 | 发布包引入（否：改核发布面，超本批边界） |
| D-7 | 测试入口自建 `test/run.mjs`（显式清单 + 两向漏登记自检 + `.test.mjs` 收集） | 同源纪律延续（未登记 = 永不执行 ⇒ 反查即失败）；本批无 `integration/` 域，故只落单元清单 | 直接 `node --test` 通配（否：盘上新档静默不跑） |
| D-8 | 主题经 CSS `prefers-color-scheme` 消费，本批零主题通道 | 系统事实由渲染面原生媒体查询直接得；主进程 `nativeTheme` 仅作同事实对照 | 经 IPC 下发主题（否：同一事实两路，违单点重建纪律） |

### 2.7 边界（本批不做）

- **依赖面**：零第三方运行时依赖（唯 `@thincoder/core`）；devDep 唯二 = `electron` / `electron-builder`。**零构建**：无 bundler / transpile；渲染面 ESM 由 `app://` 直供。
- **不改面**：核（`thincoder-core/**`）· 扩展（`thincoder-vscode/**`）· CLI（`thincoder-cli/**`）· prompt 面（产物码，非本批笔权）。
- **不产分发物**：`electron-builder.yml` 不在本批 ⇒ 本批不产安装包（`package` script 声明但不跑）。
- **渲染面工艺常量**（`docs/desktop/design/RENDERER.md` §2 / §3：`MAX_RENDER_BLOCKS` / `HISTORY_PAGE` / 跟滚阈值）本批不落 —— 随视图批。
- **视图 / 项目面 / 设置 / 活动池 / 审批卡 / 会话视图**本批不落（§2.2）。

### 2.8 上抛与报告项

| # | 项 | 类 | 处置建议 |
|---|---|---|---|
| R-1 | 判据②③ 需 `npm install` 拉 Electron 二进制（registry 实测可达：`npm view electron version` = `44.4.5`）；**二进制下载源（GitHub release 面）可达性 unverified** | 环境风险（非阻塞） | 不可达 ⇒ 走 `ELECTRON_MIRROR` 镜像或上报；**不得静默跳过判据②③** |
| R-2 | `src/main/host-floor.mjs` = 设计 §4.1 表外新行（`main.mjs` 同面拆分，合计不超预算） | 表 delta（非阻塞） | 请父侧确认；若不认 ⇒ 恢复内联，代价 = T-DSK15 自动层退化（§2.3 末） |
| R-3 | `--smoke` 旗标 = 设计 §5 验证面② 的实施载体 + 判据②③读数源；**不进 IPC 通道表**（非产品通道面） | 实施载体 | 备案即可（设计档已有声援面） |
| R-4 | `package` / `postpackage` 本批声明但不跑（无 `electron-builder.yml`）⇒ `check-dist.mjs` 本批只落入口 + 缺口 exit 1 显式化，产物面断言随打包批 | 边界 | 打包批接手（§2.2 / §2.7） |
| R-5 | 设计 §2.1 两项待实测读数（Electron 内置 Node 版本对应面 / `file://` 模块脚本同源面）——本批冒烟读数即第一项实证来源；**本批不改设计档**（评审冻结面） | 回填（父侧裁时机） | 实施批后另起设计档修正轮（笔权 = 我）；本批报告不闭此项 |
| R-6 | `docs/README.md` 三部分口径（设计 §10 C）· `PROJECT-MANIFEST.json` docRoot 面 | 父侧 | 本批不涉 |
| R-7 | 需求 §6「启动可接受（阈值与测法留设计轮）」留白 + 平台差异面逐项定形（设计 §10 F 已登记缺口） | 父侧 / 需求档 | 本批不涉、不扩范围 |
| R-8 | 台账归批行 = #353（批级已立）；本批条目行落账 | 父侧（子代理无台账写权） | 父侧落账 / 核销随 §6 |

### 2.9 三方一致对照 + 需求档合规检查

- **三方链**：本档 E-1–E-7 ↔ 批次档 §1.2 判据①–⑤（逐条同源）↔ 设计档 §5 验证面 / §4.1 文件表 / §7 用例表（T-DSK15 · T-DSK16 原编号未改）。骨架批不闭合功能点（§2.2 已明示）⇒ 不冒充 D1–D12 验收。
- **需求档合规（读面 · 五要素）**：§1 模块目标 ✓ · §4 功能点 D1–D12 ✓ · §5 边界 ✓ · §7 验收 A1–A4 ✓ · §8 依赖 P1–P4 ✓ ⇒ **可设计**。本批设计**不新起需求、不新增判据**。
- **本轮一致性自查（就地可修面已处理）**：
  - ① E-4 基线数（悬空 4 / 行宽 18）本批实测复现，与 §1.2 判据④一致 ✓；
  - ② 判据⑤ 读数形式按「基线非空」明确为**增量零**（仓内实施前已有 28 项未提交改动）——属读数表达面，已在 §2.1 末注内定形，不改需求档 ✓；
  - ③ 本批文件表 = 设计 §4.1 的**真子集 + 一处明标 delta**（R-2），无隐形新增 ✓；
  - ④ 渲染面 i18n 供给面本批**只下发不消费**（`renderer/i18n.mjs` 随视图批）——载荷形已按 `docs/desktop/design/IPC.md` §2 定，无悬空指针 ✓。
- **未核面（如实标注）**：R-1 的二进制下载可达性 = unverified（本批不做网络实测）；U11 的本机下限不足路径 = unverified-until-host。

### 2.10 编号索引与报告项续

**§2 编号索引（指针落点）**：2.1 条目（覆盖面）· 2.2 不覆盖 · 2.3 文件表（**末段 = table delta + 拆分的强制理由**，D-2 的理由面）· 2.4 接口契约（含**冒烟读数契约**字段闭集 · 通道面 · 协议面 · 窗口面 · 渲染面启动面）· 2.5 用例表（U9–U12 = 冒烟读数用例）· 2.6 关键决策 · 2.7 边界 · 2.8 上抛与报告项 · 2.9 一致对照与需求档合规。

- **R-9**（候选实践沉淀 · 父侧路由）：脏树上的「零回归」判据只能判**增量零**（实施前后同一命令输出逐字相等），不得按「绝对零 diff」读——本批实测：实施前仓内基线已有 28 项未提交改动。属跨板块通用工程实践，**未落任何设计档**（本批设计档 = 评审冻结面，非设计轮不擅改）⇒ 沉淀位置请父侧裁定。

### 2.11 设计评审 §3 轮次 1 收正块（修复轮 1 · eng-designer · 2026-09-25）

**本节为修后为准**：下列 10 条对 §2.1–§2.10 相应位置作收正；原行不回改（批次档只追加），凡与上述各节冲突者**以本节为准**。收正范围 = 设计评审 §3 轮次 1 全部 10 条（🔴 1 · 🟡 4 · 🔵 5；父侧裁「全采纳」）；**零新语义**——逐条直接派生于评审发现与父侧裁定。设计五档（`docs/desktop/design/**`）不动（本档 §1.4 边界）。

**① E-6 / U5「非平凡」门槛不可达（🔴 · 评审 #1 · 取父侧裁定之①）**

位置：§2.1 E-6 行（`:63`）· §2.5 U5 行（`:142`）。

收正后（U5 主判 · **写死**）：

- 非平凡 = **闭包非空 ∧ 入口档（`renderer/app.mjs`）在闭包内 ∧ 闭包内逐档已读**（逐档实际读入并解析；任一档读不到 ⇒ 判红，不得静默跳过）。
- 闭包读法不变：自 `renderer/app.mjs` 起、注释剥离、只走静态 `import` / `export-from` 边。
- 「闭包档数 ≥ 3」**本批不适用**：本批盘上渲染面 JS = 2 档（`renderer/app.mjs`（`:90`）· `renderer/dom.mjs`（`:91`）；`i18n.mjs` / `store.mjs` / `views/**` 明示不建——`:71`，与 `docs/desktop/design/PROJECT.md:96-97` 同源）。
- 该门槛**随产品增长生效**：自渲染面 JS ≥ 3 档的批起，非平凡 = 闭包档数 ≥ 3（届时 ≤ 2 档即判红）。
- E-6 行文字不动（「非平凡」以本定义为准）；U6 反证（违规合成样本判红）保留原样。

依据：评审 #1。**绿条件**：按本读法 E-6 在**实施前即可判为可达成**（不依赖任何不可达门槛）。
被否候选：明示 `index.html` / `styles.css` 计入闭包 —— 否（两档无边可走，与「只走静态 import 边」的闭包定义相斥；为凑门槛改定义 = 读数面扩容）。

**② D-3 常量与装配副作用分离 + 新用例 U13（🟡 · 评审 #2）**

位置：§2.6 D-3 行（`:160`）· §2.4 预载面（`:124`）· §2.5（新增 U13）· §2.3 `preload.cjs` 行（`:88`，预算 45 不变）。

收正后（D-3 落地约束 · 形态**写死**）：

1. 常量与装配**同档同源**：沙箱预载的 `require` 为 polyfill，**不能用 CommonJS 分档拆分预载**（实读官方档 `electronjs.org/docs/latest/tutorial/sandbox`「Preload scripts」节：可载 = `electron`（渲染进程模块）+ `events` / `timers` / `url`（＋ `node:` 三条），并明言无法以 CommonJS 多档拆分）⇒ 常量**不外移**为数据档；白名单单源仍 = `preload.cjs`，主侧读取路径不变（`createRequire`）。
2. 装配副作用隔离：`contextBridge` 装配整块（含其内 `require("electron")`）落**装配函数体**内；顶层只允许四类语句 = 常量定义 · 函数声明 · 守卫调用 · 守卫导出。
3. 守卫谓词**写死** = `typeof window !== "undefined"`（沙箱预载处为渲染进程上下文 ⇒ 装配；主进程 / 平 node 无 `window` ⇒ 零装配）。
4. 顶层三上下文零装配副作用：① 沙箱预载（装配执行）② 主进程 `createRequire` 读取（不装配、不触 `electron`）③ 平 node 测试（同②）。
5. 导出面亦加守卫：`module` 不在沙箱预载 polyfill 全局面（同官方档：polyfill 全局仅 `Buffer` / `process` / `clearImmediate` / `setImmediate`）⇒ 须写 `if (typeof module !== "undefined" && module.exports) module.exports = { CHANNELS };`，不得无条件触碰 `module`。
6. `CHANNELS` = `Object.freeze(["config:read"])`。
7. 守卫可满足性面：若不满足（如预载处无 `window`）⇒ 装配不发生，U9 冒烟即红（`boot:"error"`）——**不做静默回退**。

**新用例 U13（补入 §2.5 · 落点 = `test/host-floor.test.mjs`（接线机检组，与 U4 同组））**

- 类：结构 / 错误（防假绿反证）。
- 输入：① 平 node 经 `createRequire` 载 `src/preload/preload.cjs`（= 主进程侧读取路径）② 子进程 `node -e "globalThis.window={};require('…/preload.cjs')"`（合成「守卫满足」上下文）③ 读 `src/main/ipc.mjs` 源。
- 期望：① 不抛 ∧ `CHANNELS` = `["config:read"]` ∧ 已冻结 ⇒「主进程侧读取不执行预载装配」 ② 非零退出且错面落在装配入口（提及 `exposeInMainWorld` ∨ `electron`）⇒「守卫是真门」 ③ 源含 `createRequire` 读取点（D-3 接线成文的机检面）。
- 反证效力：装配若被挪到顶层（或守卫写错），① 即红。
- **未核面退出关键路径**：`contextBridge` 在主进程是否可得（评审面 unverified）——本收正下读取路径不触 `electron`，该事实成立与否都不再承重。
- 预算随动：`test/host-floor.test.mjs`（`:96`）60 → **75**（含 U13；见 ⑥）。

**③ R-2 引据改挂 §1.5 裁认（🟡 · 评审 #3）**

位置：§2.3 末段（`:100`）括号「拆分授权 = §4.1 按面拆分/拆分预案」。

收正后（该括号重写）：

> **表 delta 一处（明标 · 报告项 R-2）**：`src/main/host-floor.mjs` **不在** `docs/desktop/design/PROJECT.md` §4.1 原表逐行之内——它是该表 `main.mjs` 行的**同面拆分**（**授权 = 本档 §1.5 R-2 裁认**（`:37`）：表外新增行认 + 设计面同步随修正轮；行预算自 `main.mjs` 划出，两档合计 80 行 = 原表预算，不超）。

- 删除对「§4.1 按面拆分 / 拆分预案」的引据：§4.1 拆分条款**逐档带阈值**（`ipc.mjs` 超 200（`:87`）· `agent-host.mjs` 超 300（`:88`）· `styles.css` 超限三段（`:110`）· `chat.mjs` 定拆（`:110`）），`main.mjs` 行（`:84`，~80 行）**无**拆分条款。
- 保留原样：机制理由（平 node 导入 `main.mjs` 必炸，`:101`）——与本条无关，不动。

依据：评审 #3 · 批次档 §1.5（`:37`）。

**④ E-4 主判改「失败行集合无新增」+ 基线快照形态（🟡 · 评审 #4）**

位置：§2.1 E-4 行（`:61`）· §2.9 自查①（`:192`）。

收正后（E-4 读数）：

- **主判** = `node scripts/doc-check.mjs` 的**失败行集合 ⊆ 实施时刻基线快照的失败行集合**（零新增即绿；新增任一条 ⇒ 红）。
- 逐数相等**降为附注**（不作判据）——锚面为多笔共用面，可被本批外动作推移。
- **基线快照形态（写死）**：① 时刻 = 实施开始前首次实跑的时刻（本地时间 + 时区）；② 命令 = `node scripts/doc-check.mjs`（cwd = `thincoder/`）；③ 内容 = 闸态失败行**逐字**（全部 `✗` 行 + `FAIL(…)` 汇总行 = 「失败行集合」的原始面；报告面与 PASS 面不入档并注明省略规则，需全文时按同命令 + 时刻复跑）；④ 落点 = 批次档 §5 实施记录**首块**（先于任何实施写入）。
- 修复轮实测（对照）：悬空 4 · 行宽 **19**——与 §1.2 判据④记 18 差 1，差异行 = `docs/vsc/requirements/WEBVIEW.md:80`（312 字符）；清单 = `docs/core/**` 14 行 + `docs/vsc/**` 5 行，批次档未涉 ⇒ 本收正下该差值**不判红**（外因推移锚面之实证）。

依据：评审 #4（其 unverified 面 = 基线数不可复现，本收正以「实施时刻快照」消解）。

**⑤ §2.2 用例面补 10 条人工 / 实机面（🟡 · 评审 #5）**

位置：§2.2 首条（`:70`）。

收正后（该条补末句）：「用例面：T-DSK15 / T-DSK16 本批可跑；**T-DSK1 / 2 / 3 / 12 / 14 / 17–20 随后续批**；**T-DSK4–11 / 13 / 21（10 条）= 设计 §4.1 人工 / 实机面（人工走查），不落自动批**。」

依据：评审 #5 · `docs/desktop/design/PROJECT.md` §4.1 三分落点行（`:112-117`：自动 4 项 + 自动·项目面 2 · CI 冒烟 1 + 人工交互面 1 + 实机交互类 9 = 21 条逐条有落面）。

**⑥ 文件表合计（🔵 · 评审 #6）**

位置：§2.3 合计行（`:98`）。

收正后：合计 = **950** = 逐行之和（45+50+30+60+90+90+45+45+60+40+120+60+50+20+**75**+70；16 档含 `package.json`）。

- 随动一行：`test/host-floor.test.mjs`（`:96`）60 → **75**（收正② 的 U13 接线机检预算随动）；其余 15 行不变。
- 原记 ~810 与逐行之和不等（收正前逐行和 = 935）——重算使合计 = 逐行之和。

依据：评审 #6 · 收正②。

**⑦ `channels` 字段定义题面（🔵 · 评审 #7）**

位置：§2.4 冒烟读数契约（`:110-116`，契约行 `:114-115`）· §2.1 E-3 行（`:60`）· §2.5 U9 / U10（`:146-147`）。

收正后：

- **定义（写死）**：`channels` = **本次运行主进程侧实际发生的通道分发集合**（顺序去重）；白名单常量**不在此字段复述**。
- 契约行改为 `"channels":[…],`（取值随实例，见下）+ 注「实际分发集合（非常量）」。
- 期望值对齐：U9（主实例）= `["config:read"]`；U10（第二实例）= `[]`（无窗口 ⇒ 零分发——「无往返」的正面读数）。
- E-3 读数集（`boot:"ok"` ∧ `channels:["config:read"]` ∧ `configKeys>0`）**保留**：此定义下 `channels` 是往返的实际证据，对判据③有证据力。

依据：评审 #7。

**⑧ 协议探针扩为 5 探针 + `probes` 读数（🔵 · 评审 #8）**

位置：§2.5 U12（`:149`）· §2.4 协议面（`:127`）· 契约 `protocol` 字段与 `ok` 式（`:114` / `:118`）· §2.1 E-2 行（`:59`）。

收正后（同一次冒烟，零成本）：

- 探针集 = **5 探针（正 2 / 负 3）**：
  - `html` = `app://desktop/index.html` ⇒ 200 ∧ `served++`；
  - `css` = `app://desktop/styles.css` ⇒ 200 ∧ MIME `text/css` ∧ `served++`；
  - `escape` = `app://desktop/../package.json` ⇒ 404 ∧ `blocked++` ∧ 文件未返回；
  - `escapePct` = `%2e%2e` 变体 ⇒ 同上；
  - `ext` = `app://desktop/probe.json`（白名单外扩展名）⇒ 404 ∧ `blocked++`。
- **判定序写死**（使负探针读数可归属）：① 逃逸门（resolve 越界）⇒ 404 + `blocked++` ② 扩展名白名单门 ⇒ 404 + `blocked++` ③ 存在性 ⇒ 404（不计数）。
- 契约 `protocol` 扩为：
  `{"served":N,"blocked":N,"probes":[{"id":"html","status":200,"mime":"text/html"},{"id":"css","status":200,"mime":"text/css"},{"id":"escape","status":404},{"id":"escapePct","status":404},{"id":"ext","status":404}]}`
- 主实例 `ok`（`:118`）追加两项：`probes` 逐项满足期望表 ∧ `protocol.blocked>=3`（计数接线与逐探针读数双证，防「探针硬编码」假绿）。
- §2.1 E-2 行（`:59`）读数同步补此两项。

依据：评审 #8（`renderer/styles.css` 档就此获得判据②的读数面；MIME 表与扩展名白名单一并纳入）。

**⑨ §2.9 映射分段（🔵 · 评审 #9）**

位置：§2.9 首条（`:190`）。

收正后（映射分段写）：「**三方链（分段）**：E-1–E-5 ↔ 批次档 §1.2 判据①–⑤（逐条同源）；**E-6 / E-7 ↔ 设计 §7 用例 T-DSK16 / T-DSK15**（`docs/desktop/design/PROJECT.md:199-200`）——E-6 / E-7 无 §1.2 判据条目 ⇒ **§6 核销面 = 7 条**（E-1–E-7）。骨架批不闭合功能点（§2.2）⇒ 不冒充 D1–D12 验收。」

依据：评审 #9。

**⑩ U10 两步程序（🔵 · 评审 #10）**

位置：§2.5 U10（`:147`）· §2.5 末注（`:151`）。

收正后：

- U10 输入 = **两步程序**：① 主实例**常态启动**（`npx electron .`，不加 `--smoke`；保持运行持锁）② 第二实例以 `npx electron . --smoke` 起。
- 期望：第二实例 JSON = `lock:"secondary"` ∧ `window:false` ∧ `channels:[]` ∧ exit 0；**取数以第二实例 JSON 为准**；步骤②完成后关主实例。
- §2.5 末注（`:151`）「单次运行」口径**仅适用 U9 / U11 / U12**（U10 需两实例并存）。

依据：评审 #10（`--smoke` 主实例打完 JSON 即 `app.exit(0)`（`:108`）⇒ 单次运行取不到 secondary 读数）· 收正⑦（`channels:[]`）。

**收正索引（号 → 收正位置）**

| 号 | 级 | 收正位置（原行坐标） | 收正要点 |
|---|---|---|---|
| 1 | 🔴 | §2.1 `:63` · §2.5 `:142` | U5 非平凡写死 = 非空 ∧ 入口在闭包内 ∧ 逐档已读；≥3 门槛延后（渲染面 ≥3 档的批生效） |
| 2 | 🟡 | §2.6 `:160` · §2.4 `:124` · §2.3 `:88` · §2.5（新增 U13） | D-3 落地约束（常量与装配分离 · 守卫谓词写死 · 导出加 `module` 守卫）+ U13 接线机检 |
| 3 | 🟡 | §2.3 `:100` | 拆分授权改挂 §1.5 R-2 裁认（`:37`）；§4.1 逐档阈值条款不适用；机制理由（`:101`）保留 |
| 4 | 🟡 | §2.1 `:61` · §2.9 `:192` | E-4 主判 = 失败行集合无新增；基线快照形态（时刻 / 命令 / 闸态失败行逐字 / §5 首块） |
| 5 | 🟡 | §2.2 `:70` | 补 T-DSK4–11 / 13 / 21（10 条）= 人工 / 实机面，不落自动批 |
| 6 | 🔵 | §2.3 `:98` · `:96` | 合计 = 950 = 逐行之和（`host-floor.test.mjs` 60 → 75 随 U13） |
| 7 | 🔵 | §2.4 `:110-116` · §2.1 `:60` · §2.5 `:146-147` | `channels` = 实际分发集合；U10 期望 `[]` |
| 8 | 🔵 | §2.5 `:149` · §2.4 `:114`/`:118`/`:127` · §2.1 `:59` | 5 探针 + `probes` 数组；判定序写死；`ok` 式追加两项 |
| 9 | 🔵 | §2.9 `:190` | 映射分段（E-1–E-5 ↔ 判据①–⑤；E-6 / E-7 ↔ T-DSK16 / T-DSK15）⇒ §6 核销面 7 条 |
| 10 | 🔵 | §2.5 `:147`/`:151` | U10 两步程序；取数 = 第二实例 JSON |

**收正块未核面（如实 · 不变）**：① `contextBridge` 在主进程可得性 = unverified（收正② 下已退出关键路径）；② Electron 二进制下载可达性 = unverified（实施轮实测）；③ U11 下限不足路径 = unverified-until-host。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面**：`docs/batches/2026-09-25-desktop-impl-1.md` §2（条目 E-1–E-7 · 不覆盖 · 文件表 16 档 · 接口契约 · 用例 U1–U12 · 决策 D-1–D-8 · 边界 · 上抛 R-1–R-9 · 三方一致）↔ 设计五档一致性 + 判据可机检性 + 边界/上抛完整性；排除面 = 设计五档本体（已批准）/ 打包面 / 视图面 / `host-floor.mjs` 表外行 / R-1 二进制可达性。
**计数**：🔴 1 · 🟡 4 · 🔵 5（合计 10）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收判据可达成性（Acceptance criteria · E-6） | 🔴 | E-6（`:63`）要求 `test/guard-closure.test.mjs` **全绿**，其判据 U5（`:142`）要求闭包「档数 ≥ 3（非平凡）」；本批渲染面 JS 模块只有 2 档（`renderer/app.mjs` · `renderer/dom.mjs`——`:90-91`），`renderer/i18n.mjs` / `store.mjs` / `views/**` 明示不建（`:71`，与设计 `docs/desktop/design/PROJECT.md:96-97` 同源）⇒ 按 U5 的「自 `renderer/app.mjs` 起、只走静态 import/export-from 边」读法，闭包 ≤ 2 档，门槛不可达；改按 E-6 行「`renderer/**` 盘上档」读才为 4 档 ⇒ 同一判据两读法结论相反，自然读法下本批拿不到 E-6 的绿读数 | 二择一并写死读数口径：①「非平凡」降到与本批图相符的门槛（闭包非空 ∧ 入口档在闭包内），把 ≥3 档门槛推到含 `i18n/store/views` 的后续批；② 或明示 `index.html` / `styles.css` 是否计入闭包并同步 U5「只走静态 import 边」的措辞——使 E-6 在实施前即可判为绿；反证 U6 保留不动 |
| 2 | 可行性（Feasibility · D-3） | 🟡 | `:124` 让主进程经 `createRequire` 读预载常量 `CHANNELS`（单源化；被否候选见 `:160`），但 `preload.cjs` 按 KD-3（`docs/desktop/design/PROJECT.md:38`）是执行 `contextBridge` 装配的沙箱档 ⇒ 主进程加载同一档即执行其装配副作用；`contextBridge` 在主进程是否可得 = **unverified**（Electron 行为面不在本评审可读面，未实核），任务书既未要求该读取「零副作用」，也未给实测结论 | 把「常量与预载装配副作用分离」写成 D-3 的落地约束（或在任务书注明实测读数），并补一条接线机检（主进程侧不执行预载装配）——否则首个冒烟可能在主进程加载预载档处崩，判据②③同时假红 |
| 3 | 文档一致性（Methodology · R-2 引据） | 🟡 | `:100` 称 `host-floor.mjs` 的拆分「授权 = §4.1 按面拆分/拆分预案」，但 `docs/desktop/design/PROJECT.md` §4.1 的拆分条款**逐档且带阈值条件**：`ipc.mjs` 超 200（`:87`）· `agent-host.mjs` 超 300（`:88`）· `styles.css` 超限三段（`:110`）· `chat.mjs` 定拆 stream/scroll（`:110`）；`main.mjs` 行（`:84`，~80 行）**无**拆分条款 ⇒ 引据与设计文本不符（实际授权 = `:37` §1.5 的裁认 + 条件同步） | 引据改为「§1.5 裁认的表 delta + 设计面同步随修正轮」（或删去该括号），机制理由（平 node 导入必炸）保留——使 delta 授权来源可追溯，不再挂在 §4.1 不存在的条款上 |
| 4 | 验收读数稳健性（Acceptance criteria · E-4） | 🟡 | E-4（`:61`）把读数钉成**逐数等于基线**（悬空 4 / 行宽 18），而同一批窗口内有非本批笔在动锚面文档（`:41` §1.5 R-6：`docs/README.md` 口径改四 + `PROJECT-MANIFEST.json`）⇒ 锚面读数被别处动作推移，本批可能因外因假红；且该基线数在本评审面不可复现（`scripts/doc-check.mjs` 不在可读面）= **unverified** | 主判改为「失败行集合无新增」（并记实施时刻重测的原始输出与时刻），逐数相等降为附注——使判据只对本批动作敏感 |
| 5 | 需求/用例覆盖（Requirements coverage · §2.2） | 🟡 | `:70` 用例面清单覆盖 T-DSK15/16（本批）+ T-DSK1/2/3/12/14/17–20（后续批），**漏** T-DSK4–11 / 13 / 21 共 10 条；设计侧这 10 条 = 人工面（`docs/desktop/design/PROJECT.md:117`：实机交互类 9 条 + 人工交互面 T-DSK21）⇒ 设计「21 条逐条有落面」在任务书侧不闭合，后续自动批易被误读为漏项 | `:70` 补一句「T-DSK4–11 / 13 / 21 = 设计 §4.1 人工/实机面（人工走查），不落自动批」，或整句改引 `docs/desktop/design/PROJECT.md` §4.1 三分落点行——使 21 条在任务书侧逐条可查 |
| 6 | 数值漂移（Clarity · 文件表合计） | 🔵 | `:98` 合计记 ~810，逐行预算加总 = **935**（45+50+30+60+90+90+45+45+60+40+120+60+50+20+60+70），差 125；同段 delta 算式本身自洽（50+30 = 80 = 原表 `main.mjs` 预算） | 重算合计行（或核对逐档预算）使合计 = 逐行之和——避免后续批把 810 当包级预算基准 |
| 7 | 契约字段语义（Clarity · 冒烟读数） | 🔵 | E-3（`:60`）以 `channels:["config:read"]` 作往返读数之一，但 `:115` 把它写成字面量示例（与 `"lock":"primary|secondary"` 的取值域写法混排）⇒ 无法判定该字段是「本次运行实际发生的通道调用集合」还是「预载白名单常量」；若为后者，它对判据③零证据力（往返证据只剩 `boot` / `configKeys`） | 在 `:110-116` 契约里给 `channels` 下定义题面并让 U9/U10 期望值对齐；若确为白名单常量，则把它移出 E-3 的读数集，避免以常量冒充往返证据 |
| 8 | 错误路径覆盖（Acceptance criteria · 协议面） | 🔵 | 协议面声明扩展名白名单 + MIME 表（`:127`），但读数只有 `index.html` 正探针与 `../package.json` 逃逸负探针（U12 `:149`）⇒ 白名单外扩展名（如 renderer 内 `.json`）的 404 路径、`.css` / `.mjs` 的正 MIME 路径零读数；`renderer/styles.css` 档在本批亦无任何判据读数面（`check-dist.mjs` 已由 R-4 明示） | 同一次冒烟加零成本探针（`app://desktop/styles.css` 期望 200 + CSS MIME；renderer 内非白名单扩展名期望 404 ∧ `blocked++`）——把 MIME 表与白名单一并纳入判据②的读数面 |
| 9 | 三方一致措辞（Clarity · §2.9） | 🔵 | `:190`「本档 E-1–E-7 ↔ 批次档 §1.2 判据①–⑤（逐条同源）」对 E-6/E-7 不成立——二者无 §1.2 判据，来源 = 设计 §7 的 T-DSK15 / T-DSK16（`docs/desktop/design/PROJECT.md:199-200`）⇒ §6 按判据①–⑤ 核销只能核到 5 条，易漏 E-6/E-7 | 把映射分段写明（E-1–E-5 ↔ 判据①–⑤；E-6/E-7 ↔ T-DSK16 / T-DSK15）——使 §6 核销面 = 7 条 |
| 10 | 用例程序性（Clarity · U10） | 🔵 | U10（`:147`）要「主实例持锁时」再起一实例，但 `:151` 把 U9–U12 归入「`npx electron . --smoke` **单次运行**的 JSON」，而 `--smoke` 主实例打完 JSON 即 `app.exit(0)`（`:108`）⇒ 单次运行取不到 secondary 读数，程序未写明 ⇒ 判据②「单实例锁生效」的读数不可按书写复现 | 把 U10 前置写成两步程序（主实例常态运行持锁 → 第二实例以 `--smoke` 起）并注明取数以第二实例 JSON 为准 |

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审面**：`docs/batches/2026-09-25-desktop-impl-1.md` §2.11 收正块（`:205-360`，轮 1 发现 1–10 逐号收正 ·「修后为准」）——轮 2 = 核验轮：逐号核 1–10 是否真消解 + 收正块自洽性。排除面（行宽集外因推移 / 未提交计数 / 非本笔超宽行 / 表 delta 本体 / 实施面 / 设计五档本体）未涉。
**计数**：🔴 0 · 🟡 0 · 🔵 3（合计 3）。

**逐号核验（1–10 全部真消解）**

1. 🔴#1 E-6：`:215` 非平凡写死 = 闭包非空 ∧ 入口档（`renderer/app.mjs`）在闭包内 ∧ 逐档已读；`:217` 本批渲染面 JS = 2 档（`:90-91`；`:71` 明示 i18n / store / views 不建）⇒ ≥3 门槛本批不适用；`:218` 门槛随产品增长生效（渲染面 JS ≥ 3 档的批起）；`:221` 绿条件 = 实施前即可判可达成 ✓
2. 🟡#2 D-3：`:230-236` 落地约束 7 条（常量与装配同档同源 · 顶层四类语句 · 守卫谓词 `typeof window !== "undefined"` 写死 · `module` 守卫导出 · 不静默回退）+ `:238-245` 新增 U13（三输入 / 三期望 / 反证效力 / 预算随动 60→75）；`:244` 将轮 1 的 unverified 面（contextBridge 主进程可得性）退出关键路径 ✓
3. 🟡#3 引据：`:253` 改挂 §1.5 R-2 裁认（原文 `:37` 逐字核对一致）；`:255` 删去 §4.1 拆分条款引据并给逐档阈值说明；`:256` 机制理由（`:101`）保留 ✓
4. 🟡#4 E-4：`:266` 主判 = 失败行集合 ⊆ 实施时刻基线快照（零新增即绿，新增任一条 ⇒ 红）；`:267` 逐数相等降附注；`:268` 快照形态四项写死（时刻 / 命令 / 失败行逐字 / §5 首块）；`:269` 18↔19 差值披露且不判红 ✓
5. 🟡#5 用例面：`:277` 补 T-DSK4–11 / 13 / 21（10 条）= 人工 / 实机面，不落自动批 ⇒ 21 条三面齐 ✓
6. 🔵#6 合计：`:285` 950 = 逐行之和——按其自列 16 数复算 = 950，且与 §2.3（`:82-97`）逐行逐序相等（含 `:245` 的 60→75）；`:288` 旧记 ~810 / 935 的说明自洽 ✓
7. 🔵#7 channels：`:298-300` 定义 = 本次运行实际分发集合（顺序去重）；U9 = `["config:read"]` · U10 = `[]`（与 ⑩ 一致）；`:301` E-3 读数证据力保留 ✓
8. 🔵#8 探针：`:311-320` 5 探针（正 2 负 3）+ 判定序写死 + 契约 `protocol` 扩 `probes` + `ok` 追加两项；`blocked>=3` 与 3 条负探针自洽（覆盖质量见发现 2）✓
9. 🔵#9 映射：`:329` E-1–E-5 ↔ 判据①–⑤；E-6 / E-7 ↔ T-DSK16 / T-DSK15（与 §2.1 `:63-64` 一致）⇒ §6 核销面 = 7 条 ✓
10. 🔵#10 U10：`:339-341` 两步程序（主实例常态持锁 → 第二实例 `--smoke`）· 取数 = 第二实例 JSON · 「单次运行」口径限缩 U9 / U11 / U12——与 `:108`（`--smoke` 打完 JSON 即 `app.exit(0)`）相消解 ✓

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（引据算术 · 收正⑤ 依据行） | 🔵 | `:279` 以「自动 4 项 + 自动·项目面 2 · CI 冒烟 1 + 人工交互面 1 + 实机交互类 9 = 21 条」作 21 条落面依据，所列分项之和 = 17 ≠ 21（被引 `docs/desktop/design/PROJECT.md:112-117` 在本评审面外 ⇒ unverified）；收正⑤ 正文补句本身完整正确（10 条枚举与轮 1 一致），仅依据行待核 | 依据行改用自洽算式（10 条人工面 = 实机交互类 9 + 人工交互面 1），或按源面逐类重列使分项和 = 21 |
| 2 | Acceptance criteria（探针覆盖 · 收正⑧） | 🔵 | `:314-315` 两条 traversal 负探针（`../` 与 `%2e%2e`）若在 standard scheme 下被 URL 规范化先行消解，则转由扩展名门捕获（`.json` 白名单外）——`status:404 ∧ blocked++` 与 `blocked>=3` 仍可满足（读数不假红），但逃逸门① 可能零覆盖（即 D-4 欲避免的「半开不自知」）；该判定 = unverified（行为面不在本评审可读面） | 两条探针的实际归属门以实跑读数核定；若规范化短路成立，补一条规范化后仍越界的探针形态，或为探针读数增记归属门字段 |
| 3 | Doc hygiene（收正后残留面 · append-only 所致） | 🔵 | 覆盖声明已生效（`:207`「以本节为准」+ `:345-358` 索引），但旧值仍在原行可见：`§2.3:98` 合计 ~810 / `:96` 60 · `§2.5:142`「档数 ≥ 3」· `§2.1:61` 逐数相等表述 · `§2.4:113-115` 契约行 · `§2.2:70` 用例面 ⇒ 实施面单入口取数时易误读为现役（`§2.9:192` 数值面属已裁认面，不复议） | 设一份「覆盖值清单」（合计 950 · `host-floor.test.mjs` 75 · U5 非平凡定义 · E-4 主判 · 5 探针 · U10 两步程序）并入 §2.11 索引或 §5 首块，使实施面只按清单取数 |

**面外说明（不赋级）**：`docs/desktop/design/**`、`scripts/doc-check.mjs`、`thincoder-core/**`、`docs/vsc/**` 的引据（`:123` / `:255` / `:269` / `:279` 等）在本评审可读面之外，未逐条复核（保持 unverified）；无 Project Standards / 文档地图声明 ⇒ 方法学合规按 AGENTS.md 判。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧 · 2026-09-25 18:25）

**批准依据**：用户 2026-09-25 17:59「**批**」——父侧呈报的四条设计批准清单第 3 条明示「批准后 = 启动桌面端实施程序（按设计 §4.1 分批，先骨架 + 测试面）」⇒ **本批（实施第 1 段 = 壳骨架）在批准射程内**。

**评审**：§2 任务书两轮（轮 1 changes-required〔🔴1/🟡4/🔵5〕→ §2.11 收正块 → 轮 2 **pass**〔0🔴/0🟡/3🔵〕）。

**派发**：`eng-coder`（round = initial；batchDoc = 本档；写域 = `thincoder-desktop/**` 16 档）。**designToken 见评审回执——按凭据纪律不入档。**

## §5 实施记录（eng-coder）

### 5.0 实施面取数清单（评审发现 3 之建议落面 · 覆盖值——实施面单入口取数）

本批实施面按下列覆盖值取数（与 §2.11 收正块一致；旧值原行不改，按本清单读）：

| 项 | 覆盖值（现役） |
|---|---|
| 档数 / 合计行数 | 16 档 / **950 行** = 逐行之和（§2.3 逐行逐序相等） |
| `test/host-floor.test.mjs` 预算 | **75** 行（§2.3 旧记 60 作废） |
| U5 守卫测试门槛 | **非平凡 = 闭包非空 ∧ 入口 `renderer/app.mjs` 在闭包内 ∧ 逐档已读**；「≥3 档」门槛**本批不适用**（本批渲染面 JS 仅 2 档），自渲染面 ≥3 档的批起生效 |
| 判据④ 主判 | **doc-check 失败行集合无新增**（⊆ 基线快照）；逐数相等仅附注；悬空 4 / 行宽 18↔19 差值披露且不判红 |
| 协议探针 | **5 条**（正 2 = `html` / `css`；负 3 = `escape` / `escapePct` / `ext`）+ 判定序写死（逃逸门 → 扩展名门 → 存在性；仅前两者 `blocked++`） |
| U10 程序 | **两步**（主实例常态启动持锁 → 第二实例 `--smoke`）；取数 = 第二实例 JSON（`lock:"secondary"` ∧ `window:false` ∧ `channels:[]` ∧ exit 0） |
| `channels` 语义 | **本次运行实际分发集合**（顺序去重，非常量）；U9 = `["config:read"]` · U10 = `[]` |

### 5.1 实施前基线快照（判据④ / E-4 与判据⑤ / E-5 的依据）

**时刻**：2026-09-25 18:25（Asia/Hong_Kong，UTC+8）——实施开始前、创建 `thincoder-desktop/` 之前的瞬时读数。

**命令与读数**：

| 判据 | 命令（cwd = `d:\teamcode\thincoder`） | 读数 |
|---|---|---|
| ④ | `node scripts/doc-check.mjs` | 退出码 1；stdout 全量 **718 行 / 79434 字节**；sha256（前 16 位）`dc7642c72910b106`；汇总：候选 25017 · 悬空 4 · 注记豁免 43 · 拟新增 49 · 迁移期引文 221；扫描域 `docs` · 149 档 |
| ⑤ | `git status --porcelain -- thincoder-core thincoder-vscode thincoder-cli` | **27 条**（25 `M` + 2 `??`：`thincoder-core/test/session-end-param.test.mjs`、`thincoder-vscode/test/config-io-panel-guard.test.mjs`）；1186 字节；sha256（前 16 位）`d82d6ae516ca439c` |
| ⑤ | `git diff --stat -- thincoder-core thincoder-vscode thincoder-cli` | 26 行；1609 字节；sha256（前 16 位）`bc7c090a863a5e27` |

**失败行逐字（24 行 = 2 汇总行 + 18 行宽行 + 4 悬空行）**：

```
FAIL(锚): 4 条悬空（闸态——阈值 0）
FAIL(行宽): 18 行超 300 字符——文档人类可读判据。
✗ docs/core/design/MODEL-SPECS.md:323 cacheMode（符号）
✗ docs/core/design/MODEL-SPECS.md:1372 provider/core.mjs（路径/坐标）
✗ docs/core/design/MODEL-SPECS.md:1465 provider/core.mjs（路径/坐标）
✗ docs/core/design/SESSION.md:850 index.mjs:444-450（路径/坐标）
✗ 行宽 docs/core/design/CORE-UNIFICATION.md:1102（392 字符）
✗ 行宽 docs/core/design/CORE-UNIFICATION.md:1961（415 字符）
✗ 行宽 docs/core/design/MODEL-BENCH.md:1793（318 字符）
✗ 行宽 docs/core/design/MODEL-BENCH.md:1794（431 字符）
✗ 行宽 docs/core/design/MODEL-BENCH.md:1797（376 字符）
✗ 行宽 docs/core/design/MODEL-BENCH.md:1806（353 字符）
✗ 行宽 docs/core/design/MODEL-BENCH.md:1807（481 字符）
✗ 行宽 docs/core/design/MODEL-BENCH.md:1808（570 字符）
✗ 行宽 docs/core/design/MODEL-SPECS.md:409（385 字符）
✗ 行宽 docs/core/design/MODEL-SPECS.md:1356（388 字符）
✗ 行宽 docs/core/design/MODEL-SPECS.md:1372（356 字符）
✗ 行宽 docs/core/design/MODEL-SPECS.md:1374（484 字符）
✗ 行宽 docs/core/design/MODEL-SPECS.md:1914（314 字符）
✗ 行宽 docs/core/design/MODEL-SPECS.md:1916（665 字符）
✗ 行宽 docs/vsc/design/VSC-DEBT.md:301（931 字符）
✗ 行宽 docs/vsc/design/VSC-DEBT.md:650（303 字符）
✗ 行宽 docs/vsc/design/VSC-DEBT.md:711（418 字符）
✗ 行宽 docs/vsc/requirements/WEBVIEW.md:80（312 字符）
```

**判读口径（写死）**：实施后的失败行集合 ⊇ 本快照即红（新增任一条）；⊆ 本快照为绿。全程 stdout 逐行相等为最强形态（本批只新增 `thincoder-desktop/**`，而 `checkConfig.scanDirs = ["docs"]` ⇒ 预期逐行相等——实施后实测复核）。

### 5.2 实施记录（eng-coder · 2026-09-25 18:05–18:57）

**交付面 = 16 档（全在 `thincoder-desktop/`）+ 机械产物两项**（`node_modules/**` · `package-lock.json`——`npm install` 生成物、仓例不进 git，与 `thincoder-vscode/` 同例）。
仓根 `PROJECT-MANIFEST.json` 与 `docs/README.md` 的口径笔 = **父侧笔权**（§2.2 行 · §2.8 R-6）；本档实施不触、不claim。

**逐档实测行数**（as-of 18:5x；计行 = `split("\n")` 去尾换行 · 逐档尾换行存在 · 零 TAB · 零 BOM）：

| 档 | 实测 | 预算 | 差 | 代码/注释/空 |
|---|---|---|---|---|
| `package.json` | 20 | 45 | −25 | — |
| `src/main/main.mjs` | 83 | 50 | **+33** | 63/10/11 |
| `src/main/host-floor.mjs` | 42 | 30 | **+12** | 25/11/7 |
| `src/main/protocol.mjs` | 68 | 60 | **+8** | 49/12/8 |
| `src/main/window.mjs` | 130 | 90 | **+40** | 97/20/14 |
| `src/main/ipc.mjs` | 43 | 90 | −47 | — |
| `src/preload/preload.cjs` | 22 | 45 | −23 | — |
| `renderer/index.html` | 33 | 45 | −12 | — |
| `renderer/styles.css` | 114 | 120 | −6 | — |
| `renderer/app.mjs` | 39 | 60 | −21 | — |
| `renderer/dom.mjs` | 50 | 40 | **+10** | 33/11/7 |
| `scripts/check-dist.mjs` | 27 | 60 | −33 | — |
| `test/run.mjs` | 41 | 50 | −9 | — |
| `test/files.mjs` | 2 | 20 | −18 | — |
| `test/host-floor.test.mjs` | 92 | 75 | **+17** | 65/14/14 |
| `test/guard-closure.test.mjs` | 100 | 70 | **+30** | 80/11/10 |
| **合计** | **906** | **950** | **−44** | — |

预算口径 = §2.3 逐行预算 + §2.11 收正（`test/host-floor.test.mjs` 60→75）；§2.3 `合计 ~810` 行与逐行加总 935 不自洽（评审发现 6）⇒ 本表按逐行之和记 = 950。
超预算 7 档（+150 行）· 未满预算 9 档（−194 行）⇒ 包级 906 ≤ 950 上限内。**超预算性质逐档如实记**：`main.mjs`（代码 63 > 50）· `window.mjs`（代码 97 > 90）· `guard-closure.test.mjs`（代码 80 > 70）**代码行本身已超**；`host-floor.mjs`（25 ≤ 30）· `protocol.mjs`（49 ≤ 60）· `dom.mjs`（33 ≤ 40）· `host-floor.test.mjs`（65 ≤ 75）代码行在预算内、超出由注释头与空行分组构成。**零功能删减**（超预算不移除任何判据面 / 用例面）。

**判据落面**（E 面 → 实现面 → 读数见 §5.3）：
- E-1 `npm test` 全绿 = `test/run.mjs:1-41` 清单两向自检 + 收集 + `node --test` 派发；U1–U8 落 `host-floor.test.mjs` / `guard-closure.test.mjs` / `run.mjs`。
- E-2 单实例 + 单窗口 = `main.mjs:51-54`（非主实例分支 `report` 即时退出）· `main.mjs:68`（`createWindow` 唯一调用点）。
- E-3 引导往返 = `renderer/app.mjs:12-39`（`DOMContentLoaded` 一次 `invoke("config:read")` → `dataset.boot`）· 读回 = `window.mjs` 冒烟段 `executeJavaScript` · 装配 = `ipc.mjs:34-43`。
- E-4 文档锚面 = 零新失败行口径见 §5.3（**按父侧 18:56 裁定 = 按字面判红**）。
- E-5 三包零改动 = §5.3 逐字节读数。
- E-6 渲染面闭包 = `test/guard-closure.test.mjs:1-100`（自 `renderer/app.mjs` 起静态闭包 · 注释剥离 · 读不到即判红）。
- E-7 宿主下限 = `src/main/host-floor.mjs:1-42`（零 `electron` 导入的叶子）· `main.mjs:56-61`（调用点先于协议/窗口）· 用例 `host-floor.test.mjs`。

**U 面落点**：U1–U8 = 自动层（`npm test` 内，8 用例逐条 ✔）；U9/U10/U12 = 冒烟读数层（§5.3 逐字）；U11 = **unverified-until-host**（下限不足宿主本机不可得，设计自认面）。

**关键实现口径**（供后续批对照）：
1. 白名单**单源** = `src/preload/preload.cjs` 的 `CHANNELS`；主侧 `ipc.mjs:17` 经 `createRequire(PRELOAD_PATH)` 读之并**据以注册** ⇒ 通道名零第二副本；白名单项无处理体 ⇒ 注册期抛（fail-closed）。
2. 预载档顶层**零装配副作用**（守卫调用 / 守卫导出形态）⇒ 主进程侧 `require` 读取不触 `electron`（§2.11 收正②）。
3. 单行 JSON 唯一写点 = `main.mjs:32`；日志与栈一律 stderr（冒烟 JSON 前空行 = 宿主产物，非本档写点）。
4. 探针 5 枚（正 2 负 3）落 `window.mjs` 冒烟段；负探针命中门归属 = stderr 行（§5.3）。
5. 主题：主进程 `nativeTheme` 同事实 + 渲染面 CSS `prefers-color-scheme` 消费 + 首帧画布色镜像（`window.mjs:18`）；本批零主题通道。
6. 协议：`app://desktop/…` `standard:true, secure:true, supportFetchAPI:true`；`path.relative` 非 `..` 起 + 扩展名白名单 + MIME 表；逃逸 = 404 + `blocked++`。

**修正轮 1（本档自修 · 18:5x）**：三处按审计发现收正——`ipc.mjs:25` `locale` 由归一值改为**直报配置字段**（原实现 `normalizeLocale(config?.locale ?? "en")` 与 §2.4「`locale` = 配置语言字段（缺 ⇒ `"en"`）」字面不符；`projectDictionary` 内部自归一 `thincoder-core/i18n.mjs:102` ⇒ 字典面零影响）· `window.mjs:14` 注释移除不实的 `UI.md §1` 引据（WINDOW 尺寸无设计锚 = 实施选择，如实标注）· `window.mjs:17/62` 注释补事实（画布色镜像单源在 `styles.css`；`setWindowOpenHandler` = 无设计锚加固项）。改后复跑：`npm test` 8/8 · 冒烟 `ok:true`（§5.3）。

### 5.3 读数（实施后实测 · 2026-09-25 18:5x）

**E-1 · `npm test`**（cwd = `thincoder-desktop/`；清宿主注入变量 `ELECTRON_RUN_AS_NODE` 后跑——该变量是宿主产物，非本包要求）：
```
✔ U5: 渲染面静态闭包零 node: ∧ 零裸包（逐档已读 · 读不到即判红） (1.969ms)
✔ U6: 违规样本判红（内存合成源 · 不写盘） (0.2972ms)
✔ U7: 渲染面零内联脚本 + CSP 无 unsafe-* (3.747ms)
✔ U1: 宿主版本谓词边界（22.13） (10.2189ms)
✔ U2: Node 够而 node:sqlite 缺 ⇒ 不过闸（探针分支） (6.6791ms)
✔ U3: 本机真探针过闸（实时环境读数） (2.4184ms)
✔ U4: 下限自检调用点先于协议 / 窗口注册 + 失败不抛 + main 值锁 + 本档入册 (1.3478ms)
✔ U13: 预载档主进程可读不抛 / 平 node 装配判红 / 主侧读取面 = createRequire (110.705ms)
ℹ tests 8 / pass 8 / fail 0 / skipped 0
```
exit 0 ✓。stderr 1 行 `[host-floor] node:sqlite unavailable: No such built-in module: node:sqlite` = **U2 场景自带产物**（负分支的明示诊断，非失败）。
E-6 门槛口径（U5/U13）= 闭包非空 ∧ 入口 `renderer/app.mjs` 在闭包内 ∧ 逐档已读（**非「档数 ≥ 3」**——§2.11 收正①）；U13 = 预载档主进程可读不抛 + 平 node 装配判红 + 读取面用 `createRequire`（§2.11 收正②）。

**E-2 / E-3 / U9 / U12 · 冒烟主实例**（`npx electron . --smoke`）：exit 0 ✓；stdout **非空行 1 行**（首行为空行 = 宿主产物，本档唯一写点 `main.mjs:32`，零 `console.log`）：
```
{"smoke":1,"lock":"primary","window":true,"node":"22.21.1","sqlite":true,"floorMet":true,"protocol":{"served":6,"blocked":3,"probes":[{"id":"html","status":200,"mime":"text/html"},{"id":"css","status":200,"mime":"text/css"},{"id":"escape","status":404},{"id":"escapePct","status":404},{"id":"ext","status":404}]},"boot":"ok","configKeys":15,"channels":["config:read"],"errors":[],"ok":true}
```
`probes` 与 §2.11⑧ 契约字面**逐字相等** ✓（正 2 = 200 + mime；负 3 = 404）。stderr 3 行（**负探针命中门归属**）：
```
[protocol] extension refused: app://desktop/package.json
[protocol] extension refused: app://desktop/package.json
[protocol] extension refused: app://desktop/probe.json
```
归属裁定：三负探针（`escape` / `escapePct` / `ext`）**全部命门②（扩展名白名单）** ⇒ **门①（`path.relative` 逃逸判定）运行期零覆盖**（三探针的目标名都带非白名单扩展名，先被门②拦下）⇒ 门① 现仅静态实现 + 门②兜底覆盖。披露项，见 §5.5；补一枚「白名单扩展名 + 逃逸路径」探针（如 `../styles.css`）留后续批/修正轮。

**U10 · 第二实例**（主实例持锁时再起 `--smoke`；第一实例为我的子进程，验证后自行终止——`tasklist` electron.exe 残留 0 行）：exit 0 ✓，stderr 空 ✓：
```
{"smoke":1,"lock":"secondary","window":false,"node":"22.21.1","sqlite":false,"floorMet":false,"protocol":{"served":0,"blocked":0,"probes":[]},"boot":"none","configKeys":0,"channels":[],"errors":[],"ok":true}
```
读数语义注（防误读）：本分支在 `main.mjs:51-54` **即时上报**、不探测 ⇒ `sqlite/floorMet/boot/served` 为**缺省值而非探测失败**（「未探测」义；字段闭集未含 null 面，不擅改）。
**U11**: unverified-until-host（下限不足宿主本机不可得，设计自认面；不在本批可闭集内）。

**E-4 · 文档锚面**（`node scripts/doc-check.mjs`，cwd = `thincoder/`）：exit 1；
- **实施时刻**：汇总 `候选 25236 · 悬空 8 · 行宽 18`——**悬空 4 → 8（新增 4）**：`docs/vsc/design/WEBVIEW.md:35`（`index.html:6-11`）· `:35`（`index.html:83`）· `:76`（`index.html:40`）· `:79`（`index.html:20`）（裸锚形态）。
- **成因（取证）**：本批新档 `thincoder-desktop/renderer/index.html` 使 `index.html` 在**仓根范围由唯一变两枚**；引擎 `scripts/doc-check-anchors.mjs:166-174` 的 basename 唯一性规则（域内唯一 ∨ 仓根唯一 `=== 1` 才过）⇒ 四条裸锚由「唯一命中」翻「歧义悬空」。该 vsc 档与 HEAD **逐字相同**（非任何人的编辑）⇒ 成因 = 本批新档 × 他档裸锚形态的跨批脆弱面。
- **更正链（如实留痕 · 父侧 18:56 要求保留）**：18:48 首报「新增 0 / 预期逐行相等」→ 二次取证（悬空 4→8 逐条对照 + basename 规则实读 + 该档 diff 比对）**自证推翻**首报 → 18:5x 上行 ask → **父侧裁定：按字面判红**（E-4 = 红；「修没落定不算绿」），修法 = 外档（`docs/vsc/design/WEBVIEW.md` 四处裸锚补 `thincoder-vscode/webview/` 前缀，并入在跑 vsc 修正轮，非本档写域）；引擎规则不动（跨批脆弱面另册入账）。
- **终态条件**（父侧）：修正落定后回归「零新增」= 绿，以修正轮核验为准（父侧盯）。
- **复核（18:5x，实施后重跑）**：汇总 `候选 25252 · 悬空 8 · 行宽 18`（分解：用例号 998/0 · 路径坐标 9581/7 · 符号窄 183/1 · 符号宽 14490/398）——悬空 8 逐条同上（4 条 = 本批成因 + 4 条存量：`MODEL-SPECS.md:323/1372/1465` · `SESSION.md:850`）；候选 +16 与行宽行位/内容变动 = 同窗口他批 `docs/**` 笔（本批零 `docs/**` 写），与 §3 发现 4 预判一致（锚面读数被别处动作推移）。**本批写域（`thincoder-desktop/**`）零失败行**。

**E-5 · 三包零改动**（`thincoder-core` / `thincoder-vscode` / `thincoder-cli` 逐字节对照 §5.1 基线）：`git status --porcelain --` 三包 = 27 行 / 1186 字节 / sha256(raw) `d82d6ae516ca439c`；`git diff --stat --` 三包 = 26 行 / 1609 字节 / sha256(raw) `bc7c090a863a5e27`——**两项与基线逐字节相同**（hash 方法已验证：raw stdout 复现基线值）⇒ 增量零（最强形态）。新面两条：`?? thincoder-desktop/`（本批整包新增）· `?? docs/batches/2026-09-25-desktop-impl-1.md`（本档）。

**U8 · 清单两向自检判红自证**（临时 fixture 两枚，验证后已删；`*probe*` glob 复核零命中）：未登记档 ⇒ `✖ test manifest check failed: unregistered test file …`；清单项不在盘 ⇒ `✖ test manifest check failed: listed file does not exist …`——两向皆 exit 1 且给文件名 ✓。

**修正轮 1 后复跑背书**：`ipc.mjs` locale 收正 + `window.mjs` 注释收正后，E-1（8/8 · exit 0）与 E-2/E-3/U9/U12（`ok:true` · exit 0 · probes 逐字不变）**重跑全绿**；locale 语义变化不在冒烟 JSON 面（`config` 无 `locale` 键 ⇒ 上报缺省 `"en"`）。

### 5.4 审计与代码评审轮次 · 终态（eng-coder · 2026-09-25 19:0x）

**A · 内部背离审计**（只读 explore 子代理 · 阻断式 · 两轮）

- **轮 1（实施后 · 修正轮 1 前）**：PARTIAL 1 · DOC-DRIFT 0 · SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0；另 4 条无锚新增（🔵）= 窗口尺寸 · 首帧画布色镜像 · `setWindowOpenHandler` 外链加固 · 探针归 `window.mjs` ⇒ 修正轮 1 收正其三处（`ipc.mjs` locale 直报 + `window.mjs:14` 移除不实引据 + `:17/62` 补无锚标注）。**记录缺口如实记**：轮 1 的逐条内容未落本档（只留计数）；轮 2 为终审且逐条在册。
- **轮 2（修正轮 1 + 2 之后 · 终审盘面）**：verdict = **DEVIATIONS · 0 🔴 · 0 🟡 · 5 🔵**。五类命中计数：PARTIAL 1（D5 = §5 形态面微差）· DOC-DRIFT 2（D1 状态栏位置 · D2 死指针）· SILENT-SIMPLIFICATION **0** · OUT-OF-LIST **0** · 无锚新增 2（D3 · D4），已披露 5 项不判。
- 轮 2 独立复核背书：**逐档行数与 §5.2 表逐格相等**（16 档 · 合计 906 ≤ 950）· 渲染面闭包 = `app.mjs` + `dom.mjs` 两档、零 `node:` / 零裸包 · CSP 无 `unsafe-*` / 零内联脚本 · 盘面 = 16 档 + `package-lock.json`（无清单外档）· 探针归属与 `ok` 追加项按 §2.11⑧ 逐字落地。
- 轮 2 自陈边界（如实转载）：静态对读，**未复跑** E-1 / E-2 / E-3 / E-5（其绿以 §5.3 读数 + 代码逐点自洽为准；本档终态复跑见 C）。
- **轮 2 五条 🔵 处置**：D1 → **修正轮 3 实改**（状态栏移为窗口级底行，逐条 = §5.5 项 1）· D2 → **自解**（§5.5 落地使 `:578` 死指针变为有效）· D3 / D4 / D5 → 披露在册（§5.5 项 5 / 6 / 7）。
- **幻影路径两条**（`d:\teamcode\thincoder-desktop\{package.json, src\main\host-floor.mjs}`）：我方 spawn `files` 声明按会话根解析的**声明面产物**（无该目录、盘面零落盘；实现面实际住 `thincoder/thincoder-desktop/`）⇒ 审计判「无净落盘」✓（§5.5 项 8）。

**B · 内部 advisor 代码评审**（同步 · 两轮）

- **轮 1 = pass**：0 🔴 · 3 🟡（逐条判定**非必须修**）· 6 🔵；无阻断项。
- **修正轮 2**：轮 1 findings 4 / 6 收正（**两处纯注释**）——`src/main/main.mjs:57`「不越 ready 前窗」由断言降级为「未核实」· `renderer/styles.css:3`「唯一 `@media` 行」→「唯一断点 `@media` 行」。
- **轮 2 = pass**：两处修正确认落档；**零新面**（其报告引用行号未被宿主机检解析 = 相对路径问题，内容与本档实测逐字一致）。

**C · 终态 = clean**（修正轮 3 后复跑 · 2026-09-25 19:0x）

- `npm test`（cwd = `thincoder-desktop/`，清宿主注入变量 `ELECTRON_RUN_AS_NODE`）：**8/8 pass · exit 0**；stderr 1 行 = U2 场景自带诊断（同 §5.3 `:565`）。
- `npx electron . --smoke`：**exit 0** · `ok:true` · stdout JSON 与 §5.3 `:570` **逐字不变**（served 6 / blocked 3 / probes 5 / boot ok / configKeys 15 / channels `["config:read"]`）· `tasklist` electron 残留 0。
- 未披露背离 **0** · 未裁 🔴 **0** · 未裁 🟡 **0**（3 🟡 全判非必须修，逐条在册、未改判）· 修正轮合计 **3**（≤ 5）。

### 5.5 披露项清单（超清单 / 无锚 / 已知缺口 / 更正链 · 逐条在册）

1. **状态栏位置收正（审计 D1 → 修正轮 3）**：原实现把 `data-slot="status"` 放进中列 `.session`（呈于会话列底部）；需求 `PROJECT.md` §3.1 把状态栏画在**三列框外一行**（`:42`），语义 = 跨会话告警位（`:52`）⇒ 改落 `.app` 第四子元素：`grid-template-rows: minmax(0, 1fr) auto` + `grid-column: 1 / -1`（跨三列）。**设计缺口如实记**：`UI.md` §1 状态栏行只定内容 / writer、**未定位置** ⇒ 位置面权威取需求图（本批实施选择）；视觉处理（卡片面 = `--bg-raised` + 边线，与三列同面）同样无设计锚 = 实施选择。`UI.md` 是否补位置行 = eng-designer 笔权，本档不claim。读数：`index.html` 34 行 · `styles.css` 117 行（均在预算内）。
2. **超预算 7 档（+150 行）**：逐档见 §5.2 表；其中**代码行真超 3 档**（`main.mjs` 63 > 50 · `window.mjs` 97 > 90 · `guard-closure.test.mjs` 80 > 70）；包级 906 ≤ 950 ✓；**零功能删减**（超预算未移除任何判据面 / 用例面）。
3. **无锚新增 5 项**（设计 / 任务书未定形的实施选择）：① 窗口尺寸（`window.mjs:14-15`）② 首帧画布色镜像（`:17-18`）③ `setWindowOpenHandler` 外链加固（`:62-66`）④ 探针归 `window.mjs` 冒烟段（设计未指名归属）⑤ 状态栏视觉处理（项 1 末段）。①–④ 轮 1 审计在册、轮 2 确认已披露。
4. **已知覆盖缺口 3 项**：门①（`path.relative` 逃逸判定）运行期**零覆盖**（三负探针全命门②，`:578`；补「白名单扩展名 + 逃逸路径」形态探针如 `../styles.css` 留后续批 / 修正轮）· `will-navigate` 面未拦窗口自身导航（潜在面、当前非活跃）· U11 = unverified-until-host（下限不足宿主本机不可得，设计自认面）。
5. **审计 D3（测试阈值）**：`test/guard-closure.test.mjs:62` 的 `seen.size >= 2` = 较 §2.11 收正① **更严的本档阈值**（收正① 形态 = 闭包非空 ∧ 入口档在闭包内 ∧ 逐档已读，无数字）；收正① 的增长条款（渲染面 JS ≥ 3 档的批起 ⇒ 闭包 ≥ 3）本批不激活（渲染面 = 2 档）⇒ 留后续批承接。**不产假绿**（更严不更松）。
6. **审计 D4（原生菜单 Edit 组 · 父侧核准项）**：`window.mjs:46-48` 额外挂 `undo/redo/cut/copy/paste/selectAll` 原生 role——设计枚举（`SHELL.md:48` = 窗口 / 缩放 / 退出 / 开发者工具）未含 Edit 组；与「只挂主进程动作」约束**相容**（Chromium 原生 role、零渲染面动作）。保留理由 = macOS 剪贴板快捷键依赖 app 菜单 role（结构不对称）；若父侧裁定按严格枚举，删该组 = 一行。
7. **审计 D5（§5 形态面微差）**：§2.11 收正④ 要求「实施记录 = §5 首块」，实际 §5 首块 = §5.0 取数清单（实施记录 = §5.2）；另收正③「报告面与 PASS 面不入档并注明省略规则」以「全量 718 行 / 79434 字节 + sha256」形态落（`:465`）。实质无损（时刻 18:25 Asia/Hong_Kong · 命令含 cwd · 失败行逐字 24 行三面均满足）。**§5 为 append-only**（既有行不改写、段号不复排）⇒ 如实登记、不重排。
8. **声明面幻影路径**：轮 2 审计并集内 `d:\teamcode\thincoder-desktop\{package.json, src\main\host-floor.mjs}` = 我方 spawn `files` 声明按会话根解析的产物（无该目录、零落盘）；实现面实际住 `thincoder/thincoder-desktop/`（审计行数表与本档 §5.2 逐格相符）。
9. **更正链（读数面 · 如实留痕）**：① E-4 首报「新增 0」→ 自证推翻 → 父侧 18:56 裁定**按字面判红**（`:590`；成因在外档）② 冒烟 stderr 行数：§5.3 `:572` 记 3 行（协议行），**实跑 5 行** —— 多 2 行宿主级 = `(node:N) ExperimentalWarning: SQLite is an experimental feature` + `(Use electron --trace-warnings ...)` 提示行（**非失败行**；判定口径 = stdout JSON + exit；`node:sqlite` 导入固有产物）③ §2.3 合计口径（`~810`）与逐行加总不自洽 ⇒ §5.2 按逐行之和 950 记（评审发现 7 在册）。
10. **机械产物与宿主产物**：`package-lock.json` · `node_modules/**`（`npm install` 生成物，与 `thincoder-vscode/` 同例）；U9 临时 fixture 两枚已删（`*probe*` glob 复核零命中）；冒烟 stdout 首空行 = 宿主产物（本档唯一写点 `main.mjs:32`，零 `console.log`）。
11. **E-4 红线（按字面）**：悬空 4 → 8 四条全部 = 本批新档 `renderer/index.html` × 他档裸锚（`docs/vsc/design/WEBVIEW.md`）的 basename 歧义；修法在外档 = **非本档写域** ⇒ 本批**不claim 绿**，等外档修正轮复核（父侧盯，`:591`）。**本批写域（`thincoder-desktop/**`）零失败行**。
12. **第二实例字段语义（防误读）**：`sqlite` / `floorMet` = `false` 是**未探测缺省**（非探测失败；`:584`）；`config` 无 `locale` 键 ⇒ 上报缺省 `"en"`（`:598`）；`channels: []` = 该分支即时上报（`:582`）。

### 5.6 收敛核验（advisor 代码评审轮 3 · 修正轮 3 之后）

- 范围：只核修正轮 3 的 diff（`renderer/index.html` 状态栏槽位 + `renderer/styles.css` 栅格 / 跨列 + 注释面）与「审计轮 2 · D1 已解」声明（轮 1/2 已核面按声明不重开）。
- **结论 = pass**（报告尾部 `VERDICT: pass`）；逐条核验：① 状态栏槽确已移出中列（`.session` 现仅含 session-head + flow；`index.html:30` 为 `.app` 第 4 子元素）② `styles.css:54` 双行栅格 + `:102` `grid-column: 1 / -1` ③ 轮 2 两项 🔵 收正保持有效（`main.mjs:57`「未核实」/ `styles.css:3`「唯一断点」）。
- 修正对终态的影响核查（评审独立自证）：**零消费方依赖**——渲染面 JS 不引用 `.status` / `.session` 槽位（全包 `*.mjs` 无 `data-slot` / `querySelector` / `.status` 消费点，命中 `status` 均为 HTTP / 进程字段）；冒烟读回走 `window.mjs:30` 的 `document.documentElement.dataset.boot`，不受落位变更影响；两档内无描述旧位置的残留措辞。
- 宿主引用校验产物：该报告部分 `file:line` 引用被宿主机检判「file unreadable」（相对路径解析面问题，与轮 2 同因，非实质发现）；上列结论出自其对我方实测内容的**逐字引用**，与 §5.4 A 的独立复核一致。
- **终态维持 = clean**（§5.4 C 判定不变；修正轮 3 已获独立核验通过；修正轮合计 3 ≤ 5）。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧 · 2026-09-25 19:15）

| 面 | 核验 | 结果 |
|---|---|---|
| E-1 测试面 | 子代理实跑（父侧未复跑——「交付已内审」纪律） | **8/8 pass · exit 0**（U1–U8 · U13；U2 自带 1 行诊断非失败） |
| E-2 启动 + 单实例 | 冒烟 JSON（主 / 第二实例） | 主：`lock:"primary" ∧ floorMet ∧ sqlite ∧ window ∧ served:6>0` · 第二：`lock:"secondary" ∧ window:false ∧ channels:[]` |
| E-3 通道往返 | 同次冒烟 | `boot:"ok" ∧ channels:["config:read"] ∧ configKeys:15` ✓（`channels` = 本次实际分发集） |
| E-4 文档闸 | **父侧实跑** | 悬空 **4** / 行宽 **18**；失败集 ⊆ 实施时刻快照（8）⇒ **绿（修正后）** |
| E-5 三包零回归 | 子代理（sha256 基线对照） | `git status --porcelain` / `diff --stat` 与基线**逐字节相同**（`d82d6ae5…` / `bc7c090a…`）⇒ 增量零 |
| E-6 渲染面守卫 | 随 E-1 全绿 | 闭包非空 ∧ 入口 `renderer/app.mjs` 在闭包内 ∧ 逐档已读（§2.11 收正①）+ 反证 U6 在册 |
| E-7 宿主下限 | 随 E-1 全绿 | U1 边界 · U2 分支 · U3 真探针 · U4 接线序 · U13 预载可读 |

**轮 2 三条 🔵 就地处置**：① 收正⑤ 依据行算术 → 以 §1.6 的 Deferred 记录为准（§2.11 append-only，不再回改）；② 探针归属门 = **实证已回填**（三负探针全命门②，见 #389）；③ 「覆盖值清单」= 本条 §6.1/§6.3 即权威值面 ✓。

### 6.2 核销同步清单（D7）

角色表 ✓（§1 父侧 · §2 eng-designer · §3 评审子代理 · §5 eng-coder · §6 父侧）· 状态行 ✓（§5 = 实施完成）· 计数 / 指针 ✓（§2.11 修后为准；§1.7 / §1.8 / §1.10 = 父侧裁定链）· 变更记录 ✓（§5.4–§5.6 + 本档 §1.x）· **待办 ✓：#389 / #390 入账** · 台账可见面 ✓ · 前批遗留核对 ✓（挂靠 **#353** = 桌面端程序总条目；**程序继续 ⇒ #353 保持 在途**，本批 = 其第 1 段）。

### 6.3 验收

**§1.2 五判据 + E-1–E-7 = 判据 7/7 绿**（E-4 为修正后绿）。本批不含面（视图 / 打包）照 §2.2 随后续批 ✓；超预算 3 档 + 无锚新增 5 项（§5.5）**已裁认**（§1.9）；D4 = 保留 + 设计面登记（随设计同步轮）。

### 6.4 后续

桌面端实施程序继续：**批 2 = 数据面**（会话 / 项目 / 状态树 / i18n）——其 §2 于**设计同步轮**（R-5 / R-2 / U1 / U3 / D4 / 状态栏位置行）落地后另立档派发。
