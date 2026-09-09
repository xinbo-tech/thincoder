# 提示词系统（PROMPT-SYSTEM——双端提示词架构权威现状）

> 板块：提示词系统（src/prompts/ 全部文件 + 装配链）——**板块总体档**。本档 = 结构与机制的权威现状；
> 各历史批次档（PROMPT-DECOUPLING / MAIN-DESIGN-ENHANCE / PROMPT-ATTENTION-RESTRUCTURE）降为变更史
> 记录（批次设计细节以各档为准，**冲突时以本档现状为准**）。权威源：`src/agent/setup.mjs`
> （buildEngineeringPrompt / prepareRun 装配）、`src/agent.mjs`（常量装载）、
> `src/agent-tools/subagent-spawn.mjs`（角色 overlay）、`src/advisor/main.mjs`（advisor 注入）、
> `src/prompts/*.md`（提示词文本本体）。双端各自独立实现、语义同源（多实现面纪律——METHODOLOGY §7）。
> 状态：**现行态**（2026-09-10 建档——含待批变更 §7）。

---

## 1. 分层模型（五层——每文件归属唯一层）

| 层 | 职责 | 文件 |
|---|---|---|
| L1 模式人格层 | 定义本模式的身份/角色/边界（"你是谁、你的交付物是什么"） | engineering.md（工程主）/ normal.md（拟设——待批 §7） |
| L2 模式纪律层 | 本模式的工作纪律/流程/工具观（**全场景共用同一份**——不分主会话/子代理） | discipline.md（普通）/ engineering.md（工程——主会话与 eng-coder 同源） |
| L3 角色层 | 子代理角色覆写（在模式层之上收窄职责） | explore.md / coder.md / plan.md / eng-coder.md |
| L4 公共基础层 | 两模式共用的身份语言/协作原则/确认门 | system.md |
| L5 项目层 | 项目方法论与约定（cwd 注入，不随二进制分发） | 项目根 METHODOLOGY.md / AGENTS.md / methodology-template.md（缺失兜底模板） |
| 独立评审系 | advisor 会话独立注入（不走主装配链） | advisor-design.md / advisor-round1.md / advisor-round2.md / advisor-round3.md |
| 独立会话系 | consult 子代理独立基底（不走主装配链） | consult-base.md |
| 主代理补充层 | 主代理能力边界声明（普通模式） | main.md |

## 2. 文件清单（15 文件——CLI 现行实测行数；VSC 各自实测）

| 文件 | 行数 | 层 | 首句身份 | 直接消费方 |
|---|---|---|---|---|
| system.md | 117 | L4 | "You are ThinCoder, a coding agent" | setup.mjs（双端主装配前缀） |
| discipline.md | 84 | L2（普通） | "Workflow — match the process to the task" | agent.mjs 常量 → prepareRun |
| main.md | 91 | 主代理补充（普通） | "Main-agent role — only the top-level agent" | agent.mjs 常量 → prepareRun（depth0 且非工程） |
| engineering.md | 277 | L1（工程主） | "[ENGINEERING MODE …]" | setup.mjs buildEngineeringPrompt |
| engineering-sub.md | 15 | **废除（§7）** | 历史分流产物（同层两份文本）——内容并入 engineering.md/eng-coder.md 覆写 |
| explore.md | 13 | L3 | "You are now running as a subagent" | subagent-spawn.mjs EXPLORE_OVERLAY |
| coder.md | 14 | L3 | "You are a coding subagent" | subagent-spawn.mjs CODER_OVERLAY |
| plan.md | 10 | L3 | "You are now running as a subagent" | subagent-spawn.mjs PLAN_OVERLAY |
| eng-coder.md | 20 | L3 | "You are an engineering coder" | subagent-spawn.mjs ENG_CODER_OVERLAY |
| consult-base.md | 18 | 独立会话 | "You are one of several independent expert consultants" | setup.mjs CONSULT_BASE（L322 分支） |
| advisor-design.md | 34 | 独立评审 | "You are an independent design reviewer" | advisor/main.mjs L83 |
| advisor-round1/2/3.md | 40/39/35 | 独立评审 | "You are a(n independent) code review advisor" | advisor/main.mjs L72-78 |
| methodology-template.md | 39 | L5 兜底 | "# METHODOLOGY — AI Agent Collaboration" | setup.mjs（METHODOLOGY 缺失警告携带）+ cmd-eng.mjs |

## 3. 装配逻辑（抽象顺序原则——先于具体文件；**适用面 = 主装配链（主会话 + 常规子代理）**）

**适用面声明**：consult（独立会诊会话）与 advisor（独立评审会话）为**特殊模块**——自含基底、
独立注入，不入本装配链（各自细节见其板块档）；本节规则只约束主装配链。

**四槽位固定序**（每个槽位至多一份文件；未命中角色/模式的槽位跳过）：

```
[1] 人格层   —— 你是谁：每角色一份（主会话按模式、子代理按角色）
[2] 公共层   —— 两模式共用协作基础：system.md（恒第二）
[3] 纪律层   —— 怎么干活：按模式二选一（工程 engineering.md / 普通 discipline.md）
[4] 其他     —— 项目层（METHODOLOGY/AGENTS）、skills 清单等追加
```

设计原则：
- **同槽位不重复**：一个槽位一份文件——同一层禁止两份文本并存（历史分文件由此判定非法）
- **同槽位复用**：同层若两场景语义一致，共用同一份文件，不另立副本（角色特有差异归人格层
  覆写表达，不下沉纪律层）
