# 工程模式 v2 · 架构设计（ENGINEERING-MODE-V2）

> 板块 = 工程模式 v2（研发机制本体重构）· **架构设计**（项目一份）。
> 依据 = `docs/core/requirements/ENGINEERING-MODE-V2.md`（v2 需求草案，11 章——**只引用、不改写**）。
> 写权 = eng-designer（v2 §7.1 写权矩阵：设计档唯一作者）；建档 2026-09-17（阶段 1 · 架构设计轮）。
> 状态 = 设计就绪待评审（评审发起权在用户）。
> 定位（v2 §6.2）：架构设计承载**技术选型 + 模块划分 + 模块间接口/依赖 + 关键技术决策 + 整体数据流**——其中**模块划分是本档的权威产出**，后续按它拆 Function Spec 与模块设计。

## 1. 需求层

### 1.1 总体需求（定位）

工程模式 v2 是机制本身的重构：把工程纪律从「靠自觉 / 靠提示词背诵」翻转到「靠结构 / 靠机检」（v2 §1「约束即结构」）。本架构设计回答机制本体怎么落成结构——七条目（三账 / 文档体系 / 角色 / 规则 / 情境 / 评审凭证 / plan 面排除）逐条给架构级方案；不写实现代码，实现与细化归后续 Function Spec + 模块设计。

### 1.2 功能需求（回指 v2 需求）

本档覆盖七条目（= 批次档 §1 条目，逐条对应 v2 需求章节）：

| # | 条目 | 需求依据 |
|---|---|---|
| E1 | 三账架构（PROJECT-MANIFEST + 台账 + 批次档 + 两账咬合） | v2 §5 |
| E2 | 文档体系（四层关系 + 目录约定 + 声明面覆盖） | v2 §6 |
| E3 | 角色架构（四角色 + 写权矩阵机械门禁 + 互锁） | v2 §7 |
| E4 | 规则架构（交接契约 / 委派治理 / 纪律兑底 / 提示词双面流程 / 测试纪律 / 机检引擎） | v2 §8 |
| E5 | 情境架构（阶段 / 轮次旋钮 → manifest 字段 + 情境值模型注入） | v2 §9 |
| E6 | 评审凭证（advisor 评审 + token 门——继承 v1，只微调） | v2 §8.5 |
| E7 | 工程模式 plan 面排除（装配裁剪 + 命令面禁 + 残留清零） | v2 §13.9（FR31） |

### 1.3 非功能需求

| # | 维度 | 标准（度量，v2 §11） |
|---|---|---|
| N1 | 结构优先 | 每块痛点有结构兜底——每条纪律能答「靠哪个结构」，不靠自觉 |
| N2 | 可机判 | 验收点可机判（判据句机检），禁散文判据 |
| N3 | 可迁移 | 不写死本仓路径——声明面（manifest `docRoot` + `checkConfig`）承载 |
| N4 | 耗时 | 修复轮小改分钟级（修复轮回合/时长上限，v2 §11） |

### 1.4 范围边界（本批不做）

- 只出架构设计，**不做实现**（实现 = 阶段 2 起的 Function Spec 批）。
- 委托开发方法论与对甲方交付物（v2 §4）→ 阶段 2，本批不展开。
- 不立即删 v1 老档——v2 确定后 v1 归档退役（v2 §10.1），本批不动。
- 不改需求草案、不改 v1 老档、不改代码。

## 2. 设计层

### 2.1 技术选型（决定 + 理由）

| # | 选型点 | 决定 | 理由 |
|---|---|---|---|
| 1 | 台账存储 | SQLite（`node:sqlite`） | 需求已裁定（v2 §5.2）；md 已被 v1 实证腐化（计数漂移）、JSON 无事务无 COUNT 查询；`node:sqlite` 零第三方依赖（Node 标准库），风险见 KD7 |
| 2 | manifest 格式 | JSON | 需求已裁定（v2 §5.1）；标准库 `JSON.parse` + schema 校验即可机检，无第三方解析器 |
| 3 | 批次档格式 | md | 需求已裁定（v2 §5.3）；批次档含大量叙述（讨论/发现表/交付摘要），md 人读性不可替代；继承 v1 六段 append-only |
| 4 | 机检引擎 | 单引擎 + 声明面 | 需求已裁定（v2 §8.7）；单引擎 + 声明面 = 判据单源、项目自声明；砍 v1 双引擎（漂移源） |
| 5 | 写权门禁落点 | 机械 + 行为分层 | 语义写权（谁写需求谁写设计）不可机判；纯提示词无兜底；机械可判的落代码门禁（继承 v1），语义写权落提示词 + 互锁兜底（见 KD3） |
| 6 | 台账访问面 | 查询命令 | 需求已裁定（v2 §5.2）；直接读 DB 暴露 schema、md 摘要重蹈计数漂移；查询命令只读 + 写命令只在主 agent 装配（写权面） |

### 2.2 模块划分（权威源——对现有代码模块的变更）

> 本表 = 后续 Function Spec 的权威拆分批据。每模块 = 一个机制变更单元，**锚定现有代码模块**（现有 file/dir → 变更类型），不设抽象目标模块。
> 行数 = 本次勘察实测（as-of，非承诺——精确行数与增量由各模块设计按 R24a 行数标注规则标注，见 discipline-engineering.md）。

| # | 模块 | 现有模块（file/dir → 变更） | 职责（一句话） | v2 依据 |
|---|---|---|---|---|
| M1 | 项目状态档 manifest | `thincoder-core/manifest.mjs`（**新增**，v1 无对应物）——机制代码在核，操作对象 = 被开发项目**项目根（= git 仓根——判据 = .git 纯向下；2026-09-17 用户裁定）**的 `PROJECT-MANIFEST.json`（数据档，N3 迁移点）；`thincoder-core/agent/setup-reminders.mjs` + `thincoder-core/agent/run-stages.mjs`（**修改**——情境行注入，E5.1） | JSON schema + 读/写/校验（version/phase/docRoot/promptsLanding/checkConfig 五键）+ 情境值 → 模型注入行 | §5.1 · §6 · §9 |
| M2 | 台账（SQLite） | `thincoder-core/ledger.mjs`（228 行·**修改**）+ `ledger-surface.mjs`（77 行·**修改**）+ CLI/VSC 端 `ledger-surface.mjs`（70/119 行·**修改**，完整清单见接线表） | md 读面 → `node:sqlite` 读面 + 写命令 + 六态 CHECK schema | §5.2 |
| M3 | 批次档六段 | `thincoder-core/agent-tools/batch-segment.mjs`（297 行·**修改**） | 六段门禁 + 段白名单继承 + 状态行冻结拒写 | §5.3 |
| M4 | 写权门禁（token 门 + 冻结窗口） | `thincoder-core/agent/dispatch.mjs`（490 行·**修改**，**拆分候选**——近 500 硬上限，拆出 `write-gate.mjs`）+ 新档 `write-gate.mjs`（`resolveReviewTargetPaths` + 冻结窗口判据组装）+ VSC `tool-gates.mjs`（165 行·**修改**，完整清单见接线表） | token 门 + D5 冻结窗口——评审对象/被审文件读 manifest `docRoot`（去硬编码 docs/） | §7 · §8.5 |
| M5 | 委派与 spawn 门 | `thincoder-core/agent-tools/subagent-spawn.mjs`（484 行·**修改**，**拆分候选**——as-of 2026-09-17 实测；F3 拆除后 ~469）+ `subagent-scheduler.mjs`（428 行·**修改**，**拆分候选**） | 任务书强制字段（轮次）+ files 声明面拦截 | §8.1–8.2 · §9.3 |
| M6 | 评审凭证（advisor + token） | `thincoder-core/advisor.mjs`（274 行·**修改**）+ `token-ttl.mjs`（286 行·**零改（继承）**）+ `agent-tools/design-token.mjs`（118 行·**零改（继承）**） | 评审对象来源读 `docRoot`（唯一微调，继承 v1 不重写） | §8.5 |
| M7 | checklist 废除 | 删 checklist 族 3 档 + 摘挂载/移除注入（核 2 + VSC 2）+ 死指针 2 + 门禁 1 + 测试 5——完整清单见接线表 | 待办跟踪统一到台账六态 | §5.2 · §10.1 |
| M8 | 机检引擎 | `scripts/doc-check.mjs` + `scripts/doc-check-anchors.mjs` + `scripts/doc-check-targets.mjs` + `scripts/doc-check-width.mjs`（**现状档**——v2 单引擎已落地） | 单引擎（锚 + 行宽）+ 声明面（manifest `checkConfig`）；台账一致性由 SQLite schema 承接（`check-ledger` 作废） | §8.7 |
| M9 | 提示词双面流程 | 模板 `docs/core/design/prompts/`（中文审核面）→ 落地 `thincoder-core/prompts/`（英文运行面——翻译生成；机检与度量脚本已裁退役——2026-09-17 用户裁定）+ 清理「方案选型对比」残留 |（`persona-eng-designer.md` 8 项「选型对比」· `discipline-engineering.md` A3⑤——已废，随 M9 落地一起清） | 单向流程（只改模板 → 翻译生成落地），落点读声明面 | §8.4 |
| M10 | 测试纪律 | 产品 `package.json`（**修改**）+ `test/run-fast|full|integration|slow-gate|slow`（**修改/删除**） | 三层门禁 → 一条 `test` 全绿 | §8.6 |
| M11 | plan 面排除（FR31） | 核 `agent/family-tools.mjs`（174 行·**修改**）+ `agent-tools/plan.mjs`（86 行·**修改**）+ `agent-tools/eng.mjs`（102 行·**修改**）+ `session-lifecycle.mjs`（305 行·**修改**）；两端侧文件见接线表 + §2.3 E7 | 工程模式 plan 工具不入表 + 命令面拒绝 + `planMode` 清零 | §13.9 |

