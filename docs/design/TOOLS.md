# 工具系统设计

> 权威源：thincoder/src/tools/ + src/agent-tools/ + src/mcp/。本文档描述工具系统的**当前设计**——工具如何暴露给模型、如何安全工作、如何调度。跨文档已接管的主题只留指针，不复制。
> 关联权威：`AGENT-LOOP.md`（调度/审批/question 抑制）、`SESSION.md`（read_history）、`MCP.md`（MCP 客户端）、`CHECKPOINT.md`（快照）、`EDIT-TOOL-EOL-DESIGN.md`（编辑工具 EOL 语义）、`PROVIDER.md`（模型上下文配置）、`TOOL-OUTPUT-LIMITS-*.md`（输出落盘阈值）。

## 1. 总览

工具系统是 agent 与外部世界（文件/命令/网络/git/MCP/项目状态）交互的**唯一通道**：

- **能做什么**：以统一 OpenAI function-calling schema 暴露给模型（`toOpenAISchema`，shared.mjs）；
- **怎么安全做**：收口到工具内部——安全哲学 = **信任模型 + 审批门控 + 快照**（非文本拦截）；
- **何时做**：调度层两段式（只读并行、副作用串行）。

**工具分类**：内置工具（25 个，builtinTools）+ 元工具（agent-tools，纪律工具）+ MCP 展开工具（动态并入 builtinTools）。

**统一契约**：`{ name, description, parameters, readonly?, sideEffectExempt?, parallel?, multimodal?, execute(args, ctx) → string }`；`ctx = { cwd, agent, depth, signal, callbacks, onOutput, onQuestion, onPermissionRequest }`。execute 必须返回字符串（undefined 视为错误，dispatch 显式检查）。

## 2. 注册与 schema

- **内置工具 25 个**（tools/index.mjs builtinTools）：
  - file 6：read / write / edit / insert_after / hashline_edit / read_image
  - patch 2：apply_patch / delete
  - system 4：bash / glob / grep / ls
  - web 2：websearch / fetch
  - git 2：git / question
  - 其余：checklist / lint / lsp / execute / tree / ops 4（file_ops / process / get_current_time / wait_for）
  - （read_pdf 已移除——R21；sleep 已删——见 wait_for）
- **元工具**（agent-tools.mjs）：task / plan / goal / verify / subagent / skill / recent_changes / advisor / eng / timer / read_history / consult_start / consult_stop——readonly 自管纪律工具；子代理按 role 过滤（explore/plan 只读，eng-coder 额外门控）。read_history 语义权威 = SESSION.md §9/§13。
- **schema 生成**：`toOpenAISchema(tool)`——name/description/parameters 转 OpenAI function 格式。description 来源：CLI 用 `tools/*.md`（`DESC()` 机制，md 文件即描述源）；VS Code 用 `.mjs` 内嵌描述。md/内嵌描述给模型完整使用手册（含参数说明、路由、反模式），非一行字符串。

## 3. 上下文与生命周期

- **ctx 字段**：cwd / agent / depth / signal / callbacks / onOutput / onQuestion / onPermissionRequest。
- **undo 快照**：副作用工具执行前 `snapshotForUndo`（写前文件内容入内存栈），`/undo` 回滚。
- **hooks**：PreToolUse / PostToolUse / PostToolUseFailure 用户脚本在 `~/.thincoder/hooks/`（PreToolUse 返回 false 阻断执行）。
- **dispatch console 回显**：工具执行期间的 console 输出回显到结果（调试价值）——调度细节权威 = AGENT-LOOP.md §4。

## 4. 安全边界

安全哲学：**信任模型 + 审批门控 + 快照为真实防线**；文本匹配拦截被否定（"安全剧场"——恶意模型必然绕过，拦住的多是正常操作）。

| 面 | 当前机制 |
|---|---|
| 路径 | **无边界解析**（2026-09-02 取代 resolveInCwd 双重断言）：相对路径相对 cwd 解析、绝对路径原样解析、符号链接正常跟随；无目录限制。信任模型 + 权限门禁为唯一防线 |
| 命令 | **零文本拦截（彻底）**：破坏性命令（rm -rf 等）一律放行，走审批 + 快照。保留 `detectDanger` 危险标注（只给人看红标，不拦截：recursive-delete/sudo/pipe-to-shell/dd/mkfs/raw-device/chmod-777/fork-bomb，引号感知防 commit message 误标）。bash 超时 120s |
| 网络 | `isPrivateHost`（localhost/内网/云元数据 169.254.169.254）SSRF 防护；响应体 ≤5MB；HTML 转文本（stripTags/htmlToText） |
| 文件 | MAX_READ_LINES=2000、MAX_OUTPUT_CHARS=200_000（超限落盘，模型见预览）；normalizeEOL（CRLF 统一）；write 前 autoSyntaxCheck（JS 文件自动 node --check） |
| lint | node --check fast path + 语言级联（tsc/ruff/cargo/go vet）；eslint 级联已删（2026-09-02，零依赖），`scripts/check-syntax.mjs` 替代 |
| lsp | 按需 spawn LSP server（process.execPath 直跑，无 shell），语义级诊断/跳转兜底 |

