# 提示词系统（PROMPT-SYSTEM——双端提示词架构权威设计）

> 板块：提示词系统（提示词分层/装配逻辑/文件命名法）——**板块总体档**。
> 本档 = 目标蓝图（先设计后改码——蓝图批准后由实施批落地）；现码对照与批次史降为附录。
> 双端各自独立实现、语义同源（多实现面纪律——METHODOLOGY §7）。
> 状态：**设计待评审/待批准**（2026-09-10 建档——用户主持结构重设计）。

---

## 1. 分层模型（抽象层——先于文件）

| 槽位 | 职责 | 每槽文件数 |
|---|---|---|
| [1] 人格层 | "你是谁"：模式/角色的身份与边界宣言 | 每人格一份（主会话按模式、子代理按角色） |
| [2] 公共层 | 两模式共用的协作基础（语言/人机分工/确认门/合同纪律） | 恒一份（恒第二位） |
| [3] 纪律层 | "怎么干活"：本模式的工作流程/行为规则/工具观 | 每模式一份 |
| [4] 其他 | 项目层（METHODOLOGY/AGENTS——cwd 注入）+ skills 清单等追加 | 动态 |

独立于主装配链的**特殊模块**：consult（会诊）、advisor（评审）——自含基底、独立注入（§3.3）。

## 2. 命名法（文件名 = 槽位投影）

**规则：`层前缀-变体.md`**——看到文件名即知槽位；槽位唯一对应文件，层与文件一一对应。

| 槽位 | 文件名 |
|---|---|
| [1] 人格层·工程 | persona-engineering.md |
| [1] 人格层·普通 | persona-normal.md |
| [1] 人格层·角色 | persona-{role}.md（explore / coder / plan / eng-coder 各一） |
| [2] 公共层 | common.md |
| [3] 纪律层·工程 | discipline-engineering.md |
| [3] 纪律层·普通 | discipline-normal.md |
| 特殊模块 | consult-base.md / advisor-design.md / advisor-round{1,2,3}.md（自含——不套前缀法） |

L5 项目层（METHODOLOGY.md / AGENTS.md）不随二进制分发、命名不变。

## 2.5 各文件内容大纲（目标态——每文件写什么）

### 人格层（回答"你是谁"——身份/边界/交付物，不含怎么干活）

| 文件 | 内容大纲 |
|---|---|
| persona-engineering.md | ① 身份宣言（ARCHITECT / Designer, not Implementer）② 交付物定义（需求+设计文档+委派任务书；不写实现代码）③ 发起权边界（评审/实施由用户发起）+ 推进档位声明（auto/manual）④ 与 eng-coder 的分工界面 |
| persona-normal.md | ① 身份宣言（coding agent——全项目代码所有者）② 能力边界（直接写码/全工具）③ 协作立场（人定方向拍板，我干活） |
| persona-eng-coder.md | ① 身份：被授权的实现者（designToken = 授权凭证）② 边界：设计是权威规格；与设计/现状冲突停下上报不静默适应 ③ 自含交付协议概览（审计/自修/评审/收敛——正文在 AGENT-LOOP）④ **file 域声明语义 = 预期触碰面（调度排队 + 透明披露基准）——非授权边界；超声明 ≠ 越权，如实披露即可（用户裁定 2026-09-10）** |
| persona-explore.md | ① 身份：只读侦察 ② 权限边界（只读/不碰用户）③ 报告义务（必列找了什么/没找到什么） |
| persona-coder.md | ① 身份：受控写码实现者 ② 权限边界（写门控）③ 报告义务 |
| persona-plan.md | ① 身份：只读规划 ② 权限边界（只读/不问用户）③ 报告义务（歧义带回主会话裁决） |

### 公共层

**common.md**（两模式共用——纯协作基础）：① 语言纪律（跟随用户语言；代码/标识符原文）② 人机分工
原则（用户定方向拍板；confirmed 即合同）③ 确认与批准门（写文件前确认 + 文档一致性豁免三条）
④ 诚实原则（不虚报/不静默简化/错了认）。工程模式专属内容全剔除（归纪律层）。

### 纪律层（回答"怎么干活"——流程/规则/工具观）

| 文件 | 内容大纲 |
|---|---|
| discipline-engineering.md | ① 四步硬流程（需求→设计→实施→测试）不跳步 ② 文档规范（三层结构/板块归属/归属判定四问）③ 评审收敛纪律（发起权/裁决表/轮次衰减）④ 实施委托结构化（任务书）⑤ checklist/TODO 纪律 + Problem-Solving ⑥ 工具观条款（搜索优先级等） |
| discipline-normal.md | ① 写码工作流（before/while/收尾——现 system.md 执行节迁入）② 按任务型匹配（Bug/Feature/Refactor/General）③ 测试与交付纪律（lint/verify/测试面）④ 模块拆分 policy + 查重 + 意图理解 ⑤ 长输出落盘/日志细则 + 工具观条款 |

### 特殊模块（自含——微调对齐，不套槽位）

consult-base.md / advisor-design.md / advisor-round{1,2,3}.md——身份+输出契约/裁决标准基本不变。

### 清理清单（现提示词中被否决语义的拔根——实施批一并执行）

