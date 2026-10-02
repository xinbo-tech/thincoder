# 2026-10-02 · 轻通道判据收口（降门槛 · 核销紧固）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 22:36–22:58 五裁（bugfix 路由指正 → 「简单明确」批评 → 22:55「重点 = 挂账走全链核销不漏，没必要把门槛设置得那么高」→ 22:57「分流句是否绝对必要」（复核 ⇒ 撤）→ 22:58「开始」）；台账 #830；机制自身 = 全链（设计 → 评审 → 批准 → 实施）。
> 台账 = #830（轻通道机制 · 归批）。前情 = 无（独立批——机制族判据收口；承台账 #830）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：轻通道机制 · **判据收口**——准入降门槛（三样清单 + 一句边界）+ 核销紧固（不漏 = 第一优先级）。机制自身 = **全链**（设计 → 评审 → 批准 → 实施）。

**用户原话（逐字 · 2026-10-02 22:36–22:58 五则）**：①「bugfix 没走轻通道肯定是提示词还有模糊的地方，分析一下，到底是因为什么。」②「我觉得你是不是有把简单问题复杂化了嫌疑？……我明确说了，bugfix 应该走轻通道，只要是缺陷修复就应该走，结果你后面加了那么多约束条件是几个意思？」③「轻通道反正最后有走全链兜底，所以重点应该放在确保轻通道挂账走全链核销不漏，没必要把走轻通道的门槛设置得那么高。」④「你加的那句分流是绝对必要的吗？我一直是严重反对过度工程的，你要评估一下。」（父侧复核结论 = **撤——不加平行句**）⑤「开始。」

**父侧归因（收窄定稿）**：真根因 = ① 执行面：父侧未走 B 类判据（已认账）；② 判据面：「缺陷修复」被埋于细节面主叙事之下 + `:23`「改判据语义 ⇒ 仍走设计」为无出口绝对句。**修法 = 撤旧锤、不加新句**（`:23` 管辖面并入「新机制/大改 ⇒ 全链」；分流句提案已按 22:57 复核撤）。

**方向定稿（用户 22:58「开始」确认）**：准入 = **三样清单**（细节/美工 ∥ 缺陷修复 = 是缺陷就走 ∥ 走查当场）+ **一句边界**（新机制/大改 ⇒ 全链）；**重心 = 不漏**（挂账先于笔 ∥ 收口必跑全链 ∥ 跨会话接手 ∥ 未核销不关轮）；兜底原理 = 收尾全链自然捕获误准入。

**需求修订（父侧笔 · 已落）**：`docs/core/requirements/LIGHT-CHANNEL.md` 已随本批重定——§2.1 重写（三样 + 边界）∥ §2.1b 五条约束堆删撤并入 ∥ §3 通道外清单收成一句 ∥ §4 加 ⑦ + ④ 措辞收正 ∥ §2.3 补重心句。本批即该修订之落地批。

**实例（歧义锚缺陷现场 · #828 族之三）**：本档 create 时显式绝对路径被拒（「outside the base roots」）——本会话锚（`d:\teamcode`，双档子目录歧义）判定基底回退锚 ⇒ 落 `d:\teamcode\docs\batches\`，父侧即 move 回本仓。（前两实例：① advisor 门多档解析 ② 批档相对建档落锚；#828 实施后此形收口。）

**授权（用户 2026-10-02 23:03）**：「轻通道相关的也都自动跑到交付吧。」= **本批全链自动**（代点火评审 ∥ 修正轮派发 ∥ §4 代签 ∥ 实施派发 ∥ 复核 ∥ 收口核销 ∥ 签入）。**自缚三条**（本仓惯例）：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停；③ 破坏性 / 不可逆 ⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（判据收口——评审修正轮（发现 #1–#5）已落（逐号见 §2.10：值域闭合 ∥ 草案双块随正 ∥ PS 撤件点名 ∥ 收尾修复收录位 ∥ 删面核读）；设计档随动已落 ∥ 落点表 ∥ 删面清单就位）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 覆盖 | 落点（实施轮） |
|---|---|---|---|
| E1 | 准入重定（三样清单 + 一句边界 + 附则）；约束堆自入口撤下 | 需求 §2.1 ∥ §3 | discipline 双面（CN `:44–:61` 段替换 ∥ EN 同位） |
| E2 | 工程工具面直改硬约束 ② 撤——管辖面并入一句边界（计数 3 → 2） | 需求 §2.1（并入面） | discipline 双面（CN ∥ EN `:23`） |
| E3 | 交底面收窄（判据半句 → 命中三样之哪一样）+ 死指针修复（回表 → 按三样清单 + 一句边界判） | 需求 §2.2 | persona 双面（CN `:83` ∥ `:86`；EN `:84` ∥ `:87`） |
| E4 | 核销面保留零改（挂账 ∥ 收口 ∥ 接手 ∥ 未核销不关轮）；重心句入设计档（只强调不新增） | 需求 §2.3 ∥ §4⑦ | persona 双面零改 + `LIGHT-CHANNEL.md` §2.3 |
| E5 | 设计档随动（机制设计 ∥ 落地记录 ∥ 变更记录） | 需求 §4⑦ | `LIGHT-CHANNEL.md` ∥ `PROMPT-SYSTEM.md` §6.12 邻域（本轮已落） |
| E6 | 验收同构核（①–④ + 加核核销不漏面） | 需求 §4⑦ | 本档 §2.8 |

