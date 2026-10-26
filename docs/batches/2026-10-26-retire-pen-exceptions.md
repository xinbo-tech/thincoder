# 2026-10-26 · 撤掉父侧直笔三条例外
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-26 · 来源 = 用户 2026-10-26 00:44「这句话听上去感觉是小修改自己搞还留着？」+ 00:45「我觉得空转何必留着？」。
> 台账 = #1800（ENGINEERING-MODE · 归批）。前情 = 2026-10-26-parent-write-scope.md（已收口 2026-10-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**用户口径（逐字）**

> 这句话听上去感觉是小修改自己搞还留着？（2026-10-26 00:44）

> 我觉得空转何必留着？（2026-10-26 00:45）

**问题：这条已经不是「需要修」而是「空转」**

上一批（`2026-10-26-parent-write-scope`）给三条例外补了面界：②③ 只在父侧自有写域内成立，设计档面 ∥ 需求档面 ∥ 提示词面一律不落 ②③ 笔。补完之后回看，三条例外本身成了空结构：

| # | 现文 | 实际状态 |
|---|---|---|
| **①** | `your own write domain (batch record §1/§4/§6 · ledger · requirement docs)` | **不是例外**——这是**事实陈述**：批档 §1/§4/§6、台账、需求档本来就归主 agent 写。写进「例外」列表里，反而把「本来归你」说成了「特许你」。 |
| **②** | `purely mechanical form corrections (line folding / pointer form / counts)` | **在 ① 内无事可做**——自有写域内本来就不会派单给 eng-designer，省一轮的动作没有对象。 |
| **③** | `small edits (single-line / table-level · no new semantics · verifiable one by one)` | 同上。且③ 就是 2026-09-16 那句「小修改以后你自己搞」被安错位置后的残骸——**那句话讲的是轻通道**，不是父侧直笔授权。 |

⇒ ②③ 在自有写域内是空转；① 被误列为例外，制造了「自有写域也要特许」的错觉。**整条应当撤掉，而不是继续修。**

**现文坐标（2026-10-26 00:45 实读）**

| 位置 | 现文 |
|---|---|
| `thincoder-core/prompts/persona-engineering.md:164` | `- **Three exception categories**: ① your own write domain (...) ② purely mechanical form corrections (...) ③ small edits (...)` |
| 同档 `:165` | `**Face boundary**: ② and ③ hold inside your own write domain only — ... take no ②/③ pen, whatever the size ...` |
| 同档 `:167` | `**All three must be marked** ("parent direct execution" + revertable). **Judgment lines**: ... mechanical form correction unmarked ⇒ violation.` |

全域仅此三处（`thincoder-core/prompts/**` grep `exception categor` ∥ `mechanical form` ∥ `own write domain` 命中集 = 这 3 行）。

**本批要做的**

1. **删三条例外整条**（`:164`）——不是改写、不是加限定。
2. **删面界句**（`:165`）——它是为 ②③ 划界而生的，②③ 没了，它没有对象。
3. **删「All three must be marked」**（`:167` 首句）——「三条」不存在了。同行的 `Judgment lines` 两句是**独立判据**（越面写作 ∥ 打标缺失），须逐句核其是否仍成立：前者（`you content-writing on a dispatched surface without a fix round ⇒ violation`）语义独立、保留；后者（`mechanical form correction unmarked ⇒ violation`）挂在 ② 上，随 ② 一并处置。
4. **保留事实陈述**：批档 §1/§4/§6、台账、需求档归主 agent 写——但作为**写权矩阵的归属陈述**存在（落点 `docs/core/design/DOC-DISCIPLINE.md` §1 D1 行已有），不复活成「例外」。
5. **连带核对**：`thincoder-core/prompts/discipline-engineering.md:42`/`:48` 的**工程工具面直改**两条硬约束（`scripts/**` · `test/**` · `.thincoder/tmp/**` · CI）——那是**另一面**（不经设计/评审的机械改），与本条无关，须确认零触碰。

**不做的**：不动 `docs/core/design/DOC-DISCIPLINE.md` §1 的 D1 细则块（它记的是「谁写哪一面」，是本批删除后**唯一**的写权表述）· 不动轻通道准入面 · 不动工程工具面两条 · 不改任何代码。

**流程**：设计（设计席）→ 评审 → 批准 → eng-coder 落提示词面（提示词 = 产品代码面，唯一作者 = eng-coder）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-10-26（现行态 = §十三（E2–E4 已落 · E1 待 eng-coder · E5 待父侧；评审 14 项已处置））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 一、本批条目（覆盖 / 不覆盖）

| # | 条目 | 面 | 本批 |
|---|---|---|---|
| E1 | 提示词面撤掉三条例外的整条装置：`thincoder-core/prompts/persona-engineering.md:164-168` 五行（三条例外 ∥ 面界 ∥ 归属-旁路 ∥ 打标+判据 ∥ 面界判据）——删四行、改写一行 | 产品代码面（eng-coder 落） | ✅ 覆盖 |
| E2 | 设计档 D1 行改纯归属句 + D1 细则块整块退场（`docs/core/design/DOC-DISCIPLINE.md:18` ∥ `:28-42`） | 设计档面（本席） | ⏸ 待裁（§八 ①） |
| E3 | 兄弟档咬合行收正：`docs/core/design/LIGHT-CHANNEL.md:366`（去「三类例外」框法与面界指针） | 设计档面（本席） | ⏸ 随 E2 |
| E4 | 兄弟档交界句收正：`docs/core/design/PROMPT-SYSTEM.md:259`（去三条例外裸名与 `Three exception categories` 死指针，改落笔面陈述） | 设计档面（本席） | ⏸ 随 E2 |
| E5 | 需求档两处：D1 行（`:608`）+「父侧不代笔」句（`:690`，兼收其与本档 `:608` 的互斥） | 需求档面（主 agent） | ✅ 覆盖·非本席写域 |
| N | 不动：轻通道准入面 · 工程工具面两条硬约束 · 归档档 · `docs/core/design/DOC-DISCIPLINE.md:1820` 的同名「三条例外」· 任何代码 | — | 边界（§九） |

### 二、设计落点与机制（撤掉之后）

**落点 = 就地删改，零新档。** 写权矩阵的权威位置 = `docs/core/design/DOC-DISCIPLINE.md` §1 的 D1 行；本批不新建任何文档（新建 = 同一机制两处，随触即漂）。

- **父侧的落笔面 = 事实陈述，不是例外**：批次档 §1/§4/§6 · 台账 · 需求档；需求档落笔前提 = 需求确认门。它落 D1 行的归属半句里（§一 E5 同口径），不单列成「特许」。
- **其余两面**：设计档 = eng-designer、提示词面 = eng-coder（产品代码面）——各自唯一作者，走全链（设计 → 评审 → 批准 → 落笔）。
- **这两面没有第二条落笔通道**，不看改动大小、不看形态。写进 D1 行时用正面陈述（「其余面 = 各自唯一作者的全链」），不写「没有小修旁路」：否定式会把已撤掉的东西重新带回检索面（D8 污染判据）。

**为什么（依据）**：用户 2026-10-26 00:44 逐字「这句话听上去感觉是小修改自己搞还留着？」+ 00:45「我觉得空转何必留着？」。

实证 = 上一批补完面界后回看：②③ 在自有写域内没有可执行对象（自有写域内本来就不会派单给 eng-designer）；① 本是归属事实，被写进「例外」列表后反而成了「特许」。

### 三、逐字落笔块（E1 · 唯一实施文本）

落点 `thincoder-core/prompts/persona-engineering.md`，现 `:164`–`:168`。

- **删**：`:164`（`**Three exception categories**` 行）· `:165`（`**Face boundary**` 行）· `:166`（`① states ownership…` 行）· `:168`（`**Face-boundary judgment line**` 行）。
- **改写**：`:167` 整行替换为下面一行——保留首判据句，去掉打标句与挂在 ② 上的第二判据句。
- **净**：463 行 → 459 行（删四行、一行改写）。

```text
  **Judgment line**: you content-writing on a dispatched surface without a fix round ⇒ violation.
```

**逐行理由**：

- `:166` / `:168` 不在 §1 的三处坐标里——那三处是用 `exception categor` ∥ `mechanical form` ∥ `own write domain` 三个词 grep 出来的，这两行用 ①/②③ 符号，grep 抓不到；但它们是上一批为 ②③ 生的装置，随 ②③ 一并走（§八 ②）。
- `:167` 首判据句挂 `:163` 的 `Parent does not ghost-write`，语义独立，保留。
- `:167` 的打标句（`parent direct execution` + revertable）不随删除丢失义务——工程工具面的同一义务住 `thincoder-core/prompts/discipline-engineering.md:42`（本批零触），轻通道的打标由 `docs/core/design/LIGHT-CHANNEL.md:366` 的选择题 + §1 逐笔收录承担。

### 四、逐字落笔块（E2–E4 · 设计档面 · 待裁后由本席落）

> 本块已由 §十二.2 与 §十三 取代——落笔以 §十三 为准（E2–E4 已落，落成文本以设计档现盘为准）。

**E2 · D1 行（`docs/core/design/DOC-DISCIPLINE.md:18`）整行替换**：

