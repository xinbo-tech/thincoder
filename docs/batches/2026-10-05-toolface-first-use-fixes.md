# 2026-10-05 · 工具面首用可发现性（spawn 六字段 + batch 档头参）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 台账 #938；用户 2026-10-05 16:53「几乎每次派单都会出现，感觉提示词面或者工具描述面存在缺口」= 本批点火（援当日 16:5x 两处拒回实证：档头占位未填 ∥ 派单缺「验收标准」字段；16:5x 系就地修正——原录 17:5x 为父侧记误）。
> 台账 = #938（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源与授权

- 用户 **16:53**：「几乎每次派单都会出现，感觉提示词面或者工具描述面存在缺口」——援当日两处拒回实证：① 新建档档头两枚台账死占位（编号 ∥ 板块字面）未填 ⇒ 首次 append 被拒，须文件编辑回填；② 派单缺「验收标准」字段标记 ⇒ spawn 被拒。
- **父侧诊断（实读在盘——两缺口定性 = 工具描述面「首用不可见」）**：
  ① spawn 六字段标记清单**只在拒绝句**（`thincoder-core/agent-tools/spawn-gates.mjs:63-67`）可见，描述面（`thincoder-core/tool-docs/subagent.md:18-19`）零清单 ⇒ 首用只能「撞门 → 读拒绝 → 重试」；
  ② `batch` create **无**台账 / 板块参，档头两占位无填法（描述面 `thincoder-core/tool-docs/batch.md` 只言「fill them first」未给法）⇒ 每次建档必手动编辑。
  反面注 = 提示词面（persona）已列六字段（英文形）但未绑定「门按标记校验」；**根因判定 = 工具面缺位**（描述面 + 可填参），persona 非根因（本批零触）。
- **范围裁决（父侧）**：只补「可见性」（六字段入描述面：`tool-docs/subagent.md`）与「可填性」（`batch` create 增 `ledger`/`board` 两可选参）；**门禁判据集零改**（`spawn-gates.mjs` 标记 ∥ `TEMPLATE_PLACEHOLDERS` 枚举）；不新增工具；不做其他 description 清扫。
- **授权** = 用户令（16:53）⇒ 全链跑（设计 → 评审代点火 → §4 代签〔三条件惯例〕→ 实施 → 收口）。
- **台账** = **#938**（待设计——任务书 = 本档 §2）。

### 1.2 授权与现场补记（16:5x）

- **16:55 用户「自动修完」= 全链跑授权**：代点火评审 / §4 代签（三条件惯例） / 实施派发 / 收口核销——自缚三条在册。
- **新增发现 ③（当场实证 · 16:5x）**：§1 首投时，正文对两枚档头占位字面的**引用**被死占位扫描判死、append 被拒——扫描分不清「未填占位」与「正文引用」（骨架注释自称「避免误杀讨论字面」实测不成立）；已插报设计轮（#2 纳入设计，第三条）∥ 需求 §8.2 同族补「可辨性」行。
- **时间修正（就地）**：本档头原录「援 17:5x 两处拒回」——实际 **16:5x**（父侧记误，已就地修正）。
- **附注**：本批 §1 正文自身即为「工具面首用摩擦」的活体标本——三条发现（①②③）均以同等力度入设计面。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-05 · 三件（六字段可发现性 ∥ 档头可填性 ∥ 判据可辨性）——设计档三处已落（TOOLS.md §6.20 ∥ AGENT-LOOP-SUBAGENT.md §6.30 ∥ BATCH-RECORD.md §4.10/§4.11）· 门禁判据集零改；产品码 ∥ 描述面 ∥ 批内件 = 实施轮；评审轮次 1 落修（🔴1/🟡3/🔵4——8/8 采纳）逐号在盘——修正块在段末（设计档随动：§6.25 收正 ∥ §6.20 单源/判据补 ∥ §4.1 枚举补））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（eng-designer · 2026-10-05）**：三件设计落地（发现 ③ 随拍并入——父侧 16:5x 插报）；设计档三处已落（见「设计档落点」）；产品码 / 描述面 / 批内件 = 实施轮（eng-coder）；**门禁判据集零改**。

**本批条目（覆盖——需求单源 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §8.2「工具面自解释」）**

| # | 条目 | 需求行 | 落点（file:line） | 验收判据 |
|---|---|---|---|---|
| A-1 | 六字段可发现性——spawn 任务书六字段标记清单入描述面 | §8.2 六字段行（`:442`） | `thincoder-core/tool-docs/subagent.md`（角色列与 `Mode filtering:` 段之间增一段——逐字 = `AGENT-LOOP-SUBAGENT.md` §6.30） | 描述文本六标记 grep 命中（UTF-8 安全形——node 扫）；`spawn-gates.mjs` 零 diff |
| A-2 | 批档档头可填性——`batch` create 增 `ledger` / `board` 可选参（建即填） | §8.2 档头可填性行（`:443`） | `thincoder-core/agent-tools/batch.mjs`（schema 两键——`source` 后）∥ `batch-skeleton.mjs`（`batchSkeleton` 实参面）∥ `batch-lifecycle.mjs`（归一 ∥ 建即填 ∥ 回执两态）∥ `tool-docs/batch.md`（两处替换） | create（携两参）产出档头零死占位；未给 ⇒ 占位留存 + 回执含填法句；已给 ⇒ 回执不提示 |
| A-3 | 判据可辨性——死占位扫描区分「未填」与「正文引用」 | §8.2 可辨性行（`:444`） | `batch-skeleton.mjs`（`findPlaceholderResidue` 判据 + 签名 + 拒句）∥ 调用点 `batch.mjs` append 挂点 ∥ `batch-lifecycle.mjs` status 挂点 | 未填档头 ⇒ 拒（逐行列残留）；正文引用 ⇒ 放行；旧形结构行 ⇒ 拒；枚举字面零改 |

