# 记忆系统设计（MEMORY）

> 板块：记忆。权威源：`thincoder/src/memory/`（schema/core/code-index/code-sync/docs）+ `src/memory.mjs`（hub 导出）。本文档描述**当前设计**——三层记忆 + 代码/文档向量索引，`node:sqlite` 单文件存储（零依赖）。
> 跨文档已接管的主题只留指针：工具调度/审批 → `AGENT-LOOP.md`；会话消息历史检索（read_history，非记忆）→ `SESSION.md`；checkpoint/undo 快照 → `CHECKPOINT.md`。
> 状态：**当前态**（2026-09 整理）。历史变更流水账折叠见文末「变更记录」。

## 1. 总览与目标

记忆系统让 agent 跨会话保存、检索、治理三类知识——个人记忆、项目共享记忆、团队共享记忆——并同时提供**代码/文档索引**（code/doc chunk），使 `memory` / `code_search` / `doc_search` / `repo_outline` 得以在当前代码库内检索。

- **存储统一单文件**：`~/.thincoder/memory.db`（`node:sqlite`，FTS5 虚表 + BM25 排序 + 向量 BLOB，零第三方依赖）。
- **三层记忆**（写入时指定 layer）：personal（纯 DB 行）/ project（项目 markdown 文件为源，DB 为索引）/ team（git 仓库同步）。
- **双路检索**：FTS5（含 CJK 逐字分段）+ 向量余弦（懒构建，失败静默降级纯 FTS）。
- **磁盘为真相**（project/team 层）：markdown 文件即知识本体，可人工编辑、可 git 管理；DB 只是可重建索引。
- **单一 agent 工具面**：`memory` 单工具、`action` 路由五动作（search/put/list/delete/clear）——旧 memory_put/search/delete 三个裸工具已合并退役。

`~/.thincoder/memory.db` 与 `{cwd}/.thincoder/memory/` 的默认位置定义于 `src/config.mjs` 的 `config.memory` 段（`dbPath` / `projectDir` / `team`），可在 `~/.thincoder/config.json` 覆盖。

## 2. 存储与分层

**DB**：`~/.thincoder/memory.db`（默认）。`node:sqlite` 打开时设 `PRAGMA journal_mode = WAL`（读写不互相阻塞，检索与后台索引可并发）与 `PRAGMA busy_timeout = 3000`（多进程同库防 SQLITE_BUSY）。

**schema 版本**：`SCHEMA_VERSION = 9`，经 `PRAGMA user_version` 递进迁移（单事务，任一失败整体回滚，不残留半成品）。表：

| 表 | 内容 | FTS5 虚表 | embedding |
|---|---|---|---|
| `entries` | personal 层条目行（纯 DB，无 md 文件） | `entries_fts` | BLOB 列（v4 起） |
| `files` | project/team 层 md 文件的索引行 | `files_fts` | BLOB 列（v3 起） |
| `code_chunks` | 代码分块 | `code_chunks_fts` | BLOB 列 |
| `doc_chunks` | 文档分块（md/txt 等） | `doc_chunks_fts` | BLOB 列 |
| `meta` | 嵌入模型键 / last_indexed_commit 锚 | — | — |

所有 FTS 虚表由 `*_ai/_ad/_au` 行触发器自动同步（增删改即时）；**embedding 是各表随行 BLOB 列，行删即向量随行删除，无独立 vectors 表**（v4 起取代早期"独立向量表"设计——见 §7 决策与文末变更）。

**三层**（写入时指定 layer）：

- **personal**——个人记忆，**纯 `entries` 行**，无 markdown 目录；检索/清理经行触发器随行完成。
- **project**——项目共享，`{cwd}/.thincoder/memory/` 目录，**markdown 文件为源、DB 为索引**；`putMarkdown` 写文件 + 立即索引，`syncDir` 按目录增量入 DB（按 mtime）。文件可人工编辑、可 git 管理。project 层写文件**不做** git 操作（用户的 repo 不被自动提交）。
- **team**——团队层，git 仓库同步（`git/gitmem.mjs`）。`commitAndPush` 写文件后 `git add/commit/push`（push 失败先 `pull --rebase` 再重试一次；真冲突 `rebase --abort` 保持仓库干净并抛带人工解决指引的错误）。`pullTeam` 拉取远程。

**条目类型**：`rule | knowledge | decision | pattern`（四类，`VALID_TYPES`，检索/展示区分；非法 type 明确报错）。

