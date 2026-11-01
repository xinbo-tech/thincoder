# 2026-11-01 · project-standards-declaration
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 11:53 逐字「B」—— 在父侧给的 A（保持现状）∥ B（声明口回来）∥ C（重新猜名）三选里选了 B：manifest 上补一个「本项目的标准档在哪」的声明口，有则注入、无则显式降级。。
> 台账 = #1943（ADVISOR-CONVERGENCE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1943**

### 1.1 这批治什么

**评审有一条维度叫「方法论符合度」，而现在这条维度对任何项目都是空的 —— 包括我们自己。**

父侧今日实读（`thincoder-core/advisor/project-context.mjs:210`–`:222`）：

```
export function injectProjectStandards(_agent, parts, _root) {
  parts.push("## Project Standards")
  parts.push(NO_STANDARDS_NOTICE)
  return null
}
```

**三个参数一个都没用。** 档头注释写明为什么：**没有哪个标准档名能从「项目自己声明了什么」推导出来**（旧的固定名探测被删了 —— 多数项目根本没有那份档）。

**⇒ 治「猜固定名」时，把那条错路上挂着的一件对的事（让评审拿到项目标准）也一起删了。** 本批把它接回来 —— **用声明，不用猜**。

### 1.2 三个状态（这批的核心形状）

| 状态 | 判据 | 注入面写什么 |
|---|---|---|
| **未声明** | manifest 无该键（或值为 `null`） | 现有 `NO_STANDARDS_NOTICE`（「本项目未声明标准档」） |
| **声明了但读不到** | 有值，但路径不存在 ∥ 读失败 | **新句**：点名「声明在 `<path>`，但读不到」——**不许与「未声明」同形**：那会让作者以为没声明过，回头去补一个其实已经有的声明 |
| **声明且读到** | 路径存在且可读 | 注入正文（带预算，见 §1.4） |

### 1.3 落点（父侧已摸清的现况）

| 面 | 现状 | 本批要不要动 |
|---|---|---|
| `thincoder-core/manifest-schema.mjs` | `DEFAULT_MANIFEST` 五键 ∥ `MANIFEST_SCHEMA.nestedKeys.docRoot` 列五个子键；`isValidDocRootValue`（串 ∥ 数组 ∥ `null`）现成 | **要**：新增子键要进 schema 与默认值 |
| `thincoder-core/manifest.mjs` | `docRootPaths` 展开 ∥ 解析（基数 = 项目根）现成 | 可能不用改（若新键复用 `docRootPaths`） |
| `manifest` 工具的键目录 | 可写节点 = 3 整键 + `docRoot` 五子键 + `index` 四子键（「全集以外的键一律拒 —— 拼写保护」） | **要**：新键得进白名单，否则 `manifest write` 写不了 |
| `thincoder-core/advisor/project-context.mjs` | `injectProjectStandards` 恒降级 | **要**：三态实现 |
| `PROJECT-MANIFEST.json`（本仓） | 未声明 | **要**：本仓自己先声明 `docs/core/requirements/METHODOLOGY.md` —— 自己不用，就没验过 |
| `docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1 | 今日刚收正为「标准面只有显式降级」 | **要**：改成「声明口 + 三态」 |

### 1.4 设计席要定的三件（父侧不预设）

① **新键住哪**：`docRoot` 第六子键（= 「标准档属于哪类文档」）∥ 顶层新键。父侧倾向 `docRoot`：它承载的正是「文档类住在哪」，且 `isValidDocRootValue` 与 `docRootPaths` 直接复用；但 `declaredDocRoots()` 现在按五个面派生文档地图，**新键进去会不会影响地图推导，要你判**（这是真实的副作用面，不是洁癖）。

② **注入预算**：项目指南那面按「模型窗口 5%（下限 8192 字符）」截断（`project-context.mjs:29`–`:30`、`:117`–`:121`）。标准档走同一预算 ∥ 另给一档 ∥ 不截断。**给理由**。

③ **「声明了但读不到」那句的措辞与判据**（§1.2 第二态）。

### 1.5 边界

- **不重新引入任何「猜固定名」探测**（我们仓库那份家规档的文件名那种）。**声明是项目自己的口，猜是我们的口 —— 这条界线是本批的立身之本。**
- **不动 `AGENTS.md` 那条路**（它已工作，本批只补标准面）。
- **不动 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`**（另一本批在飞）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

## 2. 批次任务与设计（eng-designer）

**状态行**：设计完成

设计档 = `docs/core/design/MANIFEST.md` §2.12；需求档 §5.1 同步收正。

### 2.1 本批条目（覆盖 = 台账 #1943）

