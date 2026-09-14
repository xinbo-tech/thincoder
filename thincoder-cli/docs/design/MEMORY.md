# 记忆系统设计（MEMORY）

> 板块：记忆。权威源：`thincoder-cli/src/memory/`（schema/core/delete/code-index/code-sync/docs）+ `src/memory.mjs`（hub 导出）。本文档描述**当前设计**——三层记忆 + 代码/文档向量索引，`node:sqlite` 单文件存储（零依赖）。
> 跨文档已接管的主题只留指针：工具调度/审批 → `AGENT-LOOP.md`；会话消息历史检索（read_history，非记忆）→ `SESSION.md`；checkpoint/undo 快照 → `CHECKPOINT.md`。
> 状态：**当前态**（2026-09 整理）。历史变更流水账折叠见文末「变更记录」。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/MEMORY.md`——本档保留设计与测试细节。

## 1. 总览与目标

记忆系统让 agent 跨会话保存、检索、治理三类知识——个人记忆、项目共享记忆、团队共享记忆——并同时提供**代码/文档索引**（code/doc chunk），使 `memory` / `code_search` / `doc_search` / `repo_outline` 得以在当前代码库内检索。

- **存储统一单文件**：`~/.thincoder/memory.db`（`node:sqlite`，FTS5 虚表 + BM25 排序 + 向量 BLOB，零第三方依赖）。
- **三层记忆**（写入时指定 layer）：personal（纯 DB 行）/ project（项目 markdown 文件为源，DB 为索引）/ team（git 仓库同步）。
- **双路检索**：FTS5（含 CJK 逐字分段）+ 向量余弦（懒构建，失败静默降级纯 FTS）。
- **磁盘为真相**（project/team 层）：markdown 文件即知识本体，可人工编辑、可 git 管理；DB 只是可重建索引。
- **单一 agent 工具面**：`memory` 单工具、`action` 路由五动作（search/put/list/delete/clear）——旧 memory_put/search/delete 三个裸工具已合并退役。

`~/.thincoder/memory.db` 与 `{cwd}/.thincoder/memory/` 的默认位置定义于 `thincoder-core/config.mjs` 的 `config.memory` 段（`dbPath` / `projectDir` / `team`），可在 `~/.thincoder/config.json` 覆盖。

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
- **team**——团队层，git 仓库同步（`thincoder-core/git/gitmem.mjs`）。`commitAndPush` 写文件后 `git add/commit/push`（push 失败先 `pull --rebase` 再重试一次；真冲突 `rebase --abort` 保持仓库干净并抛带人工解决指引的错误）。`pullTeam` 拉取远程。

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

**layer 限定**：search 检索面 = personal + project（当前 context 项目 origin）+ team 全 origin。`memory.projectOrigin` 存在时，files/向量候选只取 `layer='team' OR origin = projectOrigin`（其他项目的行不进当前搜索）。

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
- **门禁**：`search`/`list` 只读，放行 / 免权限询问；`put` 侧效门；批量 delete / clear = `confirm:true` + laye 门禁（**confirm 参数即门禁**——直接删裁定，无第二层人类确认）。
- **只读子代理工具集过滤**（藏于历史、现行为）：`explore`/`plan`/`consult` 只读子代理按**工具级 readonly** 过滤工具表。memory 工具 `readonly:false`（工具级），故从这些子代理的工具表消失——它们不再能 `memory search`（此前的 memory_search 工具级 readonly:true 在内）；动作级只读分类只覆盖 dispatch 门位，不覆盖子代理工具集过滤。

## 6. memory 工具契约（单工具五动作）

**单一 agent 工具** `memory`，`action` 枚举 `["search", "put", "list", "delete", "clear"]`，参数按 action 分支；工具级 `readonly:false`。action 枚举 / 参数形态 / 描述文本在 CLI `src/memory/docs.mjs`（`MEMORY_TOOL_DESCRIPTION`）与 VS Code 镜像同源逐字一致（byte-identical 边界）。

**layer 值域按端**：CLI personal/project/team；VS Code 无 team（收到 team 明确拒绝并指引 CLI）。action 侧缺省/必填——`put` 缺省 personal；`search`/`list` 缺省搜全部层；`delete`（批删）/`clear` 必填 layer。

### 6.1 五动作

- **search**（只读）——`{query, layer?, limit?}`：自然语言查；limit 默认 5。输出带 id（`[layer][type] title (id=uid)`）。空 query 短路（§3）。
- **put**——`{type, title, content, tags?, layer?}`：type 限 rule/knowledge/decision/pattern；写 personal（纯 DB 行）或 project/team（putMarkdown）。project/team 输出带完整 uid（`personal:<n>` / `project|team:<origin>:<path>`，与 delete 接受的 id 一致）。
- **list**（只读）——`{layer?, type?, keyword?, limit?}`：过滤输出紧凑清单，**不拉全文**；limit 默认 50。
- **delete**——单条形态 `{id, layer?}`（§6.2 deleteByUid）+ **条件批量形态** `{layer, type 和/或 keyword, confirm:true}`（§6.3 磁盘真相）。
- **clear**——`{layer:"personal", confirm:true}` 清空 personal 全部；layer 必填且仅接受 personal，project/team 明确拒绝（`shared layers don't support clear — use delete with type/keyword batch filters instead`）。

**list/批量删的 origin 限定**（藏于历史、现行为）：CLI `files` 层行（list + 批量 delete）按**当前上下文目录**（projectDir/team dir）过滤——其他项目/团队克隆的存量行不进入 list/批量删（工具只能动它能定位的文件）；单条 delete 仍按 uid 全语义；team layer 的 search 仍全 origin（检索面不变）。

### 6.2 deleteByUid 路由（delete.mjs——2026-09-08 自 core.mjs 拆分，core 300 行）

按 uid 精确删除单条，返回被删条目 `{ id, layer, type, title, content, tags }`（删除前 `fetchEntry` 读取；缺文件退 path 段查 files 行，再退 `parseEntry` 磁盘重建）。

