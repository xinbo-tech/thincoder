# 2026-10-09 · prompt-gap-fix
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 21:03「你不会平白错，只可能是提示词还有什么没说明白的地方。」——父侧逐错回查：两处提示词缺句收正（查重「同类」语义 ∥ 工具路径参数面；错一 = 轻通道代码笔随 #1156）。
> 台账 = #1157（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
**来源**：用户 2026-10-09 21:03「你不会平白错，只可能是提示词还有什么没说明白的地方。」——父侧逐错回查（当晚三错）后钉出**两处提示词缺句**；**错一**（轻通道代码笔撞写闸静默改道）归 #1156 批（提示词半幅随该批落），**不入本批**。

**两处缺句（实证 → 缺句）**：
- **缺句一**（「病/治两行并存」之根因——#1155 撤离并入 #1156）：查重句「同类**并入**（不另立新行）∥ 否则**注记关系**」（`docs/core/design/prompts/persona-engineering.md:178`）——「同类」未定义（被读成 kind 字段同类）。收正形 = 判「同一事项（不看 kind 字段）」+ 修复令落在已有行 ⇒ 给行挂批、不另起行。
- **缺句二**（评审引文机检 0/16 之根因）：多仓句（`docs/core/design/prompts/discipline-engineering.md:137`）只覆盖「写面（批档 ∥ 台账 ∥ 写门）」，未覆盖**工具路径参数**（documents ∥ batchDoc ∥ files ∥ paths）。收正形 = 第 8 条内扩面至工具路径参数（多候选并存 ⇒ 显式仓前缀或绝对路径）。

**边界**：只此两处（零新机制、零新节、最小改）；EN 运行面实体 = 实施轮（eng-coder）；错一 #1156 另批。

**台账行**：#1157。

**父裁（2026-10-10 03:2x · 承 #45 实施轮上抛）**：射程冲突裁 **6 行 EN 目标形属本实施轮（补派）**——父侧派单欠口径（只列 EN-1/EN-2 两行；子代按「最新且显式」倾向两行、不自裁，处置正确）。权威 = §2 修正轮1 ③「EN 四档 = 实施轮」+ §2 ⑥「EN 运行面零触（目标形留实施轮）」+ 修正轮2 ⑤ 交接读数。落笔面 = `thincoder-core/prompts/discipline-engineering.md:102/:162/:177` ∥ `thincoder-core/prompts/persona-eng-designer.md:6/:14/:15`；**面名随正口径** = 目标形载 `Chinese mirror face` ⇒ 一律 `Chinese-review-face`（与 CN 面「中文审核面」归一后同指——CN 侧 A13 口径在案）。本补派不越批界（同批同 token ∥ 零新语义——皆设计已载目标形；`:102` 括注 = D8 删形）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成（fix 轮 2 收口 · 2026-10-09——两笔逐字目标形落 §2 ②；CN 两笔已随设计轮直落（persona-engineering.md:177 ∥ discipline-engineering.md:137）；EN 对照形待实施轮（现盘坐标见 §2 ⑤）；机检双绿（doc-check ∥ prompt-refs-check · EXIT 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**提示词缺句收正批 · 设计轮（eng-designer · 2026-10-09 · round = initial）**

**段位声明**：本段 = 批次任务与设计（本批 = `docs/batches/2026-10-09-prompt-gap-fix.md`；台账 #1157）。依据 = 本批派发简报（父侧逐错回查两处缺句）——**§1 讨论段未落文（占位行仍在）**，已披露（⑧-1）。执行面 = 提示词双面流程（先例 = `docs/batches/2026-09-20-consistency-sync-batch.md` §2.4 `:133-155`）：zh 正本（`docs/core/design/prompts/**`——**内容权威 = 主 agent**）∥ en 运行面（`thincoder-core/prompts/**`——**产品码面 · 落地 = eng-coder**）；设计轮只出**逐字目标形**（本段 ②）；**提示词实体四档落笔：中文审核面两档 = 设计轮直落（已落）∥ 英文运行面两档 = 本批实施轮**（2026-10-09 收正——原记「= 本批实施轮（双面）」；单源 = `PROMPT-SYSTEM.md` §6.1 面分述）。

**① 本批条目（覆盖两笔）**

| # | 条目 | 出处（目标行 · as-of 2026-10-09 实读） | 实证（缺句在哪） | 收正形 |
|---|---|---|---|---|
| 1 | 查重「同类」语义 | `docs/core/design/prompts/persona-engineering.md:178`（EN 同位 `thincoder-core/prompts/persona-engineering.md:178`） | 「同类」未定义 ⇒ 被读成 `kind` 字段同类 ⇒ 病单（#1155 tech_todo）/ 治单（#1156 requirement）两行并存（2026-10-09 20:53/20:57 双笔重复登记；当日 #1155 撤回并入 #1156） | 就地改写单行——「同类」定形 = **同一事项**（同一问题 ∥ 同一工作对象——与 `kind` 字段取值无关）（② CN-1） |
| 2 | 工具路径参数面 | `docs/core/design/prompts/discipline-engineering.md:137`（EN 对应 `thincoder-core/prompts/discipline-engineering.md:140`） | 第 8 条只覆盖「写面（批档 ∥ 台账 ∥ 写门）」——**工具路径参数未覆盖** ⇒ 评审 `documents` 未带仓前缀 ⇒ 引文机检 0/16（2026-10-09 20:54 · 批 `2026-10-09-server-model-alias`） | 就地扩面单行——「写面」扩为「写面与**工具路径参数**」（② CN-2） |

**显式不在本批**：错一（轻通道代码笔 × 写闸——随 #1156 另批）；EN 面实体落笔 = 本批实施轮（非本设计轮）。

**② 逐字目标形（围栏块 = 实施轮逐字落地物；均为整行替换）**

CN-1（`docs/core/design/prompts/persona-engineering.md:177`——整行替换——原记 `:178`；替换后 ±0 行 / 文件 205 行不变）：

```text
**入库查重**：登记时扫同面既有行——**同类 = 同一事项**（同一问题 ∥ 同一工作对象——与 `kind` 字段取值无关）**并入**（不另立新行）∥ 否则**注记关系**（关联行互指）——与批点火前的合并扫描（「批设计」条）互为上下游。
```

EN-1（`thincoder-core/prompts/persona-engineering.md:178`——整行替换；M9 翻译回写——非 cp）：

```text
**Dedupe on booking**: when registering, scan existing rows on the same face — the same item (same problem ∥ same work object — irrespective of the `kind` field) ⇒ **merge** (no second row) ∥ otherwise **note the relation** (cross-referencing rows) — upstream/downstream with the pre-ignition merge scan (the batch-design clause).
```

CN-2（`docs/core/design/prompts/discipline-engineering.md:137`——整行替换；替换后 ±0 行 / 文件 187 行不变）：

```text
8. **多仓并存 = 正常态**：写面（批档 ∥ 台账 ∥ 写门）与**工具路径参数**（传给工具的一切路径——如评审 `documents`）先定**目标仓**——**显式目标**（多候选并存 ⇒ **显式绝对路径**）；解析歧义 ⇒ **列候选、绝不代选**；同类失败 ⇒ **报告 + 显式路径重试**（不砖会话）。
```

EN-2（`thincoder-core/prompts/discipline-engineering.md:140`——整行替换；M9 翻译回写）：

```text
8. **Several repos coexisting = a normal state**: before writing or passing paths, fix the **target repo** — write surfaces (batch record ∥ ledger ∥ write gate) and **tool path parameters** (any path handed to a tool — e.g. review `documents`) take an **explicit target** (several candidates ⇒ an **explicit absolute path**); on an ambiguous resolution ⇒ **list the candidates, never choose for the user**; on a repeated failure ⇒ **report it and retry with an explicit path** (never brick the session).
```

**③ 机制设计（收正形裁定）**