```text
| D1 | 写权矩阵 | 文档类 → 唯一作者（批次档 = 主 agent；需求档（项目需求 + 功能规格）= 主 agent；设计档（架构设计 + 模块设计）= eng-designer；提示词 = **产品代码面** ⇒ 唯一作者 = **eng-coder**（内容依据 = 机制文档））——无机械门，靠角色契约与评审核验。**父侧的落笔面 = 批次档 §1/§4/§6 · 台账 · 需求档**（需求档落笔前提 = 需求确认门）；**其余面 = 各自唯一作者的全链**（设计 → 评审 → 批准 → 落笔），不看改动大小、不看形态 |
```

**E2 · D1 细则块（`:28-42`，标题行 + 7 bullet，共 15 行）整块删除**。内容去向（D2）：

- `:42` 落点分工 = D1 行的唯一作者半句重复；
- `:40` 归档面 = `§4.6 边界`「不动 `_archive/`」条（`docs/core/design/DOC-DISCIPLINE.md:1995`）已载；
- 其余五条（`:30` `:32` `:34` `:36` `:38`）以 ②③ 为对象，随其退场。

**E3 · `docs/core/design/LIGHT-CHANNEL.md:366` 整行替换**：

```text
| 「父侧不代笔」（轻通道笔的执行形态） | **不改写**——轻通道笔 = 父侧直改，由本档机制块承载（条件 = 三样清单 + 一句边界 + 路由选择题与用户选定 + 走查/读数 + 收尾全链闭合）；**打标义务即满足**——选择题 A 项「回退 = 可 revert」+ 轮次记录 §1「父侧笔」逐笔收录（「父侧直接执行」随逐笔选择题与选定、§1 留痕明示，不另加注） |
```

**E4 · `docs/core/design/PROMPT-SYSTEM.md:259` 末句替换**（该行其余边界句零改）：

```text
**「父侧不代笔」交界**：「当场修掉」只作用于父侧的落笔面（批次档 §1/§4/§6 · 台账 · 需求档），其余面派全链（`docs/core/design/DOC-DISCIPLINE.md` §1 D1 行）。
```

### 五、逐字落笔块（E5 · 需求档面 · 主 agent 笔）

> 本块已由 §十二.2 与 §十三 取代——落笔以 §十三 为准（E5 待父侧落，逐字文本 = §十三.3）。

**`:608` D1 行整行替换**：

```text
| D1 | **写权矩阵** | 文档类唯一作者：批次档 = 主 agent · **需求档（项目需求 + 功能规格）= 主 agent** · **设计档（架构设计 + 模块设计）= eng-designer** · 提示词 = **产品代码面** ⇒ 唯一作者 = eng-coder（内容依据 = 机制文档）；**父侧的落笔面 = 批次档 §1/§4/§6 · 台账 · 需求档**（需求档落笔前提 = 需求确认门），**其余面 = 各自唯一作者的全链**（设计 → 评审 → 批准 → 落笔），不看改动大小、不看形态（机制面 = `docs/core/design/DOC-DISCIPLINE.md` §1 D1 行） |
```

**`:690` 整行替换**（兼收该句与本档 `:608` 的互斥，§八 ③）：

```text
- **父侧不代笔**：设计档落笔一律派修正轮给 eng-designer；需求档归父侧，落笔前提 = 需求确认门。
```

### 六、受影响文件与测试覆盖

| 文件 | 面 · 笔 | 当前行数 | 预计增量 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 产品代码面 · eng-coder（E1） | 463 | −4 → 459 |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档面 · 本席（E2） | 2493 | −14 量级（块 15 行删；D1 行同行换） |
| `docs/core/design/LIGHT-CHANNEL.md` | 设计档面 · 本席（E3） | 474 | ±0 |
| `docs/core/design/PROMPT-SYSTEM.md` | 设计档面 · 本席（E4） | 4410 | ±0 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 需求档面 · 主 agent（E5） | 1137 | ±0 |

**行数读数口径**：`read` 的行号计数（末行计一行，本席逐档实读，2026-10-26 本轮）。验收不判行数——数字只作实施席定位用，不列为验收条。

**测试覆盖**：本批是文本面（提示词正文 + 三档文档），无可跑单元；**零新增测试文件**——不引入「按批新建、用后即删」的空壳。改面判据 = §七 的文本读数 + 交付门。

### 七、验收对照（机器可验，逐条回指 §一）

命令一律 cwd = 仓根、ASCII 安全（中文串用 `\u` 转义，避 `findstr` 编码坑）。

| # | 判据 | 命令 |
|---|---|---|
| AC-1 | E1：提示词档八串零命中 ∪ 首判据句恰 1 ∪ 逐行 ≤300 | 见下 AC-1 码块 |
| AC-2 | E2：D1 行不含「三条例外 ∥ 面界 ∥ ② ∥ ③」∪ `D1 细则` 全档命中 0 ∪ D1 行含「唯一作者」 | 见下 AC-2 码块 |
| AC-3 | E3：轻通道档「三类例外」∥「D1 细则」零命中 ∪「打标义务即满足」在位 | 见下 AC-3 码块 |
| AC-4 | E4：PROMPT-SYSTEM 档「三条例外」∥「Three exception categories」∥「D1 细则」零命中 ∪「其余面派全链」在位 | 见下 AC-4 码块 |
| AC-5 | E5：需求档 D1 行零命中四串 ∪「父侧不代笔」行含「需求档归父侧」 | 见下 AC-5 码块 |
| AC-6 | 归档面零 diff | `git diff --stat -- docs/core/requirements/_archive docs/core/design/_archive`（输出空） |
| AC-7 | 交付门：产品内建 `doc_check`（`mode:"gate"`，docs = §六 五档 + 本批档）⇒ 首行 `DOC-CHECK GATE: PASS` | 工具调用 |
| AC-8 | 清单外零改动（按 delta 判——工作区可能带他批在途）：`git status --porcelain` 的文件集增量 ⊆ §六 表 ∪ 本批档 | `git status --porcelain` |

**AC-1 命令**：

```js
node -e "const s=require('fs').readFileSync('thincoder-core/prompts/persona-engineering.md','utf8');const z=['Three exception categories','Face boundary','Face-boundary','All three must be marked','mechanical form correction','own write domain','purely mechanical form','small edits'].filter(t=>s.includes(t));const keep=(s.match(/content-writing on a dispatched surface/g)||[]).length;const mx=Math.max(...s.split(/\r?\n/).map(l=>[...l].length));console.log('zero='+JSON.stringify(z)+' keep='+keep+' max='+mx);process.exit(z.length===0&&keep===1&&mx<=300?0:1)"
```

**AC-2 命令**：

```js
node -e "const h=require('fs').readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8').split(/\r?\n/);const row=h.find(l=>l.startsWith('| D1 |'))||'';const rule=h.filter(l=>l.includes('D1 \u7ec6\u5219')).length;const bad=['\u4e09\u6761\u4f8b\u5916','\u9762\u754c','\u2461','\u2462'].filter(t=>row.includes(t));console.log('rowBad='+JSON.stringify(bad)+' ruleHits='+rule+' own='+row.includes('\u552f\u4e00\u4f5c\u8005'));process.exit(bad.length===0&&rule===0&&row.includes('\u552f\u4e00\u4f5c\u8005')?0:1)"
```

**AC-3 命令**：

```js
node -e "const s=require('fs').readFileSync('docs/core/design/LIGHT-CHANNEL.md','utf8');const z=['\u4e09\u7c7b\u4f8b\u5916','D1 \u7ec6\u5219'].filter(t=>s.includes(t));console.log('zero='+JSON.stringify(z)+' keep='+s.includes('\u6253\u6807\u4e49\u52a1\u5373\u6ee1\u8db3'));process.exit(z.length===0&&s.includes('\u6253\u6807\u4e49\u52a1\u5373\u6ee1\u8db3')?0:1)"
```

**AC-4 命令**：

```js
node -e "const s=require('fs').readFileSync('docs/core/design/PROMPT-SYSTEM.md','utf8');const z=['\u4e09\u6761\u4f8b\u5916','Three exception categories','D1 \u7ec6\u5219'].filter(t=>s.includes(t));console.log('zero='+JSON.stringify(z)+' keep='+s.includes('\u5176\u4f59\u9762\u6d3e\u5168\u94fe'));process.exit(z.length===0&&s.includes('\u5176\u4f59\u9762\u6d3e\u5168\u94fe')?0:1)"
```

**AC-5 命令**：

```js
node -e "const h=require('fs').readFileSync('docs/core/requirements/ENGINEERING-MODE-V2.md','utf8').split(/\r?\n/);const row=h.find(l=>l.startsWith('| D1 |'))||'';const bad=['\u4e09\u7c7b\u4f8b\u5916','\u4e09\u6761\u4f8b\u5916','\u2461','\u2462'].filter(t=>row.includes(t));const line=h.find(l=>l.includes('\u7236\u4fa7\u4e0d\u4ee3\u7b14'))||'';console.log('rowBad='+JSON.stringify(bad)+' lineOk='+line.includes('\u9700\u6c42\u6863\u5f52\u7236\u4fa7'));process.exit(bad.length===0&&line.includes('\u9700\u6c42\u6863\u5f52\u7236\u4fa7')?0:1)"
```

