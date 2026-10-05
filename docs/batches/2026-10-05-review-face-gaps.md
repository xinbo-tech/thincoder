# 2026-10-05 · 评审面两缺口（引文自检基面 ∥ 域随锚派生）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 21:28「找几条技术待办刷几个真实任务试一下」（承台账 #928 ∥ #945——评审工具面两缺口攒批）。
> 台账 = #928+#945（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源与授权

- 来源 = 台账 **#928**（评审引文自检对照 **HEAD 版而非工作树**——未提交文档引文全部误报失配；2026-10-05 实测 0/23 + 0/5 实例）+ **#945**（`documents` 域按锚点 manifest 派生——子仓锚欠声明 ⇒ 合法文档面送审被拒 `scope-not-doc`；机制 = `review-facts.mjs:32` `REVIEW_ROOT_KEYS` 五键 + `:38-46` 派生，非硬编码）+ 用户 21:28「找几条技术待办刷几个真实任务试一下」= 本批点火（两缺口同面攒批）。
- 方向（设计轮勘定）：① 引文自检基面收正（工作树为准；HEAD 作 fallback 或双读并注）；② 域解析改「按目标文档最近 manifest」派生（与 #828 修向同源）。
- 备注：#928 的误报今日在评审 `#44`–`#52` 多次活体出现（「0/N citations match」噪声）——本批即其根治候选。
- 授权 = 全链跑（设计 → 代点火评审 → 代签 → 实施 → 收口）。

**§1.2 勘正（设计轮活体证伪 · 2026-10-05 21:4x）**：原题面「引文自检对照 **HEAD 版而非工作树**」经设计轮勘定**证伪**——`advisor/citations.mjs` 零 git 面（仅 `node:fs`）实读**工作树**，未提交档引文可正常解析；0/23 等噪声真因 = 引文的**包裹引号 / 行内注记被并入捕获串**致字节比对失败（失效清单 10 条捕获文本均含装饰；去前置 `"` 即 matched 1——探针实读坐实）。**修向随正** = 装饰剥离候选集（真机制）——§2 已按此落形并给红绿对（红面实跑坐实）。台账 `#928` 证据行随正（父侧笔）。方向不变（消误报噪声）；原题面仅存史于本段。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮次 1 修正（fix）六项已落 §2.8——登记 ∥ 验收 ∥ 描述面；机制语义零改；题面前提证伪列 U1）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 台账 | 条目 | 验收面（回指） |
|---|---|---|---|
| ① | **#928** | 评审引文核验**装饰误报**：引文的包裹引号 ∥ 行内注记被并入捕获串 ⇒ 字节包含判失败，合法引文判 `content mismatch`（未提交档引文同误——实例 0/23 · 0/5 · 0/10 …） | 红绿对 R1–R3（先红后绿）＋控制 G1 ＋负控 N1–N3（零放宽） |
| ② | **#945** | 评审 `documents` 域解析**锚点依赖**：子仓锚下、**容器相对形**的合法文档无底座可试 ⇒ 拒 `scope-not-doc` | 红绿对 R4–R5（先红后绿）＋控制 G2 ＋负控 N4–N5（零放宽） |

### 2.2 #928 · 机制勘定与修形（引文核验：装饰剥离候选集）

**症状（实例在案）**：评审回执附「`[host-verified] 0/23 citations match`」噪声（2026-10-05 ledger-unification 轮 2；另 0/5 ∥ 0/10 ∥ 0/1 ∥ 0/2 多实例）；父侧抽核逐字相符。失效清单捕获文本实例（logs 在案）：`"**入参形态（分派后——缝钉死）**：`（前置 `"`）；`"...". So reclaim remains…`（尾注记）；`the ask carve-out sentence: "…`（前注记）；`"（五档 + 新页）"`（包裹引号）。

**根因（勘定——题面既定「对照 HEAD 版而非工作树」经本设计轮证伪）**：

- 检查器 = `thincoder-core/advisor/citations.mjs`：**零 git 面**（import 仅 `node:fs`），`readFileSync` 读**工作树**；探针实读：**未提交（untracked）档**的引文可正常解析并命中。
- 真因 = 引文提取正则 `[^`\n]{4,}` 把**装饰**并入内容：评审员自然引风 = `file:line: "…引文…" — 注记`；捕获串含包裹引号 ∥ 前 ∥ 后注记 ⇒ `line.includes(content)` 字节包含判失败 ⇒ 误报 `content mismatch`。
- 实读探针（2026-10-05 · 本设计轮 · 直调 `verifyCitations`）：`docs/core/design/LEDGER.md:568: "**入参形态（分派后——缝钉死）**：…"` ⇒ **matched 0**（content mismatch）；去掉前置 `"` 同一引文 ⇒ **matched 1**；伪造引文 ⇒ mismatch（负控成立）。故「读 HEAD」命题既不可能（零 git 面）亦非修因；题面措辞收正 = U1。

