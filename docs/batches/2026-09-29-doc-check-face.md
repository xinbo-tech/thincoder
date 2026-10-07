# 2026-09-29 · doc-check-face（文档机检面：存量红清账 + 引核行号漂移复核 + 行数面增件）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:56 令）——doc-check 面收正载体：台账 #435 ∕ #469 ∕ #546。。
> 台账 = #435 ∕ #469 ∕ #546（文档机检面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账集中处置令（16:56）；授权 = 13:52 全权。
- **条目（3 行）**：**#435**（全仓 doc-check 存量红清账——40 悬空 + 21 行宽；含「读数 Δ+14 归因未证」观察；分流 = 机判清 ∕ 人工清）· **#469**（引核行号漂移复核——doc-check 不覆盖行号引用；全仓引核坐标档面扫 + 随触碰收正）· **#546**（doc-check 行数面增件——§4.1 表逐档实读 vs 表值比对；判据语义面 ⇒ 设计轮 + 实现 = 工程工具面）。
- **边界**：`docs/**` 写面横扫他批在飞档 ⇒ 设计轮给「冲突避让表」（在飞批写域排除；届盘重读）。
- **口径**：设计 = eng-designer；#435 ∕ #469 实施 = doc 面（eng-designer）；#546 实现 = 工程工具面（父侧直改 + 门禁）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（本批三件设计 + #546 文档面轮 + #469 cli 轮 + #435 doc 面实施轮（§2.17）——悬空 161 ⇒ 44 ∕ 行宽 81 ⇒ 66；余量 = R6 25 + 记录面 5 + 需求档 14（逐条在册））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与路由 · 设计档落点

**覆盖**（台账 3 行 · 本件 = 设计交付 · **零改动**——设计全文住本段）：
- **#435** 全仓 doc-check 存量红清账——分流方案（机判可清 ∕ 人工两清单）
- **#469** 引核行号坐标漂移复核——扫描方案（可机判判据 + 与 doc-check 关系）
- **#546** doc-check 行数面增件——checkConfig 新键 + 模块切分 + main 集成 + 输出形

**路由**（承 §1.1 口径）：设计 = 本件（eng-designer）∥ #435 ∕ #469 实施 = doc 面（eng-designer 后续轮，**另行派单**）∥ #546 实施 = 工程工具面（父侧直改 + 门禁）；其中 `docs/desktop/design/PROJECT.md` §4.1 回填与口径句 = 文档面（笔权另裁——上抛 3）。

**设计档落点**（后续轮按面落笔）：
- `docs/core/design/DOC-DISCIPLINE.md` §7（机检引擎）：四档接口（`:1294`）⇒ **五档**（+ 行数面模块行）；F2 判据键句（`:1290`）补 `lineCounts`；§7 自测护栏段（`:1310-1312`）死指针收正（详见 2.4 落点 7）。
- `docs/core/design/DOC-DISCIPLINE.md` §1 D4 邻位：#469 触档复核纪律句（实施轮落笔）。
- `docs/desktop/design/PROJECT.md` §4.1（`:147`）：按盘回填 + 表头口径句（`:149`）补「行数面机检 = `checkConfig.lineCounts` 声明」。
- 批档 §5（实施轮）：两清单（A ∕ B）+ 基线与逐轮读数逐字存档。

**基线读数（as-of 2026-09-29 17:0x · 父侧亲跑 · 命令 = 仓根零参 `node scripts/doc-check.mjs`）**：悬空 **161**（用例号 100 ∕ 路径·坐标 54 ∕ 符号·窄 7）· 行宽 **77** 行 · 报告族：符号·宽 803（报告面，不入闸）。注：读数当日仍在动（doc-dangling-sweep 收口读数 148 → 现 161）⇒ 实施轮开工必重取（协议见 2.2）。

### 2.2 #435 存量红清账 · 分流方案

**（a）基线协议（读数可比性——本方案的先决件）**
1. 命令固定 = 仓根零参 `node scripts/doc-check.mjs`（不传 `--root` ∕ `--domain`——防空域假绿与口径漂移；承 DOC-DISCIPLINE §7:1304 纪律）。
2. 捕获粒度 = **汇总五行逐字**（汇总 ∕ 用例号 ∕ 路径·坐标 ∕ 符号·窄 ∕ 符号·宽）+ 全部逐条行 + FAIL ∕ OK 行；逐字存档入批档 §5。
3. 历史读数比较 = **两读数行集逐行集合差**（新增行 ∕ 消失行逐条列）——Δ 只认集合差，**禁叙述归因**。
4. **历史读数对齐（口径 ∕ 作废状态）**：台账期旧读数两组——`40 悬空 + 21 行宽`（台账 #435 行标题 as-of 09-26）· `34（09-27 03:30）⇒ 48（09-27 05:12）· Δ+14`（#435 evidence 内）——**口径均未存证**（未随读数存命令 ∕ 域参数 ∕ 引擎版本）⇒ **不可回溯重算，整组作废**（不作本批口径源 ∕ 不作验收分母；历史观察原样留档——不猜因不改数，承前）。另注在案（**只报不裁**）：该记「悬空 48 = 路径/坐标 47 + 符号·窄 1」未列用例号族——新旧读数口径疑点之一。
5. **本批唯一口径源 = 开工基线**：`node scripts/doc-check.mjs`（零参）逐字读数 as-of 2026-09-29 17:0x = 悬空 **161**（用例号 100 ∕ 路径·坐标 54 ∕ 符号·窄 7）· 行宽 **77**；**验收分母 = 开工基线全量（161 ∕ 77 级）**——实施轮开工复取，复取值即终局分母。

**（b）分类规则**（逐锚 ∕ 逐行一条 · 机判可清**三项** M1–M3 + 人工六类 R1–R6）

| 类 | 适用族 | 判据 | 处置 |
|---|---|---|---|
| **M1 折行**（可再生） | 行宽 | 非表格行 ∧ 存在安全折点（分句边界：顿号 ∕ 分号 ∕ 逗号 ∕ 破折号 ∕ 空格）∧ 折后逐行 ≤300 ∧ 拼接与原文**逐字相等** | 折行（逐处读认落笔）|
| **M2 改指**（纯坐标） | 路径/坐标悬空 | 悬空 token 在盘有**唯一**新宿主（唯一 basename ∕ 锚域前缀剥离命中 ∕ 解析序唯一命中） | 改指（沿 doc-dangling-sweep 先例：改指 ∕ 退场给由两分）|
| **M3 重锚**（纯坐标） | 坐标尾漂移 | #469 双层判据唯一给新行号（判据见 2.3） | 重锚 `:N` |
| **R1 退场给由** | 路径/坐标 | 目标已删除 ∕ 退役——无唯一宿主 | 人工：给由 ∕ 迁指（语义映射）|
| **R2 用例号** | 用例号 | 用例删除 ∕ 改名——无机械映射 | 人工：删引 ∕ 重指 ∕ as-of |
| **R3 符号** | 符号·窄 | 符号无唯一新宿主 | 人工：改指 ∕ 重写 ∕ 给由 |
| **R4 折行受阻** | 行宽 | 无安全折点（单 token >300 ∕ 超长命令串） | 人工：改写 ∕ 拆行策略 |
| **R5 豁免决策** | 全族 | 是否加注记豁免 ∕ 迁移期引文标记（两族标记语义 = §4.2.9 ∕ §4.2.10） | 人工：加标 ∕ 不加标 |
| **R6 域外** | 全族 | 落他批在飞写域 ∕ 涉他批面（避让表见 2.5） | 人工：让先 ∕ 登记归批 |

**铁律句**：机判可清 ≠ 脚本批改——机械部分**只到清单生成**；落笔一律**逐处读认**（文档写作纪律不从本分流豁免）；先例 = `docs/desktop/design/PROJECT.md` 变更记录「两行超 300 ⇒ 分句断行，零语义」。
**消解序**：先 M 后 R；R 类逐条给由（三态：改指 ∕ 退场给由 ∕ as-of——沿 doc-dangling-sweep 二分先例）。

**（c）两清单形状**（计数分列——D3）

- **清单 A · 机判可清（机器生成 · 落批档 §5 附块）**：
  `# | 族 | 位置 file:line | 锚 | 类（M1–M3）| 新值（折点 ∕ 新宿主 ∕ 新行号）| 判据证据（解析命中 ∕ 折点偏移）| 状态`
- **清单 B · 人工（人写）**：
  `# | 族 | 位置 | 语义问题（一句话）| 候选处置（2–3 项）| 依据 ∕ 先例 | 裁定 | 状态`；来源 = A 表 R 类转入 + R6 类。
- 计数报法：`悬空 —— 机判 M 条 ∕ 人工 R 条（分母 = 基线逐字读数）`；行宽同法；两表**分别计数**（不得合计掩盖）。

**（d）清单 A 生成定义（修正轮补——承 #469 探针同规格）**

- **载体**：批次本地探针 `.thincoder/tmp/2026-09-29-doc-check-face-listA.mjs`（拟名 · 零落仓——`.thincoder/tmp/` 为探针停车场；承 2.3 探针同规格）。
- **复用引法（单源——禁内联复刻解析序）**：探针 `import` 引擎档消费既有谓词——需**导出面小扩**（`scripts/doc-check-anchors.mjs`：`resolveFile` ∕ `pathState` ∕ `buildBasenames` ∕ `codeSpanIdentifiers` 加 `export` 前缀——零语义改、行内改零行数变；落 = 工程工具面（父侧直改 + 门禁）；**同一导出缝供 #469 探针共用**）。M1 折行判定引 `doc-check-width.mjs` 的 `isTableRow`（既有导出）。
- **输入 = 开工基线逐字读数**（§5 存档：汇总五行 + 全部逐条行；探针按 `file:line` 逐条回读现盘行原文——**分母恒 = 基线**，禁以探针自跑读数替换）。
- **处理（逐条）**：① 行宽行 ⇒ M1 判定（现盘行原文 + 安全折点搜索〔分句边界：顿号 ∕ 分号 ∕ 逗号 ∕ 破折号 ∕ 空格〕+ **拼接逐字相等复验** ⇒ 折点偏移；无安全折点 ⇒ R4）；② 路径/坐标悬空行 ⇒ 引擎解析序 + 唯一 basename 找唯一新宿主——命中 ⇒ **M2**（新宿主）；命中 ∧ 带坐标尾 ⇒ 交 **M3** 双层判据（2.3（a）：就近标识符 × 目标档 N±2 窗）给唯一新行号；零命中 ∕ 多义 ⇒ **R1**；③ 用例号 ∕ 符号·窄 ⇒ **R2 ∕ R3**（机判面无——转人工）。
- **输出 = 清单 A 字段**（逐列与（c）表头逐字同）：`# | 族 | 位置 file:line | 锚 | 类（M1–M3）| 新值（折点 ∕ 新宿主 ∕ 新行号）| 判据证据（解析命中 ∕ 折点偏移）| 状态`；落 = 批档 §5 附块。
- **可比对性（再跑判据）**：同基线档输入 + 同盘面 ⇒ 同输出（分类 = 纯函数 + 盘面事实；复跑 = `node .thincoder/tmp/2026-09-29-doc-check-face-listA.mjs <基线存档>`）。

### 2.3 #469 引核行号坐标漂移复核 · 扫描方案

**（a）判据（双层·可机判形态）**——判据主体 = 引文 `file:line` 与目标档符号在场：

- **层 1 解析在场**：坐标 token（`path:N` ∕ `:N-M`）按 doc-check 路径解析序（仓根 → 锚域根 → 本档目录 → 锚域前缀剥离）解析到盘——未命中者已属「悬空」族（2.2 面），本方案只接**解析命中**者。
- **层 2 符号在场**：引文行的**就近码段标识符**（与坐标 token 距离 ≤40 字符、非路径形态码段、长度 ≥4）与目标档行域（**N±2 行窗**）比对，三态输出：
  - **在场**（窗内命中）⇒ 过；
  - **漂移候选**（目标档别处在场）⇒ 报告：`现 :N ⇒ 建议 :M`（M = 首现行）；
  - **失据候选**（档内零在场）⇒ 另族报告（符号改名 ∕ 删 ∕ 引例失真——语义判）。
- **不可判面**：行内无就近标识符者不进机判面（≈40% 坐标引核——人工随触碰 ∕ 标 as-of）。
- **判据性质 = 报告面（不入闸）**；假阳闸门 = 窄化参数（就近距离 ∕ 标识符长度）+ 逐条读认——探针样例含通用词族假阳（`includes` ∕ `handler`），改指前须人工过闸。

**（b）探针读数（as-of 2026-09-29 · 口径 = 探针简化解析序，**非引擎口径**——仅作量级证据）**：源域 = docs 扣批次 ∕ 归档 ∕ 台账两档（与机检同源）· 坐标引核 **4649** 处；带就近标识符 **2783**（≈60%）；其中 在场 ≈650 ∕ 漂移候选 ≈736 ∕ 失据候选 ≈253；余 1144 = 探针解析未命中（引擎解析序更宽——含唯一 basename 族——实际可判面更大）。⇒ 定位 = **报告面 + 逐条读认**，不作闸态。

**（c）与 doc-check 的关系（裁）**：**并入**——同引擎第五族（候选件 `scripts/doc-check-coords.mjs`）：
- 理由：解析序 ∕ 码段谓词 ∕ 围栏跳过 ∕ 注记集与 anchors 全同源（D2 单源——独立件 = 第二套解析，禁止）；
- 落地形（供另轮）：抽共享谓词（`resolveFile` ∕ `codeSpanIdentifiers` 上提）→ 新族模块 → main 集成同 2.4 形；**导出前缀探针轮先行**（落 = 工程工具面——见 2.2（d））；判据参数（窗口 ±2 ∕ 间距 40 ∕ 标识符 ≥4）v1 住模块常量（先例 = `DEF_PREDICATES`），声明化留候选；
- **本批不落引擎**（路由 = 工程工具面，另放行——上抛 2）；**本批 #469 实施 = 批次本地探针**（`.thincoder/tmp/` 零落仓）实现同判据 → 漂移清单 → doc 面逐处收正 ∕ 标 as-of。

**（d）随触碰纪律（人工面——实施轮落成纪律句，落点 = DOC-DISCIPLINE §1 D4 邻位）**：「触档复核」——凡触碰档面含引核坐标（`path:N`）者，随批复核该档坐标（机扫或抽读）并处置（重锚 ∕ 标 as-of）；as-of 形 = `（as-of YYYY-MM-DD）`（承 D4「行号仅作 as-of 参考」）。

**（e）验收读法（修正轮细化——可复核形态）**：

1. **全量在册**：机扫清单（漂移 ∕ 失据候选）逐条**处置记录**——四件：`位置 file:line | 现 :N ⇒ 建议 :M | 处置（重锚 ∕ as-of）| 复核（重锚 = 复读命中读数；as-of = 一行理由）`；零处置记录 = 未闭合。
2. **抽检（复核腿）**：样本 = **分层抽样（处置类型 × 文档域）——每域 ≥5 条 ∧ 全批 ≥30 条**；清单 <30 条 ⇒ 全查；选样规则 ∕ 随机种子在册。
3. **通过判据 = 零未标注不一致**：抽中行逐条读回——「重锚」行现 `file:line` 的 N±2 窗内就近符号 = 引文标识符；「as-of」行带 `（as-of YYYY-MM-DD）` + 理由。任一不符 ⇒ 不通过（扩检 = 全量读认后重验）。
4. **不可判面**（行内无就近标识符——≈40%）：条件式——随触碰复核（承（d）纪律句）+ as-of 兜底；不入抽检面（无判据可复）。

### 2.4 #546 doc-check 行数面增件 · 设计

**（a）落点逐处（file:line as-of 2026-09-29；新键名 = `lineCounts`；逐档现行行数 ∕ 预期增量 ∕ 分层判定 = 2.6 档价表）**

1. `thincoder-core/manifest.mjs:252`（`DEFAULT_MANIFEST.checkConfig`）⇒ 增键 **`lineCounts: []`**（默认空 = 惰性；嵌套键面 `:273`（`MANIFEST_SCHEMA.nestedKeys`，派生自默认档）自动收录——零另改；`fillDefaults` 数组键走透传支——现管线即容）。
2. `thincoder-core/manifest.mjs:292`（`validateManifest`）⇒ 增元素层校验：`lineCounts` 须为数组、各元素 = 对象 `{ doc: 非空串, section: 非空串 }`；违规 ⇒ `errors`（fail-closed——不静默跳过）。
3. `PROJECT-MANIFEST.json:24`（`checkConfig`）⇒ 增实值：
   `"lineCounts": [{ "doc": "docs/desktop/design/PROJECT.md", "section": "4.1 本端文件清单与行数预算" }]`
4. **新档** `scripts/doc-check-linecounts.mjs`（≈120 行）：`parseSectionRows(text, section)`（纯函数——节域 + 行语法）· `checkLineCounts(decls, { root })`（读档 + 实读计数 + 差异装配 + 行式异常）；`isTableRow` 引 `doc-check-width.mjs`（单源——不复制）。
5. `scripts/doc-check.mjs:56`（`CRITERIA_KEYS`）⇒ 5 项 ⇒ **6 项**（+`lineCounts`——AC-M8-6 同律：计数 = 列表长度）；`:64-69` 主循环 ⇒ 增行数面调用 + 输出行 + 状态行（**报告态**——见 KD-2）。**声明读取面 = 运行根（`--root`）所持 manifest 单读**——`lineCounts` 与 checkConfig 全键同面（`readManifest(root)` 一次——D2 单声明载体）；**执行域 = 运行根一次**（doc 路径按运行根解析——声明面与解析面同源；`--domain` 运行同此）。**子域声明处置 = 校验报错（fail-closed）**：bases 中每个 ≠ 运行根的 base 各做一次声明探查（`readManifest(base)` 可读 ∧ `checkConfig.lineCounts` 非空 ⇒ 报错行 + 非零退出——不生效、不静默；缺档 ∕ 不可读 ⇒ 无声明面可言，零动作；配置面错误——与 KD-2「差异 = 报告态」不抵）。由 = ① 行数面 = 全树级判据（与 scanDirs ∕ lineWidth ∕ anchors 同层——不做逐域异策）；② 声明落错面 = 假可供性，必须显形。空表 ∕ 未载 ⇒ 零动作（与 `exemptions: []` 同型既有语义——明文，非静默）。
6. 测试面 = **批次本地件** `docs/batches/2026-09-29-doc-check-face.test.mjs`（两栖形态——仓套件零改；夹具 temp 域零落仓——承 §3.4 条目 E；体量预估 ≈150～220 行——2.6 档价表行 5）；用例 = 正常（表值=实读 ⇒ 零输出）∕ 差异（三例已核：agent-host 260⇒262 · turn-driver 276⇒287 · views/chat.mjs 362⇒284——as-of 本设计轮）∕ 边界（多档行严格配对；`**≈N**` 预估跳过）∕ 错误（声明档缺 ∕ 节标题未命中 ⇒ 报告行；行式异常不静默）。
7. `docs/core/design/DOC-DISCIPLINE.md` §7 三处：① `:1294` 四档接口 ⇒ **五档**（+ `doc-check-linecounts.mjs` 行）；② `:1290` F2 判据键句补 `lineCounts`；③ **§7 自测护栏段（`:1310-1312`）载体收正（修正轮定形）**——现述载体 `thincoder-cli/test/doc-check.test.mjs`（记「已落 · 实读 340」）已随 2026-09-28 测试树全清令退场（现盘 `thincoder-cli/test/` = `run.mjs` ∕ `slow.mjs` + smoke 三枚——零 `.test.mjs`；实读）。**载体去向**：现役 = **批次本地件**（本批 = `docs/batches/2026-09-29-doc-check-face.test.mjs`；惯例出处 = `thincoder-core/prompts/discipline-engineering.md:65`——批内件随批归档 ∕ 仓套件不收集 ∕ `node --test docs/batches/<批>.test.mjs` 复跑）；**常驻自测载体重建 = 挂单测树重建面（在册 = 台账 #590**——「核测试树空清单 ⇒ durable 覆盖 = 0（重建时补用例）」· 处置 = 随开档轮；同族口径 = **#586**——「随可执行机检件 ∕ 批次本地件（全清令口径）∕ 单测树重建时恢复」）。**落定形式**：§7 收正句 = 「现役载体 = 批次本地件（批名）+ 常驻重建挂 #590 面」；收正后 §7 内零 `thincoder-cli/test/doc-check.test.mjs` 引用（历史归本档变更记录）。
8. `docs/desktop/design/PROJECT.md` §4.1（`:147`）⇒ 按差异清单逐行回填（as-of 实读值）+ 表头口径句（`:149`）补「行数面机检 = `checkConfig.lineCounts` 声明——doc-check 行数族」。

**（b）表行语法（抽取判据）**

- 节域 = `section` 声明值（去前导 `#` + trim）**逐字相等**的标题行 → 至下一同级或更高级标题行。
- 可数行 = 表格行；**文件** = 首格全部路径形态反引号码段（含 `/` 且带档扩展名）；**表值** = 表值格（第 2 格）**首个非 `≈` 加粗数字段**内的全部 `\d+`。
- 配对 = 文件数 = 数字数（1:1；多档行 `a · b` ∕ `**49 / 3**` 依法配对）；`**≈N**` = 预估 ⇒ 跳过（计「预估行」）；无数字 ⇒ 跳过（计「非数行」）；配对失败 ∕ 值形态不明 ⇒ **行式异常**报告行（不静默丢——D3）。
- 实读 = **内容行数（文末换行不计）**：`split("\n")` 末元素为空 ⇒ 减一（现盘抽样 12 档全带尾换行 ⇒ 两式同值——稳健式仍取）；档不在盘 ⇒ 差异类「盘无档」。

**（c）输出形**（报告态——不入闸）：

```
报告 行数 <doc>:<line> `<file>`（表 N ⇒ 实读 M，Δ±d）
报告 行数 <doc>:<line>（行式异常：<原因>）
行数面：差异 N 条（比对 M 行 · 跳过 K 行〔预估 J ∕ 非数 L〕）——报告态，回填工单即本清单
```

差异行三要素（doc:line ∕ 表值 ∕ 实读值）= 可回填工单最小集；「生成完整表体」不落 v1（说明列语义不可机器再生——候选留档）。**验收读法**：一条命令输出 §4.1 差异 = 0（或差异清单在册为工单）。

### 2.5 在飞批写域避让表（as-of 2026-09-29 17:1x——**届盘重读为强义务**）

**规则句**：① 本表 as-of 时点；② #435 ∕ #469 实施轮开工前**届盘重读全部在飞批 §2 ∕ §5**（逐档实读写域——§2 未落者以开工日为准）；③ 在飞写域内档**不进本批清扫面**（本批绕开，落他批——R6 类处置；**R6 件逐条登记**〔批名 ∕ 台账号〕——构成 2.7 #435 归零读法的比对排除集）；④ 清扫落定后**复跑 doc-check 取新基线**（并发读数竞态防护）。

| 批（`docs/batches/`） | 主题 | docs 写域（声明面；§2 未落者注明） |
|---|---|---|
| `2026-09-29-batch-mechanics.md` | 批次机制面 | §2 未落 ⇒ 届盘重读 |
| `2026-09-29-core-env-residuals.md` | 核 env 残面 | §2 未落 ⇒ 届盘重读 |
| `2026-09-29-desktop-extension-engine-face.md` | 桌面扩展引擎面 | §2 未落 ⇒ 届盘重读 |
| `2026-09-29-desktop-rebuild-fidelity.md` | 桌面重建保真族（#604–#608） | `docs/render-core/design/RENDER-CORE.md` ∕ `docs/desktop/design/{RENDERER,UI,PROJECT}.md` ∕ `docs/vsc/design/WEBVIEW.md` |
| `2026-09-29-desktop-residuals-round3.md` | 桌面残余 r3（#581 等） | §2 未落 ⇒ 届盘重读 |
| `2026-09-29-doc-backfill.md` | 文档回填族（#560 ∕ #594 ∕ #598 ∕ #612）——**与 #435 ∕ #469 清扫面高度重叠** | 靶档（台账点名）：`docs/RELEASE.md` ∕ `thincoder/README.md` ∕ `docs/core/design/ARCHITECTURE.md` ∕ `docs/cli/design/TUI.md` ∕ `docs/vsc/design/WEBVIEW-PROTOCOL.md` ∕ `docs/desktop/design/UI.md` ∕ `docs/core/design/MULTI-INSTANCE-COLLAB.md`；§2 未落 ⇒ 届盘重读 |
| `2026-09-29-doc-check-face.md` | **本批** | 本档 + §2 落点表 |
| `2026-09-29-i18n-split.md` | 桌面 i18n 拆分（#614） | §2 未落 ⇒ 届盘重读 |
| `2026-09-29-perf-residuals.md` | 性能尾账（#619） | §2 未落 ⇒ 届盘重读 |
| `2026-09-29-residuals-round2.md` | 残 r2（#579 ∕ #585 ∕ #586 ∕ #589 ∕ #590 ∕ #593） | `docs/vsc/design/VSC-DEBT.md` ∕ `docs/vsc/design/WEBVIEW.md` ∕ `docs/core/design/{MEMORY,CONTEXT-COMPACTION,SETTINGS-TOOL,LEDGER,MANIFEST,CORE-UNIFICATION,AGENT-LOOP,AGENT-LOOP-UPSTREAM,TURN-CAP-CONTINUE}.md` ∕ `docs/core/requirements/SETTINGS-TOOL.md` ∕ `docs/cli/design/ACP-CLIENT.md` ∕ `docs/desktop/design/{PROJECT,UI,SHELL}.md` |
| `2026-09-29-structure-split-round.md` | 结构拆分轮 | §2 未落 ⇒ 届盘重读 |

### 2.6 受影响文件与测试面

- **本设计轮：零改动**（除本 §2 记录）。
- **#435 实施（doc 面）**：清扫面动态（清单 A ∕ B 生成——不静态列举）；as-of 基线分布：用例号族 100 条 ∕ 路径·坐标族 54 ∕ 符号·窄族 7 ∕ 行宽 77 行——跨 core ∕ cli ∕ vsc ∕ desktop ∕ render-core 五部分文档域。
- **#469 实施（doc 面）**：漂移候选清单（探针产出——2.3（b）读数）+ 逐处处置。
- **#546 实施（工程工具面）**：2.4（a）八处落点；测试 = 批次本地件 `docs/batches/2026-09-29-doc-check-face.test.mjs`（正常 ∕ 差异 ∕ 边界 ∕ 错误——见 2.4 落点 6）。
- **#546 文档面随动**：`docs/desktop/design/PROJECT.md` §4.1 回填 + 口径句 ∕ `DOC-DISCIPLINE.md` §7 收正（笔权上抛 3）。

**#546 逐档档价（修正轮补 · 实读 as-of 2026-09-29 17:1x · 内容行口径）**：

| # | 档 | 现行行数 | 预期增量 | 分层判定（>300 ∕ >500） |
|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | **482** | +6±3（键行 + 元素层校验块） | **>300 存量**（<500 硬限）⇒ 拆分评审：**本批不拆**（增量小、非结构改）+ 触发 = 越 500 硬限前 ∕ 该档下次实质改动；拆分候选（登记不执行）= 校验族（`MANIFEST_SCHEMA` ∕ `validateManifest`）外提 `manifest-validate.mjs`（re-export 保 import 面——定形随 #620 面）；次险档在册 = 台账 #620（下一结构轮） |
| 2 | `scripts/doc-check.mjs` | **75** | +8±3（判据键 +1 · 行数面调用 ∕ 输出 · 非根 base 声明探查） | ≤300——免档位注 |
| 3 | `PROJECT-MANIFEST.json` | **38** | +1～3（`lineCounts` 实值） | ≤300（数据档）——免档位注 |
| 4 | `scripts/doc-check-linecounts.mjs`（拟新增） | 0 | ≈120 | ≤300——免档位注 |
| 5 | `docs/batches/2026-09-29-doc-check-face.test.mjs`（拟新增 · 批次本地件） | 0 | **≈150～220**（用例 ≈10–12 条：正常 ∕ 差异 ∕ 边界 ∕ 错误——体量预估 · 同类批内件实读：`parity-b8-ipc.test.mjs` 183 ∕ `core-hygiene.test.mjs` 159） | ≤300——免档位注 |
| 6 | `docs/core/design/DOC-DISCIPLINE.md`（落点 7） | — | — | 文档档——零标注义务（不触发拆分；DOC-DISCIPLINE §3.7 口径：两列填 `—`，行保留） |
| 7 | `docs/desktop/design/PROJECT.md`（落点 8） | — | — | 文档档——零标注义务（同上） |

附（#435 ∕ #469 探针轮另触）：`scripts/doc-check-anchors.mjs`（**322** · >300 存量）——导出面小扩 = 行内 `export` 前缀 ×4（**零行数变**）⇒ 拆分评审：**不拆**（一行级、零结构改）+ 触发 = 越 500 硬限 ∕ 该档下次实质改动；拆分候选（登记不执行）= 谓词族（`codeSpanIdentifiers` ∕ `resolveFile` ∕ `pathState`）外提 `doc-check-predicates.mjs`（随引擎第五族轮定形）。

### 2.7 验收对照（回指本批三链）

| # | 验收读法（机检化） |
|---|---|
| #435 | 开工基线在册（逐字存档——**复核读法唯一分母**；旧读数 40 ∕ 21 ∕ 34 ∕ 48 组已作废，见 2.2(a)4–5）+ 两清单在册；**归零读法（条件式——分母 = 开工基线 161 ∕ 77）**：① 本批清扫面逐条闭合（清单 A ∕ B 逐条处置在册）；② 复核读数（`node scripts/doc-check.mjs` 零参）：悬空 = **0**（无 R6 件在场）∥ 悬空集合 **⊆ R6 登记集**（域外已登记件——逐条附批名 ∕ 台账号；「域外零条」即通过）——R6 件随其所归批落定后复跑收口。**R5 加标件计法**：加标后行移入引擎列报族（注记豁免 ∕ 拟新增 ∕ 迁移期引文——列报 · 不入闸）⇒ 复核只读「悬空」栏；不加标者照常计为悬空（须处置）。行宽同法（R4 = 改写处置；R6 同逻辑）。|
| #469 | 全扫清单产出在册（漂移 ∕ 失据候选逐条处置记录——2.3（e）1 四件）；抽检 = 分层样本（全批 ≥30 条 ∧ 每域 ≥5；<30 全查）· 通过判据 = **零未标注不一致**（2.3（e）2–3）；不可判面（≈40%）= 条件式（随触碰 + as-of 兜底）|
| #546 | `checkConfig.lineCounts` 声明面生效（改声明 ⇒ 判据随变）；一条命令输出 §4.1 差异 = 0（或差异清单在册为工单）|
| 本设计轮 | 三件设计全备 ✓ · #546 落点逐处（文件 + 行号 + 键名）✓ · 档价表 ✓ · 避让表 ✓ · 零改动（本段记录外）✓ · 评审修正轮（#17 八条全受理）就地落毕 ✓ |

### 2.8 关键决策（含被否候选）

