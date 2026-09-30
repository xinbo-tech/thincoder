# CLI 产品树残留债（CLI-DEBT）· CLI 面 · 设计

> 板块 = **CLI 产品树残留债**——`thincoder-cli/**` 的**档位（行数档）登记活账** + 结构 / 一致性尾项登记。
> 对位册 = `docs/vsc/design/VSC-DEBT.md` §12.1（VSC 越档登记）· `docs/core/design/CORE-UNIFICATION.md` §2.8.1（核内逐档行数与拆分计划）。
> 判据源 = `thincoder-cli/AGENTS.md:34`（单档 >300 行 = advisory · >500 行 = blocking）+ 各批既有裁定（逐条注源；**裁定原文住各批档 = 记录面，本册 = 转正后的活面**）。
> 建档：2026-09-25（**cli-small-items 批 · 台账 #340 载体收口**——承 `docs/batches/2026-09-25-file-tier-sweep.md` KD-26「不新造册 · 缺口上报」；本批 = 缺口收口：指定本册为载体）。
> 行数口径 = `wc -l`（`= split("\n").length - 1`，与核机检同式）；读数 **as-of 2026-09-25 设计轮实读**（未动档不重锚）。
> 论域 = `thincoder-cli/**`（`node_modules/` · `docs/_archive/` 除外；含 `bin/` `src/` `test/`）。

## 1. 定位与收录口径（判据句）

**定位**：CLI 树越线档的**唯一活登记面**——「挂账不处理」防线（同旨先例 = `docs/core/design/STRUCTURE-DEBT.md` §1）。
**本册不承载单批设计正文**：修法住各批 §2 / 对应板块设计档（D2——本册只登记与路由）。

| # | 判据句（收录口径） | 说明 |
|---|---|---|
| 1 | **必录**：任一档 ≥ **400** 行 | = 距 500 硬限余量 ≤100 行——**一次实质改动带**（历史批净增实测常见 +9 … +95） |
| 2 | **必录**：任一档 ≥ **501** 行（越硬限） | 无豁免通道（判据 = `thincoder-cli/AGENTS.md:34` blocking）。现读 = **0 档**（越限面空） |
| 3 | **必录**：已有裁定 / 登记案在册（拆分计划 · 「不预拆」· 候选面——**无论读数**） | 裁定原文在批档 = 记录面；本册 = 转正后的活面（例 = `model-picker.mjs`「不预拆」案） |
| 4 | **随触碰补登**：>300 且 <400 的档 | 其所在面被触碰的批次在设计轮补登该行（含拆分立场）；**非全量普查**（先例 = VSC-DEBT §12.1 同注） |

**行维护**：① 任一档被触碰 → 该批设计轮刷新该行读数与触发状态（读数以批内实测为最终值——先例 = file-tier-sweep KD-25）；
② 拆分兑现（读数回落 <400 且无在册裁定）⇒ 行移入 §4「已消解」留证据行（防回潮——先例 = STRUCTURE-DEBT §3）；
③ 新增 ≥400 档由触碰批补登（本册**无机检门**——见 §3 尾项 3；CLI 侧无 `SOFT_LINE_REGISTRY` 对位面）。

## 2. 档位登记（现读 as-of 2026-09-25 · 二表）

### 2.1 表 A：≥400 全量（口径 §1-1——**14 档**；已消解移 §4：A4-D4 ∕ A1-D6）

