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

**范围与依据**：核心统一机制（`docs/core/{requirements,design}/CORE-UNIFICATION.md`）的 **VSC 壳接线** —— 本批 = S2 的 VSC 半边（CLI 半边已由 `§2.6.3` 排期落地）。高层裁定与三层分工见本档 §1（07:02 权威档角色 / 07:08 改码必同步模块权威档 / 07:10 实施面不落权威档 / 07:13 命名）。上游权威 = CORE-UNIFICATION 需求档 **F5**（逐模块接线+删旧 · 提示词面同规）、**F8**（提示词并入核 = 唯一副本）
  、**F9**（残留删净 · 限实现面+提示词落地档）、**N1**（未涉面零回归）、**N2**（每段可回退 · 一步一提交）、**N4/N5**（两态引用 · 单一权威源）、**N6**（机检零红）+ 设计档 §2.13（注入位清单）与 §2.6.1/§2.6.2（装载口径与族 1 形态）—— 本任务书逐条回指，不再重述条文（D2）。

#### （一）勘察实核读数（2026-09-15 · 本设计轮自核）

| # | 读数 | 来源 |
|---|---|---|
| 1 | VSC src `.mjs` 共 **158 档 / 30,323 行**（wc -l 口径） | 机械枚举 |
| 2 | 其中**核内同路径档 73**（路径对）· **非同路径 85**（extension/ 40 + 其余 45→实 47） | 路径集合比对 |
| 3 | 非同路径 47 档逐档读档分类：**M（核内语义镜像）28** · **S（VSC 特有薄壳/编排）19** · U 0 —— 逐档证据见勘察记录（`advisor/main`→核 `advisor.mjs` · `mcp/{http,stdio,ws,utils}`→核 `mcp/transport-*`+`helpers`（前两者逐字同源）· `tools/checkpoint`→核 `git/checkpoint.mjs` · `tools/{wait_for,read_image,more-file,file-edit,hashline-edit,edit-fuzzy-match,edit-line-params}`→核 `tools/{ops,file,patch,edit-batch,edit-diff}` 等） | explore 子代理 · 逐档 file:line |
| 4 | 提示词面：`src/prompts/` **15 档 / 1,015 行** + `src/tools/*.md` **25 档 / 420 行** = 40 档 / 1,435 行（核内唯一副本 = `prompts/` 15 + `tool-docs/` 25） | 机械枚举 |
| 5 | **登记册差异实证**：`src/tools/index.mjs`（76 行）与核同路径但**内容为 VSC 装配面**（含 VSC 宿主工具 context/focus/shell/code/read_image/wait_for + 自持 builtinTools）⇒ 该档**保留**（同路径 ≠ 同内容——B1 分叉面实证）；`src/agent-tools.mjs`（1 行 barrel）vs 核 17 行登记册 ⇒ 删 | 逐档读档 |
| 6 | **删除集 = 100 档 .mjs / 20,663 行**（73 同路径 + 28 M − 保留的 `tools/index.mjs` 1 档）+ **40 档 .md / 1,435 行** ⇒ 合计 **140 档 / 22,098 行** | 上述 2/3/4/5 合成 |
| 7 | **存活改指面**：删除集的存活入边（排除同为删除档者）去重 = **33 档**（extension/ 20 · agent/ 5 · agent-tools/ 2 · tools/ 5 · 根档 specs.mjs）——逐单元见（三） | import 扇入图谱（机器自核） |
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

> 通用格式：删 档数/行数（删除集 = 镜像档）→ 存活改指 N 档；**每单元独立回滚点 = 单笔提交 `git revert <sha>`**（N2）。复跑与共同验收见（四）；模块权威档 = 实施时按现状收正（改码必同步——07:08 裁定）。