| # | 条目 | 落点（设计档节） | 判据 |
|---|---|---|---|
| E1 | 「方法论符合度」维度不再恒空：声明了标准档 ⇒ 评审拿到正文 | §2.12 接口契约 + 三态文案 | AC-51 · T87 |
| E2 | 未声明 ⇒ 现有显式降级句（不静默、不猜） | §2.12 态 1 | AC-52（负向锁）· T89 |
| E3 | 声明了但读不到 ⇒ 点名声明路径 + 原因，与「未声明」可机判区分 | §2.12 态 2 | AC-51 · T88 |
| E4 | 键进 schema / 默认值 / 白名单可用 | §2.12 受影响文件行 1 · 3 · 4 | AC-55 |
| E5 | 注入预算（含本面截断句） | §2.12 注入预算节 | AC-53 |
| E6 | 本仓自用声明（自己不用就没验过） | §2.12 受影响文件行 5；执行角色 = 主 agent（写门 `main`） | 本仓数据档声明 `docs/core/requirements/METHODOLOGY.md` |
| E7 | 需求档 §5.1 从「只有显式降级」收正为「声明口 + 三态」 | `docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1（三态行 / 边界 / 验收 ④ / 端差登记 4） | 见 2.5 上抛项 A |

**明确不在本批**：不探测任何固定档名 · 不动 `AGENTS.md` 路径 · 不动另一在飞批次的设计档（§1.5 已点名）· 不改文档地图派生 · 不改评审根键集 · 不加迁移脚本。

### 2.2 §1.4 三件的判断与理由

论证全文在 `docs/core/design/MANIFEST.md` §2.12（本处只记结论）。

**① 新键住哪 → `docRoot` 第六子键 `standards`，值 = 文件路径，默认 `null`。**

父侧点名的副作用面**判为不成立**：`DOC_ROOT_ORDER`（`thincoder-core/advisor/project-context.mjs:131`）是**显式五名串**，不是 `Object.keys(docRoot)`，故新子键不会把文档地图带偏。

但同一条路上另有**三处真副作用**，逐条判：

- `thincoder-core/declaration.mjs:158` `entryDocPaths` 遍历的正是 `Object.keys(DEFAULT_MANIFEST.docRoot)` ⇒ 索引范围（§6.14 面⑦）自动多一个前缀。未声明项目 `docRootPaths(null) = []` ⇒ 零变化；声明项目 ⇒ 标准档所在目录进索引（本仓 `docs/core/requirements` 已在范围内 ⇒ 零变化）。判：**接受**，由 AC-54② 锁「未声明 ⇒ 逐项等值」。
- `REVIEW_ROOT_KEYS` = 评审根五键（`thincoder-core/agent/write-gate.mjs:41` 再出口）⇒ 本族键与评审根键须以**显式名单**比较，`Object.keys(docRoot)` 派生不成立。AC-54① 锁「加入前后 `resolveReviewTargetPaths` 逐项等值」。
- 写面白名单**从 `MANIFEST_SCHEMA` 派生**（`thincoder-core/agent-tools/manifest.mjs:62-70`）⇒ 新子键自动可写。**§1.3「新键得进白名单」要收正**：不是手加，是进了 schema 就有了；工具侧拒因文案写「sub-keys of docRoot / index」，无计数，零改。

**默认值必须是 `null`**（三态的地基）：给一条默认路径，「未声明」与「声明了但读不到」会读出同一路径，前两态塌成一态。`null` = 既有「本面无」哨兵（KD-M1-37）。

**已知代价（明写）**：未声明项目的 `manifest read` 会多一行 `missingKeys=docRoot.standards`。

诚实且**自愈**：缺省 `null`，该项目下一次任意 `manifest write` 经 `fillDefaults` 落盘即带上 `standards: null`，不再报。

不加过滤分支——过滤 = 「接受但忽略」的变体，正是 KD-M1-49 禁的形态。

**② 预算 → 算式复用同两条常量（`project-context.mjs:29-30`），逐注入独立计算；超帽截断句是本面专用的 PARTIAL 句。**

理由：截断的风险不在大小，在**静默**。

指南截断丢的是**指针**（评审还能直接读范围档补回）；标准档截断丢的是**判据本身**——评审拿一份残缺的规矩判方法论，正是本批要治的那类「看不见的失准」，而且更难发现，因为确实注入了东西。

拒掉三种：

- 不截断——大档撑爆消息 ⇒ 全丢，比部分更坏；
- 小硬帽（如 2000）——真标准档的规则常在文档后半，硬帽稳定砍掉判据；
- 与指南共享一个池——谁先注入谁挤死另一个，两面语义不同不该互相记账。

**③ 「声明了但读不到」的判据与措辞**

判据：`std = manifest.docRoot.standards`（缺键经 `fillDefaults` ⇒ `null`）；`null` ⇒ 态 1；否则 `docRootPaths(std, base)` 逐项试读，首个读到 ⇒ 态 3，全部不可读 ⇒ 态 2。

`base` = `root ?? agent.cwd`，与 `injectDocumentMap` 同一 base——不另立第二套解析。

措辞（逐字见 §2.12 三态文案节）：态 2 = 新常量 `STANDARDS_UNREADABLE_NOTICE({ path, reason })`，句身含 `declared at <path>` + `reason`（`no such file` ∥ `read failed: <code>`）+「do NOT declare it again」。

**可机判分界**：态 2 句含声明路径字面 + 前缀 `declared at`；态 1 句零路径、零 `declared`。两因分开是因为可修面不同（路径 vs 权限）。

### 2.3 受影响文件与 tier 结论

全表 = `docs/core/design/MANIFEST.md` §2.12「受影响文件」8 行（本处不转抄计数，单源）。要点：

- 产品面 4 档（schema · 注入器 · 工具头注 · 工具描述档键目录）→ eng-coder；
- 数据 1 档（本仓数据档）→ **主 agent**（写门 `main`，子代理无写路径）；
- 需求档 1 档 + 设计档 1 档 → 本设计轮已落（见 2.5 上抛项 A 的归属声明）；
- 一次性单元测试档 1 档 → eng-coder，收口即删。

**tier 结论**：无档跨 tier，无拆分需求。

### 2.4 验收（逐条回指 2.1；机检形 = §2.12 验收对照表）

AC-51 三态互异 · AC-52 零探测负向锁 · AC-53 预算 · AC-54 副作用三锁 · AC-55 写面可用；用例 T87 / T88 / T89。

**本批（设计轮）自身验收**：① §2.12 落位；② 需求档 §5.1 四处收正；③ 计数收正（本档 §2.2 / §2.3 / §2.11 三处「五子键 / 五路径 / 12 节点」→ 六 / 13）；④ `doc_check` gate PASS；⑤ 本轮零改代码。

### 2.5 上抛项

**[上抛·待裁] A — 需求档 §5.1 由本设计席写入，请复核。**

D1 路由把需求档改动归主 agent，但本批 spawn 的文件清单把 `docs/core/requirements/ADVISOR-CONVERGENCE.md` 声明为本席写域，且 §1.3 已把 §5.1 收正列为本批「要」。

我按「用户已裁定方向（B = 声明口回来）、本席只记录裁定、不新立语义」的限度落了四处：三态行 · 边界句 · 验收 ④ · 端差登记 4。

若主 agent 判定该面应回自己笔，请复核这四处。

**[上抛·知会] B — 端差登记 4 是既有假陈述，本次顺手收正。**

该行原写「仅声明（`advisor.standardsDoc`——硬探针已退役）」，而该键已整键退场——旧句会让人以为那条声明面还在。属本批同一机制面，一并改。

### 2.6 关键决策

全文含拒掉的备选 = `docs/core/design/MANIFEST.md` §2.12 关键决策表（KD-M1-55 … M1-59）：

- 55 键位（docRoot 子键，非顶层）；
- 56 值 = 文件路径（非目录——避免在目录内猜文件名）；
- 57 默认 `null`（三态地基）；
- 58 预算算式复用 + 本面 PARTIAL 句；
- 59 态 2 必须点名路径 + 原因。

### 2.7 修正轮（对 §3 轮次 1 · changes-required）

**落点**：只动设计档 `docs/core/design/MANIFEST.md` §2.12。需求档 `docs/core/requirements/ADVISOR-CONVERGENCE.md` 本轮零改——八条里没有一条指向它（§5.1 的三态行 / 边界 / 验收 ④ / 端差登记 4 已于上轮落盘）。

| # | 改动 | 位置（设计档） |
|---|---|---|
| 1 | 判据域闭合：取值源钉死为 `read.ok && read.manifest ? read.manifest : DEFAULT_MANIFEST`（同 `project-context.mjs:136` 先例）+ 硬不变量 `paths.length === 0 ⇒ 态 1` ⇒ 态 2 句永不含 `undefined`；`std == null` 宽松相等覆盖 `undefined`；数据档读抛（`manifest.mjs:164` 上抛面）显式收口为态 2 族 `manifest read failed: <code>`，不中断消息组装 | §2.12「判据」`:1083`–`:1103` |
| 2 | 新增「分支出处」表 6 行（每行实读坐标 ∥ 可复现夹具命令） | `:1104`–`:1114` |
| 3 | 新增「集成测试设计（对 `test/RTM.md` 的增量）」：破 0 行 · 冗余 0 行 · 新增 §24 三行（24-1…24-3，证据档 `test/integration/review-standards-injection.test.mjs`）；受影响文件表随之增行 8（RTM + 用例档），tier 结论 8 档 → 9 档 | `:1216`–`:1233` · `:1165` 表内 |
| 4 | 受影响文件行 2 补编辑点 `:16-17`（模块头注「标准面无派生名、故显式降级」）· `:210-215`（函数 JSDoc「declaration face is gone」）——改后即假话 | `:1165` 表内行 2 |
| 5 | 受影响文件行 4 补计数同改：`thincoder-core/tool-docs/manifest.md:24` 的 12 → 13、`docRoot's 5 sub-keys` → 6；`:28` 枚举补 `standards` | `:1165` 表内行 4 |
| 6 | 多份声明不再静默丢：判据改 R/U 双集（全部可读份注入 + `STANDARDS_PARTIAL_NOTICE` 半读句点名逐份路径与原因）；KD-M1-61 记拒掉的「只注入首份」；验收 AC-56 + 用例 T92 | `:1083` · `:1131`–`:1137` · `:1181` · `:1193` · `:1205` |
| 7 | 截断句补恢复指针：`read the full file — <absolute path> — for the rest`；AC-53 增「截断句含被截断那份的绝对路径」断言 | `:1141`–`:1149` · `:1193` |
| 8 | 两个新名各补三问：键 `docRoot.standards` = `none found`（四个面实读）；常量 `STANDARDS_UNREADABLE_NOTICE` = `existing` `:37` 但 failed on 句义相反 ⇒ 形态对齐、句子新建 | `:1067`–`:1075` |

