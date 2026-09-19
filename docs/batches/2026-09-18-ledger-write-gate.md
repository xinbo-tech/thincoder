# 2026-09-18 · 台账写门批（#38）

> **前情 = docs/batches/2026-09-18-machine-check-closeout.md §1 ④（L7 拆批裁定）**

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `6048867c`；先红 3 红 → 后绿 4/4 + O1 修 5/5 · 三包 334/676/600 全绿）

### 1.1 批件

| # | 条目 | 实况 |
|---|---|---|
| ① | **台账 #38**：`task_book` 指针「**指向档存在**」无机检落点（架构兜底行半幅缺口；v1 的 L1 已随存储消亡） | 设计面 = `docs/core/design/LEDGER.md` §6.1（写门·指针存在性）+ §2 咬合 CHECK 半幅句 + §8 AC-M2-8 / 用例 T11–T14；**AC 逐字承接**原批档 `docs/batches/2026-09-18-machine-check-closeout.md` §2.3（A-38-1…A-38-4） |
| ② | **拆批来源**：原批（M2 · M3 · M10 = 3）触发 L7（≤2）越界 ⇒ 拆批；本批 = **M2 单模块** | 父侧裁定 2026-09-18 05:2x；设计 / 评审 / designToken 均覆盖原三件——拆批 = **射程边界动作**（L7 越界执行），非内容变更 |

### 1.2 台账

- **#38** → 本批；完成后核销。

### 1.3 边界

- 本批 = **M2 单模块**（`thincoder-core/ledger-cmd.mjs` + 新测试档 `thincoder-core/test/ledger-write-gate.test.mjs`）。
- #48（M3）· #51（M10）留原批 `2026-09-18-machine-check-closeout.md`（计数 2 ✓）。

## §2 任务书

> **本 §2 = 引用承接**（设计轮已在原批完成并过评审）：设计要点 / 判据 / AC / 受影响文件 / 先红方案**逐字见** `docs/batches/2026-09-18-machine-check-closeout.md` §2.3（#38 段）；机制单源 = `docs/core/design/LEDGER.md` §6.1 + §2（半幅分层句）。
> **父侧直接执行**（本 §2 为拆批边界产物，无新语义；可 revert）。

| 项 | 内容 |
|---|---|
| 落点 | `thincoder-core/ledger-cmd.mjs`（写门前置判 + 解析 helper）· 新档 `thincoder-core/test/ledger-write-gate.test.mjs` |
| 判据 | `§` 解析口径三条（文件部分 = 首个 `§` 前子串；缺文件部分 ⇒ 拒；指向档不存在 ⇒ 拒）· 结果行口径（`在途` / `待核销` 且 `task_book` 非空）· 失败文案逐字（**前缀 = 函数名** `ledgerUpdate` / `ledgerAdd`） |
| AC | A-38-1…A-38-4（原批档 §2.3 逐字） |
| 禁触 | 需求档（父侧笔）· 提示词面 · 数据面 · 冻结批档 / `_archive/**` / 参照树 |
**批准依据**：用户 2026-09-18 04:46「都开了吧」= 全批授权；本批为拆批产物（设计面已在原批过评审 + 复核轮 pass）。

## §5 实施（eng-coder）

**轮次**：initial（M2 写门·指针存在性）→ **fix（O1 基准收正）** · **终态**：**clean**

### 一、交付摘要（initial 轮）

**任务**：台账 `task_book` 指针「指向档存在」半幅（`docs/core/design/LEDGER.md` §6.1 · AC-M2-8 · 台账 #38）——**写入时门**（fail-closed）。
**落点**：`thincoder-core/ledger-cmd.mjs`（门，唯一实现）+ 新档 `thincoder-core/test/ledger-write-gate.test.mjs`（T11–T14）。

