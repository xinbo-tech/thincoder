# 2026-11-03 · manifest-init-exemption
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-03 · 来源 = 用户 2026-11-03 05:22 裁「需求 ⑥ 对，实现有偏差」＋ 08:11「开工」。
> 台账 = #2025（— · 归批）。前情 = docs/batches/2026-11-03-write-gate-ledger-bind.md（已收口 2026-11-03）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-03
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 已定决定

- **已定决定**：`manifest({action:"init"})` 豁免的判据点 = **`ledgerGateApplies` 对 `manifest` 收窄为「`write` 要号 ∥ `init` 不进本门」**（从 `MANIFEST_WRITE_ACTIONS` 摘掉 `init`），并同步 `thincoder-core/tool-docs/manifest.md` 的要号句 · 用户原话：「需求 ⑥ 对，实现有偏差」＋「开工」 · 时间：2026-11-03 08:11
- **已定决定**：本批不拆档（`write-gate.mjs` 510 行不搬写锁段）—— 一条目标换面不混拆单 · 父侧裁定 · 时间：2026-11-03 08:11
- **已定决定（修正）**：`manifest({action:"init"})` 的豁免 = **条件形（决策 43 原形）**——`init` 保留在 `MANIFEST_WRITE_ACTIONS`（首轮「摘 init」那点撤销），豁免支开在门体取根步：`init` ∧ target 沿祖先链取不到项目根 ⇒ 不进本门（无账可问）；target 取得到根（含既有项目内的子目录自举）⇒ 本门照判（要号）；target 自身已有 manifest ⇒ 工具自身拒（`init never overwrites`），本门不另加判 · 评审 #14 🔴1 判首轮形状（摘 init = 无条件形）比决策 43 宽一档、项目内 init 会逃门 ⇒ 收正 · 时间：2026-11-03 08:32

## 判据单源与实读

- **设计档**：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 决策 43 逐字「**`manifest` 的 `init` 不进本门（决策 43）**：`manifest({action:"init"})` ∧ 目标无项目根 ⇒ 不进本门（无账可问）；目标已有 manifest ⇒ 工具自身拒（`init never overwrites`），本门不另判；`write` 仍照判（要项目、要号）。」
- **实现现状**：`thincoder-core/agent/write-gate.mjs:201` 逐字 `const MANIFEST_WRITE_ACTIONS = new Set(["init", "write"])`；`:406` 逐字 `if (toolName === "manifest") return MANIFEST_WRITE_ACTIONS.has(String(args?.action ?? ""))` ⇒ `init` 也在要号集里。
- **为什么要号的第二层也拆**：目标目录无 manifest 时 `resolveProjectRoot` 取不到根 ⇒ 就算给号也读不到那本账 —— 两层都断，豁免必须两层都开。

## 范围

- 修两个判据点（`MANIFEST_WRITE_ACTIONS` 摘 `init` ∥ `ledgerGateApplies`/或判据点行对 `init` 的取根豁免）＋ 描述面一句。
- 零碰：`write-gate.mjs` 拆档（`#2020`）∥ 评审链 ∥ 其它工具。

**覆盖账** = #2025（本批自开行——「manifest init 豁免」此前无行；旧行 #2022 为父侧自撰措辞的记录行，已废弃并入本批）

## 收口前终态

- **实施交付**：✅（#18 三档 + RTM 12-15 载体 + 单测档；父侧四点全实读复核）
- **评审链**：✅ 轮 1 changes-required → 修正 → 轮 2 pass → 修正轮 2 三点落 → §3 = 评审通过（pass ×2）
- **零碰确认**：`MANIFEST_WRITE_ACTIONS` ∥ `ledgerGateApplies` ∥ `shared.mjs` 的 `LEDGER_PARAM_DESC_MANIFEST` ∥ 拒文三件式 —— 全部未动（父侧实读）

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
**覆盖账** = #2025（本批自开行——「manifest init 豁免」此前无行；旧行 #2022 为父侧自撰措辞的记录行，已废弃并入本批）。
**台账 evidence 修正 = 父侧笔，设计席不碰台账。**