### 八、关键决策（含被否选项）

| # | 决策 | 否掉的选项与理由 |
|---|---|---|
| KD-1 | 整条撤掉，不再加限定 | 否掉「再补一句面界 / 再收窄射程」——上一批正是这么修的，修完仍空转（用户 00:44「小修改自己搞还留着？」） |
| KD-2 | D1 行用正面陈述，不写否定句 | 否掉「无小修旁路」式写法：D8 污染判据——写一个已消失的东西，检索层会把它当活物；否定式在检索里表示不出来 |
| KD-3 | 兄弟指针同轮收正（E3 ∥ E4） | 否掉「留待下批」：D8 细则 `:46` 逐字「删除后须扫该档与兄弟档引用——引用悬空 ⇒ 同轮收正」 |
| KD-4 | 归档档零触 | 归档不作现状依据、不入扫描域（`docs/core/design/DOC-DISCIPLINE.md` §4.6 `:1995`「不动 `_archive/`」） |
| KD-5 | 需求档 `:690` 首半句按 D1 行收正 | 同档自相矛盾：`:608` 写「需求档 = 主 agent」，`:690` 写「设计/需求档落笔一律派修正轮给 eng-designer」。该行因 E5 必改，顺手收正，不另开批 |
| KD-6 | 零新增机械门、零代码改 | 用户口径 = 撤空转，不是加闸；三面各有唯一作者，靠角色契约 + 评审核验（与 D1 既有「无机械门」一致） |

### 九、边界（本批不做）

- 不动轻通道准入面（三样清单 / 一句边界）——只改咬合行 `:366`（E3）。
- 不动 `thincoder-core/prompts/discipline-engineering.md:42` / `:48` 的工程工具面两条硬约束（另一面，已正确；本席实读确认与本条无关）。
- 不动归档档：`docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md:160` / `:425` · `docs/core/design/_archive/ENGINEERING-MODE.md:24` / `:142`。
- **不动 `docs/core/design/DOC-DISCIPLINE.md:1820` 的「三条例外」**——同名不同物：那是批档可删性例外三条（规则正文 / 机制模板形 / 目录级归属句，表在 `:1808-1812`），与本条无关，误删即毁 A-DD26 判据。
- 不改任何代码；不新增机械门；不改写权矩阵的六段作者分配。

### 十、集成测试设计（第 9 项 · 起点 = `test/RTM.md`）

判定 = **none**。

**RTM 实读（本席，`test/RTM.md` 138 行）**：CLI 端 9 个故事节 26 例（1 工具结果回放 1-1~1-3 ∥ 2 未立项写产品码提醒 2-1~2-3 ∥ 3 网页抓取后端故障 3-1~3-3 ∥ 4 浏览器等待窗口 4-1~4-3 ∥ 5 顾问超时热改 5-1~5-3 ∥ 6 设计评审文档范围 6-1~6-5 ∥ 7 收口只判本批改过的档 7-1~7-3 ∥ 8 批档建在项目里 8-1~8-2 ∥ 9 项目根解析 9-1）；VS Code 端 ∥ Desktop 端 = 空表 + 「编号先行」注；异常与更正 ∥ 签署面无用例行。

**逐节对账**：无一节断言写权面界 ∥ 提示词正文 ∥ 三条例外。破行 0 ∥ 冗余 0 ∥ 新增 0。

**两入口逐条对**：① 业务场景 = 无——本改是角色契约文本（谁在哪一面落笔），不是用户走得到的业务路径；② 生产问题 = 无可跑产物——形态是提示词被读宽 / 空转，验法是文本读数（AC-1~AC-5）+ 交付门。

**组件交互面**：零改——改动面 = 提示词正文 + 三档文档文字；工具层 / 装配面 / 参数管道零触。

**集成集现状**：26 / 50–100（CLI 端 9 节；两端空表）。本批新增 0 · 修订 0。

### 十一、勘察证据行 · 上抛项

① **[上抛·待裁] D1 细则块去留 = 本批唯一阻断点**。§1 条目 1–3（删 ②③）与「不做的」（不动 D1 细则块，理由「它记的是谁写哪一面」）相抵。两译：

- **A（本稿取向）**：D1 行改纯归属句（§四 E2）+ 细则块整块退场 + 三处兄弟指针同轮收正（E3 / E4 / E5）。
- **B（§1 字面）**：只删提示词，D1 行与细则块零动——后果 = `docs/core/design/DOC-DISCIPLINE.md:18` / `:28-42` 与需求档 `:608` 仍写「②③」，而提示词已无定义；D8「对象消失必删」当场破，读者会把 ②③ 当活机制去找。

本稿按 A 写。B 一旦裁下：E2 / E3 / E4 撤，E5 仍需改（它同样只在 A 下自洽）。

② **[上抛·知会] §1 坐标漏两行**：`:166`（`① states ownership, ②③ state a bypass…`）与 `:168`（`**Face-boundary judgment line**…`）不在三处坐标内——那三处是三个词 grep 出来的，这两行用 ①/②③ 符号，抓不到。按条目 1–2 的语义（②③ 装置随 ②③ 走）一并删，已写进 §三。

③ **[上抛·知会] 需求档 `:690` 与本档 `:608` 互斥（既有）**：`:690` 逐字「设计/需求档落笔一律派修正轮给 eng-designer」，`:608` 逐字「需求档（项目需求 + 功能规格）= 主 agent」。E5 按 `:608` 改写（§五），请批准时一并确认。

④ **勘察证据行**：manifest 读 = `state=workspace`（下辖 `D:\teamcode\thincoder` ∥ `D:\teamcode\thincoder.com`）；`PROJECT-MANIFEST.json` 的 `index.publicRepos` 同轮实读（见下条读数）。

⑤ **本席已读面**（提示词面 + 全域 grep）：`thincoder-core/prompts/persona-engineering.md:150-179` · `thincoder-core/prompts/discipline-engineering.md:28-48` · 全域 grep 六串（`Three exception categories` ∥ `own write domain` ∥ `mechanical form` ∥ `三条例外` ∥ `直笔` ∥ `D1 细则`）。

**本席已读面**（批档 + 设计档）：`docs/batches/2026-10-26-retire-pen-exceptions.md` 全文 · `docs/batches/2026-10-26-parent-write-scope.md` 全文 · `docs/core/design/DOC-DISCIPLINE.md` §1（`:1-60` ∥ `:1808-1822` ∥ `:1992-1996`）· `docs/core/design/LIGHT-CHANNEL.md:352-379`。

**本席已读面**（兄弟档 + 需求档 + RTM）：`docs/core/design/PROMPT-SYSTEM.md:252-265` · `docs/core/requirements/ENGINEERING-MODE-V2.md:600-613` ∥ `:684-695` · 同档全域 grep（`三类例外` ∥ `三条例外`）· `test/RTM.md` 全文（138 行）。

### 十二、裁定落地（父侧 2026-10-26 回执 · 本节即 §2 现行态）

#### 十二.1 裁定与收口

**裁定（父侧，逐字）**：「裁 **整条撤到底**。你的倾向对，我 §1「不做的」那条写错了——上一批刚建的 D1 细则块，这一批要跟着退场，不是留。」·「**四个面一起撤**」·「**「需求档归主 agent 写」这个事实不能跟着消失。** 它不是例外，是归属。D1 行改纯归属句时要把这句写实」。

**收口读数**：

- §一 的 E2 / E3 / E4 由 ⏸ 待裁 → ✅ 已定（设计档面 · 本席；**评审通过 + 批准后落笔，本轮零动笔**）。
- §八 ① 的待裁项**关闭**，取向 A 成立。§八 ② 的坐标补全按裁「你实读的为准」落定：`:166` / `:168` 一并删。
- E1（提示词面）→ eng-coder；E5（需求档面）→ 主 agent；本席本轮只出设计。

**底线条文（裁定新增的硬要求）**：D1 行把「需求档归主 agent 写」写**实**——唯一作者列举与父侧落笔面列举**双写**，删掉三条例外后仍有两处显式陈述，不靠推断。判据 = 十二.3 的 AC-9。

**细则块退场的计数（D3 · 实读口径）**：块 = `docs/core/design/DOC-DISCIPLINE.md:28-42` 共 **15 行** = 标题行 1 + bullet **7** 条（`:30` `:32` `:34` `:36` `:38` `:40` `:42`）+ 其间空行 7。

其中 **5 条**（`:30` `:32` `:34` `:36` `:38`）以 ②③ 为对象 ⇒ 随对象消失（D8）；`:40` 的归档面 = `§4.6 边界`「不动 `_archive/`」条（`:1995`）已载；`:42` 落点分工 = D1 行重复（D2）。

> 父侧口径写「6 条里 5 条」；本席逐行实读为 **7 条**。按 D3（计数与列表同时改）以实读 7 落笔，不照抄口径数——落笔动作两者相同（整块删）。

**删行精确化（供落笔席）**：删 `:28-42` 这 15 行后，再删相邻空行 1 行，使 D1–D9 表与 `**D8 细则（失效表达必删）**：`（现 `:44`）之间恰留一行空行。不留「本块已废」类挂尸。

