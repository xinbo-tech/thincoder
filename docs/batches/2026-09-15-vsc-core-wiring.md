# 核心统一 · VSC 壳代码接线（CORE-UNIFICATION -- VSC WIRING）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 用户「开始吧」（2026-09-15 06:46）+ 文档面迁移定稿（`2026-09-15-vsc-doc-migration.md` ✓）。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
>
> **导航（父侧维护）**：§1（裁定与讨论）→ 本档 §1；§2 当前任务书 → 本档 §2（designer 追加面）。
> **父侧折行·收正注（2026-09-15）**：§2 的 19 行长散文行经父侧机械折行（仅插换行 · 去空白逐字节相等 23,960 chars ✓ 零语义改动）——batch_segment append-only 无法自修，承迁移批先例「纯折行后重跑」。
> 同批收正 3 项：`STRUCUTRE-DEBT` → `STRUCTURE-DEBT` · `十字段` → `10 字段`（×4 · 对齐 `CORE-UNIFICATION.md` §2.6.3 U16 行权威写法）· `VSC-MIGRATION.md` 旧 §9 → `VSC-MIGRATION-INVENTORY.md §9`（V1 指针）。
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
| 3 | 非同路径 47 档逐档读档分类：**M（核内语义镜像）28** · **S（VSC 特有薄壳/编排）19** · U 0 —— 逐档证据见勘察记录（`advisor/main`→核 `advisor.mjs` · `mcp/{http,stdio,ws,utils}`→核 `mcp/transport-*`+`helpers`（前两者逐字同源）· `tools/checkpoint`→核 `git/checkpoint.mjs` · `tools/{wait_for,read_image,more-file,file-edit,hashline-edit,edit-fuzzy-match,edit-line-params}`→核 `tools/{ops,file,patch,edit-batch,edit-diff}` 等） | explore 子代理 · 逐档 file:line |
| 4 | 提示词面：`src/prompts/` **15 档 / 1,015 行** + `src/tools/*.md` **25 档 / 420 行** = 40 档 / 1,435 行（核内唯一副本 = `prompts/` 15 + `tool-docs/` 25） | 机械枚举 |
| 5 | **登记册差异实证**：`src/tools/index.mjs`（76 行）与核同路径但**内容为 VSC 装配面**（含 VSC 宿主工具 context/focus/shell/code/read_image/wait_for + 自持 builtinTools）⇒ 该档**保留**（同路径 ≠ 同内容——B1 分叉面实证）；`src/agent-tools.mjs`（1 行 barrel）vs 核 17 行登记册 ⇒ 删 | 逐档读档 |
| 6 | **删除集 = 99 档 .mjs / 20,250 行**（73 同路径 + 28 M − 保留 2 档〔`tools/index.mjs` · 拆壳薄壳 `tools/shared.mjs`〕）+ **40 档 .md / 1,435 行** ⇒ 合计 **139 档 / 21,685 行**（修正轮同步——见修正块 #6） | 上述 2/3/4/5 合成 |
| 7 | **存活改指面**：删除集的存活入边（排除同为删除档者）去重 = **34 档**（src/ **33** = extension **17** · agent 5 · agent-tools 2 · tools **4** · 根档 **5**；+ 端点 `extension.mjs` **1**——逐档底账 = 修正块表 4〔修正轮 #4 同步〕）——逐单元见（三） | import 扇入图谱（机器自核） |
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

**单一候选豁免**：无（上表五候选）。

#### （三）单元划分总表（W1–W16 · 执行序 = 编号序）

> **共同前置（全 16 单元 · 修正轮登记）**：权威 §2.6.0 门 =「CLI 全单元落完并验收通过 → 才开 VSC 单元」——**实读已达标**：CLI 待迁 = **0**（复跑命令 = 设计档 §2.6.3（七）①；终态证据 = `docs/batches/2026-09-13-CORE-UNIFICATION.md:6682`）；用户启动口径 = 本档 §1（06:46）。各单元「前置」列只列**单元级附加门**（W8 = 引擎下限落地 + 未决 2），共同前置不逐行重列。
> 通用格式：删 档数/行数（删除集 = 镜像档）→ 存活改指 N 档；**每单元独立回滚点 = 单笔提交 `git revert <sha>`**（N2）。复跑与共同验收见本段「逐单元任务书」节四步块；模块权威档 = 实施时按现状收正（改码必同步——07:08 裁定）。

| 单元 | 名称 | 删（档/行） | 存活改指 | 前置 | 风险 | 模块权威档（同步面） |
|---|---|---|---|---|---|---|
| W1 | LOGGING（诊断日志） | 1/196 | 6 | — | 低 | `LOGGING.md` |
| W2 | 提示词面（40 .md + 槽位装配 + 注入接线） | 41/1,518 | 0 | — | 中 | `PROMPT-SYSTEM.md` · `TOOLS.md`（tool-docs 面） |
| W3 | TRACES（轨迹存储） | 1/254 | 0 | — | 低 | `TRACES.md` |
| W4 | WORKSPACE（台账/约定/转义/展开/技能/规则/同伴） | 4/627 | 4 | — | 中 | `WORKSPACE.md` · `MULTI-INSTANCE-COLLAB.md` |
| W5 | CHECKPOINT（检查点 · git 面） | 3/775 | 0* | — | 中 | `CHECKPOINT.md` §6.9 |
| W6 | CONTEXT-COMPACTION（压缩/标题/历史窗/档位） | 1/388 | 0* | — | 中 | `CONTEXT-COMPACTION.md` §6.13 |
| W7 | MCP（客户端 + 三传输） | 6/1,007 | 3 | — | 中 | `MCP.md` §6.10 |
| W8 | MEMORY（记忆/索引/嵌入 · **删集分记忆面/索引面两段**） | 4/591 | 4 | **门 1 = 引擎下限（已裁 · 落 W8 前置笔）+ 门 2 = 未决 2（索引面段押后）** | 高 | `MEMORY.md` §6.9 · `STRUCTURE-DEBT.md` |
| W9 | AGENT-TOOLS 登记面（工具实现 + 登记册） | 13/1,310 | 1 | — | 中 | `AGENT-LOOP.md` §6.18（登记册 #83） |
| W10 | PROVIDER（供应商/模型/代理） | 8/2,293 | 3 | — | 中高 | `PROVIDER.md` §6.19 · `PROXY.md` · `AGENT-PARAMS.md` §6.3 |
| W11 | SESSION（会话 · 端壳改指面，零删） | 0/0 | 端壳 5 档内改核心面 | — | 中高 | `SESSION.md` §6.15 |
| W12 | ADVISOR/会诊/飞刀 | 20/4,111 | 5 | — | 中高 | `CONSULTATION.md` §6.5 · `ADVISOR-CONVERGENCE.md`(requirements) |
| W13 | 子代理/异步族 | 6/2,133 | 3 | — | 高 | `AGENT-LOOP.md` §6.18（异步载体 §2.3） |
| W14 | TOOLS 实现面（编辑径 + 工具表） | 20/4,018 | 5 | — | 中高 | `TOOLS.md` §6.11 · EDIT 六档 §6 · `TOOL-OUTPUT-LIMITS.md` §6.3 · `CHECKPOINT.md`（checkpoint 工具） |
| W15 | AGENT-LOOP（主循环 + 装配 + 注入面） | 6/1,654 | 7 | — | 高 | `AGENT-LOOP.md` §6.18 · `I18N.md` · `PORTABILITY.md` §3.6 |
| W16 | CONFIG（配置/迁移/settings 工具） | 6/1,223 | 16 | — | 高 | `CONFIG.md` · `SETTINGS-TOOL.md` · `DESIGN-TOKEN-SETTLEMENT.md` §6.3 · `ENG-TOKEN-BINDING.md` §6.3 |
| **合计** | 16 单元 · 删除集去重 **99 .mjs / 20,250 行** + 40 .md / 1,435 行 = **139 档 / 21,685 行**（`tools/shared.mjs` 413 移出——拆壳薄壳保留〔修正轮 #6〕） | 139 | 存活改指去重 **34**（删除集扇入——逐档底账 = 修正块表 4；端壳/核心面改指类另计） | —— | —— | —— |

