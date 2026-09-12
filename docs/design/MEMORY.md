# VS Code 三层记忆系统（MEMORY）

> 板块：记忆系统（VS Code 端实现）。状态：**当前态规格**（2026-09-08 由
> ARCHITECTURE §13 Memory 行展开并对照 `src/memory.mjs`/`src/memory-tool.mjs`/
> `src/embedding.mjs`/`src/indexer.mjs`/`src/embed-config.mjs` 核实写全——
> DOC-REORG-VSC 批 6）。
> 与 `MEMORY（CLI 仓·设计）` 同名对应同一"记忆系统"机制板块——各端独立实现。**CLI 是
> FTS5/sqlite 全文检索**，本端是**文件式 markdown + frontmatter**、无 FTS5/sqlite，
> 配 embedding key 走向量语义检索否则关键词回退——本档写 VSC 真实实现，不表 CLI
> 内部。
> 权威源（VS Code）：`src/memory.mjs`（存储/解析/检索核）、`src/memory-tool.mjs`
> （memory 工具面 + 动作执行）、`src/embedding.mjs`/`embed-config.mjs`/`indexer.mjs`
> （可选向量检索）——检索为 memory 工具按需（原 `src/context.mjs` 回合自动注入
> 已随该文件删除退役——GIT-ASYNC L21）。
> 装配（VS Code）：`src/tools/index.mjs`（memoryTool 注册）、`src/agent-tools/`
> 执行门禁（readonly 动作并行）、`src/extension/settings.mjs`（embedding 配置面板）。
> 关联：ARCHITECTURE.md（原 §13 源行——ARCHITECTURE 2026-09-08 瘦身收官，源行已删）、AGENT-LOOP.md（工
> 具调度）、TOOLS.md（readonly 分类）。

## 变更记录

- 2026-09-08：DOC-REORG-VSC 批 6——从 ARCHITECTURE §13 Memory 行展开，对照 VSC
  src/ 记忆模块核实写全本端独立文档（markdown 文件即真相 + embedding 向量回退）。
  ARCHITECTURE §13 不删（留后续瘦身批）。
- 2026-09-11：第 21 批（VSC 索引面收口）——新增 §4 索引有效性面（B1–B4：模型/维度校验 ·
  gitignored 重建触发 · 嵌套 memory 自检一致 · reason 词表）——需求 = `MEMORY（CLI 仓·需求）` §4。
- 2026-09-11：第 21 批修正轮（设计评审轮次 1——7 条落修）：契约五补删除存在性扫描 + D-I7 + §4.1-B2 代价补注 +
  T-I6/T-I10 删场景口径 + T-I9/契约八收集域 + AC-I4/AC-I5 标签 + §4.7 登记边界三。

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

- **search**：query + 可选 layer/limit（默认 5）。空 query 短路 → 固定文案
  `No matching memories found.`。团队 layer → `Error: memory search: VS Code
  memory has no team layer — team memory is managed by the CLI`。
- **put**：默认 layer `personal`；type 校验 + title/content 必填 → 写
  `scopeDir(cwd,layer)/<filename>` → `Saved memory entry "<title>" (type: <type>,
  layer: <layer>, id=<filename>)`。
- **list**：layer/type/keyword 过滤，created 倒序，limit 默认 50 → 行 =
  `<file> [type] <title>（<date>）`；截断 → 首行 `N 条——截断前 M`。无匹配 →
  `0 条匹配`。
- **delete**：有 id → 单删（读内容后删 → 可审计可恢复，返回
  `Deleted <id>: <title>\n<content>`）；无 id → 批量（layer + type/keyword，
  confirm:true 门，无过滤 layer 全清拒绝——clear 专属）。批量返回
  `Deleted N entries in layer <layer>`。
- **clear**：仅 personal 全清，`{layer:"personal", confirm:true}` 门 →
  `Cleared personal memory (N entries deleted)`；project/team 拒绝。
