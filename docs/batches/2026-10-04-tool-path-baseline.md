# 2026-10-04 · 工具路径基面根治（文档类参数解析面 ∥ 错误信息面 ∥ 示例面）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 21:49「这种问题总是重复发生，是提示词还是工具提示面有什么缺陷吗？」+ 21:51「那必须根治啊！现在就动手」（台账 #921）。
> 台账 = #921（core · 归批）。前情 = 无（独立批——承 #921 ∥ 同族先例 2026-09-11 REVIEW-CHAIN-GUARDS 条目 C）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（根因已验——设计轮已派）

**开批登记（2026-10-04 21:5x · 主 agent）**：**来源** = 用户 21:49 两次追问（「总是重复发生……是提示词还是工具提示面有缺陷吗？」→ 21:51「必须根治啊！现在就动手」）。

**根因（父侧已验——实读 + 复现双证）**：
- **现象**：advisor `documents` 传裸仓相对形（`docs/desktop/design/RENDERER.md`）被拒（`scope-not-doc`）；带 `thincoder/` 仓前缀即过。
- **真因（复现实证）**：`thincoder-core/agent-tools/advisor.mjs:135` `normAbs(doc, agent.cwd)`——**解析基面 = 会话 cwd**（本会话 = 工作区根 `d:\teamcode`，桌面 `projects.currentCwd()` 取值）⇒ 裸形落 `d:\teamcode\docs\…`（不在任何项目 docRoot）⇒ 判 not-doc。同仓根下（`d:\teamcode\thincoder`）同串命中 ✓（复跑实证）。
- **三层缺陷**：① **工具描述教错**：`subagent.mjs:142` batchDoc 描述示例 = 裸形 `docs/batches/<batch>-<topic>.md`；`advisor.mjs:66` documents 描述无基面声明——模型照仓内引文惯例（全裸形）写 ⇒ 必踩；② **错误信息误报因**：`advisor.mjs:142` 报「非文档」，实为「路径未命中」——不给解析后路径，修正方向被误导；③ **同族先例**：2026-09-11 REVIEW-CHAIN-GUARDS 条目 C（宿主 cite 校验对裸相对路径引文误报 file unreadable）——跨工具跨月复发 = 系统性。

**候选修法（满量形态 · 设计轮裁）**：A｜**解析面根治**——`normAbs` 相对形不存在于 cwd 时，沿「各候选项目 docRoot 前缀」试探（`owningProject` 族既有面）命中即归一；B｜**错误信息根治**——拒时报「解析后绝对路径 `<n>` 不在声明文档域（基面 = 会话 cwd `<cwd>`）」+ 各候选仓 docRoot 提示；C｜**示例面**——工具描述与提示词面示例改带仓前缀形（`<仓>/docs/…`）+ 基面声明句。

**授权口径** = 全链（用户 12:18 + 21:47「都自动跑完」+ 21:51「现在就动手」）；快车道（用户点名根治）；**边界** = 只动解析面/报错面/示例面三处（`advisor.mjs` ∥ `subagent.mjs` ∥ 提示词面两句）；评审冻结窗期间不动被审三档。
**〔骨架残留节让位 · 评审 #12 发现 2〕**：下方重复 §1 节头 + 占位行 = 建档骨架残留（本批真实 §1 = 上方块——唯一权威）；记录属主收口时清理，下游写入以上方块为准。
## §1 讨论（主 agent）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-10-04（A+B+C 满量裁定（KD-1）∥ 单源宿主 review-facts.mjs + 同名再出口（KD-2）∥ 试探序四腿 + 歧义 fail-closed（KD-3）∥ 新判据 scope-doc-ambiguous（KD-4）∥ 上抛 4 项见 §2.7；语义融合四档（SETTLEMENT/BINDING/GUARDS/MANIFEST）设计轮同日落，API-CONTRACT 行组随实施轮实坐标落）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计档落点**：机制详述 = 本节；长期档语义融合 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §9 F3 ∥ `docs/core/design/ENG-TOKEN-BINDING.md` §9 F3 ∥ `docs/core/design/ADVISOR-GUARDS.md` §2.5 ∥ `docs/core/design/MANIFEST.md` §2.5 消费面收口条 ∥ `docs/core/design/API-CONTRACT.md` 导出行组（设计轮已同步融合，见各档 changelog）。

