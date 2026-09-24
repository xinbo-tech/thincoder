# 评审 · 会诊 · 飞刀（CONSULTATION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| advisor 主面 | `thincoder-cli/src/advisor.mjs` + `src/advisor/*`（`run` · `loop` · `messages` · `compaction` · `project-context` · `repos` · `citations` · `history` · `truncate` · `convergence`） | `thincoder-vscode/src/advisor/main.mjs` + `src/advisor/*`（拆档：`advisor/provider.mjs` · `advisor/tools.mjs`）——**VSC 侧已退役**（W12 删除集；现体 = 核 `thincoder-core/advisor/**` + `thincoder-core/agent-tools/consult.mjs`） （迁移期引文） |
| 工具面 | `thincoder-core/agent-tools/advisor.mjs` · `src/agent-tools/consult.mjs` · `src/agent-tools/advisor-settle.mjs` · `src/agent-tools/review-facts.mjs`（改名自 review-streak） · `thincoder-core/agent-tools/subagent-panel.mjs` | 同名 / 拆分档（`subagent-escalate-async` 等） |
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
| 95 | `thincoder-core/agent-tools/advisor.mjs` | 同路径 | 0.1499 · 异 | ② | 进核 | 融合：取 CLI（异步判定 + 拆分面）+ VSC 的 `depth` 显式校验并入 | 分叉 ＝ `depth` 缺省读法（CLI 缺省走同步 / VSC 当 0 走异步——仅影响非 dispatch 直调路径）+ 文件职责切分 | — | S1（建核补齐） |
| 104 | `advisor/citations.mjs` | 同路径 | 0.8175 · 异 | ② | 进核 | 融合：取一侧（仅注释契约编号不同） | 分叉 ＝ 头注释出处（CLI 第 11 批 §14.5 / VSC 第 12 批 F21）；判据与输出同形 | — | S1（建核补齐） |
| 105 | `advisor/project-context.mjs` | 同路径 | 0.6494 · 异 | ② | 进核 | 融合：取一侧 + 取模型窗口的字段名归一（`agent.provider` / `agent._provider`） | 分叉 ＝ 取模型上下文窗口的字段名（CLI `src/advisor/project-context.mjs:113` / VSC `:117`）+ 注释；预算与降级文案逐字同 | — | S1（建核补齐） |
| 106 | `advisor/repos.mjs` | 同路径 | 0.6435 · 异 | ② | 进核 | 融合：取一侧 + `isDocOnlyChange` 语义归一（临时文件算不算「只文档」） | 分叉 ＝ 判定语义不同（CLI 非代码即「只文档」/ VSC 要求「非代码且是文档」）；**两端当前均无消费方** ⇒ 潜伏差异，归一时取一侧并登记 | — | S1（建核补齐） |
| 107 | `advisor/compaction.mjs` | 同路径 | 0.5665 · 异 | ② | 进核 | 融合：取一侧（空响应标记字面归一） | 分叉 ＝ 空响应标记字面（CLI `Advisor: empty response` / VSC `Advisor: (empty response`）+ VSC 多 `incompleteNotice`；数值与提醒文案族同 | — | S1（建核补齐） |
| 108 | `advisor/messages.mjs` | 同路径 | 0.4965 · 异 | ② | 进核 | 融合：正文取一侧（逐字相同）+ 装配管道（声明注入点 / 轮次来源 / 相对路径前缀守卫）按核内结构归一 | 分叉 ＝ 装配管道（CLI 正文内插对象声明 + 全局 `_advisorRound` / VSC 由 `run.mjs` 注入 + 评审实例 `rv`）；前提（评审正文同源）仍成立 | — | S1（建核补齐） |
| 109 | `advisor/loop.mjs` | 同路径 | 0.3889 · 异 | ② | 进核 | 融合：取 CLI 限额族 + 工具集取并集（`code_search` 恒在）+ 进度行按端注入（④ 段） | 分叉 ＝ 评审工具集（CLI 需 `agent.memory` 才挂 `code_search` `src/advisor/loop.mjs:37-46` / VSC 恒在 `code_search`（现体 = 核 `thincoder-core/advisor/loop.mjs:31`——检索面恒在句））+ 进度行实现；墙 / 轮帽 / 预算同 | — | S1（建核补齐） |
| 110 | `thincoder-core/advisor/run.mjs` | 同路径 | 0.3589 · 异 | ③ | 进核 | 取并集：以 CLI 为准（含设计评审连续失败止损护栏 `src/advisor/run.mjs:15-17,59-75,199-204`）+ VSC 的评审实例上下文并入 | 分叉 ＝ CLI 多一道止损闸（VSC 全仓零 `review-streak` 命中）+ 轮次载体（全局字段 vs 实例 `rv`）；前提（同职责）仍成立 | **①** | S1（建核补齐） （迁移期引文） |

