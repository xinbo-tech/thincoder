# 记忆系统设计（thincoder/src/memory/）

> 状态：2026-08 回补。三层记忆（个人/项目/团队）+ 代码/文档向量索引，`node:sqlite` 单文件存储（零依赖）。
> 2026-09-01 变更段：memory 工具补删除能力（需求层见 §0，设计见 §0.1）。**已实现，验收勾销 2026-09-01**（§0.1 验收标准逐条 ✅，测试见 §0.1 D4 T1-T11）。

## 0. memory_delete 删除能力（2026-09-01 用户需求：需求层）

**背景**（发布事故暴露）：记忆工具只有增（memory_put）/查（memory_search），**无删除能力**——错误/过时记忆（如 08-29"发布后必须轮询"规则）无法清理，只能靠"同标题更正记忆"压住旧条目（检索措辞错位时仍可能命中旧条目）。用户拍板：memory 工具补删除能力。

**总体目标**：让 agent 能按 id 精确清理错误/过时记忆（三 scope + 两端），删除后检索零残留、误删可审计重建——杜绝"错误记忆只能靠覆盖压住"的治理缺口。

**功能性需求**：
- **F1 · `memory_delete` 工具**：参数 `{ id, scope }`——`scope` 必填（personal/project/team，与 memory_put 对称，防误删他 scope）；`id` = 记忆唯一标识（`personal:<n>` / `project:<origin>:<path>` / `team:<origin>:<path>`——core.mjs `fetchEntry` uid 格式）——精确删除
- **F2 · id 可见性**：`memory_search` / `memory_put` 工具输出**带 id**（search 内部已含 uid——格式化层暴露；put 返回的 id 同样展示）——否则 agent 无法拿到删除所需的 id
- **F3 · 删除返回**：删除成功后返回被删条目（id/标题/内容摘要）——可审计、误删可重建（用户拍板：直接删 + 返回内容，不做两段式确认）
- **F4 · 三 scope 支持**：personal（纯 DB 行）/ project / team（markdown 文件 + 索引行——文件本体一并删除）

**非功能性需求**：
- **NF1 · 检索零残留**：删除后 FTS/向量索引同步清理——`memory_search` 不再命中已删条目
- **NF2 · 不存在处理**：id 不存在 → 明确错误（`memory <id> not found in scope <scope>`）
- **NF3 · scope 校验**：id 前缀与 scope 参数不匹配 → 拒绝（`id prefix personal: 与 scope project 不匹配`）
- **NF4 · 测试**：删除成功（三 scope）/ 不存在 / scope 不匹配 / 删除后搜索零命中 / FTS+向量索引零残留

**范围边界**：两端功能一致（用户拍板 2026-09-01：VS Code 端同样提供 memory_delete + search/put 带 id——**按各自存储实现**：CLI = SQLite（core.mjs 删 DB 行 + FTS/向量索引行）；VS Code = 文件存储（memory.mjs 删条目 markdown 文件）——**"存储结构不动"仅指两套存储实现不互相统一**（审计 2026-09-01 澄清：VS Code 端按 scope 子目录存放（`memoryDir/<scope>/`）为实现期对齐 D3"scope 目录定位"语义——存量根目录条目保持可查）；不动检索排序逻辑。

**F5 · VS Code 端同步（用户拍板：功能一致）**：`thincoder-vscode/src/memory.mjs` 提供 `memory_delete`（scope：personal/project——VS Code 既有两 scope；id = 条目文件名）+ `memory_search`/`memory_put` 输出带 id——与 CLI 同语义，按文件存储实现（删文件即删条目，无索引同步问题——VS Code 检索实时扫文件）。**实现注（审计 2026-09-01）**：存量根目录条目（scope 子目录布局前的旧条目，含 legacy .json）search 可见但 memory_delete 不可删（目录定位语义——文件不在 scope 子目录 → not found）——已知限制，接受（新条目均入子目录）。

## 0.1 设计（2026-09-01）

