# 2026-09-26 · 桌面端 E2E 基建（Playwright）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-26 · 来源 = 用户 2026-09-26 22:36 提问（「desktop 的测试能不能用某种 AI 可见的方式进行？」）+ **22:39 裁定（「我认为 Playwright 有必要」）**——台账 **#433**（#431 并入 · #432 已废弃）。。
> 台账 = #433（桌面端 E2E 基建 · 归批）。前情 = docs/batches/2026-09-26-desktop-impl-9.md §6（已收口 2026-09-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 **22:36** 提问（「desktop 的测试能不能用某种 **AI 可见** 的方式进行？是不是可以先脱离 electron 框架，当成个 web 之类的应用跑？这样你可以用有头或者无头浏览器测试？」）✓ + **22:39 裁定（「我认为 Playwright 有必要。」）** ✓。父侧三层评估 = **#431**（零依赖截图 ✓）· **#432**（web 快筛 ✓ —— **已废弃 · 并入本条** ✓）· **#433**（本条 ✓）。

### 1.2 交付目标

① **Playwright 直驱 Electron** ✓（真应用 ✓ ⇒ 截图 · DOM/CSS 断言 · 真事件 · 可选录像 ⇒ **AI 可见** ✓）；② **渲染面 web 快筛** ✓（宿主注入缝已备 ✓——`thincoder-desktop/test/views-harness.mjs` 假面先例 ✓）；③ **截图走查协议** ✓（**收口看一张截图** ✓——承接 #431 ✓）。
**权威面裁定** ✓：**Electron 为权威** ✗——web 快筛与 Electron 结论不一致时**以 Electron 为准**并**报红** ✓。

### 1.3 判据（机器可核 ✓）

① 本机跑通：**启动真 Electron 应用 ⇒ 主界面可见 ⇒ 落一张固定路径 PNG** ✓；② **至少一条端到端用例** ✓——建议 = **开设置面 ⇒ 四段可见 ⇒ 关闭**（**不依赖批 A 的输入面** ⇒ 本批可**先于 / 并行于批 A** 落地 ✓）；③ PNG 落点固定（父侧 `read_image` 可读 ✓）；④ 若落 web 快筛：与 Electron 结论一致（不一致 ⇒ 报红 ✓）；⑤ **三端既有测试零回归** ✓；⑥ **依赖纪律** ✓：Playwright = **devDep**（守仓「零第三方**运行期**依赖」✓——`electron` 即 devDep 先例 ✓）。

### 1.4 边界 / 风险

**不做** ✗：不改产品代码（**为可测性所需的最小缝除外 ⇒ 须上抛** ✓）· 不做 CI 平台改造（本机跑通为要 ✓·CI 另议 ✓）。**风险** ✗：浏览器引擎下载（`npx playwright install` ✓）须走 proxy（**#394** 同族教训 ✓）；**web vs Electron 漂移** ⇒ 已定裁 ✓（权威面 = Electron ✓）。

### 1.5 排期

**批 A → 批 C（本批）→ 批 B** ✓——A 使应用"能用" ✓，C 使此后每一批都带**真浏览器验证** ✓，B 与后续皆受益 ✓。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-27 实施后对账轮 §2.11 落位（三档按实证收正 · 机检三档 0 闸红 · 全仓入闸 = 悬空 34 + 行宽 19））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目（= 批档 §1 判据） | 设计落点 |
|---|---|---|
| 1 | ① 真 Electron 跑通 ⇒ 主界面可见 ⇒ 固定路径 PNG；⑥ Playwright = devDep | 设计档 §1 · §3.1 · §3.3 |
| 2 | ② 至少一条端到端用例（开设置面 ⇒ 四段可见 ⇒ 关闭） | 设计档 §3.3 九步 · §6 T-DSK25 |
| 3 | ③ PNG 落点固定（父侧 `read_image` 可读） | 设计档 §3.3 第 7 步（单一常量） |
| 4 | ⑤ 三端既有测试零回归 | 设计档 §4「零改动面」· §7-5 · §7-6 |

### 2.2 明确不在本批（登记 · 不缩水）

- 判据④ **web 快筛与 Electron 一致性** ⇒ 本批不做（权威面裁定 = Electron；§1.2② 的快筛面另议）——设计档 §7-1 · §8-1。
- 边界 / 错误用例三条（`T-DSK25b/c/d`）⇒ 本批只落正常路径一条 —— 设计档 §6 · §8-3。
- **CI 接线**（含 Linux 无显示面 xvfb 与三平台矩阵）· 视觉 / 像素回归 · `node --test` 并行度调参 —— 设计档 §7-2 · §7-4 · §7-8。
- `docs/desktop/design/PROJECT.md` 七处小改（新档入册 / §4.1 dep 行 / 计数 / 用例表 T-DSK25 行 / §8 不做行 / §10 上抛 / 变更记录）⇒ **待放行**（与批 A 设计期写面同档在飞，次序 = 批 A 先）——设计档 §8-7。

### 2.3 设计档落点

- 单源新建：`docs/desktop/design/E2E-TESTING.md`（8 项 + 变更记录，147 → 157 行）。
- 上位单源：`docs/core/design/TESTING.md`（测试纪律 / 承载选型 / 单入口门禁 —— 本档**引用不重述**，D2）。

### 2.4 机制设计（一行一要点 · 全表见设计档 §1 / §2 / §3）