- **layer === scope 概念统一（2026-09-08 用户指出——"不看源代码谁知道 layer=scope？"；用户裁定：全统一成 layer）**：memory 三层（personal/project/team）代码里**两个词混用**——核心层用 `layer`（DB 列名 + 结果字段 + deleteByUid 从 uid 前缀拆 layer），工具层参数用 `scope`（search/list/delete 的 scope 参数）。
  ——模型看到 search 结果带 `[layer]` 标签、delete 却要 `scope` 参数——命名分裂让模型困惑。**修复（裁定统一成 layer）**：scope 参数改名 layer（工具面 + 描述），DB 列/内部本即 layer 不动（无 schema 迁移）。

- **delete 工具语义修正（2026-09-08 explore 一手核实——先前的"delete scope 不一致 bug 修复"注前提错误，作废重写）**：
  - **核实结论**：①search 结果**已显示 layer**（行首 `[layer]` 标签 + id 前缀——"结果不含 scope"不成立）；②id 前缀**已自路由**（命名空间互斥）——deleteByUid **不需要 scope 参数**（从 uid 前缀解析）；③工具层 scope 必填 + 前缀强校验是纯确认门禁——模型 scope 猜错 → 报错——**"search 能找到但 delete 删不掉"的唯一机制**；④跨 scope fallback 不必要。
  - **修正设计**：
    ①**layer 可选**（裁定统一成 layer）——传了则校验（防误删保持），**不传则按 id 前缀直接路由**（与 search/list 找到的 id 直接对接）；批删形态（无 id）仍必填 layer（参数改名）。
    ②**list 补独立 `[layer]` 标签列**（与 search 行对齐，成本低）。
    ③**第三个真缺口补设计（评审 #2 + #5 采纳——定 delete 尊重 uid origin 段 + VSC uid/origin 格式定稿）**：VSC id = 文件名（无 layer 前缀）；origin = 文件所在物理层目录（.thincoder/memory/personal/ 或 project/）。
      ——delete 文件定位改尊重 uid 的 origin（非当前 dirs[layer] 假设）——否则 search/list 跨层带出的行"能看到但碰不到"；落点：delete 按 id 定位先查 uid 物理层目录，dirs[layer] 兜底，本地无对应目录 → ENOENT 容错 not-found 错误（VSC：filterAliveFiles stale-guard——无 syncDir）。
  - **输出/错误串同步（评审 #1 采纳——scope→layer 延伸至模型可见输出）**：输出契约 + 错误串的 `scope` 词同步改 `layer`（`Deleted N entries in layer X`/`与 layer project 不匹配`/`not found in layer <layer>`）+ byte 断言测试同步——模型看到的所有文本全是 layer 无 scope 残留；CLI --scope 随动改 --layer（CLI 端设计在 CLI MEMORY.md——评审 #2 指正 §6 悬空）；本档 §1-§3 残留 scope 批准后同步。
  - **工具描述具体化（2026-09-08 用户要求——工具描述是模型唯一看到的，须完善）**：工具层 scope 参数全改名 layer（search/put/list/delete/clear 的 args.scope → args.layer + schema scope 字段 → layer + 描述内 scope 词 → layer——用户裁定统一成 layer）。重写后描述要点：
    - **search/list**："layer 可选（personal/project/team——缺省搜全部层）；结果每行含 `[layer]` 标签 + id（id 前缀即 layer）"
    - **delete**："单删 {id, layer}——**layer 可选**：传了则校验（id 前缀须与 layer 匹配防误删），不传则按 id 前缀直接路由；批删（无 id）必填 layer + type/keyword + confirm:true"
    - **layer 概念**："layer = personal/project/team 三层——结果行首 [layer] 标签、id 前缀、delete 的 layer 参数是同一概念——delete 把结果的 [layer] 填进 layer（或省略自动路由）"
    - 无 scope 词（全部 layer）——消命名分裂（模型看到 [layer] → delete 填 layer——直接对应）。
  - **验收测试表（评审 #1 采纳——补用例表）**：
    | 用例 | 输入/场景 | 预期输出 | 对应 |
    |---|---|---|---|
    | layer 可选单删 | delete {id: 文件名, layer: "project"}（id 在 project 层） | 校验通过 → 删（前缀匹配） | layer 可选 |
    | layer 省略单删 | delete {id: 文件名}（id 在 project 层） | 按 id origin 路由 → 删（不报 scope 错） | layer 可选 |
    | layer 不匹配单删 | delete {id: 文件名(project), layer: "personal"} | 明确错误（id 前缀与 layer 不匹配） | 防误删 |
    | 批删必填 layer | delete {type: "rule", keyword: "x"}（无 layer） | 明确错误（批删需 layer + filter + confirm） | 批删 |
    | list 补 [layer] 标签 | list project 层 | 每行含 [project] 标签（与 search 对齐） | list 标签 |
    | 输出无 scope 词 | search/put/list/delete/clear 全动作 | 模型可见文本（结果/错误）无 scope 词（全 layer） | 输出同步 |
    | delete 尊重 origin | delete 跨 cwd memory 文件的 id | 按 uid origin 定位删除（非当前 dirs[layer]） | origin 尊重 |
    | 边界 本地无 origin 目录 | delete 远端 clone 的 id（本地无目录） | ENOENT 容错 not-found 错误 + 读路径 filterAliveFiles stale-guard（不报假成功——VSC 无 syncDir——索引整库重建 + 读路径 guard 为 VSC 等价物） | origin 兜底 |
    | 错误 clear project | clear {layer: "project", confirm: true} | 明确拒绝（clear 仅 personal） | clear 边界 |
  **归属**：MEMORY.md 工具语义（本段）——双端（CLI/VSC）同机制各自独立实现。
