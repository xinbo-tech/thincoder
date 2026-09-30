# 2026-09-30 · 提示词 EN 面补正
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #721（源 = 轻通道机制批实施轮内评审应答 #1 ∥ #3——均 🔵 非阻断）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」。两修：① EN 面细节面子枚举未携 CN 全量（`thincoder-core/prompts/discipline-engineering.md:44 ∥ :46` 对位 CN 正本 `docs/core/design/prompts/discipline-engineering.md:44 ∥ :46`——「参数（阈值丨默认值丨长度）」「既有交互细部（顺序丨位置丨键位丨提示语）」两处 EN 缺）；② ①–⑤ 行形并段（`:45-49` 连续五行为 md 软换行 ⇒ 渲染并段——CN/EN 同位）。两修 = 批档正文修订 + 两稿同改——**注：#714 批档已冻结（零触）；正文收正落点 = 设计档/需求档面（设计轮定）**。。
> 台账 = #721（PROMPT-SYSTEM · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-30
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 #721（轻通道机制批实施轮内评审应答 #1 ∥ #3——均 🔵 非阻断）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」。

**范围**：两修——① EN 面细节面子枚举未携 CN 全量（`thincoder-core/prompts/discipline-engineering.md:44 ∥ :46` 对位 CN 正本 `docs/core/design/prompts/discipline-engineering.md:44 ∥ :46`：「参数（阈值丨默认值丨长度）」「既有交互细部（顺序丨位置丨键位丨提示语）」两处 EN 缺）；② ①–⑤ 行形并段（`:45-49` 连续五行为 md 软换行 ⇒ 渲染并段——CN/EN 同位）。P1 CN ∥ P2 EN 两稿同改。**冻结批档零触**（#714 批档已冻结）——正文收正落点 = 设计档 ∥ 需求档面（设计轮定；需求档笔权 = 父侧，缺口上抛）。

**下一手**：设计轮（逐字单）→ 评审 → 批准 → 实施（两稿同改）。

**父侧处置（2026-09-30 · 承设计轮上抛三件）**：**U1**（头部引用 `:44 ∥ :46` 与实读不符——缺口实读**仅 `:44`**；`:46` = ② 行两面对等）= 本补记收正，以 §2 逐字单为准；**U2**（persona 两档软换行续行渲染并段同现象——非条目式）= **明确接受**（散文续行语义本连续、无可失结构；零动作、不另挂）；**U3**（`docs/core/requirements/LIGHT-CHANNEL.md:4` 行宽 341 > 300——既有）= **父侧机械修**（折行 · 零语义 · 可 revert，同拍落）。

**评审**：设计评审已点火（advisor id=13）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮——§3 轮次 1 两 🔵 收正落位（§2.9）；🔵1 = md.mjs 实跑读数 ∥ 🔵2 = 验证腿⑤ 补项）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

**来源**：台账 #721；源 = #714 实施轮评审应答 #1 ∥ #3（均 🔵 非阻断）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」（§1 在案）。

| # | 条目（回指 §1） | 覆盖 |
|---|---|---|
| E1 | **EN 面细节面子枚举补齐**（应答 #1）：EN :44 未携 CN 全量——「参数（阈值 ∥ 默认值 ∥ 长度）」∥「既有交互细部（顺序 ∥ 位置 ∥ 键位 ∥ 提示语）」两处缺 | 全覆盖——逐字单 = §2.2 ①；落点 = EN :44 行内替换（锚全文件唯一命中 = 1 处，实读） |
| E2 | **①–⑤ 行形并段修正**（应答 #3）：:45–:49 五行为 md 软换行 ⇒ 渲染并段（CN/EN 同位） | 全覆盖——行形裁定 = §2.2 ②；两稿同式 |
| E3 | **两稿同改口径**（§1：P1 CN ∥ P2 EN——本批记法 = 两档；与 #714 四档记法无涉） | 覆盖——E1 落 EN 单稿（CN 已含全量，零文本改）∥ E2 落两稿；终态对等 = AC3 |

**不覆盖（边界）**：persona 两档（findings 未及——零触）∥ 机制本体（零改）∥ 需求档（实读零缺口——§2.3）∥ #714 批档（冻结——零触）∥ 产品码（零触）。

### 2.2 机制设计：逐字单与行形裁定

