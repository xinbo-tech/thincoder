# Checkpoint 事故恢复机制（CLI ↔ VS Code 两端）

> 状态：2026-09-01 定稿（需求 + 设计 + 测试三层完整；评审 0🔴 通过，12 项建议全部采纳修订）。机制现状：两端 git 工具在破坏性操作（checkout 文件 / restore / reset --hard / stash pop / branch|tag delete）前自动创建快照（CLI `snapshotBefore` → `src/git/checkpoint.mjs` 全量副本；VS Code `snapshotBefore` → `git stash create/store`，F5 统一为全量副本），但**恢复路径（checkpoint rewind）在工具描述与提示文案中完全缺失**——agent 看到 `[snapshot xxx created before checkout]` 输出却不知道这是撤销入口。2026-09-01 02:17 事故实证：checkout 误丢弃未提交改动后，agent 检查了 checkpoint list 却未尝试 rewind，直接进入手动重建。

---

## 1. 总体需求

让 agent（及用户）在 git 破坏性操作造成未提交改动丢失后，**知道并能使用 checkpoint 机制恢复到操作前状态**——通过四层闭环：工具描述（schema）→ 工具输出提示（checkpoint list）→ 项目文档（两端 AGENTS.md）→ 系统提示词建议文本（平台层）。

**范围**（2026-09-01 用户裁定扩展）：① 描述层闭环（F1-F4）；② **用户裁定的机制改动**——F5 VS Code checkpoint 存储统一为全量副本（git stash 移除）、F6 commit 后清空该项目 checkpoint、F7 git 工具能力补齐（11 个新 action）——"不改动核心机制"的保证**仅限定于 CLI 既有 snapshotBefore/createCheckpoint/rewind/cat/versions 的执行逻辑**。

**第二机制（2026-09-01 用户拍板）：快照累积清理**——commit 是该项目 checkpoint 的生命周期终点：commit 成功后**清空该项目（cwd）的全部 checkpoint，重新开始跟踪**。语义：commit = 安全点，所有未提交改动进入 git 历史（commit + reflog 是更强的恢复手段），快照的临时保护使命结束；不再需要内容比较/时间窗口等"部分保留"判定（零误判风险）。

## 2. 功能性需求

### F1 · 工具描述闭环（两端 git 工具 schema）

As a coding agent, I want the git tool's schema descriptions for destructive actions (checkout -- path / restore / reset --hard / stash pop / branch|tag delete) to state that "an automatic snapshot is created before this operation and can be restored via checkpointAction=rewind", so that when an operation discards uncommitted work I immediately know the recovery path instead of assuming the work is lost.

- 改动点：`thincoder/src/tools/git.mjs` + `thincoder-vscode/src/git.mjs` 的 schema 描述字符串
- 范围边界：**只改描述文本**，不改 action 枚举、参数结构、执行逻辑；checkout 分支切换（非破坏）不涉及

### F2 · checkpoint 列表输出撤销提示（两端）

As a coding agent, I want `checkpointAction=list` 的输出（或工具返回文本）说明"破坏性操作前的自动快照可用 rewind 撤销"，so that 我查看快照列表时能识别哪些快照对应刚发生的事故。

- 改动点：CLI `src/git/checkpoint.mjs` listCheckpoints 消费端（git 工具 checkpoint case 的输出组装）+ VS Code `src/git.mjs` checkpointExecute list 分支
- 范围边界：提示为**一行说明**（幂等、不重复叠加）；不动快照元数据/排序/内容

### F3 · 项目文档落档（两端）

As a maintainer, I want the checkpoint mechanism documented (snapshot timing, rewind usage, cross-end differences, snapshot semantic boundary), so that 未来 agent/用户遇到同类事故有可指认的权威流程，而非依赖会话记忆。