> **#106 S2 接线前口径确认项（只记——S2 动作；设计面收正轮 3 补 · 2026-09-14）**：
> 归一形态 = **取一侧 = CLI**（核内已承载：`thincoder-core/advisor/repos.mjs:128` `isDocOnlyChange` = **非代码即「只文档」**——`docs/` / `*.md` 与临时件（`tmp-*` / `.tmp` / `.temp`）**同落「只文档」流**；逐行实核）；
> 对端严格形态 = **非代码 ∧ 是文档**（`thincoder-vscode/src/advisor/repos.mjs:111`——临时件既非代码也非文档 ⇒ **中断「只文档」流**）——随 S2 接线被取代。
> 两端当前**均无生产消费方**（对端仅测试面引用：`thincoder-vscode/test/portability-vsc-classification.test.mjs:16`）⇒ 属**潜伏差异**；
> **S2 接线前须确认**：接线后差异面 = **仅「临时件场景」**（`isDocOnlyChange` 对「临时件（+ 文档）」变更集的判定由 false 变为 true）——接受统一，或以端差注入承载严格形态（二选一——属 S2 接线轮动作，本项只记）。

### 2.4 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 159 | `src/agent-tools/review-facts.mjs`（改名自 review-streak） + `thincoder-core/agent-tools/subagent-panel.mjs` ↔ 核内（VSC 零 `review-facts` / `panel` 动作） | ③ | 以 CLI 为准（评审连续失败止损 / `panel` 动作）——VSC 接线后生效 | 分叉 ＝ VSC 未实现（零命中）；**承 §2.5 #110（止损）/ #99（panel 端特有段）** | —（承 #110 / #99） | S1（建核补齐） |
| 160 | `thincoder-core/advisor.mjs` ↔ `thincoder-core/advisor.mjs` | ② | 融合：取一侧（advisor 提示词选择 / 跟进构建 / 会话装配） | 分叉 ＝ 档名与目录（VSC 头注自述「VS Code port of thincoder CLI `thincoder-core/advisor.mjs`」`:3`）⇒ 前提成立 | — | S1（建核补齐） |
| 161 | （CLI 侧内联于 `thincoder-core/advisor/run.mjs`）↔ `src/advisor/provider.mjs` + `advisor/tools.mjs` | ② | 融合：评审 provider 解析 / 工具集按核内结构归位 | 分叉 ＝ 拆档（VSC 拆 2 档）；工具集差异（`code_search` 挂载条件）**已由 §2.5 #109 裁决** ⇒ 前提成立（VSC 两档已退役——W12 删除集；现体 = 核 `thincoder-core/advisor/**`） | —（承 #109） | S1（建核补齐） （迁移期引文） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A24 | `thincoder-core/advisor/run.mjs`（#110） | ① | 有**止损护栏**：同一批设计文档连续失败达阈值即拒发并给失败尝试表（`:15-17,59-75,199-204`） | **无该护栏**（VSC 全仓零 `review-streak`）⇒ 一次次重复发起、烧配额 | 取并集：以 CLI 为准（含止损护栏）+ VSC 的评审实例上下文并入 | ① VSC 侧评审连续失败时从此会止损并给出失败清单（现状是重复失败） | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**（对外事件面的兼容策略模板住 `CORE-UNIFICATION.md` §2.12.1「事件语义」类）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/agent-tools/panel-blocks.mjs`——#159 · #180 收正）。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/CONSULTATION.md`（160 行 · CLI 产品档——会诊面；该档自述「与 VS Code 插件同源设计」，记录 CLI 端的实现与接线）。根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：一次性批次材料（受影响文件表 / 测试与验收）· 头注状态行 / 变更流水账 / 需求迁出注 · 跨板面（飞刀 / advisor——见 §8.2 越段登记）。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**——本节一律按**现状路径**落笔（CLI 侧实现已住 `thincoder-core/**`；`thincoder-cli/src/tui/**` = CLI 壳体面；VSC 侧 = `thincoder-vscode/src/**`）。符号名与档路径为契约面，行号未逐条复核。
> **泛化机制不复制**：digest / settle / pending 单容器的机制本体 → 本层 `AGENT-LOOP.md` §6.7.3 / §6.8（不复制）；async 结果容器契约 → `thincoder-cli/docs/_archive/design/ASYNC-RESULT-CONTAINER.md`（CLI 档 · 未迁）。