> \* **W5 / W6 跨单元改指（口径写死 · 修正轮 #7）**：两处改指**均在删除单元（W5 / W6）同笔落地**——删档单元自洽（中间态零 `ERR_MODULE_NOT_FOUND` · A-K4 逐单元可达）；**计数归其存活面单元列（W14 / W15）· 不双计**。
> W5 = `tools/shell.mjs`（`./checkpoint.mjs` → 核 `git/checkpoint.mjs`，计数在 W14 列）；W6 = `agent/run-helpers.mjs`（compact 入边 → 核 `context.mjs`，计数在 W15 列）。W5 / W6 正文按本注同批收正。

#### 逐单元任务书（W1–W16）

> 每单元四步（承 CLI §2.6.3（四）同形）：**① 接线**（改 import/加载面 → `@thincoder/core/<子路径>`，一律带子路径；测试面同批改指/退役）→ **② 删旧**（删本单元删除集；删前三条全过 = 改指已落盘 ∧ VSC 全链 exit 0 ∧ 零引用机判——反向判两模式承 §2.6.2（五）法 1，扫描域 = `src/` + `test/` + `extension.mjs`；同批把 VSC 特有增量迁入端壳缝——§2.13.3 该族缝 + configure* 命令）→
  **③ 复跑**（VSC 全链 = `npm test` · `npm run lint` · `npm run test:full` · `npm run test:integration` · `npm run doc:check`，cwd = `thincoder-vscode/`；核回归 `node --test` 178/178；仓根三机检）→ **④ 提交**（单笔：删档 + 改指 + 测试面 + 文档锚同批；回滚点 = `git revert <sha>`）。

**W1 · LOGGING**：删 `src/log.mjs`（196）→ 核 `@thincoder/core/log.mjs`。存活改指 6：`agent-tools/async-discard.mjs` · `agent/execute-tools.mjs` · `extension/{panel-callbacks,panel-chat,suspension}.mjs` · `indexer.mjs`（`../log.mjs` → 核子路径）。测试面：零直连（trace-store.test 经 provider —— W3 面）。
  专项验收：W1 删除集在扫描域零引用（反向判 0 命中）+ VSC 全链绿。

**W2 · 提示词面**：删 `src/prompts/` 15 档 + `src/tools/*.md` 25 档（1,435 行）+ `src/prompt-overlays.mjs`（83）→ 核 `prompts/` + `tool-docs/` + `@thincoder/core/prompt-overlays.mjs`（槽位装配面 = 核单点）。
  同批收正：权威 §2.8「提示词加载面」两行（CLI `:1037` / VSC `:1038`）由「S2 改 · ±6」改「**S2 删**」——CLI 已随 U15 落地（实核：档不存在）；槽位装配面 = 核单点（修正轮 #13）。
  **入口注入接线**：`extension.mjs` `activate()` 首步调 `configurePromptInjections(VSC 13 锚取值表)` —— 取值表 = `CORE-UNIFICATION.md §2.13.2` 「VSC 列」（引用不重述；含 `agent-loop-ptr-*` 五值按 §2.13.2 收正注 = `AGENT-LOOP（CLI 仓·设计）§7.3/§8/§14.2` · `doc-map-path` = `design/` ·
  `discipline-normal-finish` = 节标题+引导行（核内三行不注入）· `question-ui-face` = 替换位面板版 `Availability:` 行 · `bash-terminal-face` · `eng-coder-guidelines` · `discipline-engineering-vsc-r14-pools` · 空值锚 2）＋端说明括注并入同锚值（§2.13.2 建议）。测试面：`test/prompts-async-guidance.test.mjs`（prompt-overlays 入边 →
  改指核）· `test/tool-descriptions.test.mjs`（断言 VSC 工具描述——保留改指核 tool-docs + 注入值）。**核对项**：§2.13.2「核内测试同步坐标」（`thincoder-core/test/prompt-files.test.mjs:105` 旧锚名断言）——已收正 ⇒ 零动作；未收正 = 发现上报（不代改核）。专项验收：VSC 装配输出零 `{{inject:` 字面（可机判：入口装配后四装配面输出扫描）· 13 锚 VSC 值逐锚在场（§2.13.2 验收列）·
  `## 收尾验收` 节标题在场恰一份（VSC 侧）· `design/` 文档地图路径（doc-map-path 值）在场 · `src/prompts/` + `src/tools/*.md` 枚举为空（F9 实现面口径）。

**W3 · TRACES**：删 `src/traces/trace-store.mjs`（254）→ 核 `@thincoder/core/traces/trace-store.mjs`。存活改指 0（唯一入边 provider.mjs = W10 删档）。测试面：`test/trace-store.test.mjs` → 改指核（行为面保留——容量/清理策略已裁决取并集，§2.5 #116）。专项验收：W3 删除集零引用 · trace-store.test 改指后绿 · 未涉面计数不变（N1）。

**W4 · WORKSPACE**：删 `src/ledger.mjs`（227）· `src/conventions.mjs`（226）· `src/escape.mjs`（153）· `src/expand-home.mjs`（21）→ 核 `@thincoder/core/{ledger,conventions,escape,expand-home}.mjs`。存活改指 4：`agent/run-helpers.mjs`（conventions/escape 入边）· `agent/tool-gates.mjs`（conventions）·
  `extension/ledger-surface.mjs`（ledger）· `indexer.mjs`（conventions）。端壳缝：台账渲染面 `ctx.colors/pushLine/render`（§2.13.3）由 `extension/ledger-surface.mjs` 供值（现形已在端壳——改指核 `ledger-surface.mjs` 后按缝装配）。测试面：`test/ledger.test.mjs`（ledger + extension/ledger-surface —— 端壳档保留，改指核 ledger 面）。
  专项验收：W4 删除集零引用 · ledger-surface 面板推送计数 = 行数（缝注入断言）。

