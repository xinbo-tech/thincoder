# 工具系统设计（thincoder/src/tools/ + src/agent-tools/ + src/mcp/）

> 状态：2026-08 回补。25 个内置工具 + MCP 客户端 + 元工具（agent-tools），统一 schema（OpenAI function calling）、统一上下文（cwd/agent/callbacks/signal）、统一安全边界（路径/命令/网络/沙箱）。

## 0. 机制目标（总体需求）

工具系统是 agent 与外部世界（文件/命令/网络/git/MCP/项目状态）交互的**唯一通道**：把「能做什么」以统一 schema 暴露给模型，把「怎么安全做」收口到工具内部（路径/命令/网络/沙箱四道边界），把「何时做」交给调度层（只读并行、副作用串行、审批门控）。目标是让模型在能力边界内自助完成任务，同时把破坏性/越界动作挡在真实防线（审批 + 快照）之内——正确性/可用性优先于 token 节省。

## 0.1 非功能性需求（硬指标）

| 项 | 指标 |
|---|---|
| 工具超时 | bash 120s；execute 子进程超时强杀（默认 30s、上限 600s——2026-09-05 §14.1 核对 execute.mjs 修正：旧「上限 60s」记录过时——代码 `Math.min(t, 600_000)`——见 §14.1）；其余工具同步即时返回 |
| 读/输出上限 | `MAX_READ_LINES=2000`、`MAX_OUTPUT_CHARS=200_000`（超限落盘，模型见预览） |
| 网络响应体 | websearch/fetch ≤5MB；HTML 转文本（stripTags/htmlToText） |
| 路径安全 | ~~`resolveInCwd` 防 `../` 逃逸 + `assertInside` + `realpathNearest` 符号链接解算~~——**被 §10.1 取代（2026-09-02）**：边界断言移除——统一为无边界解析（resolveInCwd/resolveExternal 等价：相对路径相对 cwd 解析、绝对路径原样解析）；信任模型 + 权限门禁为唯一防线 |
| 命令安全 | 破坏性命令 snapshot-then-proceed（审批 + gitGuardSnapshot/checkpoint），文本拦截仅提示不拦截 |
| execute | 纯净 node ESM 子进程（与 bash 同边界：`import()`/`require()`/`process` 全可用、无阻断、无目录限制）——超时强杀（默认 30s、上限 600s——2026-09-05 §14.1 核对 execute.mjs 修正：旧「上限 60s」记录过时——代码 `Math.min(t, 600_000)`——见 §14.1）；**exec-prelude 助手已退役（2026-09-03 §12——不预置任何全局——文件操作走专用工具）** |
| 返回契约 | `execute` 必须返回字符串（undefined 视为错误，dispatch 显式检查） |

## 1. 注册与 schema

- **注册表**（tools/index.mjs）：`builtinTools` 数组（25 个）——file 7（read/write/edit/insert_after/hashline_edit/read_image/read_pdf）、patch 2（apply_patch/delete）、system 4（bash/glob/grep/ls）、web 2（websearch/fetch）、git 2（git/question）、checklist、lint、lsp、codemode、tree、ops 3（file_ops/process/get_current_time）。
- **schema 生成**：`toOpenAISchema(tool)`（shared.mjs）——name/description/parameters 转 OpenAI function 格式；description 来自 `tools/*.md`（`DESC(name)` 机制：md 文件即描述源，带参数说明，模型看到的是完整使用手册而非一行字符串）。
- **工具契约**：`{ name, description, parameters, readonly?, sideEffectExempt?, parallel?, multimodal?, execute(args, ctx) → string }`；`ctx = { cwd, agent, depth, signal, callbacks, onOutput, onQuestion, onPermissionRequest }`。**execute 必须返回字符串**（undefined 视为错误，dispatch 显式检查）。
- **元工具**（agent-tools.mjs）：task / plan / goal / verify / subagent / skill / recent_changes / advisor / eng / timer / **read_history**——`readonly` 自管纪律工具；子代理按 role 过滤（explore/plan 只读，eng-coder 额外门控）。**read_history**（SESSION.md §9 权威）：查本会话人读线（`_fullHistory`——永不压缩、审计完整）——role/keyword/tool/since-until（epoch ms 时间窗）/limit/direction 筛选，返回 JSON 数组（内容截断 ~500 带标记、tool_calls 只列名）；**depth-0 only**（子代理各自上下文——语义混淆）；readonly → planMode 放行/免审批。

## 2. 安全边界（shared.mjs + 各工具）

| 面 | 机制 |
|---|---|
| **路径** | ~~`resolveInCwd(ctx, p)`（防 `../` 逃逸到工作区外）+ `assertInside` + `realpathNearest`（符号链接解算）；`resolveExternal` 显式白名单外部路径（仅 question 等特殊工具）~~——**被 §10.1 取代（2026-09-02）**：统一为无边界解析（resolveInCwd/resolveExternal 等价），信任模型 + 权限门禁为唯一防线 |
| **命令**（bash） | **零文本拦截（彻底——2026-09-04 已删除）**：破坏性命令（rm -rf/DROP TABLE 等）一律放行——恶意模型可用空白变体/heredoc/node -e 绕过，文本匹配拦不住且误伤正常操作；真实防线 = 审批层 + 快照。~~保留：`hasFileRedirection`（禁止 bash 写文件，路由到 write/edit，引导性非安全门）~~——**本函数 2026-09-04 已删除（用户裁定：写好文件想方设法绕——拦截只误伤正常操作——见 §13）**；保留 `detectDanger`（危险标注只提示不拦截：recursive-delete/sudo/pipe-to-shell/dd/mkfs/raw-device/chmod-777/fork-bomb，审批面板红标，引号感知防 commit message 误标）、git 破坏操作快照后放行（gitGuardSnapshot，永不拦截）；超时 120s |
| **网络**（websearch/fetch） | `isPrivateHost`（localhost/内网/云元数据 169.254.169.254）——SSRF 防护；响应体 ≤5MB；HTML 转文本（stripTags/htmlToText） |
| **文件** | `MAX_READ_LINES=2000`、`MAX_OUTPUT_CHARS=200_000`（超限落盘，模型见预览）；`normalizeEOL`（CRLF 统一）；write 前 `autoSyntaxCheck`（JS 文件自动 node --check 预检） |
| **lint** | `node --check` fast path + 语言级联（tsc/ruff/cargo/go vet）——~~eslint 级联~~（2026-09-02 §10.2 删除，零依赖） |
| **lsp** | 按需 spawn LSP server（`process.execPath` 直跑，无 shell），语义级诊断/跳转兜底 |

**execute 工具**（纯净子进程——2026-09-03 §12 更新）：子进程跑 `node --input-type=module --eval`/scriptFile——顶层 await/动态 `import()`/`console`/`fetch`/`process` 全可用（非 vm 沙箱、无 import 阻断、无 require 禁）——与 bash 同边界（无目录限制、无伪沙箱）；超时 SIGKILL 强杀（默认 30s、上限 600s——2026-09-05 §14.1 核对 execute.mjs 修正：旧「上限 60s」记录过时——代码 `Math.min(t, 600_000)`——见 §14.1）。**exec-prelude 助手已退役（2026-09-03 §12）**：readFile/writeFile/glob/grep/log/require 预置全局全删——inline code 纯净 node ESM——需要 fs/path 时 `import` node: 模块——文件读取/修改走 read/ls/glob/grep/write/edit 专用工具。

## 3. 调度与权限（见 AGENT-LOOP.md §4）

- **两段式**：Phase 1 预审（planMode/工程门/权限/hooks）→ Phase 2 顺序保序执行（只读并行、副作用串行）
- **readonly/parallel 标记**：readonly = 无副作用可并行；`parallel: true` = 显式声明可并行（如 grep/glob）；sideEffectExempt = 有副作用但豁免于"失效 advisor/verify"追踪（subagent）
- **undo 快照**：副作用工具执行前 `snapshotForUndo`（写前文件内容入内存栈），`/undo` 回滚
- **hooks**（PreToolUse/PostToolUse/PostToolUseFailure）：用户脚本可在 `~/.thincoder/hooks/` 定义门控/后处理（PreToolUse 返回 false 阻断执行）

## 4. MCP 客户端

MCP 机制统一规范见 **MCP.md**（权威源，已实现）——核心：MCP 工具**动态展开**为独立原生工具（`{server}_{tool}` 前缀、完整 inputSchema、execute→tools/call），网关式 `mcp` 工具已废弃移除；连接时机/失败语义/子代理继承均对齐 CLI。此处不重复，仅记工具注册表侧的一点：展开工具并入 `builtinTools` 数组、走统一 OpenAI schema，与内置工具无差别（可并行、完整 schema）。

## 5. 关键设计决策

| 决策 | 理由 |
|---|---|
| md 文件即 description | 长文档描述模型才理解边界；与代码分离便于迭代不触发 schema 变更 |
| bash 命令零文本拦截（**2026-09-04 彻底——重定向护栏已删除——§13**） | 文本匹配是安全剧场：恶意模型必然绕过（空白/heredoc/node -e），拦住的只有正常操作；真实防线 = 审批层（autoApprove）+ 快照（gitGuardSnapshot/checkpoint）。危险标注（detectDanger）只给人看，不构成边界——**2026-09-04 曾漏网 `hasFileRedirection`（引导性硬拦——2>&1 误报实证）——已随 §13 删除——彻底对齐** |
| 超限落盘而非截断 | 模型可再用 read 工具读全量；预览 2K 字符足够决策 |
| 沙箱只出不进 | 模型执行用户代码时，网络/文件系统读写按工具授权而非代码内自由——**2026-09-03 §12 注**：exec-prelude 退役后 execute 与 bash 同边界（无预置文件面——文件能力唯一入口 = 工具授权）；本行保留为历史决策记录 |
| 工具全部字符串返回 | schema 简单、dispatch 统一、流式展示统一 |

## 6. git 工具能力扩充（2026-08-23）

**需求**（用户观察「git 操作还在走 bash」+ 拍板「最全」）：git 操作模型常走 bash 而非 git 工具。三层缺口——能力（工具做不到带参/分文件操作）、描述（git.md 无反向路由）、提示词（main.md 无路由条款）。

**设计**：扩充 `git` 工具的 action 集，把日常 git 操作收敛进工具（bash 反向路由 + main.md 条款）。

**新增 action**（两端一致）：

| 组 | action | 说明 | 破坏性 |
|---|---|---|---|
| 暂存 | `add` | 分文件暂存；`path` 可选（不给则 `-A`）；`commit` 加 `path`（只暂存这些） | — |
| 发布 | `push` | 加 `remote` / `branch` / `tags` 参数 | outward |
| 标签 | `tag`（`tagAction` list/create/delete） | tag 创建/列举/删除 | delete 需确认 |
| 分支 | `branch`（`branchAction` list/create/delete/switch） | 分支管理 | delete 需确认 |
| 切换/还原 | `checkout` | 切到分支/ref（`ref`）或还原文件（`path`） | path 还原需确认 |
| 还原 | `restore` | 从 index/HEAD 还原文件（`path`，`staged?`） | 需确认 |
| 暂存栈 | `stash`（`stashAction` push/pop/list） | stash 管理 | pop 需确认 |
| 同步 | `fetch` / `pull`（`remote`/`branch` 可选） | 拉取远端 | outward |
| 回退 | `reset`（`mode` soft/mixed/hard） | 重置到 ref | hard 先 snapshot + 确认 |
| 撤销 | `revert` | revert 一个 commit（安全撤销） | — |
| 合并 | `merge` | 合并分支/ref（冲突如实上报） | — |
| 摘樱桃 | `cherry-pick` | cherry-pick 一个 commit（`ref`） | — |

**反向路由**（git.md 描述）：加 `**Route to git instead of bash:**` 段 + 逐条 bash→工具映射。

**提示词条款**（discipline.md）：加「git 操作用 git 工具、不要用 bash」的 Tool routing 条款（标准模式纪律，两端 byte-identical；git 路由属编码纪律、放 discipline.md 而非协调职责的 main.md——main.md 的「无路由条款」缺口**有意不改**，路由条款归属 discipline.md 的编码纪律段，main.md 不需要 cross-reference）。

**破坏性原则**（沿用「破坏性操作 snapshot-then-proceed」）：reset --hard / checkout 丢改动 / rm 等先快照再执行 + 用户确认。**两端统一为全量副本快照**（CLI `createCheckpoint` / VS Code 镜像 `src/tools/checkpoint.mjs`——CHECKPOINT.md F5 存储统一，VS Code 已弃用 git stash；同一目录 `~/.thincoder/checkpoints/{cwdHash12}/`，快照跨端互通。快照时机/恢复流程/commit 清理/语义边界见 **CHECKPOINT.md**，此处不复制）。**顺带修复的既有 bug**：`runGit` 对整段输出 `.trim()` 会剥掉 porcelain 首行的「 」（unstaged 标记），把 unstaged 误分类成 staged——status 改用保行前导空格的 `runGitRaw`。

**测试**（两端各验）：每个新 action 的成功路径 + 参数校验 + 破坏性快照触发；反向路由断言（git.md 含 Route to git、discipline.md 含条款）；全量回归不降。

**测试用例表**（对齐 §8 格式，2026-08-31 回补；用例在 `test/tools.test.mjs`）：

| # | 用例 | 输入 | 预期 |
|---|---|---|---|
| T-g-1 | add 分文件暂存 | git repo + 两个改动文件，`add path="a.txt"` | 仅 a.txt 进暂存区（status 干净区分 staged/unstaged） |
| T-g-2 | push 带远端/分支 | `push remote="origin" branch="main"` | git push 到指定远端分支 |
| T-g-3 | tag 三态 | `tag tagAction=create/list/delete` | 创建/列举/删除 tag；delete 走确认 |
| T-g-4 | branch 管理 | `branch branchAction=list/create/switch` | 列表/创建/切换分支 |
| T-g-5 | checkout 还原文件 | `checkout path="a.txt"`（有未提交改动） | 先快照（createCheckpoint）再还原 + 用户确认 |
| T-g-6 | stash push/pop | 改动 → `stash stashAction=push` → `pop` | 工作区暂存与恢复 |
| T-g-7 | reset hard 快照 | `reset mode="hard" ref=HEAD~1` | 先 createCheckpoint 再 reset |
| T-g-8 | revert 安全撤销 | `revert ref=<sha>` | 生成反向 commit，工作区干净 |
| T-g-9 | 参数校验 | 非法 `mode`/`tagAction`/未知 action | 报错列出合法值，不执行 |
| T-g-10 | workdir 子目录运行 | `git status workdir="sub/repo"` | 在子仓库执行；越界路径报错 |
| T-g-11 | 反向路由断言 | git.md/discipline.md 文本 | 含 "Route to git instead of bash" / 路由条款 |
| T-g-12 | status porcelain 保格 | 有 staged+unstaged 混合 | runGitRaw 保前导空格，分类不串 |
| T-g-13 | F7 新 action 集（2026-09-01） | 枚举两端 git 工具 action 集 | 恰 32 个（既有 21 + 新增 11：clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv），不含 P2（gc/config/fsck/bisect/grep/ls-files/merge-base/am/submodule）；两端一致 |
| T-g-14 | F7 破坏性快照（2026-09-01） | clean/rebase 执行（有未提交改动） | 执行前输出 `[snapshot … created before …]`；rebase 被拒时快照行仍在（F1 闭环）；dryRun clean 不删不快照 |

**受影响文件**：CLI `src/tools/git.mjs` + `src/tools/git-ext.mjs`（F7 扩展 action + 共享 git 辅助，500 行拆分）+ `src/tools/git-checkpoint.mjs`（checkpoint 子系统）+ `src/tools/git.md` + `src/prompts/discipline.md`、VS Code `src/tools/git.mjs` + `src/tools/git-ext.mjs` + `src/tools/git-checkpoint.mjs` + `src/prompts/discipline.md`、两端测试。

---

## 7. 工具「真覆盖」：workdir + scriptFile + 全工具路由（2026-08-23）

**需求**（用户问「git 工具有 workdir/filter 吗」「为什么 JS 还走 bash 不走 execute」，并要求按会话历史 bash 调用做真覆盖分析）：bash 调用可归三类——能力缺口（工具做不到被迫 bash）、路由缺口（工具做得到但习惯 bash）、合理 bash（npm/CLI/服务器）。逐项补齐。

**设计**：

| 缺口 | 补法 | 落点 |
|---|---|---|
| git 无 `workdir`（子目录/多 repo） | 加 `workdir` 参数（`ctx = {...ctx, cwd: resolveBaseDir(ctx.cwd, workdir)}` 遮蔽，isInside 校验防逃逸） | 两端 `git.mjs` |
| execute 只能 inline（`node <script>` 被迫 bash） | 加 `scriptFile`（跑 workspace `.mjs`/`.js`，子进程、无 prelude）+ `nodeArgs`（禁 `--eval`/`--inspect` 类）；`runNodeEval` 重构为接 args 的 `runNode` | 两端 `codemode.mjs`/`execute.mjs` + `execute.md` |
| grep/ls/delete/read 无反向路由 | 描述补「Route to X instead of bash」 | 两端描述 |
| 提示词路由零散 | discipline.md「Tool routing」扩为全工具路由总表（git/execute/读写搜/进程 + bash 适用边界） | 两端 discipline.md（byte-identical） |

**测试**（两端各验）：git workdir（子仓库运行 + 越界报错）；execute scriptFile（跑文件 + nodeArgs `--check` 好/坏语法 + 越界 + 缺参 + 禁 flag）；全量回归不降。注：测试里不断言 `node --test` 输出——嵌套 node --test（测试套件内再跑）输出为空属测试环境伪影，真实场景正常。

**测试用例表**（对齐 §8 格式，2026-08-31 回补；用例在 `test/tools.test.mjs` / `test/execute.test.mjs`）：