**实读基准（本席 · 2026-09-30 18:3x）**：CN 正本 `docs/core/design/prompts/discipline-engineering.md:44–:53` ∥ EN 运行面 `thincoder-core/prompts/discipline-engineering.md:44–:53`（逐行实读）；联动 = `docs/core/design/LIGHT-CHANNEL.md`（§2.1 ∥ §3 ∥ §4 ∥ §8）∥ `docs/core/design/PROMPT-SYSTEM.md`（§6.1 ∥ §6.12）∥ `docs/core/requirements/LIGHT-CHANNEL.md`（§2.1）∥ #714 批档（§2.3 ∥ §2.9 ∥ §2.10 ∥ §6）∥ `PROJECT-MANIFEST.json` checkConfig ∥ 检查脚本面（`prompt-refs-check.mjs` ∥ `doc-check*.mjs`）。

#### ① 逐字单

**CN 正本 :44 现状逐字**（本批**零文本改**——仅行形 ②）：

```md
**轻通道（细节面受控旁路——五问全过才走；旁路 ≠ 取消）**：细节面（视觉 ∥ 文案 ∥ 参数（阈值 ∥ 默认值 ∥ 长度）∥ 既有交互细部（顺序 ∥ 位置 ∥ 键位 ∥ 提示语））的调整可免「设计 → 评审 → 批准」全链——直改 → 实时走查 → 定版。路由五问（任一不过 ⇒ 全链）：
```

**EN 运行面 :44 改稿**（替换锚 ⇒ 新串）：

- 锚：`parameters · existing-interaction details`
- ⇒ 新串：`parameters (thresholds · defaults · lengths) · existing-interaction details (order · position · keybindings · hint texts)`
- 改后整行逐字（正译——与 CN 语义等价）：

```md
**Light channel (detail-face controlled bypass — all five questions must pass; bypass ≠ cancellation)**: adjustments on the detail face (visual · copy · parameters (thresholds · defaults · lengths) · existing-interaction details (order · position · keybindings · hint texts)) may skip the「Design → Review → Approval」chain — direct edit → live walkthrough → freeze. The five routing questions (any fail ⇒ full chain):
```

**译词对照（CN ⇒ EN · 逐项同序）**：参数⇒parameters ∥ 阈值⇒thresholds ∥ 默认值⇒defaults ∥ 长度⇒lengths ∥ 既有交互细部⇒existing-interaction details（存量词）∥ 顺序⇒order ∥ 位置⇒position ∥ 键位⇒keybindings ∥ 提示语⇒hint texts。分隔符沿各面存量（CN ` ∥ ` ∥ EN ` · `）；嵌套括号镜像 CN（双闭括号）。判由 ∥ 备选 = §2.6 K3。

#### ② 行形裁定（两稿同式 = 独立成段）

- **改法**：:44–:49 六行**两两之间各插 1 空行**（5 处/档）；**:49 ∥ :50 边界零改**（:50 起为既有列表——渲染已独立截断，finding 未及）。
- **净增**：CN 147 ⇒ **152** 内容行 ∥ EN 154 ⇒ **159** 内容行（各 +5；文本零改——EN 另含 :44 替换）。
- **判由（渲染实测 · 本席复跑）**：标准 md 语义——现态 :44–:49 = **1 段**（六行并段）⇒ 后置 = **6 段**（每行独立）；项目渲染器 `thincoder-render-core/md.mjs` 同核：`<p>` 段 **1 ⇒ 6**。
- **否决**（详 = K1）：「列表行式 `- ①`」（实测渲染 = **9 项单列表**——五问与通道外清单 ∥ 轮次形 ∥ 行使面 ∥ 边界并组 + 双标记 `- ①`）；「行尾硬换行」（隐形字符易失）；「`1.`–`5.` 阿拉伯列表」（§2.10 相撞由在案）。

#### ③ 后置全文块（围栏——比对基准 = 此；改动区 :44–:54 ∥ 块 = :44–:58 · 两档各 15 行）

**CN 正本后置块**：

