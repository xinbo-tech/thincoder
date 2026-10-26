# 2026-10-26 · 父侧直笔例外的面界
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-26 · 来源 = 用户 2026-10-26 00:10「狗屁！我那说的是轻通道！结果你借这句话给自己开了个大洞！」+ 00:14「提示词里改掉啊！你他妈的口头跟我说这么一句有用吗？」。
> 台账 = #1798（ENGINEERING-MODE · 归批）。前情 = 2026-10-26-light-terms-cleanup.md（在途）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**用户口径（唯一判据，逐字）**

> 狗屁！我那说的是轻通道！结果你借这句话给自己开了个大洞！（2026-10-26 00:10）

> 提示词里改掉啊！你他妈的口头跟我说这么一句有用吗？（2026-10-26 00:14）

**问题**：提示词里那三条例外，把「父侧可以直接写」开到了设计档、需求档、提示词面上——而那三面各只有唯一作者，不属于父侧。缺的不是解释，是**面界**。

**实读坐标（2026-10-26 00:15）**

| 位置 | 现文（节选） | 问题 |
|---|---|---|
| `thincoder-core/prompts/persona-engineering.md:164` | `**Three exception categories**: ① your own write domain (batch record §1/§4/§6 · ledger · requirement docs) ② purely mechanical form corrections (line folding / pointer form / counts) ③ small edits (single-line / table-level · ...` | ② ③ **未限定面界** ⇒ 读成「设计档 ∥ 需求档 ∥ 提示词面也可直改」 |
| 同档 `:165` | `**All three must be marked** ...` | 只规定打标，未规定面界 |

**用户原话的真实所指**：会话 slot 36 `idx 846`——「这种小修改以后你自己搞，不要发给eng-designer」，讲的是**轻通道里的小事省一轮派单**，不是设计档直笔授权。

**已在册的反证**：`docs/core/requirements/LIGHT-CHANNEL.md:33` 逐字——「**面界**：轻通道只作用于**代码笔**——提示词面 ∥ 设计档面 ∥ 需求档面不入直改（三面各有唯一作者）」。轻通道自己就已划清面界。

**本批要做的**

1. `thincoder-core/prompts/persona-engineering.md:164` 的三条例外**补面界**：② ③ 只作用于**父侧自有写域内**；设计档面 ∥ 需求档面 ∥ 提示词面**一律不得直笔**（走全链）。
2. 同档 `:165` 打标句随动。
3. 连带收正：`docs/core/design/DOC-DISCIPLINE.md` 的 D1 行（`:18`）与 `docs/core/requirements/ENGINEERING-MODE-V2.md:602` 同口径补面界；归档档 `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md:425` 的引用失真（把轻通道的话安成直笔授权）**按 D8 删除失真引用**（归档档是否纳入由设计定）。

**不做的**：不改 ① 自有写域（批档 §1/§4/§6 · 台账 · 需求档归父侧）· 不改轻通道准入面 · 不新增机械门 · 不动 `:42` / `:48` 的工程工具面口径（那是另一面，已正确）。

**流程**：设计（设计席）→ 用户触发/整批令评审 → 批准 → eng-coder 落提示词面（提示词 = 产品代码面，唯一作者 eng-coder）。

**并行说明**：`2026-10-26-light-terms-cleanup.md` 在途（评审 round 2 进行中），两批文件域不交（该批动设计档与批档，本批动提示词面 + D1 行）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮二（评审 #9 九条）已落 · 现行态 = §十 · E1 待 eng-coder）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>


### 一、本批条目（覆盖 / 不覆盖）

| # | 条目 | 面 | 本批 |
|---|---|---|---|
| E1 | 提示词面三条例外补面界（`thincoder-core/prompts/persona-engineering.md:164-165`） | 产品代码面（eng-coder 落） | ✅ 覆盖 |
| E2 | 设计档 D1 行同口径补面界 + 新增「D1 细则」块（`docs/core/design/DOC-DISCIPLINE.md` §1） | 设计档面（本席） | ✅ 已落 |
| E3 | 兄弟档随正：`docs/core/design/LIGHT-CHANNEL.md:366` 的「三类例外本体零动」改面界指针 | 设计档面（本席） | ✅ 已落 |
| E4 | 需求档 D1 行同口径补面界（`docs/core/requirements/ENGINEERING-MODE-V2.md:602`） | 需求档面（主 agent） | ✅ 覆盖·非本席写域 |
| E5 | 归档档 `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md:425` 失真引用 | 归档面 | ❌ 不入本批（KD-3） |
| N1 | ① 自有写域 / 轻通道准入面 / 工程工具面两条硬约束 / 零机械门 | — | 边界，不动（§七） |

### 二、设计落点与机制设计

**落点 = 就地更新**：写权矩阵的权威位置是 `docs/core/design/DOC-DISCIPLINE.md` §1 的 D1 行，本批不新建档（新建 = 同一机制两处，随触即漂）。机制正文 = 本档 §1 新增「D1 细则（父侧直笔例外的面界）」块；D1 行加面界摘要并指该块（D2 单源）。

**机制（现行态）**：

- **面界三面（闭枚举）**：设计档面 = `docs/**/design/**`；需求档面 = `docs/**/requirements/**`；提示词面 = `thincoder-core/prompts/**`。三面各有唯一作者，父侧在其上无直笔——不看改动大小。
- **②③ 射程 = 父侧自有写域**（批次档 §1/§4/§6 · 台账 · 需求档）；跨面即失效：判据只看落笔面。
- **① 讲归属，②③ 讲旁路**：① 说哪几面归父侧（落笔 = 作者身份行使）；②③ 说哪几类改动可省掉修正轮。把一面记作自有写域 ≠ 把 ②③ 开到它上面——需求档仍归父侧（① 零动），其落笔前提仍是需求确认门，不以 ②③ 之名落笔。
- **判据句**：父侧以 ②∥③ 之名在面界三面露笔 ⇒ 判违规（与「机械形态收正未打标」同级）。三面只有一条路 = 全链。

**为什么这样切（依据）**：用户 2026-10-26 00:10 逐字「提示词里那三条例外，把父侧可以直接写开到了设计档、需求档、提示词面上」；实证 = 提示词 ②③ 原文无面界限定。同源先例 = 轻通道自己的面界句（`docs/core/design/LIGHT-CHANNEL.md` §5 边界），本批与之对齐（同一三面、同一结论），差异只在本批把它写进写权矩阵本体——轻通道只覆盖代码笔，写权矩阵覆盖全部笔。

### 三、逐字 EN 落笔块（E1）

**唯一实施文本 = §十.3**（三行整 · 逐行给锚 · 行宽实测）；本批不存第二份围栏，第二份即「两处一漂」。

