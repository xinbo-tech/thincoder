# 工程模式 v2 · 模块设计（M5 委派与 spawn 门）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M5）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 门禁与流程族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

委派治理的**结构承载**：任务书必须带齐字段（尤其「轮次」），带宽由 manifest 情境旋钮机械限制——瞎下的指令被门拒，而不是被自觉忽略。v1 已有 `batchDoc` 参数门（`subagent-spawn.mjs:245-264`）与 token 门，但缺三样：**任务书强制字段校验**（尤其「轮次」）、**带宽机械限制**（读 `phase`/`access`）、**files 声明面的过程档 / 工程工具面拦截**。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | `batchDoc` 参数门：缺参 / 路径不可解析（不可读文件）→ 机械拒 | ②.1 |
| F2 | 任务书强制字段校验（目标与理由 / 轮次 initial|fix / 已知事实 / 设计要点与禁止范围 / 验收标准 / 交付报告格式） | ②.2 |
| F3 | 带宽机械限制：读 manifest `phase` / `access`，决定「允许怎么跑」 | ②.3 |
| F4 | ~~轮次窄带：修复轮 + 全量勘察 → 机械拒~~ **裁撤**（主 agent 2026-09-17：散文 marker 不可机判，误拒风险 > 收益；由 F2 五段字段 + F3 带宽覆盖） | ~~②.4~~ |
| F5 | 角色 enum 校验：explore / eng-designer / eng-coder（**advisor 不入**——评审走 advisor 工具通道，不入 spawn 通道） | ②.5 |
| F6 | files 声明语义：内容产物（源/测试/设计档），不列工程工具面（`scripts/**`）、不列过程档（台账/CHANGELOG） | ②.6 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | fail-closed | 缺 batchDoc / 缺强制字段 / 修复轮全量勘察 → 机械拒 |
| N2 | 可迁移 | 带宽读 manifest `phase`/`access`（非硬编码），改 manifest → 行为变 |
| N3 | 零裁量 | 任务大小不是本门判断项——工程模式下所有请求走全流程（不做「太小跳过」豁免） |

### 1.4 范围边界（本模块不做）

- 不做实现（eng-coder 职责）；不做 token 签发（M6）。
- 不重写调度器本体（继承 v1）；不做并发池（继承）。
- 不判断「任务大小」（零裁量）。

## 2. 设计层

### 2.1 方案与理由

**继承 + 增量**（v1 spawn 门是唯一可继承现状）：

| # | 增量点 | 方案 | 理由 |
|---|---|---|---|
| 1 | F1 batchDoc 门 | **继承**（`subagent-spawn.mjs:245-264` 已实现） | 判据只到「参数在 + 路径可读」，不校验内容/措辞——内容够不够由执行者拒收兜底（需求 §1.14 #9 行为面） |
| 2 | F2 轮次字段 | **新增结构化 spawn 参数 `round`**（enum `initial`/`fix`；必带集合 = eng-coder/eng-designer，explore/advisor 豁免——§2.2） | 轮次是机械门判据（修复轮窄带 + 带宽），结构化参数比散文 marker 可靠；「派单必带」= 无默认值 |
| 3 | F3 带宽 | **读 manifest `phase`/`access`** → `resolveBandwidth` 六格枚举映射（§2.2 附表：from-zero=1 · mid-梳理中=2 · mid-已梳理=4；phase 暂不区分）——数值已由主 agent 2026-09-17 裁定回写 | 架构 E5「三旋钮落 manifest + 机械限制」；阈值不留散文 |
| 4 | ~~F4 轮次窄带~~ **裁撤**（2026-09-17 主 agent 裁定：全量勘察 marker 不可机判——见 §4） | — |
| 5 | F5 角色 enum | **工程模式 enum 收正为 explore/eng-designer/eng-coder**（advisor 不入——2026-09-17 主 agent 裁定） | 架构 §2.4 依赖表 + E3 四角色；`plan` 待定、normal-mode `coder` 不属工程角色 |
| 6 | F6 files 声明面 | 复用 `normalizeFileList`（`scheduler.mjs:41`）+ 新增「`scripts/**` / 过程档」拦截（拦截谓词落 `spawn-gates.mjs`） | 内容产物 only；目录声明已被 `normalizeFileList` 拒（继承） |

新增门禁逻辑统一落 `spawn-gates.mjs`（§2.3 拆分）：`buildSpawnChild` / `normalizeFileList` 只加 import 调用——门禁本体集中、装配点增量 ≤10 行。

### 2.2 架构 / 接口 / 数据流契约

