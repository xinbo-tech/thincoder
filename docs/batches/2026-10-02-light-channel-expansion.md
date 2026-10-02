# 2026-10-02 · light-channel-expansion
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 15:36 评语（「轻通道在做美工调整时感觉真挺好的……这个机制是成功的」）+ 15:39 扩容令（「有些可以明确识别出来需要快速反馈的行为也应该适用，比如debug……你想想还有哪些应该适用的情形？」）+ 15:42 三裁（修复类 = 直改 ∥ 收尾必须全链 ∥ 启动即挂账——「为了确保收尾时全链不漏，启动轻通道时就必须先挂账」）。
> 台账 = #818（LIGHT-CHANNEL.md（core）· 机制扩容）。前情 = docs/batches/2026-09-30-light-channel-mechanism.md（已收口 2026-09-30——机制产品化）∥ docs/batches/2026-09-30-light-closeout-pickup.md（已收口 2026-09-30——收尾提醒补强）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
**本批条目** = ①F-LC1b 收敛面准入（缺陷修复/诊断零链/走查修复/性能观察）∥ ②F-LC3 启动即挂账 ∥ ③修复类直改 ∥ ④收尾必全链；**关键判据** = 用户 15:36/15:39/15:42 三则；**授权口径** = **全链**（机制自身——设计 → 用户点火评审 → 修正 → 批准 → 实施）。

**开批登记（2026-10-02 15:4x · 主 agent）**：用户 15:36 评语（「轻通道在做美工调整时感觉真挺好的……这个机制是成功的」= 机制验证的用户凭据）+ 15:39 扩容令 + 15:42 三裁。**本批条目** = ① **F-LC1 扩容**——新增 **收敛面准入类**（§2.1b：缺陷修复〔先红后绿 ∥ 根因过闸——触发结构/设计缺陷即转全链〕∥ 诊断零链 ∥ 走查修复循环 ∥ 性能观察类）；② **F-LC3 增强**——**启动即挂账**（开轮先建批档 + 台账行，「账在前、笔在后」——防亡链前置）；③ **动手面** = 修复类**主 agent 直改**（≤15 档单点；大修复照旧派舱）；④ **收尾全链 = 必须**（用户重申）。**需求已落**（`docs/core/requirements/LIGHT-CHANNEL.md`：§2.1b ∥ §2.3 ∥ 来源行 ∥ §4⑤——主 agent 笔）；台账 **#818**。**机制自身 = 全链**（其明文边界——本批即该全链：设计 → 评审 → 批准 → 实施）。**设计轮点名（#43 · eng-designer）**：提示词双面落法 ∥ 台账挂接形（挂账时机/形态）∥ 阈值校准（≤15 档于 B 类）∥ B 类「必要测试」判据（红绿对）。

**设计轮（#3）核读 ✓ + 两上抛裁定 + 就绪待点火（2026-10-02 16:0x · 父侧）**：设计档核读（§2.1b 收敛面准入 ∥ §2.3 启动即挂账 ∥ §2.2 交底句收正 ∥ 阈值校准 ∥ K10–K13 ∥ 双面逐字草案在批档 §2.3）——内容面合格，需求 §2.1b/§2.3/§4⑤ 逐条承接 ✓；门：本批两档零新增（超宽自纠 3 处已折）∥ `prompt-refs-check` OK。**U1 裁 = 漏项（准补）**：B-㈡「手段不新增」五件 ⇒ **六件**（+「通道协议」与 A-③ 对齐）——**需求 + 设计双落**（父侧笔，零新语义 · 可 revert）。**U2 = 登记**（性能观察类「转正」时撤「观察类」限定 = 需求档笔——收口轮复核，K13 消解路径在册）。**机制自身 = 全链**：下一节点 = **§3 设计评审（点火权 = 用户）**——设计就绪呈报，候点火。

**点火前收正（2026-10-02 16:48 用户裁 · 父侧）**：用户确认轮六走查反馈走轻通道「很对」，并裁——**走查反馈明示轻通道**（「应该直接在提示词里规定好走查反馈就明确走轻通道，这样以后就不用纠结了」）。处置：**需求侧已落**（`docs/core/requirements/LIGHT-CHANNEL.md` §2.1b 项 3 收正「明示轻通道 · 默认直行 · 不再逐笔纠结归类」+ 来源行六则）；**设计侧修正轮已派**（设计档 §2.1b-③ + 批档 §2.3 双面草案同步——eng-designer 在跑）。落定后本批=再次就绪 ⇒ **候用户点火**（A 说「点火」∥ B 授权自动跑完——此前口径：本批按普通门，不代跑）。

**自动平射授权（2026-10-02 16:50 · 用户「改完以后就直接自动平射跑到落地吧」）**：射程 = 本批（#818）全链自动——**代点火评审** ∥ 修正轮派发 ∥ **§4 代签**（三条件齐备时）∥ 实施派发（提示词双面落笔 + 批内件）∥ 复核 ∥ 收口核销 ∥ 提交；**自缚**（本仓惯例）：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正已落地并逐条核验 ∧ token 已签发）；② 新范围 ∥ 用户口径裁决 ⇒ 停（只摆那一条）；③ 破坏性/不可逆 ⇒ 先停。**起跑点** = 点火前收正落定（设计修正轮在跑）⇒ 核读 ⇒ 代点火。

**修正轮一落定 + 两发现处置（2026-10-02 17:0x · 父侧）**：修正轮一（#1）两处落定读回（设计档 `:46` 与需求 §2.1b-③ **字符级 identical** ✓；批档 §2.9 双面同位收正 ✓）。**发现 1（需求档 `:6` 超宽 304）= 父侧笔已折**（一段分两行——零语义 · 可 revert）。**发现 2（草案腿五件漏同步）= 裁「落」⇒ 微修正轮已派**（操作态草案「缺陷修复」② 全数五件 ⇒ 六件 + §2 补修正行）。落定核读 ⇒ **代点火评审**（16:50 授权）。

**微修正二落定核讫 + 代点火（2026-10-02 17:0x · 父侧）**：草案腿「缺陷修复」② 六件收正落定（§2.10 `:239–:254`——CN/EN 逐字与需求 §2.1b-1㈡ 一致 ✓；操作态 = §2.3 围栏块按 §2.9/§2.10 收正后读——append-only 层叠形 = **裁定接受**，实施轮任务书将明钉「以 §2.10 为准」）。**设计评审已代点火**（范围 = 两设计档 + 需求档；批档挂载 §3）。

