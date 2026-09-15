# 核心统一 · VSC 壳代码接线（CORE-UNIFICATION -- VSC WIRING）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 用户「开始吧」（2026-09-15 06:46）+ 文档面迁移定稿（`2026-09-15-vsc-doc-migration.md` ✓）。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
>
> **导航（父侧维护）**：§1（裁定与讨论）→ 本档 §1；§2 当前任务书 → 本档 §2（designer 追加面）。
> **父侧折行·收正注（2026-09-15）**：§2 的 19 行长散文行经父侧机械折行（仅插换行 · 去空白逐字节相等 23,960 chars ✓ 零语义改动）——batch_segment append-only 无法自修，承迁移批先例「纯折行后重跑」。
> 同批收正 3 项：`STRUCUTRE-DEBT` → `STRUCTURE-DEBT` · `十字段` → `10 字段`（×4 · 对齐 `CORE-UNIFICATION.md` §2.6.3 U16 行权威写法）· `VSC-MIGRATION.md` 旧 §9 → `VSC-MIGRATION-INVENTORY.md §9`（V1 指针）。
> **同法（§3 · 2026-09-15 修正轮-4 后）**：§3 轮次 2 前言行父侧机械折行（**仅插换行**）+ 2 处形态收正——① 检索锚裸名引用 → 仓名限定形态（终态 = `AGENT-LOOP（CLI 仓·设计）§11.2`）；② 计数句去数字声明（终态 = 「残遗 = 计数面（见 #1 / #2）」）。零语义。
> **同法（§5 · 2026-09-15 · W2 实施段）**：§5 W2 块 7 行父侧机械折行（**仅插换行** · 零语义）——宽度闸复跑归零。
> **同法（§5 · 2026-09-15 · W6 段）**：§5 W6 块 5 行父侧机械折行（**仅插换行** · 零语义）——宽度闸复跑归零。
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
| 3 | 非同路径 47 档逐档读档分类：**M（核内语义镜像）28** · **S（VSC 特有薄壳/编排）19** · U 0（**修正轮-2**：`indexer.mjs` 改入删除集——保留 S 面 = **18**）—— 逐档证据见勘察记录（`advisor/main`→核 `advisor.mjs` · `mcp/{http,stdio,ws,utils}`→核 `mcp/transport-*`+`helpers`（前两者逐字同源）· `tools/checkpoint`→核 `git/checkpoint.mjs` · `tools/{wait_for,read_image,more-file,file-edit,hashline-edit,edit-fuzzy-match,edit-line-params}`→核 `tools/{ops,file,patch,edit-batch,edit-diff}` 等） | explore 子代理 · 逐档 file:line |
| 4 | 提示词面：`src/prompts/` **15 档 / 1,015 行** + `src/tools/*.md` **25 档 / 420 行** = 40 档 / 1,435 行（核内唯一副本 = `prompts/` 15 + `tool-docs/` 25） | 机械枚举 |
| 5 | **登记册差异实证**：`src/tools/index.mjs`（76 行）与核同路径但**内容为 VSC 装配面**（含 VSC 宿主工具 context/focus/shell/code/read_image/wait_for + 自持 builtinTools）⇒ 该档**保留**（同路径 ≠ 同内容——B1 分叉面实证）；`src/agent-tools.mjs`（1 行 barrel）vs 核 17 行登记册 ⇒ 删 | 逐档读档 |
| 6 | **删除集 = 100 档 .mjs / 20,706 行**（73 同路径 + 28 M − 保留 2 档〔`tools/index.mjs` · 拆壳薄壳 `tools/shared.mjs`〕 + 1 S 改判〔`indexer.mjs`——2026-09-15 裁定〕）+ **40 档 .md / 1,435 行** ⇒ 合计 **140 档 / 22,141 行**（修正轮-2 同步——见修正轮-2 块） | 上述 2/3/4/5 合成 |
| 7 | **存活改指面**：删除集的存活入边（排除同为删除档者）去重 = **34 档**（src/ **33** = extension **17** · agent 5 · agent-tools 2 · tools **5** · 根档 **4**；+ 端点 `extension.mjs` **1**——逐档底账 = 修正块表 4〔修正轮 #4 / 修正轮-2 同步〕）——逐单元见（三） | import 扇入图谱（机器自核） |
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
| W15 | AGENT-LOOP（主循环 + 装配 + 注入面） | 6/1,654 | 7 | — | 高 | `AGENT-LOOP.md` §6.18 · `I18N.md` · `PORTABILITY.md` §3.6 |
| W16 | CONFIG（配置/迁移/settings 工具） | 6/1,223 | 16 | — | 高 | `CONFIG.md` · `SETTINGS-TOOL.md` · `DESIGN-TOKEN-SETTLEMENT.md` §6.3 · `ENG-TOKEN-BINDING.md` §6.3 |
| **合计** | 16 单元 · 删除集去重 **100 .mjs / 20,706 行** + 40 .md / 1,435 行 = **140 档 / 22,141 行**（`tools/shared.mjs` 413 移出——拆壳薄壳保留〔修正轮 #6〕） | 140 | 存活改指去重 **34**（删除集扇入——逐档底账 = 修正块表 4；端壳/核心面改指类另计；修正轮-2 同步） | —— | —— | —— |

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