- **文件式即真相**：markdown 文件就是存储本身（list/批量 delete 匹配面 = 磁盘扫
  描），无独立 DB/索引文件——与 CLI FTS5 的差异是本端最本质的形态差。
- **无 team 层**：本端只有 personal/project 两 scope；team 记忆由 CLI 管理（拒绝
  文案给引导）。
- **向量可选增强**：embedding key 配置后才走向量；缺省关键词路径功能完整，二者
  契约（返回形状）一致。


## 4. 索引有效性面（第 21 批——2026-09-11）

> 需求层 = `MEMORY（CLI 侧）§4`（F6–F9 / N5–N6）；本段 = 设计层 + 测试层。
> 来源批次 = `2026-09-11-VSC-INDEX-PERCEPTION（CLI 侧）§1` 条目 B1–B4。
> 现状锚（as-of 2026-09-11）：`src/indexer.mjs` 326 行 · `src/index-discover.mjs` 74 行 · `src/extension/panel-index.mjs` 164 行。

### 4.1 方案选型（判据 = 静默失效 → 可见；含代价）

#### B1 —— 索引与当前 embedding 模型/维度不一致（现状：全 0 分条目被当结果返回）

机械根因（已证）：`cosine(a,b)` 长度不等直接 `return 0`（`src/embedding.mjs:48`）——`searchIndex` 排序后
仍取 top-K ⇒ **返回一批 score=0.000 的无关条目**（不是「搜不到」，是「给错」）。`tools/code.mjs` 的
`vectorSearch` 只把「空数组」当回退信号（`results.length === 0`），memory 侧 `alive.length > 0` 同理——
两条消费链都会把无效结果当有效结果。

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **校验（模型 + 维度）+ 不产出 + 状态面可见** | 静默失效→可见：✅（设置状态行 + 重建提示）；代价：新增 ~20 行 + 状态面 2 处消费点 | 校验点在 `searchIndex`（返回空 → 既有回退链自动生效）+ `loadIndex`（头一致性）；可见面 = 既有 `pushIndexStatus`/`maybePromptIndex` 两个推口 | **选定** |
| 2 | 检测到不匹配即自动重建 | 可见：❌（沉默 30s+ 网络重建）；且无 key/离线时又回落静默失败 | 重建成本 = 全量嵌入调用（首次 ~30s 级）；用户此时可能只想换回模型 | 否决 |
| 3 | 仅报错（throw / 工具错误串） | 可见：✅ 但把「可选增强故障」升级成「工具故障」 | 违 F3/N5 降级可用精神（关键词路径本可照常出结果） | 否决 |
| 4 | 仅文档声明（现状 TODO 已声明） | 判据不满足（用户仍看不到） | — | 否决 |

