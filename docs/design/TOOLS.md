# 工具系统设计（thincoder/src/tools/ + src/agent-tools/ + src/mcp/）

> 状态：2026-08 回补。24 个内置工具 + MCP 客户端 + 元工具（agent-tools），统一 schema（OpenAI function calling）、统一上下文（cwd/agent/callbacks/signal）、统一安全边界（路径/命令/网络/沙箱）。

## 0. 机制目标（总体需求）

工具系统是 agent 与外部世界（文件/命令/网络/git/MCP/项目状态）交互的**唯一通道**：把「能做什么」以统一 schema 暴露给模型，把「怎么安全做」收口到工具内部（路径/命令/网络/沙箱四道边界），把「何时做」交给调度层（只读并行、副作用串行、审批门控）。目标是让模型在能力边界内自助完成任务，同时把破坏性/越界动作挡在真实防线（审批 + 快照）之内——正确性/可用性优先于 token 节省。

## 0.1 非功能性需求（硬指标）

| 项 | 指标 |
|---|---|
| 工具超时 | bash 120s；execute 沙箱强杀（默认 30s 上限）；其余工具同步即时返回 |
| 读/输出上限 | `MAX_READ_LINES=2000`、`MAX_OUTPUT_CHARS=200_000`（超限落盘，模型见预览） |
| 网络响应体 | websearch/fetch ≤5MB；HTML 转文本（stripTags/htmlToText） |
| 路径安全 | `resolveInCwd` 防 `../` 逃逸 + `assertInside` + `realpathNearest` 符号链接解算 |
| 命令安全 | 破坏性命令 snapshot-then-proceed（审批 + gitGuardSnapshot/checkpoint），文本拦截仅提示不拦截 |
| execute 沙箱 | `import()` 动态加载阻断、`require()`/`process` 禁、超时强杀——只出不进 |
| 返回契约 | `execute` 必须返回字符串（undefined 视为错误，dispatch 显式检查） |

## 1. 注册与 schema

- **注册表**（tools/index.mjs）：`builtinTools` 数组（24 个）——file 6（read/write/edit/insert_after/hashline_edit/read_image）、patch 2（apply_patch/delete）、system 4（bash/glob/grep/ls）、web 2（websearch/fetch）、git 2（git/question）、checklist、lint、lsp、codemode、ops 3（file_ops/process/get_current_time）。
- **schema 生成**：`toOpenAISchema(tool)`（shared.mjs）——name/description/parameters 转 OpenAI function 格式；description 来自 `tools/*.md`（`DESC(name)` 机制：md 文件即描述源，带参数说明，模型看到的是完整使用手册而非一行字符串）。
- **工具契约**：`{ name, description, parameters, readonly?, sideEffectExempt?, parallel?, multimodal?, execute(args, ctx) → string }`；`ctx = { cwd, agent, depth, signal, callbacks, onOutput, onQuestion, onPermissionRequest }`。**execute 必须返回字符串**（undefined 视为错误，dispatch 显式检查）。
- **元工具**（agent-tools.mjs）：task / plan / goal / verify / subagent / skill / recent_changes / advisor / eng / timer——`readonly` 自管纪律工具；子代理按 role 过滤（explore/plan 只读，eng-coder 额外门控）。

## 2. 安全边界（shared.mjs + 各工具）

| 面 | 机制 |
|---|---|
| **路径** | `resolveInCwd(ctx, p)`（防 `../` 逃逸到工作区外）+ `assertInside` + `realpathNearest`（符号链接解算）；`resolveExternal` 显式白名单外部路径（仅 question 等特殊工具） |
| **命令**（bash） | **零文本拦截**：破坏性命令（rm -rf/DROP TABLE 等）一律放行——恶意模型可用空白变体/heredoc/node -e 绕过，文本匹配拦不住且误伤正常操作；真实防线 = 审批层 + 快照。保留：`hasFileRedirection`（禁止 bash 写文件，路由到 write/edit，引导性非安全门）、`detectDanger`（危险标注只提示不拦截：recursive-delete/sudo/pipe-to-shell/dd/mkfs/raw-device/chmod-777/fork-bomb，审批面板红标，引号感知防 commit message 误标）、git 破坏操作快照后放行（gitGuardSnapshot，永不拦截）；超时 120s |
| **网络**（websearch/fetch） | `isPrivateHost`（localhost/内网/云元数据 169.254.169.254）——SSRF 防护；响应体 ≤5MB；HTML 转文本（stripTags/htmlToText） |
| **文件** | `MAX_READ_LINES=2000`、`MAX_OUTPUT_CHARS=200_000`（超限落盘，模型见预览）；`normalizeEOL`（CRLF 统一）；write 前 `autoSyntaxCheck`（JS 文件自动 node --check 预检） |
| **lint** | `node --check` fast path + eslint 级联（flat config 检测）——取代旧 syntax_check |
| **lsp** | 按需 spawn LSP server（`process.execPath` 直跑，无 shell），语义级诊断/跳转兜底 |

**execute 工具（沙箱）**：`import()` 动态加载被阻断（防沙箱逃逸）、`require()`/`process` 访问被禁、超时强杀——代码执行只出不进（模型在隔离环境跑用户代码）。

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
| bash 命令零文本拦截 | 文本匹配是安全剧场：恶意模型必然绕过（空白/heredoc/node -e），拦住的只有正常操作；真实防线 = 审批层（autoApprove）+ 快照（gitGuardSnapshot/checkpoint）。危险标注（detectDanger）只给人看，不构成边界 |
| 超限落盘而非截断 | 模型可再用 read 工具读全量；预览 2K 字符足够决策 |
| 沙箱只出不进 | 模型执行用户代码时，网络/文件系统读写按工具授权而非代码内自由 |
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

**破坏性原则**（沿用「破坏性操作 snapshot-then-proceed」）：reset --hard / checkout 丢改动 / rm 等先快照再执行 + 用户确认。CLI 用 `createCheckpoint`（全量复制，非破坏）；VS Code 用 `git stash create`+`git stash store`（非破坏，与 `git stash push` 清工作区不同）。**顺带修复的既有 bug**：`runGit` 对整段输出 `.trim()` 会剥掉 porcelain 首行的「 」（unstaged 标记），把 unstaged 误分类成 staged——status 改用保行前导空格的 `runGitRaw`。

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

**受影响文件**：CLI `src/tools/git.mjs` + `src/tools/git.md` + `src/prompts/discipline.md`、VS Code `src/tools/git.mjs` + `src/prompts/discipline.md`、两端测试、`CHANGELOG.md`。

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
| T-w-2 | workdir 越界 | `workdir` 指向 workspace 外 | 报错拒绝，不执行 |
| T-e-1 | scriptFile 跑文件 | execute `scriptFile="x.mjs"`（console.log 输出） | 子进程执行，stdout 返回 |
| T-e-2 | nodeArgs --check | 好文件（静默）/ 坏文件（SyntaxError） | 退出码区分，语法错误可见 |
| T-e-3 | scriptFile 越界 | scriptFile 指向 workspace 外 | 报错拒绝 |
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
