# 评审后修正轮 ⇄ 用户批准 时序 + `Fixed` 语义 · 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 · 来源 = 本会话用户实况发现（`docs/TODO.md`「工程模式 / 评审收敛」组登记项）。

---

## §1 讨论（主 agent 记）

### 需求来源

用户 2026-09-11 02:34（实况发现，原话）：**"那为啥还在修正轮你就叫我批准？"** → 父侧查证后确认**两处提示词层缺口**；
02:35 用户「登记」；**03:27 用户「提示词的那个问题可以改了」**（= 快车道开工）。

### 缺口一：链路缺「评审后修正轮」节点

- **链（现状逐字）** `docs/design/prompts/persona-engineering.md:18-19`：
  「批次讨论收口 → spawn eng-designer → **核验其产出** → 提醒用户发起设计评审 → **用户批准** → spawn eng-coder 实现」——
  **无「评审后修正轮」节点**。
- **锚#3**（`docs/design/prompts/discipline-engineering.md:135-138`）：
  "Fix rounds reuse the same designToken — but docs FIRST … BEFORE the eng-coder spawn"——
  只规定**修正轮早于 coder**，**未定**它与「用户批准」的先后，也**未定**「修正轮可改什么而不需重新批准」。
- **后果（本会话两次实证）**：第 3 批（13 条采纳项）与第 6 批（8 条）均是「评审 pass → 父侧同时（a）派修正轮（b）请用户批准」；
  用户 02:34 质疑后，父侧只能**临场判断**（"7 条均为评审派生小改、不改已裁内容"）——**该判断没有规则支撑**；
  父侧自定「严格序」（修正轮落地 → 核验 → 再请批准）亦为临场发明，未入档为规则。

### 缺口二：`Fixed` 语义漂移

- **字面定义**（同档评审收敛纪律节）：`Action` is one of exactly three values: `Fixed`（**you edited the code**）、
  `Not an issue`、`Deferred`——**「已改完」语义**。
- **实况**：父侧两批均按「**已派工/在途**」填写 `Fixed`（第 3 批 13 条、第 6 批 7 条）——填表时修正轮尚未落地。
- **后果**：裁决表与真实状态脱节（用户读表 =「已修」，实际在途；追问"还在跑就叫我批准"正源于此）。

### 需求（拟）

1. **链上补节点**：明确「设计评审 pass → 父侧裁决 →（如需修正）**修正轮落地并经父侧核验** → **然后**才请用户批准」；
   若允许并行（修正轮在途 + 同时请批准），**批准请求必须显式声明**：修正轮挂起中 + 逐条内容 + 不含新语义/新范围。
2. **`Fixed` 语义可区分**（二选一，设计裁）：① 保持「已改完」语义 + 新增在途态（如 `Dispatched`/`Pending`）；
   ② 改语义为「已定（含在途）」+ 显式标注落地状态。**无论选哪个，裁决表必须能区分「已落地」与「在途」。**
3. **追溯留痕**：规则变更后，本会话两条既成实践（第 3/6 批的并行模式）如何记（追溯说明 or 不回填）——设计给结论。

### 范围边界（明确不做）

- 只改**提示词层**（决策链 / 裁决表语义）——**不**改评审机制代码（`src/agent-tools/advisor.mjs` 等），
  除非设计证明规则无法靠提示词落地（则显式列出并说明）。
- 不动其它提示词段落（除必要的措辞一致性）。
- **双源/双端同步面**（`src/prompts/*` ↔ `docs/design/prompts/*` ↔ VSC 端副本）——**由设计勘察判定**：
  哪份是运行时权威 / 镜像如何同步 / 本批需改几处——**这是本批最大的落地风险面**。
- 与在册的「8 prompt 文件双端改造 + 双端锚测试扩展」批的关系（若该批未落地，本批改动面覆盖哪端）——设计勘察后声明。

### 待设计裁定（6 问）