- 驱动 = `playwright-core` **devDependency**（Electron 驱动在该包内 `types/types.d.ts` 导出 `_electron`；registry 元数据 `scripts: null` 无 postinstall **不下载浏览器** ⇒ 安装不触代理面）。
- 骨架 / 入口 = 内建 `node:test` + `node:assert/strict`，E2E **并入单入口** `thincoder-desktop/test/run.mjs`（`npm test` 一条脚本），**不新增 script**（第二 runner / 第二入口 = 漂移源）。
- 落点 = `thincoder-desktop/test/integration/settings-panel.test.mjs`（常驻类）+ 登记 `thincoder-desktop/test/files.mjs`（+1 行；run.mjs 的 walk 递归与反向自检天然覆盖 ⇒ runner 零改动）。
- 隔离 = `launch` 的 `env` 显式传：删 `ELECTRON_RUN_AS_NODE`（继承则该二进制退化为 node ⇒ 假红，本仓已实证）+ HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 重定向至**每用例一枚** `mkdtemp` 家庭；fixture = 仅 `<临时家>/.thincoder/config.json` = `{"locale":"en"}`（零网络 · 消单实例锁撞车）。
- 断言序（DOM 契约面，非文案）= 等 `dataset.boot ∈ {ok, error}` ⇒ 断言 `=== "ok"` ⇒ 点 `info-entry` ⇒ 根 `[data-settings][data-state="open"]` ⇒ 段序 `providers,model,agent,mcp` ⇒ 态 `ready,ready,none,ready`（`model=none` 兼作隔离生效证据）⇒ 截图 ⇒ 关后 `closed` 且子节点 0。
- PNG = `thincoder-desktop/test/artifacts/settings-panel.png`（新增 · 运行期产物 · 不进 git ⇒ 新增 `thincoder-desktop/.gitignore` 忽略该目录）；判定 = 文件存在 + PNG magic（前 4 字节 `89 50 4E 47`），**不做像素断言**（跨平台渲染差异 = 假红源）。

### 2.5 受影响文件与测试面（全清单 + 行数见设计档 §4）

- 新增：`thincoder-desktop/test/integration/settings-panel.test.mjs`（0 → ~120 行）· `thincoder-desktop/.gitignore`（0 → ~5 行）· 运行期 PNG（不进 git）。
- 改：`thincoder-desktop/package.json`（20 → +1 行，devDeps 加 `playwright-core`）· `thincoder-desktop/test/files.mjs`（12 → +1 行登记）。
- 待放行：`docs/desktop/design/PROJECT.md`（387 行 · 七处小改）。
- **零改动面**：`thincoder-desktop/test/run.mjs` · `thincoder-desktop/src/**` · `thincoder-desktop/renderer/**` · 三端（cli / core / vscode）测试面 · 各包 `package.json` 脚本。跨文件上限：本批无触 300 / 500 行的档，**无拆分计划需求**。

### 2.6 验收对照（三链同源）

- 条目 ↔ 判据①–⑥ ↔ 设计档 §5 回指表：**一一对应**，六行齐（含判据④「本批不做」行）。
- 机检形：`cd thincoder-desktop && npm test` exit 0；PNG 存在 + magic；`dependencies` 无 `playwright-core` / `devDependencies` 有；三包各自 `npm test` exit 0（父侧核销读数）。
- **回指链缺口（登记）**：判据目前只住本批档 §1 —— 桌面端需求档尚无 E2E 功能点与判据点 ⇒ 三链同源**暂缺需求档一环**（设计档 §8-2 已上抛，待主 agent 落档）。

### 2.7 关键决策（全表 = 设计档 §2 KD-1…KD-10）

驱动选 `playwright-core` 而非 `@playwright/test`（自带 runner）· E2E 并入单入口不新增 script · 隔离走家目录重定向（**不动产品码**，不用 `--user-data-dir` 旗标）· **不传 `executablePath`**（走缺省解析；逃生口 = `createRequire(import.meta.url)("electron")`）· 走常态启动面（非 `--smoke`）· 断言面 = DOM 契约非文案 · 不做像素断言 · 每用例独立 fixture 家与独立实例。

### 2.8 上抛项（12 条 = 设计档 §8）

需求档缺 E2E 功能点（三链暂缺一环）· `PROJECT.md` 七处小改待放行（同档在飞）· `docs/README.md` 地图随动（父侧）· `docs/core/design/TESTING.md` 多实现面枚举未含 desktop 面 · 同档 §10「不引新框架 / 依赖」与本批 devDep 的判读待复核 · 计数面不一致（`files.mjs` 实读 25 项 vs `PROJECT.md` §4.1 记「二十六档」）· `thincoder-desktop/test/run.mjs:4` 注释将失实（产品码 ⇒ 实施批随动改）· Electron 二进制缺盘自下载（CI 接入前须预装）· 实施期实证点（unverified）· 「（拟新增）」标记清除归属。
**机检面现状（只报）**：`node scripts/doc-check.mjs`（2026-09-26 实跑）全仓 **FAIL**（40 条悬空 + 21 行行宽 >300 字符），**均属他档既有**；本档 `E2E-TESTING.md` = **0 悬空 · 0 行宽红**（报告面宽符号行如 `_electron` / `executablePath` 为列报态，不入闸）。父侧若以该门禁作交付读数，须注意存量红与本批无关。

### 2.9 放行落笔轮（2026-09-26 · 三档落定 · 收尾）

**性质** = 纯落笔（零新语义 · 零新判据）：落定面 = §2.2 / §2.8 在册待放行项 + §2.6 回指链缺口；父侧放行后一并落定。

**落定一 · `docs/desktop/design/PROJECT.md`**（13 处 · 410 ⇒ **420** 内容行（文末换行不计））：
- 档头 `五档 ⇒ 六档`（「另两档 ⇒ 另三档」列本档 · §1.1 同收）· 需求侧行 `D1–D12 ⇒ D1–D14`。
- §4.1 值收正两处：`thincoder-desktop/package.json` `~45 ⇒ 20 ⇒ 21`（`playwright-core` devDep——`dependencies` 零第三方不变）· `thincoder-desktop/test/files.mjs` `14 ⇒ 15`。
- §4.1 增两行：`thincoder-desktop/.gitignore`〔新增〕· `thincoder-desktop/test/integration/settings-panel.test.mjs`〔拟新增 · 集成域〕。
- §7 增 **T-DSK27**（E2E 设置面）· §8 增本批不做行 · §10 增 **R** 行 · 变更记录 +3 行（含 §4.1 批 A 注长行折行——行宽收正）。

**落定二 · `docs/core/design/TESTING.md`**（3 处 · 413 ⇒ **416** 内容行）：
- 首部多实现面枚举补桌面面两行（单入口 + 集成域 `thincoder-desktop/test/integration/`）· §10 边界口径收正（运行期零第三方依赖（守）∥ 测试面 `devDependencies` 放开）· 变更记录 +2 行。

