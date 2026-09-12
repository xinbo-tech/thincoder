# 快照与回滚（CHECKPOINT）— 需求（VSC 仓）

> 板块：checkpoint 事故恢复（快照 / 回滚保险——VS Code 端实现）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`CHECKPOINT（CLI 仓·需求）§1`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见本仓 `docs/design/CHECKPOINT.md`（105 行——v2 全量副本 + git 破坏性 op 自动快照接线）；
> 权威源 = `src/tools/checkpoint.mjs`（452 行）· `src/tools/git-checkpoint.mjs`（151 行）· `src/tools/git.mjs`（379 行）· `src/tools/shell.mjs`（318 行）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

agent（及用户）在 git 破坏性操作（reset --hard / checkout 文件 / restore / stash pop / 分支与标签删除 / clean / rebase）造成**未提交改动丢失**后，
必须**知道并能使用** checkpoint 机制恢复到操作前状态——恢复路径在工具描述、输出提示、项目文档与提示词建议四处可见，不依赖会话记忆。
本端与 CLI 端**共享同一存储目录与格式**（`~/.thincoder/checkpoints/{cwdHash12}/`）——快照跨端互通。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-C1 | **破坏性 op 前自动快照**：git 工具破坏性 action 操作前 best-effort 快照 → 返回 `[snapshot <id> created before <label>]` 注记。证据 = `src/tools/git-ext.mjs`（snapshotBefore） | 破坏性 op 回执含快照 id 注记；快照失败不阻塞 op（审批层才是真门） | 不改 op 本体语义；快照失败不 throw |
| F-C2 | **bash git 破坏性命令护栏**：WIDE matcher（`GIT_DESTRUCTIVE_RE`）命中 `git checkout -- .` / `restore` / `reset --hard` / `clean -f` 等——命令**从不拒绝**，snapshot-then-proceed → 注记含恢复入口 `checkpointAction=rewind checkpointId=<id>`。证据 = `src/tools/shell.mjs`（gitGuardSnapshot） | 命中命令 → 注记含恢复入口；best-effort 永不 throw | 不拒绝命令（模型会绕）；不扩到非 git 命令面 |
| F-C3 | **恢复入口子动作**：git 工具 checkpoint action = list / create / rewind / cat / versions；`rewind` **必须单文件 path**（全量回滚禁用——与 `git checkout -- .` 同危险）；rewind 前对当前态再快照一次（回滚可逆）。证据 = `src/tools/git-checkpoint.mjs:46-55` | list 空态 `(no checkpoints yet)` / 非空每快照摘要 + 恢复提示行；rewind 成功回执含「pre-restore state was snapshotted first」；缺 path → 拒 | 不做全量回滚；不做「部分保留」判定 |
| F-C4 | **v2 全量副本语义**：快照 = 变更 tracked 文件全量副本 + untracked 副本（尊重 .gitignore）；meta 存 id / time / 逐文件 sha；**>5MB 文件不拷**（记 skipped，rewind 显式报 oversized）。证据 = `src/tools/checkpoint.mjs:22-25,85` | 快照后任意 commit 可回滚（不依赖 HEAD 不变）；oversized 文件 rewind → 显式错误提示 | 不拷 >5MB 文件；patch.diff 仅 legacy / 调试用 |
| F-C5 | **commit 清理**：commit 成功 → 删本 cwd 全部 checkpoint（新安全基线），注 `(checkpoints cleared — commit is a new safety baseline)`；清理失败注 skipped、best-effort 不阻塞。证据 = `src/tools/git.mjs`（commit case） | commit 成功 → 本 cwd 快照清空；**commit 失败 / 中断绝不触发清理** | 不做时间窗口 / 内容比较的部分保留 |
| F-C6 | **F6 懒清理（外部 commit）**：list / create 入口比对 HEAD 时间（`git log -1 --format=%ct` epoch 秒 ×1000 vs 最新快照 meta.time）——HEAD 更新 → 全清；任一快照比 HEAD 新 → 整体跳过（all-or-nothing）。证据 = `src/tools/git-checkpoint.mjs:31-55` | 外部 commit（bash / IDE）后 list → 陈旧快照被清；快照比 HEAD 新 → 不清 | 不做逐条部分清理；best-effort |
| F-C7 | **只读分类**：checkpoint 的 list / cat 免审批（只读面）；rewind / create / versions 走副作用门。证据 = `src/tools/git.mjs`（只读 action 分类） | list / cat → 免审批；写路径（rewind / create）→ 审批门 | 不把写路径混入只读分类 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-C1 | 容量兜底 | 每 cwd 快照上限 **100** + 最旧淘汰（每次 create 末尾 prune——不 commit 的 cwd 不爆炸） | `src/tools/checkpoint.mjs:22,448-450` |
| N-C2 | 幂等提示 | list 尾随提示行为单行固定文本——不随调用次数累积；文件名单经 XML 转义（untrusted 回流防注入） | `src/tools/git-checkpoint.mjs:97` |
| N-C3 | 两仓存储统一 | 快照住 `~/.thincoder/checkpoints/{cwdHash12}/`（与 CLI 同目录同格式——快照跨端互通）；盘符归一（大写）后两端同 cwdHash12 | `src/tools/checkpoint.mjs`（normalizeCwd）；`CHECKPOINT（CLI 仓·需求）§3.4` |
| N-C4 | best-effort 不 throw | snapshotBefore / gitGuardSnapshot / commit 清理均 best-effort——绝不阻塞主 op | 设计档 §2（触发点契约） |

> **机制实况注（发现即报）**：本仓 `test/` 对 checkpoint 面零专属用例（as-of 2026-09-12 全扫 `checkpoint|snapshot|rewind` 零命中）——
> 测试缺口如实登记；补测触发 = 该面下次被触碰。

## 4. 对位与端差登记（对位 = `CHECKPOINT（CLI 仓·需求）§1`）

- 语义对位：破坏性 op 自动快照 / 恢复入口 / 全量副本 / commit 清理 / 上限兜底 / best-effort——逐条同源。
- 端差登记：存储同一目录同一格式（快照跨端互通——本端为 CLI 检查点机制的对位实现，行为逐项对齐）；
  非 git cwd 变体（`createNonGitCheckpoint` 全目录拷贝 + SKIP 集）本端在位。
- 差异若有 → 逐条补登记（不静默）；本档不代述对端正文。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 A 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
