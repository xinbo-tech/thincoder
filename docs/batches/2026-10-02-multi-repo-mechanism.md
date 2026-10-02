# 2026-10-02 · 多仓操作机制·提示词面
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 21:50–22:01（多仓操作机制入提示词——12 条 + 定界句；台账 #827）。
> 台账 = #827（多仓机制 · 归批）。前情 = docs/batches/2026-10-02-prompt-face-rectification.md §1（已收口 2026-10-02）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**需求登记（用户 2026-10-02 21:50–22:01 · 父侧笔录）**：多仓操作机制入**提示词**（运行期真读层——非仅文档层）。缘起 = 今日多仓实操四事实：跨仓批档 fail-closed ∥ 站点仓 manifest 建档 ∥ 双项目并存写面须显式路径 ∥ 子代理禁跨仓写。

**条款集（用户七 + 父侧五 + 定界句）**：
【定界】**仓 = 一个 git 仓（唯一判据）**——cli/vsc/桌面/渲染核 = **同仓四端**（端 ≠ 仓，其间零跨仓语义）；`thincoder.com` = 他仓同规。
① 多仓并存 = 正常态：写面（批档 ∥ 台账 ∥ 写门）一律**显式目标**；歧义列出候选、绝不代选；同类失败 = 报告 + 显式路径重试（不砖会话）。
② 一档一仓：批档 ∥ 台账 ∥ 需求/设计只收本仓条目；跨仓指针同禁。
③ 子代理只写本仓（会话锚的仓）；跨仓改动 = 主 agent 单独轮次。
④ 他仓享六段机制 = 锚在那仓的会话 + 该仓持 manifest。
⑤ 批档基根 = 会话锚项目声明（`docRoot.batches`）——跨仓 create 必拒 = **正确行为**。
⑥【用户补】无 manifest 的仓 ⇒ **第一次操作该仓前先建档**（轻动作 · `main` 写门）。
⑦【用户补】跨多仓任务 ⇒ **各仓分别建批档、分别开批实现**。
⑧ 分仓 = 例外（有独立部署/发布/生命周期理由才分；不为「多仓」造协调机器）。
⑨ 首次操作他仓 = manifest 建档 + **缺层就地补齐** + 其本仓台账/批档。
⑩ 他仓发现物 = 报用户路由（勿丢勿混）；落**他那本仓的**台账。
⑪ 接口 = 唯一耦合面（各仓自持设计/实现/收口；只经接口坐标 + 用户门耦合）。
⑫ 签入按仓各自进行。

**层级候选**（设计判）：①⑧⑨⑩⑪⑫ ≈ 公共层（两模式共有）；②③④⑤⑥⑦ = 工程模式纪律层。

**交付面**：`thincoder-core/prompts/`（运行面）∥ `docs/core/design/prompts/`（设计正本）双面 + `docs/core/requirements/PROMPT-SYSTEM.md`（需求侧笔 = 主 agent · 本批落）。**先例** = 提示词面批（#800 ∥ #727 ∥ #814——双面逐字 ∥ refs 零命中 ∥ 零 `##` 增）。

**本批建档即遇实例（落点事故 · 已在案）**：本档 create 时相对路径经歧义回退落到工作区锚（`d:\teamcode\docs\batches\`）⇒ 父侧即迁 `thincoder/docs/batches/`——**教训入条款面**：多候选并存时**建/写一律显式绝对路径**（⑤ 的行为面延伸——设计轮一并处置）。

**在途大签入 errata（2026-10-02 22:0x · 父侧）**：用户 22:03 裁「先把多仓机制落地了再干别的」⇒ 同拍完成**全在途签入保底**（2026-10-01 以来全部在途——桌面诸批 ∥ 提示词面 ∥ 记录形 ∥ 清账 ∥ 打包链 ∥ 本批前身）：thincoder 提交 **`16d5882a`**（354 档 · +35480/−5460）+ **双远端已推**（origin gitee ✓ ∥ github 代理 ✓）；thincoder.com 提交 **`ee492bb`**（manifest + 站点档）+ origin ✓。**签入面清理**：`thincoder-desktop/.gitignore` 补 `dist-*/`（构建树不入库——`dist-r3/r4` 留盘 Untracked）；根 `.gitignore` 补 `_*.out`/`_nat_test_out.txt`（会话临时输出）。**注**：已收口冻结批档不回写——哈希以本条为 errata 落点（先例形）。

**授权记录（用户 2026-10-02 22:05）**：「那你先把多仓机制那个自动跑到落地吧。」⇒ **全自动链授权**：代点火评审 ∥ 修正轮派发 ∥ §4 代签∥ 实施派发 ∥ 复核 ∥ 收口核销 ∥ 提交（双远端）。**自缚三条**（本仓惯例）：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停；③ 破坏性/不可逆 ⇒ 先停。**时序**：本批落地前不开别的（用户 22:03 裁）——stage-2 全程候账。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（多仓操作机制提示词面——条款全集落点表 §2.2 ∥ 双面逐字草案 §2.3 ∥ 需求侧落点 §2.9-U1 ∥ 设计档三处已落 §2.5；上抛 7；机检：refs 零命中 ∥ doc-check exit 0（悬空 0）∥ CN 新行 ≤128 字符 ∥ 零 `##` 增（设计口径）；修正轮 1（评审发现 1–4 处置）已落——§2.0 ∥ §2.2 ∥ §2.3（B1/B4 双面）∥ §2.5 ∥ §2.6 随正；两档变更记录在册；提示词六档零触（实施轮落笔））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批 = 多仓操作机制 · 提示词面 · 设计轮（不实施）**——把 §1 条款集（12 条 + 定界句 + 建档事故教训）落成**运行期真读的提示词条款**。件源核对：spawn 给号 = 台账 #827（多仓机制 · 归批）；§1 讨论段实读 ✓（条款集 / 层级候选 / 交付面 / 建档事故实录）。