**落定三 · `docs/desktop/design/E2E-TESTING.md`**（15 处 · 156 ⇒ **161** 内容行）：
- KD-7 行宽折行（契约锚清单落表下注——零新增）· §4 两表行标「已落」（`PROJECT.md` 410 +10 / `TESTING.md` 413 +3）。
- 用例号收正 `T-DSK25 ⇒ T-DSK27`（T-DSK25 / 26 批 A 已占；27b / 27c / 27d 不做）· §8-2 / 4 / 5 / 7 / 9 转「已解」· 变更记录 +2 行。

**三链同源（已闭）**：需求档 `docs/desktop/requirements/PROJECT.md` §4 **D14 可测性（E2E）**已落 ⇒ §2.6 登记的「三链暂缺需求档一环」**消解**——需求档 ↔ 批档 §1 判据 ↔ 设计档 §5 回指表，同源闭合。

**机检读数（2026-09-26 · `node scripts/doc-check.mjs` · 终跑 = 落笔后一次；退出码 1 = 他档存量）**：
- 三档**按档零闸红**：`E2E-TESTING.md` 0 悬空 · 0 行宽；`TESTING.md` 0 悬空（迁移期引文列报 3 条）· 0 行宽；`PROJECT.md` 0 悬空（「拟新增」列报 15 条）· 非表行 0 超（表行结构性豁免——`isTableRow`）。
- 随改一件：`PROJECT.md` 批 A 新档枚举 `mount-composer.mjs` 存量悬空 ⇒ 同式补「（拟新增）」⇒ 转列报（**consistency surface** · 零语义 · 归属批 A）。
- 全仓闸态（终跑）：悬空 **40** · 行宽 **19** —— 余数皆他档迁移期存量 / 报告面（**界外未动**）。

**只报不动（转父侧 · 逐条）**：
① `thincoder-desktop/test/run.mjs:4` 注释将失实 ⇒ 实施批随改（在册 = 设计档 §8-10）；
② `docs/README.md` 地图随动 = 父侧（在册 = 设计档 §8-8）；
③ `docs/desktop/design/SHELL.md` §1 树（:47）未含 `thincoder-desktop/test/integration/` 与 `.gitignore` 新项（本批界外 · 未动）；
④ `docs/desktop/design/PROJECT.md` §4.1 / §4.2 存量残差（值列 / `PROJECT-MANIFEST.json` 行——各归其批 · 未动）；
⑤ `thincoder-desktop/package.json` 值链 `~45 ⇒ 20 ⇒ 21` 的收正事由（内容行数口径）在册（设计档 §8-9）；
⑥ `docs/desktop/design/E2E-TESTING.md` §4 自档行「现行数 = 0」语义模棱——父侧裁后随改（未动）；
⑦ 设计档表行 >300 = 结构性豁免（`isTableRow`）· 非表行零超——机检口径说明。

### 2.10 修正轮（2026-09-27 · §3 评审 #1–#10 落位）

**性质** = 点修（零新语义 · 零新判据）：逐条按 §3 评审 `Suggestion` 落位；父侧裁定 #1–#10 全接受、**#11 缓落**（不在本面）。
唯一改动档 = `docs/desktop/design/E2E-TESTING.md`（161 ⇒ 172 内容行 · 文末换行不计）。

| 评审号 | 落位（改动后 file:line） |
|---|---|
| #1 | KD-4 重写（`docs/desktop/design/E2E-TESTING.md:40`：否决项只指产品码改动；退路 = 测试侧 `--user-data-dir` 启动参数）· §3.2 增 userData 落位行（`:76` · 实施首步实证 ∈ 临时家 · 两况）+ 退路段（`:79` · 退路不成立 ⇒ 停手上抛 §8-6）· §8-11 首步呼应（`:162`） |
| #2 | 第 5 / 6 步锚限作用域 `[data-settings] [data-section]`（`:87` / `:88`）· KD-7 注同步（`:48-50` · 附 rail 同名证据 `thincoder-desktop/renderer/views/sessions.mjs:135`） |
| #3 | 契约锚引线 263-265 ⇒ 269 两处同改：KD-7 注（`:48`）· 第 4 步（`:86`） |
| #4 | 裁 (a)：`thincoder-desktop/test/run.mjs` 入 §4 表（`docs/desktop/design/E2E-TESTING.md:103` · 41 行 · ±1 行注释改写 · 逻辑零改）· §8-10 改「本批随改」（`:161`）· §4 零改动面删 run.mjs（`:112`）· §7-5 补测试面分层句（`:144`） |
| #5 | KD-3（`:39`）与 §1③（`:18-19`）改引 `docs/core/design/TESTING.md` §4.1 / §4.3；「默认退役」表述退场 |
| #6 | 第 7 步补 `mkdirSync(dirname(PNG), { recursive: true })` 目录预建（`:89` · PNG = 用例档内单一绝对常量） |
| #7 | §4 补 `thincoder-desktop/package-lock.json` 行（`:106` · 3950 内容行） |
| #8 | §1①（`:12-14`）四条落 as-of 2026-09-27 实证读数（发行包 tarball + registry 直读）· §4 package.json 行 registry as-of 注（`:105`）· KD-1 加失败退路（`:37` · 停手上抛、备选另裁） |
| #9 | §4 `docs/desktop/design/PROJECT.md` 行改 as-of 口径（`:109` · 410 as-of 落笔轮；盘上现值 431 内容行） |
| #10 | KD-7 补 `docs/core/design/TESTING.md` §4.5 对齐句（`:43` · 契约锚 = 产品登记的机读面） |

**随改（同轮 · consistency surface · 零语义）**：
- 第 5 步 `SECTIONS` 引线校正 :21-22 ⇒ :22-27（`:87` · 同一被改行内 · 新实读）。
- KD-7 注行宽折行（`:48-50` · 非表行超 300 ⇒ 折三行）。
- 变更记录行裸基名坐标收正（`:171` · `settings.mjs:269` ⇒ 全路径形）。

**读回与机检（2026-09-27 实跑）**：全档复读 172 内容行 · 无修订句式残留 · 非表行零超 300；`node scripts/doc-check.mjs` ——本档 **0 闸红**（报告面宽符号行为列报态 · 不入闸）；全仓悬空 35 ⇒ **34** · 行宽 19（皆他档存量 · 界外未动；退出码 1 = 他档存量）。