**评审轮 1 = pass 裁定（2026-10-02 17:1x · 父侧）**：发现 4 条（🔴0 ∥ 🟡1 ∥ 🔵3）——**逐条裁定 = 全采纳**（0 驳回 ∥ 0 搁置）：① 🟡 交底句双基线（需求 §2.2 单槽 ⇒ 面类槽）= **父侧笔即修**（需求档）；② 🔵 范围句补「∥ 收敛面」（需求 `:8`/`:14` + 设计 `:3`/`:13`/`:132`）= 需求半父侧笔 + 设计半修正轮；③ 🔵 PROMPT-SYSTEM 登记/卫生三小项（16:48 补登 ∥ 「三」计数统一 ∥ 衍字）= 修正轮；④ 🔵 观察类终局定形（处置形态 + 转正去向）= 修正轮。**修正轮已派**（设计侧三号）。落定核读 ⇒ **§4 代签**（条件②补充）⇒ 实施派发（提示词双面落笔——以 §2.10 为准）。

**修正轮核讫 + 代签 + 实施派发（2026-10-02 17:2x · 父侧）**：修正轮一（#6）盘面抽验全落（范围句 `∥ 收敛面` 三处 ∥ 枚举四件式 ∥ 观察类终局 ∥ PS 16:48 补登 ∥ 衍字）⇒ **§4 代签** ⇒ **eng-coder 实施轮已派**（四档提示词——文本源 = §2.9/§2.10 收正后草案；一次性比对验收）。落定核读 ⇒ 收口核销。

**修正轮观察两裁定（2026-10-02 17:2x · 父侧）**：① 需求 `:6` 收尾必全链项加注「（既有律重申）」——**已落**（父侧机械笔 · 可 revert；三档同形达成）；② `PROMPT-SYSTEM.md:317` §6.12 标题「（细节面受控旁路）」⇒「（细节面 ∥ 收敛面受控旁路）」——**裁「落」·已落**（发现 2 同类小扫 · 父侧机械笔 · 可 revert；README 登记表零动——标题未引）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-02 · 收敛面准入（B 类）定形 ∥ 启动即挂账挂接形 ∥ 双面逐字草案（CN/EN×2）∥ 落点/咬合/行数/验收随动；设计档增量已落（LIGHT-CHANNEL.md 163→196 ∥ PROMPT-SYSTEM.md 562→565）；机检本批两档零新增命中；上抛 2）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 任务书（本批 = 轻通道扩容 · 设计轮 · 不实施）

- **轮次** = initial（设计；提示词两靶面落笔归实施轮——本设计轮零实施）。
- **本批条目（覆盖）** = 需求 `docs/core/requirements/LIGHT-CHANNEL.md`（用户 2026-10-02 15:36–15:42 三则）：
  - **F-LC1b 收敛面准入**（§2.1b——两类准入：A 类五问不动摇 ∥ B 类四条：缺陷修复〔五条〕∥ 诊断零链 ∥ 走查修复 ∥ 性能观察；动手面 = 修复类主 agent 直改；守线不动）；
  - **F-LC3 增 · 启动即挂账**（§2.3——开轮〔首笔开工前〕两件：轮次批档 + 轮次台账行；账在前、笔在后；无账之笔 = 不成立）；
  - **收尾全链 = 必须**（F-LC3 重申——用户 15:42 裁；B 类「必要测试」= 红绿复现对/读数前后对）；
  - **验收 ⑤**（§4——扩容增量按 ①–④ 同构核；扩容批 = 本档 · 台账 #818）。
- **设计定形项（需求档明示）**：提示词双面落法 ∥ 台账挂接形（挂账时机/形态）∥ 阈值校准（≤15 档于 B 类）∥ B 类「必要测试」判据（红绿对）——§2.1 逐项。
- **本批不做（边界）**：需求档零触（观察/缺口报父侧）∥ 产品码零触 ∥ 不重写机制（只增量定形）∥ 他批档零触 ∥ 提示词四档本设计轮零触（落地 = 实施轮）∥ 台账 ∥ 批档机制本体零动 ∥ 不发起评审（父侧门）。
- **设计档落点（本设计轮已落）**：`docs/core/design/LIGHT-CHANNEL.md`（增量——§1 ∥ §2.1b ∥ §2.2–§2.7 ∥ §3 ∥ §4⑤ ∥ §5 ∥ §7 K10–K13 ∥ §8）；`docs/core/design/PROMPT-SYSTEM.md`（§6.12 + 变更记录）。

### 2.1 设计定形（逐项）

**① 收敛面准入（B 类）**——设计档 §2.1b（L40–L53）：四条逐项定形（缺陷修复五条 ∥ 诊断零链 ∥ 走查修复 ∥ 性能观察）+ 动手面（主 agent 直改——≤15 档单点；大修复照旧全链）+ 守线不动；判定句（出处可回放 ∥ 红绿在册 ∥ 「触界未转链」= 0 例）。

**② 启动即挂账挂接形**——设计档 §2.3（L67–L68）∥ §2.5（L97）：时机 = 开轮（首笔开工前）；两件 = 轮次批档（先建——台账写门校验 `task_book` 指针所指档存在）+ 轮次台账行（title ∥ board ∥ task_book ∥ evidence + 钩句）；六态衔接 = 行连步至**在途**（待讨论 → 待设计 → 在途——既有迁移表；在途必携指针 = 既有写门；携 executor = 跨会话接手判活面）——在途不可跳核销（既有源态判）= 钩的机械半幅；判定句 =「无账之笔」= 0 例。

**③ 交底句形态收正（B 类）**——设计档 §2.2（L57–L61）：轻通道笔面类槽扩为（细节面 ∥ 收敛面·缺陷修复 ∥ 收敛面·性能观察）；收敛面笔判据半句带硬判据位（出处可指认 ∥ 红绿在手 ∥ 根因 = 实现错误）；**诊断/探针（零链面）不产笔、免交底**（只读 + 临时区、产品面零改——一经产品面改动 ⇒ 回表逐条判）。

**④ 收尾全链与「必要测试」**——设计档 §2.4（L89–L91）：B 类 = **红绿复现对/读数前后对**（笔时捕获 · §1 录 · 收口核）；不另立批内件义务；**B 类逐笔形式化模板**（类 ∥ 出处 ∥ 相抵/读数 ∥ 落地 ∥ 文档一致化去向）——收尾轮 §2 设计面用。

**⑤ 阈值与判据校准（逐项核 · 2026-10-02 设计轮）**：

| 项 | 要求侧现值 | 校准结论 |
|---|---|---|
| A 类五问 | §2.1 原判据 | 零改（要求侧明文「不动摇」） |
| 量级阈值 | A-④ ≤15 档（K2 已定形） | B-⑤ 同数沿用；「单链」定形 = 单根因一条修链（禁捆绑相互独立的多修复）；「可 revert」= 单笔可回退 |
| 先红后绿 | B-㈢ 判据 | 判据本体——笔时捕获、§1 录、收口核（K12） |
| 性能观察类 | 「先跑 1–2 笔再定正式准入」 | 消解路径 = 收口轮复核（笔数 ∥ 读数对 ∥ 结论；通过 ⇒ 候选转正 ∥ 零笔 ⇒ 顺延）（K13） |
| 交底 | 固定格式 | 面类槽收正（③） |
| 收尾链 | 既有全链 | B 类读数对补入「必要测试」（④） |
| 诊断零链 | 只读 + `.thincoder/tmp/`、产品面零改 | 免归类 ∥ 免交底（不产笔）；一经产品面改动 ⇒ 回表判 |