**任务书依据**：spawn 派单（目标 / 设计范围 / 已知事实 / 验收标准） + 台账 #827 + §1 条款集。

### 2.0 任务书（覆盖 ∥ 边界）

- **轮次 = initial**；本批覆盖 = 交付六项（§1 验收）：① 条款全集落点表（§2.2）② 双面对应表（§2.4）③ 需求侧落点 + 验收（§2.9-U1）④ 机检口径（§2.7）⑤ 各档变更记录一行（§2.5——设计三档已落）⑥ §2 就位（本段）。
- **本批不做（边界）**：产品码零触 ∥ 越八档面（实际用 common ∥ discipline-engineering ∥ persona-engineering 三档 × 双面 = 六档）∥ 既有条款语义零改（微调 = §2.2 逐处列明 + 理由）∥ 他批档零触 ∥ 机械门零加 ∥ 普通模式提示词零触（理由 = 设计档 §6.14 边界）。
- **笔路**：CN 正本（`docs/core/design/prompts/**` = 文档面 ⇒ **eng-designer 笔**）∥ EN 运行面（`thincoder-core/prompts/**` = 产品代码面 ⇒ **eng-coder 落笔**）——**两笔均归本批实施轮**（逐字 = §2.3 围栏块 A–C；EN 按 M9 翻译回写、非 cp）；需求面 = 主 agent 笔（§2.9-U1）；设计档登记 = 本席（§2.5——**本轮已在盘**）。
- **测试面**：批内件 = 无（提示词 / 文档文本笔——承提示词面批先例）；机检 = `prompt-refs-check`（零命中——基线已复跑）∥ `##` 块计数守恒 ∥ CN 行宽 ≤300 ∥ `doc-check` 本批 authored 零新增；仓套件 = 父侧收口一次。

### 2.1 现状实读（届盘 file:line 证据）

- **双面六档现行读数**（内容行口径）：CN/EN = common **127 ∥ 169** · discipline-engineering **171 ∥ 179** · persona-engineering **192 ∥ 192**；`##` 计数 = **14 ∥ 14 ∥ 8 ∥ 8 ∥ 16 ∥ 17**。
- **既有自持段**：CN `docs/core/design/prompts/discipline-engineering.md:117`「文档与台账自持（本仓记本仓的）」8 项——item 1 `:118` ∨ item 5 `:124`（**同规则重复** + 残句「……语义不变，去掉『头部』概念」）∨ item 7 `:126` ∨ item 8 `:128`；EN `thincoder-core/prompts/discipline-engineering.md:120` 同节（item 5 = `:127`）。
- **批次档常识**：CN `common.md:121` §14 起（末行 `:127`「结构权威」）；EN `common.md:163` §14 起（末行 `:169`）。
- **项目状态档**：CN `persona-engineering.md:52-58`（「建档 = 用到时的轻动作」`:57` ∥「不砖死」`:58`）；EN `persona-engineering.md:52-58` 同构。
- **多仓操作提示词现状**：`跨仓` 双面 grep **零命中**——§1「四事实」的操作纪律尚未入文；旧设计句 `DOC-DISCIPLINE.md:1153`（「跨仓批派单三条……入纪律层双副本——逐字文本归提示词落笔轮」）仍为「待落笔」态（提示词面无对应——实证）。
- **机制码面（§1 已知事实引用，免再探；本批零触）**：`thincoder-core/agent-tools/batch-paths.mjs`（`declaredBases` `:31` ∥ `batchDocBases` `:42` ∥ create 越基底 fail-closed `:124-141`）∥ `manifest-discovery.mjs`（归属 ∨ 发现）∥ manifest 写门 = `thincoder-core/manifest.mjs:229-231`（`writer !== 'main'` 拒——fail-closed；子代理 `files` 列 manifest = 机检拒 `spawn-gates.mjs:105`）。
- **spawn 层位指认校正（观察）**：派单称「公共层现有『文档 / 台账各仓自持』条款」——**实况 = 该族住两纪律层**（工程 `discipline-engineering.md:117` 起 ∥ 普通 `discipline-normal.md:36` 起）；公共层无自持段。设计按实况落点（本批公共层接触面 = §14 批次档常识）；指认校正上报（§2.9-U3）。

### 2.2 裁定与落点（逐条定形）

**落点表（条号 → 档 → 层 → 措辞 = §2.3 逐字块）**：

