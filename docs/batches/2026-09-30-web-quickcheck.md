# 2026-09-30 · web 快筛
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #434（web 快筛——渲染面脱 Electron 快筛）；用户 2026-09-30 23:44 批次令「别的也不该等」；前置 = Playwright 基建（#433）已落。
> 台账 = #434（web 快筛 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目（台账 #434 · web 快筛 · 归批）**

- **来源**：台账 #434（承 #432/#433——Playwright 基建已落；批 C 设计 `docs/desktop/design/E2E-TESTING.md` 裁定「本批不做 web 快筛」，保留价值在册）；用户 2026-09-30 23:44 批次令「别的也不该等」⇒ 点火（本舱曾因域让路一度掐队，现补派）。
- **关键判据**：渲染面已是宿主注入形（`attachX(host,…)` 族——同一缝即可喂浏览器）；权威面建议 = **Electron 权威 · web 只做快筛**（设计轮实读后定形）；与 #433 基建的复用关系 = 设计轮定形。
- **授权口径**：批次点火令（用户令）= 全线自动驾驶（设计 → 评审 → 代签 → 实施）。
- **本 §1 为父侧补落**（评审/设计依据 = 台账 #434 全文 + 本批 §2）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-10-01（修复轮 1（评审轮次 1 · 5 条逐条收正）已落——落点 = docs/desktop/design/WEB-QUICKCHECK.md（175 行）∥ docs/desktop/design/PROJECT.md；上抛 3 项（§2.5 ∥ §2.6））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 任务书（本批 = web 快筛（渲染面脱 Electron）· 设计轮 · 不实施）

- **轮次**：initial（设计；三件落盘归实施轮——本设计轮零实施）。
- **本批条目（覆盖）** = 台账 #434（§1 已补落：来源 ∥ 关键判据 ∥ 授权口径）——**消解径三件**：① host shim 契约 ∥ ② 静态服务 ∥ ③ 一条真浏览器冒烟；**出口判据** = 权威面裁定（设计轮实读后定形）。
- **设计定形项**（§1 关键判据明示由设计定形）：权威面 ∥ 实现落点 ∥ shim 契约面 ∥ 服务语义面 ∥ 冒烟面 ∥ 与 #433 的复用与边界——§2.1 逐项。
- **本批不做（边界）**：不替代走查 ∥ 不作验收 ∥ 不入套件 ∥ 产品码零触 ∥ 不扩 #433 面 ∥ 不做事件面 ∥ 像素回归 ∥ CI 接线 ∥ 不铸 T-DSK 号（详 = 设计档 §7）。
- **设计轮禁项遵守**：产品码零触（本轮触碰面 = `docs/**`）· 未扩 #433 面（`E2E-TESTING.md` 零触——状态随动 = U1）· 行宽 / 挂点按仓纪律（机检复跑 = §2.2 尾注）。
- **设计档落点**：新建 `docs/desktop/design/WEB-QUICKCHECK.md`（**已落**，173 行）；随动 = `docs/README.md`（地图——**已落**：desktop 设计 6 ⇒ 7 ∥ 部分 7 ⇒ 8 ∥ 总 33 ⇒ 34）∥ `docs/desktop/design/PROJECT.md`（§4.1 工具三行 + `package.json` 值列随动 ∥ §4.2 本批块 ∥ §5 script 行 ∥ 变更记录——**已落**）∥ `docs/desktop/design/SHELL.md`（§1 树一行 + `package.json` 行随动 + 变更记录——**已落**）∥ `docs/desktop/design/E2E-TESTING.md`（**未触**——裁权归主 agent，见 U1）。

### 2.1 机制设计（要点——逐段单源 = 设计档；四块 = ① 权威面 ② shim 契约 ③ 静态服务 ④ 冒烟路径）

