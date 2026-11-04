# 2026-11-03 · write-gate-all-face
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-03 · 来源 = 用户 2026-11-03 00:31 逐字纠正（「我要求的是先挂台账，挂台账又不需要用写工具！……你他妈的就用这个不成立的理由把整个机制给否了？！」）+ 台账 `#2011`。
> 台账 = #2011（core · 归批）。前情 = docs/batches/2026-11-02-light-channel-tools-face-retire.md §6（已收口 2026-11-03；缺陷记录在该节「本批发现的机制缺陷」）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-03
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批题**：拆掉我在写门上开的「文档面免检」，改成**不分面**：任何写工具的落盘都要有活批档。

## 用户裁定（逐字，2026-11-03 00:31）

> 「我要求的是先挂台账，挂台账又不需要用写工具！你挂完台账再开批会死啊！你他妈的就用这个不成立的理由把整个机制给否了？！」

## 我错在哪（不辩解，写进档）

**⇒ 我在上一批的设计里立了这条前提**：「写批档本身也要活批档 ⇒ 第一批永远开不了 ⇒ 文档面必须免检」。
**⇒ 该前提是假的**：`ledger` 工具挂台账、`batch` 工具开批档，**两件都不走写门**。
**⇒ 顺序本来就成立**：先 `ledger` 挂行 → 再 `batch` 开档 → 盘面活了 → 然后才许写。**

**⇒ 我拿一个不存在的死锁，给整道写门划了免检区；而这道门的原意就是「没台账不许改东西」。**

**⇒ 三轮设计评审无人命中** —— 因为我把它写成了「设计前提」。**写成前提的洞，评审看不见。**

## 现状（父侧实读）

- `thincoder-core/agent/write-gate.mjs` 的 `productCodeWriteConflict`：**面判先行** —— `detail.face !== "product"` ⇒ `continue`（连台账都不读）；只有产品面才问 `liveBatchOpen`。
- 消费点 `thincoder-core/agent/dispatch.mjs` 的第三道门：`FILE_MUTATORS` + `file_ops` 落盘时调它。
- 活批档判据（`thincoder-core/agent/live-batch.mjs`）本身没问题：批档 `进行中` ∧ 台账 `在途` 行 ∧ 该行 `task_book` 指向本档，三条同时成立；读不到台账 ⇒ fail-closed 照拦。

## 需求（本批要交付的）

1. **写门不分面**：任何 `FILE_MUTATORS` ∥ `file_ops` 落盘 ⇒ 先问活批档；没有 ⇒ 拒。面判**不再**作为放行理由。
2. **拒文要能照做**：拒的时候点名两件事 —— ① 现在该做什么（先 `ledger` 挂行、再 `batch` 开档）；② 台账读不到时的原始错误（fail-closed 沿既有行为）。
3. **文档面与产品面同等**：改需求档、设计档、批档以外的任何 `.md`，同样要活批档。
4. **本批自己的落地也守这条**：本批的笔从第一笔起就在活批档下（本档已开 ⇒ 已满足）。

## 边界（不做）

- **不动活批档判据本体**（三合取照旧）—— 问题在「谁被问」，不在「怎么判」。
- **不动 `bash` ∥ `execute` 的写路径** —— 那两道不经过写门，是本批之外的独立缺口（另记，不并入）。
- **不加任何「例外面」** —— 用户已两次裁掉豁免桶：这次不再造第三个。

## 前情

缺陷记录在 `docs/batches/2026-11-02-light-channel-tools-face-retire.md` §6「本批发现的机制缺陷」；该批因缺陷**不干净收口**。

## 更正：判据是「活台账」，不是「活批档」（用户 2026-11-03 00:39 逐字）

> 「"先问活批档"我觉得这是你在挖坑想接着绕过去，我说的明明是活台账，你这是又想再制造一个矛盾故意让流程打回，堂而皇之的废掉机制。」

**⇒ 我在本文前半段把判据写成了「活批档」（台账在途 ∧ 批档 §1 进行中 ∧ 指针互指）—— 那是在用户条件下**加了两道**。**
**⇒ 用户的原话是「有台账才能写」。判据就是它，一个字不多：**

```
台账里存在一条 status = 在途 的行 ⇒ 放行
没有 ⇒ 拒
台账读不到 ⇒ 拒（fail-closed，拒文带原始错误）
```

**⇒ 为什么加条件是错的（记下来，这是我第三次犯同一个毛病）**：多加的每一条合取项，都会在某个真实场景里变成「这机制走不通」的证据，然后有人拿它把整套机制废掉。**用户不是多疑 —— 他见过我把机制写成「有例外」的样子。**

**⇒ §1 前半段那行旧措辞（「先问活批档」）不再作为本批判据；本行之后的「活台账」才是。**

## 实施期撞出的两条设计档错误（父侧裁，2026-11-03 01:16）

**① `boundary` —— 设计档错，代码对。**
设计档 §2.3 原写「`ledgerQuery` 不传 `boundary`」，调用形 `ledgerQuery({cwd: <root>, status:"在途"})`。实施席实读契约：`thincoder-db` 侧 `openLedger` 的 `boundary` **必传**（缺则 `resolve(undefined)` 抛）⇒ **照设计档写，门会把每一笔写都拒**。
**⇒ 裁**：设计档改成与契约一致的写法（`boundary: root`，起点与上界同根 —— 仍只有一条推导路径，原意不破）；**代码不动**。