**设计档落点 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`，七处**（本轮七处已全部落盘，本节为验收与判定句的指针页）：

- `§2.3` 判据表 manifest 行 ∥ 扫描表 manifest 行
- `§3` 受影响表 manifest 两行
- `§4` 决策 43 全拍（正文 ∥ 边界 ∥ 最近先例 ∥ 调研证据）
- `§5` R2 ⑭ ∥ R33 init 自举面
- `§9` 12-15 delta 块

**机制设计（条件形——豁免支开在门体取根步；§1 已定决定修正形）**：

- `MANIFEST_WRITE_ACTIONS` 不动：`init` ∥ `write` 都留在要号集，`read` 本就不要号。
- 门体定位参数取根路径加豁免支：`init` ∧ target 沿祖先链取不到项目根 ⇒ 该目标不进本门（零拒、零号——无账可问）。
- target 取得到根（含既有项目内的子目录自举）⇒ 照判要号；target 自身已有 manifest ⇒ 门过后由工具自身拒（`init never overwrites`——落点解析到祖先项目根，`thincoder-core/agent-tools/manifest.mjs:160`）。
- 边界：裸 `init`（无 `target` 又无 `project`）照拒（`no project on this call`）；带 `project` 的 `init` 只在 target 缺位时参与判定；target 在场时 `project` 不参与判定（既有规则——定位参数优先）；豁免只按 target 沿祖先链取不取得到根判，带 `project` 不改豁免结果（带 project 的仓外 init ⇒ 照跑落盘——该格断言落设计档 §5 R33 ∥ RTM 12-15）。
- 理由 ∥ 被拒替代 ∥ 最近先例 ∥ 调研证据 = 设计档 `§4` 决策 43 全拍。

**判据点（两处）**：

1. `thincoder-core/agent/write-gate.mjs` 门体取根步：`ledgerGateApplies` 的 manifest 分支不动（仍按 action 集判）；豁免支落在定位参数取根拒臂——`write-gate.mjs:502`–`:508` 的 `for (const p of claim.paths)` 循环里 `resolveProjectRoot(p)` 取不到根那一步，仅当 `action === "init"` 时跳过该拒臂。
2. `thincoder-core/tool-docs/manifest.md` 的 `ledger` 参数句替换（逐字；与设计档 `§3` 受影响表 manifest 两行同口径）——替换句：

```text
**`ledger`** — the in-flight ledger row this call serves: `"#N"` or `"N"`. In engineering mode the parent agent must pass it for `write`; for `init`, only when the target sits inside an existing project (a `PROJECT-MANIFEST.json` exists on its ancestor chain) — a bootstrap outside any project needs none; omitted when required = refused. `read` does not need it.
```

**受影响文件（两档 ＋ 一处不动）**：

- `thincoder-core/agent/write-gate.mjs` — 改造（判据点 1）；该档 manifest 的 JSDoc 句（「manifest 只 init ∥ write 要号」）随正为条件豁免句（实施席笔）。
- `thincoder-core/tool-docs/manifest.md` — 改造（判据点 2，替换句如上）。
- `thincoder-core/tools/shared.mjs` 的 `LEDGER_PARAM_DESC_MANIFEST` 不动——schema 面枚举口径照旧（init 留在要号集，豁免在门体）。
- 测试覆盖：本批单测档 = `docs/batches/2026-11-03-manifest-init-exemption.test.mjs`（与批档同名同目录，随本批收口删除）；RTM 12-15 行已立（`test/RTM.md` 编号先定、用例标题随实施轮落）。

**验收对照（判据正文 = 设计档，此处引点）**：

| 条目 | 判据 |
|---|---|
| 门体取根步 `init` 豁免支 | 设计档 `§5` R33 init 自举面三格（RTM 12-15 同三格）：祖先链无 manifest ⇒ 照跑、`PROJECT-MANIFEST.json` 落盘；项目内 target 不带号 ⇒ 拒（`no ledger number on this call`）；带号 ⇒ 门过后工具拒（`init never overwrites`）。`write` 不带号仍拒（R2 ⑭ 原格零改） |
| 描述面要号句 | `thincoder-core/tool-docs/manifest.md` 含判据点 2 的逐字句 |
| 回归 | R2 ⑭ 原两格照旧（`write` 拒 ∥ `read` 照跑）；R2 其余格与既有 RTM 行零改 |

**上抛项**：评审 #14 九条已全裁全落；评审轮 2 五条全落——🟡1 本节边界句合成规则 ＋ 设计档 §5 R33 补「带 project 的仓外 init」断言格、🟡2 §4 修正指针（父侧笔）、🔵3 ∥ 🔵4 `test/RTM.md` 节注计数词「十五态」＋ 目的句 init 自举指针（本轮顺手收，实施席读 RTM 时不再撞旧计数）、🔵5 照记无动作；`#2025` 台账 evidence 修正待父侧笔。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

