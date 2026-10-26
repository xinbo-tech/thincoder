# 项目状态档 manifest（MANIFEST）· 工程模式 v2 模块设计（M1）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M1）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md`
> 写权 = eng-designer（设计档唯一作者）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求

本模块落一个**纯机器状态 JSON 声明档**（`PROJECT-MANIFEST.json`）在**项目根（= 带档目录——发现梯五级见 §2.2；**git 非前提**；用户裁定）**，机制代码在核（`thincoder-core/manifest.mjs`），操作对象 = 被开发项目自己持有的数据档。

一次声明、多处读取：文档体系落点（`docRoot`）与情境旋钮（`phase`）全部从这一处取——机制不硬编码任何本仓路径（v2 §5.1 · §6 · §9）；其中 `phase` 另经**情境行**进模型上下文（§2.6）。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | schema 五键：`version` · `phase` · `docRoot` · `codePaths` · `index`（后两键 = 项目声明族——FR42） | ②.1（规格侧同步 = 父侧） |
| F2 | 读 / 写 / 校验器：`thincoder-core/manifest.mjs`，操作对象 = **每个项目（= 带 manifest 的目录）一份** `PROJECT-MANIFEST.json`（发现梯五级：① 锚自身带档 ⇒ 锚 ② 锚含 `.git` ⇒ 锚 ③ 直接子目录带档优先 ④ 零带档才看裸仓 ⑤ 均无 ⇒ 无项目；**git 非前提**——用户裁定） | ②.2 · §⑥ |
| F3 | 缺档处置（**按用点**）：需要项目参数的动作发现目标项目缺档 ⇒ 该动作报明并走协助建档（**项目落地 = 建 manifest——轻动作**）；`git init` = **可选增强**（经确认提供，非入场券）；**任何情况不砖死**（会话照常起） | ②.3 · §⑥ |
| F4 | 缺键 fallback：manifest 存在但缺某键 → 用默认值（不拒绝）；`docRoot` / `index` 子键缺与整键缺同语义 | ②.4 |
| F5 | 写门：唯一作者 = 主 agent（非主 agent 写 → 拒） | ②.5 |
| F7 | `docRoot` **值形态**：非空字符串（单根）或**非空字符串数组**（多根——一个文档层跨多个根目录） | 用户裁定 |
| F8 | **agent 工具面**（读 / 建 / 写全键族 + 目标面 + 权限面——用户裁定）：主 agent 对 manifest 的读写出口（`manifest` 工具——详 §2.10） | ②.7 · ③ · ④ AC-M1-10–12 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零依赖 | 只用 `node:fs` / `node:path` + 标准库 `JSON.parse`（无第三方解析器、无 `node:sqlite`） |
| N2 | 可机判 | 校验器输出结构化 `{ok, errors}`，判据机械判（枚举 / 键存在），禁散文判据 |
| N3 | 可迁移 | 不写死本仓路径——`docRoot` / `codePaths` / `index` 由被开发项目声明（架构 §2.3 E2） |
| N4 | 不静默 / fail-closed | 整档缺失**不静默 fallback**（报明 + 建档流——不砖死；AC-M1-2）· 档非法不拒会话（报明；KD-M1-25）· 写门默认拒（AC-M1-5） |

### 1.4 范围边界（本模块不做）

- 不做台账（M2）；不做机检（M8）；不做批次档写入（M3）。
- 不替被开发项目创建目录；不做交互式初始化问答（初始化流程归两端壳面，本模块只提供读写校验）。
- 不承载「待裁 / 决策」类内容（manifest 是纯机器状态，决策进文档）。
- `docRoot` 值形态 = 非空串 | 非空串数组——不动 `REVIEW_ROOT_KEYS` 五键集合、不纳入参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）。
- **既有三键**（`version` / `phase` / `docRoot`）的判据取值、`REVIEW_ROOT_KEYS` 键集、评审机制其他面（token 门 / 批档门 / 门序 / 冻结窗口）零碰；**声明族键**（`codePaths` / `index`）为本模块 schema 的现行键（形态 / 缺省 / 校验 = §2.2 + §2.4 KD-M1-31/M1-32；声明语义 = `docs/core/design/PORTABILITY.md` §3.1）。
- **agent 工具面**：单目标逐次调用——不做批量自动发现；不做 CLI 子命令（人面另议）；不替代既有装配侧调用点（翻转 ∥ 情境行 ∥ 钩子照旧零动）；不做键删除动作（`docRoot.*` 的「本面无」= 写 `null`——KD-M1-37 既有表达）。

## 2. 设计层

### 2.1 方案与理由

存储格式 = JSON 已在架构 §2.1 选型 #2 裁定（标准库 `JSON.parse` + schema 校验即可机检，无第三方解析器）。本模块只做**读写校验机制 + 两端装配钩子**，无新格式选型。

**核心方案（就机制本身说清为什么）**：

1. **schema 落成校验器常量**（`MANIFEST_SCHEMA` + `DEFAULT_MANIFEST`）：枚举（`phase`）、键存在（`docRoot` 五键、`index` 子键）、形态（`docRoot` 子键值形态 + 两族声明键形态——KD-M1-32）由校验器机械判——判据单源，读面（下游 M2–M9）与写门（本模块）同用一处；**校验器不读 fs**。
2. **整档缺失 vs 缺键两分**：整档缺失 = **不静默 fallback**（`readManifest` 返回 `{ok:false, reason:'missing'}`）⇒ 壳面 / 动作侧**报明并走建档流**（梯②⑤ 就地建档——会话照常起；KD-M1-25 / M1-29）；缺键 = **便利 fallback**（用默认值补，`{ok:true, missingKeys:[...]}`）。这两分对应规格 ②.3 / ②.4，不可混（整档缺失绝不能静默 fallback）。
3. **写门 = 校验器内 `writeManifest` 的 `writer` 上下文**（fail-closed）：`writeManifest(cwd, manifest, { writer })` 仅在 `writer === 'main'` 时放行，缺省 / 其他值一律拒。主 agent 经 M1 读写装配调用；子代理只有读出口（只读变体——§2.10.1）、无写调用路径（其二道防线 = M5 spawn 门 `files` 域排除 `PROJECT-MANIFEST.json`——见 §2.5）。
4. **初始化 = `initManifest` 写默认档**：只提供机制（写默认五键档），不包交互问答（问答归壳面）——与规格 ③ 边界一致。落盘走同一写门（内部 `writeManifest(cwd, DEFAULT_MANIFEST, { writer })`，缺省拒——与 AC-M1-5 同一闸，无第二条写路径）。
5. **`docRoot` 值域扩为「单串 | 多根数组」**（F7）：一个文档层（如 `design`）可跨多个根（`docs/core/design` + `docs/cli/design` + `docs/vsc/design`）——**值形态决定语义**：串 = 该键取此路径；数组 = 该键取这些路径（**完整声明**，不与默认合并）。
   解析管线（展开 / `trim` + `\` 归一 / 基数 = 项目根 / 去重保序）与形态判据**同落 M1 一处**（`docRootPaths` / `isValidDocRootValue`），消费面只经该谓词取值——判据单源（KD-M1-8）；非法形态 → 校验拒（KD-M1-7，不静默跳过）。详见 §2.7。

### 2.2 架构 / 接口 / 数据流契约

```text
产品启动（CLI make-agent 装配 / CLI 启动恢复 / VSC hydrateRun 每轮） ─► 模式门：会话权威值 engineering === true ?
  ├─ 否（普通会话）→ 装配钩子零 manifest I/O（不读 / 不拒 / 不建档）→ agent.manifest = null → 正常循环
  └─ 是（工程模式会话）→ projectView(cwd)（读侧单点——**非抛错 / 零写**，KD-M1-24）——**启动零拒绝**（KD-M1-25）

       ├─ 档合法 ─────────► 附着（agent.manifest ← 档内容）→ 正常循环
       ├─ 项目缺档 ───────► 轻动作：initManifest(writer:'main')（内容 = DEFAULT_MANIFEST）→ 附着 → 正常循环
       │                    适用：梯②（锚 = 裸仓）· 梯⑤（无项目 ⇒ **在锚处落地**）——git 非前提

       ├─ 锚 = 工作区（下辖 ≥1 项目）─► **不建档 / 不猜**（state: workspace + candidates——工作区常态，非错误态）
       └─ 档非法 ─────────► 不拒（state: invalid + errors）
    非 ok 态（工作区 / 档非法 / 建档失败）⇢ 会话照常起；需要项目参数的动作各自报明（情境行 §2.6 · 机检 fail-closed · 评审落点 / 台账按路径解析）