- 改动点：两端 AGENTS.md 各加一节（或指向权威文档）——**权威源**：`thincoder/docs/design/CHECKPOINT.md`（本文档，机制级权威）；VS Code 端 AGENTS.md 引用不复制
- 内容：① 快照时机（**可验证触发点**：git 工具破坏性操作前 snapshotBefore + bash guard（`gitGuardSnapshot`）+ 手动 checkpoint create；平台层"任务列表删除/上下文压缩前"自动快照**未在本项目代码中证实**——文档不声称，留待平台层确认）② 恢复流程（checkpointAction=list → cat 确认 → rewind）③ 两端差异（见 F5）④ **快照语义边界：快照 = "操作前状态"，质量取决于操作前状态本身**——编码损坏/已丢失的内容**无法直接 rewind 恢复完好原文**（rewind 恢复的仍是操作前状态）；**但快照本身仍有救援价值**：快照文件可 `cat` 读取，结构/ASCII 内容常保持完整（2026-09-01 事故实证：编码损坏只毁中文注释，代码结构完整——cat 快照作重建模板，与重建版 diff 发现 2 处遗漏并补回——快照是"重建参照"，不是"无损恢复源"）⑤ **"git 操作一律走 git 工具"纪律**（F7 补齐后执行；guard 为纪律漏网兜底）⑥ **需求确认后逐条建立 checklist 条目**（METHODOLOGY：F1-F7 + NF1-NF7 映射 .thincoder/checklist.md，实现前落）
- 范围边界：文档不改变机制行为；两端差异**只文档化**，不做实现对齐

### F4 · 系统提示词建议文本（平台层）

As the platform owner, I want a suggested system-prompt clause about checkpoint recovery, so that agent 的决策规则里存在"git 破坏性操作事故 → checkpoint rewind 优先"的映射。

- 产出：建议文本（供用户手动更新平台提示词）——**不写入任何项目代码/文档**（平台层归属用户侧）
- 内容要点：① checkout/restore/reset --hard 等破坏性操作前工具自动快照（输出 id）② 操作后发现未提交改动丢失 → 立即 `git` 工具 `checkpointAction=list` 查快照、`rewind` 恢复（不要先手动重建）③ 快照是操作前状态，非"良好状态"备份

### F5 · 两端 checkpoint 存储机制统一（用户裁定 2026-09-01：落地后 vscode 端逻辑应与 cli 端完全一致）

As a maintainer, I want the VS Code checkpoint mechanism to use the SAME full-copy snapshot storage as the CLI (not git stash), so that 两端行为完全一致、同一 cwd 的快照跨端互通（CLI 建的快照 VS Code 可 rewind）。

- **存储统一**：VS Code checkpoint 工具（snapshotBefore/checkpointExecute）从 git stash → **全量副本镜像**（对齐 CLI `src/git/checkpoint.mjs`：`~/.thincoder/checkpoints/{cwdHash12}/` 目录格式、id 语义（时间戳+随机后缀）、rewind（单文件/目录 + 恢复前自动快照可逆）、cat、versions 能力）
- **实现方式**：VS Code 端**镜像实现**（独立仓库不能 import CLI——与 session-io.mjs 镜像模式一致），行为逐项对齐。**cwd hash 契约（钉定）**：`cwdHash12 = sha1(normalizeCwd(cwd)).slice(0, 12)`（normalizeCwd = Windows 盘符大写）——**CLI 现状不归一化**（checkpoint.mjs 直接 sha1 原始 cwd），跨端互通前提是两端都用归一化 hash；**CLI checkpointRoot 改用归一化 hash**（用户裁定 2026-09-01：**存量旧路径快照不迁移**——孤儿化失效但文件保留，可手动清理；新快照从归一化路径重新积累）——VS Code `uri.fsPath` 小写盘符，不归一化则同 cwd 两端 hash 不同，跨端快照共享（T7）静默失效（thincoder-vscode/AGENTS.md 已记录 session 存储同坑）
- **存量 stash 快照**：不迁移——文档说明旧 stash 快照不再支持 checkpoint 工具 rewind（用户可手动 `git stash drop` 清理）；新快照全量副本
- **范围边界**：`shell.mjs` 的 guard（execute/bash 破坏性命令保护）**保留并对齐 CLI**（用户裁定 2026-09-01：保留两端 guard，但逻辑要一致）——VS Code guard 从 stash 改为 CLI 同构：**宽匹配**（`GIT_DESTRUCTIVE_RE` 同款）+ **全量副本快照**（镜像 createCheckpoint）+ **通知含 rewind 恢复指引**（对齐 CLI system.mjs 的通知文本）。guard 与 F3 纪律并存：纪律减少触发，guard 兜底漏网（纵深防御）——CLI guard 的通知文本含 `checkpointAction=rewind checkpointId=...` 指引，正是 F1/F2 事故恢复闭环的既有部分，保留不删
- TODO.md:24 划线销账（差异表更新为"已统一"）

