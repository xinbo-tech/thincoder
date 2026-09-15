# 核心统一 · VSC 壳代码接线（CORE-UNIFICATION -- VSC WIRING）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 用户「开始吧」（2026-09-15 06:46）+ 文档面迁移定稿（`2026-09-15-vsc-doc-migration.md` ✓）。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
> **状态：已收口**（2026-09-15——全 16 单元 + 2 前置笔 + W17 收口笔落地核验；终态全链绿：VSC 553/553 · 核 178/178 · 仓根三闸 0——详见 §6）。
>
> **导航（父侧维护）**：§1（裁定与讨论）→ 本档 §1；§2 当前任务书 → 本档 §2（designer 追加面）。
> **父侧折行·收正注（2026-09-15）**：§2 的 19 行长散文行经父侧机械折行（仅插换行 · 去空白逐字节相等 23,960 chars ✓ 零语义改动）——batch_segment append-only 无法自修，承迁移批先例「纯折行后重跑」。
> 同批收正 3 项：`STRUCUTRE-DEBT` → `STRUCTURE-DEBT` · `十字段` → `10 字段`（×4 · 对齐 `CORE-UNIFICATION.md` §2.6.3 U16 行权威写法）· `VSC-MIGRATION.md` 旧 §9 → `VSC-MIGRATION-INVENTORY.md §9`（V1 指针）。
> **同法（§3 · 2026-09-15 修正轮-4 后）**：§3 轮次 2 前言行父侧机械折行（**仅插换行**）+ 2 处形态收正——① 检索锚裸名引用 → 仓名限定形态（终态 = `AGENT-LOOP（CLI 仓·设计）§11.2`）；② 计数句去数字声明（终态 = 「残遗 = 计数面（见 #1 / #2）」）。零语义。
> **同法（§5 · 2026-09-15 · W2 实施段）**：§5 W2 块 7 行父侧机械折行（**仅插换行** · 零语义）——宽度闸复跑归零。
> **同法（§5 · 2026-09-15 · W6 段）**：§5 W6 块 5 行父侧机械折行（**仅插换行** · 零语义）——宽度闸复跑归零。
> **同法（§5 · 2026-09-15 · W14 段 3 行 + W12 段 8 行）**：父侧机械折行（**仅插换行** · 零语义）；同批附：`docs/design/{EDIT.md:3, AGENT-PARAMS.md:7}`（W12/W14 面）+ `docs/design/ADVISOR-CONVERGENCE.md` **重复注记折叠 208 处**（W12 注记脚本自捕缺陷 · 父侧机械收敛至单次）——三项均零语义。
> **父侧三闸读数复核（2026-09-15 · 实跑）**：
> ① 宽度：本档 0；PROVIDER.md >300 实测 **5 行**（4 表格行闸豁免 + 实判 1 行 = L260/336 chars）——§2 两处「6 行」已就地更正；折行与否仍待裁（该档并行线在写——本批零触碰）。
> ② 锚（§2「锚 0」= 域一口径）：域一（根域 · 125 档）**0 悬空** ✓；域二（CLI 树 · 99 档 · 迁移期参照历史）存量 **1 条**（`thincoder-cli/docs/design/TWO-REPO-MERGE.md:404` → `DOC-CODE-RECONCILE.md:98`——前批已登记 · 非本批）；VSC 域 21 处报告态（非阻断 · 已登记）。
> ③ 台账 **0 违规** ✓；一致性 V1/V2/V3 新增 **0** ✓。
> 上游：`docs/core/{requirements,design}/CORE-UNIFICATION.md`（核心统一机制权威 · 长期资产 ✓）· `docs/core/design/DOC-SYSTEM.md` §5.1/§6（归属 P1–P5 · 命名 N-a–N-d）·
> 批次档模板与段作者表 = `docs/core/design/BATCH-RECORD.md`（D2 —— 本档不重述）· 需求池条目见 `docs/TODO.md`。

---

## §1 讨论（主 agent 记）

### 状态

**已收口 2026-09-15**——VSC 代码面接线（核心统一机制的 VSC 壳实施）在文档面迁移定稿后启动；用户 06:46「开始吧」确认启动设计轮。

### 用户裁定与澄清（2026-09-15）

| 时点 | 内容 |
|---|---|
| 06:46 | 文档面批次定稿（10 批 ✓ §8A/§8B 闭合 ✓）→ 用户「开始吧」= 启动 VSC 代码面接线设计轮 |
| 06:45 | 「迁移执行本身不需要设计评审」——设计轮的产出是否评审由用户届时定，不预设 |
| 07:02 | 权威档角色澄清：CORE-UNIFICATION = **长期资产**（目标态机制权威，非一次性迁移包）|
| 07:08 | **改动代码 ⇒ 必须同步对应模块的设计权威档**（改了哪模块收正哪模块的档）|
| 07:10 | **实施面（单元划分 / 受影响文件 / 回滚）= 批次档的事，不落权威档**；CORE-UNIFICATION 不新增"VSC 实施面"节 |
| 07:13 | 命名 = 文档档按 `DOC-SYSTEM.md` §6 N-a～N-d；实施面不新建文档档；批次档名 = `<日期>-<主题>`（`vsc-core-wiring` 与文档面 `vsc-doc-migration` 并列）|
| 07:17 | 用户要求按项目规定（BATCH-RECORD.md / 样板）核查批次档合格性——父侧自查出 5 处违规并重写 |
| 12:24 | **引擎下限裁定**：A8 值 = `^1.104.0` · **不另做真机实测**（用户：「不要去测了，资料都查了，还测个鸡毛？」）；核验形态 = `activate()` 护栏。落点 = §2（W8 门 1 · 未决 1 已清 · 修正块「引擎下限裁定落地」节）+ 权威档收正 |
| 13:05 | **索引存储面裁定（未决 2 解门）**：**索引面归一 = 并核 sqlite**；**数据面放弃**（用户：「数据面放弃不要了，重新索引就行」——旧 `.thincoder/index/` 零迁移/零兼容，**重新索引 = 正当路径**）。落点 = §2 W8 索引面段扩写（驱动替换 + 重建 UX + 旧目录清退 + 面板收正；修正轮-2 落地）|
| 13:19 | **#175 推理档位面裁定**：**端侧自有（核内无需位）**——「核内位 = 无」为**正常形态、非缺位**（CLI `/think` 同构先例 `cmd-think.mjs:52/:95`）；收正三处 = §2.13.4 #175 行（处置列补锚 · 原「按端注入」退场）· §2.13.6 缺口 5（缺位 **4→3**）· W15 解押 + 未决收口。落点 = §2 修正轮-3 块（:511 起）|
| 15:12 | **五裁定（用户「都按建议」）**：① **红线清扫 = ③**（A = T-DC15 夹具同步 · B = 引擎采样域补核树 · 基线登记 10 处不可修项〔冻结历史 5 + 外部产品名 5〕）② **A-K1 口径 = 零新增 + 基线登记**（未决 7 收敛）③ 宽度 `PROVIDER.md:260` 1 行**折掉**（未决 5 收敛）④ **#143 = 同案处理**（端侧自有 · 非缺位计——与 #175 同法）⑤ §2.13.4 表头注加「端侧自有类不计缺位」子句 |

### 三层分工（父侧记录 · 判据 = 上述裁定 + BATCH-RECORD.md）

| 层 | 承载 |
|---|---|
| 机制权威档 | `docs/core/{requirements,design}/CORE-UNIFICATION.md`（目标态 · 长期资产 ✓ 只记变更/收正记账面 ✗ 不承载实施面）|
| 模块权威档 | 改到哪模块 ⇒ 同步修哪模块的档（`docs/core/design/<模块>.md` 坐标/契约/端差按现状收正 · 一致性面 ✓）|
| 本批次档 | 实施面唯一承载（单元划分 · 受影响文件清单 · 删旧 · 复跑 · 回滚 · 验收 —— 落 §2/§5 ✗ 不进权威档）|

---

## §2 批次任务（eng-designer）

### 批次任务书（VSC 代码面接线 · 设计轮 · eng-designer · 2026-09-15）

**范围与依据**：核心统一机制（`docs/core/{requirements,design}/CORE-UNIFICATION.md`）的 **VSC 壳接线** —— 本批 = S2 的 VSC 半边（**CLI 半边已全部落完**：§2.6.3（七）① 主计数实读 **CLI 待迁 = 0**〔2026-09-15 修正轮复跑〕，终态证据 = `docs/batches/2026-09-13-CORE-UNIFICATION.md:6682`〔U16 段「CLI 侧待迁清零」〕；用户启动口径 = 本档 §1）。
  高层裁定与三层分工见本档 §1（07:02 权威档角色 / 07:08 改码必同步模块权威档 / 07:10 实施面不落权威档 / 07:13 命名）。上游权威 = CORE-UNIFICATION 需求档 **F5**（逐模块接线+删旧 · 提示词面同规）、**F8**（提示词并入核 = 唯一副本）
  、**F9**（残留删净 · 限实现面+提示词落地档）、**N1**（未涉面零回归）、**N2**（每段可回退 · 一步一提交）、**N4/N5**（两态引用 · 单一权威源）、**N6**（机检零红）+ 设计档 §2.13（注入位清单）与 §2.6.1/§2.6.2（装载口径与族 1 形态）—— 本任务书逐条回指，不再重述条文（D2）。

#### （一）勘察实核读数（2026-09-15 · 本设计轮自核）

| # | 读数 | 来源 |
|---|---|---|
| 1 | VSC src `.mjs` 共 **158 档 / 30,323 行**（wc -l 口径） | 机械枚举 |
| 2 | 其中**核内同路径档 73**（路径对）· **非同路径 85**（extension/ 40 + 其余 45→实 47） | 路径集合比对 |
| 3 | 非同路径 47 档逐档读档分类：**M（核内语义镜像）28** · **S（VSC 特有薄壳/编排）19** · U 0（**修正轮-2**：`indexer.mjs` 改入删除集——保留 S 面 = **18**；**修正轮-7**：+ W15 六档〔同路径 ≠ 同内容〕→ **25**——薄壳面清单）—— 逐档证据见勘察记录（`advisor/main`→核 `advisor.mjs` · `mcp/{http,stdio,ws,utils}`→核 `mcp/transport-*`+`helpers`（前两者逐字同源）· `tools/checkpoint`→核 `git/checkpoint.mjs` · `tools/{wait_for,read_image,more-file,file-edit,hashline-edit,edit-fuzzy-match,edit-line-params}`→核 `tools/{ops,file,patch,edit-batch,edit-diff}` 等） | explore 子代理 · 逐档 file:line |
| 4 | 提示词面：`src/prompts/` **15 档 / 1,015 行** + `src/tools/*.md` **25 档 / 420 行** = 40 档 / 1,435 行（核内唯一副本 = `prompts/` 15 + `tool-docs/` 25） | 机械枚举 |
| 5 | **登记册差异实证**：`src/tools/index.mjs`（76 行）与核同路径但**内容为 VSC 装配面**（含 VSC 宿主工具 context/focus/shell/code/read_image/wait_for + 自持 builtinTools）⇒ 该档**保留**（同路径 ≠ 同内容——B1 分叉面实证）；`src/agent-tools.mjs`（1 行 barrel）vs 核 17 行登记册 ⇒ 删 | 逐档读档 |
| 6 | **删除集 = 94 档 .mjs / 19,052 行**（73 同路径 + 28 M − 保留 2 档〔`tools/index.mjs` · 拆壳薄壳 `tools/shared.mjs`〕 + 1 S 改判〔`indexer.mjs`——2026-09-15 裁定〕 − W15 六档〔重定零删——修正轮-7；删列口径 1,654〕）+ **40 档 .md / 1,435 行** ⇒ 合计 **134 档 / 20,487 行**（修正轮-2 同步——见修正轮-2 块；修正轮-7 同步——见修正轮-7 块） | 上述 2/3/4/5 合成 |
| 7 | **存活改指面**：删除集的存活入边（排除同为删除档者）去重 = **32 档**（src/ **31** = extension **15** · agent 5 · agent-tools 2 · tools **5** · 根档 **4**；+ 端点 `extension.mjs` **1**——逐档底账 = 修正块表 4〔修正轮 #4 / 修正轮-2 同步；**修正轮-7**：W15 边退场——`notify`/`panel-project` 移出〕）——逐单元见（三） | import 扇入图谱（机器自核） |
| 8 | **装载面已在位**：`thincoder-vscode/package.json:33` 依赖 `@thincoder/core ^0.1.0` · `node_modules/@thincoder/core` = JUNCTION → `thincoder-core/`（开发期链接）· `.vscodeignore:4` 反排除行在位 ⇒ **接线零装载动作**（CLI 轮已配置） | 实读三处 |
| 9 | 基线读数：核回归 **178/178 · fail 0 · exit 0**；VSC fast `npm test` **622 tests / 581 pass · fail 0**（41 慢测快层跳过）；仓根三机检 = 锚 **0 悬空** · 台账 **0 违规** · 宽度**基线红 1 档**（`docs/core/design/PROVIDER.md` 5 行 >300——并行线遗留，非本批写域） | 实跑（本设计轮改前） |

> **拒绝指标**：`scripts/mirror-divergence.mjs` 现对 `thincoder-cli/src/prompts` 报 ENOENT（CLI 侧该目录已删）——度量脚本默认面与现况冲突 ⇒ 登发现；scripts/** = 父侧工程面，本批不代改。

#### （二）方案选型对比

| # | 候选 | 判据逐项评估（N2 单笔回退 · N1 面内/未涉面可分 · 与 CLI 先例同构 · 验收单一） | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **按模块族分 16 单元（W1–W16）逐单元「接线→删旧→复跑→单笔提交」** | 单笔可 revert ✓ · 面内/未涉面可分检 ✓ · 与 CLI §2.6.3 同构（权威档按族同步）✓ · 验收面单一（每单元独立判）✓ | 慢（≈16 轮），每轮可独立验证 | **选定** |
| 2 | 一次整树直连（全量改指 + 删 140 档一笔） | 单笔不可回退 ✗（N2 违）· 面内/未涉面不可分 ✗ · 验收混杂 ✗ | — | **否决**（违 N2 + 违「单模块一步一提交」纪律） |
| 3 | 保留 VSC 镜像不删（继续双源） | 直接否定目标形态 ✗（D-C13 消灭二次实现）· 镜像漂移 = B1 问题原样 ✗ · 新版核不生效 ✗ | — | **否决**（本批存在的意义即相反面） |
| 4 | 子选型·端壳缝落点：**(a) 缝就近端壳档**（§2.13.3 已定消费方：permission-gate 收 io.ask · panel-callbacks 收 onToken/onQuestion · settings-panel-write 收 `$schema` · tools/shared.mjs 拆壳后收 write-path/exec-run 缝） | 缝 = 现状消费方结构 ✓ 零新增装配面 ✓ | — | **选定** (a) |
| 5 | 子选型·端壳缝落点：新建集中缝模块（如 `tools/tool-seams.mjs`） | 离消费点远 ✗ · 新增装配面 = 新 import 链 ✗ | — | **否决**（与 §2.13.3 已登记消费方形态冲突） |
| 6 | 子选型·索引面驱动替换：**(a) 整组删旧**（`indexer` 族入删除集——消费点改指核面；2026-09-15 裁定落地） | 核面覆盖全（同步/检索/存储/回填——实核）✓ · 零重复面（F9）✓ · 单笔可回退 ✓ | — | **选定** (a) |
| 7 | 子选型·索引面驱动替换：新建薄适配壳（转发核面） | 壳无功能增量（核面全有）✗ · 双驱动壳/双源形态残留（F9）✗ · 消费签名不同仍需改写（省不了）✗ | — | **否决** |

**单一候选豁免**：方向（索引面归一）由用户 2026-09-15 裁定 ⇒ **单方案（显式声明）**；驱动替换形态 = 2 候选（上表 6/7——对比表）。上表共七候选。

#### （三）单元划分总表（W1–W16 · 执行序 = 编号序）

> **共同前置（全 16 单元 · 修正轮登记）**：权威 §2.6.0 门 =「CLI 全单元落完并验收通过 → 才开 VSC 单元」——**实读已达标**：CLI 待迁 = **0**（复跑命令 = 设计档 §2.6.3（七）①；终态证据 = `docs/batches/2026-09-13-CORE-UNIFICATION.md:6682`）；用户启动口径 = 本档 §1（06:46）。各单元「前置」列只列**单元级附加门**（W8 = 引擎下限前置笔——原门 2 已随 2026-09-15 裁定清），共同前置不逐行重列。
> 通用格式：删 档数/行数（删除集 = 镜像档）→ 存活改指 N 档；**每单元独立回滚点 = 单笔提交 `git revert <sha>`**（N2）。复跑与共同验收见本段「逐单元任务书」节四步块；模块权威档 = 实施时按现状收正（改码必同步——07:08 裁定）。

| 单元 | 名称 | 删（档/行） | 存活改指 | 前置 | 风险 | 模块权威档（同步面） |
|---|---|---|---|---|---|---|
| W1 | LOGGING（诊断日志） | 1/196 | 5 | — | 低 | `LOGGING.md` |
| W2 | 提示词面（40 .md + 槽位装配 + 注入接线） | 41/1,518 | 0 | — | 中 | `PROMPT-SYSTEM.md` · `TOOLS.md`（tool-docs 面） |
| W3 | TRACES（轨迹存储） | 1/254 | 0 | — | 低 | `TRACES.md` |
| W4 | WORKSPACE（台账/约定/转义/展开/技能/规则/同伴） | 4/627 | 3 | — | 中 | `WORKSPACE.md` · `MULTI-INSTANCE-COLLAB.md` |
| W5 | CHECKPOINT（检查点 · git 面） | 3/775 | 0* | — | 中 | `CHECKPOINT.md` §6.9 |
| W6 | CONTEXT-COMPACTION（压缩/标题/历史窗/档位） | 1/388 | 0* | — | 中 | `CONTEXT-COMPACTION.md` §6.13 |
| W7 | MCP（客户端 + 三传输） | 6/1,007 | 3 | — | 中 | `MCP.md` §6.10 |
| W8 | MEMORY（记忆/索引/嵌入 · **索引面归一 = 并核 sqlite〔已裁 2026-09-15〕**） | **5/1,047** | **5** | **引擎下限（已裁 · 落 W8 前置笔；原门 2 已清）** | 高 | `MEMORY.md` §6.9 · `STRUCTURE-DEBT.md` |
| W9 | AGENT-TOOLS 登记面（工具实现 + 登记册） | 13/1,310 | 1 | — | 中 | `AGENT-LOOP.md` §6.18（登记册 #83） |
| W10 | PROVIDER（供应商/模型/代理） | 8/2,293 | 3 | — | 中高 | `PROVIDER.md` §6.19 · `PROXY.md` · `AGENT-PARAMS.md` §6.3 |
| W11 | SESSION（会话 · 端壳改指面，零删） | 0/0 | 端壳 5 档内改核心面 | — | 中高 | `SESSION.md` §6.15 |
| W12 | ADVISOR/会诊/飞刀 | 20/4,111 | 5 | — | 中高 | `CONSULTATION.md` §6.5 · `ADVISOR-CONVERGENCE.md`(requirements) |
| W13 | 子代理/异步族 | 6/2,133 | 3 | — | 高 | `AGENT-LOOP.md` §6.18（异步载体 §2.3） |
| W14 | TOOLS 实现面（编辑径 + 工具表） | 19/3,605 | 5 | — | 中高 | `TOOLS.md` §6.11 · EDIT 六档 §6 · `TOOL-OUTPUT-LIMITS.md` §6.3 · `CHECKPOINT.md`（checkpoint 工具） |
| W15 | AGENT-LOOP（主循环 + 装配 + 注入面 · **重定 2026-09-15**） | **0/0**（零删重定——六档按「同路径 ≠ 同内容」入端壳面：装配面瘦身 + 核原语改指 + 端壳缝四条落地〔修正轮-7〕） | **1**（W6 跨单元笔——`agent/run-helpers.mjs` compact 入边 → 核 `context.mjs`·已落〔脚注注 1〕；删除集入边改指 = 0——零删重定） | — | 高 | `AGENT-LOOP.md` §6.18 · `I18N.md` · `PORTABILITY.md` §3.6 |
| W16 | CONFIG（配置/迁移/settings 工具） | 6/1,223 | 16 | — | 高 | `CONFIG.md` · `SETTINGS-TOOL.md` · `DESIGN-TOKEN-SETTLEMENT.md` §6.3 · `ENG-TOKEN-BINDING.md` §6.3 |
| **合计** | 16 单元 · 删除集去重 **94 .mjs / 19,052 行** + 40 .md / 1,435 行 = **134 档 / 20,487 行**（`tools/shared.mjs` 413 移出——拆壳薄壳保留〔修正轮 #6〕；W15 六档移出——重定零删〔修正轮-7〕） | 134 | 存活改指去重 **32**（删除集扇入——逐档底账 = 修正块表 4 + 口径注⑤；端壳/核心面改指类另计；修正轮-2/7 同步） | —— | —— | —— |

> \* **W5 / W6 跨单元改指（口径写死 · 修正轮 #7）**：两处改指**均在删除单元（W5 / W6）同笔落地**——删档单元自洽（中间态零 `ERR_MODULE_NOT_FOUND` · A-K4 逐单元可达）；**计数归其存活面单元列（W14 / W15）· 不双计**。
> W5 = `tools/shell.mjs`（`./checkpoint.mjs` → 核 `git/checkpoint.mjs`，计数在 W14 列）；W6 = `agent/run-helpers.mjs`（compact 入边 → 核 `context.mjs`，计数在 W15 列）。W5 / W6 正文按本注同批收正。

#### 逐单元任务书（W1–W16）

> 每单元四步（承 CLI §2.6.3（四）同形）：**① 接线**（改 import/加载面 → `@thincoder/core/<子路径>`，一律带子路径；测试面同批改指/退役）→ **② 删旧**（删本单元删除集；删前三条全过 = 改指已落盘 ∧ VSC 全链 exit 0 ∧ 零引用机判——反向判两模式承 §2.6.2（五）法 1，扫描域 = `src/` + `test/` + `extension.mjs`；同批把 VSC 特有增量迁入端壳缝——§2.13.3 该族缝 + configure* 命令）→
  **③ 复跑**（VSC 全链 = `npm test` · `npm run lint` · `npm run test:full` · `npm run test:integration` · `npm run doc:check`，cwd = `thincoder-vscode/`；核回归 `node --test` 178/178；仓根三机检）→ **④ 提交**（单笔：删档 + 改指 + 测试面 + 文档锚同批；回滚点 = `git revert <sha>`）。

**W1 · LOGGING**：删 `src/log.mjs`（196）→ 核 `@thincoder/core/log.mjs`。存活改指 **5**：`agent-tools/async-discard.mjs` · `agent/execute-tools.mjs` · `extension/{panel-callbacks,panel-chat,suspension}.mjs`（原 `indexer.mjs` 入边——随 2026-09-15 裁定入删除集、移出本列）。测试面：零直连（trace-store.test 经 provider —— W3 面）。
  专项验收：W1 删除集在扫描域零引用（反向判 0 命中）+ VSC 全链绿。

**W2 · 提示词面**：删 `src/prompts/` 15 档 + `src/tools/*.md` 25 档（1,435 行）+ `src/prompt-overlays.mjs`（83）→ 核 `prompts/` + `tool-docs/` + `@thincoder/core/prompt-overlays.mjs`（槽位装配面 = 核单点）。
  同批收正：权威 §2.8「提示词加载面」两行（CLI `:1037` / VSC `:1038`）由「S2 改 · ±6」改「**S2 删**」——CLI 已随 U15 落地（实核：档不存在）；槽位装配面 = 核单点（修正轮 #13）。
  **入口注入接线**：`extension.mjs` `activate()` **入口首语句**（紧随入口 · 先于任何装配步——实况序 = 注入 → 护栏 → `initLocale`/面板 · 修正轮-6 统一）调 `configurePromptInjections(VSC 13 锚取值表)`；
  取值表 = `CORE-UNIFICATION.md §2.13.2` 「VSC 列」（引用不重述；含 `agent-loop-ptr-*` 四值收正 + 一值原样（`-async-note` = `AGENT-LOOP（CLI 仓·设计）§11.2`——两端相同）
  按 §2.13.2 收正注 = `AGENT-LOOP（CLI 仓·设计）§7.3/§8/§14.2` · `doc-map-path` = `design/` ·
  `discipline-normal-finish` = 节标题+引导行（核内三行不注入）· `question-ui-face` = 替换位面板版 `Availability:` 行 · `bash-terminal-face` · `eng-coder-guidelines` · `discipline-engineering-vsc-r14-pools` · 空值锚 2）＋端说明括注并入同锚值（§2.13.2 建议）。测试面：`test/prompts-async-guidance.test.mjs`（prompt-overlays 入边 →
  改指核）· `test/tool-descriptions.test.mjs`（断言 VSC 工具描述——保留改指核 tool-docs + 注入值）。**核对项**：§2.13.2「核内测试同步坐标」（`thincoder-core/test/prompt-files.test.mjs:105` 旧锚名断言）——已收正 ⇒ 零动作；未收正 = 发现上报（不代改核）。专项验收：VSC 装配输出零 `{{inject:` 字面（可机判：入口装配后四装配面输出扫描）· 13 锚 VSC 值逐锚在场（§2.13.2 验收列）·
  `## 收尾验收` 节标题在场恰一份（VSC 侧）· `design/` 文档地图路径（doc-map-path 值）在场 · `src/prompts/` + `src/tools/*.md` 枚举为空（F9 实现面口径）。

**W3 · TRACES**：删 `src/traces/trace-store.mjs`（254）→ 核 `@thincoder/core/traces/trace-store.mjs`。存活改指 0（唯一入边 provider.mjs = W10 删档）。测试面：`test/trace-store.test.mjs` → 改指核（行为面保留——容量/清理策略已裁决取并集，§2.5 #116）。专项验收：W3 删除集零引用 · trace-store.test 改指后绿 · 未涉面计数不变（N1）。

**W4 · WORKSPACE**：删 `src/ledger.mjs`（227）· `src/conventions.mjs`（226）· `src/escape.mjs`（153）· `src/expand-home.mjs`（21）→ 核 `@thincoder/core/{ledger,conventions,escape,expand-home}.mjs`。存活改指 **3**：`agent/run-helpers.mjs`（conventions/escape 入边）· `agent/tool-gates.mjs`（conventions）·
  `extension/ledger-surface.mjs`（ledger）。（原 `indexer.mjs` 入边——随 2026-09-15 裁定入删除集、移出本列。）端壳缝：台账渲染面 `ctx.colors/pushLine/render`（§2.13.3）由 `extension/ledger-surface.mjs` 供值（现形已在端壳——改指核 `ledger-surface.mjs` 后按缝装配）。测试面：`test/ledger.test.mjs`（ledger + extension/ledger-surface —— 端壳档保留，改指核 ledger 面）。
  专项验收：W4 删除集零引用 · ledger-surface 面板推送计数 = 行数（缝注入断言）。

**W5 · CHECKPOINT**：删 `src/tools/git-checkpoint.mjs`（150）· `src/tools/git-ext.mjs`（174）· `src/tools/checkpoint.mjs`（451 → 核 `git/checkpoint.mjs`）。存活改指 0（`tools/shell.mjs` 的 `./checkpoint.mjs` → 核 `git/checkpoint.mjs`——**改指在本单元同笔落地**、计数归 W14 列；见（三）脚注注 1）。
  测试面：`test/git-commit-pathspec.test.mjs`（git.mjs = W14 面）随 W14。专项验收：W5 删除集扫描域零引用 · checkpoint 工具注册后行为 = 核实现（核测试 `git/checkpoint` 面已绿——含在 178 内）。

**W6 · CONTEXT-COMPACTION**：删 `src/compact.mjs`（388）→ 核 `@thincoder/core/context.mjs`（压缩面语义对位——§2.5 #162–#164 已裁）。端壳改指 3：`extension/{history-window,generate-title,turn-model}.mjs`（**175 / 87 / 27**——`wc -l` 实核 2026-09-15；均 ≤300 · 结构未变）
  → 核 `history-window.mjs` · `generate-title.mjs`（标题生成三格式分派 = 核内实现，§2.13.4 #163 已满足）·
  turn-model 按核 context 面接线。存活改指：`agent/run-helpers.mjs`（compact 入边——**改指在本单元同笔落地**、计数归 W15 列；见（三）脚注注 1）。测试面：`test/history-window.test.mjs`（extension/history-window 端壳保留 → 改指核面）· context-parity 族随 W15。专项验收：W6 删除集零引用 · 压缩判定点封装按 §2.13.4 #56‑类端接线（`configureTreeResolve` 等按端注入）·
  预算端差按 `CONTEXT-COMPACTION.md §6.13`（webview 四态等现状登记）收正。

**W7 · MCP**：删 `src/mcp.mjs`（12）· `src/mcp/{http 256, index 420, stdio 140, utils 49, ws 130}.mjs` → 核 `@thincoder/core/mcp.mjs` + `mcp/{transport-http,transport-stdio,transport-ws,helpers}.mjs`（stdio/ws/utils 逐字同源——删旧零语义）。存活改指 3：`extension/chat-panel.mjs`（mcp.mjs）·
  `extension/panel-mcp.mjs`（mcp/index）· `extension/settings.mjs`（mcp.mjs）。**端壳增量迁入**：`mcp/index.mjs` 的 client-id 注册表 + 面板状态接口（`mcpConnectedNames` / `mcpConnectedToolCounts` / `mcpDisconnectByName`）移入端壳（`extension/panel-mcp.mjs` —— 核 mcp.mjs 为 name-key session 面，按现状适配）。
  `config-mcp.mjs`（S 端壳）保留——其内部 config-io 引用随 W16 改指。专项验收：W7 删除集零引用 · MCP 装配/探活/生命周期按 `MCP.md §6.10` 现状登记 · 面板 MCP 页连接计数接口在位（端壳增量）。

**W8 · MEMORY**：删 **5 档 / 1,047 行** → 核面；存活改指 **5 档**（修正轮-2——原未决 2 已裁 2026-09-15：**索引面归一 = 并核 sqlite · 数据面零迁移/零兼容**；原「删除集分两段」形态退役——承 CLI U8 单单元形态〔`docs/core/design/CORE-UNIFICATION.md` §2.6.3（二）〕）。
  · **记忆面**：删 `src/memory.mjs`（273·同路径但内容分叉极大——j=0.0093，B16）→ 核 `@thincoder/core/memory.mjs`（sqlite 面——A12 已裁归一）；改指：`agent/context-injections.mjs` · `memory-tool.mjs`。
  · **索引面（驱动替换——文件制驱动整组删旧）**：删 `src/embedding.mjs`（102）· `src/index-bin.mjs`（43）· `src/index-discover.mjs`（173）· `src/indexer.mjs`（456——**判定 = 删**：核面覆盖全〔同步/检索/存储/回填——实核〕· 薄适配无功能增量且留双驱动壳——对比表 = 修正轮-2 块）→
  核 `@thincoder/core/{embedding.mjs, memory/*}`（`gitSync`/`codeSync`/`docSync` + `codeSearch`/`docSearch` + 惰性向量回填）；改指：`embed-config.mjs` · `tools/code.mjs` · `extension/panel-index.mjs`。
  · **逐档判定（2026-09-15 · 按 import 实况核）**：`tools/code.mjs`（165）= **改指**（`../indexer` 入边换核检索面；宿主 regex 回退退役——核面 FTS 回退承接）；`memory-tool.mjs`（386）= **改指**（存储/检索换核面——工具面五动作形态保留）；`agent/context-injections.mjs`（227）= **改指**（文档召回 `pushDocRecall` 换核 `docSearch`；记忆召回换核 `search`）；
  `repomap.mjs`（303）= **留**（import 面零索引族命中——实核仅 `vscode` + `node:path`〔`repomap.mjs:9-10`〕；数据源 = `workspace.fs` 活走查、与索引面零耦合）；`extension/panel-index.mjs`（191）= **改指**（核面读数/触发/相位——见下）。
  · **重建 UX**（核 sync = git 增量 + mtime 增量 + 编辑后单文件增量〔核 `reindexFile`——随核 agent 结果钩子〕+ 检索时惰性回填 ⇒「重建」自然化）：首建/升级后无核索引 → 面板「构建索引」入口（`thincoder.buildIndex` 命令 id 保留）→ 核序 `gitSync`（可用则增量）→ 回退 `codeSync`+`docSync`（并行——CLI `backgroundIndex` 同形）。
  进度 = Notification 文案 + 状态行段（`statusText` kind:index）按核相位：`scan` → 原文案（`status.indexScan`）· `index`（i/total）→ 新键 `status.indexProgress`（原 `status.indexEmbed` 退场——核面同步期不产嵌入）· `done` → 清段；完成提示 = 核读数（code/doc 文件数）。
  模型变更**零手动重建**（核面 = 失效向量置空 + 检索懒回填——不产无效结果；原「Rebuild now?」提示退场）；取消面 = 核 sync 无中断缝 ⇒ 通知 `cancellable: false`（端差收正）。**`webview/status-bar.js` + `locales/{en,zh}.json` + `test/status-line.test.mjs` 同批收正**。
  · **旧目录清退**（`{cwd}/.thincoder/index/`——manifest.json + vectors.bin）：归一后零读取（唯一读写方 = 删除集）⇒ **告示 + 显式清理动作（不静默删除）**——理由：其为派生缓存（全量可重建）**但**位于用户仓内（文件树可见 / 可能入 git 状态）——「派生缓存」不构成静默删除用户仓内目录的授权。
  形态 = 升级后首次面板初始化检测存在 ⇒ 提示一次（[删除][保留]——memento 去重）；点击删除 → 递归删除该目录（即时 · 幂等）；**零自动删除路径**；范围仅 `index/` 子目录（`.thincoder/` 其余〔`memory/` · `conventions.json`〕在读面续用——零触碰）；时点 = W8 落地版本首次激活。
  · **面板收正**（`panel-index.mjs`）：读数换源 = 核库计数（`code_chunks`/`doc_chunks` 的 `COUNT(DISTINCT path)`——CLI 口径同形）；`mismatch` 字段退场（懒回填自然化——webview 分支随收正）；
  触发换源 = 核 `gitSync`/`codeSync`+`docSync`；`hasEmbedder` 保留（embed-config → 核 config 面）；`atComplete` 等非索引面不动；命令 id 与 `indexStatus`/`statusText` 消息名保留（消费面只换值源）。
  · **记忆句柄**：`createMemory`（+ `embedder`/`codeOrigin` 注入）随端壳装配面创建持有（W15 面——`ensurePanelAgent` 同址；见「发现」10）——核面消费点（`tools/code` / `panel-index` / `context-injections` / `memory-tool`）经句柄调用。
  · **引擎护栏接线契约（W8 前置笔上抛 1 落地 · 修正轮-6——W8 开工前必落）**：① 造记忆面前先读 `isMemoryFaceEnabled()`（`thincoder-vscode/extension.mjs:46`——消费契约见同档 :44-45 头注）——false ⇒ 记忆面整体停用（不建句柄、不注册消费点）· 零崩。
  ② **端壳 import 链不得静态到达 `node:sqlite`**（核 `memory/schema.mjs:9` = 静态引入点；静态链实例 = `@thincoder/core/memory.mjs:7` 再导出 → `memory/schema.mjs:9`）——静态可达 ⇒ 低宿主模块加载期硬失败、护栏静默失效（`extension.mjs` 加载即败 · `activate()` 未及执行）。
  **形态判定 = 惰性 import**：记忆句柄创建点（`ensurePanelAgent` 同址——`extension/panel-chat.mjs:78`）经动态 `import()` 载核记忆面（旗标通过后）；备选「分层」否决（新增装配面、静态链不减）。**机判** = 自 `extension.mjs` 静态 import 闭包扫描 `node:sqlite` 可达性 = 0（动态 import 面不入闭包）。
  **门 1（引擎下限——已裁 2026-09-15）**：值 = **`^1.104.0`**（不另做真机实测——资料推导链已查尽：Electron #47706 回移线 = 36/37/38-x-y；1.104 = Electron 37.3.1 / Node 22.18.0 ≥ 22.13；运行期核验 = `activate()` 护栏：不满足 ⇒ showErrorMessage 停用记忆面、不崩）；
  **落点 = W8 前置笔**（独立单笔 · 承 U0 前置笔形态 · 不占单元号）——**已落 2026-09-15**（`051b21a9`+`e0234ee1` · §5）；接线契约 = 上条。**原门 2（索引存储面）已随 2026-09-15 裁定清**。
  **测试面**：`test/{index-perception, index-ignored-slow, portability-vsc-index}.test.mjs`（文件制驱动面——随删旧默认退役〔测试纪律①〕；unlisted 可见化等业务面按核面承接重述）· `test/memory-tool.test.mjs`（工具面保留——存储/检索用例按核面重述）· `test/context-parity.test.mjs`（索引缝 mock 名随改指同步）· `test/status-line.test.mjs`（相位改判）· `test/files.mjs` 清单同批。
  专项验收：内存读写/检索行为按 A12 归一（sqlite 面）· 索引检索 = 核面（FTS 兜底非空——无 embedder 时不空回）· 核内 memory 测试绿（含在 178 内）· 文档档 `MEMORY.md §6.9` 现状登记收正（修正轮-2 同批——文件制 + 索引面归一退场注）。

**W9 · AGENT-TOOLS 登记面**：删 `src/agent-tools.mjs`（1·barrel——核 17 行登记册替代）· `agent-tools/{goal 53, plan 88, task 81, timer 43, verify 310, skill 52, eng 105, batch-segment 188, digest-budget 65, child-permission 38, read-history 271, recent_changes 15}.mjs` →
  核 `@thincoder/core/agent-tools.mjs`（登记册单一来源——§2.13.4 #83）+ 各子档。存活改指 1：`agent-tools/index.mjs`（16 行 barrel → 改指核 `agent-tools.mjs`，VSC 侧不再自持工具集 re-export 面）。`agent-tools/read-history-discovery.mjs`（S·118）保留——内部改指核 read-history 面。测试面：`test/batch-segment.test.mjs` ·
  `test/verify-redesign.test.mjs` · `test/read-history-guard.test.mjs`（改指核或退役——按测试纪律①默认退役判据逐档判：业务可观察 + 集成未覆盖 + 可稳定驱动三满足才转 ②③）。专项验收：W9 删除集零引用 · 登记册 14 名装配断言（引核册）· verify/batch-segment 行为面用例绿。

**W10 · PROVIDER**：删 `src/provider.mjs`（426→核 `provider/core.mjs`）· `provider/transports/{anthropic 247, google 264, openai 350, responses 415}.mjs`（→核 `provider/{anthropic,google,sse,responses}.mjs`——openai 面对应核 core+sse 融合面）· `provider/list-models.mjs`（162）·
  `provider/rate.mjs`（156）· `src/proxy.mjs`（273）→ 核对应子路径。存活改指 3：`extension/{provider-flows 220, settings-panel-write 153, settings 348}.mjs`。**端壳缝接线**：`seams.describeArgs`（VSC 面板摘要——`advisor/loop.mjs` 现形面，随 W12 落地装配）· 模型规格端侧派生面（`specs.mjs` = W16 面改指核 `model-specs.mjs`）·
  限流等待/模型列表失败形态按 §2.5 #114/#115 已裁并集。测试面：`test/{provider-admission, provider-model-guard, provider-timeout-semantics}.test.mjs`（改指核面/退役判）· `test/smoke-provider.mjs` 核对。专项验收：W10 删除集零引用 · 四 transport 接入后 LLM 调用 = 核实现（未涉面 N1）· provider 配置/面板流按 `PROVIDER.md §6.19` 接线收正。

**W11 · SESSION（端壳改指面 · 零删）**：`extension/{session-io 436, session-slots 399, session-slot-write 178, session-gc 142,
  panel-session 338}.mjs` 五档内部由自持会话逻辑改指核会话面（`@thincoder/core/session.mjs` 族：listSlots/applySession/switchToSlot/newSession/slotPath + session-slots/session-slot-write/session-gc——存储契约 version 1/2 不变 · A14 以 CLI 为准，§2.6.3 U11 注同源）。
  **端壳缝**：`ctx.carrier/runTurn/hooks`（挂起载体——VSC `history` 字段对象，`AGENT-LOOP.md §2.3` 10 字段双夹具）· `opts.schema`（`$schema` 写盘注入——现形 `config-io.mjs:108` VSC 值迁 settings-panel-write 供值）。测试面：`test/{session-boot, agent-lifecycle-singleton, eng-settlement, expand-home,
  context-parity}.test.mjs` + `integration/scenario-04-session-recovery.test.mjs`（端壳保留、内部改指核面——行为断言不改）。专项验收：会话开关/恢复/GC 行为 = 核面（N1 未涉面口径内 VSC 面板行为登记）· 载体双夹具跑 `AGENT-LOOP.md §2.3` 状态机断言。

**W12 · ADVISOR/会诊/飞刀**：删 `advisor/` 13 档（citations 142 · compaction 174 · convergence 80 · history 77 · loop 279 · main 320 · messages 292 · project-context 198 · provider 39 · repos 131 · run 249 · tools 54 · truncate 57 = 2,092 行）→
  核 `@thincoder/core/advisor.mjs` + `advisor/*`（`main.mjs` 的同源重组由核承载；`provider.mjs` = 核 `run.mjs` 的 `resolveAdvisorProvider`）+ `agent-tools/{advisor 345, advisor-async 496, consult 474, subagent-escalate 225, subagent-escalate-async 232, subagent-spawn-gate 183,
  subagent-spec 64}.mjs` → 核对应（escalate 族→`agent-tools/{escalate-async,subagent-actions}` · spawn-gate→`subagent-spawn.mjs` · spec→`subagent.mjs` 载荷）。存活改指 5：`agent-tools/index.mjs` · `agent/agent-state.mjs` · `agent/execute-tools.mjs` · `agent/tool-gates.mjs` ·
  `extension/suspension.mjs`。`agent-tools/async-discard.mjs`（S·113）保留——内部改指核 async-settle/scheduler。**#99 panel 动作剔除**（§2.13.4）：VSC 装配层过滤 `panel` 动作（VSC 无该动作——subagent-spec 现形已声明）；**形态 = 端侧过滤、零核改动**（未决 3）。**端壳缝接线**：`io.ask`（permission-gate 面板卡片）· `ctx.onQuestion`（panel-callbacks）·
  `ctx.onPermissionRequest`（合并面板 gate）· `ctx.callbacks.onToken`（postMessage）· `seams.describeArgs`（VSC 面板摘要）。测试面：`test/advisor-*` 5 档 + `test/{child-permission*, subagent-observe-send, config-pool, eng-settlement}.test.mjs`（核面改指/退役判）。专项验收：W12 删除集零引用 ·
  顾问链/收敛/止损护栏 = 核实现（`ADVISOR-CONVERGENCE` 需求档 §8 端差四条登记面收正）· `panel` 动作装配后不可达（反 证断言）· 四缝假注入断言（§2.13.3 验收列）。

**W13 · 子代理/异步族**：删 `agent-tools/{subagent 384, subagent-run 205, subagent-scheduler 497, subagent-async 466, subagent-actions 399, async-settle 182}.mjs`（2,133 行）→ 核对应（异步载体 10 字段双夹具——`AGENT-LOOP.md §2.3`）。存活改指 3：`agent-tools/{async-discard, index}.mjs` · `extension/suspension.mjs`。
  `agent/execute-tools.mjs`（S 编排——含 L3 peer 冲突/事件对象/§29 记账等 VSC 特有面）保留——其 subagent 调用改指核面。测试面：`test/{async-parity, async-visibility, batch-doc-gate, eng-designer-role, subagent-audit-summary, subagent-id-counter,
  turn-across-segments}.test.mjs` + integration/scenario-02/03（核面改指——行为断言按裁决）。专项验收：W13 删除集零引用 · 池/墓碑/载体状态机双夹具绿 · async 中断/停 语义按裁决（面内）· 并发上限 4 不变。

**W14 · TOOLS 实现面**：删 **12** 同路径档（`shared 413` **除外——保留为拆壳后薄壳**〔修正轮 #6〕：`checklist 438 · edit-diff 162 · execute 202 · file 122 · git 378 · linter 127 · lsp 127 · ops 112 · question 56 · search 295 · tree 64 · web 135`）
  + 7 M 档（`edit-fuzzy-match 78 · edit-line-params 131 · file-edit 434 · hashline-edit 101 ·
  more-file 390 · read_image 63 · wait_for 190`）→ 核 `tools/*`（file→`file.mjs`（edit/hashline/read_image 全在其内）· more-file→`{patch,search,file}.mjs` · wait_for→`ops.mjs` · edit-fuzzy/line-params→`{edit-batch,edit-diff}.mjs`）。**保留 = VSC 装配面**：`tools/index.mjs`（76·
  VSC 登记表——含宿主工具 context/focus/shell/code + 自持 builtinTools）· `tools/{shell 317, code 165, context 139, focus 51}.mjs`（S）· **`tools/shared.mjs`（413——拆壳后薄壳〔修正轮 #6〕：通用面改指 `@thincoder/core/tools/shared.mjs`；端侧缝供值留此档＝§2.13.3/§2.13.5 两缝的接收档指名；预计 413 → 约 150±50，净减）**
  · `tools.mjs`（5·barrel）——其内部 import 全部改指核各子档。存活改指 5：`agent/context-injections.mjs` · `tools/{index, context, focus,
  shell}.mjs`＋拆壳薄壳 `tools/shared.mjs` 自身改指核面（「改核心面」类同列）。
  **端壳缝接线**（§2.13.3/§2.13.5）：`writeThroughPath/configureWritePath`（编辑器写路径——现形 `tools/shared.mjs:66-106`，**接收档 = 拆壳薄壳 `tools/shared.mjs` 本体**〔已指名〕：getOpenDoc/applyEditorEdit/applyEditorRangeEdit）·
  `configureExecRun/runCommand`（现形 `tools/shared.mjs:148` runInterruptible——同档供值）· `configureTreeResolve`（cwd 归一）·
  `configureProcessTreeKill`（树杀）· `configureGitApproval`（审批门）· `configureLspHost` · `configureEditReceipt` · `configureSkillLoader` · `configureEngMirror` · `configureVerifyDiagnostics`（§2.13.3 族余项 9 组逐组按端供值/缺省）。测试面：`test/{edit-tool-improvement, read-dual-end,
  wait-for-advisor-pool, git-commit-pathspec, tool-descriptions}.test.mjs`（核面改指）· integration/scenario-01/06（.src 前缀 import 修正为核子路径——.src 兼容前缀发现见「发现」5）。专项验收：W14 删除集零引用 · 写路径缝双夹具 + 结构机检（`thincoder-core/test/write-path.test.mjs` 已绿）·
  编辑工具 VSC 端差异按 EDIT 六档 §6 现状登记收正（编辑器路径/range 偏移/无 dirty 护栏/BOM/内嵌描述）· vscode 编辑器读写行为 = VSC 面（fuzz/line-params 核算法 + 端壳写回）。

**W15 · AGENT-LOOP（重定——零删 · 修正轮-7）**：原「删 6 档」按本批自身判据「同路径 ≠ 同内容」重判——`src/agent.mjs`（460）· `agent/{setup 668, run-stages 382, setup-reminders 252}.mjs` = **S 端壳装配面**（非删除集）· `src/explore-distill.mjs`（157）= 端壳/适配器（核 re-export 签名异——W6 已登记）· `src/i18n.mjs`（56）= `t()` 壳（`I18N.md` D1 已裁）。
  **单元目标（重定）= 装配面瘦身 + 核原语改指 + 端壳缝四条落地**；**新家 = 原地**（不搬家——F6 定形）。保留 `agent/{agent-state 111, context-injections 227, execute-tools 363, run-helpers 297, tool-gates 159}.mjs`（S 编排——内部改指核 agent 面）。
  六档内部改指 = 核 `@thincoder/core/{agent.mjs, agent/*, explore-distill.mjs, i18n.mjs}` 单源（端特有面保留）；**循环契约位移 = 调用期适配**（承 W6 先例——F7 定形：live `autoApprove` getter · `opts.distillState`↔核 `agent._pendingDistill` · `opts.turnInput`↔核 `consumeInjected` · 载体 10 字段宿主〔VSC 住 history、核住 agent〕）。
  适配面清单随实施落 §5；存活改指 = 0（零删——删除集入边零改指；六档 = 端壳改核心面类——R24a 另计）。
  **端壳缝四条落地（R2–R5 裁定面）**：① 工具登记面端侧装饰（R2——`vscSubagentFace` 已落 `setup.mjs`〔W13〕：#99 panel 剔除 · C-5 终态回显 · `isReadonlyAction`/`isControlAction` 谓词；核内缝不新增〔端差走端侧装饰/注入 · 零核改〕——W15 保留该面）；
  ② #113 编辑器上下文采集（R3——端侧供给：端装配面围绕核 `prepareRun` 注入；前置推送形态须按 `context-parity` 序表实证收正〔序表 = VSC 产品档 `AGENT-LOOP.md` §17.4；断言面 = 端测试〕；核内补位不取）；
  ③ 端身份面（R4——**VSC 自持**〔承 W11 marker 层先例：端 `END = "vscode"`〔`src/extension/session-slots.mjs:49`〕+ env 行端生成；断言面 = `context-parity` T-CI-1 / `setup-reminders`〕；核 `END` 参数化 = 核内笔）；④ ⏹ queued 事件面（R5——等待头回收并入本单元验收）；续行项 = `projectDictionary(locale)`（VSC `locales/{en,zh}.json` 投影——核 i18n 消费，投影逐字冻结）。
  #112 read_image 门（定稿 = 核内装配面恒含 + run 期重解——**核对未落**〔三处实证 = 修正轮-7 块「核内笔清单」节 §1〕⇒ 核内笔登记 · VSC 零动作不变）· #175 推理档位面（`extension/reasoning-mode.mjs` · 34 行）——**D2 已裁**（2026-09-13 · 按建议——`AGENT-LOOP.md` §3.2）+ **端侧自有（核内无需位 · 正常落地形态、非缺位——2026-09-15 裁定 · 裁 ②）**：
  两半路径 =（a）`autoThink` 键随 config 归一（VSC 死键复活；默认 `false` ⇒ 无行为变化）（b）档位 patch 全程端侧（经 provider 字段数据面——核 `thincoder-core/provider/core.mjs:52-53` 读 · 同档 `:193-204` 落请求 body）。
  **兜底句**：实施期实核发现核内确需新缝 ⇒ 停下上抛（不自行改核）。关联注：VSC 面板 Auto 入口 = 需求池条目（`docs/TODO.md` 需求池「VSC 端暴露 Auto（`autoThink`）推理档位开关」——**另批**，不属本批）。**核内笔**（#112 / 核 `END` 参数化 / `depInfo`·C-6）= 上抛登记——见下修正轮-7 块「核内笔清单」节。
  测试面：`test/{context-parity, setup-reminders, eng-designer-role, image-downgrade, digest-visibility, status-line, turn-across-segments, session-boot}.test.mjs` + 装配面消费档（`agent-lifecycle-singleton` · `expand-home` · `async-parity` · `subagent-observe-send`——F6 实测补列）+
  integration/scenario-01/05/07（**端壳断言保留**〔档不删——原「核面改指」口径退场〕；`.src` 前缀 import 修正）。
  专项验收：W15 面（六档）零断链（反向判零口径——零删不适用）· 装配输出零字面（与 W2 同门）· 提示词装配面（assemblePrompt 挂点经核——§2.13.8 结构机检已核内绿）· hooks 四事件名冻结（未涉面）· 载体 10 字段端壳双侧化 · ⏹ queued 等待头回收（事件面——R5 并入）。

**W16 · CONFIG**：删 `src/config.mjs`（190）· `config-io.mjs`（470）· `config-migrate.mjs`（185）· `config-presets.mjs`（40）· `config-consult.mjs`（78 → 核 `config-io.mjs:178` `cascadeRemoveProvider`）· `agent-tools/settings.mjs`（260）→ 核 `@thincoder/core/{config.mjs, config-io.mjs,
  config-migrate.mjs, config-presets.mjs, agent-tools/settings.mjs}`。存活改指 16（最大扇出——config-io 25 入边中存活者）：`agent/{agent-state, run-helpers}.mjs` · `config-mcp.mjs` · `extension/{chat-panel, config-watch, image-handler, migrate-settings, panel-callbacks, panel-chat, panel-index,
  panel-messages, presets, provider-flows, settings-panel-write, settings}.mjs` · `specs.mjs`（5 行 re-export → 改指核 model-specs/config 面）。**端壳缝**：`opts.schema`（`$schema` 写盘注入——VSC 指针值）· `io.ask`/`ctx` 族随 W12/W14 ·
  配置键面/默认值/`$schema`/类型校验按 §2.5 #74/#77/#79/#80/#87/#128–#132/#177 已裁（旧键可读 A7 兼容用例在位——`thincoder-core/test/config.test.mjs`）。测试面：`test/{config-*, provider-admission, settings-tool, config-watch}.test.mjs`（核面改指——VSC 面板写面保留端壳断言）· integration/scenario-07。专项验收：W16 删除集零引用 ·
  配置装载/迁移 = 核面（旧格式可读兼容断言在核测试内）· 面板写盘 `$schema` 键在场（注入断言）· `CONFIG.md`/`SETTINGS-TOOL.md`/`DESIGN-TOKEN-SETTLEMENT.md §6.3`/`ENG-TOKEN-BINDING.md §6.3` 接线面收正。

#### 薄壳面清单（保留 VSC 侧 · 零镜像）

| 面 | 内容 | 依据 |
|---|---|---|
| 面板/宿主层 | `src/extension/**` 40 档（chat-panel · panel-* 20 · 会话端壳 session-* · 设置/预设/流 · 权限/挂起/停止 trace） | 结构性不对称（§2.5 ④ 端特有桶 VSC extension/**——B17） |
| 前端面 | `webview/**`（ui/chat/activity*/mcp/settings 等前端档——经 postMessage 协议，不经 src import） | 端特有；`docs/vsc/design/WEBVIEW{,-PROTOCOL,-INPUT}.md` 契约档 |
| VSC 特有编排（src 内 S 档 **25**） | `agent/{agent-state,context-injections,execute-tools,run-helpers,tool-gates}`（VSC 循环装配/门禁/peer 冲突）· `agent-tools/{async-discard,read-history-discovery}` · `config-mcp.mjs` · `embed-config.mjs` · `memory-tool.mjs`（W8 后改指核 memory 面）· `repomap.mjs`（workspace.fs 数据源）· `specs.mjs`·`tools.mjs`（barrel）· `tools/{index,shell,code,context,focus}.mjs` · **`prompt-injections.mjs`**（W2 新建——锚取值表 · 数据面）· **`agent.mjs` · `agent/{setup,run-stages,setup-reminders}.mjs`**（端壳装配面——W15 重定）· **`explore-distill.mjs`（157）· `i18n.mjs`（56）**（端壳/壳——W15 重定） | 逐档证据 = 修正块 #2 表（对位行取值 + file:line——勘察 3 上收）；**修正轮-2：`indexer.mjs` 改入删除集——保留 S 面 18；修正轮-6：+ `prompt-injections.mjs`（W2 新建）→ 19；修正轮-7：+ W15 六档（同路径 ≠ 同内容）→ 25**（新增六档证据 = 表 2 增补节） |
| 文本面 | `locales/{en,zh}.json`（projectDictionary 投影面）· `assets/**` | VSC 显示/图标面 |

#### 模块权威档同步计划（实施时逐单元按现状收正 · 一致性面 · 不改机制）

> 总则：每单元提交时同步收正其「VSC 端接线/端差异」节的 **坐标 · 状态行 · 端差登记**（由「VSC 侧 `src/xxx.mjs` 自持镜像」更新为「VSC 经 `@thincoder/core/xxx.mjs` 引用」）；只收正形态，不触碰机制条文（07:08 裁定）。已落 VSC 端节清单（并入面——`VSC-MIGRATION-INVENTORY.md §9` 记录）：`CHECKPOINT §6.9` · `CONSULTATION §6.5` · `CONTEXT-COMPACTION §6.13` · `MCP §6.10` ·
  `MEMORY §6.9` · `SESSION §6.15` · `AGENT-LOOP §6.18/§2.3` · `TOOLS §6.11` · EDIT 六档 §6 · `PROVIDER §6.18/§6.19` · `AGENT-PARAMS §6.3` · `PORTABILITY §3.6` · `DESIGN-TOKEN-SETTLEMENT §6.3` · `ENG-TOKEN-BINDING §6.3` · `TOOL-OUTPUT-LIMITS §6.3` · `MULTI-INSTANCE-COLLAB` ·
  `BATCH-RECORD` · `ENGINEERING-MODE` · `SETTINGS-TOOL` · `DOC-CODE-RECONCILE §3.9` · `ARCHITECTURE §3.1/§4.1` · `PROXY` · `I18N` · `STRUCTURE-DEBT`。逐单元映射见（三）总表「模块权威档」列 + 各单元专项验收行。

#### 受影响文件全清单（R24a · as-of 2026-09-15 实核 · wc -l 口径）

| 面 | 构成 | 当前行数 → 预计 | 处置 |
|---|---|---|---|
| VSC 删除集（.mjs） | W1–W16 删除集 **94 档**（101 − `tools/shared.mjs`〔拆壳薄壳保留——修正轮 #6〕 − W15 六档〔重定零删——修正轮-7〕；逐档行数见各单元删列） | **19,052** → **0**（删除；W15 六档按删列口径 1,654 减列） | 接线改指核后删除 |
| VSC 删除集（.md） | `src/prompts/` 15 + `src/tools/*.md` 25 | 1,435 → **0**（删除） | W2 删 |
| VSC 端壳改指面 | **删除集扇入 32 档**（src/ 31 + 端点 `extension.mjs` 1——逐档清单 = 修正块表 4 + 口径注⑤〔`notify`·`panel-project` 移出——修正轮-7〕）+ **改核心面类**（W11 五档 · W14 拆壳薄壳 `tools/shared.mjs` · W6 三档 · **W15 六档**——同属端壳改指总账） | 扇入 32 档合计 **5,991 行**（逐档读数 = 修正块表 5；修正轮-2：`indexer` 456 移出〔入删除集〕· `tools/code` 165 补入；W11 五档另计 1,493 行 · W15 六档另计 **1,975 行**）→ 逐档 ±0～±N（真增行面 = 表 5 例外列） | 改指核子路径（>300 行档超软线判定 = 修正块表 5） |
| W15 装配面（重定保留 6 档——修正轮-7） | `src/agent.mjs` **460** · `agent/{setup 668, run-stages 382, setup-reminders 252}.mjs`（端壳装配面 S ×4）· `src/explore-distill.mjs` **157**（端壳适配器）· `src/i18n.mjs` **56**（`t()` 壳） | **1,975** → 净减（装配面瘦身 + 核原语改指 + 端壳缝四条落地——逐档读数落 §5） | 保留（零删——重定；>300 行档超软线判定 = 表 5 追加行） |
| VSC 测试面 | 60 档直连 src（逐档见各单元测试面行） | 逐档 0 ～ −N（例外：W2 `prompts-async-guidance` **176 → 326**——锚面重写；< 500 硬限〔§5 W2 收正注〕——修正轮-6 增补） | 核面改指 ∥ 退役（测试纪律①默认退役判据） |
| W8 前置笔测试面 | `test/engine-floor-guard.test.mjs`（新建 · 5 用例）· `test/files.mjs`（入册 `:84`） | **0 → 93**（新建 · wc -l 口径；§5 记 94 = 编辑器口径）· **84 → 85**（+1） | 已落地（`051b21a9`/`e0234ee1`——修正轮-6 补登） |
| W2 取值表（新建） | `src/prompt-injections.mjs`（13 名锚取值表——数据面 · 可测试性分离） | **0 → 65**（新建 · 实测） | 已落地（`0ee40682`——口径 = 端壳缝不新增档 · 取值表分离新建〔修正轮-6〕） |
| VSC 端点 | `extension.mjs`（**91 → 157**——W8 前置笔 + W2 均已落）· `package.json`（**134** · 值变更 +0 净行）· `.vscodeignore`（**17**） | `extension.mjs` = **合计实测 +66**（91 → 157 · wc -l 口径）= **W8 前置笔 +60**（§5 记 92 → 152 = 编辑器口径；设计估 +10±5 收正）+ **W2 入口注入 +6**（`0ee40682`——+2 import + 4 行注；设计估 +0~2 收正）+ 改指 **1 处**（mcp 入边——W7；i18n 半随 W15 重定退场〔壳保留——修正轮-7〕）；`package.json` = 下限值变更 `^1.85.0` → `^1.104.0`（已落 `051b21a9`——**+0 净行实测**；W17 收口笔 +8±3 以表 3 为账）；`.vscodeignore` 零改（装载面已在位） | W2 入口接线 + W8 前置笔（修正轮-6 收正） |
| W8 收正面（索引面归一——webview / 文案） | `webview/status-bar.js`（**101**）· `locales/{en,zh}.json`（**259 / 259**） | 101 → ±10 · 259 → ±5（逐档——相位渲染 + 键面收正：`status.indexEmbed` 退场 · `status.indexProgress` 新键） | W8 同批收正（修正轮-4 补登） |
| 模块权威档 | （三）总表映射 ≈ 24 档 `docs/core/design/*.md` + 子系统需求档端对位面 | 逐档 ±1~6 行（收正注记） | 按单元同步收正（一致性面） |
| 既有基线 | PROVIDER.md L260（336 chars——折行前实判 1 行 >300） | **已清**（父侧 `60f8bab2` 折行落地——宽度闸归 0） | 收口（修正轮-6——原「交父侧 / 未决 5」退场） |

> **不新增 `.mjs` 口径（修正轮-6 收正 = 父侧裁定）**：**端壳缝不新增档**（全部并入既有端壳档——方案选型 4(a)）；**取值表分离新建 = 允许**（`src/prompt-injections.mjs`——数据面 · 可测试性；`0ee40682` 落地）；VSC `src/` 收口后 = **25 S 档**（修正轮-7：+ W15 六档——端壳装配面 4 + 端壳/壳 2）+ 40 extension + tools/index + `locales/` 前端面外的装配/端壳面（薄壳面清单）。

#### 验收判据（回指需求条目 · 逐条可机器验证）

| # | 判据 | 回指 | 机判方式 |
|---|---|---|---|
| A-K1 | 16 单元全部落地后 VSC 全链 exit 0（`npm test` · `lint` · `test:full` · `test:integration` · `doc:check`） | N1 | 五命令实跑 `(exit code 0)`；**既有红判读口径 = 零新增 + 基线登记**（用户裁定 2026-09-15 15:12——本档 §1 :41；原未决 7 收口——修正轮-6）；四命令基线（2026-09-15 实跑）= A-K8 行 |
| A-K2 | 核回归 = 178/178 · fail 0（核零改动——比对改前基线） | N4·N5 | `node --test`（cwd = 核目录） |
| A-K3 | 仓根三机检：锚**0 悬空** · 台账**0** · 宽度**新增 0**（既有基线红 PROVIDER.md 已随父侧 `60f8bab2` 折行清零——宽度闸归 0；修正轮-6 收口） | N6 | 三脚本实跑读数 |
| A-K4 | 每单元删除集在 `src/`+`test/`+`extension.mjs` 域**反向判零引用**（两类形态各 0 命中——承 §2.6.2（五）法 1） | F5·N2 | 机判命令（实施 §5 落读数）。**扫描域实核（2026-09-15 修正轮-4）**：`thincoder-vscode/scripts/**`（3 档）对 `src/**` 零模块引用（实读——域维持不扩；承 CLI 先例「扫描域不得窄于计数域」） |
| A-K5 | VSC 装配输出零 `{{inject:` 字面 + 13 锚 VSC 值逐锚在场 | F8·§2.13.2 | **驱动形态 = 端侧入口径**：`activate()` 直调（假 `vscode` 桩 = `test/vscode-mock/`——既有基建；webview 面经 `test/helpers/webview-env.mjs`；或 integration 沙箱面同源）——W2 落一条端侧入口用例：`activate()` **入口首语句**（`configurePromptInjections(VSC 表)`——紧随入口 · 先于装配步）后断言 ① 四装配面输出零字面 ② 13 锚 VSC 值逐锚在场（对照 CLI 先例 = 设计档 §2.6.3 U2 专项补 ⑦；「首步」表述统一 = 修正轮-6 增补） |
| A-K6 | 提示词零残留：`src/prompts/` + `src/tools/*.md` 枚举空 | F9 | glob 枚举 |
| A-K7 | 逐单元单笔提交可回滚：**每单元提交 = 单笔（删除集 + 改指 + 测试面同笔——跨单元锚点改指随删除单元落）**；`git revert` 后该单元全链复绿 | N2·N5 | revert 演练（抽样 ≥1 单元）+ 提交面核验（`git show --stat <sha>` 逐单元单笔判定） |
| A-K8 | 未涉面用例逐数不变（VSC test:full 内非本单元用例计数与基线一致；面内按裁决改判逐条登记） | N1·F6 | 用例计数对账。**四命令基线（2026-09-15 修正轮实跑 · cwd=`thincoder-vscode/`）**：`npm test`（fast）= 622 / 581 pass / fail 0（41 慢测快层跳过）· `lint` = exit 0（293 档 OK）· `test:integration` = 28/28 · fail 0 · exit 0 · `test:full` = 622 / **620 pass · fail 2**（T-DC6② · T-DC15）· `doc:check` = **exit 1**（V5 21 处）——**既有红判读口径 = 零新增 + 基线登记**（2026-09-15 裁定——原未决 7 收口）。**基线推进（2026-09-15 首波后 · 修正轮-6 收正）**：W8 前置笔新档 **+5 用例** ⇒ 用例基数 622 → **627**；存量两红随父侧 `60f8bab2` 消解、`doc:check` 归 **0 命中** ⇒ 首波后基线（§5 W1/W3 终态读数在案）= `npm test` **627 / 586 pass / 0**（41 慢测快层跳过）· `lint` **292 档 OK** · `test:full` **627 / 627** · `test:integration` **28 / 28** · `doc:check` **0 命中**；**基线再推进（W2 落轮 `0ee40682` · 修正轮-6 增补）**：+6 用例（`prompts-async-guidance` +5 / `tool-descriptions` +1）⇒ 现基线 = `npm test` **633 / 592 pass / 0** · `test:full` **633 / 633** · `test:integration` **28 / 28** · `lint` **292 档** · `doc:check` **0 命中**（W2 后现基线——§5 W2 终态读数在案） |
| A-K9 | 端壳缝与界面：写路径/执行面/权限/`$schema`/载体 10 字段双夹具/`projectDictionary` 逐项注入断言绿 | F11·§2.13.3 | 核内测试（178 内）+ VSC 端装配用例 |
| A-K10 | 模块权威档收正：VSC 端节坐标/状态行更新 + 锚 0 悬空（实施轮改指时同批落） | 07:08 裁定 | doc-anchors + 收正档 diff 审读 |
| A-K11 | **S2 收口面（W17 收口笔）**：`thincoder-vscode/AGENTS.md` 约定段改述（±4）· `scripts/check-vsix.mjs` 新建 + `package.json` `postpackage` 挂点（vsix 含核 + 版本 + 提示词面完备 = **断言 B + D**——T-C7 vsix 域）· `scripts/publish-all.mjs` +8±4（段 0 + 段 1.5）· **N4 的 VSC 判据（vsix 内嵌核 = 解包断言）** | N4·F7 | 时点 = **收口笔（W17）**；机判 = `postpackage` 解包断言 **B + D** exit 0 + 发布编排 dry 面（见修正块「S2 收口笔」节） |
| A-K12 | 索引面归一：`src/` + `test/` 域零索引族引用（`indexer` / `index-bin` / `index-discover` / `.thincoder/index` 反向判零）；检索 = 核 `codeSearch`/`docSearch`（无 embedder → FTS 回退非空——**限非空 query**；空 query 短路返回空文案〔核口径 = `docs/core/design/MEMORY.md` :139/:143〕）；面板读数源于核库（`code_chunks`/`doc_chunks` 计数） | 本裁定（§1 :38 · 2026-09-15）· F5 | 反向判零（承 A-K4 法）+ 核面行为用例 + 端侧读数断言 |
| A-K13 | 重建 UX：进度相位 = 核 `onProgress` 映射（`scan`/`index`/`done`——`statusText` 段与 Notification 文案；原 `status.indexEmbed` 退场）；模型变更零手动重建（失效向量置空 + 检索懒回填——换模型后自动回填、不产无效结果） | 本裁定（§1 :38） | 端侧用例（相位序列 + 懒回填后向量非空）+ `test/status-line.test.mjs` 改判随落 |
| A-K14 | 旧目录清退：升级检测告示 + 显式清理动作在位（用户动作触发 · 幂等）；**零自动删除路径**（清理调用点唯一且挂告示动作） | 本裁定（§1 :38） | 静态核验（删除调用点唯一性）+ 端侧用例（告示一次 → 点击 → 目录删除） |

#### 边界（本批不做）

- 不碰核包 `thincoder-core/**` 一字（含测试——核内任何待补位登记为上报，不代落）；不碰 `thincoder-cli/**`。
- 不改机制/不新增需求语义；端差一律走注入（契约 5/10）——**零** `if (vsc)` 式壳判断入核。
- 引擎下限变更**已裁（2026-09-15：`engines.vscode` `^1.85.0` → `^1.104.0` · 不另实测）**——时点 = **W8 前置笔**（独立单笔 + `activate()` 护栏）；不引入降级路径（A13）。
- 索引数据面（旧 `.thincoder/index/`）**零迁移 / 零兼容**（已裁 2026-09-15——**不写导入器**；重新索引 = 正当路径）；旧目录清退 = 告示 + 显式清理动作（不静默删除用户仓内目录）。
- 不新建文档档（07:13——实施面只住批次档）；模块权威档只收正、不扩容。
- 不动 `scripts/**`（工程工具面 = 父侧）· 不动台账 `docs/TODO.md` · 不 commit · 不发起评审（设计轮后是否评审由用户定）。

#### 发现（逐条 · 不静默）

1. **度量脚本与现况冲突**：`scripts/mirror-divergence.mjs` 对 `thincoder-cli/src/prompts`（CLI 已删）报 ENOENT——默认面过时（**2026-09-15 修正轮复跑仍 ENOENT**）。scripts/** = 父侧工程面 ⇒ 上报，本批零写入。
2. **PROVIDER.md 宽度基线红**：实为 **5 行** >300（L27/47/48/260/305——含并行线 qwen-plan 批产物；其中 4 行为闸豁免表格行，实判 1 行 L260）。非本批写域 ⇒ 报父侧（未决 5）。**结局（修正轮-6）**：已由父侧 `60f8bab2` 折行清零（宽度闸归 0）——未决 5 收口退场。
3. **同路径 ≠ 同内容实证**：`tools/index.mjs` = 同路径但 VSC 装配面（保留该档——删除集 −1）。⇒ 删除集判定按**内容实核**而非路径（本批 47 档逐档读档 + 登记册实读完成）。
4. **任务书清单计数差**：探勘清单写 45 档实为 **47 档**（3+5+8+5+5+6+3+12=47）——按 47 执行完毕（分类 M 28 / S 19 / U 0——`indexer` 随修正轮-2 改入删除集，保留 S = 18；**修正轮-7**：+ W15 六档〔同路径 ≠ 同内容〕→ **25**——薄壳面清单），如实登记。
5. **`.src` 前缀 import 面**：`test/integration/scenario-*.test.mjs` 内现用 `.src/xxx` 形态 import（如 `.src/agent.mjs`）——集成测试改指核时该前缀形态一并修正（或改仓根路径），登 W14/W15 验收面。
6. **advisor/main.mjs 的 rv async 隔离参数**（VSC 增量）：核 `advisor.mjs` 无同名参数，等效面 = 核 `agent-tools/advisor-async.mjs` `_advisorRuns` 注册表——删除时确认 VSC 侧该隔离语义由核注册表等效承载，零行为差（面内按裁决）。
7. **既有红三处（VSC 域锚面 · 2026-09-15 修正轮实跑）**：① `npm run doc:check`（VSC 域 · `--strict`）= **exit 1**——V5 命中 **21 处 / distinct 13**（A2 18 / A3 3 · **阻断态**）；
  ② `npm run test:full` = **2 fail**——`T-DC6②`（doc-anchors 源域实跑「真仓复跑零命中」断言——与 ① 同源）· `T-DC15`（reconcile-lookup 反查夹具——**由在途未提交改动 `thincoder-vscode/scripts/reconcile-lookup.mjs` 引入**〔git status 实核〕）；
  ③ 档头注「VSC 域 21 处报告态（非阻断 · 已登记）」与 ① 实跑（**阻断态**）相抵。以上对象 = VSC 产品档（D-C14 迁移期参照历史 · 保留 ≠ 维护）+ 并行线 WIP——非本批写域 ⇒ 口径与消解归属上抛（未决 7）。**结局（修正轮-6）**：口径已裁 = 零新增 + 基线登记（§1 :41）· 红线清扫闭环（VSC `doc:check` 0 命中 · `test:full` 627/627 全绿——`60f8bab2`）——未决 7 收口退场。
8. **§2.8 同族 5 行同题（finding 13 类 · 已收正 2026-09-15 修正轮-4）**：§2.8「提示词加载面（S2 改）」另有 5 行（`:1039`–`:1043`：CLI/VSC 的 advisor 加载面 · `tools/shared.mjs`〔CLI/VSC〕· `agent/setup.mjs`〔CLI/VSC〕）与 finding 13 同题（「S2 改」 vs 执行实况「删」互斥）：
  CLI 侧四档实核均已删（`thincoder-cli/src/{advisor.mjs, tools/shared.mjs, agent/setup.mjs, prompt-overlays.mjs}` 不存在）；VSC 侧对应档 = 逐单元收正（W12 删 `advisor/main.mjs` · W14 拆壳薄壳保留 `tools/shared.mjs` · **W15 重定保留 `agent/setup.mjs`〔修正轮-7——原「随 W15 删除集」句已取代〕**）。
  **修正轮-4 已按 finding 13 同法择一收正**——CLI 三档 + VSC `advisor/main.mjs` = 「S2 删」· VSC `tools/shared.mjs` = 「S2 改——拆壳薄壳保留」（权威档 · `PROMPT-SYSTEM.md` 同批——见修正轮-4 块）。
9. **`read-history-discovery.mjs` 改指对象观察**（W9 文本 vs 实况）：W9 写「内部改指核 read-history 面」，而实核其 import 面 = `../extension/session-io.mjs`（W11 端壳档——非删除集扇入、无核 read-history import）⇒ 实施时按核 read-history 接线形态核认（登记观察项，不代改）。
10. **记忆句柄装配点未在案（本轮补点）**：VSC 端 `createMemory` 落点在既有设计与权威档零命中（grep `createMemory` = 0）——本轮在 W8 索引面写明装配形态（随端壳装配面〔W15 面〕创建持有）；若父侧认定应独立成项（装配契约），可移。
11. **A2 记忆面一次性导入器未落（`memory import`——实核 2026-09-15）**：`thincoder-cli/src/cli/memory-command.mjs` 子命令实读 = `list` / `search` / `put` / `remove`（usage 行 = `Usage: thincoder memory <list|search|put|remove>`）——无 `memory import`；CLI 树 `memory*.mjs` 枚举无导入器档。
  ⇒ 权威 §2.8「记忆面导入器（S2 新建 · +60±20）」面**未落**（A2 已裁 · `design/MEMORY.md` §3.1 A2）；导入器面住 CLI ⇒ 非本批写域（本批零写入）——**上抛**；时序 = **≤ W8 落地版本发布前**（否则 VSC 老用户 personal 记忆无迁移路径）。

#### 未决（真判不准 / 需人裁 —— 一律打回主 agent · 无旁路）

1. **A8 引擎下限（W8 前置门 · 已裁 2026-09-15）**：用户裁定 **值 = `^1.104.0`**（贴最低线案——覆盖 1.104–1.131 用户群）；**不另做真机实测**（资料 / 推导链已查尽——Electron #47706 回移线 = 36/37/38-x-y；1.104 = Electron 37.3.1 / Node 22.18.0 ≥ 22.13）；
  运行期核验 = `activate()` 护栏（不满足 ⇒ showErrorMessage 停用记忆面、不崩）。**落点 = W8 前置笔**（独立单笔 · 承 U0 前置笔形态）。**本项清**（权威档同批收正：设计 A8 · §2.12.3 第 1 行 · 设计 `MEMORY.md` · 需求 `N7`——见修正块）。
4. **§2.13.2 核内测试同步坐标**（`thincoder-core/test/prompt-files.test.mjs:105` 旧锚名断言）：CLI U2 应已收正——W2 实施时核对；未收正 = 发现上报（不代改核）。

#### 交付表

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | §2 任务书写入（单元划分/删旧/复跑/回滚/权威档/验收） | ✅ Done | 本段（W1–W16 逐单元 + 总表 + R24a + 验收判据） |
| 2 | 勘察实核（import 现状/分类/登记册/装载面） | ✅ Done | 158 档全分类（73 同路径 + 85 非同路径）· 删除集 **134 档 / 20,487 行**（修正轮-7：W15 六档移出——零删重定）· 扇入 **32**（修正轮底账——修正块表 4 + 口径注⑤；修正轮-2：`indexer` 移入删除集〔S 保留 18〕；修正轮-7：`notify`/`panel-project` 移出） |
| 3 | 方案选型对比（≥2 候选含否决理由） | ✅ Done | 7 候选（1 选定 + 2 整树/双源否决 + 2 端壳缝子选型 + 2 索引面驱动子选型——修正轮-2 补） |
| 4 | 薄壳面清单 | ✅ Done | 面板/宿主 40 · webview · S **25** · locales/assets（修正轮-2：S19→18；修正轮-6：+ `prompt-injections.mjs` → 19；修正轮-7：+ W15 六档 → 25） |
| 5 | 模块权威档同步计划 | ✅ Done | 逐单元映射 + 总则（收正·一致性面·不改机制） |
| 6 | 验收标准逐条回指需求 · 机器可验 | ✅ Done | A-K1–A-K14（回指 F5/F8/F9/N1-N6/07:08 裁定 + 本裁定〔A-K12–A-K14〕；A-K11 = N4·F7——修正轮 #3） |
| 7 | 未决（真判不准/需人裁） | ✅ Done | **2 条**（引擎下限〔已裁 2026-09-15〕· 核内测试核对；索引存储面收口退场——修正轮-2 块；#175 收口退场——修正轮-3 块；宽度基线红 / 既有红口径收口退场——修正轮-6 块；**#99 panel 缝收口退场——修正轮-7 块〔端侧装饰已落 W13〕**） |
| 8 | 三闸读数 · 零落盘文档档 | ✅ Done | 锚 0 · 台账 0 · 宽度新增 0（基线红 1 档已随 `60f8bab2` 清——修正轮-6）· 核/VSC/CLI 各树零触碰 |
| 9 | 不 commit · 不发起评审 | ✅ Done | 未 commit · 未发起（用户定后另行） |

> **补正（回读核对 D6 · 2026-09-15 · eng-designer；修正轮同步）**：上段笔误收正集合与档头注对齐 = **3 项**——① 「STRUCUTRE-DEBT」→「STRUCTURE-DEBT」（权威档清单行）；② 「十字段」→「10 字段」（W11/W13 专项与 A-K9；正文 4 处落盘）；③ `VSC-MIGRATION.md` 旧 §9 → `VSC-MIGRATION-INVENTORY.md §9`（V1 指针——档头注记，正文 :199 收正）。纯字形 / 指针修正，语义零变化。

**变更记录**：- 2026-09-15（VSC 代码面接线设计轮 · eng-designer）：§2 写入任务书——W1–W16 逐单元（删 140 档 / 22,098 行 · 存活改指 33 · 单笔回滚）+ 方案选型（5 候选）+ 薄壳面清单 + 模块权威档同步计划 + 验收判据 A-K1–A-K10 + 未决 5 条（引擎下限 / 索引存储面 / panel 缝 / 核内测试核对 / 宽度基线红）。
- 2026-09-15（VSC 代码面接线设计轮 · eng-designer · **修正**）：上行「删 140 档 / 22,098 行 · 存活改指 33」按修正轮底账收正为「删 **139 档 / 21,685 行**（含 .md）· 扇入 **34**」——见下修正块。
- 2026-09-15（**修正轮 · 评审 15 条 + 引擎下限裁定落地** · eng-designer）：§2 逐条修正（见下修正块：前置门 / S19 证据表 / S2 收口笔 / 扇入底账 / R24a 逐档行数 / W14 拆壳薄壳 / W5·W6 改指落点 / W8 两段门 / W15 #175 押后 / A-K5·7·8 判据 / `:213` 收正 / prompt-overlays 删口径 / 悬引用订正 / B9 坐标）+ 未决更新（1 清 · 2 补注 · +6 · +7）；
  同批权威档收正（CORE-UNIFICATION 设计/需求 · MEMORY · PROMPT-SYSTEM——各带变更记录行）。
- 2026-09-15（**修正轮续跑** · eng-designer——前次中断后补完）：① 补三节（「S2 收口笔（W17）」〔含表 3〕·「引擎下限裁定落地」·「自检读数」——修正块内引而无节处补齐）；
  ② 残留就地收正：勘察读数 #6（→ **99 档 / 20,250 行** · 合计 **139 档 / 21,685 行**）· #7（→ **34 档** = src/ 33 + 端点 1）· 交付表 A-K 范围（→ A-K1–A-K11）· 本块 4 行折行（仅插换行——去空白逐字节相等）· 表 4 口径注「三处」句改写（V2 机检）· #15 连带核对计数（100 → 99）；三闸复跑读数 = 本块「自检读数」节。
- 2026-09-15（**修正轮-2 · 未决 2 裁定落地——索引面归一 = 并核 sqlite** · eng-designer）：§2 修正（见下修正轮-2 块）：W8 索引面段扩写（`indexer.mjs` 判定 = 删 · 逐档判定 · 重建 UX · 旧目录清退 · 面板收正 · 记忆句柄）+ 上下游 D3 联改（勘察 #3/#6/#7 · W1/W4 改指列 · 总表 W8/合计 · 表 2/4/5 · R24a · A-K12–A-K14 · 未决 2 收口〔计数 7→6〕· W8 测试面 · 方案选型 6/7 · 边界/发现）；
  权威档收正 = `design/MEMORY.md`（§6.9 · §4 第 11 行 · §3.1 A2 · D-MEM14）· `requirements/MEMORY.md`（§4.7）· `design/CORE-UNIFICATION.md`（§2.8）。
- 2026-09-15（**修正轮-3 · #175 推理档位面裁定落地——端侧自有（核内无需位）** · eng-designer）：§2 修正（见下修正轮-3 块）：W15 #175 子项解押 + 写法收正（两半路径〔`autoThink` 键随 config 归一 / 档位 patch 全程端侧〕+ 兜底句 + 需求池关联注）+ 未决 6 收口退场〔计数 6→5〕+ 交付表 #7 联改（D3）；
  权威档收正 = `design/CORE-UNIFICATION.md`（§2.13.4 #175 行 · §2.13.6 缺口 5 缺位 4→3）· `design/AGENT-LOOP.md`（§2.2 #175 行 · §3.2 D2 行 · §9 行数读数——各带变更记录行）。
- 2026-09-15（**修正轮-6（首波档案收口）** · eng-designer）：W8 接线契约补入（§2 W8 段——引擎护栏消费 + 端壳静态链零 `node:sqlite`）；R24a 实测收正（`extension.mjs` 91 → 151〔+60〕· 前置笔测试面补登 · `package.json` +0）；未决 5 / 7 收口退场（计数 5 → 3）+ A-K1 / A-K3 / A-K8 / 交付表联改（D3）；
  镜像措辞现状注（LOGGING 设计/需求档 + VSC 档 F6）· B20 历史形态收正 · 表 3 行 1 范围收正（AGENTS.md）· `ARCHITECTURE.md:117` 参照面登记——全量见下修正轮-6 块。
- 2026-09-15（**修正轮-6 增补（W2 档案并入）** · eng-designer）：R24a 收正（`extension.mjs` 91 → 157〔合计实测 +66 = W8 前置笔 +60 + W2 +6〕· 新建 `src/prompt-injections.mjs` 0 → 65 补登 · 测试面 `prompts-async-guidance` 176 → 326 例外）；
  「不新增 `.mjs`」口径收正（端壳缝不新增档 · 取值表分离新建）+ S 计数 18 → 19（D3 联改：薄壳面清单 / 交付表 #4 / R24a 注）+ A-K8 基线再推进（+6 用例 ⇒ 633/592 · `test:full` 633/633）+ 「activate() 首步」两裁文案统一（注入 = 入口首语句 · 护栏 = 首步守卫）——见下修正轮-6 块增补。
- 2026-09-15（**修正轮-7 · W15 设计前提修正（实施打回落地）** · eng-designer）：W15 重定（零删——装配面 4 档重分类 + 端壳/壳 2 档保留 · 单元目标 = 装配面瘦身 + 核原语改指 + 端壳缝四条落地）；R1–R5 全文落地 + D3 联改（总表 W15/合计 · 勘察 #3/#6/#7 · 薄壳面清单 S 19→25 · `:260` · R24a 三行 + 新增行 · 表 2/4/5 · 发现 4/8 · 未决 3 收口〔3→2〕· 交付表 #2/#4/#7）；
  权威档收正 = `CORE-UNIFICATION.md`（§2.13.6 #6 落点句 · §2.8 `:1043` VSC 半）；核内笔清单上抛（#112 / 核 `END` 参数化 / `depInfo`·C-6）——全量见下修正轮-7 块。

### §2 修正块（评审修正轮 · 2026-09-15 · eng-designer）

**来源** = 本档 §3 轮次 1（15 条：0🔴 / 13🟡 / 2🔵）。**边界** = 文档面修正：`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰（只读核对）· 台账零触碰 · 仓根 `scripts/**` 零触碰 · §3/§4–§6 零触碰 · 档头 L1–L16 零触碰（本块为其下追加）。**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在正文注明）。
  **同批裁定并入**：用户 2026-09-15 引擎下限裁定（值 = `^1.104.0` · 不另实测）——落点 = 正文（W8 / 未决 1 / 边界 / R24a / A-K 族）+ 权威档收正（见本块「引擎下限裁定落地」节）。**三闸复跑读数** = 本块「自检读数」节。

**逐条落点（finding # → 订正/补充）**

1. **前置门登记（:52 订正 +（三）表头「共同前置」新增）** — ① :52 改可核口径：「CLI 半边已全部落完 + §2.6.3（七）① 主计数实读 **CLI 待迁 = 0**（2026-09-15 修正轮复跑）+ 终态证据 = `docs/batches/2026-09-13-CORE-UNIFICATION.md:6682`（U16 段「CLI 侧待迁清零」）+ 用户启动口径 = §1（06:46）」。② :85 表头加「共同前置」行（权威 §2.6.0 门 = 实读已达标；各单元「前置」列只列单元级附加门）。
  **复跑命令**（cwd = 仓根）= 设计档 §2.6.3（七）① 原文 node 内联式——读数 **CLI 待迁 = 0**（与终态证据一致）。

2. **S 档 19 逐档证据（落点 = 本块表 2）** — 判据 = 「保留 = 裁决结果，非差异入桶」：逐档引**对位行「端差处置」取值** + **结构性证据（file:line / 实核）**；核内无同路径对位档者已逐档实核（2026-09-15）。薄壳面清单（:199）「依据」栏就地改指本表。

3. **S2 收口面（判定 = 属本批 ⇒ 落收口笔）** — 权威 §2.8 的 VSC 产物行（`AGENTS.md` ±4 :1047 · `check-vsix.mjs` 新建 + `postpackage` :1055/:1057 · `publish-all.mjs` +8±4 :1058）⇒ 新增 **「S2 收口笔（W17）」**（见本块专节）+ **A-K11 行**（:236 新增——N4 判据时点）。
  范围澄清：边界「不动 `scripts/**`」按发现 1 口径 = **仓根 `scripts/`**；`thincoder-vscode/scripts/**` 的收口面 = W17 笔（review 发现 3 口径）。

4. **「存活改指去重」底账（落点 = 本块表 4）** — 三处计数同批收正为去重 **34 档** = src/ **33** + 端点 `extension.mjs` **1**（:65 / :105 / :209 — 表 4 = 唯一底账）。口径 =「删除集在 `src/**` + 端点 `extension.mjs` 的静态扇入去重（排除同为删除档者）」。**消双列矛盾**：
  :209 原「33 + tools/index + specs/tools barrels 另计」与 :65「（含根档 specs.mjs）」相抵 ⇒ 统一为「表 4 一处列全、不另计」。分组收正（**修正轮-2 取代后现态**）= extension/ **17**（原 20）× agent/ 5 × agent-tools/ 2 × tools/ **5** × 根档 **4**（config-mcp · embed-config · memory-tool · specs）+ 端点 1——`indexer` 移入删除集 · `tools/code` 补入（见表 4 口径注④）。
  复跑 = 2026-09-15 机器扫描（正则解析 `import`/`export ... from` + 动态 `import()`；候选解析 `spec` / `spec+.mjs` / `spec+/index.mjs`）。

5. **R24a 端壳面逐档行数（落点 = 本块表 5）** — 逐档「当前行数 → ±N / 结构」+ >300 行被改档超软线判定（引 CLI 先例 = 设计档 §2.6.2（四）:571「既有超软线档 · 结构未变 · 拆分计划另议——消解条件 = 该档下次实质改动时」）；:214 聚合句（「≈ 6,5xx → 行数不变」）就地收正（扇入 34 档合计 **6,102 行**——逐档读数表 5；W11 五档另计 1,493 行）。

6. **W14 端壳缝接收档（判定 = 保留 `tools/shared.mjs` 为拆壳后薄壳）** — 接收档指名 = `tools/shared.mjs` 本体（write-path 缝供值 `:66-106` getOpenDoc/applyEditorEdit/applyEditorRangeEdit + exec-run 缝供值 `:148` runInterruptible）；与选型 4(a)「`tools/shared.mjs` 拆壳后收 write-path/exec-run 缝」已在案口径一致（补行内指名）。
  同步三处 = 选型表（一致，行内加指名）· 删除集（W14 :173 「13 → **12** 同路径档」；总表 :106 合计 −1 档 / −413 行）· R24a（:212 / :214 / :216 三行）。
  预计增量 = 413 → **约 150±50**（净减——通用面外移）。

7. **W5/W6 跨单元改指（二式取一 = 写死）** — 取式：「**改指在删除单元（W5 / W6）同笔落地、仅计数归 W14/W15**」——新（三）脚注注 1（:108）+ W5 正文（:131）+ W6 正文（:135）三处同口径。消「引用随 W14/W15 改指」的中间态断链（`ERR_MODULE_NOT_FOUND`）与 A-K4 逐单元可达性问题。

8. **W8 前置门（删除集拆两段）** — W8 单元文本重写：**记忆面段**（删 `memory.mjs`；改指 `context-injections` · `memory-tool`——门 1 已清）+ **索引面段**（删 `embedding` / `index-bin` / `index-discover`；改指 `embed-config` · `indexer`——**门 2 = 未决 2，未裁前押后**）；（三）W8 行「前置」列 + 未决 2 补注同批收正（与 :253 原「记忆面接线、索引面保持现状登记」口径闭合）。

9. **W15 #175（D2 状态核对 + 按 #112 同法登记 · 修正轮）** — ① **核对结论：D2 已裁**（2026-09-13 · 按建议——`docs/core/design/AGENT-LOOP.md` §3.2（`:142`）+ 该档变更记录 2026-09-14「§3.2 丁组 D2 裁定状态收正（已裁 · 按建议）」）；
  review「未见收口」系因 CORE-UNIFICATION §2.5.1 索引/变更记录（`:402` / `:1852`）未回声该状态（回声面缺失——见 #15 附加注）。
  ② W15 正文已改：核内位 = 无（§2.13.4 / §2.13.6 缺口 5 缺位之一）⇒ 供值出口无定义 ⇒ 按 #112 同法登记——核对核内已落（**实核：`thincoder-core/**` 无 #175 缝**）⇒ **需核内笔 ⇒ 子项押后 + 上抛**（未决 6）。**D2 不构成前置门**（已裁，非阻塞项）。
10. **A-K8 / A-K7（判据可验性）** — ① A-K8 补四命令基线读数（2026-09-15 修正轮实跑 · 见判据行逐字读数）；② A-K7 加「每单元提交 = 单笔（删除集 + 改指 + 测试面同笔）」可逆性核验形态（`git show --stat <sha>` 逐单元单笔判定 + revert 演练）。
11. **A-K5 入口驱动形态** — 端侧入口径 = `activate()` 直调：假 `vscode` 桩 = `test/vscode-mock/`（既有基建——「verify imports "vscode" → test/vscode-mock」`test/verify-redesign.test.mjs:21` 同源；webview 面 = `test/helpers/webview-env.mjs`；或 integration 沙箱面）；
  W2 落一条端侧入口用例（对照 CLI 先例 = 设计档 §2.6.3 U2 专项补 ⑦），断言 ① 四装配面输出零 `{{inject:` 字面 ② 13 锚 VSC 值逐锚在场。
12. **`:213` 收正 + 补正注对齐** — ① R24a「既有基线」行（现 `:218`）「6 行」→「**5 行**（实判 **1 行** = L260 / 336 chars）」（与发现 2 / 未决 5 及档头注一致）；② 补正注（现 `:291`）扩为与档头注对齐的 **3 项**收正集合（+`VSC-MIGRATION.md` 旧 §9 → `VSC-MIGRATION-INVENTORY.md §9`——V1 指针，正文 `:205` 已收正）；档头 L1–L16 零触碰。
13. **prompt-overlays 删/改择一（取「删」）** — 实况判据：CLI 同档已随 U15 删除（实核：`thincoder-cli/src/prompt-overlays.mjs` 不存在）；VSC `src/prompt-overlays.mjs`（83）本在 W2 删除集（:118）。
  落点：权威 §2.8 `:1037` / `:1038` 两行 → 「**S2 删**」（±6 → −82 / −83；备注同步）；相应模块权威档 `docs/core/design/PROMPT-SYSTEM.md` §1 表与 §5 指针注同批收正（各带变更记录行）；W2 正文补同批收正注。
  **同族 5 行（`:1039`–`:1043`）同题**（CLI advisor.mjs / tools/shared.mjs / agent/setup.mjs 实核均已删）——**已随修正轮-4 择一收正**（CLI 三档 + VSC `advisor/main.mjs` = 「S2 删」· VSC `tools/shared.mjs` = 拆壳薄壳保留——见修正轮-4 块）。
14. **悬引用订正（三处）** — ① （三）通用格式注「复跑与共同验收见（四）」→「见本段「逐单元任务书」节四步块」；② W14「.src 兼容前缀发现见（七）①」→「见「发现」5」；③ W2 残句「已收正则零动作」→「已收正 ⇒ 零动作」。
15. **B9 坐标收正** — `docs/core/design/CORE-UNIFICATION.md` `:35`：`thincoder-vscode/src/agent/async-discard.mjs:57-74` → **`.../agent-tools/async-discard.mjs:57-74`**（实核在册；`:57-74` = `discardRole` 共享核：丢弃判定 / 墓碑 / 出池 / 提醒注入）。
  连带核对：删除集（73 同路径 + M28 − 保留 2 档 = **99 档**——修正轮 #6）内不含 `agent/async-discard.mjs`（该路径不存在）⇒ **删除集无缺**。
  **附加注（报而未改）**：§2.5.1 索引（设计档 `:402`）与设计档变更记录（`:1852` 只回声 D1）未回声 D2「已裁（2026-09-13）」——本轮已核对定论；是否给设计档索引/变更记录补录回声 = **上抛**（D2 实体状态已裁、不阻塞实施）。

**表 2 · 保留 S 档 25 逐档证据（finding 2 落点 · 对位行取值 + file:line 实核 · as-of 2026-09-15；修正轮-2：`indexer.mjs` 改入删除集——移出本表；修正轮-7：S 计数 19 → 25——本表 18 档 + 增补六档〔本表末〕+ `prompt-injections.mjs`〔修正轮-6 面〕）**

> 判据 = 「保留 = 裁决结果，非差异入桶」：逐档引**对位行「端差处置」取值** + **结构性证据（file:line / 实核）**；「核内无同路径对位档」= 2026-09-15 逐档实核（`thincoder-core/**` 对照）。

- **`agent/agent-state.mjs`（111）**：对位 **#154**（`AGENT-LOOP.md` §2.2：融合「token TTL / 会话槽台账按核内结构归位」）；核内无同档（实核）；端侧守卫载体 = `DESIGN-TOKEN-SETTLEMENT.md:96`（`:63` legacy 一次性迁移读）· `ENG-TOKEN-BINDING.md:93`（`:53`/`:58`/`:63` 逐槽 TTL 校验）。
- **`agent/context-injections.mjs`（227）**：对位 **#112**（分叉 ＝ VSC 拆本档——`AGENT-LOOP.md:42`）+ **#150**（头注自述对位 `agent/helpers.mjs:275-348`）；核内无同档（实核）；import 面 = VSC 端侧记忆 / 索引 / 工具面（`embed-config` / `indexer` / `memory.mjs` / `repomap`）——非核内面。
- **`agent/execute-tools.mjs`（363）**：对位 **#149**（`dispatch.mjs` ↔ execute-tools + tool-gates：「融合：两阶段执行 + 前置门禁按核内结构归位」）；核内无同档（实核）；import `../extension/peer-domains.mjs` · `../extension/session-slots.mjs`（VSC 端壳）；含 L3 peer 冲突 / 事件对象 / §29 记账等 VSC 特有编排（W13 行登记）。
- **`agent/run-helpers.mjs`（297）**：对位 **#150** + **#164**（CONTEXT-COMPACTION §2.2：融合「核内单一文本额度纯函数」）；核内无同档（实核；核侧 = `agent/helpers.mjs` 融合面）；多权威档以其为 VSC 侧坐标：`TOOL-OUTPUT-LIMITS.md:108-118` · `TURN-CAP-CONTINUE.md:65` · `PORTABILITY.md:109` · `VERIFY-REDESIGN.md:71`。
- **`agent/tool-gates.mjs`（159）**：对位 **#149** + **#154**；`PORTABILITY.md:107` 直述「门禁载体 = `tool-gates.mjs`（**VSC 装配面**；CLI 对位 = 核 `agent/dispatch.mjs:204`）」；import `../extension/session-slot-write.mjs`（VSC 端壳）+ advisor 面；`:2-6` 自述「自 execute-tools.mjs verbatim 迁出（506>500 归位——零语义）」。
- **`agent-tools/async-discard.mjs`（113）**：对位 **#111**（`run-stages.mjs` 行：「VSC 的 guard 推回 / 蒸馏发射面按核内结构归位」）；核内无同档（实核）；模块头自述「中止清池『只清已死』收尾单点」；对外事件面坐标 = `CORE-UNIFICATION.md:1210`（`:37-43` 提醒模板）。
- **`agent-tools/read-history-discovery.mjs`（118）**：对位 **#89**（单端四档随对——「`read-history-discovery`→#89」）；核内无同档（实核）；import = `../extension/session-io.mjs`（VSC 会话端壳）+ `node:` 内建；头注「Leaf: imported by read-history.mjs only」（另见发现 9 观察项）。
- **`config-mcp.mjs`（71）**：对位 **#130**（CONFIG §2.2：融合「核内单一 DEFAULTS + 三段的端侧消费面按端注入」）；核内无同档（实核）；`MCP.md:142` / `:221`（VSC Settings 面板 MCP 页消费面——「纯 Node，extension host 外可单测」）；import 仅 `config-io`（→ 核）。
- **`embed-config.mjs`（51）**：对位 **#130**；核内无同档（实核）；头注「shared embedding config（used by chat-panel, code tools, memory tools）」；import `./embedding.mjs`（W8 面）。
- **`memory-tool.mjs`（386）**：对位 **#134**（融合「核内单一 memory 工具面（动作集/schema/文案取一侧）」）；核内无同档（实核）；头注「the merged `memory` agent tool……core storage/search stays in memory.mjs」——W8 后改指核 memory 面（工具面形态保留端壳）。
- **`repomap.mjs`（303）**：对位 = TOOLS §2.3 映射表（「CLI `tools/repomap.mjs` ↔ VSC `repomap.mjs`（同一 repo 大纲；VSC 头注自述 Ported from …）⇒ 融合」）；import `vscode`（宿主面）；薄壳清单注 = workspace.fs 数据源——端侧数据源面（融合指解析语义；宿主访问留端）。
- **`specs.mjs`（5）**：对位 **#143** + **#176**（PROVIDER §2.2 / AGENT-LOOP §2.2：`model-specs` ↔ VSC `config.mjs`（规格段）+ `specs.mjs`）；5 行 re-export（头注「Self-contained copy」）→ W16 改指核 `model-specs` / `config` 面（薄适配面——非实现双份）。
- **`tools.mjs`（5）**：无对位行（barrel 转口——`export * from "./tools/index.mjs"`）；消费方在端壳；非实现面（F9 口径内）。
- **`tools/index.mjs`（76）**：对位 **#83**（登记册）+ 勘察 5；同路径 ≠ 同内容（B1 分叉面实证——含宿主工具 context/focus/shell/code + 自持 builtinTools）；W14 装配面保留。
- **`tools/shell.mjs`（317）**：对位 **#53**（TOOLS §2.2：「VSC 独有 visible/inject 两模式 `src/tools/shell.mjs:183,191,202`」——前提「宿主终端只在 VSC」成立）；import `vscode`（宿主终端）+ `./shared.mjs` + `./checkpoint.mjs`（W5/W14 改指面）。
- **`tools/code.mjs`（165）**：对位 = MEMORY §2.3 映射（「`tools/code.mjs` ↔ CLI `memory/docs.mjs` 的 `codeSearchTool`/`docSearchTool` ⇒ 随 #82」）；import `vscode` + `../embed-config` + `../indexer` + `../agent/run-helpers`——向量检索面（旧文件制驱动——**修正轮-2：已裁归一、改指核 `codeSearch`/`docSearch`**）。
- **`tools/context.mjs`（139）** · **`tools/focus.mjs`（51）**：④ 端特有桶（覆盖对账 `:369`/`:373`——「对位 10 + ④ 2 档（context / focus）」）；import `vscode`（宿主 IDE 面）——结构性不对称（依赖壳能力——A9 第 1 条）。

**增补（修正轮-7 · W15 重定 6 档——判据 = 「同路径 ≠ 同内容」）**：
`src/agent.mjs`（460——签名异〔`runAgent(provider, cwd, input, callbacks, signal, autoApprove, opts)` `:56` vs 核 `runAgent(agent, input, callbacks, opts)` 核 `agent.mjs:96`〕· 载体 10 字段访问器别名 `:137-150` · live autoApprove getter `:64` · `opts.agent` 单例复用）·
`agent/setup.mjs`（668——导出面异：`buildTopLevelAgent`/`hydrateRun`/`setupAgentRun`/`vscSubagentFace`/`modeRoleField` 核无对应物）·
`agent/run-stages.mjs`（382——函数面异）· `agent/setup-reminders.mjs`（252——端特有四名）· `src/explore-distill.mjs`（157——核 re-export 签名异〔W6 已登记〕）· `src/i18n.mjs`（56——`t()` 壳〔I18N D1〕）；逐档分叉实核 = §5 W15 段「一、删除集前提失效（F1）」档级对照表；`prompt-injections.mjs`（W2 面）证据 = 修正轮-6 增补（R24a 行）。

**表 4 · 删除集扇入底账（finding 4 落点 · 机器扫描 2026-09-15 · cwd = `thincoder-vscode`）**

> 口径 = 删除集（**94** .mjs 档——修正轮-7：W15 六档移出）在 `src/**` + 端点 `extension.mjs` 的静态 import / `export … from` / `import(...)` 扇入去重（排除同为删除档者）；数值 = 该档当前行数（`wc -l`）〔并入单元〕。**共 32 档 = src/ 31 + 端点 1**——与 :65 / :105 / :214 同源（本表 = 唯一底账；修正轮-2 组成更新——总数不变；修正轮-7 总数 34 → 32——见口径注⑤）。

- **extension/（15）**：`chat-panel` 422〔W7·W16〕· `config-watch` 77〔W16〕· `image-handler` 86〔W16〕· `ledger-surface` 111〔W4〕· `migrate-settings` 27〔W16〕· `panel-callbacks` 209〔W1·W16〕· `panel-chat` 496〔W1·W16〕
- （extension/ 续）：`panel-index` 191〔W8·W16〕· `panel-mcp` 68〔W7〕· `panel-messages` 498〔W7·W12·W13·W16〕· `presets` 85〔W16〕· `provider-flows` 220〔W10·W16〕· `settings-panel-write` 153〔W10·W16〕· `settings` 348〔W7·W10·W16〕· `suspension` 362〔W1·W12·W13〕
- **agent/（5）**：`agent-state` 111〔W12·W16〕· `context-injections` 227〔W8·W14〕· `execute-tools` 363〔W1·W12〕· `run-helpers` 297〔W4·W16〕· `tool-gates` 159〔W4·W12〕
- **agent-tools/（2）**：`async-discard` 113〔W1·W13〕· `index` 16〔W9·W12·W13〕
- **tools/（5）**：`code` 165〔W8〕· `context` 139〔W14〕· `focus` 51〔W14〕· `index` 76〔W14〕· `shell` 317〔W5·W14〕
- **根档（4）**：`config-mcp` 71〔W16〕· `embed-config` 51〔W8〕· `memory-tool` 386〔W8〕· `specs` 5〔W16〕
- **端点（1）**：`extension.mjs` **157**〔W7〕
- 口径注：① 与 :65 / :105 / :214 三处计数同源（原 33 的分组口径〔extension 20 / tools 5 / 根档仅 specs〕经复跑证伪——以本表为准）；② 「改核心面」类（W11 五档 / W14 `tools/shared.mjs` / W6 三档 / **W15 六档**〔修正轮-7〕——非删除集扇入）另列（R24a 行）；③ `panel-project`（原 prose 未列）与 `extension.mjs` 为本轮机器扫描补入（**修正轮-7：`panel-project` 移出——见⑤**）；
  ④ **修正轮-2**：`indexer` 移出〔入删除集 W8〕· `tools/code` 165〔W8〕补入 · `panel-index` 补 W8 边——总数不变；⑤ **修正轮-7**：W15 重定零删 ⇒ 「W15」边全面退场——`notify`（唯一入边 = `i18n.mjs`）· `panel-project`（唯一入边 = `i18n.mjs`）移出本表；
  `chat-panel`/`image-handler`/`panel-chat`/`panel-messages`/`context-injections`/`extension.mjs` 各档表列已去「W15」项（余边保留）；总数 34 → **32**（src 31 + 端点 1）；`extension.mjs` 行数 91 → **157**（修正轮-6 实测同步——表 5 同批）。

**表 5 · 端壳改动面逐档行数 → 预计增量 · 超软线判定（finding 5 落点 · as-of 2026-09-15 `wc -l` 实核）**

- **删除集扇入 32 档**（逐档当前行数 = 表 4——修正轮-7：34 → 32）：预计 = **±0（import 行替换 · 结构未变）**；例外 **8 档**——
  ① `extension.mjs` **157**（修正轮-6 实测——原 91）：W8 前置笔 +60 / W2 入口注入 +6 已落 + 改指 1 处（mcp 边——W7）；W15 面零动作（i18n 壳保留——修正轮-7）；② `extension/panel-mcp.mjs` 68 → **约 130±30**（`mcp/index.mjs` 注册表段〔`:84` 起〕+ 面板状态接口〔`:399-418`〕迁入——W7）；
  ③ `extension/settings-panel-write.mjs` 153 → **+10±10**（`$schema` 供值——W11/W16 缝）；④ `extension/suspension.mjs` 362 → **+0~8**（io.ask / onToken / 载体缝适配）；⑤ `tools/code.mjs` 165 → **约 90±30**（核检索替换 + 宿主 regex 回退退役——修正轮-2 补）；
  ⑥ `extension/panel-index.mjs` 191 → **约 200±35**（核面读数/触发/相位 + 清退告示——修正轮-2 补）；⑦ `memory-tool.mjs` 386 → **约 320±80**（存储/检索换核面——工具面保留、净减；修正轮-2 补）；⑧ `agent/context-injections.mjs` 227 → **±0~+20**（召回块换源——修正轮-2 补）。（原 ⑤ `indexer.mjs` 456 随裁定入删除集——移出本表。）
- **改核心面类（非删除集扇入）**：W11 五档 `session-io 436` / `session-slots 399` / `session-slot-write 178` / `session-gc 142` / `panel-session 338`：改指 + 缝适配 ⇒ **+0~+40/档**（真增行点 = 适配面；实施读数落 §5）；
  W14 `tools/shared.mjs` **413 → 约 150±50**（拆壳净减）；W6 三档（`history-window` **175** / `generate-title` **87** / `turn-model` **27**——≤300 · 结构未变）改指 ⇒ **±0**。
  **W15 六档**（`src/agent.mjs` **460** · `agent/{setup 668, run-stages 382, setup-reminders 252}.mjs` · `src/explore-distill.mjs` **157** · `src/i18n.mjs` **56**——修正轮-7）：装配面瘦身 + 核原语改指 + 端壳缝四条落地 ⇒ **净减方向**（逐档读数落 §5）。
- **超软线判定（>300 行被改档 · 承设计档 §2.6.2（四）:571 先例）**：

| 档（行数） | 判定 |
|---|---|
| `chat-panel` 422 · `panel-chat` 496 · `panel-messages` 498 · `suspension` 362 · `execute-tools` 363 · `memory-tool` 386 · `settings` 348 · `shell` 317 | **既有超软线档 · 结构未变**（改指 / 行内替换为主）⇒ **拆分计划另议**（消解条件 = 该档下次实质改动时；修正轮-2：`indexer` 入删除集——移出本表） |
| `session-io` 436 · `session-slots` 399 · `panel-session` 338 | 既有超软线档 · 改指 + 适配（结构未变）⇒ 拆分计划另议（同前） |
| `tools/shared.mjs` 413 | 拆壳后 **约 150**（收口到线下）⇒ 拆壳即消解 |
| W15 保留六档：`agent.mjs` 460 · `agent/setup.mjs` **668（>500 硬限）** · `agent/run-stages.mjs` 382 | 重定保留档（修正轮-7）——本单元装配面瘦身；`setup.mjs` 目标落 500 内（未落 ⇒ 拆分计划另议——消解条件 = 该档下次实质改动时；承本表先例） |

**「S2 收口笔（W17）」专节（finding 3 落点 · 修正轮）**

> 判定 = 权威 §2.8 的 VSC 产物面归本批 ⇒ **落收口笔**（review 发现 3 取「落一条收口笔」项）；A-K11 行（验收判据）同批新增。回指 = `docs/core/design/CORE-UNIFICATION.md` §2.8（`:1047` / `:1055` / `:1057` / `:1058`——as-of）。

**表 3 · S2 收口笔（W17）范围与增量（finding 3 落点 · 实核 as-of 2026-09-15）**

| # | 档面 | 动作 | 当前 → 预计 | 权威回指（as-of） |
|---|---|---|---|---|
| 1 | `thincoder-vscode/AGENTS.md` | 约定段改述（「产品内双源」→「核内落地 + 仓根中文设计档」）＋ **文件地图段收正**（迁核后坐标逐行——删除集档行 / 改指档行；实核 ≈ **15 行**档行受影响——例 `src/log.mjs`〔`:51`〕）＋ **「零 npm 运行期依赖」句按核化改述**（`:11` HC 句——第三方仍为零 + 自家核依赖 `@thincoder/core` 一条在册〔B7 口径〕；同族 `:5` / `:7` 句随行核对）〔修正轮-6：W1 上抛 2 落点〕 | **125** → ±4（约定段）＋ 文件地图 ≈15 行档行＋ 1 句改述（合计约 **+4±10**——W17 落地实核） | §2.8「产品文档（S2 改）」`:1047` |
| 2 | `thincoder-vscode/scripts/check-vsix.mjs` | 新建（解 vsix **断言 B + D** = 含核 + 版本逐字相等 + 提示词面完备性〔`prompts/` 15 + `tool-docs/` 25 档名集合逐字相等——T-C7 vsix 域〕；零构建 · 只读） | **0**（新建）→ +50±15 | §2.8「含核断言（S2 新建）」`:1057` |
| 3 | `thincoder-vscode/package.json` | `postpackage` 挂点（调 `check-vsix.mjs`）+ 真依赖面 + devDeps（`yauzl`） | **134** → +8±3 | §2.8「真依赖面（S2 改）」`:1055` |
| 4 | `thincoder-vscode/scripts/publish-all.mjs` | 新增段 0（核版本存在性预检）+ 段 1.5（调 `check-vsix.mjs`）；段 1 / 段 2 与 PAT 预检原样 | **105** → +8±4 | §2.8「发布编排面（S2 改）」`:1058` |

- **N4 / N5 的 VSC 判据** = vsix 内嵌核 + 提示词面完备 = **解包断言**（断言 B + D）——机判 = `postpackage` 解包断言 B + D exit 0。
- **形态 = 收口笔**：独立单笔（单笔提交 · 独立回退 `git revert`）；承 **U0 前置笔**形态（设计档 §2.13.8（七）：独立成笔 · 不占单元号）——W17 **不占单元号** ⇒ 与「16 单元」计数口径自洽（不入 16 单元分母）。
- **时点** = S2 收口（全单元与前置笔落毕后——发布编排面收口）。
- **验收 = A-K11**：`postpackage` 解包断言 **B + D** exit 0 + 发布编排 dry 面。
- **边界**：本笔面 = `thincoder-vscode/**`（表 3 所列 4 档）；仓根 `scripts/**` 仍零触碰（范围澄清同本块 #3）；核包 / CLI 零触碰。
- **R24a 对位**：`package.json` 同档——R24a「VSC 端点」行记 **134**（下限值变更 +0 净行实测——修正轮-6 收正；W2/W8 增量面另计）；W17 增量（+8±3）以表 3 为账——两笔分列、不双计。

> 行数 = 实核 `wc -l`（as-of 2026-09-15）；`package.json` 现行 **134**（权威 §2.8 行 as-of **131**——实施轮同步）。

**「引擎下限裁定落地」节（修正轮 · 同批裁定并入）**

**裁定**（用户 2026-09-15）：`engines.vscode` 下限 `^1.85.0` → **`^1.104.0`**（贴最低线案）；**不另做真机实测**（资料推导链已查尽；运行期核验 = `activate()` 护栏：不满足 ⇒ showErrorMessage 停用记忆面、不崩）；落点 = **W8 前置笔**（独立单笔 · 承 U0 前置笔形态 · 不占单元号）。

**（a）批次档正文落点枚举 5 条**（as-of）：

| # | 落点 | 位置 | 收正面 |
|---|---|---|---|
| 1 | （三）W8 行「前置」列 + W8 门 1 | `:98` / `:147` | 「门 1 = 引擎下限（已裁 · 落 W8 前置笔）」+ 值 / 不实测 / `activate()` 护栏 / 落点全句 |
| 2 | 未决 1（本项清） | `:271`–`:272` | 裁定全文 + 权威收正指针 |
| 3 | 边界行 | `:250` | 已裁 + 时点 = W8 前置笔 + 不引入降级路径（A13） |
| 4 | R24a「VSC 端点」行（`package.json`） | `:224` | `^1.85.0` → `^1.104.0`（**+0 净行**——修正轮-6 实测收正）· 处置列 = 「W8 前置笔」 |
| 5 | A-K 族（逐行核对） | `:234`–`:244` | 无引擎面单列行——机判归属 = W8 前置笔（`engines.vscode` 值 + `activate()` 护栏）；A-K11 = `package.json` 同档面（`postpackage` 挂点），与下限行两笔分列 |

**（b）权威档收正（5 档——逐档收正面 · 各带变更记录行）**：

| # | 档 | 收正面（as-of 行） |
|---|---|---|
| 1 | `docs/core/design/CORE-UNIFICATION.md` | §2.1 B20 括注 `:46` · §2.6 S0b 行 `:409` · §2.8「版本下限面」行 `:1052`（同段另两行 = 提示词加载面——finding 13 同轮） · §2.10 N7 `:1174` · §2.11 A8 `:1191` · §2.12.3 第 1 行 `:1237`；变更记录 `:1925` |
| 2 | `docs/core/design/MEMORY.md` | §3.1 A3 `:57` · §4.1 第 1 行 `:69`；变更记录 `:367` |
| 3 | `docs/core/requirements/CORE-UNIFICATION.md` | §1.2 `:88` · N7 `:120`；变更记录 `:198` |
| 4 | `docs/core/requirements/MEMORY.md` | §2.1 `:25`；变更记录 `:173` |
| 5 | `docs/core/design/PROMPT-SYSTEM.md` | §1 表 `:17` · §5 指针注 `:145`；变更记录 `:221`（finding 13 同轮面——非引擎面，随批登记） |

**状态**：未决 1 = 本项清 ✓——正文 5 条 + 权威 5 档全部在案（见上两表）。

**「自检读数」节（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮 · eng-designer）**

命令与读数（原样）：

- ① `node scripts/check-doc-width.mjs` → `✗ …/docs/core/design/PROVIDER.md: 1 行 >300 字符`（`:260` / 336 chars）→ `FAIL(宽度): 1 文件 / 1 行超 300 字符`（exit 1——**已知存量**所致；本档 = 0）· `一致性 V1/V2/V3：新增违规 0 条 · 存量（基线内）0 条。`
- ② `node scripts/doc-anchors.mjs --domain .`（exit 0）：
  `V5 文档锚一致性：扫描域 docs/design + docs/requirements + docs/core/design + docs/core/requirements + docs/cli/design + docs/cli/requirements + docs/vsc/design + docs/vsc/requirements · 125 档`
  `V5 汇总：候选 8036 · 悬空 0 · 注记豁免 389` · `OK(V5): 0 条悬空锚（闸态——阈值 0）`
  （子行 = 用例号 191/0/17 · 路径/坐标 4459/0/264 · 符号·窄 22/0/0 · 符号·宽 3364/383/108〔报告面——不入闸〕）
- ③ `node scripts/check-ledger.mjs` → `OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规（阻断——修掉）· 基线 0 条（本基线必须保持为空）。`（exit 0）
- **V1/V2/V3 一致性**：新增违规 **0** 条 · 存量 0（复跑——本档自文本首跑 2 类已就地收正：4 行宽超〔折行〕+ V2 1 条〔表 4 口径注「三处」句〕；记录 = 变更记录续跑行）。

> **已知存量（非本批 · 勿误报）**：宽度 = `PROVIDER.md` 1 行（上①——未决 5）；锚域二（CLI 树）存量 1 条 · VSC 域 `doc:check` V5 命中 21 处 / distinct 13（前批已登记——非本批写域）。

### §2 修正轮-2 块（未决 2 裁定落地 · W8 索引面段扩写 · 2026-09-15 · eng-designer）

**来源** = 本档 §1 :38（用户 2026-09-15 13:05 裁定：**索引面归一 = 并核 sqlite** · **数据面放弃**——零迁移/零兼容 · 不写导入器 · 重新索引 = 正当路径）。
**边界** = 文档面修正：`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰（只读核对）· 台账与仓根 `scripts/**` 零触碰 · 档头 L1–L16 / §1 / §3–§6 零触碰（本块为其下追加）。
**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在正文注明）。

**一、W8 索引面段扩写（正文重写 · 原「两段门」退役）**

- **单元结构判定 = 并回**（单一单元 W8 · 单笔提交）：① 拆分动因 = 门 2（调度门）——裁定后消失；② 两面共享改指档（`context-injections` / `memory-tool` 同吃两面改指——分笔产生半迁移中间态）；③ 单元计数体系（16 单元 · W17 不占号）零扰动；④ 模块权威档 `MEMORY.md` §6.9 单次收正。先例 = CLI U8「记忆库 + 索引 + 嵌入」单单元（设计档 §2.6.3（二））。
- **`indexer.mjs`（456）判定 = 删**（对比 = 下「三」）；逐档判定（import 实况核）= `tools/code.mjs` 改指 · `memory-tool.mjs` 改指 · `agent/context-injections.mjs` 改指 · `repomap.mjs` 留（import 面零索引族——`repomap.mjs:9-10` 仅 `vscode` + `node:path`）· `extension/panel-index.mjs` 改指。
- 重建 UX / 旧目录清退 / 面板收正 / 记忆句柄 = 正文 W8 段（本块不重述——D2）；清退形态判定 = **告示 + 显式清理动作**（不静默删除——派生缓存不构成静默动用户仓内目录的授权；零自动删除路径；时点 = 升级后首次激活）。
- **计数联改（D3）**：W8 删 4/591 → **5/1,047**；存活改指 4 → **5**；删除集 99/20,250 → **100/20,706**；合计 139/21,685 → **140/22,141**；扇入 34（组成：extension 17 · agent 5 · agent-tools 2 · tools 5 · 根档 4 + 端点 1——总数不变）；W1/W4 改指列各 −1（`indexer` 移出）；表 2/4/5 · R24a · 总表 · 合计同批；保留 S 面 19 → **18**。

**二、未决面**：2 收口**退场**（计数 7→6——退场口径 = 收口项自列表退场、编号不重排；#1 留档承前轮先例）；3/6 等不动。

**三、方案选型（方向单方案声明 + 驱动形态对比）**：归一方向由用户裁定 ⇒ **单方案（显式声明）**；驱动替换形态 2 候选（正文（二）新增候选 6/7）：**(a) 整组删旧 = 选定**（核面覆盖全 + 零重复面 + 单笔可回退）/ **(b) 薄适配壳 = 否决**（壳无功能增量 + 双源残留 + 消费签名仍需改写）。

**四、权威档收正（3 档 · 各带变更记录行）**：`docs/core/design/MEMORY.md`（§6.9 收口注 · §4 第 11 行 · §3.1 A2 边界注 · §7 D-MEM14 · 变更记录）· `docs/core/requirements/MEMORY.md`（§4.7 收口注 + F-M5/F-M6 + 端差行 · 变更记录）· `docs/core/design/CORE-UNIFICATION.md`（§2.8「记忆面」行 · 变更记录）。（`STRUCTURE-DEBT.md` 复核 = 索引族零命中——零动作。）

**五、发现（本轮）**：记忆句柄装配点未在案（`createMemory` 落点——VSC 端零点名）⇒ 补入正文 W8（随端壳装配面创建持有）+ 发现 10；若父侧认定应独立成项（装配契约），可移。

**自检读数（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮-2）**：

- ① `node scripts/check-doc-width.mjs` → 本批收正档首跑 5 行宽超（自造）已就地折行收正；复跑 = 仅 `docs/core/design/PROVIDER.md:260`（336 chars）1 行——**已知存量**（未决 5 · 非本批）。`一致性 V1/V2/V3：新增违规 0 条 · 存量（基线内）0 条。`
- ② `node scripts/doc-anchors.mjs --domain .`（exit 0）→ `V5 汇总：候选 8046 · 悬空 0 · 注记豁免 395`；`OK(V5): 0 条悬空锚（闸态——阈值 0）`（符号·宽 385 = 报告面不入闸）。
- ③ `node scripts/check-ledger.mjs` → `OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规 · 基线 0 条`（exit 0）。

### §2 修正轮-3 块（#175 推理档位面裁定落地 · 未决 6 收口 · 2026-09-15 · eng-designer）

**来源** = 父侧派单（用户 2026-09-15 13:19「可以」裁定 · 裁 ②：**#175 推理档位面 = 端侧自有（核内无需位）**——核内「位 = 无」为正常落地形态、非缺位）。
**边界** = 文档面修正：`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰（只读核对）· 台账与仓根 `scripts/**` 零触碰 · 档头 L1–L16 / §1 / §3–§6 零触碰（本块为其下追加）。
**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在正文注明）。

**一、W15 #175 子项解押 + 写法收正（正文）**

- 原「需核内笔（补位）＝超本批写域 ⇒ 该子项押后 + 上抛（见未决 6）」判定退场；改按裁定两半路径 =（a）`autoThink` 键随 config 归一（VSC 死键复活；默认 `false` ⇒ 无行为变化）（b）档位 patch 全程端侧（经 provider 字段数据面）。
- 兜底句：实施期实核发现核内确需新缝 ⇒ 停下上抛（不自行改核）。
- 关联注：VSC 面板 Auto 入口 = 需求池条目（`docs/TODO.md` 需求池「VSC 端暴露 Auto（`autoThink`）推理档位开关」——另批，不属本批）。

**二、未决面**：6（#175 推理档位面核内位）收口**退场**（计数 6→5——退场口径 = 收口项自列表退场、编号不重排，承修正轮-2 先例；#1 留档形态承前轮先例不动）；交付表 #7 计数与枚举联改（D3）。

**三、实核证据（本设计轮自核 2026-09-15 · 写入收正据）**

- CLI 同构先例：`thincoder-cli/src/tui/cmd-think.mjs:52`（`/think` picker Auto 项）· 同档 `:95`（`cfg.autoThink = !cfg.autoThink` 切换）；持久化 = `thincoder-cli/src/tui/config-helpers.mjs:24`（`syncProviderField`）——UI 与持久化全程端侧（**核内无同名 helper**——实核 0 命中）。
- VSC 面：`thincoder-vscode/src/extension/reasoning-mode.mjs`（档位 patch 纯函数 · 34 行）→ `thincoder-vscode/src/extension/panel-chat.mjs:232`（合入 provider 配置对象）。
- 数据面契约：`thincoder-core/provider/core.mjs:52-53`（`createProvider` 读 `thinking` / `reasoningEffort`）→ 同档 `:193-204`（落请求 body + 枚举钳制）。
- 核内既有面：`thincoder-core/auto-think.mjs`（自动难度分级机制——S1 已落）；核内无 #175 缝 = 正常形态（无需新缝）。

**四、权威档收正（2 档 · 各带变更记录行）**

- `docs/core/design/CORE-UNIFICATION.md`：§2.13.4 #175 行（处置列 = 「端侧自有 · 经 provider 字段数据面」+ 锚；原「端侧选择面按端注入」表述退场）· §2.13.6 缺口 5（**缺位 4 → 3**——#175 移出、枚举同改；#112 / #143 / #172 保持）· 变更记录。
- `docs/core/design/AGENT-LOOP.md`：§2.2 #175 行（端差处置收正）· §3.2 D2 行（建议归一形态收正；「已裁（2026-09-13）· 按建议」状态不变）· §9 行数读数（491 → 493）· 变更记录。

**五、发现（本轮 · 逐条）**

1. **#143 疑同类（上报——不自行改）**：缺口 5 其余三项实核——#143（模型规格端侧派生面）与 #175 同型措辞（`PROVIDER.md` 行：「端侧派生面按端注入」）；
   实核：派生面 = VSC 面板消费（`thincoder-vscode/src/extension/settings.mjs:321` `effortDefault: spec.reasoningEffortDefault`）· 数据源 = 规格表（核 `model-specs.mjs` 已落）；端差字段 `reasoningEffortDefault`（CLI 无——`thincoder-vscode/src/config.mjs:104`）落侧未定 ⇒ **疑同构、证据未足**——是否同案处理交父侧评估。
   **结局（修正轮-5 · 2026-09-15）**：已裁 = **同案处理（端侧自有 · 非缺位计）**——用户 2026-09-15 15:12 裁定；落侧实核完成 ⇒ 证据已足——实核读数与收正落点见本段修正轮-5 块。
2. **#172 / #112 非同构（已核）**：#172 = 核内硬编码判别规则待移出（`thincoder-core/peer-instances.mjs:140-143` `classifyEnd`——「判别规则不入核」= 核内笔确需）；#112 = `read_image` 门定稿含核内两处变更（装配面恒含 + run 期重解）⇒ 二者缺位计保持，不动。
3. **§2.13.4 定义口径（观察——未动）**：表头注「缺位行 = S2 需补的位」与「核内位 = 无」的字面组合仍可反推出 #175——本裁定以 §2.13.6 行的显式移出注为准；如需给表头注加「端侧自有类不计缺位」子句，另派。
   **结局（修正轮-5 · 2026-09-15）**：子句已补（⑤ 落地——见本段修正轮-5 块）。

**自检读数（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮-3）**：

- ① `node scripts/check-doc-width.mjs` → 仅 `docs/core/design/PROVIDER.md:260`（336 chars）1 行——**已知存量**（未决 5 · 非本批，未动）；本批收正三档（本档 / CORE-UNIFICATION / AGENT-LOOP）**0 行宽超**；`一致性 V1/V2/V3：新增违规 0 条 · 存量（基线内）0 条。`
- ② `node scripts/doc-anchors.mjs --domain .`（exit 0）→ `V5 汇总：候选 8051 · 悬空 0 · 注记豁免 394`；`OK(V5): 0 条悬空锚（闸态——阈值 0）`。
- ③ `node scripts/check-ledger.mjs` → `OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规 · 基线 0 条`（exit 0）。

### §2 修正轮-4 块（评审轮次 2 发现落地 · 2026-09-15 · eng-designer）

**来源** = 本档 §3 轮次 2 发现表（0🔴 / 7🟡 / 4🔵 · **pass**）；父侧裁决 = 除 #8（协调项——留档不修）外全部按建议落地。
**边界** = 文档面修正：`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰（#5 / #10 只读核对）· 台账与仓根 `scripts/**` 零触碰 · 档头 L1–L16 / §1 / §3–§6 零触碰（本块为其下追加）。
**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在正文注明）。

**逐条落点（finding # → 订正/补充）**

1. **#1（🟡）· （三）总表 W14 行收正** — `:109`「20/4,018」→ **19/3,605**（= 12 同路径 + 7 M 逐档行数合计〔W14 正文〕；承拆壳薄壳保留口径——`tools/shared.mjs` 413 移出）。
   **复核**：逐行相加 = **140 档 / 22,141 行** = 合计行（`:112`）✓——档数 1+41+1+4+3+1+6+5+13+8+0+20+6+19+6+6 = 140 · 行数逐格相加 = 22,141。
2. **#2（🔵）· 修正轮-2 残点就地收正** — ① R24a 脚注「19 S 档」→ **18**；② 修正块 #5「6,393 行」→ **6,102 行**（表 4 逐档相加实核）；③ 修正块 #4 分组 → **tools/5 · 根档/4**（`indexer` 移入删除集 · `tools/code` 补入——修正轮-2 取代后现态）；④ 交付表 #2 → 「158 档全分类（**73 同路径 + 85 非同路径**）」。
3. **#3（🟡）· §2.8 同族 5 行逐行择一收正 + 模块权威档同步** — `docs/core/design/CORE-UNIFICATION.md` `:1039`–`:1043`：CLI `advisor.mjs` / `tools/shared.mjs` / `agent/setup.mjs` 与 VSC `advisor/main.mjs` = **「S2 删」**（CLI 实核：档不存在 · VSC 随 W12 / W15 删除集）；
   VSC `tools/shared.mjs` = **「S2 改——拆壳薄壳保留」**（与 W14 口径一致 · 413 → 约 150±50）。`docs/core/design/PROMPT-SYSTEM.md` §5 指针注同批同步；本档发现 8 与修正块 #13 尾注同批收正（不再「报而未改」）。
4. **#4（🟡）· §4.4 归一退场注 + 对外可见面补登记** — `docs/core/requirements/MEMORY.md` §4.4：F6–F9 逐行加「随归一退场」标 + 章头裁定收口注 + 判定句退场注（核面承接 = `docs/core/design/MEMORY.md` §6.9 / D-MEM14）。
   判定 = 属对外可见面变更 ⇒ `docs/core/design/CORE-UNIFICATION.md` §2.12.2 第 11 行补登记（含 VSC 索引可见面：状态面 / 重建入口 / 进度文案键 `status.indexEmbed` → `status.indexProgress`）；两档变更记录同批。
5. **#5（🟡）· A2 导入器落点声明（只读实核——未落）** — `thincoder-cli/src/cli/memory-command.mjs` 子命令实读 = `list` / `search` / `put` / `remove`（usage 行逐字在场）——无 `memory import`；CLI 树 `memory*.mjs` 枚举无导入器档。
   ⇒ 权威 §2.8「记忆面导入器（S2 新建）」面未落 ⇒ 入「发现」11 + 上抛（时序 ≤ W8 落地版本发布前；本批零写入）。
6. **#6（🟡）· 行数注补登** — ① W6 三档补当前行数 **175 / 87 / 27**（`wc -l` 实核——均 ≤300 · 结构未变；W6 正文与表 5 同批）；② R24a 新增「W8 收正面」行（`webview/status-bar.js` **101** · `locales/{en,zh}.json` **259 / 259**）；③ R24a「VSC 端点」行 `extension.mjs` 增量分列 = W2 入口注入 +0~2 行 / W8 前置笔 `activate()` 护栏另计 +10±5 行。
7. **#7（🟡）· W17 断言面含 D 明确化 + 权威两处口径统一** — 表 3 行 2 / 表 3 尾注 / A-K11 明确断言面 = **B + D**（含核 + 版本逐字相等 + 提示词面完备性〔`prompts/` 15 + `tool-docs/` 25 档名集合逐字相等〕——T-C7 vsix 域）；`docs/core/design/CORE-UNIFICATION.md` §2.2 形态树 ↔ §2.8 `:1057` 同批统一。
8. **#8（🟡）· 不修（父侧裁决）** — 协调项（既有红口径 / #143 疑同类）留档形态保持（未决 7 与修正轮-3 发现上抛面不动）。
9. **#9（🔵）· A-K12 判据限定** — 「FTS 回退非空」→ 限定**非空 query**；空 query 短路返回空文案（核口径 = `docs/core/design/MEMORY.md` :139 / :143）。
10. **#10（🔵）· `thincoder-vscode/scripts/**` 对 `src/**` 引用面实核（只读）** — 3 档实读 = **零模块引用**（`check-syntax.mjs` 仅目录名列举〔`:6` 注释 + `:20` `DIRS` 常量〕· `reconcile-lookup.mjs` 引仓根 `scripts/doc-anchors.mjs` · `publish-all.mjs` 零命中）⇒ 记读数入 A-K4（扫描域维持不扩——承 CLI 先例同口径）。
11. **#11（🔵）· W2 摘要值收正** — `:127`「五值」→「**四值收正 + 一值原样**（`-async-note`——CLI 仓设计档 §11.2，两端相同）」（承 §2.13.2 收正注）。

**权威档收正（3 档 · 各带变更记录行）**：`docs/core/design/CORE-UNIFICATION.md`（§2.8 五行 · §2.2 ↔ §2.8 断言面 · §2.12.2 第 11 行）· `docs/core/design/PROMPT-SYSTEM.md`（§5 指针注）· `docs/core/requirements/MEMORY.md`（§4.4）。

**发现（本轮 · 逐条）**

1. **§3 残点（评审段 · 本侧零触碰——交父侧机械处置）**：三闸复跑暴露 §3 自文本 3 项——① 宽度：§3「轮次 1 十五条复核」段 1 行长散文（627 chars）>300；
   ② V1：同段对 CLI 仓 `AGENT-LOOP.md` 的 §11.2 引用（本域不可解 ⇒ no-section）；③ V2：同段「残遗」句计数声明 4 与随附枚举 2 不符。承父侧折行先例（§2 曾由父侧机械折行）——本侧未动 §3 一字。
2. **观察（未动）**：勘察 #2 括注「（extension/ 40 + 其余 45→实 47）」两读法不自洽（40 + 47 = 87 ≠ 非同路径 85）——四残点修复范围之外，登记待处置。

**自检读数（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮-4）**：

- ① `node scripts/check-doc-width.mjs` → 本批收正档（本档 §2 / CORE-UNIFICATION / PROMPT-SYSTEM / requirements-MEMORY）**0 行宽超**；复跑读数 = **2 文件 / 2 行**——本档 §3 残点 1 行（627 chars）+ `PROVIDER.md` 1 行（已知存量——未决 5）；`一致性 V1/V2/V3：新增违规 2 条`——皆 §3 残点（V1 / V2）。
- ② `node scripts/doc-anchors.mjs --domain .`（exit 0）→ `V5 汇总：候选 8072 · 悬空 0 · 注记豁免 403`；`OK(V5): 0 条悬空锚（闸态——阈值 0）`。
- ③ `node scripts/check-ledger.mjs` → `OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规 · 基线 0 条`（exit 0）。

### §2 修正轮-5 块（#143 同案处理 + §2.13.4 表头注 · 2026-09-15 · eng-designer）

**来源** = 父侧派单（用户 2026-09-15 15:12「都按建议」五裁定之 ④⑤）——④ **#143 = 同案处理**（端侧自有 · 非缺位计——与 #175 同法）· ⑤ §2.13.4 表头注加「端侧自有类不计缺位」子句。
**边界** = 文档面修正：`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰（④ 只读核对）· 台账与仓根 `scripts/**` 零触碰 · 档头 L1–L16 / §1 / §3–§6 零触碰（本块为其下追加）。
**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在正文注明——含修正轮-3 块发现 1 / 观察 3 的结局注）。

**一、④ 证据核对（只读实核 · 完成修正轮-3 发现 1 遗留「证据未足」点）**

- **消费面（VSC 面板派生）** = `thincoder-vscode/src/extension/settings.mjs:321`（`effortDefault: spec.reasoningEffortDefault || null`——fullStatus 模型候选行；同面 `:320` 派生 `reasoning` = `reasoningEffortEnum`）· webview 回显 = `thincoder-vscode/webview/settings-state.js:48`。
- **字段面（端差字段）** = `thincoder-vscode/src/config.mjs:104`（注释自述「本端 MODEL_SPECS 每行多一个 `reasoningEffortDefault` 字段（推理强度下拉的默认档——CLI 无此字段）」；字段实例 = `:28` / `:37` / `:44` 等）。
- **数据源（核内规格表）** = `thincoder-core/model-specs.mjs`（单一 `MODEL_SPECS` · `reasoningEffortEnum` 已落——`:24` 注释 + 逐行实例）；**核内 `reasoningEffortDefault` 零命中**（全树 grep）。
- **数据面闭环（核内消费）** = `thincoder-core/provider/core.mjs:52-53`（`createProvider` 读 `thinking` / `reasoningEffort`）· `:197-204`（按 `reasoningEffortEnum` 钳制校验 + `body.reasoning_effort` 落请求）。
- **CLI 同构先例（同构锚）** = `thincoder-cli/src/tui/cmd-think.mjs:16`（`spec.reasoningEffortEnum` 派生档位）· `:118`（默认档 = 枚举首值）· `cmd-config.mjs:173-174` · `slash-commands.mjs:154`——CLI 端从核规格表派生档位 UI；默认档策略各端独立（CLI = 枚举首值 / VSC = 端差字段）⇒「各端独立实现、语义同源」既有形态。
- **核对结论** = 属「**端侧消费面 · 数据源核内已落**」——数据源（规格表 + 枚举）核内已落、核内消费闭环在核（provider 字段校验 + 落请求）；VSC 面板派生（下拉 / 默认档）= 端侧自有面（端差字段为端侧扩展）⇒ **同 #175 案：端侧自有 · 非缺位计**（原「证据未足」消解）。

**二、权威档收正（`docs/core/design/CORE-UNIFICATION.md` · 4 处：§2.13.4 #143 行 / 表头注 / §2.13.6 缺口 5 / 变更记录行）**

- §2.13.4 #143 行（`:1358`）：处置列收正——原「端侧派生面按端注入」表述退场 → 「端侧自有 · 经 provider 字段数据面」（行内含裁定锚〔与 #175 同案〕+ 实核坐标〔消费面 / 端差字段 / 数据源 / CLI 同构先例〕）。
- §2.13.4 表头注（`:1340`）：补「**端侧自有类不计缺位**」子句（⑤——核内位 = 「无」而处置列为「端侧自有」类者不计缺位；#175 / #143 先例 · 2026-09-15 裁定）。
- §2.13.6 缺口 5（`:1433`）：**缺位 3 → 2**（#143 移出、枚举同改；余 = #112 · #172）。
- 同档变更记录行（`:1937`–`:1938`）。

**三、收口（修正轮-3 块发现 1 / 观察 3 的结局注——本档 `:550` / `:553`）**

- 发现 1（`:548`）结局注：已裁 = 同案处理（端侧自有 · 非缺位计）· 落侧实核完成 ⇒ 证据已足。
- 观察 3（`:552`）结局注：其所指「表头注子句」= ⑤ 已完成。

**四、未决面**：5 / 7 不动（父侧执行序 = 红线清扫落地后另派；本块零触碰）。

**自检读数（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮-5）**：

- ① `node scripts/check-doc-width.mjs` → **1 文件 / 1 行**：`docs/core/design/PROVIDER.md:260`（336 chars）——**已知存量**（未决 5 · 非本批，未动）；本批收正两档（本档 / CORE-UNIFICATION）**0 行宽超**；`一致性 V1/V2/V3：新增违规 0 条 · 存量（基线内）0 条。`
- ② `node scripts/doc-anchors.mjs --domain .`（exit 0）→ `V5 汇总：候选 8079 · 悬空 0 · 注记豁免 403`；`OK(V5): 0 条悬空锚（闸态——阈值 0）`。
- ③ `node scripts/check-ledger.mjs` → `OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规 · 基线 0 条（**本基线必须保持为空**）`（exit 0）。

**五、发现（本轮 · 逐条）**

1. **`docs/core/design/PROVIDER.md:39`（§2.2 #143 行）同族措辞未同步（观察——未动）**：该行端差处置仍为「端侧派生面（面板下拉 / 默认档）按端注入」——#175 案对应收正（模块权威档「按端注入」表述退场——AGENT-LOOP.md 先例）在 PROVIDER.md 未并行落（07:08 裁定：改到哪模块 ⇒ 同步修哪模块的档）；受「该档并行线在写——本批零触碰」（本档档头 `:13`）约束 ⇒ 本轮零触碰，**登记待父侧与并行线协调后另派**（或随红线清扫轮一并处置）。

### §2 修正轮-6 块（首波档案收口——三单元上抛 + 未决 5 / 7 收口 · 2026-09-15 · eng-designer）

**来源** = 父侧派单（实施首波三单元 §5 上抛面 + 未决 5 / 7 裁定收口）。三单元 = W8 前置笔（`051b21a9`+`e0234ee1`）· W3（`c1256ef6`）· W1（`3a1ef09b`）；父侧红线清扫 = `60f8bab2`（T-DC15 修复 · 引擎采样域深走 ⇒ VSC 域 `doc:check` 0 命中 · `PROVIDER.md` 折行 ⇒ 宽度闸 0）。
**边界** = 文档面修正：`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰（只读核对）· 台账与仓根 `scripts/**` 零触碰 · 档头 L1–L16 / §1 / §3–§6 零触碰（本块为其下追加）。
**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在正文注明）。

**一、W8 接线契约（W8 前置笔上抛 1 落地——正文 W8 段 · W8 开工前必落）**

- ① 造记忆面前先读 `isMemoryFaceEnabled()`（`thincoder-vscode/extension.mjs:46` 实码在位——消费契约见同档 :44-45 头注）——false ⇒ 记忆面整体停用（不建句柄、不注册消费点）· 零崩；
- ② 端壳 import 链不得静态到达 `node:sqlite`（核 `memory/schema.mjs:9` = 静态引入点；静态链实例 = `@thincoder/core/memory.mjs:7` 再导出 → `memory/schema.mjs:9`）——静态可达 ⇒ 低宿主模块加载期硬失败、护栏静默失效；
- **形态判定 = 惰性 import**（备选「分层」否决：新增装配面 + 静态链不减）：记忆句柄创建点（`ensurePanelAgent` 同址——`extension/panel-chat.mjs:78`）经动态 `import()` 载核记忆面（旗标通过后）；机判 = 自 `extension.mjs` 静态 import 闭包扫描 `node:sqlite` 可达性 = 0。
- W8 门 1 状态行同批收正（「已落 2026-09-15」+「接线契约 = 上条」）。

**二、R24a 与档案增量收正（W8 前置笔上抛 3 · 实测）**

- `extension.mjs`：91 → **151**（**+60 实测** · wc -l 口径；§5 记 92 → 152 = 编辑器口径——设计估 +10±5 收正）；W2 入口注入另计（在途——**已落 `0ee40682`，+6 实测——见本块增补节**）。
- `package.json`：**+0 净行**（值变更实证——修正原「+1」估；已落 `051b21a9`）。
- 行补登：「W8 前置笔测试面」= `test/engine-floor-guard.test.mjs`（0 → **93** 新建 · 5 用例）· `test/files.mjs`（**84 → 85** · +1）。
- A-K8 基线推进对账行：+5 用例 ⇒ 622 → 627；存量两红随 `60f8bab2` 消解 ⇒ `test:full` 627/627 全绿 · `doc:check` 0 命中。
- 表 3「R24a 对位」注同批收正（`package.json` 134 → +0）。

**三、未决 5 / 7 收口（计数 5 → 3——D3 联改：未决列表 / 交付表 #7）**

- **5（宽度基线红）退场**：`PROVIDER.md` L260 已随父侧 `60f8bab2` 折行落地——宽度闸归 0；联改 = R24a「既有基线」行 · A-K3 · 发现 2 结局注 · 交付表 #8。
- **7（既有红与 A-K1 口径）退场**：口径已裁 = **零新增 + 基线登记**（用户 2026-09-15 15:12——本档 §1 :41）；红线清扫闭环（VSC `doc:check` 0 命中 · `test:full` 626 → 627 全绿）；联改 = A-K1 · A-K8 · 发现 7 结局注。
- 退场口径 = 收口项自列表退场、编号不重排（承修正轮-2/3 先例）。

**四、镜像措辞口径（W1 上抛 1——现状注形态 · 07:08 边界）**

- 07:08 判读 = 机制条文零改、只落形态 ⇒ **现状注五处**（逐处——「镜像实现 / 同构模块」= 迁移前形态表述；双端自持镜像已删、现态 = 双端同引核单源；机制语义不变）：
  - `docs/core/design/LOGGING.md` §6.1（「VS Code 同构模块」）：`:57`
  - `docs/core/design/LOGGING.md` §7 D-LG9（「镜像实现」）：`:114`
  - `docs/core/requirements/LOGGING.md` §4.2 F-L6：`:58`
  - `docs/core/requirements/LOGGING.md` §4.4 尾句：`:73`
  - `thincoder-vscode/docs/requirements/LOGGING.md` §2 F6 行：`:24`

**五、AGENTS.md 覆盖核对（W1 上抛 2——表 3 行 1 范围收正）**

- 核对 = **未覆盖**：「约定段改述 ±4」不含① 文件地图行（`:51` 类——实核 ≈ **15 行**档行随 S2 全单元陈旧）② 「零 npm 运行期依赖」句（`:11` HC 句——同族 `:5` / `:7`）。
- 处置 = **表 3 行 1 范围就地收正**（动作扩 + 合计增量约 **+4±10**）；**AGENTS.md 本体零触碰**（本轮写域外——归 W17 落地）。

**六、B20 历史形态收正（同形态 · 零语义）**

- `docs/core/design/CORE-UNIFICATION.md:46`「VSC **现声明**」→「**原声明**（迁移前）」；`docs/core/requirements/CORE-UNIFICATION.md:86`「VSC 包声明」→「包**原声明**（迁移前）」——各带变更记录行。

**七、产品档参照面登记（W1 上抛 3）**

- `thincoder-vscode/docs/design/ARCHITECTURE.md:117` 支撑面清单裸名 `log.mjs`（同族 `:108`–`:117` 多行随 S2 全量陈旧）——**登记（不加注）**：无悬空锚、无门禁影响；该档 = D-C14 迁移期参照历史（保留 ≠ 维护）——单行加注 = 半维护形态 ⇒ 整档收正归「文档维护批 / W17 时点」（承 W1 §5 上抛口径；本批零触碰该档）。

**八、核验读数（只读复核）**

- 旧下限引用（W8 前置笔上抛 4）：父侧已随 `c85f2d44` 同步（readme / lock / settings / mock）——本侧全树扫描 `1.85.0` 残留 = **0 命中**（除冻结历史 / 台账两处叙述——见「发现」）。

**发现（本轮 · 逐条）**

1. **档头复核注过时**（父侧维护面 · 本侧零触碰）：档头 L12–L15「三闸读数复核」注——「`PROVIDER.md` 折行与否仍待裁」已过时（已裁 + 已折、宽度归 0）⇒ 报父侧机械收正。
2. **`docs/TODO.md:14`（需求池 phase-2 条目）「现 `^1.85.0`」句**——同「现声明」形态；属台账（本侧零触碰）⇒ 报父侧 / 台账侧择时收正。
3. **§5 W2 在途段宽度残点（非本侧写域）**：宽度复跑 = 1 文件 / **7 行**（皆 §5 W2 在写段）⇒ 归 W2 / 父侧机械折行（承「纯折行后重跑」先例）。
4. **`docs/batches/2026-09-13-CORE-UNIFICATION.md:152`「VSC 现声明」**——历史批次档（冻结 · 零动作登记）。

**自检读数（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮-6）**：

- ① `node scripts/check-doc-width.mjs` → **1 文件 / 7 行**超 300（皆 §5 W2 在途段——非本侧）；**本侧收正档 0 行**（自造 1 行〔原 `:170` 门 1〕已就地折行收正）；`一致性 V1/V2/V3：新增违规 0 条 · 存量（基线内）0 条。`
- ② `node scripts/doc-anchors.mjs --domain .`（exit 0）→ `V5 汇总：候选 8101 · 悬空 0 · 注记豁免 416`；`OK(V5): 0 条悬空锚（闸态——阈值 0）`。
- ③ `node scripts/check-ledger.mjs` → `OK` 两档 · `0 处违规 · 基线 0 条`（exit 0）。

### §2 修正轮-6 块 · 增补（W2 档案并入 · 2026-09-15 · eng-designer）

**来源** = 父侧 steer（W2 已落地核验——`0ee40682`；完整披露 = §5 其块）。**边界** = 同前块（`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰 · §5 零触碰 · 台账与仓根 `scripts/**` 零触碰）。**形态** = 「段内就地订正 + 本块记录」并用。

**一、W2 档案增量收正（steer ①）**

- `extension.mjs`：91 → **157**（**合计实测 +66** · wc -l 口径 = W8 前置笔 +60〔→ 151〕+ W2 入口注入 **+6**〔+2 import + 4 行注——设计估 +0~2 收正〕）。
- 新建 `src/prompt-injections.mjs`：**0 → 65**（13 名锚取值表——R24a 补登；`0ee40682`）。
- 「不新增 `.mjs`」口径收正（父侧裁定）＝ **端壳缝不新增档 · 取值表分离新建（数据面 · 可测试性）**——落点 = R24a 注 + 薄壳面清单 + 交付表；**S 计数 18 → 19**（D3 联改三处）。
- 测试面例外：`test/prompts-async-guidance.test.mjs` **176 → 326**（锚面重写——R24a「VSC 测试面」行补例外）。

**二、A-K8 基线再推进（steer ②）**

- W2 +6 用例（`prompts-async-guidance` +5 / `tool-descriptions` +1）⇒ **现基线** = `npm test` **633 / 592 pass / 0** · `test:full` **633 / 633** · `test:integration` **28 / 28** · `lint` **292 档** · `doc:check` **0 命中**（§5 W2 终态读数在案）。

**三、「activate() 首步」两裁文案统一（steer ③）**

- 实况序（`extension.mjs` 实码 · `:79` / `:82`）= **入口注入（首语句）→ `console.warn`（既有诊断）→ W8 护栏 → `initLocale`/面板**。
- 统一表述：**W2 注入 = 入口首语句**（紧随入口 · 先于任何装配步）；**W8 护栏 = 首步守卫**（先于 `initLocale`/面板——W8 用例判据不动）。落点 = 正文 W2 段 + A-K5；W8 §5 侧「首步」表述语义以本条为准（§5 零触碰——登记）。

**四、W2 上抛并入（steer ④——登记面 · 零动作）**

- **⑤-a 注释/诊断文案残留**（§5 W2 上抛 5）：`run-helpers.mjs:54` / `:63` · `tool-gates.mjs:82` · `conventions.mjs:90` · `verify.mjs:88` / `:94` · `setup.mjs:372`——他单元档，随所属档触碰订正。
- **⑤-b VSC 产品档残留坐标**（§5 W2 上抛 6）：`src/prompts/*.md:NN` 坐标零门影响（A3 basename 域内判定）——收口 / 文档维护批可选收正面。
- **⑥ `AGENTS.md` 双源陈述**（§5 W2 上抛 7 = 前块「五、AGENTS.md 覆盖核对」同题）：`:15`（双源约定）与 `:57`（文件地图行）**均在表 3 行 1 收正范围内**（约定段改述 + 文件地图段）——零追加。
- W2 其余上抛（1 MCP 描述 × fail-loud · 2 提示词值维护注 · 8 核内双括注 · 9 测试并发面）= 核 / 内容权 / 测试面事项——归父侧路由（见 §5 其块）。

**自检读数（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮-6 增补）**：

- ① `node scripts/check-doc-width.mjs` → **1 文件 / 7 行**超 300——**皆 §5 W2 段**（W2 在写段 · 非本侧写域 · §5 零触碰 ⇒ 登记，折行归 W2 / 父侧）；**本侧收正档 0 行**（自造 1 行〔原 `:170` 门 1〕已就地折行收正）；`一致性 V1/V2/V3：新增违规 0 条 · 存量（基线内）0 条。`
- ② `node scripts/doc-anchors.mjs --domain .`（exit 0）→ `V5 汇总：候选 8101 · 悬空 0 · 注记豁免 416`；`OK(V5): 0 条悬空锚（闸态——阈值 0）`。
- ③ `node scripts/check-ledger.mjs` → `OK` 两档 · `0 处违规 · 基线 0 条`（exit 0）。

### §2 修正轮-7 块（W15 设计前提修正——实施打回落地 · 2026-09-15 · eng-designer）

**来源** = W15 实施开工前打回（本档 §5「实施：S2 W15 —— AGENT-LOOP · 开工前打回」——逐档 file:line 实证 + R1–R5 呈请）+ 父侧裁定 R1–R5（落 §2）。
**边界** = 文档面修正：`thincoder-vscode/**` / `thincoder-core/**` / `thincoder-cli/**` 实现零触碰（只读核对）· 台账与仓根 `scripts/**` 零触碰 · §1/§3/§5/§6 零触碰（本块为其下追加）。**形态** = 「段内就地订正 + 本块逐条记录」并用（订正点已在正文注明）；**凭证纪律** = 本块零 token/designId 值。

**一、R1 · W15 重定（零删——装配面重判）**

- 判据 = 本批自身判据「同路径 ≠ 同内容」（勘察 3 / 发现 3）+ 删除集判定按内容实核；CLI U15「删 → 核」的核镜像前提不成立于 VSC 六档（独立分叉——§5 W15 段 F1 表逐档实证）。
- 六档重判：`src/agent.mjs`（460）· `agent/{setup 668, run-stages 382, setup-reminders 252}.mjs` = **S 端壳装配面**（非删除集）；`src/explore-distill.mjs`（157）= 端壳/适配器（W6 已登记核 re-export 签名异）；`src/i18n.mjs`（56）= `t()` 壳（I18N D1 已裁）。
- 单元目标重定 = 装配面瘦身 + 核原语改指 + 端壳缝四条落地；新家 = 原地（F6 定形——不搬家）；循环契约位移 = 调用期适配（F7 定形——live autoApprove getter / distillState / turnInput / 载体 10 字段宿主；承 W6 先例）。
- 读数（实测 · wc -l · 2026-09-15）：六档 = 460+668+382+252+157+56 = **1,975**；删除集 100 → **94 档** · 20,706 → **19,052 行**（按删列口径 1,654 减列）；合计 140/22,141 → **134 档 / 20,487 行**；扇入 34 → **32**（`notify`·`panel-project` 唯一入边 = `i18n.mjs`）；S 计数 19 → **25**。

**落点（就地订正 · file:line as-of 本块落盘时）**：

| # | 落点 | 订正面 |
|---|---|---|
| 1 | §2 W15 段（`:215`–`:227`） | 整段重写（重定声明 / 单元目标 / 端壳缝四条 / #112 核对未落 / 测试面 + 专项验收收正） |
| 2 | （三）总表 W15 行 `:115` · 合计行 `:117` | 删 6/1,654 → **0/0**；存活改指 → **1**（W6 跨单元笔·已落）；合计联改（94/19,052 · 134/20,487 · 扇入 32） |
| 3 | 勘察 #3 `:70` · #6 `:73` · #7 `:74` | S 25 / 删除集 94·19,052 / 扇入 32（各就地增补） |
| 4 | 薄壳面清单 S 行 `:241` · `:266` | S 19 → **25**（+W15 六档——端壳装配面 4 + 端壳/壳 2） |
| 5 | R24a `:254`（删除集）/ `:256`（端壳改指面）/ `:257`（**新增行**——W15 装配面 6 档）/ `:261`（端点行） | 逐行收正（94 档 · 32 档/5,991 行 · 六档 1,975 行 · 改指 2 处 → 1 处） |
| 6 | 表 2 标题 `:398` + 增补节 `:420`–`:424` | S 档 25 逐档证据（新增六档逐档分叉证据） |
| 7 | 表 4 口径 `:427` · 条目 `:429`–`:435` · 注 `:436`–`:438` | 94 档 · 32 档（extension 15）· 注⑤（W15 边退场——`notify`/`panel-project` 移出） |
| 8 | 表 5 `:440` 起 · 改核心面类 `:446` 区 · 超软线判定追加行 `:456` | 32 档 · W15 六档净减方向 · `setup.mjs` 668（>500 硬限）拆分计划行 |
| 9 | 发现 4 `:301` · 发现 8 `:308` | S 25 增补 / W15 半收正（原「随 W15 删除集」句取代） |
| 10 | 未决 3（`:315` 区——**收口退场**）· 交付表 #2 `:326` / #4 `:328` / #7 `:331` | D3 联改（3 → 2 条；删除集/扇入/S 计数） |
| 11 | §2 变更记录 `:351`–`:352`（+1 行） | 修正轮-7 摘要 |
| 12 | `docs/core/design/CORE-UNIFICATION.md`：§2.13.6 #6 `:1450`–`:1451` · §2.8 `:1043` · 变更记录 `:1943`–`:1944` | R2 点名面 + R1 联改面（见二） |

**二、R2–R5 逐条落地**

| # | 裁定 | 落地 |
|---|---|---|
| R2 | 工具登记面 = **端侧装配期装饰**（`vscSubagentFace`——W13 已落： #99 panel 剔除 · C-5 终态回显 · `isReadonlyAction`/`isControlAction` 谓词）；核内缝不新增（端差走端侧装饰/注入 · 零核改）；W15 保留该面 | §2 W15 段端壳缝① + `CORE-UNIFICATION.md` §2.13.6 #6 落点句收正（「现无剔除缝」→「落点 = 端装配面 · 已落」）+ 未决 3 收口退场 |
| R3 | #113 = **端侧供给**（端装配面围绕核 `prepareRun` 注入；前置推送形态按 `context-parity` 序表实证收正〔序表 = VSC 产品档 `AGENT-LOOP.md` §17.4；断言面 = 端测试〕；核内补位不取） | §2 W15 段端壳缝② |
| R4 | 端身份面 = **VSC 自持**（端 `END = "vscode"`〔`thincoder-vscode/src/extension/session-slots.mjs:49` 实核〕+ env 行端生成——承 W11 marker 层先例）；核 `END` 参数化 = 核内笔登记 | §2 W15 段端壳缝③ + 核内笔清单 #2 |
| R5 | #112 = 核对未落 ⇒ 核内笔登记（三处实证）；i18n 壳 = 保留（见 R1）；`depInfo`·C-6 差异 = 核内笔登记（W13 已锁核语义现态）；⏹ queued 等待头回收 = W15 事件面（并入其验收条目） | §2 W15 段（#112 行 + 专项验收）+ 核内笔清单 #1/#3 |

**三、核内笔清单（上抛父侧排期——超本批写域 · `thincoder-core/**` 零触碰）**

| # | 笔 | 现状 / 实证（file:line · 2026-09-15 实核） | 来源 |
|---|---|---|---|
| 1 | **#112 `read_image` 门位迁移**（定稿 = 装配面恒含 + run 期重解——`CORE-UNIFICATION.md` §2.13.6 缺口 5 #112 块） | **未落**（三处）：① 核 `tools/index.mjs:62` 装配期门仍在（`imageOk = Boolean(specForModel(model)?.multimodal)`）② 核 `agent/setup.mjs:293-294` 无 run 期能力重解（`tools`/`toolSchemas` 物化处零过滤）③ 拟档 `thincoder-core/test/tool-face-capability.test.mjs` 不存在 | R5 · §5 W15 三 |
| 2 | **核 `END` 参数化**（`resumeSlot(cwd, { end })` 形态候选） | 核 `END = "cli"` 编译期单值（核 `session-slots.mjs:71` 实核）+ env 行硬编码 `${END}`（核 `agent/setup-reminders.mjs:31` 实核）⇒ 端壳无法零行为差消费核件 | R4 · W11 §5 未决 1 |
| 3 | **`depInfo`·C-6 差异** | 核 `depInfo` 判 `discarded` 墓碑 `ok`（核 `agent-tools/subagent-scheduler.mjs:111`——`depc` 判定 `:167`）vs 端设计 §12.6 C-6（`discarded → cancelled` depc 停靠）；消费面在核 scheduler 内（`describeBlockers` `:133` / `queueRunnable` `:266`）——端装配层无法补齐 | R5 · W13 §5 未决 1 |

**四、核对与发现**

1. `docs/core/design/{AGENT-LOOP.md,I18N.md}` 核对结论 = **无失准 W15 行（零动作——「如需」不触发）**：`I18N.md` §3.1 D1「VSC 保留 `t()` 壳」与 R1 同向；`AGENT-LOOP.md` §2.5 #112/#113 行「端差注入」表述与 R2/R3 同向、§6.18 = W15 实施期同步面（`vscSubagentFace` 等 W13 已收正）。
2. `CORE-UNIFICATION.md` 两处收正（落点表 #12——R2 点名 + R1 联改）；该档其余 W15 陈述（§2.13.6 #112 块「只设计不实现——S2 / 核内笔落」· §2.13.4 #112 行）现行态与 R5 一致——零改。
3. 修正轮-4 块内「VSC 随 W12 / W15 删除集」句（`:588` 块区）**历史保留 as-of 语义**——其 W15 半已由本轮取代（`agent/setup.mjs` VSC = 重定保留）。
4. **发现（上抛 · 非本笔面）**：① 台账闸 = **1 处违规**（`docs/TODO-archive.md:188` 证据 `thincoder-vscode/src/agent-tools/settings.mjs:35`——该档 = **W16 删除集**〔工作区已删，实核 MISSING；核 `agent-tools/settings.mjs` 在册且含 `_SIBLING_SHAPES`〕⇒ 建议 W16 收口 / 父侧按「迁核注记」形态改证据）；
  ② 锚闸 = **35 悬空**（存量面 = W10/W12/W14 删除集在核心 docs 的未收口坐标——本笔两档零新增〔逐条核验：本笔编辑行均不在悬空清单〕——同 W12 补轮「交文档收口批」口径）。

**五、自检读数（三闸复跑 · cwd = 仓根 · 2026-09-15 修正轮-7）**

- ① `node scripts/check-doc-width.mjs` → `OK(宽度): 404 文件零 >300 字符行`（exit 0）；`一致性 V1/V2/V3：新增违规 0 条`（本席首版 3 行超宽〔`:225`/`:421`/`:437` 区〕已就地机械折行——仅插换行 · 文字零改）。
- ② `node scripts/check-ledger.mjs` → **1 处违规**（`TODO-archive.md:188`——W16 在途面，见四.4①；本笔零触碰台账）。
- ③ `node scripts/doc-anchors.mjs --domain .` → **FAIL(35 悬空)**（存量面——见四.4②；`CORE-UNIFICATION.md` 本笔三处编辑均不在悬空清单内）。

**状态**：R1–R5 全文落地 ✓ · D3 联改 ✓ · 核内笔清单在案（上抛父侧排期）✓；W15 可重派（同一 designToken 修正轮；docs FIRST）。

**收正注（同轮 · 零语义）**：本块首版 2 行长行（`:766`/`:814`——折行前坐标）经本席就地机械折行（仅插换行 · 文字零改）；同批 `:766` 的 §5 引用改节题锚（原 as-of 行号随本块追加漂移——形态收正）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-09-15-vsc-core-wiring.md` §1+§2（VSC 壳代码接线设计轮任务书 W1–W16 · 零代码）；判据上游 = `docs/core/{design,requirements}/CORE-UNIFICATION.md`。**声明限制**：本轮无项目标准档、未发现 Document Map ⇒ 判据 7（归属）按 §1 三层分工 + 07:08/07:10/07:13 裁定 + 回指纪律判定。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/前置门 | 🟡 | 权威 §2.6.0「CLI 全部单元做完并验收通过 → 才开 VSC 单元（VSC 单元轮本档不排期）」（设计档 :439 / :450）未登记完成读数或用户豁免；任务书只写「本批 = S2 的 VSC 半边（CLI 半边已由 §2.6.3 排期落地）」（本档 :52）——「排期」与「落地」不可分辨；且（三）总表「前置」列除 W8 外全「—」，未承载权威 S2 进入条件（:411） | 登记 §2.6.3（七）主计数实读（CLI 待迁 = N）+ 用户启动口径；S2 进入条件落「前置」列或表头「共同前置」 |
| 2 | Requirements | 🟡 | 保留的 19 S 档未与权威「对位行」对账、未给结构性不对称证据（本档 :194 依据 = 「逐档读档分类（勘察 3）」）；权威覆盖对账把这些档放在对位行：VSC `agent/**` 5 = 对位 #149/#150/#154/#155（:363）· VSC `tools/**` 12 = 对位 10 + ④ 仅 context/focus（:369/:373，本批却把 code/shell 也列入保留 S）· VSC 顶层 14 档 = 对位（:365，含 config-mcp/embed-config/indexer/memory-tool/repomap/specs） | 逐档补结构性证据（file:line）或直接引对位行「端差处置」取值，证明保留 = 裁决结果（否则 F11/F9 的「无残留双份」不成立） |
| 3 | Requirements/覆盖 | 🟡 | 权威 §2.8 列为本轮 S2 的 VSC 产物面在单元表/R24a/验收判据中均缺席、边界（本档 :232–238）也未声明排除：`thincoder-vscode/AGENTS.md` ±4（设计档 :1047）· `check-vsix.mjs` 新建 + `postpackage`（:1057）· `publish-all.mjs` +8±4（:1058）；「不动 `scripts/**`」按发现 1 口径指仓根 scripts/，不含 vscode/scripts/；N4 的 VSC 判据（vsix 内嵌核 = 解包断言）在 A-K1–A-K10 无对应项 | 落一条收口笔，或边界明写「不含 S2 收口：核发布 / 产物断言 B·D / lock 权威形态」+ 落点指针；A-K 表补 N4 判据及时点 |
| 4 | Clarity/可核性 | 🟡 | 「存活改指去重 33」（:65/:105）与分类底账不可复现：按（三）+ 逐单元枚举去重得 extension 19 · agent 5 · agent-tools 2 · tools 4 · 根档 5（indexer/embed-config/memory-tool/config-mcp/specs）= 35，与「extension 20 · agent 5 · agent-tools 2 · tools 5 · 根档 specs.mjs」不符；R24a（:209）又把 `tools/index.mjs`、`specs.mjs`/`tools.mjs` 写成 33 之外的另计项（与 :65「根档 specs.mjs」在 33 内相抵）；「合计 ≈ 6,5xx」亦无逐档底账 | 附机器扇入清单（或逐单元「改指」列并集）作 R24a 底账；同一档只在一处计 |
| 5 | Criterion 8（受影响档行数/档位） | 🟡 | R24a 对「端壳改指面」只给聚合「≈6,5xx → 行数不变（import 行替换）」（:209），未逐档给当前行数与预计增量；「行数不变＝import 行替换」对 W7（`mcp/index.mjs` 注册表+面板接口迁入 `extension/panel-mcp.mjs` :137）· W11（五档「内部由自持会话逻辑改指核会话面」:152–153）· W14（`shared.mjs:66-106`/`:148` 现形「迁入端壳供值」:171）不成立；这些被改档已越 300 行软线（session-io 436 / session-slots 399 / panel-session 338 :152–153 · settings 348 :149 · execute-tools 363 :176 · tools/shell 317 :170 · memory-tool 386 设计档 :1049 · suspension 362 设计档 :1721），设计未按 CLI 先例给档位判定（设计档 :571「既有超软线档 · 结构未变 · 拆分计划另议」） | 补逐档「当前行数 → ±N / 结构未变」，并对 >300 行被改档（含真增行的 W7/W11/W14 三处）给超软线判定 |
| 6 | Clarity/可实现性 | 🟡 | W14 端壳缝落点未指名：§2.13.5/§2.13.3 要求把 VSC `tools/shared.mjs:66-106`（getOpenDoc/applyEditorEdit/applyEditorRangeEdit）与 `:148`（runInterruptible）迁入端壳供值（设计档 :1330–:1331 · 本档 :171），但 W14 删除集整档删 `shared 413`（:168），方案选型 4(a) 又写「`tools/shared.mjs` 拆壳后收 write-path/exec-run 缝」（:78），R24a 同时声明「不新增任何 .mjs」（:215）——三处并读不出接收档 | 指名接收档并同步其预计增量；或声明该档保留为拆壳后的薄壳（改删除集/选型表） |
| 7 | Clarity/执行序 | 🟡 | 跨单元改指表述自相抵：W6 正文「run-helpers（compact 入边——随 W15 面改指）」（:132–133）vs 总表脚注「改指随 W6 落」（:107）；W5 正文「shell 的 `./checkpoint.mjs` 引用随 W14 同批改指」（:129）vs 脚注「其改指列 W14 内计（同批落）」（:107）——删档单元不落改指则中间态 `ERR_MODULE_NOT_FOUND`，也过不了 A-K4 | 统一写成「改指在删除单元（W5/W6）落地、仅计数归 W14/W15」，或把该两处改指计入删除单元 |
| 8 | Feasibility | 🟡 | W8 删除集含 `index-bin`/`index-discover`/`embedding` 并改指 `indexer.mjs`（:140），即预设索引面并核 sqlite；而未决 2 明说该面「未裁」、未判前「记忆面接线、索引面保持现状登记」（:253），W8 前置列却只登记未决 1（:96/:141）——两条口径并存时 W8 无可行解 | 未决 2 列入 W8 前置门；W8 删除集拆「记忆面（未决 1）」/「索引面（未决 2）」两段 |
| 9 | Requirements/裁定门 | 🟡 | W15 的 #175 写「端壳供值」（:178），但权威 §2.13.4 该行记「核内位 = 无」（:1350）且被 §2.13.6 缺口 5 计为**缺位**之一（:1433，缺位 4 = #112/#175/#143/#172），本批又声明不碰核（:234）⇒ 供值出口无定义；丁组 **D2（auto-think）** 裁定状态未见收口（索引列 D2 = 待裁 :402；变更记录只收正 D1 已裁 :1852），而 F12/§2.6 要求「裁定未完毕的条目不得进入实施段」 | 按 #112 同法登记（「核对核内已落」或「需核内笔 ⇒ 上抛/押后」）；核对 D2 状态后写入 W15 前置 |
| 10 | Acceptance/可验性 | 🟡 | A-K8 以「VSC test:full 内非本单元用例计数与基线一致」为判据（:228），但本档只记核 178/178 与 fast 622/581/41（:67），test:full / test:integration / lint / doc:check 无基线读数（CLI 先例记四命令读数，设计档 :701）⇒ 判据不可比对；A-K7「revert 演练（抽样 ≥1 单元）」（:227）弱于 N2 | 补四命令基线读数（或写明「基线 = 实施首笔实跑落 §5」）；A-K7 加「每单元提交 = 单笔（删除集+改指同笔）」可逆性核验 |
| 11 | Acceptance/入口面 | 🟡 | A-K5「入口装配后四装配面输出扫描」（:225）未写驱动形态：CLI 先例明确「起真实 CLI 入口径」（设计档 :939–941）；VSC 侧 `extension.mjs` 依赖宿主 `vscode`，若仅在单测内 import 端壳档，则「入口漏配 ⇒ 字面静默进模型」（设计档 :1524）无判据 | 指明驱动面（现有 integration 沙箱 / 假 `vscode` 桩 / activate 直调）或补端侧入口径用例 |
| 12 | Doc-state | 🟡 | 档头称「§2 两处『6 行』已就地更正」（:12），但 R24a 仍存「PROVIDER.md **6 行** >300」（:213），与同档 :243/:256（5 行 · 实判 1 行 L260）及档头自身相抵；收正集合亦未对齐——档头记 3 项（含 VSC-MIGRATION 指针 :10），§2 补正注只记 2 项（:272） | 父侧就地收正 :213（承折行打标先例）+ 对齐两注（纯文案，零语义） |
| 13 | Doc-state/跨档 | 🟡 | W2 删 `src/prompt-overlays.mjs`（83）⇒ 槽位装配走核单点（:117），但权威 §2.8 仍记 VSC 该档为「S2 改 · 83 · ±6」且备注「装配表与导出面不变」（设计档 :1038）；CLI 同题——§2.8 记「改 ±6」（:1037）而 §2.6.3 U15 逐档清单列为待删档（:901）。两处读法互斥，须择一收正（权威档同步计划未含该行） | 二选一并同批收正（删 ⇒ §2.8 两行改「删」+ PROMPT-SYSTEM.md 端节收正；改 ⇒ W2 删档列改指） |
| 14 | Clarity | 🔵 | 内部交叉引用指向不存在的节号：通用格式注「复跑与共同验收见（四）」（:85）与 W14「.src 兼容前缀发现见（七）①」（:173）——本档 §2 无（四）/（七）小标题（实为 :111 四步块与 :240「发现」节 5）；W2「已收正则零动作」（:120）语句残缺（应为「已收正 ⇒ 零动作」） | 改为本档实际位置（或补小标题），并订正残句 |
| 15 | Clarity/引用一致性 | 🔵 | 权威 B9 记 VSC 对位档 = `thincoder-vscode/src/agent/async-discard.mjs:57-74`（设计档 :35），本批却把 `agent-tools/async-discard.mjs` 作为 S 保留档（:114/:160/:164），且 73 同路径 + M28 删除集（=100 档）内不含 `agent/async-discard.mjs`——若该路径存在则删除集不全 | 实施前核对该路径（存在 ⇒ 补入清单；不存在 ⇒ 收正 B9/权威行） |

**VERDICT: pass（0 🔴 · 13 🟡 · 2 🔵）**

### 轮次 2（评审子代理）

**评审对象**：`docs/batches/2026-09-15-vsc-core-wiring.md` §1+§2（含修正块 / 修正轮-2 块 / 修正轮-3 块）+ 权威面收正 4 档（`docs/core/design/{CORE-UNIFICATION,AGENT-LOOP,MEMORY}.md` · `docs/core/requirements/MEMORY.md`）——**轮次 2（增补面）**。**声明限制**：本轮无项目标准档、未发现 Document Map ⇒ 判据 7（归属）按 §1 三层分工 + 07:08 / 07:10 / 07:13 裁定判定。

**轮次 1 十五条复核**：15 条落点逐条在位（前置门 / 表 2 十八档证据 / W17 收口笔 + 表 3 + A-K11 / 表 4 扇入底账 / 表 5 逐档行数 + 超软线判定 / W14 拆壳薄壳指名 / W5·W6 改指同笔 / W8 重写（裁定后并回单单元）/ W15 #175 / A-K5·A-K7·A-K8 /
`:213` 5 行 + 补正注 3 项 / prompt-overlays 两行「S2 删」/ 悬引用三处 / B9 坐标）；**残遗 = 计数面（见 #1 / #2）**。
**修正轮-2 增量核**：W8 删 5/1,047 · 改指 5 · 清退形态（告示 + 显式清理 · 零自动删除）· 重建 UX（scan/index/done 相位 + 零手动重建）· A-K12–A-K14 ·
权威三档收正（design/MEMORY §6.9/§4#11/§3.1 A2/D-MEM14 · requirements/MEMORY §4.7 · design/CORE-UNIFICATION §2.8）均在位。
**修正轮-3 增量核**：§2.13.4 #175 行（端侧自有 + 锚 · :1350）· §2.13.6 缺口 5（缺位 4→3 = #112/#143/#172 · :1433）·
AGENT-LOOP §2.2 #175 / §3.2 D2（状态不变）/ §9（493 行）均在位。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state/计数（finding 6 落点残遗） | 🟡 | （三）总表 W14 行仍记「删 20/4,018」（本档 :109），与同单元正文（12 同路径 + 7 M ⇒ 19 档 · 逐档行数合计 3,605——:191–:194）及合计行（「140 档 / 22,141 行」——:112）相抵：逐行相加 = **141 档 / 22,554 行**（差 = `tools/shared.mjs` 413 行 / 1 档）⇒ 修正轮 #6（:348「总表 −1 档 / −413 行」）在该行未落地 | 父侧就地收正 W14 行为 19/3,605（承拆壳薄壳保留口径）+ 复核逐行相加 = 合计行（修正轮-2 已收正合计行，仅 W14 行漏改） |
| 2 | Doc-state/计数 | 🔵 | 修正轮-2 计数联改其余残点（皆「修正轮-2 前口径」）：① R24a 脚注「收口后 = 19 S 档」（:245）vs 薄壳面清单 / 表 2 / 交付表 #4 的 S = **18**（:224 / :371 / :307）；② 修正块 #5「扇入 34 档合计 6,393 行」（:346）vs R24a 的 **6,102 行**（:239；表 4 逐档相加 = 6,102 ✓）；③ 修正块 #4 分组「tools/4 · 根档 5（含 `indexer`）」（:343）vs 现行 tools/5 · 根档/4（:401–:402）；④ 交付表 #2「158 档全分类（73 同路径 + M28 + S19 + extension40）」（:305）分解相加 = 160 ≠ 158（S 亦未随 18 收正） | 一并就地收正或加「已被修正轮-2 取代」指向注；④ 建议按勘察 #2 两分口径（73 + 85）改写 |
| 3 | Doc-state/跨档（finding 13 同族 · 已登记 = 发现 8） | 🟡 | 权威 §2.8「提示词加载面（S2 改）」同族 5 行（设计档 :1039–:1043）与本批删除集互斥：VSC `src/advisor/main.mjs`（320）在 W12 删除集（:180–:181）· `agent/setup.mjs` 在 W15（:203）· CLI 三档实核已不存在（:287）——两处读法在实施前仍互斥（本批报而未改 · 上抛） | 按 finding 13 同法择一并同批收正（删 ⇒ 对应行改「S2 删」）；时点 ≤ W12 实施前（否则 W12 模块权威档同步面与 §2.8 并存两口径） |
| 4 | Requirements/跨档（索引面归一落点缺口） | 🟡 | `requirements/MEMORY.md` §4.4「索引有效性」F6–F9（含判定句「索引状态面显示『模型不匹配 + 重建入口』」——:80 / :87）未随 2026-09-15 索引面归一裁定标退场：同文 §4.7 孪生行 F-M5/F-M6 已标「随归一退场」（:141–:142），§4.4 仍以「可见面 + 用户确认后重建」为活需求——与本批 W8 面板收正（`mismatch` 退场 · 「Rebuild now?」退场——:157 / :160）及 A-K13（:263）相抵；且 §2.12.2 第 11 行（存储面）未覆盖该可见面变化 | 按 §4.7 同法给 §4.4 F6–F9 加退场注（核面承接 = `design/MEMORY.md` §6.9 / D-MEM14）；如判为对外可见面变更，同批在 §2.12.2 第 11 行或「输出文案」类补登记（F13 口径） |
| 5 | Requirements/覆盖（边界外 · 需落点声明） | 🟡 | A2「记忆面一次性导入器」落点 = CLI 侧 S2 新建（`memory import`——设计档 §2.8 :1050；A2 已裁 = `design/MEMORY.md` §3.1 A2）；本批 W8 = VSC 记忆面切核（:150），而导入器在本批边界（:268「不碰 `thincoder-cli/**`」）/ 前置（:55 / :91「CLI 待迁 = 0」）/ 发现（:277–:289）零登记；且「CLI 待迁 = 0」判据 = **档数删除账**（§2.6.3（七）①），无法见证「新建」项 ⇒ VSC 老用户 personal 记忆迁移路径在本批无落点声明（**unverified**——本轮未读 CLI 树） | 补一条声明：已落 ⇒ 引读数入 W8 前置账；未落 ⇒ 入发现 / 上抛（时序 ≤ W8 落地版本发布前） |
| 6 | Criterion 8（受影响面行数标注） | 🟡 | 三处被改面缺「当前行数」注：① W6 三档 `extension/{history-window,generate-title,turn-model}.mjs` 仅记「±0」（:141 / :414）；② W8 同批收正面 `webview/status-bar.js` · `locales/{en,zh}.json`（:157）在 R24a（:235–:243）无行；③ W8 前置笔 `activate()` 护栏（:163 / :270 / :447）落点档 `extension.mjs` 增量未与 W2 入口注入（+0~2，:241）分列 | 补「当前行数 → ±N / 结构未变」（若均 ≤300 且结构未变，一句注明即可） |
| 7 | Acceptance/N4·N5 落点 | 🟡 | W17 / `check-vsix.mjs` 断言面仅落 **断言 B**（含核 + 版本——:432 / A-K11 :261 / 权威 :1057），而权威自身口径不一：§2.2 形态树写「vsix 含核 + 版本 + **提示词面断言**」（设计档 :77）· T-C7 的断言 D 明列「三处（核包 tarball / CLI 装机 / **vsix 解包**）枚举 15 + 25」（:1551）；本批 A-K1–A-K14 无 N5 的 VSC 判据，且 R11「核内提示词随产物可达性」= 未实测项（:121），其兜底正是断言 D | W17 表 3 / A-K11 明确断言面含 D（或注明 D 的其他落点 / 批次）；同批收正权威 §2.2 形态树 ↔ §2.8 :1057 口径 |
| 8 | Coordination（父侧 / 用户裁 · 非缺陷） | 🟡 | ① A-K1「五命令 exit 0」（:251）与既有红并存（`doc:check` exit 1 · V5 21 处；`test:full` 2 fail——:258）⇒ 未决 7 裁定前 A-K1 不可判（本批已声明不静默豁免——:298）；② #143「疑同类」（端侧自有 vs 缺位计）与 §2.13.4 表头注口径，已由修正轮-3 发现 1 / 3（:541 / :543）上抛待裁 | 保持未决 / 上抛形态；建议裁定时点 ≤ 首单元复跑前（A-K1）与 ≤ W10 开工前（#143） |
| 9 | Clarity/可验性（低位） | 🔵 | A-K12 判据写「无 embedder → FTS 回退**非空**」（:262），核口径为「纯 FTS 下 `ftsQuery` 为空且无 embedder 时返回 `[]`」（`design/MEMORY.md` :139）⇒ 字面在空 query 面假红 | 验收用例限定「非空 query」面（或引核口径原文） |
| 10 | Clarity/扫描域（低位） | 🔵 | A-K4 反向判扫描域 = `src/` + `test/` + `extension.mjs`（:254）；`thincoder-vscode/scripts/**`（发现 7 明示在途档 `reconcile-lookup.mjs`——:284）未纳入——承 CLI 先例「零引用闸扫描域不得窄于计数域（含 `bin`）」（设计档 :584）。**unverified**：本轮未读 VSC `scripts/**` | 首单元前一次 grep 实核（或纳入扫描域）；命中 ≠ 0 ⇒ 补 表 4 / 改指面 |
| 11 | Clarity/注入值摘要（低位） | 🔵 | W2 内联摘要写「`agent-loop-ptr-*` **五值** = `AGENT-LOOP（CLI 仓·设计）§7.3/§8/§14.2`」（:127）——实为四值收正 + 一值原样（`-async-note` = `AGENT-LOOP（CLI 仓·设计）§11.2`，两端相同——设计档 :1276 / :1308 / :1312）；字面照抄会漏 / 错一锚 | 摘要改「四值收正 + 一值原样（§11.2）」，或整行改为纯引用不列值 |

**VERDICT: pass（0 🔴 · 7 🟡 · 4 🔵）**

## §4 用户批准（主 agent）

### 用户批准（2026-09-15 15:12）

**用户原话「都按建议」**（回应父侧「批准请求 + 五裁定表」）⇒ **批准进入实施**（评审轮次 2 pass 在案 · 修正收敛 10/10 · 三闸绿）+ 五裁定按 §1 表（15:12 行）落地。

**批准后执行序**（父侧）：① 修正轮-5（#143 同案 + 表头注子句 + 未决 5/7 收口 · eng-designer）② 实施首波（eng-coder：W8 前置笔 + W1 + W2 + W3——files/dependsOn 交调度器）③ 红线清扫（父侧工程面：T-DC15 夹具 + 采样域 B + 基线登记 + `PROVIDER.md` 折行）④ 逐单元核验收口（§5/§6）。

## §5 实施记录（eng-coder）

### 实施：S2 W3 —— TRACES 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：当前段 = **S2（VSC 迁移单元 W3）**。写域 = 三档代码 + 一档模块权威档（见「改动面」）；核内零改动（`git status -- thincoder-core` 自证空）；`thincoder-cli/**` 零触碰；台账与仓根 `scripts/**` 零触碰。

**同批披露**：`thincoder-vscode/src/provider.mjs` 同档另含并行 W1 单元改指（`:10` log.mjs 边——15:26 落）⇒ 两单元共档，本笔按 `--only` 整档收录（见「决策透明表」1）。

**依据** = 本档 §2「W3 · TRACES」行（`:135`）+ 逐单元任务书四步块（`:121`–`:122`）+ 验收判据 A-K4 · A-K8 · A-K10；上游 = `docs/core/design/CORE-UNIFICATION.md`（零引用机判两模式 + 四步「接线 → 删旧 → 复跑 → 提交」）；模块权威档同步面 = `docs/core/design/TRACES.md`。

**改动面**（行数 = `wc -l` 口径实核；改前 = 父侧提交 `60f8bab2`）

| # | 档 | 行数（改前 → 改后） | 动作 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/provider.mjs` | 426 → 426 | `:11` 改指核子路径（唯一入边 = 本删除集档；该档 = W10 删档——见「决策透明表」1） |
| 2 | `thincoder-vscode/test/trace-store.test.mjs` | 395 → **399** | 改指核子路径 + 头注改判登记 + config 测试缝改指核 |
| 3 | `thincoder-vscode/src/traces/trace-store.mjs`（删） | 254 → **0** | **删档**；空目录 `src/traces/` 同批移除 |
| 4 | `docs/core/design/TRACES.md` | 115 → **116** | §1 归属表两格收正（CLI / VSC）+ 变更记录一行 |

**① 逐处「改前 → 改后」（来源串替换 + 缝改指——行为断言零改 · `git diff HEAD` 逐行实证）**

| # | 位置 | 改前 → 改后 |
|---|---|---|
| 1 | `src/provider.mjs:11` | `from "./traces/trace-store.mjs"` → `from "@thincoder/core/traces/trace-store.mjs"` |
| 2 | `test/trace-store.test.mjs:27` | 六名导入来源 `"../src/traces/trace-store.mjs"` → `"@thincoder/core/traces/trace-store.mjs"` |
| 3 | `test/trace-store.test.mjs:29` | `_setConfigPathForTest` 来源 `"../src/config-io.mjs"` → `"@thincoder/core/config.mjs"`（同笔补 `_resetConfigPathForTest`） |
| 4 | `test/trace-store.test.mjs:47` | `_setConfigPathForTest(null)` → `_resetConfigPathForTest()` |
| 5 | `test/trace-store.test.mjs:2-8` | 头注：单源归核 + A21（`docs/core/design/TRACES.md` 的 §2.5.1 A21）改判登记——承 CLI U3 头注同法 |
| 6 | `docs/core/design/TRACES.md:14` | §1 两格 → 「经 `@thincoder/core/traces/trace-store.mjs` 引用（自持镜像已删——S2 U3 / S2 W3）」 |

**② 删旧三条读数（删前全过才删）**

1. **改指已落盘**：两处改指（provider.mjs + 测试档）先落，其后删除、复跑——中间态零 `ERR_MODULE_NOT_FOUND`。
2. **零引用机判**（域 = `src/` + `test/` + `scripts/` + `extension.mjs` · 254 档全递归 · 待删档本体排除）：模式① 引号相对路径形 = **0 命中**；模式② 路径片段反向判（前缀非 `core/`）= **0 违规**（合规核 token 3 处）；删后复扫读数同（0 / 0）⇒ A-K4 面成立。
3. **文档锚**：删后 `doc-anchors --domain .` = 候选 8079 · **悬空 0**（`OK(V5)`）；VSC 域 `doc:check` 终态 = 命中 **0** 处（既有 21 处红由父侧 `60f8bab2` 清扫——非本单元面）。

**③ 复跑读数（终态实跑 · 原样 · 非本单元面之差逐条归因）**

| # | 命令（cwd） | 读数 | 判 |
|---|---|---|---|
| A | `npm test`（thincoder-vscode） | 626 / **585 pass** / fail 0（41 慢测快层跳过） | ✓（基线 622/581/0——+4 全 = 并行 W8 前置笔新档 `test/engine-floor-guard.test.mjs`） |
| B | `npm run lint`（同） | `check-syntax: 293 JS files OK` | ✓（面内 −1 删档 ⇄ 并行 +1 新测试档，净 293 = 基线） |
| C | `npm run test:full`（同） | 626 / **625 pass / fail 1**（`T-DC6②`——既有红） | ✓（基线 fail 2；`T-DC15` 由父侧 `60f8bab2` 夹具同步修复） |
| D | `npm run test:integration`（同） | 28/28 · fail 0 · exit 0 | ✓（= 基线） |
| E | `npm run doc:check`（同） | 命中 0 处 / distinct 0 · exit 0 | ✓（基线 21 处红 → 父侧清扫后 0；删档零增量） |
| F | 核回归 `node --test`（thincoder-core） | **178/178** · fail 0 · exit 0 | ✓（= 基线；核零改动） |
| G | 仓根三机检 | 锚 悬空 0 ✓ · 台账 0 违规 ✓ · 宽度 新增 0（`PROVIDER.md` 1 行 = 既有基线） | ✓ |
| H | 轨迹面专项 | 11 用例绿（快层 + 全量两跑逐条） | ✓ 专项验收「trace-store.test 改指后绿」 |

> **读法注**：本席无父侧基线两跑对照权——A/B/C 行的 ±N 均以「并行单元面」归因（实测点：`test/engine-floor-guard.test.mjs` 新增 + `files.mjs` 清单 +1）；本单元面读数 = H 行 11/11 绿 + G 行不变量。

**④ 提交**：单笔 `git commit --only` ⇒ **`c1256ef6`**（4 档：删档 + 两处改指 + 测试档 + 权威档同步；`git show --stat` = 14 insertions / 263 deletions / 1 delete mode）；回退点 = `git revert c1256ef6`。

**⑤ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **NO-DIVERGENCE**（四类偏差 0：部分实现 / 静默简化 / 文档漂移 / 清单外改动）；2 🟡 + 5 🔵（含「审计无 git/执行面」的证据限制——本席已以 `git diff HEAD` 逐行补齐：测试档仅头注 + 两处改指 + 缝改指，断言零改）。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**（🔴 **0** · 🟡 3 · 🔵 1）。
- **裁决表（4 项）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 `src/provider.mjs:144` —— 换指后 VSC 旧镜像的「同步段异常隔离」不变量未随核承载（核档 `recordChatTrace` 同步段无 try 包裹；旧镜像删前快照 `.thincoder/tmp/head/…:163`/`:206-207` 有兜底）。修点 = 核内（本批边界禁改核）⇒ 登记上抛（见「未决」1）。非本单元 must-fix。 |
| 2 | Deferred | 🟡 `docs/core/design/TRACES.md` §6.1/§6.2/§7 机制条文仍叙 A21 前的额度 / 在途上界形态（与核唯一实现及同档 §3.1 A21 相抵）——属冻结条文面（本批同步总则「只收正坐标 / 状态行」）⇒ 上报父侧文档层（见「未决」2）。 |
| 3 | Not an issue | 🟡 体量软线：`src/provider.mjs` 426 行 · `test/trace-store.test.mjs` 399 行——既有、本单元未引入（R24a 已登记面；前者 = W10 删档）。零动作。 |
| 4 | Not an issue | 🔵 `thincoder-vscode/src/config-io.mjs` 的 `loadTracesSettings` 换指后零消费者（孤儿导出）——该档属 W16 删除集，随删档自然消失。零动作。 |

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | provider.mjs `:11` 同笔改指（账面「存活改指 0」= 扇入底账口径，非零动作） | 删旧门强制「改指已落盘 ∧ 全链 exit 0」；CLI 同案先例 = U3（`src/provider/core.mjs:12` 同笔改指，且该档同为后续单元删档目标）；备选 = 留旧相对 import ⇒ 该产品全链 `ERR_MODULE_NOT_FOUND`（否决） |
| 2 | 删前预跑一轮 + 删后终态复跑 + 三闸终态复跑 | 承 CLI U1–U16 字面执行先例 |
| 3 | 空目录 `src/traces/` 同批移除 | git 不跟踪空目录；CLI U3 先例 |
| 4 | 权威档同步面仅动 §1 两格 + 变更记录一行（§6–§9 零改，并在变更记录显式声明） | 本批同步总则「只收正坐标 / 状态行 · 不触碰机制条文」；§6 滞后条文另项上抛（未决 2） |
| 5 | 测试 config 缝改指核（`@thincoder/core/config.mjs`） | 实现单源归核后，prune 保留期读取面随核 ⇒ 缝须同源；否则测试跑开发者真实 config（隔离失效）。备选 = 删该缝（丢弃保留期确定性——否决） |
| 6 | 测试头注以「VSC 副本已删」表述，不复写旧路径 | 零引用机判模式②面保持纯净（承 CLI U3 头注同法）；删除事实由本档 + 权威档变更记录承载 |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **核内待补位：同步段异常隔离**（评审 🟡#1）：核 `recordChatTrace` 的记录构建 + 单遍序列化全程同步且无 try 包裹（try 仅包异步写盘体）⇒ 病态 messages（循环引用等）同步抛错可经 `provider.mjs:144` 把成功返回变抛错（旧镜像有兜底、核无）。修点 = 核包（本批「不碰核包一字」）⇒ **上抛父侧裁定**（核内补守卫的下一个核内笔 / 或明示接受该端差）。
2. **权威档机制条文滞后**（评审 🟡#2）：`docs/core/design/TRACES.md` §6.1/§6.2/§7 叙 64K 额度 / 4M stub / 在途上界 8 丢弃——唯一实现为「完整落盘 + 每写 prune」（A21）；冻结条文面 ⇒ **上报父侧文档层收正**（或反向裁定则涉核内笔）。
3. **`test/files.mjs:36` 注释旧**（「TRACE-STORE-VSC……VSC 轨迹存档同构」）——该档不在 W3 写面；归 W2/W8 清单轮或父侧机械处置。
4. **共档协调**（审计 🟡F1）：`src/provider.mjs` 为 W1 与 W3 两单元共档（`:10` / `:11` 各一）⇒ 本笔整档收录；建议父侧对同档两单元提交序显式串行（本笔先落，W1 后续提交时该档已含其改指）。

**轮次自证**：审计 1 轮 + advisor 1 轮 + 修复轮 0（本笔无面内可修项——两条 🟡 的修点均在写域之外）；终态 0 未决 🔴 → **clean**。

### 实施：W8 前置笔 —— 引擎下限落地（`^1.104.0` + `activate()` 护栏）（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：实施首波 · 独立前置笔（承 U0 先例 · 不占单元号）。
**依据** = §2 W8「门 1（引擎下限——已裁 2026-09-15）」（:167）+ §1 :38 裁定行 + 权威档 `CORE-UNIFICATION.md` §2.11 A8（:1191）。
**写域** = 下表 4 档；**零触碰**：核包 `thincoder-core/**` · `thincoder-cli/**` · 仓根 `scripts/**` · 台账 `docs/TODO.md` · 本档 §1–§4/§6 · 他单元文件。

**落地面（逐档 file:line · 两笔提交）**

| # | 档 | 改动 | 读数 |
|---|---|---|---|
| 1 | `thincoder-vscode/package.json` | `engines.vscode` `^1.85.0` → `^1.104.0`（:30） | 值变更（+0 净行） |
| 2 | `thincoder-vscode/extension.mjs` | 护栏族：`NODE_FLOOR`（:20）· `nodeFloorMet`（:25）· `engineFloorMet`（:32）· `isMemoryFaceEnabled`（:44）· `applyEngineFloorGuard`（:50）+ `activate()` 首步调用（:76）；修正轮 1：初值 fail-closed（:22） | 92 → 152 行（**+60**——设计估 +10±5，超顶如实登记） |
| 3 | `thincoder-vscode/test/engine-floor-guard.test.mjs` | 新建 · 5 用例（版本闸边界 / sqlite 缺失分支 / 低于下限三态 / 本机真探针 / 接线机检〔挂点+顺序+值锁+入册〕）；修正轮 1：第 5 用例 + 头注 | 0 → 94 行 |
| 4 | `thincoder-vscode/test/files.mjs` | 新档入册（:84） | +1 行 |

**决策透明表**

| # | 决策点 | 取法 | 理由 / 代价 |
|---|---|---|---|
| 1 | 「停用记忆面」机制 | 前置笔落**开关**（`isMemoryFaceEnabled()` 导出 + 消费契约写进 `extension.mjs:42-43` 注释）；初值 fail-closed | 记忆面核内接线住 W8（本笔无消费方）；承 U0 先例「前置笔落机制、消费随单元落」。**残口 = 消费契约未入 §2 文本 ⇒ 上抛 1** |
| 2 | 护栏位置 | `activate()` 首步（诊断 `console.warn` 之后 · `initLocale`/面板之前） | §2 门 1「首步」；诊断行为既有行非步骤 |
| 3 | 提示文案语言 | 硬编码英文（同端内既有扩展级 `showErrorMessage` 惯例） | 护栏**先于** `initLocale` ⇒ 结构上取不到 `locales/` |
| 4 | `loadSqlite` 探针可注入 | 保留（默认真 `import("node:sqlite")`） | 覆盖 Electron-without-sqlite 分支（#47706 形态）——该分支正是下限存在的理由 |
| 5 | 「不新增 `.mjs`」口径 | 按 §2 :250 括号自限定（端壳**缝模块**）解读 ⇒ test 新档不违 | 字面全禁读法则本笔测试面越界 ⇒ **上抛 2** |

**复跑读数（实跑 · cwd = `thincoder-vscode/`；修正轮后复跑）**

| 面 | 读数 | 基线对照（§2 A-K8） | 判定 |
|---|---|---|---|
| `npm test`（fast） | **627 / 586 pass / fail 0 / skip 41** | 622 / 581 / 0 | +5 用例（本笔新档）全绿 · 零回归 |
| `npm run test:full` | **627 / 627 pass / fail 0** | 622 / 620 / fail 2（T-DC6② · T-DC15） | 存量两红已由父侧修正提交 `60f8bab2` 清 ⇒ 全绿 |
| `npm run test:integration` | **28 / 28 · fail 0** | 28 / 28 | 不变 |
| `npm run lint` | **292 档 OK · exit 0** | 293 档 OK | −1 档（W1/W3 在途删档 `log.mjs` · `traces/trace-store.mjs`——非本笔） |
| 核回归 `node --test`（cwd = `thincoder-core`） | **178 / 178 · fail 0** | 178 / 178 | 不变（核零触碰） |
| 仓根三闸 | 宽度 **OK**（404 档零 >300）· 台账 **0 违规** · 锚根域 **0 悬空**（CLI 树存量 1 条前批已登记 · VSC 域 **0 命中**） | 宽度基线红 1 行 / 台账 0 / 锚 0 | 零新增（宽度红已由父侧 `60f8bab2` 折行清除） |

**提交**：① `051b21a9` `feat(vsc): engine floor ^1.104.0 + node:sqlite activation guard (W8 pre-pen)`（4 档 / +138 −1）
② `e0234ee1` `fix(vsc): engine-floor guard fail-closed default + wiring/engines test pins (review round-1)`（2 档 / +19 −2）
——均为 `git commit --only` 列文件提交（他笔在途改动零混入）。

**审计与代码评审轮次与终态（终态 = clean）**

- 内审（explore 子代理 · 只读发散审计）**轮 1 = DEVIATIONS（1 🟡）**：代码面逐点对位（值/首步/口径/提示/不崩/无降级路径六项全中 · 5 用例无空跑）；偏差 = DOC-DRIFT（本 §5 空白 + §2 R24a/A-K8 未携本笔读数）⇒ §5 = 本条 · §2 项 = **上抛 3**。
- 内部代码评审（advisor）**轮 1 = pass（0 🔴 · 2 🟡 · 3 🔵）**：🟡-1 =「机判面未闭合」（删 `activate()` 挂点四用例仍绿 + `engines.vscode` 值零锁）；🟡-2 = 开关消费契约未入设计文本（协调项）；🔵 = fail-open 初值 / 缺入册自断言 / 仓库无 Node 下限声明。
- **修正轮 1**（提交 `e0234ee1`）：🟡-1 = **Fixed**（第 5 用例 = 挂点存在 + 顺序〔先于 `initLocale(`/`new ChatPanel(`〕+ 值锁 `^1.104.0` + 入册自断言；
  **齿口实证** = 临时删挂点 ⇒ 恰 1 红〔4/5〕· 复原后 5/5）；🔵-1 = **Fixed**（`extension.mjs:22` fail-closed）；🔵-2 = **Fixed**（同第 5 用例）；
  🔵-3 = **Not an issue**（仓库 `engines.node` 会误声明——低于下限宿主按设计仍可用〔护栏只降记忆面、不停整扩展〕；环境契约已在档头 + CI pin node 24）；
  🟡-2 = **Deferred**（W8 协调项 ⇒ 上抛 1）。
- 评审**轮 2**（只验修正声明）= **pass**：两处改动逐条复核在位 · 未引入新 🔴；新见 1 条 🔵 卫生项（`files.mjs:84` 登记注释未含新接线用例——可选项）。

**上抛（本笔残口 · 父侧/设计侧路由）**

1. **开关消费契约**：`isMemoryFaceEnabled()` 消费点（W8 记忆句柄创建前读旗标 + 端壳 import 链零静态 `node:sqlite`——核 `memory/schema.mjs:9` 为静态引入点）设计侧未写
   ⇒ 建议 W8 开工前在 §2 W8「记忆面段」补一句；不补则低于下限宿主在 W8 落地后可能激活期硬失败（护栏静默失效）。
2. **「不新增 `.mjs`」口径**：§2 :250 注若按字面覆盖 test 档 ⇒ 本笔新档越界；请父侧裁（本笔按括号自限定读法落）。
3. **§2 档案增量登记**：`extension.mjs` 实测 **+60**（设计估 +10±5）· 新 test 档 94 行 + `files.mjs` 入册 1 行未在 R24a 表（:237–250）；A-K8 基线未携 +5 用例对账行——建议 eng-designer 修正轮同批收正。
4. **旧下限引用未收口**（新鲜读数）：`README.md:30`「- VS Code >= 1.85.0」· `package-lock.json:18` 旧值副本 · `docs/design/SETTINGS.md:63` 引旧下限 · `test/vscode-mock/index.mjs:190`「1.85.0-mock」（惰性）
   ——README 不在本笔文件清单（批次档全文零 README 命中）⇒ 本笔零触碰，报父侧择时（本笔补 1 行 或 W17 收口）。
5. **事故披露（已复原 · 净效果零）**：首落笔时 apply_patch 按相对路径写入了**隔壁独立检出** `D:\teamcode\thincoder-vscode\`（同名目录 · 非本仓）的 3 档；
   发现后 `git checkout --` 逐档复原（该仓 `git status` 回净 · token 级复核零残留）——实际交付面 = 本仓 4 档不变。

**条目状态**：① `engines.vscode` 值变更 = ✅ · ② `activate()` 首步护栏（自检/提示/记忆面开关/不抛）= ✅（开关消费点随 W8——见上抛 1）· ③ 测试面 = ✅（新档 5 用例 + 入册）· ④ 单笔提交 = ✅。

### 实施：S2 W1 —— LOGGING 单元落轮（2026-09-15 · eng-coder）——终态 = clean

**段位**：当前段 = **S2（VSC 迁移单元 W1 · 实施首波）**。写域 = VSC 侧（删 1 档 / 改指 15 档 / 文档 4 档）+ 核仓模块权威档 2 档；**核内实现零触碰**（`thincoder-core/**` 未动）· 台账与仓根 `scripts/**` 零触碰 · 本档 §1–§4/§6 零触碰。
**依据** = 本档 §2「W1 · LOGGING」行 +「逐单元任务书」四步块 + A-K1/A-K3/A-K4/A-K10；上游 = 本档 §4 用户批准（2026-09-15 15:12）。
**提交** = 单笔 **`3a1ef09b`**（21 档 / +30 −223）；回滚点 = `git revert 3a1ef09b`。

**改动面**

| # | 面 | 档 / 量 | 动作 |
|---|---|---|---|
| 1 | VSC 删旧 | `thincoder-vscode/src/log.mjs`（196 行 → 0） | **删档** |
| 2 | VSC 改指 | 15 档 = 5 存活入边 + 10 删除集入边（本笔提交收录 14 档；`provider.mjs` 随 W3 笔 `c1256ef6`） | 来源串替换 → `@thincoder/core/log.mjs` |
| 3 | VSC 注释 | `agent-tools/async-discard.mjs:28` · `agent-tools/async-settle.mjs:21`（模块图 2 行） | 同步改指（零语义） |
| 4 | VSC 产品档 | 4 档 / 7 行迁核注记 | 见下「③ 文档锚条」 |
| 5 | 核仓模块权威档 | `docs/core/design/LOGGING.md` · `docs/core/requirements/LOGGING.md` | 形态收正（机制条文零改） |

**① 改指（15 档——全部 = 来源串替换；具名导入面零改）**

- 存活 5（任务书列）：`agent-tools/async-discard.mjs` · `agent/execute-tools.mjs` · `extension/{panel-callbacks,panel-chat,suspension}.mjs`。
- 删除集入边 10：`agent/run-stages.mjs` · `agent-tools/{advisor-async,async-settle,consult,subagent-async,subagent-escalate,subagent}.mjs` · `conventions.mjs` · `indexer.mjs` · `provider.mjs`。
- 第 16 入边 `traces/trace-store.mjs` 随 W3 单元删档——本单元无改指动作。

**② 删旧三条读数（删前全过才删）**

1. **改指已落盘**：16 入边全部处理（15 改指 + 1 随 W3 删档）；删前快层实跑 = 626/585/0（fail 0）。
2. **删前/删后全链**：删前快层（`npm test`）= 626/585/0；删后终态全链见 ④。
3. **零引用反向判**（域 = `src` + `test` + `extension.mjs` · 293 档）：引号相对形 **0 命中**；全扫描域 `log.mjs` 提及 17 处全部指向 `@thincoder/core/log.mjs`（15 import + 2 注释）——**非核指向 0**。

**③ 文档锚条（4 档 7 行——删档后 `src/log.mjs` 锚将悬空 ⇒ 同批注记）**

| 档 | 行 | 形态 |
|---|---|---|
| `thincoder-vscode/docs/requirements/LOGGING.md` | `:4` / `:5` | 迁核注记（W1 已迁核——现体 `thincoder-core/log.mjs:1`） |
| `thincoder-vscode/docs/design/PORTABILITY.md` | `:134` | 同上 |
| `thincoder-vscode/docs/design/PROVIDER.md` | `:210` | 同上 |
| `thincoder-vscode/docs/design/LEDGER-SELF-CONTAINED.md` | `:380` / `:563` / `:572` | 同上（历史行；零门影响） |

注记行经 VSC 引擎 `isNoteLine` 谓词实核豁免（先例 = `CORE-UNIFICATION.md` §2.6.2（六）迁移注记行）——VSC 域 `doc:check` 终态 = **0 命中 / exit 0**。

**④ A-K 读数（终态复跑 · 原样）**

| # | 判据 | 读数 | 判 |
|---|---|---|---|
| A-K1 | VSC 全链 | `npm test` 627/586/0/41 · `lint` 292 JS files OK · `test:full` **627/627** · `test:integration` **28/28** · `doc:check` **0 命中**（五命令 exit 0） | ✓ |
| A-K2 | 核回归 | `node --test` = **178/178** · fail 0（核零改动） | ✓ |
| A-K3 | 仓根三机检 | 锚 候选 8087 · **悬空 0** · 豁免 412 · OK(V5)；宽度 **OK**（404 档无 >300 行）· 一致性新增 0 · 存量 0；台账 **0 处违规** | ✓ |
| A-K4 | 零引用 | 反向判两形态：引号相对形 0 / 非核指向 0（17 处提及全指核） | ✓ |
| A-K10 | 模块权威档 | 2 档收正在位 + 变更记录在案；锚悬空 0 | ✓ |

> 基线口径 = 父侧 `60f8bab2`（VSC 域 doc:check 归 0 · `PROVIDER.md` 折行清零）后现况——「零新增」= 对现基线；`test:full` 既有 2 fail（T-DC6②/T-DC15）已随该笔消解。并行单元在途用例增删使计数较首跑浮动（+1），本笔零用例增删、fail 0 不变。

**⑤ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **CLEAN**——四类（部分实现 / 静默简化 / 文档漂移 / 清单外改动）全未命中；边界 1 项 🔵（需求档 §1 基线句滞留「两端同路径档」）⇒ **Fixed**（标记「迁移前基线」）。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**（🔴 0 · 🟡 2 · 🔵 3）。
- **裁决表（5 项）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 模块权威档机制面「镜像实现 / 同构模块」措辞残留（design §6.1 / §7 D-LG9 · requirements F-L6 / §4.4 尾句 · VSC 档 F6）——07:08「机制条文零改」口径 vs 形态收正边界 ⇒ 交父侧裁量（非 must-fix）；建议 = 一句现状注或明确留档时点 |
| 2 | Fixed | 🟡 `agent-tools/async-settle.mjs:21` 注释「+ log.mjs」→ `@thincoder/core/log.mjs`（与 `async-discard.mjs:28` 同形）；复扫 = 非核指向 0 |
| 3 | Fixed | 🔵 `LEDGER-SELF-CONTAINED.md:380` / `:572` 补同款迁核注记（与 `:563` 对齐） |
| 4 | Not an issue | 🔵 触碰档 >300 行 10 档（无 >500）——既有超软线档、本笔单行替换结构未变（批次表 5 在册口径 + R3） |
| 5 | Fixed | 🔵 §5 记录（本条）随轮落档 + 披露面在案 |

- **修复轮 2**（轮1 = 自检宽度折行〔requirements §4.4 行 304 → 折两行〕+ 审计 🔵 收正；轮2 = 评审 🟡/🔵 收正）。
- **引证核验附注**：host 核验器对 2 条引证报「content mismatch」——复核为**路径解析 artifact**（解析落到仓根同级陈旧孪生树 `D:\teamcode\thincoder-vscode`——该树未迁移；承 U1–U16 同型附注）。
- **轮次自证**：审计 1 轮 + advisor 1 轮 + 修复轮 2；终态 **0 未决 🔴 → clean**。

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 改指面 = 全入边 15 档（任务书计数列 = 存活 5） | A-K4 反向判零 + 删后中间态零 `ERR_MODULE_NOT_FOUND`；先例 = CLI U1（18 档全改指，含后续删除目标）+ 同批 W3（改指 W10 目标 `provider.mjs`）；备选 = 只改 5 ⇒ 删后 10 档断链、全链红、A-K4 不过 |
| 2 | `provider.mjs` 随 W3 笔 `c1256ef6` 同档收录（本笔不收录、不回退其 trace 边） | 父侧 steer（2026-09-15）；共档两单元各自如实披露 |
| 3 | 文档注记 = 引擎豁免形态（「已迁」+「现体 `path:line`」） | VSC 引擎 `isNoteLine` 谓词实核；先例 = 迁移批注记行形态 |
| 4 | 核仓文档收正只落 §1/§4.4 形态 + 变更记录 + §9 行数 | 07:08 裁定「只收正形态，不触碰机制条文」 |
| 5 | 删除集入边（`indexer.mjs` 等）同批改指 | 与批次（三）脚注注 1「改指在删除单元同笔落地」同口径（此处删除单元 = W1 本体） |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **`AGENTS.md:51` 文件地图行**（仍记 `src/log.mjs`）+ Hard Constraints「Zero npm runtime dependencies」句——批次表 3 行 1 的 W17 收口笔范围核对（是否覆盖该两处）；本单元零触碰。
2. **`ARCHITECTURE.md:117`** 支撑面清单含 `log.mjs`（裸名）——VSC 产品档「保留 ≠ 维护」面；随 W17 / 文档维护批。
3. **机制面「镜像实现」措辞残留**——见裁决表 #1（Deferred · 交父侧）。
4. **孪生树陷阱**（非本仓）：`D:\teamcode\thincoder-vscode` 为未迁移陈旧树——工具 / 子代理路径解析易落该树；建议后续任务书一律绝对路径。
5. **仓外写入**：零（本笔全部改动均在 `thincoder/**` 内）。

**段末复跑（§5 写入后 · 原样读数）**：`check-doc-width` = **404 档无 >300 字符单行** · 一致性 V1/V2/V3 新增违规 **0** · 存量 0 · exit 0；
`doc-anchors --domain .` = 候选 **8087** · **悬空 0** · 注记豁免 412 · `OK(V5)` exit 0；`check-ledger` = 台账两档 `OK` · **0 处违规** · 基线 0 · exit 0。
**VSC 域复跑（终态）**：`npm test` 627/586/0/41 · `lint` 292 JS files OK · `test:full` 627/627 · `test:integration` 28/28 · `doc:check` 0 命中——五命令 exit 0；核 `node --test` 178/178。
**收正注（同轮 · 零语义）**：§5 文本经宽度 / 一致性复跑零命中（无 >300 行、无 V1/V2/V3 新增）——无需折行。

### 实施：S2 W2 —— 提示词面单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：当前段 = **S2（VSC 迁移单元 W2）**。写域 = VSC 树 20 档（12 代码/测试 + 6 文档 + 1 新建 + 1 删）+ **41 档删除**；核包 `thincoder-core/**` 与 `thincoder-cli/**` 实现零触碰（只读核对）；台账 `docs/TODO.md` 与仓根 `scripts/**` 零触碰；批次档 §1–§4/§6 零触碰（本条 = §5）。**未 commit 批次档**；本单元提交 = `0ee40682`（见⑤）。

**依据** = 本档 §2「W2 · 提示词面」（`:127`–`:133`）+ 逐单元任务书四步块（`:121`–`:122`）+ 验收判据 A-K5 · A-K6 · A-K10（`:260`–`:265`）+ §2 修正块 #13（`:371`–`:373`）；上游 = `docs/core/design/CORE-UNIFICATION.md` §2.13.2（13 锚「VSC 列」+ 收正注 + 端说明括注登记）· §2.13.6 缺口 3/4 · §2.13.7 · §2.13.8（锚替换缝）；
模块权威档同步面 = `docs/core/design/PROMPT-SYSTEM.md` · `TOOLS.md`（tool-docs 面）。

**改动面**（行数 = `wc -l` / `git show --stat` 口径实核；改前 = 父侧提交 `e0234ee1`）

| # | 档 / 集合 | 行数（改前 → 改后） | 动作 |
|---|---|---|---|
| 1 | VSC 删除集（`src/prompts/` 15 + `src/tools/*.md` 25 + `src/prompt-overlays.mjs`） | **1,522 → 0**（实核：prompts **1,015** + tools **424** + overlays **83**；设计记 1,518——as-of 漂移 ±4，如实登记） | **删档**（41 档；`git rm`） |
| 2 | `src/prompt-injections.mjs`（新建） | 0 → **65** | §2.13.2「VSC 列」13 名取值表（含显式空串 ×2 + 端说明括注并入同锚值） |
| 3 | `extension.mjs` | 152 → **158**（+6） | `activate()` 首语句 `configurePromptInjections(VSC_PROMPT_INJECTIONS)`（+2 import + 4 行注）——设计估 +0~2 行，超顶如实登记 |
| 4 | `src/agent/setup.mjs` | 465 → **465** | `assemblePrompt` 改指核 + 死码清理（`__dirname` 及 `node:path`/`node:url` 两 import——本端镜像删后零用）+ `modeRoleField` 分支描述回经原语（评审 🟡#3） |
| 5 | `src/tools/shared.mjs` | 413 → **414** | `DESC` 改经核 `loadToolDoc`（本端 25 档删后原 `readFileSync(join(__dirname,…))` 零用删除） |
| 6 | `src/tools/index.mjs` | 76 → **80** | `toOpenAISchema` 的 `description` 经 `applyPromptInjections`（面 3 调用期应用） |
| 7 | `src/advisor/main.mjs` | 320 → **309** | 私持 `loadPrompt` + 三 node: import + `__dirname` 删；四常量改经核 `loadAdvisorPrompt`（缺档语义不变 = 抛错；CLI U2 L6 同法） |
| 8 | VSC 测试面 5 档 | 见「①」 | `prompts-async-guidance`（重写 + 锚面 5 用例）· `tool-descriptions`（改指核 + 注入值）· `prompts-mirror-anchors`（改指核）· `context-parity` / `eng-designer-role`（import 改指核） |
| 9 | VSC 产品档 6 档（design 3 + requirements 3） | ±N（单行级） | 悬空锚改指（`doc:check` 7 处 → 0）+ W2 迁核注记（`已迁核——现体 …` 形态） |
| 10 | 模块权威档 2 档（`docs/core/design/{PROMPT-SYSTEM,TOOLS}.md`） | 各 +9/-3 行 | §1 表三行状态行收正 + §6.5 端侧装配面坐标 + 变更记录各一行（只收正坐标/状态行，零机制条文） |

**① 逐处「改前 → 改后」（接线五处 · 来源串/调用点）**

| # | 位置 | 改前 → 改后 |
|---|---|---|
| 1 | `extension.mjs:6` / `:79` | —— → `import { configurePromptInjections } from "@thincoder/core/prompt-files.mjs"` + `activate()` **首语句** `configurePromptInjections(VSC_PROMPT_INJECTIONS)`（先于引擎下限护栏 `:82` 与 `initLocale`/`new ChatPanel`） |
| 2 | `src/agent/setup.mjs:27` | `from "../prompt-overlays.mjs"` → `from "@thincoder/core/prompt-overlays.mjs"`（槽位装配面 = 核内单点） |
| 3 | `src/tools/shared.mjs:15` | `readFileSync(join(__dirname, ${name}.md))` → `loadToolDoc(name)`（核包 `tool-docs/`；契约 8） |
| 4 | `src/tools/index.mjs:75` | `description: tool.description` → `description: applyPromptInjections(tool.description)`（面 3 调用期） |
| 5 | `src/advisor/main.mjs:47`/`:63`–`:74` | 私持 `loadPrompt` → `loadAdvisorPrompt` 四常量（核单一解析面） |
| 6 | `src/agent/setup.mjs:293` | `schema.function.description = t.description + …` → `applyPromptInjections(t.description + …)`（评审 🟡#3：重组分支回单出口） |

**② 删旧三条读数（删前全过才删）**

1. **改指已落盘**：五接线 + 测试改指先落，其后删除、复跑——中间态零 `ERR_MODULE_NOT_FOUND`（冒烟：七场景 + consult 装配 + 31 工具 schema + 顾问提示词，全过）。
2. **零引用机判**（域 = `src/` + `test/` + `extension.mjs` + `scripts/` + `webview/`，299 档全递归）：模式① 引号包裹本地相对路径形（`"./prompts/…"` / `"../prompts/…"` / `src/tools/<name>.md` 装载式）= **0 命中**；模式② 路径片段反向判（非核前缀）= **0 违规**。
残留面 = 注释/诊断文案提及（`run-helpers.mjs` / `tool-gates.mjs` / `conventions.mjs` / `verify.mjs` 各 1–2 处「`src/prompts/*.md` 是产品代码」类举例；`setup.mjs:372` 诊断文案）——非引用（他单元档，随所属档触碰订正），登记见「上抛 5」。
3. **文档锚**：VSC 域 `doc:check` 删后中间态 = **7 处悬空**（A3；`src/tools/read.md` ×2 + `src/prompt-overlays.mjs` ×5）→ 逐处改指/迁核注 → **0**（`V5: 命中 0 处 · distinct 0`）；仓根 `doc-anchors` 全域 = 悬空 **0**。

**③ 复跑读数（终态实跑 · 原样 · cwd = `thincoder-vscode/`）**

| # | 命令 | 读数 | 判 |
|---|---|---|---|
| A | `npm test`（fast） | **633 / 592 pass / fail 0 / skip 41** | ✓（基线 627/586——+6 全 = 本单元新用例：`prompts-async-guidance` +5 / `tool-descriptions` +1） |
| B | `npm run test:full` | **633 / 633 pass / fail 0** | ✓（= 基线同口径；scenario/慢层全绿） |
| C | `npm run test:integration` | **28/28 · fail 0 · exit 0** | ✓（= 基线） |
| D | `npm run lint` | `check-syntax: 292 JS files OK` | ✓（+1 新档 −1 删档，净 292 = 基线） |
| E | `npm run doc:check` | `V5: 命中 0 处 · distinct 0` · exit 0 | ✓（删前 0 → 删后中间态 7 → 改指后 0） |
| F | 核回归 `node --test`（cwd = `thincoder-core`） | **178/178 · fail 0 · exit 0** | ✓（= 基线；核零改动） |
| G | 仓根三机检 | 宽度 `OK(宽度)` 404 档 · 新增违规 0 ｜ 锚 `OK(V5): 0 条悬空锚`（候选 8099）｜ 台账 `0 处违规` | ✓ |

**专项验收（A-K5 / A-K6 · 机判面）**：① 四装配面输出零 `{{inject:` 字面 ✅（八场景 + 31 工具描述 + 顾问提示词；用例 `prompts-async-guidance` 锚面②/④）；② 13 锚 VSC 值逐锚在场 ✅（锚面② 逐值 + 锚面④ 入口径同断言）；
③ `## 收尾验收` 恰一份 ✅（锚面②/④）；④ 文档地图 `docs/design/README.md` 在场 ✅；⑤ `src/prompts/` + `src/tools/*.md` 枚举空 ✅（删净面用例 + glob 实核 A-K6）；⑥ 入口接线 = `activate()` 首语句 ✅（锚面④ 直调 `activate()` 后复验——含 `env.language` / `registerWebviewViewProvider` 两件 mock 补桩）；
⑦ 13 名集合 ⇔ 核锚名集合逐名等值 ✅（锚面①，fail-closed）；⑧ 顾问面零锚 fail-closed 机检 ✅（锚面①b，评审 🔵#6 落修）。

**④ 提交**：单笔 `git commit --only` ⇒ **`0ee40682`**（60 档：41 删 + 12 代码/测试改 + 1 新建 + 6 文档；`git show --stat` = 354 insertions / 1629 deletions）；回退点 = `git revert 0ee40682`。批次档本档**未入本笔**（父侧在途）。

**⑤ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **DIVERGENT** —— PARTIAL 0 / SILENT-SIMPLIFICATION 0 / OUT-OF-LIST 0；**DOC-DRIFT 4 项（🟡）** 全部落修：
  ① `docs/requirements/NORMAL-MODE.md:6`/`:30`（双源句仍指 `src/prompts/`）· ② `docs/requirements/VSC-PROMPTS.md:22`（F4）/`:24`（F6）· ③ `docs/design/VSC-PROMPTS.md:3`/`:9`/`:22`（档头/节标题）·
④ `docs/design/TOOLS.md:359`（AC-TD-2 仍断言 vsix 含 `src/tools/*.md`）——逐处改「已迁核——现体 …」注记形态（+ 同族未触及档 `docs/requirements/TOOLS.md:19` F3 一并收正，主动披露）。审计附注「VSC 档未落变更记录行」= 见决策透明表 9。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**（🔴 **0** · 🟡 3 · 🔵 5）。引证核验附注：host 核验器 1/11 match——复核为**孪生树路径解析 artifact**（`D:\teamcode\thincoder-vscode` = 未迁移陈旧检出；评审自身已识破并在首段标注），本侧逐条复读（对monorepo 树）相符；评审的「实跑读数无执行面」限制 = 以本侧实跑为准（③ 表）。

| # | Action | Detail |
|---|---|---|
| 1 | Not an issue | 🟡 文件档位超软线（`tools/shared.mjs` 413 · `agent/setup.mjs` 465 · `advisor/main.mjs` 320）——既有、在册、本单元只做来源串替换；R3 不升级（拆分归 W14 拆壳 / W12 / W15 删除集） |
| 2 | Deferred | 🟡 新失效面（协调项）：`tools/index.mjs:75` 后注入原语覆盖**全部**工具 description，含 MCP 扩工具（`agent/setup.mjs:200`）⇒ 第三方描述内出现锚字面即 fail-loud 抛错（schema 构建期）。W2 前该位置恒等零风险；修点在核/设计面（「原语作用域 = 核发布物 vs 不可信描述」）⇒ **上抛 1** |
| 3 | Fixed | 🟡 缝旁路：`agent/setup.mjs:291` 以裸 `t.description + suffix` 覆写注入结果（depth-0 `subagent` 分支）⇒ 已改 `applyPromptInjections(t.description + …)`（`:27` 补 import）；当前该面零锚（行为零变），修复= 面 3 单出口闭合 |
| 4 | Deferred | 🔵 `discipline-normal-finish` 值含退役档名括注（`main.md 迁入`）+ 引导行与核内 `:98` 同义——§2.13.6 缺口 3 明许「标题 + 引导行」/「仅标题」二选一；内容权 = 主 agent ⇒ **上抛 2**（零行为改） |
| 5 | Deferred | 🔵 `eng-coder-guidelines` 值首行与核内 `prompts/persona-eng-coder.md:19` 逐字重复（模型可见两次）——同块去重口径声明的去重项只覆盖另两项（测试亦只钉两项）；内容权 = 主 agent ⇒ **上抛 2**（零行为改） |
| 6 | Fixed | 🔵 顾问提示词面无注入挂点（零锚 ⇒ 不变量空验）⇒ 新增 `锚面①b` fail-closed 机检（核内 advisor 四档零锚，新增锚即红；W12 后归核内结构机检） |
| 7 | Deferred | 🔵 「`activate()` 首步」两裁并立（W2 注入 vs W8 前置笔护栏）——实现顺序 = 注入 → 护栏（皆先于 locale/面板，两判据实质满足）；纯文案 ⇒ **上抛 4** |
| 8 | Fixed（部分） | 🔵 入口用例 mock 卫生：`:300`–`:305` 改「按原属性存在性还原」（`language` / `registerWebviewViewProvider` 读-改-还，免留残属性）；「`activate()` 订阅不 dispose」= Not an issue（node --test 文件级进程隔离） |

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 取值表落**独立模块** `src/prompt-injections.mjs`（非内联 `extension.mjs`） | CLI U2 决策 2 同法（表/调用分离、表可测试、13 名一处注册——§2.13.8「禁止别处零散配置」）；R24a「`extension.mjs` = W2 入口注入 **+0~2 行**」的估值只能由外部表成立（内联 ≈ +35 行）。**代价**：新增 1 .mjs ↔ §2 :250 注「不新增任何 `.mjs`」——该注括号自限定为「端壳缝」（本条非缝；承 W8 前置笔上抛 2 同型口径）⇒ **上抛 3** |
| 2 | 端说明括注**并入同锚值**（五指针锚各带本端括注） | §2.13.2 表后登记「**建议并入同锚值**（判据 = 模型可见指令零变化）」+ 本档 §2 W2 明写；核内不硬写端说明 |
| 3 | `-async-note` 取 `AGENT-LOOP（CLI 仓·设计）§11.2`（其余四值收正按 §2.13.2 收正注 §7.3/§8/§14.2） | 本档 §2 W2 逐字（「四值收正 + 一值原样」+「两端相同」）；`（CLI 仓·设计）` 形态 = VSC 原文形态（PROMPT-SYSTEM §5 右端读数同形） |
| 4 | `eng-coder-guidelines` 去重：剔除「Write code one file at a time …」与「Out-of-file-list changes …」两块 | §2.13.6 缺口 3 定稿口径「锚只承载 VSC 独有、核内无的部分」；实核该两项在核内逐字承载（`prompts/persona-eng-coder.md:26` / `:29-30`——S1 融合时提为共享正文）⇒ 注入即重复。**机械判据** = 与核内逐字重复行；语义等价已验证；残项（首行重复）见评审 🔵#5 上抛 |
| 5 | 顾问提示词面**不挂**注入原语（只改加载根） | CLI U2 决策 3 同法；advisor 四档现行锚 = 0（实核）；该档随 W12 删除期近——挂接 = 无锚期纯增面 |
| 6 | `DESC` 装载根改指核 = 本单元落（非 W14） | 删 `src/tools/*.md` 的机械前提（不落则描述面 `ERR` 抛错）；「存活改指 0」= **扇入底账口径**（静态 import 扇入），非零动作——承 W3 决策 1 先例；`toOpenAISchema` 注入 = 面 3 调用期（同批落） |
| 7 | 追加改指 `context-parity` / `eng-designer-role` / `prompts-mirror-anchors` 三测试档 | 三档 import/读盘 `src/prompt-overlays.mjs` / `src/prompts/`（删除集）⇒ A-K4 零引用强制；§2 W2 测试面清单只举 2 档 = 非穷举（同 W3「同批改指」先例） |
| 8 | T-DC16 锚改指**运行期落地档（核包）**、双源逐字同源断言**退场** | 被锚文本类 = 纪律条文 fail-when-unchanged 锚（锚类裁定 = VSC `DOC-CODE-RECONCILE.md` §7）：修订后运行期面 = 核包档（`各带自己的批次档` 措辞，实核逐字）；核 ↔ 中文镜像 = **不同实现面**（多实现面纪律：语义同源、不做 byte-identical 硬一致）⇒ 原文的「双源同行逐字同」前提随 W2 消失，改为单面逐字锁 |
| 9 | VSC 产品档 = 门控强制改指 + W2 迁核注记，**不加变更记录行** | 档性 = 「迁移期参照历史（保留 ≠ 维护）」（D-C14 / 07:10 裁定）+ 同步面归核心两档（变更记录已落）；注记形态即迁移留痕。若父侧要 VSC 档各补变更记录行 ⇒ 另派（本单元零异议） |
| 10 | 入口注入置于 `activate()` **首语句**（先于 W8 护栏） | 注入必须「任何装配之前」（§2.13.8 调用期应用 ⇒ 仅顺序要求）；护栏判据 = 先于 `initLocale`/`new ChatPanel`（W8 用例锁），实证不受影响；顺序口径注记 ⇒ 上抛 4 |
| 11 | 审计 ④ AC-TD-2 收正形态 = 注记（非改写 AC） | AC 对象（vsix 含 25 档描述）随 W2 迁核——改「现体 = 核包 `tool-docs/` 25 档」保留 AC 语义；终态机判归 W17 收口笔（A-K11 断言 B+D） |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **MCP 描述 × fail-loud（新失效面 · 设计/核面）**：见裁决表 2——建议父侧登记「锚原语作用域」并裁决（核内收窄 / 端侧仅对核发布物应用 / 显式接受）。本单元按设计落地，零改动。
2. **提示词值内维护注记两处（内容权 · 主 agent）**：① `discipline-normal-finish` 括注 `main.md 迁入`（退役档名）；② `eng-coder-guidelines` 首行与核内 `:19` 重复。二者皆零行为改、设计明许/未禁 ⇒ 上抛由内容权方裁（可选终态：删括注取「仅标题」· 首行改「标题 + 独占 bullet」并把该句并入去重口径）。
3. **R24a「不新增 `.mjs`」口径**：本单元新增 `src/prompt-injections.mjs`（65 行）——读法 = 括号自限定「端壳缝」（承 W8 前置笔上抛 2 同型）；若父侧按字面覆盖 ⇒ 需三选一（内联 extension.mjs / 并入既有端壳档 / 维持现状），本单元零异议。
4. **「`activate()` 首步」两裁并立（文案面）**：W2 注入 vs W8 护栏皆书「首步」；实际顺序 = 注入 → 护栏。建议父侧在 §5 注记序（纯文案）。
5. **注释/诊断文案残留（射程外登记）**：`src/agent/run-helpers.mjs:54`/`:63` · `src/agent/tool-gates.mjs:82` · `src/conventions.mjs:90` · `src/agent-tools/verify.mjs:88`/`:94`（「`src/prompts/*.md` = 产品代码」举例）·
`src/agent/setup.mjs:372`（consult 缺失诊断句「Check the installation's prompts directory」——语义仍成立，实指核包）——他单元档（W4/W9/W12/W14/W15 面），随所属档触碰订正（承 CLI 先例同型登记）。
6. **VSC 产品档残留坐标（零门影响 · 实核）**：`docs/design/{VSC-PROMPTS,README,ADVISOR-CONVERGENCE,LEDGER-SELF-CONTAINED}.md` · `docs/requirements/MCP.md` 等仍含 `src/prompts/*.md:NN` 坐标——A3 判据对 `.md` token 按「同 basename 域内 ≥1」判定（`scripts/check-ledger.mjs:148-150`），basename 由保留的中文镜像 `docs/design/prompts/` 15 档保活；
`docs/design` + `docs/requirements` 内 `tools/*.md` 具名坐标 grep **0 命中** ⇒ 不构成悬空。登记为收口/文档维护批可选收正面。
7. **`thincoder-vscode/AGENTS.md` 双源陈述滞后**：`:15`/`:57` 仍述「`src/prompts/*.md` = 运行期落地物」——请父侧核对 W17 收口笔（A-K11 `AGENTS.md` ±4）是否覆盖此两处；本单元零触碰。
8. **核内双括注（核面 · 禁碰）**：`thincoder-core/prompts/discipline-engineering.md:172` 自带「（该节号 = CLI 侧；各端对应节号见本端）」+ 本端注入端说明 ⇒ VSC 装配同行两条同义括注；§2.13.2 `:1303` 机器守卫只覆盖「本端交付协议节 = §8」字样（核 `test/prompt-files.test.mjs:107`）⇒ 交父侧/核文档层。
9. **快层降级链夹具改指核包档的并发面（登记）**：`prompts-async-guidance` §3.4 两用例以「清空核包槽档 + 新实例重载」构造缺档——`--test-concurrency=6` 下与同批读核档的档（context-parity / eng-designer-role）存在**毫秒级窗口竞态**（CLI U2 已登记同型未决 4）⇒ 本单元四轮复跑未命中；归机检/测试所属批次，随收口裁定。

**轮次自证**：审计 1 轮（DIVERGENT · 4🟡 全落修）+ advisor 1 轮（pass · 0🔴）+ 修复轮 1（3 Fixed + 3 Deferred + 1 Not an issue + 1 部分 Fixed）；终态 **0 未决 🔴 → clean**。

**§5 收正注（同轮 · 首版后置 · 零语义）**：上「改动面」表行数口径统一为 `wc -l`（= 换行符计数）实核，四处读数就地收正（`git show HEAD~1` / `HEAD` 对照）——
① `extension.mjs` **151 → 157**（原书 152 → 158）；② `src/agent/setup.mjs` **464 → 465**（原书 465 → 465）；③ `src/tools/shared.mjs` **413 → 413**（原书 413 → 414）；④ `src/tools/index.mjs` **76 → 79**（原书 76 → 80）。
另补两档读数（表行 8 免重述）：`test/prompts-async-guidance.test.mjs` **176 → 326**（< 500 硬限；测试档档位口径）· `src/advisor/main.mjs` **320 → 309**（= 原书，复核实测一致）。

### 实施：S2 W5 —— CHECKPOINT 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：当前段 = **S2（VSC 迁移单元 W5 · 实施第二波）**。写域 = VSC 侧（删 3 档 / 改指 2 档）+ 核文档 2 档 + VSC 产品档 3 档；核包 `thincoder-core/**`、`thincoder-cli/**` 实现零触碰；台账 `docs/TODO.md` 与仓根 `scripts/**` 零触碰；本档 §1–§4/§6 零触碰。

**依据** = 本档 §2「W5 · CHECKPOINT」（`:141`）＋ 脚注注 1（`:116`）＋ 逐单元任务书四步块（`:121`）＋ 判据 A-K2/A-K4/A-K7/A-K8/A-K10；上游 = 本档 §4 用户批准（2026-09-15 15:12）；模块权威档同步面 = `docs/core/design/CHECKPOINT.md`（§6.9）。

**超声明披露（预期触碰面之外 · 均已如实登记）**：① `src/tools/git.mjs`（全入边扩面改指——决策透明表 1/2，任务书账面列「存活改指 0*」）；② `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md:1314`（删档锚致门控强制迁核注记）。

**改动面**（行数 = `wc -l` 口径实核；改前 = 父侧 `81288f77`）

| # | 档 | 行数（改前 → 改后） | 动作 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/tools/checkpoint.mjs`（删） | 451 → **0** | **删档**（核 `@thincoder/core/git/checkpoint.mjs`） |
| 2 | `thincoder-vscode/src/tools/git-checkpoint.mjs`（删） | 150 → **0** | **删档**（核 `@thincoder/core/tools/git-checkpoint.mjs`） |
| 3 | `thincoder-vscode/src/tools/git-ext.mjs`（删） | 174 → **0** | **删档**（核 `@thincoder/core/tools/git-ext.mjs`） |
| 4 | `thincoder-vscode/src/tools/git.mjs` | 378 → 378 | 3 处改指核 + 头注/注释收正（W14 存活面） |
| 5 | `thincoder-vscode/src/tools/shell.mjs` | 317 → 317 | 1 处改指核（脚注注 1 同笔）+ 头注与 guard 出处收正 |
| 6 | `docs/core/design/CHECKPOINT.md` | 212 → **216** | §1 两格 · §6.9 接线状态行与实现坐标 · §9 体量 · 变更记录 |
| 7 | `docs/core/requirements/CHECKPOINT.md` | 96 → **97** | §1 基线句 · §4.4 坐标 · 变更记录 |
| 8 | `thincoder-vscode/docs/design/CHECKPOINT.md` | 104 → 104 | 档头状态降级（迁移期参照历史）+ 迁核注记（行内，零行增） |
| 9 | `thincoder-vscode/docs/requirements/CHECKPOINT.md` | 48 → 49 | 权威源行 + 证据格迁核注记（含一处折行） |
| 10 | `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md` | 1425 → 1425 | `:1314` 迁核注记（零行增） |

**① 改指逐处（改前 → 改后）**

| # | 位置 | 改前 → 改后 |
|---|---|---|
| 1 | `src/tools/git.mjs:12` | `"./git-ext.mjs"` → `"@thincoder/core/tools/git-ext.mjs"` |
| 2 | `src/tools/git.mjs:13` | `"./git-checkpoint.mjs"` → `"@thincoder/core/tools/git-checkpoint.mjs"` |
| 3 | `src/tools/git.mjs:200` | 动态 `"./checkpoint.mjs"` → `"@thincoder/core/git/checkpoint.mjs"` |
| 4 | `src/tools/git.mjs:4-7/:359` | 头注「MIRROR of the CLI…」→ 核引用表述；尾注 → 「实现住核 `@thincoder/core/tools/{git-ext,git-checkpoint}.mjs`」 |
| 5 | `src/tools/shell.mjs:151` | 动态 `"./checkpoint.mjs"` → `"@thincoder/core/git/checkpoint.mjs"`（脚注注 1 同笔；计数归 W14 列） |
| 6 | `src/tools/shell.mjs:3/:6-7/:142-143` | 头注与 guard 出处 → 核表述（评审轮 1 收正：`@thincoder/core/tools/bash.mjs:96`） |

**② 删旧三条读数（删前全过才删）**

1. **改指已落盘**：全 4 入边（`git.mjs` ×3 + `shell.mjs` ×1）先落；删前快层实跑 = **633 / 592 pass / fail 0**。
2. **零引用机判**（域 = `src/` + `test/` + `scripts/` + `webview/` + `extension.mjs` + `extension.mjs`，282 档全递归；待删档本体排除）：模式① 引号相对形 = **0 命中**；模式② 行内基名提及（非核指向行）= **0**。
3. **文档锚**：VSC 域 `doc:check` 删后中间态 = **9 处悬空（A3，落 3 档 8 行）** → 逐处迁核注记 → **0 命中 / exit 0**；根域 `doc-anchors --domain .` = 悬空 **0**（候选 8131 · 注记豁免 457）。

**③ 复跑读数（终态实跑 · 原样 · cwd = `thincoder-vscode/`）**

| # | 命令 | 读数 | 判 |
|---|---|---|---|
| A | `npm test`（fast） | 633 / **592 pass / fail 0** / skip 41 | ✓（= 基线 633/592） |
| B | `npm run lint` | `check-syntax: 279 JS files OK` | ✓（基线 292 → −13 = 本笔 −3 + 并行 W7 −6 / W4 −4，皆删档） |
| C | `npm run test:full` | **633 / 633 pass / fail 0** | ✓（= 基线；中程 3 红皆并行 W4 在途，随其修复归零） |
| D | `npm run test:integration` | **28 / 28 · fail 0** | ✓（= 基线） |
| E | `npm run doc:check` | **命中 0 处 / distinct 0 · exit 0** | ✓ |
| F | 核回归 `node --test`（cwd = `thincoder-core`） | **178 / 178 · fail 0** | ✓（核零改动） |
| G | 仓根三机检 | 宽度 OK（404 档 · V1/V2/V3 新增 0）· 锚 悬空 0 · 台账 0 违规 | ✓ |

> **在途归因（读数如实登记）**：复跑期树内并行 W4/W7 在途（`src/ledger.mjs` · `src/mcp/*` 删除中）——中程出现 3 处测试档加载失败（`doc-anchors` / `ledger-check` / `reconcile-lookup`；根因 = 仓根 `scripts/check-ledger.mjs` 静态引 VSC 镜像，随后由父侧转为改态）与 VSC 域 18–27 处悬空（皆 ledger/MCP 面）——**本笔面全程零命中**；终态各读数已全部归位（见上表）。

**④ 专项验收（checkpoint 工具注册后行为 = 核实现 · 冒烟原样读数）**

- 注册面：`src/tools/index.mjs` `builtinTools` 含 `git` ✓（改指后实驱）。
- 工具行为（临时真 git 仓直驱 `gitTool.execute`）：
  `create` → `Checkpoint <id> created (2 file(s): 1 tracked, 1 untracked)`；`list` → 快照行 + F2 提示行；
  `versions` → `Historical versions of "readme.txt" (1, newest first):`；`cat` → 快照内原文；
  `rewind` → `Restored "readme.txt" (tracked) from checkpoint <id>.`；`commit` → 尾行 `(checkpoints cleared — commit is a new safety baseline)`。
- bash guard（`shell.mjs` 动态核导入路径实驱）：`git checkout -- .` → `[auto-protection] … snapshot <id> created BEFORE execution (1 file(s): 1 tracked, 0 untracked)…` ✓。
- 存储面 = 核 `configDir`（`~/.thincoder/checkpoints/<cwdHash12>/`）✓；冒烟产物已清理。
- 装载面：`package.json:33` 依赖在位 + 核 `exports: "./*"` ⇒ 子路径可解；新边静态闭包不触达 `node:sqlite`（全核仅 `memory/schema.mjs:9`）✓。

**⑤ 提交（单笔主体 + 两笔修正轮 · 均 `git commit --only`）**

1. **`a72f0fe8`**（单笔主体 · 10 档 / +35 −804 · 含 3 删档）：`refactor(vsc): W5 checkpoint - delete src/tools/{checkpoint,git-checkpoint,git-ext}.mjs, repoint git+shell to @thincoder/core, sync module docs`；回滚点 = `git revert a72f0fe8`。
2. `7bde488a`（审计轮 1 修正 · 3 档 / +8 −8）：VSC 两档迁核注记补齐 + 核档 §9 行数收正。
3. `de245d4c`（评审轮 1 修正 · 1 档 / +3 −3）：`shell.mjs` guard 出处收正为核 `tools/bash.mjs:96`。

**⑥ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **DEVIATIONS**（4×🔵 · 0 🟡/🔴）——部分实现 0 / 静默简化 0；四项 = ① 核档 §9 行数（214 vs 216 · **Fixed**）② VSC 产品档注记面未覆盖行（**Fixed**）③ `AGENTS.md` 文件地图（W17 面 · 登记）④ §5 缺口（本条即落）。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**（🔴 **0** · 🟡 4 · 🔵 1）。
- **裁决表（5 项）**：

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | 🟡 `shell.mjs:3`/`:142-143` 出处旧引（`thincoder src/tools/system.mjs:128`）——改指核 `@thincoder/core/tools/bash.mjs:96`（实核该行 = `gitGuardSnapshot`）；落 `de245d4c` |
| 2 | Deferred | 🟡 `docs/core/design/CHECKPOINT.md:131-132`（§6.8 统一后形态表「同（镜像实现）/（镜像）」残留）——与既有已登记 Deferred 同类（本档 `:1016` · 非 must-fix）⇒ 交父侧文档层一并裁 |
| 3 | Deferred | 🔵 冻结基线正文残留（VSC 设计档 `:7-9`/§5 标题裸名 · 核档 `:213-214` 历史条目）——两档自声明「迁移期参照历史 · 保留 ≠ 维护」，门禁零影响 ⇒ 随文档维护批可选收正 |
| 4 | Not an issue | 🟡 根闸中程 FAIL 7 悬空——逐行实核皆并行 W7 MCP 面（`docs/core/design/MCP.md:15/16/32/33/34/35`）；本笔面在两闸均 0 悬空，终态两闸已归零 |
| 5 | Deferred | 🟡 测试缺口触发（VSC 需求档 `:37`「补测触发 = 该面下次被触碰」）——任务书明写 W5 测试面随 W14、验收 = 核 178 用例 ⇒ 上抛父侧二选一（关闭触发注 ∥ W14 补 VSC 冒烟） |

- **修复轮 2**（审计轮 1 + 评审轮 1 各一波；皆已落盘并复跑）。
- **轮次自证**：审计 1 轮 + advisor 1 轮 + 修复轮 2；终态 **0 未决 🔴 → clean**。

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 改指面按 A-K4 反向判零扩至**全入边**（含 `git.mjs` 3 处；账面「存活改指 0*」= 扇入底账口径） | 删旧门强制「改指已落盘 ∧ 全链 exit 0 ∧ 零引用」；先例 = CLI U1 / 同批 W1「全入边 15 档」；备选 = 只改 shell ⇒ `git.mjs` 静态断链、全链红（否决） |
| 2 | `git.mjs` 改指在本单元同笔落（计数归 W14 列不双计） | 本档 §2 脚注注 1 口径（`:116`） |
| 3 | VSC 产品档 = 门控强制迁核注记（W1 先例形态），不改写正文 | 档性 = 迁移期参照历史（保留 ≠ 维护）+ 07:10 裁定；注记行经 P3 谓词实核豁免 |
| 4 | 核档同步只动 §1 两格 + §6.9 坐标/状态行 + §9 + 变更记录（机制条文零改） | 07:08 裁定「只收正形态」；§6.8 措辞残留另项（裁决表 2） |
| 5 | `shell.mjs` guard 出处按核实读收正 | 同批先例 = W1 决策表 2（注释非核指向 → Fixed · 复扫 0） |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **`thincoder-vscode/AGENTS.md:34/46/47`** 仍列被删三档（约定段「镜像实现」+ 文件地图行）——本档 `:449`/`:687` 已归 **W17 收口笔**（AGENTS.md 本体零触碰）；本单元零动作。
2. **`thincoder-vscode/docs/design/TOOLS.md:44/56/72` · `ARCHITECTURE.md:108`** 仍以 `git-ext`/`git-checkpoint` 指名——归 W14（`TOOLS.md §6.11`）/ W17 文档维护面。
3. **测试缺口触发已燃**（见裁决表 5）——上抛父侧。
4. **跨树引用观察（非本笔）**：复跑中程命中 `scripts/check-ledger.mjs` 静态引 `thincoder-vscode/src/ledger.mjs`（W4 删档致根脚本加载失败、连带 3 测试档红）——观测时点父侧已在转改态；本笔零触碰。
5. **孪生树陷阱（非本仓）**：`D:\teamcode\thincoder-vscode` 为未迁移陈旧树——工具/评审路径解析易落该树（本轮实测：相对路径首读即命中），建议后续任务书一律绝对路径（承 §5 W1 上抛 4 同型）。

### 实施：S2 W7 —— MCP 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：实施第二波 · 当前段 = S2（VSC 迁移单元 W7）。写域 = VSC 侧（删 6 档 / 端壳改指 5 档 / 端壳增量迁入 `panel-mcp.mjs` / VSC 产品档 4 档 + 1 行〔被并行笔顺带收录〕）+ 核仓模块权威档 `docs/core/design/MCP.md`。**核内实现零触碰**（`thincoder-core/**` 未动）；`thincoder-cli/**` 零触碰；台账 `docs/TODO.md` 与仓根 `scripts/**` 零触碰；本档 §1–§4/§6 零触碰（本条 = §5）。
**同批披露（共档/收录面）**：① `thincoder-vscode/src/agent/setup.mjs` 同档另含并行 W4 单元 expand-home 改指（收录时已在途）⇒ 本笔整档收录（承 W3 决策 1 先例）；② `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md:488` 的 W7 迁核注记随并行单元提交 `a72f0fe8`（W5）入库——本笔 `33a9e0a7` 未收录该档。
**依据** = 本档 §2「W7 · MCP」段（`:149`–`:151`）+「逐单元任务书」四步块（`:121`–`:122`）+ 验收判据 A-K1 · A-K3 · A-K4 · A-K8 · A-K10；模块权威档同步面 = `docs/core/design/MCP.md`（§6.10）；上游 = §4 用户批准（2026-09-15 15:12）。

**改动面**（行数 = `git show` / `wc -l` 口径实核）

| # | 档 / 集合 | 行数（改前 → 改后） | 动作 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/mcp.mjs`（删） | 12 → **0** | **删档**（re-export shim） |
| 2 | `thincoder-vscode/src/mcp/index.mjs`（删） | 420 → **0** | **删档**（客户端面——注册表/展开/调用/断开） |
| 3 | `thincoder-vscode/src/mcp/{http 256, stdio 140, utils 49, ws 130}.mjs`（删） | 575 → **0** | **删档**（三传输 + 基础件；空目录 `src/mcp/` 同批移除） |
| 4 | `thincoder-vscode/src/extension/panel-mcp.mjs` | 68 → **166**（+98） | **端壳增量迁入** + 面板契约投影（设计估「约 130±30」⇒ 实测 +6 超上限，如实登记） |
| 5 | `thincoder-vscode/src/extension/chat-panel.mjs` | 422 → 421 | 改指（`closeAllMcp` 并入 `./panel-mcp.mjs` import 行） |
| 6 | `thincoder-vscode/src/extension/panel-messages.mjs` | 498 → 498 | 改指（`:411` 动态 import → `./panel-mcp.mjs`——行数零变） |
| 7 | `thincoder-vscode/src/extension/settings.mjs` | 348 → 342 | 删 `../mcp.mjs` import + 删孤儿包装 `connectedMcpServers()`（唯一消费者 = panel-mcp，现直用 `mcpConnectedNames`） |
| 8 | `thincoder-vscode/src/agent/setup.mjs` | 465 → 465 | 改指（`:184` 动态 import → `../extension/panel-mcp.mjs` + `:178` 注释收正；同档含并行 W4 改指） |
| 9 | `thincoder-vscode/extension.mjs` | 157 → 157 | 改指（`:8` `closeAllMcp` → `./src/extension/panel-mcp.mjs`） |
| 10 | VSC 产品档 4 档（`docs/design/{MCP,AGENT-LOOP,ARCHITECTURE}.md` · `docs/requirements/MCP.md`） | MCP.md 169 → 177；余 3 档 ±0 | 悬空锚收正 + W7 迁核注记（详 ①） |
| 11 | `docs/core/design/MCP.md`（模块权威档） | 221 → **224** | §1 归属表 / §2.2 #144–#147 现状注 / §6.2 / §6.10（坐标 + payload 契约）/ §7 D-MC2 / §8.2 / 变更记录 |

**① 逐处「改前 → 改后」（改指 5 处 + 端壳增量）**

| # | 位置 | 改前 → 改后 |
|---|---|---|
| 1 | `src/extension/chat-panel.mjs:13`/`:23` | `from "../mcp.mjs"` 行删；`closeAllMcp` 并入 `from "./panel-mcp.mjs"` |
| 2 | `src/extension/panel-mcp.mjs:5` | `from "../mcp.mjs"`（4 名）→ 端壳自持：`import { connectMcpServer, probeMcpServer, _sessions } from "@thincoder/core/mcp.mjs"` |
| 3 | `src/extension/panel-messages.mjs:411` | `await import("../mcp.mjs")` → `await import("./panel-mcp.mjs")` |
| 4 | `src/extension/settings.mjs:16`/`:285` | `import { mcpConnectedNames } from "../mcp.mjs"` 删 + `connectedMcpServers()` 包装删 |
| 5 | `src/agent/setup.mjs:184` | `await import("../mcp.mjs")` → `await import("../extension/panel-mcp.mjs")` |
| 6 | `extension.mjs:8` | `import { closeAllMcp } from "./src/mcp.mjs"` → `from "./src/extension/panel-mcp.mjs"` |

端壳增量（`panel-mcp.mjs`：原 `src/mcp/index.mjs` 迁入面）＝ client-id 注册表（`clientIdFor`——id 按 name 稳定）·
`panelToolList`（**面板契约投影** `{ name, description, inputSchema }`——核原生工具 schema 取 `parameters`）·
`mcpConnect`（核 `connectMcpServer` 幂等 + 投影）· `connectMcpServersExpanded`（核原生工具面——depth-0 装配）·
`mcpConnectedNames` / `mcpConnectedToolCounts` / `mcpDisconnectByName` / `closeAllMcp`（按核 name-key `_sessions` 读/关；
关闭语义 = closed 标记 + transport close + 注册表移除，与核内 closeSession 同语义）。

**② 删旧三条读数（删前全过才删）**

1. **改指已落盘**：5 处改指 + 端壳面先落，其后删除、复跑——中间态零 `ERR_MODULE_NOT_FOUND`（端到端冒烟：批量装配 / 探活 / 计数 / 断开 / closeAll 全过）。
2. **零引用机判**（域 = `src/` + `test/` + `scripts/` + `webview/` + `extension.mjs` · 292 档全递归）：模式①（引号相对说明符解析落删除集）= **0 命中**（删后复扫同）；模式②（非 `core/` 前缀的 mcp 路径 token）= **1 处**——`src/advisor/loop.mjs:27` 注释历史叙事提及 `src/mcp/http.mjs`（他单元档、非引用——见「未决」2）。
3. **文档锚**：删前 VSC 域 `doc:check` 15 处悬空（本删除集 6 处 + 连带的 `_servers`/`anySignal` 符号锚）→ 逐处收正后 **0 命中 / exit 0**；根域锚同步收正（`docs/core/design/MCP.md` 7 锚悬空 → **0 悬空**）。

**③ A-K 读数（终态复跑 · cwd = `thincoder-vscode/`）**

| # | 命令 | 读数 | 判 |
|---|---|---|---|
| A-K1 | `npm test`（fast） | 633 / **592 pass** / fail 0 / skip 41 | ✓（= 基线 633/592/0） |
| A-K1 | `npm run lint` | `check-syntax: 279 JS files OK` | ✓（292 − 本单元 6 删档 − 并行单元在途删档） |
| A-K1 | `npm run test:full` | **633 / 633 pass / fail 0** | ✓（= 基线；中途一跑曾 632/1 fail——`T-DC6②` 源域零命中断言，归因并行 W4 在途文档面，其收尾后复跑全绿） |
| A-K1 | `npm run test:integration` | 28 / 28 · fail 0 · exit 0 | ✓（= 基线） |
| A-K1 | `npm run doc:check` | `V5: 命中 0 处 · distinct 0` · exit 0 | ✓（删前本单元面 15 处 → 0） |
| A-K2 | 核回归 `node --test`（cwd = `thincoder-core`） | **178/178** · fail 0 | ✓（核零改动） |
| A-K3 | 仓根三机检 | 宽度 **OK**（404 档零 >300）· 台账 **0 违规** · 锚 **0 悬空** | ✓ |
| A-K4 | 删除集零引用 | 模式① 0 / 模式② 1（登记项） | ✓（见 ②.2） |
| A-K10 | 模块权威档 | `docs/core/design/MCP.md` 收正在位（§1/§2.2/§6.2/§6.10/§7/§8.2/变更记录）+ 锚 0 悬空 | ✓ |

**④ 提交**：单笔 `git commit --only` ⇒ **`33a9e0a7`**（17 档 / +177 −1082 / 6 删档；`refactor(vsc): W7 mcp - delete src/mcp mirror, repoint to @thincoder/core + shell MCP face (panel-mcp)`）；回退点 = `git revert 33a9e0a7`。批次档未入本笔（父侧在途）。

**⑤ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **DEVIATIONS（2 🟡）**——① `docs/design/MCP.md` §7 段头三 transport 路径/档名未随收正；② §5 空白（本档未写 ⇒ 两处「删除记录 = 批次档 §5」指针暂悬）+ `loop.mjs` 残留无登记落点。两类均当轮落修（① 就地收正；② 本条即落）。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**changes-required**（🔴 1 · 🟡 4 · 🔵 2）。
- **裁决表（7 项）**：

| # | Action | Detail |
|---|---|---|
| 1 | **Fixed** | 🔴 面板展开器 payload 契约静默换形：`mcpConnect` 原样透传核原生工具（`parameters`、无 `inputSchema`）⇒ webview `settings-tools.js:284` 的 params 行消失。修 = 新增 `panelToolList` 面板契约投影（`inputSchema: t.parameters`、剔除 `execute`/`_mcpTransport`），`mcpConnect` 走投影、`connectMcpServersExpanded` 直达核 `connectMcpServer`（原生面不受影响）；冒烟复验（params 行回显 `text, n`；装配面原生工具 execute 可调）。 |
| 2 | Deferred | 🟡 端壳 reach-in 核私有面（`_sessions` + 自实现 closeSessionByName；核内 `closeSession` 未导出）——修点 = 核包（本批「不碰核一字」）⇒ 登记上抛（未决 3）。 |
| 3 | Deferred | 🟡 `thincoder-vscode/AGENTS.md:48` 文件地图行仍述删档（`src/mcp.mjs` + `src/mcp/`）——W1 同型（未决 1）登记，随 W17 收口笔范围核对。 |
| 4 | Fixed | 🟡 §2 W7 计数「存活改指 3」vs 实交付 5 档——本条 §5 改动面表按全入边 5 档登记（+ setup.mjs / panel-messages.mjs 两条动态 import 改指 + settings.mjs 删面）。 |
| 5 | Not an issue | 🟡 触碰档位软线（`panel-messages` 498 · `setup` 465 · `chat-panel` 421 · `settings` 342——均 >300 既有档）：本笔单行/单块替换，结构未变，R3 不升级（承 W1–W3 同判）；`panel-mcp` 166 为真增行面（表 5 已在册）。 |
| 6 | Deferred | 🔵 端壳 MCP 面无注册测试（`test/files.mjs` 无 mcp 条目；`test/fixtures/fake-mcp-server.mjs` 孤儿夹具）——既有缺口（删前镜像同零直连测试）、任务书无测试面条款 ⇒ 登记（未决 4）。 |
| 7 | Deferred | 🔵 `src/advisor/loop.mjs:27` 注释残留（他单元档）——登记（未决 2）。 |

- **修复轮 1**（🔴 收正 + 审计 ① 收正）：`panel-mcp.mjs` 68 → 166（含投影）；`docs/core/design/MCP.md` §6.10 + VSC `docs/design/MCP.md` §2 补 payload 契约登记。
- **轮次自证**：审计 1 轮（DEVIATIONS · 2🟡 全落）+ advisor 1 轮（changes-required · 1🔴 落修 + 4🟡/2🔵 裁决）+ 修复轮 1；终态 **0 未决 🔴 → clean**。

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 改指面 = 全入边 5 档（任务书计数列 = 3） | A-K4 零引用 + 删后中间态零断链；先例 = W1（18 档全改指）/ W3 决策 1；备选 = 只改 3 ⇒ `setup.mjs` 动态 import 静默失败（`catch` 吞——MCP 工具全轮缺失）。 |
| 2 | `settings.mjs` 删 `connectedMcpServers()` 而非改指 | 该包装唯一消费者 = panel-mcp（现直用 `mcpConnectedNames`）；保留 = 制造 settings ↔ panel-mcp 循环依赖；全域 grep 零引用实核。备选 = 保留包装并自 panel-mcp import（循环——否决）。 |
| 3 | 端壳面落 `panel-mcp.mjs`（任务书点名）承载全部端壳 MCP 增量 | §2 :255「不新增任何 .mjs（端壳缝全部并入既有端壳档）」；`connectMcpServersExpanded` 亦落此（agent 装配动态 import 可达）。备选 = 新建缝模块（违 §2 注——否决）。 |
| 4 | `mcpConnect` 返回 `tools` = 面板契约投影（非核原生工具） | 迁移前契约即 `{name, description, inputSchema}`（面板展开器消费面）；原生工具面归 `connectMcpServersExpanded`。代价 = 工具名显示为原生 `{server}_{tool}` 名（核面无原始工具表面）——已登记入 `docs/core/design/MCP.md` §6.10 + VSC docs/design/MCP.md §2。 |
| 5 | 端壳关闭按核 `_sessions` 办理（closed 标记 + transport close + 注册表移除） | 核为 name-key session 面、未导出 close-by-name（`removeMcpTools` 依赖工具表匹配——零工具 server 有洞）；备选 = `removeMcpTools` 合成 agent（洞：零工具/未命名 server 关不掉——否决）。 |
| 6 | 核 `_mcpHooks.reconnectDelays` 测试钩子随 `connectMcpServersExpanded` 不再显式引用 | 核内 scheduleReconnect 自持该表；端壳无叠加面（原 VSC 镜像的钩子导出无消费者）。 |
| 7 | VSC 产品档 = 门控强制锚收正 + W7 迁核注记（`已迁核——现体 …` 形态） | VSC 产品档 = 迁移期参照历史（D-C14）；锚门禁实数 15 处 → 0；注记形态经 `doc:check` 实核豁免。 |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **`thincoder-vscode/AGENTS.md:48` 文件地图行**（`src/mcp.mjs` + `src/mcp/` 两 token）仍述删档——承 W1 未决 1 同型；请父侧核对 W17 收口笔（A-K11 `AGENTS.md ±4`）是否覆盖文件地图段。
2. **`src/advisor/loop.mjs:27` 注释残留**（「本仓 `src/mcp/http.mjs` 同款 fallback 先例」——历史叙事、非引用）：该档属 W12 面，随所属单元触碰订正（承 W2 未决 5 同型）；A-K4 模式①零命中不受影响。
3. **核侧待补位：public close-by-name（+ 只读状态查询）**：端壳以 `_sessions` 读/关（与核内 closeSession 逐句同义，但为 reach-in）——建议后续核内笔导出公共面（端壳改为委托）；当前耦合形状已登记 `docs/core/design/MCP.md` §6.10。
4. **端壳 MCP 面零注册测试**（`test/fixtures/fake-mcp-server.mjs` 孤儿夹具）：任务书无测试面条款；是否登记冒烟用例 / 退役夹具请父侧裁量。
5. **并行面读数归因**：本笔复跑期恰逢并行 W4/W5 在途（中途一跑 `test:full` 632/1 fail = 其文档面未收尾），终态复跑全绿；`lint` 档数 −13 为并行删档合计（非本单元面）。

**§5 收正注（同轮 · 零语义）**：本段首版「端壳增量」散文行 1 行超宽（`docs/batches/2026-09-15-vsc-core-wiring.md` 落档时 :1300 · 461 chars）经**本席就地机械折行**（仅插换行 · 去空白逐字节相等 · 零语义）——承父侧折行先例（§2/§3）；批次档宽度/台账/锚三闸折行后复跑归 0。

### 实施：S2 W4 —— WORKSPACE 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：当前段 = **S2（VSC 迁移单元 W4）**。写域 = VSC 树（删 4 档 / 改指 12 档 / 重写 1 档 / 测试 5 档 / 产品文档 8 档）+ 核模块档 3 档 + **域外一笔（已披露）**：仓根 `scripts/check-ledger.mjs`（单行改指 + 注释面同步）。
**零触碰**：核内实现 `thincoder-core/**`（只读消费）· `thincoder-cli/**` · 台账 `docs/TODO.md` · 本档 §1–§4/§6 · 他单元文件。

**依据** = 本档 §2「W4 · WORKSPACE」行 +「逐单元任务书」四步块 + 验收判据 A-K1/A-K3/A-K4/A-K8/A-K10；上游 = `docs/core/design/CORE-UNIFICATION.md` §2.13.3（台账渲染面三缝值 `colors/pushLine/render`）· §2.6.2（五）零引用机判两模式。
**模块权威档同步面** = `WORKSPACE.md`（设计点名）+ `MULTI-INSTANCE-COLLAB.md`（实核零引用 ⇒ 零动作）+ `PORTABILITY.md` 两档（`conventions.mjs` 的模块档——07:08 裁定「改到哪模块收正哪模块的档」）；同批对齐（如实披露扩展面）+ `CORE-UNIFICATION.md` §2.8.1 指针面。

**改动面**（行数 = `git show 5faa4e0a --stat` / `wc -l` 口径实核；改前基准 = `33a9e0a7`）

| # | 面 | 档 / 量 | 动作 |
|---|---|---|---|
| 1 | VSC 删旧 | `src/{ledger,conventions,escape,expand-home}.mjs`（227+226+153+21 = **627 行**） | **删档**（`git rm`） |
| 2 | VSC 改指 | 12 档（来源串替换；具名导入面零改）——逐处见 ① | 改指 `@thincoder/core/<子路径>` |
| 3 | VSC 重写 | `src/extension/ledger-surface.mjs`（111 → 115） | 核机制 `runLedgerScan` + 三缝值注入（缝装配） |
| 4 | VSC 测试面 | 5 档——逐处见 ① | 改指核 + 缝注入断言（推送计数 = 行数） |
| 5 | VSC 产品文档 | 8 档（design 6 + requirements 2） | 迁核注记（19 处悬空锚 → 0；机制条文零改） |
| 6 | 核模块档 | 3 档 = `docs/core/design/WORKSPACE.md` · `docs/core/design/PORTABILITY.md` · `docs/core/requirements/PORTABILITY.md` | 状态行/坐标收正 + 变更记录行（机制条文零改） |
| 7 | 仓根脚本（**域外·披露**） | `scripts/check-ledger.mjs`（+5 −5 行面） | `:41` 改指核 + 注释面同步（决策透明表 1） |
| 8 | 共档披露 | `src/agent/setup.mjs`（`:25` expand-home 入边） | 该笔随 **W7 提交 `33a9e0a7`** 整档收录（本笔不含该档） |

**① 逐处「改前 → 改后」（来源串替换 + 注释同步——具名导入面零改）**

| # | 档 | 位置：改前 → 改后 |
|---|---|---|
| 1 | `src/advisor/main.mjs` | `:51` `"../escape.mjs"` → `"@thincoder/core/escape.mjs"`（`escapeLiteralEscapes`）；注释 `:7` / `:188` 同批换源 |
| 2 | `src/advisor/project-context.mjs` | `:24` `"../conventions.mjs"` → 核（`loadConventions`） |
| 3 | `src/advisor/repos.mjs` | `:12` → 核（`isCodePath`/`isDocPath`/`loadConventions`）；注释 `:5` / `:107` 同批换源 |
| 4 | `src/agent/run-helpers.mjs` | `:9` → 核（`isCodePath`/`loadConventions`）；注释 `:67` 同批换源 |
| 5 | `src/agent/setup.mjs` | `:25` `"../expand-home.mjs"` → `"@thincoder/core/expand-home.mjs"`（随 W7 笔收录） |
| 6 | `src/agent/tool-gates.mjs` | `:10` → 核；注释 `:84` 同批换源 |
| 7 | `src/agent-tools/advisor-async.mjs` | `:32` → 核；注释 `:124` 同批换源 |
| 8 | `src/agent-tools/advisor.mjs` | `:10` → 核；注释 `:220` 同批换源 |
| 9 | `src/agent-tools/verify.mjs` | `:31` → 核；注释 `:86` 同批换源 |
| 10 | `src/index-discover.mjs` | `:15` `"./conventions.mjs"` → 核（`DEFAULT_CONVENTIONS`/`loadConventions`） |
| 11 | `src/indexer.mjs` | `:20` → 核（`loadConventions`） |
| 12 | `src/provider.mjs` | `:9` + `:12`（import / re-export 两行）→ 核（`escapeMessages`；`stripLocalMessageFields` 转口） |
| 13 | `test/expand-home.test.mjs` | `:15` → 核（`expandHome`） |
| 14 | `test/ledger.test.mjs` | `:21` → 核（15 名：解析/计数/阈值/formatter/去重面） |
| 15 | `test/portability-vsc-classification.test.mjs` | `:15` → 核（7 名） |
| 16 | `test/portability-vsc-advisor-context.test.mjs` | `:17` → 核（3 名） |
| 17 | `test/portability-vsc-index.test.mjs` | `:20` → 核（2 名） |

**端壳缝装配（`src/extension/ledger-surface.mjs` 重写——§2.13.3 三缝值）**

- `colors`：`SEAM_COLORS = { warn: true, dim: false }`（面板渲染面无 ANSI——两值 = payload `warn` 位哨兵）。
- `pushLine`：逐行 `post(panel, { type: "ledgerNotice", lines: [{ text, warn }] })`；未送达 → 抛出 ⇒ 核内 `delivered=false` + 不记账（送达门保留；**推送计数 = 行数**）。
- `render`：item 刷新（text = L1 / tooltip = 明细行集 / aged>0 → 警示底 / 无台账 → hide；零点击命令）。
- 机制面（族扫描 / 变化行 / 送达门 / 记账）归核 `runLedgerScan`；端侧自持 item 明细面（tooltip 行集）+ 测试缝（`_setLedgerSurfaceForTest` 三键）+ item 建立/周期/释放生命周期。

**② 删旧三条读数（删前全过才删）**

1. **改指已落盘**：先改指、后删档、再复跑——中间态零 `ERR_MODULE_NOT_FOUND`（唯一例外 = 仓根 `scripts/check-ledger.mjs` 的跨目录入边，随本笔 `:41` 同落——见决策透明表 1）。
2. **零引用机判**（域 = `src/` + `test/` + `extension.mjs` + `scripts/` + `webview/`；删后复扫）：① 引号相对路径形 = **0 命中**；② 路径片段反向判 = 非核指向 **0**（余留 6 处 = 合成夹具 / 检查器脚本名 token，非引用——登记见「未决」4）。
3. **文档锚**：VSC 域 `doc:check` 删后中间态 = **19 处悬空**（本单元面）→ 逐处迁核注记 → **0**；仓根域一锚 = **悬空 0**。

**③ 复跑读数（终态实跑 · 原样 · cwd = `thincoder-vscode/`）**

| # | 命令 | 读数 | 判 |
|---|---|---|---|
| A | `npm test`（fast） | **633 / 592 pass / fail 0 / skip 41** | ✓（= 基线；用例零增删） |
| B | `npm run test:full` | **633 / 633 pass / fail 0** | ✓（= 基线） |
| C | `npm run test:integration` | **28 / 28 · fail 0** | ✓（= 基线） |
| D | `npm run lint` | `check-syntax: 279 JS files OK` | ✓（292 基线 − 4 本单元删 − 3 W5 − 6 W7） |
| E | `npm run doc:check` | `V5: 命中 0 处 · distinct 0` · exit 0 | ✓（本单元 19 处 → 0） |
| F | 核回归 `node --test`（cwd = `thincoder-core`） | **178 / 178 · fail 0** | ✓（= 基线；核零改动） |
| G | 仓根三机检 | 锚 候选 8130 · **悬空 0** · 豁免 457；宽度 404 档无 >300 · **新增 0**；台账 **0 处违规** · 基线 0 | ✓ |

**专项验收（A-K4 / 缝注入断言）**：① W4 删除集零引用 ✅（两模式复扫 0 / 0，见 ②）；② `ledger-surface` 面板推送计数 = 行数 ✅（`test/ledger.test.mjs` T107/T103：启动拍 2 行 → 2 条 `ledgerNotice` 逐行投放；第二拍变化行去重后 = 1 条）；
③ 三缝值逐缝在场 ✅（`colors` 哨兵 / `pushLine` 逐行抛出 / `render` item 刷新——行为六项：启动行门 · 送达门 · 去重记账 · item 形态 · `emit:false` 仅 item 径 · 测试缝三键全保留）。

**收正注（同轮 · 首版后置 · 零语义）**：本节首版 1 行超宽（`:1437` 302 字符）⇒ **仅插换行、文字零改**；复跑 = 宽度闸 0 行超 · 一致性新增 0。

**④ 提交**：单笔 `git commit --only` ⇒ **`5faa4e0a`**（33 档 / +101 −717；含 4 删档）；回滚点 = `git revert 5faa4e0a`。
（`src/agent/setup.mjs` 一档不在本笔——其两处改动随 W7 笔 `33a9e0a7` 收录，本单元 `:25` 行在其实内。）

**⑤ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **DEVIATIONS**——PARTIAL / SILENT-SIMPLIFICATION / 第三类未披露改动 三项未命中；命中 **OUT-OF-LIST 🟡**（`scripts/check-ledger.mjs:41` 域外一笔）+ **DOC-DRIFT 🔵**（同档注释面残留旧口径）。
- **advisor 代码评审 2 轮**（第 1 轮全量超时 ⇒ 第 2 轮窄化至三档 + 生产接线取证）：**pass**（🔴 **0** · 🟡 1（optional）· 🔵 3 + 域外备注 3）。
- **裁决表（4 项）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡（optional）emit 径族扫描翻倍：端侧明细面 + 核机制各扫一拍（每项目至多 2× `git blame`；无 view 照跑）。属缝设计固有（`render` 缝不带数据、端须自持明细面）——核侧收窄 = 核内笔超本批写域 ⇒ 登记（未决 1）；AC89 计数断言射程 = `emit:false` 径，维持不 pin 成本。 |
| 2 | Not an issue | 🔵 `_state.ledger` 在本端无读点：核签名要求 `state` 载体（`state.ledger` = L1 状态位）；本端 item 经 `render` 缝驱动 ⇒ 空转为无害形态。 |
| 3 | Not an issue | 🔵 AC89 计数断言只覆盖 `emit:false` 径：射程与判据句一致（该径即成本界值径）；pin 住 emit 径次数会阻碍将来核侧收窄 ⇒ 维持。 |
| 4 | Fixed | 🔵 测试标题陈旧（「四处挂载 + 样式族 + 本档入册」体仅断言入册——静态面随后续批次退役、标题未同步）：标题收正为「本档入册（files.mjs 显式清单——未入册 = 不跑）」（同批复跑 fast 633/592/0）。 |

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 仓根 `scripts/check-ledger.mjs:41` **域外一笔随本笔落**（`:41` 改指核 + 注释面同步） | 该行 import 被删档（VSC `src/ledger.mjs`）⇒ 不改则三处红：仓根台账闸 / VSC `doc:check`（引擎经 check-ledger 取判序）/ `test/ledger-check.test.mjs`。判据 = 审计「必要且最小」（1 行改指）+ 先例 = CLI U4 同档「域外·披露」+ 系统纪律「超声明 ≠ 越权，如实披露」。**备选** = 上报待父侧落笔（三闸维持红——否决）。如父侧裁「应由父侧落笔」⇒ 单笔 revert 该档即可。 |
| 2 | 改指面扩至删除集**全入边**（12 档 src + 5 档 test；设计点名 3 档存活面） | A-K4 反向判零 + 中间态零 `ERR_MODULE_NOT_FOUND`；先例 = W1（5→15 判定 CLEAN）· W3（改指 W10 目标）。含后续删除目标（`indexer`/`index-discover`〔W8〕· `provider`〔W10〕· `advisor/*`〔W12〕· `agent-tools/verify`〔W9〕· `agent/setup`〔W15〕）。 |
| 3 | 端壳缝 = 消费核 `runLedgerScan` + 三缝值注入（非「保留端侧副本 + 只改数据面」） | §2 W4「改指核 `ledger-surface.mjs` 后按缝装配」+ 专项「缝注入断言」；备选 = 照 CLI U4 保留本端机制副本（证伪：专项验收不可满足、F9 残留双份）。 |
| 4 | `pushLine` 逐行 post（非「单报文多行」批投） | 缝契约「每行以注入函数推送（计数 = 行数）」；送达门单相形态唯一保真（批投须两相投递 ⇒ 记账时序破）。webview 面零影响（T108 直驱两形态皆受）。 |
| 5 | item 面（tooltip 行集）端侧自扫一拍 | 核 `render` 缝不带数据（`state.ledger` 仅 L1）；端侧 tooltip 需族明细 ⇒ 端自扫（成本见裁决表 1）。 |
| 6 | 文档面扩至 `PORTABILITY.md` 两档（设计点名面外） | 07:08 裁定「改了哪模块收正哪模块的档」——`conventions.mjs` 的模块档 = PORTABILITY（§3.6 VSC 端镜像面 + 需求 F1/F2）；A-K10「VSC 端节坐标/状态行更新」；只落状态行/坐标，机制条文零改。 |
| 7 | VSC 产品档 = 迁核注记（「W4 已迁核——现体 `thincoder-core/…`」形态），不逐档加变更记录行 | 档性 = 迁移期参照历史（D-C14）+ 锚闸强制改指；先例 = W1/W2 同法。 |
| 8 | `MULTI-INSTANCE-COLLAB.md` 零动作 | 实核该档对本单元四档零引用（技能/规则/同伴面 ≠ 本单元删除集）——非缺，登记以免误判（审计同判）。 |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **emit 径双扫描成本**（裁决表 1）：核侧收窄（`render` 缝带 scans / 端侧免扫）为候选核内笔——超本批写域（核包禁碰）⇒ 上抛。
2. **核内注释滞后**：`thincoder-core/ledger.mjs:6`「VSC 端为独立实现、语义同源（不跨仓 import）」随 W4 失效（VSC 现经核单源）；同句被 VSC 需求档引为「在位事实」⇒ 核内注释收正 = 核内笔 / 父侧协调（审计 + advisor 双报）。
3. **CLI 侧同机制副本仍在**：`thincoder-cli/src/tui/ledger-surface.mjs:14` 自持 `runLedgerScan` 定义（数据面已走核 `:9`，机制面未并）——S2 单源化收尾面，非本批写域 ⇒ 上抛。
4. **合成夹具 / 脚本名 token（非引用 · 登记）**：`test/reconcile-lookup.test.mjs:59/61/66`（自建 tmp 夹具写出 `src/ledger.mjs` 供反查器用例）· `test/doc-anchors.test.mjs:126` · `test/fixtures/ledger-baseline.json:4` · `test/ledger-check.test.mjs:14`（皆为仓根检查器脚本名，非同档）。反向判两模式均不构成违规。
5. **设计档表行滞后**：`docs/core/design/CORE-UNIFICATION.md` §2.8.1 表 `:1719`（`thincoder-vscode/src/conventions.mjs` 226 行行）随删档失效；`docs/vsc/design/SETTINGS.md:58`（expand-home 坐标）同族 ⇒ 归设计面 / 文档维护批（非本批写域；根域锚闸零命中）。
6. **VSC 产品档未注记面**：`docs/design/ARCHITECTURE.md`（裸名 `escape.mjs` 等）· `docs/requirements/PORTABILITY.md` F4/F5 等档 — 实核零门影响（A3 判据射程外），登记为收口/文档维护批可选收正面（承 W1/W2 先例）。

**轮次自证**：审计 1 轮 + advisor 2 轮（含 1 轮超时重跑）+ 修复轮 1（裁决表 Fixed 1 项：测试标题收正；审计 DOC-DRIFT 注释面同轮收正）；终态 **0 未决 🔴 → clean**。

**段末复跑（§5 写入后 · 原样读数）**：见「收正注」段（写后即跑三闸复读）。

### 实施：S2 W6 —— CONTEXT-COMPACTION 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：实施第二波 · 当前段 = S2（VSC 迁移单元 W6 · CONTEXT-COMPACTION）。写域 = VSC 树 7 档（删 1 + 改 6）+ 文档 10 档（核档 3 + VSC 产品档 5 + 仓根 `docs/vsc` 1 + 核需求 1）；**核内实现零触碰**（`thincoder-core/**` 只读消费）· `thincoder-cli/**` 零触碰 · 台账 `docs/TODO.md` 与仓根 `scripts/**` 零触碰；本档 §1–§4/§6 零触碰（本条 = §5）。

**依据** = 本档 §2「W6 · CONTEXT-COMPACTION」段（`:146`–`:149`）+ 逐单元任务书四步块（`:121`–`:122`）+ 脚注注 1（`:117`–`:118`）+ 判据 A-K1/A-K2/A-K3/A-K4/A-K8/A-K10；上游 = §4 用户批准（2026-09-15 15:12）；
模块权威档同步面 = `docs/core/design/CONTEXT-COMPACTION.md`（§6.13）· `docs/core/requirements/CONTEXT-COMPACTION.md` · `docs/core/design/SEND-STALL-DISTILL.md`。

**超声明披露**（预期触碰面之外 · 均已如实登记）：① `thincoder-vscode/src/explore-distill.mjs`（头注订正 1 处——W15 面，随删档改指前收正）；② 文档面 10 档（四步块 ④「文档锚同批」+ 模块权威档同步计划 `:237` 强制面：核档 3 + VSC 产品档 5 + 仓根 `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` + 核需求档）——W1/W5/W7 先例同型。

**改动面**（行数 = `wc -l` 口径实核；改前 HEAD = `1dc43f2f`）

| # | 档 | 行数（改前 → 改后） | 动作 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/compact.mjs`（删） | 388 → **0** | **删档**（`git rm`） |
| 2 | `thincoder-vscode/src/agent/run-stages.mjs` | 339 → **350** | 压缩面整面改指核 `@thincoder/core/context.mjs` + 端差适配（见 ①） |
| 3 | `thincoder-vscode/src/agent/run-helpers.mjs` | 297 → **269** | `reinjectAfterCompaction` 收窄为端侧 AUTO 面（task/plan 回注归核）+ 删 `TASK_REINJECT_PREFIX` + 死 import 清理（修正轮 1） |
| 4 | `thincoder-vscode/src/extension/history-window.mjs` | 175 → **12** | 端壳转口：`export { … } from "@thincoder/core/history-window.mjs"`（#123 归核面单源） |
| 5 | `thincoder-vscode/src/extension/generate-title.mjs` | 87 → **25** | 端壳薄壳：key/provider 解析（presets）→ 委核 `generateTitle`（三格式分派 = 核内实现） |
| 6 | `thincoder-vscode/test/history-window.test.mjs` | 192 → **192** | import 改指核面（用例零增删） |
| 7 | `thincoder-vscode/src/explore-distill.mjs` | 156 → **157** | 头注订正（删档引用收正；W15 面·披露） |
| 8 | `docs/core/design/CONTEXT-COMPACTION.md` | 225 → **254** | W6 迁核收正（§6.13/§6.12/§6.11/§6.4④/§1/§9/变更记录——机制条文零改） |
| 9 | `docs/core/requirements/CONTEXT-COMPACTION.md` | — → **83** | §1/§4.3 迁核注 |
| 10 | `docs/core/design/SEND-STALL-DISTILL.md` | — → **154** | re-export 锚改指（2 处） |
| 11 | VSC 产品档 5 档（`docs/design/{CONTEXT-COMPACTION,ADVISOR-CONVERGENCE,ARCHITECTURE,SEND-STALL-DISTILL-TUNING}.md` · `docs/requirements/CONTEXT-COMPACTION.md`） | 逐档 ±N | 门控强制迁核注记（18 处悬空锚 → 0；机制条文零改） |
| 12 | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | 499 | A-VM28 坐标注（1 行） |

**① 改指逐处（改前 → 改后；run-stages = 核心面）**

- `:16` 删 `import { compactHistory, truncateFallback, COMPRESS_FAILURE_LIMIT, summarizeRunExplorations } from "../compact.mjs"` → `import { compressIfNeeded, compressFallback, COMPRESS_FAILURE_LIMIT } from "@thincoder/core/context.mjs"`
+ `resolveCompactThreshold`（`@thincoder/core/config.mjs`）+ `summarizeRunExplorations`（**`../explore-distill.mjs` 直引**——核 re-export 面签名不同，改指随 W15）。
- `checkAndCompact` 重写为端侧判定点封装（§2.13.4 #56 类）：阈值 = `resolveCompactThreshold(cfgCompactThreshold, provider).value`（档位随回合模型）；机制全归核（触发/摘要/降级截断/尾部预算/task+plan 回注/重建边界/基线失效）；
**端差适配（调用期）**：核读 CLI 载体名 `provider`/`tasks`/`planMode` ⇒ `agent.provider = provider` · `agent.tasks = agent._tasks ?? []` · `agent.planMode = agent._planMode === true`（核只读三键）；
核以新数组替换 `agent.history` ⇒ 端侧原位回收共享数组（面板同一引用；自定义属性随原位回收保留）；失败计数 + `onCompressFail` + `COMPRESS_FAILURE_LIMIT` 连败 → `compressFallback`（AbortError 透传保持）。
- `run-helpers.reinjectAfterCompaction`：task 列表 + plan 回注（含旧注入去重）归核 `applyCompression`；本函数只留端侧 AUTO 回注（`getAuto()` live 标志）；`TASK_REINJECT_PREFIX` 退休。

**② 删旧三条读数（删前全过才删）**

1. **改指已落盘**：run-stages/run-helpers/两转口/测试改指 + 文档面先落；删前快层实跑 = **633 / 592 / 0 / 41**。
2. **零引用机判**（域 = `src/` + `test/` + `extension.mjs` + `webview/` + `integration/` + `scripts/`；`*.mjs/*.js/*.json` 全递归）：模式①（引号相对说明符落删除集）= **0 命中**；模式②（非核指向 `compact.mjs` 提及）= 0（残留 4 处 = 注释——第 7 行档已收正 + explore-distill 2 处 + advisor/compaction.mjs 异档（W12 面））。
3. **文档锚**：删后中间态 VSC 域 `doc:check` = **18 处悬空（A2 6 + A3 12）** → 逐处迁核注 → **0 命中**；仓根域 `doc-anchors --domain .` = 悬空 **0**（中间态 2 处已收正）。

**③ A-K 读数（终态复跑 · 原样 · cwd = `thincoder-vscode/`）**

| # | 命令 | 读数 | 判 |
|---|---|---|---|
| A-K1 | `npm test`（fast） | **633 / 592 pass / fail 0 / skip 41** | ✓（= 基线） |
| A-K1 | `npm run lint` | `check-syntax: 278 JS files OK`（修正轮后 271——并行线删档浮动） | ✓ |
| A-K1 | `npm run test:full` | **633 / 633 pass / fail 0** | ✓（T-DC6② 中程红随文档面收正归零） |
| A-K1 | `npm run test:integration` | **28 / 28 · fail 0** | ✓（= 基线） |
| A-K1 | `npm run doc:check` | `V5: 命中 0 处 · distinct 0` | ✓（18 → 0） |
| A-K2 | 核回归 `node --test`（cwd = `thincoder-core`） | **178 / 178 · fail 0** | ✓（核零改动） |
| A-K3 | 仓根三机检 | 宽度 **OK**（404 档零 >300）· 锚 **0 悬空** · 台账 **0 违规** | ✓ |
| A-K4 | 删除集零引用 | 模式① 0 / 模式② 0（见 ②.2） | ✓ |
| A-K10 | 模块权威档 | 核档 3 档收正在位 + 变更记录在案；锚 0 悬空 | ✓ |

**专项验收（机判 + 冒烟）**：① 压缩判定点封装 = 端侧接线（`checkAndCompact` 直驱核 `compressIfNeeded`——两径冒烟见 ⑤）；② **预算端差收正**：VSC 旧 `SUMMARY_SEGMENT_ESTIMATE = 1100` 退场、单源 = 核 `SUMMARY_TOKEN_ESTIMATE = 1000`（核档 §6.4④/§6.12/§6.13 已收正）；③ webview 四态现状登记（核档 §6.13 `:182`–`:186`：四态文案 + 回调链 + 坐标不变）。

**④ 提交（主体单笔 + 修正轮 1 · 均 `git commit --only`）**

1. **`c90ddbdf`**（16 档 / +151 −776 · 含删档）：`refactor(vsc): W6 context-compaction - delete src/compact.mjs, repoint compaction/title/history-window to @thincoder/core + module docs`；回滚点 = `git revert c90ddbdf`。
2. `e9ea9bd1`（修正轮 1 · 2 档 / +3 −4）：`fix(vsc): W6 review round-1 - dead imports in run-helpers, core doc line-count re-anchor`。

**⑤ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **DEVIATIONS（0 🔴 · 1 🟡 · 2 🔵）**——部分实现/静默简化/断链三项全未命中（六面行为保真逐点实核：重建↔shrink 边界重置/基线失效/失败计数与 onCompressFail/onCompressStart→onCompress 转发/abort 透传/AUTO 回注）；
命中 = ① §5 未落（🟡 · 本条即落）② turn-model 未触碰且无可触碰面（🔵 · 任务书误归属——见「未决 2」）③ explore-distill + 文档面 = 非声明列档披露（🔵 · 见顶部披露）。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**（🔴 **0** · 🟡 7 · 🔵 3）。
- **裁决表（10 项）**：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 REVERSE 保护退场可达性：核面 `splitHistory` 无 VSC 旧档的 REVERSE 判据；核档 §6.11 的「CLI 侧有 `repairHistory` 保证顺序」论据**在本端不成立**（实核：全 `thincoder/**` 仅核 `agent/setup.mjs:49`/`helpers.mjs:226`/CLI 测试命中，VSC 零调用），且 VSC 设计档自述「VSC 历史流可产生倒序形状」⇒ 前提未证成。修点 = 核内笔（超本单元写域）或端侧切割前修复 ⇒ **上抛 1**；本段已登记回植候选 |
| 2 | Not an issue | 🟡 任务书「端壳改指 3」含 `extension/turn-model.mjs`——该档 27 行**零 import** 纯函数（模型/stamp 决策，与压缩面零依赖），无 compact 入边可改指 ⇒ 非漏项而是任务书该列与实况不符；§2 收正归 designer/父侧 ⇒ **上抛 2** |
| 3 | Fixed | 🟡 压缩后 task 回注端差（未登记）：核 `applyCompression` 回注 = 全量 `agent.tasks`（核 task 工具写时裁剪 done ≤3 支撑）；本端 task 工具尚不裁剪（W9 面）⇒ W9 前回注带全部 done 项。已在本段登记为过渡差（W9 后自消） |
| 4 | Deferred | 🟡 VSC 产品档残句（`:95` 回注段 / `:89` `<handoff_notes>` 形状 / requirements `:21` F-K5 判定句）仍述退场形态——档性 = 迁移期参照历史（保留 ≠ 维护）⇒ 文档层收正（父侧/维护批） |
| 5 | Deferred | 🟡 压缩面补测触发已燃（需求档 `:34` 自记口径）；本单元测试面口径 = 「改指 + context-parity 随 W15」⇒ 补测随 W15；两径冒烟读数入本段（见专项） |
| 6 | Fixed | 🟡 §5 缺 W6 段（核档 §6.13 前进引用悬空）⇒ 本条即落 |
| 7 | Not an issue | 🟡 `run-stages.mjs` 350 行 > 300 软线——advisory（R3：既有测试面同判不升级）；W15 删档 ⇒ 本段记「339 → 350 → 0（W15）」 |
| 8 | Deferred | 🔵 `explore-distill.mjs` 注释残留（`:4/:11/:106/:153` 提及已删档/CLI 路径）——W15 删档面，随该单元收正 |
| 9 | Fixed | 🔵 `run-helpers.mjs` 死 import（`readFileSync`/`resolve`/`dirname`/`fileURLToPath`）⇒ `e9ea9bd1` 清理（lint 复跑 OK） |
| 10 | Deferred | 🔵 VSC `test/history-window.test.mjs` 与核内同名测试近重复（改指核面后同断言）——本单元任务书指定「改指」；退役评估归测试纪律批/W15 |

- **两径冒烟（端差适配实驱 · 原样读数）**：① summary 径（stub SSE）——`agent.history === history` 原位回收 ✓ · 自定义属性保留 ✓ · 摘要 note + core 回注（task/plan）+ AUTO ✓ · `_runStartHistoryLen = 2` ✓ · `_lastCompressInfo.mode = "summary"` ✓ · 回调 start→done ✓；
② fallback 径（连接拒绝逼 3 连败）——`onCompressFail` → 计数达 3 → `compressFallback` ✓ · `mode: "fallback"` + tailMessages ✓ · 任务回注 + 基线失效归核 ✓。
- **轮次自证**：审计 1 轮 + advisor 1 轮 + 修正轮 1；终态 **0 未决 🔴 → clean**。

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 压缩面 = **整面取核**（`compressIfNeeded`/`compressFallback`）+ 端侧判定点封装 | §2.5 #162「融合：取一侧」+ 核面为 CLI 单源（U6 行集等值）；备选 = 端侧留副本（F9 双源——否决） |
| 2 | 端差适配三键 + 共享数组回收 = 调用期同指（非改 agent 载体） | 核读 CLI 载体名（`provider`/`tasks`/`planMode`）；本端载体 `_tasks`/`_planMode` 归 W9/W11/W15 归一 ⇒ 调用期适配面最小、W15 后自然退场；先例 = `agent.mjs:347-349`（W9 段同款调用期镜像） |
| 3 | `summarizeRunExplorations` 直引 `../explore-distill.mjs`（不取核 re-export） | 核 re-export 面签名不同（agent 载体 vs history 入参）⇒ 取核即须整面改写蒸馏面 = W15 职责（任务书「context-parity 族随 W15」同向） |
| 4 | `turn-model` 零改 + 上抛 | 该档无 compact 依赖（实核）——「按核 context 面接线」无可落地对象（见裁决表 2） |
| 5 | VSC 产品档 = 门控强制迁核注记（不改写正文结构） | 档性 = 迁移期参照历史 + W1/W5/W7 先例 |
| 6 | 核档 §6.13 收正为迁核后现状（含端差适配五面） | 07:08 裁定「改到哪模块收正哪模块的档」；机制条文零改（§6.11/§6.4④ 仅状态/坐标面） |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **REVERSE 回植候选**（裁决表 1）：可达性前提未证成（本端零 `repairHistory` + VSC 设计档自述倒序可产）——父侧裁（核内笔 / 端侧前修 / 监看登记）。
2. **任务书 W6 行误归属**（裁决表 2）：`§2 :146/:148 + 表 5 :432` 的 `turn-model` 项——designer/父侧收正。
3. **done-cap 过渡差**（裁决表 3）：W9 前回注全量 done——随 W9 自消（如需即时收口 ⇒ 端壳 task 工具补裁剪 = W9 面）。
4. **压缩面补测**（裁决表 5）：随 W15（context-parity 族）；冒烟读数已在案。
5. **VSC 产品档残句**（裁决表 4）+ `SEND-STALL-DISTILL-TUNING.md:11` 等裸名叙事残留：文档层收正（维护批）。
6. **孪生树陷阱（非本仓）**：`D:\teamcode\thincoder-vscode` 为未迁移陈旧树（`src/compact.mjs` 仍在）——工具/评审路径解析易落该树（本轮 advisor 引证核验 0/1 = 该 artifact），任务书已令全绝对路径（承前例）。
7. **并行线在途**：复跑期树内并行单元改动（advisor/* · config-io · settings* 等）未混入本笔（`git commit --only` 逐档核验）；lint 计数随并行删档浮动（278 → 271）。

### 实施：S2 W8 —— MEMORY 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**提交** = `a8d9e865`（单笔 · 40 档 · +852 / −2283 · 英文一行）；行数 = `git show a8d9e865 --stat` / `wc -l` 口径实核。
**写域** = VSC 树（删 5 源 + 3 测试 · 改 17 档 · 新建 1 档）+ VSC 产品档 9 档（退场注记）+ 根权威档 5 档（§6.9 收正 + 锚注）。
**零触碰** = 核内实现 `thincoder-core/**`（只读消费）· `thincoder-cli/**` · 台账 · 本档 §1–§4/§6 · 他单元文件。
**依据** = 本档 §2「W8 · MEMORY」+ A-K1/A-K2/A-K10/A-K12/A-K13/A-K14 · `docs/core/design/MEMORY.md` §3.1 A2 / §6.6–6.9 / §7 D-MEM14。

**改动面**

| # | 面 | 档 / 量 | 动作 |
|---|---|---|---|
| 1 | 删除集（源） | `src/{memory,embedding,index-bin,index-discover,indexer}.mjs`（273+102+44+173+456 = **1048 行**） | **删档** |
| 2 | 删除集（测试 —— 测试纪律①退役） | `test/{index-perception,index-ignored-slow,portability-vsc-index}.test.mjs`（237+122+156 = **515 行**） | **删档** |
| 3 | 句柄 / 护栏 | `src/embed-config.mjs`（+118）· `extension.mjs`（+6） | 重写句柄面 + 护栏接线 |
| 4 | 核面工具面 | `src/memory-tool.mjs`（365 → 92）· `src/tools/code.mjs`（153 → 65） | 执行器换核工具生成器 + 检索改写 |
| 5 | 面板 / 召回缝 | `src/extension/panel-index.mjs`（185 行面——读数换源 / 清退 / 重建 UX）· `src/agent/context-injections.mjs`（43 行面——`getMemory`/`docSearch`/`memorySearch`） | 换核面 |
| 6 | 端壳挂点 | `src/extension/{panel-chat,panel-session,panel-project}.mjs`（+3 / +5 / +3——`ensureMemoryHandle()`） | 句柄创建点 |
| 7 | 设置面 / webview | `webview/status-bar.js`（7）· `webview/settings-tools.js`（10——mismatch 分支退场）· `locales/{en,zh}.json`（各 3——`status.indexProgress`） | 收正 |
| 8 | 测试面 | 改 4 = `test/{context-parity,status-line,engine-floor-guard,files}.mjs` · 新 1 = `test/memory-index-face.test.mjs`（297 行 · 快 3 + 慢 4） | 缝名同步 / 机判新增 |
| 9 | 文档面 | VSC 产品档 9 档（退场注记 56 行面）· 根权威档 5 档 | 见 ① |

**① 文档面收正（逐处）**
- `docs/core/design/MEMORY.md`：§6.9 现状登记 → **W8 后实现面**（核 sqlite 句柄 / 护栏接线 / 检索面 / 重建面 / 工具契约端差 + 文件制面退场登记）· §9 行数 334 → **374** · 变更记录 W8 行。
- 根档锚注（W8 面悬空锚 8 → 0）：`design/MEMORY.md:16`/`:39` · `design/CORE-UNIFICATION.md:1734` · `design/PORTABILITY.md:139` · `requirements/MEMORY.md:161` · `requirements/PORTABILITY.md:30`/`:31`（注记形态 = 「W8 已退役 + 核面现体 `<路径>`」——根域 V5 注记标记集闭枚举内）。
- VSC 产品档退场注 56 行 / 8 档（design/{MEMORY,PORTABILITY,AGENT-LOOP,ARCHITECTURE,TESTING,WEBVIEW} · requirements/{MEMORY,PORTABILITY} · CAPABILITY_GAP——与 W1/W5/W7 同法）；`npm run doc:check`（VSC 域 · `--strict`）**W8 面命中 0**（余 52 = W9/W10 在途面）。

**② 验证读数（实测 · 2026-09-15）**
- `npm test`（快层）= **618 / 581 pass / 0 fail / 37 skip** ✓
- `npm run test:full` = 618 / 611 / **7 fail**——7 全 = `test/verify-redesign.test.mjs` × `thincoder-core/agent-tools/verify.mjs:266`（TypeError `reading 'length'`；**W9 在途核面笔**，非本单元面）
- `npm run lint` = 250 JS OK ✓
- `npm run test:integration` = 28 / 22 / **6 fail**——6 全 = scenario-01/06 × `verify` 工具文案（核 verify 文案 vs 端侧逐字断言；**W9 在途面**）
- `thincoder-core` `node --test` = **178 / 178 / 0**（A-K2 ✓ 核零改）
- 根域机检（本笔后）：`check-ledger` **0 违规** ✓ · `check-doc-width` 本档新增 0（余 5 行超宽 = 本档自身〔§3 轮次表〕——非本笔面）· `doc-anchors`（域一 · strict）**2 条**（=`design/AGENT-LOOP.md:56`〔W9〕· `design/PROVIDER.md:272`〔W10〕——本笔面 0）
- 本单元专项：`memory-index-face.test.mjs` 快 3 + 慢 4 全绿 · `memory-tool.test.mjs` 8/8 ✓ · `engine-floor-guard.test.mjs` 6/6 ✓（含「W8 契约②」静态闭包零 `node:sqlite` + 反证核记忆面自身可达）

**③ 审计与代码评审（会话内环 · AGENT-LOOP §18）**
- **内部分歧审计**（explore · 只读 · 1 轮）：代码面 8/8 兑现（护栏 / 句柄五件套 / 缝改名 / 清退 / 读数换源 / 设置面 / 删除集 / 用例面）；发现 3 条文档面偏差 → **全修**：`docs/design/WEBVIEW.md` 键面（新增 `status.indexProgress` 行 + 退场注）· `docs/requirements/MEMORY.md`（F-M5 证据列 + §4.7 端差「索引形态」行退场注）· `test/files.mjs` 注记计数（慢档三档 → 四档）。
- **内部 advisor 代码评审**（type=code · 1 轮）：终判 = **changes-required**（1🔴 + 3 必改/建议面 + 7🔵 · 总 12 行）。
- **fix round（评审后 · 同 token）**：🔴 档行数 501 → **499**（`panel-chat.mjs` 注释 3 → 1 行压缩；内容零删、句柄挂点不变）· `~` 展开缺陷修复（`embed-config.mjs` 两读点 + 守卫用例「①b」）· `memory-tool.mjs` 按名取核工具（抗核侧数组顺序变化）· 头注坐标收正（`extension.mjs:44-48` → `:47`）。
- **终态 = clean**（评审发现全收敛；余 optional 面按 Deferred 上抛父侧——见 ④/⑤）。

**④ 评审裁决表（12 行）**

| # | Action | Detail |
|---|--------|--------|
| 1 | Fixed | `panel-chat.mjs` 越 500 硬限（表 5 记 496 → 落笔后 501）——注释压缩 ⇒ **499 行**（`wc` 口径实核） |
| 2 | Fixed | `embed-config.mjs` `memoryDbPath()`/`projectMemoryDir()` 缺 `~` 展开（静默换库：与 CLI 不同库 + cwd 落 `~` 字面树）——补核展开器 `@thincoder/core/expand-home.mjs`（与 `thincoder-core/config.mjs:263-264` 同点）+ 用例 |
| 3 | Deferred | W8 实际触碰三档未登记（表 4 归位边 + 表 5 行数）——批次档写域属 designer/父侧 ⇒ ⑤ 上抛 |
| 4 | Deferred | `pushIndexStatus` null 语义（句柄未建窗口复用 webview「无 key」态 + 构建入口禁用）——设计面空白 ⇒ ⑤ 上抛 |
| 5 | Deferred | `maybePromptIndex` 无 embedder 门（提示条件变化未入设计档）——同上 |
| 6 | Deferred | A-K12 判据文本与「清退面必须引用 `.thincoder/index`」矛盾——文档层 ⇒ ⑤ 上抛 |
| 7 | Deferred | `docs/core/design/MEMORY.md` §6.6 vs §6.9「描述/参数面住哪」口径不一——设计档写域 ⇒ ⑤ 上抛 |
| 8 | Fixed | `memory-tool.mjs` 位置取工具 → 按 `name === "memory"` 取（抗顺序变化） |
| 9 | Deferred | `embed-config.mjs` 两套 config 读法（既有形态 · 非 W8 引入）——归 W16 config 归一 |
| 10 | Fixed | 头注坐标漂移（`extension.mjs:44-48` → `:47`） |
| 11 | Deferred | 超 300 软线被改档（`panel-session` 344 · `settings-tools.js` 368）——承表 5「拆分计划另议 / 消解条件 = 下次实质改动」，本 §5 即登记面 |
| 12 | Not an issue | 「A2 导入器未落」——设计裁定在案（§6.9 + 本档发现 11），非缺陷 |

**⑤ 上抛（父侧）**
- 批次档表 4/表 5/W8 受影响文件行请补登三档端壳触碰面：`src/extension/panel-chat.mjs`（496 → **499**）· `panel-session.mjs`（338 → **343**）· `panel-project.mjs`（93 → **94**）——归位边加〔·W8〕（W8 设计 :171 本身点名 `panel-chat.mjs` 句柄创建点）。
- 设计/文档面 optional 3 条：`pushIndexStatus` null 语义 + 构建入口显示 · `maybePromptIndex` 提示条件（无 key 亦弹、无去重）· A-K12 判据文本与清退面矛盾 ·（另）§6.6/§6.9 口径不一。
- **共档披露**：`docs/design/{AGENT-LOOP,WEBVIEW,PORTABILITY,ARCHITECTURE}.md` · `docs/CAPABILITY_GAP.md` · `test/{context-parity,files}.mjs` 含 **W9/W10 在途注记**（非本笔作者）——本笔按 W4 先例整档收录，如实披露。

**⑥ 决策透明表（实现期自决）**

| # | 决策 | 理由 | 备选 / 代价 |
|---|---|---|---|
| 1 | 旧目录清退 = 告示（memento 去重 · 恰一次）+ 显式 Delete 才递归删 · **零自动删除** | 用户裁定口径（§2 W8「零自动删除」）；不可逆操作须显式 | 备选：自动删（违裁定） |
| 2 | 构建入口 = 核 `gitSync` → 回退 `codeSync + docSync` | 与 CLI 启动同序（核 §6.4）；无锚时核侧返 null | 备选：仅 codeSync+docSync（丢 git 快路径 + 语义不同源） |
| 3 | `memory-tool.mjs` 自持描述/参数面（layer 两值端差）· 执行器取核生成器（按名） | 端差需要 + 执行语义单源 | 备选：全文取核（丢端差）；位置取（评审 #8 已否） |
| 4 | `~` 展开落端侧读取点 | 核展开器已导出 + 与核 config 同点（最小改） | 备选：等 W16 config 归一（其间静默换库——评审 #2 判不可） |

**⑦ 未落（如实）**
- A2 一次性导入器（`memory import`）——设计裁定「未落」（§6.9:283 + 本档发现 11 在案）；时序 = ≤ 落地版本发布前。
- VSC `AGENTS.md` 模块图（`src/memory.mjs` 等旧条目）未动——归 W17 收口笔（先例：W1–W7 皆未动）。

**补录笔（如实登记）** = `1decd99b`（2 档 · +148 / −228）——`src/extension/chat-panel.mjs`（清退告示委派 `_maybePromptLegacyIndexRemoval` + `maybePromptIndex` 入口）：`test/memory-tool.test.mjs`（核面重述 8 例）。首笔 `a8d9e865` 遗漏此二档 ⇒ 本单元提交形态 = **两笔**（主笔 40 档 + 补录 2 档；「单笔」形态偏离如实登记，内容零缺）。

### 实施：S2 W10 —— PROVIDER 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：当前段 = **S2（VSC 迁移单元 W10 · 实施第三波）**。写域 = VSC 树（删 8 档 / 改指 9 档 / 测试 8 档 / 文档 5 档）+ 核仓模块档 2 档（`docs/core/design/{PROVIDER,PROXY}.md`）；**核内实现零触碰**（`thincoder-core/**` 只读消费）· 台账 `docs/TODO.md` 与仓根 `scripts/**` 零触碰 · 本档 §1–§4/§6 零触碰（本条 = §5）。
**依据** = 本档 §2「W10 · PROVIDER」（`:181`–`:183`）+ 逐单元任务书四步块（`:121`–`:123`）+ 判据 A-K4 · A-K8 · A-K10（`:267`–`:273`）+ §2.5 #114/#115 已裁并集（`docs/core/design/PROVIDER.md` §2.1 A19/A20 行）。

**共档披露（在途单元收录面 · 逐条如实）**
- `thincoder-vscode/src/explore-distill.mjs`（chat 改指）随 **W6 提交 `c90ddbdf`** 整档收录——本笔不含该档；
- `thincoder-vscode/src/agent.mjs` 本笔整档收录——含并行 W9 载体适配 hunk（`provider/tasks/planMode/goal` 调用期镜像）；
- `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md` 本笔整档收录——含 W9 的 `batch-segment` 锚 hunk（`:1315`/`:1349`）；
- `thincoder-vscode/docs/{CAPABILITY_GAP.md,design/WEBVIEW.md}` 的 W10 迁核注记随 **W8 笔（`a8d9e865`/`1decd99b`/`e0974edb`）** 收录——本笔不含两档（其 W10 注记在库实核）；
- `thincoder-vscode/test/files.mjs` 三行 W10 改判注释（`:22`/`:42`/`:64`）随在途笔收录（本笔不收录——其表内 W8/W9 新档当时 untracked，收录会造不一致树；现已在库实核）。

**改动面**（行数 = `wc -l` 口径实核；改前基准 = `e0974edb`）

| # | 档 / 集合 | 行数（改前 → 改后） | 动作 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/provider.mjs`（删） | 426 → **0** | **删档**（→ 核 `provider/core.mjs`） |
| 2 | `src/provider/transports/{anthropic 247, google 264, openai 350, responses 415}.mjs`（删） | 1,276 → **0** | **删档**（→ 核 `provider/{anthropic,google,sse,responses}.mjs`；openai 面 = 核 core+sse 融合面） |
| 3 | `src/provider/{list-models 162, rate 156}.mjs`（删） | 318 → **0** | **删档**（→ 核同路径；#114/#115 并集面） |
| 4 | `src/proxy.mjs`（删） | 273 → **0** | **删档**（→ 核 `proxy.mjs` 融合形态） |
| 5 | `src/extension/settings.mjs` | 348 → 348 | 改指：`:16` list-models 核面 + `:192` 动态 import 核 `proxy.mjs` |
| 6 | `src/extension/provider-flows.mjs` | 220 → 220 | 改指：`:17` 核 list-models |
| 7 | `src/extension/settings-panel-write.mjs` | 153 → 153 | 改指：`:10` 核 list-models |
| 8 | `src/agent.mjs` | ±0（+W9 hunk） | 改指：`:5` chat → 核 `provider/core.mjs` |
| 9 | `src/advisor/{compaction.mjs, loop.mjs, main.mjs}` | 各 ±0 | 改指：`:12` estimateText → 核 rate · `:16` chat → 核 core · `:188-189` 注释收正 |
| 10 | `src/config-io.mjs` | ±0 | 注释面收正（`:6` 核 list-models） |
| 11 | `src/tools/web.mjs` | ±0 | 改指：`:8` `proxyFetch` → 核 `proxy.mjs` |
| 12 | `src/explore-distill.mjs` | ±0 | 改指：`:14` chat → 核 core（**随 W6 笔收录**） |
| 13 | 测试面 8 档 | 见 ①/③ | 改指/改判（`provider-timeout-semantics` 5→2 为例外） |
| 14 | 文档面 7 档 | 见 ③ | 迁核注记 + 模块档收正（2 档随 W8 笔） |

**① 逐处「改前 → 改后」（来源串替换 + 测试改判——具名导入面零改）**

| # | 位置 | 改前 → 改后 |
|---|---|---|
| 1 | `src/agent.mjs:5` / `src/advisor/loop.mjs:16` / `src/explore-distill.mjs:14` | `"./provider.mjs"` / `"../provider.mjs"` → `"@thincoder/core/provider/core.mjs"`（chat） |
| 2 | `src/advisor/compaction.mjs:12` | `"../provider/rate.mjs"` → `"@thincoder/core/provider/rate.mjs"`（estimateText；`:11` 注释同批） |
| 3 | `src/tools/web.mjs:8` / `src/extension/settings.mjs:192` | `"../proxy.mjs"`（静态/动态）→ `"@thincoder/core/proxy.mjs"`（proxyFetch） |
| 4 | `src/extension/{provider-flows:17, settings-panel-write:10, settings:16}` | `"../provider/list-models.mjs"` → `"@thincoder/core/provider/list-models.mjs"` |
| 5 | `test/provider-admission.test.mjs:5/:14` · `test/config-io-panel.test.mjs:15` | 改指核 list-models（含 `_resetAdmissionForTest` / `_setProbeImplForTest` 同源缝——注入面单例实核） |
| 6 | `test/trace-store.test.mjs:28/:141` · `test/integration/scenario-07:19` · `test/smoke-provider.mjs:9` · `test/integration/helpers/mock-llm.mjs:5` | chat 改指核 core（注释面同批收正） |
| 7 | `test/provider-model-guard.test.mjs:58-108`（F-1 四例） | `buildRequest` 直驱面（删档）→ 经核 `chat()` 真路驱动（守卫在 fetch 前生效——零网络）；F-2 家族（clone 现场 / byName / T28 / F-2d）原文保留 |
| 8 | `test/provider-timeout-semantics.test.mjs` | 全档改判：保留 T-MA1-1/2（经核 chat——signal 原样 + 相位参数）；退役 T-MA1-3/4/5（头注逐例载明理由） |

**② 删旧三条读数（删前全过才删）**
1. **改指已落盘**：全入边改指先落，删前快层实跑（本席实跑）——`npm test` **617 / 580 pass / fail 0**（涉面 + 全库零红）；删除后复跑同读数（中间态零 `ERR_MODULE_NOT_FOUND`）。
2. **零引用机判**（域 = `src/` + `test/` + `scripts/` + `webview/` + `extension.mjs` 全递归）：模式① 引号相对路径形 = **0 命中**；模式② 路径片段反向判 = 非核指向 **0 违规**（余留 = `src/advisor/provider.mjs` 同名自有档 2 处 + `smoke-provider.mjs` 文件名自指——登记非引用）。
3. **文档锚**：删除后 VSC 域 `doc:check` 首跑 **52 处**（A1 5 / A2 10 / A3 37）——其中 **26 处属 W9 在途面**（`src/agent-tools/*`）、**26 处属本单元面**（`src/provider*` / 符号锚 / 退役用例号）→ 逐处迁核注记后**本单元面归零**；终态全域 **0 命中**（W9 面亦已清零 · exit 0）。根域 `doc-anchors --domain .` = 悬空 **0**（终态）。

**③ 复跑读数（终态实跑 · 原样 · cwd = `thincoder-vscode/`；长测试落盘后查）**

| # | 命令 | 读数 | 判 |
|---|---|---|---|
| A | `npm test`（fast） | **617 / 580 pass / fail 0 / skip 37** | ✓（基线 633/592/0/41——Δ 见「未决 3」：本单元 −3 + 在途面） |
| B | `npm run lint` | `check-syntax: 250 JS files OK` | ✓（292 基线 − 本单元 8 删档 − 在途面删档） |
| C | `npm run test:full` | **617 / 609 pass / fail 8** | ✓ 本单元面零红；8 红全 = W9 在途面（`T-DC6②` doc-anchors 源域 + verify-redesign 七例） |
| D | `npm run test:integration` | **28 / 22 pass / fail 6** | ✓ 本单元面零红；6 红全 = `scenario-06-commit-verify`（verify 工具面 = W9 在途） |
| E | `npm run doc:check` | **命中 0 处 · exit 0**（首跑 52 → 本单元面 26 清零 → 终态全域 0） | ✓ |
| F | 核回归 `node --test`（cwd = `thincoder-core`） | **178 / 178 · fail 0** | ✓（= 基线；核零改动） |
| G | 仓根三机检 | 宽度 **OK**（404 档无 >300）· 锚 **0 悬空** · 台账 **1 处违规**（见「未决 1」） | 宽度/锚 ✓；台账 = 上抛 |
| H | 专项（面内 5 档实跑） | `provider-timeout-semantics` **2/2** · `provider-model-guard`+本档 **15/15** · `provider-admission` **14/14** · `trace-store`+`config-io-panel` **13/13** · `smoke-provider` 装载 OK（打印 preset 清单） | ✓ |

**④ 提交**：单笔 `git commit --only` ⇒ **`81e4b4c9`**（30 档 / +165 −2471 / 8 delete mode；`refactor(vsc): W10 provider - delete src/provider+proxy mirrors, repoint edges to @thincoder/core, reclassify tests, sync module docs`）；回退点 = `git revert 81e4b4c9`。

**⑤ 内部轮（发现与处置）**
- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **NO-DIVERGENCE**——四类（部分实现 / 静默简化 / 文档漂移 / 清单外改动）全未命中；附观察 5 条（核 ARCHITECTURE.md 模块图归属、§5 指针待落、台账悬留、邻树残留指称、−16 计数归属待对账）。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**（🔴 **0** · 🟡 5 · 🔵 2）。
- **裁决表（7 项）**：

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | 🟡 `docs/design/ARCHITECTURE.md` 同档内收正不一致——`:112` 已注 W10 迁核而模块图 `:72` / 支撑行 `:117` / 变更记录 `:160` 仍述删档：模块图后补「图注（W10 已迁核…）」（`:90-91`）、支撑行按 W7 同法改述（`:120`——含 W1/W4/W10 三档归属）、`:160` 补迁核注记；复跑宽度/锚零增。 |
| 2 | Fixed | 🟡 `thincoder-vscode/docs/design/PROVIDER.md` §4.3 部分收正——加节头注「W10 已迁核：本节 = 历史契约；驱动面 = test 头注；下文行号 = 迁核前 as-of」（`:186-189`）+ T-MA1-1/2 行改述驱动面（`:222-223`）。 |
| 3 | Deferred | 🟡 `docs/design/ADVISOR-CONVERGENCE.md:486` / `:495-496` 残留（`provider.mjs:31` / 四 transport 行号）——该档 = **W12 模块权威档列**（批次表）⇒ 随 W12 / 文档维护批按同档 `:488` W7 先例收正（本单元已在 A-K10 点名档收正，不越单元；见「未决 2」）。 |
| 4 | Deferred | 🟡 退役 T-MA1-3/4 的 idle 看门狗覆盖缺口——核 `readSSE` 看门狗无测试缝（VSC 侧不可稳定驱动），核测试树 grep（`_bodyIdleMs`/`READ_IDLE`/`idle timeout`）0 命中 **未证覆盖** ⇒ 上抛父侧向核侧核对（核测试面 = 超本批写域；见「未决 3」）。 |
| 5 | Deferred | 🟡 A-K8 用例计数归因——本单元自身 Δ = −3（`provider-timeout-semantics` 5→2，三处登记在案）；交付读数 617/580/0/37 vs 基线 633/592/0/41 的其余差额 = 在途 W8/W9 测试面增删（档级实核：删 4 档 −13 用例、新增 2 档 +7、档内改判若干）⇒ 父侧 §6 对账留证（见「未决 4」）。 |
| 6 | Fixed | 🔵 核 `docs/core/design/PROVIDER.md:266` 措辞「VSC 调用面保留传相位参数」——改述「VSC 调用面已无相位传参点——相位参数由核 chat 装配（核 `thincoder-core/provider/core.mjs:414-415` 实核）」（首改引入 `core.mjs:414-415` 裸名锚悬空 ⇒ 同行改全路径复跑归零）。 |
| 7 | Fixed | 🔵 `provider-timeout-semantics` 两例锁核装配面 fetch 选项形状——头注补「射程注」（`:13-14`：跨端契约锁；核侧若有对位可并入核测试树）；断言不动。 |

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 改指面 = **全入边**（任务书计数列 = 存活 3 档；实交付 9 档 src + 8 档测试） | A-K4 反向判零 + 删后中间态零 `ERR_MODULE_NOT_FOUND`；先例 = W1/W4/W5/W7「全入边」；备选 = 只改 3 ⇒ `agent.mjs`/`advisor/*`/`tools/web.mjs` 等断链、全链红（否决）。超设计点名数 = 如实披露。 |
| 2 | `explore-distill.mjs` 改指**随 W6 笔收录**（本笔不含） | 该档在途（W6 头注订正同档）⇒ 避免双笔共档回退纠缠；承 W3/W7 共档先例；本笔披露。 |
| 3 | `test/files.mjs` **不收录**（三行注释留待在途笔） | 该表含 W8/W9 未收录的新测试档条目 ⇒ 本笔收录会造「表引不存在的档」不一致树；测试注释非功能面 ⇒ 不阻塞本笔。终态已在库实核。 |
| 4 | 测试改判逐例判（测试纪律①）：`provider-timeout-semantics` 保留 2 / 退役 3 | 保留 = 调用面契约（signal 零合成 + 相位参数）；退役 = 镜像内部缝（`idleMs`，不可稳定驱动）+ 静态源文本（散文锚禁止形态）；`provider-model-guard` F-1 **改指核 chat 真路**（非退役——guard 仍在消费链上，核零对位用例）。 |
| 5 | 核 `PROVIDER.md §6.19` 端差段落**改述为「随迁核退役」** + 保留端侧验收面句 | 07:08「只收正坐标/状态行」；端差实体已由核承载（§6.3/§6.13），不重复机制描述（D2）。 |
| 6 | VSC 产品档 = 迁核注记（`已迁核——现体` 形态）逐点落位，不逐档加变更记录行 | 档性 = 迁移期参照历史（D-C14）+ `isNoteLine` 谓词实核豁免；先例 = W1/W2/W4/W5/W7。 |
| 7 | `AGENT-PARAMS.md §6.3` = **零动作**（坐标复核实核在位） | 本单元对 `advisor/compaction.mjs:33` / `loop.mjs:98` / `settings-panel-write.mjs:45/:112-116` 的编辑均 1:1 行替换、行号零漂移（实核）⇒ 无需收正。 |

**未决 / 越段发现（只记 ✗ · 未处置）**
1. **台账违规 1 处（父侧收正）**：`docs/TODO-archive.md:238`（归档条目「qwen 请求 thinking 未设置时携带 `thinking:{type:"enabled"}`」）证据路径 `thincoder-vscode/src/provider/transports/openai.mjs:53` = 本单元删除集 ⇒ 台账闸阻断（`check-ledger` = 1 处违规）。
   台账 = 父侧写域（本侧零触碰）⇒ **请父侧择一收正**：改证据为核现体（核 `provider/{sse,core}.mjs`——该 spec 默认面已迁核）或补「（W10 迁核）」注记形态。
2. **`ADVISOR-CONVERGENCE.md` 残留 3 处**（`:486` `provider.mjs:31` · `:495-496` 四 transport 行号）——W12 模块权威档列 ⇒ 随 W12 / 文档维护批（裁决表 #3）。
3. **idle 看门狗覆盖缺口（核测试面）**：退役的 T-MA1-3/4（判死 + 零误杀）无可稳定驱动缝；核测试树未见对位（grep 0 命中，未证覆盖）⇒ 请父侧向核侧核对/登记（裁决表 #4）。
4. **A-K8 计数归因**：本单元 −3 已三处登记；其余差额（617 vs 633）归在途面（W8/W9 档级 −13/+7 + 档内改判）⇒ 父侧 §6 对账留证（裁决表 #5）。
5. **`thincoder-vscode/AGENTS.md` 文件地图两行**（`:49-50` `src/provider.mjs` / `src/provider/rate.mjs`）+ `:30`（`isNonRetryableError in provider.mjs` 约定句）——承 W7「未决 1」同型；请父侧核对 **W17 收口笔范围** 是否覆盖文件地图（A-K11 点名 = 约定段 ±4）。
6. **核 `docs/core/design/ARCHITECTURE.md:93` 模块图行**（审计观察）仍列 VSC `src/provider.mjs`/`src/provider/**`（+ `{memory,embedding,indexer,mcp,repomap}.mjs` 等 W7/W8 面）——该档不在本单元模块权威档列 ⇒ 归收口笔/文档收正轮，登记待派。
7. **孪生陈旧树陷阱**（非本仓）：`D:\teamcode\thincoder-vscode` 未迁移——本笔全程绝对路径（`d:/teamcode/thincoder/thincoder-vscode/**`）核读与落笔，零误写（收正注：本笔无跨树事故）。

**轮次自证**：审计 1 轮（NO-DIVERGENCE）+ advisor 1 轮（pass · 0🔴）+ 修复轮 1（Fixed 4 / Deferred 3）；终态 **0 未决 🔴 → clean**。

### W9 · AGENT-TOOLS 登记面（eng-coder 交付记录 · 2026-09-15）

**交付摘要**：删 VSC 自持工具登记面 13 档（`src/agent-tools.mjs` barrel + 12 子档），全面改指核登记册 `@thincoder/core/agent-tools.mjs`（§2.13.4 #83 单一来源）；装配面 `src/agent/setup.mjs` 以**动态** `await import()` 取核册 14 名（静态链会经 consult/subagent 族触达 `node:sqlite` ⇒ 破 W8 契约②，engine-floor-guard 机判）；
载体镜像（plan/task/goal 三族 CLI 名 ⇄ 端名，调用期镜像）· digest 预算单源（键适配 `digestBudgetKey(history)`）· batch_segment 记账缝（`configureBatchSegment({ onWrite })` ⇒ `_touchedFiles`）落地；
测试面改指核（batch-segment / verify-redesign 保留、read-history-guard 退役）+ 新增登记册装配断言档 `test/agent-tools-registry.test.mjs`；VSC 产品档 9 档补「W9 已迁核」注记（判据零改）；根档 `docs/core/design/AGENT-LOOP.md` §6.18 增「自持工具登记面（#83）」行 + 变更记录。

**提交**：`99d2824b`（43 档 · +299 / −1527）。单笔 `git commit --only`；脚本复读确认 `git status` 本单元面清零。

**验收读数（绿态采集时点 · 提交前）**
- `npm test`（快层）= 618 tests / 581 pass / **0 fail**
- `npm run test:full` = 618 / 618 / **0 fail**
- `npm run test:integration` = 29 / 29 / **0 fail**（含本单元新增 goal 载体镜像用例）
- `npm run lint`（check-syntax）= 250 JS 档 OK
- `npm run doc:check`（VSC 域 · strict）= **0 命中**
- 核回归 `node --test`（cwd = thincoder-core）= 178 / 178
- 删除集零引用机判（自写反向扫描：src + test + scripts + webview + extension.mjs = 250 档）= **0 悬空 import**
- 根域三闸：`check-doc-width` OK · `check-ledger`（TODO.md）OK · `doc-anchors --domain .` = 1 悬空（`docs/core/design/PROVIDER.md:266 core.mjs:414-415`——W10 在途面；本单元名下锚已清零）
- **共享工作树观察（非本单元面）**：上列读数采集后，W11（SESSION）在途编辑使 `src/extension/session-slots.mjs:24` 引核 `slotOccupancy`（核无此导出）⇒ 快层 41 红，**同一根因**；与 W9 面无关（W11 落地后应自消）。

**决策透明表**
| 决策点 | 取值 | 理由 / 否决替代 |
|---|---|---|
| 核册载入形态 | `hydrateRun` 内 `await import()`（动态） | 静态 import 令核登记册入端壳静态闭包 ⇒ 经 consult→subagent-async→spawn-child→core/agent.mjs→memory.mjs 可达 `node:sqlite`（W8 契约②）；核册头注同款动态先例 |
| 载体差处置 | 调用期镜像（批前写 CLI 名 / 批后回填端名） | 承 W6 `run-stages.mjs:174-178` 先例；门禁 / 槽持久化 / 面板回调三消费面零改；W11/W15 载体归一后退场 |
| goal 回填判定 | 引用不等 **或** status 值变化（双判据） | 审计 finding #2：核 goal 工具**原地**改状态 ⇒ 纯引用判定恒假、终态词（complete→done / blocked）不可达、面板不推 |
| digest 预算键 | `digestBudgetKey(history)`（WeakMap 合成稳定键） | 核键 = 传入对象、以 `history.length` 判轮；端历史逐轮新建 ⇒ 需稳定键承载轮界定语义 |
| 落盘目录 / tag | 核 `configDir/tool-results` + tag `#`→`_` 净化 | 核单源；旧端面 `<cwd>/.thincoder/tmp` 退役 |
| 测试退役面 | `test/read-history-guard.test.mjs` 退役 | 自述「CLI 镜像」、零端侧内容、核单源后与本端面同驱动 ⇒ 冗余即删（测试纪律①默认退役）；behavior 面由核测试 + 集成承接 |
| 产品档处置 | 9 档仅加「W9 已迁核」注（判据零改） | 迁移期参照档须去「在位」形态（残留即示范）；且 doc:check A3 须可解析 |
| `read-history-discovery.mjs` | 未触碰 | 批次档 §2 观察项 9：其 import 面 = `extension/session-io.mjs`（W11 端壳档）——非删除集扇入，不代改 |

**内部审计（explore 分歧审计 · BLOCKING）= 1 轮 · DEVIATIONS 2（均 🟡）——全 Fixed**
| # | 类别 | 位置 | 期望 vs 实得 | 处置 |
|---|---|---|---|---|
| 1 | DOC-DRIFT | `thincoder-vscode/docs/design/READ-HISTORY-SPLIT.md:50` / `:71` | 以「在位」形态登记已删实现（read-history 档）与已退役测试（read-history-guard）| **Fixed**——两行补「W9 已迁核」注 + 变更记录行（判据零改） |
| 2 | PARTIAL | `thincoder-vscode/src/agent.mjs:364`（原守卫） | 守卫 = 引用不等；核 goal **原地**改状态且前置镜像已令 `goal === _goal` ⇒ 恒假 ⇒ `onGoal` 终态推送不可达 | **Fixed**——值变化双判据（`_goal` 引用 ≠ 或 status ≠）+ 新增集成用例 `scenario-01`「goal set→complete ⇒ onGoal active→done」 |

**审查对象声明**：target = W9 交付面（13 删档 + 12 改指源档 + 6 测试档〔含 1 新增〕 + 9 文档档）；reason = 交付验证；exclude = 他单元在途面（W8/W10/W11/W12/W13 各自清单）。

**内部代码评审（advisor · code · 同步内评）= 1 轮 · VERDICT: pass（无 🔴）· 引用校验 1/1 通过**

发现处置（5 项：2 🟡 非 must-fix + 3 🔵）：
| # | 级别 | 位置 | 处置 |
|---|---|---|---|
| 1 | 🟡 | `src/agent-tools/read-history-discovery.mjs`（118 行）在 W9 后零消费者（唯一入边 = 被删的 VSC `read-history.mjs`；核 `agent-tools/read-history.mjs:42` 取核自有 session-slots）——档头 `:5` 自述与 `AGENTS.md:43` 叙述同时失效；该档不在删除集 ⇒ 不入反向判零机检 | **Deferred（父侧裁）**——任务书 §2:179 写「保留」；删除 = 设计面动作，须父侧/设计择一（① 随 W9 同笔删〔核单源已承接，与 W8 索引族同判〕② 保留则登记孤儿态 + 指派 W11/W15 消费点并去「在位」叙述） |
| 2 | 🟡 | `agent.mjs` ≈419 / `agent/setup.mjs` ≈488 / `subagent-async.mjs` ≈467 行（超 300 软线，非本单元引入） | **Deferred（登记）**——三档皆在 W13/W15 删除集，随删档清零；承 W6 段判例不升级 |
| 3 | 🔵 | `test/files.mjs:82` 注记把「静态闭包零 node:sqlite」机判记在登记册测试档名下（实指 `test/engine-floor-guard.test.mjs:81`） | **Fixed**——同笔注释收正（`git` 小笔：单档 1 行） |
| 4 | 🔵 | `AGENTS.md:39` 模块图仍列已删 `src/agent-tools.mjs` barrel（`:43` 同族叙述亦失效） | **Deferred（登记）**——归 W17 收口笔（W8 §5 ⑦ 先例；W10 未决 5 同题在请父侧确认文件地图是否入 W17 范围） |
| 5 | 🔵 | `docs/design/READ-HISTORY-SPLIT.md:30` / `:51` 发现面两行仍「在位」形态（:`50`/`:71` 已补注） | **Deferred（同 #1 同笔）**——随 #1 裁决一并落注 |

**评审给证面（advisor 实核通过，摘录）**：13 档确删且全树无残留相对 import（命中全为 `@thincoder/core/...`）· `src/agent/setup.mjs:160` 动态载核册 14 名 · `src/agent-tools/index.mjs:8` = 纯 `export *` 转口 · 记账缝签名与核 `agent-tools/batch-segment.mjs:215 injectedOnWrite?.(agent, abs)` 一致（`ctx.agent` 由 `execute-tools.mjs:195` 供）·
digest 预算四族同键且四处 `persistOverflowReport` 皆 `await`（核侧 async——不漏 await 为正确点）· W9 载体镜像双判据（`agent.mjs:369`）与集成用例在位 · `tool-gates.mjs:70` 门禁读双键闭合同批窗口 · §6.18 + 变更记录收正 · 专项验收三项（删除集零引用 / 登记册 14 名断言 / verify·batch-segment 行为面）逐条可证。

**评审环境说明（advisor 登记）**：孪生陈旧树 `D:\teamcode\thincoder-vscode` 未迁移——按相对路径解析会读入 W9 前镜像（评者首轮即命中），评审已改以真实树 `D:\teamcode\thincoder\thincoder-vscode` 绝对路径取证；评审期 `## Project Standards` 未声明档 ⇒ 方法学合规按 Project Guide + 评审标准判（限制如实登记）。

**终态**：审计 1 轮（2 🟡 全 Fixed）+ 评审 1 轮（pass；#3 同轮 Fixed，#1/#2/#4/#5 登记待父侧裁）——**clean**（无未决 🔴；待裁项已上抛父侧）。

### 实施：S2 W11 —— SESSION 单元落轮（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：实施第三波 · 当前段 = S2（VSC 迁移单元 W11 · SESSION · 端壳改指面 · **零删**）。写域 = VSC 树 5 档
（`thincoder-vscode/src/extension/{session-io, session-slots, session-slot-write, session-gc, panel-session}.mjs`）+ 模块权威档 1 档（`docs/core/design/SESSION.md`）。
**核内实现零触碰**（`thincoder-core/**` 只读消费）· `thincoder-cli/**` 零触碰 · 台账 `docs/TODO.md` 与仓根 `scripts/**` 零触碰 ·
本档 §1–§4/§6 零触碰（本条 = §5）；并行在途单元（W9/W10/W12/W14 面）档零触碰。

**依据** = 本档 §2「W11 · SESSION」段（`:185`–`:188`）+ 逐单元任务书四步块（`:121`–`:123`）+ 判据 A-K1/A-K2/A-K3/A-K8/A-K10；
上游 = `docs/core/design/CORE-UNIFICATION.md` §2.6.3 U11 行（「存储契约不变 · A14 以 CLI 为准」）；
模块权威档同步面 = `docs/core/design/SESSION.md`（§6.15）；§4 用户批准（2026-09-15 15:12）。

**超声明披露**（设计点名面之外 · 均已如实登记）：① `docs/core/design/SESSION.md` 另含 §4 第 3 行坐标收正（1 行——决策透明表 8）；
② `panel-session.mjs` = 头注 +5 行（零逻辑改——决策透明表 2）；③ `deleteSlotAndUpdate` 补核同源步 `unlinkRecordStore`（决策透明表 1）。

**改动面**（行数 = `wc -l` 口径实核；改前 = 提交前 HEAD `1decd99b`）

| # | 档 | 行数（改前 → 改后） | 动作 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/session-io.mjs` | 436 → **169** | 自持会话实现退场（读槽/写槽/列表/标题/双线工具转口核面）+ 端壳四落点保留 |
| 2 | `thincoder-vscode/src/extension/session-slots.mjs` | 399 → **138** | 同上（路径/manifest/属主/认领全量转口）+ marker 层保留 |
| 3 | `thincoder-vscode/src/extension/session-slot-write.mjs` | 177 → **91** | 开关写面转口核 + （cwd, slot）型 token 台账三式保留 |
| 4 | `thincoder-vscode/src/extension/session-gc.mjs` | 142 → **16** | **纯转口**（含启动钩子——见 ②） |
| 5 | `thincoder-vscode/src/extension/panel-session.mjs` | 343 → **348** | 头注（W11 接线面说明）+0 逻辑改——会话调用面经端壳转口核面 |
| 6 | `docs/core/design/SESSION.md` | 365 → **387** | §6.15 补「W11 接线面」+ 坐标收正 + §4 第 3 行 + 变更记录一行 |

**① 改指逐处（改前 → 改后——来源串替换 / 实现体转口）**

| # | 位置 | 改前 → 改后 |
|---|---|---|
| 1 | `session-io.mjs` 头 | 自持实现（`loadSlot`/`saveSessionToSlot`/`setSlotTitle`/`listSlots`/`slimForDisplay`…）→ 转口核：`loadSlotFile as loadSlot` · `saveSlotData as saveSessionToSlot` · `renameSlot as setSlotTitle` · `listSlots` · `slimForDisplay` · `isLegacyTransient`（核 `@thincoder/core/session.mjs` + `session-slot-write.mjs`） |
| 2 | `session-io.mjs` 端壳四落点 | `resumeSlot` / `newSlot` / `switchToSlot` / `deleteSlotAndUpdate` 保留自持**但改核原语**：`loadSlotFile`（核）· `slotOccupancy`（核）· `loadManifest/saveManifest/writeSessionFile/slotDigest`（核经端壳）+ 端壳 marker 写 |
| 3 | `session-slots.mjs` | 自持 manifest/认领/哈希/迁移（399 行）→ 15 名核转口（`export … from "@thincoder/core/session-slots.mjs"`）+ `slotOccupancy` 自核 `session.mjs`；保留 = marker 层 + `sessionsDir()` + `resumeSlot` |
| 4 | `session-slot-write.mjs` | 四个 `setSlot*` + `newSlotData` → 核转口；`engTokensMergeForSave` → `mergeEngTokensForSave`（核名）；保留 = token 三式 + `loadSlotForWrite` |
| 5 | `session-gc.mjs` | 全量转口（三保留期常量 + `gcResidue` / `listColdCwds` / `deleteColdCwd` / `runSessionGc` / `scheduleSessionGC`） |
| 6 | `panel-session.mjs` | 头注说明（会话机制面单源 = 核，本档只承面板装配/消息面）+ import 面零改（全部名面仍自 `session-io` 端壳解析） |

**② 端壳保留面（端差两款 + 端侧自有 ×3）**（详 `docs/core/design/SESSION.md` §6.15「W11 接线面」）：
① end marker 层（`END = "vscode"` · `endMarkerPath` / `readEndMarker` / `writeEndMarker`）+ 四个维护落点——核对应件（`resumeSlot` / `newSession` / `switchToSlot` / `deleteSlot`）写死核端 marker `.cli`，直接消费 = **跨端互写**（§6.10 D-1/D-4/D-SE9/D-SE10 反例）⇒ 端壳按本端 marker 自持；
② （cwd, slot）型 token 台账三式（`setSlotEngDesignTokens` / `readSlotEngDesignTokens` / `clearSlotEngDesignToken`）——核 token 面为 **agent 型**（`token-ttl.mjs`），无核对位件；
端侧自有：`loadModelPrefs`/`saveModelPrefs`（workspaceState 非会话文件）· `stripTruncatedToolArgs`（核内私有件、未导出——与核 `applySession` 机读线播种同规则）· 面板装配面（`panel-session.mjs` 全档）。

**③ A-K 读数（终态复跑 · 原样 · cwd = `thincoder-vscode/`；读数随并行在途浮动，逐列归因）**

| # | 判据 | 读数（本笔窗口） | 现态复跑（并行在途） | 判 |
|---|---|---|---|---|
| A-K1 | `npm test`（fast） | 633 基线口径 → 树内实际 **618 / 581 pass / 0 fail / 37 skip**（改造前后逐数一致） | 614 / 566 pass / **11 fail** / 37 skip | ✓ 本笔面（11 全 = W9/W10/W12/W14 面：`batch-segment.test.mjs` 的 `readSource is not defined` · `provider-model-guard` F-2b/T28 驱动核 `advisor/run.mjs` · T-VG19/T-FZ*/T-B6 族） |
| A-K1 | `npm run lint` | `check-syntax: 250 JS files OK` | 231 JS OK（在途删档） | ✓ |
| A-K1 | `npm run test:full` | **618 / 618 pass / 0 fail** | 612 / 600 / 12 fail（同上族） | ✓ |
| A-K1 | `npm run test:integration` | **29 / 29 · fail 0** | 29 / 29 · fail 0 | ✓ |
| A-K1 | `npm run doc:check` | **V5 命中 0 处 · exit 0** | 66 命中——**全 = `src/tools/*`（W14 在途删档）**，本笔面 0 | ✓ |
| A-K2 | 核回归 `node --test`（cwd = `thincoder-core`） | **178 / 178 · fail 0** | 178 / 178 · fail 0 | ✓（核零改动） |
| A-K3 | 仓根三机检 | 宽度 **OK**（404 档零 >300）· 台账 **0 违规**· 锚（域一 · `--domain .`）**0 悬空** | 锚全域 28 悬空（全 = `src/tools/*` 面 W14 在途）· 宽度/台账照旧 ✓ | ✓（本笔面 0） |
| A-K8 | 未涉面用例逐数不变 | 本单元面 6 档 **61 / 59 pass / 0 / 2 skip**（= 改造前基线）· 消费方 7 档 67 / 65 / 0 / 2（= 基线）· 合并 13 档 123 / 115 / 4（4 = 在途面） | — | ✓ |

**专项验收（机判 + 冒烟 · 原样读数）**：
① **会话开关/恢复/GC 行为 = 核面**：`newSlot` → 槽文件在盘 + 本端 marker `.vscode` 写入 + **核端 `.cli` 未写** ✓；`gcResidue`（核实现 · 端壳沙箱缝）→ 40 日残留删除、活跃槽现场保留 ✓；`listSlots` 读数（messageCount/turnCount）✓；`sessionsDir()` 命中沙箱且 = `dirname(sessionPath)` 单源 ✓。
② **载体双夹具跑 `AGENT-LOOP.md` §2.3 状态机断言**：核 `test/suspension.test.mjs`（CLI 形 `agent` 字段对象 / VSC 形 `history` 字段对象两夹具）+ `test/async-family.test.mjs` 复跑 **14 / 14 · fail 0** ✓；另机判 = 槽文件序列化零载体键（`_asyncSubagents`/`_asyncQueue` 等 10 字段不入 v2 槽文件）✓。
③ **存储契约 version 1/2 不变**：路径/字段集/双线结构/marker 后缀 `.vscode` 逐项实核 ✓（与 CLI 共文件）。

**④ 提交（单笔）**：`git commit --only` ⇒ **`168f8037`**（6 档 / +225 −938；
`refactor(vsc): W11 session - repoint session-*/panel-session shell to @thincoder/core (keep VSC end-marker layer), sync module doc`）；
回滚点 = `git revert 168f8037`。批次档未入本笔（父侧在途）。

**⑤ 内部轮（发现与处置）**

- **审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **DEVIATIONS**——AC1（改进指）/ AC2（零删档 + 消费面完整）/ AC3（存储契约）/
AC4（跨端 marker 隔离：VSC 码路径不可达 `.cli` 写者）/ AC6（§6.15 坐标可达）**CLEAN**；AC5/AC7（测试档零改写 / 清单外改动）
受无 git 面限制**未独立复验**（如实登记）。四项 = ① `deleteSlotAndUpdate` 缺核同源步 `unlinkRecordStore`（🟡）
② `scheduleSessionGC` 保留副本的正当性待核（🔵）③ 端壳 `resumeSlot` 无裸 v1 单文件兜底未入 §6.15 端差登记（🔵）
④ 代码头注「见 §5」登记面待落（🔵）。
- **advisor 代码评审 1 轮**（`type=code` · 阻塞）：**pass**（🔴 **0** · 🟡 3 · 🔵 3）。评审独立复验：核符号逐名在场 + 签名相符
（含 `slotOccupancy` 返回 `{occupied}` · `renameSlot` `{ok,reason}` · `gcResidue({dir,prefix})`）· 与 W11 前孪生树逐函数行为等价
（四落点 / `saveLines` 字段集 · `slimForDisplay` 300/500 · `stripTruncatedToolArgs`）· 静态闭包不达 `node:sqlite`
（核内仅 `memory/schema.mjs:9`）· `unlinkRecordStore` 具 try/catch 无抛错风险。
- **裁决表（10 项 —— 审计 4 + 评审 6）**：

| # | Action | Detail |
|---|---|---|
| 1 | **Fixed** | 🟡（审计①/评审）`deleteSlotAndUpdate` 缺核同源步：补 `unlinkRecordStore(slotPath(cwd, slot))`（核 `deleteSlot` §14.3.8 同源步——共享会话目录卫生语义单源；核内件 `session-store.mjs:376` 具 try/catch + `force` 无抛错风险）+ §6.15 登记 |
| 2 | **Fixed** | 🟡（评审①/审计②）`session-gc.mjs` 保留副本理由与核实现不符：核 `scheduleSessionGC` 实为沙箱感知（`base = sessionPath(cwd)` → `gcResidue({ dir: dirname(base), prefix: basename(base) })`——核 `session-gc.mjs:100-108`）⇒ 端壳副本零行为差 ⇒ **整档改纯转口**（含钩子；142 → 16 行）+ §6.15 ② 改述（原「核钩子沙箱盲」句删除；真端差 = 核原语**默认参数** `dir` 为核内 configDir 版） |
| 3 | **Fixed** | 🟡（审计④/评审②）「见 §5」登记面：本段同批落三条（未决 1–3）+ §6.15 端差 ① 补注「端壳无核 `resumeSlot` 的裸 v1 单文件兜底」 |
| 4 | **Fixed** | 🔵（评审④/审计③）死 import（双清单漂移面）：`session-io.mjs` 10 名 + `session-slots.mjs` 6 名清理——本地 import 只留体内使用者，转口统一 `export … from`（导出面逐名零变） |
| 5 | **Fixed** | 🔵（评审⑤）`SESSION.md` §4 第 3 行坐标失效（原指 CLI/VSC 各自内置迁移，W11 后端壳面已无该实现）⇒ 收正为核单源坐标（`thincoder-core/session-slots.mjs:58-61`） |
| 6 | **Fixed** | 🔵（评审⑥）`SESSION.md` §6.15 两处：绑定入口「面板 `status`（激活启动）」→「`openSessionContent`（webviewReady 快段——B2 后绑槽归快段，`status` 慢段不绑槽）」；GC 目录缝行号表述随 ② 改述 |
| 7 | Deferred | 🟡（评审③）`panel-session.mjs` 348 行 > 300 软线——**既有超软线档**（本档 §2 表 5 已登记「拆分计划另议 · 消解条件 = 下次实质改动」；本笔零逻辑改、仅头注 +5）⇒ 维持登记（未决 4），R3 不升级 |
| 8 | Not an issue | 🔵（评审）孪生树 `D:\teamcode\thincoder-vscode` 作为「W11 前基线」取证 —— 非本仓、非评审对象；其对照结论已并入 ①–⑥ 证据链 |
| 9 | Not an issue | 🔵（审计）`resumeSlot` 数据层无裸 v1 兜底 = **非回归**（W11 前孪生树同缺）——登记为端差（未决 3） |
| 10 | Not an issue | 🔵（审计）`usableSlot` 用核 `slotOccupancy` 表达（同进程属主排除语义一致）——行为等价，非简化 |

- **修复轮 2**（审计派生一波 + 评审派生一波；皆已落盘并复跑）——本笔窗口内 `npm test` / `test:full` / `test:integration` / 核回归逐数仍与基线一致。
- **轮次自证**：审计 1 轮 + advisor 1 轮 + 修复轮 2；终态 **0 未决 🔴 → clean**。

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | `deleteSlotAndUpdate` 补 `unlinkRecordStore`（核同源步） | 审计派生；核 `deleteSlot` 的 §14.3.8 联动步（共享会话目录卫生单源）；备选 = 维持基线（孤儿 sidecar 残留）——核语义已定，取对齐 |
| 2 | `panel-session.mjs` 零逻辑改（仅头注） | 五档「内部改指核面」的组合经 `session-io` 端壳转口达成（本档 = 面板装配/消息面，零自持会话算法；机读线选择规则与核 `applySession` 同规则但核未导出该内联件——见未决 5） |
| 3 | 四落点 = 核原语 + 端壳 marker（非消费核 `resumeSlot`/`newSession`/`switchToSlot`/`deleteSlot`） | 核件写死 `END = "cli"`（核 `session-slots.mjs:71`）⇒ 直接消费 = 跨端互写；§6.10 D-4 明列「VSC 镜像」= 设计内形态；备选（消费核件）违 D-SE9/D-SE10 |
| 4 | `setSlotTitle` → 核 `renameSlot`（manifest 摘要由「合并 title」改核 `slotDigest` 全量重算 + `ts` 刷新） | 核契约 `{ok, reason}` 逐项同枚举；差异 = 摘要刷新面（无测试断言；`listSlots` 消费面零变）——如实登记 |
| 5 | `saveSessionToSlot` → 核 `saveSlotData`（轮转判据多 `diskForeign` 一项 + 原子写） | 核面 = 单源；`diskForeign` 为**增强**（异 cwd 现场先轮转不覆盖）；`activeModel` 键在场性改为「非空才写」（`listSlots` 复合判 falsy——显示等价） |
| 6 | `sessionsDir()` = 核 `sessionPath` 反推（`dirname`） | 核未导出根访问器；替代原硬编码 `join(homedir(), ".thincoder", "sessions")`——生产同径（核 `configDir` = `config-io.mjs:32`）且随核 `_setSessionsDirForTest` 沙箱缝；消费方 = 跨 cwd 发现 / peers 根 |
| 7 | `switchToSlot` 占用判定改用核 `slotOccupancy` | 同语义（排除本进程属主）；核版重读 manifest = 更新视图（并发窗口更准） |
| 8 | `SESSION.md` §4 第 3 行随笔收正 | 「改到哪模块收正哪模块的档」（07:08 裁定）+ 该行坐标随 W11 失效；只收正形态、机制条文零改（如实披露于段首） |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **核 marker 面参数化候选**：核 `END`/`endMarkerPath`/`readEndMarker`/`writeEndMarker` 为编译期单值 + `cleanDeadOwners`/`usableSlot` 私有 ⇒ 端壳无法零行为差消费核 `resumeSlot`。候选核内笔 = `resumeSlot(cwd, { end })` 形态；落点 = 后续核内笔（本批核内零触碰）。
2. **（cwd, slot）型 token 台账三式的核内补位候选**：核 token 面为 agent 型（`persistEngTokens(agent)` / `readEngTokensFromSlot(agent)` / `reconcileEngTokensFromSlot(agent)`）——端壳保留该三式（§6.15 端差 ②）。
3. **端壳 `resumeSlot` 无裸 v1 单文件兜底**（核 `loadLegacyFile`）——**已实证非回归**（W11 前孪生树同缺）；是否补齐 = 设计面裁定（登记于 §6.15 端差 ①）。
4. **`panel-session.mjs` 348 行 > 300 软线**——既有超软线档（`thincoder-vscode/docs` 台账 + 本档 §2 表 5 在案）；消解条件 = 该档下次实质改动时拆分。
5. **面板机读线选择规则未转口**：`activeLines` 的「`contextHistory` 长 > 0 才当机读线，否则 `history.map(stripTruncatedToolArgs)`」= 核 `applySession` 内联规则（核未导出该件）⇒ 端壳保留同形副本（`session-io.mjs` `stripTruncatedToolArgs`）——候选核内导出位。
6. **并行在途面读数**（见 ③ 现态列）：W9（`batch-segment.test.mjs` 的 `readSource` 未定义）· W10/W12（`provider-model-guard` F-2b/T28 驱动核 `advisor/run.mjs`）· W14（`src/tools/**` 20 档删除致 doc:check 66 命中 + 锚 28 悬空）——**本笔面全程零命中**；交父侧归因。
7. **VSC 产品档坐标残留**：`thincoder-vscode/docs/{design,requirements}/SESSION.md` 的证据列（`session-slots.mjs:47-60` 等）随 W11 失效——档性 = 迁移期参照历史（D-C14 保留 ≠ 维护）⇒ 可选收正面归文档维护批（承 W1/W5/W7 先例）。
8. **`read-history-discovery.mjs` 现为孤儿档**（W9 删 `agent-tools/read-history.mjs` 后无入边）——W9 面；本笔保持其 import 面（`sessionsDir` / `normalizeCwd`）在位。
9. **实施读数收正**：本档 §2 表 5 对 W11 五档估「+0~+40/档」，实测为**强净减**（436→169 · 399→138 · 177→91 · 142→16 · 343→348）——§2 表自注「实施读数落 §5」，此处如实登记。

**段末复跑（§5 写入后 · 原样读数）**：见「收正注」段（写后即跑三闸复读）。

**收正注（同轮 · 首版后置 · 零语义）**：本段首版 2 行超宽（批次档 `:1895` 369 / `:1896` 372 字符）经**本席就地机械折行**（仅插换行 · 文字零改）——承父侧折行先例（§2/§3/§5 W2 块）；复跑 = 批次档宽度 0 行超 · 一致性 V1/V2/V3 新增 0 条。

**段末复跑（§5 写入后 · 原样读数）**：`check-doc-width` = 本档 **0 行 >300**（余 1 行 = `thincoder-vscode/docs/design/EDIT.md:3`——W14 在途面）· 一致性新增违规 **0**；
`check-ledger` = `OK: thincoder/docs/TODO.md` / `OK: thincoder/docs/TODO-archive.md` · **0 处违规** · exit 0；
`doc-anchors --domain .`（域一）= 0 悬空（本笔面；全域复跑 28 悬空 = `src/tools/*` W14 在途面）。

### W14 · VSC 工具实现面迁核 + `shared.mjs` 拆壳（eng-coder 实施轮 · 2026-09-15）

**交付摘要**：VSC 端 19 档工具自持镜像删除、装配面/薄壳改指核单源、端侧 10 缝按端注入、测试改指、模块权威档同步收正。
提交：`06686ecb`（代码面 32 档 · +403/−3992）· `a354e026`（文档面 24 档 · +255/−234）。

**改动面（逐项）**

1. **删（19 档）**：`thincoder-vscode/src/tools/{checklist,edit-diff,edit-fuzzy-match,edit-line-params,execute,file-edit,file,git,hashline-edit,linter,lsp,more-file,ops,question,read_image,search,tree,wait_for,web}.mjs`
→ 核 `@thincoder/core/tools/{file,edit-diff,edit-batch,patch,search,ops,git,lsp,execute,question,tree,web,linter,checklist}.mjs`。
2. **保留（6 档）**：`tools/{index,shell,code,context,focus}.mjs` = VSC 装配面（`index.mjs` 承载工具清单 + git 只读分类端装饰 + LSP 宿主桥）；
`tools/shared.mjs` = **拆壳薄壳 200 行**（413 → 200，设计目标「约 150±50」内）：
端侧 4 缝供值 `configureWritePath{openDoc,isDirty,applyEdit}` / `configureExecRun{run}` / `configureProcessTreeKill{killTree}` / `configureTreeResolve{resolve}`
+ VSC 专属 helper（getOpenDoc/refreshMarkdownPreview/applyEditorEdit/applyEditorRangeEdit/killProcessTree/runInterruptible/resolvePath/MAX_STREAM_BUF）。
3. **缝接线（agent 面）**：`agent/setup.mjs` 增 `wireAgentToolSeams()`（hydrateRun 内调用）
——`configureSkillLoader{loadSkills,readSkill}` / `configureEngMirror{onToggle}` / `configureVerifyDiagnostics{section}`；`agent/execute-tools.mjs` toolCtx 补 `onQuestion`（核 question 工具读点）；`agent/context-injections.mjs` 的 `pendingItems` 改指核 checklist。
4. **未注入两缝（登记形态）**：`configureGitApproval` / `configureEditReceipt` 按缺省不覆盖（端审批在工具执行前）——已写入 `docs/core/design/TOOLS.md` §6.11。
5. **测试改指（6 档）**：`test/{edit-tool-improvement,read-dual-end,git-commit-pathspec,tool-descriptions,wait-for-advisor-pool}.test.mjs` + `test/integration/scenario-06-commit-verify.test.mjs`——全指核面；`edit-tool-improvement` 按核实现重写（断言串与核 read 行号格式 `<ln>\t<line>` 收正）。
6. **模块权威档同步（24 档）**：核 `docs/core/design/{TOOLS §2.2 三行/§2.5 #62,#68/§6.11 五条端差行,EDIT,HASHLINE-EDIT,INSERT-AFTER,APPLY-PATCH,CHECKPOINT §6.9,TOOL-OUTPUT-LIMITS §6.3,DOC-MIGRATION,STRUCTURE-DEBT,CORE-UNIFICATION §2.13.3/§2.13.5}` + VSC 产品档 14 档（补「W14 已迁核——现体 <核路径>」注记，判据零改）——均追加变更记录行。

**删旧三条读数（A-K2/K5）**：① 扫描域 = `thincoder-vscode/src/**` + `test/**`：对 19 删除档的相对 import 命中 **0**；② `src/tools/*.mjs` 实存 **6 档** = 保留面；③ `src/tools.mjs` barrel 经 `./tools/index.mjs` 转口核子路径全绿。

**决策透明表**

| # | 决策 | 理由 / 备选 |
|---|---|---|
| 1 | 薄壳保留 `applyEditorRangeEdit`（零消费者） | W14 任务书把「现形 getOpenDoc/applyEditorEdit/applyEditorRangeEdit」列为本档保留面；核写路径缝只承载全文写回 ⇒ 加 `retired（W14）` 注而非删（删 = 偏离任务书保留面） |
| 2 | `formatSize` 从薄壳删除（含 index.mjs re-export） | 迁移后零消费者（全树 grep 仅定义处 + re-export）= 死代码；删后薄壳 205 → 200 行进设计带内 |
| 3 | `update.d.ts` / 端壳 bash 面 | 不动——`shell.mjs` 的 `MAX_STREAM_BUF` 留端（核 bash.mjs 同名未导出，端自持属装配面形态） |
| 4 | 主进程 `git` 工具只读分类 | 迁入端装配面装饰（核 git 工具无 `isReadonlyAction` 概念）——逐字同前态 `src/tools/git.mjs:81-93`；审批层消费点 `execute-tools.mjs:65,117` · `tool-gates.mjs:72,149` 无旁路 |

**复跑读数（复跑时点 2026-09-15 18:3x · 与他单元在途共存）**
- `npm run lint`（cwd = thincoder-vscode）= **206 JS files OK**
- `npm test`（快层）= **562 / 528 通过 / 0 失败 / 34 skip**
- `npm run test:full` = **562 / 561 通过 / 1 失败 / 0 skip**——唯一失败 = `T-DC6②`（doc-anchors 真仓零命中锁），cause = 他单元在途删除致根域 33 条悬空锚（非 W14 面：悬空清单含 `src/agent-tools/subagent-*` · `src/advisor/*` · `src/provider.mjs`，W14 面 **0 条**）
- `npm run test:integration` = **29 / 27 通过 / 2 失败**——两条 = `scenario-02-eng-chain`（cause = advisor model re-derivation 迁移在途，`provider "unknown": model is undefined`；非 W14 面）
- `npm run doc:check`（VSC 域）= 263 命中——**其中涉 `src/tools/` 者 0**；余为他单元在途面（`advisor/*` · `agent-tools/subagent-*` · `test/advisor-*`）
- 仓根三机检：`check-doc-width --domain .` = **OK**（131 档，新增违规 0）· `check-ledger` = **OK**（TODO/TODO-archive）· `doc-anchors --domain .` = 33 悬空（同上，W14 面 0）
- 核回归：`thincoder-core` `node --test` = **178 / 178 / 0 失败**

**审计与代码评审轮次（AGENT-LOOP §18 D-E2/D-E4）**
- **D-E2 内部 explore 背离审计**：1 轮（blocking）→ 终态 **DEVIATIONS**（2 条登记级：§5 未落〔即本段〕· 薄壳 205 行越 ±50 上界 5 行〔🔵 估计值〕）；逐项 1–10 面全 ✅。
- **D-E4 内部 advisor 代码评审**：1 轮（sync）→ **VERDICT: pass**（🔴 0）；发现 5 条（🟡 2 / 🔵 3）。
- **fix round（评审后发现 → 修正，1 轮）**：

| # | 级别 | 评审发现 | 处置（file:line） |
|---|---|---|---|
| 1 | 🟡 | question 工具 VSC 无回调降级径退场未登记（权威档仍记 QuickPick/InputBox ④ 段） | **Fixed（文档侧）**——`docs/core/design/TOOLS.md:55`(#52) / `:67`(#64) 补 W14 注（降级径退场 · 现体 = 端 `onQuestion` 通道）；行为态维持（面板路径恒有通道——`panel-callbacks.mjs:195`；auto-turn 显式 `() => null` 新旧同返回 `(user cancelled)`） |
| 2 | 🟡 | 文件体量：`agent/setup.mjs` 566 行 > 500 硬限；`execute-tools.mjs` 375 / `tools/shell.mjs` 318 > 300 软线 | **登记（R3 不复审）**——承 W9 §5 判例「不升级——`setup.mjs` 随 W15 删除集清零」；本表登记在案 |
| 3 | 🔵 | `applyEditorRangeEdit` 零消费者（死代码疑） | **Fixed**——`src/tools/shared.mjs:62-68` 补 `retired（W14）` 注（勿再接线） |
| 4 | 🔵 | `wireAgentToolSeams` 幂等旗置位早于 `await import`（载入 reject ⇒ 后续轮静默不补接） | **Fixed**——`src/agent/setup.mjs:122-124` 旗标移至两处 `configure*` 之后 |
| 5 | 🔵 | `CORE-UNIFICATION.md:1330`/`:1398` 写路径缝行未收正（缺 `isDirty` 必需字段、坐标陈旧） | **Fixed**——两行改为 `{openDoc, isDirty, applyEdit}` + W14 注（`applyEditorRangeEdit` 退场标注） |
- **终态 = `clean`（收敛）**：修正轮内 4 修 1 登记，无 🔴 留存；修正后复跑：lint OK · 快层 562/528/**0 失败** · 重点面 58 例全绿（`edit-tool-improvement`/`read-dual-end`/`wait-for-advisor-pool`/`tool-descriptions`/`engine-floor-guard`/`scenario-06`/`child-permission-wiring`）。

**披露（透明面）**
- 共享档：`thincoder-vscode/src/agent/setup.mjs` · `agent/execute-tools.mjs` 含他单元（W9/W12/W13）在途编辑——`git commit --only` 语义 = 提交该两档**工作区当前内容**（本批提交快照含其部分改动，文件本身未被本批改动覆盖）。
- 出列表改动（均与本单元直接相关、随报告披露）：`thincoder-vscode/src/tools/index.mjs` 的 `formatSize` re-export 删（决策表 #2）；`docs/core/design/TOOL-OUTPUT-LIMITS.md:117` 行收正（未在 W14 具名文档面内，属同机制权威档同步）。
- 未决（交父侧）：① question 降级径是否需保留（本批按核单源收敛，仅文档登记；若设计要保留 ⇒ 端壳经缝补值，另起修正）；② 根域/`doc:check` 他单元在途红（清单见上）非本批面；③ 批次档 §5 外其余段未动。

### §5 eng-coder 交付段（W12 · ADVISOR/会诊/飞刀 · 最大删除面）

**交付摘要（2026-09-15）**：W12 = 删 `src/advisor/`（13 档）+ `src/agent-tools/{advisor, advisor-async, consult, subagent-escalate, subagent-escalate-async, subagent-spawn-gate, subagent-spec}.mjs`（7 档，共 20 档），全部消费面改指核单源（`@thincoder/core/**`）。

**一、源面改指（生产消费面——动态 import 遵 W8 契约②）**
- `src/agent/agent-state.mjs`：token 过期判定 → 核 `advisor/run.mjs`（`tokenExpiry`）+ 本地 tokenUUID 面。
- `src/agent/execute-tools.mjs`：`recordFileMutation` → 核 `agent-tools/advisor-async.mjs` `noteMutations`（静态安全面）。
- `src/agent/tool-gates.mjs`：`advisorStale`/`inflightDesignReviewConflict` → 核 `advisor-settle.mjs` / 核 `advisor-async.mjs`。
- `src/agent/run-stages.mjs`：`MAX_ADVISOR_ROUNDS`/`advisorReviewPending`/settle 消费 → 核单源。
- `src/agent.mjs`：`MAX_ADVISOR_ROUNDS` → 核 `advisor/run.mjs`。
- `src/extension/suspension.mjs`：`cleanupConsultSessions` 动态核（residual 注入载体稳定）。
- `src/extension/panel-messages.mjs`：`cancelAdvisorReview` → 核 `cancelAsyncAdvisor`。
- `src/tools/wait_for.mjs`：`advisorReviewPending` → 核（该档随后由 W14 并行线删除——本单元面随之退场）。

**二、收留策略（增量迁入端壳——核无对位件者逐字迁入存活消费档）**
- batchDoc 门族（原 `subagent-spawn-gate.mjs`）→ `src/agent-tools/subagent-async.mjs`（消费面同档）。
- token 门族（`resolveDesignSlot`/`authorizeEngCoderDesignToken`/`executeConsumeDesignAction`）+ `subagentSpec` schema 载荷（11399B/11 props——机器对拍 ✓）→ `src/agent-tools/subagent.mjs`。
- `cancelAdvisorReview`（评审池定向取消）→ `src/agent-tools/subagent-actions.mjs`（取消**不再直接注入提醒**——提醒归核 `settleAsyncEntry` 的 cancelled 分支，防双重注入）。
- `src/agent-tools/async-settle.mjs`：`injectPendingAsync` → 核统一注入器 `injectAsyncResult`（consult 族按核 `agent.mjs` 同构分派到核 `injectConsultResult`）；载体适配 = 稳定 `{history, _fullHistory}`。

**三、测试面（改指与退役）**
- 改指核：`prompts-async-guidance` / `provider-model-guard`（F-2b 夹具适配核载体 `agent.provider` + `config.providersList`）/ `portability-vsc-classification` / `portability-vsc-advisor-context` / `batch-segment`（advisorToolsFor）/ `config-pool`（池面 + 核 `launchAsyncAdvisor(parent, ctx, launch)` 签名与拒发文案）/
`eng-settlement`（token 面迁 `subagent.mjs`；跨族预算面直驱核 `injectAsyncResult`）/ `child-permission-wiring`（escalate 引擎组退役——T-CP6/T-CP7/T-CP19）/ `subagent-observe-send`（T-B6/T-B7 取消语义改判）/ `integration/scenario-02`（advisorTool 改指核 + 夹具核载体）/
`test/files.mjs` 登记表同步。
- 退役档（5）：`test/advisor-chain-guards` · `advisor-guard-completion` · `advisor-context-budget` · `advisor-refusal-accounting` · `advisor-truncation`（镜像面删旧——用例随镜像退场；核侧对位由核测试树承接）。
- 另：`batch-segment.test.mjs` W9 装配在位用例（读 `setup.mjs` 源文本的「某句在场」断言）= 散文锚形态——原案退役（行为面由 T-FZ3 承载）。

**四、验证（全链读数）**
- VSC：`npm test` 562/528/0 fail/34 skip（唯一 ✗ = slow 门自检对 `edit-tool-improvement.test.mjs:128` 的并行线在途用例计时告警——非本单元面）；`npm run test:full` 561/562（唯一红 = `T-DC6 源域实跑`——文档锚面，见五）；`npm run test:integration` **29/29 ✓**；`npm run lint` 206 档 OK ✓。
- 核：`node --test`（thincoder-core）**178/178 ✓**。
- 仓根：`check-ledger` 0 违规 ✓；`check-doc-width` 4 行超宽（批次档 :1962-1964 + `docs/design/EDIT.md:3`——均为并行线在途面，非本单元写域）；`doc-anchors`（根域）命中 159 · 见五。

**五、文档面（未收口——如实登记）**
- 本单元面（W12）的 VSC 产品档锚注记已落一轮（338 → 263 → 159），但**注记被并行写手回退**：`docs/design/AGENT-LOOP.md:86`、`docs/design/ADVISOR-CONVERGENCE.md:591` 等行复核时已无注记（并行线对同批文档执行了恢复/改写）。
159 命中中 A3 125 之主体 = W12 删除面（`docs/design/{AGENT-LOOP,ADVISOR-CONVERGENCE,PORTABILITY,DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING-TUNING,TOOL-OUTPUT-LIMITS-TUNING,TURN-CAP-CONTINUE,...}.md` + `docs/requirements/*`），A1 30 = 退役用例号（T-VG*/T-CB*/T-CP6/T-CP7/T-CP19/T-DG1~3/T-FZ*/T-MA6-*/T-RS*/T-EST*）。
- 处置建议（消解路径）：文档维护批按「W12 已迁核／已退役 + 现体/删除记录 = 批次档 `2026-09-15-vsc-core-wiring.md` §5」注记形态统一收口（判据 = 根域 doc-anchors 0 命中）；在并行写手停写后一次落定，避免互覆。
- 模块权威档（`docs/core/design/CONSULTATION.md §6.5` · `docs/core/requirements/ADVISOR-CONVERGENCE.md`）坐标/状态行收正 → 同批（父侧）。

**六、未决/移交**
- `session-slot-write`（cwd,slot）型 token 面核无对位件（W11 已登记）。
- `async-discard.mjs`（W13 面）保留 + 内部改指核 → 未动（非本单元写域）。
- 五缝接线（§2.13.3 `io.ask`/`ctx.onQuestion`/`ctx.onPermissionRequest`/`ctx.callbacks.onToken`/`seams.describeArgs`）＝ VSC 壳接线批面（非本单元任务书范围）。
- 并行写手（W14）在途实证：本单元 `git rm` 的 20 档曾被整体回退一次（复删）；同批文档注记被回退（见五）。
- 凭据纪律：本段零 token/designId 值。

**§5 补记（含审计发现落修 + 一处须父侧裁定的越仓足迹）**

1. **越仓足迹（如实披露——已回滚）**：本单元在相对路径写文档期间（cwd = `d:/teamcode`），把 VSC 产品档的迁核/退役注记写入了**孪生陈旧树** `D:/teamcode/thincoder-vscode/docs/**`（24 档 M）——该树非本仓、非本单元写域。**已处置**：对该树执行 `git checkout -- docs` + `git reset`（回滚 + 复位索引——该树现 `git status` 干净）；本仓（`d:/teamcode/thincoder/thincoder-vscode/**`）同位注记已用绝对路径重落。
   请父侧裁定：孪生树的后续处置（保留/清除）超出本单元范围。
2. **审计（explore）结论落修**：审计报「code 面一致（20 档净删、消费面改指核单源、收留三族自洽、W8 契约② 绿、测试登记表零悬空）」；报出的三项已处置：① 文档锚未收口 → 已收（见 3）；② 交付记录表述与实码不符（`tokenExpired`（核 token-ttl）与内联 `advisorReviewInFlight`（核 advisor-async 静态链经 spawn-child 可达 node:sqlite ⇒ 保持内联））→ 以本条更正表述；③ 越界面披露 → 见 1。
3. **文档锚面终态**：VSC 域 `doc:check` = **0 命中**（338 → 0：本单元面收正 + 顺带清 W10 遗留 4 处 `src/provider.mjs` 悬空锚，`docs/design/PROVIDER.md`）。注记形态 = 「W12 已迁核／已退役——现体（或删除记录）见批次档 §5」。
4. **终态读数（提交后复跑）**：VSC `npm test` 562/528/0 fail/34 skip（唯一告警 = slow 门自检对并行线在途档 `edit-tool-improvement.test.mjs:128` 的计时提示）；
`test:full` 561/562（唯一红 = `T-DC6 源域实跑`——**并行线在途面**：批次档 §1/§2 与 `docs/design/EDIT.md:3` 超宽 + W14 面锚，非本单元面）；`test:integration` 29/29 ✓；`lint` 206 档 OK ✓；核 `node --test` 178/178 ✓；根 `check-ledger` 0 违规 ✓；根 `check-doc-width` 4 行超宽（批次档 + `docs/design/EDIT.md`——非本单元写域）。
   `test:full` 内 `T-DC6` 复查口径：本单元面 0 悬空；残留红来自并行线与 W14 在途面。
5. **提交**：`67883dc0`（69 档：20 源档删 + 5 测档删 + 11 源改 + 11 测改 + `test/files.mjs` + `integration/scenario-02` + 23 档文档注记）· `5aebbcdb`（4 档文档锚收口）。`src/tools/wait_for.mjs`（本单元曾改指）随 W14 并行线删除，**未入本单元提交**（其删除归 W14）。

### W12 评审补轮（eng-coder · 2026-09-15）——advisor 代码评审补跑 + 核心档收正 + 上抛

**段位**：W12 评审补轮（上轮 in-child advisor 代码评审因预算耗尽未跑——本轮补跑并按边界裁决）。**本席写域** = `docs/core/design/CONSULTATION.md` + `docs/core/requirements/ADVISOR-CONVERGENCE.md` 的坐标/状态行 + 变更记录行 + 本段；**代码面零落笔**（评审发现所需触碰面全属 W13/W15/W16 在途域——按任务书边界「停下上抛」）。
**提交** = `99c9dafe`（2 档 · +15/−12 · `docs(core): W12 review round - advisor review findings + core doc sync`）；批次档未入本笔（父侧统一）。
**复核时点 = 共享树含 W13 未提交面**（staged 删除 6 档 + M 15 档——含测试面）；评审对象 = W12 提交面 `67883dc0`（+ `5aebbcdb`），复跑读数按现况归因。

**一、advisor 代码评审（type=code · sync · 1 轮）——VERDICT: changes-required**
对象声明 = W12 交付面（20 档删除 + 11 档改指 + 收留三族迁入 + 测试改指/退役 + 产品档注记）；评审实核通过面 = 删除集净 + 消费面零残留相对 import（命中皆注释或 `@thincoder/core/...`）+ 核符号逐名在场 + 保留族对照。发现 = 8 行（🔴 3 / 🟡 3 / 🔵 2）；下列裁决经本席逐条独立复核（评审主机引用校验 3/18——余为路径解析限制，非内容不实）。

**二、裁决表（8 行评审发现 + 1 行本席补充发现）**

| # | Action | Detail |
|---|--------|--------|
| 1 | Deferred | 🔴 评审池键形失配：核建池用 String 键（`thincoder-core/agent-tools/advisor-async.mjs:326` + ack `:329`），端侧查键 Number 归一（`subagent-actions.mjs:183-184`/`:127`/`:242`/`:353`/`:402`）⇒ 评审 id 的 status/cancel/observe/send 恒 miss 返回 unknown。夹具锁 Number 键（`test/subagent-observe-send.test.mjs:191`）故测试全绿。本席复核 = 成立（W12 前端侧自持池为数字键、W12 换核建池未同步归一）。拟修点 = 归一改 `String(id)`（对齐核 `cancelAsyncAdvisor:210`）或 getAsyncPool/removeFromAsyncPools 单点吸收 + 夹具同批改。**边界上抛**（`src/agent-tools/**` = W13 在途域；该档已被 W13 staged 删除）。 |
| 2 | Deferred | 🔴 面板 ⏹ 评审取消路同根因：`panel-messages.mjs:253` `Number(msg.id)` → `:254` 两池查键 miss → `:258` 告警 break ⇒ `:266` 核 `cancelAsyncAdvisor` 接线不可达。拟修点 = 取件前 String 归一（或经核 accessor）；补「String 键池 + ⏹」断言。**边界上抛**（`src/extension/**` = W13 在途 M 档）。 |
| 3 | Deferred | 🔴 出池清理失配：`suspension.mjs:73` `map.delete(e.id)`（数字键）对 String 池失效 ⇒ 挂起会话 `poolLive` 恒真不归 idle；`async-discard.mjs:65 → subagent-scheduler.mjs:64` 同根因（Stop 丢弃条目不出池）。**现状复核**：W13 在途树已修两处（`suspension.mjs:80-81` 双键删除 · `async-discard.mjs:59-62` removeFromPool 双键）——正式收敛随 W13 复跑。拟修点 = 夹具同步（`async-parity.test.mjs:99`）。**边界上抛**。 |
| 4 | Deferred | 🟡 收留 `executeConsumeDesignAction` 缺核同源「落盘失败回滚」（`subagent.mjs:252` 吞错报成功 vs 核 `agent-tools/subagent-spawn.mjs:183-184` 回滚 + 抛错）——窄边界（槽写失败路径，可经 D4 权威回读复活 token）。复核点随 W13（该档删除集）。**上抛登记**。 |
| 5 | Deferred | 🟡 体量：`subagent.mjs` ≈599 行越 500 硬限（W12 迁入 +216；W9 复查读数 384）· `subagent-async≈489 / subagent-actions≈427 / subagent-scheduler≈498` 超软线 · `panel-messages.mjs` 502（非本轮引入）——按 R3/W9/W14 判例**登记不升级**（前四档随 W13 删档清零）；硬限口径待父侧定。 |
| 6 | Deferred | 🟡 VSC 产品档注记缺口：`thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md:636`/`:676`/`:1322`（另 `:661`/`:787`/`:1324` 同族）的 `_fileMutEvents`/`recordFileMutation`/`advisorStale` 引用已零生产写点（现体 = 核 `noteMutations`/`_mutLog`）但未加注——同档他行已有注记。本席写域外（产品档维护批）；**上抛**。 |
| 7 | Deferred | 🔵 注释面陈旧引用（`subagent-async.mjs:19`/`:326`/`:462-465`、`agent/setup.mjs:47-48` 等仍按已删档叙述现役结构）——随 W13 触碰面同批收正；**上抛**。 |
| 8 | Deferred | 🔵 测试夹具锁 Number 键形（`subagent-observe-send.test.mjs:191/:224/:235/:248/:262` · `async-parity.test.mjs:99`）——随 #1/#3 修复同批改 String 键；**上抛**。 |
| 9 | Deferred | 🟡（**本席补充发现** · 静态核验）A6 拒绝登记面在 W12 后失联：端侧记账读 `toolCtx._advisorRefused`（`execute-tools.mjs:339`），而现役 advisor 工具 = 核（置 `agent._advisorRefusals`，且 VSC 不传 `_toolCallId`——`src` 域零写点）⇒ 显式 `async:false` 的拒绝（池满/cap/design-streak）被误记 `_calledAdvisorThisRun = true` + `_advisorRound++`（`execute-tools.mjs:335-350`）——A6 防的正是该类。拟修点 = 核工具侧/端记账侧补载体桥或端壳接线收正。**边界上抛**（`src/agent/**` 在途域；W15 归一面复核）。 |

**三、父侧机械修复复核（重复注记折叠）**
- 判据 = 连续两次相同注记 = 0：实测 **0**（`thincoder-vscode/docs/**` 153 md 全扫 + 根域 `docs/**` 134 md 对照扫；相邻/同行规范化比对均 0）。
- 折叠量复核：`ADVISOR-CONVERGENCE.md` 注记组 pre-fold **433** → post-fold **213**（Δ = **220**）——与父侧「208 处」同向（口径差 = 父侧计重复追加段、本席计组出现数）。
- 自捕缺陷记档：W12 注记脚本对同锚重复追加（同注记 ×2/×4）——父侧机械收敛至单次；复核零残留。另 `PORTABILITY.md:32` 的「注入 ×2」= 散文计数，非残留（排除）。

**四、复跑读数（原样 · 现况归因）**

| # | 命令 | 读数 | 判（归因） |
|---|---|---|---|
| A | VSC `npm test`（fast） | 532 / 491 pass / **7 fail** / 34 skip | 6 fail + slow 自检告警 = W13 在途面（batch-doc-gate · F-2 · child-permission · eng-designer-role · engine-floor-guard W8② · turn-across-segments）；slow 旗 = 并行线遗留（`edit-tool-improvement.test.mjs:128`）。本席面 0。 |
| B | VSC `npm run lint` | 200 JS files OK | ✓ |
| C | VSC `npm run test:full` | 532 / 525 pass / **7 fail** | 同 A + `T-DC6②`（根域悬空锚 33——见 I，他批面） |
| D | VSC `npm run test:integration` | 23 / 21 pass / **2 fail** | `scenario-02` / `scenario-03` = W13 在途面 |
| E | VSC `npm run doc:check`（strict） | **60 命中**（A2 8 / A3 52） | 全 = `src/agent-tools/{subagent*,async-settle}` 引用（W13 在途删除面）——本席面 0 |
| F | 核 `node --test`（thincoder-core） | **178 / 178 / 0** | ✓（核零改动） |
| G | 根 `check-doc-width --domain .` | OK（131 档零 >300；一致性 V1/V2/V3 新增 0） | ✓（本笔收正后复跑） |
| H | 根 `check-ledger` | OK（TODO / TODO-archive · 0 违规） | ✓ |
| I | 根 `doc-anchors --domain .` | **33 悬空**（FAIL 闸态） | 主体 = W12/W10 删除面在核心 docs 的未收口坐标（`AGENT-LOOP.md` §6.18 面归 W13；余归文档维护批）——本席两档零新增 |

**五、落点（核心档收正 · 全落笔）**
- `docs/core/design/CONSULTATION.md`：§6.5 加 W12 状态行（端实现面迁核 + 删除记录指针）；坐标收正（`runConsultChild` → `thincoder-core/agent-tools/consult.mjs:215`、`makeMainHistoryTool` → 同档 `:82`）；§9 实测行数 235 → **260**（口径 = `split("\n").length`）；变更记录 +1 行。
- `docs/core/requirements/ADVISOR-CONVERGENCE.md`：§8 头部「VSC 端权威源」改 W12 现况（核单源 + 删除记录）；§8.1 证据坐标改指核（F-A1/F-A2/F-A3）；§8.3 端差登记加 W12 状态行 + 冻结窗口事件面坐标收正（`_fileMutEvents` → 核 `_mutLog`/`noteMutations`）；§9 实测行数 245 → **220**；变更记录 +1 行。
- 机制条文零改（07:08 口径——仅坐标/状态行 + 变更记录行）。

**六、未落项/上抛（父侧）**
1. 裁决表 9 行 = 代码面/夹具/产品档全项上抛——均属 W13/W15/W16 在途域或文档维护批；建议并入 W13 收口面（键形归一 + `_advisorRefused` 桥 + 夹具 String 键）或另起修正轮。
2. 根域 33 悬空锚 + VSC 域 `doc:check` 60 命中——归因见四表；建议 W13/W16 后跑一次文档收口对账。
3. 评审环境：`## Project Standards` 未声明档（限制如实登记）；孪生陈旧树未用作证据。
4. 纪律：本段零 token/designId 值；临时文件（`.w12-review-tmp/` · `w12fold.diff` · `w12full.diff`）已清理。

**状态**：✅ 交付（单笔提交 `45a5d7c6`——49 档，−3257/+890；含删档 7 + 改指 + 测试面 + 文档锚同批；批次档本体与 `thincoder-core/**` 零改动）。

### 5.1 交付摘要
- **删旧 6 档**（`src/agent-tools/{subagent,subagent-run,subagent-scheduler,subagent-async,subagent-actions,async-settle}.mjs`）+ 测试档 1（`test/batch-doc-gate.test.mjs`——同门用例现居 `thincoder-cli/test/batch-doc-gate.test.mjs`）。
- **存活改指**：`async-discard.mjs`（核 `async-settle` 单源：`parentAborted`/`getAsyncPool`/`writeTombstoneTo`）、`extension/suspension.mjs`（核 `parkAsyncPending` / 统一注入器 / `executeCancelAction` 同源）、
`agent/run-stages.mjs`（回合尾 collect/丢弃改核注入器）、`agent.mjs`（run-start 注入改核注入器）、`extension/panel-messages.mjs`（⏹ 路由 → 核 `cancelAsyncAdvisor` / `executeCancelAction`）、`agent/execute-tools.mjs`（subagent 调用面改指核 + **`_toolCallId` 透传**）。
- **端侧增量迁入装配层**：`agent/setup.mjs` `vscSubagentFace`（① `modeRoleField` 迁入；② #99 panel 动作装配层剔除——零核改动；③ 动作级分类谓词；④ **C-5 终态回显**——核 `status` 不读墓碑，端契约 §12.3 C-5 要求 discarded/cancelled/consumed/failed 四态回显 ⇒ 装配面以核 `tombstoneOf` 单点补齐——动态 import，W8 契约②零破坏）。
- **载体绑定不变式收口**（`agent.mjs`）：跨 run 状态以**访问器别名**全量绑到共享 depth-0 `history`（10 字段 + `_asyncQueue`）——核写侧以父对象字段为入口，只绑两池会让核 settle 的 pending/墓碑/队列/唤醒数组落在 per-run agent（报告丢投面）。
- **键形单源**（评审 🔴 收口）：池/墓碑读删一律 `String(id)`——`panel-messages.mjs` ⏹ 路由 `Number(msg.id)` → `String(msg.id)`（原形态在生产恒 miss）；`async-discard`/`run-stages`/`suspension` 删 `String(e.id)`；测试夹具全部锁 String 键（含 ⏹ 路由键形回归断言）。
- **A6 拒绝登记桥**（评审项，落本笔）：端记账读面双源——`toolCtx._advisorRefused`（旧端工具面）+ 核 `agent._advisorRefusals.has(ctx._toolCallId)`（核工具真源）；`toolCtx` 补 `_toolCallId` 下发（核 advisor 的拒绝/ack/sync 登记面恒以该键写入）。

### 5.2 决策透明表
| # | 决策 | 依据/代价 |
|---|---|---|
| 1 | 测试面逐断言裁决（任务书授权「行为断言按裁决」） | 核面 13 例改驱核单源；退役 14 例（T-D1/T-D9 spawn 半例、T-CP10/T-CP11、T54-56 档、T-D8/T-D13 部分）；每处退役/收正均在档内注明依据与同门恒等覆盖（核测试树 / CLI 侧档 / scenario 集成面） |
| 2 | `ctx.runAgent` 测试缝退役 → 集成场景改驱**真核 spawn + mock provider** | 原缝不存在于核工具（核 spawn 硬接核 `runAgent`）；scenario-02/03 因此从「桩子代理」升级为「真子代理运行」（本地 SSE 零外网）——保真度提高、成本 = 测试时长 |
| 3 | `waitForSettleOrWake` 双注册（核 `_asyncWaiters` + 端 `_suspWake`） | 核 settle 尾部唤醒面 = `parent._asyncWaiters`；端 `onAsyncSettled` 在核 settle 路径无调用点 ⇒ 不补则挂起会话停到下一用户输入（真实功能缺口，非测试面） |
| 4 | C-5 终态回显落**端装配面** | 核 `status` 不读墓碑；端设计 §12.3 C-5 是端契约 ⇒ 端侧补（零核改动）；备选（核内加）＝越核写域，否决 |
| 5 | `depInfo` 对 `discarded` 墓碑判 `ok`（核语义）与端设计 §12.6 C-6（`discarded → cancelled` depc 停靠）不一致 | **差异登记（未决待裁）**：`depInfo` 消费面在核 scheduler 内（`describeBlockers`/`queueRunnable`），端装配层无法补齐；本笔按核语义落地并锁现状，差异留父侧裁（核内一笔 vs 端侧承认）。C-6 主路径（`cancelled` 墓碑）核侧同判 ✓ |
| 6 | `test/edit-tool-improvement.test.mjs` 一例改 `slow()`（**out-of-list，已披露**） | 快层 slow 门 D-T6 硬红（并行负载下 >500ms；独立跑 ~360ms）——归册非删除；不修则 `npm test` 恒 exit 1（先于本笔存在——HEAD 基线复跑同样超阈） |
| 7 | `test/batch-doc-gate.test.mjs` 退役 = 覆盖外移，非遗失 | 其断言对象（端工具 + `ctx.runAgent` 缝）已不存在；CLI 侧同表档直驱核 `buildSpawnChild`（两路/角色域/可读性矩阵同） |
| 8 | 文档锚同批修正（VSC 域 77 处 → 0） | 任务书四步 ④「文档锚同批」；全为删档路径/退役符号/退役用例号的锚点收正（迁移注记形态与既有 W9/W10/W12 行同款） |

### 5.3 审计与代码评审轮次
- **分歧审计（explore · 阻塞）**：1 轮，VERDICT: **DEVIATIONS** → 4 项：① PARTIAL 🟡 载体字段集 8 vs 核 §2.3 十字段（缺 `_asyncWaiters`/`_advisorRuns`/`_mutLog`）→ **Fixed**（`agent.mjs` 补三字段 + history 侧建齐 + 注释更新）；
② DOC-DRIFT 🟡 AGENT-LOOP §11.2 D 行字段集 6 款 → **Fixed**（改十字段全集 + W13 注记 +（CLI 侧）注记）；③ DOC-DRIFT 🔵 §12.1 指针书「核仓 `thincoder-core/test/`」而证据面实在 CLI 侧 → **Fixed**（改指 `thincoder-cli/test/batch-doc-gate.test.mjs`）；④ DOC-DRIFT 🔵 批次档 §5 无 W13 段 → **本段即其收口**。
修复后复跑：fast 549/514/0/35 ✓ · full 549/549 ✓ · integration 29/29 ✓ · doc:check 0 ✓ · lint ✓（`doc-consistency` V1 一条由 ② 引入、随即就地收正 ✓）。
- **代码评审（advisor）**：见 5.4（终态）。
- **观察项（审计提出，非偏差）**：⏹ queued 取消路径以 `callbacks: {}` 调核 `executeCancelAction` ⇒ 核 `⟦ev⟧cancelled`/`refreshQueuedTokens` 在该路径 no-op——webview 等待头回收归**事件中继面**（W15 载体系）；本笔零回归（旧端 `_onCancelled` 缝已随删旧退役，测试面同步登记）。

### 5.4 验证读数（本笔实跑 · cwd=`thincoder-vscode/`）
| # | 命令 | 读数 |
|---|---|---|
| 1 | `npm test`（快层） | `ℹ tests 549 · pass 514 · fail 0 · skipped 35`（exit 0——slow 门零拦截） |
| 2 | `npm run lint` | `check-syntax: 199 JS files OK`（exit 0） |
| 3 | `npm run test:full` | `ℹ tests 549 · pass 549 · fail 0`（exit 0） |
| 4 | `npm run test:integration` | `ℹ tests 29 · pass 29 · fail 0`（exit 0） |
| 5 | `npm run doc:check` | `V5: 命中 0 处 · distinct 0（A1 0 / A2 0 / A3 0）`（exit 0） |
| 6 | 核回归 `node --test`（cwd=`thincoder-core`） | `ℹ tests 178 · pass 178 · fail 0`（exit 0） |
| 7 | 仓根 `node scripts/check-doc-width.mjs` | `OK(宽度): 404 文件零 >300 字符行`（exit 0） |
| 8 | 仓根 `node scripts/check-ledger.mjs` | `OK` 两档 · `0 处违规 · 基线 0 条`（exit 0） |
| 9 | 仓根 `node scripts/doc-anchors.mjs --domain .` | **FAIL(33 悬空)**——逐条核验：**0 条属 W13**（全部为 W10/W12/更早单元在 `docs/core/**`+`docs/vsc/**` 的 VSC-local 陈旧坐标——复核脚本按「33 条报告行 ∩ 本删除集」交集 = 0）；本笔零触碰（他域写权） |
| 10 | 零引用机判（扫描域 = `src/` + `test/` + `extension.mjs`） | 本删除集 VSC-local 规格符 **0** |
| 11 | 基线对照（HEAD 暂存复跑） | 快层 562/528/0/34 → 现 549/514/0/35 = **−13 例（全部为已登记退役：−5 逐例 + −8 batch-doc-gate 整档）+ 1 例归册**（账目逐档核毕，无未登记减项） |

### 5.5 未决/移交（父侧裁）
1. **C-6 差异**（决策表 5）：`depInfo` 未知墓碑状态（含端 `discarded`）判 `ok` vs 端 C-6 的 depc 停靠——端侧无法在装配层补齐。
2. **仓根锚闸 33 悬空**（读数 9）：非本笔；建议父侧路由至对应单元（W10/W12 文档收口面）。
3. **webview 等待头回收**（观察项）：⏹ queued 取消的 `⟦ev⟧cancelled` 中继与队列行刷新归 W15 事件面。
4. **`AGENTS.md` 模块图**仍列 6 删除档——与 W9 复查同族，父侧 W17 收口笔（本笔未并入）。

### 5.6 代码评审轮次（advisor · code）——终态
- **轮次**：1 轮 · VERDICT: **pass**（无 🔴）。发现 4 条：2 🟡 + 2 🔵。
- **裁决表**：
| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 ⏹ 路由合成 parent 三缺（`panel-messages.mjs:279-288`）：`callbacks:{}` ⇒ 核 `⟦ev⟧cancelled`/`refreshQueuedTokens` no-op（已登记 §5.3 观察项 / §5.5 未决 3 → W15 事件中继面）；`config` 缺 ⇒ `poolLimitsFor` 回退默认 4/4（面板生效值在该路径补位判定被忽略）；`autoApprove` 缺 ⇒ 依赖被取消者不自动启动。②③ 为评审新发现、**非本笔引入**（同源自「合成 parent」形态，旧端路径无对位）⇒ 缓办：交父侧裁「补 parent 真值 vs 记端差」——不静默 |
| 2 | Not an issue（登记维持） | 🟡 体量：`setup.mjs` 668 / `panel-messages.mjs` 519 > 500 硬限；`agent.mjs` 461 / `suspension.mjs` 397 / `execute-tools.mjs` 383 / `run-stages.mjs` 382 > 300 软线——**承 R3/W12 补轮 #5/W14 评审 #2 判例「登记不升级」**（`setup.mjs` 随 W15 删除集清零）；不重审、不阻断 |
| 3 | Fixed | 🔵 `async-discard.mjs:49-55` 判定注释失准（`{ signal: entry.signal }` 为死参；实际判据 = controller 支，与基信号同链 ⇒ 行为等价）——注释已收正（amend 入 `c38dada0`） |
| 4 | Not an issue（如实登记） | 🔵 `agent.mjs:137-150` 别名绑定晚于 hydrate：`_engDesignTokens`（hydrate 写入 `agent-state.mjs:110`）被替换为空态；**三处槽回读兜底在册**（`subagent-spawn.mjs:112-118` · `tool-gates.mjs:46-53` · `run-lines` 保存合并）⇒ 零数据丢失；且该字段属变更前既有 8 字段（§5.3 审计①）⇒ 疑非本笔引入；低成本收口建议已留父侧（预建 `history._engDesignTokens` 或前移绑定） |
- **评审后复跑**（amend 后）：`npm run lint` = `check-syntax: 199 JS files OK`（exit 0）· `npm test` = 549/514/0/35（exit 0）。
- **终态**：`clean`（无未决 🔴；🟡 两条 = 1 协调项（待父侧裁）+ 1 登记维持）。

### 实施：S2 W15 —— AGENT-LOOP · 开工前打回（2026-09-15 · eng-coder）——**终态 = stalled（缺口在设计面 · 零落笔）**

**段位**：实施第四波 · W15（尾员）。本段 = 开工前实核的缺口报告——按本档 W15 兜底句（「撞核内缺口 = 停下上抛」）与子代理纪律（设计缺口停报、不静默偏离）处置。
**零落笔**：生产代码 / 测试 / 其他文档 / 本档其余段零改动（唯一写 = 本段）；未 commit；零 token/designId 值。

**一、删除集前提失效（F1 · 根因）**

CLI U15 的「删 → 核」成立于其删除集 = **核镜像**——前态实证（`132ca678`）：`src/agent/setup.mjs` 355 行仅导出 `prepareRun` · `run-stages.mjs` 245 行四名同签名 · `setup-reminders.mjs` 70 行 ⊂ 核 · `agent.mjs` 418 行 `createAgent`/`runAgent` 同签名。
VSC 同名 6 档 = **独立分叉实现**（逐档实核）：

| 档 | VSC 现态 | 核面 | 分叉事实（file:line） |
|---|---|---|---|
| `src/agent.mjs` | 460 行 | `agent.mjs` | 签名异：`runAgent(provider, cwd, input, callbacks, signal, autoApprove, opts)`（`:56`）vs 核 `runAgent(agent, input, callbacks, opts)`（核 `agent.mjs:96`）；端特有：载体 10 字段访问器别名（`:137-150`）· live autoApprove getter（`:64`）· `opts.agent` 单例复用 · W9 载体镜像（`:383-416`） |
| `agent/setup.mjs` | 668 行 | `agent/setup.mjs`（`prepareRun`） | 导出面异：`buildTopLevelAgent`（`:292`）/`hydrateRun`（`:325`）/`setupAgentRun`（`:666`）/`vscSubagentFace`（`:171-223`）/`modeRoleField`（`:234`）——核无对应物；含 VSC 工具表装配（`:343-409`）· 槽 reconcile（`:455-485`）· 双线 history（`:559-569`）· 注入序（`:617-659`） |
| `agent/run-stages.mjs` | 382 行 | `agent/run-stages.mjs` | 函数面异：`maybeGuardPushbacks`/`checkAndCompact`/`fireEndOfRunDistill` vs 核 `runCompactionCheck`/`injectTurnReminders`/`handleCompletion` |
| `agent/setup-reminders.mjs` | 252 行 | `agent/setup-reminders.mjs` | 端特有四名：`detectRestoredSession`/`composeGitContext`/`pushTimeReminder`/`injectEngineeringReminder` |
| `src/explore-distill.mjs` | 157 行 | `explore-distill.mjs` | 核 re-export 签名异（W6 段已登记：agent 载体 vs history 入参） |
| `src/i18n.mjs` | 56 行 | `i18n.mjs` | `I18N.md` D1 裁定「VSC 保留 `t()` 壳」（核 `i18n.mjs:95` docstring 同述）——与本单元「删」互斥 |

⇒ 直删 = 静默丢弃 VSC 装配面 / 端特有提醒 / 注入序 / 身份行；本批自身判据（勘察 3「同路径 ≠ 同内容」+「删除集判定按内容实核」）在此族未被应用。

**二、三处端差无落点（均阻塞级）**

| # | 缺口 | 证据（file:line） | 为何阻塞 |
|---|---|---|---|
| F2 | `vscSubagentFace` 三子项无核对位、无应用点 | 现体 `src/agent/setup.mjs:171-223`（#99 panel 剔除 · C-5 终态回显 · `isReadonlyAction`/`isControlAction` 谓词）；消费面 `agent/execute-tools.mjs:65,117-118` · `agent/tool-gates.mjs:72,149,152`；核 `agent/setup.mjs:275-293` 恒自建八动作 subagent 工具；核 `configure*` 缝族逐组实核无一涉工具登记面；核 subagent 工具无该两谓词（W13 段亦登记） | 端审批门按谓词读：谓词缺席 ⇒ status/observe 触发写审批、cancel/send 丢控制豁免（planMode 会拦 cancel）；panel 动作凭空出现（§2.13.6 #6 预示的「对外可见行为变化」） |
| F3 | #113 编辑器上下文 / 贴图注入无调用点 | 核函数在场 `agent/setup-reminders.mjs:83,98`；核 `prepareRun` 全档不调用（唯一编排点 `:41-354`）；用户输入由核内 `pushReal` 推送（核 `agent/setup.mjs:140`） | 端无 post-input 注入位；前置推送 = §17.4 #11/#12 块序变更（`test/context-parity.test.mjs` 序表断言面） |
| F4 | 端身份行被核端 `END` 覆写 | 核 `envStateLine` 硬编码 `${END}`（核 `session-slots.mjs:71` = `"cli"`；核 `agent/setup-reminders.mjs:31`）；端 `END = "vscode"`（`src/extension/session-slots.mjs:49`）；断言面 = `test/context-parity.test.mjs` T-CI-1 / `test/setup-reminders.test.mjs` | 采用核函数即 env 行变 `env: cli`（跨端身份错写；同类先例 = §2.13.4 #172 核内硬编码判别面） |

**三、#112 核对结论（按任务书「未落 = 上报」）**

**未落**（三处实证）：① 核 `tools/index.mjs:62` 装配期门仍在（`imageOk = Boolean(specForModel(model)?.multimodal)`）；② 核 `agent/setup.mjs:293-294` 无 run 期能力重解（`tools`/`toolSchemas` 物化处零过滤）；③ 拟档 `thincoder-core/test/tool-face-capability.test.mjs` 不存在。
⇒ 定稿两半（装配面恒含 + run 期重解）均属核内笔（超本批写域）——「VSC 零动作」成立，但「核对核内已落」= **否**。

**四、落点未定项**

- F6 装配面新家未定：`hydrateRun`/`buildTopLevelAgent`/`setupAgentRun` 消费者 = 生产 `extension/panel-chat.mjs:27` · `extension/image-handler.mjs:23` + 测试档（含 `agent-lifecycle-singleton` · `expand-home` · `async-parity` · `subagent-observe-send`——设计点名测试面未列）。
- F7 循环契约位移未定形：live autoApprove getter / `opts.distillState`↔核 `agent._pendingDistill` / `opts.turnInput`↔核 `consumeInjected` / 载体 10 字段宿主（VSC 住 history、核住 agent）。
- F8 i18n 壳落点与「删」互斥（见 F1 表末行）。

**五、需裁定（建议）**：R1 装配面按「同路径 ≠ 同内容」重判 + 新家定名（建议 `agent-state.mjs` 扩面或 panel-chat 内建）· R2 工具登记面端差三子项落点（核内缝 vs 端侧装配期装饰）· R3 #113 调用点形态（前置推送 / input 折叠 / 核内补位）· R4 端身份面（核内 END 参数化 vs VSC 自持）· R5 #112 核内笔排期 + i18n 壳落点。
裁定后 W15 可重派（同一 designToken 修正轮；docs FIRST）。

### 实施：S2 W16 —— CONFIG · 收口单元（2026-09-15 · eng-coder）——**终态 = clean**

**段位**：实施第五波 · W16（`§2` 任务书段 `:222`–`:226` + 四步协议块 + A-K 判据）。**写域** = VSC 树（`thincoder-vscode/src/**` 配置面 + `test/**` 配置面 + VSC 产品档配置接线面）+ 根核档 4 档（`docs/core/{design/{CONFIG,SETTINGS-TOOL,DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING}.md, requirements/DESIGN-TOKEN-SETTLEMENT.md}`）。
**核内 `thincoder-core/**` 零触碰**（只读消费）· `thincoder-cli/**` 零触碰 · 台账 `docs/TODO.md` 与仓根 `scripts/**` 零触碰 · 本档 §1–§4/§6 零触碰（本条 = §5）· 他单元段零触碰。

**依据** = 本档 `§2` W16 段（`:222`–`:226`）+ `docs/core/design/CORE-UNIFICATION.md` 裁决行 #80/#128/#130–#132/#87/#143（`:1327`/`:1352`/`:1358` 接线面）+ CONFIG.md §1/§6.1。设计 token 由父侧设计评审签发（本段零凭证值）。

**交付摘要**：VSC 配置面 6 档自持镜像删除（`src/{config,config-io,config-migrate,config-presets,config-consult}.mjs` + `src/agent-tools/settings.mjs`）——加载器 / 默认值 / 迁移 / preset 表 / settings 工具 = 核单源
（`@thincoder/core/{config,config-io,config-migrate,config-presets}.mjs` + `agent-tools/settings.mjs`）；VSC 特有消费面落端壳（`src/extension/presets.mjs` 十一名 + `src/extension/settings.mjs` 两名）；
`$schema` 缝 = 核 `opts.schema` 默认关闭（CLI 语义）+ 端壳 `settings-panel-write.mjs` `VSC_CONFIG_SCHEMA`/`vscPersistRaw` 注入；settings 工具 = 核工厂 `settingsTool(opts)` 端侧实例化一次（`src/agent/setup.mjs:47`）。

**超声明披露**（设计点名面之外 · 已如实登记）：
① **改指面 = 全入边**（不止任务书点名的 16 档）：R1/R2 实测 `src/` 入边 19 档 + 测试面 13 档 + `smoke-provider.mjs` + 集成 3 档（含 `scenario-01/02` 的间接入边）——判据 = A-K4 零引用机判 + 删后中间态零断链；
② **文档面扩至 5 档**（任务书点名 4 档）：另含 `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` F-D2/F-D6 两行证据坐标（同主题、原指向本删除集）；
③ **VSC 产品档 9 档加迁核注记**（`ADVISOR-CONVERGENCE`/`AGENT-PARAMS-TUNING`/`CHECKPOINT`/`CONSULTATION`/`PROVIDER`/`README`/`SETTINGS`/`PROJECT`/`SETTINGS-TOOL`）——判据 = `doc:check` A3 须可解析 + `T-DC6②`（VSC 域零命中锁）；
④ **审计派生修正**（`04157c71`）：`src/config-mcp.mjs:67` 改 `vscPersistRaw`（详见「内部轮」）+ 回归用例 + `CORE-UNIFICATION.md` 三行同步 + VSC `ARCHITECTURE.md:116` 模块图注。

**改动面（逐档）**

| # | 档 | 动作 |
|---|---|---|
| 1 | `thincoder-vscode/src/{config,config-io,config-migrate,config-presets,config-consult}.mjs` · `src/agent-tools/settings.mjs` | **删**（6 档） |
| 2 | `src/specs.mjs` | 重写——核 `model-specs.mjs` 取表 + 端侧增补面（`reasoningEffortDefault` 前缀表 + overlay） |
| 3 | `src/extension/presets.mjs` | 重写——VSC 特有消费面汇聚（`PRESETS`=核 `PROVIDER_PRESETS` · `resolveKey`/`resolveDefaultModel`/`providerFromConfig`/`providerNamesInConfig`/`probeTargetFromEntry`/`sanitizeConsultModels`/`warnConsultModelsFiltered`/`loadConsultPool`；`findProvider`/`normalizeProxy` 自核取） |
| 4 | `src/extension/settings-panel-write.mjs` | `$schema` 缝（`VSC_CONFIG_SCHEMA` + `vscPersistRaw`）+ 写面全量改走该缝 |
| 5 | `src/extension/settings.mjs` | `loadAgentSettings` / `shellCandidates` 端壳面收留（核名适配） |
| 6 | `src/config-mcp.mjs` · `src/embed-config.mjs` · `src/extension/{provider-flows,migrate-settings,config-watch,chat-panel,panel-chat,panel-messages,panel-index,panel-callbacks,image-handler}.mjs` · `src/agent/{agent-state,run-helpers,setup}.mjs` | 改指核 + 端壳写通道（`vscPersistRaw`） |
| 7 | 测试面 13 档（`config-*` ×5 · `settings-tool` · `provider-admission` · `image-downgrade` · `async-visibility` · `chat-panel` · `child-permission{,-wiring}` · `context-parity` · `expand-home` · `memory-*` · `portability-vsc-advisor-context` · `provider-model-guard` · `session-boot` · `smoke-provider.mjs` · `integration/scenario-{01,02,07}`） | 改指核 + 逐例改判（见下） |
| 8 | 文档面 10 档 | ① 根核档 4（`CONFIG.md` §1 现体双列表 + §2.2 #130 注 + §6.1 行号重核 + §9；`SETTINGS-TOOL.md` §2.6/§2.8/§5/§7；两 token 档 §6.3 表全量收正「W16 接线面收正」版 + §9）+ ①′ `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` F-D2/F-D6 证据行；② VSC 产品档 9 档迁核注记；③ 审计派生：`CORE-UNIFICATION.md` 三行 + VSC `ARCHITECTURE.md:116` |

**测试面改判（逐例判据 · 测试纪律①）**
- 保留 + 改指核：`config-merge`（8 例）· `config-softfail`（4——hub/leaf 双档形态退场，consult 清洗面改锁端壳单源）· `config-pool`（4——池面核单源）·
  `config-io-panel`（2 → **3**，新增回归例）· `settings-tool`（8——重写为核工厂驱动：写侧 `settingsTool({configPath})` + 读侧 `_setConfigPathForTest` 双缝）·
  `config-watch`（T-S3 冲突例改判——冲突检测口径 = 核 `writeConfigAtomic` 的 stat→read 写窗，跨调用读基线随 `config-io` 退场）。
- 改指不改判：`provider-admission` / `image-downgrade`（T36 `reasoningEffortDefault` 契约随 `specs.mjs` 端侧增补面续绿）/ `scenario-07` 等。
- 零退役（本单元不新增退役；删旧面用例 = 随镜像退场者已在各档改指为核面）。

**A-K 读数（终态复跑 · 原样 · cwd = `thincoder-vscode/`）**

| # | 判据 | 基线（开工实测） | 终态（本笔窗口） |
|---|---|---|---|
| A-K1 | `npm test`（快层） | 549 / 514 / **0** / 35 | **550 / 515 / 0 / 35**（+1 = 新增回归用例） |
| A-K1 | `npm run test:full` | 549 / 548 / **1**（`T-DC6②` 红——VSC 域悬空锚在途） | **550 / 550 / 0**（`T-DC6②` 转绿——本笔收正 VSC 域全部悬空锚） |
| A-K1 | `npm run test:integration` | 29 / 29 / 0 | **29 / 29 / 0** |
| A-K1 | `npm run lint` | 193 JS OK | **193 JS OK** |
| A-K1 | `npm run doc:check`（VSC 域 strict） | 21 命中（本删除集面） | **0 命中** |
| A-K2 | 核回归 `node --test`（cwd = `thincoder-core`） | 178 / 178 | **178 / 178 / 0**（核零改动） |
| A-K3 | 仓根 `check-doc-width` | OK（404 档） | **OK（404 档零 >300）** |
| A-K3 | 仓根 `check-ledger` | OK | **OK（TODO / TODO-archive · 0 违规）** |
| A-K3 | 仓根 `doc-anchors --domain .` | 35 悬空（本删除集 7 处） | **28 悬空——本笔面 0 新增**（收正 7 处：`CONFIG.md`×2 · 两 token 档×3 · requirements×2）；余 28 = W9–W14 他单元在 `docs/core/**` 坐标残留（逐条清单见「未决 4」） |
| A-K4 | 删除集零引用机判（扫描域 = `src/` + `test/` + `extension.mjs`；实际扩至全树非注释行） | — | **0 命中**（6 删除档零入边） |

**专项验收**
① 删除集零引用 ✓（全树机判 0；含 webview / scripts / package.json）。
② 配置装载 / 迁移 = 核面 ✓（`config-io` 语义随核：`loadRaw`/`persistRaw`/`conflictError`/`mtime-conflict`/`.bak` 留现场；迁移逻辑随核 `config-migrate`，端壳仅 SecretStorage 胶水）。
③ 面板写盘 `$schema` 键在场 ✓（`test/config-io-panel.test.mjs:53-54` 断言 `raw.$schema === VSC_CONFIG_SCHEMA`；核面默认不写——CLI 语义零变）。
④ 接线面收正 ✓（`CONFIG.md`/`SETTINGS-TOOL.md`/两 token 档 §6.3 逐项实核；`SETTINGS-TOOL.md §2.8` 键空间 = 核全量 `DEFAULTS`——A5 已裁）。
⑤ settings 工具 = 核工厂单例 ✓（`src/agent/setup.mjs:47` `coreSettingsTool()` + `:352` 注册；写盘 = 核 `writeConfigAtomic`）。

**提交**：`488c86c9`（61 档 · +568/−1505 · 6 delete mode；`refactor(vsc): retire config mirrors onto core single source (W16)`）+ 审计修正轮 `04157c71`（4 档 · +15/−5）；回退点 = `git revert 488c86c9`（修正轮 = `git revert 04157c71`）。

**⑤ 内部轮（发现与处置）**

**审计 1 轮**（只读 explore 分歧审计 · 阻塞）：结论 **DEVIATIONS**（1 🔴 / 2 🟡 / 1 🔵；另附 3 条非发现观察）。四类核验：PARTIAL 1 · DOC-DRIFT 2 · OUT-OF-LIST 0 · SILENT-SIMPLIFICATION 0。

| # | 级别 | 类别 | 位置 | 发现 | 处置 |
|---|---|---|---|---|---|
| 1 | 🔴 | PARTIAL（运行面缺陷） | `thincoder-vscode/src/config-mcp.mjs:67` | `removeMcpServer` 体内 `persistRaw(...)` 未导入未定义（同档 `:27`/`:55` 已改 `vscPersistRaw`）⇒ 设置面板 MCP 删除 = `ReferenceError`；存活原因 = `node --check` 不解析标识符 + 零测试覆盖 | **Fixed**——改 `vscPersistRaw`（`04157c71`）+ 新增回归用例 `test/config-io-panel.test.mjs`「MCP 删条目走端壳写盘通道——可达 + config.json 更新 + $schema 保留」（550 例全绿） |
| 2 | 🟡 | DOC-DRIFT | `docs/core/design/CORE-UNIFICATION.md:1327`/`:1352`/`:1358` | 缝注册表 / 映射行仍指删除档（`config-io.mjs:108` · `config.mjs:104`），无 W16 同步 | **Fixed**——三行收正（现体 = `settings-panel-write.mjs:15,20-22` · `src/specs.mjs:17-26,38-42`；`04157c71`） |
| 3 | 🟡 | DOC-DRIFT | `docs/TODO.md:40`（台账） | 台账条目证据路径 = 本删除集（`thincoder-vscode/src/config-io.mjs:319`） | **Deferred（上抛父侧）**——台账 = 父侧写域（本席零触碰）；消解路径 = 父侧补「W16 已删——现体 = 核 `config.mjs` DEFAULTS」注记或改证据坐标（见未决 1） |
| 4 | 🔵 | DOC-DRIFT（注记覆盖） | `thincoder-vscode/docs/design/ARCHITECTURE.md:116`（+ 同族清单） | VSC 模块图仍以「在位」形态列删除集；另列他单元面 / CLI 档 / D-C14 类残留 | **部分 Fixed**——`ARCHITECTURE.md:116` 加 W16 注（本单元面）；余列 = 他单元模块权威档面/CLI 档（非本单元写域）→ 上抛（见未决 4） |

**advisor 代码评审 1 轮**（`type=code` · sync）：见「评审轮」段（本段末）。

**决策透明表（设计未明写者）**

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 端侧 consult 读面 = `extension/presets.mjs`（非新建档） | 设计明写（核缺口裁决 = VSC 特有消费面落端侧）；备选 = 新建 `consult.mjs` ⇒ 违反「端壳缝不新增档」口径（本档 §2:266 裁定）+ `test/files.mjs` 登记面改动 |
| 2 | `src/specs.mjs` 自带 `reasoningEffortDefault` 端侧增补面 | #143 端差字段核零对位（核 `model-specs.mjs` 实核无该字段）——端侧扩展；备选 = 核内补笔（超本批核写域，否决）；用例 T36 契约续绿为判据 |
| 3 | 测试面全入边改指（13 档 + 集成 3 档，不止点名面） | A-K4 反向判零 + 删后零断链；先例 = W1/W4/W5/W7/W10/W13/W14「全入边」；超点名数 = 如实披露（段首 ③） |
| 4 | `config-watch` T-S3 冲突例改判（跨调用读基线 → 核写窗） | 冲突检测口径随写盘执行体迁核（熔核 = 唯一写盘执行体已裁定）；旧跨调用基线 = `config-io` 私有态（随删退场）；备选 = 端壳重造基线（复制核语义，否决） |
| 5 | VSC 产品档 = 迁核注记（「W16 已迁核收口——现体见批次档 §5」形态），不逐档加变更记录行 | 档性 = 迁移期参照历史（D-C14）+ 先例 = W1/W2/W4/W5/W7/W9/W10/W12/W13/W14；注记形态经 `doc-anchors` VSC 引擎 `isNoteLine` 谓词实核 |
| 6 | 两 token 档 §6.3 表**整表重写**（非单点注记） | 表内全部坐标随 W11/W12/W13 失效（引用档已删）⇒ 单点注记不足；逐行收正为核面坐标 + 端壳存活档现体（判据 = 逐坐标实核在场）；机制条文零改（07:08 口径） |
| 7 | VSC `docs/**` 受众文档（D-C14 类）不在本笔收正面 | 派单只点名 4 档 + 接线面；越档收正 = 文档维护批面（W12 建议「并行写手停写后一次落定」）；审计 🔵 余列上抛 |

**未决 / 越段发现（只记 ✗ · 未处置）**

1. **台账 1 处（父侧收正）**：`docs/TODO.md:40`（条目「VSC DEFAULTS 已载 `autoThink: false` ⇒ 现为死键」）证据路径 = 本删除集 ⇒ 本席零触碰（台账 = 父侧写域）。消解 = 补「W16 已删——现体 = 核 `config.mjs` DEFAULTS」注记或改证据坐标；同事实在 `docs/core/design/AGENT-LOOP.md:62`/`:142` 亦为无注记形态（同批上抛）。
2. **删除集语义收窄（已披露）**：VSC 旧 `saveRaw` 的「跨调用读基线」冲突门（loadRaw→外部写→saveRaw 拒写）随 `config-io` 退场——核口径 = `writeConfigAtomic` 的 stat→read 写窗（核内权威、D-F5b 同族）；窗内他端写在 `persistRaw` 路径以「同一调用内新鲜读」吸收（合并写，零丢失），整对象写回路径窗更窄。判据 = 核内唯一写盘执行体裁定（#131）+ 核 `config-io.mjs:74-75` 实核。
3. **`specs.mjs` 端侧前缀表 vs 旧表逐值对拍未证**：旧档 `src/config.mjs` 已删（孪生树 `D:\teamcode\thincoder-vscode` 已不存在）⇒ 头注「行为 = 旧 VSC 规格表逐行同值」的**逐值对齐无基线可对**（审计如实登记「unverified，非矛盾」）；现证面 = T36 契约用例（字段在场 + 键集 + 前缀命中半例）。候选 = 父侧从 git 历史（`488c86c9^`）取旧档对拍一行。
4. **根域锚 28 悬空（他单元面 · 上抛）**：`AGENT-LOOP.md`×5 · `ARCHITECTURE.md:93` · `CONSULTATION.md`×4 · `CORE-UNIFICATION.md:1409` · `ESCALATE.md`×5 · `PROVIDER.md`×3 · `STRUCTURE-DEBT.md:21` · `TURN-CAP-CONTINUE.md`×2 ·
   `docs/core/requirements/{ESCALATE×4, TURN-CAP-CONTINUE×2}`——全为 W9/W10/W12/W13/W14 删除面在核心档的未收口坐标（本笔面 0）。
   消解形态 = W12 建议的「已迁核／已退役 + 现体」注记统一收口（判据 = 根域 0 命中）；落点 = 文档维护批 / W17 收口笔（并行写手停写后一次落定）。
5. **VSC 产品档 / CLI 档 D-C14 类残留（🔵 · 上抛）**：`thincoder-vscode/docs/{design,requirements}/**`（TOOLS/IMAGE-DOWNGRADE-VISION/CONTEXT-COMPACTION/SESSION/LEDGER-SELF-CONTAINED/AGENT-PARAMS/CONSULTATION/MULTI-INSTANCE-COLLAB 等）
   + `docs/vsc/**` + `thincoder-cli/docs/**`——提及配置模块（`config-io`/`config.mjs` 等）未加迁核注；档性 = 迁移期参照历史（D-C14 保留 ≠ 维护）+ 非本单元模块权威档列 ⇒ 归文档维护批。
6. **`AGENTS.md` 模块图**（VSC 树 + 仓根）文件地图行是否含本删除集 —— W9/W10 未决 5 同题；请父侧核对是否入 W17 收口笔范围（本笔零触碰）。
7. **并行在途面读数**：本笔全程独立复跑（无并行写手干扰）；读数见表（快层/全量/集成/核/三闸全绿——`T-DC6②` 转绿）。

**轮次自证**：审计 1 轮（DEVIATIONS 4 项 → Fixed 3 / Deferred 1） + advisor 代码评审 1 轮（见下段） + 修正轮 1（含审计派生 🔴 修复 + 回归用例）；终态 **0 未决 🔴 → clean**（未决 1/4/5 为上抛登记，无未决 🔴）。

**advisor 代码评审 1 轮**（`type=code` · sync · 对象声明 = W16 交付面（6 删档 + 改指源档 + 端壳消费面 + 测试档 + 文档档）；exclude = 他单元在途面）：**VERDICT: pass**（🔴 **0** · 🟡 4 · 🔵 4）。
评审限制（如实登记）：只读取证——未复跑测试/闸（读数引本段，标未复跑）；`## Project Standards` 未声明档；核树/CLI 树只读核对。
评审实核通过面（摘）：删除集零引用 ✓ · 全部 `@thincoder/core/*` 具名导入逐名在场（核 `exports: {"./*": "./*"}` 覆盖子路径）· `$schema` 缝全写盘面无旁路 · 写盘执行体迁核后自写抑制仍成立（核仅写成功后回调 ⇒ 冲突放弃零回调）· 审计 🔴 收口面（`config-mcp.mjs:67` + 回归例）✓ · 核工厂单例 + 仅 depth-0 注册 ✓ · 文档 5 档坐标逐条命中现体 ✓ · 核 `test/config.test.mjs` 承载旧格式可读断言 ✓。

**裁决表（8 项评审发现）**

| # | Action | Detail |
|---|---|---|
| 1 | **Fixed** | 🟡 `src/specs.mjs` 端差表丢 vendor 命名空间形态（聚合网关惯例 `vendor/model`）：核查找剥命名空间再试（核 `model-specs.mjs:121`），端差表只对原文 `startsWith` ⇒ `zhipu/glm-5.3` 等 ID 丢 `reasoningEffortDefault` ⇒ 面板预选从 "max" 退到枚举首项 "low"（`settings.mjs:385` → `settings-state.js:48`）。**修复** = `effortDefaultFor` 原文未命中且含 `/` 时按裸模型段重试（与核同法）+ 回归用例 `test/image-downgrade.test.mjs`「W16 回归（评审 🟡）」；§5 未决 3 的「逐值对拍无基线」随之收窄为「命名空间形态已对齐，余值对拍仍待父侧取 `488c86c9^`」。落盘 = `c4f4330`。 |
| 2 | Deferred | 🟡 `src/agent/setup.mjs:47` 核工厂实例未接测试缝（未传 `configPath` ⇒ 核回落常量 `configPath` 而非 `_configPath()`）——生产面同值零缺陷，潜在面 = 沙箱驱动完整 agent 回合时 `settings set` 会写真实用户配置（现状零命中）。消解候选 = 端侧经 `_configPath()` 供值或按 run 惰性实例化（触及工具登记面，须父侧裁）。**上抛**。 |
| 3 | **Fixed** | 🟡 `docs/core/design/SETTINGS-TOOL.md` §2.8 未登记热应用载体端差：核工具热应用写 `agent.config`（核 `settings.mjs:254`），VSC 载体键面无 `providers`/`memory`/`embedding`/`mcp` 段（`agent-state.mjs:96-107`）⇒ 这些键「运行中已生效」不落端侧运行读取源。**修复** = §2.8 补端差行（写盘为准 + 热应用限上列键面）。落盘 = `c4f4330`。 |
| 4 | Deferred | 🟡 体量：`agent/setup.mjs` 实读 676 行（>500 硬限——W16 前既存、承 R3/W12/W14 判例「登记不升级」，本席不重审）；`extension/settings.mjs` 实读 412 行（>300 软线，W16 迁入后越线）——**登记**：请父侧裁 `settings.mjs` 是否入批次档体量面 / 拆分规划。 |
| 5 | **Fixed** | 🔵 `src/specs.mjs:15-16` 注释误述兜底（「最高档」实为枚举首项）⇒ 随 #1 同批收正。 |
| 6 | **Fixed** | 🔵 `src/extension/settings.mjs:286` 陈旧 docstring（「Persist agent settings from the panel…」挂在 `saveProviderKey` 上）⇒ 改为现体描述。 |
| 7 | **Fixed** | 🔵 `src/config-mcp.mjs:3-6` 头注理由面陈旧（「re-exported from config-io.mjs…」——W16 后该镜及其 re-export 已删）⇒ 收正为端壳段现体。 |
| 8 | **Fixed** | 🔵 `src/agent/agent-state.mjs:79`/`:101-102` 注释仍以 `TRACES_DEFAULTS` 为现役符号（标识符随 W16 退场，代码用 `DEFAULTS.traces`）⇒ 注释改指核单源。 |

**修复轮 2**（审计派生 1 + 评审派生 2）：`04157c71`（🔴 收口 + 回归用例 + 文档同步）+ `c4f4330`（命名空间收口 + 回归用例 + 端差登记 + 四注记）。

**终态读数（评审后复跑 · 原样 · cwd = `thincoder-vscode/`）**：`npm test` = **551 / 516 / 0 / 35** · `npm run test:full` = **551 / 551 / 0** · `npm run test:integration` = **29 / 29 / 0** · `npm run lint` = 193 JS OK ·
`npm run doc:check`（VSC 域） = **0 命中** · 核 `node --test` = **178 / 178 / 0** · 仓根 `check-doc-width` = **OK（404 档零 >300）** · `check-ledger` = **OK（0 违规）** · `doc-anchors --domain .` = 28 悬空（全为他单元面；本笔面 0）。

**轮次自证**：审计 1 轮（DEVIATIONS 4 → Fixed 3 / Deferred 1） + advisor 代码评审 1 轮（pass · 🔴 0） + 修复轮 2（各派生一波，均已落盘并复跑）；终态 **0 未决 🔴 → clean**（未决 1/2/4/5 为上抛登记：父侧台账 1 处 · settings 工具测试缝候选 · 体量登记 · D-C14 档面维护批）。

### 实施：S2 W15 · AGENT-LOOP（重定 · 零删）——**终态 = clean**（2026-09-15 · eng-coder）

**段位**：实施第 7 波 · W15（重定——零删 · 修正轮-7）。任务书 = 本档 §2 W15（`:215`–`:227`）+ 四步协议 + A-K 判据 + 兜底句；设计面依据 = `AGENT-LOOP.md §6.18` · `I18N.md §3.1 D1` · `PORTABILITY.md §3.6` · `CORE-UNIFICATION.md §2.8`（`:1043`）。设计 token 由父侧设计评审签发（本段零凭证值）。
**写域** = 六档本体（`src/agent.mjs` · `agent/{setup,run-stages,setup-reminders}.mjs` · `explore-distill.mjs` · `i18n.mjs`）+ R5 落点两档（`extension/{panel-callbacks,panel-messages}.mjs`）+ 测试两档 + 根核档三档（三档均为「坐标/状态行」收正）。
**零触碰**：`thincoder-core/**` · `thincoder-cli/**` · 台账 `docs/TODO.md` · 仓根 `scripts/**` · 本档 §1–§4/§6 · 他单元段。

#### 一、交付摘要（重定四目标）

1. **核原语改指（六档，零删）**：`i18n.mjs` = 核 `projectDictionary` 投影底座 + 本地端特有键（webview 面）叠加（本地键恒胜）；
  `explore-distill.mjs` = 核 `summarizeRunExplorations` **端壳适配器**（agent 载体 ↔ 共享数组原位回收——面板/槽持引用不失效）；
  `setup-reminders.mjs` = 端特有面（env 行端身份 R4 · peer 感知 · 重启检测闸 · time 尾位）+ 核转口（`AUTO_REMINDER`/`ENG_*`/`injectEngineeringReminder`/`composeGitContext`/`collectGitContext` + 失败冷却测试缝 + `pushInjections`/`appendImagePointer`）；
  `agent.mjs` = #175a `autoThink` 消费点 + 载体镜像注收正；`run-stages.mjs` = `fireEndOfRunDistill` 改经适配器（核内基线失效/回收——端侧双重回收退场）；`setup.mjs` = `autoThink` 键随 cfgBag 归一。
2. **端壳缝四条落地（R2–R5）**：① **R2** `vscSubagentFace`（W13 落）**保留未动**；② **R3** #113 编辑器上下文/贴图注入面（`pushInjections(history, opts.injections)` 端壳调用位 = peer 之后、time 之前——序表断言面 `context-parity` 绿）；
  ③ **R4** 端身份行 VSC 自持（`END="vscode"` + env 行端生成；核 `END` 参数化 = 核内笔**未落**——见未决 4）；④ **R5** ⏹ queued 等待头回收 = **事件中继面**（新，见三）。
3. **循环契约位移 = 调用期适配（F7 定形）**：live `autoApprove` getter · `opts.distillState` ↔ 核 `agent._pendingDistill` · `opts.turnInput` ↔ 核 `consumeInjected` · 载体访问器别名（设计十款 + 端自持 `_engDesignTokens` = 十一绑定，住共享 `history`）——端形不变、核面零缝。
4. **#175 推理档位面**：(a) `autoThink` 死键复活（config → `agent.config.agent.autoThink` → 首轮核 `auto-think.mjs` 分类器；默认 false ⇒ **零行为变化**）；(b) 档位 patch **全程端侧**（`extension/reasoning-mode.mjs` → provider 字段数据面；核读点 `provider/core.mjs:52-53` · 落 body `:193-204`；核内零缝、零改动）。

#### 二、改动面（逐档 · 行数读数为 split('\n').length 口径）

| # | 档 | 动 | 读数（设计 → 现体） | 要点 |
|---|---|---|---|---|
| 1 | `src/i18n.mjs` | 改 | 56 → **72** | `_load` = 核投影底座 + 本地叠加；`loadLocaleStrings`/`initLocale`/`t()` 形不变（`t()` 回退 :65） |
| 2 | `src/explore-distill.mjs` | 重写 | 157 → **54** | 核适配器（入参换道 + 出参原位回收 + 载体兜底还原；核回调不代传 ⇒ 不双份持久化） |
| 3 | `src/agent/run-stages.mjs` | 改 | 382 → **380** | `fireEndOfRunDistill` 只剩 `onDistilled` 触发；头注改指核 `agent/helpers.mjs`（`:4`） |
| 4 | `src/agent/setup-reminders.mjs` | 重写 | 252 → **130** | 端特有六名自持 + 核转口八名；删端侧 git/ENG 同构副本（冷却/maxBuffer/compose 语义随核） |
| 5 | `src/agent/setup.mjs` | 改 | 668 → **681** | `+autoThink` 归一（config → cfgBag → agentFields）；`vscSubagentFace`/hydrate 零动 |
| 6 | `src/agent.mjs` | 改 | 460 → **475** | `+autoThink` 消费（turn 0 / chat 前，核同点）；W9 载体镜像注收正（W15 定形 = 调用期适配面） |
| 7 | `src/extension/panel-callbacks.mjs` | 改 | 208 → **283** | `+relaySubagentEventToken`（事件中继单点）+ `onToken` 包装（识别即消费） |
| 8 | `src/extension/panel-messages.mjs` | 改 | 519 → **530** | ⏹ 路由合成 parent 补 `config`/`autoApprove` + `callbacks` 携事件中继（W12/W13「合成 parent 三缺」收口） |
| 9 | `test/agent-lifecycle-singleton.test.mjs` | 改 | +30 | #175a 归一用例（显式键 true / 缺省 false——`_setConfigPathForTest` 沙箱） |
| 10 | `test/chat-panel-messages.test.mjs` | 改 | +58 | ⑫ 增「cancelled(was:'queued') 事件 + 零裸文本泄漏」断言；⑬ 新增中继单测（9 事件 + 3 not-consumed） |
| 11 | `docs/core/design/AGENT-LOOP.md` | 改 | +8/− | §6.18 新增 W15 行（六面结句联改）+ eng-coder 行两坐标随 W12/W13 迁核收正 + 变更记录行 |
| 12 | `docs/core/design/I18N.md` | 改 | +4/− | §3.1 D1 状态列「S2 接线已落」+ `t()` 坐标 51→65 + 断言收正（见六·修复②） |
| 13 | `docs/core/design/PORTABILITY.md` | 改 | +6/− | §3.6 头部 W15 状态注 + 变更记录行 |

六档合计 **1975 → 1792（−183）**——装配面净减（设计表 5 口径「净减」达成；`setup.mjs` 单档 +13 为 `autoThink` 归一，<500 目标未落 ⇒ 未决 2）。

#### 三、事件中继面（新——R5 · ⏹ queued 等待头回收）

核异步族经 `ctx.callbacks.onToken` 发 **relay 前缀 `⟦ev⟧` 事件 token**（TUI 消费面）；VSC 消费面 = `{type:"subagent"}` 状态消息（webview `activity.js applySubagentStatus`）。W12/W13 镜像删旧后该转换面缺失 ⇒ 本笔落**单点** `relaySubagentEventToken(panel, tok)`（`panel-callbacks.mjs:38-83`）：

- 映射（逐格式与核发射面对拍一致）：`⟦ev⟧queued` → `queued`（position/waiting/reason；kind `slot`/`depc`/余 · 载荷 `\x1e` 分隔）· `⟦ev⟧async`+`[model]` → `started`（pool:true + model + startedAt；pending 表挂 panel 弱映射）·
  `⟦ev⟧turn` → `turn`（turn/maxTurns）· `⟦ev⟧cancelled` → `cancelled(was:"queued")`（等待头移除）· `⟦ev⟧stopped` → `cancelled`（冻结 stopped）· `⟦ev⟧settled` → `settled`（驻留待消化）· `⟦ev⟧done` → `done`（归档）。
- **策略**（已写入 `AGENT-LOOP.md:395`）：未映射 `⟦ev⟧` 事件静默消费（不泄漏进聊天文本；`⟦ev⟧approval` 走 `onSubagentApproval` 结构化通道）；嵌套 relay 前缀按 head 折叠到外层块；非事件 token 原样转发。
- **⏹ 路径**（`panel-messages.mjs:286-299`）：核 `executeCancelAction` 的 `⟦ev⟧cancelled` + `refreshQueuedTokens`（队列位次前移）经合成 `callbacks.onToken` → 中继 → webview；合成 parent 同批补 `config`（`poolLimitsFor` 按生效值补位——不再回退默认 4/4）与 `autoApprove`（AUTO 档依赖者自动启动真值）。

#### 四、决策透明表（设计未明写者）

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | 删除集 → 零删、新家 = 原地（F6） | 修正轮-7 裁定（同路径 ≠ 同内容：六档 = 独立分叉实现）；备选（直删）= 静默丢弃端装配面/端特有提醒/注入序/身份行 |
| 2 | i18n = 核投影底座 + 本地叠加（本地键恒胜） | I18N D1「容器归一、投影端差」；值面冻结（32 核域键本地副本逐字同值实核）；备选（摘除本地核域键）= 与直读 `locales/*.json` 的测试面同批才可 ⇒ 登记未决 3 |
| 3 | `setup-reminders` 端特有面自持 + 核转口（非整档转口） | 核同名档含端不需要件（核路径解析/端名零）；端特有六名（env/peer/重启闸/time/…）核无对位件；端差登记 = R4 身份行 |
| 4 | 蒸馏适配器用**共享数组原位回收** | 面板/槽持同一 history 引用（核 write-replace 换数组会让引用失效）；备选（改调用方持新引用）= 触及面板/槽面（否决） |
| 5 | 事件中继落端壳单点（`panel-callbacks`），核内零缝 | R5 端差走端侧装饰/注入（承 W13 判例）；核内加缝 = 越核写域（否决） |
| 6 | ⏹ 路径合成 parent 补 `config`/`autoApprove` + 事件回调 | W12 评审 #1 Deferred「合成 parent 三缺」收口；核读点实核（`subagent-async.mjs:95`/`:272`） |
| 7 | `autoThink` 消费点 = 首轮 chat 前（核 `agent.mjs` 同点） | 核单源分类器（`auto-think.mjs`）+ 面板档位共用 provider 字段面；默认 false ⇒ 无行为变化 |
| 8 | 未映射 `⟦ev⟧` 静默消费 + 嵌套前缀折叠 | 防协议 token 泄漏进聊天文本；VSC 另有结构化通道者不受影响（审计 O5/O6 已并入设计行） |
| 9 | 六档外改动 = R5 落点两档 + 两测试档 | 事件面落点由 R5 任务书指名（「等待头回收并入本单元验收」）；如实披露（超六档声明面） |

#### 五、验证读数（终态复跑 · 原样 · cwd = `thincoder-vscode/`）

| # | 判据 | 开工基线（本笔实测） | 终态 |
|---|---|---|---|
| A-K1 | `npm test`（快层） | 551 / 516 / **0** / 35 | **553 / 518 / 0 / 35**（+2 = 新增用例） |
| A-K1 | `npm run lint` | 193 JS OK | **193 JS OK** |
| A-K1 | `npm run test:full` | 551 / 551 / 0 | **553 / 553 / 0** |
| A-K1 | `npm run test:integration` | 29 / 29 / 0 | **29 / 29 / 0** |
| A-K1 | `npm run doc:check`（VSC 域） | 0 命中 | **0 命中** |
| A-K2 | 核回归 `node --test`（cwd = `thincoder-core`） | 178 / 178 / 0 | **178 / 178 / 0**（核零改动） |
| A-K3 | 仓根 `check-doc-width` | OK（404 档） | **OK（404 档零 >300）** |
| A-K3 | 仓根 `check-ledger` | OK（0 违规） | **OK（0 违规）** |
| A-K3 | 仓根 `doc-anchors --domain .` | **28 悬空**（全 = W9–W14 他单元面） | **27 悬空——本笔零新增**（顺带收正 1：`AGENT-LOOP.md:391` token 门坐标 → 现体核坐标） |

**基线口径注**：任务书 A-K8 表记「633/592（W2 落地时点）」与本笔开工实测 551/516 **不符**（其后单元删除/退役数轮）——本段以**开工实测**为基线（改造前后逐数一致，增量可归因）。

**专项验收（逐条机判）**：
① **六档零断链（反向判零口径）**：消费面逐名在场（`audit` 独立复验 + 全量套件绿）；六档无删除、无重命名导出面缺失。
② **装配输出零字面**（与 W2 同门）：本笔未触碰 prompts 装配面；既有门在全量套件内绿（553/553）。
③ **提示词装配面（assemblePrompt 挂点经核）**：未触碰（W2 已收）；
④ **hooks 四事件名冻结（未涉面）**：hooks 面在核（`hooks.mjs` + `dispatch.mjs`），本笔核零改动；VSC `src/` 对四名零命中实核。
⑤ **载体 10 字段端壳双侧化**：访问器别名 11 绑定在位（设计十款 + `_engDesignTokens`），核写侧经父对象入口落共享 `history`；`async-parity`/`suspension` 面套件绿。
⑥ **⏹ queued 等待头回收（事件面）**：`chat-panel-messages.test.mjs` ⑫/⑬ 断言 = 出队 + 墓碑 + `cancelled(was:'queued')` 事件 + 零裸文本泄漏；中继映射逐格式与核发射面（scheduler `:337` / async `:262` / settle `:228,:262,:264` / run `:143,:145`）对拍一致。

#### 六、内部轮（审计 + 代码评审）

- **审计 1 轮**（explore · 只读 · 阻塞）：**VERDICT: CLEAN**（四类偏差零）——逐条实核 A–F 六判据 + 五条对抗性风险（适配器回收 / 提醒转口碰撞 / i18n 叠加 / 静态闭包不达 `node:sqlite` / 未映射事件策略）；附观察项 7（O1–O7，见未决 5/6）。零 git 限制如审计自述（删除面/核零改动按磁盘实读辅助）。
- **advisor 代码评审 1 轮**（type=code · sync · 对象声明 = W15 交付面 10 档）：**VERDICT: pass**（🔴 **0** · 🟡 4 · 🔵 2）。评审实核通过面摘：事件中继链逐环对拍 ✓ · ⏹ 路由真值供给与核读点同形 ✓ · 核原语转口符号逐名在场 ✓ · 三份模块权威档与码一致 ✓。

**裁决表（6 项）**

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 🟡 `agent/setup.mjs` 681 行 >500 硬限且本单元「目标落 500 内」未达成（设计表 5 自注「未落 ⇒ 拆分计划另议」）。与 W12/W14/W16 同判例 **R3 登记不升级、不阻断**；消解路径 = 该档下次实质改动时拆分（父侧裁定面）。 |
| 2 | Deferred | 🟡 `extension/panel-messages.mjs` 530 行 >500 硬限（W13 已登记「不升级」；本笔 +11）。维持登记；同表 5「消解条件 = 下次实质改动」。 |
| 3 | **Fixed** | 🟡 i18n 断言与现状不符：核域键在 `locales/{en,zh}.json` 仍有 32 键同值副本 ⇒「壳内零核域文案副本」不成立。**修复（文档侧）**：`src/i18n.mjs:17-20` 头注 + `I18N.md §3.1 D1` 状态列收正为「双源冻结（32 键逐字同值；摘除候选登记）」；值面零改（摘除与直读 locales 的测试面同批——未决 3）。 |
| 4 | Deferred | 🟡（协调项）子代理**内容面** chunk 通道在现体无 host 侧数据源：中继只消费事件、其余原样转发（`panel-callbacks.mjs:190-191`），而 webview 活动区块入口要求 `sub:role#id` 频道名（`webview/chat.js:295`）——`src/` 零生产点（W13/W14 删旧后未补）。子代理流式正文/推理/工具事件现以 `role#id/` 前缀裸投主气泡。**不在 W15 验收面** ⇒ 不作 🔴；归属待父侧裁（W13 残留一笔 vs 本面扩一条映射）——未决 1。 |
| 5 | **Fixed** | 🔵 载体面两项如实登记：① `_engDesignTokens` 别名晚于 hydrate（已登记批次档 `:2261`，不重审）；② 设计句「全部 10 字段先在 history 侧补建」现体预建 6 档（余 5 档靠 setter 落 `history`——**行为等价**）。**修复（文档侧）**：本段 + `AGENT-LOOP.md:395` 记等价说明（十一绑定）。 |
| 6 | **Fixed** | 🔵 `PORTABILITY.md:104` 新注锚定误标（「`:81-84` = 父门实体」实为 eng-coder **子门**实体；父门实体 = `:92`）。**修复**：该行改「`:78` 子门注释段 · `:81-84` 子门实体 · `:92` 父门（门条件）/`:97` hint 分支」。 |

**修复轮 1**（评审派生 · 文档侧 2 项 + 说明面 2 项）：落盘后复跑全链读数见五（快层 553/518/0 · 全量 553/553 · 集成 29/29 · 核 178/178 · `doc:check` 0 · 三闸 0 新增）。
**轮次自证**：审计 1 轮（CLEAN）+ advisor 1 轮（pass）+ 修复轮 1；终态 **0 未决 🔴 → clean**（未决 1/2 为登记/协调、3–6 为转口登记，无阻断项）。

#### 七、未决 / 越段发现（只记 ✗ · 未处置）

1. **子代理内容面 chunk 通道**（评审 #4）：`relay 前缀 → sub:role#id` 频道名生产者缺失（`webview/chat.js:295` 入口在位）；消解 = 补 host 侧生产者（复用 `toolPanelPayload`/`onToolPanel`）或登记为后续单元面。
2. **体量两档**：`agent/setup.mjs` 681（>500 硬限；W15 目标未落 ⇒ 拆分另议）· `extension/panel-messages.mjs` 530（登记维持）。
3. **i18n 本地核域键副本**（32 键 ×2 档，逐字同值）：摘除候选——须与直读 `locales/*.json` 的测试面（`digest-visibility`/`status-line`/`child-permission`/`config-pool`/`activity-flow`）同批；本笔仅收正断言。
4. **核内笔（本批零触碰 · 未落）**：#112 read_image 门（运行期能力重解）· 核 `END` 参数化（端身份面）· `depInfo` C-6 差异——承修正轮-7「核内笔清单」。
5. **审计观察项 O1/O2**（载体面 · 已登记/等价）——见裁决表 #5；**O7**：VSC 产品档（`thincoder-vscode/docs/**`）与 `docs/design/AGENT-LOOP.md:452` 的「蒸馏本体住 `src/explore-distill.mjs`」类陈旧归属 = 迁移期参照历史（D-C14），归文档维护批。
6. **根域锚 27 悬空**（基线 28）：全 = W9–W14 他单元删除面在核心档的未收口坐标；本笔零新增、顺带收正 1（`AGENT-LOOP.md:391`）；消解形态 = 文档维护批统一注记。
7. **越段发现**：无（本笔未触碰本档 §1–§4/§6 与他单元段；`.thincoder/tmp/` 临时日志 = 本笔窗口读数落点，不入提交）。

#### 八、提交（单笔）

`git commit --only` ⇒ **`00b3dc83`**（13 档 · **+305/−338**；`refactor(vsc): W15 agent-loop - core single-source repoint, subagent event relay, autoThink key`）。
含：六档本体 + R5 落点两档 + 测试两档 + 模块权威档三档。**批次档本体未入本笔**（父侧统一）；`thincoder-core/**` 零改动。
回滚点 = `git revert 00b3dc83`。凭据纪律：本段零 token/designId 值。

**收正注（同轮 · 首版后置 · 零语义）**：本段首版 3 行超宽（`:2441` 556 / `:2442` 306 / `:2470` 379 字符）经本席就地机械折行（仅插换行 · 文字零改）；复跑 = 本档 0 行 >300（`check-doc-width` OK）。

### 实施：S2 W17 —— 收口笔（vsix 断言 / AGENTS.md / 锚扫 / 孤儿档）——**终态 = clean**（2026-09-15 · eng-coder）

**段位**：实施第 8 波 · W17（**不占单元号**——承 U0 前置笔形态）。任务书 = 本档 §2 A-K11（`:282`）+ 表 3 四行（`:462`–`:469`）+ 修正块「S2 收口笔」专节（`:458`–`:476`）+ 父侧增补 ⑤–⑧。
**写域** = 表 3 四档（`thincoder-vscode/{AGENTS.md, package.json, scripts/check-vsix.mjs（新）, scripts/publish-all.mjs}`）+ 锚扫面（`docs/core/**` 10 档 + `docs/vsc/**` 4 档）+ ⑥⑦⑧ 落点（孤儿档删除 + 产品档两行 + `session-slots.mjs:40` 注释 + `ARCHITECTURE.md` 模块图行）。
**零触碰**：`thincoder-core/**` 实现（只读消费）· `thincoder-cli/**` · 台账 `docs/TODO.md` · 仓根 `scripts/**` · 本档 §1–§4/§6 · 他单元段。批次档本体不入提交（父侧统一）。凭据纪律：本段零 token/designId 值。

#### 一、交付摘要（逐件 · file:line 读数）

① **`thincoder-vscode/AGENTS.md`**（125 → **122** 行 · wc -l）：约定段核化改述 4 处——`:5`（概览：机制本体 = `@thincoder/core`，本树 = 端壳/装配面）· `:7`（设计档归属：`docs/design/` = 迁移期参照历史；正本 = 仓根 `docs/core/design/`）
  · `:11`（HC 句：「Zero **third-party** npm runtime dependencies」+ `@thincoder/core` 一条在册 + dev-only `yauzl` 括注）· `:15`（提示词面 = 核内唯一副本 15 + 25，`src/prompts/` 与 `src/tools/*.md` 已删 · F9）。
  文件地图段：**删 15 行**已删档行（`agent-tools.mjs` · `subagent-{actions,async,scheduler}.mjs` · `read-history-discovery` · `batch-segment` · `tools/checkpoint` · `tools/git-ext|git-checkpoint` · `mcp.mjs` · `provider.mjs` · `provider/rate` · `log.mjs` · `memory.mjs` · `config.mjs` · `prompts/`）
  + **增 11 行**现体面（`src/agent/**` · `agent-tools/{index,async-discard}.mjs` · `config-mcp` · `embed-config` · `explore-distill` · `i18n` · `memory-tool` · `prompt-injections` · `tools/{index,shell,code,context,focus,shared}` · 地图头注「机制本体 = 核——已删自持镜像不再列行」）。
  同批陈旧坐标收正 6 处：`:23`（config-migrate/PROVIDER_PRESETS → 核）· `:26`（specs.mjs = 核 model-specs + 端增补面）· `:27`（`applyEditorRangeEdit` 标 retired（W14））· `:30`（isNonRetryableError/readSSE → 核 `provider/`）· `:34`（checkpoint 实现 → 核 `git/checkpoint.mjs`）
  · `:117`（测试段：删档名清单 → `test/files.mjs` 单一来源指针 + 例数 1060+ → **553**）。**实核**：地图所列 25 项逐条 `statSync` 在场；已删档族零列行。

② **`thincoder-vscode/scripts/check-vsix.mjs`（新建 · 72 行）**：解 vsix 断言 **B + D**——B = `:48` 取 `extension/node_modules/@thincoder/core/package.json`，`:51`–`:53` 其 `version` 与**仓内** `thincoder-core/package.json` 逐字比对（`CORE_PKG` = `:24`）；
  D = `:57`–`:67` 逐目录（`prompts` / `tool-docs`）判 ① 档数硬等口径（`:29` `EXPECT = {prompts:15, "tool-docs":25}`）② 档名集合逐字 ③ 逐档 sha256。
  fail-closed：`:27` 缺档/`:43` 解包失败/`:69` 断言失败 → exit 1。零构建 · 只读（`lazyEntries + autoClose:false`，`yauzl` 为 devDependency）。
  **机判实证（真安装态夹具）**：core tarball（`npm pack` · 190 档）`npm install` 进 VSC 树拷贝（非 junction——对齐发布机 `npm ci` 口径，§2.2.1 R8③）→ `npm run package`（315 档 vsix · 1.19 MB）→ npm 生命周期 **postpackage** 自动跑断言
  ⇒ `✔ 断言 B（@thincoder/core 0.1.0）` + `✔ 断言 D/prompts（仓内 15 档 · 口径 15）` + `✔ 断言 D/tool-docs（仓内 25 档 · 口径 25）` = **exit 0**。
  **反证（T-C11①）**：夹具 `.vscodeignore` 去掉 `!node_modules/@thincoder/core/**` 重打包 ⇒ vsce 仍 `DONE` exit 0 但 vsix 125 档无核 ⇒ 断言 B 缺条目 + 断言 D 缺 15/25 全量 ⇒ **exit 1**。

③ **`thincoder-vscode/package.json`**（134 → **136** 行 · +2）：`:119` `"postpackage": "node scripts/check-vsix.mjs"`；`:134` devDeps `"yauzl": "^3.4.0"`（树内实装 3.4.0 同值）。真依赖面核对 ✓：`dependencies = {"@thincoder/core": "^0.1.0"}`，去 `^` 后 = 核 version `0.1.0`（断言 A 口径成立）。

④ **`thincoder-vscode/scripts/publish-all.mjs`**（105 → **137** 行 · +32 · 表 3 估 +8±4 —— 按实收正）：**段 0** = `:76`–`:86` 核版本存在性预检（`npm view @thincoder/core@<仓内核版本> version`；真跑缺版本 ⇒ `:86` exit 1——fail-closed；dry 面降级为警告）；
  **段 1.5** = `:99`–`:100` 调 `check-vsix.mjs`（经 `run()` = execSync 非零即抛）；段 1（`:89`）· 段 2（`:106`–`:118`）· PAT 预检（`:60`–`:67`）语义原样；
  新增 `--dry-run`（`:51` · A-K11 机判面「发布编排 dry 面」）——段 2 不执行（`:103`–`:104`）、PAT 预检免（dry = 零发布）。
  **实证**：`node scripts/publish-all.mjs <vsix> --dry-run` ⇒ **exit 0**（段 0 报 ✘+⚠️ 继续 · 段 1⏭️ · 段 1.5 断言 B+D 全过 · 段 2 🧪）；真跑（无 dry-run + 占位 PAT）⇒ 段 0 缺核版本 ⇒ **exit 1**（核先发门在位）。

⑤ **根域锚闸 27 → 0**（`node scripts/doc-anchors.mjs --domain .` ⇒ **`OK(V5): 0 条悬空锚` · exit 0**）：27 行逐处注记（形态 = 「已迁核/已退役——现体 = `<核路径>`」）分布于 10 档——
  `AGENT-LOOP.md` ×4 · `ARCHITECTURE.md` ×1 · `CONSULTATION.md` ×4 · `CORE-UNIFICATION.md` ×1 · `ESCALATE.md` ×5 · `PROVIDER.md` ×3 · `STRUCTURE-DEBT.md` ×1 · `TURN-CAP-CONTINUE.md` ×2 · `requirements/ESCALATE.md` ×4 · `requirements/TURN-CAP-CONTINUE.md` ×2。
  指向坐标逐条实核在场（`thincoder-core/{advisor,agent-tools,provider,memory,git,tools}/**` · `model-specs.mjs` · `token-ttl.mjs` · `config-io.mjs`）。
  `docs/design/EDIT.md` 类同扫：产品树编辑族六档（`EDIT/EDIT-HELPERS/WRITE/HASHLINE-EDIT/INSERT-AFTER/APPLY-PATCH.md`）实核 **已带 W14 迁核注**（零动作）。

⑥ **孤儿档清退**：删 `thincoder-vscode/src/agent-tools/read-history-discovery.mjs`（118 行 · W9 删 `read-history.mjs` 后零消费者；全树 grep basename + 四导出名 = 代码面 0 命中）+ `thincoder-vscode/docs/design/READ-HISTORY-SPLIT.md:30/:51` 两行收正（「W17 已退役——孤儿档删除」）+ `src/extension/session-slots.mjs:40` 注释消费方面收正。

⑦ **`docs/core/design/ARCHITECTURE.md` 模块图行**：`:93`（LLM 行 → 核 `thincoder-core/provider/**` + W10 退役注）· `:94`（支撑行 —— memory/embedding/indexer/mcp 四镜像已退役〔W7/W8〕，存 `repomap.mjs`）；fix 轮增补 `:76`（壳面目录清单收正）· `:82`（§3.1 头句「全量自持」→ W17 收口后 = 端壳/装配面）· `:140`（§4.1 记忆行 → 核单源）。

⑧ **`docs/vsc/**` D-C14 类残留坐标** 9 处 / 4 档：`SETTINGS.md:58`（expand-home → 核）· `:38`/`:68`/`:70`（config-io → 核 + 写盘通道）· `VSC-MIGRATION-INVENTORY.md:39`（advisor 面 → 核）· `:468`（W5/W8/W12 五档坐标逐条注）
  · `WEBVIEW-PROTOCOL.md:70`（subagent-run → 核）· `requirements/PROJECT.md:22`（模型能力 → 核 specs）· `:24`（provider transport → 核）。

#### 二、决策透明表（设计未明写者）

| # | 决定 | 依据 / 备选 |
|---|---|---|
| 1 | `publish-all.mjs` 新增 `--dry-run`（表 3 未列） | 依据 = A-K11 机判面「发布编排 dry 面」（无该面则预检段不可在非发布态实跑）；代价 = 表 3 估 +8±4 收正为 **+32**（读数表在案）；备选（不加标志、以段 0/1.5 直跑代替）= 机判面缺失，否决 |
| 2 | vsix 断言验证走**真安装态夹具**（core tarball `npm install` 进 VSC 树拷贝） | §2.2.1 R8③：dev 链接态（junction）打包语义 ≠ 发布机；发布机口径 = 真实安装态（§2.6.1）；备选（仓内直跑 `npm run package`）= 链接态、非发布机形态，否决 |
| 3 | 夹具落点 = **仓库树外**（OS temp） | 首版落 `.thincoder/tmp/w17-pkg/` 时锚引擎 basename 索引被污染（`.thincoder` 不在 `SKIP_DIRS`：`doc-anchors-v5.mjs:48`），悬空数 27 → 89 假警；移出后 0。如实登记为该轮操作教训 |
| 4 | ⑥ 范围 = 删档 + 两文档行 + `session-slots.mjs:40` 注释 | 父侧增补面（超表 3 —— 如实披露）；判据 = 零消费者实核 + 不留「在位」形态叙述 |
| 5 | ⑦ 扩至 `:94` + fix 轮 `:76`/`:82`/`:140` | W10 登记句（批次档 `:1848`）明含「+ `{memory,embedding,indexer,mcp,repomap}.mjs` 等 W7/W8 面」——同族同批收正；`ARCHITECTURE.md` = 07:08 裁定的模块权威档面 |
| 6 | ⑧ 范围 = `docs/vsc/**`（基准层活档）**不含** `thincoder-vscode/docs/**` 产品树 | D-C14「迁移期参照历史·保留 ≠ 维护」+ W16 决策表 #5（产品档归文档维护批）；产品树 376 处提及 / ~50 档未逐处收口 ⇒ 上抛（未决 3） |
| 7 | 台账/设计档零触碰 | 台账 = 父侧写域；本档 §2 的两处保留句（`:180`/`:241`）收正 = 设计面动作 ⇒ 上抛（未决 1） |

#### 三、审计与代码评审轮次（终态）

- **审计（explore · 只读 · 阻塞）1 轮**：**四类偏差零**（PARTIAL 0 · DOC-DRIFT 0 · OUT-OF-LIST 0 · SILENT-SIMPLIFICATION 0）。观察项 5（O1–O5），其中 O1（`src/tools.mjs` 行括注）/O5（`CORE-UNIFICATION.md:364` 裸名）已在 fix 轮收正。
- **advisor 代码评审 1 轮**（`type=code` · sync · 对象声明 = W17 交付面）：**VERDICT: pass**（🔴 **0** · 🟡 3 · 🔵 7）。评审限制（如实登记）：只读取证、未复跑；`## Project Standards` 未声明档。

**裁决表（10 项评审发现）**

| # | Action | Detail |
|---|---|---|
| 1 | **Not an issue** | 🟡 lock 未随新 devDep `yauzl` 重生成（`package-lock.json:11-16` 根条目无 yauzl；唯一 yauzl 节点 `:5184` = `@vscode/vsce` 传递依赖）——**设计口径内**：`CORE-UNIFICATION.md:470`「S2 期间的产品 lock 变更**不入提交**；权威形态 = S2 收口（核发布后 · 真实安装态）生成并提交」；本笔不跑 `npm install`（会写入链接态 lock，属不入提交形态）⇒ 刷新动作归发布运行面 |
| 2 | **Fixed** | 🟡 `ARCHITECTURE.md` 收正未闭环 —— `:76`（壳面目录清单去 advisor/provider/memory/prompts）· `:82`（§3.1 头句改 W17 现况）· `:140`（记忆行改核单源）三处已落（本笔提交内，`ARCHITECTURE.md` 10 行变更） |
| 3 | **Fixed** | 🟡 孤儿档清退无授权/登记（§2 `:180` 保留句 + 表 3 未列 + 「§5 指针」）—— 本段即登记面（④/⑥ 明文 + 决策表 #4 超声明）；设计面 §2 两处收正 = 上抛（未决 1） |
| 4 | **Fixed** | 🔵 断言 D 无档数锚 —— `check-vsix.mjs:29` 加 `EXPECT = {prompts:15,"tool-docs":25}` + `:65` 档数硬等；夹具复跑 = 「档数达标 + 档名集合逐字相等 + sha256 逐档相同」全过 |
| 5 | **Fixed** | 🔵 AGENTS.md 未记新发布门 —— `:121` 加 Packaging assertion 行（postpackage = check-vsix · fail-closed）+ `:11` 加 dev-only `yauzl` 括注 |
| 6 | **Fixed** | 🔵 终态复验覆盖 + postpackage 触发链无留痕 —— fix 后冻结态复跑：VSC 五命令 + 核回归 + 仓根三闸（读数见四）；夹具 `npm run package` ⇒ **postpackage 自动触发 ⇒ 断言 B+D exit 0**（日志 `w17-postpackage2.log`） |
| 7 | **Fixed** | 🔵 `SETTINGS.md:38`/`:68` 裸名 `config-io` 无迁核注 —— 两处补 W16 注（现体 = 核 `thincoder-core/config-io.mjs`） |
| 8 | **Fixed** | 🔵 行数台账未按实收正 —— 本段收正：`publish-all.mjs` **+32**（估 +8±4）· `package.json` **+2**（估 +8±3）；`AGENTS.md` 122 行（估 ±4+≈15 行档行——净减 3，带内） |
| 9 | **Deferred** | 🔵 锚扫收正未留变更记录行（模块权威档 vs VSC 产品档「免记」两先例并存）—— 口径待父侧定；本段已全量登记点名与注记形态，可作统一收口面（未决 4） |
| 10 | **Not an issue** | 🔵 `check-vsix.mjs` 随 vsix 打包（`scripts/**` 未在 `.vscodeignore` 排除）—— 表 3 明记 `.vscodeignore` 零改；与既有三档（`check-syntax`/`publish-all`/`reconcile-lookup`）同形态 |

#### 四、验证读数（基线 → 终态 · 冻结态复跑 · 原样）

| # | 命令 | 基线（开工实测） | 终态 |
|---|---|---|---|
| 1 | VSC `npm test`（快层） | 553 / 518 / 0 / 35 | **553 / 518 / 0 / 35** |
| 2 | VSC `npm run lint` | 193 JS OK | **193 JS OK**（+1 新档 −1 孤儿档） |
| 3 | VSC `npm run test:full` | 553 / 553 / 0 | **553 / 553 / 0** |
| 4 | VSC `npm run test:integration` | 29 / 29 / 0 | **29 / 29 / 0** |
| 5 | VSC `npm run doc:check`（VSC 域 strict） | 0 命中 | **0 命中** |
| 6 | 核回归 `node --test`（cwd = `thincoder-core`） | 178 / 178 / 0 | **178 / 178 / 0**（核零改动） |
| 7 | 仓根 `check-doc-width` | OK（404 档） | **OK（404 档 · 一致性 V1/V2/V3 新增 0）** |
| 8 | 仓根 `check-ledger` | OK（0 违规） | **OK（0 违规）** |
| 9 | 仓根 `doc-anchors --domain .` | **27 悬空**（FAIL 闸态） | **0 悬空 —— `OK(V5): 0 条悬空锚`（exit 0）** |
| 10 | vsix 断言（真安装态夹具 · postpackage） | — | **断言 B + D 全过 · exit 0**（315 档 vsix；反证无核盘 ⇒ exit 1） |
| 11 | 发布编排 dry 面 | — | **exit 0**（段 0 ⚠️/段 1⏭️/段 1.5 ✔/段 2 🧪）；真跑 ⇒ 段 0 fail-closed exit 1 |

**判据注**：A-K1 口径 = **零新增**（用户裁定 2026-09-15 15:12）；本笔改动 = 脚本档 + 文档档（src/test 零变更，测试读数与基线逐数一致）。长测试先落盘（`.thincoder/tmp/`）后读摘要。

#### 五、未决 / 上抛（父侧 / 设计面）

1. **§2 两处收正（设计面）**：`:180`（W9 行「read-history-discovery 保留」）与 `:241`（薄壳面清单含 `read-history-discovery`）——本笔已删该档 ⇒ 建议 eng-designer 修正轮注（收正两处，或在 §5 明文承接，二选一）。
2. **lock 刷新 + 发布机 `npm ci`**（评审 #1）：归核发布后的发布运行面（§2.6.1 锁面口径）；本笔零触碰。
3. **产品树 D-C14 残留**（评审范围外同题）：`thincoder-vscode/docs/**` 376 处提及 / ~50 档 + `thincoder-cli/docs/**` —— 归文档维护批（W16 未决 5）。
4. **变更记录行口径**（评审 #9）：`docs/core/**` 模块权威档补 W17 行 vs 统一免记——请父侧定后一次落定（避免半维护形态）。
5. **前序单元遗留**：仓根与产品树约 90 档未跟踪临时 `*.txt`（`core-regress.txt` · `w12-*.txt` · `w14-*.txt` 等，W12/W13/W14 面）——非本笔写域，建议父侧清运（本笔临时物全落 `.thincoder/tmp/`）。
6. **核内笔清单**（承 W15 未决 4 · 本笔零触碰）：#112 read_image run 期重解 · 核 `END` 参数化 · `depInfo` C-6 差异。

#### 六、提交（单笔）

`git commit --only` ⇒ **`da9101fe`**（21 档 · **+189/−206** · `chore(vsc): W17 close-out - vsix check, AGENTS.md map, anchor sweep, orphan drop`）。
含：`AGENTS.md` · `package.json` · `scripts/check-vsix.mjs`（新）· `scripts/publish-all.mjs` · `src/agent-tools/read-history-discovery.mjs`（删）· `src/extension/session-slots.mjs` · `docs/design/READ-HISTORY-SPLIT.md` ·
  `docs/core/{design ×8, requirements ×2}` · `docs/vsc/{design ×3, requirements ×1}`。**批次档本体未入本笔**（父侧统一）；`thincoder-core/**` 零改动。
回滚点 = `git revert da9101fe`。

**轮次自证**：审计 1 轮（四类偏差零）+ advisor 代码评审 1 轮（pass · 🔴 0）+ 修复轮 1（评审派生 7 修 / 2 判非问题 / 1 缓办——均已落盘并复跑）；终态 **0 未决 🔴 → clean**（未决 1–6 为上抛登记：设计面 2 处收正 · lock/发布面 · 产品树维护批 · 变更记录口径 · 前序遗留临时文件 · 核内笔）。

**收正注（同轮 · 首版后置 · 零语义）**：本段首版 9 行超宽（`:2562`–`:2564` · `:2566`–`:2567` · `:2572` · `:2575` · `:2582` · 首版提交行）经本席就地机械折行（仅插换行 · 去空白逐字节相等）；复跑 = 本档 0 行 >300（`check-doc-width` OK · 404 档）。

## §6 验证与收口（父代理）

**状态：已收口**（2026-09-15 · 全 16 单元 + 2 前置笔 + W17 收口笔落地核验；终态 = 全链绿）。

### 6.1 交付总账（逐单元 → 提交）

| 单元 | 提交 | 状态 |
|---|---|---|
| W8 前置笔（引擎下限 + 护栏） | `051b21a9` · `e0234ee1` · `c85f2d44`（父侧收尾） | ✅ |
| W1 LOGGING | `3a1ef09b` | ✅ |
| W2 提示词面 | `0ee40682` | ✅ |
| W3 TRACES | `c1256ef6` | ✅ |
| W4 WORKSPACE | `5faa4e0a` | ✅ |
| W5 CHECKPOINT | `a72f0fe8` · `7bde488a` · `de245d4c` | ✅ |
| W6 COMPACTION | `c90ddbdf` · `e9ea9bd1` | ✅ |
| W7 MCP | `33a9e0a7` | ✅ |
| W8 MEMORY | `a8d9e865` · `1decd99b` | ✅ |
| W9 AGENT-TOOLS | `99d2824b` · `ff7ff42a` | ✅ |
| W10 PROVIDER | `81e4b4c9` | ✅ |
| W11 SESSION | `168f8037` | ✅ |
| W12 ADVISOR | `67883dc0` · `5aebbcdb` · `99c9dafe`（评审补轮） | ✅ |
| W13 子代理/异步 | `c38dada0` | ✅ |
| W14 TOOLS | `06686ecb` · `a354e026` | ✅ |
| W15 AGENT-LOOP（重定 · 零删） | `00b3dc83` | ✅ |
| W16 CONFIG | `488c86c9` · `04157c71` · `c4f4330` | ✅ |
| W17 收口笔 | `da9101fe` | ✅ |
| 父侧/designer 线（记录面 · 档案轮 · 红线清扫 · 修正轮）= 14 笔 | 见 `git log`（如 `60f8bab2` · `cd00915` · `7b41767`） | ✅ |

### 6.2 终态全链读数（冻结 HEAD · 父侧实跑）
- VSC：`npm test` 553/518/0/35 · `test:full` **553/553/0** · `test:integration` **29/29/0** · `lint` 193 OK · `doc:check` **0 命中**
- 核：`node --test` **178/178/0**
- 仓根三闸：宽度 **OK**（404 档）· 台帐 **0 违规**（基线 0）· 锚 **0 悬空**（`OK(V5)` · exit 0）
- 收口行（台帐汇总）：`OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规（阻断——修掉）· 基线 0 条`
- **vsix 断言 B+D**：真安装态夹具 `npm run package` → postpackage **exit 0**（315 档 vsix）；反证（去 .vscodeignore 反排除）⇒ **exit 1** ✓

### 6.3 删除集总帐
**94 档 / 19,052 行**退役（原 100 档——6 档经修正轮-7 重判为端壳保留）；VSC `src/` 存活 = S 端壳 25 + extension 40 + webview/locales 面；核为机制单源。

### 6.4 验收对照（A-K1–K14 · 逐单元 §5 在案）
A-K1 零新增 ✓（各单元终态读数全绿；基线随单元推进的收缩逐笔登记）· A-K2 核零改 ✓ · A-K3 三闸 ✓ · A-K4 删除集零引用 ✓ · A-K5/K6 装配零字面/枚举空 ✓ · A-K7 单笔可 revert ✓（回滚点逐单元登记；共档 3 例已注）· A-K8 计数归因 ✓ · A-K10 模块权威档 ✓ · A-K11（W17）✓ · A-K12–K14（W8 专项）✓。

### 6.5 过程纪律记录（透明）
- **共档提交 3 例**：`provider.mjs`（W1 边随 W3 笔）· `setup.mjs`（W4 边随 W7 笔）· `agent.mjs`（W10 边随 W9 笔）——均如实披露；父侧 steer 后序单元按口径跳过。
- **孪生树事故 2 起**（W8 前置笔 3 档 / W12 24 档）：均自回滚 + 父侧独立复核干净；**旧树已改名 `_retired-thincoder-vscode`** + 工作区 AGENTS.md 零引用 ✓。
- **评审缺口 1 起**（W12 in-child advisor 未跑）⇒ 补轮补跑：抓出 **3 🔴（顾问池键形失配）** ⇒ 由 W13 收口（String 单源 + 夹具 + 回归断言）✓。
- **设计前提失效 1 起**（W15 打回）⇒ 修正轮-7 重定（零删重分类 + R1–R5）⇒ 重派落地 ✓。
- **域外一笔**（W4 改仓根 `scripts/check-ledger.mjs`）= 父侧追认（必要且最小；口径 = 同类先停下上报）✓。
- **父侧机械修**：记录面折行 ×5 批 · 重复注记折叠 208 处 · 台帐证据 re-point ×3 · 宽度闸 404 档全绿 ✓。

### 6.6 未决/移交（收口时点）
- **核内笔清单**（9 条 · 附实证坐标——详见各 §5）：① #112 read_image run 期能力重解 ② 核 `END` 参数化 ③ `depInfo`·C-6 差异 ④ 核 marker 面参数化（`resumeSlot(cwd,{end})`）⑤（cwd,slot）型 token 台帐补位 ⑥ `applySession` 机读线规则导出位 ⑦ idle 看门狗覆盖核对 ⑧ `recordChatTrace` 同步段 try 兜底（W3）⑨ `settingsTool` 测试缝（W16）。
- **文档维护批**：`thincoder-vscode/docs/**` D-C14 类 376 处/~50 档 + `thincoder-cli/docs/**` + 变更记录行口径。
- **技术待办 +2 行**（6→8）：`setup.mjs` 681>500 拆分 · 子代理内容 chunk 通道（W15 评审 #4）。
- **发现 11**（CLI `memory import` 导入器未落）——时序 ≤ 落地版本发布前。
- W12 评审残余（收留面回滚/注释/产品档注记）· W5 证据面（按「行为面归核测试承接」收口 ✓）。

### 6.7 收口动作（已完成）
- 工作区清理：~126 个 coder 临时 `*.txt` 已清运（仓根 + 产品树）✓
- 台帐：技术待办 6→8 行（计数联改 ✓）；需求池 23 条（VSC Auto 开关 = 本批关联条目· 待讨论）✓
- 凭证链：设计 token 终消费（`consume-design`）✓
- 本档状态行（档头）✓

**收口裁定**：本批验收依据 = 6.2 全链读数 + W17 断言 B+D 正/反实证 + 各单元 §5 专项验收在案 ⇒ **通过**。

**手测反馈（父侧记 · 2026-09-15）**：用户于调试态（Extension Development Host · `code --extensionDevelopmentPath`）实跑——**基础会话回路 ✓ 可以**（用户原话「至少会话是可以的」）；子代理/⏹ 取消/顾问链/挂起恢复/设置面板等面待续测（有反馈随记）。