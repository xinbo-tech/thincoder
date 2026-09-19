# 批：2026-09-18 · VSC 大档结构拆分（四档）

> 状态行：🔄 进行中（设计轮 · eng-designer）
> 批次边界：交付目标 = 「**VSC 四档结构拆分（保对外缝）**」；条目源 = 台账技术待办「四档拆分规划（触发=条件：净增 >490 或下次触碰）」——**条件已触发**（`panel-messages.mjs` = 487 行，逼近 500 硬限；且本晚多批持续在其上增行）。
> 前情 = `docs/vsc/requirements/PROJECT.md` §6 **N-P3**（产品树任一档 ≤500 行；超 ⇒ 结构拆分并保持对外缝）+ §5 越档面指针（单源 `docs/vsc/design/VSC-DEBT.md`）。

## §1 批次任务（父侧）
**状态行**：🔄 进行中（设计轮 · eng-designer）——机读位（`BATCH-RECORD.md` §4.9：解析对象 = §1 段内 `**状态行**：` 前缀行）；档头行（`:3`）保留其值同源副本，本行由 eng-designer 于设计轮补足（原缺口 = 档头行在 `## §1` 段外 ⇒ 工具判「状态行不可解析」而拒写 §2；值逐字未改；先例 = `docs/batches/2026-09-18-vsc-key-delete-confirm.md:8`；见报告上抛项）。

### 1.1 目标与理由

N-P3 硬限 500 行；`panel-messages.mjs` 在本晚三批实现后已达 **487**（净增仍在继续）⇒ 下一次触碰即可能越线。同时 `panel-chat.mjs` / `panel-callbacks.mjs` / `panel-session.mjs` 同族大档并存 ⇒ 一次做完**四档拆分**，避免逐档零敲碎打。用户 2026-09-18 22:22「别等明天了，能做的今天就做」⇒ 本批。

### 1.2 本批覆盖的条目

| # | 需求 | 本批交付 |
|---|---|---|
| ① | **N-P3 拆分（四档）** | `thincoder-vscode/src/extension/` 下 `panel-messages.mjs`(487) · `panel-chat.mjs`(426) · `panel-callbacks.mjs` · `panel-session.mjs`(356) 按**职责**拆出子模块，**对外缝保持**（既有导出名 / 调用点零改）；拆分后各档 ≤300（建议线） |

### 1.3 本批不做

- 不改**任何行为**（纯结构搬移 + 导出面重排 ⇒ 零语义变更；用例全绿是本批的硬判据）。
- 不动 `panel-chat.mjs`（500 行整 · 零触碰）**如设计判其不可拆**——须给判据。
- 不改协议 / 不新增消息类型 / 不改判据。

### 1.4 边界

- 写域 = `thincoder-vscode/src/extension/panel-{messages,chat,callbacks,session}.mjs` + 新拆出子模块 + 受影响测试档（`test/files.mjs` 登记）+ `docs/vsc/design/VSC-DEBT.md`（越档面记录单源）+ `docs/vsc/requirements/PROJECT.md` §5/§6 读数同步。
- 需求档 = 父侧笔。

### 1.5 验收口径

1. **零语义**：`thincoder-vscode` `npm test` **全绿**（基线 = 本晚 661+ 计数，逐条不降）；**对外缝零改**（既有导出名 / 调用点 `grep` 逐条核）。
2. **行数**：四档（及拆出子模块）逐档 `wc -l` 读数入表；主档 ≤300。
3. `doc-check` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

### 2.1 本批覆盖的条目

| # | 条目（承 §1.2） | 设计落点 | 交付形态 |
|---|---|---|---|
| ① | **N-P3 四档拆分（保对外缝）** | `docs/vsc/design/VSC-DEBT.md` **§12**（本设计轮建档 · 越档面单源） | 四主档 → **六新档**（纯结构搬移 · 零语义 · 既有导出名/调用点零改） |

需求侧回指 = `docs/vsc/requirements/PROJECT.md` §6 **N-P3**（产品树任一档 ≤500；越档 ⇒ 结构拆分并保持对外缝）。

### 2.2 方案摘要（详见设计档 §12.2）

读数口径 = `wc -l`（= 换行符数）；**本刻实测 as-of 2026-09-18 22:3x**——父侧给值以实测为准（逐档复测已在案）。

| 档 | 父侧给 | 实测 | 拆出子模块（新档 · 预估行数） | 主档拆后 |
|---|---|---|---|---|
| `panel-chat.mjs` | 426 | **499** | `panel-turn-loop.mjs` ≈157（回合执行循环 + controller 工厂）· `panel-turn-stages.mjs` ≈154（provider/模型解析 · 收尾落盘 · 挂起接管） | ≈240 |
| `panel-messages.mjs` | 487 | **487** | `panel-messages-settings.mjs` ≈160（设置/provider/guard/MCP 族 28 case）· `panel-messages-turn.mjs` ≈189（回合交互族 10 case） | ≈245 |
| `panel-callbacks.mjs` | 未测 | **385** | `panel-subagent-relay.mjs` ≈158（relay 中继面 + 投递队列） | ≈255 |
| `panel-session.mjs` | 356 | **355** | `panel-session-write.mjs` ≈122（槽写装配面 + 标题写面） | ≈259 |

十档预计**全部 ≤300**（最大 ≈259）⇒ 无需二次拆分规划；零档越 500 硬限。

**缝保持方式（唯一）= re-export 转口**（承 KD-6/KD-12）：迁出段的既有导出名零改，主档 `export { … } from "./新档.mjs"`；消费点（30+ 处 · 设计档 §12.3 逐条）**零改**。
**分发表骨架 + 全部 case 标签留主档**（转发行形式）——case 标签集合零变化，协议对表机检的提取集不动。

### 2.3 硬约束（实测 · 实施与评审须逐条遵守）