**uid 格式**：`personal:<n>` / `project:<origin>:<path>` / `team:<origin>:<path>`。uid 的 path 段按**最后一个 `:`** 切取——Windows 盘符 origin（如 `project:C:\dir:file.md`）使朴素 `:` 切分失效；兼容旧 `project::file.md` 空 origin 形态。

### 2.1 markdown 文件即真相

- `putMarkdown(memory, { layer, dir, type, title, content, tags, author })`——写 md 文件（`serializeEntry`）后立即 `indexMarkdownFile`，返回文件名。project 不碰 git；team 由调用方走 gitmem。
- `syncDir(memory, { layer, dir })`——扫描目录：新增/按 mtime 变更的条目重索引，**消失条目从索引删除**（"vanished entries are removed from the index"）；损坏/解析失败文件跳过并记错。返回 `{added, updated, removed, skipped}`。
- `indexMarkdownFile`——单个 md 解析（`parseEntry` 读 frontmatter type/title/tags/author）后 UPSERT 进 `files` 表。
- DB 只是可重建索引：删掉 DB 后重新 `syncDir` 可重建 project/team 层（personal 层纯 DB，重建需经 git/备份）。

## 3. 检索（core.mjs search + codeSearch/docSearch）

**双路召回 + RRF 合并**：`search(memory, query, {limit})` 返回 `[{ layer, type, title, content, tags, id, rrf }]`（条目经 `fetchEntry` 拉全文，合并分存 `rrf`）。

1. **FTS5 通道**——`buildFtsQuery(query)`：按空白/标点切成 token（截断 `FTS_TOKEN_MAX=16`），再对每个 token 做 CJK 分段，非空 token 以 `"…" OR …` 连接（逐字短语保持邻接精确匹配）。
2. **向量通道**——`ensureEmbeddings` 懒构建：首次检索时批量嵌入存量（`EMBED_BATCH_SIZE=256`），增量条目单独嵌；嵌入模型变更时清空四表向量重建。候选 cosine 取 top（窗口 `max(limit*4, 20)`）。
3. **RRF(k=60) 合并去重**——FTS 优先、向量补齐；按合并分排序取 `limit`。

**CJK 分段**（`segmentCJK`）：FTS5 unicode61 无中文分词器，将汉字/假名/谚文逐字以空格分隔；**写入与查询两侧用同一处理**才可召回（两字词如"分号"→"分 号"短语仍命中；ASCII 保持整词）。schema.mjs v2 重建 FTS 为该方案落地。

**失败静默降级**：无嵌入 key / 嵌入调用失败 → 回退**纯 FTS**（检索不阻塞、不报错，console 记一条降级日志）。纯 FTS 下 `docSearch`/`codeSearch` 的 ftsQuery 为空且无 embedder 时返回 `[]`。

**scope 限定**：search 检索面 = personal + project（当前 context 项目 origin）+ team 全 origin。`memory.projectOrigin` 存在时，files/向量候选只取 `layer='team' OR origin = projectOrigin`（其他项目的行不进当前搜索）。

**输出契约（action search）**：命中行 `[<layer>][<type>] <title> (id=<uid>)` + 换行 + 内容；无命中 / 空 query → `(no matching memories)`。空 query（含纯空白）两端**短路**——直接返回空文案，不触发检索（VS Code 端同文案 `No matching memories found.`）。

**检索工具**（同构双路，均 readonly）：`codeSearch`/`docSearch` 限定 `{kind: code|doc|memory}`，返回 `{file, startLine, endLine, snippet, score}`，暴露为 `code_search` / `doc_search`（见 §4/§5 主循环注入）。会话消息历史**不在记忆**——检索会话历史用 `read_history`（SESSION.md 权威）。

## 4. 代码/文档索引

**存储位置**：代码/doc 分块同样落在 `~/.thincoder/memory.db` 的 `code_chunks` / `doc_chunks` 表（FTS5 + embedding BLOB），不是独立目录/文件。chunk 行含 `{origin(项目根), path, language, content, line_start, line_end, mtime_ms, embedding}`；`origin` 区分多项目（v8 起）。

**文件清单与跳过**：`listProjectFiles` 用 `git ls-files --cached --others --exclude-standard`（git 仓库内，尊重 .gitignore，非 git 仓库返回空）；按扩展名过滤（`CODE_EXTS` / `DOC_EXTS`）；跳过 `SKIP_DIRS`（node_modules/.git/dist/build/coverage/系统目录等）与点目录；超大文件跳过（代码 >1MB、文档 >512KB）。