### F6 · commit 后清空该项目 checkpoint（用户拍板 2026-09-01）

As a user, I want the project's checkpoints cleared when I commit, so that 快照不会日积月累膨胀（现状 10,709 个 / 3,706 cwd，2026-09-01 实测）。

- **语义（用户明确）**：commit 成功后 → 删除该项目（cwd）的全部 checkpoint 快照 → 重新开始跟踪。commit = 安全点（未提交改动已入 git 历史，commit + reflog 是恢复手段）；不做内容比较/时间窗口等"部分保留"判定——全清，零误判
- **触发路径**：
  - 主触发：两端 git 工具的 `commit` action 成功后清理（agent 主路径）
  - 兜底：checkpoint `list`/`create` 时懒检查——该 cwd 的 HEAD commit 时间晚于最新快照创建时间（commit 后未建新快照）→ 清空（覆盖用户用外部 git/IDE commit 的路径）
- **范围边界**：
  - 非 git cwd（CLI createNonGitCheckpoint 变体）无 commit 概念——不触发清理（仅受上限约束，见 NF6）
  - 两端清理动作一致：删除 `~/.thincoder/checkpoints/{cwdHash12}/` 目录（存储统一后无需 stash 识别）
  - 清理发生在 commit 成功之后；commit 失败/中断不触发
- **接受的风险**（用户已认可）：commit 后、下一次破坏性操作前，untracked 改动不在快照保护内（重新跟踪的窗口）——commit 是安全点，此窗口可接受

### F7 · git 工具能力补齐（用户裁定 2026-09-01："补齐全部能力"——纪律"git 操作一律走 git 工具"的前提）

As a coding agent, I want the git tool to cover every git operation I actually perform, so that the discipline "git operations always go through the git tool" (F3) is executable — otherwise I'm forced to bash, and with the shell guard removed (D4) destructive commands run unprotected.

- **现状**：两端 git 工具 21 个 action（add/branch/checkout/checkpoint/commit/diff/fetch/log/merge/pull/push/reset/restore/revert/rm/show/stash/status/tag/cherry-pick/ls-remote——19 基线 + 2026-08 工具扩充补 cherry-pick/ls-remote）——**10+ 个常见操作缺口**（2026-09-01 实测：clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv 均无）
- **补齐清单（两端一致）**：
  - **P0 纪律必需**（无工具则纪律破）：`clone` / `init` / `rebase`（含 --abort/--continue）/ `remote`（list/add/remove/set-url）/ `clean` / `switch`（含 -c）
  - **P1 常用**：`apply` / `worktree` / `archive` / `blame` / `mv`
  - **P2 明确不做**（运维/调试命令，agent 工作流无价值，评审可追加）：gc / config / fsck / bisect / grep / ls-files / merge-base / am / submodule
- **破坏性分类（snapshotBefore 覆盖）**：`clean`（删除未跟踪文件——破坏，快照保护）+ `rebase`（未提交改动保护——**注**：裸 `git rebase` 拒绝未提交改动（除非 `--autostash`），快照是 belt-and-braces：保护 --autostash 恢复失败/中断场景；已提交历史由 git reflog + rebase --abort 恢复——文档说明）；`switch`/`clone`/`init`/`remote`/`apply`/`worktree`/`archive`/`blame`/`mv` 非破坏不带快照
- **纪律配套**：补齐后两端 AGENTS.md 写入"git 操作一律走 git 工具（含 clean/rebase 等破坏性操作）"——违反即视为纪律违规（不再有 shell guard 兜底）

## 3. 非功能性需求

