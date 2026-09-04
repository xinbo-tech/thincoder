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
  - `personal`：个人记忆——**纯 DB entries 行**（`~/.thincoder/memory.db`——无 markdown 文件目录；FTS/embedding 随行触发器清理——2026-09-03 评审 #2 措辞更正）
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

**检索**（`codeSearch` / `docSearch`）：`{kind: code|doc|memory}` 限定——FTS 候选 + 向量重排，返回 `{file, startLine, endLine, snippet, score}`。暴露为工具：`code_search`（codeSearchTool）/ `doc_search`（docSearchTool）/ `memory`（memoryTools——§6 单工具五动作 search/put/list/delete/clear——2026-09-03 工具枚举同步）。

**doc 同步**（docs.mjs docSync）：扫描 `docs/`、`*.md`、AGENTS.md 等 → 分块 → FTS+向量；`doc_search` 在 agent 循环里按用户输入关键词匹配 chunk 注入（见 AGENT-LOOP.md §3）。

## 4. 主循环集成

- 记忆工具（memory 单工具——§6：action search/put/list/delete/clear——只读动作 search/list 免门、put 侧效门、批量删/clear confirm 门）供 agent 自主存取；`search` 结果注入 system 上下文（`<untrusted_memory>` 包裹）
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


## 6. memory 工具面重构：单工具多动作 + list/条件批量 delete/clear（2026-09-03 · 设计——用户裁定——✅ 已实现）

> 状态：设计（2026-09-03 用户裁定——需求层确认——方案 1 + 全层批量删）。触发：用户连续指出——①memory_put/search/delete 三个裸工具名分散（"不要每个操作一个工具名"——对齐 subagent 六动作先例——§19 裁定"工具会爆炸——靠参数做不同的事"）；②无列表操作（"记忆里有什么"无一等工具答案——memory_search 只按相关度回 top-N——2026-09-03 实证缺口）；③需清空/条件批量删能力。
>
> **已实现，验收勾销 2026-09-03**（评审 0🔴 通过 + 处置 commit f0b41c4——实现记录见 §6.4——设计正文保留 as-of 快照）。

### 6.1 需求

**总体需求**：memory 三件套合并为单工具 `memory`（action 路由——五动作 search/put/list/delete/clear）——新增 list（清单）+ delete 条件批量 + clear（personal 全清）——个人记忆与共享层都可治理——工具面收敛（防裸工具名继续膨胀）。

**功能性需求**：
- F-M1：单工具 `memory`——action: "search"（现 memory_search——query/scope/limit——只读）
- F-M2：action: "put"（现 memory_put——type/title/content/tags/scope——side-effect 权限门维持）
- F-M3：action: "list"（新）——{scope?, type?, keyword?, limit?} 过滤——输出紧凑清单（id/title/type/日期——不拉全文——limit 默认 50）
- F-M4：action: "delete"——单条形态（id + scope——现语义）+ **条件批量形态**（scope 必填 + **type/keyword 至少其一（评审 #4）** → 匹配多条删除——删除前返回将删条数/预览——**confirm:true 必填**——全层开放（personal + project/team——共享层可治理——team 复活注沿用））
- F-M5：action: "clear"（新）——**scope 必填且仅接受 personal（评审 #3——缺省/其他 scope 拒绝）**——confirm:true 必填——project/team 拒绝 clear（错误提示指引条件批量 delete）
- F-M6：两端对称（CLI src/memory/docs.mjs + VS Code src/memory.mjs——**byte-identical 边界：action 枚举/参数形态/描述逐字一致——scope 值域按端能力（评审 #5——VS Code 无 team——收到 team → 明确拒绝并指引 CLI）**）

**非功能性需求**：既有行为零回归（search 语义/put 权限门/delete 单条等价——action 路由后行为不变）；门禁纪律（批量删/clear = side-effect 高危——confirm 必填 + scope 必填——project/team clear 拒）。

### 6.2 设计