### 2.2 设计档落点（本轮已落——as-of 粗读；评审按节题复核）

- `docs/core/design/LIGHT-CHANNEL.md`：页首 `:4–:7`；§1 `:14–:22`；§2.1 `:26–:41`（准入重定——§2.1b 并入）；§2.2 `:45` ∥ `:49`；§2.3 `:54`；§2.4 `:78` ∥ `:80`；§2.7 `:101`；§3 `:111–:113`（落点表）∥ `:119–:129`（咬合——含硬约束 ② 撤件行）∥ `:131–:132`（随动面）；§4 `:134`（含 ⑦ 行）；§5 `:152`；§7 `:166` ∥ `:169` ∥ `:174` ∥ `:176–:177` ∥ `:179`（K2 ∥ K5 ∥ K10 ∥ K12 ∥ K13 ∥ K15）；§8 `:200–:201`。
- `docs/core/design/PROMPT-SYSTEM.md`：§6.12 `:319–:320`（来源）∥ `:323–:324`（机制）∥ `:326`（分层归属）∥ `:333`（边界）；§7 D-PS12 `:391`；变更记录 `:500`。
- 零触：`docs/README.md`（存量登记面不随动——沿扩容轮口径）。

### 2.3 机制设计（判据收口定形——细则以设计档为准）

- **入口 = 三样清单 + 一句边界**（命中即走）：细节 / 美工 ∥ 缺陷修复（是缺陷就走）∥ 走查当场；边界 = 新机制 ∥ 大改 ⇒ 全链；**误准入交收尾全链兜底**（收口形式化 ∥ 评审捕获）。
- **撤件**：五问 ∥ 缺陷修复五条 ∥ 通道外清单 ∥ 守线句（自入口撤下——失效表达删，零残留）；工程工具面硬约束 ② 撤（管辖面并入一句边界）。
- **保留（只强调不新增）**：核销面四件零改——启动即挂账 ∥ 收口（收尾一次全链）∥ 跨会话接手 ∥ 未核销不关轮；重心句 =「挂账 → 收尾全链 → 核销不漏 = 第一优先级」。
- **口径收窄两处（自判）**：① 交底「判据半句」→ 命中三样之哪一样；② 证据面（红绿对/读数对 ∥ 出处坐标）= 归轮次档/收尾记录面（记录行保留——不作入口条件）。
- **零新机制 ∥ 零新句**（22:57 裁——不加平行句）；核销面零新增。

### 2.4 落点表（预落笔——as-of 本设计轮实读；实施轮落笔前复读为准）

| # | 档 | 现行行（as-of） | 处置 | 逐字 = §2.5 | 理由 |
|---|---|---|---|---|---|
| LN1 | CN discipline | `:23` | 整行替换 | ① | 三条 → 两条（② 撤——管辖面并入一句边界；计数随动） |
| LN2 | CN discipline | `:44–:61` | 段替换（头行 + 五问 + B 类块） | ② | 准入重定（三样 + 边界 + 附则） |
| LN3 | CN discipline | `:63` | **删除**（无替代文） | —— | 通道外清单收成一句边界 |
| LN4 | CN discipline | `:64` | 整行替换 | ③ | 标签随动（「B 类 =」→「收敛面笔 =」） |
| LP1 | CN persona | `:83` | 整行替换 | ④ | 头行括注随动（准入全过才走 → 命中三样即走） |
| LP2 | CN persona | `:86` | 整行替换 | ⑤ | 判据半句收窄 + 死指针修复 |
| ED1 | EN discipline | `:23` | 整行替换 | ⑥ | 同 LN1 |
| ED2 | EN discipline | `:44–:61` | 段替换 | ⑦ | 同 LN2 |
| ED3 | EN discipline | `:63` | **删除** | —— | 同 LN3 |
| ED4 | EN discipline | `:64` | 整行替换 | ⑧ | 同 LN4 |
| EP1 | EN persona | `:84` | 整行替换 | ⑨ | 同 LP1 |
| EP2 | EN persona | `:87` | 整行替换 | ⑩ | 同 LP2 |
| —— | CN/EN persona 核销面（`:87–:93` / `:88–:93` 段） | 不动 | 零改 | —— | 核销面保留（只强调） |
| —— | CN/EN discipline `:65–:66`（行使面 ∥ 边界） | 不动 | 零改 | —— | 既有句在效 |