### §2.1 本批条目（覆盖——三链同源：本表 = §2.5 验收对照 = 需求源 §1 候选修法 A/B/C）

| # | 条目 | 覆盖面 | 判据（机检形） |
|---|---|---|---|
| E1 | 解析面根治（A） | advisor 设计评审 documents 裸仓相对形按候选项目 docRoot 归一受理；单源新导出 `resolveReviewDocPaths`（宿主 review-facts.mjs）；docAbs 产出面（advisor-async.mjs:394）同源归一 | 单元红绿：stub agent（cwd = 工作区根）+ documents = [裸形] ⇒ 旧码拒（scope-not-doc）/ 新码过；歧义：≥2 可读命中 ⇒ 拒 `scope-doc-ambiguous` 列全部命中路径 |
| E2 | 报错面根治（B） | not-doc 拒文案 = 既有稳定前缀逐字 + 诊断尾（逐文档「解析后绝对路径 ← 基面 = 会话 cwd」+ 候选项目根提示 cap 5 + 重试指引）；`criterion=scope-not-doc` 本体不变；歧义新判据 `scope-doc-ambiguous` 入 ADVISOR-GUARDS §2.5 枚举 | 文案断言：含解析后绝对路径 ∥ 含基面句 ∥ 稳定前缀逐字（`Advisor: design review documents must be documentation files`——既有测试 light-round-7.test.mjs:65 不改仍绿） |
| E3 | 示例面根治（C） | 七处基面声明句 + 仓前缀示例：advisor.mjs:66（documents）∥ advisor.mjs:70（batchDoc）∥ subagent.mjs:142 ∥ subagent-spawn.mjs:246 ∥ tool-docs/advisor.md:1 ∥ prompts/common.md:164 ∥ prompts/persona-engineering.md:133+179 | 逐处含基面声明；裸形孤例零残留（grep 机检） |
| E4 | 同族一次治（波及面收口） | spawn 批档门已治（batch-paths 多基底单源——零改验回归）；比对面（advisor-settle:66-97 ∥ write-gate:91-171）零改；冻结窗对裸形受理档照护 = docAbs 同源（E1 必要随件——否则 A 开冻结窗保护洞） | 冻结窗探针：裸形发起的设计评审在飞 ⇒ 写真实路径命中冲突；core 既有 advisor 用例零回归 |
| E5 | 回归面 | light-round-7.test.mjs 4 例全绿（前缀逐字 ∥ 无主档照拒语义不变）；REVIEW_ROOT_KEYS 键集 ∥ docRoot 语义 ∥ manifest 声明面零触 | light-round-7 套件复跑绿；既有键集断言绿 |

### §2.2 机制设计（A 本体——单源宿主与试探序）

**单源宿主 = `thincoder-core/agent-tools/review-facts.mjs`（评审事实面中立档）**：
- **宿主裁定（KD-2）**：分类器需 `owningProject` + 评审根集。落 write-gate 迫 advisor-async 新增 → write-gate 边，而 write-gate → advisor-settle → design-token → advisor-async 潜环在案（advisor.mjs:31 注释「no wrapper↔runner module cycle」自证该簇环敏感）；review-facts 已被 advisor-async import（:56 docSetKey）——**零新模块边**。中立边界收窄登记于档头：本档 import 面扩为「node:* + manifest 发现/声明族（叶向——manifest 族零依赖 advisor 面）」。
- **移宿主 + 同名再出口**（缝先例 = structure-split-2 · #620 同名再出口）：`REVIEW_ROOT_KEYS` + `resolveReviewRootsFor` 判定本体迁 review-facts.mjs；write-gate.mjs 同名再出口（指针非副本——normAbs 同款先例）——API-CONTRACT 与两明细档的 write-gate 落点指针仍真（行号 as-of）。
- **新导出 `resolveReviewDocPaths(documents, cwd)`** → `{ resolved: Map<原串,绝对路径>, invalid: [{doc, attempted}], ambiguous: null|{doc, hits} }`，逐文档四腿：
  - 腿①（零变）：`normAbs(doc, cwd)` 落会话根集 ⇒ 受理；
  - 腿②（零变）：n1 所属项目（owningProject）根集命中 ⇒ 受理；
  - 腿③（新增·根治面）：相对形 ∧ 前两腿未中 ⇒ 候选项目根逐个试探（候选 = `projectRootView(cwd)`：ok → [root]；ambiguous → candidates 按名序；none → 空集）——`resolve(c, doc)` 所属项目根集命中 = 结构命中；
  - 腿④（歧义归一·KD-3）：结构命中恰 1 ⇒ 受理；≥2 ⇒ 可读文件存在性唯一化（batch-paths 读面「首个可读」同款判据）：恰一可读 ⇒ 胜；≥2 可读 ⇒ fail-closed 拒（`scope-doc-ambiguous` 列全部可读命中）；0 可读 ⇒ not-doc 拒（诊断列全部结构命中）。