- engineering.md Hard Rules "Do NOT modify any file not listed in the approved design" 类禁令句删
- "file list = 授权边界"表述（任务书结构/审计偏差定义/调度 files 声明处）统一改述为
  "file 域声明 = 预期触碰面（调度 + 披露基准）"——超域 ≠ 越权，披露即可
- 主会话 spawn 任务书模板同步（不再写"不得触碰清单外文件"）

## 3. 装配逻辑

### 3.1 四槽位固定序（主装配链——主会话 + 常规子代理）

```
[1] 人格层 → [2] 公共层 → [3] 纪律层 → [4] 其他
```

- 每槽至多一份文件；未命中角色/模式的槽位跳过
- **人格先行**：身份定义永远先于行为规则
- **公共恒二**：common.md 位置固定——人格冲突不落入公共层
- **同槽位不重复**：一个槽位一份文件（同一层禁止两份文本并存）
- **同槽位复用**：同层多场景语义一致时共用同一份文件，不另立副本（变体差异归人格层覆写）

### 3.2 装配矩阵（目标态——每个场景一行，子代理不合并）

| 场景 | 装配链 |
|---|---|
| 主会话·工程 | persona-engineering.md → common.md → discipline-engineering.md → METHODOLOGY + AGENTS + skills |
| 主会话·普通 | persona-normal.md → common.md → discipline-normal.md → AGENTS + skills |
| 子代理·eng-coder | persona-eng-coder.md → common.md → discipline-engineering.md → METHODOLOGY + AGENTS |
| 子代理·explore | persona-explore.md → common.md → discipline-normal.md → AGENTS |
| 子代理·coder | persona-coder.md → common.md → discipline-normal.md → AGENTS |
| 子代理·plan | persona-plan.md → common.md → discipline-normal.md → AGENTS |
| 特殊·consult | consult-base.md（自含——不入主链） |
| 特殊·advisor | advisor-design.md / advisor-round{N}.md（自含——不入主链） |

### 3.3 特殊模块（不入主装配链）

- **consult**：consult-base.md 单独基底（多模型并行会诊——无公共层/纪律层概念）
- **advisor**：advisor-design.md（设计评审）/ advisor-round{1,2,3}.md（代码评审轮次）独立注入，
  评审 criteria 随评审对象携带

### 3.4 降级链（目标态）

- 人格/纪律文件缺失 → 该槽空缺（装配跳过）+ 醒目警告（不 fallback 其他槽位的文件——层间隔离）
- 项目 METHODOLOGY.md 缺失 → 警告 + 内置模板路径与全文随警告携带（D-M1/D-M2 沿用）
- 特殊模块基底缺失 → 该模块不可用报错（不自降级）

## 4. 内容归属判定规则（新增/修改提示词内容的分层判定法）

1. "模式/角色里你是谁、交付什么、边界在哪" → 人格层
2. "两模式逐句都要的协作基础（语言/确认门/合同纪律）" → 公共层
3. "该模式下怎么干活（流程/规则/工具观）" → 纪律层
4. 仅项目相关 → 项目层（cwd）；冲突判定：人格层 > 公共层（人格定义边界，公共层不得越界）

## 5. 结构债（现码相对本蓝图——由实施批消除）

1. **双重人格**：工程模式现拼 engineering.md（ARCHITECT）与 system.md（coding agent + 写码执行节）
   ——两套身份并存
2. **同层两份文本**：engineering-sub.md 与 engineering.md 同属纪律层却各自成文
3. **公共层不纯**：system.md 实际承载公共基础 + 写码执行层（执行层应属纪律/人格层）
4. **装配顺序颠倒**：现码公共层（system.md）在人格层之前
5. **命名不表达槽位**：现名（system/engineering/discipline/engineering-sub/main 等）与层无对应

## 6. 实施批（蓝图批准后启动——另立施工设计）

- **迁移映射表**（现文件 → 新槽位文件的逐节内容去向；无对应即废）= 实施批首要交付物
- 装配代码改造（setup.mjs 双端四槽位化）、锚测试重写、AGENTS.md 模块图同步
- 验收：装配矩阵逐场景断言（文件名/顺序/槽完整性）+ 双端快层零回归（锚测试同步后）
- 归属：实施批设计并入 PROMPT-DECOUPLING.md（提示词结构变更批的既有归属）或按届时地图裁定

## 7. 批次史索引（细节以各档为准——冲突以本档蓝图为准）

| 批 | 档 | 状态 |
|---|---|---|
| 提示词解耦（2026-08） | PROMPT-DECOUPLING.md | 已实现（被本蓝图取代中） |
| 设计纪律锚注入（2026-09-09） | MAIN-DESIGN-ENHANCE.md | 已实现 |
| 注意力重排（2026-09-09 起） | PROMPT-ATTENTION-RESTRUCTURE.md + SPLIT-PLAN | 批 1/2 已交付；批 3-5 待做——**待本蓝图批准后按新命名重排范围** |
| 基础拆分（2026-09-10） | PROMPT-DECOUPLING §2.5 | 并入本蓝图（§1-§5） |
| VSC 端差异面 | （VSC 仓）VSC-PROMPTS.md | 待按本蓝图重写 |

## 变更记录

- 2026-09-10：建档（用户主持重设计——先抽象装配逻辑与命名法，现码降为实施批改造对象：
  四槽位固定序 + 层前缀命名法 + 装配矩阵 + 结构债清单 + 实施批边界）。
