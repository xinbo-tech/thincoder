# 结构债评估与清理路线（STRUCTURE-DEBT）

> 板块 = **结构债**（横切——跨多板块的架构 / 文档 / 状态债评估与清理）。
> 需求侧 = `thincoder-cli/docs/requirements/STRUCTURE-DEBT.md`（CLI 侧**未迁**——后续批并入 `docs/core/requirements/`）。
> 建档：2026-09-15（**B 式迁移轮 · 第 2 批**——`thincoder-cli/docs/design/STRUCTURE-DEBT.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与口径

**结构债**（屎山度）= 架构 / 状态归属 / 文档格式 / 跨端复制四类**跨板块**的欠账。其特征是**病痛与治疗时机错开**：平时无症状、撞上才暴露——靠文档显式追踪防止「挂账不处理」。

- **本档是总账 + 入口路由**，不承载单批设计正文——单批设计落各自板块档或批专属设计档。
- **每批独立立项**：设计 → 评审 → 实现（工程模式四步），不因「债」字跳过任一步。
- **已消解项不计债**：消解即从 §2 移入 §3，并留一条消解证据（防回潮）。

## 2. 现行债（as-of 2026-09-15 实核）

| # | 债 | 现状判 | 证据（实核） |
|---|---|---|---|
| **#3** | **`_` 状态字段摊平 + 手写生命周期清单**：agent 对象的运行态字段无 schema / 无封装，复位与继承靠**手写键清单**；新增或漏删字段即状态泄漏 | **现行** | 继承 = 手写键清单：`thincoder-core/agent.mjs:147`（`_inheritedGuard` 逐键回灌）；复位 = 逐字段块：`thincoder-core/agent.mjs:142`–`:159` |
| **#4** | **eng-token 语义跨端重复**：核内已单点化，VSC 端无同名实现——自持槽语义与校验副本 | **跨端仍分叉**（CLI / 核侧已消解） | 核内单点 = `thincoder-core/token-ttl.mjs`（286 行）；VSC 侧自持面 = `thincoder-vscode/src/agent-tools/subagent-spawn-gate.mjs` |
| **#8** | **跨仓复制漂移**（架构伞项）：state / tools / prompts / advisor 层双端整片存在 | **收敛中**（核统一批推进） | 「一个核 + 两个薄壳」= `docs/core/design/CORE-UNIFICATION.md`；跨端剩余差面登记 = `docs/vsc/design/VSC-MIGRATION.md` |

**注**：`#6` 的 VSC 侧对位面仍开放——`thincoder-vscode/src/tools/more-file.mjs`（多工具合装）；**CLI / 核侧已归位**（见 §3）。该面归 VSC 轮，不计入核面债。（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/{file.mjs, patch.mjs, search.mjs}`）

## 3. 已消解（勿当债）

| # | 原债 | 消解证据（实核） |
|---|---|---|
| #1 | 设计文档单行整节坏格式 | 宽度机检 0 行超限（基准层 + 两产品文档面）；唯一超宽面 = `docs/batches/2026-09-15-vsc-doc-migration.md` 3 行（**他实例在写**，非本板块面） |
| #2 | 双端 async 状态容器分叉（双查询 / 双删 / 容器名分叉） | 单载体 + 单点结算：`thincoder-core/agent-tools/async-settle.mjs:189`（`settleAsyncEntry`）；核内 `history?._X ?? agent._X` 双查询 grep 零命中 |
| #5 | CLI 单档 `system.mjs` 超 500 行（4 工具合装——迁移前形态） | 该档已不存在；拆为 `thincoder-core/tools/bash.mjs`（269 行）· `thincoder-core/tools/search.mjs`（249 行）· `thincoder-core/tools/question.mjs`（27 行） |
| #6 | 工具寄生 / 名不符实（CLI 侧） | `question` 已独立成档：`thincoder-core/tools/question.mjs`（27 行，不再寄生 git 工具档） |
| #7 | async settle 逻辑重复（四族同构逻辑副本） | 单点 helper 四族同调：`thincoder-core/agent-tools/async-settle.mjs:189`（消费方 = `advisor-async.mjs` · `consult.mjs` · `escalate-async.mjs` · `subagent-run.mjs`） |
| —— | 文档格式债批（批 A）与净剩余清理 | 已执行完毕（旧档 §8 的 A1–A8 / V1–V5 计划）；现行宽度机检读数见 #1 行 |

