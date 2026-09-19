# 项目状态档 manifest（MANIFEST）· 工程模式 v2 模块设计（M1）

> **转正注记**（2026-09-17 退役批 · 主 agent）：M1 为 v2 **新机制**（v1 无 manifest 概念，无旧档可合并）——§12 反向退役表未列，模块设计档**转正**为本主题独立权威档（原 `ENGINEERING-MODE-V2-MODULE-MANIFEST.md` 模块档改名本档，无归档副本）。
> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M1）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 基础族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

工程模式 v1 把「文档放哪」「机检怎么判」「当前什么阶段」等情境信息**烧死在产品代码里**（`docs/` 路径硬编码、机检阈值写死脚本参数）——换个被开发项目就得改代码，违「可迁移」（N3）。本模块落一个**纯机器状态 JSON 声明档**（`PROJECT-MANIFEST.json`）在**项目根（= git 仓根——判据 = .git 纯向下；2026-09-17 用户裁定）**，机制代码在核（`thincoder-core/manifest.mjs`），操作对象 = 被开发项目自己持有的数据档。

一次声明、多处读取：文档体系落点（`docRoot`）、机检判据（`checkConfig`）、情境旋钮（`phase`）全部从这一处取——机制不硬编码任何本仓路径（v2 §5.1 · §6 · §9）；其中 `phase` 另经**情境行**进模型上下文（§2.6）。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | schema 五键：`version` · `phase` · `docRoot` · `promptsLanding` · `checkConfig` | ②.1 |
| F2 | 读 / 写 / 校验器：`thincoder-core/manifest.mjs`，操作对象 = **每个 git 仓一份** `PROJECT-MANIFEST.json`（项目根判定 = .git，纯向下：锚自身仓 → 自身；否则向下唯一带 manifest 子仓——2026-09-17 用户裁定） | ②.2 |
| F3 | 整档缺失处置：拒绝进入正常循环，先初始化（定阶段 + 盘家底）生成 manifest | ②.3 |
| F4 | 缺键 fallback：manifest 存在但缺某键 → 用默认值（不拒绝）；`docRoot` / `checkConfig` 子键缺与整键缺同语义 | ②.4 |
| F5 | 写门：唯一作者 = 主 agent（非主 agent 写 → 拒） | ②.5 |
| F7 | `docRoot` **值形态**：非空字符串（单根）或**非空字符串数组**（多根——一个文档层跨多个根目录） | 批次档 `docroot-multiroot` §1.2（用户 2026-09-17 22:28 裁定）· 台账 #32 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零依赖 | 只用 `node:fs` / `node:path` + 标准库 `JSON.parse`（无第三方解析器、无 `node:sqlite`） |
| N2 | 可机判 | 校验器输出结构化 `{ok, errors}`，判据机械判（枚举 / 键存在），禁散文判据 |
| N3 | 可迁移 | 不写死本仓路径——`docRoot` / `checkConfig` 由被开发项目声明（架构 §2.3 E2） |
| N4 | fail-closed | 整档缺失不静默 fallback（AC-M1-2）；写门默认拒（AC-M1-5） |

### 1.4 范围边界（本模块不做）

- 不做台账（M2）；不做机检（M8）；不做批次档写入（M3）。
- 不替被开发项目创建目录；不做交互式初始化问答（初始化流程归两端壳面，本模块只提供读写校验）。
- 不承载「待裁 / 决策」类内容（manifest 是纯机器状态，决策进文档）。
- `docRoot` 值形态 = 非空串 | 非空串数组——不动 `REVIEW_ROOT_KEYS` 五键集合、不纳入参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）。
- **五键**（`version` / `phase` / `docRoot` / `promptsLanding` / `checkConfig`）的判据取值、`REVIEW_ROOT_KEYS` 键集、评审机制其他面（token 门 / 批档门 / 门序 / 冻结窗口）零碰。

## 2. 设计层

### 2.1 方案与理由

存储格式 = JSON 已在架构 §2.1 选型 #2 裁定（标准库 `JSON.parse` + schema 校验即可机检，无第三方解析器）。本模块只做**读写校验机制 + 两端装配钩子**，无新格式选型。

**核心方案（就机制本身说清为什么）**：

1. **五键 schema 落成校验器常量**（`MANIFEST_SCHEMA` + `DEFAULT_MANIFEST`）：枚举（`phase`）、键存在（`docRoot` 五键、`checkConfig` 四键）由校验器机械判——判据单源，读面（下游 M2–M9）与写门（本模块）同用一处；**校验器不读 fs**。
2. **整档缺失 vs 缺键两分**：整档缺失 = **拒**（`readManifest` 返回 `{ok:false, reason:'missing'}`，壳面据此拒进正常循环）；缺键 = **便利 fallback**（用默认值补，`{ok:true, missingKeys:[...]}`）。这两分对应规格 ②.3 / ②.4，不可混（整档缺失绝不能静默 fallback）。
3. **写门 = 校验器内 `writeManifest` 的 `writer` 上下文**（fail-closed）：`writeManifest(cwd, manifest, { writer })` 仅在 `writer === 'main'` 时放行，缺省 / 其他值一律拒。主 agent 经 M1 读写装配调用；子代理无此调用路径（其二道防线 = M5 spawn 门 `files` 域排除 `PROJECT-MANIFEST.json`——见 §2.5）。
4. **初始化 = `initManifest` 写默认档**：只提供机制（写默认五键档），不包交互问答（问答归壳面）——与规格 ③ 边界一致。落盘走同一写门（内部 `writeManifest(cwd, DEFAULT_MANIFEST, { writer })`，缺省拒——与 AC-M1-5 同一闸，无第二条写路径）。
5. **`docRoot` 值域扩为「单串 | 多根数组」**（F7）：一个文档层（如 `design`）可跨多个根（`docs/core/design` + `docs/cli/design` + `docs/vsc/design`）——**值形态决定语义**：串 = 该键取此路径；数组 = 该键取这些路径（**完整声明**，不与默认合并）。
   解析管线（展开 / `trim` + `\` 归一 / 基数 = 项目根 / 去重保序）与形态判据**同落 M1 一处**（`docRootPaths` / `isValidDocRootValue`），消费面只经该谓词取值——判据单源（KD-M1-8）；非法形态 → 校验拒（KD-M1-7，不静默跳过）。详见 §2.7。

### 2.2 架构 / 接口 / 数据流契约

```text
产品启动（CLI make-agent 装配 / CLI 启动恢复 / VSC hydrateRun 每轮） ─► 模式门：会话权威值 engineering === true ?
  ├─ 否（普通会话）→ 装配钩子零 manifest I/O（不读 / 不拒 / 不建档）→ agent.manifest = null → 正常循环
  └─ 是（工程模式会话）→ requireManifest(cwd)
       ├─ 档缺失 ─► 项目根可解析？（.git 纯向下：锚自身仓 → 自身；否则向下唯一带 manifest 子仓）
       │    ├─ 可解析 → 走初始化（`initManifest(cwd, { writer: 'main' })` 写默认档）→ 再进正常循环
       │    └─ 不可解析（锚非仓 ∧ 向下带 manifest 子仓 ≠ 1）→ 拒：抛「工程模式启动拒绝」，**不自动建档**
       ├─ 档非法 → 拒进正常循环（fail-closed 抛错）
       └─ 档存在 → 校验 + 补默认值 → 正常循环（下游 M2–M9 读 manifest 字段）