**另补两条决策**：KD-M1-60（取值源与 `paths.length === 0 ⇒ 态 1` 硬不变量，拒掉「直接取 `manifest.docRoot.standards`」）· KD-M1-61（多份 = 全部注入 + 半读句，拒掉「只注入首份」）。

**新名一枚**：`STANDARDS_PARTIAL_NOTICE`——三问 = `existing: thincoder-core/advisor/project-context.mjs:37` 同族同出口，句义不同（半读 ≠ 未声明）⇒ 形态对齐、句子新建；消费者 = `injectProjectStandards` 唯一。

**验收对照变化**：AC-51（五格夹具 + 态 2 必含绝对路径、绝不含 `undefined`）· AC-53（+ 绝对路径断言）· 新增 AC-56（多份零静默丢）· AC-57（读抛不中断）；用例 T87–T92（+ 无档 / 读抛 / 多份半读三格）。

**门**：`doc_check gate` = DOC-CHECK GATE: PASS（2 档全清）。

**留给父侧的两条读数**：① 🔵9 的点名校正由父侧笔落；② 设计档 `:1003`（§2.11 行 8）与 `:744`（§2.2）仍写别的批次的「20 → 12 节点」delta 列——属已收口批次的增量记录，本轮不动（改它 = 改写别人已结的账），仅登记。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审（独立评审子代理 · 设计轮）

评审对象 = 标准档声明口（`docRoot.standards` ∥ 三态注入）设计 · 状态 = 待评审。

评审范围 = 批档 `docs/batches/2026-11-01-project-standards-declaration.md` · 设计档 `docs/core/design/MANIFEST.md` · 需求档 `docs/core/requirements/ADVISOR-CONVERGENCE.md`。