**修形（逐字）**——命中判定扩为**候选集**（首个包含命中即中；仍为连续子串包含——零模糊匹配、零内容级归一）：

1. c1 = 原捕获内容（现行行为——零回归）；
2. c2 = 剥离外层装饰：反复剥「引号族（`"` ∥ `“”` ∥ `「」` ∥ `『』` ∥ `'`）＋ 空白」的先导 ∥ 尾随；
3. c3 = 首引号后段：内容含引号字符时，取其首个引号字符**之后**的余段（剥前注记）；
4. c4 = 首个成对引号段：内容内首组成对引号（`"…"` ∥ `“…”` ∥ `「…」`）的内层文本。

候选有效下限 = **2 字符**（空引号 ∥ 单字符垃圾形不成候选）；失败分类四类 ∥ 报告头行 ∥ 失败判定优先级（省略号先于 mismatch）∥ 路径围栏**全零改**。

**残余（有意保留 · 从严）**：引文**内层**格式漂移（如引文丢掉原文反引号）⇒ 仍判 mismatch（内容级不放宽——引文须逐字；登记 = U4）。

**受影响文件表（#928）**：

| 文件 | 现读 | 增量 | 说明 |
|---|---|---|---|
| `thincoder-core/advisor/citations.mjs` | 149 | ≈+15 | 候选集函数 + 判定点接线（<300 免拆） |
| `docs/core/design/ADVISOR-GUARDS.md` | .md 免行数 | §3 判据句收正 ＋ §10 A-AG16 尾句按现行口径收正 ＋ 新增 A-AG18 ＋ 变更记录一行 | 判据单源 |
| `docs/batches/2026-10-05-review-face-gaps.test.mjs` | 新 | 批内件（两缺口共用） | 批内单测 |

零触：`advisor/run.mjs`（调用面零改）∥ `appendCitationReport` 头行 ∥ 既有用例 `docs/batches/2026-10-03-advisor-convergence.test.mjs`（T5 头行断言不受触）。

**红绿对（先红后绿 · 红面已实跑坐实）**：

| 行 | 断言 | 现读（红 ✓ 实测） | 修后（预期） |
|---|---|---|---|
| R1 | `LEDGER.md:568` 包裹引号引文 | matched 0 · content mismatch | matched 1 |
| R2 | **未提交档**（本批档 `:11`）包裹引号引文 | matched 0 · content mismatch | matched 1 |
| R3 | 包裹引号 ＋ 尾注记复合形（按现读行构造） | matched 0 | matched 1 |
| G1 | 素引文（控制） | matched 1 | matched 1（零回归） |
| N1 | 伪造引文（负控） | matched 0 | **仍 0**（mismatch） |
| N2 | 省略号形 | 非连续引文类 | 同类（零改） |
| N3 | 不可读路径 | file unreadable | 同类（零改） |

**决策**：KD-1 ∥ KD-2。**上抛**：U1 ∥ U2 ∥ U4。

### 2.3 #945 · 机制勘定与修形（documents 域：锚祖先链候选底座）

**症状（实例在案）**：子仓锚发设计评审、`documents` 用**容器相对形**（`thincoder.com/docs/…`；V2 侧 `v2-vibe-coding/fde/…`）⇒ 拒 `scope-not-doc`；同形从容器锚通过。V2 报告 N-8 实证（`#291`）：容器锚 roots 29（含 fde ∥ domains ∥ methodology）✓ ∥ 子仓锚 roots 9（三面全无）✗。

**根因（勘定）**：`thincoder-core/agent-tools/review-facts.mjs:72-125` 四腿——①/② = 锚根集 ∥ 目标所属项目根集；**腿③ 候选底座 = `projectRootView(cwd)`（仅「锚最近项目 ∪ 其发现候选」——不含锚的祖先链）** ⇒ 容器相对形在子仓锚下无底座可试（`normAbs` 对锚拼出嵌套假路径）⇒ invalid。检查器**已**按「目标解析位最近 manifest」判定（腿②/③内 `ownRoots(cOwner)`）——缺的只是**底座集**。

- 实读探针（本设计轮 · 直调 `resolveReviewDocPaths`）：`(["thincoder.com/docs/requirements/PROJECT.md"], "…/thincoder.com")` ⇒ **invalid（attempted=[]）**；`(["thincoder/docs/core/design/LEDGER.md"], "…/thincoder")` ⇒ invalid；锚相对形同锚 ⇒ resolved（控制绿）。

**修形（逐字）**：腿③候选底座改为 **= 现行 `projectRootView(cwd)` 集 ＋ cwd 祖先链全量目录**（自父目录起至盘根、最近→远、去重、与现行集合并保序）：

```js
const ancestors = []
for (let d = dirname(resolve(cwd)); ; ) { ancestors.push(d); const p = dirname(d); if (p === d) break; d = p }
candidates = dedup([...current, ...ancestors])
```