| # | 档（`thincoder-cli/` 内） | 现读 | 余量 | 触发 / 状态 | 拆分计划 / 裁定（本册活面表述） | 裁定源（记录面） |
|---|---|---|---|---|---|---|
| A2 | `test/advisor-chain-guards.test.mjs` | **488** | 12 | 触发 = 后续任何新增（结论块断言扩面 / 新 kind）⇒ **先按组拆** | E 组冻结窗口（T-CG15–T-CG18 ≈91 行）→ `test/advisor-freeze-window.test.mjs`（拟新增）；B 组凭证链（T-CG6–T-CG8 ≈82 行）→ `test/advisor-credential-chain.test.mjs`（拟新增）——组内自持夹具、切点零交叉 | `docs/batches/2026-09-18-advisor-face.md` §2.7 发现 4 收正行 （机检豁免——用例退场登记） |
| A3 | `test/edit-tool-improvement.test.mjs` | **486** | 14 | 触发 = 再增用例先拆（本批 +95 后仍 <500） | 核例族 / 桥例族二分（桥 4 例自带 `buildAcpCallbacks` harness——天然切点）→ `test/edit-bridge.test.mjs`（拟新增） | `docs/batches/2026-09-25-edit-arg-guard.md` 受影响表行 + `docs/batches/2026-09-25-file-tier-sweep.md` §2 S5-⑤ |
| A5 | `test/settings.test.mjs` | **480** | 20 | 触发式（未预拆——越 500 前 ∨ 下次实质触碰） | 候选面（评估项）：T-S3 族（引号 / 解析形态 T-S3.1–S3.3）∥ 防漂移族（T-S2.13–S2.15）分档（用例族 + 夹具自持——先例 = file-tier-sweep KD-23；同判据下的另立档先例 = `test/settings-mask.test.mjs`） | 本册首登（孤儿——台账 #340 指名）；线源 = `docs/batches/2026-09-18-settings-mask.md` §:99（D-ST15） （机检豁免——用例退场登记） |
| A6 | `src/tui/cmd-config.mjs` | **472 ⇒ 488**（采集收网批 +16——`diagnostics.heapSnapshot` 菜单项 ∥ 处理支；终值 = 实施轮实读 · 2026-09-30） | **12** | 触发式（未预拆维持——增量性加项 ∥ 非结构改；**余量贴限**——下次触碰先拆） | 候选面（评估项）：`handleConfigCommand` 菜单族 / 配置读写族分面 | 本册首登（≥400 普查面） |
| A7 | `test/acp-contract.test.mjs` | **461** | 39 | 触发式（未预拆） | 候选面（评估项）：按族二分——认证族（`:97-153`）/ 会话方法族（`:154-243`）/ 无 TTY 冒烟族（`:365` 起） | 本册首登（孤儿——台账 #340 指名）；读数口径前批 = `docs/batches/2026-09-22-pending-triage.md`（363 → ~393 越线口径行） |
| A8 | `src/tui/render-conversation.mjs` | **460** | 40 | 触发式（未预拆——前批登记「~467 候选」按现读刷新） | 候选面（评估项）：待发送块派生面（排队块 + 缓存键签名）抽档 | `docs/batches/2026-09-24-busy-queue-visible.md` §:454（300 线档位登记行） |
| A9 | `src/tui/subagent-blocks.mjs` | **462**（读数 as-of 2026-09-29 · **doc-backfill 批**实读） | 38 | 触发式（未预拆）· **doc-face-closeout 批触碰**（注释改指 · 行数守恒）⇒ **不拆**（理由 = 零结构改 + Δ0） | 候选面（评估项）：子代理事件路由族（`routeSub*` `:148`–`:382` ≈235 行）∥ 压缩面板族分面——**抽取候选线 = 压缩面板族**（`liveCompressPanel` `:383`–`markCompressFallback` `:453` ≈71 行 → `subagent-compress.mjs`〔拆分计划目标 · 裸名形态〕；原档 re-export 保持） | `docs/batches/2026-09-17-subagent-zero-block.md` §:292 · `docs/batches/2026-09-17-async-face-fixes.md` §:358 · `docs/batches/2026-09-25-doc-face-closeout.md` §2 |
| A10 | `src/tui/tool-events.mjs` | **454**（读数 as-of 2026-09-29 · **doc-backfill 批**实读） | 46 | 触发式（未预拆）· **doc-face-closeout 批触碰**（注释改指 · 行数守恒）⇒ **不拆**（理由 = 零结构改 + Δ0） | 候选面（评估项）：`buildToolCallbacks` 单体即档主体（`:61`–末）——按回调族分面；**抽取候选线 = 尾部回调族**（`onCompressStart` `:378`–`onTurnEnd` `:446` ≈69 行 → `tool-events-signals.mjs`〔拆分计划目标 · 裸名形态〕） | `docs/batches/2026-09-15-core-defect-fixes.md` §:131（增量近零 ⇒ 不设拆分计划判据句）· `docs/batches/2026-09-25-doc-face-closeout.md` §2 |
| A11 | `test/model-ref.test.mjs` | **432** | 68 | 触发式（未预拆） | 候选面（评估项）：picker harness（`miniPickers` / `pickerHarness`）与用例族分档 | 本册首登（≥400 普查面） |
| A12 | `src/tui/render-frame.mjs` | **447**（读数 as-of 2026-09-29 · **doc-backfill 批**实读） | 53 | 触发式（未预拆） | 候选面（评估项）：§7 状态栏 / `enterHint` 面抽档 | `docs/batches/2026-09-24-busy-queue-visible.md` §:456 |
| A13 | `test/session-store.test.mjs` | **416** | 84 | 触发式（未预拆） | 候选面（评估项）：按用例族 + 夹具自持分档（先例 = KD-23） | 本册首登（≥400 普查面） |
| A14 | `test/async-settle.test.mjs` | **411** | 89 | 触发式（未预拆） | 候选面（评估项）：digest 批量预算族（`:242` 起）/ 四族接线族（`:339` 起）二分 | 本册首登（≥400 普查面） |
| A15 | `test/input-lock.test.mjs` | **403** | 97 | 触发式（未预拆） | 候选面（评估项）：busy 门禁族用例抽档 | `docs/batches/2026-09-24-busy-queue-visible.md` §:458 · `docs/batches/2026-09-19-upstream-channel-availability.md` §:116 |
| A16 | `src/tui/agent-turn.mjs` | **418**（读数 as-of 2026-09-29 · **doc-backfill 批**实读） | 82 | 触发式（未预拆）· **越 400 首登**（#448② 实改档：386 ⇒ 407 · +21） | 候选面：送达 ∕ 兜底面抽档（原案）；回合收口层（`runAgentTurnInner` 重武装守卫族）为 #448② 后档内新主体面——拆点届盘按现盘择一 | 原 B2 行转正（源 = `docs/batches/2026-09-24-busy-queue-visible.md` §:459）+ `docs/batches/2026-09-28-tech-debt-closeout.md` §1.19 收正行 ⑥ |