- **personal**：`personal:<n>`（**裸数字 `<n>` 自动解析为 personal:<n>**——CLI `memory remove` 命令既有兼容路径）→ `DELETE FROM entries` 行；FTS 由 `entries_ad` 触发器同步，embedding BLOB 随行删除，零残留。
- **project/team**：`project:<origin>:<path>` / `team:<origin>:<path>` → 删除 markdown 文件 + `syncDir` 清索引（"vanished entries are removed from the index"）——**不手删 files 行**（syncDir 单源）。
- **路径包含校验**（`assertPathInside`）：resolve 后路径必须仍在 layer 目录内；`..`/绝对路径（含 Windows 反斜杠变体 `..\`——分隔符无关校验，normalize 后前缀检查）拒绝。
- **ENOENT 容错**：文件已缺视为已删继续（不中断），仍 `syncDir` 清索引行。
- **team 删除语义**：本地删 + syncDir 清索引，**不做 git 提交/推送**（git 传播是 gitmem 职责；删除可逆性优先——工具误删不自动推全团队，git 工具可恢复）。注明：team 记忆经 gitmem 拉取同步时，下次拉取可能复活已删文件（远端未删）——远端删除需经 git 工具。
- **CLI `memory remove` 命令**：底层 `remove()` 收敛为 deleteByUid 兼容壳（boolean 语义保留）——命令行与工具**同一路由**，避免两套行为漂移；裸数字 id 兼容保留。
- **错误**：不存在 → `memory <uid> not found in layer <layer>`；id 前缀与 layer 不匹配 → 拒绝（见 §6.4 逐字）。

- **layer === scope 概念统一（2026-09-08 用户指出——"不看源代码谁知道 layer=scope？"；用户裁定：全统一成 layer）**：memory 三层（personal/project/team）代码里**两个词混用**——核心层 core.mjs 用 `layer`（DB 列名 + 结果字段 + deleteByUid 从 uid 前缀拆 layer——85 处），工具层参数用 `scope`（docs.mjs 10 处）。
  ——模型看到 search 结果带 `[layer]` 标签、delete 却要 `scope` 参数——命名分裂让模型困惑。**修复（裁定统一成 layer）**：scope 参数改名 layer（工具面 + 描述），DB 列/内部本即 layer 不动（无 schema 迁移）。

- **delete 工具语义修正（2026-09-08 explore 一手核实——先前的"delete scope 不一致 bug 修复"注前提错误，作废重写）**：
  - **核实结论**：①search 结果**已显示 layer**（行首 `[layer]` 标签 + id 前缀——"结果不含 scope"不成立）；②id 前缀**已自路由**（命名空间互斥）——deleteByUid **不需要 scope 参数**（从 uid 前缀解析）；③工具层 scope 必填 + 前缀强校验是纯确认门禁——模型 scope 猜错 → 报错——**"search 能找到但 delete 删不掉"的唯一机制**；④跨 scope fallback 不必要。
  - **修正设计**：
    ①**layer 可选**（裁定统一成 layer）——execDeleteSingle 改：layer 传了则校验（防误删保持——execDeleteSingle 前缀匹配校验 前缀匹配），**不传则按 id 前缀直接路由**（与 search/list 找到的 id 直接对接）；批删形态（无 id）仍必填 layer（execDelete 批删 scope 必填处 不动——参数改名）。
    ②**list 补独立 `[layer]` 标签列**——现 list 行 `id [type] title（date）` 只有 id 前缀，与 search 行对齐加 `[layer]`（成本低）。
    ③**第三个真缺口补设计（评审 #2 采纳——定 delete 尊重 uid origin 段）**：delete 文件定位改尊重 uid 内嵌 origin（非当前 dirs[layer]）——否则 search 带出的非当前 origin 行"能看到但碰不到"（违背"id 直接可删"承诺）。落点：core.mjs deleteByUid 按 uid origin 解析（dirs[layer] 兜底——本地无对应目录 → ENOENT 容错 + syncDir 清索引）。
  - **输出/错误串同步（评审 #1 采纳——scope→layer 延伸至模型可见输出）**：§6.4 逐字契约 + 错误串的 `scope` 词同步改 `layer`——`Deleted N entries in layer X`/`与 layer project 不匹配`/`not found in layer <layer>` + byte 断言测试同步
    ——模型看到的所有文本（结果标签/id 前缀/参数名/输出/错误）全是 layer 无 scope 残留；CLI 人类命令面 --scope 随动改 --layer；§6.1/§6.2/§6.4/§8 残留 scope 描述批准后同步更新。
  - **工具描述具体化（2026-09-08 用户要求——工具描述是模型唯一看到的，须完善）**：docs.mjs 工具层 scope 参数全改名 layer（search/put/list/delete/clear 的 args.scope → args.layer + schema scope 字段 → layer + 描述内 scope 词 → layer——~30 处——用户裁定统一成 layer）。重写后描述要点：
    - **search/list**："layer 可选（personal/project/team——缺省搜全部层）；结果每行含 `[layer]` 标签 + id（id 前缀即 layer）"
    - **delete**："单删 {id, layer}——**layer 可选**：传了则校验（id 前缀须与 layer 匹配防误删），不传则按 id 前缀直接路由（search/list 找到的 id 直接可删）；批删（无 id）必填 layer + type/keyword + confirm:true"
    - **layer 概念**："layer = personal/project/team 三层——结果行首 [layer] 标签、id 前缀、delete 的 layer 参数是同一概念——delete 把结果的 [layer] 填进 layer（或省略自动路由）"
    - 无 scope 词（全部 layer）——消命名分裂（模型看到 [layer] → delete 填 layer——直接对应）。
  **归属**：MEMORY.md 工具语义（本段）——双端（CLI/VSC）同机制各自独立实现。
- **动机**：磁盘上有、索引无行的 md 文件（孤儿：外部拷贝 / gitmem pull / 早期索引失败遗留）此前对 list 不可见、对批量删免疫——deleteWhere 每次尾部 syncDir 又把幸存孤儿重新入表，表现为清空共享层需多轮循环 delete。改磁盘为真相后**孤儿一轮即删**。
- list 与批量删预览/执行用**同一匹配面**；deleteWhere 尾部 `syncDir` 照旧（收尾重索引幸存者 + 清 stale）。
- **登记取舍**：未入表孤儿在 syncDir 修复前不进 search 结果（files 表仍服务 search/embedding——索引层语义不变）。
- project/team 批量删执行：逐 path `assertPathInside` + `unlink`（ENOENT 容错），再对该层 `syncDir` 一次。

### 6.4 输出契约（逐字——不改措辞）

两端同文，测试逐字断言。下文占位：`N` = 实际条数，`M` = 截断前总数，`X` = layer 名。

| 场景 | 输出（逐字） |
|---|---|
| list 空 | `0 条匹配` |
| list 截断前缀 | `N 条——截断前 M` |
| list 行 | `id [type] title（date）` |
| 批量删预览（N≤5） | `将删 N 条` |
| 批量删预览（N>5） | `将删 N 条：前 5 条预览` + 5 行 + `5 条——截断前 N` |
| 批量删预览（confirm 缺失） | 上述预览 + `confirm:true required — re-send with it to execute the deletion` |
| 批量删执行 | `Deleted N entries in layer X` |
| 批量删无匹配 | `0 条匹配`（不报错） |
| clear | `Cleared personal memory (N entries deleted)` |
| 单条删执行 | `Deleted <id>: <title>` + 内容摘要 |
| 单条 layer 不匹配 | `id prefix personal: 与 layer project 不匹配` |

**批量删门禁**：layer 必填 + type/keyword **至少其一**（无过滤批量删 = 整层清空，绕过 clear 拒共享层门禁 → 拒绝并指引）；confirm 缺失 = **不删**，返回预览让调用方带 confirm 重发。**clear 门禁**：layer 必填且仅接受 personal；confirm:true 必填；project/team 拒绝。


## 6.5 distill 命令 layer 统一（2026-09-08 实现落地——交付 commit 26cd89f）

> distill = 转录→记忆条目提取命令（CLI 单端——VSC 无 distill）。写记忆入口——scope 词面与 memory 工具 layer 统一（用户裁定延伸：人类命令面一致性）。现状：已实现——--layer 命令面 + --scope 显式报错 + 读时归一（见下）。

### 现状（explore 一手核实）

- scope 出现 6 文件：bin/thincoder.mjs（usage L90 + bash/zsh/fish completion L353/392/438）、src/cli/distill-command.mjs（L13/25/67/69）、src/distill.mjs（L21/30/56/120/124/131/135/144/136/145/154）、src/tui/distill-cmd.mjs（L25）。
- **无持久转录 JSON**——scope 只存在于 LLM 候选输出 JSON（每运行现产现用不落盘）——JSON 兼容落点 = 读时归一单点（distill.mjs L124）。
- distill --scope 是**全 CLI 现存唯一 scope flag**（memory remove 现仅 <uid> 无 flag——既有形态为工具参数面非 CLI flag）。
- **flag 静默吞参风险**：现 flag 解析不校验未知 flag（distill-command L16-22）——纯改名会让旧 --scope 输入静默 no-op。
- 值域分裂：prompt "personal|project"（L21）≠ saveCandidate 支持 personal/project/team（L131-153）≠ CLI usage（L25）——与改名正交。

### 设计（裁定 A/B）

**A. flag 兼容（用户裁定——纯 --layer + 显式报错）**：
- --scope → --layer（usage/帮助/bash/zsh/fish completion 全改）。
- **遇 --scope 输入显式报错**（"distill: --scope renamed to --layer — update your invocation"）——现解析器不校验未知 flag，需加显式检查——防静默失效（人类输入面：旧 --scope=project 静默落 personal 最危险）。

**B. 值域收敛（用户裁定——语义不动仅措辞对齐）**：
- 功能语义不变：提示仍引导 personal/project；saveCandidate 支持 team 是防御性（LLM 偶发/显式 --layer=team 可走）——不改。
- usage/completion/prompt 措辞随改名对齐（Scope filter → Layer filter 类），不扩值域语义。

**JSON 兼容（读时归一——单点）**：
- distill.mjs L124 改 `const layer = candidate.layer ?? candidate.scope ?? "personal"`——新字段优先旧字段兜底——消化旧 LLM 输出（模型忽略新 prompt 字段名时仍产 scope）。
- LLM 提示模板 L21/L30 字段名 scope → layer + 引导语随动。

**受影响文件（评审 #1/#3 采纳——补行数 + 计数对齐：scope 实际分布 4 CLI 文件 + 2 归档历史档（_archive 不更新）——4 为有效改动面）**：
| 文件 | 现行数 | 改动 | 预计 delta |
|---|---|---|---|
| bin/thincoder.mjs | ~450 | usage L90 + bash/zsh/fish completion L353/392/438 | ≤±5（字面替换） |
| src/cli/distill-command.mjs | ~95 | 注释 L13 + usage **L31**（AC2 块插入后偏移——原 L25）+ flags.scope→flags.layer **L73** + 展示串 **L75** + --scope 显式检查 L23-28 | ≤±15（实测 +15） |
| src/distill.mjs | ~160 | prompt L21/30 + docstring + 判别变量 L124/131/135/144 + 错误串 L136/145/154 + 读时归一 | ≤±5（同文替换） |
| src/tui/distill-cmd.mjs | ~40 | 展示串 L25 | ≤±2 |
| test/distill.test.mjs（已退场——TEST-LIFECYCLE；删除记录 = `TESTING.md` §7.1） | 新增 | 读时归一/错误串/--scope 报错 | ~+80（现 0 测试） |
| docs/design/MEMORY.md | 本段 | 评审后并入当前态 | 本段 |

**验收（评审 #2 采纳——AC1 排除豁免；#4 归一前置确认）**：
AC1 --scope 全改 --layer（grep **排除错误串字面行 + JSON 兜底行两处有意 scope**——命令面 usage/completion/展示 0 scope 残留）；
AC2 遇 --scope 显式报错（非静默——含 `--scope=X` 与 `--scope X` 两形态）；
AC3 读时归一 candidate.layer ?? candidate.scope ?? "personal"（确认 L124 是唯一消费点——TUI 预览同源——归一前置无 display 空层）；
AC4 错误串 layer（unknown layer: X/project layer unavailable/team layer not configured）；
AC5 测试（归一/报错两形态/旧 scope 字段兜底/TUI 预览同源）；
AC6 值域语义不变（提示仍 personal/project）。


## 7. 关键设计决策

| 嵌入懒构建 + 失败降级 | 无 key 也能用（纯 FTS）；首次检索延迟可接受 |
| CJK 逐字分段 | FTS5 无中文分词器；单字索引保召回（BM25 排序仍合理）；写入/查询同处理保证命中 |
| git diff 增量同步 | 大仓库全扫太慢；diff 只处理改动文件（超阈值回退全扫） |
| schema 版本迁移 | node:sqlite 按 `user_version` 递进迁移，破坏性变更（v8/v9 改 PK）显式 drop+重建，由下次同步自动重建索引 |
| 磁盘为真相（list/批量删） | 孤儿文件一轮即删；工具所见即磁盘所存（§6.3） |
| 直接删 + confirm 参数即门禁 | 误删可审计重建（删除前返回内容）；不做两段式人工确认 |

## 8. 已知限制与后续项

- **VS Code 镜像**：memory 工具面（五动作 + layer 值域按端）byte-identical 同步；§6.3 磁盘为真相双端同构（VS Code 镜像同步为后续项）。VS Code 存储为文件制，检索实时扫文件；存量根目录 legacy 条目（scope 子目录布局前）**search 可见但 delete 不可删**（目录定位语义）——已知限制，接受。
- **只读子代理不能 memory search**：见 §5（工具级 readonly 过滤）——如需恢复，改 allowed 集为动作感知。
- **doc-sweep**：`docs/` 若干现状描述文件仍含旧 memory 三工具名 / 向量目录旧说（本文件已更新；其他文件的活文 doc-sweep 列为独立后续任务）。
- **CLI 人类命令面**（`thincoder memory <list|search|put|remove>`）：`list`/`search`/`put` 为 personal-only 核心面（search limit 10、list 支持 --type）；`remove` 走同一 `deleteByUid` 路由（uid 全 layer + 裸数字兼容）——命令行与工具核心路由复用，无漂移。命令面无 list 的共享层/过滤形态、无 clear/批量删（那些是 agent memory 工具面能力）。

## 9. 配置路径字段家目录展开（`~`——单一规范化点）· 第 29 批（2026-09-11）

> 需求层 = `../requirements/MEMORY.md` §5（F10–F14 / N7–N9）；来源批次 = `../batches/2026-09-11-HOME-EXPANSION.md` §1 条目 C1（Gitee #IKETT1）。
> 状态：设计+测试层（待设计评审）。实施者 = eng-coder（设计 token 门）——契约逐字 / 点位表 / 用例 / AC 判据全文在本节。

### 9.1 问题陈述与证据（as-of 2026-09-11 实测）

**病灶**：全仓无 `~` 展开逻辑（`startsWith("~")` 零命中；`~` 仅作注释/字符串出现）；
`loadConfig()` 合并用户配置（`thincoder-core/config.mjs:274-285`）后不做路径归一。

**链路（README 示例即触发）**：`README.md:138` 示例 `"dbPath": "~/.thincoder/memory.db"` → 照抄进 config.json →
`loadConfig()` 原样返回 → `createMemory()`（`src/memory/schema.mjs:66-68`）先 `mkdirSync(dirname(dbPath), {recursive:true})`
——以 cwd 为基准建**字面量 `~/.thincoder/` 目录树**；再 `new DatabaseSync(dbPath)` 在 cwd 开/建库。
**静默性**：无警告；用户真实 home 库中的存量记忆"消失"（实为换了库），且 cwd 被污染出 `~` 目录树。

**同病四字段与消费端（逐一证据）**：

| 字段 | 形态 | 读点（证据） | 现象 |
|---|---|---|---|
| `memory.dbPath` | 绝对/相对皆可 | `src/memory/schema.mjs:66-68`；调用点 `src/cli/make-agent.mjs:25` · `bin/thincoder.mjs:221/243/266` · `src/cli/distill-command.mjs:49` | cwd 下建字面 `~` 树 + 在 cwd 开新库 |
| `memory.projectDir` | 相对项目根 | 七点位 `join(cwd, …)`（§9.3c） | cwd 下生成 `<cwd>/~/…` 并被 syncDir 索引 |
| `memory.team.dir` | 缺省 = `<configDir>/teams/<name>` | `teamConfig()`（`src/cli/make-agent.mjs:148-152`）→ `ensureClone` / `syncDir` / `commitAndPush` | git 落到 cwd 下字面 `~` 路径 |
| `shell` | 可执行路径或命令名 | `thincoder-core/tools/bash.mjs:261` → `spawn(…, { shell })`（`thincoder-core/tools/bash.mjs:131`） | spawn 不存在的 `~/…` 路径（响亮失败，但属同病） |

**登记（本批不做——非静默）**：

1. 运行时写入面的**当次**展开：TUI `/shell` 热应用（`src/tui/cmd-shell.mjs:58`）· settings 工具 set（`thincoder-core/agent-tools/settings.mjs`）·
   VS Code 面板写面——落盘原文（下次启动 `loadConfig()` 即展开），但当次会话不生效（`shell` 是唯一会话内实时消费键）；
2. `src/acp.mjs:424` 的 ACP 记忆库硬编码 `join(configDir, "memory.db")`——不读 `memory.dbPath`（既有分叉，与 `~` 无因果）；
3. 历史受害数据：cwd 下已生成的字面 `~` 目录不自动搬移（用户手工迁移；是否随发布说明提示由父侧裁）。

### 9.2 方案选型对比

**（一）展开点**（判据 = 单一权威 / 零漏点 / 可回归 / 代价）：

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | **`loadConfig()` 合并后统一展开** | 权威单点：四字段一次归一；漏点面 = 0（消费点零改——projectDir 基准解析除外，新增消费点自动受保护）；可回归：字段级夹具直接断言 | 代价 = `config.mjs` ≤+10 行 + 新模块 1 个 + projectDir 七点位基准解析 | **选定** |
| 2 | 各消费点各自展开（mkdir/spawn/clone 前各判一次） | 漏点面 = 现有消费点 ≥8 个 + 未来新增点必漏（不可枚举）；回归面分散 | — | 否决 |
| 3 | 读取代理层（`agent.config` getter / Proxy 包装） | 读面可覆盖但复杂度高；破坏 config 普通对象契约（settings 工具展平 / JSON 序列化 / 会话快照面） | — | 否决 |
| 4 | 写盘侧归一后回写 config.json（`~` 换绝对路径持久化） | 毁配置原文与可移植性（换机 / 换用户名即失效）；存量手写配置永不展开 | — | 否决 |

**（二）展开器归属**：

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **新模块 `thincoder-core/expand-home.mjs`** | `config.mjs` 已 487/500 行（近硬限；同因拆分同款 `config-migrate.mjs` / `model-specs.mjs`）；纯函数单测面干净；VSC 镜像可同构（各自独立实现，不做同步依赖） | **选定** |
| 2 | `config.mjs` 内联导出 | 行数两案同末态（内联 +8–12 → ~497——同贴 500 硬限，非区分点）；真代价 = 纯函数失独立单测面（须经 `loadConfig()` 全链）+ 与同因拆分档（`config-migrate.mjs` / `model-specs.mjs`）不一致 | 否决（区分点 = 可测面 / 模块边界 / 同因拆分，非行数） |

### 9.3 接口契约

**（a）展开器**——`thincoder-core/expand-home.mjs`（纯函数、零依赖；逐字契约）：

```js
import { homedir } from "node:os"
import { join } from "node:path"

