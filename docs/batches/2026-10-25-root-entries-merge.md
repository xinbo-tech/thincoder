# 2026-10-25 · 项目根解析剩余三套归并（owningProject / resolveProjectRoot / findProjectRoot）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 19:13「另批赶紧批啊！」——六套项目根解析归并的剩余三套。
> 台账 = #1794（MANIFEST · 归批）。前情 = 2026-10-25-project-root-from-target.md（已提交 fc0b7b7b · 未收口）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**已定决定**：六套项目根解析归并为一套——本批接下批未动的三套。 · 用户原话：「另批赶紧批啊！」 · 时间：2026-10-25 19:13

**前批已落（`#1793` · 提交 `fc0b7b7b`）**：台账侧 `isRegistered` 删库臂、`resolveLedgerRoot` 删 `descend` 与向下发现、加**会话锚边界**；工具起点改动作目标路径。

**本批对象（实读坐标）**：

| # | 函数 | 位置 | 现状 | 问题 |
|---|---|---|---|---|
| 1 | `owningProject(target)` | `manifest-discovery.mjs:100` | 向上找带档祖先，**无界**（走到盘根） | 从项目内路径出发，若上层还有带档目录会越过会话锚挂到外层——**同「不许跑出工作目录」** |
| 2 | `resolveProjectRoot(cwd)` | `:141` | 薄委托 `projectRootView(cwd).root` | 本身无问题（已是最薄形） |
| 3 | `findProjectRoot(cwd, scopeFiles)` | `advisor/project-context.mjs:54` | 答「评审范围归哪份 `AGENTS.md` 管」，带 `scopeFiles` | **是另一问**——不是项目根入口；取名撞车（`Root` 一词两用） |
| 4 | `projectRootView(cwd)` | `:127` | 归属（`owningProject`）→ 无则发现（`discoverProjects`） | 本体可行；但「发现」分支答的是「容器下有哪些项目」，与归属两问需在设计里分句写清 |

**待裁（设计定形）**：① `owningProject` 加界（缺省 = 会话锚）还是收为本体私有——若现在有调用点传锚外路径，加界会改变其行为，需逐个核 ② 3 号改名（如 `findGuideRoot`）与调用点 ③ `projectRootView` 的发现分支是否保留在同一个函数里（两问同函数 vs 拆开）。

**范围边界（不做）**：不动 `isRegistered`（已单臂）∥ 不动台账侧 `resolveLedgerRoot`（前批已定）∥ 不动 `discoverProjects` / `discoverRepos` 的发现算法 ∥ 不动建档流 ∥ 不加配置键。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
