# 可移植性 — VSC 镜像面（批次二）· 设计

> 板块：可移植性（VSC 镜像面——批次二）· 对照 = `PORTABILITY（CLI 仓·设计）`（§9 = 对位清单权威）
> + `PORTABILITY（CLI 仓·设计）`（需求组 FR10–FR15——正文在 `ENGINEERING-MODE（CLI 仓·需求）` §2）·
> 批次档 = `2026-09-11-PORTABILITY-VSC-MIRROR（本仓）`。
> 状态：设计稿（待评审）。来源 = 批次档 §1（用户 2026-09-11「一起做了吧」——VSC 端 A 家族对位）。
> 镜像纪律：**各端独立实现、语义同源**（不做 byte-identical、禁以任一端产物回改另一端）——本档文本为 VSC 端定稿；
> CLI 侧文本以 CLI 档为准。消息文案（降级句 / 提示 / 拒绝）与端无关，本档选定与 CLI 已交付文本同文（§2 D6）。

## 1. 问题陈述与范围

### 1.1 问题

工程模式可移植性修复（CLI 面）已于批次一交付（18 源 + 6 提示词 + 4 测试；P1–P10 + P14 全链闭环、token 已消费）。
VSC 端（`thincoder-vscode/`）是同一产品的第二实现面、承载同一套工程模式机制——但 VSC 仓**零提及**可移植性，
A 家族（P1–P10 + P14）在 VSC 端的对位点仍带与 CLI 修复前同族的缺陷：

- **判据副本四处散落**（P10）：`src/advisor/repos.mjs:130/:151`（组件式 + 锚定式）+ `src/agent/execute-tools.mjs:108`（锚定式）
  + `src/agent-tools/verify.mjs:114`（松散回退）+ `src/agent-tools/advisor.mjs:219`（`docs/` 前缀）——
  嵌套布局漏判 / 项目约定不可诉 / 无声明面；
- **评审注入静默跳过**（P1/P2）：`src/advisor/messages.mjs:141-150` + `:236-246` METHODOLOGY 注入（空 catch）、
  `:152-164` 固定 `docs/design/README.md` 文档地图（缺失即 skip）；
- **Project Guide 注入缺失**（§9 真缺口）：`advisor-round1.md:7` 的 `## Project Guide (AGENTS.md)` 锚引用一个 VSC 从未注入的上下文段；
- **索引扩展名表窄**（P9）：`index-discover.mjs:8-9`（14 代码 + 5 文档）——无声明面、未列入不可见；
- **提示词面本仓引用**（P4–P7）：六档对应位与 CLI 修复前同族（树形状 / docs-TODO 假设 / check-doc-width 自指 / METHODOLOGY 指令）。

### 1.2 对位勘察结论（三态表——P1–P10 + P14 逐条）

| CLI 条 | CLI 批修法（语义源——`PORTABILITY（CLI 仓）`） | VSC 对位点（勘察实测） | 三态结论 |
|---|---|---|---|
| P1 | 文档地图声明键 + 显式降级句（project-context.mjs） | `src/advisor/messages.mjs:152-164`（固定路径 + 缺失 skip） | **需修** |
| P2 | 标准文档声明制 + 降级句（METHODOLOGY 注入移除） | `src/advisor/messages.mjs:141-150` · `:236-246`（注入 ×2、空 catch） | **需修** |
| P3 | 评审指令文本去 `METHODOLOGY.md`（已退役——归位 `docs/design/_archive/METHODOLOGY.md`（CLI 仓）） | `messages.mjs:168/:170/:172` · `src/prompts/advisor-design.md:5` | **需修** |
| P4 | advisor-design 提示词去本仓引用（EN 逐字 + CN 镜像） | EN `:9/:10/:18/:24` + CN `:20/:21/:39/:54` | **需修** |
| P5 | 纪律层去「docs/design/<TOPIC>.md 树形状」教条 | `discipline-engineering.md` EN `:45/:60/:74` + CN `:37` | **需修** |
| P6 | 纪律层去流程文件假设（docs/TODO 池 / CHANGELOG） | EN `:172/:202/:178/:182` + CN `:126/:132/:136` | **需修** |
| P7 | 纪律层去自指脚本（check-doc-width）要求 | EN `:216` + CN `:142-143` | **需修** |
| P8 | 非 git：索引 walk 回退 + 评审侧降级句 | 索引：`indexer.mjs:231-246` **已有 walk 回退（已对位）**；评审侧：无降级句 | **索引已对位；评审侧需修** |
| P9 | 索引扩表 / 声明 / 未列入可见 | `index-discover.mjs:8-9`（14/5 项）· 无声明面 · 无 unlisted | **需修** |
| P10 · P25 | 判据单一权威 + 声明面 + 全接线 | 副本 4 处（上 §1.1）+ 消费 2 处（`run-helpers.mjs:9/:71` · `advisor-async.mjs:32/:124`） | **需修** |
| P14 | `/eng` 无前提（删 METHODOLOGY 门禁） | `src/agent-tools/eng.mjs:64-80` enter 直接翻转——**无门禁（已对位）**；差：`:79` 文案 `in docs/` | **本体已对位；文案需修** |
| §9 缺口 | （CLI 有 `injectProjectGuide`——VSC 缺） | `advisor-round1.md:7` 锚 + 全 `src/` 无注入实现 | **需修（真缺口）** |

### 1.3 本批条目清单（三方一致锚——批次档 §2 = 本表 = 验收标准回指）