| 条 | 落点（档 ∥ 层） | 处置 | 逐字块 |
|---|---|---|---|
| 定界（仓 = git 仓 ∥ 端 ≠ 仓） | discipline-engineering ∥ 工程纪律层 | 新增 item 9 | B2 |
| ① 多仓并存正常态 | discipline-engineering ∥ 工程纪律层 | 新增 item 8 | B1 |
| ② 一档一仓 | **既有覆盖**（item 1/2/3；普通侧自持 item 1） | 零新文本 | — |
| ③ 子代理只写本仓 | **既有覆盖**（item 7/8） | 零新文本 | — |
| ④ 他仓享六段机制 | discipline-engineering ∥ 工程纪律层 | 新增 item 10 前半 | B3 |
| ⑤ 批档基根 = 会话锚声明 | common §14 ∥ 公共层 | 新增 1 段 | A |
| ⑥ 无 manifest 先建档 | persona-engineering ∥ 人格层 | 新增 1 行 | C |
| ⑦ 跨多仓任务 ⇒ 各仓各批 | common §14 ∥ 公共层 | 同段（A） | A |
| ⑧ 分仓 = 例外 | discipline-engineering ∥ 工程纪律层 | 新增 item 13 | B6 |
| ⑨ 首次操作他仓 | 分解覆盖：建档 = C ∥ 补层 = item 4（关键锚点重复·编写纪律 #10）∥ 记录落位 = item 10/11 | item 10 后半 | B3 |
| ⑩ 他仓发现物路由 | discipline-engineering ∥ 工程纪律层 | 新增 item 11（补落地名词「台账 / ledger」——轮次 1 发现 3） | B4 |
| ⑪ 接口 = 唯一耦合面 | discipline-engineering ∥ 工程纪律层 | 新增 item 12 前半 | B5 |
| ⑫ 签入按仓各自 | discipline-engineering ∥ 工程纪律层 | 同 item 12 | B5 |
| 建档事故教训（显式路径） | discipline-engineering ∥ 工程纪律层 | 并入 item 8（显式目标 / **显式绝对路径**——轮次 1 发现 4 补「绝对」限定） | B1 |

**层次判定（四问 → 三处）与 §1 候选收正**：
- ①组（定界 / ① / ④ / ⑧ / ⑨ / ⑩ / ⑪ / ⑫）= 「该模式下怎么干活」的机制操作规则 ⇒ 纪律层；受众 = 工程主会话 + 工程子代理（既有自持节 = 本家族提示词落点，逐条续入）。
- ②组（⑤ / ⑦）= 批次档机制常识（两模式同一的文档体系；公共层 §14 = 该机制常识节）⇒ 公共层（§14 节内增段）。
- ③组（⑥）= 主 agent 独属写权动作（manifest 写权 `writer:'main'` 专权、子代理不可达）⇒ 人格层「项目状态档」（落点 = manifest 节）。
- **收正说明（对 §1「①⑧⑨⑩⑪⑫ ≈ 公共层」候选）**：实投 = 仅 ⑤⑦ 落公共层（承载面 = §14；其余公共层节面 = 主题不符 + 零 `##` 增为硬口径 ⇒ 不新建节）；⑥ 由公共层收正至人格层（写权面——「写权独属动作不落共享层」同台账判例）；①⑧⑨⑩⑪⑫ 归工程纪律层（操作规则；受众多含子代理——「两模式逐句都要的协作基础」判定不过）。

**既有段微调（逐处列明 + 理由）**：自持节 item 5（台账本仓自持）与 item 1 = **同规则重复**、且携修订式残句「（本仓自持由 schema 校验——语义不变，去掉『头部』概念）」⇒ 处置 = **item 5 删、唯一事实「本仓自持由 schema 校验」并入 item 1、序号顺缩**（CN `:124` 删 → item 6/7/8 ⇒ 5/6/7；EN `:127` 删 → 同）。理由 = D8（失效表达必删）+ 重复即缺陷；**语义零变**（规则本体 = item 1 原样）。

**KD 索引（全文 = 设计档）**：KD-1 = 三处落点（→ `PROMPT-SYSTEM.md` §7 D-PS17）∥ KD-2 = 既有段微调（→ D-PS18）∥ KD-3 = 旧落笔面收口（→ D-PS19）。

### 2.3 逐字草案（一次性材料——落地档 ↔ 本块一次性比对基线；CN 正本 ∥ EN 运行面）

围栏块 A（⑤ + ⑦ —— common §14 末增 1 段）：

```text
A. common.md「批次档常识」§14 末「结构权威」行后新增 1 段：
[CN]（docs/core/design/prompts/common.md——现 :127 后）
**多仓按仓各自**：批档住本仓（基根 = 会话锚的项目声明）；**跨仓建档会被拒——那是正确行为**（不绕道）；跨多仓任务 ⇒ **各仓分别建档、分别开批**。
[EN]（thincoder-core/prompts/common.md——现 :169 后）
**Per repo, its own record**: batch records live in their own repo — the base root resolves from the session anchor's project declaration; **a cross-repo create is refused — that is the correct behavior** (never work around it); a task spanning several repos ⇒ **each repo gets its own record and its own batch**.
```

