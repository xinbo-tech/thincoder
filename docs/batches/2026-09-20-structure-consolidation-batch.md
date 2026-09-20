# 2026-09-20 · 端差·结构收口批（STRUCTURE-CONSOLIDATION-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 04:25 · 来源 = 用户 04:22「**端差 p1/2/3 都要处理**」+ 端差总体评估（explore id=10/11/12）。
> 本档 = **P3**（结构收口：过期登记 · 计数残余 · 未登记族 · 同形重复）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目清单（4 条台账）

| # | 台账 | 条目 | 要点 | 面 |
|---|---|---|---|---|
| 1 | **#119** | **端差登记过期族**（E1–E6 · E8 · E10 · E11 + 归档 E9） | 指向已消失对象（`thincoder-vscode/src/agent-tools/*` 那批 12 档已迁核删除）· 同事实两档两口径（`AGENT-LOOP-SUBAGENT.md:1404`「待落地」∥ `AGENT-LOOP.md:115`「已落地」）· 端差已消解而登记仍述分叉（MEMORY §4.7）· 同表退役标独漏一行（ESCALATE `:103`）· 枚举过期（TOOLS §1）· 归档档无作废头（E9 · **建议判不动**） | 文档面 |
| 2 | **#120** | **计数收正残余** | `check-vsix.mjs:29` `tool-docs` **25 → 24**（工程工具面）· `CORE-UNIFICATION` 活档 ~10 处「25 档」+ 两产品 `AGENTS.md:15`/`:125`（**J-3 射程只 4 档 ⇒ 此前判「已毕」实为部分完成**） | 工具 + 文档面 |
| 3 | **#121** | **未登记端差族** | **U1（需裁）**：「规则发现」两端两套机制（CLI stream 规则 ∥ VSC `.cursor/rules`+`globs`），且 VSC `loadRules` **零 importer = 死码**、CLI 侧零对位 · U2 `memory` 工具面端自持未登记 · U3 CLI 特有运维档仅粗粒度覆盖 | 需求层裁定 + 文档面 |
| 4 | **#127** | **同形重复 7 处（漂移风险）** | 上下文注入块（`listWorkDir` 逐字同形）· [4] 层 system 尾块 · 提醒族 · 续跑循环（ContinueError 循环两份）· `ContinueError` 类双定义 · memory schema/描述两份 · 多实例聚合镜像核私有件 16 行 | 结构 |

### 1.2 边界与**本轮必需产出**

- **U1 需能力层裁定** ⇒ 设计轮先给选项（① 取一侧（丢哪边语义）② 两端各自保留 + 显式登记两套语义 ③ 统一为「作用域规则 + globs」新机制（**新能力面 ⇒ 另立需求**））+ 推荐 + 代价。
- **重复 7 处**：设计轮逐项给「**收口成本 vs 漂移风险**」+ 建议（收口 / 判保留 + 双改纪律入档）——**不得**未裁先动产品码。
- **E9（归档档）**：建议判不动（政策 = 保留≠维护）；若加「作废声明头」须先裁。
- **不动**：纯显示面（P1）· 机制层分叉（P2）· 冻结批档（承 02:07 口径：批档内不符 ⇒ 设计档侧注明/errata，不回改）。
- 文档债治理口径照 2026-09-20 02:07 三条（只追错档/死对象/计数不符；行号漂移按 D4 结）。

### 1.3 验收

① 逐条「台账 id → 改动 file:line（或裁定不动作 + 理由）」；② `doc-check` 净增 0；③ 触及 `scripts/**` 或产品码：实跑读数 + 相关包 `node test/run.mjs` 全绿；④ U1 / 重复 7 处 / E9 的裁定记录在 §4。

### 1.4 台账

#119 / #120 / #121 / #127 → 本批（待讨论 → **待设计** · 任务书指针 = 本档 §2）。

## §2 批次任务与设计（eng-designer）

> 编制 = eng-designer · 2026-09-20 05:0x · 轮次 = initial · 任务书 = 本档 §1 全段 · 证据 = 台账 #119 / #120 / #121 / #127（逐处 file:line 由父侧给出，本席只对**新写坐标**实读）。
> 落盘口径：**设计档面 = 本席本轮已落**（承一致性同步批「批 3 · eng-designer 已落」先例）；**产品码 = 只出建议、未裁不动**；**需求档 / 提示词 / 冻结批档 / 他批写域 = 零触碰**。

### 2.1 概览（四条台账 → 处置面）

| # | 台账 | 处置面 | 本席动作 |
|---|---|---|---|
| 1 | #119 | 设计档 6 处 + 归档档 1 处（E9 建议判不动）+ G-1 同判据更大面 14 处 | **已落**（E1 扩面 +4；E2/E4/E5 = 需求档 = 父侧笔） |
| 2 | #120 | `CORE-UNIFICATION.md` 设计档 16 处 + J-3 射程补正 1 块 | **已落**（`check-vsix.mjs` = 他批已裁 lane，不重做；需求档 + 两产品 AGENTS.md = 剩余两面） |
| 3 | #121 | U1 = **选项 + 推荐 + 代价（裁定项，落 §4）**；U2/U3 = 登记补记 | U2/U3 **已落**；U1 零动 |
| 4 | #127 | 7 处同形重复 = **逐项成本/风险 + 建议（裁定项，落 §4）** | 零动产品码（承派单禁止范围） |

### 2.2 条目 1 · #119 逐条（改法 / 裁定保留 + D8 两分判据理由）