1. **权威源判定**：`src/prompts/*` vs `docs/design/prompts/*`（VSC 是否另有副本）——谁被运行时加载、谁镜像、同步机制现状（脚本/手抄）。
2. **新链的逐字写法**（链行 + 锚#3 邻域）：放哪、怎么措辞、与既有锚句的冲突核对（D5/D2 单一权威源）。
3. **`Fixed` 方案选型**（不改语义 + 补态 vs 改语义）。
4. **既有实践追溯**（第 3/6 批）记不记、记在哪。
5. **测试面**：提示词是否有锚测试（勘察既有 prompt 断言档）；本批如何机器断言（如链行关键串断言）。
6. **评审侧角色文本**：`Fixed` 定义在评审子代理侧 persona/纪律中是否另有副本（若有 → 同步面）。

### 状态

**已收口 2026-09-11**（用户"提示词的那个问题可以改了"= 快车道）。下一步 = **设计**（spawn eng-designer）。

**勘误（主 agent——2026-09-11，designer 勘察发现）**：§1「缺口一」把锚#3 记为 `docs/design/prompts/discipline-engineering.md:135-138`——
**实际在 `src/prompts/discipline-engineering.md:135-138`**（主 agent 引错镜像档）；且「交付链收口」节**只存在于两端 `src/`**、中文权威镜像**无该节**（存量双源不对称，本批不改）。
需求本身不受影响；设计档 §13.4 已按正确位置落时序细则。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

### 批次任务（eng-designer 自写 · 2026-09-11）

> 需求 = 本档 §1（逐条承接，不缩不扩）；设计+测试层 = `../design/ADVISOR-CONVERGENCE.md` §13（**逐字文本、落点、用例表、验收标准全在彼处——本段只做任务书**）；
> 需求层 = `../requirements/ADVISOR-CONVERGENCE.md` §6（F7–F10 / N4–N6）。**三方条目一致**：本段条目 = §13.11 验收标准回指条目 = 需求档 F7–F10/N4–N6。

#### 1. 目标与为什么

两处提示词层缺口（§1 实证）：①链上无「评审后修正轮」节点 → 父侧在修正轮在途时就请批准（第 3/6 批）；
②`Fixed` 字面 =「已改完」，实况按「已派工/在途」填 → 裁决表与真实状态脱节。
本批把两者做成**规则**（可判、可核）：时序 = 严格序；词表 = 四值（新增 `Dispatched`）。

#### 2. 已知事实（父侧已勘察——不重复勘察）

- **运行时只加载 `src/prompts/*`**：`src/prompt-overlays.mjs:17-19`（`loadSlot`）+ `:48-57`（engineering 槽序）——`docs/design/prompts/*` **不参与加载**（内容权威面）。
- **每个改动落 4 面**：CLI / VSC ×（`src/prompts/` 落地 + `docs/design/prompts/` 中文权威）；双源**无同步脚本**（手抄/译写）。
- **定义副本 = 8 文件**：`discipline-engineering.md` ×4 + `discipline-normal.md` ×4（逐文件行号见 §13.3）。
- **运行时零解析**：`src/advisor/history.mjs:8/:29-45`（按表头取整表，Action 值不解析）→ 四值化**零代码影响**。
- **评审侧零副本**：`advisor-*.md` / `consult-base.md` / `persona-*.md` 对 `Fixed` 词表零命中 → 评审侧提示词不改。
- **既有断言对词表零断言**（双端 test 目录 `three values|三值|三选一` 零命中）——但既有 prompts 锚测试必须**保持全绿**。

#### 3. 设计要点与禁止范围

**要做（16 文件——12 提示词 + 4 测试；逐字文本与落点见 §13.3/§13.4）**

1. **链行节点**（§13.4a）：4 个 `persona-engineering.md`——插入子串（四面逐字相同）：
   `**评审 pass 后逐条裁决** →（如需修正）**修正轮落地并经核验** →`
2. **Action 四值**（§13.3）：8 文件（de ×4 + dn ×4）——就地替换词表句（zh 面「恰好三选一」→「恰好四选一」+ 增 `Dispatched`；en 面 `exactly three values`→`exactly four values` + 增 `Dispatched`）；
   VSC `src/prompts/discipline-normal.md:93` 为**合并行**——只改子句、不动行结构。