| # | 用例 | 输入 | 预期 |
|---|---|---|---|
| T-w-1 | git workdir 子仓库 | git 工具 `workdir="sub/repo"`（内含独立 .git） | 在子仓库执行（log 指向子仓库 HEAD） |
| T-w-2 | workdir 越界 | `workdir` 指向 workspace 外 | 越界正常执行（§10.1——无边界断言，与 bash 一致） |
| T-e-1 | scriptFile 跑文件 | execute `scriptFile="x.mjs"`（console.log 输出） | 子进程执行，stdout 返回 |
| T-e-2 | nodeArgs --check | 好文件（静默）/ 坏文件（SyntaxError） | 退出码区分，语法错误可见 |
| T-e-3 | scriptFile 越界 | scriptFile 指向 workspace 外 | 可指向 workspace 外文件——正常执行（§10.1） |
| T-e-4 | 缺参 | code 与 scriptFile 均缺 | 报错提示二选一必填 |
| T-e-5 | 禁 flag | nodeArgs 含 `--eval`/`--inspect` | 报错拒绝该 flag |
| T-e-6 | 路由描述断言 | grep.md/ls.md/delete.md/read.md 文本 | 各含 "Route to X instead of bash" |

**受影响文件**：CLI `src/tools/git.mjs` + `git.md` + `codemode.mjs` + `execute.md` + `grep.md`/`ls.md`/`delete.md`/`read.md` + `src/prompts/discipline.md`、VS Code 对应（git.mjs / execute.mjs / search.mjs / more-file.mjs / file.mjs / discipline.md）、两端测试。

---

## 8. checklist 工具坐标系断裂修复（2026-08-27）

**需求**（线上事故，用户报「两端都检查」）：agent 用 `checklist add` 得到任务 ID（`Added: [ ] T63: ...`），随后 `mark index 1-6` 想勾销自己刚加的条目，却误把列表头部无关条目标成 done（T15/T18/T20/T22/T24/T26，属另一任务域）。根因 = **add 返回 ID 坐标系，mark 只收 index 位置坐标系，两者无法对上**——agent 拿不到「T63 是列表第几位」，只能猜 index。

**三个叠加 bug**（三份 `checklist.mjs` 同源：thincoder / thincoder-vscode / thincoder-desktop/vendor）：

| # | bug | 现象 | 根因 |
|---|---|---|---|
| 1 | **mark 只收 index 不收 id** | 坐标系断裂，agent 猜 index 误标无关条目 | `mark` 用 `flat[args.index-1]` 定位，无 id 路径；`add` 返回 id，两者对不上 |
| 2 | **auto-ID 撞号/漂移** | `parse` 每次读文件给「无显式 ID 的行」重分配 ID，`write` 回写后 ID 漂移 | `parse` 第 58-62 行对无 id 根节点按「当前最大根号+1」分配；历史无 id 条目每次 parse 都可能重编号 |
| 3 | **ID 前缀累积重复** | done 归档出现 `T15: T15: T15: T15: T15: T15:` 六连 | 历史版本 write 时 prepend id 且 text 残留旧 id，round-trip 累积；当前代码已加 idMatch 剥离修复，但旧数据未清理 |

**修法**：

1. **`mark` 加 `id` 参数（string，任务 ID），id 优先于 index**——agent 用 `add` 返回的 ID 直接 `mark id=T63 status=done`，彻底消除坐标系断裂；`index` 降级为 fallback（description 明确「优先 id，index 仅在无 id 时用」）
2. **auto-ID 撞号/漂移**：`parse` 对文件里**已有的无 id 条目一次性分配 ID 并落盘**（之后不再漂移），新 add 条目按「已存在的最大根号+1 / 该父下已存在的最大子序号+1」分配（`target.length+1` 改「现有子最大号+1」，防非连续 ID 撞号）
3. **前缀累积归一**：`parse` 的 idMatch 剥离改为「剥**所有**连续的 `T[\d.]+:` 前缀」而非单次，读入即归一历史脏数据

**测试**（两端各验，用例表）：

| # | 用例 | 输入 | 预期 |
|---|---|---|---|
| T-cl-1 | mark 按 id 命中 | `mark id=T63 status=done`（T63 在列表中部） | 精确命中 T63，头部无关条目不受影响；返回 `Marked T63 → done` |
| T-cl-2 | add→mark id 闭环 | `add item="x"` 得 `Added: [ ] T63: x`，再 `mark id=T63` | 同一个 id 直通，无坐标系断裂 |
| T-cl-3 | id 优先 index | 同时给 `id=T63` 和 `index=1` | 按 id 命中 T63，忽略 index |
| T-cl-4 | index 兼容路径 | 仅给 `index=1`（无 id） | 沿用 `flat[0]` 命中，回归不降 |
| T-cl-5 | auto-ID 非连续不撞号 | checklist 有 T17/T19/T21（缺 T18/T20），`add` 两条根条目 | 分配 T22/T23（不撞 T18/T20、不覆盖 T19/T21） |
| T-cl-6 | 前缀累积归一 | 文件里 `- [ ] T15: T15: T15: 文本` | parse 读入剥掉全部 `T[\d.]+:` 前缀，text 仅剩「文本」，write 回写不再累积 |
| T-cl-7 | 无 id 条目不漂移 | 文件有历史无 id 行，多次 parse→write | ID 一次性分配后落盘稳定，不随每次读重编号 |

**受影响文件**：CLI `src/tools/checklist.mjs` + `src/tools/checklist.md`、VS Code `src/tools/checklist.mjs`、Desktop `vendor/thincoder/src/tools/checklist.mjs`（三份 byte-identical 收敛）+ 两端测试。

### 8.1 交付评审追补（R30 后续，2026-08-27 用户拍板）

交付评审发现两个预存在的边界问题（非 3-bug 引入，但影响正确性），用户拍板「现在修」：

**问题 1：标记父任务 done 静默丢弃子树（数据丢失）**——原 `mark` 只归档父节点（`children: []`），`splice` 把整棵子树一起从树里移除，子任务既不归档也不保留。

**修法（用户定：拒绝非法 + 全 done 才递归归档）**：父任务标 `done` 时——① 若其子树存在任何非 done 节点 → **拒绝并提示**「父任务仍有未完成的子任务，先处理子任务再标父 done」；② 若子树全部 done → **递归归档整棵子树**（父 + 全部子孙，连同 done 文件，层级保留）。不擅自丢弃、不擅自误归档。

**问题 2：归档最大号后 ID 复用（削弱稳定 ID 目标）**——`nextRootId` 只扫 `checklist.md`，归档 T63 后它不再参与 max 计算，下次 add 又得 T63，跨会话历史引用歧义。

**修法**：`nextRootId` 计算 max 时**同时扫描 `checklist.md` + `checklist-done.md` 两个文件的根号**——归档的 ID 恒占位，新 ID 单调递增不复用。

**测试**（两端各验——CLI + VS Code 各跑 `node --test`；Desktop vendor 端不单独跑测试，靠「三份核心逻辑 byte-identical 收敛 + `node --check` 语法校验」保证，追加用例）：

| # | 用例 | 输入 | 预期 |
|---|---|---|---|
| T-cl-8 | 父 done 子树全 done → 递归归档 | 父 T1 + 子 T1.1/T1.2 全 done，`mark id=T1 status=done` | 父 + 两个子都进 done 文件（层级保留），checklist 无残留 |
| T-cl-9 | 父 done 子树有 pending → 拒绝 | 父 T1 有子 T1.1(pending)，`mark id=T1 status=done` | 拒绝，返回「先处理子任务」，父子都不归档不删除 |
| T-cl-10 | 归档后 ID 不复用 | T62 是最大号，`mark id=T62 done` 后 `add` 一条 | 新条目得 T63（T62 归档后仍占位，不复用 T62） |

**受影响文件**（同上三份 + 补 Desktop `vendor/thincoder/src/tools/checklist.md` 描述源）：CLI `src/tools/checklist.mjs` + `src/tools/checklist.md`、VS Code `src/tools/checklist.mjs`、Desktop `vendor/thincoder/src/tools/checklist.mjs` + `checklist.md`（三份核心逻辑 byte-identical）+ 两端测试。


## 9. 工具顺手度（2026-08-31 用户批准"做"）

**原则**：**顺模型的手**——好工具让模型表达语义意图、工具做机械验证与定位；**"顺手的护栏" ≠ 没护栏**——该消的是"反直觉的形态"，不是"护栏本身"。

**① insert_after 精确判定**（消摩擦、护栏保留）：写入工具（write/edit/insert_after/hashline_edit）记录**受影响区** `lastWrite = { type, startLine, shift }`——`insert_after` 判定精确化：`after_line` 在**未受影响区**（≤ startLine）→ **允许**（行号未漂移——消掉"我写的文件被当外部修改必须重 read"）；在**受影响区内** → **拒绝**（护栏保留，错误消息含"was modified since your last read"子串向后兼容）；**write 全文重写** → 任何 after_line 拒绝。`read` 同时清 dirty + 写入快照（新视图以 read 为准）。**vscode 端不适用**（无 dirty 机制——getOpenDoc/磁盘读总是最新，行号漂移问题不存在）。

**② edit 数组形态**：`edit(edits: [{path, old_string, new_string, replace_all?}, ...])`——**一次多文件原子替换**（先全量检查所有替换可执行，任一失败全不写），与单文件参数互斥。CLI + vscode 双端（vscode 沿用 doc/磁盘双路径，EOL 保持原样）。**同文件多条规则（2026-09-01 缺陷修复）**：同一 path 的多条编辑按序**串行累积应用**（第 n 条基于前 n-1 条已应用的内容检查与替换）；跨 path 条目仍并行原子。任一条失败 → 全不写（原子性保留）。

**③ dispatch console 回显**（见 AGENT-LOOP.md §4 dispatch 段）：工具执行期间的 `console.log`/`console.error` 收集后附在工具结果后回显给模型（原只到终端、模型看不到）；异常路径（工具抛错前的探查输出——调试最有价值）同样回显。

**受影响文件**：CLI `src/tools/file.mjs`（lastWrite/recordWrite/edit 数组）、`src/agent/dispatch.mjs`（console 回显）、VS Code `src/tools/file.mjs`（edit 数组 parity）+ 两端测试（CLI 869/839/0、vscode 804/804）。


## 10. 工具作用域限制移除 + lint 基建零依赖化（2026-09-02，用户需求批：开发体验三项）

> **状态：已实现（2026-09-02，开发①②；CLI 端）**。用户裁定三项：① 删 eslint 全套改 node --check（✅ §10.2）；② 工具工作目录作用域限制**全部移除**（bash 可绕过、拦不住还空耗 token）（✅ §10.1）；③ 模型上下文长度可配置（见 PROVIDER.md §15，开发③已实现）。

### 10.1 工具作用域限制移除

**问题**：`shared.mjs` 的 `resolveInCwd` 对路径做双重边界断言（`assertInside`：resolve + realpath 逃逸抛 "Access denied outside working directory"）——file/patch/ops/edit-batch/tree/linter/system 等工具受限；但 **bash 工具无任何限制**（本就可任意路径），模型碰到限制就用 bash 绕——机制拦不住真实意图，只增加一次失败往返 + token 空耗（用户实证判断）。

**需求**：F1 = 所有工具路径解析**不再做工作目录边界断言**（与 bash 对齐：信任模型 + 权限门禁是唯一防线）；F2 = 工具描述中 "confined to workspace" 类措辞移除（避免误导模型绕行）。

**残留风险声明（评审 #4 补）**：受认可的写通道（write/edit/apply_patch）失去工作区约束后**写面扩大**（可写工作区外 dotfiles/敏感路径）——此前 bash 写文件的重定向拦截仅导引导性（bash 可经 `node -e`/`cp` 等绕过——**2026-09-04 连同已被删除——§13**），故实际能力并无新增，只是去掉"Access denied"失败往返（用户裁定：拦不住还空耗 token）。**权限门禁（审批）+ 破坏性操作快照（gitGuardSnapshot）不变**，仍是防线；用户接受此残留风险。

**设计**：

- **D-W1 边界断言移除（全工具，评审 #3 定死）**（两端）：`shared.mjs` `resolveInCwd` 改为与 `resolveExternal` 等价（**保留函数名去掉断言**——7 个调用方零改动，语义从"限界"变"解析"）；`assertInside`/realpath 双重检查删除。**逐工具枚举（评审 #3）**：file/edit-batch/patch/ops/tree/linter/system/read_image 等全部文件类工具（resolveInCwd 调用方）；**git workdir 的 isInside 越界检查一并移除**（§7 T-w-2 改"越界正常执行"——git 命令本身不限目录，与 bash 一致）；**execute scriptFile 越界拒绝一并移除**（§7 T-e-3 改"可指向 workspace 外文件"——bash 可执行任意脚本，保持一致）；**file_ops（move/copy/rename）目录限制一并移除**
- **D-W2 工具描述同步**（两端）：file/execute/git 等描述中的 "confined/within the working directory/边界" 措辞移除或改"路径相对 cwd 解析，不做目录限制"
- **D-W3 测试**：逃逸断言测试（"Access denied outside working directory" 相关）删除或改"路径正常解析"；回归全绿

**受影响文件（两端，评审 #3 补全）**：`src/tools/shared.mjs`（resolveInCwd 去断言 + 删 assertInside）、file/edit-batch/patch/ops/tree/linter/system.mjs（resolveInCwd 调用方，保留函数名零改动）、**git.mjs（workdir isInside 移除）、codemode.mjs/execute（scriptFile 越界拒绝移除）、file_ops（目录限制移除）**、工具描述文本（"confined to workspace" 类措辞）、逃逸测试（CLI test/tools*.test.mjs + VS Code 对应，含 §7 T-w-2/T-e-3 更新）、**TOOLS.md §0/§0.1/§2 取代指针（评审 #2）**、AGENTS.md（目录限制纪律若提及则更新）。

**受影响文件（CLI，✅ 2026-09-02 已实现）**：`src/tools/shared.mjs`（resolveInCwd ≡ resolveExternal，assertInside/realpath 双重检查删除）、`src/tools/git.mjs` + `src/tools/execute.mjs`（resolveBaseDir 去 isInside；execute scriptFile 越界检查移除）、`src/tools/file.mjs`（allowExternal 参数描述改 no-op）、工具描述（`execute.md`/`git.md`/`file_ops.md` + 工具定义 description）、`src/prompts/system.md`（工作目录边界规则改"路径相对 cwd 解析不做目录限制"——**VS Code 端待镜像**）、`test/tools.test.mjs`（T-W1/W2/W5 新增 + T-w-2/T-e-3 改语义 + apply_patch/file_ops 逃逸测试改写）。**VS Code 端文件集由并行任务处理（1b）**。

**测试**：T-W1 外部路径（`../outside.txt`）read/write/edit 正常解析执行（不再抛 Access denied）| F1；T-W2 bash 与文件工具行为一致（同路径均可达）| F1；T-W3 工具描述无 "confined to workspace" 类措辞 | F2；T-W4 回归全量绿；**T-W5 symlink（评审 #11）**：workspace 内符号链接指向外部文件 → read 正常解析执行（realpathNearest 移除后语义）| D-W1。

**测试（✅ 2026-09-02 已实现，`test/tools.test.mjs`）**：T-W1 ✅（read/write/edit `../` + 绝对路径原样解析（评审 round2 #5））；T-W2 ✅（bash 与文件工具同路径互达）；T-W3 ✅（描述文本 grep 干净：src/tools 无 confined/workspace 类措辞）；T-W4 ✅（全量回归绿）；T-W5 ✅（symlink 指向外部 → read 正常；Windows 无权限时 t.skip）。

### 10.2 lint 基建零依赖化（删 eslint 全套）

**问题**：CLI + VS Code 的 `package.json` 都有 devDependencies（eslint + @eslint/js）——与"零依赖"承诺相悖。**检测能力损失（评审 #6 声明）**：eslint 除 unused-vars 外还抓过 control-regex/regex-spaces/no-undef 等真实 bug 类（2026-08-31 test/ 清理：18 control-regex + 4 regex-spaces + 2 no-undef）——`node --check` 仅语法级，不再覆盖这些；用户裁定接受该损失（零依赖优先），遗留风险由测试与真实链路验证兜底。

**需求**：F1 = 删除 eslint 全套（devDependencies + eslint.config.mjs + lint script 中的 eslint 调用）；F2 = 语法检查用 node 自带能力（`node --check`），零依赖脚本。**板块取代（评审 #5）**：本文档文档地图"CLI Lint 引入"板块（CLI-LINT-REQUIREMENTS.md / CLI-LINT-TUNING.md）的 eslint 引入决策被本段**取代（2026-09-02）**——实现时在 CLI-LINT-REQUIREMENTS.md / CLI-LINT-TUNING.md 头部标记"被 TOOLS.md §10.2 取代"，保留沿革快照不删内容。

**设计**：

- **D-L1 删除**（两端）：`package.json` devDependencies 移除 eslint/@eslint/js；`eslint.config.mjs` 删除；`scripts.lint` 改为 `node scripts/check-syntax.mjs`
- **D-L2 check-syntax 脚本**（新增，CLI + VS Code 各一）：遍历 `src/**/*.mjs` + `test/**/*.mjs` + `bin/*.cjs`，逐个 `node --check`（spawnSync(process.execPath, ["--check", file])）；非零退出汇总报错文件清单；零依赖（node 自带）
- **D-L3 引用面更新（评审 #5 补全）**：AGENTS.md（"Every change must be verified by running it" 段若提 lint）、RELEASE.md（发布门禁若含 eslint）、README（零依赖声明不变——删 devDeps 后更纯粹）、**CLI-LINT-REQUIREMENTS.md / CLI-LINT-TUNING.md（标记被取代）**、CHANGELOG
- **D-L4 测试**：check-syntax 脚本自身跑通（全文件语法通过）；删除 eslint 后 `npm test` 回归全绿