**本批不做（明确排除）**：门禁判据集零改（`spawn-gates.mjs` 五标记 ∥ `ROUND_VALUES` ∥ 死占位枚举字面）∥ `assertStatusNote` 面零触（独立停车面守卫——非「未填 vs 引用」判定）∥ 不新增工具 / action ∥ 其他 description 零清扫 ∥ 端面零改（CLI / VSC / 桌面经核单源）∥ 提示词面（persona ∥ 中文正本）零触 ∥ 需求档 = 父侧笔（§8.2 四行已随拍落档）。

**设计档落点（本笔已落——as-of 2026-10-05）**

| 设计档 | 落点 | 内容 |
|---|---|---|
| `docs/core/design/TOOLS.md` | **§6.20**（新增）∥ §6.15.2 裁定点④ 三处收正（`:716-719`）∥ §7 **D-TO15** ∥ 变更记录 | ②③ 机制面 + 逐字文本表 + 否决备选 + 边界 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | **§6.30**（新增）∥ 变更记录 | ① 逐字文本（折行展示——实现时单行）+ KD-TF1 / KD-TF2 |
| `docs/core/design/BATCH-RECORD.md` | §4.10（骨架块现行形 + 实参替换注）∥ §4.11（参数面 + 档头填充行）∥ §4.8 BR-18 ∥ 落点指针 ∥ 变更记录 | ② 机制权威面 + 既有滞后收正（见上抛 2） |

**逐字承载面（实施者零开放结构决定）**：subagent.md 一段 = `AGENT-LOOP-SUBAGENT.md` §6.30 文本块；batch.md 两处替换 / schema 两键 description / 回执两态句 / 两条拒句 / 骨架行实参面 = `TOOLS.md` §6.20 逐字表与逐字面。

**机制设计（要旨——逐字见上表指针）**

- A-1：描述面载明六字段（五文本标记 + 结构化 `round`）——门零改（清单 = 门标记集回显）；共享一段（否决两段各补——D2）。
- A-2：create 可选参 `ledger`（trim + 前导 `#` 补齐）/ `board`（trim）——给参 ⇒ 骨架台账行实参化（零死占位）；未给 ⇒ 占位留存 + 回执提示（「以文件编辑填档头后，首次 append/status 方开」意）；单行约束；create 仍不代建台账条目。
- A-3：判据收正——死占位 = **档头结构行（标题行 / 编制行 / 台账行）**内出现枚举字面；正文（段体）任意位置出现字面 = 引用 ⇒ 豁免。域收 + 形收（非放松 / 非泛形 / 枚举零改）；`findPlaceholderResidue(src)`（seg 退场）· 返回 `[{line, text}]`；拒句「or your target section」半句退场。

**受影响文件与测试面（现行行数 = 2026-10-05 实读；口径 = `split("\n").length - 1`）**

| 文件 | 现行 | Δ 预估（⇒ ≈） | 说明 |
|---|---|---|---|
| `thincoder-core/tool-docs/subagent.md` | 30 行 / 7,942 字符 | +1 行（≈ +370 字符） | ① 一段（逐字 = ALS §6.30） |
| `thincoder-core/tool-docs/batch.md` | 1 行（无尾换行）/ 1,842 字符 | ±0 行（≈ +250 字符） | ② 两处子串替换（单行文本） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 202 行 | +≈18 −≈10 ⇒ ≈210 | ③ 判据 + 注释 + `batchSkeleton` 实参面；≤300 ✓ |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 333 行 | +≈14 ⇒ ≈347 | ② create 归一 / 建即填 / 回执两态；③ status 挂点注释；>300 软线（既有——未触 500 硬限） |
| `thincoder-core/agent-tools/batch.mjs` | 315 行 | +≈12 ⇒ ≈327 | ② schema 两键；③ append 挂点注释；>300 软线（既有） |
| `thincoder-core/agent-tools/spawn-gates.mjs` | 109 行 | **±0（零 diff——门禁判据集零改实证）** | — |
| `docs/batches/2026-10-05-toolface-first-use-fixes.test.mjs` | 新档 | ≈150–200 行 | 批内件（见测试面） |
| `docs/core/design/API-CONTRACT.md` | 生成区 | 重生成（行号随动） | `node scripts/api-contract.mjs --write` → `--check` OK |

**测试面（批内件 = 单测件随批归档——不入仓套件）**：`docs/batches/2026-10-05-toolface-first-use-fixes.test.mjs`（复跑 = 仓根 `node --test <该档>`；先红后绿）：

| # | 用例 | 输入 | 期望 |
|---|---|---|---|
| T1 | ① 描述面六标记（对表机检） | 读 `tool-docs/subagent.md`（或 `DESC("subagent")`） | 六个标记串全在场 |
| T2 | ② 建即填 | create（`ledger="#938"` + `board="core"`，临时基底） | 档头台账行 = `#938（core` 形 ∧ 四枚占位字面零命中 ∧ 回执零填法句 |
| T3 | ② 未给 | create（无两参） | 两占位字面在场 ∧ 回执含填法句 |
| T4 | ② 偏给 | create（仅 `ledger`） | 台账行 = 编号实参 + 板块占位 ∧ 回执含填法句 |
| T5 | ② 归一 | `ledger="938"` / `ledger="#214/#215"` | `#938` / 原样保留 |
| T6 | ② 单行拒 | `ledger` 含换行 | throw（单行句） |
| T7 | ③ 未填拒 | 手写档（档头台账行未填）append / status | 拒（拒句 + 逐行残留） |
| T8 | ③ 引用豁免（本批实害反证） | 档头已填 + 段体正文引用四枚字面 | append 放行 |
| T9 | ③ 旧形结构行 | 标题行 / 编制行残留旧形字面 | 拒 |
| T10 | ③ 段域 / 整行引用豁免 | 档头已填 + 段体整行引用台账行未填形 | 放行 |
| T11 | 回归·次序 | create（无参）⇒ 首写拒 ⇒ 文件编辑填 ⇒ 放行 | 三态全中 |
| T12 | 回归·4 参调用 | `batchSkeleton({date, topic, source, prev})` | 输出 = 现行占位形（零变） |
| T13 | 回归·模板行 | 段体含模板占位行（尖括号形） | 放行（枚举零命中） |