| # | 约束 | 证据（实测） |
|---|---|---|
| C-1 | `panel-chat.mjs` 入口守卫段（`ensurePanelAgent(panel, turnSlot)` + 紧随的 `ensureMemoryHandle()`）**不得迁出**——两行须同档同址 | `thincoder-vscode/test/engine-floor-guard.test.mjs:152-154` 直读本档源文本断言（迁出 ⇒ 既有结构机检红） |
| C-2 | 消息两新档名**必须以 `panel-messages` 前缀** | `thincoder-vscode/test/protocol-coverage-reverse.test.mjs:33` `HOST_DISPATCH = "panel-messages"`（其他前缀 ⇒ case 标签逸出扫描域 ⇒ 机检红） |
| C-3 | `panel-subagent-relay.mjs` 须补登 **RELAYS 一行**（`postSubagentEvent` 定义体含裸标识符 `postMessage(payload)`） | `thincoder-vscode/test/protocol-coverage.test.mjs:31-35`/`:177-181` fail-closed 断言（未登记 ⇒ 红并点名） |
| C-4 | 收尾 `finally` 体（311-350）迁出 = 本批最敏感搬移 ⇒ 逐字搬迁 + 捕获变量参数化 + 单独 diff 审查 | 设计档 §12.5 第 4 步附加纪律（异常传播语义等价） |

### 2.4 实施次序（设计档 §12.5 · 由叶到根）

1. `panel-session.mjs` → `panel-session-write.mjs`
2. `panel-callbacks.mjs` → `panel-subagent-relay.mjs`（+ RELAYS 一行）
3. `panel-messages.mjs` → `panel-messages-settings.mjs` + `panel-messages-turn.mjs`
4. `panel-chat.mjs` → `panel-turn-loop.mjs` + `panel-turn-stages.mjs`（最敏感 · 最后）

每步门禁 = `npm test` + `npm run lint`；第 4 步后补协议两机检 + `doc-check`。环 import 4 处（判据 = 顶层只 import 绑定、零跨环读取——B2 先例）。

### 2.5 受影响文件表（同设计档 §12.6 · 口径 `wc -l` · as-of 2026-09-18 实测）

| 文件 | 现读数 | 预估拆后 | 性质 |
|---|---|---|---|
| `thincoder-vscode/src/extension/panel-chat.mjs` | 499 | ≈240 | 改（拆分） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 487 | ≈245 | 改（拆分） |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | 385 | ≈255 | 改（拆分） |
| `thincoder-vscode/src/extension/panel-session.mjs` | 355 | ≈259 | 改（拆分） |
| `panel-turn-loop.mjs` / `panel-turn-stages.mjs` / `panel-messages-settings.mjs` / `panel-messages-turn.mjs` / `panel-subagent-relay.mjs` / `panel-session-write.mjs`（均在 `thincoder-vscode/src/extension/` · 拟新增） | 0 | ≈157 / ≈154 / ≈160 / ≈189 / ≈158 / ≈122 | 新（六档） |
| `thincoder-vscode/test/protocol-coverage.test.mjs` | 385 | +1（RELAYS 登记） | 改（机检登记） |
| `docs/vsc/design/VSC-DEBT.md` | 253 | +≈190（§12 节） | 改（设计落点） |

`test/files.mjs` **零改**（本批不新增测试档）；`chat-panel.mjs` 与全部 30+ 消费档**零改**（re-export 保缝）。

### 2.6 验收标准（同设计档 §12.8 · 逐条可机判）

| # | 验收标准 | 机判命令 |
|---|---|---|
| A10 | 四主档 + 六新档 `wc -l` ≤500，四主档 ≤300 | 设计档 §12.4 第 4 条读数命令（十档逐行） |
| A11 | 对外缝零改（§12.3 逐条） | `grep -rn "panel-\(messages\|chat\|callbacks\|session\)\.mjs" thincoder-vscode/src thincoder-vscode/test` ⇒ 既有 import 行逐字不变 |
| A12 | 零语义：全绿、计数不降（基线 = 本晚 661+） | `cd thincoder-vscode && npm test` ⇒ exit 0 |
| A13 | 协议两机检绿 | `node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` |
| A14 | `doc-check` 零新增 | `node scripts/doc-check.mjs --root .` ⇒ 悬空 ≤5 / 行宽 ≤11（**设计轮实测基线 = 恰好 5 / 11**，写入后复跑仍 5 / 11） |
| A15 | 行数读数逐档留档 | 实施轮读数表（批次档 §5） |

### 2.7 上抛项（写域外 · 待父侧裁）

1. **`PROJECT.md` §5 / §6 读数同步**（父侧笔）——建议 §5 补本批实测读数行（设计档 §12.1 表）。
2. **`thincoder-vscode/AGENTS.md:53`** 模块地图行（六新档名）是否本批同步——该档 = 产品文本面，不在本批写域。
3. **`docs/vsc/design/WEBVIEW-PROTOCOL.md` §12/§13** 表内 host 发射点坐标将随搬移漂移（表由 `protocol-coverage.test.mjs --emit` 执行时读数产出）——是否本批 `--emit` 复跑刷新。
4. **本档 §1 机读位状态行**：由 eng-designer 于设计轮补足（原缺口 = 档头行在 `## §1` 段外 + 缺 `**` 前缀 ⇒ `batch_segment` 判「状态行不可解析」拒写 §2；值逐字承档头行未改；先例 = `2026-09-18-vsc-key-delete-confirm.md:8`）——请父侧知情/确认。

### 2.8 发现项（报告，未自修）

- **F-1**：父侧给 `panel-chat.mjs` 读数 426 与实测 **499** 不符（差 73 · 疑与 `chat-panel.mjs` 425 混淆）——该档为四档中**唯一贴线者**（距 500 硬限 **1 行**）。
- **F-2**：范围外三越档并存（`chat-panel.mjs` 425 · `suspension.mjs` 397 · `settings.mjs` 384）——本批不动，登记于设计档 §12.1。

### 2.9 评审轮 1 修正轮（8 项逐条 · 2026-09-18 · eng-designer）

> 依据 = 本档 §3 轮次 1（🔴 1 · 🟡 3 · 🔵 4；VERDICT: changes-required）+ 父侧裁（逐条接受；处置执行 = eng-designer）。
> 落点 = `docs/vsc/design/VSC-DEBT.md`；本节只记本批侧变更与**收正后的口径**——§2.3 / §2.5 / §2.6 的旧行按 append-only 纪律不回首改（口径以本节为准）。