**W15 · AGENT-LOOP**：删 `src/agent.mjs`（387）· `agent/{setup 464, setup-reminders 252, run-stages 339}.mjs` · `src/explore-distill.mjs`（156）· `src/i18n.mjs`（56）→ 核 `@thincoder/core/{agent.mjs, agent/*, explore-distill.mjs, i18n.mjs}`。保留 `agent/{agent-state 111,
  context-injections 227, execute-tools 363, run-helpers 297, tool-gates 159}.mjs`（S 编排——内部改指核 agent 面）。存活改指 7：`agent/{agent-state, context-injections, execute-tools, run-helpers}.mjs` + `extension/{chat-panel, notify, panel-messages}.mjs` 等（i18n 入边）。
  **端壳缝接线**：`projectDictionary(locale)`（VSC `locales/{en,zh}.json` 投影——核 i18n 消费，投影逐字冻结）· #112 read_image 门（核内装配面恒含 + run 起始能力面重解——定稿 §2.13.6 缺口 5·VSC 零动作，核对核内已落〔未落 = 上报——核内笔超本批写域〕）·
  #113 编辑器上下文采集（VSC 端供给——现形 agent/setup 面迁 injection 端壳）· #175 推理档位面（`extension/reasoning-mode.mjs` · 34 行）——**D2 已裁**（2026-09-13 · 按建议——`AGENT-LOOP.md` §3.2）+ **推理档位面 = 端侧自有（核内无需位 · 正常落地形态、非缺位——2026-09-15 裁定 · 裁 ②）**：
  两半路径 =（a）`autoThink` 键随 config 归一（VSC 死键复活；默认 `false` ⇒ 无行为变化）（b）档位 patch 全程端侧（经 provider 字段数据面——核 `thincoder-core/provider/core.mjs:52-53` 读 · 同档 `:193-204` 落请求 body）。
  **兜底句**：实施期实核发现核内确需新缝 ⇒ 停下上抛（不自行改核）。关联注：VSC 面板 Auto 入口 = 需求池条目（`docs/TODO.md` 需求池「VSC 端暴露 Auto（`autoThink`）推理档位开关」——**另批**，不属本批）。
  测试面：`test/{context-parity, setup-reminders, eng-designer-role, image-downgrade, digest-visibility, status-line, turn-across-segments, session-boot}.test.mjs` + integration/scenario-01/05/07（核面改指；`.src` 前缀 import 修正）。专项验收：W15 删除集零引用 · 装配输出零字面（与 W2 同门）·
  提示词装配面（assemblePrompt 挂点经核——§2.13.8 结构机检已核内绿）· hooks 四事件名冻结（未涉面）· 载体 10 字段端壳双侧化。

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
| VSC 特有编排（src 内 S 档 **19**） | `agent/{agent-state,context-injections,execute-tools,run-helpers,tool-gates}`（VSC 循环装配/门禁/peer 冲突）· `agent-tools/{async-discard,read-history-discovery}` · `config-mcp.mjs` · `embed-config.mjs` · `memory-tool.mjs`（W8 后改指核 memory 面）· `repomap.mjs`（workspace.fs 数据源）· `specs.mjs`·`tools.mjs`（barrel）· `tools/{index,shell,code,context,focus}.mjs` · **`prompt-injections.mjs`**（W2 新建——锚取值表 · 数据面） | 逐档证据 = 修正块 #2 表（对位行取值 + file:line——勘察 3 上收）；**修正轮-2：`indexer.mjs` 改入删除集——保留 S 面 18；修正轮-6：+ `prompt-injections.mjs`（W2 新建）→ 19** |
| 文本面 | `locales/{en,zh}.json`（projectDictionary 投影面）· `assets/**` | VSC 显示/图标面 |

