# 评审 · 会诊 · 飞刀（CONSULTATION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| advisor 主面 | `thincoder-cli/src/advisor.mjs` + `src/advisor/*`（`run` · `loop` · `messages` · `compaction` · `project-context` · `repos` · `citations` · `history` · `truncate` · `convergence`） | `thincoder-vscode/src/advisor/main.mjs` + `src/advisor/*`（拆档：`provider.mjs` · `tools.mjs`） |
| 工具面 | `src/agent-tools/advisor.mjs` · `src/agent-tools/consult.mjs` · `src/agent-tools/advisor-settle.mjs` · `src/agent-tools/review-streak.mjs` · `subagent-panel.mjs` | 同名 / 拆分档（`subagent-escalate-async` 等） |
| 飞刀（升级） | `src/agent-tools/escalate-async.mjs` | `src/agent-tools/subagent-escalate*.mjs` |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 逐字节同组（原 §2.5（一）——组陈述（逐字））

> 逐字节相同 ⇒ 无分叉面——前提校验不适用、不命中 A11（须用户裁 = —）；每行归属与四列逐行登记（列值 = 本组陈述）。

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `advisor/history.mjs` | 同路径 | 1.0000 · 同 | ① | 进核（`thincoder-core/advisor/history.mjs`） | 取任一侧、逐字节随迁 | —（逐字节同，无分叉） | — | S0a（首批建核） |

### 2.2 非逐字节同组（原 §2.5（二）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 40 | `advisor/convergence.mjs` | 同路径 | 0.9429 · 异 | ① | 取一侧 + 注释订正（非语义） | 分叉 = 注释中的端内模块名差异；无失效前提（① 直取） | — | S0a（首批建核） |
| 41 | `advisor/truncate.mjs` | 同路径 | 0.9600 · 异 | ① | 取一侧 + 指针订正（非语义） | 分叉 = 注释指针写法；指针已过期（两侧均不指现状）；无失效前提（①） | — | S0a（首批建核） |

**四要素明细（原 §2.5（二）明细块 · 逐字）**

- **#40 `advisor/convergence.mjs`**（同路径 · j 0.9429 · sha `f3199534111e` / `6f9cf6b7bcff` · 80 / 80 行）
  - 左端读数（CLI）：差异 = 2 行 JSDoc 注释引用端内模块名 `advisor.mjs`（`buildAdvisorFollowUp` 所在模块与 import cycle 描述）；其余逐字相同。
  - 右端读数（VSC）：同 2 行注释引用 `main.mjs`（端内 advisor 主模块名）；其余逐字相同。
  - 建议归一形态：取一侧 + 注释端名提及按核内结构订正（非语义改动）。
  - 影响面：无——差异仅注释，不属可观察行为 / 对外契约 / 语义分叉（须用户裁 = —）；测试面无涉。
- **#41 `advisor/truncate.mjs`**（同路径 · j 0.9600 · sha `a2d90d320ac9` / `a1d1621af6b2` · 57 / 57 行）
  - 左端读数（CLI）：差异 = 1 行注释中规格档指针 `DUAL-END-TRUNCATION.md`。
  - 右端读数（VSC）：同 1 行作完整目录前缀式指针（`docs/design/` + 档名——对照左端的短式）；**指针现状** = 该规格档已归档（CLI 侧 `_archive/`；VSC 侧未见同名档）⇒ 两侧指针均不指现状。
  - 建议归一形态：取一侧 + 指针按仓树现状订正（或去指针；非语义）。
  - 影响面：无（仅注释；须用户裁 = —）。