| # | 坐标 | 现态 | 判 | 改法（本轮已落） |
|---|---|---|---|---|
| E1 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:1404` | 「端壳消费点…已并入；**实现待实现轮落地**——§6.27.12.12」 | A 类（失效表达·D8） | 删失效半句 →「夹具同步；端侧细则见 §6.27.12.12」 |
| E1 扩面 | 同档 `:1067` `:1292` `:1779` `:1852` | 同谓词「实现待实现轮落地」×4（**台账未列**） | A 类（同族） | 逐处改「实现已落地」（与 `AGENT-LOOP.md:115` 口径对齐） |
| E3 | `docs/core/design/AGENT-LOOP.md:109` / `:111` | 「VSC 现役 = `…/agent-tools/advisor-async.mjs:64-72`」（+ `:83-85` / `:118`）——该档不在盘 | A 类（对象消失） | 改「VSC 侧该端档已退役（W12 删除集）——现体 = 核单源」+ 迁移期引文标记（与同表 `:100/-101/-104/-106` 同款） |
| E6 | `docs/core/design/ESCALATE.md:103` | VSC 结算 helper 行无退役标记（同表 `:100` `:101` `:104` `:106` 均有） | A 类（同表独漏） | 补「该端档已退役（W12 删除集；现体 = 核同档）」+ 迁移期引文 |
| E8 | `docs/core/design/TOOLS.md:19` | VSC 单端 12 档枚举 | A 类（枚举过期·D3） | 收正为现盘 6 档（`code` / `context` / `focus` / `index` / `shared` / `shell`）+ 迁核注（`checkpoint` 现体 = 核 `thincoder-core/git/checkpoint.mjs`） |
| E8 | 同档 `:105` | `VSC tools/checkpoint.mjs` 行无标记 | A 类 | 补退役标记（W14 删除集）+ 迁移期引文 |
| E10 | 同档 `:233` | timer 契约行带「（VSC 未同步该修复——已列裁决行 #86）」 | A 类（挂尸·对象消失：VSC 自持 timer 已随迁核删除，全树零 `timerTool` 实现） | 删括注，留契约本体 |
| E11 | `docs/core/design/WORKSPACE.md:16` | VSC 格 `peer-domains.mjs` 为裸相对段 | A 类（D4 细则·坐标完整路径形态 2026-09-20 立） | 改全路径 `thincoder-vscode/src/extension/peer-domains.mjs` |
| E2 / E4 / E5 | `docs/core/requirements/AGENT-LOOP.md:163` / `:167` · `…/MEMORY.md:151-159` · `…/CONSULTATION.md:69` | 需求档内死坐标 / 端差已消解而登记仍述分叉 | A 类但**面 = 需求档** | **零触碰**（D1 写权 = 主 agent）⇒ 建议父侧同轮收正：E4 的端差对象已消解（`thincoder-vscode/src/memory-tool.mjs:5-7` 自陈存储/检索已归一核面 sqlite；设计档 `docs/core/design/MEMORY.md` §6.9 已收正） |
| E9 | `thincoder-vscode/docs/_archive/CAPABILITY_GAP.md` | 归档档无作废声明头、内容与现态相反 | **裁定保留（建议）** | 判据（D8 两分）：对象 = **归档档**——归档政策 = **保留 ≠ 维护**；该档**非现役规范面**（不在 `docs/` 机检域）⇒ 判不动。若加「作废声明头」= 归档档**半维护形态**且须先裁（落 §4）。**注**：档内 `:17` 已带 W8 迁核注记（自身已半更新） |
| G-1 | `docs/core/design/ARCHITECTURE.md` §3.1 表 **8 行**（`:87`–`:94`，共 **15 处**引用）+ `:82` / `:130` / `:148` · §7.2 行 1 `:182` · `docs/vsc/design/WEBVIEW.md` §7.2 行 2 `:412` | 指 `thincoder-vscode/docs/design/*.md`——实测该目录**仅剩 `_archive/`** | A 类（归档址死指针；机检不红 = 多义 basename 宽容规则） | 逐处改指**归档址** `thincoder-vscode/docs/_archive/design/…` + 标 as-of 2026-09-20（与一致性同步批 RELEASE / ARCHITECTURE 同判据）；§3.1 行 93 的死 token（`thincoder-vscode/src/provider.mjs`）按**死名裸名书写纪律**改裸名（消自伤悬空） |
| G-1 保留 | `ARCHITECTURE.md:197`（变更记录）· 产品树 `docs/design/` 目录自身 | 记录面 / 目录 | **保留** | D8 记录面零触 |

### 2.3 条目 2 · #120 计数收正残余 + J-3 射程补正

**a) 面拆分（四面，只落本席面）**

| 面 | 对象 | 状态 |
|---|---|---|
| 工程工具面 | `thincoder-vscode/scripts/check-vsix.mjs:29` `EXPECT["tool-docs"] 25 → 24` | **他批已裁 lane**：一致性同步批 §2.3「待父侧直改」+ §4 批准范围批 2——**本批不重做、不重写**；实读该行仍为 `25` ⇒ **待执行**（父侧直改） |
| 设计档面 | `docs/core/design/CORE-UNIFICATION.md` **现役计数句 16 处** · `DOC-DISCIPLINE.md` §3.9 J-3 | **本席已落** |
| 需求档面 | `docs/core/requirements/CORE-UNIFICATION.md:117` | **父侧笔**（未并面剩余 1/2） |
| 产品文本面 | `thincoder-cli/AGENTS.md:15` · `thincoder-vscode/AGENTS.md:125` | **eng-coder 轮**（未并面剩余 2/2；与一致性同步批**批 1 同档 ⇒ 须串行**） |

**b) 改法（A 类 16 处 ⇒ 24 / 39）**：`:65`（形态树）· `:80`（运行期面 vs 文档面）· `:86`（消费契约 1）· `:96`（契约 8）· `:164`（§2.3.3 选定 a）· `:166`（候选 c 描述）· `:408`（S1 退出达标）· `:637`（断言 D 标签）· `:1003`（D-C5）· `:1008`（D-C11 断言 D）· `:1010`（D-C13——含派生数 `40 档` → **`39 档`**）· `:1031`（受影响文件表）· `:1053`（check-vsix 行）· `:1161`（F8）· `:1515`（T-C7）· `:1516`（T-C8 两处 `15 + 25`）。**取值 = 盘上实核 24**（`thincoder-core/tool-docs/*.md` = 24；核内断言已 24）。

**c) B 类保留面（闭集 · 逐类给理由）**：事实基线 as-of 两行（`:31` / `:40`——S0「自核」读数快照，对象 = 迁移前两产品面）· 记录面行（`:697` 计数命令行 · `:1858` / `:1899` 变更记录行）· 迁期排期与口径记录行（`:701` / `:955` / `:956` / `:957` / `:1495`——U2 单元体量与「40 档 = 104 对子集」口径注）。

**d) J-3 射程补正（已落 `DOC-DISCIPLINE.md` §3.9 J-3 块 `:510`–`:512`）**：J-3 A 类原射程 **4 档 7 处**（ARCHITECTURE / DOC-SYSTEM / PROMPT-SYSTEM / TOOLS）⇒ 实为**部分完成**；补正 = 扩入 `CORE-UNIFICATION.md` 16 处 + 保留面改以本条为单源（**§5 A-DD19 ④ / ⑥ 的保留面枚举以本行为准**，该两行 = 2026-09-18 批验收快照、零改）。剩余两面（需求档 / 产品文本面）逐条列于本条。

### 2.4 条目 3 · #121（U1 裁定项 · U2/U3 登记补记）

**U1「规则发现」两端两套机制（需能力层裁定 · 本批零动产品码）**

事实：CLI = `.thincoder/rules/*.md` + frontmatter `pattern/action/repeat`（**stream 规则**，`thincoder-core/rules.mjs:22 discoverRules`，唯一消费 `thincoder-cli/src/cli/make-agent.mjs`）；VSC = `.thincoder/rules/` **＋ `.cursor/rules/`** + `globs`（**文件作用域注入**，`thincoder-vscode/src/extension/rules.mjs:23 loadRules`）——该档**全树零 importer（死码）**（实测：`thincoder-vscode/**/*.mjs` 仅命中定义行本身）；CLI 侧 `.cursor/rules` 与 `globs` **零实现**。

| 选项 | 内容 | 代价 |
|---|---|---|
| ① 取一侧 | 统一为 CLI stream 规则（或 VSC globs 形态） | **静默丢掉另一侧语义**（丢 `globs` / `.cursor` ⇒ 用户既有 `.cursor/rules` 与文件作用域注入失效；丢 `pattern/action` ⇒ 失去 abort/warn 拦截能力）——两端**任一取一侧都是能力删除** |
| ② 两端各自保留 + 显式登记两套语义（**推荐**） | 登记「同名不同物」+ VSC 侧零消费现状 + CLI 无对位 | 低——零代码改动；代价 = 登记面 1 行 + 后续须防「按『取一侧』误执行」（登记即护栏）。**配套小项（须裁）**：VSC `loadRules` 死码的处置（删除 或 接线）⇒ 建议**随本裁定一并裁**，未裁前保持零动 |
| ③ 统一为「作用域规则 + globs」新机制 | 两端收敛到一套（含 `.cursor/rules` 兼容） | **新能力面 ⇒ 须另立需求**（设计→评审→实现全链），且要重定义 stream 规则与 globs 的共存语义、迁移用户既有 `.thincoder/rules/*.md` 与 `.cursor/rules` |

**推荐 = ②**（判据：① 丢能力、③ 是新能力另立需求；② 是登记面动作、零语义风险，且立刻消除「按取一侧误执行」风险）。裁定后落 §4；落地 = 登记面（设计档 `WORKSPACE.md` §2 行 #171 / §1 表 · 需求档同步 = 父侧笔）。

**U2（已落）**：`docs/core/design/MEMORY.md` §6.9 增 1 行——「工具面 = 端自持」（`thincoder-vscode/src/memory-tool.mjs:42-60` = 端前端形态；执行器/输出契约取核 `memoryTools`（`thincoder-core/memory/docs.mjs:251`）⇒ **同一契约两份形态，改动须双改**）。需求档 `docs/core/requirements/MEMORY.md` §4.7 的结构事实行 = 父侧笔（建议同轮补）。

**U3（已落）**：`docs/core/design/WORKSPACE.md` §1 增「端特有运维 / 交互面（粗粒度覆盖）」行——`thincoder-cli/src/{crash-reports,upgrade,completions,heap-watch,distill}.mjs` · `thincoder-cli/src/tui/{update-notice,mouse,fold-block}.mjs`（**盘上实核 7/7 在位**），对位 = 无（VSC 走 webview / 宿主能力）；`tui/mouse.mjs` 承载评审 ⏹ 点击取消，VSC 对位 = webview 点击。

### 2.5 条目 4 · #127 同形重复 7 处（**逐项 收口成本 vs 漂移风险 + 建议** · 未裁不动码）

| # | 处 | 现状（实读） | 收口成本 | 漂移风险 | 建议 |
|---|---|---|---|---|---|
| ① | 上下文注入块 | VSC `src/agent/context-injections.mjs`（216 行：`loadProjectInstructions:38` / `listWorkDir:66` / `pushOsSnapshot` / `pushOutline` / `pushDocRecall` / `pushMemoryRecall` / `injectRunContext`）∥ 核 `agent/setup.mjs`（234）+ `agent/helpers.mjs`（390）；`listWorkDir` **除 JSDoc 逐字一致** | 中（核侧须抽可注入 fs / end 的公共面；VSC 调用点 7 处改指） | **中**：现态逐字一致 ⇒ 尚无行为分叉，但**核侧一改 VSC 静默不跟** | **收口（择机）**——列入「核面抽取」候选；收口前登记「双改纪律」（改核 `helpers.mjs` 同族函数必同改端档） |
| ② | [4] 层 system 尾块 | 核 `agent/setup.mjs:221-229` ∥ VSC `src/agent/setup.mjs:346-355`（同文案两写） | 低（10 行级函数抽取） | **低-中**：文案改一侧即端差（影响 system prompt 逐字面） | **收口（低风险优先项）**——抽核侧 helper 两端同调 |
| ③ | 提醒族 | 核 `agent/setup-reminders.mjs`（199）∥ VSC `src/agent/setup-reminders.mjs`（138）——**已分叉**（env 行端身份：核 `${END}` ∥ VSC 硬编 `"vscode"`；签名分叉） | 高（分叉已固化 + 端身份是**有意差异**） | **高**（已在分叉中运行） | **判保留 + 双改纪律入档**（端身份 = 合法端差；把「分叉点枚举」登记到该档） |
| ④ | 续跑循环（ContinueError 两处） | CLI `src/tui/agent-turn.mjs:182-190` ∥ VSC `src/extension/panel-turn-loop.mjs:84-124`（规则同形 · 呈现面不同：TUI 提示行 vs 面板 ask） | 高（循环本体与各端交互面耦合） | 中（规则口径改一处即端差：`autoTurn` 自动续跑 / 手动静默停） | **判保留 + 双改纪律**；或抽核内纯函数 `continueDecision(error, {autoTurn, autoApprove})` = 中等成本收口候选 |
| ⑤ | `ContinueError` **类双定义** | 核 `agent/helpers.mjs:205`（`turn` 字段）∥ VSC `src/agent.mjs:43`（`turns` 字段）——**字段名都不同** | 低（VSC 改为 re-export 核类） | **高**：`instanceof` 失配 + 字段名分叉（`error.turn` ∥ `e.turns`） | **收口（最高优先）**——核类单源 + VSC re-export；连带核 VSC 两处消费点字段名 |
| ⑥ | memory schema / 描述两份 | 核 `memory/docs.mjs:251 memoryTools` ∥ VSC `src/memory-tool.mjs:42`（描述 / schema 两份；VSC 值域 `personal|project`、无 team） | 中（VSC 需端注入描述差异——team 层拒绝句） | **中-高**：描述改动须双改（模型可见面 ⇒ 影响行为） | **收口（端注入形态）**——契约单源 + 端注入差异段（与 U2 登记配套） |
| ⑦ | 多实例聚合镜像核私有件 | VSC `src/extension/peer-instances.mjs:1-37` 自述镜像核 `groupSlotSessions` **16 行**（核 `:84-99` ⇄ VSC `:78-93`） | 低-中（核导出该函数即可） | 中（16 行副本；核改 VSC 不跟） | **收口**——核侧导出 `groupSlotSessions`（去「私有件」身份）后 VSC 改调；胜于长期镜像 |

**汇总建议**：立即收口 = ⑤（类双定义：成本最低、风险最高）；低风险优先 = ② ⑦ ⑥；择机 = ①；判保留 + 双改纪律 = ③ ④。**未裁前零动产品码**（本席未动）。

### 2.6 受影响文件表 + 实施分批

| 档 | 面 | 执行方 | Δ（本批） | 说明 |
|---|---|---|---|---|
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 设计档 | **eng-designer（已落）** | 0（行内改写 ×5） | E1 1 处 + 扩面 4 处 |
| `docs/core/design/AGENT-LOOP.md` | 设计档 | **已落** | 0（行内 ×2） | E3 |
| `docs/core/design/ESCALATE.md` | 设计档 | **已落** | 0（行内 ×1） | E6 |
| `docs/core/design/TOOLS.md` | 设计档 | **已落** | 0（行内 ×3） | E8 ×2 + E10 |
| `docs/core/design/WORKSPACE.md` | 设计档 | **已落** | +1 行 | E11 + U3 登记行 |
| `docs/core/design/ARCHITECTURE.md` | 设计档 | **已落** | 0（行内 ×14） | G-1（含死名裸名收正 1 处） |
| `docs/vsc/design/WEBVIEW.md` | 设计档 | **已落** | 0（行内 ×1） | G-1 行 2 |
| `docs/core/design/CORE-UNIFICATION.md` | 设计档 | **已落** | 0（行内 ×17） | #120 A 类 16 处 + `:166` |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档 | **已落** | +3 行 | J-3 射程补正块 |
| `docs/core/design/MEMORY.md` | 设计档 | **已落** | +1 行 | U2 登记 |
| `thincoder-vscode/scripts/check-vsix.mjs:29` | **工程工具面** | **父侧直改**（他批已裁 lane · 待执行） | 0（1 处数字） | 25 → 24；改后实跑读数 |
| `docs/core/requirements/CORE-UNIFICATION.md:117` · `AGENT-LOOP.md:163/:167` · `MEMORY.md:151-159` · `CONSULTATION.md:69` | **需求档面** | **主 agent** | — | E2 / E4 / E5 + #120 需求侧 |
| `thincoder-cli/AGENTS.md:15` · `thincoder-vscode/AGENTS.md:125` | **产品文本面** | **eng-coder 轮**（token 门） | ~2 行 | 25 → 24；**与一致性同步批 批 1 同档 ⇒ 必须串行** |

**实施分批（四车道）**：**车道 A = 设计档已落**（本批已完，评审可逐行核）· **车道 B = 父侧直改**（`check-vsix.mjs:29`，机械 + 实跑 + 单提交可 revert）· **车道 C = eng-coder 轮**（两产品 `AGENTS.md` 读数；须与一致性同步批 批 1 排位）· **车道 D = 主 agent**（需求档 4 档）。U1 / #127 收口项 = **等 §4 裁定**后另批。

### 2.7 验收命令（cmd.exe · 全 ASCII · 无中文 `findstr /c:`）+ 实跑读数

1. 机检：`cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` ⇒ **实跑**：悬空 **1**（存量 · 他批在途 `MODEL-SPECS.md:380` 符号面）· 行宽 **0** · exit 1 ⇒ **本席净增 0**（首测曾 +1 自伤悬空 = 裸 `AGENTS.md:15` token，已改全路径消解）。
2. `node -e "const fs=require('fs');const c=fs.readFileSync('docs/core/design/CORE-UNIFICATION.md','utf8').split('\n');const n=[65,80,86,96,164,166,408,637,1003,1008,1010,1031,1053,1161,1515,1516];const b=n.filter(i=>{const t=c[i-1]||'';return !(t.includes('24')||t.includes('39'))});console.log(b.length?'FAIL '+b:'OK 16 count lines at 24/39');process.exit(b.length?1:0)"` ⇒ `OK 16 count lines at 24/39`。
3. `node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/AGENT-LOOP-SUBAGENT.md','utf8');const n=t.split('实现待实现轮落地').length-1;console.log(n?'FAIL '+n:'OK 0 stale impl-pending');process.exit(n?1:0)"` ⇒ `OK 0 stale impl-pending`。
4. `node -e "const fs=require('fs');const a=fs.readFileSync('docs/core/design/AGENT-LOOP.md','utf8');const e=fs.readFileSync('docs/core/design/ESCALATE.md','utf8');const k='thincoder-vscode/src/agent-tools/advisor-async.mjs';const k2='thincoder-vscode/src/agent-tools/async-settle.mjs';const bad=[];if(a.includes(k))bad.push('AGENT-LOOP');if(!((e.split(k2).length-1)===1&&e.includes('该端档已退役')))bad.push('ESCALATE');console.log(bad.length?'FAIL '+bad:'OK retired coords marked');process.exit(bad.length?1:0)"` ⇒ `OK retired coords marked`。
5. `node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/ARCHITECTURE.md','utf8').split('\n');const live=[];t.forEach((l,i)=>{if(l.includes('thincoder-vscode/docs/design/'))live.push(i+1)});console.log('live refs '+live);process.exit(live.length===1?0:1)"` ⇒ `live refs 197`（仅变更记录行 = 记录面，合法）。
6. `node -e "const fs=require('fs');const d=fs.readdirSync('thincoder-core/tool-docs').filter(f=>f.endsWith('.md')).length;const s=fs.readFileSync('thincoder-vscode/scripts/check-vsix.mjs','utf8');const x=Number(s.match(/\"tool-docs\":\s*(\d+)/)[1]);console.log('disk '+d+' expect '+x)"` ⇒ `disk 24 expect 25`（⇒ 车道 B 待执行，改后须为 24 / 24）。
7. 触及 `scripts/**` 后（车道 B）：`cd thincoder-vscode && node scripts/check-vsix.mjs` 实跑读数 + `node test/run.mjs` 全绿。

### 2.8 边界（本批不做）

**未裁先动产品码**：U1（规则发现机制）· #127 全部 7 处收口项——仅建议，产品码零触碰。· 纯显示面（P1）· 机制层分叉（P2）· 冻结批档（承 02:07 口径：批档内不符 ⇒ 设计档侧注明）· 需求档笔 · 提示词 / 产品码 · 他批写域（`check-vsix.mjs` 他批 lane = 不重做）· **行号漂移追改**（承 D4）· `_archive/**` 本体改动（E9 判不动）。

### 2.9 三向同源

批档 §2 条目标题 = 台账 #119 / #120 / #121 / #127 = 本设计逐条表项：`#119 → §2.2` · `#120 → §2.3` · `#121 → §2.4` · `#127 → §2.5`；验收回指 = §2.7 命令 1–7（逐条可跑）。

### 2.10 不一致处 / 需上抛（逐条）

1. **#120 lane 重叠**：`check-vsix.mjs:29` 已由**一致性同步批**（§2.3 + §4 批 2）设计并批准为「父侧直改」⇒ 本批**不重做**；两批对同一对象各有设计 = 双源风险 ⇒ 建议以该批 §2.3 为执行单源，本档只登记指针。
2. **台账计数与实况不符（D3）**：#120 称 CORE-UNIFICATION「~10 处」并列 11 坐标；实测**现役计数句 16 处**（多出 `:166` `:408` `:637` `:1008` `:1516`）⇒ 已按实测收正并在 J-3 补正块记数。
3. **G-1 未被派单枚举**：#119 台账含 G-1（同判据更大面），派单「已知事实」只列 E1–E11 ⇒ 本席按台账证据面纳入并落（附件计数：台账记「§3.1 表 8 处」，实测 = **8 行 / 15 处引用**）。
4. **E1 族大于台账所列**：同档另有 4 处「实现待实现轮落地」（`:1067` `:1292` `:1779` `:1852`）⇒ 已同族收正。
5. **机检基线与派单不符**：派单称基线「悬空 0 · 行宽 0 · exit 0」；本席首测（域内实况）= 悬空 3（2 存量 + 1 自伤）⇒ 存量 2 = `ARCHITECTURE.md:93`（本席按死名裸名纪律收正）+ `MODEL-SPECS.md:380`（**他批在途面**，非本批写域）⇒ 收正后悬空 1，**本席净增 0**。
6. **J-3 保留面口径冲突**：`DOC-DISCIPLINE.md` §5 A-DD19 ⑥ 记「`CORE-UNIFICATION.md` 全族 B 类零 diff（照留）」——与本批「现役计数句属 A 类」相抵 ⇒ 处置 = J-3 块内**射程补正行作单源**（A-DD19 ④ / ⑥ 为 2026-09-18 批验收快照、零改）；**该口径反转是否需用户裁 = 上抛 §4**。
7. **未并面剩余 4 处**：需求档 3 档 + 产品文本面 2 处（两产品 `AGENTS.md`）⇒ 分别归主 agent / eng-coder 车道（后者须与一致性同步批 批 1 串行）。
8. **E9 政策面**：归档档加「作废声明头」= 半维护形态 ⇒ 本席建议判不动，**最终裁定落 §4**。
9. **U1 死码**：VSC `loadRules` 零 importer（死码）为**独立于「取一侧 / 保留」的第三问**（删 或 接线）⇒ 建议与 U1 同裁。
10. **`TOOLS.md:78` / `:134` 保留**：timer 裁决表行内「VSC 未同步该修复」为 S1 裁决记录面（已裁 2026-09-13）⇒ 按 D8 记录面保留，仅收正现役契约行 `:233`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | #120「计数收正残余」的 B 类保留面声称为闭集（`DOC-DISCIPLINE.md:511`），但盘上仍有未列入 A/B 两表的 `25` 坐标：`CORE-UNIFICATION.md:44`（B18 事实基线行——与已列的 `:31`/`:40` 同类）· `:225`（§2.4 G1-b 判定口径行——同档他处已收正 24，此处仍 25 = 同档两口径）· `:710`（§2.6.3 主表 U2 行「工具描述 25」）· `:1041`（§2.8「提示词副本删除」行 `（25×2）`）；§2.7 命令 2 只断言 16 行含 `24/39`，无「其余 `25` 命中集 ⊆ 保留面」的子集判 ⇒ 闭集声明无机检。 | 四处按同一 A/B 两分补判（`:225` 属现役判定口径 ⇒ 宜按 A 类改 `24`；`:44`/`:710`/`:1041` 若判保留则逐处入 B 类枚举）；并补一条子集判断言（全档 `25` 命中集 ⊆ 保留面枚举）。 |
| 2 | Requirements | 🟡 | 需求档 lane 的坐标**点名单点化**：§2.3(a) 只点名 `docs/core/requirements/CORE-UNIFICATION.md:117`；同档 `:118`（N5＝设计档 D-C11 断言 D 的镜像句，其设计档孪生行 `CORE-UNIFICATION.md:1008` 已按 A 类收正为 24）等实存「25」——与他档同对象两计数；照单执行会重演本批起点「判已毕实为部分完成」。 | 该 lane 改「全文件扫 + A/B 两分」口径（点名坐标仅作示例），并登记 A 类坐标清单。 |
| 3 | Requirements / Document ownership | 🟡 | E8 行处置不对称：`TOOLS.md:19` VSC 列已收正为现盘 6 档 + 迁核注，同表 **CLI 列**仍列 6 档 `tools/{bash,checklist-sync,edit-batch,glob-dialect,patch,repomap}.mjs`——`thincoder-cli/src/tools/` 盘上不存在（U13 迁核：`thincoder-core/tools/{bash,edit-batch,glob-dialect,patch,repomap}.mjs` 在位；`checklist-sync.mjs` 随 checklist 废除），且该列无迁核注、仍为裸相对段（与批内 E11 的 D4 细则及本行 VSC 列处置不一致）。 | 给 CLI 列同款收正（现盘 = 空 + 迁核注）或整行标注 as-of 分析面；两列口径一致。 |
| 4 | Document ownership | 🟡 | G-1 同类指针未闭合（逐处实核：均指 `<产品>/docs/design/**`，实存 `_archive/design/**`）：`docs/vsc/design/WEBVIEW.md:7` / `:393` / `:434`（同档 `:412` 已改归档址 ⇒ 同档两址并存）· `ARCHITECTURE.md:168`（`thincoder-cli/docs/design/ARCHITECTURE.md`）· `CORE-UNIFICATION.md:12`（两产品 `docs/design/prompts/*.md`）· `TOOLS.md:257` / `:485`（`thincoder-vscode/docs/design/TOOLS.md`）· `AGENT-LOOP-SUBAGENT.md:506` / `:720`（`thincoder-vscode/docs/design/AGENT-LOOP.md`）。 | 按批内 G-1 判据（归档址 + as-of）逐处收正，或明示「来源 / 沿革 / 政策句整类 = B 类保留面」并逐处登记——两口径择一。 |
| 5 | Clarity | 🔵 | G-1 计数不可勾稽：§2.1「G-1 同判据更大面 **14 处**」/ §2.6「行内 ×14」 vs §2.2「§3.1 表 8 行（`:87`–`:94`，共 **15 处**引用）」 vs 盘上实况 **12 行**（`:82`/`:87`–`:94`/`:130`/`:148`/`:182`）；且「标 as-of 2026-09-20」只出现在 `:82` 头注。 | 统一计数口径（行数 / 引用处数分列），并说明 as-of 标注粒度。 |
| 6 | Requirements | 🔵 | U3 登记行称「盘上实核 **7/7** 在位」，但所列 8 档（`src/{crash-reports,upgrade,completions,heap-watch,distill}.mjs` 5 + `src/tui/{update-notice,mouse,fold-block}.mjs` 3）实测 **8/8** 在位 ⇒ 计数不符（实质成立、数字失配）。 | 改为「8/8 在位」。 |
| 7 | Clarity | 🔵 | E1 族落态词面不统一：`:1404` =「已并入…夹具同步」· `:1067` =「已并入（…设计面）」· `:1292`/`:1779`/`:1852` =「实现已落地」；且 `:1278` 含「实现已落地」而不在扩面清单内 ⇒ §2.2「逐处改『实现已落地』」与落态不可逐处对齐（词面 / 坐标漂移）。 | 统一四处词面，或补一句口径（清单 = 待改谓词所在行，非词面落点）。 |
| 8 | Clarification / Annotation | 🔵 | 受影响文件表对 `thincoder-vscode/scripts/check-vsix.mjs` 只给 Δ「0（1 处数字）」，未给当前行数（非 `.md` 档 ⇒ 不在豁免面）。 | 补当前行数（`wc -l`）并标「结构未变」。 |
| 9 | Document ownership | 🔵 | J-3 补正块单源覆盖 vs `DOC-DISCIPLINE.md` §5 A-DD19 ⑥：⑥ 坐标列含「`CORE-UNIFICATION.md` **全族**」（零 diff 要求），与本批 17 处改动相抵；⑥ 自带行级 caveat（「同档他行的正当改述不属其列」）但坐标列未改——设计已登记（§2.10-6）并将「口径反转是否需用户裁」上抛 §4。 | 裁定后在 A-DD19 ⑥ 侧补一行回指（或按裁定改判据）；无裁前保持零改。 |

范围外提示（无严重度）：U1 / #127 的事实底座（产品码：`loadRules` 零 importer · ContinueError 双定义等）与 `check-vsix.mjs:29` · 两产品 `AGENTS.md` 的 25 读数 = 声明排除面，本轮未复核；`doc-check` / `node test/run.mjs` 读数为本次无 shell 环境，未复跑（命令 1 / 6 / 7 属此列，命令 2–5 的断言已按盘上文本逐条比对通过）。

VERDICT: pass

计数：🔴 0 · 🟡 4 · 🔵 5（发现 9 条）

## §4 用户批准（主 agent）

**2026-09-20 05:16 用户直接批准** —— 逐字「**都按建议**」（回父侧「P3 四项 + P2 八项」呈裁）。

**裁定表（五项）**：① **U1 = 选项②**（两端保留两套规则语义 + 显式登记；取一侧 / 新机制均不取）✓ ② **`loadRules` 死码 = 先登记**（不删不接线；**接线 = 新能力面 ⇒ 另立登记 #130**）✓ ③ **E9 = 判不动**（归档档保留≠维护）✓ ④ **J-3 口径反转成立**（`CORE-UNIFICATION.md` 16 处现役计数句改 24/39 保留；旧两行零改 + 补正块为单源）✓ ⑤ **#127 按序**：⑤ `ContinueError` 立即收口 · ②⑦⑥ 优先 · ① 择机 · ③④ 保留 + 双改纪律入档。

**批准范围**：① 设计定稿（批档 §1–§2 + 已落设计档十档）；② 三道并行：**B 父侧直改**（`check-vsix.mjs` 25→24 · 05:0x 已落 ✓）· **C eng-coder**（两产品 `AGENTS.md` 残余计数——与一致性批 1-B 同档 ⇒ 调度器串行）· **D 主 agent**（需求档 4 坐标 + J-3 的 `:117`）；③ **#127 收口 = 另批**（设计轮随 §2.5 建议落）；④ **#130 登记**（`loadRules` 接线 = 能力面）。

**收口预告**：C/D 落定 → 逐条核 E 族 / G-1 / 计数 / U2-U3 登记 → §6 收口 + 核销 #119–#121 + #127 归批 + 提交 + push。

## §5 实施记录（eng-coder）

### 实施记录 · 车道 C（#120 两产品 `AGENTS.md` tool-docs 计数残余 · eng-coder）

**状态行**：✅ 交付完成 · 内审（read-only explore 背离审计）= 四类偏差零 · 代码评审（advisor `type=code`）轮 1 **pass** · fix round = 0 ⇒ **终态 = clean**。任务书 = §2.3(a) 产品文本面行 + §2.6 受影响文件表末行 + `docs/core/design/DOC-DISCIPLINE.md:510-512`（J-3 射程补正块）。轮次 = initial。

#### ① 交付摘要（file → 落点 → Δ）

| # | file | 落点 | 落地 | Δ |
|---|---|---|---|---|
| 1 | `thincoder-vscode/AGENTS.md` | `:15` | 「`thincoder-core/tool-docs/` **25** 档工具描述」→ **24 档工具描述** | 0（1 数字） |
| 2 | `thincoder-vscode/AGENTS.md` | `:127` | 「(`prompts/` 15 + `tool-docs/` **25** — names + sha256)」→ **`tool-docs/` 24** | 0（1 数字） |

- **越线改动 = 0**：写域恰为声明 1 档 2 处；档内其余未提交 hunk = 一致性同步批 1-B 的 C1–C12 面（死链/枚举/模块图块），非本席所动（advisor 声明面已排除）。
- **`thincoder-cli/AGENTS.md` = 零改动**（理由见 ② D1）——故本车道实际面 = **1 档 2 处**（非设计写的「两档 ~2 行」）。
- 措辞零改（只换数字）· 无新增注记 · 无结构性重写 · 未触 `check-vsix.mjs` / 需求档 / 他批写域。

#### ② 决策透明表（决定 / 理由（证据） / 代价）

| # | 决定 | 理由（证据） | 代价 / 处置 |
|---|---|---|---|
| D1 | **CLI 档零改动**——任务书坐标 `thincoder-cli/AGENTS.md:15` 在盘上无对应物 | 该档 `25` 全档**零命中**（grep）；`tool-docs` 仅 `:49`（模块图族名行，**无计数**）；`:15` 实为**空行**（`:14` = 逐档权威地图行 / `:16` = `## Hard Constraints`）⇒ 无可收正对象；A 类收正 = 只改「现役计数句」，**不为凑坐标制造新句** | 设计/批档的 CLI 半坐标 = 误指（残留实为 1 档 2 处）⇒ 上抛 3；本席不改设计档（写域外） |
| D2 | **只换数字**（不加「原 25 → 24」注、不改句式） | 设计要点「措辞与本档既有风格一致」+ §2.8 禁结构性重写；两处均属现役计数句 ⇒ 纯值收正（D3 计数与列表同改） | 无 |
| D3 | **取值 = 24** | 盘上实核 `thincoder-core/tool-docs/*.md` = **24**（无 `checklist.md`——随 M7 退役成对删）；核内断言 = 24（`thincoder-core/test/prompt-files.test.mjs:73` · `core-prompt-face.test.mjs:20-22` · VSC `test/tool-descriptions.test.mjs`）；`thincoder-vscode/scripts/check-vsix.mjs:29` `EXPECT = { prompts: 15, "tool-docs": 24 }`（父侧车道 B 已落）；设计单源 `DOC-DISCIPLINE.md:508` 同值 | 与三条独立口径一致 ⇒ 无 |
| D4 | 姊妹计数 `prompts/` **15** 零触碰 | 盘上 `thincoder-core/prompts/*.md` = 15 ✓ · `EXPECT.prompts = 15` ✓ ⇒ 非本收正面，防越界 | 无 |

#### ③ 验收读数（命令逐字 + 结果）

| 验收 | 命令 | 读数 |
|---|---|---|
| **25 残留（判据 · ASCII `node -e`）** | 正则 `(?:tool-docs\|工具描述)[^\n]{0,60}?\b25\b` ∨ `\b25\b[^\n]{0,20}?工具描述` × 两档 | 改前 = `BASELINE-FAIL 25 residue at thincoder-vscode/AGENTS.md:15 , thincoder-vscode/AGENTS.md:127`；改后 = **`OK 0 tool-docs-25 residue`** + 正向断言 `[true, true]` + 两档全部 `25` 命中 = **`(none)`** |
| 盘上对读 | `node -e`（readdirSync 计数 + EXPECT 抽取） | `disk tool-docs = 24 \| disk prompts = 15 \| check-vsix EXPECT tool-docs = 24` |
| **机检净增** | `node scripts/doc-check.mjs --root .` | 改前 = 改后 = `悬空 1 · 行宽 0`（`汇总：候选 17692 · 悬空 1 · 注记豁免 43 · 拟新增 6 · 迁移期引文 212`；唯一悬空 = `docs/core/design/MODEL-SPECS.md:385 none（符号）`＝他批在途未跟踪档）⇒ **净增 0** ✓ |
| 相关包测试（touched 包） | `cd thincoder-vscode && node test/run.mjs` | `tests 735 · pass 735 · fail 0 · cancelled 0 · skipped 0 · duration_ms 70498.0382` · exit 0（含同族用例 `test/tool-descriptions.test.mjs`「核包 tool-docs/ **24** 档在位」） |
| CLI 侧同族用例 | `cd thincoder-cli && node --test test/doc-check.test.mjs` | 17/17 pass（机检器语义面零回归） |
| **D6 回读** | `read` 两落点逐行 | `:15` = 「…`thincoder-core/tool-docs/` **24** 档工具描述…」· `:127` = 「…`tool-docs/` **24** — names + sha256…」 ✓ |

#### ④ 审计与代码评审（轮次与终态）

- **内审（read-only explore 背离审计 · 1 轮）**：VERDICT = **clean** —— 四类偏差（PARTIAL 部分实现 / SILENT-SIMPLIFICATION 静默简化 / DOC-DRIFT / OUT-OF-LIST 越表改动）**均未发现**；独立复核证实「CLI 档无计量句 ⇒ 无漏改」与「24 有盘上依据」。3 条报告面观察（O1–O3，见 ⑤）。审计限度如实：该席无 shell/git ⇒ 命令面读数未由其复跑（由本席 ③ 实跑补齐）。
- **advisor 代码评审（`type=code` · 1 轮 · depth>0 同步）**：VERDICT = **pass** —— 🔴 0 · must-fix 🟡 0；2 🟡（协调项：`DOC-DISCIPLINE.md:512` 单源枚举失真 · 产品文本面无机检覆盖）+ 1 🔵（批档坐标漂移）；范围外提示 3 条（`check-vsix.mjs:9-10` 头注 25 · 归档档 25 · 1-B 面零复核）。
- **fix round = 0**（无 must-fix 发现 ⇒ 无修正轮）· **终态 = clean**。

#### ⑤ 上抛项（逐条 · 均在写域外，未就地修）

1. **`docs/core/design/DOC-DISCIPLINE.md:512` 单源行失真（🟡 · 设计档写域外）**：该行仍写「未并面剩余两处：… 两产品档 `thincoder-cli/AGENTS.md:15` / `thincoder-vscode/AGENTS.md:125`（产品文本面 = eng-coder 轮）」——实况 = VSC 半已并（`:15`/`:127`）、CLI 半零命中、坐标 `:125` 实为 `:127`。该行是本批指定的保留面/未并面**单源**（§2.3(d)「以本行为准」）⇒ 建议父侧/设计档层就地补 errata（① VSC 面已并；② CLI 面「裁定不动作 + 理由 = 全档零命中」；③「剩余两处」→「剩余一处（需求档）」），否则后续轮按此枚举复核会重犯本批起点「判已毕实为部分完成」。
2. **`thincoder-vscode/scripts/check-vsix.mjs:9-10` 头注仍 25（车道 B 面 · 属禁改范围未动）**：头注「`prompts/` 15 档 + `tool-docs/` **25** 档」「① 档数硬等设计口径（15 / 25）」与同档 `:29` `"tool-docs": 24` 相抵 ⇒ 车道 B 实为**部分完成**（代码行已改 · 同档文书行未随）；`AGENTS.md:127` 新文与脚本自述因此两口径。
3. **设计/批档坐标口径（D3 计数）**：批档 `:75` / `:131` 记「产品文本面 = `thincoder-cli/AGENTS.md:15` · `thincoder-vscode/AGENTS.md:125`，~2 行」；实况 = **1 档 2 处**（VSC `:15` + `:127`），CLI 档零命中。批档按冻结口径（`:24` / `:147`）**不回改** ⇒ 随上抛 1 的 errata 一并记。
4. **产品文本面无机检覆盖（🟡 观察）**：J-3 机判域 = 四档设计档（`DOC-DISCIPLINE.md:612` DD-44 · `:1044` A-DD19 ④），`doc-check` 域 = `docs/**` ⇒ 两产品 `AGENTS.md` 计数行**无回归护栏**（J-3 射程已三次漏算：4 档 7 处 → CORE-UNIFICATION 16 处 → 产品档 2 处）。候选 = 纳入判据域 / 补「全仓 `25 档` 命中集 ⊆ 保留面枚举」子集判。
5. **非本席写域的同族 25 存量（信息登记）**：设计档 `docs/core/design/CORE-UNIFICATION.md:225` / `:710`（另有 `:44` / `:1041`）· 需求档 `docs/core/requirements/CORE-UNIFICATION.md:117` / `:118` · `docs/core/requirements/PROMPT-SYSTEM.md:157` —— 属本批 lane A/D 面（§3 评审 #1/#2 已点名）；归档档 `thincoder-vscode/docs/_archive/{requirements,design}/TOOLS.md` 的 25 按 E9 判不动（保留≠维护）。

## §6 验证与收口（父代理）

**2026-09-20 11:46 父侧收口**

**交付核验（四道）**：设计轮（#17 · 4 条 + **设计档 10 档已落**）✓ · 评审（id=26 · **pass** 0🔴/4🟡/5🔵）✓ · 用户裁定（05:15「都按建议」：**U1② · 死码先登记（→ #130）· E9 不动 · J-3 反转成立 · #127 按序**）✓ · 实施三道：**车道 B**（`check-vsix.mjs` 25→24【父侧直改 · 含 `:9-10` 头注补完】）✓ · **车道 C**（#30 · 两产品 `AGENTS.md` ✓ VSC 两处收 24；CLI 档零命中【坐标误指已登记】）✓ · **车道 D**（父侧笔 · 2026-09-20 11:44 落：`requirements/CORE-UNIFICATION.md` N4/N5 两处 25→24 · `requirements/AGENT-LOOP.md` `:163`/`:167` 迁核注【W12 删除集】· `requirements/CONSULTATION.md:69` 迁核注 · `requirements/MEMORY.md:151` 后归一注【存储/索引两行端差已消解】；另核 `PROMPT-SYSTEM.md:157` **已为 24**〔无需改〕）✓

**台账**：**#119 → 已核销**（E1–E11 + G-1 全落）· **#121 → 已核销**（U1 裁定 + U2/U3 登记落）· **#120 → 主体已落（工程工具面 ✓ + 设计面 16 处 ✓ + 产品文本面 ✓ + 需求面 ✓），残余「4 坐标补判」在册**（`design/CORE-UNIFICATION.md` `:44`/`:225`/`:710`/`:1041` —— 评审 id=26 发现 1 的尾项）· **#127 → 另批**（§4 批准范围③ · 且 `⑤ ContinueError` 已由 P2 落地 ⇒ 该轮扣重）。

**遗留（显式）**：① #120 四坐标补判；② 评审 id=26 的四条 🟡 其余项（均已按「residual 登记」接受）；③ 归档档 E9 = 判不动（在册）。

**提交**：待 `commit + push`（路径限定）。