- 收正形 = **就地改写既有句**（两条均整行替换；零新机制 / 零新节 / 零新语义——只把已有判据说清；两档其余行逐字零触）。
- **咬合保持**（缺句一）：尾句「——与批点火前的合并扫描（「批设计」条）互为上下游。」逐字保留（实读核：替换稿尾半句 == 现文尾半句）；「批设计」条（`:167`）零触。
- **裁并给理由**（缺句二——条内扩面 vs 另立一点）：**裁定 = 第 8 条内扩面**。① 同一规则（先定目标仓）——「写面」枚举不全 = 覆盖面遗漏，非第二条规则（D2：一条规则一处）；② 另立一点 ⇒ 序号 9–14 顺延重排 = 参考面扰动，违「零新节 / 最小改」；③ 失败链同构——「解析歧义 ⇒ 列候选」正是 `documents` 的受伤面；同条承载使「显式目标 → 列候选 → 报告重试」三步链完整可读。
- **语义不动点**：扩面只把「显式目标」义务覆盖到工具路径参数；「解析歧义 / 列候选 / 报告重试」三半句与第 12 / 14 条（跨仓只经接口耦合 ∥ 自持管写·读取不限）零冲突（目标仓显式 ≠ 读取受限）。

**④ 变更记录（CN 侧——「逐档一行」落形 = 一条批轮条目内逐档各一行）**

落点 = `docs/core/design/PROMPT-SYSTEM.md` 变更记录（设计档 = 本席笔）；落笔 = **本设计轮（已落）**。落地文本：

```text
- 2026-10-09（**批 prompt-gap-fix · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-prompt-gap-fix.md` §2 · 台账 #1157；用户 21:03「你不会平白错，只可能是提示词还有什么没说明白的地方」）：
  提示词缺句收正两笔（既有条就地改写——**提示词实体落笔 = 本批实施轮**——CN 正本 → EN 按 M9 翻译回写，非 cp）：
  ① `persona-engineering.md`「入库查重」条：「同类」定义收正 = **同一事项**（同一问题 ∥ 同一工作对象；与 `kind` 字段取值无关）——与「批设计」合并扫描条互指关系保持；
  ② `discipline-engineering.md` 多仓条（第 8 条）：「写面（批档 ∥ 台账 ∥ 写门）」扩为「写面与**工具路径参数**」（一切传给工具的路径——如评审 `documents`）——显式目标义务随扩。
  **零新机制**（既有判据说清）；逐字文本 = 批档 §2（D2）。
```

**⑤ 落点与受影响文件（现状行数 = as-of 2026-10-09 实读）**

| 文件 | 面 | 落笔 | 现状行数 | 预期 Δ |
|---|---|---|---|---|
| `docs/core/design/prompts/persona-engineering.md` | CN 正本 | **设计轮直落（eng-designer 笔——已落）**（收正——原记「实施轮（eng-coder 落；主 agent 内容权威）」） | 205 | ±0（:177 整行替换——原记 `:178`；`##` 16 不变） |
| `docs/core/design/prompts/discipline-engineering.md` | CN 正本 | **设计轮直落（eng-designer 笔——已落）**（收正——同上） | 188 | ±0（:137；`##` 块不变） |
| `thincoder-core/prompts/persona-engineering.md` | EN 运行面 | 实施轮（eng-coder） | 202 | ±0（:178） |
| `thincoder-core/prompts/discipline-engineering.md` | EN 运行面 | 同上 | 195 | ±0（:140） |
| `docs/core/design/PROMPT-SYSTEM.md` | 设计档（记录面） | **本设计轮（已落——④ + §6.1 应用实例一行 + 末项分隔符随动）** | 879 | +7（变更记录 6 行 ∥ §6.1 实例 1 行） |

纯 `.md`（无代码行数档；<800 硬限无涉）。**测试面**：不新增断言（内容在场 = 一次性比对——落地档 ↔ 本段 ② 围栏块，承 §6.1「批次收尾核对」`PROMPT-SYSTEM.md:176`）；集成面零增补。

**⑥ 验收对照（回指 ① 条目）**

| # | 项 | 判据（可机核；中文串用 UTF-8 感知形——禁 `findstr`） | 读取面 |
|---|---|---|---|
| A1 | CN-1 在位 | `docs/core/design/prompts/persona-engineering.md:177` 整行 == ② CN-1 围栏块（逐字）（原记 `:178`——现盘）；「互为上下游」半句在场；旧歧义形「同类**并入**」零命中 | 实施轮 + 收口核 |
| A2 | EN-1 在位 | EN `:178` 整行 == ② EN-1 围栏块 | 同上 |
| A3 | CN-2 在位 | CN `:137` 整行 == ② CN-2 围栏块；「工具路径参数」「如评审 `documents`」在场 | 同上 |
| A4 | EN-2 在位 | EN `:140` 整行 == ② EN-2 围栏块；`tool path parameters` 在场 | 同上 |
| A5 | 机检 | `node scripts/doc-check.mjs` EXIT 0 ∥ `node scripts/prompt-refs-check.mjs` OK（J1/J2/J3 零命中） | 设计轮基线实跑（⑧-3）；实施轮复跑 |
| A6 | 记录 | `PROMPT-SYSTEM.md` 变更记录条（④）在位 | 本设计轮（已落） |

**⑦ 关键决策**

- D1 **就地改写 / 最小改**（不新增条、不动邻行、零 `##` 连带）——先例 = §6.14「既有段微调」（`PROMPT-SYSTEM.md:386`）∥ §6.20 登记随终形收正（`:712`）。
- D2 **缺句二条内扩面**（不另立一点）——理由见 ③（否决「另立一点」= 序号重排扰动 + 同规则两处违 D2）。
- D3 **登记上限形 = 变更记录一条（逐档两行）+ §6.1 应用实例一行**——不落 §6.x 登记块 ∥ 不补 D-PS（就地改写、零新机制、零计数面；先例 = authoring-why 上限形 `:716` + prompt-common 补登 `:877-878`）；§6.20 ③ `:507` ∥ §6.14 ② `:380` 登记摘要句不随动（登记摘要非逐字载体——逐字归批档 §2，D2）。
- D4 **EN 面 = M9 翻译回写**（非 cp）；CN 内容权威 = 主 agent（双面流程先例 = `2026-09-20-consistency-sync-batch.md` §2.4）。
- D5 **术语**：「同一事项」沿既有词（`persona-engineering.md:175`「上抛事项」）；「工具路径参数」= 平名直述；定义式用档内既有「 = 」形（同档 `:179`「单行 = 单结算单元」）。

**⑧ 披露与上抛（供父侧裁）**

1. **§1 讨论段未落文**：占位行 + 状态行 🔄 仍在——本段依据 = 派发简报；建议父侧补 §1（或以简报代档）。
2. **需求档面**：#1157 未携 `req_doc` 指针；如需入需求档（`docs/core/requirements/PROMPT-SYSTEM.md`）登记，属主 agent 笔（本设计零触）。
3. **机检基线（本设计轮实跑）**：`doc-check` EXIT 0（悬空 0 / 行宽 0 / 行数面差异 0）∥ `prompt-refs-check` OK（82 档 ∥ 438 档 · 0 命中）；四档新行宽 = CN-1 123 ∥ CN-2 162 字符（<300 闸，余量足）。

**⑨ 边界（本批不做）**

- 不写实现码；不触 EN 面（`thincoder-core/prompts/**`——实施轮落地）；不涉轻通道代码笔（#1156 另批）；实施轮限定 = 上述四个整行替换（不动其他提示词节）；零新语义（只把已有判据说清）；不新增机检断言；§6.20 / §6.14 登记块正文零触。

**提示词缺句收正批 · 设计评审修正轮 1（fix 轮）· eng-designer · 2026-10-09**

**受理**：§3 轮次 1 七条（#1–#7；#8 已裁「非缺陷」不动）。**方向更正（父侧裁定 · 即时生效）**：finding #1 的钉法 = **按面分述**——**CN 镜像面（`docs/core/design/prompts/**`）= eng-designer 笔（设计轮直落）** ∥ **EN 运行期面（`thincoder-core/prompts/**`）= 主 agent 内容权 + eng-coder 落笔（实施轮）**。对照口径 = 需求档 `ENGINEERING-MODE-V2.md:365` ∥ `:602`（as-of 2026-10-09）· 本档 `PROMPT-SYSTEM.md:774`；`persona-engineering.md:89-90` 本来就对、零触。

