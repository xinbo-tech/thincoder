# 2026-09-17 · activeBatch 裁撤批（单槽装不下并发）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（activeBatch 裁撤 · 台账 #36 已核销）

### 1.1 裁定（用户 2026-09-17 23:20）

> 「A，这个必须完全撤销，不能存在。」

- 裁定对象 = manifest `activeBatch` 字段**整链**（字段 / 校验腿 / 咬合 helper / 冻结机检取值 / 情境行字段 / 数据档键）——**完全撤销**（非降级、非保留「参考位」）。
- 决策链：父侧 23:17 呈三宗罪 + 四选项（A 撤字段 / B 撤槽改派生 / C 数组化 / D 只去咬合）→ 用户 23:20 裁 **A**。

### 1.2 问题实况（父侧实读，三条）

1. **模型错（单槽 vs 并发）**：设计把批次流水线建模为单线程——`ENGINEERING-MODE-V2.md:358` 单链（攒批 → 开批 → …）+ `:365`「下一批」；`:196` 咬合判据逐字「`activeBatch` 非空 ⇔ 存在未收口批次」= 单值等价式。实况 = 可多批同时在飞（2026-09-17 晚三批并行：closeout 实施 + docroot 设计 + 零块 fix）——单槽物理装不下。
2. **判据错（并发被判违规）**：`thincoder-core/agent-tools/batch-segment.mjs:139` 逐字「批次档状态行为「进行中」但 manifest.activeBatch 未指向它（在途孤儿）」⇒ 任何非「那一个」的在途批 = 检红。而并发是子系统自设常态（eng-coder 池 = 4 · 多实例共 cwd 的 peer 机制 · 阶段并行派单纪律）。
3. **单点失效（检查静默关灯）**：`scripts/doc-check.mjs:109` 传 `read.manifest.activeBatch` → `:46-48` `if (!activeBatch) return none` ⇒ 字段一空（本晚全程 `null`），**D5 冻结窗口机检静默失效**——而真值本就在制品（`:52-53` 已实读批次档状态行找档）。

**附带**：台账 #35（activeBatch 维护步骤缺失）——字段既撤，该待办随之作废（已置已废弃）。

### 1.3 边界

- **做**：`activeBatch` 全链撤销——schema 六键 → 五键；`DEFAULT_MANIFEST` / 校验器指针腿（含 KD-M1-5 的 `cwd` fs 读——其存在理由 = 指针校验）/ 咬合 helper / 数据档键 / 情境行字段 / 测试 / 需求与设计档条文。
- **衍生裁定（用户 2026-09-17 23:28「撤3」）**：① **D5 face③ 事后机检整体撤除**——`checkFreezeWindow` + `reviewedFilesFromBatch` + `IN_FLIGHT_MARKER` + `doc-check.mjs:109` 调用面 + `DOC-DISCIPLINE.md:725` F5 行（`:727` 接口句去该符号）+ 需求侧 `SPEC-MACHINE-CHECK.md:39` AC-M8-7（父侧域）。**依据**（父侧 23:25 实据）：双料死输入（「评审在途」全仓无写入方 + `activeBatch` 恒 null）⇒ 净检出 0 次；D5 保障由**两层真拦截**承载——face① 写门（`write-gate.mjs:66` `freezeWindowConflict` → `dispatch.mjs:23`/`:236` / VSC `agent/tool-gates.mjs:17`/`:114`——坐标 2026-09-17 23:3x 设计轮实读收正，写入当场拒）+ face② 结算陈旧（在途写入 → 不发 token）；M8 归档模块档零碰（`_archive/**`）。② 台账 ⇄ 批次档咬合（条目 `task_book` ⇄ 状态行）**保留**——撤的只是 manifest 这一环（三账 → 两账）。
- **不做**：不动台账机制本体（`task_book` 列）· 不动批次档状态行格式 · 不改 eng-coder 并发池 / 派单纪律 / 多实例机制 · 不碰冻结批档与历史记录（非追溯）· 不碰 `_archive/**` 与参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）。

### 1.4 受影响面辣图（初判 · 以设计轮实测收正）

| 层 | 档 | 要害 | 动作 |
|---|---|---|---|
| 需求 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md` | `:9` 目的句 · `:13` 六键 · `:18` ⑥ 指针校验 · `:34` AC-M1-4 · `:36` AC-M1-6 措辞 · `:42` 下游枚举 | 删 / 收正（父侧域） |
| 需求 | `…SPEC-BATCH-SEGMENT.md` · `…SPEC-LEDGER.md` · `…ENGINEERING-MODE-V2.md:649` | `:24` + AC-M3-3 + `:44` · `:54` · 闭合条款 | 同上（父侧域） |
| 需求 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md` | `:39` AC-M8-7（D5 机检） | **删 / 改**（父侧域——face③ 撤除） |
| 设计 | `docs/core/design/ENGINEERING-MODE-V2.md` | E1 JSON `:127` · 键注释 `:145` · 校验 `:147` · M1 行 `:64` · 接线表 `:102`/`:108` · E3 `:192`/`:196` · E5.1 `:310-323` · 依赖表 `:340-343` · 数据流 `:358` · T6/T8 `:409`/`:411` · `:298` | 删 / 收正 |
| 设计 | `docs/core/design/MANIFEST.md` | `:15` · `:21` F1 · `:26` F6 · `:53` · `:71-74` · §2.6（行形字段）· `:212` AC-4 · `:227`/`:229` AC-N1/N3 · `:239`/`:243`/`:245`/`:247`/`:249` T1/T4/T6/T8/T10 | 删 / 收正 |
| 设计 | `docs/core/design/BATCH-RECORD.md` | §4.9（咬合 helper）· `:172` L4 咬合句 · 变更记录 | 收正（保留冻结拒写 + 双基底） |
| 设计 | `docs/core/design/DOC-DISCIPLINE.md` | `:725` F5 行 · `:727` 四档接口句 · `:739`（AC-M8-7 指称） | **撤除 face③**（用户 23:28）+ 收正 |
| 代码 | `thincoder-core/manifest.mjs` | `:11` · `:105` · `:136-140` · `:174-180`（键 + 指针腿 + fs 读） | 删 |
| 代码 | `thincoder-core/agent-tools/batch-segment.mjs` | `:19` · `:115-117` · `:120-140`（helper） | 删 |
| 代码 | `thincoder-core/agent/setup-reminders.mjs` | `:19` · `:63-67` · `:72` · `:86`（行形字段） | 收正 |
| 代码 | `scripts/doc-check.mjs` | `:9` · `:14`（导出表）· `:29` `reviewedFilesFromBatch` · `:46` `checkFreezeWindow` + `IN_FLIGHT_MARKER` · `:109` 调用面 | **删**（face③） |
| 测试 | `manifest.test.mjs` · `batch-segment-manifest.test.mjs` · `setup-reminders.test.mjs` | AC-M1-4/4c · T8/AC-3 · AC-N1/N3/N3b/T8/T10 fixtures | 删 / 改 |
| 数据 | `PROJECT-MANIFEST.json` | `:4` 键 | 删（六键 → 五键） |
| 登记 | 台账 #35 | 字段既撤 | 已废弃 ✓（2026-09-17 23:2x） |

> 说明：`_archive/**`（已归档模块设计）与冻结批档**零碰**（非追溯）；`m10-core-verify.log` / `_verify_core.log` 等日志残留不在面（非码非档）。

### 1.5 父侧注记