| 单元 | 名称 | 删（档/行） | 存活改指 | 前置 | 风险 | 模块权威档（同步面） |
|---|---|---|---|---|---|---|
| W1 | LOGGING（诊断日志） | 1/196 | 6 | — | 低 | `LOGGING.md` |
| W2 | 提示词面（40 .md + 槽位装配 + 注入接线） | 41/1,518 | 0 | — | 中 | `PROMPT-SYSTEM.md` · `TOOLS.md`（tool-docs 面） |
| W3 | TRACES（轨迹存储） | 1/254 | 0 | — | 低 | `TRACES.md` |
| W4 | WORKSPACE（台账/约定/转义/展开/技能/规则/同伴） | 4/627 | 4 | — | 中 | `WORKSPACE.md` · `MULTI-INSTANCE-COLLAB.md` |
| W5 | CHECKPOINT（检查点 · git 面） | 3/775 | 0* | — | 中 | `CHECKPOINT.md` §6.9 |
| W6 | CONTEXT-COMPACTION（压缩/标题/历史窗/档位） | 1/388 | 0* | — | 中 | `CONTEXT-COMPACTION.md` §6.13 |
| W7 | MCP（客户端 + 三传输） | 6/1,007 | 3 | — | 中 | `MCP.md` §6.10 |
| W8 | MEMORY（记忆/索引/嵌入） | 4/591 | 4 | **A8 引擎下限裁定**（见未决 1） | 高 | `MEMORY.md` §6.9 · `STRUCTURE-DEBT.md` |
| W9 | AGENT-TOOLS 登记面（工具实现 + 登记册） | 13/1,310 | 1 | — | 中 | `AGENT-LOOP.md` §6.18（登记册 #83） |
| W10 | PROVIDER（供应商/模型/代理） | 8/2,293 | 3 | — | 中高 | `PROVIDER.md` §6.19 · `PROXY.md` · `AGENT-PARAMS.md` §6.3 |
| W11 | SESSION（会话 · 端壳改指面，零删） | 0/0 | 端壳 5 档内改核心面 | — | 中高 | `SESSION.md` §6.15 |
| W12 | ADVISOR/会诊/飞刀 | 20/4,111 | 5 | — | 中高 | `CONSULTATION.md` §6.5 · `ADVISOR-CONVERGENCE.md`(requirements) |
| W13 | 子代理/异步族 | 6/2,133 | 3 | — | 高 | `AGENT-LOOP.md` §6.18（异步载体 §2.3） |
| W14 | TOOLS 实现面（编辑径 + 工具表） | 20/4,018 | 5 | — | 中高 | `TOOLS.md` §6.11 · EDIT 六档 §6 · `TOOL-OUTPUT-LIMITS.md` §6.3 · `CHECKPOINT.md`（checkpoint 工具） |
| W15 | AGENT-LOOP（主循环 + 装配 + 注入面） | 6/1,654 | 7 | — | 高 | `AGENT-LOOP.md` §6.18 · `I18N.md` · `PORTABILITY.md` §3.6 |
| W16 | CONFIG（配置/迁移/settings 工具） | 6/1,223 | 16 | — | 高 | `CONFIG.md` · `SETTINGS-TOOL.md` · `DESIGN-TOKEN-SETTLEMENT.md` §6.3 · `ENG-TOKEN-BINDING.md` §6.3 |
| **合计** | 16 单元 · 删除集去重 **100 .mjs / 20,663 行** + 40 .md / 1,435 行 | 140 | 存活改指去重 **33**（端壳五档内改指另计） | —— | —— | —— |

> \* W5：改指面 = `tools/shell.mjs`（`./checkpoint.mjs` → 核 `git/checkpoint.mjs`）——shell 属 W14 存活面，其改指列 W14 内计（同批落）。W6：改指面 = `agent/run-helpers.mjs`（compact.mjs 消费者）——run-helpers 属 W15 存活面，改指随 W6 落（跨单元锚点，实施时按零引用机判兜底）。

#### 逐单元任务书（W1–W8）

> 每单元四步（承 CLI §2.6.3（四）同形）：**① 接线**（改 import/加载面 → `@thincoder/core/<子路径>`，一律带子路径；测试面同批改指/退役）→ **② 删旧**（删本单元删除集；删前三条全过 = 改指已落盘 ∧ VSC 全链 exit 0 ∧ 零引用机判——反向判两模式承 §2.6.2（五）法 1，扫描域 = `src/` + `test/` + `extension.mjs`；同批把 VSC 特有增量迁入端壳缝——§2.13.3 该族缝 + configure* 命令）→
  **③ 复跑**（VSC 全链 = `npm test` · `npm run lint` · `npm run test:full` · `npm run test:integration` · `npm run doc:check`，cwd = `thincoder-vscode/`；核回归 `node --test` 178/178；仓根三机检）→ **④ 提交**（单笔：删档 + 改指 + 测试面 + 文档锚同批；回滚点 = `git revert <sha>`）。

