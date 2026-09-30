# 2026-09-30 · 轻通道机制产品化（落提示词）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 14:19「可以，那就照这个落地吧」= 产品化放行；需求源 = 14:03（产品化要求 + 文档担忧 + 收口设想）∥ 14:06（路由判据 + 用户知情权）∥ 14:17（记录在档 + 收尾一次全链）= `docs/core/requirements/LIGHT-CHANNEL.md` 定稿；试运行锚 = `docs/batches/2026-09-30-light-round-1.md`（五笔实践）。
> 台账 = #714（轻通道机制产品化 · 在途）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（修复核验 ✓ · §4 代签 · 实施轮派发（eng-coder 落 4 提示词档））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：轻通道机制**产品化**——把已试运行的口径（五问路由 ∥ 交底 ∥ 记录在档 + 收尾一次全链 ∥ 记账）落进**工程模式提示词层**（内建机制，非会话级裁定）。

**需求源**：`docs/core/requirements/LIGHT-CHANNEL.md`（F-LC1~4 + 边界 + 验收 + 依赖——用户 14:03 ∥ 14:06 ∥ 14:17 三则原话定稿）。

**授权**：用户 2026-09-30 14:19「可以，那就照这个落地吧」= 立批放行（设计 → 评审 → 批准 → 实施）；评审点火与 §4 按 2026-09-30 00:14「排空」授权代执行（自缚三条件：评审 pass ∧ 修复已核验 ∧ token 已签发；新范围 ∥ 用户口径裁决 = 硬门即停）。

**自举面注记**：本批改的是**我们正在跑的**提示词——落地上线（新会话）前，本会话继续按试运行口径人工执行（不受本批实施影响）。

**路径**：设计轮（eng-designer：形态 + 要点 + 正文草案）→ 评审 → 批准 → 实施（eng-coder 落盘；**提示词内容权 = 主 agent**，D1 矩阵——正文以主 agent 签发为准）。

**试运行锚**：`docs/batches/2026-09-30-light-round-1.md`（五笔实践 + 教训两条：射程放大被斥 ∥ 走查刷新缓存坑）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-30 · 落点清册 + 双面逐字草案（CN/EN ×2）+ 咬合/影响面/验收映射落位；设计档随动已落（LIGHT-CHANNEL.md 148 行 ∥ PROMPT-SYSTEM.md 548 ∥ README 140）；机检本批三档零命中；上抛 2 项）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 任务书（本批 = 轻通道机制产品化 · 设计轮 · 不实施）

- **轮次**：initial（设计；提示词两靶面落笔归实施轮——本设计轮零实施）。
- **本批条目（覆盖）** = 需求 `docs/core/requirements/LIGHT-CHANNEL.md`（用户 2026-09-30 14:03 ∥ 14:06 ∥ 14:17 三则定稿）：
  - **F-LC1 路由判据**（五问 + fail-closed + 通道外清单）；
  - **F-LC2 路由前置知情**（交底句固定格式 + 判据半句 + 用户一票改判 + 越界停笔重交底）；
  - **F-LC3 记录在档 + 收尾一次全链（核销前置）**；
  - **F-LC4 记账**（轮次 = 批档一本 + 台账行逐笔；核销对接；批档 ∥ 台账复用零新增）。
- **设计定形项（需求档明示由设计定形）**：提示词落法 ∥ 台账挂接形 ∥ 量级阈值 ∥「必要测试」判据——§2.1 逐项。
- **本批不做（边界）**：产品码零触 ∥ 批档 ∥ 台账机制本体零动 ∥ 不改写既有条款（例外入机制块）∥ 不改其它机制 ∥ 不发明新机制 ∥ 提示词正文两界自足 ∥ 他批档零触 ∥ 不发起评审（父侧门）。
- **设计档落点**：新建 `docs/core/design/LIGHT-CHANNEL.md`（机制设计——**已落**，148 行）；随动 = `docs/core/design/PROMPT-SYSTEM.md`（§6.12 + §7 D-PS12 + §6.1 补登 + 变更记录——**已落**）∥ `docs/README.md`（§4 登记与计数——**已落**）。

### 2.1 设计定形（逐项）