### 2.5 双面逐字草案（围栏块——落地逐字 = 此；一次性材料，不混入设计档）

**CN 正本 · ①（discipline `:23` 整行）**：

```md
- **工程工具面直改两条硬约束**：① 机械改 ⇒ 直改 + **改完实跑报读数**；② 凡直改 ⇒ 报告记明「父侧直接执行」+ 单笔可 revert。
```

**CN 正本 · ②（discipline `:44–:61` 段替换）**：

```md
**轻通道（细节面 ∥ 收敛面受控旁路——命中三样即走；旁路 ≠ 取消）**：命中以下三样即可免「设计 → 评审 → 批准」全链——直改 → 实时走查 → 定版：

1. **细节 / 美工**——视觉 ∥ 文案 ∥ 参数（阈值 ∥ 默认值 ∥ 长度）∥ 既有交互细部（顺序 ∥ 位置 ∥ 键位 ∥ 提示语）；

2. **缺陷修复**——**是缺陷就走**（实现与已有出处相抵：需求 ∥ 设计 ∥ 记录 ∥ 用户当场的话——工作 = 让实现回到出处，非新增语义）；

3. **走查当场点名**的问题——按前两样归（细节类默认直行；行为类 = 缺陷修复）。

**一句边界**：**新机制 ∥ 大改 ⇒ 全链**。其余交由**收尾全链兜底**——误准入会在收口时被形式化 ∥ 评审捕获（门槛让路给「不漏」）。

**附则**：诊断 / 探针 = 零链面（只读 + 临时区，免归类）；性能观察类 = 无结构变更 ∧ 前后读数可证；**轻通道笔 = 主 agent 直改**（交底自带「可 revert」；大修复照旧派舱 eng-coder）。
```

**CN 正本 · ③（discipline `:64` 整行）**：

```md
- **轮次形**：轻通道轮次 = 批档一本（逐笔收录：交底 ∥ 改动 ∥ 走查 ∥ 定版）+ 台账行逐笔；**启动即挂账**——开轮（首笔开工前）先建轮次批档 + 轮次台账行（账在前、笔在后；无账之笔 = 不成立）；收尾一次全链（设计形式化 → 独立评审（落码 ∥ 记录 ∥ 文档对账）→ 修复（若有）→ 批准 → 收口核销，含必要测试——**收敛面笔 = 先红后绿的复现对 ∥ 读数前后对**）；**收尾未落 ⇒ 不许核销**（批档 ∥ 轮次行挂住）。
```

**CN 正本 · ④（persona `:83` 整行）**：

```md
- **轻通道（细节面 ∥ 收敛面笔——命中三样即走）**：每笔开工前一句话交底、**交底即行**（分钟级直改——用户改判随时生效），固定格式：
```

**CN 正本 · ⑤（persona `:86` 整行）**：

```md
  交底带**判据半句**（命中三样之哪一样）；**用户一票改判**（轻通道 ⇄ 全链 双向）；中途越界 ⇒ **停笔重交底**（禁偷渡）；**诊断/探针（零链面）不产笔 ∥ 免交底**——只读 + 临时区、产品面零改（一经产品面改动 ⇒ 按三样清单 + 一句边界判）。
```

**EN 运行面 · ⑥（discipline `:23` 整行）**：

```md
- **Two hard constraints on direct engineering-tools edits**: ① mechanical change ⇒ direct edit + **actually run it and report the reading**; ② any direct edit ⇒ report it as "parent direct execution" + single-commit revertable.
```

**EN 运行面 · ⑦（discipline `:44–:61` 段替换）**：

```md
**Light channel (detail-face ∥ convergence-face controlled bypass — hit one of the three ⇒ walk; bypass ≠ cancellation)**: any one of the three below ⇒ skip the「Design → Review → Approval」chain — direct edit → live walkthrough → freeze:

1. **Detail / cosmetics** — visual ∥ copy ∥ parameters (thresholds ∥ defaults ∥ lengths) ∥ existing-interaction details (order ∥ position ∥ keybindings ∥ hint texts);

2. **Defect fix** — **a defect ⇒ walk** (the implementation contradicts an existing source: requirement ∥ design ∥ record ∥ the user's words on the spot — the work = bringing the implementation back to the source, not adding semantics);

3. **Problems named on the spot during a walkthrough** — routed by the first two (detail class straight through by default; behavior class = defect fix).

**One-sentence boundary**: **new mechanism ∥ major change ⇒ full chain**. Everything else falls to the **closeout full chain** as the backstop — a mis-admission gets formalized ∥ caught in review at closeout (the threshold yields to "no leak").

**Annotations**: diagnostics / probes = zero-chain (read-only + temp area, no classification); performance-observation class = no structural change ∧ before/after readings provable; **a light-channel pen = main-agent direct edit** (the disclosure carries "revertable"; big fixes still go to eng-coder).
```