**受影响文件（两端）**：`package.json`（devDeps 删 + lint script 改）、`eslint.config.mjs`（删）、`scripts/check-syntax.mjs`（新增）、AGENTS.md/RELEASE.md（引用面）、CHANGELOG.md（父代理）。

**受影响文件（CLI，✅ 2026-09-02 已实现）**：`package.json`（devDeps 删 + lint script 改 `node scripts/check-syntax.mjs`）、`eslint.config.mjs`（已删除）、`scripts/check-syntax.mjs`（新增，遍历 src/test/bin/scripts 含自检，可选路径参数供失败路径测试）、`src/tools/linter.mjs` + `lint.md`（eslint 级联分支删除，tsc/ruff/cargo/go 保留）、`src/prompts/discipline.md`（lint 路由行 "ad-hoc eslint runs" → "ad-hoc node --check runs"——**VS Code 端待镜像**）、CLI-LINT-REQUIREMENTS/TUNING.md（标记被取代）、docs/design/README.md（地图条目）。AGENTS.md/RELEASE.md 检查无 lint/eslint 提及（无需改）。**VS Code 端文件集由并行任务处理（1b）**。

**测试**：T-L1 `npm run lint` = node --check 全量语法通过（0 报错）| F2；T-L2 `npm test` 回归全绿 | F1；T-L3 无 eslint 引用残留（grep eslint 于 package.json/scripts）| F1。

**测试（✅ 2026-09-02 已实现，`test/lint.test.mjs`）**：T-L1 ✅（slow 测试：check-syntax 默认集全过；另命令级验证 `npm run lint`）；T-L2 ✅（全量回归绿）；T-L3 ✅（grep eslint 于 package.json/scripts/**src/**（评审 round2 #1 扩范围）零命中）；T-L4 ✅（评审 round2 #3 新增：坏文件非零退出 + 错误文件出现在清单——check-syntax 支持显式路径参数供注入）。

### 10.3 关键决策

- **保留 resolveInCwd 函数名**（去断言而非删名）：7 个调用方零改动，语义从"限界解析"变"解析"——最小面；`resolveExternal` 保留（兼容既有引用）
- **node --check 而非自定义 linter**：语法级检查覆盖"写坏文件"主风险（解析错误）；unused vars 类警告放弃（49 条全 unused、无行为价值）；零依赖目标优先
- **否决**：a) 保留 eslint 挪全局（仍依赖、违零依赖）；b) 只移除部分工具限制（"不少工具有限制"——全部移除，bash 一致性）；c) 作用域限制改"警告不阻断"（仍空耗 token——用户裁定干脆去掉）


## 11. read_pdf：文本型 PDF 提取（2026-09-03 · 设计——评审通过——决策点定稿）

> 老 TODO（2026-08-27 立项——误标 done 恢复——docs/TODO.md 条目待本设计批准后补回）。现状缺口：read 对 .pdf 直接 utf8 解码出乱码——无拦截无引导。约束：纯 Node ≥24、ESM、零 npm 依赖（node:zlib 内置——全仓首个 zlib 用户）。

### 11.1 需求

- F-P1：read_pdf 工具——**文本型 PDF** 提取为纯文本（read 家族对齐：行号分页心智、64K 落盘机制白拿）
- F-P2：加密 PDF（/Encrypt）拒绝并明示；**扫描/图像型 PDF = 自动 multimodal 回传**（提取页图像随结果回传——模型视觉读——无视觉 provider 时降级文字指引——2026-09-03 用户裁定 c2）
- F-P3：不支持形态（Type3 字形 run/LZW/无法解码编码）明确报错或警告+尽力输出——**不静默**
- F-P4：page 选择参数（形态见决策点）

### 11.2 设计（9 段解析管线——explore 可行性确认 ✓）

1. **头校验**：%PDF-x.y——容忍尾部垃圾取最后 startxref
2. **xref 双形态**：经典文本表 + XRef 流（/W//Index + Flate + **PNG 预测器**——必踩坑）
3. **trailer**：/Root、/Encrypt 检测→拒绝、/Prev 链取最新段
4. **对象解析**：直接对象 + /ObjStm 对象流
5. **页树**：/Pages /Kids 递归、/Contents 单流或数组
6. **内容流解码**：Flate=zlib inflateSync ✓、ASCIIHex/ASCII85、/Filter 链逆序；LZW 拒
7. **文本操作符**：BT/ET、Tf/Td/TD/T*/Tm 位置追踪、Tj/TJ/'/"，\(/\ddd 八进制转义、hex 串
8. **编码映射**（最复杂）：/ToUnicode CMap bfchar/bfrange（1 字节 simple + 2 字节 CID/Identity-H）；无则 WinAnsi/Standard/MacRoman + /Differences 回退；Type0 无 ToUnicode → 警告
9. **布局**：(x,y) 收集、y 降序 x 升序组行、间隙插空格、分段、--- Page N ---

**复杂度分档（关键——v1 必须含 Tier 2）**：Tier 1（教科书）不够——Chrome 打印/Word/LibreOffice/LaTeX/Quartz 全在 Tier 2（XRef 流 + ObjStm + PNG 预测器 + Type0/ToUnicode 2 字节 + TJ + /Prev）——只做 Tier 1 会"demo 能跑、真实 PDF 大面积失败"。

**文件形态**：独立模块 **src/tools/pdf-parse-xref.mjs + pdf-parse-text.mjs（双核——500 硬限预拆）+ pdf.mjs（工具壳——read_pdf 注册 + DESC + multimodal:true——readonly: true 即全链路生效：planMode 白名单/免审批/explore 只读集零额外代码）——file.mjs 495 行不能承接。

**同步面**：read.md 路由段 + discipline.md 工具总表（**两端 prompts 15 文件 byte-identical 铁律**——thincoder-vscode/src/prompts/discipline.md 必须同改）+ TOOLS.md §1 计数 + ARCHITECTURE.md 模块注释 + FEATURES.md。

**测试**：fixture 全部运行时生成（仓库零二进制——buildPdf 帮助函数同构 oh-my-pi warningPdf——字节偏移运行时算 + zlib deflateSync）——用例矩阵 10 项（最小经典 xref/Flate 流/ToUnicode bfrange/Type0 CJK/XRef 流+ObjStm/TJ 空格/加密拒绝/WinAnsi 回退/嵌套页序/坏 xref）——test/pdf.test.mjs。

### 11.2a 决策点初稿（评审/用户拍——**11.3 定稿替代——历史保留**）

1. pages 参数形态（read 的 offset/limit 心智 → "1-3,5" 页选择？）与单页输出上限
2. 扫描件错误是否给 read_image 指引（F-P2 已建议——确认措辞）
3. 多栏/表格不识别是否需文档声明（第一版声明不支持——还是尽力拼接）

**受影响文件**：新 src/tools/pdf.mjs（壳）+ pdf-parse-xref.mjs + pdf-parse-text.mjs（双核——500 硬限预拆）+ read_pdf.md、tools/index.mjs 注册、read.md 路由段、两端 discipline.md（byte-identical）、TOOLS.md、ARCHITECTURE.md、FEATURES.md、新 test/pdf.test.mjs（17 用例）——**2026-09-03 交付实测**：xref 499 / text 497 行——**11.2 旧"9 段管线"散文与 11.3 用例矩阵以交付为准**（TOOLS.md §1 计数 + ARCHITECTURE/FEATURES 已同步）、docs/TODO.md（条目补回）。

### 11.3 决策点定稿（2026-09-03 用户拍板）

1. **pages 参数 = "1-3,5" 页选择**（PDF 原生心智——页上限 50 页/次——超限报错提示缩小范围——结果超限走 64K 落盘机制白拿——与 read 家族同管线）
2. **扫描件 = c2 multimodal 自动回传（用户裁定）**：read_pdf 遇无文本操作符页 → 提取页图像（DCTDecode JPEG 直接提/Flate 灰度转 PNG——DCT 为常见扫描件形态）→ 工具结果 {text, images} multimodal 回传（**read_image 同机制——multimodal:true——agent 层转视觉消息——模型自动读图转录**）——零新架构（视觉门复用：model.multimodal false 时扫描页降级为文字提示"需多模态 provider——以 read_image 通道读"）——F-P2 修订（原"报错指引"改"自动回传"）
3. **多栏 = v1 轻量 x 聚类分栏**（布局段 +100-150 行——x 坐标分布找栏间隙 gap → 分栏内 y 序排——双栏论文/杂志可用——不规则布局尽力）；**表格识别 v1 不做**（明示声明——行列结构推断独立研究题）
4. 节编号 = §11（原重复 §9 已改——评审 #1）——管线 9 段计数对齐（评审 #2）

### 11.4 评审 refinement 处置（2026-09-03——0🔴 通过——8 项）

1. 编号 §11（上文）2. 9 段计数对齐 3. 测试矩阵补：图像型页 multimodal 回传用例（F-P2）/Type3 字体 run 报错/LZW 拒（F-P3）/pages 选择 + 坏页规格（F-P4）4. pdf-parse 超 500 预拆边界：**pdf-parse-xref.mjs（xref/流/ObjStm/预测器）+ pdf-parse-text.mjs（页树/内容流/文本操作符/CMap/编码/布局）双核**（AGENTS.md 500 硬限纪律）5. VS Code parity：**v1 CLI-only 明示**（VS Code 镜像后续立项——discipline.md 两端 byte-identical 仍同批）6. golden fixture：测试内嵌 1 个外部真实 PDF（base64——浏览器打印产物）交叉验证（防解析器与 fixture 生成器同手同错）7. 64K 阈值语义：实现时核实 read 家族实际落盘阈值（TOOL-OUTPUT-LIMITS 权威——文档措辞跟随）8. 加密/坏 xref/ObjStm 循环——inflate 尺寸上限 + 递归守卫（hostile PDF 韧性）

## 12. execute prelude 助手退役：纯净 node 子进程（2026-09-03 · ✅ 已实现——用户裁定——评审通过）

> 状态：✅ 已实现（2026-09-03——评审 0🔴 通过 + 复审 0🔴——token 85521a97——CLI thincoder + VS Code thincoder-vscode 两端同步落地——D-E1..E7 全落地——T-E1..E4 两端全绿——commit 444bc28 处置必读）。触发：execute 描述宣称预置 readFile/writeFile/glob/grep/log/require 全局——实际使用中模型反复绕开专用工具（read/ls/glob/grep/write/edit）在 execute 内做文件操作——bash 重定向有硬拦截而 execute 助手零拦截——不对称。

### 12.1 需求

**总体需求**：execute = "跑代码的地方"，不是读文件/改文件的地方——预置文件助手制造"execute 是全能文件入口"的心智锚，诱导模型在 execute 内做本应走专用工具的操作（读写皆然）——全部退役——execute 回归纯净 node 子进程（与 bash 同边界——需要 fs/path 自己 `import` node: 模块——一行 import 不比 readFile() 长——但显式性让模型知道自己在用通用 node 能力）。

**功能性需求**：
- F-E1：execute inline code 子进程不再注入任何预置全局（readFile/writeFile/glob/grep/log/require 全删——exec-prelude.mjs 整体退役）
- F-E2：execute 描述（execute.md + 内嵌 description）不再宣称任何预置全局——明示"纯净 node ESM 环境——文件操作走 read/ls/glob/grep/write/edit 专用工具——需要 fs/path 时 `import` node: 模块自己写"
- F-E3：scriptFile/nodeArgs/过滤/超时/路径语义不变（scriptFile 本就无 prelude——零影响）
- F-E4：两端对称（CLI thincoder + VS Code thincoder-vscode——VS Code src/tools/exec-prelude.mjs 同删）

**非功能性需求**：工具路由纪律闭环（bash 重定向硬拦 + execute 无诱导源 = 对称）；零行为回归（execute 能力面：inline/import/scriptFile/超时/过滤全保留）。

### 12.2 设计

- **D-E1 删文件**：CLI `src/tools/exec-prelude.mjs` + VS Code `src/tools/exec-prelude.mjs`——整体删除（readFile/writeFile/glob/grep/log/require/safe/globToRegex 全随删——无其他文件 import 它——test/ 无引用）——**desktop vendor 副本不在本次范围（评审 #2——若 vendor 树含 exec-prelude 由 desktop 仓后续同步——不静默）**
- **D-E2 execute.mjs 净化**（CLI + VS Code）：删 import prelude 逻辑——inline code 子进程 = 纯净 `node --input-type=module --eval`——顶部注释（L13 区）同步改写
- **D-E3 描述重写**（CLI src/tools/execute.md + VS Code 对应——两端 byte-identical）：删 "Globals: readFile/writeFile/..." 清单——改为"纯净 node ESM 子进程（顶层 await/动态 import 可用）——不预置任何全局——文件读取/修改走 read/ls/glob/grep/write/edit/apply_patch 专用工具"——头部注释 prelude 注删、"use writeFile to a file" 句改 "output capped——大输出经 bash 落盘或分段"（注：实际大输出机制 = 超限落盘自动——措辞由实现者核实现状再写）——execute.mjs 内嵌 description 同改（评审 #5——行名/内容锚——不用行号）
- **D-E4 TOOLS.md 同步（评审 #3 补全——评审 #5 行名锚——不用行号）**：§2 "execute 工具（沙箱）" 段早已过时（import 阻断/require 禁——712af6f 子进程化后不实）——顺带修正为纯净子进程现状 + prelude 退役注；**§0.1 表 execute 沙箱行（同款 stale 声明 import 阻断/require 禁/只出不进——评审 #3）+ §0.1 工具超时行 "execute 沙箱强杀" 措辞检查**——一并改纯净现状口径；§5 决策表 "沙箱只出不进" 行（按行名锚定——评审 #4）加注（execute 与 bash 同边界——无预置文件面——文件能力走工具授权）；**§0.1 路径安全行 "路径仅相对 cwd 解析" 与 §2 路径行 "无边界解析" 措辞统一（评审 #8——§10.1 语义：相对→cwd、绝对原样、无边界断言）**
- **D-E5 测试改写**（CLI test/tools.test.mjs execute 段 + **VS Code 对应测试（评审 #6——F-E4 两端对称需测试侧同镜像）**）：grep 助手用例改原生实现（fs 读+正则——它本来就该这么写）；log/require 用例改 console.log/原生——用例表：
  - **T-E1（F-E1——正常）**：execute inline code 里 typeof readFile/writeFile/glob/grep/log/require === "undefined"——两端各一
  - **T-E2（F-E2——正常/内容断言——fail-when-unchanged）**：execute.md + 内嵌描述**不含** prelude 预置声明（"Globals:"/"预置 readFile/writeFile" 字样）且**含** routing 句（"文件操作走 read/ls/glob/grep/write/edit 专用工具"——评审 #4 加强——presence + absence 双断言）——两端各断言
  - **T-E3（F-E3——回归——零变化验证）**：inline 纯代码/import()/scriptFile/nodeArgs/超时/过滤既有用例全保持绿
  - **T-E4（F-E1——错误路径——评审 #1 补）**：inline code 调用已删助手（readFile("x")）→ ReferenceError 出现在工具结果（明确失败——不静默）
- **D-E2 修订注（评审 #5）**：顶部注释位置改内容锚（"头部注释区"——不用行号）
- **D-E7 引用面 sweep（评审 #3——对齐 §10.2 D-L3 先例）**：grep "prelude"/"Globals"/"预置 readFile" 跨 prompts（discipline.md 等）+ docs（README/ARCHITECTURE/FEATURES）——两端——残留声明同批清理或加退役指向
- **受影响文件清单（合并——评审 #3）**：CLI `src/tools/exec-prelude.mjs`（删）+ `src/tools/execute.mjs`（净化）+ `src/tools/execute.md`（描述）+ `test/tools.test.mjs`（用例改写/T-E1..4）+ `docs/design/TOOLS.md`（§12 本段 + D-E4 同步点）；VS Code `src/tools/exec-prelude.mjs`（删）+ `src/tools/execute.mjs`/`execute.md`（对应）+ 对应测试
- **D-E6 验收（✅ 2026-09-03 全过）**：T-E1..E4 全绿（两端——CLI test/tools.test.mjs + VS Code test/execute.test.mjs）；既有 execute 能力用例全绿（inline/import/scriptFile/nodeArgs/超时/过滤——**路径语义按 §10.1：无越界拒绝（评审 #1——T-w-2/T-e-3 行随 §10.1 已改"可指向 workspace 外"——本批已 sweep 残留旧行）**）；**D-E4 文档编辑与代码同批落（评审 #8——不在实现后补）**；TOOLS.md §12 本段勾销

**交付记录（2026-09-03）**：两端 exec-prelude.mjs 已删；execute.mjs inline code = 纯净 `node --input-type=module --eval`（无 prelude import、无 THINCODER_EXEC_ROOT env）；描述 byte-identical（CLI execute.md 与 VS Code execute.mjs 内嵌 description 逐字节相等——程序化校验 === true：字符串 2354 字符 / UTF-8 落盘 2384 字节——三面：整体描述/code 参数/scriptFile 参数相等；措辞避开 mock 词 "slow/queued"——VS Code subagent T3 的 body 正则会把 execute 描述误判为慢任务）；T-E1..E4 + 既有能力用例 CLI execute 段 8 绿 / VS Code 27 绿；D-E7 sweep：prompts/discipline 无残留、VS Code ARCHITECTURE.md 退役指向已加（含 §3 工具清单 execute 行改纯净子进程口径——原 "vm 沙箱 JS" 陈旧声明已清）；desktop vendor 副本不在范围（工作区无 vendor 副本可同步——glob 全仓零命中）。遗留（🔵 已知残留，非本设计范围）：VS Code ARCHITECTURE.md §3 "路径安全" 行（L112-114）仍描述 §10.1 移除前的 resolvePath 边界断言——属 2026-09-02 §10.1 交付的文档同步缺口，后续可同批加 "——§10.1 移除" 指向。