| # | 发现 | 落点（设计档） |
|---|---|---|
| 1 | 🔴 1-hop 解析面断裂 | §12.2.3 **R-1–R-6**：持 RELAYS 行的档 = `panel-subagent-relay.mjs`（拟新增）· 该档裸标识符位唯二 · **字面量构造面必须同档**（`relaySubagentEventToken.emit` + 两转口 `postSubagentStatus` / `postSubagentApproval`）· 原 `panel-callbacks.mjs` RELAYS 行判「死登记」删除 · 机判四条 —— + §12.8 A13 判据句覆盖该面 + KD-17 |
| 2 | 🟡 两段缺搬运契约 | §12.2.1「搬运契约 · 段 A / 段 B」：段 A = `{done}` 判别式 + `if (stage.done) return` **留在 try（`:154`）内** + 回传 4 项（`providerName` / `p` / `slotStamp` / `slotData`）+ 入参 5 项 + 单次读槽；段 B = 入参 7 项（含 `distillSlot`——finally 段清单无此项）+ 注入项 + 机判 grep |
| 3 | 🟡 「无环」断言不成立 | `runPanelChat` = **注入项**（`deps.runChat`；机判 = 新档零 `from "./panel-chat.mjs"`）⇒ `panel-chat → panel-turn-stages` 仍单向；环清单**维持 4 处**（不新增）+ KD-18 |
| 4 | 🟡 本档读数 / 超档检查 | §12.6 本档行读数收正（**252 → 483 → 547** `wc -l`；原记 253 +≈190 失真）+ 超档检查射程收正（**文档档不适用行数规则**——用户 2026-09-16 裁定 + `docs/core/design/DOC-DISCIPLINE.md` §3.7）+ 批 7 义务句（`:168`）删除 + KD-19 |
| 5 | 🔵 `newTurnController` 调用点计数 | §12.3 行改 **4**（`panel-chat.mjs:283` 留档 + `:436` / `:445` / `:462` 随 `runTurnLoop` 迁出） |
| 6 | 🔵 留档导出名计数 | §12.3 行改 **13** 名（15 导出 − 迁出 2） |
| 7 | 🔵 机检档读数 | §12.6 行改 **384**（`wc -l`；原记 385 = split 式含末行空段） |
| 8 | 🔵 T-14 ∕ A10 不一致 | §12.9 T-14 按 A10 收正（十档 ≤500 · 四主档 ≤300） |

**§2 旧行口径收正（本节登记 · 不回改）**

- §2.3 **C-3** 扩展：新档补登 RELAYS 一行**且**新档须含字面量构造面（§12.2.3 R-1–R-4）；原 `panel-callbacks.mjs` 行**删除**（R-5）——原 C-3 只写「补登一行」。
- §2.4 第 2 步门禁不变；环清单 4 处不变（注入项消解 `panel-chat ⇄ panel-turn-stages` 环）。
- §2.5 表两处口径收正：`test/protocol-coverage.test.mjs` = **384**（RELAYS 换位净 0）· `docs/vsc/design/VSC-DEBT.md` 行 = **文档档**（读数仅作过程记录，无拆分 / 标注义务）。
- §2.6 **A13** 射程扩展 = 协议两机检绿 + 1-hop 解析面四条（§12.2.3 R-6）。

**待裁项（写域外 · 同规则面残留）**：文档行数规则旧口径残留——设计档 `:34`（KD-2 候选评估栏读数 ∕ 义务句）与 §4 受影响文件表五处**文档行**读数；本轮只收正 #4 点名的规则源句（`:168`）与 §12.6 本档行，其余登记待父侧裁。

### 2.10 交付门禁读数（本轮交付时点 · 2026-09-18 22:4x）

| 门 | 命令 | 读数 | 判 |
|---|---|---|---|
| 锚 + 行宽 | `node scripts/doc-check.mjs --root .`（cwd = `thincoder/`） | 悬空 **5**（逐条同位 = 批前基线：`docs/core/**` 五条）· 行宽 **13**（批前 11；**增量 2 行在他席在途档** `docs/vsc/design/WEBVIEW.md:105` / `:118`——同刻 mtime 22:42） | 本档（`docs/vsc/design/VSC-DEBT.md`）**零新增**（非表格行最长 282 字符 · 零新增悬空） |
| 协议机检（搬移前基线） | `cd thincoder-vscode && node --test test/protocol-coverage.test.mjs` | **4 pass / 0 fail**（exit 0） | 基线绿——A13「搬移后仍绿」由实施轮核（判据 = 设计档 §12.2.3 R-6） |

本档读数：`docs/vsc/design/VSC-DEBT.md` = **547** 行（`wc -l`；设计轮 483 + 本修正轮 +64）。

### 2.11 评审轮 2 修正轮（3 项逐条 · 2026-09-18 · eng-designer）

> 依据 = 本档 §3 轮次 2（🟡 3 · 🔵 5 · VERDICT: pass）+ 父侧裁（三条 🟡 必修方可进实现轮；🔵 5 条「登记不改」）。
> 落点 = `docs/vsc/design/VSC-DEBT.md`；本节只记本批侧变更与**收正后的口径**——§2.6 A14 旧行按 append-only 纪律不回首改（口径以本节为准 · 同 §2.9 先例）。

| # | 发现（严重级） | 处置 · 落点（设计档 `file:line`） | 读数（本刻实测） |
|---|---|---|---|
| 1 | 🟡 RELAYS 新行带 `thincoder-vscode/` 前缀——精确等值查找 ⇒ 零匹配 ⇒ `:178` fail-closed 红 ⇒ A13 红 | §12.2.3 **R-1**（`VSC-DEBT.md:344`）：行字面改与既有两行**逐字同形** `{ file: "src/extension/panel-subagent-relay.mjs", fn: "postSubagentEvent" }`（去前缀 ∕ 去「（拟新增）」注记）+ 依据句（`protocol-coverage.test.mjs:177` ∕ 同档 `:91` ∕ 先例 `:33-34`） | `grep "file: \"src/extension/"` 现读 **2** 行（`:33` `panel-callbacks` · `:34` `ledger-surface`）⇒ 换位后 = `panel-subagent-relay` + `ledger-surface`（恰两行） |
| 2 | 🟡 R-6③ ∕ A13② 机判模式（`…panel-`）命中不了 `ledger-surface` 行 ⇒ 换位后按字面 1 命中而预期写两行 | 模式改 `grep -n 'file: "src/extension/'`：§12.2.3 **R-6③**（`VSC-DEBT.md:349`）+ §12.8 **A13②**（`VSC-DEBT.md:474`）**同点对齐**（同命令 · 同预期） | 旧模式现读 **1** 行（`:33`）；新模式现读 **2** 行 ⇒ 与预期同义 |
| 3 | 🟡 行宽基线不一致（A14 ∕ §12.4#5 记 11 · 交付时点实测 13 ⇒ 实施轮按字面必红） | §12.4 第 5 条（`VSC-DEBT.md:402` + 构成块 `:404-406`）与 §12.8 **A14**（`VSC-DEBT.md:475`）判据改写为「**按档归属零新增**」（= §1.5 判据 3 原文）+ 登记构成 **13 = 基线 11 + 他席在途 2 行**（`docs/vsc/design/WEBVIEW.md:105` / `:118`）+ 行宽豁免表格行口径提示；两处同步 | `node scripts/doc-check.mjs --root .` ⇒ 悬空 **5** ∕ 行宽 **11**（本档零新增；他席档 mtime 22:45 收正后由 13 回落 11） |