**只报不动**：`docs/desktop/design/PROJECT.md`（批 A 评审冻结）侧随同待解冻后由父侧收；#11（`docs/desktop/requirements/PROJECT.md` §3.5 重号）按父侧裁定缓落。

### 2.11 实施后对账轮（2026-09-27 · 设计档按实证收正 · 本档 §2 更正）

**性质** = 点修（输入 = 批档 §5.5 收正清单 + §5.8 值回填）：**零新语义 · 零新判据 · 零改码**；更正面 = §2.4 / §2.5 / §2.8 在册表述——记录面不改写，本块 = 更正映射（以设计档现行陈述为准）。

三档落点（`docs/desktop/design/`）：`E2E-TESTING.md` · `PROJECT.md` · `SHELL.md`；明细逐行见下节。足迹 = 设计档三档（`thincoder-desktop/**` 零改码）。

**同轮落点（逐行）**：
- `E2E-TESTING.md`：`:18` 去「（拟新增）」· `:75` userData 行按现行生效面重写 · `:79`「退路」⇒「生效路径（userData 面）」· `:101` 去「（拟新增）」+ 值 **137** · `:131` 态序收正 · `:162` 去 `unverified` · `:163` 实证并列（integration 档被 walk 收纳 ✓）· `:164` 第 12 项转「已落」 · `:165` 新增第 13 项（改善项）· `:175` 变更记录。
- `PROJECT.md`：`:142` 去「（拟新增）」+ `~120 ⇒ 137` · `:278` 态序收正 + 机检面「（已落）」· `:436` 变更记录。
- `SHELL.md`：`:14` devDeps 补 `playwright-core` · `:16` 增 `.gitignore` 行（忽略 `thincoder-desktop/test/artifacts/`——单源 = E2E KD-10）· `:55` `test/` 行补集成域 · `:146-147` 变更记录。

**§2 更正映射（§2 原记 → 更正）**：

| §2 原记（行为） | 更正（以设计档为准） |
|---|---|
| §2.4:60 隔离 = env 显式传 `ELECTRON_RUN_AS_NODE` 删除 + HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME 重定向 | 家目录面（HOME / USERPROFILE）实证被 `os.homedir()` 采纳 ✓；**userData 面 env 改向不达**（Chromium 不采信 `APPDATA`）⇒ 生效路径 = 测试侧 `launch.args` 传 `--user-data-dir`（落 `<临时家>/userData` · 两况俱过）；**不用**产品 `setPath`；删 `ELECTRON_RUN_AS_NODE` 照旧（`E2E-TESTING.md:75` / `:79`） |
| §2.4:61 态序 `ready,ready,none,ready` | 收正 = `ready,none,ready,ready`（位序 `providers,model,agent,mcp`；`model=none` 兼作隔离证据）（`E2E-TESTING.md:131` · `PROJECT.md:278`） |
| §2.5:66 用例档（0 → ~120 行）· `.gitignore`（0 → ~5 行） | 实读 = **137** 内容行（122 非空 · §5.8「以本行为准」复核）· `.gitignore` = **2 行**（`E2E-TESTING.md:101` · `PROJECT.md:142`） |
| §2.5:67 `test/files.mjs`（12 → +1 行登记） | 实读 = **13 行 / 26 登记项**（+1 行 +1 项）；批 A 两行落齐后投影 = 15 / 28（值差归批 A 未落） |
| §2.5:68 待放行：`PROJECT.md`（387 行 · 七处小改） | **已落**（放行落笔轮 §2.9 + 本轮落点见上节）；行数不列（387 / 410 / 420 诸值未证）——以该档 §4 表 as-of 口径为单源 |
| §2.8:83 计数面不一致（`files.mjs` 实读 25 项 vs §4.1「二十六档」） | 已解（口径 = 登记行数 vs 单元模块枚举）；实读 = 13 行 / 26 项（前 12/25 + 本批 1） |
| §2.8:83 实施期实证点（unverified） | 已收实证 ⇒ 去标记（`E2E-TESTING.md:162-163` · §8-11）：家目录采纳 ✓ · userData env 不达 ⇒ `--user-data-dir` · integration 档被 walk 收纳 ✓ · Electron 缺盘自下载 |
| §2.8:83 「（拟新增）」标记清除归属 | 已清（`E2E-TESTING.md:18` / `:101` · `PROJECT.md:142` / `:278`；§8-12 转已落 · 先例 = `RENDERER.md` §1） |
| §2.8:84 机检面现状（悬空 40 · 行宽 21） | 现读数（2026-09-27 终跑）= 悬空 **34** · 行宽 **19**（修正轮后基线）；三档 0 闸红——本轮新引入 2 行宽红已同轮折行清除 |

**137 落点（同源）**：`E2E-TESTING.md:101`（§4 表）· `PROJECT.md:142`（§4.1）· 本块。

**裁定登记（2026-09-27）**：
- userData 生效面 = 测试侧 `--user-data-dir`（**不用**产品 `setPath`——不触产品码）；「env 改向不达该面（Chromium 不采信 `APPDATA`）」= 实测结论。
- 核侧家目录隔离经 `USERPROFILE` / `HOME` 覆写（系统原语）⇒ 可选改参数 seam = **改善项**（非禁令 · 参数通道偏好）；替换面（核侧配置路径 seam ∥ 产品补参）**另批裁**；本轮零改码（`E2E-TESTING.md:165` §8-13）。

**只报不动（界外 · 逐条）**：
① §5.5:226-230 收正清单 = 本轮输入（已按实证落位）；其中 §5.5 #5「用例 127 行」= 自修轮前读数，以 §5.8 为准（记录面不改写）。
② `E2E-TESTING.md:14` / `:76`「实施首步实证」措辞观察（实施已毕 · 措辞未随；未动——超本轮授权面）。
③ `thincoder-desktop/test/run.mjs:11` 标识 `unitFiles` 改名 + `:85` `startsWith` 判据强化 = 已裁缓落（留痕在册：批档 §5.6 / §5.7）。
④ 值差观察：`test/files.mjs` 落齐投影 15 / 28 vs `PROJECT.md` §4.1 现值 13 / 26（归批 A 两行未落 · 未动）。

