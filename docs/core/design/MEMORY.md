# 记忆系统（MEMORY）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**：机制 / 契约的实质描述 · 关键决策——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 记忆库 | `thincoder-core/memory.mjs`（转口）+ `src/memory/**`（8 档） | `thincoder-core/memory.mjs` · `memory-tool.mjs` |
| 工具面 | `src/memory/docs.mjs` 的 `memoryTools` | `thincoder-vscode/src/memory-tool.mjs` |
| 索引（代码 / 文档） | `src/memory/code-index.mjs` · `code-sync.mjs` | `src/indexer.mjs` · `index-bin.mjs` · `index-discover.mjs` · `tools/code.mjs`（核面现体 `thincoder-core/memory/code-sync.mjs` / `file-walk.mjs`；`tools/code.mjs` = 端壳改指面） |
| 嵌入 | `src/embedding.mjs` | 同（同路径对） |
| team 层同步 | `src/git/gitmem.mjs` | —（无对位） |
| 子命令面 | `src/cli/memory-command.mjs` | —（无对位） |

**本子系统的归一方向（已裁）**：面向 **CLI 语义**归一（用户裁定 A12——前提失效，非选边）；`node:sqlite` 采纳为定案（`CORE-UNIFICATION.md` §2.11 A8）。

## 2. 核模块裁决行