- **NF1 · 描述精简**：schema 描述文本的增量 ≤ 60 字符/处（保持工具描述可读性，不冗长）
- **NF2 · 核心机制不动**：CLI 既有 snapshotBefore / createCheckpoint / rewind / cat / versions 的执行逻辑不改（F5 的 VS Code 存储统一是镜像新建，不触及 CLI 既有实现）；**唯一例外**：createCheckpoint 末尾追加 NF6 上限检查（新增机制，非既有逻辑修改）；其余改动 = 描述字符串、输出提示行、文档 + F5-F7 的用户裁定新机制
- **NF3 · 测试**：两端现有全量测试保持全绿（CLI 904 / VS Code 804）；如有 schema 描述/输出文本断言测试，随改动更新
- **NF4 · 幂等**：checkpoint list 的提示行为单行、固定文本，不随调用次数累积
- **NF5 · 双向生效**：CLI 与 VS Code 两端同步落地（本机制是共享事故场景，单端落地无效）
- **NF6 · 上限兜底**：不 commit 的 cwd（长期工作不提交）仍会累积——每 cwd 快照数量上限（设计层定值，如 100 个）+ 最旧淘汰，防清理触发缺失时爆炸（现状 10,709 个已说明问题真实）
- **NF7 · 清理原子性**：commit 清理先于 commit 结果返回或异步执行均需保证——commit 失败/中断绝不触发清理；清理本身失败不阻断 commit 结果（best-effort，与 snapshotBefore 同哲学）

---

## 4. 设计层（2026-09-01 补全）

### 4.1 方案选型与理由

| 需求 | 方案 | 理由 |
|---|---|---|
| F1 工具描述闭环 | 两端 git 工具 schema 的破坏性 action 描述（checkout/restore/reset mode、checkpointAction 描述）追加"操作前自动快照 + rewind 恢复"字样；**不改 snapshotBefore 输出文本**（tools.test.mjs 既有断言 `snapshot \S+ created BEFORE execution`，输出已含 id） | 描述层闭环成本最低；输出保持稳定 |
| F2 list 提示 | checkpoint list 非空输出尾部加**固定一行**（定稿文本见 D7）；空输出 `"(no checkpoints yet)"` 保持 | 幂等（固定文本）；XML 转义测试断言文件树部分，尾部追加不影响 |
| F3 文档 | 本文档为权威源；两端 AGENTS.md 各加一小节（CLI 加"Checkpoint 事故恢复 + commit 清理"；VS Code 引用本文档不复制） | 文档地图纪律（权威源唯一） |
| F4 建议文本 | 见 4.4 全文（供用户更新平台提示词） | 平台层归属用户侧 |
| F5 TODO:24 | 差异表写入 F3 文档；TODO.md:24 划线销账 | 见 4.5 |
| F6 commit 清理 | 两端 git 工具 commit case 成功后调用清理函数（删该 cwd 的 checkpointRoot 目录——存储统一后两端同一函数语义）；兜底：checkpoint case 入口（list/create 前）懒检查 HEAD commit 时间 > 最新快照时间 → 同清理 | commit = 安全点语义；懒兜底覆盖外部 commit 路径；清理 best-effort（失败不阻断 commit 结果） |
| F5 存储统一 | VS Code 新建 `src/tools/checkpoint.mjs`（镜像 CLI checkpoint.mjs：createCheckpoint/listCheckpoints/rewind/catFile/listFileVersions/deleteCheckpointsForCwd），`src/tools/git.mjs` 的 snapshotBefore/checkpointExecute 改为调用镜像；删除 stash 路径 | 独立仓库镜像（session-io.mjs 同模式）；两端行为逐项对齐；快照跨端互通 |
| F7 能力补齐 | 两端 git 工具新增 11 个 action（P0：clone/init/rebase/remote/clean/switch；P1：apply/worktree/archive/blame/mv），破坏性分类（clean/rebase 带 snapshotBefore），P2 明确不做 | 纪律（F3）可执行的前提；两端 action 集一致；clean/rebase 恢复 guard 删除后的保护缺口 |
| NF6 上限 | 两端同一实现语义：createCheckpoint 后快照数 > 100 → 删最旧（listCheckpoints 按 id 倒序，最旧在尾部；VS Code 为镜像实现，非 stash） | 不 commit 的 cwd 兜底；现值 100（可在设计评审调整） |

### 4.2 受影响文件清单