**EN 运行面 · ⑧（discipline `:64` 整行）**：

```md
- **Round form**: a light-channel round = one batch record (per-pen entries: disclosure · change · walkthrough · freeze) + per-pen ledger rows; **start-up booking** — at round open (before the first pen) create the round batch record + the round ledger row first (the account precedes the pen; a pen without an account = not established); one full chain at closeout (design formalization → independent review (code · record · doc reconciliation) → fixes (if any) → approval → closeout settlement, including the necessary tests — **convergence-face pens = the red-then-green reproduction pair ∥ the before/after reading pair**); **closeout not landed ⇒ no settlement** (the batch record · the round ledger row stays open).
```

**EN 运行面 · ⑨（persona `:84` 整行）**：

```md
- **Light channel (detail-face ∥ convergence-face pens — hit one of the three ⇒ walk)**: before each pen, a one-line disclosure — **disclose-then-go** (minute-level direct edits — a user re-route takes effect immediately); fixed forms:
```

**EN 运行面 · ⑩（persona `:87` 整行）**：

```md
  The disclosure carries the **criterion half-sentence** (which of the three items was hit); **the user re-routes with one word** (light or full chain, either direction); crossing the boundary mid-pen ⇒ **stop and re-disclose** (no smuggling); **diagnostics/probes (zero-chain) produce no pen ∥ need no disclosure** — read-only + temp area, product face unchanged (touching the product face ⇒ judged by the three-item list + the one-sentence boundary).
```

### 2.6 删面清单（失效表达逐一列出——零残留为验收）

**CN discipline**：① `:23`②「**改判据语义的**（抽取谓词 / 阈值 / 什么算违规）⇒ **仍走设计**」+ 标题计数句「三条硬约束」→「两条」；② `:44`「准入两类（任一不过 ⇒ 全链）」+「A 类 · 路由五问（细节面）」+ 括注「准入全过才走」；③ `:46–:54` 五问全块（① 触面 ∥ ② 行为 ∥ ③ 契约 ∥ ④ 体量＝≤15 档 ∥ ⑤ 拿不准 fail-closed）；④ `:56` B 类块头行（「目标行为已有出处……非新增语义」——其义并入样②）；⑤ `:57` 缺陷修复五条（出处可指认 ∥ 手段不新增 ∥ 先红后绿（入口条件）∥ 根因过闸 ∥ ≤15 档 · 单链 · 可 revert）；⑥ `:58`「无需归类」旧形 +「回表逐条判」死指针；⑦ `:59` 走查修复行（「（明示轻通道）」∥「（五条全过）」∥「不再逐笔纠结归类」）；⑧ `:60`「拟准入」∥「先跑 1–2 笔再定正式准入」观察窗；⑨ `:61` 守线句全行（新行为 ∥ 新机制 ∥ 新接口 ∥「试试 X」∥ 争议修法 ∥ 结构 ∥ 跨面 ∥ 契约）；⑩ `:63` 通道外清单行（八件枚举）；⑪ `:64`「B 类 =」标签。
**CN persona**：⑫ `:83`「准入全过才走」；⑬ `:86`「哪条判据过 ∥ 没过」+「收敛面笔带硬判据位：出处可指认 ∥ 红绿在手 ∥ 根因 = 实现错误」+「回表逐条判」死指针。
**EN 双档**：同位全件（discipline `:23`② ∥ `:44` ∥ `:46–:54` ∥ `:56–:61` ∥ `:63` ∥ `:64`；persona `:84` ∥ `:87`）。
**保留件（归记录面——不作入口条件）**：红绿对/读数对 ∥ 出处坐标——住 persona 轮次行（`:88`）∥ discipline 轮次形（`:64`）∥ 收尾模板（`:92`）。**「≤15」仅存于派单尺寸纪律（persona `:139`——他机制，零触）。**

### 2.7 受影响文件与测试面

| 档 | 现（行·as-of） | 预期（行） |
|---|---|---|
| `docs/core/design/prompts/discipline-engineering.md`（CN 正本） | 177 | ≈169（−8） |
| `docs/core/design/prompts/persona-engineering.md`（CN 正本） | 194 | 194（0——2 行替换） |
| `thincoder-core/prompts/discipline-engineering.md`（EN 运行面） | 185 | ≈177（−8） |
| `thincoder-core/prompts/persona-engineering.md`（EN 运行面） | 193 | 193（0——2 行替换） |

测试面 = **无**（纯提示词面——零产品码 ∥ 零测试件）；核法 = 提示词批既定一次性比对（落地四档 ↔ §2.5 围栏块）+ 机检三读数（见报告）。

### 2.8 验收对照

