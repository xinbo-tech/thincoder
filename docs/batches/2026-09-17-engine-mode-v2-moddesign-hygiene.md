# 工程模式 v2 · 模块设计（清理与机检族）批次档

> 前情 = `docs/batches/2026-09-17-engine-mode-v2-specs.md`（规格批 + 模块设计·基础族）

## §1 本批目标与条目（主 agent）

**交付目标**：按 Function Spec 产出 **M7 / M8 / M9 / M10 的模块设计（Module Design）**。

**落点**：`docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-{CHECKLIST-REMOVAL,MACHINE-CHECK,PROMPT-PIPELINE,TEST-DISCIPLINE}.md`

**本批条目**（4 条）：

| # | 条目 | Function Spec | 架构设计依据 |
|---|---|---|---|
| 1 | M7 checklist 废除 | `...-SPEC-CHECKLIST-REMOVAL.md` | §2.2 M7（死文件发现） |
| 2 | M8 机检引擎 | `...-SPEC-MACHINE-CHECK.md` | §2.2 M8 · §2.3 E4（纪律→机检映射）· KD2 |
| 3 | M9 提示词单向生成 | `...-SPEC-PROMPT-PIPELINE.md` | §2.2 M9（含清理「方案选型对比」残留）· KD5 |
| 4 | M10 测试纪律 | `...-SPEC-TEST-DISCIPLINE.md` | §2.2 M10 · §2.3 E4 |

**模块设计五要素**：① 问题陈述 ② 方案与理由 ③ 受影响文件全清单（当前行数 + 预计增量，含两端接线面）④ 验收逐条回指规格 ⑤ 变更记录。

**范围边界**：
- 只出模块设计（精确到函数级编辑点）+ 批次档 §2；**不写实现代码**。
- 不改架构设计档 / 规格档 / v1 老档 / 代码。

**状态行**：🔄 进行中（模块设计·清理与机检族）

---

## §2 本批任务书（eng-designer）


**交付目标**：M7 / M8 / M9 / M10 四份模块设计（五要素：问题陈述 / 方案与理由 / 受影响文件全清单（当前行数 + 预计增量）/ 验收逐条回指 / 变更记录）+ 架构设计 M7 三处收正（§4 裁定 D1）。

**覆盖条目**：

