# 批次档 · 2026-09-21 · 批次工具迁移残料收正（batch-rename-residue）

> 前情 = 无（**承接已收口批的遗漏债**：`docs/batches/2026-09-21-batch-lifecycle-tool.md` 已收口冻结 ✗ 不回改 ⇒ 本批收正其残料）。
> 触发：父侧 2026-09-21 12:05 发布前置核（`thincoder-cli && npm test` = **fail 5**）✗ 台账 **#191**（技术待办 · 归批）。
> 授权：**父侧代点火 / 代批准（用户 2026-09-21 12:00「自动跑到完成吧」）** ✓ 自缚：① 代签仅当「评审 pass（0🔴）∧ 轮次落点逐条核验 ∧ token 已签发」；② 代签在 §4 写明授权与依据；③ 新范围 / 用户口径裁决 ⇒ 停下不代签；④ 射程 = 本批收口。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：已收口 2026-09-21

**问题（父侧实跑 · 全树已提交态 ✗ 工作树 clean）**：`cd thincoder-cli && npm test` ⇒ `ℹ tests 772 · pass 767 · fail 5`——5 红分两类：

| 类 | 红面 | 根因（证据） |
|---|---|---|
| A（×4）| `thincoder-cli/test/batch-segment.test.mjs` T47 / T47b / T49b / T51 | **测试滞后迁移**：断言仍书旧名（「设计评审 + 已绑定 → 挂载」✗「eng-coder 挂 `batch_segment`（§2.20.3）」✗「该句带…已挂载 `batch_segment` 时」限定）——而实装 / 提示词已迁 **`batch`**（`batch_segment` = 过渡别名）。已收口批 `batch-lifecycle-tool` §1「迁移约束」明写「prompt 面 + gate 代码 + **测试同批改**」✗ 其 AC-5 只覆盖 `batch.test.mjs` ⇒ 本档 4 条漏改 |
| B（×1）| `thincoder-cli/test/prompt-refs-zero.test.mjs` T9 实档锁 | **提示词面引证死文本**：两面 14 处 + 代码面 1 处 2 token（**共 15 档 / 16 token**——定案读数见 §2 计数收正）`§4.1x` 形态引证（例 = `thincoder-core/prompts/common.md:156`「the `batch` tool (transition alias `batch_segment` — same append executor; **retirement criterion §4.14 in the design doc**)」；对位面 `docs/core/design/prompts/**` 7 档同形）⇒ 违反 2026-09-20 用户裁**两界原则**（提示词运行期读不到文档 ✗ 一切文档引证 = 死文本）✗ 触 J2 § 号守卫 |

**归因与先例**：两批已披露「非本批残红」（`docs/batches/2026-09-21-startup-latency.md:451` · `2026-09-21-vsc-block-title-align.md:458`——`git stash` 归因已做 ✓）✗ 归口 = `batch-lifecycle-tool`（**冻结** ⇒ 新批承接）。

**需求（收正面）**：
1. **提示词两面清除文档引证**（内容 = 主 agent ✗ 逐字规则）：凡提示词面（`docs/core/design/prompts/**` + `thincoder-core/prompts/**`）出现 `§<数字>.<数字>` 形态引证 ⇒ **删该指路从句**（保句义 ✗ 保操作数（工具名 `batch` / 别名 `batch_segment`）✗ **禁改指其他 §** ✗ 引证只删不移——2026-09-20 裁定形态）。
2. **测试断言同步新名**：`batch-segment.test.mjs` 4 条（T47 / T47b / T49b / T51）断言收正到 `batch`（含别名面），行为语义零变（只随已批设计 `BATCH-RECORD.md` 的改名面）。
3. **锁复绿**：`prompt-refs-zero.test.mjs` T9 三式零命中恢复。

**影响**：CLI 发布门（`0.12.64`）被 5 红钉住 ⇒ **本批 = 发布链解除钉死的前置** ✓。

**路由**：提示词内容 = 主 agent（本节 ①② 已给逐字规则）✗ 设计 = eng-designer（§2：测试收正面 + 受影响文件 + 验收）✗ 实现 = eng-coder ✗ 评审 = 父侧代点火（授权 ✓）。

**零改**：`batch` 工具本体 / gate 代码（迁移面已落 ✓）· 已收口批档（冻结 ✗ 不回改）· 需求档结构 · 表外档。

## §2 批次任务（eng-designer）

（待设计。）

**状态行**：🔄 进行中（2026-09-21 · initial 设计轮 · eng-designer）

**本批条目（覆盖）**（回指 §1 需求 1–3）：① 提示词两面清文档引证；② `thincoder-cli/test/batch-segment.test.mjs` 4 条断言同步主名；③ T9 锁复绿（= CLI 发布门 `0.12.64` 解钉前置）。

**设计档落点**：`docs/core/design/BATCH-RECORD.md` §4 = 本批收正的判据面（§4.1 工具契约 · §4.3 挂载表 · §4.7 #3 不变量 · §4.14 过渡别名）——**零改**（理由见「D 设计面留痕」）；一次性内容（断言 before→after / 清除清单 / 文件表）住本档 §2。