**本轮自查（同时报告）**

- **F-3（自捕 · 已就地修正）**：§12.14 修正表首稿把该行字面**复制**进表内 ⇒ 锚机检新增 1 条**入闸**悬空（`VSC-DEBT.md:544 src/extension/panel-subagent-relay.mjs`——行级「（拟新增」标记缺失所致）；复跑门禁时捕获 ⇒ 改为「**行字面单源 = R-1 行内码段**」不复制 ⇒ 复跑回到 5 ∕ 11。**注册在案**：跨档复制码段字面 = 双源漂移风险（本轮发现的成因即单源失守）——本档不再设第二份。
- **F-4（口径事实 · 已入设计档）**：行宽判据**豁免表格行**（`scripts/doc-check-width.mjs:56-62` + 谓词 `isTableRow` `:40`）⇒ §2.10 记的「行宽 13」指非表格行；本档现有 8 处宽表行（最长 492 字符）不计入该门。已写入 §12.4 第 5 条口径提示。

**本轮交付门禁读数**（cwd = `thincoder/`）

| 门 | 命令 | 读数 | 判 |
|---|---|---|---|
| 锚 | `node scripts/doc-check.mjs --root .` | 悬空 **5**（`docs/cli` 2 · `docs/core` 3）——与本批前基线同位 | **按档归属零新增**（本档零新增悬空：逐条为「拟新增 ∕ 迁移期引文 ∕ 报告面」非入闸行） |
| 行宽 | 同上 | **11** 行超 300 字符（均在 `docs/core/**`） | **按档归属零新增**（本档非表格行 **0** 行 >300 字符） |
| 设计档读数 | `wc -l docs/vsc/design/VSC-DEBT.md` | **565**（547 → 本轮 +18） | 过程记录 |

**同步面**：设计档新增 §12.14（本轮修正记录 `:537`）+ 变更记录一行（`:563`）。🔵 5 条（父侧裁「登记不改」）本轮**未动**：B-1 `:388` 引用 ∕ `:65`↔`:392` 命令映射 ∕ 批 §1.3「500 行整」∥ `:157` `files.mjs` 读数 ∕ `:34` + §4 文档行数残留。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility（机检验证） | 🔴 | 搬移后 `subagentApproval` 的 1-hop 提取面断裂——A13 必红。两处含 `postMessage(payload)` 的发射位（`thincoder-vscode/src/extension/panel-callbacks.mjs:137`/`:155`，该档仅有的「裸标识符」发射位）随 `postSubagentEvent`/`flushSubagentOutbox` 迁入新档（`VSC-DEBT.md:308-316`），而持有 `type:"subagentApproval"` 字面量的调用点 `panel-callbacks.mjs:260`（及 `:257` 的 `"subagent"`）按设计**留主档**（`VSC-DEBT.md:312` 留主档行 = `buildPanelCallbacks`）。机检的 1-hop 解析只在**同档**的 `postMessage(<标识符>)` 位触发（`thincoder-vscode/test/protocol-coverage.test.mjs:177-181`：`RELAYS.find(r => r.file === rel)` + `relayLiterals(code, relay.fn)`；`relayLiterals` 定义 `:107-114` 只扫本档 `fn(` 调用点）⇒ 搬移后主档零触发位（余下 `:262` 由 `localInit`+`BUILDERS` 自成解析）⇒ `subagentApproval` 退出 host 提取集，而 webview 消费位仍在（`thincoder-vscode/webview/chat.js:285`）⇒ `expectedDisp` 由「活」变「删」，`wrongDisp` 断言红（同档 `:286-288` / `:340-341`）；`docs/vsc/design/WEBVIEW-PROTOCOL.md:366` 该行（现记 `活`·host = `panel-callbacks.mjs:137/:155`）随之成为假死码登记，违本批零语义判据。`VSC-DEBT.md:317`「原 `panel-callbacks.mjs` 条目**保留**（保留态无害，且承载 onSubagent / onSubagentApproval 发射点解析）」与机检实读不符。 | 须补出「搬移后 1-hop 解析面仍成立」的结构约定（哪些 `postSubagentEvent(...)` 调用点随 relay 面搬迁 · 哪个档持有 RELAYS 行且档内含可解析的裸标识符发射位），并收正 `VSC-DEBT.md:317` 的「保留态无害」判据；A13 判据句（`VSC-DEBT.md:429`「提取集零变化」）须覆盖该面。 |
| 2 | Clarity / Feasibility | 🟡 | 两处「回合阶段」搬移缺控制流与入参契约。`VSC-DEBT.md:296` 给了 messages 面 break→return 手法、`:388` 给了 finally 段捕获变量参数化，而 provider/模型解析段（`panel-chat.mjs:178-235`）与挂起接管段（`:352-382`）无任何搬运契约：前者内含三处提前 `return`（`:214`/`:221`/`:223`，均在 try（`:154`）内 ⇒ 迁入 helper 后 `return` 只退出 helper，调用侧翻译位若落在 try 外则 finally（`:311`）不再执行，语义变更），且该段须向后续段回传 `providerName`/`p`/`slotStamp`/`slotData`（消费位 `:244`/`:272`/`:290`/`:329`）；后者读取 `distillSlot`（`:366`），不在 `:388` 的参数清单内。 | 为这两段补出与 messages 面 / finally 段同级的搬运契约：控制流翻译规则 + 入参 / 回传面逐项列出。 |
| 3 | Clarity / Feasibility | 🟡 | `VSC-DEBT.md:377`「新增（回合面）…`panel-chat → {panel-turn-loop, panel-turn-stages}`（**无环**：两新档不 import 主档）」与搬移段内容不符：接管段内的 `runTurn` 闭包调用 `runPanelChat`（`panel-chat.mjs:363`；定义同档 `:92`）——按设计搬入 `panel-turn-stages.mjs` 即产生 `panel-chat ⇄ panel-turn-stages` 环，而 §12.5 环清单未登记该环。 | 把该回调列为注入项（并入第 2 条契约），或将该环登记进环清单并给出「顶层只 import 绑定 / 零跨环读取」判据。 |
| 4 | 受影响文件读数 / 自身超档检查 | 🟡 | §12.6 本档行读数失真，且本档未入自身「超档检查」：`VSC-DEBT.md:405` 记本档 253 + ≈190（⇒ ≈443），实读 as-of 本刻 = §12 占 `:247-472` + 变更记录 `:474-483`（文件止于 `:484`）⇒ ≈483（同档自述 `wc -l` 口径）；`:408` 的超档检查只覆盖「四主档 + 六新档」，未按本档在批 7 对 `WEBVIEW-PROTOCOL.md` 立下的规则（`VSC-DEBT.md:168`「>300 软线 ⇒ 该档随档补一行拆分规划」）处理本档——本档即越档面单源，现距 500 硬限约 17 行（.md 无硬性行数判据，此处为设计自设口径的一致性）。 | 收正本档读数，并把同一条软线规则（补一行拆分规划，或写明豁免判据）适用于本档。 |
| 5 | 读数/注释精度 | 🔵 | `VSC-DEBT.md:341` 记 `newTurnController`「+ 本档内 2 调用点」；实测本档内调用点为 4（`panel-chat.mjs:283`/`:436`/`:445`/`:462`）。外部消费点 `chat-panel-messages.test.mjs:24` 无误。 | 收正计数。 |
| 6 | 读数/注释精度 | 🔵 | `VSC-DEBT.md:354`「其余 12 名」实列 13 名（`ensureSlot`…`status`）；`panel-session.mjs` 共 15 个导出 = `saveLines`/`generateTitle`（迁出）+ 13 名（留档），枚举本身完整。 | 标签收正为 13 名。 |
| 7 | 读数/注释精度 | 🔵 | `VSC-DEBT.md:404` 记 `test/protocol-coverage.test.mjs` 现读数 385；按本档自述口径（`VSC-DEBT.md:479`「split 式计数含末行空段」）实为 384（末行内容 `})` 在 `:384`，`:385` 为空段）——同表其余读数（499/487/385/355）与该口径逐档吻合。 | 收正为 384（增量 +1 不变）。 |
| 8 | 验收一致性 | 🔵 | `VSC-DEBT.md:439` T-14 期望输出「四主档 + 六新档…全部 ≤300」严于 A10（`:426`：十档 ≤500、四主档 ≤300）——同一判据两处不一致（预测值 ≈259 内，不影响本批结果）。 | 两处取同一条（建议以 A10 为准）。 |

