# Checkpoint 事故恢复机制（CLI ↔ VS Code 两端）

> 状态：**当前态设计**（机制已实现并定稿，2026-09-01；本文档 2026-09-07 重写为人类可读格式）。
> 权威源（CLI）：`src/git/checkpoint.mjs`（快照存储 / rewind 单一权威）、`src/tools/git-checkpoint.mjs`
> （git 工具 checkpoint action + F6 懒清理 + F2 提示行）、`src/tools/git-ext.mjs`（F7 扩展 action + `snapshotBefore`）、
> `src/tools/git.mjs`（commit 清理 + 核心 action）、`src/tools/bash.mjs`（bash guard `gitGuardSnapshot`——2026-09-08 批 3 拆分后）、
> `src/tui/cmd-restore.mjs`（`/restore` 两级 picker）。
> 关联权威：`TOOLS.md` §7（git 工具 action 集全集——本文档不列双清单，避免漂移）；两端 `AGENTS.md`（各自 Checkpoint 小节，落档用）。

---

## 变更记录

- 2026-09-01：定稿（需求 + 设计 + 测试三层完整；评审通过，12 项建议全部采纳修订），机制按 F1–F7 / NF1–NF7 落地。
- 2026-09-01：事故实证 + 四层闭环缺口定位（见 §1）。
- 2026-09-07：重写为当前态（格式正常化、历史变更流水账折叠为本记录、action 全集改指 TOOLS.md §7 防双清单漂移）。

---

## 1. 机制定位与总体目标

让 agent（及用户）在 git 破坏性操作造成**未提交改动丢失**后，**知道并能使用 checkpoint 机制恢复到操作前状态**。通过四层闭环：

1. **工具描述**（schema）——两端 git 工具的破坏性 action 描述写明"操作前自动快照、可 rewind 恢复"（F1）；
2. **工具输出提示**（checkpoint list）——查看快照列表时识别哪些对应刚发生的事故、可用 rewind 撤销（F2）；
3. **项目文档**（两端 AGENTS.md + 本权威文档）——有可指认的权威恢复流程，不依赖会话记忆（F3）；
4. **系统提示词建议文本**（平台层，交付用户）——agent 决策规则里存在"git 破坏性操作事故 → checkpoint rewind 优先"的映射（F4，见 §5.5）。

**缺口实证**（2026-09-01 02:17）：checkout 误丢弃未提交改动后，agent 检查了 `checkpoint list` 却未尝试 rewind，直接手动重建——说明恢复路径在工具描述与提示文案中完全缺失。机制由此扩展。

**范围**：用户裁定扩展 F5（两端 checkpoint 存储统一为全量副本）、F6（commit 后清空该项目 checkpoint）、F7（git 工具能力补齐）。其中"**不改动核心机制**"的保证**仅限定于 CLI 既有 `snapshotBefore` / `createCheckpoint` / `rewind` / `cat` / `versions` 的执行逻辑**——F5 是 VS Code 端镜像新建，不触及 CLI 既有实现。

**第二机制（commit 清理）**：commit 是该项目 checkpoint 的**生命周期终点**——commit 成功后**清空该项目（cwd）的全部 checkpoint，重新开始跟踪**。语义：commit = 安全点，所有未提交改动已进入 git 历史（commit + reflog 是更强的恢复手段），快照的临时保护使命结束；不再需要内容比较 / 时间窗口等"部分保留"判定（零误判风险）。详见 §3。

---

## 2. 快照机制

### 2.1 快照是什么

快照 = **全量文件副本**（v2，`meta.version = 2`）：变更的 tracked 文件全文 + untracked 文件副本（遵守 `.gitignore`）。v1 只存 git diff patch，rewind 依赖 HEAD 未变（快照后 commit 会让 `git apply` 失败、恢复链崩塌）——v2 改为复制文件，**rewind 不受后续 commit 影响**。

- 单文件 >5MB 不复制（sqlite / bundle 等），记入 `skipped`；
- 非 git cwd 用 `createNonGitCheckpoint` 变体（无 commit 概念，见 §3.4、D6）。

