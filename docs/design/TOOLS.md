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
| 文件 | `read`/`write`/`edit`/`hashline_edit`（file.mjs + file-edit.mjs）、`insert_after`/`apply_patch`/`ls`/`delete`（more-file.mjs） |
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
  写豁免仅限 onPermissionRequest 阶段；JSON 解析/未知工具/planMode/design-token 前置门先
  行且原样生效。
- **Stop 释放挂起门**：permission 挂起的回合被 abort → resolve(false)/deny，循环不悬挂。

## 9. 逐工具契约要点

- **git**：action 集含破坏性动作（reset --hard/checkout 丢改动/rm/clean/rebase 有未提交）
  先快照（gitGuardSnapshot）再执行 + 确认；`runGit` 读路径 CLI parity。
- **checklist**：mark 支持 id 优先于 index；前缀归一；父 done 须子树全 done 递归归档。
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
- **bash 命令零文本拦截** = "安全剧场"论证：文本匹配拦不住恶意模型，只误伤正常操作；真实
  防线 = 审批层 + 快照；`detectDanger` 只给人看红标。
- **超限落盘而非截断**：模型可再 read 全量，预览够决策。
- **工具全部字符串返回**：schema 简单、dispatch 统一、流式展示统一。
- **live autoApprove**：VS agent 是 per-run 对象、无 CLI 的 `parent.autoApprove` 字段——
  会话槽位 + live getter 承载（§8）。

## 变更记录（历史折叠——详见 git log）

- 2026-09-08：从 ARCHITECTURE §7 迁出成立本档——写全 VSC 独立实现（builtinTools 清单核对
  src/tools/index.mjs；VS 适配/装配/审批照抄 §7 + setup.mjs/execute-tools.mjs/permission-gate
  核实），去 CLI 镜像指针。