**W5 · CHECKPOINT**：删 `src/tools/git-checkpoint.mjs`（150）· `src/tools/git-ext.mjs`（174）· `src/tools/checkpoint.mjs`（451 → 核 `git/checkpoint.mjs`）。存活改指 0（`tools/shell.mjs` 的 `./checkpoint.mjs` → 核 `git/checkpoint.mjs`——**改指在本单元同笔落地**、计数归 W14 列；见（三）脚注注 1）。
  测试面：`test/git-commit-pathspec.test.mjs`（git.mjs = W14 面）随 W14。专项验收：W5 删除集扫描域零引用 · checkpoint 工具注册后行为 = 核实现（核测试 `git/checkpoint` 面已绿——含在 178 内）。

**W6 · CONTEXT-COMPACTION**：删 `src/compact.mjs`（388）→ 核 `@thincoder/core/context.mjs`（压缩面语义对位——§2.5 #162–#164 已裁）。端壳改指 3：`extension/{history-window,generate-title,turn-model}.mjs` → 核 `history-window.mjs` · `generate-title.mjs`（标题生成三格式分派 = 核内实现，§2.13.4 #163 已满足）·
  turn-model 按核 context 面接线。存活改指：`agent/run-helpers.mjs`（compact 入边——**改指在本单元同笔落地**、计数归 W15 列；见（三）脚注注 1）。测试面：`test/history-window.test.mjs`（extension/history-window 端壳保留 → 改指核面）· context-parity 族随 W15。专项验收：W6 删除集零引用 · 压缩判定点封装按 §2.13.4 #56‑类端接线（`configureTreeResolve` 等按端注入）·
  预算端差按 `CONTEXT-COMPACTION.md §6.13`（webview 四态等现状登记）收正。

**W7 · MCP**：删 `src/mcp.mjs`（12）· `src/mcp/{http 256, index 420, stdio 140, utils 49, ws 130}.mjs` → 核 `@thincoder/core/mcp.mjs` + `mcp/{transport-http,transport-stdio,transport-ws,helpers}.mjs`（stdio/ws/utils 逐字同源——删旧零语义）。存活改指 3：`extension/chat-panel.mjs`（mcp.mjs）·
  `extension/panel-mcp.mjs`（mcp/index）· `extension/settings.mjs`（mcp.mjs）。**端壳增量迁入**：`mcp/index.mjs` 的 client-id 注册表 + 面板状态接口（`mcpConnectedNames` / `mcpConnectedToolCounts` / `mcpDisconnectByName`）移入端壳（`extension/panel-mcp.mjs` —— 核 mcp.mjs 为 name-key session 面，按现状适配）。
  `config-mcp.mjs`（S 端壳）保留——其内部 config-io 引用随 W16 改指。专项验收：W7 删除集零引用 · MCP 装配/探活/生命周期按 `MCP.md §6.10` 现状登记 · 面板 MCP 页连接计数接口在位（端壳增量）。

**W8 · MEMORY**：**删除集分两段（修正轮 #8）**——
  · **记忆面段（门 1 已清）**：删 `src/memory.mjs`（273·同路径但内容分叉极大——j=0.0093，B16）→ 核 `@thincoder/core/memory.mjs`（sqlite 面——A12 已裁归一）；改指 2：`agent/context-injections.mjs` · `memory-tool.mjs`。
  · **索引面段（门 2 = 未决 2；未裁前押后）**：删 `src/embedding.mjs`（102）· `src/index-bin.mjs`（43）· `src/index-discover.mjs`（173）→ 核 `embedding.mjs` + `index-*.mjs`；改指 2：`embed-config.mjs` · `indexer.mjs`。
  **门 1（引擎下限——已裁 2026-09-15）**：值 = **`^1.104.0`**（不另做真机实测——资料推导链已查尽：Electron #47706 回移线 = 36/37/38-x-y；1.104 = Electron 37.3.1 / Node 22.18.0 ≥ 22.13；运行期核验 = `activate()` 护栏：不满足 ⇒ showErrorMessage 停用记忆面、不崩）；**落点 = W8 前置笔**（独立单笔 · 承 U0 前置笔形态 · 不占单元号）；落地后记忆面段开工。
  **门 2（未决 2——索引存储面：VSC `.thincoder/index/` ↔ CLI sqlite 库内索引）**：未裁前**索引面段押后**（「索引面保持现状登记」——本档未决 2 口径）；记忆面段不受阻。
  专项验收：内存读写/检索行为按 A12 归一（sqlite 面）· 核内 memory 测试绿（含在 178 内）· 文档档 `MEMORY.md §6.9` 现状登记按接线后收正（文件制存储 → 归一退场注）。

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
  #113 编辑器上下文采集（VSC 端供给——现形 agent/setup 面迁 injection 端壳）· #175 推理档位面（`extension/reasoning-mode.mjs` · 34 行）——**D2 已裁**（2026-09-13 · 按建议——`AGENT-LOOP.md` §3.2「核内实现 + VSC 接线；面板推理档位面按端注入」）；
  **核内位 = 无**（§2.13.4 / 缺口 5 缺位之一）⇒ 供值出口无定义：按 #112 同法登记——核对核内已落（**实核：`thincoder-core/**` 无 #175 缝**）⇒ **需核内笔（补位）＝超本批写域 ⇒ 该子项押后 + 上抛**（见未决 6；其余子项不受阻）。
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
| VSC 特有编排（src 内 S 档 19） | `agent/{agent-state,context-injections,execute-tools,run-helpers,tool-gates}`（VSC 循环装配/门禁/peer 冲突）· `agent-tools/{async-discard,read-history-discovery}` · `config-mcp.mjs` · `embed-config.mjs` · `indexer.mjs`（.thincoder/index 向量面）· `memory-tool.mjs`（W8 后改指核 memory 面）· `repomap.mjs`（workspace.fs 数据源）· `specs.mjs`·`tools.mjs`（barrel）· `tools/{index,shell,code,context,focus}.mjs` | 逐档证据 = 修正块 #2 表（对位行取值 + file:line——勘察 3 上收） |
| 文本面 | `locales/{en,zh}.json`（projectDictionary 投影面）· `assets/**` | VSC 显示/图标面 |

#### 模块权威档同步计划（实施时逐单元按现状收正 · 一致性面 · 不改机制）