## 13. bash 工具重定向护栏删除（2026-09-04 · 用户裁定——R3'——替换原 R3 修误报设计）

> 状态：**已实现（2026-09-04——用户裁定方向变更：不修误报——整个删除 `hasFileRedirection` 拦截——"agent 决定要写会想方设法绕——拦截也拦不住"——与 §5 既有决策"bash 命令零文本拦截（安全剧场）"彻底一致——原 R3（修 fd 误报——评审 0🔴 token bd955bb8）已被替换——round2 复审 0🔴（token d6f6bd3a——6+7 项建议全处置）——用户批准——实现：id:13（clean——L1 1360/1312/0 fail——T-B1'.0 正路径 + T-B1'.1/.2 防回潮——bash.md 失实句清——父侧 L2 核销 2026-09-04））**。

**需求（F-B1'——登记句——用户裁定版）**：作为用户，我希望 bash 工具**不拦截写文件**——agent 决定要写会想方设法绕（`node -e`/`cp`/heredoc/空白变体）——文本匹配拦不住且只误伤正常操作——`hasFileRedirection`（src/tools/shared.mjs）整条删除——与既有"零文本拦截"决策（§5 关键决策——安全剧场）对齐——`2>&1` 误报、测试收窄被拦、被迫重跑整链消除。

**范围（用户裁定——已确认）**：
- ✅ 删：`hasFileRedirection` 函数（shared.mjs——含 blankQuoted 若仅此引用）+ 调用点（system.mjs bash 护栏）+ 相关测试段（tools.test.mjs"bash 护栏：重定向检测引号感知"——整套删除——用户"现在测试爆炸得太厉害了"）；
- ✅ 保：**DANGER_PATTERNS 危险标注**（detectDanger——只给人看不拦——用户明确"保留"）；
- ✅ 保：审批层 + 快照（真实防线——不变）；
- ⚠️ 不碰：危险标注/其他机制（本批只删重定向护栏——不引入替代）。

**设计（D-B1'）**：
- **D-B1'.1（删函数）**：shared.mjs `hasFileRedirection` 整段删除（含 blankQuoted——实现批 grep 核实 blankQuoted 无其他引用则一并删——有则留）；
- **D-B1'.2（删调用点）**：system.mjs bash 护栏检测处（hasFileRedirection 调用）删除——bash 执行不再做重定向检测——直接进权限/快照层；
- **D-B1'.3（零新机制）**：不引入替代检测——信任模型生效（§5 决策已定——本批补上漏网的最后一块——§5 决策表行注明 2026-09-04 彻底）。

**测试（T-B1'——用户"删掉"——删整段 + 防回潮负断言）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-B1'.1 | N | grep src/ 无 `hasFileRedirection`（导出/消费方均无） | 零命中（防回潮——fail-when-unchanged 精神） |
| T-B1'.2 | N | tools.test.mjs 无"bash 护栏：重定向检测"测试段 | 删除确认——既有引用断链零（node --check 绿） |
| T-B1'.3 | E | 全量快层回归——既有测试零破坏（删除不引起引用错误） | npm test 快层全绿 |
| T-B1'.0 | N | **正路径（评审 #1——METHODOLOGY 硬流程：每条用户故事至少一用例）**：bash 执行 `echo hi > f.txt`（重定向写文件） | **成功——文件创建——无护栏消息**（护栏不存在 = 直接执行——由权限层裁决） |

**受影响文件**：
- CLI `src/tools/shared.mjs`（删 hasFileRedirection——blankQuoted 核实后随删或留）；
- CLI `src/tools/system.mjs`（删护栏调用点）；
- CLI `test/tools.test.mjs`（删"bash 护栏：重定向检测引号感知"测试段——约 27 行——**删除前核对段边界不吞 detectDanger 测试——评审 #5**——T-B1'.0 正路径用例加入——评审 #1）；
- **VS Code 端：零**（grep 核实——检测器 CLI 独有——terminal-bash 无此护栏——实现前重新 grep 两端确认零命中——**grep 范围含 test/——评审 #5**）；
- **实现批 sweep（评审 #3）**：grep `hasFileRedirection`/`重定向`/`redirect`（两端 src/ + prompts + docs）——残留措辞同批清理或加删除指向——至少确认零命中；
- 文档：TOOLS.md §2（命令行——删"保留：hasFileRedirection"）+ §5（决策表——行注明 2026-09-04 裁定）+ §13（本节）+ TODO.md 需求池 R3（**行文本改 F-B1' 句——评审 #4**——实现后勾销）。

**验收（AC-B1'）**：AC-B1'.0 = T-B1'.0 绿（正路径——bash 重定向写文件成功——用户故事直接映射——评审 #1）；AC-B1'.1 = src/ 无 `hasFileRedirection` 残留（grep 零命中——T-B1'.1）；AC-B1'.2 = 测试段删除确认（T-B1'.2）；AC-B1'.3 = 引入后 npm test 快层全绿（零破坏——T-B1'.3）；AC-B1'.4 = 父侧 L2 test:full 核销。



## 14. 工具调用失败回降：三改进（2026-09-04 · 用户"这些先确定"——来源：traces 工具失败统计（2026-09-03/04 全量 234K 调用——12.6% 失败——337 唯一场景——统计判定器已验证））

> 状态：**已实现（双端——CLI id:28 clean（L1 1371/1323/0/48skip——含 edit-batch.mjs 清单外（设计预判条款内））+ VS Code id:29 clean（L1 1070/1070——insert_after 落点 more-file.mjs——清单已补）——T-TF1..5 全绿——评审 0🔴 token db9b3873——父侧 L2 核销待全部批次后）**。

**问题（P-TF——数据）**：①行号敏感工具失败率高（insert_after/hashline_edit/edit——old_string/hash/行号不匹配 ≈ 15,000 次/2 天——**防线正常打回——但模型反复重试浪费**）；②edit old_string not found 是最大单类（≈3,376 次——模型参数来自旧 read——文件不匹配）；③fetch 69.3% 失败（9-03 样本——被墙/403/无 proxy）。

**需求（F-TF）**：作为用户，我希望**工具失败后 agent 更少反复重试**——失败信息本身引导下一次正确调用。
- **F-TF1（A——行号敏感提示强化）**：`insert_after`/`hashline_edit`/`edit` 工具描述 + system.md 提示句补——**"行号/hash/old_string 必须来自最近一次 read——文件被改过则重读"**——让模型调用前先重读（数据：行号漂移 5,700 次/2 天——防线打回成本）；
- **F-TF2（B——edit 失败结果增强）**：`edit` old_string not found 错误文本补**自动 grep 建议**（"searched: <片段>——可用 grep 定位实际内容"）——让模型失败后立即定位——不盲目重试（数据：old_string not found ≈3,376 次）；
- **F-TF3（D——fetch 失败提示）**：`fetch` 网络失败（UND_ERR/403/超时）错误文本补**proxy 参数提示**（"network failure — retry with proxy: 'http://host:port' if the target is blocked"——**不自动路由——遵守 2026-08-31 裁定"proxy 显式传不自动应用"**——数据：fetch 69.3% 失败）；**websearch 处置注（id:28 交付辨认——2026-09-04）**：websearch 网络失败被吞为 `(no results)`（无错误文本分支）——加提示需改成功路径文本/逻辑——违 NF-TF 零破坏——**本批 de-scope——websearch 不落提示**（后续如需区分网络失败/空结果——立项另议）；
- **NF-TF**：零破坏——既有错误/成功文本非目标部分零改（仅追加提示句）——既有断言全绿。

**设计（D-TF）**：
- **D-TF1（A——描述+system.md——评审 #1/#2 修正：文件名钉实 + 英文锚逐字）**：`tools/insert_after.md`/`tools/hashline_edit.md`/`tools/edit.md` 描述失败语义补句 + `src/prompts/system.md`「How you work — while coding」加一句（与 §20.9 Module Split 段同域——**同批排队**）——两端语义锚。**逐字锚（两端照抄）**：描述句 = "use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed"；system.md 句 = "Line-number-sensitive tools (insert_after, hashline_edit) and exact-match tools (edit) require the freshest read — re-read the file before calling if it may have changed."；
- **D-TF2（B——edit 代码——评审 #1/#2 修正）**：CLI `src/tools/file.mjs` 的 old_string not found 错误分支（若在 `edit-batch.mjs`——定位确认后列出——`file.mjs` 是权威——§9 同列）——结果文本追加 grep 建议行（英文逐字）："searched: <fragment> — use grep to locate the actual content"；
- **D-TF3（D——fetch 代码——评审 #1/#2 修正）**：CLI `src/tools/web.mjs`（fetch/websearch 同域——§1 注册表）网络错误分支——追加 proxy 提示行（英文逐字）："network failure — retry with proxy: 'http://host:port' if the target is blocked"——不自动路由（遵守 2026-08-31 裁定）——零逻辑改；
- **D-TF4（测试）**：T-TF 系——描述句断言（prompts.test.mjs——§18.14 拆分后）+ edit 失败文本含 grep 建议断言 + fetch 失败含 proxy 提示断言（tools 域测试文件——拆分后）。

**受影响文件（两端）**：CLI `src/prompts/system.md`（A 句——与 §20.9 Module Split 段同域：**同批排队**）+ 工具描述（A——`src/tools/insert_after.md`/`hashline_edit.md`/`edit.md`——文件名按实际——评审 #1）+ `src/tools/file.mjs`（B——old_string 分支）+ `src/tools/web.mjs`（D——fetch/websearch 同域）；**VS Code 镜像**：`src/prompts/system.md`（A——同句）+ `src/tools/file.mjs`（edit/hashline 描述 A + edit 错误分支 B）**+ `src/tools/more-file.mjs`（insert_after 描述 A——id:29 交付补——advisor 🔵#3——工具实际定义处）** + `src/tools/web.mjs`（fetch D——两端独立实现——同语义）+ 测试（prompts.test.mjs——§18.14 拆分后 + tools 域文件——**评审 #3：拆分前落现有 prompts.test.mjs——拆分后随迁**）；AGENT-LOOP.md（本节？——不——TOOLS.md 本节）；CHANGELOG（父侧）。

**测试（T-TF）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-TF1 | N | 读 tools/edit/insert_after/hashline_edit 描述 | 含逐字锚 "use the most recent read of the file as the source of old_string / line numbers / hashes — re-read after the file changed"（fail-when-unchanged——评审 #1 修正——以 D-TF1 元） |
| T-TF2 | N | 读 system.md | 含行号敏感提示句（fail-when-unchanged） |
| T-TF3 | N | edit old_string not found 实际结果 | 含 grep 建议行 |
| T-TF4 | N | fetch 网络失败实际结果 | 含 proxy 提示行 |
| T-TF5 | E | 既有工具断言回归 | 全绿（零破坏——仅追加） |

**验收（AC-TF）**：AC-TF1 = T-TF1/2 绿；AC-TF2 = T-TF3/4 绿；AC-TF3 = T-TF5 绿（零破坏）；AC-TF4 = 双端同语义（A 句）。

### 14.1 失败反馈带下一跳：edit 单行相似行 + execute 超时引导（2026-09-05 · 用户「落设计」——来源：0 点后轨迹失败分析）

> 状态：**已实现（2026-09-05——双端交付：CLI id:1 clean + VS Code id:2 clean——父侧 L2 核销：CLI 1435/1435、VS Code 1138/1138 全绿——T14.1.1-6 双端绿——AC14.1.1-3 核销）——评审 round1 1🔴+2🟡+2🔵（用户「全部按照建议」——🔴 execute 超时上限文档内冲突——已核实代码 `execute.mjs:167 Math.min(t, 600_000)`——600000 真——§0.1/§2 契约行 L13/18/39 同批修正 600s）——round2 复审 2026-09-05 0🔴 通过——批准（token 89cff711——4🔵 处置：T14.1.6 零候选行补/余随任务书）**。**实现批前提勘正（id:1/id:2 核对回填）：P14.1「F3 仅覆盖多行 old」前提不实——`findCandidates`（shared.mjs——LCS 连续子串/阈 0.5/top3）对任意 not-found 无条件调用——单行相似行 HEAD 已覆盖（CLI computeEditEntry + VS Code file.mjs 单形态——自 2026-08-26）——问题实况 = 零候选（阈排除）而非路径缺失 + VS Code 批量 edits-array not-found 原缺候选段（🟡#1——已补 `similarLinesBlock` 单一渲染权威——CLI 批量经 computeEditEntry 自动继承）——实测格式（块式 `similar lines:` + `L&lt;n&gt;: preview (NN%)`）与设计示例内联式不同——按「以实测为准」保留 F3 既有格式——T14.1 系转为锁定既有行为 + 补缺口测试。来源：2026-09-05 00:57-01:00 轨迹分析（12,828 调用窗口——edit 单行 not-found 35 次 + execute 超时 40 次——§14「失败反馈带下一跳」哲学补全）。

**问题（P14.1）**：两个失败形态缺"下一跳"：
1. edit 单行 old not-found——错误只有 `searched:` + grep 引导——模型需 grep→read 定位实际行再构造 old（两步）——F3（§14 已落地——"failed edit lists similar lines (line number + preview + score)——capped at top 3"）仅覆盖多行 old 失败场景；
2. execute 超时——错误只有 "script timed out after 30000ms"——无重试方向——子代理验证期跑全量测试普遍 >30s（默认偏短且模型不知 timeoutMs 可调至 600000 / 可换 bash）。

**需求（F14.1）**：作为 agent，我希望编辑失败与超时失败直接给可用的下一跳，不再凭记忆猜或猜超时参数：
- **F-14.1a**：edit 单行 old not-found → 错误附文件内与 old 最相近 ≤3 行（行号 + 内容截断 + 相似度——F3 同款评分与格式——扩到单行 old 场景）；
- **F-14.1b**：execute 超时错误 → 附重试引导（larger timeoutMs 上限 600000 / 换 bash 默认 120s）；
- 边界：F3 多行逻辑零改动（单行路径复用同一候选评分函数——不重复实现）；相似行仅在 not-found 错误后追加（成功路径/其他错误文本零改动——N-14.1 零破坏）。

**非功能（N-14.1）**：
- N-14.1a 错误文本前缀稳定：既有 `file:` 行与 `searched:` 行逐字不动（追加段在其后——断言不破）；
- N-14.1b 成本：相似评分仅发生在 not-found 分支（失败路径——非热路径）；
- N-14.1c 双端同语义（§18.11——设计锚为准——各自照抄）。

**设计（D14.1）**：
- **D14.1.1（edit 单行相似行——CLI not-found 分支 / VS Code 镜像）**：单行 old not-found 时——复用 F3 既有候选评分函数（findCandidates 类——**F3 权威点（评审 #2）：not-found 错误构造处/评分函数所在文件——§15 后 edit 执行体/错误构造已迁 edit-diff.mjs（computeEditEntry——本地单形态/edit-batch/ACP 桥三通道共享单一权威——若相似行段在 computeEditEntry 内按 `oldLines.length` 分支追加——批量/桥自动继承且多行逐字不变——落点以实现批核实为准——**若函数不存在或实测格式与示例不符 → 以实测格式为准并如实上报**）——eng-coder 实现时核对：F3 多行路径用的评分是否已对单行 old 调用——**若未覆盖**：扩调用条件 `oldLines.length === 1` 也附 top3；**若已覆盖**：仅补测试锁定——差异如实报告；**零候选行为（评审 #4）：继承 F3 多行路径（无候选则整段省略）——实现批核对确认——若 F3 无此语义则补零候选用例锁定**）——错误追加段（格式逐字——行号 + 截断内容 + 分——**实现批首步实录 F3 多行输出字节作参照后定稿单行段**）：
  > similar lines (top 3, score): L12 "…内容截断…" (0.81) — L40 "…" (0.75) — L3 "…" (0.60)
- **D14.1.2（execute 超时引导——CLI execute.mjs 超时分支 / VS Code 镜像）**：超时错误文本追加（逐字）：
  > script timed out after 30000ms — retry with a larger timeoutMs (up to 600000) for long scripts, or use bash (default 120s) for shell commands
  超时机制零改动（仅消息拼接——实际时长变量化——**上限已核实（评审 #1 闭合）：execute.mjs:167 `Math.min(t, 600_000)`——600000 为真——锚句数字与代码一致——§0.1/§2 契约行（L13/18/39）已同批修正为 600s**）；成功路径零改动。
- **受影响文件（双端）（评审 #3 补——全清单）**：
  - CLI：edit not-found 错误构造处（实现批核实：computeEditEntry（edit-diff.mjs）或壳——**单一权威点——若在 computeEditEntry 内按 `oldLines.length` 分支——批量/ACP 桥自动继承且多行逐字不变**）+ execute.mjs（超时错误消息 + 头注 L25 旧「max 60s」同步 600000——实现批改）+ execute.md（若含超时上限句——实现批核对）+ test/file-tools.test.mjs（T14.1.1-3）+ test/execute.test.mjs（T14.1.4-5）+ CHANGELOG（父侧）；
  - VS Code：镜像对应（edit-diff.mjs/file.mjs/execute 对应实现与描述/测试——实现批以实际为准——落点与 CLI 同构）；
  - TOOLS.md §0.1/§2 契约行（L13/18/39）——父侧已同批修正（本批 doc-sync——D-E4「文档编辑与代码同批落」先例）。