**回归复跑面（相邻件——实施轮 + 父侧复跑）**：`docs/batches/2026-09-30-core-tools-pairfix.test.mjs`（append/status/close 全链——夹具档头无结构行字面 ⇒ 零触）∥ `docs/batches/2026-10-03-read-data-interface.test.mjs`（`batchSkeleton` 直调——4 参形零变）。

**验收对照（§8.2 逐行回指——三链同源）**

| # | 需求行 | 验收（机验） |
|---|---|---|
| AC-1 | §8.2 `:442` | `tool-docs/subagent.md` 六标记全命中（node 扫——UTF-8 安全；禁 `findstr /c:` 中文形）；`spawn-gates.mjs` `git diff` 零 |
| AC-2 | §8.2 `:443` | T2–T6 全绿（建即填 ∥ 未给提示 ∥ 归一 ∥ 单行拒）；回执两态逐字 |
| AC-3 | §8.2 `:444` | T7–T10 全绿（未填拒 ∥ 引用豁免 ∥ 旧形拒 ∥ 段域豁免）；`TEMPLATE_PLACEHOLDERS` 字面零改（diff 零） |
| AC-4 | §8.2 `:445` 边界 | `spawn-gates.mjs` ∥ `prompts/**` ∥ 三端零 diff；不新增工具；`assertStatusNote` 零触 |
| AC-5 | 机检面 | `node scripts/doc-check.mjs` exit 0；`node scripts/api-contract.mjs --check` OK（先 `--write`）；批内件 T1–T13 绿（先红读数在 §5） |
| AC-6 | 回归 | 两相邻件复跑绿；`batchSkeleton` 4 参形零变 |

**关键决策（要旨——逐字见设计档）**：KD-TF1 描述句 = 门的取舍（KD-M5-7 同族）∥ KD-TF2 共享块 ∥ A-2 可选参化解「create 期编号不存在」时序顾虑（给则填 / 不给走手工法——原「否决 create 增参」裁定随本批收正，§6.15.2 `:719` 已改写）∥ A-3 档头结构行值形（否决：全文子串 / 泛形 / 引用转义形 / 保留段域——§6.20 裁定表）。

**上抛项（父侧 / 评审面）**：

1. **发现 ③ 的判据方向**——档头结构行值形（父侧候选 A 的取值）+ 段域退场；「禁放松成泛形」自证 = 枚举零改 + 域 / 形双收（§6.20 裁定表）。请评审核「域收不构成放松」。
2. **既有滞后收正披露（本笔顺带）**：BATCH-RECORD.md §4.10 骨架块（旧形两枚字面 · 代码单源指针 `batch.mjs`）∥ §4.11 参数面缺 `source` ∥ §4.8 BR-18 参数面缺 `source`——均为 F11-B / KD-4 后未随拍的历史滞后，本笔按现行实况收正（零新语义；变更记录在档）。
3. **PROMPT-SYSTEM.md §6.11 预算读数**（as-of 2026-09-29 快照）：本批两描述档增字后读数微移——未触（非本批面；`tool-schema-size.mjs` 报告态复测可随时刷新）——父侧知悉即可。
4. **`assertStatusNote` 面**（status note 平禁四字面）：保持零触（独立停车面守卫；非本批「未填 vs 引用」判定）——如父侧认其亦需引用豁免，另笔裁。
5. **台账 #938**：设计轮完——待父侧转「在途」（设计档三处已落 · 门禁判据集零改口径在档）。

**实施轮任务书指针**：eng-coder 按 `TOOLS.md` §6.20（②③ 逐字）+ `AGENT-LOOP-SUBAGENT.md` §6.30（① 段落逐字）+ 本表「受影响文件」执行；批内件落 `docs/batches/2026-10-05-toolface-first-use-fixes.test.mjs`；API-CONTRACT 重生成；§5 实施记录含先红 / 后绿两读与两相邻件复跑读数。

**评审轮次 1 落修（批档 §3 · fix 轮 · eng-designer · 2026-10-05）**

定点落修——评审轮次 1（changes-required · 🔴1 / 🟡3 / 🔵4 · 八条全数采纳）逐号在盘；**判据本体 ∥ 逐字文本面 ∥ 产品码零触**（本块 = 设计档 ×3 + 批档侧的收正；工具描述 ∥ 产品码 ∥ 批内件 = 实施轮笔域零变）。本块 = §2 段末现行读数（§2 append-only——原位行定格为记录面）。

**发现 1（🔴——§6.25 括注失实）· 核实（父侧实核 + 本席读回）**：`thincoder-core/tool-docs/subagent.md` **在盘**（本席读回 = 30 行 / 7,942 字符 / 8,040 字节——与父侧读数一致）；描述装载实读 = `thincoder-core/agent-tools/subagent.mjs:36`（「#15 描述外置：描述文本单点 = tool-docs/subagent.md」）+ `:129`（`description: DESC("subagent")`）⇒ **描述面 = `tool-docs/subagent.md` 成立**，§6.25 原地括注（「内联 `description`——无独立 `tool-docs/*.md`」）失实。