```

**接口（`thincoder-core/manifest.mjs`，全新增）**：

- `MANIFEST_REL` = `"PROJECT-MANIFEST.json"`（常量）。
- `manifestFilePath(cwd)` → `string`（**新增**——档路径**单源** KD-M1-18）：`join(writeRoot(cwd), MANIFEST_REL)`（项目根优先解析，与读 / 写 / mtime 门控三处同源）。`readManifest` / `writeManifest` 两处既有同式（`join(root, MANIFEST_REL)`）改用之——**零语义**（`writeRoot` 保留）。
- `discoverProjects(cwd)` → `{ kind, root, candidates, matched }`（**新增**，KD-M1-23——**项目梯（git 非前提）**，五级）：`kind` ∈ `self`（梯①②——锚自身即项目）/ `none`（梯⑤）/ `workspace`（梯③④命中 **≥1** ⇒ `root: null` + 该级 `candidates` 全列**按名排序**——「锚的直接子目录即为项目」= 多根工作区，1 ∥ 2 ∥ 更多同判，非错误态）。
  梯序：① 锚自身带 `MANIFEST_REL` ⇒ 锚；② 锚含 `.git` ⇒ 锚；③ 直接子目录中**带档**者优先（非空即只看此级）；④ **零带档时才看**含 `.git` 的裸仓；⑤ 均无 ⇒ 无项目（梯 ①–④ **只认「已存在」信号**——全新目录必走 ⑤ ⇒ **走建档流**）。`matched` 记命中出自哪一级。
  **纯 fs**（只判存在性——不解析档内容）· **不抛**（锚不可读 ⇒ `none`）· **不向上遍历** · **不递归**（只看直接子目录一层）。

  **覆盖位**（`_setProjectRootForTest` 在场）⇒ **头部短路** ⇒ `{ kind:'self', root: resolve(_projectRootOverride), candidates: [], matched: null }`（测试注入面——短路先于真判据，同 `discoverRepos`；见下方「覆盖位定形」）。
- `discoverRepos(cwd)` → `{ kind, root, candidates, matched }`（**既有符号**，KD-M1-23）：**仓梯**（`git` 工具的视图）——① 锚含 `.git` ⇒ 锚；② 直接子目录中 `.git` ∧ 带档者恰一 ⇒ 命中（≥2 ⇒ `workspace`——下辖多仓 = 常态）；③ 零个此类时才看含 `.git` 的裸仓（恰一 ⇒ 命中；≥2 ⇒ `workspace`）；④ 均无 ⇒ `none`。
  与 `discoverProjects` = **同一 walk 内核的两种梯表**（单源，KD-M1-22 零改——禁两份实现；A20 机判面保持）；git 工具经本符号接线（其行为变更面见 `docs/core/design/TOOLS.md` §6.13）。
  **单源结构**：两梯共调**模块私有内核** `scanChildren(anchor, isHit)`（枚举直接子目录 + 按名排序 + 谓词过滤 ⇒ `hits`）——两梯差异**只**落谓词与级序表。

  **机判**（模块内结构断言 = T54）：源码面 `readdirSync` 全档恰 1 处 ∧ 居 `scanChildren` 体内 ∧ `discoverProjects` / `discoverRepos` 两函数体各含 `scanChildren(` 调用（读点 = `thincoder-core/manifest-discovery.mjs`）。
- `resolveProjectRoot(cwd)` → `string|null`：**归属形**的薄包装（`owningProject(cwd)`——KD-M1-24 / M1-30）。
   **取值（KD-M1-23 / M1-30）**：① 路径**自身所在目录**带档 ⇒ 该目录；自身不带档 ⇒ **上溯**取最近带档祖先（子目录归到自己的项目根——这是正常通路，不是兜底）；② 祖链无档 ⇒ `null`——**不向下取根**（下辖带档子目录 ≥1 ⇒ `workspace` 且 `root` = `null`；发现读数不进 `root`）。

  `none` / `workspace` ⇒ `null`。调用方分两类：`manifestFilePath` / `docRootBase` 走本解析（随语义变更）；**台账面不走本解析**——键与库路径由 `resolveLedgerRoot` 单点推导（见 LEDGER.md §2.1 / §3.8）。
- `projectRootView(target)` → `{ state, root, candidates }`（**新增**——`thincoder-core/manifest-discovery.mjs` 新导出，经本档 `manifest.mjs` 转口）：**项目根解析的直读形**——`state` ∈ `'ok'`（**仅归属命中**——`owningProject(target, 目标所在盘根)` 非 `null`；**唯一出口**）/ `'workspace'`（归属无命中 ∧ `discoverProjects` 报 `workspace`：下辖带档者 ≥1 ∥ 零带档时裸仓 ≥1——**多根工作区常态，非错误态**）/ `'none'`（其余——空目录 ∥ 裸仓锚：**不向下取根**）；非抛错 / 零写。
  **界**：传给 `owningProject` 的 `boundary` = **目标所在盘根**（`parse(resolve(target)).root`）——向上无界，不是 `process.cwd()`、不是会话锚。

  理由是「目标由调用方指名」：锚自身即目标时其项目根在上层，仍须爬到（需求 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74`）。界比较按段归一（`manifest-discovery.mjs` `isInsideOrEqual`）。

  `ok` ⇒ `root` = 归属命中的目录、`candidates` = `[]`；`workspace` ⇒ `root` = `null`、`candidates` = 下辖项目全列**按名排序**（同 `discoverProjects` 契约，**恒非空**——≥1 即成立）；`none` ⇒ `root` = `null`、`candidates` = `[]`。**发现读数只供 `workspace` 报明**：`discoverProjects` 的 `self` 结果**不进 `root`**（判据单源 = `owningProject`）。

  **态名（用户裁定「cwd 下面有多仓是常态」）**：`'workspace'` = **多根工作区**——锚的直接子目录即为项目（≥1）是常态，不是异常、不是候选二义；唯一的解析律 = **用点路径 → 自身所在目录带档即命中，否则上溯取最近带档祖先**（§2.5「单项目解析律」条）。
  **覆盖位**（`_setProjectRootForTest` 在场）⇒ 头部短路 ⇒ `{ state:'ok', root: resolve(_projectRootOverride), candidates: [] }`（同 `discoverProjects` 短路形）；

  **薄委托等价句**：`resolveProjectRoot(cwd)` ≡ `projectRootView(cwd).root`——结构等价，行为随 `projectRootView`（取根臂 = 仅归属命中：下辖带档子目录 ≥1 ⇒ `workspace` 且 `root` = `null`；含覆盖位短路；回归守卫 = 单元测试档——基座三态 ∥ 覆盖位 ∥ 薄委托等价逐格）。
  消费面接线 / 工作区语义 = §2.5「单项目解析律与四处会话级缺省收口」条（互指）。
- `owningProject(target, boundary)` → `string|null`（KD-M1-30——**归属形单点 = 判据本体**，纯 fs：只判 `MANIFEST_REL` 存在性——不解析档内容 / 不问模式）：自 `target`（目录 = 自身；文件 = 其所在目录）沿祖先链上溯，取**最近**带档目录 ⇒ 该目录；不带 ⇒ `null`。`boundary`（缺省 = `process.cwd()`）= **上溯上界**：`target` 落在界外 ∥ 是界的祖先 ⇒ `null`（用户 2026-10-25 19:09「不能跑到工作目录以外去」）。**上界由调用方定、两面各异**：取根面（`projectRootView`）传 **目标所在盘根**（向上无界）；台账面（`resolveLedgerRoot`）传 **会话锚**（`docs/core/design/LEDGER.md` §3.8「界（单源）」）。
   **上溯界内一路到锚**：会话落在项目内层子目录时，这一路正是它归到自己项目根的通路（用户 2026-10-23「本来就该爬到项目根啊」）；**以会话锚为界、越界即停**（用户 2026-10-25 19:09「不能跑到工作目录以外去」）。发现梯照旧**纯向下**（只看直接子目录一层），多根工作区锚不会被挂到外层项目上。**覆盖位**在场 ⇒ **头部短路** ⇒ 直接返回 `resolve(_projectRootOverride)`（不查档存在性；见下方「覆盖位定形」）。
- `projectView(target)` → `{ state, root, path, manifest?, candidates?, errors?, message?, matched }`（**新增**，KD-M1-24 / M1-30——**按用点解析**的读侧单点，**非抛错 / 零写**，无缓存）——**两段合成**：
  · **归属（第一段——§⑥ 归属形）**：`owningProject(target, 目标所在盘根)` 自 **target** 起（目录 ⇒ 含自身；文件 ⇒ 取其所在目录）**上溯取最近带档目录**（**界与本档 `projectRootView` 同源 = 目标所在盘根**——同一 target 两面同归属，非会话锚）（**不跨兄弟** / **无全局优先级**；嵌套合法 = 子项目自身带档 ⇒ 归子，外层根不再收其内层路径）。命中 ⇒ 读该档 ⇒ `ok` / `invalid`。

  · **发现兜底（第二段——§⑥ 发现规则，纯向下）**：祖链无档（`owningProject` ⇒ `null`）⇒ `discoverProjects(target)` ⇒ `self` ⇒ 读其档（带档 ⇒ `ok` / `invalid`；缺档 ⇒ `missing`）；`workspace` ⇒ `workspace`（+ `candidates`——下辖带档者 ≥1 即此态，不择子目录）；`none` ⇒ `no-project`。
  写侧（建档）**不在**此函数（归入口决策树——KD-M1-25 / M1-29），故注入器 / 只读消费面不会变写点。

  · **`matched` 契约**：命中（或工作区）出自哪一级——归属段命中 ⇒ `'manifest'`；发现段 ⇒ `discoverProjects.matched` 逐字（`manifest` / `git`）；`no-project` / 覆盖位短路 ⇒ `null`——报明行工作区变体按它分野（§2.6 条 1b）。

   · **覆盖位定形**：`owningProject` 与 `discoverProjects` **两处头部短路** ⇒ 覆盖在场时 `resolveProjectRoot` · `projectRootView` · 台账 `resolveLedgerRoot` · `projectView` 均**不落真判据**。
    「覆盖即覆盖值」语义保持（回归守卫 = 单元测试档覆盖位用例：`_setProjectRootForTest(base)` ⇒ `resolveProjectRoot("ignored") === resolve(base)`）。
- **新增名核查（三问 · 名字 / 住哪 / 谁用）**——体例同 `docs/core/design/ADVISOR-GUARDS.md` §12「拒因命名三问」，逐名一行：
  - `discoverProjects` — `existing: thincoder-core/manifest-discovery.mjs:55`（导出）· 消费 = `projectRootView` 第二段（同档 `:142`）+ `projectView` 发现兜底。
  - `projectRootView` — `existing: thincoder-core/manifest-discovery.mjs:142`（导出，经 `thincoder-core/manifest.mjs` re-export）· 消费 = `thincoder-core/agent-tools/batch-paths.mjs:29` · `thincoder-core/agent-tools/manifest.mjs:151` · `thincoder-core/agent/review-facts.mjs`（`state !== "ok"` 单判据）。
  - `workspaceCandidates` — `existing: thincoder-core/agent-tools/batch-paths.mjs:28`（模块私有、非导出）· 消费 = 同档 `:59` / `:108` / `:169` 三处。
  - 态名 `workspace` — `existing: 本档 §2.2 `projectRootView` 契约行`（`state` ∈ `ok` / `workspace` / `none`）· 逐字名 `workspace`；消费 = 报明行构造 + `projectView` 五态。
- `MANIFEST_SCHEMA`（对象：`phase` 枚举、`docRoot` 五键存在、`index` 子键存在、`version` 数值、**声明族键形态**——KD-M1-32）。
- `DEFAULT_MANIFEST`（对象：默认五键——`version:1`、`phase:"initial-dev"`、`docRoot` 默认五路径、`codePaths:["src"]`、`index:{codeExtensions:[],docExtensions:[],excludePaths:[],publicRepos:[]}`）。
- `readManifest(cwd)` → `{ ok, manifest, missingKeys, unknownKeys, errors, reason }`：读 + `validateManifest(obj)`；缺键 → 产 `missingKeys`（非拒）→ 补默认值 → 再校验通过；整档缺失 → `{ok:false, reason:'missing'}`。**未知键（#802）**：产 `unknownKeys` + 读面一行可见告警（含键名；同档同键集去重）——非拒定性零变、搬运语义零改（KD-M1-11 / M1-36）。
- `validateManifest(obj)` → `{ ok, errors, missingKeys, unknownKeys }`：形状校验（枚举 / `version` 数值 / 键存在 / **`docRoot` 子键值形态**——F7 / **两族声明键形态**——KD-M1-32）+ **未知键产线**（KD-M1-36——非拒）；**纯函数、不读 fs、不落盘**。
- `requireManifest(cwd)` → 装配钩子入口 = `readManifest(cwd)`：`ok:true` 返回补默认值后的 manifest；`reason:'missing'` 由调用方走**建档流**（**工程模式会话**口径——梯②⑤ 就地建档，**不拒会话**；KD-M1-29）；模式门 + 建档分支见下方两端装配钩子）。
- `resolveEngineeringManifest(cwd, { writer = 'subagent', init = true })` → **非抛错**的入口决策树（§2.8 F1）：
  `{ ok:true, manifest, created }` \| `{ ok:false, code:'missing' \| 'invalid' \| 'no-project' \| 'workspace' \| 'init-failed', message?, errors?, candidates? }`——入口钩子（**读侧已不抛**——KD-M1-25/28）与翻转面（拒翻）**共用同一张树**（判据单源，KD-M1-20）。

  **`ok` 的语义 = 「本次是否附着 manifest」，不是「调用是否成功」**：树**不抛**，故 `ok:false` 只说明没有可附着的档——`missing` / `no-project` / `workspace` 三枚是正常态读数（各带下一步），`invalid` 是档面拒格，`init-failed` 是唯一异常类（建档动作抛错 = 调用点漏传 `writer:'main'`）。调用点按 `code` 分支，不把 `ok:false` 当故障。

  态码（KD-M1-28）：`no-project`（梯⑤）与 `workspace`（下辖 ≥1 项目 ⇒ `candidates` 在册）——两态文案不同（无项目 ⇒ 可在锚处落地；工作区 ⇒ 报明事实 + 点名项目根），单码装不下报明面。

  **翻转面处置**：`workspace` **不拒翻**——放行（`agent.manifest = null` + 情境行走事实行 + `agent._projectView` 记态）；可拒面 = **仅「档非法」**一格（用户裁定）；入口钩子面**零改**（「启动零拒绝」既有语义已含非 ok 态）。

  **`init:true` 的建档面（KD-M1-29）**：梯②（锚 = 裸仓）· **梯⑤（无项目 ⇒ 在锚处落地）** 缺档 ⇒ 就地建档；梯③④ 命中 ⇒ `workspace`（报明、零建档——不向下取根）；档非法 ⇒ `{ok:false}`（**不建、不猜**）。故 `no-project` 仅 `init:false` 可达（VSC `depth > 0`）。
- `isValidDocRootValue(value)` → `boolean`（F7）：`docRoot` 子键**值形态判据**——非空字符串（`trim` 后非空）| 非空数组且元素皆非空字符串（**同款口径**：元素 `trim` 后非空）| `null`（**「本面无」合法哨兵**——#944）；其余（空串 / 空白串 / 空数组 / 数组含非串 / 空串 / 空白串元素 / 非串非数组〔数 / 对象〕）为非法。
- `docRootPaths(value, cwd)` → `string[]`（**新增**，F7）：`docRoot` 子键值 → **绝对路径数组**——展开（串 / 数组统一成列表）→ 逐元素 `trim` + `\` 归一 → `resolve(docRootBase(cwd), p)`（基数 = 项目根）→ 去重（保序）；非法形态 → `[]`（零根——拒面在 `validateManifest`）；`null`（本面无）→ `[]`（**合法零根——非错**——#944）；两处共用 `isValidDocRootValue`，判据单源 KD-M1-8）。
- 缺键 fallback 粒度：顶层键缺 → 补默认值；`docRoot` / `index` 子键缺 → 与整键缺**同语义**（补该子键默认值 + `missingKeys` 记子键路径），不拒。
- `initManifest(cwd, { writer = 'subagent' } = {})` → 经写门（内部 `writeManifest(cwd, DEFAULT_MANIFEST, { writer })`）写 `DEFAULT_MANIFEST`；缺省拒（fail-closed），返回 manifest。
- `writeManifest(cwd, manifest, { writer = 'subagent' } = {})` → 落盘前先 `validateManifest(manifest)`（`ok:false` → 拒落盘，防写非法档）；仅在 `writer === 'main'` 时落盘，否则拒（fail-closed）。

**两族声明键（用户裁定「必须的功能并入 project-manifest」）：**

- `codePaths`（**顶层平级键**）：路径**段名**数组（任意深度匹配）；**声明即替换**默认（默认 `["src"]`——非并集）；空数组 = 合法（明确「无段名代码面」——与 `docRoot` 空数组拒面有意不同：`docRoot` 空 = 文档层静默消失，`codePaths` 空 = 段面收空而兜底分类仍在）。
- `index`（嵌套对象）：`codeExtensions` / `docExtensions`（各自缺省 `[]`）；对内置扩展名表**追加**（并集，只增不减）；`excludePaths`（缺省 `[]`）= 项目根相对路径**前缀**数组（首部 `./` 剥离 · `/` 归一 · 去尾斜杠 · 去重保序；前缀命中 = 恰等 ∨ 后随 `/`——索引用途 = `MEMORY.md` §6.14 面①）；
  `publicRepos`（缺省 `[]`）= **公共仓路径数组**（**从本仓根可解析**——相对 ∥ 绝对同收，同级 `../` 合法；归一 = 首部 `./` 剥离 · `/` 归一 · 去尾斜杠 · 去重保序；元素层宽容 ∕ 数组层 fail-closed）。

  **用途 = 公共仓索引接入 ∥ 跨仓引用解析**（值形 ∥ 解析单一定义 = `declaredPublicRoots`；机制 = `MEMORY.md` §6.15 · 引用解析序 = `docs/core/design/DOC-DISCIPLINE.md` §4.2.2 · 记录面例外 = `docs/core/design/LEDGER-SELF-CONTAINED.md` §4.1）。
- 形态判据（`validateManifest`，**非法即 `errors`——与 `docRoot` 子键同款**）两层分列：
  · **元素层**：`codePaths` / `index.{codeExtensions,docExtensions}` 各元素须为非空字符串（`trim` 后非空）；`index.excludePaths` / `index.publicRepos` 元素层宽容（空 ∕ 非串元素由归一剔除——数组层仍 fail-closed）。
  · **数组层**：`codePaths` / `index.*` 数组**自身可空**（`[]` 合法）——空数组语义逐键：`codePaths:[]` = 无段名代码面（合法）；`index.*:[]` = 追加零项 ∕ 排除零项（合法，即默认）。
- 缺键 fallback（F4 同语义）：两族键 / 其子键缺 → 补默认值 + `missingKeys` 记键路径（不拒）。
- **读向（单源）**：`thincoder-core/declaration.mjs`（声明装载面；经其转口可达）经 `readManifest` / `manifestFilePath` 投影两族键（`loadProjectDeclaration(cwd)`——该档 → `manifest.mjs` 单向；本模块保持叶子零项目依赖——KD-M1-33）。

**两端装配钩子**：

**模式门（判据单源——会话权威值优先）**：`engineering === true`，其中 engineering 取**会话权威值** = 「恢复槽带 `engineering` 字段 ? 槽值 : `config.agent.engineering`」（**槽优先 + config 回退**；语义同源 = 情境行注入判据②，`thincoder-core/agent/setup-reminders.mjs:82`）。
取值点三处（同一合并结果，非三份判据）：

  · ① **CLI 装配期**——`bin` TUI 分支的 `resumeSlot` 记录以 `slotData` 形参进钩子（装配期 `bin:306` 早于 `applySession` `:320`，槽值只能这样进）；
  · ② **CLI 重估点**（`applySession` 之后）——`agent.config.agent.engineering` 已由 `applySession` 按槽订正（`thincoder-core/session-lifecycle.mjs:86`）；

  · ③ **VSC `hydrateRun`**——`agent.config.agent.engineering` 已由 `applySlotSessionState` 按槽订正（`thincoder-vscode/src/agent/agent-state.mjs:88-91` 三级优先）。
非工程模式 → 钩子整体不执行：**装配钩子零 manifest I/O**（不读 / 不拒 / 不建档）+ `agent.manifest = null`（清残留附着——复用 agent 跨模式防陈旧）。
下游仍读盘的消费面另有其族（任何模式照读）——见 §2.5「普通会话的读面边界」条（零改）。

- CLI：钩子体抽为导出函数 `attachManifest(agent, { cwd = process.cwd(), slotData } = {})`（`make-agent.mjs`），在**会话起点**调用（幂等——重估即重读，无状态位）：
  ① **装配期**（`assembleAgent({ excludeTools, slotData })` 的 `createAgent` 之后——`:135`，附着 `agent.manifest`）：**判据取会话槽值**——`bin` TUI 分支把既有 `resumeSlot` 调用（现 `:315`）提至装配之前，恢复记录以 `slotData` 形参传入（同进程同一调用 ⇒ **零新增写动作**；时序提前——装配失败路径下槽已认领）。

     · **不在钩子内调用 `resumeSlot`**（KD-M1-15）：该函数**非纯读**——`scheduleSessionGC` + `claimSlot`（写 `slotSessions` / 翻共享 `active`）+ `writeEndMarker`（`thincoder-core/session.mjs:44` / `thincoder-core/session-slots.mjs:139`）；钩子内调用会让 `chat` / ACP 装配路径凭空认领会话槽（禁扩大面）。

     · `chat` / ACP 装配不传 `slotData` = 无会话 ⇒ config 回退（无权威槽值可取）。
  ② **重估点**（`bin/thincoder.mjs` 启动恢复块之后——`agent._slot = slot` `:330` 与 `startTUI` `:343` 之间）：一行 `attachManifest(agent)`。

     · CLI 的工程模式权威值 = 会话槽（`thincoder-core/session-lifecycle.mjs:86`；`/eng` 只写槽不写 config.json——`cmd-eng.mjs:61-78`），装配期（`bin:306`）早于会话应用 ⇒ 恢复的工程会话在此重估。
     · 此时 `agent.config.agent.engineering` 已由 `applySession`（`thincoder-core/session-lifecycle.mjs:86`）按槽订正 ⇒ **与 ① 同值 ⇒ 幂等重估**（值同 ⇒ 无副作用）。

  缺失处置（KD-M1-25 / M1-29）：项目缺档（梯②⑤）→ `initManifest(cwd, { writer: 'main' })`（轻动作——**项目落地 = 建 manifest**；梯⑤ 落点 = 会话锚）；**工作区 / 档非法 / 建档失败 → 不抛**——`agent.manifest = null` + 记 `agent._projectView`（会话照常起；需要项目参数者报明——§2.6 / §2.9）。启动**零拒绝**（用户裁定）。

  **`agent._projectView` 形状**：= `projectView(target)` 返回面 **+** `created`——`{ state, root, path, manifest?, candidates?, errors?, message?, matched, created }`；各键在场规则同 §2.2 `projectView` 契约；`created` = **建档标记**（本次钩子调用执行了 `initManifest` 轻动作 ⇒ `true`，其余 ⇒ `false`）——即 T26 的断言。

  **可观察后果**：拒 / 建档现发生于 memory sync / MCP 连接 / 工具装配（`:78-133`）之后 ⇒ 拒绝路径已付出这些启动成本（可观测量：拒绝时 stderr 可能已有 MCP 警告、退出前多耗连接超时）；功能等价——拒点仍在进入正常循环之前（未进交互循环）。
- VSC：`hydrateRun`（`thincoder-vscode/src/agent/setup.mjs:96`）钩子块（`:371-396`；模式门 `if` = `:378-396`）**块首加模式门**——判据 = `agent.config.agent.engineering`，已由 `applySlotSessionState`（`:242-246`）按槽订正（槽优先 + config 回退的同一合并结果；VSC 每轮 reconcile = 已是会话起点，无并列第二点）；
  缺失 + **`depth === 0`** → `initManifest(..., { writer: 'main' })`（同 CLI——梯②⑤ 两格）；`depth > 0`（子代理水合同经此钩）仅不初始化（`init:false`——写门缺省拒已机械兜底）；工作区 / 档非法 → 同款非 fatal（不抛 + 记 `_projectView`）——**两端同形**。
- **运行期值刷新**：附着决策**仍只在会话起点**（KD-M1-12 / KD-M1-13 零改）；已附着会话的 `agent.manifest` **值**改由注入器每回合 mtime 门控重读（§2.6 ③b）——落地「CLI 会话内改档 ⇒ 下回合情境行更新」。**两分不混**：钩子管附着，注入器管取值。
- 行号 = as-of 参考（D4——落点以函数名为准）。会话起点（ACP 装载）与进程内翻转（CLI `/eng` ON · `/session` 切槽 · 核心 `eng` 工具）的重估——两族**两分记**见 §2.8。

### 2.3 受影响文件全清单（as-of 实测（`\n` 计数））

| # | 文件 | 当前行数 | 变更 | 编辑点（函数级） | 增量 |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/src/cli/make-agent.mjs` | 197 | 修改 | 内联 M1 钩子块（`:42-64`）抽为导出 `attachManifest(agent, { cwd, slotData })` + 块首模式门（判据 = 会话权威值：`slotData?.engineering` 在场取槽值，否则 `agent.config.agent.engineering`——§2.2）；`assembleAgent({ excludeTools, slotData })` 在 `createAgent`（`:135`）后调用并附着 | ±~20 |
| 2 | `thincoder-cli/bin/thincoder.mjs` | 425 | 修改 | ① import 行（`:24`）加名；② TUI 分支 `resumeSlot` 调用（现 `:315`）**前移至 `assembleAgent`（现 `:306`）之前**，恢复记录以 `assembleAgent({ slotData: data })` 传入（装配期判据来源——**无新增读点**：同一调用位置前移）；③ 启动恢复块之后（`agent._slot = slot` `:330` 与 `startTUI` `:343` 之间）一行 `attachManifest(agent)`（重估点） | +~6 / −2（净 +4） |
| 3 | `thincoder-vscode/src/agent/setup.mjs` | 470 | 修改 | `hydrateRun` 钩子块（`:375-391`）块首模式门（normal → 只置 `agent.manifest = null`，不读 / 不拒 / 不建档） | ±~5 |
| 4 | `thincoder-core/agent-tools/spawn-gates.mjs` | 95 | 修改 | 新常量 `MANIFEST_BASENAME`（**字面量**——保叶子零 import）+ `rejectEngineeringFilePaths` 新 `else if` 分支（专用拒文案） | +6 |
| 5 | `thincoder-core/agent/write-gate.mjs` | 86 | 修改 | 注释收正（`:13` / `:39-40`「壳面拦」句加**工程模式会话**口径——零语义） | ±0 |
| 10 | `thincoder-core/manifest.mjs` | 258 | 修改 | 新导出 `manifestFilePath(cwd)`（= `join(writeRoot(cwd), MANIFEST_REL)`——档路径单源，KD-M1-18）；`readManifest` / `writeManifest` 两处同式改用之（零语义；`writeRoot` 保留） | +~6 / −2（净 ~+4） |
| 11 | `thincoder-core/agent/setup-reminders.mjs` | 160 | 修改 | 模块私有 `refreshManifest(agent)`（③b 值变检测：`manifestFilePath` → `statSync` 门控 → `readManifest` 采纳 / 失败保守）+ `pushManifestStateReminder` 取值前置步一行调用（判据③ `:84` 之后、行构造 `:86` 之前）+ **行构造改取刷新后的值**（`:83` 的局部捕获 `const manifest = agent.manifest` 删除、判据③ 改读 `agent.manifest`——不改则 ③b 刷新的值喂不到行构造，T32 才暴露）+ 两条新 import（`node:fs` 的 `statSync` · `../manifest.mjs` 的 `manifestFilePath, readManifest`；现档 import 三条 = `:25-27`）+ 模块头注一行 | +~30 / −1（−1 = `:83`） |
| 13 | `thincoder-core/manifest.mjs` | 319 | 修改 | 新导出 `discoverRepos(cwd)`（四态结构化 + `candidates` 按名排序——KD-M1-22）；`resolveProjectRoot` 改其薄包装（**零语义**；`_setProjectRootForTest` 覆盖语义保持——覆盖在场 ⇒ `self` + `root` = 覆盖值）；头注一行 | +~45 / −10（净 ~+35） |
| 14 | `thincoder-core/manifest.mjs` | 339 | 修改 | 新导出 `discoverProjects(cwd)`（项目梯五级——KD-M1-23）+ 新导出 `owningProject(target)`（归属形单点——KD-M1-30）+ 新导出 `projectView(target)`（归属 ∨ 发现兜底 / 五态读侧单点 / 零写——KD-M1-24）；`discoverRepos` 收正为**仓梯**（+ 裸仓级 + `matched`）；`resolveProjectRoot` 收正为归属形（仅归属命中）；`resolveEngineeringManifest` 码拆分 + 梯②⑤ 建档 + 文案族改（KD-M1-28 / M1-29）；**私有内核 `scanChildren`**（两梯共用）+ **覆盖位短路定形**（`owningProject` / `discoverProjects` 头部）；头注契约行同步 | +~120 / −~40（净 ~+80） |
| 15 | `thincoder-cli/src/cli/make-agent.mjs` | 215 | 修改 | `attachManifest` **非 fatal**（不抛 + 记 `agent._projectView`——KD-M1-25）；注释 / 契约行同步 | ±~18 |
| 16 | `thincoder-vscode/src/agent/setup.mjs` | 500 | 修改 | `hydrateRun` 钩子块同形（非 fatal + `_projectView`——两端同形）+ **拆分（F12 硬限触发）：装配段（`:222-304`——家族段装配 / MCP 连接 / 基础集 · 全表 · `toolByName` · `toolSchemas` 构建）迁入邻档 `setup-tooltable.mjs`**（纯结构搬移零语义；W8 契约②保持：段内动态 import 原样动态）；方案全文见下条拆分注 | 拆：−~83 · 钩子 ±~12 · 调用点 +~3（拆后 ≈432） |
| 17 | `thincoder-core/agent/setup-reminders.mjs` | 200 | 修改 | 状态选行：`projectView(agent.cwd)` 接入 + 报明行构造 `manifestReportLine`（KD-M1-26）；判据③ 改**无锚门**、新增 ③' 状态选行（**每回合实读**——成本两轴见 §2.6 条 3）；无锚零 I/O 保持（KD-M1-27） | +~55 / −~10 |
| 18 | `thincoder-core/tools/git.mjs` | 403 | 修改 | 工作区消息按 `matched` 出两档变体（裸仓档文案）+ 裸仓级命中同享重定向 / 注记——判据仍单源（§6.13） | +~10 / −~3 |
| 28 | `thincoder-core/prompts/persona-engineering.md` | 161 | 修改 | 提示词 = 产品代码（单副本） | ±~11 |
| 29 | `thincoder-vscode/src/agent/setup-tooltable.mjs` | 230 | 修改 | **拆入面**（行 16 装配段迁入——新导出 `buildToolTable({ depth, role, engineering, provider, mcpServers, builtinTools, opts, batchDoc, settingsTool })` → `{ baseSet, tools, toolByName, toolSchemas }`；入参 = 段内消费的既有局部，返回 = 后续段解构收下（零语义）；段内 import 面随段迁入——静态边 = 既有子集（`engine-floor-guard` 零改）、四条动态 import 原样动态）。工具表族另出档 `thincoder-vscode/src/agent/tool-table.mjs`（**250**）——本档现读 **102** | **102 ∕ 250（两档）** |
| 30 | `thincoder-core/manifest.mjs` | 451 | 修改 | `DEFAULT_MANIFEST` + `MANIFEST_SCHEMA`（`nestedKeys` 补 `index`）+ `validateManifest` 两族形态判据 + `fillDefaults` 嵌套分支 + 头注契约行（KD-M1-31 / M1-32） | +~35 |
| 31 | `thincoder-core/conventions.mjs` | 254 | 修改 | 装载换源：删 `CONVENTIONS_REL_PATH` / `loadConventions` / `clearConventionsCache` / `DEFAULT_CONVENTIONS` / `typeErrorsOf` / `DEFAULT_CODE_PATHS`；新增 `loadProjectDeclaration` / `clearDeclarationCache` / `DEFAULT_DECLARATION` + 退役告警点（存在性检查——内容零解析）；头注 / JSDoc | 净 ±~15 |
| 32 | 消费面九档（核 `agent/dispatch.mjs` 499 · `agent-tools/verify.mjs` 296 · `agent-tools/advisor-settle.mjs` 241 · `advisor/repos.mjs` 151 · `advisor/project-context.mjs` 198 · `index-discover.mjs` 177 · `memory/code-sync.mjs` 428 · VSC `agent/run-helpers.mjs` 269 · VSC `agent/tool-gates.mjs` 167） | — | 修改 | 调用换名（`loadConventions` → `loadProjectDeclaration`；`DEFAULT_CONVENTIONS` → `DEFAULT_DECLARATION`）+ 两处指路文案（`dispatch.mjs` / `tool-gates.mjs`——两端逐字同文）+ 注释收正 | 逐档 Δ 上界钉死——见下注 |
| 33 | 文案三档（`thincoder-cli/src/tui/cmd-reindex.mjs` 52 · VSC `extension/panel-index.mjs` 242 · `memory/schema.mjs` 454 注释） | — | 修改 | 索引提示行声明指路改 `PROJECT-MANIFEST.json`（`cmd-reindex.mjs:48` ∥ `panel-index.mjs:197`）；注释收正（`panel-index.mjs:220` 去失效物名 `conventions.json` · `schema.mjs:24` 声明指路改 manifest） | ±1 / 档 |
| 35 | `thincoder-core/agent-tools/advisor.mjs` | 281 | 修改 | 注释收正（`:13` 去退役符号名 `loadConventions`——J6 符号面零命中面；零语义） | Δ=0 |
| 37 | `thincoder-vscode/src/agent/setup-tooltable.mjs` ∕ `thincoder-vscode/src/agent/tool-table.mjs` | **102** ∕ **250** | 修改 ∕ 新增 | 行 29 续拆落形（工具表族再出档；缝 = 既有导出面 re-export，消费档零改）——两档均 ≤500 | Δ 见行 29 |
| 38 | `thincoder-core/manifest.mjs` | **249**（落成时读数；现量 300 见行 49） | 修改（已落） | 双拆出档：发现 ∕ 归属族 ⇒ `manifest-discovery.mjs`（**119**）+ 校验 ∕ 默认族 + `isValidDocRootValue`（两段非连续 = 142 行）⇒ `manifest-schema.mjs`（**155**）；re-export 保消费者 import 面零改（**21** 消费档名面 ⊆ 宿主导出面）；拆后 **249** | **249** |
| 39 | `thincoder-core/manifest-discovery.mjs` | **158**（2026-10-25 实测；现行值单源 = `docs/core/design/LEDGER.md` §3.8 受影响面表） | 修改（**已落 · 本轮实改**） | 新导出 `projectRootView(cwd)`（判定单点——§2.2 契约行）+ `resolveProjectRoot` 薄委托化（行为零变）；项目梯删 `unique` 两臂（`≥1 ⇒ workspace`） | 已落：**158**（净 −1） |
| 40 | `thincoder-core/ledger-db.mjs` | **260**（2026-10-25 实测；现行值单源 = 同左） | 修改（**已落**） | `openLedger` 工作区报明（判定 = `projectRootView`；零写——下辖项目全列 + 点名项目根） | 已落：**260**（零增量） |
| 41 | `thincoder-core/agent-tools/batch-paths.mjs` | **208**（2026-10-25 实测；现行值单源 = `docs/core/design/LEDGER.md` §3.8 受影响面表） | 修改（**本轮实改**） | 工作区锚检查（`docs/core/design/BATCH-RECORD.md` §4.15 条 5）：create 按目标所属项目落基底 ∥ 无所属报明 + 显式路径指引；读面候选 + 在飞 ∥ 写门基底集 = 候选并集；本轮改注释 ∥ 报明文案逐字 ∥ `owningProject` 补界 = 会话锚 | 实改：**208**（+1） |
| 42 | 单元测试档（manifest-resolution-fix） | 0 | 新增 | 单元测试档（AC-1–AC-5——工作区实景三族；不进集成测试树） | 新增 |
| 43 | 单元测试档（structure-split-2） | **219** | 修改 | 导出枚举 +`projectRootView`（`:110` ∥ `:112` ∥ `:122`） | ≤ ±2 |
| 44 | `thincoder-core/manifest.mjs` | **249**（落成时读数；现量 300 见行 49） | 修改 | 转口 `projectRootView`（经本档 re-export——§2.2 契约行）+ `resolveProjectRoot` 薄委托随动（行为零变） | ≤ ±2 |
| 45 | `thincoder-core/agent-tools/batch.mjs` | **313** | 修改 | 基底取解析单点（两调用点——`:184` ∥ `:283`） | ≤ ±4 |
| 46 | `thincoder-core/agent-tools/subagent-spawn.mjs` | **438** | 修改 | `logBatchDocRefs` 基底解析随动（`:53`） | ≤ ±2 |
| 47 | `thincoder-core/agent/write-gate.mjs` | **183** | 修改 | `memoizedBatchBases` ← 解析单点（`:116-122`） | ≤ ±4 |
| 48 | `thincoder-core/manifest-schema.mjs` | **181**（2026-10-22 实测） | 修改 | `validateManifest` 增未知键产线（两层级——顶层 + 四嵌套层照 `nestedKeys`；非拒——KD-M1-36）+ 头注契约行同步 | ≤ +16 |
| 49 | `thincoder-core/manifest.mjs` | **300**（2026-10-25 实测；本行增量已落——落成时 272 ⇒ 300） | 修改（已落） | `readManifest` 返回面 + `unknownKeys` + 读面一行告警（`console.warn` + `logEvent`；同档同键集去重 Map）+ import 行 | 已落：净 +28（272 ⇒ 300） |
| 50 | `thincoder-core/agent-tools/manifest.mjs` | 0 | 新增 | `manifestTool`——三动作 `read` / `init` / `write`（点改 ∥ 写面白名单 = 全键族 ∥ 目标面复用 `projectView` ∥ `projectRootView`；描述 `DESC("manifest")`——详 §2.10） | ≈ +170（上界 ≤260） |
| 51 | `thincoder-core/agent-tools.mjs` | 29（as-of 本批） | 修改 | 登记册 +1 导出行（`manifestTool`——邻 `engTool` `:15`；注册面单一（F1）∥ 探针可枚举照旧）——**现行读数** 32 行（§2.10.1 受影响文件行 2） | ≤ +2 |
| 52 | `thincoder-core/agent/family-tools.mjs` | 204（2026-10-22 实测） | 修改 | depth-0 段挂载全量变体（动态 import 名面 `:29` + `depthOnly` 表——两模式同挂）；depth>0 五段挂只读变体（§2.10.1） | ≤ +12 |
| 53 | `thincoder-core/agent/dispatch-gates.mjs` | 143 | 修改 | `isSubagentReadonlyAction` +`manifest` `read` 只读格（`init` / `write` 侧效门——`:75` 邻位） | ≤ +5 |
| 54 | `thincoder-core/tool-docs/manifest.md`（已落） | 0 | 新增 | 工具描述档（DESC 单解析面；单档 ≤8,000 字符预算——`scripts/tool-schema-size.mjs:72`） | ≈ +1.2k 字符 |
| 55 | `thincoder-vscode/scripts/check-vsix.mjs` | 100（as-of 本批） | 修改 | `EXPECT["tool-docs"]` **50**（as-of 本批：48 + 描述档 1 + 既有漂移收正 1；`:37`）——**现行读数**见 §2.10.1 受影响文件行 6 = 53 ⇒ 54 | ±1 |
| 56 | 单元测试档（manifest-agent-tool） | 0 | 新增 | 单元测试档（T63–T73 对应用例——不进集成测试树） | 新增 |

> 说明：**行数 = 读盘实测（`\n` 计数）**。
> **本批改动面 = 行 39–41**：39 / 41 本轮实改、40 已落——现行值单源 = `docs/core/design/LEDGER.md` §3.8 受影响面表。行 42–56 = 他批登记面、**本批零改**；其 `现行` 列是他批登记时的 as-of 读数，不作本批判定（逐格改判归各批）。
> **口径注**：行数一律按 `\n` 计数复核（读盘显示含末尾空段 = `\n`+1——对账勿混两口径）。
> 落点以**函数名**为准、行号为 as-of 参考（D4）；与并行的他批若同碰这些档，开工前先 `git status` 复读行数、**串行实施**（同文件并发写 = 丢改风险）。
> 行数说明（>500 行建议带三行）：#2 425，增量均为单点微增（+~6/−2）、无跨档（≤500 软线内）⇒ **不拆**：
> #2 增点为既有恢复块内的调用前置 + 一行重估调用（拆档会把「恢复决策 → 装配 → 应用」的顺序契约切成两档，反增耦合）。
> **>500 软线拆分评审注（F12 = `docs/core/requirements/ENGINEERING-MODE-V2.md:631`）**：
> · **行 16（`thincoder-vscode/src/agent/setup.mjs` 越 500 硬限）⇒ 拆**——装配段（家族段装配 / MCP 连接 / 基础集 · 全表 · 索引 / schema 构建）迁入邻档 `setup-tooltable.mjs`（纯结构搬移零语义；缝 = 导出函数 `buildToolTable`）。拆后：`setup.mjs` ≈432 · `setup-tooltable.mjs` ≈325。
> · 行 14 `thincoder-core/manifest.mjs`：**已落——双拆**：发现族（两梯 + 私有内核 + `owningProject`）⇒ `thincoder-core/manifest-discovery.mjs`（**119**——拆出时；现行 **159**，2026-10-25 实测）+ 校验 ∕ 默认族 ⇒ `thincoder-core/manifest-schema.mjs`（**155**）；
>   `manifest.mjs` re-export 保消费者 import 面零改（**21** 消费档名面）——主档 **249**；**T54 读点改指** `manifest-discovery.mjs`（§2.2 机判句 ∥ §3.2 T54 行）；
>   **`SOFT_LINE_REGISTRY` 义务执行态** = 本档移出（**249** < 300）。
> · 行 18 `thincoder-core/tools/git.mjs`（403 ⇒ ≈410）：方案 = `execute()` 头部解析序（workdir / 发现 / `workspace` throw / 注记）抽邻档 `thincoder-core/tools/git-resolve.mjs`；触发条件 = 同上。
> · 行 29 `thincoder-vscode/src/agent/setup-tooltable.mjs`（≈325——拆入面：行 16 拆入后越 300 软线，未越 500 硬限）：方案 = 行 16 拆入的工具表段（新导出 `buildToolTable`）再拆出邻档——**已执行**：工具表族出档 `thincoder-vscode/src/agent/tool-table.mjs`（**250**）——本档现读 **102**（两档 ≤300）。
> · 行 16 `thincoder-vscode/src/agent/setup.mjs`（421）：方案 = 该档装配段续拆或迁邻档；触发条件 = 越 800 硬限，或下一次触碰该档的批。
> 设计档自身（本档 §2.2 架构图 + 两端钩子行 / §2.3 本表 / §2.4 KD-M1-12–M1-16 / §2.5 各条 / §3.1 AC-14–AC-18 / §3.2 T23–T31（共 14 行——新增 T24b · T24c · T28b · T28c · T28d）/ §4 + `docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E2 模式口径句）由 eng-designer 落笔——**coder 零写设计档**。

**（行 30–36）Δ 钉死 + 拆分评审注**：

> · **Δ 上界（行 30–33 逐档钉死）——代码面**：`manifest.mjs` ≤ +35（451 ⇒ ≤486）· `conventions.mjs` 净 ±15（254 ⇒ 239–269）· 核 `dispatch.mjs` **≤ +1**（499 ⇒ ≤500——500 软线内，实施轮不得越）· `verify.mjs` ≤ +1 · `advisor-settle.mjs` ≤ +1 · `repos.mjs` ≤ +1。
> · **（续）**：`project-context.mjs` ≤ +2 · `index-discover.mjs` ≤ +1 · `code-sync.mjs` ≤ +1（428）· `schema.mjs` ≤ +1（454）· VSC `run-helpers.mjs` ≤ +1 · VSC `tool-gates.mjs` ≤ +1 · 文案三档 ≤ +1 / 档 · 行 35（`advisor.mjs` 注释收正）Δ=0。
> · **硬限面（触碰档——逐档方案 + 触发）**：`manifest.mjs`（451 ⇒ ≤486）：发现族拆 `manifest-discovery.mjs`（已落——登记 · 行 14 注）· `code-sync.mjs`（428 ⇒ ≤429）：搜索面拆 `memory/code-search.mjs`（已落）。
> · **（续）**：`schema.mjs`（454 ⇒ ≤455）：扩展名表组拆 `memory/ext-tables.mjs` · 核 `dispatch.mjs`（499 ⇒ ≤500）：门禁段拆 `dispatch-gates.mjs`（已落）。

**（行 39–47）Δ 上界 + >300 软线判定**：
> · Δ 上界：`manifest-discovery.mjs` ≤ +55（119 ⇒ ≤174；**现测 158**）· `ledger-db.mjs` ≤ +10（126 ⇒ ≤136）· `batch-paths.mjs` ≤ +65（142 ⇒ ≤207；**现测 208**——超预算 1 行，实测回填）· 单元测试档 = 自持（数值界外）· `structure-split-2.test.mjs` ≤ ±2（219 ⇒ ≤221）。
> · **（续 · 行 44–47）**：`manifest.mjs` ≤ ±2（249 ⇒ 247–251）· `batch.mjs` ≤ ±4（313 ⇒ 309–317）· `subagent-spawn.mjs` ≤ ±2（438 ⇒ 436–440）· `write-gate.mjs` ≤ ±4（183 ⇒ 179–187）。
> · **>300 软线判定**：行 39–44 ∥ 47 未触线（增量后代码档峰值 ≤251；单元测试档 ≤221——均 <300）；**行 45 `batch.mjs`（313）∥ 行 46 `subagent-spawn.mjs`（438）= 存量越线档**（微调面——非引入；未涉 500 硬限）。
> · **（续）**：方案 / 触发 = 既有登记，不重述（`batch.mjs` = `docs/core/design/TOOLS.md` §6.15.2；`subagent-spawn.mjs` = `docs/core/design/CORE-UNIFICATION.md` §2.8.1 次优先面）。

**（行 48–49）Δ 上界 + >300 软线判定**（核面小修）：
> · Δ 上界：`manifest-schema.mjs` ≤ +16（预算基数 166 ⇒ 上限 182；**现测 181**）· `manifest.mjs` ≤ +28（基数 = 行 49 现量 **272** ⇒ ≤300，恰压软线；**已落——现测 300**）· 单元测试档 = 自持（数值界外）。
> · **>300 软线判定**：`manifest.mjs` 现测 **300**（`\n` 计数）——未越 300 软线，然余量 **0** ⇒ 下一个触碰该档的批须先带拆分方案（读写面续拆邻档）或 `SOFT_LINE_REGISTRY` 登记，不得无方案增量。`manifest-schema.mjs`（181）未触线；均未涉 500 硬限。

**（行 50–56）Δ 上界 + >300 软线判定**（manifest agent 工具面）：
> · Δ 上界：`thincoder-core/agent-tools/manifest.mjs` ≤ +260（新档——目标 ≈170）· `agent-tools.mjs` ≤ +2 · `family-tools.mjs` ≤ +4（187 ⇒ ≤191）· `dispatch-gates.mjs` ≤ +5（143 ⇒ ≤148）· `thincoder-core/tool-docs/manifest.md`（已落——≤8,000 字符预算）· `check-vsix.mjs` ≤ ±1 · 单元测试档 = 自持（数值界外）。
> · **>300 软线判定**：触碰档增量后峰值——既有档 ≤191 ∥ 新增工具档 ≤260（均 <300）；未涉 500 硬限。
> · **相邻面登记（父侧裁）**：`docs/core/design/TOOLS.md` §6.2 元工具清单（+`manifest` + 漂移两行 `notify_parent` ∥ `ledger`——已落）· §6.7 逐工具要旨行 · `docs/core/design/ENGINEERING-MODE-V2.md` §2.2 M1 行（工具面半句——在册）；`PROMPT-SYSTEM.md:402`「不造新工具」半句（限定句 + 例外句——已落；口径裁 = §2.5 条）。

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M1-1 | 机制代码在核（`manifest.mjs`），数据档在被开发项目**项目根 = 带 `PROJECT-MANIFEST.json` 的目录**（发现梯五级见 §2.2；**git 非前提**） | 架构 §2.2 M1「机制代码在核，操作对象 = 被开发项目」；一次声明多处读取，下游 M2–M9 从 manifest 取路径，不硬编码本仓 |
| KD-M1-2 | 整档缺失 = **不静默 fallback**（报明 + 建档流——不拒会话），缺键 = fallback，两分不混 | 规格 ②.3 / ②.4 明示 + §⑥「不砖死」；整档缺失静默 fallback = 不可见（架构 §2.3 E2 现口径 = 会话照常起 + 按用点报明 / 建档流） |
| KD-M1-3 | 写门落 `writeManifest` 的 `writer` 上下文（fail-closed 缺省拒） | 规格 ②.5 + AC-M1-5；机械可机判（非主 agent → 拒），符合架构 §2.3 E3「manifest 写门 = M1 读写装配」 |
| KD-M1-4 | 校验器输出结构化 `{ok, errors}`，不抛散文 | 可机判（N2）；下游读面与写门同用一处判据（单一权威源 D2——`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 D2） |
| KD-M1-6 | `docRoot` 值域 = 非空字符串 \| 非空字符串数组；**数组 = 该键的完整声明**（不与默认合并、不追加默认） | 一个文档层跨多根（core / cli / vsc 部分层）是实况；合并默认会静默造出「意料之外的根」——静默正是要消灭的缺陷；与「缺键补默认」两分保持正交（缺键 ≠ 给数组） |
| KD-M1-7 | 非法形态（空串 / 空数组 / 数组含非串或空串元素 / 非串非数组）→ **校验拒**（不是静默跳过） | 静默跳过 = 评审根静默失踪；fail-closed 与 `phase` 枚举 / `version` 数值同族（N4）。 |
| KD-M1-8 | 判据单源：`isValidDocRootValue` / `docRootPaths` 落 M1（`manifest.mjs`），消费面一律经该谓词取值 | D2 单一权威源：校验与消费各写一遍必漂移（留「校验通过但消费不认」的缝）；**基数（项目根）同落此处** ⇒ 新消费点不可能重复基数缺陷 |
| KD-M1-9 | 默认档五键**保持单串**（不改成数组） | 默认值 = 通用约定，数组 = 声明面扩展；改默认会改变所有未覆盖仓的行为（兼容面）——要求「既有仓零改即绿」 |
| KD-M1-10 | `activeBatch` **整链撤销**（字段 / 校验 / 咬合 helper / 冻结机检取值 / 情境行字段 / 数据档键），非降级、不保留「参考位」 | **用户裁定**方案 A：「这个必须完全撤销，不能存在。」 |
| KD-M1-11 | 旧档残留 `activeBatch` 键**不迁移、不报错**——`fillDefaults` 只搬已知键（读时收敛、回写自然清） | 与 `access` 裁撤同机制（AC-6 / T14）；写迁移脚本 = 给一次性动作造第二条写路径，违「写门唯一条」（KD-M1-3） |
| KD-M1-12 | 装配钩子加**工程模式门**——判据 = **会话权威值**「恢复槽带 `engineering` 字段 ? 槽值 : `config.agent.engineering`」（槽优先 + config 回退；取值点三处见 §2.2）；普通会话 = **装配钩子零 manifest I/O**（不读 / 不拒 / 不建档）+ `agent.manifest = null` | manifest 是工程模式机制的状态账（下游 M2–M9），普通会话无消费方。|
| KD-M1-13 | 钩子执行点 = **会话起点**（幂等重估，无状态位），非「进程启动一次」：CLI 两处（装配 + 启动恢复后）· VSC 每轮 reconcile；**装配期判据取槽值** = `bin` TUI 分支 `resumeSlot` 前移至装配之前 + 恢复记录经 `slotData` 形参进 `assembleAgent` | CLI 的工程模式权威值 = 会话槽（`thincoder-core/session-lifecycle.mjs:86`），装配期 `bin:306` 早于 `applySession:320` ⇒ 判据不取槽值则恢复的会话在装配期被误判（非仓仍抛 / 仓内仍建档；抛点早于 `applySession` ⇒ 重估点永不达）。 |
| KD-M1-14 | 「二道防线」**实现**（不收回声明）：`spawn-gates.mjs` 新常量 `MANIFEST_BASENAME = "project-manifest.json"` + 专用拒文案（**不入** `PROCESS_BASENAMES`） | 声明既立 = 契约（§2.1#3 / §2.5）：`files` 声明面是子代理写域的唯一机械闸（`tool-gates.mjs:93` / `dispatch.mjs:198` 消费已声明域），收回声明 = 子代理可把 manifest 声明为写域（唯一剩余闸退到写门调用期）。两族理由不同（过程档 = 父侧对账职责；manifest = 写门唯主 agent）⇒ 文案各异（并入 `PROCESS_BASENAMES` 会把尾句「改设计档」误导到 manifest 面）。**不 import `MANIFEST_REL`**：保本模块「叶子·零 import」性质（模块头注 `:9`）——字面量 + 指针注释（D2 单源在 `manifest.mjs`，此处为大小写归一后的匹配字面量）。拒文案稳定片段 = `/Manifest file/`（句首锚——§3.1 AC-18 / §3.2 T30 按它断言） |
| KD-M1-15 | 装配期槽值**读点 = 参数注入**（`bin` 既有 `resumeSlot` 调用前移 + `slotData` 形参），**不在 `attachManifest` 内调 `resumeSlot`** | 事实（「`resumeSlot` = 同进程纯读」不成立）：`scheduleSessionGC` + `claimSlot`（写 `slotSessions` / 翻共享 `active`）+ `writeEndMarker`（`thincoder-core/session.mjs:44` / `thincoder-core/session-slots.mjs:139`）。钩子内调用 ⇒ 每个走装配的命令（含 `thincoder chat` · ACP）都认领 / 分配槽并翻共享活跃指针 = 凭空会话写副作用（禁扩大面）。参数注入下 TUI 路径**零新增读点 / 零新增写**（同一调用前移），`chat` / ACP 无会话 ⇒ config 回退。 |
| KD-M1-16 | AC-14「不读」**退为可观测断言**（不抛 / 不建档 / `agent.manifest === null`）——不落 fs 读面探针 | 「未被读」在钩子面无机械可观测缝（`requireManifest` 非注入点）；附着 = 读面唯一可观察后果 ⇒ 三后果断言即等价判据。下游读面（任何模式照读）另见 §2.5「普通会话的读面边界」 |
| KD-M1-17 | 值变检测 = **mtime 门控重读**，落注入器（§2.6 ③b 取值前置步；判据序 ①–⑥ 零改）；**未变零重读（值采纳轴——状态判定轴每回合实读，见 §2.6 ③'）** · **失败保守**（stat 失败 / 读抛错 / 读回非法 ⇒ 不更新、不清零、不抛；缓存不推进 ⇒ 下回合重试） | 注入器是唯一**逐回合**触点，门控落此处可同时覆盖两端且不新增驱动源。 |
| KD-M1-18 | 档路径 = M1 新导出 `manifestFilePath(cwd)`（**单源**）——注入器不重写根解析式；读 / 写 / mtime 门控三处同源 | 「manifest 档在哪」与「项目根在哪」是**同一判据**（`.git` 纯向下）——注入器内自写一遍 = 判据双源（基数缺陷同族）。 |
| KD-M1-19 | 缓存载体 = **per-agent** `agent._manifestMtime`；语义 = 「当前 `agent.manifest` 所对应的档 mtime」；未设 = 未观测（首回合读一次对齐）；失败不推进 | 状态与 `agent.manifest` 同生共死 ⇒ 语义自洽（缓存 = 值的来源指纹）；同族先例 `agent._slotMtime`（`thincoder-core/session-guard.mjs`）。 |
| KD-M1-20 | 入口决策树抽为 M1 新导出 `resolveEngineeringManifest`（**非抛错**形态）——三面共用（CLI 装配/重估 · VSC `hydrateRun` · **翻转面**） | 翻转面（先判后翻）与入口面（判 + 报明 / 建档，不抛）各写一遍树 = 判据双源（KD-M1-8 同族）——`/eng` 与 `bin` 两处对「项目不可解析」的判定必须同步演进；启动侧恒不拒（KD-M1-25）⇒ 分叉只剩「启动能启、翻转可否进」一面。 |
| KD-M1-21 | 翻转面核序 = **先判后翻**（判据通过才写 `agent.config.agent.engineering` / 槽）；拒翻分支**零副作用** | 四条路径现状均先写态后返回（`cmd-eng.mjs:34` · `eng.mjs:71`）——判据若失败，模式已翻但无附着 ⇒ 正是 #41 本体；且 token 清理 / `_advisorRuns` 重置 / `ENG_ON_REMINDER` 入列不可撤回（回滚写 = 清得掉标志、清不掉已入列的提醒）。 |

| KD-M1-22 | **仓发现单源** = M1 新导出 `discoverRepos(cwd)`（结构化四态 + 候选全列）；`resolveProjectRoot` 退为其**薄包装**（零语义）；`git` 工具（`thincoder-core/tools/git.mjs` 的 `execute()` 头部单点）经该符号接线——**禁第二份发现实现** | 用户裁定「复用 manifest 的发现逻辑，**甚至共享代码**」+ D2（单一权威源）。消费面已 4 族（manifest 档路径 / `docRoot` 基数 / 台账项目根 / git 工具仓解析）——各写一遍必漂移（三态口径改一处、他处不知）。**机判落点** = `docs/core/design/TOOLS.md` §6.13 **A20**（源码面：同一导出 import 命中 ∧ `node:fs` 零命中——「禁第二份实现」的可判形） |
| KD-M1-23 | 发现梯**两表一核**：新导出 `discoverProjects`（项目梯五级——git 非前提）/ `discoverRepos` 收正为**仓梯**（`.git` 视图）；候选两级**带优先级**（带档优先，零档才看裸仓）；`matched` 记档位 | 用户裁定（多仓正常 · 每仓一份 · git 非前提）。带优先级的理由 = 两级问的是两件事（带档者 = 项目；裸仓 = 可建档的仓），平级放宽会让「1 带档 + N 裸仓」的候选换成裸仓。两表共一 walk 内核（单源——KD-M1-22 零改）：项目梯允许非 git（梯①/③），仓梯只认 `.git`——合一会把 `git` 工具引去无仓目录。 |
| KD-M1-24 | 读侧解析单点 `projectView(target)`（非抛错 / **零写** / 五态）；建档动作留入口决策树 | 判据单源（D2）——情境行 / 钩子 / 报明三面共用一处状态机；**零写**保证「读面不建档」（防注入器变写点）。 |
| KD-M1-25 | 装配钩子**不再 fatal**（启动零拒绝）：非 ok 态 ⇒ `agent.manifest = null` + 记 `agent._projectView`，**不抛** | 需求 §⑥「不砖死（不变量）」（用户反馈 + 验收）：fatal 点早于会话 ⇒ 自救无门。**口径**：AC-15④ / T27 =「不抛 + 报明」（档非法）；翻转面拒翻面收窄——**可拒面 = 仅「档非法」一格**（工作区 `workspace` 放行） |
| KD-M1-26 | 情境行按**状态选行**：`ok` ⇒ 相位行（零改）；`no-project` / `workspace` ⇒ 报明行；`missing` / `invalid` / 读失败 ⇒ **有既往好值**则保守沿用（KD-M1-17 零改）、**无既往好值** ⇒ 报明行 | 「该动作报明」的模型侧承载；保守规则不撤（瞬时 I/O 失败不得误报为「档没了」）+ 补「整会话静默」的洞（首观即失败 ⇒ 至少可见一次）。 |
| KD-M1-27 | 无锚（`agent.cwd` 缺失）⇒ **零 I/O / 零报明**；**无锚 ∧ 有值（`agent.manifest` 在）⇒ 相位行 + 沿用内存值**；无锚 ∧ 无值 ⇒ 零注入（`false`） | 既有 §2.6 条 3 边界零改（无 cwd 夹具的既有用例零改）；生产面 cwd 恒在。 |
| KD-M1-28 | 决策树**态码** = `no-project`（梯⑤）/ `workspace`（下辖 ≥1 项目）——两者皆**正常态读数、非失败**（前者走建档流，后者走报明 + 下一步）；`ok:false` 的语义 = 「未附着 manifest」（树不抛），不是「调用失败」；文案族 = 「项目不可解析」（稳定锚句 `/项目不可解析/`——拒翻面（档非法格）用） | 两态处置不同（无项目 ⇒ 锚处可落地；工作区 ⇒ 报明事实 + 点名项目根，不建不猜）——单码装不下报明文案；启动零拒绝（KD-M1-25）后「启动拒绝」措辞无落点。**否决「拆 `ok` + `state` 两字段」**：同一信息已由 `code` 承载，拆字段 = 契约变更（8 处调用点 + 用例行同改），换不来新判据 |
| KD-M1-29 | **建档站点** = 壳面入口（会话起点钩子 + 翻转面）+ **工具 `init`（动作侧显式调用、非自动建档——§2.10）**：**轻动作**（内容 = `DEFAULT_MANIFEST`，`writer:'main'`）覆盖梯②⑤ 两格；**机制零自动 `git init`** | 用户「帮他初始化」+「项目落地 = 建 manifest」「`git init` 降为可选增强」；自动建档的适用面 = **「工作区 / 档非法不建」**。 |
| KD-M1-30 | **归属形** = `owningProject(target)`（**最近者优先**——自目标沿祖先链上溯，取**最近**带档目录（含自身））；`projectView` = **归属 ⇒ 发现兜底** 两段合成（读面五态）；`projectRootView` / `resolveProjectRoot` = **归属形**（`owningProject`）——发现读数只供 `workspace` 报明，**不进 `root`**（不向下取根） | 用户裁定（嵌套 / 重叠：**最近者优先**——最近的带档目录即归属；不跨兄弟、无全局优先级）。**2026-10-23 改判**：先前一度砍成「不上溯」，过头——上溯正是子目录归到自己项目根的通路（`thincoder-core` ⇒ `thincoder`），砍掉它子目录就解析不到项目（用户 23:24「本来就该爬到项目根啊」）；现行 = **上溯取最近**。两段分离的理由不变：**归属**解「谁的参数」（含嵌套子项目——各自其主）；**发现（纯向下）**解「锚在哪落地 / 锚项目是谁」（本仓锚 `D:\teamcode` 下辖两项目 ⇒ 报明工作区）。 |
| KD-M1-31 | **两族声明键并入 schema**（`codePaths` / `index.{codeExtensions,docExtensions}`）——顶层平级 + 缺省值入 `DEFAULT_MANIFEST`（`["src"]` / `[]`）；键名 / 形态逐字承前 | 用户裁定（退役 `.thincoder/conventions.json`——「必须的功能并入 project-manifest，不要同时保留二者」）⇒ 单一项目声明档；键名逐字承前 = 用户项目迁移零改名（必要性判据 = 两族对任意用户项目各有正当性：分类段位 / 索引扩展名，均解决一类不可硬编码的布局差异）；声明归属随项目归属（`owningProject`）⇒ 与档位解析同判据。 |
| KD-M1-32 | 两族键**形态错 = `errors`（fail-closed）**；消费面（分类 / 索引）遇档不可用 ⇒ 两族逐条回默认 + 可见（缺档静默；非法 / 读错加 `console.warn` + 日志事件）（**例外**：`index.excludePaths` 元素层宽容——空 ∕ 非串元素由归一剔除，数组层仍 fail-closed；§2.2 `:118`） | 与 `docRoot` 子键同款（KD-M1-7：静默跳过 = 静默失踪——旧的逐键降级在 VS Code 扩展宿主里近乎不可见）；两层各归其位：档面 fail-closed（工程入口 / 翻转面既有语义零改）、运行面不崩不静默（N2）。 |
| KD-M1-33 | 读向**单向**：`thincoder-core/declaration.mjs`（经其转口可达）经 `readManifest` / `manifestFilePath` 投影两族键（`loadProjectDeclaration`）；本模块零出边 | 同一档禁两份读取器 / 第二份根解析（KD-M1-18 同族）；两模块同属**模式无关面**（全模式消费）⇒ 耦合非模式耦合。 |
| KD-M1-34 | 退役旧档的在场处置 = **一行可见告警**（`console.warn` + `logEvent('declaration:retired-file')`）+ 存在性检查（**内容零解析**、零回退） | 用户裁定「不要同时保留二者」= 零并存；告警 ≠ 机制（零读零回退），但静默停用 = 哨兵失效不可见（`PORTABILITY.md` 问题本体）——可迁移纪律要求可见。 |
| KD-M1-35 | **`index.publicRepos` 并入 index 族**（缺省 `[]`；元素层宽容 ∕ 数组层 fail-closed）——值形 = **从本仓根可解析的路径**；**值形 ∥ 解析两层定义**（值形 = 归一后相对串（声明投影）∥ 解析 = 绝对根集（`normalizeOrigin` 消费）——细则单源 = `MEMORY.md` §6.15）= `declaredPublicRoots(cwd)`（`declaration.mjs` 新导出——检索同步 ∥ 读面 origin 集 ∥ 引用解析三消费面共用，不得二写） | 嵌 index 族 = 检索范围声明（同款先例 = `index.excludePaths`）⇒ 顶层键族与默认档计数零扰动；`fillDefaults` 已知键搬运自动覆盖本键（未知键静默丢弃 = #802 在册面——不因本键消解）。**`declared` 连带：本键非空 ⇒ `declared=true`（值比较——判据正本 = `PORTABILITY.md` §3.1）。** |
| KD-M1-36 | **未知键可见化（#802——fail-open 保留 ∥ fail-silent 消除）**：未知键（顶层 + `docRoot`/`index` 两嵌套层——恰 = `fillDefaults` 丢弃面）⇒ `validateManifest` 产 `unknownKeys`（非拒）+ `readManifest` 读面单点一行告警（`console.warn` + `logEvent('manifest:unknown-keys')`——含键名；同档同键集去重）；**memo = 档路径 → 上次观测键集；读到零未知键即清该条**；`ok:true` 与搬运语义零改（KD-M1-11「不迁移、不报错」定性不变——告警 ≠ 报错） | 声明失效须可见（零报错 = 无人知——拼写错 / 版本错位类声明键静默死）。 |
| KD-M1-37 | `docRoot` 值域**增「本面无」= 显式 `null`**（合法哨兵——不被补回；`docRootPaths(null) = []`） | **缺键 = 缺省便利**（仍补默认——KD-M1-6 零改）与**本面无 = 显式事实**两分不混。 |
| KD-M1-38 | agent 工具面**写形 = 点改**（`write`：`key` 点分路径 + `value`）；写面白名单 = **全键族**（`version` / `phase` / `codePaths` 整键 ∥ `docRoot.*` / `index.*` 子键——判据单源 = `MANIFEST_SCHEMA`）；白名单外 ⇒ 拒 | 需求 ②.7「各节点」口径（用户逐字「各节点都能被 agent 读写」）。 |
| KD-M1-39 | 目标面**判据复用零新解析器**：`read` = `projectView`（五态报明）；`init` / `write` = `projectRootView`（`workspace` ⇒ 拒 + 下辖项目全列 + 显式 `target` 指引）；**init 不覆盖**（已带档 ⇒ 拒——`initManifest` 无覆盖保护，工具面补闸）；**write 不建档**（缺档 ⇒ 拒 + 引导 `init`） | 「不唯一解析不猜」硬口径（需求 ②.7）：`resolveProjectRoot` 对 `workspace` / `none` 塌缩 `null`（**它不回落**——回落住调用方 `docRootBase` / `writeRoot` 的 `?? resolve(cwd)`，`thincoder-core/manifest.mjs:97` / `:121`）⇒ 直用 = 静默挑锚——故写 / 建面一律取 `projectRootView` 直读形。init 不覆盖 = 默认档会碾掉现档（数据丢失面）；write 不建档 = 建档是独立动作（KD-M1-29 建档站点收窄零改） |
| KD-M1-40 | 报告面 = **随动（零改）**：工具写盘 ⇒ 情境行经既有 ③b mtime 门控于下回合采纳；**不新增**工具 → 内存值同步通道（`agent.manifest` 写点保持「钩子附着 ∥ ③b 采纳」两处） | ③b 盘面驱动（#34）已覆盖「会话内改档 ⇒ 下回合行更新」（T32 语义）；第二写点 = 第二值源（单源纪律）；且工具目标可为**非锚项目**——直写内存值会把非锚项目状态错当锚项目状态（违 §2.9 D「注入物 = 会话锚项目」） |
| KD-M1-41 | `manifest` 工具**明文豁免**变更记账通道（不登记）。**解除条件**在册（多实例并发实证 ∥ 审计清单完备性入验收 ∥ 该面触碰需求——具名首例 = `manifest write` 改 `index.publicRepos` / `codePaths`） | 通道 = 代码变更为轴；`manifest` 与 `settings` / `memory` / `ledger` / `batch` 同类（非文件编辑工具）——「不在通道」非缺陷，缺的只是一行显式在档（防下轮再当缺陷发现）。细则 = §2.10 末段（变更记账面） |
| KD-M1-42 | **`unique` 的射程 = 仓梯独有**：项目梯（`discoverProjects`）无 `unique`——直接子目录带档 ≥1 即 `workspace`（1 ∥ 2 ∥ 3 ∥ 更多同判）；仓梯（`discoverRepos`）**保留** `unique`（`git` 工具 `workdir` 重定向依赖它） | 用户裁定 2026-10-25 21:26（原话 = `docs/core/design/LEDGER.md` §3.8「先例 ∥ 勘察证据行」）。两梯问两件事：项目梯答「锚下有哪些项目」（报明用）、仓梯答「这条路径是不是某个仓」（重定向用）——合一会让 `git` 工具在无仓目录乱重定向。**读「梯④」先问哪条梯** |

### 2.5 与既有纪律冲突核对

- **「不砖死」× 两分**：普通会话 = 装配钩子零 manifest I/O（裁定零改）；工程模式会话 = **启动零拒绝**（新增——非 ok 态不抛，记 `_projectView`；KD-M1-25）。前者管「读不读」，后者管「读不到怎么办」——互不取消。
- **翻转面 × 发现梯升级（交叉面 · 登记）**：#41 拒翻判据本体零改，但**可拒面收窄**——梯⑤（无项目）现由决策树建档（KD-M1-29）⇒ `/eng` · `/session` · `eng` 工具 · ACP 四路在该格不再拒；**工作区（`workspace`）格亦不落拒格**（放行——`agent.manifest` = null）⇒ 仍拒 = 仅「档非法」一格。FR11 口径单源 = `docs/core/requirements/PORTABILITY.md:63`（**git 非前提** / 无项目 ⇒ 不拒翻、走建档流）——本档只挂指针（D2）。
- **台账键面**：`ledger-db.mjs` 键 / `ledger-cmd.mjs` base = **`resolveLedgerRoot(target).root`**（单源 = LEDGER.md §2.1 / §3.8——自目标沿祖先链上溯取最近「已注册」目录，以会话锚为界、越界即停；**不向下取根**）——键 = 该推导结果；既有台账数据**均不迁移**（键变化的目录需重新入账）。
- **git 工具面**：`discoverRepos`（仓梯）含裸仓级 ⇒ ① 锚 + 恰一裸仓 ⇒ 重定向 + `(repo: …)` 注记；② 锚 + ≥2 裸仓 ⇒ `workspace` throw（列候选 + 指 workdir）；③ 带档行为**逐字不变**（A14–A20 零改全绿）。判据 / 用例同步住 `docs/core/design/TOOLS.md` §6.13（D2——本档不重述）。
- **嵌套归属 / 错层**：① 目标路径**自身所在目录**带档时 `writeRoot` / `manifestFilePath` 归该目录（不落子目录；自身不带档 ⇒ **上溯**归最近带档祖先；祖链无档 ⇒ `resolveProjectRoot` = `null` ⇒ 落用点自身，不归无关外层项目）；② **嵌套归属**：根 / 子双档时子内归子（各自其主），根内不带档的子目录不归根（不跨兄弟——§⑥ 归属形）。
- **写门 / schema 计数 / 值形态零改**：五键集合 · `REVIEW_ROOT_KEYS` · `docRoot` 值形态（F7）· `writeManifest` writer 闸 · spawn 二道防线（AC-M1-8）——均零碰。
- **项目状态档（state）豁免工程写闸（#941）**：分类器五值增补 `state`（`PROJECT-MANIFEST.json` ∥ `.thincoder/conventions.json`——单源 = `PORTABILITY.md` §3.2 / §3.8）⇒ 工程模式父侧门对两档不再按产品代码拦（主 agent 可合规落盘 ∥ 清理）；**分层零改**：`writeManifest` writer 闸（KD-M1-3）· spawn `files` 域二道防线（KD-M1-14）· eng-coder 角色门——子代理面照旧。
- **`docRoot`「本面无」= 显式 `null`（#944）**：值域增补（KD-M1-37）；删键仍补默认（KD-M1-6 缺键语义零改）——两分不混；消费面读数（`docRootPaths` 展开 = `[]`——各消费点零贡献；批档基底回退登记）= §2.7「本面无」句。
- **消费面登记的空缺（不改）**：`write-gate.resolveReviewTargetPaths` 整档缺失仍回退 `DEFAULT_MANIFEST.docRoot`（**静默**——现状）；「该动作报明」的模型侧承载 = 情境行（§2.6），动作侧仅机检 fail-closed 一族已报明。写门 / 台账是否加报明 = 后续批。**后续批登记**：「非锚项目缺档 ⇒ 动作侧报明 / 建档」——需求 ②.3 的全消费面承接（只落锚项目情境行 + 会话起点建档；非锚项目动作面的报明 / 建档留后续批）。
  **`manifest` 工具面已承接该动作侧「报明 / 建档」一格——读五态报明 ∥ init 建档（§2.10）；余消费面（写门 / 台账 / 机检）仍留后续批。**
- **agent 工具面 × 既有面**：零碰面逐条——翻转族（§2.8 判据 / 文案 / 先判后翻）零改；情境行（§2.6 判据序 / 行形 / 单活体）零改——工具写盘 = 盘面变化，③b 既有门控随动（KD-M1-40）；两端装配钩子（§2.2 模式门 / 建档流）零改；写门（`writeManifest` writer 闸——KD-M1-3）与二道防线（`spawn-gates.mjs` `files` 域拒）零改；schema / 校验器判据零改；建档站点（KD-M1-29）零改（工具 init = 动作侧显式调用，非自动建档）。
  口径核对（指令优先级裁，用户新令 > 旧句）：`docs/core/design/PROMPT-SYSTEM.md:402`「清单维护者 = agent…**不造新工具 ∥ 不加机械门**」——**该半句被 ②.7 覆盖**（新令 = 全键读写出口）；§6.15 余句（维护者 = agent ∥ 随手补清单 ∥ 不加机械门）不受影响（限定句 + 例外句）。
- **advisor 评审门文档受理（按用点收口）**：设计评审文档 = **项目内现存 `.md` 文档**——相对形按会话项目根（`projectRootView(cwd).root`）解析、绝对形照用；**仓根级文档与 `docRoot` 树外仓内文档一并受理**（`docRoot` 不再充当受理边界）；解析不出 ∕ 越项目 ∕ 非 `.md` ⇒ `criterion=scope-not-doc` 拒，文案载「解析后路径 ∥ 拒因」+ 期望形。判据 / 文案 / 拒因三值单源 = `docs/core/design/ADVISOR-GUARDS.md` §12（D2——本档不复述）。
  **依据 / 落地** = §2.9 A 解析轴——裁「参数按用点解析，会话不绑定项目」之评审门消费面收口（落地 = `thincoder-core/agent-tools/review-facts.mjs`（解析单源）∥ `thincoder-core/agent-tools/advisor.mjs`（拒发文案）两档单链）。

  **边界**：`REVIEW_ROOT_KEYS` / `resolveReviewRootsFor` / `resolveReviewTargetPaths` 保留为写门面（评审受理不再消费）· 冻结窗 `docAbs` 同源取 `resolved`（放宽受理的文档同受 D5 冻结）· `resolveBatchDocPath` 不受影响（另一机制，`BATCH-RECORD.md` §4.15）。

  **指针**：M4 单点 / M6 消费语义 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E6 ∥ §2.4 M6→M4 行 ∥ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` F3。
- **单项目解析律与四处会话级缺省收口（用户裁定「cwd 下面有多仓是常态 · 谁让他猜了」）**：
  **律（唯一一条）**：一切项目解析 = 「**用点路径 → 自身所在目录带档即命中；否则上溯取最近带档祖先；祖链无档 ⇒ 无项目**」（`owningProject`——**上溯**）。**用点路径** = 动作显式给的路径；未给显式路径者，用点路径 = `cwd`（会话锚自身）。会话**不持**任何「当前项目」单值状态位。

  **锚为工作区（`projectRootView` `workspace`）⇒ 无缺省**：报明事实（「本会话锚 = 工作区，下辖 N 个项目：…」）+ 可执行下一步（点名项目根 / 目标路径）——**不猜**（禁按名序取首）· **不抛「歧义」**· **不 brick 会话**。
  **矛盾收口**：「会话不绑定项目」与「四处会话级缺省（情境行 / ledger / git / batch）」原本自相矛盾——收口：
  · **留**「按用点解析」（唯一律——会话不持项目单值，参数按用点路径解析）；

  · **废**「会话项目根」这个**单值**概念——四处缺省不是第二套模型，而是「用点路径 = cwd」的同一律；
  · 唯一保留的 `resolve(cwd)` 类锚回落 = **建档流落点**（梯⑤ 无项目 ⇒ 在会话锚处落地；显式动作，非解析兜底）。
  **逐消费点处置（全列——含全部 `workspace` 态消费面，非仅四处）**：

  | # | 消费点（file:line） | 可带路径？ | 处置 |
  |---|---|---|---|
  | 1 | `thincoder-core/agent/setup-reminders.mjs:88-98`（报明行）+ `:152-175`（状态选行） | **不能**（会话级播报） | 态名 `workspace`；行文改**事实行**（§2.6 条 1b）；**不做归属判断**（不替它挑项目） |
  | 2 | `thincoder-core/agent-tools/manifest.mjs:94-116`（read 报明）+ `:137-145`（init / write） | 可（`target`） | read：`state=workspace` + 事实行；init / write：`target` ⇒ 路径作用域（`owningProject` 定项目——既有）；`target` 落工作区（无主）⇒ 报明 + 下一步（**文案去 `ambiguous` / 「never picks one」**） |
  | 3 | `thincoder-core/agent-tools/batch-paths.mjs:27-31 · :57-66 · :100-102 · :104-115 · :163-173` | 可（create `path`） | 带 path ⇒ `owningProject` 定项目 ⇒ 落其基底（既有零改）；无所属 ⇒ 报明 + 下一步（文案去 `ambiguous session anchor` 机检锚）；读面 / 在飞 / 写门基底集 = 候选**并集**（**非停手先例**，零改）；`ambiguousCandidates` 更名 `workspaceCandidates`（一名一物） |
  | 4 | `thincoder-core/tools/git.mjs:43-51 · :97-110` | 可（`workdir`） | 无 `workdir` ∧ 锚为工作区 ⇒ 报明（下辖 N 仓）+ 下一步（传 `workdir`）——**不猜**；文案去「Ambiguous」错误框定；`matched` 两变体保留；仓梯三态零改（`self` / `unique` / `none`）——`unique` 仓梯独有（KD-M1-42），与项目梯无 `unique` 不冲突 |
  | 5 | `thincoder-core/agent-tools/review-facts.mjs`（`resolveReviewDocPaths`）+ `thincoder-core/agent-tools/advisor.mjs`（评审 documents 拒发） | 可（`documents`） | 相对形按会话项目根解析、绝对形照用（本律）；受理 = 项目内现存 `.md`（仓根级文档一并受理）；解析不出 ∕ 越项目 ∕ 非 `.md` ⇒ `criterion=scope-not-doc` 拒 + 期望形；判据单源 = `docs/core/design/ADVISOR-GUARDS.md` §12 |
  | 6 | `thincoder-core/ledger-db.mjs`（`openLedger` / `ledgerDbPath`）+ `thincoder-core/ledger.mjs`（`findProject` / 族发现） | 可（`cwd`） | 根推导走 `resolveLedgerRoot`（LEDGER.md §3.8）：工作区（`discoverProjects` 报 `workspace`——直接子目录带档 ≥1 ∥ 零带档时裸仓 ≥1）⇒ **无根** ⇒ 写面抛「无根」文案、展示面 current `null`；族发现按工作区根形落子目录族（零改） |
  | 7 | `thincoder-core/manifest.mjs:227-258`（决策树）+ 翻转面（`thincoder-core/agent-tools/eng.mjs:81-84` · `/eng` · `/session` · ACP） | 不能（会话级） | 出口码 `workspace`；**拒翻面收窄**：`workspace` 不再拒翻（放行——`agent.manifest = null` + 事实行）⇒ 可拒面 = **仅「档非法」**；入口钩子面零改（启动零拒绝已含非 ok 态） |
  | 8 | `thincoder-core/agent/light-round.mjs:41-43` · `thincoder-core/ledger.mjs:90-96` | 会话级 | 态名更新（跳过该候选 / 不充当项目）——**非停手先例**，行为零改 |
  | 8b | `thincoder-core/agent/light-round.mjs` | **66** | 结构不变（仅态名随正）——现读 2026-10-23 `\n` 计数 |
  | 9 | `scripts/doc-check.mjs`（工程工具面——`detectRoot` 与拒面已删，`--root` 必带） | 工程工具面 | **第二份发现实现**——**已收正：判据 = 显式 `--root` 必带**（零发现——`detectRoot` 与拒面删） |
  | 10 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 端镜像 | re-export 面（零改）；行文随核（端零自持） |

  分类口径：**能带路径的 ⇒ 必须带**（缺路径时报明 + 下一步，不替它挑）；**不能带路径的（情境行）= 只播报事实，不做归属判断**。
  依据 = §2.9 A 解析轴 + 用户两条裁定；细节单源 = `docs/core/design/LEDGER.md` §2.1 ∥ `docs/core/design/BATCH-RECORD.md` §4.15 ∥ `TOOLS.md` §6.13（D2——各消费面持有其自身处置）。

  **随动面（引用 / 引文级）**：`LIGHT-CHANNEL.md:113` · `docs/core/design/ADVISOR-GUARDS.md` §12（零候选试探 ⇒ 零静默挑一仍立）· `DESIGN-TOKEN-SETTLEMENT.md:126` · `docs/desktop/design/IPC.md:310 · :315`（引文含旧锚句「项目不可解析」——随措辞改）· `docs/desktop/design/UI.md:525`（档头注引文）。
- **需求侧口径（单源指针）**：① `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` AC-M1-2（`:41`）= 会话权威值口径下「**不拒会话**（按用点报明 / 协助建档）」；② `PORTABILITY.md:63` FR11 =（**git 非前提** / 无项目 ⇒ 不拒翻、走建档流 / 可拒面 = **仅「档非法」一格**）。
  **待主 agent 同步**：需求侧 FR11 可拒面句 ∥ `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.2 / AC-M1-2 的态名与报明口径——本档只挂指针，不复述（D2）。

- **写门二道防线归属**：AC-M1-5「非主 agent 写 → 拒」的**机械主门** = 本模块 `writeManifest` 的 `writer` 闸；**二道防线** = M5 spawn 门 `files` 域排除 `PROJECT-MANIFEST.json`（子代理无法声明该路径为写域）。二道防线不在本模块实现，仅记录承接关系——与 M4 档 KD-M4-2「manifest 写门落 M1」同源（架构 §2.3 E3）。
  **实况**：`thincoder-core/agent-tools/spawn-gates.mjs` 常量 `MANIFEST_BASENAME` + `rejectEngineeringFilePaths` 分支（`files` 含该 basename——任意层 / 任意大小写 → 拒，专用文案）（本档 §3.2 T30 同款判据——KD-M1-14）。
- **前置门槛的模式口径**：E2 缺 manifest（整档）的口径 = **会话照常起 + 按用点报明 / 走建档流**（启动零拒绝——§2.9 · KD-M1-25 / M1-29）——**工程模式会话**口径；普通会话**装配钩子**零 manifest I/O（不读 / 不拒 / 不建档；§2.2 模式门 + KD-M1-12），下游回退链不变（M4 `resolveReviewTargetPaths` 整档缺失 → `DEFAULT_MANIFEST.docRoot`）。
  **需求侧同载**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.3（`:22`）带「会话权威值」口径与建档流 · AC-M1-2（`:41`）带「不拒会话」文本 · 二道防线专条 **AC-M1-8**（`:46`）——规格侧与设计侧同口径单源。
- **普通会话的读面边界（KD-M1-16）**：保证的范围 = **装配钩子面**（`attachManifest` / VSC `hydrateRun` 钩子块）。
  以下消费面**任何模式照读**（既有语义，零改）：写门 `thincoder-core/agent/write-gate.mjs:60`（经 `thincoder-core/agent-tools/advisor.mjs:120`——会话根集；逐文档所属项目第二读点 `:125` → `:129`）· 批次档第二基底 `thincoder-core/agent-tools/batch-paths.mjs:105` · 台账 `thincoder-core/ledger-db.mjs:51`（`resolveProjectRoot`）。模式分叉若要做 = 另批（不落）。

  · **`manifest` 工具（§2.10）**：**任何模式可读 / 可写**（装配钩子面零 I/O 口径不变——KD-M1-12 零改）。

- **仓发现的第二消费者**：manifest 面与 `git` 工具（`thincoder-core/tools/git.mjs` 的 `execute()` 头部）**共用** `discoverRepos`（KD-M1-22）——同判据、零第二份实现。
  发现面 = **纯 fs**（不读 manifest 内容 / 不查模式 / 不依赖 `agent`）⇒ 工程模式与普通会话**同判**（普通会话零行为变：「无 manifest 概念」的项目 ⇒ `none` ⇒ §6.12 的 fail-closed 现状）。
  既列消费面（`thincoder-core/agent/write-gate.mjs` · `thincoder-core/agent-tools/batch-paths.mjs` · `thincoder-core/ledger-db.mjs`）读面语义**零改**。

- **与 KDs 的关系**：KD-M1-12（模式门）与 KD-M1-13（钩子执行点 = 会话起点）**零改**——只在「已附着」前提下把**值来源**从「装配期一次性读」扩为「每回合 mtime 门控重读」（§2.6 ③b；新增 KD-M1-17），**附着决策仍只在会话起点**。
  读取面新增开销（**两轴**）：**状态判定轴** = 判据 ③' `projectView(agent.cwd)` **每回合实读**（发现 walk：≥1 次 `existsSync`；无 `.git` 时含 `readdirSync` + 逐子目录 `existsSync`；命中后读档 + 校验）；**值采纳轴** = 判据 ③b 一次**路径解析**（`manifestFilePath` → `resolveProjectRoot`）+ 一次 `statSync`（**mtime 未变零重读**）。

  两轴均居判据 ①②③ 之后 ⇒ 普通会话 / 深度 > 0 / 无锚三态在该步之前返回（零 I/O）——与上条「普通会话的读面边界」不冲突。
- **运行期失败退化 vs 会话起点动作**：AC-M1-2 / KD-M1-2 的整档缺失处置（含档非法） = **会话起点**动作（工程模式会话口径，见上条模式门）——判「起会话时做什么」：**报明 + 走建档流，不拒会话**（梯②⑤ 就地建档；KD-M1-25 / M1-29）；
  ③b 的失败退化（档删 / 读回非法 ⇒ 不更新、不清零、不抛）是**运行期注入面**降级——判「这一回合出什么行」。运行期已附着会话不因档删 / 档非法被改变（「拒」在本机制无落点）：沿用上次已知好值 + 下回合自愈（缓存不推进 ⇒ 重试）；`readManifest` 的返回语义（`reason:'missing'` 仍 missing）零改。
- **会话起点（ACP 装载）**：**现行 = §2.8 F4**（`session/load` / `session/resume` 补重估行；判据单源化）。
- **进程内翻转**：`/eng` ON（`cmd-eng.mjs`）· `/session` 切槽（`cmd-session.mjs`）· 核心 `eng` 工具（`agent-tools/eng.mjs`）——**现行 = §2.8**（F2 判据表 / F3 明示面 / F5 边界 / F6 FR11 冲突登记）。
- **schema 计数（五键）**：**设计侧一致**——架构 §2.2 M1 行 / §2.3 E1 JSON / 本档 §1.2 F1 / §2.2 接口四处均五键（`version` / `phase` / `docRoot` / `codePaths` / `index`）；**规格侧同步 = 主 agent 笔**（FR42 已在需求侧立五键——本档只挂指针）。
  扩列同步 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E1（键面 JSON + 键注释
  + 校验句——设计侧）+ `docs/core/requirements/ENGINEERING-MODE-V2.md` 七处活体句（`:154`–`:156` / `:184`–`:185` / `:187` / `:399`）+ `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`（三账 → 两账）+ `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md` ②.5 墓志——三方链闭合。
- **键集**：`docRoot` 五子键集合 = `REVIEW_ROOT_KEYS`（`write-gate.mjs:41`）。
- **既有三键零改 + 声明族键为新增**：`phase` / `version` / `docRoot` 的判据与取值零改（`docRoot` 值形态 = F7 既有面）；新增 `codePaths` / `index` 两键（形态 / 缺省 / 校验 = §2.2 + KD-M1-31/M1-32；声明语义 = `PORTABILITY.md` §3.1——本档不复述）。
- **并发事实核对**：批次流水线**多批并行**是子系统自设常态（eng-coder 池 = 4 · 多实例共 cwd 的 peer 机制 · 阶段并行派单纪律）——本模块不再承载任何「当前批次」单值（撤字段即撤该建模）；在途性真值 = **批次档状态行**（M3 冻结门读它）。
- **需求侧锚**：值形态条目 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7（`:19`）+ AC-M1-7（`:37`，逐条判据 = 本档 §3.1 AC-7–AC-13）——三方链（需求源 → 档面 → 设计）闭合（详见 §2.7 末节）。

### 2.6 情境行注入（#28 定案 · #34 值变检测——架构 E5.1 的模块级契约）


**方案（就机制说清）**：

1. **行构造 = 纯函数** `manifestStateLine({ phase })`（`thincoder-core/agent/setup-reminders.mjs`，与 `envStateLine` 同族、可单元测试）：

   ```text
   [System reminder: project state: phase: <值> (rigor: <light|strict>).]
   ```

   - `rigor` 标签映射（判据单源 = 需求 v2 §9.1）：`initial-dev` → `light` · `production` → `strict`；未知值 → 无标签（只出值，不编判据）——行形 = `…phase: <值>.]`。
   - 行族前缀 `MANIFEST_LINE_PREFIX`（`[System reminder: project state: `）与行内容**解耦**（前缀零改——摘旧行 / 会话重建认领同用它）。

1b. **报明行构造 = 纯函数** `manifestReportLine({ state, cwd, root, path, candidates, errors, matched })`（同档——**新增**，KD-M1-26）——同一行族前缀，四态逐字（**工作区行按 `matched` 两变体**）：

   ```text
   no-project : [System reminder: project state: none — no project at <cwd> (no manifest at this directory, none in the direct children). Parameters fall back to defaults. Create PROJECT-MANIFEST.json here to land a project (git optional).]

   workspace  : [System reminder: project state: workspace — <cwd> is a workspace holding <N> projects: <abs…> — pass an explicit target path to act on one of them.]

   workspace·裸仓档 : [System reminder: project state: workspace — <cwd> is a workspace holding <N> repositories (none carries PROJECT-MANIFEST.json): <abs…> — pass an explicit target path to act on one of them.]

   missing    : [System reminder: project state: missing — the resolved project root <root> has no PROJECT-MANIFEST.json; project parameters fall back to defaults until the file is generated.]

   invalid    : [System reminder: project state: invalid — <path> is not a usable declaration: <errors>; project parameters fall back to defaults until fixed.]
   ```
   - **态字对照**：`no-project` 态的报明行行内态字 = `none`（机读码 = `no-project`——`projectView` 的 `state` 与 `resolveEngineeringManifest` 的 `code` 指同一态）；行文逐字以 `thincoder-core/agent/setup-reminders.mjs:90-93` 为准。

   - `candidates` 按名排序（判据同 `discoverProjects`）；`errors` 逐条、`；` 连接；`<abs…>` = 下辖项目绝对路径列表（`、` 连接）。**工作区行按 `matched` 两变体**（`manifest` = 带档级「projects」；`git` = 裸仓档「repositories … (none carries PROJECT-MANIFEST.json)」——不书带档句；同口径 = `docs/core/design/TOOLS.md` §6.13 A22 的裸仓档变体）。
   - 行文口径：**信息行，非错误行**——如实播报「锚 = 工作区、下辖 N 个项目」，**不做归属判断**（不替它挑一个），给可执行的下一步（点名目标路径）；措辞**不得**含 `ambiguous` / 候选二义 / 「机制从不挑」类框定（用户两条裁定）。

2. **推送 = 自愈单活体** `pushManifestStateReminder(agent, { depth = 0 } = {})` → `boolean`（同档）：

   | 序 | 判据 | 动作 |
   |---|---|---|
   | ① | `depth !== 0` | `false`（不注入） |
   | ② | `agent.config?.agent?.engineering !== true` | `false` |
   | ③ | 无锚（`agent.cwd` 缺失） | **有值（`agent.manifest` 在）⇒ 相位行**（零 I/O——沿用内存值；KD-M1-27）；**无值 ⇒ `false`**（零注入） |
| ③' | **状态选行（KD-M1-26）**：`projectView(agent.cwd)`（**每回合实读**——成本两轴见条 3）—— `ok` ⇒ 相位行（取值路径归行 ③b）；`no-project` / `workspace` ⇒ 报明行（工作区 = 事实行，信息面）；`missing` / `invalid` / 读失败 ⇒ 有既往好值（`agent.manifest` 在）⇒ 相位行沿用（KD-M1-17 零改），无既往好值 ⇒ 报明行 | 选定行文本入 ④–⑥ 单活体机（机制零改） |
   | ③b | **取值前置步**：数据档 mtime ≠ `agent._manifestMtime`（含缓存未设 = 首次观测）；`agent.cwd` 缺失 / stat 失败 ⇒ 跳过 | `readManifest` 重读：`ok:true` → 采纳（`agent.manifest` ← 新值 + 缓存 ← 观测值）；`ok:false` / 抛错 → **不更新、不清零、不抛**（沿用旧值，缓存不推进 ⇒ 下回合重试） |
   | ④ | `history` 已有同文 user 行（活体） | `false`（幂等——零历史变更） |
   | ⑤ | `agent._manifestLine` 存在且 ≠ 新行（值已变）；**缺失**时（会话重建——行随 `history` 回来、状态位不回来）先按行族前缀 `MANIFEST_LINE_PREFIX` 从 `history` 认领现存活体 | 就地 `splice` 摘旧行（`role === "user"` 全匹配），保 `history` 数组引用——不认领则旧行残留 + 新行入列 = 双活体（违本定案） |
   | ⑥ | 落新行 `{ role:"user", content: line, transient:true }` + 记 `agent._manifestLine = line` | `true` |

3. **取值 = mtime 门控重读（值变检测——#34）**：注入前（判据③ 之后、行构造之前）先 `stat` 数据档——路径取 `manifestFilePath(agent.cwd)`（项目根解析与读点同源，**非**「锚目录 + 档名」——锚为 monorepo 根时两者不同）：

   - **mtime ≠ `agent._manifestMtime`**（含缓存未设 = 首次观测）：`readManifest(agent.cwd)` 重读 → `ok:true` ⇒ **采纳**（`agent.manifest` ← 新值 + `agent._manifestMtime` ← 本次观测值）。
   - **mtime 相等** ⇒ **值采纳轴跳过**（未变零重读；同款先例 = peer 提醒的 mtime 惰性缓存）。**成本两轴**：
     状态判定轴 = 判据 ③' `projectView(agent.cwd)` **每回合实读**（walk + 读档 + 校验）；
     值采纳轴 = 本步一次**路径解析**（`manifestFilePath` → `resolveProjectRoot`（无缓存）：仓锚 `existsSync(.git)` 一次；无 `.git` 时含 `readdirSync` + 逐子目录 `existsSync`）+ 一次 `statSync`（坐标：`thincoder-core/manifest.mjs:44` / `:46-50`）。
   - **失败退化 = 保守**：stat 失败 / 读抛错 / 读回非法（`ok:false`）⇒ **不更新 `agent.manifest`、不清零、不抛**（注入绝不打断回合）——沿用上次已知好值；缓存不推进 ⇒ 下回合重试（自愈）。
     **与会话起点动作两分**：本步失败只降级**注入面**（已附着会话不因运行期档删 / 档非法被改变）；AC-M1-2 / KD-M1-2 的整档缺失处置 = **会话起点**动作（报明 + 建档流，不拒会话）、`readManifest` 返回语义（`reason:'missing'` 仍 missing）零改——详见 §2.5「运行期失败退化 vs 会话起点动作」条。
   - **缓存语义**：`agent._manifestMtime` = 「当前 `agent.manifest` 所对应的档 mtime」（per-agent 载体；同族先例 `agent._slotMtime`）；未设 = 未观测 ⇒ 首回合读一次对齐盘面——会话恢复后同理（值同 ⇒ 判据④ 命中，零历史变更）。
   - **与压缩生存零交互**：压缩吞行后的重推照旧走「④ 未命中 → ⑥」；**重读只由 mtime 变触发**（压缩不触发重读）。
   - **边界（如实登记）**：mtime 粒度内不被观测的替换（同毫秒二次写 / 保留 mtime 的整档替换）⇒ 该次值变延到下次档变；`agent.cwd` 缺失（无锚）⇒ 跳过本步（零 I/O，沿用内存值）——生产面 cwd 恒在（CLI 装配期设 · VSC 每 run 设）。

4. **接线两点**（逐回合注入组——CLI 同序）：
   - 核：`thincoder-core/agent/run-stages.mjs` `injectTurnReminders` 的 `depth === 0` 组内、`injectEngineeringReminder(agent)` 之后调用。
   - VSC：`thincoder-vscode/src/agent/setup-reminders.mjs` 转口 re-export 两符号；`thincoder-vscode/src/agent.mjs` 每回合组 `injectEngineeringReminder(agent)`（`:233`）之后调用。

5. **压缩生存 = 守卫自愈**（不落 system 槽——理由见架构 E5.1 #5）：压缩吞行后下一回合第 ④ 判据不命中 → 走 ⑥ 重推；**零触碰** `context.mjs` 压缩面。

6. **面纪律**：`transient:true` ⇒ 不进人读线（`_fullHistory`）；同文去重口径与 `pushInjections` `:87` 一致（`history.some`）。

**回指**：v2 §9.1（阶段 = 纪律强度档）。**需求侧锚**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ④ AC-M1-6（判据逐条 = 本档 §3.1 第二表 AC-N1–AC-N6、AC-N3b）——三方（需求源 → 档面 → 设计）一致闭合。

**需求侧待同步（主 agent 域）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ④ AC-M1-6 的判据枚举（现 = 「AC-N1–AC-N6、AC-N3b」）需补 AC-N7 / AC-N7b / AC-N7c / AC-N7d。

### 2.7 `docRoot` 值形态：单串 | 多根数组（F7）


**值域（形态判据单一权威源 = `isValidDocRootValue`）**：

| 值 | 判 | 语义 |
|---|---|---|
| 非空字符串（`trim` 后非空） | ✅ | 单根——该键取此路径（既有形态，语义零变） |
| 非空数组、元素皆非空字符串（`trim` 后非空） | ✅ | 多根——该键取这些路径（**完整声明**：不与默认合并、不追加默认） |
| `null`（显式「本面无」——#944） | ✅ | **本面无**——该键不存在任何根（合法哨兵；不被默认值补回；`docRootPaths` 展开为 `[]`） |
| 空串 / 空白串 / 空数组 / 数组含非串 / 空串 / 空白串（`trim` 后为空）元素 / 非串非数组（数 / 对象） | ❌ | 校验拒（`errors` 含 `docRoot.<键>`）——不静默跳过 |

**语义五条**：

1. **值形态决定语义**：串 = 取此路径；数组 = 取这些路径——数组是**完整声明面**（合并默认会静默造出「意料之外的根」，与要消灭的静默缺陷同族）。
2. **缺子键 = 补默认单串**（既有语义零变）：默认档五键**保持单串**（`DEFAULT_MANIFEST` 不改——默认 = 通用约定，数组 = 声明面扩展）。
3. **非法形态 = 拒**：`validateManifest` → `ok:false` → `readManifest` 返回 `reason:'invalid'` → 入口**非 fatal**（报明 + `_projectView.state = 'invalid'`；KD-M1-25）+ 翻转面拒翻（§2.8 F2）；`writeManifest` 拒落盘——与 `phase` 枚举 / `version` 数值同族（fail-closed）。
4. **解析基数 = 项目根**（`docRootBase`）：数组元素与单串同基数，逐元素解析。
5. **「本面无」= 显式 `null`**（#944）：某文档层在项目内不存在 ⇒ 写 `null`（**不被默认值补回**——`fillDefaults` 键在场原值透传）；**删键 = 缺省便利**（补默认单串——KD-M1-6 零改）：两分不混。

**解析管线（`docRootPaths(value, cwd)`——全在 M1 一处）**：

```text
值 → 展开（串 / 数组统一成列表）→ 逐元素 trim + `\`→`/` 归一 → resolve(docRootBase(cwd), p) → 去重（保序）
```

**全消费面清单（7 处，逐处给策略）**：

| # | 消费点 | 现语义 | 策略 |
|---|---|---|---|
| 1 | `thincoder-core/agent/write-gate.mjs:43-56` `resolveReviewTargetPaths`（M4） | 逐键 `typeof v === "string"` 取单值 | **改**：逐键 `docRootPaths(v, cwd)` 展开（跨键去重保留 `:55` 的 `Set`） |
| 2 | `thincoder-core/agent-tools/advisor.mjs:135-142`（M6 设计评审分类） | 消费已解析的绝对路径列表（`roots.some(...)`） | **零改**（本行口径仅限 `docRoot` 值形态批——分类判据与值形态无关；评审受理面的改动见 `docs/core/design/ADVISOR-GUARDS.md` §12） |
| 3 | `thincoder-core/agent-tools/batch-paths.mjs:105-114` `resolveBatchDocPath`（M3 第二基底） | 取 `docRoot.batches` 单值复判 | **改**：逐基底按序复判（首个可读者胜）；**显式**基底全不可读 → `throw` 不变；键 `null` ⇒ 零根 ⇒ 回退默认基底（§2.7「本面无」读数 / T62b） |
| 4 | `scripts/doc-check.mjs` · `doc-check-anchors.mjs` · `doc-check-width.mjs`（工程工具面） | 读 `DOC_CHECK_BUILTINS` / `MANIFEST_REL`（域发现） | 参数源改读内置常量（机械接线） |
| 5 | `thincoder-cli/src/cli/make-agent.mjs:47-64` · `thincoder-vscode/src/agent/setup.mjs`（壳面装配钩子） | `requireManifest` / `initManifest` | **零改**（不取值形态） |
| 6 | `PROJECT-MANIFEST.json`（本仓数据档） | 五键单串 | **改**：`requirements` / `design` 各三根（core + cli + vsc）；`specs` / `modules` / `batches` 保持单串（部分层无此目录——不预造惰性根） |
| 7 | `thincoder-core/conventions.mjs` `isDocPath`（`agent-tools/verify.mjs:180` 等消费） | 文档分类 = conventions 面 | **零涉**（判据源不同——非 `docRoot`；不碰） |

**「本面无」消费面读数**：`docRootPaths` 统一展开 ⇒ 该键零贡献（`[]`）：write-gate 评审根集逐键展开（该键 `[]`——其余键照常）
∥ `batch-paths` 基底（`docRoot.batches = null` ⇒ 声明面零根 ⇒ 回退默认基底——与缺键同款回退，登记；**两情形分清**：键 `null` ⇒ 回退默认基底，**显式**基底（串 / 数组）全不可读 ⇒ `throw`——AC-12 / T21 语义零改）∥ doc-check（不读 `docRoot`）∥ 壳面（不取值形态）。

**验收** = §3.1 AC-39 / §3.2 T61–T62 ∥ T62b（`readManifest` ∥ `docRootPaths` ∥ 批档基底读数 ∥ 门禁读数复跑全 OK）。

**边界（不做）**：`REVIEW_ROOT_KEYS` 键集不变（只扩值形态）；不新增 manifest 键；不改默认档五键值形态；不纳入参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）；不改 M4 / M6 判据本体；不改 `readManifest` 整档回退语义——manifest 缺失 / 非法时 `resolveReviewTargetPaths` 仍回退 `DEFAULT_MANIFEST.docRoot`（既有行为零变；入口面非 fatal——报明 / 建档，本函数不重复拦）。

**需求侧锚**：需求源 = 用户裁定；档面锚 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7（`:19`）+ AC-M1-7（`:37`——逐条判据 = 本档 §3.1 AC-7–AC-13）——三方（需求源 → 档面 → 设计）一致闭合。

### 2.8 模式翻转族与装配钩子的重估（#41——拒翻语义）


**F1 判据单源**：翻转面要「先判后翻」，入口面是「解析 + 处置（报明 / 建档 / 附着）」——两者各写一遍决策树即判据双源（KD-M1-8 同族）。
故把决策树抽为 M1 新导出，三面共用：① CLI 装配 / 重估 ② VSC `hydrateRun` 钩子块 ③ **翻转面（新增）**。

**接口（`thincoder-core/manifest.mjs`——新增；非抛错形态，供翻转面使用）**：

```text
resolveEngineeringManifest(cwd, { writer = "subagent", init = true })
  ├─ 档合法        → { ok: true, manifest, created: false }
  ├─ 缺档 + init   → 梯②⑤（锚 = 裸仓 / 无项目）⇒ initManifest(cwd, { writer })（抛错 → { ok:false, code:"init-failed" }）

  │                  工作区（下辖 ≥1 项目）⇒ { ok: false, code: "workspace", message, candidates }
  ├─ 缺档 + !init  → 梯⑤（无项目）⇒ { ok: false, code: "no-project" }（KD-M1-28；`init:false` 面）
  │                  梯②（锚 = 裸仓、档缺）⇒ { ok: false, code: "missing" }（不拒——调用方自决）

  │                  工作区（下辖 ≥1 项目）⇒ { ok: false, code: "workspace", message, candidates }
  └─ 档非法        → { ok: false, code: "invalid", message, errors }
```

**两端入口钩子 = 调用面（非 fatal——KD-M1-25 / M1-29）**：CLI `attachManifest`（`thincoder-cli/src/cli/make-agent.mjs`）与 VSC 钩子块（`thincoder-vscode/src/agent/setup.mjs`）改为调用本函数——

`ok:true` ⇒ 附着（+ 记 `agent._projectView`——`created` 透传）；非 ok（`workspace` / `invalid` / `init-failed` / `missing` / `no-project`〔后两码 = `init:false` 面〕）⇒ `agent.manifest = null` + 记 `agent._projectView`，**不抛**（会话照常起）；`missing` / `no-project` 于 VSC `depth > 0` 分支沿用「不初始化」。

**F2 拒翻语义（父侧已裁——勘定的边界）**：翻转面走**同一张决策树**，且**先判后翻**（判据通过才写态）：

| 分支 | 会话起点（入口） | 翻转面 |
|---|---|---|
| OFF 方向（ON→OFF）· 幂等 enter | 普通会话零 manifest I/O | **恒放行**——零 manifest I/O、**不改 `agent.manifest`**（四条路径 OFF 方向零改；清陈旧的点 = 会话起点钩子重调，不在翻转面） |
| 档合法 | 附着 | **放行** + 附着——判据通过 ⇒ `agent.manifest` ← 结果（翻转面唯一赋值点；相位行当回合起活） |
| 缺档 + 梯②⑤（锚 = 裸仓 / 无项目） | 轻动作建档（`writer:'main'`）+ 附着（**不拒会话**——KD-M1-25 / M1-29） | **放行** + 就地建档 + 附着——判据通过 ⇒（**`writer:'main'`**）建档 + `agent.manifest` ← 结果 |
| 缺档 + 工作区（下辖 ≥1 项目） | 不建档 / 不猜 + 报明（非 fatal——记 `_projectView`） | **放行**（`agent.manifest` = null、模式 ON；不再出「项目不可解析」文案） |
| 档非法 | 报明（非 fatal——记 `_projectView`） | **拒翻**（模式保持 OFF；文案锚 `/项目不可解析/`） |

**F2 三条**：
- **OFF 方向不改 `agent.manifest`**：理由两条——
  ① 与四条路径编辑点「OFF 方向零改」一致（另立清点 = 添一条无消费方的实施面）；
  ② 行为等价 = OFF 态**无** `agent.manifest` 消费者——注入器判据②（`thincoder-core/agent/setup-reminders.mjs:117`）先于判据③（`:118`）返回；

  其余 manifest 读面均**读盘**、不读 `agent.manifest`（`thincoder-core/agent/write-gate.mjs:50` · `thincoder-core/agent-tools/batch-paths.mjs:34`）；清陈旧的落点仍只有一处 = 会话起点钩子（KD-M1-12 / AC-17）。
- **放行分支「谁在何处赋值」**：附着动作 = 翻转面**自己**赋值——`agent.manifest` ← 判据结果（`ok:true` 的 `manifest`），落点 = 四条路径各自的「先判后翻」块（入口钩子的附着点不变——AC-19 零语义）。
- **`writer` 一律显式传 `'main'`**：接口缺省 `writer = "subagent"` 是写门的 fail-closed 缺省（KD-M1-3）——任何调用点误用缺省 ⇒「缺档 + 梯②⑤」退化为 `{ok:false, code:'init-failed'}`（**拒翻**），与 F2 / AC-20② 语义相反。生产调用点（入口薄包装两处 + 四条翻转路径）**全部显式传 `'main'`**；唯一闸 = `thincoder-core/manifest.mjs:474`（`writer !== "main"` → 抛）。

「**先判后翻**」是硬序：拒绝分支**不得**留下已翻转的态与已发生的副作用（token 清理 / `_advisorRuns` 重置 / `ENG_ON_REMINDER` 入列 / `_lastEngState`）——
四条路径现状全是**先写态后返回**（`cmd-eng.mjs:34` · `eng.mjs:71`），把判据提到写态之前。

**切槽族的额外一条（判据点必须前于 `switchToSlot`）**：`switchToSlot` 会写 manifest 活跃指针（`thincoder-core/session-lifecycle.mjs:323`）——若判据落在其后，拒翻就会留下「指针已切、会话未换」的半态，下次 `saveSession` 把旧会话写回目标槽（跨槽覆盖）。故 `/session` 的判据点 = `switchToSlot` 之前（`loadSlotFile` 纯读预读——无认领副作用，`session.mjs` 注释逐字在案）。

**F3 明示面（四处，各依既有通道——不新增通道）**：

| 路径 | 拒翻时 | 准翻时 |
|---|---|---|
| 核心 `eng` 工具 enter | 返回错误串（工具结果 = 明示面）：`Error: cannot enter engineering mode — <决策树原因句（文案族「项目不可解析」）> (mode unchanged)`；**零副作用** | 既有成功文案 + 端镜像提示（`mirrorNotice`） |
| `/eng`（CLI TUI） | `pushLine(<原因句>, C.warn)`；**不打 `pushLabel("❯ Eng")`**（标签 = 成功回显，拒时零标签——防假成功） | 既有标签 + 明细行 |
| `/session` 切槽 | 目标槽**合值**（§2.2 会话权威值「槽带 `engineering` 字段 ? 槽值 : `config.agent.engineering`」）`=== true` 时**先判后切**：判据取 `loadSlotFile` **纯读预读**（在 `switchToSlot` **之前**）——拒 ⇒ 切槽整体不发生（`switchToSlot` 与 `applySession` 均不调）+ `pushLine` 原因 | 既有切换 + `applySession` 之后一行附着 |
| ACP `session/load` / `session/resume` | 同款先判（判据同取**合值**；`loadSlotFile` 之后、`createSession` 之前）：拒 ⇒ 走既有 ACP 错误通道 `{error:{code,message}}`，不建会话 | 既有装载 + `applySession` 之后一行重估 |

**F3 触发条件口径（取「合值」读法）**：切槽 / ACP 两路的预判据触发条件 = **目标槽合值**（同 §2.2 会话权威值），不按槽字段本身判定。理由：遗留槽（无 `engineering` 字段）自工程会话切入时合值 = true（缺席保持内存值——`session-lifecycle.mjs:86`）——按槽字段判定 ⇒ 预判据不触发、抛错落在 `applySession` 之后，AC-C「拒 ⇒ 切槽整体不发生」在该格不成立（正是父侧裁定 3 要消灭的半态面）。两处判据与 §2.2 模式门**同源**（D2）。

**F4 ACP 装配期判据（同族第二半）**：`session/new` 无会话记录（KD-M1-15「无会话 ⇒ config 回退」）⇒ 现状即正确，**零改**；
`session/load` / `session/resume` 的装配期在 `applySession` **之前**（`acp.mjs:236` / `:286`）⇒ 装配期取 config 回退，装载后由 F3 的重估行订正——与 `bin` 的两点式（装配 + 恢复后重估）**同形**。

**F5 不受阻的内态（边界）**：

- OFF 方向恒放行；幂等 enter（已 ON 再 enter）零门（`eng.mjs:68-70` 既有 early-return 保留）。
- 非工程模式会话的一切（槽切到普通会话 / 普通会话启动）：零 manifest I/O。
- 子代理面：`eng` 工具不挂子代理工具表（depth-0 段——`thincoder-core/agent/family-tools.mjs:139-148`；核工具本体 `thincoder-core/agent-tools/eng.mjs:37-88`）⇒ 翻转族**结构上不可达**；子代理的装配钩子仍走「不初始化」。
- 拒翻时**不发生**者（不是「不受阻」而是「不触发」）：token 清理 / `_advisorRuns` 重置 / `ENG_ON_REMINDER` 入列 / 槽写 / config 镜像写。

**F6 FR11 口径（单源指针）**：口径**单源** = `docs/core/requirements/PORTABILITY.md:63`——FR11 文本：「无前提」限定为**不要求已退役概念文件 / 产品流程文件**；**git 非前提**（项目 = 带 manifest 的目录）；**无项目 ⇒ 不拒翻**、走建档流；**工作区（`workspace`）⇒ 放行**（`agent.manifest` = null）；**可拒面 = 仅「档非法」（fail-closed）一格**（需求侧同步在册——§2.5）。本处只挂指针，不复述口径（D2）；拒翻判据本体 = 本档 F2 表。

### 2.9 按用点解析与建档流（#188——「会话绑定项目」前提拆除）


**A 装配形（单值附着 ⇒ 按用点解析）**：

- **解析轴**：动作作用于哪个项目的路径 ⇒ 取那个项目的档（机检域 / 文档落点 / 台账归属 / 批次归属 / phase 情境）——**会话不绑定项目**（✗ 选择器 ✗ 记忆 ✗ 「当前项目」单值；用户裁定）。
- **归属形（§⑥）**：目标路径 ⇒ 自其所在目录**上溯取最近带档目录**（`owningProject`——**最近者优先**、不跨兄弟、无全局优先级；嵌套 = 子项目自身带档 ⇒ 各自其主）；祖链无档 ⇒ 发现兜底（`discoverProjects`——纯向下）。**发现 ≠ 归属**（归属 = 上溯取最近；发现纯向下），同住 `projectView` 两段合成（KD-M1-30）。**取根面（`projectRootView` / `resolveProjectRoot` / 台账 `resolveLedgerRoot`）只取归属命中**——发现读数只供 `workspace` 报明，不进 `root`（**不向下取根**）。
- **读侧单点** = `projectView(target)`（§2.2——非抛错 / 零写 / 五态）；**会话起点不再 fatal**：钩子只做「解析 + 轻动作建档 + 附着 / 记账」，任何非 ok 态都不抛（KD-M1-25）。
- **`agent.manifest` 定位**：由「会话唯一项目档」降为**缓存 / 种子**（值刷新仍走 §2.6 ③b 每回合 mtime 门控——KD-M1-17 零改）；会话起点解析结果记 `agent._projectView`（形状见 §2.2 钩子段；报明与测试的取证面）。
- **消费面（收口现状）**：`write-gate.resolveReviewRootsFor`（写门面——评审受理不再消费，判据见 §2.5 条「advisor 评审门文档受理」）/ 批档基底（`batch-paths.mjs`）/ 台账键（`ledger-db.mjs`）已具**按用点解析**（工作区面收口 = §2.5 同批条）；
  **文件工具**（`thincoder-core/tools/shared.mjs` `resolveInCwd`——会话 cwd 基准 = 标准行为）**零改 + 结语**（结语落点 = 本行）；机检 `scripts/doc-check*.mjs` 等余面按目标路径读盘（既有形态）。

**B 发现面（git 非前提 · 五级梯）**：判据本体 = §2.2 `discoverProjects` / `discoverRepos`（两种梯表 / 一个 walk 内核——KD-M1-23）；`git` 工具面的行为变更与同步见 `docs/core/design/TOOLS.md` §6.13。

**C 壳面建档流（两端同形）**：

| 情形（梯） | 处置 | 承载 |
|---|---|---|
| 档合法（①/③ 命中） | 附着（`agent.manifest` ← 档内容） | 钩子：CLI 装配 / 重估 · VSC `hydrateRun` |
| 项目缺档（② 锚 = 裸仓 · ⑤ 无项目） | **轻动作：就地建档**（内容 = `DEFAULT_MANIFEST`；`writer:'main'`）——**项目落地 = 建 manifest**；梯⑤ 落点 = **会话锚**（`git init` 非前提） | 同上（两端同判：CLI 恒建 · VSC `init: depth === 0`——子代理不建档） |
| 锚 = 多根工作区（③ 或 ④ 命中 ≥1 项目） | **不建档 / 不猜**：报明事实 + 点名项目根（信息面） | 报明面（§2.6 条 1b）+ 动作侧各自报明（§2.5 处置表） |
| 档非法 / 建档失败 | 不拒（会话照常起）+ 报明 | 报明面 |

- **`git init` = 可选增强**：机制**零自动执行**（源码面判据：钩子 / 决策树无 `git init` 调用；`git` 工具 `init` 动作 = §6.13 例外——以 cwd 为落点，归用户 / 模型手，经确认语义 = 用户要版本管理时才提供）。
- **落地判据**：建档恒落会话锚（梯② 裸仓锚 ∥ 梯⑤ 空目录）；梯③④ 命中 ⇒ `workspace` 报明、零建档；**不递归、不在锚界外预建**、不预建其他项目（多项目各建各的、用到时再建）。

**D phase 情境注入形（多项目）**：注入物 = **会话锚项目**（`agent.cwd` 的解析结果）的状态；动作作用于别的项目时参数按该动作的路径解析（**不注入、不切换「当前项目」**）。行形 / 判据 / 四态见 §2.6。**锚为工作区**（`agent.cwd` 解析不出唯一项目）⇒ 注入物 = **工作区事实行**（无相位行——§2.6 条 1b），会话照常起。

**E 提示词模板**：「项目状态档」段（`thincoder-core/prompts/persona-engineering.md`，唯一副本）按新模型改写。

**边界（不做）**：翻转面判据本体零改（`/eng` · `/session` · 核心 `eng` 工具 · ACP——#41 拒翻语义沿用；**但发现梯升级使可拒面收窄**：梯⑤ 现可建档 ⇒ 不再落拒格；**再收窄**：工作区（`workspace`）不落拒格 ⇒ 可拒面 = **仅「档非法」**（用户裁定））；消费面回退链零改；不做「当前项目」选择器 / 记忆；不做启动期人读横幅（报明面 = 情境行 + 动作侧——**端差消**）。

### 2.10 agent 工具面（`manifest` 工具——用户裁定）

用户三条指令 ⇒ 口径 = **全键读写**；本面 = 主 agent 对 manifest 的读写出口。

**工具形（KD-M1-38——点改，非整档写）**：`manifest` 工具（新档 `thincoder-core/agent-tools/manifest.mjs`），三动作：

| 动作 | 参数 | 语义 |
|---|---|---|
| `read` | `target?` | 现档 + 校验态（`ok` / `missingKeys` / `unknownKeys` / `errors` / 缺档报明）——`readManifest` 语义 |
| `init` | `target?` | 缺档 ⇒ 建默认档（`initManifest`；内容 = `DEFAULT_MANIFEST`）；**已带档 ⇒ 拒**（不覆盖——`initManifest` 本体无覆盖保护，工具面补此闸） |
| `write` | `target?` `key` `value` | **点改**：读现档 → 设节点 → 落盘前 `validateManifest`（`writeManifest` 内——非法 ⇒ 拒 + 盘零变）；**缺档 ⇒ 拒** + 引导 `init`（写不建档） |

- **参数面**：`target` = 显式目标目录（缺省 = 会话锚 `ctx.agent.cwd ?? ctx.cwd ?? process.cwd()`——先例 `eng.mjs:81`；相对形按 `ctx.cwd` 归一——先例 `git.mjs:32-35`）；
  `key` = 点分路径（形如 `docRoot.design` / `index.publicRepos`）；`value` = 字符串——先 `JSON.parse`，失败取字面串（同款口径 = `thincoder-core/agent-tools/settings.mjs:216-228`），`"null"` ⇒ `null`（`docRoot.*` 的「本面无」——KD-M1-37）。
- **写面白名单 = 全键族**（需求 ②.7 写项逐字）；**谓词钉死**：`keys` 中非 `nestedKeys` 父键者（= `version` / `phase` / `codePaths` 整键）+ `nestedKeys` 子键（`docRoot.*` / `index.*`（含 `publicRepos`））；**两族整键写（`docRoot` / `index` 传整个对象）⇒ 拒**。
  判据单源 = `MANIFEST_SCHEMA`（`manifest-schema.mjs:55-67`）；白名单外 ⇒ 拒（拼写保护——未知键写盘 = 静默死键，KD-M1-36 问题本体，挡在写入口）。
- **返回面**：`read` 五态带稳定锚 `state=ok|missing|invalid|workspace|no-project`（ok 态附 manifest JSON + `missingKeys` / `unknownKeys` / `errors` 行——非空才出）；`init` / `write` 成功 = 结果行含落点 `path`；拒面 = **抛错**（统一前缀 `manifest <action>: refused — …`；工作区 ⇒ 报明事实 + 下辖项目全列 + 点名 `target` 的下一步）。
- **写路径复用（零新写路径）**：落盘恒经 `writeManifest`（`thincoder-core/manifest.mjs:252`——writer 闸 `:253` + 校验前闸 `:256`）∥ `initManifest`（`:270`）；`writer` 恒显式 `'main'`（缺省 `'subagent'` 误用即拒——KD-M1-3 / AC-M1-5 零改）。

**目标面（KD-M1-39——判据复用，零新解析器）**：

- `read` ⇒ `projectView(target)`：按用点解析五态（归属 ∨ 发现兜底）；`ok` 时再 `readManifest(view.root)` 取细节面（`projectView` 面不含 `missingKeys` / `unknownKeys`）。
- `init` / `write` ⇒ `projectRootView(target)`（直读形）：`ok` ⇒ root（**归属命中**）；`workspace` ⇒ **报明 + 下一步**（下辖项目全列 + 指明显式 `target`——不猜，**不就地建档**；文案去 `ambiguous` / 「never picks one」）；`none` ⇒ init 落点 = `target` 自身（梯⑤「在会话锚建」的显式目标版——`initManifest(target)` 经 `writeRoot` 同落点），`write` ⇒ 拒（无档可改）。
  **同一 target 两面同答**：「非项目目录 + 下辖 1 个项目」格上，`read`（`projectView`）与 `init` / `write`（`projectRootView`）都读 `workspace` ⇒ 都报明、都不取那个子项目当根、都不就地建档。分野只在读面多一条「档可读否」（`ok` / `invalid` / `missing`）——取根那一问两面共用同一个归属形。
- **不唯一解析不猜的判据**：`resolveProjectRoot` 在「不可唯一解析」（`workspace` / `none`）时塌缩 `null`——**回落发生在调用方，不是本函数**（`docRootBase` `thincoder-core/manifest.mjs:97` ∥ `writeRoot` `:121`，两处 `?? resolve(cwd ?? ".")`）；写 / 建两动作**不得**直用（直用 = 静默挑锚 / 落到工作区根）；一律经 `projectRootView` 取直读形（`workspace` ⇒ 报明 + 下一步）。与发现梯语义同源（§2.2 / §2.5 / §2.9）。

**装配落法（file:line）**：

- 工具文件 = `thincoder-core/agent-tools/manifest.mjs`（已落；描述经 `DESC("manifest")`——`thincoder-core/tools/shared.mjs:19` 单解析面）。
- 登记册 = `thincoder-core/agent-tools.mjs` +1 行（邻 `engTool` 行 `:15`）——注册面单一（F1 约束）；
  探针可枚举 = `scripts/tool-schema-size.mjs:35-41`（经登记册枚举，自动入册）。
- 挂载 = `thincoder-core/agent/family-tools.mjs` **depth-0 段**（`depthOnly` 表 `:141-149`——`ledgerTool` `:145` 后；动态 import 名面 `:29`）：**两模式同挂**（需求未设模式门——写门对任何会话生效，同 `spawn-gates.mjs:79-86` 口径）；
  子代理各段（eng-coder / eng-designer / coder / consult / 兜底）挂**只读变体**（`manifestReadTool`——`action` 枚举只剩 `read`，`init` / `write` schema 级不可达 = 权限面第一道；判据 / 挂载行 = §2.10.1）。CLI / VSC / desktop 同表自动（核单源装配——调用点 `thincoder-core/agent/setup.mjs:183`；VSC 经核 `prepareRun` 同调）。
- 分类面 = `thincoder-core/agent/dispatch-gates.mjs` `isSubagentReadonlyAction` 补一格：`manifest` `read` ⇒ 只读类（planMode 放行 / 免审批——先例 = settings `:73-78`）；`init` / `write` 保持侧效门（审批不绕过）。
- 描述档 = `thincoder-core/tool-docs/manifest.md`（已落——单档 ≤8,000 字符预算：`scripts/tool-schema-size.mjs:72`）；VSC 打包口径随拍 = `thincoder-vscode/scripts/check-vsix.mjs:37` `EXPECT["tool-docs"]` **50**（as-of manifest-agent-tool 批：48 + 描述档 1 + 既有漂移收正 1，当时现盘实读 49 档；**现行读数**见 §2.10.1 受影响文件行 6 = 53 ⇒ 54）。
- 二道防线**零改**（`spawn-gates.mjs` `MANIFEST_BASENAME` 分支 `:104-106`——子代理 `files` 域拒照旧）。

**报告面（KD-M1-40——判定 = 随动，零改）**：工具写盘 = 盘面变化 ⇒ 情境行经既有 ③b mtime 门控于下回合采纳（`thincoder-core/agent/setup-reminders.mjs:122-140` `refreshManifest`——KD-M1-17 零改）；**不新增**「工具写后同步内存值」通道——`agent.manifest` 写点保持两处（钩子附着 ∥ ③b 采纳；第二值源否）；且工具目标可为**非锚项目**——直写内存值会把非锚项目状态错当锚项目状态（违 §2.9 D「注入物 = 会话锚项目」）。

**变更记账面（KD-M1-41——豁免）**：`manifest` 工具**不入变更记账通道**（明文豁免——非「待修」）。四面逐条：
① **门禁**（工程模式父侧写门）：通道以 (工具, args) 取目标路径（`thincoder-core/agent/helpers.mjs` 的 `toolTouchPaths`——无钩子 ⇒ `[args.path]`）；`manifest` 写目标 ≠ args

（目标 = `<项目根>/PROJECT-MANIFEST.json`，解析在 execute 内——`thincoder-core/agent-tools/manifest.mjs`）⇒ 裸加名（进 `FILE_MUTATORS`）会把**每个** manifest 调用（含 `read`）在无活设计槽时推入保守拒（非字符串目标 × 父门保守拒）——行为回归，非修复。
② **记账**（`_touchedFiles` / `noteMutations`）：工具内自记账 = 第二记账点（违唯一记账点纪律——`thincoder-core/agent/dispatch-gates.mjs`）。

③ **L3**（peer 写重叠面——`FILE_MUTATORS ∪ file_ops`，`thincoder-core/peer-domains.mjs`）：peer 面按 (工具, args) 取路径 ⇒ 工具侧接不上。
④ **作用域规则**（spawn `files` 二道防线）：`PROJECT-MANIFEST.json` 已有专用拒（`MANIFEST_BASENAME` 分支——KD-M1-14），语义独立于本通道。

判据 = 通道语义以**代码变更为轴**（失效链住 `thincoder-core/agent/record-results.mjs`）；成员历来**枚举制**——`manifest` 与 `settings` / `memory` / `ledger` / `batch` 同类（非文件编辑工具），「不在通道」非缺陷——缺的只是一行**显式在档**（防下轮再当缺陷发现）。

**解除条件**（三式，触发 ⇒ 另批走通道级扩展——**先扩谓词契约、禁裸加名**）：① 多实例并发改同一 manifest 实证 ∥ ② 审计清单完备性成为验收项 ∥ ③ 该面触碰需求出现——首个具名实例 = `manifest write` 可改 `index.publicRepos` / `codePaths` ⇒ 直接改检索 origin 集（`thincoder-core/declaration.mjs` → `thincoder-core/memory/code-search.mjs`）与写门分类，且该改动作零入四面。

**边界（本工具面不做）**：单目标逐次调用（不做批量自动发现——不取候选并集 / 不扫全盘多档齐建）；不做 CLI 子命令（人面另议）；不替代装配侧既有调用点（翻转 ∥ 情境行 ∥ 钩子零动——需求 ③ 逐字）；不新增 manifest 键 / 不改校验器判据 / 不改写门 / 不动二道防线；不做键删除动作（「本面无」= 写 `null`——KD-M1-37 既有表达）。


**需求侧锚**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7（`:29-34`）+ ③ 边界句（`:41`）+ ④ **AC-M1-10–12**（`:55-57`）+ ⑤（`:63`）——本档只挂指针（D2）。

**字段语义达用点（知识面——2026-10-16 用户令 · 台账 `#1585`）**

**需求（回指 · 三链同源）**：主 agent 仅凭**工具描述 + 提示词**即可判「某键该不该改、改成什么、不改会怎样」，不必翻设计档——需求块 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §5.1「字段语义须达用点」（台账 `#1585`）。
**本块 = 知识面设计**（不碰机制面：键面语义 / 写门 / 结构 / 白名单零改）。

**方案与理由（两层分工——D2 不重复）**：

| 层 | 载体 | 常驻性 | 载荷（住哪层） | 不载 |
|---|---|---|---|---|
| ① 键面事实 | `thincoder-core/tool-docs/manifest.md`（`DESC("manifest")` 单解析面——`thincoder-core/tools/shared.mjs:19`） | **常驻**（每轮可见）⇒ 受篇幅约束 | **键目录（可族分组）+ 每键一句**：是什么 · 何时动 · 改错后果 | 管理流程 / 与台账·批次档分工（②的活） |
| ② 管理面 | `thincoder-core/prompts/persona-engineering.md`「项目状态档」节 | 场景触发**阅读**（物理上文件级常驻——见「触发与实况」） | **怎么管 · 有什么用 · 何时动 · 与台账 / 批次档的分工**（三账分工 = 需求 §5.4） | 每键完整语义目录（①的活） |

**为什么这样分**：键面事实是**用点必需且封闭有限**（20 个可写节点）⇒ 宜常驻、宜短句，一次备齐；管理面判据（何时想起它）是**流程面**，随场景触发阅读，不进常驻噪音。
**分工线 = 一句问法**：「这个键是什么」住 ①；「什么时候该想起它 / 它和别的账怎么分」住 ②。同一句不写两遍（D2）。

**篇幅上限与取形**：

- **上限**：机制硬限 = 单档 ≤8,000 字符（`scripts/tool-schema-size.mjs:72` `over8k`）；**设计自设更紧上限 = `thincoder-core/tool-docs/manifest.md` ≤5,000 字符**（面专属读数）。
- **算术闭合**：现值 **2,235 字符** + 载荷预算 **≤2,300 字符** = **≤4,535 ≤ 5,000**（余 ~465；且 5,000 ≤ 8,000 机制硬限）。
- 载荷预算 = 20 节点 × ~115 字符/节点（族级行按节点均摊）；**目标语言 = 英文**（同义句长于中文 ⇒ 按 115 取值）。
  **帽值登记**：本帽 = **面专属读数**（读数与算式住本块）+ **指针行**——总预算读数唯一权威处 = `docs/core/design/PROMPT-SYSTEM.md:309`（§6.11 预算表）；该表 +1 指针行 = 实施轮（受影响文件表行 5）。
  **F15 总预算影响**：载荷 ≤+2,300 字符 ⇒ 总量 129,766 → ≤132,066，比值 1.253 → ≤1.276（离「≤0.75 × 基线」更远——报告态，父侧裁；`docs/core/requirements/TOOLS.md:69` F15）。
- **取形 = 目录 + 每键一句**（非段落散文；**可族分组**——同族节点键名逐列 + 逐族一句）。句形「`键` — 是什么；何时动；改错 ⇒ 后果」（三腿齐）。
  例：`index.excludePaths` — 项目根相对路径**前缀**数组（索引用途）；**要排除某目录不入索引时改它**；写错 ⇒ 该目录仍入索引（前缀命中 = 恰等 ∨ 后随 `/`）。
- **引设计档不复制**：描述只承载「用点上必须知道的最小事实」；全语义 / 判据 / 机制**仍单源在本档**（D2），描述不复制本档段落。
  **引法（解「禁引证」）**：描述内**零档名 / 零节号 / 零指路句**（`thincoder-core/prompts/common.md`——提示词面禁带文档引用，模型读到的句子须自足）；设计档指针只落**注释面**——`thincoder-core/agent-tools/manifest.mjs:3` 头注已载「权威设计 = `docs/core/design/MANIFEST.md` §2.10」，无需在描述里再指。

**触发与实况（须报）**：② 的**触发条件** = 「主 agent 要动 manifest 某个键 / 判断某声明该不该改」这一刻——节领句写成场景条件句（「动 manifest 键之前……」），内容只在该场景被读取执行。

**物理实况**：工程模式提示词三档为**文件级常驻**（`thincoder-core/prompt-overlays.mjs:42` 恒拼接 `thincoder-core/prompts/persona-engineering.md` / `thincoder-core/prompts/common.md` / `thincoder-core/prompts/discipline-engineering.md`），**无节级条件装配机制** ⇒「只在该场景进上下文」在**文件级不可达**。本设计以「**短节（新增 ≤8 行）+ 场景触发领句**」达成「不常驻噪音」的**意图**；

  **节级条件装配 = 新机制，出本批边界**（另批另裁）。
**同批收正（`:56` 措辞）**：② 节尾续管理面的同一笔，一并收正 `thincoder-core/prompts/persona-engineering.md:56`（EN `:56`）的失义措辞「多个 = 歧义——停：列候选，不猜，也绝不建档」。
收正后口径与 `docs/core/design/MANIFEST.md:310` / `:769` 同源：工作区 = **常态**（不抛「歧义」/ `ambiguous`）；处置 = 列候选 + 报明事实 + 点名项目根（不猜、不 brick）。

**键目录（①载荷骨架）= 描述内容契约**（本表 = 语义契约：键名 + 三腿 + 值形逐条；落地文本 = 英文同义句——`thincoder-core/tool-docs/manifest.md` 现状全英文）。**实施后保留**为描述漂移的唯一对照载体（对照核法 = AC-K2 键名覆盖）；语义单源仍在本档 §2.2，本表不构成第二权威。全 **12** 可写节点；节点集判据单源 = `MANIFEST_SCHEMA`（键集由 `DEFAULT_MANIFEST` 派生）：

| 族 | 节点 | 一句语义（是什么 / 何时动 / 改错后果） |
|---|---|---|
| 顶层整键 | `version` | 档版本号（数值）；建档 / 迁移档时动；写错 ⇒ 校验拒（盘零变） |
| | `phase` | 项目阶段（枚举 `initial-dev` / `production`）；阶段跨越时动；写错 ⇒ 校验拒 |
| | `codePaths` | 路径**段名**数组（声明即替换默认 `["src"]`）；段面布局变时动；写错 ⇒ 分类段面收空（兜底分类仍在） |
| `docRoot.*` | `requirements` · `specs` · `design` · `modules` · `batches` | 文档层各根的路径（串 ∥ 多根数组 ∥ `null`＝本面无）；文档层跨根 / 换根时动；写错 ⇒ 校验拒，或机检 / 批次档落点 / 写门评审根静默错 |
| `index.*` | `codeExtensions` · `docExtensions` | 追加的代码 / 文档扩展名（并集，只增不减）；索引漏某类型时动；写错 ⇒ 该类型文件不入索引（只增不减 ⇒ 多写不炸 · 漏写即漏索引） |
| | `excludePaths` | 项目根相对路径**前缀**数组（索引用途）；**要排除某目录不入索引时改它**；写错 ⇒ 该目录仍入索引 / 误排除他目录 |
| | `publicRepos` | 公共仓路径数组（从本仓根可解析）；接入公共仓索引 / 跨仓引用时动；写错 ⇒ 该公共仓检索不可达（origin 集收空 / 指错路径——见上「变更记账面」③） |

> 目录只给「用点必需」的最小事实；值形归一细则 / 消费面清单 / 判据仍读本档对应节（§2.2 `:120-132`）。两族整键写（`docRoot` / `index`）⇒ 拒（须点改子键）——此句属**动作面**，住描述既有段。


**验收对照（回指需求块——三链同源）**：

| # | 验收条 | 核法（源面） |
|---|---|---|
| AC-K1 | **场景答问·字段语义**：给「本仓要排除归档目录不入索引」，**只读** `thincoder-core/tool-docs/manifest.md` + `thincoder-core/prompts/persona-engineering.md`（不开本档）⇒ 答出 ① 键 = `index.excludePaths` ② 为什么 = 索引用途前缀排除数组 ③ 改错 = 前缀命中语义（该目录仍入索引 / 误排除他目录） | 描述档**恰一行**把该键绑到「索引用途 + 前缀排除 + 目录」（该键语义断言全在描述面）；提示词节**零键名**（只供管理面） |
| AC-K1b | **场景答问·动作面**：问「本仓无档时怎么建」「改一个键怎么写」⇒ 答 `init`（无档建默认档 · 已带档拒）/ `write <key> <value>`（缺档拒 + 引导 init） | 描述档动作段命中 `init` / `write` 两行且明「已带档拒」「缺档拒」 |
| AC-K2 | **键目录全备**：载**全部 12 可写节点**（键名逐列 ∥ 可族分组）；每节点三腿齐 = 是什么 · 何时动 · 改错 ⇒ 后果（无后果者明写「无失败后果 + 理由」） | 文本键名覆盖 = 12（与 `MANIFEST_SCHEMA` 白名单逐字对齐）；三腿逐节点在（源面读判） |
| AC-K3 | **两层不重复（D2）**：同一键语义句只在 ① 出现一次；② 节内不含键面语义 | ② 节内**零键名命中**（12 键名行扫——可机判）；① 同键同义句恰一次 |
| AC-K4 | **字面上限**：① ≤5,000 字符（本块自设帽；且 ≤机制硬限 8,000）；② 提示词节新增 ≤8 行 | 字符计数（`thincoder-core/tool-docs/manifest.md`）/ 行数差 |
| AC-K5 | **零语义 · 零行为改**：键面语义 / 写门 / manifest 结构 / 白名单零 diff | `thincoder-core/manifest.mjs` / `manifest-schema.mjs` / `MANIFEST_SCHEMA` 零 diff |

**受影响文件表（行数口径 = 读取工具显示行数——末行无换行符 ⇒ = `wc -l` + 1；as-of 2026-10-16 实测）**：

| # | 文件 | 面 | 执行角色 | 当前行数 | 变更 | 编辑点 | 增量 |
|---|---|---|---|---|---|---|---|
| 1 | `thincoder-core/tool-docs/manifest.md` | 产品（描述档——`DESC("manifest")` 常驻面） | eng-coder | **17**（2,235 字符） | 修改 | 末段后增「键目录」块（20 → 12 节点——本批三键退场后算式：整键 3 + `docRoot.*` 5 + `index.*` 4 = 12，见 §2.11） | ≤ +2,300 字符（落 ≤5,000 自设帽） |
| 2 | `thincoder-core/prompts/persona-engineering.md` | 产品（英文运行时面提示词） | eng-coder | **217** | 修改 | 「Project state file」节（`:52-60`）**同义落地**（含 `:56` 同款收正） | ≤ +8 行 |
| 3 | `docs/core/design/MANIFEST.md` | 文档（设计档） | eng-designer | **868** | 修改 | 本块（§2.10 尾）+ `:201` / `:604` 坐标收正 | ≤ +100 行 |
| 4 | `docs/core/design/PROMPT-SYSTEM.md` | 文档（设计档——预算表） | eng-designer | **882** | 修改 | §6.11 预算表 +1 行（面专属帽指针行） | +1 行 |

> **文档 / 提示词面零行数义务**（`docs/core/requirements/ENGINEERING-MODE-V2.md:645` F12）；受篇幅约束者 = 产品描述档（**字符帽**，非行数）。**测试覆盖 = 无**（文本面知识设计——核法 = 源面读判 AC-K1–K5，无代码可单测）；实施轮只改文本，无单元测试档。

**关键决策**：

| # | 决策 | 理由 |
|---|---|---|
| KD-M1-42 | **分层载荷**：① 描述载「键面事实目录」（常驻 · 短句）；② 提示词载「管理面」（场景触发阅读）；两侧零重复 | 键面封闭有限（20 → 12，算式见 §2.11）宜常驻；管理面是流程判据，常驻即噪音（D2） |
| KD-M1-43 | **描述取形 = 目录 + 每键一句（可族分组）**（是什么/何时动/改错后果）；**描述内零引证**（档名 / 节号 / 指路句），设计档指针落代码注释面 | `thincoder-core/prompts/common.md:48` 提示词面禁带文档引用（模型读到的句子须自足）——「引设计档不复制」的实现形 |
| KD-M1-44 | **篇幅** = 机制硬限 8,000 字符 ∨ 设计自设 5,000（面专属读数——算式住本块）；**不用新载体**（不加 skill / 不加节级条件装配） | 新载体 = 新机制，出本批边界（本批 = 知识面） |
| KD-M1-45 | 与 `settings` 描述形**对齐**、**偏离其粒度** | 对齐：工具描述承载「用点必需的字段语义 / 值口径 / 副作用」（先例 = `thincoder-core/tool-docs/settings.md`；需求面 `docs/core/requirements/SETTINGS-TOOL.md` N-ST6「描述纪律」）。偏离：settings 只给两例类型口径（无全键目录）；manifest 键面封闭（20 → 12）且需求要逐键可判 ⇒ 给全目录 |

**边界（本块不做）**：不改键面语义 / 不改写门（fail-closed）/ 不改 manifest 结构 / 不新增字段 / 不改校验器判据（需求块边界逐字）；**不动机制代码**（`thincoder-core/agent-tools/manifest.mjs` / `manifest-schema.mjs` 等零改）；**不做节级条件装配机制**（新机制——另批另裁）；编修需求档 = 父侧笔。

**先例与勘察**：先例 = `settings` 工具描述形（`thincoder-core/tool-docs/settings.md`；需求面 `docs/core/requirements/SETTINGS-TOOL.md` N-ST6「描述纪律」）——对齐其形、偏离其粒度（KD-M1-45）。

**勘察行（查过的公共源 ∥ 结论）**：① 本仓工作目录内——`thincoder-core/tool-docs/*.md`（当时 52 档；现盘 54——见 §2.10.1 受影响文件行 6）实读 ⇒ **无「描述档承载全键目录」先例**（`thincoder-core/tool-docs/settings.md` 只给两例类型口径）；② 键语义单源 = 本档 §2.2——在位；③ 工作目录外公共源（`D:\ref\` 参考系）= **未勘察**（出本仓工作目录——按声明读；本批未查）。

**归属（判据 7）**：文档地图 = `docs/README.md`（在位）——本批五档均在既有档内就地扩（描述档末段 ∥ 「项目状态档」节尾 ∥ 本档 §2.10 尾 ∥ `PROMPT-SYSTEM.md` §6.11 表内 +1 行），零新建档 / 零新建节。


#### 2.10.1 子代理只读面（`manifest` 读变体——用户令 2026-10-22）

用户令（2026-10-22 13:52）：「我觉得子代理也要给 manifest 的权限，不能只有主代理。」本块 = **读面开给子代理，写面仍归主 agent**。

**现状（as-of 2026-10-22 实测）**

- 全量工具 = `thincoder-core/agent-tools/manifest.mjs:117`（`manifestTool`，action 枚举 `read` / `init` / `write`）；只装 depth-0 组（`thincoder-core/agent/family-tools.mjs:144` `const depthOnly = depth === 0`；段内 `:153` `manifestTool`）。
- depth>0 五段（eng-coder `:185` / eng-designer `:187` / coder `:189` / consult `:190` / 兜底 `:191`）零 `manifest`；同段只读先例 = `ledgerReadTool` / `teamLedgerReadTool`（五段皆挂）。
- 描述档首句自称「Attached to the main agent only; subagents can neither see nor write it」（`thincoder-core/tool-docs/manifest.md:1`）。
- 后果：子代理拿不到 `docRoot.<key>` 的机器读数；提示词里的文档路径只能写死，或靠任务书逐条口传——两条路都会漂。

**目标**

- 新增只读变体 `manifestReadTool`：同名 `manifest`，`action` 枚举 = `["read"]`，参数只剩 `target`，`readonly: true`。
- 描述单源 = 新描述档 `thincoder-core/tool-docs/manifest-read`（`DESC("manifest-read")` 解析——`thincoder-core/tools/shared.mjs:19` `export const DESC = (name) => loadToolDoc(name)`）；全文逐字见下。
- **`DESC(name)` 的 `name` = 描述档名，不是工具名**：`thincoder-core/prompt-files.mjs:59-61` `loadToolDoc(name)` 读 `join(TOOL_DOCS_DIR, `${name}.md`)`。两变体同名 `manifest`、描述各写一份——两档全名逐字如下（子代理面一档由实施轮新建）：

  ```text
  thincoder-core/tool-docs/manifest.md        主 agent 面（DESC("manifest")）——已落
  thincoder-core/tool-docs/manifest-read.md   子代理面（DESC("manifest-read")）——实施轮新建
  ```

  `manifest-read` 只作描述档名，不作工具名出现在任何装配面上。
- 登记册双导出：`thincoder-core/agent-tools.mjs:16` 改为 `export { manifestTool, manifestReadTool }`；VSC 登记册 `export *` 随动（`thincoder-vscode/src/agent-tools/index.mjs:8`），端侧零改。
- 主 agent 描述档首句随正：子代理有只读变体，`init` / `write` 仍只归主 agent。
- `readAction` 增参 `{ canInit = true }`：`false` 时 `missing` / `no-project` 的引导行不指 `init`——子代理 schema 无该动作，指向不可达动作会把模型送进必然失败的调用；缺省 `true` ⇒ depth-0 输出逐字零变。

**工具定义（逐字——`thincoder-core/agent-tools/manifest.mjs` 新增导出）**

```js
/** 子代理只读变体（同名 `manifest`——action 枚举只剩 `read`）：init / write schema 级不可达（权限面第一道）；
 *  execute 入口再做一次机械拒绝（providers 不强制 schema enum——第二道）。 */
export const manifestReadTool = {
  name: "manifest",
  description: DESC("manifest-read"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["read"], description: "read — current manifest + validation state (five-state anchor, never throws)" },

      target: { type: "string", description: "Explicit target directory — defaults to the session anchor; relative paths resolve against it. A workspace target (several projects below it) is reported with the full project list — pass the project root you mean." },
    },
    required: ["action"],
  },

  readonly: true,
  async execute(args, ctx) {
    if (args?.action !== "read") {
      throw new Error(`manifest read: refused — this read-only variant exposes only action=read (got ${JSON.stringify(args?.action)})`)
    }
    return readAction(resolveTarget(args, ctx), { canInit: false })
  },
}
```

`readAction` 的改动（逐字）：
- 签名改 `function readAction(target, { canInit = true } = {})`；
- `missing` 的 hint 行：`canInit ? "hint: run manifest action=init to create the default manifest here" : "hint: no manifest here — report it; creating one is a main-agent action"`；
- `no-project` 同式：`canInit ? 原行 : "hint: no project on the ancestor chain and none below — report it; creating one is a main-agent action"`。

**描述档全文（逐字——新描述档内容）**

```text
Read the project manifest (PROJECT-MANIFEST.json) — the project-level state file: version / phase / docRoot (the root of each document layer: requirements / specs / design / modules / batches) / codePaths / index. Read-only: the only action is `read`. Creating or editing a manifest belongs to the main agent — this subagent variant has no init / write action.