**① 提示词落法**——落点清册见 §2.2；正文 = §2.3 围栏块（成文可直接签发）。

**② 量级阈值（F-LC1 ④ 定形）= ≤15 档**：单笔落点 ≤15 档且单面内 ∥ 无连带；超 ⇒ 出局（回全链）。依据 = 复用「派单尺寸」既有上限数（单面 ≤15 档——同轴）；实践锚 = 试运行 max 11 档；否决「行数阈值」（值与射程语义不相关——11 档值级改动射程反小于单档结构改动）·「不设阈值」（需求明示设计定形）。

**③ 台账挂接形（F-LC3 核销前置 ∥ F-LC4）**：核销前置 = 纪律句（**非机械门**）——轮次行「在途 →（收尾全链 pass）→ 待核销 → 已核销」两步迁移照常；收尾未落 ⇒ 批档 ∥ 轮次行挂住；逐笔行可随收口核销；判定句 =「收尾未落而核销」= 0 例（台账查询可核）；机制本体（六态 ∥ 核销两源 ∥ schema）零动。

**④「必要测试」判据（F-LC3 定形）**：改动面定向核读（视觉 ∥ 交互细部笔 = 真机走查实测读数——走查即验收读数本）∥ 触及可执行行为面的笔 = 批内单元件（随轻通道批档存 · 实施者写与跑）+ 复跑读数 ∥ 集成面零增补（承测试纪律）∥ 收口测试行照报。

**⑤ 批档 §段复用形（收尾全链）**——见 §2.4。

**⑥ 交底形（F-LC2）**：**交底即行**（非阻塞——分钟级；免例行「复述 + 等确认」步）；两句固定格式 + 判据半句；用户一票改判（双向）；中途越界 ⇒ 停笔重交底。——咬合处置见 §2.2 表。

### 2.2 落点清册（段落 → 档 → 节 · 实施轮锚）与咬合处置

**落点（双源两面 = 4 档；行号 = as-of 2026-09-30 设计轮实读）**：

| # | 段落（内容） | 档 | 节 ∥ 插入锚 | 形态 |
|---|---|---|---|---|
| P1 | 五问判据 ∥ 通道外清单 ∥ 轮次形 ∥ 收尾形 ∥ 行使面 ∥ 边界 | `docs/core/design/prompts/discipline-engineering.md`（CN 正本 · 现 137 行） | 「基本流程」节内——`评审反复机械失败` 行（L42）后 | 既有节内增列（+11 估） |
| P2 | 交底句 ∥ 改判 ∥ 越界停笔 ∥ 记账 ∥ 收口触发 ∥ 核销对接 | `docs/core/design/prompts/persona-engineering.md`（CN 正本 · 现 183 行） | 「派发与收尾纪律」节内——`判据句：文档面派 eng-coder` 行（L81）后 | 既有节内增列（+6 估） |
| P3 | P1 的 EN 语义对等翻译 | `thincoder-core/prompts/discipline-engineering.md`（EN 运行面 · 现 144 行） | 同位——`Repeated mechanical review failure` 行（L42）后 | 增列（+11 估） |
| P4 | P2 的 EN 语义对等翻译 | `thincoder-core/prompts/persona-engineering.md`（EN 运行面 · 现 183 行） | 同位——`Implementation-round role routing` 判据句行（L82）后 | 增列（+6 估） |

**咬合处置（既有条款 → 处置）**：

| 既有条款 | 处置 |
|---|---|
| 铁律一（四步不跳）∥ 铁律四（零裁量） | **不改写**——机制块内含咬合句「旁路 ≠ 取消」（收尾全链 = 补课；拿不准 ⇒ 全链）——默认面不弱化 |
| 变更面分流（产品代码面 = 全流程） | **不改写表行**——细节面例外由机制块承载（条件 + 代价显式） |
| 确认与批准门（写文件前先确认） | **不改写**——轻通道笔免例行「复述 + 等确认」步（交底即行——分钟级目标 + 用户改判权为对价） |
| 批次档生命周期（五条） | **不改写**——轮次 = 批档一本（§2.4 复用形）；轮次界 = 收口 |
| 台账生命周期（事件 → 动作） | **不改写**——核销前置为纪律句（§2.1③）；机制本体零动 |
| 测试纪律（收口测试行 ∥ 批内件） | **不改写**——「必要测试」判据按同轴定形（§2.1④） |
| **落点外零触** | normal 面 ∥ 其余提示词档 ∥ 产品码 ∥ `batch` 工具 ∥ 台账 ∥ 评审链 = 全零触 |