/** 展开配置路径字段的前缀 `~`（`~` / `~/` / `~\`）为主目录绝对路径；不识别形态原样返回。
 *  home 第二参 = 测试注入缝（生产缺省 homedir()）。 */
export function expandHome(p, home = homedir()) {
  if (typeof p !== "string" || !p.startsWith("~")) return p   // 非字符串 / 非 ~ 前缀 → 原样
  if (p === "~") return home                                  // 裸 ~ = 主目录
  if (p[1] !== "/" && p[1] !== "\\") return p                 // ~user 等非分隔符 → 原样（不猜用户）
  return join(home, p.slice(2).replaceAll("\\", "/"))         // 余段分隔符归一（跨端统一）
}
```

语义（逐形态；`home` 第二参 = 测试注入缝，生产缺省 `homedir()`）：

| 输入形态 | 输出 | 依据 |
|---|---|---|
| `"~"` | `home` | 裸 `~` = 主目录 |
| `"~/x/y"` | `join(home, "x/y")` | 正斜杠前缀 |
| `"~\\x\\y"` | `join(home, "x/y")`（余段 `\\` 先归一为 `/` 再 join） | Windows 分隔符——跨端统一（配置常跨平台复制） |
| `"~/"` · `"~\\"` | `home` | 尾分隔符（`join(home, "")` 归一） |
| `"~user/x"` · `"~abc"` | 原样 | `~` 后非分隔符——不猜用户（`~user` 需 passwd / Windows 用户解析，两平台语义不一） |
| `"a/~/b"` · `"x~"` | 原样 | 仅前缀形态 |
| 非字符串（`null` / `undefined` / 数字 / 对象） | 原样 | 类型护栏——`team.dir` 未设即 `undefined` 透传 |

**（b）`loadConfig()` 落点**（`thincoder-core/config.mjs`）：合并块（`:274-285`）之后、providers 归一之前：

```js
// 家目录展开（第 29 批）：config 路径字段单一规范化点——只读归一（磁盘原文保留）
merged.memory.dbPath = expandHome(merged.memory.dbPath)
merged.memory.projectDir = expandHome(merged.memory.projectDir)
const team = merged.memory.team
if (team && typeof team === "object" && !Array.isArray(team) && team.dir !== undefined) {
  merged.memory.team = { ...team, dir: expandHome(team.dir) }   // 无 dir 键不注入（零键面变化）
}
merged.shell = expandHome(merged.shell)
```

契约细节：

- **只读归一**：不写回磁盘（N9）——`config.json` 保用户原文；换机 / 换用户名后配置仍成立；
- **零值透传**：`shell: null` / `memory.team: null` / `team.dir` 缺省 → 归一后仍为 `null` / 缺省（消费端 `??` / truthy 判据零变化）；
- **落点序**：在迁移写回（`config-migrate`）之后——迁移逻辑与磁盘语义不感知展开值。

**（c）projectDir 消费侧基准解析**（七点位：`join(cwd, p)` → `isAbsolute(p) ? p : join(cwd, p)`）：

理由：`~` 展开产出**绝对路径**；`path.join(cwd, "/home/u/x")` 会拼成 `<cwd>/home/u/x`（join 不做绝对绕过）——必须绝对原样。
**相对形态走原 `join` 分支** → 与修前逐字相同（N7 零伤硬证据）。该式为本仓既有惯用式（同款 `src/tui/cmd-undo.mjs:24`、`thincoder-core/agent-tools/read-history.mjs:172`）。

| # | 点位（as-of 2026-09-11） | 用途 |
|---|---|---|
| 1 | `src/cli/make-agent.mjs:44` | `memory.projectOrigin`（检索 origin 过滤基准）+ 启动 syncDir |
| 2 | `src/cli/memory-command.mjs:70` | CLI `memory remove` 的 project 层目录 |
| 3 | `src/memory/docs.mjs:240` | memory 工具（put / delete 的 project 层目录） |
| 4 | `src/cli/distill-command.mjs:67` | CLI distill 的 project 层 |
| 5 | `bin/thincoder.mjs:227` | `thincoder memory` 的 projectOrigin |
| 6 | `bin/thincoder.mjs:272` | `thincoder reindex` 的 project 同步 |
| 7 | `bin/thincoder.mjs:326` | TUI `/distill` 的 projectDir 入参 |

**（d）冻结面（零改）**：`DEFAULTS` 四字段默认值（`thincoder-core/config.mjs:91-95`）· `teamConfig()` 缺省 `join(configDir, "teams", name)`
（`src/cli/make-agent.mjs:152`）· `dbPath` / `team.dir` / `shell` 的消费端（收到的值已绝对）。

### 9.4 受影响文件全清单（行数 = 批前基准 as-of 2026-09-11 实测）

| # | 文件 | 现行行数 | 预计增量 | 改动 | 执行 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/expand-home.mjs` | 新 | ~+30 | 展开器（§9.3a） | eng-coder |
| 2 | `thincoder-core/config.mjs` | 487 | ≤+10 | import + 四字段归一（§9.3b） | eng-coder |
| 3 | `src/cli/make-agent.mjs` | 163 | ≤+2 | :44 基准解析 + import 增补 | eng-coder |
| 4 | `src/cli/memory-command.mjs` | 86 | ≤+2 | :70 同式 | eng-coder |
| 5 | `src/memory/docs.mjs` | 418 | ≤+2 | :240 同式 | eng-coder |
| 6 | `src/cli/distill-command.mjs` | 92 | ≤+2 | :67 同式 | eng-coder |
| 7 | `bin/thincoder.mjs` | 406 | ≤+3 | :227 / :272 / :326 同式 | eng-coder |
| 8 | `test/home-expansion.test.mjs` | 新 | ~+110 | T-H1–T-H15 在役（T-H16 已退场——整删，删除记录 = `TESTING.md` §11.3）；快层 + 1 条 slow | eng-coder |
| 9 | `README.md` | 472 | ≤+4 | 展开说明句 + 三字段注释（字面定稿 L1–L4） | eng-coder |
| 10 | `docs/requirements/MEMORY.md` | 73（批前） | ≤+55 | §5（F10–F14 / N7–N9） | eng-designer（**已落**） |
| 11 | `docs/design/MEMORY.md` | 239（批前） | 实测 +228（as-of 2026-09-11 修正轮落笔；超预计 ≤+210——纯 .md 档豁免尺寸判据） | 本节 §9 | eng-designer（**已落**） |