围栏块 B（自持节——微调 B0 + 6 项续入 B1–B6）：

```text
B0. 微调（item 5 删并——逐处理由 = §2.2「既有段微调」）：
[CN]（docs/core/design/prompts/discipline-engineering.md）
- :118-119 item 1 句尾「……路径或证据」后追加「（本仓自持由 schema 校验）」。
- :124 item 5 整行删；:125 item 6 序号 ⇒ 5；:126-127 item 7 ⇒ 6；:128-129 item 8 ⇒ 7。
[EN]（thincoder-core/prompts/discipline-engineering.md）
- :121-122 item 1 句尾 "…outside this repo" 后追加 " (repo-self-containment is enforced by schema)"。
- :127 item 5 整行删；:128 item 6 ⇒ 5；:129-130 item 7 ⇒ 6；:131-132 item 8 ⇒ 7。

B1–B6. 新项（微调后 = item 7「另起一轮处置」行后）：
[B1-CN]
8. **多仓并存 = 正常态**：写面（批档 ∥ 台账 ∥ 写门）先定**目标仓**——**显式目标**（多候选并存 ⇒ **显式绝对路径**）；解析歧义 ⇒ **列候选、绝不代选**；同类失败 ⇒ **报告 + 显式路径重试**（不砖会话）。
[B2-CN]
9. **仓 = 一个 git 仓**（唯一判据）：同一仓内的多个端 / 模块（端 ≠ 仓）之间**无跨仓语义**；他仓同规。
[B3-CN]
10. **他仓享六段机制** = **锚在那仓的会话** + **那仓持 manifest**；首次操作他仓 ⇒ 缺层就地补齐、**记录落它本仓**。
[B4-CN]
11. **他仓发现物** ⇒ **报用户路由**（勿丢勿混）——落**它本仓的台账**，不混入本仓。
[B5-CN]
12. **跨仓只经接口耦合**：各仓自持设计 / 实现 / 收口；**接口坐标 + 用户门是唯一耦合面**；**签入按仓各自进行**。
[B6-CN]
13. **分仓 = 例外**：独立部署 / 发布 / 生命周期理由才分；**不为「多仓」造协调机器**。
[B1-EN]
8. **Several repos coexisting = a normal state**: before writing, fix the **target repo** — write surfaces (batch record ∥ ledger ∥ write gate) take an **explicit target** (several candidates ⇒ an **explicit absolute path**); on an ambiguous resolution ⇒ **list the candidates, never choose for the user**; on a repeated failure ⇒ **report it and retry with an explicit path** (never brick the session).
[B2-EN]
9. **A repo = one git repo** (the sole criterion): several ends / modules inside one repo (an end ≠ a repo) have **no cross-repo semantics between them**; every other repo follows the same rules.
[B3-EN]
10. **Another repo gets the six segments** = **a session anchored there** + **a manifest in that repo**; on the **first operation in another repo** ⇒ build the missing layers on the spot and **book the records in its own repo**.
[B4-EN]
11. **Findings in another repo** ⇒ **report them to the user for routing** (lose nothing, mix nothing) — they land in **that repo's ledger**, never mixed into this one.
[B5-EN]
12. **Cross-repo coupling goes through the interface only**: each repo self-contains its design / implementation / closeout; **interface coordinates + the user's gate are the only coupling surface**; **commits happen per repo, each on its own**.
[B6-EN]
13. **Splitting repos = an exception**: split only for independent deployment / release / lifecycle reasons; **never build coordination machinery just because several repos coexist**.
```

围栏块 C（⑥ —— persona 项目状态档）：

```text
C. persona-engineering.md「项目状态档」——新增 1 行：
[CN]（docs/core/design/prompts/persona-engineering.md——现 :57「建档 = 用到时的轻动作……」行后）
**操作一个仓之前，它没有 manifest ⇒ 先就地建档**（轻动作——**写权只在你**）。
[EN]（thincoder-core/prompts/persona-engineering.md——"Landing one is a light action at the point of use" 行后）
**Before you first operate in a repo that has no manifest ⇒ land one on the spot** (a light action — **you are its only writer**).
```

### 2.4 双面对应表

| # | 面 | 档 | 落点 | 现读数 | Δ |
|---|---|---|---|---|---|
| 1 | CN 正本 | `docs/core/design/prompts/common.md` | §14 末 +1 段（A） | 127 | +1 |
| 2 | EN 运行面 | `thincoder-core/prompts/common.md` | §14 末 +1 段（A） | 169 | +1 |
| 3 | CN 正本 | `docs/core/design/prompts/discipline-engineering.md` | 自持节：+6 项、−1 项（B0/B1–B6） | 171 | +5 |
| 4 | EN 运行面 | `thincoder-core/prompts/discipline-engineering.md` | 同（B0/B1–B6） | 179 | +5 |
| 5 | CN 正本 | `docs/core/design/prompts/persona-engineering.md` | 项目状态档 +1 行（C） | 192 | +1 |
| 6 | EN 运行面 | `thincoder-core/prompts/persona-engineering.md` | 同（C） | 192 | +1 |