#### 模块权威档同步计划（实施时逐单元按现状收正 · 一致性面 · 不改机制）

> 总则：每单元提交时同步收正其「VSC 端接线/端差异」节的 **坐标 · 状态行 · 端差登记**（由「VSC 侧 `src/xxx.mjs` 自持镜像」更新为「VSC 经 `@thincoder/core/xxx.mjs` 引用」）；只收正形态，不触碰机制条文（07:08 裁定）。已落 VSC 端节清单（并入面——`VSC-MIGRATION-INVENTORY.md §9` 记录）：`CHECKPOINT §6.9` · `CONSULTATION §6.5` · `CONTEXT-COMPACTION §6.13` · `MCP §6.10` ·
  `MEMORY §6.9` · `SESSION §6.15` · `AGENT-LOOP §6.18/§2.3` · `TOOLS §6.11` · EDIT 六档 §6 · `PROVIDER §6.18/§6.19` · `AGENT-PARAMS §6.3` · `PORTABILITY §3.6` · `DESIGN-TOKEN-SETTLEMENT §6.3` · `ENG-TOKEN-BINDING §6.3` · `TOOL-OUTPUT-LIMITS §6.3` · `MULTI-INSTANCE-COLLAB` ·
  `BATCH-RECORD` · `ENGINEERING-MODE` · `SETTINGS-TOOL` · `DOC-CODE-RECONCILE §3.9` · `ARCHITECTURE §3.1/§4.1` · `PROXY` · `I18N` · `STRUCTURE-DEBT`。逐单元映射见（三）总表「模块权威档」列 + 各单元专项验收行。

#### 受影响文件全清单（R24a · as-of 2026-09-15 实核 · wc -l 口径）