### 2.2 落点清册（段落 → 档 → 节 ∥ 插入锚——as-of 2026-10-02 设计轮实读；实施轮落笔前复读为准）

| # | 内容 | 档 | 插入锚（现文行号） | 形态 |
|---|---|---|---|---|
| P1a | 头行（细节面 ∥ 收敛面；准入两类） | `docs/core/design/prompts/discipline-engineering.md`（CN 正本） | L44 整行替换 | 替换 1 行 |
| P1b | B 类 · 收敛面准入块（头行 + 5 条） | 同档 | L54（⑤ 行）后插入（块前 ∥ 块后各空 1 行） | +8 行 |
| P1c | 轮次形（启动即挂账 + B 类必要测试） | 同档 | L56 整行替换 | 替换 1 行 |
| P2a | 头行（准入全过才走） | `docs/core/design/prompts/persona-engineering.md`（CN 正本） | L82 整行替换 | 替换 1 行 |
| P2b | 轻通道笔面类槽 | 同档 | L83 整行替换 | 替换 1 行 |
| P2c | 判据半句（硬判据位）+ 零链免交底 | 同档 | L85 整行替换 | 替换 1 行 |
| P2d | 启动即挂账（新行）+ 轮次行（§1 字段扩） | 同档 | L85 后插入 1 行；L86 整行替换 | +1 行 ∥ 替换 1 行 |
| P3 | P1a–P1c 的 EN 语义对等翻译 | `thincoder-core/prompts/discipline-engineering.md`（EN 运行面） | 同位（L44 ∥ L54 后 ∥ L56） | 同 P1 |
| P4 | P2a–P2d 的 EN 语义对等翻译 | `thincoder-core/prompts/persona-engineering.md`（EN 运行面） | 同位（L83 ∥ L84 ∥ L86 ∥ L86 后 + L87） | 同 P2 |

### 2.3 双面逐字草案（围栏块——落地逐字 = 此；一次性材料，不混入设计档）

**CN 正本 · P1（三处）**：① L44 整行替换；② L54 后插入（块前 ∥ 块后各空 1 行）；③ L56 整行替换。

① L44 ⇒：
```md
**轻通道（细节面 ∥ 收敛面受控旁路——准入全过才走；旁路 ≠ 取消）**：细节面（视觉 ∥ 文案 ∥ 参数（阈值 ∥ 默认值 ∥ 长度）∥ 既有交互细部（顺序 ∥ 位置 ∥ 键位 ∥ 提示语））的调整可免「设计 → 评审 → 批准」全链——直改 → 实时走查 → 定版。准入两类（任一不过 ⇒ 全链）——**A 类 · 路由五问（细节面）**：
```

② L54 后插入 ⇒：
```md
**B 类 · 收敛面准入**（目标行为已有出处：需求 ∥ 设计 ∥ 记录 ∥ 用户当场的话；工作 = 让实现与之相符——非新增语义）：
- **缺陷修复**（五条全过）：① 出处可指认且现实现与之相抵；② 手段不新增（不碰接口 ∥ 数据结构 ∥ 持久化 ∥ 跨端语义 ∥ 安全面）；③ **先红后绿**（先复现、后修复；拿不出红绿两态 ⇒ 未定位到根因 ⇒ 全链）；④ 根因 = 实现错误（指向设计 ∥ 结构缺陷 ⇒ 停笔转全链）；⑤ 射程 ≤15 档 · 单链 · 可 revert。
- **诊断零链**：只读 + 临时区（产品面零改）——无需归类；一经产品面改动 ⇒ 回表逐条判。
- **走查修复**：用户点名——细节类按五问判 ∥ 行为类按缺陷修复判。
- **性能观察类**：拟准入 = 无结构变更 ∧ 前后读数可证；先跑 1–2 笔再定正式准入。
- **守线不动**：新行为 ∥ 新机制 ∥ 新接口 ⇒ 五问照旧（fail-closed）；「试试 X」类草图 ⇒ 全链；「怎么修」有争议 ∥ 多方案待选 ⇒ 设计问题 ⇒ 全链；结构 ∥ 跨面 ∥ 契约一触 ⇒ 停笔转全链。
```

③ L56 替换 ⇒：
```md
- **轮次形**：轻通道轮次 = 批档一本（逐笔收录：交底 ∥ 改动 ∥ 走查 ∥ 定版）+ 台账行逐笔；**启动即挂账**——开轮（首笔开工前）先建轮次批档 + 轮次台账行（账在前、笔在后；无账之笔 = 不成立）；收尾一次全链（设计形式化 → 独立评审（落码 ∥ 记录 ∥ 文档对账）→ 修复（若有）→ 批准 → 收口核销，含必要测试——B 类 = 先红后绿的复现对 ∥ 读数前后对）；**收尾未落 ⇒ 不许核销**（批档 ∥ 轮次行挂住）。
```

**CN 正本 · P2（四处）**：① L82 整行替换；② L83 整行替换；③ L85 整行替换；④ L85 后插入 1 行 + L86 整行替换。

① L82 ⇒：
```md
- **轻通道（细节面 ∥ 收敛面笔——准入全过才走）**：每笔开工前一句话交底、**交底即行**（分钟级直改——用户改判随时生效），固定格式：
```

② L83 ⇒：
```md
  - 轻通道笔：「**本笔 = 轻通道**（细节面 ∥ 收敛面·缺陷修复 ∥ 收敛面·性能观察）｜改：__｜射程：__｜回退 = 可 revert」
```

③ L85 ⇒：
```md
  交底带**判据半句**（哪条判据过 ∥ 没过——收敛面笔带硬判据位：出处可指认 ∥ 红绿在手 ∥ 根因 = 实现错误）；**用户一票改判**（轻通道 ⇄ 全链 双向）；中途越界 ⇒ **停笔重交底**（禁偷渡）；**诊断/探针（零链面）不产笔 ∥ 免交底**——只读 + 临时区、产品面零改（一经产品面改动 ⇒ 回表逐条判）。
```

