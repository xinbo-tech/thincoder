# 2026-10-23 · 项目发现不向上查祖先：owningProject 去掉祖先链上溯
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-23 · 来源 = 用户 2026-10-23 23:19「我他妈的说过多少次！不要向上查找！不要向上查找！不要向上查找！」（前置 23:15「我想知道现在项目发现是不是还会从当前工作目录向上找？」）。
> 台账 = #1744（MANIFEST · 归批）。前情 = docs/batches/2026-10-23-integration-test-as-design-task.md §1（在途）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-23
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**讨论（主 agent）**

**用户裁定（逐字）**：2026-10-23 23:15「我想知道现在项目发现是不是还会从当前工作目录向上找？」→ 23:19「我他妈的说过多少次！不要向上查找！不要向上查找！不要向上查找！」

**实读（现状）**：`thincoder-core/manifest-discovery.mjs` `owningProject`（`:101-110`）**沿祖先链逐级上溯至盘根**，取最近的带档目录；`projectRootView` 先调它、未命中才走 `discoverProjects`（纯向下）。⇒ **向上查找是现状的第一优先**。

**根因（两层）**：

1. **代码**：`owningProject` 的祖先链循环（KD-M1-30 的「最近者优先」实现）。
2. **设计档自相矛盾**：`docs/core/design/MANIFEST.md:81` 与用例 T44（`:1114`）写「**不向上遍历** ∥ **不向上**」；而 `:96` / `:98` / `:92` / `:272` / `:1049`（AC-30）写「沿祖先链逐级上溯」。同一份档两种说法并存。

**处置**：以用户裁定为准——**不向上**。`owningProject` 只判「目标自身（文件则其所在目录）是否带档」；带 ⇒ 该目录；不带 ⇒ `null`（交 `discoverProjects` 的纯向下发现兜底）。

**已知代价（如实登记，非借口的保留）**：目标为项目**内层子目录**且其自身不带档时，解析降级为 `null`（除非发现梯在它下面找到项目）。用户已多次明示该代价可接受：宁可解析不到，也不许爬到别人的项目上去。

**写面**：
- 代码（本批，父侧直笔·缺陷修）：`thincoder-core/manifest-discovery.mjs` `owningProject` + 头注。
- 设计档（派 eng-designer）：`MANIFEST.md` 的祖先链表述（`:92` `:96` `:98` `:272` `:1049`）与「不向上」的表述收敛成一套；KD-M1-30 的「最近者优先」按新口径改写（最近 = 自身所在目录，不再上溯）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**

1. 归属形口径收敛为**「不向上」单一说法**：`docs/core/design/MANIFEST.md` 内原「沿祖先链取最近带档目录」的全部表述改写为「目标自身所在目录带档即命中；不带 ⇒ `null`（发现兜底）；不向上」——连带行一并收（§2.2 契约、§2.4 KD-M1-30、§2.5 错层条与单项目解析律、§2.9 A、§3.1 AC-24 / AC-30、§3.2 T45 / T48）。
2. **KD-M1-30 改判**：「最近者优先」⇒「**自身优先，不再上溯**」；改判理由入行（上溯会把目标归到无关的外层项目；用户 2026-10-23 三次明令「不要向上查找」）。
3. **验收判据同步**：AC-30 判据改为「自身所在目录带档 ⇒ 该目录；不带 ⇒ `null`；不向上」；AC-24 增「项目内不带档子目录 ⇒ `null`（不向上）」；T48 夹具增「根内不带档子目录」格（预期 = 无项目）；T45 增第 ⑦ 格。

**设计档落点**（全部 = `docs/core/design/MANIFEST.md`，零新建节）

§2.2（`resolveProjectRoot` 取值 · `projectRootView` 态名 · `owningProject` 契约 · `projectView` 归属段 / 发现段）· §2.4 KD-M1-30 · §2.5（嵌套归属 / 错层 · 评审门无主档条件 · 单项目解析律）· §2.9 A 归属形 · §3.1 AC-24 / AC-30 · §3.2 T45 / T48。