```

**接口（`thincoder-core/manifest.mjs`，全新增）**：

- `MANIFEST_REL` = `"PROJECT-MANIFEST.json"`（常量）。
- `manifestFilePath(cwd)` → `string`（**本批新增**——档路径**单源** KD-M1-18）：`join(writeRoot(cwd), MANIFEST_REL)`（项目根优先解析，与读 / 写 / mtime 门控三处同源）。本批 `readManifest` / `writeManifest` 两处既有同式（`join(root, MANIFEST_REL)`）改用之——**零语义**（`writeRoot` 保留）。
- `discoverRepos(cwd)` → `{ kind, root, candidates }`（**本批新增**——仓发现**单源**，KD-M1-22）：`kind` ∈ `self`（锚含 `.git` ⇒ 锚即根）/ `unique`（**向下仅直接子目录**一层，恰一个含 `.git` ∧ `MANIFEST_REL` 者 ⇒ 它）/ `none`（零）/ `ambiguous`（≥2 ⇒ `root: null` + `candidates` 全列**按名排序**）。
  **纯 fs**（只判存在性——不解析档内容）· **不抛**（锚不可读 ⇒ `none`）· **不向上遍历**。
- `resolveProjectRoot(cwd)` → `string|null`（**既有符号——本批补记入本清单**）：`discoverRepos(cwd).root` 的薄包装，四态输出与批前**逐字同**（`self` / `unique` ⇒ 路径；`none` / `ambiguous` ⇒ `null`）。调用方（`manifestFilePath` / `docRootBase` / `thincoder-core/ledger-db.mjs`）零改。
- `MANIFEST_SCHEMA`（对象：`phase` 枚举、`docRoot` 五键存在、`checkConfig` 四键存在、`promptsLanding` 存在、`version` 数值）。
- `DEFAULT_MANIFEST`（对象：默认五键——`version:1`、`phase:"initial-dev"`、`docRoot` 默认五路径、`promptsLanding` 默认落地路径、`checkConfig` 默认判据）。
- `readManifest(cwd)` → `{ ok, manifest, missingKeys, errors, reason }`：读 + `validateManifest(obj)`；缺键 → 产 `missingKeys`（非拒）→ 补默认值 → 再校验通过；整档缺失 → `{ok:false, reason:'missing'}`。
- `validateManifest(obj)` → `{ ok, errors, missingKeys }`：形状校验（枚举 / `version` 数值 / 键存在 / **`docRoot` 子键值形态**——F7）；**纯函数、不读 fs、不落盘**。
- `requireManifest(cwd)` → 装配钩子入口 = `readManifest(cwd)`：`ok:true` 返回补默认值后的 manifest；`reason:'missing'` 由调用方走初始化分支（**工程模式会话**口径——壳面拒进正常循环直至初始化完成；模式门 + 拒分支见下方两端装配钩子）。
- `resolveEngineeringManifest(cwd, { writer = 'subagent', init = true })` → **非抛错**的入口决策树（**本批新增**，§2.8 F1）：`{ ok:true, manifest, created }` \| `{ ok:false, code:'missing' \| 'invalid' \| 'root-unresolvable' \| 'init-failed', message?, errors? }`——两端入口钩子（抛错薄包装）与翻转面（拒翻）**共用同一张树**（判据单源，KD-M1-20）。
- `isValidDocRootValue(value)` → `boolean`（**本批新增**，F7）：`docRoot` 子键**值形态判据**——非空字符串（`trim` 后非空）| 非空数组且元素皆非空字符串（**同款口径**：元素 `trim` 后非空）；其余（空串 / 空白串 / 空数组 / 数组含非串 / 空串 / 空白串元素 / 非串非数组）为非法。
- `docRootPaths(value, cwd)` → `string[]`（**本批新增**，F7）：`docRoot` 子键值 → **绝对路径数组**——展开（串 / 数组统一成列表）→ 逐元素 `trim` + `\` 归一 → `resolve(docRootBase(cwd), p)`（基数 = 项目根）→ 去重（保序）；非法形态 → `[]`（零根——拒面在 `validateManifest`；两处共用 `isValidDocRootValue`，判据单源 KD-M1-8）。
- 缺键 fallback 粒度：顶层键缺 → 补默认值；`docRoot` / `checkConfig` 子键缺 → 与整键缺**同语义**（补该子键默认值 + `missingKeys` 记子键路径），不拒。
- `initManifest(cwd, { writer = 'subagent' } = {})` → 经写门（内部 `writeManifest(cwd, DEFAULT_MANIFEST, { writer })`）写 `DEFAULT_MANIFEST`；缺省拒（fail-closed），返回 manifest。
- `writeManifest(cwd, manifest, { writer = 'subagent' } = {})` → 落盘前先 `validateManifest(manifest)`（`ok:false` → 拒落盘，防写非法档）；仅在 `writer === 'main'` 时落盘，否则拒（fail-closed）。

**两端装配钩子**：

**模式门（判据单源——会话权威值优先）**：`engineering === true`，其中 engineering 取**会话权威值** = 「恢复槽带 `engineering` 字段 ? 槽值 : `config.agent.engineering`」（**槽优先 + config 回退**；语义同源 = 情境行注入判据②，`thincoder-core/agent/setup-reminders.mjs:82`）。
取值点三处（同一合并结果，非三份判据）：
  · ① **CLI 装配期**——`bin` TUI 分支的 `resumeSlot` 记录以 `slotData` 形参进钩子（装配期 `bin:306` 早于 `applySession` `:320`，槽值只能这样进）；
  · ② **CLI 重估点**（`applySession` 之后）——`agent.config.agent.engineering` 已由 `applySession` 按槽订正（`thincoder-core/session.mjs:314-317`）；
  · ③ **VSC `hydrateRun`**——`agent.config.agent.engineering` 已由 `applySlotSessionState` 按槽订正（`thincoder-vscode/src/agent/agent-state.mjs:88-91` 三级优先）。
非工程模式 → 钩子整体不执行：**装配钩子零 manifest I/O**（不读 / 不拒 / 不建档）+ `agent.manifest = null`（清残留附着——复用 agent 跨模式防陈旧）。
下游仍读盘的消费面另有其族（任何模式照读）——见 §2.5「普通会话的读面边界」条（本批零改）。

- CLI：钩子体抽为导出函数 `attachManifest(agent, { cwd = process.cwd(), slotData } = {})`（`make-agent.mjs`），在**会话起点**调用（幂等——重估即重读，无状态位）：
  ① **装配期**（`assembleAgent({ excludeTools, slotData })` 的 `createAgent` 之后——`:135`，附着 `agent.manifest`）：**判据取会话槽值**——`bin` TUI 分支把既有 `resumeSlot` 调用（现 `:315`）提至装配之前，恢复记录以 `slotData` 形参传入（同进程同一调用 ⇒ **零新增写动作**；时序提前——装配失败路径下槽已认领）。
     · **不在钩子内调用 `resumeSlot`**（KD-M1-15）：该函数**非纯读**——`scheduleSessionGC` + `claimSlot`（写 `slotSessions` / 翻共享 `active`）+ `writeEndMarker`（`thincoder-core/session.mjs:52-55` / `thincoder-core/session-slots.mjs:478-497`）；钩子内调用会让 `chat` / ACP 装配路径凭空认领会话槽（本批禁扩大面）。
     · `chat` / ACP 装配不传 `slotData` = 无会话 ⇒ config 回退（无权威槽值可取）。
  ② **重估点**（`bin/thincoder.mjs` 启动恢复块之后——`agent._slot = slot` `:330` 与 `startTUI` `:343` 之间）：一行 `attachManifest(agent)`。
     · CLI 的工程模式权威值 = 会话槽（`thincoder-core/session.mjs:311-317`；`/eng` 只写槽不写 config.json——`cmd-eng.mjs:61-78`），装配期（`bin:306`）早于会话应用 ⇒ 恢复的工程会话在此重估。
     · 此时 `agent.config.agent.engineering` 已由 `applySession`（`thincoder-core/session.mjs:314-317`）按槽订正 ⇒ **与 ① 同值 ⇒ 幂等重估**（值同 ⇒ 无副作用）。
  缺失处置：项目根**不可解析** → 抛「工程模式启动拒绝」（**不自动建档**）；可解析 → `initManifest(cwd, { writer: 'main' })`（拒进正常循环直到生成）。
  **钩子后移的可观察后果（评审轮 1 发现 6）**：拒 / 建档现发生于 memory sync / MCP 连接 / 工具装配（`:78-133`）之后 ⇒ 拒绝路径已付出这些启动成本（可观测量：拒绝时 stderr 可能已有 MCP 警告、退出前多耗连接超时）；功能等价——拒点仍在进入正常循环之前（未进交互循环）。
- VSC：`hydrateRun`（`thincoder-vscode/src/agent/setup.mjs:96`）钩子块（`:371-396`；模式门 `if` = `:378-396`——as-of 2026-09-18 02:2x 实读）**块首加模式门**——判据 = `agent.config.agent.engineering`，已由 `applySlotSessionState`（`:242-246`）按槽订正（槽优先 + config 回退的同一合并结果；VSC 每轮 reconcile = 已是会话起点，无并列第二点）；
  缺失 + **`depth === 0`** → `initManifest(..., { writer: 'main' })`；`depth > 0`（子代理水合同经此钩）仅不初始化（写门缺省拒已机械兜底）；根不可解析 → 同款「工程模式启动拒绝」。
- **运行期值刷新（本批新增——#34）**：附着决策**仍只在会话起点**（KD-M1-12 / KD-M1-13 零改）；已附着会话的 `agent.manifest` **值**改由注入器每回合 mtime 门控重读（§2.6 ③b）——落地「CLI 会话内改档 ⇒ 下回合情境行更新」。**两分不混**：钩子管附着，注入器管取值。
- 行号 = as-of 2026-09-18 00:0x 参考（D4——落点以函数名为准）。**上批不做 / 本批落定**：会话起点（ACP 装载）与进程内翻转（CLI `/eng` ON · `/session` 切槽 · 核心 `eng` 工具）的重估——两族**两分记**已由 §2.8 落笔（#41）。

### 2.3 受影响文件全清单（as-of 实测（`\n` 计数）；**三批并列**——行 1–9 = 装配门禁小修批（#30 模式门 / #33 二道防线）· 行 10–12 = #34 值变重推批 · 行 13 = 本批（#62 仓发现复用））

| # | 文件 | 当前行数 | 变更 | 编辑点（函数级） | 本轮增量 |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/src/cli/make-agent.mjs` | 197 | 修改 | 内联 M1 钩子块（`:42-64`）抽为导出 `attachManifest(agent, { cwd, slotData })` + 块首模式门（判据 = 会话权威值：`slotData?.engineering` 在场取槽值，否则 `agent.config.agent.engineering`——§2.2）；`assembleAgent({ excludeTools, slotData })` 在 `createAgent`（`:135`）后调用并附着（原 `manifestInit` 载体 / `:148-149` 附着行并入） | ±~20 |
| 2 | `thincoder-cli/bin/thincoder.mjs` | 425 | 修改 | ① import 行（`:24`）加名；② TUI 分支 `resumeSlot` 调用（现 `:315`）**前移至 `assembleAgent`（现 `:306`）之前**，恢复记录以 `assembleAgent({ slotData: data })` 传入（装配期判据来源——**无新增读点**：同一调用位置前移）；③ 启动恢复块之后（`agent._slot = slot` `:330` 与 `startTUI` `:343` 之间）一行 `attachManifest(agent)`（重估点） | +~6 / −2（净 +4） |
| 3 | `thincoder-vscode/src/agent/setup.mjs` | 470 | 修改 | `hydrateRun` 钩子块（`:375-391`）块首模式门（normal → 只置 `agent.manifest = null`，不读 / 不拒 / 不建档） | ±~5 |
| 4 | `thincoder-core/agent-tools/spawn-gates.mjs` | 95 | 修改 | 新常量 `MANIFEST_BASENAME`（**字面量**——保叶子零 import）+ `rejectEngineeringFilePaths` 新 `else if` 分支（专用拒文案） | +6 |
| 5 | `thincoder-core/agent/write-gate.mjs` | 86 | 修改 | 注释收正（`:13` / `:39-40`「壳面拦」句加**工程模式会话**口径——零语义） | ±0 |
| 6 | `thincoder-core/test/spawn-gates.test.mjs` | 121 | 修改 | 新增一例（#33 排除：大小写 / 层深变体 + 混合收集两条文案）；既有 CHANGELOG 用例组**零改** | +~15 |
| 7 | `thincoder-cli/test/make-agent-manifest-gate.test.mjs` | 0 | 新增 | `attachManifest` 直调用例组（AC-14 四格 / AC-15 四态 / AC-16 三向 / AC-17——T23–T31 含新增 T24b · T24c · T28b–T28d） | +~85 |
| 8 | `thincoder-cli/test/integration/cli-prompt-entry.test.mjs` | 100 | 修改 | 新增「normal + 非仓 cwd 启动」用例（`mkEnv` 现在 `:27` 建 `.git`——需非仓变体；`_setProjectRootForTest` 兜底不用于子进程面） | +~15 |
| 9 | `thincoder-vscode/test/setup-reminders.test.mjs` | 303 | 修改 | 新增「normal 模式 hydrateRun 零 manifest I/O」用例——模式**显式钉死**（`opts.engState = { enabled: false }`；不得依赖本机 config.json `agent.engineering`——`agent-state.mjs:88-91` 三级优先） | +~15 |
| 10 | `thincoder-core/manifest.mjs` | 258 | 修改 | 新导出 `manifestFilePath(cwd)`（= `join(writeRoot(cwd), MANIFEST_REL)`——档路径单源，KD-M1-18）；`readManifest` / `writeManifest` 两处同式改用之（零语义；`writeRoot` 保留）——**各删 `const root = writeRoot(cwd)` 一行**（Δ −2 落点 = `:198` / `:241`），读 / 写调用行改传 `manifestFilePath(cwd)`（`:201` / `:246`） | +~6 / −2（净 ~+4） |
| 11 | `thincoder-core/agent/setup-reminders.mjs` | 160 | 修改 | 模块私有 `refreshManifest(agent)`（③b 值变检测：`manifestFilePath` → `statSync` 门控 → `readManifest` 采纳 / 失败保守）+ `pushManifestStateReminder` 取值前置步一行调用（判据③ `:84` 之后、行构造 `:86` 之前）+ **行构造改取刷新后的值**（`:83` 的局部捕获 `const manifest = agent.manifest` 删除、判据③ 改读 `agent.manifest`——不改则 ③b 刷新的值喂不到行构造，T32 才暴露）+ 两条新 import（`node:fs` 的 `statSync` · `../manifest.mjs` 的 `manifestFilePath, readManifest`；现档 import 三条 = `:25-27`）+ 模块头注一行 | +~30 / −1（−1 = `:83`） |
| 12 | `thincoder-core/test/setup-reminders.test.mjs` | 136 | 修改 | 新增用例 T32–T36（值变重推 / 首观测对齐 / 未变零重读 / stat 失败保守 / 非法档保守与自愈——临时项目根夹具 + `utimesSync` 确定性推进 mtime）；既有用例组（AC-N1–AC-N6）**零改** | +~65 |
| 13 | `thincoder-core/manifest.mjs` | 319 | 修改 | 新导出 `discoverRepos(cwd)`（四态结构化 + `candidates` 按名排序——KD-M1-22）；`resolveProjectRoot` 改其薄包装（**零语义**；`_setProjectRootForTest` 覆盖语义保持——覆盖在场 ⇒ `self` + `root` = 覆盖值）；头注一行（行数 = as-of 2026-09-19 实测） | +~45 / −10（净 ~+35） |