| 条目 | 来源 | 一句话 | 修法节 | 回指需求 |
|---|---|---|---|---|
| VP-1 | P1 | 文档地图：声明键 + 降级句（去固定路径静默跳过） | §3.3 | FR10 |
| VP-2 | P2 | 标准文档：声明制 + 降级句（METHODOLOGY 注入移除） | §3.3 | FR11 · FR10 |
| VP-3 | P3 | 指令文本去 METHODOLOGY（messages + advisor-design） | §3.3 · §4.4 | FR11 |
| VP-4 | P4 | advisor-design 双源去本仓引用（EN 4 处 + CN 4 处） | §4.4 | FR13 · FR10 |
| VP-5 | P5 | 纪律层去树形状教条（EN 3 处 + CN 1 处） | §4.4 | FR13 |
| VP-6 | P6 | 纪律层去流程文件假设（EN 4 处 + CN 3 处） | §4.4 | FR13 |
| VP-7 | P7 | 自指脚本全删（EN 1 处 + CN 2 处）＋ R24 行 EN/CN 对齐（附项——§2 D4） | §4.4 | FR13 |
| VP-8 | P8 | 评审侧无 git 降级句（索引侧已对位——差异登记） | §3.3 | FR15 |
| VP-9 | P9 | 索引扩展名扩表 / 声明并集 / 未列入可见 | §3.4 | FR10 |
| VP-10 | P10 · P25 | 判据单一权威 + 声明面 + 全接线（新建 VSC `conventions.mjs`） | §3.1–§3.2 | FR12 |
| VP-11 | P14 · P15 | 文案去 `in docs/`（eng 工具 + 门禁 hint + 拒绝文案；P14 本体已对位） | §3.5 | FR11 |
| VP-12 | §9 缺口 | Project Guide 注入补缺（review context——`advisor-round1.md` 锚落地） | §3.3 | FR10 |

### 1.4 对位差异如实列（不硬造镜像）

- **P14 本体**：VSC `eng` 工具 enter 路径无 METHODOLOGY 门禁与模板分支——CLI 的 `cmd-eng.mjs` 门禁缺陷在 VSC **无对位物**
  （VSC 无 `/eng` TUI 命令，工程模式经 `eng` 工具/面板切换）；本批只做同族文案（VP-11）。
- **P8 索引侧**：VSC `indexer.mjs:231-246` 无 git 时走全量 walk + per-file mtime 回退——非 git 索引行为**已有定义**
  （VSC 索引非 git 依赖型）；本批只补评审侧降级句（VP-8）。
- **R24 段（VP-7 附项）**：VSC EN `discipline-engineering.md:213` 仍指 `docs/design/METHODOLOGY.md`（该文件 VSC 仓从无、CLI 仓已退役），
  VSC CN `:139-140` 已改写为「纪律层 discipline-normal.md 判据节 + 退役注」形态——**EN/CN 漂移 + 退役文件指涉**；
  本批 EN 逐字对齐 CN 现形态（纳入理由见 §2 D4）。
- **`discipline-normal.md` 对位**（CLI P11＝批次三）：VSC `discipline-normal.md:13/:124` 的 docs 地图引用同族——**归批次三**（§9）。

### 1.5 归属判定与新建授权（留痕）

- **新建 VSC 对位档 = 父侧预授权**（批次档 §1：『`thincoder-vscode/docs/design/PORTABILITY.md` 如需新建——父侧预授权』；同款 = CLI 批 §1.5）。
- **新建理由**：机制跨面（注入 / 门禁 / 索引 / 提示词四面），无可归属的既有单档；批次三（B/C 剩余对位）将扩展本档。
- **需求层落点**：VSC 无 requirements 树——需求陈述并入 CLI `docs/requirements/PORTABILITY.md`（批次档 §1 三；同款 = VSC-GUARD / VSC-MIRROR 批）。

## 2. 方案选型对比（决策表）

### D1 判据权威载体（VP-10）

| # | 候选 | 判据（FR12：单一权威 + 声明可诉 + 不漏判 + VSC 体量） | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **新建 `src/conventions.mjs`（镜像 CLI 语义；W4 已迁核——现体 `thincoder-core/conventions.mjs`）** | 单一权威；声明面一处；消费方全部换源 | 与 CLI 并行实现（语义同源、文本自持） | **选定** |
| 2 | 修 `src/advisor/repos.mjs` 为权威、其余换源 | 少一个新档 | 分类权威藏于 advisor 子模块——门禁面（`agent/`）反向依赖 advisor/——层向倒挂 | 否决 |
| 3 | 各副本就地修（不建权威） | 零结构变更 | 四副本漂移已被本批实证——正是 P10 的教训 | 否决 |

### D2 声明面载体

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **`.thincoder/conventions.json`（与 CLI 同文件同 schema）** | 双端同项目共享一份声明；既定形态已立（CLI 批 §4.1） | 需定义 VSC 侧加载器（§4.1） | **选定** |
| 2 | VSC 自造键（`~/.thincoder/config.json` / 面板设置） | 复用现有配置面 | 双端声明分裂（同项目两处声明 = 漂移源）；全局配置文件非 per-project | 否决 |
| 3 | 不做声明面、仅降级提示 | 最小 | 不满足「项目自述/配置可诉」判据 | 否决 |

### D3 注入面结构（VP-1/2/8/12）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **新建 `src/advisor/project-context.mjs`（镜像 CLI 拆分）** | `messages.mjs` 净减；新档 ~190 行；与 CLI 结构同构 | 多一新档（D8 类结构操作，VSC 无既有登记债） | **选定** |
| 2 | 内联进 `messages.mjs` | 少一档 | messages 296 → ~420（超 300 软限 40%）；注入面与消息组装混杂 | 否决 |

### D4 提示词编辑范围（R24 行）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **纳入：EN 对齐 CN 现形态** | 退役文件指涉须修（P4–P7 同族）；消 VSC 内部双源漂移 | 相对 CLI 批「保留登记」口径多改 1 行——理由落档（本行） | **选定** |
| 2 | 沿用 CLI 批口径（保留 + 登记） | 与 CLI 批字面一致 | VSC EN 的指涉在本仓**不存在**（比 CLI 更失实）；CN 已改、EN 不改 = 双源分裂固化 | 否决 |

### D5 索引可见化形态（VP-9）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **`buildIndex` 返回 `unlistedExts` + 面板提示行** | 与 CLI `unlistedExts` 语义同源；UI 即用户可见通道 | 改动 3 档（index-discover / indexer / panel-index） | **选定** |
| 2 | 仅日志事件 | 低改动 | 面板用户不读日志——违反「降级可见」判据 | 否决 |

### D6 消息文案（降级句 / 提示 / 拒绝）

