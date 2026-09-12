# 工具系统设计（VS Code 扩展实现）

> 板块：工具系统。本文件描述 VS Code 扩展侧工具系统的**当前设计**——工具如何暴露给
> 模型（统一 OpenAI function-calling schema）、如何安全执行、如何调度与审批、如何以
> VS Code 原生能力适配（编辑器编辑/保存/语言服务/diff 预览）。与 CLI 同名文档对应同一
> 机制板块——各端独立实现，内容以本端代码为准。
> 权威源：`src/tools/`（内置工具实现 + `shared.mjs` VS 适配）+ `src/agent-tools/`（自律/
> 评审/子代理工具族）+ `src/tools.mjs`/`src/tools/index.mjs`（注册表）+ `src/agent/setup.mjs`
> （工具表每轮装配）+ `src/agent/execute-tools.mjs`（调度/门禁/批审批）。实现为唯一事实源。
> 关联：`AGENT-LOOP.md`（调度/审批/子代理）、`MCP.md`（MCP 展开工具并入统一工具表）、
> `CHECKPOINT.md`（git 破坏性操作快照）、`SESSION.md`（read_history）、`PROVIDER.md`
> （multimodal 挂载 read_image）。
> 2026-09-08：从 `ARCHITECTURE.md` §7 迁出成立本档（DOC-REORG-VSC 第 5 批）——写全 VSC
> 独立实现；ARCH 瘦身由后续批统一做。

## 1. 定位与统一契约

工具系统是 agent 与外部世界（文件/命令/网络/git/编辑器/MCP/IDE 态/项目结构）交互的
**唯一通道**。设计原则：**信任模型 + 审批门控 + 快照**（非文本拦截）。

- **统一契约**：每个工具 `{ name, description, parameters, readonly?, sideEffectExempt?,
  parallel?, execute(args, ctx) → string }`——`toOpenAISchema(tool)`（tools/index.mjs）转
  OpenAI function schema。execute 必须返回字符串（dispatch 显式 `String(raw)`，AbortError
  重抛）。
- **ctx**（dispatch 注入 execute 第 2 参）：`{ cwd, agent, callbacks, signal, depth,
  sessionSignal, getAuto, onOutput }`。`getAuto` 为 live autoApprove getter（§8）。
- **子代理工具面**：depth=0 顶层拥有完整工具集 + 自律 meta 工具；depth=1 子代理按 role
  缩减（explore/plan/consult 只读、question 全 depth>0 剔除）——装配规则见 §5。
- **description 载体**：CLI 用 `tools/*.md`（`DESC()` 机制，md 文件即描述源）；VS Code
  用 `.mjs` 内嵌描述（`tools/*.mjs` 的 `description` 字段）——给模型完整使用手册（参数
  说明/路由/反模式），非一行字符串。

## 2. 注册表与内置工具清单

`builtinTools`（tools/index.mjs）为注册表单一来源，re-export 自 `tools.mjs`（向后兼容
shim）；`read_image` **不进 builtinTools**——由装配按 `spec.multimodal` 单独挂载（§5）。

| 分类 | 工具（实现文件） |
|------|------|
| 文件 | `read`/`write`/`edit`/`hashline_edit`（hashline-edit.mjs——2026-09-08 自 file-edit.mjs 拆分 + file-edit.mjs re-export）、`insert_after`/`apply_patch`/`ls`/`delete`（more-file.mjs） |
| 编辑保障 | `lint`（linter.mjs——零依赖级联） |
| 列表 | `checklist`（checklist.mjs） |
| 搜索 | `glob`/`grep`（search.mjs）、`code_search`/`doc_search`（code.mjs）、`repo_outline`（repomap.mjs）、`tree`（tree.mjs） |
| Git | `git`（git.mjs + git-ext.mjs/git-checkpoint.mjs——clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv + checkpoint 快照子系统） |
| 系统 | `bash`（shell.mjs）、`file_ops`/`process`/`get_current_time`（ops.mjs） |
| 网络 | `websearch`/`fetch`（web.mjs） |
| 交互 | `question`（question.mjs——面板内联卡） |
| 媒体 | `read_image`（read_image.mjs——multimodal 挂载） |
| 代码智能 | `lsp`（lsp.mjs——VS Code 原生语言服务）、`execute`（execute.mjs——纯净 node ESM 子进程） |
| IDE 集成 | `focus`（focus.mjs）、`context`（context.mjs——IDE 态快照） |
| 记忆/索引 | `memory`（memory-tool.mjs——文件式条目 + frontmatter；embedding key 向量检索否则关键词回退） |
| 会话/协作 | `wait_for`、`peer_instances`（extension/peer-instances.mjs——只读，R10） |
| 编辑保障/角色 | 分类见 §3 的 `edit-diff.mjs`/`shared.mjs` 共享编辑原语 |