3. **时序 bullet**（§13.4b）：4 个 `discipline-engineering.md`——同文插入「评审收敛纪律」节，位置 = 紧随「裁决表」条块末行、轮次衰减条之前（对位锚句“……未解决的 🔴 必须向用户呈现。”/“……surface any unresolved 🔴 to the user.”）。
4. **锚断言同批**（§2.7 #12——文本与断言同链原子落地）：
   - CLI `test/prompts-async-guidance.test.mjs`：新批节（链行/四值/时序 bullet 双源断言 + 负断言）；
   - CLI `test/eng-designer-role.test.mjs`：T40 双源循环字面表 **+2**（`评审 pass 后逐条裁决`、`修正轮落地并经核验`）；
   - VSC `test/prompts-async-guidance.test.mjs`：同款断言（本端 src + 中文镜像两侧）；
   - VSC `test/prompts-mirror-anchors.test.mjs`：A12 字面 **+2** + 新面⑥（本批两组字面表跨仓逐字：CLI ↔ VSC × 双源）。
5. **VSC 设计档同步**：`thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md`（现 287 行）——§7 第 2 条改四值 + 时序规则节 + 变更记录行。

**不做（禁止范围）**

- 不新增锚号 / 不新增测试文件（不改 VSC `test/files.mjs`）；不重排既有段落、不改行结构。
- 不改评审机制代码（`src/advisor/**`、`src/agent-tools/advisor*.mjs`）、评审侧提示词（`advisor-*.md` / `consult-base.md`）。
- 不改 **锚#1–#7** 任何逐字句（含锚#3 docs FIRST、锚#4 拍板≠批准）——只加不改。
- 不改工程模式机制档（`docs/design/ENGINEERING-MODE.md` 两仓——他链在途；登记面见 §13.9）。
- 不改批次档 / `docs/TODO.md` / README / CHANGELOG；提示词内**零维护者注**（§2.7 #15——无日期/批次号/评审号）。

#### 4. 验收标准（机器可验证——逐条回指需求；全文见 §13.11）

| AC | 判据（可执行） | 回指 |
|---|---|---|
| AC-RO1 | 4 个 `persona-engineering.md` 各含 `评审 pass 后逐条裁决` 与 `修正轮落地并经核验`（T-RO1） | F7 |
| AC-RO2 | VSC `prompts-mirror-anchors.test.mjs`（A12 +2 + 新面⑥）绿——CLI ↔ VSC 逐字 | N5 |
| AC-RO3 | 8 个词表句文件各含 `Dispatched` + 计数词同改（`exactly four values` / `恰好四选一`），词序 Fixed→Dispatched→Not an issue→Deferred（T-RO2/T-RO3） | F9 / N6 |
| AC-RO4 | 4 个 de 各含时序 bullet 四要素（label / 不得请求批准 / 不得夹带新语义新范围 / `Dispatched` 收敛句）（T-RO4） | F7 / F8 |
| AC-RO5 | 负断言零残留：无 `恰好三选一` / `exactly three values`；persona 面旧相邻形态零命中（T-RO5） | F9 |
| AC-RO6 | 双端既有 prompts 锚测试全绿：`cd thincoder && node test/run-fast.mjs`；`cd thincoder-vscode && node test/run-fast.mjs`；锚#1–#7 字面逐字在位 | N4 |
| AC-RO7 | 范围外零改动：`git status` 中 `src/advisor/**`、`src/agent-tools/advisor*.mjs`、`src/prompts/advisor-*.md`、`src/prompts/consult-base.md` 零变更 | 需求 §6.4 |
| AC-RO8 | 文档面一致（VSC 设计档 §7/时序节/变更记录）+ 双端 `node scripts/check-doc-width.mjs` **新增超宽 0**（存量不属本批） | N6 |
| AC-RO9 | 追溯留痕：本档变更记录含「新老划断」行；两冻结批次档**不在本批改动集** | F10 |
| AC-RO10 | 交付报告写明「提示词改动需 reload 会话后生效」——不得以静态断言绿声称已生效 | N4 类比 |

#### 5. 交付报告格式

Done / Simplified / Not done 三值表 + 逐文件改动清单（16 项，标 4 面归属）+ 断言运行输出（双端 run-fast `ℹ tests/pass/fail` 行）+ 负断言证据 + 偏差如实披露（超声明 = 披露即可）+ 明确「不 commit」与 reload 声明。

#### 6. 就绪状态

