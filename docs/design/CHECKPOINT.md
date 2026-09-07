# VS Code 快照与回滚（CHECKPOINT）

> 板块：checkpoint 快照/回滚（VS Code 端实现）。状态：**当前态规格**（2026-09-08
> 由 ARCHITECTURE §13 Checkpoint 行展开并对照 `src/tools/checkpoint.mjs`/
> `git-checkpoint.mjs`/`git-ext.mjs`/`git.mjs`/`shell.mjs` 核实写全——DOC-REORG-VSC
> 批 6）。
> 与 CLI `CHECKPOINT.md` 同名对应同一"快照/回滚"机制板块——**存储同一目录同一格
> 式**（`~/.thincoder/checkpoints/{cwdHash12}/`，快照跨端互通），本端为 CLI
> `src/git/checkpoint.mjs` 的 MIRROR（行为逐项对齐，修改须两端同批）。本档写 VSC
> 端接线与 git 工具面。
> 权威源（VS Code）：`src/tools/checkpoint.mjs`（全量副本快照 v2——create/list/
> rewind/restoreFile/listFileVersions/catFile/deleteCheckpointsForCwd/
> deleteCheckpointsOlderThan）、`git-checkpoint.mjs`（git 工具 checkpoint action 子
> 系统 + F6 懒清理 + D7 提示行）。
> 装配（VS Code）：`src/tools/git.mjs`（checkpoint action 路由/只读分类/commit 清
> 理）、`git-ext.mjs`（破坏性 op 前 snapshotBefore）、`shell.mjs`（bash git 破坏性
> 命令 gitGuardSnapshot）、`src/config-io.mjs`（configDir 定位）。
> 关联：ARCHITECTURE.md（§13 源行，本档迁出后留待后续瘦身批）、TOOLS.md（git/shell
> 工具）。

## 变更记录

- 2026-09-08：DOC-REORG-VSC 批 6——从 ARCHITECTURE §13 Checkpoint 行展开，对照
  VSC src/tools/ checkpoint 模块核实写全本端独立文档（v2 全量副本 + git 破坏性 op
  自动快照接线）。ARCHITECTURE §13 不删（留后续瘦身批）。v1 patch 时代→v2 全量副
  本历史折叠为本记录。

---

## 1. 快照机制（v2：全量文件副本）

- **快照 = 变更的 tracked 文件全量副本 + untracked 副本**（尊重 .gitignore）；
  另存 patch.diff（legacy/调试用——rewind 用副本不用 patch）。meta.json 存版本/
  id/time/untracked/tracked/skipped/head/trackedAll/逐文件 `{size,sha}`（sha =
  SHA256 前 12 位，驱动 per-file versions 免重扫）。
- **v2 动机**：v1 只存 git diff patch——rewind 依赖 HEAD 不变，快照后 commit 会让
  `git apply` 失败且恢复链崩。v2 拷文件，后续任意 commit 都能回滚。
- **>5MB 文件不拷**（sqlite/bundle…）——记入 skipped，rewind 显式报
  `file … was NOT snapshotted (oversized, >5MB)`。cap = `MAX_FILE_BYTES =
  5MB`。
- **id**：`Date.now().toString(36) + "-" + rand4`（防同毫秒碰撞；timestamp 前缀保
  排序）。**上限** `MAX_CHECKPOINTS = 100`——每次 create 末尾 prune 最旧。
- **非 git cwd**：createCheckpoint 曾返 null 静默禁用——现行
  `createNonGitCheckpoint` 全目录拷贝（files/ 布局同 rewind 路径，meta.nongit:
  true），仅 SKIP 集（node_modules/.git/…）豁免 + 跳过 `.thincoder`。
- **盘符归一**：`normalizeCwd` 大写 Windows 盘符——扩展 `uri.fsPath` 小写盘符，
  直接 hash 与 CLI `process.cwd()` 不同；归一后两端同 `cwdHash12`（与 session 存
  储同契约，CHECKPOINT F5/T7）。