**同步策略**（code-sync.mjs）：

- **git diff 增量优先**——`gitSync`：比对 `last_indexed_commit`（`meta` 键，`markIndexedCommit` 写入）与当前 HEAD 的 `git diff --name-only --diff-filter=ACMRTD` + dirty 工作区，只重索引改动文件（比全扫快一个量级）。改动数超 `DIFF_FULL_SYNC_THRESHOLD=200` 则回退全量同步并更新锚。每 tick `yieldTick` 让出事件循环。失败数 = 0 才推进 commit 锚。
- **全量扫描兜底**——`codeSync`（按 mtime 跳过未变文件 + 收尾删 stale）+ `docSync`（doc_chunks，`onProgress` 上报阶段计数），均 `markIndexedCommit` 记基线；非 git / 首次 / diff 过大走此路径。`/reindex` 命令（cmd-reindex.mjs）清空三表后全量重建。
- **单文件增量**——`reindexFile(memory, cwd, absPath)`：**write/edit/delete 工具执行后由主循环后台调用**（record-results.mjs `FILE_MUTATORS` 钩子，fire-and-forget，不阻塞 agent 循环；失败注入 `[System reminder: background indexing failed ...]` 待办提醒不阻塞）。只重建该路径 chunk；路径越出 cwd / 命中跳过目录 / 超大 / 无法 stat 时跳过或删 stale chunk。

**分块**（code-index.mjs）：

- **代码**——`chunkCode`：小文件（`lines.length <= BIG_FILE_LINES = 2000`）单 chunk；大文件按**顶层符号边界**切（`code-index.mjs` 的 `extractSymbols` 正则提取 JS/TS function/class/const 导出；`extractPySymbols` 提取 Python def/class），符号间内容并入前一个符号 chunk；每 chunk 前并其 JSDoc/docstring 以提升检索质量。chunk 类型 `file`（整文件）或 `symbol`。
- **文档**——`chunkMarkdown`：按 `#{1,4}` 标题切块，每 chunk heading = `${filepath} > <标题文本>`（单级前缀，不累积嵌套子标题）。

**doc 索引同步**（docs.mjs `docSync`）：扫描 `*.md/.mdc/.txt/.rst/.adoc` → 分块 → upsert doc_chunks（mtime 增量）。

**检索实现**（`codeSearch`/`docSearch`）：FTS 候选（`bm25` rank，窗口 `max(limit*4,20)`）→ 向量 cosine 重排 → RRF 合并取 `limit`。返回 chunk 带 `_score`。`repo_outline` 工具复用 `code_chunks` 的 path 清单生成文件依赖大纲。

## 5. 主循环集成与门禁

- **工具暴露**：`memory`（memoryTools，§6）+ `code_search` / `doc_search`（readonly 检索）+ `repo_outline`（复用 code_chunks）。
- **启动**：`make-agent.mjs` `createMemory` 开库并迁移；`syncDir` project 层 `.thincoder/memory/`；`startup.mjs` 启动时 `gitSync`（失败回退 `codeSync`/`docSync`）异步建代码/doc 索引。
- **search 结果注入**：`doc_search`/`memory search` 结果按需注入 system 上下文（`<untrusted_memory>` 包裹——agent 提示词中不可信内容区）。
- **`put` 自动嵌入选块**：新条目写 DB 后，`ensureEmbeddings` 若嵌入器可用则异步补向量（不阻塞写入）；每次嵌入批次后顺带回填 code/doc chunks 向量。
- **门禁**：`search`/`list` 只读，放行 / 免权限询问；`put` 侧效门；批量 delete / clear = `confirm:true` + scope 门禁（**confirm 参数即门禁**——直接删裁定，无第二层人类确认）。
- **只读子代理工具集过滤**（藏于历史、现行为）：`explore`/`plan`/`consult` 只读子代理按**工具级 readonly** 过滤工具表。memory 工具 `readonly:false`（工具级），故从这些子代理的工具表消失——它们不再能 `memory search`（此前的 memory_search 工具级 readonly:true 在内）；动作级只读分类只覆盖 dispatch 门位，不覆盖子代理工具集过滤。

## 6. memory 工具契约（单工具五动作）