- 2026-09-17 23:17 父侧呈三宗罪 + 四选项；23:20 用户裁定 **A（完全撤销）**；本批即立。
- 2026-09-17 23:28 用户**追加裁定「撤3」**——D5 face③（`checkFreezeWindow` 事后机检）整体撤除（父侧 23:25 呈三宗实据：双料死输入 / 两层真拦截已覆盖 / 维护债），**并入本批**（同一张辣图）；已同步在飞设计者（id=3 steer）。
- 2026-09-17 23:31 设计轮（id=3）交付：四档落位 + §2 全文；**§2 由父侧誊录落档**（原轮 `batch_segment` 机械拒写——本档 §1 状态行位置笔误〔已收正〕——逐字转录不增删）；辣图收正表与 8 条所见于 §2/§2.7。
- 需求档收正 = 父侧域（设计落定后同步，再点火评审——保持需求/设计同步面）。
- **设计评审轮 1（2026-09-17 23:40 · VERDICT: changes-required——🔴3 / 🟡7 / 🔵3）**：发现表由评审子代理自写入 §3（`:150-179`）。**父侧裁决与处置**：🔴1（需求 v2 七处活体句）/🔴2（`SPEC-MACHINE-CHECK.md:21`）/🔵13（`SPEC-MANIFEST.md:42` M5）→ **Fixed · 父侧直接执行**（四档 10 处；含裁决扩面：`requirements v2:185` 行「`check-ledger` 机检」同陈（M2/M8 面已作废）随行收正——如实披露）；🔴3 + 🟡4/5/6/7/8/9/10 + 🔵11/12（设计档 + 批档面 10 条）→ **Accepted · 派 fix 轮**（id=8）。
- **评审核销轮 2（2026-09-17 23:58 · VERDICT: pass）**：原 13 项 **13/13 Fixed** 核销（逐处引证在 §3 轮 2 段）；新 🟡#14（`thincoder-core/m10-core-verify.log` 在 A2 域内命中）→ **父侧已解**：日志删除（`thincoder-core/m10-core-verify.log` + `thincoder/_verify_core.log`——工作树外落盘纪律的顺带收正）；范围外观察（`thincoder-core/prompts/persona-engineering.md:44` + `docs/core/design/prompts/persona-engineering.md:44` 活体句「当前活跃批次指针」/「current active batch pointer」）→ **并入本轮 coder**（父侧给定逐字修法）。**→ §4 代签 → 派 coder（initial）。**
- **父侧注（2026-09-17 23:43——防上下文压缩失忆的显式锚）**：① §2.7 #5（`manifest.mjs` `$anchor` `:124` / 头注 `:3` 死指针）**随本批 coder 轮收**——派单时列入其任务；② 评审 🟡9（`MANIFEST.md:122` 状态句）= 已派 id=8；③ 本批 coder 轮待 id=8 收口 → 父侧核验 → §4 → 派。
- **fix 轮（id=8）交付 + 父侧核验（2026-09-17 23:50）**：10/10 落位（§2.8 在册）——逐处实读 spot-check ✓（`:21` / `:66` M3 行 297 / `:343` 读边 / `:268` 兜底行半幅登记 / `MANIFEST:34`·`:81`·`:122-123` / `BATCH-RECORD:92`）；机检零新增（837/3）✓；设计轮出批所见三项（需求 v2 `:167` 指针句 / #8 缺口入台账 / `SPEC-LEDGER` 缩进断表）= 父侧已处置。**→ 点火评审核销轮（轮 2）**。

## §2 批次任务与设计修订（eng-designer）

> **父侧誊录**（内容 = eng-designer initial 设计轮交付全文，**逐字转录**；原轮 `batch_segment` 因本档 §1 状态行位置被机械拒写〔父侧建档笔误——已收正〕，转录不增删一字）。

> 轮次 = **initial**（设计轮）。落批档 §1.1 裁定（**用户 2026-09-17 23:20 方案 A「完全撤销」**）+ 终裁（**用户 2026-09-17 23:28「撤3」**——D5 face③ 事后机检整体撤除）的设计侧收正 + 出具 coder 实施面。**未写代码、未碰需求档**（父侧域）。

### 2.1 本轮范围与判据（六面）

| # | 面 | 落点 | 状态 |
|---|---|---|---|
| A | schema 六键 → **五键**（`version` / `phase` / `docRoot` / `promptsLanding` / `checkConfig`） | 架构 E1 JSON + 键注释 + 校验面；M1 F1 / `DEFAULT_MANIFEST` / `MANIFEST_SCHEMA` / `validateManifest` | 已落（§2.5） |
| B | 校验器回归**纯函数**（`validateManifest(obj)`；`{ cwd }` 参 + fs 指针腿撤） | M1 §2.1#1 / §2.2；KD-M1-5 墓志 + KD-M1-10 / KD-M1-11 新增 | 已落 |
| C | 情境行 = `phase` **单字段**（逐字行形换） | 架构 E5.1；M1 §2.6 + AC-N1 / AC-N3 / AC-N3b + T8 / T10 | 已落 |
| D | **三账咬合 → 两账**（台账 ⇄ 批次档保留；manifest 环删） | 架构 E1 咬合块 / §2.2 依赖图 / §2.4 依赖表 / §2.5 数据流 / 纪律兑底行；M1 §2.5；BATCH-RECORD 档头 + §4.9 + L4 | 已落 |
| E | 咬合 helper 删（`batchStatusMatchesActiveBatch` 与「在途孤儿」概念同删） | BATCH-RECORD §4.9；代码 / 测试面见 §2.2 | 已落（设计侧） |
| F | **D5 face③（事后机检）整体撤除**（`checkFreezeWindow` 族） | DOC-DISCIPLINE §7 F5 / 接口项 / AC-M8-7 / 用例段；架构纪律兑底行 | 已落（§2.5） |

判据源 = 批档 §1.1（方案 A）+ §1.2（三宗罪）+ §1.3（边界与终裁）。
**保留面（本批零碰）**：D5 face① 写门（M4 `write-gate.mjs`——写时拦）· face② 结算陈旧 · M3 冻结拒写（状态行解析 + throw）· `docRoot.batches` 双基底 · M8 归档模块档（`_archive/modules/`）。

### 2.2 受影响文件全清单（coder 实施面 · 并集；as-of 2026-09-17 23:3x 实测（`\n` 计数））

| # | 文件 | 当前行数 | 变更 | 编辑点（函数级） | 本轮增量 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 272 | 修改 | ① `DEFAULT_MANIFEST`（`:102-120`）删 `activeBatch: null`（`:105`）→ 五键（`MANIFEST_SCHEMA.keys` = `Object.keys(DEFAULT_MANIFEST)` 自动跟随）；② `validateManifest`（`:143`）删 `{ cwd }` 与指针腿（`:172-181`）→ 纯函数；③ 调用点去第二参（`:230` / `:232` / `:255`）；④ 文件头契约注释（`:8-11`）与静态注释（`:101`「默认六键」/ `:122`「指针前缀」/ `:264`「写默认六键档」）同步 | −~14 |
| 2 | `thincoder-core/agent/setup-reminders.mjs` | 161 | 修改 | `manifestStateLine`（`:65`）签名 `{ phase }` + 行形改 §2.6 逐字（去 `, activeBatch: …`）；`pushManifestStateReminder`（`:86`）取值行去 `activeBatch`；注释（`:19` / `:63-64` / `:72`）同步 | −~4 |
| 3 | `thincoder-core/agent-tools/batch-segment.mjs` | 297 | 修改 | 删导出 `batchStatusMatchesActiveBatch`（`:120-141`）+ 文件头导出面注释（`:19`）；**import 面零改**（`readManifest` 仍用于 `resolveBatchDocPath:82`、`docRootPaths:84`）；`resolveBatchDocPath` / `readBatchStatusLine` / 冻结 reject **零改** | −~26 |
| 4 | `scripts/doc-check.mjs` | 122 | **修改（删 face③ 面——整档留存，A7 / A11 依赖其可跑）** | 删 `IN_FLIGHT_MARKER`（`:24`）· `MD_TOKEN_RE`（`:26`）· `reviewedFilesFromBatch`（`:29-40`）· `checkFreezeWindow`（`:46-60`）· `main` 内 D5 调用与报告块（`:109-116`）· 头注 D5 面（`:3` 摘要行 + `:9-11` 详述）· 导出表（`:14`）；**import 面零改**（`readManifest` 仍用于 `:86`） | −~50 |
| 5 | `PROJECT-MANIFEST.json`（本仓数据档） | 36 | 修改 | 删 `"activeBatch": null`（`:4`）——**写门** `writeManifest(cwd, obj, { writer: "main" })`（非 main 拒；数据档属产品面，**父侧直改被拒**，须经本 coder 轮） | −1 |
| 6 | `thincoder-vscode/src/agent.mjs` | 478 | 修改（±0——注释面；**存量档位**：478 行 > 300 软线 / < 500 硬限〔余量 ~22〕——**拆分候选**；本批不拆：±0 无结构耦合 · `docs/vsc/design/` 无既有拆分登记） | 注释 `:234`（「manifest phase / activeBatch 进模型」）去 `activeBatch` 字样——±0 语义；VSC 侧 `src/agent/setup-reminders.mjs:41` 纯转口**零改** | ±0 |
| 7 | `thincoder-core/test/manifest.test.mjs` | 301 | 修改 | 删三用例（`AC-M1-4` `:146-161` · `AC-M1-4b` `:163-173` · `AC-M1-4c` `:175-179`）；`AC-6`（`:36-45`）残留键改 `access` + `activeBatch` 两例；计数文案（`:32` / `:192-193`）六键 → 五键 | −~40 |
| 8 | `thincoder-core/test/batch-segment-manifest.test.mjs` | 133 | 修改 | 删 `T8/AC-3` 咬合用例（`:71-108`）+ import 面去 helper（`:15`）+ fixture 键（`:57`）；**保留** `N3/AC-M3-1` 双基底用例（`:110-132`——零改即绿） | −~45 |
| 9 | `thincoder-core/test/setup-reminders.test.mjs` | 139 | 修改 | 夹具（`:67`）去 `activeBatch`；`AC-N1/T8`（`:71-81`）行形断言改单字段；`AC-N3`（`:95`）· `AC-N3b`（`:104-105`）值变素材改 `phase` | −~8 |
| 10 | `thincoder-core/test/docroot-multiroot.test.mjs` | 178 | 修改 | `validateManifest(m, { cwd: dir })` 三处（`:41` / `:56` / `:127`）去第二参（死参清理——纯函数无 fs 腿） | ±0 |

