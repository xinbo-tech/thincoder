# 记忆系统（MEMORY）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 / §2.12.3 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 记忆库 | `thincoder-cli/src/memory.mjs`（转口）+ `src/memory/**`（8 档） | `thincoder-vscode/src/memory.mjs` · `memory-tool.mjs` |
| 工具面 | `src/memory/docs.mjs` 的 `memoryTools` | `src/memory-tool.mjs` |
| 索引（代码 / 文档） | `src/memory/code-index.mjs` · `code-sync.mjs` | `src/indexer.mjs` · `index-bin.mjs` · `index-discover.mjs` · `tools/code.mjs` |
| 嵌入 | `src/embedding.mjs` | 同（同路径对） |
| team 层同步 | `src/git/gitmem.mjs` | —（无对位） |
| 子命令面 | `src/cli/memory-command.mjs` | —（无对位） |

**本子系统的归一方向（已裁）**：面向 **CLI 语义**归一（用户裁定 A12——前提失效，非选边）；`node:sqlite` 采纳为定案（`CORE-UNIFICATION.md` §2.11 A8）。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 75 | `embedding.mjs` | 同路径 | 0.6566 · 异 | ② | 进核 | 融合：取 CLI（每请求 60s 超时 + `toBlob`/`fromBlob`）+ VSC 的本地 RETRYABLE 常量归位 | 分叉 ＝ VSC 缺每请求 60s 超时（`src/embedding.mjs:71`）与 blob 助手（存储介质不同所致）；前提（存储面已随 A12 归一为 CLI sqlite）⇒ 差异消失 | — | S1（建核补齐） |
| 82 | `memory.mjs` | 同路径 | 0.0093 · 异 | ③ | 进核（**同名不同物**：CLI 21 行转口 + `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | 以 CLI 为准（A12——**前提失效，非选边**）；VSC 侧改接线；旧数据迁移另议（§2.5.1 / §2.12.3） | 分叉 ＝ **前提失效**（「VS Code 内置 Node 不支持 sqlite」不成立）；实测 CLI = `node:sqlite` + FTS5（`src/memory/schema.mjs:9,68`）/ VSC 零 sqlite（纯 md，`src/memory.mjs:26-37`） | **①②③** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 133 | `src/memory.mjs` + `src/memory/**`（8 档）↔ `src/memory.mjs` + `memory-tool.mjs` | ③ | 以 CLI 为准（A12——**前提失效，非选边**） | 分叉 ＝ **前提已失效**（「VS Code 内置 Node 不支持 sqlite」不成立；CLI `node:sqlite`+FTS5 `src/memory/schema.mjs:9,68` / VSC 零 sqlite）⇒ 直接归一；**承 §2.5 #82** | —（承 #82） | S1（建核补齐） |
| 134 | `src/memory/docs.mjs`（`memoryTools`）↔ `src/memory-tool.mjs` | ② | 融合：核内单一 memory 工具面（动作集 / schema / 文案取一侧） | 分叉 ＝ 拆档位置（CLI 工具面住 `memory/docs.mjs:241`）；两端动作集同规格（五动作 / layer 词面）⇒ 前提成立；**随 #82 / A1 归一** | —（承 #82） | S1（建核补齐） |
| 135 | `src/cli/memory-command.mjs` ↔ 核内（VSC 无对位） | ④ | 端特有段：CLI `memory` 子命令面（shell 通道） | 结构性不对称 = **仅 CLI 有 shell 子命令通道**（VSC 无终端子命令面——与 #125 冷 cwd 面同源）；**非**「差异」排除（A9） | — | 不迁（端特有） |
| 136 | `src/memory/code-index.mjs` + `code-sync.mjs` ↔ `src/indexer.mjs` | ③ | 以 CLI 为准（**同一 A12 前提失效**；进核） | 分叉 ＝ 索引存储（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI sqlite 库——CLI `src/**` 零 `.thincoder/index` 命中）；前提同 #82 ⇒ 失效；**随 A1 归一** | —（承 #82） | S1（建核补齐） |
| 137 | （CLI 无切分档）↔ `src/index-bin.mjs` · `index-discover.mjs` | ② | 融合：随核内索引面一并归位（向量编解码 / 走查规则） | 分叉 ＝ 拆档（VSC 拆 3 档 / CLI 2 档）；走查规则（`SKIP_DIRS` / 点目录 / `.thincoder` 特例）两端同源（VSC `thincoder-vscode/src/index-discover.mjs:5-8` 自述「CLI-aligned」）⇒ 前提成立 | — | S1（建核补齐） |
| 168 | `src/git/gitmem.mjs` ↔ 核内（VSC 侧无 team 层同步面） | ③ | 以 CLI 为准（team 层记忆 git 同步）；VSC team 层现行「明确拒绝、指向 CLI」⇒ 随 A1 归一 | 分叉 ＝ team 层处置（VSC 无该层）；**承 #82 / A1** | —（承 #82） | S1（建核补齐） |

### 2.3 工具实现面单端档映射（原 §2.5（四）「工具实现面单端档逐档映射」表中的本子系统行）

| 单端档 | 对位 / 处置 |
|---|---|
| VSC `tools/code.mjs` | ↔ CLI `memory/docs.mjs` 的 `codeSearchTool` / `docSearchTool` ⇒ 随 #82 |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A1 | `memory.mjs`（席位 #82；实为 CLI `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | ①②③ | `node:sqlite` `DatabaseSync` + FTS5（`src/memory/schema.mjs:9,68`）；库 = `~/.thincoder/memory.db`；三层 `personal` / `project` / `team`，**personal = 全机共享的库行**；project 层 = `.thincoder/memory/*.md`（**只扫顶层** `src/memory/core.mjs:205-212`） | 零 sqlite——纯仓内 md（`.thincoder/memory/{personal,project}/*.md`，`:26-37`）+ 遗留 `.json` 读兼容（`:150-162`）；两层（`team` 明确拒绝、指向 CLI）；`personal` 落在**仓库目录内** | **以 CLI 为准**（A12——前提失效，非选边）；`node:sqlite` 采纳为定案（§2.11 A8） | ① 记忆存哪变了（VSC 的 personal 由仓内目录 → 全机库）；② 两端**从此可互读**（现状：VSC 读不到 CLI 的库、CLI 不递归读 VSC 的子目录）；③ 旧数据要搬（见 A2）；④ 检索能力（FTS5 + 中文逐字分段）随之而来；⑤ 两侧测试面 | **已裁（2026-09-13）· 按建议** |
| A2 | 记忆面旧数据迁移（§2.12.3 第 2 行） | ②③ | 有 `memory` 子命令（list / search / put / remove）与 `/reindex`；**无 md / json 导入命令** | 用户既有记忆 = 仓内 `personal` 层 md + 遗留 `.json` + `workspaceState` 的 `thincoder.modelPrefs` | **已裁（2026-09-13）：① 提供一次性导入器**（md / json → `entries`）——**父侧代选**（用户 2026-09-13「全部按建议」未逐字指定本行，已披露 ✓；理由：选 ② 会让 VSC 老用户记忆清空，与「不丢用户数据」相悖）。**落地** = S2 建一次性导入器（`memory import` 子命令面；`modelPrefs` 仍取不到——住 VS Code 状态，不在文件系统） | 用户既有记忆保留（md / json → `entries`）；`modelPrefs` 明确不迁（无文件系统载体） | **已裁（2026-09-13）· ① 一次性导入器（父侧代选）** |
| A3 | VSC 引擎下限（§2.12.3 第 1 行） | ② | `engines.node = >=24` | `engines.vscode = ^1.85.0` | 抬到 **候选 `^1.104.0`**（A13 已裁「可抬」；**原候选 `^1.101.0` 经本轮实核不成立** ✗——见下行与 §2.11 A8）；**须真机实测确认 + 用户过目** | 放弃 VS Code < 新下限的用户（A13 已接受该代价）；装上旧宿主 ⇒ 扩展不可用 | 已裁（「可抬」）· **值换候选 `^1.104.0` + 待真机实测 + 过目** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 11 | **代码索引存储面**（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI `node:sqlite` 库内索引） | 数据面 / 文件格式 | 取 CLI（索引入 sqlite 库；VSC 索引文件面退场） | 旧文件格式**不再写**；读取兼容或迁移说明（随 A2 导入器一并处置）· CHANGELOG | 索引面文档 + 用例 + 两产品 `CHANGELOG.md` | 已裁（2026-09-13）· 按建议（承 §2.5.1 A1 / §2.11 A8） |

### 4.1 无法兼容项上抛（自 §2.12.3 搬入 · 逐字）

| # | 项 | 为何无法兼容（实测 / 证据） | 上抛形态（四要素） | 裁定状态 |
|---|---|---|---|---|
| 1 | **VSC 引擎下限抬升**（`engines.vscode` `^1.85.0` → **候选 `^1.104.0`**） | 旧宿主内置 Node < 22.13 ⇒ 无 `node:sqlite`；**且 Electron 35.x（= VS Code 1.101 / 1.102）未获 sqlite 内置修复**（electron/electron #47706 回移分支 = 36 / 37 / 38-x-y）⇒ 原候选 `^1.101.0` 不成立；A13 已裁「抬高、不保留降级路径」⇒ **无兼容路径可给**（给降级路径 = 两套逻辑再现 ✗） | 左端 = VSC 现状（`thincoder-vscode/package.json` 的 `engines.vscode: ^1.85.0`）· 右端 = 新下限 **`^1.104.0`（候选，经真机实测确认后定值）** · 建议 = 采纳（A13）· 影响面 = < 新下限用户不可用；**配套护栏** = `activate()` 自检 + 明确提示（不崩） | 已裁（「可抬」· 2026-09-13）· **候选上修 `^1.101.0` → `^1.104.0` · 值待真机实测 + 过目**（§2.5.1 A3 / §2.11 A8） |
| 2 | **记忆面旧数据迁移**（VSC `personal` 层 md 档 · 遗留 `.json` 记忆档 · `workspaceState` 的 `thincoder.modelPrefs`） | VSC `personal` = 仓内目录（`thincoder-vscode/src/memory.mjs:26-37`）· CLI `personal` = 用户级全局 sqlite 库行（`thincoder-cli/src/config.mjs:92`）；CLI 侧无导入命令（`thincoder-cli/src/cli/memory-command.mjs:21-63`）· 同步只认顶层 `.md`（`thincoder-cli/src/memory/core.mjs:205-212`）⇒ **无自动迁移路径**；`modelPrefs` 住 VS Code 状态（不在文件系统） | 左端 = VSC 现状（仓内 md 持久）· 右端 = CLI 现状（全局库 + 顶层 md）· 建议 = **① 提供一次性导入器**（md / json → `entries`）或 ② 用户手工迁移 / 丢弃 · 影响面 = 用户既有记忆 + 语义（每仓私有 → 全机共享） | **已裁（2026-09-13）· ① 一次性导入器**（**父侧代选**，已披露；落地 = S2 建 `memory import` 面。§2.5.1 A2） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**记忆面（S2 改）** · **记忆面导入器（S2 新建）** · **版本下限面（S2 改——须过目）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/index-bin.mjs` · `thincoder-core/index-discover.mjs`——#137）。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/MEMORY.md`（554 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：旧结构叙述（(d) 类）· 一次性批次材料 · 时点坐标清单。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**（CLI 侧记忆实现住 `src/memory/**`）——本节一律按**现状路径**落笔（`thincoder-core/memory/**`）。符号名与档路径为契约面，**行号未逐条复核**。

### 6.1 总览与目标

记忆系统让 agent 跨会话保存、检索、治理三类知识——个人记忆 · 项目共享记忆 · 团队共享记忆——并同时提供**代码 / 文档索引**（code / doc chunk），使 `memory` / `code_search` / `doc_search` / `repo_outline` 得以在当前代码库内检索。

- **存储统一单文件**：`~/.thincoder/memory.db`（`node:sqlite`，FTS5 虚表 + BM25 排序 + 向量 BLOB，零第三方依赖）。
- **三层记忆**（写入时指定 layer）：personal（纯 DB 行）/ project（项目 markdown 文件为源，DB 为索引）/ team（git 仓库同步）。
- **双路检索**：FTS5（含 CJK 逐字分段）+ 向量余弦（懒构建，失败静默降级纯 FTS）。
- **磁盘为真相**（project / team 层）：markdown 文件即知识本体，可人工编辑、可 git 管理；DB 只是**可重建索引**。
- **单一 agent 工具面**：`memory` 单工具、`action` 路由五动作（search / put / list / delete / clear）——旧 `memory_put` / `search` / `delete` 三个裸工具已合并退役。

默认位置定义于 `thincoder-core/config.mjs` 的 `config.memory` 段（`dbPath` / `projectDir` / `team`），可在 `~/.thincoder/config.json` 覆盖。

### 6.2 存储与分层

**DB**：`~/.thincoder/memory.db`（默认）。打开时设 `PRAGMA journal_mode = WAL`（读写不互相阻塞，检索与后台索引可并发）与 `PRAGMA busy_timeout`（多进程同库防 SQLITE_BUSY）。

**schema 版本**：`SCHEMA_VERSION = 9`（`thincoder-core/memory/schema.mjs`），经 `PRAGMA user_version` 递进迁移（单事务，任一失败整体回滚，不残留半成品）。表：

| 表 | 内容 | FTS5 虚表 | embedding |
|---|---|---|---|
| `entries` | personal 层条目行（纯 DB，无 md 文件） | `entries_fts` | BLOB 列 |
| `files` | project / team 层 md 文件的索引行 | `files_fts` | BLOB 列 |
| `code_chunks` | 代码分块 | `code_chunks_fts` | BLOB 列 |
| `doc_chunks` | 文档分块 | `doc_chunks_fts` | BLOB 列 |
| `meta` | 嵌入模型键 / `last_indexed_commit` 锚 | — | — |

所有 FTS 虚表由 `*_ai/_ad/_au` 行触发器自动同步（增删改即时）；**embedding 是各表随行 BLOB 列**——行删即向量随行删除，**无独立 vectors 表**。

**三层**（写入时指定 layer）：

- **personal**——个人记忆，**纯 `entries` 行**，无 markdown 目录；检索 / 清理经行触发器随行完成。
- **project**——项目共享，`{cwd}/.thincoder/memory/` 目录，**markdown 文件为源、DB 为索引**；`putMarkdown` 写文件 + 立即索引，`syncDir` 按目录增量入 DB（按 mtime）。文件可人工编辑、可 git 管理；project 层写文件**不做** git 操作（用户的 repo 不被自动提交）。
- **team**——团队层，git 仓库同步（`thincoder-core/git/gitmem.mjs`）：`commitAndPush` 写文件后 `git add` / `commit` / `push`（push 失败先 `pull --rebase` 再重试一次；真冲突 `rebase --abort` 保持仓库干净并抛带人工解决指引的错误）；`pullTeam` 拉取远程。

**条目类型**：`rule | knowledge | decision | pattern`（`VALID_TYPES`；非法 type 明确报错）。

**uid 格式**：`personal:<n>` / `project:<origin>:<path>` / `team:<origin>:<path>`。uid 的 path 段按**最后一个 `:`** 切取——Windows 盘符 origin（如 `project:C:\dir:file.md`）使朴素 `:` 切分失效；兼容旧 `project::file.md` 空 origin 形态。

#### 6.2.1 markdown 文件即真相

- `putMarkdown(memory, { layer, dir, type, title, content, tags, author })`——写 md 文件（`serializeEntry`）后立即 `indexMarkdownFile`，返回文件名。project 不碰 git；team 由调用方走 gitmem。
- `syncDir(memory, { layer, dir })`——扫描目录：新增 / 按 mtime 变更的条目重索引，**消失条目从索引删除**；损坏 / 解析失败文件跳过并记错。返回 `{ added, updated, removed, skipped }`。
- `indexMarkdownFile`——单个 md 解析（`parseEntry` 读 frontmatter 的 type / title / tags / author）后 UPSERT 进 `files` 表。
- DB 只是可重建索引：删掉 DB 后重新 `syncDir` 可重建 project / team 层（personal 层纯 DB，重建需经 git / 备份）。

### 6.3 检索（双路召回 + RRF 合并）

`search(memory, query, { limit })` 返回 `[{ layer, type, title, content, tags, id, rrf }]`（条目经 `fetchEntry` 拉全文，合并分存 `rrf`）。

1. **FTS5 通道**——`buildFtsQuery(query)`：按空白 / 标点切成 token（截断 `FTS_TOKEN_MAX = 16`），再对每个 token 做 CJK 分段，非空 token 以 `"…" OR …` 连接（逐字短语保持邻接精确匹配）。
2. **向量通道**——`ensureEmbeddings` 懒构建：首次检索时批量嵌入存量（`EMBED_BATCH_SIZE = 256`），增量条目单独嵌；嵌入模型变更时清空四表向量重建。候选 cosine 取 top（窗口 `max(limit*4, 20)`）。
3. **RRF（k = 60）合并去重**——FTS 优先、向量补齐；按合并分排序取 `limit`。

**CJK 分段**（`segmentCJK`）：FTS5 的 unicode61 无中文分词器，将汉字 / 假名 / 谚文逐字以空格分隔；**写入与查询两侧用同一处理**才可召回（两字词如「分号」→「分 号」短语仍命中；ASCII 保持整词）。

**失败静默降级**：无嵌入 key / 嵌入调用失败 → 回退**纯 FTS**（检索不阻塞、不报错，console 记一条降级日志）。纯 FTS 下 `docSearch` / `codeSearch` 的 ftsQuery 为空且无 embedder 时返回 `[]`。

**layer 限定**：search 检索面 = personal + project（当前 context 项目 origin）+ team 全 origin。`memory.projectOrigin` 存在时，files / 向量候选只取 `layer = 'team' OR origin = projectOrigin`（其他项目的行不进当前搜索）。

**输出契约（action search）**：命中行 `[<layer>][<type>] <title> (id=<uid>)` + 换行 + 内容；无命中 / 空 query → `(no matching memories)`。空 query（含纯空白）**短路**——直接返回空文案，不触发检索。

**检索工具**（同构双路，均 readonly）：`codeSearch` / `docSearch` 限定 `{ kind: code|doc|memory }`，返回 `{ file, startLine, endLine, snippet, score }`，暴露为 `code_search` / `doc_search`。会话消息历史**不在记忆**——检索会话历史用 `read_history`（本层 `SESSION.md` 权威）。

### 6.4 代码 / 文档索引

**存储位置**：代码 / doc 分块同样落在 `~/.thincoder/memory.db` 的 `code_chunks` / `doc_chunks` 表（FTS5 + embedding BLOB），**不是独立目录 / 文件**。chunk 行含 `{ origin(项目根), path, language, content, line_start, line_end, mtime_ms, embedding }`；`origin` 区分多项目。

**文件清单与跳过**：`listProjectFiles` 用 `git ls-files --cached --others --exclude-standard`（git 仓库内，尊重 .gitignore；非 git 仓库返回空）；按扩展名过滤（`CODE_EXTS` / `DOC_EXTS`）；跳过 `SKIP_DIRS`（node_modules / .git / dist / build / coverage / 系统目录等）与点目录；超大文件跳过（代码 >1MB、文档 >512KB）。

**同步策略**（`thincoder-core/memory/code-sync.mjs`）：

- **git diff 增量优先**——`gitSync`：比对 `last_indexed_commit`（`meta` 键，`markIndexedCommit` 写入）与当前 HEAD 的 `git diff --name-only --diff-filter=ACMRTD` + dirty 工作区，只重索引改动文件（比全扫快一个量级）。改动数超 `DIFF_FULL_SYNC_THRESHOLD = 200` 则回退全量同步并更新锚；失败数 = 0 才推进 commit 锚。
- **全量扫描兜底**——`codeSync`（按 mtime 跳过未变文件 + 收尾删 stale）+ `docSync`（doc_chunks，`onProgress` 上报阶段计数），均 `markIndexedCommit` 记基线；非 git / 首次 / diff 过大走此路径。`/reindex` 命令清空三表后全量重建。
- **单文件增量**——`reindexFile(memory, cwd, absPath)`：**write / edit / delete 工具执行后由主循环后台调用**（`record-results.mjs` 的 `FILE_MUTATORS` 钩子，fire-and-forget，不阻塞 agent 循环；失败注入 `[System reminder: background indexing failed ...]` 待办提醒）。只重建该路径 chunk；路径越出 cwd / 命中跳过目录 / 超大 / 无法 stat 时跳过或删 stale chunk。

**分块**（`thincoder-core/memory/code-index.mjs`）：

- **代码**——小文件（`lines.length <= BIG_FILE_LINES = 2000`）单 chunk；大文件按**顶层符号边界**切（`extractSymbols` 提取 JS/TS 的 function / class / const 导出；`extractPySymbols` 提取 Python def / class），符号间内容并入前一个符号 chunk，每 chunk 前并其 JSDoc / docstring 以提升检索质量；chunk 类型 `file`（整文件）或 `symbol`。
- **文档**——`chunkMarkdown`：按 `#{1,4}` 标题切块，每 chunk 的 heading = `${filepath} > <标题文本>`（单级前缀，不累积嵌套子标题）。

**doc 索引同步**（`docs.mjs` 的 `docSync`）：扫描 `*.md` / `*.mdc` / `*.txt` / `*.rst` / `*.adoc` → 分块 → upsert doc_chunks（mtime 增量）。

**检索实现**（`codeSearch` / `docSearch`）：FTS 候选（`bm25` rank，窗口 `max(limit*4, 20)`）→ 向量 cosine 重排 → RRF 合并取 `limit`；返回 chunk 带 `_score`。`repo_outline` 工具复用 `code_chunks` 的 path 清单生成文件依赖大纲。

### 6.5 主循环集成与门禁

- **工具暴露**：`memory`（`memoryTools`，§6.6）+ `code_search` / `doc_search`（readonly 检索）+ `repo_outline`（复用 code_chunks）。
- **启动**：`createMemory` 开库并迁移；`syncDir` project 层 `.thincoder/memory/`；`startup.mjs` 启动时 `gitSync`（失败回退 `codeSync` / `docSync`）异步建代码 / doc 索引。
- **search 结果注入**：`doc_search` / `memory search` 结果按需注入 system 上下文（`<untrusted_memory>` 包裹——不可信内容区）。
- **`put` 自动嵌入选块**：新条目写 DB 后，`ensureEmbeddings` 若嵌入器可用则异步补向量（不阻塞写入）；每次嵌入批次后顺带回填 code / doc chunks 向量。
- **门禁**：`search` / `list` 只读放行（免权限询问）；`put` 侧效门；批量 delete / clear = `confirm:true` + layer 门禁（**confirm 参数即门禁**——直接删裁定，无第二层人类确认）。
- **只读子代理工具集过滤**：`explore` / `plan` / `consult` 只读子代理按**工具级 readonly** 过滤工具表——memory 工具 `readonly: false`（工具级），故从这些子代理的工具表消失（不再能 `memory search`）；动作级只读分类只覆盖 dispatch 门位，**不覆盖**子代理工具集过滤。

### 6.6 memory 工具契约（单工具五动作）

**单一 agent 工具** `memory`，`action` 枚举 `["search", "put", "list", "delete", "clear"]`，参数按 action 分支；工具级 `readonly: false`。action 枚举 / 参数形态 / 描述文本住 `thincoder-core/memory/docs.mjs`（`MEMORY_TOOL_DESCRIPTION`）——双端**语义同源**（内容断言各自 fail-when-unchanged）。

**layer 值域按端**：CLI = personal / project / team；VSC 无 team（收到 team 明确拒绝并指引 CLI）。action 侧缺省 / 必填：`put` 缺省 personal；`search` / `list` 缺省搜全部层；`delete`（批删）/ `clear` 必填 layer。

#### 6.6.1 五动作

- **search**（只读）——`{ query, layer?, limit? }`：自然语言查；limit 默认 5。输出带 id（`[layer][type] title (id=uid)`）。空 query 短路（§6.3）。
- **put**——`{ type, title, content, tags?, layer? }`：type 限四类；写 personal（纯 DB 行）或 project / team（`putMarkdown`）。project / team 输出带完整 uid（与 delete 接受的 id 一致）。
- **list**（只读）——`{ layer?, type?, keyword?, limit? }`：过滤输出紧凑清单，**不拉全文**；limit 默认 50。
- **delete**——单条形态 `{ id, layer? }`（§6.6.2）+ **条件批量形态** `{ layer, type 和/或 keyword, confirm:true }`（§6.6.3）。
- **clear**——`{ layer: "personal", confirm: true }` 清空 personal 全部；layer 必填且**仅接受 personal**，project / team 明确拒绝。

**list / 批量删的 origin 限定**：`files` 层行（list + 批量 delete）按**当前上下文目录**（projectDir / team dir）过滤——其他项目 / 团队克隆的存量行不进入 list / 批量删（工具只能动它能定位的文件）；单条 delete 仍按 uid 全语义；team layer 的 search 仍全 origin（检索面不变）。

#### 6.6.2 `deleteByUid` 路由

按 uid 精确删除单条（`thincoder-core/memory/delete.mjs`），返回被删条目 `{ id, layer, type, title, content, tags }`（删除前 `fetchEntry` 读取；缺文件退 path 段查 files 行，再退 `parseEntry` 磁盘重建）。

- **personal**：`personal:<n>`（**裸数字 `<n>` 自动解析为 `personal:<n>`**）→ `DELETE FROM entries` 行；FTS 由 `entries_ad` 触发器同步，embedding BLOB 随行删除，零残留。
- **project / team**：删除 markdown 文件 + `syncDir` 清索引——**不手删 `files` 行**（`syncDir` 单源）。
- **路径包含校验**（`assertPathInside`）：resolve 后路径必须仍在 layer 目录内；`..` / 绝对路径（含 Windows 反斜杠变体，分隔符无关校验）拒绝。
- **ENOENT 容错**：文件已缺视为已删继续（不中断），仍 `syncDir` 清索引行。
- **team 删除语义**：本地删 + 清索引，**不做 git 提交 / 推送**（git 传播是 gitmem 职责；删除可逆性优先——工具误删不自动推全团队）；远端未删时下次 pull 可能复活已删文件——远端删除需经 git 工具。
- **CLI `memory remove` 命令**：底层 `remove()` 收敛为 `deleteByUid` 兼容壳（boolean 语义保留）——命令行与工具**同一路由**，避免两套行为漂移。
- **layer 术语统一**：核心层用 `layer`（DB 列名 + 结果字段 + uid 前缀），工具层参数曾用 `scope`——已**统一为 layer**（工具面 + 描述 + 模型可见输出 + 错误串 + CLI 人类命令面 `--layer`）；DB 列不动（无 schema 迁移）。`delete` 的 layer **可选**（传了则校验 id 前缀匹配防误删，不传则按 id 前缀直接路由——与 search / list 找到的 id 直接对接）；批删形态必填 layer。文件定位尊重 uid 内嵌 origin（非当前 dirs[layer]）。
- **错误**：不存在 → `memory <uid> not found in layer <layer>`；id 前缀与 layer 不匹配 → 拒绝。

#### 6.6.3 批量删 = 磁盘为真相

- **动机**：磁盘上有、索引无行的 md 文件（孤儿：外部拷贝 / gitmem pull / 早期索引失败遗留）此前对 list 不可见、对批量删免疫——`deleteWhere` 每次尾部 `syncDir` 又把幸存孤儿重新入表，表现为清空共享层需多轮循环 delete。改**磁盘为真相**后孤儿一轮即删。
- list 与批量删预览 / 执行用**同一匹配面**；`deleteWhere` 尾部 `syncDir` 照旧（收尾重索引幸存者 + 清 stale）。
- project / team 批量删执行：逐 path `assertPathInside` + `unlink`（ENOENT 容错），再对该层 `syncDir` 一次。
- **登记取舍**：未入表孤儿在 `syncDir` 修复前不进 search 结果（`files` 表仍服务 search / embedding——索引层语义不变）。

#### 6.6.4 输出契约（逐字——不改措辞）

两端同文，测试逐字断言。占位：`N` = 实际条数，`M` = 截断前总数，`X` = layer 名。

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

**批量删门禁**：layer 必填 + type / keyword **至少其一**（无过滤批量删 = 整层清空，绕过 clear 拒共享层门禁 → 拒绝并指引）；confirm 缺失 = **不删**，返回预览让调用方带 confirm 重发。**clear 门禁**：layer 必填且仅接受 personal；`confirm: true` 必填；project / team 拒绝。

#### 6.6.5 distill 命令 layer 统一（CLI 单端）

- `--scope` → `--layer`（usage / 帮助 / bash / zsh / fish completion 全改）；**遇 `--scope` 输入显式报错**（"distill: --scope renamed to --layer — update your invocation"）——现解析器不校验未知 flag，须加显式检查（防静默失效：旧 `--scope=project` 静默落 personal 最危险）；`--scope=X` 与 `--scope X` 两形态均须报错。
- **JSON 读时归一**（单点）：`const layer = candidate.layer ?? candidate.scope ?? "personal"`——新字段优先旧字段兜底（消化旧 LLM 输出；无持久转录 JSON——scope 只存在于 LLM 候选输出，现产现用）。
- 值域语义不变（提示仍引导 personal / project；`saveCandidate` 支持 team 属防御性）。

### 6.7 配置路径字段家目录展开（`~`——单一规范化点）

**病灶**：全仓无 `~` 展开逻辑（`startsWith("~")` 零命中）；`loadConfig()` 合并用户配置后不做路径归一 ⇒
照抄 README 示例 `"dbPath": "~/.thincoder/memory.db"` 进 config.json 后，`createMemory()` 先 `mkdirSync(dirname(dbPath), { recursive: true })`——
以 cwd 为基准建**字面量 `~/.thincoder/` 目录树**再在 cwd 开 / 建库。无警告；用户真实 home 库中的存量记忆「消失」（实为换了库），且 cwd 被污染出 `~` 目录树。

**同病四字段与读点**：`memory.dbPath`（schema 开库点 + 调用点）· `memory.projectDir`（七点位 `join(cwd, …)`）· `memory.team.dir`（`teamConfig()` → `ensureClone` / `syncDir` / `commitAndPush`）· `shell`（`thincoder-core/tools/bash.mjs` → `spawn(…, { shell })`——响亮失败，属同病）。

**展开器契约**（`thincoder-core/expand-home.mjs`——纯函数、零依赖；`home` 第二参 = 测试注入缝，生产缺省 `homedir()`）：

- `"~"` → `home`；`"~/x/y"` → `join(home, "x/y")`；`"~\\x\\y"` → 余段 `\\` 先归一为 `/` 再 join（跨端统一——配置常跨平台复制）；`"~/"` · `"~\\"` → `home`；
- `"~user"` · `"~abc"` · `"a/~/b"` · `"x~"` → **原样**（仅前缀形态；`~user` 需 passwd / Windows 用户解析——不猜用户）；
- 非字符串（`null` / `undefined` / 数字 / 对象）→ 原样透传（类型护栏——`team.dir` 未设即 `undefined` 透传）。

**落点**（`thincoder-core/config.mjs`）：合并块之后、providers 归一之前——四字段**只读归一**（**不写回磁盘**：保配置原文与可移植性，换机 / 换用户名后配置仍成立）；`team` 无 `dir` 键时**不注入**（零键面变化）；`shell: null` / `memory.team: null` / `dir` 缺省 → 归一后仍为 `null` / 缺省（消费端 `??` 判据零变化）。

**projectDir 消费侧基准解析**（七点位）：`join(cwd, p)` → `isAbsolute(p) ? p : join(cwd, p)`。理由：`~` 展开产出**绝对路径**，而 `path.join(cwd, "/home/u/x")` 会拼成 `<cwd>/home/u/x`（join 不做绝对绕过）；**相对形态走原 `join` 分支** ⇒ 与修前逐字相同。

**登记（不做）**：运行时写入面的**当次**展开（TUI `/shell` 热应用 · settings 工具 set · VSC 面板写面——落盘原文，下次启动 `loadConfig()` 即展开；`shell` 是唯一会话内实时消费键）；ACP 记忆库硬编码 `join(configDir, "memory.db")`（不读 `memory.dbPath`——既有分叉，与 `~` 无因果）；历史受害数据（cwd 下已生成的字面 `~` 目录不自动搬移）；`~user` 形态**残余静默面**（透传后仍建字面 `~user` 目录——同病灶）。

### 6.8 检索向量加载上界

- **病灶**：三张表的向量通道全表 `.all()` 物化后逐行 cosine + 全量排序（无 SQL LIMIT、无分块）——结果侧本身有界（候选 = `max(limit×4, 20)`），病灶在**扫描期**全量物化；FTS 通道已有 `LIMIT`（对照面）。
- **分块常量**：`SCAN_CHUNK_ROWS = 2_000`（单源，三处共用）。
- **扫描形态**：每块物化 `{ uid, embedding }` → 逐行 `fromBlob` / cosine → top-K 有界插入（候选集 ≤ `max(limit×4, 20)`——既有口径）；块内存随迭代释放。实现面 = 绑定层迭代器优先、rowid 游标分页兜底（两者语义等价：全表逐行、无重复无遗漏）。
- **top-K 选择**：升序小顶堆（K 上限）；并列分数按「先到先留」（与「全量 sort 稳定序」等价）。
- **对外结构不变**：返回 `[{ id, score }]` 候选（既有消费面 RRF 融合不变）；FTS 通道与 `projectOrigin` 过滤零改。
- **可测缝**：扫描器接受注入的 `runChunkedQuery`（默认真实 DB 实现——测试以假数据源直测块大小 / top-K / 等价性）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| D-MEM1 | 嵌入懒构建 + 失败降级纯 FTS | 无 key 也能用；首次检索延迟可接受 |
| D-MEM2 | CJK 逐字分段（写入与查询两侧同一处理） | FTS5 无中文分词器；单字索引保召回；BM25 排序仍合理 |
| D-MEM3 | git diff 增量同步（超阈值回退全扫） | 大仓库全扫太慢；diff 只处理改动文件 |
| D-MEM4 | schema 按 `user_version` 递进迁移（破坏性变更显式 drop + 重建） | 由下次同步自动重建索引 |
| D-MEM5 | 磁盘为真相（list / 批量删） | 孤儿文件一轮即删；工具所见即磁盘所存 |
| D-MEM6 | 直接删 + `confirm` 参数即门禁 | 误删可审计重建（删除前返回内容）；否决两段式人工确认 |
| D-MEM7 | 展开点 = `loadConfig()` 单点 | 权威单点、漏点面为 0、可回归；否决「各消费点各自展开」（漏点不可枚举）·「读取代理层」（破坏 config 普通对象契约）·「写盘归一」（毁原文与可移植性） |
| D-MEM8 | 展开器住新模块 `expand-home.mjs` | `config.mjs` 已近硬限且同因已有拆分档；纯函数独立单测面干净；否决内联 |
| D-MEM9 | 支持形态 = `~` / `~/` / `~\`，**不含** `~user` | `~user` 需 passwd / Windows 用户名解析——收益低、双平台语义不一、猜错即静默错域 |
| D-MEM10 | projectDir 消费侧用 `isAbsolute ? p : join(cwd, p)`（非 `resolve`） | `resolve` 对相对输入亦归一二进样（尾斜杠 / `..` 折叠）⇒ origin 串非零 delta |
| D-MEM11 | 磁盘原文不动（读时归一） | 写回绝对路径毁可移植性 + 存量手写配置永不展开 |
| D-MEM12 | `shell` 同批同机制纳入 | 分批做 = 同 helper 分叉 / 漏点；`shell` 是 spawn 路径——同病同修 |
| D-MEM13 | 检索向量通道 = 流式分块扫描 + 有界 top-K | 峰值 = 块 + K，召回语义不变（仍全表评分）；否决「结果缓存 / LRU」（不解首次扫描峰值）·「FTS 预筛再向量」（召回语义变化）·「ANN 向量索引」（依赖 / 架构级——登记为后续项） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/MEMORY.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 档首「状态：当前态（2026-09 整理）」+ 文末「变更记录」 | 整理史与逐批变更流水账 | 历史叙述——本档自有变更记录；旧档即该历史的载体 |
| 文末「漂移更新」块 | 旧设计（`{cwd}/.thincoder/index/` manifest + vectors.bin · ≤30 行 / 3 行重叠分块 · 旧三工具名） | **已作废的旧结构叙述**——现行形态已入 §6.2 / §6.4 / §6.6.1 |
| §6.2 内「delete scope 不一致 bug 修复」作废族 | 作废前提的更正过程叙述 | 结论（layer 统一 / id 前缀自路由）已入 §6.6.2 |
| §6.5 内「现状（explore 一手核实）」逐档行号清单 | 时点核实清单（`bin/thincoder.mjs` / `src/cli/distill-command.mjs` / `src/distill.mjs` 等行号） | 时点坐标——实现面随演进；契约（改名 + 显式报错 + 读时归一）已入 §6.6.5 |
| §9.2 / §9.5 否决论证全文 | 逐条否决理由原文 | 结论已提炼入 §7（D-MEM7–D-MEM12） |
| §7「关键设计决策」表 | 六条决策 | 已并入 §7（D-MEM1–D-MEM6，同一来源） |

### 8.2 不并项登记（一次性批次材料——**不并**）

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| §6.5 受影响文件表 + 验收 AC1–AC6 | distill layer 统一批的文件与验收清单 | 一次性批次材料（文档分层纪律）——批次档承载 |
| §9.4 / §9.6 / §9.7 / §9.10 | 受影响文件表 · 用例表 · AC 表 · 对账清单（家目录展开批） | 同上 |
| §10.5 / §10.6 / §10.7 | 受影响文件表 · 用例表 · AC 表（向量上界批） | 同上 |

### 8.3 已知限制与后续项（a 类——并入）

- **VSC 镜像面**：memory 工具面（五动作 + layer 值域按端）语义同源；VSC 存储为**文件制**（检索实时扫文件）——存量根目录 legacy 条目（scope 子目录布局前）**search 可见但 delete 不可删**（目录定位语义）——已知限制，接受。
- **只读子代理不能 `memory search`**（§6.5——工具级 readonly 过滤）；如需恢复，改 allowed 集为动作感知。
- **doc-sweep**：`docs/` 若干现状描述文件仍含旧 memory 三工具名 / 向量目录旧说——活文收正列为独立后续任务。
- **CLI 人类命令面**（`thincoder memory <list|search|put|remove>`）：`list` / `search` / `put` 为 personal-only 核心面（search limit 10、list 支持 `--type`）；`remove` 走同一 `deleteByUid` 路由（uid 全 layer + 裸数字兼容）——命令行与工具核心路由复用，无漂移；命令面**无**共享层 list / 过滤形态、**无** clear / 批量删（那些是 agent 工具面能力）。

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **334 行**（B 轮并入前 80 行）——**超 300 行软线**（未超 500 硬限）⇒ 须拆分规划。

| # | 拆分面 | 去向 | 状态 |
|---|---|---|---|
| 1 | §6.7 配置路径家目录展开 | 配置板块（本层 `CONFIG.md`）——该机制作用于 config 装载面 | **建议**（待父侧裁定——迁移批落地） |
| 2 | §6.4 / §6.8 索引与向量上界面 | 与 §6.3 检索合族为「检索与索引」子档 | **待裁定**（与「一板块一档」惯例的关系同 `AGENT-LOOP.md` §9） |

**落地时点** = 迁移批（本批不拆）；拆分动作不得改语义（只修引用）。

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #75 / #82 / #133–#137 / #168 / 映射行 · §2.5.1 A1–A3 · §2.12.2 第 11 行 · §2.12.3 第 1–2 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（S1 收口轮）：§5 补**核内落点行数**指针（`index-bin.mjs` · `index-discover.mjs`）；§2 裸 basename 锚补路径前缀（`thincoder-vscode/src/index-discover.mjs:5-8`——机检修复）。
- 2026-09-14（**B 轮并入 · 试点批**）：新增 §6 **机制面**（总览与目标 / 存储与分层 / 检索 / 代码与文档索引 / 主循环集成与门禁 / 工具契约五动作 / 家目录展开 / 向量加载上界）·
  §7 **关键决策记录（D-MEM1–13）** · §8 **不并项与历史沿革**（含已知限制并入）· §9 体量与拆分规划；
  来源 = `thincoder-cli/docs/design/MEMORY.md`（**旧档一字未改**——原地作参照历史）；首部加机制面指针一行。本档 80 → **334 行**。