- **D-M1 工具定义重构**（CLI `src/memory/docs.mjs` + VS Code `src/memory.mjs`——同构）：`memoryTools()` 三工具（memory_put/search/delete）→ 单工具 `memory`——action enum ["search","put","list","delete","clear"]——参数按 action 分支——**描述写清 action 语义 + list/delete 批量/clear 的门禁要求**——旧工具名从工具表消失（退役——引用面同批清理）
- **D-M2 list 实现**：按 scope/type/keyword 过滤 entries/files——keyword 对 title/content LIKE——limit 截断 + 总条数注（"N 条——截断前 M"）——输出行：`id [type] title（date）`——compact
- **D-M3 delete 双形态**：单条（id + scope——现 **deleteByUid 单条语义（CLI——评审 #1 符号修正）**/VS Code 单删语义）；批量（scope 必填 + **type/keyword 至少其一（评审 #4——无过滤批量删 = 整层清空会绕过 clear 拒共享层门禁——拒绝并指引）**——先 count 匹配 → 返回 "将删 N 条：<前 5 条预览>"——confirm:true 后执行——无匹配 = 明确"0 条匹配"不报错——**confirm 缺失 = 拒绝（不删——返回预览让调用方带 confirm 重发）**）
- **D-M4 clear**：**scope 必填且仅接受 personal（评审 #3——缺省/其他 scope → 拒绝并指引——规格句自洽）**——confirm:true 必填——执行清空 personal 全部（**personal = 纯 DB entries 行——无 markdown 文件（评审 #2——§1 存储表述同批更正）——FTS/embedding 随行触发器清理——清空后检索零残留**）——project/team scope 传入 → 拒绝错误（"共享层不支持 clear——用 delete 批量条件删"）
- **D-M5 引用面同步（评审 #7 批准链补全——按 action 判定——不能按工具名）**：permission.mjs/interaction.mjs/tool-args.mjs 的既有特判全部改按 action 路由——**search/list 只读不过门；put 维持侧效确认门；批量 delete/clear = confirm:true + scope 门禁（评审 #7——是否叠加人类确认由实现核实现有单删先例——沿用直接删裁定——confirm 参数即门禁）**——context.mjs 提示词提及（memory_search → memory search）——主循环按名挂钩（`<untrusted_memory>` 注入点——评审 #8——列入引用面清理）——两端——discipline.md/README 工具表——**team 批量删复用 gitmem 复活注（评审 #7——单删既有语义：本地删 + gitmem 拉取可能复活——批量同注）**
- **D-M6 测试**（CLI + VS Code）：list（scope/type/keyword/limit 过滤 + 输出形态 + 空库）；delete 批量（匹配删/confirm 缺失拒绝返回预览/无匹配明确/单条形态回归）；clear（personal confirm 后清空/project 拒绝/无 confirm 拒绝——**评审 #9 补断言：clear 后 search 零命中 + FTS 零残留**）；search/put 经 action 路由行为等价回归（既有用例改路由断言）——**批量删返回预览文本/截断提示（"N 条——截断前 M"）逐字断言（评审 #9）**
- **D-M7 验收**：五动作全绿两端——门禁四拒（批量无 confirm/批量无过滤条件/clear 无 confirm/clear 非 personal）——既有 memory 行为回归（等价）——旧工具名零残留（**评审 #8：全仓 grep——含 prompts/docs 文本——排除 §0/§0.1 as-of 历史段**）——**byte-identical 边界（评审 #5：action 枚举/参数形态/描述逐字一致——scope 值域按端——VS Code team → 明确拒绝并指引 CLI）**——MEMORY.md §6 勾销 + §3/§4 工具枚举同步（评审 #6）

### 6.3 受影响文件（两仓）

- CLI：`src/memory/docs.mjs`（重构）+ `src/memory/core.mjs`（只读——如需批量删辅助函数）+ `src/cli/permission.mjs` + `src/tui/interaction.mjs` + `src/tui/tool-args.mjs` + `src/context.mjs`（提示词提及）+ 主循环挂钩点（`<untrusted_memory>` 注入——评审 #8）+ 测试 + `docs/design/MEMORY.md`（**本段 + §1 personal 存储措辞更正（评审 #2）+ §3/§4 工具枚举同步（评审 #6）**）+ discipline.md/README（工具表——若列旧名）
- VS Code：`src/memory.mjs`（重构）+ 对应引用面 + 测试
- **范围声明（评审 #10）：CLI 人类命令面（memory-command.mjs search/put/remove）本次不扩展 list/clear/批量删——工具面重构不影响命令面（核心路由复用——无漂移）**
- **实现期补（2026-09-03 实现记录——见 §6.4）**：CLI `src/agent/dispatch.mjs`（动作级只读分类——评审 #7 批准链必需的判定位）+ `src/memory.mjs`（hub 导出 matchMemoryRows/deleteWhere/clearPersonal）+ `src/prompts/system.md`/`src/tools/question.md`/`src/tools/websearch.md`/`src/tui/cmd-extract.mjs`/`README.md`/`scripts/verify-team.mjs`（旧名引用面清理——零残留验收）+ `test/tui.test.mjs`（describeToolArgs 补 memory action 行）+ `test/memory.test.mjs`（T4/T10 改动作路由 + S6-1..6）；VS Code `src/tools/index.mjs`（注册 memoryTool）+ `src/compact.mjs`/`src/tools/web.mjs`/`src/prompts/system.md`/`src/prompts/discipline.md`（旧名清理）+ `test/unit.test.mjs`（T5/T6/T10 改动作路由 + S6-1..5）+ **`src/memory-tool.mjs`（新增——合并工具段从 memory.mjs 拆出（500 行硬限——实现期按 539 行拆分：memory.mjs 收 core/search 273 行 + memory-tool.mjs 收工具面 278 行——导出 memoryTool；memory.mjs 补内部符号导出供工具模块引用））**