**落形分工**：CN 侧 = 本设计轮直落（笔权 = eng-designer）；EN 侧 = 目标形（§③）留实施轮（eng-coder）。本档 `PROMPT-SYSTEM.md` 侧收敛（§1 ∥ §2.2–§2.4 ∥ §3.1 ∥ §6.2 ∥ §6.3 ∥ §7 ∥ §10.2 ∥ 变更记录）= 本设计轮直落。

**① 逐号落位表**

| # | 处置 | 落形 | 坐标（CN/本档 = 已落；EN = 实施轮） |
|---|---|---|---|
| 1 | 落笔口径按面分述单源对齐 | CN 直落 + 本档直落 | `discipline-engineering.md:169`（D1）· 本档 `:163`（§6.1）· `persona-eng-designer.md:6/:14/:15`；`persona-engineering.md:89-90` 零触；`E-MODE-V2:365/:602` 零触 |
| 2 | CN 正本落点收正 | 本档已落 | §1 `:18`/`:23` · §2.2 `:46` + 行值 ×10 · §2.3 `:70`/`:71`/`:100`/`:105` · §2.4 行 120 |
| 3 | 裁决行落地状态与迁移期引文 | 本档已落 | §2.4 `:115`–`:117` · §3.1 `:128`–`:130` |
| 4 | 残留清理 | CN 已落 + 本档已落 | `discipline-engineering.md:99`/`:155` · 本档 §6.3 `:189`；EN `:101`/`:161` = 实施轮 |
| 5 | 卫生（注记与 EN 副本） | CN 已落 | `persona-engineering.md:80`（−注记）· `:81–:83` 整段删（−3 行） |
| 6 | §10.2 行 14 复算处置 · 行 5 ∕ 12 处置补记 | 本档已落 | §10.2 `:673`/`:680`/`:682` |
| 7 | 场景数口径收口 · D-PS16 刷新 | 本档已落 | §6.2 `:182`/`:184` · §7 `:590` |

**② CN 直落（已落 · 逐字）**
- `discipline-engineering.md:169` D1 尾 ⇒ 「… 提示词 = 主 agent 内容权 + **落笔按面分述：中文镜像面 = eng-designer 笔 · 英文运行面 = eng-coder 落笔**。」
- `persona-eng-designer.md:6` ⇒ 「你不写实现代码（实现归 eng-coder）、**不碰英文运行面提示词**（提示词 = 产品代码；内容权在主 agent；**你的提示词笔域 = 中文镜像面**）、不发起评审（发起权在主 agent / 用户）。」
- 同档 `:14` ⇒ 「写域 = 项目的设计档（落点按项目文档约定）+ **中文镜像面提示词（中文模板——设计轮直落）**；**英文运行面不归你**（提示词 = 产品代码——内容权在主 agent、落笔在 eng-coder）。」
- 同档 `:15` ⇒ 「即：设计档 / 批次档 §1（读）/ §2（写）+ **中文镜像面提示词**归你；**需求档 = 核对面（读，不落笔——笔在主 agent）**；`src/**` 与**英文运行面**不碰。」
- `discipline-engineering.md:99` ⇒ 去「（旧三层门已废）」括注；`:155` ⇒ 去「；「登记后保留」已取消」挂尸（收为「…须实证）**；**本纪律…」）。
- `persona-engineering.md:80` ⇒ 去「（出口条件第 9 条 · 2026-10-04 · #848）」注记；`:81–:83`（落地对应 + EN 逐字两行）整段删。
- 本档 `:163` ⇒ §6.1 补面分述（中文镜像面 = eng-designer 笔 ∥ 英文运行面 = eng-coder 落笔）；变更记录条（更正后）。