- 收正已落：`AGENT-LOOP-SUBAGENT.md:522` 括注改指描述面——**读回在位**；同式失实句全仓扫描仅此一处（零第二面）；A-1 落面（§6.30）与核盘一致、不重瞄。

**发现 2（🟡——T1 表源 +「English equivalents」半句）** 门侧实况（本席实读 `thincoder-core/agent-tools/spawn-gates.mjs`，as-of 2026-10-05）：五段 marker 集 = **中文标题 ∪ 英文等价形（双语同收）**——`:18-24`（`/目标与理由/` ∪ `/goal\s*&\s*why/i` ∪ `/goal\s+and\s+why/i` ∥ `/已知事实/` ∪ `/known\s+facts/i` ∥ `/设计要点/` ∪ `/design\s+points/i` ∥ `/验收标准/` ∪ `/acceptance\s+criteria/i` ∥ `/交付报告格式/` ∪ `/交付报告/` ∪ `/delivery[- ]report\s+format/i`）+ `round` 结构化参数（`ROUND_VALUES` = `["initial","fix"]`——`:29` 导出）。

- **T1 修正（表源钉死——逐枚断言）**：表源 = `spawn-gates.mjs`（方案 = 表源钉死；不另列门字面进 §6.30——判据单源、D2 不复制）。两腿——① 在场腿：描述面新增段对五段「中文标签形 + 英文括注形」（十枚文本形）+ `round (initial|fix` 枚举字面逐枚命中；② **过门腿（行为面——防描述↔门漂移）**：以描述所载各形构造六字段任务书投喂 `validateTaskBookFields`（已导出）——中文形 ∥ 英文形各一跑 ⇒ 不抛；逐段缺 ⇒ 抛且 missing 列该段 label（门侧标记集 = 内部常量未导出——② 为其等价读面；门侧撤字面 ⇒ ② 先红）。
- **半句收放（实况核真——保留零改）**：「Keep the labels (Chinese or the English equivalents) — the gate matches these markers」——门双语同收 + 描述所载十枚形逐枚过门（对表：`goal & why` ∥ `known facts` ∥ `design points …` ∥ `acceptance criteria` ∥ `delivery-report format` 全命中）⇒ 不误导，§6.30 逐字文本块零动。
- 备注：门 marker 集 ⊇ 描述所载形（超集形态无碍——判据方向 = 描述所载形 ⊆ 门受形）。

**发现 3（🟡——两 >300 档拆分评估）** 逐档触发判定（沿既有计划——「消解条件 = 越 500 硬限 或 该档下次实质改动时」）：

- `batch-lifecycle.mjs`（333 ⇒ ≈347）：本批改动 = **点状**（create 参数面归一 + 建即填 + 回执两态 + status 挂点注释 + F11-C 调用点随动——局部增量、不触结构面、不新增 action；距 500 硬限余 ≈153 行）⇒ **消解条件未触发**——维持登记不拆；**拆分计划沿用** = 候选位① create 面 ⇒ 姊妹档 `batch-lifecycle-create.mjs`（计划本体 = `TOOLS.md` §6.15「行数与拆分评估」）。
- `batch.mjs`（315 ⇒ ≈327）：本批改动 = **点状**（schema 两键 + append 挂点注释 + 调用点随动——同既有判词「schema 增参 + 描述同步 + 挂点」）⇒ 未触发——维持登记不拆；**拆分位（后手）沿用** = append 迁移面（`sanitizeText` / `insertIntoSection`）外提。

**发现 4（🟡——② 单源钉死）**：

- 契约行住 `BATCH-RECORD.md` §4.11（`:217`——归一 ∥ 单行 ∥ 空串 ≡ 未给 + 「契约单源 = 本条；逐字文本面 = `TOOLS.md` §6.20」）——**读回在位**。
- `TOOLS.md` §6.20（`:1036`）改**逐字文本面**（持契约指针、删重述）——**读回在位**。
- 落点表两处标注收正（原位表行定格为记录面，现行读数 = 本块）：`:47`（TOOLS.md 行）⇒「②③ **逐字文本面**（② 契约行单源 = `BATCH-RECORD.md` §4.11）+ ③ 判据面 + 否决备选 + 边界」；`:49`（BATCH-RECORD.md 行）⇒「② **契约权威面**（§4.11 契约行）+ 既有滞后收正」。

**发现 5（🔵——判定域边界）**：`TOOLS.md` §6.20 ③ 两句在盘（读回在位）——① **区域判据：档头 = 首个 `## §` 标题之前**（档首至首段头前；段体 = 首段头起）；② **骨架↔三结构行不变量**：`batchSkeleton` 产出中枚举字面 ⊆ 三类结构行（现行 = 台账行单行；结构行外新增占位 ⇒ 静默漏检——改形与判据同拍）。

**发现 6（🔵——T6 覆盖）**：测试面随动（实施轮落件）——T6 扩 `board` 换行格（两参单行拒对称）；新增 **T14**：两参「空串 ≡ 未给」（`ledger=""` ∥ `board=""`）各一格（契约 = `BATCH-RECORD.md` §4.11）。

**发现 7（🔵——§4.1 枚举）**：`BATCH-RECORD.md` §4.1 fail-closed 枚举（`:64`）补「死占位残留拒（F11-C——判据 = `TOOLS.md` §6.20）」——**读回在位**。