**读回与机检（2026-09-27 实跑）**：三档零入闸红（`docs/desktop/design/` 面仅既有「拟新增」列报态 · 不入闸）；`node scripts/doc-check.mjs` —— 入闸红 = 悬空 **34** + 行宽 **19**（皆他档存量 · 界外未动 · 退出码 1）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（批 C 桌面端 E2E 基建 · `docs/desktop/design/E2E-TESTING.md` + 受影响文件面 + T-DSK27）——发现表（坐标 = 仓根相对，前缀 `thincoder/`）：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility | 🟡 | userData 隔离手段 = 环境变量改向（`E2E-TESTING.md:71` §3.2「userData 由 APPDATA / XDG_CONFIG_HOME 改向；不用产品 `setPath`」），但其生效性被本档自记为实施期未证实项（`:153` §8-11），且失败无退路；KD-4（`:38`）否决 `--user-data-dir` 的理由「加它即动产品码」对「测试侧启动参数」不成立。失效后果 = 单实例锁落真 userData（`thincoder-desktop/src/main/main.mjs:55-58` 非主实例不开窗、静默退出）⇒ `firstWindow()` 挂起 / 超时（本机已有实例或将来多档并发时随机假红） | 在设计与实施首步实证 userData 落点（含并发/已有实例两况），并预置退路（启动参数改向 userData ∥ 停手上抛）——重写 KD-4 的理由句使其只针对「产品码改动」 |
| 2 | Clarity | 🟡 | `[data-section]` 非设置面专有：`thincoder-desktop/renderer/views/sessions.mjs:135` 的左列区块同名 `data-section`（取值 `project` / `recent` / `sessions`，`:73` `:87` `:92`）⇒ §3.3 第 5 步（`E2E-TESTING.md:80`）「读 `[data-section]` 的列表 === ["providers","model","agent","mcp"]」在无作用域限定时不成立（同一 `data-state` 名亦在 rail 面上出现，`sessions.mjs:47`） | 把第 5 / 6 步的查询锚限定在面板根作用域（如 `[data-settings] [data-section]`），并在 KD-7 注（`:46`）同步锚形 |
| 3 | Clarity | 🟡 | 契约锚引线失准：`[data-settings][data-state]` 引 `thincoder-desktop/renderer/views/settings.mjs:263-265`（`:46` KD-7 注 · `:79` §3.3 第 4 步），实读该属性对在 `:269`（263-265 = `settingsTree` 头三行） | 引用改 `settings.mjs:269`（两处同改） |
| 4 | Clarity（内部一致） | 🟡 | §4「零改动面」列 `thincoder-desktop/test/run.mjs`（`:103`），与 §8-10（`:152`）直撞——后者承认该档 `:4` 注释（实读原文「本批无集成域（不建 `test/integration/`）」）本批后失实、须随实施批改；同项措辞亦与 §7-5「不改产品码 = `src/**` / `renderer/**`」分层不一致 | 二择一收口：把 `run.mjs`（现行 41 行 · Δ 0~1 行注释）入 §4 表，或撤 §8-10 的「实施批随动改」口径 |
| 5 | Doc-state（跨档滞后） | 🟡 | KD-3（`:37`）与 §1③（`:17`）以 `docs/core/design/TESTING.md` §3.1①「`test/` 顶层默认退役」为「不落顶层」的判据，而该档首部（`TESTING.md:4`）已声明「§3 测试生命周期 = v1 历史（v2 由 §10 F4 替代）」，§10 F4（`TESTING.md:269`）即「砍测试退役台账——不做批次收口的退役三选一」⇒ 引用的是已废机制；同档 §4.1 / §4.2 / §4.3 才是本决策的活权威 | 判据句改引 §4.1 / §4.2 / §4.3（活面），「默认退役」表述从 KD-3 与 §1③ 退场 |
| 6 | Clarity / 验收可执行 | 🟡 | 落点目录的创建未指明：`thincoder-desktop/test/artifacts/` 被 KD-10 的 `.gitignore` 排除 ⇒ 新检出下不存在，而 §3.3 第 7 步（`:82`）与判据①/③（`:109` `:111`）全押在该 PNG 落盘；本档未写「谁建目录」 | 第 7 步补一句目录预建形（用例内 `mkdir recursive` ∥ 实证截图调用的自建行为），使判据①不依赖隐含行为 |
| 7 | Affected files | 🔵 | `thincoder-desktop/package-lock.json`（盘上 140 419 B）未入 §4 表，而 devDep 入册必改该档 | §4 补一行（锁文件 · 增量 ≈ npm 解析结果） |
| 8 | Evidence | 🔵 | `playwright-core` 现未安装（`thincoder-desktop/node_modules` 无该包）⇒ `:12`（`types/types.d.ts` 导出 `_electron` · registry `scripts: null` · 自身零依赖）与 `:97`（registry 现版 `1.63.0`）四条无从仓内核实，却在档内以事实句呈现；若 `_electron` 导出面或 `scripts: null` 不成立，KD-1（`:35`）无备选（否决项已把 `@playwright/test` / CDP 自研全否） | 四条标注为「待安装后实证」或补一条 KD-1 的备选/失败退路 |
| 9 | Doc-state（读数） | 🔵 | §4 表 `docs/desktop/design/PROJECT.md` 行「现行数 410 / +10 行」（`:100`）与盘上实读不符（实读 ≈432 行 · 末两行为空——`批 A 修正轮` 行落于本行之后）；`docs/core/design/TESTING.md` 行（413 + 3 ⇒ 416）与实读（416 行内容）一致。两档皆 `.md` ⇒ 本判据豁免，仅记读数滞后 | 表值随父侧机械刷新，或行内改「as-of」口径 |
| 10 | Methodology | 🔵 | 断言面全为 DOM 契约锚与态值（§3.3 第 3–6 / 8 步，含「子节点数 0」），本档未就 `TESTING.md` §4.5（集成集只断言业务可观察结果、不锁私有结构形状）给出对齐句；KD-7（`:41`）只给了「文案随 locale 变」一侧理由 | 在 KD-7 补一句口径（契约锚 = 产品已登记的机读面 ⇒ 属可观察面），或补一条产物可见性判据（PNG 尺寸/非空） |
| 11 | Doc hygiene | 🔵 | 评审射程内文档 `docs/desktop/requirements/PROJECT.md` 有两个 `### 3.5`（`:70` 待设计形 / `:76` 会话面板补齐）；与本批 D14 无因果，属既有重号 | 节号二择一改号（后续触碰批一带收） |

