# 检查点与 git 面（CHECKPOINT）· 核心统一子系统需求档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统需求档**（三层归属之需求层）。
> **工作流档**（需求层）= `docs/core/requirements/CORE-UNIFICATION.md` §1–§4 + §5 登记表（统一目标 / 边界原则 / 量级读数基线 / 范围边界）——本档**不复制**（D2 单一权威源）。
> **设计层** = `docs/core/design/CHECKPOINT.md`（本子系统设计与测试）；工作流设计档 = `docs/core/design/CORE-UNIFICATION.md`。
> **不新增需求**：条文分**搬移 / 回填 / 派生**三类并逐条标来源；无现成表述者由设计裁决派生，标「**派生 · 非用户原话**」。
> 命名与层级 = **板块镜像**（`requirements/<板块>.md` ↔ `design/<板块>.md`，**同板块名**）——规则原文见 仓文档地图 `docs/README.md` §4（板块镜像形态）；三层归属见同档 §1。
> **需求条目面**（§4）：自 CLI 产品需求档并入的**既有需求条目正文**（编号承旧档）——**无新增需求**。

## 1. 总体定位

检查点与 git 面 = 检查点核心（现经 `@thincoder/core/git/checkpoint.mjs` 引用）**+** 检查点工具面（`tools/git-checkpoint.mjs` · `tools/git-ext.mjs`——核内单源 `@thincoder/core/tools/*`）。
共同契约 = 同一目录同一格式、**快照跨端互通**。
另住他档的相关面：hooks 四事件 → 子系统档 `AGENT-LOOP.md`；team 层记忆 git 同步 → 子系统档 `MEMORY.md`。
本板块对本子系统的要求 = 该面归一为**核内单一实现**（共享函数下沉、消除端内副本）。

> 面清单与逐面裁决（分类 / 端差处置 / 前提校验 / 归属段）→ `docs/core/design/CHECKPOINT.md` §1–§2（不复制）。

## 2. 功能性需求

### 2.1 本子系统条目

- **【派生 · 非用户原话】** 检查点与 git 面归一为**核内单一实现**（同一目录同一格式、快照跨端互通）；共享函数（`escapeXml` 族）**下沉核内单一实现**以消除端内副本；注释与镜像注记随归一去镜像化（非语义）。
  源 = 设计档 `CHECKPOINT.md` §2.1 · §2.2。

### 2.2 适用工作流条目（回指 · 不复制）

| 条目 | 适用于本子系统的哪一面 |
|---|---|
| F11 | 对称面**进核**的准入（检查点面属「进核」集合） |
| F6 | 裁决**逐条落实**（依赖闭包与共享函数归位 = 裁决结果） |
| F3 | 核内实现**只从两侧提取**（消除端内副本 = 反第三份实现） |
| F13 | 对外契约面：快照格式**已兼容**（跨端互通，登记） |
| F12 | 凡改可观察行为 / 对外契约者**逐条提交裁定** |

## 3. 非功能性需求

本子系统无独立非功能条目。适用工作流条目（回指）= **N1**（未涉面不得无故回归）· **N2**（建核段两产品零改动 · 可回退）· **N3**（核独立可验证）· **N5**（单一权威源）· **N8**（结构尺度）。

## 4. 需求条目

### 4.1 机制定位与总体目标（四层闭环）

让 agent（及用户）在 git 破坏性操作造成**未提交改动丢失**后，**知道并能使用 checkpoint 机制恢复到操作前状态**。通过四层闭环：

1. **工具描述**（schema）——两端 git 工具的破坏性 action 描述写明「操作前自动快照、可 rewind 恢复」（F1）；
2. **工具输出提示**（checkpoint list）——查看快照列表时识别哪些对应刚发生的事故、可用 rewind 撤销（F2）；
3. **项目文档**（两端 AGENTS.md + 权威文档）——有可指认的权威恢复流程，不依赖会话记忆（F3）；
4. **系统提示词建议文本**（平台层，交付用户）——agent 决策规则里存在「git 破坏性操作事故 → checkpoint rewind 优先」的映射（F4）。

### 4.2 范围与接受风险

- **范围**：用户裁定扩展 F5（两端 checkpoint 存储统一为全量副本）、F6（commit 后清空该项目 checkpoint）、F7（git 工具能力补齐）。其中「**不改动核心机制**」的保证**仅限定于 CLI 既有 `snapshotBefore` / `createCheckpoint` / `rewind` / `cat` / `versions` 的执行逻辑**——F5 是 VS Code 端镜像新建，不触及 CLI 既有实现。
- **第二机制（commit 清理）**：commit 是该项目 checkpoint 的**生命周期终点**——commit 成功后清空该项目（cwd）的全部 checkpoint，重新开始跟踪；不再需要内容比较 / 时间窗口等「部分保留」判定（零误判风险）。
- 非 git cwd（`createNonGitCheckpoint` 变体）无 commit 概念——**不触发清理**（仅受上限约束）；两端清理动作一致（删除存储目录，存储统一后无需 stash 识别）；清理发生在 commit 成功之后，**commit 失败 / 中断绝不触发清理**。
- **接受风险（用户已认可）**：commit 后、下一次破坏性操作前，untracked 改动不在快照保护内（重新跟踪的窗口）——commit 是安全点，此窗口可接受。

### 4.3 非功能性约束（NF1–NF7）

| # | 约束 |
|---|---|
| NF1 | **描述精简**：schema 描述文本增量 ≤ 60 字符 / 处 |
| NF2 | **核心机制不动**：CLI 既有 `snapshotBefore` / `createCheckpoint` / `rewind` / `cat` / `versions` 执行逻辑不改；唯一例外 = `createCheckpoint` 末尾追加 NF6 上限检查 |
| NF3 | **测试**：两端集成测试集保持全绿；schema 描述 / 输出文本断言测试随改动更新 |
| NF4 | **幂等**：checkpoint list 提示行为单行、固定文本，不随调用次数累积 |
| NF5 | **双向生效**：CLI 与 VS Code 两端同步落地（共享事故场景，单端落地无效） |
| NF6 | **上限兜底**：不 commit 的 cwd 仍会累积——每 cwd 快照上限 100 + 最旧淘汰 |
| NF7 | **清理原子性**：commit 失败 / 中断绝不触发清理；清理本身失败不阻断 commit 结果（best-effort） |

### 4.4 VSC 端条目

语义同源——VSC 档 F-C1–F-C7 / N-C1–N-C4 与上列条目逐条同义（机制体 = 设计档 §6 承载），**不重并**（D2）。**端共享面（非端差）**：① **共享存储**
（`~/.thincoder/checkpoints/{cwdHash12}/`——与 CLI 同目录同格式、快照跨端互通；盘符归一后同 cwdHash12——core §1.1 已载）· ② **非 git cwd 变体**
（`createNonGitCheckpoint` 全目录拷贝 + SKIP 集——core §4.2 已载）。坐标（实核）＝ `@thincoder/core/git/checkpoint.mjs` · `@thincoder/core/tools/git-checkpoint.mjs` · `thincoder-vscode/src/tools/git.mjs`（379 行 · 本端装配面保留）· `thincoder-vscode/src/tools/shell.mjs`（318 行 · 本端装配面保留）。
**测试缺口（发现即报）**：VSC `test/` 对 checkpoint 面零专属用例——补测触发 = 该面下次被触碰。

**二态化裁定行**：①② 两条 = **共享 / 同源事实（非端差）**——（「与 CLI 同目录同格式、快照跨端互通」/「core §4.2 已载」）；本档 §4.4 无端差登记项。
