# 检查点与 git 面（CHECKPOINT）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 检查点核心 | 经 `@thincoder/core/git/checkpoint.mjs` 引用（自持镜像已删——S2 U5） | 经 `@thincoder/core/git/checkpoint.mjs` 引用（自持镜像已删——S2 W5） |
| 检查点工具面 | 经 `@thincoder/core/tools/git-checkpoint.mjs` · `@thincoder/core/tools/git-ext.mjs` 引用（自持镜像已删——S2 U5） | 经核同路径引用（`@thincoder/core/tools/git-checkpoint.mjs` · `@thincoder/core/tools/git-ext.mjs`——自持镜像已删 · S2 W5） |

**共同契约**：同一目录同一格式、快照跨端互通。

> 相关但另住他档：**hooks 四事件**（`src/hooks.mjs` ↔ 核内）→ `docs/core/design/AGENT-LOOP.md` #169；**team 层记忆 git 同步**（`src/git/gitmem.mjs`）→ `docs/core/design/MEMORY.md` #168。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 非逐字节同组（原 §2.5（二）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 48 | `tools/git-checkpoint.mjs` | 同路径 | 0.9091 · 异 | ② | 融合（共享函数单实现 + 依赖闭包归一） | 分叉 = VSC 本地副本化共享函数 + 模块位置差异；前提（两端同职责）仍成立（②） | — | S0a（首批建核） |
| 49 | `tools/git-ext.mjs` | 同路径 | 0.9071 · 异 | ② | 融合（注释归一 + 依赖闭包） | 分叉 = 注释与依赖组织差异；函数体逐字相同——无失效前提（②） | — | S0a（首批建核） |

**四要素明细（原 §2.5（二）明细块 · 逐字）**

- **#48 `tools/git-checkpoint.mjs`**（同路径 · j 0.9091 · sha `7b56f04cc565` / `5d9a226a1321` · 143 / 150 行）
  - 左端读数（CLI）：`escapeXml` 经 `thincoder-cli/src/tools/git-checkpoint.mjs:7` 由 `thincoder-cli/src/agent/helpers.mjs:89-91` 导入（共享实现）；checkpoint 子系统依赖 `../git/checkpoint.mjs`（`:8-16`）。
  - 右端读数（VSC）：`escapeXml` 本地定义（`thincoder-vscode/src/tools/git-checkpoint.mjs:21-23`；注释自述「镜像 CLI 版本」）；依赖 `./checkpoint.mjs`（`:8-16`）；头注含「CLI 镜像：」行（`:5`）。
  - 建议归一形态：融合——`escapeXml` 下沉核内单一实现（消除本地副本）；依赖 / 路径按核内闭包归一。
  - 影响面：无行为差——两 `escapeXml` 实现逐字相同（同款 5 链替换、同序）；差异属组织面（共享函数本地副本化 + 子系统模块位置）⇒ 不命中三口径（须用户裁 = —）。
- **#49 `tools/git-ext.mjs`**（同路径 · j 0.9071 · sha `682c67b71974` / `0cfaddecef28` · 173 / 174 行）
  - 左端读数（CLI）：注释 + 依赖 `../git/checkpoint.mjs`（动态导入 `thincoder-cli/src/tools/git-ext.mjs:56`）；函数体与右端逐字相同。
  - 右端读数（VSC）：注释（含「CLI 镜像：」注记 `thincoder-vscode/src/tools/git-ext.mjs:5`）+ 依赖 `./checkpoint.mjs`（`:57`）；函数体逐字相同（filterLines / runGitStrict / validateRef / gitConfigArgs / snapshotBefore / executeExtAction）。
  - 建议归一形态：融合——注释归一（删镜像注记）+ 依赖路径按核内闭包。
  - 影响面：无行为 / 契约差（差异 = 注释与依赖组织）⇒ 不命中三口径（须用户裁 = —）。

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 167 | `src/git/checkpoint.mjs` ↔ `src/tools/checkpoint.mjs` | ② | 融合：取一侧（v2 全文件快照 / rewind / 每文件恢复 / 只读 git 仓） | 分叉 ＝ 目录归属；VSC 头注自述「MIRROR of thincoder CLI src/git/checkpoint.mjs——同一目录同一格式、快照跨端互通」⇒ 前提成立 | — | S1（建核补齐） |