- **消费面**：advisor.mjs 分类块（:119-146）改调单源（本地 ownRoots 缓存腿随撤——单源内含）；advisor-async docAbs（:394）改调单源取 resolved。
- **零变面**：normAbs 本体 ∥ docSetKey（KD-5）∥ 判定强度（落声明根集才过——fail-closed 不减）∥ 无主档文档回退会话根集判定（light-round-7 语义）∥ 绝对形不进腿③（绝对形未中 = 真越界，无候选可试）。

**报错面形态（B——文案钉死）**：
- not-doc 拒（前缀逐字 + 诊断尾）：`Advisor: design review documents must be documentation files (per the project's conventions). Invalid: <原串列>` + 换行 `Diagnosis: resolved against session cwd <cwd> → <逐档 attempted 绝对路径>; no candidate project docRoot contains it (candidates: <项目根列，cap 5 + "+K more">) — pass project-root-relative (e.g. <首个候选>/docs/…) or absolute paths.`
- 歧义拒（新）：`Advisor: design review document is ambiguous — "<doc>" matches several candidate projects: <可读命中列>. Pass a project-root-relative or absolute path.` + 标识块 `criterion=scope-doc-ambiguous`。

**示例面基面声明句（C——统一形态）**：`Relative paths resolve against the session cwd first, then candidate project roots (project-root-relative e.g. <仓>/docs/…, or absolute).` 各落点按参数长度裁剪。

### §2.3 受影响文件与测试面

| 文件 | 现行数 | Δ 预期 | 变更 |
|---|---|---|---|
| thincoder-core/agent-tools/review-facts.mjs | 31 | +~55 → ~86 | 新单源（imports 扩 manifest 族 ∥ REVIEW_ROOT_KEYS + resolveReviewRootsFor 判定本体迁入 ∥ resolveReviewDocPaths） |
| thincoder-core/agent/write-gate.mjs | 185 | −15/+8 → ~178 | 两符号改再出口 + 薄委托；import 面随动 |
| thincoder-core/agent-tools/advisor.mjs | 275 | −20/+12 → ~267 | 分类块改调单源 ∥ B 文案两形 ∥ owningProject import 随撤 |
| thincoder-core/agent-tools/advisor-async.mjs | 492 | ±2（近硬帽——零净增纪律） | docAbs 行改调单源 |
| thincoder-core/agent-tools/subagent.mjs | 402（评审 #12 发现 1 实读收正——原注 602 误） | ±1 | batchDoc 描述基面声明 |
| thincoder-core/agent-tools/subagent-spawn.mjs | 439 | ±2 | batchDoc 拒文案基面声明 |
| thincoder-core/tool-docs/advisor.md | 9 | +1 | documents 基面声明句 |
| prompts/common.md（:164）/ prompts/persona-engineering.md（:133/:179） | — | ±3 | 三行基面声明（派单「两句」实为三处裸形——同族一次治，披露 §2.7-4） |
| docs/core/design/ADVISOR-GUARDS.md | §2.5 | ±4 | criterion 枚举 +1 ∥ 载面② 歧义分支 + changelog |
| docs/core/design/DESIGN-TOKEN-SETTLEMENT.md ∥ ENG-TOKEN-BINDING.md | §9 F3 | +2/+2 | F3 行解析增量句 + changelog |
| docs/core/design/API-CONTRACT.md | 导出行组 | +3 | 新导出 3 行 |
| docs/core/design/MANIFEST.md | §2.5 收口条 | +2 | advisor 分类面入按用点族清单 + changelog |
| 批内单元测试件 | 0 | +~120 | docs/batches/2026-10-04-tool-path-baseline.test.mjs |