**发现 8（🔵——预算读数）**：`tool-schema-size.mjs` 报告态复测（两描述档增字后新读数）= **实施轮 §5 登记项**（本块 = 登记；读数本体随实施轮落 §5）。

**落点清单（修正轮随动——现行读数）**：

| 设计档 | 落点（随动后） | 内容 |
|---|---|---|
| `docs/core/design/TOOLS.md` | §6.20（新增）∥ §6.15.2 裁定点④ 三处收正 ∥ §7 D-TO15 ∥ 变更记录（+修正轮行） | ②③ 逐字文本面（② 契约行单源 = `BATCH-RECORD.md` §4.11）+ ③ 判据面 + 否决备选 + 边界 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | §6.30（新增）∥ **§6.25 收正（发现 1）** ∥ 变更记录（+修正轮行） | ① 逐字文本 + KD-TF1 / KD-TF2 |
| `docs/core/design/BATCH-RECORD.md` | §4.10 ∥ §4.11 ∥ **§4.1 fail-closed 枚举（发现 7）** ∥ §4.8 BR-18 ∥ 落点指针 ∥ 变更记录（+修正轮行） | ② 契约权威面（§4.11 契约行——单源）+ 既有滞后收正 |

**守界自检**：判据本体（域收 / 形收 / 枚举字面）零改 · §6.20 / §6.30 逐字文本面零改（发现 2 半句经核真保留）· 产品码零触（`spawn-gates.mjs` 只读）· 批档 §1 / §3–§6 零触 · 他批在飞面（台账批档 ∥ `LEDGER.md` ∥ 需求档）零触。

**机检读数（修正轮落笔后 · 本席复读）**：`node scripts/doc-check.mjs --root .`（cwd = `thincoder/`）⇒ **悬空 0**（OK——阈值 0）∥ 行宽 OK ∥ 行数面差异 18 条 = 既有存量（报告态，非本批）∥ **exit 0**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审范围与限制：在评四档全读；需求档 `ENGINEERING-MODE-V2.md` §8.2 与产品码（`spawn-gates.mjs` 等）在评范围外——门标记字面 unverified；无项目标准档 ∥ 无文档地图 ⇒ 方法学 / 文档归属维度降级判读；受影响文件行数未独立复核（两枚 tool-docs 档与两枚回归夹具经列表级在盘核实）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership | 🔴 | 同一机制（`subagent` 工具描述所在面）两处相抵：`AGENT-LOOP-SUBAGENT.md:522`（§6.25 边界）称「`subagent` 工具描述 = `thincoder-core/agent-tools/subagent.mjs` 内联 `description`——无独立 `tool-docs/*.md`」；本批落点以 `thincoder-core/tool-docs/subagent.md` 为描述面（`AGENT-LOOP-SUBAGENT.md:847`／`:849` §6.30 · 批档 `:37`）。列表级实核：该 md 在盘（8,040 字节 · mtime 2026-09-29）⇒ §6.25 句为失实方，设计未随拍收正——同档两说并存 | 核盘确认描述面后随拍收正 §6.25 失实句（零新语义；纳入本批 AGENT-LOOP-SUBAGENT.md 落点清单——现仅 §6.30 + 变更记录）；若核盘与 §6.30 相抵则重瞄 A-1 落点 |
| 2 | Acceptance criteria | 🟡 | ① 验收未钉「与门等值」：批档 `:76` T1 标「对表机检」但表源未指明；`AGENT-LOOP-SUBAGENT.md:859` KD-TF1 称「清单 = 门标记集逐字回显（`spawn-gates.mjs:18-24` 五文本标记 + `round` 结构化参数）」、`:854` 描述文本自称「Keep the labels (Chinese or the English equivalents) — the gate matches these markers」——门侧字面在评范围外（unverified）；若门仅收中文字面 ⇒ 该半句为模型可见面失实且 T1/AC-1 仍全绿 | 钉 T1 表源（读/import 门侧标记集逐枚断言命中）或把五枚门字面逐字列进 §6.30 供对读；「English equivalents」半句按门侧实况收放 |
| 3 | Size annotations | 🟡 | 两份 >300 档只标档位无拆分评估：批档 `:66`（`batch-lifecycle.mjs` 333 ⇒ ≈347：「>300 软线（既有——未触 500 硬限）」）· `:67`（`batch.mjs` 315 ⇒ ≈327：「>300 软线（既有）」）；TOOLS.md `:745`／`:746` 既有计划的「消解条件 = 越 500 硬限 或 该档下次实质改动时」未判——两档拆分候选位（create 面 ∥ append 迁移面）恰在本批改动面 | 受影响文件表为两档各补一行拆分评估（沿用计划 ∥ 触发判定 ∥ 或执行拆分位） |
| 4 | Document ownership | 🟡 | `ledger`/`board` 归一等规则两处同述（TOOLS.md `:1036` ∥ BATCH-RECORD.md `:217`：trim + 前导 `#` 补齐 ∥ 单行 ∥ 空串 ≡ 未给）；批档落点表 `:47` 标 TOOLS.md 为「②③ 机制面」、`:49` 标 BATCH-RECORD.md 为「② 机制权威面」——② 规范单源未钉死 | 钉死单源：② 规范面住一处（如 BATCH-RECORD.md §4.11 契约行），另一处改指针 / 分层注明（契约住 §4.11 ∥ 逐字住 §6.20） |
| 5 | Clarity | 🔵 | 判定域两处边界未钉死：① 「档头/段体」区域分界无判据（TOOLS.md `:1065` 只言「其余一切位置（段体任意行）出现字面 = 引用 ⇒ 豁免」；批档 `:85` T10 要求段体整行引用台账行形放行 ⇒ 实现须先界定档头终点）；② 骨架↔三结构行耦合（骨架若在其他档头行产占位字面将静默漏检） | ① 补一句区域判据（如「档头 = 首个 `## §` 标题之前」）；② 补不变量（骨架输出中枚举字面 ⊆ 三类结构行） |
| 6 | Acceptance criteria | 🔵 | 两参校验用例不对称——批档 `:81` T6 只测「`ledger` 含换行」；`board` 单行拒 ∥ 两参「空串 ≡ 未给」（TOOLS.md `:1036`）无对应用例 | T6 扩 `board` 换行格；补两参空串 ≡ 未给各一格（或注明复用判据的覆盖依据） |
| 7 | Document ownership | 🔵 | BATCH-RECORD.md §4.1 fail-closed 枚举（`:64`）未含死占位残留拒（F11-C）——本批恰改其判据与拒句，§4.10 / §4.11 / BR-18 已拍而 §4.1 未随 | §4.1 枚举顺拍补「死占位残留拒（F11-C）」（指针 = TOOLS.md §6.20）——零新语义 |
| 8 | Acceptance criteria | 🔵 | 预算读数随动未入验收 / §5：批档 `:109` 自述「本批两描述档增字后读数微移」（`tool-schema-size.mjs` 报告态可复测）但无读数落点 | 跑一次 `tool-schema-size.mjs` 报告态，把两档新读数记入 §5 |