### 2.2 表 B：<400 · 裁定 / 登记案在册（口径 §1-3——7 档）

| # | 档（`thincoder-cli/` 内） | 现读 | 触发 / 状态 | 拆分计划 / 裁定（本册活面表述） | 裁定源（记录面） |
|---|---|---|---|---|---|
| B1 | `src/acp/bridge.mjs` | **397** | 触发式（未预拆） | 候选两面：桥 edit 路由族（`editSingle` / `editBatch` / `toolRouter`）与历史回放（`replayHistory`） | `docs/batches/2026-09-25-edit-arg-guard.md` 受影响表行 + file-tier-sweep §2 S5-⑤ |
| B3 | `test/ledger-surface.test.mjs` | **378** | 触发式（未预拆） | 越线登记 + 触发式拆分（>300 advisory——CLI 侧无机检门） | `docs/batches/2026-09-25-hygiene-ab.md` §:194 |
| B4 | `test/memory-scan-bounds.test.mjs` | **371** | 触发式（不拆登记在册） | 「不拆」登记（±2 零结构改）；拆分 = 其面下次实质改动时重判 | `docs/batches/2026-09-20-small-debt-batch.md` §:106 |
| B5 | `thincoder-cli/src/tui/suspension-drive.mjs` | **210**（实读 2026-09-29——B1-P3 取核重写后） | 触发式（未预拆） | 候选面：driver 步骤面抽档 | `docs/batches/2026-09-24-busy-queue-visible.md` §:460 |
| B6 | `test/subagent-observe-send.test.mjs` | **330** | 触发式（不下拆判定） | 「既有超软线 · 增量小 / 非结构改 ⇒ 拆分另议」在册 | `docs/batches/2026-09-18-toolface-fixes.md` §:75 |
| B7 | `test/tui-memory-budget.test.mjs` | **334** | 触发式（不拆登记在册）· **doc-face-closeout 批触碰**（注释改指 · ±0 行） | **该批不拆**：理由 = 零结构改 + Δ0；**抽取候选线 = U 族**（占用账 / 保底 / 步进 / 收据 / 占位行移除，`:217`–`:315` ≈99 行 → `tui-memory-account.test.mjs`〔拆分计划目标 · 裸名形态〕——组内夹具 `mkState` / `mkCallbacks`（`:35` / `:45`）随组同迁）；触发 = 越 500 ∨ 该档下次实质改动 | `docs/batches/2026-09-25-doc-face-closeout.md` §2（口径 §1-4 随触碰补登） |
| B9 | `test/provider-error-surface.test.mjs` | **309** | 触发式（未预拆） | 候选面（评估项）：按 provider 族分档（anthropic / openai / responses）；触发 = 越 500 ∨ 该档下次实质改动 | 本册首登（env-config-purge 批 §3 轮次 1 发现 5——越 300 咨询线登记） |