| # | 状态 | 验收项 | 证据 |
|---|---|---|---|
| 1 | ✅ Done | **先红**（门落位前必红） | `node --test test/ledger-write-gate.test.mjs` ⇒ **exit 1 · fail 3**——T12/T13/T14 报 `Missing expected exception`（门未落位不抛）；T11 绿（正控不依赖门） |
| 2 | ✅ Done | **后绿**：T11–T14 全绿 | 同命令 ⇒ **exit 0 · tests 4 / pass 4 / fail 0**；三形态逐字落盘 · T12/T13 带「行不变」断言 · T14 射程 + 连带效果 + 出路 |
| 3 | ✅ Done | 失败文案**逐字**（含函数名前缀） | `assert.throws` 以 `{message}` 全串比对，期望值由 `resolve(proj, …)` 现算（基准被真正钉住）——T12 / T13 逐字在案 |
| 4 | ✅ Done | 三包全量绿 | core **330/330** · CLI **675/675** · VSC **599/599**；相关面单档复跑：CLI `ledger-surface.test.mjs` 12/12 · VSC `ledger.test.mjs` 10/10（两包 `node_modules/@thincoder/core` = junction ⇒ 单源，读数覆盖本次改动） |
| 5 | ✅ Done | `node scripts/doc-check.mjs` 零新增 | 读数与原批档 §2.6 基线逐项一致；另做**移档对照实验**（新档移出仓 → 重跑 → 逐项同值）⇒ 零新增实锤（本批改动全为 .mjs，机检源域 = `docs/**`） |
| 6 | ✅ Done | 禁触面 / 边界 | `ledger.mjs` / `ledger-db.mjs`（DDL、迁移表）零改 · 未触需求档 / 提示词面 / 数据面 / 冻结批档 / `_archive` / 参照树 · 未做 #51 收集自检 |

**改动清单（initial 轮 · file:line · as-of fix 轮前）**

| 文件 | 行 | 内容 |
|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | `:9`–`:10` | 新增 `node:fs` `statSync` / `node:path` `resolve` import |
| 〃 | `:36`–`:37` | `isFile`（私有：`statSync().isFile()`；目录 / 缺失 → false） |
| 〃 | `:39`–`:50` | `assertTaskBookGate(cwd, fnName, status, taskBook)`（**非导出**——§7.1 导出面零扩）：射程判 → 非空判 → 首个 `§` 前子串解析 → 缺文件部分拒 → 解析非档拒 |
| 〃 | `:56`–`:57` | `ledgerAdd` 门调用（结果行 = INSERT 硬编码「待讨论」⇒ 当下恒不触发；两入口形态统一，注释如实披露） |
| 〃 | `:75`–`:79` | `ledgerUpdate`：提 `nextTaskBook` 局部量（门与 UPDATE 同一表达式单源）· 门调用（判序：迁移表判 → 本门 → `UPDATE`） |
| `thincoder-core/test/ledger-write-gate.test.mjs` | 新档（约 115 行） | 先红 / 后绿载体；tmp 库 + 临时 cwd + 自造在档 |

越界改动：**无**。

### 二、决策透明表（D1–D4 · 设计未明写者的实现裁决）

| # | 决策 | 依据 / 边界 |
|---|---|---|
| D1 | 门 = **单 helper** `assertTaskBookGate`，**非导出**（导出面零扩）；判位 = 迁移表判之后、`UPDATE` 之前——两写函数同层同序 | 设计 §6.1「判位与迁移表拒同层」逐字 |
| D2 | 解析实体化 = 首个 `§` 前子串（trim）；`§` 之后不参与判定；空子串 ⇒ 不可解析（拒） | 设计 §6.1 口径①③；现盘三形态按此全覆盖 |
| D3 | 文案前缀 = **函数名**，经 `fnName` 形参逐调用点传入（`ledgerAdd` / `ledgerUpdate`），与同函数既有两条文案同款 | 设计 §6.1 文案段（工具名 ↔ 函数名对应） |
| D4 | 测试隔离 = 临时 cwd + 自造在档 + `_setLedgerDirForTest` 注入 tmp 库（**不读写真实用户库**）；行一律经写命令构造（唯一例外 = T14 脏指针的**刻意**原生 SQL 构造，档内注明来意） | 测试纪律 + A-38-3 可复现性（回指 T11） |

### 三、审计与代码评审轮次（终态 = **clean**）

