# CLI 产品树残留债（CLI-DEBT）· CLI 面 · 设计

> 板块 = **CLI 产品树残留债**——`thincoder-cli/**` 的**档位（行数档）登记活账** + 结构 / 一致性尾项登记。
> 对位册 = `docs/vsc/design/VSC-DEBT.md` §12.1（VSC 越档登记）· `docs/core/design/CORE-UNIFICATION.md` §2.8.1（核内逐档行数与拆分计划）。
> 判据源 = `thincoder-cli/AGENTS.md:34`（单档 >500 行 = advisory · >800 行 = blocking）+ 各批既有裁定（逐条注源；**裁定原文住各批档 = 记录面，本册 = 转正后的活面**）。
> 建档：2026-09-25（**cli-small-items 批 · 台账 #340 载体收口**——承 `docs/batches/2026-09-25-file-tier-sweep.md` KD-26「不新造册 · 缺口上报」；本批 = 缺口收口：指定本册为载体）。
> 行数口径 = `wc -l`（`= split("\n").length - 1`，与核机检同式）；读数 **as-of 2026-09-25 设计轮实读**（未动档不重锚）。
> 论域 = `thincoder-cli/**`（`node_modules/` · `docs/_archive/` 除外；含 `bin/` `src/` `test/`）。

## 1. 定位与收录口径（判据句）

**定位**：CLI 树越线档的**唯一活登记面**——「挂账不处理」防线（同旨先例 = `docs/core/design/STRUCTURE-DEBT.md` §1）。
**本册不承载单批设计正文**：修法住各批 §2 / 对应板块设计档（D2——本册只登记与路由）。

| # | 判据句（收录口径） | 说明 |
|---|---|---|
| 1 | **必录**：任一档 ≥ **700** 行 | = 距 800 硬限余量 ≤100 行——**一次实质改动带**（历史批净增实测常见 +9 … +95） |
| 2 | **必录**：任一档 ≥ **801** 行（越硬限） | 无豁免通道（判据 = `thincoder-cli/AGENTS.md:34` blocking）。现读 = **0 档**（越限面空） |
| 3 | **必录**：已有裁定 / 登记案在册（拆分计划 · 「不预拆」· 候选面——**无论读数**） | 裁定原文在批档 = 记录面；本册 = 转正后的活面（例 = `model-picker.mjs`「不预拆」案） |
| 4 | **随触碰补登**：>500 且 <700 的档 | 其所在面被触碰的批次在设计轮补登该行（含拆分立场）；**非全量普查**（先例 = VSC-DEBT §12.1 同注） |

**行维护**：① 任一档被触碰 → 该批设计轮刷新该行读数与触发状态（读数以批内实测为最终值——先例 = file-tier-sweep KD-25）；
② 拆分兑现（读数回落 <700 且无在册裁定）⇒ 行移入 §4「已消解」留证据行（防回潮——先例 = STRUCTURE-DEBT §3）；
③ 新增 ≥700 档由触碰批补登（本册**无机检门**——见 §3 尾项 3；CLI 侧无 `SOFT_LINE_REGISTRY` 对位面）。

## 2. 档位登记（现读 as-of 2026-09-25 · 二表）

### 2.1 表 A：≥700 全量（口径 §1-1——**0 档**；已消解移 §4：A4-D4 ∕ A1-D6）

| # | 档（`thincoder-cli/` 内） | 现读 | 余量 | 触发 / 状态 | 拆分计划 / 裁定（本册活面表述） | 裁定源（记录面） |
|---|---|---|---|---|---|---|

### 2.2 表 B：<700 · 裁定 / 登记案在册（口径 §1-3——0 档）

| # | 档（`thincoder-cli/` 内） | 现读 | 触发 / 状态 | 拆分计划 / 裁定（本册活面表述） | 裁定源（记录面） |
|---|---|---|---|---|---|

**表 B 说明**：本表 = 自冻结/历史记录**转正**的 <700 项（口径 §1-3）——转录自各批档 / 设计档既有登记句（逐条注源）· 2026-09-25 doc-face-closeout 批随触碰补登 1 行（B7——口径 §1-4）· 2026-09-27 env-config-purge 批随触碰补登 2 行（B8 / B9——本批 §3 轮次 1 发现 5：越 300 咨询线的 <400 未登记档）。
**并入完整性**：本册首版并入 = 台账 #340 指名项（A1 / A4 / A5 / A7 孤儿 + A1 转正）+ file-tier-sweep / busy-queue-visible / edit-arg-guard / small-debt-batch / hygiene-ab / toolface-fixes 六批在册登记项；
其余历史批档登记项如有遗漏，随该档下次触碰并入（非全量普查——先例 = VSC-DEBT §12.1）。