```md
**轻通道（细节面受控旁路——五问全过才走；旁路 ≠ 取消）**：细节面（视觉 ∥ 文案 ∥ 参数（阈值 ∥ 默认值 ∥ 长度）∥ 既有交互细部（顺序 ∥ 位置 ∥ 键位 ∥ 提示语））的调整可免「设计 → 评审 → 批准」全链——直改 → 实时走查 → 定版。路由五问（任一不过 ⇒ 全链）：

① **触面**：落在细节面闭合枚举内（枚举扩面 = 新需求）；

② **行为**：不产生新行为路径（新分支 ∥ 新状态 ∥ 新流程 ∥ 新机制）；

③ **契约**：不碰接口 ∥ 通道协议 ∥ 数据结构 ∥ 持久化 ∥ 跨端对位语义 ∥ 安全面；

④ **体量**：射程小——单面内、无连带、落点 ≤15 档；

⑤ **拿不准 ⇒ 全链**（fail-closed——宁可重，不可偷渡）。
- **通道外清单**（触界即停、上抛、回全链）：新机制 ∥ 新流程 ∥ 接口契约 ∥ 数据结构 ∥ 持久化 ∥ 跨端语义 ∥ 安全面 ∥ 体量超标。
- **轮次形**：轻通道轮次 = 批档一本（逐笔收录：交底 ∥ 改动 ∥ 走查 ∥ 定版）+ 台账行逐笔；收尾一次全链（设计形式化 → 独立评审（落码 ∥ 记录 ∥ 文档对账）→ 修复（若有）→ 批准 → 收口核销，含必要测试）；**收尾未落 ⇒ 不许核销**（批档 ∥ 轮次行挂住）。
- **行使面**：路由 = 主 agent 逐笔判定、随交底公开（用户可否决）；子代理不路由、不援引本通道。
- **边界（不做）**：边界外内容走通道 ∥ 免收口 ∥ 以本机制替代全链（机制自身 ∥ 大改仍全链）。
```

**EN 运行面后置块**：

```md
**Light channel (detail-face controlled bypass — all five questions must pass; bypass ≠ cancellation)**: adjustments on the detail face (visual · copy · parameters (thresholds · defaults · lengths) · existing-interaction details (order · position · keybindings · hint texts)) may skip the「Design → Review → Approval」chain — direct edit → live walkthrough → freeze. The five routing questions (any fail ⇒ full chain):

① **Touch surface**: inside the detail-face closed enumeration (extending it = a new requirement);

② **Behavior**: no new behavior path (branch · state · flow · mechanism);

③ **Contract**: no interface · channel protocol · data structure · persistence · cross-end semantics · security surface;

④ **Size**: small reach — one surface, no entanglements, ≤15 files;

⑤ **When unsure ⇒ full chain** (fail-closed — prefer heavy over smuggled).
- **Off-channel list** (touching ⇒ stop, report, back to the full chain): new mechanism · new flow · interface contract · data structure · persistence · cross-end semantics · security surface · over-size.
- **Round form**: a light-channel round = one batch record (per-pen entries: disclosure · change · walkthrough · freeze) + per-pen ledger rows; one full chain at closeout (design formalization → independent review (code · record · doc reconciliation) → fixes (if any) → approval → closeout settlement, including the necessary tests); **closeout not landed ⇒ no settlement** (the batch record · the round ledger row stays open).
- **Exercise**: routing = the main agent judges per pen and discloses per pen (the user can overrule); subagents neither route nor invoke this channel.
- **Boundary (never)**: off-boundary content through the channel · closeout skipping · substituting the full chain (the mechanism itself · major changes stay full-chain).
```

### 2.3 落点裁定（正文收正 ∥ 待改两档）

**待改两档（实施轮）**：`docs/core/design/prompts/discipline-engineering.md`（CN 正本）∥ `thincoder-core/prompts/discipline-engineering.md`（EN 运行面）——逐字 = §2.2 ③；编辑 = EN :44 替换 + 两档 +5 空行。

**正文收正落点（裁定）**：
- **修正后正文 = 本批批档 §2 围栏块**（§2.2 ③——比对/批准基准）；**设计档面 = `docs/core/design/LIGHT-CHANNEL.md` §8 变更记录一行**（本设计轮已落——读回 :163）；
- **#714 批档零触**（冻结指令）——其 §2.3 围栏 = 历史面，原样保留；存量惯例「**合法改档以当批围栏块为新基线**」（`PROMPT-SYSTEM.md` §6.1）⇒ 无需回改 #714；
- **需求档面 = 零缺口零触**：实读 `docs/core/requirements/LIGHT-CHANNEL.md` §2.1——枚举已含全量子枚举；五问为 `1.`–`5.` 列表（无并段）⇒ 无缺口可上抛、无事可办；
- 否决：「需求档收正」（无缺口——无事可做）·「#714 解冻补记」（指令零触 + 冻结面不回改）。

### 2.4 受影响文件与测试面

| 档 | 现量（内容行 · KD-4） | 改后 | Δ | 说明 |
|---|---|---|---|---|
| `docs/core/design/prompts/discipline-engineering.md`（CN 正本 · 本批 P1） | 147（read 显示 148） | 152（显示 153） | +5 空行 | 文本零改；行宽 max **243** ≤300 不变 |
| `thincoder-core/prompts/discipline-engineering.md`（EN 运行面 · 本批 P2） | 154（read 显示 155） | 159（显示 160） | +5 空行 + :44 替换 | :44 行宽 336 ⇒ **416**（EN 面不在行宽域——无闸；读数如实） |
| `docs/core/design/LIGHT-CHANNEL.md` | 161 | 163 | +2（空行 + §8 行） | **本设计轮已落**（读回 :163，行宽 234） |