计数：🔴 1 · 🟡 3 · 🔵 4（共 8 条）。
VERDICT: changes-required

### 轮次 2（评审子代理）

轮次 2 复核（收敛核验——对轮次 1 八项逐项现盘读回）：**8/8 Fixed · 新发现 0**；残留计数 🔴 0 · 🟡 0 · 🔵 0。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:522` | 🔴 | Fixed | 括注已改指描述面在位（「`subagent` 工具描述 = `thincoder-core/tool-docs/subagent.md`」；原「内联 `description`」失实句退场）；同档变更记录 `:1037` 同拍 |
| 2 | 2 | `docs/batches/2026-10-05-toolface-first-use-fixes.md` §2 修正块（`:123-127`） | 🟡 | Fixed | T1 表源钉死 = `spawn-gates.mjs`（在场腿十字形 + 过门腿行为面）；「English equivalents」半句经门侧核真保留；`AGENT-LOOP-SUBAGENT.md` §6.30 逐字块零动 |
| 3 | 3 | 同修正块（`:129-132`） | 🟡 | Fixed | 两 >300 档拆分评估逐档落：点状改动 ⇒ 消解条件未触发、计划沿用（`batch-lifecycle.mjs` 333⇒≈347 余 ≈153；`batch.mjs` 315⇒≈327） |
| 4 | 4 | `docs/core/design/BATCH-RECORD.md:217` ∥ `docs/core/design/TOOLS.md:1036` | 🟡 | Fixed | ② 契约单源钉死于 §4.11（「契约单源 = 本条；逐字文本面 = `TOOLS.md` §6.20」）；§6.20 改指针删重述在位；落点表标注收正（修正块 `:138`） |
| 5 | 5 | `docs/core/design/TOOLS.md:1065` ∥ `:1068` | 🔵 | Fixed | 区域判据（档头 = 首段头之前）与骨架↔三结构行不变量均在位 |
| 6 | 6 | 同修正块（`:142`） | 🔵 | Fixed | T6 扩 `board` 换行格 + 增 T14（两参空串 ≡ 未给）——实施轮落件已登记 |
| 7 | 7 | `docs/core/design/BATCH-RECORD.md:64` | 🔵 | Fixed | fail-closed 枚举补「死占位残留拒（F11-C——判据 = `TOOLS.md` §6.20）」在位 |
| 8 | 8 | 同修正块（`:146`） | 🔵 | Fixed | `tool-schema-size.mjs` 报告态复测 = 实施轮 §5 登记项 |

计数：🔴 0 · 🟡 0 · 🔵 0（复核 8/8 Fixed；新发现 0）。
VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-05 17:3x 父侧代签**——依据用户 16:53「几乎每次派单都会出现，感觉提示词面或者工具描述面存在缺口」+ 16:55「自动修完」= 全链跑授权（代点火评审 / §4 代签〔三条件惯例〕/ 实施派发 / 收口核销；自缚三条在册）。

**三条件核验**：
① **设计评审两轮走完** ✓——轮 1 = changes-required（1🔴/3🟡/4🔵）→ 修正轮 `#6` 八条全落（父侧实读核过 `AGENT-LOOP-SUBAGENT.md:522` 收正在位）→ **轮 2 = pass**（8/8 Fixed · 新发现 0；§3 轮次 2 在档）。
② **修正落地并逐条核验** ✓——轮 2 复审逐项现盘读回 + 父侧抽读（§6.25 括注 ∥ 批档修正块 ∥ `TOOLS.md:1036`/`:1065`/`:1068` ∥ `BATCH-RECORD.md:64`/`:217`）。
③ **token 已签发** ✓（轮 2 pass 的 token——运行态不入档）。

**批准范围** = 两描述面（`tool-docs/subagent.md` 六字段块 ∥ `tool-docs/batch.md` 两处替换）+ 三档产品码（`batch.mjs` schema 两键 ∥ `batch-skeleton.mjs` 台账行实参 + 判据域收 + 拒句 ∥ `batch-lifecycle.mjs` create 归一 / 单行拒 / 回执两态）+ 批内件测试（T1–T14）。
**边界** = 门禁判据集**字面零改**（域收 = 「如何区分未填与引用」层，非放松）∥ `spawn-gates.mjs` 零 diff ∥ 不新增工具 ∥ 不做其他 description 清扫。