> 说明：**行数 = as-of 实测（`\n` 计数）**；行 1–9 = 装配门禁小修批（#30 模式门 / #33 二道防线）增量（as-of 01:5x）· 行 10–12 = #34 值变重推批增量（as-of 01:5x）· **行 13 = 本批（#62 仓发现复用）**（as-of 2026-09-19）；上批（activeBatch 裁撤）的 M1 面清单见其批档 `docs/batches/2026-09-17-activebatch-repeal.md` §2.2。
> 行 10 的改动面 = **一行导出 + 两处同式改用**（机制本体零改——KD-M1-18）；行 13 的改动面 = **一个导出 + 一处包装化**（机制本体零改——KD-M1-22）。
> 落点以**函数名**为准、行号为 as-of 参考（D4）；与本批并行在飞的他批若同碰这些档，开工前先 `git status` 复读行数、**串行实施**（同文件并发写 = 丢改风险）。
> 行数说明（>300 行建议带三行——评审轮 1 发现 9）：#2 425 · #3 470 · #9 303，本轮增量均为单点微增（+~6/−2 · ±~5 · +~15）、无跨档（<500 硬限）⇒ **不拆**：
> #2 增点为既有恢复块内的调用前置 + 一行重估调用（拆档会把「恢复决策 → 装配 → 应用」的顺序契约切成两档，反增耦合）· #3 为 `hydrateRun` 内一块（拆档会把钩子与 hydrate 顺序分离）· #9 为测试档（按用例组内聚——拆档只增跳转成本）。行数债随下次触碰该档时评估。
> 本批三档行数（`thincoder-core/manifest.mjs` 258 · `thincoder-core/agent/setup-reminders.mjs` 160 · `thincoder-core/test/setup-reminders.test.mjs` 136）**均在 300 软线内**；按本轮 Δ 推后 ≈262 · ~189 · ~201（增量后最高 = `manifest.mjs` ≈262）——无拆分面（<500 硬限）。
> 设计档自身（本档 §2.2 架构图 + 两端钩子行 / §2.3 本表 / §2.4 KD-M1-12–M1-16 / §2.5 各条 / §3.1 AC-14–AC-18 / §3.2 T23–T31（共 14 行——新增 T24b · T24c · T28b · T28c · T28d）/ §4 + `docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E2 模式口径句）由 eng-designer 本批落笔——**coder 零写设计档**。

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M1-1 | 机制代码在核（`manifest.mjs`），数据档在被开发项目根 = git 仓库根（判据 = .git 纯向下：锚自身仓 → 自身；否则向下唯一带 manifest 子仓；2026-09-17 用户裁定） | 架构 §2.2 M1「机制代码在核，操作对象 = 被开发项目」；一次声明多处读取，下游 M2–M9 从 manifest 取路径，不硬编码本仓 |
| KD-M1-2 | 整档缺失 = 拒，缺键 = fallback，两分不混 | 规格 ②.3 / ②.4 明示；整档缺失静默 fallback = 违「拒绝进入正常循环」前置门槛（架构 §2.3 E2） |
| KD-M1-3 | 写门落 `writeManifest` 的 `writer` 上下文（fail-closed 缺省拒） | 规格 ②.5 + AC-M1-5；机械可机判（非主 agent → 拒），符合架构 §2.3 E3「manifest 写门 = M1 读写装配」 |
| KD-M1-4 | 校验器输出结构化 `{ok, errors}`，不抛散文 | 可机判（N2）；下游读面与写门同用一处判据（单一权威源 D2——`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 D2） |
| KD-M1-6 | `docRoot` 值域 = 非空字符串 \| 非空字符串数组；**数组 = 该键的完整声明**（不与默认合并、不追加默认） | 一个文档层跨多根（core / cli / vsc 部分层）是实况（台账 #32）；合并默认会静默造出「意料之外的根」——静默正是本批要消灭的缺陷；与「缺键补默认」两分保持正交（缺键 ≠ 给数组） |
| KD-M1-7 | 非法形态（空串 / 空数组 / 数组含非串或空串元素 / 非串非数组）→ **校验拒**（不是静默跳过） | 静默跳过 = 评审根静默失踪（本批问题本体）；fail-closed 与 `phase` 枚举 / `version` 数值同族（N4）。**被拒替代**：只展开不校验（观察窗口后再收紧）——静默缺陷不可观测，而拒面成本仅一条 `errors`；拒后壳面文案明确（`make-agent.mjs:51-52` 同款） |
| KD-M1-8 | 判据单源：`isValidDocRootValue` / `docRootPaths` 落 M1（`manifest.mjs`），消费面一律经该谓词取值 | D2 单一权威源：校验与消费各写一遍必漂移（留「校验通过但消费不认」的缝）；**基数（项目根）同落此处** ⇒ 新消费点不可能重复 2026-09-17 的基数缺陷 |
| KD-M1-9 | 默认档五键**保持单串**（不改成数组） | 默认值 = 通用约定，数组 = 声明面扩展；改默认会改变所有未覆盖仓的行为（兼容面）——本批要求「既有仓零改即绿」 |
| KD-M1-10 | `activeBatch` **整链撤销**（字段 / 校验腿 / 咬合 helper / 冻结机检取值 / 情境行字段 / 数据档键），非降级、不保留「参考位」 | 2026-09-17 **用户裁定**方案 A：「这个必须完全撤销，不能存在。」三宗罪 = ① 单槽建模装不下并发（实况可多批同时在飞）② 咬合判据把并发判违规（「在途孤儿」= 常态）③ 冻结机检单点失效（字段一空即静默关灯）——批档 `docs/batches/2026-09-17-activebatch-repeal.md` §1.2 |
| KD-M1-11 | 旧档残留 `activeBatch` 键**不迁移、不报错**——`fillDefaults` 只搬已知键（读时收敛、回写自然清） | 与 `access` 裁撤同机制（AC-6 / T14）；写迁移脚本 = 给一次性动作造第二条写路径，违「写门唯一条」（KD-M1-3） |
| KD-M1-12 | 装配钩子加**工程模式门**（台账 #30）——判据 = **会话权威值**「恢复槽带 `engineering` 字段 ? 槽值 : `config.agent.engineering`」（槽优先 + config 回退；取值点三处见 §2.2）；普通会话 = **装配钩子零 manifest I/O**（不读 / 不拒 / 不建档）+ `agent.manifest = null` | manifest 是工程模式机制的状态账（下游 M2–M9），普通会话无消费方——无门实况 = 普通会话在非仓 cwd 启动被拒（用户可见「工程模式启动拒绝」）+ 仓内被自动建档（写用户没要的档）。被拒备选：① 保留读面、只去掉「拒 / 建档」分支（普通会话仍被非法档 fail-closed 拦，「不读」不成立）② 非仓拒降级为警告（E2 前置门槛被削）|
| KD-M1-13 | 钩子执行点 = **会话起点**（幂等重估，无状态位），非「进程启动一次」：CLI 两处（装配 + 启动恢复后）· VSC 每轮 reconcile；**装配期判据取槽值** = `bin` TUI 分支 `resumeSlot` 前移至装配之前 + 恢复记录经 `slotData` 形参进 `assembleAgent` | CLI 的工程模式权威值 = 会话槽（`thincoder-core/session.mjs:311-317`），装配期 `bin:306` 早于 `applySession:320` ⇒ 判据不取槽值则恢复的会话在装配期被误判（非仓仍抛 / 仓内仍建档；抛点早于 `applySession` ⇒ 重估点永不达——评审轮 1 🔴）。被拒备选：① **只在装配期判 `config.agent.engineering`**（该值此时 = config 初值 ≠ 会话权威值——`/eng` 只写槽不镜像 config：`cmd-eng.mjs:61-78`）② 在核 `applySession` 内挂钩（会话模块耦合 M1 装配面）③ 仿 VSC 改逐回合判（CLI「启动期拒绝」UX 退化为首回合报错） |
| KD-M1-14 | 台账 #33「二道防线」**补实现**（不收回声明）：`spawn-gates.mjs` 新常量 `MANIFEST_BASENAME = "project-manifest.json"` + 专用拒文案（**不入** `PROCESS_BASENAMES`） | 声明既立 = 契约（§2.1#3 / §2.5）：`files` 声明面是子代理写域的唯一机械闸（`tool-gates.mjs:93` / `dispatch.mjs:198` 消费已声明域），收回声明 = 子代理可把 manifest 声明为写域（唯一剩余闸退到写门调用期）。两族理由不同（过程档 = 父侧对账职责；manifest = 写门唯主 agent）⇒ 文案各异（并入 `PROCESS_BASENAMES` 会把尾句「改设计档」误导到 manifest 面）。**不 import `MANIFEST_REL`**：保本模块「叶子·零 import」性质（模块头注 `:9`）——字面量 + 指针注释（D2 单源在 `manifest.mjs`，此处为大小写归一后的匹配字面量）。拒文案稳定片段 = `/Manifest file/`（句首锚——§3.1 AC-18 / §3.2 T30 按它断言） |
| KD-M1-15 | 装配期槽值**读点 = 参数注入**（`bin` 既有 `resumeSlot` 调用前移 + `slotData` 形参），**不在 `attachManifest` 内调 `resumeSlot`** | 事实（评审轮 1 前提收正——「`resumeSlot` = 同进程纯读」不成立）：`scheduleSessionGC` + `claimSlot`（写 `slotSessions` / 翻共享 `active`）+ `writeEndMarker`（`thincoder-core/session.mjs:52-55` / `thincoder-core/session-slots.mjs:478-497`）。钩子内调用 ⇒ 每个走装配的命令（含 `thincoder chat` · ACP）都认领 / 分配槽并翻共享活跃指针 = 凭空会话写副作用（本批禁扩大面）。参数注入下 TUI 路径**零新增读点 / 零新增写**（同一调用前移），`chat` / ACP 无会话 ⇒ config 回退。被拒备选：钩子内直呼 `resumeSlot`（副作用如上）· 另建只读 peek（复刻 resume 决策 = 判据双源，违 D2） |
| KD-M1-16 | AC-14「不读」**退为可观测断言**（不抛 / 不建档 / `agent.manifest === null`）——不落 fs 读面探针 | 「未被读」在钩子面无机械可观测缝（`requireManifest` 非注入点）；附着 = 读面唯一可观察后果 ⇒ 三后果断言即等价判据。被拒备选：落 fs 读计数 seam（为一条措辞给生产代码加探针，成本 > 收益）；下游读面（任何模式照读）另见 §2.5「普通会话的读面边界」 |
| KD-M1-17 | 值变检测 = **mtime 门控重读**，落注入器（§2.6 ③b 取值前置步；判据序 ①–⑥ 零改）；**未变零重读** · **失败保守**（stat 失败 / 读抛错 / 读回非法 ⇒ 不更新、不清零、不抛；缓存不推进 ⇒ 下回合重试） | 批件实况：`agent.manifest` 刷新点全在会话起点 ⇒ CLI 会话内改档不生效（#34）。注入器是唯一**逐回合**触点，门控落此处可同时覆盖两端且不新增驱动源。被拒备选：① 每回合无条件重读（每次 read + 解析——「未变零重读」不成立）② 只靠装配钩子（会话起点——正是缺陷本体）③ `fs.watch` 长驻监听（句柄 / 生命周期 / 跨端差异成本）④ 档删 / 读回非法 ⇒ **清零 `agent.manifest`**（并入启动门槛语义）——运行期把「注入面降级」升级为「会话半死」（行消失 + 下游读面失值，如 M4 `resolveReviewTargetPaths` 回退默认档），且「拒进正常循环」是**会话起点**动作、运行期无「拒」的落点（§2.5「运行期失败退化 vs 启动门槛」） |
| KD-M1-18 | 档路径 = M1 新导出 `manifestFilePath(cwd)`（**单源**）——注入器不重写根解析式；读 / 写 / mtime 门控三处同源 | 「manifest 档在哪」与「项目根在哪」是**同一判据**（`.git` 纯向下）——注入器内自写一遍 = 判据双源（2026-09-17 基数缺陷同族）。被拒备选：① 注入器内联 `resolveProjectRoot(cwd) ?? resolve(cwd)`（双源）② 复用既有导出 `docRootBase`（名实不符——该符号名与文档义均指 `docRoot` 取值基数）③ 不解析根、`stat` 锚目录同名档（monorepo 锚在容器根时盯错档——当天实证过的基数缺陷） |
| KD-M1-19 | 缓存载体 = **per-agent** `agent._manifestMtime`；语义 = 「当前 `agent.manifest` 所对应的档 mtime」；未设 = 未观测（首回合读一次对齐）；失败不推进 | 状态与 `agent.manifest` 同生共死 ⇒ 语义自洽（缓存 = 值的来源指纹）；同族先例 `agent._slotMtime`（`thincoder-core/session-guard.mjs`）。被拒备选：① 模块级 `cwd` 键缓存（M1 面状态污染 + 多 agent 同 cwd 相撞——peer 的 cwd 键缓存只适用于纯函数结果）② 复用 `_slotMtime`（异档异义——会话档 mtime 与 manifest 档无关系） |
| KD-M1-20 | 入口决策树抽为 M1 新导出 `resolveEngineeringManifest`（**非抛错**形态）——三面共用（CLI 装配/重估 · VSC `hydrateRun` · **翻转面**） | 翻转面（先判后翻）与入口面（判+抛）各写一遍树 = 判据双源（KD-M1-8 同族）——`/eng` 与 `bin` 两处对「根不可解析」的判定必须同步演进，否则翻转能进、启动不能启（或反向）。被拒备选：① 翻转面直接 `try/catch` 包 `attachManifest`（靠异常字符串分词拿原因——文案一改即失配，且先写态后判的副作甩不掉）② 翻转面自己写一份判据（双源） |
| KD-M1-21 | 翻转面核序 = **先判后翻**（判据通过才写 `agent.config.agent.engineering` / 槽）；拒翻分支**零副作用** | 四条路径现状均先写态后返回（`cmd-eng.mjs:34` · `eng.mjs:71`）——判据若失败，模式已翻但无附着 ⇒ 正是 #41 本体；且 token 清理 / `_advisorRuns` 重置 / `ENG_ON_REMINDER` 入列不可撤回（回滚写 = 清得掉标志、清不掉已入列的提醒）。被拒备选：翻后回滚（副作用不可逆）|

| KD-M1-22 | **仓发现单源** = M1 新导出 `discoverRepos(cwd)`（结构化四态 + 候选全列）；`resolveProjectRoot` 退为其**薄包装**（零语义）；`git` 工具（`thincoder-core/tools/git.mjs` 的 `execute()` 头部单点）经该符号接线——**禁第二份发现实现** | 用户 2026-09-18 05:16 / 05:34 裁定「复用 manifest 的发现逻辑，**甚至共享代码**」+ D2（单一权威源）。消费面已 4 族（manifest 档路径 / `docRoot` 基数 / 台账项目根 / git 工具仓解析）——各写一遍必漂移（三态口径改一处、他处不知）。被拒备选：① `git` 工具内自写同式扫描（双源——用户点名的禁形）② 抽独立 `project-root.mjs`（结构更清但收益不足：4 个既有 import 点全要改 + 一条 re-export 别名面要守；本档已在 `SOFT_LINE_REGISTRY` 在册，增量小）③ 只导 `string\|null`（`none` / `ambiguous` 不可分——git 侧的「列候选 + 指 workdir」无从产出 ⇒ 只能猜或静默）。**机判落点** = `docs/core/design/TOOLS.md` §6.13 **A20**（源码面：同一导出 import 命中 ∧ `node:fs` 零命中——「禁第二份实现」的可判形） |

### 2.5 与既有纪律冲突核对

- **写门二道防线归属**：AC-M1-5「非主 agent 写 → 拒」的**机械主门** = 本模块 `writeManifest` 的 `writer` 闸；**二道防线** = M5 spawn 门 `files` 域排除 `PROJECT-MANIFEST.json`（子代理无法声明该路径为写域）。二道防线不在本模块实现，仅记录承接关系——与 M4 档 KD-M4-2「manifest 写门落 M1」同源（架构 §2.3 E3）。
  **实况（本批落地——台账 #33）**：`thincoder-core/agent-tools/spawn-gates.mjs` 常量 `MANIFEST_BASENAME` + `rejectEngineeringFilePaths` 分支（`files` 含该 basename——任意层 / 任意大小写 → 拒，专用文案）；用例 = 同目录 `test/spawn-gates.test.mjs` 新增一例（本档 §3.2 T30 同款判据——KD-M1-14）。
- **前置门槛的模式口径（本批 #30）**：E2「缺 manifest（整档）→ 拒进正常循环」= **工程模式会话**口径——普通会话**装配钩子**零 manifest I/O（不读 / 不拒 / 不建档；§2.2 模式门 + KD-M1-12），下游回退链不变（M4 `resolveReviewTargetPaths` 整档缺失 → `DEFAULT_MANIFEST.docRoot`）。
  **需求侧已同步（2026-09-18 父侧落笔·评审轮 1 发现 2 收正）**：`SPEC-MANIFEST.md` ②.3（`:15`）已带「工程模式会话」口径与拒自动建档分支 · AC-M1-2（`:32`）已带普通会话半句 · 二道防线已成专条 **AC-M1-8**（`:38`）——规格侧与设计侧同口径单源（原「待同步 / 缺位」注随本 fix 轮撤销；§4 变更记录同收正）。
- **普通会话的读面边界（评审轮 1 发现 4 收正；KD-M1-16）**：本批保证的范围 = **装配钩子面**（`attachManifest` / VSC `hydrateRun` 钩子块）。
  以下消费面**任何模式照读**（既有语义，本批零改）：写门 `thincoder-core/agent/write-gate.mjs:47`（经 `thincoder-core/agent-tools/advisor.mjs:122`）· 批次档第二基底 `thincoder-core/agent-tools/batch-segment.mjs:81` · 台账 `thincoder-core/ledger-db.mjs:31`（`resolveProjectRoot`）。模式分叉若要做 = 另批（本批不落）。

- **仓发现的第二消费者（本批——#62）**：manifest 面与 `git` 工具（`thincoder-core/tools/git.mjs` 的 `execute()` 头部）**共用** `discoverRepos`（KD-M1-22）——同判据、零第二份实现。
  发现面 = **纯 fs**（不读 manifest 内容 / 不查模式 / 不依赖 `agent`）⇒ 工程模式与普通会话**同判**（普通会话零行为变：「无 manifest 概念」的项目 ⇒ `none` ⇒ §6.12 的 fail-closed 现状）。
  既列消费面（`thincoder-core/agent/write-gate.mjs` · `thincoder-core/agent-tools/batch-segment.mjs` · `thincoder-core/ledger-db.mjs`）读面语义**零改**。