下文简称：**设计档** = `docs/core/design/MANIFEST.md`；**需求档** = `docs/core/requirements/ADVISOR-CONVERGENCE.md`；**批档** = `docs/batches/2026-11-01-project-standards-declaration.md`。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 需求覆盖 / 清晰度 | 🔴 | 三态判据域不闭合：设计档:1075 的 `std = manifest.docRoot.standards（缺键经 fillDefaults ⇒ null）` 预设 `manifest` 非空，但「项目根本没有 manifest」这一输入未定义——`readManifest` 整档缺失时返回 `manifest: null`（`thincoder-core/manifest.mjs:162`）⇒ `manifest?.docRoot?.standards` 得 `undefined`，而态 1 判据写的是 `std === null`（设计档:1076）接不住 `undefined`；随后 `docRootPaths(undefined)` 因 `isValidDocRootValue` 为假返回 `[]`（`thincoder-core/manifest.mjs:112`）⇒ 落入设计档:1079 的「全部不可读 ⇒ 态 2」，即给一个**未声明**（且无档）项目发出「declared at undefined，读不到」——恰是本批禁止的那类误判的反向。另 `readManifest` 对非 ENOENT 读错**上抛**（`thincoder-core/manifest.mjs:164`），设计未定该路；T89（设计档:1159）只覆盖「有档但无该键 ∥ 键=null」，无「无档」格 | 把取值源钉死并写进判据节：`readManifest(base)` + 既有先例回退（`thincoder-core/declaration.mjs:187` ∥ `thincoder-core/advisor/project-context.mjs:136` 的 `read.ok && read.manifest ? … : DEFAULT_MANIFEST` 形），明文「档缺失 ⇒ 态 1」；并在用例表补两格：① 无 `PROJECT-MANIFEST.json` ⇒ 态 1 句、零正文；② manifest 读抛（EACCES）⇒ 明确归哪一态且不冒出 `undefined` 路径 |
| 2 | 边界 / 分支出处（6b） | 🔴 | 态 2（含 `no such file` ∥ `read failed: <code>` 两因分列，设计档:1095）未给出场景出处：设计档:1097 与 :1141 只有推理（「与态 1 同形会让作者补一个已有的声明」），既无实读观察（数据读数 ∥ 日志行 ∥ 用户原话引用），也无复现路径（能跑出该态的命令） | 补一行出处：给出可复现路径（如夹具：声明 `docRoot.standards` 指向一个不存在的档，跑一次设计评审看到态 2 句）；或将态 2 收敛为两因合一的单句。给出复现路径即过 |
| 3 | 集成测试设计（RTM） | 🔴 | 设计档无集成测试设计节，也未从 `test/RTM.md` 起步做增量：全文零 `RTM` 命中（设计档仅 :220 ∥ :234 提「不进集成测试树」），本批只落了 T87–T89（设计档:1157-1159，三次调 `injectProjectStandards` 的单元级核法）+ 一次性单测档（设计档:1129）。`test/RTM.md`（306 行）确有本面相邻业务故事——如 §6「设计评审的文档范围按项目根受理」（行 6-1…6-5，证据 `test/integration/review-doc-scope.test.mjs`），本批改的是同一注入面的行为，至少须答「哪些行破 ∥ 哪些冗余 ∥ 哪些缺」。设计既未给该节，也未按豁免口径（「不改任何既有用例断言到的业务可观察结果且不新增产品真需要的场景」）写出理由 | 在设计档 §2.12 增「集成测试设计（对 `test/RTM.md` 的增量）」节：先读 RTM，逐条答本批是否动到既有行（如 §6 诸行的受理判据 ∥ 评审注入面），再答是否有该新增的业务场景（评审是否拿到项目标准档、未声明 ∥ 读不到时用户可见的降级）；若确无业务面变化，就在该节写出三行豁免理由。缺行号先在 RTM 定号、再用同一号写用例名 |
| 4 | 清晰度 / 受影响面 | 🟡 | `thincoder-core/advisor/project-context.mjs` 的编辑点只列了 :217-222 · :37 邻 · :29-30（设计档:1123），漏了本批改后即变假的同档文本：模块头注 :16-17（"the standards face has no derivable convention name and is therefore an explicit degradation"）与函数 JSDoc :210-215（"The declaration face is gone with the manifest `advisor` key…"，:211）——不改则实现后注释与代码相反 | 受影响文件表行 2 的编辑点补 :16-17 与 :210-215（注释收正，零语义） |
| 5 | 方法论 / 计数同改（D3） | 🟡 | 描述档计数未随枚举同改：`thincoder-core/tool-docs/manifest.md:24` 逐字写着 "Key catalog — the 12 writable nodes (3 whole keys + docRoot's 5 sub-keys + index's 4 sub-keys)"，行 :28 逐条只列 `docRoot` 五子键；设计档:1125 的变更只写「增 `standards` 一行」，未写把 12/5 收到 13/6——改完档内自相矛盾 | 行 4 的变更描述补「`12 writable nodes` → `13`、`docRoot's 5 sub-keys` → `6`」（与行 3 的头注 12→13 同一处口径） |
| 6 | 需求覆盖 / 零静默 | 🟡 | 多份声明被静默丢：判据写「`docRootPaths(std, base)` 逐项试读，**首个读到** ⇒ 态 3」（设计档:1077-1078），而 KD-M1-56（设计档:1138）明写「值 = 文件路径（单份 ∥ **多份数组**）」⇒ 声明三份而只有首份可读时，其余两份既不注入也不报；与需求档:113 的验收 ③「任何一面都不得静默跳过」相抵 | 二选一写进判据节：① 注入全部可读份（逐份截断句各自独立）；② 只注入首份时附一句「声明的 N 份中 M 份读不到」的可见句。并补一格夹具 |
| 7 | 验收 | 🟡 | 截断句无恢复指针：本面截断句为 "…(truncated at <N> of <M> chars — the standard set is PARTIAL)"（设计档:1102），而指南那条先例同时给了「去读全文」的动作（`thincoder-core/advisor/project-context.mjs:121` "read the full file if you need more"）——本设计的立论正是「截断丢的是判据本身」，却又把检索路径留下不写，读者只能拿着残缺规矩判 | 截断句补上标准档绝对路径 + 一句「读全文补足」（与指南句同族），AC-53 加一条「截断句含绝对路径」的断言 |
| 8 | 既有件 / 新增名（三问） | 🟡 | 设计档 §2.12 只有「最近先例（逐项）」（设计档:1057-1062，被复用的既有件答得好），缺两个**新增名**的三问：键 `docRoot.standards` 与常量 `STANDARDS_UNREADABLE_NOTICE`（设计档:1087）——住哪 ∥ 逐字名 ∥ 谁消费，无一行在册 | 各补一行三问（`existing: …` / `none found: …` / `existing but unusable: …` 三形之一），体例同设计档 §2.2「新增名核查（三问）」（设计档:119-123） |
| 9 | 文档卫生 / 行号 | 🔵 | 批档 §2.2 把 `REVIEW_ROOT_KEYS` 的再出口记成 `agent/write-gate.mjs:41`（批档:99），实际再出行是 `thincoder-core/agent/write-gate.mjs:48`，键集本体在 `thincoder-core/agent-tools/review-facts.mjs:35`（设计档:1110 ∥ :397 写的是 `:48`，正确） | 批档该处改 `:48`，或按 D4 只写节名不写行号 |
| 10 | 备注（实测核对，无动作） | 🔵 | 外审四件已实读核对通过：① `entryDocPaths` 虽遍历 `Object.keys(DEFAULT_MANIFEST.docRoot)`（`thincoder-core/declaration.mjs:158`），未声明项目走 `docRootPaths(null) = []`（`thincoder-core/manifest.mjs:113`）⇒ **「零变化」成立**；② 文档地图是显式五名串 `DOC_ROOT_ORDER`（`thincoder-core/advisor/project-context.mjs:131`）⇒ 不受新键影响；③ 评审根是显式 `REVIEW_ROOT_KEYS`（`thincoder-core/agent-tools/review-facts.mjs:35`）⇒ 写门不受影响；④ `declared` 旗只读 codePaths/index 两族（`thincoder-core/declaration.mjs:81`）⇒ AC-54③ 恒真。tier 结论也对得上实测：`thincoder-core/advisor/project-context.mjs` 223 行 · `thincoder-core/manifest-schema.mjs` 154 行 · `thincoder-core/agent-tools/manifest.mjs` 232 行，均 <500 且无 300+ 行单函数 | 无 |
| 11 | 备注（父侧两问判为成立） | 🔵 | ②「默认值必须 `null`」的理由站得住：无默认路径时「未声明」由 `fillDefaults` 补成 `null` 即可机判；给默认路径则未声明项目会读同一条路径、只剩 `missingKeys` 可分辨，而注入器不消费它 ⇒ 前两态塌成一态（需求档:111 亦明写本键不带默认路径）。④「标准档截断丢判据」的推理成立且与本仓零静默纪律同向——剩下的只是第 7 行要补恢复指针 | 无 |

