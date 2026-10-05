# 2026-10-05 · 引擎工具面缺口两条（批档路径嵌套 / 空目录清理）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 18:07「点火」（五条）——按模块数限制拆批后，本批 = 工具面两条（#942、#943）。
> 台账 = #942、#943（core · 归批）。前情 = 无（独立批，自 `docs/batches/2026-10-05-engine-face-gaps.md` 拆批分出）。
## §1 讨论（主 agent）
**状态行**：进行中（§4 父侧代签已落（18:54 自动跑）；微修轮 #30 五项落定（父侧核验在盘）；实施派发候 #32（避并发——断代重锚在其后））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与授权

- 2026-10-05 18:07 你说「点火」，对象是引擎面缺口五条。这一批是其中工具面的两条。五条按模块数限制拆成了三批，拆分过程记在 `2026-10-05-engine-face-gaps.md` 的 §1.2 和 §1.3。
- 本批两条：
  - #942（P1）：批档路径解析有个洞。传不带仓前缀的相对路径时，会被静默拼到第一个基底下面，在他仓里建出一串嵌套的空目录，回执还照着错路径写。
  - #943（P2）：空目录没有合规的清理方式。delete 工具拒绝删目录，提示却让人去用 `rm -rf`，恰好是我们的纪律禁止的那条路。
- 范围：两条都走完整流程（设计、评审、批准、实施、收口）。需求有变化的话我上抛，不自己改需求。
- 设计文档：#942 落在 `MANIFEST.md` 或 `BATCH-RECORD.md`（设计时定）；#943 落在 `TOOLS.md`。
- 授权：照点火走全链，直到收口。
- 台账：#942、#943 都是待设计，任务书就是本档 §2。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（#942 ∥ #943 设计面落盘（BATCH-RECORD §4.15 条 6 ∥ TOOLS §6.21）；评审 #22 ∥ #28 轮 2 修正轮各五项落修在盘；实施评审 🟡① 登记随动在盘（§2.6 决策 3 ∥ §2.11）；doc-check exit 0（悬空 0 ∕ 行宽 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- **#942**（P1 · M3）`resolveBatchCreatePath` 残留（静默嵌套树）：基底不落 cwd 项目根下（跨仓 ∥ 声明面他仓基底）时，无仓前缀相对形 `docs/batches/<x>.md` 经「基底腿」二次拼接静默嵌成 `<基底>/docs/batches/docs/batches/…`（多段相对串同病——`docs/batches-old/<x>.md` 等），且 create 回执照写错路径 ⇒ **修**：补「基底自有项目根」腿（可判 ⇒ 正确落点）+ 基底相对腿收窄单段（多段串不二次拼接 ⇒ 无落点即通用 fail-closed 拒）+ 多落点显式拒（列候选）。
- **#943**（P2 · 工具面）空目录无合规清理通路（`delete` 拒目录并把模型指回被禁 bash）⇒ **修**：`delete` 增**空目录臂**（非空拒——保险丝），经 `write-path` 新 `rmdir` op 落盘；`tool-docs/delete.md` / param desc 同拍去被禁面指引。
- **设计单源择一（说明）**：#942 落 `docs/core/design/BATCH-RECORD.md`（§4.15 = 批次档相对路径解析单源，锚定规则 / BR 表 / D 表全在该档；`MANIFEST.md` 的发现·归属机器（`owningProject` 等）零改——不取该档）；#943 落 `docs/core/design/TOOLS.md`（§6.21 + D-TO16；缝面 op 扩展登记 = `CORE-UNIFICATION.md` §2.13.5 补正④）。

### 2.2 设计档落点（file:line · 终值 · as-of 修正轮）

| 条目 | 落点 | 终值 |
|---|---|---|
| #942 | `docs/core/design/BATCH-RECORD.md`：§2 门禁表 `:29` ∥ §4.8 BR-35 `:161` ∥ BR-43–45 `:169-171` ∥ §4.15 条 1 `:247`（修正轮指针） ∥ 条 2 `:251-252` ∥ 条 3 `:253-254`（轮 2 限定） ∥ **新增条 6 `:263-267`** ∥ 行为变更登记 ⑦ `:271` ∥ §7 D-BR25 `:431` ∥ §8 `:442` ∥ 变更记录 `:464` / `:542` / `:544` / `:546` | 判据链 + 拒面文案逐字在档 |
| #943 | `docs/core/design/TOOLS.md`：**新增 §6.21 `:1077` 起**（含快照面注 `:1116`；范围注 ∥ 口径注 `:1117-1118`）∥ §7 D-TO16 `:1140` ∥ 变更记录（末条） | 判据 / 接口改前→改后 + 拒句 + 描述档全文逐字 + 快照面注 + 范围注 + 口径注 |
| #943 登记 | `docs/core/design/CORE-UNIFICATION.md`：§2.13.5 补正④ `:1414` ∥ 变更记录 `:1831` / `:2071` | 缝内 op 集扩 `rmdir` 登记 |

### 2.3 机制设计（改前 → 改后 · 逐字）

**#942（`thincoder-core/agent-tools/batch-paths.mjs` `resolveBatchCreatePath`）**：

改前（判据链尾 `:177-185`）：