**任务书就绪**——设计待用户发起评审（发起权在用户）；批准后 spawn `eng-coder`（`batchDoc` = 本档）。
设计裁定六问结论：①权威源 `docs/design/prompts/`（内容）+ 运行时 `src/prompts/` → **每改动 4 面**；②链行节点 + 时序 bullet 逐字文本 = §13.4；
③`Fixed` = 方案①（保语义 + 补 `Dispatched`）；④追溯 = 新老划断、不回填冻结档（§13.7 D-RO6）；⑤测试 = 扩展既有档 + A12 字面扩展 + 新面⑥；
⑥评审侧无 `Fixed` 副本（实证）→ 不改。

> 注记：上方 §2 骨架占位行（「待写——eng-designer」）随 append-only 保留——**本段（自「### 批次任务」起）为准**。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（0🔴 · 4🟡 · 4🔵——发现表见 §3）。主 agent 裁决 **8 条全部采纳落档**（docs FIRST——同一 designId 链内；不重新发起评审）。本轮 = 修正轮（**只改文档、不碰实现**）。

**归属与计数收口（评审 #1——按主 agent 裁定）**：

- `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md`（上文「要做」第 5 项）**owner = eng-designer**（D1 设计档写权 + 本会话第 3/6 批先例）——**本修正轮已落**（§7 四值 + §12 收口节 + 变更记录行）；`D-RO8` 的「coder 落笔」只适用**产品代码**（`src/prompts/*.md`），不适用设计档。
- **coder 交付 = 16 项**（12 提示词 + 4 测试）——VSC 设计档**不计入** coder 交付清单与 `files` 声明；三处计数对齐 = 本段（16）= 设计档 §13.6 实施域（16）= 交付报告口径（16）。

**逐条落点（编号 = §3 轮次 1 发现编号——详文落设计档 §13；下表为修正轮落定后落点）**：

| 评审 # | 落点（修正轮已落） | 内容 |
|---|---|---|
| 1 | VSC `docs/design/ADVISOR-CONVERGENCE.md` · CLI 设计档 §13.6 | 归属与计数三处对齐（16 项保持）；文档域逐行 owner 标 |
| 2 | CLI 设计档 §13.5 | 「零运行时引用」表述 + 测试层实测行位（4 处） |
| 3 | CLI 设计档 §13.7 D-RO8 · §13.8 · §13.9 | 补引 `ENGINEERING-MODE.md` §1.5 #8/#10；内容权口径显式化；口径抵牾登记 §13.9 |
| 4 | CLI 设计档 §13.6 · §13.10 | 新面⑥定义 = 四值句组 + 时序 bullet 组跨仓逐字（zh↔zh / en↔en） |
| 5 | CLI 设计档 §13.6 | 行数口径：改前 → 现态（读取口径）+ ±1 口径注 |
| 6 | CLI 设计档 §13.6 注 | tier 措辞 = 「无新增跨档；存量 >500 面（该档）不在本批范围」 |
| 7 | CLI 设计档 §13.1 | 锚#3 引用仓限定（CLI `:135-138` / VSC `:136-139`） |
| 8 | CLI 设计档 §13.11 | AC-RO9 判据收缩 =「不在本批改动集（清单/委托声明）」 |