- **KD-1**（#469 载体）：并入 doc-check（候选第五族 `doc-check-coords.mjs`）+ 本批走批次本地探针。被否：独立件（解析序 ∕ 码段谓词双源——禁）；不落引擎（判据失载）。
- **KD-2**（行数面闸态）：v1 = **报告态（不入闸）**；升闸 = 一行级、另裁（上抛 1）。被否：首落即闸——存量回填未成 ⇒ 全仓常红，与 #435 清账序相抵。
- **KD-3**（表值提取）：**首个非 `≈` 加粗数字段**（实读值优先于预估）。被否：末位取数（反例 = `views/chat.mjs` 行末位为预估 `**≈265**`）；宽松数字提取（实读日期串误取）。
- **KD-4**（实读口径）：**内容行数（文末换行不计）**——`split` 末空减一。被否：read 计法（+1——与 §4.1 表头口径句（`:149`）相抵）。
- **KD-5**（机判可清界定）：≠ 脚本批改——机械部分只到清单生成，落笔逐处读认。被否：脚本批改（文档写作纪律禁）。
- **KD-6**（Δ 归因）：逐行集合差、禁叙述归因（承 #435 教训）。
- **KD-7**（新键名）：**`lineCounts`**。被否：`lineBudget`（偏预算语义）· `docCounts`（实现视角）。

### 2.9 上抛（请父侧裁）

1. **行数面闸态**：v1 报告态维持 ∨ 升闸（一行级改动）——升闸时机 = §4.1 回填 = 0 之后？
2. **#469 引擎族落地路由**：候选第五族（`doc-check-coords.mjs`）落 = 工程工具面（父侧 ∕ 另放行）——本批不落，设计在册。
3. **PROJECT.md §4.1 回填 + 口径句笔权**：doc 面 eng-designer ∥ #546 父侧轮同笔——请定。
4. **避让冲突**：doc-backfill 批与 #435 ∕ #469 清扫面重叠（七档点名单）——建议顺序 = doc-backfill 落定后跑本批清扫（或清扫绕开其声明档）。
5. **#435 ∕ #469 实施轮派单**（本设计轮后另派——含基线复取）。
6. **只报（观察项）**：`DOC-DISCIPLINE.md:1310-1312` 自测护栏段载体的死指针（`thincoder-cli/test/doc-check.test.mjs` 已不在盘）——归 #546 文档面同笔收正（已列 2.4 落点 7）。

**零改动声明**：本设计轮除本 §2 记录外零文件改动（未触碰任何设计档 ∕ 码面 ∕ manifest）。设计全文住本段；后续轮按 2.1 落点表逐面落笔。

### 2.10 修正块（修正轮 · 评审 #17 轮次 1 八条全受理 · §2 就地修正）

**口径**：本块 = 修正轮记录；§2.2–2.7 正文**就地收正**（逐号落点见下表——同轮已落，非待办）；本档外零文件改动（产品码 ∕ 他档零改 · §3 零改）。**修正轮读数（届盘实读 as-of 2026-09-29 17:1x · 内容行口径）**：`manifest.mjs` **482** · `doc-check.mjs` **75** · `doc-check-anchors.mjs` **322** · `PROJECT-MANIFEST.json` **38**；探针场 `.thincoder/tmp/` 在位；批内件惯例出处实读 = `thincoder-core/prompts/discipline-engineering.md:65`。

| 号 | 级 | 处置（全受理） | 落点（就地） |
|---|---|---|---|
| 1 | 🟡 | 补 #546 逐档档价表（现行行数 + 预期增量 + 分层判定 + 拆分候选登记）＋测试件体量预估（同类批内件实读）；§2.4（a）首加交叉引 | §2.6 档价表 ∕ §2.4（a）首 |
| 2 | 🟡 | 补（d）清单 A 生成定义（载体 ∕ 复用引法〔导出面小扩〕∕ 输入 = 开工基线 ∕ 输出 = 清单 A 字段 ∕ 处理 ∕ 再跑判据） | §2.2（d） |
| 3 | 🟡 | 落点 5 写入声明读取面（运行根单读）＋子域声明处置（校验报错 · fail-closed）＋由；执行域 = 运行根一次 | §2.4（a）5 |
| 4 | 🟡 | #435 行改归零读法（分母 = 开工基线 + R5 ∕ R6 排除集计法 + 定序条件式）；避让表规则 ③ 补 R6 逐条登记 | §2.7 ∕ §2.5 |
| 5 | 🟡 | 验收读法落可复核形态（处置记录四件 ∕ 样本量 + 选样规则 ∕ 通过判据 = 零未标注不一致）；§2.7 #469 行同步 | §2.3（e）∕ §2.7 |
| 6 | 🔵 | 补旧读数对齐行（40 ∕ 21 ∕ 34 ∕ 48 组口径未存证 ⇒ 整组作废）＋验收分母 = 开工基线（161 ∕ 77 级） | §2.2（a）4–5 |
| 7 | 🔵 | 「机判可清四项 M1–M3」⇒「三项」（与表 M1–M3 一致——表即判据） | §2.2（b）头句 |
| 8 | 🔵 | 落点 7 写入载体去向（现役 = 批次本地件 + 惯例出处 `discipline-engineering.md:65`）＋常驻重建在册编号（#590 · 同族 #586） | §2.4（a）7 |

**披露（随修 · 2 项）**：① 探针复用引法引入 `scripts/doc-check-anchors.mjs` 导出面小扩（4 谓词 `export` 前缀 · 零语义——落 = 工程工具面，随 #435 ∕ #469 实施轮）；② doc-check 自测载体重建无专条在册（挂 #590 面）——如需专条请父侧登记。

**零改动声明（修正轮）**：除本档 §2 外零文件改动。

### 2.11 文档面实施轮（eng-designer · 2026-09-29）——落点 7–8 + 同族追加（就地落毕）

**收口读数（验收 ③）**：`node scripts/doc-check.mjs`（零参 · cwd = 仓根）⇒ **行数面差异 0 条**（比对 129 行 · 跳过 11 行〔预估 3 ∕ 非数 8〕）。

**落笔清单（逐处 → file:line 落值；行号 = 改后实读）**：

1. `docs/core/design/DOC-DISCIPLINE.md` §7 —— `:1290` F2 判据键句补 `lineCounts`；`:1294` **四档接口 ⇒ 五档接口**；`:1300`（新增行）`doc-check-linecounts.mjs` 接口行；`:1312` 自测护栏载体收正（**现役 = 批次本地件 `docs/batches/2026-09-29-doc-check-face.test.mjs` + 常驻重建挂台账 #590 面**）；`:1332` 变更记录一行。**收正后 §7 内零 `thincoder-cli/test/doc-check.test.mjs` 引用**（grep 实核；历史归本档变更记录 = 已落）。
2. `docs/desktop/design/PROJECT.md` §4.1 —— `:150` 表头口径句补「**行数面机检 = `checkConfig.lineCounts` 声明（`PROJECT-MANIFEST.json`）——doc-check 行数族**」；**28 行**按差异清单回填（回填前行号 ⇒ 表值⇒实读）：`:163` 322⇒330 · `:164` 260⇒262 · `:175` 333⇒319 · `:186` 152⇒181 · `:187` 75⇒107 · `:206` 293⇒299（余 7 ⇒ 余 1 随算） · `:207` 246⇒264 · `:209` 130⇒162 · `:211` 71⇒72 · `:216` 190⇒191 · `:217` 45⇒40 · `:218` 23⇒30 · `:223` 194⇒199 · `:227` 328⇒332 · `:231` 362⇒290（在飞改档——窗口内二次复读收正） · `:236` 75⇒78 · `:238` 93⇒103 · `:239` 217⇒300 · `:242` 262⇒154 · `:243` 115⇒130 · `:264` 154⇒156 · `:268` 176⇒230 · `:272` 57⇒54 · `:274` 177⇒205 · `:277` 32⇒34 · `:282` 287⇒299 · `:287` 71⇒48 · `:288` 81⇒128。
3. 同族追加（#37 披露清单）—— `docs/core/design/MANIFEST.md`：`:53` ∕ `:96`（checkConfig 四键 ⇒ **五键**）· `:99`（补 `checkConfig.lineCounts` 元素层形态）· `:641` 变更记录；`docs/core/design/ENGINEERING-MODE-V2.md`：`:500`（AC3 四子键 ⇒ **五子键**）· `:143`（E1 JSON 补 `"lineCounts": []`）· `:533` 变更记录；`docs/core/design/DOC-SYSTEM.md`：`:244`（判据项 5 ⇒ **6** + 指针 `:21 ⇒ :24`）· `:245`（四档接口段 ⇒ **五档接口段**）· `:396` 变更记录。

**读数口径披露**：开工复读 = 差异 **28 条**（比对 129 行）——较 §5 ∕ §6 记 26 条（比对 125 行）多（在飞批改档致动）；本轮回填一律以命令输出实读值为准；收口前 `thincoder-desktop/renderer/views/chat.mjs` 窗口内再动（284 ⇒ 290）⇒ 二次回填后复跑归零。

**披露（只报不裁）**：① §4.1 散文册四处陈旧数（未列本批清单、未扫）：`:299` `i18n-views.mjs` **328**（现 332）· `:302` `ipc.mjs` **322**（现 330）· `:303` `agent-bridge.mjs` **318**（现 319）· `:305` `chat-tool.mjs` **299**（现 300）；② §7 外 `thincoder-cli/test/doc-check.test.mjs` 引用族仍在（本档 `:119` ∕ `:340-341` ∕ `:516-517` ∕ `:800` ∕ `:822` ∕ `:1119-1120` ∕ `:1137-1138` ∕ `:1145`；档外 = `CONFIG.md:149` · `CLI-DEBT.md:58 ∕ :101` · 需求档 `ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:39`）——归 #435 ∕ #469 扫面；③ 同族坐标项（未列本批）：`DOC-DISCIPLINE.md:928`（scanDirs 指针 `:21` ⇒ 现 `:25`）· `DOC-MIGRATION.md:313`（`:20-33` ⇒ 现 `:24-38`）· `PROJECT.md:384`（`:22-24`）；④ `ENGINEERING-MODE-V2.md:153` 校验句未含元素层形态（与 `MANIFEST.md:99` 收正后不同步——未列未改）；⑤ `PROJECT.md:231` 行内预估「≈265」与现实读 290 相抵（归属 = 更新纪律收核批 §4.2 行）。

**零触声明**：产品码 ∕ 工具面零触（`scripts/**` ∕ `PROJECT-MANIFEST.json` 未动）；除上列五档外零文件改动。轮记录 = 本段（分段白名单：eng-designer = §2）。

### 2.12 #469 引核行号漂移复核 · 实施轮（eng-designer · 2026-09-29）——CLI 域全量落定（域 1／5）

**轮次** = initial（#469 实施轮）。**父侧裁（执行口径）**：域级完整推进（cli → desktop → vsc → render-core → core）＋全量清单在册＋余域按域拆后继轮（同批新轮）；「低置信批量改指不可行（改错 > 不改）」维持；as-of 兜底 = 设计 §2.3(e)④ 既定（不算简配）。**新增处置类（披露）**：①「假阳核销」（探针 near-id 误取——坐标实核正确，零改）；②「as-of（已在位）」（行带时点锚 ∕ 记录面——沿 B 类零触碰先例，零改）。

**探针读数（v2 · as-of 2026-09-29 · 判据 = §2.3(a) 双层 · 口径 = 引擎谓词单源）**：源域 **152 档**（清扫面 145 ∕ R6 绕开 7）· 坐标引核 **4153** · 带就近标识符 **2099**（≈51%）· 解析命中 4035 ∕ 未命中 118（悬空族 · #435 面）· 判面：在场 803 · 漂移候选 903 · 失据候选 345 · 多义 1。

**单源缝（本轮回填）**：设计面导出缝（`scripts/doc-check-anchors.mjs` 4 谓词 `export` 前缀——工程工具面 ∕ 父侧）**本轮已落** ⇒ 探针已改**直 import 真缝**消费（源等同物化退为兜底，见探针档头）。

**cli 域处置（76 行 · 四件全量在册 = §2.13）**：重锚 23 · as-of（加标）32 · as-of（已在位）7 · 假阳核销 14。落笔 = **49 处行内改**（零行数变；含同值 live 同拍 2 处：TUI.md `:420` ∕ `:422`）；产品码 ∕ 他域 ∕ R6 档零触。

**验收四件（本轮读法）**：
1. **处置记录全量在册** = §2.13（76/76，零缺行）；
2. **抽样（复核腿）** = cli 域 24 条（分层：重锚 10 ∕ as-of 加标 8 ∕ 假阳 4 ∕ 重锚残留 2）——**24/24 PASS**（明细 = §2.14；选样规则 = 非随机——处置类型分层 + 各类序位取样，种子不适用）；
3. **零未标注不一致** = 抽样行逐条读回通过（重锚行 = 新 N±2 窗内标识符命中；as-of 行 = 标记 `（as-of 2026-09-29）` 在位）；
4. **doc-check 集合差（`node scripts/doc-check.mjs` 零参）** = **本批写域零新增红**。新增 19 红行**全部落 R6 档**（`docs/desktop/design/PROJECT.md` 14 · `docs/render-core/design/RENDER-CORE.md` 5——在飞批并发写入所致，非本席笔）；悬空 **161 ⇒ 161**；行数面差异 0 ⇒ 24（同上归因 R6 批 PROJECT.md 并发写入）。