### 2.3 双面逐字草案（围栏块——落地逐字 = 此；一次性材料，不混入设计档）

**CN 正本 · P1（`docs/core/design/prompts/discipline-engineering.md`——插于 L42 后；块前空 1 行）**：

```md
**轻通道（细节面受控旁路——五问全过才走；旁路 ≠ 取消）**：细节面（视觉 ∥ 文案 ∥ 参数（阈值 ∥ 默认值 ∥ 长度）∥ 既有交互细部（顺序 ∥ 位置 ∥ 键位 ∥ 提示语））的调整可免「设计 → 评审 → 批准」全链——直改 → 实时走查 → 定版。路由五问（任一不过 ⇒ 全链）：
1. **触面**：落在细节面闭合枚举内（枚举扩面 = 新需求）；
2. **行为**：不产生新行为路径（新分支 ∥ 新状态 ∥ 新流程 ∥ 新机制）；
3. **契约**：不碰接口 ∥ 通道协议 ∥ 数据结构 ∥ 持久化 ∥ 跨端对位语义 ∥ 安全面；
4. **体量**：射程小——单面内、无连带、落点 ≤15 档；
5. **拿不准 ⇒ 全链**（fail-closed——宁可重，不可偷渡）。
- **通道外清单**（触界即停、上抛、回全链）：新机制 ∥ 新流程 ∥ 接口契约 ∥ 数据结构 ∥ 持久化 ∥ 跨端语义 ∥ 安全面 ∥ 体量超标。
- **轮次形**：轻通道轮次 = 批档一本（逐笔收录：交底 ∥ 改动 ∥ 走查 ∥ 定版）+ 台账行逐笔；收尾一次全链（设计形式化 → 独立评审（落码 ∥ 记录 ∥ 文档对账）→ 修复（若有）→ 批准 → 收口核销，含必要测试）；**收尾未落 ⇒ 不许核销**（批档 ∥ 轮次行挂住）。
- **行使面**：路由 = 主 agent 逐笔判定、随交底公开（用户可否决）；子代理不路由、不援引本通道。
- **边界（不做）**：边界外内容走通道 ∥ 免收口 ∥ 以本机制替代全链（机制自身 ∥ 大改仍全链）。
```

**CN 正本 · P2（`docs/core/design/prompts/persona-engineering.md`——插于 L81 后）**：

```md
- **轻通道（细节面笔——五问全过才走）**：每笔开工前一句话交底、**交底即行**（分钟级直改——用户改判随时生效），固定格式：
  - 轻通道笔：「**本笔 = 轻通道**（细节面）｜改：__｜射程：__｜回退 = 可 revert」
  - 全链笔：「**本笔 = 全链**（触：__）｜设计 → 评审 → 批准」
  交底带**判据半句**（哪条判据过 ∥ 没过）；**用户一票改判**（轻通道 ⇄ 全链 双向）；中途越界 ⇒ **停笔重交底**（禁偷渡）。
  轮次 = 批档一本：逐笔收录 §1（交底 ∥ 改动 ∥ 走查 ∥ 定版）；台账行逐笔照常；**§5 不适用**（无 eng-coder 实施段——实施面 = 父侧直改，记录住 §1）。
  收口触发 = 用户说「收口」∥ 轮末自然停顿（由你提请）——收尾全链段映射：§2 设计形式化 ∥ §3 独立评审 ∥ §4 批准 ∥ §6 收口核销；轮次行随全链通过后核销（逐笔行可随收口核销）。
```

**EN 运行面 · P3（`thincoder-core/prompts/discipline-engineering.md`——插于 L42 后；块前空 1 行）**：

