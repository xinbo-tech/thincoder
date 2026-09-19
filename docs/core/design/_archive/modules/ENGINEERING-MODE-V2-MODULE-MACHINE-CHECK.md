# 工程模式 v2 · 模块设计（M8 机检引擎）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M8）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 基础族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

v1 机检是**三引擎 + 硬编码**：`check-doc-width*.mjs`（行宽 + 一致性 V1/V2/V3）· `doc-anchors*.mjs`（锚，内含 V5/CLI 与 VSC 双锚引擎）· `check-ledger*.mjs`（台账 L1–L4）三套入口，各自硬编码本仓 `docs/` 路径、各自扫描源域、各自行宽阈值，还带参照历史面豁免族 / 六档并入映射 / V3 历史常量等过度工程。
本模块砍到**单引擎（锚 + 行宽）+ 声明面**——判据全部从 manifest `checkConfig` 读，目录落点读声明面（域驱动 = manifest 在场 / `--domain` × `checkConfig.scanDirs`），台账一致性由 SQLite schema 承接（check-ledger 作废）。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | 单引擎：内核 = 锚检查（段引用可解析）+ 行宽检查（单行 > 阈值） | ②.1 |
| F2 | 声明面判据：`scanDirs` / `lineWidth` / `anchors.domain` / `exemptions` / `anchors.exclude` 全读 `checkConfig` | ②.2 |
| F3 | 砍掉：双引擎 · 三套源域 · 三套行宽判据 · 参照历史面豁免族 · 六档并入映射 · V3 历史常量 | ②.3 |
| F4 | 目录落点读声明面：域根（manifest 在场 / `--domain`）× `checkConfig.scanDirs`（主 agent 2026-09-17 收正——manifest `docRoot` 是文档类别 map 非单一扫描根，落点语义 = 被检域根） | ②.4 |
| F5 | D5 冻结窗口机检：评审在途不改被审文档可被检 | ②.5 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零依赖 | 只用 `node:` 内建（与现状一致——脚本均 `#!/usr/bin/env node` + `node:fs`/`node:path`） |
| N2 | 可迁移 | 机检判据不硬编码本仓 `docs/` 路径（`docRoot` / `checkConfig` 由被开发项目声明） |
| N3 | 可机判 | 判据项计数与 `checkConfig` 键一致（D3）——改 manifest 即改行为，计数同改 |

### 1.4 范围边界（本模块不做）

- 不做台账（M2 承接，台账一致性由 SQLite schema 判）；不做文档写作。
- 不保留 v1 的豁免族 / 六档映射 / V3 常量（明确砍）。
- 不做「判据语义」之外的检查（机检只判可机判项；语义判据归评审）。

## 2. 设计层

### 2.1 方案与理由

需求已裁定「单引擎 + 声明面」（架构 §2.2 M8 + 规格 ①）——本模块只做合并 + 砍的精确落点。

**核心方案（就机制本身说清为什么）**：

1. **单引擎入口 = `scripts/doc-check.mjs`**：合并现有三入口（`doc-anchors.mjs` + `check-doc-width.mjs` + `check-ledger.mjs`）为一入口——锚检查与行宽检查同一 `main` 驱动、同一 `formatReport` 报告。锚双引擎（V5 + VSC）合并为单一锚引擎（判据同源 = `DOC-DISCIPLINE.md` §4——v2 去向：归档退役 v1 档时判据源并入 v2 需求 §8.3 纪律→机检映射，不随 v1 档漂移；V5/VSC 的「两套判据」收敛为一套——砍双引擎）。
   行宽核心 + 共享豁免谓词（`isExecutableLine` / `inCodeSpan`）并入。台账一致性**不并入**——由 SQLite schema（M2）承接，`check-ledger*` 作废。