**工具实现面单端档映射（原 §2.5（四）表中的本子系统行）**

| 单端档 | 对位 / 处置 |
|---|---|
| VSC `tools/checkpoint.mjs` | ↔ CLI `git/checkpoint.mjs`（行 #167） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（#48 / #49 差异仅注释与依赖组织；#167 为同源自述镜像——均不命中 ①②③）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**；快照格式跨端互通 = 已兼容（登记见 `docs/core/design/SESSION.md` §4 的上抛清单第 3 行同族）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/CHECKPOINT.md`（222 行 · CLI 产品档——两端机制）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：一次性批次材料（测试覆盖/要点清单）· 头注状态行 / 变更流水账 / 需求迁出注 · 平台层交付物（F4 建议文本——§8.2）。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**——本节一律按**现状路径**落笔（CLI 侧实现已住 `thincoder-core/**`；`thincoder-cli/src/tui/**` = CLI 壳体面；VSC 侧 = `thincoder-vscode/src/**`）。符号名与档路径为契约面，行号未逐条复核。

### 6.1 快照是什么（v2 全量副本）

- 快照 = **全量文件副本**（v2，`meta.version = 2`）：变更的 tracked 文件全文 + untracked 文件副本（遵守 `.gitignore`）。v1 只存 git diff patch，rewind 依赖 HEAD 未变（快照后 commit 会让 `git apply` 失败、恢复链崩塌）——v2 改复制文件，**rewind 不受后续 commit 影响**。
- 单文件 >5MB 不复制（sqlite / bundle 等），记入 `skipped`。
- 非 git cwd 用 `createNonGitCheckpoint` 变体（无 commit 概念——不触发清理、仅受上限约束）。

### 6.2 快照触发点（三路可验证）

1. **git 工具破坏性 action 前 `snapshotBefore`**：checkout `-- path` / restore / reset `--hard` / stash pop / branch|tag delete（`thincoder-core/tools/git.mjs` 既有）+ F7 补齐的 clean / rebase（`thincoder-core/tools/git-ext.mjs`）。输出 `[snapshot {id} created before {label}]`。
2. **bash guard `gitGuardSnapshot`**：bash 破坏性 git 命令前自动快照（`thincoder-core/tools/bash.mjs` `GIT_DESTRUCTIVE_RE` 宽匹配）——为「git 操作一律走 git 工具」纪律漏网兜底。
3. **手动 `checkpointAction=create`**。

平台层「任务列表删除 / 上下文压缩前」自动快照**未在本项目代码中证实**——文档不声称，留待平台层确认。

### 6.3 存储、id 与上限

- **存储目录**：`~/.thincoder/checkpoints/{cwdHash12}/` 全量文件副本。
- **cwd hash 契约（钉定）**：`cwdHash12 = sha1(normalizeCwd(cwd)).slice(0, 12)`，`normalizeCwd` = Windows 盘符大写——VS Code 的 `uri.fsPath` 小写盘符，归一化后同 cwd 两端产生**同一 hash**，快照跨端互通；归一化同 session 存储（`thincoder-core/session-slots.mjs` `normalizeCwd`）。
- **id 语义**：时间戳（36 进制）+ 随机后缀；能力：rewind（单文件 / 目录恢复 + **恢复前自动快照**——可逆）、cat（快照内文件读取）、versions（per-file 历史，逐快照文件级元数据存 meta.json 支撑）。
- **上限（NF6）**：每 cwd **100 个**（`MAX_CHECKPOINTS = 100`；`createCheckpoint` 末尾 `pruneCheckpoints`——快照数 >100 → 删最旧）。
- **存量兼容**：VS Code 旧 stash 快照不迁移——不再支持 checkpoint 工具 rewind（用户可手动 `git stash drop`）；cwdHash 归一化前的 CLI 存量旧路径快照孤儿化（失效但文件保留，可手动清理）——新快照从归一化路径重新积累。

### 6.4 快照语义边界（活约束）

