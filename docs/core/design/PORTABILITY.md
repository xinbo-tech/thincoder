# 可移植性（PORTABILITY）· 设计

> 板块 = **可移植性**——工程模式与机检机制面向**任意项目**时不得静默失效的机制面：
> 代码 / 文档分类裁判 · 项目声明面 · 降级可见 · 非 git 索引回退 · `/eng` 无前提开启。
> 需求侧 = `docs/core/requirements/PORTABILITY.md`（F1–F9 现行面——CLI 侧 FR10–FR15 接受方向已并入该档 §5；旧档 `thincoder-cli/docs/_archive/requirements/PORTABILITY.md` 留参照历史）；工作流面（工程模式本体）= `thincoder-cli/docs/_archive/design/ENGINEERING-MODE.md`（CLI 侧**未迁**）。
> 双端对位 = `thincoder-vscode/docs/design/PORTABILITY.md`（VSC 端镜像面**已并入（批 6）**——§3.6 坐标 + §5 测试面；旧档一字未改、留参照历史）。
> 建档：2026-09-15（**B 式迁移轮 · 第 2 批**——`thincoder-cli/docs/design/PORTABILITY.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）；F9 节（§3.1 / §3.2 / §3.6 / §3.7）坐标 = **as-of 2026-09-27 实核**；段匹配面（§3.2 / §4 D17–D18 / §5 段匹配用例）坐标 = **as-of 2026-09-28 实核**。

## 1. 定位与问题面

工程模式是**面向任意项目的产品功能**，但早期实现把本产品自研仓的约定（文档地图、`METHODOLOGY.md`、`docs/design/<TOPIC>.md` 树形状、`^src/` 判据、自指检查脚本）当成了普适事实，在用户项目上产生三类**静默失效**（用户不可见、不可修）：

| # | 失效类 | 现象 |
|---|---|---|
| 1 | **评审维度无声消失** | 文档地图 / 项目标准探不到即静默跳过，评审仍按该维度打分 |
| 2 | **门禁静默绕过** | 嵌套布局下 `packages/foo/src/*.md` 被当文档，绕过设计门禁 |
| 3 | **索引静默为空** | 非 git 项目代码 / 文档索引全空；白名单外扩展名不可检索 |

另有一枚活 bug（已修）：`/eng` 门禁要求 `METHODOLOGY.md`，而「从模板创建」指向已不存在的模板——选项必炸。

**本板块的机制目标**：上述每一类都改为**有判据、可声明、缺失即显式降级**，且判据**只有一份实现**。

## 2. 实现单一权威（现状路径 · as-of 2026-09-27 实核——表内逐行 as-of 注为准）

**分类裁判单源**：`thincoder-core/conventions.mjs` = 全产品唯一的代码 / 文档 / 临时 / 辅助面（aux）分类裁判；门禁与守卫一律经它判定（自带的 `^src/` 锚定式、`docs/` 前缀式、组件式正则副本已全部退役，**不设 re-export**——只留一个导入路径）。
（**射程区分（2026-10-01 · core 拆分批）**：本句纪律的对象 = **权威迁移**面（谓词换源——只留一个导入路径）；**结构重构**面（纯搬迁拆分）**保留转口 re-export**——对照 §2「接线语义」条；
先例 = `declaration.mjs` ∥ `context-push` ∥ `context-echo` ∥ `context-degrade` ∥ `memory/file-list` ∥ `memory/code-search` ∥ `memory/memory-tool`——全部经原档转口，消费面零改。）

| 面 | 落点（实核） | 状态 |
|---|---|---|
| 分类裁判 + 声明装载 | 分类裁判 = `thincoder-core/conventions.mjs`（`classifyPath:136` · `isCodePath:146` · `isDocPath:152` · `isTempPath:53` · `isAuxPath:163`）；声明装载 = `thincoder-core/declaration.mjs`（`loadProjectDeclaration:149` · `clearDeclarationCache:124` · `DEFAULT_DECLARATION:100`——经 `conventions.mjs` 转口可达）——行号 as-of 2026-10-01 实读；档级行数 = `conventions.mjs` **172** 行 ∥ `declaration.mjs` **173** 行（2026-10-01 core 拆分批 · #755 ∥ #786） | 在位 |
| 默认判据（数据常量） | `thincoder-core/manifest.mjs` `DEFAULT_MANIFEST.codePaths` = `["src"]`（**单源**——裁判档经 `DEFAULT_DECLARATION` 取用；`MANIFEST.md` §2.4 KD-M1-31） | 在位 |
| 声明装载载体 | `PROJECT-MANIFEST.json` 三族键（`codePaths` / `index.*` / `advisor.*`——schema 权威 = `MANIFEST.md` §2.2） | 在位 |
| 父侧设计门禁 | `thincoder-core/agent/dispatch.mjs:98`（保守拦截 `typeof p !== "string"` 分支保留；缺省放行面 = aux——§3.2） | 换源 |
| 设计评审文档门禁 | `thincoder-core/agent-tools/advisor.mjs:119` | 换源 |
| 变更集判据 | `thincoder-core/advisor/repos.mjs:118`（`hasCodeMutations`）· `:128`（`isDocOnlyChange`） | 换源 |
| 评审收敛侧判据 | `thincoder-core/agent-tools/advisor-settle.mjs:71` | 换源（本地实现已删） |
| verify 快路径 | `thincoder-core/agent-tools/verify.mjs:180`（纯文档变更）· `:191`（代码文件集） | 换源（失引 helper 已清） |
| 项目上下文发现与注入 | `thincoder-core/advisor/project-context.mjs`（`messages.mjs` 拆分产物） | 在位 |
| 非 git 索引回退 | `thincoder-core/memory/file-walk.mjs`（`walkProjectFiles` / `isSkippedRelPath` / `MAX_WALK_FILES`） | 在位 |
| 索引回退接线 | `thincoder-core/memory/file-list.mjs:8`（导入）· `:61`（walk 调用——住 `listProjectFiles` 体内；经 `code-sync.mjs` 转口可达）——行号 as-of 2026-10-01 实读 | 接线 |

**接线语义**：`isDocFile` / `isTempFile` 谓词已迁入裁判档，四个导入方（`dispatch.mjs` / `advisor-settle.mjs` / `verify.mjs` / `thincoder-core/agent-tools/advisor.mjs`）**全部就地换源**——不保留双份导出（保留 = 制造第二个导入路径，与「单一裁判」相抵）。对照：`messages.mjs` 拆分面**保留 re-export**（结构重构 ≠ 权威迁移）。

## 3. 接口契约

### 3.1 项目声明面 —— `PROJECT-MANIFEST.json` 三族键

声明载体 = 项目 manifest 本体（`PROJECT-MANIFEST.json`——**单一项目声明档**）。键名 / 形态 / 缺省 / 校验 = schema 权威 `MANIFEST.md` §2.2 + §2.4 KD-M1-31/M1-32（本档只给**声明语义**与消费面）：

| 族 | 键 | 声明语义（本机制面） |
|---|---|---|
| 分类 | `codePaths` | 路径**段名**数组（任意深度匹配）；声明即**替换**默认（缺省 `["src"]`——非并集）；空数组 = 明确「无段名代码面」（兜底分类仍在） |
| 索引 | `index.codeExtensions` / `index.docExtensions` | 对内置扩展名表的**追加**（并集，只增不减） |
| 评审注入 | `advisor.docMap` / `advisor.standardsDoc` | 项目根相对**文件路径**（单指针）；空串 = 未声明（走探测 / 降级句） |

- `codePaths` 兼作**辅助面缺省的收回面**（F9 · §3.2）：列入 `test` / `tests` / `scripts` / `.thincoder/tmp` 同段序列 ⇒ 代码段优先命中，判 code（门禁恢复）。
- `docMap` 指向的文件读不到 ⇒ 降级句（§3.4）；未声明 `docMap` 时保留既有探测（`docs/README.md` → `docs/design/README.md`）。
- 解析 / 归一（段名 trim + 分隔符归一 + 去重；扩展名小写 + 点号前缀 + 去重；指针 trim）落 `loadProjectDeclaration`（§3.2 行 1）；**schema 校验不在此层**（形态错 = manifest 非法——§4 D16）。
- `declared` 标志 = **任一族偏离缺省**——判据 = **值比较**（与缺省值等值 ⇒ 假；显式写入但值 = 缺省照判假，不按键存在性）；门禁 hint 据它决定是否给声明指路（§3.4）。
- **`index.publicRepos` 入判补登**（2026-10-04 · #835）：本键非空 ⇒ 亦入 `declared` 判（值比较——与 `index.excludePaths` 同款；实读 `thincoder-core/declaration.mjs:85` `publicRepos.length > 0`）。
- **声明载体唯一**：`.thincoder/conventions.json` 不在读面（内容零解析）；该档在场 ⇒ 一行可见告警 + 日志事件（`declaration:retired-file`），读数与无档逐条等值——裁决 = §4 D15。
  **告警钉死（设计评审轮 1 收正）**：检查落点 = `loadProjectDeclaration` 内（缓存未命中路径）；**基准目录 = `manifestFilePath(cwd)` 的项目根**（`dirname`——同档路径判据，不用 cwd 原文；cwd 深于项目根时仍命中）；**频次 = 每缓存一次**（同档路径缓存命中不重复告警；`clearDeclarationCache()` 后重读可再现）。

### 3.2 分类裁判 API（行号 as-of 2026-10-01 实读；声明装载面现体 = `declaration.mjs`——经 `conventions.mjs` 转口）

| # | 落点（实核） | 语义 |
|---|---|---|
| 1 | `thincoder-core/declaration.mjs:149` `loadProjectDeclaration(cwd)`（经 `conventions.mjs` 转口） | 经 `readManifest` / `manifestFilePath` 读 manifest → 投影三族键 → 归一为声明对象（按**档路径**缓存；含 `root`——声明对象形状）；缺档 ⇒ 默认（静默）；非法 / 读错 ⇒ 默认 + `console.warn` + 日志事件 |
| 2 | `thincoder-core/declaration.mjs:124` `clearDeclarationCache()`（经 `conventions.mjs` 转口） | 缓存清理（测试 seam） |
| 3 | `thincoder-core/conventions.mjs:136` `classifyPath(p, conv)` | 分类裁判（唯一实现；`/` 与 `\`、绝对与相对路径均接受；四值 = `code` / `doc` / `temp` / `aux`；段匹配面 = 项目根相对面——上条） |
| 4 | `thincoder-core/conventions.mjs:146` / `:152` / `:53` `isCodePath` / `isDocPath` / `isTempPath` | 三分类谓词（`isDocPath` / `isTempPath` 为独立谓词、非 `classifyPath` 派生——沿既有口径；内部与面判链的共用关系见下「单一实现面」条） |
| 5 | `thincoder-core/conventions.mjs:163` `isAuxPath`（F9 新增） | 辅助面谓词（`classifyPath === "aux"`——父侧门缺省放行面）；生产面读 aux 一律经 `classifyPath`（本谓词消费方 = 用例面 · 可读性） |
| 6 | `thincoder-core/declaration.mjs:100` `DEFAULT_DECLARATION`（经 `conventions.mjs` 转口） | 全默认声明对象（= 无档 / 档不可用时的回退面；由 `DEFAULT_MANIFEST` 三族默认值构造——默认值单源；`root = null` = 根未知 ⇒ 面不可判） |

**声明对象形状（全体落点共用——设计评审轮 1 收正；`root` 行 2026-09-28 增）**：`{ declared, codePaths, index, advisor, root }`——`root` = 该声明所属**项目根绝对路径**（`dirname(manifestFilePath(cwd))`——段匹配面所依，见下「段匹配面」条）。
`declared` = 三族任一偏离缺省（**值比较**——`root` 非声明值，不入此判；§3.1；门禁 hint 据它决定是否指路）；`codePaths` = 归一后段名数组 · `index` = `{ codeExtensions, docExtensions }` · `advisor` = `{ docMap, standardsDoc }`。
`DEFAULT_DECLARATION` 与声明面返回**同形**（全缺省 ⇒ `declared:false`；`DEFAULT_DECLARATION.root = null` = 根未知）。

**分类语义**（默认约定，可被声明覆盖；F9 辅助面 = 2026-09-27 增补）：

- `temp` = `tmp-*` 名或 `.tmp` / `.temp` 扩展名；
- `doc` = 文档扩展名且不落在代码段内；
- `aux` = 路径含**缺省辅助面段序列**（`test` / `tests` / `scripts` 单段、任意深度；`.thincoder/tmp` 两段序列——数据常量 `DEFAULT_AUX_PATHS`，不可声明）且未命中代码段 / temp / doc——辅助面 = 工程模式父侧门的缺省放行面（写测试与临时驱动无须设计令牌）；
- `code` = 路径含声明代码段（默认 = 路径段 `src`；**段匹配、非锚定**）或落兜底；
- **优先级**：代码段 → temp → doc → aux → 兜底 code（aux 规则置于 temp / doc **之后**——最小差分：唯「曾落兜底 code」的辅助面路径改判 `aux`，其余路径分类逐条不变）；
- **代码段优先级在前 ⇒ `src/test/**` 仍判 code**（`src` 段先命中）；`codePaths` 列入同段序列即收回该缺省（§3.1）。

**段匹配面 = 项目根相对面（2026-09-28 · 台账 #465 收口）**：段匹配（代码段 ∥ 辅助面段序列）只在**项目根相对面**上进行——项目根之上的机器布局（如项目落在 `D:/work/scripts/` 之下）不参与判定：

- **面判**：绝对形（分隔符归一 + 逐段大小写不敏感比较）在根之下、剩余段非空且无 `.` / `..` ⇒ **面 = 剩余段**；路径等于根 ⇒ 面 = ∅；其余（根外 / 根未知 / 剩余含 `.` / `..`）⇒ **面不可判**。相对形 ⇒ 面 = 原样段（含 `.` / `..` ⇒ 面不可判）。
- **面不可判的处置**：辅助面段序列**不命中**（豁免面以项目根之内为界——祖先段命中即整片放行的缺省不复存在）；代码段匹配**回落全段**（拦截面不缩——根外保守拦截照旧）。
- **面所依项目根** = 声明载体的项目根（`conv.root` = `dirname(manifestFilePath(cwd))`——与档路径判定同源，KD-M1-18；缺档项目 = `resolveProjectRoot(cwd) ?? resolve(cwd)` 同一式）；根未知（`DEFAULT_DECLARATION`）⇒ 面不可判（保守面照旧）。
- **单一实现面**：面判与段匹配（代码段 ∥ 辅助面段序列）只在**段匹配实现一处**——`isCodePath` / `isAuxPath` 经 `classifyPath` 派生；`isDocPath` 为独立谓词（扩展名 ∧ 不落代码段）——其代码段半幅经**同一段匹配实现**（面判随之）；`isTempPath` 为纯名 / 扩展名谓词（无段维度——面判不涉）。谓词 API 面零改；消费面（父侧门 / 变更记账 / verify / 陈旧判定 / VSC 镜像）零签名改动、零自有面判。

**面判读数（现行口径）**：

| # | 输入（根 = R） | 判 | 依据 |
|---|---|---|---|
| 1 | `D:/work/scripts/mytool/lib/<x>.mjs` · R = `D:/work/scripts/mytool` | code | 面 = `lib/<x>.mjs`（`scripts` 在根之上 ⇒ 不参与）；辅助面不命中 ⇒ 兜底 code |
| 2 | 同路径 · R = `D:/work` | aux | 面 = `scripts/mytool/lib/<x>.mjs`——`scripts` 为根内段（F9「任意深度」；声明 `codePaths` 可收回） |
| 3 | `<R>/test/<x>.mjs` · `<R>/packages/foo/tests/deep/<x>.mjs` | aux | 面内辅助面段序列命中（任意深度 / 大小写 / 两段序列保持） |
| 4 | `D:/src/app/docs/<x>.md` · R = `D:/work/proj`（根外） | code | 面不可判 ⇒ 代码段回落全段（`src` 命中——T-04 既有登记代价保持） （机检豁免——用例退场登记） |
| 5 | 根名即辅助面段（R = `D:/work/test`）下 `<R>/<x>.mjs` | code | 面 = `<x>.mjs`——根名不属根内结构（不再是整项目豁免） |
| 6 | 根之上含代码段（R = `D:/src/app`）下 `<R>/docs/<x>.md` | doc | 面 = `docs/<x>.md`——根之上的 `src` 不参与（根内半幅的过度拦截随之消除） |
| 7 | 相对形 `../scripts/<x>.mjs` | code | 含 `..` ⇒ 面不可判 ⇒ 豁免不命中（相对形跳段口同时收口） |

**测试面（同根项收口）**：面判据使根内读数不再受根之上祖先段影响——用例的绝对形锚（含系统 TMPDIR 锚）不再因 TMPDIR 祖先段含 `src` 而假红；面判据用例以**根内 / 根外两侧读数**锁定（§5 · T-33 / T-V27）。

### 3.3 索引面（非 git 回退 + 扩展名可声明）

- **非 git 行为定义**：索引 = 全量 walk（跳过规则与 git 路径同源 + 文件数上限护栏，超限截断并标记）；增量 = 逐文件 mtime（无 commit 锚）；启动 = full-scan 回退自动生效。评审侧无 git 时注入「变更上下文不可用」降级句（§3.4）。
- **扩展名**：内置表扩至主流语言；`index.codeExtensions` / `index.docExtensions` 声明**追加**（并集）；未列入集**可见**——结果带 `unlistedExts`，`/reindex` 打提示行（含声明指路）。
- **落点**：`thincoder-core/memory/schema.mjs`（扩展名表）· `thincoder-core/memory/file-list.mjs`（`listProjectFiles` 走 walk 回退 + unlisted 计数——2026-10-01 拆分批自 `code-sync.mjs` 迁出，经其转口可达）· `thincoder-core/memory/code-index.mjs`（语言标签）· `thincoder-cli/src/tui/cmd-reindex.mjs:48`（未列入提示行）。

### 3.4 降级可见契约（逐面）

| 面 | 缺失场景 | 可见化通道 |
|---|---|---|
| 文档地图 | 探测 + 声明皆无 | 评审消息显式降级句（`project-context.mjs` 注入）+ 评审要求自查声明局限 |
| 项目标准 | 未声明 | 评审消息显式降级句（同上） |
| 设计门禁 | 未声明约定（默认判据命中） | 拒绝 hint 说明判据来源 + 声明指路（`PROJECT-MANIFEST.json` 的 `codePaths`） |
| 退役声明档 | 旧档 `.thincoder/conventions.json` 在场（内容零解析） | 一行 `console.warn` + 日志事件 `declaration:retired-file`（读数与无档等值——§3.1）；落点 = `loadProjectDeclaration` 内 · 基准 = `manifestFilePath` 项目根 · 频次 = 每缓存一次 |
| 索引扩展名 | 文件扩展名未列入 | 结果 `unlistedExts` + `/reindex` 提示行 + 日志事件 |
| 非 git | 无 git 仓库 | 索引 = walk 可用（不算降级）；评审消息 = 变更上下文降级句 |
| 检查点 | 无 git | **明确报错**（运行时文案「Not a git repository — checkpoints unavailable」——已定义行为，不改）：`thincoder-core/tools/git-checkpoint.mjs:41` |

### 3.5 `/eng` 无前提开启

- `thincoder-cli/src/tui/cmd-eng.mjs`：METHODOLOGY 门禁与模板分支已删——切换**无前提**；ON 提示行改述为「design-before-code enforced（design review + user approval before code）」；令牌语义与槽持久化零改。
- 工具侧文案：`thincoder-core/agent-tools/eng.mjs`（去 `in docs/` 措辞）；门禁 hint = `thincoder-core/agent/dispatch.mjs`（同批去 `docs/` 措辞 + 未声明时的声明指引）。

### 3.6 VSC 端镜像面（B 式并入 · 实核 as-of 2026-09-15）

> 来源 = `thincoder-vscode/docs/design/PORTABILITY.md`（VSC 产品档·批次二——旧档一字未改、留参照历史）。VSC 端 = 同机制的第二实现面：**同语义同 schema、各自独立实现**（不做 byte-identical、不以任一端产物回改另一端——镜像纪律）；未进核前的独立实现坐标如下。
> **W4 状态注（2026-09-15）**：VSC 端镜像实现已删——VSC 经 `@thincoder/core/conventions.mjs` 引用（单源；下表坐标 = 迁移前 as-of）。
> **W15 状态注（2026-09-15）**：VSC 端装配/注入面（i18n 投影 · 提醒转口 · 蒸馏适配 · 事件中继）随 W15 核单源化收口；
> 本节坐标逐个可达（实核：`agent/tool-gates.mjs:78` 落在 eng-coder 子门注释段 · `:81-84` = eng-coder 子门实体 · `:92` = 父门（门条件）/`:97` = 其 hint 分支 · `agent/run-helpers.mjs:71` = `hasCodeMutations` 体内〔声明 `:70`〕）。 （迁移期引文——档已迁核）

| 面 | VSC 落点（实核） | 差异注 |
|---|---|---|
| 分类裁判（唯一实现） | `thincoder-vscode/src/conventions.mjs:76`（`classifyPath`）· `:85`（`isCodePath`）· `:91`（`isDocPath`）· `:194`（装载面）——W4 已迁核（分类裁判现体 = `thincoder-core/conventions.mjs`；装载面现体 = `loadProjectDeclaration`——2026-10-01 拆分批迁 `thincoder-core/declaration.mjs`，经 `conventions.mjs` 转口可达） | 与核面同语义（W4 前 = 两份实现、语义同源）——统一方向见 `docs/core/design/CORE-UNIFICATION.md` |
| 声明面 | `PROJECT-MANIFEST.json` 三族键（与 CLI 同档同 schema：`codePaths` / `index.*Extensions` / `advisor.{docMap,standardsDoc}`；声明语义 = §3.1） | VSC 侧亦不建本仓自用声明（默认判据对本仓即正确——与 CLI 批同口径） |
| 父侧设计门禁 | `thincoder-vscode/src/agent/tool-gates.mjs:78`（评审前拦截）· `:97`（hint 含未声明指路）——判定经共享谓词 | 门禁载体 = `tool-gates.mjs`（VSC 装配面；CLI 对位 = `thincoder-core/agent/dispatch.mjs:204`） （迁移期引文——档已迁核） |
| 设计评审文档门禁 | `thincoder-vscode/src/agent-tools/advisor.mjs:219`–`:228`（`isDocPath`——`docs/` 前缀判据已退役） | 拒绝文案 = 产品约定指路（逐字本体住产品代码，本档不复制——D2） （迁移期引文） |
| 变更集判据 | `thincoder-vscode/src/agent/run-helpers.mjs:70`（`hasCodeMutations`——`isCodePath` 消费，实核 2026-09-27）；VSC 端 verify / 陈旧判定无本地实现（`thincoder-vscode/src/agent-tools/index.mjs:8` = 核登记册转口——核单源） | 谓词全部换源 `@thincoder/core/conventions.mjs`（W4 已迁核）、不设 re-export（单一裁判纪律两端同构） |
| 项目上下文发现与注入 | `thincoder-vscode/src/advisor/project-context.mjs:35`（`NO_GUIDE_NOTICE`）· `:39`（`NO_DOC_MAP_NOTICE`）· `:40`（`NO_STANDARDS_NOTICE`）· `:41`（`NO_GIT_NOTICE`）· `:56`（`findProjectRoot`）· `:91`（`injectProjectGuide`）· `:138`（`injectDocumentMap`）· `:176`（`injectProjectStandards`） | `messages.mjs` 注入调用 = `thincoder-vscode/src/advisor/messages.mjs:107`（guide）· `:115`（NO_GIT）· `:155` / `:240`（standards）· `:160`（docMap） |
| 索引扩展名 + 未列入可见 | `thincoder-vscode/src/index-discover.mjs:17`（`CODE_EXTS` 26 项）· `:24`（`DOC_EXTS` 含 `.mdx/.org/.wiki/.tex`）· `:125`（`discoverFiles` `collectUnlisted`）· `:132`（`discoverFilesUnder`）· 提示行 `thincoder-vscode/src/extension/panel-index.mjs:171`–`:173` | 非 git 行为 VSC 索引**非 git 依赖型**（`indexer.mjs` 全量 walk 回退既有——批次二已对位，不重复修改） |
| 评审侧无 git 降级句 | `NO_GIT_NOTICE` 注入（messages.mjs design / code 双路径） | 索引侧已对位——评审侧为批次二补入 |

**VSC 端消息文案**与 CLI 已交付文本**逐字同文**（`NO_*_NOTICE` 四常量 + 门禁 hint + eng 工具消息 + advisor 拒绝文案——文案与端无关）；逐字本体住产品代码 / 提示词面，本档不复制（D2）。

> **F9 状态注（2026-09-27）**：VSC 父侧门（`thincoder-vscode/src/agent/tool-gates.mjs:89-101`）与变更记账守卫（子门 `:78-81` 不动）均为核分类器消费者——aux 缺省随核自动随动（VSC 端零改）；同判读数 = `thincoder-vscode/test/portability-vsc-classification.test.mjs` T-V22–T-V24（§5 用例表——同判三例）。 （迁移期引文——档已迁核）

### 3.7 F9 缺省辅助面（aux）的消费面核销（2026-09-27）

分类裁判单源不变；各消费面对 aux 的读数 = 其既有表达（`isCodePath` 等）一以贯之。差分逐面核销如下——**裁定 = 接受并登记**：「非产品代码 ⇒ 不索验证声明 / 不计代码变更」是既有设计线（`thincoder-core/agent-tools/verify.mjs:187-190` 注释，temp 面同一处理），aux 沿之；若后续实跑证伪，消解路径 = 该消费面单点加判据（另批裁），**不动分类词汇**。

| # | 消费面（实核 2026-09-27） | aux 缺省前 | aux 缺省后 | 裁定 |
|---|---|---|---|---|
| 1 | 父侧门 `thincoder-core/agent/dispatch.mjs:195-217` ∥ `thincoder-vscode/src/agent/tool-gates.mjs:89-101` | 辅助面路径判 code ⇒ 无令牌拒 | 判 aux ⇒ 放行 | **本批目标** （迁移期引文——档已迁核） |
| 2 | eng-coder token 门 `dispatch.mjs:172-180` ∥ `tool-gates.mjs:78-81` | 不看路径（角色 + token 判据） | 零变 | 硬要求（F9） （迁移期引文——档已迁核） |
| 3 | verify 代码文件集 `thincoder-core/agent-tools/verify.mjs:191` + 验证声明门 `:222-226` | 辅助面文件计入 ⇒ 索验证声明 + 语法提示 | 不计入 ⇒ 辅助面独立变更落「No code files changed」 | 接受·登记（消解：见上） |
| 4 | 验证 / 评审推送守卫 `thincoder-core/agent/completion.mjs:77` / `:132`（经 `thincoder-core/advisor/repos.mjs:118-123` `hasCodeMutations`；该两守卫本限非工程模式 · `thincoder-core/agent/completion.mjs:75` / `:123`；VSC 同族守卡 = `thincoder-vscode/src/agent/run-stages.mjs:105` / `:156`） | 辅助面独立变更计入代码 ⇒ 推送 verify / 评审 | 不计入 ⇒ 不推送 | 接受·登记（同 3） |
| 5 | 评审陈旧判定 `thincoder-core/agent-tools/advisor-settle.mjs:74`（code 评审） | 辅助面写致 stale | 不致 stale | 接受（code 评审判 code 面——辅助面不在其射程） |
| 6 | 评审范围发现 `thincoder-core/advisor/repos.mjs:128-150` `isDocOnlyChange` | 辅助面独立变更 ⇒ false | ⇒ true（返回值命名与语义落差——现无生产消费方，用例面 = `thincoder-vscode/test/portability-vsc-classification.test.mjs:18`） | 接受·登记（消解窗口：该谓词首个生产消费方出现前收正命名 / 文档句） |
| 7 | spawn `files` 域 `thincoder-core/agent-tools/spawn-gates.mjs:95-109` `rejectEngineeringFilePaths` | 自带谓词（零分类器消费）——`scripts/**` 拒入域 | 零变（入域面 ≠ 写门面，两判据目的不同） | 零扰 |

## 4. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D1 | **组件式 `src` 路径段 + 声明面 + 降级提示** 为代码 / 文档判据 | 嵌套布局不漏判、非 src 布局偏保守且可声明修正、单一权威；否决纯扩展名（`src/prompts/<x>.md` 仍漏判）· 纯声明制（无声明项目不可用，破坏四步流程） |
| D2 | 声明面载体 = **`PROJECT-MANIFEST.json` 三族键**（`codePaths` / `index.*Extensions` / `advisor.{docMap,standardsDoc}`——产品既有项目声明档，单点 / 机器可读 / 可缓存 / 可测） | 用户 2026-09-27 19:39 裁定「必须的功能并入 project-manifest，**不要同时保留二者**」= 单一项目声明档；manifest 的档位 / 项目归属已单源（`MANIFEST.md` §2.2）⇒ 声明归属随项目归属同判据。**否决备选**：独立第二声明档（双机制并存——用户逐字否）· AGENTS.md 内机器可读块（门禁解析自然语言——脆弱）· 全局配置加键（非 per-project，多项目互相污染）· 只降级不声明（不满足「可诉」） |
| D3 | 非 git 索引 = **walk 回退**（跳过规则与 git 路径同源 + 上限护栏） | 索引仍可用；否决仅可见降级（用户仍不可检索）· 要求用户先 `git init`（把产品机制强加给用户项目） |
| D4 | 扩展名 = **内置表扩充 + 声明追加 + 未列入可见** | 默认覆盖主流语言、任意扩展可声明、跳过可感知；否决全文本索引（噪声 / 成本 / 分类失真——登记为远期候选）· 仅可见化（`.fs` / `.dart` 等仍不可检索） |
| D5 | 文档地图 / 标准文档 = **既有探测保留 + 声明键覆盖 + 缺失显式降级** | 通用且本仓零感；否决删探测只认声明（常见项目要声明才注入——无谓摩擦）· 扩充路径猜测（硬编码更多特例） |
| D6 | 提示词通用化 = **通用化 + 「本产品自研仓 = X」示例标注** | 用户项目不建形状、自研仓保留可操作性；否决全删本仓引用（自研会话可操作性下降）· 运行时条件分支（提示词是静态文本——不可实现） |
| D7 | `/eng` = **去门禁、无前提切换** | 工程模式本不依赖任何文件；否决改判「项目自述可用性」（无谓前提）· 回填 `methodology-template.md`（与本仓 METHODOLOGY 已退役相抵） |
| D8 | `messages.mjs` 拆分 = 抽 `thincoder-core/advisor/project-context.mjs` | 兑现既有拆分登记（触发条件「再度增厚」成立）；否决不拆直接增厚（违反已登记触发） |
| D9 | **改点 = 分类器本体**（`conventions.mjs` 缺省面），非门内定向谓词（2026-09-27 · F9） | 语义一致性 = 单一权威（F1 / FR12）：「什么算产品代码」只能有一个答案；两门随核自动随动（VSC 零改）；F9 判据线即以 `classifyPath` 四例书写。**否决备选（门内定向谓词·消费面零扰动）**：（i）与 F9 注册判据线不符（判据在 `classifyPath`）（ii）再造第二判据 = 本档 §2 所消的漂移（iii）VSC 镜像需再落一份拷贝或回引核谓词（= 分类器本体，等价） |
| D10 | **三值闭集扩为四值：新增 `aux`**（辅助面）；aux 规则置于 temp / doc **之后**、兜底之前 | 最小差分性质：既有分类逐条不变，唯「曾落兜底 code」的 `test` / `tests` / `scripts` / `.thincoder/tmp` 路径改判 aux——既有用例零改全绿的机制保证（N1）。**否决备选**：◎复用 `temp`——「test/** 判 temp」使同档 `classifyPath` 与 `isTempPath` 同词两义，或把长期资产并入「可清理 / 保留期」词义（`thincoder-core/agent/helpers.mjs:146` offload 三日清理 · `thincoder-core/session-gc.mjs:63` `.tmp` 保留期在册）——后续按「temp ⇒ 可清理」判断的消费面即误伤；◎复用 `doc`——语义不实 + verify 文档快径把辅助面独立变更整段跳过；◎新谓词不改值域——同 D9（ii）（iii）且与 F9 判据线不符 |
| D11 | **消费面差分 = 接受并登记**（§3.7 逐面核销），本轮不改任何消费面判据 | 分类单源 + 「相关性」归各消费面自持：`isCodePath` 一以贯之，差分即「aux = 非产品代码」的直接推论；逐面登记 + 消解路径在册（§3.7），避免「静默改行为」 |
| D12 | **提示词面同步 = 本批必带**（测试面入父侧可直改类目） | 分类与分流背离即触发「授权判据 ≠ 绕过门禁 ⇒ 停下上报」纪律（`thincoder-core/prompts/discipline-engineering.md:24` + `docs/core/design/ENG-TOKEN-BINDING.md:152` AC-M4-5）——结构一致性要求同批闭口；内容权 = 主 agent，落笔 = 实施舱（受影响文件表落点 = `docs/batches/2026-09-27-eng-write-exemption.md` §2.4） |
| D13 | 三族键**并入 manifest schema**（顶层平级键 + 缺省值入 `DEFAULT_MANIFEST`）——键名 / 形态 / 缺省**逐字承前**；`docRoot`（文档层根集合）与 `advisor.docMap`（地图文件单指针）**并存** | 迁移 = 逐字抄写（用户项目零改名零改形）；schema 侧落形 / 默认 / 校验 / 结构不对称理由 = `MANIFEST.md` §2.4 KD-M1-31（本档不复述）。**否决备选**：包一层 `conventions` 对象（三族分属分类 / 索引 / 注入三消费族——包层零收益）· 三族键不入默认档（`fillDefaults` 只搬已知键——不入则读面取不到，或另造「可选识别键」第三类键）· 与 `docRoot` 合并（根集合 vs 文件指针——形态相反） |
| D14 | 读面 = `conventions.mjs` 新增 `loadProjectDeclaration(cwd)`（投影三族键 + 归一 + 冻结 + 按档路径缓存），装载经 `manifest.mjs` 的 `readManifest` / `manifestFilePath` **单源** | 装载方向**单向**（`conventions.mjs` → `manifest.mjs`；反向零出边——本模块保持叶子零项目依赖）；两模块**同属模式无关面**（全模式消费）⇒ 耦合非模式耦合。**否决备选**：裁判档内自读自解析（同一档两份读取器 + 第二份根解析——`MANIFEST.md` KD-M1-18 禁形）· 投影落 `manifest.mjs`（分类归一 / 扩展名点号归一 / 段语义挤进项目模型模块——两个所有者）· 保留 `loadConventions` 名（名实不符——载体已非 conventions 档） |
| D15 | **退役全链**：`CONVENTIONS_REL_PATH` / `loadConventions` / `DEFAULT_CONVENTIONS` / `clearConventionsCache` / 逐键类型校验全删——无兼容读、无弃用期并行；旧档在场 = **一行可见告警**（`console.warn` + `logEvent('declaration:retired-file')`）+ 存在性检查（`existsSync`——**内容零解析**、零回退） | 用户逐字「不要同时保留二者」；告警 = 可迁移纪律（静默停用 = 哨兵失效不可见——本档问题本体），非机制（零读零回退）。**否决备选**：静默不读（旧声明静默失效——分类面静默回默认，正是本板块要消灭的失效类）· 兼容读 + 告警（双机制并存——用户否）· 自动迁移脚本（一次性动作造第二条写路径——`MANIFEST.md` KD-M1-11 同族否决） |
| D16 | 三族键**形态错 = MANIFEST 非法**（`validateManifest` 出 `errors`，fail-closed）；消费面（分类 / 索引 / 注入）遇档不可用 ⇒ **三族逐条回默认 + 可见**（缺档静默；非法 / 读错加 `console.warn` + 日志事件） | 与 `docRoot` 子键同款（`MANIFEST.md` KD-M1-7：静默跳过 = 静默失踪）；两层各归其位：档面 fail-closed（工程入口 / 翻转面既有语义零改）、运行面不崩不静默（N2）。**否决备选**：逐键降级（旧档语义直搬——两套校验语义 + 弱可见：VS Code 扩展宿主里 `console.warn` 近乎不可见）· 非法即静默按默认（静默失效） |
| D17 | **段匹配面 = 项目根相对面**（2026-09-28 · 台账 #465）：面判（根之下 = 剩余段 / 根外 · 根未知 · 含跳段 = 不可判）；面不可判 ⇒ 辅助面不命中（收 fail-open 边）、代码段回落全段（拦截面不缩） | 判据 = 路径在**项目内的位置**——根之上的机器布局不参与；单一实现（段匹配只此一处，消费面零改）；登记候选「仅项目根之下参与段匹配」逐字落地。**否决备选**：◎只面化 aux、代码段仍全段——留「绝对形与相对形不同判」破例，且同根 TMPDIR 假红无解；◎根外一律判 code——凭空新造根外过度拦截（与已登记代价方向相抵） |
| D18 | **项目根随声明对象下发**（`conv.root`）；分类裁判从 `conv` 取根 | 根解析单源（`manifestFilePath` 系——KD-M1-18；消费面不重写根式）；消费面零签名改动（父侧门档 499 行贴 500 硬限 ⇒ 零改是硬要求）。**否决备选**：◎消费面各自解析根（六消费面各加读根行 + 四谓词扩参——判据双源风险）；◎非枚举字段 / WeakMap 旁挂（隐式字段——检查器与日志不可见，调试面劣化） |

## 5. 测试面

| 档 | 覆盖 |
|---|---|
| `thincoder-cli/test/portability-classification.test.mjs` | 分类裁判（正常 / 嵌套布局反证 / 声明替换 / 分隔符与祖先段 / 声明档损坏 / 门禁三态）+ **F9 辅助面缺省（T-26 四例读数含 `src/test/**` 反例 · T-27 门放行与仍拒 · T-28 eng-coder 门零变）** |
| `thincoder-cli/test/portability-index.test.mjs` | walk 回退 / 跳过规则 / 截断 / 扩展名声明与未列入可见化 |
| `thincoder-cli/test/portability-advisor-context.test.mjs` | 项目上下文注入与降级句 |
| `thincoder-cli/test/cmd-eng.test.mjs` | `/eng` 无前提开启 / OFF 语义零回归 |
| `thincoder-vscode/test/portability-vsc-classification.test.mjs` | VSC 分类裁判（正常 / 嵌套反证 / 声明替换 / 损坏回退 / 门禁三态）+ **F9 同判读数（T-V22 四例 · T-V23 门放行与仍拒 · T-V24 子门零变）** |
| `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs` | VSC 项目上下文注入与降级句 |
| `thincoder-vscode/test/portability-vsc-index.test.mjs` | VSC 扩展名声明与未列入可见化（W8 已退役——用例核面承接入 `thincoder-vscode/test/memory-index-face.test.mjs`；机制见 `docs/core/design/MEMORY.md` §6.9） |

> **声明载体换源批（2026-09-27 · 本批）用例面**：既有面**同号收正**（同题断言对象换 = `PROJECT-MANIFEST.json` 三族键；CLI T-01 / T-03 / T-04 / T-05 / T-09 · VSC T-V01 / T-V03 / T-V04 / T-V05）。 （机检豁免——用例退场登记）
> 新增用例（编号本席定——避撞实核 2026-09-27；核心面 T56–T58 落点 = `MANIFEST.md` §3.2）：

| 用例 | 面 | 断言（判据线） |
|---|---|---|
| T-29 | 分类·核 | 无档逐条等值：`loadProjectDeclaration` 输出 deepEqual `DEFAULT_DECLARATION` + 四值读数 |
| T-30 | 分类·核 | 旧档在场：内容零生效 + 一行告警（哨兵未生效判定）+ **基准断言**（旧档落项目根、cwd 深于项目根 ⇒ 仍命中——基准 = `manifestFilePath`） |
| T-31 | 分类·核 | 档非法 / 形态错 ⇒ 默认 + warn + 不抛 |
| T-32 | 注入·核 | manifest `advisor.docMap` / `standardsDoc` 声明生效（返回声明路径） |
| T-V25 | 分类·VSC | 同判：无档逐条等值 |
| T-V26 | 分类·VSC | 旧档在场同判：零生效 + 告警 + 基准断言（同 T-30） |

> **F9 承诺**：既有 portability 用例**零改全绿**——aux 规则置于 temp / doc 之后（§3.2 优先级），对既有用例的全部输入分类逐条不变（唯曾落兜底 code 的辅助面路径改判 aux）。

**F9 新增用例（编号本席定——避撞实核 2026-09-27）**：

| 用例 | 面 | 断言（判据线） |
|---|---|---|
| T-26 | 分类·核 | 辅助面四例读数：`test` 段 `.mjs` ⇒ `aux` · `scripts` 段 `.mjs` ⇒ `aux` · `.thincoder/tmp` 序列下 `.mjs` ⇒ `aux` · `src` 段先命中 ⇒ `code`（反例）· `tests` 段 `.md` ⇒ `doc`（≠ code——既有 doc 判据不变）；另含大小写 / 嵌套深度 / `codePaths` 收回三边界 |
| T-27 | 门·核 | 父侧门（工程模式 · 无活槽 · depth 0）：辅助面写放行（**CLI 侧「恰执行一次」需 auto-approve 夹具**——无夹具读数 = 无设计门拒绝句，沿 T-06）∥ `src` 段写仍拒（`design review required`） （机检豁免——用例退场登记） |
| T-28 | 门·核 | eng-coder 无令牌写辅助面路径仍拒——token 门零变 |
| T-V22 | 分类·VSC | 同 T-26 读数（两端同判——VSC 经核单源） |
| T-V23 | 门·VSC | 同 T-27 读数（VSC 父侧门 = 核分类器消费者，端侧零改） |
| T-V24 | 门·VSC | eng-coder 子门零变（同 T-28 的 VSC 载体） |

**段匹配面用例（2026-09-28 · #465）**：

| 用例 | 面 | 断言（判据线） |
|---|---|---|
| T-33 | 分类·核 | 面判读数：报障形（根 = `D:/work/scripts/mytool`，路径 `…/lib/a.mjs`）⇒ code · 反例（根 = `D:/work`，同路径）⇒ aux · 根外绝对形（`D:/proj/docs/a.md`）⇒ doc（T-04 代价保持）· 根内 doc 面（根 = `D:/src/app` 下 `<根>/docs/a.md`）⇒ doc（根之上 `src` 不参与）· 根名段不参与（根 `<tmp>/test` 下 `<根>/x.mjs` ⇒ code）· 含 `..` 段 ⇒ 面不可判（aux 不命中）· 根未知（无 `conv`）⇒ 全段旧判 （机检豁免——用例退场登记） |
| T-V27 | 分类·VSC | 同 T-33 读数（两端同判——VSC 经核单源） |

> **声明对象 `root` 收正（同号）**：等值断言面随形状收正——CLI T-29 / T-30 / T-31 · VSC T-V25 / T-V26（比对 = `{ ...conv, root: null }` 与 `DEFAULT_DECLARATION`——`root` 非声明值）。

## 6. 边界（本档不覆盖）

1. **B / C 家族剩余**（P11–P13、P16–P28 与 🔵 项）——CLI 侧后续批；其中 `thincoder-core/prompts/discipline-normal.md` 的地图引用属已登记 P11。
2. **FR10–FR15 正文搬迁归位**（CLI 侧 `thincoder-cli/docs/_archive/design/ENGINEERING-MODE.md` 旧文 → 需求档）——父侧裁决项。
3. **本仓自指面**（`AGENTS.md` 的检查声明）——父侧落笔。
4. **F9 缺省射程外**（2026-09-27）：CI 配置（`.github/**`）与 `.thincoder/**` 非 `tmp` 面（如 `.thincoder/memory/**`）仍判 code——如需父侧直放 = 另裁（历史「工程工具面被拦」类残余）。

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
| VSC 端镜像实现面 | `thincoder-vscode/src/**` 同类判据 | **已并入（批 6）**——§3.6 坐标 + §5 测试面（VSC 保持独立实现、语义同源——**分类裁判面除外**：W4 已核单源，VSC 经 `thincoder-core/conventions.mjs` 引用（§3.6 W4 状态注）） |
| VSC 批次二档 §1 三态对位表 · §3 逐条修法流水 · §4.4 逐字提示词文本 · §5 受影响文件全清单 · §6 用例 T-V01–T-V19 · §7 验收 AC-V01–AC-V14 · §9 边界 · §10 open-1–3 | 一次性批次材料（对位勘察 / 修法 as-of 行号 / 逐字施工文本 / 用例与验收）+ open 面 | **不并**——对位结论已落 §2–§3（VSC 面 §3.6）；逐字提示词文本 = 产品代码（落 `thincoder-vscode/src/prompts/**`——本体即权威，D2）；open 项归父侧（(d) 类） |
| 实施台账指针（P1–P28 缺陷登记） | 缺陷编号登记面 | 项目台账（`docs/TODO.md`）面——本档只留机制 |

## 变更记录

- 2026-10-04（**issue 修复批·五 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round5.md` §1 · 台账 #835）：§3.1 补 **`index.publicRepos` 入判补登句**（值比较——与 `excludePaths` 同款）。**零新语义**（登记补句）。
- 2026-10-02（**文档清账轮 · 执行轮 2（core/design 后段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：锚面 1 处 R4 形退场（死名 `tool-gates.mjs` 去坐标尾——端档已删）。**零新语义**。

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/design/PORTABILITY.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 择**机制面**重建（分类裁判单源 / 声明面 / 降级契约 / 索引回退 / `/eng` 无前提）；批次范围裁定 · 逐条修法流水 · 逐字提示词文本 · 受影响文件清单 · 用例表与 AC · VSC 镜像面节 → §7 逐项登记不并；
  ② 坐标一律改现状路径并经实核（`thincoder-core/conventions.mjs` 等）；③ 新增 §5 测试面（回指现行测试档）、§8 体量（**该节现不在档——现节 = §1–§7 + 变更记录**，2026-09-27 实核）。
- 2026-09-15（**B 式迁移轮 · VSC 第 6 批 · 并入 · eng-designer**）：新增 §3.6 VSC 端镜像面——自 `thincoder-vscode/docs/design/PORTABILITY.md`（批次二）并入（分类裁判 / 声明面 / 门禁 / 注入 / 索引坐标按现状实核；消息文案逐字本体住产品代码不复制）；§5 补 VSC 测试档三行；§6 边界行 2 收口 + §7.2 登记 VSC 批次材料不并（(d) 类）。
- 2026-09-15（**S2 W4 · VSC 单元**）：§3.6 状态收正——VSC 端镜像实现已删（`thincoder-vscode/src/conventions.mjs`；现体 = `thincoder-core/conventions.mjs`，VSC 经核单源引用）；分类裁判 / 变更集判据两行坐标收正（只落状态行，机制条文零改）。
- 2026-09-15（**S2 W15 · VSC 单元 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W15〔重定版〕）：§3.6 头部加 W15 状态注（装配/注入面核单源化收口；本节坐标逐处实核仍在位——`tool-gates.mjs` · `run-helpers.mjs:71`）；机制条文零改。
- 2026-09-18（**失效表达清理批 · 本批直接执行 · 可 revert**——承用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）：§6 边界表删「VSC 端镜像（已并入批 6）」行（原条 2），余条顺次编号。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。
- 2026-09-27（**工程模式写门放行批 · F9 辅助面缺省** · eng-designer）：§3.2 分类语义扩四值（新增 `aux`——置 temp / doc 之后、兜底之前，既有分类零扰动）；§3.1 补 `codePaths` 收回行；新增 §3.7 消费面核销表 + §3.6 F9 状态注；§4 增 D9–D12；§5 补两端用例表与零改承诺；§6 补射程外行；头部需求侧指针收正到 `docs/core/requirements/PORTABILITY.md`。
- 2026-09-27（**写门放行批 · 评审轮 1 收正 · 父侧直接执行〔例外②③〕 · 可 revert**）：§3.6 F9 状态注证据指针收正（T-V10–T-V12 ⇒ T-V22–T-V24——对齐 §5 用例表）· §3.2 `isAuxPath` 行补消费方注明 · D12 补受影响文件表落点（批档 §2.4）· §5 T-27 补 CLI 夹具注；变更记录 2026-09-15 行「§8」引用加现状注（零语义）。 （机检豁免——用例退场登记）
- 2026-09-27（**conventions.json 退役批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-27-conventions-retire.md` §1 · 用户 2026-09-27 19:39 裁定）：
  声明载体换源——§3.1 改写为 `PROJECT-MANIFEST.json` 三族键（`codePaths` / `index.*Extensions` / `advisor.{docMap,standardsDoc}`；含 `codePaths` 收回行随动）；§2 表三行收正（装载面 / 默认判据单源 / 载体）；
  §3.2 API 表换名（`loadProjectDeclaration` / `clearDeclarationCache` + `DEFAULT_DECLARATION` 行）；§3.4 增退役档可见行 + 门禁指路改 manifest；§3.6 VSC 声明面行同判收正；
  §4 重写 D2 + 增 D13–D16（载体 / 读向 / 退役链 / 校验口径）；§5 增新用例表；§6 射程外示例路径换现行物。机制条文（分类四值 / 优先级 / 降级契约）零改。
- 2026-09-27（**conventions.json 退役批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-27-conventions-retire.md` §3 发现 5 / 6，父侧全数接受）：
  ① 声明对象形状句（§3.2——`{ declared, codePaths, index, advisor }` + `declared` 判据 = 三族任一偏离缺省）；
  ② 退役告警钉死（§3.1 · §3.4——落点 = `loadProjectDeclaration` 内 · 基准 = `manifestFilePath` 项目根 · 频次 = 每缓存一次）+ T-30 / T-V26 补基准断言（§5）。零新语义。
- 2026-09-27（**写门放行批 · 交付后设计面登记轮** · eng-designer——fix 轮；承 `docs/batches/2026-09-27-eng-write-exemption.md` §1.7 裁定〔只报项 1/2/3 + 审计偏离 1 全接受〕）：
  ① §3.2 API 表行 as-of 行号回填（`classifyPath:93` · `isCodePath:103` · `isDocPath:109` · `isTempPath:49` · `isAuxPath:119`——原记 `:73` / `:82` / `:88` / `:40` 收正）；§2 表行同载占位同笔兑现（`loadProjectDeclaration` 拟新增——行号实施轮读回）；
  ② §3.2 增「段匹配含祖先段」双向已登记代价（fail-closed 向 = T-04 注既有登记 · fail-open 向 = 本笔登记）+ 消解路径（候选 · 另批 · 台账 #465 在册）+ 测试面同根读数（TMPDIR 锚定）。零新语义。 （机检豁免——用例退场登记）
- 2026-09-27（**conventions.json 退役批 · 设计评审轮 2 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-27-conventions-retire.md` §3 轮次 2 发现 6）：§3.1 / §3.2 `declared` 判据钉死为**值比较**——与缺省值等值 ⇒ 假（显式写入但值 = 缺省照判假）。零新语义。
- 2026-09-28（**守卫族微修批 · 设计轮** · eng-designer——承 `docs/batches/2026-09-28-guard-face-micro.md` §1 · 台账 #465）：§3.2 段匹配面收口为**项目根相对面**（面判 + 面不可判处置 + 面判读数表 + 测试面同根项收口；「已登记代价 · 双向」与消解候选句随其落定为现行规则）；
  §3.2 声明对象形状句增 `root`（`DEFAULT_DECLARATION.root = null`）；§2 / §3.2 五处 `拟新增` 占位与漂移行号实核回填（as-of 2026-09-28）；§4 增 D17 / D18；§5 增 T-33 / T-V27 + `root` 收正句。
- 2026-09-28（**守卫族微修批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-28-guard-face-micro.md` §3 轮次 1 发现 2 / 6 / 8 / 11 / 12）：
  §3.2「单一实现面」条收口三谓词与面判链关系（含 `isTempPath`）+ API 表行 4 同指；§7.2 登记行括注限定非分类裁判面；§2 行补档级行数（244 行 ⇒ 本批 ≈275 行）+ 批档 §2 指针；档头 as-of 补 2026-09-28 一枚；§5 T-33 补根内 doc 面读数（共七读数）。零新语义。