**行 9 README 字面定稿（L1–L4——原 T-H15 逐字 oracle 面已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；C1e 落笔字面）**：

| 锚 | README 位置（批前行号 as-of） | 逐字文本（coder 照写） |
|---|---|---|
| L1 说明句 | `"memory"` 块内首行（`:138` 前，+1 行） | `// Path fields (dbPath / projectDir / team.dir / shell) expand a leading ~ (~, ~/, ~\) to the home directory at load time` |
| L2 dbPath 注释 | `:138` 行尾（替换原注释） | `// sqlite index path (~ expands to the home directory)` |
| L3 projectDir 注释 | `:139` 行尾（替换原注释） | `// Project layer directory (relative to project root; ~ expands to an absolute path used as-is)` |
| L4 shell 注释尾 | `:124` 行尾追加（原注释保留） | `; a leading ~ in the path expands to the home directory` |

示例值 oracle（F14 第三分句机验）：`"dbPath": "~/.thincoder/memory.db"` 示例值经 `expandHome(v, HOME)` 后 == `join(HOME, ".thincoder/memory.db")`（绝对、无 `~` 前缀；T-H15 内断言）。

### 9.5 关键决策记录

| # | 决策 | 否决备选与理由 |
|---|---|---|
| D-H1 | 展开点 = `loadConfig()` 单点（选型 1） | 消费点分散（漏点不可枚举）· 代理层（破坏 config 契约）· 写盘归一（毁原文 / 可移植性） |
| D-H2 | 展开器住新模块 `thincoder-core/expand-home.mjs` | config.mjs 内联（行数同贴硬限——非区分点；纯函数失独立单测面 + 违同因拆分口径） |
| D-H3 | 形态面 = `~` / `~/` / `~\`，**不含** `~user` | `~user` 需 passwd / Windows 用户名解析——收益低、双平台语义不一、猜错即静默错域；不做 = 原样透传——**shell 面**响亮失败（spawn 不存在路径）；**dbPath / projectDir / team.dir 面为残余静默面**（透传建字面 `~user` 目录——同病灶，登记 §9.8） |
| D-H4 | projectDir 消费侧 `isAbsolute ? p : join(cwd, p)`（非 `resolve(cwd, p)`） | `resolve` 对相对输入也有归一二进样（尾斜杠 / `..` 折叠）→ origin 串非零 delta；`isAbsolute` 分支下相对路径逐字同修前（N7 零伤硬证据） |
| D-H5 | 磁盘原文不动（读时归一） | 写回绝对路径：毁可移植性 + 存量手写配置不生效 |
| D-H6 | `shell` 同批同机制纳入 | 分批做 = 同 helper 分叉 / 漏点；shell 是 spawn 路径——同病同修 |
| D-H7 | 运行时写面**当次**展开不做（登记 §9.1） | 覆盖它要动 settings 工具 + TUI `/shell` + VSC 面板三面（跨端跨档）——本批边界外；落盘原文 + 下次启动展开已使语义自愈 |

### 9.6 用例表（正常 / 边界 / 错误——映射需求号）

新档 `test/home-expansion.test.mjs`；T-H14 归册 slow（`test/slow.mjs`——真实 fs 写 + 子进程，快层 skip / test:full 照跑）；其余快层。

| # | 类 | 输入 | 预期输出 / 断言 | 需求 |
|---|---|---|---|---|
| T-H1 | 正常 | `expandHome("~", HOME)` | `HOME` | F10/F11 |
| T-H2 | 正常 | `expandHome("~/a/b", HOME)` | `join(HOME, "a/b")` | F11 |
| T-H3 | 边界 | `expandHome("~\\a\\b", HOME)` | `join(HOME, "a/b")`——`\\` 归一，跨平台同式 | F11 |
| T-H4 | 边界 | `"~/"` · `"~\\"` | `HOME` | F11 |
| T-H5 | 边界 | `"~user/x"` · `"~abc"` · `"a/~/b"` · `"~~"` | 全部原样（零展开） | F11 |
| T-H6 | 错误（类型） | `null` · `undefined` · `42` · `{}` · `""` | 原样且不抛 | F11/N8 |
| T-H7 | 正常 | `loadConfig()` + 夹具四字段全 `~`（`_setConfigPathForTest`） | 四字段 == 展开值 ∧ 各自 `startsWith("~") === false` | F10 |
| T-H8 | 正常（零变） | `loadConfig()` + 空夹具 `{}` | `dbPath === join(configDir, "memory.db")` ∧ `projectDir === ".thincoder/memory"` ∧ `shell === null` ∧ `team === null` | N7 |
| T-H9 | 边界 | 夹具 `team:{repo:"r:1"}`（无 dir）· `team:"abc"`（非对象） | 不抛；无 dir 时 `"dir" in team === false`（零键注入）/ `team` 原样；其余字段照展 | F10 |
| T-H10 | 正常 | 读含 `~` 夹具前后 `readFileSync` 字节 | 相等（零写回） | N9 |
| T-H11 | 正常 | `memoryTools(mem, {cwd, projectDir:<绝对 tmp>})` → `put{layer:"project"}` | 文件落 `<绝对 tmp>` 下；`join(cwd, <绝对 tmp>)` 形态路径不存在 | F12 |
| T-H12 | 正常（零变） | `memoryTools(mem, {cwd, projectDir:"projA"})`（相对） | 目录 === `join(cwd, "projA")`（与 `test/memory-tool.test.mjs` 同式） | N7 |
| T-H13 | 边界 | 夹具 `team:{repo:"r:1", dir:"~/t"}` → `teamConfig(loadConfig())` | `.dir === join(HOME, "t")`（绝对原样，无 cwd 前缀） | F10/F12 |
| T-H14 | 端到端（slow） | 子进程（伪 `HOME`/`USERPROFILE` + 另置 cwd）：`dbPath:"~/data/memory.db"` · `projectDir:"~/pdata"` → `loadConfig()` + `createMemory()` | `HOME/data/memory.db` 存在 ∧ `<cwd>/~` 不存在 ∧ stdout 两字段无 `~` 前缀 | F13 |
| T-H15 | 静态 | `README.md` 文本 + `expandHome` | L1–L4 逐字命中（§9.4 字面定稿）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；示例值展开 == `join(HOME, ".thincoder/memory.db")`（绝对、无 `~`）保留 | F14 |
| T-H16 | 静态 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F10 |

### 9.7 验收标准（逐条回指——每条可机器验证）

- **AC-H1（→ F10）**：`loadConfig()` 对含 `~` 的四字段夹具返回全部展开值（T-H7：四字段逐条断言）；全仓展开逻辑恰一处
  （T-H16 已退场——整删，删除记录 = `TESTING.md` §11.3；原判据 = `grep -rn 'startsWith("~")' src bin` == 1 命中，文件 = `src/expand-home.mjs`）。
- **AC-H2（→ F11）**：形态表驱动（T-H1–T-H6 绿）——正常 2 组 / 边界 4 组逐条断言（`~` / `~/x` / `~\\x` / 尾分隔符；不展开四形态；非字符串零抛）。
- **AC-H3（→ F12）**：绝对 projectDir 消费面断言（T-H11）∧ 相对形态与 `join(cwd, p)` 逐字等值（T-H12）。
- **AC-H4（→ F13）**：伪 HOME 端到端（T-H14，slow）——`HOME/data/memory.db` 存在 ∧ `<cwd>/~` 不存在。
- **AC-H5（→ F14）**：README 断言（T-H15）——说明句 + 三字段注释 L1–L4 逐字命中（字面 = §9.4 字面定稿）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；示例值展开后可用（绝对、无 `~` 前缀）保留。
- **AC-H6（→ N7）**：`node test/run-fast.mjs` 绿 ∧ `npm run test:full` 绿（既有用例零伤——§9.10 锁清单）；T-H8 / T-H12 绿。
- **AC-H7（→ N8）**：单测零网络、零真实 home 写入（`test/home-expansion.test.mjs` 全部注入 home / tmp 目录）。
- **AC-H8（→ N9）**：T-H10 绿（读配置前后磁盘字节相等）。
- **AC-H9（批级）**：`node scripts/check-doc-width.mjs` 本批文件新增 0 违规；`node --check` 全部改动 `.mjs` 语法过。

### 9.8 边界（本批不做）

- 运行时写面当次展开 / ACP 硬编码分叉 / 历史受害数据搬移（§9.1 登记三条）；
- 其它字段的路径处理（providers / proxy / mcp command 等——`~` 语义未登记，零碰）；
- `~user` 形态**残余静默面**：dbPath / projectDir / team.dir 透传后仍建字面 `~user` 目录（同病灶；shell 面为响亮失败——D-H3）；环境变量 / 通配 / 转义；路径存在性校验（形状层止步——同 SETTINGS-TOOL D-S2.5）；
- VSC 仓镜像（勘察结论 = 仅 `shell` 字段同病 → 报告父侧排程，本批单端）；
- 不建新档；不碰他链在途档；不改 `DEFAULTS` 默认值；不动 `_archive/` 旧档。

### 9.9 UI/交互决策（全落档）

- 本批零 UI 面：无 picker / 菜单 / TUI 文案改动；无新增用户可见错误文本（展开对不识别形态原样透传——"失败面"不存在）；
- README（用户可见文档面）随批更新（§9.4 行 9）；
- `open`：无。（§9.1 三条登记为已裁定出批项，非 open。）

### 9.10 对账（§1 待裁五问逐条 + 既有锁零伤）

| §1 待裁 | 结论 | 落点 |
|---|---|---|
| 1 展开点 + helper 归属 | `loadConfig()` 单点（D-H1）+ 新模块 `thincoder-core/expand-home.mjs`（D-H2） | §9.2 / §9.5 |
| 2 支持形态 + Windows 分隔符 | `~` / `~/` / `~\`（`\\` 归一生效）；`~user` 不做（D-H3：两平台语义不一、收益低） | §9.3a |
| 3 四字段落法 + README + 用例/AC | 三字段 loadConfig 展开即毕 / projectDir + 七点位基准解析（§9.3c）；README 见 §9.4 行 9；用例 T-H1–T-H15 + AC-H1–AC-H9（T-H16 已退场——整删，删除记录 = `TESTING.md` §11.3；含「cwd 无字面 `~`」机验 = T-H14） | §9.3 / §9.4 / §9.6 / §9.7 |
| 4 VSC 镜像勘察 | VSC **无** memory 字段消费（文件制记忆、`memoryDir` 硬编码 `cwd/.thincoder/memory`）；**`shell` 同病**（`thincoder-vscode/src/agent/setup.mjs:232` → `src/tools/shell.mjs:233`（VSC 仓；242 行同） `exec({shell})`）——镜像面 = 1 字段，报告父侧排程 | §9.8 |
| 5 既有锁零伤 + §1.13 核对 | 见下 | — |

**既有锁零伤清单（as-of 实测）**：

- `test/settings.test.mjs`：T-S2.13 表行集不含 `~` 值 → `c.shell === v` / `teamConfig(c)` 判据零伤。**语义登记**：含 `~` 的 `shell` 写入后，
  经 `loadConfig()` 读回为展开值（等式 `c.shell === v` 对 `~` 值不成立）——未来若加该夹具行，须按展开语义断言；
- `test/memory-tool.test.mjs`：相对 projectDir 夹具 → `isAbsolute` 分支与 `join` 逐字同（T-H12）零伤；
- `test/config-merge.test.mjs` / `test/config.test.mjs`（已并入 config-merge——TEST-LIFECYCLE） / `test/portability-*.test.mjs`：夹具不含 `~`、`DEFAULTS` 零改 → 零伤；
- `test/config-pool.test.mjs`：只锁 `poolLimits` → 零伤；
- 默认值面：`DEFAULTS.memory.dbPath` 已绝对 → `expandHome` 恒等（零值变化）。

**§1.13（需求池）核对**：本批**未在 `docs/TODO.md` 需求池登记**（记录归属 = 主 agent——§1.13「记录 / 维护」分工）；
本席未写入（写域外）——拟录条目见批次档 §2「需父侧排程项」。


---

## 10. 检索向量加载上界（TUI-OOM-ROOTCAUSE 批——2026-09-11）

> 需求：`../requirements/MEMORY.md` §6（F-M1–F-M3 / N-M1–N-M3）。来源：批次档
> `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §1（勘察 C4 检索面）。