### 2.2 快照触发点（可验证）

破坏性操作前自动快照，共有三路触发：

1. **git 工具破坏性 action 前 `snapshotBefore`**：checkout `-- path` / restore / `reset --hard` / `stash pop` / branch|tag delete（CLI `git.mjs` 既有）+ F7 补齐的 `clean` / `rebase`（`git-ext.mjs`）。输出 `[snapshot {id} created before {label}]`（D1）；
2. **bash guard `gitGuardSnapshot`**：bash 破坏性 git 命令前自动快照（`bash.mjs` `GIT_DESTRUCTIVE_RE` 宽匹配——2026-09-08 批 3 拆分——D4）——为"git 操作一律走 git 工具"纪律（§4.3）漏网兜底；
3. **手动 `checkpointAction=create`**。

平台层"任务列表删除 / 上下文压缩前"自动快照**未在本项目代码中证实**——文档不声称，留待平台层确认。

### 2.3 存储与 id（两端统一，F5）

- 存储目录：`~/.thincoder/checkpoints/{cwdHash12}/` 全量文件副本；
- **cwd hash 契约（钉定）**：`cwdHash12 = sha1(normalizeCwd(cwd)).slice(0, 12)`，`normalizeCwd` = Windows 盘符大写——VS Code 的 `uri.fsPath` 小写盘符，归一化后同 cwd 两端产生**同一 hash**，快照跨端互通（T7）；归一化同 session 存储（`session-slots.mjs normalizeCwd`）；
- **id 语义**：时间戳（36 进制）+ 随机后缀；
- 能力：rewind（单文件 / 目录恢复 + **恢复前自动快照**——可逆）、cat（快照内文件读取）、versions（per-file 历史，逐快照文件级元数据存 meta.json 支撑）；
- **存量兼容**：VS Code 旧 stash 快照不迁移——不再支持 checkpoint 工具 rewind（用户可手动 `git stash drop`）；cwdHash 归一化前的 CLI 存量旧路径快照孤儿化（失效但文件保留，可手动清理）——新快照从归一化路径重新积累。

### 2.4 快照语义边界（F3 ④——活约束，勿当叙事删）

**快照 = "操作前状态"，非"良好状态"备份**：质量取决于操作前状态本身——**编码损坏 / 已丢失的内容无法直接 rewind 恢复完好原文**（rewind 恢复的仍是操作前状态）。

但快照本身仍有救援价值：**快照文件可 `cat` 读取**，结构 / ASCII 内容常保持完整（2026-09-01 事故实证：编码损坏只毁中文注释，代码结构完整——cat 快照作重建模板，与重建版 diff 发现 2 处遗漏并补回）。**快照是"重建参照"，不是"无损恢复源"**。

---

## 3. commit 清理（F6）

### 3.1 语义

commit 成功后 → **删除该项目（cwd）的全部 checkpoint 快照** → 重新开始跟踪。commit = 安全点（未提交改动已入 git 历史，commit + reflog 是恢复手段）；**不做内容比较 / 时间窗口等"部分保留"判定——全清，零误判**。

### 3.2 触发路径

- **主触发**：两端 git 工具 `commit` action 成功后清理（agent 主路径）；
- **兜底**：checkpoint `list` / `create` 时懒检查——该 cwd 的 HEAD commit 时间晚于最新快照创建时间（commit 后未建新快照）→ 清空（覆盖用户用外部 git / IDE commit 的路径）；`/restore` 入口同样先懒检查（D8，见 §5.6）。

### 3.3 清理判定与返回（D2 定稿值）

- 判定条件：commit case 中 `commit.ok` 为真——**成功判定，不以输出非空为条件**（安静 commit 输出可为空）；
- 返回文本附加（清理成功）：`\n(checkpoints cleared — commit is a new safety baseline)`；
- 清理失败附加：`(checkpoint cleanup skipped: <err>)`——best-effort（NF7），失败绝不阻断 commit 结果（与 `snapshotBefore` 同哲学）。