### 6.4 实现记录（2026-09-03——双端交付——实现注 + 偏差落文）

**验收勾销**（对照 D-M7，证据 = 测试用例）：
1. ✅ 五动作全绿两端——CLI `test/memory.test.mjs` S6-1..S6-6 + dispatch 门禁 S6-5（`executeToolCalls` 真路由）；VS Code `test/unit.test.mjs` S6-1..S6-5（动作级 `isReadonlyAction` 断言）——两端全量 npm test 全绿（2026-09-03）
2. ✅ 门禁四拒——批量无 confirm（预览拒绝不删——CLI S6-3 / VS Code S6-3）；批量无过滤条件（S6-3——含 confirm 也拒——整层清空不能绕过 clear 拒共享层门禁）；clear 无 confirm（S6-4）；clear 非 personal（S6-4——project 拒 + VS Code team → CLI 指引）
3. ✅ 既有 memory 行为回归（等价）——search/put/delete 单条的输出契约与错误文本原样保留（CLI T4/T10、VS Code T5/T6/T10 改动作路由后断言不变）
4. ✅ 旧工具名零残留——**代码 + prompts/工具描述文本全清**（清理文件清单见 §6.3 实现期补）；**as-of 历史段豁免**（§0/§0.1 本文件 + CHANGELOG + 带日期设计段——含 AGENT-LOOP.md/ARCHITECTURE.md/ARCHITECTURE-v2.md/ENGINEERING-MODE.md/ENGINEERING-WORKLOOP.md/EVALUATION.md/FEATURES.md/TODO.md 的 memory_put/search/delete 提及 + VS Code 仓 docs/CAPABILITY_GAP.md（审计 2026-09-03 补录）——subagent_check 退役先例同款处置——**列为后续项：独立 doc-sweep 任务改活文（FEATURES.md 工具表/ARCHITECTURE.md 模块段/AGENT-LOOP.md 机制行/CAPABILITY_GAP.md 清单等未含日期的现状描述最优先）**）
5. ✅ byte-identical 边界落地——两端工具定义共用同一描述/参数文本（§6 单一来源逐字复制），scope 值域按端（CLI personal/project/team；VS Code personal/project——收到 team 明确拒绝并指引 CLI——每动作均查）；CLI ↔ VS Code `src/prompts/*.md` 15 文件 byte-identical 测试守护 prompts 侧
6. ✅ MEMORY.md §6 勾销 + §1/§3/§4 工具枚举同步（本记录 + 下两节措辞更新）