④ L85 后插入（行 1）+ L86 替换（行 2）⇒ 两行：
```md
  **启动即挂账**：开轮（首笔开工前）先建轮次批档 + 轮次台账行（先批档后台账行——指针须指向在盘批档；行连步至「在途」——在途不可跳核销 = 钩）——账在前、笔在后；无账之笔 = 不成立。
  轮次 = 批档一本：逐笔收录 §1（交底 ∥ 改动 ∥ 走查 ∥ 定版；收敛面笔另录：出处坐标 ∥ 红绿两态）；台账行逐笔照常；**§5 不适用**（无 eng-coder 实施段——实施面 = 父侧直改，记录住 §1）。
```

**EN 运行面 · P3（三处——同位同形）**：

① L44 ⇒：
```md
**Light channel (detail-face ∥ convergence-face controlled bypass — all admission checks must pass; bypass ≠ cancellation)**: adjustments on the detail face (visual · copy · parameters (thresholds · defaults · lengths) · existing-interaction details (order · position · keybindings · hint texts)) may skip the「Design → Review → Approval」chain — direct edit → live walkthrough → freeze. Two admission classes (any fail ⇒ full chain) — **Class A · the five routing questions (detail face)**:
```

② L54 后插入 ⇒：
```md
**Class B · convergence face** (the target behavior already has a source — requirement ∥ design ∥ record ∥ the user's words on the spot; the work = bringing the implementation into line with it — not adding semantics):
- **Defect fix** (all five must pass): ① the source is identifiable and the current implementation contradicts it; ② the means add nothing new (no interface ∥ data structure ∥ persistence ∥ cross-end semantics ∥ security surface); ③ **red-then-green** (reproduce first, fix after; no red/green pair ⇒ root cause not located ⇒ full chain); ④ root cause = implementation error (pointing to a design ∥ structure defect ⇒ stop and turn to the full chain); ⑤ reach ≤15 files · single chain · revertable.
- **Diagnostics zero-chain**: read-only + temp area (product face unchanged) — no classification needed; once the product face is touched ⇒ back to this table, item by item.
- **Walkthrough fixes**: user-named — detail class by the five questions ∥ behavior class by defect fix.
- **Performance observation class**: proposed admission = no structural change ∧ before/after readings provable; run 1–2 pens before formal admission.
- **Guard lines stay**: new behavior ∥ new mechanism ∥ new interface ⇒ the five questions as before (fail-closed); "try X" sketches ⇒ full chain; a disputed "how to fix" ∥ multiple options pending ⇒ a design question ⇒ full chain; structure ∥ cross-face ∥ contract touched ⇒ stop and turn to the full chain.
```

③ L56 替换 ⇒：
```md
- **Round form**: a light-channel round = one batch record (per-pen entries: disclosure · change · walkthrough · freeze) + per-pen ledger rows; **start-up booking** — at round open (before the first pen) create the round batch record + the round ledger row first (the account precedes the pen; a pen without an account = not established); one full chain at closeout (design formalization → independent review (code · record · doc reconciliation) → fixes (if any) → approval → closeout settlement, including the necessary tests — class B = the red-then-green reproduction pair ∥ the before/after reading pair); **closeout not landed ⇒ no settlement** (the batch record · the round ledger row stays open).
```

**EN 运行面 · P4（四处——同位同形）**：

① L83 ⇒：
```md
- **Light channel (detail-face ∥ convergence-face pens — all admission checks must pass)**: before each pen, a one-line disclosure — **disclose-then-go** (minute-level direct edits — a user re-route takes effect immediately); fixed forms:
```

② L84 ⇒：
```md
  - Light pen: "**This pen = light channel** (detail face ∥ convergence face · defect fix ∥ convergence face · performance observation) | change: __ | reach: __ | rollback = revertable"
```

③ L86 ⇒：
```md
  The disclosure carries the **criterion half-sentence** (which criterion passed or failed — convergence-face pens carry the hard criteria slots: source identifiable ∥ red/green in hand ∥ root cause = implementation error); **the user re-routes with one word** (light or full chain, either direction); crossing the boundary mid-pen ⇒ **stop and re-disclose** (no smuggling); **diagnostics/probes (zero-chain) produce no pen ∥ need no disclosure** — read-only + temp area, product face unchanged (touching the product face ⇒ back to the table, item by item).
```

④ L86 后插入（行 1）+ L87 替换（行 2）⇒ 两行：
```md
  **Start-up booking**: at round open (before the first pen) create the round batch record + the round ledger row (the batch record first, then the row — the pointer must target an on-disk record; the row walks to 在途 — settlement blocked until the closeout = the hook) — the account precedes the pen; a pen without an account = not established.
  The round = one batch record: per-pen entries in §1 (disclosure · change · walkthrough · freeze; convergence-face pens also record the source and the red/green pair); ledger rows per pen as usual; **§5 = not applicable** (no eng-coder implementation segment — the implementation face = parent direct edits, recorded in §1).
```

**草案自检（两界 ∥ 词汇 ∥ 锚）**：① 两界——四块零文档引用（无 `.md` 名 ∥ 无「见 X 档」；`§1`–`§6` = 协议自名）✓；② 词汇——沿存量（light channel ∥ detail face ∥ closeout ∥ settlement ∥ revertable；收敛面族 = 要求侧同名对译）；③ 锚——行号 as-of 本设计轮实读（实施轮复读为准）；仅整行替换 + 块插入（零 `##`/`###` 块计数连带）。

### 2.4 影响面（受影响文件 ∥ 行数标注 ∥ 本设计轮已落读数 ∥ 机检读数）

**实施轮受影响文件（行数口径 = KD-4 内容行——单源 = `scripts/doc-check-linecounts.mjs` `countContentLines`；read 显示数 = +1）**：

| 档 | 现数 | 预计增量 | 面 ∕ 笔 |
|---|---|---|---|
| `docs/core/design/prompts/discipline-engineering.md` | 162 | +8 估（块插入 8 行；两处整行替换零净增） | 镜像面 CN（实施轮） |
| `thincoder-core/prompts/discipline-engineering.md` | 170 | +8 估（同 P3） | 运行期面 EN（实施轮） |
| `docs/core/design/prompts/persona-engineering.md` | 190 | +1 估（插入 1 行；三处整行替换零净增） | 镜像面 CN（实施轮） |
| `thincoder-core/prompts/persona-engineering.md` | 190 | +1 估（同 P4） | 运行期面 EN（实施轮） |

**本设计轮已落（设计面 · 实读读数 · KD-4）**：

| 档 | 读数（改前 → 现） | 内容 |
|---|---|---|
| `docs/core/design/LIGHT-CHANNEL.md` | 163 → **196**（+33） | §1 扩容段（L21）∥ §2.1b（L40–L53）∥ §2.2–§2.7 随动（L57–L61 ∥ L67–L68 ∥ L89–L91 ∥ L97）∥ §3 落点/咬合（L122–L123 ∥ L131 ∥ L134 ∥ L136）∥ §4⑤（L150）∥ §5（L157）∥ §7 K10–K13（L180–L183）∥ §8（L195–L196） |
| `docs/core/design/PROMPT-SYSTEM.md` | 562 → **565**（+3） | §6.12（来源 L319–L320 ∥ 机制 L322 ∥ 分层归属 L324）+ 变更记录（L453） |