**单一 agent 工具** `memory`，`action` 枚举 `["search", "put", "list", "delete", "clear"]`，参数按 action 分支；工具级 `readonly:false`。action 枚举 / 参数形态 / 描述文本在 CLI `src/memory/docs.mjs`（`MEMORY_TOOL_DESCRIPTION`）与 VS Code 镜像同源逐字一致（byte-identical 边界）。

**scope 值域按端**：CLI personal/project/team；VS Code 无 team（收到 team 明确拒绝并指引 CLI）。action 侧缺省/必填——`put` 缺省 personal；`search`/`list` 缺省搜全部层；`delete`/`clear` 必填 scope。

### 6.1 五动作

- **search**（只读）——`{query, scope?, limit?}`：自然语言查；limit 默认 5。输出带 id（`[layer][type] title (id=uid)`）。空 query 短路（§3）。
- **put**——`{type, title, content, tags?, scope?}`：type 限 rule/knowledge/decision/pattern；写 personal（纯 DB 行）或 project/team（putMarkdown）。project/team 输出带完整 uid（`personal:<n>` / `project|team:<origin>:<path>`，与 delete 接受的 id 一致）。
- **list**（只读）——`{scope?, type?, keyword?, limit?}`：过滤输出紧凑清单，**不拉全文**；limit 默认 50。
- **delete**——单条形态 `{id, scope}`（§6.2 deleteByUid）+ **条件批量形态** `{scope, type 和/或 keyword, confirm:true}`（§6.3 磁盘真相）。
- **clear**——`{scope:"personal", confirm:true}` 清空 personal 全部；scope 必填且仅接受 personal，project/team 明确拒绝（`shared layers don't support clear — use delete with type/keyword batch filters instead`）。

**list/批量删的 origin 限定**（藏于历史、现行为）：CLI `files` 层行（list + 批量 delete）按**当前上下文目录**（projectDir/team dir）过滤——其他项目/团队克隆的存量行不进入 list/批量删（工具只能动它能定位的文件）；单条 delete 仍按 uid 全语义；team scope 的 search 仍全 origin（检索面不变）。

### 6.2 deleteByUid 路由（core.mjs）

按 uid 精确删除单条，返回被删条目 `{ id, layer, type, title, content, tags }`（删除前 `fetchEntry` 读取；缺文件退 path 段查 files 行，再退 `parseEntry` 磁盘重建）。