read [target] — report the manifest state with a stable anchor `state=ok|missing|invalid|workspace|no-project`. The ok state prints the manifest JSON plus missingKeys / unknownKeys / errors rows (only when non-empty). Never throws — a missing manifest is reported, not refused.

Use it to locate documentation instead of assuming a path: read `docRoot.<key>` and resolve your target under that root. A missing face (`null`) means that document layer does not exist in this project — report it instead of inventing a path.

target — explicit target directory; defaults to the session anchor, relative paths resolve against it. A workspace target (several projects below it) is reported with the full candidate list — name the project root you mean and pass it as target.
```

**挂载面（判据：全部 depth>0 段）**

- 判据 = 与同段两条只读变体同律：`ledgerReadTool` / `teamLedgerReadTool` 已在全部 depth>0 段（含 consult ∥ 兜底）；三者同类（项目范围只读面、零写风险），没有一条判据能把 manifest 读面单收出去——单收就多一条例外规则，且得为它给出理由。
- 只读 = 零写风险：`read` 从不抛、零网络、零写盘（`projectView` 纯读——`thincoder-core/agent-tools/manifest.mjs:93-115`）。
- 「子代理靠任务书拿路径」不构成收窄理由：任务书给的是这次读哪几档，`docRoot` 给的是每层在哪个根——不同源，子代理本就该自己核一次。
- 逐字挂载行（`thincoder-core/agent/family-tools.mjs`；插入位 = `teamLedgerReadTool` 后，只读变体成簇）：

```js
const { planTool, subagentTool, taskTool, skillTool, goalTool, verifyTool, recentChangesTool, timerTool, advisorTool, engTool, readHistoryTool, contextTool, batchTool, manifestTool, manifestReadTool, consultStartTool, consultStopTool, parentChannelTool, docCheckTool } = await import("../agent-tools.mjs")