评审对象 = manifest init 豁免实施批设计（批档 §1/§4 ＋ 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 决策 43）。两份评审范围档已全文复读；以下引用均为盘上逐字连续摘引，不带行号。

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 判据单源一致性 | 🔴 | 豁免判据在两份在盘档里不是同一个谓词。设计档决策 43 正文逐字：「`manifest({action:"init"})` ∧ 目标无项目根 ⇒ 不进本门（无账可问）；目标已有 manifest ⇒ 工具自身拒（`init never overwrites`），本门不另判；`write` 仍照判（要项目、要号）。」——条件形；同档工具表同一判据点逐字：「**`action:"init"` 是唯一例外**（目标无项目根时不进本门，见下条）」——同为条件形。批档 §1 已定决定逐字：「从 `MANIFEST_WRITE_ACTIONS` 摘掉 `init`」、§4 批准首条逐字：「MANIFEST_WRITE_ACTIONS 摘 `init`（`write` 仍要号）」——无条件形（init 永不进本门）。两形在一个输入格上分叉：init 的 target 落在既有项目之内（祖先链取得到根、target 自身无 manifest）——设计档自己的取根语义是沿祖先链（情形表逐字：「逐目标各自沿祖先链取根：写盘七件的目标路径 ∥ `execute.workdir` ∥ `git.path` ∥ `git.workdir` ∥ `manifest.target`」）⇒ 条件形下该格本门照判（要号）；无条件形下本门对 init 整段跳过 ⇒ 项目内字节零账落盘。该格的处置两份档都没写；工具侧在两档里只点名过 `init never overwrites` 一条拒绝，未见任何「祖先已有 manifest 即拒」的守卫（此点 unverified，评审范围内无法证实该格不可达）。连带第二点：批档实读引句 `if (toolName === "manifest") return MANIFEST_WRITE_ACTIONS.has(String(args?.action ?? ""))` 表明 manifest 的门判据 = action 集成员、与路径无关 ⇒ 摘 init 落地后门体（含取根）对 init 不再运行，批档第二点「取根豁免」成为死支；批档理由句「目标目录无 manifest 时 `resolveProjectRoot` 取不到根 ⇒ 就算给号也读不到那本账 —— 两层都断，豁免必须两层都开」与该代码形相抵。另：批档引决策 43 标「逐字」但只引到「（无账可问）」为止，后面两句豁免边界（已有 manifest ⇒ 工具拒 ∥ write 仍照判）被截掉——形状漂移正始于此截引。 | 二选一并让每一处说同一句话：要么照决策 43 的条件形落——init 保留在要号集、只在「取不到根」那一步豁免（撤掉摘 init 那一点）；要么把决策 43 显式修成无条件形并把口径变化记成用户裁定。无论取哪形：在决策 43 的豁免边界与 R33 里点名「target 落在既有项目内」一格的处置；把批档两点范围收到所选那一形上，不让死支落盘（若第二点确有第二个活消费点，把该点与判据写出来）；扫描表与工具描述指令行两处旧句同笔收口。 |
| 2 | 集成测试设计 | 🔴 | 本变更没有任何一层带 RTM delta 记账。设计档 §9 的逐变更块（§3 写入闸 ∥ 笔-账绑定 ∥ git 纳入 ∥ 项目声明面 R30–R33 等）无一处提到 manifest init；故事 12 盘面读数逐字「含故事 12 的 12-1 … 12-13 十三行」（后续块加 12-14）——无 init 行；批档自身无集成节。而本变更改的正是业务可观察结果：工程模式父侧 `manifest init` 不带号从「拒」（用户 2026-11-03 05:22 裁的实现偏差现场）改「照跑」；决策 43 自己的理由句说这条路产品必需（「不豁免则工程模式父侧**永远建不出新项目**」），且它是生产真出过的问题（05:22 裁决即其复现）——按设计档自立的入行两门槛（产品真需要的业务场景 ∥ 生产真产出的问题）两条都命中 ⇒ 该有行而缺行、缺字无一处记。R33 的 init 自举格只是机检判据；本项目单测档惯例收口即删（设计档逐字「与批档同名同目录，随本批收口删除」）⇒ 不补 RTM 行，此结果收口后没有任何存续验收。 | 补本变更的 delta 三问记账（破/冗余/缺）＋入行：编号先写进 `test/RTM.md` 再写用例标题；行内容如——工程模式父侧、target 祖先链无 manifest、`manifest init` 不带项目不带号 ⇒ `PROJECT-MANIFEST.json` 落盘（不进本门）；格 1 所定「项目内 target」格的处置一并入行；同时点名本批可跑验收（单测档或当轮实跑的检查与其结果），不以全量套件充当验收。 |
| 3 | 文档卫生 | 🟡 | 设计档内还有两处「init 要号」的活面孔未随决策 43 收掉：入口集扫描表 manifest 行逐字「`init` ∥ `write` 要号；`read` 不要号。」；工具描述档指令行逐字「`manifest` 档写「仅 `init` ∥ `write` 要号」」——后者是给实施席的规范性指令，照抄即把错句写进 `thincoder-core/tool-docs/manifest.md`；R2 ⑭ 标签「`manifest` 写型要号、读型不要」同病。本批范围只同步运行态描述档，设计档这两处不在批内。 | 随本批或合并轮把三处一并改到与决策 43 同一口径；至少在批档上抛项登记，防下一个实施席照旧句落笔。 |
| 4 | 清晰度 | 🟡 | 描述面要改的整句没有给：批档只写「要号句同步」，替换句缺位——本项目描述面改动惯例是逐字给句（同档 `PROJECT_PARAM_DESC` 等皆逐字给出）。 | 把 `thincoder-core/tool-docs/manifest.md` 要号句的替换整句逐字写进批档设计面（与格 1 所选形状同口径）。 |
| 5 | 批档记法 | 🟡 | 批档 §1 缺 `覆盖账` 行——设计档 §2.4 定它「恒写、单行、无注释」，自开行的档也要写；档头「台账 = #2025（— · 归批）」形似自开行 ⇒ 应写 `覆盖账 = #2025`。缺它则「认领已有的活，不新建台账行」的铁律不可审（需求 ⑥ 的债是否已有旧行、本批为何自开，档面无一处交代）。另 §1 状态行括注是字面「…」占位。 | §1 补 `覆盖账 = #2025`（若实为接管旧行则列全）＋一行覆盖/自开理由；状态行括注换实文。 |
| 6 | 方法论 | 🟡 | §2（eng-designer 段）在评审时点仍是模板占位、未落一字——机制设计 ∥ 受影响文件与测试覆盖 ∥ 验收对照眼下散在 §1、§4 与设计档决策 43 三处，实施席没有单一落点。 | §5 开工前把 §2 落成（或明示本批设计面 = §1 ＋ §4 ＋ 决策 43），把两点判据点、两档受影响文件与验收口径收拢。 |
| 7 | 最近先例 | 🟡 | 决策 43 未带「最近先例」行——同档决策 28/32/37 各自带先例坐标与对齐/偏离（如逐字「**最近先例**：同档决策 28（`§2.6`，同批裁定）。」）；该项目对无先例要求显式声明。 | 决策 43 补一行先例坐标＋对齐/偏离理由，或显式「无先例」声明。 |
| 8 | 调研证据 | 🔵 | 决策 43 自身无调研证据行；档级 §1 的调研证据块成文早于该决策。缺行会被读成「未调研」。 | 决策 43 补一句调研记录（查无相关也照记）。 |
| 9 | 评审语境 | 🔵 | 评审语境局限照记：本评审未拿到 document map（语境扫描报「无」）与项目标准档——档归属判据只能靠项目指南（其点名 `thincoder/docs/README.md` 为逐档权威地图）与设计档自述的「档归属」段。 | 无需动作；后续批次定位拥有档时仍以 `thincoder/docs/README.md` 为准。 |