计数：🔴 0 · 🟡 6 · 🔵 5（共 11）。射程外备注：`docs/batches/2026-09-26-desktop-e2e-infra.md` §1 / §2 / §5.4 不在本评审射程（档存在，内容未核）；文档地图缺（Document ownership 判据降级）；未声明项目标准档（方法论按 AGENTS.md + 射程内 `docs/core/design/TESTING.md` 判）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（主 agent 代记 ✓）

- **时点** ✓：用户 **2026-09-27 01:19** 一句「**批**」——**双批同批**（批 A + 批 C ✓）。
- **依据（三条件齐备 ✓）**：① **评审通过**（首轮 · 🔴 0 · 🟡6 / 🔵5 ✓）；② **修正轮落定并逐条核验**（#37 落 #1–#10 ✓·父侧抽核 `:86` / `:87` / `:88` / `:89` 四处 ✓）；③ **token 已签发** ✓。
- **发现处置收敛** ✓（§3 轮次 1 的 11 条）：#1–#10 **Fixed**（#37 ✓）· #11 **Deferred** ✓（**已披露**：需求档 §3.5 重号 ⇒ 父侧笔 · 归清账台账 #435 ✓）。
- **实施分工** ✓：一舱（E2E 基建 ✓·单入口并入 · 不引第二 runner ✓）。
- **派单期提示（父侧 ✓）**：devDep 安装（`playwright-core` ✓）**若受网络 / 代理阻 ⇒ 停手上抛** ✗（不绕过、不换包 ✓）；`thincoder-desktop/test/files.mjs` 与批 A 共用 ⇒ **调度器串行** ✓。

## §5 实施记录（eng-coder）
**状态行**：实施完成（四件交付落盘（devDep / 单入口并入 / T-DSK27 / 隔离 + gitignore）· 审计轮 1 + advisor 三巡收敛（终态 clean）· npm test 119/119）



### 5.1 交付摘要（四件 · 落形 + 读数）

| # | 交付物 | 落形 | 机检读数 |
|---|--------|------|----------|
| ① | `playwright-core` 入 devDep | `thincoder-desktop/package.json:19` = `^1.63.0`；实装副本版本 = 1.63.0 | `dependencies` 仍只 `@thincoder/core:^0.9.5` ⇒ 零第三方 runtime 不变 ✓（判据⑥） |
| ② | E2E 并入单入口 | `test/files.mjs` 登记 1 行 ⇒ `test/run.mjs` 派发覆盖；`package.json` `scripts` 三条零增（无第二 script / 第二 runner） | `npm test` 单命令含 E2E ✓（判据②） |
| ③ | 新用例 T-DSK27 | `thincoder-desktop/test/integration/settings-panel.test.mjs`（127 行） | 真 Electron 起 ⇒ 主界面 ⇒ 开设置面四段收敛 ⇒ PNG ⇒ 关闭清容器 ✓ |
| ④ | 家目录重定向隔离 + `.gitignore` | 用例内 env 四变量（`HOME`/`USERPROFILE`/`APPDATA`/`XDG_CONFIG_HOME`）+ `launch.args` `--user-data-dir`；`.gitignore` 2 行 | `git check-ignore -v` 实检命中 `.gitignore:2` ✓ |

### 5.2 判据对账（设计 §5 ①~⑥）

| 判据 | 设计落点 | 本轮机检形 + 读数 | 态 |
|------|----------|--------------------|-----|
| ① 真 Electron 跑通 ⇒ 主界面 ⇒ 固定路径 PNG | §3.1 / §3.3 | `cd thincoder-desktop && npm test` exit 0；stdout `[e2e] T-DSK27 ok —— PNG = …\test\artifacts\settings-panel.png · userData = …\Temp\tc-desktop-e2e-PGFZ2W\\userData · boot = ok`；`tests 119 / pass 119 / fail 0` | ✅ |
| ② 端到端用例（开 ⇒ 四段 ⇒ 关） | §6 T-DSK27 行 | T-DSK27 单用例 3460.9ms 绿（三步在同一用例内串起） | ✅ |
| ③ PNG 落点固定 | §3.3 第 7 步 | `SHOT` 常量单点（档内唯一 PNG 路径字面量）+ `mkdirSync` 预建目录 ⇒ 不押「截图调用自建目录」的隐含行为 | ✅ |
| ④ web 快筛不引 | §7-1 · §8-1 | 未引入（按设计不做，登记不缩水） | ➖ |
| ⑤ 三端零回归 | §4 零改动面 | 本轮复取：core 700/700 · cli 865/865 · vscode 1010/1010，`fail 0`（时长 23.2s / 34.7s / 46.0s） | ✅ |
| ⑥ Playwright = devDep | §4 `package.json` 行 | `:19` 在 `devDependencies`；`dependencies` 未变 | ✅ |

### 5.3 隔离定形与运行期实证（设计 §3.2）

- **两面分开改向**（同档 §3.2 载明，非擅改）：① 配置面 —— `HOME` / `USERPROFILE` / `APPDATA` / `XDG_CONFIG_HOME` 四者同指 fixture 家（配置读点核 `thincoder-core/config-io.mjs:32`）；② userData 面 —— 走 §3.2:79 所载**退路** `launch.args` 传 `--user-data-dir=<家>/userData`。
- **「env 改不动 userData 面」的实施期实证**（探针期读数，临时件已清）：只给四 env 时 `app.getPath("userData")` 仍指系统真值（Chromium 不采信 `APPDATA` env）⇒ 撞开发机在跑实例的单实例锁、且真家被写；加退路开关后落 `<家>/userData`。
- **运行期证据**：`[e2e]` 行实读 `userData = C:\Users\liwei\AppData\Local\Temp\tc-desktop-e2e-PGFZ2W\\userData`（fixture 家内）✓；收尾 hook 先 `app.close()` 再递归清家 ⇒ `%TEMP%` 零残留。
- **配置面重定向的独立侧证**：fixture 家内只预置 `{"locale":"en"}`，PNG 内为英文界面 ⇒ 产品读的是 fixture 家，非开发机真家。
- **驱动侧 `env.ELECTRON_RUN_AS_NODE` 自删**：本机 CLI 会话会把该变量带进 `process.env`，Electron 遇它退化为纯 node ⇒ 起不了窗口；用例启动前显式删。

