# 工程模式 v2 · 模块设计（M4 写权门禁）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M4）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-WRITE-GATE.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 门禁与流程族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

把**写权矩阵**从「靠提示词自觉」落成**机械门禁**：没有 token 写不了产品代码（token 门），评审在途改不了被审文档（D5 冻结窗口）。v1 已实现这两道门，但**评审对象 / 被审文件路径来源仍沿 v1 的 conventions 分类**，未接入 v2 的 manifest `docRoot` 声明面——「可迁移」（N3）在本模块的落点就是**去硬编码 `docs/` 路径**。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | token 门（继承 v1）：eng-coder 写产品代码需活 designToken，无活槽 → 拒（fail-closed） | ②.1 |
| F2 | D5 冻结窗口：设计评审在途，被审文件集（设计档 + 批次档）零写入——写入即拒 / 本轮结算为陈旧（不发 token） | ②.2 |
| F3 | 声明面读取：评审对象清单 / 被审文件路径从 `manifest docRoot` 取，去硬编码 `docs/` | ②.3 |
| F4 | 写命令装配：台账 / manifest 写命令仅主 agent 装配（非主 agent → 拒） | ②.4 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | fail-closed | 无 token / 冻结窗口内 → 机械拒，无静默放行 |
| N2 | 可迁移 | 评审对象 / 被审文件路径读 manifest `docRoot`，不硬编码本仓 `docs/` |
| N3 | 分流≠绕门 | 变更面分流与门禁不一致 → 停下上报，非静默放行（AC-M4-5） |

### 1.4 范围边界（本模块不做）

- 不做 token 签发（M6）；不做评审判据（advisor）。
- 不重写 v1 门禁本体（继承 + 声明面微调）。
- 不做语义写权判断（「谁写需求谁写设计」不可机判——落提示词层 + 互锁兜底）。

## 2. 设计层

### 2.1 方案与理由

继承 v1 门禁本体，唯一增量 = 评审对象 / 被审文件来源改读 manifest `docRoot`。不重写 token 门（架构 §2.6 KD6「继承 v1 零改，仅评审对象来源改读 docRoot」）。

**核心增量（F3 声明面读取）**：

1. 抽一个「评审目标解析」单点：`resolveReviewTargetPaths(agent)`——读 manifest `docRoot`（缺 `docRoot` 键 → 用默认值 fallback，与架构 §2.3 E2 同源），产出评审对象 / 被审文件的绝对路径集合。
   **落点 = 新文件 `thincoder-core/agent/write-gate.mjs`**（不是 `dispatch.mjs`）——M6 的 `advisor.mjs` 也要 import 同源导出（架构 §2.4 M6→M4 边）：落 `dispatch.mjs` 会让 `advisor.mjs` 反向 import 门禁簇（`dispatch.mjs:19` 已 import `advisor-async.mjs`——簇间回边，环风险）；`write-gate.mjs` 无上游依赖，双向消费不成环。
2. token 门（`anyLiveDesignSlot`）与冻结窗口（`inflightDesignReviewConflict`）消费该单点，替代 v1 的 `loadConventions`/`isDocPath` 分类；**冻结窗口判据组装（被审文件集 = 声明文档集 + 批次档的合流点）同落 `write-gate.mjs`**——`dispatch.mjs` / VSC `tool-gates.mjs` 只 import 消费。

3. **AC-M4-5（修 ≠ 绕）的落点**：继承 v1 单一权威分类——`loadConventions`/`isCodePath`（`dispatch.mjs:199,204`）+ 拒绝文案 hint/convNote（`dispatch.mjs:207-213`）：分类与分流不一致时 token 门照拒（fail-closed），模型侧「停下上报」由该文案触发——v2 **不新增独立谓词、零新增编辑点**（继承零改原则）。
   规格侧缺口：spec ④ 的 AC-M4-5 在 ② 功能点无对应条（②.1-②.4 无「修≠绕」）→ 待主 agent 确认（补功能点 / 收窄），见批次档 §2 待确认清单。