**方案与理由**：5 红 = 收口批（提交 `0b45957c`）迁移面的**测试与提示词滞后残料**（先例已披露「非他批引入」）⇒ 收正 = 逐条回归**已批契约面**，零新增语义：A 类只换断言对象与调用形；B 类只删指路从句。

**计数收正（D3）**：§1 枚举「B 类 14 处」= **提示词两面读数**；T9 锁定域 = 提示词三目录 + `CODE_ROOTS` 三根，实档读数 = **16 token / 15 档**（提示词 14 + 代码面 2）——代码面不删则 AC②（772/772 绿）不达（详见 B2）。

### A · 测试断言收正（`thincoder-cli/test/batch-segment.test.mjs` · 4 条 · 14 处行内 + A-5 头注）

**总则**：断言对象从过渡别名收到**生产主名 `batch`**（挂载 / 键集 / 经挂载面的调用三面）；助手 `designer()/reviewer()`（T43–T53 主体，10 处调用面）**仍走 `batchSegmentTool`**——收口批已批「shim 导出面供旧测试消费」，别名等价锁住 `thincoder-core/test/batch.test.mjs`（C8/AC-9/BR-26，现绿），CLI 档不重复断言（D2 单一权威）。**行为语义零变**；唯一语义移动 = T47b 主 agent 挂载面**由负转正**（收口批 D-BR18 已批：depth-0 挂载 `batch`）。

| # | 坐标 | 旧（逐字） | 新（逐字） |
|---|---|---|---|
| A-1 | `:164` | `!code.byName.has("batch_segment")` | `!code.byName.has("batch")` |
| A-1 | `:167` | `_advisorToolsFor(agent, "design", null).byName.has("batch_segment")` | `_advisorToolsFor(agent, "design", null).byName.has("batch")` |
| A-1 | `:168` | `_advisorToolsFor(agent, "design", abs).byName.has("batch_segment")` | `_advisorToolsFor(agent, "design", abs).byName.has("batch")` |
| A-2 | `:171` | 标题 `（eng-designer/eng-coder 有；主 agent 无——不变量 3）` | 标题 `（eng-designer/eng-coder 有；主 agent depth-0 亦有——D-BR18 · 不变量 3 零回归）` |
| A-2 | `:188` | `coder.toolByName.get("batch_segment")` | `coder.toolByName.get("batch")` |
| A-2 | `:189` | `"eng-coder 挂 batch_segment（§2.20.3）"` | `"eng-coder 挂 batch（挂载表 §4.3）"` |
| A-2 | `:190` | `coderTool.execute({ segment: "§5", text: "coder 写入" }` | `coderTool.execute({ action: "append", segment: "§5", text: "coder 写入" }` |
| A-2 | `:193` | `designerRun.toolByName.get("batch_segment"), "eng-designer 挂 batch_segment（§2.20.3）"` | `designerRun.toolByName.get("batch"), "eng-designer 挂 batch（挂载表 §4.3）"` |
| A-2 | `:195` | `assert.ok(!main.toolByName.has("batch_segment"), "主 agent 不挂载（§1/§4/§6 走普通文档写）")` | `assert.ok(main.toolByName.has("batch"), "主 agent depth-0 挂载 batch（create/close + append §1/§4/§6——D-BR18）")` |
| A-3 | `:215` | ``const QUAL_RE = /仅当本评审为设计评审、且工具面里已挂载 `batch_segment` 时/`` | ``const QUAL_RE = /仅当本评审为设计评审、且工具面里已挂载 `batch`（[^）]*）时/`` |
| A-4 | `:259` | `.byName.get("batch_segment")`（docsA 行） | `.byName.get("batch")` |
| A-4 | `:260` | `.execute({ segment: "§3", text: "A 轮发现" }, ctxFor())` | `.execute({ action: "append", segment: "§3", text: "A 轮发现" }, ctxFor())` |
| A-4 | `:261` | `.byName.get("batch_segment")`（docsB 行） | `.byName.get("batch")` |
| A-4 | `:262` | `.execute({ segment: "§3", text: "B 轮发现" }, ctxFor())` | `.execute({ action: "append", segment: "§3", text: "B 轮发现" }, ctxFor())` |
| A-5 | `:2` | 头注引 `ENGINEERING-MODE.md §2.20`（**死指针**——设计目录无该节） | 改指可解析目标：`docs/core/design/BATCH-RECORD.md` 挂载表 §4.3（父侧裁定 · 打标 ✓） |

**A-2/A-4 备注**：经挂载面的 `batch` 调用**必须带 `action: "append"`**（`batchTool.execute` 按 action 分派——缺 action ⇒ 「unknown action」默认支抛）；T47b `:190` 与 T51 `:260`/`:262` 三处即此形。`batch` 工具收到的 `segment`/`text` 与旧形同义，回执/拒面文案仍是迁移面字形（`batch_segment:` 前缀**逐字保持**，§4.1 锚断言）。

**A-3 取值理由**：目标形 `（[^）]*）时` = 别名段通配 ⇒ **删引证前后双态同命中**（设计轮实跑验证）——不把测试绑到过渡注记的行文，T49b 与 B1 的落地顺序因此**解耦**（任一先落皆绿）。否决精确形 ``（过渡别名 `batch_segment`）时``：与 B1 耦合（B1 未落时红）。

