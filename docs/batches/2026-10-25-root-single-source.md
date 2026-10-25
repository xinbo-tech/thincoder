# 2026-10-25 · 项目根解析收尾：判据真单源 + 设计档对齐
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 19:25「都做完。」+「走流程做！」——把项目根解析收尾到单源。
> 台账 = #1795（MANIFEST · 归批）。前情 = 2026-10-25-root-entries-merge.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**已定决定**：项目根解析收尾——判据真单源（台账复用归属判定）+ 归属判定不向下猜 + 设计档与之对齐。 · 用户原话：「都做完。」+「你他妈的能不能认真点！走流程做！」 · 时间：2026-10-25 19:25

**现状（父侧实读三处）**：

| # | 位置 | 问题 |
|---|---|---|
| 1 | `ledger-db.mjs:86-105` `resolveLedgerRoot` | 自己写 `for(;;)` 上溯循环——**未复用 `owningProject`**。设计档 §3.8 写「判据本体唯一，其余为形状包装或谓词注入」，实为第二份实现 |
| 2 | `manifest-discovery.mjs:145` `resolveProjectRoot` | `= projectRootView(cwd).root`；而 `projectRootView:134` 在锚无档时走 `discoverProjects(cwd)` 发现分支——**唯一项目的容器会返回那个项目的根** ⇒ 仍会「猜」。违反用户 19:09「不能跑到工作目录以外去」与「不向下取根」 |
| 3 | `docs/core/design/LEDGER.md` §3.8 / §9 | 入口表坐标错（记 104 行却引 `:127`/`:141`，实读 144 行）· §3.8 缺「在册状态」行 · §9 写「`manifest-discovery.mjs` 零改」与 §3.8 改动面（104 → ≈112）矛盾 |

**需求依据（已有，非新增）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:68`（项目 = 带 manifest 的目录）· `:72`（参数按用点解析）· `:74`（归属形：上溯取最近带档；祖链无档 ⇒ 按用点报明）。

**范围边界（不做）**：不动 `isRegistered`（已单臂）· 不动 `resolveLedgerRoot` 的 basis 语义 · 不动 `projectRootView` 的 workspace 三态读数（候选列举服务于报明）· 不动 `discoverProjects` 算法本体 · 不动 `findGuideRoot`。

**流程**：需求（本段）→ 设计（eng-designer）→ 评审（用户触发）→ 批准 → 实施（eng-coder）。**本批不做父侧直改**。

**修正要求（父侧核出，第二轮 `#10` 未覆盖 · 2026-10-25 19:35）**——三件，逐件给坐标与依据：

**① 起点优先级自相矛盾（`docs/core/design/LEDGER.md:549` vs `:553`）**

`:549` 起点表写「① 指针档文件部分（`task_book` ∥ `batch`，绝对且在盘）> ② 显式 `cwd` 入参 > ③ 会话锚」，而 `:553` 写「显式 `cwd` 入参在场 ⇒ 以它为起点（它就是本次要改的那个路径）」。两者反序。

**实际实现**（`thincoder-core/ledger-tools.mjs:272` / `:278` / `:290` / `:296` / `:298`）逐处均为 `cwd ?? cwdOf(ctx, …ptrs)` ⇒ **显式 `cwd` 优先，指针次之**。`:553` 是现行实现，`:549` 写反了。

**② 「绝对且在盘」两个条件实现里都不存在（同 `:549`）**

实读 `thincoder-core/ledger-tools.mjs:29-37` `cwdOf`：

```js
const cwdOf = (ctx, ...ptrs) => {
  for (const raw of ptrs) {
    const p = ptrPath(raw)                                  // 只剥 §N 段号
    if (!p) continue
    const anchor = ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()
    return dirname(isAbsolute(p) ? p : join(anchor, p))     // 相对路径相对锚拼接
  }
  return ctx?.agent?.cwd ?? ctx?.cwd ?? process.cwd()
}
```

不看「绝对」，不看「在盘」。设计档那句要么删、要么明确改判为「指针值只剥 `§N`，相对路径按会话锚解析」——**选哪个由设计席定，但档与码必须一致**。

**③ 补集成测试设计节（设计评审 `#7` 第 1 条 🔴，至今未处置）**

实读 `docs/core/design/LEDGER.md`：`RTM` 命中 **0**、`集成测试` 命中 **0**——全档无基于 `test/RTM.md` 的集成测试设计节。要求：逐行点 `test/RTM.md` §6 四行（6-1…6-4）与本改动的 delta（破行 ∥ 冗余 ∥ 缺失），缺该节 = 设计不合格（需求 F34）。

