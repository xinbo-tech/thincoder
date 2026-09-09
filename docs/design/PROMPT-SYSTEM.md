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
| L2 模式纪律层 | 本模式的工作纪律/流程/工具观 | discipline.md（普通）/ engineering-sub.md（eng-coder 子代理工程纪律） |
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
| engineering-sub.md | 15 | L2（eng-coder） | "[ENGINEERING MODE …] You MUST strictly" | setup.mjs L41（role 分支） |
| explore.md | 13 | L3 | "You are now running as a subagent" | subagent-spawn.mjs EXPLORE_OVERLAY |
| coder.md | 14 | L3 | "You are a coding subagent" | subagent-spawn.mjs CODER_OVERLAY |
| plan.md | 10 | L3 | "You are now running as a subagent" | subagent-spawn.mjs PLAN_OVERLAY |
| eng-coder.md | 20 | L3 | "You are an engineering coder" | subagent-spawn.mjs ENG_CODER_OVERLAY |
| consult-base.md | 18 | 独立会话 | "You are one of several independent expert consultants" | setup.mjs CONSULT_BASE（L322 分支） |
| advisor-design.md | 34 | 独立评审 | "You are an independent design reviewer" | advisor/main.mjs L83 |
| advisor-round1/2/3.md | 40/39/35 | 独立评审 | "You are a(n independent) code review advisor" | advisor/main.mjs L72-78 |
| methodology-template.md | 39 | L5 兜底 | "# METHODOLOGY — AI Agent Collaboration" | setup.mjs（METHODOLOGY 缺失警告携带）+ cmd-eng.mjs |

## 3. 装配矩阵（现行——以 CLI setup.mjs L319-388 为权威；VSC setup.mjs 同构 L317-334）

| 场景 | 实际拼装顺序（→ = "\n\n" 连接） |
|---|---|
| 主会话·工程模式 | `system.md → engineering.md(+METHODOLOGY.md)` + AGENTS.md + skills 列表 |
| 主会话·普通模式 | `system.md → discipline.md → main.md` + AGENTS.md + skills 列表 |
| eng-coder 子代理 | `system.md(经agent.overlay前缀) → eng-coder.md？`——**实际：eng-coder.md(overlay) → system.md → engineering-sub.md(+METHODOLOGY)** |
| explore/coder/plan 子代理 | `角色.md(overlay) → system.md → discipline.md` |
| coder/eng-coder·非工程分支 | `system.md → discipline.md`（needsDiscipline L320/L363） |
| consult 子代理 | `consult-base.md`（单独基底——无 system.md） |
| advisor 评审 | `advisor-design.md` 或 `advisor-roundN.md`（独立会话——无主装配链） |

装配尾部统一追加（全部场景）：项目指令（AGENTS.md，`<untrusted_project_instructions>` 包裹）+ depth0 的 skills 清单。

### 降级链（METHODOLOGY/模板缺失）

- engineering.md 缺失 → 裸 corePrompt（system.md）+ templateMissing 警告
- METHODOLOGY.md 缺失 → 工程模板本体（不 fallback discipline）+ 警告携带 methodology-template.md
  绝对路径与全文（D-M1/D-M2）
- consult 无降级（consult-base 随二进制分发必在）

## 4. 层次判定规则（新增/修改提示词内容的归属判定法）

1. 该句是"模式里你是谁/交付什么"→ L1；"该模式下怎么干活/什么纪律"→ L2；"这个角色的收窄"→ L3
2. 两模式逐句都要 → L4（system.md）；仅项目相关 → L5
3. **冲突判定**：L1 与 L4 矛盾时 L1 优先（人格层定义边界，基础层不得越界）——装配顺序不改变语义
   优先级（system.md 在后不等于被覆盖——**两层并存时矛盾句 = 设计债，见 §7 待批**）
4. 独立评审/独立会话系（advisor/consult）自含身份——不入主装配链

## 5. 已知结构债（本档登记）

- **双重人格**：engineering.md（L1 ARCHITECT）与 system.md（coding agent + while-coding 执行节）并存
  ——工程模式每轮读两套身份。**待批修正 = §7 基础拆分批**
- system.md 实际承载 = 公共基础 + 写码执行层（while coding/Rules/按任务型匹配/测试与交付）——
  L4 不纯（§7 修正对象）

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
- system.md 瘦身回纯 L4（写码执行层迁 normal.md）；子代理 system.md 恒尾（eng-coder = eng-coder.md →
  engineering-sub → system.md；explore/coder/plan = 角色.md → discipline.md → system.md；consult 不动）
- 双端各自落地语义同源。**批准后本档 §3 装配矩阵按新链重写。**

## 变更记录

- 2026-09-10：建档（用户裁定——提示词板块缺总体设计档、批次碎片不构成结构权威——本档补位：
  分层模型/文件清单/装配矩阵/判定规则/结构债/批次索引/待批变更）。登记 docs/design/README.md 地图。