| 轮 | 类型 | 结论 |
|---|---|---|
| R1 | explore 只读发散审计（对照 §6.1 / A-38-1…4） | 四类偏差（部分实现 / 静默简化 / 文档漂移 / 越界）**均无**；报 3 项邻域观察（登记见五） |
| R2 | advisor 代码评审 | **`VERDICT: pass`**——0 🔴 · 1 🟡（设计面前提，报告项非阻断）+ 3 🔵（test 档注释失真 ×2 · 非文件形态文案 ×1） |
| R3 | self-fix（1 次） | test 档注释两处收正（`:88` 失真注释、`:102` 直写来意标注）——**零行为变更** |
| R4 | advisor 代码评审（fix 验证） | **`VERDICT: pass`**——2 项 Fixed · 2 项按声明排除保持，无新问题 |

### 四、先红-后绿与三包 / 机检读数（initial 轮）

- **先红**：exit 1 · **fail 3**（T12/T13/T14 `Missing expected exception`；T11 绿）
- **后绿**：exit 0 · tests 4 / pass 4 / fail 0
- **三包**：core **330/330** · CLI **675/675** · VSC **599/599**
- **机检**：`node scripts/doc-check.mjs --root .` ⇒ 零新增（移档对照实验逐项同值）
- **环境备注**：三包读数录于 05:2x–05:3x 工作树（其间含他批并发改动）；与本笔改动直接相关的面已单档复跑确认。

### 五、待裁项 / 域外观察（现状注）