**编号不变性**：F7–F10 / N4–N6 / AC-RO1–RO10 / T-RO1–T-RO6 / D-RO1–D-RO8 编号集合本修正轮零变化（「面⑥」为镜像测试断言面序号，非本批编号系统）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected files / Clarity | 🟡 | VSC 设计档的归属与计数三处不一致：设计 `thincoder/docs/design/ADVISOR-CONVERGENCE.md:337` 实施域称「16 项：12 提示词 + 4 测试」且 `:358` 文档域表头写「非 coder 写域」、把 `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md`（`:365`）划在 coder 域外；但批次档 `thincoder/docs/batches/2026-09-11-PROMPT-REVIEW-ORDER.md:97` 「要做（16 文件…）」实列 5 项、第 5 项（`:109`）即该 VSC 设计档，交付清单口径「16 项」（`:136`）；本评审对象声明计「17 项（实施）」。第 17 项无单一 owner：归 coder 则 D1（设计档=eng-designer）张力未登记（对标 D-RO8）；归 designer 则批次链无落笔步骤。 | 定一个 owner 并对齐三处计数：coder → §13.6 改 17、该档入 `files` 声明与交付清单、补 D1 张力注记；designer → 批次档第 5 项标注 owner、§13.6 表头与计数同步（16 项保持）。 |
| 2 | Evidence accuracy | 🟡 | §13.5「`docs/design/prompts/*` 全仓 `.mjs` 零引用」（`:326`）与事实不符：测试层 .mjs 引用该路径——`thincoder/test/prompts-async-guidance.test.mjs:428` · `thincoder/test/eng-designer-role.test.mjs:298` · `thincoder/test/batch-segment.test.mjs:220` · `thincoder-vscode/test/prompts-mirror-anchors.test.mjs:30`。「中文权威面不参与加载」结论成立（`src/**` 零引用 + loader 实证），仅证据表述过宽。 | 改写为「零**运行时**引用（`src/**` 不加载）；测试层引用为双源/跨仓断言所需」。 |
| 3 | Methodology / Requirements fit | 🟡 | D-RO8/§13.8 的 §2.7 #13「冲突点」记录不完整（`:380`、`:390`）：未引同日用户裁定 `thincoder/docs/requirements/ENGINEERING-MODE.md:126-128`（§1.5 #8：提示词**内容权=主 agent**、「**落笔仍走正常链**（设计评审 → 用户批准 → eng-coder）」）与 `:130`（#10）——#8 恰为「落笔交 coder」提供既有裁定支持，本批应按「有既有裁定 + §2.7 #13 口径差」叙事；且本批「内容权 = 设计面」（`:380`）与 #8/#10「内容权 = 主 agent」的口径差未核对。 | D-RO8/§13.8 补引 ENGINEERING-MODE §1.5 #8/#10；写清内容权口径；如需收口 §2.7 #13 文本，登记 §13.9。 |
| 4 | Test plan / Clarity | 🟡 | 「新面⑥（本批两组字面表）」未定义（`:356`、AC-RO2 `:420`、批次档 `:108`）：「两组」指哪些字面（链行组/四值句组/时序 bullet 组）、断言哪几面，不足以无歧义实现/判收；四值句的跨仓逐字（zh↔zh、en↔en）仅该面承载（T-RO2/T-RO3 只做逐文件子串在位）。 | §13.6/§13.10 列明面⑥两组字面清单与文件面（或写明「镜像 T-RO1–T-RO4 字面集跨仓」），四值句跨仓逐字纳入。 |
| 5 | Doc hygiene | 🔵 | §13.6 文档域「当前行数实测」为改前值（`:362-364`）：`requirements/ADVISOR-CONVERGENCE.md` 65→现 105；本档 234→现 450；`PROMPT-SYSTEM` 296→现 301。纯 .md 豁免 R24a，不影响实施。 | 改标「改前行数」或按现态更新；±1 计数口径（如 VSC persona 表 78/实测 79）一并注明。 |
| 6 | Acceptance / Tier | 🔵 | §13.6 注「无超档风险（最大 512→≤542）」（`:367`）：`thincoder/test/prompts-async-guidance.test.mjs` 实测 512–513 行，已在 500 硬限之上（本批再 +≤30）——按字面「无超档风险」不成立（应为「无**新增**跨档」）。存量面属本批排除项，仅措辞精度。 | 改措辞「无新增跨档；存量 >500 面（该档）不在本批范围」或按项目口径登记。 |
| 7 | Citation | 🔵 | §13.1 锚#3 引用 `src/prompts/discipline-engineering.md:135-138`（`:238`）对 CLI 精确（135–138 含整条锚#3，已核）；VSC 同文锚实际在 `:136-139`。 | 加仓限定（CLI 135-138 / VSC 136-139）或标 as-of 口径。 |
| 8 | AC judgability | 🔵 | AC-RO9（`:427`）「两冻结批次档无**本批**新增 hunk」无基线时不可机械归因（两档有他链在途改动）。 | 判据收缩为「两档不在本批改动集（files/委托）」+（如需）批前哈希比较。 |