```js
if (anchoredPrefix(p, basePrefixes(base, roots))) {
  const abs = resolve(batchProjectRoot(base), p)
  if (!insideBases(abs, roots)) throw anchoredEscapeError(raw)
  return abs
}
for (const abs of [resolve(base, p), resolve(batchProjectRoot(base), p), ...roots.map((b) => resolve(b, p))]) {
  if (insideBases(abs, roots)) return abs
}
throw outsideBasesError(raw)
```

改后（设计·终形——锚定腿与三旧文案逐字零变；①② 腿去「基底腿」；③④ 新增）：

```js
if (anchoredPrefix(p, basePrefixes(base, roots))) { /* :177-181 零改 */ }
for (const abs of [resolve(base, p), resolve(batchProjectRoot(base), p)]) {
  if (insideBases(abs, roots)) return abs
}
// ③ 基底自有项目根形（#942 条 6）：owningProject 可判者逐基底取值；distinct 落点 ≥2 ⇒ 拒
const owned = []
for (const b of roots) {
  const ownRoot = owningProject(b)
  if (!ownRoot) continue
  const abs = resolve(ownRoot, p)
  if (insideBases(abs, roots) && !owned.some((x) => samePath(x, abs))) owned.push(abs)
}
if (owned.length > 1) throw ambiguousLandingError(raw, owned)
if (owned.length === 1) return owned[0]
// ④ 基底相对形收窄单段（归一后无 `/` 才走原基底腿——多段串不二次拼接）
const leafRel = roots.length ? relative(roots[0], resolve(roots[0], p)) : ""
if (leafRel && !leafRel.startsWith("..") && !leafRel.includes(sep)) {
  for (const b of roots) {
    const abs = resolve(b, p)
    if (insideBases(abs, roots)) return abs
  }
}
throw outsideBasesError(raw)
```

新错误常量（文案逐字——入常量区）：

```js
const ambiguousLandingError = (raw, landings) => new Error(`batch: create path resolves under more than one declared batch-record base — refusing to pick one (fail-closed); pass an explicit path (absolute preferred). Path: ${raw}. Candidates: ${landings.join(", ")}`)
```

零变面保持：`outsideBasesError` / `anchoredEscapeError` / `ambiguousCreateError` 三文案逐字、绝对路径腿、歧义锚门、回执 `batch: created <abs>`（随落点取值——落点收正即回执不再照写错路径；拒面无回执）。头注随动一行（条 6 登记）。模块私有谓词 `samePath` / `leafRel` 用既有导入（`relative` / `sep` 已在 import 行）。

**#943（`thincoder-core/tools/patch.mjs` ∥ `write-path.mjs` ∥ `tool-docs/delete.md`）**：

- `deleteTool.execute` 目录臂（改前 `:272` 单行 throw 「use bash」句）：

```js
if (s.isDirectory()) {
  try { await writeThroughPath(abs, null, { op: "rmdir" }) } catch (e) {
    if (e?.code !== "ENOTEMPTY" && e?.code !== "EEXIST") throw e
    throw new Error(`"${args.path}" is a directory and is not empty — only empty directories can be deleted (nothing recursive is ever removed). Remove the contents first (delete bottom-up for nested empty directories).`)
  }
  return `Deleted ${args.path}`
}
```

  （目录臂在 tracked 检查前 return——空目录不可能被 git 跟踪；`force` 语义只对文件。成功回执 = `Deleted <path>`，与文件臂同形。）
- param desc：`File path (relative to cwd or absolute)` ⇒ `File or empty-directory path (relative to cwd or absolute)`（同行替换）。
- `write-path.mjs` `defaultPath` 新增臂：`case "rmdir": { await rmdir(abs); return { written: true, via: "fs" } }`（不记 dirty——目录无行号语义；import 增 `rmdir`；头注 op 表补 `rmdir`）。
- `tool-docs/delete.md` 全文 = `TOOLS.md` §6.21 代码块逐字（13 → 15 行——按内容行计；围栏行不计）。

### 2.4 受影响文件与测试面（行数 + Δ + 模块 · L7 复核）

| # | 文件 | 现行行数（as-of 设计轮） | Δ（上界） | 模块 | 变更 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/batch-paths.mjs` | 186 | ≤ +20 | M3 | ③④ 两腿 + `ambiguousLandingError` + 头注 |
| 2 | `thincoder-core/tools/patch.mjs` | 292 | ≤ +6 | 工具面 | delete 目录臂（压 ≤300 软线内 ≈298）+ 拒句 + param desc |
| 3 | `thincoder-core/tools/write-path.mjs` | 191 | ≤ +6 | 工具面 | `rmdir` op 臂 + import + 头注 |
| 4 | `thincoder-core/tool-docs/delete.md` | 13 | +2（⇒ 15；按内容行计） | 工具面 | 文本收正（全文逐字 = `TOOLS.md` §6.21） |
| 5 | `docs/batches/2026-10-05-engine-tools-gaps.test.mjs` | 0 | 新增 ≈260（#942 红绿对 + tool 级夹具 + #943 五格 + 回归；≤300 免登记；越 300 ⇒ 拆波次族——先例 `2026-10-04-issue-fix-round1.a.test.mjs` / `.b`） | — | 红绿对（§2.5） |
| 6 | `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` | 271 | +1（两行改钉 + 断代注一行 ⇒ 272） | —（旧批件） | BR-35 断言断代重锚（§2.5 注；执行 = 父侧直接执行——不列入实施派发 files 面） |
| 7 | `docs/core/design/BATCH-RECORD.md` | 542 → 546（修正轮 #22 +2 ∥ 轮 2 +2） | ±0（设计轮已落——实施零触） | M3 | §4.15 条 6 等（§2.2） |
| 8 | `docs/core/design/TOOLS.md` | 1332 → 1339（修正轮 #22 +3 ∥ 轮 2 +4） | ±0（设计轮已落——实施零触） | 工具面 | §6.21 ∥ D-TO16 |
| 9 | `docs/core/design/CORE-UNIFICATION.md` | 2073 | ±0（设计轮已落——实施零触） | 工具面 | §2.13.5 补正④ |
| 10 | `docs/core/design/API-CONTRACT.md` | 3010 | 生成区刷新（生成器唯一笔） | — | `batch-paths` / `patch` 导出行位移随动（`node scripts/api-contract.mjs --write`） |