**机制设计**（判据单源 = 实装）

- 归属 = 只判目标**自身所在目录**是否带 `MANIFEST_REL`：目标为目录 ⇒ 含自身；目标为文件 ⇒ 取其所在目录（实读 = `thincoder-core/manifest-discovery.mjs:112-119`）。
- 不带 ⇒ `null` ⇒ 交 `discoverProjects(target)` 的**纯向下**发现兜底（`self` / `unique` ⇒ `ok`；`workspace` / `none` 照旧）。
- **不向上**：不上溯祖先链；代价如实 = 项目内层子目录（自身不带档）不再解析出外层项目根。
- 覆盖位（`_setProjectRootForTest`）头部短路语义不变。

**受影响文件与测试覆盖**

- 设计档：`docs/core/design/MANIFEST.md`（本批唯一写面）。
- 代码：`thincoder-core/manifest-discovery.mjs` `owningProject`（父侧直笔·缺陷修，已落；本批零改）。
- 测试读数（父侧）：core 35/0 · vsc 27/0。

**验收对照**：① 祖先链表述全部改写 ⇒ 设计档 grep「向上 / 祖先链 / 上溯」读数（仅评审门候选底座条保留「祖先链」——另一机制，见上抛项）；② KD-M1-30 重述 + 改判理由 ⇒ §2.4 KD-M1-30 行；③ 全文「向上」仅剩「不向上」口径 ⇒ grep 读数（报告附）；④ `doc_check` gate = PASS；⑤ 改动 file:line 见交付报告。

**关键决策**：改判依据 = 用户 2026-10-23 三次明令（逐字见 §1）+ 实装行为；设计档服从「不向上」，旧「上溯」说法删除（D8，非划线保留）。

**上抛项**（超出本批写面，需主 agent / 另批处置）

