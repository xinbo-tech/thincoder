# 提示词基础拆分（PROMPT-BASE-SPLIT——人格层前置 + system.md 瘦身归位）

> 板块：双端提示词结构（CLI/VSC——各端独立实现语义同源）。前序依据：PROMPT-DECOUPLING.md（2026-08——
> 工程模式顶层 = system.md + engineering.md + METHODOLOGY，"两模式只共享纯通用基础 system.md"——但其
> 前提已失效：system.md 此后吸收大量写码执行层内容——不再是纯通用基础——与 engineering.md 人格
> （ARCHITECT/不写实现码）拼装冲突 = 双重人格，用户 2026-09-10 裁定拆分）。状态：**设计待评审/待批准**。

---

## 需求

- **总体目标**：装配链改为「模式/角色人格层在前 + system.md 公共基础恒在最后」——前层定义人格，
  后层只提供两模式共用的协作基础——消解双重人格。
- **功能性**：
  - F-1（装配顺序）主会话工程模式 = `engineering.md → system.md`；主会话普通模式 = `normal.md（新）→
    system.md`——**system.md 恒第二/最后**（用户裁定原话）
  - F-2（新文件 normal.md）双端各一份 src/prompts/normal.md——承接 system.md 中**普通模式专属**内容
  - F-3（system.md 瘦身）只留公共基础（迁移判定规则见设计 §迁移清单）
  - F-4（子代理一致性）子代理拼装同规则：角色/模式层在前 + system.md 恒尾——eng-coder = eng-coder.md
    → engineering-sub(+METHODOLOGY) → system.md；explore/coder/plan（普通）= 角色.md → discipline.md →
    system.md；consult = consult-base.md 单独基底不变
  - F-5（双端镜像）CLI/VSC 各自落地——语义同源、文本各端自持（多实现面纪律）
- **非功能**：N1 普通模式行为不回归（迁移内容原地生效——只是搬家）；N2 工程模式人格单一化（ARCHITECT
  前置——system.md 不再携带 coding-agent 执行层指令）；N3 provider 前缀缓存稳定（每 run 同模式拼装
  字节确定）；N4 提示词锚测试同步更新（prompts-async-guidance 族）

## 设计

### 迁移判定规则（F-3 核心分类法）

- **公共基础（留 system.md）**：身份与语言 / 协作原则（人机分工）/ 确认与批准门 / 确认理解与合同纪律 /
  文档先行与先定对再定小 / 决策冲突原则（诚实>面子等）——**两模式逐句都要的**
- **普通模式专属（迁 normal.md）**：写码执行层全族——while coding 节（并行工具/自检 lint/模块拆分
  write-first/查重/意图理解细则）/ 收尾前（lint full/verify 门/测试纪律）/ Rules / 按任务型匹配
  （Bug fix/Feature/Refactoring/General）/ 测试与交付 / 长输出落盘与日志细则
- 逐句两可时判普通专属（工程模式有 engineering.md 对应条款兜底——宁瘦不肥）

### 装配矩阵（改动后全貌）

| 场景 | 拼装顺序 |
|---|---|
| 主会话·工程 | engineering.md + METHODOLOGY → system.md |
| 主会话·普通 | normal.md → system.md |
| eng-coder | eng-coder.md → engineering-sub.md(+METHODOLOGY) → system.md |
| explore/coder/plan·工程 | 角色.md → discipline.md → system.md（同普通——纪律层在前） |
| explore/coder/plan·普通 | 角色.md → discipline.md → system.md |
| consult | consult-base.md（单独基底——不变） |

### 接线（双端同构）

- CLI：agent.mjs L113 传参结构不变；setup.mjs L327-336 工程分支改 `engResult.prompt + corePrompt`；
  普通分支（L363）改 `mainOverlay 面板前置` —— 具体为 `base = NORMAL_PROMPT + \n\n + corePrompt`（普通
  模式）/ `engResult.prompt + \n\n + corePrompt`（工程）；子代理 L363 needsDiscipline 分支同步换序
- VSC：setup.mjs L322-334 同构翻转（L325 工程分支 / L326 普通分支 / L334 MAIN_OVERLAY 条件去除——
  normal.md 取代 main-overlay 位置语义）
- AGENTS.md 模块图/提示词清单同步（双端）

## 受影响文件

| 文件 | 端 | 现行数 | 增量 | 改动 |
|---|---|---|---|---|
| src/prompts/normal.md | 双端各一 | 新增 | ~70 行 | 承接 system.md 普通专属节（迁移判定规则分类） |
| src/prompts/system.md | 双端各一 | 117(VSC)/117(CLI) | -45 区 | 瘦身至公共基础 |
| src/agent/setup.mjs | 双端 | 391 区(VSC)/CLI 待实测 | ±10 | 装配顺序翻转 + normal.md 装载 |
| src/agent.mjs | CLI | 146 行区 | +3 | NORMAL_PROMPT 常量装载 + 传参 |
| src/agent/run-helpers.mjs | VSC | 待实测 | ±5 | loadEngineeringPrompt 调用侧换序（VSC 装配点） |
| test/prompts-async-guidance.test.mjs | 双端 | 待实测 | 同步 | 锚测试改（新装配顺序 + 迁移后内容锚） |
| AGENTS.md | 双端 | — | 模块行 | 提示词清单同步 |

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 工程人格前置 | 工程模式回合 system prompt | engineering.md 全文在 system.md 之前——ARCHITECT 声明先于公共基础——F-1 |
| 普通人格前置 | 普通模式回合 | normal.md 在 system.md 前——coding-agent 执行层在人格层——F-1/F-2 |
| system.md 瘦身 | grep 迁移节（while coding/按任务型/测试与交付） | system.md 零命中——normal.md 全数承接——F-3 |
| 公共基础不丢 | grep 确认门/语言/协作原则 | system.md 保留——两模式注入均含——F-3 |
| 子代理换序 | eng-coder spawn | eng-coder.md→engineering-sub→system.md 顺序——F-4 |
| 普通行为不回归 | 双端 npm test 快层 | 全绿（锚测试同步后）——N1 |

## 验收

- AC-1 装配顺序断言（测试锁：工程/普通/eng-coder 三链 system prompt 中各文件相对位置）
- AC-2 system.md 仅含公共基础（迁移判定规则逐节核对表进交付报告）
- AC-3 normal.md 双端落地、内容=迁移清单全量（无静默丢句）
- AC-4 双端 npm test 快层零回归（锚测试同步后）
- 红线：consult 基底不动；METHODOLOGY 注入逻辑不动；字节稳定（N3）不破坏；超出本表文件须停下报告

## 变更记录
- 2026-09-10：落档（用户裁定：装配链 engineering.md/normal.md 前置、system.md 恒第二；system.md 普通
  专属内容迁 normal.md，只留公共基础——消解工程模式双重人格——PROMPT-DECOUPLING 前提失效的修正批）。