**L7 复核（判定时点②）**：模块列去重 = **M3 + 工具面 = 2 ≤ 2 ✓**（非 M 族行 = 批件 / 生成物——不入计数）。行数界：档 1–3 实施后均 ≤300 软线内（无 `>300` 登记义务、无拆分义务）；`patch.mjs` 292 ⇒ ≈298 贴线（<300）。

### 2.5 验收对照（可机检——红绿对优先）

| 条目 | 红（修前实测——设计轮 probe 坐实） | 绿（修后 · 机检） |
|---|---|---|
| #942-① | 跨仓基底 + `docs/batches/<x>.md`：纯函数 ⇒ `<基底>/docs/batches/docs/batches/<x>.md`（静默）；tool 级 create ⇒ 嵌套档落盘 + 回执照写错路径 | 纯函数 ⇒ `join(B2, "X.md")`（`assert.equal`）；tool 级 ⇒ 落 `<B2>/<file>`、回执含正确路径、无嵌套目录（`existsSync` 反证 false） |
| #942-② | `docs/batches-old/<x>.md` ⇒ 静默嵌套 `<基底>/docs/batches-old/<x>.md` | `assert.throws(/resolves outside the batch-record base roots/)`（通用 fail-closed——不二次拼接） |
| #942-③ | 多基底同形 ⇒ 静默取 bases[0] 嵌套 | `assert.throws(/resolves under more than one declared batch-record base/)`（列候选） |
| #942-回归 | — | BR-27 / 28 / 30、bare `<x>.md`、绝对、锚定逃逸拒、#828 四腿（歧义拒 / 所属落 / 读面 / 写门）、none 态——零变（批件复跑） |
| #943-① | `delete(空目录)` ⇒ throw「is a directory — use bash to remove directories」 | 成功（目录消失 + 回执 `Deleted <path>`；经 `op:"rmdir"` 落盘） |
| #943-② | `delete(非空目录)` ⇒ 同上旧句 | throw 新拒句（机检锚 = 逐字句）；目录与内容零损（readdir 复读） |
| #943-③ | — | symlink→dir ⇒ 删链接本体、目标存活（既有语义零变实证）；嵌套空树：非底 ⇒ 拒 / 自底向上 ⇒ 全成 |
| #943-回归 | — | tracked 拒 / `force` 通行 / missing 文案 / 文件臂回执——零变 |

**#943 快照面注（undo——修正轮发现 4 落修）**：空目录移除**不产生 undo 条目**（零内容语义）——实证 = `snapshotForUndo` 对目录目标读文本失败（`EISDIR`）即跳（不推条；探针读数 = 修正块）；机制面单源 = `TOOLS.md` §6.21 快照面注（`:1116`）。

**旧批件断代重锚（表 #6）**：`2026-10-02-manifest-resolution-fix.test.mjs:236-237` BR-35 腿按本批收正改钉（`:236` 改 thunk 形 ∥ `:237` 改 `assert.throws(/resolves outside…/)`；断代注**独立成行**——先例 = ledger #894 / #897「断代重锚」）⇒ Δ = **+1**（271 → 272——计法 = 按文件行数净增；表 #6 随动）。
**执行通道 = 父侧直接执行**（跨批伴随件不在批次档写门豁免面内——工程角色直写必拒；判据 = `BATCH-RECORD.md` §4.2 / D-BR23）——该文件**不列入实施派发 files 面**（实施者自跑件不含它）。

### 2.6 关键决策

| # | 决策 | 依据 / 否决 |
|---|---|---|
| 1 | #942 = **收正为主 + 收窄余形**（基底自有项目根腿 + 基底相对限单段 + 多落点拒） | 条 3 既有措辞的完整化（前缀面补全为「基底自有项目根」）；判据 = 「可判 ⇒ 落 / 不可判 ⇒ 显式拒」（#828 族同旨）。否决：纯拒（损失可正落面）· 保留嵌套 · 启发式改写 · 强制锚定——全表 = `BATCH-RECORD.md` §7 **D-BR25** |
| 2 | #943 = **`delete` 空目录臂（非空拒）** | 工具面补全 = 矛盾消（要求层删除红线 `PROMPT-SYSTEM.md:96` 点名 delete 工具面）；保险丝 = rmdir 语义（ENOTEMPTY）零新逻辑。否决：纯文本 / 极窄白名单 / `file_ops` 增 delete / 递归选项——全表 = `TOOLS.md` §7 **D-TO16** |
| 3 | ④ 腿回归面（实施评审 🟡① 登记 · 细目 = §2.11）：**多基底 + bare 单段名（如 `x.md`）⇒ 静默取首基底（`bases[0]`）**——有意零变、不入拒面（不改代码） | 既有命中面：修前判据链同形落首基底——回归零变（实现与 §2.3 逐字一致 = 非实施偏差）；边界 = 「不静默取首个」（条 6③）适用于**无落点判据**腿；bare 单段名 = 既有命中面、回归零变（单段基底相对形照收——条 6④）。否决：收正为多落点拒（= 加第二判据 / 语义扩张——越本轮禁令） |