| 面 | 构成 | 当前行数 → 预计 | 处置 |
|---|---|---|---|
| VSC 删除集（.mjs） | W1–W16 删除集 **100 档**（101 − `tools/shared.mjs`〔拆壳薄壳保留——修正轮 #6〕；逐档行数见各单元删列） | 20,706 → **0**（删除） | 接线改指核后删除 |
| VSC 删除集（.md） | `src/prompts/` 15 + `src/tools/*.md` 25 | 1,435 → **0**（删除） | W2 删 |
| VSC 端壳改指面 | **删除集扇入 34 档**（src/ 33 + 端点 `extension.mjs` 1——逐档清单 = 修正块表 4）+ **改核心面类**（W11 五档 · W14 拆壳薄壳 `tools/shared.mjs` · W6 三档——同属端壳改指总账） | 扇入 34 档合计 **6,102 行**（逐档读数 = 修正块表 5；修正轮-2：`indexer` 456 移出〔入删除集〕· `tools/code` 165 补入；W11 五档另计 1,493 行）→ 逐档 ±0～±N（真增行面 = 表 5 例外列） | 改指核子路径（>300 行档超软线判定 = 修正块表 5） |
| VSC 测试面 | 60 档直连 src（逐档见各单元测试面行） | 逐档 0 ～ −N（例外：W2 `prompts-async-guidance` **176 → 326**——锚面重写；< 500 硬限〔§5 W2 收正注〕——修正轮-6 增补） | 核面改指 ∥ 退役（测试纪律①默认退役判据） |
| W8 前置笔测试面 | `test/engine-floor-guard.test.mjs`（新建 · 5 用例）· `test/files.mjs`（入册 `:84`） | **0 → 93**（新建 · wc -l 口径；§5 记 94 = 编辑器口径）· **84 → 85**（+1） | 已落地（`051b21a9`/`e0234ee1`——修正轮-6 补登） |
| W2 取值表（新建） | `src/prompt-injections.mjs`（13 名锚取值表——数据面 · 可测试性分离） | **0 → 65**（新建 · 实测） | 已落地（`0ee40682`——口径 = 端壳缝不新增档 · 取值表分离新建〔修正轮-6〕） |
| VSC 端点 | `extension.mjs`（**91 → 157**——W8 前置笔 + W2 均已落）· `package.json`（**134** · 值变更 +0 净行）· `.vscodeignore`（**17**） | `extension.mjs` = **合计实测 +66**（91 → 157 · wc -l 口径）= **W8 前置笔 +60**（§5 记 92 → 152 = 编辑器口径；设计估 +10±5 收正）+ **W2 入口注入 +6**（`0ee40682`——+2 import + 4 行注；设计估 +0~2 收正）+ 改指 2 处（i18n / mcp 入边——修正块表 4）；`package.json` = 下限值变更 `^1.85.0` → `^1.104.0`（已落 `051b21a9`——**+0 净行实测**；W17 收口笔 +8±3 以表 3 为账）；`.vscodeignore` 零改（装载面已在位） | W2 入口接线 + W8 前置笔（修正轮-6 收正） |
| W8 收正面（索引面归一——webview / 文案） | `webview/status-bar.js`（**101**）· `locales/{en,zh}.json`（**259 / 259**） | 101 → ±10 · 259 → ±5（逐档——相位渲染 + 键面收正：`status.indexEmbed` 退场 · `status.indexProgress` 新键） | W8 同批收正（修正轮-4 补登） |
| 模块权威档 | （三）总表映射 ≈ 24 档 `docs/core/design/*.md` + 子系统需求档端对位面 | 逐档 ±1~6 行（收正注记） | 按单元同步收正（一致性面） |
| 既有基线 | PROVIDER.md L260（336 chars——折行前实判 1 行 >300） | **已清**（父侧 `60f8bab2` 折行落地——宽度闸归 0） | 收口（修正轮-6——原「交父侧 / 未决 5」退场） |

> **不新增 `.mjs` 口径（修正轮-6 收正 = 父侧裁定）**：**端壳缝不新增档**（全部并入既有端壳档——方案选型 4(a)）；**取值表分离新建 = 允许**（`src/prompt-injections.mjs`——数据面 · 可测试性；`0ee40682` 落地）；VSC `src/` 收口后 = **19 S 档** + 40 extension + tools/index + `locales/` 前端面外的装配/端壳面（薄壳面清单）。

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
4. **任务书清单计数差**：探勘清单写 45 档实为 **47 档**（3+5+8+5+5+6+3+12=47）——按 47 执行完毕（分类 M 28 / S 19 / U 0——`indexer` 随修正轮-2 改入删除集，保留 S = 18），如实登记。
5. **`.src` 前缀 import 面**：`test/integration/scenario-*.test.mjs` 内现用 `.src/xxx` 形态 import（如 `.src/agent.mjs`）——集成测试改指核时该前缀形态一并修正（或改仓根路径），登 W14/W15 验收面。
6. **advisor/main.mjs 的 rv async 隔离参数**（VSC 增量）：核 `advisor.mjs` 无同名参数，等效面 = 核 `agent-tools/advisor-async.mjs` `_advisorRuns` 注册表——删除时确认 VSC 侧该隔离语义由核注册表等效承载，零行为差（面内按裁决）。
7. **既有红三处（VSC 域锚面 · 2026-09-15 修正轮实跑）**：① `npm run doc:check`（VSC 域 · `--strict`）= **exit 1**——V5 命中 **21 处 / distinct 13**（A2 18 / A3 3 · **阻断态**）；
  ② `npm run test:full` = **2 fail**——`T-DC6②`（doc-anchors 源域实跑「真仓复跑零命中」断言——与 ① 同源）· `T-DC15`（reconcile-lookup 反查夹具——**由在途未提交改动 `thincoder-vscode/scripts/reconcile-lookup.mjs` 引入**〔git status 实核〕）；
  ③ 档头注「VSC 域 21 处报告态（非阻断 · 已登记）」与 ① 实跑（**阻断态**）相抵。以上对象 = VSC 产品档（D-C14 迁移期参照历史 · 保留 ≠ 维护）+ 并行线 WIP——非本批写域 ⇒ 口径与消解归属上抛（未决 7）。**结局（修正轮-6）**：口径已裁 = 零新增 + 基线登记（§1 :41）· 红线清扫闭环（VSC `doc:check` 0 命中 · `test:full` 627/627 全绿——`60f8bab2`）——未决 7 收口退场。