**W1 · LOGGING**：删 `src/log.mjs`（196）→ 核 `@thincoder/core/log.mjs`。存活改指 6：`agent-tools/async-discard.mjs` · `agent/execute-tools.mjs` · `extension/{panel-callbacks,panel-chat,suspension}.mjs` · `indexer.mjs`（`../log.mjs` → 核子路径）。测试面：零直连（trace-store.test 经 provider —— W3 面）。
  专项验收：W1 删除集在扫描域零引用（反向判 0 命中）+ VSC 全链绿。

**W2 · 提示词面**：删 `src/prompts/` 15 档 + `src/tools/*.md` 25 档（1,435 行）+ `src/prompt-overlays.mjs`（83）→ 核 `prompts/` + `tool-docs/` + `@thincoder/core/prompt-overlays.mjs`（槽位装配面 = 核单点）。
  **入口注入接线**：`extension.mjs` `activate()` 首步调 `configurePromptInjections(VSC 13 锚取值表)` —— 取值表 = `CORE-UNIFICATION.md §2.13.2` 「VSC 列」（引用不重述；含 `agent-loop-ptr-*` 五值按 §2.13.2 收正注 = `AGENT-LOOP（CLI 仓·设计）§7.3/§8/§14.2` · `doc-map-path` = `design/` ·
  `discipline-normal-finish` = 节标题+引导行（核内三行不注入）· `question-ui-face` = 替换位面板版 `Availability:` 行 · `bash-terminal-face` · `eng-coder-guidelines` · `discipline-engineering-vsc-r14-pools` · 空值锚 2）＋端说明括注并入同锚值（§2.13.2 建议）。测试面：`test/prompts-async-guidance.test.mjs`（prompt-overlays 入边 →
  改指核）· `test/tool-descriptions.test.mjs`（断言 VSC 工具描述——保留改指核 tool-docs + 注入值）。**核对项**：§2.13.2「核内测试同步坐标」（`thincoder-core/test/prompt-files.test.mjs:105` 旧锚名断言）——已收正则零动作；未收正 = 发现上报（不代改核）。专项验收：VSC 装配输出零 `{{inject:` 字面（可机判：入口装配后四装配面输出扫描）· 13 锚 VSC 值逐锚在场（§2.13.2 验收列）·
  `## 收尾验收` 节标题在场恰一份（VSC 侧）· `design/` 文档地图路径（doc-map-path 值）在场 · `src/prompts/` + `src/tools/*.md` 枚举为空（F9 实现面口径）。

**W3 · TRACES**：删 `src/traces/trace-store.mjs`（254）→ 核 `@thincoder/core/traces/trace-store.mjs`。存活改指 0（唯一入边 provider.mjs = W10 删档）。测试面：`test/trace-store.test.mjs` → 改指核（行为面保留——容量/清理策略已裁决取并集，§2.5 #116）。专项验收：W3 删除集零引用 · trace-store.test 改指后绿 · 未涉面计数不变（N1）。

**W4 · WORKSPACE**：删 `src/ledger.mjs`（227）· `src/conventions.mjs`（226）· `src/escape.mjs`（153）· `src/expand-home.mjs`（21）→ 核 `@thincoder/core/{ledger,conventions,escape,expand-home}.mjs`。存活改指 4：`agent/run-helpers.mjs`（conventions/escape 入边）· `agent/tool-gates.mjs`（conventions）·
  `extension/ledger-surface.mjs`（ledger）· `indexer.mjs`（conventions）。端壳缝：台账渲染面 `ctx.colors/pushLine/render`（§2.13.3）由 `extension/ledger-surface.mjs` 供值（现形已在端壳——改指核 `ledger-surface.mjs` 后按缝装配）。测试面：`test/ledger.test.mjs`（ledger + extension/ledger-surface —— 端壳档保留，改指核 ledger 面）。
  专项验收：W4 删除集零引用 · ledger-surface 面板推送计数 = 行数（缝注入断言）。