**修正要求（父侧裁决 · 2026-10-25 19:45 · 来源 = 设计评审轮次 1（`#14`））**——三条 🔴 全接受，逐条给依据：

**① 🔴 boundary 被「发现兜底」绕过（评审 #1，父侧实测改写）**

评审说「目标 ≠ 进程 cwd ⇒ 一律 `none`」，**实测不成立**——`projectRootView` 在 `owningProject` 返回 `null` 后走 `discoverProjects` 兜底，实测 `projectRootView(C:\Users\...\Temp\fx-xxx)`（带档 tmp 夹具）返回 `{"state":"ok","root":"…\\fx-xxx"}`。

**真问题**：`owningProject` 有界、`discoverProjects` 无界，两者在 `projectRootView` 里串联 ⇒ **边界可被绕过**，与「不向下取根」和用户 19:09「不能跑到工作目录以外去」相抵。

**要求**：设计里写清 ① `projectRootView(cwd)` 传给 `owningProject` 的 `boundary` 是什么（`cwd` 自身？会话锚？）② `discoverProjects` 兜底是否也受同一界约束——若不受，写清为何可绕过；若受，写清判据。

**② 🔴 「已注册」两写仍在（评审 #2）**

实测残留两处：
- `docs/core/design/LEDGER.md:1050`：「锚自身**已注册**（档 ∨ 库）的直接子目录」
- `docs/core/design/LEDGER.md:831`：「项目根自身**带档 / 带库**」

而 `:82`/`:819`/AC-M2-17 写「档在盘」= 实读谓词（`ledger-db.mjs:55-57`）。另 `ledger-db.mjs:63` 的 JSDoc 写「（档 ∨ 库——§2.1 单谓词）」而函数体是档臂。

**要求**：逐句点名并给出改后文字（删库臂），含 `ledger-db.mjs:63` 的 JSDoc；若库臂确要保留，声明 `ledgerChildren` 用的是另一枚显示面谓词并改名，不与「已注册」共名。

**③ 🔴 T65② 与 AC-35 相抵（评审 #3）**

- `MANIFEST.md:1189` T65②：「容器 + 恰一裸仓 ⇒ 落点 = 裸仓」
- `MANIFEST.md:1102` AC-35：「`none`（其余，含下辖带档者恰一 ∥ 裸仓恰一）⇒ 双空」

收窄后 `projectRootView(容器+恰一裸仓) = none` ⇒ 按 `MANIFEST.md:629`「`none` ⇒ init 落点 = `target` 自身」，落点变**容器**而非裸仓。两条不能同时成立。

**要求**：把 §2.10 ∥ T65 ∥ T67 加进 MANIFEST 改齐面；重写 T65②（落点改容器，或该格改判「拒」）；并明写收窄后 `manifest init` 在「容器 + 恰一子项目」上会就地使容器成为项目（`read` 经 `projectView` 仍能读到子项目、`write` 却拒——同 target 两面相反，是否有意）。

**④ 🟡 三条次要（评审 #4/#5/#6，一并处置）**：§6.1 口径 2 的 `?? resolve(cwd ?? ".")` 兜底与无根抛相抵 + 悬空指针「§3.8「协调项」」· 集成 delta 把「台账起点」写进交互面却只算评审范围（缺失数需校正）· 现行行数不可回溯到 §3.5 单源表（`ledger-db.mjs` 265 vs 263，实测 264）。

**⑤ 🔵 四条（评审 #7–#10）**：贴线判引了本批不碰的 `ledger-cmd.mjs ≈350`（§3.6 同档 ≈389）· `§7.1` 坐标 `:100` 应为 `:95` · 三态表与 MANIFEST §2.2 两份活文 · 读面抛分支缺读数/复现路径。逐条改，不阻塞。

**范围**：`docs/core/design/LEDGER.md` ∥ `docs/core/design/MANIFEST.md`。**不动代码**（实施轮）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-25
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖）

| # | 条目 | 回指 |
|---|---|---|
| 1 | **判据本体真单源**：`resolveLedgerRoot` 改 `owningProject` 薄包装（私有 `for(;;)` 上溯删除） | 设计 `docs/core/design/LEDGER.md` §3.8「判据本体（唯一）」/「入口表」 |
| 2 | **不向下取根**：`projectRootView` 取根臂收窄为归属命中；`workspace` / `none` 由 `discoverProjects` 供报明 | 同上 §3.8「三态」「不猜」「不变量」；`docs/core/design/MANIFEST.md` §3.1 AC-24 / AC-35 |
| 3 | **设计档与之对齐**：LEDGER §2.1 / §3.8 / §7.1 / §8 AC-M2-17 / §9 + MANIFEST §2.2 / §2.9 / KD-M1-30 / AC-24 / AC-35 / T45 / T59 | 本段「设计档落点」 |