#### B2 —— gitignored 的非 memory 可索引文件增删改不触发重建

现状：dirty 集只源 `git status --porcelain`（`src/indexer.mjs:152-155`）；memory 目录已特判（`:186-195`）——
其余 gitignored 可索引文件（如被忽略的 `notes.md` / `local/*.mjs`）增删改 ⇒ `needsRebuild` 恒 `false`（索引静默过期）。

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **ignored 集并入（同一 git 子进程 `--ignored=traditional`）+ 限定根走查** | 覆盖：✅；代价：子进程加一 flag（本仓实测 19 条 `!!` 条目，走查根经 SKIP_DIRS/点目录过滤后 ≈ 0 个可索引文件） | 大仓最坏代价 = 被忽略且未豁免的子树规模（node_modules/dist/.turbo/coverage 等已在 SKIP_DIRS——不扫）；只扫「走查规则可产出可索引文件」的根；**git 侧实测见下方补注（选定非免费）** | **选定** |
| 2 | 全量扫描兜底（每次 walk + 逐文件 mtime） | 覆盖：✅；代价实测：小仓 340 文件 walk 10ms + stat 27ms；**大仓 48,489 文件 walk 672ms + stat 3191ms ≈ 3.9s** | `needsRebuild` 在面板打开/切项目路径上同步跑（扩展宿主线程）——大仓不可接受 | 否决 |
| 3 | 显式提示（「可能有未跟踪文件未纳入检测」） | 可见：⚠️（无具体对象、不可操作、常态噪声） | — | 否决 |
| 4 | 维持 + 声明 | 判据不满足（索引仍静默过期） | — | 否决 |

> **代价实测补注（评审 #7——2026-09-11 修正轮；本机 = Windows / git 2.55.0.windows.3——单机单版本、重复读数波动大，勿当多平台常数）**：
> ① `--ignored=traditional` **不下钻被忽略目录**——整棵忽略子树在输出中只占 1 条顶层条目（合成实测：2,000 文件与 20,000 文件忽略子树均 → `!! <dir>/` 单条；本仓 19 条 `!!`）——git 侧输出规模界 = 顶层忽略条目数（逐条忽略的散文件按条计），与子树文件数无关；
> ② 本仓 `git status --porcelain` 56–115ms（五读）→ 加 flag 后 311–559ms（八读）——**+~0.25–0.45s/次**（该仓含 ~16.6k 被忽略文件；合成 2k/20k 文件、嵌套 `.gitignore`、四模式 mimic 均未复现该增量——**规模律未闭合**，如实留白）；
> ③ 删除存在性扫描（契约五末条）新增一次 `git check-ignore --stdin -z`——本仓 341 路径实测 71ms · 合成 2,002 路径 111ms + 候选子集逐条 stat（2,000 文件 65ms，线性小常数）；
> ④ **走查侧界不覆盖 git 侧**：SKIP_DIRS/点目录只约束走查面，git 不豁免（node_modules 计入 ② 的增量）——两侧合计 ≈ ②+③；对「弃全量扫描」（候选项 2）的对照 = 非 git 树 48,489 文件 walk 672ms + stat 3,191ms（D:/teamcode 实测——本次复核该树不在 git 工作树内）——选定案低一档但**非免费**。

