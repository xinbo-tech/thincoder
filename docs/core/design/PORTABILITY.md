# 可移植性（PORTABILITY）· 设计

> 板块 = **可移植性**——工程模式与机检机制面向**任意项目**时不得静默失效的机制面：
> 代码 / 文档分类裁判 · 项目声明面 · 降级可见 · 非 git 索引回退 · `/eng` 无前提开启。
> 需求侧 = `thincoder-cli/docs/requirements/PORTABILITY.md`（CLI 侧**未迁**——FR10–FR15 组）；工作流面（工程模式本体）= `thincoder-cli/docs/design/ENGINEERING-MODE.md`（CLI 侧**未迁**）。
> 双端对位 = `thincoder-vscode/docs/design/PORTABILITY.md`（VSC 端镜像面**已并入（批 6）**——§3.6 坐标 + §5 测试面；旧档一字未改、留参照历史）。
> 建档：2026-09-15（**B 式迁移轮 · 第 2 批**——`thincoder-cli/docs/design/PORTABILITY.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与问题面

工程模式是**面向任意项目的产品功能**，但早期实现把本产品自研仓的约定（文档地图、`METHODOLOGY.md`、`docs/design/<TOPIC>.md` 树形状、`^src/` 判据、自指检查脚本）当成了普适事实，在用户项目上产生三类**静默失效**（用户不可见、不可修）：

| # | 失效类 | 现象 |
|---|---|---|
| 1 | **评审维度无声消失** | 文档地图 / 项目标准探不到即静默跳过，评审仍按该维度打分 |
| 2 | **门禁静默绕过** | 嵌套布局下 `packages/foo/src/*.md` 被当文档，绕过设计门禁 |
| 3 | **索引静默为空** | 非 git 项目代码 / 文档索引全空；白名单外扩展名不可检索 |

另有一枚活 bug（已修）：`/eng` 门禁要求 `METHODOLOGY.md`，而「从模板创建」指向已不存在的模板——选项必炸。

**本板块的机制目标**：上述每一类都改为**有判据、可声明、缺失即显式降级**，且判据**只有一份实现**。

## 2. 实现单一权威（现状路径 · as-of 2026-09-15 实核）

**分类裁判单源**：`thincoder-core/conventions.mjs` = 全产品唯一的代码 / 文档 / 临时文件分类裁判；门禁与守卫一律经它判定（自带的 `^src/` 锚定式、`docs/` 前缀式、组件式正则副本已全部退役，**不设 re-export**——只留一个导入路径）。

| 面 | 落点（实核） | 状态 |
|---|---|---|
| 分类裁判 + 声明面加载 | `thincoder-core/conventions.mjs:82`（`isCodePath`）· `:88`（`isDocPath`）· `:73`（`classifyPath`）· `:40`（`isTempPath`）· `:191`（`loadConventions`） | 在位 |
| 默认判据（数据常量） | `thincoder-core/conventions.mjs:28`（`DEFAULT_CODE_PATHS` = `["src"]`） | 在位 |
| 声明档相对路径 | `thincoder-core/conventions.mjs:31`（`CONVENTIONS_REL_PATH`） | 在位 |
| 父侧设计门禁 | `thincoder-core/agent/dispatch.mjs:204`（保守拦截 `typeof p !== "string"` 分支保留） | 换源 |
| 设计评审文档门禁 | `thincoder-core/agent-tools/advisor.mjs:119` | 换源 |
| 变更集判据 | `thincoder-core/advisor/repos.mjs:122`（`hasCodeMutations`）· `:146`（`isDocOnlyChange`） | 换源 |
| 评审收敛侧判据 | `thincoder-core/agent-tools/advisor-settle.mjs:71` | 换源（本地实现已删） |
| verify 快路径 | `thincoder-core/agent-tools/verify.mjs:180`（纯文档变更）· `:191`（代码文件集） | 换源（失引 helper 已清） |
| 项目上下文发现与注入 | `thincoder-core/advisor/project-context.mjs`（`messages.mjs` 拆分产物） | 在位 |
| 非 git 索引回退 | `thincoder-core/memory/file-walk.mjs`（`walkProjectFiles` / `isSkippedRelPath` / `MAX_WALK_FILES`） | 在位 |
| 索引回退接线 | `thincoder-core/memory/code-sync.mjs:11`（导入）· `:154`（walk 调用） | 接线 |

**接线语义**：`isDocFile` / `isTempFile` 谓词已迁入裁判档，四个导入方（`dispatch.mjs` / `advisor-settle.mjs` / `verify.mjs` / `agent-tools/advisor.mjs`）**全部就地换源**——不保留双份导出（保留 = 制造第二个导入路径，与「单一裁判」相抵）。对照：`messages.mjs` 拆分面**保留 re-export**（结构重构 ≠ 权威迁移）。

## 3. 接口契约

### 3.1 项目声明面 —— `.thincoder/conventions.json`

```json
{
  "codePaths": ["src"],
  "index": { "codeExtensions": [], "docExtensions": [] },
  "advisor": { "docMap": "", "standardsDoc": "" }
}
```

- 全部键**可选**；缺失 / 空串 / 类型错 → 回退默认（`codePaths` 默认 `["src"]`；其余默认空 = 不生效）。
- `codePaths`：路径**段名**数组（任意深度匹配）；声明即**替换**默认（非并集）。
- `index.*Extensions`：对内置扩展名表的**追加**（并集）。
- `advisor.docMap` / `advisor.standardsDoc`：项目根相对路径；找不到文件时走降级句（§3.4）。
- 解析：`JSON.parse` + 逐键类型校验；失败 → 默认 + `console.warn` + 日志事件（**不崩溃、不静默吞**）。

### 3.2 分类裁判 API

| # | 落点（实核） | 语义 |
|---|---|---|
| 1 | `thincoder-core/conventions.mjs:191` `loadConventions(cwd)` | 读声明档 → 归一为完整约定对象（按 cwd 缓存） |
| 2 | `thincoder-core/conventions.mjs:180` `clearConventionsCache()` | 缓存清理（测试 seam） |
| 3 | `thincoder-core/conventions.mjs:73` `classifyPath(p, conv)` | 分类裁判（唯一实现；`/` 与 `\`、绝对与相对路径均接受） |
| 4 | `thincoder-core/conventions.mjs:82` / `:88` / `:40` `isCodePath` / `isDocPath` / `isTempPath` | 三分类谓词 |

**分类语义**（默认约定，可被声明覆盖）：

- `temp` = `tmp-*` 名或 `.tmp` / `.temp` 扩展名；
- `code` = 路径含声明代码段（默认 = 路径段 `src`；**段匹配、非锚定**）或（非文档扩展名）；
- `doc` = 文档扩展名且不落在代码段内。

### 3.3 索引面（非 git 回退 + 扩展名可声明）

- **非 git 行为定义**：索引 = 全量 walk（跳过规则与 git 路径同源 + 文件数上限护栏，超限截断并标记）；增量 = 逐文件 mtime（无 commit 锚）；启动 = full-scan 回退自动生效。评审侧无 git 时注入「变更上下文不可用」降级句（§3.4）。
- **扩展名**：内置表扩至主流语言；`index.codeExtensions` / `index.docExtensions` 声明**追加**（并集）；未列入集**可见**——结果带 `unlistedExts`，`/reindex` 打提示行（含声明指路）。
- **落点**：`thincoder-core/memory/schema.mjs`（扩展名表）· `thincoder-core/memory/code-sync.mjs`（`listProjectFiles` 走 walk 回退 + unlisted 计数）· `thincoder-core/memory/code-index.mjs`（语言标签）· `thincoder-cli/src/tui/cmd-reindex.mjs:48`（未列入提示行）。

### 3.4 降级可见契约（逐面）

| 面 | 缺失场景 | 可见化通道 |
|---|---|---|
| 文档地图 | 探测 + 声明皆无 | 评审消息显式降级句（`project-context.mjs` 注入）+ 评审要求自查声明局限 |
| 项目标准 | 未声明 | 评审消息显式降级句（同上） |
| 设计门禁 | 未声明约定（默认判据命中） | 拒绝 hint 说明判据来源 + 声明指路 |
| 索引扩展名 | 文件扩展名未列入 | 结果 `unlistedExts` + `/reindex` 提示行 + 日志事件 |
| 非 git | 无 git 仓库 | 索引 = walk 可用（不算降级）；评审消息 = 变更上下文降级句 |
| 检查点 | 无 git | **明确报错**（运行时文案「Not a git repository — checkpoints unavailable」——已定义行为，不改）：`thincoder-core/tools/git-checkpoint.mjs:41` |

### 3.5 `/eng` 无前提开启

- `thincoder-cli/src/tui/cmd-eng.mjs`：METHODOLOGY 门禁与模板分支已删——切换**无前提**；ON 提示行改述为「design-before-code enforced（design review + user approval before code）」；令牌语义与槽持久化零改。
- 工具侧文案：`thincoder-core/agent-tools/eng.mjs`（去 `in docs/` 措辞）；门禁 hint = `thincoder-core/agent/dispatch.mjs`（同批去 `docs/` 措辞 + 未声明时的声明指引）。

### 3.6 VSC 端镜像面（B 式并入 · 实核 as-of 2026-09-15）

> 来源 = `thincoder-vscode/docs/design/PORTABILITY.md`（VSC 产品档·批次二——旧档一字未改、留参照历史）。VSC 端 = 同机制的第二实现面：**同语义同 schema、各自独立实现**（不做 byte-identical、不以任一端产物回改另一端——镜像纪律）；未进核前的独立实现坐标如下。

| 面 | VSC 落点（实核） | 差异注 |
|---|---|---|
| 分类裁判（唯一实现） | `thincoder-vscode/src/conventions.mjs:76`（`classifyPath`）· `:85`（`isCodePath`）· `:91`（`isDocPath`）· `:194`（`loadConventions`） | 与核面 `thincoder-core/conventions.mjs` 同语义、独立实现（两份实现、语义同源——统一方向见 `docs/core/design/CORE-UNIFICATION.md`） |
| 声明面 | `.thincoder/conventions.json`（与 CLI 同文件同 schema：`codePaths` / `index.*Extensions` / `advisor.docMap` / `advisor.standardsDoc`） | VSC 侧亦不建本仓自用声明（默认判据对本仓即正确——与 CLI 批同口径） |
| 父侧设计门禁 | `thincoder-vscode/src/agent/tool-gates.mjs:78`（评审前拦截）· `:97`（hint 含未声明指路）——判定经共享谓词 | 门禁载体 = `tool-gates.mjs`（VSC 装配面；CLI 对位 = `thincoder-core/agent/dispatch.mjs:204`） |
| 设计评审文档门禁 | `thincoder-vscode/src/agent-tools/advisor.mjs:219`–`:228`（`isDocPath`——`docs/` 前缀判据已退役） | 拒绝文案 = 产品约定指路（逐字本体住产品代码，本档不复制——D2） |
| 变更集判据 | `thincoder-vscode/src/agent-tools/verify.mjs:95`（`isDocOnlyChange`——本地谓词副本已删、换源 conventions）· `thincoder-vscode/src/agent/run-helpers.mjs:71`（`hasCodeMutations`） | 谓词全部换源 `conventions.mjs`、不设 re-export（单一裁判纪律两端同构） |
| 项目上下文发现与注入 | `thincoder-vscode/src/advisor/project-context.mjs:35`（`NO_GUIDE_NOTICE`）· `:39`（`NO_DOC_MAP_NOTICE`）· `:40`（`NO_STANDARDS_NOTICE`）· `:41`（`NO_GIT_NOTICE`）· `:56`（`findProjectRoot`）· `:91`（`injectProjectGuide`）· `:138`（`injectDocumentMap`）· `:176`（`injectProjectStandards`） | `messages.mjs` 注入调用 = `thincoder-vscode/src/advisor/messages.mjs:107`（guide）· `:115`（NO_GIT）· `:155` / `:240`（standards）· `:160`（docMap） |
| 索引扩展名 + 未列入可见 | `thincoder-vscode/src/index-discover.mjs:17`（`CODE_EXTS` 26 项）· `:24`（`DOC_EXTS` 含 `.mdx/.org/.wiki/.tex`）· `:125`（`discoverFiles` `collectUnlisted`）· `:132`（`discoverFilesUnder`）· 提示行 `thincoder-vscode/src/extension/panel-index.mjs:171`–`:173` | 非 git 行为 VSC 索引**非 git 依赖型**（`indexer.mjs` 全量 walk 回退既有——批次二已对位，不重复修改） |
| 评审侧无 git 降级句 | `NO_GIT_NOTICE` 注入（messages.mjs design / code 双路径） | 索引侧已对位——评审侧为批次二补入 |

**VSC 端消息文案**与 CLI 已交付文本**逐字同文**（`NO_*_NOTICE` 四常量 + 门禁 hint + eng 工具消息 + advisor 拒绝文案——文案与端无关）；逐字本体住产品代码 / 提示词面，本档不复制（D2）。

## 4. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D1 | **组件式 `src` 路径段 + 声明面 + 降级提示** 为代码 / 文档判据 | 嵌套布局不漏判、非 src 布局偏保守且可声明修正、单一权威；否决纯扩展名（`src/prompts/x.md` 仍漏判）· 纯声明制（无声明项目不可用，破坏四步流程） |
| D2 | 声明面载体 = **`.thincoder/conventions.json`**（产品命名空间 / 机器可读 / 单点） | 与全局配置区隔、可缓存、可测；否决 AGENTS.md 内机器可读块（门禁解析自然语言——脆弱）· 全局配置加键（非 per-project，多项目互相污染）· 只降级不声明（不满足「可诉」） |
| D3 | 非 git 索引 = **walk 回退**（跳过规则与 git 路径同源 + 上限护栏） | 索引仍可用；否决仅可见降级（用户仍不可检索）· 要求用户先 `git init`（把产品机制强加给用户项目） |
| D4 | 扩展名 = **内置表扩充 + 声明追加 + 未列入可见** | 默认覆盖主流语言、任意扩展可声明、跳过可感知；否决全文本索引（噪声 / 成本 / 分类失真——登记为远期候选）· 仅可见化（`.fs` / `.dart` 等仍不可检索） |
| D5 | 文档地图 / 标准文档 = **既有探测保留 + 声明键覆盖 + 缺失显式降级** | 通用且本仓零感；否决删探测只认声明（常见项目要声明才注入——无谓摩擦）· 扩充路径猜测（硬编码更多特例） |
| D6 | 提示词通用化 = **通用化 + 「本产品自研仓 = X」示例标注** | 用户项目不建形状、自研仓保留可操作性；否决全删本仓引用（自研会话可操作性下降）· 运行时条件分支（提示词是静态文本——不可实现） |
| D7 | `/eng` = **去门禁、无前提切换** | 工程模式本不依赖任何文件；否决改判「项目自述可用性」（无谓前提）· 回填 `methodology-template.md`（与本仓 METHODOLOGY 已退役相抵） |
| D8 | `messages.mjs` 拆分 = 抽 `thincoder-core/advisor/project-context.mjs` | 兑现既有拆分登记（触发条件「再度增厚」成立）；否决不拆直接增厚（违反已登记触发） |

## 5. 测试面

| 档 | 覆盖 |
|---|---|
| `thincoder-cli/test/portability-classification.test.mjs` | 分类裁判（正常 / 嵌套布局反证 / 声明替换 / 分隔符与祖先段 / 声明档损坏 / 门禁三态） |
| `thincoder-cli/test/portability-index.test.mjs` | walk 回退 / 跳过规则 / 截断 / 扩展名声明与未列入可见化 |
| `thincoder-cli/test/portability-advisor-context.test.mjs` | 项目上下文注入与降级句 |
| `thincoder-cli/test/cmd-eng.test.mjs` | `/eng` 无前提开启 / OFF 语义零回归 |
| `thincoder-vscode/test/portability-vsc-classification.test.mjs` | VSC 分类裁判（正常 / 嵌套反证 / 声明替换 / 损坏回退 / 门禁三态） |
| `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs` | VSC 项目上下文注入与降级句 |
| `thincoder-vscode/test/portability-vsc-index.test.mjs` | VSC 扩展名声明与未列入可见化 |

## 6. 边界（本档不覆盖）

1. **B / C 家族剩余**（P11–P13、P16–P28 与 🔵 项）——CLI 侧后续批；其中 `thincoder-core/prompts/discipline-normal.md` 的地图引用属已登记 P11。
2. ~~**VSC 端镜像**~~——**已并入（批 6）**：VSC 镜像面 = §3.6（第二实现面——未进核前的独立实现坐标）；其批次材料（三态对位表 / 逐条修法流水 / 用例与 AC）逐项登 §7.2 不并。
3. **FR10–FR15 正文搬迁归位**（CLI 侧 `design/ENGINEERING-MODE.md` 旧文 → 需求档）——父侧裁决项。
4. **本仓自指面**（`AGENTS.md` 的检查声明）——父侧落笔。

## 7. 不并项与历史沿革

### 7.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/PORTABILITY.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §1.1–§1.5 | 批次问题陈述 / 范围分割选型 / 本批条目清单 PO-1–PO-12 / 批次间顺序建议 / 归属判定与新建授权留痕 | 一次性批次范围材料——机制本身已落 §2–§3 |
| 旧档 §3 逐条修法 | 逐条修法流水（含 as-of 行号与「现状 → 改法」对照） | 修法已完成（§2 给现状落点）；as-of 行号属历史证据 |
| 旧档 §4.4 逐字文本 | 提示词编辑面的逐字目标文本（EN / 中文镜像） | 文本落地后**权威 = 提示词档本体**（`thincoder-core/prompts/**` + 正本 `docs/core/design/prompts/`）——本档不复制（D2） |
| 旧档 §5 受影响文件全清单 | 批次受影响文件与增量估算 | 一次性批次材料 |
| 旧档 §6 用例表 + §7 验收标准 AC-01–AC-14 | 批次验收材料 | 机制已落；现行回归面见 §5 |
| 旧档 §9 边界 / §10 待定项 / §11 批次二 VSC 镜像面节 | 批次边界与排期 | 一次性批次材料；VSC 面按 P1 归本档（VSC 轮） |
| 旧档档头状态行（设计稿（待评审））+ 变更记录 | 时点状态与逐批流水 | 批次语境——本档自有变更记录 |

### 7.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 提示词文案本体 | 六档编辑面的落地文本 | **产品代码**——落点 `thincoder-core/prompts/**`；中文正本 `docs/core/design/prompts/` |
| VSC 端镜像实现面 | `thincoder-vscode/src/**` 同类判据 | **已并入（批 6）**——§3.6 坐标 + §5 测试面（VSC 保持独立实现、语义同源） |
| VSC 批次二档 §1 三态对位表 · §3 逐条修法流水 · §4.4 逐字提示词文本 · §5 受影响文件全清单 · §6 用例 T-V01–T-V19 · §7 验收 AC-V01–AC-V14 · §9 边界 · §10 open-1–3 | 一次性批次材料（对位勘察 / 修法 as-of 行号 / 逐字施工文本 / 用例与验收）+ open 面 | **不并**——对位结论已落 §2–§3（VSC 面 §3.6）；逐字提示词文本 = 产品代码（落 `thincoder-vscode/src/prompts/**`——本体即权威，D2）；open 项归父侧（(d) 类） |
| 实施台账指针（P1–P28 缺陷登记） | 缺陷编号登记面 | 项目台账（`docs/TODO.md`）面——本档只留机制 |

## 8. 体量与拆分规划（R24a）

**实测行数**：本档 **183 行**（并入批 6 后 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/design/PORTABILITY.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 择**机制面**重建（分类裁判单源 / 声明面 / 降级契约 / 索引回退 / `/eng` 无前提）；批次范围裁定 · 逐条修法流水 · 逐字提示词文本 · 受影响文件清单 · 用例表与 AC · VSC 镜像面节 → §7 逐项登记不并；
  ② 坐标一律改现状路径并经实核（`thincoder-core/conventions.mjs` 等）；③ 新增 §5 测试面（回指现行测试档）、§8 体量。
- 2026-09-15（**B 式迁移轮 · VSC 第 6 批 · 并入 · eng-designer**）：新增 §3.6 VSC 端镜像面——自 `thincoder-vscode/docs/design/PORTABILITY.md`（批次二）并入（分类裁判 / 声明面 / 门禁 / 注入 / 索引坐标按现状实核；消息文案逐字本体住产品代码不复制）；§5 补 VSC 测试档三行；§6 边界行 2 收口 + §7.2 登记 VSC 批次材料不并（(d) 类）。