### 5.4 审计与代码评审轮次与终态

- **轮次 1（内部 explore 分歧审计 · 只读）**：verdict = 有分歧 —— **PARTIAL 0 · SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0**；3 条 DOC-DRIFT（落点在设计档侧，见 §5.5）+ 1 条实现缺陷。
  - 缺陷（唯一代码项）：原诊断面把「吃选择器串」的档内闭包助手掌传进 `locator(...).evaluateAll(...)` —— 该 API 首参 = **匹配元素数组** ⇒ 页内 `querySelectorAll(<数组>)` 必抛；又该行位于 `catch` 内 ⇒ 诊断自身报错顶替真错（KD-9 失败取证面失效）。
  - **自修轮 1**：删该助手（现档内只余 `norm`），`catch` 内改**自含箭头**（页面上下文引不到档内闭包）。
  - **复验双证据**（临时探针 `thincoder-desktop/test/_probe-diag.mjs`，用毕即删）：旧形实抛 `Failed to execute 'querySelectorAll' … '[object HTMLElement],…' is not a valid selector`；新形实得 `providers=ready model=none agent=ready mcp=ready` ⇒ 缺陷为真 · 修复可用。
  - 复跑：`npm test` = **119/119 · fail 0** ✓（较修复前读数一致，无新增红）。
- **轮次 2（`advisor type=code`）**：见本条续写（终态随其后落）。

### 5.5 交父侧 / 设计者收正清单（本角色不改设计档）

| # | 面 | 事项 | 依据 |
|---|----|------|------|
| 1 | 设计档残值 | `docs/desktop/design/E2E-TESTING.md:131`（§6 T-DSK27 行）态序写 `ready,ready,none,ready`，与同档 §3.2:75 / §3.3:88 的**具名**口径（`providers`/`agent`/`mcp` = ready · `model` = none）相悖 | 产品实态 = `model=none`，三证：用例内具名断言实跑绿 · 守卫探针实读 `providers=ready model=none agent=ready mcp=ready` · 产品侧无激活渠道 ⇒ 该行位 2 应为 `none`（`ready,none,ready,ready`） |
| 2 | 同 | `E2E-TESTING.md:75`（§3.2 userData 行）写「由 APPDATA / XDG_CONFIG_HOME 改向」，交付实态 = 走同档 `:79` 退路 `--user-data-dir`（env 改不动该面，实证见 §5.3） | 该行与 `:162` 的（unverified）标记须按实证回写 |
| 3 | 同 | 「（拟新增）」标记（`E2E-TESTING.md:18`/`:101` · `docs/desktop/design/PROJECT.md:142`/`:278`）：新档已落盘 127 行且已登记 ⇒ 标记失据；同档 §8-12 自述由实施 / 验收轮一并去标记 | 收正动作 = 去标记 + 值回填（交设计者 / 父侧） |
| 4 | 值回填 | 实读 `test/files.mjs` = **13 内容行 / 26 登记项**（HEAD = 12 行 / 25 项 ⇒ 本批 +1 行 +1 项）；批 A 两档登记未落 ⇒ 落齐后 15 行 / 28 项（单元 27 ✓ 与 `PROJECT.md` §4.1「二十七档」一致） | 口径 = 内容行数；设计 §4 表与本档既有预算值我未在本轮逐条复核 ⇒ 请其一并按实读对齐 |
| 5 | 值回填 | 用例实读 **127 行**（预算 ~120）、`.gitignore` 实读 **2 行**（预算 ~5） | 请随实施后修正轮回填 |

### 5.6 观察项 · 足迹 · 前提披露

- **足迹 = 仅声明集**：`git status --porcelain` = 4 M（`package.json` / `package-lock.json` / `test/files.mjs` / `test/run.mjs`）+ `?? .gitignore` + `?? test/integration/`；`src/main/**` · `renderer/**` 零改动；`test/artifacts/` 未入 git 列出 ∧ `check-ignore` 命中 ⇒ 忽略生效。
- **`run.mjs` 改动面** = `:4` 注释 1 行（Δ ±1 行内）。**未**重命名 `:11` 的导入标识 `unitFiles`——该清单本批起同时承载集成域，名与实已有语义漂移；改名即越出「±1 行注释」授权面 ⇒ 仅登记（观察项，交设计者 / 父侧定夺）。
- **临时件披露**：`thincoder-desktop/test/_probe-diag.mjs`（自建自删，`git status` 无残）；`%TEMP%\tc-desktop-e2e-*` fixture 家（用例自清）。
- **`doc-check` 本轮复取（exit 1）**：`FAIL(锚): 34 条悬空` + `FAIL(行宽): 19 行超 300 字符`；红项坐标全在 `docs/core/**` · `docs/vsc/**`（`docs/desktop/design/E2E-TESTING.md` 只出现报告面「符号·宽——不入闸」行）⇒ 本批 diff **零 `docs/**` 足迹**，非本批引入（据实报告，待父侧核）。
- **前提披露（E2E 绿的成立条件）**：`thincoder-desktop/node_modules/@thincoder/core` 是**junction** → `d:\teamcode\thincoder\thincoder-core`（`dir` 实读 `<JUNCTION> core [d:\teamcode\thincoder\thincoder-core]`）⇒ 本条 E2E 读数跑在**工作树核**上；而 `src/main/session-slots.mjs:27,54` 引 `setSessionEnd`（仅本地核 `session-slots.mjs:107` 导出）⇒ 若某检出把 `@thincoder/core` 解析到发布包（宿主 `package.json:14` 写的是 registry 区间 `^0.9.5`），主进程装载即失败、`boot = error`、E2E 必红。发布包 0.9.5 的内容本轮**未复验**（`npm` registry 核内容未取），故该风险按缺口登记（设计未载）。

### 5.7 评审轮次 2 / 3 与终态（§5.4 续写 · 收敛）

**轮次 2（`advisor type=code` · 三巡）**：终态 = **clean**（无 🔴 · 无未决修复项）。

**巡 1（首评）**：verdict = pass；5 条（🟡 1 · 🔵 4）；无 🔴。