### 2.7 上抛项（父侧）

- **需求档同步候选（父侧笔域）**：`docs/cli/requirements/FEATURES.md:27` delete 行——「删除文件」→「删除文件 / 空目录」（#943 工具面宽度回指）。
- **沿用面**：`docs/core/requirements/PROMPT-SYSTEM.md:96` 五条①（「删除只走既有工具面 `delete` / `git rm` 或极窄白名单」）——修复后与实现一致（零改；空目录面如需加注 ⇒ 父侧裁）。
- **有意边界（本批不做）**：非空目录零通路 + 「极窄白名单」未实装（D-TO16 否决② 在册）；如立条目 ⇒ 父侧裁。
- **观察项（零触）**：读面 `resolveBatchReadPath` 基底腿保留原样（仅取可读文件、不新建结构——与 create 收窄存在面差）；`bench/results/2026-09-25-toolcall-baseline.json` 含旧描述快照（记录面——零触）。

### 2.8 设计轮自检读数

- `node scripts/doc-check.mjs` ⇒ **exit 0**（锚 0 悬空 / 行宽 0 超限；其余 ✗ 行 = 在册「列报 · 不入闸」报告面）。设计轮内一次修正轮（4 行宽行折行 + D-TO16 行「详见」谓词触发 6 符号悬空收正——同批已落）。
- 红绿坐实（设计轮 probe 实跑）：#942 嵌套 + 回执错路径（纯函数 ∥ tool 级）；#943 空目录拒句 / 非空 ENOTEMPTY / symlink 现语义——读数逐条在册（§2.5 红列）。

### 2.9 评审修正轮块（评审 #22 五项落修 · 2026-10-05 · eng-designer）

**段位**：本轮 = 评审 #22（§3 轮次 1 · pass · 0🔴 / 2🟡 / 3🔵）修正轮——按发现号 1–5 逐条落修；**只改形式面**（计数 ∥ 指针 ∥ 注记）；判据 / 机制语义零改；产品码零触；他批面零触（`2026-10-05-engine-face-gaps.md` ∥ `2026-10-05-review-gate-gaps.md`）。上文 §2.2–§2.5 已就地订正（细目 = 本块逐号）。

**逐号落修**：

1. **🟡 delete.md 目标行数**（发现 1）：§2.3 `:109`「13 → 17 行」→「**13 → 15 行**（按内容行计；围栏行不计）」；§2.4 行 4 `:118`「+4（⇒ 17）」→「**+2（⇒ 15；按内容行计）**」——口径 = `TOOLS.md`:1098-1112 代码块内容行共 15。
2. **🟡 新测试档规模**（发现 2）：§2.4 行 5 `:119`「新增（本批自持）」→「**新增 ≈260**（#942 红绿对 + tool 级夹具 + #943 五格 + 回归；≤300 免登记；越 300 ⇒ 拆波次族——先例 `2026-10-04-issue-fix-round1.a.test.mjs` / `.b`）」——同族先例口径 = `TOOLS.md`:843。
3. **🔵 §2.2 坐标复读**（发现 3）：五处按修正轮终盘刷新——条 6 `:262-266` → **`:263-267`** ∥ 行为变更登记 ⑦ `:270` → **`:271`** ∥ D-BR25 `:430` → **`:431`** ∥ §8 `:441` → **`:442`** ∥ 变更记录 `:463` → **`:464`**。**同族顺手（额外报告项）**：同行 `:541-542` → **`:542`**（`:541` 实为空行）；表头 as-of 改**修正轮**；#942 行补「条 1 `:247`（修正轮指针）」；#943 行 D-TO16 `:1137` → **`:1138`**（修正轮 +1 行随动）∥ 补「快照面注 `:1116`」；§2.4 行 7 / 行 8 计数随动（**542 → 544** ∥ **1332 → 1335**）。
4. **🔵 #943 undo 快照面**（发现 4）：**实核 = 空目录目标不产生 undo 条目**——探针（读-only；空目录目标 size=0）：`snapshotForUndo` 后 `_undoStack` 长 **0**（对照组 = 非存在路径 ⇒ 1 条创建态 `backup: null`）；`readFileSync(dir)` 抛 `EISDIR` ⇒ 捕后跳过——建议句原样成立（无需改判）。落点 = `TOOLS.md` §6.21 快照面注 `:1116` + 本档 §2.5 注 `:141`。
5. **🔵 条 1 ③ 通用腿**（发现 5）：`BATCH-RECORD.md` §4.15 条 1 `:247` 括注补半句指针「**create 面腿序与收窄**见条 2 / 条 6」——防单读条 1 误读（与 BR-45 相抵消解）；`BATCH-RECORD.md` 变更记录 +1 条（`:544`）∥ `TOOLS.md` 变更记录 +1 条（`:1335`）。