**不在本批**（逐字承 §1 范围边界）：`isRegistered` 谓词 · `resolveLedgerRoot` 的 `basis` 语义（`self` / `ancestor` 两值不变）· `projectRootView` 的 `workspace` 候选读数 · `discoverProjects` / `discoverRepos` 算法本体 · `projectView`（manifest 读面五态）· `findGuideRoot` · 建档流 · 台账六态 / 写门 / 展示面。

### 机制设计

**① 判据本体 = `manifest-discovery.mjs:100` `owningProject(target, boundary)`**（祖先链上溯的唯一实现）。`resolveLedgerRoot(target, boundary)`（`ledger-db.mjs:95`）改为：

```
const start = resolve(target ?? "."), edge = resolve(boundary ?? process.cwd())
const root = owningProject(start, edge)
return root ? { root, basis: root === start ? "self" : "ancestor" } : null
```

import 面 = `./manifest.mjs` 既有具名出口（`owningProject` 在转口七名内，实读 `manifest.mjs:48`）⇒ 零新静态边。`isRegistered`（`ledger-db.mjs:55`）保留——只余 `ledgerChildren` 消费；无根文案、`ledgerDbPath`、`findProject`（`ledger.mjs:49`）零改。

**② 不向下取根** — `projectRootView(cwd)`（`manifest-discovery.mjs:131`）：`owningProject(cwd)` 命中 ⇒ `ok`；否则 `discoverProjects(cwd)` 只在 `kind === 'workspace'` 时出 `workspace` + 候选全列；其余 ⇒ `none`。`resolveProjectRoot` 保持 `projectRootView(cwd).root`（薄委托等价句继续成立）。`discoverProjects` 本体零改。

**③ 行为差（逐条带依据）**