**CLI（thincoder/）**：
| 文件 | 改动 |
|---|---|
| `src/git/checkpoint.mjs` | +`deleteCheckpointsForCwd(cwd)`（rm -rf checkpointRoot(cwd)，best-effort）；+`deleteCheckpointsOlderThan(cwd, count)`（NF6 最旧淘汰）；createCheckpoint 末尾 NF6 检查 |
| `src/tools/git.mjs` | snapshotBefore 已用 checkpoint.mjs；commit case 成功分支调 deleteCheckpointsForCwd；checkpoint case 委托 git-checkpoint.mjs；schema 描述追加（**9 处**：5 破坏性 action + path/checkpointAction + 新参数 rebaseAction/dryRun）；F7 11 个 action 委托 git-ext.mjs（**实现拆分**：git.mjs + git-ext.mjs + git-checkpoint.mjs 三文件，500 行硬限——2026-09-01 实现期拆分，git-ext 兼收 validateRef/runGitStrict/filterLines/gitConfigArgs/snapshotBefore 共享辅助） |
| `src/tools/git.md` | **工具描述同步 F7**：route 列表 + action 清单 + 用法行补 11 个新 action 与新参数（remoteAction/remoteUrl/rebaseAction/dryRun/create/dest/worktreeAction）——审计发现 CLI 描述层落后于 VS Code，补平两端对称 |
| `src/tools/git-ext.mjs` | **新建**：F7 扩展 action 主入口 `executeExtAction`（clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv——clean/rebase 带 snapshotBefore，失败分支也保留快照行）+ 共享 git 辅助 |
| `src/tools/git-checkpoint.mjs` | **新建**：checkpoint case 主入口 `executeCheckpointAction` + `lazyClearIfCommitted`（F6 懒兜底）+ `formatFileTree`（F2 提示行在 list 输出尾部） |
| `AGENTS.md` | +Checkpoint 小节（机制说明 + 恢复流程 + commit 清理 + 快照语义边界 + 两端差异引用 + git 纪律） |
| `docs/design/README.md` | **登记新板块**（Checkpoint 机制 → CHECKPOINT.md 权威源，文档地图纪律） |
| `docs/design/TOOLS.md` §6 | schema 描述变更的用例表同步（T-g 相关行）；**既有 checkpoint 机制描述改为引用 CHECKPOINT.md（不复制内容）** |
| `docs/TODO.md` | :24 划线销账（**注：条目实际位于 thincoder-vscode/docs/TODO.md:24**——跨端文档漂移项，CLI 侧无同名条目） |
| `test/tools.test.mjs` | +T1-T6/T8/T8b/T8c 新用例（checkpoint 清理/提示/上限/schema/F7 action 集）|
| `src/tui/cmd-restore.mjs` | **D8 改造**：两级 picker（选快照 → 选 tracked/untracked 合并列表中的文件 → `rewind(cwd, id, { path })`）；untracked 显示为数组长度；picker 顶部标注"全量恢复已禁用，逐文件恢复"；摘要行用 v2 返回字段 `{ path, type, restored }`；空快照/取消路径提示与返回（"恢复前自动快照可逆"提示保留） |
| `test/cmd-restore.test.mjs` | **新建**：/restore 两级 picker 流程（untracked 数字显示 + 摘要正确）+ 空快照提示 + 非 git/无快照提示 + 两级取消路径（slow 分层，真实 git 仓库） |

**VS Code（thincoder-vscode/）**：
| 文件 | 改动 |
|---|---|
| `src/tools/checkpoint.mjs` | **新建**：镜像 CLI `src/git/checkpoint.mjs`（createCheckpoint/listCheckpoints/rewind/catFile/listFileVersions/deleteCheckpointsForCwd + NF6 上限）——行为逐项对齐 |
| `src/tools/git.mjs` | snapshotBefore/checkpointExecute 从 stash 改为调用镜像 checkpoint.mjs；commit case 成功分支调 deleteCheckpointsForCwd；list 输出加 F2 提示 + 懒检查（委托 git-checkpoint.mjs）；schema 描述对应处；F7 11 个 action 委托 git-ext.mjs（**实现拆分**：git.mjs + git-ext.mjs + git-checkpoint.mjs 三文件，500 行硬限——与 CLI 同构镜像） |
| `src/tools/git-ext.mjs` | **新建**：F7 扩展 action 主入口 `executeExtAction`（镜像 CLI）+ 共享 git 辅助（validateRef/runGitStrict/filterLines/gitConfigArgs/snapshotBefore） |
| `src/tools/git-checkpoint.mjs` | **新建**：checkpoint case 主入口 `executeCheckpointAction` + `lazyClearIfCommitted` + `formatFileTree`（镜像 CLI，escapeXml 本地实现含 &apos;） |
| `src/tools/shell.mjs` | **guard 改造对齐 CLI**（保留 + 逻辑一致，用户裁定）：stash → 镜像 createCheckpoint 全量副本 + 宽匹配（`GIT_DESTRUCTIVE_RE` 同款）+ 通知含 rewind 指引（对齐 CLI system.mjs `gitGuardSnapshot`） |
| `AGENTS.md` | +Checkpoint 小节（引用 CLI CHECKPOINT.md，不复制）+ **"git 操作一律走 git 工具"纪律** |
| `test/tools.test.mjs`（或新增 checkpoint.test.mjs） | 对齐 CLI 的 checkpoint 测试（创建/list/rewind/上限/清理）+ schema/list 断言更新；**shell guard 测试改为断言新行为**（全量副本 + rewind 指引，见 T7d） |
| 存量 stash 快照 | 不迁移（文档说明；用户可手动 git stash drop） |