**execute 边界**：纯净 node ESM 子进程，与 bash 同边界——顶层 await / 动态 `import()` / `require()` / `console` / `fetch` / `process` 全可用；**无 import 阻断、无 require 禁、无目录限制、无伪沙箱、无预置全局**（exec-prelude 已退役）。文件能力唯一入口 = 专用工具。超时 SIGKILL 强杀（默认 30s，上限 600s）。

## 5. 调度与权限

调度两段式详情权威 = **AGENT-LOOP.md §4**，此处只列工具标记语义：

- readonly = 无副作用可并行；
- `parallel: true` = 显式声明可并行（grep/glob）；
- sideEffectExempt = 有副作用但豁免于"失效 advisor/verify"追踪（subagent）；
- 审批门控：破坏性动作（delete/外发/快照类）走 onPermissionRequest（autoApprove 短路 / 批量确认）。

## 6. 编辑工具语义（合并 edit 族）

> EOL 语义（detectFileEol/joinWithEol/majorityEol/findCandidates/U+FFFD）权威 = EDIT-TOOL-EOL-DESIGN.md，此处不复制。

### 6.1 edit

**语义 = patch/diff 心智**：`old_string` = 变化区当前内容（精确存在且单次匹配）；`new_string` = 该区期望结果。判定在 normalize(LF) 域做行级 LCS diff（公共行保留、old 独有删、new 独有插）。

**判定序**：
1. **分支 0（就地替换）**：old 恰单行 ∧ new 恰单行 ∧ 全文唯一匹配 ∧ new 非空 → 就地整行替换（行数不变）。
2. **零重叠**（old 每行都不在 new）：按插入——new 插在 old 末行后，旧内容保留。
3. **一般 LCS diff**。
4. **平凡**：new 与 old 行级全等 → 原样替换（no-op 成功）。

**约束**：
- 空 new_string = 纯删除意图 → **显式错误**（提示须带保留上下文行；单行替换永不成删除，防删除保护先于分支 0）。
- replace_all：每处 old→new **字面替换**（不做插入/分支 0）；多匹配无 replace_all → occurrences 错误。
- edits 数组：`edit({path, old_string, new_string})` 单形态 或 `{edits:[...]}`；顶层 path + edits 合法（顶层 path = 无自带 path 条目的默认，条目自带 path 优先）；edits 与顶层 old/new 互斥；同文件多条**串行累积**、跨 path 并行、**全判后原子写**（任一失败全不写）。
- 行数上限：old/new 各 ≤1000（超限报 "edit region too large"）。
- not-found 引导：错误含 `searched:` + grep 建议 + `similar lines (top 3, score)` 段（LCS 连续子串 / 阈 0.5 / top3，单行也覆盖；零候选省略）。
- 空白自动落点：逐字 occurrences=0 时按行 trim() 等价的**唯一窗口**自动应用（附 note）；多窗口歧义仍 not-found（不猜）。

**实现单一权威**：CLI `src/tools/edit-diff.mjs` 导出 `applyPatchLines` / `computeEditEntry` / `validateEditEntry` / `assertEditArgsExclusive`；本地单形态 / edit-batch / ACP 桥三通道共用；VS Code 镜像 edit-diff.mjs。

### 6.2 insert_after

- **精确判定**：写入工具记录受影响区 `lastWrite={type,startLine,shift}`；`after_line` 在未受影响区（≤startLine）→ 允许；受影响区内 → 拒绝（错误含 "was modified since your last read"）；write 全文重写 → 任何 after_line 拒绝。read 清 dirty + 写快照。（vscode 端无 dirty 机制。）
- 适用 add new line：checklist 条目/文档行/标题/散文行/函数/import/block——不必编造上下文做 edit。

### 6.3 hashline_edit

哈希行定位（new_content 中无的旧行被删）；错误 `Hash sequence not found` 补引导"for fresh hashes, re-read the file with hashes=true"。替换文本指向行由哈希确定。

### 6.4 apply_patch

- **无坐标 hunk 宽容**：裸 `@@` hunk 若上下文行 <2 且含 ≥1 `-` 行 → 定位锚 = hunk 内匹配行序列（空格上下文 + `-` 行按出现序）连续；唯一序列匹配即应用（`-` 后随 `+` = 替换、无 `+` = 删除）；0/1 上下文同待遇。多匹配 → 报错（matches N locations）；纯 `+` 零上下文（无 `-` 锚）仍拒（位置不明）；上下文 ≥2 走既有路径。
- **文件头容缺**：`--- a/<path>`（或 `--- b/`）后直接跟 hunk → 接受（newPath = oldPath）；`--- /dev/null` 缺 `+++ b/<path>` → 仍拒并特报（新文件名不可推导）；`-- x` 内容删行不误判文件头；多文件补丁完整/容缺可混合；空段过滤（不虚报 touchedPaths）。
- 标准坐标格式 `@@ -old,count +new,count @@` 不变，两格式并存；hunk 体 `-`/`+` 行语义不变。