计数：🔴 2 · 🟡 5 · 🔵 2

VERDICT: changes-required

### 轮次 2（评审子代理）

评审对象 = 第 1 轮九条的落地验证（条件形全拍 ∥ RTM 12-15 ∥ 旧句收口）。评审范围三档全文复读：批档 `docs/batches/2026-11-03-manifest-init-exemption.md` ∥ 设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` ∥ `test/RTM.md`；以下引文均为盘上逐字连续摘引，不带行号。第 1 轮 8 条验项逐条对盘（🔵9 评审语境局限已照记，不重开）。

**验项落盘核对（第 1 轮 → 本轮）**

- 🔴1 条件形全拍 = 已落。设计档决策 43 豁免边界逐字「豁免边界（条件形——豁免支开在门体取根步）」；`§2.3` 判据表 manifest 行逐字「`action:"init"` 的豁免 = 条件形（决策 43）」；扫描表 manifest 行逐字「`write` 要号；`init` 条件豁免（豁免支在门体取根步——决策 43）；`read` 不要号」；决策 39 逐字「`init` 要号与否由决策 43 的取根豁免定」；`§3` 受影响表 manifest 行逐字「`init` ∥ `write` 进本门（`init` 的豁免支在门体取根步——决策 43）、`read` 不进（决策 39）」；R2 ⑭ 标签逐字「**`manifest` 写型要号、读型不要、`init` 条件豁免**」；工具描述指令行改「`write` 要号；`init` 仅当目标在既有项目内（祖先链上有 `PROJECT-MANIFEST.json`）才要——祖先链无 manifest 的自举不要；`read` 不要」；批档 §1 已定决定（修正）逐字「`init` 保留在 `MANIFEST_WRITE_ACTIONS`（首轮「摘 init」那点撤销）」；批档 §2 逐字「`MANIFEST_WRITE_ACTIONS` 不动：`init` ∥ `write` 都留在要号集」。「唯一例外」旧句在设计档零命中；首轮「死支」形态按批档 §2 判据点 1 自述（「`ledgerGateApplies` 的 manifest 分支不动（仍按 action 集判）」）不复出现——init 留在要号集 ⇒ 门体含取根步对 init 照跑，豁免支是活支。
- 🔴2 RTM delta = 已落。设计档 `§9` 新增块逐字「**`manifest` init 取根豁免（决策 43 修正轮 · 2026-11-03 批）的 RTM 答复——破 0 / 冗余 0 / 改 0 / 增 1**」，12-15 行四列齐（交互 ∥ 业务可观察结果 ∥ 进入口 ∥ 服务条目 = R2 ⑭ · R33）；`test/RTM.md` 故事 12 已立 12-15 行（编号先定，用例标题随实施轮落）；9-1 的可达性变化如实记（逐字「该行由按现行码必红变为可达」）；批档 §2 验收对照点名本批单测档 `docs/batches/2026-11-03-manifest-init-exemption.test.mjs`（随收口删除），未以全量套件充当验收。
- 🟡3 旧句收口 = 三处全改（扫描表 ∥ 工具描述指令行 ∥ R2 ⑭ 标签），与决策 43 同一口径。
- 🟡4 逐字句 = 批档 §2 已给 `thincoder-core/tool-docs/manifest.md` 要号句替换整句（```text 块逐字），与指令行同口径（write 恒要 ∥ init 仅既有项目内 ∥ read 不要）。
- 🟡5 批档记法 = §1/§2 均有「**覆盖账** = #2025」行＋自开理由（旧行 #2022 已废弃并入本批）；§1 状态行括注已换实文。
- 🟡6 §2 落成 = 设计档落点七处、机制设计、两判据点、受影响文件（两档＋一处不动）、验收对照表、上抛项俱全；七处逐一在盘核实（判据表 ∥ 扫描表 ∥ 受影响表两行 ∥ 决策 43 全拍 ∥ R2 ⑭ ∥ R33 ∥ §9 delta 块）。
- 🟡7 最近先例 = 决策 43 带先例行，逐字「**最近先例**：同档决策 37（`git` 按枚举 action 判写型，`§2.3`）。」＋对齐与偏离理由（逐字「豁免落在门体取根步，不是把枚举值摘出要号集」）。
- 🔵8 调研证据 = 决策 43 带调研行，逐字「**调研证据**：查无相关」。