### 10.1 问题陈述（证据 as-of 2026-09-11——实读）

| # | 事实 | 证据（file:line） |
|---|---|---|
| 1 | 三张表的向量通道全表 `.all()` 物化后逐行 cosine + 全量排序——无 SQL LIMIT、无分块 | `thincoder-core/memory/core.mjs:60-68`（entries ∪ files）· `docs.mjs:112-116` · `code-sync.mjs:294-298` |
| 2 | 触发面 = 每轮 run 装配（prompt 注入）+ 工具调用（doc_search/code_search）；本机 memory.db ~736MB（embedding BLOB 为体量主源） | `thincoder-core/agent/setup.mjs:100-124` · `docs.mjs:185` · `code-sync.mjs:350` |
| 3 | 结果侧本身有界（候选 = `max(limit×4, 20)`）——病灶是**扫描期**全量物化 | `thincoder-core/memory/core.mjs:68` · `docs.mjs:116` |
| 4 | FTS 通道已有 `LIMIT`（对照面） | `thincoder-core/memory/core.mjs:88-104` · `docs.mjs:94-99` |

### 10.2 方案选型对比

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **流式/分块扫描 + 有界 top-K 选择** | 峰值 = 块 + K；召回语义不变（仍全表评分）；实现面小（三处同型） | **选定** |
| 2 | 结果缓存/LRU 复用 | 缓存的是「查询→结果」——不解决首次扫描峰值；内存更差 | 否决 |
| 3 | 近似/剪枝（先 FTS 预筛再向量） | 召回语义变化（设计外） | 否决 |
| 4 | 向量索引（ANN） | 依赖/架构级——超本批 | 否决（登记为后续项） |