**限制声明**：本环境无 Project Standards 档（`PROJECT-MANIFEST.json` 自用声明尚未写——按裁定不作缺失项）。

无文档地图 README ⇒ 文档拥有权只在评审范围内三档之间互核；范围外同主题副本（`docs/core/requirements/PORTABILITY.md` ∥ `docs/core/design/ADVISOR-GUARDS.md` 的降级句）未能核，该维度按降级处理。

**计数**：🔴 3 · 🟡 5 · 🔵 3

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象** = 设计档 `docs/core/design/MANIFEST.md` §2.12（轮次 1 的 🔴3 / 🟡5 / 🔵3 复核）· 批档 `docs/batches/2026-11-01-project-standards-declaration.md` §2.7 · 需求档 `docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1。轮次 2 = 只验轮次 1 的八处是否真落，不开新议题。

**四处重点（父侧点名）**

1. 🔴1 取值源 —— 真钉住：设计档:1088 逐字 `std   = (read.ok && read.manifest ? read.manifest : DEFAULT_MANIFEST).docRoot.standards`
   ；硬不变量在设计档:1091（`paths.length === 0     ⇒ 态 1    ← 一个路径都没得来，绝不发态 2 句（不许编路径）`）；
   `std == null` 宽松相等（设计档:1098）覆盖 `undefined`；读抛在 :1101 收口；缺档 / 非法档走 DEFAULT 在 :1100。
   夹具 T90（设计档:1212 空目录锚）∥ T91（:1213 `EISDIR`）∥ AC-51 五格（:1197）∥ AC-57（:1203）。判：**堵住**。
2. 🔴2 分支出处 —— 真给到：设计档:1104–:1113 六行，父侧点名的三格俱在（`EISDIR` 行在设计档:1112 ·
   半读夹具在设计档:1113 `["docs/core/requirements/METHODOLOGY.md","docs/nope"]` · 态 2 复现命令在设计档:1111）。
3. 🔴3 集成测试设计 —— 真从 RTM 起：设计档:1216 节头 · :1218 实读节 1–23 与两个相邻故事 · :1220 破 0 ∥ :1221 冗 0 ∥
   :1222 新增 §24 三行（+ 用户进入点 / 组件交互 / 回指在 :1224）。实读 `test/RTM.md:267`（末故事 = 23）⇒ §24 空号成立。
4. 🟡6 多份 —— `STANDARDS_PARTIAL_NOTICE` 名与行为成立：同族同出口同 `(…)` 体（设计档:1127–:1132），
   半读句点名逐份路径与原因 ⇒ 与零静默纪律同向；AC-56（:1202）+ T92（:1214）+ KD-M1-61（:1191）。

**逐项状态**

| # | 原# | 类别 | 严重度 | 状态 | 依据 |
|---|---|---|---|---|---|
| 1 | 🔴1 | 判据域 | 🔴 | Fixed | 设计档:1088 / :1089 / :1091 / :1098 / :1100 / :1101 + T90 :1212 · T91 :1213 · AC-57 :1203 |
| 2 | 🔴2 | 6b 分支出处 | 🔴 | Fixed | 设计档:1104–:1113 六行（实读坐标 + 复现命令） |
| 3 | 🔴3 | 集成测试 / RTM | 🔴 | Fixed | 设计档:1216–:1234；`test/RTM.md:267` ⇒ §24 空号；受影响文件行 8（:1176）· tier 9 档（:1179） |
| 4 | 🟡4 | 受影响面 | 🟡 | Fixed | 设计档:1170 行 2 编辑点含 `:16-17` ∥ `:210-215` |
| 5 | 🟡5 | 计数同改 | 🟡 | Fixed | 设计档:1172 行 4（12 → 13 · 5 → 6 · `:28` 枚举补 `standards`） |
| 6 | 🟡6 | 零静默 | 🟡 | Fixed | 设计档:1092–:1095 R/U 双集 · :1127–:1132 半读句 · KD-M1-61 :1191 · AC-56 :1202 · T92 :1214 |
| 7 | 🟡7 | 截断句 | 🟡 | Fixed | 设计档:1145–:1149「read the full file — <absolute path> — for the rest」· AC-53 :1199 |
| 8 | 🟡8 | 新增名三问 | 🟡 | Fixed | 设计档:1067–:1072（两新增名在册） |
| 9 | 🔵9 | 行号点名 | 🔵 | Accepted | 批档:99 仍写 `write-gate.mjs:41`；设计档:1157 已改 `:48` + `review-facts.mjs:35`；批档 §2.7 记「由父侧笔落」，本轮评审对象声明亦注明不记 🔴 ⇒ 理由成立 |
| 10 | 🔵10 | 实读核对 | 🔵 | Accepted | 无动作项；本轮复核结论不变 |
| 11 | 🔵11 | 父侧两问 | 🔵 | Accepted | 无动作项；②④ 判为成立（④ 的恢复指针已由 🟡7 补上） |

**本轮新增（不阻断）**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| N1 | 单一源 | 🟡 | 第三枚新名 `STANDARDS_PARTIAL_NOTICE` 的三问只落在批档:190，而设计档:1067「**新增名三问（逐项）**：」节内只有两枚（:1069 键 ∥ :1071–:1072 `STANDARDS_UNREADABLE_NOTICE`）——需求档:109 已把「判据与文案单源」指到设计档 §2.12 | 把批档:190 那一行搬进设计档:1067 节内，单源不留缝 |
| N2 | 零静默（截断面） | 🟡 | 多份声明 + 超帽时只点名被截断的那一份：「…(truncated at <N> of <M> chars — the standard set is PARTIAL;」（设计档:1145）「read the full file — <absolute path> — for the rest)」（:1146）；切点之后的其余声明份既不注入也不点名 ⇒ 🟡6 治的同一类缺口在截断侧仍在 | 截断句加一句「及其后 N 份未注入（逐份路径）」；拼接期已有逐份偏移，只多一句枚举 |
| N3 | 文案准确 | 🟡 | manifest 读抛走态 2 模板、`path` 填 `manifestFilePath(base)`（设计档:1101），而模板句身是「(Project standards declared at <path> in the manifest, but unreadable — <reason>;」（设计档:1121）⇒ 句面成了「标准档声明在 PROJECT-MANIFEST.json」，陈述了不成立的事实 | 读抛独立一句（如「The project manifest at <path> could not be read — …」），或改模板首句以容纳 data 档本身；AC-57 只断言 `manifest read failed: EISDIR`，不受影响 |
| N4 | 计数同源 | 🔵 | 批档:134「全表 = `docs/core/design/MANIFEST.md` §2.12「受影响文件」8 行（本处不转抄计数，单源）」，设计档表已 9 行（:1176 行 8 ∥ :1179 九档）；批档 §2.7:181 已记「8 档 → 9 档」 | 无动作（append-only，§2.7 已登记） |
| N5 | 运行门 | 🔵 | 集成测试节给了证据档名（设计档:1222 `test/integration/review-standards-injection.test.mjs`）但没点名收集它的运行门 | 该节补半句「收集 = `node test/run.mjs`」 |
| N6 | 记录面 | 🔵 | 批档:124 的判据结论仍写「首个读到 ⇒ 态 3，全部不可读 ⇒ 态 2」，与设计档:1092–:1095 的 R/U 双集不同；同批档 §2.7 第 6 条已记该判据改写，且 :90 已声明「论证全文在设计档 §2.12」 | 无动作（append-only 取代形；单源在设计档） |

**限制声明**：本环境无 Project Standards 档（自用声明尚未写——按裁定不作缺失项）；无文档地图 README ⇒ 范围外同主题副本未核，按降级处理。

**计数**：轮次 1 遗留 —— 🔴 3/3 Fixed · 🟡 5/5 Fixed · 🔵9 Accepted · 🔵10 / 🔵11 维持｜本轮新增 —— 🟡 3 · 🔵 3

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准 = 批级放行。**

- **点火原话**：2026-11-01 11:53 逐字「**B**」—— 在父侧给的三选（A 保持现状 ∥ **B 声明口回来** ∥ C 重新猜名）里选定 B。
- **放行原话**：2026-11-01 11:54 逐字「**自动跑完**」—— 批级 go-ahead，覆盖本批**评审 → 实施 → 收口**全链。
- **批准的对象**：manifest 增 `docRoot.standards` 声明口 + 评审注入面三态（未声明 ∥ 声明了但读不到 ∥ 读到，三句可机判互异），**不重新引入任何固定档名探测**。
- **批准前已知的面（当时读数，不是事后追认）**：设计经 **2 轮**独立评审（轮次 2 = `pass`，13 条遗留全 Fixed，另 3 条 advisory 由父侧裁为「不阻断、登账」）；实施动产品码 3 档 + 描述面 2 档 + 集成索引与用例各 1 档。
- **一条批准时就摆出来的代价**：本仓 `PROJECT-MANIFEST.json` 的自用声明须等 schema 落地才写得成 —— 所以它排在实施之后由父侧落（§6.2），**不是漏做**。
- **两条 advisory 不阻断的处置**：N2（截断漏点名后续份）∥ N3（读抛句面借用了标准档模板）**在本批记账、留 `#1948`**，不当作已修。