**A 零变面（逐字）**：`:163` · `:165`–`:166`（键集断言）· `:214`（`WRITE_RE`）· `:219`–`:226` · `:240`–`:258`（T51 绑定解析段）· T43–T46 / T48 / T50 / T52–T53 全部用例。

**A 预演证据（设计轮实跑现行实装，非推断）**：`_advisorToolsFor(agent,"code").byName` 键 = `["read","glob","grep","ls","lsp","code_search"]`、含 `batch` = false；`("design", null)` ⇒ false · `("design", abs)` ⇒ true；`prepareRun` 下 eng-coder / eng-designer / 主 agent（depth-0）`toolByName` **皆含 `batch`**、`batch_segment` 键**零在场**；经 `batch` 写 `{action:"append",segment:"§5"}` 落档 ✓；主 agent append `§4` 落档 ✓、`§2` 越段拒 ✓；T51 两评审各落各档、零串档 ✓。

### B · 文档引证清除（16 token / 15 档）

**规则（§1 逐字口径 + 2026-09-20 两界裁定）**：删**指路从句**；保句义 · 保操作数（工具名 `batch` / 别名 `batch_segment`）· 禁改指其他 § · 引证只删不移。两面行文各随原文（中英非互译），别名注记留存。

| # | 档（面别） | 坐标 | 删（逐字） | 删后该处（逐字片段） |
|---|---|---|---|---|
| 1 | `docs/core/design/prompts/advisor-design.md`（中·权威面） | `:46` | `——§4.14 撤除判据见设计档` | ``已挂载 `batch`（过渡别名 `batch_segment`）时`` |
| 2 | `docs/core/design/prompts/advisor-round2.md` | `:41` | 同 P1 | 同 |
| 3 | `docs/core/design/prompts/advisor-round3.md` | `:38` | 同 P1 | 同 |
| 4 | `docs/core/design/prompts/common.md` | `:118` | `，§4.14 撤除判据见设计档` | ``（过渡别名 `batch_segment`——append 同执行体）`` |
| 5 | `docs/core/design/prompts/persona-eng-coder.md` | `:39` | 同 P2 | 同 |
| 6 | `docs/core/design/prompts/persona-eng-designer.md` | `:47` | 同 P2 | 同 |
| 7 | `docs/core/design/prompts/persona-engineering.md` | `:74` | 同 P1 | 同 |
| 8 | `thincoder-core/prompts/advisor-design.md`（英·运行面） | `:29` | 同 P1 | 同 |
| 9 | `thincoder-core/prompts/advisor-round2.md` | `:30` | 同 P1 | 同 |
| 10 | `thincoder-core/prompts/advisor-round3.md` | `:26` | 同 P1 | 同 |
| 11 | `thincoder-core/prompts/common.md` | `:156` | `; retirement criterion §4.14 in the design doc` | ``(transition alias `batch_segment` — same append executor)`` |
| 12 | `thincoder-core/prompts/persona-eng-coder.md` | `:39` | 同 P2 | 同 |
| 13 | `thincoder-core/prompts/persona-eng-designer.md` | `:47` | 同 P3 | 同 |
| 14 | `thincoder-core/prompts/persona-engineering.md` | `:73` | 同 P3 | 同 |
| 15 | `thincoder-core/agent-tools/batch-lifecycle.mjs`（核产品·运行期错误串） | `:52` | `; BATCH-RECORD §4.11/§4.13` | `(eng sub-agents and design reviews are refused).` |

**删除对（3 形 · 计数）**：P1 `——§4.14 撤除判据见设计档`（7 处 = 行 1·2·3·7·8·9·10）· P2 `，§4.14 撤除判据见设计档`（4 处 = 行 4·5·6·12）· P3 `; retirement criterion §4.14 in the design doc`（3 处 = 行 11·13·14）· B2（行 15，1 处 2 token）。

**B2 谓词零变**：错误串主句与前缀逐字保留（`batch: ${action} is main-agent-only — … is depth-0 only`）；核侧测试锚 `/create is main-agent-only/` · `/close is main-agent-only/`（`thincoder-core/test/batch.test.mjs:103-106`）**零改**。
**B2 同档注释行零改**：`:4` / `:100` / `:159` / `:191` / `:230` / `:231` 的 `§4.1`/`§4.9` 住**注释面**（T9 代码面剥离全行注释——不入判、不进模型面）——本批不动其行文。

**机判复核法（B）**：
① 主判 = 锁本体（UTF-8 感知 · 含代码面注释剥离规则 · J1/J2/J3 三式）：`cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs` ⇒ T9 pass（实档 16 → 0）。
② 独立复核（提示词两面 · 纯文本面）：内置 `grep` 工具 pattern `§\s*\d+\.\d`（glob `**/*.md`）分别指 `docs/core/design/prompts` 与 `thincoder-core/prompts` ⇒ **零命中**（pre 读数 = 14 档 14 命中）。
等价 node 单行（本设计轮实跑 pre 读数 `FILES 14 HITS 14`）：