### 6.5 write / read

- **write**：整文件替换——描述明示"read it first——小改动用 edit/insert_after"；write 前 autoSyntaxCheck。
- **read**：filePath 伪 alias（`args.path ?? args.filePath`）；read 同时清 dirty + 写快照。

## 7. 逐工具契约

- **git**：action 集 32（add/commit/push/tag/branch/checkout/restore/stash/fetch/pull/reset/revert/merge/cherry-pick + F7 的 clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv）。破坏性动作（reset --hard / checkout 丢改动 / rm / clean / rebase 有未提交时）**先快照再执行 + 确认**，从不拦截（gitGuardSnapshot）；快照为全量副本（CHECKPOINT.md 权威）。status 用 runGitRaw 保行前导空格（防 porcelain 误分类）。反向路由：git.md 含 "Route to git instead of bash" + discipline.md Tool routing。
- **checklist**：mark 支持 `id` 优先于 index（index 降级 fallback）；无显式 ID 历史条目 parse 时一次性分配落盘；nextRootId 扫 checklist.md + checklist-done.md（归档 ID 恒占位不复用）；前缀归一剥所有连续 `T[\d.]+:`；父 done 须子树全 done，递归归档整棵子树。
- **execute**：`code`（inline ESM）与 `scriptFile` 二选一必填；nodeArgs 禁 `--eval`/`--inspect` 类；scriptFile 可指向 workspace 外；超时默认 30s / 上限 600s，超时错误含重试引导。
- **glob**：`{a,b}` brace 展开为 `(?:a|b)`；`!` 排除前缀（多模式 include !exclude）；不支持语法（`?(x)`/`@(a|b)`/`+(x)`/空/未闭合 brace）显式英文报错（不静默漏匹配）。
- **wait_for**：条件等待（非 sleep）——`{condition, interval_ms?, timeout_ms?}`；条件语义化（advisor settled / subagent id:N done / consult done / file exists / port open）；未知条件显式报错。readonly；timeout 默认 30s（config agent.waitForTimeoutMs 覆盖，cap 600s）；interval 默认 1s 下限 100ms；唯一非即时返回工具。等待用 wait_for，同步工具后不需要等待。
- **timer**：默认 180s，seconds 可选。
- **task**：状态别名归一（completed/finished/…）+ warning；跨会话/项目级用 checklist（描述含路由）。
- **verify**：参数 `testNamePattern`（旧名 `filter` 不再接受）。语义见独立设计文档（Verify 重构）。
- **read_image**：视觉模型读图；非视觉模型拒绝/占位（防 image_url 毒化会话）；svg 返回文本源码、bmp 拒绝并提示转 PNG。
- **websearch/fetch**：网络边界见 §4；fetch 失败错误含 proxy 提示。
- **process / file_ops / get_current_time / tree / lsp / lint / delete / bash**：按各自描述契约。

## 8. MCP

MCP 工具**动态展开**为独立原生工具（`{server}_{tool}` 前缀、完整 inputSchema、execute→tools/call），并入 builtinTools 走统一 schema；网关式 `mcp` 工具已废弃。机制权威 = **MCP.md**。

## 9. 关键设计决策

- **md 文件即 description**：长描述模型才理解边界；代码/描述分离便于迭代不触发 schema 变更。
- **bash 命令零文本拦截** = "安全剧场"论证：文本匹配拦不住恶意模型（空白/heredoc/node -e 绕过），只误伤正常操作；真实防线 = 审批层 + 快照；detectDanger 只给人看不构成边界。
- **超限落盘而非截断**：模型可再 read 全量，预览够决策。
- **工具全部字符串返回**：schema 简单、dispatch 统一、流式展示统一。
- （历史）"沙箱只出不进"：exec-prelude 退役后 execute 与 bash 同边界，文件能力唯一入口 = 工具授权。

## 10. 工具描述写作六要素

工具描述（md/内嵌）必含六要素，缺一补一：
1. **一句话语义**——能做什么/不能做什么；
2. **参数关系**——参数间约束；
3. **路由/反模式**——何时用别的工具（"Route to X instead of bash"）、何时不该用本工具；
4. **副作用与权限**——破坏性/外发/需确认标注；
5. **错误形态**——失败时返回什么、如何引导；
6. **多端一致**——CLI/VS Code 描述同语义（逐字锚走 review 流程）。