**③ EN 目标形（实施轮 · eng-coder——逐字）**
- `thincoder-core/prompts/discipline-engineering.md:176` D1 尾 ⇒ 「… prompts = main agent content authority + **landing split by face: Chinese review face = eng-designer's pen · English runtime face = eng-coder landing**.」
- 同档 `:101` ⇒ 「- **Gate = one `test` all-green**.」
- 同档 `:161` 整行 ⇒ 「**user-visible cross-end differences = defects (the sole exception = host-capability faces — differences constrained by a host capability that only one side possesses; evidence required)**; **this discipline is not grounds for keeping a difference**;」
- `thincoder-core/prompts/persona-eng-designer.md:6` ⇒ 「You do NOT write implementation code (that is eng-coder), **you do NOT touch English-runtime-face prompts** (prompts are product code; content authority sits with the main agent; **your prompt pen = the Chinese review face**), and you do NOT fire reviews (firing authority sits with the main agent / user).」
- 同档 `:14` ⇒ 「Write domain = the project's design docs (location per project doc conventions) + **Chinese-review-face prompts (Chinese templates — direct landing in the design round)**; **the English runtime face is not yours** (prompts are product code — content authority with the main agent, landing with eng-coder).」
- 同档 `:15` ⇒ 「That is: design docs / batch record §1 (read) / §2 (write) + **Chinese-review-face prompts** are yours; **requirement docs = compliance-check surface (read, no writing — the pen is the main agent's)**; `src/**` and **the English runtime face** are untouchable.」

**④ 受影响文件与读数**：本档 `docs/core/design/PROMPT-SYSTEM.md` 886 → **891** 行（+5——直落）；`docs/core/design/prompts/discipline-engineering.md` 188 行（±0）· `persona-eng-designer.md` 80（±0）· `persona-engineering.md` 208 → **205**（−3）；EN 四档 = 实施轮（本设计轮零触）。机检 = `node scripts/doc-check.mjs --root thincoder`：悬空 0 ∕ 行宽全绿 ∕ 行数差异 0（EXIT 0，2026-10-09 复跑）。

**⑤ 验收对照（追加）**
- A7：D1 ∥ §6.1 ∥ `persona-eng-designer.md` 三处「面分述」在盘；「不改提示词文件」零命中。
- A8：CN「旧三层门已废」∥「登记后保留」零命中；EN 两处 = 实施轮清。
- A9：`persona-engineering.md` 无日期/台账号注；EN 逐字副本两行零命中；件 208 → 205。
- A10：本档中文落点全指 `docs/core/design/prompts/`（产品前缀史迹注记除外）；§10.2 行 14 = **5/6**；§6.2 = 主链 7 + 特殊 2；D-PS16 = **D1–D9**。
- A11：`node scripts/doc-check.mjs --root thincoder` EXIT 0。

**⑥ 边界与披露**：EN 运行面零触（目标形留实施轮）· 批次档 §1 ∥ §3 零触 · `ENGINEERING-MODE-V2.md` 零触（对照口径）· 需求档零笔 · **零新机制**（收正 ∥ 清理 ∥ 补记——评审发现逐号落位）。披露：① 本档 §9 反向引用（`:855`）插在变更记录条目序列中段——其后条目不在「变更记录」区带内（行宽闸直接约束；本轮新条目已按 ≤300 拆分，无碍）；② 变更记录条（本批）先稿误携旧方向表述（CN 正本 = eng-coder 落）——已按更正裁定收正（记录面净）。

**提示词缺句收正批 · 设计评审修正轮 2（fix 轮）· eng-designer · 2026-10-09**

**受理**：§3 轮次 2 五条（#1–#5；🔴1 ∥ 🟡2 ∥ 🔵2）+ 范围外注记 1 条（普通侧同形句）。父侧裁定（派单 · 全受理）：① 落笔轮次单源 = §6.1 面分述（CN = 设计轮直落 ∥ EN = 实施轮）∥ ② 面名统一取「中文审核面」∥ ③ §3.1 三行按 §2.4 同形补标记 ∥ ④ 坐标收正 ∥ ⑤ 标题 as-of 补注。

**① 逐号落位表**

| # | 处置 | 落形 | 坐标（as-of 2026-10-09 实读） |
|---|---|---|---|
| 1 | 落笔轮次单源收口 | CN 直落 + 本档已落 | `persona-engineering.md:177`（CN-1）· `discipline-engineering.md:137`（CN-2）· 本档 `:163`（面分述）· `:164`（沿革注）· `:883`（原 `:882`——收正） |
| 2 | 面名收口（「中文镜像面」⇒「中文审核面」） | CN 直落 + 本档已落 | 本档 `:163` · `:889`（原 `:888`）· `:165`（面名等价注——原 `:164`）· `:46`（「镜像」列消歧）· `discipline-engineering.md:169` · `persona-eng-designer.md:6`/`:14`/`:15` |
| 3 | §3.1 补迁移期引文标记 | 本档已落 | §3.1 `:128`–`:130`（A16 ∥ A17 ∥ A18） |
| 4 | §6.3 坐标收正 | 本档已落 | `:193`（原 `:192`）——CN `:182` ∥ EN `:186` ∥ 池规则 `:190` |
| 5 | §10.2 标题 as-of 补注 | 本档已落 | `:666`（原 `:665`） |

**② CN 直落（已落 · 逐字 == §2 ② 围栏块）**：`persona-engineering.md:177` = CN-1（「同类 = 同一事项（同一问题 ∥ 同一工作对象——与 `kind` 字段取值无关）」）∥ `discipline-engineering.md:137` = CN-2（「写面（…）与**工具路径参数**（传给工具的一切路径——如评审 `documents`）」）。EN 对照形两笔 = 实施轮。

**③ 受影响文件与读数**：本档 `PROMPT-SYSTEM.md` 891 → **897** 行（+6 = 沿革注 1 + 变更记录条 5）；`persona-engineering.md` 205（±0）· `discipline-engineering.md` 188（±0——§⑤ 表记 187，本轮现盘实读 188）· `persona-eng-designer.md` 80（±0）。新行宽 ≤ 232 字符（<300 闸）。机检（2026-10-09 复跑 · cwd = `thincoder/`）：`doc-check` EXIT 0（悬空 0 ∕ 行宽全绿 ∕ 行数面差异 0）∥ `prompt-refs-check` OK（提示词面 82 档 ∥ 代码面 439 档 · 0 命中）。

**④ 验收对照（追加）**
- A12：CN-1 ∥ CN-2 在位（== §2 ② 围栏块逐字）；「同类**并入**」旧歧义形 ∥「写面（批档 ∥ 台账 ∥ 写门）先定」旧形零命中。
- A13：「中文镜像面」规范面零残留（6 处归一：本档 `:163`/`:889` + D1 + 人格档三处）；§2.2「镜像」列同词异义消解（`:46` 非面名注在盘）。
- A14：§3.1 A16/A17/A18 行「端侧副本已删 ∕ 迁移期引文——现行落点见 §6.3」标记在盘；`doc-check` EXIT 0。
- A15：§6.3 CN 坐标 = `persona-engineering.md:182`（实读）；§10.2 标题携「；表内各行复算日期为准」。

**⑤ 实施轮交接读数（EN 目标行——内容定位 · as-of 2026-10-09）**：§2 ③ 所记 EN 坐标现盘漂移，按内容实读刷新：EN-1「Dedupe on booking」= `thincoder-core/prompts/persona-engineering.md:180`（原记 `:178`）∥ EN-2 第 8 条 = `thincoder-core/prompts/discipline-engineering.md:141`（原记 `:140`）∥ D1 尾 = `:177`（原记 `:176`）∥ 门行 = `:102`（原记 `:101`）∥ 多实现面处置 = `:161`–`:162`（原记 `:161`）∥ `persona-eng-designer.md:6`/`:14`/`:15` = 原记不变（EN 实体零触——本修正轮）。

**⑥ 边界与披露**：EN 运行面零触 · 批档 §1 ∥ §3–§6 零触 · 旧登记族（`:721` 族 ∥ `:284`/`:427`）零 back-edit（沿革注承 §6.1）· 需求档零笔（`ENGINEERING-MODE-V2.md` 仅对照）· **零新机制**（命名收口 ∥ 标记 ∥ 坐标 ∥ 沿革注）。披露：
① CN-1 引文两形并存——派单摘要作「（…；与 `kind`…）」分号形、§2 ② 围栏块作「（…——与 `kind`…）」破折号形；本轮按围栏块落（A1「整行 == 围栏块」逐字判据对象）。
② 本档 fix 轮 1 块内「中文镜像面」引文 = 当时落形（记录面历时不 back-edit）；现盘面名 = 「中文审核面」（§6.1）。
③ EN 目标形三行载「Chinese mirror face」——面名收口后与 CN 名（中文审核面）对译不一 ⇒ 实施轮落笔前须随正（本修正轮零触 EN 目标形）。
④ §6.3 同括号 EN 坐标（原记 `:179`/`:183`）随 CN 收正一并现盘刷新——同一 as-of 声明下不可部分留旧。
⑤ 范围外注记（`discipline-normal.md:92`「同类并入」同形句）本修正轮零笔——同源补齐与否归父侧（跨档 · 普通侧）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（本轮）发现表**——范围 = `thincoder/docs/core/design/PROMPT-SYSTEM.md` ∥ `thincoder/docs/core/design/prompts/persona-engineering.md` ∥ `thincoder/docs/core/design/prompts/discipline-engineering.md`（三档全文实读；无标准档、无文档地图声明 ⇒ 归属 / 方法论按 Project Guide + 两档自持规则判，限制在案）。
抽核（可复算项）：§10.2 对两档 CN 面读数成立——`discipline-engineering.md` 标题节点 17（`##` 10 + `###` 7）与行 7「17/17」相符；`persona-engineering.md` `##` 16 与行 12 的 CN 16 相符（EN 侧未读 — unverified）。本轮登记的两笔「改前态」在盘成立：`persona-engineering.md:178`／`discipline-engineering.md:137`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | **提示词面「实施轮落笔人」两说并存（同一机制两处写法）**：`docs/core/design/prompts/discipline-engineering.md:169`（D1）「提示词 = 主 agent 内容权 + eng-coder 落笔」＋ `PROMPT-SYSTEM.md:163`「**落笔走正常链**（设计评审 → 用户批准 → eng-coder）」；而对 CN 镜像面（`docs/core/design/prompts/**` 落 `docs/**` 内）`docs/core/design/prompts/persona-engineering.md:89` 作「**文档面**（`docs/**` 需求/设计档）→ **eng-designer**」、`:90` 判据句「文档面派 eng-coder = 违规（设计/需求档唯一作者是 eng-designer）」，`PROMPT-SYSTEM.md:774` 又作「（镜像面 = eng-designer ∕ 运行期面 = eng-coder）」。本批 `PROMPT-SYSTEM.md:882` 已登记「**提示词实体落笔 = 本批实施轮**」⇒ 派单在即，两条口径对 CN 面给出不同执行人，且任选其一都可能被另一条判违规。 | 把落笔人按面钉死在一处权威源（CN 镜像面 ∥ EN 运行期面），并让 D1（:169）、§6.1（:163）、路由规则（:89–:90）三处措辞与之对齐——或显式把「提示词」从路由规则「文档面」射程中单列，同时在 §6.1 ∥ §6.10 间消解镜像面口径的二义。 |
| 2 | Doc consistency（R1） | 🟡 | **中文设计档位置 / 归属两说**：`PROMPT-SYSTEM.md:18` 表行仍记 `thincoder-cli/docs/design/prompts/*.md`（15 档）∥ `thincoder-vscode/…`（15 档），`:23` 记「归属**文档面**：两产品原地保留」，`:46` 记「**归属 = 文档面**（两产品原地保留——裁定 B；改名 / 移动随子系统迁移按文档面计划）」；而现行状态见 `:164`「**中文审核面** = `docs/core/design/prompts/`（16 档——供用户审核；内容权威与设计维护面）」与 `:210`「中文正本 = `docs/core/design/prompts/*.md`（16 档——2026-09-15 批 1 位移落位）」（本评审两档 CN 正本即在 `docs/core/design/prompts/`，范围本身即证）。 | 把 §1 表行与 §2.2 组陈述 / 行值收正为现行落点（可沿用 §1 既有「已删 / 实核空」现状注记形），使「CN 正本在哪」唯一可判。 |
| 3 | Doc consistency（R1） | 🟡 | **「端特有段按注入」与「端特有段现余 0」并存**：`PROMPT-SYSTEM.md:115`（#117）「融合（取并集）+ 端特有段按注入（VSC 的 R14 池段 / 取消 eng-coder 判据；CLI 的改动面反查段）」、`:128`（A16）「融合（取并集）+ 端特有段按注入（VSC 的 R14 / 取消判据；CLI 的改动面反查）」，两行裁定状态仅「已裁（2026-09-13）· 按建议」、无落地状态；`:191` 则记「**端特有段（现体）**：提示词面**现余 0**」（2026-09-17 消端差批）。同族：`:115` 前提校验栏引端侧 `src/prompts/discipline-engineering.md:262-265`（as-of 2026-09-29），而 `:16` 记两产品 `src/prompts/*.md`「已随 U2 删，实核空」／「同名（已随 W2 删——实核空）」——该读数所指副本本档内不可判（**unverified**）。 | 给 A16–A18 / #117–#119 行补落地状态与现行口径（与 §3.2 C1/C2 行「已落地…」既成写法同形），引例坐标按现体落点（核内档）重述。 |
| 4 | Doc hygiene | 🟡 | **规范面残留失效表达（D8 自违）**：`docs/core/design/prompts/discipline-engineering.md:99`「（旧三层门已废）」、`:155`「「登记后保留」已取消」均为纪律句内的「已废 / 已取消」挂尸，而同档 `:177` D8 明禁「不留「已作废」挂尸；历史归**记录面**」；`PROMPT-SYSTEM.md:189` 同族——「（2026-09-28 用户裁定——原「结构性不对称 + 证据 + 显式裁定」口径收窄）」为「原 X ⇒ 收正 Y」式修订痕迹。 | 删除残留、正句只留现行规则；裁定沿革移记录面（变更记录 / 批档）；两档同处置。 |
| 5 | Methodology（提示词面卫生） | 🟡 | **提示词正本内混入维护者注与 EN 逐字副本**：`docs/core/design/prompts/persona-engineering.md:80` 标题内携「**每句判据带根据（出口条件第 9 条 · 2026-10-04 · #848）**」（日期 + 台账号；「出口条件」所指 unverified）；`:81`「落地对应（EN 面 = `thincoder-core/prompts/` 同族档「Close three states」邻位；同拍各 +1 行）：」为落笔指令；`:82`–`:83` 又在 CN 正本内嵌 EN 逐字两行（以 `- **Every claim carries its basis**` 起）。对照 `PROMPT-SYSTEM.md:178`「出处 / 日期 / 批次名 / 评审号一律进设计档不进提示词（语义生效边界除外——保语义去日期注）」与 `:176`「**无同步脚本、无硬一致门**」——内嵌 EN 逐字即事实上的逐字锁（EN 副本本体未读 — **unverified**）。 | 正本行去日期 / 账号注记（语义边界句从简保留）；落笔映射与 EN 逐字移入设计 / 批次记录面；CN 面只留待译中文语义。 |
| 6 | Clarity / 悬空判据（R7d） | 🟡 | **§10.2 表内「漂移」行无处置、无 as-of**：`:682` 行 14 `persona-normal`「4/4（**同数不同节**）｜漂移｜**CN 领先 1 节**：CN「确认与批准门」EN 无；EN 另有 `## Main-agent role`（CN 该内容并在「能力边界」节内）」；全表标题为「### 10.2 结构级复核（15 对 · 已结清 · as-of 2026-09-18）」（`:665`），第 5 行有专门处置块（`:685` 起），第 14 行无；而同档 §6.3（`:189`）已定「端差默认 = 消…「登记后保留」已取消」。 | 为该行补处置结论（判为双语正当差 ∥ 须消端差）并刷新 as-of；同时核第 5 / 12 行「差」是否也需一句处置指针——使「已结清」与表内「漂移 / 差」不再并存。 |
| 7 | 数字口径 | 🔵 | 两处计数待收口：`PROMPT-SYSTEM.md:182`「common 恒第二位、七场景全部注入」vs `:184`「槽位装配矩阵（九场景）与降级链」（何者为现值属本档外事实 — **unverified**）；`PROMPT-SYSTEM.md:590`（D-PS16）「`discipline-engineering.md` 双面清单列 **D1–D8**——表头 ∥ 计数句 ∥ +D8 行」，而正本现为 `discipline-engineering.md:166`「### 文档更新纪律（D1–D9）」（九条；D9 随 2026-10-07 落笔）。 | 同节两数取一（装配矩阵口径以槽位表实读为准）；D-PS16 的跨档同数簿记按现盘刷新或标明 as-of。 |
| 8 | 验收 / 受影响文件面（抽核） | 🔵 | ① 受影响文件面本档仅有指针（`PROMPT-SYSTEM.md:147`「指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：」），无行数 / ±N 注记——本档内变更对象均为纯 `.md`（豁免）、无源码 / 测试档（**指针表未读 — unverified**）；② 本批验收面（一次性比对 / 脚本复跑 / 行宽）归批档（**未读 — unverified**）；③ 坐标抽核：`:192` 记 CN「并行委派与多任务」`docs/core/design/prompts/persona-engineering.md:178` 起（as-of 2026-10-07），现盘该节在 `docs/core/design/prompts/persona-engineering.md:183`（`## 并行委派与多任务`）。 | 行号为 as-of 参考（D4）——如作现盘指针用则随下次收口刷新；受影响文件与验收面以所指权威表 / 批档为准（本评审范围内不可核）。 |

**计数**：🔴 ×1 · 🟡 ×5 · 🔵 ×2（共 8 条）；🔴 = 第 1 条（提示词面落笔人两说）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：设计评审（type=design）——范围 5 档：`thincoder/docs/core/design/PROMPT-SYSTEM.md` ∥ `thincoder/docs/core/design/prompts/discipline-engineering.md` ∥ `thincoder/docs/core/design/prompts/persona-eng-designer.md` ∥ `thincoder/docs/core/design/prompts/persona-engineering.md` ∥ `thincoder/docs/core/requirements/ENGINEERING-MODE-V2.md`。

**口径限制**：无项目标准档、无文档地图（Document ownership 判据降级——按 AGENTS.md 指引 + 档内自查执行）；AGENTS.md 所载 `thincoder/docs/design/` 与在盘 `docs/core/design/` 不同源，指南性检查限工作流 / 纪律面。EN 运行面（`thincoder-core/prompts/**`）不在本评审射程——涉其断言一律按 unverified 处理。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（同一机制两处不同表述） | 🔴 | **中文面落笔轮次两说并存**：本 fix 轮新句 `PROMPT-SYSTEM.md:163`「**中文镜像面 = eng-designer 笔**（随设计轮直落）」+ `persona-eng-designer.md:14`「中文镜像面提示词（中文模板——设计轮直落）」+ 需求档 `ENGINEERING-MODE-V2.md:365`「其笔归设计轮——2026-09-26 裁定」＝**设计轮**；而**本批自身计划** `PROMPT-SYSTEM.md:882`「提示词实体落笔 = 本批实施轮——CN 正本 → EN 按 M9 翻译回写」与同档既有登记族（`:721`「**提示词实体落笔 = 本批实施轮**（双面两档——CN 正本 → EN 按 M9 翻译回写）」· `:723` · `:725` · `:746` · `:752` · `:873`）+ 两处「账内先例 = 落笔归实现轮，本批为单批安排」（`:284` ∥ `:427`）＝**实施轮**。现盘实读：两笔 CN 内容均未落位（`persona-engineering.md:177`「**入库查重**：登记时扫同面既有行——同类**并入**（不另立新行）」无「同一事项」定义；`discipline-engineering.md:137`「写面（批档 ∥ 台账 ∥ 写门）先定**目标仓**」无「工具路径参数」），而同轮 fix 件 CN 已随设计轮直落（`:888`「中文三档随本设计轮直落」）——两规则在盘同时生效。执行人按任一说落笔都可能违另一面写权（eng-coder 落 CN ⇒ 违 §6.1/D1；或设计轮应交未交）。 | 收口落笔轮次为单一表述：明确本批两笔在 CN 面的落笔轮次并对齐 `:882` 与 `:284` / `:427` 的「落笔归实现轮」旧句（两向择一即可，但须单源）；CN 落笔与 EN 落笔分别标明轮次。 |
| 2 | Clarity（命名纪律） | 🟡 | **同一面四个名并存**（本 fix 轮新增名未与既有词汇收口）：**中文镜像面**（`PROMPT-SYSTEM.md:163` 新增 · `discipline-engineering.md:169` 新增 · `persona-eng-designer.md:6` / `:14` / `:15` 新增）∥ **中文审核面**（`PROMPT-SYSTEM.md:164`「**中文审核面** = `docs/core/design/prompts/`（16 档——供用户审核；内容权威与设计维护面）」· `:575` D-PS1 · `:631` · `:651`）∥ **中文正本**（`:176` · `:210` · `:251`）∥ **中文设计档（面）**（`:18` · `:46` · 需求档 `:365` / `:602`）。判据 = 档内自持纪律 `discipline-engineering.md:107`「同一个东西在所有面只用一个名——文档词 = 界面词 = 对话词，1:1；同一个东西两个说法即缺陷」；且 `PROMPT-SYSTEM.md:46`「「面」列的「镜像」= 中文设计档对（对位类型，非运行期面）」使「中文镜像面」与既有的「镜像」同词异义。 | 全档收口到既有多数形态的一个名（或为旧名补等价声明），并消除与 §2.2「镜像」列的同词异义。 |
| 3 | Doc hygiene（悬空引文） | 🟡 | **§3.1 裁决行未随 fix 轮补「迁移期引文」标记**：fix 轮自述 `PROMPT-SYSTEM.md:889`「§3.1 ∥ §2.4 裁决行补落地状态与迁移期引文」——§2.4 已补（`:115`「原引 `src/prompts/discipline-engineering.md:262-265`（as-of 2026-09-29）∥ `:128-130` = 迁移期引文——现行落点见 §6.3」· `:116` · `:117`），§3.1 三行只有落地状态、无标记（grep 全档「迁移期引文」零命中于 `:128` / `:129` / `:130`），行内仍裸引已删端侧档坐标：A16「（`src/prompts/discipline-engineering.md:128-130`）」· A17「独有「收尾验收」节（`:191-195`）」· A18「（`:34-51`）」。同坐标在 §2.4 有标记、在 §3.1 无标记 ⇒ 读者可能追不存在的档。 | 按 §2.4 同形补「端侧副本已删 ∕ 迁移期引文——现行落点见 §6.3」标记，或与 §2.4 行合并引用。 |
| 4 | Doc hygiene（坐标漂移） | 🔵 | `PROMPT-SYSTEM.md:192` 载「CN 正本「并行委派与多任务」`docs/core/design/prompts/persona-engineering.md:178` 起（as-of 2026-10-07 实读）」——现盘实读 `persona-engineering.md:182`「## 并行委派与多任务」（09-07 / 09-09 各批增行后漂移 4 行）。 | 按档内惯例现盘收正（或注明 as-of 漂移，不逐批追）。 |
| 5 | Doc hygiene（时点并存） | 🔵 | §10.2 节标题 `PROMPT-SYSTEM.md:665`「### 10.2 结构级复核（15 对 · 已结清 · as-of 2026-09-18）」与表内本批复算读数（行 5「16/19（2026-10-09 复算）」· 行 7「17/17（2026-10-07 复算）」· 行 8「25/25（2026-10-09 收口轮复算）」· 行 12 · 行 14）两个时点并存，未显式注明以谁为准（承公共层质量条「内部张力显式」口径）。 | 标题 as-of 补注（或注明「各行复算日期为准」）。 |

**范围外注记（不计严重度，非本评审范围文件）**：`docs/core/design/prompts/discipline-normal.md:92`「登记前先扫同面既有行——同类并入，否则注记关系」与工程侧同形，本批「同类 = 同一事项」定义只落工程侧——普通侧同歧义是否同源补齐未在本批登记（沿 D-PS13「同源同知识」先例可议）。

**计数**：🔴 1 · 🟡 2 · 🔵 2 ＝ 发现 5 条（另范围外注记 1 条）。

VERDICT: changes-required

### 轮次 3（评审子代理）

**评审对象**：设计评审 · 第 3 轮复核——prompt-gap-fix 批设计 fix 轮 2 的修复声明与在盘落点（核上表五条 + 范围外注记 1；不查新）。
**口径限制**：无项目标准档 ∥ 无文档地图（Document ownership 判据降级——按 AGENTS.md 指引 + 档内自查）；EN 运行面（`thincoder-core/prompts/**`）射程外——涉其断言 unverified；机检复跑 unverified（本席无 shell——fix 块 ③ 自报 doc-check EXIT 0 ∥ prompt-refs-check OK 未复核）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | 批档 §2 ⑤（2026-10-09-prompt-gap-fix.md） | 🔴 | Unfixed | 设计档侧 + CN 直落全核实：`PROMPT-SYSTEM.md:163: **中文审核面 = eng-designer 笔**（随设计轮直落）` ∥ `:164: 本档旧句「提示词实体落笔 = 本批实施轮」` ∥ `:883: **落笔按面分述：中文审核面 = 本设计轮直落 · 英文运行面 = 实施轮（按 M9 翻译回写，非 cp）**` ∥ CN 两笔在盘：`persona-engineering.md:177: **同类 = 同一事项**（同一问题 ∥ 同一工作对象——与 `kind` 字段取值无关）`、`discipline-engineering.md:137: 写面（批档 ∥ 台账 ∥ 写门）与**工具路径参数**（传给工具的一切路径——如评审 `documents`）先定**目标仓**`。**残留（未点名、无理由）**：批档 §2 ⑤ 落点表 CN 两行仍记旧口径——`:83: 实施轮（eng-coder 落；主 agent 内容权威）`，`:84` 同行「同上」（逐字见下引文块）；与 §6.1 单源 + fix 块 ①「落笔轮次单源收口」（`:174`）及在盘实态两说并存；fix 块 ⑥ 披露五项未含此（其自披露了较轻的「§⑤ 表记 187 ∥ 现盘 188」读数差，却未及落笔列）。批档 = 实施轮任务书（`batchDoc`）——「单源收口」在批档本体未完成。同类未点名残留：`:23: 提示词实体四档落笔 = 本批实施轮`；`:95: `docs/core/design/prompts/persona-engineering.md:178` 整行 == ② CN-1 围栏块（逐字）`（现盘 `:177`）。建议：按本 fix 块自身的命名刷新惯例（§2 ③ EN 坐标「原记 ⇒ 现盘」形）补一行点名这些行。 |
| 2 | 2 | PROMPT-SYSTEM.md ∥ discipline-engineering.md ∥ persona-eng-designer.md | 🟡 | Fixed | 6 处归一在盘：`:163`、`:889`、`discipline-engineering.md:169: **落笔按面分述：中文审核面 = eng-designer 笔 · 英文运行面 = eng-coder 落笔**`、`persona-eng-designer.md:6: **你的提示词笔域 = 中文审核面**`、`:14: **中文审核面提示词（中文模板——设计轮直落）**`、`:15: **中文审核面提示词**`；等价注 `PROMPT-SYSTEM.md:165` + 消歧 `:46: 「面」列的「镜像」= 中文设计档对（对位类型，非运行期面——**非面名**：面名见 §6.1）`；「中文镜像面」规范面零残留（grep 仅余 `:894` 记录面归一说明）。 |
| 3 | 3 | PROMPT-SYSTEM.md §3.1 | 🟡 | Fixed | A16–A18 已携同形标记：`:128: （`src/prompts/discipline-engineering.md:128-130`——端侧副本已删 ∕ 迁移期引文——现行落点见 §6.3）` ∥ `:129: （`:191-195`——端侧副本已删 ∕ 迁移期引文——现行落点见 §6.3）` ∥ `:130: （`:34-51`——端侧副本已删 ∕ 迁移期引文——现行落点见 §6.3）`。 |
| 4 | 4 | PROMPT-SYSTEM.md §6.3 | 🔵 | Fixed | `:193: CN 正本「并行委派与多任务」`docs/core/design/prompts/persona-engineering.md:182` 起；as-of 2026-10-09 实读` == 在盘 `persona-engineering.md:182: ## 并行委派与多任务`；同括号 EN 坐标同拍刷新（`:186` ∥ `:190`）。 |
| 5 | 5 | PROMPT-SYSTEM.md §10.2 | 🔵 | Fixed | `:666: ### 10.2 结构级复核（15 对 · 已结清 · as-of 2026-09-18；表内各行复算日期为准）`。 |
| 6 | 范围外注记 | discipline-normal.md（出射程） | 🔵 | Accepted | `2026-10-09-prompt-gap-fix.md:197: 本修正轮零笔——同源补齐与否归父侧（跨档 · 普通侧）`——边界裁定合理，本批收口；普通侧补否留存父侧路由（未核 — unverified）。 |

**Unfixed 逐字引文**（`thincoder/docs/batches/2026-10-09-prompt-gap-fix.md`）：
```text
:83: | `docs/core/design/prompts/persona-engineering.md` | CN 正本 | 实施轮（eng-coder 落；主 agent 内容权威） | 205 | ±0（:178 整行替换；`##` 16 不变） |
:84: | `docs/core/design/prompts/discipline-engineering.md` | CN 正本 | 同上 | 187 | ±0（:137；`##` 块不变） |
```

**射程外注记（不计严重度）**：批档 §1 状态行仍记 `:6: 评审回归 changes-required（🔴×1 · 🟡×5 · 🔵×2）· 修正轮在跑`——round-1 口径未随 fix 轮 2 / 本轮复核刷新（§1 = 父侧笔，仅记）。

**计数**：前表五条 = 🔴 Unfixed ×1（#1）· Fixed ×4（🟡×2 · 🔵×2）；范围外注记 1 = Accepted（不计严重度）；新增问题 0（#1 为原条残留）。

VERDICT: changes-required

### 轮次 4（评审子代理）

**评审对象**：设计评审 · 第 4 轮复核——prompt-gap-fix 批设计「轮 3 表 #1」的收正声明与在盘落点逐项核（射程 = 批档 §2 ⑤ CN 两行 + `:23` + `:95` + §1 `:6`；不查新；轮 3 表 #2–#6 已排除）。
**口径限制**：无项目标准档 ∥ 无文档地图（Document ownership 判据降级——按 AGENTS.md 指引 + 档内自查）；EN 运行面（`thincoder-core/prompts/**`）射程外——涉其断言一律 unverified；机检复跑 unverified（本席无 shell——fix 块自报 doc-check EXIT 0 ∥ prompt-refs-check OK 未复核）。

**核验结论（在盘实读——四项 + 声明行全数在盘 ✅）**：
- §2 ⑤ CN 两行已收正：`:83` 落笔列 = 「**设计轮直落（eng-designer 笔——已落）**（收正——原记「实施轮（eng-coder 落；主 agent 内容权威）」）」+ 读数「±0（:177 整行替换——原记 `:178`；`##` 16 不变）」；`:84` = 「**设计轮直落（eng-designer 笔——已落）**（收正——同上）」。
- `:23` 已收正 = 「**提示词实体四档落笔：中文审核面两档 = 设计轮直落（已落）∥ 英文运行面两档 = 本批实施轮**（2026-10-09 收正——原记「= 本批实施轮（双面）」；单源 = `PROMPT-SYSTEM.md` §6.1 面分述）」。
- `:95` 坐标已收正 = 「`docs/core/design/prompts/persona-engineering.md:177` 整行 == ② CN-1 围栏块（逐字）（原记 `:178`——现盘）」。
- §1 `:6` 声明在盘且与实态相符 = 「🔴×1——批档 §2 残留已收正：§2 ⑤ CN 两行 ∥ `:23` ∥ `:95`——父侧直笔 · 评审 🔴 直接导出项 · 可 revert」。
- 单源对齐复核：与 `PROMPT-SYSTEM.md:163`（「**落笔按面分述**——**中文审核面 = eng-designer 笔**（随设计轮直落）」）∥ `:164` 沿革注（「本档旧句「提示词实体落笔 = 本批实施轮」」）∥ 需求档 `ENGINEERING-MODE-V2.md:365` ∥ `:602`（D1）一致；CN 两笔在盘（`docs/core/design/prompts/persona-engineering.md:177` = CN-1 ∥ `docs/core/design/prompts/discipline-engineering.md:137` = CN-2）；`persona-engineering.md` = 205 行 ∥ `##` 16（与 `:83` 记相符）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 数字口径（R7c） | 🔵 | **⑤ 表 CN 行计数口径不一（已披露项之延续 · 非新发现）**：`thincoder/docs/batches/2026-10-09-prompt-gap-fix.md:84` 记「现状行数」= `187`（读数格「±0（:137；`##` 块不变）」）；而 fix 轮 2 ③（同档 `:182`）自报「`discipline-engineering.md` 188（±0——§⑤ 表记 187，本轮现盘实读 188）」，与本席现盘实读一致（`docs/core/design/prompts/discipline-engineering.md` 末行 = `:188`，末行为空行）⇒ 表记 187 ∥ 现盘 188 差 1；同表 `:83` 记 `persona-engineering.md` 205 与现盘（末行 `:205`）一致 ⇒ 同表两种计数口径并存。已在 fix 轮 2 ③ 自披露、轮 3 已记「较轻的读数差」。 | 两行统一计数口径（正文行 ∥ 含末空行）并各加一句注，或把 `:84` 计数随现盘刷新为 188——已披露项，非阻断。 |

**范围外注记（不计严重度——轮 3 表 #1 未点名之同形项；本轮不查新，仅记录）**：
- ① 同形坐标项未点名：§2 ② CN-1 头 `:36` 仍记 `:178`（现盘 `:177`）；A2 `:96` 与 §2 ⑤ EN 两行 `:85`/`:86` 记 `:178`/`:140`，而 fix 轮 2 ⑤ 交接读数（`:190`——「EN-1「Dedupe on booking」= `thincoder-core/prompts/persona-engineering.md:180`（原记 `:178`）」）已按内容实读刷新为 `:180`/`:141`（EN 实体射程外——unverified）。
- ② §2 ④「落地文本」围栏（`:73`）仍载收正前句「**提示词实体落笔 = 本批实施轮**——CN 正本 → EN 按 M9 翻译回写，非 cp」；在盘变更记录（`PROMPT-SYSTEM.md:883`——「提示词缺句收正两笔（既有条就地改写——**落笔按面分述：中文审核面 = 本设计轮直落 · 英文运行面 = 实施轮（按 M9 翻译回写，非 cp）**）」）已是收正形——围栏副本与落地文本现不一致（是否按「记录面历时不 back-edit」保留 = 边界问题，不在本轮射程）。

**计数**：🔵 ×1（已披露项之延续）；🔴 0 ∥ 🟡 0。轮 3 表 #1（批档 §2 ⑤ CN 两行 + `:23` + `:95` + §1 `:6`）收正 = 全部在盘。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-10 03:07「墙上两条都走，全自动」= 本会话全自动授权）**

- ① **设计评审 pass** ✓：**轮 4 复核 = pass**（advisor #43——🔴0 ∥ 🟡0 ∥ 🔵1〔计数口径，已披露项、非阻断〕）；轮 1–3 全部 🔴/🟡/🔵 处置表在 §3（Fixed 逐条）。
- ② **修正/残置已落地并逐条核验** ✓：轮 3 🔴 收正四笔（§2 ⑤ CN 两行 ∥ `:23` ∥ `:95`）+ 轮 4 🔵 一笔（`:84` 187⇒188）+ `:36` 坐标一笔——父侧实读核过（§1 `:6` 在册；打标「父侧直笔 · 可 revert」）。
- ③ **token 已签发** ✓（advisor #43 pass 回执）。
- 射程 = 本批实施轮（EN 运行面两行逐字落笔——§2 ② EN-1/EN-2 目标形）+ 随正 + 收口核销；**新范围 ∥ 用户口径裁决 ⇒ 停**；破坏性动作 ⇒ 停。

## §5 实施记录（eng-coder）
**状态行**：实施完成（8 行 EN 落笔逐字在盘（2 行 §2 ② + 6 行补派）· 审计 2 轮 clean · 顾问评审 2 轮 pass · 机检双绿）



**提示词缺句收正批 · 实施轮（eng-coder · 2026-10-10 · round = initial；含父裁补派）**

**交付摘要**：EN 运行面 **8 行**整行落笔（逐字目标形 · M9 翻译回写非 cp），三档：
- `thincoder-core/prompts/persona-engineering.md:180`（EN-1——查重「同类 = 同一事项」定义句）；
- `thincoder-core/prompts/discipline-engineering.md:141`（EN-2——工具路径参数扩面）∥ `:102`（门行 D8 删形：去「(the old three-layer gate is gone)」）∥ `:162`（去「the register-and-keep channel is repealed」挂尸）∥ `:177`（D1 尾面分述）；
- `thincoder-core/prompts/persona-eng-designer.md:6`（笔域 = Chinese review face）∥ `:14` ∥ `:15`（Chinese-review-face prompts ∥ 英文运行面不碰）。

**逐字读数**：8 行在盘 == oracle 逐字节（oracle = 批档 §2 ② 围栏块 ∥ §2 修正轮1 ③；node 脚本逐行判等——`===` 全等 ∥ `:177` 前缀不变 + 尾段 endsWith）；旧形/挂尸零残留（`the old three-layer gate is gone` ∥ `register-and-keep` ∥ `do NOT edit prompt files` ∥ `prompt template dirs excluded` ∥ `prompt files are untouchable` ∥ 旧 D1 尾 = 0）；行数 ±0（实读 205 ∥ 197 ∥ 80——他批先存插入 + 计数口径差另记，非本批增删行）。

**面名随正**：oracle 现文零 `Chinese mirror face`（`:150`/`:153` = "Chinese review face" ∥ `:154`/`:155` = "Chinese-review-face"）⇒ 随正规则**零触发**、按现文逐字落；EN 面面名形 `Chinese mirror face` 零命中（单字 `mirror` 4 处 = 镜站/镜像档/镜像任务通用义，非面名）。

**决策透明表**：
| 决策 | 依据 | 结果 |
|---|---|---|
| 派单只列 2 行 ⇒ 先落 2 行、6 行上抛待裁 | 冲突不自裁（上抛纪律） | 父裁（§1 `:17`）：6 行属本实施轮（补派）——零返工，2 行有效 |
| 随正零触发 ⇒ 按现文逐字落（不把名词形 "Chinese review face" 私自改连字符形） | 「逐字目标形」+「不可逐字落 ⇒ 停报」约束 | 落形 = 现文（名词形空格 ∥ 复合定语连字符形 = 语法位差，非双名） |
| `:102` 只删括注、保留规则本体 | §2 修正轮1 ③ 目标形（D8 删形） | 行 = "- **Gate = one `test` all-green**." |

**审计与代码评审轮次与终态**：
- 分叉审计（explore · 只读）2 轮：轮 1 = 2 行 clean（0 分叉）∥ 轮 2 = 终态 8 行 clean（6/6 新增逐字 + 2/2 回归哈希等值 + 旁触 0 + mirror 面名 0）。
- 内部顾问代码评审（advisor）2 轮：轮 1 = pass（2 行）∥ 轮 2 = pass（终态 8 行；🔴0 ∥ 🟡0 ∥ 🔵2 = 批档 A2/A4 旧坐标 ∥ §2 ⑤ EN 行数读数——非阻断、父侧笔域）。
- **终态 = clean**（0 fix round——两轮评审零需修项；补派不构成 fix round：设计已载目标形、零新语义）。

**机检读数（cwd = `thincoder/`）**：`node scripts/doc-check.mjs` **EXIT 0**（锚 0 悬空 ∥ 行宽全绿 ∥ 行数面差异 0）∥ `node scripts/prompt-refs-check.mjs` **OK**（提示词面 82 档 ∥ 代码面 439 档 · J1/J2/J3 零命中）。

**披露/上抛**：① [上抛·知会] 批档 A2（`:98`）∥ A4（`:100`）∥ §2 ⑤ EN 两行（`:87`/`:88`）仍引设计轮旧坐标（`:178`/`:140`）与旧计数（202/195；现盘 `:180`/`:141` ∥ 205/197）——父侧笔域，建议 §6 收口刷新；② [上抛·知会] EN `:101` 与 CN `:99` 一处对译差异（CN「两道闸（永不互转 ∕ 超窗即裁）为**硬纪律**」半句 EN 无对位）——非本批射程、unverified，归父侧路由；③ 工作树他批先存未提交改动（`discipline-engineering.md:37` ∥ `persona-eng-designer.md:59` ∥ `advisor-design.md` ∥ `persona-engineering.md:94-95`）零触。

## §6 验证与收口（父代理）

**收口日期**：2026-10-10 · **终态**：✅ 已收口（本档随本段冻结）

- **交付面（EN 8 行——§5 实录）**：`thincoder-core/prompts/persona-engineering.md:180`（同类=同一事项定义句）∥ `discipline-engineering.md:102`（门行 D8 删形）∥ `:141`（工具路径参数扩面）∥ `:162`（去挂尸）∥ `:177`（D1 尾面分述）∥ `persona-eng-designer.md:6/:14/:15`（面名与写域三行）。CN 两笔随设计轮直落（`docs/core/design/prompts/persona-engineering.md:177` ∥ `discipline-engineering.md:137`）+ 面名归一 6 处。逐字节对版 8/8 ∥ 旧形零残留 ∥ 行数 ±0（205 ∥ 197 ∥ 80）。
- **评审面**：§3 轮次 1–4（设计评审——轮 4 复核通过）+ §4 已批准（2026-10-09 全链自动授权下代签）+ §5 实施（分叉审计 2 轮 clean ∥ 顾问代码评审 2 轮 pass ∥ 🔴0 ∥ fix 0）。
- **验证读数**：`node scripts/doc-check.mjs` ⇒ EXIT 0（锚 0 悬空 ∥ 行宽 OK ∥ 行数面差异 0）∥ `node scripts/prompt-refs-check.mjs` ⇒ OK（提示词面 82 档 ∥ 代码面 439 档 · J1/J2/J3 零命中）∥ 逐字节判等 8/8。**全仓套件 = 波尾单跑**（父侧——结果随波尾提交记）。集成面 = 零增补（纯提示词文本面）。
- **收口侧处置（两笔）**：
  ① **旧坐标/旧计数以本段为准**（#45 上抛① · 顾问 🔵×2 同指）：§2 A2（`:98`）/ A4（`:100`）/ ⑤（`:87`/`:88`）所引设计轮旧坐标（`:178`/`:140`）与旧计数（202/195）——**复核按 §2 ⑤ + 本段刷新值** = `:180`/`:141` ∥ **205/197**（append-only 档面不改）。
  ② **CN/EN 一处对译差**（#45 上抛②）：CN `discipline-engineering.md:99`「两道闸（永不互转 ∕ 超窗即裁）为**硬纪律**」半句 EN `:101` 无对位——非本批射程 ⇒ **落台账另条**（归批）。
- **台账**：#1157 → **已核销**（evidence = 本段）。
- **冻结**：本档随本段收口冻结——后续走新批新档。