- **与 KDs 的关系（本批——#34）**：KD-M1-12（模式门）与 KD-M1-13（钩子执行点 = 会话起点）**零改**——本批只在「已附着」前提下把**值来源**从「装配期一次性读」扩为「每回合 mtime 门控重读」（§2.6 ③b；新增 KD-M1-17），**附着决策仍只在会话起点**。
  读取面新增开销 = 每回合一次**路径解析**（`manifestFilePath` → `resolveProjectRoot`：≥1 次 `existsSync`；无 `.git` 时含 `readdirSync` + 逐子目录 `existsSync`）+ 一次 `statSync`（值未变零重读）；该步居判据 ①②③ 之后 ⇒ 普通会话 / 深度 > 0 / 无附着三态均在 ③b 之前返回（零 I/O）——与上条「普通会话的读面边界」不冲突。
- **运行期失败退化 vs 启动门槛（本批——#34；口径两分）**：AC-M1-2 / KD-M1-2 的「整档缺失 → 拒进正常循环」= **会话起点**门槛（工程模式会话口径，见上条模式门）——判「能不能进循环」；
  ③b 的失败退化（档删 / 读回非法 ⇒ 不更新、不清零、不抛）是**运行期注入面**降级——判「这一回合出什么行」。运行期已附着会话不因档删 / 档非法被「退回门外」（「拒」在运行期无落点）：沿用上次已知好值 + 下回合自愈（缓存不推进 ⇒ 重试）；`readManifest` 的返回语义（`reason:'missing'` 仍 missing）与 E2 启动门槛零改。
- **会话起点（ACP 装载）**：**现行 = §2.8 F4**（`session/load` / `session/resume` 补重估行；判据单源化）。
- **进程内翻转**：`/eng` ON（`cmd-eng.mjs`）· `/session` 切槽（`cmd-session.mjs`）· 核心 `eng` 工具（`agent-tools/eng.mjs`）——**现行 = §2.8**（F2 判据表 / F3 明示面 / F5 边界 / F6 FR11 冲突登记）；拒翻裁定 = 批档 `docs/batches/2026-09-18-mode-propagation.md` §1.1。
- **schema 计数（五键）**：**设计侧一致**——架构 §2.2 M1 行 / §2.3 E1 JSON / 本档 §1.2 F1 / §2.2 接口四处均五键（`version` / `phase` / `docRoot` / `promptsLanding` / `checkConfig`；2026-09-17 activeBatch 裁撤批收正）；**规格侧已同步**（父侧 2026-09-17 落笔——`SPEC-MANIFEST.md` ②.1 五键 / ⑥ 墓志 / AC-M1-4 墓志 / AC-M1-6 收正 / ⑤ 下游枚举）；
  扩列同批收正 = `requirements/ENGINEERING-MODE-V2.md` 七处活体句（`:154`–`:156` / `:184`–`:185` / `:187` / `:399`）+ `SPEC-LEDGER.md`（三账 → 两账）+ `SPEC-MACHINE-CHECK.md` ②.5 墓志——三方链闭合。