**快照 = 「操作前状态」，非「良好状态」备份**：质量取决于操作前状态本身——**编码损坏 / 已丢失的内容无法直接 rewind 恢复完好原文**（rewind 恢复的仍是操作前状态）。
但快照仍有救援价值：**快照文件可 cat 读取**，结构 / ASCII 内容常保持完整（2026-09-01 事故实证：编码损坏只毁中文注释，代码结构完整——cat 快照作重建模板，与重建版 diff 发现 2 处遗漏并补回）。**快照是「重建参照」，不是「无损恢复源」**。

### 6.5 commit 清理（F6）

- **语义**：commit 成功后 → 删除该项目（cwd）的**全部** checkpoint 快照 → 重新开始跟踪。commit = 安全点（未提交改动已入 git 历史——commit + reflog 是恢复手段）；**不做内容比较 / 时间窗口等「部分保留」判定——全清、零误判**。
- **触发**：主 = 两端 git 工具 commit action 成功后清理；兜底 = checkpoint `list` / `create` 时懒检查（该 cwd 的 HEAD commit 晚于最新快照创建时间 → 清空；覆盖外部 git / IDE commit 路径）；`/restore` 入口同样先懒检查。
- **判定与返回**：`commit.ok` 为真（**成功判定，不以输出非空为条件**——安静 commit 输出可为空）后立即清理；返回文本附加 `\n(checkpoints cleared — commit is a new safety baseline)`（清理成功）/ `(checkpoint cleanup skipped: <err>)`（失败）——best-effort，**绝不阻断 commit 结果**。
- **懒兜底判定（毫秒对齐）**：`git log -1 --format=%ct`（epoch 秒）> 最新快照 `meta.time`（**统一按毫秒比较：`%ct × 1000`**——否则秒 vs 毫秒永不成立，懒清理静默失效）；无快照 / 非 git 跳过。**all-or-nothing**：存在比 HEAD 更新的快照（外部 commit 后手动 create）→ 懒检查整体跳过、commit 前快照滞留——安全启发式（保守偏差有意接受）。

### 6.6 git 能力与纪律（F7）

- **action 集 32 个**（既有 21 + F7 补齐 11）——**全集权威 = 本层 `TOOLS.md` §6.7**（本文档不列双清单，避免漂移）。F7 动机：「git 操作一律走 git 工具」纪律的前提——否则被迫走 bash，破坏性命令裸跑无保护。
- **能力分级（两端一致）**：**P0 纪律必需** = clone / init / rebase（含 `--abort` / `--continue`）/ remote（list / add / remove / set-url）/ clean / switch（含 `-c`）；**P1 常用** = apply / worktree / archive / blame / mv；**P2 明确不做** = gc / config / fsck / bisect / grep / ls-files / merge-base / am / submodule（运维 / 调试命令）。
- **破坏性分类（快照覆盖）**：带 `snapshotBefore` = checkout `-- path` / restore / reset `--hard` / stash pop / branch|tag delete + clean / rebase；非破坏不带快照 = switch / clone / init / remote / apply / worktree / archive / blame / mv。
  裸 `git rebase` 拒绝未提交改动（除非 `--autostash`）——快照是 belt-and-braces（保护 `--autostash` 恢复失败 / 中断场景；已提交历史由 reflog + `rebase --abort` 恢复）。
- **「git 操作一律走 git 工具」纪律**：两端 AGENTS.md 落档（含 clean / rebase 等破坏性操作）——**违反即纪律违规**；**纪律与 guard 并存（纵深防御）**——纪律减少触发、guard 兜底漏网。
- **guard 对齐**：CLI bash guard = 宽匹配 + 全量副本（`createCheckpoint` 镜像）+ 通知含 rewind 指引；VS Code `thincoder-vscode/src/tools/shell.mjs` 原 stash + 精确 matcher（`git checkout HEAD -- .` 变体曾绕过）→ **对齐 CLI 同构**；**stash 从 guard 路径移除**（与 F5 存储统一一致）；存量用户 stash 不受影响。
- **先快照再执行 + 确认，从不拦截**（审批层才是真实防线）。

### 6.7 恢复入口

