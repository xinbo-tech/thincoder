# Normal 模式（NORMAL-MODE）· 需求

> 板块 = **提示词装配层**（槽位模型 + 场景装配矩阵——机制在位）。
> 本档 = 该机制的**需求层权威**（F-NM1–F-NM6 / N-NM1–N-NM4 判定句）。
> 设计侧 = `docs/core/design/PROMPT-SYSTEM.md`（子系统面清单与装配矩阵——本档不复制，D2）；
> 镜像面档 `VSC-PROMPTS` **原地保留不动**（既有裁定——`docs/vsc/design/VSC-MIGRATION.md` §7）。
> 相邻需求档 = `docs/core/requirements/PROMPT-SYSTEM.md`（提示词并入核）· `docs/core/requirements/ENGINEERING-MODE.md`（另一模式）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 4**——`thincoder-vscode/docs/requirements/NORMAL-MODE.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名需求档（`thincoder-cli/docs/requirements/NORMAL-MODE.md`）**未迁**。
> 实测口径 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 总体定位

Normal 模式 = 默认（非工程模式）会话的提示词基底。装配层把**人格 / 公共 / 纪律**三类槽位按场景组装为系统提示——
人格定义「我是谁」，公共层给跨模式协作基础，纪律层给该模式的干活规则；项目层（`AGENTS.md` / skills）作为尾部追加。
同一机制只在一处装配（表驱动、固定序），避免多路拼装漂移。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） |
|---|---|---|
| **F-NM1** | 场景 → 槽位**表驱动**装配 | 装配唯一入口 `assemblePrompt(scenario)`（`thincoder-vscode/src/prompt-overlays.mjs:72`）；场景与槽位文件的映射以 `SCENARIO_SLOT_FILES` 一张表为唯一权威（`:49`） |
| **F-NM2** | `normal` 场景构成 | `normal` = 人格 + 公共 + 纪律三档（`:51`）——固定序拼接（人格 → 公共 → 纪律） |
| **F-NM3** | 子场景复用 | `explore` / `coder` / `plan` / `eng-coder` / `eng-designer` 子场景各有角色人格档 + 公共 + 对应纪律层（`:50`–`:56`）——同槽位复用、变体差异归人格层 |
| **F-NM4** | 特殊模块旁路 | 会诊（consult）走自含基底，不入主装配链（表内 `consult` 为 `null`——`:57`；`:74` 直出该基底） |
| **F-NM5** | 槽位缺失**可见降级** | 槽位档缺失 ⇒ 该槽位跳过 + 醒目警告（`slotWarning`——`:61`）——**层间隔离**：不从他槽位回退 |
| **F-NM6** | 内容**字节稳定** | 同一场景每次装配结果字节稳定（槽位内容模块级加载一次——`:23`–`:34`；固定序；装配期不引入时间戳类变量） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N-NM1** | 单一权威源 | 槽位文件路径字符串以装配表为唯一权威；装配链序固定（人格 → 公共 → 纪律 → 项目层尾部） |
| **N-NM2** | 正本 ↔ 落地档对位 | 运行期落地档 `thincoder-core/prompts/`（15 档）↔ 中文设计档正本 `docs/core/design/prompts/`（15 档）逐档对位（P4）；各实现面语义同源、原文自持 |
| **N-NM3** | 隔离性 | 槽位间不回退（缺失 = 跳过 + 警告）——防「看似正常」的静默内容降级 |
| **N-NM4** | 可测试 | 装配结果、缺失降级、场景映射由用例断言（含字节稳定性断言） |

## 4. 范围边界（不做）

- 不定义各槽位档的内容语义（各槽位档自持；本档只管装配）。
- 不新增第四类槽位，不改固定序。
- 不做运行期热替换（槽位内容模块级加载一次）。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/NORMAL-MODE.md`（VSC 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「定位」（装配单源 = `src/prompt-overlays.mjs`（84 行）· 槽位内容 = `src/prompts/` 15 档） | 时点行数与迁移前路径 | 时点坐标——现行坐标入各 F 判定句 |
| 旧档「设计面：`docs/design/VSC-PROMPTS.md`（双源…）」行 | 镜像面档指针（该面已裁定原地保留不动） | 归属已定（`docs/vsc/design/VSC-MIGRATION.md` §7）——本档不重述 |
| 旧档变更记录（2026-09-12 建档行） | 建档流水 | 本档自有变更记录 |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档 N2「双源对位」的镜像面句 | 中文权威 ↔ 英文落地的双源叙述 | 正本已归 `docs/core/design/prompts/`；口径归 `docs/core/requirements/PROMPT-SYSTEM.md`（本档只留 N-NM2 对位） |
| 「LEDGER-SELF-CONTAINED 建档批」批序注 | 建档批序 | 一次性材料——归批次档 |
| CLI 侧同名需求档未迁面 | CLI 产品需求正文 | 触发 = CLI 迁移轮 |

## 6. 体量与拆分规划（R24a）

**实测行数**：本档 **73 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 批 4**）：建档——`thincoder-vscode/docs/requirements/NORMAL-MODE.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；判定句坐标按现状实核改写（`thincoder-vscode/src/prompt-overlays.mjs` 行号逐条实核）；
  提示词双源与并入核口径指向 `PROMPT-SYSTEM` 两面（D2 单一权威源）。