逐字对应：CN ↔ EN = 语义对等翻译（M9）；同一语言面 = 落地档 ↔ §2.3 围栏块一次性比对（批次收尾核对步——承 §6.1 纪律）。

### 2.5 设计档落点（本席笔——本轮已在盘）

- `docs/core/design/PROMPT-SYSTEM.md`：**§6.14 新增**（多仓操作机制——来源 ∥ 机制三处 ∥ 四问归属 + 候选收正 ∥ 既有段微调逐处 ∥ 旧落笔面收口 ∥ 落点 ∥ 机检面 ∥ 边界）∥ §7 **D-PS17 ∥ D-PS18 ∥ D-PS19** ∥ §6.1 应用实例补 ∥ 变更记录行（591 → **619**，+28）。
- `docs/core/design/DOC-DISCIPLINE.md`：§4.4「提示词落笔面」句随正（跨仓批派单 = 以多仓泛化形随本批落笔——提示词实体落笔 = 本批实施轮 ∥ 反查脚本一条 = 未落（在册）；轮次 1 发现 1 收正）∥ 变更记录行（1639 → **1641**，+2）。
- `docs/core/design/LEDGER-SELF-CONTAINED.md`：变更记录行（§6.2 行为面增量定形——指针 = `PROMPT-SYSTEM.md` §6.14 ∥ 批档 §2）（328 → **330**，+2）。

### 2.6 受影响文件（现行数 = 落笔前读数 → 预计 Δ；笔路）

| # | 档 | 现行数（内容行） | Δ | 面 | 笔 |
|---|---|---|---|---|---|
| 1 | `docs/core/design/prompts/common.md` | 127 | +1 | CN 正本 | 实施轮 · eng-designer |
| 2 | `thincoder-core/prompts/common.md` | 169 | +1 | EN 运行面 | 实施轮 · eng-coder |
| 3 | `docs/core/design/prompts/discipline-engineering.md` | 171 | +6 −1 = +5 | CN 正本 | 实施轮 · eng-designer |
| 4 | `thincoder-core/prompts/discipline-engineering.md` | 179 | +6 −1 = +5 | EN 运行面 | 实施轮 · eng-coder |
| 5 | `docs/core/design/prompts/persona-engineering.md` | 192 | +1 | CN 正本 | 实施轮 · eng-designer |
| 6 | `thincoder-core/prompts/persona-engineering.md` | 192 | +1 | EN 运行面 | 实施轮 · eng-coder |
| 7 | `docs/core/design/PROMPT-SYSTEM.md` | 591 | +28（本轮已落——现 619） | 设计面 | 本席 |
| 8 | `docs/core/design/DOC-DISCIPLINE.md` | 1639 | +2（本轮已落——现 1641） | 设计面 | 本席 |
| 9 | `docs/core/design/LEDGER-SELF-CONTAINED.md` | 328 | +2（本轮已落——现 330） | 设计面 | 本席 |
| 10 | `docs/core/requirements/PROMPT-SYSTEM.md` | 256 | 登记块 + 行 14 随动（落点 = §2.9-U1） | 需求面 | 主 agent |

### 2.7 验收对照（回指交付六项——机判 / 可核逐条）

- **①** 条款全集落点表 = §2.2（条号 → 档 → 层 → 逐字块锚）；**双面对应 = §2.4**。
- **②** 逐字 = §2.3 围栏块 A ∥ B（B0–B6）∥ C——CN + EN 全集（六档落笔面全覆盖）。
- **③** 需求侧落点 + 验收 = §2.9-U1。
- **④** 机检口径：a) `node scripts/prompt-refs-check.mjs` **零命中**（基线已复跑：提示词面 84 档 ∥ 代码面 409 档 ∥ 命中 0）；b) **零 `##` 增**——六档 `##` = 14/14/8/8/16/17 前后不变（设计口径——实施轮复核）；c) **CN 新行 ≤300 字符**——实测 87 ∥ 128 ∥ 70 ∥ 83 ∥ 55 ∥ 75 ∥ 60 ∥ 55（A ∥ B1–B6 ∥ C）；d) `doc-check` 本批 authored 零新增（设计三档——复跑读数补记，见下段）。
- **⑤** 各档变更记录一行：设计三档 changelog 已落（§2.5）；提示词档无变更记录面（惯例——记录只落设计 / 需求档）。
- **⑥** §2 就位（本 append 序列）。
- **实施轮核对步**：落地档 ↔ §2.3 围栏块一次性比对（逐行；输出入 §5）；EN = M9 翻译回写（逐字 = EN 稿、非 cp）。

### 2.8 关键决策（索引——全文 = 设计档）

- **KD-1** = 三处落点体系（公共 §14 ∥ 工程纪律自持节 ∥ 人格项目状态档；否决 新建节 / 全落公共 / 全落纪律）→ `docs/core/design/PROMPT-SYSTEM.md` §7 **D-PS17**；
- **KD-2** = 既有段微调（item 5 删并；D8 + 重复即缺陷；语义零变）→ **D-PS18**；
- **KD-3** = 旧「跨仓批派单」落笔面收口（多仓泛化形落 + 反查脚本半句在册）→ **D-PS19** ∥ `docs/core/design/DOC-DISCIPLINE.md` §4.4 随正。