**实现注**：
- **code review 修正轮（2026-09-03——round1 0🔴 + 4🔵 全修——round2 0🔴）**：① search 空 query（含纯空白）两端短路——CLI `(no matching memories)` / VS Code `No matching memories found.`（旧工具 schema query 必填——非回归；两端对齐）；② VS Code search limit 归一化（normalizeLimit——与 CLI/execList 同款）；③ CLI scope 过滤超采样窗口 max(limit*4,20) 为召回上限——注释落档（接受的取舍）；④ dispatch.mjs 注释订正（search/list 不并入 Phase-2 批并行——串行——与本节既有偏差记录一致）
- **list/批量删的 origin 限定**：CLI files 层行按当前上下文目录（projectDir/team dir——与 search 的 projectOrigin 同源）过滤——其他项目/团队克隆的存量行不进入 list/批量删（工具只能动它能定位的文件；单条 delete 仍按 uid 全语义）；team scope 的 search 仍全 origin（检索面语义不变）
- **dispatch 动作级分类**（CLI dispatch.mjs `isSubagentReadonlyAction` 扩展）：memory search/list 与 subagent check/status 同归类——planMode 放行/免权限询问；put/delete/clear 维持侧效门。VS Code 侧走工具级 `isReadonlyAction`（execute-tools.mjs 既有动作分类——三处门位自动生效）
- **门禁实现顺序**：批量删/clear 在工具内校验 scope → type/keyword 过滤（批量）→ confirm——confirm 参数即门禁（直接删裁定——无第二层人类确认）
- **VS Code put 补 scope 校验**（原实现 scope 未校验——任意目录名会写成 `memory/<bogus>/`）：现非法 scope 拒绝 + team 指引 CLI
- **输出契约逐字**（两端同文，测试逐字断言）：list 空 = `0 条匹配`；list 截断 = `N 条——截断前 M`（N = 展示数，M = 截断前总数）+ 行 `id [type] title（date）`；批量删预览 = `将删 N 条`（N>5 时 `将删 N 条：前 5 条预览` + 5 行 + `5 条——截断前 N`）+ `confirm:true required — re-send with it to execute the deletion`；执行 = `Deleted N entries in scope X` / clear = `Cleared personal memory (N entries deleted)`

**偏差落文**（上报父侧，非静默）：
- explore/plan/consult 子代理按 **工具级 readonly 过滤**工具集（readonlyToolNames）——合并后 memory 工具（工具级 readonly:false）从这些只读子代理的工具表消失，子代理不再能 memory search（此前 memory_search readonly:true 在内）——动作级只读分类只覆盖 dispatch 门位，不覆盖子代理工具集过滤——**后续项：如需子代理 memory search，改 allowed 集为动作感知**
- 旧工具名在 as-of 历史文档中保留（见上验收 #4 豁免清单）——活文 doc-sweep 列后续项
- CLI dispatch Phase-2 批并行：memory search/list 仍按非只读串行执行（此前 memory_search 并批）——正确性无影响，只读并行属优化面，未做动作级并行标记

**修复记录（2026-09-05——list/批量删匹配面改为磁盘为真相——孤儿文件缺陷）**：
- **P-M1（缺陷）**：§6 list/批量 delete 的 project/team 匹配面 = files 索引表（fileRows——SELECT FROM files）——**磁盘上有、索引无行的 md 文件（孤儿：外部拷贝 / gitmem pull / 早期索引失败遗留）对 list 不可见、对批量删免疫**——而 deleteWhere 每次执行后调 syncDir 会把幸存孤儿重新入表——表现为**清空共享层需多轮循环 delete**（2026-09-05 实测清空：5 轮 162 条——每轮 delete 只删"当时入表且匹配"的文件，孤儿按 type 逐轮浮现）。单条 deleteByUid 早有磁盘兜底（fetchFileEntry 无行 → parseEntry 磁盘重建——L404-409）——批量路径缺失即不对称缺陷；
- **D-M8（修复——磁盘为真相）**：`matchMemoryRows` 转 async——project/team 分支弃 files 表查询，改 `diskFileRows(dir, type, keyword)`：readdir + parseEntry 逐 .md 过滤（type 相等 / keyword 子串含 title OR content——大小写不敏感，SQLite LIKE parity）+ mtime 排序。list 与批量删预览/执行同一匹配面——**孤儿一轮即删**；deleteWhere 尾部 syncDir 照旧（收尾重索引幸存者 + 清 stale）。损坏文件（parseEntry 失败）跳过（与 syncDir 同语义——非合法条目）。files 表仍服务 search（FTS/向量）与 embedding 后台批次——索引层语义不变（**登记取舍：未入表孤儿在 syncDir 修复前不进 search 结果**）；
- **测试**：CLI `memory.test.mjs` S6-3a（孤儿 list 可见 + type=decision 批删一次删光 2 孤儿 + 非目标保留 + files 行前提断言）——双端同构（VS Code 镜像待上抛项同步）；既有 S6-1..S6-6 全绿（零破坏——35 tests/31 pass/4 skip）；
- **调用面**：execList/execDelete 预览 await matchMemoryRows（execList 转 async）；fileRows 函数删除（唯一引用被 diskFileRows 取代——likePattern 仍服务 personal 分支）。