### 4.3 关键决策

- **D1 · snapshotBefore 输出不改**：保持 `[snapshot {id} created before {label}]`（tools.test.mjs 既有断言 `snapshot \S+ created BEFORE execution`，输出已含 id），F1 只改 schema 描述——agent 决策时读 schema，输出仅确认执行
- **D2 · 清理时机**：commit case 中 `commit.ok` 为真（成功判定，**不以输出非空为条件**——安静 commit 输出可为空）后立即清理；返回文本附加 `\n(checkpoints cleared — commit is a new safety baseline)`（若清理成功）；清理失败附加 `(checkpoint cleanup skipped: <err>)`——best-effort（NF7）
- **D3 · 懒兜底判定**：`git log -1 --format=%ct`（HEAD commit 时间戳，**epoch 秒**）> 最新快照 `meta.time`（**统一按毫秒比较：`%ct × 1000`**——否则秒 vs 毫秒比较永不成立，懒清理静默失效）→ 清空；无快照或非 git 跳过。**all-or-nothing 语义**：只要存在比 HEAD 更新的快照（如外部 commit 后手动 create），懒检查整体跳过、commit 前快照滞留——安全启发式（F6 全清语义的保守偏差，有意接受）；commit 后立即手动 create 的场景由 NF6 上限兜底
- **D4 · 两端 guard 保留并对齐**（用户裁定 2026-09-01 修正：保留两端 guard，但逻辑要一致）：CLI `src/tools/system.mjs` 已有 `GIT_DESTRUCTIVE_RE` 宽匹配 + `gitGuardSnapshot`（bash 破坏性 git 命令前自动 createCheckpoint 全量副本 + 通知含 rewind 指引——F1/F2 闭环的既有部分）；VS Code `src/tools/shell.mjs` 是同构镜像但**用 stash + 精确 matcher**（shell.mjs 头注释自证 `git checkout HEAD -- .` 变体曾绕过）。**对齐方向**：VS Code guard 改 CLI 同构——宽匹配同款 + 全量副本（镜像 createCheckpoint）+ 通知含 rewind 指引。guard 与 F3 纪律并存（纵深防御）；**stash 从 guard 路径移除**（与 F5 存储统一一致）
- **D5 · NF6 上限值**：每 cwd 100 个（两端同一实现语义：createCheckpoint 后快照数 > 100 → 删最旧）
- **D6 · 非 git cwd**：CLI createNonGitCheckpoint 无 commit 概念——不触发 F6 清理；仅 NF6 上限约束（VS Code 镜像同样支持非 git cwd 变体）
- **D7 · F2 提示文本（定稿）**：`\n(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)`（JS 长度 41 字符，中文——与既有英文输出混排为有意选择，评审 🔵 接受）——**两端共享同一固定文本，前提是两端 checkpoint schema 参数名一致**（`checkpointAction` / `checkpointId` / `path`）——F5 镜像实现时验证参数名对齐，不一致则提示文本按端定制
- **D8 · CLI `/restore` 命令改造（用户拍板 2026-09-01 选项①，交付评审 🔴 #1）**：TUI `cmd-restore.mjs` 是用户侧唯一恢复入口，v2 全量回滚禁用后原实现必坏（`rewind(cwd,id)` 无 path 必抛 + summary 字段已删 + untracked 数组显示错乱）。改造为**两级 picker**：① 选快照（保留现有列表 + **untracked 显示改为数组长度**）② 显示所选快照的 tracked/untracked 文件列表（`listCheckpoints` 的 cp.tracked/cp.untracked 合并）→ 选文件 → `rewind(cwd, id, { path })`；摘要行改为 v2 返回字段（`{ path, type, restored }`）；"恢复前自动快照可逆"提示保留；picker 顶部标注"全量恢复已禁用，逐文件恢复"；无文件可选（空快照）时提示。**测试**：新增 cmd-restore 用例（选快照→选文件→rewind 成功 + 摘要正确 + untracked 显示正确）。**2026-09-01 评审 #4 增补**：`handleRestoreCommand` 在 listCheckpoints 前调用 `lazyClearIfCommitted(agent.cwd)`——/restore 与 git 工具 checkpoint list 的 F6 懒兜底语义对齐（外部 commit 后不再列出过期快照）；测试 finally 清理快照目录（cleanupCheckpoints，仿 tools.test.mjs 模式——防真实存储污染）