- **D14.1.3（测试——T14.1 系）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T14.1.1 | N | edit 单行 old not-found（文件含近似行） | 错误含 `searched:` 前缀（不动）+ `similar lines (top 3, score): L` 段——行号/截断/分 |
| T14.1.2 | E | 多行 old 失败（F3 既有用例） | F3 输出逐字不变（回归——单行扩不破坏多行） |
| T14.1.3 | E | 既有 not-found 前缀断言（T-TF3 grep 建议行） | 全绿（searched + grep 行保留——追加段在后） |
| T14.1.4 | N | execute 慢脚本超时（mock 短 timeoutMs） | 错误含重试引导句（larger timeoutMs / bash） |
| T14.1.5 | E | execute 成功/其他错误路径回归 | 零改动（成功输出不含引导句） |
| T14.1.6 | E | 单行 old not-found 且文件无近似行（零候选——评审 round2 🔵#2 补） | 无 `similar lines` 段——`searched:` 前缀与 grep 引导行保留（零候选省略——与 F3 语义一致） |
（落点：CLI test/file-tools.test.mjs（edit 域——T-TF3 同文件）+ test/execute.test.mjs；VS Code 镜像同构——实现批以实际为准。）

**验收（AC14.1）**：AC14.1.1 = T14.1 系双端绿；AC14.1.2 = 既有失败文本前缀断言全绿（零破坏——T-TF3/T-TF5 回归）；**AC14.1.3（评审 #5 补）** = 父侧 L2 test:full 核销（双端）+ §0.1/§2 契约行与引导数字一致断言（600s——fail-when-unchanged——实现批核对 execute.mjs 头注/execute.md 上限句同步后绿）。

**关键决策**：
- **复用 F3 评分而非新造**：相似行机制 §14 已实现（多行场景）——单行只是扩调用条件——单一实现（不重复评分逻辑——与 §15 系"单一权威"同哲学）；
- **execute 只改消息不改机制**：超时本身语义正确（30s 默认 + 可调参数已存在——上限 600000 已核实）——缺的是失败时的方向引导（模型不知道可调）——错误文本是"下一跳"的最小载体；
- **契约行同步（评审 #1 处置）**：§0.1/§2 三处「上限 60s」记录经核实为过时（代码 `execute.mjs:167` = 600000）——本批同批修正为 600s（D-E4「文档编辑与代码同批落」先例）——execute.mjs 头注 L25 与 execute.md（若含上限句）由实现批同步——AC14.1.3 锁定。


### 14.2 edit 空白差异自动落点（P15.11——2026-09-05 用户裁定——「找符合模型直觉的方案」——来源：edit 连续失败分析 12 条记录中 8 条 = 前导/尾随空白差异）

> 状态：**已实现（2026-09-05——双端：CLI edit-tools 64/64（P15.11a-d 新增）+ VS Code edit-eol 53/53（镜像 4 例）——三通道（本地单/批量 + ACP 桥经 computeEditEntry 单一权威自动继承））**。

**问题（P15.11）**：edit not-found 失败中最大单一成因 = **模型从 read 记忆拷贝 old_string 时丢/加前导空格**（2026-09-05 实证：单轮 12 条 edit 失败 8 条空白差异——5 vs 4 空格、前缀空格、行首空格——工具报错 + similar lines 提示（95-99%）**仍重试同形**——「引导无效」第 4 次实证（§14.1/§15 D15.3#10/insert_after 漂移引导后）——模型拷贝时空白丢失是**机械损耗**（内容意图零歧义）——引导解决不了——形态支持。

**需求（F15.11）**：作为 agent，我希望 old_string 与文件**内容逐字相同、仅前导/尾随空白不同**时 edit 自动落点应用（不必手工修正空白重试）。

**设计（D15.11a——命名避撞已用 D15.11 于 §15.3a——本节内部编号以 P15.11 为准）**：
- **匹配语义**：old_string 逐字 occurrences=0 时——在 normalize(LF) 域按行扫描**唯一窗口**：窗口行数与 old 相同、逐行 trim() 相等（内容零差异）→ 以窗口原文为实际 old 继续既有判定序（分支 0/LCS/插入不变——**只救 not-found，不改变命中后语义**）——结果消息附 note：`applied to the unique whitespace-only match (content identical, leading/trailing whitespace differs from your old_string)`（双端同句）；
- **边界（不猜）**：多窗口（两处 trim 同内容不同空白）→ 歧义 → 仍 not-found 报错（不静默选一——§15.3 同哲学）；实质差异（≥1 字符不同——含丢逗号/换词）→ 仍 not-found + searched/similar lines 引导原样（不吞既有诊断）；old 含尾换行 → 不做窗口猜测；
- **实现层**：CLI `computeEditEntry`（edit-diff.mjs——单/批量/ACP 桥三通道单一权威——`findWhitespaceVariant` 前置 + note 返回）；VS Code file.mjs 单形态与批量各自 not-found 分支同构注入（无共享 computeEditEntry——两分支镜像）；
- **消息**：note 只附加于成功路径（`Edited <path>: replaced N occurrence(s) — <note>` / `Replaced N occurrence(s) in <path> — <note>` / ACP `OK: edited ... — <note>`）——失败路径文本零改动（既有断言零破坏）。

**测试（P15.11a-d——双端）**：
| # | 输入 | 预期 |
|---|---|---|
| P15.11a | 单行前导空格差异（唯一） | 自动落点 + note；内容替换正确 |
| P15.11b | 多行窗口差异（批量通道） | 自动落点 + note（公共行 LCS 语义不干扰） |
| P15.11c | 两窗口 trim 同内容（歧义） | 仍 not-found（不猜——文件零改动） |
| P15.11d | 实质差异 | 仍 not-found + similar lines（回归——不吞引导） |

**验收（AC15.17）**：P15.11a-d 双端绿 + 既有 edit 域断言全绿（not-found 文本/引导/similar lines 逐字零破坏——CLI edit-tools 64 全量 + VS Code edit-eol 53 全量实测）。

## 15. 工具描述与语义对齐——「符合机器直觉」批（2026-09-04 · 用户「设计符合惯性」——来源：edit 6 次误操作实况 + 39 处全量审计）

> 状态：**已实现（2026-09-04——双端交付：CLI id:5 clean + VS Code id:6 clean——父侧 L2 核销：CLI 1402/1402、VS Code 1114/1114 全绿——描述点矩阵 T15.16 实测 86 点）——评审 round1 1🔴+6🟡+6🔵 全处置——round2 复评通过（2026-09-04——0🔴——token e239214c）——复评 4🟡+4🔵 已随本修订处置**。

**问题（P15——实况）**：用户研究 6 次 edit 误操作（同一模式：`edit(old_string=既有行, new_string=新行)`——旧行被**静默覆盖**——第 3/5/6 次明知故犯——惯性压倒知识）。根因（用户结论 + 审计验证）：**edit 语义不符合模型 patch/diff 心智**——模型输入「上下文/结果」——工具执行「纯字面替换」——new 不含 old = 删除旧内容且零报错；**insert_after 描述用例窄化**（只 function/import/block——TODO 条目/文本行映射不到→退回 edit）；全量审计 39 处描述（**注（复评 #5——2026-09-04）：39 处为审计抽样集合——与 D15.4 的 86 点全量走查口径不同（86 点含双端全部描述点）——实现批走查以 86 点为准**）——同类冲突集中 **edit 族**（edit/hashline_edit）——另有 **8 项描述/实现不一致**（timer 三处矛盾 30/180/required 为真不一致）。

**需求（F15——用户故事）**：
- **F15.1**：As a **coding agent**, I want **edit 按 patch/diff 心智工作**（old=变化区当前内容、new=该区的期望结果——公共行保留、差异行增删）, so that **修改不再依赖逐字构造 old 串——「新增写成替换」误用与 not-found 重试大幅减少**。
- **F15.2**：As a **coding agent**, I want **old 与 new 零重叠（old 每行都不出现在 new 中）时自动按插入处理**（new 插在 old 末行后）, so that **「新增行»意图永不覆写既有行——数据零丢失**。**——修订指针（§15.2——2026-09-04）：单行×单行唯一匹配形态不落本规则——由 §15.2 分支 0 接管 = 就地替换（见 §15.2）**。
- **F15.3**：As a **coding agent**, I want **insert_after/hashline_edit/edit 描述说清 old/new 关系与适用场景（含清单条目/文本行/文档行）**, so that **新增操作直接选对工具**。
- **F15.4**：As a **coding agent**, I want **write/timer/verify/read/task/lsp/checklist 描述与实现一致、参数语义无歧义**, so that **按描述用不踩坑**。
- **F15.5**：As a **maintainer**, I want **工具描述写作规范（六要素）成文、现有全部工具描述按条款达标**, so that **同类冲突未来零复发**。
- **范围边界**：不做字符级/语义级 diff（仅行级）；**apply_patch 仅 hunk 头宽容**（裸 `@@` 无坐标——D15.6——hunk 体内 diff 语义不变——审计"不改 apply_patch"误判已由 D15.5 修正）；不重排工具注册表/顺序；不引入工具描述自动生成。

**非功能性（NF15）**：
- **语义变更声明（用户 2026-09-04 裁定——「都不用考虑跟旧的兼容，以后都是用新的方式调用」）**：本批 edit/verify 行为**有意变更（breaking）**——edit 零重叠由「旧行为=字面替换」改为「新行为=插入」（数据安全侧）；verify `filter` 参数改名为 `testNamePattern`（旧名不再接受）。**既有测试按新语义迁移**（迁移表——见 T15.15——实现批逐条列出新旧预期对照）——不承诺旧行为兼容；
- 双端行为一致：edit/插入规则/timer/verify/read/task 两端同语义（VS Code task 补别名规范化镜像 CLI）；
- 描述契约：补强后描述与实现一致（描述断言 fail-when-unchanged——逐字锚）。

**设计（D15）**：

**D15.1 edit 语义升级 C（两端——CLI + VS Code）**：
- **语义定义**：`old_string` = 变化区**当前内容**（必须精确存在且单次匹配——不变）；`new_string` = 该区的**期望结果**。工具对 old/new 做**行级 diff**（LCS 最长公共子序列——整行相等判定）——公共行保留、old 独有行删除、new 独有行插入——应用结果替换匹配区。
- **判定序（按优先级——逐一对 old/new 判定）**：
  1. **零重叠规则（F15.2）**：old 的**每一行**都不出现在 new 的行集中 → **按插入**处理——new 整体插入在 old 最后一行之后（旧内容保留）**——修订指针（§15.2——2026-09-04）：单行×单行唯一匹配不落本判定——分支 0 先行接管 = 就地替换**）；
  2. **一般 diff**：old 与 new 有公共行（≥1）→ LCS 推导——公共行保留、差异行增删；
  3. **平凡特例**：new 与 old 行级完全一致 → 原样替换（no-op 语义——仍报成功）。
- **空 new_string（纯删除意图）——显式错误（不静默）**：new 为空 → 报错 `empty new_string — for deletion, keep the context lines you want to preserve in both old_string and new_string`（删除必须带保留上下文行——与改词同模式——判定 1 对空 new 的真空成立不生效——T15.3a）。
- **语义说明（关键点——评审必读）**：
  - **单行修改的模型心智**：改一行时**必须带公共上下文**（old=改行±相邻行、new=改后对应行）→ 走判定 2——**「只给旧行+新行（零重叠）」= 判定 1 = 插入**——**数据不丢**（插入可撤——替换不可逆——安全侧设计）；
  - **replace_all**：每处 old 段→new 段**字面替换**（不做插入规则——old 多处时"插到哪处"无定义）——**描述注明（并入逐字锚）**；
  - **edits 数组批量**：每条目独立按判定序（同文件条目串行——沿用现行语义）；批量原子性不变；
  - **判定/应用全在新模块**——`src/tools/edit-diff.mjs`（CLI 新建）+ VS Code 同名新建——函数 `applyPatchLines(oldText, newText) → { ok, resultText | reason }`（LCS——old/new 行数各上限 1000——超限返回错误「edit region too large — narrow the change」）——**导出面（2026-09-04 实现批定稿——§15.1 上层引用）：核心 `applyPatchLines`；条目入口 `computeEditEntry(content, args, opts)`（匹配校验→判定序→应用——抛错含路径/引导——opts `{ path, absPath, abortPrefix, rich }`——abortPrefix=批量错误前缀（rich:false 批量态）；`validateEditEntry`（空 old / 非字符串 new）；`assertEditArgsExclusive`（edits 与顶层 old/new 互斥——顶层 path 放行——2026-09-05 用户裁定——见 D15.3#9 修订注）**——**CLI `file.mjs` 的 edit 执行体（单形态 + 前置校验分支）整段迁出至 edit-diff.mjs——file.mjs 只留工具壳与转发**（不"仅改调用"——执行体也在模块内——模块拆分写优先纪律：先迁后删、逻辑体不变、wiring 导入——**同步把 D15.3#9（edits 互斥错误文本）随前置校验分支迁出**）；VS Code `file.mjs` 448 行——edit 单形态/批量调用 edit-diff + 描述重写（+~25 行）≈ 473——安全（VS Code 无独立 edit-batch——迁 edit-diff 后两形态共用）；
  - **行数风险（评审 #3 修正——重记账）**：CLI `file.mjs` 495 行——执行体迁出（-~68 行）+ 工具壳/转发（+~8 行）+ D15.3#3 read 别名（+2 行）→ 终态 ≈ 437——**安全**（原"≤5 行增量"未计 #3/#9/#10——已修正；若仍 >500——报停走模块拆分——预判条款不静默触限）；VS Code `file.mjs` 448 + 描述重写/调用 ≈ 473——安全；
  - **VS Code 双通道**：open doc（WorkspaceEdit）+ closed disk——diff 在计算层完成——两通道共用 `applyPatchLines`。
- **edit.md 描述重写（逐字锚——两端照抄——以 D15.1 语义为准）**：
  - 首句（CLI edit.md 首句替换 / VS Code file.mjs edit 工具描述段替换——**逐字**）：`Edit a file as a patch. old_string is the current content of the region to change (must match exactly once); new_string is the desired result of that region. Lines shared by both are kept; lines only in new_string take their position relative to the shared lines (LCS order) — when no line overlaps, new_string is inserted after old_string (old content stays). Whole-line replacement of one line without shared context is treated as insert — for a replacement, include a shared context line. replace_all keeps literal replacement of every occurrence — the insert rule does not apply.`；**（修订注——2026-09-04 §15.2 分支 0：句中「…when no line overlaps, new_string is inserted after old_string (old content stays)」与「Whole-line replacement of one line without shared context is treated as insert — for a replacement, include a shared context line」两句已由 §15.2 NF15.7c 新锚替换（单行×单行唯一匹配 = 就地替换——多行替换带共享上下文/新增用 insert_after）——实现批已落——历史锚文本保留原文）**；
  - 路由句（原 `One exact-string swap → this tool` 更新）：`Add a line/entry after a known line → insert_after — includes checklist items and doc lines.`;

**D15.2 描述补强（逐字锚——两端照抄——每个锚句作为 fail-when-unchanged 断言目标）**：
- insert_after 用例句（CLI insert_after.md 工具描述用例句替换 / VS Code more-file.mjs insert_after 工具描述段同句替换——**逐字**）：`Use this instead of edit when you're adding a new line — a checklist item, a doc heading, a line of prose, a function, an import, or a block — no need to fabricate surrounding context for exact matching.`；
- hashline_edit（CLI hashline_edit.md 追加两句 / VS Code file.mjs hashline 工具描述段——**逐字**）：`Replacement text replaces the lines identified by the hashes — content not present in new_content is deleted. For a new line after a known line, use insert_after. For a single simple string swap, use edit.`；
- write（CLI write.md 追加一句 / VS Code file.mjs write 工具描述段——**逐字**）：`write replaces the WHOLE file — read it first and confirm you intend to rewrite it entirely; for a small change use edit / insert_after.`；

**D15.3 顺手批（8 项——各表两端落点）**：

| # | 项 | 改动 | CLI 落点 | VS Code 落点 | 风险 |
|---|---|---|---|---|---|
| 1 | timer 三处对齐 | **以实现为准（180s——行为不变）**：描述 default 180 + schema `required` 松绑（seconds 可选——缺省 180） | agent-tools/timer.mjs（timer 工具描述段+schema） | agent-tools/timer.mjs（timer 工具描述段+schema） | 无（描述修正——行为已 180） |
| 2 | verify filter 改名 | `filter` → `testNamePattern`——**旧名不再接受（breaking——用户裁定「都不用考虑跟旧的兼容」）**——描述注「renamed from filter」 | agent-tools/verify.mjs（verify 工具描述段+参数名） | agent-tools/verify.mjs（verify 工具描述段+参数名） | breaking（用户接受的语义变更——NF15 声明） |
| 3 | read filePath 伪 alias | CLI 实现补 `filePath` 别名（`args.path ?? args.filePath`——2 行）——VS Code 已有——两端一致；CLI read.md 的 "alias: filePath" 声明确认与实现一致（**实现待补**） | tools/file.mjs read 工具执行 + read.md | 无（已有） | 无 |
| 4 | task 状态别名 | **CLI 保留（实现已接受别名+warning）**——描述改「accepts aliases (completed/finished/…) — normalized with a warning」——**VS Code 补 normalizeStatus 镜像 CLI**（两端行为一致） | agent-tools/task.mjs（task 工具描述段） | agent-tools/task.mjs（task 工具描述段 + 补 normalize（CLI STATUS_ALIASES 镜像）） | 低（VS Code 行为扩展——容错） |
| 5 | task↔checklist 双向路由 | task.mjs 描述补：`For cross-session / project-level tracking, use checklist`——checklist 已有出口（保留） | agent-tools/task.mjs（task 工具描述段）+ tools/checklist.mjs | agent-tools/task.mjs（task 工具描述段）+ tools/checklist.mjs | 无 |
| 6 | lsp 路由句 | 补：`Find files with glob / repo_outline — use lsp for definition / references / diagnostics` | tools/lsp.mjs（lsp 工具描述段） | tools/lsp.mjs（lsp 工具描述段） | 无 |
| 7 | hashline 反向路由 | 已含 D15.2 | — | — | — |
| 8 | write 补强 | 已含 D15.2 | — | — | — |
| 9 | edits 互斥错误文本——**2026-09-05 修订：顶层 path 并存合法化**（见行下 D15.3#9 修订注——取代「仅补引导」方案） | `edits array is mutually exclusive` 错误补引导：`use either the edits array or the single-form args, not both — split into two calls`（trace：1,295 次——模型混用） | tools/file.mjs edit 前置校验错误分支（随执行体迁 edit-diff.mjs） | tools/file.mjs（批量/单形态校验点——随执行体迁 edit-diff.mjs） | 无 |
| 10 | hashline 错误引导 | `Hash sequence not found` 补：`for fresh hashes, re-read the file with hashes=true`（trace：830+ 次——hash 过期——模型重试不重读） | tools/file.mjs hashline 工具错误分支 | tools/file.mjs hashline 工具错误分支 | 无 |