- **工具描述闭环（F1）**：两端 git 工具 schema 的破坏性 action 描述写明「操作前自动快照 + rewind 恢复」字样——**只改描述文本**（不改 action 枚举 / 参数结构 / 执行逻辑）；checkout 分支切换（非破坏）不涉及。**不改 `snapshotBefore` 输出文本**（D-CP1）。
- **checkpoint list 输出撤销提示（F2）**：`checkpointAction=list` 非空输出尾部附**固定一行**提示（幂等——不随调用次数累积）：`\n(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)`；空输出 `"(no checkpoints yet)"` 保持不变。查看列表即可识别哪些快照对应刚发生的事故。
- **建议恢复流程**：破坏性操作后发现未提交改动被丢弃：**先 `checkpointAction=list` 查快照 → `checkpointAction=cat` 确认内容 → `checkpointAction=rewind checkpointId=<id> path=<文件>` 恢复——不要先手动重建**（rewind 前会自动保存当前状态，可逆）。全量回滚已禁用（v2），rewind 逐文件恢复。
- **`/restore` 两级 picker（D-CP8——用户侧唯一恢复入口）**：TUI `thincoder-cli/src/tui/cmd-restore.mjs`；v2 全量回滚禁用后（`rewind(cwd,id)` 无 path 必抛、summary 字段已删、untracked 数组显示错乱）改造为**两级 picker**：① 选快照（untracked 显示改为数组长度 `+N untracked files`）→ ② 选文件（tracked / untracked 合并文件列表）→ `rewind(cwd, id, { path })`。
  要点：摘要行用 v2 返回字段 `{ path, type, restored }`；picker 顶部标注「全量恢复已禁用，逐文件恢复」；空快照提示「该快照无文件，无法逐文件恢复」；「恢复前自动快照可逆」提示保留；`handleRestoreCommand` 在 `listCheckpoints` 前调用 `lazyClearIfCommitted(agent.cwd)`（与 git 工具懒兜底对齐）。
- **系统提示词建议文本（F4）**：交付用户、不落项目（见 §8.2）。

### 6.8 两端统一后形态（F5 镜像）

| 维度 | CLI | VS Code（统一后） |
|---|---|---|
| 快照存储 | `~/.thincoder/checkpoints/{cwdHash12}/` 全量副本（含 untracked；非 git cwd 变体） | **同（镜像实现）** |
| id / rewind / cat | 时间戳+随机后缀 / 单文件·目录恢复+恢复前自动快照 / 快照内读取 | **同（镜像）** |
| 上限 / 清理（F6） | 每 cwd 100 / 删 `checkpointRoot(cwd)` 目录 | **同** |
| shell guard | 宽匹配 + 全量副本 + rewind 指引 | **对齐 CLI**（stash → 镜像全量副本） |
| 存量 stash 快照 | — | 不再支持工具 rewind（手动 `git stash drop`） |

两端能力分级（F7 P0/P1）与 action 集完全一致；CLI 建的快照 VS Code 可 list / rewind（同 cwd 同目录同格式——跨端互通）。

### 6.9 VS Code 端接线面（VSC 轮并入 · 2026-09-15）

> **来源** = `thincoder-vscode/docs/design/CHECKPOINT.md`（105 行 · VSC 产品档——迁移期参照历史）。本节 = 该档中「根层所缺」的 **VSC 端接线细节**（(a) 机制 / (b) 坐标）。与 CLI 同源的机制本体（v2 全量副本 / 触发三路 / 存储与 id / commit 清理 / git 纪律 / 恢复语义）已入 §6.1–§6.8，不重复（D2）。
> **接线状态（S2 W5 · 2026-09-15）**：VSC 自持镜像（`src/tools/checkpoint.mjs` · `git-checkpoint.mjs` · `git-ext.mjs`）已删——下列实现坐标现经核单源引用
> （`@thincoder/core/git/checkpoint.mjs` · `@thincoder/core/tools/git-checkpoint.mjs` · `@thincoder/core/tools/git-ext.mjs`）；VSC 侧保留装配面 = `src/tools/git.mjs`（checkpoint 路由 / 只读分类 / commit 清理——至 W14 单元）与 `src/tools/shell.mjs`（bash guard——快照经核）。