## 2. 触发点（本端接线——AC6）

- **git 破坏性 op 自动快照**（`git-ext.mjs snapshotBefore`）：reset --hard /
  checkout 文件 / restore / stash pop / branch|tag delete / clean / rebase——操作
  前 best-effort 快照 → 返回 `[snapshot <id> created before <label>]\n` 注记（失败
  不阻塞 op，审批层才是真门）。
- **bash git 破坏性命令**（`shell.mjs gitGuardSnapshot`）：WIDE matcher
  `GIT_DESTRUCTIVE_RE` 匹配 `git checkout -- .`/`restore`/`reset --hard`/`clean -f`
  等——命令**从不拒绝**（模型会绕），snapshot-then-proceed 全量副本 → 返回 notice
  注记含恢复入口 `checkpointAction=rewind checkpointId=<id>`。best-effort 永不
  throw。
- **rewind/restore 前**：先对当前态再快照一次（回滚可逆——再 restore 一次即回）。
- **commit 后清理**（git.mjs commit case）：commit = 新安全基线 → 删本 cwd 全部
  checkpoint，注 `(checkpoints cleared — commit is a new safety baseline)`；清理失
  败注 `(checkpoint cleanup skipped: …)`，best-effort 不阻塞 commit。
- **F6 懒清理**（`git-checkpoint.mjs lazyClearIfCommitted`）：外部 commit（bash /
  IDE——非 git 工具）使既有快照成 pre-commit 态——list/create 入口比对
  `git log -1 --format=%ct`（epoch 秒）×1000 与最新快照 meta.time（ms）：HEAD 更新
  → 全清；任一快照比 HEAD 新 → 整体跳过。all-or-nothing，best-effort。

## 3. 恢复入口（git 工具 checkpoint action）

checkpoint 子动作 = **list / create / rewind / cat / versions**（`git-checkpoint.mjs
executeCheckpointAction`）：

- **list**：`(no checkpoints yet)` 或每快照 `id  ISOtime  N tracked: …  N
  untracked: …`；`checkpointId=<id>` 给文件树。尾随 D7 提示行
  `(意外丢弃改动？checkpointAction=rewind 可恢复操作前状态)`。文件名单经 XML 转义
  （untrusted 回流模型上下文）。
- **create**：`Checkpoint <id> created (N file(s): X tracked, Y untracked)`。
- **versions path=<file>**：该文件跨快照历史（newest 先）→ 每行
  `snapshotId ISOtime sizeB sha:<sha> (tracked|untracked)` + 同前一行相同 sha 标
  `← same content as previous` + 恢复指引行。无副本 → 明确 `No snapshot copies of
  … found`。
- **rewind checkpointId path=…**：**全量回滚禁用**（与 `git checkout -- .` 同危
  险——静默丢快照后一切改动），必须单文件 `path`。成功 →
  `Restored "<path>" (tracked|untracked) from checkpoint <id>.\n(The pre-restore
  state was snapshotted first — you can restore again to go back.)`。oversized/未含
  文件 → 具体 Error。
- **cat checkpointId path=…**：只读查看快照内文件内容（不动工作树——v2 直读副本；
  legacy 走临时恢复 + 还原工作树）。文件不在 → Error。
- **restoreFile(cwd,path,id)** = rewind path 模式的薄封装（清晰意图）。

## 4. 只读分类（审批过滤）

git 只读 action 免审批：diff/status/log/show/ls-remote/blame + checkpoint 的
**list/cat**（list 的 F6 懒清理副作用已判可接受——清的是 commit 后失去意义的过期快
照）。rewind/create/versions 走副作用门。

## 5. 清理原语（checkpoint.mjs）

- `deleteCheckpointsForCwd(cwd)`：删 cwd 全部快照（F6——commit 新基线）。
- `deleteCheckpointsOlderThan(cwd, count)`：只留最近 count 个（id 升序 = oldest
  first），返回删除数。
- pruneCheckpoints 在每次 create 末尾调（NF6 cap 100）。