| # | 候选 | 判据评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **与 CLI 已交付文本同文（逐字）** | 文案与端无关（EN、面向任意项目）；评审上下文语汇双端一致 | 各端独立落笔，文本取自本档 §4.2/§4.3 定稿 | **选定** |
| 2 | VSC 自拟文案 | 「各端原文自持」字面最大化 | 无必要差异；与 CLI 评审注入语汇分裂 | 否决 |

## 3. 逐条修法

### 3.1 VSC 分类权威（VP-10——新建 `src/conventions.mjs`；W4 已迁核——现体 `thincoder-core/conventions.mjs`）

语义与 CLI `src/conventions.mjs`（224 行）同源：同词表、同优先级、同声明 schema、同降级可见纪律。（W4 已迁核——VSC 端现体 `thincoder-core/conventions.mjs`）

- `DEFAULT_CODE_PATHS = ["src"]` · `CONVENTIONS_REL_PATH = ".thincoder/conventions.json"` · `DEFAULT_CONVENTIONS`；
- 分类词表（优先级 = 代码段 > temp > 文档扩展名 > code）：`isTempPath(p)` / `isDocPath(p, conv)` / `isCodePath(p, conv)` / `classifyPath(p, conv)`；
- 段匹配（非锚定）、大小写不敏感、`/` 与 `\\` 通吃——`packages/foo/src/x.md` 判 code（嵌套漏判消除）;
- `loadConventions(cwd)`（按 root 缓存）/ `clearConventionsCache()`（测试 seam）；
- 损坏 / 类型错 → 默认 + `console.warn` + `logEvent("conventions:error", …)`（不崩溃、不静默——VSC `src/log.mjs` 既有 `logEvent`；W1 已迁核——现体 `thincoder-core/log.mjs:1`）。

### 3.2 门禁与接线（VP-10 续——全表）

| 调用点 | 现状 | 改法 |
|---|---|---|
| `src/advisor/repos.mjs:100-131` | `DOC_FILE`/`TEMP_FILE`/`isDocFile`/`isTempFile`/`isCodePath` 本地定义（导出给 4 消费方） | 谓词迁出至 `conventions.mjs`（**不留 re-export**——消费方全部就地换源）；本档剩 `findReviewRepos`/`collectRepoSnapshots`/`collectChangedFiles`/`isDocOnlyChange` |
| `src/advisor/repos.mjs:151` `isDocOnlyChange` | `/^src[\\/]/` 锚定 + `DOC_FILE.test` | `isCodePath(filePath, conv)` / `isDocPath(filePath, conv)`（`conv = loadConventions(cwd)`） |
| `src/agent/execute-tools.mjs:108` 父侧门禁 | `typeof p !== "string" \|\| /^src[\\/]/.test(p) \|\| !isDocFile(p)` | `typeof p !== "string" \|\| isCodePath(p, conv(agent.cwd))`——**保留非字符串保守拦截**（未知路径不放行） |
| `src/agent-tools/advisor.mjs:219` 设计评审文档校验 | `doc.startsWith("docs/")` 放行 + `isDocFile` | `!isDocPath(doc, conv(agent.cwd))` → invalid（`docs/` 前缀判据**退役**） |
| `src/agent-tools/verify.mjs:90-121` | 本地 `DOC_FILE`/`isDocFile` 副本 + `findProjectRoot`/`isUnderSrc` | 引用域已核（各仅链式一处引用）——**死代码全删**；`isDocOnlyChange(files, cwd)` 换源 |
| `src/agent/run-helpers.mjs:9` · `:68-71` `hasCodeMutations` | 经 `repos.mjs` `isCodePath` | import 换源（导出签名不变） |
| `src/agent-tools/advisor-async.mjs:32` · `:123-124` | 经 `repos.mjs` `isCodePath` | import 换源 |
| 消费方收口 | `src/agent/execute-tools.mjs:13` · `src/agent-tools/advisor.mjs:10` import `isDocFile` | 换源 `conventions.mjs` |
| 过期注释随批更正 | `src/advisor/main.mjs:6`（"repos.mjs still hosts the doc-file classifier"）· `repos.mjs:104-106/:127-128` · `verify.mjs:87` · `advisor-async.mjs:123` | 换源后指涉失实——随批改正 |

### 3.3 评审注入面（VP-1 · VP-2 · VP-3 · VP-8 · VP-12——新建 `src/advisor/project-context.mjs`）

镜像 CLI `src/advisor/project-context.mjs`（195 行）语义。导出面：

| 导出 | 语义 |
|---|---|
| `NO_GUIDE_NOTICE` / `NO_DOC_MAP_NOTICE` / `NO_STANDARDS_NOTICE` / `NO_GIT_NOTICE` | 降级句常量（逐字见 §4.2） |
| `findProjectRoot(cwd, scopeFiles)` | 从评审范围文件向上走查 AGENTS.md（cwd 为界、NEAREST 胜）→ root 或 null |
| `injectProjectGuide(agent, parts, scopeFiles)` | 注入 `## Project Guide (AGENTS.md)` 段（预算 = `providerSpec(agent.provider).context` 的 5%，下限 8192 字符；缺失 → NO_GUIDE_NOTICE） |
| `injectDocumentMap(agent, parts, root)` | 声明 `advisor.docMap` 优先；探测 fallback `docs/README.md` → `docs/design/README.md`；皆无 → NO_DOC_MAP_NOTICE |
| `injectProjectStandards(agent, parts, root)` | 仅当声明 `advisor.standardsDoc` 时注入 `## Project Standards`；未声明 → NO_STANDARDS_NOTICE |

`messages.mjs` 改造（对位 CLI 注入序列）：

- 函数开头（`parts` 初始化后、design 早退前）：`injectProjectGuide(agent, parts, [...pathList, ...docList])`——**两路径共用**（design 与 code）；
- design 分支：`:141-150` METHODOLOGY 注入删除 → engineering 时 `injectProjectStandards`；`:152-164` 内联地图 → `injectDocumentMap`；
  `:103` repos 为空时推入 NO_GIT_NOTICE（`## Design Review` 后）；Instructions `:166-172` 改写（§4.3）；
- code 路径：`:236-246` METHODOLOGY 注入删除 → engineering 时 `injectProjectStandards`；Review Criteria 后补 requirement-fit 句（guideRoot 真值时）；
  Instructions `:255` → guideRoot 分支句（§4.3）。