**W5 · CHECKPOINT**：删 `src/tools/git-checkpoint.mjs`（150）· `src/tools/git-ext.mjs`（174）· `src/tools/checkpoint.mjs`（451 → 核 `git/checkpoint.mjs`）。存活改指 0（`tools/shell.mjs` 的 `./checkpoint.mjs` 引用随 W14 同批改指核 `git/checkpoint.mjs`）。
  测试面：`test/git-commit-pathspec.test.mjs`（git.mjs = W14 面）随 W14。专项验收：W5 删除集扫描域零引用 · checkpoint 工具注册后行为 = 核实现（核测试 `git/checkpoint` 面已绿——含在 178 内）。

**W6 · CONTEXT-COMPACTION**：删 `src/compact.mjs`（388）→ 核 `@thincoder/core/context.mjs`（压缩面语义对位——§2.5 #162–#164 已裁）。端壳改指 3：`extension/{history-window,generate-title,turn-model}.mjs` → 核 `history-window.mjs` · `generate-title.mjs`（标题生成三格式分派 = 核内实现，§2.13.4 #163 已满足）·
  turn-model 按核 context 面接线。存活改指：`agent/run-helpers.mjs`（compact 入边——随 W15 面改指）。测试面：`test/history-window.test.mjs`（extension/history-window 端壳保留 → 改指核面）· context-parity 族随 W15。专项验收：W6 删除集零引用 · 压缩判定点封装按 §2.13.4 #56‑类端接线（`configureTreeResolve` 等按端注入）·
  预算端差按 `CONTEXT-COMPACTION.md §6.13`（webview 四态等现状登记）收正。

**W7 · MCP**：删 `src/mcp.mjs`（12）· `src/mcp/{http 256, index 420, stdio 140, utils 49, ws 130}.mjs` → 核 `@thincoder/core/mcp.mjs` + `mcp/{transport-http,transport-stdio,transport-ws,helpers}.mjs`（stdio/ws/utils 逐字同源——删旧零语义）。存活改指 3：`extension/chat-panel.mjs`（mcp.mjs）·
  `extension/panel-mcp.mjs`（mcp/index）· `extension/settings.mjs`（mcp.mjs）。**端壳增量迁入**：`mcp/index.mjs` 的 client-id 注册表 + 面板状态接口（`mcpConnectedNames` / `mcpConnectedToolCounts` / `mcpDisconnectByName`）移入端壳（`extension/panel-mcp.mjs` —— 核 mcp.mjs 为 name-key session 面，按现状适配）。
  `config-mcp.mjs`（S 端壳）保留——其内部 config-io 引用随 W16 改指。专项验收：W7 删除集零引用 · MCP 装配/探活/生命周期按 `MCP.md §6.10` 现状登记 · 面板 MCP 页连接计数接口在位（端壳增量）。

**W8 · MEMORY**：删 `src/memory.mjs`（273·同路径但内容分叉极大——j=0.0093，B16）· `src/embedding.mjs`（102）· `src/index-bin.mjs`（43）· `src/index-discover.mjs`（173）→ 核 `@thincoder/core/memory.mjs`（sqlite 面——A12 已裁归一）+ `embedding.mjs` + `index-*.mjs`。存活改指 4：`agent/context-injections.mjs` ·
  `embed-config.mjs` · `indexer.mjs` · `memory-tool.mjs`。**前置门（未决 1）**：VSC 记忆面接线 = 采纳 `node:sqlite`（A8/A13 定案）⇒ 扩展宿主需 Node ≥ 22.13 + sqlite 内建 ⇒ `engines.vscode` 须自 `^1.85.0` 抬至候选 **`^1.104.0`**（值待真机实测 + 用户过目——§2.12.3 第 1 行上抛项）＋激活护栏（`activate()` 自检不崩）。**W8 开工前置** = 该裁定落地；
  未裁前本单元押后（其余 15 单元不受阻）。专项验收：内存读写/检索行为按 A12 归一（sqlite 面）· 核内 memory 测试绿（含在 178 内）· 文档档 `MEMORY.md §6.9` 现状登记按接线后收正（文件制存储 → 归一退场注）。

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