## 3. 结构 / 一致性尾项登记（未结）

| # | 项 | 现状（as-of 2026-09-25） | 到期 / 触发 |
|---|---|---|---|
| T1 | `session gc` / `session index` 旗标补全（bash / zsh / fish **三套皆缺**） | 三套只补子命令名面，无 `--dry-run` / `--confirm` / `--status` / `--rebuild`（实装旗标面 = `thincoder-cli/bin/thincoder.mjs:120-125` USAGE 行） | 该命令面 ∨ 补全面下次触碰 |
| T3 | 补全面 / 命令清单**全量**机检锁缺位 | **cli-small-items 批**窄射程锁（sweep 旗标 + `ledger` 顶层词）宿主 = `thincoder-cli/test/memory-sweep-cli.test.mjs`——**该档随 2026-09-28 测试树全清令退役**（常驻重建挂台账 #590 面）⇒ 窄锁现缺位；本批 ledger 补全（#677 I8）锁面 = 批内件（单测树重建时回迁）；其余命令 / 旗标条目无锁（漂移史 = **cli-small-items 批** #350 三件） | 立全量锁单批 ∨ 补全面下次实质改动（重建时同落）（迁移期引文） |

## 4. 已消解（勿当债——留证据行，防回潮）

| # | 原项 | 消解证据（实核） |
|---|---|---|
| D1 | `test/busy-injection.test.mjs` **474**（越线档登记项） | 2026-09-25 file-tier-sweep 批 S4 拆三档：留守 209 · `test/busy-injection-render.test.mjs` 155 · `test/busy-injection-consume.test.mjs` 198——三档均 <400 ⇒ 移出（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| D2 | `thincoder-cli/src/tui/index.mjs` **499** · `thincoder-cli/src/tui/key-handler.mjs` **498**（贴硬限两档） | 2026-09-22 structure-debt 批拆分兑现（`src/tui/input-face.mjs` 等新档）——现读 **227 / 124** ⇒ 移出 |
| D3 | §3-T4：CLI 命令入口面（`bin` 分发 / `USAGE` / shell 补全发射）设计档归属缺位 | 2026-09-25 cli-small-items 批：#350 载体收口——载体 = `docs/cli/design/CLI-ENTRY.md`（新建 · 命令树 / 补全发射契约 / #350 机检形迁入）+ `docs/README.md` §4 登记同批 ⇒ 归属缺位消解 |
| D4 | A4：`bin/thincoder.mjs` **499**（贴 500 硬限——命令分发表外提触发已到） | 拆档批 R4 兑现（2026-09-28）：命令分发表外提 ⇒ `bin/thincoder.mjs` **178** · `src/command-table.mjs` **186** · `src/command-interactive.mjs` **187**（缝 = 同名转口 ∕ `ctx` 注入；三档均 <400）；MS-1 读取面同批随动（`docs/cli/design/CLI-ENTRY.md` §4）⇒ 移出 |
| D5 | B8 `test/doc-check.test.mjs` **340**（越 300 咨询线登记——env-config-purge 批首登） | 档随 2026-09-28 测试树全清令退场（现盘 `thincoder-cli/test/` 零 `.test.mjs`——实读 2026-09-29；常驻重建挂台账 #590 面）⇒ 登记面消解（迁移期引文） |
| D6 | A1：`src/tui/model-picker.mjs` **499**（贴 500 硬限——「触发式 · 不预拆」案在册） | 2026-09-29 structure-split-2 批拆分兑现：渠道管理四流 + `cascadeRemoveProvider` 出档 ⇒ `thincoder-cli/src/tui/provider-admin.mjs` **213**；主档 **316**（<400）⇒ 移出（`pickers.mjs` 注释指针一行级随批 ∥ import ∥ 装配面零改） |

| D7 | §3-T2 ledger 补全缺口（三套皆缺） | 2026-09-30 crossline-clearance 批 I8 兑现——三套补 `migrate` ∕ `audit` 子命令 + 旗标（`--dry-run` ∕ `--confirm` ∕ `--from` ∕ `--root`；建议形 = 核解析空格形）：`thincoder-cli/src/completions.mjs` **126 → 136**（实读） |