**自检读数（修正轮复跑）**：`node scripts/doc-check.mjs` ⇒ **exit 0**——`OK(锚): 0 条悬空（闸态——阈值 0）` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行`；新增行（§6.21 注 ∥ 条 1 指针）复扫零悬空 ∕ 零超宽；行数面 18 条 = 报告态（desktop 域存量——非本批面）。

**未做（有意）**：判据 / 机制语义零改；产品码零触；他批面零触；机检卫生 ∕ 收口陈述 ∕ 本轮未派面——不做。

### 2.10 评审修正轮块（评审 #28 · §3 轮次 2 五项落修 · 2026-10-05 · eng-designer）

**段位**：本轮 = 评审 #28（§3 轮次 2 · pass · 0🔴 / 1🟡 / 4🔵）微修轮——按发现号 1–5 逐条落修；**只改形式面**（执行通道注 ∥ 计法 ∥ 范围注 ∥ 口径注 ∥ 半句限定）；判据 / 机制语义零改；产品码零触；他批面零触（`2026-10-05-review-gate-gaps.md` ∥ `2026-10-05-engine-face-gaps.md`）。上文 §2.2 / §2.4 / §2.5 已就地订正（细目 = 本块逐号）；设计档订正 = `BATCH-RECORD.md` §4.15 条 3（#5）∥ `TOOLS.md` §6.21（#3 / #4）——各档变更记录 +1 条。

**逐号落修**：

1. **🟡 断代重锚执行通道**（发现 1）：§2.5 注补记「**执行通道 = 父侧直接执行**（跨批伴随件不在批次档写门豁免面内——工程角色直写必拒；判据 = `BATCH-RECORD.md` §4.2 / D-BR23）——该文件**不列入实施派发 files 面**（实施者自跑件不含它）」；§2.4 行 6 变更列随指。
2. **🔵 Δ 两口径**（发现 2）：按实际改动统一——**断代注独立成行 ⇒ Δ = +1（271 → 272）**：§2.4 行 6 Δ 格改「+1（两行改钉 + 断代注一行 ⇒ 272）」；§2.5 注补计法（按文件行数净增计）。
3. **🔵 tracked 前提范围注**（发现 3）：`TOOLS.md` §6.21 补**范围注**（「不经跟踪检查」放宽面——常规面声明 ∥ 索引条目（gitlink）对应空目录路径一类 **unverified**）——`:1117`；§2.2 #943 行坐标随动（范围注 ∥ 口径注 `:1117-1118` ∥ D-TO16 `:1140`）；§2.4 行 8 计数随动（⇒ 1339）；`TOOLS.md` 变更记录 +1 条（`:1339`）。
4. **🔵 逐字文本面归属**（发现 4）：**实读 `PROMPT-SYSTEM.md` 现持面** = §6.11 描述面机制与预算（外置单源 ∥ 预算表唯一权威处；写作契约指针 → `TOOLS.md` §6.9）——本批描述档文本**不在该档**（零命中）；判 = §6.x 节即逐字文本面正位（承 §6.20 先例）⇒ `TOOLS.md` §6.21 补**口径注**消歧——`:1118`；`PROMPT-SYSTEM.md` **零改**（不入受影响表——原表无误）。
5. **🔵 条 3 锚定前缀范围**（发现 5）：`BATCH-RECORD.md` §4.15 条 3 `:253` 补半句限定（前缀可判——基底不落 cwd 项目根下时前缀不可判 ⇒ 不锚定；其无仓前缀形见条 6③）；§2.2 #942 行随动（条 3 轮 2 限定 ∥ 变更记录 `:546`）；§2.4 行 7 计数随动（⇒ 546）；`BATCH-RECORD.md` 变更记录 +1 条（`:546`）。

**自检读数（微修轮复跑）**：`node scripts/doc-check.mjs` ⇒ **exit 0**——`OK(锚): 0 条悬空（闸态——阈值 0）` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行（区带豁免在效——变更记录 ∥ 历史沿革）`；新增 ∕ 改动行（TOOLS.md `:1117-1118`、`:1339` ∥ BATCH-RECORD.md `:253`、`:546`）在扫面内零悬空 ∕ 零超宽。

**未做（有意）**：判据 / 机制语义零改；产品码零触；他批面零触；机检卫生 ∕ 收口陈述 ∕ 本轮未派面——不做。

### 2.11 实施评审 🟡① 登记块（§5.4 轮 1 · 父侧裁定 = 登记零变 · 2026-10-05 · eng-designer）

**段位**：本轮 = 实施评审 🟡①（§5.4 内部代码评审（advisor）轮 1）——「④ 腿多基底 + bare 单段静默取 `bases[0]`」（设计面缺口——实现与设计 §2.3 逐字一致；非 must-fix，报告父侧/设计侧裁）；父侧裁定（#33 披露）= **登记为有意零变面**（防扩面）。
落修 = 登记句（§2.6 决策表第 3 行就地登记 ∥ 细目 = 本块）；**判据 / 机制语义零改；产品码零触；他批面零触**（`2026-10-05-engine-face-gaps.md` ∥ `2026-10-05-review-gate-gaps.md`）。