### 3.4 索引扩展名与可见化（VP-9）

- **扩表**（`index-discover.mjs:8-9`）：`CODE_EXTS` 增至与 CLI 表对齐（26 项——清单见 §4.5）；`DOC_EXTS` 增补（`.mdx/.org/.wiki/.tex`）；
- **声明并集**：`index.codeExtensions` / `index.docExtensions`（并集生效；归一 `.ext` 小写）——判定函数收 `conv` 参数
  （`isIndexableFile(filePath, conv)` / `shouldIndexFile(relPath, conv)` / `kindFor(filePath, conv)`；缺省 `DEFAULT_CONVENTIONS`）；
  `discoverFiles(cwd, signal, opts)` / `discoverFilesUnder` 内部 `loadConventions(cwd)`；
- **可见化**：`discoverFiles(…, { collectUnlisted })` 收集未列入扩展名（`Map ext→count`，样本上限 20 个扩展名）；
  `buildIndex` 返回 `{ files, chunks, unlistedExts }`；`panel-index.mjs` 成功消息追加提示行（§4.3 逐字）；
  `logEvent("index:unlisted", { count, exts })`；
- 非 git 行为：**零改动**（`indexer.mjs:231-246` 既有回退——已对位）。

### 3.5 文案面（VP-11 · VP-3 收尾）

- `src/agent/execute-tools.mjs:110` 门禁 hint → §4.3 逐字（含未声明时声明指路）；
- `src/agent-tools/eng.mjs:79` → §4.3 逐字；
- `src/agent-tools/advisor.mjs:216-223` 拒绝文案 + 注释 → §4.3 逐字；
- `src/agent/execute-tools.mjs:103` 注释（"under src/ … needs a live design slot"）随换源更正。

### 3.6 提示词六档（VP-3 · VP-4 · VP-5 · VP-6 · VP-7——逐字见 §4.4）

六档 = 三档 × 双源（EN `src/prompts/` ↔ CN `docs/design/prompts/`）：`discipline-engineering.md` · `advisor-design.md` · `persona-eng-designer.md`。
**红线（不得触碰）**：跨仓逐字锚（`test/prompts-mirror-anchors.test.mjs` 断言面——A1–A12 / D1–D7 表 / 六段自写 / batch_segment 手段句 /
执行者拒收 / 三方条目一致 / Action 四值句 / 修正轮⇄批准 bullet / common 标题组）——本批编辑点已逐一避让（§4.4 编辑点表与本批 11 条均不在锚表内）。
端特有段（R14 池规则等）原地保留。

## 4. 接口契约

### 4.1 `src/conventions.mjs`（VSC——API 表；W4 已迁核——现体 `thincoder-core/conventions.mjs`）

| 导出 | 语义 |
|---|---|
| `DEFAULT_CODE_PATHS` | `["src"]`（数据常量——可覆盖） |
| `CONVENTIONS_REL_PATH` | `".thincoder/conventions.json"` |
| `DEFAULT_CONVENTIONS` | 全默认约定对象 |
| `loadConventions(cwd)` | 读声明 → 归一（缓存按 root）；损坏/类型错 → 默认 + warn + logEvent |
| `clearConventionsCache()` | 缓存清理（测试 seam） |
| `isTempPath(p)` / `isDocPath(p, conv)` / `isCodePath(p, conv)` / `classifyPath(p, conv)` | 分类裁判（唯一实现） |

声明 schema（与 CLI 同文件同 schema——`.thincoder/conventions.json`）：

```json
{
  "codePaths": ["src"],
  "index": { "codeExtensions": [], "docExtensions": [] },
  "advisor": { "docMap": "", "standardsDoc": "" }
}
```

- 全部键可选；缺失 / 空串 / 类型错 → 回退默认；`codePaths` 声明即**替换**默认；`index.*Extensions` **追加**（并集）；
  `advisor.docMap` / `advisor.standardsDoc` = 项目根相对路径。

### 4.2 降级句逐字（`project-context.mjs` 常量——与 CLI 已交付文本同文）

- 无项目指南：`(No AGENTS.md found — neither at the working directory root nor in any review-scope subdirectory. Judge the user's requirements from the conversation background, and say so explicitly if the requirements are unclear.)`
- 无文档地图：`(No document map found under the project root, and none is declared — the Document ownership criterion is degraded: check placement against the Project Guide where present, and state the limitation in your findings.)`
- 无标准文档：`(No project standards document was declared — judge methodology compliance from the Project Guide (when present) and the review criteria above; state the limitation in your findings.)`
- 无 git：`(No git repository detected — change-set context is unavailable; read the review-scope files directly.)`

### 4.3 消息与 UI 文案逐字

**评审指令（`messages.mjs` design 分支）**：

- `1. Read every document in the Documents to Review list in full — review ONLY those files. Read METHODOLOGY.md to understand the project's standards.` →
  `1. Read every document in the Documents to Review list in full — review ONLY those files.`
- `1. Read the design document fully. Read METHODOLOGY.md to understand the project's standards.` → `1. Read the design document fully.`
- `methodology compliance (does it follow the project's METHODOLOGY.md?)` → `methodology compliance (does it follow the project's standards as provided?)`
- 追加句（design）：`3. If the ## Project Guide (AGENTS.md) section above is present, also check requirement fit: does the design match what the requirements documents it points to actually ask for?`
- **落笔边界（design 分支编号）**：追加句插为第 `3.` 项——原 `3. Do NOT run git diff …`（`src/advisor/messages.mjs:173`）顺延为 `4.`、原 `4.` 顺延为 `5.`（CLI 已交付口径——`src/advisor/messages.mjs:175`（CLI 仓））。

**评审指令（`messages.mjs` code 路径）**：

- `2. Read \`AGENTS.md\` / design docs only if they exist (check once; do not re-probe with multiple patterns).` →
  guideRoot 真值：`2. The \`## Project Guide (AGENTS.md)\` section above maps the project — read the requirements/design documents it points to (they are the primary reference for requirement-fit). Use \`read\` to load those documents.`；
  guideRoot 假值：`2. No AGENTS.md was found at the project root — rely on the conversation background for the user's requirements. If the requirements are unclear, state so explicitly.`