#### 十二.2 落笔块现行态（替代 §四 E2 与 §五 E5 的两处文本）

> 本块已由 §十三 取代（#1 删尾句 · #2 “其余面”收窄为「其余文档面」）——落笔以 §十三 为准。

**E2 · D1 行（`docs/core/design/DOC-DISCIPLINE.md:18`）整行替换**：

```text
| D1 | 写权矩阵 | 文档类 → 唯一作者（批次档 = 主 agent；需求档（项目需求 + 功能规格）= 主 agent；设计档（架构设计 + 模块设计）= eng-designer；提示词 = **产品代码面** ⇒ 唯一作者 = **eng-coder**（内容依据 = 机制文档））——无机械门，靠角色契约与评审核验。**父侧（主 agent）的落笔面 = 批次档 §1/§4/§6 · 台账 · 需求档**（需求档归主 agent 写；落笔前提 = 需求确认门）；**其余面 = 各自唯一作者的全链**（设计 → 评审 → 批准 → 落笔），不看改动大小、不看形态 |
```

**E5 · 需求档 `:690` 整行替换**（替 §五 的原句）：

```text
- **父侧不代笔**：设计档落笔一律派修正轮给 eng-designer；需求档归主 agent 写，落笔前提 = 需求确认门。
```

**为何改这一字的称呼**：前稿写「需求档归父侧」，与 D1 行的「主 agent」成了同一件事的两个名字（一词两名）。裁定把该句列为底线，故统一到 `主 agent`，两档同串，AC-9 可同时判两面。

E2 的其余部分（细则块 `:28-42` 整块删）与 E3 / E4 / E5 的 `:608` 行均照 §四、§五 原样，本节未改。

#### 十二.3 验收表现行态（替代 §七 · AC-1…AC-9）

AC-1 / AC-3 / AC-4 / AC-6 / AC-7 / AC-8 照 §七 原样（命令码块同 §七）。下表为变更项与新增项。

| # | 判据 | 命令 |
|---|---|---|
| AC-2 | E2：D1 行不含「三条例外 ∥ 面界 ∥ ② ∥ ③」∪ `D1 细则` 全档命中 **0** ∪ D1 行含「唯一作者」 | §七 AC-2 码块原样 |
| AC-5 | E5：需求档 D1 行零命中四串 ∪「父侧不代笔」行含 **`需求档归主 agent 写`** | 见下 |
| AC-9 | **底线句双写**：`docs/core/design/DOC-DISCIPLINE.md` D1 行含 `需求档（项目需求 + 功能规格）= 主 agent` **且** 含 `需求档归主 agent 写`；需求档 `:690` 行含 `需求档归主 agent 写` | 见下 |

**AC-5 命令**：

```js
node -e "const h=require('fs').readFileSync('docs/core/requirements/ENGINEERING-MODE-V2.md','utf8').split(/\r?\n/);const row=h.find(l=>l.startsWith('| D1 |'))||'';const bad=['\u4e09\u7c7b\u4f8b\u5916','\u4e09\u6761\u4f8b\u5916','\u2461','\u2462'].filter(t=>row.includes(t));const line=h.find(l=>l.includes('\u7236\u4fa7\u4e0d\u4ee3\u7b14'))||'';const own=line.includes('\u9700\u6c42\u6863\u5f52\u4e3b agent \u5199');console.log('rowBad='+JSON.stringify(bad)+' lineOk='+own);process.exit(bad.length===0&&own?0:1)"
```

**AC-9 命令**：

```js
node -e "const fs=require('fs');const h=fs.readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8').split(/\r?\n/);const row=h.find(l=>l.startsWith('| D1 |'))||'';const a=row.includes('\u9700\u6c42\u6863\uff08\u9879\u76ee\u9700\u6c42 + \u529f\u80fd\u89c4\u683c\uff09= \u4e3b agent');const b=row.includes('\u9700\u6c42\u6863\u5f52\u4e3b agent \u5199');const r2=fs.readFileSync('docs/core/requirements/ENGINEERING-MODE-V2.md','utf8').split(/\r?\n/).find(l=>l.includes('\u7236\u4fa7\u4e0d\u4ee3\u7b14'))||'';const c=r2.includes('\u9700\u6c42\u6863\u5f52\u4e3b agent \u5199');console.log('enum='+a+' designOwn='+b+' reqOwn='+c);process.exit(a&&b&&c?0:1)"
```

#### 十二.4 与本稿前文的相抵处（一律以本节为准）

| 前文 | 本节现行态 |
|---|---|
| §一 E2 / E3 / E4 的 `⏸ 待裁` / `⏸ 随 E2` | ✅ 已定（十二.1）；落笔时点 = 批准后由本席落 |
| §八 ① 的待裁项（A ∥ B 两译） | 关闭；取向 A 成立 |
| §四 E2 的 D1 行文本 | 十二.2 的文本（补「父侧（主 agent）」与底线条文） |
| §五 E5 的 `:690` 文本 | 十二.2 的文本（`需求档归父侧` ⇒ `需求档归主 agent 写`） |
| §七 AC-5（判「需求档归父侧」） | 十二.3 的 AC-5（判「需求档归主 agent 写」） |
| §七 验收表（AC-1…AC-8） | 十二.3（AC-1…AC-9；新增 AC-9） |

### 十三、修正轮落笔（评审 14 项处置 · 本节 = §2 现行态）

**落笔态**：E2 ∥ E3 ∥ E4 已落（设计档面 · 本席）· E1 待 eng-coder · E5 待父侧（逐字 = §十三.3）。

#### 十三.1 逐条处置（号 → 处置 → 落点）

| # | 评审项 | 处置 | 落点 |
|---|---|---|---|
| 1 | KD-2 与 E2 尾句自相矛盾 | 删尾句「不看改动大小、不看形态」——E2 与 E5 两处同删（同一件事在两档，只删一处即造面差）；边界由「各自唯一作者的全链」正面承载 | `docs/core/design/DOC-DISCIPLINE.md:18`（已落）· §十三.3 的 `:608`（待落） |
| 2 | 「其余面」歧义（可读成含产品源码面） | 收窄为「其余文档面（设计档面 ∥ 提示词面）」，并点明代码笔不经本行——措辞复用 `docs/core/design/LIGHT-CHANNEL.md:402`「轻通道只作用于代码笔」；`docs/core/design/PROMPT-SYSTEM.md:259` 的「其余面派全链」同轮同改（同一读法缺陷） | D1 行 · 提示词系统档末句（均已落） |
| 3 | AC 缺全局族判据 | 新增 AC-10（§十三.4）：五档同跑退役族；`三条例外` 按「设计档恰 1（`:1820` 同名不同物，§九 排除）+ 其余四档 0」判 | §十三.4 |
| 4 | AC-5 ∥ AC-9 行定位不稳 | 改内容锚：首格 `D1` 且该行含 `写权矩阵`，并断言该形恰 1 行。实读：设计档 D1 行仅 `:18`，需求档仅 `:608` | §十三.4 码块 ① |
| 5 | 扫描族漏 `三类例外` | 族补该变体并登记命中集：改前 4 处 = `docs/core/design/LIGHT-CHANNEL.md:366` · `docs/core/design/DOC-DISCIPLINE.md:40` · 需求档 `:608` `:690`；现盘 = 前两处已归零（E2 ∥ E3 落地），余 2 处待 E5 | 本节 + §十三.4 AC-10 |
| 6 | `.md` 行列了行数两列 | 两列填 `—`（行保留），读数移进散文定位句 | §十三.5 |
| 7 | 缺先例行 | 补「先例 ∥ 偏离」（形制 = `docs/core/design/PROMPT-SYSTEM.md:4104`） | §十三.6 |
| 8 | 勘察证据行悬空 | 同行落读数 + 结论，删「见下条读数」 | §十三.6 |
| 9 | 新造标签无三问 | 补三问答：两标签复用盘上既有措辞（`docs/core/design/LIGHT-CHANNEL.md:402` ∥ D1 行既有「全链」句），并列形记明为拼合 | §十三.6 |
| 10 | 去向审计未点存活载体 | 点名提示词面载体 `:30` `:79`（① 归属）· `:211` `:213` `:220`（面界 / 全链） | §十三.2 末段 |
| 11 | 数值漂移 | 复算并统一读数口径：`split(/\r?\n/).length - 1`（末行换行收尾不计空段）；设计稿原数 = `read` 的「N lines total」口径（含末空段），逐档 +1——此即全部差额 | §十三.5 |
| 12 | 尺寸档 | 无需动作：文档行数规则已废（`docs/core/design/DOC-DISCIPLINE.md:250`「文档**不受行数限制**」）；提示词档 462 ≤ 500 | §十三.7 |
| 13 | AC-7 依据未给 | 补依据：`docs/core/design/DOC-DISCIPLINE.md:2039`（A-DD30）+ 三触发点在册（`:2293`）；`:117` 禁调令射程 = `scripts/` 手跑入口（`:119`），不含产品内建工具 | §十三.7 |
| 14 | 同一笔两份逐字块并存 | §四 ∥ §五 ∥ §十二.2 三处块首各加取代行，落笔以 §十三 为准 | 本档三处（已加） |

#### 十三.2 E2–E4 已落读数（本席实跑 · 2026-10-26）