**⇒ 性质**：这不是笔误 —— 设计席引了 `live-batch.mjs` 的注释（「本查找面的根上界」），**没读 `openLedger` 的必传契约**。**引注释不引契约，就是这个错的原因。** 父侧批设计时也没核这条。

**② `grep "live-batch"` = 0 —— 判据抓错了东西。**
用例档名本身含该串（头注自引 + RTM 回指），实测 9 命中**全是档名**，无一条指已删模块。
**⇒ 裁**：判据收窄成 `liveBatchOpen` + `agent/live-batch` 前缀形（要抓的是「还有人 import 已删模块」，不是「谁提到这个字符串」）。**不放宽域求绿。**

**③ 代码评审问「§6 用例表的 `vendor` / `target` 格要不要单开 RTM 行」—— 不开。**
那两格与 RTM 12-5 断言的是**同一个业务结果**（未声明目录 ⇒ 产品面 ⇒ 拒），只是输入不同；再开一行是同一判据的重复登记。**⇒ 设计席在 §6 那两格注明「由 12-5 覆盖」，不新增行。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审第 1 轮 12 条全收，逐条落地（详见下方各条改动与 §3 末轮））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**档落点**：机制设计 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.3（写锁判据 / 拒文 / 出辖作用域）· §2.6（五道门表）· §3（受影响档）· §4 决策 32 ∥ 33 · §5 R2 ∥ R29（验收）· §6（用例表）；符号面 = `thincoder-core/agent/write-gate.mjs` 的导出 `ledgerOpenWriteConflict` ∥ 同档模块内判据函数 `ledgerOpenAt`（不导出）；集成面 = `test/RTM.md` 故事 12。

## 判据（一条，零合取项）

```
写工具落盘 ⇒ 问：台账里存在一条 status = 在途 的行吗？
   有        ⇒ 放行
   没有      ⇒ 拒（拒文说「先挂台账」）
   台账读不到 ⇒ 拒（fail-closed，拒文带原始错误）
```

- **只读行状态**：行标题、`kind`、`board`、`task_book` 指向一律不参与判定；批档在不在盘、§1 什么状态也不参与。
- **不加任何上位条件**：多一个合取项，就会在某个真实场景变成「机制走不通」的证据，接着被用来把整套机制废掉。判据就是上面那一条。
- **作用域 = 目标路径所属项目根**：台账按项目根存（`ledger` 的 `cwd`）；目标解析不出项目根（祖先链无 manifest）⇒ 没有「本项目的台账」可问 ⇒ 门不管。这是判据的作用域边界，不是豁免面（设计 §2.3「出辖为什么不是例外」）。
- **面不再放行**：文档面、项目状态档、产品代码面、产品测试面读同一条判据；面只剩一个用途——选拒文变体。
- **「零合取项」说的是判据，不是挂门范围**：工程模式 ∧ `depth = 0` ∧ 目标在辖内是**挂门范围**（谁被这道门问到），不是判据的合取项；依据 = 设计 §2.3 判序 ∥ §4 决策 11。普通模式与 `depth > 0`（子代理）两态**零改**——写锁不进它们，既有 token 门照旧。

## 本批条目（§1 四条 + 用户 2026-11-03 两条裁定）

| # | 需求 | 判据落点 | 交付面 |
|---|---|---|---|
| 1 | 写门不分面：任何写工具落盘先问台账里有没有在途行 | 设计 §2.3 判据表 | `thincoder-core/agent/write-gate.mjs` 判据改写 |
| 2 | 拒文能照做（① 两步动作 ② 台账原始错误） | 设计 §2.3 拒文表（三变体 + 共用照做句） | 同上 |
| 3 | 文档面与产品面同等 | 设计 §2.3 判据表 ∥ §5 R2 ②；RTM 12-2 | 同上 + 集成用例 |
| 4 | 本批自己的笔也在这条判据下 | 台账 `#2011` 现存 `在途` 行（盘面事实，零代码） | — |
| 5 | 零消费判据整条退场（用户裁定 ①）：函数删 + 设计 §2.2 整节删 + 引用面清 | 设计 §2.3 读法条 ∥ §4 决策 32 ∥ §5 R29 | `thincoder-core/agent/live-batch.mjs` 删档 |
| 6 | 出辖是判据的作用域、不是例外（用户裁定 ②），理由写进档 | 设计 §2.3「出辖为什么不是例外」∥ §4 决策 33 | 设计档一处（判据零改） |