**W14 · TOOLS 实现面**：删 13 同路径档（`shared 413 · checklist 438 · edit-diff 162 · execute 202 · file 122 · git 378 · linter 127 · lsp 127 · ops 112 · question 56 · search 295 · tree 64 · web 135`）+ 7 M 档（`edit-fuzzy-match 78 · edit-line-params 131 · file-edit 434 · hashline-edit 101 ·
  more-file 390 · read_image 63 · wait_for 190`）→ 核 `tools/*`（file→`file.mjs`（edit/hashline/read_image 全在其内）· more-file→`{patch,search,file}.mjs` · wait_for→`ops.mjs` · edit-fuzzy/line-params→`{edit-batch,edit-diff}.mjs`）。**保留 = VSC 装配面**：`tools/index.mjs`（76·
  VSC 登记表——含宿主工具 context/focus/shell/code + 自持 builtinTools）· `tools/{shell 317, code 165, context 139, focus 51}.mjs`（S）· `tools.mjs`（5·barrel）——其内部 import 全部改指核各子档（shared 及其余被删档 → `@thincoder/core/tools/...`）。存活改指 5：`agent/context-injections.mjs` · `tools/{index, context, focus,
  shell}.mjs`。**端壳缝接线**（§2.13.3/§2.13.5）：`writeThroughPath/configureWritePath`（编辑器写路径——`shared.mjs:66-106` 现形迁入端壳供值：getOpenDoc/applyEditorEdit/applyEditorRangeEdit）· `configureExecRun/runCommand`（`shared.mjs:148` runInterruptible 注入）· `configureTreeResolve`（cwd 归一）·
  `configureProcessTreeKill`（树杀）· `configureGitApproval`（审批门）· `configureLspHost` · `configureEditReceipt` · `configureSkillLoader` · `configureEngMirror` · `configureVerifyDiagnostics`（§2.13.3 族余项 9 组逐组按端供值/缺省）。测试面：`test/{edit-tool-improvement, read-dual-end,
  wait-for-advisor-pool, git-commit-pathspec, tool-descriptions}.test.mjs`（核面改指）· integration/scenario-01/06（.src 前缀 import 修正为核子路径——.src 兼容前缀发现见（七）①）。专项验收：W14 删除集零引用 · 写路径缝双夹具 + 结构机检（`thincoder-core/test/write-path.test.mjs` 已绿）·
  编辑工具 VSC 端差异按 EDIT 六档 §6 现状登记收正（编辑器路径/range 偏移/无 dirty 护栏/BOM/内嵌描述）· vscode 编辑器读写行为 = VSC 面（fuzz/line-params 核算法 + 端壳写回）。

**W15 · AGENT-LOOP**：删 `src/agent.mjs`（387）· `agent/{setup 464, setup-reminders 252, run-stages 339}.mjs` · `src/explore-distill.mjs`（156）· `src/i18n.mjs`（56）→ 核 `@thincoder/core/{agent.mjs, agent/*, explore-distill.mjs, i18n.mjs}`。保留 `agent/{agent-state 111,
  context-injections 227, execute-tools 363, run-helpers 297, tool-gates 159}.mjs`（S 编排——内部改指核 agent 面）。存活改指 7：`agent/{agent-state, context-injections, execute-tools, run-helpers}.mjs` + `extension/{chat-panel, notify, panel-messages}.mjs` 等（i18n 入边）。
  **端壳缝接线**：`projectDictionary(locale)`（VSC `locales/{en,zh}.json` 投影——核 i18n 消费，投影逐字冻结）· #112 read_image 门（核内装配面恒含 + run 起始能力面重解——定稿 §2.13.6 缺口 5·VSC 零动作，核对核内已落）· #113 编辑器上下文采集（VSC 端供给——现形 agent/setup 面迁 injection 端壳）· #175 推理档位面（`reasoning-mode.mjs` 端壳供值）。
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
| VSC 特有编排（src 内 S 档 19） | `agent/{agent-state,context-injections,execute-tools,run-helpers,tool-gates}`（VSC 循环装配/门禁/peer 冲突）· `agent-tools/{async-discard,read-history-discovery}` · `config-mcp.mjs` · `embed-config.mjs` · `indexer.mjs`（.thincoder/index 向量面）· `memory-tool.mjs`（W8 后改指核 memory 面）· `repomap.mjs`（workspace.fs 数据源）· `specs.mjs`·`tools.mjs`（barrel）· `tools/{index,shell,code,context,focus}.mjs` | 逐档读档分类（勘察 3） |
| 文本面 | `locales/{en,zh}.json`（projectDictionary 投影面）· `assets/**` | VSC 显示/图标面 |