1. **O1（设计面前提 · 已收正）**：门基准 = 原始调用 `cwd`（`ledger-cmd.mjs` 门内），台账库关联键 = `resolveProjectRoot(cwd) ?? resolve(cwd)`（`ledger-db.mjs:31`）⇒ 容器根会话（锚 cwd 下唯一注册子仓）**同库异基准** ⇒ 依子仓相对写的合法指针被误拒；设计 §6.1 口径②括注在该形态不成立。**父侧裁定接受收正方向** ⇒ 本轮 fix 落地（见六）。
2. **O2（域外 · 原批 owner 的现场）**：`thincoder-core/test/__reverse-probe/` · `thincoder-cli/test/__reverse-probe/` · `thincoder-vscode/test/__reverse-probe.test.mjs` = **#51 先红探针残留**（属原批 `2026-09-18-machine-check-closeout.md` 射程；按 A-51-1 验后须删档复原）。本批未触、未删。
3. **O3（他族样本 · 非本批引入）**：`ledger-cmd.mjs:3` 头注指向已归档的 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md`——**#42 同族死指针样本**，本批未擅改。

### 六、fix 轮：O1 收正（2026-09-18 · 父侧裁定后 · 本轮）

**裁定（父侧）**：门解析基准改为**与台账库关联键同源**——`resolveProjectRoot(cwd) ?? resolve(cwd)`（与 `ledgerDbPath` 同表达式 · 单源构造）；设计档 §6.1 口径②括注精度由父侧同步。

**改动清单（fix · file:line · 现行）**

| 文件 | 行 | 内容 |
|---|---|---|
| `thincoder-core/ledger-cmd.mjs` | `:12` | 新增 `import { resolveProjectRoot } from "./manifest.mjs"`（**同源调用**——`resolveProjectRoot` 不在 `ledger-db.mjs` 导出面，故径取该判据的唯一权威档；不新增第二处推导） |
| 〃 | `:44`–`:46` | 门头注补基准口径（同源声明 + O1 收敛说明） |
| 〃 | `:52` | `const base = resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`（原取 `cwd` 的基准收于此）；`:53` = `resolve(base, part)` |
| `thincoder-core/test/ledger-write-gate.test.mjs` | `:18` | import 增 `ledgerDbPath`（同库前提断言用） |
| 〃 | `:118`–`:140` | 新增用例「O1 基准同源」：容器根 / 子仓两 cwd × 三形态 = 6 格；前置断言 `ledgerDbPath(container) === ledgerDbPath(sub)` 钉住「同库」前提 |

`ledger.mjs` / `ledger-db.mjs`（DDL / 迁移表逻辑）**零改**——基准同源 = 只读复用。

**先红 → 后绿（加例专用）**

- **先红（改前）**：`node --test test/ledger-write-gate.test.mjs` ⇒ **exit 1 · tests 5 / pass 4 / fail 1**——`ledgerUpdate：task_book 指向的档不存在：docs/batches/here.md（解析 = <tmp>\container9\docs\batches\here.md）`：容器根 cwd 下依子仓相对写的**合法**指针被误拒（O1 症状逐字复现；同时 T11–T14 全绿）。
- **后绿（改后）**：同命令 ⇒ **exit 0 · tests 5 / pass 5 / fail 0**（T11–T14 零回归 + 加例通过）。

**三包复跑（fix 轮）**

- **core**：336 tests · pass **335** · fail **1**——唯一红 = `test/tool-seams.test.mjs`（338 行 > 300 未登记）= **并发他批文件**（`git status` 记 M，非本批改动；本批两档 209 / 140 行，均在 300 线内）。
- **CLI**：**676/676 · fail 0** · **VSC**：**600/600 · fail 0**。

**机检（fix 轮）**

- 结构面：本笔改动 = 两个 `.mjs`（`docs/**` 外）+ §5 落 `docs/batches/**`——后者按 `PROJECT-MANIFEST.json` `checkConfig.anchors.exclude = ["_archive", "batches"]` **在机检源域外**（锚 / 行宽共用同一源域，`doc-check-width.mjs` §单源域）⇒ **新增命中面 = 0（构造性保证）**。
- 落 §5 前后实跑读数：候选 13937 → 13941 · 悬空 183 → 166 · 迁移期引文 96 → 109 · 行宽 5 → 6（新增者 = `docs/core/design/DOC-MIGRATION.md:380`）——**漂移全落他批并发文档**（本笔可触面为零），非本笔引入。

**七、fix 轮末次复跑（收口前增量 · 2026-09-18）**

- 并发他批的 `test/tool-seams.test.mjs` 已收至 300 行（六.三包 所记「338 行 > 300」项随之消解）⇒ 三包**末次读数**：core **334/334 · fail 0** · CLI **676/676 · fail 0** · VSC **600/600 · fail 0**（**取代**六.三包 的时点读数；六 保留他批并发现场的如实记录）。
- 本批两档零改，门用例档单档复跑 = **tests 5 / pass 5 · fail 0**（T11–T14 + O1 加例）。
- 机检零新增的**构造性**结论不变（本笔可触面 = 两个 `.mjs` + `docs/batches/**`——后者在 `checkConfig.anchors.exclude` 内）。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：门落位 = 解析口径三条 + 结果行口径 + 文案逐字（前缀 = 函数名）；先红 3 红（`Missing expected exception`）→ 后绿 4/4；**O1 修正轮**：基准改 `resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`（与 `ledgerDbPath` 逐字同源）+ 新例 6 格（容器根 / 子仓 × 三形态）先红 → 后绿 5/5 · T11–T14 零回归。
- **读数**：三包全量绿（core **334** · CLI **676** · VSC **600**）· 机检本笔零新增（构造性：批次档在 exclude 域 + 代码面不入源域）。
- **提交**：`6048867c`（4 档 · +340 / −2）。
- **审计与评审终态**：审计 1 轮**零发散** · 代码评审 1 轮 pass（🔴 0）+ fix 轮复审 pass · **clean**。
- **残留（登记/路由）**：① `LEDGER.md:91` 口径② 旧基准句 ⇒ **已由父侧直改落位**（父侧直接执行 · 可 revert）② 基准式同体复制（`ledger-cmd.mjs:52` 与 `manifest.mjs:65` `docRootBase` 同体）——按父侧裁定取「同表达式」形态，**收敛候选登记**③ 新例未覆盖回退腿（歧义 / 无注册子仓 ⇒ `?? resolve(cwd)`）⇒ 可选补 1 格 ④ §5「原样重投」逐字性不可核验（无第二源）⇒ 如实披露。
- **三账**：台账 **#38** 已核销；批档冻结；收口日期 2026-09-18。