```md
**Light channel (detail-face controlled bypass — all five questions must pass; bypass ≠ cancellation)**: adjustments on the detail face (visual · copy · parameters · existing-interaction details) may skip the「Design → Review → Approval」chain — direct edit → live walkthrough → freeze. The five routing questions (any fail ⇒ full chain):
1. **Touch surface**: inside the detail-face closed enumeration (extending it = a new requirement);
2. **Behavior**: no new behavior path (branch · state · flow · mechanism);
3. **Contract**: no interface · channel protocol · data structure · persistence · cross-end semantics · security surface;
4. **Size**: small reach — one surface, no entanglements, ≤15 files;
5. **When unsure ⇒ full chain** (fail-closed — prefer heavy over smuggled).
- **Off-channel list** (touching ⇒ stop, report, back to the full chain): new mechanism · new flow · interface contract · data structure · persistence · cross-end semantics · security surface · over-size.
- **Round form**: a light-channel round = one batch record (per-pen entries: disclosure · change · walkthrough · freeze) + per-pen ledger rows; one full chain at closeout (design formalization → independent review (code · record · doc reconciliation) → fixes (if any) → approval → closeout settlement, including the necessary tests); **closeout not landed ⇒ no settlement** (the batch record · the round ledger row stays open).
- **Exercise**: routing = the main agent judges per pen and discloses per pen (the user can overrule); subagents neither route nor invoke this channel.
- **Boundary (never)**: off-boundary content through the channel · closeout skipping · substituting the full chain (the mechanism itself · major changes stay full-chain).
```

**EN 运行面 · P4（`thincoder-core/prompts/persona-engineering.md`——插于 L82 后）**：

```md
- **Light channel (detail-face pens — all five questions must pass)**: before each pen, a one-line disclosure — **disclose-then-go** (minute-level direct edits — a user re-route takes effect immediately); fixed forms:
  - Light pen: "**This pen = light channel** (detail face) | change: __ | reach: __ | rollback = revertable"
  - Full-chain pen: "**This pen = full chain** (touching: __) | design → review → approval"
  The disclosure carries the **criterion half-sentence** (which criterion passed or failed); **the user re-routes with one word** (light or full chain, either direction); crossing the boundary mid-pen ⇒ **stop and re-disclose** (no smuggling).
  The round = one batch record: per-pen entries in §1 (disclosure · change · walkthrough · freeze); ledger rows per pen as usual; **§5 = not applicable** (no eng-coder implementation segment — the implementation face = parent direct edits, recorded in §1).
  Closeout trigger = the user says "close out" ∥ a natural round pause (raised by you) — closeout-chain segment map: §2 design formalization · §3 independent review · §4 approval · §6 closeout settlement; the round row settles only after the full chain passes (pen rows may settle with the closeout).
```

**草案自检（两界 ∥ 行宽 ∥ 词汇）**：① 两界——四块零文档引用（无 `.md` 名 ∥ 无「见 X 档」；`§1`–`§6` = 协议自名，合法）✓；② 行宽——CN 各行 ≤300（最长 ≈160）；EN 面不在 docs 行宽域 ✓；③ 词汇——EN 复用存量（batch record · closeout · settlement · parent direct edit · disclose）；`⇒` ∥ `·` 分隔符沿 EN 现有形 ✓。

### 2.4 语义咬合（批档 §段复用形 ∥ 台账核销前置挂接）

**批档 §段复用形（轻通道轮次 = 批档一本 · 收尾全链）**：

| 段 | 作者 | 轻通道轮次内容 |
|---|---|---|
| §1 | 父侧 | 轮次性质 + 逐笔收录（交底 ∥ 改动 ∥ 走查 ∥ 定版 ∥ 台账行） |
| §2 | eng-designer（收尾轮） | 设计形式化 + 文档一致化方案 |
| §3 | 评审子代理（收尾轮） | 独立评审（落码 ∥ 记录 ∥ 文档对账）+ VERDICT |
| §4 | 父侧（收尾轮） | 用户批准记录 |
| §5 | —— | **不适用**（无 eng-coder 实施段——轻通道笔 = 父侧直改，记录住 §1；收尾修复按变更面落笔） |
| §6 | 父侧（收尾轮） | 收口 + 核销 + 收口测试行 |