8. **§2.8 同族 5 行同题（finding 13 类 · 已收正 2026-09-15 修正轮-4）**：§2.8「提示词加载面（S2 改）」另有 5 行（`:1039`–`:1043`：CLI/VSC 的 advisor 加载面 · `tools/shared.mjs`〔CLI/VSC〕· `agent/setup.mjs`〔CLI/VSC〕）与 finding 13 同题（「S2 改」 vs 执行实况「删」互斥）：
  CLI 侧四档实核均已删（`thincoder-cli/src/{advisor.mjs, tools/shared.mjs, agent/setup.mjs, prompt-overlays.mjs}` 不存在）；VSC 侧对应档均在 W12/W14/W15 删除集内（`tools/shared.mjs` 例外 = 判定拆壳薄壳保留）。
  **修正轮-4 已按 finding 13 同法择一收正**——CLI 三档 + VSC `advisor/main.mjs` = 「S2 删」· VSC `tools/shared.mjs` = 「S2 改——拆壳薄壳保留」（权威档 · `PROMPT-SYSTEM.md` 同批——见修正轮-4 块）。
9. **`read-history-discovery.mjs` 改指对象观察**（W9 文本 vs 实况）：W9 写「内部改指核 read-history 面」，而实核其 import 面 = `../extension/session-io.mjs`（W11 端壳档——非删除集扇入、无核 read-history import）⇒ 实施时按核 read-history 接线形态核认（登记观察项，不代改）。
10. **记忆句柄装配点未在案（本轮补点）**：VSC 端 `createMemory` 落点在既有设计与权威档零命中（grep `createMemory` = 0）——本轮在 W8 索引面写明装配形态（随端壳装配面〔W15 面〕创建持有）；若父侧认定应独立成项（装配契约），可移。
11. **A2 记忆面一次性导入器未落（`memory import`——实核 2026-09-15）**：`thincoder-cli/src/cli/memory-command.mjs` 子命令实读 = `list` / `search` / `put` / `remove`（usage 行 = `Usage: thincoder memory <list|search|put|remove>`）——无 `memory import`；CLI 树 `memory*.mjs` 枚举无导入器档。
  ⇒ 权威 §2.8「记忆面导入器（S2 新建 · +60±20）」面**未落**（A2 已裁 · `design/MEMORY.md` §3.1 A2）；导入器面住 CLI ⇒ 非本批写域（本批零写入）——**上抛**；时序 = **≤ W8 落地版本发布前**（否则 VSC 老用户 personal 记忆无迁移路径）。

#### 未决（真判不准 / 需人裁 —— 一律打回主 agent · 无旁路）

1. **A8 引擎下限（W8 前置门 · 已裁 2026-09-15）**：用户裁定 **值 = `^1.104.0`**（贴最低线案——覆盖 1.104–1.131 用户群）；**不另做真机实测**（资料 / 推导链已查尽——Electron #47706 回移线 = 36/37/38-x-y；1.104 = Electron 37.3.1 / Node 22.18.0 ≥ 22.13）；
  运行期核验 = `activate()` 护栏（不满足 ⇒ showErrorMessage 停用记忆面、不崩）。**落点 = W8 前置笔**（独立单笔 · 承 U0 前置笔形态）。**本项清**（权威档同批收正：设计 A8 · §2.12.3 第 1 行 · 设计 `MEMORY.md` · 需求 `N7`——见修正块）。