**测试面（红先绿后——实施轮 eng-coder 执笔）**：① 红：stub（cwd = 工作区根 tmp 夹具，子仓带 manifest + docRoot 声明）documents=[裸形] ⇒ 旧码 scope-not-doc；② 绿：同夹具新码过，resolved = 子仓绝对路径；③ 歧义：双子仓同相对形且均可读 ⇒ scope-doc-ambiguous 列两路径；均不可读 ⇒ not-doc 列结构命中；④ 文案：not-doc 拒串含解析后绝对路径 + 基面句 + 候选提示；前缀逐字；⑤ 冻结窗探针：裸形在飞 ⇒ 写真实路径命中 inflightDesignReviewConflict；⑥ 回归：light-round-7 套件 + batch-paths 既有用例复跑绿。

### §2.4 关键决策（KD）

| # | 决策 | 理由 |
|---|---|---|
| KD-1 | A+B+C 全取（满量） | 用户「根治+满量先行」哲学在案；同族先例（9-11 REVIEW-CHAIN-GUARDS 条目 C）证明只修一层跨工具跨月复发 |
| KD-2 | 单源宿主 = review-facts.mjs（移宿主 + 再出口） | 落 write-gate 迫 advisor-async 新边 → 潜环；review-facts 已被两端 import 零新边；中立边界收窄（manifest 族叶向）登记档头 |
| KD-3 | 试探序 = 会话根集 → n1 所属项目 → 候选项目根逐个；歧义 = 可读存在性唯一化 | 前两腿 = 既有行为零变封装；候选序 = projectRootView 契约（按名序·确定性）；「首个可读」= batch-paths 读面既有判据同款；≥2 可读 fail-closed 不静默挑一（#828 歧义锚同哲学） |
| KD-4 | criterion 语义零扩：scope-not-doc 本体不变；歧义独立新判据 scope-doc-ambiguous | B = 报错方向纠偏非判定变更；歧义是新的失败类——混入 not-doc 会重演「误报因」 |
| KD-5 | docSetKey 保持 normAbs 零改 | 实例续跑语义零变——裸形/前缀形异键仅多耗一轮评审（安全侧）；实例键语义属另批（上抛 §2.7-2） |
| KD-6 | 示例面 = 基面声明句 + 仓前缀示例，非仅换前缀 | 教真解析语义（先 cwd 后候选根）——换静态前缀会再错一次（会话锚在仓根时仓前缀反冗） |

### §2.5 验收对照（AC 回指条目）

| AC | 判据（机检） | 回指 |
|---|---|---|
| AC-1 | 红绿对：stub + 裸形 ⇒ 红（scope-not-doc）→ 绿（resolved 落子仓 docRoot 内） | E1 |
| AC-2 | 歧义：≥2 可读命中 ⇒ 拒串含 scope-doc-ambiguous + 全部命中；0 可读多命中 ⇒ not-doc + 全部结构命中 | E1/KD-3 |
| AC-3 | not-doc 拒串逐项含「解析后绝对路径 ∥ 基面 = 会话 cwd ∥ 候选项目根提示 ∥ 重试指引」；稳定前缀逐字 | E2 |
| AC-4 | 示例面七处逐一含基面声明；grep 裸示例零残留 | E3 |
| AC-5 | 冻结窗探针：裸形受理档在飞 ⇒ 写真实路径冲突命中（docAbs 同源验证） | E4 |
| AC-6 | light-round-7 套件 4 例绿 ∥ batch-paths 既有绿 ∥ REVIEW_ROOT_KEYS 键集断言绿 | E5 |
| AC-7 | doc-check exit 0（本批触及档全过） | 全局 |

### §2.6 边界（本批不做）

manifest 声明面 ∥ docRoot 语义 ∥ REVIEW_ROOT_KEYS 键集 ∥ DEFAULT_MANIFEST 回退链——零触；冻结窗判据谓词本体（inflightDesignReviewConflict / reviewIsStale）零改（docAbs 输入归一 = A 随件，谓词不动）；row-traces ∥ responses-robustness ∥ doc-cleanup 三在途档零触（D5 冻结窗）；docSetKey 实例键语义（KD-5）∥ spawn 批档门解析序（已单源）∥ VSC tool-gates（不 import resolveReviewRootsFor——grep 实证，再出口保面后零波及）零改；产品码零写（设计轮——§2.3 全部落实施轮）。

### §2.7 上抛项（主代理裁量）