| # | 验收项 | 状态 ∥ 依据 |
|---|---|---|
| A1 | 草案逐字可落地（评审对照） | 已就位——§2.5 十块围栏（CN ①–⑤ ∥ EN ⑥–⑩） |
| A2 | 删面清单完整（失效表达零残留） | 已就位——§2.6 逐件列全（CN 13 件 ∥ EN 同位） |
| A3 | 需求档 §2.1 ∥ §2.2 ∥ §2.3 ∥ §3 ∥ §4⑦ 全覆盖 | §2.1 条目表（E1–E6）↔ 需求节；设计档 §2.1–§2.3 ∥ §4 ⑦ |
| A4 | 落点表 file:line 实证 | §2.4（as-of 实读——实施轮复读为准） |
| A5 | §2 就位（含状态行） | 本段 + 状态行（设计完成） |

### 2.9 关键决策与上抛项

- 决策记录 = 设计档 §7：K15（判据收口——入口重定）新增；K2 ∥ K10 ∥ K13 重定；K12 收正（记录面）；量级细数撤（量级界 = 一句边界）。
- **上抛（需求侧指认——父侧笔）**：需求 §2.2「交底带判据半句（哪条判据过 ∥ 没过）」⇒ 建议对齐「（命中三样之哪一样）」（与提示词落法一致——可选，不阻塞；本席未改需求档）。
- 机检读数（三面）：`prompt-refs-check` = **OK——J1/J2/J3 三式零命中**（提示词面 84 档 ∥ 代码面 409 档）；行宽 = 本轮设计档新增行自纠 5 处（初扫超宽 3+2 处已拆分——复扫读数随报告）；`##` = 围栏块零 `##` 行（草案零新增节）。

### 2.10 评审修正轮 1 收正（发现 #1–#5——逐号处置 · 2026-10-02）

- **承**：设计评审轮 1 = pass（🔴 0 ∥ 🟡 3 ∥ 🔵 3——§3 在册）；父侧裁决 = 发现 #1–#5 全采纳 ∥ #6 裁「无需整改 · 勿动」（评审限制面——非设计缺陷）；本段 = 设计侧逐号落地（需求档 = 父侧笔——本轮零触）。零新机制 · 可 revert。

- **#1 · ④ 演练腿按现行准入重述 + 收口坐标补 §4④**：`docs/core/design/LIGHT-CHANNEL.md:141`——「五问出局回全链」⇒「边界出局——入口不中 ∥ 触界 ⇒ 回全链」；`:5`（页首判据收口坐标行）补「§4④」（现列 = 需求 §2.1 ∥ §2.3 ∥ §3 ∥ §4④ ∥ §4⑦）。

- **#2 · 判据半句值域闭合（附则件可报）**：`LIGHT-CHANNEL.md:46`——「命中三样之哪一样」⇒「命中三样①②③ ∥ 附则·性能观察」；`:47`（面类槽）读回核对——值域闭合后两槽全配（附则件笔：面类槽「收敛面·性能观察」∥ 判据半句「附则·性能观察」），零文面改动。**§2.5 草案随正（CN ⑤ ∥ EN ⑩——由下列逐字行取代；其余成分零改）**：

**CN（CN ⑤ 取代行——persona `:86` 整行）⇒**

```md
  交底带**判据半句**（命中三样①②③ ∥ 附则·性能观察）；**用户一票改判**（轻通道 ⇄ 全链 双向）；中途越界 ⇒ **停笔重交底**（禁偷渡）；**诊断/探针（零链面）不产笔 ∥ 免交底**——只读 + 临时区、产品面零改（一经产品面改动 ⇒ 按三样清单 + 一句边界判）。
```

**EN（EN ⑩ 取代行——persona `:87` 整行）⇒**

```md
  The disclosure carries the **criterion half-sentence** (which of the three items ①②③ was hit ∥ annotation item · performance observation); **the user re-routes with one word** (light or full chain, either direction); crossing the boundary mid-pen ⇒ **stop and re-disclose** (no smuggling); **diagnostics/probes (zero-chain) produce no pen ∥ need no disclosure** — read-only + temp area, product face unchanged (touching the product face ⇒ judged by the three-item list + the one-sentence boundary).
```

**比对基准随动**：实施轮一次性比对以 §2.5 围栏块按本条收正后文本为准（判断序：§2.10 > §2.5）；两块与设计档 `:46` 值域逐字一致（读回核讫）。

- **#3 · PS 边界收正 + 变更记录补列**：`docs/core/design/PROMPT-SYSTEM.md:333`——「既有条款零改写」⇒「**默认面条款零改写**（铁律 ∥ 分流表 ∥ 确认与批准门——例外由新块内咬合句承载）」+ **单点撤件**点名（工程工具面直改硬约束 ②「改判据语义 ⇒ 仍走设计」撤——管辖面并入一句边界；直改硬约束 = 两条）；变更记录补列本修正轮行（首条——含撤件）。