**本轮新发现**

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 清晰度 | 🟡 | 输入格「`init` ∧ target 沿祖先链取不到根 ∧ 另带有效 `project`」的处置无一处置名。批档 §2 边界句逐字「带 `project` 的 `init` 走声明面照判——声明无效照决策 41 拒，豁免不覆盖声明面。」最自然被读成「带 project 的 init 一律照判（要号）」；而判据点 1 的豁免支只按「target 取不到根 ∧ `action === "init"`」开门、不问是否另带 project，设计档自己的优先规则（逐字「定位参数优先于 `project`：两者同时在时以定位参数为准（它决定字节落在哪），`project` 只补位」）⇒ 该格应走豁免、自举照跑。两种读法在同一输入上分叉，其一把本批要修的自举场景在「恰好带了 project」的调用上重新关死。 | 批档 §2 边界句补一句合成规则：「带 `project` 的 `init`」只指 target 缺位的形；target 在场时 `project` 不参与判定（既有规则），豁免只按 target 沿祖先链取不取得到根判——并在 R33 或 12-15 补该格断言（带 project 的仓外 init ⇒ 照跑落盘）。 |
| 2 | 文档状态 | 🟡 | 批档 §4 批准范围首条仍逐字「`MANIFEST_WRITE_ACTIONS` 摘 `init`（`write` 仍要号）。」——首轮形状，已被 §1 已定决定（修正）撤销。§4 无修正标记，单独读 §4 的实施席会把撤销形当批准范围。规范面（§1 修正 ∥ §2 ∥ 设计档）三处同拍条件形，故非双活矛盾，落文档状态滞后。 | §4 追加一行修正指针（append-only，不改既有行）：批准范围以 §1 已定决定（修正）（2026-11-03 08:32）为准——条件形、`MANIFEST_WRITE_ACTIONS` 不动。 |
| 3 | 数字漂移 | 🔵 | `test/RTM.md` 故事 12 节注计数词逐字「十四态（行序）=」而同一清单实列至「12-15 边界」共 15 项——计数词停在增行前；设计档 §9 同块记「增 1 行（现盘读数 109 ⇒ 110）」，节注计数未随行。 | 节注计数词改「十五态」。 |
| 4 | 文档卫生 | 🔵 | `test/RTM.md` 故事 12 目的句逐字「工程模式下父侧的每一次落盘、每一次 `bash` / `execute` 都要带 `ledger:"#N"`」——本批之后对「init 自举」一格过宽（那一笔既不要号也不要项目，同节 12-15 行已记例外），节的导向句与行判据差一格。 | 目的句尾补一短指针（如「`init` 自举一格见 12-15」），或明确依赖 12-15 行不动——两选一，保节内自洽。 |
| 5 | 评审语境 | 🔵 | 照记（不重开）：本评审仍未拿到 document map（语境扫描报「无」）与项目标准档——档归属判据降级为按项目指南（其点名 `thincoder/docs/README.md` 为逐档权威地图）与设计档自述「档归属」段判；本轮受触面（决策 43 ∥ `§2.3` 两表 ∥ `§3` ∥ `§5` R2 ⑭ / R33 ∥ `§9`）全在设计档自述归属内，无归属冲突。 | 无需动作。 |

