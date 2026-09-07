# VS Code 三层记忆系统（MEMORY）

> 板块：记忆系统（VS Code 端实现）。状态：**当前态规格**（2026-09-08 由
> ARCHITECTURE §13 Memory 行展开并对照 `src/memory.mjs`/`src/memory-tool.mjs`/
> `src/embedding.mjs`/`src/indexer.mjs`/`src/embed-config.mjs` 核实写全——
> DOC-REORG-VSC 批 6）。
> 与 CLI `MEMORY.md` 同名对应同一"记忆系统"机制板块——各端独立实现。**CLI 是
> FTS5/sqlite 全文检索**，本端是**文件式 markdown + frontmatter**、无 FTS5/sqlite，
> 配 embedding key 走向量语义检索否则关键词回退——本档写 VSC 真实实现，不表 CLI
> 内部。
> 权威源（VS Code）：`src/memory.mjs`（存储/解析/检索核）、`src/memory-tool.mjs`
> （memory 工具面 + 动作执行）、`src/embedding.mjs`/`embed-config.mjs`/`indexer.mjs`
> （可选向量检索）、`src/context.mjs`（自动注入）。
> 装配（VS Code）：`src/tools/index.mjs`（memoryTool 注册）、`src/agent-tools/`
> 执行门禁（readonly 动作并行）、`src/extension/settings.mjs`（embedding 配置面板）。
> 关联：ARCHITECTURE.md（§13 源行——ARCHITECTURE 2026-09-08 瘦身收官，源行已删）、AGENT-LOOP.md（工
> 具调度）、TOOLS.md（readonly 分类）。

## 变更记录

- 2026-09-08：DOC-REORG-VSC 批 6——从 ARCHITECTURE §13 Memory 行展开，对照 VSC
  src/ 记忆模块核实写全本端独立文档（markdown 文件即真相 + embedding 向量回退）。
  ARCHITECTURE §13 不删（留后续瘦身批）。

---

## 1. 存储模型——markdown 文件即真相

- **存储根**：`cwd/.thincoder/memory/`。**作用域按目录分**：根目录（legacy 无
  scope）+ `personal/` + `project/` 三个物理目录（`readAllScopeEntries` 全量读取
  时标注 `_scope = "root"|"personal"|"project"`）。
- **条目格式（与 CLI 条目格式兼容——byte-exact）**：
  ```
  ---
  type: rule|knowledge|decision|pattern
  title: <标题>
  tags: [a, b]
  author: unknown
  created: YYYY-MM-DD
  ---
  <content>
  ```
  `VALID_TYPES = {rule, knowledge, decision, pattern}`；`VALID_SCOPES =
  {personal, project}`（本端无 team 层——拒绝 team 并给 CLI 引导）。
- **文件名**：`YYYYMMDD-<slug>-<rand4>.md`（slug 保 CJK/字母数字）。旧版 `.json`
  条目**只读向后兼容**（readAllEntries 解析 type+title，created 取
  created_at/updated_at 前 10 位）。
- 零依赖——纯 node:fs 同步 API。

## 2. 检索——向量语义优先，关键词回退

- **关键词打分**（memory.mjs search）：tokenizeQuery 去停用词（英文 + 中文停用
  词），CJK 回退补单字/双字 bigram；`scoreEntry` = title 3pt / tag 2pt / content
  1pt；`score > 0` 才返回。scope 参数限定单作用域目录。
- **向量路径**（execSearch 优先）：embedder 可用（config.json `embedding.{baseURL,
  apiKey,model}` 经 embed-config getEmbedder 创建）+ 索引存在
  （`.thincoder/index/`）→ `searchIndex(ctx.cwd, embedder, query, { kind:"memory" })`
  → 按 scope 目录前缀过滤 → 命中返回
  `${file}:${startLine}-${endLine} (id=…, score:…)\n${snippet}`；无命中回退关键词
  search。
- **向量索引**（indexer.mjs）：manifest + vectors.bin，memory 每文件单 chunk；
  索引重建纳入 `.thincoder/memory/`（kindFor 判定 memory 优先于 doc）。
- embedding 服务：OpenAI 兼容 `/v1/embeddings`（SiliconFlow bge-m3 / Ollama /
  OpenAI），批量 32 + 重试退避；向量归一化，点积 = 余弦相似度。

## 3. memory 工具契约（单工具五动作——本端接线 AC6）

memoryTool 注册于 `src/tools/index.mjs`。动作 = search / put / list / delete /
clear。action 级 readonly 分类：**search/list 只读**（plan mode 放行、免审批、可
并行）；put/delete/clear 保副作用门。