- **#4 · 收尾修复收录位明示（与 K3 对齐）**：`LIGHT-CHANNEL.md:97`——§5 行括注补「收尾修复按变更面落笔——记录住 §6」；`:98`——§6 行补「**收尾修复收录**（若有——逐处：改动 `file:line` ∥ 变更面）」（K3 `:167`「§1 逐笔 + §6 修复」的修复位）。

- **#5 · ⑦ 加注删面核读**：`LIGHT-CHANNEL.md:144`——可核形态补「**删面核读**（落地档无残留 ⇔ 批档 §2 删面清单）」。

- **核读（D6）**：`LIGHT-CHANNEL.md` 逐处读回 ✓（`:5` ∥ `:46` ∥ `:47` ∥ `:97` ∥ `:98` ∥ `:141` ∥ `:144` ∥ §8 尾条）；`PROMPT-SYSTEM.md` 逐处读回 ✓（`:333` ∥ 变更记录首条）；§2.5 草案随正两块读回 ✓；两档变更记录随拍 ✓（各 +1 条）。

- **读数注**：物理行数——`LIGHT-CHANNEL.md` 202 → 204（+2：§8 尾条 + 空行）∥ `PROMPT-SYSTEM.md` 623 → 625（+2：变更记录条目 + 空行）。

- **机检（复扫 · 本修正轮一次）**：`doc-check` = 锚 **OK（0 悬空）** ∥ 行宽 **OK（源域 .md 无超宽）** ∥ 本批两档零新增（PS 存量「迁移期引文 —— 列报 · 不入闸」`:149` ∥ `:621` 为既有行；行数面差异 2 条 = 他批档——报告态）；`prompt-refs-check` = 提示词面 84 档 ∥ 代码面 409 档 · **命中 0**。

- **观察（非阻断）**：需求 §2.2 判据半句括注（`docs/core/requirements/LIGHT-CHANNEL.md:39`——「命中三样之哪一样」）未含附则件值域——若需与设计 `:46` 同径闭合，父侧笔；本轮未动需求档。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（轻通道判据收口批 · 设计评审 · 8 判据核读 ×2 档）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 | 🟡 | §4 ④ 演练腿仍写「五问出局回全链」（`LIGHT-CHANNEL.md:141`），而本批已撤下五问构造（§2.1 三样清单内无五问；K2 否决堆 `:166`；§8「五问 ∥ 五条 ∥ 通道外清单 ∥ 守线句撤下」`:200-201`）——该腿按字面已不可执行；对照 ⑤ 行已带「现行 =」随动（`:142`），④ 未随动 | 将 ④ 第二腿按现行准入重述（如「入口不中/触界 ⇒ 回全链」演练），并将需求档 §4④ 纳入收口落点（现列 §2.1 ∥ §2.3 ∥ §3 ∥ §4⑦） |
| 2 | 清晰性 | 🟡 | §2.2 判据半句与面类槽取值域不重合：判据半句限定「命中三样之哪一样」（`:46`），面类槽枚举含「收敛面·性能观察」（`:47`）——性能观察为附则件（`:39`、K13 `:177`），不属三样任一 ⇒ 该笔判据半句无值可报；且 ② 口径「轻通道笔 100% 有」（`:139`）使该缺口可核 | 在交底句格式中显式给出判据半句的槽位与取值域（如「命中三样①②③ ∥ 附则·性能观察」），使附则件笔也可报判据半句 |
| 3 | 一致性 | 🟡 | `PROMPT-SYSTEM.md:333` §6.12 边界仍称「既有条款零改写」，而本批变更面含既有条款撤件——「改判据语义 ⇒ 仍走设计」撤、直改硬约束 3 → 2（`LIGHT-CHANNEL.md:129`、K15 `:179`、§8 `:201`）；P-S 变更记录 `:502` 未列撤件 | 将「既有条款零改写」限定为默认面条款（铁律 ∥ 分流表 ∥ 确认门）并单独点名撤件；变更记录补列该撤件 |
| 4 | 清晰性 | 🔵 | 收尾轮「修复（若有）」（流程步 3 `:73`）在 §2.6 段落映射无收录位——§5 行（`:97`）记「收尾修复按变更面落笔」而 §6 行（`:98`）未列修复，K3（`:167`）却称记录面完整 =「§1 逐笔 + §6 修复」 | 在 §2.6 映射（或 §2.4 步 3）明示收尾修复的收录段落/形态 |
| 5 | 验收 | 🔵 | ⑦ 比对可核形态列举新增件（「含三样清单 ∥ 一句边界 ∥ 附则」`:144`）而未列撤件核读——撤面（五问 ∥ 五条 ∥ 通道外 ∥ 守线 ∥ 硬约束②）仅靠泛式围栏块比对覆盖 | 在 ⑦（或 ①）可核形态加注删面核读（落地档无残留 ⇔ 批档 §2 删面清单） |
| 6 | 评审限制 | 🔵 | 评审上下文未声明项目标准档与文档地图（注明降级）——方法论合规与文档所有权仅按 AGENTS.md + 在盘两档判 | 后续评审上下文声明标准档与文档地图，以恢复两项判据的完整判定面 |