- **VSC 触发点（本端接线）**：git 破坏性 op 自动快照 = 核 `tools/git-ext.mjs` `snapshotBefore`（`:54`——reset --hard /
checkout 文件 / restore / stash pop / branch|tag delete / clean / rebase，操作前 best-effort 快照 → 返回
`[snapshot <id> created before <label>]\n` 注记，失败不阻塞 op，审批层才是真门）；bash git 破坏性命令 =
`shell.mjs gitGuardSnapshot`（`:139` `GIT_DESTRUCTIVE_RE` 宽 matcher / `:148` 实现——快照经核 `git/checkpoint.mjs`；匹配 `git checkout -- .` /
`restore` / `reset --hard` / `clean -f` 等，命令**从不拒绝**（模型会绕），snapshot-then-proceed 全量副本 →
返回 notice 注记含恢复入口 `checkpointAction=rewind checkpointId=<id>`，best-effort 永不 throw）；commit 后清理
（`git.mjs` commit case——清理经核 `git/checkpoint.mjs`）+ F6 懒清理（核 `tools/git-checkpoint.mjs` `lazyClearIfCommitted` = `:24`——list / create 入口比对
`git log -1 --format=%ct` ×1000 与最新快照 meta.time）。与 §6.2 / §6.5 / §6.6 统一语义同轨。
- **恢复输出契约（VSC 侧面）**：checkpoint 子动作 = list / create / rewind / cat / versions
（核 `tools/git-checkpoint.mjs` `executeCheckpointAction` = `:39`）。`list`：`(no checkpoints yet)` 或每快照
`id  ISOtime  N tracked: …  N untracked: …`；文件名单经 XML 转义（untrusted 回流模型上下文）。`create`：
`Checkpoint <id> created (N file(s): X tracked, Y untracked)`。`versions path=<file>`：每行
`snapshotId ISOtime sizeB sha:<sha> (tracked|untracked)` + 恢复指引行；无副本 → `No snapshot copies of … found`。
`rewind checkpointId path=…`：**单文件 `path` 必填**（全量回滚禁用——与 `git checkout -- .` 同危险）；成功 →
`Restored "<path>" (tracked|untracked) from checkpoint <id>.\n(The pre-restore state was snapshotted first —
you can restore again to go back.)`；oversized / 未含文件 → 具体 Error。`cat checkpointId path=…`：只读查看
快照内文件内容（legacy 走临时恢复 + 还原工作树）。`restoreFile(cwd,path,id)` = rewind path 模式薄封装。
- **只读分类（审批过滤）**：git 只读 action 免审批（diff/status/log/show/ls-remote/blame）+ checkpoint 的 **list/cat**（list 的 F6 懒清理副作用已判可接受——清的是 commit 后失去意义的过期快照）；rewind/create/versions 走副作用门。F2 提示文本（`checkpointAction=list` 非空输出尾部固定一行）— 与 §6.7 D-CP7 同文本。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CP1 | `snapshotBefore` 输出不改（`[snapshot {id} created before {label}]`）；F1 只改 schema 描述 | 历史断言（`snapshot \S+ created BEFORE execution`——测试清零前所锁）契约句仍有效；描述层闭环成本最低 |
| D-CP2 | 清理时机与返回：`commit.ok` 为真后立即清理；返回附 cleared / skipped 句 | 成功判定不以输出非空为条件（安静 commit）；best-effort 不阻断 commit |
| D-CP3 | 懒兜底判定统一按**毫秒**（`%ct × 1000` > `meta.time`）；all-or-nothing | 秒 vs 毫秒比较永不成立（会静默失效）；保守偏差有意接受 |
| D-CP4 | 两端 guard 保留并对齐（宽匹配 + 全量副本 + rewind 指引；stash 从 guard 路径移除） | 纪律漏网兜底；与 F5 存储统一一致 |
| D-CP5 | 上限 = 每 cwd 100 + 最旧淘汰 | 不 commit 的 cwd 仍会累积——防爆炸 |
| D-CP6 | 非 git cwd：`createNonGitCheckpoint` 变体——不触发清理、仅受上限约束 | 无 commit 概念 |
| D-CP7 | F2 提示文本定稿（中文一行，JS 长度 41 字符）；两端共享同一固定文本（前提 = 参数名两端一致——不一致则按端定制） | 与既有英文输出混排为有意选择 |
| D-CP8 | CLI `/restore` 改造为两级 picker（用户侧唯一恢复入口） | v2 全量回滚禁用（无 path 必抛、summary 已删）；逐文件恢复 |
| D-CP9 | 破坏性动作「先快照再执行 + 确认，从不拦截」 | 审批层才是真实防线——快照是保险不是门禁 |
| D-CP10 | VSC 恢复动作输出契约（list 转义 / rewind 单文件 path / versions sha 对照行）定稿 | 输出面 = 模型可见契约——untrusted 文件名单须转义；单文件 path 防静默全量回滚 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/CHECKPOINT.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 头注（状态行「当前态设计…」+ 权威源行） | 交付状态 / 时点指针 | 时点状态——归批次档 / 台账；权威指针已按现状坐标重写（§6 各节） |
| 文末「变更记录」 | 逐批变更流水账 | 历史叙述——本档自有变更记录 |
| 「需求层已迁出」注（旧档内两处） | 拆分时点注 | 时点材料——需求已归位本层同名需求档 |
| §2.2 第 3 条「平台层…未证实」段以外的时点叙述 | 过程叙述 | 时点材料 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §8 测试覆盖（含已清空引用与测试意图清单 T1–T10） | 用例 / 测试定位 | **一次性批次材料**（测试清零批后为意图清单）——测试资产归测试层 |
| §5.5 + 附录 A（系统提示词建议文本） | 平台层交付物（用户侧） | 原文自声明「不写入任何项目代码 / 文档」——**不进本档**（F4 要点已在四层闭环，见本层需求档） |
| 源档 §1–§5 纯 VSC 同构细节（快照机制 / 触发点 / 恢复入口 / 只读分类 / 清理原语——与 CLI 逐字同源部分） | VSC 侧同构实现 | 已并入 §6.9（接线面 + 输出契约）；同构正文不逐行复制（D2） |