**抽验一致（正面结论）**：四主档 `wc -l` = 499/487/385/355（`VSC-DEBT.md:255-260`）逐档吻合；越档面三档 425（`chat-panel.mjs`）/397（`suspension.mjs`）/384（`settings.mjs`）吻合；F-1（父侧 426 vs 实测 499）成立；对外缝清单（§12.3）枚举完整——四档全部导出名 4+5+10+15 均被覆盖。

**scope 限制**：本轮未提供项目标准档与文档地图 ⇒ 方法学合规与文档归属按其自述判据（`PROJECT.md` §5 单源 = `VSC-DEBT.md`）评估。

**out-of-scope（无严重级）**：(a) `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12/§13 表内坐标随搬移漂移（设计已在 `VSC-DEBT.md:472` 上抛）——实测两机检只对账「首列判别式 + ④ 处置」（`protocol-coverage.test.mjs:274-290` 及 reverse 同款），坐标列不参与判据 ⇒ 不构成门禁风险，仅人读面陈旧；(b) `docs/vsc/requirements/PROJECT.md` §5/§6 读数同步（批次档 §1.4 写域 vs 设计 `VSC-DEBT.md:449`）——需求档不在本轮评审面。

**计数：🔴 1 · 🟡 3 · 🔵 4**

VERDICT: changes-required

### 轮次 2（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility（机检口径） | 🟡 | R-1 给出的 RELAYS 新行路径带 `thincoder-vscode/` 前缀（`docs/vsc/design/VSC-DEBT.md:344`），与真档既有两行写法不符（`thincoder-vscode/test/protocol-coverage.test.mjs:33-34` = `{ file: "src/extension/panel-callbacks.mjs", fn: "postSubagentEvent" }` / `{ file: "src/extension/ledger-surface.mjs", fn: "post" }`），而查找是精确等值（同档 `:177` `RELAYS.find((r) => r.file === rel)`）⇒ 照字面补登则新档裸标识符发射位无匹配 ⇒ `:178` fail-closed 断言红、A13① 红（本轮 🔴 修复项的判据自身过不了）。 | 行格式改为与既有两行同形：`file: "src/extension/panel-subagent-relay.mjs"`（去 `thincoder-vscode/` 前缀与「（拟新增）」注记）。 |
| 2 | Acceptance（判据可满足性） | 🟡 | R-6③ / A13② 的机判自相矛盾：模式 `grep -n 'file: "src/extension/panel-'`（`VSC-DEBT.md:349` · `:471`）不可能命中 ledger-surface 行（真档 `:34` 为 `src/extension/ledger-surface.mjs`）⇒ 换位后按字面只有 **1** 命中，而预期写「两行（`ledger-surface.mjs` · `panel-subagent-relay.mjs`）」。 | 模式改 `file: "src/extension/`（换位后恰两行且无 `panel-callbacks.mjs`——与预期同义），或把预期改为 1 行。 |
| 3 | Acceptance（基线一致性） | 🟡 | A14 / §12.4#5 记 `doc-check` 行宽基线 = **11**（`VSC-DEBT.md:402` · `:472`），而批次档交付时点实测 = **13**（+2 记于他席在途档 `docs/vsc/design/WEBVIEW.md:105`/`:118`；`2026-09-18-vsc-large-file-split.md:105` · `:149`）⇒ 实施轮该门按字面必红；且批 §1.5 判据 3 原文即「按档归属零新增」。 | 判据改写为「按档归属零新增」并登记 13 = 基线 11 + 他席 2 行的构成（或实施前刷新基线读数）。 |
| 4 | Clarity（坐标精度） | 🔵 | B-1 的 `:388` 引用（`VSC-DEBT.md:304`；§12.5 `:308` 同引）与实读不符：`thincoder-vscode/src/extension/panel-chat.mjs:388` 是 `runTurnLoop` 的 JSDoc 散文行，finally 体（311-350）是块、无参数清单。 | 该引用改指 §12.5 的 finally 参数清单本身（或改指真实坐标），避免实施轮按错坐标核对。 |
| 5 | Doc hygiene（命令口径） | 🔵 | 同一命令两处脚本映射不一致：`:65`「快层 `npm test`（= `node test/run-fast.mjs`）」vs `:392`「`npm test`（= `node test/run.mjs`，单元 + 集成清单）」（`package.json` 未核——超本轮读面）。 | 统一两处表述（以 `package.json` 实际映射为准）。 |
| 6 | Doc hygiene（读数） | 🔵 | 批次档对 `panel-chat.mjs` 有两个互相矛盾的父侧读数：§1.2 = 426、§1.3 =「500 行整」，而设计 F-1 只收正了 426↔实测 499 一对（`2026-09-18-vsc-large-file-split.md:18` · `:23`；`VSC-DEBT.md:262`）。 | §1.3 的「500 行整」按实测 499 收正（或注明以设计档 §12.1 实测为准）。 |
| 7 | Doc hygiene（读数） | 🔵 | 抽验：四主档 + 机检档读数（499 / 487 / 385 / 355 / 384）与本刻读面吻合（±1 末行计数口径内）；`VSC-DEBT.md:157` 记 `test/files.mjs` = 82——本刻该档 ≈95–96 行（读数工具总行数 96），属历史节读数。 | 历史节读数加 as-of 标注或刷新（非本批改动面，无结构影响）。 |
| 8 | Doc hygiene（规则残留） | 🔵 | 文档行数旧口径残留未收正：`:34`（KD-2 栏「随档给拆分规划行」）与 §4 五处文档行读数（`VSC-DEBT.md:159`–`:161`）与 KD-19「文档档不承载行数义务」相左；§12.13 待裁项已登记但本轮未动。 | 父侧一并收正（或明确标注为历史口径），避免实施轮按旧规则理解。 |