**表 B 说明**：本表 = 自冻结/历史记录**转正**的 <400 项（口径 §1-3）——转录自各批档 / 设计档既有登记句（逐条注源）· 2026-09-25 doc-face-closeout 批随触碰补登 1 行（B7——口径 §1-4）· 2026-09-27 env-config-purge 批随触碰补登 2 行（B8 / B9——本批 §3 轮次 1 发现 5：越 300 咨询线的 <400 未登记档）。
**并入完整性**：本册首版并入 = 台账 #340 指名项（A1 / A4 / A5 / A7 孤儿 + A1 转正）+ file-tier-sweep / busy-queue-visible / edit-arg-guard / small-debt-batch / hygiene-ab / toolface-fixes 六批在册登记项；
其余历史批档登记项如有遗漏，随该档下次触碰并入（非全量普查——先例 = VSC-DEBT §12.1）。

## 3. 结构 / 一致性尾项登记（未结）

| # | 项 | 现状（as-of 2026-09-25） | 到期 / 触发 |
|---|---|---|---|
| T1 | `session gc` / `session index` 旗标补全（bash / zsh / fish **三套皆缺**） | 三套只补子命令名面，无 `--dry-run` / `--confirm` / `--status` / `--rebuild`（实装旗标面 = `thincoder-cli/bin/thincoder.mjs:120-125` USAGE 行） | 该命令面 ∨ 补全面下次触碰 |
| T3 | 补全面 / 命令清单**全量**机检锁缺位 | **cli-small-items 批**窄射程锁（sweep 旗标 + `ledger` 顶层词）宿主 = `thincoder-cli/test/memory-sweep-cli.test.mjs`——**该档随 2026-09-28 测试树全清令退役**（常驻重建挂台账 #590 面）⇒ 窄锁现缺位；本批 ledger 补全（#677 I8）锁面 = 批内件（单测树重建时回迁）；其余命令 / 旗标条目无锁（漂移史 = **cli-small-items 批** #350 三件） | 立全量锁单批 ∨ 补全面下次实质改动（重建时同落） |

## 4. 已消解（勿当债——留证据行，防回潮）

| # | 原项 | 消解证据（实核） |
|---|---|---|
| D1 | `test/busy-injection.test.mjs` **474**（越线档登记项） | 2026-09-25 file-tier-sweep 批 S4 拆三档：留守 209 · `test/busy-injection-render.test.mjs` 155 · `test/busy-injection-consume.test.mjs` 198——三档均 <400 ⇒ 移出 |
| D2 | `thincoder-cli/src/tui/index.mjs` **499** · `thincoder-cli/src/tui/key-handler.mjs` **498**（贴硬限两档） | 2026-09-22 structure-debt 批拆分兑现（`src/tui/input-face.mjs` 等新档）——现读 **227 / 124** ⇒ 移出 |
| D3 | §3-T4：CLI 命令入口面（`bin` 分发 / `USAGE` / shell 补全发射）设计档归属缺位 | 2026-09-25 cli-small-items 批：#350 载体收口——载体 = `docs/cli/design/CLI-ENTRY.md`（新建 · 命令树 / 补全发射契约 / #350 机检形迁入）+ `docs/README.md` §4 登记同批 ⇒ 归属缺位消解 |
| D4 | A4：`bin/thincoder.mjs` **499**（贴 500 硬限——命令分发表外提触发已到） | 拆档批 R4 兑现（2026-09-28）：命令分发表外提 ⇒ `bin/thincoder.mjs` **178** · `src/command-table.mjs` **186** · `src/command-interactive.mjs` **187**（缝 = 同名转口 ∕ `ctx` 注入；三档均 <400）；MS-1 读取面同批随动（`docs/cli/design/CLI-ENTRY.md` §4）⇒ 移出 |
| D5 | B8 `test/doc-check.test.mjs` **340**（越 300 咨询线登记——env-config-purge 批首登） | 档随 2026-09-28 测试树全清令退场（现盘 `thincoder-cli/test/` 零 `.test.mjs`——实读 2026-09-29；常驻重建挂台账 #590 面）⇒ 登记面消解 |
| D6 | A1：`src/tui/model-picker.mjs` **499**（贴 500 硬限——「触发式 · 不预拆」案在册） | 2026-09-29 structure-split-2 批拆分兑现：渠道管理四流 + `cascadeRemoveProvider` 出档 ⇒ `src/tui/provider-admin.mjs` **213**；主档 **316**（<400）⇒ 移出（`pickers.mjs` 注释指针一行级随批 ∥ import ∥ 装配面零改） |