**D15.3#9 修订注（2026-09-05 用户裁定——顶层 path + edits 并存合法化——取代「错误文本补引导」方案）**：模型直觉形态「顶层 path + edits 数组」从「互斥拒绝」改为**合法**——顶层 path = 无自带 path 条目的**默认路径**（条目自带 path 优先——覆盖顶层）；`edits` 与**顶层 old_string/new_string** 仍互斥（错误文本收窄为只提 old/new——逐字锚两端照抄：`edits array is mutually exclusive with top-level old_string/new_string — a top-level path is allowed (default for entries without their own path); provide each change's old_string/new_string inside its edits entry`）；条目与顶层皆无 path → `each edit must have a path — give each entry its own path or pass a top-level path`。
- **落点**：CLI `edit-diff.mjs`（EDIT_ARGS_MUTEX 文本 + assertEditArgsExclusive 只查 old/new）、`edit-batch.mjs`（条目 path 解析 `e.path || args.path`）、`file.mjs`（schema items.required 去 path + path/edits 描述 + touchedPaths 计顶层——仅当有条目缺 path）、`edit.md`（参数描述）；ACP `bridge.mjs` editBatch（`e.path ?? pathOf(args)`——第三通道 parity）；VS Code `file.mjs`（同语义——互斥检查只查 old/new、条目回退 `e.path || args.path || args.filePath`、描述/schema/touchedPaths 同步）；
- **测试**：CLI `edit-tools.test.mjs`（顶层默认 / 条目优先 / 互斥收窄 + 缺 path 错误三新用例）、`acp.test.mjs`（T15.27 断言语义更新 + T15.27b 桥默认顶层正例）；VS Code `edit-eol.test.mjs`（四新用例）、`edit-semantics.test.mjs`（D15.3#9 锚更新为新句）、`file-tools.test.mjs`（touchedPaths 计顶层/不虚报/filePath 别名三断言）；
- **AC**：三通道（本地磁盘 / VS Code 原生 / ACP 桥）`{ path, edits: [无自带 path 条目] }` 成功且同文件串行累积；`{ path, old_string, new_string, edits }` 仍互斥报错；`{ edits: [条目无 path] }`（无顶层）→ 路径错误新文本。

**D15.4 六要素规范条款（TOOLS.md 本节落条款——所有工具描述（现有 + 未来）按此走查——86 个描述点走查在实现批完成并上报差异表——本节结论由实现批回填）**：
- 六要素（工具描述必含——缺一补一）：**①一句话语义**（能做什么/不能做什么）；**②参数关系**（参数间约束——如 new 与 old 的关系规则）；**③路由**（走我/换谁——双向出口句）；**④破坏性明示**（覆盖/删除/不可逆——+恢复路径）；**⑤阻塞性**（是否等待/多久——如 check vs status）；**⑥结果形态**（返回什么/字段怎么读/失败分支）。
- **走查范围（现有全部——86 个描述点——实现批全量脚本化走查并逐项上报差异表——脚本含一致性检查项：描述中引用的工具名 ∈ §1 注册表（复评 #4——repomap/code-sync/repo_outline 等名与 §1 核对））**：CLI 25 个 `src/tools/*.md` + 4 处内嵌（repomap.mjs 工具描述段 / memory 的 docs.mjs 工具描述段 ×2 / code-sync.mjs 工具描述段）+ 13 个 `src/agent-tools/*.mjs` 描述段（= CLI 42 点）；VS Code 17 个 `src/tools/*.mjs` 承载 28 点 + 2 处根内嵌（repomap.mjs 工具描述段 / memory-tool.mjs 工具描述段）+ 12 个 `src/agent-tools/*.mjs` 承载 14 点（consult 3 点）（= VS Code 44 点——**2026-09-04 实现批矩阵实测回填：原设计「22 文件 + 2 根 + 15 文件 = 39 点」为文件数与点数混计漂移——矩阵 POINTS 表逐文件列点——T15.16 实测 44**）——**共 86 点**——按条款逐项对照——每点上报：达标 / 缺哪要素（补一句）。
- **机制注**：CLI 描述 = `.md`（`DESC()` 加载——shared.mjs 描述加载函数）；VS Code 描述 = `.mjs` 内嵌（**无 .md 文件——已验证**）——**两端同一语义改动落点不同源**——设计锚逐字定稿在本节，两端照抄。

**D15.5 trace 核对（2026-09-04 用户指示「写完再核对」——实数据——来源：`C:\Users\liwei\.thincoder\traces\2026-09-04` 4504 个 trace——304,365 条 tool 消息——30,890 失败（10.2%）——只读聚合）**：
- **edit 族失败率（实测）**：edit 56,235 调用 / 8,214 失败（14.6%——not found 家族 5,190+——old_string matches 2 times 450——单参数/批量混用）；insert_after 11,753 / 3,027 失败（**25.8%**——行号漂移 guard 打回 1,056+：`after_line 在上次写入之后——行号已漂移`）；hashline_edit 16,453 / 3,294 失败（**20.0%**——Hash sequence not found 830+）；**apply_patch 203 / 203 失败（100%——见 D15.6）**；write 5,599 / 0（0%）；bash 90,725 / 9,449（10.4%——其中 4,144 = hasFileRedirection 护栏（**已随 §13 删除**——当日旧版本残留——不计入留存问题）；execute 21,001 / 5,149（24.5%——超时 280/Command failed 498——不属本批）；
- **核对结论**：①审计候选全部被 trace 证实（edit 族为主战场）；②**审计漏网 1 项 = apply_patch 无坐标 hunk（100% 失败——见 D15.6）**——审计判"apply_patch 无此问题"系**误判**（只看了描述没看 trace——教训：描述审计必须与 trace 交叉验证）；③edits 互斥误用 1,295 次（`edits array is mutually exclusive`——模型同批既传 path/old/new 又传 edits——描述已写明——模型仍犯——错误文本改进见 D15.3#9）——**已修订（2026-09-05 用户裁定：顶层 path 合法化为批默认——「仅补引导」方案作废——见 D15.3#9 修订注）**；④hashline 失败将 Hash 过期错误文本引导（#10）；⑤insert_after 高失败率=模型重试不重读（guard 已带漂移信息——错误文本已引导——**记录不扩**——深层治理（后向锚）另行立项）。
**D15.6 apply_patch 无坐标 hunk 宽容（trace 核对新增——2026-09-04）**：
- **P15.6（数据）**：apply_patch 203/203 全失败——169（83%）= `Malformed patch: bad hunk header "@@" (need @@ -old,count +new,count @@)`——模型提交的 hunk 头用**裸 `@@`**（省略行号坐标——LLM 自然行为：用上下文行定位而非计算坐标——unified diff 坐标对模型是负担）；34 = hunk context not found（旧内容不匹配——正常错误类）。
- **D15.6.1（语义）**：`@@` 头（无坐标——`@@` 或 `@@\n` 后直接跟 hunk 体）——**接受**——hunk 定位改由**上下文行匹配**推导（hunk 体的空格上下文行作为锚——在文件中唯一匹配则应用；多重匹配/零匹配报错——错误文本含已尝试的锚片段）。标准坐标格式（`@@ -old,count +new,count @@`）不变——两格式并存。**hunk 体内 `-`/`+` 行不变**（diff 心智本身一致——只放宽头）。
- **D15.6.2（边界）**：**每个无坐标 hunk**都必须含**至少 2 行上下文**才能唯一定位（1 行上下文易歧义——错误提示"add more context lines"——与 D15.6.3 描述锚口径一致）；无坐标 hunk 按**文件顺序串行应用**（与标准格式同序——先定位先应用——后 hunk 基于前 hunk 结果）；**——修订指针（§15.3——2026-09-04）：零上下文/1 上下文含 - 锚形态由 §15.3 放宽（锚序列=上下文行 + - 行连续——唯一匹配即应用——纯 + 无锚仍按本行 ≥2 规则）**；
- **D15.6.3（描述）**：apply_patch 描述补一句（逐字锚——两端照抄）：`Hunk header "@@" without coordinates is accepted — the hunk is located by its context lines; include at least 2 context lines for a unique match.`（CLI apply_patch.md / VS Code more-file.mjs apply_patch 工具描述段）；
- **D15.6.4（实现落点）**：CLI `src/tools/patch.mjs`（apply_patch 解析——hunk 头解析分支）；VS Code `src/tools/more-file.mjs`（apply_patch 工具实现——同）；
- **D15.6.5（用户裁定 2026-09-04「一起都做了，不要分批了」）**：**并入本批实现——不单列**——AC15.8 生效（T15.17-T15.19 绿）。

**受影响文件（双端——按组）**：

*CLI（thincoder/）*：
- 新增：`src/tools/edit-diff.mjs`（LCS diff + 判定 + 应用——全部新逻辑）；
- 修改实现：`src/tools/patch.mjs`（D15.6——apply_patch hunk 头宽容分支）；
- 修改实现：`src/tools/file.mjs`（edit 执行体迁出至 edit-diff.mjs——留工具壳+转发——+D15.3#3 read 别名 2 行——**硬限风控**）、`src/tools/edit-batch.mjs`（批量条目判定+应用调用 edit-diff）——`src/tools/patch.mjs`（D15.6——apply_patch hunk 头宽容分支）；
- 修改描述（.md）：`edit.md`（重写——D15.1 锚）、`insert_after.md`（D15.2 锚）、`hashline_edit.md`（D15.2 锚）、`write.md`（D15.2 锚）、`lsp.md`（D15.3#6）；
- 修改 agent-tools 描述/实现：`timer.mjs`（#1）、`verify.mjs`（#2）、`task.mjs`（#4 描述）、`checklist.mjs`?（#5 反向出口在 task——checklist 无改）——**#5 checklist 已达标——不动**；
- 六要素走查点（42 处——25 个 `src/tools/*.md` + 4 处内嵌（repomap.mjs / memory 的 docs.mjs ×2 / code-sync.mjs）+ 13 个 `src/agent-tools/*.mjs`）——**按 D15.4 条款逐项补缺**；
- 测试：`test/file-tools.test.mjs`（edit diff 断言——T15 系）、`test/edit-tools.test.mjs`?（现有域——落实际）、`test/prompts.test.mjs`（描述锚断言——§18.14 拆分后随迁）、`test/task.test.mjs`?（别名——落实际）、`test/tools.test.mjs`?（timer/verify/read/lsp——落实际）；
- 文档：TOOLS.md（本节——作者）、CHANGELOG（父侧）。

*VS Code（thincoder-vscode/）*：
- 新增：`src/tools/edit-diff.mjs`（镜像）；
- 修改：`src/tools/file.mjs`（edit 单形态/批量调用 edit-diff + 工具描述段重写 + hashline 工具描述段补句 + write 工具描述段补句——**448+~25≈473——安全**）、`src/tools/more-file.mjs`（insert_after 工具描述段替换锚句 **+ apply_patch D15.6 分支**）、`src/tools/lsp.mjs`（lsp 工具描述段补路由）、`src/agent-tools/timer.mjs`（#1）、`src/agent-tools/verify.mjs`（#2）、`src/agent-tools/task.mjs`（#4——补 normalizeStatus + 描述）；
- 六要素走查点（44 处——17 文件 28 点 + 2 根 + 12 文件 14 点）——按 D15.4 逐项补缺——实现批矩阵实测（T15.16——2026-09-04）；
- 测试：`test/vscode-tools.test.mjs` / `test/edit-tools.test.mjs`? / `test/prompts.test.mjs`?（落实际域——设计注「测试文件按实际拆分后域——§18.14 双端同批」）；
- 文档：CHANGELOG（父侧——VS Code 各自）。

**测试（T15——节选主矩阵——实现批补全）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T15.1 | N（F15.1） | edit(old=两行含公共行, new=公共行+新行) | 公共行保留——新行插入——旧行不丢 |
| T15.1a | N（复评 #2 补——前置型） | edit(old=[A,B], new=[X,A,B]——new-only 行在首个公共行前) | LCS 序——X 插在 A 前——[X,A,B] |
| T15.2 | N（F15.2） | edit(old=单行, new=全新行——零重叠) | **按插入**——old 行保留、new 行插其后 |
| T15.3 | N | edit(old=多行, new=多行无重叠) | 按插入——old 全保留、new 插后 |
| T15.3a | E | edit(old=单行, new=空——纯删除意图) | 报错「empty new_string — for deletion...」——不写
| T15.4 | N | edit(old=旧串, new=新串——单行带上下文改词) | diff 应用——改词成功 |
| T15.5 | N | edit(old=旧段, new=旧段+删一行) | 删除生效 |
| T15.6 | N | edits 批量（多文件） | 各条目独立判定——原子 |
| T15.7 | E | old 不匹配 / old 多处非 replace_all | 报错——不写——零改动 |
| T15.8 | E | old/new 行数超限（>1000） | 报错「region too large」 |
| T15.9 | E | replace_all + 多匹配 | 每处旧段→新段（字面——非插入） |
| T15.10 | N | 描述锚句（edit/insert_after/hashline/write——两端） | 含逐字锚（fail-when-unchanged——T15.10a CLI .md / T15.10b VS Code 内嵌） |
| T15.11 | N | timer 描述+schema | default 180——seconds 可选 |
| T15.12 | N | verify 参数 | testNamePattern——filter 拒绝（明确错误） |
| T15.13 | N | read 调 filePath | 成功读（CLI 别名生效） |
| T15.14 | N | task 状态别名（VS Code 补后） | 接受 completed——warning 归一 |
| T15.15 | E | 既有全量回归（含 edit/verify 既有用例） | 按新语义**迁移后的迁移表**逐条落实——全部绿（breaking——旧预期改新预期——迁移表随实现批上报） |
| T15.16 | N | 六要素走查（86 点——CLI 42 + VS Code 44——全量脚本化——实现批生成走查脚本——逐点输出达标/缺项） | 每点达标——缺项补句——差异表上报 |
| T15.17 | N（D15.6） | apply_patch 裸 `@@` 头 + 2 上下文行 | 接受——上下文唯一定位——应用成功 |
| T15.18 | E（D15.6） | 裸 `@@` 头 + 0/1 上下文行 | 报错「add more context lines」——不写（**§15.3 修订指针：含 - 锚形态已放宽——本行适用纯 + 无锚形态——实现批已迁移夹具——2026-09-04**） |
| T15.19 | E（D15.6） | 裸 `@@` 多头——锚多匹配 | 报错（含锚片段提示）——不写 |
| T15.20 | N（复评 #7 补） | 两个无坐标 hunk 串行（第二个命中第一个应用后的内容） | 按文件顺序先应用第一个——第二个基于结果定位——成功 |

**验收（AC15）**：AC15.1 = T15.1-T15.9 绿（edit 新语义——含插入规则/前置型 T15.1a/空 new 错误）；AC15.2 = T15.10 绿（描述锚——双端逐字）；AC15.3 = T15.11-T15.14 绿（顺手批）；AC15.4 = T15.15 绿（**语义迁移表——既有用例按新语义迁移后全绿**——非零破坏）；AC15.5 = 六要素走查完成（86 点全量脚本化——端内矩阵实测：CLI 42 / VS Code 44）——差异表上报（缺项逐点补句）；AC15.6 = 双端语义一致（edit/timer/verify/read/task——行为对齐）；AC15.7 = 父侧 L2 test:full 核销（双端）；AC15.8 = T15.17-T15.20 绿（apply_patch 无坐标 hunk——并入本批——用户裁定）。

**注（评审 #4 补——空 new 用例）**：T15 矩阵补 **T15.3a**（E）= `edit(old=单行, new=空)` → 报错「empty new_string — for deletion, keep the context lines you want to preserve in both old_string and new_string」——不写（表行插入测试矩阵 T15.3 之后）。

**注（评审 #13 补——F15.4 checklist 达标锚）**：六要素走查预检结论——checklist 工具描述**已含**出口句（in-session 拆分用 task 替代——跨会话/项目级用 checklist）——③路由要素达标——走查表该点备注「已达标——仅核对」。

**交叉引用（评审 out-of-scope——2026-09-04——EOL 权威归属）**：edit/apply_patch/hashline 的**行尾语义权威 = `EDIT-TOOL-EOL-DESIGN.md`**（detectFileEol / joinWithEol / majorityEol / findCandidates / U+FFFD——已实现）。§15 行级 diff 与其互操作：diff/判定在 normalizeEOL 后的 LF 域计算（与既有行为一致）；写回按 EOL 权威的 `joinWithEol(原文)` 恢复原行尾——**§15 不重复 EOL 细节（单一权威源）**——实现批在 edit-diff.mjs 写回路径调用共享 helper（CLI `src/tools/shared.mjs` / VS Code 各自）。


### 15.1 ACP 通道编辑语义对齐（2026-09-04 · 方案 1——用户拍板——bridge 行为债）