**抽验一致（正面结论）**：RELAYS 两处裸标识符位（`panel-callbacks.mjs:137` / `:155`）、`relaySubagentEventToken.emit`（`:51` 含 `type: "subagent"`）、`onSubagent` / `onSubagentApproval` 原调用点（`:257` / `:260`）逐处吻合 ⇒ 本轮 🔴 的实质面（1-hop 解析面）判据成立，唯第 1 / 2 条的格式与命令须收正。`panel-chat.mjs` 分区（112-177 守卫段 · 178-235 段A · 236-310 保留 · 311-350 finally · 352-382 段B · 43-65 + 385-498 迁出）与实读一致；finally 体内无 `return` / `break`（逐字搬迁无控制流翻译缺口）；`panel-messages` / `panel-session` / `panel-chat` 的 `postMessage(` 位全为对象字面量（如 `panel-messages.mjs:483`）⇒ 三个新档不需 RELAYS 登记。

**scope 限制**：本轮未提供项目标准档与文档地图 ⇒ 方法学合规与文档归属按其自述判据（`PROJECT.md` §5 单源 = `VSC-DEBT.md`）评估；`.md` 文档免行数标注义务（与本轮判据一致）。

**计数：🔴 0 · 🟡 3 · 🔵 5**

VERDICT: pass

## §4 用户批准

**2026-09-18 22:22 用户裁定** —— 逐字「**别等明天了，能做的今天就做把**」（= 本批立即开工；父侧按 22:13 常设规则「按建议」推进评审与实现）。

## §5 实施与修正记录

（eng-coder 写）

### 实施摘要（eng-coder · 实现轮 · 2026-09-18）

四主档 → **六新档**（纯结构搬移 · 零语义 · 既有导出名与调用点零改 · re-export 转口）。
实施次序 = 设计 §12.5 四步（叶→根）；每步门禁 `npm test` + `npm run lint`，第 4 步后补协议两机检 + `doc-check`。
逐档方案 / 搬运契约（A-1–A-5 · B-1–B-3）/ R-1–R-6 / 对外缝清单 = 设计档 §12（单源，本节不复制）。
搬移等价核验 = 「规范化去缩进连续行块比对」（HEAD 原文块 ↔ 新档文本）：段 A / 段 B / finally 体 / `runTurnLoop` / `newTurnController` / relay 面 / outbox 面 / 38 个 handler 体**全部连续命中**；新档「原档不含的行」= 头部注释 + import + handler 签名 + 译文行（`return { done: true }`×3 · `return` · `runChat(` · 三处 `persist*` 别名）——无第四类差异。

### 十档行数读数（A10 / A15 · 口径 `wc -l` = 换行符数 · 终态复测）

| 档 | 批前 | 拆后 | 建议线 ≤300 | 硬限 ≤500 |
|---|---|---|---|---|
| `panel-chat.mjs` | 499 | **248** | ✓ | ✓ |
| `panel-messages.mjs` | 487 | **241** | ✓ | ✓ |
| `panel-callbacks.mjs` | 385 | **257** | ✓ | ✓ |
| `panel-session.mjs` | 355 | **261** | ✓ | ✓ |
| `panel-turn-loop.mjs`（新） | 0 | 161 | ✓ | ✓ |
| `panel-turn-stages.mjs`（新） | 0 | 177 | ✓ | ✓ |
| `panel-messages-settings.mjs`（新） | 0 | 200 | ✓ | ✓ |
| `panel-messages-turn.mjs`（新） | 0 | 199 | ✓ | ✓ |
| `panel-subagent-relay.mjs`（新） | 0 | 180 | ✓ | ✓ |
| `panel-session-write.mjs`（新） | 0 | 129 | ✓ | ✓ |
| `test/protocol-coverage.test.mjs`（机检登记） | 384 | 386（RELAYS 换位 + 2 行注释） | —（测试档） | ✓ |