## §5 实施记录（eng-coder）
**状态行**：实施完成



### 5.1 交付摘要

产品面四档 + 测试面三档已落；三态注入按设计档 §2.12 逐条实现（判据 / 文案 / 预算 / 副作用面）。

| # | 文件 | 变更 | 面 |
|---|---|---|---|
| 1 | `thincoder-core/manifest-schema.mjs` | `DEFAULT_MANIFEST.docRoot` 增 `standards: null`（第六子键）。`nestedKeys` 与写面白名单都从 `Object.keys` 派生 ⇒ 自动可写，零手加白名单（§2.2 ① 的收正成立） | 产品 |
| 2 | `thincoder-core/advisor/project-context.mjs` | `injectProjectStandards` 三态实现 · 新增常量 `STANDARDS_UNREADABLE_NOTICE` / `STANDARDS_PARTIAL_NOTICE` · 预算算式复用同两条常量、逐注入独立计算 · 本面专用 PARTIAL 截断句（含被截断那份的绝对路径）· 模块头注与函数 JSDoc 收正 | 产品 |
| 3 | `thincoder-core/agent-tools/manifest.mjs` | 头注 12 可写节点 → 13、`docRoot.*` 五子键 → 六子键 | 产品 |
| 4 | `thincoder-core/tool-docs/manifest.md` | `:24` 计数 12 → 13 / 5 → 6；键目录增 `docRoot.standards` 一行（值 = **文件**路径，默认 `null`） | 产品（描述档） |
| 5 | `test/RTM.md` | 新增 §24 三行（24-1 / 24-2 / 24-3，证据档 = 下条集成档） | 测试（集成索引） |
| 6 | `test/integration/review-standards-injection.test.mjs` | 新建——24-1 … 24-3 三例；断言面 = 发给模型的评审消息 | 测试（集成） |
| 7 | `docs/batches/2026-11-01-project-standards-declaration.test.mjs` | 新建——一次性单元测试档（T87–T92 + AC-51 … AC-57，16 例；收口即删） | 测试（单元） |