**① 权威面裁定（实读后定形）**：**Electron = 唯一权威面**（走查 + E2E 验收）；web 快筛 = 开发期回路——读数**不作验收结论 ∥ 不替代走查 ∥ 不入 `npm test` 门 ∥ 不作交付依据**。依据 = 真 Electron 独有且不可脱三面：preload 白名单（`CHANNELS` 46 ∥ `EVENT_CHANNELS` 23——`thincoder-desktop/src/preload/preload.cjs:30/47`）∥ 真 IPC 处理体 ∥ `app://` 特权 scheme（`thincoder-desktop/src/main/protocol.mjs:44`）。漂移处置方向 = 「快筛与 Electron 不一致 ⇒ 修快筛」（语义以产品与 `protocol.mjs` 为准）。纪律句四条 = 设计档 §3.4。

**② host shim 契约**：`window.thincoder = { invoke(channel, payload) → Promise, on(name, cb) → off }`（同窄桥形——`thincoder-desktop/src/preload/preload.cjs:76`）；stub 表 = **引导链实际调用集 7 通道**（`config:read` ∥ `project:recent` ∥ `sessions:list` ∥ `model:catalog` ∥ `provider:list` ∥ `ledger:read` ∥ `batch:status`——逐形实读锚 = 设计档 §3.2）；**表外 ⇒ reject + `__quickcheck.unstubbed` 记名**；冒烟收口断言 `unstubbed = 0`（产品 boot 新增通道 ⇒ 此处红 ⇒ 同批扩表——防静默漏面）。注入 = **服务端静态注入**（shim 脚本行插于 `app.mjs` 前——手动浏览与 Playwright 同一形；沿 CSP `script-src 'self'` 同源放行）。

**③ 静态服务**：自持 `node:http`（`127.0.0.1` ∥ 端口 0 ⇒ 打印实 URL）；三根映射——`/rc/` → 核包根（`createRequire` 解析——沿 `protocol.mjs:21` 同法）∥ `/` → `renderer/` ∥ `/__quickcheck/` → 工具资产；MIME 白名单（`.html/.mjs/.css/.svg/.png/.woff2`——同 `protocol.mjs:24-31`）+ 逃逸 ∥ 点段门（fail-closed ⇒ 404）；`/` 注入锚 = `thincoder-desktop/renderer/index.html:54` 脚本行（**锚缺 ⇒ 500 fail-loud**）。语义权威 = `protocol.mjs`（镜像不改——对齐表 = 设计档 §3.4）。

**④ 冒烟路径**：系统浏览器 channel（缺省 `msedge` ∥ `--browser=` 覆盖——本机 Edge ∥ Chrome 两存 2026-10-01 实查；**不引浏览器下载**）⇒ **九段断言序**：起服务/起浏览器 → 固定视口 + 干净面收集 → boot 就绪判据（`∈ {ok, error}` 落位 ⇒ 断言 `ok`）→ 骨架六槽 → 引导面 `no-project` 链 → 会话条 + 输入面板装配 → **真事件径**（会话下拉开 ∥ 关）→ 真 CSS ∥ 布局读数（grid ∥ `--bg` 实测 ∥ 盒几何）→ 截图落 `thincoder-desktop/test/artifacts/quickcheck-boot.png`（+ PNG magic）+ 收口三零（`pageerror` ∥ `console.error` ∥ `unstubbed`）。入口 = `npm run quickcheck`（scripts +1——**非套件**）。