> 行数 = as-of 2026-09-17 23:3x（`\n` 计数）实测；**落点以函数名 / 用例名为准，行号为 as-of 参考**（D4）；与本批并行在飞的他批同碰这些档时**串行实施**（同文件并发写 = 丢改风险），开工前先 `git status` 复读行数。
> 代码面「零残留」复核口径 = `grep -rn "activeBatch" thincoder-core/ thincoder-cli/src/ thincoder-vscode/src/ scripts/ --exclude-dir=test` → **0**（生产码域；设计档不计入——保留解释性墓志；**测试夹具域除外**——`manifest.test.mjs` 按 AC-6 / T14 / U4 保留残留键夹具，见 A2）；域外 `.thincoder/tmp/m8-green-fixture/PROJECT-MANIFEST.json:4` = gitignore 临时区残留（`.gitignore:19`）——不入判据、不清。
> 冻结批档 / `_archive/**` / 参照树（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）**零碰**。

### 2.3 验收标准（逐条机判）

| # | 验收标准 | 判据（命令 / 读数） | 回指 |
|---|---|---|---|
| A1 | schema 五键落成（六 → 五） | `node --input-type=module -e "const m=await import('./thincoder-core/manifest.mjs');console.log(Object.keys(m.DEFAULT_MANIFEST).length, Object.keys(m.DEFAULT_MANIFEST))"` → **5**，列表 = `version` / `phase` / `docRoot` / `promptsLanding` / `checkConfig` | 批档 §1.1 |
| A2 | 生产码域 `activeBatch` 零命中（**测试夹具域除外**——AC-6 / T14 / U4 保留残留键夹具） | `grep -rn "activeBatch" thincoder-core thincoder-cli/src thincoder-vscode/src scripts --exclude-dir=test` → **0 命中**（该旗标不可用时等价口径 = 结果按 `thincoder-core/test/` 过滤后为 0）；测试域仅 `manifest.test.mjs` 的残留键夹具可命中 | 批档 §1.3 |
| A3 | 校验器纯函数 | ① `validateManifest.length === 1` **且签名行无 `cwd`**（`grep -n "export function validateManifest" thincoder-core/manifest.mjs` → 无 `cwd` 字面——`length` 单独不足以证明：`(obj, opts = {})` 同为 1）；② 指针腿删净（`grep -n "activeBatch" thincoder-core/manifest.mjs` → 0）；③ `readManifest` / `writeManifest` 调用点无第二参 | KD-M1-5（墓志） |
| A4 | 旧档残留兼容（不迁移、不报错） | 档含 `access` + `activeBatch` 键其余合法 → `readManifest` `ok:true` · `errors` 空 · 返回 manifest 无两键；`writeManifest` 回写自然收敛 | AC-6 / T14 |
| A5 | 情境行逐字（单字段） | `manifestStateLine({phase:"initial-dev"})` = `[System reminder: project state: phase: initial-dev (discipline: light).]`；`production` → `strict`；未知值 → `…phase: custom.]`（无标签） | AC-N1 / T8 |
| A6 | 咬合 helper 零残留 | `grep -rn "batchStatusMatchesActiveBatch" thincoder-core scripts` → **0**（含测试） | 批档 §1.1 |
| A7 | D5 face③ 撤净 | `grep -rn "checkFreezeWindow\|reviewedFilesFromBatch\|IN_FLIGHT_MARKER" scripts thincoder-core thincoder-cli/src thincoder-vscode/src` → **0**；`node scripts/doc-check.mjs` 报告无 D5 段 | 批档 §1.3（23:28 裁定） |
| A8 | 保留面零回归 | ① face① 写门与 face② 结算陈旧零改（既有用例全绿）② `batch_segment` 已收口档仍 throw ③ 双基底用例零改即绿 | 批档 §1.3 |
| A9 | 数据档五键 | `PROJECT-MANIFEST.json` 无 `activeBatch`；`readManifest(<仓根>)` `ok:true` | F1 |
| A10 | 三端测试全绿 | `cd thincoder-core && npm test` · `thincoder-cli` · `thincoder-vscode` → fail **0** | 全局 |
| A11 | 机检零新增 | `node scripts/doc-check.mjs` → 悬空 **837**（基线 837）· 行宽 **3 行**（基线 4——本批折掉 `DOC-DISCIPLINE.md` 原 `:727` 一行，净值 −1）= 本批 authored 行零新增 | 全局 |
| A12 | 需求侧同步（**父侧域** · 登记不判） | `SPEC-MANIFEST.md` ②.1 / ②.6 / AC-M1-4 / AC-M1-6 / 下游枚举；`SPEC-BATCH-SEGMENT.md` `:24` + AC-M3-3 + `:44`；`SPEC-LEDGER.md` `:54`；`SPEC-MACHINE-CHECK.md` AC-M8-7；`requirements/ENGINEERING-MODE-V2.md:649` | 三方链 |

### 2.4 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| U1 | 正常：五键档读写 | `initManifest(cwd, { writer:"main" })` | 落盘恰五键；`readManifest` `ok:true` |
| U2 | 正常：情境行落线 | 工程模式 + depth-0 + `{ phase:"initial-dev" }` | 恰一行 `[System reminder: project state: phase: initial-dev (discipline: light).]`；`transient:true` |
| U3 | 正常：双基底仍在 | `docRoot.batches` 第二基底命中 | `resolveBatchDocPath` 返回该路径（AC-M3-1 零回归） |
| U4 | 边界：旧档残留已删键（两键） | 档含 `access` + `activeBatch` | `ok:true` / errors 空 / 返回无两键（AC-6 / T14） |
| U5 | 边界：值变单活体 | `phase` `initial-dev` → `production` | 旧行摘除、恰一行新行（`history` 引用不变） |
| U6 | 边界：状态行「进行中」写入 | 批次档写入 | 放行（M3 冻结门零变） |
| U7 | 错误：旧档 `activeBatch` 悬空值 | `activeBatch:"no-such-file.md"` 其余合法 | `ok:true`——**不再**校验指针（指针腿已撤；不得因残留键拒） |
| U8 | 错误：已收口档写入 | 状态行「已收口 <日期>」 | `throw`「已收口档不回改」（零回归） |
| U9 | 错误：非 main 写 manifest | `writeManifest(..., { writer:"subagent" })` / 父侧直改 | 拒（fail-closed） |
| U10 | 错误：D5 face③ 残留 | `scripts/` 内 `checkFreezeWindow` 引用 | **0 命中**（撤净——复用面亦不得留） |