- **人格先行**：身份定义永远先于行为规则——模型先知道"是谁"再读"怎么干"
- **公共恒二**：system.md 位置固定，人格冲突不落入公共层（L4 纯度由 §4 判定规则保障）

### 槽位映射（目标态——主装配链各槽位的实现文件）

| 槽位 | 主会话·工程 | 主会话·普通 | eng-coder | explore/coder/plan |
|---|---|---|---|---|
| [1] 人格层 | engineering.md | normal.md（新） | eng-coder.md | 角色.md（各一） |
| [2] 公共层 | system.md | system.md | system.md | system.md |
| [3] 纪律层 | engineering.md（续） | discipline.md | engineering.md（续） | discipline.md |
| [4] 其他 | +METHODOLOGY+AGENTS+skills | +AGENTS+skills | +METHODOLOGY+AGENTS | +AGENTS |

**特殊模块（不入本链）**：consult = consult-base.md 单独基底（setup.mjs L322 分支）；advisor =
advisor-design/round1-3 独立注入（advisor/main.mjs）+ criteria 随评审对象携带。

**实现说明**：工程纪律 = engineering.md 全文——主会话直接作人格层，子代理侧拆为「eng-coder.md
人格 + engineering.md 纪律」——同一份文件在不同装配链中占据不同槽位（文件 ≠ 层：一份文件可同
时是人格槽与纪律槽的实现，槽位才是抽象契约）。

### 落地差异（目标 vs 现码——批准后由实施批消除）

现码（CLI setup.mjs / VSC setup.mjs）仍是 system.md 在前 + engineering-sub.md 分流 + normal.md
不存在——以 §7 拆分批落地为目标，批准前代码不动。现链历史详见 §6 批次史。

### 降级链（METHODOLOGY/模板缺失——目标态）

- engineering.md 缺失 → 人格+纪律槽空缺裸 system.md（+templateMissing 警告）
- METHODOLOGY.md 缺失 → 工程模板本体（不 fallback discipline）+ 警告携带 methodology-template.md
  绝对路径与全文（D-M1/D-M2）
- consult 无降级（consult-base 随二进制分发必在）

## 4. 层次判定规则（新增/修改提示词内容的归属判定法）

1. 该句是"模式里你是谁/交付什么"→ L1；"该模式下怎么干活/什么纪律"→ L2；"这个角色的收窄"→ L3
2. 两模式逐句都要 → L4（system.md）；仅项目相关 → L5
3. **冲突判定**：L1 与 L4 矛盾时 L1 优先（人格层定义边界，基础层不得越界）——装配顺序不改变语义
   优先级（system.md 在后不等于被覆盖——**两层并存时矛盾句 = 设计债，见 §7 待批**）
4. 独立评审/独立会话系（advisor/consult）自含身份——不入主装配链

## 5. 已知结构债（本档登记——均由 §7 拆分批修正）

- **双重人格**：engineering.md（ARCHITECT 人格）与 system.md（coding agent + while-coding 执行节）
  并存——工程模式每轮读两套身份（人格层被公共层污染 + 执行层错放公共层）
- **同层两份文本**：engineering-sub.md 与 engineering.md 同属纪律层却各自成文（历史分流产物）——
  违反同槽位不重复原则，废除（差异句由 eng-coder.md 人格层覆写承接）
- **system.md 层不纯**：实际承载 = 公共基础 + 写码执行层（while coding/Rules/按任务型匹配/测试与
  交付）——执行层应属人格/纪律层（迁 normal.md）

## 6. 批次史索引（细节以各档为准）

| 批 | 档 | 状态 |
|---|---|---|
| 提示词解耦（2026-08） | PROMPT-DECOUPLING.md | 已实现（§2 矩阵被 §7 修订中） |
| 设计纪律锚注入（2026-09-09） | MAIN-DESIGN-ENHANCE.md | 已实现（A1-A4 锚——engineering.md 双端） |
| 注意力重排（2026-09-09 起） | PROMPT-ATTENTION-RESTRUCTURE.md + SPLIT-PLAN | 批 1/2 已交付（engineering/main/system 主会话三件——双端）；批 3-5 子代理待做 |
| 基础拆分（2026-09-10） | 本档 §7 + PROMPT-DECOUPLING §2.5 | **待评审/待批准** |
| VSC 端差异面 | （VSC 仓）VSC-PROMPTS.md | 现行清单（本档 CLI 侧对应） |

## 7. 待批变更——基础拆分批（2026-09-10 用户裁定；详设计 = PROMPT-DECOUPLING §2.5）

装配链翻转：**人格层恒前、system.md 恒第二**——
- 主会话工程：`engineering.md(+METHODOLOGY) → system.md`
- 主会话普通：`normal.md（新）→ system.md`
- **子代理同构化**：eng-coder = `eng-coder.md → engineering.md(+METHODOLOGY) → system.md`——
  **engineering-sub.md 废除**（工程纪律层复用主会话同一份——同层两份文本的历史分流产物——其
  eng-coder 特有句由 eng-coder.md 覆写承接）；explore/coder/plan = `角色.md → discipline.md →
  system.md`；consult 不动
- system.md 瘦身回纯 L4（写码执行层迁 normal.md）
- 双端各自落地语义同源。**批准后本档 §3 装配矩阵即为权威现状。**

## 变更记录

- 2026-09-10：建档（用户裁定——提示词板块缺总体设计档、批次碎片不构成结构权威——本档补位：
  分层模型/文件清单/装配矩阵/判定规则/结构债/批次索引/待批变更）。登记 docs/design/README.md 地图。