**分块实现面候选**：① 绑定层迭代器（`iterate()`——以现有 sqlite 绑定支持为准）；② rowid 游标分页
（`WHERE rowid > ? ORDER BY rowid LIMIT ?`）。设计取「①可用则用，否则②」——实现时以实测定稿
（两者语义等价：全表逐行、无重复无遗漏）。

### 10.3 契约（实现对象）

- **分块常量**：`SCAN_CHUNK_ROWS = 2_000`（单块行数——单源；三处共用）。
- **扫描形态**：每块物化 `{uid, embedding}` → 逐行 `fromBlob`/cosine → top-K 有界插入
  （候选集 ≤ `max(limit×4, 20)`——既有口径）；块内存随迭代释放。
- **top-K 选择**：维护升序小顶堆（K 上限）；并列分数按既有排序稳定性规则（先到先留——
  与「全量 sort 稳定序」等价）。
- **对外结构不变**：返回 `[{id, score}]` 候选（既有消费面 RRF 融合不变）；FTS 通道与
  开关（projectOrigin 过滤）零改。
- **可测缝**：扫描器接受注入的 `runChunkedQuery`（默认真实 DB 实现）——测试以假数据源直测
  块大小/top-K/等价性（不建真实大表）。

### 10.4 关键决策记录

- **D-M1 流式分块 + top-K**（表 1 候选 1）；**D-M2** 块行数 2_000（单块 ≈ 2k×（4B×维度+行开销）
  ——量级 KB~MB 级，随维度有界）；**D-M3** 实现面以绑定能力定稿（迭代器优先、rowid 分页兜底）；
  **D-M4** 不改 FTS/融合/开关语义（N-M2）。