## §5 实施记录（eng-coder）
**状态行**：实施完成（三件逐字落地；审计 1 轮 clean ∥ 代码评审 1 轮 pass；先红/后绿与预算读数在 §5 正文）



### 5.1 交付摘要

设计单源（`TOOLS.md` §6.20 ∥ `AGENT-LOOP-SUBAGENT.md` §6.30 ∥ `BATCH-RECORD.md` §4.10/§4.11）逐字实施落地：① 六字段清单入描述面 ∥ ② `batch` create 增 `ledger` / `board` 可选参（建即填台账行 + 回执两态）∥ ③ 死占位判据可辨性收正（判定域 = 档头结构行；段体引用豁免）。**门禁判据集字面零改**（`spawn-gates.mjs` 零 diff）· 不新增工具 / action · 其他 description 零清扫。

### 5.2 落地表（file:line → Δ；行数口径 = `split("\n").length - 1`）

| 档 | 落点（现盘 as-of 2026-10-05） | Δ |
|---|---|---|
| `thincoder-core/tool-docs/subagent.md` | `:21`（`- eng-designer` 行后 ∥ `Mode filtering:` 前） | +1 段（逐字 = ALS §6.30 块单行拼接）；32 行 / 8,355 字符（§2 载 30 行 / 7,942） |
| `thincoder-core/tool-docs/batch.md` | `:1`（单行文本） | 两处子串替换（逐字 = §6.20 替换表）；2,068 字符（§2 载 1,842） |
| `thincoder-core/agent-tools/batch.mjs` | schema `ledger` `:271` ∥ `board` `:275`（`source` 后）；append 挂点 `:214-216` | +2 键（description 逐字）+ 挂点随动（`findPlaceholderResidue(src)` 单参）；323 行（§2 预估 ≈327） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 结构行域常量 `:61-64` ∥ `findPlaceholderResidue` `:76-84` ∥ 拒句 `:93-98` ∥ 签名 `:182` ∥ 台账行实参 `:187` | 判据域收 + 签名 / 返回面 + 拒句 + 骨架实参；200 行（§2 预估 ≈210） |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 归一 `:55-62` ∥ 调用 `:156-157` ∥ 建即填 `:164` ∥ 回执两态 `:167-169` ∥ status 挂点 `:322-323` | 同左；354 行（§2 预估 ≈347） |
| `thincoder-core/agent-tools/spawn-gates.mjs` | — | **零 diff**（`git diff --stat` 空——门禁判据集零改实证） |
| `docs/batches/2026-10-05-toolface-first-use-fixes.test.mjs` | 新档（275 行 / 13,361 字符） | 批内件 T1–T14（先红后绿；不入仓套件） |
| `docs/core/design/API-CONTRACT.md` | 生成区 | `--write` 重生成 → `--check` OK（2900 条 · 641 档；行号随动） |

### 5.3 红绿两读（先红 → 后绿）

- **先红**（实施前）：`node --test docs/batches/2026-10-05-toolface-first-use-fixes.test.mjs` ⇒ **14 tests · pass 3 · fail 11**——fail = T1–T10 ∥ T14（red 面）；pass = T11–T13（回归腿）。
- 红读实证（原文两条）：T9 = `deepStrictEqual` 实际多 `where: 'header'` 字段（旧返回形）；T10 = 拒句 `the batch record still carries skeleton placeholders (档头 or your target section)`（判据未收——正文整行引用被误杀 = 本批实害反证）。
- **后绿**（实施后）：同命令 ⇒ **14 tests · pass 14 · fail 0**。

### 5.4 复跑与门读数

- 相邻件复跑：`2026-09-30-core-tools-pairfix.test.mjs` **12/12** ∥ `2026-10-03-read-data-interface.test.mjs` **12/12**（实施前后同值）。
- `node --check`：`batch-skeleton.mjs` ∥ `batch-lifecycle.mjs` ∥ `batch.mjs` ∥ 批内件 ⇒ **exit 0 ×4**。
- `node scripts/doc-check.mjs --root .` ⇒ **exit 0**（悬空 0 ∥ 行宽 OK ∥ 行数面差异 18 条 = 既有存量）。
- `node scripts/api-contract.mjs --check` ⇒ **OK（2900 条 · 641 档）**。
- **预算读数登记**（§2 修正块发现 8——`node scripts/tool-schema-size.mjs`）：47 档 · 总量 **99,280** 字符（基线 103,529 ⇒ 比值 **0.959**）；分面 builtin 49,867 ∥ builtin(gated) 1,372 ∥ meta 38,769 ∥ instance 9,272；tool-docs 38 档 · 61,759 字符；两描述档：`subagent` **12,738**（meta 首位）∥ `batch` **5,090**。

### 5.5 逐字对表机检（12/12 PASS）

设计单源 ↔ 实现逐字对照（行内 literal 比）：① subagent.md 段 = §6.30 块（单行拼接）∥ ② batch.md 两处替换（新串在场 ∧ 旧串退场）∥ ③ schema 两键 description 逐字 ∥ ④ 单行拒句逐字 ∥ ⑤ 残留拒句逐字 + 逐行清单形 ∥ ⑥ 回执两态句逐字 ∥ ⑦ 骨架台账行模板逐字 ∥ ⑧ 枚举字面 + `ROUND_VALUES` 零改。

### 5.6 审计与代码评审（轮次与终态）