### 4.4 F4 系统提示词建议文本（交付用户，不落项目）

```
## Checkpoint 事故恢复
- git 工具在破坏性操作（checkout -- 文件 / restore / reset --hard / stash pop / branch|tag delete）执行前自动创建快照，输出 [snapshot <id> created before <操作>]。
- 操作后发现未提交改动被丢弃：先用 git 工具 checkpointAction=list 查快照、checkpointAction=cat 确认内容、checkpointAction=rewind checkpointId=<id> path=<文件> 恢复——不要先手动重建（rewind 前会自动保存当前状态，可逆）。
- 快照是"操作前状态"而非"良好状态"备份：编码损坏/从未存在的内容**无法直接 rewind 恢复完好原文**，但快照文件仍可 `cat` 读取作**重建参照**（结构/ASCII 常完好——2026-09-01 事故实证）。
- commit 成功后该项目的 checkpoint 会被清空（commit = 新的安全基线，git 历史 + reflog 是恢复手段）——commit 前如需保留中间状态，先手动 checkpointAction=create。
```

### 4.5 F5 存储统一后的差异表（写入 F3 文档）

| 维度 | CLI | VS Code（统一后） |
|---|---|---|
| 快照存储 | `~/.thincoder/checkpoints/{cwdHash12}/` 全量文件副本（含 untracked；非 git cwd 变体） | **同（镜像实现）** |
| id 语义 | 时间戳+随机后缀 | **同** |
| rewind | 单文件/目录恢复 + 恢复前自动快照（可逆）+ versions | **同（镜像）** |
| cat | 快照内文件读取 | **同（镜像）** |
| 上限 | NF6 目录快照数 100 | **同** |
| 清理（F6） | 删 checkpointRoot(cwd) 目录 | **同** |
| shell guard（bash 破坏性 git 命令保护） | 有：`system.mjs` `GIT_DESTRUCTIVE_RE` 宽匹配 + 全量副本 + rewind 指引（既有） | **对齐 CLI**（stash → 镜像全量副本 + 同款宽匹配 + rewind 指引） |
| 存量 stash 快照 | — | 不再支持工具 rewind（手动 git stash drop） |

### 4.6 验收标准

1. CLI：commit 成功后 `~/.thincoder/checkpoints/{cwdHash}/` 清空（目录删除）；commit 失败不清；工具返回附清理行
2. CLI：checkpoint list 输出尾部含 F2 提示行；空输出不变
3. CLI：懒兜底——外部 git commit 后（HEAD 时间 > 最新快照时间）checkpoint list/create 触发清空
4. VS Code：commit 成功后 checkpointRoot(cwd) 目录删除（与 CLI 同一存储/同一动作）；list 输出含提示
5. NF6：手动创建 >100 快照 → 最旧被淘汰（两端各自）
6. schema 描述含"自动快照 + rewind 恢复"字样（两端）
7. **F5 存储统一**：VS Code 建的快照与 CLI 同目录同格式——CLI list/rewind 可直接操作（跨端互通测试 T7）
8. 两端全量测试全绿（CLI 904 / VS Code 804；tools.test.mjs checkpoint 相关断言随输出更新）
9. TODO.md:24 划线销账；两端 AGENTS.md 落档（含"git 操作一律走 git 工具"纪律）
10. **两端 guard 对齐**：VS Code 破坏性 bash 命令触发**全量副本快照 + rewind 指引通知**（与 CLI `gitGuardSnapshot` 同构）；宽匹配同款；stash 从 guard 路径移除（存量用户 stash 不受影响）
11. **F4 交付**：系统提示词建议文本按 4.4 定稿交付用户（4 要点完整），不写入任何项目代码/文档
12. **cwdHash 归一化**：CLI checkpointRoot 改用 `sha1(normalizeCwd(cwd)).slice(0,12)`；存量旧路径孤儿化（保留不迁移）；VS Code 镜像同契约——T7 跨端互通成立