**计数**：🔴 0 · 🟡 3 · 🔵 3

**VERDICT: pass**

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 代签 · 2026-10-02 23:3x）**：**依据**（用户 23:03「轻通道相关的也都自动跑到交付吧」——全链自动）：① 评审轮 1 = **pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 3——发现表 = §3；裁决：1–5 采纳 ∥ 6 裁「无需整改」）；② 修正轮 `#14` 产物**逐条在盘核验**（`LIGHT-CHANNEL.md:5` ∥ `:46` ∥ `:97`/`:98` ∥ `:141` ∥ `:144` ∥ `:203` ∥ `PROMPT-SYSTEM.md:333` ∥ `:502` ∥ 批档 §2.10——父侧抽查在位；需求侧 §2.2 值域闭合 = 父侧笔已落；门复跑 = 悬空 0 · 行宽 OK）；③ **designToken 已签发**（轮 1 通过回执——值不落档）。**批准 = 实施轮准行**：CN 面 = eng-designer 笔 ∥ EN 面 = eng-coder 落笔 ∥ 需求侧 = 父侧笔（已落）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（EN 双档落笔——逐行全等 5/5 ∥ refs 零命中 ∥ `##` 8/17 不变 ∥ 审计在册（时点项已消解）∥ advisor pass（🔴0 ∥ 🟡0 ∥ 🔵1 可选——已就地落））

**轮 = initial（实施落笔 · EN 运行面）**：§2.5 EN ⑥–⑩ 逐字（判序 §2.10 > §2.5——⑩ 按取代行落）按 M9 翻译回写落两档运行面；CN 两档 = 他笔（按 §4 = eng-designer；同轮已落——本席零触、不代写，抽样读数仅引）。

**落地表（file:line × Δ，落笔后实读）**：

| # | file:line（改后） | 处置 · Δ | 逐字源 |
|---|---|---|---|
| ED1 | `thincoder-core/prompts/discipline-engineering.md:23` | 整行替换（「三条硬约束」→「两条硬约束」；旧 ② 管辖面并入一句边界） | §2.5 EN⑥ |
| ED2 | `thincoder-core/prompts/discipline-engineering.md:44–:56` | 段替换：旧 `:44–:64`（21 行）→ 13 行（**−8**）——含旧 `:63` 整行删（通道外清单 ∥ 无替代文）∥ 旧 `:64` 替换（「class B =」→「convergence-face pens =」——落新 `:56`） | §2.5 EN⑦+⑧ |
| EP1 | `thincoder-core/prompts/persona-engineering.md:84` | 整行替换（「all admission checks must pass」→「hit one of the three ⇒ walk」） | §2.5 EN⑨ |
| EP2 | `thincoder-core/prompts/persona-engineering.md:87` | 整行替换（判据半句值域闭合 + 死指针修复：「back to the table, item by item」→「judged by the three-item list + the one-sentence boundary」） | §2.10 EN⑩（取代行） |

行数：discipline **184 → 176**（−8）∥ persona **193 → 193**（0）；`##` = **8 ∥ 17**（不变）。
CN 面（他笔 · 抽样引读）：`docs/core/design/prompts/discipline-engineering.md:23 ∥ :44–:56` ∥ `persona-engineering.md:83 ∥ :86`——同位完成，本席零触。

**逐行比对结论（一次性 · 逐行 `===`，实施舱实跑）**：EN⑥⑦⑧⑨⑩ ↔ 逐字源（§2.5 EN⑥–⑨ + §2.10 EN⑩）**5/5 块全等（15/15 行）**——承载行：discipline `:23` ∥ `:44–:54`（11 行）∥ `:56`；persona `:84` ∥ `:87`；空行结构（`:45/:47/:49/:51/:53/:55`）逐位一致。§2.5 ⑩ 与 §2.10 ⑩ 实测相异——落笔取 **§2.10**（判序遵）。

**机检读数（交付前 · 实施舱亲跑）**：
- `node scripts/prompt-refs-check.mjs` = **OK——J1/J2/J3 三式零命中**（提示词面 84 档 ∥ 代码面 409 档 · 命中 0）。
- 删面扫描（§2.6 EN 同位件 · 29 词探针）：两档 **零命中**；`≤15` 仅 persona `:141`（派单尺寸纪律 · 他机制 · 零触）。
- git diff 限域实读：变更面 = **仅本两档**（`thincoder-core/prompts/` 内零旁逸；未落点区与 HEAD 全等）。
- 行宽（落点行实读）：discipline max **721**（`:56`）∥ persona max **500**（`:87`）——沿 EN 既有口径（前置批同面读数 856 ∥ 746），零新增约束。