### 5.2 逐条验收对照

| 设计条目 | 落地位置 | 机检 |
|---|---|---|
| E1 态 3 注入正文 | `project-context.mjs` 态 3 分支 | T87 · AC-51 格 4 · 集成 24-1 |
| E2 态 1 = `NO_STANDARDS_NOTICE`（负向锁） | 原句零改；`paths.length === 0` 硬不变量 | T89 · T90 · AC-52（夹具 + 源码面临界段扫描）· 集成 24-3 |
| E3 态 2 点名路径 + 原因，与态 1 可机判区分 | `STANDARDS_UNREADABLE_NOTICE` | T88 · AC-51（三态两两不等）· 集成 24-2 |
| E4 键进 schema / 默认值 / 白名单 | 第 1 档 + 第 3、4 档计数同改 | AC-55（写面往返 + 非法形态拒且盘零变） |
| E5 注入预算 + 本面截断句 | 两条常量复用、逐注入独立 | AC-53（超帽 / 未超帽 / 星平面 / 多份四格） |
| E6 本仓自用声明 | **未落**——设计行 5 指定主 agent（写门 `main`），见 5.7 ① | —— |
| E7 需求档 §5.1 收正 | 设计轮已落（`docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1） | 本轮零改 |

副作用三锁另测：AC-54 ① 评审根逐项等值 · ② `standards = null` ⇒ 索引范围逐项等值 · ③ `declared` 旗不变。

### 5.3 实施期的判断（设计未逐处锁死、由本席定的点）

| # | 点 | 取法与理由 |
|---|---|---|
| 1 | 态 2 / 半读 / 截断句里的路径写法 | 取**正斜杠绝对形**（`D:/…/docs/nope`）。AC-51 要求「态 2 句必含绝对路径」，T88 又要求句含 `docs/nope` 字面——正斜杠形式同时满足；与同档 `injectProjectGuide` 根注记的写法同款（`relative(...).split(sep).join("/")`）。读盘仍用原样路径 |
| 2 | 注入面返回值 | 态 3 单份 ⇒ 串（T87「返该档绝对路径」），多份 ⇒ 数组；降级 ⇒ `null`。生产调用点不消费该返回值，形态只在 JSDoc 与单元用例上成契约 |
| 3 | 截断计量单位 | 门与「N of M」读数与切片统一为**码点**（评审发现 #5 之后的修正，见 5.6） |
| 4 | 集成例的进入口 | 工程模式 + `batchDoc` 绑定 + 真 `advisor` 工具；每一例用**独立 agent**——同实例的第二次设计评审走收敛面，而注入面只在第一轮（三面共用的既有结构，本批零改） |
| 5 | 24-1 的第二半 | 「返该档绝对路径」在集成例内以同夹具直调注入面断（评审消息组装面不外露返回值）；评审已登记该行两层混写（发现 #8），未改行文——行文由设计档定死 |

### 5.4 验证读数

- 单元：`node --test docs/batches/2026-11-01-project-standards-declaration.test.mjs` ⇒ `tests 16 / pass 16 / fail 0`
- 集成全表：`node test/run.mjs` ⇒ `tests 82 / pass 82 / fail 0`（含本批 24-1 … 24-3 三例）
- 文档门：`doc_check gate`（`test/RTM.md` · `thincoder-core/tool-docs/manifest.md` · `thincoder-core/tool-docs/manifest-read.md`）⇒ `DOC-CHECK GATE: PASS`，3 档全清
- 已知代价实测（新进程读数）：本仓 `readManifest` 现报 `missingKeys: ["docRoot.standards"]`；自愈路径 = 本仓写一次声明（5.7 ①）

**未集成验证的部分**：真模型下的评审端到端（本批三例用本机假 SSE 端点，零外网、零付费端点）；父侧收口跑一次全表即本批的集成读数。

### 5.5 清单外改动（逐条报明，两条）

| 文件 | 改动 | 为什么必需 |
|---|---|---|
| `thincoder-core/tool-docs/manifest-read.md` | `:1` 的 docRoot 面枚举补 `standards = 项目标准档（文件路径）` | 该枚举原到 `batches` 为止；第六子键入 schema 后此处即成漏项。设计档 §2.12 受影响文件表行 4 只登记了 `thincoder-core/tool-docs/manifest.md`（设计表缺口，见 5.7 ③） |
| `thincoder-core/advisor/messages.mjs` | `:158-160` 调用点注释收正为三态描述 | 原注写「标准面无派生名、故恒显式降级」，本批实现后即假话——与设计档行 2 要求收正 `project-context.mjs` 头注/JSDoc 同一理由。零语义 |

### 5.6 审计 / 评审轮次与自修轮

| 环节 | 轮次 | 结论 |
|---|---|---|
| 内部审阅（只读 explore 审计，对象 = §2 + 设计档 §2.12） | 1 | 行为零偏离；1 项 🟡 = `thincoder-core/tool-docs/manifest-read.md` 清单外改动（5.5 已报）；4 项 🔵（2 项本轮已修，2 项属设计档面已登记） |
| advisor 代码评审（`type=code`，8 档 + 设计档/批档作验收上下文） | 1 | `VERDICT: pass`；8 条发现全为 🟡/🔵，无 must-fix |
| 自修轮 | 2 | 见下 |

**终态 = `clean`**（无 must-fix 遗留、无 🔴；设计档面遗留与父侧待办已逐条登记在 5.7）。

自修轮 1（审计驱动）：

- `test/RTM.md` §24 节注回指由「验收 ④」补成「验收 ③④」——设计档集成节点名 ③④。
- 单元档补「多份声明 + 超帽」两格：锁截断指针的逐份偏移（原有两格都是单份，该分支此前无覆盖）。

自修轮 2（评审驱动）：

- `messages.mjs` 调用点注释收正（5.5 第 2 行）。
- 截断计量与切片统一为码点，并补星平面字符用例。修前读数（本席实算）：5000 个 emoji = 码点 5000 / UTF-16 长度 10000，门 `body.length > cap` 成立而 `[...body].slice(0, 8192)` 恰得整篇 ⇒ 会「正文全给却报 PARTIAL」；修后门 `[...body].length > cap` 不成立 ⇒ 整篇、零 PARTIAL。该用例修前红、修后绿。

### 5.7 留给父侧（四条，均非本席写域）

1. **[上抛·知会] 本仓自用声明（§2.1 E6）**：`manifest write key=docRoot.standards value=docs/core/requirements/METHODOLOGY.md`。设计行 5 指定主 agent（写门 `main`），落盘后 5.4 的 `missingKeys` 噪音自愈。**本仓现在还没这一键**——即「我们自己还没验过」这件事仍未闭合。
2. **[上抛·知会] 设计档现值残留（设计席面，本批零改）**：`docs/core/design/MANIFEST.md` §2.12 的新增名三问节仍写 `DEFAULT_MANIFEST.docRoot` 五子键，而现值已为六子键。
3. **[上抛·知会] 评审登记的设计档面遗留（未改，属设计席）**：N2 = 超帽截断只点名被切断那份，切点之后的声明份既不注入也不点名（与 KD-M1-61 同类的静默丢声明）· N3 = 数据档读抛借用态 2 模板 ⇒ 句面成了「标准档声明在 PROJECT-MANIFEST.json」· §2.12 受影响文件表缺 `thincoder-core/tool-docs/manifest-read.md` 一行。
4. **[上抛·知会] `test/RTM.md` §24 三行的结果列**：现为待执行——集成集由父侧收口跑（本席已跑一遍 82/82 作读数），署名与结论由父侧填。

## §6 验证与收口（父代理）

### 6.1 父侧复跑（收口轮实读）

| 读什么 | 命令 / 方式 | 读数 |
|---|---|---|
| 本批单测（一次性） | `node --test docs/batches/2026-11-01-project-standards-declaration.test.mjs` | **tests 16 / pass 16 / fail 0** |
| 仓根集成层 | `node test/run.mjs` | **tests 82 / pass 82 / fail 0**（含本批 24-1…24-3） |
| **注入面端到端**（本仓自用） | 调 `injectProjectStandards({cwd: 仓根}, parts, 仓根)` | 返回 `…\docs\core\requirements\METHODOLOGY.md` · **8472 字符** · **不再是「No project standards document」** · 正文首段 = `# 方法论（METHODOLOGY）· 需求` |
| 计数同改 | `thincoder-core/tool-docs/manifest.md` 实读 | `the 13 writable nodes … docRoot's 6 sub-keys` |
| 本仓子键 | `PROJECT-MANIFEST.json` 实读 | `requirements / specs / design / modules / batches / **standards**` |
| 文档机检 | `doc_check gate` | **PASS** |