## 5. 测试层（2026-09-01 补全）

| 用例 | 需求 | 输入 | 预期输出 |
|---|---|---|---|
| T1 commit 后清空 | F6 | git 工具 commit（有快照存在） | 返回含清理行；checkpointRoot(cwd) 目录不存在 |
| T2 commit 失败不清 | F6/NF7 | commit 冲突/无变更（commit.ok=false） | 返回失败；快照保留 |
| T2b 清理失败不阻断 | NF7 | commit 成功但清理抛错（模拟删除失败） | commit 结果正常返回 + `(checkpoint cleanup skipped: <err>)`；快照保留 |
| T2c 安静 commit 也清理 | D2 | commit 成功且输出为空 | 清理触发（commit.ok 判定，不依赖输出非空） |
| T3 懒兜底清理 | F6 | 外部 `git commit`（bash 路径）后 checkpoint list | list 触发清理；快照清空后返回 "(no checkpoints yet)" |
| T4 list 提示行 | F2/NF4 | checkpoint list（有快照）连续调用两次 | 输出尾部含 D7 定稿文本（`checkpointAction=rewind 可恢复`）且只出现一次（幂等） |
| T4b 描述限长 | NF1 | 检查两端 schema 描述 | 每处增量 ≤ 60 字符 |
| T5 list 空输出 | F2 | checkpoint list（无快照） | "(no checkpoints yet)" 不变 |
| T5b action 集精确 | F7 | 枚举两端 git 工具 action 集 | 恰为 32 个（既有 21 + 新增 11），**不含 P2 名称**（gc/config/fsck/bisect/grep/ls-files/merge-base/am/submodule） |
| T6 上限淘汰 | NF6 | 创建 101 个快照 | 最旧 1 个被删（总数 100） |
| T7 VS Code 镜像一致性 | F5 | VS Code checkpoint 工具建快照 → CLI listCheckpoints 可见（同 cwd 同目录） | 跨端互通：CLI 能 list/rewind VS Code 建的快照（id 格式/目录一致） |
| T7b VS Code commit 清理 | F6 | VS Code git 工具 commit 成功（存在快照） | checkpointRoot(cwd) 目录删除；返回附清理行 |
| T7c VS Code 存量 stash 隔离 | F5 | 旧 stash 快照存在 + 新全量副本快照 | 工具操作只涉及全量副本；stash 不动（文档说明） |
| T7d guard 对齐 | D4 | VS Code 破坏性 bash 命令（git checkout -- . / reset --hard / clean -f）经 execute 执行 | 触发**全量副本快照** + 通知含 rewind 指引（与 CLI `gitGuardSnapshot` 同构）；无 stash 快照产生 |
| T8 schema 描述 | F1 | 检查两端 git 工具 schema 描述 | 破坏性 action 描述含"snapshot"/"rewind"字样 |
| T8b F7 新 action 可用 | F7 | clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv 各执行一次（两端） | 全部可用；clean/rebase 执行前输出 snapshot 行；两端 action 集一致 |
| T8c rebase 保护 | F7 | 未提交改动存在时 rebase | snapshotBefore 先行；rebase --abort 可恢复（文档说明） |
| T9 快照语义边界 | F3 | 文档评审 | 文档含"快照=操作前状态非良好状态" |
| T10 事故恢复流程 | F1-F3 | 模拟 checkout 丢弃改动 → list → rewind | rewind 恢复文件；文档可指认 |