**登记（终值 ∥ 落点）**：④ 腿多基底 + bare 单段名（如 `x.md`）⇒ **静默取首基底**（`bases[0]`）= 有意的**回归零变面**——既有命中面（修前判据链同形；实现与 §2.3 逐字一致 = 非实施偏差）；**不入拒面、不改代码**。
边界 = 「不静默取首个」（条 6③）适用于**无落点判据**腿；bare 单段名 = 既有命中面、回归零变——单段基底相对形照收（条 6④）。落点 = 本档 §2.6 决策表第 3 行。

**未做（有意）**：判据 / 机制语义零改；产品码零触；他批面零触；机检卫生 ∕ 收口陈述 ∕ 本轮未派面——不做。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file annotations | 🟡 | `delete.md` 目标行数标注与其逐字规格不符：批档 `docs/batches/2026-10-05-engine-tools-gaps.md:109` 与 `:118` 标「13 → 17 行」/「+4（⇒ 17）」，而所引「全文 = `TOOLS.md` §6.21 代码块逐字」的内容 = `TOOLS.md`:1098–1112 共 15 行（把围栏行 `:1097`/`:1113` 也算上才是 17）——按逐字实施得 15 行，收口 `wc -l` 核对必对不上 17。 | 按代码块内容行重算目标行数与 Δ（批档两处同步），或加一行计法口径注；纯 `.md` 不涉档位，重算即可。 |
| 2 | Affected-file annotations | 🟡 | 新增测试档行（批档 `:119`）仅标「新增（本批自持）」，无预期规模——该档承载 #942 红绿对 + tool 级夹具 + #943 五格 + 回归面，是否触及 300 软线无判据；同族新档先例均带 ≈N（`TOOLS.md`:843「≈45（DOM-C1 / C2；≤300 免登记）」）。 | 补 ≈N 行预期与档位结论（≤300 免登记 ∥ >300 拆分计划）。 |
| 3 | Doc hygiene | 🔵 | 批档 §2.2 落点表 #942 半区五处坐标较现盘低一行：条 6 引 `:262-266`（实 = `BATCH-RECORD.md`:263 标题 ∥ ③ `:264` ∥ ④ `:265` ∥ 多落点文案 `:267`）· 行为变更登记 ⑦ 引 `:270`（实 `:271`）· D-BR25 引 `:430`（实 `:431`）· §8 引 `:441`（实 `:442`）· 变更记录引 `:463`（实 `:464`；`:463` 是兄弟批「工具面首用可发现性」的落点行）。前半坐标（`:29` / `:161` / `:169-171` / `:251-254`）与 TOOLS / CORE-UNIFICATION 坐标（`:1077` / `:1137` / `:1414` / `:1831` / `:2071`）逐条相符。 | 按现盘复读刷新五处坐标（或统一标 as-of 近似）——防实施/收口核对落错行。 |
| 4 | Acceptance | 🔵 | #943 目录臂未涉 undo 快照面：`TOOLS.md`:184 载「副作用工具执行前 `snapshotForUndo`（写前文件内容入内存栈）」——空目录零内容，设计未明示进栈关系，验收表（批档 §2.5 #943 组）亦无该项（依据限四档内文；快照面对目录目标的实际行为未核）。 | 明示处置（如「空目录移除不产生 undo 条目——零内容语义」）入 §6.21 边界或验收注；若实施核出快照面另有行为面 ⇒ 另立。 |
| 5 | Clarity | 🔵 | `BATCH-RECORD.md`:247 条 1 候选序 ③ 仍书「逐基底 `resolve(基底, p)`」为通用腿；create 面已由条 2（`:252`）「**基底相对形（限单段文件名）**」+ 条 6（`:263-265`）收窄，条 1 无指针——单读条 1 会误读 create 仍收多段基底相对串（与 BR-45 的通用 fail-closed 拒相抵）。 | 条 1 挂半句指针（create 面腿序/收窄见条 2/条 6），或就地限定 ③ 腿适用面。 |

VERDICT: pass

计数：🔴 0 · 🟡 2 · 🔵 3