#### 模块权威档同步计划（实施时逐单元按现状收正 · 一致性面 · 不改机制）

> 总则：每单元提交时同步收正其「VSC 端接线/端差异」节的 **坐标 · 状态行 · 端差登记**（由「VSC 侧 `src/xxx.mjs` 自持镜像」更新为「VSC 经 `@thincoder/core/xxx.mjs` 引用」）；只收正形态，不触碰机制条文（07:08 裁定）。已落 VSC 端节清单（并入面——`VSC-MIGRATION-INVENTORY.md §9` 记录）：`CHECKPOINT §6.9` · `CONSULTATION §6.5` · `CONTEXT-COMPACTION §6.13` · `MCP §6.10` ·
  `MEMORY §6.9` · `SESSION §6.15` · `AGENT-LOOP §6.18/§2.3` · `TOOLS §6.11` · EDIT 六档 §6 · `PROVIDER §6.18/§6.19` · `AGENT-PARAMS §6.3` · `PORTABILITY §3.6` · `DESIGN-TOKEN-SETTLEMENT §6.3` · `ENG-TOKEN-BINDING §6.3` · `TOOL-OUTPUT-LIMITS §6.3` · `MULTI-INSTANCE-COLLAB` ·
  `BATCH-RECORD` · `ENGINEERING-MODE` · `SETTINGS-TOOL` · `DOC-CODE-RECONCILE §3.9` · `ARCHITECTURE §3.1/§4.1` · `PROXY` · `I18N` · `STRUCTURE-DEBT`。逐单元映射见（三）总表「模块权威档」列 + 各单元专项验收行。

#### 受影响文件全清单（R24a · as-of 2026-09-15 实核 · wc -l 口径）

| 面 | 构成 | 当前行数 → 预计 | 处置 |
|---|---|---|---|
| VSC 删除集（.mjs） | W1–W16 删除集 **100 档**（逐档行数见各单元删列） | 20,663 → **0**（删除） | 接线改指核后删除 |
| VSC 删除集（.md） | `src/prompts/` 15 + `src/tools/*.md` 25 | 1,435 → **0**（删除） | W2 删 |
| VSC 端壳改指面 | 存活 33 档 + 端壳 5 档（W11）+ `tools/index.mjs` + `specs.mjs`/`tools.mjs` barrels | 合计 ≈ 6,5xx → 行数不变（import 行替换） | 改指核子路径 |
| VSC 测试面 | 60 档直连 src（逐档见各单元测试面行） | 逐档 0 ～ −N | 核面改指 ∥ 退役（测试纪律①默认退役判据） |
| VSC 端点 | `extension.mjs`（92）· `package.json`（134）· `.vscodeignore`（18） | 0 → 0（入口注入 +0~2 行；后两者零改——装载面已在位） | W2 入口接线（activate 首步） |
| 模块权威档 | （三）总表映射 ≈ 24 档 `docs/core/design/*.md` + 子系统需求档端对位面 | 逐档 ±1~6 行（收正注记） | 按单元同步收正（一致性面） |
| 既有基线 | PROVIDER.md 6 行 >300（并行线遗留） | 不动（写域外——未决 5） | 交父侧 |

> 不新增任何 `.mjs`（端壳缝全部并入既有端壳档——方案选型 4(a)）；VSC `src/` 收口后 = 19 S 档 + 40 extension + tools/index + `locales/` 前端面外的装配/端壳面（薄壳面清单）。

#### 验收判据（回指需求条目 · 逐条可机器验证）