**现状勘察摘要（as-of，用于两端接线锚定）**：

- 三包结构：`thincoder-core/`（核，单一权威源）· `thincoder-cli/`（CLI 端）· `thincoder-vscode/`（VSC 端）。两端均经 `@thincoder/core` 引入核，端侧只保留薄装配面 / 面特有段。
- `thincoder-core/tools/checklist.mjs` + `checklist-sync.mjs` **非死文件纯清理**——仍挂载核侧工具表（`thincoder-core/tools/index.mjs:11,25,35`）+ VSC 工具表（`thincoder-vscode/src/tools/index.mjs:20,165,175`），上下文注入仍在（核 `thincoder-core/agent/setup.mjs:126-139` · VSC `context-injections.mjs:177-205`）。 （迁移期引文——机制已废）
  并有死指针（`task.mjs:36` · `memory-tool.mjs:37`）与 `subagent-scheduler.mjs:38,56` 门禁族；受影响文件清单以 M7 spec 为准。
- 机检脚本落仓根 `scripts/`（**工程工具面**，非三包产品代码）：`check-doc-width*.mjs` 双引擎 + `doc-anchors*.mjs` 四套 + `check-ledger*.mjs` 双引擎 = M8 合并/砍的对象。

**两端接线（core + CLI + VSC）**：

> 每条机制变更必须答「核改哪、CLI 改哪、VSC 改哪」；「零改」处显式标注。路径相对各包根（核 = `thincoder-core/`，CLI = `thincoder-cli/`，VSC = `thincoder-vscode/`）。仓根 `scripts/` 属工程工具面，M8/M9 落于仓根、三包皆零改。精确编辑点（函数级）到各模块设计定——本表锚定到**文件**。

| 模块 | 核（thincoder-core/） | CLI（thincoder-cli/） | VSC（thincoder-vscode/） |
|---|---|---|---|
| M1 manifest | 新增 `manifest.mjs` + 修改 `thincoder-core/agent/setup-reminders.mjs` / `thincoder-core/agent/run-stages.mjs`（情境行注入——E5.1） | 修改 `src/cli/make-agent.mjs`（装配层读/初始化 manifest） | 修改 `thincoder-vscode/src/agent/setup.mjs`（装配层读/初始化 manifest）+ `thincoder-vscode/src/agent.mjs` / `thincoder-vscode/src/agent/setup-reminders.mjs`（情境行端镜） |
| M2 台账 | 修改 `ledger.mjs` + `ledger-surface.mjs` + 命令注册 `thincoder-core/tools/index.mjs` + `family-tools.mjs` | 修改 `thincoder-cli/src/tui/ledger-surface.mjs`（70 行） | 修改 `thincoder-vscode/src/extension/ledger-surface.mjs`（119 行） |
| M3 批次档 | 修改 `agent-tools/batch-segment.mjs` | 零改（核内工具，端经 import 装配） | 零改（核内工具，端经 import 装配） |
| M4 写权门禁 | 修改 `agent/dispatch.mjs` | 零改（核内门禁） | 修改 `src/agent/tool-gates.mjs`（165 行——VSC 独立同语义镜像） |
| M5 委派 spawn | 修改 `subagent-spawn.mjs` + `subagent-scheduler.mjs` | 零改（端经核单源 import） | 零改（端经核单源 import） |
| M6 评审凭证 | 修改 `advisor.mjs` + `token-ttl.mjs` + `agent-tools/design-token.mjs` | 零改 | 零改（`tool-gates.mjs` 已 import `validateDesignToken` 自核） |
| M7 checklist 废除 | 删 checklist 族 + 摘挂载 `thincoder-core/tools/index.mjs` + 移除注入 `thincoder-core/agent/setup.mjs` + 死指针 + 门禁 + 注释 + 测试 3 档（清单见 M7 模块设计档） | 零改 | VSC 摘挂载/移除注入/死指针 + 编排注记（±0）+ 测试 2 档（清单见 M7 模块设计档） |
| M8 机检 | 零改（引擎在仓根 `scripts/`） | 零改 | 零改 |
| M9 提示词 | 零改（落地 `prompts/` = 生成物，重生成不手改） | 零改 | 零改 |
| M10 测试 | 修改 `package.json` + `test/` | 修改 `package.json` + `test/` | 修改 `package.json` + `test/` |
| M11 plan 面排除 | 修改 `family-tools.mjs` · `plan.mjs` · `eng.mjs` · `session-lifecycle.mjs` | 修改 `cmd-plan.mjs` · `cmd-eng.mjs` · `handlers-session.mjs` | 修改 `thincoder-vscode/src/agent/setup.mjs` + 端侧 agent-state / chat-panel / panel-messages-settings / `webview/mode-buttons.js`（逐档改动面 = §2.3 E7 表） |

**依赖方向**（实现顺序 = Function Spec 拆分参考）：

```text
M1 manifest（被读面：docRoot / checkConfig / phase）
  ├──► M4 写权门禁（读 docRoot 去硬编码）
  ├──► M6 评审凭证（评审对象来源读 docRoot）
  ├──► M8 机检（读 checkConfig/docRoot = 声明面）
  ├──► M3 批次档（第二基底复判读 docRoot.batches）
  └──► M9 提示词（落点读 promptsLanding）
M2 台账 ⇄ M3 批次档（两账咬合：条目 task_book 指针 → 批次档 §2）
M4 写权门禁 ──► M6 评审凭证（token 门读 M6 签发的槽文件）
M5 委派 spawn ──► M4 写权门禁（eng-coder spawn 需活 token）
M7 checklist 废除（独立删除，无依赖）
M10 测试（独立简化，无依赖）
```

### 2.3 六条目架构方案（逐条）

#### E1 三账架构（v2 §5）

**三账分工**：manifest = 声明/情境账（机器读：`docRoot` / `checkConfig` / `phase` / `promptsLanding`） · 台账 = 待办总账（条目级落地状态）· 批次档 = 流程账（人读、全链路贯穿）。三者**不互相替代、不重述**——一批的「谈成什么」只住批次档，条目的「做到哪」只住台账，机制的「现在什么情境」只住 manifest。