**实现现状核查**（设计依据）：CLI `core.mjs` 已有 `remove(memory, id)`（**仅删 personal `entries` 行**，FTS 由 `entries_ad` 触发器自动同步；**不含 project/team `files` 行、不含 markdown 文件、返回 boolean**——评审 #2 改符号引用）；memory 工具定义在 `src/memory/docs.mjs` `memoryTools`（memory_put/memory_search）；VS Code `memory.mjs` 为文件存储（`memoryDir(cwd)` = 项目 `.thincoder/memory/`，scope personal/project，检索实时扫文件）。**为什么已有 remove 却无 agent 工具**（2026-09-01 用户质询，事实核查）：remove 非孤儿——它是 **CLI 命令行子命令**底层（`src/cli/memory-command.mjs` `case "remove"` → `thincoder memory remove <id>`，人类用户终端手动用；**仅 personal 裸数字 id**）；**agent 工具表从未定义 memory_delete**（不是工具说明问题——是工具入口从未存在，且命令行版也是半成品：不处理 project/team 文件与索引）。本次设计 = 补全缺口：工具入口 + uid 全 scope + 文件/索引清理（**CLI `memory remove` 命令顺带升级为同一 `deleteByUid` 路由——用户拍板补全（评审 #3），命令行与工具同语义，避免两套行为漂移**）。