**测试面（零新增断言——承测试纪律「不因单次改动而增补」）**：
- 验证腿①：一次性逐行比对——落地两档 ↔ §2.2 ③ 围栏块（含空行结构；承批次收尾核对步）；
- 验证腿②：`node scripts/prompt-refs-check.mjs` 复跑——新文本零文档引用（`hint texts` ∥ `keybindings` 等零 `.md` ∥ `§N.N` 形）；
- 验证腿③：`node scripts/doc-check.mjs` 复跑——本席已跑：`docs/core/design/LIGHT-CHANNEL.md` **零命中**（锚 ∥ 行宽）；全仓悬空 55 = **非本批引入**（本批 doc 面 = 本档 + 批档——批档在检查排除域）；
- 验证腿④：`##` 块计数前后同值（零新节——读数入实施 §5）；
- 单元件 = 无（文本面——#714 先例：逐字比对 + 机检为验证腿）；集成面 = 零影响；仓套件 = 不跑（父侧收口一次——报告义务句照报）。

### 2.5 验收对照（回指本批条目）

| # | 条目 | 可核形态 |
|---|---|---|
| AC1 | E1 | 落地 EN :44 含两子枚举且与 CN 逐项对等（3 ∥ 4 项同序）——一次性比对（锚串 + 全行逐字） |
| AC2 | E2 | :44–:49 六行两两间空行在位（5 处/档）；渲染读数 = 标准语义 6 段（原 1）∥ md.mjs `<p>` 6（原 1）——一次性读 |
| AC3 | E3 | CN ∥ EN 结构对位（子枚举齐 + 同式；差异仅 = 语言 ∥ 面内分隔符）——比对读数 |
| AC4 | 机检面 | prompt-refs 命中 0 不变 ∥ doc-check 本档零新增 ∥ `##` 块计数同值 ∥ CN 行宽 ≤300 |

### 2.6 关键决策记录（含否决）

| # | 决策 | 判由 ∥ 否决 |
|---|---|---|
| K1 | 行形 = **独立成段**（空行分隔；5 处/档；:49∥:50 边界零改） | 最小改（whitespace-only——逐字零动）× 组界保全（五问 ∥ 其余四条目的分组在渲染面保持）× §2.10 形态意图（①–⑤ 非列表）；渲染实测 = 6 段 ∥ 6 `<p>`。否决「列表行式 `- ①`」（9 项单列表并组 + 双标记）·「行尾硬换行」（隐形字符易失）·「阿拉伯列表」（§2.10 在案） |
| K2 | 正文收正 = 本批 §2 围栏块 + `LIGHT-CHANNEL.md` §8 一行；#714 零触；需求档零缺口 | 冻结指令 + 当批基线惯例（§2.3）；需求档实读无缺口 |
| K3 | EN 译词 = thresholds · defaults · lengths ∥ order · position · keybindings · hint texts；分隔符面内约定；嵌套镜像 | 逐项对等（3 ∥ 4 同序）；keybindings = 仓内成词（`thincoder-vscode/package.json:95`）；hint texts = 直译保真——否决「wording」（措辞义更泛，与 copy 易混） |
| K4 | 射程：persona 两档 ∥ 机制本体 ∥ 产品码零触；零新增断言；:49∥:50 零改 | 最小改 ∥ findings 未及 ∥ 测试纪律 |

### 2.7 上抛项（≤3）

- **U1（§1 引用核）**：§1 ∥ 头部引用 `:44 ∥ :46` 与实读不符——缺口实读**仅 :44**（:46 = ② 行，两面全量对等——audit 在案）；本席按实读落单；§1 引用是否收正 = 父侧笔（或知悉）。
- **U2（同族观察 · 父侧裁）**：persona 两档软换行续行（CN `persona-engineering.md:85–:89` ∥ EN `:86–:90`）——渲染并段同现象、性质 = 列表项内散文续行（非 ①–⑤ 式条目）；#714 未列、本批零触——处置（另挂 ∥ 明确接受）= 父侧裁。
- **U3（联动档既有读数）**：`docs/core/requirements/LIGHT-CHANNEL.md:4` 行宽 **341** > 300（既有——非本批引入；doc-check 复跑检出）——知悉 ∥ 另挂。

### 2.8 交付前自检（读回）