**巡 2（修复核验）**：三条修复逐条对实 ✅ ——
- 修 ①（`:52-58`）：`t.after` 单 hook 内加 `try/finally` —— 清理不依赖 `close()` 成功（close 抛错时清位照做），异常照旧逃逸（不吞）。
- 修 ②（`:63`）：用例起始 `rmSync(SHOT, { force: true })` —— 判据③落点先清位（上一轮成功 PNG 不冒名当本次取证）。
- 修 ③（`:74-75`）：渲染面 console / pageerror 两信道直转测试输出（KD-9 失败取证面）。

两条未修（理由经设计档核实成立）：
- 🔵 `:85` userData 判据用 `startsWith`（非全等）：设计档 §7-2 已把「边界 / 错误用例」划出本批 ⇒ 判据强化不属本批面（留痕 = §5.6 观察项）。
- 🟡 `thincoder-desktop/test/run.mjs:11` 导入标识名 `unitFiles`（清单本批起兼载集成域 ⇒ 名与实漂移）：设计档 §4 钉死本档「±1 行注释 · 逻辑零改」⇒ 改名越授权面 ⇒ 仅登记，交设计者 / 父侧定夺（留痕 = §5.6 观察项）。

同巡新增 2 条 🔵。

**巡 3（新条修复核验）**：两条新 🔵 逐条对实 ✅ ——
- 修 ④（`:74-75`）：两失败信道前缀自别（`[e2e:console:<type>]` / `[e2e:pageerror]`）—— 与档内诊断行前缀 `[e2e]`（`:116`）可辨（零歧义溯源）。
- 修 ⑤（`:49-51`）：注释口径与代码实做对齐（`finally` 的作用 = 清位不依赖 `close()` 成功；**不吞异常**；「尽力清家」≠「保证零残留」）。

**VERDICT pass**（巡 3）· **终态 = clean**。

**净效应**：轮次 1（内部分歧审计）⇒ 自修轮 1 ⇒ 轮次 2（advisor 三巡）⇒ 自修轮 2 / 3（限本新档内）⇒ **0 未决项**；未修两条（userData 判据强化 · `run.mjs:11` 改名）皆设计已划出 / 越本批授权面，分别留痕 §5.6 / §5.5，**非静默省略**。

### 5.8 值回填（实读 · 2026-09-27 复核）

- 用例 `thincoder-desktop/test/integration/settings-panel.test.mjs` = **137 内容行**（122 非空）—— §5.1 表 ③ 与 §5.5 #5 所记 **127 行 = 自修轮前读数**（轮 2 三修 + 轮 3 两修后 +10 行）；**以本行为准**。
- `thincoder-desktop/test/files.mjs` = **13 行 / 26 登记项**（末项 = `test/integration/settings-panel.test.mjs`）—— 与 §5.5 #4 一致 ✓。
- `thincoder-desktop/.gitignore` = **2 行**（预算 ~5）· `thincoder-desktop/test/run.mjs` = **41 行**（±1 行注释 · 逻辑零改）✓。
- 运行期产物 `thincoder-desktop/test/artifacts/settings-panel.png` 在盘 **29 544 B**（不进 git）✓。

## §6 验证与收口（父代理）

**验证与收口（父侧 · 2026-09-27 02:02 ✓）**

### 6.1 交付与验收（父侧核验 ✓）

- **交付** ✓：`thincoder-desktop/test/integration/settings-panel.test.mjs`（**137 行** ✓·用例 T-DSK27 ✓）· `thincoder-desktop/package.json`（devDep `playwright-core ^1.63.0` ✓·`dependencies` 零第三方不变 ✓）· `thincoder-desktop/.gitignore`（`test/artifacts/` ✓）· `thincoder-desktop/test/files.mjs` +1 行登记 ✓ · `thincoder-desktop/test/run.mjs` 注释 ±1 行（逻辑零改 ✓）⇒ **`src/**` · `renderer/**` 零改动** ✓。
- **父侧亲跑** ✓：`cd thincoder-desktop && npm test` ⇒ **119/119 · fail 0** ✓（E2E 实跑 ≈2.3s ✓·`boot = ok` ✓·PNG 落点固定 ✓）。
- **父侧亲看** ✓：`read_image` 该 PNG = Settings 面板渲染正常（标题 + 中文/✕ + PROVIDERS 段 Preset/API key/勾选 + 第二表单 ✓）——**「AI 可见」达成** ✓（批 C 的存在理由 ✓）。
- **判据对照** ✓：① 真 Electron 跑通 + 固定落点 PNG ✓ ② 端到端三步（开 ⇒ 断言 ⇒ 关清容器 ✓）③ PNG 存在 + magic ✓ ④ web 快筛 **不做**（设计明列 ✓）⑤ 三端零回归 ✓（core 700 / cli 865 / vscode 1010 ✓·实施舱读数 ✓）⑥ devDep 形 ✓。
- **实施实证回写设计** ✓：userData 四支 env 改向**不达**（Chromium 不采信 ✓）⇒ 生效路径 = **`--user-data-dir`** ✓（§2.11 已回写 ✓）。

### 6.2 结算（D7 清单 ✓）

- **台账**：**#433 核销** ✓。**本档冻结** ✓。角色表 / 状态行 / 计数 / 指针随动 ✓（§2.11 更正块 ✓）。
- **未决项（在册 · 不静默）** ✗：`test/run.mjs:11` 标识名 `unitFiles` 改名 ∥ `:85` `startsWith` 判据强化 ⇒ **缓落**（父侧裁 ✓）；`E2E-TESTING.md:14` / `:76`「实施首步实证」措辞 = 观察项 ✓；**#399**（发布包解析缺口 ✓·已扩项 ✓）；**#435**（全仓 doc-check 存量 ✓）。
- **#404 项**：无 ✓（§6 先写后冻 ✓）。
- **设计槽** ✓：本批 designId 的 token 槽 ⇒ 父侧于链终点 `consume-design` 消费 ✓。

### 6.3 结语

**一句话** ✓：桌面端从此**可被 AI 真看见** ✓（真 Electron + 固定落点截图 + 单入口零回归 ✓）——此后每一批 UI 变更都有了"看得见"的验收面 ✓。