**D1 · CLI 删除路由（core.mjs）**：新增 `deleteByUid(memory, uid, { dirs })`（评审 #3 定稿：不再保留"或扩展 remove"二义——CLI 命令与工具统一走 deleteByUid）——按 uid 解析：
- `personal:<n>` → `DELETE FROM entries WHERE id = ?`（既有 remove 逻辑迁入；FTS 由 `entries_ad` 触发器自动同步；embedding 为 entries 表 BLOB 列（schema v4 起）——**行删即 embedding 随行删除，无索引残留**——评审 #1 核实：§2 旧"vectors 表"描述已更正）
- **裸数字 `<n>`** → 解析为 `personal:<n>`（CLI `memory remove` 既有兼容路径——评审 #3 显式声明）
- `project:<origin>:<path>` / `team:<origin>:<path>` → **删除 markdown 文件**（`join(dir, path)`——dir 由调用方传入的 layer 目录，与 `putMarkdown` 同源；**路径包含校验**：resolve 后路径必须仍在 layer 目录内——`..`/绝对路径（含 Windows 反斜杠变体 `..\`——评审 #4 分隔符无关校验，normalize 后前缀检查）；**文件已缺失（ENOENT）→ 视为已删继续**，不中断）+ **`syncDir`**（"vanished entries are removed from the index"——自动清 files 行 + FTS + embedding）——**不手删 files 行**（syncDir 单源）
- **team scope 删除语义**（用户拍板本地删，评审 #4）：删除 = 本地文件删除 + syncDir 清索引——**不做 git 提交/推送**（git 传播是 gitmem 的职责；删除可逆性优先——工具误删不自动推全团队，git 工具可恢复）；**注明**：team 记忆若经 gitmem 拉取同步，下次拉取可能复活已删文件（远端未删时）——远端删除需经 git 工具处理
- 返回被删条目内容（删除前 `fetchEntry` 读取——F3）——**实现注（2026-09-01）**：uid 的 path 段按**最后一个 `:`** 切取（Windows 盘符 origin 如 `project:C:\dir:file.md` 使朴素 `:` 切分失效）；`fetchEntry` 失败时按 path 段回退查 files 行，再退文件直读（`parseEntry`）；同时 `ftsSearch` 的 files uid 修正为**完整 origin**（原实现输出空 origin `project::file.md`，与向量通道 `layer:origin:path` 不一致——实现期对齐，满足 F2"完整 uid"）

**D2 · CLI 工具层（docs.mjs memoryTools）**：
- +`memory_delete` 工具：`{ id, scope }`——scope 必填（personal/project/team）；**校验**：id 前缀与 scope 一致（`personal:` ↔ personal 等——NF3），不一致拒绝；调 D1 路由；返回 `Deleted <id>: <title>` + 内容摘要（F3）
- `memory_search` 输出**带 id**（search 内部已返回 uid——格式化层暴露 `[<scope>][<type>] <title> (id=<uid>)` 或等价——F2）
- `memory_put` 输出带 id（**每 scope 构造完整 uid 展示**：personal → `personal:<n>`；project/team → `project|team:<origin>:<path>`——与 memory_delete 接受的 id 格式一致——评审 #5）

**D3 · VS Code 端（memory.mjs）**：
- +`memoryDeleteTool`：`{ id, scope }`（scope personal/project——VS Code 既有；id = 条目文件名 `entryFilename(title)`）——**scope 校验语义（评审 #6）**：scope 参数定位存储目录（`memoryDir(cwd)` 下按 scope 分子目录）；id 文件不在该 scope 目录 → NF2/NF3 错误（文件名无前缀可校验——以目录定位为准）；删除前读文件返回内容（F3）；删 `memoryDir(cwd)` 下对应文件；不存在 → NF2 错误
- `memorySearchTool`/`memoryPutTool` 输出带 id（文件名——F2）——**实现注（2026-09-01）**：`memoryPutTool` 的 scope 参数此前被忽略（一律写 memoryDir 根）——实现期对齐存储布局：**按 scope 写入 `memoryDir(cwd)/<scope>/` 子目录**（与 delete 的目录定位同源）；`search()` 检索面 = legacy 根目录 + 两 scope 子目录（存量根目录条目向后兼容仍可查）；向量通道（`searchIndex` kind=memory）输出补 `(id=<文件名>)`。**已知交互**：VS Code 索引器的 `listMemoryFiles` 只扫 `memory/` 顶层，scope 子目录条目经 `discoverFiles` 递归入 manifest 后会触发 `needsRebuild` 的 file-removed 误判（`thincoder-vscode/docs/TODO.md` 既有条目）——本实现不触碰索引器（文件清单外），列为后续项

**D4 · 测试**：
| 用例 | 输入 | 预期 |
|---|---|---|
| T1 CLI personal 删除 | put personal 条目 → memory_delete personal:&lt;n&gt; | 返回被删内容；search 零命中；**entries 行整体删除（含 embedding 列）+ FTS 零残留**（直接查 entries_fts——评审 #1） |
| T2 CLI project 删除 | putMarkdown project 条目 → memory_delete project:&lt;origin&gt;:&lt;path&gt; | 文件删除 + files 行删除 + search 零命中 |
| T3 不存在 | memory_delete 不存在的 id | 明确错误（NF2） |
| T4 scope 不匹配 | id 前缀 personal: + scope=project | 拒绝（NF3） |
| T5 VS Code 删除 | put 条目 → memory_delete（文件名 id） | 文件删除；search 零命中 |
| T6 VS Code 不存在/scope 校验 | 同上 | NF2/NF3 同语义（scope 目录定位） |
| T7 CLI `memory remove` 升级 | `thincoder memory remove project:&lt;origin&gt;:&lt;path&gt;` | 走 deleteByUid 路由（uid 全 scope——评审 #3）；裸数字 id 兼容保留 |
| T8 CLI team 删除 | putMarkdown team 条目 → memory_delete team:&lt;origin&gt;:&lt;path&gt; | 文件删除 + syncDir 清 files 行 + search 零命中（评审 #1：NF4 三 scope 全覆盖） |
| T9 路径校验 + ENOENT | ① id path 含 `..`/绝对路径（含 `..\`）→ 拒绝；② files 行存在但文件已缺 → 删除继续（syncDir 清行） | ① 明确错误；② 成功 + 索引清理 |
| T10 F2 id 可见性 | memory_put 后查输出 / memory_search 输出 | 输出含完整 uid（personal:&lt;n&gt; / project\|team:&lt;origin&gt;:&lt;path&gt;——CLI + VS Code 各自断言，评审 #1 补 F2 测试缺口） |
| T11 裸数字兼容 | `thincoder memory remove 5`（既有 personal 用法） | 解析为 personal:5 删除成功 |

**受影响文件**：
| 文件 | 改动 |
|---|---|
| `thincoder/src/memory/core.mjs` | +`deleteByUid`（uid 解析：裸数字→personal + project/team 文件删除（路径包含校验 + ENOENT 容错）+ syncDir + 返回内容——评审 #3 定稿唯一路由）；`remove` 收敛为 deleteByUid 兼容壳（boolean 语义保留）；`ftsSearch` files uid 补完整 origin |
| `thincoder/src/memory/docs.mjs` | memoryTools +`memory_delete` + search/put 输出带 id |
| `thincoder/src/cli/memory-command.mjs` | `memory remove` 升级：走 `deleteByUid`（uid 全 scope + 裸数字兼容——评审 #3 用户拍板补全） |
| `thincoder-vscode/src/memory.mjs` | +`memoryDeleteTool`（scope 目录定位校验）+ put 按 scope 写子目录 + search 检索面扩展 + search/put 输出带 id |
| `thincoder/test/`（memory 相关测试文件） | +T1-T4 + T7-T11 |
| `thincoder-vscode/test/`（memory 相关测试） | +T5/T6 + T10 |
| `docs/design/MEMORY.md` | 本文档（§0/§0.1 变更段 + **§3/§4 工具枚举同步补 memory_delete** + 状态头——评审 #2 文档一致性） |
| `thincoder/src/memory.mjs`（实现期补） | 导出面（hub）补 `deleteByUid`——memory-command 与测试经 hub 引用，与 `remove` 并列 |
| `thincoder-vscode/src/tools/index.mjs`（实现期补） | `builtinTools` 注册 `memoryDeleteTool`——工具不注册则 agent 不可调用（设计受影响文件表遗漏，实现必需） |

**验收标准**（✅ = 2026-09-01 实现验收，证据为对应测试用例）：
1. ✅ CLI memory_delete：personal 删行（**含 embedding 列随行**）+ 搜索零命中 + FTS 零残留；project/team 删文件（路径校验 + ENOENT 容错）+ 索引清理（syncDir）——`test/memory.test.mjs` T1/T2/T8/T9
2. ✅ CLI 删除返回被删条目内容；不存在/scope 不匹配明确报错——T1-T4
3. ✅ CLI memory_search/memory_put 输出带 id（完整 uid——与 memory_delete 接受的格式一致）——T10
4. ✅ VS Code memory_delete：删文件 + 搜索零命中 + 返回内容 + 不存在/scope 校验（scope 目录定位）——`thincoder-vscode/test/unit.test.mjs` T5/T6
5. ✅ VS Code memory_search/memory_put 输出带 id——T10
6. ✅ CLI `memory remove` 命令走同一 deleteByUid 路由（uid 全 scope + 裸数字兼容）——T7/T11
7. ✅ 两端全量测试全绿 + lint（2026-09-01：CLI 全量 pass + VS Code 全量 pass；lint 两端通过）

## 1. 存储与分层

- **DB**：`~/.thincoder/memory.db`（`node:sqlite`，FTS5 虚表，BM25 排序，schema 版本 9，busy timeout 3s）
- **三层**（写入时指定 layer）：
  - `personal`：个人记忆（`~/.thincoder/memory/` 目录 + DB）
  - `project`：项目共享（`{cwd}/.thincoder/memory/` 目录，markdown 文件为源，DB 索引）
  - `team`：团队层（git 仓库同步，`gitmem.mjs`——提交/拉取记忆文件）
- **条目类型**：`rule | knowledge | decision | pattern`（四类，检索/展示区分）
- **项目层 = markdown 文件即真相**：`putMarkdown` 写文件（frontmatter：type/title/tags），`syncDir` 扫描目录增量入 DB（按 mtime）——文件可人工编辑、可 git 管理，DB 只是索引。

## 2. 检索（core.mjs search）

```
search(memory, query, { limit })
  → 双路召回：
      FTS5（buildFtsQuery：CJK 按字符分段 + 空格分词，BM25）
      + 向量（ensureEmbeddings 懒构建后余弦 top-k）
  → 合并去重（FTS 优先，向量补齐）