**不改面（零触清单）**：产品码 ∥ 需求档 ∥ 台账机制 ∥ 批档机制 ∥ 评审链 ∥ `batch` 工具 ∥ normal 侧 ∥ 他批档 ∥ 其余提示词档 ∥ `docs/README.md`（零需——无新档 ∥ 计数零动）。

**机检读数（交付前一次 · 本设计轮 · 2026-10-02）**：

- `node scripts/doc-check.mjs`（仓根零参）= 悬空 **128**（存量 ∥ 他批在飞——**本批两档零新增**：`LIGHT-CHANNEL.md` 零命中；`PROMPT-SYSTEM.md` 仅 `:149` ∥ `:561` 两处「迁移期引文 · 列报 · 不入闸」既有行）∥ 行宽 **105**（区带豁免在效〔变更记录 ∥ 历史沿革——域内不计〕——**本批两档零新增**：超宽自纠 3 处已折〔`LIGHT-CHANNEL.md:67` 301 ⇒ 拆二行 ∥ `:194→:195` 312 ⇒ 折二行；`PROMPT-SYSTEM.md:319` 354 ⇒ 折二行〕——复扫本批两档零命中〔PS 存量 9 行超宽 = 既有行，非本批引入〕）∥ 行数面 = **差异 0 条**（比对 156 行 · 跳过 184 行）；exit 1（存量闸值 0——非本批）。
- `node scripts/prompt-refs-check.mjs` = **OK**（提示词面 84 档 ∥ 代码面 409 档 · J1/J2/J3 命中 0）——本批两档新增文本零文档引用。

### 2.5 验收对照（本批三条 + 需求 §4⑤ 映射）

| # | 本批验收（派单） | 落位 |
|---|---|---|
| ① | 需求 §2.1b ∥ §2.3 ∥ §4⑤ 逐条可设计承接 | §2.1 ∥ 设计档 §2.1b（L40–L53）/§2.3（L67–L68）/§4⑤（L150）✓ |
| ② | 设计档读回（D6） | §2.4 读数（196 ∥ 565 · 逐处回读 ✓） |
| ③ | 批档 §2 撰写 | 本段 ✓（含双面逐字草案——实施轮可直取） |

**需求 §4⑤ 映射**：⑤ = 扩容增量落双面后按 ①–④ 同构核——可核形态 = 实施轮一次性比对（落地四档 ↔ §2.3 围栏块：B 类块 ∥ 启动即挂账句）+ 评审对照（B 类逐条 ↔ 落地文本；启动即挂账三件：时机 ∥ 两件 ∥ 钩）；②③承接面沿既有观察腿（零新增腿——不因单次改动增补）。

**三链一致**：§2 条目（F-LC1b ∥ F-LC3 增 ∥ 验收⑤）= 设计档 §2.1b/§2.3/§4⑤ = 需求档 §2.1b/§2.3/§4⑤ ✓（同源同链）。

### 2.6 关键决策（设计档 §7 K10–K13 摘要）

- **K10** B 类准入落法 = 同块内 A 类五问后新增「B 类 · 收敛面」小节 + 交底节补面类槽/零链免交底 + 轮次形补 B 类必要测试；否决「独立块」（块数扰动 + 与五问断裂）·「只落人格层」（子代理 ∥ 收尾评审受众缺）·「并入五问第七问」（准入对象不同）。
- **K11** 启动即挂账 = 开轮两件（先批档后台账行——写门指针存在性定序）+ 行连步至在途；否决「行停待讨论」（追认核销口 + 判活面缺）·「新增状态/字段」（六态零动）·「逐笔行同点强制」（超要求）。
- **K12** B 类「必要测试」= 红绿复现对/读数前后对（笔时捕获 · §1 录 · 收口核）；否决「每笔批内件」（成本-代价不匹配）·「只凭交底不录读数」（判据须在册）。
- **K13** 性能观察类 = 观察窗（1–2 笔）+ 复核点（收口轮）；否决「直接正式准入」（要求侧明文为拟）·「无限观察」（无到期条件 = 永久先例）。

### 2.7 上抛 + 观察

- **U1（需求面观察 · 父侧裁）**：B-㈡「手段不新增」列 5 件（接口 ∥ 数据结构 ∥ 持久化 ∥ 跨端语义 ∥ 安全面）≠ A-③ 契约问 6 件（多「通道协议」）——设计按 B-㈡ 原文落（不擅自加项）；若「通道协议」属有意区间（缺陷修复 = 实现向既有规格对齐、非改协议）⇒ 零动作；若属漏项 ⇒ 需求档笔（父侧）。
- **U2（需求面观察 · 父侧裁）**：性能观察类「转正」——复核通过后的「观察类」限定撤除 = 需求档笔（父侧随收口建议）；设计已给消解路径（K13）。
- **观察（非上抛 · 零触）**：轮次行字段规范形（board ∥ task_book ∥ title ∥ evidence + 钩句）已定形——消解前批 `docs/batches/2026-09-30-light-closeout-pickup.md` §2.7-U2 建议（父侧台账笔照新规执行）；存量轮 1–5 不回溯（非追溯纪律）；逐笔行 timing 照旧。

### 2.8 设计轮自检（交付前）

- **五要点对照**：目标（受众 ∥ 问题——§2.0）✓ · 条目（F-LC1b ∥ F-LC3 增 ∥ ⑤ → §2.1）✓ · 边界（本批不做 + 设计档 §5）✓ · 验收（§2.5）✓ · 依赖（需求 §5 ∥ 设计档 §6）✓。
- **读回核实（D6）**：`LIGHT-CHANNEL.md` 全档读回 ✓（196）；`PROMPT-SYSTEM.md` 四处读回 ✓（§6.12 三处 + 变更记录）；机检复扫 ✓（§2.4）。
- **歧义自查（逐句）**：①「准入全过」= A 类五问 ∥ B 类逐条（两路任一不过 ⇒ 全链）——头行与「准入两类（任一不过 ⇒ 全链）」同义表述收正；②「单链」= 单根因一条修链（设计档 §2.1b 校准注定形）；③「免归类犹豫」→ 落文「无需归类」+ 免交底——语义等价（免的是程序不是判据：产品面一改即回表）；④「大修复照旧」→ 落文「大修复照旧（全链 → 派舱）」——「照旧」= 常规全链（与要求侧「派舱（eng-coder）」同轴：派舱在链尾）；⑤ 性能「拟准入」→ 观察窗内按拟标准执行、收口轮复核（K13）；⑥ 面类槽「收敛面·缺陷修复 ∥ 收敛面·性能观察」= 示**类**（走查行为类笔示「缺陷修复」——类非触发）。
- **实施轮切分（建议）**：单舱 · 四档（CN×2 + EN×2——eng-coder 单舱全落，沿机制批 §6 口径；逐字唯一来源 = §2.3 围栏块）；落笔前经 §3 评审 + §4 批准 + token 签发（父侧门——本设计轮不发起）。