### 四、受影响文件与测试覆盖

| 文件 | 现读行数 | 预计增量 | 面 / 笔 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 459 | +3（→ 462） | 产品代码面 · eng-coder |
| `docs/core/design/DOC-DISCIPLINE.md` | 1569（改前实测） | +≈15（D1 细则块）| 设计档面 · 本席已落 |
| `docs/core/design/LIGHT-CHANNEL.md` | 405 | ±0（同行替换） | 设计档面 · 本席已落 |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 1121 | ±0（同行替换） | 需求档面 · 主 agent |
| `docs/core/design/LIGHT-CHANNEL.md` §2.10 的 as-of 坐标「第 211–218 行」 | — | 同上档 | **实施后同轮随正**（提示词 +3 行 ⇒ 该落笔块位移） |

**测试覆盖**：本批是文本面（提示词 + 三档文档），无可跑单元；改面判据 = §五 的逐条 node 行扫 + 交付门 `doc_check`。**零新增测试文件**——不引入「按批新建、用后即删」的空壳。

### 五、验收对照（机器可验，逐条回指）

回指 = §一 的 E1–E4。命令一律 cwd = 仓根、ASCII 安全（中文串用 `\u` 转义，避 `findstr` 编码坑）。

| # | 判据 | 命令（node -e / git） |
|---|---|---|
| AC-1 | E1：`Face boundary` 恰 1 处；三面名齐；全档逐行 ≤300 字符 | `node -e "const s=require('fs').readFileSync('thincoder-core/prompts/persona-engineering.md','utf8');const a=s.split('Face boundary').length-1;const d=(s.match(/design-doc face/g)||[]).length,r=(s.match(/requirement-doc face/g)||[]).length,p=(s.match(/prompt face/g)||[]).length,mx=Math.max(...s.split(/\r?\n/).map(l=>[...l].length));console.log('fb='+a+' d='+d+' r='+r+' p='+p+' max='+mx);process.exit(a===1&&d>=1&&r>=1&&p>=1&&mx<=300?0:1)"` |
| AC-2 | E2：D1 行含「面界」；「D1 细则」块在档 | `node -e "const s=require('fs').readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8');const h=s.split(/\r?\n/);const row=h.find(l=>l.startsWith('| D1 |'))||'';const blk=h.filter(l=>l.includes('D1 \u7ec6\u5219')).length;console.log('row='+(/\u9762\u754c/.test(row))+' blk='+blk);process.exit(/\u9762\u754c/.test(row)&&blk>=1?0:1)"` |
| AC-3 | E3：`docs/core/design/LIGHT-CHANNEL.md` 的「三类例外本体零动」命中 = 0，且面界指针在位 | `node -e "const s=require('fs').readFileSync('docs/core/design/LIGHT-CHANNEL.md','utf8');const old=s.includes('\u4e09\u7c7b\u4f8b\u5916\u672c\u4f53\u96f6\u52a8');const ptr=s.includes('D1 \u7ec6\u5219');console.log('old='+old+' ptr='+ptr);process.exit(!old&&ptr?0:1)"` |
| AC-4 | E4：需求档 D1 行含「面界」（主 agent 落） | `node -e "const s=require('fs').readFileSync('docs/core/requirements/ENGINEERING-MODE-V2.md','utf8');const row=s.split(/\r?\n/).find(l=>l.startsWith('| D1 |'))||'';console.log('row='+(/\u9762\u754c/.test(row)));process.exit(/\u9762\u754c/.test(row)?0:1)"` |
| AC-5 | E5：两处归档面零 diff | `git diff --stat -- docs/core/requirements/_archive docs/core/design/_archive`（输出为空） |
| AC-6 | 交付门：本批点过的文档整档机检 | `doc_check`（`mode:"gate"`，docs = 上表四档 + 本批档）⇒ 首行 `DOC-CHECK GATE: PASS` |
| AC-7 | 清单外零改动 | `git status --porcelain` ⊆ §四 表 ∪ 本批档 |

### 六、关键决策（含被否选项）

| # | 决策 | 否掉的选项与理由 |
|---|---|---|
| KD-1 | 落点在 `docs/core/design/DOC-DISCIPLINE.md` §1 就地加「D1 细则」块 | 新建专项设计档 ⇒ 同一机制两处（D2），下一批必漂 |
| KD-2 | 面界写「②③ 只在自有写域内 + 三面不直笔」，并显式拆开「① 讲归属 / ②③ 讲旁路」 | 只写「三面不直笔」⇒ 与 ① 表面冲突（需求档同时是自有写域），评审必红线；只写 ① 不变 ⇒ 洞照旧 |
| KD-3 | **归档档不纳入**（E5 不落笔） | 归档不作现状依据、不入扫描域（本档边界句，as-of `docs/core/design/DOC-DISCIPLINE.md:1979`）；改归档 = 重写已结账，且读者不据其行事。失真引用的现实风险由现行权威面（D1 行 + 细则块）承担 |
| KD-4 | 逐字 EN 放本批 §2，机制语义放设计档 | 逐字文本是实施目标（一次性）；把 EN 抄进设计档 = 一次性内容进长文档，下批覆盖即腐 |
| KD-5 | 判据只认落笔面，不认字数/形态 | 以「改动多小」开的口子正是本次事故形态（「小修改」被读成三面通行证） |
| KD-6 | 零新增机械门 | 用户口径 = 缺的是面界不是闸；三面各有唯一作者，靠角色契约 + 评审核验（与 D1 既有「无机械门」一致） |

### 七、边界（本批不做）

- 不改 ① 自有写域（批次档 §1/§4/§6 · 台账 · 需求档归父侧）。
- 不改 `docs/core/requirements/LIGHT-CHANNEL.md` §2.1 的准入面（三样清单 / 一句边界 / 面界句）；只随正设计档的咬合行（E3）。
- 不动 `thincoder-core/prompts/discipline-engineering.md:42` / `:48` 的工程工具面两条硬约束（另一面，已正确）。
- 不动归档档（KD-3）；不新增机械门；不改写权矩阵的六段作者分配。

### 八、上抛项 / 扫面读数

① **[上抛·知会] 兄弟档残差（非阻断，未处置）**：`docs/core/design/PROMPT-SYSTEM.md:259` 的「「父侧不代笔」交界」句仍按三条例外裸名复述（自有写域 / 机械形态收正 / 小修改），无面界指针，且其坐标 `:73-74` 已陈旧（三条例外现居 `:164-165`）。**处置建议**：把裸名复述换成 `docs/core/design/DOC-DISCIPLINE.md` §1 D1 细则指针（D2 去重 + 面界随正）。本席未落 = 该行不在 §一 条目内，进本批属扩范围。读法：该句是**约束句**（「不越」），不构成放行语，故非阻断。