> 状态：**已评审（2026-09-04——用户发起——0🔴 通过——token f7cc43aa——3🟡+2🔵 用户拍全处置——本修订落实：①§15 导出面补记 ②FIFO 拒绝消费规则 ③T15.32 零重叠行 ④标题/依赖注）——已实现（2026-09-04 22:04——id:7——clean——L2 1416/1416 全绿——acp.test.mjs 64/64——AC15.9/10/11 核销——三处实现差异用户拍已裁——见 D15.7 注/D15.8 修订/关键决策）**。来源：§15 实现批（id:5）eng-coder 报告第 6 节——三个**预存在**行为债（非 §15 引入——修复轮披露未越界——父侧上抛——用户拍「方案 1：完整对齐」）。依赖：§15 批（edit-diff.mjs 导出面）已于 id:5 落地——本批直接引用——无前置等待。

**问题（P15.7）**——`src/acp/bridge.mjs` toolRouter 的 edit 通道与本地 edit 语义三处不一致（ACP = 独立于「双端/双通道」的**第三通道**——§15 批未覆盖）：

1. **数组形态回退本地磁盘**：路由条件仅认单形态（`args.old_string + new_string`）——`edits` 数组 → `handled: false` → 本地 edit 直写磁盘——**绕过 IDE 缓冲**（IDE 内存文档未变；用户未保存修改保存时可能覆盖磁盘编辑——丢失风险；模型 `fs/read_text_file` 读回的仍是旧缓冲——「改了没生效」）；
2. **单形态判定降级**：桥内 `indexOf` 单替换——① 多匹配（occurrences>1 且无 replace_all）本地报错、桥**静默替换首个**；② `replace_all: true` 也仅替换首个（全部替换语义降级）；
3. **工具 id 按名覆盖**：`toolIds` Map 以工具名为键——并行同名工具（dispatch B1 已支持并行只读）后写覆盖先写——`tool_call_update` 与 `tool_call` id 错配（ACP 要求 id 唯一；thincoder 模型级 id 跨 turn 不保证唯一）。

**需求 F15.6**：As a coding agent using the IDE through ACP, I want edit 单形态/数组形态/replace_all 与本地 edit-diff 同语义（同样的匹配校验、判定序、错误文本、原子性），so that 三通道（本地磁盘 / VS Code 原生 / ACP 桥）行为一致——**IDE 缓冲永远是权威**（模型看到的 = IDE 显示的）。

**非功能性（NF15.6）**：
- NF15.6a 原子性：数组（单文件/跨文件）**全判后写**——任一条目失败 → 零写（错误带 abort 前缀——同本地 edit-batch）；
- NF15.6b 错误文本一致性：not found / occurrences / 空 old / 空 new——与本地**逐字相同**（模型按同一措辞处理）——**范围注（2026-09-04 用户裁定——通道差异已接受）**：逐字相同仅对**四类命名消息 + 非 dirty 分支**成立——桥错误结果无 dispatch 层 `[path=…]` 尾缀（dispatch 通道内包装——桥端补即复制格式——不实现——与 D15.7 absPath 省略同列）；
- NF15.6c EOL：写回按原文行尾恢复（既有 F1 保持——LF 域判定 / 写回恢复）；
- NF15.6d id 配对保序：并行工具 call/update 一一对应。

**设计**：

- **D15.7（桥编辑通道完整委派本地判定）**——bridge.mjs edit 分支重写：
  - 形态识别（与本地工具壳同）：单形态（`path + old_string + new_string`）/ 数组（`Array.isArray(args.edits)`）；互斥校验复用 `assertEditArgsExclusive`；
  - **判定/应用一律委派 `computeEditEntry`（edit-diff.mjs 导出）**——桥**不重复实现**判定逻辑（单一权威——本次双实现漂移即教训）：
    - 单形态：读该 path 的 IDE 缓冲（`fs/read_text_file`）→ normalizeEOL → `computeEditEntry(content, args, { path })`（rich 形态——无 abortPrefix——**absPath 不传（2026-09-04 用户裁定——通道差异已接受）**：桥无 cwd/磁盘写史感知——传 absPath 会做误导性 dirty 提示——IDE 缓冲为权威）→ `joinWithEol` 恢复行尾 → `fs/write_text_file` 写回——多匹配报错 / replace_all 全部替换 / 空 old / 空 new 错误文本**自动与本地字面一致**（computeEditEntry 抛错即转错误结果——四类命名消息+dirty 分支范围见 NF15.6b）——**零重叠例外注（2026-09-04 §15.2 分支 0 接管）**：单行×单行唯一匹配形态 = **替换**（非插入——T15.32 单行案例随 §15.2 迁移为多行语境——见 §15.2 迁移注）；
    - 数组：先读**全部涉及文件**的 IDE 缓冲（同文件去重——一次读）→ 逐条 `computeEditEntry`（`opts.abortPrefix = "edit aborted (atomic — no files written): "`、rich:false——同本地 edit-batch；同文件条目按数组序**串行累积**——第二条基于第一条结果）→ 全部通过 → 逐文件写回（判失败 → 零写；写失败 → 按本地 edit-batch 既有原子语义）；
    - replace_all：单形态带 `replace_all: true` 走 computeEditEntry 的 replace_all 分支（字面替换全部出现——**修复「首个」降级**；LCS 插入规则不适用——与本地一致）；
  - 路由条件更新：`base === "edit" && (单形态且有 path || Array.isArray(edits))`——数组条目 path 各自读取；
- **D15.8（工具 id FIFO 配对）**——`toolIds` Map → **FIFO 队列**：
  - `onToolCall`：push `{ name, id }`（id 仍 `t${++toolSeq}` 唯一递增不变）；
  - `onToolResult`：按 **name 匹配的最早未消费项**出队——**拒绝/中断路径（2026-09-04 用户裁定——拍法 A——替代「同步消费」）**：实现披露——dispatch 拒绝发生在 onToolCall **之前**（被拒工具从未入队——无条目可消费）；中断/异常按 T-F5 契约**不回调** onToolResult（桥收不到信号）——故采用桥内「**同名同 toolId 先弹出**」隔离：onToolCall push 前弹出同名同 toolId 陈旧条目（模型级 id 每轮从 `call_0` 重置——孤儿+重复 id 场景精确匹配不命中最旧孤儿）——达成同目标「下个同名结果永不配到旧项」——回归用例证明——原「同步消费/跳过 refused 标记」措辞作废——孤儿**不滞留队列**；
  - `onPermissionRequest`：peek 同名最早项 id（不消费——result 仍要用）；
  - 保序依据：dispatch B1 已测——并行工具结果回调顺序 = call 顺序（T-TS8/T-TS9）。

**受影响文件**（仅 CLI 仓——桥在 CLI 仓；VS Code 端不受影响——与 id:6 交付批不重叠）：
- 修改：`thincoder/src/acp/bridge.mjs`（edit 分支重写 + `toolIds`→FIFO）
- 修改：`thincoder/test/acp.test.mjs`（M2 describe 扩展——新用例）

**测试（T15.21-T15.32——N 正常 / E 错误）**：

| # | 类别 | 输入 | 预期 |
|---|---|---|---|
| T15.21 | N | 数组单文件两条——经桥 | IDE 缓冲终态 = 本地语义结果（两处生效）——写回均经 fs/write_text_file |
| T15.22 | E | 数组某条 not found | 原子——零写——错误含 abort 前缀 |
| T15.23 | N | replace_all 单形态 2 处 | 全部替换（非首个） |
| T15.24 | E | 单形态多匹配（无 replace_all） | 报错——文本同本地（matches N times——非静默首替换） |
| T15.25 | N | 单形态多匹配 + replace_all | 全部字面替换 |
| T15.26 | N | 并行两个同名工具 | 两 tool_call id 独立——update 各配各（无覆盖错配） |
| T15.27 | E | 数组空 / 条目缺 path | 报错——同本地措辞 |
| T15.28 | N | 数组跨文件两条 | 两文件经桥读写——成功 |
| T15.29 | N | 数组同文件多条（第二条依赖第一条结果） | 串行累积——第二条基于第一条应用后内容 |
| T15.30 | E | 单形态未匹配 | 错误含「searched:」——与本地一致 |
| T15.31 | N | 拒绝路径后 onToolResult | 队列不卡——后续工具 update 配对正确 |
| T15.32 | N | 单表单形态零重叠——old=[A,B] new=[X] 经桥 | IDE 缓冲 = A、B 保留 + X 插其后（与本地判定 1 同判——非替换——**§15.2 迁移注：单行形态已由分支 0 接管 = 替换——本行按迁移注改多行语境——2026-09-04**） |

**验收（AC15.9）**：AC15.9 = T15.21-T15.32 绿（桥数组 / replace_all / 多匹配 / FIFO——三处债修毕）；AC15.10 = 桥与本地错误文本一致性断言（not found / occurrences / 空 old / 空 new——同字符串）；AC15.11 = CLI 父侧 L2 test:full 全绿核销。

**关键决策**：
- **委派而非重实现**：`computeEditEntry` = 判定单一权威——桥复用（本地已定稿 2026-09-04）——消除双实现漂移（本批三债的根源）——桥内只留「读 IDE 缓冲 → 写回 IDE 缓冲」；
- **被否备选：方案 2**（数组/replace_all 桥接显式报错引导单形态）——用户拍方案 1——方案 2 留下「同一工具不同场景行为不同」的新裂口——§15「按惯性调用得正确结果」未闭合；
- **FIFO 而非 turn 前缀**：前缀需 agent 层配合（turn 号传递）——FIFO 桥内自洽——B1 保序已知成立；
- 核销：TODO「bridge 两🟡（toolIds 碰撞 / edits 回退本地磁盘）」在 AC15.9 后勾销——标注随本批。
- **通道差异·已接受（2026-09-04 用户裁定——「都按推荐走」）**：①D15.8「拒绝/中断同步消费」→ 桥内「同名同 toolId 先弹出」替代（理由见 D15.8——机制目标「下个同名结果永不配到旧项」已达成并有回归用例证明——选 A：修订文案接收替代机制——不授权改 dispatch.mjs/T-F5——更动大、影响 TUI 冻结语义）；②单形态不传 absPath（桥无磁盘写史——IDE 缓冲权威——传了误导 dirty 提示）；③桥错误结果无 dispatch 层 `[path=…]` 尾缀（NF15.6b 逐字相同范围收窄至四类命名消息 + 非 dirty 分支）。

### 15.2 edit 单行替换判定修正（2026-09-04 · 用户裁 B——消除「单行换单行」的插入坑）

> 状态：**已实现（2026-09-04——双端交付：CLI id:1 clean + VS Code id:2 clean——父侧 L2 核销：CLI 1427/1427、VS Code 1120/1120 全绿——T15.33-36 双端绿 + 迁移清单全落（T15.32 多行/T15.2 tool 级翻转/描述锚断言/出清单追认 2 项：edit-tools T15.6 迁移 + edit-batch 注释）——取代指针已落 §15 四处（2026-09-04 22:50）——**措辞勘正批已核销（id:5——锚②/参数行双端 byte-identical——2026-09-05）+ 接缝统一批已核销（id:7——VS Code 端 ` — `→`; `——双端描述首句 byte-identical——用户拍 1b——2026-09-05）——L2 终核 CLI 1430/VS Code 1129 全绿**）——评审 0🔴 通过（token a3200842——3🟡+3🔵 用户拍处置）**。来源：2026-09-04 三次实证踩坑（AGENT-LOOP §18.13 状态行 / TODO §18.13 条目 / AGENT-LOOP §21 状态行——edit 改行尾段→新行被插入而非替换——均靠 hashline_edit 收尾）——用户问「工具优化不是落地了吗」→ 澄清：edit「单行换单行=插入」是既有保守设计（edit.md 描述明示——防误删）——用户拍 B：工具级改进。

**问题（P15.8）**：edit 零重叠语义下「old_string 恰单行、new_string 恰单行、old≠new」必然零重叠 → 判**插入**（old 保留 + new 追加）——整行替换须共享上下文或改用 hashline_edit——文档状态行/条目行编辑（行尾段改——最高频形态）反复踩——三次实证均靠 hashline_edit 收尾。

**需求（F15.7）**：作为 agent，我希望 edit 在「old 单行 + new 单行 + old 全文唯一匹配」时**直接替换该行**（行数不变）——不再零重叠插入。
- 边界：仅单行×单行形态——任一侧多行 → 既有 LCS/零重叠插入语义不动（保守意图保留——不扩围）。

**非功能（NF15.7）**：
- NF15.7a 语义锁定项（各配回归用例）：多行 LCS 保留公共行 / 多匹配 occurrences 报错 / replace_all 字面替换 / 多行零重叠插入——**全部不动**；
- NF15.7b 双端同语义（§18.11 设计锚为准——CLI/VS Code edit-diff.mjs 各自照抄同一语义）；
- NF15.7c 描述同步（**评审 #1——逐字定稿**）：CLI `src/tools/edit.md` 首句锚中**旧两句**——①"when no line overlaps, new_string is inserted after old_string (old content stays)"②"Whole-line replacement of one line without shared context is treated as insert — for a replacement, include a shared context line"——**替换为（逐字——两端照抄——VS Code 对应 file.mjs 内嵌描述同改——改动仅两句——其余首句锚文本不动）**：
  > ①…— when no line overlaps, new_string is inserted after old_string (old content stays) — **except a unique single-line old_string paired with a single-line new_string: that exact line is replaced in place (line count unchanged)**；②**for a multi-line replacement, include a shared context line — for adding a new line use insert_after: a unique single-line old/new pair replaces the line in place; multi-line zero-overlap pairs still insert per the diff rules above**
  （fail-when-unchanged 锚句 = 上引号内两段英文——T15.10 系描述锚断言目标随本批迁移——**列入 AC15.13 迁移清单**；描述后段既有路由句 "Add a line/entry after a known line → insert_after" 保留不动）**；措辞勘正（2026-09-04 23:10——用户拍「都修」）：edit.md/file.mjs 参数行「zero overlap → new_string inserted after old_string」同步补例外句「a unique single-line old/new pair replaces the line in place」——与锚②同修复批——锚断言覆盖段一并迁移；锚②尾句已收紧（见上——删「replaces, never adds」绝对化——2026-09-04 23:10）**；
- NF15.7d 零破坏：既有 edit 域断言除迁移项外全绿。

**设计（D15.9）**：
- **D15.9.1（判定分支 0——单行精确替换）**：computeEditEntry 判定序前插入——`old 单行 && new 单行 && 全文唯一匹配 && new 非空 → 整行替换`（old 行 → new 行——行数不变——EOL 恢复仍由调用方 joinWithEol）——唯一匹配复用既有检查（不新增错误路径——多匹配仍报既有错误——分支 0 不吞）——**次序（评审 #3）：空 new 显式错误（T15.3a——防删除保护）先于分支 0——空串 new 不满足单行×单行条件（splitLines("")=[]——非 [""]——勘正 2026-09-04 id:1 实证）——经既有空 new 显式错误路径拒——单行替换永不成删除**；
- **D15.9.2（其他形态不变）**：old/new 任一侧多行 → 既有判定序（零重叠插入/LCS）；单行多匹配 → 既有 occurrences 错误；replace_all → 字面全部（不落分支 0）；
- **D15.9.3（落点）**：CLI `src/tools/edit-diff.mjs`（computeEditEntry 判定序）+ `src/tools/file.mjs`（editTool 壳——单形态前置校验若在壳则放行）+ `src/tools/edit.md`（描述——NF15.7c 新锚）；VS Code `src/tools/edit-diff.mjs` 镜像同构 + **`src/tools/file.mjs`（edit 工具描述段——评审 #2：VS Code 描述 = .mjs 内嵌——无独立 .md——§15 机制注已证）**。

**测试（T15.33-37）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T15.33 | N | 单行 old 唯一匹配 + 单行 new（A 仅一处——A→X） | **替换**——A 消失 X 在位——行数不变——EOL 保留 |
| T15.34 | E | 单行 old 多出现（A 两处） | 仍报既有 occurrences 错误（分支 0 不吞） |
| T15.35 | E | 多行 old 零重叠 new（old=[A,B] new=[X,Y]） | 仍插入（回归——旧语义不动） |
| T15.36 | E | 多行 LCS（old=[A,B] new=[A,X]） | 仍 LCS（回归） |
| T15.37 | A | 审计核对（交付走查——评审 #4）：computeEditEntry 判定序含分支 0 + T15.33/34 断言双端镜像 | 走查核对记录——回潮由 T15.33 断言失败暴露（防回潮说明——非独立用例） |
（落点：CLI edit 语义域测试文件——§18.14 拆分后（edit-tools.test.mjs 或 edit-batch 域——实现批以实际为准）；VS Code 镜像同构。**类别图例（评审 #4）：N=正常路径 / E=错误路径与语义回归 / A=防回潮审计说明**。）

**迁移注（§15.1 T15.32 连带——2026-09-04）**：§15.1 T15.32 单行案例（OLD=[A] new=[X]——预期插入）与分支 0 **语义冲突**——分支 0 落地后单行唯一匹配 = 替换——**T15.32 输入迁移为多行语境**（old=[A,B] new=[X]——零重叠插入回归保留——§15.1「单形态零重叠→插入」在**多行形态仍成立**）——实现批按新输入改 §15.1 断言并列出迁移清单（AC15.9 复测）——桥通道经 computeEditEntry 自动继承分支 0（单一权威——无需桥端额外工作）——**桥级单行替换不补独立用例（评审 #5——2026-09-04 用户拍 b——明示间接覆盖成立：桥只调 computeEditEntry——分支 0 在权威判定链内——T15.33 本地断言 + 迁移后 T15.32 多行桥用例已能暴露委派断链）**。