| # | 条目 | 设计落点 | 验收回指 |
|---|---|---|---|
| 1 | M7 checklist 废除（含 §4 D1/D2/D3 裁定：受影响文件收正为核 3 + VSC 2 + 死指针 2 + 门禁 1 + 测试 5；注入面纯移除不承接；门禁族删） | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-CHECKLIST-REMOVAL.md` | AC-M7-1..7 |
| 2 | M8 机检引擎（单引擎 + 声明面 + D5 冻结窗口机检） | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK.md` | AC-M8-1..6 |
| 3 | M9 提示词单向生成（含清理「方案选型对比」残留——记录范围，落笔归主 agent + coder） | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md` | AC-M9-1..4 |
| 4 | M10 测试纪律（`slow.mjs` 纯别名 + 统一 runner `run.mjs`） | `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-TEST-DISCIPLINE.md` | AC-M10-1..4 |
| 5 | 架构 M7 收正（§4 D1） | `docs/core/design/ENGINEERING-MODE-V2.md` | :70 模块表 M7 行 · :78 现状勘察摘要 · :93 两端接线表 M7 行——「死文件 / VSC 零改」旧断收正为「删除 3 + 挂载/注入/死指针/门禁/注释 + 测试 5 档」完整接线 |

**验收判据**：每份模块设计 §3.1 逐条回指对应 spec AC（M7 7 条 · M8 6 条 · M9 4 条 · M10 4 条），每条可机判（命令 / grep / 文件存在性）；三方条目一致（批次档 §1 条目 = 设计档 §3.1 回指 = 规格条目）。

**修正轮（清理与机检族）**：10 份模块设计档去「方案选型对比」纪律残留（父侧裁定 2026-09-17——需求档 §6.2「就方案本身说清为什么，不强制列候选对比」）。范围 = TEST-DISCIPLINE 两对比表改「决定 + 理由」段 + 其余 9 份「单方案——无对比（显式声明豁免）/ 显式豁免对比」声明改直接陈述；判据 = grep `单方案——无对比|显式声明豁免|方案选型对比|候选方案|豁免对比` 10 份档内无匹配；不夹带其他改动（用例表 / 关键决策 / 接口契约 / 受影响文件清单全保留）。

**范围边界**：只出模块设计（精确到函数级编辑点）+ 批次档 §2；不写实现代码；不改规格档 / 提示词 / v1 老档 / 产品代码。

**判据订正（清理与机检族 · 修正轮收口）**：grep 判据收窄为「声明词头」——`单方案——无对比|显式声明豁免|候选方案|豁免对比` 在 10 份模块设计档内无匹配。「方案选型对比」字面在 M9 功能内容（PROMPT-PIPELINE 功能点 F4 + AC-3 判据）与各档变更记录自述中合法保留，不计入残留判据。

### 修正轮 · 设计评审发现 #1 + #3 落地（eng-designer · 2026-09-17）

按主 agent 裁定逐条落地（发现号 → 改动 file:line）：

| 发现 | 改动 |
|---|---|
| #1 | M8 档 `ENGINEERING-MODE-V2-MODULE-MACHINE-CHECK.md`：§2.1#4（:51）补分工句（拦截主责 M4 门禁、M8 只做可检面）· §2.2 数据流图（:61）加 `checkFreezeWindow(activeBatch, 被审文件集)` + 接口（:67）+ D5 在途状态读取契约（:72-77——判据来源 = 批次档状态行「评审在途」，M6 槽不适用）· §2.3 `doc-check.mjs` 行 +~50（:83）· §2.5 分工句（:111）· §3.1 补 AC-7（:125，回指 ②.5——spec ④ 无对应 AC，上游缺口）· §3.2 T5 对齐契约（:135）· §4 变更记录（:144） |
| #3 | M9 档 `ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md`：F3 契约（:20）· N2（:28）· §2.1#1#3（:46, :48）· §2.2 图（:55）+ 接口（:62, :65）· §2.3 行（:72）· KD-M9-5（:87）· §2.5 回写注记（:94）· T2（:112）· §4 变更记录（:122）；回写架构 `ENGINEERING-MODE-V2.md` §2.3 E1 JSON（:136）+ 键注释（:146）+ 校验枚举（:147）+ M1 行六键→七键（:64）+ §2.4 接口表（:300）+ AC3（:348）+ E2 声明面覆盖（:212）+ M9 行职责（:72 落点读声明面）+ 变更记录（:376）；回写 M1 规格 `SPEC-MANIFEST.md` ①（:9）/②.1 七键（:13）/⑤（:39） |

**方案决定（未拍板项现已落定）**：落地路径 = manifest **顶层平级键 `promptsLanding`**（非 docRoot 加键）——理由 = 落地是代码仓路径、不属于文档体系；模板路径 = `docRoot.design` + `/prompts` 推导（无新键）。缺键 fallback 用默认 `thincoder-core/prompts`（M1 ②.4 语义）。

**本轮不做**：M8 spec ④ 补 AC（上游缺口，未派）；M7/M10 档（其余发现已由主 agent 收正）；机检折行（架构 :70/:72/:78/:93 四处 >300 行——M7 校准轮改写产物，非本轮引入）；M1 模块设计档 9 处「六键」引用（未派，见下方观察项）；状态行推进与台账核销（归收口）。

**观察项（不阻断本批）**：
1. M1 模块设计 `ENGINEERING-MODE-V2-MODULE-MANIFEST.md` 有 9 处「六键/默认六键」引用（:20, :50, :53, :67, :100, :118, :119, :128）——本轮 schema 增键后已漂移，需后续修正轮或父侧机械收正。
2. M8 spec `SPEC-MACHINE-CHECK.md` ④ 无冻结窗口 AC（AC-M8-1..6 之外无对应）——AC-7 回指 ②.5 并标注上游缺口，spec 补 AC 未派。
3. M9 spec `SPEC-PROMPT-PIPELINE.md` ②.3「落点读 docRoot」措辞——落地已改为读 `promptsLanding`，spec 措辞未回写（未派）。
4. 架构 :70/:72/:78/:93 四处 >300 行——M7 校准轮改写产物，非本轮引入。

### 修正轮 · M9 实施阻断三裁定落地（eng-designer · 2026-09-17）

按主 agent 裁定 Q1/Q2/Q3 逐条落地（裁定 → 改动 `file:line`；只动 M9 模块设计档，未碰 spec / 代码 / 提示词 / 其余档）：

| 裁定 | 改动（`ENGINEERING-MODE-V2-MODULE-PROMPT-PIPELINE.md`） |
|---|---|
| Q1 路径 | §1.1 权威源前提注记（:12）· F4 行收正（:21）· §2.1#1 模板字面收正为推导 + manifest 覆盖（:46）· §2.1#3 补本仓 manifest 覆盖注记（:48-49，键名经读 `PROJECT-MANIFEST.json` :9/:13 核实）· §2.2 数据流图模板字面收正（:56）· §2.2 接口补覆盖注记（:64-65）· KD-M9-5 补指针（:95） |
| Q2 回填 | §2.3 受影响文件表：5 档模板行数收正 + 回填行（persona-eng-designer 65 · discipline-engineering 226 +75 · persona-engineering 48 +8 · persona-normal 23 +5 · persona-coder 19 +3，:76-80）+ 回填范围注记（模板领先 4 档不动，:83）· 新增 §2.6 回填引导步骤（实施前置——逐档 diff → 落地领先段回填 → 模板领先段保留 → sha256 全等后进入单向生成，:104-117）· §4 变更记录（:146） |
| Q3 清理 | §2.1#4 清理对象收正 = 模板（回填后）两处（discipline-engineering「方案选型对比」节 :76-101 + 回填的 A3⑤，:50-51）· AC-3 判据对齐「模板（回填后）两处 + 落地由生成同步」（:127）· T4/T6 对齐（:137/:139）· §4 变更记录（:146） |

**自检**：全档 147 行回读 ✓；行宽机检 >300 字符行 = 0（修 3 处后全绿）✓；三方条目一致（批次档 §1#3 = F4/AC-3 = 规格 AC-M9-3 链）✓。

**观察项（不阻断本批，待主 agent 裁）**：
1. `docs/core/design/prompts/persona-eng-designer.md` 模板 :49 设计档 8 项 item 1 现仍含「候选 ≥2 必须有对比表 / 单方案显式声明豁免」字面——Q3 裁定的两处不含此面；落地档为英文同义（comparison table / exemption）。若回填后模板该段仍为中文字面，AC-3 grep「候选 ≥2 / 对比表」会命中；且英文同义是语义面残留、中文 grep 判据捕捉不到——是否并入清理 / 收窄判据待裁。
2. 清理坐标 :76-101 为 as-of 行号——回填 +75 后漂移，实施轮以 diff 后实位为准。
3. spec `SPEC-PROMPT-PIPELINE.md` ②.4 清理措辞与 Q3 收正后的 F4/AC-3 有偏差——spec 未派改（纪律：不改 spec），是否回写待裁。
4. 本修正轮落在设计评审通过之后——重新评审 / 链终 token 处置归主 agent。

## §3 设计评审记录（评审子代理）

_（待写）_

### 轮次 1（评审子代理）

## M7–M10 模块设计评审（清理与机检族）

范围：M7 checklist 废除 / M8 机检引擎 / M9 提示词单向生成 / M10 测试纪律四份模块设计 + 对应四份 Function Spec + 架构 ENGINEERING-MODE-V2.md + 批次档。核对面：五要素齐备 ✓（问题陈述/方案与理由/受影响文件行数+增量/验收回指/变更记录）、AC 逐条回指规格 ✓、修正轮「方案选型对比」残留判据 4 档无匹配 ✓、行数标注 ✓（M9 481±60 带拆分计划 ✓；M8 合计 1568→850 算术 ✓）。

| # | 类别 | 级别 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 清晰度/需求覆盖 | 🟡 | M8 F5「D5 冻结窗口机检」（回指 ②.5）缺函数级落点与验收条目：§2.1#4 描述机制（读 activeBatch → 批次档被审文件集、比对评审在途状态），但 §2.3 新增 4 档函数清单无一承载它；§3.1 AC 表无冻结窗口判据（spec ④ AC-M8-1..6 亦无——上游缺口）；「评审在途状态」数据源契约（批次档状态行？M6 槽文件？）未指明；T5 期望「机检报 D5 违规」却无可实现函数。 | 在 §2.3 给 F5 指名实现点（如 doc-check.mjs 增 checkFreezeWindow(activeBatch, 被审文件集) 或并入 main），写明在途状态读取契约；补一条 AC（评审在途窗口内被审文档被写 → 机检红）；写明「拦截主责在 M4 门禁、M8 只做可检面」的分工。 |
| 2 | 验收 | 🟡 | M10 自相矛盾：AC-3（:190）与 T8（:204）要求全仓 grep `THINCODER_TEST_FULL\|THINCODER_SLOW_GATE_MS` 零匹配，但软清理表 doc-consistency.test.mjs :175 的 `THINCODER_TEST_FULL: "1"` 标注「可留可清」（:153）——留则 grep 必命中、AC-3 必红；且 AC-3/T8 未注明排除 docs/（设计档自身即含该字面）。 | 该行收正为「必清」（no-op env 属已废门，零匹配要求下不可留）；AC-3/T8 的 grep 范围注明「代码面，排除 docs/ 与批次档」。 |
| 3 | 清晰度/接口 | 🟡 | M9 F3「模板/落地路径读 docRoot」按现写法不可实现：架构 M1 schema 的 docRoot 只有 requirements/specs/design/modules/batches 五键（架构 :129-134、M1 六键 :64），无 prompts/落地键；落地目录 thincoder-core/prompts/ 是代码仓路径、不在 docs 体系内。§2.2 接口 TEMPLATE_DIR/LANDING_DIR（:62）称「由 DEFAULT_MIRROR_A/B 收正」却没说从哪个键取。 | 指明路径来源：docRoot.design/prompts 推导 + 落地键由 M1 schema 扩展（或固定推导规则），并把 schema 扩展回写架构 §2.3 与 M1 规格。 |
| 4 | 需求覆盖/验收 | 🟡 | M7 F7/AC-7「待办三态可由台账六态表达」判据「映射表可查」（:116）但设计档、规格档均无映射表本体（pending/in_progress/done → 六态哪三个未落一行）；spec ⑤ 标 M2 上游（六态承接）而架构依赖图标「M7 独立删除无依赖」（架构 :111）——AC-7 验收时序与映射表落点双悬空。 | 在 M7 设计补映射行（以 M2 六态为准，如 pending→待讨论/待设计、in_progress→在途、done→已核销）或显式指向 M2 设计档承载；AC-7 标注「依赖 M2 落地后验证」。 |
| 5 | 范围/协调 | 🟡 | M10 T9（:205）要求全仓 grep run-full/run-integration/run-fast/slow-gate 零匹配（仅排除本设计档+变更记录），而 §2.5（:179）把 ARCHITECTURE.md 等六档散在 test:full/test:integration 引用留作「后续一致性清扫」——若这些档含 run-* 字面（unverified，超出评审范围未读），T9 必红；TESTING.md 重写义务也悬在批外。 | T9 排除集写明「docs/ + 批次档」；或把文档引用清扫（TESTING.md 重写 + 六档悬空指针）列入本批必做项，不留自设用例与范围自相矛盾。 |
| 6 | 范围/协调 | 🟡 | M10 对规格 ①「lint + test:full + test:integration → 一条 test」取窄读（lint 不进砍单，KD-M10-6 :172）并自己登记「若本意连 lint 一起砍则属范围扩展」（:176）——范围悬置，spec ① 字面与本设计读法存在两解。 | lint 归属在派单前裁定落地：窄读则 spec ① 措辞收正为「三层测试门」；宽读则砍单/AC-M10-2 同步扩。 |
| 7 | 文档一致性/计数 | 🔵 | M7 声称「核 6 + VSC 4 + 删除 3 + 测试 5 = 18 档」（:100、:132），但 §2.3 表格实为 17 行（删除 3 + 核改 5 + VSC 4 + 测试 5）；「核 6」无法从表格还原。 | 计数与表格对齐，两处声明同步收正。 |
| 8 | 范围 | 🔵 | M7 新增 VSC src/agent/setup.mjs（449，±0 编排注记，:80）不在架构 M7 行/接线表（架构 :70、:93）也不在 spec ② 清单内——设计层扩展一档（纯注释面）。 | 在批次档登记该增量，或回写架构接线表 VSC 列。 |
| 9 | 行数标注 | 🔵 | M8 新档 doc-check-anchors.mjs +~300（:76）恰在 >300 咨询拆分层界线上，未声明「落点 ≤300」或拆分计划（对比 M9 对 481±60 的处理 :91）。 | 标注目标 ≤300 行，或按 R24a 预写拆分计划。 |
| 10 | 行数标注 | 🔵 | M7 触改的 >300 行档（subagent-scheduler 430 :75、VSC setup 449 :80、context-parity.test 365 :84、write-path.test 301 :83）无主动拆分审视注记；增量均 ≤0、无层界跨越——按规则 >300 → 主动拆分审视（咨询级）。 | 给这 4 档加一行「拆分审视：增量 ≤0、无跨越，本轮不动」注记即可。 |
| 11 | 方法纪律 | 🔵 | 批次档 §2 第 32 行残留 `_（待写）_` 占位（§2 其后已写内容）。 | 删占位行。 |
| 12 | 方法纪律 | 🔵 | M8 §2.1#1 锚判据同源点 = DOC-DISCIPLINE.md §4（:47）——该档未入本批评审范围，且 v2 归档退役 v1 老档时判据源会漂移，未登记迁移去向。 | 注明 DOC-DISCIPLINE.md §4 在 v2 的去向（保留/并入 discipline 提示词/重写）。 |
| 13 | 验收 | 🔵 | M7 AC-2/AC-4/AC-6（:111-115）grep 判据未注明排除 docs/——设计档自身含 checklistTool/pendingItems 等字面，按字面「全仓无匹配」自反不可满足；T7（:128）暗示代码面但 AC 表未写明。 | AC 表 grep 判据统一加「代码面（排除 docs/ 与批次档）」范围限定。 |
| 14 | 评审限制声明 | 🔵 | 无项目标准文档声明、无文档地图——Document ownership 判据降级为「对 Project Guide 落点 + 跨档矛盾核查」；AGENTS.md 指引的 docs/design/ 与实落 docs/core/design/ 的路径差异以模块权威源为准，未据以发发现。 | 后续评审提供项目标准文档与文档地图以恢复完整判据。 |

计数：🔴 0 · 🟡 6 · 🔵 8

VERDICT: pass

## §4 核验与裁决（主 agent）

**#53 打回裁定（2026-09-17）**：M7 架构前提为假——checklist 非死文件、VSC 非零改。实勘证据成立（主 agent 已 grep 复核）。

| # | 裁定 | 内容 |
|---|---|---|
| D1 | **收正** | M7 受影响文件 = 核 3（`tools/index.mjs` 挂载点 · `agent/setup.mjs` 注入 · `checklist.mjs`+`checklist-sync.mjs` 删）+ VSC 2（`src/tools/index.mjs` 挂载点 · `src/agent/context-injections.mjs` 注入）+ 死指针 2（`task.mjs:36` · `memory-tool.mjs:37`）+ 门禁 1（`subagent-scheduler.mjs:38,56`）+ 测试 5（核 3 + VSC 2）。架构设计 `:78`「死文件」/ `:93`「VSC 零改」/ `:70` 模块表 M7 行由 designer 修正轮收正 |
| D2 | **纯移除** | checklist 上下文注入不承接（台账可见面 = 查询命令 `/ledger`）；**行为变更显式登记**——agent 待办可见性改由主动查台账 |
| D3 | **删** | `checklist*` 前缀禁用族（`subagent-scheduler.mjs`）保护对象已废，随 M7 删 |

**#72（M10）交回裁定（2026-09-17）**：M10 本域 AC-1/2/3 ✅ 绿；AC-4（三包 `npm test` 全绿）被 129 处失败阻断——**根因 = 并行批中间态，非批外缺陷**：`normAbs` 缺 re-export ~94（#67 写 `write-gate.mjs` 未完成）· `scanGroups` 不存在 ~21（#68 重写 `ledger.mjs` 未完成）· tool-docs 24≠25（#69 M7 收尾未跑）· tui ENOENT + VSC 批外 ~13（待归因）。**AC-4 验收时序 = 全部实施批（#67/#68/#69/#70/#74）落地后统一跑三包 `npm test`**——现不可验，不属 M10 范围缺陷；剩余 ~13 处批外失败届时归因。

## §5 实施记录（eng-coder）

_（待写）_

**交付摘要（M8 机检引擎——本轮未完成交付）**：本轮为勘察与任务书核对段，turn 预算触顶时**尚未落地任何 M8 产物**——四档新引擎 0 写入、八档 legacy 0 删除、接线 0 改动。已完成的部分仅为勘察：M8 模块设计 §2.3 四档落点确认（`doc-check.mjs` / `doc-check-anchors.mjs` / `doc-check-width.mjs` / `doc-check-targets.mjs`）；M8 spec AC-M8-1..7；批次档 §4 裁定 ①（spec 收窄——冻结窗口无哈希快照，机检红腿 = D5 评审在途窗口 AC-7）；legacy 八档与消费者图谱（`doc-impact.mjs` 消费 `extractAnchors`+`V5_SCAN_DIRS`；`reconcile-lookup.mjs` 消费 `collectDocStems`+`extractTokens`；CI `test.yml` :55-57 三脚本；VSC `package.json` `doc:check` 待核）。

**AC 状态（全部未完成）**：AC-M8-1（单引擎）❌ · AC-M8-2（声明面生效）❌ · AC-M8-3（无硬编码 docs/）❌ · AC-M8-4（check-ledger 作废）❌ · AC-M8-5（跑红绿）❌ · AC-M8-6（判据项计数）❌ · AC-M8-7（冻结窗口可检面）❌。

**决策透明表**：无评审发现（未进入审计 / 评审）。

**审计与代码评审轮次**：0 轮——无交付产物。**终态：未交付（not delivered）**，非 clean。

**修正轮**：0 轮。

**遗留清单（父侧另派收尾）**：
1. 四档新引擎未写：`scripts/doc-check.mjs`（main + formatReport + checkFreezeWindow）/ `doc-check-anchors.mjs`（单锚引擎）/ `doc-check-width.mjs`（行宽 + 共享谓词）/ `doc-check-targets.mjs`（采集面）。
2. 八档 legacy 未删：`scripts/{doc-anchors,doc-anchors-v5,doc-anchors-core,doc-anchors-targets,check-doc-width,check-doc-width-core,check-ledger,check-ledger-core}.mjs`。
3. 接线未动：`doc-impact.mjs` / `reconcile-lookup.mjs` / CI `test.yml` :55-57 / VSC `package.json` `doc:check` / 六测试档。
4. 冻结窗口实现方式已按父侧 anchor 定：状态行「评审在途」+ 被审文件写入检测（零哈希 / 零快照）；设计 §2.2:77「内容哈希基线」句与 §4 裁定 ① 矛盾——**待 designer 修正轮收正**，本段不代写。
5. `PROJECT-MANIFEST.json` 缺档（首跑前须建）+ `DEFAULT_MANIFEST.docRoot.design` = `docs/design` vs 实树 `docs/core/design` 权威冲突待裁定。

**验证**：本轮未改任何文件；对既有 dirty tree（M7/前批 17 档 + M1 未跟踪 2 档）跑 `node --check` 全部通过（exit 0）——仓库语法面无破坏。

**交付摘要（M9 提示词单向生成——本轮未落地，停止于勘察/任务书核对）**：本轮为勘察段，**未落地任何 M9 产物**——`scripts/mirror-divergence.mjs` 0 写入、两模板残留 0 清理、落地档 0 生成。勘察撞到 3 个阻断性设计缺口（需父侧/用户裁定），按「实现命中设计缺口 → 停下打回」停止，未自行补造方向。

**阻断缺口（→ 打回主 agent，需裁定）**：

1. **模板路径推导断裂**（spec ②.3 + 设计 F3/§2.1.3/§2.2）：模板 = `docRoot.design` + `/prompts` 推导，但 `DEFAULT_MANIFEST.docRoot.design = "docs/design"`（`thincoder-core/manifest.mjs:35`）→ 推导得 `docs/design/prompts`（**不存在**）；实模板在 `docs/core/design/prompts/`。spec ②.2 字面又写 `docs/core/design/prompts/`——spec 自相矛盾。此冲突 = 本批 §5 遗留 #5「`docRoot.design` vs 实树 `docs/core/design` 权威冲突待裁定」——**仍未裁定**，而 M9 单向生成依赖该路径正确（无 PROJECT-MANIFEST.json 覆盖，已 glob 确认）。
2. **单向生成会回归运行时提示词**：逐字节比对 15 对模板↔落地 **0/15 一致、全 DIFF、双向漂移**——`discipline-engineering.md` 落地 301 行 vs 模板 226（落地领先 +75，含模板缺失的现行规则：零裁量 锚#1 / 推进档位收口 C4 / 设计行为纪律四维 A1-A4 / 交付链收口 / Multi-Task Parallelism / 指令注入段）；`persona-engineering.md` +8、`persona-normal.md` +5、`persona-coder.md` +3 落地领先；`advisor-design.md`/`advisor-round1.md` 模板领先 +29、`advisor-round2` +15、`advisor-round3` +16。设计 §1.1 假设「模板=权威源完整」，但模板实际**落后**于落地——直接跑生成会覆盖落地、**丢弃现行规则**。设计无「先把落地现行内容回填模板」的引导步骤。
3. **清理落点指错档**：spec ②.4 + 设计 F4 称清 `discipline-engineering.md`「A3⑤ 方案对比已做」，但该文本**只在落地档**（`thincoder-core/prompts/`，设计明令禁手改）；模板残留实为「方案选型对比」节（:76-101：候选 ≥2 @:86/:95、对比表 @:87/:94、单方案豁免 @:101）。清理目标与 AC-M9-3 grep 判据指向不同文本，且依赖缺口 2 的模板↔落地关系裁决。

**AC 状态（全部未完成）**：AC-M9-1 ❌ · AC-M9-2 ❌ · AC-M9-3 ❌ · AC-M9-4 ❌。

**决策透明表**：无评审发现（未进入审计/评审）。

**审计与代码评审轮次**：0 轮。**终态：未交付（not delivered）**——停止于勘察，非 clean。

**修正轮**：0 轮。

**验证**：本轮零写入、全只读；未跑 `node --check`（无产物）。

### 交付摘要（eng-coder）

**终态：stalled（AC-4 被批外缺陷阻断；AC-1/2/3 全绿）**

**AC 逐条**
- AC-1（runner 形态 ×3 + slow.mjs 纯别名 ×3 + package.json 单一 test ×3）：✅ 全绿，结构机检通过。
- AC-2（`run-full|run-integration|run-fast|slow-gate` 子串 = 代码面 0 + 19 档删除物消失）：✅ 全绿。
- AC-3（`THINCODER_TEST_FULL` / `opts.skip` 慢门 = 0）：✅ 全绿。
- AC-4（三包 `npm test` exit 0）：❌ 阻断——129 处失败全部为批外既有缺陷，无一属 M10。

**三包实测（本次会话重跑，取代交接数字——交接「core 263/260/3」已过期）**
| 包 | tests/pass/fail | 根因 |
|---|---|---|
| core | 220/205/15 | 14 × normAbs + 1 × tool-docs 24≠25 |
| cli | 382/323/59 | ~39 × normAbs + 15 × scanGroups + ~1 × tui ENOENT |
| vscode | 518/463/55 | ~41 × normAbs + 6 × scanGroups + ~8 × 批外断言 |

**交接纠偏**：交接记的「core 家族矩阵/固定段序 = 内容漂移」有误——二者实为 `normAbs` 级联（`assembleFamilyTools`→`advisor.mjs:14`→`write-gate.mjs` 缺 export）。core 唯一非 normAbs 失败 = `tool docs: 24≠25`（`core-prompt-face.test.mjs:22`）。

**决策透明表**
| # | 决策 | 依据 |
|---|---|---|
| 1 | normAbs 不修（1 行 re-export） | 属 M6/第33批 §17.5「normAbs 本体迁 review-streak.mjs」未完成迁移；`write-gate.mjs` 非 M10 文件域 |
| 2 | scanGroups 不修（~21 处 stale import） | 属 LEDGER-SURFACE 批（canonical 迁 `thincoder-cli/src/ledger.mjs`） |
| 3 | tool-docs 24≠25 不修 | 内容漂移，需判定缺失哪个 tool doc（设计决策） |
| 4 | 散文残留（快层/慢层/test:full 注释）不软清 | 设计软清范围恰 7 档；其余显式历史豁免/另批 |

**审计与代码评审轮次与终态**
- 内部 explore divergence 审计：未跑（本批无实现偏差可审——AC-1/2/3 结构机检绿；AC-4 为批外阻断，无 scope 内 self-fix 可做）。
- 内部 advisor 代码评审：未跑（同上——评审 M10 自身改动无法解除批外阻断）。
- 修正轮：0 轮。
- 终态：stalled。

**批外缺陷清单（父侧另批处置，非 M10）**
1. `normAbs` 缺 re-export——`thincoder-core/agent/write-gate.mjs:25` import 了 `normAbs`（来自 `agent-tools/advisor-settle.mjs`）但未 re-export；`agent-tools/advisor.mjs:14` 反 import → 三包共 ~94 处 import-time SyntaxError。修复 = 1 行 `export { normAbs } from "../agent-tools/advisor-settle.mjs"`。
2. `scanGroups is not a function`——canonical 在 `thincoder-cli/src/ledger.mjs`；stale 测试仍 import 旧符号（LEDGER-SURFACE 批）。
3. `tool docs: 24 ≠ 25`——core `tool-docs/` 少一个 .md，内容漂移需判定缺失档。
4. `tui-stderr` ENOENT——TUI fixture 缺 crash-reports 目录。
5. VSCode 批外断言（batch_segment 消息/清账收口/段首帧）——非 M10，待归因。

### 交付摘要
- 单引擎四档落地（node --check = SYNTAX-OK-4）：`scripts/doc-check.mjs`（导出 main/formatReport/checkFreezeWindow/reviewedFilesFromBatch）、`scripts/doc-check-anchors.mjs`（checkAnchors/extractAnchors/scanDocAnchors）、`scripts/doc-check-width.mjs`（scanDomain/checkDocWidths/isTableRow/isExecutableLine/inCodeSpan/discoverDomains）、`scripts/doc-check-targets.mjs`（collectSourceDomain/collectCaseTitles/collectCodeTokens）。
- 声明驱动：`readManifest(cwd)` 读 PROJECT-MANIFEST.json（fail-closed，整档缺失拒——夹具实测过拒）；checkConfig/docRoot 驱动，无硬编码路径；D3 判据计数 = checkConfig 键数（运行输出「判据项 5 项」）。
- 旧 8 档已删（git 状态 D × 8）：doc-anchors.mjs / doc-anchors-v5.mjs / doc-anchors-core.mjs / doc-anchors-targets.mjs / check-doc-width.mjs / check-doc-width-core.mjs / check-ledger.mjs / check-ledger-core.mjs。
- freeze-window：红 iff 批次档 §1 含「评审在途」且被审文档 mtime 写入；parent-anchor = 零哈希/mtime 豁免。

### 红绿样例（实际运行记录）
- 红（真实仓）：`node scripts/doc-check.mjs` → 机检·锚 扫描域 docs · 150 档；候选 17237 · 悬空 817（用例号 23 / 路径·坐标 575 / 符号·窄 219；符号·宽 500 属报告面不入闸）；行宽 3 行超 300 字符；FAIL(锚) + FAIL(行宽)；exit 1。
- 绿（夹具 `.thincoder/tmp/m8-green-fixture/`）：候选 0 · 悬空 0；OK(锚) + OK(行宽)；exit 0。
- manifest 缺失路径：整档缺失/activeBatch 指针不可解析均实测拒（fail-closed 生效）。

### 决策透明表（超声明改动）
- 旧 8 档删除 = 设计锚（单引擎替代）——已在册，无静默超范围。
- 夹具档（.thincoder/tmp/m8-green-fixture/ 下 3 个档）= 绿样例证明物，属 tmp 目录，待父侧统一清理。
- 无其它 out-of-list 改动。

### 审计与代码评审轮次与终态
- 内部 explore 分歧审计：0 轮（未跑）。内部 advisor 代码评审：0 轮（未跑）。
- 终态：按父侧「立即收尾」指令直收尾——本端不声明 clean：锚判定集与旧 V5 基线不等（旧根域基线 0 悬空 vs 新引擎 817）已登记遗留（见下），交由父侧裁决。
- 修正轮：0 轮（本会话未派）。

### 遗留项（父侧后续裁决）
1. 817 悬空分类未完成（V5-A / V5-C-narrow / V5-B 三分未做，unverified）——判定集收敛核对搁置。
2. 行宽 3 处超 300 字符：docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-LEDGER.md:101、:188（367/363 字符）；docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md:134（324 字符）。
3. 下游未动（父侧后续）：.github/workflows/test.yml docs job 改指 doc-check.mjs、thincoder-vscode/package.json、scripts/reconcile-lookup.mjs、VSC/CLI doc-anchors.test.mjs / doc-consistency.test.mjs、readManifest 单测补、.thincoder/tmp 清理。
4. 批次档 §2 AC-M8 计数 1..6 → 1..7（D3）——待父侧修。

**eng-coder 交付（M7 收尾轮 · 2026-09-17）**

### 交付摘要
- 前轮（#66）落地的 17 档改动逐档对设计 §2.3 编辑点核验——**全符合，无夹带简化/扩面**。
- **补漏 1 档**（出清单改动）：`thincoder-core/test/core-prompt-face.test.mjs` 计数断言 25→24（三处：头注 T-C8「15+25」→「15+24」、用例名、断言值）。理由：M7 删 `tool-docs/checklist.md` 后实存 24 档，该档断言 25 必红；KD-M7-1 的 D3 计数纪律（计数断言漂移必须同改）同样适用于此档——设计 §2.3 清单漏列（已在评审表 #1 上报，需 eng-designer 补登记）。
- **AC-M7-1..7 机检全绿**：删除 3 档 glob 零匹配；代码面 `checklistTool|pendingItems|pushChecklist` 零匹配（命中仅 docs/ 与批次档，按规格排除）；两工具表无 checklistTool；两注入面零匹配；subagent-scheduler 无 checklist 前缀判断分支；`task.mjs:36` 与 `memory-tool.mjs:37` 均改指 `/ledger`；三态→六态映射表在设计 AC-7 可查（验证随 M2，已声明）；thincoder-cli 代码面零引用（「CLI 零改」成立）。
- **测试读数**（node --test）：核 4 档（prompt-files / tool-registry / write-path / core-prompt-face）= 31/31 绿；VSC 2 档（context-parity / tool-descriptions）= 16/16 绿；补强 2 档（核 prompt-injections 7/7 · VSC prompts-async-guidance 19/19）绿。`node --check` 15 档全过。测试面全仓无第二处 checklist 硬编码计数断言。

### 决策透明表（出清单/边界改动）
| 改动 | 是否出清单 | 理由 | 处置 |
|---|---|---|---|
| core-prompt-face.test.mjs 25→24 | 是（设计 §2.3 漏列） | M7 删除致计数断言漂移；KD-M7-1 计数纪律 | 已改并上报（评审 #1：设计档补登记由父侧派修正轮） |
| 提示词落地档 + 模板层 5 处 checklist 指令残留（discipline-engineering.md:6/32/79、discipline-normal.md:15/112——核包 prompts/ 落地层同形） | 未改（出范围） | 设计 §2.5 死指针清单只枚举 task.mjs/memory-tool.mjs；落地档 = M9 生成物（禁手改）；模板层 = M9 管线面 | **上报父侧裁定**：扩 M7 范围走 M9 管线 or 路由 M9 批——落地后工程模式 agent 会被指令使用已删工具（🔴） |
| spawn-gates.mjs PROCESS_BASENAMES 仍含 checklist.md/checklist-done.md | 未改（M5 档） | M5 F6 迁入面；与 KD-M7-3「保护对象已废、前缀禁用族整体删」在合并态下矛盾 | **上报父侧裁决 M5/M7 边界**（M5 删族 or M7 设计收编） |
| 文档存量债（VSC/CLI 各持有设计档 + AGENTS.md/README 仍描述 checklist 工具） | 未改 | AC-M7-2 显式排除 docs/；设计接受的存量债 | 父侧路由到持有模块或 v1 归档口径 |

### 审计与代码评审轮次与终态
- **explore 分歧审计**（1 轮）：终态 = **档级 clean**（17 档编辑点全落地、无出清单改动、AC 机检全绿）；边界 = 🔴 一条（提示词死指针清单不完整，见上表）+ 🟡 spawn-gates 残余 + 🔵 文档存量债——三者均不改变档级交付忠实于设计。
- **advisor 代码评审**（1 轮）：终态 = **VERDICT: pass**（无 🔴、无 must-fix 🟡）。🟡 非阻 1 条（设计档 §2.3 漏列补漏档 + §4「17 档 = 18 档」自相矛盾注——doc-state，父侧补登记）；🔵 注释卫生 1 条（tool-descriptions.test.mjs 头注「25 档」历史句）。宿主对 memory-tool.mjs:37 的引用校验伪影已由直接读档消解。
- **fix round**：1 轮（core-prompt-face.test.mjs 补漏），无第二轮。
- **终态**：clean（档级交付）；上述 🔴/🟡 边界项为设计范围缺口，待父侧裁定，不阻塞本批 M7 验收面。

## §6 验证与收口（父代理）

### M7 收口（2026-09-17）

**父侧验证**：AC-M7-1..7 机检全绿（#69 读数：删除 3 档 glob 零匹配 · 代码面 `checklistTool|pendingItems|pushChecklist` 零匹配 · 两工具表两注入面净 · 无前缀分支 · `task.mjs:36`/`memory-tool.mjs:37` 改指 `/ledger` · CLI 零改成立）；测试 31/31 + 16/16 + 7/7 + 19/19 绿；内部审计 1 轮档级 clean + advisor 评审 1 轮 VERDICT pass + fix 1 轮。

**逐条验收**：M7 五条需求全 Done（核验 17 档符合设计 / AC-M7-1..7 / 补漏计数 25→24 / 测试不破 / §5 自写）。

**边界发现处置**：
- 🔴 **提示词死指针**（`discipline-engineering.md:6/32/79` + `discipline-normal.md:15/112` 仍指令 agent 用已删 checklist 工具——落地档 = M9 生成物禁手改）→ 台账第 9 条，路由 M9 管线（改模板 → 生成同步），修法 = checklist 指令 → `/ledger` 或删。
- 🟡 **M5/M7 边界**（`spawn-gates.mjs:72,75` PROCESS_BASENAMES 仍含 checklist 档名，与 KD-M7-3 前缀禁用族整体删矛盾）→ 统一盘点裁（台账第 6 条）。
- 🟡 **doc-state**（设计档 §2.3 漏列补漏档 + §4「17 档=18 档」自相矛盾）→ designer 修正轮（并入统一盘点）。
- 🔵 **存量债**（AGENTS.md/README 仍描述 checklist 工具 + tool-descriptions 头注「25 档」——AC-M7-2 显式排除 docs/）→ 文档债批（台账第 8 条）。

**台账核销**：M7（checklist 废除）落地核销。

**遗留**：M8 收口（AC-6/7 补验 + 评审）待统一盘点；M3–M6 半成品待盘点拆批（台账第 6 条）。