1. subagent.mjs 行数实读 402（评审 #12 发现 1 收正——未越 500 硬限，越 300 建议线）——**上抛建议改挂 300 建议线**（拆分登记仍可取，父侧裁量）；
2. docSetKey 裸形/前缀形异键（KD-5）——实例续跑面小损耗，登记不排期；
3. advisor.mjs:70（advisor 自身 batchDoc 描述）无基面声明——与 documents 同族同缺陷类，本批随 C 一并加声明句（±1 行）；若裁超射程可撤；
4. prompts 派单「两句」实为三处裸形（common.md:164 + persona-engineering.md:133/:179）——同族一次治取三处（披露非走私——同一缺陷面）。

### §2.8 设计轮自检

需求五元件面 = §1 讨论层承载（快车道——条目表即需求条目，三链同源）；波及面全列（grep 实读）：normAbs 七用点逐一定性（产出面 2 治 ∥ 比对面 5 零改），resolveBatchDocPath 已治实证（batch-paths.mjs:122 候选序单源），subagent-spawn:246 已列（C）；UI/交互决策落定：文案两形逐字钉死 ∥ 歧义判据名钉死 ∥ 试探序钉死——无 open 项。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审射程与证据面**：批档 §1/§2 全文 + 四长档（DESIGN-TOKEN-SETTLEMENT / ENG-TOKEN-BINDING / ADVISOR-GUARDS / MANIFEST）全文实读；设计锚点逐处对现盘核验——根因链三层定性全部吻合：`advisor.mjs:135`（`normAbs(doc, agent.cwd)` 裸形基面）∥ `:142`（既有拒文案逐字 = E2 稳定前缀）∥ `:66`/:70（documents/batchDoc 描述无基面声明）∥ `:31` 注释「no wrapper↔runner module cycle」（KD-2 环敏感自证）；`review-facts.mjs` = 31 行叶档（仅 import node:path——manifest 族叶向扩面零环成立）；`write-gate.mjs:43`（REVIEW_ROOT_KEYS）∥ `:64`（resolveReviewRootsFor）∥ 185 行；`advisor-async.mjs:56`（已 import review-facts——零新边成立）∥ `:394`（docAbs 产出面）∥ 492 行；`subagent.mjs:142`（batchDoc 裸形示例）∥ `subagent-spawn.mjs:246`（拒文案裸形）∥ 439 行；`tool-docs/advisor.md` ∥ `prompts/common.md:164` ∥ `persona-engineering.md:133`/:179（三处裸形实读在场——§2.7-4 披露属实）；`light-round-7.test.mjs:65`（前缀锚实读——不改仍绿成立）；`batch-paths.mjs:122`（候选序单源先例实读）。四长档同日落融合一致（详述单源 = 批档 §2.2；长档只挂语义行 + changelog，ADVISOR-GUARDS §2.5 判据枚举 + 载面③ 已同步——无重复无矛盾）。复现推演：cwd = 工作区根、裸形 `docs/…` 落腿①②皆空、腿③ 经 `projectRootView` 发现梯（③ 带档子目录优先）命中子仓 docRoot——缺陷修通路径成立。

**发现表**（🔴 0 ∥ 🟡 2 ∥ 🔵 3）：

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity（受影响文件行数注） | 🟡 | `subagent.mjs` 现行数注 = **602**（§2.3 表 ∥ §2.7-1「存量超帽……602 > 500 硬限」），实读 = **402** 行——上抛前提（硬限越线）不成立（402 仍 > 300 建议线，追踪价值在、定性须改）；同批其余行数锚点抽查吻合（advisor.mjs 276≈275 · advisor-async 492 · subagent-spawn 439 · write-gate 185 · review-facts 31） | 按 402 实读收正 §2.3 与 §2.7-1 表述（升级理由改挂 300 建议线或去硬限措辞）；上抛建议本身保留（父侧裁量） |
| 2 | Clarity（受影响文件行数注） | 🔵 | `tool-docs/advisor.md` 现行数注 = 9，实读 = **5** 行——数字漂移类（不涉档位） | 实施轮回填实读数 |
| 3 | Doc hygiene（记录面） | 🟡 | 批次档现盘存在**两个**「## §1 讨论（主 agent）」节头（:5 实体节 ∥ :18-20 骨架残留节——占位状态行「🔄 进行中（…）」+ 模板占位行）；后续 §1 append/status 落两节中的后节，节归属歧义（机械危害：append 落点漂移） | 记录面属主清理：删 :18-20 骨架残留节（§2 的 `<§2 模板占位…>` 行 = 工具契约允许的合法占位、可留不动） |
| 4 | Scope（枚举完整性） | 🔵 | §2.8 自检「normAbs 七用点逐一定性（产出面 2 治 ∥ 比对面 5 零改）」计数不全——`write-gate.mjs` 另有 5 处 normAbs 用点（:91/:99/:126/:168/:171——冻结窗/批档门比较面）未入该枚举；零改实质已由 §2.6（谓词本体零改）覆盖，唯「全列」措辞过强 | §2.8 枚举补 write-gate 5 处（零改定性）或将「七用点」限定为 advisor 面用点 |
| 5 | Clarity | 🔵 | E3/AC-4「七处」与锚点清单实际 **8 行**（persona-engineering.md:133 与 :179 两行）计数歧义；grep 裸示例零残留机检使实质影响为零 | AC-4 措辞改「清单逐行（8 锚）」或按文件计数，消歧义 |