### 2.1 同路径对

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 75 | `embedding.mjs` | 同路径 | 0.6566 · 异 | ② | 进核 | 融合：取 CLI（每请求 60s 超时 + `toBlob`/`fromBlob`）+ VSC 的本地 RETRYABLE 常量归位 | 分叉 ＝ VSC 缺每请求 60s 超时（`src/embedding.mjs:71`）与 blob 助手（存储介质不同所致）；前提（存储面已随 A12 归一为 CLI sqlite）⇒ 差异消失 | — | S1（建核补齐） |
| 82 | `memory.mjs` | 同路径 | 0.0093 · 异 | ③ | 进核（**同名不同物**：CLI 21 行转口 + `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | 以 CLI 为准（A12——**前提失效，非选边**）；VSC 侧改接线；旧数据迁移另议（§2.5.1 / §2.12.3） | 分叉 ＝ **前提失效**（「VS Code 内置 Node 不支持 sqlite」不成立）；实测 CLI = `node:sqlite` + FTS5（`src/memory/schema.mjs:9,68`）/ VSC 零 sqlite（纯 md，`src/memory.mjs:26-37`） | **①②③** | S1（建核补齐） |

### 2.2 语义对位遍行（同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 133 | `thincoder-core/memory.mjs` + `src/memory/**`（8 档）↔ `thincoder-core/memory.mjs` + `memory-tool.mjs` | ③ | 以 CLI 为准（A12——**前提失效，非选边**） | 分叉 ＝ **前提已失效**（「VS Code 内置 Node 不支持 sqlite」不成立；CLI `node:sqlite`+FTS5 `src/memory/schema.mjs:9,68` / VSC 零 sqlite）⇒ 直接归一；**承 §2.5 #82** | —（承 #82） | S1（建核补齐） |
| 134 | `src/memory/docs.mjs`（`memoryTools`）↔ `thincoder-vscode/src/memory-tool.mjs` | ② | 融合：核内单一 memory 工具面（动作集 / schema / 文案取一侧） | 分叉 ＝ 拆档位置（CLI 工具面住 `memory/docs.mjs:241`）；两端动作集同规格（五动作 / layer 词面）⇒ 前提成立；**随 #82 / A1 归一** | —（承 #82） | S1（建核补齐） |
| 135 | `src/cli/memory-command.mjs` ↔ 核内（VSC 无对位） | ④ | 端特有段：CLI `memory` 子命令面（shell 通道） | 结构性不对称 = **仅 CLI 有 shell 子命令通道**（VSC 无终端子命令面——与 #125 冷 cwd 面同源）；**非**「差异」排除（A9） | — | 不迁（端特有） |
| 136 | `src/memory/code-index.mjs` + `code-sync.mjs` ↔ `src/indexer.mjs` | ③ | 以 CLI 为准（**同一 A12 前提失效**；进核） | 分叉 ＝ 索引存储（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI sqlite 库——CLI `src/**` 零 `.thincoder/index` 命中）；前提同 #82 ⇒ 失效；**随 A1 归一**（核面现体 `thincoder-core/memory/code-sync.mjs`） | —（承 #82） | S1（建核补齐） |
| 137 | （CLI 无切分档）↔ `src/index-bin.mjs` · `index-discover.mjs` | ② | 融合：随核内索引面一并归位（向量编解码 / 走查规则） | 分叉 ＝ 拆档（VSC 拆 3 档 / CLI 2 档）；走查规则（`SKIP_DIRS` / 点目录 / `.thincoder` 特例）两端同源（VSC `thincoder-vscode/src/index-discover.mjs:5-8` 自述「CLI-aligned」）⇒ 前提成立 | — | S1（建核补齐） |
| 168 | `src/git/gitmem.mjs` ↔ 核内（VSC 侧无 team 层同步面） | ③ | 以 CLI 为准（team 层记忆 git 同步）；VSC team 层现行「明确拒绝、指向 CLI」⇒ 随 A1 归一 | 分叉 ＝ team 层处置（VSC 无该层）；**承 #82 / A1** | —（承 #82） | S1（建核补齐） |

### 2.3 工具实现面单端档映射

| 单端档 | 对位 / 处置 |
|---|---|
| VSC `thincoder-vscode/src/tools/code.mjs` | ↔ CLI `memory/docs.mjs` 的 `codeSearchTool` / `docSearchTool` ⇒ 随 #82 |

## 3. 须用户裁条目

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A1 | `memory.mjs`（席位 #82；实为 CLI `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | ①②③ | `node:sqlite` `DatabaseSync` + FTS5（`src/memory/schema.mjs:9,68`）；库 = `~/.thincoder/memory.db`；三层 `personal` / `project` / `team`，**personal = 全机共享的库行**；project 层 = `.thincoder/memory/*.md`（**只扫顶层** `thincoder-core/memory/core.mjs:205-212`） | 零 sqlite——纯仓内 md（`.thincoder/memory/{personal,project}/*.md`，`:26-37`）+ 遗留 `.json` 读兼容（`:150-162`）；两层（`team` 明确拒绝、指向 CLI）；`personal` 落在**仓库目录内** | **以 CLI 为准**（A12——前提失效，非选边）；`node:sqlite` 采纳为定案（§2.11 A8） | ① 记忆存哪变了（VSC 的 personal 由仓内目录 → 全机库）；② 两端**从此可互读**（现状：VSC 读不到 CLI 的库、CLI 不递归读 VSC 的子目录）；③ 旧数据要搬（见 A2）；④ 检索能力（FTS5 + 中文逐字分段）随之而来；⑤ 两侧测试 | **已裁 · 按建议** |
| A2 | 记忆面旧数据迁移（§2.12.3 第 2 行） | ②③ | 有 `memory` 子命令（list / search / put / remove）与 `/reindex`；**无 md / json 导入命令** | 用户既有记忆 = 仓内 `personal` 层 md + 遗留 `.json` + `workspaceState` 的 `thincoder.modelPrefs` | **已裁：① 提供一次性导入器**（md / json → `entries`）——**父侧代选**（用户「全部按建议」未逐字指定本行，已披露 ✓；理由：选 ② 会让 VSC 老用户记忆清空，与「不丢用户数据」相悖）。**落地** = S2 建一次性导入器（`memory import` 子命令面；`modelPrefs` 仍取不到——住 VS Code 状态，不在文件系统）；**边界（裁定）**：本行 = **记忆条目**迁移面——**索引数据面（`.thincoder/index/`）不适用**（零迁移 / 零兼容——§4 第 11 行；重新索引 = 正当路径） | 用户既有记忆保留（md / json → `entries`）；`modelPrefs` 明确不迁（无文件系统载体） | **已裁 · ① 一次性导入器（父侧代选）** |
| A3 | VSC 引擎下限（§2.12.3 第 1 行） | ② | `engines.node = >=24` | `engines.vscode = ^1.85.0` | 抬到 **`^1.104.0`（已裁）**（A13 已裁「可抬」；**原候选 `^1.101.0` 经实核不成立** ✗——见下行与 §2.11 A8）；**不另做真机实测**（资料推导链 + `activate()` 护栏兜底） | 放弃 VS Code < 新下限的用户（A13 已接受该代价）；装上旧宿主 ⇒ 扩展不可用 | **已裁：`^1.104.0` · 不另实测** |

## 4. 对外契约影响

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 11 | **代码索引存储面**（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI `node:sqlite` 库内索引） | 数据面 / 文件格式 | 取 CLI（索引入 sqlite 库；VSC 索引文件面退场） | 旧文件格式**不再写**、**零迁移 / 零兼容**（数据面放弃——**不写导入器**；**重新索引 = 正当路径**——用户裁定）· CHANGELOG | 索引面文档 + 用例 + `thincoder-cli/CHANGELOG.md` ∥ `thincoder-vscode/CHANGELOG.md` | 已裁 · 按建议（承 §2.5.1 A1 / §2.11 A8） |

### 4.1 无法兼容项上抛

| # | 项 | 为何无法兼容（实测 / 证据） | 上抛形态（四要素） | 裁定状态 |
|---|---|---|---|---|
| 1 | **VSC 引擎下限抬升**（`engines.vscode` `^1.85.0` → **`^1.104.0`（已裁）**） | 旧宿主内置 Node < 22.13 ⇒ 无 `node:sqlite`；**且 Electron 35.x（= VS Code 1.101 / 1.102）未获 sqlite 内置修复**（electron/electron #47706 回移分支 = 36 / 37 / 38-x-y）⇒ 原候选 `^1.101.0` 不成立；A13 已裁「抬高、不保留降级路径」⇒ **无兼容路径可给**（给降级路径 = 两套逻辑再现 ✗） | 左端 = VSC 现状（`thincoder-vscode/package.json` 的 `engines.vscode: ^1.85.0`）· 右端 = 新下限 **`^1.104.0`（已裁）** · 建议 = 采纳（A13）· 影响面 = < 新下限用户不可用；**配套护栏** = `activate()` 自检 + 明确提示（不崩） | **已裁：`^1.104.0` · 不另做真机实测**（资料推导链 + `activate()` 护栏兜底）（§2.5.1 A3 / §2.11 A8） |
| 2 | **记忆面旧数据迁移**（VSC `personal` 层 md 档 · 遗留 `.json` 记忆档 · `workspaceState` 的 `thincoder.modelPrefs`） | VSC `personal` = 仓内目录（`thincoder-vscode/src/memory.mjs:26-37`）· CLI `personal` = 用户级全局 sqlite 库行（`thincoder-cli/src/config.mjs:92`）；CLI 侧无导入命令（`thincoder-cli/src/cli/memory-command.mjs:21-63`）· 同步只认顶层 `.md`（`thincoder-core/memory/core.mjs:205-212`）⇒ **无自动迁移路径**；`modelPrefs` 住 VS Code 状态（不在文件系统） | 左端 = VSC 现状（仓内 md 持久）· 右端 = CLI 现状（全局库 + 顶层 md）· 建议 = **① 提供一次性导入器**（md / json → `entries`）或 ② 用户手工迁移 / 丢弃 · 影响面 = 用户既有记忆 + 语义（每仓私有 → 全机共享） | **已裁 · ① 一次性导入器**（**父侧代选**，已披露；落地 = S2 建 `memory import` 面。§2.5.1 A2） |

## 6. 机制面

> **本节内容**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **坐标口径**：本节一律按**现状路径**落笔（`thincoder-core/memory/**`）。符号名与档路径为契约面。

### 6.1 总览与目标

记忆系统让 agent 跨会话保存、检索、治理三类知识——个人记忆 · 项目共享记忆 · 团队共享记忆——并同时提供**代码 / 文档索引**（code / doc chunk），使 `memory` / `code_search` / `doc_search` / `repo_outline` 得以在当前代码库内检索。

- **存储统一单文件**：`~/.thincoder/memory.db`（`node:sqlite`，FTS5 虚表 + BM25 排序 + 向量 BLOB，零第三方依赖）。
- **三层记忆**（写入时指定 layer）：personal（纯 DB 行）/ project（项目 markdown 文件为源，DB 为索引）/ team（git 仓库同步）。
- **双路检索**：FTS5（含 CJK 逐字分段）+ 向量余弦（懒构建，失败静默降级纯 FTS）。
- **磁盘为真相**（project / team 层）：markdown 文件即知识本体，可人工编辑、可 git 管理；DB 只是**可重建索引**。
- **单一 agent 工具面**：`memory` 单工具、`action` 路由六动作（search / put / list / delete / clear / maintain）。

默认位置定义于 `thincoder-core/config.mjs` 的 `config.memory` 段（`dbPath` / `projectDir` / `team`），可在 `~/.thincoder/config.json` 覆盖。

### 6.2 存储与分层

**DB**：`~/.thincoder/memory.db`（默认）。打开时设 `PRAGMA journal_mode = WAL`（读写不互相阻塞，检索与后台索引可并发）与 `PRAGMA busy_timeout`（多进程同库防 SQLITE_BUSY）。

**schema 版本**：`SCHEMA_VERSION = 10`（`thincoder-core/memory/schema.mjs`），经 `PRAGMA user_version` 递进迁移（单事务，任一失败整体回滚，不残留半成品）。表：

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

**嵌入输入文本（三路）**：`entries`/`files`（`thincoder-core/memory/core.mjs` 的 `ensureEmbeddings`）· `code_chunks`（`memory/code-sync.mjs`）· `doc_chunks`（`memory/docs.mjs`）送 embedding 的文本 =
前缀（`title` / `heading || path` / `path :: symbol`）+ `content` 截断至 `EMBED_TEXT_MAX_LEN = 2000`。

截断 = 核级单一来源 `thincoder-core/text-budget.mjs` 的 `safeSliceUTF16`（UTF-16 码元安全——截点落高代理时整对丢弃）。
emoji 跨界 = 严格 UTF-16 解析端（硅基流动）400 / 20015 ⇒ 查询侧 `query` 不截断、原样送（非孤立代理生成点）。
**发送前清洗**——embedding 请求体构造时逐条施 `sanitizeLoneSurrogates`（`thincoder-core/escape.mjs` 复用——消息面 sanitize 本不覆盖 embedding 路径）

⇒ 孤立代理文本（含已入库毒行）发前净化；**毒行隔离**——补嵌三面（`entries`/`files` ∥ `code_chunks` ∥ `doc_chunks`）遇 400 类批失败改**逐条独试**：
成功者照写、仍败者跳过 + 一行可见回执（backlog 不被单条毒行堵死）；400 不进 RETRYABLE（快速失败 = 隔离层判据）。机制单源 = §7 D-MEM31。

**CJK 分段**（`segmentCJK`）：FTS5 的 unicode61 无中文分词器，将汉字 / 假名 / 谚文逐字以空格分隔；**写入与查询两侧用同一处理**才可召回（两字词如「分号」→「分 号」短语仍命中；ASCII 保持整词）。

**失败静默降级**：无嵌入 key / 嵌入调用失败 → 回退**纯 FTS**（检索不阻塞、不报错，console 记一条降级日志）。纯 FTS 下 `docSearch` / `codeSearch` 的 ftsQuery 为空且无 embedder 时返回 `[]`。

**layer 限定**：search 检索面 = personal + project（当前 context 项目 origin）+ team 全 origin。`memory.projectOrigin` 存在时，files / 向量候选只取 `layer = 'team' OR origin = projectOrigin`（其他项目的行不进当前搜索）。

**输出契约（action search）**：命中行 `[<layer>][<type>] <title> (id=<uid>)` + 换行 + 内容；无命中 / 空 query → `(no matching memories)`。空 query（含纯空白）**短路**——直接返回空文案，不触发检索。

**检索工具**（同构双路，均 readonly）：`codeSearch` / `docSearch` 限定 `{ kind: code|doc|memory }`，返回 `{ file, startLine, endLine, snippet, score }`，暴露为 `code_search` / `doc_search`。会话消息历史**不在记忆**——检索会话历史用 `read_history`（本层 `SESSION.md` 权威）。

### 6.4 代码 / 文档索引

**存储位置**：代码 / doc 分块同样落在 `~/.thincoder/memory.db` 的 `code_chunks` / `doc_chunks` 表（FTS5 + embedding BLOB），**不是独立目录 / 文件**。chunk 行含 `{ origin(项目根), path, language, content, line_start, line_end, mtime_ms, embedding }`；`origin` 区分多项目。

**文件清单与跳过**：`listProjectFiles` 首选 git（`git ls-files --cached --others --exclude-standard`——尊重 .gitignore）；**非 git 树回落文件系统 walk**（`memory/file-walk.mjs`，无 git 时索引仍可用；walk 不读 .gitignore、按 `MAX_WALK_FILES = 20,000` 截断且截断必落日志）。

按扩展名过滤（`CODE_EXTS` / `DOC_EXTS`）；跳过 `SKIP_DIRS`（node_modules / .git / dist / build / coverage / 系统目录等）与点目录；超大文件跳过（代码 >1MB、文档 >512KB）；范围排除谓词见 §6.14。

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

### 6.6 memory 工具契约（单工具六动作）

**单一 agent 工具** `memory`，`action` 枚举 `["search", "put", "list", "delete", "clear", "maintain"]`，参数按 action 分支；工具级 `readonly: false`。
描述文本 = `thincoder-core/tool-docs/memory.md`（`DESC()` 单一解析面——接线 `thincoder-core/memory/memory-tool.mjs:57`）——双端**语义同源**（内容断言各自 fail-when-unchanged）。

**layer 值域按端**：CLI = personal / project / team；VSC 无 team（收到 team 明确拒绝并指引 CLI）。action 侧缺省 / 必填：`put` 缺省 personal；`search` / `list` 缺省搜全部层；`delete`（批删）/ `clear` 必填 layer。

#### 6.6.1 六动作

- **search**（只读）——`{ query, layer?, limit? }`：自然语言查；limit 默认 5。输出带 id（`[layer][type] title (id=uid)`）。空 query 短路（§6.3）。
- **put**——`{ type, title, content, tags?, layer? }`：type 限四类；写 personal（纯 DB 行）或 project / team（`putMarkdown`）。project / team 输出带完整 uid（与 delete 接受的 id 一致）。
- **list**（只读）——`{ layer?, type?, keyword?, limit? }`：过滤输出紧凑清单，**不拉全文**；limit 默认 50。
- **delete**——单条形态 `{ id, layer? }`（§6.6.2）+ **条件批量形态** `{ layer, type 和/或 keyword, confirm:true }`（§6.6.3）。
- **clear**——`{ layer: "personal", confirm: true }` 清空 personal 全部；layer 必填且**仅接受 personal**，project / team 明确拒绝。
- **maintain**——`{ confirm? }`：索引自维护一卷（鬼行 GC ∥ 压实 ∥ 备份轮转——机制 ∕ 安全 ∕ 触发 = §6.14 面 ⑤）；缺省 = 干跑（计划 + 逐动作读数——零写），`confirm:true` 落写。无 layer 参数（库全局操作——非层内）；输出 = 逐动作段（执行 ∥ 跳过 + 理由 + 读数——非 §6.6.4 逐字表内面）。

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

**同病四字段与读点**：`memory.dbPath`（schema 开库点 + 调用点）· `memory.projectDir`（七点位 `join(cwd, …)`）· `memory.team.dir`（核 `thincoder-core/agent/assemble.mjs` `teamConfig()` → `ensureClone` / `syncDir` / `commitAndPush`）· `shell`（`thincoder-core/tools/bash.mjs` → `spawn(…, { shell })`——响亮失败，属同病）。

**展开器契约**（`thincoder-core/expand-home.mjs`——纯函数、零依赖；`home` 第二参 = 测试注入缝，生产缺省 `homedir()`）：

- `"~"` → `home`；`"~/x/y"` → `join(home, "x/y")`；`"~\\x\\y"` → 余段 `\\` 先归一为 `/` 再 join（跨端统一——配置常跨平台复制）；`"~/"` · `"~\\"` → `home`；
- `"~user"` · `"~abc"` · `"a/~/b"` · `"x~"` → **原样**（仅前缀形态；`~user` 需 passwd / Windows 用户解析——不猜用户）；
- 非字符串（`null` / `undefined` / 数字 / 对象）→ 原样透传（类型护栏——`team.dir` 未设即 `undefined` 透传）。

**落点**（`thincoder-core/config.mjs`）：合并块之后、providers 归一之前——四字段**只读归一**（**不写回磁盘**：保配置原文与可移植性，换机 / 换用户名后配置仍成立）；`team` 无 `dir` 键时**不注入**（零键面变化）；`shell: null` / `memory.team: null` / `dir` 缺省 → 归一后仍为 `null` / 缺省（消费端 `??` 判据零变化）。

**projectDir 消费侧基准解析**（七点位）：`join(cwd, p)` → `isAbsolute(p) ? p : join(cwd, p)`。理由：`~` 展开产出**绝对路径**，而 `path.join(cwd, "/home/u/x")` 会拼成 `<cwd>/home/u/x`（join 不做绝对绕过）；**相对形态走原 `join` 分支** ⇒ 与修前逐字相同。

**登记（不做）**：运行时写入面的**当次**展开（TUI `/shell` 热应用 · settings 工具 set · VSC 面板写面——落盘原文，下次启动 `loadConfig()` 即展开；`shell` 是唯一会话内实时消费键）；ACP 记忆库硬编码 `join(configDir, "memory.db")`（不读 `memory.dbPath`——既有分叉，与 `~` 无因果）；历史受害数据（cwd 下已生成的字面 `~` 目录不自动搬移）；`~user` 形态**残余静默面**（透传后仍建字面 `~user` 目录）。

### 6.8 检索向量加载上界

- **分块常量**：`SCAN_CHUNK_ROWS = 2_000`（单源，三处共用）。
- **扫描形态**：每块物化 `{ uid, embedding }` → 逐行 `fromBlob` / cosine → top-K 有界插入（候选集 ≤ `max(limit×4, 20)`——既有口径）；块内存随迭代释放。实现面 = 绑定层迭代器优先、游标分页兜底（两者语义等价：全表逐行、无重复无遗漏）；**游标列（PK 序）见 §6.10 修法 A1**。
- **top-K 选择**：升序小顶堆（K 上限）；并列分数按「先到先留」（与「全量 sort 稳定序」等价）。
- **对外结构不变**：返回 `[{ id, score }]` 候选（既有消费面 RRF 融合不变）；FTS 通道与 `projectOrigin` 过滤零改。
- **可测缝**：扫描器接受注入的 `runChunkedQuery`（默认真实 DB 实现——测试以假数据源直测块大小 / top-K / 等价性）。

### 6.9 VS Code 端实现面

> **VS Code 端现状面**（机制 / 坐标）。
> **归一**：§2.1 #82 / A1「以 CLI 为准（`node:sqlite` 定案）」+ 索引面裁定（归一 = 并核 sqlite · **数据面零迁移 / 零兼容**——重新索引 = 正当路径）。
> VSC 改接线核面。

**当前实现面**：

- **存储 = 核 sqlite（与 CLI 同库）**：`~/.thincoder/memory.db`（共享配置 `memory.dbPath`；缺省 = `<configDir>/memory.db`）。
句柄 `createMemory` 由端壳装配面创建持有（`thincoder-vscode/src/embed-config.mjs`——`ensurePanelAgent` 同址惰性创建）；
护栏 = `isMemoryFaceEnabled()`（`extension.mjs`）前置——停用/创建失败 ⇒ 句柄 null、消费点全部零崩；
**端壳静态 import 链零 `node:sqlite`**（核面经动态 `import()` 载入——静态可达 = 低宿主模块加载期硬失败；机判 = 契约②判据——现载体 = 单元测试档，单元测试树重建时回迁端侧单元测试档）。

`embedder` 经 getter 跟随共享 config（惰性向量回填）；`codeOrigin` = 当前项目根（逐调用限定——多项目单库）；`projectOrigin` = `memory.projectDir`（缺省 `.thincoder/memory`，首次逐项目 `syncDir`——CLI 启动同形）。
- **检索 = 核 `codeSearch` / `docSearch` / `search`**（FTS5 + 惰性向量，无 embedder → 纯 FTS 回退非空〔限非空 query〕）；
  `code_search` / `doc_search` 面经核工具生成器调用（描述/输出契约同文）。
- **工具面（契约规范源 + 端面形态）**：**规范源 = 核**——执行器 / 输出契约 = 核工具生成器 `memoryTools`（`thincoder-core/memory/memory-tool.mjs:49`——经其转口可达；§6.6.4 同文）；
端面 = **核单源挂载**（描述 / 参数随装配期 `wireMemoryFace` 注入核单源；端仅留 `layer` 值域守卫）。
端面保留：六动作 + 工具级 `readonly: false` + 动作级只读分类（search / list 只读放行——planMode 放行、免审批、可并行）+ put / delete / clear / maintain 副作用门 + `layer` 值域（`personal|project`、无 team——`team` 拒回并指引 CLI）。

**语义同源**（team 归属句两面同契：核「team (CLI only)」∥ 端「team is managed by the CLI」——非机制面差异，不作端差登记）。
- **迁移路径**：VSC 老用户文件制 personal 记忆 = `memory import` 一次性导入器（CLI 面——**未落**）；project 层 = `.thincoder/memory/*.md`（双端同目录，磁盘为真相）。
- **重建面（端壳）**：入口 = 面板「构建索引」（`thincoder.buildIndex`）→ 核序 `gitSync` → 回退 `codeSync`+`docSync`（并行）；
  进度 = Notification + 状态行段（`scan` / `index` 相位）；取消面 = `cancellable: false`（核 sync 无中断缝）；
  模型变更**零手动重建**（失效向量置空 + 检索懒回填——不产无效结果）；
  旧目录 `.thincoder/index/` 清退 = 告示 + 显式删除动作（每项目一次 · 零自动删除路径）。

### 6.10 扫描面修复（PK 游标 + 让出）与子代检索门

**触发面**：`prepareRun`（`thincoder-core/agent/setup.mjs:101-126`）的 `docSearch` + `memorySearch`——
**主 agent 每回合一次 · 每个子代理 spawn 各一次**（子代共享父侧句柄：`thincoder-core/agent-tools/subagent-spawn.mjs:350`）。

**修法 A1 —— PK 游标（访问序面：消排序 · 消 blob 排序物化）**：

- **修法**：`scanVectors`（`thincoder-core/memory/scan.mjs:133`）的游标列改由调用点**声明**（opts `cursorKey`，缺省 `["rowid"]`
  ——**缺省即现行为**）；查询由「统一追加 `AND rowid > ? ORDER BY rowid`」改为按声明构建**两形态**：
  - 首块：`… <调用点 WHERE 段> ORDER BY <键列> LIMIT ?`
  - 中块：`… <调用点 WHERE 段> AND (<键列>) > (?, …) ORDER BY <键列> LIMIT ?`
  - 游标值 = 上一块末行的键列值；**两道终止判据**（等价现状 `thincoder-core/memory/scan.mjs:169` 的 `!(next > after)` 与 `:92` 的尾块判据）：
    ① 键值缺失 ∨ **末键元组未严格大于上一游标键** ⇒ 止（游标不前进即止——防异常行序空转，正是本节要治的挂死形态）；
    ② 尾块（`rows.length < chunk`）⇒ 止（末块读尽，不再多打一次空查询）。
    **首块不带游标谓词**（否决哨兵值：哨兵须假设列域下界）。
- **键选取规则（本修法的核心）**：游标键 = **该表 PK 去掉「被等值过滤的前缀列」**；无等值过滤 ⇒ 用**全 PK**。
  理由：SQLite 只把与索引列序对齐的元组比较用作索引约束（seek）；**被等值约束的前导列若仍留在元组里，整个元组退化为残余过滤**。
- **否决形（反例 · 必须记住）**：`origin = ? AND (origin, path, line_start) > (?, ?, ?) ORDER BY origin, path, line_start`
  —— 计划 detail 仅 `(origin=?)`（元组未入 seek）⇒ **每块从头扫起 = 二次方**，且**无 `TEMP B-TREE`、无报错**（静默退化）。
  本机 20 万行夹具自测（内存库 / 落盘 + `ANALYZE`）：否决形 2.19 s / 5.65 s；正解（过滤面 2 元组）0.50 s / 1.63 s；
  无过滤面 3 元组 seek 0.41 s / 1.63 s。
- **逐调用点表（键列 = `thincoder-core/memory/schema.mjs` 逐表 PK 声明）**：

  | 调用点 | 表 | 表 PK | 现游标 | 裁定 |
  |---|---|---|---|---|
  | `thincoder-core/memory/core.mjs:66` | `entries` | `id INTEGER PRIMARY KEY`（= rowid 别名） | rowid | **零改**——rowid 游标**即** PK 游标（计划 `SEARCH entries USING INTEGER PRIMARY KEY (rowid>?)`，零排序） |
  | `thincoder-core/memory/core.mjs:67` | `files` | `(layer, origin, path)` | rowid | **零改**——rowid 序 = 表序 ⇒ 现状已零排序（计划 `SEARCH files USING INTEGER PRIMARY KEY (rowid>?)`）；表小；且其过滤段 `(layer='team' OR origin=?)` 非等值前缀，PK 游标在此无处可 seek、只多选键列 |
  | `thincoder-core/memory/docs.mjs:118` | `doc_chunks` | `(origin, path, line_start)` | rowid | **改**：有 origin 等值过滤 ⇒ 键 `["path", "line_start"]`；无过滤 ⇒ 键 `["origin", "path", "line_start"]` |
  | `thincoder-core/memory/code-sync.mjs:298` | `code_chunks` | `(origin, path, line_start)` | rowid | **改**：同 `doc_chunks` |

- **改前 / 改后 SQL**（以 `doc_chunks` 有过滤面为例）：

  改前（`scan.mjs:81-82` 统一追加）：
  `SELECT rowid, embedding FROM doc_chunks WHERE embedding IS NOT NULL AND origin = ? AND rowid > ? ORDER BY rowid LIMIT ?`
  —— 计划 `SEARCH doc_chunks USING INDEX sqlite_autoindex_doc_chunks_1 (origin=?)` + **`USE TEMP B-TREE FOR ORDER BY`**。

  改后·首块：`SELECT rowid, path, line_start, embedding FROM doc_chunks WHERE embedding IS NOT NULL AND origin = ? ORDER BY path, line_start LIMIT ?`

  改后·中块：`SELECT rowid, path, line_start, embedding FROM doc_chunks WHERE embedding IS NOT NULL AND origin = ? AND (path, line_start) > (?, ?) ORDER BY path, line_start LIMIT ?`
  —— 计划 `SEARCH doc_chunks USING INDEX sqlite_autoindex_doc_chunks_1 (origin=? AND (path,line_start)>(?,?))`，**零排序**。

  无过滤面（`memory.codeOrigin` 未设）：首块 `… ORDER BY origin, path, line_start LIMIT ?`；
  中块 `… AND (origin, path, line_start) > (?, ?, ?) ORDER BY origin, path, line_start LIMIT ?`（计划 = 索引 seek，零排序）。
- **覆盖恒等声明**：**访问序变化，集合恒等**——改前 / 改后遍历同一 WHERE 集（`embedding IS NOT NULL`〔+ origin 等值〕）；
  分页无重无漏的前提 = **键列全 `NOT NULL` 且唯一**：两表 PK 列逐列 `NOT NULL`（`schema.mjs:334-347` / `:373-385`；`files` 同 `:424-440`）
  ⇒ 键元组序为**严格全序** ⇒ 断言成立。（`entries` / `files` 零改 ⇒ 其覆盖恒等本就成立。）
- **tie-order 显式裁定 = 可接受**（不引入稳定化改造），判据四条：
① 平局 = 余弦分数**逐位相等**——现实来源是同文本重复索引（重复文件 / 分块）⇒ 平局候选**内容等价**，换成员不改答案内容；
② 需求侧已显式豁免——`docs/core/requirements/MEMORY.md` §4.6 N-M2「与全量排序逐条等价，**除并列序按稳定规则**」；
本修法**不改稳定规则**（仍「先到先留」），只改到来序；
③ **确定性判据保持**：同库状态 + 同查询 ⇒ 逐条相等（键序确定 ⇒ 堆内 seq 确定 ⇒ `list()` 排序确定）；

④ 跨实现（rowid 序 → PK 序）平局成员可变——仅在**同分**候选之间，且下游 RRF 对候选按名次同权。
- **并发写可见性（既有面，非本修法引入）**：扫描与并发写并存时无快照隔离（改前改后同）——访问序变化不新增缺陷类，
  差异面仅限「扫描期间被改写 / 被删的那几行」，其是否计入本次召回本就无保证。
- **可测缝（补）**：`cursorKey`（缺省 `["rowid"]`）；注入缝 `runChunkedQuery(sql, params)`——传入**构建后的 SQL 与参数**
  ⇒ 计划面（`EXPLAIN QUERY PLAN`）与分页行为皆可机判。

**修法 A2 —— 扫描让出（调度面，访问序零改）**：

- `scanVectors` 改 **async**（返回 `Promise<number>`）：块内按**时间片预算**让出——每处理
  `SCAN_YIELD_CHECK_ROWS = 64` 行读一次时钟，自上次让出累计 ≥ `SCAN_YIELD_MS = 50`（毫秒）即 `await yieldTick()`
  （先例 = `thincoder-core/memory/code-index.mjs:149-152`——`setImmediate`，延迟低于 `setTimeout(0)`）。
- `SCAN_CHUNK_ROWS = 2_000` **不动**（内存上界语义零变——F-M1 / F-M2 契约原样）；让出只改**调度**：
  访问序由 A1 的键列决定，让出**不改**访问序 / 评分 / top-K 候选集 / 并列稳定规则
  （N-M2 等价性在**同一键序**下仍成立：两跑逐条相等）。
- **单次事件循环占用上界** = 时间片 + 一个块的物化 + 一次时钟检查间隔（不再是全表时长）；
  单块 `.all()` 本身是原子同步段（不可中断）——上界由此构成，登记为**已知上界**。
- **可测缝**：`yieldFn`（缺省 `yieldTick`）· `nowFn`（缺省 `Date.now`）· `yieldMs`（缺省常量）——
  让出行为可**确定性**断言，不依赖真实时钟。

**修法 B —— 子代检索门（depth 门）**：

- `prepareRun` 的召回注入块（`thincoder-core/agent/setup.mjs:101-126`）加 **`depth === 0` 门**：
  子代理（depth > 0）**不注入**相关文档 / 相关记忆两块。
- **默认面 = 子代不注入**，理由四条：
① **需求侧声明（锚标全 · 两处）**——ⓐ VSC 端条目 F-M7（`docs/core/requirements/MEMORY.md:146`，属该档 §4.7「VSC 端需求条目」——该节自述登记 VSC 端现状，**非**核心层声明）；
ⓒ **核心层条目同批已补** = `docs/core/requirements/AGENT-LOOP.md` §4.11（F1–F3，`:191-201`）
⇒ 现状代码（无门）= 实现偏离声明；

② **既有先例一致**——`prepareRun` 内其余自动注入全部 depth-0 门（git 上下文 `:55` · cwd 树 / 依赖大纲 `:65` ·
env-state / 同伴提醒 `:134` · skills 列表 `:223`），召回注入是唯一例外；
③ **子代任务书自含义务**——父侧已把所需文档与结论写进 brief，按 brief 原文再检索一次 = 重复且可能拉入无关块；
④ **能力不丢**——子代仍持 `doc_search` / `code_search` 按需检索（readonly 工具；`memory` 工具因工具级

`readonly:false` 不在只读子代理工具表内——§6.5 既有登记）。
- **不加配置开关**（开关面 = 新面，另批）；回退面 = 删该 depth 判据一处。
- **auto-turn 面现状（评审 #12 落点）**：F-M7 的「非 auto-turn」半条在**核路径已满足**——`thincoder-core/agent.mjs:129`
  以 `resume: resume || autoTurn` 传 `prepareRun` ⇒ auto-turn（消化）回合按 resume 语义走，`if (!resume)` 块（含召回注入）**不进**；
  即 depth 门之外**无需**另加 auto-turn 门（本修法不改 auto-turn 语义）。

**墙钟与响应性（诚实边界）**：

- **响应性**（A2 之功）：单次事件循环占用 ≲ 时间片 + 单块物化（目标读数 = 每让出窗 **≲ 0.1 s** 量级）⇒ 输入回调排得上队。
- **墙钟**（A1 之功）：单趟全表向量扫描的时延 = **1.71 s** 量级（父侧真库实测 · 同覆盖）。
- **仍未解决**：每回合 1 趟 **~1.7 s** 量级的固有成本（子代面已由 B 门去掉）+ 单块 `.all()` 的不可中断段。
  再压量级 ⇒ ANN / 分层候选（D-MEM13 已登记为后续项）。
- **真时探针判据（T-Y4）**：缺省面 maxGap 中位数 ≤ 250 ms（响应性契约）· 对照面（`yieldMs: Infinity`）≥ 缺省 ×2 ∧ ≥ **100 ms**（量级下限——承「≲ 0.1 s 量级」）；×5 为打印读数（夹具上界 3 万行逃生口）。

### 6.11 索引 origin 归一（重复索引源治理）

**修法（核内单点归一）**：

- 新叶模块 `thincoder-core/memory/origin.mjs`（纯函数叶档——现体在盘）：`normalizeOrigin(p)`——分隔符归一 `/` ·
  Windows 盘符统一大写 · 去尾斜杠（根除外）· 非字符串原样透传。
- 应用点 = **各公共入口一行**（写缝与读缝各自入口取归一值，函数体内一律用归一值）：
写面 `codeSync` / `docSync` / `gitSync` / `reindexFile` / `syncDir` / `indexMarkdownFile` 的 `dir`（含按 origin 的查 / 删）；
读面 `codeSearch` / `docSearch` / `search` / `fetchEntry` 的 `memory.codeOrigin` / `memory.projectOrigin`；
删面 `thincoder-core/memory/delete.mjs`（评审 #1 补——uid 与索引行的 origin 必须同一形态）：

uid 拼装 `matchMemoryRows`（`:56` / `:59` 的 `projectDir` / `teamDir`）· origin 解析 `deleteByUid`（`:171-173`）·
等值查（`:182`）· 护栏查与 `origin !== dirs[layer]` 比较（`:195-197`——**两侧归一**）· `syncDir` 调用（`:206`）各取归一值。

（`fetchEntry`（`thincoder-core/memory/core.mjs:120-123`）同形——其 **uid 解析面本轮零改**（path-only 余量兜底（`:131`）仍在）；其 `memory.projectOrigin` 读面仍按读面应用点归一。）
- **端装配文件零改 + 核库读数点例外**（归一在核内——不触 `make-agent.mjs` / `embed-config.mjs` 等端**装配**文件，各面独立实现纪律不破）；
  **例外 = 核库读数点** `thincoder-vscode/src/extension/panel-index.mjs`（`:20` 归一导入 · `:35-37` `readIndexCounts` 按归一形 origin 取键）——核内写缝归一后不取同形键则面板恒显 `files: 0` ⇒ 随本节同改（例外判据 = 读同一份核库的投影点）。
- **不做**：`realpath` / 符号链接解析（会改「origin = 用户项目路径」语义 + 破坏跨机可移植性；同款先例 = D-MEM10「不用 `resolve`」）；
  别名路径（subst / junction / 8.3 短名）与**嵌套 origin 重叠**（仓根 origin 与子仓 origin 各索引一遍）**登记为已知限制**。

**数据面迁移方案（执行 = 父侧 ops；子代理零触碰）**：

1. **前置备份（可回退判据）**：`VACUUM INTO '<backup path>'`（WAL 下一致性快照）——
   判据 = 备份文件存在 ∧ 大小 > 0 ∧ 打开后 `PRAGMA integrity_check` = `ok`。
2. **归一 + 去重（单事务）**：对 `code_chunks` / `doc_chunks` / `files` 三表按 `normalizeOrigin(origin)` 折叠键；
   同一归一键内 `(path, line_start)`（`files` 表为 `(layer, path)`）**恰一行**——保留 `mtime_ms` 最大者（最新索引），
   并列取 `rowid` 最小者；被折叠行删除（FTS 由既有触发器随行同步）。
3. **行数预测（判据形态，非预测绝对值）**：设折叠前该树两键行数为 A / B（实测 A = 71,266、B = 69,748）
   ⇒ 归一后该树行数 ∈ `[max(A,B), A+B]`；两键覆盖同一文件集（同树同索引器版本）时 ≈ `max(A,B)`。
   迁移后判据：① 该树 origin 键集合大小 = **1**；② 三表内任一 `(归一键, path[, line_start])` **恰一行**；③ `COUNT(*)` 迁移后 ≤ 迁移前。
4. **WAL 回收**：迁移后 `PRAGMA wal_checkpoint(TRUNCATE)`（与 §6.12 同机制）。
5. **回退**：迁移失败 / 判据不过 ⇒ 停库 → 以备份替换原库路径（迁移脚本不触碰任何非 DB 文件）。

**召回面说明（非语义变更）**：归一后读缝与写缝取同一键 ⇒ 两种拼写启动看到的是**同一批行**。

**模型可见 id 形态（可见面变更）**：文件层 id = `project:<origin>:<path>`（`fetchEntry` / 检索行拼装）——
归一后 origin 段 = **归一形**（盘符大写 + `/`）：`project:C:/projA/.thincoder/memory:a.md`。
旧形态 id 仍**可用于删除**（`deleteByUid` 内取归一值再查），但**字符串比较面**（脚本 / 断言 / 提示词内字面 id）须按归一形书写。

### 6.12 WAL 卫生

**修法**：① `createMemory` 设 `PRAGMA journal_size_limit`（回收后 WAL 文件截断上界——防复胀）；
② 开库时**一次性** `PRAGMA wal_checkpoint(TRUNCATE)`（`thincoder-core/memory/schema.mjs:90-91`，常量 `WAL_SIZE_LIMIT_BYTES`），
**失败容忍**（另一实例持读事务 ⇒ busy：静默跳过，不重试、不报错；**开库停在 checkpoint 上的等待上界见下段边界**）。

**边界（写实）**：本机制是**卫生**不是**保证**——busy 时以现状继续；
该语句的**最坏等待上界 = 连接上的 `busy_timeout`**（`SQLITE_BUSY_TIMEOUT = 3000` ms——`thincoder-core/memory/schema.mjs:19` 常量、`:85` 设好），**不是「不阻塞」**。
SQLite 的 `wal_checkpoint` 是否走 busy handler（从而是否真受该上界约束）= **`unverified`**（本设计未实测；判据 = WAL 边界用例「另一连接持读事务时开库」——量等待时长；

若实测不走 busy handler ⇒ 等待更短，上界仍成立）。
**不做**写侧逐次 checkpoint（写侧在性能敏感路径，高频 checkpoint = 每次写多一次主库 fsync；PASSIVE 对本症无收益）。
**数据面一次性回收 = 父侧 ops**（`wal_checkpoint(TRUNCATE)`；`VACUUM` 可选——需 2× 磁盘与整库重写，收益只在删除后空页）。

### 6.13 死 origin sweep 与写入面归一化强制

**写入面归一化强制**：`normalizeOrigin`（`thincoder-core/memory/origin.mjs:18-24`——分隔符归一 `/` · 盘符大写 · 去尾斜杠 · 幂等）为唯一归一函数；所有 origin 写入点须经它
（写面入口 = `thincoder-core/memory/code-sync.mjs:193` / `thincoder-core/memory/docs.mjs:26` / `thincoder-core/memory/core.mjs:213` 与 `:264` 族）；
判据 = 变体折叠断言（会话来源归一用例族）+ 写面结构检查。

**死 origin sweep（二信号判据）**：**信号 A** = `normalizeOrigin(o) !== o`（非归一变体）⇒ **折叠，不删**（§6.11 迁移形态）；**信号 B** = 原样 / 归一形两路径皆 ENOENT ⇒ **可删**（树亡；探针仅 ENOENT 判亡——其他错误 fail-safe 保留，先例 `thincoder-core/session-stale.mjs:124-127`）。

**面表**：删除面 = `code_chunks(+fts)` / `doc_chunks(+fts)` / `files(+fts)`（FTS 触发器随行同步——`memory/schema.mjs:356-371` 等）；`entries` 无 origin 列（不涉）；`meta.last_indexed_commit` 全局单键（不涉）。

**边界**：不用时间判据（`code_chunks` / `doc_chunks` 无行级写入时间戳，仅源文件 `mtime_ms`）——**全扫档（缺省）**「树亡」为唯一删除判据；**`--origin` 档 = 显式点名档**（删除判据 = 用户点名整档——不以树存活为判据、不在信号 A/B 射程；安全档见下）；别名路径 / 可移动介质可假阳 ⇒ 探针 fail-safe（低风险依据 = §6.11「磁盘为真相 · DB = 可重建索引」）。

**命令面与安全设计**：

- **命令面**：`thincoder memory sweep [--origin <o>] [--dry-run|--confirm]`——新核档 `thincoder-core/memory/sweep.mjs`（现体在盘）+ `thincoder-cli/src/cli/memory-command.mjs` 新子命令；
  缺省 = 全扫（信号 A 折叠 + 信号 B 删除——删除判据 = 「树亡」，见下边界）；调用面 = CLI shell 子命令（VSC 无 shell 子命令面——结构性端差登记见 §2.2 #135）。
- **`--origin <o>` 档语义（显式句）**：`--origin` = **靶向整档删除**（台账所称缺位面：现有删除面仅文件级 `origin=? AND path=?`）——删除范围 = 三表内 `normalizeOrigin(origin) = normalizeOrigin(<o>)` 的**全部行**（含该 origin 的全部非归一变体——折叠与删除一步到位）；
  **不以树存活为判据（输出仍报树存活供警示）、不走信号 A/B**（显式点名 ≠ 树亡推断——**活树 origin 亦可整删**；此即与全扫档的判据分界）。
  **组合档**：`--path <sub>` 收窄档（新增）须与 `--origin` 同用——删除范围收窄至 `<sub>` 前缀行（语义见 §6.14 面 ①-3）。
- **安全设计（三件）**：① **备份前置** = `VACUUM INTO <path>`（判据同 §6.11 步 1：文件存在 ∧ 大小 > 0 ∧ 打开后 `PRAGMA integrity_check` = `ok`；失败 ⇒ 中止零写）；
**取备份档位** = `--confirm` 档**且命中行 > 0**（写前置）；dry-run 档与零命中档不取（零写 ⇒ 无回退对象）；**路径与命名** = `<dbPath>.sweep-backup-<UTC yyyymmddHHMMSS>`（同目录；`dbPath` = `config.memory.dbPath` 展开值——缺省 `~/.thincoder/memory.db`，`thincoder-core/config-defaults.mjs:59`）；

**同域命名先例** = 会话索引隔离名 `session-index.db.corrupt-`（会话索引单测档的 `.corrupt-` 前缀断言）；**目标已存在 ⇒ 中止零写**（fail-closed，不覆盖）。

② **干跑默认**（`--confirm` 才写；零写判据 = 库字节 / 行数不变）；**输出形态（含 `--origin` 档）** = 逐 origin 一行 `origin=<归一形> · 树存活=<是|否> · code=<n> / doc=<n> / files=<n> / 合计=<n>`（树存活 = 原样 / 归一形两路径探针读数——活树附警示行）+ 末行合计；`--confirm` 档同形 + 备份路径。

③ **审计** = 输出逐 origin 折叠映射 / 删除行数 / 备份路径；**写后回读判据按档分列**：折叠（全扫）档 = 归一键集合大小 = 1 ∧ 任一 `(归一键, path[, line_start])` 恰一行 ∧ `COUNT(*)` ≤ 前（同 §6.11 步 3）∥ **`--origin` 档 = 目标归一键三表零命中 ∧ 非目标 origin 零变**（非目标归一键集合与各键计数逐键等前值；FTS 随触发器同步）。
- **折叠规则单源 = §6.11 步 2**（同归一键内 `(path, line_start)`（`files` = `(layer, path)`）恰一行——保留 `mtime_ms` 最大者，并列取 `rowid` 最小者；FTS 由触发器随行同步）：sweep 不另立规则。
- **执行分工**：真实库写 = **父侧 ops**（同 §6.11 迁移面纪律：备份 → dry-run 复核 → `--confirm`）；实现轮只落工具 + 沙箱用例 + 干跑读数（只读）。

### 6.14 索引规模治理与大库操作面

**面 ①：索引范围裁面（哪些树该入索引）**

判据（本节定 · 三条）：

- **判据 A（范围单位 = 工作集）**：origin 的索引范围 = 用户会编辑 ∕ 需要检索的项目树；「多个互不相干项目的容器」（非 git 仓、子目录各为独立 git 仓）全量入索引无判据支撑。
- **判据 B（成本 ∝ 行数）**：每回合召回扫描成本 ∝ 该 origin 行数（§6.10 实测 65,704 行 ≈ 1.71 s）；参考系树（只读分析材料）与工作树同权入索引 ⇒ 成本由全部行付、价值只从少数行来。
- **判据 C（范围可声明）**：产品不硬编码「哪些目录是参考系」——范围由**项目声明**给出（单一声明载体 = `PROJECT-MANIFEST.json`——KD-M1-31）。

落面（三件）：

1. **声明键（新增）**：`PROJECT-MANIFEST.json → index.excludePaths`——项目根相对路径前缀数组；元素 = trim 后非空串、**首部 `./` 剥离**（归一为项目根相对形）、`/` 归一、去尾斜杠、去重保序；缺省 `[]`（零行为变化）。schema ∕ 校验 ∕ 缺省 = `manifest-schema.mjs`（`MANIFEST.md` §2.2）；投影出口 = `conventions.mjs` `loadProjectDeclaration().index.excludePaths`。
2. **过滤谓词（单源）**：定义位 = `thincoder-core/declaration.mjs:110`（`isExcludedRelPath(rel, decl, base = null)` 本体）；再出口位 = `thincoder-core/conventions.mjs:192`（转口再出口——消费面 import 面零改）；前缀命中 = 恰等 ∨ 后随 `/`（`openclaw` 不吞 `openclaw-fork`）；比较基 = 项目根相对面（与 D17 段匹配面同基）。
**基面换算**：谓词携 `base`（调用面 cwd/origin——`rel` 的相对基）：`rel` 经 `resolve` + `relative` 换算至 `decl.root` 根面再比前缀（各起效点携本面 `base`；cwd = 项目根时与既有行为逐字等义）；换算越出根面（`..` 头 ∕ 根外）⇒ **不命中**（保守不排除——沉默洞方向收窄）；`base` 缺省 = `rel` 原样（等价于根起步调用面）。

**过滤起效点四处**（同步三处 + 读面一处）：① `listProjectFiles`（git ∕ walk 两径同一谓词）——**walk 径 = 遍历中剪枝**：排除子树不展开（目录展开守卫位接谓词，零 `readdir`）、不耗 `MAX_WALK_FILES` 预算；
接线 = `file-walk.mjs:106`（目录展开）∕ `:109`（文件守卫）双守卫位，谓词由调用方注入；git 径 = `git ls-files` 列表面逐行过滤（无预算耦合）。② `gitSync` diff 表。③ `reindexFile` 单文件缝。

④ **读面准入过滤**（`docSearch` ∥ `codeSearch` 准入位——行判 = 同一谓词全判（面① ∪ 面⑥ 两族）：`index.excludePaths` 命中存量行同判不可见；机制 ∥ 判据 = 面⑥ ∥ L-⑦-3）。

**收尾保护位（第五接线 · 非过滤起点）**：同步收尾 stale 删除对排除命中路径**短路**——被排除但存在的路径之存量行不因声明删除（受保护成员集：`isExcludedRelPath` 命中 ⇒ 跳删）；此类行仅经 `sweep --path` 收敛（安全三件不被同步旁路）。不引入按存在性的逐行 stat（预算零增）；`excludePaths` 缺省 `[]` ⇒ 短路恒不命中（零行为变化）。
3. **存量剪枝执行路径（ops 面 · 父侧执行）**：`memory sweep` 新增 **`--path <sub>` 档**（须与 `--origin` 同用）：删除范围 = `origin = normalizeOrigin(o)` ∧ `path` 命中前缀 `<sub>` 的 `code_chunks` ∕ `doc_chunks` 行（`files` 表不涉——记忆层非项目文件）；安全三件与 §6.13 同款（备份前置 · 干跑默认 · 审计 + 写后回读：命中行 0 ∧ 非命中行逐键等前值）；零命中 ⇒ 不取备份、零写。
   执行序（父侧 ops）：① 干跑复核（逐树）→ ② `--confirm`（`VACUUM INTO` 备份先行）→ ③ 全扫复核未归一变体（信号 A 折叠）；**VACUUM 不排**（freelist 3 MiB——零收益，§6.13 同判）。
   分工：声明管**未来**不再入索引（存量行亦不因声明经同步删除——收尾保护位，见上）；`--path` 管**存量**行；两者同一前缀语义（判据 C 单源）。

**面 ②：大库操作出 UI 路径（让渡式分片 + 调度）**

「UI 路径」= 交互进程事件循环（CLI TUI ∕ VSC 扩展宿主 ∕ 桌面主进程）。调用点表：

| # | 调用点 | 形态（现状） | 裁定 |
|---|---|---|---|
| B1 | 每回合 `docSearch` 向量扫描（`thincoder-core/agent/setup.mjs:109` → `memory/docs.mjs:125`） | 分块 + 50 ms 预算让出（§6.10 A2）；墙钟 ≈ 26 µs ∕ 行 | **留**——成本上界由面 ③ 行预算约束 |
| B2 | 每回合 embedding 回填探针（`thincoder-core/memory/core.mjs:172-177` · `code-sync.mjs:353` · `docs.mjs:170`） | **无索引全表扫**——计划实读 = `SCAN code_chunks` ∕ `SCAN doc_chunks`；depth-0 回合三趟（doc ×2 + code ×1）· 零命中白扫 | **改**：schema v10 增**部分索引**——可建 DDL = `CREATE INDEX code_chunks_embedding_null ON code_chunks(embedding) WHERE embedding IS NULL`（doc 表同款 `doc_chunks_embedding_null`）⇒ 探针 O(待回填)；**预期计划读数（实测形）** = `SEARCH <表> USING INDEX <名> (embedding=?)`。键列取 `embedding`——**`rowid` 不可作索引键列**（本机实测 `no such column: rowid`；鉴别句入 D-MEM22） |
| B3 | 每回合 `COUNT(*) FROM doc_chunks`（`thincoder-core/agent/setup.mjs:119-121`） | 覆盖索引全扫（77,629 行）且**跨 origin** | **改**：origin 限定 + 有界计数——**界值 = `INDEX_ORIGIN_ROW_WARN`（100,000）复用**（「+」界 = WARN 线随动——正常规模给真实数 ∕ 越界给「+」形 `100000+`） |
| B4 | 每会话一次 `buildSummary`（`thincoder-core/agent/setup.mjs:99` → `thincoder-core/tools/repomap.mjs:119`） | `SELECT DISTINCT path FROM code_chunks`（**跨 origin**）+ 逐文件读盘 | **改**：origin 过滤 + 文件数上界——**上界 = `INDEX_ORIGIN_ROW_WARN` 值复用（随 WARN = 100,000）**（越界 = 提示行 + 跳过：不构建大纲，附指路 `index.excludePaths`） |
| B5 | 每写一次 `reindexFile`（`agent/record-results.mjs:162` fire-and-forget） | 单文件事务 + 探针（B2 切后即消） | **留** |
| B6 | 全量同步 `codeSync` ∕ `docSync`（CLI `tui/startup.mjs:271/:279` ∥ 桌面 `thincoder-desktop/src/main/index-status.mjs:56` ∥ VSC `panel-index.mjs:186`） | 逐文件 `yieldTick`；**收尾 stale 删除循环零让出**（`code-sync.mjs:241-246` ∕ `docs.mjs:72-77`） | **改**：收尾循环加让出（同款时间片预算）+ stale 判据对排除命中路径短路（面① 收尾保护位）——**现体 = `memory/sync-tail.mjs` `sweepStaleRows:72-87`**（单源；两入口消费 = `code-sync.mjs:268` ∕ `docs.mjs:87`） |
| B7 | 读面内嵌**写**：换模型失效 `UPDATE … SET embedding = NULL`（`thincoder-core/memory/core.mjs:162-165` ∕ `code-sync.mjs:348` ∕ `docs.mjs:165`） | 读路径（search 内）触发 162k 行级全表重写 | **改**：**读面零写**——失效**判定**留读面（宁降级不用旧向量：模型键不匹配 ⇒ 该面向量通道降级 FTS-only + 一行可见），失效**执行**移维护口（同步尾 ∕ `/reindex` ∕ 桌面 ∕ VSC 构建） |
| B8 | `createMemory` 开库（`memory/schema.mjs:80-91`） | 一次性 WAL `checkpoint(TRUNCATE)` +（v10 起）索引建立 | **留**（一次性；等待上界 = `busy_timeout`——§6.12 边界句不改） |
| B9 | `memory sweep`（CLI 子命令） | ops 面 | **留**（非 UI 路径） |

**形态裁定（worker ∕ 分片 ∕ 调度）**：**不引入 worker_thread**——① 三个 UI 路径爆点（B2 白扫 ∕ B3 全扫 ∕ B6 零让出）全部由「去废 + 分片」消解，无需结构迁移；② worker 化牵动句柄直用面（`memory.db` 直用点分布装配 ∕ 同步 ∕ 工具 ∕ 三端构建）与测试，成本高于收益；③ 承 D-MEM17「登记不执行」。

**升级触发（判据项）**：B2 ∕ B3 ∕ B6 + 面 ③ 行预算落定后，以本单元测试档探针**对缺省工作集 origin 复测**——单回合召回注入墙钟 ≥ **0.5 s** ⇒ 下一轮以 worker 出库（独立批）。**判别基线** = 缺省工作集 origin 实态行数（同量级夹具 ∕ 真库只读复测）；换算 = 26 µs ∕ 行 ⇒ 0.5 s ≙ ≈1.9 万行：工作集 ≤ 1.9 万行 ⇒ 读数 < 0.5 s（不触发），越界 ⇒ 触发。

**面 ③：体积护栏与增量维护**

需求锚 = `docs/core/requirements/MEMORY.md` §4.10（F-S6–F-S8 ∕ N-S4–N-S6）+ §4.13（F-S14 ∕ N-S10——行预算用户面 · 用户裁定）；判据项 = 本节 L-③ 族。

- **P1 读数（可见面）**：`memoryStatus()` 回执增 `dbBytes`（库文件 `statSync`）与**逐 origin 行数**（code ∕ doc）——**兑现面 = 核出口回执**（机检 L-③-1）。消费面 = 桌面索引面板 ∕ 状态行 ∕ CLI——端面（含 VSC 面板读数位）**零改**；桌面端侧零 SQL 纪律不变（端面取数经核出口）。
- **P2 行预算（硬背板 · 只停新增不删存量）**：**计数基准 = 该 origin 库内行数（`code_chunks` + `doc_chunks` 合计，同步开始时点读）**；判定点 = 每文件落库前（`既有 + 本趟已落 ≥ CAP` ⇒ 跳过该文件及后列）。
过 `INDEX_ORIGIN_ROW_WARN = 100,000` 出**一行中性信息**（每 origin 每趟至多一行——F-S14 ①：真实行数 ∕ 无「WARN」字样 ∕ 无警示语态 ∕ 不默认附作业指令）；过 `INDEX_ORIGIN_ROW_CAP = 300,000` ⇒ 同步**跳过后列文件** + 一行**优雅降级说明**（F-S14 ②：「新档暂不收录」+ 选项式指路）。

**处理序（行序）确定性**：文件列序钉死 = `rel` 字典序（现 walk ∕ git 列序不确定）、越界跳过 = 列序后缀；**跳过语义 = 不落行 ∕ 不记 mtime**（下趟重试；既有行不失效）；回执 `budgetSkipped` + `logEvent`（名面 `index:budget` ∕ `index:budget-cap` 零改）。
**两行文本（单源 = 代码；实施对象）**：
  - WARN 行 = `[memory] index origin=<o> rows≈<n> (code + doc)`——一行中性（真实行数 ∕ 无「WARN」字样 ∕ 无警示语态 ∕ 无作业指令）；
  - CAP 行（**单行输出**；下方 ①② = 行宽折行，非两行输出）：
① `[memory] index origin=<o> rows≈<n> — index is at its size limit: new files are not being indexed for now (existing rows are kept and remain searchable).`

② `Options: exclude paths from indexing (index.excludePaths in PROJECT-MANIFEST.json), or remove old rows (thincoder memory sweep --origin "<o>" --path <sub>)`（优雅降级说明 + 选项式指路——F-S14 ②）。
**`declare ∕ prune` 指令形 = 退出默认输出**（能力照留文档 ∕ `memoryStatus` 面——F-S14 边界）；存量行不因预算失效。

**机制现体 = `memory/sync-tail.mjs` `createRowBudget:37-62`**（WARN ∕ CAP 单源——`originRowCount` ∕ `rowCountOfPath` 同档；消费 = `code-sync.mjs:178` ∕ `docs.mjs:57`）。

**测试注入缝（计数注入——最小形）**：`createRowBudget(memory, origin, kind, dir, { baseOffset } = {})`——`base = originRowCount(memory, origin) + (baseOffset ?? 0)`；缺省（`undefined`）⇒ `+ 0` = 核计数（生产行为逐字不变）；单元测试档经 `baseOffset` 注入 ≥ WARN ∕ ≥ CAP 计数（文本用例零真行 ∥ 集成用例真 5 文件 + 计数偏移——30 万真行不落）。
先例 = 面⑤ ⑤-2 测试缝（注入参数 + `??` 缺省）。

**成本线分离（F-S14 ④）**：WARN ∕ CAP = 用户面规模线（数值 = 用户裁定）；**成本自适应仍归内部触发**（面② 升级触发判据项 L-②-5——单回合召回墙钟 ≥ 0.5 s ⇒ worker；零改）——两线不数值耦合。
- **P3 触发位**：同步尾（预算判定 + `budgetSkipped` 回执）；开库一次性（WAL checkpoint——§6.12 既有）；桌面 ∕ VSC 状态面（既有读数位）。**库字节读数（`dbBytes` + 逐 origin 行数）= `memoryStatus` 核出口**（P1 面）。**自动删除 ∥ 自动 VACUUM ∥ 备份轮转 = 面 ⑤（自愈轮）**（P 族判据零改）。
- **M1 per-origin 锚**：`meta.last_indexed_commit` 现为**全局单键**（全库恰一枚）——多 origin 互相覆盖 ⇒ 他仓 diff 失锚（`git diff <旧锚> HEAD` 未知修订 ⇒ `gitSync` 返 null ⇒ 全扫兜底，慢但不错）；**改 `last_indexed_commit:<归一键>`**；兼容窗 = 旧键在而 per-origin 键缺 ⇒ 视为无锚（该 origin 全扫一次）；旧键清退 = 全部 origin 落锚后（ops）。
- **M2 `gitSync` 路径形态**：两处 diff 调用带 `--relative`（子目录内 = cwd 相对且射程收在本子树）；判据 = 同 origin 下 `gitSync` 落行的 path 形态与 `codeSync` 逐字同形。
- **M3 收尾让出** = B6。

**面 ④：索引排除名单补强（通用生态名 + 平台语义大小写）**

需求锚 = `docs/core/requirements/MEMORY.md` §4.11（F-S9 ∕ N-S7——判定句回指该节，本处只给机制）。

**名表补强（声明面 = `thincoder-core/memory/schema.mjs:48-61`）**：

- `SKIP_DIRS` 补六名（精确 basename · 任意深度）：`vendor` ∥ `Pods` ∥ `bower_components` ∥ `third_party` ∥ `obj` ∥ `out`；
- 新增 `SKIP_DIRS_FOLD`（**win32 折叠子集** = 垃圾 ∕ 产物族全列）∥ `SKIP_DIR_PREFIXES = ["bazel-"]`（前缀形——Bazel 便捷目录名含工作区名（`bazel-<workspace>`）不可穷举 ⇒ 前缀收：`bazel-bin` ∕ `bazel-out` ∕ `bazel-testlogs` 等）；
- **`bin` 不进排除表**（用户裁定——含本仓 `thincoder-cli/bin` ∥ `thincoder-server/bin`，保持入索引）。

**族分折**（落 `thincoder-core/memory/file-walk.mjs:27-39` 的 `isSkippedRelPath`——判定单源）：

**垃圾 ∕ 产物族**（`node_modules` ∥ `dist` ∥ `build` ∥ `.turbo` ∥ `coverage` ∥ `__pycache__` ∥ `.venv` ∥ `venv` ∥ `target` ∥ `.next` ∥ `.nuxt` ∥ `.svelte-kit` ∥ 新六名）**win32 折**——`Node_Modules` 类拼写变体同剪（win32 文件系统本不区分大小写，不折 = 漏剪）；

**位置族**（`AppData` ∥ `Application Data` ∥ `Desktop` ∥ `Documents` ∥ `Downloads` ∥ `Music` ∥ `Pictures` ∥ `Videos` ∥ `OneDrive` ∥ `Contacts` ∥ `Favorites` ∥ `Links` ∥ `Saved Games` ∥ `Searches` ∥ `Library` ∥ `go` ∥ `Program Files` ∥ `Program Files (x86)` ∥ `Windows` ∥ `$Recycle.Bin`）**全平台精确**

（位置语义；全表折误剪合法同名面 443 行——见下）；POSIX 一律精确。
**枚举对账（全列可核）**：上两族枚举 + **`.git` 单列** = 与 `thincoder-core/memory/schema.mjs:48-61` 常量块**逐名对齐的全集**（垃圾族 18 = 既有 12 + 新六 ∥ 位置族 20 ∥ `.git` 1——合计 39 名 = 既有 33 + 新六）。**`.git` 处置点名** = **点段规则覆盖**（`file-walk.mjs:34`——`.` 起始段一律跳；折与不折不影响判定 ⇒ 行为零变），不入两族。

谓词 = 精确命中（`SKIP_DIRS`）∨ 前缀命中（`bazel-`——POSIX 字面 ∥ win32 折）∨（win32 ∧ `SKIP_DIRS_FOLD` 折叠命中）。签名 `isSkippedRelPath(rel, platform = process.platform)`（平台入参仅供直测双道；**既有调用点零改**）。**与 §6.11 origin 归一无关**（名表判定 ≠ 路径键折叠）——§6.11「非盘符段不折」口径不动；`schema.mjs:44-47` 表头自注。

**折叠范围裁决 = 族分折**——垃圾 ∕ 产物族 win32 折 ∥ 位置族全平台精确 ∥ POSIX 一律精确。证据 = 全表折会误剪合法同名面 443 行（`desktop` 428：本仓 `thincoder/docs/desktop/**` 286 ∥ `opencode/packages/desktop` 98 ∥ `openclaw` 44 · `library` 15：`openclaw/src/skills/library`）——族分折下二者保持入索引（判假围栏锁）；需求档 F-S9（族分折口径）在册。

**三路同谓词（单源不变 · 零消费者改动）**：`isSkippedRelPath` 即唯一跳过判定——消费面全部现存：walk 双守卫（`file-walk.mjs:106` ∕ `:109`）· git 列面（`file-list.mjs:81`）· gitSync diff 缝（`code-sync.mjs:98`）· 单文件缝（`code-sync.mjs:249`）；

`/reindex` 面（`thincoder-cli/src/tui/cmd-reindex.mjs` → `codeSync` ∕ `docSync` → `listProjectFiles`）经同链自然同谓词；三端（CLI ∕ VSC ∥ 桌面）同核单源自动随动。

**负例集（判假围栏——精确语义护栏）**：

| # | 负例类 | 例（须判假） | 判据 |
|---|---|---|---|
| 1 | 近似名 | `output` ∥ `outbox` ∥ `outside` · `objc` ∥ `objects` · `vendors` · `bower-components` · `third-party` | 精确 basename（非前缀 ∕ 非子串）；下划线 ∕ 连字符不同名 |
| 2 | 前缀护栏 | `bazel`（无 `-`）· `bazel_x`（下划线） | 前缀字面 = `bazel-` |
| 3 | 位置族大小写变体（win32 亦判假） | `desktop` ∥ `library` ∥ `documents` ∥ `windows` | 族分折——位置族全平台精确（「全表折」误剪面 443 行的护栏锁） |
| 4 | 垃圾族 POSIX 变体 | POSIX 上 `Node_Modules` ∥ `OBJ` ∥ `Vendor` ∥ `Bazel-bin` | POSIX 一律精确——不折 |
| 5 | 用户裁定面 | `bin`（任意深度） | 不进排除表——保持入索引 |
| 6 | 文件名形 | `out.md` ∥ `obj.js`（带扩展名） | 段名精确不中；无扩展名同名文件（裸 `out`）判真但本不入索引（扩展名门）——净零影响 |

**同名合法面登记（N-S7 附读数）**：位置族变体 443 行（`desktop` 428 ∥ `library` 15——见上「折叠范围裁决」块）**不剪**（族分折后保持入索引——即判假围栏锁的面）；新名自身同名面现状 = 仅真实产物树（`obj` = `thinworker/**` 构建产物 · `vendor` = `oh-my-pi/crates/vendor` 固化依赖）；**误剪接受面**承 `go` ∥ `Library` 同款口径（任意深度同名目录同剪——如源码树内 `out/` ∥ `vendor/`），登记为已接受；

**`bazel-` 前缀对文件名同判**（前缀支作用于任意路径段——`bazel-<名>` 文件名同剪）——一并登记为已接受（零现值影响：实仓 glob ∥ 实库读数 `bazel-*` 命中 = 0）。

**读数**（候选谓词原型逐例跑 + 实库只读；库活跃——读数为时点值）：

- **谓词矩阵（族分折版）**：47 例（垃圾族正例 ∥ 位置族正例 ∥ 位置族变体判假 ∥ 判假围栏 · win32 ∥ POSIX 双道）**零不一致**——垃圾族变体 win32 真 ∕ POSIX 假；位置族变体两道皆假；
- **实库段命中**（`code_chunks` + `doc_chunks` 段级）：`obj` ∥ `vendor` **现值 = 0（已清）**；`out` ∥ `Pods` ∥ `bower_components` ∥ `third_party` ∥ `bazel-*` = 0；`bin` = 45 行（不进排除表，零触碰）；
- 位置族变体 = 443 行（`desktop` 428 ∥ `library` 15——族分折下**不剪**，见「折叠范围裁决」块）。

**存量收敛（二路——机制面通则）**：本机制只管**未来**（新名即时不再入索引）；存量行收敛二路：① **显式** `memory sweep --origin <o> --path <前缀>`（备份先行 · 干跑默认 · 写后回读——§6.13 安全三件；前缀语义 = 恰等 ∨ 后随 `/`——`thincoder-core/memory/sweep.mjs:72`）；

② **同步收尾自然收敛**（在册）：被跳文件不在 `seen` ⇒ 该 origin 下一次**全量**同步的 stale 收尾即删其存量行（无备份——`sync-tail.mjs:77-80` 既有口径；walk 起点 = 每趟皆全量 ∥ git 起点 = 全量档触发时——diff 档不跑收尾）。（逐前缀清单 ∥ 顺序 ∥ 时机）= §2。

**边界（不做）**：把 `bin` 收进排除表；§6.11 路径键口径不动；manifest `index.excludePaths` 面不动（互补——声明面归面 ①）；**收尾口径零改**——不加 `excludePaths` 同款保护位（声明（用户）≠ 内建名单（产品）：SKIP_DIRS 命中文件本不该有行，存量 = 残余，沿上「二路」收敛）；

判假围栏名**不入表**（出现实测需求再补）；`tools/tree.mjs` ∥ `index-discover.mjs` ∥ 桌面 `at-complete.mjs` ∥ `scripts/**` 同名常量 = 各自独立面（非索引判定），零触。

**判据项（逐条机检 · 号承上）**：

- **L-①-1（声明面）**：manifest 夹具含 `index.excludePaths:["./openclaw/","refs",""]` ⇒ 投影 `["openclaw","refs"]`（`/` 归一 · **首部 `./` 剥离** · 去尾斜杠 · 空 ∕ 非串元素剔除）；非数组形态 ⇒ 档非法（fail-closed，与 `index.*` 同款）。
- **L-①-2（过滤 · 四半条）**：① 夹具树（含 `openclaw/` 与 `openclaw-fork/`）⇒ `listProjectFiles`（git ∕ walk 两径）零返回 `openclaw/**`、返回 `openclaw-fork/**`；② walk 径 = 剪枝形——全部可索引文件位于排除子树 ∧ `maxFiles` 小于该子树文件数 ⇒ 返回空 ∧ `truncated=false`（后过滤实现会 `truncated=true`——判别形）；
  ③ `reindexFile` 对排除路径 = 零写（spy 句柄零 `INSERT` ∕ `UPDATE` ∕ `DELETE`）；④ 声明加入后全量同步 ⇒ 排除路径存量行逐键不变（收尾保护位短路——收敛仅经 `sweep --path`）。
- **L-①-3（剪枝）**：`--origin X --path openclaw` 干跑 = 仅命中行动作 `delete`；`--confirm`（沙箱库）⇒ 命中行 0 ∧ 非命中行逐键不变 ∧ 备份存在 + `integrity_check` ok；零命中 ⇒ 无备份、零写。
- **L-②-1（B2）**：`PRAGMA user_version = 10` ∧ `sqlite_master` 含两枚部分索引（DDL 锚 = B2 行：`code_chunks_embedding_null` ∕ `doc_chunks_embedding_null`）∧ **两探针计划读数（实测形）= `SEARCH <表> USING INDEX <名> (embedding=?)`**
  ——断言 = 含 `USING INDEX` ∧ 不含 `SCAN` 字面（实测环境 node:sqlite 3.53.4）∧ 置 NULL 夹具行 N 枚 ⇒ `LIMIT 64` 仍返回恰 64。
- **L-②-2（B3 ∕ B4）**：接线夹具断言 SQL 含 origin 绑定 + 有界形（B3 = 计数子查询 `LIMIT WARN+1` 形；B4 = 文件行 `LIMIT WARN+1` 形——**随 WARN 常量**，现值 = `100001`）；越界返回串 = 「+」形（`100000+`）∕ 提示行（B4 越界 = 跳过大纲构建）。
- **L-②-3（B6 ∕ M3）**：注入计数 `yieldFn` ⇒ stale 行数 ≥ 阈值时让出次数 ≥ 1。
- **L-②-4（B7 读面零写）**：spy 句柄（记录 `prepare(sql)`）驱动 `search` ∕ `docSearch` ∕ `codeSearch` ⇒ 零 `UPDATE` ∕ `INSERT` ∕ `DELETE`；模型键不匹配 ⇒ 结果 = FTS-only（向量零计分）+ 一行可见。
- **L-②-5（worker 触发）**：本单元测试档探针脚本落该档——**夹具基线 = 缺省工作集 origin**（实态行数同量级夹具；复测 = 真库只读）；读数 ≥ 0.5 s ⇒ 下一轮升级判据，< 0.5 s ⇒ 不触发（**两向读数落档**）。判别换算 = 26 µs ∕ 行 ⇒ 0.5 s ≙ ≈1.9 万行；预算上界档（= CAP 档）读数 = 结构量级参考，不作触发判别。
- **L-③-1（P1）**：`memoryStatus` 夹具 ⇒ `dbBytes` = `statSync` ∧ 逐 origin 行数 = 直读聚合同值。
- **L-③-2（P2）**：夹具 origin 既有行数（code + doc 合计）置于 CAP 邻域 ⇒ 回执 `budgetSkipped > 0` ∧ 跳过文件零落行（逐 `rel` 新旧行数差 = 0）∧ 两跑跳过集逐字相等（处理序确定性）∧ WARN 行恰一。
- **L-③-3（M1）**：两 origin（两仓）各自 sync ⇒ 两枚 `last_indexed_commit:<origin>` 键互不覆盖；legacy 单键在而无 per-origin 键时 `gitSync` = null（全扫一次）。
- **L-③-4（M2）**：夹具仓 + 子目录 origin；落锚后 touch 子目录内文件 ⇒ gitSync 重索引该文件（非删除支）∧ 落行 path 与 `codeSync` 同形；改仓根他处文件 ⇒ 不索引。
- **L-③-5（行预算用户面 · F-S14 ∕ N-S10）**：① **常量**——`INDEX_ORIGIN_ROW_WARN = 100000` ∧ `INDEX_ORIGIN_ROW_CAP = 300000`（直读 schema）；
② **WARN 行（≥ 100k 夹具 · 计数注入）**——恰一行 `console.warn`：`[memory] index origin=<o> rows≈<n> (code + doc)` ∧ n = 真实行数（非阈值常量兜底 ∥ 非「+」截断形）∧ 无「WARN」∧ 无 `declare ∕ prune ∕ sweep` 形；

③ **CAP 行（≥ 300k 夹具）**——含「new files are not being indexed for now」（停收新档语义）∧ 选项式指路（`Options:` 枚举——`index.excludePaths` + `memory sweep`）∧ 无「WARN」∧ 跳过后列文件行为不变（`budgetSkipped` = 列序后缀 ∧ 逐 `rel` 零落行 ∧ 两跑跳过集逐字相等——L-③-2 同款）；

④ **显示面随动（F-S14 ③）**——「+」界 = WARN 线随动：头部计数 < WARN 给真实数（非「+」）∥ 越界回「+」形 = `100000+`（`setup.mjs` 读常量——功能零改；唯一触碰 = `thincoder-core/agent/setup.mjs:115` 注释值面一行）∥ B4 文件行上界同源（`repomap.mjs` `LIMIT WARN+1`）；
⑤ **零行为变化（数值面外）**——`over()` ∕ `add` 刻度 ∥ 回执 ∥ `logEvent` 名 ∥ 跳过语义逐字不变；测试 = 单元测试档（已落——计数注入形 · 轻量）。
- **L-④（home 根防护 ∥ SKIP_DIRS 补表）**：① **home 根检测**——启动索引 ∥ `/reindex` 触发面（`thincoder-cli/src/tui/startup.mjs` `backgroundIndex` ∥ `cmd-reindex.mjs`）于 `cwd === 用户主目录`（`resolve` 后平台归一比较——win32 大小写不敏感）⇒ **跳过索引**（`gitSync` / `codeSync` / `docSync` 零调用）；
  + 一行可见提示（含出路：项目目录启动——**去 `index.excludePaths` 半句**：跳过判据无条件、不查声明）——**不阻断启动**（不砖死）；
  ② **`SKIP_DIRS` 补用户目录常用项**（`Library`=macOS ∥ `go`=Go 工作区——basename 匹配 · 任意深度剪枝，与既有平台项同款；**误剪接受面**：非用户目录下同名目录（如源码树内 `go/`）同被剪——承既有表同款口径，登记为已接受面）；③ 排除表零声明面（常量——同「行预算常量不可声明」款）。

- **L-⑤（排除名单补强）**：① **谓词矩阵（族分折）**——面④判假围栏表逐例 + 垃圾族正例（精确 ∕ 任意深度 ∕ win32 大小写变体）+ 位置族正例（精确拼写）+ 位置族变体判假（`desktop` ∥ `library`——win32 同锁），`isSkippedRelPath(rel, platform)` 直调双道（win32 ∥ POSIX）判真 ∕ 判假逐例断言；
② **单源结构性**——`SKIP_DIRS` ∕ `SKIP_DIRS_FOLD` ∕ `SKIP_DIR_PREFIXES` 在产品码内仅经 `isSkippedRelPath` 消费（匹配点唯一）∧ 行为双径（非 git 夹具走 walk ∥ git 夹具走 `ls-files`）同剪（新名 + 判假围栏各断）；
③ **零回归**——POSIX 逐字（含垃圾族）；位置族全平台逐字（判定同）；win32 折仅垃圾族（有意面——`Node_Modules` 类）∥ 位置族变体判假锁（全表折误剪面 443 行的判别形）；

④ **存量收敛（ops 判据）**——`sweep --origin <o> --path <前缀>` 干跑 = 仅命中行动作 `delete`；`--confirm`（沙箱库）⇒ 命中行 0 ∧ 非命中行逐键不变 ∧ 备份 `integrity_check` ok；实库存量现值 = 0（obj ∥ vendor 已清——在册）。

**边界（不做）**：不引入 worker ∕ 线程化（升级触发见上）；不改召回语义（F-M3：仍全表评分、无近似 ∕ 剪枝）；不动 ANN ∕ 向量索引（D-MEM13）；不改工具契约 ∕ limit ∕ RRF；v10 只**增索引**（无表结构 ∕ 行级变更）；自动删除 ∕ 自动 VACUUM = **面 ⑤（自愈轮——用户拍）**；`D:/dgx-spark` 系 origin（含变体）处置 = 用户裁定项（非默认动作）；不并 #694（渲染侧）。

**面 ⑤：索引自动维护（自愈轮）**

需求锚 = `docs/core/requirements/MEMORY.md` §4.12（F-S10–F-S13 ∕ N-S8–N-S9——判定句回指该节，本处只给机制）。

**引擎（核新档 `thincoder-core/memory/maintain.mjs`（已落））**——三动作 + 单入口 `maintainMemory`；与既有面单源关系（复用 ∥ 扩展）：

| 面 | 单源 | 关系 |
|---|---|---|
| 探针 ∕ 树态 | `sweep.mjs` `probeOriginPath`（仅 ENOENT 判亡）∥ `treeState`（原样 ∥ 归一形双路径） | 复用（鬼行 GC 逐档探针同谓词；`treeState` 加 `export`（`probeOriginPath` 原已 export）——零行为变） |
| 备份 | `sweep.mjs` `takeBackup` ∥ `backupPathFor`（`VACUUM INTO` + 判据；命名 `.sweep-backup-<戳>`） | 复用（维护跑与 sweep 同判据同命名；`takeBackup` 加 `export`） |
| 计数 | `sweep.mjs` `originCounts`（写后回读基准） | 复用（加 `export`——零行为变） |
| 折叠 | §6.11 步 2 ∕ §6.13 信号 A | **不涉**——鬼行 GC 不折叠（信号 A 归 sweep 全扫档；判据零改） |
| 事务 ∕ 回读 | §6.13 写面形（`BEGIN IMMEDIATE` + 写后回读 + 失败回滚） | 同款（逐动作判据定制） |

**⑤-1 跨 origin 鬼行 GC（F-S10）**：扫描 = `code_chunks` ∥ `doc_chunks` 按 `(origin, path)` 分组（全 origin——含停更者）；
判亡 = 逐档探针 `join(origin, path)`——**原样 ∥ 归一形两路径皆 ENOENT 才判亡**，其余错误保留（仅 ENOENT 判亡同律）；
**origin 树亡短路** = `treeState` dead ⇒ 该 origin 全档判亡（同一判据免逐档探针）；**活行零触**（文件在盘 = 保留——收录范围 ≠ 维护面）。

写面 = 单事务逐 `(origin, path)` 删行（FTS 随触发器同步）；备份档位同 §6.13（命中 > 0 才取；dry-run ∥ 零命中不取）；
写后回读 = 命中组零行 ∧ 非命中组逐键等前值 ∧ 保留（探针错）组零变。`files` 表不涉（记忆层非项目文件——§6.14 既有口径）。

**⑤-2 压实自触发（F-S11）**：判据 = `freelist_bytes ≥ 64 MiB` ∧ `freelist_bytes ∕ db_bytes ≥ 20%`（双式联立——核常量 · 缺省值 = 用户拍项；常量不声明——先例「行预算常量不可声明」）。
读数 = `PRAGMA freelist_count × page_size` ∥ `statSync(dbPath)`（承 §4.10 读数面口径）。未越阈 ⇒ 跳过（零动作 ∥ 零写入——N-S9）。

执行 = `VACUUM`（写后回读 = freelist 回落 ∧ 尺寸 ≤ 前）；忙 ∥ 失败 ⇒ 跳过（fail-safe——不改数据）。不自动改库结构 ∥ schema ∥ 索引定义。测试缝 = 阈值注入参数（`??` 缺省核常量）∥ `vacuumFn` 注入（缺省 = `exec` 形 `VACUUM`——执行观测 = 注入计数）。

**⑤-3 备份轮转（F-S12）**：口径 = 维护型备份族 = `<basename(dbPath)>.sweep-backup-<14 位戳>`（严格名匹配——非前缀）；
保最新 N 枚（N = `config.memory.maintain.backupKeep`——缺省 2 · 钳 ≥ 1），其余逐枚删除（引擎直落 `unlink`；失败跳过计数——不抛）；非本族文件零触。

删除面纪律 = 引擎直落 ∥ 不经 agent 工具面（分类门辖 agent 写面——库外 `.thincoder/*` 无声明段命中 ⇒ 兜底 code 面；手动清理既有通路 = 改名 `tmp-*`（temp 面）后经 delete 工具——本会话实证，登记为 ops 参考）。

**⑤-4 agent 触发通道（F-S13）**：`memory` 工具新增 action `maintain`（六动作）；缺省 = 干跑（计划 + 逐动作读数——零写）；`confirm:true` ⇒ 执行。
执行序 = 备份先行 ⟶ 鬼行 GC ⟶ 压实（按后读 freelist 判）⟶ 轮转；输出 = 逐动作段（执行 ∥ 跳过 + 理由 + 读数）。

描述文本（`thincoder-core/tool-docs/memory.md`）= 提示词面（主 agent 定稿）；VSC 工具面（`thincoder-vscode/src/memory-tool.mjs`）动作清单同批补 `maintain`（执行委托核面——端区零自持算法）。

**⑤-5 触发接线（启动后低峰窗口 · 幂等）**：核侧调度 `scheduleMemoryMaintenance({ dbPath, delayMs = 3000 })`——**每进程一次** + 延迟拍 + 异步非阻塞 + 失败静默（+ `logEvent`）；库不在盘 ⇒ 零动作（不建库——读面纪律）；测试缝 = `_setMemoryMaintenanceDelayForTest`。**自动拍写姿态 = 非干跑**——计划随行后执行 ∥ 备份先行；干跑默认只辖工具缺省（⑤-4）。

落点 = ① CLI：`thincoder-cli/src/tui/startup.mjs` `backgroundIndex` 收尾（Ready 置后；home 跳过档不拍——登记接受面）② 桌面：`thincoder-desktop/src/main/main.mjs` 启动拍邻位 + 新档 `memory-maintenance.mjs` 惰性转口（`node:sqlite` 不入端壳静态闭包）③ agent：会话内工具显式（⑤-4）。**VSC 自动拍缺位登记** = 端壳多窗 ∥ 惰性句柄——自动拍不落 VSC；触发经工具面（⑤-4）。

幂等 = 进程内一次性 + 逐动作阈值 ∥ 空集判（后到者零写）+ 跨进程单事务 ∥ `busy_timeout` 兜底 ∥ 备份撞名 fail-closed（§6.13 既有判据）。

**⑤-6 安全封套 ∥ 读数（N-S8 显式化）**：**同一引擎同一安全口径** = 自动拍 ∥ 工具（∥ 将来命令形）皆经 `maintainMemory` 单点——备份先行 ∥ ENOENT-only ∥ 干跑读数随行（工具面缺省 = 干跑；自动拍写姿态 = 非干跑——⑤-5）∥ 写后回读。
**低峰不阻塞** = 鬼行扫描分片让出（`SCAN_YIELD_MS` 口径——探针循环读钟让出）∥ 写面短事务 ∥ `VACUUM` 单语句不可让出（成本 ∝ 库重写——仅双式越阈 ∥ 窗口内执行；升级路径 = worker，承面② 判据项）。

**读数面挂靠 §4.10**（`dbBytes` ∥ 逐 origin 行数 = `memoryStatus` 口径不变——零新计数面；freelist = 维护内部读数，不入可见面）。可见面 = CLI 有动作时一行 ∥ `logEvent`（端面板零改）。

**判据项（逐条机检 · 号承 §6.14 上族）**：

- **L-⑥-1（F-S10 · 鬼行 GC）**：表集 = `code_chunks` ∥ `doc_chunks`（夹具 ∥ 读回 ∥ 「鬼行 0」皆限于此二表；`files` 行归 §6.13 sweep ∥ `syncDir` 面）；沙箱夹具三 origin——A 树亡 ∥ B 树活且独档被删 ∥ C 树活全档在盘；① 干跑 = 计划含 A 全档 + B 死档 ∧ 零写（行 ∥ 字节不变、无备份）；② `confirm` ⇒ A ∥ B 死档行归零 ∧ C 逐键等前值 ∧ 探针错档零变 ∧ 备份在册（`integrity_check` = ok）∧ 报告含干跑先行读数；
  ③ 探针错误用例 = `probeFn` 注入缝返回 unknown ⇒ 该档保留。
- **L-⑥-2（F-S11 · 压实）**：阈值注入参数（`??` 缺省核常量——⑤-2）置小值 + 沙箱库造 freelist：① 双式全越 ⇒ 执行（注入计数 `vacuumFn` = 1）∧ freelist 后 < 前 ∧ 读数在；② 单越一式 ⇒ 跳过 + 理由；③ 全未越 ⇒ 零执行（注入计数 `vacuumFn` 零调用）；已知界（登记）= `VACUUM` 单语句不可让出——阻塞 = 恰一次全库重写（手清实例 2054.1 ⇒ 1006.0 MiB；时长未记）。
- **L-⑥-3（F-S12 · 轮转）**：N+k 枚族内夹具 + 干扰档（8 位戳 ∥ 族外名）⇒ `confirm` ⇒ 恰余 N ∧ 最老者被清 ∧ 干扰档在场 ∧ 失败档（占用）跳过计数不抛；干跑 ⇒ 零删 + 清单在；钳制支 = N=0 ∥ 负值 ⇒ 引擎钳 1 ⇒ 恰余 1。
- **L-⑥-4（F-S13 · 工具）**：① 缺省调用 = 干跑零写 + 逐动作段（执行 ∥ 跳过 + 理由）在场；② `confirm:true`（沙箱）⇒ 执行读数 + 备份在册；③ VSC 面动作闭集含 `maintain`；④ 未知 action 仍拒。
- **L-⑥-5（N-S8 ∥ N-S9 · 封套）**：① 单点结构断言——自动 ∥ 工具两入口皆经 `maintainMemory` ∧ 同夹具两入口读数等值；② 备份判据两项——命中 > 0 才取 ∥ 目标已存在 ⇒ 抛 ⇒ 零写；③ 零空转 = 干净夹具（零鬼行 ∧ 未越阈 ∧ 备份 ≤ N）`confirm` ⇒ 零写（行 ∥ 字节 ∥ 备份集全前值）；④ 让出分支 = 注入计数 `yieldFn` ⇒ 鬼行扫描越阈值时让出次数 ≥ 1（承 L-②-3 形——N-S8「低峰不阻塞」半条）。
- **L-⑥-6（接线 · 幂等）**：① 调度器直测——二次调用返 `false` ∧ 延迟缝在场 ∧ 库不在盘 ⇒ 零动作且不建库；② 落点结构断言——CLI `backgroundIndex` 尾 ∥ 桌面启动拍邻位 + 惰性转口（静态闭包零 `node:sqlite`——承壳护栏判据）；③ 并发用例 = 先后两跑同夹具 ⇒ 后到者逐动作零写 ∥ 跳过。

**边界（不做）**：不做 origin 结构卫生（盘根僵尸 ∥ 变体折叠 ∥ 嵌套重叠 ∥ 存量树——另议）；不自动扩缩收录范围（收录 = 声明 ∥ 名单面——维护 ≠ 裁决）；
不提供绕过阈值的强制压实；不做 CLI 命令形（引擎已备——出现实测需求再补；**工具一面即达标**——命令形 = 边界在册）；`files` 表不涉；不引 worker（升级触发承面② 判据项）；
§6.11 ∥ §6.13 既有判据零改（折叠 ∥ 探针 ∥ 安全三件 = 复用非改）。

**面 ⑥：批次档面默认排除（产品自定记录面）**

需求锚 = `docs/core/requirements/MEMORY.md` §4.14（F-S15 ∥ N-S11——判定句回指该节，本处只给机制）。

**裁决（用户）**：批次档面 = **产品自定记录面** ⇒ 索引面**无条件默认排除**——「不管 manifest 里配置没配置排除路径，都把批次档目录排除掉」（**无逃生口**）；`index.excludePaths` 声明键 ∥ 写面判定零改（与面① 声明面两单源并列、互不吞）；读面准入 = 谓词全判（连带登记见边界行）。

**落点（定死）= 谓词内**：判定落**单源谓词本体**（`thincoder-core/declaration.mjs:110` `isExcludedRelPath` 本体扩展 ∥ `thincoder-core/conventions.mjs:192` 再出口——不新立第二判定面）。理由：① 面① 全部既有接线（`file-list.mjs` git 列面 ∥ walk 剪枝 · `code-sync.mjs:98` diff 缝 · `code-sync.mjs:250` `reindexFile` 单文件缝）
+ 收尾保护位（`sync-tail.mjs:77`）皆经该谓词消费 ⇒ **收录面零消费面改动**即全缝生效（读面准入 = 本面另接两处——见下）；② 收尾保护位自动对齐——批次档存量行不因本机制经同步删除（「历史行不删不损」N-S11）；
③ 若落「文件列面默认」（`file-list.mjs` 面）则 diff 缝 ∥ 单文件缝 ∥ 保护位三处需各自另接（漏点面 = 风险面）。

**目标集（联合口径——约定段 ∪ 声明值）**：

- **约定段** = `DEFAULT_MANIFEST.docRoot.batches` 归一段序列（现行 = `["docs","batches"]`——schema 单源派生；默认值改名/迁移两处同动）；**恒判**（不看声明 ∥ 不看 `null`）。
- **声明值** = `docRoot.batches` 值（串 ∥ 串数组；归一同 `index.excludePaths`：trim ∥ `\`→`/` ∥ 首部 `./` 剥离 ∥ 去尾斜杠 ∥ 空剔除 ∥ 去重保序）——`declaration.mjs` 投影新增 `batchRecords` 字段（`declared` 旗刻度零改——docRoot 族不入该旗，现状）；**`null`（本面无）⇒ `[]`**（无附加目标——约定段恒在，**不是逃生口**）；缺档 ⇒ `[]`（约定段已罩默认位置）；值含 `.` ∥ `..` 段 ⇒ 取剔除两类段后的实义段序列。
- **改名/自定义值**：自定义值 ⇒ 新位置同罩；**旧约定位置 `docs/batches` 仍排除**（无条件裁决——罩历史位置与跨仓嵌套形）。

**判基 ∥ 匹配**：判基 = 面① 同款换算（`base` 换算至 `decl.root` 根面；**越根 ⇒ 面⑥ 判原样 rel（不回退）**——面① 不命中口径逐字零改）；匹配 = **段序列连续命中于路径任意深度**（段边界 = 整段一致）；大小写 = 精确（同 `index.excludePaths` 面口径——不回折）；**无通配**（glob ∕ regex 不做——段序列字面）。

正例：`docs/batches/x.md` ∥ `docs/batches`（恰等）∥ `thincoder/docs/batches/x.md`（**工作区根形**——本会话实测开法：origin = 工作区根、无 manifest、注入路径形 `thincoder/docs/batches/…`）∥ `a/docs/batches/b.md`；
判假围栏：`docs/batchesx/x.md` ∥ `docs/batch/x.md` ∥ `doc/batches/x.md` ∥ `docsX/batches/x.md` ∥ `batches/x.md`（约定段单段——不命中）。

**存量行处置（定形 = 读面准入过滤；行不删）**：

- **不删不损**：收尾保护位自动短路（见落点②——面① 同款）；清理 = **ops 可选动作**（`memory sweep --origin <o> --path <前缀>`——备份先行 ∥ 干跑默认 ∥ 写后回读（§6.13 安全三件）；**非本节动作**；工作区根形 origin 的前缀给 `thincoder/docs/batches` 形——逐 origin）。
- **可见面退场 = 读面准入过滤**（**「批次档从未入索引」等价检索**）：位置 = 两检索函数（`memory/docs.mjs` `docSearch` ∥ `memory/code-search.mjs` `codeSearch`）**准入位**——FTS 列表建成后 ∥ 向量扫描 `onRow`（top-K push 前）各滤一道；
行判 = **同一谓词全判**（`isExcludedRelPath(path, decl, origin)`——面① ∪ 面⑥ 两族：`index.excludePaths` 命中存量行同判不可见；同一谓词，非第二判定面）。

**行 origin 获取**（逐 origin 预载声明一次；行 origin 为 `base`）：FTS 支 = 单 origin 形 SQL 零改 ∥ 多 origin ∥ 无过滤形补 `origin` 列；向量支 = 多 origin 逐 origin 分趟（趟内 origin 已知）∥ 无过滤形 = 游标键已含 `origin` 列（`thincoder-core/memory/docs.mjs:147` ∥ `thincoder-core/memory/code-search.mjs:65` 现体——行 origin 随行可得，SELECT 零改）。
- **两消费口同净**：回合注入块 ∥ `doc_search` 工具（同一 `docSearch`）∥ `code_search` ∥ VSC `doc_search`（委托核面——`thincoder-vscode/src/tools/code.mjs:62`）——即时零命中（**不待存量清理**）。
- **过滤欠额边界**：FTS ∥ 向量窗口 = `max(limit*4, 20)` 行——窗口被批次档行占满时结果可欠额（≤ 配额）；方向安全（少不杂），登记接受。

**边界（不做）**：`index.excludePaths` 声明键 ∥ 写面判定零改（互补不吞）；**读面连带登记**——读面准入 = 谓词全判 ⇒ `excludePaths` 命中存量行同判不可见（同一谓词，非第二判定面；行不删——收尾保护位 ∥ `sweep` 面零改）；
不硬编码其它目录名（`SKIP_DIRS` 族面④ 另一面——零触；本面 = 产品自定记录面默认——非猜用户布局）；不做通配；**无逃生口**（配置面不开关 ∥ `null` 不解除约定段——如需例外另裁）；

规模读数面不动（`memoryStatus` 计数 ∥ 注入块 B3 计数 ∥ 大纲 B4——库读数非检索面；新同步后自然不含批次档新档）；存量行清理不做（ops 可选——见上）。

**关系注（面⑦——同缝叠合）**：两准入过滤（面⑥ 批次档段序列 ∥ 面⑦ 声明范围门）同缝叠合 = **逻辑与**（先后无关）；声明预载 ∥ 缓存 = **同一 `clearDeclarationCache()` 单点**（测试缝同源——两批共用）。

**判据项（逐条机检 · 号承 §6.14 上族；用例落 = 本节单源）**：

- **L-⑦-1（谓词矩阵 · 段序列语义 · 直调）**：`isExcludedRelPath` 逐例断言——正例：`docs/batches/x.md` ∥ `docs/batches`（恰等）∥ `thincoder/docs/batches/x.md`（任意深度）∥ `a/docs/batches/b.md` ∥ 自定义值 ∥ 数组值（各段序列命中）；
  判假围栏：`docs/batchesx/x.md` ∥ `docs/batch/x.md` ∥ `doc/batches/x.md` ∥ `docsX/batches/x.md` ∥ `batches/x.md`；**零回归锚**——既有面① 用例（`a/b.mjs` 等）仍假；`index.excludePaths: []` 下正例仍真（不看声明）。
- **L-⑦-2（同步面 · 双径零收录）**：夹具树（`docs/batches/**` + 干扰树 `batches/` ∥ `docs/batchlog/`）× 两档 manifest（`excludePaths: []` ∥ 缺档）⇒ `listProjectFiles` 两径（git ∥ walk）零返回 `docs/batches/**` ∧ 干扰树照收（段边界不吞）；walk 径 = 剪枝形（子树不展开——`truncated=false` 判据同 L-①-2②）；`reindexFile` 对批次档路径零写（spy 零写）；`gitSync` diff 缝同判。
- **L-⑦-3（读面 · 存量行即时不可见）**：沙箱库先行注入批次档行（`doc_chunks` ∥ `code_chunks`——含嵌套形（前置目录段形））⇒ `docSearch` ∥ `codeSearch`（注入块两路分取口径 = `origins` 覆盖参两态）对批次档路径**零命中** ∧ 非批次档结果与「无批次档行同语料」参照逐字等值（准入位过滤——批次档行不进 RRF ∥ 不进 top-K）。
  **全谓词腿**：夹具另含 `index.excludePaths` 命中存量行（非批次档路径）⇒ 该行读面同判零命中 ∧ 未命中行照常可见（面① ∪ 面⑥ 同一谓词）。
- **L-⑦-4（存量行不删不损 · 保护位）**：批次档树在盘 + 全量同步 ⇒ 批次档存量行逐键等前值（收尾短路）∧ 非批次档路径行数逐字不变。
- **L-⑦-5（联合口径 ∥ 无逃生口）**：`docRoot.batches`（默认 ∥ 自定义串 ∥ 数组 ∥ `null`）× `index.excludePaths`（缺省 ∥ 非空）矩阵——批次档面判定不随 `excludePaths` 变 ∧ `null` 下约定段仍排除 ∧ 自定义值新位置命中 ∧ 旧约定位置仍命中。

**面 ⑦：索引范围声明化（结构门——只吃声明目录）**

需求锚 = `docs/core/requirements/MEMORY.md` §4.15（F-S16 ∥ N-S12——判定句回指该节，本处只给机制）。

**裁决（用户）**：「只索引 manifest 指定的目录……还要考虑一级子目录下的 manifest。」= **结构门替换开放式排除**（**未声明 ⇒ 不进**）；两层锚 = 锚自身 ∥ 一级子目录。

**范围求并（单源 = `thincoder-core/declaration.mjs` 新谓词族——`declaredIndexScope(dir)` ∥ `isInDeclaredScope(rel, scope, base)`）**：

- **条目（entry）= 范围贡献单位**：`declaredIndexScope(dir)` → 冻结条目数组（去重保序），两族——
① **锚条目**：`dir` 的**管辖 manifest** 在场（`existsSync(manifestFilePath(dir))`——`thincoder-core/manifest.mjs:131` 同一根解析：最近祖先带档 ∥ 发现兜底；**可高于 `dir`** ⇒ 深 cwd 等义）⇒ 一条目（`root` = 档所在目录）；

② **子目录条目**：`dir` 的**直接子目录**逐目录判——非跳过段（`isSkippedRelPath(name)`——点目录 ∥ 内建名单，防 `.thincoder/tmp` 类伪档）∧ 该目录根下 `MANIFEST_REL` 在场 ⇒ 一条目（`root` = 该子目录）。**一层、纯向下、绝不向上**（发现纪律在案）。
档在场但**非法**（坏 JSON ∥ 形态错）⇒ 该条目**按默认值**参与 + 既有可见告警（KD-M1-32 链零改）；档**缺** ⇒ **无此条目**（缺档 ≠ 档非法——KD-M1-2）。
- **条目三键** = `root`（仓根绝对路径）∥ `docPaths`（`docRoot.*` 五子键值**合并**展开——串 ∥ 串数组 ∥ `null`（本面无 ⇒ 零根）；解析基 = 该仓根（`docRootPaths` 单源）；去重保序）∥ `codePaths`（段名数组——缺键 ⇒ `["src"]`；`[]` = 无段面；归一既有）。
- **文件命中（纯谓词）**：`rel` 经 `resolve(base, rel)` 绝对化（同面① `base` 换算口径；越根 ⇒ 不命中）⇒ 取归属条目（abs ∈ `root` 子树；无 ⇒ **未声明** ⇒ 不命中）⇒ 两面试任一中即入范围：
  · **文档面** = 条目根相对面**字面前缀**（恰等 ∨ 后随 `/`——路径及子树；值指向文件（如 `docs/RELEASE.md`）⇒ 恰该文件）；
  · **代码面** = 条目根相对面**段序列任意深度命中**（`codePaths` **键语义零改**——本规 = 新增消费点；大小写不敏感 = 既有谓词口径）。
- **并集 ∥ 零回落**：任一命中即入；条目集空（锚与子目录皆无档）⇒ 范围空 ⇒ **零索引**——**不回落全树**（「回落」= 逃生口，用户明拒）。

**键面表（定死——含缺省 ∥ 空值）**：

| 键 | 面 | 值形 ∥ 缺省 | 空值语义 | 命中判据 |
|---|---|---|---|---|
| `docRoot.*`（五子键） | 文档面 | 串 ∥ 串数组 ∥ `null`；缺键 ⇒ 默认五路径（schema 单源——**档在场才补**） | `null` = 本面无（零根）；`[]` 非法（既有判据零改） | 根相对字面前缀（恰等 ∨ `/` 后随）——路径及子树；文件值 = 恰该文件 |
| `codePaths` | 代码面 | 段名数组；缺键 ⇒ `["src"]`；非数组 ⇒ 默认（既有归一） | `[]` ⇒ 代码面零命中 | 段序列任意深度命中（大小写不敏感） |

**无 manifest 行为（三格）**：① 锚无管辖 manifest ⇒ 锚条目缺席——**不落默认五路径**（默认值只在「档在场、键缺」时生效）；② 一级子目录无 manifest ⇒ 该子目录**整树不进**；③ 锚与子目录皆无 ⇒ **零索引**（不回落全树）；④ **补 manifest（∥ 补声明）即回归**——存量行不删（见下）⇒ 回归 = 即时可见、零重嵌（写门工具写档成功即清缓存——fix 轮接线；手工改档 ⇒ 重启生效）。

**生效点（三写 + 两读 + 一保护位）**：

- **写入面（收录）**：① `listProjectFiles`（`memory/file-list.mjs:81` git 列面逐行 ∥ `:61` walk 径文件准入）；② `gitSync` diff 缝（`code-sync.mjs:98`）；③ `reindexFile` 单文件缝（`code-sync.mjs:250`）。既有面**叠加不替换**（`isSkippedRelPath` 面④ ∥ `isExcludedRelPath` 面①∥⑥ 续效）。
  walk 径口径（如实）：**逐文件准入、不剪枝**——段序列可命中任意深度 ⇒ 上层目录无剪枝判据（面① ∥ 面⑥ 的「子树零展开」不适用本门）；**库面目标不受影响**（`MAX_WALK_FILES` 只计收纳文件——`file-walk.mjs:115`）；**随动登记**：范围外文件不耗预算 ⇒ 截断语义随动（截断 = 面内清单被截——可见面收窄）；范围外文件多时全树枚举成本上升（如实登记，不另设机制）。挂接 = `file-walk.mjs` 新增可选 `isInScope` 文件准入钩（剪枝位不接）。
- **读面（存量行退场——面⑥ 同机制）**：`docSearch` ∥ `codeSearch` **准入位**（FTS 列表建成后 ∥ 向量 `onRow`（top-K push 前））各滤一道——行判 = `isInDeclaredScope(path, declaredIndexScope(origin), origin)`（逐 origin 预载一次；单 origin ⇒ SQL 形零改 ∥ 多 origin ⇒ FTS SELECT 补 `origin` 列——`docs.mjs:121-126` ∥ `code-search.mjs:39-44` 现体）。
  缓存 = scope 缓存（`clearDeclarationCache()` 同清——测试缝）。
- **收尾保护位**（`sync-tail.mjs:77` `sweepStaleRows`）：stale 删除对**范围外**路径短路（面① ∥ 面⑥ 同款）——存量行**不因声明经同步删除**。

**存量行处置（不删不损 + 读面准入过滤——定形同面⑥）**：行不删（保护位）∥ 可见面即时退场（准入过滤 =「范围外路径从未入索引」等价检索）∥ 清理 = **ops 可选动作**（`memory sweep --origin <o> --path <前缀>`——备份先行 ∥ 干跑默认 ∥ 写后回读（§6.13 安全三件）；**非本节动作**）。**读数面申明（面⑥ 同款）**：范围外存量行在 `repo_outline`（`code_chunks` 直读）∥ 计数面照旧可见——非检索面；随 ops `sweep` 消退。

理由：① 声明可改——补声明 ⇒ 即时回归（零重读重嵌）；② 同步收尾删除**无备份**（`sync-tail.mjs:77-80` 既有口径）——声明驱动自动删行 = 无回退面；③ 与同日面⑥ 形态一致。

**关系注（面⑥ ∥ §6.15 ∥ 面①）**：
- **面⑥ 叠加**：`docs/batches` ∈ `docRoot.batches` 声明面 ⇒ 范围罩不住批次档——两规则**叠加**（范围门 ∩ 批次档无条件排除）；面⑥ 已裁结论零改（只加本注）。
- **§6.15 逐根**：三同步入口**根集**不变（入口 dir + 声明公共仓逐根）；**每根各按本规算范围**。**登记（连带）**：公共仓根与其一级子目录皆无档 ⇒ 该根零收录（补 manifest 即回归）——「声明根 = 整树收录」= 单列项②。
- **面① 面内续效**：声明目录内部的 `index.excludePaths` ∥ SKIP 表判定零改。

**本工作区覆盖对照表（origin = `D:/teamcode` 开法）**：

| 区域 | 落规后 | 依据 ∕ 补救 |
|---|---|---|
| `thincoder/docs/{core,cli,vsc,desktop,server}/requirements` ∥ `thincoder/docs/{core,cli,vsc,desktop,server,render-core}/design`（+ `modules`）∥ `docs/batches` ∥ `docs/RELEASE.md` | **入** | thincoder 条目 `docRoot` 值（requirements 五面 ∥ design 六面——按档实值分列） |
| `thincoder/thincoder-{cli,vscode,desktop,server}/src/**` | **入** | thincoder 条目 `codePaths: ["src"]`（段序列任意深度） |
| `thincoder/thincoder-core/**`（核库全树——`memory/**` ∥ `agent/**` ∥ `prompts/**` …） | **出** | 无 `src` 段 ∥ 无 docRoot 声明——补救 = `codePaths` 补段（如 `thincoder-core`） |
| `thincoder/thincoder-{cli,vscode,desktop}/*/docs/**`（子项目文档——`-cli/docs` ∥ `-vscode/docs` 在册读数 3,878 ∥ 2,033） | **出** | 未声明（docRoot 指 `docs/…`，非 `thincoder-cli/docs/…`）——补救 = `docRoot` 各角色值补路径 |
| `thincoder/thincoder-cli/{test,bin,scripts}/**` ∥ `thincoder-desktop/{renderer,test,tools}/**` ∥ `bench/**` ∥ `scripts/**` | **出** | 未声明（段面不含这些名）——按需补 `codePaths` |
| `thincoder/docs/_archive/**` | **出** | 未声明（「批档 53% ∥ `_archive` 24%」两源头之一；批档面另见面⑥） |
| `thincoder/*.md`（仓根散档：README.md 等） | **出** | 根级散档——单列提议① |
| `thincoder.com/docs/{requirements,design,…}` ∥ `www/**` ∥ `scripts/**` | **入** | thincoder.com 条目（docRoot 默认五键 + `codePaths: ["www","scripts"]`） |
| `thinworker/**` ∥ `thinworker.com/**` ∥ `thincoder-issues/**` | **出** | 一级子目录无 manifest——**补 manifest 即回归**（各仓自查项） |
| `.thincoder/**` ∥ `.wt-head-probe/**` | **出** | 点段规则（面④——零改） |

**嵌套 ∥ 深度**：`thincoder-cli` ∥ `-vscode` ∥ `-desktop` ∥ `-server` ∥ `-render-core` **无自带 manifest**（全工作区仅 `thincoder` ∥ `thincoder.com` 两枚）⇒「锚上移至 `thincoder/` 时嵌套仓作为带档者参与」**无适用对象**（子项目经 thincoder 条目声明参与）；且它们**非独立 git 仓**（单仓多目录）。

**深 cwd**：项目内子目录启动（如 `thincoder/thincoder-cli`）⇒ 管辖 manifest = thincoder——代码面 `src` 段命中本子树 ∥ 文档面 = 0（管辖 docRoot 值全在本 origin 之外）——如实登记。

**边界（不做）**：不做根级散档（单列提议①）；不做通配 ∥ 正则 ∥ 自动发现（不扫全盘 ∥ 不递归 ∥ 纯向下——**一层**）；不改 `docRoot` ∥ `codePaths` ∥ `index.excludePaths` ∥ SKIP 表键值语义；不动检索顺序 ∥ RRF ∥ 工具契约 ∥ 行预算面；不做存量清理（ops 可选）；不做「未声明」提示 ∥ 引导面（另议）。

**单列提议（用户拍——勿暗定）**：
- ① **根级散档**（仓根下 README ∥ AGENTS.md ∥ CHANGELOG 类）：**现状落 = 不进**（字面「只索引目录」）；留门形 = 各仓根一层散档——代价 = 门形新增「根锚定」一类（与「不做通配」相抵）或逐仓补声明。请拍：保持不进（推荐——零新增机制）∥ 留门（另裁机制）。
- ② **公共仓根与其一级子目录皆无档**：现状落 = 零收录（同主规则）；备选 =「声明根 = 整树收录」。请拍。
- ③ **提示（口径确认）**：`codePaths` 面落 = **段序列任意深度**（键语义零改——`MANIFEST.md` §2.2）；备选 = 根相对目录前缀解——代价：键语义变更（段名 ⇒ 前缀）∥ 本工作区 thincoder 代码面 ≈ 空（无 `thincoder/src`）。如需备选 = 另裁。

**判据项（逐条机检 · 号承 §6.14 上族；用例落 = 本节单源）**：

- **L-⑧-1（范围求并 · 直调）**：夹具矩阵（锚有 ∥ 无管辖 manifest × 一级子目录带 ∥ 不带 manifest × `docRoot` 值串 ∥ 数组 ∥ `null` ∥ 文件值 × `codePaths` 缺省 ∥ `[]` ∥ 多段）⇒ `declaredIndexScope(dir)` 逐例断条目集（root ∥ docPaths ∥ codePaths）∧ 锚无档且子目录无档 ⇒ 条目集空；`isInDeclaredScope` 逐例判真 ∥ 判假（未声明 ⇒ 假；越根 ⇒ 假）。
  **档非法 ∥ 伪档格**：档在场但**非法**（坏 JSON ∥ 形态错）⇒ 该条目按默认值参与 ∧ 既有告警（KD-M1-32 链——不静默成零）；点段伪档（`.thincoder/tmp/…` 影子档）⇒ 不入条目扫描（跳过段零改）。
- **L-⑧-2（同步面 · 双径零收录）**：夹具树（in-scope `docs/**` + `src` 段 + 干扰树 out-of-scope）× 两档锚（有 ∥ 无 manifest）⇒ `listProjectFiles` 两径（git ∥ walk）零返回 out-of-scope 文件 ∧ in-scope 文件照收；`reindexFile` 对 out-of-scope 路径零写（spy 零写）；`gitSync` diff 缝同判。
- **L-⑧-3（读面 · 即时不可见 ∥ 保护位）**：沙箱库先行注入 out-of-scope 行（`doc_chunks` ∥ `code_chunks`——含嵌套形）⇒ `docSearch` ∥ `codeSearch` 零命中 ∧ 非 out-of-scope 结果与「无 out-of-scope 行同语料」参照逐字等值（准入位过滤——out-of-scope 行不进 RRF ∥ 不进 top-K）；全量同步后 out-of-scope 存量行逐键等前值（收尾短路）。
  **多 origin ∥ 无过滤形腿**：注入块两路分取口径（`origins` 覆盖参两态——与 L-⑦-3 同款）：多 origin ⇒ FTS 支 SELECT 补 `origin` 列 ∥ 向量支逐 origin 分趟（趟内 origin 已知）；无过滤形 ⇒ 行 origin 随行（游标键已含 `origin` 列）——两态逐行判范围（零命中 ∥ 参照等值同判）。
- **L-⑧-4（零回归锚 · N-S12）**：声明面内文件——同步收录 ∥ mtime 增量 ∥ 行数 ∥ 检索结果与改前逐字等值；面① ∥ 面④ ∥ 面⑥ **排除面谓词语义零改**（直调格证据在册；既有用例组随结构门变动者按旧件零维护纪律不清扫——#1354 备查）。
- **L-⑧-5（零索引 ∥ 不回落 · 反例锁）**：夹具（锚无管辖 manifest ∧ 零子目录带 manifest——全树含可索引文件）⇒ `listProjectFiles` 空 ∧ 同步零新增 ∧ 读面零命中；**反例锁** = 全树文件零收录（「回落全树」形零出现）。
- **L-⑧-6（两层锚 ∥ 判定句机检形）**：夹具（工作区根无 manifest ∥ 一级子目录 A 带 manifest 声明 `docs`+`src` ∥ 子目录 B 无 manifest）⇒ A 的 `docs/**` ∥ `src` 段命中 ∧ B 全树零命中 ∧ 锚自身未声明文件零命中；锚自带 manifest 档 ⇒ 自身声明 ∪ 子目录声明（并集）；深 cwd 档（锚 = 项目内子目录）⇒ 管辖 manifest 生效（面按仓根相对）。

### 6.15 声明公共仓的索引接入与跨仓引用

**单源声明** = `PROJECT-MANIFEST.json → index.publicRepos`（形态 / 缺省 / 校验 = `docs/core/design/MANIFEST.md` §2.2——本档不复述）；缺省 `[]` ⇒ **全链零行为变化**。

**默认来源 ∥ 微调位（用户确认）**：**工作目录（会话 cwd）树下的内容默认纳入检索 / 可读 / 可引**〔本面辖**根集**；根内纳入**检索**的目录集 = 声明目录（`docRoot.*` ∪ `codePaths`）——「可读 ∥ 可引」半句零改〕（标准排除 = 既有 SKIP_DIRS ∥ `excludePaths`）；
`index.publicRepos` **不承担可见性钥匙职责**——为**可选微调位**（越出 cwd 的源 ∥ 排除 ∥ 优先级——兑现 = 越界源；排除 = 既有 `index.excludePaths`；优先级 = 无载体，登记）。

**与「声明为唯一钥匙」模型的差别（一句）：默认来源 = cwd；声明 = 微调**。清单维护者 = **agent**（非用户）——维护句 = 提示词面（`PROMPT-SYSTEM.md` §6.15；写权照 ⑥ 判例）。

**值形 ∥ 解析唯一定义（两层输出分列）**：① **值形层（声明投影）**：值 = **从本仓根可解析的路径**（相对 ∥ 绝对同收；同级 `../` 合法）；归一 = trim · `\`→`/` · 首部 `./` 剥离 · 去尾斜杠 · 空 ∥ 非串剔除 · 去重保序 ⇒ **归一后相对串**（本层不解析、不拼根）。

② **解析层（消费根集）**：`declaredPublicRoots(cwd)`（`thincoder-core/declaration.mjs` 新导出）= 值形层逐项 `resolve(decl.root, p)` ⇒ **绝对根集**（`normalizeOrigin` 消费面）；**检索同步 ∥ 读面 origin 集 ∥ 引用解析三消费面共用（解析层），不得二写**；缺位存在性判（`existsSync`）归消费面，值形解析不回写。

**`declared` 连带**：`index.publicRepos` 非空 ⇒ `declared=true`（值比较——与 `index.excludePaths` 同款；判据正本 = `PORTABILITY.md` §3.1）。

**机制（三项）**：

1. **同步展开（写侧）**：三个同步入口（`codeSync` ∥ `docSync` ∥ `gitSync`）对**声明根集**逐根处理（入口 dir + 声明公共仓）——公共仓与入口同款：增量可行 ⇒ 增量（per-origin 锚既有），否则全扫；**展开只做一层**（公共仓自身的声明不递归）；各根自持其声明与行预算（WARN ∕ CAP 逐 origin 独立）。
   声明根缺位 ⇒ **整根跳过**（展开前判存在性——同步面不扫不删；存量行归 §6.14 面 ⑤ 维护面回收（备份窗内可回滚；树恢复 ⇒ 重新同步）；树改名 ⇒ 旧 origin 存量行同此；ops `sweep --origin` 通路仍在）+ 一行 `logEvent`。
2. **读面 origin 集（读侧）**：`docSearch` ∥ `codeSearch` 过滤集 = 项目 origin ∪ 声明公共仓 origin（各经 `normalizeOrigin`）；**单 origin（未声明 / 无项目）⇒ 逐字零行为**；多 origin ⇒ **逐 origin 分趟**：矢量扫描支 = 每趟**单 origin 等值**（`AND origin = ?`——游标键 `["path","line_start"]`，与单 origin 快径逐字同形同计划）；FTS 支 = `origin IN (…)` 单趟（无游标面）。
**不取**「`origin IN (…)` + 全 PK 游标」形（与 D-MEM22 否决形同构相邻——未取证形不引）；**合并** = 各趟候选统一收集后经既有稳定排序，并列分数定序 = **PK 元组升序**（`origin` → `path` → `line_start`——单 origin 面即扫描序；与趟序 / 到达序无关）。`thincoder-core/agent/setup.mjs` 每回合召回注入与计数行（B3）同用该集。

注入块**按来源分取**（本仓来源 ∥ 声明来源）——`docSearch` 可选 `origins` 覆盖参：缺省 `null` ⇒ 本函数自取 `searchOrigins`（现行为逐字）∥ 给定 ⇒ 以其为 origin 集（复用既有单/多 origin SQL 形）∥ 空数组 ⇒ 现「不过滤」语义；配额策略 = `AGENT-LOOP.md` §6.3（本档不复述）。
3. **跨仓引用（可核形——记录面同用）**：形态 / 解析序 / 处置 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.2；记录面有界例外 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §4.1；本档登记**解析消费面** = 锚机检声明源候选（`scripts/doc-check-anchors.mjs` 接线）。

**判据项（机检——单源 = §2；号 = §6.15 面）**：

- **L-6.15-1（声明投影——断值形层）**：夹具 `index.publicRepos: ["./../docs-repo/", "../mods/", "", 7]` ⇒ 投影 `["../docs-repo","../mods"]`（`./` 剥离 · `\` 归一 · 去尾斜杠 · 空 ∕ 非串剔除 · 去重保序）；非数组 ⇒ 档非法（fail-closed）；缺省 `[]` ⇒ 零行为。
  **解析层（绝对根集）不在本项**——`declaredPublicRoots` 经 `resolve(decl.root, p)` 产出、`normalizeOrigin` 消费（消费面判据 = L-6.15-2 ∥ L-6.15-3 ∥ L-6.15-4）。
- **L-6.15-2（同步展开）**：夹具两树 ⇒ 同步后两 origin 各有行；公共仓内单文件改动 + 复跑 ⇒ 增量只动该文件；公共仓自身声明第三仓 ⇒ 第三仓零行（不递归）；声明根缺位 ⇒ 零行零错 ∧ 存量行零变 ∧ `logEvent` 在场。
- **L-6.15-3（读面集）**：同库三 origin（项目 ∥ 声明 ∥ 未声明）⇒ 检索命中含声明源、不含未声明源；无声明夹具 ⇒ 结果与基线逐字等值（单 origin 快径）。
  **计划用例（多 origin 形）**：逐 origin 分趟——经 `runChunkedQuery` 缝捕获建后 SQL：① 趟数 = origin 集大小；② 每趟谓词 = 单 origin 等值 ∧ 游标键 `["path","line_start"]`（等值前缀列不入元组）；③ `EXPLAIN QUERY PLAN` 读数 = `SEARCH` 行（索引面）∧ **无 `USE TEMP B-TREE FOR ORDER BY`**（与单 origin 快径同形）；④ 合并并集排序与趟序 / 到达序无关（并列定序 = PK 元组升序）。
- **L-6.15-4（跨仓引用三态——三条独立谓词，各带一例）**：① `声明源在场 ∧ 目标档在` ⇒ **可解析（核绿）**（例：声明 `docs-repo` ∧ 目录在场 ∧ 声明仓内 `x.md` 在 ⇒ 非悬空）；② `声明源缺位` ⇒ **未核列报（报告面，不入闸——exit 0）**（例：同引用、`docs-repo` 目录不在 ⇒ 未核行列 + 汇总计数，不判悬空）；
  ③ `不可解析 ∧ 未声明` ⇒ **照旧判（悬空红）**（例：未声明仓 `other-repo` 的前缀引用——机检解析序不可达且无声明 ⇒ 悬空照红）；`声明在场 ∧ 目标档缺` ⇒ 悬空照红（真悬空）。细节 = 单元测试档（用例在册）。

**边界（不做）**：不做跨仓写（各仓写侧自持不变；`reindexFile` 单文件缝不覆盖公共仓——公共仓内改动由下次同步收敛，登记为已知形态）；不做自动同步（不 clone ∕ 不 pull ∕ 不跨仓搬内容——只把**已在本地**的声明目录纳入索引）；不新造索引系统（复用既有 origin ∥ 同步 ∥ 读面机制）；不改召回语义 ∥ RRF ∥ 工具契约；公共仓缺位 ⇒ 存量行归 §6.14 面 ⑤ 维护面回收（备份窗内可回滚；树恢复 ⇒ 重新同步）；ops `sweep --origin` 通路仍在。

**读源为默认面；发布包 ∕ 已装包（`node_modules` 树）不入射程**（SKIP_DIRS 既有排除——登记；如需消费另裁）。

## 7. 并入的关键决策记录

| # | 决策 | 依据 |
|---|---|---|
| D-MEM1 | 嵌入懒构建 + 失败降级纯 FTS | 无 key 也能用；首次检索延迟可接受 |
| D-MEM2 | CJK 逐字分段（写入与查询两侧同一处理） | FTS5 无中文分词器；单字索引保召回；BM25 排序仍合理 |
| D-MEM3 | git diff 增量同步（超阈值回退全扫） | 大仓库全扫太慢；diff 只处理改动文件 |
| D-MEM4 | schema 按 `user_version` 递进迁移（破坏性变更显式 drop + 重建） | 由下次同步自动重建索引 |
| D-MEM5 | 磁盘为真相（list / 批量删） | 孤儿文件一轮即删；工具所见即磁盘所存 |
| D-MEM6 | 直接删 + `confirm` 参数即门禁 | 误删可审计重建（删除前返回内容）；否决两段式人工确认 |
| D-MEM7 | 展开点 = `loadConfig()` 单点 | 权威单点、漏点面为 0、可回归；否决「各消费点各自展开」（漏点不可枚举）·「读取代理层」（破坏 config 普通对象契约）·「写盘归一」（毁原文与可移植性） |
| D-MEM8 | 展开器住新模块 `expand-home.mjs` | `config.mjs` 已近硬限且同因已有拆分档；纯函数独立单元测试干净；否决内联 |
| D-MEM9 | 支持形态 = `~` / `~/` / `~\`，**不含** `~user` | `~user` 需 passwd / Windows 用户名解析——收益低、双平台语义不一、猜错即静默错域 |
| D-MEM10 | projectDir 消费侧用 `isAbsolute ? p : join(cwd, p)`（非 `resolve`） | `resolve` 对相对输入亦归一二进样（尾斜杠 / `..` 折叠）⇒ origin 串非零 delta |
| D-MEM11 | 磁盘原文不动（读时归一） | 写回绝对路径毁可移植性 + 存量手写配置永不展开 |
| D-MEM12 | `shell` 同批同机制纳入 | 分批做 = 同 helper 分叉 / 漏点；`shell` 是 spawn 路径——同病同修 |
| D-MEM13 | 检索向量通道 = 流式分块扫描 + 有界 top-K | 峰值 = 块 + K，召回语义不变（仍全表评分）；否决「结果缓存 / LRU」（不解首次扫描峰值）·「FTS 预筛再向量」（召回语义变化）·「ANN 向量索引」（依赖 / 架构级——登记为后续项） |
| D-MEM14 | VSC 索引有效性 = **不产出 + 可见**（校验三条：模型 / 维度 / 名称一致性） | 静默失效 → 可见；否决自动重建（静默 30s+ 网络）· 仅报错（升级为工具故障）· 仅声明（判据不满足）；归一时以 sqlite 承接同原则（承接形态 = 失效向量置空 + 检索懒回填——不产出无效结果；面板 mismatch 可见面自然化——§6.9） |
| D-MEM15 | VSC 忽略文件删除检测 = **`git check-ignore` 圈定 + 存在性检查** | 被忽略文件删除后从 git 输出彻底消失——模式匹配 + 存在性是唯一可达触发；否决全 manifest 逐条扫描（等价全量 stat） |
| D-MEM17 | 扫描让出 = **时间片预算**（每 64 行读钟，≥ 50 ms 即 `await yieldTick()`），块常量 2000 不动 | 让出只改调度不改结果（N-M2 仍成立）；块常量承载内存上界契约不宜混用。否决「按块让出」（单块物化 + 单块评分 ≈ 秒级，用户仍觉卡）·「worker_thread 化」（结构修法——登记不执行）·「同回合结果缓存」（失效判据 / 内存上界 / 跨回合一致性 = 新面，无实证收益） |
| D-MEM18 | 子代召回注入 = **depth 门**（depth > 0 不注入） | 需求侧 F-M7 / F-Q2 / F-Q3 已声明 depth-0；`prepareRun` 其余自动注入全为 depth-0 门；子代任务书自含；按需检索工具仍在。否决「加配置开关」（新面，须另批）·「只门文档、不门记忆」（同一次扫描成本，拆门无收益） |
| D-MEM19 | origin 归一 = **核内纯函数 + 各公共入口一行**（端**装配**文件零改——核库读数点例外见 §6.11） | 端侧赋值点两处（CLI / VSC）——改端 = 两端连带改动 + 跨端同步；核内归一让两种拼写落同一键。否决 `realpath`（改 origin 语义 + 破可移植性，同 D-MEM10 口径） |
| D-MEM20 | 既有重复数据 = **迁移方案 + 判据**（执行归父侧 ops） | 库在仓外（`~/.thincoder/memory.db`）；子代理零触碰。去重口径 = 同归一键同 `(path, line_start)` 留 `mtime_ms` 最大者；可回退 = `VACUUM INTO` 前置备份 |
| D-MEM21 | WAL 卫生 = 开库一次性 `TRUNCATE` + `journal_size_limit`；**不做**写侧逐次 checkpoint | 写侧性能敏感；本机制定位是卫生不是保证（busy 静默跳过）。否决「写侧每次写后 checkpoint」（主库 fsync 拖慢索引）·「PASSIVE 常跑」（不回收文件） |
| D-MEM22 | 扫描游标 = **PK 序游标**（键列由调用点声明，缺省 `["rowid"]`；键 = 表 PK 去掉等值过滤前缀列） | `ORDER BY rowid` 与索引序不一致 ⇒ 每块 `USE TEMP B-TREE FOR ORDER BY`（重排整个过滤集、排序物化含 blob）= 29.4 s；PK 游标同覆盖 1.71 s。**否决**「全 PK 元组 + 前导列等值并存」（SQLite 不作索引约束 ⇒ 静默二次方：20 万行夹具 2.19 s vs 0.50 s，且无 `TEMP B-TREE`、无报错）· 否决「新索引 `(origin, rowid)`」（SQLite 拒：`no such column: rowid`——rowid 不入索引表达式）· 否决「`entries` / `files` 游标一并改」（现状已零排序：`SEARCH … USING INTEGER PRIMARY KEY (rowid>?)`）· **rowid 分类鉴别**：`rowid` **不可作索引键列**（`no such column: rowid`）；其于**部分索引 `WHERE` 内**的引用可行性以实施期实测为准（勿臆断） |
| D-MEM16 | 嵌入输入截断 = 复用核级单一来源（`thincoder-core/text-budget.mjs` 的 `safeSliceUTF16`，三处统一） | 该函数已有共享单一来源声明 · 零 import 叶档（可被任意层引用）· 已有消费先例（现体消费 = `thincoder-core/memory/core.mjs` / `thincoder-core/memory/code-search.mjs` / `thincoder-core/memory/docs.mjs` 三档 import 本函数；声明位 = `thincoder-core/text-budget.mjs` 的 `safeSliceUTF16`；核内另两面 `thincoder-core/agent/offload.mjs` · `thincoder-core/agent/setup.mjs` 亦经 import 复用 ⇒ 核内唯一定义）；否决引 `thincoder-core/agent/helpers.mjs` 私持复本（子系统反向依赖 + 并行批写域）· 否决新档（与既有单一来源同函数双份） |
| D-MEM23 | 索引范围 = **声明面**〔范围 = **声明目录**（正向——`docRoot.*` ∪ `codePaths` ∪ 一级子目录带档者；未声明 ⇒ 不进；零回落）；`index.excludePaths` = **面内排除**（续效）+ 前缀谓词单源四起效点（同步三处 + 读面准入）〕；产品不硬编码参考系——该裁否的 = **猜用户布局**（参考系 ∥ 工作集安排）；**批次档面不在此列**——批次档 = **产品自定记录面**（写面 = 产品机制 ∥ 默认档一等键 `docRoot.batches`，缺省 `docs/batches`），其无条件默认排除 = 产品自身记录面治理，**非猜用户布局**（同类不同物，非绕过） | 范围是用户的工作集安排，产品无判据猜；单一声明载体 = manifest（KD-M1-31）。否决「`SKIP_DIRS` 硬加目录名」（用户布局各异 ⇒ 硬编码面）·「按体积自动排除」（静默行为、不可声明）；面① 声明面与面⑥ 批次档面两单源并列（`index.excludePaths` 声明键 ∥ 写面判定零改——互补不吞；读面准入随谓词全判） |
| D-MEM24 | 存量剪枝 = `sweep --origin + --path`（备份先行 · 干跑默认 · 写后回读） | 复用 §6.13 安全三件；`--origin` 整档做不到子树粒度；存量剪枝须用户批准 + 父侧 ops（自动删除 = §6.14 面 ⑤） |
| D-MEM25 | **读面零写**：embedding 失效**判定**留读面（降级 FTS-only + 可见），失效**执行**移维护口 | 读路径（每回合）不得触发 162k 行级写；F-M6 ∕ D-MEM14「不产出无效结果 + 可见」两条同守（不评旧向量 ∥ 失效可见）。否决「保持现状 + 仅加日志」（巨写仍在 UI 路径）·「读面直接懒重建」（网络 + 写双爆点） |
| D-MEM26 | 体积护栏 = 读数（`dbBytes` + 逐 origin 行数）+ 行预算常量（WARN 100k ∕ CAP 300k，只停新增——计数基准 = origin 库内行数）+ 触发三处；**自动删除 = §6.14 面 ⑤** | **用户告警线 ≠ 内部成本线**（F-S14 ④）：WARN ∕ CAP = 用户面规模线（用户裁定——正常规模安静 ∕ 降级说人话；两行文本 = §6.14 P2）；成本自适应仍由内部触发承（单回合召回墙钟 ≥ 0.5 s ⇒ worker——面② 判据项，数值零改）；常量先落。否决「按字节算」（需全表 SUM——本身即大操作）·「自动剪枝」（破坏性） |
| D-MEM27 | 增量维护三项：per-origin commit 锚 ∕ `gitSync` `--relative`（路径形态与索引同形）∕ 探针部分索引（v10） | 锚单键被多 origin 互覆；diff 路径仓根相对 vs 索引 cwd 相对 = 静默陈旧；探针 `SCAN`（每回合三趟）。v10 = 只增索引（无行级变更） |
| D-MEM28 | **不**引 worker_thread；升级触发 = 修复后单回合召回墙钟仍 ≥ 0.5 s（**缺省工作集 origin 复测**——基线 ∕ 判别换算式见 §6.14 L-②-5） | 三爆点皆可去废 ∕ 分片消解；worker 牵动三端句柄直用面；承 D-MEM17 登记不执行 |
| D-MEM29 | 声明载体 = `PROJECT-MANIFEST.json → index.publicRepos`（嵌 index 族——顶层键族与默认档计数零扰动；缺省 `[]` = 零行为） | 声明载体唯一化既有裁定（KD-M1-31——单一项目声明档）；嵌 index 族的理由 = 检索范围声明（同款先例 = `index.excludePaths`——同为解析期路径列表，元素层归一宽容 ∕ 数组层 fail-closed）。 |
| D-MEM30 | 接入形 = **多根同步 + 读面 origin 集**（复用既有 origin 机制——不新造索引系统；展开一层不递归；单 origin 快径逐字零变） | 语料单根 + 读面等值过滤 ⇒ 语料加根（多 origin）+ 读面集化；「不新造索引系统」= 既有 origin ∥ 同步 ∥ 读面机制原样。 |
| D-MEM31 | 毒行两道防线 = **发送前 `sanitizeLoneSurrogates`（主修）∥ 400 类批失败逐条隔离（兜底）** | 单条孤立代理毒行 ⇒ 硅基流动 400/20015 ⇒ 补嵌 backlog 永久堵死。清洗令存量毒行发前净化；逐条隔离只兜未知毒形（不引 schema 变更 / 持久标记——过度工程）。 |
| D-MEM32 | 排除表补强 = **通用生态名入表**（精确 basename + `bazel-` 前缀）+ **族分折**（垃圾 ∕ 产物族 win32 折 ∥ 位置族全平台精确 ∥ POSIX 一律精确）；`bin` 不进排除表 | 名 = 目录身份，但**族不同判不同**：垃圾名 = 「这类目录」语义（拼写变体同物 ⇒ win32 折）；位置名 = 「某位置」语义（变体非同物 ⇒ 精确；全表折误剪 443 行）。精确 ∥ 前缀收的是「名」不是「模式」（`out` 不吞 `output`）。否决「全表折」（误剪合法同名面）·「全平台折」（POSIX 上 `Pods` ∥ `pods` 是两个目录）·「维持全精确」（win32 上 `Node_Modules` 与 `node_modules` 是同一目录——不折 = 漏剪，F-S9 源起面）·「`bazel-*` 逐名枚举」（含工作区名——不可穷举）·「折叠扩至路径键」（§6.11 口径——两回事）。 |
| D-MEM33 | 自愈轮 = **单引擎单入口**（`maintain.mjs` `maintainMemory`——自动拍 ∥ 工具同一单点）；三动作 = 鬼行 GC ∥ 压实 ∥ 轮转 | N-S8「同一引擎同一安全口径」的单点形；三动作共享备份先行 ∥ 读数随行 ∥ 写后回读。否决「各端各实现维护」（安全口径漂移）·「自动 ∥ 工具两套引擎」 |
| D-MEM34 | 鬼行 GC = **逐档 ENOENT 双路径判亡** + **origin 树亡短路**；不折叠 | 承 §6.13 探针口径（仅 ENOENT；fail-safe）；双路径 = `treeState` 同形（单源）；树亡短路 = 同一判据免逐档探针。否决「时间 ∕ mtime 判据」（§6.13 既有否决）·「自动删『看起来无关』的活行」（维护 ≠ 收录裁决） |
| D-MEM35 | 压实判据 = **freelist 双式联立**（`≥ 64 MiB` ∧ `freelist ∕ db ≥ 20%`——核常量 · 缺省值 = 用户拍项） | 两点：3 MiB ⇒ 零收益（§6.14 面③）∥ ~1 GiB ∕ 51% ⇒ 实清；比值防「大库小益」·下限防「小库频压」。否决「尺寸独立触发」（VACUUM 成本 ∝ 全库重写——freelist 小 = 纯成本）·「纯绝对阈值」 |
| D-MEM36 | 备份轮转 = **严格名族匹配**（14 位戳）+ 保 N（`config.memory.maintain.backupKeep`——缺省 2 · 钳 ≥ 1）；引擎直落删 | 「不删非本机制所产文件」的可机检形 = 名族精确匹配（非前缀）；N ≥ 1 = 需求明文锚。否决「按 mtime 邻域清」（他产文件误伤面）·「rename 回收站形」（备份 = 派生副本——先例 = trace ∕ log 清理直删） |
| D-MEM37 | agent 触发 = **`memory` 工具 action `maintain`**（干跑默认 ∥ `confirm` 落写）；命令形不做（**工具一面即达标**——命令形 = 边界在册） | 工具面 = 跨端同面（命令形 = CLI shell 通道——VSC 无终端子命令面，端差）；干跑默认 = 工具先例（delete ∥ clear 的 confirm 形）。否决「CLI 命令形」（新命令面 ∥ 端差；出现 ops 实测需求再补——边界在册） |
| D-MEM38 | 触发 = **启动后延迟拍**（每进程一次 · 缺省 3 s——先例 = 会话索引拍 `thincoder-core/session-index-pass.mjs:15` `INDEX_PASS_DELAY_MS = 3000`）；幂等三项（进程内 ∥ 逐动作闸 ∥ 跨进程事务） | 「启动后低峰窗口」= 用户拍触发模型；延迟拍 = 既有先例形。否决「常驻周期拍」（长驻进程——交互高峰不可控）·「阈值不越不拍」（鬼行无阈值面——扫描 = 判定成本；写入面仍零空转） |
| D-MEM39 | 批次档面默认排除 = **谓词内**（`isExcludedRelPath` 本体扩展——无条件 ∥ 约定段 ∪ `docRoot.batches` 声明值的段序列 ∥ 任意深度连续命中） | 排除判定单源（面① 接线 + 收尾保护位全经谓词）⇒ **收录面零消费面改动**全缝生效（读面准入 = 本面另接两处）∥ 保护位自动对齐（历史行不删不损）；约定段 = `DEFAULT_MANIFEST.docRoot.batches` 归一段序列（默认值单源——改名两处同动）；联合 = 改名项目新位置同罩 ∧ 旧约定位置仍罩（无逃生口——用户裁）。否决「文件列面默认」（diff 缝 ∥ 单文件缝 ∥ 保护位三处漏点）·「并入 `index.excludePaths` 投影」（改声明面语义 ∥ `declared` 旗连带）·「只约定段不看声明值」（改名项目失罩——违裁决本意） |
| D-MEM40 | 存量行 = **不删不损 + 读面准入过滤**（「批次档从未入索引」等价检索；清理 = ops 可选动作——非本节动作） | N-S11「历史行不删不损——只自可见面退场」；准入位（FTS 列表建成后 ∥ 向量 top-K 前）⇒ 注入块 ∥ `doc_search` ∥ `code_search` 即时零命中 ∥ 空槽回填（非取后隐藏）；行判 = **同一谓词全判**（面① ∪ 面⑥——`index.excludePaths` 命中存量行同判不可见；非第二判定面）。否决「后置隐藏」（空槽不回填——少拿结果）·「同步清理」（同步不代行剪枝——面① 既有口径）·「SQL 路径否定式」（段匹配第二实现——双源漂移 ∥ 多 origin 异声明值组合爆炸；窗口欠额方向 = 少不杂——接受） |

| D-MEM41 | 索引范围 = **声明目录（正向）**：`docRoot.*` 目录值（根相对前缀——路径及子树）∪ `codePaths`（段序列任意深度——键语义零改）∪ **一级子目录（带 manifest 者）**声明；两层锚 = 锚管辖 manifest + 直接子目录带档者；**未声明 ⇒ 不进**；全无 ⇒ **零索引（不回落全树）** | 用户裁定（结构门替换开放式排除——「大目录炸索引」）；单一声明载体 = manifest（KD-M1-31——范围即声明面）。两键各按**自身既有语义**命中（`docRoot` = 路径值 ∥ `codePaths` = 段名——`MANIFEST.md` §2.2）。否决「`codePaths` 按根相对前缀解」（改键值语义 + 本工作区 thincoder 代码面 ≈ 空）·「递归发现 ∥ 向上找档」（违纯向下发现纪律）·「无档回落全树」（= 逃生口——用户明拒） |
| D-MEM42 | 范围外存量行 = **不删不损 + 读面准入过滤**（「范围外从未入索引」等价检索——`docSearch` ∥ `codeSearch` 准入位）；清理 = ops `sweep` 可选 | 声明可改 ⇒ 补声明即时回归（零重嵌）；同步收尾删除无备份（`sync-tail.mjs:77-80`）——声明驱动自动删行 = 无回退面；与面⑥ 同形（一致）。否决「自然收敛（收尾即删）」·「范围外行按鬼行 GC 处理」（判据不同物：鬼行 = ENOENT，范围外 = 文件在盘） |