- Review Criteria 后追加（guideRoot 真值时）：`Additional criterion: **requirement fit** — does the implementation match what the requirements documents (referenced by the Project Guide above) actually ask for?`

**门禁 hint（`execute-tools.mjs:110`）**：`Engineering mode: write the design document first（location per your project's document conventions）, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.`
未声明约定且默认命中时追加：` — this path was classified as product code by the default conventions (code paths: src); declare project conventions in .thincoder/conventions.json to adjust.`
**落笔边界（门禁前缀）**：VSC 为单串形态（无外层 Error 包装）——保留前缀 `Error: engineering design gate — `，其后段替换为上述新句；整串 = 前缀 + 新句（删前缀即失去 error 形态——CLI 对位 = `hint` 字段 + 外层包装 `Error: design review required before any file modification. `，`src/agent/dispatch.mjs:213`（CLI 仓） · `:328`）。

**eng 工具消息（`eng.mjs:79`）**——逐字（尾段 `Cleared N expired design tokens…` / 冲突提示保持零改）：

`Engineering mode activated. Design-before-code enforced: write a design document first (location per your project's document conventions), run advisor with type='design', get user approval, then implement via eng-coder subagents.`

**advisor 文档门禁拒绝文案（`src/agent-tools/advisor.mjs:223`）**：`Advisor: design review documents must be documentation files (per the project's conventions). Invalid: <invalid list>`

**索引可见化提示行（`panel-index.mjs`）**：`Index built: N files, M chunks. Semantic search is now active.` →
（unlisted 非空时追加）` K file(s) skipped — extensions not indexed: .xyz, …; declare index.codeExtensions in .thincoder/conventions.json to include them.`

### 4.4 提示词编辑点与逐字目标文本（VSC 定稿——coder 机械落笔依据）

> 编辑点行号 as-of 2026-09-11 实测。CN 档 = 中文权威；EN 档 = 英文落地；同句处注明「两档同句」= 两侧逐字同改。

**（a）`src/prompts/discipline-engineering.md`（EN）**

| 行 | 旧 | 新 |
|---|---|---|
| :45 | `板块设计文档（docs/design/<TOPIC>.md——一板块一档、功能点不独立成文）按**三节 + 变更记录**组织；` | `板块设计文档（一板块一档、功能点不独立成文——落点按项目文档约定；本产品自研仓 = docs/design/<TOPIC>.md）按**三节 + 变更记录**组织；` |
| :60 | `（查 docs/design/README.md 地图——已有则更新不新建）` | `（查项目文档地图——本产品自研仓 = docs/design/README.md；已有则更新不新建）` |
| :74 | `（对应板块 docs/design/<TOPIC>.md）` | `（落点按项目文档约定；本产品自研仓 = 对应板块的 docs/design/<TOPIC>.md）` |
| :172 · :202 | `— parent-side maintained files (docs/TODO.md, CHANGELOG.md, checklist family) must not be listed;` | `— the project's own process files (requirement pool / changelog / checklist family — 本产品自研仓 = docs/TODO.md / CHANGELOG.md / checklist) must not be listed;` |
| :178 | `and the project docs/TODO.md「Requirement Pool」group first;`（句内部替换） | `and the project's requirement-pool record（池文件按项目约定；本产品自研仓 = docs/TODO.md）「Requirement Pool」group first;` |
| :182 | `技术待办仍走 \`docs/TODO.md\` 技术组——不混池；` | `技术待办仍走项目技术待办区（本产品自研仓 = docs/TODO.md 技术组）——不混池；` |
| :213 | `动机与完整机制见 \`docs/design/METHODOLOGY.md\` R24 节。` | `动机与完整机制见纪律层 \`src/prompts/discipline-normal.md\` 代码结构判据节（原 \`docs/design/METHODOLOGY.md\`（CLI 侧）已于 2026-09-10 退役入 \`_archive/\`）。`（EN 逐字对齐 CN 现形态——§2 D4） |
| :216 | `检查：\`node scripts/check-doc-width.mjs\`（扫 docs/design/ 无 >300 单行）。判据权威源：\`docs/design/README.md\` 归属规则 6。` | `检查：按项目自身的文档规范核验（通用判据：无 >300 字符单行、正常换行与分隔；项目另有声明时以项目为准）。` |

**（b）`docs/design/prompts/discipline-engineering.md`（CN）**

| 行 | 旧 | 新 |
|---|---|---|
| :37 | 同 EN :45 旧（两档同句） | 同 EN :45 新 |
| :126 | `——父侧维护文件（docs/TODO.md、CHANGELOG.md、checklist 族）不得列入；` | `——项目自身的流程文件（需求池 / 变更记录 / checklist 族——本产品自研仓 = docs/TODO.md / CHANGELOG.md / checklist）不得列入；` |
| :132 | 同 EN :178 旧（英文原句） | 同 EN :178 新 |
| :136 | 同 EN :182 旧（两档同句） | 同 EN :182 新 |
| :139-140 | （R24 段——保持现形态；EN 对齐本侧——本档不动） | —（零改） |
| :142-143 | `检查：\`node scripts/check-doc-width.mjs\`（扫 docs/design + docs/requirements + docs/batches 无 >300 单行；同时跑 V1 段引用 / V2 计数一致性校验——新增违规阻断、存量入基线报告）。判据权威源：\`docs/design/README.md\` 归属规则 6。`（从 `检查：` 起的整句） | `检查：按项目自身的文档规范核验（通用判据：无 >300 字符单行、正常换行与分隔；项目另有声明时以项目为准）。` |

**（c）`src/prompts/advisor-design.md`（EN）**

- `:5` — 旧：`3. **Methodology compliance** — Does it follow the project's METHODOLOGY.md? Does it respect the 4-step workflow?`
  新：`3. **Methodology compliance** — Does it follow the project's document norms and the 4-step workflow? (The project's methodology backbone lives in the discipline-layer prompts \`discipline-engineering.md\` / \`discipline-normal.md\`; the former METHODOLOGY.md is retired.)`
- `:9` — 旧：`(per the document map in \`docs/design/README.md\`)`（句内部替换）
  新：`(per the project's document map, when the review context provides one)`