2. **声明面判据 = `checkConfig` 驱动**：`scanDirs`（源域）· `lineWidth`（行宽阈值）· `anchors.domain`（锚域）· `exemptions` / `anchors.exclude`（豁免）全部读 manifest——改 manifest 即改行为，不硬编码本仓 `docs/`。目录落点（`docRoot`）同样从声明面取。
3. **砍掉六族过度工程**：双引擎（V5/VSC 锚收敛）· 三套源域（各脚本自扫 → 单 `collectSourceDomain(checkConfig.scanDirs)`）· 三套行宽判据（三阈值 → 单 `checkConfig.lineWidth`）· 参照历史面豁免族（`REF_DOC_TREES`）· 六档并入映射（`MERGED_SCRIPTS`）· V3 历史常量（`v3Key`）——全部删除，不保留。
4. **D5 冻结窗口机检（可检面）**：新增可机判面——被审文档集（评审对象）在冻结窗口内的写操作可被检测：机检读 `activeBatch` → 批次档状态行判「评审在途」（读取契约见 §2.2），比对被审文件集窗口内零写入。**分工**：拦截主责在 M4 写权门禁（写时拦），M8 只做可检面（检后报红，不拦写）。判据语义 = 「评审在途（D5 窗口）内被审文件零写入」。

### 2.2 架构 / 接口 / 数据流契约

```text
门禁 ─► node scripts/doc-check.mjs [--root <仓根>] [--domain <产品域>]
  └─ main(cwd) ─► readManifest(cwd) ─► checkConfig（scanDirs / lineWidth / anchors.domain / exemptions）
       ├─ collectSourceDomain(域根, checkConfig.scanDirs)   ← doc-check-targets.mjs
       ├─ checkAnchors(domain, checkConfig)                     ← doc-check-anchors.mjs（单引擎）
       ├─ checkDocWidths(domain, checkConfig.lineWidth)         ← doc-check-width.mjs（单判据）
       ├─ checkFreezeWindow(activeBatch, 被审文件集)            ← doc-check.mjs（D5 可检面）
       └─ formatReport → 红 / 绿 + 退出码
```

**接口（合并后单引擎，全改造自现有 8 档）**：

- `doc-check.mjs`（入口 / 域驱动 / 报告 / D5 可检面）：`main(argv, {cwd, log, env})` + `formatReport` + `checkFreezeWindow(activeBatch, 被审文件集)`——由 `doc-anchors.mjs` + `check-doc-width.mjs` 入口合并 + 新增 D5 面。
- `doc-check-anchors.mjs`（单锚引擎）：`checkAnchors` / `extractAnchors` / `scanDocAnchors`——由 `doc-anchors-v5.mjs` + `doc-anchors-core.mjs` 双引擎收敛。
- `doc-check-width.mjs`（行宽核心 + 共享谓词）：`scanDomain` / `checkDocWidths` / `isTableRow` / `isExecutableLine` / `inCodeSpan` / `discoverDomains`——由 `check-doc-width-core.mjs` 继承，砍 V1/V2/V3 一致性族 + V3 历史常量。
- `doc-check-targets.mjs`（采集面）：`collectSourceDomain` / `collectCaseTitles` / `collectCodeTokens`——由 `doc-anchors-targets.mjs` 继承，源域读 `checkConfig.scanDirs`。

**D5 冻结窗口 · 在途状态读取契约**（F5 数据源）：