| 差 | 旧 → 新 | 依据（读数 / 复现路径） |
|---|---|---|
| `resolveLedgerRoot(锚的祖先)` 且其带档 | 旧 = 外层项目根；新 = `null` | 旧 `ledger-db.mjs:98` 的 `inside` 允许 `edge.startsWith(start + sep)`（祖先也放行），新走 `manifest-discovery.mjs:105` 的界门 ⇒ 界门判据单源化；用户 19:09「不能跑到工作目录以外去」（§1） |
| `resolveLedgerRoot` 遇测试覆盖位 | 新：`_setProjectRootForTest` 在场 ⇒ 覆盖值（随 `manifest-discovery.mjs:101` 头部短路） | 生产零调用该缝；唯一提及它的用例档 `test/integration/review-doc-scope.test.mjs:10` 明示「不用两个测试缝」⇒ 台账面零碰 |
| `projectRootView` 于裸仓锚（`.git` 无档） | 旧 `ok` = 锚；新 `none` | 项目 = 带 manifest 的目录（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:68`）；`manifest-discovery.mjs:57` 的 git 臂属发现梯，不进 `root` |
| `projectRootView` 于「带档子目录恰一」容器 | 旧 `ok` = 子目录；新 `none` ∧ `root = null` | §1 #2（不向下取根）；LEDGER §3.8 三态表 |
| `projectRootView` 于「裸仓恰一」容器 | 旧 `ok` = 裸仓；新 `none` | 同上 |
| `manifest init` / `write` 于上述两格 | 落点从子目录 / 裸仓改为 `target` 自身 | `agent-tools/manifest.mjs:150` 读 `projectRootView(target)`；`none` 支落 `target` 自身（MANIFEST §2.9 目标面条） |

### 受影响文件与测试覆盖

| 档 | 现行（本轮实测） | 预期 | 改动面 |
|---|---|---|---|
| `thincoder-core/ledger-db.mjs` | 263 | ≈252 | `resolveLedgerRoot` 改薄包装；私有上溯循环删除 |
| `thincoder-core/manifest-discovery.mjs` | 147 | ≈147 | `projectRootView` 取根臂收窄 + 头注 |
| `thincoder-core/agent-tools/batch-paths.mjs` | 206 | ≈206 | `:38` 注释同步「归属形 + 起点兜底」——行为零变 |
| `thincoder-core/agent-tools/manifest.mjs` | 231 | 231 | 零改（`init` / `write` 落点随 `projectRootView`） |
| 消费面 `ledger.mjs` / `ledger-migrate.mjs` / `ledger-variant-notice.mjs` / `agent/light-round.mjs` | 158 / 306 / 47 / 63 | 零改 | 经包装入口取名——无第二判据 |
| `thincoder-core/test/project-root-single-source.test.mjs` | 不在盘 | 新建 | PR-1–PR-16，一次性——随批建 / 跑 / 删 |

**用例本体** = LEDGER §3.8 用例表（不复制）。核心四格 = PR-6（三入口同判据）· PR-3 / PR-7（恰一子目录容器 ⇒ `null`）· PR-15（裸仓恰一 ⇒ `null`）· PR-16（目标 = 锚的祖先 ⇒ `null`）。靶向单跑 = `node --test thincoder-core/test/project-root-single-source.test.mjs`。

**集成面（`test/RTM.md` 增量答）**：实读 `test/RTM.md:66`–`:76`——本机制只被 §6 的四行经 `outside-project` / `no-project-root` 间接消费（6-1 / 6-3 / 6-4 + 6 号故事），三行的锚态 = 项目内 ∥ 项目外绝对路径 ∥ 工作区根（≥2 项目）——**三态读数与候选列举零改** ⇒ delta = **零行加 / 零行改 / 零行删**；6-4（工作区锚）判据不变。

### 验收对照（回指）

| # | 判据（可机判） | 回指 |
|---|---|---|
| A1 | `thincoder-core/ledger-db.mjs`：`owningProject` 恰 1 处 import ∧ `for (;;)` 零命中 | LEDGER §3.8「判据本体（唯一）」 |
| A2 | 夹具容器（无档 + 恰一带档子目录）：`resolveLedgerRoot(容器)` = `null` ∧ `projectRootView(容器).state` = `none` ∧ `resolveProjectRoot(容器)` = `null` | LEDGER §8 AC-M2-17 · MANIFEST AC-24 / AC-35 |
| A3 | 夹具容器（恰一裸仓）：同 A2 | MANIFEST AC-24（T45 ④ / T59 单带档格） |
| A4 | 夹具：目标 = 会话锚的祖先且带档 ⇒ `resolveLedgerRoot` = `null` | LEDGER §3.8 PR-16 |
| A5 | PR-1–PR-5 逐例：`resolveLedgerRoot(t)?.root === projectRootView(t).root === resolveProjectRoot(t)` | LEDGER §3.8 PR-6 |
| A6 | 项目内回归：目标在项目内 ⇒ `{root: 项目根, basis}` 逐字如旧（含文件目标 ⇒ 其所在目录） | LEDGER §3.8 PR-1 |

### 关键决策

- **KD1 单一本体 = `owningProject`，不是 `projectRootView`**：旧 §3.8 写「本体 = `projectRootView(target, { isProject })`」——实读该函数无 `target` / 无 options（`manifest-discovery.mjs:131`），且其 `root` 会向下（`discoverProjects` 分支）。把本体定在上溯函数上，包装层才可能同时满足「同一判据」与「不向下取根」。
- **KD2 不收 `isRegistered` 注入**：台账谓词 = 档臂，与 `owningProject` 的谓词逐字相同（`existsSync(join(dir, MANIFEST_REL))`）⇒ 注入面无第二个谓词可传，删掉即可（§1 边界「不动 `isRegistered`」照办：函数本体零改）。
- **KD3 `resolveProjectRoot` 保持薄委托**：改在 `projectRootView` 一层，使「薄委托等价」与 `workspace` 报明读数都留在原处（单一改动点，消费面零改）。
- **KD4 拒绝的替代形**：① 只改 `resolveProjectRoot`（`= owningProject`）而留 `projectRootView` 向下 —— 会留下两份取根语义，且「root 永不在 target 之下」不变量仍假；② 给 `owningProject` 加谓词参数 —— 台账无第二个谓词，参数无人传。
- **先例行**：对齐 = `docs/core/design/MANIFEST.md` §2.2 `owningProject` 归属形单点（KD-M1-30 的「归属」半幅）——复用同一实现即本批要义；偏离 = 把 `projectRootView` 的 `ok` 臂从「归属 ∨ 发现」收为「归属」——理由 = 发现臂的 `unique` 读数正是「向下取根」的来源（§1 #2）。
- **勘察证据行**：查过 LEDGER §2.1 / §3.8 / §7.1 / §8 / §9 ∥ MANIFEST §2.2 / §2.5 / §2.9 / §3.1（AC-24 / AC-35 / T45 / T48 / T59）∥ 需求 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` §⑥（`:68` / `:72` / `:74` / `:76`）∥ `test/RTM.md` §6 ∥ 实读五档代码（`ledger-db.mjs` / `manifest-discovery.mjs` / `manifest.mjs` / `ledger.mjs` / `agent-tools/batch-paths.mjs`）——**相关**。声明源 = `PROJECT-MANIFEST.json` `index.publicRepos` = `[]`（实读）⇒ 无仓外声明源可查；结论 = 无仓外声明源相关。