#### B3 —— `listMemoryFiles` 非递归 vs `discoverFiles` 递归（嵌套文件反复判 file-removed）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **`listMemoryFiles` 递归（与 `discoverFiles` 同 walk 规则）** | 恢复代码自述不变量「discovery 与 rebuild 判定不得背离」（`src/index-discover.mjs:42-45`）；索引内容零变化 | +~10 行（walk helper 复用）；嵌套文件从此正常纳入变更检测 | **选定** |
| 2 | 收窄 `discoverFiles`（不索引嵌套 memory） | 改动索引内容（行为面更大）；与 `kindFor`/`shouldIndexFile` 的「memory = `.thincoder/memory/` 下任意文件」定义冲突——反而新增两处口径分裂 | 需新增 walk 模式 + 索引内容变更 | 否决（登记边界：嵌套文件不进关键词读路径——见 §4.7） |
| 3 | 维持 + 声明 | 无效重算持续（每次 `needsRebuild` 都判 `needed:true` ⇒ 反复整库重建） | — | 否决 |

#### B4 —— reason 串失配（`file-changed` ×2 vs `file-changes` ×1）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **统一为 `file-changed`（改 `:207` 一处）** | 2/3 多数；与 `file-added`/`file-removed`/`file-missing` 同构（单词式） | 一行改动 + 词表测试锁 | **选定** |
| 2 | 引入导出常量表（REASONS） | 无消费方（`reason` 仅诊断——全仓唯一消费点只取 `needed`：`panel-index.mjs:102`） | 加面（YAGNI） | 否决 |

### 4.2 接口契约

**契约一 · `indexCompat(cwd, embedder)`（新导出——`src/indexer.mjs`）**

```
返回 { compatible: true }                                   // 无索引 / 模型一致
    | { compatible: false, reason: "model-changed",
        indexModel, currentModel }                          // manifest.embed_model !== embedder.model
```
manifest-only（不读 vectors.bin、不发网络）——可被状态面与提示面低成本调用。
理由：不同模型的向量空间**不可比**（即便维度相同——同维异模型仍会给出“看似正常”的相似度）——
名称不一致即结果不可信；维度闸（契约三 step 3）只兜「名称相同而实际维度变了」的残余面。

**契约二 · `loadIndex(cwd)`（修订——头一致性校验）**

解析 `vectors.bin` 头得到实际 `dim` 后：`manifest.vector_dim !== dim` ⇒ **返回 null**（等价损坏索引 → 走重建路径）。
理由：`vector_dim` 写入端与文件头同源（`buildIndex`），不等即「文件被换/损坏」，任何后续打分都不可信。

**契约三 · `searchIndex(cwd, embedder, ...)`（修订——两道闸 + 空返回）**

1. `loadIndex` 空 / vectors 空 → `[]`（既有）；
2. `!indexCompat(...).compatible` → **`[]`**（新增——不进入打分段）；
3. embed query 后 `qvec.length !== idx.dim` → **`[]`**（新增——名称相同而实际维度变化的兜底）。
空返回语义 = 既有回退链信号：`tools/code.mjs:24` 与 `memory-tool.mjs:160` 均回退关键词路径——**消费方零改动**。

**契约四 · 可见面（两处既有推口扩展）**

- `pushIndexStatus`（`panel-index.mjs:13-31`）：`{ built:true, files, chunks }` 在读得 embedder 且
  `indexCompat` 不匹配时追加 `mismatch:{ indexModel, currentModel }`；
- `maybePromptIndex`（`:95-111`）：提示条件 = `needed || !compat.compatible`；不匹配时提示文案明示
  两个模型名 + 重建按钮（既有 "Build"/"Later" 两键不变）。

**逐字文案（coder 照抄——断言判据）**：

- 状态行（i18n 键 `settings.indexMismatch`·两档 locales）：
  - zh：`索引由 ${index} 构建 ≠ 当前模型 ${current}——建议重建`
  - en：`Index built with ${index} ≠ current model ${current} — rebuild recommended`
- 提示面（`maybePromptIndex`——既有硬编英文风格，不新增 i18n 键）：
  `Index was built with ${indexModel} but the current embedding model is ${currentModel}. Rebuild now?`
  （按钮保持既有 `"Build"` / `"Later"`。）

**契约五 · ignored 集（`needsRebuild` git 快路径——`src/indexer.mjs`）**