- `:10` — 旧：`Tier authority: the code-structure section of the project's METHODOLOGY.md.`（句尾替换）
  新：`Tier authority: the code-structure criteria stated in this bullet.`
- `:18` — 旧：`(e.g. \`docs/design/AGENT-LOOP.md:180\`)`
  新：`(e.g. \`path/to/file.md:42\`)`（照 CLI EN 已交付文本）
- `:24` — 旧：`- Read the design document fully. Read METHODOLOGY.md to understand the project's standards.`
  新：`- Read the design document fully. Judge against the Project Guide (when present in the review context) and the review criteria in this prompt — do not assume any particular project files.`

**（d）`docs/design/prompts/advisor-design.md`（CN）**

| 行 | 旧 | 新 |
|---|---|---|
| :16 | （已为退役注形态——本档不动） | —（零改） |
| :20 | `（按 \`docs/design/README.md\` 本端文档地图）` | `（按项目文档地图——当评审上下文提供时；本产品自研仓 = docs/design/README.md）` |
| :21 | `档位权威 = 纪律层 \`discipline-normal.md\` 代码结构判据节（原 METHODOLOGY.md 已退役）。` | `档位权威 = 本条目陈述的代码结构判据。` |
| :39 | `（如 \`docs/design/AGENT-LOOP.md:180\`）` | `（如 \`path/to/file.md:42\`）` |
| :54 | `完整读设计文档。读纪律层提示词（\`discipline-engineering.md\` / \`discipline-normal.md\`）与 \`docs/design/README.md\` 了解本端项目标准。` | `完整读设计文档。按评审上下文中提供的 Project Guide（存在时）与本提示词的评审标准判断——不假定任何具体项目文件。` |

**（e）`src/prompts/persona-eng-designer.md`（EN）**

| 行 | 旧 | 新 |
|---|---|---|
| :13 | `Your write domain = \`docs/\` **minus \`docs/design/prompts/\`**（提示词中文模板也是提示词文件）.` | `Your write domain = the project's requirements/design documents（落点按项目文档约定；本产品自研仓 = docs/，扣除 docs/design/prompts/——提示词文件（含中文模板）是产品代码，不归你）。`（**已交付**——与 CLI 已交付文本同文） |
| :27 | `advance \`docs/TODO.md\` status when merging requirements`（句内部替换） | **as-of 已失效**（旧串实施时已不存在——该行先经「2026-09-11 归属修订」（POOL-LEDGER 批）改写为归主 agent 句）；**实际交付**（按 CLI 同源落笔——归属修订后现文）：`**todo 状态推进**（记录 + 状态推进 + 物理落笔）归 **主 agent**（2026-09-11 归属修订）——本角色只做需求档条文修订，不触碰项目台账档。` |

**（f）`docs/design/prompts/persona-eng-designer.md`（CN）**

| 行 | 旧 | 新 |
|---|---|---|
| :13 | `写域 = \`docs/\` **扣除 \`docs/design/prompts/\`**（提示词中文模板也是提示词文件，不归你）。` | `写域 = 项目的需求档 / 设计档（落点按项目文档约定；本产品自研仓 = docs/，扣除 docs/design/prompts/——提示词文件（含中文模板）是产品代码，不归你）。`（**已交付**——与 CLI 已交付文本同文） |
| :25 | `并入需求时同步推进 \`docs/TODO.md\``（句内部替换） | **as-of 已失效**（旧串实施时已不存在——该行先经「2026-09-11 归属修订」（POOL-LEDGER 批）改写为归主 agent 句）；**实际交付**（按 CLI 同源落笔——归属修订后现文）：`**todo 状态推进（记录 + 状态推进 + 物理落笔）归主 agent**（2026-09-11 归属修订——本角色只做需求档条文修订，不触碰台账档）。` |

> 落地后跑 `prompts-mirror-anchors.test.mjs` + `prompts-async-guidance.test.mjs` + `doc-consistency.test.mjs` 全绿（红线锚零损——§3.6）。

### 4.5 索引扩展名增补清单（与 CLI 表对齐）

- `CODE_EXTS` +：`.cjs` `.mts` `.cts` `.dart` `.lua` `.cs` `.fs` `.fsx` `.clj` `.cljs` `.ex` `.exs` `.erl` `.hrl` `.scala` `.pl` `.pm` `.r` `.jl` `.zig` `.groovy` `.ps1` `.proto` `.graphql` `.tf` `.hcl`；
- `DOC_EXTS` +：`.mdx` `.org` `.wiki` `.tex`；
- 未知扩展名经声明可入索引（并集）；`kindFor` 对声明新增项按所在表判 code/doc。

## 5. 受影响文件全清单

> 行数 as-of 2026-09-11 实测（口径 = `split("\n").length` 含末行）。纯 `.md` 豁免行数档；新档 ≤300。

**VSC 源（面 I–IV）**

| 文件 | 性质 | 当前行数 | 预计增量 |
|---|---|---|---|
| `src/conventions.mjs`（W4 已迁核——现体 `thincoder-core/conventions.mjs`） | **新增** | — | ~220（300 内） |
| `src/advisor/project-context.mjs` | **新增** | — | ~190（300 内） |
| `src/advisor/messages.mjs` | 修改 | 296 | 净减 ~30（内联迁出 + 调用） |
| `src/advisor/repos.mjs` | 修改 | 156 | 净减 ~45（谓词迁出） |
| `src/advisor/main.mjs` | 修改 | 319 | ±1（过期注释 :6） |
| `src/agent/execute-tools.mjs` | 修改 | 483 | ≤±8（换源 + hint + 注释） |
| `src/agent/run-helpers.mjs` | 修改 | 297 | ≤±3（import 换源） |
| `src/agent-tools/advisor.mjs` | 修改 | 325 | ≤±8（校验换源 + 文案 + 注释） |
| `src/agent-tools/advisor-async.mjs` | 修改 | 493 | ≤±3（import 换源 + 注释——**近 500 硬限，净零方向**） |
| `src/agent-tools/verify.mjs` | 修改 | 335 | 净减 ~15（本地谓词/死代码删 + 换源） |
| `src/agent-tools/eng.mjs` | 修改 | 106 | ±2（文案 :79） |
| `src/index-discover.mjs` | 修改 | 88 | ≤+30（扩表 + 声明并集 + unlisted 收集） |
| `src/indexer.mjs` | 修改 | 445 | ≤+18（unlisted 统计 + 返回 + 事件） |
| `src/extension/panel-index.mjs` | 修改 | 178 | ≤+6（提示行） |