### 2.2 受影响文件与测试面

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/tools/web-quickcheck/serve.mjs`（拟新增） | 0 ⇒ ≈110 | 静态服务 |
| 2 | `thincoder-desktop/tools/web-quickcheck/host-shim.mjs`（拟新增） | 0 ⇒ ≈80 | host shim |
| 3 | `thincoder-desktop/tools/web-quickcheck/run.mjs`（拟新增） | 0 ⇒ ≈160 | 冒烟 |
| 4 | `thincoder-desktop/package.json` | 23 ⇒ 24（scripts +`quickcheck`；devDeps 零改） | 脚本面 |
| 5 | 批内件 `docs/batches/2026-09-30-web-quickcheck.test.mjs`（拟新增） | 0 ⇒ ≈150（随批留存 · 不进仓套件） | 测试面 |
| 6 | 设计档随动（均已落） | `WEB-QUICKCHECK.md` **173** · `PROJECT.md` §4.1 三行 + 值列 ∥ §4.2 块 ∥ §5 script 行 · `SHELL.md` §1 树一行 · `docs/README.md` 地图 | 文档面 |

**零触面**：产品码全域（`thincoder-desktop/src/**` ∥ `renderer/**`）∥ 套件面（`thincoder-desktop/test/**`——单入口 ∥ 清单零登记）∥ `protocol.mjs` ∥ E2E-TESTING.md ∥ `thincoder-core` ∥ `thincoder-render-core` ∥ 三端测试面。

**测试面判据**：本批实施 = 批内件（服务路由 ∥ 门 ∥ shim 契约 ∥ 注入锚）+ `npm run quickcheck` 真浏览器一跑；仓套件零登记（`thincoder-desktop/test/files.mjs` 零改）。

**文档面机检**（复跑 as-of 2026-10-01 · `node scripts/doc-check.mjs`）：本批触碰档自产面（锚 ∥ 行宽 ∥ 行数配对三面）**零新增**——存量债（悬空 85 ∥ 行宽 205）与基线同拍、非本批引入；本批自产 4 处行宽 + 3 处标记形已收正（收正后未现于闸态清单）。

### 2.3 验收对照（台账 #434 三件 + 权威面判据 → 机检形）

| 判据 | 落点 | 机检形 |
|---|---|---|
| ① host shim 契约 | 设计档 §3.2 + `host-shim.mjs`（拟新增） | 批内件腿（7 通道逐形 ∥ 表外 reject ∥ 记录面）；冒烟收口 `unstubbed = 0` |
| ② 静态服务 | 设计档 §3.1 + `serve.mjs`（拟新增） | 批内件腿（`/` 携注入 ∥ `/rc/` 实供 ∥ 逃逸 404 ∥ 表外扩展名 404） |
| ③ 一条真浏览器冒烟 | 设计档 §3.3 + `run.mjs`（拟新增） | `npm run quickcheck` exit 0（本机 `msedge`）+ 截图存在 + PNG magic |
| ④ 权威面关系判据 | 设计档 §1 裁定 + §3.4 纪律句 | 本批 diff 零触 `test/` ∥ `src/` ∥ `renderer/`（触碰面 = `tools/` ∥ `package.json` ∥ `docs/`）；套件 `npm test` 面零改 |

**三链同源**：台账 #434（承载 = tech_todo；本批无需求档条目——如需需求档笔 = U3）↔ 本节条目 ↔ 设计档 §5 回指表。

### 2.4 关键决策（浓缩——全文含被否 = 设计档 §2）

| KD | 决策 |
|---|---|
| KD-W1 | 权威面 = 真 Electron；快筛 = 开发期回路（不作验收判据） |
| KD-W2 | 落点 = `thincoder-desktop/tools/web-quickcheck/`（不入 `test/` ∥ `scripts/`） |
| KD-W3 | 静态服务 = 自持 `node:http` 镜像（`protocol.mjs` = 语义权威；不抽共用模块——产品码零触） |
| KD-W4 | host shim = 服务端静态注入 + 7 通道 stub 表（表外拒） |
| KD-W5 | 浏览器 = 系统 channel（缺省 `msedge`；不引浏览器下载） |
| KD-W6 | 冒烟面 = 引导链 + 一真事件径 + CSS ∥ 布局 + 截图 + 干净面 |
| KD-W7 | 不入套件 ∥ 零登记 ∥ 单入口工具调用（scripts +1） |

### 2.5 上抛项

1. **E2E-TESTING.md 状态随动两处**：其 §7 项 1「不做 web 快筛」边界句 + §8-1 上抛项（判据④处置）⇒ 现状 = 已另立批（本批）——本批**未触**（「不扩 #433 已收口面」）；请裁：随本批修 ∥ 另立微轮。
2. **E2E-TESTING.md §3.5 步 4「输入框 `disabled` 真」判据疑陈旧**：现行 core 面板常可编辑（`thincoder-render-core/composer/panel.mjs:384-393`）——本批快筛未采该锚（步 6 用在场判据）；建议随 E2E 重建轮收正（另裁）。
3. **需求档笔**：`docs/desktop/requirements/PROJECT.md` 是否补「web 快筛 = 开发工具面（非验收）」条目——需求笔 = 主 agent（现承载 = 台账 #434）。

### 2.6 修复轮（评审轮次 1 · 2026-10-01 · eng-designer）

**来源** = 本档 §3 轮次 1（pass · 🔴0 / 🟡3 / 🔵2——发现 5 条）；父侧裁 = 全采纳（Suggestion = 处置建议；执行 = 本席）。**边界** = 文档面定点收正：`docs/desktop/design/WEB-QUICKCHECK.md` ∥ `docs/desktop/design/PROJECT.md`；机制四块 ∥ 权威面裁定 ∥ KD-W1–W7 ∥ 产品码全域零触；本档 §1 ∥ §4–§6 零触。**形态** = 设计档段内就地收正 + 本块逐条记录（原行字面保留为历史面）。

**逐号处置（号 → 处置 → 落点；行号 = 改后实读 2026-10-01）**：

| 号 | 处置 | 落点 |
|---|---|---|
| 1 🟡 | 档头计数与枚举随动——**六 ⇒ 七档** + `WEB-QUICKCHECK.md` 入枚举（另三档 ⇒ 另四档）；§1.1「本设计（本部分六档）」同拍（同一计数第二处——连带收正） | `docs/desktop/design/PROJECT.md:4-5` ∥ `:17` |
| 2 🟡 | §10 补 **DC** 行（web 快筛批 U1–U3 登记——登记 = 设计档 §8 单源 ∥ 本档 §2.5）；行 **R** 状态收正（判据④：快筛工具落形 ∥ 一致性核仍不做）；§8 E2E 行补状态注（原句保留——同批口吻） | `docs/desktop/design/PROJECT.md:1489`（DC 新行）∥ `:1400` ∥ `:1364` |
| 3 🟡 | WQ-4 机检形定形——取「机检出形」支（不采「不入机检」支）：**以不存在通道名跑 `run.mjs` ⇒ 非零退出 + stderr 含该通道名**（批内件腿）；设计档 §5③ ∥ §6 同拍（错误径腿）；本 §2.3 ③ 行同拍（见下） | `docs/desktop/design/WEB-QUICKCHECK.md:151` ∥ `:139` |
| 4 🔵 | §3.2「7 通道来源」改逐通道对应（5 调用点 ↔ 7 通道逐条）+ 装配链注（`mount-settings.mjs:163`（`infoFace.refreshInfo()`）⇒ `mount-info` 面接线）；连带实读收正：`app.mjs` 调用点坐标 `:218 ⇒ :219` | `docs/desktop/design/WEB-QUICKCHECK.md:79-81` |
| 5 🔵 | 零触句补「运行期产物根（`test/artifacts/`）除外」两处 | `docs/desktop/design/WEB-QUICKCHECK.md:140` ∥ `:159` |

**§2.3 ③ 行同拍**：机检形以本块为现行读数——「`npm run quickcheck` exit 0（本机 `msedge`）+ 截图存在 + PNG magic + **错误径（WQ-4）= 不存在通道名 ⇒ 非零退出 + stderr 含通道名**（批内件腿）」（原行字面保留为历史面；三链同源 = 设计档 §5③ ∥ §6 WQ-4 同值）。

**读回（D6 · 逐处）**：改后逐处实读——`PROJECT.md:4-5`（七档 ∥ 另四档含 `WEB-QUICKCHECK.md`）· `:17`（七档）· `:1364`（E2E 行状态注在位）· `:1400`（行 R 已收正）· `:1489`（DC 行）· `:1911`（变更记录行）；`WEB-QUICKCHECK.md:79-81`（逐通道对应 + 装配链）· `:139`（§5③ 错误径腿）· `:140`（§5④ 产物根除外）· `:151`（WQ-4 机检形）· `:159`（§7-4 产物根除外）· `:174-175`（变更记录）。**行数读数（内容行数口径 = 文末换行不计）**：`WEB-QUICKCHECK.md` **173 ⇒ 175** · `PROJECT.md` **1909 ⇒ 1911**。

**文档面机检（复跑 2026-10-01 · `node scripts/doc-check.mjs`）**：本席首版 PROJECT.md 变更记录行 1 处行宽（302 字符）已就地收正（295——收正后未现于闸态清单）；**行宽 = 205**（与设计轮读数同拍——零新增）；触碰两档收正行零现于闸态清单（`WEB-QUICKCHECK.md:119-121` 三条 = §4「拟新增」路径列报 · 不入闸，非本批引入）；`行数面` 差异 8 条 = §4.1 值列 as-of 漂移（报告态——非本批引入）。**零新语义**（评审 5 条导出）· **产品码零触**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 轮次 1（对象 = #434 web 快筛——host shim 窄桥 ∥ 静态服务 ∥ 真浏览器冒烟九段；权威面 = 真 Electron）**

**评审域**：`docs/batches/2026-09-30-web-quickcheck.md` ∥ `docs/desktop/design/WEB-QUICKCHECK.md`（173 行）∥ `docs/desktop/design/SHELL.md` ∥ `docs/desktop/design/PROJECT.md`（域外锚点 ∥ 域外计数值 = `unverified`——本评审只读四档）。
**计数**：🔴 0 · 🟡 3 · 🔵 2（发现 5 条）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / doc-state | 🟡 | `docs/desktop/design/PROJECT.md:4-5` 档头「本部分 = **六档**」未随本批收正——README 地图已 6 ⇒ 7（`docs/desktop/design/WEB-QUICKCHECK.md:126` ∥ 批档 `:27`），本批新增第 7 档（`WEB-QUICKCHECK.md`）不在档头枚举 ⇒ 两处计数分叉、读者面缺锚 | 档头计数与枚举随动（六 ⇒ 七 + `WEB-QUICKCHECK.md` 一行），或声明该计数口径不含工具面档 |
| 2 | Methodology / 上抛登记（coordination） | 🟡 | 本批 U1–U3（`docs/desktop/design/WEB-QUICKCHECK.md:166-168` ∥ 批档 §2.5 `:79-83`）未在 `PROJECT.md` §10 登记行——§10 既有行 R（`docs/desktop/design/PROJECT.md:1400`）即本主题登记行（判据④归属），本批落形后状态未随动；同档 §8 边界行（`:1364`——「web 快筛 ∥ 判据④ 不做」）同主题亦未随动 | §10 补一行（登记 = 设计档 §8 单源）+ 行 R 状态收正（判据④：快筛工具落形 ∥ 一致性核仍不做）；§8 边界行补状态注 |
| 3 | Acceptance criteria | 🟡 | `WQ-4`（`--browser=不存在`）标「✅ 做」，而机检形 = 「实施期定形」（`docs/desktop/design/WEB-QUICKCHECK.md:150`）；§5 判据③ 机检形（exit 0 + 截图 + PNG magic，`:138`）不覆盖错误径 ⇒ 该错误用例现状不可验 | 出机检形（例：`--browser=<不存在>` 跑 `run.mjs` ⇒ 断言非零退出 + stderr 含通道名；或明示「行为定形、不入机检」并在 §5 ∥ §6 同标） |
| 4 | Clarity | 🔵 | §3.2「7 通道来源」行（`docs/desktop/design/WEB-QUICKCHECK.md:79-80`）把调用点与回执形锚混列——`mount-settings.mjs:161-163` 注「`provider:list` + 项目级两读数」，而表内 `ledger:read` ∥ `batch:status` 实读锚 = `mount-info.mjs:22-30` ∥ `:31-35` ⇒ 7 通道 ↔ 5 调用点对应不唯一 | 拆「调用点 ∥ 回执形锚」两列逐一对应通道，或注明 mount-settings → mount-info 的装配调用链 |
| 5 | Boundary clarity | 🔵 | §7 边界 ∥ §5④ 机检行「diff 零触 `test/`」（`docs/desktop/design/WEB-QUICKCHECK.md:139`）vs 冒烟截图落 `thincoder-desktop/test/artifacts/quickcheck-boot.png`（`:94`；产物根 gitignore 在册 = `docs/desktop/design/SHELL.md:16`） | 零触句注明「运行期产物根除外」，免实施轮误读为禁写 |

**已核项（域内）**：① 三件交付（host shim 契约 ∥ 静态服务 ∥ 真浏览器冒烟）↔ 台账 #434 ∥ 批档 §2.3 逐件对位齐；权威面裁定（KD-W1）∥ 纪律句（§3.4）∥ 边界（§7）∥ 与 #433 复用 ∥ 边界在册（§1）。② 受影响文件表标注合规——新代码 ∥ 测试档 0 ⇒ ≈110 ∥ ≈80 ∥ ≈160 ∥ ≈150（≪300 ⇒ 无越层档 ∥ 无需拆分预案）；纯 `.md` 档豁免；`package.json` 23 ⇒ 24 已标注。③ 数值抽查：`WEB-QUICKCHECK.md` **173** 行 ✓；`SHELL.md` **238** = 本批改动前读（现盘 = 239——变更记录一行入册）⇒ 口径自洽（「现行」= 改动前实读）。④ 跨档同值抽查：`SHELL.md:14` ∥ `PROJECT.md:169` ∥ `PROJECT.md:1129` script 五条（含 `quickcheck`）三处一致 ✓。
**域外/未核**：`package.json` **23** ∥ `docs/README.md` **141** ∥ `thincoder-desktop` 产品码全域锚点（`preload.cjs:30/47/73/76` · `protocol.mjs:21/24-31/34-37/44/53-61` · `renderer/**` 全部 file:line）∥ `E2E-TESTING.md` §7 项 1 ∥ §8-1 —— 均未在本评审域内实读，`unverified`。
**文档地图限制（如实申明）**：无 document map 可用 ⇒ Document ownership 判据降级——按放置面判：新档住 `docs/desktop/design/` 与兄弟档同域 + 兄弟档指针在册，未构成「为既有节新开文件」的分裂面。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-01 00:3x · [代签 · 承用户令]**

用户 2026-09-30 23:42「实活都做了」∥ 23:44「别的也不该等」= 全线点火令。本批评审 **pass**（§3 轮次 1：🟡3 · 🔵2）+ 修复轮五号全落（§2.6 块 `:85-103`，逐处读回 ✓；父侧抽核：`PROJECT.md:4-5` 档头七档 ✓ ∥ `:1489` DC 行 ✓ ∥ `:1364` 状态注 ✓）⇒ 按令**代签放行**——实施舱按设计档 §4 受影表派出（`tools/web-quickcheck/` 三档 + `package.json` 一条 script + 批内件）。

**父侧裁定两处**：① 修复轮披露项（`WEB-QUICKCHECK.md:128`「`thincoder-desktop/test/**`（套件面——单入口 ∥ 清单零登记）」）——零触句已带「套件面」限定，**不再补**；② 发布面零涉（快筛 = 开发工具面，不入套件 ∥ 不入发布链）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（五件交付 · 批内件 5/5 绿（先红后绿）· 审计 1 轮 + 评审 2 轮（终态 clean）· favicon 特例按父侧裁 A 登记）



### 5.1 交付摘要（五件 · 落形 + 读数）

| # | 交付物 | 落形 | 机检读数 |
|---|--------|------|----------|
| ① | `thincoder-desktop/tools/web-quickcheck/serve.mjs`（新档） | 内容行 **140** | 三根镜像（`/__quickcheck/` ∥ `/rc/` ∥ `/`）+ MIME 六项 + 逃逸 ∥ 点段门 + `/` 与 `/index.html` 注入 shim 行（锚缺 500 fail-loud）；直跑待命形实测（打印实 URL + `GET /` 200 携注入）；WQ-2 ∥ WQ-3 腿绿 |
| ② | `thincoder-desktop/tools/web-quickcheck/host-shim.mjs`（新档） | 内容行 **42** | 7 通道逐形（与设计 §3.2 表逐字）+ 表外 reject（`[quickcheck] channel not stubbed: <ch>`）+ `__quickcheck` 记录面（`calls` ∥ `unstubbed` ∥ `subscriptions`）；WQ-2（续）腿绿 |
| ③ | `thincoder-desktop/tools/web-quickcheck/run.mjs`（新档） | 内容行 **180** | 九段全绿 + 收口三零 + 截图；`npm run quickcheck` exit 0；旗标面（表外参数 ∥ 空值 ⇒ 明示退出）三出口各实测 exit 1 |
| ④ | `thincoder-desktop/package.json` | **23 ⇒ 24**（+1 行：`quickcheck` script；scripts 四条 ⇒ 五条；`devDependencies` 零改） | 入口实跑 exit 0（`segments=9/9 failed=0 unstubbed=0 pageerrors=0 console-errors=0`） |
| ⑤ | 批内件 `docs/batches/2026-09-30-web-quickcheck.test.mjs` | 内容行 **137** | `node --test` 实测 **5/5 绿**（先红后绿：红态 = `ERR_MODULE_NOT_FOUND: serve.mjs` 已取证） |

**截图产物**：`thincoder-desktop/test/artifacts/quickcheck-boot.png`（≈17.6 KB · 运行期产物不进 git）——亲看 = 真渲染面（no-project 引导 ∥ 会话条 ∥ 输入面板 ∥ 控制行 ∥ 状态栏底行）。

### 5.2 决策透明表

| 项 | 决策 | 理由 |
|---|---|---|
| favicon 噪声处置 | **裁定 A**：`serve.mjs` 对 `/favicon.ico` 回 204 | 真浏览器自动取 favicon ⇒ 扩展名门 404 ⇒ 收口 console 判据红（链路本身净：boot=ok ∥ pageerror=0 ∥ unstubbed=0）。设计 §3.3 实施首步实证点②「停下登记，不静默放宽」⇒ 三案（A/B/C）上抛，父侧裁 A（B 机制未解释不受 ∥ C 弱化真信号不受）；收口 `console.error = 0` 判据**保持不弱化** |
| **差异登记（父侧裁 ② 一行）** | **登记外特例：`serve.mjs` 对 `/favicon.ico` ⇒ 204（浏览器面产物 · 页面零参与）；其余供给语义（三根 ∥ MIME 白名单 ∥ 逃逸 ∥ 点段门 ∥ 入口）仍为 `protocol.mjs` 纯镜像**——设计档 §3.1/§3.4 对齐表登记 = 父侧随收口补 | 父侧裁 A ② |
| 运行期产物根 | 截图落 `test/artifacts/`（`thincoder-desktop/.gitignore:2` 已忽略）——「`test/**` 零触」的登记例外 | 设计 §5④ ∥ §7-4（「运行期产物根除外」） |
| 批内件腿数 | 四用例（WQ-1–WQ-4）· **五腿**（WQ-2 拆服务路由 ∥ shim 契约两条） | 逐用例可对位 ∥ 失败归属更精（评审轮 1 🔵#5 消歧） |
| 夹具缝 | `startServer({ rendererRoot })`（仅此一缝） | WQ-3 锚缺腿需夹具 index.html（产品码零触 ⇒ 不改真 index.html） |

### 5.3 审计与代码评审轮次与终态

- **轮次 1（内部 explore 分歧审计 · 只读）**：verdict = DEVIATIONS 2 项（均低危）：① DOC-DRIFT = 设计 §4「实施后对账」挂账（行数读数 = §5.1；登记归父侧收口轮）；② OUT-OF-LIST = 3 枚临时探针（`.thincoder/tmp/`——已回收，现盘零留存）。**PARTIAL 0 · SILENT-SIMPLIFICATION 0**；零触区（`src/**` ∥ `renderer/**` ∥ `test/**` 除产物）确认干净。
- **自修轮 1**：无必修项（零代码改）。
- **轮次 2（advisor · type=code 全评）**：verdict = **pass**；5 条 🔵（无 🔴）：① serve 兜底 catch 零日志 ∥ ② 直跑判定路径串比较 ∥ ③ run 旗标面静默忽略表外参数 ∥ ④ shim `on` 无条件接受（设计已裁 v1 面）∥ ⑤ 批内件头注计数歧义。
- **自修轮 2**：① 兜底 catch 补 `console.error("[quickcheck] request handler error:", error)`（先于 500）∥ ② 直跑判定改 `realpathSync.native` 两侧真实路径 ∥ ③ 旗标面收紧（三出口各实测 exit 1）∥ ⑤ 头注改「四用例 · 五腿」；④ 按设计 §3.2/§7-5 裁决维持不改（留观察项）。
- **轮次 3（advisor 复核）**：verdict = **pass** —— 四条修复逐条实读核实 ∥ #4 裁决成立 ∥ 新增 1 条边缘面 🔵（`realpathSync.native` 无 try/catch 兜底——触发条件未核，可选加固，不阻塞）。**终态 = clean（0 未决必修项）**。
- **回归**：修复后批内件复跑 5/5 绿；`npm run quickcheck` exit 0；直跑待命形复跑通过。

### 5.4 跑法与读数

- 批内件（不进仓套件 · 随批留存）：`node --test docs/batches/2026-09-30-web-quickcheck.test.mjs` ⇒ 5/5 pass（WQ-1 ≈2.4s ∥ WQ-2 ≈85ms ∥ WQ-2续 ≈1.6ms ∥ WQ-3 ≈15ms ∥ WQ-4 ≈404ms）。
- 入口：`cd thincoder-desktop && npm run quickcheck` ⇒ exit 0（读数行 = §5.1④）。
- 各档 `node --check` 过；产品码零触（diff 面 = `tools/web-quickcheck/` ∥ `package.json` ∥ `docs/batches/2026-09-30-web-quickcheck.test.mjs`）。
- **不跑仓套件**（收口轮父侧恰跑一次）。

### 5.5 上抛（父侧收口轮面 · 本席不落）

1. 设计档登记随动（裁 A ②）：`WEB-QUICKCHECK.md` §3.1/§3.4 对齐表补 favicon 特例行；同档 §1 `package.json:21` devDep 锚随 +1 行 ⇒ `:22`。
2. 设计 §4 行数对账（预估 ⇒ 实读）：serve ≈110 ⇒ **140** ∥ host-shim ≈80 ⇒ **42** ∥ run ≈160 ⇒ **180** ∥ 批内件 ≈150 ⇒ **137** ∥ `package.json` 23 ⇒ **24** ✓。
3. `PROJECT.md` §4.1 `package.json` 行值列随动（23 ⇒ 24 关账）+ 变更记录实施轮条目。

## §6 验证与收口（父代理）

**交付核验（9/9）**：五件落盘（`thincoder-desktop/tools/web-quickcheck/` 三档 140 ∥ 42 ∥ 180 ∥ `package.json` 23⇒24 ∥ 批内件 137）——父侧亲跑：**批内件 5/5 pass**（WQ-1 九段全绿 + WQ-2 边界/契约 + WQ-3 锚缺 500 fail-loud + WQ-4 错误径非零退出）✓ ∥ `node --check` 全过 ✓ ∥ `package.json` 实读 = 24 行 ∥ script 五条 ✓ ∥ 产品码 `src/` ∥ `renderer/` 零触 ✓。

**收口轮随办（就地落 · 父侧直接执行）**：① favicon 特例登记 = 设计对齐表新增行（`docs/desktop/design/WEB-QUICKCHECK.md:114`——「`/favicon.ico` ⇒ 204」+ 收口判据**不弱化**注——裁 A 落形）✓；② `docs/desktop/design/PROJECT.md:169` 值列 23 ⇒ **24** 关账 ✓。

**仓套件**：未跑（收口轮父侧恰跑一次——会话级收口时统一跑；本批验证面 = 批内件 5/5 + 九段冒烟 exit 0）。

**台账**：#434 → 核销（web 快筛工具落形——开发回路快筛 ∥ **权威面仍 = 真 Electron**（KD-W1））。

**暂缓批复核：无**。