### 上抛项

- **[上抛·待裁] 需求档 :74「上溯不设上界」与代码 / 设计「以会话锚为界」相抵**：实读 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74` 写「上溯不设上界」，而 `manifest-discovery.mjs:105` 以 `boundary`（缺省 `process.cwd()`）为界、LEDGER §3.8 与 MANIFEST §2.2 也写「以会话锚为界、越界即停」。本批按实现 + 用户 19:09 写设计，**需求档未动**（非本席位写域）——请主 agent 收正需求档该句或改判实现。
- **[上抛·知会] §1「实读 144 行」与现读数不符**：本轮实测 `thincoder-core/manifest-discovery.mjs` = **147 行**（`ledger-db.mjs` = 263 行）；本段所有坐标与行数取本轮实测值。
- **[上抛·知会] 建档流落点随动**：`manifest init` / `write` 在「带档子目录恰一」「裸仓恰一」两格的落点由子目录 / 裸仓改为 `target` 自身（`.git` 臂与 `discoverProjects` 零改）。会话起点的轻动作建档走 `projectView`，**不受影响**。

### §2 读数修正（同行自正）

- 「集成面」段的行数更正：实读 `test/RTM.md` §6 命中 **3 行**（6-1 / 6-3 / 6-4——按 `项目根|归属|resolveProjectRoot|resolveLedgerRoot` 检索；6 号故事标题 `:66`）——上文「四行」为笔误，delta 结论不变（零行加 / 改 / 删）。

### §2 设计档对齐落地 + 读数核正（eng-designer 第二轮）

**本批条目 3（设计档与之对齐）已落 —— 逐条 `file:line`（本轮实改 / 实读）**：

| # | 落点 | 改前 → 改后 | 依据 |
|---|---|---|---|
| D1 | `docs/core/design/MANIFEST.md:95-96`（`projectRootView` 契约行） | `ok` = 归属命中 ∥ 发现 `self`/`unique` → `ok` = **仅归属命中**；`workspace` = `discoverProjects` 报 `workspace`；`none` = 其余（含带档子目录恰一 ∥ 裸仓恰一）；发现读数只供报明、不进 `root` | 本段机制设计 ② · LEDGER §3.8 三态表 |
| D2 | `docs/core/design/MANIFEST.md:101`（薄委托等价句） | 「行为逐字零变」→ 结构等价、行为随 `projectRootView`（两格 ⇒ `null`） | 旧句与 ② 相抵 |
| D3 | `docs/core/design/MANIFEST.md:311`（§2.5 台账键面） | 「无则向下收敛」→「以会话锚为界、越界即停；**不向下取根**」 | 需求 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74` · 本段 ② |
| D4 | `docs/core/design/MANIFEST.md:345`（§2.5 消费点表行 6） | 「工作区锚 ⇒ 按收敛序取值」→ 工作区 ∥ 容器锚 ⇒ **无根** ⇒ 写面抛 / 展示面 `current` = `null` | LEDGER §3.8「无根契约」 |
| D5 | `docs/core/design/MANIFEST.md:581`（§2.9 归属形） | 追加「取根面只取归属命中——发现读数不进 `root`」 | 本段 ② |
| D6 | `docs/core/design/LEDGER.md:523`（§3.8 三态表 `workspace` 行） | 「带档者 ≥2」→「`discoverProjects` 报 `workspace`（带档者 ≥2 ∥ 零带档时裸仓 ≥2）」 | 机制设计 ②「只在 `kind === 'workspace'` 时出 `workspace`」——旧行漏裸仓梯 |
| D7 | `docs/core/design/LEDGER.md:878`（§8 AC-M2-17 在册状态） | 「已落地在册（#1588）」→「**半落地（逐半幅）**：上溯 / 界门 = #1588；判据本体单源 + 不向下取根 = 本批 #1795」 | 现行 `resolveLedgerRoot` 仍自带 `for (;;)` 上溯（`thincoder-core/ledger-db.mjs:95-109`）⇒ 判据半幅未落 |
| D8 | `docs/core/design/LEDGER.md:577-578`（§3.8 受影响面文档两行） | 1057 / 1199 → **1048 / 1198**（本轮 `\n` 计数实测；本轮改后行数零变） | 原值为旧读数 |