**验收（AC15.12/13）**：AC15.12 = T15.33-37 绿（双端）；AC15.13 = 既有 edit 域断言全绿（零破坏——**迁移清单（评审 #1）：§15.1 T15.32 单行断言 → 多行输入 + T15.10 系描述锚断言目标句 → NF15.7c 新锚**——T15.32/T15.3a/描述锚均列入复测）。**实现批预核补遗（2026-09-04——父侧 grep 实证）：T15.2 tool 级断言（file-tools.test.mjs:399——"零重叠单行→插入（旧行保留）"）将因分支 0 翻转（单行×单行唯一→替换）——属语义迁移项（非零破坏）——实现批迁移并报告；T15.2 单元断言（file-tools.test.mjs:351——applyPatchLines 直测）层不改（分支 0 在 computeEditEntry 判定层——applyPatchLines 纯 diff 语义不动）**。

**关键决策**：
- **B 而非 A**（A=agent 纪律改用 hashline_edit——零代码）——用户拍 B：高频形态该由工具直接支持——描述同步后 agent 无需记「单行用 hashline」特例；
- **分支 0 在判定序内**（computeEditEntry 一处）而非壳外：壳/桥/批量 edits 路径自动继承——单一权威；
- **行为修正口径**：单行×单行唯一匹配从「插入」改「替换」——登记 CHANGELOG（行为修正——修坑非破坏——§15.1 T15.32 迁移为内部一致性变更）；
- **取代指针（评审 #6）**：§15 旧语义陈述（F15.2 / 判定序 1 / D15.1 锚句——L431/447/459）与 §15.1 T15.32 表行（L605）为历史快照——保留原文——**实现批落地时同步加「——单行×单行唯一匹配由 §15.2 分支 0 修订（替换）」指针**（§15.1 L576 同款先例——文档同步清单随任务书）。

### 15.3 apply_patch 零上下文 hunk 放宽（2026-09-04 · 用户「能不能把工具改得符合直觉」——fast lane——来源：父侧 apply_patch 七微 hunk 双拒实证）

> 状态：**已实现（2026-09-04——双端主批交付：CLI id:3 clean（L1 1427/1427）+ VS Code id:4 clean（L1 1127/1127）——AC15.14/15 核销——T15.18 夹具迁移（双形态）+ 锚断言 4 拷贝字节一致——取代指针已落 §15 D15.6.2/T15.18——措辞勘正修复批（id:6——NF15.8c 锚句末句按「有无 - 行」重写——用户 2026-09-04 23:10 拍「都修」）**已核销（2026-09-05——4 拷贝 byte-identical——锚断言双端绿——L2 终核 CLI 1430/VS Code 1129 全绿）**——评审 0🔴 通过（token e4498dd8——4🟡+2🔵 用户拍处置）**。来源：2026-09-04 apply_patch 用零上下文微 hunk 改 TOOLS.md §15.2 七处——工具拒绝（"0 context line(s)"——裸 @@ hunk 靠上下文行定位——零上下文=空指纹=拒）→ 第三次改单 hunk 整节替换成功——用户问「能不能把工具改得符合直觉」→ 拍板做：零上下文「-A/+X」的删除/替换行本身就是锚——与 edit §15.2 同一哲学（唯一→做——歧义→报错不猜）。

**问题（P15.9）**：apply_patch 裸 @@ hunk 定位仅认上下文行——「改一行」的最小直觉 patch（`@@\n-旧行\n+新行`）被拒——须手工补上下文或改写整节——与 edit 单行×单行被插同为「机器直觉」断裂（§15/§15.2 批的同一问题面）。

**需求（F15.8）**：作为 agent，我希望 apply_patch 的零上下文 hunk（@@ 后直接 -/+ 行——无空格上下文行）**以 - 行序列为锚直接应用**——不再要求 ≥2 上下文行——唯一匹配即改。
- 边界：仅放宽「**有 - 锚**」的零上下文 hunk（- 行序列 = 删除/替换锚——位置明确）——**纯 + 行零上下文（无锚——插入位置不明）仍拒绝**（报错引导加锚）；多文件头（---/+++）与 /dev/null 新建形态不受影响（既有语义）。

**非功能（NF15.8）**：
- NF15.8a 歧义不猜：- 行序列多匹配 → 既有 "matches N locations" 类错误（报错引导加上下文——不静默选一）；
- NF15.8b 带上下文 hunk 逻辑不动（≥2 上下文照旧——含跨 hunk 串行语义 T15.20 回归）；
- NF15.8c 描述同步（**评审 #3——逐字定稿**）：apply_patch.md（§15 APPLY_PATCH_D15_ANCHOR 句——"…include at least 2 context lines for a unique match"）与 patch.mjs description（若含同句）——**旧句替换为（逐字——两端照抄——VS Code 对应 more-file.mjs apply_patch 工具描述段同改——改动仅该句——描述其余不动）**：
  > Hunk header "@@" without coordinates is accepted. Coordinate-less hunks are located by their anchor lines: context lines plus the removed (-) lines, matched as a contiguous sequence — a unique match applies. The anchor-free forms require context: a hunk with no removed (-) lines (pure additions) needs at least 2 context lines for a unique match; a zero/one-context hunk with at least one removed (-) line is located by its anchor sequence (context + removed lines, in order) and applies on a unique match.
  （fail-when-unchanged 锚句 = 上引号英文段——T15.10 系描述锚断言目标随本批迁移——**列入 AC15.15 迁移清单**——与 §15.2 的描述锚迁移同族——prompts.test.mjs——两批串行——第二批以第一批后的实际断言状态为准）；**措辞勘正（2026-09-04 23:10——用户拍「都修」）：锚句末句按「有无 - 行」重写——删「pure-+ (insert) hunks and multi-line forms need at least 2 context lines」与 T15.39（多行 - 锚零上下文接受）的字面互斥——修复批随本批后**；
- NF15.8d 双端同语义（§18.11——设计锚为准——CLI/VS Code 各自照抄）+ 零破坏（既有 apply_patch 域断言全绿——edit-tools.test.mjs T15.17/T15.20/matches-locations 等回归）。

**设计（D15.10）**：
- **D15.10.1（锚判定——评审 #4a 放宽统一）**：patch 解析/定位层——裸 @@ hunk 若**上下文行数 < 2 且含 ≥1 个 - 行** → 定位锚 = **hunk 内匹配行序列（空格上下文行 + - 行——按 hunk 内出现序）连续**——全文唯一序列匹配 → 应用（- 后随 + = 替换；- 后无 + = 删除）——**0 上下文与 1 上下文行同待遇**（消非单调：恰 1 上下文行 + - 锚不再被 ≥2 规则拒绝——规则统一为「定位锚 = 上下文行（若有）+ - 行序列——唯一匹配即应用」）——多匹配 → 报错（既有错误通道——提示调整锚）——无匹配 → 既有 not-found 语义；
- **D15.10.2（不变量）**：上下文行数 ≥2 的 hunk 完全走既有路径（纯上下文匹配——零改动——T15.17/T15.20 回归）；- 行序列匹配 = 行级连续序列相等（- 行之间夹空格上下文行即并入锚序列——按出现序——与 git patch 语义一致）；EOL/原子性/多文件域既有机制不动；
- **D15.10.3（落点）**：CLI `src/tools/patch.mjs`（解析/定位）+ `src/tools/apply_patch.md`（描述锚句——NF15.8c）+ 测试 `test/edit-tools.test.mjs`（apply_patch 域段——T15.38 系追加——**实现批以实际域文件为准**——§15.2 同款措辞）；VS Code 镜像同构（patch 工具实现/描述/测试——以 VS Code 仓实际文件为准——实现批定位报告）。

**测试（T15.38-44）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T15.38 | N | 零上下文 `@@\n-旧行\n+新行`——- 行全文唯一 | 替换——旧行→新行（行数不变） |
| T15.39 | N | 零上下文 `@@\n-行A\n-行B\n+新块`（多行删除锚——唯一连续序列） | 块替换——A、B 消失、新块在位（多行 - 锚支持——patch 的 - 行无语义歧义） |
| T15.40 | E | ①锚序列（含 - 行）多匹配（两处同序列）②纯 + 零上下文（无 - 锚） | ①报错（matches N locations——引导调整锚——不静默选一）②仍拒（位置不明——报错加锚） |
| T15.41 | E | 带上下文 hunk（≥2——T15.17/T15.20 形态）回归 | 既有路径全绿（零破坏） |
| T15.42 | N | **恰 1 上下文行 + - 行**（`@@\n 上下文行\n-旧行\n+新行`——锚序列（上下文行+旧行）全文唯一——评审 #4a 非单调消除） | 应用——上下文行保留、旧行→新行（不再被 ≥2 规则拒） |
| T15.43 | E | 锚序列零匹配（- 行序列全文不存在——评审 #5a） | 既有 not-found 语义（不写——报错） |
| T15.44 | N | 两个零上下文 - 锚 hunk 串行（后 hunk 的锚 = 前 hunk 应用后新内容——评审 #5b） | 逐个应用——第二 hunk 基于第一 hunk 结果定位（T15.20 同款语义——零上下文形态） |
（落点：CLI edit-tools.test.mjs（apply_patch 域段——§18.14 拆分后——实现批以实际为准）；VS Code 镜像。）

**验收（AC15.14/15）**：AC15.14 = T15.38-44 绿（双端）；AC15.15 = 既有 apply_patch 域断言全绿（零破坏——**迁移清单（评审 #1）：①T15.18 夹具核对——若其零上下文夹具含 - 行 → 期望从「报错」迁移为「唯一匹配即应用」（或换夹具为仍拒形态：纯 + / 无 - 锚）——§15.2 迁移注同款——迁移项入报告；②T15.10 系描述锚断言目标句 → NF15.8c 新锚（与 §15.2 描述锚迁移重叠——以先交付批后的实际断言状态为准）**）。

**关键决策**：
- **放宽仅「有 - 锚」形态**：删除/替换行的位置由 - 行自身表达（patch 格式无语义歧义——与 edit 的 old_string「新增意图」歧义不同——edit §15.2 单行限制不移植）——纯 +（插入）必须由上下文定位——插入无锚不可判；
- **评审 #4a 裁定——放宽统一至 context<2 含 - 锚**（而非仅 0 上下文）：恰 1 上下文行 + - 行的 hunk 若被 ≥2 规则拒绝、其零上下文同胞却接受 = 非单调接受面（模型删掉唯一上下文行反而通过——再造机器直觉断裂）——统一锚 = 上下文行（若有）+ - 行序列——0/1 上下文同待遇——测试 T15.42 锁定；
- **与 §15.2 同哲学、不同实现层**：唯一→做/歧义→报错——但改的是 patch 定位层（非 edit-diff 判定链——与在跑 §15.2 批零文件域冲突——§15.2 改 edit-diff.mjs——本批改 patch.mjs）；
- **描述锚迁移重叠提示**：§15.2（edit 锚）与 §15.3（apply_patch 锚）都触 prompts.test.mjs T15.10a 系——两批串行交付——第二批实现时以第一批后的实际断言状态为准（实现批任务书注明）；
- **行为修正口径**：接受面扩大（原拒绝→现接受）——登记 CHANGELOG（非破坏——无既有合法输入行为改变）；
- **取代指针（评审 #2）**：§15 D15.6.2「每个无坐标 hunk 都必须含至少 2 行上下文」（L493）与 T15.18 表行为历史快照——保留原文——**实现批落地时同步加「——零上下文/1 上下文含 - 锚形态由 §15.3 放宽（锚序列唯一匹配即应用）」指针**（§15.2 L656 取代指针同款先例——文档同步清单随任务书）。

### 15.3a apply_patch 文件头 `+++` 容缺（2026-09-05 · 用户「我的原则很简单用符合模型直觉的方式解决这个问题」——来源：父侧 apply_patch 3 连败实证——报错引导无效——与 §15.3 同哲学（接受面扩大——「唯一→做/歧义→报错」）、层不同（§15.3 改 hunk 定位层——本批改文件头解析层——同为 patch.mjs/more-file.mjs））

> 状态：**已实现（2026-09-05——直接实施——CLI edit-tools 60/60（P15.10a-e 新增 5 例 + T15.38-44 回归）+ file-tools/prompts 99/99 零破坏；VS Code edit-semantics 58/58（5 例镜像）+ file-tools 10/10——双端同语义）**。来源：父侧 18:42:48/18:43:03/18:44:15 三次 apply_patch 失败——全部同形：单文件补丁 `--- a/<path>` 头后直接 hunk（缺 `+++ b/<path>` 配对行）→ `Malformed patch: expected "+++" line after "--- a/..."`——**报错文本逐字告知修法（加 +++ 行）仍三连重试同形**——含拆小重试、换目标文件重试、归因「解析器对这些文件报错」（错误归因——工具 100% 正确）——报错引导对 LLM 生成缺陷无效的又一次实证（§14/§15 已记录同族：hashline 830+ 次）——用户裁定「符合模型直觉」：形态合法化而非继续引导。

**问题（P15.10）**：apply_patch 单文件补丁要求 `--- a/<path>` 与 `+++ b/<path>` 成对出现——模型自然输出常省略 +++ 行（从零重写单文件补丁时「精简」冲动——本会话 CLI 4 个补丁成对、VS Code 3 个单文件补丁全缺——跨仓库切换时头部模板退化）——严格拒绝制造无效失败且引导无效。

**需求（F15.9）**：作为 agent，我希望 `--- a/<path>`（或 `--- b/<path>`）头后**直接跟 hunk** 时按同路径修改接受——不再要求 `+++ b/<path>` 配对行——文件名信息完整（oldPath 即目标）——唯一匹配即应用。

**边界（B15.10——同 §15.3 「信息真缺失仍拒」哲学）**：
- `--- /dev/null` 缺 `+++ b/<path>` → **仍拒——特报**：`"--- /dev/null" needs a "+++ b/<path>" line naming the new file — the --- side does not carry the file name`（新文件名从 --- 侧不可推导——信息真缺失——与纯 + 零上下文 hunk 拒同族）；
- **删行内容 `-- x` 不误断**：patch 文本 `--- x`（行首 - 标记 + 内容 `-- x`——非 a//b/ 前缀形态）是普通删除行——不是文件头——hunk 体正常消费（顺带修复 CLI 旧行为：裸 @@ 边界对任何 `--- ` 无条件断——`-- x` 内容删行被误判文件头）；
- 完整头（后随 `+++ `）任意老路径形态均认（git 规范不变）；多文件补丁内完整/容缺可混合。

**设计（D15.11）**：
- **D15.11.1（判定）**：`isFileHeader(line, nextLine)`——`--- ` 开头 &&（next 是 `+++ ` → 完整头；否则 oldPath ∈ a//b/ 前缀 → 容缺头；否则非头）。头处理三分支：完整（i+=2）/ 容缺（i+=1——newPath 推导 = oldPath——isNew=false）/ 特报（/dev/null）/ 原错保留（未知形态——仍可能是把删行误放文件位）；
- **D15.11.2（hunk 边界同步）**：裸 @@ 体消费遇文件头（完整或容缺）即断——CLI L56 判据与 VS Code L128 统一为 isFileHeader（CLI 旧判据无条件断 `--- ` → 误伤删行内容——修齐；空行判据（复评 #1 幽灵上下文防护）同步收紧为 isFileHeader——`--- x` 删行内容不再被空行判据误断）；坐标 hunk 计数消费不受影响；
- **D15.11.3（空段过滤）**：解析后过滤 hunk 数为 0 的文件段——不虚报 touchedPaths/摘要、不触发对不存在文件的整文件读取（旧行为：多文件补丁尾部空段头 → File not found 原子失败）；全空 → 既有 `No file changes found`；
- **D15.11.4（描述同步——不触 NF15.8c 锚句）**：CLI apply_patch.md L6 + patch.mjs 参数 description L150 + VS Code 顶层描述 patch 行——补容缺说明句（new files still need `--- /dev/null` + `+++ b/<path>`）——NF15.8c 句（md L9 / VS Code L223）逐字不动（4 拷贝字节一致锚不回退）。

**测试（P15.10a-e——双端）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| P15.10a | N | 容缺头 `--- a/a.txt` + 裸 @@ hunk（无 +++ 行） | 应用——同路径修改成功（单文件自然形态） |
| P15.10b | N | 多文件混合——a 完整头（+++ 配对）+ b 容缺头 | 两文件都应用（`Applied patch to 2 file(s)` / 双 Patched） |
| P15.10c | E | `--- /dev/null` 缺 +++ | 特报（naming the new file——不写文件） |
| P15.10d | E | 裸 @@ 内删行内容 `-- tgt`（patch 文本 `--- tgt`） | 不误断为文件头——正常删除（边界锁——旧 CLI 行为静默漏删） |
| P15.10e | E | ①多文件补丁尾部容缺空段头（目标不存在）②纯空段补丁 | ①空段过滤——不虚报不无谓读——真实 hunk 应用 ②`No file changes found` |

**验收（AC15.16）**：P15.10a-e 双端绿 + 既有 apply_patch 域断言全绿（T15.17-20/T15.38-44/原子性/多文件——零破坏——双端相关文件实测：CLI edit-tools 60 + file-tools/prompts 99；VS Code edit-semantics 58 + file-tools 10）。

**关键决策**：
- **形态合法化而非继续引导**（与 §15.3 用户「能不能把工具改得符合直觉」同一裁决——§9「顺手的护栏 ≠ 没护栏」：容的是形态——文件名字段信息完整时无护栏需求——`/dev/null` 信息真缺失仍拒）；
- **报错文本保留给真正未知形态**（`--- x` 非 a/b/ 前缀非 /dev/null 且无 +++——如把删行误放文件段位——引导仍在）；
- **CLI 空行判据收紧是顺带修复**（复评 #1 幽灵上下文防护的判据从「任何 `--- `」收窄到「文件头形态」——原判据会误断 `-- x` 内容删行——T15.38a 跨文件回归保留）；
- **行为修正口径**：接受面扩大（原拒绝→现接受）+ 空段副作用消除——登记 CHANGELOG（非破坏——无既有合法输入行为改变）；CLI 侧一处隐性 bug 修复（`-- x` 删行静默漏删——本批测试锁定）。