### 2.9 点火前小收正（2026-10-02 16:48 用户裁 · 走查反馈明示轻通道——实施轮以本条为准）

- **承**：用户 16:48 裁（「应该直接在提示词里规定好走查反馈就明确走轻通道，这样以后就不用纠结了」——§1 在案）；设计档同步 = `docs/core/design/LIGHT-CHANNEL.md` §2.1b-③（同轮已落——单行替换 · 行数零净增 ∥ 与需求 §2.1b-③ 逐字对齐）。零新语义 · 可 revert。
- **§2.3 草案收正**：B 类块「走查修复」行（CN P1 ② 块 ∥ EN P3 ② 块）的原行（细节类按五问判）由下列逐字行取代；其余行零改；**比对基准随动**：§2.5 一次性比对以 §2.3 围栏块按本条收正后文本为准。

**CN（P1 ② 块替换行）⇒**
```md
- **走查修复（明示轻通道）**：用户走查当场点名的问题——**细节类（外观 ∥ 交互细部 ∥ 文案 ∥ 参数）明确走轻通道**（**默认直行——不再逐笔纠结归类**；交底即行照旧）；行为类 ⇒ 按缺陷修复判（五条全过）；一触越界 ⇒ 停笔重交底（转全链）。
```

**EN（P3 ② 块替换行）⇒**
```md
- **Walkthrough fixes (explicit light channel)**: user-named on the spot — **detail class (visual · interaction details · copy · parameters) goes explicitly to the light channel** (**default straight-through — no more per-pen agonizing over classification**; disclose-then-go as before) ∥ behavior class by defect fix (all five must pass); a boundary touch ⇒ stop and re-disclose (full chain).
```

- **补记（同轮 · 核读随动）**：① 设计档实读行数 196 ⇒ **198**（+2 = 变更记录 1 行 + 分隔空行；上「行数零净增」= §2.1b-③ 单行替换本体）；② 机检本轮：`doc-check` = 设计档零新增命中（悬空 121 ∥ 行宽 106 ∥ 行数面 4 条〔他批在飞——本档无条目〕）∥ `prompt-refs-check` = 命中 0；**需求档 `LIGHT-CHANNEL.md:6` = 304 字符超宽 1 条（16:48 来源行编辑所致——父侧笔；提请随报告）**。

### 2.10 修正二（缺陷修复② 五件 ⇒ 六件 · 草案腿同步——2026-10-02 · 实施轮以本条为准）

- **承**：U1 裁在案（§1 `:11`——「漏项 · 准补」：B-㈡「手段不新增」五件 ⇒ 六件，+「通道协议」与 A-③ 对齐；需求 + 设计双落〔父侧笔〕）；§1 `:17` 发现 2 裁「落」——草案腿（实施轮逐字来源）须同步。零新语义 · 可 revert。
- **§2.3 草案收正**：B 类块「缺陷修复」② 行之「手段不新增」括注（CN P1 ② 块 `:83` ∥ EN P3 ② 块 `:128`——as-of 本条实读）五件 ⇒ 六件，下列逐字取代；括注外成分 ∥ 其余行零改（含已退历史面的「走查修复」原行 `:85` ∥ `:130`——§2.9 收正在效）；**比对基准随动**：§2.5 一次性比对以 §2.3 围栏块按 §2.9 及本条收正后文本为准。

**CN（P1 ② 块——② 行括注取代）⇒**
```md
（不碰接口 ∥ 通道协议 ∥ 数据结构 ∥ 持久化 ∥ 跨端语义 ∥ 安全面）
```

**EN（P3 ② 块——② 行括注取代）⇒**
```md
(no interface ∥ channel protocol ∥ data structure ∥ persistence ∥ cross-end semantics ∥ security surface)
```

- **核读**：① 与需求 §2.1b-1㈡（`docs/core/requirements/LIGHT-CHANNEL.md:35`）六件逐字一致 ✓；② 「五条」= 缺陷修复判据条数（①–⑤——不变），非五件手段列表（§2.3 `:83`/`:128` · §2.9 `:229`/`:234` · §2.0 `:27` · §2.1 ① `:37` 同）⇒ 零改；③ §2.7 U1（`:211`）= 发现记录（处置在 §1 `:11`；本条 = 其草案腿落地）——记录面零改。

### 2.11 评审修正轮 1 收正（发现 #2 设计半 ∥ #3 ∥ #4——逐号处置 · 2026-10-02）

- **承**：评审轮 1 = pass（🔴0 ∥ 🟡1 ∥ 🔵3——全采纳；§1 `:21` 裁定）；本段 = 设计侧三号（发现 1 ∥ 发现 2 需求半 = 父侧笔——本段零触需求档）。零新语义 · 可 revert。
- **#2（设计半）· 范围句补「∥ 收敛面」**：`docs/core/design/LIGHT-CHANNEL.md:3`（页首 ⇒「细节面 ∥ 收敛面受控旁路」）∥ `:14`（定位句 ⇒「为四步硬流程在细节面 ∥ 收敛面开一条…旁路」）∥ `:133`（咬合表「变更面分流」行 ⇒ 补「；收敛面例外同载于机制块（条件同显）」）。邻位扩容段 `:22` 已含「B 类（收敛面）」——零改。
- **#3 · PS 登记/卫生三小项**：① 16:48 补登——`docs/core/design/PROMPT-SYSTEM.md:319`（来源行 +「∥ 16:48 裁「走查反馈明示轻通道」」）∥ `:455`（变更记录 + 本修正轮行，含 16:48）；②「三」枚举统一（四件式 = 收敛面准入 ∥ 修复类直改 ∥ 收尾必全链（既有律重申）∥ 启动即挂账——项序对齐需求 `:6`）——PS `:319` ∥ 设计 `:4–:5`（折二行 = 行宽自纠：原增项后 305 >300）同列；需求 `:6` 腿 = 父侧笔（见观察）；③ 衍字——`:453`「父侧侧」⇒「父侧」。
- **#4 · 观察类终局定形**：`:48`（未过 ⇒「笔级回全链」定形 = 就地补链——随收口轮显式走全链，落定后方可核销；转正落档 = 随收尾全链文档一致化面：需求 §2.1b-4「拟准入 ∥ 观察类」限定撤除 + 提示词句收正为正式准入）∥ K13 `:184` 同拍（未过分枝 ∥ 落档去向 ∥ 否决「回退重走」理据）。
- **核读（D6）**：两档逐处读回 ✓（文案对照见上行 `file:line`；全档回读两过）；机检：doc-check（悬空 121 ∥ 行宽 105 ∥ 行数面 差异 0 条——本批两档零新增；PS 存量命中 `:149` ∥ `:564`「迁移期引文——列报 · 不入闸」既有行）∥ prompt-refs-check（提示词面 84 档 ∥ 代码面 409 档 · 命中 0）。
- **读数注**：两档物理行数——LC 199→202 ∥ PS 566→568（折行 +1（LC）∥ 变更记录 + 空行 +2/+2）。
- **观察（非阻断）**：① 需求 `:6`「三裁」四项腿未注「（既有律重申）」——父侧笔（同拍加注 ⇒ 三档完全同形）；② PS `:317` 标题「（细节面受控旁路）」同形未在发现面——零触（候裁）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