### 2.3 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 93 | `agent-tools/consult.mjs` | 同路径 | 0.2207 · 异 | ② | 进核 | 融合：取 CLI 装配（子运行器 = `runAgent(agent, …)`）+ VSC 的 `specForModel` / `extraTools` 面归位 | 分叉 ＝ 载体（agent vs history）与子运行器装配；机制骨架（pending 单容器 + 全 settle 一次注入 + 零评判 + `consult_stop` 不注入）两端相同 | — | S1（建核补齐） |
| 95 | `agent-tools/advisor.mjs` | 同路径 | 0.1499 · 异 | ② | 进核 | 融合：取 CLI（异步判定 + 拆分面）+ VSC 的 `depth` 显式校验并入 | 分叉 ＝ `depth` 缺省读法（CLI 缺省走同步 / VSC 当 0 走异步——仅影响非 dispatch 直调路径）+ 文件职责切分 | — | S1（建核补齐） |
| 104 | `advisor/citations.mjs` | 同路径 | 0.8175 · 异 | ② | 进核 | 融合：取一侧（仅注释契约编号不同） | 分叉 ＝ 头注释出处（CLI 第 11 批 §14.5 / VSC 第 12 批 F21）；判据与输出同形 | — | S1（建核补齐） |
| 105 | `advisor/project-context.mjs` | 同路径 | 0.6494 · 异 | ② | 进核 | 融合：取一侧 + 取模型窗口的字段名归一（`agent.provider` / `agent._provider`） | 分叉 ＝ 取模型上下文窗口的字段名（CLI `src/advisor/project-context.mjs:113` / VSC `:117`）+ 注释；预算与降级文案逐字同 | — | S1（建核补齐） |
| 106 | `advisor/repos.mjs` | 同路径 | 0.6435 · 异 | ② | 进核 | 融合：取一侧 + `isDocOnlyChange` 语义归一（临时文件算不算「只文档」） | 分叉 ＝ 判定语义不同（CLI 非代码即「只文档」/ VSC 要求「非代码且是文档」）；**两端当前均无消费方** ⇒ 潜伏差异，归一时取一侧并登记 | — | S1（建核补齐） |
| 107 | `advisor/compaction.mjs` | 同路径 | 0.5665 · 异 | ② | 进核 | 融合：取一侧（空响应标记字面归一） | 分叉 ＝ 空响应标记字面（CLI `Advisor: empty response` / VSC `Advisor: (empty response`）+ VSC 多 `incompleteNotice`；数值与提醒文案族同 | — | S1（建核补齐） |
| 108 | `advisor/messages.mjs` | 同路径 | 0.4965 · 异 | ② | 进核 | 融合：正文取一侧（逐字相同）+ 装配管道（声明注入点 / 轮次来源 / 相对路径前缀守卫）按核内结构归一 | 分叉 ＝ 装配管道（CLI 正文内插对象声明 + 全局 `_advisorRound` / VSC 由 `run.mjs` 注入 + 评审实例 `rv`）；前提（评审正文同源）仍成立 | — | S1（建核补齐） |
| 109 | `advisor/loop.mjs` | 同路径 | 0.3889 · 异 | ② | 进核 | 融合：取 CLI 限额族 + 工具集取并集（`code_search` 恒在）+ 进度行按端注入（④ 段） | 分叉 ＝ 评审工具集（CLI 需 `agent.memory` 才挂 `code_search` `src/advisor/loop.mjs:37-46` / VSC 恒在 `src/advisor/tools.mjs:29-37`）+ 进度行实现；墙 / 轮帽 / 预算同 | — | S1（建核补齐） |
| 110 | `advisor/run.mjs` | 同路径 | 0.3589 · 异 | ③ | 进核 | 取并集：以 CLI 为准（含设计评审连续失败止损护栏 `src/advisor/run.mjs:15-17,59-75,199-204`）+ VSC 的评审实例上下文并入 | 分叉 ＝ CLI 多一道止损闸（VSC 全仓零 `review-streak` 命中）+ 轮次载体（全局字段 vs 实例 `rv`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |

### 2.4 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 159 | `src/agent-tools/review-streak.mjs` + `subagent-panel.mjs` ↔ 核内（VSC 零 `review-streak` / `panel` 动作） | ③ | 以 CLI 为准（评审连续失败止损 / `panel` 动作）——VSC 接线后生效 | 分叉 ＝ VSC 未实现（零命中）；**承 §2.5 #110（止损）/ #99（panel 端特有段）** | —（承 #110 / #99） | S1（建核补齐） |
| 160 | `src/advisor.mjs` ↔ `src/advisor/main.mjs` | ② | 融合：取一侧（advisor 提示词选择 / 跟进构建 / 会话装配） | 分叉 ＝ 档名与目录（VSC 头注自述「VS Code port of thincoder CLI src/advisor.mjs」`:3`）⇒ 前提成立 | — | S1（建核补齐） |
| 161 | （CLI 侧内联于 `advisor/run.mjs`）↔ `src/advisor/provider.mjs` + `advisor/tools.mjs` | ② | 融合：评审 provider 解析 / 工具集按核内结构归位 | 分叉 ＝ 拆档（VSC 拆 2 档）；工具集差异（`code_search` 挂载条件）**已由 §2.5 #109 裁决** ⇒ 前提成立 | —（承 #109） | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A24 | `advisor/run.mjs`（#110） | ① | 有**止损护栏**：同一批设计文档连续失败达阈值即拒发并给失败尝试表（`:15-17,59-75,199-204`） | **无该护栏**（VSC 全仓零 `review-streak`）⇒ 一次次重复发起、烧配额 | 取并集：以 CLI 为准（含止损护栏）+ VSC 的评审实例上下文并入 | ① VSC 侧评审连续失败时从此会止损并给出失败清单（现状是重复失败） | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**（对外事件面的兼容策略模板住 `CORE-UNIFICATION.md` §2.12.1「事件语义」类）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/agent-tools/panel-blocks.mjs`——#159 · #180 收正）。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #1 / #40 / #41 / #93 / #95 / #104–#110 / #159–#161 + 四要素明细 · §2.5.1 A24）；**语义零改**，行号沿用原编号。
- 2026-09-14（S1 收口轮）：§5 补**核内落点行数**指针（`agent-tools/panel-blocks.mjs`——#159 · #180 收正）。