- **personal**：`personal:<n>`（**裸数字 `<n>` 自动解析为 personal:<n>**——CLI `memory remove` 命令既有兼容路径）→ `DELETE FROM entries` 行；FTS 由 `entries_ad` 触发器同步，embedding BLOB 随行删除，零残留。
- **project/team**：`project:<origin>:<path>` / `team:<origin>:<path>` → 删除 markdown 文件 + `syncDir` 清索引（"vanished entries are removed from the index"）——**不手删 files 行**（syncDir 单源）。
- **路径包含校验**（`assertPathInside`）：resolve 后路径必须仍在 layer 目录内；`..`/绝对路径（含 Windows 反斜杠变体 `..\`——分隔符无关校验，normalize 后前缀检查）拒绝。
- **ENOENT 容错**：文件已缺视为已删继续（不中断），仍 `syncDir` 清索引行。
- **team 删除语义**：本地删 + syncDir 清索引，**不做 git 提交/推送**（git 传播是 gitmem 职责；删除可逆性优先——工具误删不自动推全团队，git 工具可恢复）。注明：team 记忆经 gitmem 拉取同步时，下次拉取可能复活已删文件（远端未删）——远端删除需经 git 工具。
- **CLI `memory remove` 命令**：底层 `remove()` 收敛为 deleteByUid 兼容壳（boolean 语义保留）——命令行与工具**同一路由**，避免两套行为漂移；裸数字 id 兼容保留。
- **错误**：不存在 → `memory <uid> not found in scope <scope>`；id 前缀与 scope 不匹配 → 拒绝（见 §6.4 逐字）。

- **layer === scope 概念统一（2026-09-08 用户指出——"不看源代码谁知道 layer=scope？"；**用户裁定：全统一成 layer**）**：memory 三层（personal/project/team）代码里**两个词混用**——核心层 core.mjs 用 `layer`（DB 列名 + 结果字段 `r.layer` + deleteByUid 从 uid 前缀拆 layer——85 处），工具层参数用 `scope`（search/list/delete 的 scope 参数——docs.mjs 10 处）。模型看到 search 结果带 `[layer]` 标签、delete 却要 `scope` 参数——命名分裂让模型困惑。**修复（裁定：全统一成 layer——scope 参数改名 layer）**：①工具层参数 `scope` → `layer`（docs.mjs 10 处——search/list/delete 的 scope 参数改名 layer——与结果字段/DB 列一致）；②**工具描述 scope → layer**（MEMORY_TOOL_DESCRIPTION——"search/list 结果行首 [layer] 标签即 delete 的 layer 参数值"）；③**结果/文档统一用 layer**（模型看到的结果字段/标签/参数全是 layer——无 scope 词）；DB 列/内部逻辑本来就是 layer 不用动（无 schema 迁移——比 scope 方案成本低）。

- **delete 工具语义修正（2026-09-08 explore 一手核实——先前的"delete scope 不一致 bug 修复"注前提错误，作废重写）**：
  - **核实结论**：①search 结果**已显示 scope**（行首 `[personal|project|team]` 标签 + id 前缀 `personal:<n>`/`project:<dir>:<file>`/`team:<dir>:<file>`——explore 核实 core.mjs:90/99/111/121/126/129 + docs.mjs:294）——"结果不含 scope"在 agent memory search 上不成立；list 结果 id 也含前缀（docs.mjs:223），只差无独立 `[scope]` 标签列。②id 前缀**已自路由**（personal/project/team 命名空间互斥无碰撞）——核心 deleteByUid（core.mjs:410-442）**从不需要 scope 参数**，scope 从 uid 前缀解析（L411-412）。③工具层 execDeleteSingle（docs.mjs:383-392）的 scope **必填 + 前缀强校验**（L384/L389）是纯确认门禁（防误删），模型 scope 猜错（没把 search 显示的 scope 填对）→ 报错——**这是"search 能找到但 delete 删不掉"的唯一机制**。④跨 scope fallback **不必要**（id 自路由无碰撞）——先前设计的方向错了一半。
  - **修正设计**：①**layer 可选**（裁定统一成 layer——原 scope 参数改名）——execDeleteSingle 改：layer 传了则校验（防误删保持——L389 前缀匹配），**不传则按 id 前缀直接路由**（与 search/list 找到的 id 直接对接——delete 行为即核心 deleteByUid 的按 id 删）；批删形态（无 id）仍必填 layer（L359 不动——参数改名）。②**list 补独立 `[scope]` 标签列**——现 list 行 `id [type] title（date）` 只有 id 前缀，与 search 行对齐加 `[scope]`（锦上添花，成本低）。③**工具描述重写**——`MEMORY_TOOL_DESCRIPTION`（docs.mjs:196-205）+ scope 参数描述（L244）逐字写明"search 结果行首 `[personal|project|team]` 即 delete 的 layer 参数值、id 前缀同值；delete layer 可选——不传则按 id 前缀路由"。④**第三个真缺口补设计**：uid origin vs 当前 dir 定位分裂——delete 文件定位用当前 `dirs[layer]`（core.mjs:422）无视 uid 内嵌 origin，而 search/list 匹配面（files 表/磁盘扫描）可带出非当前 origin 行——要么 delete 尊重 uid 的 origin 段（直接删 uid origin 指向的文件），要么工具描述写明"team 记忆可能来自其他克隆，本地无对应目录则删不了"。**归属**：MEMORY.md 工具语义（本段）——双端（CLI/VSC）同机制各自独立实现。
- **动机**：磁盘上有、索引无行的 md 文件（孤儿：外部拷贝 / gitmem pull / 早期索引失败遗留）此前对 list 不可见、对批量删免疫——deleteWhere 每次尾部 syncDir 又把幸存孤儿重新入表，表现为清空共享层需多轮循环 delete。改磁盘为真相后**孤儿一轮即删**。
- list 与批量删预览/执行用**同一匹配面**；deleteWhere 尾部 `syncDir` 照旧（收尾重索引幸存者 + 清 stale）。
- **登记取舍**：未入表孤儿在 syncDir 修复前不进 search 结果（files 表仍服务 search/embedding——索引层语义不变）。
- project/team 批量删执行：逐 path `assertPathInside` + `unlink`（ENOENT 容错），再对该层 `syncDir` 一次。

### 6.4 输出契约（逐字——不改措辞）

两端同文，测试逐字断言。下文占位：`N` = 实际条数，`M` = 截断前总数，`X` = scope 名。

| 场景 | 输出（逐字） |
|---|---|
| list 空 | `0 条匹配` |
| list 截断前缀 | `N 条——截断前 M` |
| list 行 | `id [type] title（date）` |
| 批量删预览（N≤5） | `将删 N 条` |
| 批量删预览（N>5） | `将删 N 条：前 5 条预览` + 5 行 + `5 条——截断前 N` |
| 批量删预览（confirm 缺失） | 上述预览 + `confirm:true required — re-send with it to execute the deletion` |
| 批量删执行 | `Deleted N entries in scope X` |
| 批量删无匹配 | `0 条匹配`（不报错） |
| clear | `Cleared personal memory (N entries deleted)` |
| 单条删执行 | `Deleted <id>: <title>` + 内容摘要 |
| 单条 scope 不匹配 | `id prefix personal: 与 scope project 不匹配` |

**批量删门禁**：scope 必填 + type/keyword **至少其一**（无过滤批量删 = 整层清空，绕过 clear 拒共享层门禁 → 拒绝并指引）；confirm 缺失 = **不删**，返回预览让调用方带 confirm 重发。**clear 门禁**：scope 必填且仅接受 personal；confirm:true 必填；project/team 拒绝。

## 7. 关键设计决策

| 决策 | 理由 |
|---|---|
| 单文件 SQLite（node:sqlite，零依赖） | 全部存储统一于 `~/.thincoder/memory.db`——无第三方依赖、事务/迁移/触发器一库搞定；向量存随行 BLOB，行删即清，无独立表 |
| 文件即真相（project/team 层） | 人工可读可改、可 git 管理；DB 只是可重建的索引（syncDir 幂等） |
| FTS5 + 向量双路召回（RRF 合并） | 纯 FTS 对语义近义召回差；纯向量对精确术语差；合并互补 |
| 嵌入懒构建 + 失败降级 | 无 key 也能用（纯 FTS）；首次检索延迟可接受 |
| CJK 逐字分段 | FTS5 无中文分词器；单字索引保召回（BM25 排序仍合理）；写入/查询同处理保证命中 |
| git diff 增量同步 | 大仓库全扫太慢；diff 只处理改动文件（超阈值回退全扫） |
| schema 版本迁移 | node:sqlite 按 `user_version` 递进迁移，破坏性变更（v8/v9 改 PK）显式 drop+重建，由下次同步自动重建索引 |
| 磁盘为真相（list/批量删） | 孤儿文件一轮即删；工具所见即磁盘所存（§6.3） |
| 直接删 + confirm 参数即门禁 | 误删可审计重建（删除前返回内容）；不做两段式人工确认 |

## 8. 已知限制与后续项

- **VS Code 镜像**：memory 工具面（五动作 + scope 值域按端）byte-identical 同步；§6.3 磁盘为真相双端同构（VS Code 镜像同步为后续项）。VS Code 存储为文件制，检索实时扫文件；存量根目录 legacy 条目（scope 子目录布局前）**search 可见但 delete 不可删**（目录定位语义）——已知限制，接受。
- **只读子代理不能 memory search**：见 §5（工具级 readonly 过滤）——如需恢复，改 allowed 集为动作感知。
- **doc-sweep**：`docs/` 若干现状描述文件仍含旧 memory 三工具名 / 向量目录旧说（本文件已更新；其他文件的活文 doc-sweep 列为独立后续任务）。
- **CLI 人类命令面**（`thincoder memory <list|search|put|remove>`）：`list`/`search`/`put` 为 personal-only 核心面（search limit 10、list 支持 --type）；`remove` 走同一 `deleteByUid` 路由（uid 全 scope + 裸数字兼容）——命令行与工具核心路由复用，无漂移。命令面无 list 的共享层/过滤形态、无 clear/批量删（那些是 agent memory 工具面能力）。

## 变更记录

- 2026-09-07：文档格式债批 A 重写——历史变更流水账折叠入正文当前态（2026-09-01 补删能力、2026-09-03 单工具五动作重构、2026-09-05 磁盘为真相修复）。
- **漂移更新**：①存储改为单一 `~/.thincoder/memory.db`（旧"`{cwd}/.thincoder/index/` manifest+vectors.bin"为 DB 化前旧设计——代码/doc 索引现为 DB 内 code_chunks/doc_chunks 表）；②分块判据由"≤30 行/3 行重叠"更新为实际 `BIG_FILE_LINES=2000` 单 chunk + 符号边界切分；③旧 memory_put/search/delete 三工具名不再写为活工具（已合并为单工具五动作）。