| D7 | §3-T2 ledger 补全缺口（三套皆缺） | 2026-09-30 crossline-clearance 批 I8 兑现——三套补 `migrate` ∕ `audit` 子命令 + 旗标（`--dry-run` ∕ `--confirm` ∕ `--from` ∕ `--root`；建议形 = 核解析空格形）：`thincoder-cli/src/completions.mjs` **126 → 136**（实读） |

## 5. 边界（本册不做）

- 不承载单批设计正文（修法住各批 §2 / 对应板块设计档——同 STRUCTURE-DEBT §1 口径）。
- 不做 300–399 带全量普查（口径 §1-4）；不设常驻机检门（见 §3-T3）。
- 不代裁需求面（`docs/cli/requirements/**` = 主 agent 笔）；本册判据源 = CLI 产品约定 + 各批裁定（需求侧档位判据句缺位 = 上抛项，见批档 §2）。

## 变更记录

- 2026-09-30（**crossline-clearance 批 · 实施后随动轮 · eng-designer**——承 `docs/batches/2026-09-30-crossline-clearance.md` §2.13）：§3-T2 兑现移 §4-D7（ledger 补全已落——#677 I8）；§3-T3 窄锁宿主退役收正。**零新语义**。

- 2026-09-29（**doc-sync-carryover 批 · 文档随动族收正轮 · eng-designer**——承 `docs/batches/2026-09-29-doc-sync-carryover.md` §1 · 台账 #647）：B8 行（`test/doc-check.test.mjs` **340**——越 300 咨询线登记）随 2026-09-28 测试树全清令退场 ⇒ 移 **§4-D5**；表 B 计数 **8 ⇒ 7 档**。**零语义**（登记面随实读）。

- 2026-09-25（**doc-face-closeout 批 · 设计评审修正轮 1（发现 4）· eng-designer**——承 `docs/batches/2026-09-25-doc-face-closeout.md` §3 轮次 1）：本批触碰档逐档刷新（口径 §1-2 行维护①）——A9 / A10 补**本批不拆结论 + 抽取候选线**；表 B +1 行（B7 = `test/tui-memory-budget.test.mjs` 334——口径 §1-4 随触碰补登）；表头计数 6 → 7（D3）。

- 2026-09-25（**cli-small-items 批 · 设计修正轮 · 评审轮 1 发现 1/4/5/11 收正**）：§3-T2 现状收正（「已补」→「本批补」——设计 §2 #350③；实施 = 该档 §5）；
  §2.1 A4 增耦合注（外提执行批须同批改 MS-1 源码读取面）；A9 / B4 裁定源改引批档（旧活登记两处已指针化 = `docs/cli/design/TUI.md` §6.8.3.4 / `docs/core/design/DOC-DISCIPLINE.md` §3.10）；
  §3-T4 消解移档 ⇒ §4-D3（载体 = `docs/cli/design/CLI-ENTRY.md` 新建 · #350 契约迁入）。

- 2026-09-25（**cli-small-items 批 · 台账 #340 载体收口**）：建档——台账「CLI 档位登记载体缺位」指定本册为载体（承 file-tier-sweep KD-26「不新造册 · 缺口上报」⇒ 本批 = 缺口收口）。
  ① 收录口径四判据句（§1）；② 表 A ≥400 全量 15 档 + 表 B <400 裁定在册 6 档（逐条注裁定源）；③ `model-picker.mjs`「不预拆」案转正（A1，原文在冻结批档 §:91 / §:197）；
  ④ §3 尾项四项 · §4 已消解两行（busy-injection 拆三档 / structure-debt 两档兑现）；⑤ 行数口径与读数 as-of 写明（§ 档头）。