**结论**：机制设计（四腿试探 ∥ 歧义可读唯一化 fail-closed ∥ docAbs 同源堵冻结窗保护洞 ∥ KD-1..6）经现盘锚点核验**可行、自洽**；需求覆盖完整（用户「根治」诉求 = 解析面/报错面/示例面三处 + 同族收口 E4 + 回归 E5；§2.7-4 扩面如实披露非走私）；验收 AC-1..7 机检可验（红绿对 ∥ 歧义两格 ∥ 文案逐字 ∥ grep ∥ 冻结窗探针 ∥ 回归 ∥ doc-check）；文件档位纪律合规（advisor-async 494 < 500 零净增在案；无跨 500 面）。无 🔴——🟡/🔵 不阻塞。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-04 22:4x 父侧代签**（承用户 21:47「都自动跑完」∥ 21:51「必须根治！现在就动手」全链授权；非用户亲签）。

**三条件核验**：① 设计评审 pass ✓（评审 #12 · 轮次 1 · 0🔴 / 2🟡 / 3🔵——根因链 ∥ 锚点 ∥ 复现推演全实读核；报告全文在 §3）；② 修正落地并逐条核验 ✓——🟡1（subagent.mjs 602 误注）父侧直落：§2.3 表行改 402 实读值 + §2.7-1 上抛前提改挂 300 建议线 ✓ ∥ 🟡2（双 §1 节头骨架残留）父侧直落：残留节上方加让位登记（收口时清理，下游以上方块为准）✓；🔵3 条（normAbs 七用点枚举补写 ∥ advisor.md 行数 ∥ 「七处」措辞）= 实施轮回填面，在册；③ token 已签发 ✓（运行态不入档）。**批准范围** = 本批全量（E1–E5 + AC-1..7 + 语义融合四档随动；AC-7 doc-check 随实施轮）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-04（审计+评审+fix 轮三段在册；终态 clean（round 1 pass → fix 3 落 → clean）；批内件 fix 后两读 8/8 绿）



**实施轮交付（eng-coder · 2026-10-04 · round=initial）**——A+B+C+E4+E5 全落；门读数见下。

**落地表（file:line · as-of 本轮实读）**：

