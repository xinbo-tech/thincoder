# 可移植性（PORTABILITY）· 需求

> 板块 = **可移植性**——工程模式机制在**任意用户项目**上的可用性（不假定项目形如本产品自研仓）。
> 本档 = 该机制的**需求层权威**（F1–F8 / N1–N4——编号承旧档，不改号）。
> 设计侧 = `docs/core/design/PORTABILITY.md`（分类权威 / 评审注入 / 端差——VSC 镜像面待并，见 `VSC-MIGRATION-INVENTORY.md §8B`）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 5**——`thincoder-vscode/docs/requirements/PORTABILITY.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名需求档（`thincoder-cli/docs/requirements/PORTABILITY.md`——需求组 FR10–FR15）**已并入（2026-09-15 · CLI 尾部真批）**——
> 接受方向表与 FR14 落实文本入 §5；(d) 类入 §6.1。
> 实测口径 = **as-of 2026-09-15 实核**（坐标 = 仓根相对路径 + `:行`，逐条复核）。

## 1. 总体定位

本仓（VS Code 扩展面）承载与对端同一套工程模式机制。用户在**任意项目**（任意语言 / 目录布局 / 文档约定 / 有无 git）里使用时，机制不得静默失效：

- 不得假定项目约定（文档布局 / 命名 / 构建 / 测试方式）；
- 凡需要项目约定处，由**项目自述 / 声明**提供；
- 缺失时**降级可见**——写进评审消息 / 工具反馈 / 索引提示，不得静默跳过。

范围边界：本档 §2–§3 承载本仓（VSC 面）需求；**需求组 FR10–FR15 的正文**现居 `docs/core/requirements/ENGINEERING-MODE.md` §2
（CLI 树旧档的历史归属，已随第 4 批迁入基准层——指针引用，不重述正文）；其**接受方向与 FR14 落实文本** = 本档 §5（CLI 侧同名档并入面）。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证——证据均为本仓实测） |
|---|---|---|
| **F1** | 分类判据单一权威 | `thincoder-vscode/src/conventions.mjs`（227 行）为唯一裁判实现（`classifyPath` `:76` / `isCodePath` `:85` / `isDocPath` `:91`）；全仓**零分散副本**（机判 = 组件式 / 锚定式正则副本、`docs/` 前缀判据副本 grep 零命中——判据式见 `PORTABILITY（VSC 侧）`） |
| **F2** | 项目约定可声明 | 声明文件 = `.thincoder/conventions.json`（`thincoder-vscode/src/conventions.mjs:34`）；`codePaths` 声明替换默认、`index.*Extensions` 追加入并集；损坏 / 类型错 → 回退默认 + 警告 + 不崩（`thincoder-vscode/src/conventions.mjs:189-220`） |
| **F3** | 嵌套布局不漏判 | 段匹配非锚定、大小写不敏感、`/` 与 `\` 通吃——`packages/foo/src/x.md` 判 code（分类优先级 = 代码段 > temp > 文档扩展名 > code） |
| **F4** | 评审注入降级可见 | 降级句常量四句在位（`thincoder-vscode/src/advisor/project-context.mjs:35` · `:39` · `:40` · `:41`）；缺 AGENTS.md / 地图 / 标准文档 / git 时各注入对应句、从不静默——`injectProjectGuide` `:91` · `injectDocumentMap` `:138` · `injectProjectStandards` `:176` · `thincoder-vscode/src/advisor/messages.mjs:115` |
| **F5** | 索引面可声明、未列入可见 | 扩展名表 + 声明并集（`thincoder-vscode/src/index-discover.mjs:17` · `:24` · `:125` · `:132`）；构建返回 `unlistedExts`（`thincoder-vscode/src/indexer.mjs:113`）+ 面板提示行（`thincoder-vscode/src/extension/panel-index.mjs:171`） |
| **F6** | 非 git 项目行为有定义 | 索引：无 git → 全量 walk + per-file mtime 回退（`thincoder-vscode/src/indexer.mjs:185-186` · `:241`）；评审：`NO_GIT_NOTICE` 降级句、评审照常 |
| **F7** | 门禁面同源 | 工程写门禁按声明分类判定（`thincoder-vscode/src/agent/tool-gates.mjs:89-91`）——不以 `src/` 硬编码 / `docs/` 前缀放行 |
| **F8** | 提示词面不假定本仓形态 | 提示词内指令性引用零本仓指涉（「本产品自研仓 =」标注形态除外——判据式见 `PORTABILITY（VSC 侧）`） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N1** | 零假阳 | 默认判据（`src` 为代码面）对既有项目行为与修复前一致——专项用例零误报 + 全量回归全绿 |
| **N2** | 降级不崩溃 | 声明损坏 / 不可读 → 默认 + `console.warn` + `logEvent`（不抛）；注入缺失 → 降级句（不抛） |
| **N3** | 全接线 | 消费点逐处换源（评审 / 门禁 / 索引 / 提示词四族）——「修一处漏三处」在用例面反证 |
| **N4** | 测试面 | 专项用例三档在位且快层全绿：`thincoder-vscode/test/portability-vsc-classification.test.mjs` · `portability-vsc-advisor-context.test.mjs` · `portability-vsc-index.test.mjs` |

## 4. 范围边界（不做）

- 不重述 FR10–FR15 正文（现居 `docs/core/requirements/ENGINEERING-MODE.md` §2——搬迁归位属父侧裁决项，见 §5.3）。
- 不做对端 `/eng` TUI 门禁的同位物（本端无该命令；差异已登记在案）。
- 不做文件系统沙箱 / 目录白名单（安全模型 = 信任模型 + 审批 + 快照，见 TOOLS 板块）。
- 不建本仓自用 `.thincoder/conventions.json`（默认判据对本仓即正确——开项留父侧酌定）。

## 5. CLI 侧补充需求面（FR10–FR15 接受方向 + FR14 落实文本 · 2026-09-15 并入）

> 来源 = `thincoder-cli/docs/requirements/PORTABILITY.md`（原地留参照）。FR10–FR15 正文 = `docs/core/requirements/ENGINEERING-MODE.md` §2：
> FR10 不得假定项目约定 · FR11 开启前提不得依赖已退役物 · FR12 代码 / 文档判据不得写死目录名 · FR13 纪律层不得强加产品形状 ·
> FR14 推进档位入需求 · FR15 非 git 项目行为有定义。实施台账 = `docs/TODO.md`「产品可移植性缺陷登记」节（父侧面）。

### 5.1 接受方向（每条一句）

| 需求 | 接受方向 |
|---|---|
| FR10 | 缺文档地图 / 标准文档时评审消息给**显式降级句**；索引对未列入的扩展名**可声明、可感知** |
| FR11 | `/eng` 开启**无前提**（不要求任何项目文件）；评审注入不再依赖已退役概念文件 |
| FR12 | 代码 / 文档判据 = **单一权威**（一个模块）+ 项目声明可诉 + 判据不漏判（嵌套布局不绕过门禁） |
| FR13 | 纪律层提示词不再要求建产品形状目录 / 维护产品流程文件 / 跑产品自带脚本；既有锚句保持 |
| FR14 | 推进档位契约**入需求**（落实文本见 §5.2） |
| FR15 | 非 git 行为逐面定义：索引走回退（可用）· 评审变更上下文给降级句 · 检查点明确报错（运行时文案 `Not a git repository — checkpoints unavailable`——`thincoder-core/tools/git-checkpoint.mjs:41`，as-of 2026-09-15 实核） |

### 5.2 FR14 落实文本（推进档位交互契约）

工程模式的推进档位（auto / manual）是**用户可感知的交互契约**：

- **两档**：**auto**（默认——每步完成即呈现、随即推进下一步）；**manual**（每步完成即呈现、**等待用户明确放行**再推进）；
- **切入 manual**：用户叫停 / 要亲自把关时切入——判据是**意图不是词表**（「停 / 先别 / 别急 / 等下 / 别自动」等表达均算）；
- **manual 下的行为**：继续回答与讨论、呈现当前结果；但**跨步动作停住**（spawn / 评审发起 / 推进落档 / digest 后动作都等用户点头）；
- **恢复 auto**：用户下一条明确指示（「可以 / 继续 / 开始」或具体下一步指令）即恢复；原状态不丢；
- **性质**：档位是**步与步之间的闸**，不是新状态；WAIT 前的讨论与呈现照常。

### 5.3 边界

- 本节不重述 FR10–FR15 正文（D2）；FR 正文是否自 `ENGINEERING-MODE.md` §2 **搬迁归位**入本档 = **父侧裁决项**——未裁决前以该档 §2 为权威正文。
- 缺陷条目分批面（P 编号清单与批次二 VSC 镜像面 VP-1–VP-12）= 批次材料——归批次档（不并，见 §6.1）。

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/PORTABILITY.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「状态：**现行**」 | 状态行 | 活档不挂状态行 |
| 旧档 F1 注「该判据面已退场（整删——删除记录 = `TESTING（VSC 侧）§8.1`）」 | 旧树内删除记录指针 | 旧树批次语境——判据面现状已由本档 F1 判定句承载 |
| 旧档 §5 变更记录（2026-09-12 建档行） | 建档流水 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/requirements/PORTABILITY.md`（2026-09-15 CLI 尾部真批并入——接受方向 / FR14 落实文本入 §5）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注（板块行 + 「本批（2026-09-11）确立」批序 + 实施台账行号 as-of 注） | 批次语境 | 现行口径已入 §1 / §5；台账 = 父侧面 |
| 旧档 §2 引言行（「判定句全文 = 设计档 §7 验收标准表」） | 旧树设计档节号指针 | 旧树指针形态——设计侧权威 = `docs/core/design/PORTABILITY.md` |
| 旧档 §4 缺陷条目覆盖面（P1–P10 / P14 / P15 / P25 与后续批清单）+ §5 批次二 VSC 镜像面范围（VP-1–VP-12） | 分批执行材料 | 一次性批次材料——归批次档；VSC 镜像面结论已由本档 §2–§3 承载（P14 无对位物差异已登记 §4） |
| 旧档 §3 尾注（「档位的运行面细节（提示词槽位 / digest 机器信号 / User stop 处理）已在纪律层提示词中生效；本条需求的确立 = 把该契约登记进需求层」） | 建档语境注 | 批次语境——落实文本已入 §5.2；提示词槽位 = 产品代码面（本档不逐字） |
| 旧档变更记录（2026-09-11 三条） | 建档 / 修正轮流水 | 本档自有变更记录 |