## 5. 边界（本册不做）

- 不承载单批设计正文（修法住各批 §2 / 对应板块设计档——同 STRUCTURE-DEBT §1 口径）。
- 不做 500–700 带全量普查（口径 §1-4）；不设常驻机检门（见 §3-T3）。
- 不代裁需求面（`docs/cli/requirements/**` = 主 agent 笔）；本册判据源 = CLI 产品约定 + 各批裁定（需求侧档位判据句缺位 = 上抛项，见批档 §2）。

## 变更记录

- 2026-10-08（**代码长度上限 500/800 口径更换批 · 实施轮 · eng-coder**——承 `docs/batches/2026-10-08-code-limit-500-800.md` §2 · 台账 #1072）：§1 判据句改数（300/400/500 ⇒ 500/700/800）+ §2 表 A/B 登记行清账（丙——义务前提随新线消失；表壳留守）+ §5 边界带随动（300–399 ⇒ 500–700）。**零新语义**（可 revert）。

- 2026-09-30（**crossline-clearance 批 · 实施后随动轮 · eng-designer**——承 `docs/batches/2026-09-30-crossline-clearance.md` §2.13）：§3-T2 兑现移 §4-D7（ledger 补全已落——#677 I8）；§3-T3 窄锁宿主退役收正。**零新语义**。

- 2026-09-29（**doc-sync-carryover 批 · 文档随动族收正轮 · eng-designer**——承 `docs/batches/2026-09-29-doc-sync-carryover.md` §1 · 台账 #647）：B8 行（`doc-check 用例档` **340**——越 300 咨询线登记）随 2026-09-28 测试树全清令退场 ⇒ 移 **§4-D5**；表 B 计数 **8 ⇒ 7 档**。**零语义**（登记面随实读）。

- 2026-09-25（**doc-face-closeout 批 · 设计评审修正轮 1（发现 4）· eng-designer**——承 `docs/batches/2026-09-25-doc-face-closeout.md` §3 轮次 1）：本批触碰档逐档刷新（口径 §1-2 行维护①）——A9 / A10 补**本批不拆结论 + 抽取候选线**；表 B +1 行（B7 = `tui-memory-budget 用例档` 334——口径 §1-4 随触碰补登）；表头计数 6 → 7（D3）。

- 2026-09-25（**cli-small-items 批 · 设计修正轮 · 评审轮 1 发现 1/4/5/11 收正**）：§3-T2 现状收正（「已补」→「本批补」——设计 §2 #350③；实施 = 该档 §5）；
  §2.1 A4 增耦合注（外提执行批须同批改 MS-1 源码读取面）；A9 / B4 裁定源改引批档（旧活登记两处已指针化 = `docs/cli/design/TUI.md` §6.8.3.4 / `docs/core/design/DOC-DISCIPLINE.md` §3.10）；
  §3-T4 消解移档 ⇒ §4-D3（载体 = `docs/cli/design/CLI-ENTRY.md` 新建 · #350 契约迁入）。

- 2026-09-25（**cli-small-items 批 · 台账 #340 载体收口**）：建档——台账「CLI 档位登记载体缺位」指定本册为载体（承 file-tier-sweep KD-26「不新造册 · 缺口上报」⇒ 本批 = 缺口收口）。
  ① 收录口径四判据句（§1）；② 表 A ≥400 全量 15 档 + 表 B <400 裁定在册 6 档（逐条注裁定源）；③ `model-picker.mjs`「不预拆」案转正（A1，原文在冻结批档 §:91 / §:197）；
  ④ §3 尾项四项 · §4 已消解两行（busy-injection 拆三档 / structure-debt 两档兑现）；⑤ 行数口径与读数 as-of 写明（§ 档头）。

- 2026-09-27（**env-config-purge 批 · 设计评审轮 1 修正轮 · eng-designer**——承 `docs/batches/2026-09-27-env-config-purge.md` §3 轮次 1 发现 5）：A4 读数刷新（**482 → ≈492**——本批 +10；余量 18 → ≈8）+ 
  **B 表补登 2 行**（B8 `doc-check 用例档` **332** · B9 `provider-error-surface 用例档` **309**——越 300 咨询线的 <400 未登记档）+ 档数句 **7 → 9** + 表说明同步。**零语义**（读数与登记面）。