**A1 核正（原文不可达成——会让正确实现判红）**：原文「`for (;;)` 零命中」不成立——实读 `thincoder-core/ledger-db.mjs:72`，`ledgerChildren` 内有 `for (;;)`（流式枚举），与根解析无关。A1 改为：`owningProject` 恰 1 处 import；`resolveLedgerRoot` 函数体（`:95`–`:109`）零 `for (` 循环、零 `isRegistered(` 调用；`isRegistered` 一处定义，消费面只余 `ledgerChildren`。A2–A6 不变。

**上抛项处置**：原 [上抛·待裁]「需求 `:74` 上溯不设上界」**已解除**——实读 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74` 现文：「…**上溯以会话锚为界，越界即停**（界外不挂项目；起点本身在锚外 ⇒ 无项目）… **发现不参与取根**：容器锚下带档子目录再多再少，本动作的项目根仍是 `null`（报明），不择子目录。」⇒ 需求 / 设计 / 代码三面同口径，无待裁项。

**集成面读数更正（取代上文「四行 / 三行」两种表述）**：`test/RTM.md` §6 数据行 = **四行**（6-1 / 6-2 / 6-3 / 6-4）；本机制的消费点 = 各行的**锚态**（项目内 / 项目内 / 项目外绝对路径 / 工作区根）——四格读数本轮零改（`workspace` 候选列举不动、项目内解析不变），且无一行坐「带档子目录恰一 ∥ 裸仓恰一」格 ⇒ delta = **零行加 / 零行改 / 零行删**。

**行为差第 6 行复核**：实读 `thincoder-core/agent-tools/manifest.mjs:157`「`const root = rootView.state === "ok" ? rootView.root : target`」⇒ `init` 的 `none` 支落 `target` 自身，与上文一致；`workspace` 支 `:152-154` 拒发不变。

**自检读数**：引证 §2.1 / §3.8 / §7.1 / §8 / §9 / §2.2 / §2.5 / §2.9 / KD-M1-30 / AC-24 / AC-35 / T45 / T59 逐项存在（`grep` / `read` 实读）· 本表 D1–D8 = 8 行（行行对上表头列数）· 行数断言 = `node -e split('\n').length-1` 实测（LEDGER 1048 / MANIFEST 1198）· `doc_check` gate = **PASS（2 档）**。

### §2 第三轮修正（父侧 19:35 三件 · 逐件落点）

**① 起点优先级自相矛盾 —— 已按实现改正（`docs/core/design/LEDGER.md:547-551`）**

起点表改后序 = 「显式 `cwd` 入参 > 指针档文件部分 > 会话锚」（表体 = 设计档 §3.8）。依据 = 实读 `thincoder-core/ledger-tools.mjs:272` / `:278` / `:290` / `:296` / `:298` 逐处 `cwd ?? cwdOf(…指针)` ⇒ 显式 `cwd` 先于指针。同表核出并改齐两处原文漏项：`req_doc` 也是 `add` / `update` 的起点指针（`:272` / `:278`）；`query` / `count` 的 `task_book` 也作起点（`:296` / `:298`）。

**② 「绝对且在盘」—— 按码改判（`docs/core/design/LEDGER.md:554`）**

改判句（保留机制、改正条件）：指针值 → 起点只剥 `§N` 段号（`ledger-tools.mjs:20`–`:23`）；相对路径按会话锚拼接、绝对路径照用（`:34`）——起点推导**不看「绝对」、不看「在盘」**。指针档在盘属写入门判据（`ledger-cmd.mjs:146` / `:307`），不是起点条件。

**③ 集成测试设计节 —— 已补（`docs/core/design/LEDGER.md:611-623`）**

逐行点 `test/RTM.md` 故事 6 四行 + delta：**破 0 / 冗余 0 / 缺失 1**。缺的 = 6-5（会话锚 = 容器目录：根无档 ∧ 下辖恰一项目 ⇒ `no-project-root`，不把唯一下辖项目当根）——本批核心不变量（不向下取根）在集成面此前无断言行；1–4 行断言的业务可观察结果零改。编号已先落 `test/RTM.md:77`（故事 6 数据行 4 → 5；节注 `:69` 三态行序同步）；用例标题随实施轮 `test('6-5 …')` 落 `test/integration/review-doc-scope.test.mjs`。

**受影响面增行**：`test/RTM.md`（118 → 119，实测 `\n` 计数）——已入设计档 §3.8 受影响面表（`docs/core/design/LEDGER.md:579`）；`docs/core/design/LEDGER.md` 现读数 1065（同表 `:580`）。

**验收对照增补（回指）**：

| # | 判据（可机判） | 回指 |
|---|---|---|
| A7 | 设计档 §3.8 起点表中 `add` / `update` 行首个序号项 = 「显式 `cwd` 入参」；全节「绝对且在盘」0 命中（作起点条件） | `ledger-tools.mjs:272` / `:278` / `:290` / `:296` / `:298` · `:29`–`:37` |
| A8 | 设计档 §3.8 含「集成测试设计」节 ∧ 其表数据行 = 5（6-1…6-5）∧ delta 结论句在位 | 需求 `docs/core/requirements/TESTING.md:199` F34 |
| A9 | `test/RTM.md` 故事 6 数据行 = 5 ∧ 第 5 行编号 = `6-5`；实施轮用例标题 `test('6-5 …')` 与该编号逐字一致 | 设计档 §3.8 集成测试设计节 |

**上抛项**：无新增（原两条 [上抛·知会] 仍有效：本批坐标取 147 / 263 行实测；建档流两格落点随动）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：项目根解析收尾（判据本体真单源 + 不向下取根）——LEDGER.md §3.8 ∥ MANIFEST.md §2.2/§2.9/KD-M1-30/AC-24/AC-35/T45/T59 ∥ test/RTM.md 故事 6 新增 6-5
**计数**：🔴 3 · 🟡 3 · 🔵 4

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility / Clarity | 🔴 | `projectRootView` / `resolveProjectRoot` 的 `boundary` 未定：MANIFEST.md:95 把 `ok` 定义为「`owningProject(cwd)` 非 `null`」（单参），而 MANIFEST.md:103 的 boundary 缺省 = `process.cwd()` ⇒ 目标 ≠ 进程 cwd 的调用（`manifest` 工具显式 `target`、AC-26 跨项目读、AC-35/T59 的 tmp 夹具）一律落 `none`；§3.8 自己的 PR-1–PR-6 在该 wiring 下必红。PR-5 的括注（LEDGER.md:598「上溯到盘根停，不抛」）与「越界即停」互斥；无一条用例钉住「会话锚 = 项目内层子目录」——该 rule 唯一起作用的配置。 | 在 §3.8 入口表逐行写出每个入口传入的 boundary（如 `projectRootView(cwd)` ⇒ `owningProject(cwd, cwd)`、`findProject(anchor)` ⇒ 同 anchor），改写 PR-5 括注，并补一条「锚 = 项目内层子目录 ⇒ ?」用例把该配置钉死。 |
| 2 | Document ownership | 🔴 | 「已注册」判据两写仍活着：LEDGER.md:831 与 LEDGER.md:1050 写「已注册（档 ∨ 库）」，而 LEDGER.md:82 / LEDGER.md:819 / AC-M2-17（LEDGER.md:920）写「档在盘」（= 实读谓词 `ledger-db.mjs:55-57`）。设计只写「随判据改齐」，未点名句子，也未收 `ledgerChildren` 的 JSDoc——`ledger-db.mjs:63` 写「（档 ∨ 库——§2.1 单谓词）」而函数体是档臂 ⇒ 本批「判据本体真单源」的断言与在册副本相抵。 | 在 §3.8 受影响面逐句点名并给出改后文字（删库臂），含 `ledger-db.mjs:63` 的 JSDoc；若库臂确要保留，则声明 `ledgerChildren` 用的是另一枚显示面谓词并改名，不与「已注册」共名。 |
| 3 | Acceptance criteria | 🔴 | `projectRootView` 收窄与既有验收行相抵：AC-35（MANIFEST.md:1102）把「裸仓恰一」归 `none`、§2.10（MANIFEST.md:629）据 `projectRootView` 定「`none` ⇒ init 落点 = `target` 自身」，而 T65②（MANIFEST.md:1189「落点 = 裸仓 / 裸仓 / target」）断言容器 + 恰一裸仓 ⇒ 落点为裸仓——两条不能同时成立。设计把 AC-35/T45/T59 列进改齐面，却未列 §2.10 / T65 / T67，也未说明收窄后 `manifest init` 在「容器 + 恰一子项目」上会就地把容器变成项目（`read` 仍经 `projectView` 兜底读到子项目、`write` 却拒——同一 target 两面相反）。 | 把 §2.10 ∥ T65 ∥ T67 加进 MANIFEST 改齐面，重写 T65②（落点改容器，或该格改判「拒」），并明写收窄后 `init` 在 `none` 目标的落点与 `read`/`write` 同 target 异答案是否有意接受。 |
| 4 | Clarity | 🟡 | §6.1 口径 2（LEDGER.md:708「`resolveLedgerRoot(cwd)?.root ?? resolve(cwd ?? ".")`」）保留了无根兜底，与 §3.8「无根 ⇒ 一律抛、零落盘」互斥；同句还把「工作区抛」写成已退役，并指向一个不存在的锚——「§3.8「协调项」」（§3.8 无此节）。§6.1 不在本批文档改齐面内。 | 把 §6.1 列入改齐面：删 `?? resolve(cwd ?? ".")` 兜底（写面无根即抛，兜底不可达）、改写「工作区抛退役后」半句、把那处悬空指针改为实指（如「§3.8 无根契约」）。 |
| 5 | Acceptance criteria (integration) | 🟡 | 集成 delta 自述「缺失 1」（LEDGER.md:623），但同一节的交互面（LEDGER.md:613「消费点（评审文档范围 … · 台账起点）」）把台账起点算进来了，而 delta 表 6-1–6-5 全是评审文档范围；台账面的业务可观察行为本批变了（`query`/`count` 由静默空集改抛、写面按起点优先级落到不同项目库），RTM 无对应行，单测档随批删除后该面零留存验收。 | 在 delta 三问里明确台账面：或补一行（新故事或既有故事内的编号先行），或写清「台账面无既有 RTM 故事、本批不新增」的理由与替代验收面；「缺失 N」之数随之校正。 |
| 6 | Affected-file annotations | 🟡 | `现行` 读数不可回溯到本档声明的单源表：§3.5（LEDGER.md:350「现行行数单源 = 本表」）与 §3.8（LEDGER.md:570「本轮 node 实测」）对同三档给出不同数——`ledger-db.mjs` 265 vs 263（读盘实测 264 行）、`ledger.mjs` 159 vs 158、`ledger-migrate.mjs` 305 vs 306。另 `test/RTM.md` 行写「故事 6 加 6-5 一行」（LEDGER.md:579）而 6-5 已在盘（RTM.md:77）、文件已 119 行——读起来像待办，实施轮有重复插行风险。 | 回填 §3.5 表（或让 §3.8 只写增量、现行值回指 §3.5），把 RTM 行改成「已落（编号先行）」以与在册状态口径一致。 |
| 7 | Note | 🔵 | 贴线判引了本批不碰的档且数与 §3.6 不一致：LEDGER.md:586「本轮增量后最高 = `ledger-cmd.mjs` ≈350 行」，而 §3.6 同档为 349 + ~40 ⇒ ≈389；本批实际最高为 `batch-paths.mjs` 206 / `manifest-discovery.mjs` 147。 | 按本批受影响面重算贴线判，去掉不碰的档。 |
| 8 | Note | 🔵 | 坐标漂移：LEDGER.md:790 写「实读 `thincoder-core/ledger-db.mjs:100`」，实测 `resolveLedgerRoot` 在 `:95`（`:100` 是 `let dir = start`）；§3.8 入口表与 §8 均用 `:95`。 | 统一为 `:95`。 |
| 9 | Note | 🔵 | 三态表（LEDGER.md:520-524）与 MANIFEST §2.2 的 `projectRootView` 契约是同一份状态契约的两份活文；两份的 `workspace` 条件详略还不同（LEDGER 多了「零带档时裸仓 ≥2」）。 | 二选一：把完整条件收进 MANIFEST §2.2、LEDGER §3.8 只留指针；或反向指定 LEDGER 为口径源。 |
| 10 | Branch provenance | 🔵 | 读面新分支（`query`/`count` 无根由空集改抛）在册只有设计理由（「空集与记到别的项目在回执上无法区分」），没有引读数或可复现路径；同节其余分支有用户原话（2026-10-23 / 2026-10-25 19:09）与实景锚（`d:\teamcode`）。 | 按 §1.1 判据 B 补一句读数/复现路径（如「在 `D:\teamcode` 跑 `ledger query` 现回 `[]`」）。 |

**方法论限制（如实）**：本轮无项目标准档、无文档地图（宿主未提供）⇒ 文档归属按「改在已有拥有档内、未新建文件」判（本批为就地更新，合规）；`.md` 纯文档免行数标注。
**已核/未核**：`ledger-db.mjs` 的谓词（档臂）、`resolveLedgerRoot` 坐标、文件行数 = 本轮读盘实测；其余档的行数与坐标未逐档复核（`unverified`）。

VERDICT: changes-required
（🔴 3 · 🟡 3 · 🔵 4）

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