### 3.4 范围与接受风险

- 非 git cwd（`createNonGitCheckpoint` 变体）无 commit 概念——**不触发清理**（仅受 NF6 上限约束，D6）；
- 两端清理动作一致：删除 `~/.thincoder/checkpoints/{cwdHash12}/` 目录（存储统一后无需 stash 识别）；
- 清理发生在 commit 成功之后；**commit 失败 / 中断绝不触发清理**；
- 接受风险（用户已认可）：commit 后、下一次破坏性操作前，untracked 改动不在快照保护内（重新跟踪的窗口）——commit 是安全点，此窗口可接受。

---

## 4. git 能力与纪律（F7 + F3 ⑤）

### 4.1 git 工具 action 集

git 工具 action 集 **32** 个（既有 21 + F7 补齐 11）——**全集权威 = `TOOLS.md` §7，本文档不列双清单**（避免双清单漂移）。F7 补齐动机：纪律"git 操作一律走 git 工具"（§4.3）的前提——否则被迫走 bash，而 guard 删除后破坏性命令裸跑无保护。

能力分级（两端一致）：

- **P0 纪律必需**（无工具则纪律破）：`clone` / `init` / `rebase`（含 `--abort` / `--continue`）/ `remote`（list/add/remove/set-url）/ `clean` / `switch`（含 `-c`）；
- **P1 常用**：`apply` / `worktree` / `archive` / `blame` / `mv`；
- **P2 明确不做**（运维 / 调试命令，agent 工作流无价值）：gc / config / fsck / bisect / grep / ls-files / merge-base / am / submodule。

### 4.2 破坏性分类（快照覆盖）

- **带 `snapshotBefore`**：git 工具核心的 checkout `-- path` / restore / `reset --hard` / `stash pop` / branch|tag delete + F7 的 `clean` / `rebase`；
- **`clean`**（删除未跟踪文件）与 **`rebase`**（未提交改动保护）为 F7 新增破坏性项——其中裸 `git rebase` 拒绝未提交改动（除非 `--autostash`），快照是 belt-and-braces：保护 `--autostash` 恢复失败 / 中断场景；**已提交历史由 git reflog + `rebase --abort` 恢复**（文档说明）；
- **非破坏不带快照**：`switch` / `clone` / `init` / `remote` / `apply` / `worktree` / `archive` / `blame` / `mv`。

git 工具破坏性动作**先快照再执行 + 确认，从不拦截**（审批层才是真实防线）。

### 4.3 "git 操作一律走 git 工具"纪律（F3 ⑤——活约束）

两端 AGENTS.md 落档："git 操作一律走 git 工具（含 clean/rebase 等破坏性操作）"——**违反即视为纪律违规**。guard 为纪律漏网兜底——**纪律与 guard 并存（纵深防御）**，纪律减少触发、guard 兜底漏网。

### 4.4 bash guard 对齐（D4）

- CLI `src/tools/bash.mjs`：`GIT_DESTRUCTIVE_RE` 宽匹配 + `gitGuardSnapshot`（2026-09-08 批 3 拆分——原 system.mjs 迁 bash.mjs）（bash 破坏性 git 命令前自动 `createCheckpoint` 全量副本 + 通知含 rewind 指引——`checkpoint action=checkpoint checkpointAction=rewind checkpointId=<id>`，即 F1/F2 事故恢复闭环的既有部分，保留不删）；
- VS Code `src/tools/shell.mjs` 曾用 **stash + 精确 matcher**（`git checkout HEAD -- .` 变体曾绕过）——对齐方向：改 CLI 同构——**宽匹配同款 + 全量副本（镜像 createCheckpoint）+ 通知含 rewind 指引**；**stash 从 guard 路径移除**（与 F5 存储统一一致）；存量用户 stash 不受影响。

---

## 5. 恢复入口

### 5.1 工具描述闭环（F1）