```text
node -e "const fs=require('fs'),p=require('path'),re=/§\s*\d+\.\d/g;let n=0,k=0;for(const d of ['docs/core/design/prompts','thincoder-core/prompts'])for(const e of fs.readdirSync(d,{recursive:true,withFileTypes:true}))if(e.isFile()){const h=[...fs.readFileSync(p.join(e.parentPath,e.name),'utf8').matchAll(re)].length;if(h){k++;n+=h}}console.log('FILES',k,'HITS',n)"
```
③ 代码面独立复核**不得用裸文本扫描**（注释行假阳：`batch-lifecycle.mjs` 裸扫 pre = 10 命中 = 2 判据 token + 8 注释 token）——以 ① 为唯一权威；本设计轮已按 ① 同判据（`lineHits`）对 15 档做内存删除后重扫 ⇒ `prompt=0 · code=0`。

### C · 受影响文件表（as-of 2026-09-21 读盘 · 增量）

| # | 文件 | 面别 | 行数（as-of） | 增量 | 改动项 |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/test/batch-segment.test.mjs` | CLI 测试面 | 299 | 行数 ±0 · 14 处行内改述 + 头注死指针收正（A5——父侧裁 ✗ 见「未决」1） | A-1–A-5 |
| 2 | `thincoder-core/agent-tools/batch-lifecycle.mjs` | 核产品面（运行期错误串） | 246 | 行数 ±0 · 1 处行内删 | B2 |
| 3 | `docs/core/design/prompts/` 7 档（advisor-design · advisor-round2 · advisor-round3 · common · persona-eng-coder · persona-eng-designer · persona-engineering） | 提示词中文权威面 | 74 · 62 · 59 · 120 · 42 · 81 · 165 | 各 ±0 行 · 各 1 处行内删 | B1（P1×4 · P2×3） |
| 4 | `thincoder-core/prompts/` 同名 7 档 | 提示词运行面（各档行文随原文——P1/P2 中文 ×4 + P3 英文 ×3） | 44 · 47 · 43 · 159 · 42 · 81 · 161 | 各 ±0 行 · 各 1 处行内删 | B1（P1×3 · P2×1 · P3×3） |
| — | `thincoder-cli/test/prompt-refs-zero.test.mjs` | 锁本体 | 169 | **零改** | 判据面（T9）——锁不改 |
| — | `docs/core/design/BATCH-RECORD.md` | 设计面 | 388 | **零改** | 见「D 设计面留痕」 |

**跨档限核查**：① 代码档 ≤300 咨询线——行 1 = 299 行，本批**零增行**（不越线）；行 2 = 246 ✓；② md 行宽 ≤300 字符——本批触碰 14 档均为**删减**（无新增超宽行；最长行 291 在 `persona-eng-designer.md` 的非触碰行，删后不变）；③ 行数实测：全 15 档删除后行数**逐一等值**（删除片段不含换行——设计轮实跑）。
**落笔者（笔域）**：A 类 + A-5 + B2 = eng-coder（产品/测试面）；**B1 十四处 = eng-coder 落笔**（内容 = 主 agent 逐字规则——§1 + §2 B1 表；承 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.1 D1「提示词 = 主 agent 内容权 + eng-coder 落笔」——父侧裁定收正落地归属 · 打标 ✓）；本档 §2 = eng-designer。

### 验收对照（机判 · 回指）

| # | 判据 | 命令 | 期望 | 回指 |
|---|---|---|---|---|
| AC-a | CLI 全绿（发布门解钉） | `cd thincoder-cli && npm test` | `tests 772 · pass 772 · fail 0` | §1 需求 3 · 本批 AC② |
| AC-b | 锁零命中（三式域内） | `cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs` | T9 pass（16 → 0） | §1 需求 1 + 3 |
| AC-c | 两面独立复核 | `grep` 工具 `§\s*\d+\.\d`（两提示词面） | 零命中（pre = 14） | §1 需求 1 |
| AC-d | 核侧零回归 | `cd thincoder-core && npm test` | 494/494（基线读数：父侧实跑） | B2 触碰核产品面 · 零改面守卫 |
| AC-e | 文档机检零新增 | `node scripts/doc-check.mjs --root .` | 悬空 3 · 行宽 3（= 基线） | 本批 AC③ |
| AC-f | A-5 头注指针收正 | `grep` 「ENGINEERING-MODE.md §2.20」于 `thincoder-cli/test/batch-segment.test.mjs` 头注 | 零命中（旧串）✗ 新指可解析 | A-5 |

**预演证据（本设计轮实跑）**：以 T9 同判据对全 15 档内存删除后重扫 ⇒ `prompt = 0 · code = 0`（pre = `prompt 14 · code 2`）；A 类目标形逐条为真（见 A 预演证据）。

### D · 设计面留痕（`BATCH-RECORD.md` 零改 · 理由）

