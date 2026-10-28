# 结构债评估与清理路线（STRUCTURE-DEBT）

> 板块 = **结构债**（横切——跨多板块的架构 / 文档 / 状态债评估与清理）。
> 需求侧 = `docs/core/requirements/STRUCTURE-DEBT.md`。

## 1. 定位与口径

**结构债**（屎山度）= 架构 / 状态归属 / 文档格式 / 跨端复制四类**跨板块**的欠账。其特征是**病痛与治疗时机错开**：平时无症状、撞上才暴露——靠文档显式追踪防止「挂账不处理」。

- **本档是总账 + 入口路由**，不承载单批设计正文——单批设计落各自板块档或批专属设计档。
- **每批独立立项**：设计 → 评审 → 实现（工程模式四步），不因「债」字跳过任一步。
- **已消解项不计债**：消解即从 §2 移入 §3，并留一条消解证据（防回潮）。

## 2. 现行债

| # | 债 | 现状判 | 证据 |
|---|---|---|---|
| **#3** | **`_` 状态字段摊平 + 手写生命周期清单**：agent 对象的运行态字段无 schema / 无封装，复位与继承靠**手写键清单**；新增或漏删字段即状态泄漏 | **现行** | 继承 = 手写键清单：`thincoder-core/agent/run-start.mjs:73-76`（`_inheritedGuard` 逐键回灌）；复位 = 逐字段块：`thincoder-core/agent/run-start.mjs:66-91` |
| **#4** | **eng-token 语义跨端重复**：核内已单点化，VSC 端无同名实现——自持槽语义与校验副本 | **跨端仍分叉**（CLI / 核侧已消解） | 核内单点 = `thincoder-core/token-ttl.mjs`（286 行）；VSC 侧消费面 = `thincoder-vscode/src/agent/tool-gates.mjs`（核 `design-token.mjs` 消费面） |
| **#8** | **跨仓复制漂移**（架构伞项）：state / tools / prompts / advisor 层双端整片存在 | **收敛中**（核统一批推进） | 「一个核 + 两个薄壳」= `docs/core/design/CORE-UNIFICATION.md`；跨端剩余差面登记 = `docs/vsc/design/VSC-MIGRATION.md` |
| **#9** | **扫描面四档越 300 软线**（职责边界待评估） | **部分消解** | 实核行数：`thincoder-core/memory/schema.mjs` **453** ∥ `thincoder-core/memory/core.mjs` **301**——照挂；`thincoder-core/memory/docs.mjs` **222**（拆 `thincoder-core/memory/memory-tool.mjs`）∥ `thincoder-core/memory/code-sync.mjs` **258**（拆 `thincoder-core/memory/code-search.mjs` / `thincoder-core/memory/file-list.mjs`）——已消解；复评触发 = 该面下次触碰 |


**注**：`#6` 的 VSC 侧对位面 = 核 `thincoder-core/tools/{file.mjs, patch.mjs, search.mjs}`（已归位）；该面归 VSC 轮，不计入核面债。

## 3. 已消解（勿当债）

| # | 原债 | 消解证据 |
|---|---|---|
| #1 | 设计文档单行整节坏格式 | 宽度机检 0 行超限（基准层 + 两产品文档面） |
| #2 | 双端 async 状态容器分叉（双查询 / 双删 / 容器名分叉） | 单载体 + 单点结算：`thincoder-core/agent-tools/async-settle.mjs:189`（`settleAsyncEntry`）；核内 `history?._X ?? agent._X` 双查询 grep 零命中 |
| #5 | CLI 单档 `system.mjs` 超 500 行（4 工具合装——迁移前形态） | 该档已不存在；拆为 `thincoder-core/tools/bash.mjs`（269 行）· `thincoder-core/tools/search.mjs`（249 行）· `thincoder-core/tools/question.mjs`（27 行） |
| #6 | 工具寄生 / 名不符实（CLI 侧） | `question` 已独立成档：`thincoder-core/tools/question.mjs`（27 行，不再寄生 git 工具档） |
| #7 | async settle 逻辑重复（四族同构逻辑副本） | 单点 helper 四族同调：`thincoder-core/agent-tools/async-settle.mjs:189`（消费方 = `advisor-async.mjs` · `consult.mjs` · `escalate-async.mjs` · `subagent-run.mjs`） |

## 4. 清理纪律

1. **每批独立走工程模式**：设计（受影响文件：源 / 测试档现量判定尺寸档位、结论落档）→ 评审 → 实现 → 验证；本档只路由。
2. **撞到就修**：改动撞到**状态归属错误或结构错误** ⇒ 依纪律层「铁律②」（`docs/core/requirements/ENGINEERING-MODE-V2.md` §8 五条铁律；提示词面 = `thincoder-core/prompts/discipline-engineering.md`）走流程修——本面**清理时点 = 撞到那一刻（当场、不往后排）**。
3. **消解即移档**：消解项从 §2 移入 §3，**留证据行**（档 / 行号或机检读数）——防「已消解」被当作债重复登记（防回潮）。
4. **跨端债的落点**：跨端（CLI ↔ VSC）债的搬运与核验归**核统一批**（`docs/core/design/CORE-UNIFICATION.md`）；本档只登记条目与状态，不代写核统一设计。