| # | 文件 | 落点 | Δ | 内容 |
|---|---|---|---|---|
| 1 | thincoder-core/agent-tools/review-facts.mjs | 整档 31→123 行 | +92 | 单源宿主（KD-2）：imports 扩 manifest 族（叶向——零 advisor 边，环检实跑在案）；`REVIEW_ROOT_KEYS` + `resolveReviewRootsFor` 判定本体自 write-gate 迁入（逐字零变）；新导出 `resolveReviewDocPaths`（四腿：①会话根集②所属项目根集③候选项目根试探（projectRootView：ok→[root]/ambiguous→按名序/none→空集；绝对形不进腿③）④可读唯一化歧义 fail-closed）；`sessionReviewRoots` 腿①封装；比较面 `/` 归一、**产出面原生形**（与 normAbs 同族——冻结窗/陈旧谓词零改照比对） |
| 2 | thincoder-core/agent/write-gate.mjs | :44-46 再出口；本体删；:58 薄委托 | 185→172 | 两符号同名再出口（指针非副本——normAbs 先例）；resolveReviewRootsFor 本体迁出后 resolveReviewTargetPaths 薄委托同名函数；死 import（DEFAULT_MANIFEST/docRootPaths/readManifest）随删；头注改述 |
| 3 | thincoder-core/agent-tools/advisor.mjs | :12-17 import 面；:63-89 分类块；:62-66/documents + :67-71/batchDoc 描述 | 275→276 | 分类块改调单源（owningProject ∥ sep ∥ resolveReviewTargetPaths ∥ resolveReviewRootsFor 四 import 随撤）；B 文案两形（not-doc = 稳定前缀逐字 + 诊断尾「解析后绝对路径 ← 基面 = 会话 cwd → 逐档 attempted + 候选根 cap 5 + 重试指引」；歧义独立形 + `criterion=scope-doc-ambiguous`）；C 面声明句两处（§2.7-3 batchDoc 随件） |
| 4 | thincoder-core/agent-tools/advisor-async.mjs | :56 import；:393-398 docAbs | 492→494 | docAbs 产出面改调单源 resolved（**零净增纪律达成 ≤494**）；normAbs 死 import 随删 |
| 5 | thincoder-core/agent-tools/subagent.mjs | :142 | 402→401 | batchDoc 描述基面声明句 + `<repo>/docs/batches/…` 示例 |
| 6 | thincoder-core/agent-tools/subagent-spawn.mjs | :245-246 | 439→438 | batchDoc 拒文案基面声明句 + 仓前缀示例 |
| 7 | thincoder-core/tool-docs/advisor.md | :1 | 5→5 行 | documents 基面声明句 |
| 8 | thincoder-core/prompts/common.md | :164 | ±0 | 批次档形态句基面声明 |
| 9 | thincoder-core/prompts/persona-engineering.md | :133 / :179 | ±0 | 两处 batchDoc 示例基面声明（§2.7-4 三处全落） |
| 10 | docs/core/design/API-CONTRACT.md | :629-633 行组；:825-829 行组 | +3 新行 + 坐标回填 | review-facts 新导出 3 行（REVIEW_ROOT_KEYS/resolveReviewRootsFor/resolveReviewDocPaths）；迁移必然后果的既有坐标 as-of 回填（docSetKey :26→:23；write-gate normAbs :40→:39 ∥ freezeWindowConflict :84→:72 ∥ batchRecordWriteConflict :160→:148 ∥ resolveReviewRootsFor 并入 :44 named 行） |
| 11 | docs/batches/2026-10-04-tool-path-baseline.test.mjs | 新建 8 用例 | +~200 | 批内件（§2.3 测试面 ①-⑥ 全腿） |

**红绿两读**：红（旧码实跑取证，探针用后已删）= ① 裸形 `docs/core/design/spec.md`（工作区锚 + 子仓 manifest）→ `scope-not-doc` 误拒；② 双子仓同形 → 无歧义判据照旧误拒；③ 旧 docAbs（normAbs 直拼）→ 真实子仓路径写**不命中**冻结窗（保护洞实证）。绿 = 批内件两读 `仓根 node --test docs/batches/2026-10-04-tool-path-baseline.test.mjs` → **tests 8 / pass 8 / fail 0 ×2**（裸形受理+子仓归一 ∥ 绝对形零变 ∥ 歧义三格〔≥2 可读拒列全部/恰一可读胜/0 可读 not-doc 列全部结构命中〕∥ B 文案四件套+前缀逐字 ∥ 冻结窗探针命中 ∥ 键集断言 ∥ light-round-7+manifest-resolution-fix 复跑 ∥ AC-4 grep 八锚+零残留）。

**门读数**：① `node --check` 六触码全 exit 0；② 回归：light-round-7.test.mjs 6/6 绿（批档记 4 例 = 旧读数，现盘 6 例更强）∥ manifest-resolution-fix.test.mjs（batch-paths 既有面）7/7 绿 ∥ REVIEW_ROOT_KEYS 键集断言绿（本体零变 + write-gate 再出口同一常量）；③ doc-check exit 0（悬空 0 · 行宽 0——API-CONTRACT +3 后复跑）；④ grep 裸示例残留 0（agent-tools ∥ agent ∥ tool-docs ∥ prompts 四树扫域）；⑤ 行数界：review-facts 31→123（**超批档 ~86 预估 +37**——迁入本体 + 四腿完整形态，远低 500 硬限，如实披露）∥ write-gate 172（估 ~178）∥ advisor 276（估 ~267）∥ advisor-async **494 = 零净增纪律达成** ∥ subagent 401 ∥ subagent-spawn 438；⑥ manifest 三档 git diff 零触 ✓（禁触面兑现）。