- **search**：query + 可选 scope/limit（默认 5）。空 query 短路 → 固定文案
  `No matching memories found.`。团队 scope → `Error: memory search: VS Code
  memory has no team layer — team memory is managed by the CLI`。
- **put**：默认 scope `personal`；type 校验 + title/content 必填 → 写
  `scopeDir(cwd,scope)/<filename>` → `Saved memory entry "<title>" (type: <type>,
  scope: <scope>, id=<filename>)`。
- **list**：scope/type/keyword 过滤，created 倒序，limit 默认 50 → 行 =
  `<file> [type] <title>（<date>）`；截断 → 首行 `N 条——截断前 M`。无匹配 →
  `0 条匹配`。
- **delete**：有 id → 单删（读内容后删 → 可审计可恢复，返回
  `Deleted <id>: <title>\n<content>`）；无 id → 批量（scope + type/keyword，
  confirm:true 门，无过滤 scope 全清拒绝——clear 专属）。批量返回
  `Deleted N entries in scope <scope>`。
- **clear**：仅 personal 全清，`{scope:"personal", confirm:true}` 门 →
  `Cleared personal memory (N entries deleted)`；project/team 拒绝。
- **layer === scope 概念统一（2026-09-08 用户指出——"不看源代码谁知道 layer=scope？"；**用户裁定：全统一成 layer**）**：memory 三层（personal/project/team）代码里**两个词混用**——核心层用 `layer`（DB 列名 + 结果字段 + deleteByUid 从 uid 前缀拆 layer），工具层参数用 `scope`（search/list/delete 的 scope 参数）。模型看到 search 结果带 `[layer]` 标签、delete 却要 `scope` 参数——命名分裂让模型困惑。**修复（裁定：全统一成 layer——scope 参数改名 layer）**：①工具层参数 `scope` → `layer`（search/list/delete 参数改名——与结果字段/DB 列一致）；②**工具描述 scope → layer**（"search/list 结果行首 [layer] 标签即 delete 的 layer 参数值"）；③**结果/文档统一用 layer**（模型看到的全是 layer——无 scope 词）；DB 列/内部逻辑本来就是 layer 不用动（无 schema 迁移）。

- **delete 工具语义修正（2026-09-08 explore 一手核实——先前的"delete scope 不一致 bug 修复"注前提错误，作废重写）**：
  - **核实结论**：①search 结果**已显示 scope**（行首 `[personal|project|team]` 标签 + id 前缀）——"结果不含 scope"不成立；list 结果 id 也含前缀，只差无独立 `[scope]` 标签列。②id 前缀**已自路由**（命名空间互斥无碰撞）——核心 deleteByUid **从不需要 scope 参数**，scope 从 uid 前缀解析。③工具层 scope **必填 + 前缀强校验**是纯确认门禁，模型 scope 猜错 → 报错——**这是"search 能找到但 delete 删不掉"的唯一机制**。④跨 scope fallback **不必要**。
  - **修正设计**：①**layer 可选**（裁定统一成 layer——原 scope 参数改名）——传了则校验（防误删保持），不传则按 id 前缀直接路由；批删形态（无 id）仍必填 scope。②**list 补独立 `[scope]` 标签列**（与 search 行对齐，锦上添花）。③**工具描述重写**——写明"search 结果行首 `[personal|project|team]` 即 delete 的 layer 参数值、id 前缀同值；delete layer 可选——不传则按 id 前缀路由"。④**第三个真缺口补设计**：uid origin vs 当前 dir 定位分裂——delete 文件定位用当前 `dirs[layer]` 无视 uid 内嵌 origin，而 search/list 匹配面可带出非当前 origin 行——要么 delete 尊重 uid 的 origin 段，要么工具描述写明"team 记忆可能来自其他克隆，本地无对应目录则删不了"。**归属**：MEMORY.md 工具语义（本段）——双端（CLI/VSC）同机制各自独立实现。
- **文件式即真相**：markdown 文件就是存储本身（list/批量 delete 匹配面 = 磁盘扫
  描），无独立 DB/索引文件——与 CLI FTS5 的差异是本端最本质的形态差。
- **无 team 层**：本端只有 personal/project 两 scope；team 记忆由 CLI 管理（拒绝
  文案给引导）。
- **向量可选增强**：embedding key 配置后才走向量；缺省关键词路径功能完整，二者
  契约（返回形状）一致。