**VSC 提示词（面 V——六档）**

| 文件 | 性质 | 当前行数 | 预计增量 |
|---|---|---|---|
| `src/prompts/discipline-engineering.md` | 修改 | 222 | ≤±10 |
| `docs/design/prompts/discipline-engineering.md` | 修改 | 150 | ≤±10 |
| `src/prompts/advisor-design.md` | 修改 | 42 | ≤±6 |
| `docs/design/prompts/advisor-design.md` | 修改 | 70 | ≤±6 |
| `src/prompts/persona-eng-designer.md` | 修改 | 57 | ≤±4 |
| `docs/design/prompts/persona-eng-designer.md` | 修改 | 54 | ≤±4 |

**VSC 测试面**

| 文件 | 性质 | 预计规模 |
|---|---|---|
| `test/portability-vsc-classification.test.mjs` | **新增** | ~150（T-V01–T-V06） |
| `test/portability-vsc-advisor-context.test.mjs` | **新增** | ~150（T-V11–T-V13 在役；T-V07–T-V10 已退场——整删，删除记录 = `TESTING.md` §8.1（`:137`–`:140`）） |
| `test/portability-vsc-index.test.mjs` | **新增** | ~130（T-V14–T-V16 + T-V19 在役；T-V17/T-V18 已退场——整删，删除记录 = `TESTING.md` §8.1（`:143`–`:144`）） |
| `test/prompts-mirror-anchors.test.mjs` 等既有档 | 回归（预计零改） | 0（编辑点已避让锚表；若实测红→按本设计语义改字面并登记） |

**文档面（本批产物 + 父侧维护）**：

- VSC 本档（新增——立即在 `docs/design/README.md` 登记：**父侧**）；
- CLI `docs/design/PORTABILITY.md` 补「批次二·VSC 镜像面」节（**本批产物——回指不复制**）；
- CLI `docs/requirements/PORTABILITY.md` 补批次二范围行（**本批产物**）；
- 父侧维护面：VSC `docs/design/README.md`（新板块登记 + 镜像差异表 #3/#4 对照更新）· VSC `docs/TODO.md`（登记）· CLI `docs/TODO.md`（核销）· CHANGELOG——产品级台账已退役（台账单仓化：现体 = 仓根 `docs/TODO.md`）。

**实现面拆分建议（供父侧 spawn）**：面 I（分类核心——conventions + 5 接线）→ 面 II（注入——project-context + messages）· 面 III（索引）· 面 IV（提示词六档）各自独立；
面 II/III/IV 的 conventions 依赖面 `dependsOn` 面 I（共用新档）。文件域不相交。

## 6. 用例表

> 回指列 = VP 条目号；正常/边界/错误三态覆盖。

| # | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|
| T-V01 | 正常 | 无声明；`src/x.mjs` / `docs/a.md` / `tmp-x.mjs` | code / doc / temp | VP-10 |
| T-V02 | **边界（原缺陷反证）** | `packages/foo/src/x.md`（嵌套布局） | code（不再当文档绕过门禁） | VP-10 |
| T-V03 | 边界 | 声明 `codePaths:["lib"]`；`lib/a.md` / `src/a.md` | code / doc（声明替换默认） | VP-10 |
| T-V04 | 错误 | `conventions.json` 非法 JSON / 类型错 | 回退默认 + warn + 不抛；`clearConventionsCache()` 后重读生效 | VP-10 |
| T-V05 | 正常（门禁） | 工程模式 + 无令牌 + 写 `src/x.mjs`（`execute-tools` 门） | 拒绝；hint 无 `in docs/`、含声明指路 | VP-10 · VP-11 |
| T-V06 | 边界（门禁） | 同上 + 写 `packages/foo/src/x.md` / 非字符串路径 | 均**拒绝**（嵌套反证 + 保守拦截保持） | VP-10 |
| T-V07 | 正常（注入） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:137`）） | VP-12 · VP-1 |
| T-V08 | 边界（缺料） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:138`）） | VP-1 · VP-2 · VP-3 · VP-12 |
| T-V09 | 正常（声明） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:139`）） | VP-1 · VP-2 |
| T-V10 | 正常（非 git） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:140`）） | VP-8 |
| T-V11 | 正常（校验） | design 评审传 `documents:["docs/design/x.md"]` | 通过（isDocPath） | VP-10 |
| T-V12 | 边界（校验） | 传 `["src/prompts/x.md"]` / `["x.mjs"]` | 拒绝（非文档——`docs/` 前缀不再放行） | VP-10 |
| T-V13 | 错误（文案） | advisor 文档门禁拒绝 + eng 工具 enter | 两条文案均无 `in docs/`；与 §4.3 逐字一致 | VP-11 |
| T-V14 | 正常（扩展名） | `.dart`/`.lua`/`.cs`/`.org` 文件 | 默认可索引 | VP-9 |
| T-V15 | 边界（声明） | `index.codeExtensions:[".xyz"]` | `.xyz` 入索引；未列入 → `unlistedExts` 计数 | VP-9 |
| T-V16 | 正常（可见化） | 含未索引扩展名文件的构建 | `buildIndex` 返回 `unlistedExts`；面板消息含提示行 | VP-9 |
| T-V17 | 正常（提示词） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:143`）） | VP-3–VP-7 |
| T-V18 | 边界（R24 对齐） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:144`）） | VP-7 |
| T-V19 | 正常（索引回归） | 既有 `needsRebuild` 路径 | 行为零回归（非 git 回退保持） | VP-9（回归锁） |

## 7. 验收标准（AC-V01–AC-V14——逐条回指）