- **内部探索审计（读只读）1 轮**：A 落地完整性 3/3 ∥ B 无放松 / 静默降级 ∥ C 无清单外改动 ∥ D 断言无弱化 ∥ E 旧形零变——**代码面零分歧**；唯一 PARTIAL =「§5 未落」（随本段落笔消解）。**终态 = clean**。
- **内部代码评审（advisor · type=code）1 轮**：**VERDICT pass**；计数 🔴 0 · 🟡 2（非 must-fix：① 两 >300 档 = 既有裁定在册〔消解条件未触发〕 ② §5 记录滞后 = 本段）· 🔵 4。
- **fix round = 0**（无 must-fix；🔵 四项按报告态登记、不改码——评审后产物冻结）。
- 🔵 登记（转父侧 / 设计侧裁）：① `findPlaceholderResidue` 无段头档区域退化空串（实用不可达——冻结门先行）∥ ② 回执两态判据 = 参给与否（参值携枚举字面的极端面）∥ ③ `batch-skeleton.mjs:99-100` 连续两空行 ∥ ④ §2 受影响文件表读数 vs 现盘实读漂移（本表已按实测刷新：subagent.md 32 ∥ batch-skeleton 200 ∥ batch-lifecycle 354 ∥ batch.mjs 323）。
- 宿主引用核验附注：评审对 `batch-lifecycle.mjs:322` 一条引用报「file unreadable」（路径解析面）；本席读回该行 = F11-C 挂点注释（「档头结构行死占位残留 ⇒ 拒（段体引用豁免——判据可辨性收正）」句逐字在位）——引用属实。

### 5.7 决策透明表

| 决策点 | 取法 | 依据 |
|---|---|---|
| 归一实现位 | create 体内模块私有 `normalizeHeaderParam`（trim → 空 ⇒ null → 换行拒 → `#` 补齐） | §4.11 契约 + §6.20 逐字；单行判在 trim 后（同 `source` 先例） |
| 残留清单行形 | 两空格缩进 + `档头 line N: <text>` | §6.20「逐行 档头 line N: <text> 清单」+ 旧实现缩进先例 |
| 无段头档 | 保持既有 `: 0` 退化，不扩面 | 不可达（冻结门先行 ⇒ unknown 拒）；改动零收益且令评审 stale |
| 🔵 四项 | 登记不修 | 🔵 = 报告态；改码将令评审结论 stale |
| §2 表读数漂移 | 不就地改（§2 = eng-designer 段）；实测读数落本段 | 一段一作者 |

（本段 = eng-coder 笔域；§1 状态行随动 = 父侧收口动作。）

## §6 验证与收口（父代理）

**2026-10-05 17:5x · 收口**

**交付验证（实施 `#11` · 修正轮 `#6` · 评审 `#4`/`#9` 两轮）**：

| 面 | 终值 | 核验读数 |
|---|---|---|
| ① 六字段入描述面 | `thincoder-core/tool-docs/subagent.md` **32 行**（`- eng-designer` 行后新增段——逐字 = `ALS` §6.30 单行拼接） | 逐字对表 **12/12** ∥ T1 两腿（十枚文本形在场 + 双语过门） |
| ② 档头可填性 | `batch.mjs` schema 两键（`:271`/`:275`）∥ `batch-skeleton.mjs` 台账行实参（`:187`）∥ `batch-lifecycle.mjs` 归一（`:55-62`）+ 建即填（`:164`）+ 回执两态（`:167-169`）+ 单行拒 | T2–T6 + T14（含空串 ≡ 未给 ∥ `938 ⇒ #938` 补齐）全绿 |
| ③ 判据可辨性 | `batch-skeleton.mjs` 域 = **档头结构行**（`:61-64` ∥ `:76-84`）+ 拒句逐字（`:93-98`） | T7–T10（**T8 = 本批实害反证**：段体引用零残留 ∧ 放行；T10 整行引用豁免）全绿 |
| 闸 | `spawn-gates.mjs` **零 diff** ∥ `node --check` ×4 ∥ `doc-check` exit 0 ∥ `api-contract --check` OK（2900 条/641 档） | **父侧亲跑批件 14/14**（先红 3/14 → 后绿 14/14）✓ |
| 预算 | 47 档 · **99,280** 字符（基线比 0.959）；`subagent` 12,738 ∥ `batch` 5,090 | §5.4 登记 ✓ |

**父侧核验**：批件亲跑 **14/14**（本机）∥ §5 实读在盘（`:210-268`）∥ 逐字对表 12/12 抽核 ∥ T8（引用豁免）实害反证实证。

**收口结算同步清单（D7）**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（32 行 / 2,068 字符 / 323 / 200 / 354 / 275 / 12 / 14）∥ 指针（设计单源 = `TOOLS.md` §6.20 + `ALS` §6.30 + `BATCH-RECORD.md` §4.10/§4.11）∥ 变更记录（三设计档随车）∥ 待办勾销 = **#938** ∥ 前批遗留跨核 = **无** ∥ 台账面 = 核销行。

**提交与推送**：提交 = 产品笔（两描述档 + 三产品码档）∥ 文档笔（三设计档 + 需求档 §8.2 + `API-CONTRACT.md` + 本记录 + 批内件）∥ 冻结笔 = 本记录（随落）；推送 = 双远端（origin/gitee ∥ github）。**凭证** = 本批 designId 槽位**终消费**（链终——槽值不入档）。

**披露随记**：① 内部代码评审 🔵 四项（登记不修——评审后产物冻结；`batch-skeleton.mjs:99-100` 双空行等）；② 评审宿主对 `batch-lifecycle.mjs:322` 报「file unreadable」= 路径解析面告警（本席读回逐字属实）；③ §2 表读数漂移已按实测刷新入 §5.2（§2 = designer 段未就地改——一段一作者在案）。