**PROJECT-MANIFEST（JSON）字段 schema**（M1 产出）：

```json
{
  "version": 1,
  "phase": "initial-dev | production",
  "docRoot": {
    "requirements": "docs/requirements",
    "specs": "docs/requirements/specs",
    "design": "docs/design",
    "modules": "docs/design/modules",
    "batches": "docs/batches"
  },
  "promptsLanding": "thincoder-core/prompts",
  "checkConfig": {
    "scanDirs": ["docs"],
    "lineWidth": 300,
    "anchors": { "domain": "docs", "exclude": ["_archive", "batches"] },
    "exemptions": []
  }
}
```

- `phase` = 情境旋钮落点（E5，模型侧经 E5.1 情境行注入）；`docRoot` = 文档体系声明面（E2）；`promptsLanding` = 提示词落地声明面（E4/M9——顶层平级键：落地是代码仓路径，不入 docRoot）；`checkConfig` = 机检声明面（E4/M8）。
- **`docRoot` 值形态**（2026-09-17 用户裁定，台账 #32）：非空字符串（单根——默认档即此形态）或**非空字符串数组**（多根：一个文档层跨多个根目录——数组 = 完整声明，不与默认合并）。值域 / 解析 / 消费面单一权威源 = `docs/core/design/MANIFEST.md` §2.7（D2——本档不重述）。
- 校验：schema 枚举字段（phase 取值、docRoot 各键 + promptsLanding 存在）+ **`docRoot` 子键值形态**（非空串 | 非空且元素皆非空串的数组——非法形态拒）由 M1 的校验器机械判。

**台账（SQLite）表结构**（M2 产出）：

```text
表 items（单表 + status 枚举，归档 = 状态子集——软删除语义）
  id            INTEGER PRIMARY KEY
  kind          TEXT NOT NULL CHECK(kind IN ('requirement','tech_todo'))
  status        TEXT NOT NULL CHECK(status IN ('待讨论','待设计','在途','待核销','已核销','已废弃'))
  title         TEXT NOT NULL          -- 需求句 / 待办句（一行一条，不展开细节）
  board         TEXT                   -- 归属板块
  req_doc       TEXT                   -- 需求档指针（需求类：<档> §X）
  task_book     TEXT                   -- 任务书指针（在途/待核销必填：批次档 §2）
  evidence      TEXT                   -- file:line + 症状（技术类最小证据行）
  trigger       TEXT CHECK(trigger IN ('归批','条件','认账不排期') OR trigger IS NULL)
  created_at    TEXT  ·  updated_at TEXT  ·  closed_at TEXT
```

- 状态机 = v2 六态（未决四态 待讨论/待设计/在途/待核销 + 归档两态 已核销/已废弃）；`status`/`kind` NOT NULL + CHECK 枚举机械锁死（CHECK 对 NULL 不判——NOT NULL 兜底）。
- 计数 = `SELECT COUNT(*) WHERE status IN (未决四态)`——单源，替代 v1 md 计数。
- 访问面 = 查询命令（只读，全角色可见）+ 写命令（仅主 agent 装配）。

**批次档（md）六段**（M3 产出，继承 v1 §1.12 骨架，段名按 v2 §5.3 收正）：

| 段 | 作者 | 写入手段 |
|---|---|---|
| §1 目标 + 前情 + 条目 | 主 agent | 普通文档写 |
| §2 任务书 | eng-designer | `batch_segment`（段 = §2，无路径参数） |
| §3 发现表 | 评审子代理（advisor） | `batch_segment`（段 = §3，工具已挂载时） |
| §4 核验与裁决 | 主 agent | 普通文档写 |
| §5 实施记录 | eng-coder | `batch_segment`（段 = §5） |
| §6 收口 + 状态行 | 父代理 | 普通文档写 |

**两账咬合（状态机 + 事务边界）**：

```text
需求状态机（台账 items.status）：
  待讨论 ─► 待设计 ─► 在途 ─► 待核销 ─► 已核销（勾销入归档）
      └──────────────► 已废弃（需求撤回 / 批次废弃）

批次状态机（批次档状态行）：
  开批(§1) ─► 设计(§2) ─► 评审(§3) ─► 裁决(§4) ─► 实施(§5) ─► 收口(§6) ─► 冻结
  （多批可同时在飞——各批各档各状态行，链上无「当前批次」单槽）

咬合点（唯一事务边界 = 收口）：
  收口一次事务 = ① 批次档 §6 非空（验收结论） ② 台账条目状态推进（在途→已核销/已废弃，SQLite 事务）
                ③ 计数/枚举同步（D3）
```

- **事务边界**：台账侧 SQLite 事务保证原子；批次档 append-only。收口 = **两账**（台账 + 批次档）一次性同步，任一失败即回滚（台账回滚 + §6 不写）。manifest 不参与收口事务。
- **咬合判据（两账）**：条目 `status=在途/待核销` 必带 `task_book` 指针；`task_book` 指向的批次档必须存在。

#### E2 文档体系（v2 §6）

**四层关系**：

```text
需求层   项目需求（Project Requirements，项目一份 · 主 agent）
            └─► 功能规格（Function Spec，一模块一份 · 主 agent）
设计层   架构设计（Architecture Design，项目一份 · eng-designer）── 本档
            └─► 模块设计（Module Design，一模块一份 · eng-designer）
状态/过程层  manifest（状态账）· 台账（待办总账）· 批次档（流程账）
```

- **模块划分权威源 = 架构设计（本档 §2.2）**——Function Spec 按它拆、模块设计按它写。
- **目录约定（默认值）**：`requirements/`（项目需求 + `specs/` 功能规格）· `design/`（架构 + `modules/` 模块设计）· `batches/`（批次档）· `PROJECT-MANIFEST.json`（项目根）。
- **声明面覆盖机制**：默认值被 manifest 声明面（`docRoot` / `promptsLanding`）覆盖——产品启动时读 manifest，各机制（机检扫描 / 文档地图 / 批次档落点 / 提示词落地）从 `docRoot` / `promptsLanding` 取路径，不硬编码。**缺某键（含 `docRoot` 各键 / `promptsLanding`）→ 用默认值（便利 fallback）；缺 manifest（整档）→ 拒绝进入正常循环、先初始化**（需求 §5.1 前置门槛——缺 manifest 时机制拒绝进入正常循环，必须先初始化生成再进正常循环）。
  **口径限定（2026-09-18——台账 #30）**：以上读面与前置门槛均为**工程模式会话**口径（判据取**会话权威值**：槽优先 + config 回退）；普通会话**装配钩子**零 manifest I/O（不读 / 不拒 / 不建档；下游仍读盘消费面不在此限）；模式门判据与取值点、钩子执行点、拒自动建档分支（根不可解析 → 拒，不建档）见 `MANIFEST.md` §2.2（D2——本档不重述）。
- **值形态（2026-09-17 用户裁定）**：`docRoot` 各键 = 非空字符串 \| 非空字符串数组（多根声明——数组为完整声明、不追加默认；非法形态拒）；解析基数 = 项目根。值域与消费面见 `MANIFEST.md` §2.7（单一权威源）。

#### E3 角色架构（v2 §7）

**四角色**：

| 角色 | 职责 | 写权（唯一作者） |
|---|---|---|
| 主 agent | 目标确认 · 派单 · 台账落笔 · 核验裁决 | manifest · 台账 · 批次档 §1/§4/§6 · 项目需求/功能规格 |
| eng-designer | 架构/模块设计 · 核对主 agent 写的 Function Spec 合规（五要素，不合规打回） | 设计档（架构 + 模块）· 批次档 §2 |
| eng-coder | 按任务书实现 + 自测 | 产品代码 · 批次档 §5 · 提示词落地档（主 agent 内容权 + coder 落笔） |
| advisor | 独立评审（设计 / 代码） | 批次档 §3（仅设计评审，纯只读评审） |