| 落点 | 动作 | 读数 |
|---|---|---|
| `docs/core/design/DOC-DISCIPLINE.md:18` | D1 行整行替换 | D1 行（内容锚）= 唯一；含 `唯一作者` ∧ `需求档（项目需求 + 功能规格）= 主 agent` ∧ `需求档归主 agent 写`；不含 `三条例外` ∥ `面界` ∥ `②` ∥ `③` ∥ `D1 细则` ∥ `不看改动大小`（实扫 = 空集） |
| 同档原 `:28-43` | 删 D1 细则块 15 行（标题 1 + bullet 7 + 其间空行 7）+ 相邻空行 1 | 全档 `D1 细则` = **0**；D1–D9 表与 `**D8 细则（失效表达必删）**`（现 `:28`）之间恰一行空行 |
| `docs/core/design/LIGHT-CHANNEL.md:366` | 咬合行整行替换 | 全档 `三类例外` = **0** ∧ `D1 细则` = **0** ∧ `打标义务即满足` 在位 |
| `docs/core/design/PROMPT-SYSTEM.md:259` | 末句替换 | 全档 `三条例外` = **0** ∧ `Three exception categories` = **0** ∧ `D1 细则` = **0** ∧ `其余文档面` 在位 |

**②③ 的存活面（#10）**：① 的归属事实在提示词面仍有载体——`thincoder-core/prompts/persona-engineering.md:30`「writing the requirement docs (project requirements + function specs)」· `:79`「requirement docs are your products」（本席实读）。

面界 / 全链的载体 = 同档 `:211`「doc face (design docs) → eng-designer; requirement docs → you」· `:213`「the requirement docs stay with you」· `:220`（落笔已到提示词面 ∥ 设计档 ∥ 需求档者改走全链，不出选择题）⇒ 删 ②③ 装置 = 零语义损失，可逐行核。

#### 十三.3 E5 待父侧落（需求档面 · 逐字块 = 唯一文本）

`docs/core/requirements/ENGINEERING-MODE-V2.md:608` 整行替换：

```text
| D1 | **写权矩阵** | 文档类唯一作者：批次档 = 主 agent · **需求档（项目需求 + 功能规格）= 主 agent** · **设计档（架构设计 + 模块设计）= eng-designer** · 提示词 = **产品代码面** ⇒ 唯一作者 = eng-coder（内容依据 = 机制文档）；**父侧（主 agent）的落笔面 = 批次档 §1/§4/§6 · 台账 · 需求档**（需求档归主 agent 写；落笔前提 = 需求确认门），**其余文档面（设计档面 ∥ 提示词面）= 各自唯一作者的全链**（设计 → 评审 → 批准 → 落笔）；**代码笔不经本行**——轻通道只作用于代码笔（`docs/core/design/LIGHT-CHANNEL.md` §5）（机制面 = `docs/core/design/DOC-DISCIPLINE.md` §1 D1 行） |
```

同档 `:690` 整行替换（照 §十二.2，本节未改）：

```text
- **父侧不代笔**：设计档落笔一律派修正轮给 eng-designer；需求档归主 agent 写，落笔前提 = 需求确认门。
```

**E5 落笔后应得读数**：需求档 D1 行不含 `三类例外` ∥ `三条例外` ∥ `②` ∥ `③` ∥ `D1 细则`；D1 行与 `:690` 行各含 `需求档归主 agent 写`；全档 `三类例外` = 0 ∧ `D1 细则` = 0。

#### 十三.4 验收表现行态（替代 §七 与 §十二.3 · AC-1…AC-10）

AC-1（E1 · eng-coder 读数）∥ AC-6（归档零 diff）∥ AC-8（清单外零改动）照 §七 原样。收正项与新增项如下。

| # | 判据 | 命令 |
|---|---|---|
| AC-2 | E2：D1 行（内容锚）不含四串 ∪ `D1 细则` 全档 = 0 ∪ 该行含 `唯一作者` ∪ 该形恰 1 行 | 码块 ① |
| AC-3 | E3：轻通道档 `三类例外` ∥ `D1 细则` = 0 ∪ `打标义务即满足` 在位 | 照 §七 AC-3 |
| AC-4 | E4：提示词系统档三串 = 0 ∪ `其余文档面` 在位 | 码块 ② |
| AC-5 | E5：需求档 D1 行（内容锚）零命中四串 ∪「父侧不代笔」行含 `需求档归主 agent 写` | 照 §十二.3 AC-5（行定位改内容锚） |
| AC-9 | 底线句双写：设计档 D1 行含 `需求档（项目需求 + 功能规格）= 主 agent` ∧ `需求档归主 agent 写`；需求档 `:690` 行含 `需求档归主 agent 写` | 照 §十二.3 AC-9（行定位改内容锚） |
| AC-10 | 退役族全局判：五档同跑 `D1 细则` ∥ `三类例外` ∥ `Three exception categories` ⇒ 各 0；`三条例外` ⇒ 设计档恰 1 + 其余四档 0 | 码块 ③ |

**码块 ①**

```js
node -e "const h=require('fs').readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8').split(/\r?\n/);const rows=h.filter(l=>l.startsWith('| D1 |')&&l.includes('\u5199\u6743\u77e9\u9635'));const row=rows[0]||'';const rule=h.filter(l=>l.includes('D1 \u7ec6\u5219')).length;const bad=['\u4e09\u6761\u4f8b\u5916','\u9762\u754c','\u2461','\u2462'].filter(t=>row.includes(t));console.log('rows='+rows.length+' bad='+JSON.stringify(bad)+' rule='+rule+' own='+row.includes('\u552f\u4e00\u4f5c\u8005'));process.exit(rows.length===1&&bad.length===0&&rule===0&&row.includes('\u552f\u4e00\u4f5c\u8005')?0:1)"
```

**码块 ②**

```js
node -e "const s=require('fs').readFileSync('docs/core/design/PROMPT-SYSTEM.md','utf8');const z=['\u4e09\u6761\u4f8b\u5916','Three exception categories','D1 \u7ec6\u5219'].filter(t=>s.includes(t));console.log('zero='+JSON.stringify(z)+' keep='+s.includes('\u5176\u4f59\u6587\u6863\u9762'));process.exit(z.length===0&&s.includes('\u5176\u4f59\u6587\u6863\u9762')?0:1)"
```

**码块 ③**

```js
node -e "const fs=require('fs');const D=['docs/core/design/DOC-DISCIPLINE.md','docs/core/design/LIGHT-CHANNEL.md','docs/core/design/PROMPT-SYSTEM.md','docs/core/requirements/ENGINEERING-MODE-V2.md','thincoder-core/prompts/persona-engineering.md'];const F=['D1 \u7ec6\u5219','\u4e09\u7c7b\u4f8b\u5916','Three exception categories'];const c=(s,t)=>s.split(t).length-1;const out=[];let ok=true;for(const p of D){const s=fs.readFileSync(p,'utf8');const r={p};for(const f of F){const n=c(s,f);r[f]=n;if(n!==0)ok=false;}const t=c(s,'\u4e09\u6761\u4f8b\u5916');r.T=t;const e=p.includes('DOC-DISCIPLINE')?1:0;if(t!==e)ok=false;out.push(r);}console.log(JSON.stringify(out));process.exit(ok?0:1)"
```

**AC-10 为何不按全局 0 判**：`docs/core/design/DOC-DISCIPLINE.md:1820` 的「三条例外」是批档可删性例外三条（规则正文 / 机制模板形 / 目录级归属句，表在 `:1808-1812`），与本批撤的三条例外同名不同物。

§九 已裁零触，误删即毁 A-DD26 判据 ⇒ 该档按「恰 1」判，不按 0 判。

#### 十三.5 受影响文件表收正（#6 ∥ #11 · 替代 §六 表）

`.md` 行两列按 `docs/core/design/DOC-DISCIPLINE.md:282` ∥ `:276` 口径填 `—`（行保留）。

| 文件 | 面 · 笔 | 当前行数 | 预计增量 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 产品代码面 · eng-coder（E1） | — | — |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档面 · 本席（E2） | — | — |
| `docs/core/design/LIGHT-CHANNEL.md` | 设计档面 · 本席（E3） | — | — |
| `docs/core/design/PROMPT-SYSTEM.md` | 设计档面 · 本席（E4） | — | — |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 需求档面 · 主 agent（E5） | — | — |

**定位读数（散文 · 只作实施席定位，不入验收）**：口径 = `split(/\r?\n/).length - 1`（末行换行收尾不计空段；设计稿原数 = `read` 的「N lines total」口径，逐档 +1——此即 #11 的全部差额）。

落地后实读：提示词档 **462**（E1 后 −4 ⇒ 458）· 设计档 **2477**（本次 −16）· 轻通道档 **474**（±0）· 提示词系统档 **4410**（±0）· 需求档 **1137**（E5 ±0）。

#### 十三.6 先例 / 三问 / 勘察（#7 #8 #9）

**先例 ∥ 偏离**：先例 = 批 `2026-10-26-parent-write-scope`（同对象、同五面：提示词面 ∥ 设计档 D1 行 + D1 细则块 ∥ 轻通道咬合行 ∥ 提示词系统交界句 ∥ 需求档 D1 行）；机制档节 = `docs/core/design/DOC-DISCIPLINE.md` §1（写权矩阵单源）。