② **[上抛·待裁] 需求侧一笔无人代落**：E4（`docs/core/requirements/ENGINEERING-MODE-V2.md:602`）是需求档面 = 主 agent 笔，本席按边界不落。其判据形态 = AC-4；措辞口径与本席 D1 行同义（可整段照搬 D1 行面界半句 + 指向本块）。

③ **勘察证据行**：manifest `docRoot.design` / `docRoot.requirements` 已读；`index.publicRepos = []` ⇒ **无跨仓公共源可查**（非「查过无关」）。

已读面 = `docs/core/design/DOC-DISCIPLINE.md` §1 D1/D8 块 · `docs/core/design/LIGHT-CHANNEL.md` §5 边界与咬合表 · `docs/core/requirements/LIGHT-CHANNEL.md` §2.1 · `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1。

另读 `docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md:425` · `thincoder-core/prompts/persona-engineering.md:164-165` · `docs/core/design/prompts/`（**已不存在**——中文镜像随 2026-10-19 批删除，故面界三面只列运行期一面）。

④ **设计轮机检读数**：`doc_check`（report 态，三档）⇒ `命中 0 条（锚 0 · 段太长 0 · 行太长 0）`。

### 九、修正轮（父侧 2026-10-26 令 · 两笔，均已落）

| # | 落点 | 改法 | 读数 |
|---|---|---|---|
| F-1 | `docs/core/design/PROMPT-SYSTEM.md:259` | 裸名复述（自有写域 / 机械形态收正 / 小修改）⇒ 「三条例外」+ **面界指针**（`docs/core/design/DOC-DISCIPLINE.md` §1 D1 细则）；陈旧坐标 `thincoder-core/prompts/persona-engineering.md:73-74` ⇒ 内容锚（该档 `Three exception categories` 块） | 旧坐标 = 0 · 裸名集 = 0 · D1 指针 = 1 · 内容锚 = 1 · 行宽 283 ≤ 300 |
| F-2 | `docs/core/design/LIGHT-CHANNEL.md` §2.10（`:281` / `:285` / `:317`） | as-of 行号坐标 ⇒ 内容锚（轻通道块 bullet 头起 8 行 · `**Start-up booking**` 块起不动） | `第 211–218 行` = 0 · `第 219 行` = 0 · 内容锚 3 处 · 行宽 259 / 262 / 149 |

**F-2 的取值理由（不写预计值）**：父侧口径 = 按落笔后的实读。实读 = 提示词面**尚未落笔**（`Face boundary` 命中 0 ⇒ E1 未落）——现盘 `thincoder-core/prompts/persona-engineering.md` = 460 行、轻通道块实在 `:211–218`（本轮逐行实读）。E1 落 3 行后该块必移至 214–221，那是纸上推的**预计值**，不作读数写入；故坐标改成内容锚（落笔前后均成立）。落笔后若仍要行号，随 E1 落地轮同轮实读补。

**读账（未改 · 出处注）**：`docs/core/design/LIGHT-CHANNEL.md:317` 的「现量 459 行」与 `:345` 勘察行 `thincoder-core/prompts/persona-engineering.md:211-228` = 该批落笔轮的 as-of 读数（带日期），按 D8 两分判据属出处注，不收正。

**扫面读数**：`thincoder-core/prompts/persona-engineering.md` 现 **460 行**（§四 记的 459 已被轻通道批落笔 +1 覆盖）；`doc_check` gate（两档整档）= **PASS**（0 条命中）。

**§八处置**：① 已由 F-1 落地，撤回上抛；② E4 父侧已按 AC-4 落，本席不重做。

**§四 行数面的更正（供 E1 实施席）**：§四 表内 `thincoder-core/prompts/persona-engineering.md` 的「现读 459 → +3 → 462」是设计轮读数，现盘已 460（轻通道批落笔 +1）⇒ **+3 的增量不变**，落笔后计数以实施轮实读为准（纸上预计 = 463，不作验收条）。AC-1 不判行数（判 `Face boundary` 计数 + 三面名 + 逐行 ≤300），故该漂移不影响本批验收。

### 十、修正轮二（评审 #9 · 九条全接受 · 2026-10-26）

**本节即 §2 现行态**。与 §三 围栏 / §四 表 / §五 的 AC-1·AC-2·AC-6·AC-7 / §六 KD-2 / §七 末条 相抵处，一律以本节为准。E1 实施照抄 = §十.3 围栏（三行整，不是 §三 的两行）。

#### 十.1 条目补行（评审 4）

| # | 条目 | 面 | 本批 |
|---|---|---|---|
| E6 | `docs/core/design/PROMPT-SYSTEM.md` 的裸名复述 ⇒ 面界指针；陈旧坐标 ⇒ 内容锚（§九 F-1） | 设计档面（本席） | ✅ 已落 |
| E7 | `docs/core/design/LIGHT-CHANNEL.md` 的 as-of 行号坐标 ⇒ 内容锚（§九 F-2） | 设计档面（本席） | ✅ 已落 |

#### 十.2 受影响文件表（替代 §四 表 · 评审 4 + 6）

| 文件 | 面 · 笔 | 当前行数 | 预计增量 |
|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 产品代码面 · eng-coder（E1） | 460 | +3（→ 463） |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档面 · 本席（E2 + 本轮三笔） | — | — |
| `docs/core/design/LIGHT-CHANNEL.md` | 设计档面 · 本席（E3 · E7） | — | — |
| `docs/core/design/PROMPT-SYSTEM.md` | 设计档面 · 本席（E6） | — | — |
| `docs/core/requirements/ENGINEERING-MODE-V2.md` | 需求档面 · 主 agent（E4） | — | — |
| `docs/batches/2026-10-26-parent-write-scope.md` | 记录面 · 本席 §2 | — | — |

`.md` 行两列填 `—`（行保留）——口径 = `docs/core/design/DOC-DISCIPLINE.md` §3.7 条目 H 的批次档同口径条。行数只留提示词面一档：`thincoder-core/prompts/persona-engineering.md` 现读 460 行（本轮实读）。

#### 十.3 逐字 EN 落笔块（三行 · 替代 §三 围栏 · 评审 2 + 3）

**落点** = `thincoder-core/prompts/persona-engineering.md`。现 `:164`（`**Three exception categories**` 起行）与现 `:165`（`**All three must be marked**` 起行）两行**文字零改**。

- **行 1、行 2**：插在现 `:164` 之后，先 1 后 2；两行均行首缩进 **2 格**。
- **行 3**：插在现 `:165` 之后，行首缩进 **2 格**。
- 净 +3 行：460 → 463。

```text
  **Face boundary**: ② and ③ hold inside your own write domain only — the design-doc face ∥ the requirement-doc face ∥ the prompt face take no ②/③ pen, whatever the size (each has exactly one author, and a change there walks the full chain).
  ① states ownership, ②③ state a bypass — naming a face as yours does not put ②③ on it; the requirement doc stays yours under ①, and its pens still wait for the requirement confirmation.
  **Face-boundary judgment line**: a ②/③ pen landing on the design-doc face ∥ the requirement-doc face ∥ the prompt face ⇒ violation.