3. **#99 panel 动作剔除缝形态（§2.13.4）**：本批按**端侧过滤**执行（VSC 装配层删 `panel`，零核改动）。若实施中发现核侧不可滤（需核内缝）⇒ 属核内改动 = 超本批写域，停下上抛，不自行改核。
4. **§2.13.2 核内测试同步坐标**（`thincoder-core/test/prompt-files.test.mjs:105` 旧锚名断言）：CLI U2 应已收正——W2 实施时核对；未收正 = 发现上报（不代改核）。

#### 交付表

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | §2 任务书写入（单元划分/删旧/复跑/回滚/权威档/验收） | ✅ Done | 本段（W1–W16 逐单元 + 总表 + R24a + 验收判据） |
| 2 | 勘察实核（import 现状/分类/登记册/装载面） | ✅ Done | 158 档全分类（73 同路径 + 85 非同路径）· 删除集 **140 档 / 22,141 行** · 扇入 **34**（修正轮底账——修正块表 4；修正轮-2：`indexer` 移入删除集〔S 保留 18〕） |
| 3 | 方案选型对比（≥2 候选含否决理由） | ✅ Done | 7 候选（1 选定 + 2 整树/双源否决 + 2 端壳缝子选型 + 2 索引面驱动子选型——修正轮-2 补） |
| 4 | 薄壳面清单 | ✅ Done | 面板/宿主 40 · webview · S **19** · locales/assets（修正轮-2：S19→18；修正轮-6：+ `prompt-injections.mjs` → 19） |
| 5 | 模块权威档同步计划 | ✅ Done | 逐单元映射 + 总则（收正·一致性面·不改机制） |
| 6 | 验收标准逐条回指需求 · 机器可验 | ✅ Done | A-K1–A-K14（回指 F5/F8/F9/N1-N6/07:08 裁定 + 本裁定〔A-K12–A-K14〕；A-K11 = N4·F7——修正轮 #3） |
| 7 | 未决（真判不准/需人裁） | ✅ Done | **3 条**（引擎下限〔已裁 2026-09-15〕· panel 缝 · 核内测试核对；索引存储面收口退场——修正轮-2 块；#175 收口退场——修正轮-3 块；宽度基线红 / 既有红口径收口退场——修正轮-6 块） |
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

**表 2 · 保留 S 档 18 逐档证据（finding 2 落点 · 对位行取值 + file:line 实核 · as-of 2026-09-15；修正轮-2：`indexer.mjs` 改入删除集——移出本表）**

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

**表 4 · 删除集扇入底账（finding 4 落点 · 机器扫描 2026-09-15 · cwd = `thincoder-vscode`）**

> 口径 = 删除集（**100** .mjs 档）在 `src/**` + 端点 `extension.mjs` 的静态 import / `export … from` / `import(...)` 扇入去重（排除同为删除档者）；数值 = 该档当前行数（`wc -l`）〔并入单元〕。**共 34 档 = src/ 33 + 端点 1**——与 :65 / :105 / :214 同源（本表 = 唯一底账；修正轮-2 组成更新——总数不变）。