计数：🔴 0 · 🟡 2 · 🔵 3

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-11-03 05:22 裁「需求 ⑥ 对，实现有偏差」＋ 08:11「开工」——整批令覆盖批准门。

**批准范围**：`manifest init` 两层豁免落实现：

- `MANIFEST_WRITE_ACTIONS` 摘 `init`（`write` 仍要号）。
- 目标目录无 manifest 时 `init` 不进本门（判据点取不到根那条路一并开）。
- 描述面 `thincoder-core/tool-docs/manifest.md` 的要号句同步。
- 本批不拆档。

**判据**：设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 决策 43 ＋ 批档 §1 范围四条。

- **批准修正（指针 · 评审 #16 🟡2）**：上列批准范围首条「`MANIFEST_WRITE_ACTIONS` 摘 `init`（`write` 仍要号）」为首轮形，已由 §1 已定决定（修正）（2026-11-03 08:32）撤销；批准范围以该修正为准——条件形（决策 43 原形）、`MANIFEST_WRITE_ACTIONS` 不动、豁免支开在门体取根步 · 用户整批令（「开工」）覆盖不变 · 时间：2026-11-03 09:35

## §5 实施记录（eng-coder）

## 实施记录（eng-coder · 台账 #2025）

单测档 = 本批同名同目录 `.test.mjs`（收口即删）。