读取面 = 三档全文（`thincoder/docs/core/design/LIGHT-CHANNEL.md` ∥ `thincoder/docs/core/design/PROMPT-SYSTEM.md` ∥ `thincoder/docs/core/requirements/LIGHT-CHANNEL.md`）；双面逐字草案（批档 §2.3/§2.9/§2.10）不在声明读取面——逐字内容未核（unverified）；域外坐标（`LEDGER.md` ∥ `BATCH-RECORD.md` ∥ `persona-engineering.md:73-74`/`:77` ∥ `subagent-spawn.mjs` ∥ 四档落地档 ∥ 首轮批档）未核。需求覆盖 ∥ 可行性 ∥ 方法合规 ∥ 清晰度 ∥ 验收 ∥ 范围 ∥ 归属 ∥ 大小标注（纯 `.md`——提示词档免档位判定 `PROMPT-SYSTEM.md:162`，无 source/test 文件 ⇒ 无需标注）逐项已核，❌ 无阻断项。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership（跨档 doc-state） | 🟡 | 同一交底句两档基线不一：需求 §2.2「固定格式」仍为单槽（细节面）（`thincoder/docs/core/requirements/LIGHT-CHANNEL.md:46`），设计 §2.2 已扩面类槽三选项（细节面 ∥ 收敛面·缺陷修复 ∥ 收敛面·性能观察）（`thincoder/docs/core/design/LIGHT-CHANNEL.md:58`）——B 类笔在需求格式下无槽位、按该格式书写会被标成「细节面」。 | 需求 §2.2 格式行补面类槽（与设计 §2.2 同式）；或加一句「交底句面类槽以设计定形为准」消双基线。 |
| 2 | Doc-state（范围句） | 🔵 | 范围句未随 B 类扩容补「∥ 收敛面」：需求 §1 目标句（`requirements/LIGHT-CHANNEL.md:14`）∥ 关系句（`:8`）；设计 §3 咬合表「变更面分流」行（`design/LIGHT-CHANNEL.md:132`）仍述「细节面例外由机制块承载」（B 类缺陷修复同属该例外）；设计页首 `:3` ∥ 定位句 `:13` 同形（邻位已有扩容段 `:21`）。 | 逐处补「∥ 收敛面」限定或就近指 §2.1b；`:132` 行补「收敛面例外同载于机制块」。 |
| 3 | Doc-state（登记/卫生） | 🔵 | (a) PROMPT-SYSTEM §6.12 来源行与变更记录只登 15:36–15:42（`PROMPT-SYSTEM.md:319` ∥ `:453`），未登 16:48 裁（设计档侧已登 `design/LIGHT-CHANNEL.md:198`）；(b) 同一枚举三档不一——需求「三裁」列四项（`:6`）∥ PROMPT-SYSTEM「三则」列三项（`:319`）∥ 设计「三则」列两项+F 号（`design/LIGHT-CHANNEL.md:4`）；(c) `PROMPT-SYSTEM.md:453`「父侧侧」衍字。 | §6.12 来源/变更记录补 16:48；三档「三」的列举与计数统一（或注明「含既有律重申」）；衍字删。 |
| 4 | Clarity | 🔵 | 观察类终局未定形：`design/LIGHT-CHANNEL.md:47`「未过 ⇒ 笔级回全链」未给处置形态（回退重走 ∥ 就地补链 ∥ 与收口轮的先后）；K13（`:183`）「通过 ⇒ 候选转正」未给转正落档去向（需求 §2.1b-4「拟准入」与提示词文本「观察」态的收正去向、触发时点）。 | §2.1b-4 或 K13 补一句：未过处置形态 + 转正落档去向（承「例外须带消解期」）。 |

计数：发现 4 条（🔴 0 ∥ 🟡 1 ∥ 🔵 3）。
VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**：**代签成立（2026-10-02 17:2x · 自动平射授权内）**——三条件核：① **设计评审 pass** ✓（评审轮 1：🔴0 ∥ 🟡1 ∥ 🔵3——报告全文在会话日志；**§3 由评审子代理未落档**——父侧裁定在 §1 在册，沿「不得静默略过」口径记明）；② **修正落地并逐条核验** ✓（修正轮一：发现 1 需求半 ∥ 发现 2/3/4 设计半——盘面父侧抽验 `design/LIGHT-CHANNEL.md:3 ∥ :4-5 ∥ :13 ∥ :47 ∥ :133 ∥ :184 ∥ :196-201` ∥ `PROMPT-SYSTEM.md:319 ∥ :453 ∥ :455` 全落；微修正轮：草案腿六件 §2.10 `:239–:254` 核讫）；③ **token 已签发** ✓（**凭据值不落档**——沿纪律）。**授权源** = 用户 2026-10-02 16:50「改完以后就直接自动平射跑到落地吧」。**实施派发** = eng-coder 单舱（四档提示词双面落笔——CN 正本二 + EN 运行面二；文本源 = §2.9/§2.10 收正后草案；**一次性比对**为验收本体——禁新增锚）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-02 · 四档落笔 26 内容行逐字/对等 ∥ 一次性比对 40/40 ∥ prompt-refs 0 ∥ KD-4 +8/+8/+1/+1；审计 CLEAN ∥ 评审 pass（2🔵 可选）∥ 修正轮 0）


**交付摘要**：轻通道扩容（#818）实施轮 = 提示词双面落笔（纯提示词面——零产品码）。四档：`docs/core/design/prompts/discipline-engineering.md`（CN 正本）∥ `docs/core/design/prompts/persona-engineering.md`（CN 正本）∥ `thincoder-core/prompts/discipline-engineering.md`（EN 运行面）∥ `thincoder-core/prompts/persona-engineering.md`（EN 运行面）。文本源 = §2.3 围栏块按 §2.9 ∥ §2.10 收正后文本（判断序 §2.10 > §2.9 > §2.3）；落笔 14 位／内容行 26 行（CN 3+4 ∥ EN 3+4——同位同形）。