十档全部 ≤300；零档越 500 硬限（`panel-chat.mjs` 由贴线 499 → 248）。
新档读数与设计 §12.6 预估值（122–189）差 ≤40——预估值无判据效力，仅作过程记录（差异归因：C-3/R-3 强制的 1-hop 构造面 + 头注）。
范围外三越档 `chat-panel.mjs` 425 · `suspension.mjs` 397 · `settings.mjs` 384 **未动**（目录 mtime 早于本批窗口，同 KD-16）。

### 四步实施读数（每步门禁）

| 步 | 动作 | `npm test` | `npm run lint` | 附 |
|---|---|---|---|---|
| 0 | 批前基线（本席开跑时） | 668 pass / 0 fail | OK | 他席在途档一并计入 |
| 1 | `panel-session.mjs` → `panel-session-write.mjs` | 677 / 0（668→677 增量 = 他席在途测试档，本席零新增测试） | OK | — |
| 2 | `panel-callbacks.mjs` → `panel-subagent-relay.mjs`（+ RELAYS 换位） | 677 / 0（首跑 677 / **3 fail**——见 fix round F1） | OK | 协议两机检 7/7 |
| 3 | `panel-messages.mjs` → 两新档 | 677 / 0 | OK | 协议 7/7 |
| 4 | `panel-chat.mjs` → 两新档（含 C-1 守卫段同址机检） | 677 / 0 | OK | 协议 7/7 + `doc-check` |
| — | 终态复跑（含审计/评审后注释修正） | **677 / 0** | OK（209 JS files） | 协议 7/7 + `--emit` 四项 `活` |

### 缝核（A11 · 零改判据）

- **外部消费点（30+）逐字未变**：`chat-panel.mjs:16/17/20` · `panel-index.mjs:21` · `ledger-surface.mjs:19` · `panel-project.mjs:8/9` · `panel-messages-session.mjs:19` · `suspension.mjs:27` · 测试 14 档——实证 = HEAD ↔ 工作树「既有行消失清单」仅两条，且两条都在**四主档自身**（`panel-chat.mjs` 旧三元 import、`panel-messages.mjs:28` 旧双符号 import——随迁段收窄，见 D2）。
- **re-export 转口三处**逐名在位：`panel-chat.mjs`（`newTurnController`）· `panel-callbacks.mjs`（六件）· `panel-session.mjs`（`saveLines` / `generateTitle`）。
- **判据包 import 逐名解析成立**（8 档 111 个导出名静态复核）：`session-io.mjs:40/41/48-51` · `settings.mjs:191` · `permission-gate.mjs` · `provider-flows.mjs` 等。
- 机判命令（设计 §12.4#3）实测输出 = 新增行 5 条（新档间 import）+ 改动行 1 条（`panel-messages.mjs:28` 符号集收窄）。

### 协议两机检（A13 · 含 1-hop 四条）

| 项 | 读数 | 判 |
|---|---|---|
| ① 两机检 | `node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` ⇒ **7 pass / 0 fail** | ✓ |
| ② `--emit` | `subagent`（host = `panel-subagent-relay.mjs:145/:163` + `suspension.mjs:108`）· `subagentApproval`（host = `panel-subagent-relay.mjs:145/:163`）· `sub:*` · `toolPanel` —— host 列全非「无」 | ✓ |
| ③ RELAYS 换位 | `grep -n 'file: "src/extension/' test/protocol-coverage.test.mjs` ⇒ **恰两行**（`:35` `panel-subagent-relay.mjs` · `:36` `ledger-surface.mjs`），**无** `panel-callbacks.mjs` | ✓ |
| ④ 1-hop 结构与 C-1 | 新档裸标识符位唯二（`:145`/`:163`）· 同档字面量构造三点（`emit` + 两转口）· 原 `onSubagent`/`onSubagentApproval` 改委托 · `panel-turn-stages.mjs` 零 import 主档 · `panel-chat.mjs` 守卫段 `ensurePanelAgent`+`ensureMemoryHandle` 同址 | ✓ |
| ⑤ `WEBVIEW-PROTOCOL.md:366` 处置列 | 仍 = `活`（消费位 `webview/chat.js:285` 未动；T-6 `wrongDisp` 空） | ✓ |

### doc-check（A14）

`node scripts/doc-check.mjs --root .`（cwd = `thincoder/`）⇒ 悬空 **5**（`docs/cli` 2 · `docs/core` 3）· 行宽 **11**（均 `docs/core/**`）——**与批前基线逐值相同**；本批未改任何 `.md` ⇒ 按档归属**零新增**成立（设计档列报项均属「拟新增 ∕ 迁移期引文 ∕ 报告面」不入闸条目）。

### 决策透明表（零语义前提下的具名适配 · 逐条可核）

| # | 决策 | 理由 | 影响面 |
|---|---|---|---|
| T-1 | 消息面 handler 名 = `handle<Case>`（28 + 10） | 承 `panel-messages-session.mjs` 先例 | 零语义（仅符号名） |
| T-2 | 三处**必选别名** `handleAddProvider/RemoveProvider/SetProviderProxy as persist*`（仅 settings 档） | 该三件与 `settings.mjs` 写入面同名，与 handler 名冲突（先例 = `loadModelPrefs as loadStoredModelPrefs`） | 调用点逐字等价（同参同序） |
| T-3 | `panel-chat.mjs`：`const slotStamp` → hoist `let slotStamp = null` + try 内赋值 | 收尾段参数化前提（原 const 在 try 内 ⇒ 早退路径 finally 读会 TDZ） | 早退路径 `fullHistory` 恒空 ⇒ 落盘分支不达——等价 |
| T-4 | 同步 handler 不 `await`、异步一律 `await`（44 条转发行逐条对齐） | 保持原 case 的 await 形态 | 零语义 |
| T-5 | 段 A 三早退 → `{ done: true }`；译位 `if (stage.done) return` 留 try 内 | 契约 A-1（落 try 外 ⇒ finally 不执行） | finally 恒执行面保持 |
| T-6 | 段 B `runPanelChat` → 注入项 `deps.runChat` | 契约 B-2/B-3（不新增环） | 等价；机判 grep 零命中 |
| T-7 | 消息两新档**零反向 import** 主档 | 据实实现（回合族零 `_cwd` 消费）——比设计少一环 | 见 D3 |
| T-8 | 注释随迁 + **两处最小适配** | 与控制流译文一致（§12.2.2「break → return」） | 注释面（零语义） |