| # | 判据 | 回指 | 机判方式 |
|---|---|---|---|
| A-K1 | 16 单元全部落地后 VSC 全链 exit 0（`npm test` · `lint` · `test:full` · `test:integration` · `doc:check`） | N1 | 五命令实跑 `(exit code 0)` |
| A-K2 | 核回归 = 178/178 · fail 0（核零改动——比对改前基线） | N4·N5 | `node --test`（cwd = 核目录） |
| A-K3 | 仓根三机检：锚**0 悬空** · 台账**0** · 宽度**新增 0**（既有基线红 PROVIDER.md 除外——非本批） | N6 | 三脚本实跑读数 |
| A-K4 | 每单元删除集在 `src/`+`test/`+`extension.mjs` 域**反向判零引用**（两类形态各 0 命中——承 §2.6.2（五）法 1） | F5·N2 | 机判命令（实施 §5 落读数） |
| A-K5 | VSC 装配输出零 `{{inject:` 字面 + 13 锚 VSC 值逐锚在场 | F8·§2.13.2 | 装配面输出扫描 + 逐锚断言（W2 专项） |
| A-K6 | 提示词零残留：`src/prompts/` + `src/tools/*.md` 枚举空 | F9 | glob 枚举 |
| A-K7 | 逐单元单笔提交可回滚：`git revert` 后该单元全链复绿 | N2·N5 | revert 演练（抽样 ≥1 单元） |
| A-K8 | 未涉面用例逐数不变（VSC test:full 内非本单元用例计数与基线一致；面内按裁决改判逐条登记） | N1·F6 | 用例计数对账 |
| A-K9 | 端壳缝与界面：写路径/执行面/权限/`$schema`/载体 10 字段双夹具/`projectDictionary` 逐项注入断言绿 | F11·§2.13.3 | 核内测试（178 内）+ VSC 端装配用例 |
| A-K10 | 模块权威档收正：VSC 端节坐标/状态行更新 + 锚 0 悬空（实施轮改指时同批落） | 07:08 裁定 | doc-anchors + 收正档 diff 审读 |

#### 边界（本批不做）

- 不碰核包 `thincoder-core/**` 一字（含测试——核内任何待补位登记为上报，不代落）；不碰 `thincoder-cli/**`。
- 不改机制/不新增需求语义；端差一律走注入（契约 5/10）——**零** `if (vsc)` 式壳判断入核。
- 不做引擎下限变更（`engines.vscode`——未决 1，用户裁定后才动）；不引入降级路径（A13）。
- 不新建文档档（07:13——实施面只住批次档）；模块权威档只收正、不扩容。
- 不动 `scripts/**`（工程工具面 = 父侧）· 不动台账 `docs/TODO.md` · 不 commit · 不发起评审（设计轮后是否评审由用户定）。

#### 发现（逐条 · 不静默）