- §4.14「prompt 面过渡注记『`batch_segment` = 过渡别名』」（`:212`）——收正后注记**留存**（只去指路从句）⇒ 该句仍成立，判据句零改。
- §4.3 挂载表（`:78-84`）与 §4.7 #3 不变量（`:114`）描述即本批实测行为（两 eng 角色 + depth-0 主 agent 皆挂 `batch`；别名不入生产挂载面）⇒ 表述已准，无需收正。
- §4.5 注（`:94`）「prompt 文案随批改」零变；§4.8 BR-26（`:149`）与核侧别名锁照旧。
- ⇒ **本批不改设计档**（无契约句被改变）；**不加 changelog 行**（变更记录只记设计档改动——零改即零行，避免把批级记录堆进设计档）。

### 关键决策记录（含被否面）

1. **A 类口径** = 主名面 1:1 收正（挂载 / 键集 / 经挂载面调用）+ 主 agent 挂载断言由负转正（D-BR18 已批语义）。
   否决：① CLI 档补别名等价断言（与 `thincoder-core/test/batch.test.mjs` C8/AC-9/BR-26 重复 = 第二权威源）；② 助手改直调 `batchTool`（10 处调用面改写 = 超「同步新名」范围；收口批已批 shim 供旧测试消费）。
2. **T49b 正则取值** = `（[^）]*）时`（别名段通配 · 双态同命中）⇒ 与 B1 落地顺序解耦（实跑验证）。
   否决：精确形（耦合 B1 行文；B1 未落时红）。
3. **B2 纳入本批** = 必做（T9 域含 `CODE_ROOTS`；16 token 中 2 枚在 `batch-lifecycle.mjs:52`；不删则 AC-a/AC-b 不达 ⇒ 发布门仍钉）。§1「14 处」按实档读数收正为 **16 token / 15 档**（D3 计数与列表同改）。
   否决：① B2 另批（本批 AC 不达）；② 只删 `§` 号留「BATCH-RECORD」字样（引证仍在 = 死文本）；③ 改指他 §（§1 逐字禁）。
4. **删除粒度** = 只删指路从句，保操作数（别名）与「append 同执行体」句义。
   否决：① 改写成「撤除判据见本档」（仍是指路 = 死文本）；② 整段删别名注记（违「保操作数」，且 §4.14 注记仍为在册机制）。
5. **D 项** = 设计档零改（理由见上）。
   否决：为「留痕」加 changelog 行（changelog 只记设计档改动）。

### 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望输出 | 判据 |
|---|---|---|---|---|
| TC-1 | 正常 | T47：`_advisorToolsFor(agent,"code")` | 键集 = 6 只读工具；`has("batch")` = false | §4.7 #1 |
| TC-2 | 边界 | T47：`("design", null)` / `("design", abs)` | false / true（fail-closed 两侧） | §4.3 |
| TC-3 | 正常 | T47b：eng-coder / eng-designer `prepareRun` + 经 `batch` 写 §5 | `toolByName.get("batch")` 在场；写入落档 | §4.3 + §4.1 |
| TC-4 | 边界 | T47b：主 agent depth-0 | `toolByName.has("batch")` = true（create/close + §1/§4/§6） | §4.3 + D-BR18 |
| TC-5 | 错误 | T49b：代码评审 round 1 / round 2+ | round 1 无写指令；round 2+ 有写指令 ∧ 适用面限定 | §4.5 |
| TC-6 | 边界 | T51：两设计评审并发（异档） | 各落各档、零串档 | §4.7 #6 |
| TC-7 | 正常 | 提示词两面全档扫描 | `§N.M` 零命中（pre = 14） | 两界原则 |
| TC-8 | 错误 | 核产品面错误串（注释剥离后） | 零命中（pre = 2）；`is main-agent-only` 语义与锚不变 | 两界原则 |

### 边界（本批不做）

- 不改 `batch` 工具本体 / gate 逻辑 / 别名工厂（迁移面已落）；B2 只删错误串尾指路从句（谓词零变）。
- 不改锁本体 `thincoder-cli/test/prompt-refs-zero.test.mjs`；不新增断言面（别名等价锁归核侧）。
- 不改 `_archive` 面（`thincoder-cli/docs/_archive/**` · `thincoder-vscode/docs/_archive/**`——T9 域外）· 不改 `.thincoder/tmp/core-pkg/**`（打包临时副本；抽检其提示词副本 `§4.14` 零命中）。
- 不动已收口批档（冻结 · 不回改）· 不动台账 · 不做全量重勘 · 不开新范围。

### UI / 交互决策

不适用——本批 = 测试断言 + 提示词文本 + 运行期错误串三面，零 UI / 交互面，无未决交互项。

### 未决 / 上抛项

1. `thincoder-cli/test/batch-segment.test.mjs:2` 头注引 `ENGINEERING-MODE.md §2.20` = **死指针**（设计目录现存仅 `ENGINEERING-MODE-V2.md`，无 `§2.20.x` 节——已实读确认）⇒ **父侧裁定：纳入本批一并收正（A5）** ✗ 收正面已定形 = **`docs/core/design/BATCH-RECORD.md` 挂载表 §4.3**（唯一目标 ✗ 见 A 表 A-5 行 ✗ 不再二选）（父侧代录 · 打标 · 可 revert）。
2. 加固建议（本批不做）：T47b 可补一行负断言 `!coder.toolByName.has("batch_segment")`（锁 §4.14「生产挂载面全切主名」）——纳入即**新增断言面**，本批按「行为语义零变」口径不做。
3. A-2 两处断言消息内的旧 pointer `（§2.20.3）` 已死 ⇒ **父侧裁定：采纳默认形 `（挂载表 §4.3）`**（= `docs/core/design/BATCH-RECORD.md` §4.3 ✗ 现档可解析 ✗ 测试消息面不取文档全名形）——回退支解除（父侧裁定 · 打标 ✓）。

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