| # | 验收标准（机器可验证） | 回指 |
|---|---|---|
| AC-V01 | 判据面退场（随 AC-V01 静态面整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:142`））；需求本体（唯一实现 = `src/conventions.mjs`——副本 = 0；W4 已迁核——现体 `thincoder-core/conventions.mjs`）不变 | VP-10 · FR12 |
| AC-V02 | T-V01–T-V04 全绿；`packages/foo/src/x.md` 判 code（嵌套漏判消除） | VP-10 · FR12 |
| AC-V03 | T-V05–T-V06 全绿（门禁拒绝保持 + 非字符串保守拦截保持 + 声明后行为切换） | VP-10 · FR12 |
| AC-V04 | 判据面已退场（T-V07–T-V09 均整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:137`–`:139`）） | VP-1 · VP-2 · VP-3 · VP-12 · FR10/11 |
| AC-V05 | 判据面已退场（T-V10 整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:140`）） | VP-8 · FR15 |
| AC-V06 | T-V14–T-V16 全绿；`unlistedExts` 字段与面板提示行存在 | VP-9 · FR10 |
| AC-V07 | T-V17 已退场（整删——删除记录 = `TESTING.md` §8.1（`:143`））；六档编辑面内指令性引用 = 0（`docs/design/README.md` / `docs/design/<TOPIC>.md`——「本产品自研仓 =」标注形态除外）；`check-doc-width` 零指涉（全形态） | VP-3–VP-7 · FR13 |
| AC-V08 | 既有提示词锚测试全绿（`prompts-mirror-anchors` + `prompts-async-guidance` + `doc-consistency`）；红线锚句逐一在位 | VP-3–VP-7 · FR13 |
| AC-V09 | T-V11–T-V13 全绿；门禁/工具文案 `in docs/` grep 0（VSC `src/`） | VP-10 · VP-11 |
| AC-V10 | `eng` 工具 enter 提示含新文案；OFF 语义零回归（`eng-settlement` 回归绿） | VP-11 · FR11 |
| AC-V11 | `messages.mjs` 拆分兑现：`project-context.mjs` 在位、`messages.mjs` ≤500 且较 296 净减 | VP-1 · VP-12 |
| AC-V12 | 批级机检：`node test/run-fast.mjs` 全绿（VSC）＋ `node scripts/check-doc-width.mjs` 新增超宽 0；全部受改文件 ≤500、新档 ≤300 | 全批 |
| AC-V13 | 需求层：CLI `docs/requirements/PORTABILITY.md`（CLI 仓）含批次二范围行（T-V20 已退场——设计期编号；现态不在册——grep） | 全批 |
| AC-V14 | 三方一致：批次档 §2 条目 = 本档 §1.3 = AC 回指清单（逐条比对 0 差异） | 全批 |

## 8. 关键决策记录

- D1–D6 见 §2（各含被否决备选与理由）；
- 附加决策：① 谓词迁出**不设 re-export**（消费方全部换源——与 CLI 批裁决同构）；② `verify.mjs` 死代码随批清理（引用域已核——铁律 2）；
  ③ R24 行 EN 对齐 CN（§2 D4 理由）；④ 消息文案与 CLI 同文（§2 D6）；⑤ 过期注释随批更正（§3.2 表末行）；
  ⑥ VSC 不建本仓自用 `.thincoder/conventions.json`（默认判据对本仓即正确——与 CLI 批 §8③ 同口径）。
- **与既有纪律核对**：双端镜像纪律——各端独立实现、语义同源（§1 头注 + §2 D6）；D1 写权矩阵——提示词 = 主 agent 内容权 + coder 落笔（§4.4 = 逐字依据）；
  D2——判据单一权威 + 本档不重述 FR 正文（指针）；D5——本批不触他链在途档（VSC `ENGINEERING-MODE.md` / `ADVISOR-CONVERGENCE.md` 零触碰）。

## 9. 边界（本批不做）

- **P11–P13 / P16–P28 的 VSC 对位**（`discipline-normal.md:13/:124` 的 docs 地图引用、`persona-engineering.md` 同类、等）——批次三；
- CLI 侧 B/C 剩余（批次三——`PORTABILITY（CLI 仓）` §9）；
- VSC 端其它待办（另批勘察归批——批次档 §1 三）；
- **不触碰**：跨仓逐字锚（§3.6）· 端特有段（R14 池规则等）· 他链在途档（VSC `ENGINEERING-MODE.md` §… 本体 / `ADVISOR-CONVERGENCE.md` §13.10/§14）· CLI 批次一已收口产物（只读引用）；
- VSC `docs/design/README.md` 登记与镜像差异表更新 = 父侧（§5 文档面）。

## 10. 待定项（open）

- **open-1**：VSC 本仓是否补 `.thincoder/conventions.json`（dogfood；当前默认即正确）——父侧酌定（CLI 批 open-1 同款）。
- **open-2**：`advisor-round1.md` / `round2/3` 的 CN 档对应位（system prompt 提示词——本批只动了锚句所指的注入实现，未改 round 提示词文本）——如需同步评估归批次三。
- **open-3**：R24 行是否加「本产品自研仓 =」标注形态——本批按 CLI 保留口径对齐 CN 现形态（§2 D4）；标注化 = 父侧/后续批裁定。

## 变更记录

- 2026-09-11：建档（批次二 = VSC 对位镜像——三态对位表 + 逐条修法 + 逐字文本 + 受影响文件 + 用例 + AC）。
- 2026-09-11（修正轮——设计评审轮次 1 后）：§4.4(c) `:18` 行改 EN 形态（照 CLI EN 已交付文本）；§4.4(a) `:213` 新文本补「（CLI 侧）」——EN 与 CN 现形态逐字同文（选项①：保 §1.4/T-V18〔已退场——整删；删除记录 = `TESTING.md` §8.1〕断言，不降级）；§4.3 补两条落笔边界（门禁前缀保留 / design 分支编号顺延）。
- 2026-09-11（实施后 as-of 回修——承批次档 §5 偏差披露 #1）：§4.4(e)/(f) 修为实际交付口径——:13 两行（写域句）已交付（与 CLI 已交付文本同文）；:27/:25 两行（todo 句）as-of 已失效（旧串经「2026-09-11 归属修订」（POOL-LEDGER 批）改写），实际交付 = 按 CLI 同源落笔（归属修订后现文——EN `不触碰项目台账档` / CN `不触碰台账档`）。