- **读回（D6）**：本 §2 = 写入后读回 ✓；`LIGHT-CHANNEL.md` §8 行读回 ✓（:163）。
- **三链一致**：§1 两修 = 本 §2 条目 E1 ∥ E2 = 台账 #721（待核销）——同源。
- **实施口径（建议）**：单舱两档（CN 正本 ∥ EN 运行面——逐字同源、串行同笔）；落笔前 §3 评审 + §4 批准 + token 签发（父侧门——本设计轮不发起）。
- **零触核对（本设计轮实读）**：persona 两档 ∥ 需求档 ∥ #714 批档 ∥ 产品码 —— 未改。

### 2.9 收正轮（评审 §3 轮次 1 · 🔵1 ∥ 🔵2 采纳落位 · eng-designer · 2026-09-30）

**依据**：§3 轮次 1 发现 #1 ∥ #2（均 🔵 · 全部采纳 · 逐号点修）。本块 = 两号收正落位；§2 append-only ⇒ 原句留档，**读数 ∥ 验证面以本块为准**；机制本体零改（逐字单 ∥ 落点裁定不动）。

**🔵1 落位（验收读数口径 · 渲染构成）**

- ① **判由收正**（§2.2②「每行独立」句——以本句为准）：「后置 = 6 段——**六行各自起段**（六行 = :44 头行 + ①–⑤；五处空行仅落六行两两之间）∥ 项目渲染器 `md.mjs` `<p>` 段 **1 ⇒ 6**」。

- ② **实况收正**（§2.2②「:50 起为既有列表——渲染已独立截断」句）：**渲染实测**——本席运行 `thincoder-render-core/md.mjs` 全档渲染（2026-09-30）：按空行分段（`:123-125`）∥ 单换行转 `<br>`（`:128`）∥ `<p>` 仅紧邻块标签时剥离（`:138`）。
  ⇒ :49 ∥ :50 单换行保持之下，**第六个 `<p>` 自 ⑤ 起并承载 :50 起列表块标记**：实测形态（CN；EN 同态）= `<p>⑤ …。<br><ul>（:50–:53 四项）</ul><br><h2>…</h2>…` 直至下一空行段界 `</p>`（实测收于「任务边界与范围外注记」节末）；显示分离靠浏览器隐式闭合 `<p>`（渲染器 `:133-136` 自注）。**1 ⇒ 6 计数与改法不动**。

- ③ **一次性比对读数**（§2.4 腿① · 承收尾核对步）同拍注明实际输出构成：后置块 = **6 `<p>`**——头行 1 ∥ ①–④ 各 1 ∥ 第 6 = ⑤ 起段并承 :50 起列表块标记；全档 `<p>` 计数 **4 ⇒ 9**（Δ +5——两档同值 · 本席实测）。比对基准不变（§2.2③ 围栏块逐字）。

- ④ §2.5 AC2 计数句（1 ⇒ 6）不变（评审核成立）；构成以本块 ② 为准。EN :44 改稿与 §2.2③ 围栏逐字等值（本席构造比对实核 = true）。

**🔵2 落位（验证覆盖面）**

- **择「补读数项」——新增验证腿⑤「块区外零改动」**（弃「按行数兜住」声明）。
- **验证腿⑤**（一次性比对形 · 承收尾核对步同拍）：落笔后对两档各跑 per-file diff（对照基线 = 落笔前）——**全部 hunk ⊆ 块区（后置坐标 :44–:58——CN：空行插入；EN：空行插入 + :44 替换）∥ 块区外 hunk = 0**；读数入 §5。
- **判由**：行数读数（147⇒152 ∥ 154⇒159）+ `##` 块计数 + prompt-refs 兜住增删与引用面，「错行替换（落块区外）」无读数面 ⇒ 补 diff 一读即闭合（成本 = 一读；#714 §2.4「其余行零触」同轴）；两档工作树现无未提交改动（本席 `git status` 实核）⇒ 基线干净、读数直取。

**零触核对（本席实读）**：产品码 ∥ 需求档 ∥ persona 两档 ∥ #714 批档 ∥ 设计档（`LIGHT-CHANNEL.md`——两号所指读数 ∥ 验证腿均在批档 §2 面；§8 :163 概述句不受影响）——未改。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（#721 提示词 EN 面补正批 · 设计轮）**——核验基准 = 批档 §2（逐字单 ∥ 行形裁定 ∥ 落点裁定 ∥ 受影响文件表 ∥ 验收对照 ∥ 关键决策；声明指本批范围在 §2）+ 设计档 `thincoder/docs/core/design/LIGHT-CHANNEL.md` 全文（本批落点 = :163）+ 交叉核对面（CN/EN 提示词档 `:44`–`:53` ∥ 需求档 §2.1 ∥ `PROMPT-SYSTEM.md` §6.1/:163 · §6.12 ∥ `PROJECT-MANIFEST.json` scanDirs ∥ `thincoder-render-core/md.mjs` ∥ #714 批档 §2.10/§3/§6 ∥ `thincoder-vscode/package.json:95`）。