**落地面（批档 §2 判据点两处 + 单测档）**：

| # | 状态 | 要点 |
|---|---|---|
| 1 | ✅ 完成 | `thincoder-core/agent/write-gate.mjs` — 门体取根步（定位参数循环 `for (const p of claim.paths)`）加 `init` 豁免支：`resolveProjectRoot(p)` 取不到根 ∧ `args.action === "init"` ⇒ 该目标不进本门（返回 null——无账可问）；取得到根 ⇒ 照判要号（既有行零改） |
| 2 | ✅ 完成 | 同上——`MANIFEST_WRITE_ACTIONS` 与 `ledgerGateApplies` 的 manifest 分支零改（决策 43 条件形：豁免在门体取根步，不摘枚举值） |
| 3 | ✅ 完成 | 同档 JSDoc 句随正：「`manifest` 只 `init` ∥ `write` 要号」→「`init` ∥ `write` 都要号——`init` 的豁免是条件形（决策 43），不是摘出要号集」 |
| 4 | ✅ 完成 | `thincoder-core/tool-docs/manifest.md` — `ledger` 参数句按批档 §2 的 text 围栏逐字替换（write 恒要 ∥ init 仅目标在既有项目内 ∥ bootstrap 不要 ∥ read 不要）；行改成列表项（doc-check 段落阈值——句子逐字未动） |
| 5 | ✅ 完成 | 单测档三测全绿：R33-① 仓外自举（裸 init 落盘 + 带 project 结果不变）· R33-② 项目内子目录自举（不带号拒 / 带在途号门过后工具拒、manifest 字节零改）· R33-③ 回归（write 拒 ∥ read 照跑 ∥ 别家号仍拒） |