- **§5 不适用之由**：`batch` 工具段白名单 = 身份机械锁（父侧不可写 §5）+ 轻通道笔无 eng-coder 实施段（eng-coder 因 token 门无法承接无设计笔——`thincoder-core/agent-tools/subagent-spawn.mjs` 门禁）；记录面完整（§1 逐笔 + §6 修复 ∥ 收口）。
- **轮次界 = 收口**：收口后新笔另起新轮新档（承批次档生命周期「条目集变更 ⇒ 另起新批」规则）。

**台账核销前置挂接（F-LC3 ∥ F-LC4）**：

- 轮次行形态 = 「轻通道轮次 · 收尾全链（待跑）」在途——收尾全链 pass 后 在途 → 待核销 → 已核销（两步迁移照常；`evidence` 回写结账依据照常）；逐笔行可随收口核销（勾销 ∥ 追认两源照常——机制本体零动）。
- **收尾未落 ⇒ 不许核销**（批档 ∥ 轮次行挂住）；判定句 =「收尾未落而核销」= 0 例（台账查询可核）。
- 挂接 = 纯纪律句（提示词层），**零机械门**（承「为臆想的失败逐点加限制 = 反模式」之裁）。

### 2.5 影响面（受影响文件 ∥ 本设计轮已落 ∥ 不改面 ∥ 机检读数）

**实施轮受影响文件（行数口径 = KD-4 内容行，文末换行不计；read 工具显示数 = +1）**：

| 档 | 现数 | 预计增量 | 面 ∕ 笔 |
|---|---|---|---|
| `docs/core/design/prompts/discipline-engineering.md` | 136 | +11 估（10 行块 + 1 空行；逐字 = §2.3 P1） | 镜像面 CN（实施轮 · 设计师笔） |
| `thincoder-core/prompts/discipline-engineering.md` | 143 | +11 估（逐字 = §2.3 P3） | 运行期面 EN（实施轮 · eng-coder） |
| `docs/core/design/prompts/persona-engineering.md` | 182 | +6 估（逐字 = §2.3 P2） | 镜像面 CN（实施轮 · 设计师笔） |
| `thincoder-core/prompts/persona-engineering.md` | 182 | +6 估（逐字 = §2.3 P4） | 运行期面 EN（实施轮 · eng-coder） |

零删档 ∥ 零新增节 ∥ 零 `##` 块新增（既有节内增列）∥ 其余行零触 ∥ 改动皆 ≤300 行宽（CN）。

**本设计轮已落（设计面 · 实读读数）**：

| 档 | 读数 | 内容 |
|---|---|---|
| `docs/core/design/LIGHT-CHANNEL.md` | 新档 → **148 行** | 机制设计（§1 定位 ∥ §2 定形 ∥ §3 清册 ∥ §4 验收映射 ∥ §5 边界 ∥ §6 依赖 ∥ §7 决策 ∥ §8 变更记录） |
| `docs/core/design/PROMPT-SYSTEM.md` | 528 → **548 行**（+20） | §6.12（L311–324）+ §7 D-PS12（L341）+ §6.1 补登（L161）+ 变更记录（L445–446） |
| `docs/README.md` | 137 → **140 行**（+3） | §4：其余 35 档（L73）· 流程 / 文档机制面 12 档（L77–78）· 计数核对 57 = 57（L80）+ 变更记录首行 |

**不改面（零触清单）**：产品码 ∥ 批档 ∥ 台账 ∥ 评审链 ∥ `batch` 工具 ∥ 提示词其余 14 档 ∥ normal 侧 ∥ 需求档（U1 由主 agent 另裁）。

**机检读数（交付前一次 · 本设计轮）**：

- `node scripts/doc-check.mjs`（仓根零参）= **悬空 52 ∥ 行宽 131 ∥ 行数面 13（报告态）**——**本批三档零命中**（全量读数日志逐条核：`docs/core/design/LIGHT-CHANNEL.md` ∥ `docs/core/design/PROMPT-SYSTEM.md` ∥ `docs/README.md` 在锚 ✗ / 行宽 / 行数三清单零出现）；全仓读数为他档存量 ∥ 在飞面（改动前基线本席未捕获——以「零出现」归属核代偿）。
- `node scripts/prompt-refs-check.mjs` = **OK**（提示词面 84 档 ∥ 代码面 402 档 · J1/J2/J3 命中 0）。
- 超宽自纠 2 处（零语义）：`PROMPT-SYSTEM.md` 变更记录行 314 字符 ⇒ 折两行（216 ∥ 100）；`README.md` 12 档行 349 ⇒ 折两行（237 ∥ 113）——复扫 0 命中。