**发现表（设计评审 · 提示词 EN 面补正批 · 设计轮）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 验收读数口径 / 渲染构成 | 🔵 | AC2「md.mjs `<p>` 1 ⇒ 6」计数成立，但 §2.2 ② 判由「:50 起为既有列表——渲染已独立截断」与渲染器实际输出不完全吻合（读码推演 · 未运行渲染器）：`md.mjs:123-125` 仅按空行分段 ∥ `:128` 单换行转 `<br>` ∥ `:138` 仅在 `<p>` 紧邻块标签时剥离 ⇒ 本批保持 :49∥:50 单换行（零改设计）之下，后置第六个 `<p>` 自 ⑤ 起并承载 :50 起列表块标记（视觉分离靠浏览器隐式闭合——`md.mjs:133-136` 自注）；「每行独立」的准确含义 = 六行各自起段 | 一次性读数按实际输出逐项记录（第六段构成写明）；判由措辞可选随读数收正——不影响 1⇒6 计数与改法 |
| 2 | 验证覆盖面 | 🔵 | 验证腿 ① 仅比对围栏块区（:44–:58）∥ 腿 ④ 仅数 `##` 块 ⇒「块区外零改动」无读数面（#714 §2.4 曾有「其余行零触」句）；行数读数（152 ∥ 159）+ prompt-refs 兜住增删与引用面，错行替换类改动无面 | 验证腿补一项块区外零改动读数（或显式声明该面由行数读数兜住）——非阻断 |

**核验通过项（实读读数）**：E1 缺口实读 = 仅 EN `:44`（`:46` 与 CN ② 行全量对等——U1 判定成立；锚串 `parameters · existing-interaction details` 全档唯一命中 1 处）∥ E2 五问软换行 CN/EN 同位成立、§2.2 ③ 后置围栏块与现盘逐字吻合、:49∥:50 边界零改 ∥ KD-4 内容行 147 ∥ 154 ∥ 163（显示 148 ∥ 155 ∥ 164）与 §2.4 表读数一致 ∥ CN 档与设计档零行 >300（regex 实核）∥ 需求档 U3 折行已落（`:6` 注记在盘）∥ `PROJECT-MANIFEST.json` scanDirs=["docs"] ⇒ EN 面出宽域（设计声明成立）∥ `PROMPT-SYSTEM.md:163`「合法改档以**当批**围栏块为新基线」逐字在盘（K2 判由成立）∥ K3 `keybindings` 引证精确（`thincoder-vscode/package.json:95`）∥ persona 两档零枚举缺口（零触声明成立）∥ 受影响面全 `.md`（criterion 8 豁免；行数仍已标注并抽核）∥ 无新增文件 ∥ 无跨档矛盾（§6.12 无被本批改写的引文）。

**核验边界（unverified）**：台账 #721 行本体（台账 = DB，`thincoder-core/ledger-db.mjs`，评审工具面无读取路径）∥ 设计者报告的脚本复跑读数（doc-check 悬空 55 ∥ prompt-refs 0 ∥ 渲染器实跑 1⇒6）——仅代码 / 正则可核部分已复核 ∥ 行宽精确值（CN 243 ∥ EN 336⇒416 ∥ §8 行 234）仅核到 ≤300。

**范围外注记（无严重度）**：批档头部 ∥ §1 范围仍携 `:44 ∥ :46`（`:46` 实读全量对等——U1 父侧处置注记已在案收正，记录面 append-only 惯例下无动作）。

计数：🔴 0 · 🟡 0 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30）**：依据 = 用户 18:28「自动跑完」授权 + **设计评审通过**（0🔴 ∥ 0🟡 ∥ 2🔵——两号全采纳、修复轮落定于 §2.9〔父侧核验 ✓〕）。

**实施舱**：eng-coder（单舱两档 · 设计Token 已签发——值不入档）。**实施范围** = §2.2③ 双围栏块**逐字**：CN `docs/core/design/prompts/discipline-engineering.md`（①–⑤ 六行两两空行插入 5 处）∥ EN `thincoder-core/prompts/discipline-engineering.md`（`:44` 行内替换 + 空行插入 5 处）；**验证腿 ①–⑤**（§2.4 + §2.9 🔵2——腿⑤ = 块区外零改动 diff）。