### 2.5 设计条文落位表（四档 · as-of 本设计轮〔含评审轮 1 fix〕）

| 档（行数） | 落点（file:line · as-of） | 动作 |
|---|---|---|
| `docs/core/design/ENGINEERING-MODE-V2.md`（439） | `:21` E1 两账咬合 · `:64` M1 五键 · `:66` M3 行（职责去咬合 + 行数 297）· `:102`/`:108-109` 依赖图（+ M3 读边）· `:120` 三账分工 · `:124` JSON · `:145`/`:147` 键注释与校验面 · `:180` 两账咬合块 · `:266` 纪律兑底（face③ 墓志）· `:268` 两账行（落点 + 缺口）· `:300` 轮次行 · `:312`/`:317`/`:318`/`:321`/`:325` E5.1 · `:343` 依赖表（+ M3 → M1 行）· `:357-370` 数据流 · `:394` AC3 · `:408`/`:413`/`:415` T1/T6/T8 · `:430-436` 变更记录 | 删 / 收正 |
| `docs/core/design/MANIFEST.md`（300） | `:15` · `:21` F1 · `:26` F6 墓志 · `:34` N2 · `:43-44` 边界 · `:54` §2.1#1 · `:72-75` 接口 · `:81` writeManifest 契约 · `:88-101` §2.3 表 · `:111`+`:116-117` KD · `:122-127` §2.5 · `:131`/`:135`/`:138-140` §2.6 · `:216`/`:218` AC · `:231`/`:233`/`:234` AC-N · `:243-257` T1/T2/T4/T6/T8/T10/T14 · `:291-299` 变更记录 | 删 / 收正 |
| `docs/core/design/BATCH-RECORD.md`（277） | `:4` 档头 · `:92` §4.5 注记 · `:135` §4.9 重题 · `:140` 兑底句 · `:142-145` 咬合 helper 墓志 · `:175` L4 · `:267-271` 变更记录 | 收正 / 墓志 |
| `docs/core/design/DOC-DISCIPLINE.md`（803） | `:725` F5 裁撤 · `:729` 接口项去符号 · `:730-734` 接口分条（原单行 >300）· `:736-738` 契约段墓志 · `:748` AC-M8-7 裁撤 · `:750` 用例段裁撤 · `:758-759` 变更记录 | 裁撤 / 折行 |

### 2.6 终裁存档（face③「派生扫描」变体 · 不推进）

用户 2026-09-17 23:28「撤3」= **连检查一并撤**。父侧曾暂缓决定点 ①，故存档候选细目备查（**均不推进**）：

- **候选 A（派生扫描——不采）**：签名 `checkFreezeWindow(batchDirs, reviewedFiles = null, root)` → `{ windows: [{ batchPath, startMs, violations }], unreadableDirs }`；域 = `docRootPaths(manifest.docRoot.batches, root)` 各基底单层 `*.md`；在途判据 = §1 段内 `**状态行**：` 行含「评审在途」（**行判据**——非 §1 全文 `includes`，后者对 §1 正文提及该词的档产生假阳）；多窗并发逐窗各自报告；零窗口出行（不静默）；用例 FZ-1–FZ-6。
- **候选 B（连检查一并撤——采）**：删 `checkFreezeWindow` / `reviewedFilesFromBatch` / `IN_FLIGHT_MARKER` / `MD_TOKEN_RE` / `main` 内 D5 调用与报告块 + F5 行 + AC-M8-7 + 用例段；保留 face① 写门与 face② 结算陈旧。**本次落笔即此**。

### 2.7 边界与出批所见（逐条报告）

**本批不做**：代码（coder 面——§2.2）· 需求档（父侧域——§2.3 A12）· 冻结批档与历史记录（非追溯）· `_archive/**`（M8 归档模块档零碰）· 参照树 · 台账机制本体 · 批次档状态行格式 · eng-coder 并发池 / 派单纪律 / 多实例机制。