（辅助角色 explore = 只读勘察，无写权；plan = 待定。）

**写权矩阵 → 机械门禁落点**（分层）：

| 层面 | 门禁 | 落点 | 继承 |
|---|---|---|---|
| 机械面 | token 门（eng-coder 写产品代码需活 designToken） | M4 `dispatch.mjs` | v1 |
| 机械面 | `batch_segment` 段白名单（越段即拒） | M3 `batch-segment` 工具 | v1 |
| 机械面 | `batchDoc` 参数门（缺参/不可读即拒） | M5 spawn 门 | v1 |
| 机械面 | 台账/清单写命令仅主 agent 装配（SQLite 写门） | M2 ledger 命令装配 | **新增** |
| 机械面 | manifest 写门（唯一作者 = 主 agent） | M1 manifest 读写装配 | **新增** |
| 行为面 | 语义写权（需求=主 agent · 设计=designer） | 提示词层（D1 矩阵） | v1 |

**互锁**（谁写谁把关、机械打回）：

- designer 产出 → **advisor 独立评审**（设计八维）把关；
- coder 产出 → **父侧验收 + advisor 代码评审**把关；
- 机械打回：`batchDoc` 缺参 / 段越界 / 无 token 写产品代码 / 台账非主 agent 写 → 门禁拒（fail-closed）。

#### E4 规则架构（v2 §8）

**交接契约（任务类型 → 角色路由表）**：

| 任务类型 | 角色 | 门槛 |
|---|---|---|
| 勘察 / 排查 / 调研现状 | explore | 只读 |
| 设计 / 文档撰写 / 需求澄清 | eng-designer | `batchDoc`（§1 为输入源） |
| 实现（多文件 / 跨模块 / 有批准设计） | eng-coder | `designId` + `designToken` + `batchDoc`（§2 任务书） |
| 评审 | advisor | 设计评审需 Approval Signal |

**委派治理（门槛 + 强制字段）**（M5 落点）：sized 实现批默认委派 coder；任务书强制字段 = 目标与理由 / **轮次（初始/修复——需求 §9.3 派单必带）** / 已知事实（父侧已探路径）/ 设计要点与禁止范围 / 验收标准（机判）/ 交付报告格式。缺字段 = 派单缺陷。

**纪律兜底（纪律 → 机检映射）**（M8 落点）：

| 纪律 | 挂哪条机检 |
|---|---|
| D3 计数枚举纪律 | 机检器「计数 vs 列表一致」 |
| D4 指针纪律（`文档:节`） | 机检器「段引用可解析」 |
| D5 冻结窗口（评审在途不改被审文档） | M4 门禁拦截（写时拦）+ 结算陈旧 |
| 需求池不展开细节（一行一条） | 台账 schema（单行 title）+ 机检 |
| 两账不互相替代（台账 ⇄ 批次档） | 已落半幅 = M2 咬合 CHECK（`task_book` 非空——`docs/core/design/LEDGER.md` §2 · AC-M2-5）；「`task_book` 指向的批次档存在」**无机检落点 = 缺口登记**（消解路径 = 随 M8 扩面或 M2 后续轮补判据；未消解前本行持续标注） |

**提示词双面流程**（M9 落点，v2 §8.4）：「模板（`docs/core/design/prompts/`）= 中文审核面（用户审核用）；落地档（`thincoder-core/prompts/`）= 英文运行面（国外模型运行用）。更新流程 = 改模板 → 翻译生成落地；生成 = 翻译，不是 cp。无机检门（2026-09-17 用户裁定）」。

**测试纪律（简化）**（M10 落点，v2 §8.6）：「门禁 = 一条 `test` 全绿（不再 lint + test:full + test:integration 三层）」「砍掉：慢测层归册（慢就慢，全量跑）· run-fast / run-full / slow-gate 多脚本 · 测试退役台账」——具体裁剪到模块设计定，本档只定「简化」方向。

**机检引擎（一个引擎 + 声明面）**（M8 落点，v2 §8.7）：「双引擎、三套源域、三套行宽判据、参照历史面豁免族、六档并入映射、V3 历史常量」砍掉；留内核 = 「锚检查 / 行宽检查 / 台账一致性（由 SQLite schema 承接，check-ledger 作废）」；判据（扫描域 / 行宽阈值 / 锚域 / 豁免）全部从 manifest `checkConfig` 读取（声明面），不再硬编码本仓路径——这是「可迁移」（N3）的结构承载点。

#### E4.1 提示词系统接口（行为面载体）

> 提示词系统权威源（两层，本档只交叉引用、不重述——D2）：**需求层** `docs/core/requirements/PROMPT-SYSTEM.md`（内容大纲 = §4.3 人格层/公共层/纪律层表）· **设计层** `docs/core/design/PROMPT-SYSTEM.md`（机制面 = §6 双源落地/装配 + §2 核模块裁决行）。

**纪律分流（v2「约束即结构」核心命题）**：

| 纪律面 | 载体 | 落点 |
|---|---|---|
| 语义写权（谁写需求/设计）· 角色职责（designer 核对 Function Spec 合规、coder 勘察边界）· 互锁（谁写谁把关） | **行为面——提示词**（不可机判） | persona 模板 + `discipline-engineering` |
| token 门 · 段白名单 · 冻结窗口 · 机检判据 | **机械面——代码**（可机判，M1–M8） | 产品代码 + manifest 声明面 |

**模板落点**（各装什么）：persona ×7（engineering=主 agent / coder / eng-coder / eng-designer / explore / plan / normal）· discipline ×2（engineering / normal）· common · advisor ×4 · consult-base——权威内容大纲见需求层 `PROMPT-SYSTEM.md` §4.3（不在此重述）。

**双面流程**：模板 = 中文审核面、落地 = 英文运行面（M9——翻译生成，无机检门）——双面流程见设计层 `PROMPT-SYSTEM.md` §6.1。

**变更点（v2 对提示词系统的改动，落 `PROMPT-SYSTEM.md` 同步）**：M9 双面流程（§6.1 收正——中文审核面 → 翻译 → 英文运行面）· 纪律分流（搬到结构后从提示词移除）· designer 职责收正（§7.3）· 删「方案选型对比」纪律 · coder 勘察边界（待裁）。

#### E5 情境架构（v2 §9）

**情境旋钮 → manifest 字段**：

| 旋钮 | 取值 | manifest 字段 |
|---|---|---|
| 阶段 | 初始开发 / 上线运行 | `phase` |
| 轮次 | 本批第 N 次实现轮 | （不落字段——随批次档生命周期，批次档 §5 轮次计数承载） |



`phase` 字段保留（阶段旋钮落 manifest 不变）——**其模型侧可感知性由下方 E5.1 情境行承载**。

轮次窄带（v2 §9.3）：「修复轮……**禁全量勘察**。派单必带「轮次」字段，修复轮小事回到分钟级」——轮次约束由任务书强制字段承载（见模块设计 `AGENT-LOOP-SUBAGENT.md` 的 §6.22 F2）。

#### E5.1 情境值 → 模型注入（#28 定案 · 2026-09-17）

情境旋钮不能只住机制侧：`phase` 的消费方（模型行为）在**模型上下文**里，而现状是「机制可读、模型零注入」——模型级情境行为无从驱动。定案如下（逐条机判，判据 = 模块设计 `docs/core/design/MANIFEST.md` §2.6 + §3.1 AC-N1–AC-N6、AC-N3b）：