### 轮次 2（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility | 🟡 | 表 #6 断代重锚的目标 = 他批伴随件 `docs/batches/2026-10-02-manifest-resolution-fix.test.mjs`（批档 `:120` / `:143`「`2026-10-02-manifest-resolution-fix.test.mjs:236-237` BR-35 腿按本批收正改钉」）；批次档写门只豁免**自身**批次伴随件——`BATCH-RECORD.md:429`「批次档写门**豁免自身批次伴随件**（非 `.md` · 同目录 · 词干族三合取」、否决备选②「一切非 `.md` 放行（圈扩——他批伴随件亦可写）」在册被否、`:76`「工程角色子代理直写他批档被拒」⇒ eng 角色按表直写该档将在该步被拒；设计（§2.5 注 / §2.7 上抛项）未记该条执行通道。 | 在 §2.5 注或 §2.7 补记该条执行通道（跨批伴随件不在批次档写门豁免面内——直写必拒）：列为上抛项 ∥ 改走不受该门约束的通道（判据面引 `BATCH-RECORD.md` §4.2 / D-BR23）。 |
| 2 | Affected-file annotations | 🔵 | 表 #6 Δ 标「±0（两行改钉）」（批档 `:120`），§2.5 注（`:143`）却写「+ 断代注一行」——断代注若为新增行则 Δ = +1（271 → 272）；两处并列读不出唯一 Δ。 | 统一 Δ 与计法：断代注内联于改钉行 ⇒ 保留 ±0 并补计法注；独立成行 ⇒ 改 +1。 |
| 3 | Acceptance | 🔵 | `delete` 目录臂「**不经跟踪检查**（空目录不可能被 git 跟踪——`force` 语义只对文件）」（`TOOLS.md:1086`；批档 `:106` 同句）系安全性放宽面，前提未附范围注；回归格「tracked 拒 / `force` 通行」（批档 `:139`）只覆盖文件臂——目录面 tracked 边界无用例 ∕ 无边界登记。 | 为该前提补范围句或边界登记（含索引条目（gitlink）对应空目录路径一类——**unverified**，可只作范围注）；或在 `:139` 回归组补一格目录面边界。 |
| 4 | Document ownership | 🔵 | `TOOLS.md:22` 自述「的行本体住 `docs/core/design/PROMPT-SYSTEM.md`（提示词面）；本档只收**实现面**与工具行为契约」，而 §6.21 内联 delete.md 全文逐字（`TOOLS.md:1095`「**描述档（`thincoder-core/tool-docs/delete.md`——全文改后逐字）**：」起）；受影响文件表（批档 `:113-124`）与 §2.2（`:35`）均未列 `PROMPT-SYSTEM.md`。文档图缺席 ⇒ 四档内不可定论（同形先例 = §6.20 逐字文本面做法）。 | 核对 `PROMPT-SYSTEM.md` 现持面：若描述文本行本体在该档 ⇒ 补登记 ∕ 指针（消双源）；若判 §6.x 节即逐字文本面正位（承 §6.20 先例）⇒ 补一句口径注消歧。 |
| 5 | Clarity | 🔵 | §4.15 条 3 字面「`p`（归一 `/`）以**任一基底的「项目根相对前缀」**（如 `docs/batches`）打头」（`BATCH-RECORD.md:253`）未限「前缀可判」范围；#942 收正面却取决于跨仓 ∥ 声明面他仓基底前缀**不入锚**（`BATCH-RECORD.md:431`「在「基底不落 cwd 项目根下」时前缀不可判 ⇒ 漏锚」）——否则锚定腿会先拦截 `docs/batches/<x>.md` 改判 fail-closed，与 BR-43「落基底**自有项目根**形（`resolve(owningProject(基底), p)`——恰一落点）」（`:169`）相抵。单读条 3 者可把锚定前缀面实现为 owningProject 形。 | 条 3 补半句限定 ∕ 指针（跨仓 ∥ 他仓声明基底前缀不可判者不锚定——其无仓前缀形见条 6③），与条 1 既有「单读误读」修正同法。 |

VERDICT: pass

计数：🔴 0 · 🟡 1 · 🔵 4

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-05 18:54「自动跑」授权）**——依据：评审 `#22`（轮 1 pass · 0🔴 · 2🟡 · 3🔵）+ 评审 `#28`（轮 2 pass · 0🔴 · 1🟡 · 4🔵）；修正轮 `#24`（五项）+ `#30`（五项）逐条父侧核验在盘（批档 `:109` · `:118` · `:120` · `:94` · `:143-144` · `:163` ∥ `TOOLS.md` `:1117-1118` · `:1339` ∥ `BATCH-RECORD.md` `:253` · `:546`）。token 已签发。

**发现处置汇总**：轮 1 五项 = 全落修（`#24`）；轮 2 五项 = 全落修（`#30`——含**断代重锚执行通道 = 父侧直接执行**在册、**Δ 统一 = +1（271 → 272）**、`BATCH-RECORD` 条 3 **前缀可判限定**、`TOOLS.md` §6.21 范围注 + 口径注）。

**执行序注**：跨批伴随件（`docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` BR-35 腿）重锚 = 父侧直接执行，**须赶在本批实施者复跑前落**；且避与在跑批 `2026-10-05-engine-face-gaps`（`#32`）的只读复跑并发——派发序 = **候 `#32` 落定后：父侧重锚 → 本批实施派发**。

**批准结论**：设计定版（#942 两腿收正/收窄 + 多落点拒 ∥ #943 delete 空目录臂），进入实施候位。

## §5 实施记录（eng-coder）
**状态行**：实施完成（五件在盘（206/298/193/15/279）；红基线 8红2绿 → 10/10 ∥ 旧伴件 6/7 → 7/7；审计轮 1 + 评审轮 1/2 在段内；终态 clean）



### 5.1 实施面（#942 ∥ #943 · 2026-10-05 · eng-coder）

- 段位：批次档 §2（#942 批档路径静默嵌套收正 ∥ #943 delete 空目录臂）实施——写列面五件（三源码档 + 一描述档 + 批内新件）；设计档 / 旧伴件 / 他批面零触。
- 依据：§4 批准（父侧代签 · token）；设计单源 = `BATCH-RECORD.md` §4.15 条 6 ∥ `TOOLS.md` §6.21（§2.2 全表；机制逐字 = §2.3）。

### 5.2 改动清单（file:line）