### 2.6 验收腿映射（LIGHT-CHANNEL §4 ①–④ → 可核形态）

| # | 需求验收 | 可核形态 | 守法（TESTING.md §6 内容禁令） |
|---|---|---|---|
| ① | 机制文本落提示词层，判据表可逐条核（评审对照） | 实施轮一次性比对（落地四档 ↔ §2.3 围栏块）+ 评审对照（五问逐条 ↔ 落地文本） | 一次性比对——禁新增散文锚 |
| ② | 会话记录可抽查交底（含判据半句）——轻通道笔 100% 有 | 行为面观察项：会话抽查（交底句 + 批档 §1 收录可回溯） | 观察项——不落机检断言 |
| ③ | 收口闭合可查：≥1 轮完整「逐笔入档 → 收尾全链（含评审）→ 核销」；「收尾未落即核销」= 0 例 | 记录面核读：`docs/batches/2026-09-30-light-round-1.md`（首轮）收口全链完整性 + 台账查询（0 例） | 记录面核读 |
| ④ | 演练两笔（越界停笔 + 重交底 + 重分类 ∥ 五问出局回全链）均跑通 | 演练记录两笔（落批档 ∥ 台账）——时点 = 上线后首轮 ∥ 父侧在收口轮安排 | 记录面样本 |

**全腿零常驻断言新增**（「不因单次改动而增补」+ 内容锚禁令——② ∥ ④ = 观察项/样本，不落机检）。

### 2.7 关键决策记录（含否决）+ 分层归属四问

| # | 决策 | 理由 ∥ 否决备选 |
|---|---|---|
| K1 | 落点 = 机制规则入纪律层「基本流程」节内 + 父侧行使入人格层「派发与收尾纪律」节内（均既有节内增列） | 归属四问：机制面 = 模式怎么干活（纪律层——受众含收尾轮的评审 ∥ 设计面）；父侧动作 = 写权独属（人格层——台账用法面判例同轴）；否决「全落人格层」（子代理需知旁路成立条件）·「全落纪律层」（父侧独属动作入共享层）·「新增节」（零收益 + 节计数扰动） |
| K2 | 量级阈值 = **≤15 档** | 复用派单尺寸上限数（同轴）；实践锚 max 11 档；否决「行数阈值」·「不设阈值」 |
| K3 | §5 = 不适用（实施面 = 父侧直改，记录住 §1） | 段白名单机械锁 + 无 eng-coder 实施段；记录面完整 |
| K4 | 交底 = 交底即行（非阻塞）——免例行「复述 + 等确认」步 | 分钟级目标 + 用户改判权为对价 + 试运行实证；否决「阻塞确认」 |
| K5 | 收尾修复（若有）按变更面分流落笔；触界 ⇒ 回全链 | 不引入新链；通道外清单兜底 |
| K6 | 不改写铁律 ∥ 分流表 ∥ 确认门——例外由机制块承载 | 默认面不弱化；否决「改写铁律」·「分流表行加例外」 |
| K7 | EN = CN 定稿语义对等翻译（实施轮回写） | D-PS1/D-PS2；否决「byte 一致」（已废） |

**分层归属四问**（提示词编写纪律）：① 机制规则 = 该模式怎么干活 → 纪律层；② 非两模式共用协作基础 → 公共层不取；③ 交底 ∥ 记账 ∥ 核销 = 父侧写权面独属动作 → 人格层（台账用法面同轴判例：写权独属动作不落纪律层——写入即误导子代理）；④ 通用层内容（零项目实例——试运行教训「走查刷新缓存坑」不落机制面，交项目面处理）。

### 2.8 上抛项（≤2 · 均零触——笔权归主 agent）