**范围外注记（不计严重级）**：`thincoder/docs/requirements/PROMPT-SYSTEM.md` §2.7 #13（「不走 eng-coder 实现链／文本迁移=架构师直接做」）与 `thincoder/docs/requirements/ENGINEERING-MODE.md` §1.5 #8（「落笔仍走正常链 → eng-coder」）两条同日用户裁定互相抵牾；后者属本批排除面（他链在途），不赋严重级——但它正是 D-RO8 处置的关键背景，建议父侧确认收口去向。

**计数**：🔴 0 · 🟡 4 · 🔵 4

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 04:00 用户批准**（原话："批准"）——**评审 + 修正轮 + 父侧逐条核验后的正式签字**（严格序）。

- 设计评审（轮次 1）**pass**（0🔴 · 4🟡 · 4🔵——发现表见 §3 轮次 1）；
- 8 条发现经主 agent 裁决**全部采纳**：① **VSC 设计档归属收口**（裁定 = **designer 落**——D1 设计档写权 +
  本会话第 3/6 批先例；D-RO8 的 coder 落笔仅适用**产品代码** `src/prompts/*.md`）② §13.5「全仓 .mjs 零引用」→「零**运行时**引用」③ D-RO8 补引
  `requirements/ENGINEERING-MODE.md:126-128`（§1.5 #8）+ `:130`（#10）+ 内容权口径显式化 + §13.9 登记口径抵牾 ④ **新面⑥定义**（组 1 = 四值句跨仓逐字 /
  组 2 = 时序 bullet）⑤ 文档行数注记改「改前 → 现态」⑥ tier 措辞改「无新增跨档」⑦ 锚#3 仓限定（CLI 135-138 / VSC 136-139）⑧ AC-RO9 判据收缩；
- 修正轮落地（id=13）经父侧核验：**11/11 内容抽查** + **全仓 `git status` 兜底**（提示词/测试面零改动；VSC 设计档 287→330 行已落，
  含新 §12「对位 CLI §13」——**编号裁决接受**：双端各端编号自持、语义权威在 CLI 档）；
- **token 已签发**（轮次 1 评审返回；值不落档——运行时凭证）。

**批准范围**：提示词四面 + 4 测试档——**16 文件**（12 提示词 + 4 测试）；**零代码影响**（运行时零解析 + 评审侧零副本——已实证）。
**不含**：VSC 设计档（designer 已落，不计入 coder 交付）· `PROMPT-SYSTEM.md`（抵牾登记，不改文本）· `ENGINEERING-MODE.md` 链（他链在途）· CHANGELOG / README。

**下一节点**：eng-coder（16 文件写域）→ 交付 → 父侧实跑 → 用户验收 → §6 收口 + 令牌消费。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

### PROMPT-REVIEW-ORDER 实施（eng-coder 自写 · 2026-09-11）

**交付摘要**：16 文件（12 提示词 + 4 测试；CLI/VSC 双仓）全部落地，**逐字照抄设计档 §13.3/§13.4 文本**（未改写/未润色/未重排）——
①链行节点 ×4（§13.4a 子串插入）；②Action 四值 ×8（§13.3 就地替换 + 计数词同改）；③时序 bullet ×4（§13.4b 全文逐字；
位序 = 裁决表块末行之后、轮次衰减之前）；④锚断言同批（T40 双源 +2 · 双端 async 新批节 T-RO1–T-RO6 · A12 +2 + 新面⑥）。

**逐需求透明表**（Done / Simplified / Not done——逐条对 F7–F10 / N4–N6）：

| 需求 | 状态 | 落地证据 |
|---|---|---|
| F7（链上节点 + 严格序） | Done | 链行子串 ×4 + 时序 bullet ×4（§13.4 逐字同文） |
| F8（修正轮边界：不夹带新语义/新范围） | Done | bullet 第三行「**不得夹带新语义/新范围**」逐字落档 ×4 |
| F9（`Fixed` 四值封闭词表） | Done | 8 词表文件逐字替换；`Dispatched` 新增；词序 Fixed→Dispatched→Not an issue→Deferred 全 8 面 |
| F10（追溯留痕·新老划断） | Done（文档面——designer 已落，非 coder 域） | 本批改动集不含两冻结批次档（2026-09-10-MODEL-SELECTION / 2026-09-11-DEEPSEEK-V41-FLASH） |
| N4（既有锚测试全绿 + reload 生效声明） | Done | 双仓全量实跑 fail 0；报告含 reload 声明 |
| N5（双端语义同源·逐字） | Done | 面⑥ 跨仓逐字（四值句 zh↔zh / en↔en + bullet 全文）+ A12 字面 +2 |
| N6（计数与枚举同改·D3） | Done | `恰好四选一` / `exactly four values` 与枚举同改；断言含语言绑定 |