**范围外文件（本席改动 + 理由）**：

| 档 | 改动 | 理由 |
|---|---|---|
| `test/integration/batch-live-batch-lock.test.mjs` | 新增 12-15 用例（三格：仓外自举照跑落盘 ∥ 项目内子目录不带号拒 ∥ 带在途号门过后工具拒 `init never overwrites`、字节零改）；`toolMapOf` 补 `manifestTool` | 批档 §2「用例标题随实施轮落」——12-15 用例本体在本实施轮落；`manifestTool` 入表是让用例经 `executeToolCalls` Phase 1 真门进 |

**验证（全部实跑）**：

- `node --test docs/batches/2026-11-03-manifest-init-exemption.test.mjs` ⇒ tests 3 / pass 3 / fail 0
- `node --test test/integration/batch-live-batch-lock.test.mjs` ⇒ tests 15 / pass 15 / fail 0（12-1 … 12-14 回归零红 + 新 12-15 绿）
- 改后档回读核对：豁免支逐字在盘（`write-gate.mjs` 定位参数循环内）、JSDoc 句已正；两改档 `node --check` 语法 OK

**边界复核（与批档 §2 逐条对）**：

- 裸 `init`（无 target 无 project）仍走 `{none:true}` 拒（`no project on this call`）——豁免支不在那条路上。
- 带 `project` 的 `init` 仅 target 缺位时参与判定（定位参数优先，既有规则零改）；豁免只判 target 祖先链。
- `shared.mjs` 的 `LEDGER_PARAM_DESC_MANIFEST` 与 `MANIFEST_WRITE_ACTIONS` 未动。

**状态**：全部判据点落地、验证全绿——clean。

## §6 验证与收口（父代理）

## 验证与收口（父侧实读 · 2026-11-03 10:06）

**父侧复核（不转述实施席报告，四点全实读）：**

- **判据点 1 在盘**：`thincoder-core/agent/write-gate.mjs` 逐字 `if (String(args?.action ?? "") === "init") return null`（`resolveProjectRoot(p)` 失败臂内）；`MANIFEST_WRITE_ACTIONS` ∥ `ledgerGateApplies` 零改（父侧 node 读全文确认）；JSDoc :402 条件形句在盘。
- **判据点 2 在盘**：`thincoder-core/tool-docs/manifest.md` 逐字「must pass it for `write`; for `init`, only when the target sits inside an existing project … a bootstrap outside any project needs none」—— 与批档 §2 text 围栏同句。
- **单测父侧复跑**：`node --test docs/batches/2026-11-03-manifest-init-exemption.test.mjs` → **pass 3 / fail 0**（R33-① 自举落盘含带 project 结果不变格 ∥ R33-② 项目内两级拒 ∥ R33-③ 回归三拍）。
- **集成父侧复跑**：`node --test test/integration/batch-live-batch-lock.test.mjs` → **pass 15 / fail 0**（12-1…12-14 回归零红 + 新 12-15 绿）。

**范围外交付裁决**：实施席把 RTM 12-15 用例本体落进 `test/integration/batch-live-batch-lock.test.mjs`（§2 明示「用例标题随实施轮落」授权，属实施轮授权面内）——**认**。

**收口三问核对**：§1 修正笔三问俱全（`existing:` 形——判据点 = `resolveProjectRoot(p)` 失败臂；`name` = 逐字；`consumers` = manifest 工具全部 init 调用路径）。

**台账收口**：`#2025` 在途 → 待核销 → 已核销（见下方 ledger 调用）。