两端 git 工具 schema 的破坏性 action 描述（checkout / restore / reset mode 等）写明"操作前自动快照 + rewind 恢复"字样。**只改描述文本**，不改 action 枚举 / 参数结构 / 执行逻辑；checkout 分支切换（非破坏）不涉及。

**不改 `snapshotBefore` 输出文本**（历史断言 `snapshot \S+ created BEFORE execution`——测试清零前 tools.test.mjs 所锁；输出已含 id，契约句仍有效）——描述层闭环成本最低，agent 决策时读 schema，输出仅确认执行。

### 5.2 checkpoint list 输出撤销提示（F2 / D7）

`checkpointAction=list` 非空输出尾部附**固定一行**提示（幂等，不随调用次数累积，NF4）：

> `\n(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)`

空输出 `"(no checkpoints yet)"` 保持不变。查看列表即可识别哪些快照对应刚发生的事故。

### 5.3 项目文档落档（F3）

- **权威源**：本文档（机制级权威）；
- 两端 AGENTS.md 各加一小节：CLI 加"Checkpoint 事故恢复 + commit 清理"；VS Code 端**引用本文档不复制**（文档地图纪律——权威源唯一）；
- `TOOLS.md`（§1 关联权威 / §7 逐工具契约）：引用本文档为快照权威，不复制内容（文档地图纪律——权威源唯一）；
- 文档地图：`docs/design/README.md` 登记本板块。

### 5.4 建议恢复流程

破坏性操作后发现未提交改动被丢弃：**先 `checkpointAction=list` 查快照 → `checkpointAction=cat` 确认内容 → `checkpointAction=rewind checkpointId=<id> path=<文件>` 恢复——不要先手动重建**（rewind 前会自动保存当前状态，可逆）。全量回滚已禁用（v2），rewind 逐文件恢复。

### 5.5 系统提示词建议文本（F4，交付用户，不落项目）

产出建议文本供用户更新平台提示词——**不写入任何项目代码 / 文档**（平台层归属用户侧）。全文见附录 A。

### 5.6 `/restore` 两级 picker（D8——用户侧唯一恢复入口）

TUI `cmd-restore.mjs` 是用户侧唯一恢复入口，v2 全量回滚禁用后（`rewind(cwd,id)` 无 path 必抛、summary 字段已删、untracked 数组显示错乱）改造为**两级 picker**：

1. **选快照**——保留现有列表，untracked 显示改为**数组长度**（`+N untracked files`）；
2. **选文件**——显示所选快照的 tracked / untracked **合并文件列表**（`cp.tracked` / `cp.untracked`）→ 选文件 → `rewind(cwd, id, { path })`。

行为要点：

- 摘要行用 v2 返回字段 `{ path, type, restored }`；
- picker 顶部标注"**全量恢复已禁用，逐文件恢复**"；
- 空快照（无文件可选）提示"该快照无文件，无法逐文件恢复"；
- "恢复前自动快照可逆"提示保留（恢复后 `/restore again` 可回退）；
- **`handleRestoreCommand` 在 `listCheckpoints` 前调用 `lazyClearIfCommitted(agent.cwd)`**——与 git 工具 checkpoint list 的 F6 懒兜底语义对齐（外部 commit 后不再列出过期快照）；
- 测试 finally 清理快照目录（`cleanupCheckpoints`，仿 tools.test.mjs 模式）防真实存储污染。
- 测试 finally 清理快照目录（`cleanupCheckpoints`）防真实存储污染。
- **测试文件定位注（2026-09-07 测试清零后）**：原 `test/tools.test.mjs` / `test/cmd-restore.test.mjs` 已按"按需加"政策清空。下列为设计权威的测试意图清单——若将来补 checkpoint 测试，按此重建用例（T1-T10 + /restore picker 流）。

---

## 6. 设计决策定稿值（D1–D8）

> 下列定稿值为**逐字契约**——输出文本 / 提示文本 / 判定句 / 常量不得改写措辞（DOC-REWRITE §4 保真规则）。