```

- `segmentCJK(text)`：中文按单字分段（FTS5 对 CJK 无分词器，单字索引保证召回）
- `ensureEmbeddings`：懒触发——首次检索时批量嵌入存量条目（`EMBED_TEXT_MAX_LEN=2000`），增量条目单独嵌入；嵌入失败静默降级纯 FTS（不阻塞检索）
- 嵌入模型：OpenAI 兼容 `/v1/embeddings`（`embedding.mjs createEmbedder`；bge-m3 是既定选择）；**向量存 `entries`/`files` 表 `embedding` BLOB 列（schema v4 起，无独立 vectors 表——2026-09-01 评审 #1 更正旧"vectors 表"描述）**，`cosine` 相似度

## 3. 代码/文档索引（code-index / code-sync / docs）

**存储**：`{cwd}/.thincoder/index/`——`manifest.json`（版本/嵌入模型/已索引 commit/文件→chunk 映射）+ `vectors.bin`（dim+count+offsets+原始 Float32 向量）。

**同步策略**（code-sync.mjs）：
- **git 增量优先**：`gitSync` 用 `git diff --name-status` 找改动文件（比全扫快一个量级）；非 git 仓库/首次回退全量扫描（`listProjectFiles` 按扩展名，跳过 node_modules/.git/dist 等）
- `codeSync`：全量扫描 → 逐文件 `_upsertCodeFile`（按 mtime 跳过未变文件）→ `markIndexedCommit` 记录基线
- **单文件增量**：`reindexFile(memory, cwd, absPath)`——write/edit/delete 工具执行后由主循环调用（agent.mjs 挂钩），mtime 变更才重建 chunk

**代码分块**（code-index.mjs）：按函数/类/export 边界切块（`chunkCode`，≤30 行、3 行重叠；`detectLanguage` + 语言专属符号提取——JS/Py 等）；doc 按 `##` 标题或空行切块（≤20 行）。每块带 `{idx, startLine, endLine}` 定位。