- **U1（需求面张力 · 主 agent 笔）**：`docs/core/requirements/METHODOLOGY.md` §2.1 F2-1 判定句「不存在『跳过设计直接编码』的批次」与轻通道轮次（直改先行、收尾补设计）相抵——建议随动 = F2-1 补限定（细节面轻通道为受控旁路——指向 `docs/core/requirements/LIGHT-CHANNEL.md`）；同问 = `docs/core/requirements/ENGINEERING-MODE-V2.md`（需求）是否加机制登记行（§13 族）——主 agent 裁。证据 = 本设计轮实读（F2-1 行）。
- **U2（记忆面同步 · 主 agent）**：项目记忆「工程模式 · 轻通道（试运行口径——五问路由 + 交底 + 收口=核销前置）」条目 ④「轻通道笔 = 台账行（不产批档）」被 14:17 定稿取代（F-LC4 = 轮次 = 批档一本 + 台账行逐笔）——建议同步该条目，防未来会话按旧口径执行。

### 2.9 设计轮自检（交付前）

- **五要点对照**：目标（受众 ∥ 问题——§2.0）✓ · 条目（F-LC1–4 → §2.1/§2.6）✓ · 边界（本批不做 + 设计档 §5）✓ · 验收（§2.6 四腿）✓ · 依赖（需求档 §5 ∥ 设计档 §6）✓。
- **读回核实（D6）**：`LIGHT-CHANNEL.md` 全文读回 ✓（148 行）；`PROMPT-SYSTEM.md` 四处读回 ✓（§6.12 = L311–324 ∥ D-PS12 = L341 ∥ §6.1 补登 = L161 ∥ 变更记录 = L445–446）；`README.md` 四处读回 ✓（L73 ∥ L77–78 ∥ L80 ∥ 变更记录首行）。修正注：D-PS12 初落带表断空行（表外孤立行）⇒ 同轮修（删空行，D-PS11 → D-PS12 表内连续——承 ledger-governance 评审先例口径）。
- **机检**：见 §2.5 读数（本批三档零命中 ∥ prompt-refs OK ∥ 超宽自纠 2 处已折）。
- **三链一致**：§2 条目（F-LC1–4）= 设计档 §2/§4 = 需求档功能条目 + §4 ✓（同源同链）。
- **实施轮切分（建议）**：单轮 · 两舱——CN 正本两档（设计师笔）∥ EN 运行面两档（eng-coder · 主 agent 内容权）；逐字唯一来源 = §2.3 四围栏块；**措辞修正同步约束**：任一稿措辞修正 ⇒ 两稿同改再落（承 test-knowledge 先例）。落笔前经 §3 评审 + §4 批准 + token 签发（父侧门——本设计轮不发起）。

### 2.10 草案修订注（同轮 · 签发前自纠——实施轮以本条为准）