### 6.1 架构与数据流

```
主 agent（turn 中，非阻塞）
  │  consult_start(problem) → 立即返回 { id, models }
  ▼
consult 会话（agent._consultSessions = Map<id, Session>，跨回合存活）
  ├─ 并发启动 N 个只读会诊子任务
  │    （独立 AbortController + 只读工具集 + main_history）
  ├─ 全 settle（pending=0）→ 会话升格完整 entry 移入 pending 单容器
  │    （_pendingAsyncResults +role "consult"——async 结果容器）
  ▼
下回合 run 首行注入 digest：reminder + 逐条意见全文
  ▼
消化轮逐条判断处置（会诊 = 建议非门禁）
```

会诊 settle 在用户空闲时也触发消化轮（见「消费驱动」）。

### 6.2 R17 现行机制（digest 消费模型）

R17（2026-09-06）以 **digest 自动注入**取代旧的 `consult_check` 回合内轮询消费模型：

- **唯一消费通道 = digest 自动注入**；`consult_check` 工具已删除（描述零残留）。
- **settle 判定**：某 id pending=0（全部模型回复 / 失败 settle）→ 会话升格完整 entry（`{id, role:"consult", report, done:true}`）移入 pending 单容器 `_pendingAsyncResults`（+role——原 `_pendingConsultResults` 独立族流退役）
  → 下回合（用户回合或 digest auto-turn）run 首行注入 `[System reminder: consultation #id finished — N of M models replied (F failed)]` + 逐条意见全文（失败按 per-model 标注——部分 / 全失败同规则）。
- **部分 settle 不提前注入**——全 settle 才入 digest 流（意见全貌才可判断）。
- **消化轮动作域**：会诊 = 建议非门禁——消化指令语义 = 「逐条判断采纳与否并处置」；**动作域按消费回合档位**（既有规则：用户回合 / AUTO 档 = 正常决策域；手动档 auto-turn = **整理禁写**——同 advisor digest，无「consult 可写」例外）。
- **注入容量**：超长 → 既有 digest 截断 / 落盘机制（XML-escaped，>64K offload 预览 + 路径）。
- **`consult_stop` 保留为取消语义**：`{ abandoned, cancelled: true }`——已答部分丢弃、不入 pending；会话 settle 即移出 map。
- **消费驱动**：digest auto-turn 驱动判据 = pending 单容器非空（四族统一）；挂起活度钩子 = running 会诊会话纳入 `poolLive`——空闲 settle 也触发消化轮。
- **每 consultant 活动块在 child settle 即冻结**（per-child key——不再经 check 消费冻结）。
- **`wait_for "consult done"` 条件保留**（会话 settle 即移出 map）。

### 6.3 工具契约

**config（`~/.thincoder/config.json`）**：

```jsonc
"agent": {
  // 候选池——会诊与飞刀共用（上限 5；缺省空数组 = 未启用）
  "consultModels": [
    { "provider": "deepseek", "model": "deepseek-v4-pro", "effort": "high" },
    { "provider": "zhipu-plan", "model": "glm-5.2", "effort": "max" }
  ],
  "consultTurns": 40,        // 每个顾问的工具轮数预算（15 曾致读文件途中撞墙）
  "consultTimeoutMs": 600000 // 墙钟看门狗（10 分钟；turn 上限只数 LLM 响应，不数慢工具）
}
```

**工具**（均在 `thincoder-core/agent-tools/consult.mjs`）：

```
consult_start
  - problem (required): 问题简报——现象 + 失败轨迹概述 + 文件入口
    （原始报错无需粘贴——会诊子 agent 用 main_history 自行拉取）
  - models (optional): 子集选择器——["provider:model" | 裸 provider | 裸 model]
    （大小写不敏感），只从 agent.consultModels 里筛出子集跑；缺省/空 = 全池。
    选择器匹配不到任何池成员 → 报错并列出可选值
  → { id, models: ["deepseek:deepseek-v4-pro", ...] }   // 非阻塞

consult_stop
  - id (required): consult_start 返回的会话 id
  → { abandoned: <pending>, cancelled: true }
    // abort 剩余（terminated settle，计数不入队）；abandoned = 放弃时的 pending 数
  → 未知 id / 已结束或已取消 → { error: "unknown consult id" }
```