- **在途判据来源 = 批次档状态行**：机检经 manifest `activeBatch` → 批次档 §1「状态行」字段判在途——机器判据 = 状态行含「评审在途」；评审发起时置位、报告送达（digest 注入 / 回合尾 collect）或取消·中止时复位（与 D5 纪律「在途下界 = 报告送达或取消·中止」对齐，置位 / 复位落点归主 agent）。
- **不读 M6 槽文件**：token 槽签发于用户批准之后，冻结窗口在批准前已闭合——槽只表达「已批准」，无法表达「评审在途」。
- **被审文件集**：设计评审 = 本批设计档 + 批次档自身（D5：设计评审含批次档）；机检默认由 `activeBatch` 批次档推导（§1 条目所列设计档 + 批次档自身），调用方可显式传参覆盖。
- **检测面**：窗口起点 = 批次档 mtime（零哈希 / 零快照——主 agent 2026-09-17 裁定）；机检比对被审文件 mtime > 起点即违规。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `scripts/doc-check.mjs` | 0 | 新增 | +~180 | 新入口：`main` + `formatReport`（合并自 `doc-anchors.mjs` + `check-doc-width.mjs` 入口）+ `checkFreezeWindow`（D5 冻结窗口可检面——在途状态读批次档状态行，契约见 §2.2） |
| `scripts/doc-check-anchors.mjs` | 0 | 新增 | +~300（**目标 ≤300 行**——落点不越咨询层界） | 单锚引擎：`checkAnchors` / `extractAnchors` / `scanDocAnchors`（双引擎 V5 + VSC 收敛） |
| `scripts/doc-check-width.mjs` | 0 | 新增 | +~280 | 行宽核心 + 共享谓词：`scanDomain` / `checkDocWidths` / `isTableRow` / `isExecutableLine` / `inCodeSpan` / `discoverDomains` |
| `scripts/doc-check-targets.mjs` | 0 | 新增 | +~140 | 采集面：`collectSourceDomain` / `collectCaseTitles` / `collectCodeTokens`（源域读 `checkConfig.scanDirs`） |
| `scripts/doc-anchors.mjs` | 93 | 删除 | −93 | 入口并入 `doc-check.mjs` |
| `scripts/doc-anchors-v5.mjs` | 282 | 删除 | −282 | V5 锚引擎并入 `doc-check-anchors.mjs`；砍 `REF_DOC_TREES`（参照历史面豁免族） |
| `scripts/doc-anchors-core.mjs` | 240 | 删除 | −240 | VSC 锚引擎并入 `doc-check-anchors.mjs` |
| `scripts/doc-anchors-targets.mjs` | 143 | 删除 | −143 | 采集面并入 `doc-check-targets.mjs` |
| `scripts/check-doc-width.mjs` | 111 | 删除 | −111 | 入口并入 `doc-check.mjs`；砍 `MERGED_SCRIPTS`（六档并入映射） |
| `scripts/check-doc-width-core.mjs` | 287 | 删除 | −287 | 行宽核心并入 `doc-check-width.mjs`；砍 V1/V2/V3 一致性族 + `v3Key`（V3 历史常量） |
| `scripts/check-ledger.mjs` | 260 | 删除 | −260 | 台账 L4 定位判序 + 报告——作废（台账一致性由 SQLite schema 承接） |
| `scripts/check-ledger-core.mjs` | 152 | 删除 | −152 | 台账 `checkLedger` / `runCheck`——作废 |

（净变化：8 档 1568 行 → 4 档 ~900 行；`check-ledger*` 2 档为真砍，其余 6 档为合并 + 收敛 + 砍过度工程族。）

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M8-1 | 单引擎入口命名 `doc-check.mjs`（合并后新名） | 单引擎信号：原「doc-anchors / check-doc-width / check-ledger」三入口合并为「doc-check」一个，锚 + 行宽同一入口 |
| KD-M8-2 | 台账一致性由 SQLite schema 承接，`check-ledger*` 作废（不并入） | 规格 ②.1 + AC-M8-4：台账六态判据迁到 M2 的 schema 约束，脚本机检不再重复判台账形态 |
| KD-M8-3 | 双锚引擎（V5 + VSC）收敛为单锚引擎 | 规格 ②.3「砍双引擎」：两套判据同源（`DOC-DISCIPLINE.md` §4），收敛为一套，判据读 `checkConfig.anchors.domain` |
| KD-M8-4 | 六族过度工程整族删（非「保留一部分」） | 规格 ②.3 明确「砍」——不保留 v1 豁免族 / 六档映射 / V3 常量（③ 边界重申） |

### 2.5 与既有纪律冲突核对