### 10.5 受影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `src/memory/scan.mjs` | 新 | +90 ± 20 | `scanVectors(db, sql, params, { chunk, onRow })` + top-K helper（三处复用） |
| `thincoder-core/memory/core.mjs` | 301 | +10 → ~311（越 300 软线——登记） | search 向量通道改分块 + top-K |
| `src/memory/docs.mjs` | 418 | +8 | docSearch 向量通道同改 |
| `src/memory/code-sync.mjs` | 414 | +8 | codeSearch 向量通道同改 |
| `test/memory-scan-bounds.test.mjs` | 新 | +120 ± 30 | T-MS1–T-MS4 |

> 拆分结论：全部 ≤500；`core.mjs` 311 越 300 咨询线（单点替换、不拆）。

### 10.6 用例表（正常 / 边界 / 错误）

| # | 层 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T-MS1 | 快层 unit | 分块扫描 | 假源 10_000 行 | 单块物化 ≤ `SCAN_CHUNK_ROWS`（计数注入）；逐行回调恰 10_000 次 | F-M1/N-M1 |
| T-MS2 | 快层 unit | top-K 等价 | 假源 1_000 行 × 已知分数 | 结果与「全量排序取前 K」逐条相等（含并列稳定性） | F-M2/N-M2 |
| T-MS3 | 快层 unit | 候选上限 | limit=3 / limit=50 | 候选数 = max(limit×4, 20)（既有口径） | F-M2 |
| T-MS4 | 快层 unit | 三通道接线 | 三处调用点 | scan 模块调用面（grep/注入计数：无 `.all()` 全表物化）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；现体 = 块常量值锁（`SCAN_CHUNK_ROWS` == 2000） | F-M1 |