**main_history**（仅会诊子 agent 可用，readonly）：`limit`（默认 20，最大 100）→ 主 agent 历史尾部窗口，多模态图片替换 `[image omitted]`、tool_calls 显形、60KB 字节预算。

**会话状态**：`Session = { controllers, replies, pending, waiters, failed, terminated, stopped, total, received }`。settle 语义：正常回复入队；`session.stopped` 后被 abort 的计 `terminated`（不入队）；报错计 `failed`（入队，带失败 note）。全失败时会话照常 settle 并注入 digest（失败按 per-model 标注）——不挂死。

**TUI 可观测**：每顾问一条活动卡，relay 前缀 `consult#<childRelayN>/` 复用 subagent 通道（relay 号非会话 id——会话自持 `_consultIdCounter`）；child settle 即冻结（`⟦ev⟧done`），并行顾问互不覆盖。

### 6.4 CLI 实现接线（现状坐标）

- **子 agent 构建**：显式 `createAgent({ provider, tools, config, cwd, memory, role: "consult" })`；**子任务 runner** = `runAgent(child, input, childCallbacks, { depth: 1, maxTurns: consultTurns, signal })`。
- **provider 解析**：`resolveChildProvider(parent, "provider:model")`（复用 subagent——跨 provider 候选）；**API key** = `ensureChildApiKey`——缺 key 转清晰 failed reply（不裸 401）。
- **只读工具集**：`readonlyToolNames(agent.tools)` 过滤父工具集 + `main_history`；**effort 越界防护** = `clampEffort`——池 effort 越出该模型 `reasoningEffortEnum` → 整字段丢弃（防 candidate 开跑即死）。
- **系统 prompt**：`role: "consult"` → `CONSULT_BASE`（`thincoder-core/agent/setup.mjs` base 分支；提示词档 = `thincoder-core/prompts/consult-base.md`——提示词面内容权归主 agent）。
- **活动流上屏**：relay 前缀 `consult#<childRelayN>/` → TUI 子 agent 活动区块；**工具注册** = `thincoder-core/agent/setup.mjs` depthOnly（depth 0 + consultModels 非空）注册 `consult_start` / `consult_stop`。
- **会话收尾**：`cleanupConsultSessions`——仅 Ctrl+C / suspension abort 分支；标记 stopped + abort 清 map。
- **配置入口**：`/config` 命令（`thincoder-cli/src/tui/cmd-config.mjs`——候选池增删改 + effort picker）。

### 6.5 VS Code 端级实现接线（VSC 轮并入 · 2026-09-15）

> **来源** = `thincoder-vscode/docs/design/CONSULTATION.md`（161 行 · VSC 产品档——迁移期参照历史）。本节 = 该档中「根层所缺」的 **VSC 端级接线表**（(a) 机制 / (b) 坐标）；digest / settle / 单容器机制本体已入 §6.2 / §6.3 与 `AGENT-LOOP.md` §6.7.3，不重复（D2）。
> **W12 收正（2026-09-15——VSC 壳接线批）**：VSC 端实现面迁核（端 `thincoder-vscode/src/agent-tools/consult.mjs` 删旧退役）——下表坐标现体 = 核 `thincoder-core/agent-tools/consult.mjs`（删除记录 = 批次档 §5，`2026-09-15-vsc-core-wiring.md`）；只收正坐标/状态行，机制条文零改。