```

三行实测行宽 = **241 / 185 / 133** 字符（提示词面阈值 300，均有余量）。

行 1 的限定语 = 评审 2 的落法：不落笔的是 **②③ 的笔**，不是 ①——需求档仍归父侧（① 零动），确认门照旧。口径与 `docs/core/design/DOC-DISCIPLINE.md` §1 的 D1 行、D1 细则块同源。

#### 十.4 集成测试设计（起点 = `test/RTM.md` · 评审 1）

**判定 = none。**

**RTM 索引** = `test/RTM.md`（仓根，在盘——本席实读：CLI 端 9 个故事节 26 例；VS Code 端 ∥ Desktop 端尚无集成用例，仅有空表与「编号先行」注；异常与更正 ∥ 签署面无用例行）。

**逐节对账**：故事 1 工具结果回放（1-1~1-3）∥ 2 未立项写产品码提醒（2-1~2-3）∥ 3 网页抓取后端故障（3-1~3-3）∥ 4 浏览器等待窗口（4-1~4-3）∥ 5 顾问超时热改（5-1~5-3）∥ 6 设计评审文档范围（6-1~6-5）∥ 7 收口只判本批改过的档（7-1~7-3）∥ 8 批档建在项目里（8-1~8-2）∥ 9 项目根解析（9-1）——**无一节断言直笔例外的面界 ∥ 提示词正文 ∥ 设计档写权**；破行 0 ∥ 冗余 0 ∥ 新增 0。

**判定理由（两入口逐条对）**：① 业务场景 = 无——本改是角色契约文本（谁在哪一面落笔），不是用户走得到的业务路径；② 生产问题 = 无产物——本次事故的形态是提示词被读宽，验法是文本读数（AC-1~AC-4）+ 交付门，不是可跑用例。

**组件交互面**：零改——改动面 = 提示词正文三行 + 三档文档的文字；工具层 / 装配面 / 参数管道零触。

#### 十.5 验收对照（替代 §五 的 AC-1 · AC-2 · AC-6 · AC-7）

AC-3 / AC-4 / AC-5 照 §五 原样。下表为替换后的四行；命令 cwd = 仓根、ASCII 安全。

| # | 判据 | 命令 |
|---|---|---|
| AC-1 | E1：`Face boundary` 恰 1 处；三面名齐；全档逐行 ≤300；**§十.3 围栏正文行数 = 3**（评审 3） | 见下方 AC-1 码块 |
| AC-2 | E2：块标题行 `**D1 细则（父侧直笔例外的面界）**：` 在位；该块 **bullet = 7 条**；D1 行含「面界」（评审 5） | 见下方 AC-2 码块 |
| AC-6 | 交付门：产品内建 `doc_check`（`mode:"gate"`，docs = §十.2 表六档）⇒ 首行 `DOC-CHECK GATE: PASS`。**跑的是产品内建工具**（口径 = `docs/core/design/DOC-DISCIPLINE.md` §3.20 条目 S）——不是 `scripts/doc-check.mjs`：后者按禁调令不得运行，其读数不作判据（评审 9） | 工具调用 |
| AC-7 | 清单外零改动：`git status --porcelain` ⊆ §十.2 表 ∪ 本批档（评审 4） | `git status --porcelain` |

**AC-1 命令**：

```js
node -e "const fs=require('fs');const s=fs.readFileSync('thincoder-core/prompts/persona-engineering.md','utf8');const t=fs.readFileSync('docs/batches/2026-10-26-parent-write-scope.md','utf8');const F=String.fromCharCode(96).repeat(3);const sec=t.split('#### \u5341.3')[1].split('#### \u5341.4')[0];const n=sec.split(F)[1].split(/\r?\n/).slice(1).filter(l=>l.trim()).length;const fb=s.split('Face boundary').length-1;const d=(s.match(/design-doc face/g)||[]).length,r=(s.match(/requirement-doc face/g)||[]).length,p=(s.match(/prompt face/g)||[]).length,mx=Math.max(...s.split(/\r?\n/).map(l=>[...l].length));console.log('fb='+fb+' d='+d+' r='+r+' p='+p+' max='+mx+' fence='+n);process.exit(fb===1&&d>=1&&r>=1&&p>=1&&mx<=300&&n===3?0:1)"
```

**AC-2 命令**：

```js
node -e "const fs=require('fs');const h=fs.readFileSync('docs/core/design/DOC-DISCIPLINE.md','utf8').split(/\r?\n/);const i=h.findIndex(l=>l.startsWith('**D1 \u7ec6\u5219'));const j=h.findIndex((l,k)=>k>i&&l.startsWith('**D8 \u7ec6\u5219'));const n=i<0?-1:h.slice(i+1,j<0?h.length:j).filter(l=>l.startsWith('- ')).length;const row=h.find(l=>l.startsWith('| D1 |'))||'';console.log('title='+(i>=0)+' bullets='+n+' row='+(/\u9762\u754c/.test(row)));process.exit(i>=0&&n===7&&/\u9762\u754c/.test(row)?0:1)"
```

**bullet 条数取 7 不取评审建议的 5**：块内实读 = 面界三面 / ②③ 射程 / ①讲归属②③讲旁路 / 三面只有一条路 / 依据 / 归档档不入射程 / 落点分工。判据断言实读数（D3——计数与列表同时改）。

#### 十.6 新名字三问答（评审 7）

| 新名字 | 三问答 |
|---|---|
| `Face boundary`（提示词面新标签） | `none found:` 已查 `thincoder-core/prompts/**`（`Face boundary` 全文 **0** 命中，grep 实读）与 `thincoder-core/prompts/persona-engineering.md` 的 ②③ 块（现 `:164-165`）——无既存面界标签 ⇒ 新建；形状对齐同档既有标签（`**X**:` 起行 + 续行缩进 2 格） |
| 「D1 细则」（设计档块名） | `existing: docs/core/design/DOC-DISCIPLINE.md:44` · `name: "D8 细则（失效表达必删）"` · `consumers: D8 行（:25）的「细则见下方 D8 块」` ⇒ 同形复用，不另立文法 |

#### 十.7 KD 补记（评审 2）

| # | 决策 | 否掉的选项与理由 |
|---|---|---|
| KD-2（收正） | 面界写「**②③ 在面界三面一律不落笔**；① 的归属与需求确认门不动」，并显式拆开「① 讲归属 / ②③ 讲旁路」 | 只写「三面不直笔」而无 ②③ 限定 ⇒ 与 ① 字面冲突（需求档同时是自有写域），模型读成「父侧永远不能写需求档」；只写 ① 不变 ⇒ 洞照旧 |

#### 十.8 §七 末条的现行射程（评审 4）

§七 的现行射程 = §十.2 表的六行。`docs/core/design/PROMPT-SYSTEM.md` 已在 §九 F-1 改动，不在「不改」面内。

#### 十.9 本轮读数

- `docs/core/design/DOC-DISCIPLINE.md`：D1 细则块标题在位 · bullet **7** 条 · D1 行含「面界」· `:1979` 命中 **0** · 内容锚（本档 §4.6 边界）在位 · 全档 2494 行。
- 提示词面现读：**460 行** · 逐行最大 **300** 字符 · 超 300 的行 **0**（E1 未落，`Face boundary` 命中 0）。
- 三行 EN 实测行宽：**241 / 185 / 133**。
- RTM 实读：CLI 端 9 节 26 例；VS Code ∥ Desktop 两端仅空表。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：父侧直笔三例外补面界批（设计档面 ∥ 需求档面 ∥ 提示词面一律不直笔）· 状态 = 待评审

**已读面**：`docs/batches/2026-10-26-parent-write-scope.md` 全文 · `docs/core/design/DOC-DISCIPLINE.md`（§1 D1/D1 细则/D8 细则 · §3.7 批次档同口径 · §2 禁调句 · §3.20 S · §4.6 边界 · 档尾）· `docs/core/design/LIGHT-CHANNEL.md` 全文（475 行）· `docs/core/design/PROMPT-SYSTEM.md`（§:259 及 `persona-engineering` 命中面）

**实测读数（本轮回读）**：`docs/core/design/DOC-DISCIPLINE.md` = 2494 行（§四 记 1569）· `docs/core/design/LIGHT-CHANNEL.md` = 475 行（§四 记 405）· `docs/core/design/PROMPT-SYSTEM.md:259` 面界指针在位 · `docs/core/design/LIGHT-CHANNEL.md:366` 旧句已收正 · 勘察/先例两行在位

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Integration test | 🔴 | §2 无「集成测试设计」节，全文零处读 `test/RTM.md`（grep `RTM`/`集成` 命中 0）；§四只写「本批是文本面（提示词 + 三档文档），无可跑单元」。同批同届的同形先例已给该形的判据式：`docs/core/design/LIGHT-CHANNEL.md:470` 逐字「RTM 索引 = `test/RTM.md`（仓根，在盘」＋`:472` 逐节对账「无一节断言路由问句 ∥ 提示词正文」⇒ 判定 none 附理由 | 补一节「集成测试设计（起点 = `test/RTM.md`）」：逐故事列破行 / 冗余 / 缺失，或按唯一可采理由声明判定 = none（本改动不改既有用例所断言的业务可观察结果、不新增产品真需要场景）；不写整套跑的命令 |
| 2 | Requirements / ownership | 🔴 | 同一机制两处两说法：`docs/core/design/DOC-DISCIPLINE.md:18` 先写「需求档（项目需求 + 功能规格）= 主 agent」，同句又写「**设计档面 ∥ 需求档面 ∥ 提示词面一律不直笔**」；细则 `:30` 无保留语复述「父侧在其上无直笔——不看改动大小」，而 `:34` 写「需求档仍归父侧（① 零动）」。这句话正被搬进提示词面（`batch:74`「the requirement-doc face ∥ the prompt face are never direct-pen targets」），且本批 E4 实落 = 父侧落需求档笔（`batch:154`）——按 `:30` 字面即判违规 | 把 `:18` 与 `:30` 两处不直笔句一律限定到 ②③（如「②③ 在面界三面一律不落笔——① 的归属与需求确认门不动」），EN 首行同口径补齐限定语 |
| 3 | Clarity | 🔴 | E1 = 唯一实施项，逐字块不完整且位置自相矛盾：`batch:71` 写「在其后插入两行；…其后插一行。净 +3 行」，`batch:80` 写「三行实测长度 = **267 / 175 / 100**」，但围栏块只有 2 行（`batch:74-75`）；第三行只以散文形式出现——`batch:78` 逐字「第二行插在 `a ②/③ pen landing on the design-doc face ∥ the requirement-doc face ∥ the prompt face ⇒ violation.` —— 接在现 `:165` 的判据句之后」，既把它记作「第二行」又与 `:71` 的「其后插入两行」（插在 `:164` 后）相抵，且真正的第三行落点从未写明；AC-1（`batch:100`）判不出两者的差别 | 把 3 行全部放进同一围栏块，逐行给锚（行 ∥ 缩进 ∥ 插在 `:164` 后还是 `:165` 后），删掉 `batch:78` 的散文复述 |
| 4 | Acceptance | 🔴 | AC-7 的可改集漏掉本批已落的一档：`batch:106` 写「`git status --porcelain` ⊆ §四 表 ∪ 本批档」，但 F-1 已改 `docs/core/design/PROMPT-SYSTEM.md`（`batch:145`），该档在 §四 表（`batch:84-90`）与 §一 条目（`batch:47-53`）中均无行；§七 仍写「不改 `docs/core/design/PROMPT-SYSTEM.md:259`（见 §八 ①）」（`batch:125`）⇒ AC-7 按字面把本批自落的改动判成清单外 | §一/§四 补 docs/core/design/PROMPT-SYSTEM.md 行与 F-1/F-2 条目，删 `batch:125` 的边界句（已由 §九 撤回） |
| 5 | Acceptance | 🟡 | AC-2 的块存在性判据恒真：`blk = h.filter(l=>l.includes('D1 细则')).length`，而 D1 行自身含「细则见下方「D1 细则」块」（`docs/core/design/DOC-DISCIPLINE.md:18`）⇒ 块整块删掉 `blk >= 1` 仍成立 | 改锚块标题行（`docs/core/design/DOC-DISCIPLINE.md:28`「**D1 细则（父侧直笔例外的面界）**：」）并断言其 bullet 条数（5 条） |
| 6 | Methodology / size annotations | 🟡 | §四 给 `.md` 行列了行数，与本档规则相反——`docs/core/design/DOC-DISCIPLINE.md:282` 逐字「**文档档（`.md`）不列该两列**（模板收正 = R2）」；且数字已失真：`docs/core/design/LIGHT-CHANNEL.md` 记「405」（`batch:88`）而盘上 475 行（`docs/core/design/LIGHT-CHANNEL.md:475`），`docs/core/design/DOC-DISCIPLINE.md` 记「1569（改前实测）」（`batch:87`）而盘上 2494 行 | `.md` 行两列填 `—`（行保留），行数只留 `thincoder-core/prompts/persona-engineering.md` 并在实施轮实读 |
| 7 | Existing-piece check | 🟡 | 本改动引入的两个名字无三问答：提示词面新标签 `Face boundary`（`batch:74`）与新块名「D1 细则」（`docs/core/design/DOC-DISCIPLINE.md:28`）——全文无 `existing:` ∥ `none found:` ∥ `existing but unusable:` 行 | 两名字各补一行三问答 |
| 8 | Pointer / doc hygiene | 🟡 | 新增块为「归档不入射程」这一规范结论引的 as-of 坐标已指错处：`docs/core/design/DOC-DISCIPLINE.md:40` 逐字「本档边界句「不动 `_archive/`」——as-of `docs/core/design/DOC-DISCIPLINE.md:1979`」，而该边界句实在 `:1995`（「**不动 `_archive/`**：归档档不作现状依据，也不入扫描域。」），`:1979` 是死指针处置表的一行 | 按本批 F-2 自己的做法（`batch:146`）改成内容锚（本档 §4.6 边界「不动 `_archive/`」条） |
| 9 | Note | 🔵 | AC-6 以 `doc_check`（`mode:"gate"`）作交付门（`batch:105`），同档另一处记着用户的禁调令——`docs/core/design/DOC-DISCIPLINE.md:117` 逐字「禁止调用 `node scripts/doc-check.mjs`」——设计未点明 AC-6 跑的是产品内建工具（条目 S）而非被禁脚本 | AC-6 加半句点名产品工具，免读者当成复跑被禁引擎 |

**计数**：🔴 4 · 🟡 4 · 🔵 1（合计 9）
**未验面（超出评审范围）**：`thincoder-core/prompts/persona-engineering.md`（:164/:165 现文与行数）· `docs/core/requirements/ENGINEERING-MODE-V2.md:602`（E4 已落读数）· `test/RTM.md` 现状 —— 均标 unverified，不据其下结论
**降级说明**：E5（归档档）按 KD-3 不入本批已裁，不再提；轻通道准入面 / 工程工具面 `:42`/`:48` 未开审

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：round 2 复核 · 父侧直笔三例外补面界批（只核 #9 的 4🔴 + 4🟡 + 1🔵 逐条落地，不捕新问题）· 状态 = 待评审

**已读面**：`docs/batches/2026-10-26-parent-write-scope.md` 全文 · `docs/core/design/DOC-DISCIPLINE.md` §1（D1 行 `:18` · D1 细则块 `:28-42` · D8 行 `:25` · D8 细则块 `:44`）· §3.7（`:248-332`）· §4.6（`:1992-1995`）· 档尾（`:2493-2494`）


**回读源（spot-check，非评审对象）**：`thincoder-core/prompts/persona-engineering.md` 尾行 = `:460`（现读 460 ✓）· `:164` / `:165` 逐字与 `batch:174` 所述一致 ✓ · `^.{301,}$` 命中 **0**（逐行 ≤300 成立）· `Face boundary` 命中 **0**（E1 未落，属实）。

**RTM 回读**：`test/RTM.md` 在盘（仓根下），CLI 端 **9 故事节 / 26 例**逐节清点与 `batch:196` 对账**逐一相符**（1:3·2:3·3:3·4:3·5:3·6:5·7:3·8:2·9:1），两端空表 + 「编号先行」注、异常与签署面无用例行亦相符。

**DOC-DISCIPLINE 回读**：现读 **2494 行** · `1979` 命中 **0** · `### 4.6 边界（本层不做）` 在 `:1992` 且 `:1995` 有「不动 `_archive/`」条。

**九条落地读数（逐条）**

- 🔴1 集成测试设计：`batch:190`「#### 十.4 集成测试设计（起点 = `test/RTM.md` · 评审 1）」在位；`batch:194` RTM 索引 + `batch:196` 逐节对账与我实读的 9 节 26 例**逐一相符**；`batch:196` 破行 0 ∥ 冗余 0 ∥ 新增 0 + `batch:198` 两入口理由（业务场景无 / 生产问题无可跑产物）⇒ 落地。
- 🔴2 面界句限定 ②③：`docs/core/design/DOC-DISCIPLINE.md:18` 含「②③ 在面界三面（设计档面 ∥ 需求档面 ∥ 提示词面）一律不落笔，① 的归属与需求确认门不动」；`:30` 含「②③ 在其上一律不落笔，不看改动大小；① 的归属与需求确认门不动」——round 1 点名的无保留语「父侧在其上无直笔」已不在；EN 首行 `batch:181` 同口径「② and ③ hold inside your own write domain only — the design-doc face ∥ the requirement-doc face ∥ the prompt face take no ②/③ pen」⇒ 落地。
- 🔴3 同一围栏 + 逐行锚：`batch:180-184` 单围栏三行（无第二份围栏——`Face boundary` 全批档仅 `:181` 一处落笔；`batch:71` 已改「唯一实施文本 = §十.3（三行整 · 逐行给锚）」）；`batch:176-178` 逐行给锚（L1/L2 插现 `:164` 后·先 1 后 2·缩进 2 格；L3 插现 `:165` 后·缩进 2 格）；AC-1（`batch:216`）的 `fence=3` 复算式按 `sec.split(F)[1]…slice(1).filter(l=>l.trim())` 复算 = 3（我按同式逐段核过 §十.3 与 §十.4 边界）⇒ 落地。
- 🔴4 §一/§四 补行 + 删 §七 边界句：`batch:156-157`（E6/E7）+ `batch:166`（`docs/core/design/PROMPT-SYSTEM.md` 行）+ AC-7 改指 `§十.2`（`batch:211`）；§七 现四条 bullet（`batch:112-115`）已无 PROMPT-SYSTEM 边界句 ⇒ 落地（残 1 条覆盖句，见下表）。
- 🟡5 AC-2 恒真改锚：`batch:222` 锚 `**D1 \u7ec6\u5219` 标题行 + 断言 bullet = 7；实读块 `docs/core/design/DOC-DISCIPLINE.md:28-42` bullet = **7**（`:30`/`:32`/`:34`/`:36`/`:38`/`:40`/`:42`），D1 行 `:18` 含「面界」⇒ 落地（7 ≠ 评审建议的 5，`batch:225` 已给实读理由，与 D3 一致）。
- 🟡6 受影响文件表：`batch:161-168` 四档 `.md` 两列填 `—`（行保留），仅 `batch:163` 留提示词面 `460 → +3`（实读 460 ✓ 算术 463 ✓）；口径与 `docs/core/design/DOC-DISCIPLINE.md:282`「**文档档（`.md`）不列该两列**」一致 ⇒ 落地。
- 🟡7 两名三问答：`batch:231`「`Face boundary`（提示词面新标签）」= `none found:`，附 grep 实读（我复跑 `thincoder-core/prompts/persona-engineering.md` 命中 0 ✓）；`batch:232`「D1 细则」= `existing: docs/core/design/DOC-DISCIPLINE.md:44` · name 逐字「D8 细则（失效表达必删）」✓ · consumers = `:25` 的「细则见下方 D8 块」✓ ⇒ 落地。
- 🟡8 内容锚收正：`docs/core/design/DOC-DISCIPLINE.md:40` 改「（边界句 = 本档 **§4.6 边界**「不动 `_archive/`」条）」；全档 `1979` 命中 **0** ✓；`### 4.6 边界（本层不做）` 在盘 `:1992` 且 `:1995` 有「不动 `_archive/`」条 ⇒ 落地。
- 🔵9 AC-6 点名产品工具：`batch:210`「**跑的是产品内建工具**…不是 `scripts/doc-check.mjs`：后者按禁调令不得运行，其读数不作判据」⇒ 落地。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / doc state | 🟡 | #4 的落地残差：`batch:150` 的覆盖句仍点名「§六 KD-2 / §七 末条 相抵处，一律以本节为准」，而 §七 删掉 PROMPT-SYSTEM 边界句后末条已是「不动归档档（KD-3）；不新增机械门；不改写权矩阵的六段作者分配。」（`batch:115`）——无相抵对象；`batch:240` 的标题「#### 十.8 §七 末条的现行射程（评审 4）」与它唯一正文句 `batch:242`「§七 的现行射程 = §十.2 表的六行。」也已不同指（该句讲的是 PROMPT-SYSTEM 那一行，而它已不在 §七）。两处按字面可读成 KD-3 ∥ 零机械门 两条随 §七 一并作废 | 覆盖句的清单里去掉 `§七 末条` 一项（§七 已无与之相抵的条）；§十.8 的标题与正文改为直接陈述 `§十.2` 表本身的射程，并把 KD-3 ∥ 零机械门 明确为仍现行（引 `§六 KD-3` 与 `§一 E5`，二者已在册、无需重写） |

**计数**：🔴 0 · 🟡 1 · 🔵 0（合计 1）

**判据面局限（记为限制，不计入发现）**：评审上下文无独立项目标准档、无机器可查的文档地图 ⇒ 受影响文件表两列口径、`提示词 = 产品代码面` 两项判据取自本次评审对象 `docs/core/design/DOC-DISCIPLINE.md` §1 D1 与 §3.7（`:282`）；文档归属按 D1/D2 在本档内判（本批就地改 §1 写权矩阵本体，未新建档）。

**未验面（超出本次评审范围，按声明排除）**：`docs/core/design/LIGHT-CHANNEL.md:366` 面界指针 · `docs/core/design/PROMPT-SYSTEM.md:259` 复述改指针 · `docs/core/requirements/ENGINEERING-MODE-V2.md:602`（E4）· 归档档（KD-3）· 提示词面落笔本体（E1 未落，`Face boundary` 命中 0 属实）。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-26（用户：「**提示词里改掉啊！你他妈的口头跟我说这么一句有用吗？**」00:14）

**批准依据**：评审 `#11` = **pass**（🔴 0 · 🟡 1 · 🔵 0），token 已签发，实施席 `#12` 落笔后终态 clean。

**批准范围**：提示词面三行（`persona-engineering.md:165` `:166` `:168`）+ 设计档 D1 行与 D1 细则块 + 兄弟档两处指针 + 需求档 D1 行。

**不在范围**：归档档（KD-3 裁定）· 需求档六段存量超长（另记 `#1799`）· 内部评审 3 条 🔵（可选，未改）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（E1 三行已落 · 提示词档 gate PASS · 终态 clean）

### 一、落笔（唯一实施项 E1）

| 项 | 读数 |
|---|---|
| 落点 | `thincoder-core/prompts/persona-engineering.md`（提示词面 · 本席唯一笔面） |
| 改法 | 现 `:164` 后插 L1 / L2；现 `:165` 后插 L3；三行行首缩进 2 格；原两行文字零改 |
| 现位 | L1 = `:165` · L2 = `:166` · L3 = `:168` |
| diff | `git diff --numstat` ⇒ `3	0`（3 insertions · 0 deletions） |
| 行数 | 460 → **463**（逐行读数，与 §十.2 的 +3 一致） |
| 逐字 | 三行与 §十.3 围栏逐行比对 `identical=true`；实测行宽 **241 / 186 / 133** 码点 |
| 标签计数 | `Face boundary`（带空格）全档 **1** 处 = `:165`；`Face-boundary`（连字符）1 处 = `:168` |

### 二、验收对照（回指 §2 §十.5 · 命令 cwd = 仓根）

| # | 判据 | 实读 | 判 |
|---|---|---|---|
| AC-1 | 三面名齐 / 逐行 ≤300 / 围栏 3 行 | `fb=1 d=2 r=2 p=3 max=300 fence=3`，exit 0 | ✅ |
| AC-2 | D1 细则块 7 bullet + D1 行含面界 | `title=true bullets=7 row=true`，exit 0 | ✅（设计席落） |
| AC-3 | 轻通道旧句零命中 + 面界指针在位 | `old=false ptr=true`，exit 0 | ✅（设计席落） |
| AC-4 | 需求档 D1 行含面界 | `row=true`，exit 0 | ✅（父侧落） |
| AC-5 | 两处归档面零 diff | `git diff --stat`（两归档路径）输出空 | ✅ |
| AC-6 | 交付门 | 提示词档 gate **PASS（0 档全清）** · 本批档 gate **PASS（0 条）** · 六档合跑 REFUSED（6 条，全为需求档既存段） | ✅（按父侧裁法，见三） |
| AC-7 | 清单外零改动 | `git status --porcelain` 基线 **36** 行（他批在途）→ 现 **37** 行；delta 恰 1 = 本档 | ✅（按 delta 判，见三） |

### 三、决策披露与偏差

- **gate 路由 = 父侧裁 B**：首跑六档 gate = REFUSED（11 条），本席笔面 0 条。父侧已修 §3 五处机械项；需求档六段判为**存量债**、另记台账行；AC-6 判在**改动面**成立（提示词档 gate PASS 即本席交付门）。复跑六档 = REFUSED（6 条，全为需求档既存段）。

- **AC-7 只能按 delta 判**：工作区在开工前已带 36 项他批在途改动（含 `thincoder-core/ledger.mjs` · `test/RTM.md` 等），绝对子集读数不可满足。本席 delta = 1 档，属 §十.2 表内。

- **§十.3 行宽第三值需平一字符**：设计记 241 / 185 / 133，实测 **241 / 186 / 133** 码点（阈值 300，验收不判行宽单值）。父侧裁 = 本席报实测值、设计档该字符由父侧收口轮记明。

- **[上抛·知会] 本批改动带出的 as-of 漂移（设计档面 = 设计席笔，本席未改）**：`docs/core/design/LIGHT-CHANNEL.md` 的 `:207`（引 `:218-222`）与 `:345`（引 `:211-228`）按行号指本档；+3 后各早 3 行。`:345` 已由 §九「读账」裁为出处注；`:207` 属同族 as-of。两者均未改，按 D4 属 as-of 参考、非错指。

### 四、审计与评审轮次（终态 = clean）

| 轮 | 面 | 结论 | 处置 |
|---|---|---|---|
| 偏差审计 1 轮 | 内部 explore 只读审（对 §2 逐条） | `VERDICT: clean`——PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST 四类均 0 | 无修正轮 |
| 代码评审 1 轮 | 内部 advisor（`type="code"`，path = 提示词档） | `VERDICT: pass`——🔴 0 · 🟡 0 · 🔵 3（三条均标可选、均落本批边界外） | 无修正轮 |

**修正轮 = 0**；终态 = **clean**。审计另点出两处设计面记录缺口（AC-7 绝对子集不可满足 · 行宽 185/186），均非本席笔面，已在三披露。

### 五、测试线（文本面）

- **单元测试**：本批 = 文本面（提示词正文三行），无可跑单元，**零新增测试文件**。改面判据 = 二 的 node 行扫 + 两档 gate 读数；无 `node --test` 目标。

- **集成测试设计 = none**（§2 §十.4 已逐节对账：RTM 9 节 26 例无一断言写权面界 / 提示词正文）。本席复读 `test/RTM.md` 读数 = 26 例 · 9 故事节，与设计同读。

- **集成集现状**：**26 / 50–100**（CLI 端 9 节；VS Code ∥ Desktop 两端仍空表）。本批新增 0 · 修订 0。未做集成跑——父侧收口跑是唯一一次集成跑。

## §6 验证与收口（父代理）

## 收口（2026-10-26 00:40 · 父侧）

**状态行**：已收口

### 一、交付结果

| 面 | 落点 | 读数 |
|---|---|---|
| **提示词面**（用户令「提示词里改掉」） | `thincoder-core/prompts/persona-engineering.md:165` `:166` `:168`（三行插入，原有 `:164` `:167` 文字零改） | `git diff --numstat` = `3 0` · 逐字对 §十.3 围栏 `identical=true` ×3 |
| **设计档** | `docs/core/design/DOC-DISCIPLINE.md:18`（D1 行）+ `:28-42`（D1 细则块，7 bullet） | AC-2 `title=true bullets=7 row=true` |
| **兄弟档** | `docs/core/design/LIGHT-CHANNEL.md:366`（面界指针）· `docs/core/design/PROMPT-SYSTEM.md:259`（复述改指针） | AC-3 `old=false ptr=true` |
| **需求档**（父侧笔） | `docs/core/requirements/ENGINEERING-MODE-V2.md:602`（D1 行补面界） | AC-4 `row=true` |
| **归档档** | 零改（KD-3 裁定） | `git diff --stat` 两归档路径输出空 |

### 二、验收读数（父侧亲跑）

- **AC-1**：`fb=1 d=2 r=2 p=3 max=300 fence=3` ⇒ exit 0
- **AC-2 / AC-3 / AC-4**：各 exit 0（`#12` 报，父侧抽核 AC-2 的 bullet 计数 = 7 与实读一致）
- **AC-5**：两归档路径 `git diff --stat` 空
- **提示词档 gate**：`doc_check` = **PASS（1 档 · 0 命中）**
- **批档 gate**：**PASS（0 条）**（父侧修 §3 后复跑）

### 三、三条已知偏差（记明，均不阻塞）

1. **设计档行宽读数差 1 字符**：`§十.3` 记 241 / **185** / 133，实测 241 / **186** / 133（阈值 300，验收零影响）。设计席笔，本批不回改（批档 §2 append-only）。
2. **as-of 漂移（`#12` 上抛）**：`docs/core/design/LIGHT-CHANNEL.md:207`（原引 `:218-222`）与 `:345`（原引 `:211-228`）在提示词 +3 行后各早 3 行。按 D4「行号只作 as-of 参考」属合规形态、非错指；`:345` 已由 §九裁为出处注。**不改**。
3. **AC-7 按 delta 判**：开工前工作区已带 36 项他批在途改动，绝对子集读数不可满足；本席 delta = 1 档，属 §十.2 表内。

### 四、本批的教训（实发）

1. **「父侧直笔三例外」曾缺面界**——②③ 没限定「只在自有写域内」，被读成「设计档 ∥ 需求档 ∥ 提示词面也能直改」。用户 2026-10-26 00:10 指出那句原话讲的是**轻通道**，被安成了设计档直笔授权。而 `docs/core/requirements/LIGHT-CHANNEL.md:33` 自己早就写着「提示词面 ∥ 设计档面 ∥ 需求档面不入直改」——**反证一直在项目里，没人把它接到这条上**。
2. **① 讲归属、②③ 讲旁路，必须拆开写**——不拆则「需求档归父侧」与「需求档面不直笔」在读者眼里直接互斥。设计席在 KD-2 里先识别出这一步，是本批最关键的设计判断。
3. **批量改名会把隐藏矛盾撞成显式矛盾**——同一天前一批（`2026-10-26-light-terms-cleanup`）把两个名字收成一个，`DOC-DISCIPLINE.md:2460`／`:2461` 才暴露为互斥。本批补的面界，正是那处矛盾的同一个根。

### 五、遗留（已入台账）

- `#1799`：`docs/core/requirements/ENGINEERING-MODE-V2.md` 的 `:8` `:765` `:796` `:811` `:921` `:991` 六段超 300 字符（**存量**，非本批所致，`git diff -U0` 唯一 hunk 在 `:602`）。
- 内部代码评审 3 条 🔵（`:166` 缺 `**Why**` 标签 · 面界句在 `:220`/`:228`/`:165` 三处同义 · `:165`「own write domain」靠 `:166` 闭环）——均标可选、均在边界内，未改。