**披露（只报不裁）**：① **迁档候选类**（跨档迁移坐标——「重锚 ∕ as-of」二元不足承载）：resumeSlot（bin → command-interactive.mjs:122）· 合并落文本（agent-turn:84-87 → queued-pickup.mjs:30-32）· bin 拆档族（:452 ∕ :402-406 ∕ :172）· ACP 模块分家族（acp.mjs → acp/*.mjs）· waitForSettleOrWake（→ core/suspension.mjs:135/:250）——全部已按 as-of 加标 + 表内标注，建议后继轮给「改指」处置面；② **探针残留瑕三类**（range-head 窗差——区间起点 ±2 检查 ∕ `$` 词界误判 ∕ 多 token 近邻误取）——6 条重锚残留已逐条读认（§2.13 R1–R6），供 #469 引擎族参数面候选；③ **同档裸坐标**（`同档 :N` 形态）不入机扫域——本批零动、登记；④ 同值坐标：TUI.md `:871`（记录面）与 `:885` 记录行零改——记录面冻结纪律。

### 2.13 #469 · cli 域处置记录（76 行 · 四件逐条）

`位置（file:line）| 现⇒建议 | 处置 | 复核（重锚 = 复读命中读数 ∕ as-of = 理由）`

| # | 位置 file:line | 现 ⇒ 建议 | 处置 | 复核 |
|---|---|---|---|---|
| 1 | docs/cli/design/TUI.md:72 | :27 ⇒ （失据） | 假阳核销 | 指称「父段先写 loading 行」= :27 writeLoadingLine 在位（实读） |
| 2 | docs/cli/design/TUI.md:72 | :322 ⇒ （失据） | as-of（加标） | bin 拆分后 resumeSlot 调用迁 command-interactive.mjs:122-120——跨档（迁档候选） |
| 3 | docs/cli/design/TUI.md:73 | :39 ⇒ :8 | 假阳核销 | writeStartupSequence 调用点 = :39（实读） |
| 4 | docs/cli/design/TUI.md:414 | :244 ⇒ :21 | 重锚 | ⇒:310（复读：命中） |
| 5 | docs/cli/design/TUI.md:414 | :296 ⇒ :18 | 重锚 | ⇒:174 (同值 :420 ∕ :422 同拍收正；:871 记录面零改)（复读：命中） |
| 6 | docs/cli/design/TUI.md:414 | :142 ⇒ :7 | 重锚 | ⇒:212-225（复读：命中） |
| 7 | docs/cli/design/TUI.md:415 | :235 ⇒ :6 | 重锚 | ⇒:257-279（复读：命中） |
| 8 | docs/cli/design/TUI.md:416 | :219 ⇒ :7 | 重锚 | ⇒:224-228（复读：命中） |
| 9 | docs/cli/design/TUI.md:439 | :55 ⇒ :23 | 假阳核销 | 判据先例 discardable = :54-55 逐字在位（实读） |
| 10 | docs/cli/design/TUI.md:444 | :50 ⇒ （失据） | 假阳核销 | 同键 = :50 在位（实读） |
| 11 | docs/cli/design/TUI.md:445 | :145 ⇒ :148 | 假阳核销 | releaseLine 块（jsdoc :145 + def :148）在位——范围头窗差（range-head 假阳） |
| 12 | docs/cli/design/TUI.md:450 | :142 ⇒ :48 | 重锚 | ⇒:212-225（复读：命中） |
| 13 | docs/cli/design/TUI.md:452 | :194 ⇒ :2 | 重锚 | ⇒:203（复读：命中） |
| 14 | docs/cli/design/TUI.md:457 | :340 ⇒ :40 | 重锚 | ⇒:357-359（复读：命中） |
| 15 | docs/cli/design/TUI.md:470 | :187 ⇒ :2 | 重锚 | ⇒:202（复读：命中） |
| 16 | docs/cli/design/TUI.md:470 | :410 ⇒ :4 | 重锚 | ⇒:441（复读：命中） |
| 17 | docs/cli/design/TUI.md:496 | :13 ⇒ （失据） | 假阳核销 | done-in-pool 保留规则注释 = :13-14 逐字在位（实读） |
| 18 | docs/cli/design/TUI.md:525 | :147 ⇒ :2 | 重锚 | ⇒:163-165（复读：命中） |
| 19 | docs/cli/design/TUI.md:527 | :180 ⇒ :6 | 重锚 | ⇒:189-199（复读：命中） |
| 20 | docs/cli/design/TUI.md:582 | :226 ⇒ :237 | 重锚 | ⇒:233-237（复读：命中） |
| 21 | docs/cli/design/TUI.md:598 | :227 ⇒ :14 | 重锚 | ⇒:235-243（同句 :599 同拍）（复读：命中） |
| 22 | docs/cli/design/TUI.md:633 | :380 ⇒ :363 | 假阳核销 | _skipDimFold 行 = :380 在位（实读） |
| 23 | docs/cli/design/TUI.md:636 | :121 ⇒ :135 | 重锚 | ⇒:125-176（复读：命中） |
| 24 | docs/cli/design/TUI.md:651 | :84 ⇒ :357 | as-of（加标） | 合并落文本机制迁 queued-pickup.mjs:30-32（迁档候选） |
| 25 | docs/cli/design/TUI.md:653 | :308 ⇒ :9 | 重锚 | ⇒:198-201（复读：命中） |
| 26 | docs/cli/design/TUI.md:724 | :41 ⇒ :13 | 重锚 | ⇒:48-50（复读：命中） |
| 27 | docs/cli/design/TUI.md:726 | :54 ⇒ :36 | 重锚 | ⇒:59-60（复读：命中） |
| 28 | docs/cli/design/TUI.md:727 | :132 ⇒ :380 | 假阳核销 | 重置点 = :132 `state.lastOutputAt = Date.now()`（实读） |
| 29 | docs/cli/design/TUI.md:727 | :61 ⇒ :36 | 重锚 | ⇒:66-92（复读：命中） |
| 30 | docs/cli/design/TUI.md:728 | :114 ⇒ :47 | 假阳核销 | 重置单点 = :114 在位（实读） |
| 31 | docs/cli/design/TUI.md:729 | :49 ⇒ :7 | as-of（加标） | 「现盘 2000」已随修过期（现盘 1000）——修前口径 |
| 32 | docs/cli/design/TUI.md:730 | :148 ⇒ （失据） | 假阳核销 | 回合尾清理块 :146-149 ≈ :148（实读） |
| 33 | docs/cli/design/TUI.md:866 | :376 ⇒ （失据） | as-of（已在位） | 变更记录行（2026-09-18）——记录面零改 |
| 34 | docs/cli/design/TUI.md:885 | :180 ⇒ :43 | as-of（已在位） | 评审处置记录行——记录面零改 |
| 35 | docs/cli/design/ACP-CLIENT.md:133 | :99 ⇒ :7 | as-of（加标） | 拆已落（现档头载四模块分家）——原 368 行单体已不存在 |
| 36 | docs/cli/design/ACP-CLIENT.md:322 | :44 ⇒ :101 | as-of（加标） | 识别形已演化（relaySubagentEventToken 单点——迁档候选） |
| 37 | docs/cli/design/ACP-CLIENT.md:323 | :99 ⇒ :114 | 重锚 | ⇒:114-115（复读：命中） |
| 38 | docs/cli/design/ACP-CLIENT.md:325 | :208 ⇒ :63 | as-of（加标） | 评审注记行——发射点未逐点重定位（行级一标） |
| 39 | docs/cli/design/ACP-CLIENT.md:325 | :296 ⇒ :140 | as-of（加标） | 评审注记行——发射点未逐点重定位（行级一标） |
| 40 | docs/cli/design/ACP-CLIENT.md:325 | :337 ⇒ :2 | as-of（加标） | 评审注记行——发射点未逐点重定位（行级一标） |
| 41 | docs/cli/design/ACP-CLIENT.md:325 | :262 ⇒ :13 | as-of（加标） | 评审注记行——发射点未逐点重定位（行级一标） |
| 42 | docs/cli/design/ACP-CLIENT.md:325 | :228 ⇒ :4 | as-of（加标） | 评审注记行——发射点未逐点重定位（行级一标） |
| 43 | docs/cli/design/ACP-CLIENT.md:325 | :359 ⇒ :2 | as-of（加标） | 评审注记行——发射点未逐点重定位（行级一标） |
| 44 | docs/cli/design/ACP-CLIENT.md:325 | :143 ⇒ :2 | as-of（加标） | 评审注记行——发射点未逐点重定位（行级一标） |
| 45 | docs/cli/design/ACP-CLIENT.md:326 | :98 ⇒ :5 | as-of（加标） | 评审注记行——同上（行级一标） |
| 46 | docs/cli/design/ACP-CLIENT.md:326 | :162 ⇒ :4 | as-of（加标） | 评审注记行——同上（行级一标） |
| 47 | docs/cli/design/ACP-CLIENT.md:327 | :188 ⇒ :201 | 重锚 | ⇒:201-207（复读：命中） |
| 48 | docs/cli/design/ACP-CLIENT.md:368 | :5 ⇒ :84 | as-of（加标） | D17 注记——坐标未逐点复核（登记） |
| 49 | docs/cli/design/ACP-CLIENT.md:370 | :106 ⇒ :66 | as-of（加标） | D19 修已落（能力位守卫）——cited 为修前形态；加标后出机判面（near-id 距超出） |
| 50 | docs/cli/design/ACP-CLIENT.md:450 | :140 ⇒ :8 | as-of（加标） | G1-a finding 期坐标（authMethodsFor 已落 client-caps） |
| 51 | docs/cli/design/ACP-CLIENT.md:452 | :112 ⇒ :43 | as-of（加标） | G1-c finding 期坐标（闩锁已撤——D15） |
| 52 | docs/cli/design/ACP-CLIENT.md:453 | :402 ⇒ :40 | as-of（加标） | bin 拆档（分发 = command-table——迁档候选） |
| 53 | docs/cli/design/ACP-CLIENT.md:466 | :172 ⇒ :142 | as-of（加标） | bin 拆档尾（迁档候选） |
| 54 | docs/cli/design/ACP-CLIENT.md:493 | :141 ⇒ （失据） | as-of（加标） | G2-1 finding 期坐标（已收正 handlers-*） |
| 55 | docs/cli/design/ACP-CLIENT.md:496 | :137 ⇒ :8 | as-of（加标） | G2-4 finding 期坐标 |
| 56 | docs/cli/design/ACP-CLIENT.md:497 | :184 ⇒ （失据） | as-of（加标） | G2-5 finding 期坐标（sessionId 键已收正） |
| 57 | docs/cli/design/ACP-CLIENT.md:498 | :194 ⇒ :83 | as-of（加标） | G2-6 finding 期坐标（params.prompt 已收正） |
| 58 | docs/cli/design/ACP-CLIENT.md:499 | :234 ⇒ （失据） | as-of（加标） | G2-7 finding 期坐标 |
| 59 | docs/cli/design/ACP-CLIENT.md:500 | :184 ⇒ （失据） | as-of（加标） | G2-8 finding 期坐标 |
| 60 | docs/cli/design/ACP-CLIENT.md:521 | :235 ⇒ :106 | as-of（加标） | 迁 handlers-slots.mjs:44-47（迁档候选） |
| 61 | docs/cli/design/ACP-CLIENT.md:529 | :104 ⇒ :112 | as-of（加标） | D19 修已落——cited 为修前「无条件」形态 |
| 62 | docs/cli/design/ACP-CLIENT.md:541 | :70 ⇒ :39 | 重锚 | ⇒:39-45（复读：命中） |
| 63 | docs/cli/design/ACP-CLIENT.md:615 | :194 ⇒ :9 | as-of（加标） | G6 finding 期坐标（读取位置已收正） |
| 64 | docs/cli/design/ACP-CLIENT.md:616 | :168 ⇒ （失据） | as-of（加标） | G7 迁 handlers-session.mjs:163-164（迁档候选） |
| 65 | docs/cli/design/ACP-CLIENT.md:647 | :21 ⇒ :5 | as-of（已在位） | 变更记录行（2026-09-29 residuals-round2）——记录面零改 |
| 66 | docs/cli/design/TUI-INPUT-BOX.md:100 | :226 ⇒ :5 | as-of（已在位） | 扩面注记块（2026-09-22）——块带时点锚（B 类） |
| 67 | docs/cli/design/TUI-INPUT-BOX.md:125 | :122 ⇒ （失据） | as-of（加标） | waitForSettleOrWake 迁核 suspension.mjs:135/:250；旧 :122/:137/:279 失位（迁档候选） |
| 68 | docs/cli/design/TUI-INPUT-BOX.md:136 | :220 ⇒ :7 | 重锚 | ⇒:255（复读：命中） |
| 69 | docs/cli/design/TUI-INPUT-BOX.md:220 | :39 ⇒ :8 | 假阳核销 | 启动调用点 = :39（实读） |
| 70 | docs/cli/design/TUI-SESSION-VIEW.md:162 | :137 ⇒ :154 | 假阳核销 | accountLine 定义 = :137（实读）；探针 near-id 误取 accountAll（跨锚） |
| 71 | docs/cli/design/TUI-SESSION-VIEW.md:166 | :175 ⇒ :139 | as-of（已在位） | 限定块（2026-09-16 批 8）——行带时点锚（B 类） |
| 72 | docs/cli/design/TUI-COMMANDS.md:199 | :6 ⇒ （失据） | 假阳核销 | 先例 picker 块 = :6-9 逐字在位（实读） |
| 73 | docs/cli/design/TUI-COMMANDS.md:199 | :30 ⇒ （失据） | 假阳核销 | 先例 picker 块 = :30-33 逐字在位（实读） |
| 74 | docs/cli/design/CLI-DEBT.md:70 | :452 ⇒ :136 | as-of（加标） | ledger 实装随 bin 拆档外提（command-table 族——迁档候选） |
| 75 | docs/cli/requirements/ACP-CLIENT.md:146 | :337 ⇒ :2 | as-of（已在位） | 变更记录行（2026-09-16 批 1）——记录面零改 |
| 76 | docs/cli/requirements/ACP-CLIENT.md:146 | :262 ⇒ :13 | as-of（已在位） | 变更记录行（同上）——记录面零改 |

**重锚残留（复跑复现 6 条——已逐条读认 = 假阳类（判据窗差 ∕ 邻 token 误取））**：

| # | 位置 | 现 ⇒ 建议 | 处置 | 复核 |
|---|---|---|---|---|
| R1 | docs/cli/design/TUI.md:414#thincoder-cli/src/tui/suspension-drive.mjs:174 | （重锚后复现） | 假阳核销（重锚残留） | 重锚后复跑残留：near-id 误取邻 token「subagent」——:174 = freezeAll 钩（在位，实读） |
| R2 | docs/cli/design/TUI.md:415#subagent-blocks.mjs:257-279 | （重锚后复现） | 假阳核销（重锚残留） | 残留：range-head 窗差——stopped 分支 = :268 ∈ 区间（实读） |
| R3 | docs/cli/design/TUI.md:470#advisor-async.mjs:441 | （重锚后复现） | 假阳核销（重锚残留） | 残留：near-id 误取——:441 = set(String(id)) 在位（实读） |
| R4 | docs/cli/design/TUI.md:525#subagent-run.mjs:163-165 | （重锚后复现） | 假阳核销（重锚残留） | 残留：near-id 误取——两 token 锚 = :163/:165 在位（实读） |
| R5 | docs/cli/design/TUI.md:582#thincoder-cli/src/tui/render-frame.mjs:233-237 | （重锚后复现） | 假阳核销（重锚残留） | 残留：range-head 窗差 + AUTO$ 词界——banner 块 = :233-237 在位（实读） |
| R6 | docs/cli/design/TUI.md:636#thincoder-cli/src/tui/render-conversation.mjs:125-176 | （重锚后复现） | 假阳核销（重锚残留） | 残留：range-head 窗差——convCacheKey = :125-176 在位（实读） |

### 2.14 #469 · cli 域抽样（复核腿 · 24 条 · 24/24 PASS）

| # | 类 | 位置（→ 目标） | 读回读数 |
|---|---|---|---|
| 1 | 重锚 | docs/cli/design/ACP-CLIENT.md:323 → spawn-child.mjs:114-115 | EVENT_PHASE=:114 命中（读回） |
| 2 | 重锚 | docs/cli/design/ACP-CLIENT.md:327 → bridge.mjs:201-207 | onReasoning=:201 命中 |
| 3 | 重锚 | docs/cli/design/ACP-CLIENT.md:541 → acp.mjs:39-45 | defaultIsConfigured=:39 命中 |
| 4 | 重锚 | docs/cli/design/TUI.md:452 → async-settle.mjs:203 | entry.done=true=:203 命中 |
| 5 | 重锚 | docs/cli/design/TUI.md:470 → subagent-run.mjs:202 | set(String(id))=:202 命中 |
| 6 | 重锚 | docs/cli/design/TUI.md:470 → advisor-async.mjs:441 | set(String(id))=:441 命中 |
| 7 | 重锚 | docs/cli/design/TUI.md:414 → agent-turn.mjs:310 | freezeAllSubTasks 调用=:310 命中 |
| 8 | 重锚 | docs/cli/design/TUI.md:450 → subagent-freeze.mjs:212-225 | freezeAllSubTasks 定义=:212 命中 |
| 9 | 重锚 | docs/cli/design/TUI.md:457 → subagent-scheduler.mjs:357-359 | catch{}=:357 命中 |
| 10 | 重锚 | docs/cli/design/TUI.md:726 → chat-messages.js:59-60 | case"token"=:59 命中 |
| 11 | as-of 加标 | docs/cli/design/TUI.md:729 | 标记在 `panels.js:49-52` 后 |
| 12 | as-of 加标 | docs/cli/design/TUI.md:72 | 标记在 `thincoder.mjs:322` 后 |
| 13 | as-of 加标 | docs/cli/design/TUI.md:651 | 标记在 `agent-turn.mjs:84-87` 后 |
| 14 | as-of 加标 | docs/cli/design/ACP-CLIENT.md:450 | 标记在位 |
| 15 | as-of 加标 | docs/cli/design/ACP-CLIENT.md:493 | 标记在位 |
| 16 | as-of 加标 | docs/cli/design/ACP-CLIENT.md:616 | 标记在位 |
| 17 | as-of 加标 | docs/cli/design/TUI-INPUT-BOX.md:125 | 标记在位（行尾） |
| 18 | as-of 加标 | docs/cli/design/CLI-DEBT.md:70 | 标记在位 |
| 19 | 假阳 | docs/cli/design/TUI-SESSION-VIEW.md:162 → display-budget.mjs:137 | accountLine 定义=:137 实读 |
| 20 | 假阳 | docs/cli/design/TUI-INPUT-BOX.md:220 → input-face.mjs:39 | writeStartupSequence 调用=:39 实读 |
| 21 | 假阳 | docs/cli/design/TUI-COMMANDS.md:199 → cmd-new.mjs:30-33 | picker 块=:30-33 实读 |
| 22 | 假阳 | docs/cli/design/TUI.md:444 → render-segments.mjs:76 | 共享折叠键=:76 实读 |
| 23 | 重锚残留 | docs/cli/design/TUI.md:415 → subagent-blocks.mjs:257-279 | stopped 分支=:268 ∈ 区间（range-head 窗差） |
| 24 | 重锚残留 | docs/cli/design/TUI.md:582 → render-frame.mjs:233-237 | bannerPrefix=:237 ∈ 区间（range-head 窗差） |

**选样规则**：分层（处置类型 × 文档域）+ 各类序位取样（非随机——种子不适用）；重锚行 = 新 `file:line` N±2 窗内标识符命中复读；as-of 行 = `（as-of 2026-09-29）` 标记在位复读。**通过判据 = 零未标注不一致：本域 0 未通过**。

### 2.15 #469 · 后继轮任务书（全量清单在册——探针 v2 · as-of 2026-09-29）

**口径**：本清单 = 清扫面 **967** 行的「余域」拆分（cli 76 行已处理 = §2.13）⇒ **余域 909 行**（core 678 ∕ vsc 224 ∕ desktop 7）；**R6 绕开 281 行另册**（见 §2.16）。**行式**：`:L | :N⇒:M | [match]`（L = 源档行号；N = 坐标现值；M = 探针建议值；失据 = 档内零命中）。**后继轮按此清单机械接续**（重锚 ∕ as-of 二元 + §2.12 新增两类；处置记录落该轮 §2）。

**docs/core/design/ADVISOR-CONVERGENCE.md**（2）
:133 | :126⇒:80 | rounds · :138 | :26⇒失据

**docs/core/design/ADVISOR-GUARDS.md**（2）
:21 | :185⇒:51 | failed · :369 | :51⇒失据

**docs/core/design/AGENT-LOOP-ASYNC-POOL.md**（26）
:140 | :41⇒失据 · :156 | :216⇒失据 · :213 | :168⇒:189 | subPool · :217 | :124⇒:6 | depInfo · :219 | :97⇒:113 | finishSuspension · :226 | :106⇒失据 · :240 | :190⇒:2 | subagent · :240 | :186⇒:2 | async · :273 | :83⇒:2 | async · :274 | :233⇒:35 | escapeXml · :274 | :89⇒:121 | escapeXml · :275 | :226⇒失据 · :279 | :168⇒:189 | subPool · :286 | :83⇒失据 · :295 | :332⇒:346 | onToken · :392 | :41⇒:22 | turn · :392 | :18⇒失据 · :411 | :41⇒:15 | timer · :582 | :47⇒:60 | busy · :596 | :167⇒:49 | state · :602 | :421⇒:3 | runAgent · :681 | :121⇒:116 | timer · :682 | :26⇒:29 | timer · :753 | :197⇒:6 | panel · :765 | :25⇒:12 | QUEUED_MAX_ITEMS · :786 | :219⇒:35 | deliver

**docs/core/design/AGENT-LOOP-SUBAGENT.md**（43）
:190 | :445⇒:2 | subagent · :191 | :157⇒:38 | advisor · :193 | :181⇒:2 | async · :193 | :285⇒:38 | advisor · :193 | :326⇒:2 | async · :201 | :445⇒:2 | subagent · :201 | :53⇒:2 | spawn · :214 | :396⇒:297 | _subAgentCounter · :231 | :445⇒:2 | subagent · :231 | :53⇒:2 | spawn · :256 | :396⇒:114 | String · :303 | :245⇒:114 | plan · :330 | :48⇒:14 | subagent · :330 | :229⇒:114 | plan · :330 | :51⇒失据 · :390 | :46⇒:9 | plan · :394 | :216⇒失据 · :399 | :216⇒失据 · :411 | :106⇒:36 | executeStatusAction · :413 | :70⇒:28 | writeTombstone · :415 | :235⇒:4 | send · :419 | :234⇒:192 | history · :420 | :141⇒失据 · :423 | :147⇒:2 | agent · :425 | :125⇒:33 | unknown · :471 | :301⇒:65 | agent · :473 | :147⇒失据 · :500 | :147⇒:2 | agent · :500 | :234⇒:306 | lines · :507 | :236⇒:48 | JSON · :524 | :38⇒:6 | KEEP_HEAD · :525 | :46⇒失据 · :533 | :393⇒:328 | engineeringRole · :536 | :38⇒:6 | KEEP_HEAD · :537 | :230⇒:54 | history · :559 | :358⇒:412 | injectAsyncResult · :622 | :125⇒:2 | agent · :624 | :184⇒:86 | systemPrompt · :698 | :270⇒:20 | batchSegmentTool · :720 | :14⇒:19 | configureBatchSegment · :728 | :17⇒:24 | batchSegmentTool · :733 | :5⇒:212 | batch · :930 | :463⇒:228 | relayPrefix

**docs/core/design/AGENT-LOOP-UPSTREAM.md**（47）
:28 | :319⇒:40 | entry · :28 | :214⇒:2 | agent · :28 | :26⇒:34 | drainInjectedQueue · :31 | :139⇒:155 | advisor · :34 | :179⇒:2 | subagent · :34 | :110⇒:7 | spawn · :43 | :139⇒:29 | parentChannelTool · :62 | :214⇒:2 | agent · :100 | :59⇒:3 | runAgent · :100 | :206⇒失据 · :100 | :113⇒失据 · :137 | :172⇒:211 | readonly · :144 | :166⇒:29 | parentChannelTool · :150 | :463⇒:4 | child · :151 | :409⇒:17 | createAgent · :157 | :214⇒:2 | agent · :159 | :113⇒失据 · :187 | :86⇒:14 | cancelled · :190 | :187⇒:2 | async · :190 | :290⇒:4 | subagent · :274 | :383⇒:9 | injectAsyncResult · :457 | :67⇒:19 | upstreamHolder · :461 | :225⇒失据 · :462 | :319⇒:40 | entry · :462 | :223⇒:85 | consumeInjected · :463 | :94⇒失据 · :470 | :371⇒:436 | AUTO_TURN_DIGEST_DOMAIN · :471 | :162⇒:85 | upstreamTurn · :473 | :123⇒:162 | splice · :474 | :111⇒:85 | upstreamTurn · :480 | :105⇒:5 | send · :564 | :71⇒:105 | upstreamTurn · :610 | :71⇒:4 | runAgent · :639 | :31⇒失据 · :702 | :162⇒失据 · :766 | :144⇒:55 | ASYNC_NOTE · :780 | :179⇒:3 | opts · :780 | :223⇒:85 | consumeInjected · :782 | :88⇒失据 · :783 | :68⇒失据 · :794 | :36⇒失据 · :795 | :67⇒:77 | Array · :800 | :163⇒失据 · :823 | :125⇒失据 · :886 | :227⇒:233 | autoApprove · :886 | :127⇒失据 · :1017 | :221⇒:237 | AUTO

**docs/core/design/AGENT-LOOP.md**（22）
:34 | :80⇒失据 · :42 | :47⇒:2 | executeAsyncSpawn · :43 | :131⇒:23 | runHooks · :44 | :199⇒:14 | settings · :64 | :319⇒:51 | false · :106 | :116⇒:28 | writeTombstone · :114 | :42⇒:5 | noteMutations · :119 | :36⇒失据 · :143 | :237⇒失据 · :155 | :319⇒失据 · :225 | :197⇒:3 | opts · :262 | :366⇒失据 · :344 | :233⇒:80 | _currentTurn · :433 | :112⇒:3 | resolveDesignSlot · :435 | :441⇒:3 | async · :439 | :387⇒失据 · :441 | :91⇒失据 · :442 | :205⇒:237 | ContinueError · :446 | :281⇒失据 · :568 | :112⇒:3 | resolveDesignSlot · :568 | :411⇒:9 | mergeChildMutations · :596 | :366⇒失据

**docs/core/design/AGENT-PARAMS.md**（7）
:58 | :36⇒失据 · :59 | :40⇒失据 · :74 | :44⇒:50 | maxTurns · :89 | :33⇒:36 | REVIEW_TIMEOUT_MS · :92 | :45⇒:5 | saveAgentSettingsFromPanel · :94 | :313⇒失据 · :98 | :323⇒:177 | advisor

**docs/core/design/ANCHOR-DEBT-REPAIR.md**（3）
:236 | :147⇒:158 | resolveFile · :236 | :53⇒:22 | statSync · :237 | :54⇒:65 | walk

**docs/core/design/APPLY-PATCH.md**（1）
:80 | :140⇒:405 | TOOLS

**docs/core/design/BATCH-RECORD.md**（1）
:219 | :159⇒:169 | findIndex

**docs/core/design/CONFIG.md**（3）
:37 | :108⇒:11 | $schema · :57 | :108⇒:2 | config · :106 | :168⇒:178 | resolveAdvisorPoolLimit

**docs/core/design/CONSULTATION.md**（3）
:192 | :215⇒:262 | reasoningEffortEnum · :194 | :82⇒:107 | image · :255 | :215⇒:84 | makeMainHistoryTool

**docs/core/design/CONTEXT-COMPACTION.md**（23）
:161 | :255⇒失据 · :175 | :61⇒:18 | SUMMARIZE_PROMPT · :212 | :387⇒:141 | role · :213 | :230⇒:86 | toolSchemas · :253 | :184⇒:86 | toolSchemas · :256 | :101⇒:14 | mode · :262 | :399⇒:35 | tools · :292 | :211⇒:97 | tools · :314 | :137⇒:42 | false · :322 | :495⇒:434 | explore · :340 | :22⇒:18 | messages · :343 | :423⇒:184 | applyCompression · :363 | :230⇒:86 | toolSchemas · :545 | :89⇒:17 | context · :548 | :396⇒:413 | ctxPct · :548 | :84⇒:47 | null · :567 | :262⇒失据 · :575 | :172⇒:4 | path · :588 | :141⇒:110 | saveSession · :591 | :172⇒:4 | path · :699 | :106⇒失据 · :699 | :231⇒:10 | chat · :703 | :141⇒:151 | read_history

**docs/core/design/CORE-UNIFICATION.md**（53）
:30 | :66⇒失据 · :30 | :12⇒:17 | DESC · :33 | :125⇒:136 | devDependencies · :966 | :43⇒:11 | loadAdvisorPrompt · :987 | :63⇒失据 · :1017 | :22⇒:25 | files · :1056 | :35⇒:38 | prepublishOnly · :1224 | :103⇒:5 | agent · :1224 | :312⇒:11 | $schema · :1225 | :92⇒:117 | tool · :1225 | :49⇒:4 | json · :1226 | :14⇒:2 | thincoder · :1226 | :56⇒失据 · :1255 | :26⇒失据 · :1255 | :205⇒失据 · :1272 | :63⇒失据 · :1303 | :320⇒:56 | this · :1304 | :317⇒失据 · :1304 | :445⇒:191 | Promise · :1305 | :134⇒:8 | onToken · :1307 | :15⇒:19 | VSC_CONFIG_SCHEMA · :1307 | :108⇒:11 | $schema · :1314 | :43⇒:4 | configureBatchSegment · :1314 | :82⇒:65 | configureProcessTreeKill · :1315 | :42⇒:64 | configureGitApproval · :1315 | :371⇒:398 | configureEditReceipt · :1316 | :25⇒:30 | configureEngMirror · :1326 | :144⇒:13 | panel · :1337 | :143⇒失据 · :1338 | :321⇒失据 · :1342 | :24⇒:7 | resolveInCwd · :1346 | :66⇒失据 · :1353 | :214⇒:224 | readSkillSync · :1366 | :37⇒:8 | applyEditorEdit · :1367 | :94⇒:33 | file · :1370 | :214⇒:209 | thincoder · :1371 | :17⇒:25 | file · :1390 | :99⇒:15 | edit · :1412 | :11⇒失据 · :1414 | :11⇒失据 · :1421 | :63⇒失据 · :1422 | :62⇒:18 | assembleBuiltinTools · :1423 | :182⇒:43 | prepareRun · :1423 | :125⇒:86 | toolSchemas · :1424 | :138⇒:120 | read_image · :1457 | :14⇒失据 · :1457 | :71⇒失据 · :1473 | :14⇒:4 | assemblePrompt · :1473 | :63⇒:4 | assemblePrompt · :1476 | :101⇒:67 | buildAdvisorSystemPrompt · :1912 | :125⇒失据 · :1938 | :309⇒:411 | panel · :1938 | :395⇒:241 | escalate

**docs/core/design/DESIGN-TOKEN-SETTLEMENT.md**（11）
:24 | :26⇒:4 | saveSession · :31 | :112⇒:3 | resolveDesignSlot · :39 | :270⇒:21 | restoreEngTokens · :45 | :177⇒:8 | removeDesignTokenSlot · :46 | :140⇒:3 | resolveDesignSlot · :75 | :26⇒:4 | saveSession · :95 | :389⇒:45 | settleDesignReview · :96 | :112⇒:3 | resolveDesignSlot · :99 | :70⇒失据 · :100 | :152⇒:7 | executeConsumeDesignAction · :104 | :152⇒失据

**docs/core/design/DOC-CODE-RECONCILE.md**（9）
:198 | :42⇒:4 | thincoder · :230 | :179⇒:143 | README · :240 | :107⇒:121 | JSON · :241 | :123⇒失据 · :242 | :300⇒失据 · :242 | :99⇒:112 | USAGE · :243 | :42⇒失据 · :263 | :431⇒失据 · :316 | :300⇒:112 | USAGE

**docs/core/design/DOC-DISCIPLINE.md**（35）
:120 | :49⇒失据 · :188 | :81⇒失据 · :268 | :292⇒:4 | ENGINEERING · :268 | :497⇒:401 | ENGINEERING · :348 | :16⇒:4 | docRoot · :378 | :16⇒:4 | docRoot · :447 | :365⇒:8 | subagent · :447 | :123⇒:6 | async · :539 | :58⇒失据 · :539 | :142⇒:156 | PROMPT · :539 | :21⇒:25 | TOOLS · :540 | :12⇒:1 | PROMPT · :540 | :17⇒:25 | TOOLS · :540 | :16⇒:22 | SYSTEM · :540 | :181⇒:197 | TOOLS · :578 | :122⇒:29 | DEFAULT_MANIFEST · :580 | :171⇒:15 | docRootPaths · :630 | :17⇒:25 | TOOLS · :630 | :16⇒:22 | SYSTEM · :835 | :171⇒:209 | thincoder · :928 | :21⇒:25 | scanDirs · :1117 | :332⇒:8 | CODE · :1181 | :17⇒:25 | TOOLS · :1181 | :16⇒:22 | SYSTEM · :1183 | :58⇒失据 · :1183 | :142⇒:156 | PROMPT · :1183 | :21⇒:1 | SYSTEM · :1186 | :17⇒:25 | TOOLS · :1186 | :16⇒:22 | SYSTEM · :1216 | :3⇒失据 · :1348 | :17⇒:25 | TOOLS · :1348 | :16⇒:22 | SYSTEM · :1400 | :27⇒失据 · :1446 | :129⇒:192 | exit · :1461 | :16⇒:4 | docRoot

**docs/core/design/DOC-MIGRATION.md**（16）
:52 | :63⇒:38 | subagent · :52 | :94⇒:31 | advisor · :52 | :168⇒:2 | async · :232 | :411⇒失据 · :237 | :287⇒:25 | ledger · :369 | :85⇒失据 · :369 | :284⇒失据 · :369 | :91⇒失据 · :369 | :567⇒:9 | CONSULTATION · :370 | :505⇒:6 | SYSTEM · :370 | :22⇒:173 | I18N · :370 | :173⇒失据 · :370 | :75⇒失据 · :370 | :187⇒失据 · :372 | :129⇒失据 · :372 | :65⇒失据

**docs/core/design/DOC-SYSTEM.md**（2）
:344 | :125⇒:86 | const · :396 | :21⇒:37 | lineCounts

**docs/core/design/ENG-TOKEN-BINDING.md**（5）
:92 | :42⇒失据 · :95 | :74⇒:19 | purgeExpiredDesignTokens · :96 | :112⇒:3 | resolveDesignSlot · :97 | :304⇒:46 | _engDesignTokens · :100 | :85⇒失据

**docs/core/design/ENGINEERING-MODE-V2.md**（9）
:81 | :36⇒:28 | tool · :81 | :38⇒失据 · :353 | :184⇒:9 | timer · :363 | :16⇒失据 · :371 | :44⇒:22 | role · :377 | :132⇒:62 | engineering · :379 | :341⇒:142 | engineering · :381 | :84⇒失据 · :383 | :84⇒失据

**docs/core/design/ESCALATE.md**（6）
:104 | :341⇒:47 | depth · :106 | :423⇒:19 | runWithContinue · :107 | :190⇒:4 | subagent · :107 | :403⇒:164 | assemblePrompt · :108 | :138⇒:9 | mergeChildMutations · :109 | :227⇒:14 | escalate

**docs/core/design/HASHLINE-EDIT.md**（2）
:52 | :380⇒:384 | hashlineEditTool · :53 | :376⇒:96 | hashLine

**docs/core/design/INSERT-AFTER.md**（2）
:53 | :280⇒:284 | insertAfterTool · :54 | :305⇒:19 | lastWriteOf

**docs/core/design/MANIFEST.md**（22）
:128 | :314⇒:14 | applySession · :135 | :52⇒:23 | writeEndMarker · :135 | :478⇒失据 · :139 | :314⇒:14 | applySession · :143 | :96⇒:45 | hydrateRun · :229 | :51⇒失据 · :235 | :311⇒:14 | applySession · :235 | :61⇒失据 · :236 | :198⇒:4 | gates · :237 | :52⇒:23 | writeEndMarker · :237 | :478⇒失据 · :276 | :31⇒:21 | resolveProjectRoot · :291 | :33⇒:41 | REVIEW_ROOT_KEYS · :342 | :44⇒失据 · :391 | :43⇒:8 | resolveReviewTargetPaths · :392 | :121⇒:135 | roots · :393 | :80⇒:17 | resolveBatchDocPath · :442 | :50⇒:4 | manifest · :444 | :249⇒:25 | writer · :448 | :472⇒:110 | saveSession · :459 | :314⇒:14 | applySession · :462 | :236⇒失据

**docs/core/design/MCP.md**（1）
:212 | :8⇒:40 | config

**docs/core/design/MEMORY.md**（14）
:70 | :26⇒失据 · :70 | :205⇒失据 · :288 | :42⇒:24 | readonly · :312 | :101⇒:9 | docSearch · :319 | :80⇒:14 | cursorKey · :323 | :90⇒:169 | next · :337 | :66⇒:36 | entries · :339 | :116⇒:22 | doc_chunks · :340 | :298⇒:103 | code_chunks · :384 | :101⇒:44 | depth · :478 | :344⇒:75 | entries · :520 | :15⇒:175 | code · :520 | :15⇒:70 | docs · :602 | :13⇒失据

**docs/core/design/MODEL-BENCH.md**（37）
:231 | :205⇒:226 | note · :298 | :54⇒:63 | note · :445 | :184⇒:50 | maxTokens · :446 | :178⇒:3 | chat · :642 | :193⇒:210 | thinkApi · :859 | :205⇒:226 | note · :875 | :81⇒:97 | render · :1000 | :82⇒:71 | frozenAtSuiteVersion · :1000 | :82⇒:33 | json · :1003 | :82⇒:71 | frozenAtSuiteVersion · :1007 | :59⇒:69 | noUsageStream · :1268 | :148⇒:36 | false · :1447 | :271⇒:234 | callSlot · :1576 | :59⇒:69 | noUsageStream · :1617 | :64⇒:17 | read_image · :1622 | :151⇒失据 · :1623 | :397⇒:182 | false · :1625 | :305⇒:2 | subagent · :1626 | :44⇒失据 · :1626 | :172⇒:167 | notify_parent · :1632 | :222⇒:80 | _currentTurn · :1632 | :215⇒:80 | _currentTurn · :1633 | :263⇒:162 | onToolCall · :1633 | :146⇒:170 | onToolResult · :1633 | :444⇒失据 · :1634 | :52⇒:10 | note · :1636 | :345⇒失据 · :1643 | :18⇒:4 | round · :1717 | :141⇒失据 · :1744 | :228⇒:234 | callSlot · :1777 | :78⇒失据 · :1858 | :18⇒:3 | bash · :1858 | :3⇒:7 | grep · :1858 | :3⇒失据 · :1977 | :34⇒:38 | refuseIfExists · :1982 | :71⇒:76 | costOf · :2181 | :75⇒失据

**docs/core/design/MODEL-SPECS.md**（72）
:109 | :135⇒:39 | coder · :142 | :135⇒:128 | qwen3 · :168 | :213⇒:154 | reasoningEffortEnum · :170 | :188⇒:203 | reasoningEffortEnum · :174 | :131⇒:16 | thinkApi · :175 | :85⇒失据 · :176 | :225⇒:272 | reasoningEffortEnum · :177 | :150⇒:157 | reasoningEffortEnum · :178 | :172⇒:182 | reasoningEffortEnum · :179 | :253⇒:264 | partialMode · :180 | :110⇒失据 · :213 | :64⇒:17 | read_image · :221 | :11⇒失据 · :246 | :3⇒失据 · :259 | :86⇒:1 | thinking · :318 | :19⇒:22 | EFFORT_DEFAULT_PREFIXES · :323 | :118⇒:126 | DEFAULT_SPEC · :341 | :22⇒:31 | xhigh · :345 | :85⇒失据 · :346 | :48⇒:23 | null · :409 | :44⇒失据 · :422 | :19⇒:22 | EFFORT_DEFAULT_PREFIXES · :423 | :61⇒失据 · :424 | :154⇒:252 | warn · :443 | :198⇒:52 | thinking · :449 | :27⇒:10 | enabled · :500 | :16⇒失据 · :513 | :56⇒失据 · :513 | :270⇒:282 | _warnings · :549 | :22⇒:35 | enable_thinking · :550 | :136⇒:49 | thinking · :661 | :196⇒:192 | isRouter · :690 | :38⇒:47 | null · :691 | :48⇒:52 | none · :708 | :133⇒:138 | resolveEnableThinking · :739 | :53⇒:28 | flash · :754 | :53⇒:73 | flashx · :959 | :131⇒:19 | high · :1072 | :104⇒:109 | resolveCompactThreshold · :1073 | :187⇒:183 | tempRange · :1075 | :288⇒:23 | reasoningEcho · :1083 | :133⇒:138 | resolveEnableThinking · :1153 | :265⇒:328 | assistantToolCallMessage · :1328 | :104⇒:54 | none · :1355 | :33⇒失据 · :1357 | :27⇒:2 | specs · :1368 | :235⇒:272 | reasoningEffortEnum · :1374 | :205⇒:23 | none · :1377 | :17⇒失据 · :1377 | :22⇒:8 | config · :1378 | :180⇒:264 | advisor · :1378 | :116⇒:126 | settings · :1378 | :44⇒:55 | effortSelectView · :1384 | :336⇒:47 | PROVIDER · :1410 | :336⇒:47 | PROVIDER · :1468 | :336⇒:47 | PROVIDER · :1476 | :26⇒:2 | settings · :1476 | :125⇒:8 | models · :1479 | :82⇒:96 | Reasoning · :1561 | :86⇒:12 | handleModelsMessage · :1588 | :204⇒失据 · :1622 | :55⇒失据 · :1692 | :22⇒:7 | thinking · :1716 | :22⇒:7 | thinking · :1717 | :63⇒失据 · :1754 | :44⇒:15 | advisorStatus · :1756 | :119⇒:24 | type · :1789 | :12⇒:19 | advisorIncompleteMarker · :1791 | :111⇒:24 | type · :1824 | :12⇒:19 | advisorIncompleteMarker · :1856 | :104⇒:54 | none · :1982 | :21⇒失据

**docs/core/design/MULTI-INSTANCE-COLLAB.md**（8）
:54 | :118⇒:12 | pids · :56 | :168⇒:41 | VSC_END_RE · :176 | :119⇒:15 | pathsOverlap · :208 | :128⇒:137 | writeSessionFile · :210 | :109⇒:7 | claims · :217 | :118⇒:6 | batchAlive · :264 | :48⇒:163 | _setProcessProbeTestImpl · :283 | :29⇒:15 | path

**docs/core/design/PORTABILITY.md**（12）
:33 | :204⇒:98 | typeof · :35 | :122⇒:118 | hasCodeMutations · :67 | :221⇒:272 | loadProjectDeclaration · :68 | :197⇒:177 | clearDeclarationCache · :69 | :98⇒:143 | classifyPath · :70 | :108⇒:153 | isCodePath · :71 | :124⇒:170 | isAuxPath · :72 | :192⇒:129 | DEFAULT_DECLARATION · :136 | :71⇒:4 | hasCodeMutations · :140 | :76⇒:143 | classifyPath · :144 | :70⇒:4 | hasCodeMutations · :160 | :172⇒:2 | tool

**docs/core/design/PROMPT-SYSTEM.md**（2）
:115 | :262⇒失据 · :169 | :214⇒:226 | AGENT

**docs/core/design/PROVIDER.md**（16）
:162 | :183⇒:56 | format · :265 | :216⇒:5 | appendImagePointer · :270 | :65⇒:15 | runVisionReader · :270 | :92⇒失据 · :278 | :59⇒:41 | newTurnController · :291 | :213⇒失据 · :316 | :106⇒:121 | isBailianHost · :321 | :13⇒失据 · :330 | :406⇒:412 | gate · :331 | :189⇒失据 · :332 | :196⇒:261 | undefined · :335 | :60⇒:2 | retry · :348 | :83⇒:6 | locale · :351 | :195⇒:72 | statusTextPayload · :391 | :189⇒失据 · :451 | :9⇒失据

**docs/core/design/PROXY.md**（4）
:43 | :32⇒:38 | rejectUnauthorized · :70 | :104⇒:112 | proxyMenu · :80 | :199⇒:204 | normalizeProxy · :115 | :32⇒:38 | rejectUnauthorized

**docs/core/design/SEND-STALL-DISTILL.md**（11）
:53 | :187⇒:118 | onDistilled · :54 | :395⇒:35 | buildToolCallbacks · :57 | :115⇒:118 | onDistilled · :87 | :170⇒:8 | summarizeRunExplorations · :87 | :341⇒失据 · :87 | :261⇒失据 · :88 | :157⇒:147 | _distillState · :92 | :395⇒:402 | onDistilled · :93 | :29⇒:33 | DISTILL_FLUSH_TIMEOUT_MS · :145 | :395⇒:402 | onDistilled · :153 | :261⇒失据

**docs/core/design/SESSION.md**（42）
:146 | :31⇒:42 | updatedAt · :176 | :104⇒失据 · :177 | :134⇒:55 | keepReal · :178 | :23⇒:5 | provider · :185 | :257⇒失据 · :236 | :41⇒:207 | prepareRun · :237 | :61⇒失据 · :237 | :91⇒:4 | runAgent · :238 | :105⇒:15 | sessionEnd · :324 | :186⇒失据 · :361 | :34⇒:47 | existing · :388 | :115⇒:12 | pushGitContext · :389 | :189⇒:221 | collectGitContext · :400 | :342⇒失据 · :411 | :190⇒失据 · :413 | :291⇒:12 | resumeSlot · :413 | :131⇒:11 | resumeSlot · :413 | :16⇒:97 | slotSessions · :440 | :86⇒:18 | readdirSync · :454 | :81⇒:92 | sessionPath · :478 | :128⇒失据 · :518 | :230⇒:12 | usableSlot · :523 | :152⇒:39 | cleanup · :523 | :444⇒:34 | exit · :530 | :176⇒:19 | releaseClaimsOnExit · :531 | :37⇒:41 | workspaceFolders · :572 | :202⇒:4 | path · :657 | :25⇒:7 | buildFtsQuery · :756 | :167⇒:87 | mtimeMs · :782 | :34⇒:13 | provider · :783 | :44⇒失据 · :887 | :48⇒失据 · :887 | :83⇒:88 | digestFromStore · :890 | :83⇒:88 | digestFromStore · :922 | :69⇒失据 · :922 | :41⇒失据 · :924 | :234⇒:240 | refused · :932 | :149⇒:48 | saveManifest · :1075 | :186⇒失据 · :1127 | :134⇒:55 | keepReal · :1186 | :152⇒:70 | line · :1186 | :444⇒失据

**docs/core/design/STRUCTURE-DEBT.md**（1）
:33 | :189⇒:13 | settleAsyncEntry

**docs/core/design/TOOL-OUTPUT-LIMITS.md**（10）
:44 | :80⇒:7 | mkdir · :93 | :20⇒:16 | MAX_RESULT_CHARS · :108 | :77⇒:25 | MAX_TOOL_RESULT · :109 | :97⇒:5 | safeSliceUTF16 · :110 | :132⇒:5 | buildHeadTailPreview · :111 | :167⇒:8 | offloadToolResult · :113 | :34⇒:37 | MAX_RESULT_CHARS · :114 | :165⇒:203 | onToolResult · :116 | :27⇒失据 · :118 | :196⇒失据

**docs/core/design/TOOLS.md**（46）
:63 | :36⇒:23 | b_algo · :63 | :64⇒:23 | b_algo · :66 | :48⇒:3 | execFileSync · :66 | :53⇒失据 · :67 | :11⇒:3 | wait_for · :79 | :34⇒:50 | expiresAt · :279 | :142⇒失据 · :292 | :389⇒:2 | agent · :292 | :349⇒:18 | agent · :312 | :15⇒:20 | runGitRaw · :318 | :446⇒:178 | false · :328 | :114⇒:20 | runGitRaw · :330 | :28⇒:24 | lazyClearIfCommitted · :377 | :44⇒:24 | resolveProjectRoot · :395 | :94⇒:61 | execute · :401 | :97⇒:60 | args · :447 | :16⇒:20 | runGitRaw · :455 | :85⇒:89 | Default · :508 | :47⇒:50 | buildBashEnv · :520 | :136⇒失据 · :608 | :448⇒失据 · :608 | :263⇒失据 · :663 | :181⇒:5 | setup · :665 | :86⇒失据 · :683 | :56⇒:60 | engineering · :692 | :85⇒:95 | batch · :692 | :175⇒:227 | assertStatusValue · :746 | :86⇒失据 · :775 | :83⇒:2 | test · :780 | :6⇒:136 | persona · :805 | :170⇒失据 · :825 | :123⇒:2 | agent · :865 | :19⇒:10 | questionTool · :871 | :296⇒失据 · :876 | :163⇒:11 | tools · :907 | :198⇒:28 | args · :909 | :150⇒:24 | _touchedFiles · :910 | :401⇒失据 · :972 | :333⇒失据 · :984 | :247⇒:243 | autoSyntaxCheck · :984 | :202⇒失据 · :1059 | :85⇒:13 | exec · :1059 | :51⇒:4 | exec · :1109 | :169⇒失据 · :1113 | :86⇒失据 · :1116 | :91⇒失据

**docs/core/design/TRACES.md**（3）
:80 | :284⇒:5 | jsonl · :90 | :103⇒:106 | _resetTraceStateForTest · :91 | :312⇒:44 | undefined

**docs/core/design/TURN-CAP-CONTINUE.md**（17）
:19 | :54⇒:3 | runAgent · :22 | :203⇒:35 | panel · :22 | :142⇒:2 | turn · :24 | :279⇒失据 · :40 | :293⇒:26 | enqueueAsk · :43 | :195⇒:233 | capStop · :53 | :220⇒:80 | _maxTurns · :63 | :293⇒:4 | executeSendAction · :64 | :99⇒失据 · :65 | :195⇒:233 | capStop · :69 | :381⇒:393 | _currentTurn · :80 | :174⇒:169 | entry · :90 | :170⇒:3 | opts · :91 | :190⇒:2 | agent · :92 | :28⇒:3 | turnFrame · :98 | :128⇒:32 | postDigestCap · :202 | :439⇒:85 | consumeInjected

**docs/core/design/VERIFY-REDESIGN.md**（2）
:71 | :76⇒:8 | hasCodeMutations · :72 | :142⇒失据

**docs/core/design/WRITE.md**（1）
:45 | :43⇒失据

**docs/core/requirements/AGENT-LOOP.md**（2）
:163 | :276⇒失据 · :210 | :129⇒:85 | resume

**docs/core/requirements/AGENT-PARAMS.md**（1）
:25 | :340⇒失据

**docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md**（2）
:22 | :112⇒:3 | resolveDesignSlot · :26 | :152⇒:7 | executeConsumeDesignAction

**docs/core/requirements/ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md**（1）
:59 | :75⇒:8 | lifecycle

**docs/core/requirements/ENGINEERING-MODE-V2-SPEC-CHECKLIST-REMOVAL.md**（2）
:16 | :128⇒失据 · :19 | :38⇒失据

**docs/core/requirements/ENGINEERING-MODE-V2.md**（1）
:704 | :11⇒:21 | PLAN_EXIT_REMINDER

**docs/core/requirements/MEMORY.md**（1）
:165 | :30⇒失据

**docs/core/requirements/NORMAL-MODE.md**（1）
:25 | :72⇒:41 | SCENARIO_SLOT_FILES

**docs/core/requirements/SEND-STALL-DISTILL.md**（2）
:22 | :232⇒失据 · :25 | :346⇒:96 | catch

**docs/core/requirements/SESSION.md**（1）
:68 | :152⇒:25 | process

**docs/core/requirements/TOOLS.md**（6）
:64 | :36⇒失据 · :64 | :348⇒:110 | task · :108 | :165⇒失据 · :108 | :27⇒失据 · :110 | :195⇒:151 | sendHistoryPage · :116 | :50⇒:7 | builtinTools

**docs/core/requirements/TURN-CAP-CONTINUE.md**（4）
:20 | :36⇒:6 | ContinueError · :27 | :439⇒:17 | ContinueError · :35 | :24⇒失据 · :78 | :432⇒:98 | throw

**docs/desktop/design/E2E-TESTING.md**（4）
:24 | :55⇒:4 | requestSingleInstanceLock · :28 | :270⇒:3 | error · :40 | :55⇒失据 · :76 | :55⇒失据

**docs/desktop/design/SHELL.md**（3）
:131 | :281⇒:78 | approval · :133 | :114⇒:10 | buildScan · :133 | :334⇒:243 | phase

**docs/vsc/design/PROJECT-SWITCHER.md**（10）
:28 | :36⇒:41 | workspaceFolders · :31 | :46⇒:11 | _cwd · :78 | :100⇒:25 | savePastedImages · :79 | :219⇒:23 | thincoder · :80 | :336⇒失据 · :81 | :252⇒:44 | openSessionContent · :84 | :293⇒失据 · :86 | :217⇒:156 | pushSessions · :95 | :67⇒:7 | applyBusyLock · :104 | :99⇒:15 | clearProjectOverride

**docs/vsc/design/SETTINGS.md**（35）
:38 | :221⇒:3 | config · :57 | :237⇒:100 | cfgShell · :169 | :201⇒:205 | apiKey · :180 | :270⇒:38 | websearchRowHtml · :181 | :283⇒:20 | embedRowHtml · :185 | :128⇒失据 · :189 | :201⇒:205 | apiKey · :194 | :225⇒:3 | case · :197 | :132⇒:10 | closeModelMenu · :199 | :117⇒:138 | editMcp · :215 | :584⇒:8 | index · :218 | :173⇒:195 | dataset · :222 | :173⇒:184 | secretDeleteConfirm · :222 | :173⇒:40 | question · :225 | :173⇒:5 | Delete · :234 | :93⇒:75 | stopPropagation · :241 | :132⇒:10 | closeModelMenu · :249 | :22⇒:312 | outerHTML · :270 | :25⇒失据 · :284 | :47⇒失据 · :284 | :132⇒失据 · :286 | :48⇒:25 | initSettings · :300 | :104⇒:131 | deleteSession · :308 | :182⇒:186 | handleGetShellCandidates · :327 | :137⇒:17 | admissionOf · :359 | :137⇒:17 | admissionOf · :381 | :204⇒失据 · :405 | :204⇒:128 | slotData · :406 | :146⇒:181 | updateAgentSettings · :427 | :201⇒:205 | apiKey · :461 | :81⇒:679 | mode · :508 | :135⇒:31 | patch · :535 | :41⇒:30 | closeSettings · :549 | :137⇒失据 · :553 | :44⇒:16 | flashSaved

**docs/vsc/design/VSC-DEBT.md**（32）
:63 | :24⇒:2 | slow · :70 | :14⇒:1 | activity · :72 | :298⇒:93 | queued · :76 | :101⇒:31 | emitToolPanel · :76 | :297⇒:226 | onToolPanel · :78 | :135⇒:34 | flushSubagentOutbox · :78 | :195⇒:72 | statusTextPayload · :79 | :19⇒失据 · :79 | :221⇒失据 · :95 | :81⇒:6 | chat · :95 | :31⇒失据 · :96 | :215⇒失据 · :136 | :15⇒:2 | parity · :376 | :92⇒:39 | runPanelChat · :411 | :108⇒失据 · :416 | :137⇒:34 | flushSubagentOutbox · :418 | :257⇒:8 | onSubagent · :441 | :8⇒:2 | panel · :446 | :283⇒:24 | test · :448 | :41⇒:36 | buildPanelCallbacks · :450 | :41⇒:7 | digest · :452 | :28⇒:2 | chat · :453 | :27⇒:23 | async · :454 | :28⇒:128 | async · :457 | :20⇒:76 | agent · :458 | :20⇒:25 | generateTitle · :477 | :56⇒:8 | isTableRow · :487 | :363⇒:39 | runPanelChat · :709 | :56⇒:1 | AGENTS · :737 | :403⇒:51 | subagentApproval · :737 | :217⇒失据 · :738 | :224⇒失据

**docs/vsc/design/VSC-MIGRATION.md**（1）
:60 | :445⇒失据

**docs/vsc/design/WEBVIEW-INPUT.md**（9）
:16 | :35⇒:2 | chat · :16 | :48⇒:2 | chat · :47 | :83⇒失据 · :80 | :141⇒失据 · :94 | :86⇒失据 · :99 | :34⇒失据 · :108 | :106⇒失据 · :108 | :158⇒失据 · :149 | :34⇒失据

**docs/vsc/design/WEBVIEW-PROTOCOL.md**（91）
:97 | :197⇒失据 · :98 | :44⇒:2 | panel · :98 | :174⇒:3 | case · :116 | :226⇒:3 | agent · :135 | :448⇒失据 · :154 | :240⇒失据 · :159 | :58⇒:80 | atResults · :165 | :168⇒失据 · :169 | :13⇒:45 | _phase · :178 | :133⇒:152 | historyPage · :195 | :387⇒失据 · :205 | :387⇒失据 · :220 | :339⇒失据 · :226 | :34⇒:2 | context · :232 | :396⇒:13 | status · :243 | :69⇒:14 | activity · :243 | :403⇒:16 | refreshLiveHeaders · :245 | :105⇒:88 | tool · :247 | :55⇒失据 · :248 | :91⇒失据 · :249 | :103⇒失据 · :249 | :102⇒失据 · :293 | :47⇒失据 · :306 | :97⇒:32 | statusText · :388 | :154⇒:268 | aborted · :389 | :311⇒:8 | agentSettings · :389 | :151⇒失据 · :393 | :109⇒:114 | batchPermissionRequest · :394 | :142⇒:147 | clearMessages · :397 | :184⇒:7 | status · :400 | :190⇒:152 | historyPage · :401 | :188⇒:14 | i18n · :402 | :215⇒失据 · :404 | :407⇒:402 | loading · :409 | :68⇒:73 | permissionRequest · :410 | :196⇒失据 · :420 | :259⇒:245 | sessions · :420 | :131⇒:28 | ledger · :421 | :158⇒失据 · :422 | :187⇒失据 · :423 | :232⇒失据 · :423 | :14⇒失据 · :424 | :221⇒:7 | status · :426 | :317⇒:30 | suspension · :426 | :226⇒失据 · :431 | :60⇒:63 | round · :432 | :70⇒:58 | text · :434 | :69⇒:75 | truncated · :437 | :251⇒:247 | turnState · :439 | :276⇒:280 | userMessage · :459 | :48⇒:74 | abort · :460 | :24⇒失据 · :461 | :33⇒:4 | atComplete · :462 | :108⇒:12 | batchPermissionResponse · :462 | :273⇒失据 · :464 | :92⇒:73 | cancelSubagent · :468 | :104⇒:131 | deleteSession · :470 | :280⇒:274 | saveMcpServer · :474 | :46⇒:27 | interrupt · :478 | :58⇒:10 | openDiff · :479 | :73⇒:65 | openFile · :481 | :63⇒:11 | permissionResponse · :482 | :29⇒:15 | payload · :483 | :55⇒失据 · :483 | :210⇒:125 | running · :485 | :25⇒失据 · :486 | :54⇒:68 | renameSession · :487 | :438⇒:9 | retry · :492 | :354⇒失据 · :493 | :353⇒失据 · :495 | :128⇒失据 · :496 | :129⇒失据 · :497 | :37⇒:4 | setAdvisorGuard · :498 | :100⇒:4 | setAutoApprove · :499 | :42⇒:4 | setEngineeringEnabled · :500 | :27⇒失据 · :501 | :49⇒:4 | setPlanMode · :502 | :121⇒:148 | setProject · :504 | :48⇒:62 | switchSession · :508 | :83⇒失据 · :509 | :147⇒:141 | webviewReady · :519 | :423⇒:6 | panel · :524 | :27⇒失据 · :524 | :251⇒失据 · :537 | :141⇒:58 | guard · :586 | :174⇒失据 · :590 | :103⇒失据 · :633 | :49⇒:2 | panel · :633 | :408⇒:350 | saveShellSettings · :669 | :38⇒失据 · :669 | :197⇒失据

**docs/vsc/requirements/WEBVIEW.md**（46）
:22 | :22⇒:12 | HISTORY_PAGE_SIZE · :23 | :27⇒失据 · :25 | :86⇒失据 · :29 | :293⇒:325 | updateIndexStatus · :29 | :297⇒:3 | index · :29 | :244⇒:2 | settings · :29 | :297⇒:2 | settings · :29 | :172⇒:181 | updateAgentSettings · :30 | :246⇒:109 | delete · :32 | :320⇒:3 | settings · :34 | :25⇒失据 · :34 | :52⇒:6 | settings · :36 | :117⇒:132 | recordAdmission · :38 | :92⇒:114 | batchPermissionRequest · :38 | :86⇒:32 | promptId · :38 | :256⇒失据 · :39 | :329⇒:2 | panel · :39 | :305⇒:123 | slotStamp · :39 | :22⇒失据 · :40 | :246⇒:30 | injectAtRefs · :40 | :34⇒:23 | injectAtRefs · :41 | :225⇒:19 | Error · :41 | :291⇒:176 | Error · :41 | :276⇒:35 | code · :41 | :60⇒:15 | empty · :41 | :291⇒失据 · :41 | :295⇒失据 · :41 | :91⇒失据 · :41 | :276⇒失据 · :41 | :445⇒:59 | true · :66 | :195⇒失据 · :66 | :31⇒失据 · :66 | :83⇒:111 | _llmCalls · :67 | :173⇒:2 | finish · :68 | :37⇒失据 · :70 | :446⇒:136 | status · :71 | :196⇒:25 | done · :72 | :154⇒:124 | _agent · :75 | :445⇒:59 | true · :85 | :208⇒:9 | settings · :117 | :23⇒:38 | hasOlder · :137 | :139⇒失据 · :169 | :372⇒失据 · :174 | :359⇒:147 | buildToolHistory · :179 | :201⇒:205 | apiKey · :181 | :25⇒失据

**合计 909 行**（core ∕ vsc ∕ desktop 依域拆分；desktop ∕ render-core 大档多在 R6 另册）。

### 2.16 #469 · R6 绕开登记（在飞批写域 · 逐档〔批名〕）

| 档 | 候选行 | 归属批（在飞） |
|---|---|---|
| docs/desktop/design/IPC.md | 47 | desktop-residuals-round3 |
| docs/desktop/design/PROJECT.md | 30 | desktop-rebuild-fidelity ∕ desktop-residuals-round3 ∕ perf-residuals |
| docs/desktop/design/RENDERER.md | 10 | desktop-rebuild-fidelity ∕ desktop-residuals-round3 ∕ perf-residuals |
| docs/desktop/design/UI.md | 46 | desktop-rebuild-fidelity ∕ desktop-residuals-round3 |
| docs/desktop/requirements/PROJECT.md | 4 | perf-residuals（上抛·父侧笔） |
| docs/render-core/design/RENDER-CORE.md | 46 | desktop-rebuild-fidelity ∕ perf-residuals |
| docs/vsc/design/WEBVIEW.md | 98 | desktop-rebuild-fidelity |
| **合计** | **281** | 台账号 = 批档名（本仓单实例口径） |

**后继轮域序（父侧裁）**：desktop（非 R6 残 7 行 + R6 档随其批释放）→ vsc（224）→ render-core（全数在 R6）→ core（678）。**接续纪律**：开工届盘重读在飞批 §2 ∕ §5 写域（避让表重取）；cli 域本清单已剔除（§2.13 已处置）。

### 2.17 #435 存量红清账 · doc 面实施轮（eng-designer · 2026-09-29 19:3x）——开工复取基线 ⇒ 分流执行 ⇒ 复跑 Δ

**轮次** = initial（#435 实施轮 · 按 §2.2 全量；依赖 #469 cli 轮先落）。**命令** = 仓根零参 `node scripts/doc-check.mjs`（cwd = `thincoder/`）。
**存档（逐字 · 全文）**：开工基线 = `.thincoder/tmp/2026-09-29-doc-check-face-435-baseline.txt` · 复跑 = `…-435-after.txt` · 终局 = `…-435-final.txt`；
清单件 = `.thincoder/tmp/2026-09-29-doc-check-face-listA.mjs`（探针 · 单源引 `scripts/doc-check-anchors.mjs` 谓词 + `doc-check-width.mjs` `isTableRow`——零内联复刻）· `…-listA.json ∕ .txt` · `…-435-rows.json` · 标记落笔单 `…-markplan.json` · 行集 `…-435-after-rows.json ∕ …-435-final-rows.json`。

**开工基线（逐字 · §2.2(a)：开工复取即终局分母 · as-of 2026-09-29 19:32 本席亲跑）**：

```
判据项 6 项（scanDirs / lineWidth / anchors.domain / anchors.exclude / exemptions / lineCounts = checkConfig 声明面——D3）
机检·锚：扫描域 docs · 152 档
汇总：候选 33562 · 悬空 161 · 注记豁免 107 · 拟新增 27 · 迁移期引文 277
  用例号：候选 1582 · 悬空 100 · 注记豁免 12
  路径/坐标：候选 13323 · 悬空 54 · 注记豁免 23
  符号·窄：候选 267 · 悬空 7 · 注记豁免 36
  符号·宽（报告面）：候选 18390 · 悬空 798 · 注记豁免 36
FAIL(锚): 161 条悬空（闸态——阈值 0）
FAIL(行宽): 81 行超 300 字符——文档人类可读判据。
行数面：差异 24 条（比对 131 行 · 跳过 10 行〔预估 3 ∕ 非数 7〕）——报告态，回填工单即本清单
```

**终局读数（逐字 · `…-435-final.txt` · 补折两行后复跑）**：

```
汇总：候选 33563 · 悬空 44 · 注记豁免 299 · 拟新增 27 · 迁移期引文 292
  用例号：候选 1582 · 悬空 9 · 注记豁免 134
  路径/坐标：候选 13324 · 悬空 29 · 注记豁免 42
  符号·窄：候选 267 · 悬空 6 · 注记豁免 37
  符号·宽（报告面）：候选 18390 · 悬空 787 · 注记豁免 86
FAIL(锚): 44 条悬空（闸态——阈值 0）
FAIL(行宽): 66 行超 300 字符——文档人类可读判据。
行数面：差异 24 条（比对 131 行 · 跳过 10 行〔预估 3 ∕ 非数 7〕）——报告态，回填工单即本清单
```

**分流处置全量（117 条 = 全量 161 − 绕开 44；逐条见下行 Δ 与清单 A ∕ B）**：

| 类 | 处置 | 行数 / 锚数 | 形态（落笔一律逐处读认） |
|---|---|---|---|
| M1 折行 | 15 行（非表格行 · 安全折点 · 拼接逐字复验 PASS） | 15 / 15 | 行内插标点断行（零语义——沿 PROJECT.md 变更记录先例） |
| M2 ∕ M3 改指 | 7 行 | 7 / 10 | 相对形态 → 自仓根完整路径（D4）＋坐标复核（MASKED 宿主实核） |
| C1 打标（迁移期引文） | 3 行（同行已含 19 词史实谓词） | 3 / 6 | 行尾追加 §4.2.10 族标记 · 原行零改写 |
| C3 退场注记 + 打标 | 9 行（档已删 6 ∕ 档已迁核 3） | 9 / 9 | `（迁移期引文——档已删 ∕ 档已迁核）` |
| C2 用例退场登记标记 | 64 行（用例号 63 行 ∕ 符号 1 行） | 64 / 92 | `（机检豁免——用例退场登记）`（实装侧口径 · C2 先例） |
| 绕开登记（R6 ∕ 记录面 ∕ 需求档） | 44 条（见 §2.17 后段） | — | 零触碰 + 逐条登记 |

**折行 15 行（M1 · 改后实读行号）**：`DOC-DISCIPLINE.md` `:1312` ∕ `:1333` · `MANIFEST.md` `:641` · `E2E-TESTING.md` `:109` ∕ `:118` ∕ `:200` ∕ `:276` ∕ `:278` · `SHELL.md` `:94` ∕ `:146` ∕ `:214` ∕ `:217` ∕ `:220` · `vsc/design/SETTINGS.md` `:577` · `vsc/design/VSC-DEBT.md` `:337`。
**改指 7 行（10 token）**：`TOOLS.md:128`（`agent-tools/goal.mjs` ⇒ `thincoder-core/agent-tools/goal.mjs`）· `vsc/design/VSC-DEBT.md` `:328-331`（`src/agent/setup.mjs` ∕ `src/agent/setup-reminders.mjs` ∕ `src/extension/suspension.mjs` ∕ `src/extension/skills.mjs` ∕ `src/extension/peer-claims.mjs` ∕ `src/extension/peer-domains.mjs` ∕ `src/extension/peer-instances.mjs` 七 token ⇒ `thincoder-vscode/…` 全路径——均盘上实存）· `vsc/design/SETTINGS.md:578`（`src/extension/settings.mjs:18` ⇒ `thincoder-vscode/src/extension/settings.mjs:18`——M3 复核：`:18` = `import { MASKED } …` 实读命中）· `vsc/design/WEBVIEW-PROTOCOL.md:288`（`subblocks/block.mjs` ⇒ `thincoder-render-core/subblocks/block.mjs`）。
**C1 ∕ C3 打标 12 行**：`CONFIG.md:150` · `TOOLS.md` `:59` ∕ `:85`（C1）∥ `CRASH-REPORTS.md:34` · `SESSION.md:185` · `TOOLS.md` `:915` ∕ `:935` · `vsc/design/SETTINGS.md` `:292` ∕ `:439` · `VERIFY-REDESIGN.md:73` · `CORE-UNIFICATION.md` `:819` ∕ `:882`（C3）。
**补折 2 行（本席自产新增红即修）**：`vsc/design/VSC-DEBT.md:331`（改指后 321 字符 ⇒ 折行）· `vsc/design/WEBVIEW-PROTOCOL.md:288`（改指后 313 字符 ⇒ 折行）——终局复核新增红 = 0。

**Δ 集合差（§2.2(a)3 ∕ §2.5 规则④——两读数行集逐行集合差；只认集合差 · 禁叙述归因）**：
- **悬空：161 ⇒ 44 —— 消失 117 · 新增 0**（逐条）：

```
- docs/cli/design/CLI-DEBT.md（7）：T-CG15 · T-CG18 · T-CG6 · T-CG8 · T-S3 · T-S3.1 · T-S2.13
- docs/cli/design/CRASH-REPORTS.md（1）：路径/坐标 thincoder-cli/test/fixtures/r25-oom.mjs
- docs/cli/design/TUI-INPUT-BOX.md（3）：T-F16-1 · T-F16-7 · T-F16-1
- docs/cli/design/TUI.md（1）：T-F16-6
- docs/core/design/ADVISOR-GUARDS.md（3）：T-CG15 · T-CG18 · T-AF16
- docs/core/design/AGENT-LOOP-ASYNC-POOL.md（4）：T-D8 · T-D13 · T-TW23b · T-TW23b
- docs/core/design/AGENT-LOOP-SUBAGENT.md（11）：T6b · T6c · T-V13×3 · T60 · T-FZ3 · T60×3 · T-CL1
- docs/core/design/AGENT-LOOP-UPSTREAM.md（8）：T-CL1×3 · T-AF16×3 · T-D9 · T-D10
- docs/core/design/CONFIG.md（1）：路径/坐标 thincoder-vscode/test/fixtures/fake-mcp-server.mjs
- docs/core/design/CORE-UNIFICATION.md（2）：路径/坐标 src/agent-tools/goal.mjs · src/tools/search.mjs
- docs/core/design/DOC-DISCIPLINE.md（5）：T-TD5 · T-Y6 · T-Y1 · T-Y5 · T-Y5b
- docs/core/design/MANIFEST.md（5）：T-F9×5
- docs/core/design/MULTI-INSTANCE-COLLAB.md（3）：T-L1c · T-L3e×2
- docs/core/design/PORTABILITY.md（13）：T-04 ∕ T-01 ∕ T-03 ∕ T-04 ∕ T-05 ∕ T-09 · T-V03 ∕ T-V04 ∕ T-V05 · T-06 · T-04 · T-V12 · T-04
- docs/core/design/PROMPT-SYSTEM.md（5）：T-CL1×5
- docs/core/design/SESSION.md（1）：路径/坐标 tabbar.mjs:92
- docs/core/design/SETTINGS-TOOL.md（4）：T-S2.21 · T-S3 · T-S2.1 · T-S2.35
- docs/core/design/TOOLS.md（18）：路径/坐标 src/tools/search.mjs:116-118 ∕ :230-238 · agent-tools/goal.mjs ×2 · src/agent-tools/goal.mjs:34-115 ∕ :18 · T-F9 · 路径/坐标 rules-face.mjs:103 ∕ rules-face.mjs · T-22 ×3 · T-B3 ×2 · T-B3b ×2 · 符号 AUTO_TURN_DIGEST_DOMAIN_ENG
- docs/core/design/VERIFY-REDESIGN.md（1）：路径/坐标 thincoder-vscode/src/agent-tools/goal.mjs:38
- docs/vsc/design/SETTINGS.md（5）：路径/坐标 test/helpers/webview-env.mjs ×2 · T-S6 · T-MA2-1 · 路径/坐标 src/extension/settings.mjs:18
- docs/vsc/design/VSC-DEBT.md（11）：T-CG18 · 路径/坐标 src/agent/setup.mjs ∕ setup-reminders.mjs ∕ suspension.mjs ∕ skills.mjs ∕ peer-claims.mjs ∕ peer-domains.mjs ∕ peer-instances.mjs · T-V16-1 · T-V16-2 · T-V21
- docs/vsc/design/WEBVIEW-INPUT.md（2）：T-V16-8 ×2
- docs/vsc/design/WEBVIEW-PROTOCOL.md（3）：路径/坐标 subblocks/block.mjs · T-D1 · T-D5
计 = 117
```

- **行宽：81 ⇒ 66 —— 消失 15 · 新增 0**（逐条：`DOC-DISCIPLINE.md:1312(311)` ∕ `:1332(414)` · `MANIFEST.md:641(312)` · `E2E-TESTING.md:109(367)` ∕ `:117(543)` ∕ `:198(313)` ∕ `:273(327)` ∕ `:274(355)` · `SHELL.md:94(584)` ∕ `:145(430)` ∕ `:212(304)` ∕ `:214(373)` ∕ `:216(444)` · `vsc/design/SETTINGS.md:577(380)` · `vsc/design/VSC-DEBT.md:337(342)`）。
- **旁读（只报不裁）**：注记豁免 107 ⇒ 299（+192——行级标记的既有粒度语义：标记行整行锚入豁免账，多次因单行多锚；收窄至 per-token = 引擎改动，归引擎轮候选——§4.2.3 在册）；迁移期引文 277 ⇒ 292（+15 = C1 ∕ C3 命中锚数，与 §2.17 表三数同）；候选 33562 ⇒ 33563（±1——本席折 15 行 ∕ 加标记致动，非独立项）；行数面差异 24 条两跑同值（报告态 · #546 回填工单，本席零触）。

**绕开登记 · R6（在飞批写域 · 逐档〔批名 ∕ 台账号 = 批档名〕）——届盘重读（19:3x）**：全部 2026-09-29 批 §1 状态行逐档实读——**在飞仅两他批**：`2026-09-29-desktop-rebuild-fidelity`（🔄）· `2026-09-29-desktop-residuals-round3`（🔄）；避让表其余批**均已收口** ⇒ 其声明档面随之释放（本批处置面正落其上：`TOOLS.md` ∕ `MANIFEST.md` ∕ `CORE-UNIFICATION.md` ∕ `VSC-DEBT.md` ∕ `SETTINGS.md` ∕ `WEBVIEW-INPUT.md` ∕ `WEBVIEW-PROTOCOL.md` ∕ `MULTI-INSTANCE-COLLAB.md` ∕ `SHELL.md` ∕ `E2E-TESTING.md` 等）。R6 六档零触碰（行号 = 开工基线 as-of）：

| 档（R6） | 悬空（行 → 锚） | 行宽 | 在飞批 |
|---|---|---|---|
| `docs/desktop/design/PROJECT.md` | `:86` `settings.mjs:380-408` · `:194` `agent-tools/settings.mjs` · `:353` `renderer/index.html` ∕ `renderer/i18n.mjs` · `:355` `renderer/views/settings.mjs` · `:356` `views/settings.mjs` ∕ `src/main/settings.mjs` · `:706` `renderer/index.html` ∕ `renderer/i18n.mjs` · `:707` `src/extension/settings.mjs` ∕ `agent-tools/settings.mjs` ∕ `:20` · `:708` `src/main/settings.mjs` ∕ `views/settings.mjs` · `:1370` `renderer/i18n.mjs`（15 锚 ∕ 9 行） | 16 | desktop-rebuild-fidelity ∕ desktop-residuals-round3 ∕ perf-residuals |
| `docs/desktop/design/IPC.md` | `:28` 符号 ×6（`ev` ∕ `key` ∕ `detailLines`×3 ∕ `data`）· `:268` `settings.mjs:18`（7 锚 ∕ 2 行） | 11 | desktop-residuals-round3 |
| `docs/vsc/design/WEBVIEW.md` | `:452` `T-G1` ∕ `T-G8` · `:596` `test/helpers/webview-env.mjs`（3 锚 ∕ 2 行） | 5 | desktop-rebuild-fidelity |
| `docs/desktop/design/UI.md` | — | 22 | desktop-rebuild-fidelity ∕ desktop-residuals-round3 |
| `docs/desktop/design/RENDERER.md` | — | 6 | desktop-rebuild-fidelity ∕ desktop-residuals-round3 |
| `docs/render-core/design/RENDER-CORE.md` | — | 6 | desktop-rebuild-fidelity ∕ perf-residuals |
| **计** | **25 锚 ∕ 13 行** | **66** | 随其所归批落定后复跑收口（§2.7 条件式读法） |

**记录面零触碰残差（5 行 · 逐条 · 携消解路径与到期条件——不得作常驻态）**：

| # | 位置 | 内容 | 登记依据 | 消解路径 ∕ 到期条件 |
|---|---|---|---|---|
| 1 | `docs/core/design/MULTI-INSTANCE-COLLAB.md:407` | 变更记录行（2026-09-26 批）· 锚 `thincoder-vscode/src/agent/execute-tools.mjs`（档已迁核） | doc-dangling-sweep 批 §2.6 已登记（其「零触碰 4 行」之一） | 随该档下次实质修订一并处置；或**父侧裁定覆盖「记录面不动」约束后施打** `（迁移期引文——档已迁核）`；到期 = `docs/core/design` 下一次板块级 sweep |
| 2 | `docs/core/design/PORTABILITY.md:275` | 变更记录行 · 锚 `tool-gates.mjs:78`（档已迁核） | 同上（sweep 4 行之一） | 同上 |
| 3 | `docs/core/design/TOOLS.md:1075` | 变更记录行 · 锚 `thincoder-vscode/src/agent/tool-gates.mjs`（档已迁核） | 本席同判（记录面——同族；非 sweep 在册 4 行） | 同上（施打前置 = 父侧裁定） |
| 4 | `docs/core/design/TOOLS.md:1173` | 变更记录行 · 锚 `thincoder-vscode/src/agent/execute-tools.mjs:176`（档已迁核） | 同上 | 同上 |
| 5 | `docs/core/design/VERIFY-REDESIGN.md:147` | 变更记录行（2026-09-15 B 式迁移轮）· 锚 `agent-tools/goal.mjs`（现体 = 核，改指一条即绿） | 同上 | 同上 |

**需求档上抛（14 行 · 零触碰——需求档笔 = 主 agent，D1；沿 doc-dangling-sweep §2.6 上抛先例）**：`docs/cli/requirements/CRASH-REPORTS.md:30`（`T7c`）· `docs/core/requirements/ADVISOR-CONVERGENCE.md:205`（`src/agent/execute-tools.mjs`）· `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:25`（`…/tool-gates.mjs:29-53`）· `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-CHECKLIST-REMOVAL.md:17`（`…/context-injections.mjs`）· `docs/core/requirements/MULTI-INSTANCE-COLLAB.md:32`（`…/execute-tools.mjs`）· `docs/core/requirements/PORTABILITY.md:32` ∕ `:34`（`…/tool-gates.mjs:89-91` ∕ `…/tool-gates.mjs`）· `docs/core/requirements/PROMPT-SYSTEM.md:54` ∕ `:91` ∕ `:97`（`T-CL1`×3）· `docs/core/requirements/SETTINGS-TOOL.md:71`（`T-S2.36` ∕ `T-S2.37`）· `docs/vsc/requirements/WEBVIEW.md:40`（`session-slots.mjs:180`）∥ `:75`（`T-CL9`）。**建议处置**（供父侧随笔）：用例号行 = C2 加标 `（机检豁免——用例退场登记）`；路径行（VSC 已删档族）= `（迁移期引文——档已迁核）`；`session-slots.mjs:180` = 改指 `thincoder-core/session-slots.mjs:180` 或加标（核档在位）。

**披露（本席主动 · 逐条）**：

1. **记录面约束的两面处理不对称（事实披露 · 可复裁）**：本席对「变更记录 ∕ 历史沿革」段的**用例号行**采用 C2 加标（64 行中含 13 行落该段——如 `AGENT-LOOP-SUBAGENT.md:867 ∕ :931` · `TOOLS.md:1076 ∕ :1090 ∕ :1109` · `WEBVIEW-INPUT.md:228` 等），**未**沿用 sweep 的「记录面零触碰」；理由 = ① C2 先例（`2026-09-18-doc-debt-c`）对登记 ∕ 决策 ∕ 表行同法加标、无记录面除外句；② 本批验收要求「悬空 ⊆ R6」（§2.7）；③ C2 标记为**加注不删字**（记录事实零改）。**同族路径行**（上表 5 条）则从 sweep 约束零触碰（其施打带父侧裁定前置）——两面差异如实披露（政策面统一 = 父侧另裁；本席不自行统一）。
2. **注记豁免计数跃迁（+192：107 ⇒ 299）**：行级标记既有粒度语义（标记行整行非指针锚入豁免账）——本批标记行多含多锚（如 `PORTABILITY.md:202` 单行 8 锚）；**无标记滥用**（D3 三数可核：C2 64 行 → 92 锚转绿 · C1/C3 12 行 → 迁移期引文 +15 · 改指 7 行 → 10 锚转绿；92 + 15 + 10 = 117 = Δ 消失数 ✓）。per-token 收窄 = 引擎改动（归引擎轮候选 · §4.2.3 在册）。
3. **本席自产新增红即修**：改指致动两行超宽（`VSC-DEBT.md:331` 321 · `WEBVIEW-PROTOCOL.md:288` 313）⇒ 同轮折行；终局新增红 = **0**（悬空 ∕ 行宽两集皆零新增）。
4. **只报不裁**：① `VSC-DEBT.md` §12.1 读数块**混形残留**（本批只改红 token；同块未红 token 仍 `src/…` 相对形——D4 脆弱面在册 = 台账 #388；收口 = 该档下次实质修订）；② 行数面差异 24 条（两跑同值——报告态 · #546 回填工单，本席零触）；③ `TOOLS.md` 名单形 §4.2.2 用例号定义面 = 现仓测试树全清后仅余 `bench/test/**`——「用例退场」为常态而非异常（C2 面语义前提，披露备查）。
5. **零触声明**：产品码 ∕ `scripts/**` ∕ `PROJECT-MANIFEST.json` ∕ 提示词面 ∕ `_archive/**` ∕ 参照树 ∕ R6 六档 ∕ 需求档 —— 全零触；本轮落笔面 = **25 档设计文档**（全名单见 Δ 表）+ 本档 §2；引擎 ∕ 判据零改（`scripts/doc-check*.mjs` 三档零 diff）。
6. **验收四件自检**：① 清单 A ∕ B 与逐条处置在册 ✓（本段 + `.thincoder/tmp` 存档件）；② 复跑读数 + Δ 集合差逐条 ✓（上段）；③ 零新增红 ✓（0 ∕ 0）；④ 读数与命令逐字存档 ✓（三份 txt 全文）。**归零读法（§2.7 条件式）**：悬空集合 ⊆ `R6 登记集 ∪ 记录面残差集 ∪ 需求档上抛集`（25 + 5 + 14 = 44 = 终局悬空 ✓ 无第四类）；行宽集合 = R6 登记集（66 ∕ 66 ✓）。

### 2.18 #469 后继轮 · desktop 域坐标处置（2026-09-29 · eng-designer）

**范围**：§2.15 清单 desktop 段 **7 行**（届盘实读 7/7 行，逐行处置）。避让核验先行：在飞子代理写域 = R6 六档，与本段无重叠。
**口径**：重锚 ∕ 假阳核销 ∕ 记录面零改（as-of 已在位）三分类；坐标一律以**现盘实读**为准（探针复跑 = `.thincoder/tmp/2026-09-29-doc-check-face-coords-probe.mjs` 直 import 真缝）。

| 档 | 清单行 | 处置 | 现位证据（读回） |
|---|---|---|---|
| `docs/desktop/design/E2E-TESTING.md` | :24 | 重锚 `src/main/main.mjs:55` ⇒ `:70` | :70 `app.requestSingleInstanceLock()` |
| 同上 | :28 | 重锚 `renderer/app.mjs:270/:259/:265/:273` ⇒ `:237/:224/:231/:240` | 四行 = `settleBoot("ok"/"error")` 四落点逐行实对 |
| 同上 | :40 · :76 | 重锚 `src/main/main.mjs:55-58` ⇒ `:70-73`（两处同指） | :70-73 = 单实例锁 + 非主实例静默退出块 |
| `docs/desktop/design/SHELL.md` | :132 | 重锚 `agent/dispatch.mjs:281-303` ⇒ `:179-201` | Δ-102 经 `1769287c~1` 旧版验证；现盘 :179-201 = 批审批 + 逐项审批两门 |
| 同上 | :134 | 重锚 `ledger.mjs:114` ⇒ `:117` | :117 = `buildScan` 定义行 |
| 同上 | :134 | 重锚 `manifest.mjs:334` ⇒ `:377` | :377 = `readManifest` 定义行 |

**读回复核（desktop 7/7）**：全数命中（`main.mjs:70/:70-73` · `app.mjs:224/:231/:237/:240` · `dispatch.mjs:179-201` · `ledger.mjs:117` · `manifest.mjs:377`）。
**零改登记**：清单未列的 desktop 行本轮零动（如 `SHELL.md:162/:175/:183` 的「拟新增」类 = 机器检列报·不入闸，留档在案）。
**doc-check 面（零新增红）**：`node scripts/doc-check.mjs` 二跑（工作树 = after；`cf48ba12` worktree = 基准）——desktop 面 after ✗ ≤ 基准 ✗（E2E-TESTING 6⇒1 · SHELL 9⇒4，均降）；after 独有 ✗ 条目 = **零**。

### 2.19 #469 后继轮 · vsc 域坐标处置（2026-09-29 · eng-designer）

**范围**：§2.15 清单 vsc 段 **224 行** = 7 档（PROJECT-SWITCHER 10 · VSC-MIGRATION 1 · WEBVIEW-INPUT 9 · VSC-DEBT 32 · SETTINGS 35 · WEBVIEW-PROTOCOL 91 · requirements/WEBVIEW 46）。前 6 档逐行处置完成；**requirements/WEBVIEW.md = 笔权外（需求档）⇒ 分类上抛、零触碰**。

**处置汇总（行 → 类）**：

| 档 | 行数 | 重锚（含跨档迁移） | 假阳核销 | 记录面零改（as-of 已在位） |
|---|---|---|---|---|
| PROJECT-SWITCHER.md | 10 | 10（+6 同句姊妹 = 16 编辑；设计对盘版 = `1769287c~1` 锁定） | — | — |
| VSC-MIGRATION.md | 1 | 1 | — | — |
| WEBVIEW-INPUT.md | 9 | 9（+md.js 族同值 1 = 10 编辑；迁核落点 = render-core） | — | — |
| VSC-DEBT.md | 32 | 25 编辑（+§12.3 同值 7 处） | 1（:479） | 3（:711 / :739 / :740 = 变更记录行） |
| SETTINGS.md | 35 | 23 | 8 | 4（R32–R35 = 变更记录行） |
| WEBVIEW-PROTOCOL.md | 91 | 81（76 编辑操作，含 5 组同行双行） | — | 10（R82–R91 = 变更记录行） |
| requirements/WEBVIEW.md | 46 | —（零触碰，见上抛项） | — | — |

**SETTINGS.md 假阳明细（8 行，零改）**：R3/R7/R30（`config-io.mjs:201-208` ÷ `:262-277` = 区间含 `:205`/`:272`，引文自足）；R10（`:117-136` 区间含 `:138` 发点）；R12（`:173-190` 区间含 dataset 三钮）；R18（`:22`/`:40` 两 onCancel 实对）；R20（`settings.js:47` 注释在位）；R29（`settings-agent.js:146-147`/`:181-183` 逐字实对）。
**WEBVIEW-PROTOCOL.md 处置要点**：跨档迁移 = 重锚至核（`composer/model-menu.mjs` ∕ `composer/atmenu.mjs` ∕ `composer/panel.mjs`）与 `chat-messages.js`（分发表迁出后的现位）；宿主侧 case 行全数重锚至 `panel-messages.mjs` 逐 case 现位；`:514+` = 变更记录 ⇒ R82–R91 记录面零改（`§12/§13 全表 --emit 重出`债仍挂 VSC-DEBT §10，未列行零动）。

**上抛项 · requirements/WEBVIEW.md 46 行分类（零触碰；需求档笔 = 主代理，请裁定后由主代理落笔）**：
- **假阳/已在位（4 行）**：:34 半（`config-mcp.mjs:52-54` 现位即引文）· :39 半（`turn-model.mjs:22` 在位）· :117 半（`history.js:23` 在位）· :179（`config-io.mjs:201-208` ÷ `:262-277` 区间含）。
- **记录面（1 行）**：:169（变更记录条）⇒ as-of 已在位。
- **需裁定（1 行）**：:32（F-W12 四死 handler 已随 2026-09-18 批处置退场——坐标所指对象已消；建议「已处置」注记或重锚至处置记录）。
- **重锚候选（其余约 40 行）**：跨档迁移为主（webview 族 → 核 ∕ `chat-messages.js`）；多条（如 :41 F-W16 族）行内备注已自注「原证据坐标 = 修复前时点值」收正句——证据列旧坐标待随行收正。裁决建议：按设计档同口径（重锚 ∕ 假阳核销 ∕ 记录面零改）逐行处置。

**披露登记（未列清单坐标零动）**：PROJECT-SWITCHER `:40`/`:87` · VSC-DEBT `:447`（及其 `(:17)`）等 · SETTINGS 姊妹坐标（`shell.mjs:229` ∕ `expand-home.mjs:11`）· WEBVIEW-PROTOCOL `:249` 的 `render-segments.mjs:88-93` 与 §12/§13 未列行（如 `complete`/`compress`/`error`/`models` 等）· SETTINGS R32–R35 记录面。
**doc-check 面（零新增红）**：after vs 基准（`cf48ba12` worktree）——PROJECT-SWITCHER / WEBVIEW-INPUT / WEBVIEW-PROTOCOL after ✗ = **0**；SETTINGS 9⇒5 · VSC-DEBT 24⇒13 · E2E 6⇒1 · SHELL 9⇒4（均降）；after 独有 ✗ = **1 条**（`VSC-DEBT.md:72` 行宽 304 字符——同行基准版 = 342 字符亦红 ⇒ 既存行宽红、非本轮新增；收窄未做 = 域外）。整体 FAIL(行宽) 65 行 = 全档系统态（本次未扩面处置）。
**读回复核（vsc 抽样 ≥5）**：全过——`settings.mjs:78/:85/:89/:145/:162` · `panel-messages.mjs:207/:210/:280` · `chat-messages.js:102/:240` · `model-menu.mjs:114/:304` · `panel-session.mjs:147/:262` · `session-bar.js:131/:148` · `composer/panel.mjs:321/:341` · `panel-callbacks.mjs:201/:215/:224` · `agent/setup.mjs:130`。
**存档**：探针 ∕ 扫描件 ∕ 逐档 dump = `.thincoder/tmp/469-r3/`（只读材料，供评审复核）。

### 2.20 #469 后继轮 · core 域坐标处置（2026-09-29 · eng-designer）——已完成段（ADVISOR-CONVERGENCE → CONTEXT-COMPACTION）

**范围与边界（按文件边界报回）**：§2.15 core 域段 **678 行**逐行处置；**本轮完成段 = 前 11 档 · 93 行**（零半档——完成段止于整档边界）——`ADVISOR-CONVERGENCE`(2) · `ADVISOR-GUARDS`(2) · `AGENT-PARAMS`(7) · `ANCHOR-DEBT-REPAIR`(3) · `APPLY-PATCH`(1) · `BATCH-RECORD`(1) · `CONFIG`(3) · `CONSULTATION`(3) · `AGENT-LOOP-ASYNC-POOL`(26) · `AGENT-LOOP`(22) · `CONTEXT-COMPACTION`(23)。**未处理段 = CORE-UNIFICATION 起 32+12 档 · 585 行**（清单见下「接续」）——后继轮机械接续（同判据同探针）。

**开工届盘（强义务落实）**：① 在飞批重读 = 仅两他批（`desktop-rebuild-fidelity` ∕ `desktop-residuals-round3`，均 🔄）——其写域与 `docs/core/**` **零重叠** ⇒ **core 域 R6 = 零**（避让表其余批已收口、档面 release）；② 探针复扫（变体 `.thincoder/tmp/2026-09-29-doc-check-face-coords-probe-core.mjs`——判据与源件逐字同、输出件名加 `-core` 后缀、零覆盖前轮存档）⇒ core 域 **678 行**，与 §2.15 段逐档计数一致（identity 无歧义）；开工件 = `…-469-rows-core-preround.json` ∕ `…-469-list-core.txt`。

**处置四类汇总（93 行）**：重锚 **51** · 假阳核销 **16** · as-of 加标 **18** · as-of 已在位 **8**。落笔 = **70 处行内改**（零行数变）＋ 3 处自产折行（披露 4）。

| 档 | 行 | 重锚 | 假阳 | 加标 | 已在位 |
|---|---|---|---|---|---|
| ADVISOR-CONVERGENCE.md | 2 | 1 | — | 1 | — |
| ADVISOR-GUARDS.md | 2 | 2 | — | — | — |
| AGENT-PARAMS.md | 7 | 3 | 2 | 2 | — |
| ANCHOR-DEBT-REPAIR.md | 3 | 2 | 1 | — | — |
| APPLY-PATCH.md | 1 | — | — | — | 1 |
| BATCH-RECORD.md | 1 | — | — | — | 1 |
| CONFIG.md | 3 | 1 | — | 2 | — |
| CONSULTATION.md | 3 | — | 2 | — | 1 |
| AGENT-LOOP-ASYNC-POOL.md | 26 | 13 | 5 | 4 | 4 |
| AGENT-LOOP.md | 22 | 13 | 1 | 7 | 1 |
| CONTEXT-COMPACTION.md | 23 | 16 | 5 | 2 | — |
| **计** | **93** | **51** | **16** | **18** | **8** |

**处置四件（逐行 · §2.15 原行号为 identity）**：

`ADVISOR-CONVERGENCE.md`
:133 | `discipline-normal.md:126` 不动＋加标 | 加标 | 原句已由「No round cap」句替换（§3.1 已落）——cited 为修前形态
:138 | `persona-eng-coder.md:26` ⇒ `:22`（双锚同拍：核＋docs 两份） | 重锚 | :22 实读 = `self-fix (max 5 correction rounds)` ∕ 「自修（最多 5 轮修正）」

`ADVISOR-GUARDS.md`
:21 | `run.mjs:185` ⇒ `:195` | 重锚 | :195 = `return `Advisor: review failed …``（catch 内字符串 resolve）
:369 | `cli/tui/tool-args.mjs:51` ⇒ `core/tool-args.mjs:49` | 重锚（跨档） | :49 = `case "advisor": return String(a.type ?? "review")`（B7 1a 收编迁核）

`AGENT-PARAMS.md`
:58 | `config.mjs:36` | 假阳 | :36 = `maxTurns: 200` 在位（探针 id 属同句 helpers.mjs 锚）
:59 | `config.mjs:40` | 假阳 | :40 = `goalTurns: 200` 在位
:74 | `setup.mjs:44` ⇒ `:50` | 重锚 | :50 = `overrideTurns ?? … ?? DEFAULT_MAX_TURNS` 三级回退
:89 | `vsc/advisor/compaction.mjs:33` ⇒ `core/advisor/compaction.mjs:36` | 重锚（跨档） | :36 = `export const REVIEW_TIMEOUT_MS = 600_000`
:92 | `settings-panel-write.mjs:45` ⇒ `:64` | 重锚 | :64 = `saveAgentSettingsFromPanel` 定义
:94 | `vsc/config-io.mjs:313`（AGENT_DEFAULTS）＋加标 | 加标 | 档已迁核；AGENT_DEFAULTS 概念并入核默认面
:98 | `vsc/config-io.mjs:323` 注释＋加标 | 加标 | 该登记注释未随迁（核内零对应）

`ANCHOR-DEBT-REPAIR.md`
:236a | `doc-check-anchors.mjs:147-153` ⇒ `:158-164` | 重锚 | :158 = `export function resolveFile`
:236b | `doc-check-anchors.mjs:53` ⇒ `:62` | 重锚 | :62 = `const isFile = (p) => … statSync(p).isFile() …`
:237 | `doc-check-anchors.mjs:54` | 假阳 | :54 = `SKIP_DIRS` 在位（探针取同句 `walk` 跨锚）

`APPLY-PATCH.md`：:80 | `AGENT-LOOP.md:140-141` 旧坐标 | 已在位 | 勘误登记行自述「旧坐标」零改
`BATCH-RECORD.md`：:219 | `batch-lifecycle.mjs:159` | 已在位 | 行带时点锚「as-of 2026-09-25 实读」（B 类）——现盘 :169

`CONFIG.md`
:37 | VSC `config-io.mjs:108`（$schema 注入 · 分叉描述）＋加标 | 加标 | 现注入 = 核 `config-io.mjs:74-75`（`opts.schema` 端注入）
:57 | 同上（A4 右端行为）＋加标 | 加标 | 同上
:106 | `advisor-async.mjs:168` ⇒ `:178` | 重锚 | :178 = `resolveAdvisorPoolLimit` 定义

`CONSULTATION.md`
:192 | `consult.mjs:215` | 假阳 | `runConsultChild` = :217（Δ2 窗内——探针取行尾它锚）
:194 | `consult.mjs:82` | 假阳 | `makeMainHistoryTool` = :84（Δ2 窗内）
:255 | 变更记录行（W12 收正 2026-09-15） | 已在位 | 记录面零改

`AGENT-LOOP-ASYNC-POOL.md`
:140 | `vsc/agent.mjs:41` ⇒ `core/agent-tools/async-settle.mjs:74-79` | 重锚（跨档） | :74-79 = 墓碑载体吸收（借用 ∕ 别名）
:156 | `panel-messages.mjs:216-223` ＋加标 | 加标 | 缺陷已修（af 批）——`panel-messages-turn.mjs:99-100` 注释述其退场
:213 | `run-stages.mjs:168-170`（§6.20.1 表） | 已在位 | 块头「as-of 2026-09-15 实核」——旧三行已废除
:217 | `subagent-scheduler.mjs:124` ＋加标 | 加标 | 修已落（:126-129 = discarded⇒cancelled 映射）——cited 为修前形态
:219 | `suspension.mjs:97-101` ⇒ `:113-117` | 重锚 | :113 = `export async function finishSuspension`
:226 | `async-settle.mjs:106` ⇒ `:117-119` | 重锚 | :118 = role 三元（advisor ∕ consult ∕ 其余⇒`_asyncSubagents`）
:240a | `subagent-run.mjs:186` ⇒ `:207` | 重锚 | :207 = `parent._asyncQueue.push(entry)`
:240b | `subagent-async.mjs:190` | 假阳 | :189-191 = 剔除＋重编号现形在位（探针 id 取文件名切词）
:273 | `vsc async-discard.mjs:83` | 假阳 | `parent.history.push` = :83 在位
:274a | `helpers.mjs:89` ⇒ `:121` | 重锚 | :121 = `export function escapeXml`
:274b | `async-settle.mjs:233/248` ⇒ `:244/259` | 重锚 | 两处 escapeXml 用例行实读
:275 | `vsc setup.mjs:226-227` ⇒ `vsc agent/tool-table.mjs:94-96` | 重锚（跨档） | 四态回显表（discarded 注记）——取核收编
:279 | `run-stages.mjs:168-170` ＋加标 | 加标 | 接线点①修复已落（discard 单点；原三行已废除）
:286 | `key-handler.mjs:83` ⇒ `key-handler-ctrlc.mjs:42` | 重锚（跨档） | :42 = `for (… _sessionAbortAll …) c?.abort(…)`（拆档后）
:295 | `subagent-scheduler.mjs:332-345` ⇒ `:346-362` | 重锚 | :346 = `export function refreshQueuedTokens`
:392a | `post-turn.mjs:18-21` | 假阳 | 消费块在位（:21 = `injectTimerReminders(agent, takeExpiredTimers(agent))`）
:392b | `timer.mjs:41-42` ⇒ `:55-59` | 重锚 | :55-59 = 注册块（`_pendingTimers ??=` ＋ `pending.push`）
:411 | `heap-watch.mjs:41-48`（＋`:12-13`） | 假阳 | 注入缝 :41-48 与开关注释 :12-13 均逐字在位（探针取 `timer` 泛词）
:582 | `timer-watch.mjs:47-48`（＋`:60`） | 假阳 | `modalOpen` :47-48 ∕ `busy` 门 :60 均实读在位
:596 | `statusline.mjs:167-174` ＋加标 | 加标 | 段 12 计算已提 `statusline-segments.mjs`（`timerSegment`:198）
:602 | `vsc/agent.mjs:421-429` | 已在位 | 行自述「已死——调用点 = 核 runAgent 循环」零改
:681 | `desktop/UI.md:121` ⇒ `:116` | 重锚 | :116 = 段 12 计时行（含 `ev:timer` 落点）
:682 | `desktop/IPC.md:26` ⇒ `:29` | 重锚 | :29 = `ev:timer` 事件行
:753 | `vsc/agent.mjs:197` | 已在位 | 行自述「（死坐标）⇒ 核 opts consumeQueuedInput」零改
:765 | `queued-merge.mjs:25` ⇒ `core/queued.mjs:25` | 已在位 | 变更记录行（parity-b2-queued 2026-09-29）记录面零改
:786 | `suspension.mjs:219-226` ⇒ `:236-239` | 重锚 | :236 = `if (e?.name === "AbortError" && !abortSignal?.aborted)`（消化支镜像源）

`AGENT-LOOP.md`
:34 | `explore-distill.mjs:80` ＋加标 | 加标 | 截断面已退役（行自述）；现体 = `buildCompressMessages`（:98-100）
:42 | `src/agent-tools/subagent-run.mjs:47-204` ⇒ `core …:55-223` | 重锚 | :55 = `executeAsyncSpawn`（函数全块）
:43 | `run-stages.mjs:131-140` ⇒ `:157-166` | 重锚 | :157-166 = Stop 钩子块（`runHooks("Stop", …)`）
:44 | `vsc setup.mjs:199` ⇒ `core/tools/index.mjs:53` | 重锚（跨档） | :53 = read_image 注册门（#70 收编：仅多模态注册）
:64 | `vsc config-io.mjs:319`（autoThink）＋加标 | 加标 | 死键已恢复（核 `auto-think.mjs` 已落）——cited 为归一前形态
:106 | `parkAsyncPending`（`async-settle.mjs:116-122`）⇒ `:127-133` | 重锚 | :127 = `export function parkAsyncPending`
:114 | `advisor-settle.mjs:42-49` | 假阳 | 书写点块（jsdoc→`agent._mutLog ??= []`）在位
:119 | `vsc/agent.mjs:36-40` ⇒ `vsc panel-turn-loop.mjs:79` | 重锚（跨档） | :79 = 载体字段表（含 `_childUpstream` ∕ `_childUpstreamSeq`）
:143 | `core/agent.mjs:237` ⇒ `chat-call.mjs:35` | 重锚（跨档） | :35 = `streamRules: agent.config.agent?.streamRules ?? []` 透传
:155 | `vsc config-io.mjs:319`（D2 行）＋加标 | 加标 | 同 :64
:225 | `vsc/agent.mjs:197` 邻位 ＋加标 | 加标 | VSC depth-0 循环已随取核退役（2026-09-29 parity-b1）
:262 | `core/agent.mjs:366-376` ⇒ `turn-loop.mjs:187` | 重锚（跨档） | :187 = `pushReal(agent, assistantToolCallMessage(…))` 核单点
:344 | `core/agent.mjs:233-234` ⇒ `turn-loop.mjs:66` | 重锚（跨档） | :66 = `agent._currentTurn = frame.turn`
:433 | `subagent-spawn.mjs:112` ⇒ `:100` | 重锚 | :100 = `export function resolveDesignSlot`
:435 | `subagent-actions.mjs:441` ⇒ `:205` | 重锚 | :205 = `… onPermissionRequest: parent.autoApprove ? …`（三读点制一）
:439 | `vsc/agent.mjs:387-397`（「迁移前」站点） | 已在位 | 行自述「迁移前」——端壳零第二站点零改
:441 | `webview/activity-view.js:91-95` ＋加标 | 加标 | activity-view 已退役（现残档 3 行）
:442 | `helpers.mjs:205` ⇒ `:237` | 重锚 | :237 = `export class ContinueError extends Error`
:446 | `vsc setup.mjs:281`（scopedRulesBlock）＋加标 | 加标 | 回合域 overlay 已迁 `./turn-domains.mjs`（现 :281-282 = composeTurnDomain 推送）
:568a | `subagent-spawn.mjs:112` ⇒ `:100` | 重锚 | 同 :433（同值同拍）
:568b | `subagent-async.mjs:411` ⇒ `:430` | 重锚 | :430 = `export function mergeChildMutations`
:596 | `core/agent.mjs:366-376`（advisor 镜像面）＋加标 | 加标 | 核三拆后档面收窄（现 agent.mjs 106 行）——镜像面归 advisor 面

`CONTEXT-COMPACTION.md`
:161 | `panel-chat.mjs:255-257` ⇒ `:251` | 重锚 | :251 = `runTurnLoop(panel, {… history, fullHistory …})`（消费点）
:175 | `context.mjs:61` ⇒ `:18` | 重锚 | :18 = `export const SUMMARIZE_PROMPT`
:212 | `context.mjs:387-400` ⇒ `explore-distill.mjs:98-100` | 重锚（跨档） | 序列化构造 = `buildCompressMessages`
:213 | `agent.mjs:230` ⇒ `chat-call.mjs:25-28` | 重锚（跨档） | :28 = `messages, tools: toolSchemas,`
:253 | `agent.mjs:184-190` ⇒ `:86-93` | 重锚 | :86 destructure ＋ :93 透传 `runTurnLoop`
:256 | `google.mjs:101-102`（tool_choice 映射） | 假阳 | :101-102 就位（`toolConfig` 映射行——探针取泛词 `mode`）
:262 | `context.mjs:399-410` ⇒ `:313-315` | 重锚 | :315 = `tools: extras?.tools,`（落地面已实施）
:292 | `provider/core.mjs:211` ⇒ `:222` | 重锚 | :222 = `tools?.length` 门（不发 `body.tools`）
:314 | `config.mjs:137` ⇒ `:128` | 重锚 | :128 = `enable_thinking` 派生字面首判
:322 | `context.mjs:495-497` ⇒ `:437-440` | 重锚 | :437-440 = explore-distill 迁出再导出块
:340 | `trace-store.mjs:22-24` | 假阳 | 完整落盘句 :21-22 在位（写入面现 = :261——同句姊妹留档）
:343 | `context.mjs:423` ⇒ `:327-331` | 重锚 | :327-329 = blank-summary 守卫注释 ＋ :331 = `applyCompression` 调用
:363 | `agent.mjs:230` ⇒ `chat-call.mjs:25-28` | 重锚（跨档） | 同 :213
:545 | `render-loop.mjs:89-90` | 假阳 | ctxCache 计算行 :89-90 逐字在位
:548a | `specs.mjs:84-88` | 假阳 | `ctxPercentForHistory` = :85-88（Δ1 窗内）
:548b | `render-frame.mjs:396-397` ⇒ `:413-415` | 重锚 | :413 = `ctxPct` 赋值 ＋ :415 = `ctxPct > 0` 渲染门
:567 | `setup-tooltable.mjs:262-273` ＋加标 | 加标 | 档已收窄（现 104 行）——家族段调用归核 ∕ tool-table 面
:575 | `read-history.mjs:172-197` ⇒ `:192-222` | 重锚 | :192 = 跨会话深查段（`path=` 取回面）
:588 | `session.mjs:141` ⇒ `:148` | 重锚 | :148 = `agent._slot ??= activeSlot(agent.cwd)`（粘性缓存）
:591 | `read-history.mjs:172-197` ⇒ `:192-222` | 重锚 | 同上（同值同拍）
:699a | `vsc/agent.mjs:106` ＋加标 | 加标 | VSC 主循环已随取核退役——cited 为共享数组契约期形态
:699b | `core/agent.mjs:231-236` ⇒ `turn-loop.mjs:87-93` | 重锚（跨档） | :87-93 = 循环头安全点（`chat()` 前）
:703 | `family-tools.mjs:141/150-151` | 假阳 | `depthOnly` 段（:141）＋ read_history 注释（:150-151）实读在位

**复核腿（抽样 ≥5 · 分层：重锚 ∕ 加标 × 档域）**：**12 条 · 12/12 PASS**（脚本 = `.thincoder/tmp/469-core-verify.mjs`）——`ADVISOR-CONVERGENCE:138→persona-eng-coder.md:22` · `ADVISOR-GUARDS:21→run.mjs:195` · `AGENT-PARAMS:74→setup.mjs:50` · `AGENT-PARAMS:94`（标记） · `ANCHOR-DEBT-REPAIR:236→doc-check-anchors.mjs:158` · `ALAP:140→async-settle.mjs:74-79`（目标侧核 = :73 `writeTombstone` 定义——初跑一条 check 期望值笔误已修正复跑 PASS） · `ALAP:217`（标记） · `AGENT-LOOP:262→turn-loop.mjs:187` · `AGENT-LOOP:596`（标记） · `CONTEXT-COMPACTION:175→context.mjs:18` · `CONTEXT-COMPACTION:699→turn-loop.mjs:87-93` · `CONFIG:106→advisor-async.mjs:178`。

**doc-check 面（本席面零新增红 · 集合差全量）**：三跑存档 `…-core-before.txt` ∕ `…-after.txt` ∕ `…-after2.txt`（after2 = 折行修正后终读）。终读 vs 开工：FAIL 行集 **420 ⇒ 420 净零**；逐行集合差新增 34 ∕ 消失 34 —— **全部非本席语义新增**：① `AGENT-LOOP.md` 2 条既存红因本席折行 +1 位移（同锚同档：`:144⇒:145` ∕ `:433⇒:434`）；② `docs/desktop/design/PROJECT.md` 32 条 = **R6 在飞批并发写入**（desktop-rebuild-fidelity ∕ desktop-residuals-round3 正写该档——行位漂移 + 行宽新红；非本席笔）。悬空 **30 ⇒ 30** · 行宽集合净零——本席 11 档内零新增红。

**披露（逐条）**：
1. **判据口径（四类裁定规则——承 §2.12 四类，本席就地定形）**：**重锚** = 引文元素存活性后继已定位（含跨档迁移 ⇒ 现盘路径 + 行号改写）；**假阳核销** = 引文元素在 coord±2 窗内（探针 id 跨锚 ∕ 泛词 ∕ 文件名切词——坐标实核正确，零改）；**as-of 加标** = 对象已退役 ∕ 形态已演化（号不动、加 `（as-of 2026-09-29）` 标注）；**已在位** = 行自述旧 ∕ 死 ∕ 迁移前 ∕ 带时点锚，或变更记录面——零改。
2. **未列行零动（同句裸坐标与本轮未触行）**：`…:240-241`（CONTEXT-COMPACTION:213 ∕ :363 姊妹）·`:202-219`（:591 姊妹）·`checkAndCompact:203-207`（:699a 姊妹）·`同档 :61-72`（AGENT-LOOP:106 姊妹）·`:112`–`:116`（AGENT-PARAMS:92 姊妹——核实仍在位）等——逐条留档，后继轮同法接续。
3. **探针边界**：本轮探针 = `-core` 变体（输出 `…-469-rows-core.json ∕ -list-core.txt`，不覆盖源件 `…-469-rows.json ∕ -list.txt` 前轮存档）；复扫（终读）判面 1112 ∕ 在场 921 ∕ 漂移 798 ∕ 失据 314（开工 1151 ∕ 887 ∕ 833 ∕ 318——**清除 39 行**；余量 = 完成段 as-of ∕ 已在位 ∕ 假阳类按设计保留 + 未处理段 585 行原样）。
4. **本席自产新增红即修**：3 处折行（`ALAP:140` ∕ `:217`、`AGENT-LOOP:119`——行内分句断行零语义）——修后 FAIL 集回归净零。
5. **验收自检（本段）**：① 完成段四件全量在册（93/93 一行一录，零缺行）✓；② 抽样 12/12 PASS ✓；③ 零未标注不一致（as-of ∕ 已在位 ∕ 假阳逐条带由；残余行 = 设计保留）✓；④ doc-check 本席面零新增红 ✓（见上）。

**接续（未处理段清单 · 后轮机械接续同一清单）**：
- design（30 档 · 561 行）：CORE-UNIFICATION 53 · DESIGN-TOKEN-SETTLEMENT 11 · DOC-CODE-RECONCILE 9 · DOC-DISCIPLINE 35 · DOC-MIGRATION 16 · DOC-SYSTEM 2 · ENG-TOKEN-BINDING 5 · ENGINEERING-MODE-V2 9 · ESCALATE 6 · HASHLINE-EDIT 2 · INSERT-AFTER 2 · MANIFEST 22 · MCP 1 · MEMORY 14 · MODEL-BENCH 37 · MODEL-SPECS 72 · MULTI-INSTANCE-COLLAB 8 · PORTABILITY 12 · PROMPT-SYSTEM 2 · PROVIDER 16 · PROXY 4 · SEND-STALL-DISTILL 11 · SESSION 42 · STRUCTURE-DEBT 1 · TOOL-OUTPUT-LIMITS 10 · TOOLS 46 · TRACES 3 · TURN-CAP-CONTINUE 17 · VERIFY-REDESIGN 2 · WRITE 1；
- requirements（12 档 · 24 行）：AGENT-LOOP 2 · AGENT-PARAMS 1 · DESIGN-TOKEN-SETTLEMENT 2 · EM-V2-SPEC-BATCH-SEGMENT 1 · EM-V2-SPEC-CHECKLIST-REMOVAL 2 · EM-V2 1 · MEMORY 1 · NORMAL-MODE 1 · SEND-STALL-DISTILL 2 · SESSION 1 · TOOLS 6 · TURN-CAP-CONTINUE 4。

**存档（`.thincoder/tmp/`）**：`469-core/`（55 档 view ∕ dump ∕ `_index.txt`）· 探针变体 ∕ preround 行件 ∕ 复核脚本 `469-core-verify.mjs` · doc-check 三跑 txt。

**零触声明**：产品码 ∕ `scripts/**` ∕ 提示词面 ∕ requirements 档 ∕ R6 七档 ∕ `_archive` ∕ `docs/desktop/**` —— 全零触；本轮落笔面 = **11 档设计文档**（70 处行内改 + 3 折行）+ 本档 §2；引擎 ∕ 判据零改。

### 2.21 #469 后继轮 · core 域坐标处置 · 续段第 2 轮（21 档 · 146 行）（eng-designer · 2026-09-29）

**范围（止于整档边界——零半档）**：§2.15 core 段余下部分之续段，本轮完成 **21 档 · 146 行**：TRACES 3 · WRITE 1 · VERIFY-REDESIGN 2 · STRUCTURE-DEBT 1 · MCP 1 · HASHLINE-EDIT 2 · INSERT-AFTER 2 · ESCALATE 6 · PROXY 4 · DOC-SYSTEM 2 · PROMPT-SYSTEM 2 · ENG-TOKEN-BINDING 5 · ENGINEERING-MODE-V2 9 · DOC-CODE-RECONCILE 9 · DOC-MIGRATION 16 · SEND-STALL-DISTILL 11 · MANIFEST 22 · MULTI-INSTANCE-COLLAB 8 · PORTABILITY 12 · DESIGN-TOKEN-SETTLEMENT 11 · TURN-CAP-CONTINUE 17。

**开工届盘（强义务）**：在飞批逐档实读 = 两他批（`desktop-rebuild-fidelity` ∕ `test-knowledge-prompts`——均 🔄；后者写域 = 提示词双面 `thincoder-core/prompts/**` ∕ `docs/core/design/prompts/**`，与本段零文件重叠）⇒ **core 域 R6 = 零**。探针 = `-core-r2` 变体（判据与源件逐字同；输出 `…-469-rows-core-r2.json` ∕ `…-list-core-r2.txt`——零覆盖前轮存档）；段内计数 **585** 与 §2.20 头行「32+12 档 · 585 行」identity 一致。

**口径（承 §2.12 ∕ §2.20 四类 + 判例两条）**：四类 = 重锚 ∕ 假阳核销 ∕ as-of 加标（`（as-of 2026-09-29）`）∕ 已在位。判例：① 节 ∕ 档级 as-of 标注**不豁免**活引核收正（先例 = §2.18 SHELL.md 档级 as-of 仍重锚 · §2.20 ANCHOR-DEBT-REPAIR 带日期块仍重锚）；② 行级自述（旧 ∕ 死 ∕ 迁移前 ∕ 三拆前 ∕ 实核日期 ∕ 变更记录）或清单自带 as-of 声明 ⇒ 已在位零改（先例 = §2.17 BATCH-RECORD:219「B 类」）。

**处置四件（逐行 · 一行一录）**

`docs/core/design/TRACES.md`（3）
- :80 | `:284` ⇒ 已在位 | 行带时点锚「实测 · 2026-09-21」——所绘为修前形态（清理实现已外提 `trace-cleanup.mjs`）
- :90 | :103 ⇒ :106 | 重锚 | :106 = `_resetTraceStateForTest` 定义（含节流窗复位）
- :91 | `bin/thincoder.mjs:312-313` ⇒ `command-table.mjs:93-94` | 重锚（跨档） | bin 拆档——`case "tui": case undefined:` 现位逐字命中

`docs/core/design/WRITE.md`（1）
- :45 | `file.mjs:43` ⇒ 假阳核销 | :43 = `export { … recordWrite, lastWriteOf … } from "./write-path.mjs"` 逐字在位（探针 id 跨锚）

`docs/core/design/VERIFY-REDESIGN.md`（2）
- :71 | :76 ⇒ :80 | 重锚 | :80 = `hasCodeMutations(agent) && guardPushbacks < MAX_VERIFY_PUSHBACKS`（code-mutations 层消费点）
- :72 | :142 ＋ 加标 | as-of 加标 | 端档已迁核——`rejectionReport` 全仓零命中；表内先例 = 本表 :73 迁移期引文

`docs/core/design/STRUCTURE-DEBT.md`（1）
- :33 | :189 ⇒ :200（＋同值同拍 :36） | 重锚 | :200 = `export function settleAsyncEntry`

`docs/core/design/MCP.md`（1）
- :212 | 已在位 | 变更记录行（2026-09-15 VSC 轮并入）——记录面零改

`docs/core/design/HASHLINE-EDIT.md`（2）
- :52 | :380 ⇒ :384 | 重锚 | :384 = `export const hashlineEditTool = {`
- :53 | :376 ⇒ :380 | 重锚 | :380 = `export function hashLine(content) {`

`docs/core/design/INSERT-AFTER.md`（2）
- :53 | :280 ⇒ :284 | 重锚 | :284 = `export const insertAfterTool = {`
- :54 | :305 ⇒ :309 | 重锚 | :309 = `const lw = lastWriteOf(abs)`

`docs/core/design/ESCALATE.md`（6）
- :104 | :341 ⇒ :47 | 重锚 | :47 = `if ((ctx.depth ?? 0) > 0) {`
- :106 | :423 ⇒ :194 | 重锚 | :194 = `runWithContinue(` 调用点
- :107 | async :190 ⇒ :195 · 同步 :403 ⇒ :165 | 重锚 | :195 ∕ :165 = async ∕ 同步 `createAgent(`
- :107 | :138 ⇒ 假阳核销 | def :139 ∈ 138±2 窗（Δ1）
- :107 | `:411` ⇒ `:430` | 重锚 | :430 = `export function mergeChildMutations`
- :109 | `tool-events.mjs:227-238` ⇒ 假阳核销 | escalate#N no-preview 区块（:236-238）∈ cited 范围；行带迁移期引文标记

`docs/core/design/PROXY.md`（4）
- :43 ∕ :115 | `thincoder-cli/docs/design/PROXY.md:32` ⇒ `thincoder-cli/docs/_archive/design/PROXY.md:32`（两处） | 重锚（跨档——路径目录变更） | 归档档 :32 = 「CONNECT 隧道内的 TLS 握手使用 `rejectUnauthorized: false`」逐字
- :70 | :104 ⇒ :112（＋同句姊妹 :109–:114 ⇒ :118–:122） | 重锚 | :112 = `async function proxyMenu()`；菜单项 = :118–:122
- :80 | :199 ⇒ :204 · 调用 :313 ⇒ :323 | 重锚 | :204 = `export function normalizeProxy`；:323 = `merged.proxy = normalizeProxy(merged.proxy)`

`docs/core/design/DOC-SYSTEM.md`（2）
- :344 | 已在位 | 决策记录表行（含实核自注）——记录面零改
- :396 | 已在位 | 变更记录行（本批 §2.11 落）——记录面零改

`docs/core/design/PROMPT-SYSTEM.md`（2）
- :115 | ＋ 加标 | as-of 加标 | 端档已归档（`src/prompts/discipline-engineering.md` 退役）——号不动＋标注
- :169 | :221-229 ⇒ :238-246 · :214 ⇒ :231 | 重锚 | :238-240 = 项目指令追加块；:231 = `_spawnSystemBlock` 拼接行

`docs/core/design/ENG-TOKEN-BINDING.md`（5）
- :92 | :42 ⇒ 假阳核销 | :42 = `export function tokenExpiryMs` 在位（探针词界误判——`tokenExpiry` 为前缀简写）；:55 = `tokenExpired` 在位
- :95 | :74 ⇒ :92 | 重锚 | :92 = `purgeExpiredDesignTokens(ctx.agent)` 调用点
- :96 | :112 ⇒ :100 · :158-169 ⇒ :277 · :152 ⇒ :140 | 重锚 | :100 = `resolveDesignSlot` 定义；:277 = `if (expiredReject) removeDesignTokenSlot(…)`；:140 = `executeConsumeDesignAction` 定义
- :97 | :304 ⇒ :53 · :491 ⇒ :182 | 重锚 | :53 = `_engDesignTokens` 惰性声明；:182 = `setSlotEngDesignTokens(…)` 回合尾 flush
- :100 | `setup-tooltable.mjs:85-94` ⇒ 假阳核销 | 单槽写缝块 :85-94 逐字在位（探针 id 跨锚）

`docs/core/design/ENGINEERING-MODE-V2.md`（9）
- :81（×2） | 已在位 | 块头 as-of + 行自述「死指针」——现状勘察摘要（M7 已完成）零改
- :353 | :184-186 ⇒ 假阳核销 | 固定段裁剪三元式 :184-186 逐字在位
- :363 | `mode-buttons.js:16-23` ⇒ `thincoder-render-core/composer/controls.mjs:76-89`（＋点击守卫 :35-39 ⇒ :103-109） | 重锚（跨档） | :87 = `planBtn.disabled = _engOn === true`；:88 = title；:105 = 点击守卫
- :371 | :44-48 ⇒ 假阳核销 | 工程 role enum 块 ≈ :45-51（range-head Δ1；探针 id 泛词）
- :377 | 已在位 | 形态已演化——VSC 已补传 `engineering`（现装配入参 :194 含之）；行 = 设计期端差分析零改
- :379 | :341-344 ⇒ :328-331 | 重锚 | :328 = `engineeringRole` 判定；:330 = `engineering: true` 强制位
- :381 ∕ :383 | `image-handler.mjs:84` ⇒ `thincoder-core/vision-reader.mjs:68-70`（两处） | 重锚（跨档） | :68 = 子代理构建；:70 = `runAgent(child, task, {}, { depth: 1, maxTurns: 10 … })`

`docs/core/design/DOC-CODE-RECONCILE.md`（9）
- :198 | `bin/thincoder.mjs:42` ⇒ 假阳核销 | 包装判行 :44 ∈ 42±2（Δ2）
- :230 ∕ :240 ∕ :241 ∕ :242（×2） ∕ :243 ∕ :263 | 已在位 | 对账处置记录（「重锚结论」∕「已实核」∕「登记」状态词）——记录面零改
- :316 | `bin/thincoder.mjs:300` ⇒ `thincoder-cli/src/command-table.mjs:93-94` | 重锚（跨档） | `case "tui":` 拆档后现位（:242 同行单点同拍）

`docs/core/design/DOC-MIGRATION.md`（16）
- :52（×3） | config.mjs:63 ∕ subagent-async:94 ∕ advisor-async:168 ⇒ 假阳核销 | 三处逐字 ∕ Δ1 在位（poolLimits 三键 ∕ `poolLimitsFor` 定义 ∕ 池上限注释）
- :232 | `CORE-UNIFICATION.md:411-412` ⇒ 假阳核销 | S2/S3 阶段行在位（S3 行 ∈ cited 范围）
- :237 | 已在位 | 台账腿审计记录行——记录面零改
- :369（×4）∕ :370（×5）∕ :372（×2） | 已在位 | 逐族明细清单**自带 as-of 声明**（「行号 as-of 2026-09-18 05:0x；其中 5 处坐标随他笔漂移——S0 复跑时对齐」）——零改

`docs/core/design/SEND-STALL-DISTILL.md`（11）
- :53 ∕ :92 | `panel-callbacks.mjs:187-189` ⇒ `:242-245`（两处） | 重锚 | :242 = `onDistilled: () => {`；:243 = 槽守卫；:244 = `_saveLines`；:245 = 静默 catch
- :54 ∕ :92 ∕ :145 | `tool-events.mjs:395` ⇒ `:402`（三处） | 重锚 | :402 = `onDistilled: () => {`
- :57 | `panel-callbacks.mjs:115-116` ⇒ 假阳核销 | 装配 jsdoc 头在位（Δ1——:117-118 = onComplete 捕获 → onDistilled 读逐字）
- :87 | `turn-loop.mjs:170-180` ⇒ 假阳核销 | 轮末发射块 :170-180 逐字在位（:179 = `_pendingDistill = distill`）
- :87 | `run-stages.mjs:261` ＋ 加标 | as-of 加标 | 端档已迁核（VSC run-stages 退役）——`fireEndOfRunDistill` 无现位
- :87 | `agent.mjs:341-348` ⇒ 已在位 | 行自述「三拆前」
- :88 | `panel-chat.mjs:157` ⇒ `:150` | 重锚 | :150 = `panel._distillState ??= { pending: null }`
- :93 | `agent-turn.mjs:29` ⇒ `:33` | 重锚 | :33 = `const DISTILL_FLUSH_TIMEOUT_MS = 5000`
- :153 | 已在位 | 变更记录行（2026-09-15 并入批）——记录面零改

`docs/core/design/MANIFEST.md`（22）
- :128 ∕ :139 ∕ :459 | `session.mjs:314-317` ⇒ `session-lifecycle.mjs:86`（三处） | 重锚（跨档） | :86 = `export function applySession`（session.mjs 现为转口）
- :135 ∕ :237 | `session.mjs:52-55` ⇒ `:44`（两处） | 重锚 | :44 = `writeEndMarker` re-export 行
- :135 ∕ :237 | `session-slots.mjs:478-497` ⇒ `:139`（两处） | 重锚 | :139 = `export function writeEndMarker`
- :143 | 已在位 | 行内自带「as-of 2026-09-18 02:2x 实读」——零改
- :229 | `make-agent.mjs:51-52` ⇒ 已在位 | 设计期例证（壳面文案同款）——未逐点复核（披露 2）
- :235 | `session.mjs:311-317` ⇒ `session-lifecycle.mjs:86` | 重锚（跨档） | 同上
- :235 | `cmd-eng.mjs:61-78` ⇒ `:93-104` | 重锚 | :93 = `async function persistEngineering`（只写槽不镜像 config）
- :236 | 已在位 | 行带迁移期引文标记（#435 落）——零改
- :276 | `ledger-db.mjs:31` ⇒ `:51` | 重锚 | :51 = `const root = resolveProjectRoot(cwd) ?? …`
- :291 | `write-gate.mjs:33` ⇒ `:41` | 重锚 | :41 = `const REVIEW_ROOT_KEYS = […]`
- :342 | 已在位 | 行自述「坐标 as-of」——零改（statSync 已不在该档——披露）
- :391 | `write-gate.mjs:43-56` ⇒ 假阳核销 | def :53 ∈ cited 范围；「改」已落（:61 逐键 `docRootPaths`）
- :392 | `advisor.mjs:121-131` ⇒ `:135-142` | 重锚 | :142 = `roots.some(…)` 消费
- :393 | `batch-segment.mjs:80-86` ⇒ `batch-paths.mjs:105` | 重锚（跨档） | :105 = `export function resolveBatchDocPath`（batch-segment 现为全转口）
- :442 | `write-gate.mjs:50` ⇒ `:56` · `batch-segment.mjs:83` ⇒ `batch-paths.mjs:34` | 重锚 | :56 = `readManifest(cwd)`；:34 = `readManifest(base)`
- :444 | `manifest.mjs:249-251` ⇒ `:474` | 重锚 | :474 = `if (writer !== "main") {`
- :448 | `session.mjs:472-487` ⇒ `session-lifecycle.mjs:323` | 重锚（跨档） | :323 = `export function switchToSlot`
- :462 | `acp.mjs:236` ＋ 加标 | as-of 加标 | acp.mjs 已拆 `acp/*.mjs`——精确落点未定位（披露 2）

`docs/core/design/MULTI-INSTANCE-COLLAB.md`（8）
- :54 ∕ :217 | `process-probe.mjs:118` ⇒ `process-probe-exec.mjs:96`（两处） | 重锚（跨档） | :96 = `export function batchAlive`（拆档——process-probe.mjs 现为转口）
- :56 | `process-probe.mjs:168` ⇒ `process-probe-exec.mjs:146` | 重锚（跨档） | :146 = `export function probeCmdlines`
- :176 | `peer-claims.mjs:119` ⇒ `:33` | 重锚 | :33 = `pathsOverlap as claimsOverlap`
- :208 | `session-slots.mjs:128` ⇒ `:154` | 重锚 | :154 = `export function writeSessionFile`
- :210 | `peer-domains.mjs:109-116` ⇒ 假阳核销 | 必填字段校验块 :109-111 ∈ cited 范围
- :264 | `process-probe.mjs:48` ⇒ `process-probe-exec.mjs:26` | 重锚（跨档） | :26 = `export function _setProcessProbeTestImpl`
- :283 | `config.mjs:29` ⇒ 假阳核销 | `export { writeConfigAtomic }` 逐字在位

`docs/core/design/PORTABILITY.md`（12）
- :33 | `dispatch.mjs:204` ⇒ `:98` | 重锚 | :98 = `paths.some((p) => typeof p !== "string" || isCodePath(p, conv))`
- :35 | `repos.mjs:122` ⇒ `:118` · `:146` ⇒ `:128` | 重锚 | :118 = `hasCodeMutations`；:128 = `isDocOnlyChange`
- :67 | `conventions.mjs:221` ⇒ `:272` | 重锚 | :272 = `export function loadProjectDeclaration`
- :68 | `conventions.mjs:197` ⇒ `:247` | 重锚 | :247 = `export function clearDeclarationCache`
- :69 | `conventions.mjs:98` ⇒ `:143` | 重锚 | :143 = `export function classifyPath`
- :70 | `:108` ⇒ `:153` · `:114` ⇒ `:159` · `:54` ⇒ `:60` | 重锚 | isCodePath ∕ isDocPath ∕ isTempPath 定义位
- :71 | `conventions.mjs:124` ⇒ `:170` | 重锚 | :170 = `export function isAuxPath`
- :72 | `conventions.mjs:192` ⇒ `:242` | 重锚 | :242 = `export const DEFAULT_DECLARATION = buildDeclaration(null)`
- :136 | 已在位 | 「实核」自述 + 迁移期引文标记——零改
- :140 | 已在位 | 行自述「W4 已迁核（现体 = 核 conventions.mjs）」——零改
- :144 | `run-helpers.mjs:70` ⇒ `:15` | 重锚 | :15 = `hasCodeMutations` 换源 import 行
- :160 | 已在位 | 行带迁移期引文标记——零改

`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（11）
- :24 ∕ :75 | `session-guard.mjs:26` ⇒ `:35`（两处） | 重锚 | :35 = `guardForeignSlotFile`
- :31 ∕ :71 ∕ :96 | `subagent-spawn.mjs:112` ⇒ `:100`（三处） | 重锚 | :100 = `export function resolveDesignSlot`
- :39 | `token-ttl.mjs:270` ⇒ `:271` | 重锚 | :271 = `engTokenSlotFields` 序列化点（legacy 落盘自然删除）
- :45 | `subagent-spawn.mjs:177` ⇒ `:165` · `:179` ⇒ `:167` | 重锚 | :165 = `removeDesignTokenSlot(…)`；:167 = `persistEngTokens(parent)`
- :46 | `subagent-spawn.mjs:140` ⇒ 假阳核销 | 契约注释 :126-139 + def :140 在位（探针取它锚）
- :95 | 已在位 | 行自述「W12 已迁核……原 :389 已删」——记录面零改
- :99 | `agent-state.mjs:70-71` ⇒ 假阳核销 | 一次性迁移读块 :70-71 逐字在位
- :100 | `subagent-spawn.mjs:152` ⇒ `:140` | 重锚 | :140 = `executeConsumeDesignAction` 定义
- :104 | `session-slot-write.mjs:152-153` ⇒ `:172-173` | 重锚 | :172-173 = 「新铸者胜（token 尾 expiresAt 大者）」规则注释

`docs/core/design/TURN-CAP-CONTINUE.md`（17）
- :19 | `thincoder-vscode/src/agent.mjs:54` ⇒ 核 `thincoder-core/agent.mjs:85` | 重锚（跨档——VSC 端壳退役〔parity-b1〕） | :85 = `runAgent` 签名（含 `resume`）
- :22 | `panel-turn-loop.mjs:142-152` ＋ 加标 | as-of 加标 | depth-0 直弹卡坐标未逐点重定位（披露 2）
- :22 | `agent-turn.mjs:203-224` ＋ 加标 | as-of 加标 | 同上
- :24 | `panel-callbacks.mjs:279` ⇒ 假阳核销 | :279 = `cbs.onPermissionRequest = …`；:280-281 = continue 排除注释逐字
- :40 | `subagent.mjs:293-314` ⇒ 假阳核销 | `enqueueAsk(parent, "_permQueue", …)` :313 ∈ cited 范围
- :43 ∕ :65 | `agent-turn.mjs:195-201` ⇒ `:228-235`（两处） | 重锚 | :233 = capStop 行；:234 = result；:235 = break
- :53 | `agent.mjs:220-222` ⇒ 已在位 | 行自述「三拆前」
- :63 | `subagent-actions.mjs:293` ⇒ `:46` | 重锚 | :46 = `executeSendAction` 定义
- :64 | `subagent-actions.mjs:99` ⇒ `:36` | 重锚 | :36 = status∕observe 转口行（`subagent-actions-query.mjs`）
- :69 | `render-frame.mjs:381-382` ⇒ `:393-394` | 重锚 | :393-394 = 状态行读 `_currentTurn` ∕ `_maxTurns`
- :80 | `subagent-async.mjs:174` ⇒ 假阳核销 | :174 = `cancelAsyncSubagent` 定义逐字在位
- :90 ∕ :91 | 已在位 | 行带实核日期（2026-09-26）——零改（VSC agent.mjs 已于 2026-09-29 退役〔parity-b1〕——登记）
- :92 | `run-helpers.mjs:28` ⇒ `:14` | 重锚 | :14 = `turnFrame` 转口行
- :98 | `panel-turn-loop.mjs:128-135` ⇒ `:246-253` | 重锚 | :251 = `postDigestCap(panel, "stop", …)`；:252-253
- :202 | `agent.mjs:439` ⇒ `turn-loop.mjs:87` | 重锚（变更记录行内单点改指——披露 3） | :87 = `consumeInjected?.(agent)`

**落笔**：行内坐标 ∕ 串替换（零行数变 · 零语义外改），逐行见上；未列行零动。

**披露（逐条）**
1. **VSC 端壳退役面（2026-09-29 parity-b1）**：TURN-CAP-CONTINUE 的 VSC `agent.mjs` 引核（:19 ∕ :90 ∕ :91）中 :19 已收正至核；:90 ∕ :91 行带 2026-09-26 实核日期按「已在位」零改（登记在案）。
2. **未逐点重定位面（加标兜底）**：TURN-CAP :22（×2）· MANIFEST :462 · MANIFEST :229 —— `（as-of 2026-09-29）`∕已在位标注 + 在此登记。
3. **记录面单点改指（TURN-CAP :202 行内）**：变更记录行内 `agent.mjs:439` 收正为 `turn-loop.mjs:87`（改善性改指——行内其余定值保留原样；披露备查）。
4. **同句姊妹未列坐标零动**（承 §2.20 披露 2）：PROXY :71 ∕ :72 · ESCALATE :110 · EM-V2 :377 姊妹（:125-191 ∕ :267）· MANIFEST :133-134 等——逐条留档。
5. **探针边界**：本轮探针 = `-core-r2` 变体（输出件加 `-r2` 后缀——零覆盖前轮 `-core` 存档）；复扫读数见 §2.22。
6. **§2.20 接续清单计数瑕（一致性面——登记）**：§2.20「接续」清单记「design 30 档 · 561 行」并漏列 `AGENT-LOOP-SUBAGENT`(43) ∕ `AGENT-LOOP-UPSTREAM`(47) 两档名（其行数已含于 561；§2.20 头行「32+12 档 · 585 行」为准）。本轮段内 585 行 identity 与头行一致；该两档之处置 = 后继轮（本轮未及）。

**接续（未处理段 · 后继轮机械接续同判据同探针）**
- design 剩余 **11 档 · 415 行**：DOC-DISCIPLINE 35 · MEMORY 14 · TOOL-OUTPUT-LIMITS 10 · MODEL-BENCH 37 · MODEL-SPECS 72 · PROVIDER 16 · SESSION 42 · TOOLS 46 · CORE-UNIFICATION 53 · AGENT-LOOP-SUBAGENT 43 · AGENT-LOOP-UPSTREAM 47；
- requirements **12 档 · 24 行**：笔权外（主 agent）——零触 + 分类上抛（随收口轮）。

### 2.22 #469 续段第 2 轮 · 收口（终读 ∕ 集合差 ∕ 抽样 · +TOOL-OUTPUT-LIMITS ∕ MEMORY ∕ PROVIDER）（eng-designer · 2026-09-29）

**本席轮合计（§2.21 + 本节）**：**24 档 · 186 行**处置完毕（止于整档边界 · 零半档）——core 段接续段进度 = 186 ∕ 585；剩余 **399 行**（design 375 + requirements 24，见接续）。

**补档三档 · 处置四件（逐行）**

`docs/core/design/TOOL-OUTPUT-LIMITS.md`（10）
- :44 | `helpers.mjs:80` ⇒ 假阳核销 | :80 = `TMP_RETENTION_MS = 3 * 24 * 3600 * 1000` 逐字在位
- :93 | `run.mjs:20` ⇒ `:16` | 重锚 | :16 = `MAX_RESULT_CHARS` re-export 行
- :108 | `run-helpers.mjs:77 ∕ :78 ∕ :79` ⇒ `:25 ∕ :26 ∕ :27` | 重锚 | 三常量定义位
- :109 | `:97` ⇒ `:34` · `:115` ⇒ `:43` | 重锚 | `safeSliceUTF16` ∕ `safeSliceUTF16Tail` 定义位
- :110 | `:132` ⇒ `:56` | 重锚 | `buildHeadTailPreview` 定义位
- :111 | 端 `run-helpers.mjs:167 ∕ :86 ∕ :181` ⇒ 核 `helpers.mjs:124`（offload）∕ `:80`（TMP_RETENTION_MS）∕ `:114`（清理判定） | 重锚（跨档——端已取核）
- :113 | vsc `compaction.mjs:34` ∕ `truncate.mjs` ∕ `loop.mjs:266` ⇒ 核 `compaction.mjs:37` ∕ `truncate.mjs:14` ∕ `loop.mjs:290`（＋`run.mjs:19 ⇒ :16`） | 重锚（跨档）
- :114 | `:165` ⇒ `:203` | 重锚 | :203 = `onToolResult` 装配位
- :116 | `webview/lib.js:27` ⇒ `render-core/lib.mjs:27`（`:30` `capText` 原位同号） | 重锚（跨档——webview 迁核）
- :118 | `:196` ＋ 加标 | as-of 加标 | 失败回退未逐点重定位（披露 1）

`docs/core/design/MEMORY.md`（14）
- :70（×2） | 已在位 | 行带迁移期引文标记（#435 落）——记录面零改
- :288 | 假阳核销 | 五动作工具块在位（探针 id 误取）
- :312 ∕ :384 | 假阳核销 | `setup.mjs:101-126` 召回注入块在位（探针取它锚；:384 所述「加 depth 门」已落）
- :319 | `scan.mjs:80` ⇒ `:133` | 重锚 | `scanVectors` 定义位
- :323 | `scan.mjs:90` ⇒ `:169` | 重锚 | `const next = cursorValues(…)` 位
- :337 | `core.mjs:66` ＋ 加标 | as-of 加标 | design 表坐标未逐点重定位（披露 1）
- :339 | `docs.mjs:116` ⇒ `:118` | 重锚 | 分块扫描块
- :340 | `code-sync.mjs:298` ＋ 加标 | as-of 加标 | 同上（披露 1）
- :478 | 假阳核销 | 触发器块 ∈ cited :344-359
- :520 | `core.mjs:15` ⇒ `:19` | 重锚 | `safeSliceUTF16` import 行（记录行同指同拍）
- :520 | 假阳核销 | `code-sync.mjs:15` import 逐字在位
- :602 | 已在位 | 变更记录行（行自述先例坐标退役）

`docs/core/design/PROVIDER.md`（16）
- :162 | `core.mjs:183` ⇒ `:179` | 重锚 | `if (!spec.noUsageStream) body.stream_options = …`
- :265 | `setup-reminders.mjs:216` ⇒ `:22` | 重锚 | 核转口行（`appendImagePointer` ← 核）
- :270 | `image-handler.mjs:65` ⇒ `vision-reader.mjs:47`（＋超时常量 `:64` ⇒ `:30`） | 重锚（跨档）
- :270 | `panel-messages.mjs:92` ⇒ `:128` | 重锚 | seam 参数注入行
- :278 | `panel-chat.mjs:59-60 ∕ :129` ⇒ `:44 ∕ :224` | 重锚 | newTurnController 转口 ∕ 消费位
- :291 | `config-io.mjs:213` ⇒ `extension/presets.mjs:106` | 重锚（跨档） | `resolveDefaultModel` 定义位
- :316 | `config.mjs:106 ∕ :142 ∕ :183 ∕ :166` ＋ 加标 | as-of 加标 | 端差面坐标未逐点重定位（披露 1）
- :321 | `generate-title.mjs:13` ⇒ `:15` | 重锚 | 包装器定义位
- :330 ∕ :331 ∕ :332 | 已在位 | §6.20「问题（实核）」表——修前实核面（修已落于映射表 ∕ `tool-events.mjs:412+`）
- :335 | 假阳核销 | `retry.mjs:60` `onWait({ phase: "quota" … })` 逐字在位
- :348 | `i18n.mjs:83` ⇒ `:89` | 重锚 | `export function t(key, vars, locale)`
- :351 | `panel-callbacks.mjs:195-202` ⇒ `:72` | 重锚 | `statusTextPayload` 定义位
- :391 | 已在位 | D-PR28 决策记录行（决策记录面——零改）
- :451 | 假阳核销 | `presets.mjs:9` 核单源注记在位

**终读（探针复扫 · `-core-r2` · 判据与 §2.21 同件）**
- 域级：在场 990 · 漂移候选 729 · 失据候选 307 · 多义未判 1；
- 段内 24 档：before 186 ⇒ after 111（**清除 75**）；残留 111 = 设计保留（已在位 ∕ 记录面 ∕ 加标）＋ **重锚后复现 18**——逐条行内实读复核，18 ∕ 18 targeted 位在位（近邻 id 误取 ∕ 范围起点窗差——无真误引；分布 = MANIFEST 4 · DESIGN-TOKEN 3 · PROVIDER 3 · TURN-CAP 3 · EM-V2 2 · DOC-CODE 1 · ESCALATE 1 · MULTI 1）；
- 存档：`…-rows-core-r2-preround.json`（开工）与 `…-rows-core-r2.json`（终读）并存。

**doc-check 集合差**（baseline = `…-core-after2.txt`〔前轮终读〕⇒ 终读 = `…-core-r2-after.txt`）
- ✗ 行集 416 ⇒ 416；**本席面新增红 = 0**——首跑自产 1 条行宽（MANIFEST:459 = 302 > 300）⇒ 当场收正（坐标缩短 ⇒ 287），复跑已清；
- 列报对位移 2 ∕ 2（`PROMPT-SYSTEM.md` :479 ⇒ :503——他写者于该档插入 24 行所致，逐字同对、仅号移，**非本席面——上抛父侧核**）；
- 汇总 = 悬空 30（迁移期引文族列报 · 不入闸）· 行宽 65（他笔存量）· 注记豁免 310 · 拟新增 27 · 迁移期引文 298。

**抽样读回（≥5 · 实为 16）**：**16 ∕ 16 PASS**——重锚 12 条（双侧：档内新坐标 ∕ 目标行标识符逐字）＋ 加标 4 条（TURN-CAP:22 ∕ VERIFY-REDESIGN:72 ∕ PROMPT-SYSTEM:115 ∕ MEMORY:337）。脚本 = `.thincoder/tmp/469-core-r2-verify2.mjs`（可复跑）。

**披露**
1. 加标兜底 8 处（未逐点重定位——如实读复核：TURN-CAP :22×2 · MANIFEST :462（`acp.mjs` 拆档）· MEMORY :337 ∕ :340 · PROVIDER :316 · TOOL-OUTPUT :118 · MANIFEST :229 ∕ :342（已在位类））。
2. 记录面单点改指 2 处（TURN-CAP :202 · MEMORY :602——改善性改指；披露备查）。
3. `PROMPT-SYSTEM.md` 他写者插行 24（行为位移对——上抛父侧）。
4. 探针 ∕ doc-check 存档三件：`-rows-core-r2-preround.json` · `-rows-core-r2.json` · `-core-r2-after.txt`（均在 `.thincoder/tmp/`）。

**接续（本席轮未及——后继轮机械接续同判据同探针）**
- design 剩余 **8 档 · 375 行**：DOC-DISCIPLINE 35 · MODEL-BENCH 37 · MODEL-SPECS 72 · SESSION 42 · TOOLS 46 · CORE-UNIFICATION 53 · AGENT-LOOP-SUBAGENT 43 · AGENT-LOOP-UPSTREAM 47；
- requirements **12 档 · 24 行**：笔权外（主 agent）——零触；分类上抛随收口轮（本轮未及——如实登记）。

### 2.23 #469 core 域续段第 3 轮（3 档 · 122 行 + DOC-DISCIPLINE 转 R6）（eng-designer · 2026-09-29）

**范围（止于整档边界——零半档）**：本轮完成 **3 档 · 122 行**：MODEL-BENCH 37 · SESSION 42 · AGENT-LOOP-SUBAGENT 43。
**R6 转出 1 档**：`DOC-DISCIPLINE.md`（35 行）——届盘重读发现新在飞批 `doc-sync-carryover`（20:42 立批）户下 #647 明载该档死引用族 ∕ 坐标 3 处（在飞写域）⇒ 沿 §2.5 规则③ **转 R6 零触**（登记见下；接续非放弃）。
**未及（接续）**：design 4 档 218 行：TOOLS 46 · CORE-UNIFICATION 53 · AGENT-LOOP-UPSTREAM 47 · MODEL-SPECS 72；requirements 12 档 24 行（笔权外——零触 + 分类上抛，清单见接续节）。

**开工届盘（强义务落实）**：在飞批逐档实读 = **4 他批**——`desktop-rebuild-fidelity`（🔄；render-core ∕ desktop ∕ vsc 档族）· `test-knowledge-prompts`（🔄；提示词双面 + `PROMPT-SYSTEM.md`——＋24 行位移勿追勿动）· `doc-sync-carryover`（🔄，20:42 立批；#647 涉 `DOC-DISCIPLINE.md`、desktop 档族、README）· `alias-removal-unblock`（🔄，20:38 立批；涉 `BATCH-RECORD.md` ∕ batch-segment.mjs ∕ VSC setup-tooltable.mjs）。**释放**：`desktop-residuals-round3` ∕ `perf-residuals` 已收口（IPC.md ∕ desktop/requirements/PROJECT.md 出 R6）。
探针 = `-core-r3` 变体（判据与源件逐字同；输出 `…-rows-core-r3.json ∕ …-list-core-r3.txt`——零覆盖 r1 ∕ r2 存档）；R6 集按届盘重读更新：释放 2 档、新增 4 档（`DOC-DISCIPLINE.md` ∕ `PROMPT-SYSTEM.md` ∕ `WEBVIEW-PROTOCOL.md` ∕ `BATCH-RECORD.md`）。
开工读数（`…-rows-core-r3-preround.json`）：源域 152 档（清扫面 143 ∕ R6 9）· 坐标引核 4156 · 判面 = 在场 990 ∕ 漂移候选 729 ∕ 失据候选 307 ∕ 多义 1；段内三档计数 = 37 ∕ 42 ∕ 43（与 §2.22 接续清单 identity 一致）。

**处置四类汇总（122 行 · 逐行记录 = 下行节）**：

| 档 | 行 | 重锚 | 假阳核销 | as-of 加标 | 已在位 |
|---|---|---|---|---|---|
| `MODEL-BENCH.md` | 37 | 24（＋5 姊妹随拍） | 12 | — | 1 |
| `SESSION.md` | 42 | 27（含 4 组同值同拍） | 8 | 2 | 5 |
| `AGENT-LOOP-SUBAGENT.md` | 43 | 33（含 9 组同值同拍） | 1 | 5 | 4 |
| **计** | **122** | **84** | **21** | **7** | **10** |

**验证四件（本轮读法）**：
1. **处置记录全量在册** = 下行逐档节（122/122，零缺行）＋ R6 登记 1 档；
2. **抽样（复核腿）** = 18 条（分层：重锚 14 ∕ as-of 2 ∕ 同值同拍 2）——初跑 17/18，**FAIL 条 = 抽样脚本期望值笔误**（`extension.mjs:189` 行 ∌ `releaseClaimsOnExit`——该标识符在 :193、∈ cited `:189-196` 范围内）⇒ 修正期望复跑 **18/18 PASS**（沿 §2.20 先例）；脚本 = `.thincoder/tmp/469-core-r3-close.mjs`（可复跑）；
3. **零未标注不一致** = 抽样行逐条读回通过（重锚 = 新 N±2 窗内标识符命中；as-of = `（as-of 2026-09-29）` 标记在位＋一行理由）；
4. **doc-check 集合差**（`node scripts/doc-check.mjs` 零参；before = `…-core-r3-before.txt` ⇒ after = `…-core-r3-after.txt`）：✗ 行集 **416 ⇒ 418（新增 6 ∕ 消失 4）**——**新增 6 全落他档 ∕ 他笔**（`DOC-DISCIPLINE.md:1427` ∕ `PROMPT-SYSTEM.md:505`×2 = R6 在飞批行移；`PROVIDER.md:314` ∕ `PROVIDER.md:489`(439) ∕ `CONFIG.md:228`(332) = 他写者——非本席面）；**本席 3 档新增红 = 0**。悬空 **30 ⇒ 30**（不变）；行宽 **65 ⇒ 67**（+2 = 他档 ∕ 他笔）；行数面差异 **18 ⇒ 1**（他写者回填——非本席）。探针终读（`…-rows-core-r3.json`）：段内三档残差 **37⇒16 ∕ 42⇒27 ∕ 43⇒19**（残差 = 设计保留（假阳 ∕ 已在位 ∕ 记录面 ∕ 加标）＋复现项——抽查无真误引）。

**逐档处置记录（四件 · 一行一录——位置 = 现读行号；「⇒」= 重锚新值）**

`docs/core/design/MODEL-BENCH.md`（37 行）
- **重锚 24**：:231 ∕ :859 `bench/lib/pipeline.mjs:205 ⇒ :226`（note 键现位；同值两处同拍）｜:298 `report.mjs:54 ⇒ :63`（备注列渲染行）｜:445 `provider/core.mjs:184 ⇒ :180`（maxTokens 注入行；姊妹 `:185-192 ⇒ :181-188` ∕ `:196-204 ⇒ :193-200` 随拍）｜:446 `:178 ⇒ :174`（请求体 model 行）｜:875 `fixtures.mjs:81 ⇒ :99`（note 键首现行）｜:1000 ∕ :1003 `judge.mjs:82-83 ⇒ :86`（版本绑定「不等即拒跑」）｜:1000 `judge.mjs:82 ⇒ :86`（同句姊妹）｜:1007 ∕ :1576 `model-specs.mjs:59-74 ⇒ :69-87`（glm 族行区；姊妹 flashx `:68 ⇒ :81` 随拍）｜:1447 `judge.mjs:271 ⇒ :276`（reviewRun 之 callSlot 调用点）｜:1623 `subagent-spawn.mjs:397 ⇒ :431`（_upstream.sync 行）｜:1626 `prompt-overlays.mjs:44 ⇒ :45`（eng-designer 行）｜:1632 `agent.mjs:215-216 ⇒ agent/turn-loop.mjs:66`（_currentTurn 赋值）｜:1632 `agent.mjs:222-224 ⇒ agent/turn-loop.mjs:77`（⟦ev⟧turn 唯一发射点）｜:1633 `dispatch.mjs:263 ⇒ :162`（onToolCall 首发射点）｜:1633 `dispatch.mjs:444 ⇒ dispatch-run.mjs:137`（onToolResult 发射点）｜:1636 `agent.mjs:345-346 ⇒ agent/turn-loop.mjs:154`（onUsage 记账）｜:1717 `agent.mjs:141-145 ⇒ agent/run-start.mjs:70`（_turnSeq 链起点复位）｜:1744 `judge.mjs:228 ⇒ :234`（callSlot 定义）｜:1777 `client.mjs:78 ⇒ :90`（fixtureSlotTransport；记录面同值 :1437 同拍）｜:1977 `output.mjs:34 ⇒ :38`＋`:50 ⇒ :54`（refuseIfExists ∕ writePair）｜:1982 `prices.mjs:71 ⇒ :76`＋`:56 ⇒ :61`（costOf ∕ matchPrice）。
- **假阳核销 12**：:642（judge 守卫块 ∈ `:193-220`——thinkApi 分支 ⊂ :201-216）｜:1617（tools/index `:64` multimodal 判据在位）｜:1622（subagent-async `:151-155` provider 前缀块在位）｜:1625（`:305` runChildPipeline 在位）｜:1626（family-tools `:172` eng-designer 行含 parentChannelTool——字面 notify_parent 仅 :167 注释）｜:1633（spawn-child `:146` wrapChildCallbacks 在位）｜:1634（parent-channel `:52` UPSTREAM_ASK_MAX_INFLIGHT=1 在位）｜:1643（spawn-gates `:18-24` TASK_BOOK_FIELDS 五段块在位）｜:1858（bash.md `:3-9` 路由块 ∕ grep.md `:18` 选择面句在位 ∕ edit.md `:3-10`——探针误解析至 `docs/core/design/edit.md`，正解 = `thincoder-core/tool-docs/edit.md` 在位）｜:2181（report-tables `:75`「未记录」注释在位）。
- **已在位 1**：:1268（`client.mjs:148`——行自述「落地后该缺口已补」；历史自述零改）。

`docs/core/design/SESSION.md`（42 行）
- **重锚 27**：:146 `session-slots-manifest.mjs:31-53 ⇒ :42-53`｜:176 `generate-title.mjs:104-123 ⇒ :132-133`（回退内存人读线）｜:178 `:23 ⇒ :33`（generateTitle 定义）｜:237 `turn-face.mjs:91 ⇒ :54`（run 注入面）｜:389 `helpers.mjs:189 ⇒ :221`（collectGitContext 定义）｜:400 `bin/thincoder.mjs:342 ⇒ command-interactive.mjs:142`（钉槽落点）｜:413 `vsc session-slots.mjs:131 ⇒ :76`（端壳 resumeSlot 转口）｜:413 `core session-slots.mjs:291 ⇒ :299`（resumeSlot 定义）｜:454 `:81 ⇒ :92`（sessionPath 定义）｜:478 `extension.mjs:128 ⇒ :163-165`（sessionGc 注册块）｜:518 `:230-235 ⇒ :248-253`（usableSlot 无属主分支）｜:523 `key-handler.mjs:152-158 ⇒ key-handler-ctrlc.mjs:112`（拆档后 Ctrl+C×2 释放插点）｜:523 `index.mjs:444-450 ⇒ :198-204`（ctx.exit 闭包）｜:530 `extension.mjs:176-190 ⇒ :189-196`（deactivate 前置释放）｜:531 `panel-messages.mjs:37 ⇒ :41`（_cwd 定义）｜:572 `read-history.mjs:202-220 ⇒ :224-242`（discoverCwd）｜:756 `session.mjs:167-176 ⇒ :184-186`（摘要构造在写后）｜:782 `sessions.mjs:34-37 ⇒ :21-31`（toRow 载荷行——provider 取数 :29）｜:887 `session-slots-manifest.mjs:48 ⇒ :61`（slotDigest）｜:887 ∕ :890 `session.mjs:83 ⇒ :88`（digestFromStore；同值同拍）｜:922 `session-bar.js:41 ⇒ :53`（—msgs 行）｜:922 `cmd-session.mjs:69 ⇒ :77`（— turns 行）｜:932 `:149-164 ⇒ :154`（writeSessionFile）｜:1075 ∕ :725 `setup.mjs:186-207 ⇒ :152-155`（hydrate 槽读点；同值同拍——:725 行自述「只读槽 provider ∕ model」）｜:324 ∕ :344 `session-io.mjs:186-189 ⇒ :186-190`（switchToSlot 两 null 门；同值同拍——损坏→null 补齐）｜:361 `panel-session-write.mjs:34 ⇒ :65-66`（…existing 展开点）。
- **假阳核销 8**：:177（panel-session-write `:134` = find(isRealUserMsg) 在位）｜:236（setup-reminders `:41` 核行长在位）｜:238（session-slots `:105` END="cli" 在位）｜:411（handlers-slots `:190` delete 重钉行在位）｜:413（handlers-slots `:16` 导入面无 resumeSlot——在位）｜:657（session-index-query `:25` FTS_USABLE 在位）｜:783（handlers-slots `:44` listSlots 行在位）｜:924（startup `:234-237` 提示块在位——追加行 :240 邻位）。
- **as-of 加标 2**：:237 ∕ :388（`thincoder-vscode/src/agent/setup-reminders.mjs:61-62 ∕ :115`——端侧自持行 ∕ pushGitContext 转口已随 2026-09-29 parity-b1 退役 ∕ 归核；号不动＋`（as-of 2026-09-29）`）。
- **已在位 5**：:185（「迁移期引文——档已删」标记在位）｜:440（行带「实测钉定 · 2026-09-21」——所绘为修前形态）｜:1127（变更记录行——同值坐标现位在位）｜:1186 ×2（EXIT-CLAIM-RELEASE 收正记录行——记录面零改）。

`docs/core/design/AGENT-LOOP-SUBAGENT.md`（43 行）
- **重锚 33**：:190 ∕ :201 ∕ :231 `subagent-spawn.mjs:445 ⇒ :417`（async 取号；同值×3）｜:191 `escalate-async.mjs:157 ⇒ :159`｜:193 `subagent-run.mjs:181 ⇒ :202`（入池点 = 键守卫+.set）｜:193 `escalate-async.mjs:285 ⇒ :297`（入池 .set）｜:193 `advisor-async.mjs:326 ⇒ :441`（入评审池 .set）｜:182 ∕ :190 ∕ :201 ∕ :231 `subagent-run.mjs:53 ⇒ :61`（回读 counter；同值×3）｜:214 ∕ :256 `subagent-scheduler.mjs:396-397 ⇒ :412-413`（取号公式；同值×2）｜:303 `subagent.mjs:245 ⇒ :253-254`（plan 运行期门）｜:330 `family-tools.mjs:48 ⇒ :50`（suffix 句）｜:330 `family-tools.mjs:51 ⇒ :53`（正常模式 enum）｜:330 `subagent.mjs:229 ⇒ :238`（ROLES 白名单）｜:304 ∕ :390 `family-tools.mjs:46 ⇒ :48`（工程 enum；同值×2）｜:394 ∕ :399 ∕ :952 `setup-tooltable.mjs:216 ⇒ thincoder-vscode/src/agent/tool-table.mjs:45`（VSC 装配 enum 现位 = F5 集；同值×3）｜:411 `subagent-actions.mjs:106 ⇒ subagent-actions-query.mjs:94`（executeStatusAction 定义）｜:413 `async-settle.mjs:70-74 ⇒ :73`（writeTombstone 定义）｜:415 `subagent-actions.mjs:235-236 ⇒ subagent-actions-query.mjs:230`（observe depth 门）｜:419 ∕ :423 ∕ :500 `panel-messages.mjs:234-242 ⇒ panel-messages-turn.mjs:113-118`（合成 parent 装配块；全形＋裸形）｜:471 ∕ :991 `session.mjs:301 ⇒ session-lifecycle.mjs:113`（applySession 数组替换；同值×2）｜:507 `subagent-actions.mjs:236/:288 ⇒ subagent-actions-query.mjs:230/:48`（拒返回形样板）｜:524 ∕ :536 `context.mjs:38 ⇒ token-window.mjs:35`（KEEP_HEAD 迁出后再定位；同值×2）｜:525 `context.mjs:46 ⇒ token-window.mjs:43`（SUMMARY_TOKEN_ESTIMATE）｜:533 ∕ :546 `subagent-spawn.mjs:393 ⇒ :387`（批次档路径行；同值×2）｜:559 `subagent.mjs:358 ⇒ :412`（injectAsyncResult）｜:720 `setup-tooltable.mjs:14/:27 ⇒ :19/:29`（configureBatchSegment 保缝面）｜:707 ∕ :728 `agent-tools.mjs:17/:21 ⇒ :24`（别名不入登记册句；同值×2）｜:930 `subagent-spawn.mjs:463 ⇒ :431`（W1 站点）。
- **as-of 加标 5**：:420 ∕ :423 ∕ :473 ∕ :500（`thincoder-vscode/src/agent.mjs:141-146 ∕ :147-153`——VSC 主循环已随 2026-09-29 parity-b1 退役；号不动＋标注）｜:733（`thincoder-vscode/src/agent/setup.mjs:5/:325`——注释面未逐点重定位；加标兜底）。
- **假阳核销 1**：:425（scheduler `:125-131` depInfo 墓碑→unknown 块 ＋ `:144-150` 在位）。
- **已在位 4**：:537 ∕ :622 ∕ :624（行自述「三拆前」——旧坐标零改）｜:698（行带「as-of 2026-09-21 实测」——批落地时形态）。

**R6 登记（逐档 · 批名）**：`docs/core/design/DOC-DISCIPLINE.md`（35 行）= **`doc-sync-carryover`**（#647：`thincoder-cli/test/doc-check.test.mjs` 死引用族 :119 ∕ :340-341 ∕ :516-517 ∕ :800 ∕ :822 ∕ :1119-1120 ∕ :1137-1138 ∕ :1145 ＋ 坐标 3 处 :928——在飞写域）⇒ **零触**；随其批落定后接续。

**披露（逐条）**：
1. **DOC-DISCIPLINE 转 R6**（届盘重读发现 20:42 新立批 `doc-sync-carryover` 之写域覆盖该档——本批绕开 + 登记；35 行置接续，非放弃）。
2. **同句姊妹未逐点（零动——留档）**：MODEL-BENCH :445 `:117`（在位）｜SESSION :519 `resumeSlot:281` · :526 `bin/thincoder.mjs:322` · :887/:890 `:274-324 ∕ :365-431`（applyCompression ∕ compressIfNeeded 块）· :1186 记录行内 `extension.mjs:176-190` ∕ `session-io.mjs:210`｜AL-SUB :415 `:287-288` ∕ `:341` · :698 `:366` · :930 `:345` · :733 `setup-tooltable.mjs:4/:22`——未列行零动（后继轮同法接续）。
3. **修已落而所绘为修前形态 2 处（改善性重锚）**：VSC enum 现位 `tool-table.mjs:45` = F5 集（收正已落）；status ∕ observe 门现位 `subagent-actions-query.mjs:99 ∕ :230`（在位）——表内「仍含 plan ∕ 无 depth 门」字面属修前实读（随行披露）。
4. **探针自产残留**：段内三档残差 62（37⇒16 ∕ 42⇒27 ∕ 43⇒19）= 设计保留（假阳 ∕ 已在位 ∕ 记录面 ∕ 加标）＋复现项——抽样（修正后 18/18）无真误引。
5. **他笔新增红（非本席面）**：`DOC-DISCIPLINE.md:1427` ∕ `PROMPT-SYSTEM.md:505`×2（R6 在飞批行移）· `PROVIDER.md:314` ∕ `PROVIDER.md:489`(439) ∕ `CONFIG.md:228`(332)（他写者）——上抛父侧核。
6. **存档**：探针 `…-coords-probe-core-r3.mjs` · 行件 `…-rows-core-r3-preround.json`（开工）∕ `…-rows-core-r3.json`（终读）· 读数 `…-core-r3-before.txt` ∕ `…-core-r3-after.txt` · 收口脚本 `469-core-r3-close.mjs`（含抽样 18 条定义，可复跑）· dump 目录 `469-core-r3/`。

**上抛（只报不裁）**：① 他笔新增红 6 条（见披露 5——R6 ∕ 他写者，非本席面；父侧归口）；② DOC-DISCIPLINE 接续挂 `doc-sync-carryover` 落定；③ requirements 12 档 24 行分类上抛（清单在接续节——建议：用例号族加标 ∕ 路径族迁移期引文 ∕ 核档在位者改指，随收口轮由主 agent 落笔）；④ 行数面差异 18 ⇒ 1（他写者回填——非本席，只报）。

**零触声明**：产品码 ∕ `scripts/**` ∕ requirements 档 ∕ 冻结批档 ∕ R6 档（DOC-DISCIPLINE ∕ PROMPT-SYSTEM ∕ WEBVIEW-PROTOCOL ∕ BATCH-RECORD ∕ render-core ∕ desktop ∕ vsc 档族）——全零触；本轮落笔面 = **3 档设计文档** + 本档 §2；引擎 ∕ 判据零改。

**接续（后继轮机械接续同判据同探针）**：
- design **4 档 · 218 行**：TOOLS 46 · CORE-UNIFICATION 53 · AGENT-LOOP-UPSTREAM 47 · MODEL-SPECS 72；
- R6 **1 档 · 35 行**：DOC-DISCIPLINE（随 doc-sync-carryover 落定后接续）；
- requirements **12 档 · 24 行**（笔权外——零触 + 分类上抛）：AGENT-LOOP 2 · AGENT-PARAMS 1 · DESIGN-TOKEN-SETTLEMENT 2 · EM-V2-SPEC-BATCH-SEGMENT 1 · EM-V2-SPEC-CHECKLIST-REMOVAL 2 · EM-V2 1 · MEMORY 1 · NORMAL-MODE 1 · SEND-STALL-DISTILL 2 · SESSION 1 · TOOLS 6 · TURN-CAP-CONTINUE 4。

### 2.24 #469 core 域续段第 4 轮（2 档 · 81 行 + R6 双档转出 · MODEL-SPECS 未及）（eng-designer · 2026-09-29）

**范围（止于整档边界——零半档）**：本轮处置 **2 档 · 81 行**：`AGENT-LOOP-UPSTREAM.md` 47 · `DOC-DISCIPLINE.md` 34（R6 释放档——原避让批 doc-sync-carryover 已收口）。
**R6 转出 2 档（届盘重读发现域冲突 ⇒ 绕开 + 登记）**：`TOOLS.md` 46（core-carryover #641：§6.11 :276 + §2.2 #59/:64 ∕ #69/:74 落点 ∥ tools-carryover #9 ∕ #15：§6.19 新节 + §6.9 随动）· `CORE-UNIFICATION.md` 53（core-carryover #641：§2.13.3 ∕ §2.13.4 ∕ §2.13.6 + §2.8.1 登记面）。
**未及（接续）**：design 1 档 72 行：`MODEL-SPECS.md`；R6 2 档 99 行（随其批落定后接续）；requirements 12 档 24 行（笔权外——零触 + 分类上抛）。

**开工届盘（强义务落实）**：在飞批逐档实读 = 9 他批——`desktop-rebuild-fidelity`（🔄）· `test-knowledge-prompts`（🔄）· `alias-removal-unblock`（🔄）· `core-carryover`（🔄）· `tools-carryover`（🔄）· `vsc-carryover`（🔄）· `provider-config-family`（🔄）· `desktop-carryover`（🔄 · §2 未落）· `structure-split-2`（🔄 · §2 未落——CORE-UNIFICATION §2.8.1 登记面预期触及 · 观察项）。**释放**：`doc-sync-carryover` 已收口（DOC-DISCIPLINE 出 R6——本轮纳入）＋ `doc-backfill` ∕ `residuals-round2` ∕ `batch-mechanics` ∕ `core-env-residuals` ∕ `core-hygiene` ∕ `desktop-extension-engine-face` ∕ `desktop-residuals-round3` ∕ `perf-residuals` 等已收口。
探针 = `-core-r4` 变体（判据与源件逐字同；输出 `…-rows-core-r4.json ∕ …-list-core-r4.txt`——零覆盖 r1–r3 存档）；R6 集更新 = 14 档（＋ CORE-UNIFICATION ∕ TOOLS ∕ SETTINGS-TOOL ∕ ARCHITECTURE ∕ docs/README.md ∕ vsc SETTINGS ∕ vsc WEBVIEW-PROTOCOL ∕ …；− DOC-DISCIPLINE ∕ CONFIG ∕ CLI-DEBT ∕ DOC-MIGRATION 释放）。
开工读数（`…-rows-core-r4-preround.json`）：源域 152 档（清扫面 138 ∕ R6 14）· 坐标引核 4190 · 判面 = 在场 1059 ∕ 漂移 682 ∕ 失据 302 ∕ 多义 0；段内五档计数 = **46 ∕ 53 ∕ 47 ∕ 72 ∕ 34**（与 §2.23 接续清单 identity 一致；DOC-DISCIPLINE 34 vs 接续记 35——Δ1 = 前批（doc-sync-carryover #647 `:928` 一族）收正后一行转「在场」（顺差）；本轮 34 行逐行全录零缺行）。

**处置四类汇总（81 行 · 逐行记录 = 下行节）**：

| 档 | 行 | 重锚 | 假阳核销 | as-of 加标 | 已在位 |
|---|---|---|---|---|---|
| `AGENT-LOOP-UPSTREAM.md` | 47 | 27（含跨档 5 处 ∕ 同值同拍多组） | 4 | 8 | 8 |
| `DOC-DISCIPLINE.md` | 34 | 11（含同值同拍 2 组） | 7 | — | 16 |
| **计** | **81** | **38** | **11** | **8** | **24** |

**验证四件（本轮读法）**：
1. **处置记录全量在册** = 下行逐档节（81/81，零缺行）＋ R6 登记 2 档；
2. **抽样（复核腿）** = 19 条（分层：重锚 15 ∕ as-of 2 ∕ 档内标记 2——双侧：档内新坐标 ∕ 目标行标识符逐字）——**19/19 PASS**（脚本 = `.thincoder/tmp/469-core-r4-close.mjs`，可复跑）；
3. **零未标注不一致** = 抽样行逐条读回（重锚 = 新 N±2 窗内标识符命中；as-of = `（as-of 2026-09-29）` 标记在位）；复现项逐条留接续（见披露 3）；
4. **doc-check 集合差**（`node scripts/doc-check.mjs` 零参；before = `…-core-r4-before.txt` ⇒ after = `…-core-r4-after.txt`）：✗ 行集 **420 ⇒ 427（新增 35 ∕ 消失 28）**——**本席 3 档新增红 = 0**（两跑一致）；**新增 35 全落他档 ∕ 他笔并发**（`docs/desktop/design/PROJECT.md` 33 条——行位重排 +17 ＋ 行宽新红，desktop-rebuild-fidelity ∥ desktop-carryover 在写；`CONFIG.md` 2 条——provider-config-family 域）——上抛父侧核。悬空 **32 ⇒ 36** ∕ 行宽 **67 ⇒ 68**（增量 = 他笔并发；本席零贡献）。**探针终读**（`…-rows-core-r4.json`）：清扫面在场 1059 ⇒ **1082** · 漂移 682 ⇒ **663** · 失据 302 ⇒ **299**；段内残差 **47 ⇒ 29 ∕ 34 ⇒ 29 ∕ 72 ⇒ 72**（残差 = 设计保留（已在位 ∕ 假阳 ∕ 加标）＋复现项——抽样无真误引）。

**逐档处置记录（四件 · 一行一录——位置 = 现读行号；「⇒」= 重锚新值）**

`docs/core/design/AGENT-LOOP-UPSTREAM.md`（47 行）
- **重锚 27**：:28 `subagent-run.mjs:26-32 ⇒ :34`（`drainInjectedQueue` 定义）｜:28 ∕ :462 `subagent-actions.mjs:319-320 ⇒ :74-75`（push `entry._injected`；同值同拍 ×2）｜:31 `family-tools.mjs:139-165 ⇒ :141-175`（depth>0 装配段）｜:34 `subagent-actions.mjs:110-112 ⇒ subagent-actions-query.mjs:95-99` ∕ `:241-243 ⇒ :229-230` ∕ `:293-295 ⇒ :47-48`（status ∕ observe ∕ send 三门——跨档；git 实核 as-of 对应）｜:137 `parent-channel.mjs:172 ⇒ :211`（`readonly: true`）｜:144 `family-tools.mjs:166-170 ⇒ :171-175`（＋内嵌五处 +5 同拍：`:171/:172/:173/:175` 携带 ∕ `:174` consult 不入）｜:150 `subagent-spawn.mjs:463 ⇒ :428`（`child._logId` 行；同值同拍 ×2）｜:151 `subagent-actions.mjs:409 ⇒ :165`（escalate sync `createAgent`）｜:157 `agent.mjs:214-218 ⇒ agent/turn-loop.mjs:89`（跨档）｜:190 `subagent-run.mjs:187 ⇒ :202` ∕ `escalate-async.mjs:290 ⇒ :297`（池键 .set）｜:457 ∕ :795 `parent-channel.mjs:67-80 ⇒ :76-89`（`upstreamHolder`；同值同拍 ×2）｜:463 `dispatch.mjs:94-99 ⇒ dispatch-gates.mjs:89-98`（跨档）｜:470 `helpers.mjs:371-372 ⇒ :436-437`｜:473 `parent-channel.mjs:123 ⇒ :162`（`splice`）｜:480 `parent-channel.mjs:105-111 ⇒ :144-150`（`endNote`）｜:564 ∕ :610 `agent-turn.mjs:71 ⇒ :105`（解构；同值同拍 ×2）｜:639 `setup-reminders.mjs:31-42 ⇒ :16-21`（转口）｜:702 `agent.mjs:162 ⇒ run-start.mjs:97-101`（跨档）｜:766 `parent-channel.mjs:144-156 ⇒ :183-195` ∕ `:45-49 ⇒ :54-58`（工具描述 ∕ ASYNC_NOTE）｜:780 `agent.mjs:223-225 ⇒ turn-loop.mjs:87-89`（跨档）｜:782 `parent-channel.mjs:88-95 ⇒ :124-134`（`pushChildUpstream`）｜:886 `panel-session.mjs:127 ⇒ :141`（autoApprove 广播）∕ `render-frame.mjs:227 ⇒ :233`（`AUTO│` 横幅）。
- **假阳核销 4**：:34（`subagent.mjs:179-181`——action 分流构造在位；git HEAD~1 同形实核）｜:100（`panel-messages-turn.mjs:113-125`——`executeCancelAction` 调用块在位）｜:187（`async-settle.mjs:86-89`——`tombstoneOf` 定义 ∈ 引用域）｜:274（`subagent-async.mjs:383`——`pushReal` 在位）。
- **as-of 加标 8**：:100（`vsc agent.mjs:59` ∕ `:206`）· :159（`core agent.mjs:113-117`——三拆前动态 import 先例）· :780（`vsc agent.mjs:179`）· :794（`:36-40` CARRIER_FIELDS）· :800（`vsc suspension.mjs:163-195`）· :823（`vsc agent.mjs:125-127`）· :783（`vsc suspension.mjs:68-73 ∕ :344-356`）——对象已退役 ∕ 归核（VSC 主循环 2026-09-29 parity-b1 退役——现档 10 行转口壳）；号不动＋`（as-of 2026-09-29）`。
- **已在位 8**（零改）：:28 ∕ :62 ∕ :461 ∕ :462 ∕ :471 ∕ :474（「三拆前」自述）｜:43（自带「as-of 2026-09-18 17:3x 实读」）｜:1017（变更记录行）。

`docs/core/design/DOC-DISCIPLINE.md`（34 行）
- **重锚 11**：:348 ∕ :378 ∕ :1465 `PROJECT-MANIFEST.json:16 ⇒ :20`（`docRoot.modules` 现位；同值同拍 ×3）｜:578 `manifest.mjs:122 ⇒ :241`（`DEFAULT_MANIFEST`）｜:580 `manifest.mjs:171-173 ⇒ :201`（`isValidDocRootValue`）｜:540 ∕ :542 ∕ :630 ∕ :1181 ∕ :1186 ∕ :1352 `TOOLS.md:16 ⇒ :17`（J-3 B 类行——现盘「工具描述」行 = :17；git -L 实核 W2 期 = :16、现 +1；同值同拍 ×6）｜:540 ∕ :1181 ∕ :1352 `DOC-SYSTEM.md:181 ⇒ :197`（「共 25 档」分布句现位；同值同拍 ×3）。
- **假阳核销 7**：:540 ∕ :630 ∕ :1181 ∕ :1186 ∕ :1352 `PROMPT-SYSTEM.md:17`（B 类行现位 = :17 逐字实核——探针 id 取文件名切词误判）｜:540 `docs/core/requirements/PROMPT-SYSTEM.md:12`（现态陈述行在位）｜:1216 `WEBVIEW.md:3`（限定语串逐字在场）。
- **已在位 16**（零改）：:120（自述「已随 M8 删除…现态无承接」；现盘 9 行骨架）｜:188（审计记录「已并入」）｜:268 ×2（自带「行号只作 as-of」）｜:447 ×2（自带「行号 as-of 2026-09-18 死名批二轮实核」）｜:539 ×3（执行记录 · 2026-09-19 · 可 revert）｜:835（自带「as-of 收窄前基线」）｜:1117（A-DD15 处置记录）｜:1183 ×3（自带「行号 as-of 2026-09-18 fix 轮实核」）｜:1404（执行记录 ⑨）｜:1450（变更记录 2026-09-16）。

**R6 登记（逐档 · 批名）**：`docs/core/design/TOOLS.md`（46 行）= **core-carryover**（#641）∥ **tools-carryover**（#9 ∕ #15）⇒ 零触；随其批落定后接续。`docs/core/design/CORE-UNIFICATION.md`（53 行）= **core-carryover**（#641；结构次险族二轮 §2 未落——登记面观察）⇒ 零触；随其批落定后接续。

**披露（逐条）**：
1. **R6 双档转出依据（届盘实读）**：core-carryover §2.3.4 ∕ §2.6 落点明载 `CORE-UNIFICATION.md`（§2.13.3 ∕ §2.13.4 ∕ §2.13.6 + §2.8.1）与 `TOOLS.md`（§6.11 + §2.2 两行）；tools-carryover §2.2 ∕ §2.4 落点明载 `TOOLS.md`（§6.19 新节 + §6.9 + §6.4 随动）——两批均 🔄 未收口 ⇒ 沿 §2.5 规则③ 绕开。`AGENT-LOOP-UPSTREAM.md` 经核 **无在飞写域**（tools-carryover §2.3.4 明载「机制档接口契约节 = 零改」）⇒ 本轮纳入。
2. **条件项披露（未定条件——按「非已落写域」处置）**：① `MODEL-SPECS.md`——provider-config-family §2.4「仅当默认模型无命中行时条件触达（D-11 ∕ 不预写）」＋评审 #4 未决（另见接续）；② `DOC-DISCIPLINE.md` §7——tools-carryover §2.4「+~3（若父侧裁并入）」（评审 #13 未定）——本轮已按释放纳入处置；两条件落定后若触及，由「触档复核」纪律（§2.3(d)）承保复核。
3. **复现项（重锚后探针 id 取词 artifact——留接续）**：AL-UPSTREAM 残差 29 = 设计保留 20 ＋ 复现 9；DOC-DISCIPLINE 残差 29 = 设计保留 23 ＋ 复现 6——复现 = 探针「就近标识符」取到复合词 ∕ 文件名切词（如 `autoApprove` 取 `auto`）致窗口比对误判，坐标实核正确（抽样 19/19 含该类双侧核验）。
4. **他笔并发（非本席面——上抛父侧核）**：doc-check 终读新增 35 条全落他档（`docs/desktop/design/PROJECT.md` 33 条——行位重排 +17 ＋ 行宽新红 13，desktop-rebuild-fidelity ∥ desktop-carryover 在写；`CONFIG.md` 2 条——provider-config-family 域）；悬空 32 ⇒ 36 ∕ 行宽 67 ⇒ 68 增量同源。首跑（本席落笔后即刻）读数 = 新增 2（CONFIG.md）——**本席 3 档两跑零新增红**。
5. **同句姊妹未逐点（零动——留档）**：:100 `core agent.mjs:223-225`（同句未列）· :135-136 dispatch 三处（`:167 ∕ :257 ∕ :483`）· :137 `:135-141` · :463 `:257` · :464 `:186 ∕ :263` · :565 ∕ :567 `agent.mjs:96 ∕ :124 ∕ :162` · :820 `agent.mjs:162` 等——未列行零动，后继轮同法接续。
6. **发现：AGENT-LOOP-SUBAGENT.md :415-416 两处陈旧（非本轮射程——只报）**：`send`（`:287-288`）与 `escalate`（`:341`）引 `subagent-actions.mjs` 现盘 = `:47-48` ∕ `:103`（grep 实核；同段「status ✗ 无门」句与现盘 query `:95-99` 亦已相抵）——r3 已处置同族行而此两 token 未列 ⇒ 留档上抛（该档归已完成面；后继「触档复核」可收）。
7. **存档**：探针 `…-coords-probe-core-r4.mjs` · 行件 `…-rows-core-r4-preround.json` ∕ `…-rows-core-r4.json` · 读数 `…-core-r4-before.txt` ∕ `…-core-r4-after.txt` · 收口脚本 `469-core-r4-close.mjs` · dump 目录 `469-core-r4/`。
8. **零触声明**：产品码 ∕ `scripts/**` ∕ requirements 档 ∕ 冻结批档 ∕ R6 两档 ∕ `MODEL-SPECS.md`——全零触；落笔面 = 2 档设计文档（40 处行内改）+ 本档 §2；引擎 ∕ 判据零改。

**上抛（只报不裁）**：① 他笔并发新增红 35 条（见披露 4——desktop ∕ CONFIG 两域在写；父侧归口）；② AGENT-LOOP-SUBAGENT.md :415-416 两处陈旧 token（见披露 6）；③ requirements 12 档 24 行分类上抛（清单见接续节——随收口轮由主 agent 落笔）；④ MODEL-SPECS 未及（72 行——接续）；⑤ 结构次险族二轮 §2 未落（CORE-UNIFICATION 登记面预期触及——观察）。

**接续（后继轮机械接续同判据同探针）**：
- design **1 档 · 72 行**：MODEL-SPECS；
- R6 **2 档 · 99 行**：TOOLS 46 ∕ CORE-UNIFICATION 53（随其批落定后接续）；
- requirements **12 档 · 24 行**（笔权外——零触 + 分类上抛）：AGENT-LOOP 2 · AGENT-PARAMS 1 · DESIGN-TOKEN-SETTLEMENT 2 · EM-V2-SPEC-BATCH-SEGMENT 1 · EM-V2-SPEC-CHECKLIST-REMOVAL 2 · EM-V2 1 · MEMORY 1 · NORMAL-MODE 1 · SEND-STALL-DISTILL 2 · SESSION 1 · TOOLS 6 · TURN-CAP-CONTINUE 4。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审口径**：仅本档在评（本评审实例未读他档）——设计中对盘面事实的断言（`manifest.mjs:252/292` ∕ `fillDefaults` 透传 ∕ `doc-check.mjs:56` ∕ `DOC-DISCIPLINE.md:1310-1312` 死指针 ∕ `thincoder-cli/test/` 现状 ∕ 三例差异值）本评审均标 **unverified**，判据 8 的数值抽检受此限制；无文档地图 ∕ 无项目标准档 ⇒ 判据 7 降级评估（落点均指既有 owner 档，未见为既有节新建平行档）。三链（#435 分流 ∕ #469 扫描 ∕ #546 增件）逐段有设计，8 落点齐（`thincoder/docs/batches/2026-09-29-doc-check-face.md:97-105`），避让表 11 行，上抛 6 项与状态行相符 ⇒ 无 🔴。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations | 🟡 | §2.6（`thincoder/docs/batches/2026-09-29-doc-check-face.md:142-148`）未给 #546 将改的非 `.md` 档任何「现行行数 + 预期增量」标注：`manifest.mjs` ∕ `doc-check.mjs` ∕ `PROJECT-MANIFEST.json`（落点 `thincoder/docs/batches/2026-09-29-doc-check-face.md:97` ∕ `:102` ∕ `:99`）均无；批次本地测试件（`thincoder/docs/batches/2026-09-29-doc-check-face.md:103`）亦无体量预估——唯新模块有 `≈120 行`（`thincoder/docs/batches/2026-09-29-doc-check-face.md:101`）。是否越结构分层（>300 ∕ >500）无从判定，split plan 因此缺位。 | 为 #546 每个被改源 ∕ 测试档补「现行行数 + 预期增量（≤±N）」，并给出分层判定结论（越 >300 者附拆分评审、越 >500 者附拆分案）；新测试件按批量用例补体量预估。 |
| 2 | Clarity | 🟡 | #435 只写清单 A「机器生成」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:64`）与「机械部分只到清单生成」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:59`），未定义生成载体 ∕ 判据实现 ∕ 输入 ∕ 输出：M1 折点判定、M2 唯一宿主解析、M3 双层判据各依何解析序或引擎内部件、以哪次读数为输入、清单 A 以何形态落，全部未落；同批 #469 有明确的批次本地探针（`thincoder/docs/batches/2026-09-29-doc-check-face.md:87`）可对照，实施轮对 #435 无同等规格可依。 | 按 #469 探针同规格补 #435 清单 A 的生成定义（载体、解析序 ∕ 码段谓词的复用引法、输入 = 开工基线逐字读数、输出 = 清单 A 字段），使清单 A 可复跑可比对。 |
| 3 | Clarity | 🟡 | #546 执行域句（`thincoder/docs/batches/2026-09-29-doc-check-face.md:102`）「执行域 = base 域一次（doc 路径按 base 解析；子域未声明 ⇒ 惰性零动作）」未说明 `lineCounts` 声明的读取面：子域 manifest 若声明该键——生效 ∕ 忽略 ∕ 校验报错？若静默惰性，与设计自设的「防空域假绿」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:40`）和「不静默跳过」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:98`）原则同类抵触。 | 写明声明读取面（读哪些 manifest）与子域声明的处置（生效 ∕ 校验报错），排除静默惰性语义。 |
| 4 | Acceptance criteria | 🟡 | #435 验收「悬空 0（豁免族外）」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:154`）未定义豁免 ∕ 排除集：R5 是待裁的「加标 ∕ 不加标」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:56`），R6 域外件按避让规则「不进本批清扫面」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:126`）且处置 = 让先 ∕ 登记归批（`:57`）——这些件若仍出现在 doc-check 读数里，0 在并发在飞下不可达；若排除，排除口径未写。 | 写清读数分母与排除集（R5 加标件 ∕ R6 已登记件的计法），或将该读法写成对定序（如 doc-backfill 先落）的条件式。 |
| 5 | Acceptance criteria | 🟡 | #469 验收「抽检引核行号与实盘一致 ∨ 标 as-of（逐处处置在册）」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:91`）不可机判化：抽检样本量 ∕ 选样法未给；「∨ 标 as-of」使任一未收正项可仅凭标注关闭；而设计自述 ≈40% 坐标引核不进机判面（`thincoder/docs/batches/2026-09-29-doc-check-face.md:79`）、漂移候选 ≈736 且含通用词族假阳（`thincoder/docs/batches/2026-09-29-doc-check-face.md:80`）。 | 把读法落成可复核形态：对机扫清单每条漂移 ∕ 失据候选要求处置记录（重锚并复核 ∨ as-of 附理由），并给抽检样本量 ∕ 选样规则 ∕ 通过判据（如零条未标注不一致）。 |
| 6 | State alignment | 🔵 | 台账期读数与本基线未对齐：§1 记 #435 =「40 悬空 + 21 行宽」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:12`），2.2（a）记旧读「34 ⇒ 48 · Δ+14」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:43`），而基线 = 悬空 161 ∕ 行宽 77（`thincoder/docs/batches/2026-09-29-doc-check-face.md:35`）——设计对旧读采「不猜因不改数」，但未声明旧数作废 ∕ 属更窄口径，也未明示验收分母取哪套（40 级 or 开工基线 161 级）。 | 补一行对齐说明（旧读数口径 ∕ 作废状态），并明示验收分母 = 开工基线（161 ∕ 77 级全量）而非台账旧值。 |
| 7 | Doc hygiene（numeric） | 🔵 | 2.2（b）头句「机判可清四项 M1–M3」（`thincoder/docs/batches/2026-09-29-doc-check-face.md:45`）与表内 M 类 3 行（M1 ∕ M2 ∕ M3，`thincoder/docs/batches/2026-09-29-doc-check-face.md:49-51`）不符——若无第四类，数字应校正；若有，表缺行列（分流口径 ∕ 两清单计数受影响）。 | 核对 M 类计数：与表一致改为三项，或补足缺失的第四类判据行。 |
| 8 | Clarity | 🔵 | 落点 7（`thincoder/docs/batches/2026-09-29-doc-check-face.md:104`）以「载体改批次本地件惯例表述（判官重建归在册）」收口被清退的自测载体：doc-check 常驻自测载体（设计称原 `thincoder-cli/test/doc-check.test.mjs` 已不在盘）此后落点为何、由哪条在册项追踪其重建，从本句读不出，实施轮难以据此落笔。 | 写明常驻自测载体去向（重建到何处 ∕ 明确降级为批次本地件并给出该惯例的出处）与在册编号。 |

带外注记（无严重度）：本档 §1 仍留 `<§1 模板占位：…>`（`thincoder/docs/batches/2026-09-29-doc-check-face.md:7`）且状态行为「进行中」（`:6`）——§1 归属不在本评审目标（§2 全量）内，仅记录，不作判。

计数：🔴 0 · 🟡 5 · 🔵 3（合计 8）
VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权）。
- **三条件核检**：① **评审 pass**——本档 §3 轮次 1（在册）② **预实施面落地并经父侧核验**——工具面（6 判据 + 行数面接入）∥ 核面（`manifest.mjs` lineCounts——端到端读数在册）已落；文档面随 #57 ③ **凭证**——评审已通过（token 在手）。
- **批准射程** = 本批 §2 全量（工具 ∕ 核 ∕ 文档三面链）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）
**状态行**：实施完成（首实现轮 2026-09-29 · 落点 1–2 + 探针×2 · 审计 ∕ advisor 各 1 轮 pass（fix round 3 修）——终稿复跑全绿）



### 5.1 首实现轮 · #546 核面件（`thincoder-core/manifest.mjs` 落点 1–2）（eng-coder · 2026-09-29）

**交付摘要** —— 唯一实施面 = `thincoder-core/manifest.mjs`（产品码面）；四处改（最小 diff · 零语义外扩）：

| # | 落点 | file:line（改后实读） | 读数 |
|---|---|---|---|
| 1 | 默认键 | `thincoder-core/manifest.mjs:257` | `lineCounts: Object.freeze([]), // 行数面机检声明（#546）：[] = 未载惰性（doc-check 行数族）`——嵌套键面 `:274` 派生自动收录（零另改） |
| 2 | 判据谓词 | `:286-290` | `isLineCountsValue`：数组 ∧ 各元素 = 非数组对象 ∧ `doc` / `section` 皆非空串（`trim` 后非空）；`[]` 合法 |
| 3 | 元素层校验 | `:320-323` | `validateManifest`：checkConfig.lineCounts 违规 ⇒ `errors`（fail-closed）；缺键分支 `:315` 先行（missingKeys 补默认，非拒） |
| 4 | 头注随动 | `:11` | 契约速览 validateManifest 判据句补「+ checkConfig.lineCounts 元素层形态」（行内改 · 零行数变） |

**diff 摘要**：`git diff thincoder-core/manifest.mjs` = **4 hunk**（头注 1 ∕ 键行 1 ∕ 谓词块 1 ∕ 校验块 1）；档内其余零改、他档零笔。**行数读数**：现读 **482** → 新读 **493**（Δ+11 = 键行 1 + 谓词块 6 + 校验块 4）——§2.6 档价表估 +6±3，实超上界（回填口径 = 本读数）。

**验证证据（命令 + 输出）**：
1. `node --check thincoder-core/manifest.mjs` —— Syntax OK（首落 ∕ 修正轮 ∕ 终稿三跑）。
2. 核面烟测 `.thincoder/tmp/2026-09-29-doc-check-face-linecounts-smoke.mjs`（探针停车场 · 零落仓 · 终稿复跑）—— **15/15 全绿**：unset（缺键 ⇒ `missingKeys` 记 `checkConfig.lineCounts` + 补默认 `[]`）· set（声明值经 `fillDefaults` 透传支 `:361-363` 逐字存活 + 邻键补默认）· 非法三形（非数组 ∕ 元素缺 `section` ∕ `doc` 空白串 ⇒ errors + `reason:'invalid'`）· 写门（非法声明拒落盘）· 默认档自校 · `nestedKeys` 收录 · **真档端到端**（仓 `PROJECT-MANIFEST.json:37` 声明值存活——改前被读门剥离）。
3. 子域探针 `.thincoder/tmp/2026-09-29-doc-check-face-subdomain-probe.mjs` —— **4/4 全绿**：负控（子域无声明 ⇒ exit 0 ∧ 零报错）∕ 正例（子域持声明 ⇒ `行数面声明面错误` 行 ∧ exit 1——fail-closed 不静默）。**本改 = 该探查可见性前提**（无本改 ⇒ 子域声明被 `fillDefaults` 丢弃 ⇒ 恒不可见）。
4. 实仓一条命令 `node scripts/doc-check.mjs`（零参）—— `判据项 6 项（… lineCounts …）` · `行数面：差异 26 条（比对 125 行 · 跳过 11 行〔预估 3 ∕ 非数 8〕）——报告态` · 锚 162 ∕ 行宽 80（他批在飞存量 ∕ 非本改面）。**声明面生效**（无本改 ⇒ 比对恒 0）。
⇒ §6.1 点名的「集成待件 #37」= 本交付；集成实证 = 上列 2–4。

**决策透明表**：

| 决策 | 取值 | 由 |
|---|---|---|
| 默认值形态 | `Object.freeze([])`（同 `scanDirs` ∕ `exemptions` 冻结形态） | 形态一致；零语义差（消费面皆经 `structuredClone`） |
| 元素超集读法 | 元素多余键不受限（只规定 `doc` ∕ `section` 两字段形态） | 设计无禁止性判据 + 模块未知键宽容哲学；审计判「可接受」 |
| 493 行（>300 咨询线） | 不拆（沿 §2.6:169 裁定；触发条件 ∕ 拆分候选在册） | 评审 #1（🟡 非阻塞）——不重开裁定 |
| 档面漂移（`MANIFEST.md` ∕ `ENGINEERING-MODE-V2.md` ∕ `DOC-SYSTEM.md` 等） | 不笔、只报（核实清单见交付报告） | 设计档归 eng-designer；`MANIFEST.md` 在 `2026-09-29-residuals-round2` 批写域内 |
| 探针断言去脆性 | 真档断包含式（⊇ 已知条目）∕ 文案断宽松匹配 | 评审 #5 ∕ #6（🔵）→ 修正轮已修 + 复跑 |

**审计与代码评审轮次与终态**：
- **内部 explore 分歧审计 ×1**：码面零分歧（部分实现 ∕ 静默简化 ∕ 越界 = 零）；档面漂移 4 处属实 + 2 弱候选（只报不裁）；证据边界 = 该席无 git ∕ shell（「三 hunk 恰限」之核由本席 git diff 自证——终稿 4 hunk、逐 hunk 在册）。
- **内部 advisor 代码评审 ×1**：**VERDICT: pass**（🔴 0 · 🟡 2 · 🔵 5——全非阻塞）。
- **fix round（评审处置）**：已修 3（头注契约句 ∕ 烟测真档断言包含式 ∕ 探针文案宽松匹配——修正后复跑：lint OK + 烟测 15/15 + 探针 4/4）；报告类 4（493 行存量债沿裁 ∕ 档价表回填（父侧笔）∕ `MANIFEST.md` 漂移（父侧面）∕ 核面用例归档建议）；**轮 2 未再起**（所修为注释 ∕ 断言级、零生产语义，以复跑读数自证——在此披露）。
- **终态 = clean**。

**披露 ∕ 未做项**：① 档外触面 = 两枚探针件（`.thincoder/tmp/` 停车场 · 零落仓 · 非仓面落笔）；② `scripts/**` ∕ `PROJECT-MANIFEST.json` ∕ 档面（`DOC-DISCIPLINE.md` ∕ `PROJECT.md`）**零触**（父侧 ∕ 另轮面）；③ 延迟项零——全部验收项已交付（#546 剩余面 = 工具面（父侧已落）+ 档面另轮）。

## §6 验证与收口（父代理）

### 6.1 父侧直改记录（#546 工具面 · 2026-09-29 17:1x——「父侧直接执行」· 可 revert）

> 面判：`scripts/**` ∥ `PROJECT-MANIFEST.json` = 工程工具面（父侧直改）；`thincoder-core/manifest.mjs` = 产品码面（eng-coder #37 · token 门）；文档面 = eng-designer（另轮）。本条记录仅工具面。

**落点与读数**（均实跑核）：
1. **新档 `scripts/doc-check-linecounts.mjs`**（≈150 行）——`parseSectionRows` ∕ `checkLineCounts` ∕ `countContentLines`；`isTableRow` 单源引 `doc-check-width.mjs`（零复制）。
2. **`scripts/doc-check.mjs`**——`CRITERIA_KEYS` 5⇒6（+`lineCounts`）· 行数面调用 + 输出 + 状态行 + 非根 base 声明探查（fail-closed）· 头注随动。
3. **`PROJECT-MANIFEST.json`**——`checkConfig.lineCounts` 实值（`docs/desktop/design/PROJECT.md` §4.1）。
4. **批内件 `docs/batches/2026-09-29-doc-check-face.test.mjs`**（11 用例）——`node --test` **11/11 绿**（正常 ∕ 差异 ∕ 边界 ∕ 错误四组全备）。

**实跑读数**（直调模块 · 显式声明）：
- 引擎：`判据项 6 项（… lineCounts …）` ✓；行数面挂主循环后（执行域 = 运行根一次）。
- §4.1 差异 **26 条**（比对 125 行 · 跳过 11 行〔预估 3 ∕ 非数 8〕）——含设计三例（agent-host 260⇒262 ∕ turn-driver 276⇒287 ∕ views/chat.mjs 362⇒284）✓；**差异清单 = §4.1 回填工单**（逐条 `报告 行数 <doc>:<line> \`<file>\`（表 N ⇒ 实读 M，Δ±d）`，26 条全文存本会话记录）。
- **集成待件**：#37（`manifest.mjs` 默认键 `lineCounts: []`）落 → 读门放行该键 → 引擎 `checkConfig.lineCounts` 生效（现盘实核 = 未知键被读门剥离——本记录即根因定位）。

**边界**：产品码零笔（`manifest.mjs` 归 #37）；文档面（`DOC-DISCIPLINE.md` §7 ∕ `PROJECT.md` §4.1 ∕ 口径句）归设计轮；台账 #546 状态 = 在途（待 #37 落 + 集成实证后转待核销）。

### 6.2 父侧扫尾收口（2026-10-07）

- **实施舱终态复核**：§5 在盘（探针面交付 + 审计/评审在册 · 终态 clean）；§6.1 工具面（#546 面）落点与读数在案。
- **#546 判据复核**：工具面（§6.1）✓ + 集成实证 ✓——`doc-check` 现行输出含「行数面」段（本日复跑 = 「行数面：差异 13 条（比对 162 · 跳过 184）」在跑）⇒ #546 转核销（台账随动）。
- **档面余项**：§6.1 归口「设计轮 ∥ 另轮」的 DOC-DISCIPLINE ∥ PROJECT §4.1 ∥ MANIFEST 漂移面——落态未复核 ⇒ 拆一条台账行（归批）。
- **收口判词：已收口 2026-10-07**（本记录自 2026-09-29 链起实施舱收口完整——本次补记 = 正式 close）。