### 2.9 上抛项（主 agent / 父侧域）

- **U1（需求笔 · 主 agent）**：`docs/core/requirements/PROMPT-SYSTEM.md` 落点——建议：① §2.3 公共层现 #800 块（as-of :100-105）后新增**登记块**（多仓操作机制 · 提示词面：来源 / 功能点（三层落点）/ 边界 / 验收 / 依赖）；② 本表行 14（§2.3「管什么」列）补「多仓按仓各自」面。**块内验收建议**（逐字 = 批档 §2）：双面六档在位且与 §2.3 围栏块一次性比对全等 ∥ `prompt-refs-check` 零命中 ∥ 零 `##` 增（14/14/8/8/16/17）∥ CN 新行 ≤300；实施 = 本批实施轮（EN 按 M9 翻译回写）。
- **U2（裁 · 主 agent）**：`DOC-DISCIPLINE.md` §4.4「**反查脚本一条**」提示词落笔未做（对象 `thincoder-cli/scripts/doc-impact.mjs` 在盘）——去留：① 补落（其自有轮）∥ ② 判对象失义、撤句。本批零触（§4.4 已随正为「在册」）。
- **U3（观察 · 层位指认校正）**：spawn 称「公共层现有『文档 / 台账各仓自持』条款」——实况 = 两纪律层（§2.1）；设计按实况落点。
- **U4（观察 · 存量滞后）**：`DOC-CODE-RECONCILE.md:411-412`「落点（现状）」句 CN 坐标 `discipline-engineering.md:89` 与现况（自持节 `:117` 起）不符——本批零触；建议随其下次修订收正。
- **U5（观察 · 已随批列明）**：自持节 item 5 重复 + 残句——本批已列处置（§2.2 微调 / B0）；如需还原 = 单点 revert（两处）。
- **U6（观察 · 普通面）**：多仓机制主体 = 工程机制面；普通侧经公共层 §14 覆盖批次档面；如另需普通侧「写目标纪律」全模式化 ⇒ 另裁小幅补行（候选 = `discipline-normal.md` 自持节 +1 行）。
- **U7（观察 · 台账读面空）**：`ledger_query` 双根（thincoder ∥ teamcode）均返回空行集（无过滤）——疑键控根 / 环境差；#827 号照引派单与 §1 所载（本批零动作）。

**doc-check / refs 复跑读数（补记 · 本席）**：
- `node scripts/doc-check.mjs --root .` ⇒ **exit 0**；汇总 = 候选 44955 · **悬空 0**（闸态——阈值 0）· 注记豁免 319 · 拟新增 48 · 迁移期引文 297；行宽 OK（源域 .md 无 >300 单行——区带豁免在效）。
- 本批 authored 复核：设计三档（PROMPT-SYSTEM ∥ DOC-DISCIPLINE ∥ LEDGER-SELF-CONTAINED）命中性列报逐条 = **既有**「迁移期引文 / 报告面 · 不入闸」行（**0 行落本批新增区间**）⇒ **本批 authored 零新增 ✗ / 报告**。
- `node scripts/prompt-refs-check.mjs` ⇒ **exit 0**；提示词面 84 档 ∥ 代码面 409 档 · **命中 0**（J1/J2/J3 零命中）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**核验射程（如实）**：已全文实读评审射程 7 档 + 评审对象批档 §2；已回核 = CN 三档现行数（127 ∥ 171 ∥ 192）与 `##` 计数（14 ∥ 8 ∥ 16）、三处落点行位（`docs/core/design/prompts/common.md:127`「结构权威」∥ `docs/core/design/prompts/discipline-engineering.md:117`–`:129` 八项 ∥ `docs/core/design/prompts/persona-engineering.md:57`）、设计档三处已落读数（`PROMPT-SYSTEM.md` 619 行 ∥ `DOC-DISCIPLINE.md` 1641 行 ∥ `LEDGER-SELF-CONTAINED.md` 330 行 ∥ `requirements/PROMPT-SYSTEM.md` 256 行）。**未核（射程外）= EN 运行面三档坐标 ∥ 机制码面断言（`batch-paths.mjs` ∥ `manifest.mjs`）∥ `discipline-normal.md` 普通侧自持项位**。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state | 🟡 | 「已落笔」状态句超前且与同批记录相抵——`docs/core/design/DOC-DISCIPLINE.md:1153`「跨仓批派单语义**已随多仓机制批以多仓泛化形落笔**」（`:1640` 变更记录同句）∥ `docs/core/design/PROMPT-SYSTEM.md:365`（§6.14 连带）「语义已随本批以多仓泛化形落笔」；而 `docs/core/design/LEDGER-SELF-CONTAINED.md:329`「**提示词实体落笔 = 本批实施轮**」、批档 `:48`（§2.0 笔路）「CN 正本 ∥ EN 运行面 = 本批实施轮落笔」。实核 = CN 三档现文无该文（`common.md` ∥ `discipline-engineering.md` ∥ `persona-engineering.md` 全文已读，「跨仓 / 多仓」族零命中）⇒ 落笔未发生 | 改述为与 `LEDGER-SELF-CONTAINED.md:329` 同式的状态句（如「落笔 = 本批实施轮」），或待实施轮落地后再写「已落笔」；两处（§4.4 句 ∥ §6.14 连带句）同拍 |
| 2 | Clarity | 🟡 | 实施轮角色路由未写明——§2.6 笔列六档一律「实施轮」：CN 正本（`docs/core/design/prompts/**` = 文档面 ⇒ eng-designer）∥ EN 运行面（`thincoder-core/prompts/**` = 产品代码面 ⇒ eng-coder）跨两变更面；先例批同形落点明写角色拆分（`docs/batches/2026-10-02-prompt-face-rectification.md:34`） | §2.0 笔路句补两面角色拆分（与先例同式），六档按面分两笔派单 |
| 3 | Requirements | 🔵 | ⑩ 半句「落**他那本仓的台账**」（批档 `:22`）落为 B4「落**它本仓**」（`:123`）——落地名词未入文 | B4 补回落地名词（如「落它本仓台账」），或在 §2.2 ⑩ 行注覆盖理由 |
| 4 | Requirements | 🔵 | §1 建档教训「多候选并存时建/写一律**显式绝对路径**」（`:30`）落为 B1「**显式路径**」（`:117`）——「绝对」限定未入文 | 确认是否有意泛化；若守 §1 原义，在「多候选并存」分支补「绝对」 |
| 5 | Doc hygiene | 🔵 | 批档 §3–§6 在盘为空（`:217`–`:220`）——若本轮 = 修复后复评，修复对象的在先发现表不在盘 ⇒ 修复项无法逐条核销（本轮按设计面现态核验） | 如在先评审轮存在，补落其发现表（或注明修复项去向）；若无，本轮即首评基线 |