**需求层零改，且不需要改**：`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5 逐字只写面分流——「**两面**：文档面 = 按写权矩阵（D1）……**产品面 = 其余一切路径**……**一律走全流程**」，从未写「文档面免写门」。本批动的是设计档 §2.3 的写锁判据，不触需求层。

**§1 边界的一条已被裁定取代**：§1 原写「不动活批档判据本体（三合取照旧）」——用户 2026-11-03 裁定 ①（零消费 ⇒ 整条退场）取代该条；§1 其余边界仍照写。

**本批不覆盖**：`bash` / `execute` 的写路径（不经写门，独立缺口，另记不并入）· 需求档与代码（本席零碰；实施轮的删档与注释收正见「受影响文件」）· 新增任何例外面（零）。

## 机制设计（一句话）

`ledgerOpenWriteConflict(agent, depth, absPaths)`：**先判目标所属项目（出辖 ⇒ 没有本项目台账可问 ⇒ 门不管）→ 再问该台账「有在途行吗」→ 没有即拒**；判据函数 `ledgerOpenAt(absPath)` 住 `write-gate.mjs` 模块内（不导出）；面只剩拒文变体一个用途。

## 受影响文件（档位结论：无一档跨档位——删一档、零新起文件，改动全为就地改写；档位软线 = 500 / 800 行，受触档最大 = `thincoder-core/agent/write-gate.mjs` 224 行 · `test/integration/batch-live-batch-lock.test.mjs` 135 行（加 12-7 一例后仍远低 500）；函数级：本批不为任何函数新增规模判据，判据体净增 ≤ 20 行——改的是读台账在途行与拒文字面，不是函数拆分）

| 文件 | 变化 |
|---|---|
| `thincoder-core/agent/write-gate.mjs` | 判据改写（读台账在途行）+ 导出改名 `productCodeWriteConflict` → `ledgerOpenWriteConflict` + 三变体拒文（字面单源住设计档 §2.3）+ 模块内判据函数 `ledgerOpenAt`（不导出）+ 删 `import { liveBatchOpen }` |
| `thincoder-core/agent/live-batch.mjs` | **删档**（不是留空壳）：`liveBatchOpen` 零消费面 ⇒ 整档退场 |
| `thincoder-core/agent/dispatch.mjs` | import / 调用改名 + 写锁注释块改口径（「产品面 ∧ 无活批档」→「辖内任何写盘 ∧ 台账无在途行」） |
| `thincoder-core/agent-tools/batch-reopen.mjs` | 回收失败回执逐字改口径（设计 §2.13）：`该档不是活批档（写锁会拒产品码写）` → `台账里没有该档的在途行（写锁会拒每一笔写盘）` |
| `thincoder-core/agent/write-face.mjs` · `thincoder-core/ledger-db.mjs` · `thincoder-core/ledger-write-ops.mjs` | 注释口径收正：凡写「写它要活批档」∥「活批档闸候选枚举」∥「不是活批档（锁照拦）」的注释改为台账在途行口径（判据零改） |
| `test/integration/batch-live-batch-lock.test.mjs` | 12-1 加两步照做句断言；12-2 改写（无在途台账行写 docRoot 内 `.md` ⇒ 拒 ⇒ 补在途行后照写）；12-3 用例标题去「活批档」措辞；**新增 12-7 一例**（出辖 ⇒ 放行）；12-4 加「坏 manifest」一格；**头注措辞改口径**——故事名「无活批档不许改产品代码」→「无在途台账行不许写盘（不分面）」· 回指列表删 `§2.2` · 符号 `productCodeWriteConflict` → `ledgerOpenWriteConflict` |
| `test/RTM.md` | 故事 12 节注回指删 §2.2（回指 = §2.3 ∥ §2.10 ∥ §2.12）· 12-4 加「坏 manifest」一格 · 新增 12-7（出辖 ⇒ 放行）· 12-6 标「借行」并写迁出触发条件 |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | **§2.2 整节删**（D8）· §2.1 标题 · §2.3 判据表 / 出辖作用域 / 读法（含 `ledgerQuery` 的 `boundary` 必传调用形 —— 依据 `thincoder-core/ledger-db.mjs` 的 `@param boundary` 契约，不引注释）/ 三问 / 最近先例 / 本轮调研证据 · §2.4 ∥ §2.13 引用面 · §2.6 · **§2.10 拒文两条旧英文串删**（拒文单源收到 §2.3）· §3 档行与消费面表（3 档 7 处；删 `light-round.mjs` 已退场行、计数改 25 档）· §4 决策 1 ∥ 7 ∥ 32 ∥ 33 · §5 R2 ∥ R10 ∥ R29 · §6（`vendor` / `target` 两格注明「由 12-5 覆盖」——同一业务结果，不单开 RTM 行）· §9 12-1 ∥ 12-2 ∥ 12-5 改写 ∥ 12-7 新增 |
| `thincoder-core/prompts/discipline-engineering.md` | **零改**——提示词不载这条判据（`grep` 零命中），机器单源在 `write-face.mjs` |

## 验收对照

**跑法惯例**：本段判据里的 `grep` / `grep -rn` / `grep -c` = 工具面的 grep。这台机器的 PowerShell 里没有 `grep` 二进制，逐字跑请改用 `Select-String`。

`Select-String` **没有 `-Recurse`**（本席试跑原话：「找不到与参数名称 Recurse 匹配的参数」），递归形 = `Get-ChildItem -Path <dir> -Recurse -Include *.md,*.mjs | Select-String -Pattern "x"`。判据语义一个字不变：换 PowerShell 形只是把同一条判据跑起来，判据本身不因 shell 改口径。

判据逐条在**设计 §5 R2**（写锁四臂）与**设计 §6 用例表**（正常 / 边界 / 错误逐格），本段只引不抄。

- 可跑面（本批 changed-face 验收）= `node --test test/integration/batch-live-batch-lock.test.mjs`——12-1 / 12-2 / 12-3 / 12-4 / 12-7 由实施轮改写后跑；纯逻辑面零新增可跑文件（判据已在集成用例的入口上）。
- 退场面（设计 §5 R29）：**扫描面 = `thincoder-core` + `test`**（代码与测试面；设计档与本批档要写这条判据，字面必然在，不进来）。
- `grep -rn "liveBatchOpen" thincoder-core test` = 0 · `grep -rn "agent/live-batch" thincoder-core test` = 0 · `grep -rn "no live batch record" thincoder-core test` = 0（旧拒文两条英文串随 §2.10 单源化同清）。
- 第三条判据抓的是「还有人 import 已删模块」，不是「谁提到这个字符串」：裸串 `live-batch` 必命中用例档名 `batch-live-batch-lock.test.mjs`（头注自引 + `test/RTM.md` 回指），实测 9 命中全是档名、无一条指已删模块。⇒ 判据取 `agent/live-batch` 前缀形（实测 0 命中），不放宽域求绿。
- `thincoder-core/agent/live-batch.mjs` 不在盘；`grep -n "ledgerOpenAt" thincoder-core/agent/write-gate.mjs` ≥ 1 ∧ 同档 `^export.*ledgerOpenAt` = 0（判据函数住模块内、不导出）。
- 文档面机检：`(Get-ChildItem test -Recurse -Include *.md,*.mjs | Select-String -Pattern "§2\.2")` = 0 命中（该节已按 D8 删，回指面与用例头注同步清）。
- 父侧收口：写锁四臂逐格实跑（有在途行 ⇒ 放行 · 无 ⇒ 拒 · 出辖 ⇒ 门不管 · 台账读不到 ⇒ 拒带原始错误），读数记 §5 / §6。

## 关键决策

1. **判据只一条，零上位条件**：用户 2026-11-03 00:39 逐字纠正后，判据 = 「台账里存在 status = 在途 的行」。判批档状态或指针互指都是在用户条件下加合取项——加出来的每一道，都会在某个真实场景变成「机制走不通」的证据。
2. **出辖保留「门不管」，且写明它是判据的作用域、不是例外**（用户裁定 ②）：判据问「这个项目的台账里有没有在途行」，目标不在本项目里 ⇒ 判据的输入不存在。先判项目根（无 ⇒ 不读台账、门不管），再读台账 ⇒ 既不靠面放行，也不吃掉「台账读不到 ⇒ 拒」。被拒 = 写成按路径给的放行支（那就是第三个面）。
3. **拒文改两步路线，第一步的理由是「台账是判据」**：`ledger({action:"add"})` 建行（`待讨论`）→ `batch({action:"create", ledger:"#N"})` 接管（行 → `在途`，`task_book` = 本档）。两步都不在 `FILE_MUTATORS` 里，故门永不自锁。选它是因为它恒走得通——不带 `ledger` 的 `create` 在同面有未决行时会被要求 `newDebt`，那不是「照做就能开工」的句子。
4. **导出改名 `ledgerOpenWriteConflict`**：旧名说的是「产品码写要批」，口径比判据窄；新名说的是「台账开门」，与判据同宽。名字留着，下一个读代码的人先学会的是旧规则。
5. **零消费判据整条退场**（用户裁定 ①）：写锁改读台账后，三合取判据零消费面 ⇒ 函数删、设计 §2.2 整节删、引用面清，三件一起。理由：没有消费者的东西留着，下一轮读它的人先要判它是否还成立；而维护成本是真的——写锁改判这一轮，代码里留下三处仍在教旧判据的注释。被拒 = 留作备用导出。

## 上抛项

- **无待裁项**：两条上抛已由用户 2026-11-03 裁定并落地——① `liveBatchOpen` 删档 + 设计 §2.2 整节删 + 引用面清（设计 §2.3 读法 ∥ §4 决策 32 ∥ §5 R29）；② 出辖保留「门不管」并写明它是判据的作用域（设计 §2.3 ∥ §4 决策 33）。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

评审对象 = `docs/batches/2026-11-03-write-gate-all-face.md` ∥ `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` ∥ `test/RTM.md`（全档读毕；档位与既有件读数由本席实跑）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | 设计档 §2.10（`:642`/`:646`）仍逐字给出写锁旧拒文「write refused — no live batch record」，串内仍写已退场的三合取「its ledger row = 在途 ∧ that row's task_book points back to the record」；与 §2.3 新串「write refused — no in-flight ledger row」∥ §4 决策 32 两说并存，批档受影响文件表未列 §2.10 | 拒文单源收到 §2.3：删 §2.10 两条旧串（或改成指向 §2.3 一句）、把 §2.10 补进批档受影响文件表，并加机检 `grep -c "no live batch record"` = 0——R29 现用的 `活批档` 计数（= 1）看不见英文旧串 |
| 2 | Existing-piece check | 🟡 | 两个新名 `ledgerOpenWriteConflict` ∥ `ledgerOpenAt` 无三问答案；既有件在盘：`thincoder-core/agent/live-batch.mjs` 已调 `ledgerQuery({ cwd: cand, boundary: anchor, status: "在途" })` 并已带 fail-closed 原错（同档末 `return { open: false, error: readAny ? null : firstError }`），设计只说「零消费面 ⇒ 整档删」 | §2.3 读法旁补三问：`existing: …`（该档 + `liveBatchOpen` + 消费方）∥ `existing but unusable: …`（多两条合取、入参是 agent），并写明 `ledgerQuery` 是否仍传 `boundary`（既有调用形传，§2.3 读法写的是 `ledgerQuery({status:"在途"})`） |
| 3 | Clarity | 🟡 | §2.3 判据表同一输入两种结论：表第 4 行「目标出辖（祖先链无 manifest）」⇒ 放行，第 6 行「台账读不到（库不可开 / 根不可推导）」⇒ 拒。哪个「根」、manifest 在而读不动（坏 JSON）算哪边，读的人要自己猜 | §2.3 补一行钉子：出辖 = manifest 推不出 ⇒ 门不管；manifest 在而台账根 / 库不可得 ⇒ 拒带原错；并把「坏 manifest」一态写进 §5 R2 ∥ RTM 12-4 夹具 |
| 4 | Clarity | 🟡 | 批档 §2「判据（一条，零合取项）」+「不加任何上位条件」与设计 §2.3 逐字「工程模式 ∧ `depth = 0` ∧ 目标在辖内」并读像自相矛盾；只按批档 §2 实施会把门挂进普通模式与子代理 | 批档 §2 写一句：模式 / `depth` / 辖界是挂门范围、不是判据合取项（依据 §2.3 ∥ §4 决策 11），并点明普通模式与 `depth > 0` 两态零改 |
| 5 | Branch provenance (6b) | 🟡 | 两支没有场景来源：§2.3 表「同一笔写混合出辖与辖内目标 ⇒ 辖内那条决定 ⇒ 拒」无观测 ∥ 复现命令；「出辖 ⇒ 放行」只在 §6 用例表一格，`test/RTM.md` 故事 12 六行无一行断言，§9 缺行表也没写理由 | 给复现路径（一条 `write`/`apply_patch` 同给树内 + 树外两路径的命令），或把该行降为派生结论；出辖那格要么补 RTM 一行，要么在 §9 写明不开行的理由 |
| 6 | Precedent ∥ survey | 🟡 | 本轮判据改动（§2.3 ∥ §4 决策 32 ∥ 33）无「最近先例」行：无先例坐标（实现坐标 ∥ 对应设计节 ∥ 落地批）、无对齐 / 偏离理由；§1「调研证据」仍是上一批读数，未记本轮核过什么 | 补一行：先例候选 = 同档决策 28（删一个判据输入的形状）∥ 前一批「轻通道面退役」；写明对齐与偏离（本轮改的是判据本体而非输入），或明确声明「无先例」 |
| 7 | Acceptance ∥ doc state | 🟡 | §9 缺行表的 12-5 行写「写 `node_modules/…` · `thincoder-cli/dist/…` ⇒ 放行；写 `test/integration/…` ⇒ 放行」，与 `test/RTM.md` 12-5 现文「四条全拒」∥ §6 用例表「拒（产品面——构建物也要开批档）」相反；本轮 delta 未点名该行 | 删 / 重写该行，或在本轮 delta 块把它列进「破的行」并写新期望——「历史 delta 块不追改」拦不住照验收表实施的人 |
| 8 | Acceptance scope | 🟡 | 「零消费判据整条退场」的机检只在 `thincoder-core` 内 grep（§5 R29）：`test/**` 不在扫描面，而本批要改的 `test/integration/batch-live-batch-lock.test.mjs` 头两行仍写着故事旧名「无活批档不许改产品代码」 | R29 的两条 grep 扩到仓根（含 `test/**`）或写明只在 `thincoder-core` 扫的理由；该测试档头部措辞补进批档该行变化列 |
| 9 | Doc state | 🔵 | `test/RTM.md` 故事 12 节注回指仍列 `§2.2`，而设计档 §2 已按 D8 整节删；批档受影响文件表已列该项但无验收格 | 补一格机检（`grep "§2.2" test/RTM.md` = 0，或点名应改成什么） |
| 10 | Doc state | 🔵 | `test/RTM.md` 12-6 的交互是 search / 索引剪枝，挂在故事 12「无在途台账行不许写盘」下，与该表「一节 = 一个业务故事」不符 | 迁到对应故事节，或在本轮 delta 点名保留理由 |
| 11 | Tier check（本席抽测） | 🔵 | 「无一档跨档位」与我实测一致（`thincoder-core/agent/write-gate.mjs` 224 行 · `test/integration/batch-live-batch-lock.test.mjs` 135 行 · 其余各档第 501 行起无内容）；但结论句「未越 300 软线」的 300 无出处（准则档位 = 500 / 800），且无函数级（单函数 ≥300 行）读数 | 删掉 300 这个数或给出出处；档位结论补一句函数级读数 |
| 12 | Doc state | 🔵 | 设计档 §3 表仍留一行「`thincoder-core/agent/light-round.mjs` | 删档」，该档已不在盘（`thincoder-core/agent` 目录实读无此档） | 删该行或注「已退场（前批）」，免得读表的人以为还欠一刀 |

方法学限制（照记）：本次评审上下文未提供 `文档地图`、未提供项目标准档 ⇒ Document ownership 与「方法论符合度」只按 `AGENTS.md` 与设计档自述的档归属判。

计数：🔴 1 · 🟡 7 · 🔵 4 = 12。

VERDICT: changes-required

### 轮次 2（评审子代理）

第 2 轮落地验证（只验第 1 轮 12 条；对象三档全档重读）。

| # | 原# | 档 | Severity | Status | 证据（本轮实读） |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 🔴 | Fixed | 全文 grep「no live batch record」零命中；§2.10 现文逐字「**拒文**：单源住 `§2.3`（一条基串 + 按面选的 `<what>` 从句 + 两步照做句），本节不另抄一份」；批档受影响表已列「§2.10 拒文两条旧英文串删」，验收加格 `grep -rn "no live batch record" thincoder-core test` = 0 命中 |
| 2 | 2 | 同上 §2.3 | 🟡 | Fixed | 新增「三问（两个新名的既有件答案）」，逐字「结论 = `existing but unusable`：失败在**判据与入参**」；并补「**`ledgerQuery` 不传 `boundary`**」一条（双根风险） |
| 3 | 3 | 同上 §2.3 | 🟡 | Fixed | 新增「**两种「根」不是一回事（判据的钉子）**：出辖 = 祖先链上**推不出** manifest」对「manifest **在而不可用**（读不动 / 坏 JSON）」；§5 R2 ⑥ 与 RTM 12-4「坏 JSON」一格同步 |
| 4 | 4 | `docs/batches/2026-11-03-write-gate-all-face.md` §2 | 🟡 | Fixed | 逐字「**「零合取项」说的是判据，不是挂门范围**」+「普通模式与 `depth > 0`（子代理）两态**零改**」 |
| 5 | 5 | 设计档 §2.3 ∥ `test/RTM.md` | 🟡 | Fixed | 混合笔逐字「这一行是上表的**派生结论**，不另立观测」+「复现路径：一条 `apply_patch` 同时改 `<仓内文档>` 与 `<仓外目录>/x.mjs`」；出辖落成 RTM 12-7（「放行的是判据作用域，不是面」），§9「**增的行 = 12-7**」 |
| 6 | 6 | 设计档 §2.3 | 🟡 | Fixed | 新增「**最近先例**：同档决策 28」+ 对齐 / 偏离两行 +「**本轮调研证据**」一条（行号漂移见新 #13） |
| 7 | 7 | 设计档 §9 | 🟡 | Fixed | 12-5 行改「⇒ **四条全拒**（均按产品面判，文件零改）」；delta 块写「**破的行 = 12-5**」并说明已重写 |
| 8 | 8 | 设计档 §5 R29 ∥ 批档 | 🟡 | Fixed | R29 逐字「**扫描面 = `thincoder-core` + `test`」+「`grep -rn "liveBatchOpen" thincoder-core test` = 0 命中」；批档受影响表补「**头注措辞改口径**——故事名…」 |
| 9 | 9 | `test/RTM.md` | 🔵 | Fixed | 节注回指现文「回指 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.3 ∥ §2.10 ∥ §2.12」；全设计档 grep「§2\.2」零命中；批档加文档面机检一格 |
| 10 | 10 | `test/RTM.md` | 🔵 | Fixed | 节注逐字「12-6 借行（服务 R14 排除名单单源；迁出触发条件 = 该名单有独立故事节那一轮）」；§9「**借行 = 12-6**（保留，迁出触发条件写明）」 |
| 11 | 11 | 批档 §2 | 🔵 | Fixed | 档位结论改为「档位软线 = 500 / 800 行」+ 受触档读数 +「函数级：本批不为任何函数新增规模判据，判据体净增 ≤ 20 行」——300 那个数已删 |
| 12 | 12 | 设计档 §3 | 🔵 | Fixed | 全设计档 grep「light-round」零命中，该行已删 |
| 13 | (new) | 设计档 §1 ∥ §2.3 | 🔵 | New | 同一事实两处行号：§1「`:35` 2026-10-27 12:35 实读，本轮按键名复核仍命中同一行」对 §2.3「（`:36` 实读）」。建议统一到一处 |

计数：🔴 0 · 🟡 0 · 🔵 1（新，advisory）。第 1 轮 1🔴 + 7🟡 + 4🔵 = 12 条全部落地；修正未引入 🔴。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-11-03 01:05 逐字「批准」。

**批准时的状态**：设计评审两轮 —— 第 1 轮 changes-required（🔴 1 ∥ 🟡 7 ∥ 🔵 4，🔴 = 同一道门两套拒文）→ 修正轮落地 → 第 2 轮 **pass**（12 条逐条对到盘面全部落地，新 🔵 1 条不阻断）。

**批准范围**：写门判据改为「台账里有 `status = 在途` 的行」；面不再作为放行理由；`live-batch.mjs` 删档、判据函数 `ledgerOpenAt` 住 `write-gate.mjs` 模块内不导出；出辖保持「门不管」并写明它是判据作用域。

**这批修的是什么（写清楚，别让后来的读者以为是一次普通改造）**：**修的是父侧自己在设计里开的洞** —— 上一批把「文档面免检」写成设计前提，理由是「写批档也要活批档 ⇒ 第一批开不了」；**该理由是假的**（`ledger` 挂行 ∥ `batch` 开档都不走写门）。用户 2026-11-03 00:31 逐字纠正，本批把免检区拆掉。

**用户已知的两条**：
- 判据是**活台账行**，不是活批档（用户 00:39 逐字纠正过父侧「加两道条件」的写法）。
- 本条不覆盖 `bash` ∥ `execute` 的写路径 —— 那两道不经过写门，是**另一个洞**，另记。

## §5 实施记录（eng-coder）
**状态行**：实施完成（两条设计档字面错误已上抛并获裁（代码照实现）；设计档改完需重跑受影响的格）



**交付摘要**：写锁判据从「面判先行」改为「台账在途行」，面只剩选拒文变体一个用途；零消费判据整档退场（`thincoder-core/agent/live-batch.mjs` 删除）。判据本体 = `thincoder-core/agent/write-gate.mjs` 的导出 `ledgerOpenWriteConflict` + 模块内不导出的 `ledgerOpenAt`。

**判据落法**：`ledgerOpenAt(absPath)` 三步——① `resolveProjectRoot(absPath)`：推不出 manifest ⇒ `{scope:"out"}`，门不管；② `readManifest(root)` 不可用（坏 JSON / 读不动）⇒ 拒并带原错；③ `ledgerQuery({cwd: root, boundary: root, status:"在途"})` 行数 ≥ 1 ⇒ 放行。不读批档状态、不读指针、不读 `board` / `kind` / 标题。

**拒文**：一条基串 + 按目标面选的 `<what>`（产品代码 / 产品测试 / 文档三变体）+ 共用两步照做句（`ledger({action:"add", title, kind})` → `batch({action:"create", ledger:"#N", topic, source})`）；台账读不到时另起 `(ledger unreadable — <原错>)`。三变体与设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.3 逐字比对为 true（前缀 ∥ 尾句 ∥ 三条 `<what>` 全等）。

| 文件 | 变化 | 笔域 |
|---|---|---|
| `thincoder-core/agent/write-gate.mjs` | 判据改写 + 导出改名 + 三变体拒文 + `ledgerOpenAt` + 删 `import { liveBatchOpen }` + 头注补第 4 个单点 | 任务书列 |
| `thincoder-core/agent/live-batch.mjs` | 删档（零消费面） | 任务书列 |
| `thincoder-core/agent/dispatch.mjs` | import / 调用改名；拒因改 `"no in-flight ledger row"`；注释块改口径 | 任务书列 |
| `thincoder-core/agent-tools/batch-reopen.mjs` | 回收失败回执逐字改口径（设计 §2.13） | 任务书列 |
| `thincoder-core/agent/write-face.mjs` | 注释口径收正（头注 / `faceDetail` 契约 / `faceOf` 三处） | 任务书列 |
| `thincoder-core/ledger-db.mjs` | 注释：候选枚举消费面去掉已删的闸 | 任务书列 |
| `thincoder-core/ledger-write-ops.mjs` | 注释：去掉「行指着它」这条旧合取 | 任务书列 |
| `test/integration/batch-live-batch-lock.test.mjs` | 12-1 / 12-2 / 12-3 / 12-4 / 12-5 改写，新增 12-7，头注改口径 | 任务书列 |
| `test/RTM.md` | 故事 12 节注与 7 行到目标态；12-2 通过条件改引实出文案；14-6 括注去旧词 | 任务书列 |

**out-of-list 改动（3 档，逐条给理由）**：

| 文件 | 变化 | 理由 |
|---|---|---|
| `thincoder-core/agent/dispatch-run.mjs` | 拒因分流集合里 `"no live batch record"` → `"no in-flight ledger row"` | 拒因是 `dispatch.mjs` 与本档共用的字符串键；不改则新拒因落到「no permission handler configured」兜底，模型看到的是错消息 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 注释一句：「多活批档合法…写锁只问存在否」→「多本在飞批并存合法…写锁只问台账里有没有在途行」 | 注释仍在教已退场的判据；只改词面，行为零改 |
| `test/integration/batch-gates-reanchor.test.mjs` | 14-6 断言旁注一句（去「活批档」旧词） | 同上，仅措辞 |

**实施中发现的判据缺口（已上抛，父侧 2026-11-03 已裁）**：设计档 §2.3 的读法与 `openLedger` 的必传契约相反；照它写，门会把每一笔写都拒掉。裁定 = 代码照本席实现、设计档由设计席收正。

- 发现：设计档写「`ledgerQuery` 不传 `boundary`」并给调用形 `ledgerQuery({cwd: <root>, status:"在途"})`。
- 契约：`openLedger` 写「`boundary` …**必传**；缺则该值缺失即失败，不落 `process.cwd()`」，`resolveLedgerRoot` 体内即 `resolve(boundary)` ⇒ 缺省抛 TypeError。
- 实现：`ledgerQuery({cwd: root, boundary: root, status:"在途"})`——起点与上界同根，仍只有一条推导路径；理由写进 `ledgerOpenAt` 的 JSDoc。
- 致错原因（父侧裁定原话的要点）：设计档当时引的是 `live-batch.mjs` 的注释「本查找面的根上界」，**没引 `openLedger` 的必传契约**——引注释不引契约。

**grep 判据收窄（已上抛，父侧 2026-11-03 已裁）**：R29 与批档 §2 的 `grep -rn "live-batch" thincoder-core test` = 0 永远不成立，因为用例档名本身含该串。判据要抓的是「还有人 import 已删模块」，不是「谁提到这个字符串」。

- 实测：该 grep 9 命中，全部是用例档名（用例头注自引 2 + `test/RTM.md` 故事 12 回指列 7），无一条指已删模块。
- 裁定：收窄成 `liveBatchOpen` + `agent/live-batch` 前缀形，由设计席改判据；本席不放宽判据去求绿。

**验证读数（本席实跑，cwd = 仓根）**：

| 命令 / 判据 | 读数 |
|---|---|
| `node --test test/integration/batch-live-batch-lock.test.mjs` | **7 pass / 0 fail**（12-1 … 12-7） |
| `node --test test/integration/batch-gates-reanchor.test.mjs`（邻面：14-6 断产品码写可写） | **8 pass / 0 fail** |
| 十个受影响模块逐个 `import` | 10/10 成功；`write-gate` 导出面 = `ledgerOpenWriteConflict` 在场、`ledgerOpenAt` 不在导出面 |
| `grep -rn "liveBatchOpen" thincoder-core test` | 0 命中 |
| `grep -rn "no live batch record" thincoder-core test` | 0 命中 |
| `grep -rn "活批档" thincoder-core test` | 0 命中 |
| `thincoder-core/agent/live-batch.mjs` 在盘？ | 否（`existsSync` = false） |
| `ledgerOpenAt` 住模块内、不导出 | 命中 3 处；`^export.*ledgerOpenAt` = 0 |
| `test/**` 内 `§2.2` 回指 | 0 命中 |
| `doc_check`（report 态，`test/RTM.md` 整档） | 命中 0 条（锚 ∥ 段落 ∥ 行长全清） |
| 台账 `#2011`（本批行） | `status = 在途`、`task_book = docs/batches/2026-11-03-write-gate-all-face.md` ⇒ 本批自己的笔满足第 4 条（盘面事实，零代码） |

**单测档**：按 §2 验收「纯逻辑面零新增可跑文件」未新建单测档——changed-face 的可跑面 = 上面那 7 例集成用例（判据四个臂都在其入口上跑到）。

**审计 / 代码评审轮次与终态**：

| 轮 | 工具 | 结论 | 本席处置 |
|---|---|---|---|
| 1 | 内部 divergent 审计（explore） | DIVERGED：1 🔴 + 4 🟡 + 5 🔵 | 已修 `test/RTM.md` 12-2 通过条件（改引实出文案）；余者逐条记档或上抛 |
| 2 | 内部代码评审（advisor，type=code） | changes-required：1 🔴 + 2 🟡 + 3 🔵 | 已修 🔵 两条（`write-face.mjs` 契约注 · `ledger-write-ops.mjs` 注）；🔴 与 🟡 落设计档 / 批档笔域，已上抛并获裁 |

**终态 = stalled 在父侧笔域，本席笔域已收敛**：两条 🔴/🟡 的落点在设计档与批档验收格，父侧 2026-11-03 已裁由设计席改；设计档改完，受影响的格需重跑一次。

**仍待父侧处置的一格**：代码评审另提「设计档 §6 用例表的 `vendor` / `target` 格无 RTM 行、12-5 未断言」——本席不自行开验收行，记此。

## §6 验证与收口（父代理）

## 交付核验（父侧实跑，2026-11-03 01:19）

| 项 | 命令 / 量法 | 读数 |
|---|---|---|
| 本批可跑面 | `node --test test/integration/batch-live-batch-lock.test.mjs` | **7 pass / 0 fail**（12-1…12-7） |
| 邻面 | `node --test test/integration/batch-gates-reanchor.test.mjs` | **8 pass / 0 fail** |
| 集成全量（收口门·唯一一次） | `node test/run.mjs` | **122 pass / 0 fail** |
| 旧串退场 | `liveBatchOpen` ∥ `no live batch record` ∥ `活批档` ∥ `agent/live-batch` 于 `thincoder-core` + `test` | **0 ∥ 0 ∥ 0 ∥ 0** |
| 文档门 | 设计档 ∥ 批档 | `DOC-CHECK GATE: PASS` |

## 实施期撞出的两条设计档错误（已修，记在这里是因为「评审没命中」）

1. **`boundary` 必传**：设计档原写「不传」⇒ 照它写门会把每一笔写都拒。实施席按契约实现，设计档随后改正。**两轮评审未命中**，因为 R2 判的是行为，没有一条比对「设计档写的调用形」与「契约的必传声明」。
2. **`grep "live-batch"` = 0 永远红**：用例档名自身含该串（9 命中全是档名）。收窄成 `agent/live-batch` 前缀形后 0 命中。

**⇒ 两条的共同点：纸上读得通，跑一次才露。** 这就是「判据要能跑」那条判据自己的用处。

## 未处置 / 承接

- **`bash` ∥ `execute` 的写路径不经写门** —— §1 边界明写不覆盖，**本批零触**；是独立缺口，未挂账（父侧记于此，接笔时先量再定）。
- **`#2013`**（引二手当依据无判据接住）：父侧提交的规则缺口，本批不夹带，另批落。
- **`#1983`**：本会话按用户原话收正过一次（「存量太大就别碰」那半句是父侧自撰，已删）。
- **暂缓批复核：无**。
- **文档门**：本批文档集 `PASS`（见上表）。