## 4. 清理纪律

1. **每批独立走工程模式**：设计（含受影响文件与行数标注）→ 评审 → 实现 → 验证；本档只路由。
2. **撞到就修**：改动撞到状态归属错误或结构错误，当场就地修正——不叠最小补丁掩盖症状。
3. **消解即移档**：消解项从 §2 移入 §3，**留证据行**（档 / 行号或机检读数）——防「已消解」被当作债重复登记（防回潮）。
4. **跨端债的落点**：跨端（CLI ↔ VSC）债的搬运与核验归**核统一批**（`docs/core/design/CORE-UNIFICATION.md`）；本档只登记条目与状态，不代写核统一设计。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/STRUCTURE-DEBT.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §2 评估方法 | 2026-09-07 fresh scan 的扫描口径（字节探针 / offset 探针 / 全树 grep / 排除树清单） | 一次性勘察方法——不是现行机制 |
| 旧档 §3 前身评估 | 第一次屎山度扫描（7 项 proxy 严重度 + 原始 Top-8 + 消解追溯表） | 历史评估快照——两套清单的差异已由 §2 / §3 的现行判取代 |
| 旧档 §6 源码 >500 行清单 | as-of 2026-09-07 的文件行数清单与 advisory 带 | as-of 行数证据——超限判据现由项目代码结构判据（各档 ≤300 目标 / ≤500 硬限）承载，逐批按实核复核 |
| 旧档 §7 分批清理路线表（批 A–F） | 批次编排与建议时序 | 一次性排期材料——清理由 §4 纪律 + 各批独立立项承载 |
| 旧档 §8 批 A 文档格式债清理计划 | 子批清单（CLI A1–A8 / VSC V1–V5）+ 人类可读验收判据 + 处置分类 + 执行核销 | 已执行完毕的批次计划——判据本体已入文档规范面 |
| 旧档 §5 内各债条的 as-of 行数与文件坐标 | 迁移前路径（`src/**` / 旧档址） | 迁移前仓形态——§2 / §3 已按现状路径逐条实核 |
| 旧档档头状态行（评估 fresh scan 完成 / 清理按分批推进）+ 变更记录 | 时点状态与逐批流水 | 批次语境——本档自有变更记录 |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| VSC 树的对位债面 | `thincoder-vscode/docs/design/**` 内同类债条目 | 产品面——VSC 轮（`docs/vsc/`） |
| 各债项的单批设计正文 | 逐批修法细节 | 各自板块档 / 批专属设计档（本档只路由） |
| 已立项的跨端统一设计 | 核统一批设计与验收 | `docs/core/design/CORE-UNIFICATION.md`（并入既有活档，不复制） |

## 6. 体量与拆分规划（R24a）

**实测行数**：本档 **78 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/design/STRUCTURE-DEBT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 择**现行债账**重建：§2 现行债（逐条实核现状判 + 证据）· §3 已消解（留证据行防回潮）· §4 清理纪律；
  ② 旧档 §2 评估方法 · §3 前身评估 · §6 as-of 行数清单 · §7 分批路线 · §8 批 A 计划 · 状态行与变更流水 → §5 逐项登记不并；
  ③ 全部坐标改现状路径并经实核（`thincoder-core/**` · 两产品 `src/**`）；④ 新增 §6 体量与拆分规划。
- 2026-09-15（**S2 W14 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：§2 注行（`#6` VSC 侧对位面）补迁核注——VSC 自持 `more-file.mjs`（多工具合装面）已删，现体 = 核 `thincoder-core/tools/{file.mjs, patch.mjs, search.mjs}`；机制条文零改。