**验收** = §2.5 AC1–AC4（两档与围栏块逐字一致 ∥ `<p>` 1⇒6 ∥ 行数 152 ∥ 159 ∥ 零新增 `##`）+ 腿⑤（块区外 hunk = 0）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（单舱两档 · 逐字单落码 · 腿①–⑤ 全绿 · 内部审计 CLEAN ∥ 评审 pass ∥ fix round = 0）

**5.1 交付摘要**

- **落点**（§2.3 两档）：CN `docs/core/design/prompts/discipline-engineering.md`（:44–:49 六行两两间各插 1 空行 · 5 处 · 文本零改）∥ EN `thincoder-core/prompts/discipline-engineering.md`（`:44` 行内替换 + 同位 5 空行）。
- **EN `:44` 替换**（锚 `parameters · existing-interaction details` 全档唯一命中 1 处、实核）：⇒ `parameters (thresholds · defaults · lengths) · existing-interaction details (order · position · keybindings · hint texts)`。
- **落笔**：`apply_patch` 一次两档（原子）；写后即读回两档块区（D6）。回退兜底 = 两档基线对 HEAD 干净（`git status --porcelain` 空、实核）⇒ 可全量 revert。

**5.2 验证腿①–⑤ 读数（§2.4 + §2.9🔵2——载此为准）**

- **腿①（逐字比对）**：比对脚本直读批档 §2.2③ 双围栏块**原文** vs 两档 `:44–:58`——**两档 15/15 行逐行字节全等**（六行落位 :44/:46/:48/:50/:52/:54 · 两两间恰 1 空行 · `:59` 与前后边界按设计零改）；独立审计复跑哈希比对：CN ∥ EN 各 15/15 逐位相等（审计报告在案）。
- **腿②（prompt-refs）**：`node scripts/prompt-refs-check.mjs` ⇒ `汇总：提示词面 84 档 · 代码面 402 档 · 命中 0` ∥ `OK(prompt-refs): J1/J2/J3 三式零命中`（落码前后同值）。
- **腿③（doc-check）**：`node scripts/doc-check.mjs` 复跑 ⇒ 两档命中行 = **0**（前后皆 0；`discipline-engineering` ∥ `LIGHT-CHANNEL` 关键词检索零命中）。全仓读数被他批并发写扰动（悬空 59 同值 ∥ 行宽 164 → 165 ∥ 候选 41172 → 41177——同期实读他档在写：`docs/core/design/PROVIDER.md`〔检查前 ~5s〕∥ `docs/desktop/design/IPC.md` ∥ `PROJECT.md`〔~2min〕等）；本批可归因面 = 两档零新增（两档行宽谱不变：CN max 243 ≤300 ∥ EN 出域）。
- **腿④（块计数 ∥ 行宽）**：`##` 两档 = 8（同 HEAD · 零新节）；CN max 243（:79）≤300；EN `:44` 行宽 **336 ⇒ 416**（与 §2.4 预测一致；EN 面出宽域——`PROJECT-MANIFEST.json:25-28` `scanDirs=["docs"]` ∥ `lineWidth=300`，实读）。
- **腿⑤（块区外零改动）**：per-file diff 对基线（落笔前工作树）：CN **5 hunk = 纯空行插入**（`@@ -44,0 +45 @@` ∥ `-45,0 +47` ∥ `-46,0 +49` ∥ `-47,0 +51` ∥ `-48,0 +53`）∥ EN **5 hunk**（`:44` 替换兼 1 空行 `@@ -44 +44,2 @@` + 4 条插入）——**全部 hunk ⊆ 块区 :44–:58 ∥ 块区外 hunk = 0**。
- **AC3 行数**：内容行（split−1）CN **147 ⇒ 152** ∥ EN **154 ⇒ 159**（read 显示 153 ∥ 160）。
- **AC2 渲染（md.mjs 实跑）**：全档 `<p>` CN ∥ EN 皆 **4 ⇒ 9**（Δ+5 · 与 §2.9③ 计数一致）；①–⑤ 各获独立 `<p>`（块区 0 ⇒ 5）；第 5 个 `<p>` 自 ⑤ 起并承 :55–:58 列表块（`<p>⑤ …。<br><ul>（四项）</ul><br><h2>…</h2>…` 直至下一空行段界；窗口〔列表尾→`<h2>`〕内 `<p>`=5 ∥ `</p>`=4——⑤ 段闭标记在 h2 之后，两档同态）——与 §2.9② 形态描述逐字吻合。**构成 nuance**：头行 :44 无独立 `<p>`（以 `<br>` 续于前置列表块尾 `</ol><br><strong>…`；HEAD 同态、非本批引入）——已报父侧（note）∥ 详 5.5-2。

**5.3 决策透明表**