: engChildRole === "eng-coder" ? [parentChannelTool, ledgerReadTool, teamLedgerReadTool, manifestReadTool, advisorTool, verifyTool, batchTool(batchDoc), docCheckTool,

: engChildRole === "eng-designer" ? [parentChannelTool, ledgerReadTool, teamLedgerReadTool, manifestReadTool, batchTool(batchDoc), docCheckTool,

: role === "coder" ? [parentChannelTool, ledgerReadTool, teamLedgerReadTool, manifestReadTool, verifyTool, advisorTool, ...(batchDoc ? [batchTool(batchDoc)] : [])]
: role === "consult" ? [recentChangesTool, ledgerReadTool, teamLedgerReadTool, manifestReadTool]

: [parentChannelTool, ledgerReadTool, teamLedgerReadTool, manifestReadTool]
```

**写面仍归主 agent（判据与理由）**

| 道 | 机制 | 可机判 |
|---|---|---|
| ① schema | 只读变体 `action` 枚举 = `["read"]`，无 `key` / `value` | 子代理装配面该字段逐字断言 |
| ② execute 入口 | 非 `read` ⇒ 抛 `manifest read: refused — …` | 实调 `{action:"init"}` / `{action:"write"}` ⇒ 抛错 + 盘 sha256 不变 |
| ③ 写门 | `writeManifest` / `initManifest` 的 `writer` 闸；工具面 `writer: "main"` 恒显式 | 源码面字面量在位；`{writer:'subagent'}` 直调 ⇒ 拒（AC-5 既有用例零改） |
| ④ spawn `files` 域 | `MANIFEST_BASENAME` 专用拒 | 子代理 `files` 声明该档 ⇒ 拒（AC-18 既有用例零改） |

理由：写 manifest 改的是项目级状态声明——`docRoot` 决定整条文档链读哪里，`index.publicRepos` 决定检索 origin 集；写错即全链静默错位。读错一次的结果只是「这回合读错了档」，下一回合可纠。两面风险量级不同 ⇒ 权限不同。`manifestTool` 与写门 / 白名单 / 校验器零 diff。

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| KD-M1-51 | 允许子代理读 manifest：新只读变体 `manifestReadTool`（schema 窄化），全量工具不挂子代理 | 用户令；读面零写风险，写面风险量级不同 |
| KD-M1-52 | 读变体挂**全部** depth>0 段（含 consult ∥ 兜底） | 与两条只读先例同律——同类面无区分判据；单收 = 例外规则无理由 |
| KD-M1-53 | 两变体同名 `manifest`，经登记册双导出（不另起工具名） | 先例 `ledgerTool` + `ledgerReadTool`；模型每面只见一个 `manifest` |
| KD-M1-54 | `readAction` 增 `canInit` 参数，只读面提示不指 `init` | 指向不可达动作的提示会把模型送进必然失败的调用；缺省 `true` ⇒ depth-0 零变 |

**受影响文件（现值 = 2026-10-22 设计轮实测）**

| # | 文件 | 面 | 执行角色 | 现值（行 / 字符） | 变更 | 编辑点 | 增量预算 |
|---|---|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/manifest.mjs` | 产品 | eng-coder | 200 行 | 新增 `manifestReadTool` 导出 · `readAction` 增 `canInit` | 头注 + `readAction`（`:93`）+ 文件尾 | ≤ +35 行 |
| 2 | `thincoder-core/agent-tools.mjs` | 产品（登记册） | eng-coder | 32 行 | `:16` 改双导出 | `:16` | 0（同行改） |
| 3 | `thincoder-core/agent/family-tools.mjs` | 产品（装配） | eng-coder | 204 行 | `:29` 解构 + 五段挂载（`:185` / `:187` / `:189` / `:190` / `:191`）+ `:183-184` 注释 | 同左 | ≤ +4 行 |
| 4 | `thincoder-core/tool-docs/manifest-read`（全名 + `.md` 见上方「描述单源」逐字块） | 产品（描述档） | eng-coder | 0 | 新建 · 全文 = 上方逐字块 | — | 新档（≤1,500 字符） |
| 5 | `thincoder-core/tool-docs/manifest.md` | 产品（描述档） | eng-coder | 30 行 / 3,759 字符 | 首句改：子代理有只读变体 | `:1` | ≤ +80 字符 |
| 6 | `thincoder-vscode/scripts/check-vsix.mjs` | 工程工具面 | eng-coder | 101 行 | `EXPECT["tool-docs"]` 53 ⇒ **54**（盘上 53 档 + 新档 1；as-of 2026-10-22 设计轮——实施轮落盘前复读一次） | `:37` | 0（数值改） |
| 7 | `docs/core/design/MANIFEST.md` | 文档（设计档） | eng-designer | 984 → **1,145**（2026-10-22 实测——`split("\n")` 读数；LF = 1,144） | 本块 + `:56` / `:600` / `:196` 收正 + AC-42 + **§3.2 用例表 T68 行预期收正** | 同左 | **实测 +161**（预算 ≤+70，超帽 91：工具定义 / 描述全文 / 挂载行三段逐字块——验收②的硬要求） |
| 8 | `docs/core/design/TOOLS.md` | 文档（设计档） | — | **无需改** | 判据（三面逐条）：① 工具名不变——`manifest` 一名两变体，`TOOLS.md:142` 元工具清单按工具名计 ⇒ 计数与逐字零变；② `TOOLS.md:222` §6.7 要旨行「project-manifest 全键读写出口（三动作 `read` / `init` / `write`——点改 ∥ 全键族白名单 ∥ depth-0 两模式同挂）」对**全量变体**逐条仍真，且该行未断言「子代理不可见」⇒ 无需收正；③ 只读变体的逐面契约 = 本档 §2.10.1（要旨行是摘要、不是契约面——摘要不随每个新增变体扩写） | — | 0 |
| 9 | 单元测试档（本批一次性——实施轮新建，收口即删） | 测试 | eng-coder | 0 | 装配五段 + 只读 schema + `readonly` 位 + execute 门 + 三态 diff + 提示行。**一次性之由** = 项目测试纪律（单元测试档 = 改动期反馈回路，收口即删、零保留）；**代价明写**：AC-M1-12 收口后**无**常设回归位——长期守卫落在集成场景树（前端入口；本块是核内 schema / 装配面，无该入口）与实施轮每次触及 `family-tools.mjs` 时的装配断言重跑；不新建常设测试档（新设常设档 = 新机制，出本块边界） | — | 新建 |

**验收对照（回指本批任务书；实施轮可机判）**

| # | 验收条 | 核法 |
|---|---|---|
| AC-R1 | **schema 窄化 + 只读位**：子代理五段各含恰一 `manifest`，`action` 枚举 = `["read"]`、无 `key` / `value`；`depth:0` 两模式仍为全量变体（三枚举）；只读变体 `readonly === true`——消费面四门逐门点名：`thincoder-core/agent/dispatch.mjs:61`（planMode 门 `!tool.readonly`）/ `:177`（审批门 `tool.readonly || …` ⇒ 免审批）/ `thincoder-core/agent/record-results.mjs:98`（变更记账 `!tool.readonly && …`）/ `thincoder-core/agent/helpers.mjs:375`（只读角色过滤 `tools.filter((t) => t.readonly)`） | `assembleFamilyTools` 五格 + depth-0 两格夹具断言 + `manifestReadTool.readonly === true` 断言 |
| AC-R2 | **写面机械不可达**：只读变体实调 `{action:"init"}` / `{action:"write"}` ⇒ 抛 `manifest read: refused — …`，盘 sha256 逐字节不变 | 直调 + sha256 前后对比 |
| AC-R3 | **读面等价（三态逐字 + 两态 hint 分叉）**：`read` 的 `ok` / `invalid` / `workspace` 三态输出与全量变体逐字一致（同一 `readAction`）；`missing` / `no-project` 两态**仅 hint 行不同**——只读面该行零 `action=init` 字样（逐字见本块「`readAction` 的改动」两条），余行仍逐字一致 | 同一夹具双调 diff：三态全等断言 + 两态按行 diff（差异行集 = `{hint}`）+ hint 行断言 |
| AC-R4 | **描述单源**：`manifestReadTool.description` 与描述档逐字节相等；主 agent 描述档首句零 `subagents can neither see nor write`，且明「子代理有只读变体」 | 源码面读判（DESC 解析）+ 字符串断言 |
| AC-R5 | **写面零改**：`manifestTool` 三动作 / 白名单 / `writer: "main"` / spawn `files` 二道防线 / `docRoot` 解析单点零 diff | 源码面零 diff 断言 + AC-5 / AC-18 既有用例零改全绿 |
| AC-R6 | **上下文与包面 + 同名双导出可机判**：新描述档 `thincoder-core/tool-docs/manifest-read.md` ≤1,500 字符（机制硬限单档 ≤8,000 内）；`check-vsix` EXPECT tool-docs = 盘上档数（54）；枚举读数出现**两条** `manifest`（不是一条）——`scripts/tool-schema-size.mjs:35-41` 按**导出名**枚举（`Object.entries(meta)`），`manifestTool` / `manifestReadTool` 两名 ⇒ 两行同 `name: "manifest"` | 字符计数 + `node scripts/tool-schema-size.mjs --json` 的 `manifest` 行数 = 2 断言 + 两读数相等 |

本批（设计轮）自身验收 = ① 本节落位；② 工具定义 / 描述全文 / 挂载行逐字在上；③ 写面判据四条（上表）；④ `doc_check` PASS；⑤ 本轮零改代码（触及面仅本档）。

**用例**

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T84 | 正常：子代理读 manifest | `depth:1` + eng-designer 装配面；`manifest {action:"read"}` | 输出与 depth-0 `read` 逐字相同；`docRoot` 可见 |
| T85 | 错误：只读变体越权 | `{action:"write", key:"phase", value:"production"}` | 抛 `manifest read: refused — …`；盘 sha256 不变 |
| T86 | 边界：子代理遇缺档 | 只读变体 `read`，目标无档 | `state=missing` + 提示行**不含** `action=init`；不抛 |

**边界（本块不做）**：不放开 `init` / `write` 给子代理；不改写门 / 白名单 / 校验器 / 二道防线 / `docRoot` 解析单点；不动提示词档（提示词改用 `manifest read` = 另批）；不新增工具名；不做批量读 / 不扫全盘。

**先例与勘察**：先例 = `ledgerReadTool`（`thincoder-core/ledger-tools.mjs:300`——同名单对象 · schema 窄化 · depth>0 全段）；对齐其形；偏离一处 = 读变体经登记册双导出（ledger 直取 `ledger.mjs` 是因静态链避 `node:sqlite`；manifest 链零 sqlite ⇒ 入登记册可让子代理描述档进 `tool-schema-size` 预算读数）。

**同名双导出的影响面勘察（本仓首例——以「工具名」为键的消费面逐个点名）**：

- **按工具名建表**（唯一会塌缩的面）= `thincoder-core/agent/setup.mjs:232` `const toolByName = new Map(tools.map((t) => [t.name, t]))`；读者 = `thincoder-core/agent/dispatch.mjs:45` `toolByName.get(toolCall.name)`。
  同名 ⇒ Map 内塌缩为**后写者**；**本批不触发**——两变体互斥装配（`thincoder-core/agent/family-tools.mjs:144` `const depthOnly = depth === 0` 单分支），任何一次装配里 `manifest` 恰一名。
- **按导出名枚举**（探针）= `scripts/tool-schema-size.mjs:35-41`（`const meta = await import(at("agent-tools.mjs"))` → `Object.entries(meta)`）⇒ 取导出名、不取工具名 ⇒ 两变体各成一行、不塌缩；读数 = 两条 `name: "manifest"`（AC-R6 机判）。
- **`export *` 转口** = `thincoder-vscode/src/agent-tools/index.mjs:8` `export * from "@thincoder/core/agent-tools.mjs"` ⇒ 两名皆转出，端侧零改。
- **按名取只读性** = `thincoder-server/src/agent/chat-env-tools.mjs:161` `return toolOf[name]?.readonly === true` ⇒ 该表 = 八件环境工具（同档 `:118-127`），**不含 `manifest`** ⇒ 按名取值恒 `false`，本批零影响。
  - 两变体的 `readonly` 位（`thincoder-core/agent-tools/manifest.mjs` 实读）：只读变体 `readonly: true`（`:225`）；全量变体 `readonly: false`（`:141`——动作级分类：`read` 归只读类，`init` / `write` 保持侧效门）。
  - **不得**给全量变体加 `readonly: true`：`thincoder-core/agent/dispatch.mjs:177` 按 `tool.readonly || …` 免审批 ⇒ `init` / `write` 会被放行。
- **结论**：仓内无一处要求「全仓 `manifest` 一名唯一」；唯一会塌缩的 `toolByName` 在两变体互斥装配下零影响 ⇒ 同名双导出成立。
**勘察行**：
- ① `thincoder-core/tool-docs/manifest.md` / `thincoder-core/agent/family-tools.mjs` / `thincoder-core/agent-tools/manifest.mjs` 实读；
- ② `thincoder-core/agent/dispatch-gates.mjs:82-83` 实读——`manifest read` 已判只读类，本批零改；
- ③ `thincoder-vscode/src/agent-tools/index.mjs:8` 实读——`export *` 随动；
- ④ `thincoder-vscode/scripts/check-vsix.mjs:37` 实读——EXPECT tool-docs = 54，盘上实测 54 档（2026-10-22 复查）；
- ⑤ 工作目录外公共源未勘察（本批不依赖外部源）。

### 2.11 用户 manifest 只声明「这个项目」：五键键族（FR42 · 用户 2026-10-22 10:19-10:24 · 回指规格 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.20 `:891`）

**方案与理由**：manifest 的现行键集 = **五键**（`version` · `phase` · `docRoot` · `codePaths` · `index`）——每一键都描述**这个用户项目自身**。三键退场：

| 退场键 | 它声明的是什么 | 为什么不该住在用户项目 |
|---|---|---|
| `promptsLanding` | thincoder 产品源码布局 | 产品内部事实；零 reader；`init` 整份照抄默认档 ⇒ 每个用户项目出生即带本产品路径 |
| `checkConfig` | 工具 `doc_check` 的参数 | 产品工具参数；实际无人配；「可配」本身即误导 |
| `advisor` | 第二套文档指针（map / standards） | `docRoot` 已声明文档在哪——同一事实两处声明（D2）；且其探测面本就带内建默认 |

**接口契约（目标态）**

- `DEFAULT_MANIFEST`（`thincoder-core/manifest-schema.mjs:43`）= 五键：`version:1` · `phase:"initial-dev"` · `docRoot` 五路径 · `codePaths:["src"]` · `index:{codeExtensions:[],docExtensions:[],excludePaths:[],publicRepos:[]}`。
- `MANIFEST_SCHEMA.keys` 由 `DEFAULT_MANIFEST` 派生（零改机制）⇒ 自动五键；`nestedKeys` = `docRoot` / `index` **两族**（`advisor` / `checkConfig` 两行删除）。
- `validateManifest`：`advisor` 形态校验支删除（`:147-149`）；`index` 校验支照旧；嵌套层未知键产线随 `nestedKeys` 自动收为两层；`fillDefaults` 的嵌套默认族 = `docRoot` / `index`（`:170` 注释随正，机制零改）。
- 未知键语义零改（`manifest-schema.mjs:92` 非拒）：旧档三键落入 `unknownKeys`，下次 `write` 经 `fillDefaults` 自然清除 ⇒ **无迁移脚本**；**不留「接受但忽略」分支**（`if (key === "checkConfig") continue` 类写法 = 禁）。
- `manifest` 工具写面白名单 = **12 个可写节点**：整键 `version` / `phase` / `codePaths` + `docRoot.*` 五子键 + `index.*` 四子键；整对象写拒面相应收为 `docRoot` / `index` 两族（`agent-tools/manifest.mjs:126` · `:172` 文案随正）。

**`doc_check` 只判传入文件（用户 2026-10-22 10:27 裁定——判据不漂，范围收窄）**

- 判定范围 = **调用方传入的文件清单**——两种问法各定。**`report` 面**：不给 ∥ `[]` ∥ 非数组 ∥ 含非字符串条目 ⇒ **一律报错**（零遍历、零全域兜底）——`report` 面没有「空清单」读法。
- **`gate` 面**：范围两来源（并集，由调用方传入）：子代理 = 本会话触达记账（`_touchedFiles`）；父侧 = 触达记账 ∪ 本批提交 diff（`git diff <批起 sha> --name-only -- docs`）——工具内不设默认范围。**空清单 = 合法态**：首行 `DOC-CHECK GATE: PASS（0 档）`，且输出行**必带「0 档受检」**字样（不许只给空范围——防「跳过」被读成「已检」）。
- 为什么两面对待：零档没有可扫的东西 ⇒ 不存在「偷偷扫全仓」的兜底风险；纯代码轮次触达档 = 0 是常态，gate 报错会把正常态变成故障。`report` 面仍是「不给清单 ≠ 查全域」的防线。
- 参数面 = **纯内置常量** `DOC_CHECK_BUILTINS`（`thincoder-core/doc-check/index.mjs` 冻结对象）：`lineWidth: 300` · `widthExemptZones: []` · `exemptions: []`。**无 `scanDirs` / `domain` / `roots` / `exclude`**——不扫目录、不建全域索引。
- 两项空列表 = 常量自身的排除类 / 区带类默认值且恒空：豁免谓词（表行 / 围栏 / 可执行行 / 引文）住代码，没有「登记后放过」的写入口 ⇒ 与需求边界「不引入豁免清单」不冲突（空列表 ≠ 可登记豁免）。
- 锚解析序收为两级：① 仓根相对**全路径** ② 引用档**同目录**；`§N` 节在盘判定只读解析命中的目标档（点查，不遍历）。裸名跨目录解析取消——引用须写全路径或同目录（与 D4 实现坐标口径一致）。
- 取值理由（用户 10:27 原话）：「我们做它就是因为以前总是扫全仓导致技术待办爆炸」——旧口径的全域扫描就是老病；新口径把「判定范围」和「解析范围」收为同一集（传入的那几档），不需要域 / 根 / 排除任何配置。
- `doc_check` 不再读 manifest（连「manifest 不可读 ⇒ ERROR」也删）——manifest 报错归 `manifest` 工具；`configError` / `gateParamError` / `readManifest` 调用整体退场。
- 报面随正：gate 行去「声明域 N 档」「排除集」与「运行时取 checkConfig.lineWidth」；报告态声明句改「判据参数 = 工具内置常量；范围 = 传入文件」。**引擎面不再有全域扫描支**：`report` 模式不给清单即报错（零遍历、零兜底）；`gate` 模式范围 = 调用方传入并集。
- **脚本面现状**：`scripts/doc-check*.mjs` 声明面已退场（不读 `scanDirs` / `anchors.exclude`），但仍以显式 `--root` 为域整树枚举 `.md`（`scripts/doc-check-anchors.mjs:215` 的 `walk`）——该枚举仍在盘，不在「引擎面不再有全域扫描支」的口径内。
- 判据两条（锚 ∥ 行宽）的**度量与豁免谓词**零改（`[...line].length` > 300、表行 / 围栏 / 可执行行 / 引文四类）；变的是判定范围与解析序。
- **why·范围 = 调用方给的那几档**：检查范围就是问题归属——判了本轮没碰过的档，别轮的存量问题会记到本轮头上，交付被档外债务拖住（当年「技术待办爆炸」的成因）；范围由调用方说清，本轮判了什么才可复述。
- **why·无 `scanDirs` / `domain` / `roots`**：有域就有「未给清单时的默认范围」；默认范围一旦存在，调用方迟早依赖它 ⇒ 全仓扫描以隐形形式回来。参数少一层，行为只有一种。
- **why·裸名不跨目录解析**：跨目录解析必须靠全域目录索引才成立——为认出一个裸名而重建索引，等于把刚删掉的全仓扫描请回来；写全路径后解析零索引，逐档判就是全部。
- **why·行宽 300 是常量**：参数化的前提是「不同项目确需不同判据」；实测没人改过，而可配即会漂；改判据 = 改代码、走评审。
- **why·`advisor` 退场**：`docRoot` 已声明文档在哪——同一事实两处声明（D2），读到的指针与实际索引 / 批次档用的不是一套；map 从 `docRoot` 探测派生即够，standards 无可信约定名 ⇒ 显式降级句胜过硬编一个多数项目没有的档名（只为「看起来有」）。
- **why·五键**：manifest 是这个项目的状态声明（阶段 / 文档层 / 代码段 / 索引）；产品内部布局、工具参数、第二套文档指针都不是用户掌握的事实——写进去只能误导。

**先例**：① 实现坐标 = `thincoder-core/agent-tools/manifest.mjs`（点改写面 + `projectView` 目标解析——工具形直接复用）∥ ② 档内节 = §2.10（键目录全备 + 描述单源）∥ ③ 迁移语义 = 本档 AC-6（旧档残留已删键不炸 + 写盘收敛）。

对齐：三键退场沿用 AC-6 的「未知键非拒 + 回填收敛」形；偏离：`doc_check` 参数面由声明面收为代码常量——无同类先例（现行实现 = `checkConfig` 读取），理由 = 用户 10:27 令 + 需求 F3 / F10。先例批坐标住批次档 §2，本档不引（状态档不引一次性载体）。

**勘察行（查过的公共源 ∥ 结论）**：① `thincoder-core/doc-check/index.mjs` / `anchors.mjs` / `width.mjs` 实读 ⇒ 现行参数源 = manifest `checkConfig`（`index.mjs:41-63` / `:177-180`），无内置常量先例。

② `thincoder-core/tool-docs/doc_check.md` 实读 ⇒ 现载「参数来自 checkConfig」，与目标态相反（列入受影响文件）。③ 需求单源 `docs/core/requirements/DOC-CHECK.md` 实读 ⇒ F2 / F3 / F10 + AC-8 已定（不给 `docs` ⇒ 报错、零遍历）。
④ 本档 §2.10 先例形（描述档承载键目录）在位。⑤ 工作目录外公共源（`D:\ref\` 参考系）= **未勘察**（按声明读；本批未查）。


**评审注入面由 `docRoot` 派生（`advisor` 退场）**

- Document Map（`thincoder-core/advisor/project-context.mjs:137-166`）：删声明支（`:141-144`）；派生梯二级——① 各声明根下的 `README.md`（按 `docRoot.design` → `requirements` → `specs` → `modules` → `batches` 的声明序）② 全部声明根的**公共祖先**下的 `README.md`（本仓 ⇒ `docs/README.md`，与旧内置探测同落点）。
  两级皆无 ⇒ `NO_DOC_MAP_NOTICE` 显式降级句（不静默跳过）。取「探测」不取「索引生成」的理由：map 是**人工维护的分节登记**，生成物会变成第二份索引且改变评审读到的东西；探测只换来源，读到的仍是同一类档。
- Project Standards（同档 `:175-197`）：**撤掉注入面**——声明面随 `advisor.standardsDoc` 消失，且无任何可派生的约定名（旧 `docs/core/requirements/METHODOLOGY.md` 探测正是因「多数项目没有」被删）；保留 `## Project Standards` 段与 `NO_STANDARDS_NOTICE` 显式降级句（评审知道该项目未声明标准——可见，不是静默）。
- `thincoder-core/declaration.mjs`：投影面停止读 `m?.advisor?.docMap` / `m?.advisor?.standardsDoc`（`:83-84` · `:98`）；`declared` 判定去掉这两项（`:87`）；退役档告警句里的 `advisor.{docMap,standardsDoc}` 指称随正（`:320`）。**不留空分支 / 不留 `?? ""` 兜底**。

**受影响文件（实施轮落笔 · 现值 = 2026-10-22 设计轮实测行数（`\n` 计数）· 增量 = 实施轮实测 Δ（括号 = 设计轮预算；超预算写明理由））**

| # | 文件 | 面 | 动作 / 编辑点 | 现值（实测行） | 增量（实测 Δ／预算） |
|---|---|---|---|---|---|
| 1 | `thincoder-core/manifest-schema.mjs` | 产品 | 删三键默认值（`:53-64`）· `nestedKeys` 删两行（`:74-79`）· `advisor` 校验支（`:147-149`）· 头注与 `fillDefaults` 注释随正 | 181 | 实测 −28（预算 ≤−18，**超帽 10**：`anchorRootError` 随 `checkConfig.anchors.roots` 退场——唯一消费面即本批删掉的两处；结构不变） |
| 2 | `thincoder-core/doc-check/index.mjs` | 产品 | 新 `DOC_CHECK_BUILTINS` · 删 `configError` / `gateParamError` / `readManifest` 调用 · 报面三行 + 头注 | 240 | 实测 −68（预算 ≤−70，帽内） |
| 3 | `thincoder-core/doc-check/anchors.mjs` | 产品 | `:10-13` / `:71` / `:83-84` / `:100` / `:106-110` / `:122-132` 注释与解析序收两级（域根 / 声明根两支退场） | 171 | 实测 −65（预算 ≤−40，**超帽 25**：域名索引 / ③b 回退 / 声明根归类三块整体退场） |
| 4 | `thincoder-core/doc-check/width.mjs` | 产品 | `:8` / `:51-55` / `:97` / `:102-106` 参数来源与 `scanDomain` 退场（判定 = 传入集） | 132 | 实测 −45（预算 ≤−20，**超帽 25**：`discoverDomains` / `scanDomain` / `walkMd` 三件退场——判定 = 传入集） |
| 5 | `thincoder-core/advisor/project-context.mjs` | 产品 | docMap 派生梯（`:137-166`）· standards 注入面撤除（`:175-197`）· 头注 | 197 | 实测 +25（预算 ±12，**超帽 13**：派生梯三新单元——声明根枚举 / 公共祖先 / 纯函数 `findDocumentMap`（AC-48 三态落点）） |
| 6 | `thincoder-core/declaration.mjs` | 产品 | 投影面（`:83-84` / `:98`）· `declared`（`:87`）· 告警句（`:320`） | 378 | 实测 −7（预算 ±6，**超帽 1**：投影面去两项读取 + 退役告警句随正）· **≥300 软线判定**：净 −7 且本批不新增职责 ⇒ 本批不拆；拆分候选另批（上抛主 agent 登记） |
| 7 | `thincoder-core/agent-tools/manifest.mjs` | 产品 | 头注 `:15-16` / `:54` · 描述 schema `:126` · 拒文案 `:172` | 200 | ≤ ±8（结构不变） |
| 8 | `thincoder-core/tool-docs/manifest.md` | 产品（描述档） | 键目录删三键条目（**20 → 12 节点**——算式：整键 3 + `docRoot.*` 5 + `index.*` 4 = 12）· 首行键面句 · 写面句（四族 → 两族） | 28（4,608 字符） | ≤ ±6 行（≤5,000 字符帽不触） |
| 9 | `thincoder-core/tool-docs/doc_check.md` | 产品（描述档） | 「参数来自 checkConfig」整段改内置常量 · ERROR 语义句 | 58 | ≤ ±10（结构不变） |
| 10 | `scripts/doc-check.mjs` | 工程工具面 | 参数源改读 `DOC_CHECK_BUILTINS`（机械接线）· 删 manifest 读取 | 91 | ≤ ±20 |
| 11 | `scripts/doc-check-anchors.mjs` | 工程工具面 | 解析序收两级（域根 / 声明根支退场） | 356 | 实测 −60（预算 ≤−60，帽内）· **≥300 软线判定**：落 296（<300）——本批已把该档带下软线，拆分候选随之不成立 |
| 12 | `scripts/doc-check-width.mjs` | 工程工具面 | 参数源改读 `DOC_CHECK_BUILTINS`（机械接线） | 6 | ≤ +2 |
| 13 | `scripts/doc-check-linecounts.mjs` · `scripts/doc-check-targets.mjs` | 工程工具面 | linecounts：头注一句随正（不读参数面）· targets：**删死码三处**（`collectSourceDomain` / `walkMd` / `LEDGER_NAMES`）——原「零改」不成立：该档是 `scanDirs` 最后一位消费者，AC-50① 要求零消费 ⇒ 必须删（128 → 97） | 140 · 128 | 实测 0（头注一句换写）· −31（原写 0） |
| 14 | `thincoder-core/test/doc-check-scope.test.mjs` | 测试 | 夹具去 `checkConfig`（`:22`）· 补 AC-50② 读盘计数用例 | 83 | 实测 +25（预算 ±20，**超帽 5**：用例 4 → 9——补 AC-50② 四形态 ∥ `gate` 空清单「0 档受检」∥ 工具面 `report` 报错） |
| 15 | 单元测试档（新增）`thincoder-core/test/manifest-five-keys.test.mjs` | 测试 | AC-45 / AC-46 | 0 | 新增 |
| 16 | 单元测试档（新增）`thincoder-core/test/doc-check-builtins.test.mjs` | 测试 | AC-47 / AC-50 | 0 | 新增 |
| 17 | 单元测试档（新增）`thincoder-core/test/advisor-project-context.test.mjs` | 测试 | AC-48 / AC-49 | 0 | 新增 |
| 18 | `PROJECT-MANIFEST.json` | 数据 | 删三键（`:25-50` · `:63-66`） | 67 | ≤ −30 |
| 19 | `docs/core/design/ENGINEERING-MODE-V2.md` | 文档（设计档） | 键面图与 M1 行（`:64`）/ M8 行（`:71`）随正（M1 键枚举 → 五键；M8「声明面（manifest `checkConfig`）」→「参数内置常量」）：§1.3 N3（`:34`）「声明面（manifest `docRoot` + `checkConfig`）承载」→「声明面（manifest `docRoot`）承载」· §2.2 M9 行（`:72`）「运行期加载面——M9 落点读 manifest `promptsLanding`」→「运行期加载——落点 = 产品源码内固定路径，不读 manifest」· §2.1 依赖图（`:104-109`）· §2.3 E1 三账句（`:121`）+ 字段 schema（`:126-147`）+ 键注释（`:150-151`）+ 校验句（`:153`）· §2.3 E2 声明面（`:219-220`）· §2.3 E4 机检段（`:282`）· §2.4 接口表（`:438` / `:447`）· §2.6 KD2（`:474`）· §3.1 AC3（`:495`）/ AC6（`:498`）· §3.2 T3（`:514`） | 524 | ≤ ±15 |
| 20 | `docs/core/design/DOC-DISCIPLINE.md` | 文档（单源档——判据口径） | §3.20 参数面已随正（`:987-989` / `:2203`）；余项 = AC-M8-6 常量名同字（本设计轮已落）+ §7 其余行核 | 2180 | 实测 −82（原记 2262；#79 语义收口 + 指针补全） |
| 21 | `docs/core/design/PORTABILITY.md` | 文档（单源档——声明语义） | §3.1 三族 → 两族（键族枚举与消费面句） | 299 | ≤ ±4 |
| 22 | `docs/core/design/MANIFEST.md`（本档） | 文档（设计档） | 本设计轮已落：§2.11 + §3.1 AC-43 / §3.2 随正 · **验收⑤ 口径注**：现态「八键」零命中只判**现态表述**；AC-46 / T80 的「旧八键档」= 旧档夹具描述，不计（需求 §13.20 验收⑤ `:924`） | 981（2026-10-22 实测） | 实施轮零改 |
| 23 | `thincoder-core/prompts/persona-engineering.md` | 产品（英文运行时面提示词） | **零改**——三键名实读（2026-10-22）：`promptsLanding` · `checkConfig` 各 0 命中；`advisor` 12 处全为角色名 ∥ 评审流程词（无 `advisor.docMap` / `advisor.standardsDoc` 形态）⇒ 无键面残留 | 248 | 0 |

**关键决策**

| # | 决策 | 理由 |
|---|---|---|
| KD-M1-46 | 默认键集 = 五键；三键整键退场，无替代键 | 用户令；`DEFAULT_MANIFEST` 是 `init` 的写源 ⇒ 用户项目出生即干净 |
| KD-M1-47 | doc-check 参数 = 代码常量 `DOC_CHECK_BUILTINS`；`configError` 与缺键拒跑删除 | 判据不漂的前提是参数源不漂；常量冻结 ⇒ 无常量校验面 |
| KD-M1-48 | docMap 由 `docRoot` 探测派生（两级）；standards 注入面撤除 | 用户原话「docRoot 不都指定过了吗」；standards 无可派生约定名 ⇒ 宁可显式降级，不造新约定 |
| KD-M1-49 | 迁移 = 未知键非拒 + 写盘自清；零迁移脚本、零兼容分支 | 「接受但忽略」正是「留着误导」本体 |
| KD-M1-50 | 判定范围 = 解析范围 = 传入清单（解析序两级）；`widthExemptZones` / `exemptions` 取值内置且恒空 | 无域 / 根 / 排除 ⇒ 无默认范围，全仓扫描无落脚点；豁免谓词住代码，空列表不构成登记面（需求边界「不引入豁免清单」） |

**验收对照**（**并列附表**——不并入 §3.1；§3.1 表尾设索引行指向本表；回指规格 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.20 `:891` FR42 **需求 1–7**（`:908-916`）· **验收 ①–⑧**（`:920-927`）· `docs/core/requirements/DOC-CHECK.md` F3 / F8 / F10）

| # | 验收条 | 回指 | 核法 | 测试档 |
|---|---|---|---|---|
| AC-45 | `DEFAULT_MANIFEST` 恰五键（`version` / `phase` / `docRoot` / `codePaths` / `index`）；`MANIFEST_SCHEMA.keys` 同集；`nestedKeys` 恰两族 | FR42 需求 1 · 需求 4 · 验收 ①–② | 机判键集（`Object.keys`）+ `nestedKeys` 键名 | `test/manifest-five-keys.test.mjs` |
| AC-46 | 旧档三键残留 ⇒ `validateManifest` `ok:true` + `unknownKeys` 含三名；`write` 一轮后档内三名消失 | FR42 需求 6 | 夹具：旧八键档 → 读 → 写一已知键 → 回读档文 | 同 AC-45 |
| AC-47 | `doc_check` 在**无** `checkConfig` 的 manifest 上跑 gate：出 `PASS` / `REFUSED`，不出「缺参数」ERROR；doc_check **不读 manifest**（源码面 `readManifest` 零命中） | FR42 需求 5 · 验收 ④ / `docs/core/requirements/DOC-CHECK.md` F3 | 夹具仓 + 源码面 | `test/doc-check-builtins.test.mjs` · `test/doc-check-scope.test.mjs` |
| AC-48 | 无 `advisor` 键时 Document Map 产出于 `docRoot` 派生梯：① 声明根 README ② 公共祖先 README ③ 降级句；**零静默**（三态各一断言） | FR42 需求 3 · 验收 ⑦ | 纯函数注入夹具三态 + 本仓实跑（落到 `docs/README.md`） | `test/advisor-project-context.test.mjs` |
| AC-49 | `advisor.docMap` / `advisor.standardsDoc` 读取分支零残留 | FR42 需求 3 | 源码面：`project-context.mjs` / `declaration.mjs` 两档 `advisor` 零命中（注释除外） | 同 AC-48 |
| AC-50 | **点查面三条**：① 代码内 `scanDirs` 零消费（源码面 grep，含 `anchors.domain` / `anchors.roots` 零存在）；② **两面分明**——**`report` 面**：不给 `docs` ∥ `[]` ∥ 非数组 ∥ 非字符串条目 ⇒ **一律报错**（零遍历、零全域兜底）；**`gate` 面**：空清单 ⇒ 首行 `DOC-CHECK GATE: PASS（0 档）` 且输出行**必带「0 档受检」**字样（不许只给空范围——防「跳过」被读成「已检」）；③ 传两档 ⇒ 只读这两档 + 其引用目标（`readFileSync` 命中集断言） | FR42 需求 2 · 验收 ③ / `docs/core/requirements/DOC-CHECK.md` F10 · AC-8 | 夹具 + 源码面 + 读盘计数入批档 §2 | `test/doc-check-builtins.test.mjs` · `test/doc-check-scope.test.mjs` |

**未入本表的需求项（回指补全）**：需求 7（连带计数与文档）⇒ 受影响文件表行 8 / 9 / 19 / 22 逐行；验收 ⑤（本档「八键」**现态表述**零命中 ∥「五键」在位）⇒ 行 22；验收 ⑥（两工具描述不含三键参数说明）⇒ 行 8 / 9；验收 ⑧（本仓 696 条裸名指针，债务 `#1731`）⇒ 边界「本仓债」句（本批只保证不新增）；验收 ①–④ ∥ 需求 1–6 见上表各条回指。

**用例（§3.2 续号）**

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T79 | 正常：五键初始化 | `initManifest(writer:'main')` | 落盘恰五键，`advisor` / `checkConfig` / `promptsLanding` 零命中 |
| T80 | 边界：旧八键档读入 | 旧档（三键 + 余键合法） | `ok:true` · `unknownKeys` 恰三 · 返回 manifest 无三键 |
| T81 | 正常：`doc_check` gate 无 checkConfig | 五键 manifest 夹具 + 一档 | 首行 `DOC-CHECK GATE: PASS`（或 REFUSED 带命中）；无「取参失败」行 |
| T82 | 错误：清单含不在盘的档 | `docs: ["<不存在>.md"]` | 明确报错点名该档（不静默跳过、不降级为全域）；其余档读盘计数 = 0 |
| T83 | 正常 / 边界：评审注入 | ① 声明根含 README ② 仅公共祖先含 README ③ 皆无 | ① 注入该档 ② 注入祖先 README ③ `NO_DOC_MAP_NOTICE`；standards 段恒为降级句（显式） |

**边界（不做）**：不改 doc-check 两条判据与解析序 ①–④ · 不改 `docRoot` / `index` / `codePaths` 消费面 · 不改评审两条判据的判法 · 不加迁移脚本 · 不引入任何替代指针键或参数键 · `write` 之外不主动改写用户档（残留三键只在用户自己写盘时清除）。

**本仓债（不在本批修）**：新解析序（仓根相对全路径 ∥ 引用档同目录）落地后，本仓 696 条**裸名指针**（指向 `thincoder-core/prompts/**` 等实现坐标）会变 `档缺`——按 D4 它们本来就该写全路径；批量改名 = 另批机械改名（台账 `#1731`）。本批收口只跑本轮触达的文档；触达档内的裸名指针就地改全路径。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | `phase` 取值非法 → 校验拒 | AC-M1-1 | ✅ 构造非法枚举 → `validateManifest` 返回 `ok:false` |
| AC-2 | 整档缺失 → **不拒会话**（不静默 fallback）：按用点报明 + 走建档流（梯②⑤ 就地建档） | AC-M1-2 | ✅ 删 manifest → `readManifest` 返回 `reason:'missing'` + 会话可起（AC-22）+ 建档（AC-27） |
| AC-3 | `docRoot` 缺键 → 用默认值（不拒） | AC-M1-3 | ✅ 删某键（含 `docRoot` 子键）→ `readManifest` 补默认值 + `missingKeys` 含该键路径 |
| AC-5 | 非主 agent 写 manifest → 拒 | AC-M1-5 | ✅ `writeManifest(..., {writer:'subagent'})`（或缺省）→ 拒；`initManifest(..., {writer:'subagent'})`（或缺省）→ 拒（同一闸） |
| AC-6 | **去键兼容**（已删键——旧档残留键不炸；现含 `access` · `activeBatch` 两键） | AC-M1-3（缺键 fallback 同族） | ✅ 档含 `"access":"from-zero"` + `"activeBatch":"<批次档相对路径>"` 其余合法 → `readManifest` `ok:true`、`errors` 空、返回 manifest **无两键**（`fillDefaults` 只搬已知键）；`writeManifest` 回写自然收敛 |
| AC-7 | **单串零变**：`docRoot` 各键单串语义与解析结果同改造前（既有档零改即绿） | 需求 F7 | ✅ 既有两单元测试档**零改全绿** + 新档单串用例（`resolveReviewTargetPaths` 含该根） |
| AC-8 | **数组展开**：数组值 → 逐元素展开为多根，基数 = 项目根，顺序 = 声明序 | F7 | ✅ 声明 `["docs/a","docs/b"]` → 返回集合含 `<项目根>/docs/a` · `<项目根>/docs/b` |
| AC-9 | **去重**：键内重复 / 跨键同值 → 集合中恰一次（保序） | F7 | ✅ 同值重复声明 → 结果长度 = 唯一值数 |
| AC-10 | **补默认且不合并**：缺子键 → 补默认**单串**；给数组 → 原样保留（默认不追加） | AC-M1-3 / F7 | ✅ `readManifest` 后：缺键 = 默认串；给数组 = 该数组原值（不含默认路径） |
| AC-11 | **非法形态拒**：空串 / 空白串 / 空数组 / 数组含非串 / 空串 / 空白串（`trim` 后为空）元素 / 非串非数组（数 / 对象） → 校验拒（`null` 不属非法面——见 AC-39） | F7 / KD-M1-7 | ✅ `validateManifest` `ok:false` + `errors` 含 `docRoot.<键>`；`readManifest` `reason:'invalid'`；`writeManifest` 拒落盘 |
| AC-12 | **消费面兼容（M3 第二基底）**：数组 `docRoot.batches` → 逐基底按序复判 | F7 / §2.7 消费面 #3 | ✅ 第二基底 = 数组第 2 项命中 → 返回该路径；**显式**基底全部不可读 → `throw`（fail-closed 不变）；**对照**：键 `null` ⇒ 回退默认基底（§2.7「本面无」读数 / T62b——两情形分清） |
| AC-13 | **端到端（本仓）**：本仓数据档声明后，部分层设计档入评审根 | 下游指针 | ✅ `resolveReviewTargetPaths({ cwd: <本仓根> })` 含 `docs/cli/design` · `docs/vsc/design` · `docs/cli/requirements` · `docs/vsc/requirements`（部分层设计档可点火） |

**注入面（回指 v2 §9.1；规格 AC 待补见 §2.6）**：

| # | 验收标准 | 可机判 |
|---|---|---|
| AC-N1 | 行形逐字：`manifestStateLine` 三态（`initial-dev` · `production` · 未知值）输出与 §2.6 逐字行形一致 | ✅ 纯函数断言（两 `phase` 值各带 `rigor: light` / `strict`；未知值 → 无标签、只出值） |
| AC-N2 | 幂等：同值重调 `pushManifestStateReminder` → `false`，且 history 长度不变 | ✅ 同 agent 连调两次 |
| AC-N3 | 单活体：值变后 history 中该前缀行恰 1 条（旧文零命中） | ✅ `initial-dev` 推 → 切 `production` 再推 → 过滤计数 = 1 |
| AC-N3b | 单活体（会话重建）：`history` 带旧行而 `_manifestLine` 缺失（跨会话——状态位不随历史回来）→ 值变后该前缀行仍恰 1 条（认领步） | ✅ 预置旧行（`transient` 机器行）+ 改 `agent.manifest.phase` → 推 → 该前缀行过滤计数 = 1 |
| AC-N4 | 压缩自愈：行被移除（模拟压缩吞咽）后下一回合重推 | ✅ 摘行 → 再调 → 返回 `true` + 行回来 |
| AC-N5 | 门控：`depth !== 0` / 非工程模式 / 无锚（`agent.cwd` 缺失）→ `false` 且零注入 | ✅ 三态各一断言（history 长度不变） |
| AC-N6 | 面纪律：注入行 `transient === true`；人读线零新增 | ✅ 行字段断言 + `_fullHistory` 长度不变 |
| AC-N7 | **值变重推（盘面驱动——#34）**：工程模式 + depth-0 + 有锚会话内，盘上 `phase` 变（mtime 推进）⇒ **下一回合情境行 = 新值**（旧行被摘、该前缀恰 1 条） | ✅ 临时项目根夹具（真实数据档 + `utimesSync` 推进 mtime）→ 推 → 断言新行 + 单活体（**先红**：实现前该用例必红） |
| AC-N7b | **未变零重读（值采纳轴——状态判定轴每回合实读，见 §2.6 ③'）**：mtime 未变 ⇒ 不重读（沿用内存值——内容变而 mtime 未推进 ⇒ 行不变） | ✅ 首推后「改内容 + mtime 复位」→ 再推 → `false` + 行不变 |
| AC-N7c | **失败退化（保守）**：stat 失败（档删）/ 读回非法 ⇒ 不抛、不更新、不清零（沿用上次已知值）；档改回合法后重推可采纳（自愈）；**口径 = 运行期注入面降级，与会话起点动作两分**（§2.5；`readManifest` 返回语义零改） | ✅ 删档 → 再推（不抛 + 行不变）；写非法 JSON（mtime 推进）→ 再推；改回合法（mtime 再推进）→ 再推（采纳） |
| AC-N7d | **首次观测对齐**：缓存未设（首回合 / 会话恢复后）⇒ 读一次并对齐盘面值 | ✅ 内存档 `initial-dev` + 盘上 `production` → 首推 → 行 = `production` |

**装配钩子模式门 / 二道防线**：

| # | 验收标准 | 回指 | 可机判 |
|---|---|---|---|
| AC-14 | **普通会话（装配钩子面）零 manifest I/O**：会话权威值 `engineering !== true` + **四格矩阵**（仓内 / 非仓 × 有档 / 无档）→ ① 仓内 + 有档：不附着 ② 仓内 + 无档：**不建档** ③ 非仓 + 无档：不抛 ④ 非仓 + 有档：不抛、档未被改 | AC-M1-2 | ✅ `attachManifest` 直调（四格逐格：`agent.manifest === null` + 档存在性断言）+ CLI 子进程（非仓 cwd + normal → 退出码 0、stderr 无「工程模式启动拒绝」） |
| AC-15 | **工程模式入口四态**：① 档合法 → 附着 ② 项目缺档（梯②⑤）→ `initManifest(writer:'main')` 建档（内容 = `DEFAULT_MANIFEST`；梯⑤ 落点 = 会话锚）③ 工作区（下辖 ≥1 项目）→ **不建档 / 不猜** + 报明（`_projectView.state = 'workspace'`）④ 档非法 → **不拒**（不抛）+ 报明（`state = 'invalid'`）——**启动零拒绝**（KD-M1-25 / M1-29） | AC-M1-2（发现 / 缺档口径——§⑥）· §⑥（不砖死） | ✅ 四态各一用例（②断言档生成与落点；③④断言不抛 + 零建档 + `_projectView` 状态） |
| AC-16 | **判据值 = 会话权威值（两向）**：① 装配期**槽真 config 假**（`slotData.engineering === true` + config false）→ 按槽判（仓内合法档 → 附着；缺档 / 非仓 → 按 AC-15 ②③ 处置）② 装配期**槽假 config 真**（`engineering: false` + config `true`）→ 非仓 cwd 不抛 + 仓内无档不建档③ 重估点（`applySession` 之后）值与装配期同 ⇒ 幂等 | KD-M1-12 / M1-13 / M1-15 | ✅ 行为面：`attachManifest` 直调（②两 cwd 夹具）+ 重估幂等（重调后 `agent.manifest` 不变）；接线面：`bin/thincoder.mjs` 源码锁——`resumeSlot` 在 `assembleAgent` 之前且记录入 `slotData`、重估点在 `applySession` 之后（`acp-channel.test.mjs:275` 同法） |
| AC-17 | **翻转清陈旧**：工程模式（已附着）→ 置普通 → 重调后 `agent.manifest === null` | KD-M1-12 | ✅ 用例：先工程 → 置 false → 重调 |
| AC-18 | **二道防线落地**：工程 spawn `files` 含 `PROJECT-MANIFEST.json`（任意层 / 任意大小写）→ 拒，**文案含稳定片段 `/Manifest file/`**（句首锚——沿用既有锚法 `spawn-gates.test.mjs:92-98`）；`changelog.md` 既有拒行为与文案**逐字不变** | **AC-M1-8**（主门回指 AC-M1-5） | ✅ `rejectEngineeringFilePaths` 变体逐例断言（按 `/Manifest file/`）+ `normalizeFileList` 通道 + 既有 CHANGELOG 用例零改全绿 |
| AC-19 | **入口 / 翻转两面共用决策树**：CLI `attachManifest` · VSC `hydrateRun` 钩子块与翻转面共用 `resolveEngineeringManifest`（判据单源）；**翻转面**四出口 = 附着 / 建档放行（梯②⑤）/ 工作区放行（`workspace`）/ 档非法拒（文案锚 `/项目不可解析/`）；**入口面**非 ok 态不抛（KD-M1-25） | KD-M1-20 / M1-25 | ✅ 两面同调同一函数（源码面）+ 翻转四格逐格（T37–T40 / T53）；入口面（T49 / T50 / T52） |
| AC-20 | **拒翻四态 + 先判后翻零副作用**：① 档合法 → 放行 + 附着（`agent.manifest` 非 null；= `agent.manifest ← 结果`） ② 缺档 + 梯②⑤ → 放行 + 就地建档（经 **`writer:'main'`**——漏传即 `init-failed` 拒翻，见 T38 反证格）+ 附着 ③ 缺档 + 工作区（下辖 ≥1 项目）→ **放行**（`agent.manifest` = null、模式 ON、`_advisorRuns` 重置照旧） ④ 档非法 → **唯一拒翻格**（模式仍 OFF、`agent.manifest` 仍 null、`_pendingReminders` 零新增、`_advisorRuns` 未被重置） | KD-M1-21 / M1-29 · §2.8 F2 | ✅ 核心 `eng` 工具直调（四态各一例：断言 `config.agent.engineering` 与 `_pendingReminders.length` 与返回文案）；CLI `/eng` 子进程/直调同四态 + 标签行零发；/session 与 ACP 两路先判（拒时 `applySession` 零调用）+ 梯⑤ 建档放行格（T53） |
| AC-21 | **双发现函数各态结构化**：`discoverRepos`（仓梯）四态（`self` / `unique` / `none` / `workspace`——`workspace` = ≥2）；`discoverProjects`（项目梯）**三态**（`self` / `none` / `workspace`——`workspace` = 梯③④ 命中 ≥1，无 `unique`）；`candidates` **全列且按名排序**（`self` / `none` ⇒ `[]`，`workspace` ⇒ 非空）；`resolveProjectRoot` = 项目梯 `.root`——**变更面与回归见 AC-24** | AC-M1-2（发现口径） | ✅ 真判据夹具：逐态断 `kind` / `root` / `candidates` / `matched`（T41–T45） |
| AC-22 | **启动零拒绝（不砖死 · 两端）**：工程模式 × 六格 cwd（梯① 锚带档（无 `.git`）· 梯② 锚 = 裸仓 · 梯③ 下辖带档项目 1 · 梯④ 下辖裸仓 1 · 梯⑤ 无项目 · 工作区 ≥2——梯③④两格 ⇒ `_projectView.state = workspace`）⇒ `attachManifest` **不抛**；`agent.manifest` = 附着或 null；`agent._projectView.state` 归位；CLI 直调与 VSC 钩子块同夹具同结果 | 规格 ②.3 / §⑥（不砖死） | ✅ 每格一断言（不抛 + `_projectView` 状态 + 档存在性）；CLI 子进程「工程模式 + 非仓 cwd」退出码 0（T51 / T52） |
| AC-23 | **发现梯两表**：`discoverProjects` 五级 + `discoverRepos` 四级逐格归位；候选**按名排序**；`matched` ∈ `manifest` / `git` / `null` 与梯级一致；工作区 = 该级全列且**不越级**（带档非空 ⇒ 裸仓不入候选）；**递归零**（孙目录候选不可见）· **单源结构**：两梯共调私有内核 `scanChildren`（源码面——`readdirSync` 恰 1 处 ∧ 两函数各含内核调用） | 规格 ②.2 / §⑥（发现规则）· KD-M1-22 | ✅ tmp 夹具逐格断 `kind` / `root` / `candidates` / `matched`（T43 / T44）+ 源码面结构断言（T54） |
| AC-24 | **`resolveProjectRoot` 变更面 + 覆盖位**：带档路径逐字（自仓）；**非 git 锚带档 ⇒ 锚**；**路径自身所在目录带档 ⇒ 该目录**；**项目内不带档子目录 ⇒ 最近带档祖先（其项目根）**；**祖链无档 ⇒ `null`**；**不向下取根**——下辖带档子目录 ≥1 ⇒ `null`（`workspace`）∥ 下辖裸仓 ≥1 ⇒ `null`；`none` / `workspace` ⇒ `null`；**覆盖位（`_setProjectRootForTest`）在场 ⇒ 覆盖值**（`owningProject` 头部短路——§2.2 覆盖位定形）；**上溯界** = 目标所在盘根（向上无界——§2.2 `projectRootView` 契约行；「以会话锚为界」是台账面另一界） | 规格 ②.2 / §⑥（git 非前提） | ✅ 同夹具对（T45）；覆盖位断言 + 覆盖位短路回归守卫 = 单元测试档基座用例 |
| AC-25 | **情境行状态选行**：`ok` ⇒ 相位行**逐字零改**（AC-N1 既有断言零改）；`no-project` / `workspace` ⇒ 报明行逐字（**工作区事实行按 `matched` 两变体**——带档级 / 裸仓级）；`missing` / `invalid`：有既往好值 ⇒ 行不变（T35 / T36 零改）、无既往好值 ⇒ 报明行；四态共用单活体 / 幂等 / 自愈 / `transient` 机制 | 规格 ②.3 / §⑥（不砖死） | ✅ 纯函数逐字断言（含两变体）+ 推注入（T46 / T47） |
| AC-26 | **会话不绑定项目（多项目按用点）**：同 cwd 下两项目（各声明不同 `docRoot`）——对 B 的路径读档取 B 的声明；相位行 = 锚项目状态；机制**零「当前项目」单值状态位** | 规格 §⑥（解析模型） | ✅ `readManifest(B 路径)` / `docRootPaths(v, B 路径)` 取 B 声明；锚项目行不受 B 影响（T48） |
| AC-27 | **建档规则（轻动作 + 零自动 git）**：梯②⑤ 缺档 ⇒ 建档（内容 = `DEFAULT_MANIFEST`；落点 = 会话锚（梯② 裸仓锚 ∥ 梯⑤ 空目录）；多项目各建各的）；工作区 / 档非法 ⇒ **零建档**；机制**零 `git init`**（源码面：三档无 `git init` 调用面 + 夹具断 `.git` 未被机制创建） | 规格 ②.3 / §⑥（建档规则） | ✅ 逐格断档内容 + 落点 + 未建格；源码面结构断言（T49 / T50） |
| AC-28 | **两端同形（端差消）**：同夹具下 CLI 钩子与 VSC 钩子块的 `agent.manifest` / `agent._projectView` 结果一致；情境行为两端口同源 re-export（核单点） | 规格 §⑥（两端同形） | ✅ 双夹具对跑（T52）；VSC 侧报明格与核侧行文逐字相等 |
| AC-29 | **写门 / schema / 二道防线零碰**（回归）：既有三键集合 · `REVIEW_ROOT_KEYS` · `docRoot` 值形态 · `writeManifest` writer 闸 · spawn `files` 域拒 manifest——零改 | 规格 ②.1 / ②.5 / AC-M1-8 | ✅ 既有用例组零改全绿（`manifest.test.mjs` / `spawn-gates.test.mjs` 等） |
| AC-31 | **两族键 schema 落地**：`DEFAULT_MANIFEST` 含两族默认（`codePaths:["src"]` · `index:{codeExtensions:[],docExtensions:[]}`）；缺 `codePaths` / `index` 的档读入 ⇒ `ok:true` + 两族补默认 + `missingKeys` 含两族键 | **AC-M1-9** · KD-M1-31 | ✅ `readManifest` 夹具（缺族键档）逐键断言 + `initManifest` 落盘含两族键 |
| AC-32 | **形态判据（fail-closed）**：`codePaths` 非数组 / 含非串或空白串元素、`index.*` 形态错 ⇒ `validateManifest` `ok:false`（`errors` 点名键）；对照合法：`codePaths:[]` | **AC-M1-9** · KD-M1-32 | ✅ 逐例断言 `{ok, errors}` |
| AC-33 | **读向单向 + 投影**：`declaration.mjs`（经其转口可达）经 `readManifest` / `manifestFilePath` 取两族（源码面：该档无 `readFileSync` 读 manifest + 本模块零 `conventions` 出边） | **AC-M1-9** · KD-M1-33 | ✅ 源码面结构断言（禁第二读取器） |
| AC-34 | **旧档在场 = 一行告警 + 内容零生效**：`.thincoder/conventions.json` 在场（含哨兵声明 / 坏 JSON 两态）⇒ 声明读数与无档逐条等值 + warn + 日志事件；内容零解析 | **AC-M1-9** · KD-M1-34 | ✅ 两态夹具断言（读数等值 + warn 在场 + 哨兵未生效）+ **告警基准断言**（旧档落项目根 = `manifestFilePath` 基准目录——cwd 深于项目根亦命中） |
| AC-37 | **`index.publicRepos` 落 schema**：`DEFAULT_MANIFEST.index` 含 `publicRepos:[]`；缺键档读入 ⇒ `ok:true` + 补默认 + `missingKeys` 含 `index.publicRepos`；形态 = 数组层 fail-closed（非数组 ⇒ `errors`）/ 元素层宽容（`["./x/","",7]` ⇒ 归一 `["x"]`——**值形层**（归一后相对串）；解析层 = 绝对根集——细则单源 = `MEMORY.md` §6.15）；缺省 `[]` ⇒ 声明读数与基线等值（零行为） | **AC-M1-9** · KD-M1-35 | ✅ `readManifest` 夹具逐键断言 + 归一读数 |
| AC-30 | **归属形（上溯 / 嵌套）**：`owningProject(target)` 自目标（目录 ⇒ 含自身；文件 ⇒ 取其所在目录）**上溯取最近带档目录**；带 ⇒ 该目录；祖链不带 ⇒ `null`（⇒ 发现兜底）；**不跨兄弟**（无档分叉不取旁支）；`projectView` 两段合成逐格归位 | 规格 §⑥（归属形） | ✅ tmp 多层夹具（非项目目录 / 根项目 / 带档子项目 / 根内不带档子目录 / 兄弟）逐格断言（T48） |
| AC-35 | **`projectRootView` 基座**：三态结构化——`ok`（**归属命中**）⇒ `root` 非空 ∥ `candidates` = `[]`；`workspace`（多根工作区：下辖带档者 ≥1 ∥ 零带档时裸仓 ≥1）⇒ `root` = `null` ∥ 下辖项目全列**按名排序**（**恒非空**）；`none`（其余——空目录 ∥ 裸仓锚）⇒ 双空；覆盖位在场 ⇒ 头部短路（`ok` + 覆盖值）；**薄委托等价**：`resolveProjectRoot(cwd)` ≡ `projectRootView(cwd).root` 逐格全等（含覆盖位） | §2.2（判定单点） | ✅ 夹具三态逐态断 `{state, root, candidates}`（含下辖 1 项目格 ⇒ `workspace`、空目录格 ⇒ `none`）+ 覆盖位断言 + 等价逐格对（回归守卫 = 单元测试档基座用例） |
| AC-36 | **工作区锚收口（报明 + 下一步 · 零猜）**：① 台账缺省（锚 = 工作区）⇒ 报明事实（下辖 N 项目）+ 点名项目根——零写（`docs/core/design/LEDGER.md` §8 AC-M2-17）；② 批档 create 无所属 ⇒ 报明 + 显式路径指引 ∥ 目标所属 ⇒ 落其基底（`docs/core/design/BATCH-RECORD.md` §4.8 BR-39–BR-42）；③ 文件工具 = **零改**（结语——无新行为面）；`ok` / `none` 两态逐一回归零变 | §2.2 ∥ §2.5（单项目解析律）· `docs/core/design/LEDGER.md` §8 · `docs/core/design/BATCH-RECORD.md` §4.15 | ✅ 同夹具（工作区锚双带档 tmp + 实景 `d:\teamcode` 双跑）；断言 = 报明含下辖项目全列 + **零「ambiguous / 歧义」字样** + 零写；文件工具零改 ⇒ 无断言（结语口径） |
| AC-38 | **未知键可见化（#802）**：`validateManifest` 产 `unknownKeys`（顶层 + 四嵌套层；非拒——`ok:true` 定性零变）；`readManifest` 返回面携 `unknownKeys` + 一行告警（含键名；同档同键集去重）；零未知键 ⇒ 零告警（负向锁） | KD-M1-36 | ✅ 单元测试档（四项：枚举 ∥ 告警逐字含键名 ∥ 去重恰一次 ∥ 负向锁） |
| AC-39 | **「本面无」合法表达（#944）**：`docRoot.<键> = null` ⇒ `validateManifest` `ok:true` + `readManifest` `ok:true`（值**保持 `null`**——不被默认补回）+ `docRootPaths(null) = []`；**删键仍补默认**（对照格——KD-M1-6 零改）；`""` / `[]` / 数组含空串等仍拒 | KD-M1-37 | ✅ `isValidDocRootValue(null) === true`；夹具：某键 `null` + 其余合法 ⇒ `ok:true` + 该键读回 `null`；对照格删键 ⇒ 补默认；负向格 `""` / `[]` ⇒ `errors` 含键名 |
| AC-40 | **agent 工具面·读写往返（全键）**：对样例项目 `read`（`ok` + manifest + `missingKeys` / `unknownKeys` / `errors` 细节面）→ 全键族逐键 `write`（`version` / `phase` / `docRoot.<键>` / `codePaths` / `index.<键>`（含 `publicRepos`）——各 ≥1 例）→ `read` 回读**已知键**值逐键相等 + 非目标**已知**键逐字零变（未知键丢 / 缺键补默认 = 回写收敛语义——KD-M1-11；T66 登记）；缺档 ⇒ `init` → 回读 `ok` + 档内容 = `DEFAULT_MANIFEST` | AC-M1-10 | ✅ 单元测试档：工具调用往返——回读值对照 `readManifest` 直读；逐键 diff + `init` 档逐键断言 |
| AC-41 | **agent 工具面·fail-closed 与报明**：① 非法值写（`phase:"bogus"` / `docRoot.specs:""`）⇒ 拒（`refused` 锚）+ 档**逐字节未变**（sha256）② 白名单外 key（`phas` / `docRoot.xxx` / 两族整键写——`docRoot` / `index` 传整个对象）⇒ 拒 + 零变 ③ `write` 缺档 ⇒ 拒 + 引导 `init`（零建档）④ `init` 已带档 ⇒ 拒 + 零覆盖（sha256）⑤ 缺档 `read` ⇒ `state=missing` 报明（不抛）；`workspace` ⇒ 报明 + 下辖项目全列（零写——去「ambiguous」措辞） | AC-M1-11 | ✅ 逐格夹具断言（sha256 前后对比 + 拒文案锚 + read 五态返回面） |
| AC-42 | **agent 工具面·权限面**：① 子代理装配**只挂只读变体**——`assembleFamilyTools({depth:1, role})` 五格（eng-coder / eng-designer / coder / consult / 兜底）各含恰一 `manifest`，其 `action` 枚举 = `["read"]` 且无 `key` / `value`（写动作 schema 级不可达——§2.10.1）；`depth:0` 两模式（`engineering` 两值）皆含恰一全量变体（三动作）② 写门——工具落盘恒经 `writeManifest` / `initManifest`（源码面：`writer: "main"` 字面量；缺省 `'subagent'` 拒 = AC-5 同一闸）③ 主 agent `init` / `write` 实调 ⇒ 放行 | AC-M1-12（读面按用户令 2026-10-22 收正——§2.10.1） | ✅ 装配夹具五格 + `depth:0` 两格 + 源码面断言 + 实调放行格 + 只读变体 execute 拒绝格 |
| AC-43 | **工具形 / 分类面 / 描述面（登记）**：① 参数面 = `action ∈ {read,init,write}`（必）+ `target?` / `key?` / `value?`；**两族整键写（`docRoot` / `index` 父键传整个对象）⇒ 拒**（谓词钉死 = §2.10）；② 分类——`readonlyActionOf(tool,"manifest",{action:"read"}) === true`；`write` ⇒ false（侧效门）③ 描述单源——`manifestTool.description === thincoder-core/tool-docs/manifest.md`逐字节（DESC）④ value 解析——`"null"` ⇒ `null`（`docRoot.*` 本面无）· `'["../shared"]'` ⇒ 数组 · 裸串 ⇒ 字面串 | ②.7（目标面 ∥ 权限面）· F15（描述面——`docs/core/requirements/TOOLS.md` §4.2 `:69`） | ✅ 参数面断言 + 分类谓词断言 + 描述逐字节 + 三值解析格（T70–T73） |
| AC-44 | **判据面：`ambiguous` ⇒ `workspace`（工作区常态）**：`projectRootView` / `projectView` / 两发现梯 `kind` 的态名与语义逐处收正（§2.2）；**实景夹具 = `d:\teamcode`**（下辖带档者 2 = `thincoder` ∥ `thincoder.com`）⇒ `state="workspace"` + 下辖项目按名排序全列；**四会话级消费面行为**：情境行 = 事实行（信息行）∥ ledger = 报明 + 点名项目根 ∥ git = 报明 + 指 `workdir` ∥ batch = 报明 + 显式路径指引 ∥ 翻转面 = **放行**；**禁字样（可机判）**：上述各面输出**不得含** `ambiguous` ∧ `容器`（`node` 行扫）；`容器` 一名已作废——该形统一称「多根工作区」，禁用面 = 情境行 / 报明行 / 批档文案 / 评审拒因 | 用户裁定 · §2.5 单项目解析律 | ✅ 实景夹具（`d:\teamcode`）逐面跑：态名断言 + 全列断言 + 禁字样行扫 + 零写断言 |
| AC-45–AC-50 | **manifest 五键 / doc_check 点查 / 评审派生**：并列附表住 §2.11（回指 FR42 **需求 1–7 · 验收 ①–⑧** + `docs/core/requirements/DOC-CHECK.md` F3 / F10），本表不重述 | §2.11 | ✅ 见 §2.11 各条核法 |

> AC-14 判据口径（KD-M1-16）：「未被读」无机械可观测缝 ⇒ 退为**可观测断言**（不抛 / 不建档 / `agent.manifest === null`）；下游仍读盘的消费面不在本 AC 范围（§2.5「普通会话的读面边界」）。

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：整档存在且合法 | 五键齐全 | `readManifest` 返回 `ok:true`，manifest 完整 |
| T2 | 正常：初始化 | manifest 缺失 + `initManifest(cwd, { writer: 'main' })` | 写默认五键档，返回默认 manifest |
| T3 | 边界：缺 `docRoot` 键 | manifest 缺 `docRoot` | `ok:true` + 补默认 `docRoot` + `missingKeys` 含 `docRoot` |
| T3b | 边界：`docRoot` 子键缺 | manifest 有 `docRoot` 但缺其一子键（如 `specs`） | `ok:true` + 补该子键默认值 + `missingKeys` 含子键路径 |
| T5 | 错误：整档缺失 | 无 `PROJECT-MANIFEST.json` | `readManifest` 返回 `reason:'missing'`，不 fallback |
| T7 | 错误：非主 agent 写 | `writeManifest(..., {writer:'subagent'})` / `initManifest(..., {writer:'subagent'})` | 拒（fail-closed） |
| T8 | 正常：情境行落线 | 工程模式 + depth-0 + manifest `{phase:"initial-dev"}` | 恰一行 `[System reminder: project state: phase: initial-dev (rigor: light).]`；`transient:true` |
| T9 | 边界：幂等 | 同 agent 连调两次（值不变） | 第二次 `false`，history 长度不变 |
| T10 | 边界：值变单活体 | 先 `phase:"initial-dev"` 推，再置 `phase:"production"` 推 | 旧行被摘、恰一行新行（`history` 数组引用不变） |
| T11 | 边界：压缩吞行 | 推后从 history 移除该行 | 下一回合重推（`true`，行回来） |
| T12 | 边界：子代理深度 | `depth:1` | `false`，零注入 |
| T13 | 边界：非工程模式 / 无锚 | `engineering:false` 或 `agent.cwd` 缺失 | `false`，零注入 |
| T14 | 边界：旧档残留已删键 | 档含 `"access":"from-zero"` + `"activeBatch":"<批次档相对路径>"` 其余合法 | `readManifest` `ok:true`；返回 manifest 无两键（AC-6） |
| T15 | 正常：单串兼容 | `docRoot.design = "docs/core/design"` | 解析含该根一条；`validateManifest` `ok:true`（AC-7） |
| T16 | 正常：多根数组 | `docRoot.design = ["docs/core/design","docs/cli/design","docs/vsc/design"]` | 解析含三根（顺序 = 声明序）（AC-8） |
| T17 | 边界：去重 | 数组内重复项 / `design` 与 `modules` 同值 | 结果集合去重后恰一次（保序）（AC-9） |
| T18 | 边界：归一 | 元素带 `\` / 首尾空白 | 归一后可解析命中同一根（AC-8） |
| T19 | 边界：补默认 / 不合并 | `docRoot` 缺 `specs`；`design` 给数组 | `specs` = 默认单串；`design` = 原数组（不含默认 `docs/design`）（AC-10） |
| T20 | 错误：非法形态（含空白串元素） | `""` / `"  "` / `[]` / `["a", 42]` / `["a", " "]` / `123` / `{}` | `validateManifest` `ok:false`（`errors` 含 `docRoot.<键>`）（AC-11） |
| T21 | 错误：多基底全不可读 | `docRoot.batches = ["no1","no2"]` 且两基底均不可读 | `resolveBatchDocPath` `throw`（fail-closed 不变）（AC-12） |
| T22 | 端到端：本仓部分层入根 | 本仓 `PROJECT-MANIFEST.json`（三根数组） | `docs/cli/design/TUI.md` 过评审根分类（AC-13） |
| T23 | 正常：**普通会话 + 非仓 cwd**（#30 回归） | `engineering:false` + cwd 非仓 ∧ 无档（AC-14 格③） | 不抛；`agent.manifest === null`；`PROJECT-MANIFEST.json` 不存在 |
| T24 | 边界：普通会话 + 仓内有合法档 | `engineering:false` + 仓根含合法档（格①） | 不附着：`agent.manifest === null`；档未被改（AC-14） |
| T24b | 边界：**普通会话 + 仓内无档** | `engineering:false` + 仓根无档（格②） | **不建档**（`PROJECT-MANIFEST.json` 不存在）+ `agent.manifest === null`（AC-14） |
| T24c | 边界：普通会话 + 非仓 cwd 有档 | `engineering:false` + cwd 非仓 ∧ 档在（格④） | 不抛；`agent.manifest === null`；档内容不变（AC-14） |
| T25 | 正常：工程模式 + 仓内缺档 | `engineering:true` + 仓根无档 | 建档（= `DEFAULT_MANIFEST`）+ `agent.manifest` 附着（AC-15①②） |
| T26 | 边界：工程模式 + 非仓 cwd（无项目） | `engineering:true` + 空目录（梯⑤） | **不抛**；锚处生成档（= `DEFAULT_MANIFEST`）+ 附着；`_projectView.created === true`（AC-15② / KD-M1-29） |
| T27 | 边界：工程模式 + 档非法 | `engineering:true` + 非法 JSON / 非法枚举值 | **不抛**（fail-closed 退为报明）；`agent.manifest === null`；`_projectView.state === 'invalid'`；档**未被改 / 未被覆盖**（AC-15④ / KD-M1-25） |
| T28 | 正常：装配期判据取槽值（**槽真 config 假**） | `attachManifest(agent, { cwd: 仓根有档, slotData: { engineering: true } })`，agent config `engineering:false` | 装配期即附着（`agent.manifest` 非 null）（AC-16①） |
| T28b | 正常：装配期判据取槽值（**槽假 config 真**）——非仓 | `slotData: { engineering: false }` + 非仓 cwd + agent config `engineering:true` | 不抛；`agent.manifest === null`（AC-16②） |
| T28c | 边界：同上——仓内无档 | 同上（cwd = 仓根、无档） | 档**未**生成（AC-16②） |
| T28d | 边界：重估点幂等（值同 ⇒ 无副作用） | 装配后置 config 与槽同值 → 重调 `attachManifest(agent)` | `agent.manifest` 不变；零新写（AC-16③） |
| T29 | 边界：翻转清陈旧 | 工程模式已附着 → 置 `engineering:false` → 重调 | `agent.manifest === null`（AC-17） |
| T30 | 错误：#33 files 声明面 | `["PROJECT-MANIFEST.json"]` / `["sub/project-manifest.JSON"]` / `["CHANGELOG.md","PROJECT-MANIFEST.json"]` | 拒，文案含 `/Manifest file/`（混合例两条文案齐：`/Manifest file/` + `/Parent-side maintained file/`）（AC-18） |
| T31 | 端到端：CLI 非仓 normal 启动 | 子进程 `chat "hello"`（伪 HOME + 非仓 cwd + mock 端点；config 无 `agent.engineering`） | 退出码 0；stderr 无「工程模式启动拒绝」（AC-14） |
| T32 | 正常：**值变重推（盘面驱动——#34）** | 临时项目根 + 真实数据档（`initial-dev`）+ 工程 agent（cwd = 该根）；推 → 改盘上 `production`（mtime 推进）→ 再推 | 第二次 `true`；行 = `phase: production (rigor: strict)`；该前缀恰 1 条（AC-N7——**先红**） |
| T33 | 边界：首次观测对齐（缓存未设） | 内存档 `initial-dev` + 盘上 `production` | 首推即 `production`（读一次对齐）（AC-N7d） |
| T34 | 边界：未变零重读（mtime 未推进） | 首推后：改档内容 + `utimesSync` 复位 mtime → 再推 | `false`；行不变（未重读）（AC-N7b） |
| T35 | 错误：stat 失败（档被删） | 首推后删档 → 再推 | 不抛；行不变（沿用已知值）（AC-N7c） |
| T36 | 错误：读回非法 → 保守；修好 → 自愈 | 首推后写非法 JSON（mtime 推进）→ 再推；改回合法（mtime 再推进）→ 再推 | 前 `false`、不抛、行不变；后 `true`、行更新（AC-N7c） |
| T37 | 正常：翻转准入（合法档） | 工程未开 + 仓根合法档 → `eng` 工具 enter | 放行：`engineering === true`、`agent.manifest` 非 null；返回文案 = 既有成功文案（AC-20①） |
| T38 | 正常：翻转建档（缺档：梯②⑤ 建档 ∥ **项目梯④（裸仓级）** 报明） | 工程未开 + 仓根无档（梯②）/ 多根工作区 + 下辖 1 裸仓（**项目梯④（裸仓级）**）/ 空目录（梯⑤）→ enter | 梯②⑤ 皆放行：档生成（= `DEFAULT_MANIFEST`，落点 = 锚）+ 附着（AC-20②）；**项目梯④（裸仓级）报明**（`workspace` + 候选全列 + 路径指引，零就地建档——不向裸仓取根）；**反证格**：同场景按缺省 `writer`（`'subagent'`）调 `resolveEngineeringManifest` ⇒ `{ok:false, code:'init-failed'}` + 档未生成——调用点漏传 `writer:'main'` 即可机判 |
| T39 | 错误：**拒翻（唯一「档非法」格）+ 工作区放行** | 多根工作区 + 2 带档子项目 → enter；档非法 JSON → enter | 工作区格 ⇒ **放行**（`engineering === true`、`agent.manifest` = null）；档非法格 ⇒ 拒（`engineering` 仍 false、`agent.manifest` 仍 null、`_pendingReminders` 长度不变、工具返回含原因句（锚 `/项目不可解析/`））（AC-20③④） |
| T40 | 边界：**先判后翻零副作用** | 拒翻格（同 T39——档非法）后检查内态 | `_advisorRuns` 未被重置、`_lastEngState` 未改、槽 / config.json 未被写（AC-20——**先红**：实现前必红） |
| T41 | 正常 / 边界：仓发现四态 | tmp 夹具（真 `.git` 目录 + `PROJECT-MANIFEST.json` 档）：① 锚自建 `.git` ② 非项目目录 + 唯一带 manifest 子仓 ③ 空目录 ④ 非项目目录 + 两带 manifest 子仓 | ① `self`（`root` = 锚、`candidates` = `[]`）② `unique`（`root` = 子仓、`candidates` = `[子仓]`）③ `none`（`root` = `null`、`candidates` = `[]`）④ `workspace`（`root` = `null`、`candidates` = 两候选按名排序）（AC-21） |
| T42 | 边界：**带档路径回归**（`resolveProjectRoot` 带档格；变更面 = T45） | 同 T41 四态夹具（带档） | ①② ⇒ 路径；③④ ⇒ `null`——既有发现面同判据；既有发现面用例 **零改**即回归守卫（AC-21 / AC-24） |
| T43 | 正常 / 边界：**发现梯两表六格** | tmp 夹具：① 锚带档（无 `.git`）② 锚 = 裸仓（`.git` 无档）③ 非项目目录 + 一个「`.git` + 档」子仓（旁夹一裸仓干扰项）④ 非项目目录 + 一个裸仓（无带档者）⑤ 空目录 ⑥ 非项目目录 + 两带档子仓（旁夹裸仓） | `discoverProjects` ⇒ ① `self`/`manifest` ② `self`/`git` ③ `workspace`/`manifest`（干扰裸仓不入选） ④ `workspace`/`git` ⑤ `none` ⑥ `workspace`/两候选按名排序；`discoverRepos` 同夹具逐格对（③ ⇒ `unique` 重定向；④ = 裸仓级 `unique` 新命中；⑥ = 工作区）（AC-23） |
| T44 | 边界：**不递归 / 不向上** | 非项目目录 + 孙目录带档（子目录无档）；非项目目录 + 子目录内嵌仓 | 两格皆 `none`（只看直接子目录一层；不向上）（AC-23） |
| T45 | 边界：**`resolveProjectRoot` 变更面** | 同 T43 夹具 + 根项目内不带档子目录 | ①② ⇒ 锚；③ ⇒ `null`（下辖带档者 1 ⇒ `workspace`——不向下取根）；④ ⇒ `null`（下辖裸仓 1 ⇒ `workspace`）；⑤⑥ ⇒ `null`；⑦ ⇒ **根项目根**（**上溯取最近**——子目录自身不带档 ⇒ 归其项目根）（AC-24） |
| T46 | 正常 / 边界：**情境行四态逐字** | 纯函数 `manifestReportLine` 四态（工作区两变体各一：带档级 / 裸仓级）；推注入：工程 + depth-0 + `agent.cwd` = 各态夹具 | 四态行文逐字 + 工作区两变体逐字（AC-25）；`ok` 态 = 相位行（AC-N1 断言零改） |
| T47 | 边界：**首观失败可见 / 有既往值保守** | ① 无既往好值（`agent.manifest` 未附着）+ 档非法 ⇒ 推 ⇒ 报明行；② 有既往好值（先推过相位行）+ 档删 / 档非法 ⇒ 行不变（T35 / T36 零改） | ① `true` + `invalid` 报明行；② `false` + 行不变（KD-M1-26） |
| T48 | 正常 / 边界：**归属形（自身所在目录 / 嵌套）** | 夹具：根项目 R（带档）+ R 内子项目 S（带档）+ R 内不带档子目录 D + R 外兄弟目录 X（无档）+ 非项目目录 C（R / X 在其下）；目标 = ① S 内文件 ② R 根内文件 ③ D 内文件 ④ X 内文件 ⑤ C 处 | ① ⇒ S 档（自身所在目录）② ⇒ R 档 ③ ⇒ **R 档**（**上溯**——D 自身无档 ⇒ 最近带档祖先 R）④ ⇒ 无项目（**不跨兄弟**）⑤ ⇒ `workspace`（`root` = `null`、`candidates` = `[R]`——多根工作区不择子目录）；相位行 = 锚项目状态（AC-26 / AC-30） |
| T49 | 正常：**建档两格（轻动作）** | 工程 + depth-0：梯②（锚 = 裸仓无档）· 梯⑤（空目录） | 两格皆生成 `PROJECT-MANIFEST.json`（内容 = `DEFAULT_MANIFEST`）；落点 = ② 锚 / ⑤ 锚（AC-27）。**下辖 1 裸仓的目录不在此列**——那是 `workspace`（报明，不就地建档） |
| T50 | 错误：**零建档两格 + 零自动 git** | ① 工作区（两候选）② 档非法；源码面读三档 | ① 零建档 + 报明；② 零建档（不覆盖坏档）；源码面：`manifest.mjs` / `make-agent.mjs` / VSC `setup.mjs` 无 `git init` 调用面（AC-27） |
| T51 | 端到端：**工程模式 + 非仓 cwd 启动** | 子进程 `chat "hello"`（伪 HOME + 非仓 cwd（梯⑤ 与 梯④ 两格）+ config `agent.engineering: true` + mock 端点） | 退出码 0；stderr 零拒绝句（锚 `/项目不可解析/` 零命中）；梯⑤ 格 ⇒ 锚处生成档 + 进入正常循环；**项目梯④（裸仓级）** 格（多根工作区 + 下辖 1 裸仓）⇒ **报明、零建档**——stderr 含报明行、裸仓档零变（**先红**：现行该格把档静默建到会话锚、零报明——`manifest-discovery.mjs:62` 报 `unique` ∧ `:147` 只认 `workspace` ⇒ `writeRoot` 回落锚）（AC-22） |
| T52 | 边界：**两端同形** | 同夹具：CLI `attachManifest` 直调 · VSC `hydrateRun` 钩子块（`depth 0`） | `agent.manifest` / `agent._projectView.state` 两侧相等；报明行文本同源（核单点）（AC-22 / AC-28） |
| T53 | 正常：**翻转面梯⑤（无项目）⇒ 建档 + 放行** | 工程未开 + 空目录 cwd（梯⑤）→ enter（三路：核心 `eng` 工具 / `/eng` / 切槽 · ACP） | 放行：`engineering === true`、档在锚处生成（= `DEFAULT_MANIFEST`）+ 附着、成功文案 / 标签面正常（AC-20②——梯⑤ 格的现行处置） |
| T54 | 结构面：**发现单源（模块内）** | 源码面读 `thincoder-core/manifest-discovery.mjs`（用例执行体随测试体系重建；无夹具——同 A20 法） | `readdirSync` 全档恰 1 处 ∧ 居私有内核 `scanChildren` 体内 ∧ `discoverProjects` / `discoverRepos` 两函数体各含 `scanChildren(` 调用（AC-23） |
| T55 | 边界：**`init:false` 面工作区（VSC `depth > 0`）** | 多根工作区 + 2 带档子项目 → 调 `resolveEngineeringManifest(cwd, { init: false })`（VSC `depth > 0` 分支同调） | **不抛**（非 fatal）；返 `{ ok:false, code:'workspace', candidates }`（下辖项目全列且按名排序）；**零建档**（档未生成 / 未被改）（AC-15③ / AC-22——与 §2.8 F1 `!init` 工作区出口逐码一致） |
| T56 | 正常 / 边界：缺族键档读入 → 两族补默认 | manifest 无 `codePaths` / `index` | `ok:true`；`manifest.codePaths = ["src"]`；`index` = 默认；`missingKeys` 含两键（AC-31） |
| T57 | 错误：两族形态判据 | `codePaths:"src"` / `codePaths:[""]` / `codePaths:[1]` / `index:{codeExtensions:"md"}` | `validateManifest` `ok:false` + `errors` 点名键（AC-32）；对照：`codePaths:[]` / `index:{codeExtensions:[".xyz"]}` `ok:true` |
| T58 | 边界：`initManifest` 落盘含两族默认 | `initManifest(cwd, { writer: 'main' })` | 落盘 = `DEFAULT_MANIFEST`（五键——声明族键在档）（AC-31） |
| T59 | 正常 / 边界：**`projectRootView` 三态 + 覆盖位** | tmp 夹具：锚带档（`ok`）· 双带档子目录（`workspace`）· 单带档子目录（`workspace`）· 空目录（`none`）· **锚自身为裸仓**（`.git` 无档、下辖无已注册项目 ⇒ `none`——AC-35 该格的 `projectRootView` 级断言）；覆盖位一组 | 逐态 `{state, root, candidates}` 归位（`ok` ⇒ 空候选 ∥ `workspace` ⇒ 全列按名排序 ∥ `none` ⇒ 双空）；覆盖在场 ⇒ 短路（`root` = 覆盖值）；`resolveProjectRoot` 逐格等价（AC-35） |
| T60 | 边界：**工作区锚两族零写 + 报明** | 夹具（双带档子目录）——① 台账缺省五工具 ② 批档 create 裸串 `docs/batches/<x>.md` ③ 批档 create 所属串 `<候选>/docs/batches/<x>.md` | ① 报明 + 点名项目根（零写——去「项目不可解析」错误框定）② 报明（条 5 逐字文案——机检锚 `belongs to no project`）③ 落该候选基底（AC-36） |
| T61 | 正常：某面「本面无」 | `docRoot.batches = null` ∥ `docRoot.design = null`（其余合法） | `readManifest` `ok:true`；`manifest.docRoot.<键> = null`（未补回）；`docRootPaths(null, cwd) = []`；`missingKeys` 不含该键（AC-39） |
| T62 | 边界：对照与负向 | 删 `docRoot.<键>`（对照）∥ `""` / `[]` / `["a",""]`（负向） | 对照：补默认单串（零改）；负向：`ok:false` + `errors` 含键名（AC-39 / AC-11） |
| T62b | 正常：`docRoot.batches = null` ⇒ 基底回退默认 | `docRoot.batches = null`（其余合法）；目标批档经基底解析命中（落默认基底 `docs/batches` 内） | 声明面零根（`docRootPaths(null) = []`）⇒ 基底集 = **默认基底**（回退恒发生——与缺键同款）；`resolveBatchDocPath` 正常命中返回；**对照**：显式基底全不可读 ⇒ `throw`（T21 零改——AC-12） |
| T63 | 正常：`read` 五态之 ok | target 带合法档（含未知键与缺键各一） | `state=ok` + manifest JSON + `missingKeys`（缺键路径）+ `unknownKeys`（含键名）行；`errors` 空（AC-40） |
| T64 | 边界 / 非 ok 四态：`read` | ① 缺档（裸仓）② 无项目（空目录）③ 工作区（双带档子目录）④ 档非法（坏 JSON / 非法枚举） | ① `state=missing` + init 引导 ② `state=no-project` ③ `state=workspace` + 下辖项目全列 ④ `state=invalid` + `errors` 行；四态均不抛（AC-41⑤） |
| T78 | 端到端：**多项目工作区实景（回归面五场景）** | 夹具 = `d:\teamcode`（下辖 `thincoder` ∥ `thincoder.com`；锚自身无档无 `.git`）：① 批档 create（`thincoder/docs/batches/<x>.md`）② `manifest` read / write（`target=thincoder`）③ 评审 documents（`docs/core/design/MANIFEST.md` 相对形）④ `ledger` 读写（`cwd=thincoder`）⑤ `git` 仓发现 | ①②④⑤ **不停手**：各自解析到 `thincoder`（按用点路径 / 显式 `cwd`）；③ **当场拒发**——workspace 锚下相对形无基面 ⇒ `criterion=scope-not-doc` + `reason=no-project-root` + 期望形两句，零评审实例（判据单源 = `docs/core/design/ADVISOR-GUARDS.md` §12 分支 2）；无路径形 ⇒ 报明 + 下一步（不抛「歧义」）；**零 `ambiguous` 字样**（AC-44 / AC-36） |
| T65 | 正常 / 边界：`init` 三格 + 不覆盖 | ① 梯②（裸仓无档）② **项目梯④（裸仓级）**（多根工作区 + 下辖 1 裸仓）③ 梯⑤（空目录——落点 = target 自身）④ 已带档 | ①③ 生成 `DEFAULT_MANIFEST`（落点 = 裸仓 / target）；② ⇒ 报明（`workspace`——不就地建档，候选全列）；④ 拒（`refused`）+ sha256 零变（AC-40 / AC-41④） |
| T66 | 正常：`write` 点改逐键族 | 六面各 ≥1 例（`version` / `phase` / `docRoot.design`（含 `null`）/ `codePaths` / `index.codeExtensions` / `index.publicRepos`） | 每例：档更新 + 回读**已知键**相等 + 非目标**已知**键逐字零变（**未知键丢 / 缺键补默认 = `readManifest` 回写收敛语义**——KD-M1-11；AC-40） |
| T67 | 错误：写 / 建拒面 | ① 非法值 ② 白名单外 key ③ 缺档 `write` ④ 工作区 ⑤ 无项目 `write` | 皆拒（`refused` 锚）+ 盘零变；③⑤ 引导 `init`；④ 候选全列（AC-41） |
| T68 | 边界：装配 + 权限面 | ① `assembleFamilyTools` depth 0/1 × 模式两值 × 角色五格 ② 主 agent `init` / `write` 实调 | ① depth-0 两模式恰一 `manifest`（全量变体）；depth>0 五段（eng-coder / eng-designer / coder / consult / 兜底）各含恰一 `manifest`（只读变体，`action` 枚举 = `["read"]`）② 落盘成功（`writer:"main"`）；`{writer:'subagent'}` 直调 ⇒ 拒（AC-42） |
| T69 | 边界：报告面随动（KD-M1-40） | 工程会话（cwd = 临时项目根）+ `manifest write` 改 `phase`（锚项目；mtime 推进——夹具 `utimesSync` 兜底）→ 下回合 `pushManifestStateReminder` | 行 = 新值（③b 采纳）；同回合**内存值不即时变**（反证格）；非锚目标写入 ⇒ 行不变（对照格） |
| T70 | 边界：**工具形·参数面** | `manifestTool` schema（登记册 `thincoder-core/agent-tools.mjs`） | `action ∈ {read,init,write}` 必填 ∧ `target` / `key` / `value` 可选——字段名 / 必填位逐项断言（AC-43①） |
| T71 | 边界：**分类谓词**（只读格） | `readonlyActionOf(tool,"manifest",{action:"read"})` ∥ `{action:"write"}` ∥ `{action:"init"}` | `read` ⇒ `true`；`write` / `init` ⇒ `false`（侧效门）（AC-43②） |
| T72 | 边界：**描述单源逐字节** | `manifestTool.description` ↔ `thincoder-core/tool-docs/manifest.md`（已落） | 逐字节相等（DESC 单解析面）（AC-43③） |
| T73 | 边界：**value 三值解析** | `"null"` ∥ `'["../shared"]'` ∥ 裸串（如 `docs/design`） | `null`（`docRoot.*` 本面无——KD-M1-37）∥ 数组 `["../shared"]` ∥ 字面串（AC-43④） |