| # | 文件 | 改动 |
|---|---|---|
| 1 | `thincoder-core/agent-tools/batch-paths.mjs` | `:13` 头注条 6 一行 ∥ `:102` `ambiguousLandingError` 常量（文案逐字）∥ `:154` JSDoc 条 2/3→2/3/6 ∥ `:184-205` ①② 腿去基底腿 + ③ 基底自有项目根腿 + ④ 基底相对单段收窄（= §2.3 终形逐字）——186→**206** 行（Δ +20，恰 §2.4 上界） |
| 2 | `thincoder-core/tools/patch.mjs` | `:257` param desc ⇒ `File or empty-directory path (relative to cwd or absolute)` ∥ `:272-278` delete 目录臂（tracked 检查前 return；ENOTEMPTY/EEXIST ⇒ 拒句逐字；回执 `Deleted <path>`）——292→**298** 行（Δ +6，恰上界；<300 软线） |
| 3 | `thincoder-core/tools/write-path.mjs` | `:22` import `rmdir` ∥ `:123` op 表补 `rmdir` ∥ `:152-153` `case "rmdir"` 臂（非空 ENOTEMPTY 上抛；不记 dirty）∥ `:109` / `:179` 注释随动——191→**193** 行（Δ +2） |
| 4 | `thincoder-core/tool-docs/delete.md` | 全文 13→**15** 内容行 = `TOOLS.md` §6.21 代码块逐字（逐字核 = true；EOL = LF 同族） |
| 5 | `docs/batches/2026-10-05-engine-tools-gaps.test.mjs` | 新件（红绿对 10 腿 + symlink 可建性守卫 + cleanup 只读位清理）终值 **279** 行（≤300 免登记） |

### 5.3 命令 + 读数（红基线 ∥ 实施后 ∥ 旧伴件）

- 红基线（实施前实跑 · 批内新件）：`node --test docs/batches/2026-10-05-engine-tools-gaps.test.mjs` ⇒ **8 fail / 2 pass**——红腿逐条：①a 嵌套落点 `…/docs/batches/docs/batches/2026-10-05-cross.md` ∥ ①b 正确落点缺席 ∥ ② / ③ `Missing expected exception`（静默）∥ #943-op `unknown op "rmdir"` ∥ #943-① / #943-② 旧拒句 ∥ #943-③ 嵌套空树旧拒句；先绿两格 = #942-回归 ∥ #943-回归（零变面——预期先绿）。
- 旧伴件基线（父侧重锚后）：`node --test docs/batches/2026-10-02-manifest-resolution-fix.test.mjs` ⇒ **6/7**（AC-5 BR-35 腿 `:237` 红——待实施转绿；余六腿绿）。
- 实施后：批内新件 ⇒ **10/10 pass**；旧伴件 ⇒ **7/7 pass**（BR-35 转绿）。🔵 落修后复跑 ⇒ **10/10** 保持。
- 语法 / 形状：三源码档 `node --check` 全绿；行数读数 = 206 ∥ 298 ∥ 193 ∥ 15（内容行）∥ 279（新件）——逐件对照 §2.4 上界 = 恰 ∥ 恰 ∥ +2/6 ∥ +2/2 ∥ ≤300。

### 5.4 审计 / 评审轮与终态

- 内部分歧审计（read-only explore）轮 1 = **DEVIATIONS**：产品码逐字零偏差 / 零清单外；两项 = 🟡「§5 未写入」（本段即消）∥ 🔵「API-CONTRACT 生成区坐标滞留」（报告项——写面禁令）。
- 内部代码评审（advisor）轮 1 = **pass**（0🔴 / 2🟡 / 1🔵）：🟡① ④ 腿多基底 + bare 单段静默取 `bases[0]`（**设计面缺口**——实现与设计 §2.3 逐字一致；非 must-fix，报告父侧/设计侧裁）∥ 🟡② §5 未写入 ∥ 🔵③ 批内件 `symlinkSync` 无守卫。
- 🔵③ 落修：建链包 try/catch（catch 仅包 symlinkSync；不可建 ⇒ 读数 + 跳过链接子腿；三条断言入 `canLink` 分支、断言面零改）⇒ 复跑 **10/10** 保持。
- 内部代码评审轮 2（fix-claim 复核）= **pass**（0🔴；🔵③ = Fixed；🟡①② = Accepted）；轮 2 新增 1🔵 = `:245` 跳过情形收尾读数仍称「symlink 本体删 ✓」（读数保真面——非阻塞、未落修，登记待父侧裁）。
- **终态 = clean**（无未决 must-fix；未决项 = 设计缺口 🟡① 报告父侧裁 ∥ 读数保真 🔵（轮 2）登记）。

### 5.5 披露

- `docs/core/design/API-CONTRACT.md` 生成区未刷新（`:552-556` `batch-paths.mjs:161` 等导出行坐标滞后 +2）——写面禁令五件；生成器运行 = 父侧收口（`node scripts/api-contract.mjs --write`）。
- 仓套件未跑（收口 = 父侧）；旧伴件只读复跑；设计档 / 旧伴件 / 他批面零触。
- 复跑面读数为实施者实跑；「断言面零改」字节级同形 = unverified（无修前快照可比——内容层已核）。
- 测试件设施注：`cleanup` 含只读位清理（Windows：git 松散对象 mode 444 ⇒ `rmSync` EPERM——先清位再删）。

## §6 验证与收口（父代理）
