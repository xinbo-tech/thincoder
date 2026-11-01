# 2026-11-01 · project-standards-declaration
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 11:53 逐字「B」—— 在父侧给的 A（保持现状）∥ B（声明口回来）∥ C（重新猜名）三选里选了 B：manifest 上补一个「本项目的标准档在哪」的声明口，有则注入、无则显式降级。。
> 台账 = #1943（ADVISOR-CONVERGENCE · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
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

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