- 2026-09-27（**env-config-purge 批 · 收口轮 · eng-designer**——承该批 §5 实施实证）：A4 读数刷新 **499**（余 **1**——注「余量 ≤1 期间禁增；命令分发表外提须先于该档下次触碰」）· B8 读数刷新 **340**（「±0 行」注撤）。**零语义**（读数与登记面）。

- 2026-09-29（**doc-sync-residuals 批 · 设计面残留收正轮 · eng-designer**——承 `docs/batches/2026-09-28-tech-debt-closeout.md` §1.19 收正行 ⑥）：表 A 补登 **A16** `src/tui/agent-turn.mjs` **407**（#448② 实改档：386 ⇒ 407 · +21——越 400 首登 + 拆分预案）；B2 行转正移出（表 A 14 ⇒ **15 档** · 表 B 9 ⇒ **8 档**）。**零语义**（登记面）。

- 2026-09-28（**文档回填与卫生轮**（台账 #516）· eng-designer——同批同笔补记）：`:40` ∕ `:41` 「2026-09-25 本批」两义逐处指名落笔批（**doc-face-closeout 批**——#377 消解径）；B7 ∕ B8 ∕ T2 ∕ T3 的「本批」逐处指名（doc-face-closeout ∕ env-config-purge ∕ cli-small-items）；
  `thincoder-cli/test/memory-sweep-cli.test.mjs` 两处「（拟新增）」按盘去标（`:35` ∕ `:72`——在盘为实）。**零新语义**。

- 2026-09-29（**micros 批 · 档面波（解冻后）· eng-designer**——承 `docs/batches/2026-09-29-desktop-micros.md` §2 档面笔清单 P5）：B5 读数刷新 **341 ⇒ 210**（届盘实读 2026-09-29——B1-P3 取核重写 + #576 笔后）。**零语义**（读数与登记面）。

- 2026-09-29（**doc-backfill 批 · 波 1 · eng-designer**——承 `docs/batches/2026-09-29-doc-backfill.md` §2 · 台账 #598）：表 A 四行读数刷新（口径 §1-2 行维护①——stall-indicator 批触碰后届盘实读）：A9 **453 ⇒ 462**（余 38）· A10 **449 ⇒ 454**（余 46）· A12 **434 ⇒ 447**（余 53）· A16 **407 ⇒ 418**（余 82）。**零语义**（读数与登记面）。
- 2026-10-01（**缺陷修复批收口 ∥ 零语义清账批列报 · 主 agent 笔〔③ 类机械 · 可 revert〕**——承 `docs/batches/2026-09-30-defect-fixes.md` §6 ∥ `docs/batches/2026-10-01-zero-semantic-sweep.md` §2.13）：表 A **A16 读数刷新 418 ⇒ 422**（届盘实读——余量 82 ⇒ 78）。**零语义**（读数与登记面）。

- 2026-09-29（**structure-split-2 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-09-29-structure-split-2.md` §1 ∕ §2.2-A · 台账 #620）：**A1 行转「本批执行」**（届盘实读 499 未变；两段切点 ∕ 预算 ≈315 ∕ ≈200 落行；`pickers.mjs` **import ∥ 装配面零改**——注释指针一行级随批）；拆后行移 §4 已消解 = 实施轮义务。**零语义**（登记面 ∕ 方案落位）。

- 2026-09-29（**structure-split-2 批 · 收口轮（文档面回填）· eng-designer**——承批档 `docs/batches/2026-09-29-structure-split-2.md` §5 · 台账 #620）：A1 行兑现转出——拆分落盘后实读 **316** ∥ 新档 `thincoder-cli/src/tui/provider-admin.mjs` **213**；按 §1-2② 行维护规则移 **§4-D6**（留证据行 · 防回潮）；表 A 计数 **15 ⇒ 14 档**。**零语义**（登记面随实读）。

- 2026-09-30（**采集收网批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-heap-snapshot-switch.md` §2）：A6 行随触碰刷新（**472 ⇒ ≈490**——设计轮读数；**终值 = 488**——实施轮实读，2026-09-30；`diagnostics.heapSnapshot` 菜单项 ∥ 处理支）——未预拆维持 + 余量贴限注。**零新语义**（登记面）。