- **D1 · `snapshotBefore` 输出不改**：保持 `[snapshot {id} created before {label}]`（历史断言 `snapshot \S+ created BEFORE execution`——测试清零前 tools.test.mjs 所锁，契约句仍有效）。F1 只改 schema 描述。实现模板 = `[snapshot ${id} created before ${label}]`（git-ext.mjs `snapshotBefore`）。
- **D2 · 清理时机与返回**：commit case 中 `commit.ok` 为真（**成功判定，不以输出非空为条件**——安静 commit 输出可为空）后立即清理；返回文本附加 `\n(checkpoints cleared — commit is a new safety baseline)`（若清理成功）；清理失败附加 `(checkpoint cleanup skipped: <err>)`——best-effort（NF7）。
- **D3 · 懒兜底判定（毫秒对齐）**：`git log -1 --format=%ct`（HEAD commit 时间戳，**epoch 秒**）> 最新快照
  `meta.time`（**统一按毫秒比较：`%ct × 1000`**——否则秒 vs 毫秒比较永不成立，懒清理静默失效）→ 清空；
  无快照或非 git 跳过。
  **all-or-nothing 语义**：只要存在比 HEAD 更新的快照（如外部 commit 后手动 create），懒检查整体跳过、
  commit 前快照滞留——安全启发式（F6 全清语义的保守偏差，有意接受）；commit 后立即手动 create 的场景由 NF6 上限兜底。
- **D4 · 两端 guard 保留并对齐**：见 §4.4。
- **D5 · NF6 上限值**：每 cwd **100 个**（`MAX_CHECKPOINTS = 100`；`createCheckpoint` 末尾 `pruneCheckpoints`——快照数 > 100 → 删最旧，listCheckpoints 倒序最旧在尾部）。
- **D6 · 非 git cwd**：`createNonGitCheckpoint` 无 commit 概念——不触发 F6 清理；仅受 NF6 上限约束（VS Code 镜像同样支持非 git cwd 变体）。
- **D7 · F2 提示文本（定稿）**：`\n(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)`（JS 长度 41 字符，中文——与既有英文输出混排为有意选择）——两端共享同一固定文本，前提是两端 checkpoint schema 参数名一致（`checkpointAction` / `checkpointId` / `path`）——F5 镜像实现时验证参数名对齐，不一致则提示文本按端定制。
- **D8 · CLI `/restore` 改造**：见 §5.6。

### 非功能性约束（NF1–NF7）

| # | 约束 |
|---|---|
| NF1 | **描述精简**：schema 描述文本增量 ≤ 60 字符/处（保持工具描述可读性，不冗长） |
| NF2 | **核心机制不动**：CLI 既有 `snapshotBefore` / `createCheckpoint` / `rewind` / `cat` / `versions` 执行逻辑不改；唯一例外 = `createCheckpoint` 末尾追加 NF6 上限检查（新增机制非既有逻辑修改）；其余改动 = 描述字符串、输出提示行、文档 + F5–F7 新机制 |
| NF3 | **测试**：两端全量测试保持全绿；schema 描述 / 输出文本断言测试随改动更新 |
| NF4 | **幂等**：checkpoint list 提示行为单行、固定文本，不随调用次数累积 |
| NF5 | **双向生效**：CLI 与 VS Code 两端同步落地（共享事故场景，单端落地无效） |
| NF6 | **上限兜底**：不 commit 的 cwd 仍会累积——每 cwd 快照上限 **100** + **最旧淘汰**，防清理触发缺失时爆炸 |
| NF7 | **清理原子性**：commit 清理先于结果返回或异步执行均须保证——commit 失败/中断绝不触发清理；清理本身失败不阻断 commit 结果（best-effort，与 `snapshotBefore` 同哲学） |

---

## 7. 两端差异表（F5 存储统一后）