**本轮独立核验（实读 · 非推断）**：A 类 14 行坐标与旧串逐字一致（`thincoder-cli/test/batch-segment.test.mjs:164/167/168/171/188/189/190/193/195/215/259/260/261/262`）；改写目标 = 生产实态（挂载名 `batch`：`thincoder-core/agent/family-tools.mjs:141,170-171` · `thincoder-core/advisor/loop.mjs:45`；`execute` 必带 `action`：`thincoder-core/agent-tools/batch.mjs:321,342-352`）。B 类枚举完备：独立 grep 两面恰 14 处 §N.M（7+7，逐档一处），J1 命中全为白名单 `AGENTS.md`/`README.md`、J3 唯一 `.md` 字面量（common.md:35/40 `".md"`）不构成命中、两位数支零命中、`thincoder-core/tool-docs/**` 干净 ⇒ 删后 T9=0 可推导；代码面非注释 § 引证仅 `batch-lifecycle.mjs:52`（2 token）⇒ 16 token/15 档坐落。B2 谓词零变成立（核侧锚 `thincoder-core/test/batch.test.mjs:103-106` 实读一致）；无他测断言被删串（tests grep `§4.14|撤除判据见设计档|retirement criterion` 仅见 core `batch.test.mjs:315` 消息文，仍成立）；vscode 侧 `batch_segment:` 前缀锚（`thincoder-vscode/test/batch-segment.test.mjs:126`）不受 B2 影响。A-3 新正则对删前/删后双态同命中（对 `docs/core/design/prompts/advisor-design.md:46` · `thincoder-core/prompts/advisor-round2.md:30` 实读行文验证）。BATCH-RECORD.md 零改判据实读一致（:78-84 · :94 · :114 · :149 · :212）。体量：测试档 299（档内计数口径）/批 298 行实读——<300 咨询线且 ±0；`batch-lifecycle.mjs` 246/245 ±0；提示词 14 档为 .md 豁免。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Acceptance | 🟡 | A5（`thincoder-cli/test/batch-segment.test.mjs:2` 头注 `ENGINEERING-MODE.md §2.20` 死指针）在受影响表改动项列记作「A-1–A-5」（:116）、未决 1（:184）给两个候选目标「实施时取可核者」，但 A 表（:46–:71）只定义 A-1–A-4（14 处）、验收对照（:129–:134）无对应核验——该项收正面与机判均未定。 | A 表补 A-5 行：逐字 before→after 固定单一可解析目标（`docs/core/design/BATCH-RECORD.md` 挂载表 §4.3 实读可解析，BATCH-RECORD.md:78–84）；验收对照加一条可 grep 的核验（旧指针串在头注零命中）。 |
| 2 | Scope（协调项） | 🟡 | 未决 3（:186）把 A-2 两处断言消息新指针（:57/:59 `（挂载表 §4.3）`）留成「若判超范围则回退」二值分支；且该形态未点名所属文档（裸 `§4.3` 不可自解析）——§2 任务面内因此含未决分支。 | §2 定稿单一写法（点名所属文档的 `文档:节` 形态最可解析）；被否形态移入「关键决策记录（含被否面）」备查。 |
| 3 | Clarity（标注） | 🔵 | 受影响表 :119 与 B1 行 8–14 将 `thincoder-core/prompts/**` 7 档整组标为「英·运行面」，但实读其中 4 档（advisor-design.md:29 · advisor-round2.md:30 · advisor-round3.md:26 · persona-eng-coder.md:39）该行行文为中文、删除串 = P1/P2 中文形（:97）——组标签与实档不符。 | 组标签改「运行面（各行文随原文）」或按档标语种；B 规则句（:77「两面行文各随原文」）已含此义，对齐标签即可。 |
| 4 | Acceptance（基线） | 🔵 | AC-d「494/494」（:133）与 AC-e「悬空 3 · 行宽 3」（:134）为父侧实跑基线读数；本轮无法实跑，未验证（unverified）。`scripts/doc-check.mjs` 实体存在（已核）。 | 收口时复测并落档实测读数；漂移即按因收正（基线来源已在档内标注）。 |
| 5 | Document ownership | 🔵 | 评审上下文未提供 Document Map（对象声明亦未给）——本维度按 Project Guide + 实仓结构降级核对：本批零新建文件；改动各归其档（提示词面 / 测试面 / 核产品面）；BATCH-RECORD.md 零改理由（:138–:143）与 §4.14 注记留存判据实读一致。 | 设计无需改；如后续启用 Document Map，把「提示词面 ↔ 设计档判据面」归属关系显式登记。 |