**决策透明**：① ⑩ 取 §2.10 取代行（判序超 §2.5）；② ED2 按行区间一次替换（`:44–:64` → `:44–:56`）——等价于 §2.4 三行处置（整段替换 ∥ `:63` 删 ∥ `:64` 替）合并落笔，零语义差；③ 审计时点项按「落地即消解」处置（不重跑审计——复核随收口读回）。

**审计（探索舱 · 只读）**：A1 逐行全等 **PASS**（15 处落点全对位）∥ A2 删面零残留 **PASS**（18 词探针扫 `thincoder-core/prompts/` 全域——唯一命中为他档异句）∥ A3 `##` **8/17 PASS** ∥ A4/A5-② 审计面限（审计无 git——本席 git 限域读数补证）∥ A6 EN↔CN 语义抽查 **PASS**。**唯一发现 = 1 条 PARTIAL（时点性）：审计时 §5 未落**——随本段落地消解；其余三类（SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）零发现。

**fix round**：0（审计除时点项外零发现；时点项 = 本段落地即消解）。

**测试面**：批内件 = 无（纯提示词文本笔——§2.7）；仓套件 = 不跑；not repo-suite verified — the parent-side closeout run is the only repo-suite run。

**代码评审（advisor）轮次**：随记（轮次结果随本段后补 append）。

**代码评审（advisor · 轮 1）读数**：**pass**——🔴 0 ∥ 🟡 0 ∥ 🔵 1（可选：§5 记录面按条目补状态块——本席就地落，见下）。评审核读面 = 逐字 5/5（15/15 行）∥ 删面零残留（≈25 词双轮探针）∥ `##` 8/17 ∥ 保留面未动 ∥ 需求档 `:39` ↔ 设计 `:46` ↔ `persona:87` 值域三面同径 ∥ 变更行零文档引用；评审限制面（无 git 通道 ∥ 脚本未实跑 ∥ 行宽未重测——本席读数互补）随其报告，不作判据。

**条目交付对照（补录 · 回应 🔵1）**：

| # | 状态 | 条目 | 落点/证据 |
|---|---|---|---|
| E1 | ✅ | 准入重定（三样清单 + 一句边界 + 附则） | `thincoder-core/prompts/discipline-engineering.md:44–:54` |
| E2 | ✅ | 硬约束 ② 撤（3 → 2） | 同档 `:23` |
| E3 | ✅ | 交底面收窄 + 死指针修复 | `thincoder-core/prompts/persona-engineering.md:84 ∥ :87` |
| E4 | ✅ | 核销面零改（保留） | 同档 `:88–:93` 段逐字未动（核读） |

（E5 设计档随动 = 设计轮已落（非本席）；E6 验收同构核 = 父侧 §6 面。）

**评审后处置**：🔵1 就地落（即本补录）；阻塞修复 = 0（fix round 0 维持——前段各项读数不变）。终态 = **clean**（审计 + 代码评审双过）。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-02 23:4x · 父侧）**

**核读**：CN 面（`docs/core/design/prompts/**` 两档——父侧抽查 ✓：`discipline-engineering.md:23`（两条硬约束）∥ `:44-54`（三样 + 一句边界 + 附则）∥ `:56` 轮次形 ∥ `persona-engineering.md:83`/`:86`（值域闭合版））∥ EN 面（`thincoder-core/prompts/**` 两档——父侧抽查 ✓：`discipline-engineering.md:23`/`:44-56` ∥ `persona-engineering.md:84`/`:87`）∥ 需求面（`docs/core/requirements/LIGHT-CHANNEL.md` §2.1 三样 + 边界 ∥ §2.2 值域闭合 ∥ §2.3 重心句——父侧笔）。

**复跑**：`prompt-refs-check` **零命中**（CN ∥ EN 两轮自跑）∥ `##` = CN 8/16 ∥ EN 8/17（不变）∥ 删面清单零残留（CN 11+2 件 ∥ EN 同位 29 词探针——双跑两报）∥ 行数 = CN 168/193 ∥ EN 176/193（= 基线 −8/−0，双侧全等）∥ 逐行比对 5/5 块全等（双侧）。

**过程如实**：① 评审轮 1 = pass（🔴 0 ∥ 🟡 3 ∥ 🔵 3——裁决 1–5 采纳 ∥ 6 裁无需整改）；② 修正轮 `#14`（5 号）+ 父侧笔（需求侧值域闭合）；③ 实施双面 = CN eng-designer ∥ EN eng-coder（带凭证）——双侧交付均经抽查核验。

**结算**：**收口（2026-10-02）**——记录冻结；台账 **#830 核销**（两段式）；提交 = 随收口签入（双远端；哈希以 errata 落 `#828` 批 §1 邻域）。