- 子进程改为 `git status --porcelain --ignored=traditional`（同一次调用同时取回 dirty 与 ignored）；
- `!!` 行归 ignored 集（**不**进 dirty 集——`!!` 无 rename 形态，解析走既有引号剥离）；
- 目录条目（尾 `/`）经 `canWalkRoot` 过滤后以 `discoverFilesUnder` 走查，产出候选文件后按既有四态判定
  （`file-added` / `file-changed` / `file-missing`）；该根下 manifest 中已消失的条目 → `file-removed`；
- 文件条目经 `shouldIndexFile` 过滤后按同一四态判定；
- **忽略文件删除存在性扫描**（评审 #1 修复——被忽略文件「删」的可达触发路径）：以 `git check-ignore --stdin -z`
  圈定候选——输入 = manifest 条目经 `canWalkRoot` 同源过滤后的路径集（NUL 分隔；manifest 为空则跳过），
  输出 = 「当前仍匹配忽略规则」的子集（模式匹配不依赖路径存在性）；对子集逐条存在性检查——缺失 → `file-removed`
  （含整棵被忽略子树被删除、目录条目随之消失的情形——由本扫描兜底）；
  依据：被忽略文件**删除后从 `git status` 与 `!!` 输出彻底消失**（git 对无踪迹文件天然不可见——`!!` 只列举现存路径），
  「模式匹配 + 存在性检查」是唯一可达触发；`check-ignore` 失败（异常/旧版 git）→ 跳过本扫描（降级 = 现状行为）；
  时序 = `!!` 条目处理之后（与 memory 特判 / 目录走查重叠时同向幂等——reason 一致）；成本见 §4.1-B2 补注 ③。
- `canWalkRoot(rel)`：无 SKIP_DIRS 组件 ∧（无点前缀组件 ∨ `rel` 是 `.thincoder/memory` 的路径前缀）——
  与 `discoverFiles` 的进入规则同源（`.thincoder` 下仅进 `memory`）；
- memory 目录特判（`:186-195`）**保留**（读模型不同源；与 ignored 走查重叠时幂等）。

**契约六 · `discoverFilesUnder(cwd, subdir)`（新导出——`src/index-discover.mjs`）**

与 `discoverFiles` 同一套 walk 规则（SKIP_DIRS / 点目录 / `.thincoder` 只进 memory / 扩展名白名单），
返回相对 `cwd` 的路径数组；`discoverFiles(cwd)` 行为不变（内部复用同一 walk）。

**契约七 · `listMemoryFiles(cwd)`（修订——递归）**

= `discoverFilesUnder(cwd, ".thincoder/memory")`（扩展名过滤照旧）——自检面与发现面同源。

**契约八 · reason 词表（单一化）**

`{ no-index · new-commits · file-added · file-removed · file-missing · file-changed · up-to-date }`
——`:207` 的 `file-changes` 改 `file-changed`；其余不动。**词表域 = `needsRebuild` 返回值**
（`indexCompat.reason` = 独立命名空间——不受本词表约束，见 §4.5 T-I9）。

### 4.3 关键决策记录（含否决备选）