### 6.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档 F1 / F8 的设计档 AC 锚（`docs/design/PORTABILITY.md` AC-V01 / AC-V07） | 机判式正文 | VSC 镜像面设计内容**未并**——目标 = `docs/core/design/PORTABILITY.md`（§8B-5，父侧另批）；本档以 `PORTABILITY（VSC 侧）` 参照 |
| CLI 侧同名需求档（`thincoder-cli/docs/requirements/PORTABILITY.md`） | CLI 产品需求正文（FR10–FR15） | **已并入（2026-09-15 CLI 尾部真批）**——接受方向 + FR14 落实文本入 §5；(d) 类入 §6.1 |

## 7. 体量与拆分规划（R24a）

**实测行数**：本档 **约 120 行**（as-of 2026-09-15 CLI 尾部真批并入后实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/requirements/PORTABILITY.md` 逐节对账并入——
  **缺口并入**：FR10–FR15 接受方向表 + FR14 落实文本（推进档位交互契约——需求层全文此前仅 CLI 旧档持有）入新增 §5；
  既有「不并项」「体量」两节顺延为 §6 / §7；FR15 检查点文案坐标实核（`thincoder-core/tools/git-checkpoint.mjs:41`）；
  §1 / §4 的对端「未迁」表述收正；(d) 类（分批执行材料 / 批次二镜像面 / 变更流水）入 §6.1。旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 5**）：建档——`thincoder-vscode/docs/requirements/PORTABILITY.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标全量改写为仓根相对路径并逐条实核（`index-discover.mjs` `:126`/`:135` → 现 `:125`/`:132`，按现状收正）；
  设计档 AC 锚改 `PORTABILITY（VSC 侧）` 参照（§6.2——原 §5.2，CLI 尾部真批节号顺延）。