```text
spawn(role, batchDoc, round, files, task, ...)
  ├─ 角色 enum 校验（F5）── 非法 role → 拒
  ├─ batchDoc 门（F1，继承）── eng-coder/eng-designer 缺参/不可读 → 拒
  ├─ round 字段（F2）── 工程角色缺 round / round∉{initial,fix} → 拒
  ├─ token 门（继承）── eng-coder 无活槽 → 拒
  ├─ 带宽判据（F3）── 读 manifest phase/access，越带宽 → 拒
  ├─ 轮次窄带（F4）── round=fix + 全量勘察 → 拒
  └─ files 声明面（F6）── 目录 / scripts/** / 过程档 → 拒（或由调度器排队的语义收窄）
```

**接口（核心）**：

- 继承：`buildSpawnChild`（`subagent-spawn.mjs:241`）· `resolveDesignSlot`（`subagent-spawn.mjs:112`）· `prepareScheduling`（`subagent-spawn.mjs:198`）· `normalizeFileList`（`subagent-scheduler.mjs:41`）· `assertNoDepCycle`（`scheduler.mjs:299`）。
- 新增：`validateTaskBookFields(args)`（六强制字段 + round 枚举）· `resolveBandwidth(agent)`（读 `phase`/`access` → 带宽枚举）· `rejectEngineeringFilePaths(files)`（`scripts/**` + 过程档拦截）。
- 角色 enum 落点：`subagent.mjs:149`（schema enum）+ `subagent.mjs:228`（`ROLES` Set）——两处同改。
- `round` 参数链（F2）：schema 字段（`subagent.mjs` 参数区 141-162 行，与 `batchDoc` :153 相邻——enum `initial|fix`）→ `execute` 透传 → `buildSpawnChild`（`subagent-spawn.mjs:241`）→ `validateTaskBookFields`（`spawn-gates.mjs`）；**不进调度器**（带宽/窄带判据在入场判完，调度只按 files/dependsOn 排队）。
  必带集合 = eng-coder · eng-designer；explore · advisor 豁免（勘察与评审不带实现轮次语义——explore 若必带 round 会与 F4 窄带恒拒冲突：勘察即全量勘察）。

**带宽枚举映射（`resolveBandwidth(agent)` 判据）**：

| phase \ access | from-zero | mid-梳理中 | mid-已梳理 |
|---|---|---|---|
| initial-dev | 并发 **1** · 第 2 个实施批 spawn 拒发 | 并发 **2** · 第 3 个拒发 | 并发 **4** · 第 5 个拒发（Cap 4 对齐） |
| production | 同左（phase 暂不区分——三值两行同值，2026-09-17 主 agent 裁定） | 同左 | 同左 |

带宽语义 = 「同时在飞的 eng-coder/eng-designer 实施批数上限」；越带宽 = 新实施批 spawn 机械拒发（报「带宽已满」）。六格数值 = 主 agent 2026-09-17 裁定（from-zero=1 · mid-梳理中=2 · mid-已梳理=4），§2.1 行 3 + KD-M5-4 三处同改。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 460 | 修改（**拆分**——见下） | +8 ~ +12（净） | `buildSpawnChild`（241 行）只加 import 调用（**自身增量 ≤10 行**）——241+10=251 < 300 函数级上限 |
| `thincoder-core/agent-tools/spawn-gates.mjs` | 0 | 新增 | +~90 | `validateTaskBookFields` / `resolveBandwidth` / 轮次窄带判据 / files 过程档拦截——**全部新增门禁逻辑落此** |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 430 | 修改 | +2 ~ +4 | `normalizeFileList`（41 行）只加 import 调用（拦截谓词本体落 `spawn-gates.mjs`） |
| `thincoder-core/agent-tools/subagent.mjs` | ~230 | 修改 | +4 ~ +8 | 角色 enum（149 行）+ `ROLES` Set（228 行）收正 + schema 增 `round` 字段（参数区 141-162 行，与 `batchDoc` :153 相邻） |
| `thincoder-cli/` | — | **零改** | — | 端经核单源 import |
| `thincoder-vscode/` | — | **零改** | — | 同上 |