| 环节 | VS Code（现状坐标） |
|---|---|
| 子 agent 构建 | `runConsultChild`（`thincoder-core/agent-tools/consult.mjs:215`）——`buildProvider` + effort 钳制（越 `reasoningEffortEnum` 整字段丢弃——防 candidate 开跑即死）；`models` 子集选择器同 CLI（大小写不敏感） |
| 子任务 runner | `runAgent(child, problem, childCallbacks, { depth: 1, maxTurns: consultTurns, signal })` |
| 只读工具集 | setup.mjs role 过滤（depth>0 且 role `consult` → 只读）+ `main_history` 经 `opts.extraTools` 注入（`makeMainHistoryTool` = `thincoder-core/agent-tools/consult.mjs:82`——limit 默认 20 最大 100；多模态 base64 图片替换 `[image omitted]`、tool_calls 显形 args 截 200、60KB 字节预算） |
| 系统 prompt | role `"consult"` → consult-base 底座（瘦——不背主 agent persona / 工具引用） |
| 工具注册 | setup.mjs：`consultModels` 非空即注册 `consult_start` / `consult_stop`——空池不注册 |
| 会话跨 run 容器 | `history._consultSessions`（`_asyncSubagents` 同款载体——agent per-run 重建） |
| settle → digest | 全 settle park `history._pendingConsultResults` → agent.mjs run-start 注入（**单注入点**——splice 即 consumed）；超长走 offload + 预览；部分 settle 不提前注入 |
| 驱动 / 中止 | `thincoder-vscode/src/extension/suspension.mjs` poolLive + 消化判据（任一 pending 族非空）；`cleanupConsultSessions`（普通回合收尾不再 abort——仅中止分支）；`sessionSignal ?? turn signal` 逐链中止，interrupt（Ctrl+I 停回合续跑）**不**逐链中止在飞会诊（F2 同款豁免——否则意见丢为失败注记） |
| 消化轮动作域 | 手动档 auto-turn = `AUTO_TURN_DIGEST_DOMAIN` 禁写禁 spawn（同 advisor/escalate——无「consult 可写」例外）；机械拒绝 = 手动档 auto-turn 内 `consult_start` execute 门拒绝；`consult_stop` 保留放行（控制类豁免） |
| 面板可见性 | `onSubagent` consult 事件 → 底部活动面板 / 冻结入流（reply preview ≤8KB）；每 consultant 一条活动块、回复预览随 answered 事件 |

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CO1 | 判定归主 agent，工具零判定 | 采纳与否在主 agent 的 turn 里用它的工具完成——工具只负责编排与收集 |
| D-CO2 | digest 自动注入取代 check 轮询（R17） | 发完会诊即可继续交互，判断性消费保留在消化轮；`consult_check` 退役 |
| D-CO3 | 只读会诊 + `main_history` | 会诊子 agent 不改文件；按需拉主会话历史（失败轨迹自取证） |
| D-CO4 | 跨 turn 生命周期 | 回合尾不再清理，仅 Ctrl+C / 会话中止时 abort（与 async 子代理同规则） |
| D-CO5 | 独立 consult role | 不复用 explore 身份——consult-base 作裸 prompt、不背编码纪律块；工具集只读过滤 + main_history |
| D-CO6 | CLI 复用 subagent 的 provider 解析 | `resolveChildProvider` 零新机制——跨 provider 候选天然支持 |
| D-CO7 | VSC 会诊 digest 消费 = **同一 digest 通道 + 单注入点**（手动档 auto-turn 禁写禁 spawn 零例外） | 与会诊 CLI 同语义；「consult 可写」不设例外——动作域档位制跨族一致 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/CONSULTATION.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 头注（状态行「已实施 + 已异步化（R17）」+ 同源设计注 + 权威规格指针） | 交付状态 / 时点权威指针 | 时点状态——归批次档 / 台账；「与 VS Code 同源」已入 §6 首段；权威指针按现状坐标重写（§6.2） |
| 文末「变更记录」（立项 / 会话级收尾 / R17 完全异步化 / 可读化重写） | 逐批变更流水账 | 历史叙述——本档自有变更记录 |
| 「需求层已迁出」注 | 拆分时点注 | 时点材料——需求已归位本层同名需求档 |
| §2.2 内「原 `_pendingConsultResults` 独立族流退役」 | 退役族流历史叙述 | (d) 类——现行形态（+role 并入单容器）已入 §6.2 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §2.5 受影响文件表 | 逐档清单 | **一次性批次材料**——批次档承载 |
| §3 测试与验收（T-R17a..r 编号已退役） | 用例与验收指针 | 测试资产归测试层；编号已退役，不再引用 |
| 飞刀（escalate）面机制文本（住旧 `thincoder-cli/docs/design/ESCALATE.md`） | 升级机制 / settle 三分类 / 工程模式拒保持 | 本批参照面 = 同板块同名档；该档不在内 ⇒ **越段登记**——触发 = 父侧另派 |
| advisor 主面机制文本（住旧 `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md`） | 评审运行 / 收敛 / 轮次语义 | 同上（参照面不含）⇒ **越段登记**——触发 = 父侧另派 |
| 旧 `thincoder-cli/docs/design/AGENT-LOOP.md` §14（会诊 / 飞刀异步化） | consult settle / 注入时机 / escalate 三分类 | 试点批登记「属本板」；本批参照面不含该档 ⇒ **越段登记**——consult 面与旧 `CONSULTATION.md` §2.2 同源（结论已入 §6.2）；escalate 面见上行 |
| 源档 §2 纯 VSC 同构细节（R17 语义 / 工具契约 / 会话状态 —— 与 CLI 逐字同源部分） | VSC 侧同构实现 | 已并入 §6.5（端级接线表 + 端差坐标）；同构正文不逐行复制（D2） |