**对齐** = 同对象、同五面、同落点（就地改写、零新档）。**偏离** = 前批补装置、本批撤装置：三条例外连同面界整条退场——理由 = 用户 2026-10-26 00:44 ∥ 00:45 逐字 + 补完面界后 ②③ 在自有写域内无可执行对象（KD-1）。

**既有件三问（#9）**：

- 「父侧（主 agent）的落笔面」⇒ `existing: thincoder-core/prompts/persona-engineering.md:164` · `name: "your own write domain (batch record §1/§4/§6 · ledger · requirement docs)"` · `consumers: 主 agent`；本批保留三项列举、去掉例外框法；E1 落地后载体转 `:30` ∥ `:79`。
- 「其余文档面（设计档面 ∥ 提示词面）= 各自唯一作者的全链」⇒ `existing: docs/core/design/LIGHT-CHANNEL.md:402` · `name: "三面各有唯一作者（写权矩阵 D1…）"` ∥ 同句「轻通道只作用于代码笔」· `consumers: 轻通道读者 + D1 行读者`；不新造术语：「全链（设计 → 评审 → 批准 → 落笔）」= D1 行前批既有句。
- 「其余文档面（设计档面 ∥ 提示词面）派全链」（提示词系统档末句）⇒ 同上；并列形为上述两半句拼合，未另立名。

**勘察证据行（#8）**：`manifest read`（2026-10-26 本轮，目标 `D:\teamcode\thincoder`）= `state=ok`，`docRoot.design` 命中本批三档；`index.publicRepos: []`（无公开源仓）⇒ 无相关公开文档，本批不引外部源。

#### 十三.7 记录句（#12 ∥ #13）

- **#12（尺寸档）**：四档体量远超 800 行不构成缺陷——文档行数规则已废（`docs/core/design/DOC-DISCIPLINE.md:250` 逐字「文档**不受行数限制**」）⇒ 不欠拆分计划；提示词档 462 ≤ 500 硬限照旧。
- **#13（AC-7 依据）**：AC-7 的交付门 = 产品内建 `doc_check(mode:"gate")`，依据 = `docs/core/design/DOC-DISCIPLINE.md:2039`（A-DD30 · gate 判据八条）+ 三触发点在册（`:2293`：eng-designer ∥ eng-coder ∥ 父侧收口）；`:117` 的禁调令射程 = `scripts/` 手跑入口（`:119`「禁止调用 `node scripts/doc-check.mjs`」），不含产品内建工具 ⇒ AC-7 不违禁。

#### 十三.8 取代关系（#14 已落）

本档 §四块首 ∥ §五块首 ∥ §十二.2 块首各加一行取代标记——三处同一句「落笔以 §十三 为准」。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审结论（第 1 轮 · 设计评审子代理）

评审对象 = 撤掉父侧直笔三条例外（四层同撤）；设计档现行态 = §2 §十二。

已实读：

- 本批档全文
- `docs/core/design/DOC-DISCIPLINE.md` §1 / §4.5.4 / §4.6 / §5（含 `:18` `:28-42` `:1804-1822` `:1995` `:2010-2043`）
- `docs/core/design/LIGHT-CHANNEL.md:330-475`（含 `:35` `:366` `:402`）
- `docs/core/design/PROMPT-SYSTEM.md:250-265` / `:4104`（含 `:259`）
- 落笔目标面 `thincoder-core/prompts/persona-engineering.md:150-181`（`:164-168` 逐行）
- `thincoder-core/prompts/discipline-engineering.md:36-53`（`:42` `:48`）。




**计数：🔴 0 · 🟡 10 · 🔵 4 ⇒ 无阻断项。**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 一致性（自相矛盾） | 🟡 | KD-2（本批档 `:198`）逐字「不写「没有小修旁路」：否定式会把已撤掉的东西重新带回检索面」，而 E2 逐字块（`:274`）写「不看改动大小、不看形态」——正是被撤 ②③ 判据（③ = 改动大小 ∥ ② = 形态）的否定式，触发 KD-2 自称的 D8 污染面 | 删尾句（边界已由「其余面 = 各自唯一作者的全链」正面承载）；或按 D9 显式记一条「KD-2 的例外 + 其 why」——二者取一，不留两句并存的读法 |
| 2 | 清晰性 | 🟡 | 新 D1 行的「其余面」未穷举：字面可读成含**产品源码面**，则与在位的轻通道冲突（`docs/core/design/LIGHT-CHANNEL.md:366`「轻通道笔 = 父侧直改」∥ `:402`「轻通道只作用于代码笔」） | 改写为「其余三面（设计档面 ∥ 需求档面 ∥ 提示词面）」或「其余（文档）面」，并一句点明代码笔归轻通道（`docs/core/design/LIGHT-CHANNEL.md` §5）——两档读者各得自足句（承 D-PS41 各层独立可读） |
| 3 | 验收覆盖 | 🟡 | AC 集无判据判「需求档在 D1 行之外仍残留 `D1 细则` ∥ `三类例外` 指针」：AC-5（`:300`）只判 D1 行与「父侧不代笔」行，而 E2 把该块名从三档连带抹掉；`doc_check` 的锚面看不见散文块名（判据面 = `file.md §N` / 路径类） | 加一条全局零命中 AC：对 §六 五档同跑退役族（`D1 细则` ∥ `三条例外` ∥ `三类例外` ∥ `Three exception categories`）⇒ 各 0 |
| 4 | 验收可核 | 🟡 | AC-5 ∥ AC-9（`:300` ∥ `:306`）以「首个以 D1 起首的表格行」定位需求档 D1 行，而任务档本身给的是 `:608`；设计未给「该文档内更早的表格首格不含 D1」的证据（`unverified`——需求档不在本轮射程） | 改按内容锚定位（该行含「写权矩阵」）或在判据里断言命中行的行号索引 = 目标行 |
| 5 | 勘察完整 | 🟡 | §十一 ⑤（`:241`）的扫描族漏 `三类例外`——而正在改写的兄弟行恰用该变体（`docs/core/design/LIGHT-CHANNEL.md:366`「（三类例外 + 打标义务）」）；KD-3 引的 D8 句要求「删除后须扫该档与兄弟档引用」（`docs/core/design/DOC-DISCIPLINE.md:46`），族不全则该结论无法自证 | 族补 `三类例外` 并登记命中集；或写明「该变体的在位实例 = AC-3 ∥ AC-5 所覆盖的两处，此外为空」 |
| 6 | 方法学（项目规范） | 🟡 | §六 表（`:139-142`）为四份 `.md` 文档列「当前行数 + 预计增量」，与 `docs/core/design/DOC-DISCIPLINE.md:282`（新落笔批次档「**文档档（`.md`）不列该两列**」）∥ `:276`（该两列填 `—`、行保留）相抵；本设计自身在 `:144` 已声明「数字只作实施席定位用」 | 两份 `.md` 列填 `—`，或把读数移出表格进散文定位句（不改语义，合规且保留定位价值） |
| 7 | 先例检查（第 9 项） | 🟡 | 全档 `先例` ∥ `对齐` ∥ `偏离` ∥ `最接近` **零命中**：无最接近先例行；碎片散在 `:17`（前批坐标）与 KD-1（`:197`）。同仓设计节的标准形在 `docs/core/design/PROMPT-SYSTEM.md:4104`「**先例 ∥ 偏离**」 | 补一行：实现坐标（§六 五档）∥ 承载该机制的机制档节（`docs/core/design/DOC-DISCIPLINE.md` §1）∥ 先例批 `2026-10-26-parent-write-scope`；**对齐** = 同对象同五面；**偏离** = 前批补面界、本批撤装置（理由逐字 = KD-1） |
| 8 | 勘察证据行（第 10 项） | 🟡 | `:239` 断言 `index.publicRepos`「同轮实读（见下条读数）」，但下一条 `:241` 是「本席已读面」，**无此读数**——指针悬空，且「有无相关公开源」的结论未落笔（对照体 = `docs/core/design/LIGHT-CHANNEL.md:345`「`index.publicRepos: []`（无公开源仓）⇒ 无相关公开文档」） | 在同一行落读数 + 结论（「无公开源仓 ⇒ 无相关公开文档」或反之），删「见下条读数」 |
| 9 | 既有件三问（第 11 项） | 🟡 | 新造标签「其余面 = 各自唯一作者的全链」∥「其余面派全链」∥「父侧（主 agent）的落笔面」无三问答复（`existing` ∥ `none found` ∥ `existing but unusable`）；盘上已有同义句 `docs/core/design/LIGHT-CHANNEL.md:402`「三面各有唯一作者（写权矩阵 D1…）」 | 补三问行：说明沿用 ∥ 新造，并给新造的理由（或直接复用 `:402` 的既有措辞，D-PS44 同轴「已有名字别换名」） |
| 10 | 清理去向（D2 ∥ D8） | 🟡 | 删除去向审计只给「打标义务」与 `:40` ∥ `:42` 的承接处（`:105-106` ∥ `:92`）；`:164` ① 的归属事实与 `:165` ∥ `:166` ∥ `:168` 的**面界**在同一提示词档的存活载体未点名——实测在 `thincoder-core/prompts/persona-engineering.md:30` ∥ `:79` ∥ `:211` ∥ `:213` ∥ `:220`（正文即「writing the requirement docs」「requirement docs are your products」「requirement docs → you」「a pen that has landed on the prompt face … takes the full chain」） | 在 §三 的逐行理由里点这四行 = 归属事实与面界在提示词面的承接处 ⇒ 删除的「零语义损失」有了可核证据（不只是 D1 行的文档面承接） |
| 11 | 数值漂移 | 🔵 | §六 记 `DOC-DISCIPLINE` 「−14 量级」（`:139`），§十二.1 实定 15 行 + 相邻空行 1 = **−16**（`:267`）；`LIGHT-CHANNEL` 记 474（`:140`）而同一 `read` 口径实为 **475 行**；`PROMPT-SYSTEM` 记 4410（`:141`）实为 **4411 行**（`thincoder-core/prompts/persona-engineering.md` 463 ∥ `DOC-DISCIPLINE` 2493 与实读相符）。行数已声明不入验收（`:144`） | 复算或按 #6 从表内撤下；不改判据 |
| 12 | 尺寸档（第 8 项） | 🔵 | `docs/core/design/DOC-DISCIPLINE.md` 2493 行 ∥ `docs/core/design/PROMPT-SYSTEM.md` 4411 行远超 800 行文件档，但本项目已废除文档行数规则（`docs/core/design/DOC-DISCIPLINE.md:250` 逐字「文档**不受行数限制**」）⇒ 不欠拆分计划；`thincoder-core/prompts/persona-engineering.md` 463 ≤ 500 | 无需动作；记此一笔以免该维度被读作未检 |
| 13 | 验收依据 | 🔵 | AC-7（`:160`）用产品内建 `doc_check(mode:"gate")` 作交付门，未给依据；`docs/core/design/DOC-DISCIPLINE.md:117` 有「禁调 `doc-check`」令，其操作射程 = `scripts/` 入口（`:119`「禁止调用 `node scripts/doc-check.mjs`」） | 判据行补一句依据（`docs/core/design/DOC-DISCIPLINE.md:2039` A-DD30 三触发点 + 侧批 `batch-gate`），使 AC-7 不被读作违禁 |
| 14 | 落笔歧义 | 🔵 | 同一笔的两份逐字块并存在 §2：§四 E2（`:99`）∥ §五 `:690`（`:131`）与 §十二.2（`:274` ∥ `:280`）；§十二.4（`:311-318`）已判胜负，但误抄面仍在 | 在 §四 ∥ §五 两块块首各加一行「本块已由 §十二.2 取代，落笔以 §十二.2 为准」（记录面追加，不删前文） |