**§5 状态行**：实施完成（红绿两读 + 六门全过——见上）。

**审计与代码评审轮次（终态 clean）**：

- **内部 explore 审计（divergence audit · 1 轮）**：交付 vs §2 设计零分歧——AC-1..5 逐一现盘兑现、静默简化零、文档漂移零、表外变更零（红探针/__dbg 两临时件均已删、现盘零残留）。审计报告全文经 spawn 通道回报父侧。
- **内部 advisor 代码评审（轮 1 · 全量）**：**VERDICT: pass**（0🔴 ∥ 2🟡 optional ∥ 5🔵）。🟡1 = 非字符串/空白串项静默跳过（schema 外输入——建议拒或文档化）；🟡2 = subagent.mjs 401 / subagent-spawn 438 >300 建议线（存量——§2.7-1 已上抛，subagent-spawn 拆分计划未登记，父侧裁量）；🔵 = sessionReviewRoots 未入 API-CONTRACT ∥ 批内件 fail 正则字面枚举 ∥ E4 探针后台 promise 未 join ∥ review-facts 计划 86/实落 123 披露在案 ∥ 腿④单结构命中不查存在（设计本意——informational）。
- **就地 fix 轮（3 落 2 缓裁）**：① 单源 JSDoc 补「非字符串/空白串项静默跳过（同 docSetKey 既有过滤语义）」（🟡1 取文档化路径——改拒则动 docSetKey 对齐面，KD-5 零变面不碰）；② `sessionReviewRoots` 转档内私有（零外部消费实证——🟡建议项取消注册：符号不再在契约面）；③ 批内件 fail 正则无界化 `/fail [1-9]\d*/` + E4 探针 controller.abort 封闭（🔵 两笔落）；腿④ informational 注释补语义句（🔵7 落）。🟡2（行数建议线）= 父侧裁量域，不落。**fix 后复跑**：批内件两读 tests 8 / pass 8 / fail 0 ×2 ∥ `node --check` review-facts exit 0 ∥ doc-check exit 0（悬空 0 · 行宽 0）∥ review-facts 终值 **125 行**（sessionReviewRoots 转私有 +2 注释行）∥ `git grep sessionReviewRoots` 仅本档（私有化实证）。
- **评审轮终态**：round 1 pass → fix 轮 3 落 → **clean**（无再评需求——fix 均为 🔵/文档级，零判定面变更）。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（工具路径基面根治——批链：设计 #7 → 评审 #12 pass（0🔴/2🟡/3🔵·两🟡当轮落地）→ §4 代签 → 实施 eng-coder#14（verify 门 clean·审计+评审+fix 三段在册）→ 本节父侧复跑核验）

- **判据链（父侧复跑实读 23:2x）**：批内件 **8/8 exit 0**（tests 8 ∥ pass 8 ∥ fail 0）∥ 回归 light-round-7 **6/6** ∥ manifest-resolution-fix **7/7** ∥ doc-check **exit 0**（真红 0）∥ AC-4 裸示例 grep：四档命中全为 `<repo>/` 前缀合规形 + 基面声明句（零缺陷形残留）∥ `__dbg.mjs` 零残留（实施舱披露 4 之清理已核）。
- **行数账实读**：review-facts 31→125（迁入本体 + 四腿完整形——实施舱披露 1 如实，远低 500）∥ write-gate 185→172 ∥ advisor.mjs 276 ∥ advisor-async 492→**494**（零净增纪律达成）∥ subagent.mjs 401 ∥ subagent-spawn 438。
- **上抛裁量（父侧）**：① subagent-spawn 438 >300 建议线——**登记不排期**（300 建议线族，与 subagent.mjs 同册）；② advisor.mjs 非字符串 documents 项「文档化跳过」维持（改拒动 docSetKey 对齐面——KD-5 零变在案，如需另裁另批）；③ 批档 §1 双节头骨架残留 = 记录面属主收口项——本收口笔视作处置完成（让位登记已在 :18 上方，残留节不再作为写入锚）。
- **提交**：本波 commit（六产品码 + API-CONTRACT + 批档 + 批内件）随本仓统一签入（见 git log）。