**VERDICT: pass**

**计数**：🔴 0 ∥ 🟡 2 ∥ 🔵 3

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签 · 2026-10-02 23:0x）**：**依据**（用户 22:35 全自动授权「跟多仓机制相关的部分都自动跑到落地」）：① 评审轮 1 = **pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 3——发现表 = §3）；② 裁决 5/5 处置——发现 1–4 = **修正轮产物逐条在盘核验**（§4.4 句 ∥ §6.14 连带句 ∥ 变更记录两行 ∥ §2.0 笔路 ∥ §2.6 笔列 ∥ §2.3 B1/B4 双面 ∥ §2.2 随拍；执行体报告未达——核验以在盘产物为基准，如实）；发现 5 = 裁「非缺陷」（首评基线——§3 已载本轮全表）；③ **designToken 已签发**（轮 1 通过回执——值不落档）。**批准 = 实施轮准行**：笔路 = §2.0——CN 面 = eng-designer 笔 ∥ EN 面 = eng-coder 落笔 ∥ 需求面 = 主 agent 笔（§2.9-U1）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（EN 三档落毕——8/8 逐行全等 ∥ refs 零命中 ∥ ## 14/8/17 不变 ∥ 审计 CLEAN ∥ advisor pass ∥ fix round 0）



**轮 = initial（实施落笔 · EN 运行面）**：§2.3 EN 逐字（A-EN ∥ B0-EN ∥ B1-EN–B6-EN ∥ C-EN，按 M9 翻译回写、非 cp）已落三档运行面；CN 面 = 另笔 eng-designer（本席零触，读数仅引）。

**落地表（file:line × Δ，落笔后实读）**：

| # | 档 | 落点（file:line） | Δ | 内容 |
|---|---|---|---|---|
| 1 | thincoder-core/prompts/common.md | :170 | +1 | A-EN（§14「结构权威」`:169` 后） |
| 2 | thincoder-core/prompts/discipline-engineering.md | :122 | 行内追加 | item 1 句尾 + " (repo-self-containment is enforced by schema)" |
| 3 | thincoder-core/prompts/discipline-engineering.md | 原 :127 整行删 | −1 | 旧 item 5「Ledger repo-self-containment…（同规则重复 + 残句）」删净 |
| 4 | thincoder-core/prompts/discipline-engineering.md | :127–:131 | 0（顺缩） | item 6⇒5 ∥ item 7⇒6 ∥ item 8⇒7（B0-EN 映射逐条相符） |
| 5 | thincoder-core/prompts/discipline-engineering.md | :132–:137 | +6 | B1-EN–B6-EN（新增 item 8–13） |
| 6 | thincoder-core/prompts/persona-engineering.md | :58 | +1 | C-EN（`:57`「Landing one is a light action…」行后） |

**机检读数（落笔后复跑）**：

- `node scripts/prompt-refs-check.mjs` ⇒ 提示词面 84 档 ∥ 代码面 409 档 · **命中 0**（J1/J2/J3 零命中）。
- `##` 计数 = common **14** ∥ discipline-engineering **8** ∥ persona-engineering **17**（= 落笔前基线，零增）。口径校正：任务书验收写「`##` = 14/8/16」，实测 persona EN 基线 = 17（16 为 CN 侧数）——按「前后不变」判，零增成立。
- 内容行数 = **170 ∥ 184 ∥ 193**（= 基 169/179/192 + 预期 Δ +1/+5/+1，全等；设计 §2.4/§2.6 预测与实投相符，无漂移）。
- 新增行最长 361 字符（B1-EN）——在三档既有惯例内（落笔前最长 641/897/981）。