**计数：🔴 0 · 🟡 2 · 🔵 3**
**VERDICT: pass**

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 12:00「自动跑到完成吧」授权 · 代签三条件齐备）**：

- 依据 ① **评审 pass**：§3 轮次 1（评审 id=36）= 🔴 0 · 🟡 2 · 🔵 3（非阻塞；逐条裁定见下）；
- 依据 ② **落点核验**：设计 §2 的 A/B/C/D 全表经父侧实读复核 + 评审独立核验（14 处坐标逐字一致 · 16 token/15 档枚举完备 · B2 零回归锚在 · A-3 双态解耦成立）；
- 依据 ③ **token 已签发**（评审 pass 后按序签发 ✗ 凭证值不落档）；
- **裁定表**：①🟡 A5 定义缺 → **Fixed**（§2 A 表补 A-5 行 + AC-f——父侧裁 ✗ 打标）②🟡 未决 3 二值支 → **Fixed**（裁采默认形 ✗ 回退支解除）③🔵 组标签 → **Fixed**（改「各档行文随原文」）④🔵 基线读数 → **Not an issue**（来源已在档 ✗ 收口复测为既有流程）⑤🔵 Document Map 缺 → **Not an issue**（限制声明在表）；
- **实施派发**：eng-coder（A 类 14 处 + A-5 + B1 十四处 + B2 ✗ 落笔域见 §2「落笔者」行）✓。

## §5 实施记录（eng-coder）

（待批准后。）

**状态行**：✅ 实施完成（2026-09-21 · initial 轮 · eng-coder · fix round 0）

**交付摘要**：按 §2 全表落四组收正——A 类 15 处（14 处行内 + A-5 头注）· B1 两面 14 处 · B2 1 处 2 token，零偏离、零夹带。CLI 全量复跑 **772/772 绿**（5 红全消 ⇒ `0.12.64` 发布门解钉）；核 494/494；doc-check 与基线等值（悬空 3 · 行宽 3）。

**改动面（16 档 · 逐条落点 · 行数零变化）**

| # | 档 | 落点 |
|---|---|---|
| 1 | `thincoder-cli/test/batch-segment.test.mjs`（299 行） | A-1 `:164`/`:167`/`:168` · A-2 `:171`/`:188`/`:189`/`:190`/`:193`/`:195`（`:195` 负转正 = D-BR18）· A-3 `:215`（双态通配形）· A-4 `:259`–`:262` · A-5 `:2` 头注改指 `docs/core/design/BATCH-RECORD.md` 挂载表 §4.3；A 零变面（`:163`/`:165`–`:166`/`:214`/`:219`–`:226`/`:240`–`:258` · T43–T46/T48/T50/T52–T53）零触碰 |
| 2 | `thincoder-core/agent-tools/batch-lifecycle.mjs`（246 行） | B2 `:52` 删 `; BATCH-RECORD §4.11/§4.13`——谓词与 `is main-agent-only` 锚逐字保 |
| 3 | `docs/core/design/prompts/` 7 档（中文权威面） | `advisor-design:46` · `advisor-round2:41` · `advisor-round3:38` · `common:118` · `persona-eng-coder:39` · `persona-eng-designer:47` · `persona-engineering:74`——各 1 处指路从句删除（P1×4 · P2×3） |
| 4 | `thincoder-core/prompts/` 同名 7 档（运行面） | 同上坐标（P1×3 · P2×1 · P3×3） |

行数：16 档实测与 §2 C 表 as-of 读数**逐档等值**（同一 `split("\n").length` 口径 · `lines-drift-count=0`；`read` 视图末行号在带尾换行的两档上少 1 属视图口径差，非漂移）；`git diff` 逐 hunk = 1:1 行替换 ⇒ 零增删行（±0 结构成立）。

**决策透明表**

| # | 决策 | 依据 / 理由 |
|---|---|---|
| 1 | A-5 新形 = `docs/core/design/BATCH-RECORD.md 挂载表 §4.3` | §2 未决 1 父侧定形的唯一目标；实读可解析（`BATCH-RECORD.md:78` = `### 4.3 工具挂载（三方，只读面不扩）`） |
| 2 | 断言消息面取短形 `（挂载表 §4.3）` | §2 未决 3 父侧裁定默认形（消息面不取文档全名） |
| 3 | `:190`/`:260`/`:262` 三处经挂载面调用补 `action: "append"` | `batchTool.execute` 按 `action` 分派（`thincoder-core/agent-tools/batch.mjs:342-352`，缺 action ⇒ unknown action 抛）；`segment`/`text` 语义不变、助手 shim 零改 |
| 4 | A-3 取 `（[^）]*）时` 通配形 | §2 A-3 取值理由（与 B1 落地顺序解耦 · 双态同命中）；未采精确形 |
| 5 | 同族死指针（同档 `:173` `§2.20.2` 等）**本批不动** | §2 边界「不做全量重勘 / 不开新范围」；该族已由 `docs/core/design/TESTING.md:328` 归台账 #42（另批统一收正）——本批自核确证 |

**审计与代码评审（轮次 · 终态）**