### 8.3 需求侧（已并入本层需求档）

旧档需求面（旧同名需求档 §1：需求总述 / 行为 / 范围边界）=== 本板块需求层，已并入本层需求档 `docs/core/requirements/CONSULTATION.md`（**与本档同名成对**）——本档不重复。

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #1 / #40 / #41 / #93 / #95 / #104–#110 / #159–#161 + 四要素明细 · §2.5.1 A24）；**语义零改**，行号沿用原编号。
- 2026-09-14（S1 收口轮）：§5 补**核内落点行数**指针（`agent-tools/panel-blocks.mjs`——#159 · #180 收正）。
- 2026-09-14（markdown 面小收正轮）：§1 / §2.4 裸名点名补路径前缀（`advisor/provider.mjs` · `advisor/tools.mjs` · `thincoder-core/agent-tools/subagent-panel.mjs`——与 `src/provider.mjs` / `src/tools.mjs` / `thincoder-cli/src/tui/subagent-panel.mjs` 同名不同物；**消除歧义不改判据**）〔W10/W12 后该轮点名端点已退役——本条为历史记录〕 （迁移期引文）
- 2026-09-14（**设计面收正轮 3 · eng-designer**）：§2.3 表后补 **#106 S2 接线前口径确认项**（归一取 CLI 的核内实核坐标 + 对端严格形态 + 潜伏差异的行为差登记——只记，S2 动作）。
- 2026-09-14（**B 轮并入 · 第 3 批**）：新增 §6 **机制面**（架构与数据流 / R17 digest 消费模型 / 工具契约 / 实现接线）· §7 **关键决策（D-CO1–6）** · §8 **不并项与历史沿革**（含飞刀 / advisor / 旧 AGENT-LOOP §14 越段登记）；
  来源 = `thincoder-cli/docs/design/CONSULTATION.md`（**旧档一字未改**——原地作参照历史）；需求侧已并入本层 `docs/core/requirements/CONSULTATION.md`；首部加机制面指针一行。
- 2026-09-15（**VSC 轮并入 · 批 7**）：§6.5 新增 **VS Code 端级实现接线表**（子 agent 构建 / runner / 只读
  工具集与 main_history / 系统 prompt / 注册 / 容器 / digest / 驱动中止 / 动作域 / 面板可见性）· §7 补 **D-CO7** ·
  §8.2 补 1 行不并项登记；来源 = `thincoder-vscode/docs/design/CONSULTATION.md`（**旧档一字未改**）；坐标按现状
  实核（`thincoder-vscode/src/agent-tools/consult.mjs:29,223`）。
- 2026-09-15（**W12 收正 · VSC 壳接线批**）：§6.5 加 W12 状态行；坐标收正：`runConsultChild` = 核 `thincoder-core/agent-tools/consult.mjs:215`、`makeMainHistoryTool` = 同档 `:82`（端档删旧退役）。机制条文零改。
- 2026-09-20（**卫生族批 · 台账 #138 · eng-designer**）：首部机制面节区改 `§6–§8` + 历史节号指称清理（行数规则废除批残留）；设计源 = `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2。
- 2026-09-25（**hygiene-ab 批 · 文档面实施轮 · eng-designer**——承 `docs/batches/2026-09-25-hygiene-ab.md` §2 · 台账 #239）：§2.3 行 109 前提校验列 VSC 侧坐标 `src/advisor/tools.mjs:29-37`（盘上无）**改指**核现体 `thincoder-core/advisor/loop.mjs:31`（检索面恒在句——承接实核 = `grep code_search thincoder-core/advisor/*.mjs`）。**语义零改**。