1. **度量脚本与现况冲突**：`scripts/mirror-divergence.mjs` 对 `thincoder-cli/src/prompts`（CLI 已删）报 ENOENT——默认面过时。scripts/** = 父侧工程面 ⇒ 上报，本批零写入。
2. **PROVIDER.md 宽度基线红**：实为 **5 行** >300（L27/47/48/260/305——含并行线 qwen-plan 批产物；其中 4 行为闸豁免表格行，实判 1 行 L260）。非本批写域 ⇒ 报父侧（未决 5）。
3. **同路径 ≠ 同内容实证**：`tools/index.mjs` = 同路径但 VSC 装配面（保留该档——删除集 −1）。⇒ 删除集判定按**内容实核**而非路径（本批 47 档逐档读档 + 登记册实读完成）。
4. **任务书清单计数差**：探勘清单写 45 档实为 **47 档**（3+5+8+5+5+6+3+12=47）——按 47 执行完毕（分类 M 28 / S 19 / U 0），如实登记。
5. **`.src` 前缀 import 面**：`test/integration/scenario-*.test.mjs` 内现用 `.src/xxx` 形态 import（如 `.src/agent.mjs`）——集成测试改指核时该前缀形态一并修正（或改仓根路径），登 W14/W15 验收面。
6. **advisor/main.mjs 的 rv async 隔离参数**（VSC 增量）：核 `advisor.mjs` 无同名参数，等效面 = 核 `agent-tools/advisor-async.mjs` `_advisorRuns` 注册表——删除时确认 VSC 侧该隔离语义由核注册表等效承载，零行为差（面内按裁决）。

#### 未决（真判不准 / 需人裁 —— 一律打回主 agent · 无旁路）

1. **A8 引擎下限（W8 前置门 · 语义面）**：`engines.vscode` `^1.85.0` → 候选 **`^1.104.0`**（A13 已裁「可抬·不保留降级路径」；值 = 候选，**待真机实测 + 用户过目**——§2.12.3 第 1 行上抛项）＋ `activate()` 护栏（自检 Node ≥ 22.13 且 `node:sqlite` 可导入，不满足 ⇒ showErrorMessage 提示停用记忆面不崩）。**请示**：① 本批内执行真机实测（需真 VS Code 宿主）
  ＋抬下限并落护栏，还是 ② W8 押后先跑其余 15 单元待用户另批？—— 交用户定。
2. **代码索引存储面（§2.12.3 第 11 行上抛项 · 语义面）**：VSC `.thincoder/index/`（manifest+vectors.bin）↔ CLI sqlite 库内索引 = 数据面/文件格式兼容**未裁**。影响 = W8 内 `indexer.mjs`/`repomap.mjs`/`memory-tool.mjs` 是否并核 sqlite（A12 已裁「记忆面归一」与存储面兼容并存的衔接口径）——交用户定判，未判前 W8 范围内按「记忆面接线、索引面保持现状登记」推进。
3. **#99 panel 动作剔除缝形态（§2.13.4）**：本批按**端侧过滤**执行（VSC 装配层删 `panel`，零核改动）。若实施中发现核侧不可滤（需核内缝）⇒ 属核内改动 = 超本批写域，停下上抛，不自行改核。
4. **§2.13.2 核内测试同步坐标**（`thincoder-core/test/prompt-files.test.mjs:105` 旧锚名断言）：CLI U2 应已收正——W2 实施时核对；未收正 = 发现上报（不代改核）。
5. **宽度基线红（PROVIDER.md 5 行 >300 · 闸判 1 行）**：交父侧（并行线遗留，非本批写域；如父侧裁定折行，执行者 = 父侧并打标——承批次先例）。

#### 交付表

| # | 需求点 | 状态 | 交付物 |
|---|---|---|---|
| 1 | §2 任务书写入（单元划分/删旧/复跑/回滚/权威档/验收） | ✅ Done | 本段（W1–W16 逐单元 + 总表 + R24a + 验收判据） |
| 2 | 勘察实核（import 现状/分类/登记册/装载面） | ✅ Done | 158 档全分类（73 同路径 + M28 + S19 + extension40）· 删除集 140 档 / 22,098 行 · 存活改指 33 |
| 3 | 方案选型对比（≥2 候选含否决理由） | ✅ Done | 5 候选（1 选定 + 2 整树/双源否决 + 2 端壳缝子选型） |
| 4 | 薄壳面清单 | ✅ Done | 面板/宿主 40 · webview · S 19 · locales/assets |
| 5 | 模块权威档同步计划 | ✅ Done | 逐单元映射 + 总则（收正·一致性面·不改机制） |
| 6 | 验收标准逐条回指需求 · 机器可验 | ✅ Done | A-K1–A-K10（回指 F5/F8/F9/N1-N6/07:08 裁定） |
| 7 | 未决（真判不准/需人裁） | ✅ Done | 5 条（引擎下限 · 索引存储面 · panel 缝 · 核内测试核对 · 宽度基线红） |
| 8 | 三闸读数 · 零落盘文档档 | ✅ Done | 锚 0 · 台账 0 · 宽度新增 0（基线红 1 档非本批）· 核/VSC/CLI 各树零触碰 |
| 9 | 不 commit · 不发起评审 | ✅ Done | 未 commit · 未发起（用户定后另行） |

> **补正（回读核对 D6 · 2026-09-15 · eng-designer）**：上段两处笔误——「STRUCUTRE-DEBT」应为「STRUCTURE-DEBT」（权威档清单行）；「十字段」应为「10 字段」（W11/W13 专项与 A-K9；父侧收正——正文 4 处落盘）。纯字形修正，语义零变化。

**变更记录**：- 2026-09-15（VSC 代码面接线设计轮 · eng-designer）：§2 写入任务书——W1–W16 逐单元（删 140 档 / 22,098 行 · 存活改指 33 · 单笔回滚）+ 方案选型（5 候选）+ 薄壳面清单 + 模块权威档同步计划 + 验收判据 A-K1–A-K10 + 未决 5 条（引擎下限 / 索引存储面 / panel 缝 / 核内测试核对 / 宽度基线红）。

## §3 设计评审（评审子代理）

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

## §6 验证与收口（父代理）