### 10.7 验收标准（逐条回指）

| AC | 回指 | 判据（机验） |
|---|---|---|
| AC-M1 | F-M1 | T-MS1 绿；三处无全表 `.all()`（grep：向量 SQL 无裸 `.all()`） |
| AC-M2 | F-M2/F-M3 | T-MS2/T-MS3 绿；FTS 用例零伤 |
| AC-M3 | N-M1 | T-MS1 计数断言（峰值 ≤ 块 + K） |
| AC-M4 | 零回归 | `test/memory-tool.test.mjs` + 既有检索用例全绿 |

### 10.8 边界（本批不做）

- 不做向量索引/近似检索（登记后续项）；不改 embedding 生成/失效面；不改检索触发点、
  limit 语义、FTS 通道与 RRF 融合；不做 DB 体量治理（736MB 属数据面——另案）。

## 变更记录

- 2026-09-11（TUI-OOM-ROOTCAUSE 批）：新增 §10（检索向量加载上界——分块扫描 + top-K：选型 /
  契约 / 决策 D-M1–D-M4 / 用例 T-MS1–T-MS4 / AC-M1–AC-M4）；需求 = `../requirements/MEMORY.md` §6；
  批次档 `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md`。
- 2026-09-11：§9 配置路径字段家目录展开（第 29 批）——`loadConfig` 单点规范化 + 四字段（dbPath / projectDir / team.dir / shell）+ projectDir 七点位基准解析。
- 2026-09-11：同批修正轮（设计评审轮次 1 pass 后，6 条逐条处置——N7 口径收窄 · README 字面定稿 L1–L4 · §9.2 / D-H2 理由改述 · `~user` 残余静默面登记 · 数字刷新；第 6 条备查；零实现面）。
- 2026-09-07：文档格式债批 A 重写——历史变更流水账折叠入正文当前态（2026-09-01 补删能力、2026-09-03 单工具五动作重构、2026-09-05 磁盘为真相修复）。
- **漂移更新**：①存储改为单一 `~/.thincoder/memory.db`（旧"`{cwd}/.thincoder/index/` manifest+vectors.bin"为 DB 化前旧设计——代码/doc 索引现为 DB 内 code_chunks/doc_chunks 表）；②分块判据由"≤30 行/3 行重叠"更新为实际 `BIG_FILE_LINES=2000` 单 chunk + 符号边界切分；③旧 memory_put/search/delete 三工具名不再写为活工具（已合并为单工具五动作）。