- 2026-09-27（**env-config-purge 批 · 设计评审轮 1 修正轮 · eng-designer**——承 `docs/batches/2026-09-27-env-config-purge.md` §3 轮次 1 发现 5）：A4 读数刷新（**482 → ≈492**——本批 +10；余量 18 → ≈8）+ 
  **B 表补登 2 行**（B8 `test/doc-check.test.mjs` **332** · B9 `test/provider-error-surface.test.mjs` **309**——越 300 咨询线的 <400 未登记档）+ 档数句 **7 → 9** + 表说明同步。**零语义**（读数与登记面）。

- 2026-09-27（**env-config-purge 批 · 收口轮 · eng-designer**——承该批 §5 实施实证）：A4 读数刷新 **499**（余 **1**——注「余量 ≤1 期间禁增；命令分发表外提须先于该档下次触碰」）· B8 读数刷新 **340**（「±0 行」注撤）。**零语义**（读数与登记面）。

- 2026-09-29（**doc-sync-residuals 批 · 设计面残留收正轮 · eng-designer**——承 `docs/batches/2026-09-28-tech-debt-closeout.md` §1.19 收正行 ⑥）：表 A 补登 **A16** `src/tui/agent-turn.mjs` **407**（#448② 实改档：386 ⇒ 407 · +21——越 400 首登 + 拆分预案）；B2 行转正移出（表 A 14 ⇒ **15 档** · 表 B 9 ⇒ **8 档**）。**零语义**（登记面）。

- 2026-09-28（**文档回填与卫生轮**（台账 #516）· eng-designer——同批同笔补记）：`:40` ∕ `:41` 「2026-09-25 本批」两义逐处指名落笔批（**doc-face-closeout 批**——#377 消解径）；B7 ∕ B8 ∕ T2 ∕ T3 的「本批」逐处指名（doc-face-closeout ∕ env-config-purge ∕ cli-small-items）；
  `thincoder-cli/test/memory-sweep-cli.test.mjs` 两处「（拟新增）」按盘去标（`:35` ∕ `:72`——在盘为实）。**零新语义**。

- 2026-09-29（**micros 批 · 档面波（解冻后）· eng-designer**——承 `docs/batches/2026-09-29-desktop-micros.md` §2 档面笔清单 P5）：B5 读数刷新 **341 ⇒ 210**（届盘实读 2026-09-29——B1-P3 取核重写 + #576 笔后）。**零语义**（读数与登记面）。

- 2026-09-29（**doc-backfill 批 · 波 1 · eng-designer**——承 `docs/batches/2026-09-29-doc-backfill.md` §2 · 台账 #598）：表 A 四行读数刷新（口径 §1-2 行维护①——stall-indicator 批触碰后届盘实读）：A9 **453 ⇒ 462**（余 38）· A10 **449 ⇒ 454**（余 46）· A12 **434 ⇒ 447**（余 53）· A16 **407 ⇒ 418**（余 82）。**零语义**（读数与登记面）。

- 2026-09-29（**structure-split-2 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-09-29-structure-split-2.md` §1 ∕ §2.2-A · 台账 #620）：**A1 行转「本批执行」**（届盘实读 499 未变；两段切点 ∕ 预算 ≈315 ∕ ≈200 落行；`pickers.mjs` **import ∥ 装配面零改**——注释指针一行级随批）；拆后行移 §4 已消解 = 实施轮义务。**零语义**（登记面 ∕ 方案落位）。

- 2026-09-29（**structure-split-2 批 · 收口轮（文档面回填）· eng-designer**——承批档 `docs/batches/2026-09-29-structure-split-2.md` §5 · 台账 #620）：A1 行兑现转出——拆分落盘后实读 **316** ∥ 新档 `src/tui/provider-admin.mjs` **213**；按 §1-2② 行维护规则移 **§4-D6**（留证据行 · 防回潮）；表 A 计数 **15 ⇒ 14 档**。**零语义**（登记面随实读）。

- 2026-09-30（**采集收网批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-heap-snapshot-switch.md` §2）：A6 行随触碰刷新（**472 ⇒ ≈490**——设计轮读数；**终值 = 488**——实施轮实读，2026-09-30；`diagnostics.heapSnapshot` 菜单项 ∥ 处理支）——未预拆维持 + 余量贴限注。**零新语义**（登记面）。