无 Simplified / Not done 项；无超 16 文件的越域改动。

**轮次与终态**：
- 内部偏差审计（explore，1 轮）：2 条测试行数超预估（披露项）+ 1 条计数词断言语言不敏感 → 当即修（`want` 分语言绑定）；其余逐字/位序/负断言全核通过。
- 子代理内 advisor 代码评审（1 轮）：**VERDICT: pass**（0🔴 · 1🟡 · 2🔵）——🟡 = 存量 >500 行档（`test/prompts-async-guidance.test.mjs`，设计档 §13.6 注已排除、非阻塞，处置 = Deferred/父侧登记）；🔵 = 3 档测试增量超预估（按批次协议披露）+ 收口核验提示。
- 修正轮：0（无 🔴；1 条 🔵 已即修，其余披露）。**终态 = clean**。

**测试记录**：CLI `node --test test/eng-designer-role.test.mjs test/prompts-async-guidance.test.mjs` = 64/64 pass；
VSC `node --test test/prompts-async-guidance.test.mjs test/prompts-mirror-anchors.test.mjs` = 53/53 pass；
双仓全量 `npm test` = **fail 0**（CLI 363 档/352 pass/11 skip；VSC 366 档/365 pass/1 skip；日志 = 两仓根 `_t-prompt-order-{cli,vsc}.log`）。
注：CLI 全量进程退出码曾受 slow 门计时飘动影响（仅命中**未改动**文件 `test/setup-reminders.test.mjs` 的计时敏感用例、offender 集合逐次不同 = 环境负载抖动态）——测试失败数恒为 0。

**偏差披露（如实）**：3 档测试**实际增量超设计 §13.6「预计增量」**——CLI async 512→562（≈+50 vs ≤+30）· VSC async 396→449（≈+53 vs ≤+25）· VSC mirror 202→230（≈+28 vs ≤+12）；原因 = 逐字全文常数 + T-RO1–T-RO6 全覆盖 + 双源/跨仓提示；**无新增跨档**（CLI 该档存量 >500 属设计排除面；VSC 449<500）。其余逐字契约、落点行位、位序、负断言零偏差；提示词零维护者注。

**生效声明（AC-RO10）**：提示词改动**需 reload 会话后生效**——静态断言绿 ≠ 已生效。VSC 端实际 reload 表现：**未执行（无 IDE 环境）——待父侧/用户实机验证**。

## §6 验证与收口（父代理自写）

**2026-09-11 10:53 用户验收**（原话「都验收」——含本批）。

- **交付面**：16 文件（12 提示词 × CLI/VSC × 双源 + 4 测试档）——链行节点（4 面逐字）· Action 四值（8 档）+ 旧三值句（4 档）· 时序 bullet（4 档）· 断言扩展（T40 +2 · async 新批节双端 · A12 +2 + 面⑥）。
- **父侧实跑**：链行逐字 4/4 ✓ · 四值面 8/8 ✓（旧三值零残留）· 时序 bullet 与设计四要素逐字吻合 ✓ · 合并行个案（VSC discipline-normal）行结构未动只改子句 ✓ · CLI 选中 64/64 · VSC 选中 53/53 · 全量 CLI 352/0 · VSC 365/0；两冻结批次档 mtime 早于 coder 开工 = 未动 ✓。
- **偏差裁定**：3 测试档增量超预估（已披露、无功能影响、收口按实测回写）；AC-RO7/RO9/RO10 父侧面**已跑替代核对** ✓。
- **遗留转后续**：`test/prompts-async-guidance.test.mjs` 562 行 >500 硬限 → **第 13 批**（`docs/TODO.md` 在案）。
- **状态行刷新**：链上行为定义已运行生效；设计/需求档状态行 → 随下次该档设计轮刷新。
- **令牌链**：设计评审 token **已消费**（`consume-design`——链终）。

---