| 维度 | CLI | VS Code（统一后） |
|---|---|---|
| 快照存储 | `~/.thincoder/checkpoints/{cwdHash12}/` 全量文件副本（含 untracked；非 git cwd 变体） | **同（镜像实现）** |
| id 语义 | 时间戳 + 随机后缀 | **同** |
| rewind | 单文件 / 目录恢复 + 恢复前自动快照（可逆）+ versions | **同（镜像）** |
| cat | 快照内文件读取 | **同（镜像）** |
| 上限 | NF6 目录快照数 100 | **同** |
| 清理（F6） | 删 `checkpointRoot(cwd)` 目录 | **同** |
| shell guard（bash 破坏性 git 命令保护） | `bash.mjs` `GIT_DESTRUCTIVE_RE` 宽匹配（2026-09-08 批 3 拆分——原 system.mjs）+ 全量副本 + rewind 指引 | **对齐 CLI**（stash → 镜像全量副本 + 同款宽匹配 + rewind 指引） |
| 存量 stash 快照 | — | 不再支持工具 rewind（手动 `git stash drop`） |

两端能力分级（F7 P0/P1）与 action 集完全一致；CLI 建的快照 VS Code 可 list / rewind（同 cwd 同目录同格式，跨端互通 T7）。

---

## 8. 测试覆盖

机制行为的自动化验证分布在（非独立 spec，作为活机制证明）：

- `test/tools.test.mjs`：commit 清理（T1 / T2 / T2b / T2c 安静 commit 判定）、懒兜底清理（T3）、list 提示行与幂等（T4）、list 空输出（T5）、action 集精确（T5b，恰 32 个且不含 P2 名称）、上限淘汰（T6）、VS Code 镜像一致性 / commit 清理 / 存量 stash 隔离 / guard 对齐（T7–T7d）、schema 描述（T8）、F7 新 action 可用（T8b）、rebase 保护（T8c）、快照语义边界（T9）、事故恢复流程（T10）；
- `test/cmd-restore.test.mjs`：`/restore` 两级 picker 流程（untracked 数字显示 + 摘要正确）+ 空快照提示 + 非 git / 无快照提示 + 两级取消路径（slow 分层，真实 git 仓库）。
- ~~`test/tools.test.mjs`~~（已清空）：commit 清理（T1/T2/T2b/T2c 安静 commit 判定）、懒兜底（T3）、list 提示与幂等（T4）、list 空输出（T5）、action 集精确（T5b 恰 32 不含 P2）、上限淘汰（T6）、VS Code 镜像一致性（T7-T7d）、schema 描述（T8）、F7 action（T8b）、rebase 保护（T8c）、快照语义边界（T9）、事故恢复（T10）；
- ~~`test/cmd-restore.test.mjs`~~（已清空）：`/restore` 两级 picker 流程（untracked 数字 + 摘要）+ 空快照提示 + 非 git/无快照提示 + 两级取消（slow 分层，真实 git 仓库）。

---

## 附录 A：系统提示词建议文本（F4 交付物）

> 供用户手动更新平台提示词——**不写入任何项目代码 / 文档**（平台层归属用户侧）。内容要点：① 破坏性操作前工具自动快照（输出 id）；② 操作后发现未提交改动丢失 → 立即 list / rewind（不要先手动重建）；③ 快照是操作前状态，非"良好状态"备份。

```text
## Checkpoint 事故恢复
- git 工具在破坏性操作（checkout -- 文件 / restore / reset --hard / stash pop / branch|tag delete）执行前自动创建快照，输出 [snapshot <id> created before <操作>]。
- 操作后发现未提交改动被丢弃：先用 git 工具 checkpointAction=list 查快照、checkpointAction=cat 确认内容、checkpointAction=rewind checkpointId=<id> path=<文件> 恢复——不要先手动重建（rewind 前会自动保存当前状态，可逆）。
- 快照是"操作前状态"而非"良好状态"备份：编码损坏/从未存在的内容**无法直接 rewind 恢复完好原文**，但快照文件仍可 `cat` 读取作**重建参照**（结构/ASCII 常完好——2026-09-01 事故实证）。
- commit 成功后该项目的 checkpoint 会被清空（commit = 新的安全基线，git 历史 + reflog 是恢复手段）——commit 前如需保留中间状态，先手动 checkpointAction=create。
```