| # | 定案点 | 结论 |
|---|---|---|
| 1 | 注入形态 | **逐回合 transient 机器行**（`{role:"user", content:"[System reminder: …]", transient:true}`——与 env 行同族，不进人读记录） |
| 2 | 字段集 | `phase`（唯一模型侧无其他载体的情境值）；`docRoot` **不入本行**（路径已由提示词层承载，注入五路径 = 噪声 + 双源冲突；模型侧读 `docRoot` 另议） |
| 3 | 逐字行形 | `[System reminder: project state: phase: <值> (discipline: <light\|strict>).]`（未知 phase → 无标签：`…phase: <值>.]`，只出值、不编判据） |
| 4 | 推送时机 | **depth-0 逐回合**（CLI = `thincoder-core/agent/run-stages.mjs` 回合注入组 · VSC = `thincoder-vscode/src/agent.mjs` 同点）；**幂等**——history 已有同文行即不推（零副作用） |
| 5 | 压缩生存 | **活体守卫自愈重推**——压缩吞掉该行 → 下一回合守卫判「无活体」→ 重推；**不落 system 槽**（system 提示词 = 静态槽文件装配 + 前缀缓存契约，写可变值即破缓存语义；技术待办 #23 的 system 槽方案不适用于本行） |
| 6 | 值变化 | **单活体**：值变（如阶段推进 `initial-dev` → `production`）→ 就地摘旧行 + 推新行（保 `history` 数组引用） |
| 7 | 注入深度 | **仅 depth-0**（manifest 是主 agent 的状态账；子代理读任务书，M5 零 manifest 读面——§2.4） |
| 8 | 模式门 | **仅工程模式**（`agent.config.agent.engineering === true`）——normal 模式无 manifest 纪律，不注入 |

**行的语义**：`phase` = 纪律强度档（需求 v2 §9.1「初始开发（探索方向，纪律可轻）/ 上线运行（防回归，纪律要强）」——行内标签是对 §9.1 的**呈现**，不新增判据）。**值 → 行为的完整映射**（各档具体怎么调纪律）住提示词层——本批只落「模型可感知」；提示词侧映射句属提示词内容权（主 agent），不在本批。

#### E6 评审凭证（v2 §8.5）

**继承 v1**（`DESIGN-TOKEN-SETTLEMENT` + `ENG-TOKEN-BINDING` + `ADVISOR-CONVERGENCE`）——「评审 + token 门是 v1 已验证可靠的机制，v2 继承不取消、不重写（只微调）」：

- advisor 设计评审 → 通过签发 `designId:token`（`uuid:expiresAt`，TTL 7 天可配）→ 入槽文件（会话态，凭证不落文档）；
- token 门 = eng-coder spawn 的机械门（无活槽即拒，fail-closed）——M4 写权门禁；
- 链终消费（`consume-design` 清槽，同 id 再 spawn 机械拒）；
- 轮次衰减 / 会话隔离 / 失败护栏（六 kind 不签发） / 失败结论。

**微调点（本档裁定，唯一差异）**：评审对象清单来源 = **manifest `docRoot`（声明面）**（M6 落点），不再硬编码本仓 `docs/` 路径——与 v2「可迁移」（N3）对齐；评审语义判据 / 凭证机制本体 / 门禁 / consume 零改。

#### E7 工程模式 plan 面排除（FR31 · v2 §13.9 · 2026-09-21）

**问题**：工程模式主 agent 的职能本身即「设计先行」（设计 → 评审 → 批准 → 实施），与 plan 模式语义重叠；其退出话术（`PLAN_EXIT_REMINDER`，`thincoder-core/agent-tools/plan.mjs:21-23`：「Start implementing your plan … No need for … further confirmation」）
与工程链条直接冲突 ⇒ 模型在工程模式下频繁入 plan 模式（用户实测 glm-5.3-flash）= 系统性误导源。

**三结构面（= FR31 三条裁决，各带判据）**：

| # | 面 | 结构 | 判据（可机判） |
|---|---|---|---|
| ① | 装配面 | `assembleFamilyTools` 固定段按模式裁剪（`thincoder-core/agent/family-tools.mjs:173`）：工程模式固定段 = `[task, timer]`，plan 不入表——**模型不可见** | 工程模式装配名集不含 `plan`；普通模式含（回归） |
| ② | 命令面 | `/plan`（`thincoder-cli/src/tui/cmd-plan.mjs`）· ACP 两入口（`handlers-session.mjs` `applyConfigOption` `mode` 分支 · `session/set_mode`）· VSC 面板开关（`chat-panel.mjs` `_setPlanMode`）工程模式一律拒绝 + 提示可见 | 拒绝后 `planMode` 不变 + 提示可见（非静默失败） |
| ③ | 残留清零 | 单点 `clearPlanMode(agent)`（`agent-tools/plan.mjs`）：清 `planMode` + 两 reminder 计数 + **未注入的 plan 提示语**；三个翻转点 + 两个恢复点复用 | 工程模式真值 ⇒ `planMode` 恒 false（含槽恢复面） |

**排除面矩阵（FR31 边界项——本档裁定，逐格给理由）**：

| 面 | 是否排除 | 理由 |
|---|---|---|
| depth-0 主 agent · CLI | 是 | 需求本体（用户实测场景）；`/eng` 与核 `eng` 工具两处翻转点须清零 |
| depth-0 主 agent · VSC | 是 | 同一产物两端同源（§13.2「两端同一套、各自实现」）；端差仅在「模式位由谁传」（见下） |
| depth>0 子代理（eng-coder / eng-designer / explore · 工程模式） | **是** | ① 子代理的「计划」= 任务书（父侧已做）——入 plan 只会自我只读化，与其职责（写设计 / 实现审计 / 勘察）冲突；② 话术冲突同在主代理；③ 角色面已排除而工具面留口 = 半排除：工程模式 role enum 已无 `plan`（`family-tools.mjs:44-48`）+ spawn 门机械拒 `role='plan'`（`agent-tools/subagent.mjs:253-255`）；④ 判据句最短「工程模式则无 plan 工具」，不带深度分支 |
| 普通模式（全深度、两端） | 否 | FR31 边界：普通模式零改（`persona-normal.md:25-27` 的 plan 引导照常有效） |

**端差面（两产品各自实现，语义同源）**：

- CLI 路径 = 核 `thincoder-core/agent/setup.mjs:163-168`，**已传** `engineering`（`:165` 取 `agent.config?.agent?.engineering === true`）⇒ 核改一处即生效；
- VSC 路径 = `thincoder-vscode/src/agent/setup.mjs:132-142` **未传** `engineering`（端差原因：该参数的既有唯一消费点 `filteredSubagent` 被端侧 `decorate.subagent` 整体替换 ⇒ 端侧无消费点）。**本批新增的固定段裁剪不被 `decorate` 覆盖** ⇒ VSC 须补传，且装配块（`:125-191`）须下移至模式判定（`applySlotSessionState`，`:267`）之后方能取值——两个产品从此同口径：装配入参 = 工程模式真值。
- VSC 深度>0 路径须实核一条：子代理的工程模式真值来源（核 spawn 强制 `childConfig.agent.engineering = true`，`agent-tools/subagent-spawn.mjs:341-344`）；实测若子代理面派生为 false 而强制位为 true ⇒ 以强制位为准（判据 = eng-coder 子代理装配不含 `plan`），同批收正。

**判据链（不变量式，消费面零改）**：

```text
engineering 真值 ──► 固定段裁剪（plan 不入表）──────────► 模型不可见（①）
                ├──► 命令面拒绝（/plan · ACP · VSC 面板）─► 半状态不产生（②）
                └──► clearPlanMode（三翻转 + 两恢复）────► planMode 恒 false（③）
                         └─► 五处消费面零改：dispatch.mjs:167 · run-stages.mjs:98 · context.mjs:344
                             · render-frame.mjs:222,225（PLAN│ 横幅）· session.mjs:128（槽保存）
```

**受影响文件表**（行数 = as-of 2026-09-21 实测；测试面落点 = T10–T14 的建议就近档）：