### 设计漂移登记（实现轮发现 · 交父侧 / eng-designer 收正 · 本席不改设计档）

| # | 漂移 | 实证 | 处置建议 |
|---|---|---|---|
| D2 | §12.3 把 `relaySubagentEventToken` 消费点记为 `panel-messages.mjs:28`；随 case 迁移该行符号集收窄为 `flushSubagentOutbox`（真消费点 = `panel-messages-turn.mjs:25`），与 §12.4#3「既有 import 行逐字不变」字面互斥 | 缝**实体**未破（外部消费档逐字未动 + re-export 在位） | 收正 A11/§12.4#3 射程 = 「外部消费档 import 行零改」，或列入允许变更清单 |
| D3 | §12.5 记「两新档反向 import `_cwd`」+ 环 4 处；实测 `messages ↔ messages-turn` 环**不存在**（回合族零 `_cwd` 消费）⇒ 环 **3 处** | 逐档 import 面读面 + 审计复核一致 | 设计档环清单按实收正 |
| D4 | §12.2.1 A-4 引文 `panel._activeData(turnSlot)` 与原档原文不符 | HEAD 原文 = `panel._activeData?.(turnSlot)`（可选调用）——实现逐字一致，非偏差 | 设计档引文收正 |
| D5 | 机检档读数：§12.6 记 384 / 增量 0；实测 **386**（换位 + 2 行注释） | `wc -l` 读数 | A15 表内按实测收正 |
| D6 | 范围外指针陈旧：`panel-chat.mjs` 保留段注 cancelSubagent 指向 · `test/provider-model-guard.test.mjs:20`「panel-session.mjs 镜像」 · `WEBVIEW-PROTOCOL.md` §12/§13 host 坐标列（设计 §12.12 上抛 3） | 边界「不做顺手优化」+ 消费档冻结 | 父侧裁（本批未动） |

### 审计与评审轮次与终态（自含交付协议）

| 轮 | 类型 | 范围 | 计数 | 终态 |
|---|---|---|---|---|
| 1 | 内部 explore 分歧审计（只读） | 交付代码 ↔ 设计 §12 / 批次档 §2 逐条 | 🔴 1 · 🟡 2 · 🔵 2（全在记录/设计档陈旧层，零代码缺陷） | 收敛（🔴 由本节落笔闭合） |
| 2 | advisor 代码评审（独立 · 11 档目标 + 设计/批档） | 对外缝 / 协议提取面 / 结构机检 / 环安全 / 契约逐项 | 🔴 0 · 🟡 1 · 🔵 4 | **VERDICT: pass** |

审计 🔴（§5 读数表缺失 / A15）即本节落笔闭合；评审 🟡（A11 判据口径）为报告项（改判据不改代码）→ 父侧裁；评审 🔵 四项：两项就地收正（注释坐标 · `--emit` 复跑读数）、一项经实证**不成立**（见 D4）、一项随本节闭合（悬空引注）。
**终态 = `clean`**（终态复跑：677 pass / 0 fail · lint 209 files OK · 协议 7/7 · `--emit` 四项 `活` · `doc-check` 与基线逐值相同）。

### fix round（自捕 + 自修 · 每轮复跑门禁）

| 轮 | 触发 | 症状 | 修法 | 复跑 |
|---|---|---|---|---|
| F1 | 步 2 门禁 | `protocol-coverage` 三用例红：`sliceBalanced: 未配平 @767`——新档头注写了「名 + 左括号」字面，被 `relayLiterals` lexer 计入（注释不豁免） | 头注改措辞 | 协议 7/7 |
| F2 | 自捕（分发面一致性核） | `case "deleteEmbedKey"` 转发行多传 `msg`（handler 只收 `panel`） | 转发行收正 | 677 / 0 |
| F3 | 审计 D5 | 两处注释残留（「+ break」字样 · 消费面说明） | 就地收正 | 677 / 0 |
| F4 | 评审 🔵#2 | `panel-subagent-relay.mjs` 头注消费点坐标陈旧 | 就地收正 | 677 / 0 + `--emit` 复跑 |

### 越界项

**无**。改动面 = 四主档 + 六新档 + `test/protocol-coverage.test.mjs`（RELAYS 换位）；需求档 / 其他批档 / 范围外三越档 / `_archive/**` 均未触碰。

## §6 验证与收口

**收口（2026-09-18 23:3x · 父侧直接执行）**

- **交付判据**：设计 → 评审 **changes-required**（id=117 · 🔴1「1-hop 解析面断裂」）→ 修正（id=120 · 8/8 · R-1–R-6 契约）→ 轮 2 重评 **pass**（id=123）→ 3🟡 修正（id=125）→ 实现（id=127 · 终态 clean）⇒ **N-P3 越档面全闭**。
- **验收读数**：十档逐档 `wc -l` = 四主档 **248 / 241 / 257 / 261**（原 499 / 487 / 385 / 355）· 六新档 161 / 177 / 200 / 199 / 180 / 129 —— **全部 ≤300**（硬限 500 零档触及）· vsc `npm test` **677/0**（批前 668 · 增量属他席测试档 · 本批零新增用例）· lint OK（209 档）· 协议两机检 **7/7** + `--emit` 四项 `活`（`wrongDisp` 空）。
- **缝零改**：30+ 外部消费点 import 行逐字未变（HEAD↔工作树「既有行消失」仅 2 条且都在四主档自身）· 三处 re-export 转口 + 8 档 111 导出名静态复核在位。
- **RELAYS 换位**：删 `panel-callbacks` 死行 / 加 `panel-subagent-relay` 行 ⇒ `grep &#39;file: "src/extension/&#39;` 恰两行（relay + ledger）——**1-hop 契约（R-3）按预期成立**。
- **上抛（写域外 · 待处置）**：① A11 射程句需收正（「外部消费档 import 行零改」）；② 设计档三处按实收正（环清单 3 处 · A-4 引文补 `?.` · §12.6 机检档读数 386）；③ 范围外指针陈旧（`WEBVIEW-PROTOCOL.md` host 坐标列 · `provider-model-guard.test.mjs:20` 字样）。
- **状态行**：✅ 已收口 2026-09-18（全档冻结）。
- **台账**：越档面技术待办（四档拆分规划）⇒ **已核销**。