| # | 决策 | 否决备选与理由 |
|---|---|---|
| D-I1 | 不匹配 = **不产出 + 可见**（选型 B1-#1） | 自动重建（静默 30s+，无 key/离线回落静默失败）· 仅报错（把可选增强故障升级为工具故障）· 仅声明（判据不满足） |
| D-I2 | dim 校验双层：`loadIndex` 头一致性（硬闸）+ `searchIndex` query 维度（软闸） | 单层不够：头一致性抓「文件被换」；query 维度抓「同名模型实际维度变了」——两者证据面不同 |
| D-I3 | ignored 集走**同一** git 子进程（`--ignored=traditional`），不启第二个进程 | 两个子进程 = 双份 git 启动成本；同进程一 flag 即可（实测输出 43 行 / 本仓） |
| D-I4 | 弃「全量扫描兜底」（选型 B2-#2） | 实测大仓 48,489 可索引文件 ≈ 3.9s（walk 672ms + stat 3191ms）——`needsRebuild` 位于面板打开/切项目同步路径，不可接受 |
| D-I5 | `listMemoryFiles` 递归对齐（选型 B3-#1） | 「收窄发现」会改索引内容 + 与 kindFor/shouldIndexFile 定义冲突；递归 = 恢复代码自述不变量、索引内容零变化 |
| D-I6 | reason 统一 `file-changed`（选型 B4-#1） | 常量表（无消费方——加面）；保持个例（真差异残留） |
| D-I7 | ignored 删除检测 = `git check-ignore --stdin -z` 圈定候选 + 存在性检查（评审 #1 修复） | 否决：① 全 manifest 逐条存在性扫描——stat 面 = 全体（含全部 tracked，与被否决的全量扫描同阶代价）；② `git ls-files` 未跟踪减法——候选面超 B2 窄化范围 + 未提交大仓退化全量 stat；③ 不做——T-I6/AC-I2/F7「删」断言落空 |

### 4.4 受影响文件清单（第 21 批——实施域；行数 = as-of 2026-09-11 实测）

| 文件 | 变更 | 行数（现 → 预计） |
|---|---|---|
| `src/indexer.mjs` | `indexCompat` 新增 · `loadIndex` 头校验 · `searchIndex` 两闸 · `needsRebuild` ignored 集 + 走查 + 删除存在性扫描 | 326 → ~395 |
| `src/index-discover.mjs` | `discoverFilesUnder` 抽出 + `listMemoryFiles` 递归 | 74 → ~92 |
| `src/extension/panel-index.mjs` | `pushIndexStatus` 追加 `mismatch` · `maybePromptIndex` 条件与文案 | 164 → ~196 |
| `webview/settings-tools.js` | `renderIndexStatus` 不匹配态渲染 | 367 → ~382 |
| `locales/zh.json` / `locales/en.json` | `settings.indexMismatch` 键 +1（两档） | 243 → ~245 |
| `test/index-perception.test.mjs` | **新档**（用例表 §4.5） | 新 → ~170 |
| `test/files.mjs` | 新档登记（本批三新档合计 +3；本面 +1） | 55 → 58 |

> 文档域（设计者写域——coder 零碰）：本档 §4 · `MEMORY（CLI 仓·需求）` §4 · 两级 `docs/TODO.md` 状态推进。

> **档位注记（≤300 警示 / ≤500 硬限）**：`src/indexer.mjs`（326 → ~395）与 `webview/settings-tools.js`
> （367 → ~382）为**存量超线**档——本批增量 +~69 / +~15，距 500 硬限余量充足，**本批不拆分**；无新增越线文件（~170 行测档远低于线）。