| file | 行数 | 改动面 |
|---|---|---|
| 核 `agent/family-tools.mjs` | 174 | 固定段按 `engineering` 裁剪（`:173` 返回式 + 注释）；`:27` 解构形态零改（`test/tool-registry.test.mjs:102` 源扫描依赖） |
| 核 `agent-tools/plan.mjs` | 86 | 新增 `clearPlanMode(agent)` + 拒绝文案常量（TUI / ACP / VSC 三面共用一条） |
| 核 `agent-tools/eng.mjs` | 102 | `enter` 分支（`:85` 翻态后）调 `clearPlanMode` |
| 核 `session-lifecycle.mjs` | 305 | 槽恢复面清零（`:101` planMode 与 `:111-114` engineering 判定之后） |
| CLI `thincoder-cli/src/tui/cmd-plan.mjs` | 10 | 工程模式拒绝分支（提示行 + 零翻转） |
| CLI `thincoder-cli/src/tui/cmd-eng.mjs` | 94 | ON 翻转后 `clearPlanMode` + 槽 `data.planMode = false` + 清零提示行 |
| CLI `thincoder-cli/src/acp/handlers-session.mjs` | 240 | `applyConfigOption` `mode` 分支（`:80-84`）+ `session/set_mode`（`:224-238`）拒 plan（`normal` 照常——唯一合法态，幂等） |
| VSC `thincoder-vscode/src/agent/setup.mjs` | 495 | 装配块（`:125-191`）下移至模式判定后 + 传 `engineering`；拆分方案见下 |
| VSC `thincoder-vscode/src/agent/agent-state.mjs` | 149 | `:110` 槽恢复清零（engineering 优先于槽 planMode） |
| VSC `thincoder-vscode/src/extension/chat-panel.mjs` | 441 | `_setPlanMode`（`:314-319`）工程模式拒绝（不写槽 + 回弹） |
| VSC `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 202 | `handleSetEngineeringEnabled`（`:171-176`）ON ⇒ 调 `panel._setPlanMode(false)` |
| VSC `thincoder-vscode/webview/mode-buttons.js` | 119 | 工程模式 plan 按钮 disabled + 点击守卫（`applyModeButtons` `:16-23` · 点击 `:35-39`） |
| 核 `test/family-tools.test.mjs` | 131 | 工程模式固定段断言（depth-0 + 子代理面）；普通面既有断言零改 |
| CLI `test/cmd-plan.test.mjs` | 新建 | `/plan` 工程拒绝 + 普通模式回归 |
| CLI `test/cmd-eng.test.mjs` | 124 | 清零断言（内存位 + 槽位） |
| CLI `test/acp-contract.test.mjs` | 363 | `set_mode` / `set_config_option` 拒绝断言 |
| CLI `test/session-store.test.mjs` | 389 | 恢复清零断言（槽 `engineering` + `planMode` 双真） |
| VSC `test/agent-lifecycle-singleton.test.mjs` | 491 | 槽恢复清零断言（`_planMode`） |
| VSC `test/chat-panel-messages.test.mjs` | 462 | `_setPlanMode` 拒绝断言 |

**VSC `thincoder-vscode/src/agent/setup.mjs` 拆分方案（登记 · 本批不执行）**：该档 495 行 > 300 软线 ⇒ 拆分方案 = 装配段（家族段调用 + `tools`/`toolByName`/`toolSchemas` 构建）迁入既有邻档 `thincoder-vscode/src/agent/setup-tooltable.mjs`（该档已是工具表装饰面之家，缝现成）；触发条件 = 本批改动后越 500 硬限，或下一次触碰该档的批。本批净增 ±0 行（等量位移 + 1 行入参），不触发。

**提示词面（评估结论 = 零改，理由三条）**：① 工程两档（`persona-engineering.md` / `discipline-engineering.md`）与中文模板零处指示 plan 模式（实读 grep 命中仅「并发池上限：其他角色（explore/plan/coder）池」= 角色域枚举，非 plan 模式指令）；② 工具不注册已由结构兜底——再加「不要用 plan 模式」句 = 为不可见选项写限制（承 2026-09-18 反模式之裁）；③ `ENG_ON_REMINDER`（`agent/helpers.mjs:376-381`）无 plan 字样，无悬挂指令。

**边界（不做什么）**：普通模式零改（工具 / 命令 / ACP / 恢复四路径全带宽）· 两条 reminder 文本本体不改（`plan.mjs:11-23`——普通模式仍用）· 不新增机械门（拒绝点 = 既有命令面与既有翻转点）· 不改 `_setPlanMode` 的槽写契约（仍 = 槽写 + 回推面板）· VSC 不加新 i18n 键。

### 2.4 模块间接口 / 依赖

| 依赖 | 方向 | 接口（契约） |
|---|---|---|
| M4/M6/M8/M9 → M1 | 读 | manifest schema 字段（`docRoot` / `checkConfig` / `phase` / `promptsLanding`） |
| M3 → M1 | 读 | `docRoot.batches`（第二基底复判——双基底落点；缺键用 M1 默认值 fallback） |
| M1 → 模型上下文 | 写 | 情境行（`phase`——transient 机器行，E5.1；depth-0 + 工程模式门） |
| M2 ⇄ M3 | 互指 | 两账咬合（条目 `task_book` 指针 → 批次档 §2） |
| M4 → M1 | 读写 | manifest 写门 + 台账写命令装配（仅主 agent） |
| M4 → M6 | 读 | 槽文件（token 门读 M6 签发的凭证，无活槽即拒） |
| M6 → M4 | 读 | `resolveReviewTargetPaths`（M4 拆出的 `write-gate.mjs` 单一权威源——M6 复用，避免 advisor → dispatch 循环依赖） |
| M5 → M1 | **零读面** | spawn 门判据不依赖 manifest |
| M5 → M4 | 读 | eng-coder spawn 需活 token（活槽判据） |
| M8 → M1 | 读 | `checkConfig`（扫描域/阈值/豁免）+ `docRoot`（目录落点） |
| M9 → 文件 | 读/写 | 模板目录 → 落地目录（翻译生成） |
| M6 → M1 | 读 | 评审对象来源 = manifest `docRoot`（声明面，E6 微调点） |
| M11 ← VSC 装配 | 读 | `engineering` 模式位（端差面：VSC 装配块下移后取派生值——E7） |
| M11 → planMode 五消费面 | 不变量 | 「工程模式 ⇒ `planMode` 恒 false」——`thincoder-core/agent/dispatch.mjs:167` · `thincoder-core/agent/run-stages.mjs:98` · `thincoder-core/context.mjs:344` · `thincoder-cli/src/tui/render-frame.mjs:222,225` · `thincoder-core/session.mjs:128` 零改 |

### 2.5 整体数据流

```text
进入（读 manifest phase，无则初始化；情境值随后由 E5.1 情境行进模型上下文）
  └─► 需求进台账（items.status=待讨论，主 agent）
        └─► 攒批（阈值触发）→ 开批（批次档 §1）
              └─► eng-designer 设计（§2 任务书 + 架构/模块设计档）
                    └─► advisor 设计评审（§3 发现表）
                          └─► 用户批准 → token 签发（槽文件）
                                └─► eng-coder 实现（§5 实施记录 + token 门放行）
                                      └─► 父侧验收 + 代码评审
                                            └─► 收口（一次事务：§6 非空 + 台账核销归档）
                                                  └─► 批次档冻结
（多批并行：各批按本链各走一份——批次档 / 台账条目 / 共享文档层可同时在飞；
  链上无全局互斥点、无「当前批次」单槽）