**拆分**：`subagent-spawn.mjs`（460）+ 增量 ~70 → 近 530 越 500 硬上限。抽出**全部新增门禁逻辑**（任务书字段校验 + 带宽判据 + 轮次窄带判据 + files 拦截谓词）到 `thincoder-core/agent-tools/spawn-gates.mjs`（新文件，~90 行），`buildSpawnChild` 只加调用（自身增量 ≤10 行，241+10=251 < 300 函数级上限）——拆后 `subagent-spawn.mjs` 回落到 ~470。
   `subagent-scheduler.mjs`（430）自身只加 import 调用（谓词本体在 `spawn-gates.mjs`），文件级增量 +2~+4，不拆。

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M5-1 | 「轮次」= 结构化 spawn 参数 `round`（enum），非散文 marker | 机械门判据须结构化；散文 marker 可被模型误写/漏写，「派单必带」用 enum 参数最可靠 |
| KD-M5-2 | ~~全量勘察判据 = 复用 `summarizeEngTaskBook` 的段 marker 检测手法~~ **裁撤**（随 F4——2026-09-17） | — |
| KD-M5-3 | 角色 enum 工程模式收正为 explore/eng-designer/eng-coder（advisor 不入——评审走 advisor 工具通道，2026-09-17 裁定） | 架构 §2.4 + E3；`plan` 待定（E3「待定」）、normal-mode `coder` 非工程角色，收正不删 normal 模式枚举（`plan`/`coder` 在 normal 模式仍可用） |
| KD-M5-4 | 带宽判据 = 六格枚举映射（phase×access → 带宽档 + 越带宽拒发触发，§2.2 附表）——数值已确认：from-zero=1 · mid-梳理中=2 · mid-已梳理=4（主 agent 2026-09-17） | N2 可机判 |

### 2.5 与既有纪律冲突核对

- **F5 角色 enum 与 normal 模式**：当前 `subagent.mjs:149` enum 含 `plan`/`coder`（normal 模式）。工程模式 enum 收正为 explore/eng-designer/eng-coder/advisor，**不删 normal 模式枚举**——收正是「工程模式的 spawn 门角色集」，不是全删 normal 角色（见 KD-M5-3）。
- **F4 修复轮窄带 vs 「禁全量勘察」的判据形态**：spec 只给「修复轮 + 全量勘察 → 拒」，未给「全量勘察」的机判 marker。本档复用 `summarizeEngTaskBook` 的段 marker 检测**手法**判「全量勘察」；marker 词表可判性 = pre-implementation 核验项——实现前核验，不可判 → 标 `open` 回主 agent，不进入实现（§2.4 KD-M5-2 同款措辞，已统一）。
- **F2 round 必带集合**：必带 = eng-coder · eng-designer（工程派单角色——任务书强制字段）；explore · advisor 豁免——勘察与评审不带实现轮次语义；explore 若必带 round 会与 F4 轮次窄带恒拒冲突（勘察即全量勘察）。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | 缺 `batchDoc` 或路径不可读 → 拒 | AC-M5-1 | ✅ 缺参 spawn → 期望拒 |
| AC-2 | 任务书缺任一强制字段 → 拒（派单缺陷） | AC-M5-2 | ✅ 缺「轮次」→ 期望拒 |
| ~~AC-3~~ | ~~修复轮 + 全量勘察 → 拒~~ **裁撤**（随 F4） | ~~AC-M5-3~~ | — |
| AC-4 | 带宽读 `phase` / `access`（非硬编码） | AC-M5-4 | ✅ 改 manifest → 期望行为变 |
| AC-5 | `files` 声明目录 / 过程档 → 拒 | AC-M5-5 | ✅ 传目录 / `scripts/**` → 期望拒 |
| AC-6 | 角色 enum 非法 → 拒 | AC-M5-6 | ✅ 传未知角色 → 期望拒 |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：工程角色带齐字段 spawn | role=eng-coder + batchDoc + round=initial + files | 放行（token 门另判） |
| T2 | 正常：round=fix 窄带 | round=fix + 无全量勘察 marker | 放行 |
| T3 | 边界：files 内容产物 | files=[源文件, 设计档] | 放行 |
| T4 | 边界：带宽改 manifest | 改 `phase` → 带宽档变 | 行为按新档判 |
| T5 | 错误：缺 batchDoc | eng-coder 无 batchDoc | 拒（带实际角色名） |
| T6 | 错误：缺轮次 | 工程角色缺 `round` | 拒（派单缺陷） |
| ~~T7~~ | ~~错误：修复轮 + 全量勘察~~ **裁撤**（随 F4） | — | — |
| T8 | 错误：files 传目录 / scripts | files=[`scripts/`] 或 [过程档] | 拒 |
| T9 | 错误：非法角色 | role=unknown | 拒 |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 门禁与流程族 · eng-designer）：建档——M5 委派与 spawn 门模块设计；继承 batchDoc 门 + token 门，新增「轮次」结构化参数、带宽读 phase/access、修复轮窄带、角色 enum 收正、files 过程档拦截；验收逐条回指 AC-M5-1..6。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明措辞改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 门禁与流程族评审修正 · eng-designer）：设计评审修正轮——#9 带宽六格枚举映射 + 数值占位符（硬前置条件：主 agent 确认回写才进实现）· #10 `round` 参数链（schema→execute→buildSpawnChild；必带集合 eng-coder/eng-designer）· #11 F4 判据表述统一（pre-implementation 核验）+ files 拼写收正 · #12 新增门禁全落 `spawn-gates.mjs`（`buildSpawnChild` 增量 ≤10 行）；三方条目不变。