**第三条是本批真正的验收**：`docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1 治的是「这条评审维度对任何项目都是空的」——**它现在对我们自己就先不空了。**

### 6.2 E6（本仓自用声明）由父侧落笔

**设计第 5 行指定主 agent（写门 `main`），实施席无该写路径 —— 本条由父侧落。**

```
manifest write key=docRoot.standards value=docs/core/requirements/METHODOLOGY.md
```

**会话面的一处说明（据实记）**：本会话的 `manifest` 工具仍加载着**启动时的旧 schema**，直接调它会被拒（`key "docRoot.standards" is not writable`）—— **那是会话陈旧，不是代码没落**。落笔走的是同一个写门本体：`thincoder-core/manifest.mjs` 的 `writeManifest(root, next, { writer: "main" })`，写后回读 `ok = true`、`missingKeys = []`（写前含 `docRoot.standards`）。

**下次重启会话后，`manifest write` 会把同一件事报成正常可写 —— 无需再走这条绕道。**

### 6.3 四条上抛的处置

| # | 上抛项 | 处置 |
|---|---|---|
| 1 | E6 本仓自用声明未落 | **父侧已落**（§6.2），读数见 §6.1 |
| 2 | `docs/core/design/MANIFEST.md` §2.12 新增名三问节仍写「五子键」，现值六 | 登 `#1948`（设计席笔） |
| 3 | 评审登记但未改的三处：N2 超帽截断只点名被切断那份 · N3 数据档读抛借用态 2 模板（句面成「标准档声明在 `PROJECT-MANIFEST.json`」）· 受影响文件表缺 `thincoder-core/tool-docs/manifest-read.md` 一行 | 登 `#1948`（**N2/N3 是设计评审判为 advisory 的两条，不是漏做**——本批按设计裁决落，改正留给设计席） |
| 4 | `test/RTM.md` §24 三行结果列 `待执行` | **用户签署面**，本批不代签（与 `#1921` ∥ 五面批同口径） |

### 6.4 清单外改动（实施席主动报的两处，父侧采认）

| 档 | 改动 | 为什么必须动 |
|---|---|---|
| `thincoder-core/tool-docs/manifest-read.md:1` | docRoot 面枚举补 `standards` | 该档枚举到 `batches` 为止；第六子键入 schema 后**它就成了漏项** —— 描述面少一面，模型读它会以为只有五个 |
| `thincoder-core/advisor/messages.mjs:158`-`:160` | 调用点注释改三态描述 | 原注释写「标准面无派生名、故恒显式降级」，**本批实现后即假话** —— 留着就是又一处「代码改了、注释还在教旧行为」 |

**这类「实现一变、旁边的注释就变成假话」的面，本批抓到两处、都收了。**

### 6.5 零留存

`docs/batches/2026-11-01-project-standards-declaration.test.mjs`（一次性单测档）**收口即删**；读数留 §6.1 一行。**本批不在仓里留可执行测试件。**