**F4 写命令装配的归属澄清**：台账写门落 M2（ledger 命令装配）、manifest 写门落 M1（manifest 读写装配）——架构 §2.3 E3 门禁落点表已裁定。**本模块不实现 F4**，只记录承接关系（详见 §2.4 KD-M4-2）。

### 2.2 架构 / 接口 / 数据流契约

```text
写工具（product-code write） ─► dispatch.mjs（核） / tool-gates.mjs（VSC 镜像）
  ├─ token 门：anyLiveDesignSlot / validateDesignToken ── 无活槽 → 拒（继承）
  ├─ 冻结窗口：inflightDesignReviewConflict ── 评审在途写被审档 → 拒（继承）
  └─ 评审目标来源：resolveReviewTargetPaths(agent) ← manifest.docRoot（新增）
```

**接口（核心）**：

- 继承：`executeToolCalls`（`dispatch.mjs:139`）· `noteExecutedMutation`（`dispatch.mjs:121`）· VSC `preGateBlocked`（`tool-gates.mjs:61`）· `collectBatchPermission`（`tool-gates.mjs:140`）。
- 新增：`resolveReviewTargetPaths(agent)`（读 `docRoot` → 评审对象/被审文件绝对路径集合）+ 冻结窗口判据组装——**落 `thincoder-core/agent/write-gate.mjs`（新文件）**；`dispatch.mjs` / VSC `tool-gates.mjs` / M6 `advisor.mjs` 三向 import 消费（单一权威源，不重复实现）。
- 现有 predicate 复用（不改签名）：`inflightDesignReviewConflict`（`advisor-async.mjs`）· `anyLiveDesignSlot`（`token-ttl.mjs:211`）· `validateDesignToken`（`design-token.mjs:53`）。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/agent/dispatch.mjs` | 490 | 修改（**拆分**——见下） | -40 ~ -50（净回落） | `executeToolCalls`（139 行）冻结窗口分支改 import 消费 `write-gate.mjs` |
| `thincoder-core/agent/write-gate.mjs` | 0 | 新增 | +~60 | `resolveReviewTargetPaths` + 冻结窗口判据组装 |
| `thincoder-vscode/src/agent/tool-gates.mjs` | 165 | 修改（VSC 独立同语义镜像） | +10 ~ +20 | `preGateBlocked`（61 行）冻结窗口分支改 import `write-gate.mjs` 同源导出（替代镜像自带解析） |
| `thincoder-cli/` | — | **零改** | — | 核内门禁，CLI 经 `@thincoder/core` 单源 import |

**拆分（无条件——必然触发）**：`dispatch.mjs` 490 行 + 最低增量 20 = 510 > 500 硬上限——拆分非「候选」而是**必然动作**：抽出「评审目标解析 + 冻结窗口判据组装」到 `thincoder-core/agent/write-gate.mjs`（新文件，~60 行），`dispatch.mjs` 改 import 消费——拆出后 `dispatch.mjs` 回落到 ~450 行。
   拆分点 = `resolveReviewTargetPaths` + 冻结窗口谓词组装（非 `executeToolCalls` 主循环——主循环拆会破坏 two-phase 顺序保证）。附带收益：M6 复用零回边（§2.1#1）。

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M4-1 | 评审目标来源改读 `docRoot`（弃 `loadConventions`/`isDocPath` 分类） | 架构 E6 微调点 + N2 可迁移；conventions 分类仍保留为「代码路径判定」用，评审对象 / 被审文件路径改走 manifest 声明面 |
| KD-M4-2 | F4（台账/manifest 写命令装配）落点归 M1/M2，本模块不实现 | 架构 §2.3 E3 门禁落点表已裁定台账写门→M2、manifest 写门→M1；本档只记录承接，避免 M4 与 M1/M2 重复实现同一门禁 |
| KD-M4-3 | 冻结窗口 + token 门两谓词复用 v1 现有导出，不改签名 | 继承零改原则；「改读 docRoot」只落在「评审目标来源」一处，不扩散到谓词本体 |
| KD-M4-4 | 拆分无条件执行：`resolveReviewTargetPaths` + 冻结窗口判据组装落新文件 `write-gate.mjs` | `dispatch.mjs` 490 + 最低增量 20 = 510 > 500 硬上限（必然越界）；且 M6 的 `advisor.mjs` 反向 import `dispatch.mjs` = 簇间回边（`dispatch.mjs:19` 已入 advisor 簇）——`write-gate.mjs` 无上游依赖，双向消费零回边 |

### 2.5 与既有纪律冲突核对

- **F4 归属（规格 vs 架构）**：✅ 已一致——现行规格 ②.4 已写「装配点在 M1（manifest 写门）+ M2（台账写命令），M4 只承接」，AC-M4-4 已写「验证随 M1/M2 批」；与架构 §2.3 E3 门禁落点表同源，无待确认项。
- **「在途」窗口下界**：D5 在途下界 = 报告送达（digest 注入 / 回合尾 collect）或取消·中止——「子进程退出」不是窗口边界（规格 ②.2）。本模块复用 v1 的 `inflightDesignReviewConflict` 判据，不重新定义窗口。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | 无活 token 写产品代码 → 拒 | AC-M4-1 | ✅ 清槽后写 → 期望拒 |
| AC-2 | 冻结窗口内写被审文档 → 拒 / 结算为陈旧 | AC-M4-2 | ✅ 评审在途写被审档 → 期望拒 |
| AC-3 | 评审对象 / 被审文件路径读 `docRoot`（非硬编码 `docs/`） | AC-M4-3 | ✅ grep 硬编码路径 → 零命中（范围 = 评审目标解析函数及其消费点，排除代码路径判定保留面） |
| AC-4 | 台账 / manifest 写命令非主 agent → 拒 | AC-M4-4 | ✅ 非主 agent 写 → 期望拒（**落点 M1/M2，见 KD-M4-2**） |
| AC-5 | 修 ≠ 绕：分流（变更面）与门禁不一致 → 停下上报（继承 v1 分类 + 拒绝文案触发，零新编辑点——§2.1#3） | AC-M4-5 | ✅ 构造不一致场景 → 期望上报（规格侧缺口：② 无对应功能点——待确认，见 §2.1） |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：活 token 写产品代码 | coder 持有效 token 写 | 放行 |
| T2 | 正常：非产品代码路径写 | 写 `docs/` 文档档 | 不触发 token 门 |
| T3 | 边界：评审目标读 `docRoot` 缺键 | manifest 缺 `docRoot` 键 | 用默认值（便利 fallback） |
| T4 | 错误：无 token 写产品代码 | 清槽后写 | 拒（fail-closed） |
| T5 | 错误：评审在途写被审档 | 评审 in-flight 写设计档 | 拒 / 结算为陈旧 |
| T6 | 错误：分流与门禁不一致 | 工程工具面路径按产品代码门禁判 | 停下上报（非静默放行） |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 门禁与流程族 · eng-designer）：建档——M4 写权门禁模块设计；继承 v1 token 门 + D5 冻结窗口，评审对象/被审文件来源改读 manifest `docRoot`；F4（台账/manifest 写命令装配）落点划归 M1/M2 承接；验收逐条回指 AC-M4-1..5。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 门禁与流程族评审修正 · eng-designer）：设计评审修正轮——#6 AC-M4-5 落点（继承 v1 分类 + 拒绝文案，零新编辑点；规格侧缺口上报）· #7 无条件拆分（`write-gate.mjs` 新文件，`dispatch.mjs` 净回落 ~450，M6 复用零回边）；三方条目不变。