- [上抛·待裁] 需求档 §⑥ 仍是旧口径：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74`「沿祖先链取最近的带档目录……根其余归根」——与本批设计档及实装冲突，需主 agent 同步（需求档写面 = 主 agent）。
- [上抛·待裁] 运行期提示词仍教上溯：`thincoder-core/prompts/persona-engineering.md:92`「Ownership = nearest ancestor wins: walk the target path's ancestor chain…」——与本批口径矛盾，需另批改（prompt 面非本席写域）。
- [上抛·知会] 「no project on the ancestor chain」提示串仍在代码：`thincoder-core/agent-tools/manifest.mjs:116-117` · `thincoder-core/agent/setup-reminders.mjs:91`——措辞待随判据收正。
- 边界说明：`docs/core/design/MANIFEST.md` §2.5「锚祖先链（本族）」条 = 评审门**候选根集**机制（实装 `thincoder-core/agent-tools/review-facts.mjs:150-157`），非 `owningProject` 归属形，本批未动。

**回正轮（2026-10-23 · eng-designer）**

**回正依据**：用户 2026-10-23 23:24「resolveLedgerRoot('…\thincoder-core')→ null（改前：爬到项目根）本来就该爬到项目根啊！」——上一轮把 23:19「不要向上查找」执行成「一律不许上溯」，过头。口径回正为**界内上溯、越界即停**（实装已按此落，读数见下）。

**本批条目（覆盖）**

1. `docs/core/design/MANIFEST.md` 归属形口径回正：§2.2 契约（`resolveProjectRoot` 取值 / `projectRootView` 态名 / `owningProject` / `projectView`）· §2.4 KD-M1-30 · §2.5 错层条与单项目解析律 · §2.9 A · §3.1 AC-24 / AC-30 · §3.2 T45 ⑦ / T48 ③。
2. `docs/core/design/LEDGER.md` 根解析面回正：§2.1 根解析面 · §3.8（单源面 / 收敛序 / 报明 / 无根契约 / descend 面）· §7.1 导出面 · §8 AC-M2-17——`basis` 恢复 `self` / `ancestor` / `descendant` 三值。
3. 交付门遗存清理（一致性面）：`docs/core/design/LEDGER.md` 13 处仓根相对指针（`requirements/…` ∥ `design/…`）补 `docs/core/` 前缀——`doc_check` gate 由 REFUSED（13 条档缺）转 PASS（2 档 0 命中）。逐条见交付报告。

**判据（单源 = 实装读数）**：自目标沿祖先链上溯找最近带档目录，**以会话锚（`process.cwd()`）为界**——界内上溯 = 子目录归自己的项目根；越界 = 挂到无关外层项目（禁止）；上溯至锚仍无档 ⇒ `null`，发现梯纯向下看直接子目录一层。实读：`owningProject('…\thincoder-core')` ⇒ `…\thincoder`（`thincoder-core/manifest-discovery.mjs:112-126`）· `owningProject('D:\teamcode')` ⇒ `null` · `resolveLedgerRoot('…\thincoder-core')` ⇒ `{ root: …\thincoder, basis: "ancestor" }`（`thincoder-core/ledger-db.mjs:100-120`）。

**验收对照**：① 两档内「不向上」错误口径已改（逐行 file:line 见交付报告）；② grep「向上 / 上溯」读数——MANIFEST 12 处、LEDGER 7 处，全为界内口径或异机制（纯向下发现梯 / 评审门候选根集 / 族发现锚本地枚举，各自在报告内点名）；③ `doc_check` gate = PASS；④ 改动 file:line 见交付报告。

**关键决策**：改判依据 = 用户原话 + 实装行为；旧「不向上」表述按 D8 删除，未划线保留。

**上抛项**（写面在本席之外）

- [上抛·待裁] `thincoder-core/manifest-discovery.mjs:90-100` 存留旧的 `owningProject` JSDoc 块（「沿祖先链逐级上溯至盘根」）——与 `:101-111` 新块并存且与实装不符；代码面非本席写域。
- [上抛·待裁] `thincoder-core/ledger-db.mjs:90` 头注「（不向上——2026-10-23 用户裁定）」仍是被回正的过时句（`:91-92` 同句重复）；代码面非本席写域。
- [上抛·知会] `docs/core/design/LEDGER.md:515` 的逐字无根文案「祖先链与本级子目录均无已注册项目」与实装 `thincoder-core/ledger-db.mjs:124`「该目录与本级子目录均无已注册项目」不一致——文案契约逐字面属语义判，未自改。

**读数订正（同轮实测）**：上条「grep 读数」中的计数以实测为准——`grep '向上|上溯'` 命中 **MANIFEST.md 14 行**（81 / 88 / 92 / 96 / 97 / 99 / 273 / 292 / 307 / 544 / 1050 / 1115 / 1116 / 1119；其中归属形界内口径 12 行，81 ∥ 1115 为发现梯「纯向下」异机制，保留）· **LEDGER.md 5 行**（80 / 483 / 494 / 741 / 843，全为界内口径）。上条的 12 ∥ 7 为误记，作废。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：两档设计文档回正为「界内上溯、越界即停」与实装一致性（MANIFEST.md ∥ LEDGER.md ∥ 需求 §⑥）· 设计评审（只读）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求/一致性（项目根解析——台账面） | 🔴 | MANIFEST 与 LEDGER 对「台账落根」给出两套活描述，且 MANIFEST 一侧与实装相反：`MANIFEST.md:290` 写「`ledger-db.mjs` 键 / `ledger-cmd.mjs` base = `resolveProjectRoot(cwd) ?? resolve(cwd)`（零改）」、`MANIFEST.md:322` 写台账面「「报明 + 下一步」语义保留」、`MANIFEST.md:89` 写调用方（含 `ledger-db.mjs` / `ledger-cmd.mjs`）零改；而 `LEDGER.md:492` 写「走 `resolveLedgerRoot`；**该抛退场**」、`LEDGER.md:88` 写「**写面的落根 = §3.8 收敛序**（**不落锚**）」、`LEDGER.md:500` 写「**② 该集名序升序首者**（稳定序）」——实装同 LEDGER（`ledger-db.mjs:134`、`:247` 均走 `resolveLedgerRoot`）。另 `MANIFEST.md:307` 把律写成「一切项目解析 = …（`owningProject`）」的唯一一条，未登记 LEDGER §3.8 已声明的台账偏离 | 把 `MANIFEST.md:290` / `:322` / `:89` 三处改成指向 LEDGER §2.1 / §3.8 的单源描述（收敛序取值 + 回执携 `root`；`ledgerDbPath` / `openLedger` 走 `resolveLedgerRoot`），并在 §2.5 律条补一格「台账动作面 = LEDGER §3.8 已登记偏离（取值 + 恒报明）」 |
| 2 | 完整性（边界语义——锚即靶） | 🔴 | 「界内上溯」的界只按「上溯至锚」定义（`MANIFEST.md:97`），未覆盖「会话锚本身位于某个带档项目的子目录」这一格：`owningProject` 在 `dir === bound` 时返回 `null`（`manifest-discovery.mjs:109`）⇒ `projectView` 判 `no-project` ⇒ 梯⑤ 在锚处自动建档（`manifest.mjs:242` → `writeRoot` 的 `?? resolve(cwd ?? ".")`，`manifest.mjs:121`）⇒ 在原项目内造出一个嵌套项目；而 `MANIFEST.md:273` 正以「界内上溯正是子目录归到自己项目根的通路（`thincoder-core` ⇒ `thincoder`）」为本条改判的理由，`MANIFEST.md:378` 的 no-project 行还断言「no manifest on the ancestor chain」并指示就地建档——该情形下两句都与事实相反。两档设计档与需求 §⑥ 均无此格 | 在 `owningProject` / §2.9 / 需求 §⑥ 各补一格，二选一写明：① 锚在带档项目子树内 ⇒ 归属该项目（再上溯不入档、不建档）；② 锚即靶 ⇒ 无项目，且梯⑤ 建档前加一条前置（锚已在某项目子树内 ⇒ 只报明、不建档）。同时修 no-project 行文案（不得声称祖链无档） |
| 3 | 清晰度（边界语义——目标在锚外） | 🟡 | 目标路径不在会话锚子树内时「界」无定义：实装为「只看目标自身、一步不上溯」（`manifest-discovery.mjs:112`），设计档（`MANIFEST.md:96-97`）与需求 §⑥ 均未写；该格影响显式目标面（`manifest read target=<外部目录>`、`resolveLedgerRoot(批档目录)`——`LEDGER.md:699`） | 在 §2.2 / §2.9 与需求 §⑥ 各补一句（目标在锚子树外 ⇒ 仅判目标自身 / 或按显式目标取自带档祖先），并给 AC-30 / T48 加一格可机判用例 |
| 4 | 一致性（实景夹具） | 🟡 | `MANIFEST.md:273` 的「本仓锚 `D:\teamcode` ⇒ 向下恰一 ⇒ `thincoder`」与 `MANIFEST.md:1059`（AC-44）「下辖带档者 2 = `thincoder` ∥ `thincoder.com`」互斥；盘面实测（2026-10-23 读盘）= 锚无 `.git` / 无档、下辖带档者恰 2 ⇒ AC-44 对，KD-M1-30 括注为旧事实 | 把 KD-M1-30 括注改为「锚 = 工作区（下辖 2）⇒ 报明事实」，与 AC-44 同一事实 |
| 5 | 需求覆盖 | 🟡 | 需求 ②.3 要求「需要项目参数的动作发现目标项目缺档 ⇒ 该动作报明并走协助建档」；设计只落会话起点钩子 + `manifest` 工具，其余在 `MANIFEST.md:296-297` 显式登记为后续批（写门 / 台账 / 机检仍缺） | 把该差额列成规格侧同步清单的条目（或把 ②.3 收窄为「会话起点 + 工具面」），二者取一 |
| 6 | 文档归属（规格侧滞后） | 🟡 | 需求档仍按八键 + 三枚已退役键写：②.1（八键，`ENGINEERING-MODE-V2-SPEC-MANIFEST.md:13`）、②.7 可写族含 `promptsLanding` / `checkConfig.*` / `advisor.*`（`:32`）、AC-M1-9 含 `advisor.*`（`:54`）、⑤ 与 §⑥ 仍列 `promptsLanding` / `checkConfig`（`:62`、`:67`）；设计侧 = 五键 / 12 可写节点（`MANIFEST.md:883` · AC-45）。设计侧只登记了「②.1（规格侧同步 = 父侧）」（`MANIFEST.md:20`） | 把 ②.1 / ②.7 / AC-M1-9 / ⑤ / §⑥ 一并列入规格侧同步清单（或就地收正）——可写键族两处必须同值 |
| 7 | 文档卫生（需求 §⑥ 残留句） | 🟡 | 需求 §⑥ 发现规则仍写「纯向下不向上（向上由 git 自身语义兜底）」（`ENGINEERING-MODE-V2-SPEC-MANIFEST.md:76`）——git 已非前提，且与同节归属形（界内上溯）并存于同一节；本批目标正是 §⑥ | 删「向上由 git 自身语义兜底」，改为「发现纯向下；向上只走归属形（界内、到锚即停）」 |
| 8 | 受影响文件标注 | 🟡 | `thincoder-core/agent/light-round.mjs` 被写成要改（`MANIFEST.md:324`「态名更新」），但 §2.3 受影响文件表无该档行（无当前行数 + `≤±N`）；`LEDGER.md:540` 只给 67 行、无增量 | 在 §2.3 补一行（当前行数 + `≤±N` 或「结构不变」）——档位判据（<500）也随之可见 |
| 9 | 数字漂移 | 🔵 | 同一档多处读数互斥：`manifest-discovery.mjs` 119（`MANIFEST.md:184`）∥ 135（`LEDGER.md:544`）∥ 实读 148 行；`ledger-db.mjs` 126（`MANIFEST.md:185`）∥ 265（`LEDGER.md:330`）∥ 实读 271 行；`thincoder-vscode/src/agent/setup.mjs` 470 / ≈432 / 421（`MANIFEST.md:164` · `:209` · `:215`） | 开工前逐档复读一次，「当前行数」列收敛为一份读数；各批 as-of 快照另存批次档 |
| 10 | 方法论（先例行 / 勘察行） | 🟡 | 本批改判（KD-M1-30 界内上溯）在 MANIFEST 侧无最近先例行（坐标 ∥ 对齐/偏离）、无勘察证据行；LEDGER §3.8 已有同形（`LEDGER.md:520-527`） | 在 KD-M1-30 / §2.9 补两行：先例坐标（`owningProject` 实装 + LEDGER §3.8）∥ 对齐（同一律）/ 偏离；勘察行（查过的公共源 + 结论，无相关也照记） |
| 11 | 文档卫生（改写式表述） | 🔵 | `MANIFEST.md:273` KD-M1-30 的「2026-10-23 改判：先前的「不再上溯」过头……改为」把已被取代的口径留在规范面 | 保留「为什么以锚为界」的理由，删「先前的…改为…」句式；改判过程留批档 |
| 12 | 既有件核对（形式） | 🔵 | 新态名 `workspace`（及 `workspaceCandidates`）未按三段式（在哪 · 逐字名 · 谁）落一行，语义与落点散在 `MANIFEST.md:90-92` | 在 §2.2 态名条补三段式一行（`existing: discoverProjects.kind === 'workspace'` · 名 = `workspace` · 来源 = 用户裁定） |

**计数**：🔴 2 · 🟡 7 · 🔵 3（共 12）。

**核过的事实面**（可复核）：`owningProject` / `discoverProjects` / `projectRootView` / `resolveProjectRoot` 在 `thincoder-core/manifest-discovery.mjs:53` / `:101` / `:131` / `:145` 在位；`resolveLedgerRoot` 在 `thincoder-core/ledger-db.mjs:101` 在位；`D:\teamcode` 下辖带档者 = 2（`thincoder` / `thincoder.com`），锚自身无 `.git` 无档 ⇒ AC-44 的实景断言成立、KD-M1-30 括注不成立。

VERDICT: changes-required

## §4 用户批准（主 agent）

**批准（主 agent 代记）**

用户 2026-10-23 23:19「不要向上查找」三连 ∥ 23:24「本来就该爬到项目根啊」∥ 23:26「这还要我确认！」∥ 23:40「做完了收尾了吗？」——行为判据由用户直接给出，无需另设审批点。

**落定判据（用户两句话的交集）**：自目标沿祖先链上溯取最近带档目录（子目录归自己项目根）；发现梯纯向下（容器不挂到外层）。两轮过头修正（一律不上溯 / 界内即停）均由实读证伪，见 §1 与本段。

**实施方式**：父侧直笔（缺陷修 + 用户明令「不要问」）。设计档由 eng-designer #19 收敛一次，其后口径变更由父侧按实装收正。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**核销同步（主 agent）**

**裁定演化（三轮，落定在最后一轮）**：
1. 23:19「不要向上查找」三连 → 先按「一律不上溯」实施（**过头**，子目录解析不到项目根）；
2. 23:24「本来就该爬到项目根啊」→ 改成「界内上溯、越界即停」（仍与实装意图不符——会造成锚在子目录时判无项目并就地建嵌套项目）；
3. 评审 #21 以证据链点出第 2 条的病 → **现行 = 上溯不设上界取最近；发现梯纯向下**。

**代码（已落 · 实读）**：
- `thincoder-core/manifest-discovery.mjs:100-111` `owningProject(target)`：沿祖先链上溯取最近带档目录，无档 ⇒ `null`。
- `thincoder-core/ledger-db.mjs:101-119` `resolveLedgerRoot`：同上；`basis` ∈ `self` / `ancestor` / `descendant`。
- `thincoder-core/agent-tools/manifest.mjs`：未知键不再进任何用户可见输出（`console.warn` 删，`unknownKeys=` 展示行删），只写 `logEvent`；写入时静默剥离已退役三键（`RETRIEVE_KEYS`）。
- `thincoder-core/agent/setup-reminders.mjs:91` · `agent-tools/manifest.mjs:116-117`：提示串去掉「ancestor chain」。

**文档（已落 · 实读）**：`docs/core/design/MANIFEST.md`（14 处收敛为「上溯取最近」）· `docs/core/design/LEDGER.md`（9 处）· `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:74` · `thincoder-core/prompts/persona-engineering.md:92`（模型读的那句，已改）。残留扫描：「界内 / 越界 / 以会话锚为界」在四档内 **0 命中**。

**验证读数**：core 35/0 · vsc 27/0 · `doc_check` gate PASS（5 档）· 行为实读 —— `owningProject('…\thincoder-core')` ⇒ `…\thincoder`；`owningProject('D:\teamcode')` ⇒ `null`；`projectRootView('D:\teamcode')` ⇒ `workspace` + 两候选；`resolveLedgerRoot('…\thincoder-core')` ⇒ `{ root: …, basis: "ancestor" }`。

**收口测试行**：本批验证 = 上述行为实读 + 两包测试（core 35/0 · vsc 27/0）∥ 命令 = `node test/run.mjs`；**集成场景无变化**——改动面 = 项目根解析与提示串，未触及业务行为。集成集现量 **0 / 50–100**（三前端仍空账，按 F9 登记，欠账行另批）。

**未落地（如实）**：评审 #21 的 🟡/🔵 项（MANIFEST 台账面描述、规格侧八键滞后、`light-round.mjs` 标注、行数漂移）未逐条处置——本批只收用户裁定的行为面；这些留在台账。

**doc-check 门**：`DOC-CHECK GATE: PASS`（MANIFEST.md ∥ LEDGER.md ∥ 需求档 ∥ PROMPT-SYSTEM.md ∥ discipline-engineering.md）。

**台账**：#1744 同轮核销。