受理判据（腿②/③内 = **目标解析位最近 manifest 的 docRoot 声明面**）∥ 围栏 ∥ 可读唯一化 ∥ fail-closed 歧义（`scope-doc-ambiguous`）**零改**；`candidates` 返回字段（拒文案候选提示同源）随并。

**项目侧半（非引擎 · 明列）**：目标最近 manifest 的**欠声明**仍拒（fail-closed 不减）——V2 侧「子仓 manifest 补三面」= 其自治面；本仓同族实例 = `docs/server/requirements` 未入 docRoot（见 U3）。

**受影响文件表（#945）**：

| 文件 | 现读 | 增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent-tools/review-facts.mjs` | 143 | ≈+8 | 腿③底座并集（<300 免拆） |
| `docs/core/design/MANIFEST.md` | .md 免行数 | §2.5「路径归一增量」族加第四笔段（≈+4 行）＋ 变更记录 | 机制主落点 |
| `docs/core/design/ENG-TOKEN-BINDING.md` §9 ∥ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §9 | .md 免行数 | 各 +1 行增量摘要（D2 指针一致） | 消费行 |
| `thincoder-core/tool-docs/advisor.md` | — | documents 描述行「cwd → 候选项目根」措辞补「＋ 锚祖先链」——**条件项**（实施轮实读该行后定） | 条件项 |
| 批内件（同上 test.mjs） | | | |

**红绿对（先红后绿 · 红面已实跑坐实）**：

| 行 | 断言 | 现读（红 ✓ 实测） | 修后（预期） |
|---|---|---|---|
| R4 | 子仓锚（thincoder.com）＋容器相对形 `thincoder.com/docs/requirements/PROJECT.md` | invalid（attempted=[]） | resolved → 该档绝对路 |
| R5 | 子仓锚（thincoder）＋ `thincoder/docs/core/design/LEDGER.md` | invalid | resolved |
| G2 | 锚相对形（控制） | resolved | resolved（零回归） |
| N4 | `nonsense/foo.md` | invalid | **仍 invalid** |
| N5 | 未声明面 `docs/server/requirements/…` | invalid | **仍 invalid**（声明面权威——fail-closed 不减） |

**决策**：KD-3。**上抛**：U3。

### 2.4 验收对照（三链同源）

| 台账 | §2 条目 | 判据（机检） | 命令 |
|---|---|---|---|
| #928 | 2.1-① | R1–R3 红→绿 ∧ G1 零回归 ∧ N1–N3 零放宽 | `node --test docs/batches/2026-10-05-review-face-gaps.test.mjs`（先红后绿两读留档） |
| #945 | 2.1-② | R4–R5 红→绿 ∧ G2 零回归 ∧ N4–N5 零放宽 | 同件 |
| 闸 | — | 入闸悬空 0 ⇒ `exit 0` | `node scripts/doc-check.mjs`（本设计轮读数 = §2 落笔后复跑；实施后复跑） |

### 2.5 关键决策记录

- **KD-1（#928 修形）** = 装饰剥离候选集（§2.2 逐字）。**否决**：① 改读 HEAD ∥ 双读并注——**题面前提证伪**（检查器零 git 面、实读工作树；未提交档引文探针可解析；「读 HEAD」既不可能亦非修因）；② 引文内层归一（内容级放宽——破证据面）；③ 仅改提示词（非机械约束，且提示词 = 主 agent 权域——降为伴生建议 U2）。
- **KD-2（#928 不扩面）**：省略号占位（`:NN: ...`）∥ file unreadable 两类不修（前者 = 现行省略号裁定的正确分类；后者 = 声明面/路径面另族）——登记观察 U4。
- **KD-3（#945 修形）** = 腿③底座并锚祖先链；受理判据零改（目标最近 manifest 声明面）。**否决**：① 以「祖先 manifest 声明面」代偿子仓沉默（破「子优于根」+ 无视声明面权威；子仓补声明 = 项目侧半，报告亦自认）；② 仅改错误文案（不除症）；③ 受理域放宽（语义越面）。
- **KD-4（拆派建议）**：**单舱**（两缺口同面 = 评审工具面；清单 ≈7 档 ≤15；与在飞 `advisor-loop-split`（`advisor/loop.mjs`）∥ `batch-closeout-sweep`（记录面）零文件重叠）。备选按模块拆两舱 = 否决（同面微改 ＋ 共一测试件——拆则共件双写风险）。

### 2.6 边界（本批不做）

- 评审轮次 ∥ 收敛 ∥ 凭证 ∥ 冻结窗语义零触；`REVIEW_ROOT_KEYS` 键集 ∥ 五键语义 ∥ `scope-not-doc` 判据本体 ∥ 拒文案措辞零改（#945 只动底座集）。
- 端面（CLI ∥ 桌面 ∥ VSC）零触；他批在飞面零触。
- 省略号 ∥ file unreadable 噪声类不修（KD-2）；提示词面零改（建议上抛 U2）；台账行文本修正 = 主 agent（U1）。

### 2.7 上抛项

- **U1（须裁 · 主 agent 笔）**：#928 题面 ∥ 台账行措辞收正——「对照 HEAD 版而非工作树」经勘定**不成立**（§2.2 证据链）；建议行文 = 「评审引文核验**装饰误报**：包裹引号 ∥ 行内注记致合法引文判 `content mismatch`（0/23 等实例在案）」；批档 §1 更正亦主 agent 笔。
- **U2（可选）**：提示词四面（round1 ∥ round2 ∥ round3 ∥ design）引文段伴生建议句「引文勿加包裹引号与行内注记」——内容权在主 agent。
- **U3（须裁）**：本仓 `docs/server/requirements` 面未入 `thincoder/PROJECT-MANIFEST.json` docRoot ⇒ 该面文档送审**现状即拒**（同族实例 · 探针实读 invalid）——补声明 ∥ 不补（该面不经评审）= 主 agent ∥ 用户裁。
- **U4（登记）**：残余噪声两类（省略号占位 ∥ file unreadable 族）——如判须修 = 另裁。

### 2.8 评审轮次 1 修正（fix 轮 · 2026-10-05）

**六项全采纳（发现原文 = §3 轮次 1 表；父裁）——机制语义零改（仅登记 ∥ 验收 ∥ 描述面）。** 逐号终值（①–⑥）；本块 = §2.2 ∥ §2.3 受影响文件表与 §2.4 验收表的增量终值（旧行照存，凡有出入以本块为准）。

**①（评审 #1 🟡 · API-CONTRACT 登记）——选定：钉死档尾追加保零漂（零触）**

- 插入点钉死：两档新增量全落**档尾**（`citations.mjs` `:149` 后 ∥ `review-facts.mjs` `:143` 后）；现场接线**就地等行**（净零行漂——既有登记行之前零净增）：
  - `citations.mjs:82` 判定点单行 1:1 改接线：`if (line.includes(citation.content)) {` → `if (citationCandidates(citation.content).some((c) => line.includes(c))) {`；`citationCandidates`（装饰候选集，≈+15 全量）落档尾。
  - `review-facts.mjs:76` 单行 1:1 改调：`const candidates = view.state === "ok" ? … : []` → `const candidates = candidateRoots(view, cwd ?? process.cwd())`；`:12` import 行 1:1（增 `dirname`）；`:61-66` 腿③注释就地等行改述；`candidateRoots`（底座并集，≈+8 全量）落档尾。
- §2.2 ∥ §2.3 修形语义照存——仅落点/形制按本条钉死。
- 零漂结论（**零收正**）：登记全坐落——`citations.mjs` `:29`/`:108`/`:127` ∥ `review-facts.mjs` `:17`/`:23`/`:32`/`:38`/`:72`/`:130`/`:139`（API-CONTRACT.md `:417-419` ∥ `:632-638` 行组）。实现后复核实读；若实漂（偏离钉死形）⇒ 按实插点回填坐标。
- 受影响文件表补行 ×2（原表旧行照存）：

```
| docs/core/design/API-CONTRACT.md | :417-419 行组 | 零触 | 插入钉档尾保零漂（citationCandidates 落档尾、判定点就地等行）——登记零漂、零收正；实现后复核（2.8-①） |
| docs/core/design/API-CONTRACT.md | :632-638 行组 | 零触 | 插入钉档尾保零漂（candidateRoots 落档尾、接线就地等行）——登记零漂、零收正；实现后复核（2.8-①） |
```

（上行 1 = `#928` 表补行；上行 2 = `#945` 表补行。）

**②（评审 #2 🟡 · 验收回归腿）——验收表补行**

```
| #945 回归 | 2.1-② | 既有直测件复跑绿——断言面 = :64 `attempted, []` ∥ :88 `attempted.length, 2` ∥ :100 拒文案「(candidates: …」句；并注：冻结窗消费面 `advisor-async.mjs:399`（该件 E4 探针 :106-127 覆盖） | `node --test docs/batches/2026-10-04-tool-path-baseline.test.mjs`（仓根；内含 light-round-7 ∥ manifest-resolution-fix 复跑腿 :140-148） |
```

**③（评审 #3 🟡 · R2 换锚）——选定：换锚（不依赖 U1 时序）**

- R2 夹具锚 `:11`（U1 待收正面）→ **`:46`**；子串 = `候选有效下限 = **2 字符**`（§2 本笔定稿面——§1 措辞收正零波及；实施轮钉夹具时实读核行号，子串恒定）。
- R2 行终值：

```
| R2 | **未提交档**（本批档 :46——子串锚「候选有效下限 = **2 字符**」）包裹引号引文 | matched 0 · content mismatch | matched 1 |
```

**④（评审 #4 🔵 · 交互明示）＋新形控**

- 交互（明示）：候选集命中**先于**省略号分类——逐根 × 逐候选（c1–c4）任一包含命中即 matched 短路；省略号分类（`citations.mjs:90`）仅在全部候选未中后到达（全省略占位形 ∥ file unreadable 类 = 零变）。
- ⇒ 「引号外语义省略」形（引号内连续逐字 ∥ 省略号仅引号外注记）由「非连续引文类」转 matched（语义更正——所引引号内文逐字在行）；「引号内省略」形（缩略本体重）全候选未中 ⇒ 仍「非连续引文类」（N2 零变）。
- 红绿表补行（#928 表）：

```
| R6 | 引号外语义省略形（引号内逐字 ＋ 引号外注记带省略号） | matched 0 · 非连续引文类（推定——实施轮先红实跑坐实） | matched 1 |
```

**⑤（评审 #5 🔵 · 可见后果明示）**

- 拒文案数据面 `candidates` 随并 = 解析底座集（现行集在前 ∥ 祖先链随尾）；提示句 `(candidates: …)` 仍称候选项目根且 `slice(0,5)`（`advisor.mjs:137-140`）——明示可见后果：
  - ① `state=none`（无 manifest 面）：提示列表 = 纯祖先目录——首项 = cwd 父目录；示例 `(e.g. <首项>/docs/…)` 可指向非项目面（修前该态无候选列表——新增噪声面）；深嵌套时 cap-5 窗口被近层祖先占满 ⇒ 更深的真项目根被挤出窗口。
  - ② `state=ok/ambiguous`：现行候选居前（cap 先切祖先尾段）——真候选不被祖先挤出窗口；尾段混入非项目根目录。
- 措辞模板零改（分列措辞候选 = 不采——本批边界维持）。

**⑥（评审 #6 🔵 · 收正句逐句点名）**

- §2.2 受影响表 `docs/core/design/ADVISOR-GUARDS.md` 行「§3 判据句收正」逐句点名：`ADVISOR-GUARDS.md:128`「零新增匹配路径」∥ `:146`「零新增假命中」——实施轮逐句按现行口径收正（单源档与新行为相斥句零残留）。

**本修正轮边界**：机制语义零改；产品码零触；他档零写（`ADVISOR-GUARDS.md` 等 = 实施轮再触）；他批在飞面（`advisor-loop-split` ∥ `batch-closeout-sweep`）零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围** = 仅本批档 §2（设计面）；评审上下文未声明文档地图 ∥ 无项目标准档 ⇒ Document-ownership 判据降级（按磁盘实读的归属面抽查替代）。**磁盘核验在案**（证据面）：`thincoder-core/advisor/citations.mjs` 现读 149 行（与 :54 的 149 相符——正则 :22 ∥ 判定点 :82 ∥ 零 git 面 :13-14 成立）；`thincoder-core/agent-tools/review-facts.mjs` 现读 143 行（与 :98 的 143 相符——`REVIEW_ROOT_KEYS` :32 ∥ 四腿 :72-125 ∥ 腿③候选 :76 成立）；`LEDGER.md:568` 行首逐字 `**入参形态（分派后——缝钉死）**：` 成立（R1 夹具红面成立）；ADVISOR-GUARDS.md §3=:114 ∥ §10=:363（A-AG16=:382，A-AG18 为下一个未用号）∥ MANIFEST.md §2.5=:295（「路径归一增量」族=:307-311，第三笔在案 ⇒ 第四笔自洽）∥ ENG-TOKEN-BINDING.md:248 ∥ DESIGN-TOKEN-SETTLEMENT.md:150 ∥ tool-docs/advisor.md:1（「session cwd first, then candidate project roots」在案——条件项成立）——修订落点与归属面均成立。**不可核（超范围）**：台账 #928/#945 原文（本仓未定位到）· V2 报告 N-8/#291 根集计数（:76）· 失效清单 logs（:31）——均按设计陈述采信，标 unverified。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state / 受影响文件表（判据 8） | 🟡 | 两处改动都在「带行号坐标登记」的档内插行，而两张受影响文件表（:54 ∥ :98）均未列 `docs/core/design/API-CONTRACT.md`：现行登记 `verifyCitations`→`citations.mjs:108` ∥ `appendCitationReport`→`:127`（API-CONTRACT.md:418-419——实读与磁盘逐字相符）、`scopeAdvisorMirror`→`review-facts.mjs:130`（:637）∥ `noteReviewDelivered`→`:139`（:638）。`≈+15`（:54）/`≈+8`（:98）行插入若落在这些行之前（自然落点如是），坐标为漂且本批无收正项——先例 = `docs/batches/2026-10-04-tool-path-baseline.md:160`「+3 新行 + 坐标回填」在案 | 受影响文件表补 `docs/core/design/API-CONTRACT.md` 一行（按实插点给坐标收正值），或把插入点钉死为档尾追加以保既有坐标零漂 |
| 2 | Acceptance / 回归面（判据 5） | 🟡 | #945 验收只跑新批内件（:121「同件」），而 `resolveReviewDocPaths` 的既有直测件 `docs/batches/2026-10-04-tool-path-baseline.test.mjs` 既未列回归腿也未列零触——其断言直面本改动：:64 `assert.deepEqual(r2.invalid[0].attempted, [])` ∥ :88 `attempted.length, 2` ∥ :100 `(candidates: ` 拒文案；消费面另有冻结窗 `advisor-async.mjs:399`（`resolveReviewDocPaths(documents, parent.cwd).resolved.values()`）。两侧不对称：#928 侧 :58 明列了既有用例 | 验收表补「既有直测件复跑绿」一行并点明断言面（可并加冻结窗 `docAbs` 消费面一条） |
| 3 | Acceptance / coordination（R5） | 🟡 | R2 夹具钉在本批档 `:11`（:65），而 `:11` 正是 U1（:139「台账行措辞收正」，原文含 `对照 HEAD 版而非工作树`）待收正的来源行——该行一经改写，R2 所引连续子串可能失配，红→绿不可达 | R2 夹具改用不受 §1 措辞收正波及的锚线/子串，或先固定改动次序（§1 收正定稿后再钉夹具） |
| 4 | Acceptance / 边界交互（判据 5） | 🔵 | 候选集命中会短路在省略号分类之前（`citations.mjs:90` 的分类仅在全部候选未中后到达）：引号外语义省略形（如 `... "逐字段"` 尾注记带 `…`）将由「非连续引文」变为 matched；:46 只声明 `失败判定优先级（省略号先于 mismatch）` 零改，N2（:69 `省略号形`）只覆盖纯省略号形——该交互无覆盖 | 在设计里明示该交互（候选集命中先行、省略号分类仅在其后），并给该形补一个负控/正控 |
| 5 | Clarity / 可见后果（判据 4） | 🔵 | :90「`candidates` 返回字段（拒文案候选提示同源）随并」与 :133 `拒文案措辞零改` 并存：模板不变但其数据面把「解析底座祖先」混入「候选项目根」，且提示位 `candidates.slice(0, 5)`（advisor.mjs:137-140）会把真项目根挤出（state=none 时首项退化为父目录，提示句仍写「pass project-root-relative」） | 把祖先底座与项目根在拒文案中分列，或在设计中明示提示面数据随并的可见后果 |
| 6 | Document ownership / clarity（判据 7） | 🔵 | :55 只写 `§3 判据句收正`，而 §3 至少两句承载与新行为相斥的断言：ADVISOR-GUARDS.md:128 `零新增匹配路径` ∥ :146 `零新增假命中`——半收正会在机制单源档内留下与实现相斥的判据句 | 受影响表把待收正句逐句点名（§3 内 `零新增匹配路径` ∥ `零新增假命中` 两句） |

**计数**：🔴 0 · 🟡 3 · 🔵 3（🔴 面 = 无：两缺口机制勘定经磁盘复核成立，修形可实现、判据面零放宽，采纳性红绿对与负控齐全）。

VERDICT: pass

## §4 用户批准（主 agent）

**代签 · 2026-10-05**（自动跑授权在效）

- 评审轮 1 = **pass**（0🔴 · 3🟡 + 3🔵；父裁 = 六项全采纳）→ 修正轮 `#10` 落定（§2.8 · 修后为准）→ **批准实施**（eng-coder 单舱双缺口；设计令牌持）。
- U1 题面/台账措辞收正 = 已落（§1.2 勘正 + 台账 `#928` 证据行——父侧笔，可 revert）。
- 实施面 = 设计终值 §2.2 ∥ §2.3 ∥ §2.8（①–⑥）；验收 = §2.4 + §2.8②（既有回归腿）＋ §2.8①（登记零漂/fallback）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（两缺口先红后绿落地 ∥ fix 轮收正 ∥ 审计零分歧 ∥ advisor 轮 2 = pass——明细见 5.1–5.7）



### 5.1 交付摘要

两缺口按设计终值（§2.2 ∥ §2.3 ∥ §2.8 ①–⑥）落地——先红后绿；内部分歧审计零分歧；内部代码评审轮 1 = changes-required（1🔴+2🟡+4🔵）→ fix 轮 → 轮 2 = pass（收敛）。

**机制**：#928 = 引文命中判定扩为「装饰剥离候选集」（c1 原捕获 ∥ c2 反复剥引号族+空白先导/尾随 ∥ c3 首引号字符后段 ∥ c4 首成对引号段内层文本；派生候选下限 2 字符；零模糊、零内容级归一；候选命中先于省略号分类）；#945 = 腿③候选底座并入 cwd 祖先链全量目录（自父目录起至盘根、最近→远、去重、现行集在前）。

### 5.2 写入面（file:line → Δ）

| 文件 | Δ |
|---|---|
| `thincoder-core/advisor/citations.mjs` | :82 判定点单行 1:1（→ `citationCandidates(...).some(...)`）；档尾 :151-175 新增 `citationCandidates`；头注 :10-11 就地 1:1 收正（fix 轮——旧判据句 → 候选集口径，「零新增假命中」删除）。149 ⇒ 175 行 |
| `thincoder-core/agent-tools/review-facts.mjs` | :12 import 增 `dirname`；:61-66 腿③注释等行改述；:76 改调 `candidateRoots(view, cwd ?? process.cwd())`；档尾 :144-158 新增 `candidateRoots`。143 ⇒ 158 行 |
| `docs/batches/2026-10-05-review-face-gaps.test.mjs` | 新增批内件（13 用例：R1–R6 ∥ G1–G2 ∥ N1–N5） |
| `docs/core/design/ADVISOR-GUARDS.md` | §3 :123/:126/:127/:128/:146 判据句收正；§10 A-AG16 尾句收正 + 新增 A-AG18（:384）；:127 残词「两表描」→「两表述」（fix 轮）；变更记录 :411 |
| `docs/core/design/MANIFEST.md` | §2.5 第四笔 :309；变更记录 :719 |
| `docs/core/design/ENG-TOKEN-BINDING.md` | §9 :250 +1 行 |
| `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | §9 F3 :150 +1 段 |
| `thincoder-core/tool-docs/advisor.md` | :1 条件项（documents 描述行补祖先链句；「resolve against the session cwd first, then candidate project roots」逐字保留） |

### 5.3 红绿两读（§2.4 + §2.8）

- **红（实施前 · 实跑）**：R1/R2/R3/R6 = matched 0（R1/R3/R2 = content mismatch @ 目标档；R6 = 非连续引文类——§2.8④「推定红」实跑坐实）；R4/R5 = invalid（attempted=[]）。批内件：7 pass / 6 fail。
- **绿（实施后 · 实跑）**：13/13 pass（R1–R6 matched/resolved；G ⊗ N 零回归）；fix 轮后复跑仍 13/13。

### 5.4 门读数

| 门 | 命令 | 读数 |
|---|---|---|
| 批内件 | `node --test docs/batches/2026-10-05-review-face-gaps.test.mjs` | 13/13 pass |
| 既有直测件 | `node --test docs/batches/2026-10-04-tool-path-baseline.test.mjs` | 8/8 pass（含 AC-4-grep：基面声明句在改后文件仍逐字在位） |
| 既有同面件（对称腿） | `node --test docs/batches/2026-10-03-advisor-convergence.test.mjs` | 13/13 pass（T1–T6 引文面 + T7–T13） |
| 机检 | `node scripts/doc-check.mjs` | exit 0（锚 0 悬空 ∥ 行宽 OK） |
| 契约登记 | `node scripts/api-contract.mjs --check` | OK 零漂移（2912 条 · 641 档；两新函数均档内私有；登记坐标 :29/:108/:127 ∥ :17/:23/:32/:38/:72/:130/:139 未动） |
| 行位守限 | 实读 | citations.mjs 175 行 ∥ review-facts.mjs 158 行（均 < 300 免拆） |

### 5.5 决策透明表（实施轮裁量/解释）

| # | 事项 | 处置 | 依据/理由 |
|---|---|---|---|
| 1 | c1 是否受「候选下限 2 字符」约束 | c1 **不设下限**（无条件入集） | §2.2「c1 = 原捕获（现行行为——零回归）」；下限句括注（空引号 ∥ 单字符垃圾）指派生候选 |
| 2 | c3 余段 trim | `slice(qi+1).trim()`（显式收窄） | 剥前注记后余段边缘空白容差；红绿用例不受影响（审计轮判非分歧，记录在案） |
| 3 | c4 成对引号枚举 | `"…"` ∥ `“…”` ∥ `「…」` 三对（『』 ∥ `'…'` 不入 c4） | §2.2 第 4 条逐字枚举；『』族照由 c2 剥 |
| 4 | tool-docs/advisor.md 条件项 | **改**（documents 描述行补祖先链句；压制句逐字保留） | §2.3 表条件项 + 设计评审「条件项成立」；AC-4-grep 断言面不受触（实跑核） |
| 5 | §3 收正范围 | :123/:126/:127/:128/:146 五句（超出 §2.8⑥ 点名的 :128/:146） | 以「单源档与新行为相斥句零残留」为准（:123 判据句 ∥ :126 类定义 ∥ :127 优先级句同属） |
| 6 | fix 轮：🔴 citations.mjs 头注旧判据句 | 就地 1:1 收正（行数不变、坐标零漂） | 机制级描述不一致（两处相斥）；登记坐标全在 :11 之后 |
| 7 | 复合引号省略形（`"frag1" … "frag2"` 经 c4 命中 ⇒ matched） | **不改码**（设计一致行为）；登记在此 + 报告 | §2.8④ 二元（引号内省略 ⇒ 非连续）未覆盖该混合形；收紧属另裁 |
| 8 | DESIGN-TOKEN-SETTLEMENT.md:150 既有「write-gate 再出口」子句 | **未动**（父侧另裁） | 非本批增量；现盘 write-gate 仅再出口 REVIEW_ROOT_KEYS ∥ resolveReviewRootsFor |

### 5.6 边界零触确认

`advisor/run.mjs`（调用面）· `appendCitationReport` 头行 · `REVIEW_ROOT_KEYS` 键集与五键语义 · 拒文案模板 · 提示词四面（U2 另裁）∥ 端面（CLI/桌面/VSC）∥ 他批在飞面（advisor-loop-split ∥ batch-closeout-sweep）——均零触。git status 写面 = 本批 8 档（7 改 1 新）；`CORE-UNIFICATION.md` 及另两份批档 = 他批在飞面，零触。

### 5.7 审计与评审轮次与终态

- **内部分歧审计（explore）**：零分歧（无部分实现 ∥ 无静默简化 ∥ 无文档漂移 ∥ 无越面）；披露项 = 本段当时未落（本段即其落笔）。
- **内部代码评审（advisor）轮 1**：changes-required（1🔴 头注旧判据句 ∥ 2🟡 ∥ 4🔵）→ fix 轮（头注收正 ∥ 残词修 ∥ 复跑记录 ∥ 登记）→ **轮 2：pass**（轮 2 时点 §5 未落 ⇒ 记录面 4 项标 Unfixed-非阻断；本段落笔即兑现——as-built 行数 ∥ 红绿读数 ∥ 复合引号省略形登记 ∥ R4 夹具登记，见 5.2–5.5）。
- fix 轮数：1；**终态 = 收敛（clean）**。

## §6 验证与收口（父代理）

**2026-10-05 22:2x · 收口**

**① 交付验证**：实施（`#12`）两缺口 + 文档面八处——**父侧亲跑**：批内件三件 **34/34**（本批件 13/13 ∥ `2026-10-04-tool-path-baseline.test.mjs` 8/8 ∥ `2026-10-03-advisor-convergence.test.mjs` 13/13，exit 0）∥ `doc-check` **exit 0**（悬空 0 ∥ 行宽 0）∥ `api-contract --check` = **骨架零漂移（2912 条 · 641 档）**；实读抽核 = `citations.mjs:151-175`（`citationCandidates` c1–c4 ∥ 下限 2 字符 ∥ c1 无下限）∥ `review-facts.mjs:144-158`（`candidateRoots` 现行集 ∪ 祖先链 ∥ 去重 ∥ 现行在前）与设计终值逐条相符。

| 面 | 终值 | 核验读数 |
|---|---|---|
| 批内件 | `docs/batches/2026-10-05-review-face-gaps.test.mjs`（R1–R6 ∥ G1–G2 ∥ N1–N5） | 先红 7 pass/6 fail → **绿 13/13**；父侧亲跑 ✓ |
| 既有件 | tool-path-baseline 8/8 ∥ advisor-convergence 13/13 | 父侧亲跑 ✓（复跑绿） |
| 门 | doc-check exit 0 ∥ api-contract 零漂 ∥ `node --check` 全 OK ∥ 行位守限（175 ∥ 158 < 300） | 父侧亲跑 ✓ |
| 内部链 | 审计零分歧 ∥ 评审轮 1 changes-required（1🔴）→ fix → 轮 2 pass | `#12` 面 |

**② 集成场景**：零涉（评审工具面 = 内部机制；无用户可见面）。
**③ 仓套件读数**：三端跑器（cli ∥ desktop ∥ vscode）空清单绿灯 ×3（父侧亲跑 exit 0）。
**④ 收口清单核验**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（两 .mjs + 批内件 + 四档设计档 + tool-docs + `API-CONTRACT.md`）∥ 指针（§2.2/§2.3/§2.8 ∥ 设计档 §3/§2.5/§9）✓ ∥ 变更记录（ADVISOR-GUARDS ∥ MANIFEST ∥ ENG-TOKEN ∥ DESIGN-TOKEN 各自）✓ ∥ 待办勾销 = `#928` ∥ `#945` ∥ 前批遗留跨核 = 无 ∥ 台账面 = 核销行。
**⑤ 暂缓批复核**：无（残余各自在册：复合引号省略混合形（§5.5#7）∥ U2 提示词伴生句 ∥ U3 `docs/server/requirements` 声明面）。
**⑥ 债务与备忘**：① 复合引号省略混合形 = 登记（§5.5#7——收紧与否另裁）；② `DESIGN-TOKEN-SETTLEMENT.md:150` 既有「write-gate 再出口」子句与现盘不符（非本批增量；同族 `MANIFEST.md:308` ∥ `ENG-TOKEN-BINDING.md:248`）= **新账入册**；③ 宿主进程运行时脚注按旧判据报失配 = 模块缓存（重启拾新——观察项）；④ as-built 行数 +26/+15 超预估在册（无档位后果）。
**⑦ 收口判定**：验收全符（34/34 ∥ 门全绿 ∥ 零漂）⇒ 本批**收口**（记录冻结）。
