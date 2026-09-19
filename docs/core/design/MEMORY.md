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
| 记忆库 | `thincoder-core/memory.mjs`（转口）+ `src/memory/**`（8 档） | `thincoder-core/memory.mjs` · `memory-tool.mjs` |
| 工具面 | `src/memory/docs.mjs` 的 `memoryTools` | `src/memory-tool.mjs` |
| 索引（代码 / 文档） | `src/memory/code-index.mjs` · `code-sync.mjs` | `src/indexer.mjs` · `index-bin.mjs` · `index-discover.mjs` · `tools/code.mjs`（VSC 侧四档 W8 已退役——核面现体 `thincoder-core/memory/code-sync.mjs` / `file-walk.mjs`；`tools/code.mjs` = 端壳改指面） （迁移期引文） |
| 嵌入 | `src/embedding.mjs` | 同（同路径对） |
| team 层同步 | `src/git/gitmem.mjs` | —（无对位） |
| 子命令面 | `src/cli/memory-command.mjs` | —（无对位） |

**本子系统的归一方向（已裁）**：面向 **CLI 语义**归一（用户裁定 A12——前提失效，非选边）；`node:sqlite` 采纳为定案（`CORE-UNIFICATION.md` §2.11 A8）。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 75 | `embedding.mjs` | 同路径 | 0.6566 · 异 | ② | 进核 | 融合：取 CLI（每请求 60s 超时 + `toBlob`/`fromBlob`）+ VSC 的本地 RETRYABLE 常量归位 | 分叉 ＝ VSC 缺每请求 60s 超时（`src/embedding.mjs:71`）与 blob 助手（存储介质不同所致）；前提（存储面已随 A12 归一为 CLI sqlite）⇒ 差异消失 | — | S1（建核补齐） |
| 82 | `memory.mjs` | 同路径 | 0.0093 · 异 | ③ | 进核（**同名不同物**：CLI 21 行转口 + `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | 以 CLI 为准（A12——**前提失效，非选边**）；VSC 侧改接线；旧数据迁移另议（§2.5.1 / §2.12.3） | 分叉 ＝ **前提失效**（「VS Code 内置 Node 不支持 sqlite」不成立）；实测 CLI = `node:sqlite` + FTS5（`src/memory/schema.mjs:9,68`）/ VSC 零 sqlite（纯 md，`src/memory.mjs:26-37`） | **①②③** | S1（建核补齐） （迁移期引文） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 133 | `thincoder-core/memory.mjs` + `src/memory/**`（8 档）↔ `thincoder-core/memory.mjs` + `memory-tool.mjs` | ③ | 以 CLI 为准（A12——**前提失效，非选边**） | 分叉 ＝ **前提已失效**（「VS Code 内置 Node 不支持 sqlite」不成立；CLI `node:sqlite`+FTS5 `src/memory/schema.mjs:9,68` / VSC 零 sqlite）⇒ 直接归一；**承 §2.5 #82** | —（承 #82） | S1（建核补齐） |
| 134 | `src/memory/docs.mjs`（`memoryTools`）↔ `src/memory-tool.mjs` | ② | 融合：核内单一 memory 工具面（动作集 / schema / 文案取一侧） | 分叉 ＝ 拆档位置（CLI 工具面住 `memory/docs.mjs:241`）；两端动作集同规格（五动作 / layer 词面）⇒ 前提成立；**随 #82 / A1 归一** | —（承 #82） | S1（建核补齐） |
| 135 | `src/cli/memory-command.mjs` ↔ 核内（VSC 无对位） | ④ | 端特有段：CLI `memory` 子命令面（shell 通道） | 结构性不对称 = **仅 CLI 有 shell 子命令通道**（VSC 无终端子命令面——与 #125 冷 cwd 面同源）；**非**「差异」排除（A9） | — | 不迁（端特有） |
| 136 | `src/memory/code-index.mjs` + `code-sync.mjs` ↔ `src/indexer.mjs` | ③ | 以 CLI 为准（**同一 A12 前提失效**；进核） | 分叉 ＝ 索引存储（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI sqlite 库——CLI `src/**` 零 `.thincoder/index` 命中）；前提同 #82 ⇒ 失效；**随 A1 归一**（W8 已落地 2026-09-15——VSC 侧已退役删旧，核面现体 `thincoder-core/memory/code-sync.mjs`） | —（承 #82） | S1（建核补齐） （迁移期引文） |
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
| A1 | `memory.mjs`（席位 #82；实为 CLI `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | ①②③ | `node:sqlite` `DatabaseSync` + FTS5（`src/memory/schema.mjs:9,68`）；库 = `~/.thincoder/memory.db`；三层 `personal` / `project` / `team`，**personal = 全机共享的库行**；project 层 = `.thincoder/memory/*.md`（**只扫顶层** `thincoder-core/memory/core.mjs:205-212`） | 零 sqlite——纯仓内 md（`.thincoder/memory/{personal,project}/*.md`，`:26-37`）+ 遗留 `.json` 读兼容（`:150-162`）；两层（`team` 明确拒绝、指向 CLI）；`personal` 落在**仓库目录内** | **以 CLI 为准**（A12——前提失效，非选边）；`node:sqlite` 采纳为定案（§2.11 A8） | ① 记忆存哪变了（VSC 的 personal 由仓内目录 → 全机库）；② 两端**从此可互读**（现状：VSC 读不到 CLI 的库、CLI 不递归读 VSC 的子目录）；③ 旧数据要搬（见 A2）；④ 检索能力（FTS5 + 中文逐字分段）随之而来；⑤ 两侧测试面 | **已裁（2026-09-13）· 按建议** |
| A2 | 记忆面旧数据迁移（§2.12.3 第 2 行） | ②③ | 有 `memory` 子命令（list / search / put / remove）与 `/reindex`；**无 md / json 导入命令** | 用户既有记忆 = 仓内 `personal` 层 md + 遗留 `.json` + `workspaceState` 的 `thincoder.modelPrefs` | **已裁（2026-09-13）：① 提供一次性导入器**（md / json → `entries`）——**父侧代选**（用户 2026-09-13「全部按建议」未逐字指定本行，已披露 ✓；理由：选 ② 会让 VSC 老用户记忆清空，与「不丢用户数据」相悖）。**落地** = S2 建一次性导入器（`memory import` 子命令面；`modelPrefs` 仍取不到——住 VS Code 状态，不在文件系统）；**边界（2026-09-15 裁定）**：本行 = **记忆条目**迁移面——**索引数据面（`.thincoder/index/`）不适用**（零迁移 / 零兼容——§4 第 11 行；重新索引 = 正当路径） | 用户既有记忆保留（md / json → `entries`）；`modelPrefs` 明确不迁（无文件系统载体） | **已裁（2026-09-13）· ① 一次性导入器（父侧代选）** |
| A3 | VSC 引擎下限（§2.12.3 第 1 行） | ② | `engines.node = >=24` | `engines.vscode = ^1.85.0` | 抬到 **`^1.104.0`（已裁 2026-09-15）**（A13 已裁「可抬」；**原候选 `^1.101.0` 经实核不成立** ✗——见下行与 §2.11 A8）；**不另做真机实测**（资料推导链 + `activate()` 护栏兜底） | 放弃 VS Code < 新下限的用户（A13 已接受该代价）；装上旧宿主 ⇒ 扩展不可用 | **已裁（2026-09-15 用户）：`^1.104.0` · 不另实测** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 11 | **代码索引存储面**（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI `node:sqlite` 库内索引） | 数据面 / 文件格式 | 取 CLI（索引入 sqlite 库；VSC 索引文件面退场） | 旧文件格式**不再写**、**零迁移 / 零兼容**（数据面放弃——**不写导入器**；**重新索引 = 正当路径**——2026-09-15 用户裁定）· CHANGELOG | 索引面文档 + 用例 + 两产品 `CHANGELOG.md` | 已裁（2026-09-13）· 按建议（承 §2.5.1 A1 / §2.11 A8）；**数据面兼容形态收口已裁（2026-09-15 用户）**：零迁移 / 零兼容（不写导入器） |

### 4.1 无法兼容项上抛（自 §2.12.3 搬入 · 逐字）

| # | 项 | 为何无法兼容（实测 / 证据） | 上抛形态（四要素） | 裁定状态 |
|---|---|---|---|---|
| 1 | **VSC 引擎下限抬升**（`engines.vscode` `^1.85.0` → **`^1.104.0`（已裁 2026-09-15）**） | 旧宿主内置 Node < 22.13 ⇒ 无 `node:sqlite`；**且 Electron 35.x（= VS Code 1.101 / 1.102）未获 sqlite 内置修复**（electron/electron #47706 回移分支 = 36 / 37 / 38-x-y）⇒ 原候选 `^1.101.0` 不成立；A13 已裁「抬高、不保留降级路径」⇒ **无兼容路径可给**（给降级路径 = 两套逻辑再现 ✗） | 左端 = VSC 现状（`thincoder-vscode/package.json` 的 `engines.vscode: ^1.85.0`）· 右端 = 新下限 **`^1.104.0`（已裁 2026-09-15）** · 建议 = 采纳（A13）· 影响面 = < 新下限用户不可用；**配套护栏** = `activate()` 自检 + 明确提示（不崩） | **已裁（2026-09-15 用户）：`^1.104.0` · 不另做真机实测**（资料推导链 + `activate()` 护栏兜底）（§2.5.1 A3 / §2.11 A8） |
| 2 | **记忆面旧数据迁移**（VSC `personal` 层 md 档 · 遗留 `.json` 记忆档 · `workspaceState` 的 `thincoder.modelPrefs`） | VSC `personal` = 仓内目录（`thincoder-vscode/src/memory.mjs:26-37`）· CLI `personal` = 用户级全局 sqlite 库行（`thincoder-cli/src/config.mjs:92`）；CLI 侧无导入命令（`thincoder-cli/src/cli/memory-command.mjs:21-63`）· 同步只认顶层 `.md`（`thincoder-core/memory/core.mjs:205-212`）⇒ **无自动迁移路径**；`modelPrefs` 住 VS Code 状态（不在文件系统） | 左端 = VSC 现状（仓内 md 持久）· 右端 = CLI 现状（全局库 + 顶层 md）· 建议 = **① 提供一次性导入器**（md / json → `entries`）或 ② 用户手工迁移 / 丢弃 · 影响面 = 用户既有记忆 + 语义（每仓私有 → 全机共享） | **已裁（2026-09-13）· ① 一次性导入器**（**父侧代选**，已披露；落地 = S2 建 `memory import` 面。§2.5.1 A2） （迁移期引文——档已迁核） |

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

**嵌入输入文本（三路）**：`entries`/`files`（`thincoder-core/memory/core.mjs` 的 `ensureEmbeddings`）· `code_chunks`（`memory/code-sync.mjs`）· `doc_chunks`（`memory/docs.mjs`）送 embedding 的文本 =
前缀（`title` / `heading || path` / `path :: symbol`）+ `content` 截断至 `EMBED_TEXT_MAX_LEN = 2000`。
截断 = 核级单一来源 `thincoder-core/text-budget.mjs` 的 `safeSliceUTF16`（UTF-16 码元安全——截点落高代理时整对丢弃）。
2026-09-15 缺陷修复：emoji 恰跨界曾被切成孤立代理 ⇒ 严格 UTF-16 解析端（硅基流动）400 / 20015；查询侧 `query` 不截断、原样送（非孤立代理生成点）。

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
- **扫描形态**：每块物化 `{ uid, embedding }` → 逐行 `fromBlob` / cosine → top-K 有界插入（候选集 ≤ `max(limit×4, 20)`——既有口径）；块内存随迭代释放。实现面 = 绑定层迭代器优先、游标分页兜底（两者语义等价：全表逐行、无重复无遗漏）；**游标列（PK 序）见 §6.10 修法 A1**（单源——本节原「rowid 游标」表述随之收正）。
- **top-K 选择**：升序小顶堆（K 上限）；并列分数按「先到先留」（与「全量 sort 稳定序」等价）。
- **对外结构不变**：返回 `[{ id, score }]` 候选（既有消费面 RRF 融合不变）；FTS 通道与 `projectOrigin` 过滤零改。
- **可测缝**：扫描器接受注入的 `runChunkedQuery`（默认真实 DB 实现——测试以假数据源直测块大小 / top-K / 等价性）。

### 6.9 VS Code 端实现面（W8 归一落地 · 2026-09-15）

> **来源** = `thincoder-vscode/docs/design/MEMORY.md`（325 行 · VSC 产品档——迁移期参照历史）。本节 = 该档中「根层所缺」的 **VS Code 端现状面**（(a) 机制 / (b) 坐标）。
> **归一落地**（2026-09-15 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W8）：§2.1 #82 / A1「以 CLI 为准（`node:sqlite` 定案）」+ 索引面裁定（归一 = 并核 sqlite · **数据面零迁移 / 零兼容**——重新索引 = 正当路径）已由 W8 接线落地——
> VSC 改接线核面；文件制存储与索引面（`.thincoder/index/` · `indexer` 族）**已删旧退场**（(d) 类不并——§8.2）。

**当前实现面（W8 后）**：

- **存储 = 核 sqlite（与 CLI 同库）**：`~/.thincoder/memory.db`（共享配置 `memory.dbPath`；缺省 = `<configDir>/memory.db`）。
  句柄 `createMemory` 由端壳装配面创建持有（`thincoder-vscode/src/embed-config.mjs`——`ensurePanelAgent` 同址惰性创建）；
  护栏 = `isMemoryFaceEnabled()`（`extension.mjs`）前置——停用/创建失败 ⇒ 句柄 null、消费点全部零崩；
  **端壳静态 import 链零 `node:sqlite`**（核面经动态 `import()` 载入——静态可达 = 低宿主模块加载期硬失败；机判 = `thincoder-vscode/test/engine-floor-guard.test.mjs`）。
  `embedder` 经 getter 跟随共享 config（惰性向量回填）；`codeOrigin` = 当前项目根（逐调用限定——多项目单库）；`projectOrigin` = `memory.projectDir`（缺省 `.thincoder/memory`，首次逐项目 `syncDir`——CLI 启动同形）。
- **检索 = 核 `codeSearch` / `docSearch` / `search`**（FTS5 + 惰性向量，无 embedder → 纯 FTS 回退非空〔限非空 query〕）；
  端壳文件制索引（`indexer` 族）与宿主 regex 回退**退役**——`code_search` / `doc_search` 面经核工具生成器调用（描述/输出契约同文）。
- **迁移路径**：VSC 老用户文件制 personal 记忆 = `memory import` 一次性导入器（CLI 面——**未落**，登记于该批次档「发现」清单）；project 层 = `.thincoder/memory/*.md`（双端同目录，磁盘为真相）。
- **重建面（端壳）**：入口 = 面板「构建索引」（`thincoder.buildIndex`）→ 核序 `gitSync` → 回退 `codeSync`+`docSync`（并行）；
  进度 = Notification + 状态行段（`scan` / `index` 相位）；取消面 = `cancellable: false`（核 sync 无中断缝——端差收正）；
  模型变更**零手动重建**（失效向量置空 + 检索懒回填——不产无效结果）；`mismatch` 载荷与「Rebuild now?」提示**退场**；
  旧目录 `.thincoder/index/` 清退 = 告示 + 显式删除动作（每项目一次 · 零自动删除路径）。
- **工具契约端差**：`memory` 五动作（search / put / list / delete / clear）；layer 值域 personal / project——**无 team 层**（收到 team 明确拒绝并指引 CLI）；
  工具级 `readonly: false`、动作级只读分类（search / list 只读放行——planMode 放行、免审批、可并行）；put / delete / clear 副作用门；
  执行器 / 输出契约 = 核工具生成器（§6.6.4 同文——单一实现）。

**退场登记（文件制面——(d) 类不并）**：文件制 markdown 存储（root / personal / project 三物理目录 · 旧 `.json` 只读兼容）与向量优先 + 关键词回退的检索链（title 3 / tag 2 / content 1 分 · CJK bigram）随 W8 删旧退场（坐标见该批次档 W8 段）；
B1–B4（`indexCompat` 模型/维度校验 · gitignored 触发重建 · `listMemoryFiles` 递归自检 · reason 词表）为文件制索引特有设计——核面承接 = 模型变更 ⇒ 该表向量置空 + 检索懒回填（失效向量绝不进评分）；

### 6.10 扫描面修复（PK 游标 + 让出）与子代检索门（TUI 假死批 · 2026-09-18）

**病灶一（调度面）**：向量通道的分块扫描（§6.8）块循环**零 `await`** ⇒ 独占事件循环
（实测 as-of 2026-09-18 02:5x：`memory.db` 2.80 GB / 向量行 139,107；单表 64,630 行 / 252 MB blob 的余弦扫描 **31.2 s**；
全 origin 139,171 行 **33.1 s**）。

**病灶二（访问序面 · 2026-09-18 修正轮补）**：扫描游标 = rowid 系（`AND rowid > ? ORDER BY rowid`），
而两张大表的索引序 = PK `(origin, path, line_start)`——二者不一致 ⇒ **每个分块都 `USE TEMP B-TREE FOR ORDER BY`**：
把**整个过滤集**（实测 65,704 行）重排一遍，且 SELECT 含 `embedding` ⇒ 排序物化带 blob（252 MB 级）。
父侧真库实测（同库同 origin · 单表）：现状全趟 **29.4 s** vs PK 游标全趟 **1.71 s**（**同覆盖 65,704 行**）。

**触发面（两条病灶共用）**：`prepareRun`（`thincoder-core/agent/setup.mjs:101-126`）的 `docSearch` + `memorySearch`——
**主 agent 每回合一次 · 每个子代理 spawn 各一次**（子代共享父侧句柄：`thincoder-core/agent-tools/subagent-spawn.mjs:350`）。
TUI 的键盘 / 滚轮 / 渲染与 agent 跑同一条事件循环（`thincoder-cli/src/tui/index.mjs:169` stdin 回调 ·
`thincoder-cli/src/tui/mouse.mjs:30-76`）⇒ 同步活占住线程期间输入回调排不上队（「不能滚动」的机理）。

**修法 A1 —— PK 游标（访问序面：消排序 · 消 blob 排序物化）**：

- **修法**：`scanVectors`（`thincoder-core/memory/scan.mjs:80`）的游标列改由调用点**声明**（opts `cursorKey`，缺省 `["rowid"]`
  ——**缺省即现行为**）；查询由「统一追加 `AND rowid > ? ORDER BY rowid`」改为按声明构建**两形态**：
  - 首块：`… <调用点 WHERE 段> ORDER BY <键列> LIMIT ?`
  - 中块：`… <调用点 WHERE 段> AND (<键列>) > (?, …) ORDER BY <键列> LIMIT ?`
  - 游标值 = 上一块末行的键列值；**两道终止判据**（等价现状 `thincoder-core/memory/scan.mjs:90` 的 `!(next > after)` 与 `:92` 的尾块判据）：
    ① 键值缺失 ∨ **末键元组未严格大于上一游标键** ⇒ 止（游标不前进即止——防异常行序空转，正是本批要治的挂死形态）；
    ② 尾块（`rows.length < chunk`）⇒ 止（末块读尽，不再多打一次空查询）。
    **首块不带游标谓词**（否决哨兵值：哨兵须假设列域下界）。
- **键选取规则（本修法的核心）**：游标键 = **该表 PK 去掉「被等值过滤的前缀列」**；无等值过滤 ⇒ 用**全 PK**。
  理由：SQLite 只把与索引列序对齐的元组比较用作索引约束（seek）；**被等值约束的前导列若仍留在元组里，整个元组退化为残余过滤**。
- **否决形（反例 · 必须记住）**：`origin = ? AND (origin, path, line_start) > (?, ?, ?) ORDER BY origin, path, line_start`
  —— 计划 detail 仅 `(origin=?)`（元组未入 seek）⇒ **每块从头扫起 = 二次方**，且**无 `TEMP B-TREE`、无报错**（静默退化）。
  本机 20 万行夹具自测（内存库 / 落盘 + `ANALYZE`）：否决形 2.19 s / 5.65 s；正解（过滤面 2 元组）0.50 s / 1.63 s；
  无过滤面 3 元组 seek 0.41 s / 1.63 s。
- **逐调用点表（键列实核 = `thincoder-core/memory/schema.mjs` 逐表 PK 声明）**：

  | 调用点 | 表 | 表 PK（实核） | 现游标 | 裁定 |
  |---|---|---|---|---|
  | `thincoder-core/memory/core.mjs:66` | `entries` | `id INTEGER PRIMARY KEY`（= rowid 别名） | rowid | **零改**——rowid 游标**即** PK 游标（计划 `SEARCH entries USING INTEGER PRIMARY KEY (rowid>?)`，零排序） |
  | `thincoder-core/memory/core.mjs:67` | `files` | `(layer, origin, path)` | rowid | **零改**——rowid 序 = 表序 ⇒ 现状已零排序（计划 `SEARCH files USING INTEGER PRIMARY KEY (rowid>?)`）；表小；且其过滤段 `(layer='team' OR origin=?)` 非等值前缀，PK 游标在此无处可 seek、只多选键列 |
  | `thincoder-core/memory/docs.mjs:116` | `doc_chunks` | `(origin, path, line_start)` | rowid | **改**：有 origin 等值过滤 ⇒ 键 `["path", "line_start"]`；无过滤 ⇒ 键 `["origin", "path", "line_start"]` |
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
  分页无重无漏的前提 = **键列全 `NOT NULL` 且唯一**：两表 PK 列逐列 `NOT NULL`（`schema.mjs:314-327` / `:353-365`；`files` 同 `:404-420`）
  ⇒ 键元组序为**严格全序** ⇒ 断言成立。（`entries` / `files` 零改 ⇒ 其覆盖恒等本就成立。）
- **tie-order 显式裁定 = 可接受**（不引入稳定化改造），判据四条：
  ① 平局 = 余弦分数**逐位相等**——现实来源是同文本重复索引（重复文件 / 分块）⇒ 平局候选**内容等价**，换成员不改答案内容；
  ② 需求侧已显式豁免——`docs/core/requirements/MEMORY.md` §4.6 N-M2「与全量排序逐条等价，**除并列序按稳定规则**」；
     本修法**不改稳定规则**（仍「先到先留」），只改到来序；
  ③ **确定性判据保持**：同库状态 + 同查询 ⇒ 逐条相等（键序确定 ⇒ 堆内 seq 确定 ⇒ `list()` 排序确定）；
  ④ 跨实现（rowid 序 → PK 序）平局成员可变——仅在**同分**候选之间，且下游 RRF 对候选按名次同权。
- **并发写可见性（既有面，非本修法引入）**：扫描与并发写并存时无快照隔离（改前改后同）——访问序变化不新增缺陷类，
  差异面仅限「扫描期间被改写 / 被删的那几行」，其是否计入本次召回本就无保证（登记 §8.3）。
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
  ① **需求侧声明（锚标全 · 三处）**——ⓐ VSC 端条目 F-M7（`docs/core/requirements/MEMORY.md:146`，属该档 §4.7「VSC 端需求条目」——该节自述登记 VSC 端现状，**非**核心层声明）；
  ⓑ 迁移期参照档 F-Q2 / F-Q3（`thincoder-cli/docs/requirements/AGENT-LOOP.md:283-284`）；
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

**墙钟与响应性（诚实边界 · 2026-09-18 修正轮更新）**：

- **响应性**（A2 之功）：单次事件循环占用 ≲ 时间片 + 单块物化（目标读数 = 每让出窗 **≲ 0.1 s** 量级）⇒ 输入回调排得上队。
- **墙钟**（A1 之功）：单趟全表向量扫描的时延由 **29.4 s** 量级降到 **1.71 s** 量级（父侧真库实测 · 同覆盖）——
  即旧陈述「让出只解响应性、不含墙钟；要量级压制需另批」**已被 A1 改写**：墙钟面同样落了**一个量级**。
- **仍未解决**：每回合 1 趟 **~1.7 s** 量级的固有成本（子代面已由 B 门去掉）+ 单块 `.all()` 的不可中断段。
  再压量级 ⇒ ANN / 分层候选（D-MEM13 已登记为后续项）。
- **真时探针判据（T-Y4 · 2026-09-20 收正）**：缺省面 maxGap 中位数 ≤ 250 ms（响应性契约）· 对照面（`yieldMs: Infinity`）≥ 缺省 ×2 ∧ ≥ **100 ms**（量级下限——承「≲ 0.1 s 量级」）；×5 为打印读数（夹具上界 3 万行逃生口——批档 `docs/batches/2026-09-18-tui-freeze.md` §2.5 / §2.6）。

### 6.11 索引 origin 归一（重复索引源治理 · 2026-09-18）

**病灶（源头）**：origin 键 = **未归一的目录字符串**。写入侧赋值点 = `memory.codeOrigin = cwd`
（`thincoder-cli/src/cli/make-agent.mjs:51`，`cwd = process.cwd()`；VSC 同形 = `thincoder-vscode/src/embed-config.mjs:172`）——
Windows 盘符**大小写随启动拼写**（`cd d:\teamcode` 与 `cd D:\teamcode` ⇒ 两个 origin 串），分隔符 / 尾斜杠同理。
实测双份：`D:\teamcode` 71,266 行 + `d:\teamcode` 69,748 行（**同一棵树**）。副作用两则：
① 存储与索引成本翻倍（磁盘 / 内存 / 备份面）；② **召回面半可见**——检索按 origin **等值**过滤，某一拼写启动时只看得到自己那半行。

**修法（核内单点归一）**：

- 新叶模块 `thincoder-core/memory/origin.mjs`（拟新增；纯函数叶档）：`normalizeOrigin(p)`——分隔符归一 `/` ·
  Windows 盘符统一大写 · 去尾斜杠（根除外）· 非字符串原样透传。
- 应用点 = **各公共入口一行**（写缝与读缝各自入口取归一值，函数体内一律用归一值）：
  写面 `codeSync` / `docSync` / `gitSync` / `reindexFile` / `syncDir` / `indexMarkdownFile` 的 `dir`（含按 origin 的查 / 删）；
  读面 `codeSearch` / `docSearch` / `search` / `fetchEntry` 的 `memory.codeOrigin` / `memory.projectOrigin`；
  删面 `thincoder-core/memory/delete.mjs`（评审 #1 补——uid 与索引行的 origin 必须同一形态）：
  uid 拼装 `matchMemoryRows`（`:56` / `:59` 的 `projectDir` / `teamDir`）· origin 解析 `deleteByUid`（`:171-173`）·
  等值查（`:182`）· 护栏查与 `origin !== dirs[layer]` 比较（`:195-197`——**两侧归一**）· `syncDir` 调用（`:206`）各取归一值。
  （`fetchEntry`（`thincoder-core/memory/core.mjs:120-123`）同形——其 **uid 解析面本轮零改**（path-only 余量兜底（`:131`）仍在）；其 `memory.projectOrigin` 读面仍按读面应用点归一。〔2026-09-18 轮 2 评审收口〕）
- **端装配文件零改 + 核库读数点例外**（归一在核内——不触 `make-agent.mjs` / `embed-config.mjs` 等端**装配**文件，面间不追赶纪律不破）；
  **例外 = 核库读数点** `thincoder-vscode/src/extension/panel-index.mjs`（`:20` 归一导入 · `:35-37` `readIndexCounts` 按归一形 origin 取键）——核内写缝归一后不取同形键则面板恒显 `files: 0`（实施轮实测）⇒ 随本批同改（例外判据 = 读同一份核库的投影点）。〔实施后收正 · 2026-09-18〕
- **不做**：`realpath` / 符号链接解析（会改「origin = 用户项目路径」语义 + 破坏跨机可移植性；同款先例 = D-MEM10「不用 `resolve`」）；
  别名路径（subst / junction / 8.3 短名）与**嵌套 origin 重叠**（仓根 origin 与子仓 origin 各索引一遍）**登记为已知限制**（§8.3）。

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

**召回面说明（非语义变更）**：归一后读缝与写缝取同一键 ⇒ 两种拼写启动看到的是**同一批行**——
这不是召回语义变更，而是「同一集合此前被拆成两半」的收正。

**模型可见 id 形态（可见面变更 · 评审 #1 落点）**：文件层 id = `project:<origin>:<path>`（`fetchEntry` / 检索行拼装）——
归一后 origin 段 = **归一形**（盘符大写 + `/`）：`project:C:/projA/.thincoder/memory:a.md` 取代原 `project:C:\projA\.thincoder\memory:a.md`。
旧形态 id 仍**可用于删除**（`deleteByUid` 内取归一值再查），但**字符串比较面**（脚本 / 断言 / 提示词内字面 id）须按归一形书写。

### 6.12 WAL 卫生（2026-09-18）

**病灶**：`PRAGMA journal_mode = WAL`（`thincoder-core/memory/schema.mjs:70`）下实测 WAL 文件 **587 MB**（远超自动 checkpoint 阈值量级）——
残留块只在下一次成功 checkpoint 时回收，长驻读事务 / 多实例并发会长期拖住回收。

**修法**：① `createMemory` 设 `PRAGMA journal_size_limit`（回收后 WAL 文件截断上界——防复胀）；
② 开库时**一次性** `PRAGMA wal_checkpoint(TRUNCATE)`（`thincoder-core/memory/schema.mjs:69-71`，常量 `WAL_SIZE_LIMIT_BYTES`），
**失败容忍**（另一实例持读事务 ⇒ busy：静默跳过，不重试、不报错；**开库停在 checkpoint 上的等待上界见下段边界**）。

**边界（写实 · 评审 #3 落点）**：本机制是**卫生**不是**保证**——busy 时以现状继续；
该语句的**最坏等待上界 = 连接上的 `busy_timeout`**（`SQLITE_BUSY_TIMEOUT = 3000` ms——`thincoder-core/memory/schema.mjs:15` 常量、`:71` 设好），**不是「不阻塞」**。
SQLite 的 `wal_checkpoint` 是否走 busy handler（从而是否真受该上界约束）= **`unverified`**（本设计未实测；判据面 = 本批批次档 §2.5 的 WAL 边界用例「另一连接持读事务时开库」——量等待时长；
若实测不走 busy handler ⇒ 等待更短，上界仍成立）。
**不做**写侧逐次 checkpoint（写侧在性能敏感路径，高频 checkpoint = 每次写多一次主库 fsync；PASSIVE 对本症无收益）。
**数据面一次性回收 = 父侧 ops**（`wal_checkpoint(TRUNCATE)`；`VACUUM` 可选——需 2× 磁盘与整库重写，收益只在删除后空页）。

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
| D-MEM14 | VSC 索引有效性 = **不产出 + 可见**（校验三条：模型 / 维度 / 名称一致性） | 静默失效 → 可见；否决自动重建（静默 30s+ 网络）· 仅报错（升级为工具故障）· 仅声明（判据不满足）；归一时以 sqlite 承接同原则（**2026-09-15 裁定收口**：承接形态 = 失效向量置空 + 检索懒回填——不产出无效结果；面板 mismatch 可见面自然化——§6.9） |
| D-MEM15 | VSC 忽略文件删除检测 = **`git check-ignore` 圈定 + 存在性检查** | 被忽略文件删除后从 git 输出彻底消失——模式匹配 + 存在性是唯一可达触发；否决全 manifest 逐条扫描（等价全量 stat） |
| D-MEM17 | 扫描让出 = **时间片预算**（每 64 行读钟，≥ 50 ms 即 `await yieldTick()`），块常量 2000 不动 | 让出只改调度不改结果（N-M2 仍成立）；块常量承载内存上界契约不宜混用。否决「按块让出」（单块物化 + 单块评分 ≈ 秒级，用户仍觉卡）·「worker_thread 化」（结构修法——本轮登记不执行）·「同回合结果缓存」（失效判据 / 内存上界 / 跨回合一致性 = 新面，无实证收益） |
| D-MEM18 | 子代召回注入 = **depth 门**（depth > 0 不注入） | 需求侧 F-M7 / F-Q2 / F-Q3 已声明 depth-0；`prepareRun` 其余自动注入全为 depth-0 门；子代任务书自含；按需检索工具仍在。否决「加配置开关」（新面，须另批）·「只门文档、不门记忆」（同一次扫描成本，拆门无收益） |
| D-MEM19 | origin 归一 = **核内纯函数 + 各公共入口一行**（端**装配**文件零改——核库读数点例外见 §6.11） | 端侧赋值点两处（CLI / VSC）——改端 = 面间追赶 + 跨端同步；核内归一让两种拼写落同一键。否决 `realpath`（改 origin 语义 + 破可移植性，同 D-MEM10 口径） |
| D-MEM20 | 既有重复数据 = **迁移方案 + 判据**（执行归父侧 ops） | 库在仓外（`~/.thincoder/memory.db`）；子代理零触碰。去重口径 = 同归一键同 `(path, line_start)` 留 `mtime_ms` 最大者；可回退 = `VACUUM INTO` 前置备份 |
| D-MEM21 | WAL 卫生 = 开库一次性 `TRUNCATE` + `journal_size_limit`；**不做**写侧逐次 checkpoint | 写侧性能敏感；本机制定位是卫生不是保证（busy 静默跳过）。否决「写侧每次写后 checkpoint」（主库 fsync 拖慢索引）·「PASSIVE 常跑」（不回收文件） |
| D-MEM22 | 扫描游标 = **PK 序游标**（键列由调用点声明，缺省 `["rowid"]`；键 = 表 PK 去掉等值过滤前缀列） | `ORDER BY rowid` 与索引序不一致 ⇒ 每块 `USE TEMP B-TREE FOR ORDER BY`（重排整个过滤集、排序物化含 blob）= 29.4 s；PK 游标同覆盖 1.71 s（父侧真库实测 · §6.10 修法 A1）。**否决**「全 PK 元组 + 前导列等值并存」（SQLite 不作索引约束 ⇒ 静默二次方：本机 20 万行夹具 2.19 s vs 0.50 s，且无 `TEMP B-TREE`、无报错）· 否决「新索引 `(origin, rowid)`」（SQLite 拒：`no such column: rowid`——rowid 不入索引表达式）· 否决「`entries` / `files` 游标一并改」（现状已零排序：`SEARCH … USING INTEGER PRIMARY KEY (rowid>?)`） |
| D-MEM16 | 嵌入输入截断 = 复用核级单一来源（`thincoder-core/text-budget.mjs` 的 `safeSliceUTF16`，三处统一） | 该函数已有共享单一来源声明 · 零 import 叶档（可被任意层引用）· 已有消费先例（`thincoder-core/explore-distill.mjs:13`）；否决引 `thincoder-core/agent/helpers.mjs` 私持复本（子系统反向依赖 + 并行批写域）· 否决新档（与既有单一来源同函数双份）〔2026-09-18 注记 · 漂移收正轮：先例坐标 `thincoder-core/explore-distill.mjs:13` 随蒸馏前缀批序列化面退役（该处 import 已删）；**声明本体与单一来源不变**（函数仍有 memory 族消费方——现体消费 = `thincoder-core/memory/core.mjs:15` / `code-sync.mjs:15` / `docs.mjs:17`；声明位 = `thincoder-core/text-budget.mjs:55`）〕 |

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
| 源档 §1 文件制存储物理细节（目录形态（root/personal/project 三物理目录 · frontmatter 逐字段 · 文件名 slug/rand4 · `.json` 只读兼容） | VSC 文件制存储的逐段描述 | **(d) 类 —— 已裁归一（A1 → sqlite 定案）**：过渡态结构不作为目标形态入档；§6.9 只留现状登记 + 迁移方向；源档留参照历史 |
| 源档 §2 向量路径逐参细节（embedding 服务 / 批量 32 / 重试退避 / 归一化） | VSC 向量服务面 | 归一后索引进 sqlite（§6.4 / §6.9）；服务面随 CLI embedding 归一——不重复登记 |
| 源档 §3 工具契约的 VSC 字节输出串（`as of 2026-09-08` 快照） | 输出契约 VSC 侧副本 | 输出契约双端同文已入 §6.6.4（逐字）；VSC 侧副本 = 迁移期参照历史 |

### 8.3 已知限制与后续项（a 类——并入）

- **别名路径（§6.11 容忍面）**：origin 归一覆盖大小写 / 分隔符 / 尾斜杠；**不覆盖** subst 盘 / junction / 8.3 短名等别名路径（同一树经不同别名进入仍产生多 origin）——判据 = §6.11「不做」；出现实测形态时按形态补归一层（单源改点 = `normalizeOrigin`）。
- **嵌套 origin 重叠（登记 · 非缺陷）**：在仓根启动（origin = 仓根）与在子仓启动（origin = 子仓）会把同一批文件各索引一遍——两 origin 各为**合法项目根**（origin 语义 = 启动目录，非「物理唯一树」）；成本 = 子集重复索引，接受。
- **模型可见 id 的 origin 形态变更（§6.11）**：归一后文件层 id 的 origin 段由原样拼写（`C:\…` / `d:\…`）变为归一形（`C:/…`）——旧形态 id 仍可删（`deleteByUid` 归一化解析），**比对面**（脚本 / 断言 / 提示词字面 id）须按归一形；模型面 id 只在检索输出中生成，无持久化契约。
- **扫描面已知上界与墙钟（§6.10 已知上界）**：单次事件循环占用 = 时间片 + 单块物化（单块 `.all()` 不可中断）；单趟墙钟 = **1.7 s 量级**（PK 游标后 · A1；改前 29.4 s 量级）。若实测单块物化本身超预期，消解路径 = 下调 `SCAN_CHUNK_ROWS`（与内存上界契约联动，须同批改契约）；再压墙钟量级 ⇒ ANN / 分层候选（D-MEM13 后续项）。
- **扫描期并发写可见性（§6.10）**：扫描与并发写并存时无快照隔离（改前改后同）；扫描期间被改写 / 被删的行是否计入本次召回无保证——既有面，登记不修。
- **VSC 镜像面**：memory 工具面（五动作 + layer 值域按端）语义同源；**VSC 存储 = 核 sqlite（与 CLI 同库）——见 §6.9（W8 归一落地 2026-09-15）**。原「VSC 存储为**文件制**（检索实时扫文件）」为 W8 前现状，与 §6.9 相抵——2026-09-18 修正轮收正；原随之的「存量根目录 legacy 条目 search 可见但 delete 不可删」所述路径 = 文件制检索面，已随 W8 退场而失据（存量文件条目去向 = `memory import` 一次性导入器——未落，登记于该批次档）。
- **只读子代理不能 `memory search`**（§6.5——工具级 readonly 过滤）；如需恢复，改 allowed 集为动作感知。
- **doc-sweep**：`docs/` 若干现状描述文件仍含旧 memory 三工具名 / 向量目录旧说——活文收正列为独立后续任务。
- **CLI 人类命令面**（`thincoder memory <list|search|put|remove>`）：`list` / `search` / `put` 为 personal-only 核心面（search limit 10、list 支持 `--type`）；`remove` 走同一 `deleteByUid` 路由（uid 全 layer + 裸数字兼容）——命令行与工具核心路由复用，无漂移；命令面**无**共享层 list / 过滤形态、**无** clear / 批量删（那些是 agent 工具面能力）。

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #75 / #82 / #133–#137 / #168 / 映射行 · §2.5.1 A1–A3 · §2.12.2 第 11 行 · §2.12.3 第 1–2 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（S1 收口轮）：§5 补**核内落点行数**指针（`index-bin.mjs` · `index-discover.mjs`）；§2 裸 basename 锚补路径前缀（`thincoder-vscode/src/index-discover.mjs:5-8`——机检修复）。
- 2026-09-14（**B 轮并入 · 试点批**）：新增 §6 **机制面**（总览与目标 / 存储与分层 / 检索 / 代码与文档索引 / 主循环集成与门禁 / 工具契约五动作 / 家目录展开 / 向量加载上界）·
  §7 **关键决策记录（D-MEM1–13）** · §8 **不并项与历史沿革**（含已知限制并入）
  来源 = `thincoder-cli/docs/design/MEMORY.md`（**旧档一字未改**——原地作参照历史）；首部加机制面指针一行。本档 80 → **334 行**。
- 2026-09-15（**VSC 轮并入 · 批 7**）：§6.9 新增 **VS Code 端实现面**（现状登记——文件制存储 / 向量优先检索 / 索引有效性 B1–B4 / 工具契约端差）· §7 补 **D-MEM14–15** · §8.2 补 3 行不并项登记（含文件制存储 (d) 类——已裁归一）· §9 拆分表 +1 行（归一退场）；来源 = `thincoder-vscode/docs/design/MEMORY.md`（**旧档一字未改**）；坐标按现状实核（`indexer.mjs:156,170` · `memory.mjs` 等）。 （迁移期引文）
- 2026-09-15（**引擎下限裁定收口 · eng-designer**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 修正轮）：§3.1 A3 行与 §4.1 第 1 行同轮收正——用户 2026-09-15 裁定：值 = **`^1.104.0`** · **不另做真机实测**（资料推导链 + `activate()` 护栏兜底）；原「待真机实测 + 过目 / 经真机实测确认后定值」口径作废。
- 2026-09-15（**索引存储面裁定收口 · eng-designer**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 修正轮-2）：用户 2026-09-15 裁定：索引面归一 = 并核 sqlite；**数据面零迁移 / 零兼容**（不写导入器——重新索引 = 正当路径）。收正面 = §6.9（现状登记 → 裁定收口注——文件制存储/检索 + B1–B4 随驱动删旧退场）· §4 第 11 行（兼容形态 + 裁定状态）· §3.1 A2（迁移边界注）· §7 D-MEM14（承接形态收口）。
- 2026-09-15（**W8 归一落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W8）：§6.9 现状登记收正为**W8 后实现面**
  （核 sqlite 句柄 / 护栏接线 / 检索面 / 重建面 / 工具契约端差 + 文件制面退场登记）；§9 行数实测 334 → **374**、拆分表第 3 行措辞随落地收正。
  VSC 侧删除集（`src/memory.mjs` · `embedding.mjs` · `index-bin.mjs` · `index-discover.mjs` · `indexer.mjs`）与核面接线均已落地 （迁移期引文——档已迁核）
  （机判 = `thincoder-vscode/test/memory-index-face.test.mjs` · `engine-floor-guard.test.mjs`）。
- 2026-09-18（**TUI 假死修复批 · eng-designer**——承 `docs/batches/2026-09-18-tui-freeze.md` 的 §1）：新增 §6.10（扫描让出 + 子代检索门）· §6.11（索引 origin 归一 + 数据面迁移判据）· §6.12（WAL 卫生）；§7 补 D-MEM17–D-MEM21；§8.3 补已知限制三行（别名路径 / 嵌套 origin 重叠 / 扫描事件循环上界）。
- 2026-09-15（**embedding UTF-16 截断缺陷批 · eng-designer**——承 `docs/batches/2026-09-15-embedding-utf16-truncation.md` 的 §2）：§6.3 补「嵌入输入文本（三路）」段（三处截断统一走 `text-budget.mjs` 的 `safeSliceUTF16`）；§7 补 D-MEM16；§9 行数复测收正（`wc -l` 口径——与核内机检同源；旧读数 374 系显示行号口径）。
- 2026-09-18（**TUI 假死批 · 修正轮-2（设计评审轮 1 的 12 条）· eng-designer**——承 `docs/batches/2026-09-18-tui-freeze.md` §3 轮次 1）：
  §6.10 修法 A1 补两道终止判据（游标不前进 / 尾块）；修法 B ① 需求锚标全（VSC 端 F-M7 + 迁移期 F-Q2/F-Q3 + 核心层 `AGENT-LOOP.md` §4.11 同批补）+ 补 auto-turn 面现状；
  §6.11 应用点补**删面 `thincoder-core/memory/delete.mjs`** 五落点 + 新增「模型可见 id 形态」段；§6.12 边界写实（最坏等待上界 = `busy_timeout`；busy-handler 语义 `unverified`）；
  §8.3 补「模型可见 id 的 origin 形态变更」一行。
- 2026-09-18（**TUI 假死批 · 修正轮（PK 游标）· eng-designer**——承 `docs/batches/2026-09-18-tui-freeze.md` §2 修正轮）：
  §6.10 增 **修法 A1（PK 游标）**（改前/改后 SQL · 键选取规则 · 否决形反例 · 逐调用点表 · 覆盖恒等声明 · tie-order 裁定 · 并发写可见性）；
  原「修法 A」改为 **A2（让出）** 并收正「行处理序逐条不变」表述 + 新增**墙钟与响应性诚实边界**段；
  §6.8 游标表述改指针（单源 = §6.10）；§7 补 **D-MEM22**；§8.3 收正两行（扫描上界/墙钟 · VSC 镜像面「文件制」陈说）+ 补一行（扫描期并发写可见性）。
- 2026-09-18（**TUI 假死批 · 实施后收正轮（fix）· eng-designer**——承 `docs/batches/2026-09-18-tui-freeze.md` §5 与父侧派单）：
  §6.11「端文件零改」收窄为「端**装配**文件零改 + **核库读数点例外**」（`thincoder-vscode/src/extension/panel-index.mjs:20` / `:35-37`——实施轮既有改动回填）；§7 D-MEM19 同句收窄 + 指针。语义零改。
- 2026-09-18（**坐标漂移收正轮 · eng-designer**——承 `docs/batches/2026-09-18-distill-prefix.md` §5 八、登记 · 台账 #76）：§7 D-MEM16 补注记——先例坐标 `thincoder-core/explore-distill.mjs:13` 随蒸馏前缀批序列化面退役（`safeSliceUTF16` import 已删）；**声明本体不变**（函数仍有 memory 族消费方——现体先例 = `thincoder-core/memory/core.mjs:15` 等三档）。