### 4.5 用例表（测试层——正常 / 边界 / 错误；✓ = 快层，slow = 归册 `test/slow.mjs`）

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| T-I1 模型不匹配 | 临时目录：manifest `embed_model:"A"` + embedder model "B" | `indexCompat` = `{compatible:false, reason:"model-changed"}`；`searchIndex` = `[]` | F6 / AC-I1 ✓ |
| T-I2 头维不一致 | `vectors.bin` 头 dim ≠ manifest `vector_dim` | `loadIndex` = `null`（重建路径） | F6 / AC-I1 ✓ |
| T-I3 query 维度兜底 | manifest 模型名相同、向量实际维度不同 | `searchIndex` = `[]`（不进打分） | F6 / AC-I1 ✓ |
| T-I4 状态面 | 桩 embedder + manifest（不匹配） | `pushIndexStatus` 载荷 `built:true` 且带 `mismatch:{indexModel,currentModel}` | F6 / AC-I1 ✓ |
| T-I5 提示面 | 同上 + 桩 `showInformationMessage` | 提示文案含两个模型名；选 "Build" 触发重建调用 | F6 / AC-I1 ✓ |
| T-I6 ignored 文件三态 | 临时 git 仓 + `.gitignore` 忽略 `notes.md`；改 / 删 / 增 | `needsRebuild`：改 → `file-changed`；删 → `file-removed`（**删除存在性扫描路径**——契约五末条）；增 → `file-added`（均 `needed:true`） | F7 / AC-I2 slow |
| T-I7 豁免零误报 | ignored 的 `node_modules/x.md`、`.thincoder/tmp/x.txt`、`.hidden/x.md` | `needsRebuild` = `needed:false`（不产候选） | F7 / AC-I2 slow |
| T-I8 嵌套 memory | `.thincoder/memory/personal/archive/x.md` 入 manifest | 连调两次 `needsRebuild` 均 `needed:false`；`listMemoryFiles` ⊇ 该文件且 == `discoverFiles` 的 memory 子集 | F8 / AC-I3 ✓ |
| T-I9 词表锁 | 全路径 grep + **`needsRebuild` 各分支** reason 收集（收集域 = `needsRebuild` 返回值；`indexCompat.reason` 独立命名空间——不在词表约束内） | `"file-changes"` 零命中；reason ∈ 七词表——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；现体 = 运行抽检 `no-index` | F9 / AC-I4 ✓ |
| T-I10 零回归正控 | 非 git 目录（兜底路径）与同内容 git 仓（快路径）——含 T-I6 忽略文件的**删**场景 | 两路同向（needed 一致——忽略文件删除两路均 `file-removed`）；dirty 集既有语义（rename/引号路径）用例不变 | N5 / AC-I5 slow |

### 4.6 验收标准（逐条回指需求——可机器验证）

- **AC-I1**（F6）：`node --test test/index-perception.test.mjs` T-I1–T-I5 全绿；修前红（现状 `searchIndex`
  返回非空 score=0 条目——T-I1 反例可复现）。
- **AC-I2**（F7）：T-I6/T-I7（slow——`npm run test:full`）全绿；`src/indexer.mjs` 内
  `--ignored=traditional` grep 命中且 `git status --porcelain`（无 flag 的旧形态）零残留。
- **AC-I3**（F8）：T-I8 全绿（连续两判 `needed:false` = 无效重算已消）。
- **AC-I4**（F9）：T-I9 全绿（现体 = 运行抽检 `no-index`——收集域 = `needsRebuild` 返回值；`indexCompat.reason` 不在词表约束内）；静态面（各分支字面量集比对 + `"file-changes"` 全仓 grep 零命中）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）。
- **AC-I5**（N5/N6）：T-I10 全绿 + 既有 `npm test` 全绿（零回归）。

### 4.7 边界（本批不做）

- 不改检索命中/排序语义、不改 embedding 调用与批处理、不做自动重建/自动取消；
- 不引入常驻轮询 / 新常驻定时器（ignored 集 = 既有检查点内的一次子进程 flag）；
- **登记边界一**：嵌套 memory 文件（`.thincoder/memory/<layer>/<子目录>/…`）仍不进关键词读路径
  （`readAllEntries` 按层目录一层读取——`src/memory.mjs:144`）——本批只消除「自检/发现背离」的无效重算，不动读模型；
- **登记边界二**：embedder 缓存（`embed-config.mjs` 进程内 `_tried` 缓存）不随外部 config 写盘刷新——
  外部改 `embedding.*` 后仍需重载窗口生效（与 B5 同族，见 `SETTINGS.md` §2.6 边界）；
- **登记边界三**：**未跟踪且未忽略**文件的删除不出现在 git 快路径（git 对无踪迹文件天然不可见——预存在行为，
  B2 窄化范围外；删除存在性扫描只圈 ignored 候选）；含整目录未跟踪时 porcelain 的折叠形态（`?? <dir>/`）——
  无 git 兜底路径按发现差集可判（两路既有的已知差异，本批不动）；
- **跨端观察（未核·登记）**：CLI 侧向量检索（`memory.db`）是否有同族的「模型/维度不校验」缺口——本批未核，
  登记为后续勘察项（不属本批范围）。