- 发散审计（只读 `explore` 子代理 · 第 1 轮）：A 15 处逐字落点 / A 零变面 / B1 14 处三约束 / B2 / 行数与 C 表 / 禁改面 mtime+内容双证——**零发散**（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST 四类皆空）⇒ 终态 `clean`。
- 代码评审（advisor · `type=code` · 第 1 轮）：**VERDICT: pass**（🔴 0 · 🟡 0）；1 🔵 = 同族死指针 `:173` ⇒ 裁定 **Deferred**（理由见决策表 5；评审引证的归口行已由落笔者自读复核）。
- fix round：**0 轮**（审计与评审均无修正项，无静默修补）。

**门读数（本批实跑 · 原始计数）**

- AC-a `cd thincoder-cli && npm test` ⇒ `tests 772 · pass 772 · fail 0`（改前 = 767/5）。
- AC-b `cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs` ⇒ `tests 9 · pass 9 · fail 0`（T9 pass；pre 态域内命中 = 16 token / 15 档 ⇒ 清零）。
- AC-c 两提示词面 grep `§\s*\d+\.\d` ⇒ 零命中（`§\s*\d{2,}` 支亦零）。
- AC-d `cd thincoder-core && npm test` ⇒ `tests 494 · pass 494 · fail 0`。
- AC-e `node scripts/doc-check.mjs --root .` ⇒ 悬空 3 · 行宽 3（= 基线；三条超宽行均在本批未触碰档）。
- AC-f 测试档头注 grep `ENGINEERING-MODE.md §2.20` ⇒ 零命中。

**未决 / 上抛**

1. 无实现偏差（§2 A/B/C 表逐条落地）。未决 = 同族死指针族（决策表 5，归台账 #42）——非本批射程，登记备查。
2. 工作树另有**并行批**改动（`docs/core/design/MANIFEST.md` · `docs/core/design/ENGINEERING-MODE-V2.md` · 并行批档 ×2），mtime 与本批窗口交叠但**非本批写入面**（本批改动恰 §2 C 表 16 档，逐档可核）——按「多 = 停报」口径登记为上抛项。

## §6 验证与收口（主代理）

**实施轮**：eng-coder #40（initial ✗ 发散审计 1 轮零发散 ✗ 代码评审 pass ✗ fix round 0）✗ 交付 = §5 ✗ 改动面 16 档（恰 §2 C 表 ✗ 逐档可核）。

**验收（父侧独立复跑 · 计数原文）**：

| # | 判据 | 命令 | 读数（父侧复跑） | 结论 |
|---|---|---|---|---|
| AC-a | CLI 全量 | `cd thincoder-cli && npm test` | `tests 772 · pass 772 · fail 0`（改前 767/5） | ✓ |
| AC-b | T9 锁 | `node --test test/prompt-refs-zero.test.mjs` | 9/9 ✗ 域内 16 token → 0 | ✓ |
| AC-c | 两面引证零命中 | grep `§\s*\d+\.\d`（两提示词面） | 零命中（两位数支亦零） | ✓ |
| AC-d | 核全量 | `cd thincoder-core && npm test` | `tests 494 · pass 494 · fail 0` | ✓ |
| AC-e | 文档机检 | `node scripts/doc-check.mjs --root .` | 悬空 3 · 行宽 3（= 基线） | ✓ |
| AC-f | 头注旧串 | grep `ENGINEERING-MODE.md §2.20` | 零命中 | ✓ |

**结算同步清单（D7）**：① 六段齐名归其位（§1/§4/§6 = 主 agent ✗ §2 = eng-designer ✗ §3 = 评审子代理 ✗ §5 = eng-coder）✓；② 状态行「🔄 进行中」→「**已收口 2026-09-21**」✓；③ 计数 / 枚举一致（B 类 = 16 token/15 档 ✗ A 类 = 4 条 14 处 + A-5 ✗ C 表 16 档 ✗ §5 交付表 16 档）✓；④ 指针解析（`§2` ✗ `§3` 评审 id=36（轮 1 pass）✗ `§5` 实施记录 ✗ `§6` 本段）✓；⑤ 沿革：设计档 `docs/core/design/BATCH-RECORD.md` **零改**（无契约句被改变——§2 D 项判据成立 ✓）✗ 本批沿革 = §2/§3/§5 自载 ✓；⑥ 待办核销：**#191 → 已核销**（结算依据 = 本 §6 + §5 门读数）✓ ✗ 残余 `thincoder-cli/test/batch-segment.test.mjs:173`（`§2.20.2`）同族死指针——台账 #42 已核销后仍存 ⇒ **另册**（本批边界 ✓ 未动 ✓）；⑦ 前批遗留交叉核：`batch-lifecycle-tool`（已收口 ✗ 冻结）遗漏债 = 本批全量承接 ✓ 无余项 ✗ 无「条目已完成但锚批档未收口」情形 ✓。

**发布门**：本批 = CLI `0.12.64` 发布门**前置**（12:05 钉 → 12:27 解）✓ 5 红全消 ✗ 解钉读数 = AC-a（772/772）✓。

**冻结核**：本 §6 落 ⇒ 整档冻结（不再回改 ✗ 例外 = 提交哈希回填 errata 一笔 ✓）。