**一次性比对读数（验收本体）**：

- **CN 逐字**：40/40 项字符级命中（逐行 `===` 比对；含 §2.9「走查修复（明示轻通道）」行 ∥ §2.10 六件括注——CN×2 ∥ EN×2 同式）。
- **EN 对位**：EN 逐字命中（同仪器）；EN↔CN 8 组落点逐句语义对等（头行 ∥ B 类块 6 行 ∥ 轮次形 ∥ 交底头行 ∥ 笔形 ∥ 判据半句 ∥ 启动即挂账 ∥ 轮次行）。
- **结构**：B 类块 = ⑤ 行后「空行 | 6 行 | 空行」插入（CN disc `:55–:62` ∥ EN disc 同位）；相邻既有行（全链笔行 ∥ 通道外清单 ∥ 收口触发等）零触。
- **行数对账**（KD-4 = `scripts/doc-check-linecounts.mjs` `countContentLines`）：CN disc 162→170 ∥ EN disc 170→178 ∥ CN pers 190→191 ∥ EN pers 190→191（**+8/+8/+1/+1 = §2.4 预计精确命中**）。
- **机检**：`node scripts/prompt-refs-check.mjs` = 命中 0（提示词面 84 档 ∥ 代码面 409 档）；`doc-check` 本批四档零新增（CN persona `:99`/`:109` 两处「符号·宽·报告面」= 存量行（改前 `:98`/`:108` 同内容）；EN 两档不在 docs 扫描域；退出码 1 = 存量闸值，非本批）。
- **零改写**：四档 ↔ 改前快照全档 diff = 仅声明 hunk（零旁落）；旧形态负对照 0 命中。

**决策透明表**：

| # | 事项 | 处置 |
|---|---|---|
| 1 | §2.9/§2.10 收正与本批判断序 | 落笔按 §2.10 > §2.9 > §2.3 执行；比对基准 = 收正后文本 |
| 2 | 一次性比对仪器 + 四档改前快照落 `.thincoder/tmp/lc818-baseline/` | 临时区材料（工程工具面）——留作收口复核复跑；不落仓树 |
| 3 | explore 只读偏差审计 = CLEAN（四类偏差 0 ∥ 负对照 0） | 无需修正轮 |
| 4 | advisor 代码评审 = pass（0🔴 ∥ 0🟡 ∥ 2🔵 可选） | 响应表见下；0 修正轮 |
| 5 | 审计注记「§5 于审计时点为空」= 时序前置 | 本段落笔后自然消解 |

**审计与代码评审轮次与终态**：审计轮 1（explore 只读偏差审计）= CLEAN（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 超清单改动四类均 0 ∥ 0 修正轮）；advisor 代码评审轮 1 = pass（0🔴 ∥ 0🟡 ∥ 2🔵 可选 ∥ 0 修正轮）；**fix round = 0；终态 = clean**。

**advisor 响应表**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🔵 批档 §2.4 persona 行注「三处整行替换」vs §2.2 P2d「L86 整行替换」/§2.3「（四处）」计数口径不一——承认；批档 §2 非本人写域（一段一作者），父侧可选机械笔（`三处`⇒`四处`），不阻塞 |
| 2 | Deferred | 🔵 需求侧理由括注（「顺手优化」= 口子 ∥ 铁律二钩句）未逐字进提示词面——设计面已裁定的形态压缩（设计档 `§2.1b` ∥ §2.8 同拍），操作性判据全落；记收口轮文档一致化对账一行，不落笔 |

**遗留/上抛（父侧裁量面）**：

1. （可选 · 记录面）批档 §2.4 persona 行计数注机械笔（`三处`⇒`四处`；零语义 · 可 revert）——父侧裁量。
2. （报告面）需求侧理由括注的提示词压缩形态——收口轮「文档一致化」对账记一行即可（零落笔）。
3. 一次性比对材料（四档改前快照 4 件 + 比对仪器 `verify-lc818.mjs`）在 `.thincoder/tmp/lc818-baseline/`——供父侧收口复核复跑。

## §6 验证与收口（父代理）

### 6.1 收口核验 + 结算（2026-10-02 17:4x · 父侧）

**父侧独立复核**（非采信自报）：

- **一次性比对复跑**（`.thincoder/tmp/lc818-baseline/verify-lc818.mjs`——父侧亲跑）：**ALL CHECKS PASS**（40/40 字符级 + 结构邻接 + LCS diff = 仅声明 hunk）——与 coder 自报一致 ✓。
- **`prompt-refs-check` 复跑**：提示词面 84 档 ∥ 代码面 409 档 · **命中 0** ✓。
- **`doc-check` 终读**：锚 **121**（基线）∥ 行宽 **105**（基线）∥ 行数面差异 **0** ✓（本批零净增）。
- **四档抽读**（CN `discipline-engineering.md:44 ∥ :56-61 ∥ :64` ∥ CN `persona-engineering.md:82-90` 逐段实读）：与设计 §2/§2.9/§2.10 收正后文本一致 ✓（B 类四条 ∥ 走查明示 ∥ 启动即挂账 ∥ 面类槽三选项 ∥ 收口触发 ∥ 跨会话接手 ∥ §段映射）。
- **行数对账**：170/178/191/191（+8/+8/+1/+1——精确命中）✓。

**上抛处置**：

1. §2.4 persona 注「三处整行替换」vs 实 = 四处——**接受（不追改）**：零语义（操作态 = §2.9/§2.10 收正后文本 ∥ 40/40 命中）；§2 = 设计师段（一段一作者）+ 冻结先行；已知差在此在册。
2. 需求侧理由括注的提示词面压缩形态——**对账一行**：可操作性判据全落（五条 ∥ 守卫均落文）；压缩处 = 理由性括注（非判据）——一致。
3. `docs/README.md:77` 描述子「细节面受控旁路」⇒「细节面 ∥ 收敛面受控旁路」（+扩容注）——**父侧机械笔已落**（设计「README 零动」= 计数/登记面；此为 scope-word 同步 · 可 revert）。
4. `.wt-head-probe/`（探针 worktree 含四档旧文本镜像）——**范围外注记**：非文档面、非本批触面；零动作（探针残留，另行处置）。
5. 比对材料（改前快照 4 件 + 仪器）留 `.thincoder/tmp/lc818-baseline/`（工程工具面——供复核复跑）✓。

**结算**：阶段态全绿（设计 ✓（评审轮 1 pass）∥ §4 代签 ✓（三条件）∥ 实施 ✓（clean ∥ 40/40）∥ 复核 ✓（父侧亲跑））⇒ **收口（2026-10-02）**——记录冻结；台账 **#818 核销**；**凭证链终态消费**（designId 值不落档——沿纪律）。