- **extension/（17）**：`chat-panel` 422〔W7·W15·W16〕· `config-watch` 77〔W16〕· `image-handler` 86〔W15·W16〕· `ledger-surface` 111〔W4〕· `migrate-settings` 27〔W16〕· `notify` 18〔W15〕· `panel-callbacks` 209〔W1·W16〕· `panel-chat` 496〔W1·W15·W16〕
- （extension/ 续）：`panel-index` 191〔W8·W16〕· `panel-mcp` 68〔W7〕· `panel-messages` 498〔W7·W12·W13·W15·W16〕· `panel-project` 93〔W15〕· `presets` 85〔W16〕· `provider-flows` 220〔W10·W16〕· `settings-panel-write` 153〔W10·W16〕· `settings` 348〔W7·W10·W16〕· `suspension` 362〔W1·W12·W13〕
- **agent/（5）**：`agent-state` 111〔W12·W16〕· `context-injections` 227〔W8·W14·W15〕· `execute-tools` 363〔W1·W12〕· `run-helpers` 297〔W4·W16〕· `tool-gates` 159〔W4·W12〕
- **agent-tools/（2）**：`async-discard` 113〔W1·W13〕· `index` 16〔W9·W12·W13〕
- **tools/（5）**：`code` 165〔W8〕· `context` 139〔W14〕· `focus` 51〔W14〕· `index` 76〔W14〕· `shell` 317〔W5·W14〕
- **根档（4）**：`config-mcp` 71〔W16〕· `embed-config` 51〔W8〕· `memory-tool` 386〔W8〕· `specs` 5〔W16〕
- **端点（1）**：`extension.mjs` 91〔W7·W15〕
- 口径注：① 与 :65 / :105 / :214 三处计数同源（原 33 的分组口径〔extension 20 / tools 5 / 根档仅 specs〕经复跑证伪——以本表为准）；② 「改核心面」类（W11 五档 / W14 `tools/shared.mjs` / W6 三档——非删除集扇入）另列（R24a 行）；
  ③ `panel-project`（原 prose 未列）与 `extension.mjs` 为本轮机器扫描补入；④ **修正轮-2**：`indexer` 移出〔入删除集 W8〕· `tools/code` 165〔W8〕补入 · `panel-index` 补 W8 边——总数不变。

**表 5 · 端壳改动面逐档行数 → 预计增量 · 超软线判定（finding 5 落点 · as-of 2026-09-15 `wc -l` 实核）**

- **删除集扇入 34 档**（逐档当前行数 = 表 4）：预计 = **±0（import 行替换 · 结构未变）**；例外 **8 档**——
  ① `extension.mjs` 91：入口注入 +0~2 行 + 2 处改指；② `extension/panel-mcp.mjs` 68 → **约 130±30**（`mcp/index.mjs` 注册表段〔`:84` 起〕+ 面板状态接口〔`:399-418`〕迁入——W7）；
  ③ `extension/settings-panel-write.mjs` 153 → **+10±10**（`$schema` 供值——W11/W16 缝）；④ `extension/suspension.mjs` 362 → **+0~8**（io.ask / onToken / 载体缝适配）；⑤ `tools/code.mjs` 165 → **约 90±30**（核检索替换 + 宿主 regex 回退退役——修正轮-2 补）；
  ⑥ `extension/panel-index.mjs` 191 → **约 200±35**（核面读数/触发/相位 + 清退告示——修正轮-2 补）；⑦ `memory-tool.mjs` 386 → **约 320±80**（存储/检索换核面——工具面保留、净减；修正轮-2 补）；⑧ `agent/context-injections.mjs` 227 → **±0~+20**（召回块换源——修正轮-2 补）。（原 ⑤ `indexer.mjs` 456 随裁定入删除集——移出本表。）
- **改核心面类（非删除集扇入）**：W11 五档 `session-io 436` / `session-slots 399` / `session-slot-write 178` / `session-gc 142` / `panel-session 338`：改指 + 缝适配 ⇒ **+0~+40/档**（真增行点 = 适配面；实施读数落 §5）；
  W14 `tools/shared.mjs` **413 → 约 150±50**（拆壳净减）；W6 三档（`history-window` **175** / `generate-title` **87** / `turn-model` **27**——≤300 · 结构未变）改指 ⇒ **±0**。
- **超软线判定（>300 行被改档 · 承设计档 §2.6.2（四）:571 先例）**：

| 档（行数） | 判定 |
|---|---|
| `chat-panel` 422 · `panel-chat` 496 · `panel-messages` 498 · `suspension` 362 · `execute-tools` 363 · `memory-tool` 386 · `settings` 348 · `shell` 317 | **既有超软线档 · 结构未变**（改指 / 行内替换为主）⇒ **拆分计划另议**（消解条件 = 该档下次实质改动时；修正轮-2：`indexer` 入删除集——移出本表） |
| `session-io` 436 · `session-slots` 399 · `panel-session` 338 | 既有超软线档 · 改指 + 适配（结构未变）⇒ 拆分计划另议（同前） |
| `tools/shared.mjs` 413 | 拆壳后 **约 150**（收口到线下）⇒ 拆壳即消解 |

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

## §6 验证与收口（父代理）