**所见（逐条）**：
1. **D5 机检旧实现口径偏宽**（`scripts/doc-check.mjs:53` = §1 全文 `includes` 判「评审在途」，设计条文写的是「状态行判」）——face③ 撤除后偏差随代码消失，存档备查（§2.6）。
2. **`scripts/doc-check.mjs` 全无测试覆盖**（`**/test/*.mjs` 内 `doc-check` 零命中）——撤 D5 面后余面（锚 / 行宽）仍无；**不入本批**。
3. **「评审在途」开窗标记全仓无写入方**（提示词侧无置位句）——face③ 撤除后不再有机制后果（face① 不依赖该标记）；登记。
4. **台账 #34 证据行仍引 `activeBatch`**（实质 = `agent.manifest` 无运行期刷新点，仍成立，现例应为 `phase`）——**处置 = 父侧改证据行**。
5. **`manifest.mjs:124` `MANIFEST_SCHEMA.$anchor` 指向已归档路径**（`docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md`；现档 = `docs/core/design/MANIFEST.md`）——死指针（存量）；建议随本 coder 轮一并收正（同档同文件，不入本批验收）。
6. **`MANIFEST.md` §2.5 二道防线声明与实况不符**（台账 #33：M5 `files` 域未排除 `PROJECT-MANIFEST.json`）——**不在本批面**，仅登记。
7. **face① 写门符号坐标收正**：`freezeWindowConflict` 实存于 `thincoder-core/agent/write-gate.mjs:66`（86 行），消费点 = `dispatch.mjs:23`/`:236` · VSC `agent/tool-gates.mjs:17`/`:114`——终裁口述的旧行号供父侧对齐。
8. **参照树仍有 `activeBatch` 指称**（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**` 多处）——**非追溯**（本批零碰）；登记。

### 2.8 修正轮（设计评审轮 1 fix · 2026-09-17 · eng-designer）

**范围** = 批档 §3 发现 #3–#12（设计档 + 批档面 10 条；#1 / #2 / #13 = 需求档面，父侧已修毕——本轮零碰需求档、零碰代码）。

**落位**（发现号 → 改动处）：
- **#3** → `ENGINEERING-MODE-V2.md:21`（E1 行改「两账咬合」）· `:66`（M3 行职责改「…+ 状态行冻结拒写」+ 行数收正 297）· `MANIFEST.md:34`（N2 判据列表去「指针可解析」）；三处已补入 §2.5 落位表。
- **#4** → `MANIFEST.md:81`（writeManifest 契约改 `validateManifest(manifest)`）。
- **#5** → §2.2 复核口径 + A2 收窄为**生产码域**（排除 `thincoder-core/test/` 夹具域——AC-6 / T14 / U4 保留残留键夹具）；域外 `.thincoder/tmp/m8-green-fixture/PROJECT-MANIFEST.json:4` = gitignore 临时区残留（`.gitignore:19`）→ 不入判据、不清。
- **#6** → `ENGINEERING-MODE-V2.md:106`/`:109`（依赖图补 M3 读边 + 注记限定「咬合两行」）· `:107`（M9 落点改读 `promptsLanding`）· `:343`（§2.4 表补「M3 → M1 | 读 | docRoot.batches（双基底）」行）。
- **#7** → `BATCH-RECORD.md:92`（注记改「§4.9 状态行冻结拒写 / 双基底」）。
- **#8** → `ENGINEERING-MODE-V2.md:268`（E4 纪律兜底行改指实落点 M2 咬合 CHECK · AC-M2-5，并登记「`task_book` 指向档存在」缺口——消解路径入行）。
- **#9** → `MANIFEST.md:122-123`（规格侧状态句改「已同步」+ 扩列需求面收正清单）。
- **#10** → §2.2 行 6（补存量档位标注 + 拆分候选结论：478 行 > 300 软线、< 500 硬限；无既有拆分登记、本批不拆）。
- **#11** → A3（追加签名面判据：签名行无 `cwd`——`length === 1` 单独不足以证明）。
- **#12** → §2.2 行 4（变更栏改「修改（删 face③ 面——整档留存）」+ `:3` 头注列入编辑点）· 行 1（静态注释三处 `:101`/`:122`/`:264` 列入编辑点）。

**机检读数**：`node scripts/doc-check.mjs` → 悬空锚 **837**（基线 837）· 行宽 **3**（基线 3）· 拟新增 3——**零新增**。
**留痕**：三档设计档各 +1 条变更记录（`ENGINEERING-MODE-V2.md` / `MANIFEST.md` / `BATCH-RECORD.md`）；本档 §2.2 / §2.3 / §2.5 为就地改行（本轮无新增语义——仅评审发现 + 父侧裁定的落地）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 需求/文档归属 | 🔴 | 需求 v2 仍活体陈述被裁撤的 manifest 批次指针与指针机检：`requirements/ENGINEERING-MODE-V2.md:154`（「阶段、活跃批、目录声明」）· `:155`（构成含「当前活跃批次（指针）」）· `:156`（「机检机械校验（…指针可解析…）」）· `:184`（收口时「活跃批指针更新」）· `:185`（兜底「阶段/指针一致性机检」）· `:187` · `:399`（「manifest 更新（机检兜底）」）；设计侧（架构 E1 :119/:144-146 · MANIFEST 五键）与用户裁定「完全撤销，不能存在」相反；批档 §1.4 辣图 + §2.3 A12 对该档仅登记 `:649` ⇒ 同步清单清不掉这些活体句（同一机制两处相反描述）。 | 该 7 处坐标补进同步清单（A12/辣图）：`:155` 构成列删「当前活跃批次（指针）」；`:156`/`:185` 机检句改枚举/键存在/值形态；`:184`/`:399` 收口行删「活跃批指针更新 / manifest 更新」；`:154`/`:187` 删指称。附带：`SPEC-LEDGER.md:59` 需求依据「三账咬合」改「两账咬合」。 |
| 2 | 需求/文档归属 | 🔴 | `SPEC-MACHINE-CHECK.md:21` ②.5 仍把「冻结窗口机检（D5 可被检）」列为活体功能点，而同档 `:39` AC-M8-7 已裁撤、`design/DOC-DISCIPLINE.md:725` F5 已裁撤、架构 `:265` 已裁撤 ⇒ 同文件内同一机制两个答案；A12 对该档只登记 AC-M8-7。 | `:21` 改墓志（或删），与 AC-M8-7 / F5 / 架构纪律兑底行同口径；把 ②.5 补进 A12 行。 |
| 3 | 文档归属/清晰度 | 🔴 | 设计档内被裁撤机制仍有活体描述：架构 `:21`「E1 …+ 三账咬合」（现为两账咬合）· `:66` M3 行职责「…+ 状态行与 manifest 咬合」（该 helper 已同批删，见 BATCH-RECORD §4.9 / 架构 :179-197/:343/:431）· `MANIFEST.md:34` N2「判据机械判（枚举 / 键存在 / 指针可解析）」；`:66` 不在批档 §2.5 落位表内。 | `:21` 改「两账咬合」；`:66` 职责句删咬合项（按现状改「六段门禁 + 段白名单继承 + 状态行冻结拒写」）并按实测收正行数（现 297 行）；`MANIFEST.md:34` 判据列表删「指针可解析」；三处补进落位表。 |
| 4 | 清晰度 | 🟡 | `MANIFEST.md:81` writeManifest 契约仍写「落盘前先 `validateManifest(manifest, { cwd })`」，与本档 `:75`（纯函数、`{ cwd }` 参一并裁撤）、§2.3 行 1 ③（`:230`/`:232`/`:255` 去第二参）与 A3 相左（实读 `manifest.mjs:230`/`:232`/`:255` 现仍传第二参）。 | `:81` 改 `validateManifest(manifest)`（与 A3 同口径）。 |
| 5 | 验收/可行性 | 🟡 | 批档 A2（`:100`）与 §2.2 复核口径（`:92`）要求 `grep -rn "activeBatch" thincoder-core …` = 0，但域覆盖 `thincoder-core/test/**`，而 AC-6/T14/U4（`MANIFEST.md:217`/`:256`、批档 `:119`）要求保留「已删键不炸」夹具（`:86` 行「残留键用例改 `access` + `activeBatch` 两例」）⇒ 字面 `activeBatch` 必然留在 `manifest.test.mjs`（现 `:36-45` 为 access-only 夹具），A2 按现文不可满足。 | 收窄 A2/复核口径（如排除测试夹具域，或改判「机制符号零命中」）；域外另有 `thincoder/.thincoder/tmp/m8-green-fixture/PROJECT-MANIFEST.json:4` 持键（不在 A2 域，确认是否需清）。 |
| 6 | 清晰度/完整性 | 🟡 | 依赖面不自洽：架构 §2.4 表（`:341` 起）与 §2.2 图（`:102-106`）均未列 M3 → M1 的 `docRoot.batches` 读边，而 `BATCH-RECORD.md:147`（双基底按 `docRoot.batches` 复判）、`MANIFEST.md:196` 消费面 #3、批档 §2.2 行 3（`readManifest` 仍用于 `resolveBatchDocPath`）均以该读边为前提；图 `:106`「M9 提示词（落点读 docRoot）」与 E1 键注释 `:144`（`promptsLanding` 为落地声明面、不入 docRoot）及 §2.4 `:341`（M9 读 `promptsLanding`）不符。 | §2.4 补「M3 → M1 | 读 | `docRoot.batches`（双基底）」一行、§2.2 图同步；`:106` 改「落点读 `promptsLanding`」。 |
| 7 | 清晰度 | 🟡 | `BATCH-RECORD.md:92` 注记仍称「§4.9 状态行咬合/冻结拒写的机械面为本节新增」——§4.9 已重题且咬合已裁撤（同档 `:4`/`:135`/`:142-145`）。 | `:92` 改「§4.9 状态行冻结拒写 / 双基底」。 |
| 8 | 需求覆盖 | 🟡 | 架构 E4 纪律兑底行 `:267` 宣称「机检器「`task_book` 指针可解析」」，但本次在评档内无落点：M2 = SQLite 咬合 CHECK（仅非空）；M8 余面 = 锚 + 行宽（DOC-DISCIPLINE §7 F1–F4）；`LEDGER.md:76` 明示 v1「L1 指针可解析」随存储消亡。 | 指名该兑底的落点（模块 + AC）或登记为缺口（可见、带消解期）。 |
| 9 | 文档归属 | 🟡 | `MANIFEST.md:122` 状态句「规格侧（②.1 六键 / ②.6 指针校验 / AC-M1-4 / AC-M1-6）收正 = 主 agent 域…三方链现断在需求层」现态已过期——四项在 `SPEC-MANIFEST.md:13`/`:18`/`:34`/`:36` 均已收正/裁撤。 | 改「已同步（含 ⑥ / AC-M1-4 墓志 / AC-M1-6 收正）」，并按发现 1/2 扩列登记面。 |
| 10 | 受影响文件标注 | 🟡 | `thincoder-vscode/src/agent.mjs`（批档 §2.2 行 6：478 行，>300 建议线）本批修改（注释，±0）但未带拆分评审/候选标注；对照架构 §2.2 `:67`/`:68` 对 dispatch.mjs / subagent-spawn / scheduler 均标「拆分候选」。 | 该行补存量档位标注与拆分评审结论（或注明既有拆分登记处）。 |
| 11 | 验收 | 🔵 | A3 判据 `validateManifest.length === 1` 不能证明 `{ cwd }` 参已消失——`(obj, opts = {})` 形态 length 同为 1（默认参不计入）。 | 追加签名面判据（如签名行无 `cwd`），或与 §2.3 ③ 调用点清理并列为判据。 |
| 12 | 清晰度 | 🔵 | 编辑点清单漏列收正字面：批档 §2.2 行 4 变更栏「删除（face③ 撤除）」易被读成整档删除（`scripts/doc-check.mjs` 须留存——A7/A11 依赖其可跑）；`scripts/doc-check.mjs:3` 头注仍含「+ D5 冻结窗口可检面」；`manifest.mjs` 注释 `:101`「默认六键」/`:122`「指针前缀」/`:264`「写默认六键档」（A2 grep 不覆盖这些字样）。 | 行 4 改「修改（删 face③ 面）」；`doc-check.mjs:3` 与 `manifest.mjs` 三处注释列入编辑点。 |
| 13 | 文档归属 | 🔵 | 需求侧枚举残留：`SPEC-MANIFEST.md:42` 下游仍列 M5「读 manifest 字段」，与架构 §2.4 `:347`（M5 零读面，F3 面裁定）矛盾（非本批引入）。 | 随同步清单收正（M5 移出下游读面）。 |

计数：🔴 3 · 🟡 7 · 🔵 3（共 13）
VERDICT: changes-required
（已核通过面：四档墓志/收正与 E1 五键、E5.1 单字段逐字行形、两账咬合块/依赖表/数据流/T1·T6·T8、BATCH-RECORD §4.9 重题、DOC-DISCIPLINE F5/AC-M8-7/用例段裁撤、批档 §2.2 行数实测（manifest.mjs 272 · batch-segment.mjs 297 · setup-reminders.mjs 161 · doc-check.mjs 122 · PROJECT-MANIFEST.json 36 · 4 测试档 301/133/139/178 · agent.mjs 478 逐档相符）、编辑点行号与实读一致、A5/A6/A7/A9 可机判、保留面（face① 写门 `write-gate.mjs:66` / face② / 冻结拒写 / 双基底）零碰声明成立。）

### 轮次 2（评审子代理）

**轮次 2（核销轮）· 范围** = 轮 1 发现 #3–#12（设计档 + 批档面 10 条）与需求档面 10 处（`requirements/ENGINEERING-MODE-V2.md` 七处活体句 + `SPEC-MACHINE-CHECK.md` ②.5 + `SPEC-LEDGER.md` + `SPEC-MANIFEST.md` ⑤）的修复声明，逐处实读核销；未做全量再评（轮次衰减）。轮 1 = changes-required（🔴3 / 🟡7 / 🔵3）。

| # | 原# | 项（档） | 严重度 | 状态 | 证据 / 备注（本轮实读） |
|---|---|---|---|---|---|
| 1 | 1 | 需求 v2 七处活体句 + `SPEC-LEDGER.md:59` | 原🔴 | **Fixed** | `requirements/ENGINEERING-MODE-V2.md:154`「阶段、目录声明」· `:155`「构成（纯机器状态）：项目阶段（初始开发 / 上线运行）· 目录声明（doc-root，覆盖默认值）」· `:156`「机检机械校验（枚举合法、值形态合法、目录声明存在）」· `:184`「—（manifest 不参与收口——无批次指针）」· `:185`「manifest 写门（M1——fail-closed） \| SQLite 咬合 CHECK（非空 `task_book`） \| `batch_segment` 段门禁 + 状态行冻结拒写」· `:187`「项目状态档横切更新（阶段随进度变）」· `:399`「台账核销 + 批次档 §6 收口（manifest 不参与——无批次指针）」；`SPEC-LEDGER.md:59`「架构设计 §2.3 E1（表结构 + 两账咬合）」。登记面 = 批档 `:55`（四档 10 处）+ `MANIFEST.md:123`。 |
| 2 | 2 | `SPEC-MACHINE-CHECK.md:21` ②.5 | 原🔴 | **Fixed** | `:21`「~~**冻结窗口机检**：D5（评审在途不改被审文档）可被检~~ **裁撤**（2026-09-17 用户裁定「撤 3」——D5 保障 = face① 写门 + face② 结算陈旧；`checkFreezeWindow` 族已删）」。 |
| 3 | 3 | 架构 `:21` / `:66` + `MANIFEST.md:34` | 原🔴 | **Fixed** | 架构 `:21`「E1 \| 三账架构（PROJECT-MANIFEST + 台账 + 批次档 + 两账咬合）」· `:66`「M3 …（297 行·**修改**）\| 六段门禁 + 段白名单继承 + 状态行冻结拒写」；`MANIFEST.md:34`「判据机械判（枚举 / 键存在）」；三处已入批档 §2.5 落位表（`:134`/`:135`）。行数 297 复核 ✓（`thincoder-core/agent-tools/batch-segment.mjs` 尾行 = 297）。 |
| 4 | 4 | `MANIFEST.md:81` | 原🟡 | **Fixed** | `:81`「落盘前先 `validateManifest(manifest)`（`ok:false` → 拒落盘，防写非法档）」——第二参已去。 |
| 5 | 5 | 批档 A2 / §2.2 复核口径（夹具域） | 原🟡 | **Fixed**（剩余域见 #14） | `:103`「A2 \| 生产码域 `activeBatch` 零命中（**测试夹具域除外**——AC-6 / T14 / U4 保留残留键夹具）」；`:95` 复核口径 `--exclude-dir=test` + 域外 `.thincoder/tmp/…`（`.gitignore:19` 实读 = `.thincoder/tmp/` ✓）。 |
| 6 | 6 | 架构依赖面（M3 读边 / M9 promptsLanding） | 原🟡 | **Fixed** | `:106`「├──► M3 批次档（第二基底复判读 docRoot.batches）」· `:107`「└──► M9 提示词（落点读 promptsLanding）」· `:109` 注记限「咬合两行」· `:343`「\| M3 → M1 \| 读 \| `docRoot.batches`（第二基底复判——双基底落点；缺键用 M1 默认值 fallback） \|」。 |
| 7 | 7 | `BATCH-RECORD.md:92` | 原🟡 | **Fixed** | `:92`「（v2 注：§4.9 状态行冻结拒写 / 双基底 的机械面为本节新增；提示词侧六段自写句不变。）」。 |
| 8 | 8 | 架构 `:268` E4 纪律兜底行 | 原🟡 | **Fixed** | `:268`「已落半幅 = M2 咬合 CHECK（`task_book` 非空——`docs/core/design/LEDGER.md` §2 · AC-M2-5）；「`task_book` 指向的批次档存在」**无机检落点 = 缺口登记**（消解路径 = 随 M8 扩面或 M2 后续轮补判据；未消解前本行持续标注）」；落点核实：`LEDGER.md:17`「## 2. 存储与 schema（v2——SQLite 单表）」· `:40` 咬合 CHECK · `:136` AC-M2-5 ✓。 |
| 9 | 9 | `MANIFEST.md:122` 状态句 | 原🟡 | **Fixed** | `:122`「**规格侧已同步**（父侧 2026-09-17 落笔——…）」+ `:123` 扩列（需求 v2 七处 / `SPEC-LEDGER` / `SPEC-MACHINE-CHECK` ②.5）——三方链闭合。 |
| 10 | 10 | 批档 §2.2 行 6（`thincoder-vscode/src/agent.mjs`） | 原🟡 | **Fixed** | `:88`「修改（±0——注释面；**存量档位**：478 行 > 300 软线 / < 500 硬限〔余量 ~22〕——**拆分候选**；本批不拆：±0 无结构耦合 · `docs/vsc/design/` 无既有拆分登记）」。 |
| 11 | 11 | 批档 A3 判据 | 原🔵 | **Fixed** | `:104`「① `validateManifest.length === 1` **且签名行无 `cwd`**（…`length` 单独不足以证明：`(obj, opts = {})` 同为 1）…」。 |
| 12 | 12 | 批档 §2.2 行 4 / 行 1 编辑点 | 原🔵 | **Fixed** | `:86`「**修改（删 face③ 面——整档留存，A7 / A11 依赖其可跑）** \| …头注 D5 面（`:3` 摘要行 + `:9-11` 详述）…」；`:83`「④ 文件头契约注释（`:8-11`）与静态注释（`:101`「默认六键」/ `:122`「指针前缀」/ `:264`「写默认六键档」）同步」。 |
| 13 | 13 | `SPEC-MANIFEST.md:42` 下游枚举 | 原🔵 | **Fixed** | `:42`「**下游**：M2 / M3 / M4 / M6 / M8 / M9 读 manifest 字段（`docRoot` / `checkConfig` / `phase` / `promptsLanding`）」——M5 已移出。 |
| 14 | （新） | 批档 A2 判据域（日志档） | 🟡 | **New** | `thincoder-core/m10-core-verify.log:69`「✔ T8/AC-3 咬合：状态行 ↔ manifest.activeBatch 一致 → ok；改其一 → ok:false (15.5368ms)」（`:161`/`:163` 另有两行）⇒ A2 命令域含 `thincoder-core`，按现文非 0 命中。建议：A2 命令加 `--exclude="*.log"`（或把「日志残留」并入例外括注）——批档自述日志「不在面」但命令未排除。域外另三处日志（`thincoder/_verify_core.log` · `thincoder/.thincoder/tmp/core-test*.log` · `thincoder-cli/.thincoder/tmp/_v_core3.log`）不在 A2 域 ✓。 |

**计数**：原 13 项 = **13/13 Fixed**（原🔴3 / 🟡7 / 🔵3 全数核销）；新发现 🟡 1 · 🔵 0 · 🔴 0。
**VERDICT: pass**

**范围外观察（无严重度）**：`thincoder-core/prompts/persona-engineering.md:44`（英文落地）与 `docs/core/design/prompts/persona-engineering.md:44`（中文模板）仍以活体句把 manifest 描述为「project phase / current active batch pointer / directory declarations」（「项目阶段 / 当前活跃批次指针 / 目录声明」）——两档不在本批辣图 / A12 / 本次在评档面内，建议另行登记处置（提示词内容权 = 主 agent；M9 双面流程 = 改模板 → 翻译生成落地）。
**出批面（按声明不评）**：代码实施面（`thincoder-core/**` 等现行命中 = coder 轮实施对象，均已在批档 §2.2 列内；本轮 grep 清点未见列外档）· `_archive/**`（`ENGINEERING-MODE-V2-MODULE-BATCH-SEGMENT.md` / `-MACHINE-CHECK.md` 历史指称 = 非追溯）· 参照树 / 冻结批档（非追溯，§2.7 #8 登记）· 已登记待办 / 机检存量债。

## §4 用户批准（主 agent）

**代签 2026-09-17 23:58**（承用户 23:33「开始处理」授权——本晚自动链）：评审轮 2（核销轮）**PASS**——原 13 项 **13/13 Fixed**（🔴3 / 🟡7 / 🔵3 全数核销，逐处引证在 §3 轮 2 段）、新 🟡1（A2 域含日志——本轮父侧已解）、范围外 1（提示词模板活体句——并入本轮 coder）。设计 token 已签发（值不落文档——运行时凭证）；**→ 派 coder（initial 轮）**。

## §5 实施记录（eng-coder）

### 5.1 交付摘要（eng-coder · initial 轮 · 2026-09-18 00:1x）

**范围** = 批档 §2.2 行 1–10 + `scripts/doc-check.mjs`（工具面·父侧指定「按 §2.2 行 4 照做」）+ 父侧增量三项（① `manifest.mjs` 死指针；② 提示词双面残留句；③ face③ 撤除复核）。**零碰**：face① 写门 · face② 结算陈旧 · M3 冻结拒写（状态行解析 + throw）· `docRoot.batches` 双基底 · `_archive/**` · 参照树 · 批档 §1/§2/§3/§4。

**改动清单（file:line · as-of 本轮末）**：

| # | 档 | 改动（落点） |
|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | `:3` 头注改指 `docs/core/design/MANIFEST.md §2`；`:7-11` 契约块去 `{ cwd }`/指针句；`:100` 「默认五键」；`:103` 删 `activeBatch` 键；`:120` 去「指针前缀」；`:122` `$anchor` → `docs/core/design/MANIFEST.md`（父侧增量①）；`:134-140` `validateManifest(obj)` 纯函数（jsdoc 改 + 签名去第二参）；`:169` 前删指针腿（原 `:172-181`）；`:192` / `:217` / `:219` / `:233` / `:242` / `:251` 注释与调用点同步（三调用点单参，断言 `length === 1`） |
| 2 | `thincoder-core/agent/setup-reminders.mjs` | `:19` 头注单字段；`:61-64` 行形逐字块改单字段；`:65` 签名 `{ phase }`；`:67` 行模板去 `, activeBatch: …`；`:72` 注入注释；`:86` 取值行 |
| 3 | `thincoder-core/agent-tools/batch-segment.mjs` | `:18-19` 导出面注释去 helper；原 `:113-141` 咬合 helper（jsdoc + `batchStatusMatchesActiveBatch`）整段删；`resolveBatchDocPath` / `readBatchStatusLine` / 冻结 reject / import 面**零改** |
| 4 | `scripts/doc-check.mjs` | `:3` 摘要行去 D5；原 `:9-11` D5 详述删；`:11` 导出表改 `main / formatReport`；原 `IN_FLIGHT_MARKER` / `MD_TOKEN_RE` / `reviewedFilesFromBatch` / `checkFreezeWindow` 全删；`node:fs` import 行随之删（三符号零消费——见 5.2）；`main` 内 D5 调用与报告块删；锚 + 行宽面零改 |
| 5 | `PROJECT-MANIFEST.json` | 删 `"activeBatch": null`（原 `:4`）→ 五键 |
| 6 | `thincoder-vscode/src/agent.mjs` | `:234` 注释去 `activeBatch` 字样（±0 语义） |
| 7 | `thincoder-core/test/manifest.test.mjs` | 删三用例（原 `AC-M1-4` / `-4b` / `-4c`）；`AC-6` 残留键夹具改 `access` + `activeBatch`（悬空值，兼作 U7）；`:32` / `:158-159` / `:220` 计数文案六键 → 五键 |
| 8 | `thincoder-core/test/batch-segment-manifest.test.mjs` | 删 `T8/AC-3` 咬合用例（原 `:71-108`）；import 面去 helper；fixture 去 `activeBatch` 键；删随案死夹具 `recordWithoutStatusLine`（见 5.2）；`N3/AC-M3-1` 双基底用例**零改即绿** |
| 9 | `thincoder-core/test/setup-reminders.test.mjs` | `:67` 夹具去 `activeBatch`；`:71-78` 行形断言改单字段三态；`:93` / `:102-103` 值变素材改 `phase` |
| 10 | `thincoder-core/test/docroot-multiroot.test.mjs` | `:41` / `:56` / `:127` 去 `validateManifest` 第二参 |
| 11 | `thincoder-core/prompts/persona-engineering.md` | `:44` 删「/ current active batch pointer」（逐字·父侧增量②） |
| 12 | `docs/core/design/prompts/persona-engineering.md` | `:44` 删「/ 当前活跃批次指针」（逐字·父侧增量②） |

**A1–A12 逐条读数（机判实跑）**：

- **A1** ✅ `DEFAULT_MANIFEST` 恰 **5** 键 `["version","phase","docRoot","promptsLanding","checkConfig"]`（`Object.keys().length` 实跑）。
- **A2** ✅ `grep -rn "activeBatch"`（生产码域，排除 test）→ **0**；命中唯二 = `test/manifest.test.mjs`（AC-6/T14/U4 保留夹具，批档 §2.3 A2 括注允许）+ `.thincoder/tmp/m8-green-fixture/**`（gitignore 临时区，不入判据）。
- **A3** ✅ ① `validateManifest.length === 1` 且签名行 `export function validateManifest(obj) {` 无 `cwd` 字面；② `grep -n "activeBatch" thincoder-core/manifest.mjs` → **0**；③ `readManifest` / `writeManifest` 调用点无第二参（含全仓 grep）。
- **A4 / U4 / U7** ✅ 档含 `access` + 悬空 `activeBatch` → `readManifest` `ok:true` · `errors` 空 · 返回 manifest 无两键；`writeManifest` 回写两键均不落盘（AC-6 用例实跑）。
- **A5** ✅ `manifestStateLine({phase:"initial-dev"})` = `[System reminder: project state: phase: initial-dev (discipline: light).]`；`production` → `strict`；未知值 → `[System reminder: project state: phase: custom.]`（无标签）——三态实跑逐字。
- **A6** ✅ `grep -rn "batchStatusMatchesActiveBatch" thincoder-core scripts` → **0**（含测试）；导出面实读 = `MAX_TEXT_CHARS` / `SEGMENT_BY_ROLE` / `batchDocForReview` / `batchSegmentTool` / `configureBatchSegment` / `resetBatchSegment` / `resolveBatchDocPath`（helper 已除）。
- **A7** ✅ `grep -rn "checkFreezeWindow|reviewedFilesFromBatch|IN_FLIGHT_MARKER" scripts thincoder-core thincoder-cli/src thincoder-vscode/src` → **0**；`node scripts/doc-check.mjs` 报告无 D5 段（全文过滤实跑）。
- **A8** ✅ 保留面零回归——face① `write-gate.mjs:66` 零碰；face② 结算陈旧零碰；`batch_segment` 已收口档仍 throw（冻结拒写用例绿）；`N3/AC-M3-1` 双基底用例零改即绿。
- **A9** ✅ `PROJECT-MANIFEST.json` 五键无 `activeBatch`；`readManifest('D:/teamcode/thincoder')` `ok:true` · `errors` 空（实跑）。
- **A10** ✅ 三端 `npm test` 全绿：**core 290/290 · cli 609/609 · vsc 588/588**（fail **0**）。
- **A11** ✅ `node scripts/doc-check.mjs` → 悬空 **837**（基线 837）· 行宽 **3**（基线 3）——**本批 authored 行零新增**。
- **A12** ——（父侧域·登记不判；本轮零碰需求档）。
- **父侧增量三项** ✅ ① 死指针收正（`:122` + `:3`，改指 `docs/core/design/MANIFEST.md`，机检基线不升——见 A11）；② 提示词双面 `grep -rn "active batch pointer\|活跃批次" thincoder-core/prompts docs/core/design/prompts` → **0 命中**；③ face③ 域内日志残留复查净（`m10-core-verify.log` 父侧已删，A2 复扫无该域命中）。

**回溯**：改动面 = 12 档（§2.2 行 1–10 + 工具面 1 + 提示词 2）；净 **−188 行**（`git diff --stat`：54 insertions / 242 deletions）。

### 5.2 决策透明表

| # | 决策 | 理由 | 是否在设计面内 |
|---|---|---|---|
| 1 | `scripts/doc-check.mjs` 的 `node:fs` import 行整行删（`existsSync` / `readFileSync` / `statSync` 三符号随 face③ 函数全删而零消费） | 留 = 死 import（残留）；批档 §2.2 行 4 只写「import 面零改」指 `readManifest`（仍用于 `:43`），fs 三符号不在该括注内 | 设计面**推论**（如实披露） |
| 2 | `thincoder-core/test/manifest.test.mjs:3` 头注**保持原样**（仍指已归档模块档路径）——曾改动后**回退** | 父侧增量① 明示死指针收正范围 = `manifest.mjs` 同档同文件；测试档头指 `_archive/modules/*` 属**范围外存量族**（全仓 >10 处），应另案而不静默扩面 | 严格按外（回退 = 保面） |
| 3 | `batch-segment-manifest.test.mjs` 删随案死夹具 `recordWithoutStatusLine`（原仅被删掉的 `T8/AC-3` 用例引用） | 留 = 孤儿夹具（残留）；删 = 被删用例的直接推论 | 设计面**推论**（如实披露） |
| 4 | `manifest.mjs` 校验器 jsdoc 墓志句写作「原 `{ cwd }` 指针腿已随字段整链裁撤」——**不写 `activeBatch` 字面** | A2/A3 判据 = 生产码域该字面零命中；墓志须留但字面须避（KD-M1-5 墓志语义不损） | 设计面内（判据驱动措辞） |
| 5 | `batch-segment-manifest.test.mjs` 头注「覆盖：」行删咬合 helper 项（其余句保留） | 被删用例的覆盖描述留 = 陈注释（与实况不符）；§2.2 行 8 未列注释项，属「注释与代码一致」自检职责 | 设计面**推论**（如实披露） |

### 5.3 审计与代码评审轮次与终态

- **内部 explore 差异审计（1 轮 · 终态 = 1 🟡 · 0 🔴）**：唯一发现 = 「§5 实施记录尚未写入」——即本段（自清）；其余 (b) 逐点 / (c) 简化 / (d) 残留 / (e) 超面 — 全 0；保留面 (f) 逐一在册。
- **内部 advisor 代码评审（轮 1 · VERDICT: pass · 终态 = clean）**：🟡1（`thincoder-vscode/src/agent.mjs` 478 行 > 300 建议线——**存量档位**，批档 §2.2 行 6 已登记拆分候选、设计评审 #10 已 Fixed ⇒ **建议级不入 fix**）· 🔵2（批档 A11 行宽基线数字漂移 4 vs 3——**父侧域**，§5/§6 落笔时一行收正）· 🔵3（§5 空——本段即闭合）。**无 🔴**。
- **fix round：0 轮**（评审 pass，无需修正轮）。

## §6 验证与收口（父代理）

### 6.1 父侧实施核验（2026-09-18 00:16——实读 + 实跑，非转录）

- **实读**：`manifest.mjs:140` `validateManifest(obj)` 单参 ✓ · `:122` `$anchor` = `docs/core/design/MANIFEST.md` ✓（头注 `:3` 同已收）· 头注 `:1-17` 五键口径 ✓ · 三调用点单参（`:217`/`:219`/`:242`）✓ · 生产码域 `activeBatch` 0 命中 ✓ · 提示词两档逐字删 ✓（A2 / A6 / A7 复扫同读数）。
- **实跑**（父侧复跑）：core **290/290** · cli **609/609** · vsc **588/588** · fail **0** ✓（core 294 → 290 = 撤 4 用例：AC-M1-4/4b/4c + T8/AC-3——与 §2.2 行 7/8 相符）；A11 = 悬空 **837**（基线 837）· 行宽 **3**——零新增 ✓。

### 6.2 实施面披露项裁定

- 3 处设计面推论改动（§5.2）全准：`doc-check.mjs` `node:fs` import 行删（face③ 三符号零消费）· 死夹具 `recordWithoutStatusLine` 删 · 该档头注「覆盖：」行删咬合项。
- 1 处回退准：`manifest.test.mjs:3` 头注还原（范围纪律——死指针收正仅 `manifest.mjs` 同档）。
- 评审 🔵2（A11 行宽基线 4/3 漂移）→ **本处收正**：本批实测 = 悬空 837（基线 837）· 行宽 3（基线 3）；原 A11 行内「基线 4 / 净值 −1」为设计轮当刻叙述——以本处口径为准。

### 6.3 出批所见处置

- **已归档模块档死指针族**（>10 处：测试档头注 / `doc-check.mjs:3` / `batch-segment.mjs:1·:237` / `thincoder-cli/src` · `thincoder-vscode/src` 同类）→ **登记台账 #42**（另案统一收正）。
- 工作树根 `.tmp-doccheck-*.txt`（非本轮产物）→ 父侧已清 ✓。

### 6.4 收口

- 交付提交 = **aff5bc08**（13 档；+130 / −243）· 本档 §6 随收口提交；台账 **#36**：已核销；凭证槽 consume ✓（同 designId 再 spawn 已机械拒）。