- **机检脚本 = 工程工具面**：`scripts/**` 属工程工具面（父侧可直改、不需 designToken），但本模块是**判据语义**改动（单引擎 + 声明面 + 砍六族）——按「工程工具面直改三条硬约束」②「改判据语义的 ⇒ 仍走设计」，走本设计 + 评审 + eng-coder 实现。
- **`mirror-divergence.mjs` 不属本模块**：它是 M9（提示词单向生成）的对象，非 M8 机检引擎——两端接线表 M8 行「引擎在仓根 scripts/」不含它。
- **D5 冻结窗口机检的新增判据面**：读取评审在途状态（**批次档状态行**，读取契约见 §2.2——M6 槽不适用：token 签发在批准后、晚于窗口闭合）——判据语义 = 「被审文件集冻结窗口内零写入」，属可机判项；评审语义（该不该改）归评审。**分工**：拦截主责在 M4 写权门禁（写时拦），M8 只做可检面（检后报红）。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | 单引擎（无第二引擎入口） | AC-M8-1 | ✅ 检查 `scripts/` 脚本集——仅 `doc-check.mjs` 一个 `main` 入口 |
| AC-2 | 改 `checkConfig` → 机检行为随之变（声明面生效） | AC-M8-2 | ✅ 改 `lineWidth` 阈值 → 行宽检查结果变 |
| AC-3 | 全仓无硬编码本仓 `docs/` 路径于机检判据 | AC-M8-3 | ✅ grep 无匹配 |
| AC-4 | 台账一致性由 schema 承接（无 `check-ledger`） | AC-M8-4 | ✅ 文件不存在 |
| AC-5 | 锚检查 / 行宽检查可跑并出红绿 | AC-M8-5 | ✅ 跑脚本 → 红 / 绿 + 退出码 |
| AC-6 | 判据项计数与 `checkConfig` 键一致（D3） | AC-M8-6 | ✅ 计数比对 |
| AC-7 | 评审在途窗口内被审文档被写 → 机检红（D5 冻结窗口可检面） | ②.5（spec ④ 无对应 AC——上游缺口） | ✅ 状态行置「评审在途」+ 窗口内改被审档 → 期望红 |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：单引擎跑 | `node scripts/doc-check.mjs` | 锚 + 行宽同报告输出，退出码 0/1 |
| T2 | 正常：声明面生效 | manifest `checkConfig.lineWidth = 100` | 行宽检查按 100 判（原默认 300 不生效） |
| T3 | 正常：落点读声明面 | 改 `checkConfig.scanDirs` / `--domain` → 扫描该目录（不硬编码 `docs/`） |
| T4 | 边界：门禁传 `--domain` | `--domain thincoder-vscode` | 只扫该域（`checkConfig.scanDirs` 域内） |
| T5 | 边界：D5 冻结窗口 | 状态行置「评审在途」+ 窗口内写被审文档 | 机检报 D5 违规（冻结窗口内被审文件零写入）→ AC-7 |
| T6 | 错误：残留旧引擎 | `scripts/` 仍含 `check-ledger.mjs` / `check-doc-width.mjs` / `doc-anchors*.mjs` | 删除（AC-1 / AC-4） |
| T7 | 错误：硬编码路径 | 机检判据内出现本仓 `docs/` 字面 | grep 命中 → 违规（AC-3） |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 基础族 · eng-designer）：建档——M8 机检引擎模块设计；单引擎入口 `doc-check.mjs`（锚 + 行宽）；声明面判据读 `checkConfig`（scanDirs / lineWidth / anchors.domain / exemptions）+ `docRoot`；砍六族过度工程（双引擎 / 三套源域 / 三套行宽判据 / 参照历史面豁免族 / 六档并入映射 / V3 历史常量）；
  `check-ledger*` 作废（台账一致性由 SQLite schema 承接）；D5 冻结窗口机检；验收逐条回指 AC-M8-1..6。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 设计评审发现 #1 · eng-designer）：F5「D5 冻结窗口机检」补函数级落点——`doc-check.mjs` 增 `checkFreezeWindow(activeBatch, 被审文件集)`（§2.1#4 / §2.2 图与接口 / §2.3 行 +~50）；在途状态读取契约落 §2.2（判据来源 = 批次档状态行「评审在途」，M6 槽不适用）；§3.1 补 AC-7（回指 ②.5——spec ④ 无对应 AC，上游缺口）；分工句落 §2.1#4 与 §2.5（拦截主责 M4 门禁、M8 只做可检面）；§3.2 T5 输入列对齐契约。