| # | 决策点 | 取舍 ∥ 判由 |
|---|---|---|
| D1 | 落笔手段 = `apply_patch` 两档单次（原子） | 弃逐行 `insert_after`×10（轮次多且需逐次复读）∥ 弃脚本改写（文档写作纪律）；上下文行失配 = hunk 硬拒绝（失败可见、无静默改写） |
| D2 | EN `:44` = 整行替换 hunk | 弃子串替换试写（区段语义不确定）；整行上下文失配即拒绝，更稳 |
| D3 | 构成读数实测定谳 | md.mjs 实跑 + 两档同测；§2.9③「头行 1」措辞出入如实记（5.5-2），实体档零动作 |
| D4 | 他批并发漂移不入本批归因 | 全仓机检读数漂移（他批在写 · mtime 实测）如实记录；本批归因面 = 两档（零新增） |

**5.4 审计与代码评审轮次 ∥ 终态**

- **审计（explore · 独立核验）轮次 1 = CLEAN**（四类偏差零：部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 清单外改动；两档 15/15 行哈希逐位相等；行数 ∥ `##` ∥ 行宽 ∥ 渲染构成逐项符）。审计边界（自报）：只读装配 ⇒ 腿⑤ diff ∥ 脚本复跑由本 §5 读数承接。
- **代码评审（advisor · type=code）轮次 1 = pass**（🔴0 ∥ 🟡1 ∥ 🔵2）。应答：🟡-1「§5 待补（协调项）」⇒ **采纳**——本块即落；🔵-2「批档头部/§1 旧 `:44 ∥ :46` 引用」⇒ 无动作（父侧 U1 已处置）；🔵-3「§2.9② 括注口径」⇒ **以实测为准**（见 5.2 末 + 5.5-2；评审该条系其未跑渲染器之推演）；无需改码。
- **fix round = 0**（无 findings 触发码面改动）。
- **终态 = `clean`**（交付收敛）。

**5.5 残留（≤2）**

1. 批档头部/§1 旧引用 `:44 ∥ :46` 残留（🔵 · 父侧 U1 已在案「以 §2 逐字单为准」）——本批零触，记录面历史。
2. §2.9③「头行 1」字样与实测构成出入（头行无独立 `<p>` · 两态皆 `<br>` 粘连）——已双路披露（父侧 note ∥ 本 §5）；是否 §2 追加一行收正 = 父侧笔。

**零触核对（本席实读）**：persona 两档 ∥ #714 批档 ∥ 需求档 ∥ 产品码 ∥ 设计档——未改；本批改面 = 两档提示词档块区 :44–:58（两档之外零文件触碰）。

## §6 验证与收口（父代理）

**实施舱回执** = §5 在盘（eng-coder 自写 + 状态行「实施完成」）；终态 = **clean**（审计 1 轮 CLEAN〔15/15 哈希逐位相等〕∥ 代码评审 1 轮 pass 0🔴；fix 0 轮）。

**父侧核验（2026-09-30 19:1x · 独立复读）**：① 两档行数 = **CN 152 ∥ EN 159**（= 设计值）；EN `:44` 两处子枚举在位（`thresholds · defaults · lengths` ∥ `order · position · keybindings · hint texts`）；空行结构在位（`:45` 空行实读）；② 腿 ①–⑤ 全绿（逐字 15/15 字节全等 ∥ `prompt-refs-check` 命中 0 ∥ `doc-check` 两档零命中 ∥ `##` 块 8 同值 ∥ **块区外 hunk = 0**——读数 = §5）；③ 提交 `899f2931`。

**收口核对（D7）**：角色表 §1–§6 ✓ ｜ §2 状态行（设计完成 · 修正轮）∥ §5 状态行（实施完成）✓ ｜ 计数（152 ∥ 159；块区 `<p>` Δ+5）✓ ｜ 指针（§2.2③ ∥ §2.9 ∥ §4 ∥ §5）✓ ｜ 变更记录（`LIGHT-CHANNEL.md` §8 设计轮已落）✓ ｜ **台账 #721 追认核销** ✓。

**残留（如实 · 非阻塞）**：① 批档头部/§1 旧引用 `:44 ∥ :46`（记录面历史；U1 处置注记在案——以 §2 逐字单为准）；② §2.9③「头行 1」与实测构成的出入（头行 `:44` 无独立 `<p>`——`<br>` 粘连于前置列表块尾，非本批引入；AC2 的「1 ⇒ 6」= **语义段计数**，机检 `<p>` Δ = +5）——以 §2.9② 形态描述为准（本节注明；§2 = 设计者段，不回改）。

**收口结论**：验收 = AC1–AC4 + 腿 ①–⑤ 全绿（父侧核）；**记录冻结**。