**未发现 🔴 的理由（判据已逐条正面核过）**：

① E1 的四行坐标与 `thincoder-core/prompts/persona-engineering.md:164` `:165` `:166` `:168` 逐字相符、`:167` 改写保留首判据句、463 → 459 算术相符（实读 463）；

② AC-1 八串在当前档的命中集恰为 `:164-168`（`small edit` ∥ `mechanical form` ∥ `Face boundary` ∥ `All three must be marked` 逐串实核）⇒ 改后零命中可满足，`keep=1` 可满足；

③ AC-2 ∥ AC-9 的 D1 行串在 §十二.2 文本内逐字具备（`需求档（项目需求 + 功能规格）= 主 agent` ∧ `需求档归主 agent 写`）；

④ AC-3 ∥ AC-4 的零命中面成立（`docs/core/design/LIGHT-CHANNEL.md` 的 `三类例外` ∥ `D1 细则` 仅 `:366`；`docs/core/design/PROMPT-SYSTEM.md` 的 `三条例外` ∥ `Three exception categories` ∥ `D1 细则` 仅 `:259`）；

⑤ 删除去向的两处承接实核在盘（`docs/core/design/DOC-DISCIPLINE.md:1995` 归档边界 ∥ `:1810-1812` + `:1820` 的「三条例外」= 批档可删性例外三条，同名不同物 ⇒ §九 的排除裁定正确）；

⑥ 工程工具面零触的旁证在盘（`thincoder-core/prompts/discipline-engineering.md:42` 携「parent direct execution」+ revertable、`:48` 携判据句）；

⑦ 第 6b 项（分支出处）不适用——本批不新增任何输入 ∥ 状态分支（纯删除 + 正面陈述改写）；

⑧ 第 12 项：集成判定 = `none` 且给出唯一合法理由（不改既有用例所断言的业务可观察结果、不新增真实需要的场景）+ RTM 逐节对账，验收面为文本读数与交付门，**未把全量套件写成轮次成本**；

⑨ 无新增文档档、无第二权威源，改的都是拥有该主题的档（D1 → `docs/core/design/DOC-DISCIPLINE.md` §1；轻通道 → `docs/core/design/LIGHT-CHANNEL.md`；提示词系统设计 → `docs/core/design/PROMPT-SYSTEM.md`；D1–D9 语义 → 需求档 §13.1），且需求侧同步（E5）在位 ⇒ 无机制级「同一机制两处不同描述」。

**限制声明**：本轮射程 = 声明的四档 + 落笔目标面的坐标复核；`docs/core/requirements/ENGINEERING-MODE-V2.md`（`:608` ∥ `:690`）∥ `test/RTM.md` 不在 Documents-to-Review 清单内 ⇒ 其读数按 `unverified` 处置（#4 即由此）。项目无独立「项目标准」文档、无文档地图 ⇒ 第 7 项（文档归属）以 `docs/core/design/DOC-DISCIPLINE.md` §1 ∥ §3.7 与 `AGENTS.md` 为据判。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-26（用户：「**落地自动跑完**」00:48）

**批准依据**：评审 `#2` = **pass**（🔴 0 · 🟡 10 · 🔵 4），token 签发后修正轮 `#3` 落十条 🟡，实施席 `#4` 落 E1，父侧落 E5。

**批准范围**：四个面同撤——提示词 `persona-engineering.md:164-168`（五行 → 一行判据句）· 设计档 `DOC-DISCIPLINE.md:18` D1 行改归属句 + `:28-43` 细则块整块删 · `LIGHT-CHANNEL.md:366` · `PROMPT-SYSTEM.md:259` · 需求档 `ENGINEERING-MODE-V2.md:608`/`:690`。

**不在范围**：轻通道准入面 · 工程工具面 `discipline-engineering.md:42`/`:48` · 归档档 · 代码。

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 2026-10-26

### 5.1 落笔读数（E1 · 提示词面）

落点 = `thincoder-core/prompts/persona-engineering.md`；形态 = 一次块替换（原 `:164`–`:168` 五行 → 一行），未动该档其余任何行。

| # | 条目（§一 E1） | 动作 | 读数 |
|---|---|---|---|
| 1 | 原 `:164` `Three exception categories` 行 | 删 | ✅ 八串之一零命中 |
| 2 | 原 `:165` `Face boundary` 行 | 删 | ✅ 零命中 |
| 3 | 原 `:166` `① states ownership …` 行 | 删 | ✅ 现盘无「states a bypass」句 |
| 4 | 原 `:168` `Face-boundary judgment line` 行 | 删 | ✅ 零命中 |
| 5 | 原 `:167` 整行 | 改写为设计 §三 逐字句 | ✅ 现 `:164` = `  **Judgment line**: you content-writing on a dispatched surface without a fix round ⇒ violation.` |
| 6 | 行数 | −4（删四行、一行改写） | ✅ `read` 口径 463 → 459；`split(/\r?\n/).length-1` 口径 462 → 458（= §十三.5 的「E1 后 −4 ⇒ 458」） |
| 7 | 连带核对：工程工具面两条硬约束 | 零触 | ✅ `thincoder-core/prompts/discipline-engineering.md:42` 的 `**Two hard constraints on direct engineering-tools edits**` 与 `:48` 判据句逐字在位（另一面，与本条无关） |

### 5.2 验收读数（cwd = 仓根）

| 判据 | 读数 |
|---|---|
| AC-1：八串零命中 ∪ 首判据句恰 1 ∪ 逐行 ≤300 | ✅ `zero=[] keep=1 max=300`（命令 exit 0） |
| §三 逐字块：现 `:164` 与设计逐字一致 | ✅ 两空格缩进 ∥ `⇒` ∥ 句末点，逐字相符 |
| §十三.5 行数 458（split 口径） | ✅ 458 |
| AC-6 归档面零 diff | ✅ `git diff --stat -- docs/core/requirements/_archive docs/core/design/_archive` 输出空 |
| AC-10 退役族全局判（含本档） | ✅ exit 0：五档 `D1 细则` ∥ `三类例外` ∥ `Three exception categories` 各 0；`三条例外` 设计档恰 1（`docs/core/design/DOC-DISCIPLINE.md:1820` 同名不同物）· 本档 0 |
| AC-8 清单外零改动（按 delta） | ✅ 落笔前后 `git status --porcelain` 文件集成员逐一相同——本笔只改已列在 `M` 的提示词档，未增删任何路径 |

**AC-1 命令与输出**（逐字取 §七 码块，中文串以 `\u` 转义）：