### 8.3 需求侧（已并入本层需求档）

旧档需求面（旧同名需求档 §1 四层闭环 / 缺口实证 / 范围 / NF1–NF7）=== 本板块需求层，已并入本层需求档 `docs/core/requirements/CHECKPOINT.md`（**与本档同名成对**）——本档不重复。

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **214 行**（B 轮并入前 69 行——S2 W5 复跑收正，原记 185 为 B 轮/批 7 前读数）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #48 / #49 / #167 + 四要素明细 + 映射行）；**语义零改**，行号沿用原编号。
- 2026-09-14（**B 轮并入 · 第 3 批**）：新增 §6 **机制面**（快照形态 / 触发三路 / 存储与 id / 语义边界 / commit 清理 / git 能力与纪律 / 恢复入口 / 两端统一后形态）· §7 **关键决策（D-CP1–9）** · §8 **不并项与历史沿革** · §9 体量（低于软线，无需拆分）；来源 = `thincoder-cli/docs/design/CHECKPOINT.md`（**旧档一字未改**——原地作参照历史）；
  需求侧已并入本层 `docs/core/requirements/CHECKPOINT.md`；首部加机制面指针一行。
- 2026-09-15（**VSC 轮并入 · 批 7**）：§6.9 新增 **VS Code 端接线面**（触发点 / 恢复输出契约 / 只读分类）· §7 补 **D-CP10** · §8.2 补 1 行不并项登记；来源 = `thincoder-vscode/docs/design/CHECKPOINT.md`（**旧档一字未改**）；坐标按现状实核（`thincoder-vscode/src/tools/git-ext.mjs:55` · `thincoder-vscode/src/tools/shell.mjs:139,148` ·
`thincoder-vscode/src/tools/git-checkpoint.mjs:31,46`）。
- 2026-09-15（**S2 W5 接线 · VSC 端** · eng-coder 实施轮）：§1 表两格（CLI / VSC）收正为「经 `@thincoder/core/...` 引用」——VSC 自持镜像（`src/tools/checkpoint.mjs` · `git-checkpoint.mjs` · `git-ext.mjs`）随 W5 删档；
  §6.9 补接线状态行 + 实现坐标收正为核（`@thincoder/core/tools/git-ext.mjs:54` · `tools/git-checkpoint.mjs:24/:39`）；§9 体量读数复跑收正；机制条文（§6.1–§6.8 · §7 · §8）零改。