> 总则：每单元提交时同步收正其「VSC 端接线/端差异」节的 **坐标 · 状态行 · 端差登记**（由「VSC 侧 `src/xxx.mjs` 自持镜像」更新为「VSC 经 `@thincoder/core/xxx.mjs` 引用」）；只收正形态，不触碰机制条文（07:08 裁定）。已落 VSC 端节清单（并入面——`VSC-MIGRATION-INVENTORY.md §9` 记录）：`CHECKPOINT §6.9` · `CONSULTATION §6.5` · `CONTEXT-COMPACTION §6.13` · `MCP §6.10` ·
  `MEMORY §6.9` · `SESSION §6.15` · `AGENT-LOOP §6.18/§2.3` · `TOOLS §6.11` · EDIT 六档 §6 · `PROVIDER §6.18/§6.19` · `AGENT-PARAMS §6.3` · `PORTABILITY §3.6` · `DESIGN-TOKEN-SETTLEMENT §6.3` · `ENG-TOKEN-BINDING §6.3` · `TOOL-OUTPUT-LIMITS §6.3` · `MULTI-INSTANCE-COLLAB` ·
  `BATCH-RECORD` · `ENGINEERING-MODE` · `SETTINGS-TOOL` · `DOC-CODE-RECONCILE §3.9` · `ARCHITECTURE §3.1/§4.1` · `PROXY` · `I18N` · `STRUCTURE-DEBT`。逐单元映射见（三）总表「模块权威档」列 + 各单元专项验收行。

#### 受影响文件全清单（R24a · as-of 2026-09-15 实核 · wc -l 口径）

| 面 | 构成 | 当前行数 → 预计 | 处置 |
|---|---|---|---|
| VSC 删除集（.mjs） | W1–W16 删除集 **99 档**（100 − `tools/shared.mjs`〔拆壳薄壳保留——修正轮 #6〕；逐档行数见各单元删列） | 20,250 → **0**（删除） | 接线改指核后删除 |
| VSC 删除集（.md） | `src/prompts/` 15 + `src/tools/*.md` 25 | 1,435 → **0**（删除） | W2 删 |
| VSC 端壳改指面 | **删除集扇入 34 档**（src/ 33 + 端点 `extension.mjs` 1——逐档清单 = 修正块表 4）+ **改核心面类**（W11 五档 · W14 拆壳薄壳 `tools/shared.mjs` · W6 三档——同属端壳改指总账） | 扇入 34 档合计 **6,393 行**（逐档读数 = 修正块表 5；W11 五档另计 1,493 行）→ 逐档 ±0～±N（真增行三处 = 修正块 #5） | 改指核子路径（>300 行档超软线判定 = 修正块 #5） |
| VSC 测试面 | 60 档直连 src（逐档见各单元测试面行） | 逐档 0 ～ −N | 核面改指 ∥ 退役（测试纪律①默认退役判据） |
| VSC 端点 | `extension.mjs`（**91**）· `package.json`（134 → **135**±1）· `.vscodeignore`（**17**） | `extension.mjs` = 入口注入 +0~2 行 **+ 改指 2 处（i18n / mcp 入边——修正块表 4）**；`package.json` = 下限行变更 `^1.85.0` → `^1.104.0`（已裁 2026-09-15，+1 行）；`.vscodeignore` 零改（装载面已在位） | W2 入口接线 + W8 前置笔 |
| 模块权威档 | （三）总表映射 ≈ 24 档 `docs/core/design/*.md` + 子系统需求档端对位面 | 逐档 ±1~6 行（收正注记） | 按单元同步收正（一致性面） |
| 既有基线 | PROVIDER.md **5 行** >300（实判 **1 行** = L260 / 336 chars） | 不动（写域外——未决 5） | 交父侧 |

> 不新增任何 `.mjs`（端壳缝全部并入既有端壳档——方案选型 4(a)）；VSC `src/` 收口后 = 19 S 档 + 40 extension + tools/index + `locales/` 前端面外的装配/端壳面（薄壳面清单）。

#### 验收判据（回指需求条目 · 逐条可机器验证）

| # | 判据 | 回指 | 机判方式 |
|---|---|---|---|
| A-K1 | 16 单元全部落地后 VSC 全链 exit 0（`npm test` · `lint` · `test:full` · `test:integration` · `doc:check`） | N1 | 五命令实跑 `(exit code 0)`；**既有红口径 = 未决 7（不静默豁免）**；四命令基线（2026-09-15 实跑）= A-K8 行 |
| A-K2 | 核回归 = 178/178 · fail 0（核零改动——比对改前基线） | N4·N5 | `node --test`（cwd = 核目录） |
| A-K3 | 仓根三机检：锚**0 悬空** · 台账**0** · 宽度**新增 0**（既有基线红 PROVIDER.md 除外——非本批） | N6 | 三脚本实跑读数 |
| A-K4 | 每单元删除集在 `src/`+`test/`+`extension.mjs` 域**反向判零引用**（两类形态各 0 命中——承 §2.6.2（五）法 1） | F5·N2 | 机判命令（实施 §5 落读数） |
| A-K5 | VSC 装配输出零 `{{inject:` 字面 + 13 锚 VSC 值逐锚在场 | F8·§2.13.2 | **驱动形态 = 端侧入口径**：`activate()` 直调（假 `vscode` 桩 = `test/vscode-mock/`——既有基建；webview 面经 `test/helpers/webview-env.mjs`；或 integration 沙箱面同源）——W2 落一条端侧入口用例：`activate()` 首步 `configurePromptInjections(VSC 表)` 后断言 ① 四装配面输出零字面 ② 13 锚 VSC 值逐锚在场（对照 CLI 先例 = 设计档 §2.6.3 U2 专项补 ⑦） |
| A-K6 | 提示词零残留：`src/prompts/` + `src/tools/*.md` 枚举空 | F9 | glob 枚举 |
| A-K7 | 逐单元单笔提交可回滚：**每单元提交 = 单笔（删除集 + 改指 + 测试面同笔——跨单元锚点改指随删除单元落）**；`git revert` 后该单元全链复绿 | N2·N5 | revert 演练（抽样 ≥1 单元）+ 提交面核验（`git show --stat <sha>` 逐单元单笔判定） |
| A-K8 | 未涉面用例逐数不变（VSC test:full 内非本单元用例计数与基线一致；面内按裁决改判逐条登记） | N1·F6 | 用例计数对账。**四命令基线（2026-09-15 修正轮实跑 · cwd=`thincoder-vscode/`）**：`npm test`（fast）= 622 / 581 pass / fail 0（41 慢测快层跳过）· `lint` = exit 0（293 档 OK）· `test:integration` = 28/28 · fail 0 · exit 0 · `test:full` = 622 / **620 pass · fail 2**（T-DC6② · T-DC15）· `doc:check` = **exit 1**（V5 21 处）——**既有红口径 = 未决 7** |
| A-K9 | 端壳缝与界面：写路径/执行面/权限/`$schema`/载体 10 字段双夹具/`projectDictionary` 逐项注入断言绿 | F11·§2.13.3 | 核内测试（178 内）+ VSC 端装配用例 |
| A-K10 | 模块权威档收正：VSC 端节坐标/状态行更新 + 锚 0 悬空（实施轮改指时同批落） | 07:08 裁定 | doc-anchors + 收正档 diff 审读 |
| A-K11 | **S2 收口面（W17 收口笔）**：`thincoder-vscode/AGENTS.md` 约定段改述（±4）· `scripts/check-vsix.mjs` 新建 + `package.json` `postpackage` 挂点（vsix 含核 + 版本 = **断言 B**）· `scripts/publish-all.mjs` +8±4（段 0 + 段 1.5）· **N4 的 VSC 判据（vsix 内嵌核 = 解包断言）** | N4·F7 | 时点 = **收口笔（W17）**；机判 = `postpackage` 解包断言 exit 0 + 发布编排 dry 面（见修正块「S2 收口笔」节） |