```text
$ node -e "…§七 AC-1 码块同串…"
zero=[] keep=1 max=300
AC-1 exit=0
```

### 5.3 内部审计 · 代码评审（轮次与终态）

| 环节 | 轮次 | 结论 |
|---|---|---|
| 内部 explore 偏差审计（对 §2 任务书判偏差） | 1 | `clean`——四类偏差均无；退役装置悬空引用 0（全 `thincoder-core/prompts/` 对家族串零命中）；清单外改动 0 |
| 内部 advisor 代码评审 | 1 | `VERDICT: pass`——🔴 0 · 无 must-fix；三条可选发现全部落在 E1 声明面之外 |
| 自修轮次 | 0 | 审计 clean + 评审 pass；三条可选发现若照办须改 `:180` ∥ `:186`（E1 五行的邻居、非本批声明面），擅改即偏离设计 ⇒ 只报不改 |
| **终态** | — | **`clean`** |

**审计同时复核了删除去向（与设计 §十三.2 #10 一致）**：① 的归属事实在提示词面仍有载体（`:30` ∥ `:79`）；面界 ∥ 全链的载体在位（`:207` ∥ `:209` ∥ `:216` ∥ `:224`）⇒ 删 ②③ 装置零语义损失，可逐行核。

### 5.4 评审三条可选发现的处置（只报不改）

| # | 发现 | 处置与理由 |
|---|---|---|
| 1 | `:180` `- **Fix in place first**: one-off small-form items (wording / coordinates / indexes / cleanup) from reviews or sweeps get fixed on the spot …`——面上最近的「小修现场改」授权，无面界限定；字面可读成与 `:163`（`anything needing a design-doc change is dispatched to **eng-designer** via a fix round`）∥ `:323`（`§2 corrections go to **eng-designer**`）相抵 | **不改**：该行是台账 ∥ 债务分流规则（「小事别挂进池」），不属 E1 五行；按设计 §二的读法（②③ 在自有写域内空转），它作用在自有写域内，跨面仍由 `:163` ∥ `:216` ∥ `:224` 管。补「inside your own write domain」限定 = 设计席 ∥ 父侧裁定，本席不动 |
| 2 | 打标义务：被删句 `**All three must be marked** ("parent direct execution" + revertable)` 覆盖 ① 面（需求档 ∥ 台账 ∥ 批档笔），设计只点两处承接（`thincoder-core/prompts/discipline-engineering.md:42` 工程工具面 ∥ `docs/core/design/LIGHT-CHANNEL.md:366` 轻通道代码笔）；现盘该档 `direct execution` 零命中 | **不改**：① 是归属事实、非例外；打标句随装置退场是设计已裁内容（§三 逐行理由）。① 面留痕由批档 §1 已定决定形 ∥ 台账行 ∥ §1/§4/§6 作者身份结构性承载。若须单列，是设计档面的事，交父侧路由 |
| 3 | `:186` `(verification / closure / settlement / mechanical corrections)`——② 的近义标签；本批扫描族按 `mechanical form` 取词，抓不到该变体 | **不改**：该行是「并行清自己的队列」的职责句（自有写域内的活动名），不是跨面授权。记此一笔，供下批按族扫时补词 |

### 5.5 三问 · 先例

零新造：本笔只有删除 + 就位改写，未起新名、未起新组件。既有件三问 = `existing: thincoder-core/prompts/persona-engineering.md:163` · `name: "Parent does not ghost-write"` · `consumers: 主 agent`（改写后的判据行即挂此条继续读）。

**先例** = 批 `2026-10-26-parent-write-scope`（同对象、同面）；**对齐** = 同落点、就地改写；**偏离** = 前批补装置、本批撤装置（依据 = 用户 2026-10-26 00:44 ∥ 00:45 逐字）。

### 5.6 交付门读数

| 档 | gate 读数 |
|---|---|
| `thincoder-core/prompts/persona-engineering.md`（本席写） | **`DOC-CHECK GATE: PASS`**（0 命中，1 档全清） |
| 本批档（`docs/batches/2026-10-26-retire-pen-exceptions.md`） | **`DOC-CHECK GATE: REFUSED（命中 31 条）`**——命中全在 §3（评审子代理面）`:458`–`:481`：裸档名指针 29 条（未带目录段 ⇒ 解析不到）＋ 段太长 2 条（`:458` 350 字符 ∥ `:479` 1027 字符）。本席笔 = §5；改 §3 属越笔 ⇒ 不修、不动，交父侧路由 |

### 5.7 本笔内的格律修正（自报）· 交付门终读

- **`:544` 原为 305 字符单段** ⇒ 拆为两段（同一笔、同一作者、零语义改动；交付门在轮内点出，故在轮内修）。§5 全部文字仍由本席独笔。
- **交付门终读**：`thincoder-core/prompts/persona-engineering.md` = `PASS`（0 命中，1 档全清）；本批档 = `REFUSED` 31 条，命中全在 §3（评审子代理面）`:458`–`:481`——裸档名指针 29 条（未带目录段 ⇒ 解析不到）＋ 段太长 2 条（`:458` 350 字符 ∥ `:479` 1027 字符）。§5 现盘 0 命中。
- **路由**：改 §3 属越笔 ⇒ 本席不修、不动，交父侧。收口前须修，否则 `close` 会被同一门拒。

## §6 验证与收口（父代理）

## 收口（2026-10-26 01:14 · 父侧）

**状态行**：已收口

### 一、交付结果

| 面 | 落点 | 读数 |
|---|---|---|
| **提示词** | `thincoder-core/prompts/persona-engineering.md:164`（原 `:164`/`:165`/`:166`/`:168` 删，`:167` 改写为单行判据句） | 退役族八串全档 **0**（`Three exception` ∥ `Face boundary` ∥ `Face-boundary` ∥ `small edits` ∥ `mechanical form` ∥ `own write domain` ∥ `All three must be marked`）；`content-writing on a dispatched surface` = **1**；463 → 459（read 口径） |
| **设计档 D1 行** | `DOC-DISCIPLINE.md:18` | 唯一；不含 `三条例外` ∥ `面界` ∥ `②` ∥ `③` ∥ `D1 细则` ∥ `不看改动大小` |
| **设计档 D1 细则块** | 同档 `:28-43` 整块删（15 行 + 相邻空行） | 全档 `D1 细则` = **0** |
| **兄弟档两处** | `LIGHT-CHANNEL.md:366` · `PROMPT-SYSTEM.md:259` | 两档 `三类例外` ∥ `三条例外` ∥ `Three exception categories` ∥ `D1 细则` 各 **0** |
| **需求档两行**（父侧笔） | `ENGINEERING-MODE-V2.md:608` / `:690` | 两行各含「需求档归主 agent 写」；全档 `三类例外` ∥ `三条例外` ∥ `D1 细则` 各 **0** |

### 二、验收读数

- **AC-1**：`zero=[] keep=1 max=300` ⇒ exit 0
- **AC-10**（五档退役族）：`D1 细则` ∥ `三类例外` ∥ `Three exception categories` 各 0；`三条例外` 仅设计档恰 1（`:1820` 同名不同物，§九 已裁排除）
- **AC-6**：两归档路径 `git diff --stat` 输出空
- **AC-8**：开工前后 `git status --porcelain` 39 行 / 39 行，成员相同
- **`doc_check`**：五个改动档 + 本批档 = **PASS（0 条）**

### 三、本轮的三次判断纠偏（都由子代理提出，我采纳）

1. **设计席 `#1` 推翻我的 §1 边界**：我写「不动 D1 细则块」，它实测发现该块 7 条 bullet 有 6 条以 ②③ 为对象——②③ 撤了就是留尸。改判「整条撤到底」。
2. **设计席 `#3` 改评审的措辞**：评审建议「其余三面」，它落成「其余**两**文档面」——因为同一行已把需求档写进「父侧落笔面」，再列进「其余」即同句自相矛盾。
3. **实施席 `#4` 拒改三条邻居发现**：`persona-engineering.md:180`/`:186` 的两处近义表述在 E1 声明面之外，它只报不改——避免擅改偏离设计。

### 四、本批的意义

**「父侧直笔三条例外」整条装置消失**，四层同撤：

- 提示词里不再有这段（①是归属事实、②③空转，一条不留）
- 设计档里不再有它的细则块
- 兄弟档两处指针随之归零
- 需求档 D1 行改为纯归属句

**留下的只有归属**：批档 §1/§4/§6 · 台账 · 需求档归主 agent；设计档面 ∥ 提示词面走各自唯一作者的全链；代码笔归轻通道。

### 五、遗留（三条知会项，未改）

1. `persona-engineering.md:180`「Fix in place first … get fixed on the spot」——最近的「小修现场改」授权句，无面界限定；按设计 §二「②③ 在自有写域内空转」读则无损。
2. 被删的打标句覆盖 ① 面（需求档 ∥ 台账 ∥ 批档笔）的留痕，现由批档 §1 已定决定形 ∥ 台账行 ∥ 段落作者身份结构性承载；该档 `direct execution` 现为 0 命中。
3. `persona-engineering.md:186`「(… mechanical corrections)」是 ② 的近义标签，族扫 `mechanical form` 抓不到——属职责句、非跨面授权。

三条均为**记录性**，不改。