- **键集**：`docRoot` 五子键集合 = `REVIEW_ROOT_KEYS`（`write-gate.mjs:33`）。
- **与 manifest 其余键零交集**：`phase` / `version` / `docRoot` / `promptsLanding` / `checkConfig` 五键的判据与取值零改（`docRoot` 值形态 = F7 既有面、`checkConfig` 的 `scanDirs` 数组形态是既有事实，本批不触）。
- **并发事实核对**：批次流水线**多批并行**是子系统自设常态（eng-coder 池 = 4 · 多实例共 cwd 的 peer 机制 · 阶段并行派单纪律）——本模块不再承载任何「当前批次」单值（撤字段即撤该建模）；在途性真值 = **批次档状态行**（M3 冻结门读它）。
- **需求侧锚已落**（2026-09-17 22:40 父侧落锚——F2 = Fixed）：值形态条目 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` ②.7（`:19`）+ AC-M1-7（`:37`，逐条判据 = 本档 §3.1 AC-7–AC-13）——三方链（需求源 → 档面 → 设计）闭合（详见 §2.7 末节）。

### 2.6 情境行注入（#28 定案 · #34 值变检测——架构 E5.1 的模块级契约）

**问题**：`phase` 的消费全在机制侧（本模块读面 + 两端装配钩子），模型侧零注入——模型级情境行为无从驱动。

**方案（就机制说清）**：

1. **行构造 = 纯函数** `manifestStateLine({ phase })`（`thincoder-core/agent/setup-reminders.mjs`，与 `envStateLine` 同族、可单测）：

   ```text
   [System reminder: project state: phase: <值> (discipline: <light|strict>).]
   ```

   - `discipline` 标签映射（判据单源 = 需求 v2 §9.1）：`initial-dev` → `light` · `production` → `strict`；未知值 → 无标签（只出值，不编判据）——行形 = `…phase: <值>.]`。
   - 行族前缀 `MANIFEST_LINE_PREFIX`（`[System reminder: project state: `）与行内容**解耦**（前缀零改——摘旧行 / 会话重建认领同用它）。

2. **推送 = 自愈单活体** `pushManifestStateReminder(agent, { depth = 0 } = {})` → `boolean`（同档）：

   | 序 | 判据 | 动作 |
   |---|---|---|
   | ① | `depth !== 0` | `false`（不注入） |
   | ② | `agent.config?.agent?.engineering !== true` | `false` |
   | ③ | `agent.manifest` 缺失（null / undefined） | `false` |
   | ③b | **取值前置步（本批新增——#34）**：数据档 mtime ≠ `agent._manifestMtime`（含缓存未设 = 首次观测）；`agent.cwd` 缺失 / stat 失败 ⇒ 跳过 | `readManifest` 重读：`ok:true` → 采纳（`agent.manifest` ← 新值 + 缓存 ← 观测值）；`ok:false` / 抛错 → **不更新、不清零、不抛**（沿用旧值，缓存不推进 ⇒ 下回合重试） |
   | ④ | `history` 已有同文 user 行（活体） | `false`（幂等——零历史变更） |
   | ⑤ | `agent._manifestLine` 存在且 ≠ 新行（值已变）；**缺失**时（会话重建——行随 `history` 回来、状态位不回来）先按行族前缀 `MANIFEST_LINE_PREFIX` 从 `history` 认领现存活体 | 就地 `splice` 摘旧行（`role === "user"` 全匹配），保 `history` 数组引用——不认领则旧行残留 + 新行入列 = 双活体（违本定案） |
   | ⑥ | 落新行 `{ role:"user", content: line, transient:true }` + 记 `agent._manifestLine = line` | `true` |

3. **取值 = mtime 门控重读（值变检测——#34）**：注入前（判据③ 之后、行构造之前）先 `stat` 数据档——路径取 `manifestFilePath(agent.cwd)`（项目根解析与读点同源，**非**「锚目录 + 档名」——monorepo 锚在容器根时两者不同）：

   - **mtime ≠ `agent._manifestMtime`**（含缓存未设 = 首次观测）：`readManifest(agent.cwd)` 重读 → `ok:true` ⇒ **采纳**（`agent.manifest` ← 新值 + `agent._manifestMtime` ← 本次观测值）。
   - **mtime 相等** ⇒ **跳过**（未变零重读——唯一新增开销 = 每回合一次**路径解析** + 一次 `statSync`；同款先例 = peer 提醒的 mtime 惰性缓存）。
     路径解析 = `manifestFilePath` → `resolveProjectRoot`（无缓存）：仓锚 `existsSync(.git)` 一次；无 `.git` 时含 `readdirSync` + 逐子目录 `existsSync`（`thincoder-core/manifest.mjs:44` / `:46-50`）——行为不变，仅口径收正。
   - **失败退化 = 保守**：stat 失败 / 读抛错 / 读回非法（`ok:false`）⇒ **不更新 `agent.manifest`、不清零、不抛**（注入绝不打断回合）——沿用上次已知好值；缓存不推进 ⇒ 下回合重试（自愈）。
     **与启动门槛两分**：本步失败只降级**注入面**（已附着会话不因运行期档删 / 档非法被「退回门外」）；AC-M1-2 / KD-M1-2 的「整档缺失 → 拒进正常循环」= **会话起点**门槛、`readManifest` 返回语义（`reason:'missing'` 仍 missing）零改——详见 §2.5「运行期失败退化 vs 启动门槛」条。
   - **缓存语义**：`agent._manifestMtime` = 「当前 `agent.manifest` 所对应的档 mtime」（per-agent 载体；同族先例 `agent._slotMtime`）；未设 = 未观测 ⇒ 首回合读一次对齐盘面——会话恢复后同理（值同 ⇒ 判据④ 命中，零历史变更）。
   - **与压缩生存零交互**：压缩吞行后的重推照旧走「④ 未命中 → ⑥」；**重读只由 mtime 变触发**（压缩不触发重读）。
   - **边界（如实登记）**：mtime 粒度内不被观测的替换（同毫秒二次写 / 保留 mtime 的整档替换）⇒ 该次值变延到下次档变；`agent.cwd` 缺失（无锚）⇒ 跳过本步（零 I/O，沿用内存值）——生产面 cwd 恒在（CLI 装配期设 · VSC 每 run 设）。

4. **接线两点**（逐回合注入组——CLI 同序）：
   - 核：`thincoder-core/agent/run-stages.mjs` `injectTurnReminders` 的 `depth === 0` 组内、`injectEngineeringReminder(agent)` 之后调用。
   - VSC：`thincoder-vscode/src/agent/setup-reminders.mjs` 转口 re-export 两符号；`thincoder-vscode/src/agent.mjs` 每回合组 `injectEngineeringReminder(agent)`（`:233`）之后调用。

5. **压缩生存 = 守卫自愈**（不落 system 槽——理由见架构 E5.1 #5）：压缩吞行后下一回合第 ④ 判据不命中 → 走 ⑥ 重推；**零触碰** `context.mjs` 压缩面。

6. **面纪律**：`transient:true` ⇒ 不进人读线（`_fullHistory`）；同文去重口径与 `pushInjections` `:87` 一致（`history.some`）。

**回指**：v2 §9.1（阶段 = 纪律强度档）+ 台账 #28。**需求侧锚已落**（2026-09-17 22:12 父侧落锚——F-1 = Fixed）：`SPEC-MANIFEST.md` ④ AC-M1-6（判据逐条 = 本档 §3.1 第二表 AC-N1–AC-N6、AC-N3b）——三方（需求源 → 档面 → 设计）一致闭合。

**本批（#34 值变检测）需求侧待同步（主 agent 域）**：`SPEC-MANIFEST.md` ④ AC-M1-6 的判据枚举（现 = 「AC-N1–AC-N6、AC-N3b」）需补本批 AC-N7 / AC-N7b / AC-N7c / AC-N7d。

### 2.7 `docRoot` 值形态：单串 | 多根数组（F7）

**问题（台账 #32）**：canonical 部分层（`docs/cli/**` · `docs/vsc/**`，2026-09-15 建）不在任何评审根内——部分层设计档（如 `docs/cli/design/TUI.md`）作为评审对象被 M6 分类拒（`Advisor: design review documents must be documentation files…`）。
根因 = `docRoot` 五键只承载**单路径**，而文档体系已是三部分（`core/` · `cli/` · `vsc/`）。

**值域（形态判据单一权威源 = `isValidDocRootValue`）**：

| 值 | 判 | 语义 |
|---|---|---|
| 非空字符串（`trim` 后非空） | ✅ | 单根——该键取此路径（既有形态，语义零变） |
| 非空数组、元素皆非空字符串（`trim` 后非空） | ✅ | 多根——该键取这些路径（**完整声明**：不与默认合并、不追加默认） |
| 空串 / 空白串 / 空数组 / 数组含非串 / 空串 / 空白串（`trim` 后为空）元素 / 非串非数组（数 / 对象 / `null`） | ❌ | 校验拒（`errors` 含 `docRoot.<键>`）——不静默跳过 |

**语义四条**：

1. **值形态决定语义**：串 = 取此路径；数组 = 取这些路径——数组是**完整声明面**（合并默认会静默造出「意料之外的根」，与本批要消灭的静默缺陷同族）。
2. **缺子键 = 补默认单串**（既有语义零变）：默认档五键**保持单串**（`DEFAULT_MANIFEST` 不改——默认 = 通用约定，数组 = 声明面扩展）。
3. **非法形态 = 拒**：`validateManifest` → `ok:false` → `readManifest` 返回 `reason:'invalid'` → 壳面拒进正常循环（`make-agent.mjs:51-52` 同款）；`writeManifest` 拒落盘——与 `phase` 枚举 / `version` 数值同族（fail-closed）。
4. **解析基数 = 项目根**（`docRootBase`，2026-09-17 修复在案不回退）：数组元素与单串同基数，逐元素解析。

**解析管线（`docRootPaths(value, cwd)`——全在 M1 一处）**：

```text
值 → 展开（串 / 数组统一成列表）→ 逐元素 trim + `\`→`/` 归一 → resolve(docRootBase(cwd), p) → 去重（保序）
```

**全消费面清单（本批 grep 实核——7 处，逐处给策略）**：

| # | 消费点 | 现语义 | 本批策略 |
|---|---|---|---|
| 1 | `thincoder-core/agent/write-gate.mjs:43-56` `resolveReviewTargetPaths`（M4） | 逐键 `typeof v === "string"` 取单值 | **改**：逐键 `docRootPaths(v, cwd)` 展开（跨键去重保留 `:55` 的 `Set`） |
| 2 | `thincoder-core/agent-tools/advisor.mjs:121-131`（M6 设计评审分类） | 消费已解析的绝对路径列表（`roots.some(...)`） | **零改**（分类判据与值形态无关） |
| 3 | `thincoder-core/agent-tools/batch-segment.mjs:80-86` `resolveBatchDocPath`（M3 第二基底） | 取 `docRoot.batches` 单值复判 | **改**：逐基底按序复判（首个可读者胜；全不可读 → `throw` 不变） |
| 4 | `scripts/doc-check.mjs` · `doc-check-anchors.mjs` · `doc-check-width.mjs`（M8） | 读 `checkConfig` / `MANIFEST_REL`（域发现） | **零改**（不读 `docRoot`） |
| 5 | `thincoder-cli/src/cli/make-agent.mjs:47-64` · `thincoder-vscode/src/agent/setup.mjs`（壳面装配钩子） | `requireManifest` / `initManifest` | **零改**（不取值形态） |
| 6 | `PROJECT-MANIFEST.json`（本仓数据档） | 五键单串 | **改**：`requirements` / `design` 各三根（core + cli + vsc）；`specs` / `modules` / `batches` 保持单串（部分层无此目录——不预造惰性根） |
| 7 | `thincoder-core/conventions.mjs` `isDocPath`（`agent-tools/verify.mjs:180` 等消费） | 文档分类 = conventions 面 | **零涉**（判据源不同——非 `docRoot`；本批不碰） |

**边界（本批不做）**：`REVIEW_ROOT_KEYS` 键集不变（只扩值形态）；不新增 manifest 键；不改默认档五键值形态；不纳入参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）；不改 M4 / M6 判据本体；不改 `readManifest` 整档回退语义——manifest 缺失 / 非法时 `resolveReviewTargetPaths` 仍回退 `DEFAULT_MANIFEST.docRoot`（既有行为零变，拒进正常循环由壳面 `requireManifest` 拦，本函数不重复拦）。

**需求侧锚已落**（2026-09-17 22:40 父侧落锚）：本批需求源 = 批次档 `2026-09-17-docroot-multiroot.md` §1.2（用户 2026-09-17 22:28 裁定）+ 台账 #32；档面锚 = `SPEC-MANIFEST.md` ②.7（`:19`）+ AC-M1-7（`:37`——逐条判据 = 本档 §3.1 AC-7–AC-13）——三方（需求源 → 档面 → 设计）一致闭合。

### 2.8 模式翻转族与装配钩子的重估（#41——拒翻语义）

**问题（台账 #41）**：装配钩子只在**会话起点**求值（KD-M1-13），而模式可在**会话中途**翻转——四条路径：
`/eng`（`thincoder-cli/src/tui/cmd-eng.mjs`）· `/session` 切槽（`thincoder-cli/src/tui/cmd-session.mjs`）· ACP 装载（`thincoder-cli/src/acp.mjs`）· 核心 `eng` 工具（`thincoder-core/agent-tools/eng.mjs`）。
后果两宗：① 翻转后**相位行静默**（判据③ `agent.manifest` 缺失）；② 该会话**不享 E2 启动门槛**（下次启动才重估）。四条路径现状 = 全零 manifest 面命中（本批实核）。

**F1 判据单源（本批动手的结构面）**：翻转面要「先判后翻」，入口面是「判 + 抛」——两者各写一遍决策树即判据双源（KD-M1-8 同族）。
故把决策树抽为 M1 新导出，三面共用：① CLI 装配 / 重估 ② VSC `hydrateRun` 钩子块 ③ **翻转面（本批新增）**。

**接口（`thincoder-core/manifest.mjs`——本批新增；非抛错形态，供翻转面使用）**：

```text
resolveEngineeringManifest(cwd, { writer = "subagent", init = true })
  ├─ 档合法        → { ok: true, manifest, created: false }
  ├─ 缺档 + init   → 根可解析 ? initManifest(cwd, { writer })（抛错 → { ok:false, code:"init-failed" }）
  │                          : { ok: false, code: "root-unresolvable", message }
  ├─ 缺档 + !init  → { ok: false, code: "missing" }（不拒——调用方自决）
  └─ 档非法        → { ok: false, code: "invalid", message, errors }
```

**两端入口钩子 = 薄包装（行为等价——零语义改，AC-19）**：CLI `attachManifest`（`thincoder-cli/src/cli/make-agent.mjs`）与 VSC 钩子块（`thincoder-vscode/src/agent/setup.mjs`）改为调用本函数——
`code` ∈ {`invalid` · `root-unresolvable` · `init-failed`} ⇒ 抛**原句**（逐字不变；§3.2 `T26` / `T27` 既有断言零改）；`ok:true` ⇒ 附着；`missing` ⇒ VSC `depth > 0` 分支沿用「不初始化」。

**F2 拒翻语义（父侧已裁——本批勘定的边界）**：翻转面走**同一张决策树**，且**先判后翻**（判据通过才写态）：

| 分支 | 入口门槛 | 翻转面（本批） |
|---|---|---|
| OFF 方向（ON→OFF）· 幂等 enter | 普通会话零 manifest I/O | **恒放行**——零 manifest I/O、**不改 `agent.manifest`**（四条路径 OFF 方向零改；清陈旧的点 = 会话起点钩子重调，不在翻转面） |
| 档合法 | 附着 | **放行** + 附着——判据通过 ⇒ `agent.manifest` ← 结果（翻转面唯一赋值点；相位行当回合起活） |
| 缺档 + 根可解析 | `initManifest` 建档 | **放行** + 就地建档 + 附着——判据通过 ⇒（**`writer:'main'`**）建档 + `agent.manifest` ← 结果（入口也不拒此分支——同语义） |
| 缺档 + 根不可解析 | 抛「工程模式启动拒绝」，**不建档** | **拒翻**（模式保持 OFF） |
| 档非法 | fail-closed 抛 | **拒翻**（模式保持 OFF） |

**F2 三条收正（设计评审轮 1 发现 2 / 发现 4——本批 fix 轮）**：
- **OFF 方向不改 `agent.manifest`**（发现 2——取「删括注」读法）：理由两条——
  ① 与四条路径编辑点「OFF 方向零改」一致（另立清点 = 给本批添一条无消费方的实施面）；
  ② 行为等价 = OFF 态**无** `agent.manifest` 消费者——注入器判据②（`thincoder-core/agent/setup-reminders.mjs:117`）先于判据③（`:118`）返回；
  其余 manifest 读面均**读盘**、不读 `agent.manifest`（`thincoder-core/agent/write-gate.mjs:50` · `thincoder-core/agent-tools/batch-segment.mjs:83`）；清陈旧的落点仍只有一处 = 会话起点钩子（KD-M1-12 / AC-17）。
- **放行分支「谁在何处赋值」**（发现 4①）：附着动作 = 翻转面**自己**赋值——`agent.manifest` ← 判据结果（`ok:true` 的 `manifest`），落点 = 四条路径各自的「先判后翻」块（入口钩子的附着点不变——AC-19 零语义）。
- **`writer` 一律显式传 `'main'`**（发现 4②）：接口缺省 `writer = "subagent"` 是写门的 fail-closed 缺省（KD-M1-3）——任何调用点误用缺省 ⇒「缺档 + 根可解析」退化为 `{ok:false, code:'init-failed'}`（**拒翻**），与 F2 / AC-20② 语义相反。生产调用点（入口薄包装两处 + 四条翻转路径）**全部显式传 `'main'`**；唯一闸 = `thincoder-core/manifest.mjs:249-251`（`writer !== "main"` → 抛）。

「**先判后翻**」是硬序：拒绝分支**不得**留下已翻转的态与已发生的副作用（token 清理 / `_advisorRuns` 重置 / `ENG_ON_REMINDER` 入列 / `_lastEngState`）——
四条路径现状全是**先写态后返回**（`cmd-eng.mjs:34` · `eng.mjs:71`），本批把判据提到写态之前。
**切槽族的额外一条（判据点必须前于 `switchToSlot`）**：`switchToSlot` 会写 manifest 活跃指针（`thincoder-core/session.mjs:472-487`）——若判据落在其后，拒翻就会留下「指针已切、会话未换」的半态，下次 `saveSession` 把旧会话写回目标槽（跨槽覆盖）。故 `/session` 的判据点 = `switchToSlot` 之前（`loadSlotFile` 纯读预读——无认领副作用，`session.mjs` 注释逐字在案）。

**F3 明示面（四处，各依既有通道——不新增通道）**：

| 路径 | 拒翻时 | 准翻时 |
|---|---|---|
| 核心 `eng` 工具 enter | 返回错误串（工具结果 = 明示面）：`Error: cannot enter engineering mode — <入口门槛原句> (mode unchanged)`；**零副作用** | 既有成功文案 + 端镜像提示（`mirrorNotice`） |
| `/eng`（CLI TUI） | `pushLine(<原因句>, C.warn)`；**不打 `pushLabel("❯ Eng")`**（标签 = 成功回显，拒时零标签——防假成功） | 既有标签 + 明细行 |
| `/session` 切槽 | 目标槽**合值**（§2.2 会话权威值「槽带 `engineering` 字段 ? 槽值 : `config.agent.engineering`」）`=== true` 时**先判后切**：判据取 `loadSlotFile` **纯读预读**（在 `switchToSlot` **之前**）——拒 ⇒ 切槽整体不发生（`switchToSlot` 与 `applySession` 均不调）+ `pushLine` 原因 | 既有切换 + `applySession` 之后一行附着 |
| ACP `session/load` / `session/resume` | 同款先判（判据同取**合值**；`loadSlotFile` 之后、`createSession` 之前）：拒 ⇒ 走既有 ACP 错误通道 `{error:{code,message}}`，不建会话 | 既有装载 + `applySession` 之后一行重估 |

**F3 触发条件口径（设计评审轮 1 发现 3——取「合值」读法）**：切槽 / ACP 两路的预判据触发条件 = **目标槽合值**（同 §2.2 会话权威值），不按槽字段本身判定。理由：遗留槽（无 `engineering` 字段）自工程会话切入时合值 = true（缺席保持内存值——`thincoder-core/session.mjs:314-317`）——按槽字段判定 ⇒ 预判据不触发、抛错落在 `applySession` 之后，AC-C「拒 ⇒ 切槽整体不发生」在该格不成立（正是父侧裁定 3 要消灭的半态面）。两处判据与 §2.2 模式门**同源**（D2）。

**F4 ACP 装配期判据（同族第二半）**：`session/new` 无会话记录（KD-M1-15「无会话 ⇒ config 回退」）⇒ 现状即正确，**零改**；
`session/load` / `session/resume` 的装配期在 `applySession` **之前**（`acp.mjs:236` / `:286`）⇒ 装配期取 config 回退，装载后由 F3 的重估行订正——与 `bin` 的两点式（装配 + 恢复后重估）**同形**。

**F5 不受阻的内态（边界）**：

- OFF 方向恒放行；幂等 enter（已 ON 再 enter）零门（`eng.mjs:68-70` 既有 early-return 保留）。
- 非工程模式会话的一切（槽切到普通会话 / 普通会话启动）：零 manifest I/O。
- 子代理面：`eng` 工具不挂子代理工具表（depth-0 段——`thincoder-core/agent/family-tools.mjs:139-148`；核工具本体 `thincoder-core/agent-tools/eng.mjs:37-88`）⇒ 翻转族**结构上不可达**；子代理的装配钩子仍走「不初始化」。
- 拒翻时**不发生**者（不是「不受阻」而是「不触发」）：token 清理 / `_advisorRuns` 重置 / `ENG_ON_REMINDER` 入列 / 槽写 / config 镜像写。

**F6 FR11 口径（已收正——需求侧 2026-09-18 落笔；设计评审轮 1 发现 1 收正）**：口径**单源** = `docs/core/requirements/PORTABILITY.md:62`——FR11 收正文本：「无前提」限定为**不要求已退役概念文件 / 产品流程文件**；仓根锚（git）= E2 既有入口前提（非本收正新增）；非锚 cwd 上 `/eng` = fail-closed 拒翻 + 明示原因。本处只挂指针，不复述口径（D2）。
本档按**父侧裁定**（批档 `docs/batches/2026-09-18-mode-propagation.md` §1.1；同档 §1.5 裁定 1「接受收正，已落 `PORTABILITY.md:62`」）落笔为**拒翻**——与需求侧同口径，**无待收正项**。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | `phase` 取值非法 → 校验拒 | AC-M1-1 | ✅ 构造非法枚举 → `validateManifest` 返回 `ok:false` |
| AC-2 | 整档缺失 → 拒绝进入正常循环（不静默 fallback） | AC-M1-2 | ✅ 删 manifest → `readManifest` 返回 `reason:'missing'` + 壳面拒 |
| AC-3 | `docRoot` 缺键 → 用默认值（不拒） | AC-M1-3 | ✅ 删某键（含 `docRoot` 子键）→ `readManifest` 补默认值 + `missingKeys` 含该键路径 |
| AC-5 | 非主 agent 写 manifest → 拒 | AC-M1-5 | ✅ `writeManifest(..., {writer:'subagent'})`（或缺省）→ 拒；`initManifest(..., {writer:'subagent'})`（或缺省）→ 拒（同一闸） |
| AC-6 | **去键兼容**（已删键——旧档残留键不炸；现含 `access` · `activeBatch` 两键） | AC-M1-3（缺键 fallback 同族） | ✅ 档含 `"access":"from-zero"` + `"activeBatch":"<批次档相对路径>"` 其余合法 → `readManifest` `ok:true`、`errors` 空、返回 manifest **无两键**（`fillDefaults` 只搬已知键）；`writeManifest` 回写自然收敛 |
| AC-7 | **单串零变**：`docRoot` 各键单串语义与解析结果同改造前（既有档零改即绿） | 批次档 §1.2 / F7 | ✅ 既有两测试档**零改全绿** + 新档单串用例（`resolveReviewTargetPaths` 含该根） |
| AC-8 | **数组展开**：数组值 → 逐元素展开为多根，基数 = 项目根，顺序 = 声明序 | 批次档 §1.2 / F7 | ✅ 声明 `["docs/a","docs/b"]` → 返回集合含 `<项目根>/docs/a` · `<项目根>/docs/b` |
| AC-9 | **去重**：键内重复 / 跨键同值 → 集合中恰一次（保序） | F7 | ✅ 同值重复声明 → 结果长度 = 唯一值数 |
| AC-10 | **补默认且不合并**：缺子键 → 补默认**单串**；给数组 → 原样保留（默认不追加） | AC-M1-3 / F7 | ✅ `readManifest` 后：缺键 = 默认串；给数组 = 该数组原值（不含默认路径） |
| AC-11 | **非法形态拒**：空串 / 空白串 / 空数组 / 数组含非串 / 空串 / 空白串（`trim` 后为空）元素 / 非串非数组 → 校验拒 | F7 / KD-M1-7 | ✅ `validateManifest` `ok:false` + `errors` 含 `docRoot.<键>`；`readManifest` `reason:'invalid'`；`writeManifest` 拒落盘 |
| AC-12 | **消费面兼容（M3 第二基底）**：数组 `docRoot.batches` → 逐基底按序复判 | F7 / §2.7 消费面 #3 | ✅ 第二基底 = 数组第 2 项命中 → 返回该路径；全部不可读 → `throw`（fail-closed 不变） |
| AC-13 | **端到端（本仓）**：本仓数据档声明后，部分层设计档入评审根 | 批次档 §1.2 / §1.5 下游指针 | ✅ `resolveReviewTargetPaths({ cwd: <本仓根> })` 含 `docs/cli/design` · `docs/vsc/design` · `docs/cli/requirements` · `docs/vsc/requirements`（部分层设计档可点火） |

**注入面（#28——回指 v2 §9.1 + 台账 #28；规格 AC 待补见 §2.6）**：

| # | 验收标准 | 可机判 |
|---|---|---|
| AC-N1 | 行形逐字：`manifestStateLine` 三态（`initial-dev` · `production` · 未知值）输出与 §2.6 逐字行形一致 | ✅ 纯函数断言（两 `phase` 值各带 `discipline: light` / `strict`；未知值 → 无标签、只出值） |
| AC-N2 | 幂等：同值重调 `pushManifestStateReminder` → `false`，且 history 长度不变 | ✅ 同 agent 连调两次 |
| AC-N3 | 单活体：值变后 history 中该前缀行恰 1 条（旧文零命中） | ✅ `initial-dev` 推 → 切 `production` 再推 → 过滤计数 = 1 |
| AC-N3b | 单活体（会话重建）：`history` 带旧行而 `_manifestLine` 缺失（跨会话——状态位不随历史回来）→ 值变后该前缀行仍恰 1 条（认领步） | ✅ 预置旧行（`transient` 机器行）+ 改 `agent.manifest.phase` → 推 → 该前缀行过滤计数 = 1（用例 = `thincoder-core/test/setup-reminders.test.mjs` `AC-N3b`，落点以用例名为准） |
| AC-N4 | 压缩自愈：行被移除（模拟压缩吞咽）后下一回合重推 | ✅ 摘行 → 再调 → 返回 `true` + 行回来 |
| AC-N5 | 门控：`depth !== 0` / 非工程模式 / `agent.manifest` 缺失 → `false` 且零注入 | ✅ 三态各一断言（history 长度不变） |
| AC-N6 | 面纪律：注入行 `transient === true`；人读线零新增 | ✅ 行字段断言 + `_fullHistory` 长度不变 |
| AC-N7 | **值变重推（盘面驱动——#34）**：工程模式 + depth-0 + 有锚会话内，盘上 `phase` 变（mtime 推进）⇒ **下一回合情境行 = 新值**（旧行被摘、该前缀恰 1 条） | ✅ 临时项目根夹具（真实数据档 + `utimesSync` 推进 mtime）→ 推 → 断言新行 + 单活体（**先红**：实现前该用例必红） |
| AC-N7b | **未变零重读**：mtime 未变 ⇒ 不重读（沿用内存值——内容变而 mtime 未推进 ⇒ 行不变） | ✅ 首推后「改内容 + mtime 复位」→ 再推 → `false` + 行不变 |
| AC-N7c | **失败退化（保守）**：stat 失败（档删）/ 读回非法 ⇒ 不抛、不更新、不清零（沿用上次已知值）；档改回合法后重推可采纳（自愈）；**口径 = 运行期注入面降级，与 E2 启动门槛两分**（§2.5；`readManifest` 返回语义零改） | ✅ 删档 → 再推（不抛 + 行不变）；写非法 JSON（mtime 推进）→ 再推；改回合法（mtime 再推进）→ 再推（采纳） |
| AC-N7d | **首次观测对齐**：缓存未设（首回合 / 会话恢复后）⇒ 读一次并对齐盘面值 | ✅ 内存档 `initial-dev` + 盘上 `production` → 首推 → 行 = `production` |

**装配钩子模式门 / 二道防线（本批——回指台账 #30 / #33）**：

| # | 验收标准 | 回指 | 可机判 |
|---|---|---|---|
| AC-14 | **普通会话（装配钩子面）零 manifest I/O**：会话权威值 `engineering !== true` + **四格矩阵**（仓内 / 非仓 × 有档 / 无档）→ ① 仓内 + 有档：不附着 ② 仓内 + 无档：**不建档**（批档 `:11` 第二症状直测）③ 非仓 + 无档：不抛 ④ 非仓 + 有档：不抛、档未被改 | 台账 #30 · AC-M1-2 | ✅ `attachManifest` 直调（四格逐格：`agent.manifest === null` + 档存在性断言）+ CLI 子进程（非仓 cwd + normal → 退出码 0、stderr 无「工程模式启动拒绝」） |
| AC-15 | **工程模式四态同今日**：① 档合法 → 附着 ② 缺档 + 根可解析 → `initManifest(writer:'main')` 建档（内容 = `DEFAULT_MANIFEST`）③ 缺档 + 根不可解析 → throw「工程模式启动拒绝」且**不自动建档**（`85a4a6b3`）④ 档非法 → throw fail-closed | AC-M1-2 / 实况 `85a4a6b3` | ✅ 四态各一用例（②断言档生成；③断言档未生成） |
| AC-16 | **判据值 = 会话权威值（两向）**：① 装配期**槽真 config 假**（`slotData.engineering === true` + config false）→ 按槽判（仓内合法档 → 附着；缺档 / 非仓 → 按 AC-15 ②③ 处置）② 装配期**槽假 config 真**（`engineering: false` + config `true`）→ 非仓 cwd 不抛 + 仓内无档不建档（评审轮 1 🔴 直测）③ 重估点（`applySession` 之后）值与装配期同 ⇒ 幂等 | 台账 #30 · KD-M1-12 / M1-13 / M1-15 | ✅ 行为面：`attachManifest` 直调（②两 cwd 夹具）+ 重估幂等（重调后 `agent.manifest` 不变）；接线面：`bin/thincoder.mjs` 源码锁——`resumeSlot` 在 `assembleAgent` 之前且记录入 `slotData`、重估点在 `applySession` 之后（`acp-channel.test.mjs:275` 同法） |
| AC-17 | **翻转清陈旧**：工程模式（已附着）→ 置普通 → 重调后 `agent.manifest === null` | KD-M1-12 | ✅ 用例：先工程 → 置 false → 重调 |
| AC-18 | **二道防线落地**：工程 spawn `files` 含 `PROJECT-MANIFEST.json`（任意层 / 任意大小写）→ 拒，**文案含稳定片段 `/Manifest file/`**（句首锚——沿用既有锚法 `spawn-gates.test.mjs:92-98`）；`changelog.md` 既有拒行为与文案**逐字不变** | 台账 #33 · **AC-M1-8**（主门回指 AC-M1-5） | ✅ `rejectEngineeringFilePaths` 变体逐例断言（按 `/Manifest file/`）+ `normalizeFileList` 通道 + 既有 CHANGELOG 用例零改全绿 |
| AC-19 | **入口钩子薄包装行为等价（#41）**：CLI `attachManifest` 与 VSC `hydrateRun` 钩子块改为调 `resolveEngineeringManifest` 后，既有四条出口（附着 / 建档 / 根不可解析抛 / 档非法抛）的**结果与文案逐字不变** | 台账 #41 · KD-M1-20 | ✅ 既有测试档**零改全绿**（`thincoder-cli/test/make-agent-manifest-gate.test.mjs` 的 AC-14/AC-15/AC-16/AC-17 组 + `thincoder-vscode/test/setup-reminders.test.mjs` 模式门用例）+ `T26`/`T27` 文案断言不动 |
| AC-20 | **拒翻四态 + 先判后翻零副作用（#41）**：① 档合法 → 放行 + 附着（`agent.manifest` 非 null；= `agent.manifest ← 结果`） ② 缺档 + 根可解析 → 放行 + 就地建档（经 **`writer:'main'`**——漏传即 `init-failed` 拒翻，见 T38 反证格）+ 附着 ③ 缺档 + 根不可解析 → **拒翻**（模式仍 OFF、`agent.manifest` 仍 null、`_pendingReminders` 零新增、`_advisorRuns` 未被重置） ④ 档非法 → 同 ③ | 台账 #41 · KD-M1-21 · §2.8 F2 | ✅ 核心 `eng` 工具直调（四态各一例：断言 `config.agent.engineering` 与 `_pendingReminders.length` 与返回文案）；CLI `/eng` 子进程/直调同四态 + 标签行零发；/session 与 ACP 两路先判（拒时 `applySession` 零调用） |
| AC-21 | **仓发现四态结构化 + 零语义回归（#62）**：`discoverRepos(cwd)` 四态各归其位（`self` / `unique` / `none` / `ambiguous`）；`candidates` **全列且按名排序**（`self` / `none` ⇒ `[]`）；`resolveProjectRoot` 四态输出与批前**逐字同**（① ② ⇒ 路径；③ ④ ⇒ `null`） | 台账 #62 · AC-M1-2（根不可解析口径） | ✅ 真判据夹具（tmp 自建 `.git` + `PROJECT-MANIFEST.json`——同 T-F9 法）：四态逐态断 `kind` / `root` / `candidates`；同夹具对 `resolveProjectRoot` 逐态对（T41 / T42） |

> AC-14 判据口径（评审轮 1 发现 4——KD-M1-16）：「未被读」无机械可观测缝 ⇒ 退为**可观测断言**（不抛 / 不建档 / `agent.manifest === null`）；下游仍读盘的消费面不在本 AC 范围（§2.5「普通会话的读面边界」）。

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：整档存在且合法 | 五键齐全 | `readManifest` 返回 `ok:true`，manifest 完整 |
| T2 | 正常：初始化 | manifest 缺失 + `initManifest(cwd, { writer: 'main' })` | 写默认五键档，返回默认 manifest |
| T3 | 边界：缺 `docRoot` 键 | manifest 缺 `docRoot` | `ok:true` + 补默认 `docRoot` + `missingKeys` 含 `docRoot` |
| T3b | 边界：`docRoot` 子键缺 | manifest 有 `docRoot` 但缺其一子键（如 `specs`） | `ok:true` + 补该子键默认值 + `missingKeys` 含子键路径 |
| T5 | 错误：整档缺失 | 无 `PROJECT-MANIFEST.json` | `readManifest` 返回 `reason:'missing'`，不 fallback |
| T7 | 错误：非主 agent 写 | `writeManifest(..., {writer:'subagent'})` / `initManifest(..., {writer:'subagent'})` | 拒（fail-closed） |
| T8 | 正常：情境行落线 | 工程模式 + depth-0 + manifest `{phase:"initial-dev"}` | 恰一行 `[System reminder: project state: phase: initial-dev (discipline: light).]`；`transient:true` |
| T9 | 边界：幂等 | 同 agent 连调两次（值不变） | 第二次 `false`，history 长度不变 |
| T10 | 边界：值变单活体 | 先 `phase:"initial-dev"` 推，再置 `phase:"production"` 推 | 旧行被摘、恰一行新行（`history` 数组引用不变） |
| T11 | 边界：压缩吞行 | 推后从 history 移除该行 | 下一回合重推（`true`，行回来） |
| T12 | 边界：子代理深度 | `depth:1` | `false`，零注入 |
| T13 | 边界：非工程模式 / 无 manifest | `engineering:false` 或 `agent.manifest` 缺失 | `false`，零注入 |
| T14 | 边界：旧档残留已删键 | 档含 `"access":"from-zero"` + `"activeBatch":"<批次档相对路径>"` 其余合法 | `readManifest` `ok:true`；返回 manifest 无两键（AC-6） |
| T15 | 正常：单串兼容 | `docRoot.design = "docs/core/design"` | 解析含该根一条；`validateManifest` `ok:true`（AC-7） |
| T16 | 正常：多根数组 | `docRoot.design = ["docs/core/design","docs/cli/design","docs/vsc/design"]` | 解析含三根（顺序 = 声明序）（AC-8） |
| T17 | 边界：去重 | 数组内重复项 / `design` 与 `modules` 同值 | 结果集合去重后恰一次（保序）（AC-9） |
| T18 | 边界：归一 | 元素带 `\` / 首尾空白 | 归一后可解析命中同一根（AC-8） |
| T19 | 边界：补默认 / 不合并 | `docRoot` 缺 `specs`；`design` 给数组 | `specs` = 默认单串；`design` = 原数组（不含默认 `docs/design`）（AC-10） |
| T20 | 错误：非法形态（含空白串元素） | `""` / `"  "` / `[]` / `["a", 42]` / `["a", " "]` / `123` / `{}` / `null` | `validateManifest` `ok:false`（`errors` 含 `docRoot.<键>`）（AC-11） |
| T21 | 错误：多基底全不可读 | `docRoot.batches = ["no1","no2"]` 且两基底均不可读 | `resolveBatchDocPath` `throw`（fail-closed 不变）（AC-12） |
| T22 | 端到端：本仓部分层入根 | 本仓 `PROJECT-MANIFEST.json`（三根数组） | `docs/cli/design/TUI.md` 过评审根分类（AC-13） |
| T23 | 正常：**普通会话 + 非仓 cwd**（#30 回归） | `engineering:false` + cwd 非仓 ∧ 无档（AC-14 格③） | 不抛；`agent.manifest === null`；`PROJECT-MANIFEST.json` 不存在 |
| T24 | 边界：普通会话 + 仓内有合法档 | `engineering:false` + 仓根含合法档（格①） | 不附着：`agent.manifest === null`；档未被改（AC-14） |
| T24b | 边界：**普通会话 + 仓内无档**（批档 `:11` 第二症状直测） | `engineering:false` + 仓根无档（格②） | **不建档**（`PROJECT-MANIFEST.json` 不存在）+ `agent.manifest === null`（AC-14） |
| T24c | 边界：普通会话 + 非仓 cwd 有档 | `engineering:false` + cwd 非仓 ∧ 档在（格④） | 不抛；`agent.manifest === null`；档内容不变（AC-14） |
| T25 | 正常：工程模式 + 仓内缺档 | `engineering:true` + 仓根无档 | 建档（= `DEFAULT_MANIFEST`）+ `agent.manifest` 附着（AC-15①②） |
| T26 | 错误：工程模式 + 非仓 cwd | `engineering:true` + 非仓 cwd（根不可解析） | throw `/工程模式启动拒绝/`；档**未**生成（AC-15③） |
| T27 | 错误：工程模式 + 档非法 | `engineering:true` + 非法 JSON / 非法枚举值 | throw（fail-closed——文案同今日）（AC-15④） |
| T28 | 正常：装配期判据取槽值（**槽真 config 假**） | `attachManifest(agent, { cwd: 仓根有档, slotData: { engineering: true } })`，agent config `engineering:false` | 装配期即附着（`agent.manifest` 非 null）（AC-16①） |
| T28b | 正常：装配期判据取槽值（**槽假 config 真**）——非仓 | `slotData: { engineering: false }` + 非仓 cwd + agent config `engineering:true` | 不抛；`agent.manifest === null`（AC-16②） |
| T28c | 边界：同上——仓内无档 | 同上（cwd = 仓根、无档） | 档**未**生成（AC-16②） |
| T28d | 边界：重估点幂等（值同 ⇒ 无副作用） | 装配后置 config 与槽同值 → 重调 `attachManifest(agent)` | `agent.manifest` 不变；零新写（AC-16③） |
| T29 | 边界：翻转清陈旧 | 工程模式已附着 → 置 `engineering:false` → 重调 | `agent.manifest === null`（AC-17） |
| T30 | 错误：#33 files 声明面 | `["PROJECT-MANIFEST.json"]` / `["sub/project-manifest.JSON"]` / `["CHANGELOG.md","PROJECT-MANIFEST.json"]` | 拒，文案含 `/Manifest file/`（混合例两条文案齐：`/Manifest file/` + `/Parent-side maintained file/`）（AC-18） |
| T31 | 端到端：CLI 非仓 normal 启动 | 子进程 `chat "hello"`（伪 HOME + 非仓 cwd + mock 端点；config 无 `agent.engineering`） | 退出码 0；stderr 无「工程模式启动拒绝」（AC-14） |
| T32 | 正常：**值变重推（盘面驱动——#34）** | 临时项目根 + 真实数据档（`initial-dev`）+ 工程 agent（cwd = 该根）；推 → 改盘上 `production`（mtime 推进）→ 再推 | 第二次 `true`；行 = `phase: production (discipline: strict)`；该前缀恰 1 条（AC-N7——**先红**） |
| T33 | 边界：首次观测对齐（缓存未设） | 内存档 `initial-dev` + 盘上 `production` | 首推即 `production`（读一次对齐）（AC-N7d） |
| T34 | 边界：未变零重读（mtime 未推进） | 首推后：改档内容 + `utimesSync` 复位 mtime → 再推 | `false`；行不变（未重读）（AC-N7b） |
| T35 | 错误：stat 失败（档被删） | 首推后删档 → 再推 | 不抛；行不变（沿用已知值）（AC-N7c） |
| T36 | 错误：读回非法 → 保守；修好 → 自愈 | 首推后写非法 JSON（mtime 推进）→ 再推；改回合法（mtime 再推进）→ 再推 | 前 `false`、不抛、行不变；后 `true`、行更新（AC-N7c） |
| T37 | 正常：翻转准入（合法档） | 工程未开 + 仓根合法档 → `eng` 工具 enter | 放行：`engineering === true`、`agent.manifest` 非 null；返回文案 = 既有成功文案（AC-20①） |
| T38 | 正常：翻转建档（缺档 + 根可解析） | 工程未开 + 仓根无档 → enter | 放行：档生成（= `DEFAULT_MANIFEST`）+ 附着（AC-20②）；**反证格**：同场景按缺省 `writer`（`'subagent'`）调 `resolveEngineeringManifest` ⇒ `{ok:false, code:'init-failed'}` + 档未生成——调用点漏传 `writer:'main'` 即可机判 |
| T39 | 错误：**拒翻**（根不可解析 / 档非法两格） | 非仓 cwd、子仓带 manifest 不恰好一个 → enter；档非法 JSON → enter | 两格均拒：`engineering` 仍 false、`agent.manifest` 仍 null、`_pendingReminders` 长度不变、工具返回含原因句（AC-20③④） |
| T40 | 边界：**先判后翻零副作用** | 拒翻格（同 T39）后检查内态 | `_advisorRuns` 未被重置、`_lastEngState` 未改、槽 / config.json 未被写（AC-20——**先红**：实现前必红） |
| T41 | 正常 / 边界：仓发现四态 | tmp 夹具（同 T-F9 法——真 `.git` 目录 + `PROJECT-MANIFEST.json` 档）：① 锚自建 `.git` ② 容器 + 唯一带 manifest 子仓 ③ 容器空 ④ 容器 + 两带 manifest 子仓 | ① `self`（`root` = 锚、`candidates` = `[]`）② `unique`（`root` = 子仓、`candidates` = `[子仓]`）③ `none`（`root` = `null`、`candidates` = `[]`）④ `ambiguous`（`root` = `null`、`candidates` = 两候选按名排序）（AC-21） |
| T42 | 边界：**零语义回归**（`resolveProjectRoot` ≡ 批前） | 同 T41 四态夹具 | ①② ⇒ 路径；③④ ⇒ `null`——与 T-F9 同判据；既有 T-F9 **零改**即回归守卫（AC-21） |

## 4. 变更记录

- 2026-09-19（**仓发现复用批 · 复核与补投轮 · eng-designer**——承 `docs/batches/2026-09-18-repo-discovery.md` §2.9）：
  ① **KD-M1-22 补机判指针**——「禁第二份发现实现」的机判落点 = `docs/core/design/TOOLS.md` §6.13 **A20**（源码面：同一导出 import 命中 ∧ `node:fs` 零命中）；② **§2.3 行 13 行数刷新** 318 → **319**（as-of 2026-09-19 实测；增量估不变）。**零新语义**。

- 2026-09-18（**仓发现复用批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-repo-discovery.md` §1 · 用户 2026-09-18 05:16 / 05:34 两次定向）：
  ① **§2.2 + 新导出 `discoverRepos(cwd)`**（四态结构化 `self` / `unique` / `none` / `ambiguous` + `candidates` 按名排序）；`resolveProjectRoot` 退为其**薄包装**（零语义）——仓发现**单源**（KD-M1-22；消费者 4 族，含 `git` 工具解析面）。
  ② **§2.3 + 行 13**（`thincoder-core/manifest.mjs`）· **§2.4 + KD-M1-22**（含被拒备选）· **§2.5 + 「仓发现的第二消费者」条**（两模式同判 / 既有消费面零行为变）。
  ③ **§3.1 + AC-21** · **§3.2 + T41 / T42**（四态 + 零语义回归）；git 侧判据 A14–A19 住 `docs/core/design/TOOLS.md` §6.13。
  ④ **需求侧待补（主 agent 域）**：`docs/core/requirements/TOOLS.md` 缺 `git` 工具 cwd / workdir / 仓发现的判据行——本批以台账 #62 承载，建议补条目并回指 A14–A19。

- 2026-09-18（**模式联动批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 `docs/batches/2026-09-18-mode-propagation.md` §3 发现 1–10，**父侧逐条裁定接受**）：
  ① **发现 1（FR11 状态）**——§2.8 F6 + §4 本条改指**已落收正**（`PORTABILITY.md:62` 收正文 + 批档 §1.5 裁定 1）；口径单源 = 需求档该行（本档只挂指针——D2）。
  ② **发现 2（OFF 方向清陈旧两读）**——F2 表 OFF 行改「**不改 `agent.manifest`**」+ 表下新增「F2 三条收正」首条（取「删括注」读法：与四条路径「零改」一致 + OFF 态无消费者——附注入器判据序与两处读盘证据）。
  ③ **发现 3（预判据触发条件）**——F3 表 `/session` · ACP 两行改**合值**（§2.2 会话权威值）；表下补「F3 触发条件口径」条（遗留槽格 + 父侧裁定 3 要消灭的半态面）。
  ④ **发现 4（放行分支两处缺）**——F2 表放行两行补**附着动作**（`agent.manifest` ← 结果）+ **`writer:'main'`**；表下「F2 三条收正」第二 / 三条展开（含误用缺省 ⇒ `init-failed` 的反证语义）；AC-20② 补 writer 判据；T38 补**反证格**。
  ⑤ **发现 10（坐标同锚）**——§2.2 VSC 钩子块坐标 `:375-391` → `:371-396`（模式门 `:378-396`；as-of 2026-09-18 02:2x 实读）。
  零新语义 / 零新范围：仅落评审席发现与父侧逐条裁定的直接导出项（拒翻裁定 · 先判后翻核序 · KD-M1-20 / M1-21 · AC-19 零改 · AC-20 结论零改——② 补 writer 实现要件）。

- 2026-09-18（**重估点批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 `docs/batches/2026-09-18-manifest-refresh.md` §3 发现 #2 / #3 / #5 / #6，**父侧逐条裁定接受**）：
  ① **#2（行 11 编辑点）**——写明取值消费改点（行构造改取 `agent.manifest.phase`；`:83` 局部捕获删除 = Δ「−1」落点）+ 两条新 import 列出（`node:fs` `statSync` · `../manifest.mjs` `manifestFilePath, readManifest`）。
  ② **#3（运行期失败退化 vs 启动门槛）**——§2.5 新增专条 + §2.6 条 3 失败退化 bullet 补口径 + KD-M1-17 补被拒备选 ④（清零被拒）；AC-N7c 补口径指针。
  ③ **#5（成本句）**——`statSync` 前补一次路径解析（≥1 次 `existsSync`；无 `.git` 时 `readdirSync` + 逐子目录 `existsSync`）；§2.6 条 3 + §2.5 两处同载收正。
  ④ **#6（Δ 与表下句）**——行 10 Δ 收正「+~6 / −2（净 ~+4）」+ 表下句改按档列增量后行数（≈262 · ~189 · ~201）。零新语义 / 零新范围（③b 语义 · KD 结论 · AC / 用例结论零改）。

- 2026-09-18（**模式联动批 · #41 翻转重估** · eng-designer——承批档 `docs/batches/2026-09-18-mode-propagation.md` §1.1 · **父侧 2026-09-18 01:43 裁定「同批，现在做」+ 语义已裁 = 拒翻（fail-closed，与入口门槛同语义）+ 明示原因**）：
  新增 **§2.8**（F1 判据单源 · F2 拒翻判据表 · F3 明示面四处 · F4 ACP 装配期判据 · F5 不受阻内态 · F6 FR11 冲突登记）；§2.2 接口表加 M1 新导出 `resolveEngineeringManifest`（非抛错形态）+ ① 「本批不做」句改为已落定；
  §2.5 两条登记（会话起点 / 进程内翻转）由「待裁」转为已落定并指回 §2.8；§2.4 新增 KD-M1-20（判据单源）/ KD-M1-21（先判后翻）；§3.1 新增 AC-19 / AC-20；§3.2 新增 T37–T40。
  **需求侧（已落）**：FR11 口径**已收正**（`docs/core/requirements/PORTABILITY.md:62` 收正文 + 批档 §1.5 裁定 1；§2.8 F6 已改指该行——**无待收正项**）；`SPEC-MANIFEST.md` 需补 #41 的 AC 锚（主 agent 域，父侧债务）。

- 2026-09-18（**重估点批 · #34 情境行值变重推** · eng-designer——承批档 `docs/batches/2026-09-18-manifest-refresh.md` §1 · **用户 2026-09-18 01:38「要修」裁定**）：
  ① **§2.6 新增条 3「取值 = mtime 门控重读（值变检测）」**——判据序 ①–⑥ 逐条零改；新增取值前置步 **③b**（stat 门控 → 重读采纳 / 未变零重读 / 失败保守不更新不清零）；缓存载体 `agent._manifestMtime`（per-agent；语义 = 当前 `agent.manifest` 对应的档 mtime）。
  ② **§2.2 + `manifestFilePath(cwd)`**（档路径**单源**——项目根解析与读点同源）；读 / 写两处改用之（零语义）；钩子段补「附着决策 = 会话起点（KD-M1-13 零改）· 值刷新 = 每回合门控」两分。
  ③ **§2.4 +KD-M1-17 / M1-18 / M1-19**（值变检测 / 路径单源 / 缓存载体——各带被拒备选）；§2.5 +「与 KDs 的关系」条。
  ④ **§2.3 受影响文件表 +行 10–12**（`thincoder-core/manifest.mjs` / `thincoder-core/agent/setup-reminders.mjs` / `thincoder-core/test/setup-reminders.test.mjs`）；**§3.1 +AC-N7–AC-N7d** · **§3.2 +T32–T36**（含「先红」判据）。
  ⑤ **需求侧待同步（主 agent 域）**：`SPEC-MANIFEST.md` ④ AC-M1-6 的判据枚举需补 AC-N7–AC-N7d。

- 2026-09-17（模块设计轮 · 基础族 · eng-designer）：建档——M1 项目状态档 manifest 模块设计；七键 schema + 读/写/校验器（`thincoder-core/manifest.mjs`）；整档缺失拒 / 缺键 fallback 两分；写门 = `writeManifest` 的 `writer` 闸；两端装配钩子（CLI `make-agent.mjs` / VSC `setup.mjs`）；验收逐条回指 AC-M1-1..5。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 评审发现落地 · eng-designer）：#1 指针校验落 `validateManifest` 可选 `cwd` 参数（判据单源，AC-M1-4 判定对象不变——KD-M1-5）· #3 补 `requireManifest` 接口契约；
  #11 `docRoot`/`checkConfig` 子键缺与整键缺同语义（F4 / AC-3 / T3b）· #12 `initManifest` 经写门（AC-M1-5 同一闸）· #13 VSC `hydrateRun` 初始化分支仅 `depth === 0` · #17 `writeManifest` = 先校验后写 + D2 引用改可解析档章号。（行宽形式收正 2026-09-17——原单行 324 字符，拆为上述两条。）
- 2026-09-17（**manifest 面收口批** · eng-designer——承 `docs/batches/2026-09-17-manifest-closeout.md` §2 · **用户 2026-09-17 20:11 / 20:13 裁定**）：
  ① **#28 落地设计**——新增 §2.6「情境行注入」（行构造纯函数 + 自愈单活体推送 + 两接线点 + 压缩生存）；§3.1 新增注入面 AC-N1–AC-N6 · §3.2 新增 T8–T14 · §2.3 受影响文件表重测（as-of 实测 + 本轮增量）；
  ② **#29 裁撤**——`access` 键全链删除（F1 / §2.1 · §2.2 接口 · §2.5），schema 七键 → **六键**；新增 AC-6（去键兼容——旧档残留键不炸、回写自然收敛）+ T14。
- 2026-09-17（**manifest 面收口批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-17-manifest-closeout.md` §3 发现 1 / 2 / 3（发现 5 文本落批档 §2.10））：
  ① **发现 1（测试落点迁移）**——§2.3 表两行：`manifest.test.mjs` 增量 −~12 / +~45 → **−~12 / +~5**（296 → ~289，≤300）、编辑点去「AC-N1–AC-N6（用例 T8–T14）」；新增 `thincoder-core/test/setup-reminders.test.mjs` 行（61 → ~101——注入面用例落被测模块自身测试档）。
  ② **发现 2（根判定口径）**——KD-M1-1 括注「向上最近 .git；2026-09-17 收正」→「判据 = .git 纯向下：锚自身仓 → 自身；否则向下唯一带 manifest 子仓；2026-09-17 用户裁定」（对齐 §1.2 F2；需求侧同口径）。
  ③ **发现 3（计数文案）**——§3.2 T1「七键齐全」→「六键齐全」· T2「写默认七键档」→「写默认六键档」（零语义；历史变更记录两条 2026-09-17 保留）。
- 2026-09-17（**docRoot 多根批** · eng-designer——承 `docs/batches/2026-09-17-docroot-multiroot.md` §1.2 · **用户 2026-09-17 22:28 裁定**）：
  ① **F7 值形态扩展**——`docRoot` 值扩为「单串 | 多根数组」（数组 = 完整声明，不与默认合并；非法形态校验拒）；**新增 §2.7**（值域 / 语义四条 / 解析管线 / 全消费面 7 处 / 边界 / 需求侧待补）。
  ② **连带修订**——§1.2 +F7 · §1.4 边界 · §2.1#5 · §2.2 接口（两新导出 `isValidDocRootValue` / `docRootPaths` + 校验面扩值形态）· §2.3 受影响文件表重测 · §2.4 +KD-M1-6–M1-9 · §2.5 +三条冲突核对 · §3.1 +AC-7–AC-13 · §3.2 +T15–T22。
  ③ **零语义面**——`REVIEW_ROOT_KEYS` 键集、其他 manifest 字段、评审机制其他面（token 门 / 批档门 / 门序 / 冻结窗口）均零碰。
- 2026-09-17（**docRoot 多根批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-17-docroot-multiroot.md` §3 发现 1–4）：
  ① **需求侧锚回指**（发现 1）——§2.5 末条 + §2.7 末条去「缺环 / 待落锚」措辞，改指已落锚 `SPEC-MANIFEST.md` ②.7（`:19`）+ AC-M1-7（`:37`）。
  ② **数组元素非空口径**（发现 3）——§2.2 谓词句 + §2.7 值表复述「`trim` 后非空（口径与单串同款）」；AC-11 + T20 补「空白串（`trim` 后为空）元素 → 拒」一例。
  ③ **§2.3 第 7 行括注收正**（发现 4）——`access` 残留 fixture 改指 `manifest.test.mjs:36-45`（即 AC-6 / T14 用例），去「随 closeout 批收正」字样。
- 2026-09-17（**manifest 面收口批 · 设计面同步** · eng-designer——fix 轮；承 `docs/batches/2026-09-17-manifest-closeout.md` §5.4 评审发现 1）：
  ① §2.6 判据序 ⑤ 补「会话重建认领」半句（`_manifestLine` 缺失时先按行族前缀 `MANIFEST_LINE_PREFIX` 从 `history` 认领现存活体再摘）；
  ② §3.1 注入面表补 AC-N3b 行（回指用例 `thincoder-core/test/setup-reminders.test.mjs:102-108`）。零新语义——文档追上已交付并核验的行为。
- 2026-09-17（**activeBatch 裁撤批** · eng-designer——承 `docs/batches/2026-09-17-activebatch-repeal.md` §1.1 · **用户 2026-09-17 23:20 裁定**方案 A）：
  ① **schema 六键 → 五键**（F1 / §1.1 / §1.4 / §2.1#1 / §2.2 接口·DEFAULT_MANIFEST）；**F6 指针校验腿裁撤** → `validateManifest(obj)` 回归纯函数（KD-M1-5 裁撤 + KD-M1-10 / KD-M1-11 新增）；
  ② **情境行改 `phase` 单字段**（§2.6 行形逐字 + AC-N1 / AC-N3 / AC-N3b + T8 / T10）；
  ③ **去键兼容扩两键**（AC-6 / T14——`access` + `activeBatch`）；④ AC-4 / T4 / T6 墓志；§2.3 受影响文件表按本批重测（as-of 23:2x）。
  需求侧待同步（主 agent 域）：`SPEC-MANIFEST.md` ②.1 / ②.6 / AC-M1-4 / AC-M1-6 / ⑥ 与下游枚举。

- 2026-09-17（**activeBatch 裁撤批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 §3 发现 #3 / #4 / #9 / #12）：
  ① **#3**——§1.3 N2 判据列表删「指针可解析」（判据随校验腿裁撤消亡）；② **#4**——§2.2 接口 `writeManifest` 契约改 `validateManifest(manifest)`（去已裁撤的第二参）；
  ③ **#9**——§2.5 schema 计数句规格侧状态改「已同步」（四处 + 同批扩列：需求 v2 七处 / `SPEC-LEDGER.md` / `SPEC-MACHINE-CHECK.md` ②.5）；④ **#12**——§2.3 行 1 编辑点补静态注释三处（`:101` / `:122` / `:264`）。
- 2026-09-18（**装配门禁小修批** · eng-designer——承 `docs/batches/2026-09-17-assembly-gate-fixes.md` §1.1 批件 · **用户 2026-09-17 23:33「评估一下，分一下批，然后开始处理」授权**）：
  ① **#30 装配钩子加工程模式门**——判据 = `agent.config?.agent?.engineering === true`（与情境行判据②同源；**判据同日修正轮改「会话权威值」——见下条**）；普通会话零 manifest I/O（不读 / 不拒 / 不建档）+ `agent.manifest = null`；钩子执行点 = 会话起点（CLI 两处：装配 + 启动恢复后；VSC 每轮 reconcile）——KD-M1-12 / KD-M1-13；
  ② **#33 二道防线补实现**——`spawn-gates.mjs` `MANIFEST_BASENAME` 专用分支 + 拒文案（不复用 `PROCESS_BASENAMES`；不 import `MANIFEST_REL`——保叶子零 import）——KD-M1-14；
  ③ **文档补载**——§2.2 架构图 + 两端钩子行补「模式门 + 拒自动建档」分支（`85a4a6b3` 行为）；§2.3 受影响文件表按本批重测（as-of 2026-09-18 00:0x）；架构档 §2.3 E2 声明面句加工程模式口径（一字不差的口径限定 + 指针）；
  ④ 验收 §3.1 +AC-14–AC-18、§3.2 +T23–T31；②的边界（进程内中途翻转不重估）记 §2.5 末条——**属语义面待父侧裁定**（`/eng` 翻转遇根不可解析：拒翻 vs 放行 + 告警，涉 FR11 冲突）；
  ⑤ 需求侧已同步（父侧 2026-09-18 落笔——本行落档时为「待同步 / 缺位」，修正轮收正）：`SPEC-MANIFEST.md` ②.3 / AC-M1-2 已加「工程模式会话」模式限定；二道防线已立专条 AC-M1-8。
- 2026-09-18（**装配门禁小修批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承批档 §3 发现 1–9，**父侧裁定 9/9 全数接受**）：
  ① **#1 🔴 装配期判据取会话权威值**（父侧定案 = 方案 A）——§2.2 模式门改「恢复槽带 `engineering` 字段 ? 槽值 : `config.agent.engineering`」（槽优先 + config 回退；取值点三处同一合并结果）。
     读点 = **参数注入**（`bin` TUI 分支 `resumeSlot` 前移 + `slotData` 形参；**不在钩子内调 `resumeSlot`**——该函数非纯读，会为 `chat` / ACP 装配凭空写会话态）——KD-M1-12 / M1-13 改判据 + **KD-M1-15（新）**。
     AC-16 补反向格（槽假 config 真 → 非仓不抛 + 仓内无档不建档）+ §3.2 +T28 / T28b / T28c / T28d。
  ② **#2 🟡 需求侧改指已落状态**——§2.5 该条 + §4 ⑤：`SPEC-MANIFEST.md` ②.3 / AC-M1-2 / AC-M1-8 已同步（原「待同步 / 缺位」注撤销）。
  ③ **#3 🟡 回指补链**——AC-18 回指补 **AC-M1-8**（AC-M1-5 保留作写门主门回指）。
  ④ **#4 🟡 措辞限定到钩子面**——§2.2 / KD-M1-12 / §2.5 三处改「装配钩子零 manifest I/O」；§2.5 新增「普通会话的读面边界」条（下游照读消费面单列，本批零改）；AC-14「不读」退为可观测断言——**KD-M1-16（新）**。
  ⑤ **#5 🟡 验收矩阵四格可点**——§3.2 +T24b / T24c（含「仓内 + 无档」直测格）；AC-14 矩阵改四格逐格可点。
  ⑥ **#6 🔵 钩子后移后果半句**——§2.2 CLI 钩子行补「钩子后移的可观察后果」（拒 / 建档晚于 memory sync 与 MCP 连接；功能等价仍保持）。
  ⑦ **#7 🔵 家族两分记**——§2.5 拆「会话起点（ACP 装载——含整场无附着 / 无 E2 门槛 / 无下次重估后果）」与「进程内翻转（`/eng` · `/session` · 核心 `eng` 工具——照旧待裁）」两条。
  ⑧ **#8 🔵 拒文案钉稳定片段**——`/Manifest file/`（句首锚，沿用 `spawn-gates.test.mjs:92-98` 锚法）；AC-18 / T30 / KD-M1-14 同载。
  ⑨ **#9 🔵 行数说明**——§2.3 表下补 >300 行三行（#2 · #3 · #9）「不拆」理由（增量微、无跨档）。
  零新语义 / 零新范围：仅落评审席发现与父侧逐条裁定的直接导出项；#33 定案 / VSC 对位形态 / 拒翻裁定均零改。
- 2026-09-18（**失效表达清理批 · 本批直接执行 · 可 revert**——承用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）：删除现役规范面内的失效表达（不留划改残留）——§1.2 功能点 F6 整行 · §2.4 KD-M1-5 整行 · §3.1 AC-4 行 · §3.2 T4 / T6 两行 · §1.1 / §1.2 F1 / §2.1#1 / §2.2 接口 / §2.5 现状核对条内退役括注。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。

- 2026-09-18（**失效表达清理批 · 第 4 轮 · 本批直接执行 · 可 revert**——同批 §1 裁定 · 承父侧 S5 复扫）：§1.4 去批次叙述 + 修订式（「**本批（activeBatch 裁撤）**：删 schema 一键（六键 → 五键）+ 校验器指针腿与 `{ cwd }` 参 + 情境行字段；」）——留现值边界句「五键（…）的判据取值 / `REVIEW_ROOT_KEYS` 键集 / 评审机制其他面零碰」。
  同轮判**保**（记录面——逐处给理由）：§2.3 表下 as-of 说明 + 上批批档指针（出处注）· §2.5 schema 计数句（带日期出处注）。历史沿革 = 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。

- 2026-09-18（**失效表达清理批 · 第 5 轮（终轮）· 本批直接执行 · 可 revert**——同批 §1 裁定 · 承第 4 轮上抛坐标）：§1.4 去批标签「**F7 腿（已完成）**」（留现值边界句）· §2.5 两条「原登记——现已落定」修订式收正（去原后果叙述——现值承接 = §2.8 / F4）· §2.5 键集条去「（本批变）」+「六 → 五」修订式（留键集现值句）。历史沿革 = 本档既有历史段 + 批档 `docs/batches/2026-09-18-stale-expression-purge.md`。