**检索**（`codeSearch` / `docSearch`）：`{kind: code|doc|memory}` 限定——FTS 候选 + 向量重排，返回 `{file, startLine, endLine, snippet, score}`。暴露为工具：`code_search`（codeSearchTool）/ `doc_search`（docSearchTool）/ `memory_search` / `memory_put` / `memory_delete`（memoryTools）。

**doc 同步**（docs.mjs docSync）：扫描 `docs/`、`*.md`、AGENTS.md 等 → 分块 → FTS+向量；`doc_search` 在 agent 循环里按用户输入关键词匹配 chunk 注入（见 AGENT-LOOP.md §3）。

## 4. 主循环集成

- 记忆工具（memory_put/memory_search/memory_delete）供 agent 自主存取；`search` 结果注入 system 上下文（`<untrusted_memory>` 包裹）
- **`put` 自动嵌入选块**：新条目写 DB 后若嵌入器可用，异步补向量（不阻塞写入）
- 目录/条目变更后由 `reindexFile` 增量刷新代码索引（后台，失败注入提醒不阻塞）

## 5. 关键设计决策

| 决策 | 理由 |
|---|---|
| 文件即真相（项目层） | 人工可读可改、可 git 管理；DB 只是可重建的索引（syncDir 幂等） |
| FTS5 + 向量双路召回 | 纯 FTS 对语义近义召回差；纯向量对精确术语差；合并互补 |
| 嵌入懒构建 + 失败降级 | 无 key 也能用（纯 FTS）；首次检索延迟可接受 |
| CJK 单字分段 | FTS5 无中文分词器；单字索引保召回（BM25 排序仍合理） |
| git diff 增量同步 | 大仓库全扫太慢；diff 只处理改动文件 |
| schema 版本迁移 | node:sqlite 迁移脚本按版本号递进，破坏性变更显式处理 |