#### 边界（本批不做）

- 不碰核包 `thincoder-core/**` 一字（含测试——核内任何待补位登记为上报，不代落）；不碰 `thincoder-cli/**`。
- 不改机制/不新增需求语义；端差一律走注入（契约 5/10）——**零** `if (vsc)` 式壳判断入核。
- 引擎下限变更**已裁（2026-09-15：`engines.vscode` `^1.85.0` → `^1.104.0` · 不另实测）**——时点 = **W8 前置笔**（独立单笔 + `activate()` 护栏）；不引入降级路径（A13）。
- 不新建文档档（07:13——实施面只住批次档）；模块权威档只收正、不扩容。
- 不动 `scripts/**`（工程工具面 = 父侧）· 不动台账 `docs/TODO.md` · 不 commit · 不发起评审（设计轮后是否评审由用户定）。

#### 发现（逐条 · 不静默）

1. **度量脚本与现况冲突**：`scripts/mirror-divergence.mjs` 对 `thincoder-cli/src/prompts`（CLI 已删）报 ENOENT——默认面过时（**2026-09-15 修正轮复跑仍 ENOENT**）。scripts/** = 父侧工程面 ⇒ 上报，本批零写入。
2. **PROVIDER.md 宽度基线红**：实为 **5 行** >300（L27/47/48/260/305——含并行线 qwen-plan 批产物；其中 4 行为闸豁免表格行，实判 1 行 L260）。非本批写域 ⇒ 报父侧（未决 5）。
3. **同路径 ≠ 同内容实证**：`tools/index.mjs` = 同路径但 VSC 装配面（保留该档——删除集 −1）。⇒ 删除集判定按**内容实核**而非路径（本批 47 档逐档读档 + 登记册实读完成）。
4. **任务书清单计数差**：探勘清单写 45 档实为 **47 档**（3+5+8+5+5+6+3+12=47）——按 47 执行完毕（分类 M 28 / S 19 / U 0），如实登记。
5. **`.src` 前缀 import 面**：`test/integration/scenario-*.test.mjs` 内现用 `.src/xxx` 形态 import（如 `.src/agent.mjs`）——集成测试改指核时该前缀形态一并修正（或改仓根路径），登 W14/W15 验收面。
6. **advisor/main.mjs 的 rv async 隔离参数**（VSC 增量）：核 `advisor.mjs` 无同名参数，等效面 = 核 `agent-tools/advisor-async.mjs` `_advisorRuns` 注册表——删除时确认 VSC 侧该隔离语义由核注册表等效承载，零行为差（面内按裁决）。
7. **既有红三处（VSC 域锚面 · 2026-09-15 修正轮实跑）**：① `npm run doc:check`（VSC 域 · `--strict`）= **exit 1**——V5 命中 **21 处 / distinct 13**（A2 18 / A3 3 · **阻断态**）；
  ② `npm run test:full` = **2 fail**——`T-DC6②`（doc-anchors 源域实跑「真仓复跑零命中」断言——与 ① 同源）· `T-DC15`（reconcile-lookup 反查夹具——**由在途未提交改动 `thincoder-vscode/scripts/reconcile-lookup.mjs` 引入**〔git status 实核〕）；
  ③ 档头注「VSC 域 21 处报告态（非阻断 · 已登记）」与 ① 实跑（**阻断态**）相抵。以上对象 = VSC 产品档（D-C14 迁移期参照历史 · 保留 ≠ 维护）+ 并行线 WIP——非本批写域 ⇒ 口径与消解归属上抛（未决 7）。
8. **§2.8 同族 5 行同题（finding 13 类 · 报而未改）**：§2.8「提示词加载面（S2 改）」另有 5 行（`:1039`–`:1043`：CLI/VSC 的 advisor 加载面 · `tools/shared.mjs`〔CLI/VSC〕· `agent/setup.mjs`〔CLI/VSC〕）与 finding 13 同题（「S2 改」 vs 执行实况「删」互斥）：
  CLI 侧四档实核均已删（`thincoder-cli/src/{advisor.mjs, tools/shared.mjs, agent/setup.mjs, prompt-overlays.mjs}` 不存在）；VSC 侧对应档均在 W12/W14/W15 删除集内（`tools/shared.mjs` 例外 = 本轮判定拆壳薄壳保留）。**本轮按指令范围只收正 prompt-overlays 两行**；同族 5 行建议同批收正——上抛。
9. **`read-history-discovery.mjs` 改指对象观察**（W9 文本 vs 实况）：W9 写「内部改指核 read-history 面」，而实核其 import 面 = `../extension/session-io.mjs`（W11 端壳档——非删除集扇入、无核 read-history import）⇒ 实施时按核 read-history 接线形态核认（登记观察项，不代改）。

#### 未决（真判不准 / 需人裁 —— 一律打回主 agent · 无旁路）

1. **A8 引擎下限（W8 前置门 · 已裁 2026-09-15）**：用户裁定 **值 = `^1.104.0`**（贴最低线案——覆盖 1.104–1.131 用户群）；**不另做真机实测**（资料 / 推导链已查尽——Electron #47706 回移线 = 36/37/38-x-y；1.104 = Electron 37.3.1 / Node 22.18.0 ≥ 22.13）；
  运行期核验 = `activate()` 护栏（不满足 ⇒ showErrorMessage 停用记忆面、不崩）。**落点 = W8 前置笔**（独立单笔 · 承 U0 前置笔形态）。**本项清**（权威档同批收正：设计 A8 · §2.12.3 第 1 行 · 设计 `MEMORY.md` · 需求 `N7`——见修正块）。
2. **代码索引存储面（§2.12.3 第 11 行上抛项 · 语义面）**：VSC `.thincoder/index/`（manifest+vectors.bin）↔ CLI sqlite 库内索引 = 数据面/文件格式兼容**未裁**。影响 = W8 内 `indexer.mjs`/`repomap.mjs`/`memory-tool.mjs` 是否并核 sqlite（A12 已裁「记忆面归一」与存储面兼容并存的衔接口径）——交用户定判，未判前 W8 范围内按「记忆面接线、索引面保持现状登记」推进。
  （**修正轮 #8：已纳入 W8 前置门 2**——未判前 = W8 **索引面段**押后；记忆面段不受阻——见 W8 单元文本。）
3. **#99 panel 动作剔除缝形态（§2.13.4）**：本批按**端侧过滤**执行（VSC 装配层删 `panel`，零核改动）。若实施中发现核侧不可滤（需核内缝）⇒ 属核内改动 = 超本批写域，停下上抛，不自行改核。
4. **§2.13.2 核内测试同步坐标**（`thincoder-core/test/prompt-files.test.mjs:105` 旧锚名断言）：CLI U2 应已收正——W2 实施时核对；未收正 = 发现上报（不代改核）。
5. **宽度基线红（PROVIDER.md 5 行 >300 · 闸判 1 行）**：交父侧（并行线遗留，非本批写域；如父侧裁定折行，执行者 = 父侧并打标——承批次先例）。
6. **#175 推理档位面核内位（W15 子项 · 语义面）**：D2 已裁（2026-09-13 · `AGENT-LOOP.md` §3.2）但 §2.13.4 #175「核内位 = 无」+ 缺口 5 缺位之一 ⇒ 端侧供值出口无定义；补位 = **核内笔**（超本批写域）⇒ **上抛**：① 核内补位（核内笔另批）或 ② 权威行收正为「端侧自有（核内无需位）」——两案待父侧/用户定；未定前 W15 #175 子项押后（其余子项不受阻）。
7. **既有红三处与 A-K1 判读口径（语义面）**：见发现 7——`doc:check` 21 处（阻断态）· `test:full` 2 fail（同源 1 + 在途 WIP 1）· 档头注与实跑相抵。**上抛**：A-K1「五命令 exit 0」的既有红判读口径（全绿 vs 零新增）与消解归属（VSC 产品档锚面 / 并行线 WIP）交父侧/用户；未决前 A-K1 不得静默豁免。

#### 交付表

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | §2 任务书写入（单元划分/删旧/复跑/回滚/权威档/验收） | ✅ Done | 本段（W1–W16 逐单元 + 总表 + R24a + 验收判据） |
| 2 | 勘察实核（import 现状/分类/登记册/装载面） | ✅ Done | 158 档全分类（73 同路径 + M28 + S19 + extension40）· 删除集 **139 档 / 21,685 行** · 扇入 **34**（修正轮底账——修正块表 4） |
| 3 | 方案选型对比（≥2 候选含否决理由） | ✅ Done | 5 候选（1 选定 + 2 整树/双源否决 + 2 端壳缝子选型） |
| 4 | 薄壳面清单 | ✅ Done | 面板/宿主 40 · webview · S 19 · locales/assets |
| 5 | 模块权威档同步计划 | ✅ Done | 逐单元映射 + 总则（收正·一致性面·不改机制） |
| 6 | 验收标准逐条回指需求 · 机器可验 | ✅ Done | A-K1–A-K11（回指 F5/F8/F9/N1-N6/07:08 裁定；A-K11 = N4·F7——修正轮 #3） |
| 7 | 未决（真判不准/需人裁） | ✅ Done | **7 条**（引擎下限〔已裁 2026-09-15〕· 索引存储面 · panel 缝 · 核内测试核对 · 宽度基线红 · #175 核内位 · 既有红口径） |
| 8 | 三闸读数 · 零落盘文档档 | ✅ Done | 锚 0 · 台账 0 · 宽度新增 0（基线红 1 档非本批）· 核/VSC/CLI 各树零触碰 |
| 9 | 不 commit · 不发起评审 | ✅ Done | 未 commit · 未发起（用户定后另行） |

> **补正（回读核对 D6 · 2026-09-15 · eng-designer；修正轮同步）**：上段笔误收正集合与档头注对齐 = **3 项**——① 「STRUCUTRE-DEBT」→「STRUCTURE-DEBT」（权威档清单行）；② 「十字段」→「10 字段」（W11/W13 专项与 A-K9；正文 4 处落盘）；③ `VSC-MIGRATION.md` 旧 §9 → `VSC-MIGRATION-INVENTORY.md §9`（V1 指针——档头注记，正文 :199 收正）。纯字形 / 指针修正，语义零变化。

**变更记录**：- 2026-09-15（VSC 代码面接线设计轮 · eng-designer）：§2 写入任务书——W1–W16 逐单元（删 140 档 / 22,098 行 · 存活改指 33 · 单笔回滚）+ 方案选型（5 候选）+ 薄壳面清单 + 模块权威档同步计划 + 验收判据 A-K1–A-K10 + 未决 5 条（引擎下限 / 索引存储面 / panel 缝 / 核内测试核对 / 宽度基线红）。
- 2026-09-15（VSC 代码面接线设计轮 · eng-designer · **修正**）：上行「删 140 档 / 22,098 行 · 存活改指 33」按修正轮底账收正为「删 **139 档 / 21,685 行**（含 .md）· 扇入 **34**」——见下修正块。
- 2026-09-15（**修正轮 · 评审 15 条 + 引擎下限裁定落地** · eng-designer）：§2 逐条修正（见下修正块：前置门 / S19 证据表 / S2 收口笔 / 扇入底账 / R24a 逐档行数 / W14 拆壳薄壳 / W5·W6 改指落点 / W8 两段门 / W15 #175 押后 / A-K5·7·8 判据 / `:213` 收正 / prompt-overlays 删口径 / 悬引用订正 / B9 坐标）+ 未决更新（1 清 · 2 补注 · +6 · +7）；
  同批权威档收正（CORE-UNIFICATION 设计/需求 · MEMORY · PROMPT-SYSTEM——各带变更记录行）。
- 2026-09-15（**修正轮续跑** · eng-designer——前次中断后补完）：① 补三节（「S2 收口笔（W17）」〔含表 3〕·「引擎下限裁定落地」·「自检读数」——修正块内引而无节处补齐）；
  ② 残留就地收正：勘察读数 #6（→ **99 档 / 20,250 行** · 合计 **139 档 / 21,685 行**）· #7（→ **34 档** = src/ 33 + 端点 1）· 交付表 A-K 范围（→ A-K1–A-K11）· 本块 4 行折行（仅插换行——去空白逐字节相等）· 表 4 口径注「三处」句改写（V2 机检）· #15 连带核对计数（100 → 99）；三闸复跑读数 = 本块「自检读数」节。

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
  :209 原「33 + tools/index + specs/tools barrels 另计」与 :65「（含根档 specs.mjs）」相抵 ⇒ 统一为「表 4 一处列全、不另计」。分组收正 = extension/ **17**（原 20）× agent/ 5 × agent-tools/ 2 × tools/ **4**（原 5）× 根档 **5**（config-mcp · embed-config · indexer · memory-tool · specs——原仅记 specs）+ 端点 1。
  复跑 = 2026-09-15 机器扫描（正则解析 `import`/`export ... from` + 动态 `import()`；候选解析 `spec` / `spec+.mjs` / `spec+/index.mjs`）。

5. **R24a 端壳面逐档行数（落点 = 本块表 5）** — 逐档「当前行数 → ±N / 结构」+ >300 行被改档超软线判定（引 CLI 先例 = 设计档 §2.6.2（四）:571「既有超软线档 · 结构未变 · 拆分计划另议——消解条件 = 该档下次实质改动时」）；:214 聚合句（「≈ 6,5xx → 行数不变」）就地收正（扇入 34 档合计 **6,393 行**——逐档读数表 5；W11 五档另计 1,493 行）。

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
  **同族 5 行（`:1039`–`:1043`）同题**（CLI advisor.mjs / tools/shared.mjs / agent/setup.mjs 实核均已删）——报而未改（见发现 8，上抛）。
14. **悬引用订正（三处）** — ① （三）通用格式注「复跑与共同验收见（四）」→「见本段「逐单元任务书」节四步块」；② W14「.src 兼容前缀发现见（七）①」→「见「发现」5」；③ W2 残句「已收正则零动作」→「已收正 ⇒ 零动作」。
15. **B9 坐标收正** — `docs/core/design/CORE-UNIFICATION.md` `:35`：`thincoder-vscode/src/agent/async-discard.mjs:57-74` → **`.../agent-tools/async-discard.mjs:57-74`**（实核在册；`:57-74` = `discardRole` 共享核：丢弃判定 / 墓碑 / 出池 / 提醒注入）。
  连带核对：删除集（73 同路径 + M28 − 保留 2 档 = **99 档**——修正轮 #6）内不含 `agent/async-discard.mjs`（该路径不存在）⇒ **删除集无缺**。
  **附加注（报而未改）**：§2.5.1 索引（设计档 `:402`）与设计档变更记录（`:1852` 只回声 D1）未回声 D2「已裁（2026-09-13）」——本轮已核对定论；是否给设计档索引/变更记录补录回声 = **上抛**（D2 实体状态已裁、不阻塞实施）。

**表 2 · 保留 S 档 19 逐档证据（finding 2 落点 · 对位行取值 + file:line 实核 · as-of 2026-09-15）**

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
- **`indexer.mjs`（456）**：对位 **#136** / **#137**（MEMORY §2.2：`indexer` ↔ CLI `code-index`/`code-sync`——「以 CLI 为准（同一 A12 前提失效）」；`index-bin`/`index-discover` ↔ 「随核内索引面一并归位」）；核内无同档（实核）；头注「Index storage: `.thincoder/index/`」；`MEMORY.md:366` 以 `indexer.mjs:156,170` 为 VSC 端现状坐标——**索引存储面 = 未决 2**（W8 门 2）。
- **`memory-tool.mjs`（386）**：对位 **#134**（融合「核内单一 memory 工具面（动作集/schema/文案取一侧）」）；核内无同档（实核）；头注「the merged `memory` agent tool……core storage/search stays in memory.mjs」——W8 后改指核 memory 面（工具面形态保留端壳）。
- **`repomap.mjs`（303）**：对位 = TOOLS §2.3 映射表（「CLI `tools/repomap.mjs` ↔ VSC `repomap.mjs`（同一 repo 大纲；VSC 头注自述 Ported from …）⇒ 融合」）；import `vscode`（宿主面）；薄壳清单注 = workspace.fs 数据源——端侧数据源面（融合指解析语义；宿主访问留端）。
- **`specs.mjs`（5）**：对位 **#143** + **#176**（PROVIDER §2.2 / AGENT-LOOP §2.2：`model-specs` ↔ VSC `config.mjs`（规格段）+ `specs.mjs`）；5 行 re-export（头注「Self-contained copy」）→ W16 改指核 `model-specs` / `config` 面（薄适配面——非实现双份）。
- **`tools.mjs`（5）**：无对位行（barrel 转口——`export * from "./tools/index.mjs"`）；消费方在端壳；非实现面（F9 口径内）。
- **`tools/index.mjs`（76）**：对位 **#83**（登记册）+ 勘察 5；同路径 ≠ 同内容（B1 分叉面实证——含宿主工具 context/focus/shell/code + 自持 builtinTools）；W14 装配面保留。
- **`tools/shell.mjs`（317）**：对位 **#53**（TOOLS §2.2：「VSC 独有 visible/inject 两模式 `src/tools/shell.mjs:183,191,202`」——前提「宿主终端只在 VSC」成立）；import `vscode`（宿主终端）+ `./shared.mjs` + `./checkpoint.mjs`（W5/W14 改指面）。
- **`tools/code.mjs`（165）**：对位 = MEMORY §2.3 映射（「`tools/code.mjs` ↔ CLI `memory/docs.mjs` 的 `codeSearchTool`/`docSearchTool` ⇒ 随 #82」）；import `vscode` + `../embed-config` + `../indexer` + `../agent/run-helpers`——向量检索面（`.thincoder/index/`——随未决 2 现状登记）。
- **`tools/context.mjs`（139）** · **`tools/focus.mjs`（51）**：④ 端特有桶（覆盖对账 `:369`/`:373`——「对位 10 + ④ 2 档（context / focus）」）；import `vscode`（宿主 IDE 面）——结构性不对称（依赖壳能力——A9 第 1 条）。

**表 4 · 删除集扇入底账（finding 4 落点 · 机器扫描 2026-09-15 · cwd = `thincoder-vscode`）**

> 口径 = 删除集（99 .mjs 档）在 `src/**` + 端点 `extension.mjs` 的静态 import / `export … from` / `import(...)` 扇入去重（排除同为删除档者）；数值 = 该档当前行数（`wc -l`）〔并入单元〕。**共 34 档 = src/ 33 + 端点 1**——与 :65 / :105 / :214 同源（本表 = 唯一底账）。

- **extension/（17）**：`chat-panel` 422〔W7·W15·W16〕· `config-watch` 77〔W16〕· `image-handler` 86〔W15·W16〕· `ledger-surface` 111〔W4〕· `migrate-settings` 27〔W16〕· `notify` 18〔W15〕· `panel-callbacks` 209〔W1·W16〕· `panel-chat` 496〔W1·W15·W16〕
- （extension/ 续）：`panel-index` 191〔W16〕· `panel-mcp` 68〔W7〕· `panel-messages` 498〔W7·W12·W13·W15·W16〕· `panel-project` 93〔W15〕· `presets` 85〔W16〕· `provider-flows` 220〔W10·W16〕· `settings-panel-write` 153〔W10·W16〕· `settings` 348〔W7·W10·W16〕· `suspension` 362〔W1·W12·W13〕
- **agent/（5）**：`agent-state` 111〔W12·W16〕· `context-injections` 227〔W8·W14·W15〕· `execute-tools` 363〔W1·W12〕· `run-helpers` 297〔W4·W16〕· `tool-gates` 159〔W4·W12〕
- **agent-tools/（2）**：`async-discard` 113〔W1·W13〕· `index` 16〔W9·W12·W13〕
- **tools/（4）**：`context` 139〔W14〕· `focus` 51〔W14〕· `index` 76〔W14〕· `shell` 317〔W5·W14〕
- **根档（5）**：`config-mcp` 71〔W16〕· `embed-config` 51〔W8〕· `indexer` 456〔W1·W4·W8〕· `memory-tool` 386〔W8〕· `specs` 5〔W16〕
- **端点（1）**：`extension.mjs` 91〔W7·W15〕
- 口径注：① 与 :65 / :105 / :214 三处计数同源（原 33 的分组口径〔extension 20 / tools 5 / 根档仅 specs〕经复跑证伪——以本表为准）；② 「改核心面」类（W11 五档 / W14 `tools/shared.mjs` / W6 三档——非删除集扇入）另列（R24a 行）；③ `panel-project`（原 prose 未列）与 `extension.mjs` 为本轮机器扫描补入。

**表 5 · 端壳改动面逐档行数 → 预计增量 · 超软线判定（finding 5 落点 · as-of 2026-09-15 `wc -l` 实核）**

- **删除集扇入 34 档**（逐档当前行数 = 表 4）：预计 = **±0（import 行替换 · 结构未变）**；例外 5 档——
  ① `extension.mjs` 91：入口注入 +0~2 行 + 2 处改指；② `extension/panel-mcp.mjs` 68 → **约 130±30**（`mcp/index.mjs` 注册表段〔`:84` 起〕+ 面板状态接口〔`:399-418`〕迁入——W7）；
  ③ `extension/settings-panel-write.mjs` 153 → **+10±10**（`$schema` 供值——W11/W16 缝）；④ `extension/suspension.mjs` 362 → **+0~8**（io.ask / onToken / 载体缝适配）；⑤ `indexer.mjs` 456 → **±0（待未决 2）**——索引面段押后、现状登记。
- **改核心面类（非删除集扇入）**：W11 五档 `session-io 436` / `session-slots 399` / `session-slot-write 178` / `session-gc 142` / `panel-session 338`：改指 + 缝适配 ⇒ **+0~+40/档**（真增行点 = 适配面；实施读数落 §5）；
  W14 `tools/shared.mjs` **413 → 约 150±50**（拆壳净减）；W6 三档（`history-window` / `generate-title` / `turn-model`）改指 ⇒ **±0**。
- **超软线判定（>300 行被改档 · 承设计档 §2.6.2（四）:571 先例）**：

| 档（行数） | 判定 |
|---|---|
| `chat-panel` 422 · `panel-chat` 496 · `panel-messages` 498 · `suspension` 362 · `execute-tools` 363 · `indexer` 456 · `memory-tool` 386 · `settings` 348 · `shell` 317 | **既有超软线档 · 结构未变**（改指 / 行内替换为主）⇒ **拆分计划另议**（消解条件 = 该档下次实质改动时） |
| `session-io` 436 · `session-slots` 399 · `panel-session` 338 | 既有超软线档 · 改指 + 适配（结构未变）⇒ 拆分计划另议（同前） |
| `tools/shared.mjs` 413 | 拆壳后 **约 150**（收口到线下）⇒ 拆壳即消解 |

**「S2 收口笔（W17）」专节（finding 3 落点 · 修正轮）**

> 判定 = 权威 §2.8 的 VSC 产物面归本批 ⇒ **落收口笔**（review 发现 3 取「落一条收口笔」项）；A-K11 行（验收判据）同批新增。回指 = `docs/core/design/CORE-UNIFICATION.md` §2.8（`:1047` / `:1055` / `:1057` / `:1058`——as-of）。

**表 3 · S2 收口笔（W17）范围与增量（finding 3 落点 · 实核 as-of 2026-09-15）**

| # | 档面 | 动作 | 当前 → 预计 | 权威回指（as-of） |
|---|---|---|---|---|
| 1 | `thincoder-vscode/AGENTS.md` | 约定段改述（「产品内双源」→「核内落地 + 仓根中文设计档」） | **125** → ±4 | §2.8「产品文档（S2 改）」`:1047` |
| 2 | `thincoder-vscode/scripts/check-vsix.mjs` | 新建（解 vsix **断言 B** = 含核 + 版本逐字相等；零构建 · 只读） | **0**（新建）→ +50±15 | §2.8「含核断言（S2 新建）」`:1057` |
| 3 | `thincoder-vscode/package.json` | `postpackage` 挂点（调 `check-vsix.mjs`）+ 真依赖面 + devDeps（`yauzl`） | **134** → +8±3 | §2.8「真依赖面（S2 改）」`:1055` |
| 4 | `thincoder-vscode/scripts/publish-all.mjs` | 新增段 0（核版本存在性预检）+ 段 1.5（调 `check-vsix.mjs`）；段 1 / 段 2 与 PAT 预检原样 | **105** → +8±4 | §2.8「发布编排面（S2 改）」`:1058` |

- **N4 的 VSC 判据** = vsix 内嵌核 = **解包断言**（断言 B）——机判 = `postpackage` 解包断言 exit 0。
- **形态 = 收口笔**：独立单笔（单笔提交 · 独立回退 `git revert`）；承 **U0 前置笔**形态（设计档 §2.13.8（七）：独立成笔 · 不占单元号）——W17 **不占单元号** ⇒ 与「16 单元」计数口径自洽（不入 16 单元分母）。
- **时点** = S2 收口（全单元与前置笔落毕后——发布编排面收口）。
- **验收 = A-K11**：`postpackage` 解包断言 exit 0 + 发布编排 dry 面。
- **边界**：本笔面 = `thincoder-vscode/**`（表 3 所列 4 档）；仓根 `scripts/**` 仍零触碰（范围澄清同本块 #3）；核包 / CLI 零触碰。
- **R24a 对位**：`package.json` 同档——R24a「VSC 端点」行记 `134 → 135`±1（W2/W8 增量面）；W17 增量（+8±3）以表 3 为账——两笔分列、不双计。

> 行数 = 实核 `wc -l`（as-of 2026-09-15）；`package.json` 现行 **134**（权威 §2.8 行 as-of **131**——实施轮同步）。

**「引擎下限裁定落地」节（修正轮 · 同批裁定并入）**

**裁定**（用户 2026-09-15）：`engines.vscode` 下限 `^1.85.0` → **`^1.104.0`**（贴最低线案）；**不另做真机实测**（资料推导链已查尽；运行期核验 = `activate()` 护栏：不满足 ⇒ showErrorMessage 停用记忆面、不崩）；落点 = **W8 前置笔**（独立单笔 · 承 U0 前置笔形态 · 不占单元号）。

**（a）批次档正文落点枚举 5 条**（as-of）：

| # | 落点 | 位置 | 收正面 |
|---|---|---|---|
| 1 | （三）W8 行「前置」列 + W8 门 1 | `:98` / `:147` | 「门 1 = 引擎下限（已裁 · 落 W8 前置笔）」+ 值 / 不实测 / `activate()` 护栏 / 落点全句 |
| 2 | 未决 1（本项清） | `:271`–`:272` | 裁定全文 + 权威收正指针 |
| 3 | 边界行 | `:250` | 已裁 + 时点 = W8 前置笔 + 不引入降级路径（A13） |
| 4 | R24a「VSC 端点」行（`package.json`） | `:224` | `^1.85.0` → `^1.104.0`（+1 行）· 处置列 = 「W8 前置笔」 |
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

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

## §6 验证与收口（父代理）