> 注：builtinTools 不含 checkpoint/mcp 网关——checkpoint 能力收在 git 工具 action
> （git-checkpoint.mjs）；MCP 工具每轮装配时**动态展开**并入工具表（MCP.md §5）。

## 3. VS Code 适配增强（本端差异核心）

工具执行经 VS Code API 增强（extension host 内运行，`import * as vscode` 可用）：

- **write/edit**：对已打开文档经 **WorkspaceEdit** 应用（undo 集成）后**立即保存**
  （`applyEditorEdit`/`applyEditorRangeEdit`，shared.mjs）——不保存则 buffer 脏 + 磁盘旧，
  isDirty 守卫自锁下次编辑并产生外部写者竞态；保存后刷新 Markdown 预览
  （`refreshMarkdownPreview`）并在编辑器中自动打开文件。`getOpenDoc` 定位打开文档时
  **win32 盘符大小写归一**（`d:\` vs `D:\` 不一致会走磁盘写路径造成 split-brain）。
  文件落盘带 EOL 检测/保持（`detectFileEol`/`joinWithEol`/`majorityEol`）+ `stripBom`
  归一。
- **bash**：继承终端 shell 环境（`process.env`）；`cwd` 缺省第一个 workspace 文件夹；
  `runInterruptible` spawn（非 execSync——避免阻塞 extension host 事件循环），Stop 中断/
  超时经 `killProcessTree` 整树杀（Windows taskkill /T /F 达孙进程）。
- **git 工具快照守卫**：破坏性动作先 `gitGuardSnapshot`（git-checkpoint.mjs）后放行。
- **路径解析**：相对路径相对 `ctx.cwd`（workspace 根）；`resolvePath` 纯 resolve。
- **编码**：`makeDecoder` 增量字节→文本解码器——ASCII 快路径 / UTF-8 chunk 边界安全 /
  GBK 回退（Windows 遗留工具）；`sanitizeOutput` 去 ANSI + 归一 EOL。

## 4. 路径纪律与安全边界（现行——2026-09-02 工具作用域限制移除后）

**无目录限制**——`resolvePath` 不再拒绝 `../` 跳出 workspace，`execute`/`git` 的
workdir/scriptFile 可指向 workspace 外（纯 resolve，bash 一致性）；残留风险由既有护栏
承接：权限门禁（逐工具/逐批询问）+ 破坏性操作快照不变。工具描述措辞 "confined to the
workspace" 已改为 **"no directory restriction"**（权威源 = CLI TOOLS.md「4. 安全边
界」——approval gate is the guard；本仓 AGENTS.md Hard Constraints 同步；工具描述措辞逐
字见 src/tools/execute.mjs）。

安全面：

| 面 | 机制 |
|---|---|
| 命令 | 零文本拦截（破坏性命令走审批 + 快照）；bash 超时 `BASH_TIMEOUT_MS`=120s；`runInterruptible` |
| 文件 | read 分页 `offset`/`limit`（limit 默认 2000——非全局硬限）；工具结果超 `MAX_TOOL_RESULT`=64K 落盘、模型见双端预览（§7）；`MAX_OUTPUT_CHARS`=200_000 为 `truncate` 截断默认；`normalizeEOL`/`stripBom` 归一 |
| 网络 | `isPrivateHost`（localhost/内网/云元数据 169.254.169.254）SSRF 防护；`truncate` 截断提示 |
| execute | 纯净 node ESM 子进程（零预置全局、零伪沙箱）；scriptFile/nodeArgs；顶层 await/动态 import 可用；超时 30s 上限 600s |
| git | 破坏性动作先快照再执行 + 确认，从不拦截（`gitGuardSnapshot`——全量副本，CHECKPOINT.md 权威） |

## 5. 工具表装配（每轮重建——setup.mjs）

`setupAgentRun` 每轮重建工具表（热插拔语义——MCP 连接/配置变更天然下轮生效）：

```js
// 1) 只读角色（explore/plan/consult, depth>0）只用 builtinTools.readonly 过滤
// 2) question 全 depth>0 剔除（后台子代理永不弹用户）
// 3) spec.multimodal → 追加 read_image
// 4) agentTools：depth-0 = 全部自律工具（含 subagent/consult）；role 分派见下
// 5) depth-0 → 展开 MCP 工具（connectMcpServersExpanded，失败非致命记 warning）
// 6) extraTools：调用方注入（如 consult 的 main_history）
// tools = baseTools + readImage + agentTools + mcpTools + extraTools
```

**agentTools 按 role/depth 分派**（agent-tools.mjs + agent-tools/settings.mjs）：

- depth-0：task/recent_changes/read_history/settings +（consultModels 配置时）subagent（withPool
  描述附当前 consultant 池）/plan/goal/skill/verify/timer/advisor/eng + consult_start/consult_stop
  （仅配置时注册）；read_history 为 depth-0 ONLY（SESSION.md §9 D-S2）。
- eng-coder：task/recent_changes/plan/timer/advisor/verify + **engAuditSubagentTool**（受限
  explore + sync + spawn-only 审计通道，schema 层过滤；机械门禁在 subagent.mjs gateEngCoderSpawn）。
- coder：task/recent_changes/verify/advisor；其余只读子代理：task/recent_changes。
- `settings` 工具（depth-0）提供 settings list/get 只读动作（isReadonlyAction）。

**`settings` 工具的形状护栏（2026-09-11 第 8 批——与 CLI 同源；范围项 W2（第 8 批待裁定项「VSC 镜像是否纳入」——裁定 = 纳入）已裁定纳入本批——2026-09-11 用户裁定，依据 = 本端同一缺陷完整存在 + 两端共享 `~/.thincoder/config.json`）**：

- **现状（缺陷面）**：类型表自动派生自 `AGENT_DEFAULTS`/`TRACES_DEFAULTS`（`src/config-io.mjs:296-324`），且 `buildTypeMap` 跳过 `null` 叶子（`src/agent-tools/settings.mjs:29`）——被跳过的键**零约束**：字符串/对象/数组一律被接受并落盘（含跨端三键 `defaultModel`/`shell`/`memory.team` 与同族键 `agent.subagentModels`，第 12 批补）→ 应用侧（CLI 读侧）静默折叠 = 「写了等于没写」。
- **契约（同源——详本见 CLI 档 `SETTINGS-TOOL（CLI 仓）` §8.3）**：null 叶子（`_NULL_LEAF_SHAPES`）+ 跨端键（`_SIBLING_SHAPES`）走**显式形状表**，不可消费形态**拒绝**（不落盘、不热应用）。
- **本端键集**（`_NULL_LEAF_SHAPES`——完备性锁的相等面，2 键）：`agent.subagentModel` 非空串 ∪ null · `agent.compactThreshold` number ∪ null（null = auto）。
- **跨端 / 同族键**（`_SIBLING_SHAPES`——存在性断言面，4 键；共享 config.json）：`defaultModel` `"provider:model"` 串 ∪ null · `shell` 非空串 ∪ null · `memory.team` 含非空 `repo` 的对象 ∪ null · **`agent.subagentModels` 角色→非空串对象 ∪ null**（第 12 批第 4 条——本端读侧 `subagent.mjs` `effectiveSubagentModel`；`{}` = 清除）。
- **完备性机械锁**：null 叶子键集 == `_NULL_LEAF_SHAPES` 键集（测试断言 + 运行期一次性警告列出未声明键名）；跨端 / 同族四键在 `_SIBLING_SHAPES` 内**存在性断言**（不参与集合相等）——与 CLI 同款（N-S1.5；第 12 批四键口径）。
- **描述句同步**：`src/agent-tools/settings.mjs:91` 整句替换（逐字新句见 CLI 档 §8.6）。
- **需求层落点**：本仓无 `docs/requirements/`（只有设计层）——第 8 批需求句在 `SETTINGS-TOOL（CLI 仓·需求）` §2（F-S1.7/F-S1.8）；第 12 批 VSC 对位（同族键第 4 条）需求 = 同档 F-S1.7 VSC 对位行。
- `toolSchemas` 在 `engineering` 会话级开关判定**之后**构建——subagent 的 role enum 随模式
  变（`modeRoleField`——非工程 explore/plan/coder、工程 explore/plan/eng-coder）。

`question`/`subagent` 等注入 callbacks（onQuestion/onPermissionRequired…）由顶层接线逐层
透传子代理 ctx。

## 6. 调度与批执行（execute-tools.mjs）

同一 response 的 toolCalls 分组：**连续只读工具并行**、连续 subagent 并行（各起独立
agent，`runWithLimit` ≤ `MAX_PARALLEL_SUBAGENTS`）、其余单条；**批间串行**、结果按调用序
提交。action 级只读（`tool.isReadonlyAction(args)`，如 subagent status、git
diff/status/log/show）并入只读并行组；控制类动作（`isControlAction`——subagent cancel）
独立豁免（只停不启）。

前置门禁 `preGateBlocked`（单点判定，批扫描 + 逐项执行共用）：planMode（非只读非豁免
动作拒）、工程设计闸（eng-coder 未带 token + FILE_MUTATORS 拒）、工程模式父闸（depth-0
无 design token + 写 src/ 非文档拒——docs/ 与根级文档豁免）。

其他执行纪律（CLI parity）：AbortError/Stop 重抛不吞；未知工具回 `unknown tool`；结果
`String(raw)`；multimodal 工具 JSON parse 拆图；落盘 offload（§7）；FILE_MUTATORS 成功即
刻记文件变更事件（`recordFileMutation`——async 评审陈旧判定数据源）+ `_touchedFiles`
记账（resolve 防双前缀）+ advisor/verify guard 失效标记；stall 检测（连续 3× 相同调用 →
警告注入）。

## 7. 工具结果落盘与写时自清理（CLI parity，§5 D-4.1）

结果超 **64K 字符**（`MAX_TOOL_RESULT`，run-helpers.mjs）落盘 `<cwd>/.thincoder/tmp/
tool-<id>.txt`，模型只见双端预览：`[Large output saved. Read the full result with the read
tool: …]` + `buildHeadTailPreview`（head 16K + 省略注 + tail ≤48K——UTF-16 安全双端切片）。
落盘目录写时自清理：每次 offload 写新文件前删除目录内 mtime 超 3 天
（`TMP_RETENTION_MS`）的文件——子目录不动、异常静默；同目录 paste-* 粘贴图片临时文件一并
按此回收。实现 `src/agent/run-helpers.mjs`；清理逻辑两端逐行等价、CLI 为准；落盘目录两端
各自为政（CLI `~/.thincoder/tool-results/`、VS Code `<cwd>/.thincoder/tmp/`）。

## 8. 权限审批（webview 逐工具弹窗 + 批确认）

approve / deny / approve-all + diff 预览（`diff-preview.mjs` 虚拟文档原生 diff）。权限门在
`extension/permission-gate.mjs`（`permissionGate` 逐工具 + `batchPermissionGate` 批门）。autoApprove
为**活事实源**（`getAuto` live getter + 会话槽位字段）——approve-all / AUTO 按钮轮次中途翻
转后，权限询问与 AUTO 标注下一条即生效。细节：

- **批合并询问**（`collectBatchPermission`）：同一 response ≥2 个经前置门禁的非只读工具一
  次询问（`onBatchPermissionRequest`）→ approveAll / oneByOne（回退逐项）/ deny（全批拒、
  无二次询问）；无 handler / 不足 2 个 → 逐项通道。autoApprove 短路（扫描时已开不聚合）。
- **逐项 diff 预览**：bash 与无 path 工具跳过；write/edit/insert_after/delete/apply_patch
  在弹窗前由调用方读旧文件 + 构造新内容 → `diffInfo { old, new, path }`（apply_patch 直接
  给 patch）→ webview 原生 diff。
- **控制类豁免**：subagent cancel / consume-design 免审批；planMode 对 cancel 放行、
  consume-design 拒绝（只停不启 vs 会消费 token 槽）。
- **eng-coder 子代理**：spawn 时经 design token 预授权（runChild 传 autoApprove=true）——
  免逐写询问：权限询问阶段整体跳过；JSON 解析/未知工具/planMode/design-token 前置门先
  行且原样生效（修正轮 #1）。
- **子代理（depth>0）审批**：ask 模式经父面板弹卡——卡带归属（`<child key> · <tool>`）；AUTO（含轮中 approve-all）整树直通；eng-coder spawn 预授权（上条）与 explore/plan 只读集不变。机制/用例 = `AGENT-LOOP.md §18`（实现 `agent-tools/child-permission.mjs` + `extension/permission-gate.mjs`）。
- **Stop 释放挂起门**：permission 挂起的回合被 abort → resolve(false)/deny，循环不悬挂。

## 9. 逐工具契约要点

- **git**：action 集含破坏性动作（reset --hard/checkout 丢改动/rm/clean/rebase 有未提交）
  先快照（gitGuardSnapshot）再执行 + 确认；`runGit` 读路径 CLI parity。
- **edit（每工具一档——2026-09-08 重组，权威 `EDIT.md`）**：精确区域替换（主）——两种定位形态
  （行号 `line`/`startLine`/`endLine` / 内容 `old_string` 三级匹配）+ 替换即删。详细语义/约束/判定序 =
  `EDIT.md`——编辑族各工具：`INSERT-AFTER.md` / `HASHLINE-EDIT.md` / `APPLY-PATCH.md` / `WRITE.md` /
  `EDIT-HELPERS.md`（共享 EOL/候选/U+FFFD + lfOffsetToRaw 编辑器路径）。
- **lsp（VS Code 原生实现——无 CLI 的自起 server）**：直接用编辑器语言服务
  （`vscode.executeDefinitionProvider`/`executeReferenceProvider`/`executeHoverProvider`/
  `executeDocumentSymbolProvider` + `languages.getDiagnostics`）——零配置零进程，任何装语言扩
  展的语言可用；子命令与 CLI 一致：definition / references / hover / symbols / diagnostics。
- **execute**：code / scriptFile 二选一；nodeArgs 禁 eval 类；纯净 ESM。
- **question 使用抑制（AGENT-LOOP.md §16）**：`question` 文本 >100 字符 / `options` >4 条
  → 返回错误串、不调 onQuestion（2026-09-06 裁定 100/4）；卡片换行保形（pre-wrap）+ 高度
  兜底。
- **read_image**：仅 `spec.multimodal` 挂载（setup.mjs）；paste/drag/attach → dataURL 落盘
  `<cwd>/.thincoder/tmp/paste-*` → `[Attached images: …]` 指针 → read_image 通路（image-handler）。
- **memory**：文件式条目 + frontmatter（CLI 兼容）；embedding key 向量检索否则关键词回退。
- **wait_for / timer / process / get_current_time / tree / glob / grep**：按各自描述契约。

## 10. 关键设计决策

- **description 内嵌而非 md 文件**：VS Code 端无 CLI 的 `DESC()` md 加载机制——长描述内嵌
  `.mjs`，模型才理解边界；语义与 CLI 一致（逐字锚走 review 流程）。
- **VS Code 原生能力优先**：编辑经 WorkspaceEdit（undo + 保存 + 编辑器打开）、语言智能走
  编辑器语言服务、审批用 webview 弹窗 + 原生 diff——thin adapter 而非复制 CLI 的 TUI/进程
  面。
- **bash 命令零文本拦截** = “安全剧场”论证：文本匹配拦不住恶意模型，只误伤正常操作；真实
  防线 = 审批层 + 快照；`detectDanger` 只给人看红标。
- **超限落盘而非截断**：模型可再 read 全量，预览够决策。
- **工具全部字符串返回**：schema 简单、dispatch 统一、流式展示统一。
- **live autoApprove**：VS agent 是 per-run 对象、无 CLI 的 `parent.autoApprove` 字段——
  会话槽位 + live getter 承载（§8）。

## 11. git commit 路径面：`--only` 镜像（群 A 批）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1 条目 A9
> （指针 = `docs/TODO.md:167`「QUICKFIX-2 交付注——后批镜像 F-3」）。语义源：CLI
> `src/tools/git.mjs:150-181`（F-3——`commit --only`）；双端纪律：语义同源、本端独立实现。

**问题（现状——as-of 2026-09-11）**：`src/tools/git.mjs:200-219` commit 走**双层混扫**——
`path` 给定时先 `git add -- <paths>`（granular）再 `git commit -m`（整索引提交）——索引中他批已暂存的文件会被卷入本次提交（与 granular 意图相悖）。

**契约（逐条——镜像 CLI F-3——实现对象）**：

1. `path` 给定（非 `undefined`/`null`）→ **不走 add**，直接 `git commit --only -m <message> -- <paths>`
   （从工作树取列文件提交——索引他批不混入；空格分隔多路径形态保持）；
2. `path` 为空串/纯空白 → **明确错误**：
   `Error: commit path is empty/whitespace — give at least one file path (space-separated)`（**不回落 `add -A`**）；
3. `path` 缺省（`undefined`/`null`）→ 既有 `add -A` + `commit -m` 全量语义**原样保留**（单代理语义）；
4. 既有 checkpoint 清理段（`:210-218`）与错误文案形态零改；工具描述行（`:38`）同步：
   `commit` 行改为「stage + commit（message，path for granular）」→「commit；**path → `git commit --only <paths>`**（工作树取列文件——索引他批不混入——原子）；无 path → add -A 全量」；
5. `add` / 其余 action 零改；不加 truncate（本端现状保持）。

**用例表（T-MA9——镜像 CLI `test/git-commit-pathspec.test.mjs`——新档本端自持）**：

| # | 类 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-MA9-1 | 正常 | 临时仓：`a.txt` 改动 + `b.txt` 改动且已 `git add b`（他批 pre-staged）→ `commit{path:"a.txt"}` | 提交只含 `a.txt`（`diff HEAD^ HEAD --name-only`）；`b.txt` 仍 staged（不混入不丢失） | AC-MA9-1 |
| T-MA9-2 | 正常 | 多文件空格分隔 `path:"a.txt c.txt"` | 一次 `--only` 两路径；他批 staged 仍不混入 | AC-MA9-1 |
| T-MA9-3 | 边界 | `path:""` 与 `path:"   "` | 逐字错误串（上述）；**无提交产生**；改动仍 unstaged（未 `add -A`） | AC-MA9-2 |
| T-MA9-4 | 错误 | untracked 新文件 + `path` | `git commit failed:`（pathspec 不识未跟踪）；add 后可提（零偶发副作用） | AC-MA9-1 |
| T-MA9-5 | 边界（回归） | 无 `path` → `commit{message}` | 全量（含 untracked 与他批残留 staged）——既有语义零回归 | AC-MA9-3 |

**AC（机判）**：

- AC-MA9-1：T-MA9-1 / T-MA9-2 / T-MA9-4 绿（真 git 子进程——slow 归册）；
- AC-MA9-2：T-MA9-3 绿（空/空白 path 明确错误 + 零副作用）；
- AC-MA9-3：T-MA9-5 绿（零回归）+ 新档登记 `test/files.mjs`（不登记不跑）+ VSC 快层全绿 + 宽度零新增。

**边界**：不改 `add` / `rm` 等其他 action；不改 checkpoint / 快照子系统；不引入 `truncate`（本端输出形态保持）；**零 UI 面**。

**计数（D3）**：用例 5（T-MA9-1–5）· AC 3（AC-MA9-1–3）· 实施域 3 档（`git.mjs` + 新测档 + `test/files.mjs` 登记）。

## 12. 工具描述外部装载：25 档 `.md` 迁移（VSC-CONTEXT-PARITY 批——2026-09-11）

> 来源：批次档 `2026-09-11-VSC-CONTEXT-PARITY（本仓）` §1 条目 E4 / R4（用户 22:54
> 「会话体验差距」+ 裁定 1：权威源 = CLI 蓝图）。
> 需求 = `TOOLS（CLI 仓）` F7 / N9（逐条回指）；注入面与顺序 = VSC `AGENT-LOOP.md §17`。

### 12.1 问题（现状复核 as-of 2026-09-11）

- CLI：25 档 `src/tools/*.md`（合计 39,106 字符 ≈ 39.1KB——**计数更正 D3**：批次 §1 E4 「26 档」= 笔误，
  实测 25 档/25 工具）经 `src/tools/shared.mjs:12`（CLI 仓） `DESC()` 运行时装载，含 Routing / Notes 段
  （如 `read.md` 21 行含「不要用 bash cat」路由与 `repo_outline`/`code_search`/`lsp` 指向）。
- VSC：`src/tools/` 全 `.mjs`、零 `.md`；31 个 builtinTools 描述全为内联字符串，无 Routing/Notes 结构段；
  `tools/file.mjs:22-29` read 描述 7 行（CLI 21 行）；装载机制不存在（`DESC(` 零命中；`checklist.mjs:3`
  注释自述「DESC file-read replaced with inline description」= 施工期简化）。
- 后果：模型在 VSC 面拿到的路由/反模式信息系统性少于 CLI——工具选择与反模式规避面同族差。

### 12.2 方案选型

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 内联补全（不带 .md，直接扩写各 description 字符串） | 零新档/零装载面；但文本分散在 16 个 .mjs、更新与核对成本高；与 CLI 同族演进无对应面 | — | 否决 |
| 2 | **`.md` 外部装载（镜像 CLI 机制：25 档文件 + `DESC()`）** | 与 CLI 同构（装载语义同源）；文本单点可测可核；打包面已验（`.vscodeignore` 无 `*.md`；vsce 默认忽略表亦无 `*.md` 通配）；`shared.mjs` 406 行 +~14 行无压 | 25 新档 + 17 档接线〔实现后同步（2026-09-12）更正〕 | **选定** |
| 3 | 跨仓读取 CLI 的 .md（运行时引用他仓） | 违反零跨仓依赖；安装形态无该路径 | — | 否决 |

### 12.3 契约

**D-TD1 25 档落地**：`src/tools/` 新增 25 档 `.md`——文件名 = 工具名：`apply_patch` · `bash` · `checklist` ·
`delete` · `edit` · `execute` · `fetch` · `file_ops` · `get_current_time` · `git` · `glob` · `grep` ·
`hashline_edit` · `insert_after` · `lint` · `ls` · `lsp` · `process` · `question` · `read` · `read_image` ·
`tree` · `wait_for` · `websearch` · `write`。
文本 = 各端自持：以 CLI 同文件为语义底本（逐字拷贝），**须过「适用性核对」**——凡文中点名的工具/路径/命令
在本端不存在的行，按本端事实改述（改动逐处登记实现报告）。**不要求 byte-identical**；不加跨仓描述锚断言
（各端自持——多实现面纪律）。

**D-TD2 装载面**：`src/tools/shared.mjs` 新增 `DESC(name)`（CLI `shared.mjs:12` 同语义——`readFileSync` +
`join(__dirname, "<name>.md")`、无缓存、同步读；缺失即抛——fail-visible）；25 个工具定义改
`description: DESC("<name>")`——落点文件（准确行号实现自扫；字符串键控 = 各工具现 `description:` 块）：
`read_image.mjs` · `file.mjs`（read/write）· `file-edit.mjs`（edit）· `hashline-edit.mjs` · `more-file.mjs`
（insert_after/apply_patch/ls/delete）· `search.mjs`（glob/grep）· `shell.mjs` · `git.mjs` · `web.mjs`
（websearch/fetch）· `linter.mjs` · `lsp.mjs` · `execute.mjs` · `question.mjs` · `tree.mjs` ·
`wait_for.mjs` · `ops.mjs`（file_ops/process/get_current_time）· `checklist.mjs`（接线档合计 17）。
〔实现后同步（2026-09-12）：原表 `file.mjs`（read/write/edit）= 笔误——`edit` 宿主实测 = `file-edit.mjs`
（实现自扫；测试自注 `test/tool-descriptions.test.mjs:9`）。〕

**D-TD3 非迁移面（登记——本批零改）**：`repo_outline` · `code_search` · `doc_search` · `memory` ·
`context` · `focus` · `peer_instances` 7 工具保持内联（CLI 侧同族亦内联——`repomap.mjs:300` /
`memory/code-sync.mjs:354` / `memory/docs.mjs:172` / `peer-instances.mjs:220`；`context`/`focus` = 端特有）；
后续如需外部化另批设计。

### 12.4 受影响文件（as-of 2026-09-11）

| # | 文件 | 现 | 预计 | 动作 |
|---|---|---|---|---|
| 1–25 | `src/tools/<name>.md` ×25 | 新 | 合 ≈39K 字符（照 CLI） | D-TD1（新档） |
| 26 | `src/tools/shared.mjs` | 406 | ~420 | +DESC |
| 27 | `src/tools/file.mjs` | 136 | ~124（净减） | 2 工具接线（read/write） |
| 28 | `src/tools/file-edit.mjs` | 452 | 435（实测） | 1 工具接线（edit）〔实现后同步（2026-09-12）补列〕 |
| 29 | `src/tools/more-file.mjs` | 415 | ~385（净减） | 4 工具接线 |
| 30 | `src/tools/search.mjs` | 308 | ~285 | 2 |
| 31 | `src/tools/shell.mjs` | 326 | ~308 | 1 |
| 32 | `src/tools/git.mjs` | 402 | ~392 | 1 |
| 33 | `src/tools/web.mjs` | 146 | ~130 | 2 |
| 34 | `src/tools/linter.mjs` | 136 | ~125 | 1 |
| 35 | `src/tools/lsp.mjs` | 136 | ~125 | 1 |
| 36 | `src/tools/execute.mjs` | 222 | ~212 | 1 |
| 37 | `src/tools/question.mjs` | 71 | ~62 | 1 |
| 38 | `src/tools/tree.mjs` | 71 | ~62 | 1 |
| 39 | `src/tools/wait_for.mjs` | 198 | ~188 | 1 |
| 40 | `src/tools/ops.mjs` | 125 | ~105 | 3 |
| 41 | `src/tools/checklist.mjs` | 450 | ~440 | 1 |
| 42 | `src/tools/read_image.mjs` | 71 | ~62 | 1 |
| 43 | `src/tools/hashline-edit.mjs` | 114 | ~105 | 1 |
| 44 | `test/tool-descriptions.test.mjs` | 新 | ~120 | T-TD-2/T-TD-3 在役；T-TD-1/T-TD-4 已退场（整删——删除记录 = `TESTING.md` §8.1（`:202`–`:203`）） |
| 45 | `test/files.mjs` | 72 | 73 | 登记 |

（26–43 的「预计」= 净减方向估计（内联块移出 ~5–15 行/档）；越 500 硬帽停下报告。计数：实施域 = 25 新
+ 18 改 + 2 测档 = 45 档。）

**实现后同步（2026-09-12——交付实测态对齐）**：补 28 列（`file-edit.mjs`——`edit` 宿主；现 452（实现前）
→ 实测 435）+ `file.mjs` 动作 3→2；计数 44→45（25 新 + 18 改 + 2 测档——对齐实现自扫
`test/tool-descriptions.test.mjs:9/:63`）。

**行数拆分口径（修正轮 #6——同 `AGENT-LOOP.md` §12.4 同口径）**：`shared.mjs` 406 → ~420 **跨 300 行咨询
线**（≤500 硬限内）——本批增量 = `DESC()` 单函数；本批不拆分，**挂结构债候选**。

### 12.5 用例表

| # | 类型 | 输入 | 预期输出（断言） | 需求 |
|---|---|---|---|---|
| T-TD-1 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:202`）） | F7 |
| T-TD-2 | 边界 | 每档文件存在性 | `src/tools/*.md` 25 档在位；`read.md` 含 Routing 段与 `repo_outline`/`code_search`/`lsp` 指向句——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1） | F7 |
| T-TD-3 | 错误 | 迁出后文件面 | 17 档工具文件对已迁 25 工具的内联描述块零残留（**全量**——17 档 / 25 工具逐档扫描，非抽样；修正轮 #3；实现后同步（2026-09-12）档数更正）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；现体 = 工具级 description 计数 == 25 | F7 |
| T-TD-4 | 边界 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:203`）） | N9 |

### 12.6 验收标准

| AC | 判据 | 回指 |
|---|---|---|
| AC-TD-1 | T-TD-2/T-TD-3 绿（T-TD-1 已退场——整删，删除记录 = `TESTING.md` §8.1（`:202`）） + `node test/run-fast.mjs` 全绿（新档登记） | F7 |
| AC-TD-2 | T-TD-4 已退场（整删——删除记录 = `TESTING.md` §8.1（`:203`））+ `description: DESC(` 命中 25 处（grep 点数）+ **N9 落点 = 发布前清单核对**（`npx @vscode/vsce ls`（或打包后 `unzip -l <vsix>`）输出含 `src/tools/*.md` 25 档在位——打包忽略表实效核对；修正轮 #3） | F7/N9 |
| AC-TD-3 | 行数实测对表（§12.4）+ `check-doc-width` 新增违规 0 | — |

### 12.7 边界

- 不做非迁移 7 工具的文本重构（D-TD3）；不加跨仓描述锚断言/同步脚本；不改工具 schema/参数/执行逻辑；
- 不改 CLI 侧 `.md`；不做多语言（本端描述语言 = 英文，与 CLI 同）。

**计数（D3）**：实施域 45 = 25 新（.md）+ 2 测档（`test/tool-descriptions.test.mjs` 新 + `test/files.mjs` 登记）+ 18 改（含 `file-edit.mjs`）· 用例 4（编号 T-TD-1~4；在役 2——T-TD-1/T-TD-4 已退场，删除记录 = `TESTING.md` §8.1（`:202`–`:203`））· AC 3（AC-TD-1~3）——修正轮 #9 对齐 §12.4 表；实现后同步（2026-09-12）更正 44→45（`edit` 宿主更正 + 补列）。

## 变更记录（历史折叠——详见 git log）

- 2026-09-12（VSC-CONTEXT-PARITY 批·实现后同步——交付实测态对齐）：§12.2 接线档数 16→17 · §12.3 D-TD2 落点更正（`edit` 宿主 = `file-edit.mjs`，非 `file.mjs`）· §12.4 补列 `file-edit.mjs` + 计数 44→45（25 新 + 18 改 + 2 测档）· §12.5 T-TD-3 档数 16→17 · §12.7 计数同步。纯落点与计数更正、零语义。
- 2026-09-11：新增 §12（工具描述 25 档 `.md` 迁移——VSC-CONTEXT-PARITY 批 R4）。
- 2026-09-11（修正轮——设计评审轮次 1 #3/#6/#9 落修）：T-TD-3 改全量断言（16 档/25 工具，非抽样）；AC-TD-2 补 N9 发布前清单核对落点（`vsce ls`）；§12.4 计数对齐 44（补 `test/files.mjs`）+ `shared.mjs` 结构债候选注。纯口径与落点登记、零语义。
- 2026-09-11：群 A 批（VSC-MIRROR-SWEEP）——新增 §11（git commit `--only` 镜像——双层混扫缺口闭源）。

- 2026-09-08：从 ARCHITECTURE §7 迁出成立本档——写全 VSC 独立实现（builtinTools 清单核对
  src/tools/index.mjs；VS 适配/装配/审批照抄 §7 + setup.mjs/execute-tools.mjs/permission-gate
  核实），去 CLI 镜像指针。
- 2026-09-11（第 12 批——settings 形状面残留）：`_SIBLING_SHAPES` 补第 4 条 `agent.subagentModels`
  （roleMap 形态——镜像 CLI 面 W3（第 8 批待裁定项「`agent.subagentModels` 同族」——该批 CLI 面落地、VSC 面本批补））；
  计数同步（上文 3 键 → 4 键）；设计见 VSC 仓 ADVISOR-CONVERGENCE §13。