**逐行比对结论（落地档 ↔ §2.3 EN 块 · 一次性核对步）**：**8/8 逐行全等**——A（`common.md:170` ⟷ 批档 `:101`）∥ B1–B6（`discipline-engineering.md:132`–`:137` ⟷ 批档 `:129`/`:131`/`:133`/`:135`/`:137`/`:139`）∥ C（`persona-engineering.md:58` ⟷ 批档 `:149`）；B0 执行两处核对相符（`:122` 追加 ⟷ 批档 `:112`；删 + 序号顺缩 ⟷ 批档 `:113`）。比对方式 = ① 本席：从批档 §2.3 直取 EN 行、与落地档**整行等值**比较（脚本）；② explore 审计独立复核：逐行内容哈希全等（A `cb97bd46650b` ∥ B1 `29c6faac1ff2` ∥ B2 `12820e51a38b` ∥ B3 `a588dad56ccf` ∥ B4 `ae2325371990` ∥ B5 `43c77545bad0` ∥ B6 `5a88e499dc95` ∥ C `cb79be9d5cc8`）。

**审计与代码评审轮次与终态**：

- 内部 explore 偏离审计（轮 1）⇒ **CLEAN**（四类偏差零命中：无部分实现 / 无静默简化 / 无文档漂移 / 无清单外改动；逐行哈希复核全等）。
- 内部 advisor 代码评审（轮 1）⇒ **pass**（🔴 0 ∥ 🟡 0 ∥ 🔵 2：① 仓/项目 manifest 粒度措辞 = 逐字承接 §2.3、设计面裁定，不要求落地改动；② §5 本段 = 随本记录落地自然消解）。**fix round = 0**；终态 = **clean**。

**决策透明表**：① B0 追加位 = item 1 整条句尾（「…outside this repo」后、句号前），逐字承接 B0-EN 措辞；② B1–B6 顺接微调后 item 7（序号 8–13 连续）；③ CN 面（`docs/core/design/prompts/**`）现状读数 128 ∥ 176 ∥ 193（已落；引非本席笔，零触）。

**边界与如实**：产品码零触 ∥ 三档之外零触（git diff 射程 = 本三档：+1/+5/+1）∥ 零新 `##` 节 ∥ 语义零增删（除 B0 设计的删并）。`.thincoder/tmp/core-before/` 快照非本落地前置态（其 discipline-engineering 为 CN 264 行 ∥ persona 为旧 EN 56 行）⇒ 字节级「零越单」无独立快照复核，由结构旁证支持（行数 Δ 恰合 ∥ `##` 不变 ∥ EN prompt 面全目录无第二处多仓文）。

**补注（边界句口径）**：上「git diff 射程 = 本三档」= 本席**改动集**口径（thincoder-core/prompts 三档 ∥ 净 +1/+5/+1）；工作区全仓 diff 另含他笔在途档（CN 正本 ∥ 设计档 ∥ 他批档——本席零触）∥ 本档本段（§5 自段）。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-02 23:0x · 父侧）**

**核读**：CN 面（`docs/core/design/prompts/**` 三档——父侧抽查 ✓：`common.md:128` 段 A ∥ `discipline-engineering.md:119` 并入 + item 5 删净 + 序号 5/6/7 顺缩 + `:129-134` 六项 8–13 ∥ `persona-engineering.md:58` 段 C）∥ EN 面（`thincoder-core/prompts/**` 三档——父侧抽查 ✓：`common.md:170` ∥ `discipline-engineering.md:122` 并入 + `:127-131` 顺缩 + `:132-137` 六项 ∥ `persona-engineering.md:58`）∥ 需求面（`docs/core/requirements/PROMPT-SYSTEM.md` 行 14 + #827 登记块——父侧笔）∥ 设计档（`DOC-DISCIPLINE.md:1153`/`:1640` ∥ `PROMPT-SYSTEM.md:365`/`:500` 状态句随正——修正轮产物）。

**复跑**：`prompt-refs-check` **零命中**（CN ∥ EN 两轮自跑）∥ `##` = **14/14/8/8/16/17** 不变（EN 侧 persona = 17——派单文本笔误「14/8/16」本表收正）∥ 行数 = 128/176/193 ∥ 170/184/193（= 基线 +1/+5/+1，双侧全等）∥ 逐行比对 **8/8 全等**（双侧）。

**过程如实**：① 修正轮（发现 1–4）执行体报告曾未达——以在盘产物逐条核验为准（后其报告到达，与核验一致）；② 评审 #1 裁决 5/5（4 修 + 1 裁「非缺陷」）；③ 实施双面 = CN eng-designer ∥ EN eng-coder（带凭证）——双侧交付均经抽查核验。

**结算**：**收口（2026-10-02）**——记录冻结；台账 **#827 核销**（两段式）；提交 = 随收口签入（双远端；哈希以 errata 落 `#828` 批 §1 邻域）。