- **P1 ∥ P3 五问条目编号收正**：`1.`–`5.` ⇒ `①`–`⑤`（与设计档 §2.1 判据表同轴；避与「基本流程」既有步号 `1.`–`4.` 相撞——同节两套阿拉伯列表 = 误读源）。
- **逐字口径（本条为准）**：P1 第 2–6 行 ⇒ `① **触面**：落在细节面闭合枚举内（枚举扩面 = 新需求）；` ∥ `② **行为**：不产生新行为路径（新分支 ∥ 新状态 ∥ 新流程 ∥ 新机制）；` ∥ `③ **契约**：不碰接口 ∥ 通道协议 ∥ 数据结构 ∥ 持久化 ∥ 跨端对位语义 ∥ 安全面；` ∥ `④ **体量**：射程小——单面内、无连带、落点 ≤15 档；` ∥ `⑤ **拿不准 ⇒ 全链**（fail-closed——宁可重，不可偷渡）。`；P3 同位同法（`①`–`⑤`，文字同 §2.3 P3）。其余行零改；§2.6 ① 的比对基准 = §2.3 按本条收正后文本。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（设计评审 · 轻通道机制产品化批 · 设计轮）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership / 跨档一致 | 🟡 | 同一落点清单两处不一：设计 §3 行 2（`thincoder/docs/core/design/LIGHT-CHANNEL.md:94`）父侧细则含「越界停笔」；`thincoder/docs/core/design/PROMPT-SYSTEM.md:317` 同清单 5 项、漏「越界停笔」 | 对齐两处清单（补项或注明摘录为概括）——保持同批两档对同一清单的枚举一致 |
| 2 | Methodology / F2-1 咬合 | 🟡 | F2-1 无反向登记：`thincoder/docs/core/requirements/METHODOLOGY.md:34` 仍为绝对口径（不跳步 ∥ 判定句「不存在『跳过设计直接编码』的批次」）；旁路仅单向声明（`thincoder/docs/core/requirements/LIGHT-CHANNEL.md:5` ∥ `thincoder/docs/core/design/LIGHT-CHANNEL.md:6` ∥ 同档 `:16`），设计 §3 咬合表（`thincoder/docs/core/design/LIGHT-CHANNEL.md:99`–`:106`）无 F2-1 / METHODOLOGY 行 | 在 F2-1 邻位补登记（指针或限定注），或显式记录「F2-1 零改」的裁定与理由（判定句在「收尾全链闭合」下仍成立的口径）——使受控旁路在规范面可追 |
| 3 | 咬合覆盖 / 清晰性 | 🟡 | 「父侧不代笔」三类例外 + 打标义务（`thincoder/docs/core/design/PROMPT-SYSTEM.md:255`）未入咬合表；而机制执行形态 = 父侧直改（`thincoder/docs/core/design/LIGHT-CHANNEL.md:83`，仅同档 `:84` 对文档随动提打标） | 补一行咬合登记：直改对应哪条既有例外（或明示为新例外）+ 打标形态（交底句「可 revert」/ 批档 §1「父侧笔」是否即满足） |
| 4 | 记录一致 | 🔵 | 试运行教训表述不一：`thincoder/docs/core/requirements/LIGHT-CHANNEL.md:4`「两轮射程偏差教训」 vs `thincoder/docs/core/design/LIGHT-CHANNEL.md:5`「教训两条：射程放大被斥 ∥ 走查刷新缓存坑」（所引批档不在阅读面——unverified） | 按试运行记录核后统一两处表述 |
| 5 | 落点清册完备性 | 🔵 | K4「交底即行（免例行复述 + 等确认）」被咬合表声明为例外承载句（`thincoder/docs/core/design/LIGHT-CHANNEL.md:103` ∥ 同档 `:141`），两处落点枚举（同档 `:94` ∥ `thincoder/docs/core/design/PROMPT-SYSTEM.md:317`）未单列 | 落点枚举补列（或注明随「交底句」项一并落地） |
| 6 | 受影响文件尺寸标注（criterion 8） | 🔵 | 核查通过（非缺陷）：受影响面全 `.md`（4 提示词档 + `thincoder/docs/core/design/PROMPT-SYSTEM.md` + `docs/README.md` + 本档；提示词档另有「免档位判定」口径 `thincoder/docs/core/design/PROMPT-SYSTEM.md:162`）；产品码零触 ⇒ 无 source/test 档 ⇒ 无行数标注 / 拆分规划义务 | 无需动作（记读数） |

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 3。核验边界：正文草案 = 批档 `docs/batches/2026-09-30-light-channel-mechanism.md` §2（同指 `thincoder/docs/core/design/LIGHT-CHANNEL.md:148` ∥ `thincoder/docs/core/design/PROMPT-SYSTEM.md:320`）不在阅读面 ⇒「设计↔草案」「需求↔草案」两段 unverified；试运行读数 / 台账锚 #712 / spawn 门禁引证 unverified。

## §4 用户批准（主 agent）

**用户批准（代签 · 2026-09-30）**：沿 2026-09-30 00:14「排空」授权代签（用户 14:19「可以，那就照这个落地吧」= 本批直令在案）——三条件齐备：① 设计评审 **pass**（🔴0 🟡3 🔵3）；② 修复轮 1 落位并经父侧核验（#1∥#3∥#5 = eng-designer，#2 = METHODOLOGY 父侧登记 ∥ #4 = 需求侧父侧对齐；变更记录两行 = 父侧机械补记〔可 revert〕——抽读 + 读回 ✓）；③ designToken 已签发。**批准范围 = 提示词落地实施**（实施轮 = eng-coder；提示词内容权 = 主 agent——逐字文本 = §2 围栏块，编号以 §2.10 自纠为准）。残留②（行数读数 148 → 现 151）在 §6 收口更新。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