```

### 2.6 关键技术决策

| # | 决策 | 理由 |
|---|---|---|
| KD1 | 台账 = SQLite 单表 + `status` CHECK 枚举（归档 = 状态子集） | 单表更简、枚举机械锁死、COUNT 单源；归档语义用 `status` 值表达足够 |
| KD2 | manifest `checkConfig` = 机检声明面 | 硬编码脚本参数不可迁移（N3 违），且本仓路径烧进产品（v1 病根） |
| KD3 | 写权门禁 = 机械面（继承）+ 行为面（提示词）分层 | 语义写权不可机判（谁写需求 = 语义），纯提示词无机械兜底 |
| KD4 | 机检引擎 = 单引擎 + 声明面 | 双引擎双源域 = 漂移源（v2 §8.7 明确要砍） |
| KD5 | 提示词 = 模板中文审核面 + 落地英文运行面（翻译生成，无机检） | 2026-09-17 用户裁定：不设机检（无限机检反感）；一致性由收口核对兑底 |
| KD6 | token 门 = 继承 v1 零改，仅评审对象来源改读 `docRoot` | 重写 token 门无必要（v2 §8.5 明示「继承 v1 只微调」） |
| KD7 | 台账直用 `node:sqlite`（零依赖） | 引入第三方 SQLite 包违零依赖硬约束（ARCHITECTURE §1.1 约束 4） |
| KD8 | plan 排除形态 = 卸载（不注册）而非「注册 + 报错」 | 用户 2026-09-21 00:57 裁决①：看不见的选项不会被选；注册但报错 = 白烧干扰回合 |
| KD9 | 裁剪落点 = 核单源 `family-tools.mjs`（端壳不二次过滤） | 同一条规则两端各实现一次 = 两份矩阵（`2026-09-15-vsc-tool-table-dup` 批的类根因）⇒ 端侧只补传模式位 |
| KD10 | 清零 = 单点 `clearPlanMode`（三翻转 + 两恢复复用） | 清零点含「未注入 plan 提示语」过滤（否则 `PLAN_EXIT_REMINDER` 可跨模式落地）；内联 = 五份副本 |
| KD11 | 排除面 = 全深度（含子代理）+ 两端 | 见 §2.3 E7 矩阵：角色面已排除（role enum + spawn 门），工具面留口即半排除；判据句最短 |

> **KD7 风险登记（已实核 2026-09-17）**：`node:sqlite` 在 Node 24（24.18.0）可用、无需 `--experimental-sqlite`——建表（含 `trigger` 裸列）/ INSERT / CHECK 拒非法值 / NOT NULL 拒 NULL 均实测通过（M2 模块档 AC-6 / AC-M2-6 记录）。回退方案（第三方 SQLite 包）不再需要。

## 3. 测试层

### 3.1 验收标准（逐条回指需求；可机判项或显式标注人工评审项）

| # | 验收标准 | 回指 |
|---|---|---|
| AC1 | 七条目 E1–E7 各有架构级方案，无空条目 | E1–E7（覆盖） |
| AC2 | 模块划分（§2.2）每行带 v2 依据（章号落在 §5–§9）+ 锚定现有代码模块（现有 file/dir → 变更类型），无抽象目标模块、无缺失行 | §2.2（覆盖） |
| AC3 | manifest schema 字段枚举完整（**五键**：`version` / `phase` / `docRoot` / `promptsLanding` / `checkConfig`——枚举判据 = phase 取值 · docRoot 五子键 · checkConfig 四子键） | E1/E2/E5 |
| AC4 | 台账 schema 含六态 CHECK 枚举 + 咬合必填约束 | E1 |
| AC5 | 写权矩阵每条写权能答「靠哪个门禁」（机械/行为） | E3（N1 结构优先） |
| AC6 | 机检引擎 = 单引擎 + 声明面（`checkConfig`），无硬编码本仓路径 | E4（N3 可迁移） |
| AC7 | token 门声明「继承 v1 + 唯一微调点（评审对象来源读 `docRoot`）」，无其他改动 | E6 |
| AC8 | 与 v2 需求草案无矛盾（引用不越界、不改写需求原文）——**人工评审项**（语义判据，不标可机判） | 全局 |
| AC10 | 每条机制变更带两端接线（§2.2 接线表：核 + CLI + VSC 各命名文件，零改处显式标「零改」） | 全局（重做锚） |
| AC11 | 情境值进模型上下文（#28）：逐字行形 / 幂等 / 值变单活体 / 压缩后自愈重推 / depth-0 + 工程模式门——判据 = 模块设计 `docs/core/design/MANIFEST.md` §3.1 AC-N1–AC-N6、AC-N3b | E5.1（台账 #28） |
| AC12 | 装配面：工程模式装配名集不含 `plan`（depth-0 + 子代理面），普通模式名集含 `plan`——判据 = T10；核单源（两端传模式位） | FR31 ① |
| AC13 | 命令面：`/plan` · ACP `session/set_mode` / `set_config_option` · VSC 面板开关在工程模式下拒绝且提示可见、状态不变 | FR31 ② |
| AC14 | 残留清零：开工程模式（核 `eng` 工具 / `/eng` / VSC 面板开关）与槽恢复（CLI / VSC）后 `planMode` 恒 false——判据 = T12 + T13 | FR31 ③ |
| AC15 | 普通模式全带宽零回归（工具注册 / `/plan` / ACP mode / 槽恢复四路径）——判据 = T14 | FR31 ④ |

### 3.2 用例表

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：两账收口一次事务 | §6 验收结论 + 台账条目状态推进 | 两者同步；任一步失败即回滚（台账回滚 + §6 不写） |
| T2 | 正常：写权机械门禁 | 无 token 写产品代码 / 越段写批次档 | 门禁拒（fail-closed） |
| T3 | 正常：机检读声明面 | manifest `checkConfig` 改阈值 | 机检按声明面判，不按硬编码 |
| T4 | 边界：台账六态枚举 | 写入枚举外 status | schema CHECK 拒 |
| T5 | 边界：manifest 缺字段 | 缺 `docRoot` 键 | 用默认值（便利 fallback） |
| T7 | 错误：token 过期 | spawn 带过期 token | 门禁拒 + 清理槽 |
| T8 | 正常：情境行进模型上下文 | 工程模式 + depth-0 + manifest 有 `phase` | 逐回合恰一行情境行（`…phase: <值> (discipline: <light\|strict>).`）；值不变不重复、值变换新 |
| T9 | 边界：压缩吞掉情境行 | 压缩后 history 无该行 | 下一回合自动重推（活体守卫自愈） |
| T10 | 正常：固定段模式裁剪 | `assembleFamilyTools({depth:0, engineering:true})` / `{depth:1, role:"eng-coder", engineering:true}` / `{depth:0}` / `{depth:1, role:"plan"}` | 前两者名集不含 `plan`；后两者含（普通面回归）；固定段序契约（task 先于 timer）保持 |
| T11 | 边界：命令面拒绝 | 工程模式下 `/plan` · ACP `set_mode{mode:"plan"}` · `set_config_option{configId:"mode", value:"plan"}` · VSC `setPlanMode{value:true}` | 四处均拒 + 提示可见；`planMode` 保持 false；ACP `mode:"normal"` 照常接受 |
| T12 | 边界：翻转清零 | `planMode=true` 后开工程模式（核 `eng` 工具 / `/eng` / VSC 面板开关） | `planMode=false` + 槽 `planMode=false`（CLI `/eng` · VSC）+ 未注入的 plan 提示语被摘除 |
| T13 | 边界：恢复清零 | 槽 `{engineering:true, planMode:true}` → CLI `applySession` / VSC `applySlotSessionState` | 恢复后 `planMode`（VSC `_planMode`）= false |
| T14 | 错误：普通模式零回归 | 普通模式装配 / `/plan` 切换 / ACP `mode:"plan"` / 槽 `planMode:true` 恢复 | 四条路径全带宽不变（既有测试零改全绿） |

## 4. 变更记录

- 2026-09-17（**阶段 1 · 架构设计轮** · eng-designer）：建档——工程模式 v2 机制本体的架构设计；六条目 E1–E6 逐条给架构方案；模块划分确立为后续 Function Spec 权威源。
- 2026-09-17（阶段 1 · 架构设计轮 · **修正轮 1**——评审发现 #1–#6 落地 · eng-designer）：E2 缺 manifest 处置对齐需求 §5.1；AC 表补 AC10（N4）+ AC2 改结构性判据 + AC9 标人工评审项；E4 强制字段补「轮次」；M2 并入 M1 schema+校验（消「或」）；§2.4 token 门依赖方向统一。
- 2026-09-17（阶段 1 · 架构设计轮 · **修正轮 2——模块划分重做** · eng-designer）：模块划分（§2.2）从抽象目标模块（M1–M9）重锚定到现有代码模块（M1–M10，每行「现有 file/dir → 变更」）；新增两端接线表（核 + CLI + VSC，零改显式标注）；§2.4 依赖表 / §2.6 KD7 实现模块引用 / §3.1 AC 表（AC2 收紧 + AC10 新增）同步重做；E1/E4 各机制引用改指新模块号。
- 2026-09-17（阶段 1 · 架构设计轮 · **校准轮——对齐最新需求** · eng-designer）：§2.1 技术选型由「候选对比表」改为「选型决定 + 理由」直接列（去「候选/判据逐项评估/取舍/单方案豁免」措辞）；§2.6 关键技术决策去「含否决备选」标题与「否决备选及理由」列，改「决策 + 理由」；档头写权由「需求/设计档唯一作者」收正为「设计档唯一作者」（v2 §7.1）；§2.2 模块划分 M1–M10 + 两端接线确认符合 §6.3（接线为模块固有部分，就地落本档，无旁路）。
- 2026-09-17（阶段 1 · 架构设计轮 · **校准轮——M7 受影响文件清单按 spec 收正** · eng-designer）：§2.2 M7 行（:70）+ 现状勘察摘要（:78）+ 两端接线表 M7 行（:93）三处按 M7 spec（受影响文件清单以 spec 为准，见批次档 §4）收正——checklist 废除非「死文件纯清理 / VSC 零改」，而是核 + VSC 两端「删除 3 + 挂载/注入/死指针/门禁/注释 + 测试 5 档」的完整接线。
- 2026-09-17（阶段 1 · 架构设计轮 · **修正轮——设计评审发现 #3 回写** · eng-designer）：M1 manifest schema 增顶层键 `promptsLanding`（提示词落地声明面，M9 落点需要——落地是代码仓路径、不入 docRoot；默认 `thincoder-core/prompts`，缺键 fallback 用默认）——§2.3 E1 JSON + 键注释 + 校验枚举、§2.2 M1 行六键 → 七键、§2.4 接口表 M9 读字段、§3.1 AC3 枚举、E2 声明面覆盖同步；M9 模块设计与 M1 规格 ② 同步回写。
- 2026-09-17（阶段 1 · 架构设计轮 · **修正轮——模块设计评审发现 #2 回写** · eng-designer）：§2.3 E1 台账表结构 `kind`/`status` 补 NOT NULL（CHECK 对 NULL 不判——NOT NULL 兜底）；KD7 风险登记由 unverified 收正为已实核（node:sqlite · Node 24.18 实测通过）。
- 2026-09-17（**F3 带宽裁撤** · eng-designer——承 `docs/batches/2026-09-17-bandwidth-repeal.md` §2 · **用户 2026-09-17 裁定**）：E5 行 + E5 节带宽声明改墓志（含轮次窄带残留去活体化）；M5 行职责清「带宽限制 / 轮次窄带」+ 行数 as-of 实测收正（484 / 428）；依赖表（M5 零读面）+ 依赖图 + 机械面表同步去 M5 读面；AC9 裁撤。
- 2026-09-17（**manifest 面收口批** · eng-designer——承 `docs/batches/2026-09-17-manifest-closeout.md` §2 · **用户 2026-09-17 20:11 / 20:13 裁定**）：
  ① **#28 定案**——新增 §2.3 **E5.1「情境值 → 模型注入」**（`phase`/`activeBatch` 逐回合 transient 机器行；幂等 + 压缩自愈重推；depth-0 + 工程模式门），连带 §1.2 E5 行 · §2.2 M1 行/接线表 · §2.4 依赖表（新增「M1 → 模型上下文」行）· §2.5 数据流 · AC11 · T8/T9；
  ② **#29 裁撤**——「接入」旋钮与 `access` 字段全链删除（E5 旋钮表 + E1 JSON + 键注释 + 校验枚举 + 读面残留 `:102`/`:319` 收正 + AC3 + 数据流句），schema 计数由七键 → 六键。
- 2026-09-17（**docRoot 多根批** · eng-designer——承 `docs/batches/2026-09-17-docroot-multiroot.md` §1.2 · **用户 2026-09-17 22:28 裁定**）：E1 键注释新增「`docRoot` 值形态（单串 | 多根数组）」行 + 校验面补值形态判据；E2 新增「值形态」一行；schema 字段集不变（键集与默认值零改——只扩值域），故 AC3 计数不变。值域 / 解析 / 消费面单一权威源 = `docs/core/design/MANIFEST.md` §2.7（D2——本档不重述）。
- 2026-09-17（**activeBatch 裁撤批** · eng-designer——承 `docs/batches/2026-09-17-activebatch-repeal.md` §1.1 · **用户 2026-09-17 23:20 裁定**方案 A「完全撤销，不能存在」）：
  schema 六键 → **五键**（E1 JSON + 键注释 + 校验面）；咬合由**三账**收回**两账**（台账 ⇄ 批次档——事务边界 / 咬合判据 / 纪律兜底行收正）；§2.2 依赖图去 manifest 环 + §2.4 依赖表两行改 M2 ⇄ M3；§2.5 数据流去指针更新并补「多批并行」建模更正；E5 轮次行 + E5.1（字段集 / 逐字行形 / 值变素材 / 行的语义）收正；AC3 改五键 + T1/T6/T8 收正。

- 2026-09-17（**activeBatch 裁撤批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 §3 发现 #3 / #6 / #8）：
  ① **#3**——§1.2 E1 行「+ 三账咬合」→「+ 两账咬合」（`:21`）；M3 行职责去咬合项改「六段门禁 + 段白名单继承 + 状态行冻结拒写」+ 行数按实测收正（297——原 220 陈旧）。
  ② **#6**——§2.4 依赖表补「M3 → M1 | 读 | `docRoot.batches`（双基底）」一行；§2.2 依赖图同步（M3 读边入列 + 原「M2/M3 ⇄ M1」注记限定为「咬合两行」）；图内 M9 落点改「读 `promptsLanding`」（原「读 docRoot」与 E1 键注释 / §2.4 表相左）。
  ③ **#8**——E4 纪律兜底行（`:267`）改指实际落点（M2 咬合 CHECK · AC-M2-5 = 非空 `task_book`）并把「`task_book` 指向档存在」登记为**缺口**（消解路径入行——原「机检器」表述无落点）。
- 2026-09-21（**ENG-PLAN-EXCLUSION 批** · eng-designer——承 `docs/batches/2026-09-21-eng-plan-exclusion.md` §1 · **用户 2026-09-21 00:57 三裁批准**）：新增 §2.3 **E7「工程模式 plan 面排除（FR31）」**
  （三结构面 + 排除面矩阵（含子代理面结论）+ 端差面 + 判据链 + 受影响文件表 + 拆分方案登记 + 提示词面零改结论）；计数面六条目 → 七条目（§1.1 / §1.2 / §2.3 / AC1，D3）；
  §2.2 新增 M11 行 + 接线表行；§2.4 依赖表 +2 行；§2.6 新增 KD8–KD11；§3.1 新增 AC12–AC15（回指 FR31 四条）；§3.2 新增 T10–T14。
- 2026-09-18（**失效表达清理批 · 本批直接执行 · 可 revert**——承用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）：删除现役规范面内的失效表达（不留划改残留）——§2.2 依赖图注 1 行 · §2.3 E1 三账分工句 / 校验行退役括注 / 事务边界句 / 原单槽判据 1 行 · E4 纪律兜底表 D5 行与两账行 / 提示词双面流程句；
  E5 旋钮节「接入」导语 + 墓志 2 行 + 后续两处「接入」句 · E5.1 字段集行 · §2.4 依赖表两行 · §2.5 数据流句 · §2.6 KD5 理由句 · §3.1 AC3 / AC9 · §3.2 T6。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。
