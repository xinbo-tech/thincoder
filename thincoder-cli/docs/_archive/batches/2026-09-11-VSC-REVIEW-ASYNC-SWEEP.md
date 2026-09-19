# VSC 评审链 / 异步残留收口（群 B）· 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分 · 已切除 2026-09-12）**：本档对端（VSC）份**已自本档切除**（原文不再留本仓——D11 完全态）；承载档 = VSC 仓 `docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP（VSC 仓）`（逐字搬运、零改写——D10）。
> 已切除条目清单：§2「VSC 仓」表 15 行（src 10 档 + 测试 5 档）——条目计数（对端份 / 本仓份）= 15 / 6（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。**源档 blob SHA（切除前）= `d295763ac0e2`**。
> 变更记录：2026-09-12——对端份经承载档逐字承接后自本档物理切除；档首注记形态收敛为「已切除」。
> 变更记录（收尾轮）：2026-09-12——§2 覆盖表 B1–B3 行（对端纯端条目）补切；承载档承接。

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-11 · 来源 = 用户 16:45「都一起做了」+ VSC 未做项普查（explore #148——48 项/4 群）。
> （父侧形态更正 2026-09-12：空占位行已清——实体内容见对应节；空占位 = 残留即先例）

---

## §1 讨论（主 agent）

### 一、范围（群 B = 评审链 / 异步残留 5 项）

| # | 条目 | 来源指针 |
|---|---|---|
| B1 | VSC advisor 池中止孤儿（`_asyncAdvisors` 仍 `clear()`、报告损——原判「§12.8 #1 登记不修」） | VSC `AGENT-LOOP.md:720` |
| B2 | VSC async 结算面 launchRefused 残留（写 priorOutput + round 0→1） | VSC `ADVISOR-CONVERGENCE.md:894` |
| B3 | VSC 子代理合入面 + bash/file_ops/execute/git/checkpoint/batch_segment 拒绝盲区 | VSC `ADVISOR-CONVERGENCE.md:893` |
| B4 | `estimateTokens` CJK 低估修正（**双端**） | `ADVISOR-CONVERGENCE.md:1146` |
| B5 | digest 注入预算扩面（consult 族 + 各族注入器绕过——分发点 `src/agent-tools/async-settle.mjs`） | `TODO.md:170` |

### 二、边界与前提

- **B1 的前提复议**：原判「登记不改（等值保留）」——用户 16:45「都一起做了」= 重新评估指令；设计需给出「修 / 维持登记」的重新论证（二择一须有理由，不许默认维持）；
- B2/B3 = §14.11 原「批准时登记」项 = 本批正当承接；
- B4/B5 涉双端（B5 分发点 CLJ 侧 + 各族注入器），设计需双端对位说明；
- 不含群 A（另批）；不自发扩面。

### 三、状态

**讨论收敛 2026-09-11 16:50**。下一步 = §2 批次任务（eng-designer）。

---

## §2 批次任务（eng-designer 写）


**状态：任务书就绪**（2026-09-11——需求层 + 设计/测试三层已落档，待设计评审；**B1 复议结论 = 修**（重新论证见 VSC 设计档 §15.1——非默认维持）；零阻塞裁定项）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 = CLI 仓 `docs/requirements/AGENT-LOOP.md` §11（B1/B5：F-I1 / F-I2 + N-I1~N-I3）
+ `docs/requirements/ADVISOR-CONVERGENCE.md` §13（B2/B3/B4：F30 / F31 / F32 + N22~N24）；
设计 = `AGENT-LOOP（VSC 仓）` §15（B1）/ §16（B5 镜像）+ `ADVISOR-CONVERGENCE（VSC 仓）` §17（B2/B3/B4-VSC）
· CLI 仓 `docs/design/ADVISOR-CONVERGENCE.md` §18（B4 语义源 + 对位登记）+ `docs/design/AGENT-LOOP.md` §22（B5 语义源）。

### 一、逐条覆盖表（§2 条目 = 设计档验收标准回指 = 需求档条目——三方一致）

| # | 批次条目 | 需求条目 | 设计落点 | 验收（AC） | 实施域 |
|---|---|---|---|---|---|
| B4 | estimateTokens CJK 低估（**双端**） | F32 | CLI ADVISOR-CONVERGENCE §18（语义源）+ VSC §17.3（VSC 面 / T-EST1~2） | AC-B4-CLI-1~2（CLI）/ AC-B4-1（VSC） | 双端：advisor/compaction + 测试档 |
| B5 | digest 注入预算扩面（**双端**） | F-I2 | CLI AGENT-LOOP §22（语义源）+ VSC AGENT-LOOP §16（VSC 镜像 / T-DG1~3） | AC-B5-CLI-1~3 / AC-B5-1~3 | 双端：digest-budget 新档 + 四族注入器 + 测试档 |

### 二、受影响文件全清单（行数 as-of 2026-09-11 实测——口径 `N lines total`）

**CLI 仓（src 4 档 + 测试 2 档）**

| 文件 | 现 | 预计 | 条目 |
|---|---|---|---|
| `src/advisor/compaction.mjs` | 171 | ~174 | B4 |
| `test/advisor-context-budget.test.mjs` | 101 | ~140 | B4（T-EST1~2） |
| `src/agent-tools/digest-budget.mjs` | 新 | ~70 | B5 |
| `src/agent-tools/subagent-async.mjs` | 474 | ~450（净减——迁出预算块 + re-export） | B5 |
| `src/agent-tools/consult.mjs` | 461 | ~465 | B5 |
| `test/async-settle.test.mjs` | 349 | ~390 | B5（T-DG1~3） |

**文档域（eng-designer 已落——coder 零碰）**：上「落档位置」所列 6 档 + `docs/TODO.md` 需求池行状态推进（待讨论 → 在途）。

### 三、验收标准（汇总——明细见各设计节；逐条回指需求）

- B1：AC-B1-1~4（VSC §15.6——T-D11~T-D13 绿 + subagent 面契约零回归 + CLI 仓零改）；B2：AC-B2-1（§17.6）；B3：AC-B3-1（§17.6）；B4：AC-B4-1（VSC §17.6）/ AC-B4-CLI-1~2（CLI §18.3）；B5：AC-B5-1~3（VSC §16.7）/ AC-B5-CLI-1~3（CLI §22.6）；
- 公共：两仓快层全绿；触碰档 `check-doc-width` 新增违规 0（本批落档后实测：VSC 仓全仓 0；CLI 仓本批触碰档 0——存量为他批批次档行，见报告）；实现档守 500 硬限（贴线注记 2 处（advisor-async / subagent-async）——越线停下报告，不硬压）；
- 零回归锚：既有 T-D3~T-D10 / T-VG16~21 / T-CB1~6 / BATCH-3 预算用例逐字零回归；ASCII 夹具断言逐值不变（B4）。

### 四、三态（需求 / 设计 / 测试三层）

- 需求层：**已落**（CLI 仓 §11 / §13——判定句逐条）；
- 设计层：**已落**（VSC §15 / §16 / §17 + CLI §18 / §22——含选型对比 / 契约 / 受影响文件 / 关键决策 / 用例表 / AC / 边界 / 零 UI 面声明）；
- 测试层：**已落（用例表）**——扩既有档、零新档（VSC 4 档 + CLI 2 档扩例；无 `test/files.mjs` 变更）；实施待设计评审 + 用户批准后由 eng-coder 落地。

### 五、不在本批（明确不做）

- 群 A 面（另批已闭）；§14.11 #1 / #2 / #3 不重开（#1/#2 已由 §16 收口；#3「sync 无在途窗口」维持登记）；
- CLI 侧 B1 / B2 / B3 对位面零改（登记：CLI ADVISOR §18.4 三项 + VSC AGENT-LOOP §12.8 #2 维持）；
- 不修 git / checkpoint / bash / execute 与子代理预闸面（登记 + 复核触发条件——VSC §17.2 表）；
- 不改结算语义本体 / 判定族 / 尾文案 / 比例系数 / cap / 凭证机制；不改提示词与 ENGINEERING-MODE 档；
- 不做跨会话丢弃追溯；不改 webview / 面板（零 UI 面——五条目全落）；
- 不建跨仓依赖 / 同步脚本；不新建文档档。

### 六、呈请知悉项（非阻塞）

1. **B1 复议结论 = 修**：§1 原判「登记不修」经现场复核推翻（缺陷实存——`run-stages.mjs:271-277` 仍 `advMap.clear()`；修法面全现成——谓词/池 accessor/墓碑/status 回显零新增；论证 VSC §15.1）——如欲维持原判请提出（设计层可回退为登记口径）；
2. **B3 分面处置（三修五登记）**：file_ops（拦 + 记）/ batch_segment（记）修；git / checkpoint / bash / execute / 子代理合入拦面维持登记（逐面理由与复核触发条件 = VSC §17.2 表）；
3. **并发落档说明**：设计落档期间 VSC AGENT-LOOP.md 有群 A A11 并发写入——本批两节顺延 §15 / §16（节内避撞注）；§13 尾部一处交错（重复的变更记录行）已修复。

**计数（D3）**：条目 5（B1~B5）· 需求条目 5（F-I1 / F-I2 / F30 / F31 / F32）+ NFR 6（N-I1~3 / N22~24）· 用例 13（五组——T-D11~13 / T-RS1~2 / T-FZ1~3 / T-EST1~2 / T-DG1~3；双端同型同 ID）· AC 17（B1 4 / B2 1 / B3 1 / B4 3 / B5 6 / 公共 2）· 实施域 21 档（VSC 15 / CLI 6——含测试档；新增档 2 = 双端 digest-budget.mjs）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；零新语义；本追加与上方文本冲突处，以本追加为准）

**背景**：轮次 1 VERDICT = pass（🔴0 · 🟡2 · 🔵4——发现表见 §3 轮次 1）；父侧裁决：**全部落修**、零新语义。本轮只改文档（VSC 设计两档 + 本档），`src/**` 与提示词零改动、未发起评审、未 commit。

**落修明细（逐条——file:line，行号 as-of 落修后 2026-09-11）**：

| # | 级别 | 落点 |
|---|---|---|
| 1 | 🟡 | VSC ADVISOR-CONVERGENCE §17.2：契约 2 补 `l3Paths` → `agent._touchedFiles` 同点记账（`:1322-1324`）· 契约 4 `_touchedFiles` 除外句（`:1327`）· 表 #7 陈旧记账 + 理由句（`:1316`）——子代理 file_ops 合入面缺口闭合；用例 T-FZ4（`:1369`）· AC-B3-1（`:1378`）· §17 计数「用例 7→8」（`:1392`）· §17.4 行 5 预计 ~290（`:1351`） |
| 2 | 🟡 | VSC AGENT-LOOP §12.3 C-9 收口注（`:656`——原「零改动」= 第 35 批排程口径；§16 净减迁出——照 §12.8 #1 / §14.11 同形） |
| 3 | 🔵 | 本档 §2 计数更正（与上方冲突处以下列为准）：三态·测试层「VSC 4 档」→ **5 档**（async-parity / advisor-guard-completion / batch-segment / advisor-context-budget / eng-settlement——与表头「测试 5 档」、D3「VSC 15」对齐）；D3 同步——用例 13 → **14**（T-FZ 组 = T-FZ1~4）、`test/advisor-guard-completion.test.mjs` 预计 ~280 → **~290** |
| 4 | 🔵 | VSC ADVISOR §17.4 贴线注「B2+B4」→「**B2+B5**」（`:1355`） |
| 5 | 🔵 | VSC AGENT-LOOP §16.3 `persistOverflowReport(raw, { cwd, tag })` 的 `tag` 落处注明——落盘文件名后缀（`:990`） |
| 6 | 🔵 | VSC AGENT-LOOP §1 模块地图 `subagent-scheduler.mjs` 两行合并（`:70` 合并后单行；发现表引 :68/:69，落档期并发漂移——实测 :69/:70） |

**变更加总**：VSC ADVISOR-CONVERGENCE（§17.2 · §17.4 · §17.5 · §17.6 · 计数 · 变更记录 :1425）+ VSC AGENT-LOOP（§1 · §12.3 · §16.3 · 变更记录 :41）。零契约语义变动。

**自检（D6 回读）**：落修明细逐条回读在位；VSC 仓 `check-doc-width` 全绿（新增违规 0）；本档追加后宽度 / 一致性复跑通过；`src/**` 零触碰、提示词零落笔、未发起评审。

## §3 设计评审（评审子代理）


### 轮次 1（评审子代理）

**群 B 批（VSC-REVIEW-ASYNC-SWEEP）§2 设计评审——发现表（6 项：🔴0 / 🟡2 / 🔵4）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Coverage（B3） | 🟡 | VSC ADVISOR-CONVERGENCE §17.2 表 #7（`ADVISOR-CONVERGENCE（VSC 仓）:1314`）理由句「陈旧记账**已有**（合入即记账）／判面已覆盖」对 file_ops 子案例过度声明：`mergeChildMutations`（`src/agent-tools/subagent-async.mjs:483-498`（VSC 仓））只搬运 `sink.touchedFiles`＝子代 `_touchedFiles`，而 `_touchedFiles` 仅在成功记账块（`src/agent/execute-tools.mjs:411-430`（VSC 仓）、push 于 :429）以 FILE_MUTATORS 为键入账；本批契约 2（同档 :1320）只扩 `recordFileMutation`（父/子各写各自载体）、契约 3（:1322）只补 batch_segment——子代理 file_ops 改被审档（move/copy/rename）既不被拦（子代理面预闸不可达）、也不进父侧变更事件、亦未显式登记为该子面残余。 | 契约 2 键同扩时同步把 l3Paths 记入 `_touchedFiles`（子代即随 merge 合入父侧）；或 §17.2 #7 理由句改为「FILE_MUTATORS + batch_segment 已覆盖；file_ops 子代理写残余登记（复核触发随表）」——二择一，勿留未声明缺口。 |
| 2 | Doc-state（B5） | 🟡 | VSC AGENT-LOOP §12.3 C-9（`AGENT-LOOP（VSC 仓）:659`）声明「`subagent-async.mjs` **零改动**（499 行贴线——不越 500）」，本批 §16.4（同档 :1010）将该档列为改动档（499→~470 净减迁出 + D-DG4 re-export，:1002），§16 头（:968）冻结面却写「§5 / §9 / §12 / §15 已交付契约零碰」——C-9 该句无收口/限定注。 | 按 §12.8 #1 / §14.11 收口注口径加一行：原「零改动」= 第 35 批排程口径；本批 §16 以净减方式迁出预算块（§12 冻结限「语义零改」）。 |
| 3 | 计数 | 🔵 | 批次档 §2 三态行「VSC 4 档」（`thincoder-cli/docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md:99`）与同档表头「测试 5 档」（:56）及 D3「VSC 15」（:116）不一致；档列实为 5 档（async-parity / advisor-guard-completion / batch-segment.test / advisor-context-budget / eng-settlement）。 | 4 → 5。 |
| 4 | Clarity | 🔵 | VSC §17.4 贴线注记（`ADVISOR-CONVERGENCE（VSC 仓）:1352`）「若实施越 500：先落 B2+**B4** 实测行数」——B4 落 `advisor/compaction.mjs`，不动 advisor-async；同表 #1 行为「B2 守卫（+~3）+ **B5** 接线（+~3）」。 | B2+B4 → B2+B5。 |
| 5 | Clarity | 🔵 | VSC §16.3（`AGENT-LOOP（VSC 仓）:992`）`persistOverflowReport(raw, { cwd, tag })` 的 `tag` 未定义用途（VSC 现函数无 tag；CLI 对位 `thincoder-cli/docs/design/AGENT-LOOP.md:1568` 的 `{ tag }` ↔ 现 callId 入文件名）。 | 注明 tag 落处（如文件名后缀）或删参。 |
| 6 | Doc hygiene | 🔵 | VSC AGENT-LOOP §1 模块地图 `subagent-scheduler.mjs` 两行重复（`AGENT-LOOP（VSC 仓）:68` / :69——后者为 D1 accessor 增补行）。 | 合并两行（本批已动 §1，可顺手清）。 |

**抽核与未复验声明**：行数表 21/21 档逐项源码实测相符（含 2 新档 `digest-budget.mjs` 双端确认未存在）；宽度代理抽核（regex ≥300 非表行）5 档新增节零命中——`scripts/check-doc-width.mjs` 实跑未复验（unverified）；需求 F-I1/F-I2/F30/F31/F32/N-I1~3/N22~24 逐条在位（源核）；TODO.md 状态推进、群 A 并发落档「已修复」断言未复验（不在评审档面）。

**审点结论**：① B1 复议正当性成立（缺陷实存——`run-stages.mjs:271-277` `advMap.clear()` 带「登记，不修」注；修法面全现成——源码逐点核）；② B2 消费点守卫选定成立（残留源码核；与同 scope 续跑通道 `:186-188` 相容）；③ B3 七面修/登判据基本成立——1 处理由过度声明（#1）；④ B4/B5 双端语义同源成立（公式与差异登记与源码现状相符）；⑤ AC 可机验成立；零冲突待收口 2 项（#1/#2）。

**计数**：发现 6（🔴0 / 🟡2 / 🔵4）· 行数抽核 21/21 · 需求回指 11 条（F/N 双组）逐条在位 · 用例 13 / AC 17 计数与各设计节相符。

VERDICT: pass

### 轮次 2（评审子代理）

**群 B 批（VSC-REVIEW-ASYNC-SWEEP）§2 设计评审轮次 2（单轮校验——6 件修正落点）——发现表（2 项：🔴0 / 🟡0 / 🔵2）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 计数一致性（D3） | 🔵 | 本档 §2 覆盖表 B3 行（`thincoder-cli/docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md:50`）仍写「VSC ADVISOR-CONVERGENCE §17.2（T-FZ1~3）」：设计档已含 T-FZ4（`ADVISOR-CONVERGENCE（VSC 仓）:1369`）、§17 计数 = 8（:1392）、AC-B3-1 含 T-FZ4（:1378）；修正轮追加（本档 :128）显名更正 :99 / :116 / :71 并声明「T-FZ 组 = T-FZ1~4」——:50 不在显名之列，仅靠「以本追加为准」条款解析。 | 下次触碰本档时补一行回指注（如「→ 修正轮 :128」）；按现条款可视为已解析——记录项，非未落。 |
| 2 | 引用形态（Clarity） | 🔵 | 本轮落修新增句尾注（`ADVISOR-CONVERGENCE（VSC 仓）:1324`）「（§14.14 E-D6 口径）」：本档无 §14.14（§14 子节止于 §14.12——同档 :897），本档 CLI 侧引用惯例带仓标（同档 :764「CLI §14.14 E-3c」· :1162 · :1221）；「E-D6」目标是否存在未复验（CLI 档不在评审域）。 | 若指 CLI 档项 → 补「CLI」仓标；若指本档 → 改指 §14.4(c)（拦集 ⊆ 判 stale 集同源判据原位）。 |

**复验口径（六件落点逐点回读——只读域 = 三档 + 锚点）**：① `:1322-1324`（契约 2 `_touchedFiles` 同点记账）/ `:1327`（契约 4 除外句）/ `:1316`（表 #7）/ `:1369`（T-FZ4）/ `:1378`（AC-B3-1）/ `:1392`（计数 8）+ §17.4 `:1351`（~290）✓ ·
② `AGENT-LOOP.md:656` C-9 收口注 ✓ · ③ 本档 `:128` 三数（4→5 档 / 用例 13→14 / ~280→~290）✓ · ④ `:1355`「B2+B5」✓ · ⑤ `AGENT-LOOP.md:990` tag 落处（文件名后缀）✓ · ⑥ `AGENT-LOOP.md:70` 合并后单行（调度器行无重复）✓。
D3 全链：设计 §17 用例 8（T-RS1~2 + T-FZ1~4 + T-EST1~2）；批次 D3 用例 14（+ T-D11~13 / T-DG1~3）；AC 17（AC-B3-1 已扩 T-FZ4）——除 #1 外两侧逐项对齐。
源码级断言（`mergeChildMutations` 内部 = 合入即记账）未复验（不在本轮文档评审域——实现期验证）；未做新问题狩猎。

VERDICT: pass

**计数**：发现 2（🔴0 / 🟡0 / 🔵2）· 修正落点 6/6 在位 · 残遗 1 处（:50——T-FZ 枚举 3/4 漂移）· 引用形态 1 处（:1324）。

> 〔父侧代笔：折行——§3 轮次 2「复验口径」超宽行（原单行 550 字符）按空白归一逐字折行，零增删；父侧落笔打标。〕

## §4 用户批准（主 agent 记）

**2026-09-11 18:35 父侧代签**——用户 16:40 授权窗口；三条件齐备：轮次 1 pass（🟡2·🔵4）→ 修正轮 6/6 → **轮次 2 pass**（0🔴 · 0🟡 · 2🔵——均非阻断）+ **token 已签发**（值不落档）。

**父侧裁定（轮次 2 两 🔵——2026-09-11 18:58 收敛）**：① `:50` T-FZ 枚举——**已落修**（#179：改「T-FZ1~4——→ 修正轮 `:128`」）；② `:1324`「§14.14 E-D6」——**已落修**（#179：补「CLI」仓标——实证 = CLI 档 `:890` E-D6 行与 VSC「拦集 ⊆ 判 stale 集」逐字吻合）。**两 🔵 收敛完毕。**

**批准范围**：群 B 五条（B1–B5）双端实施——VSC 15 档 / CLI 6 档（含测试；新档 `digest-budget.mjs` 双端）；实施者 = eng-coder（设计 token 门）。

**遗留**：commit 待父侧随批提交。

## §5 实施记录（eng-coder 自写）


**状态：交付完成（clean）**——B1~B5 双端落地；两仓快层复跑（VSC 全绿；CLI 唯一失败＝他批在途批次档 V1/V2 违规——本批零命中，见四）；内部分歧审计 + 内部代码评审轮 1/轮 2 全部收敛（零 🔴、零 must-fix）。

### 一、交付摘要（逐条 → 落点 as-of 交付）
| # | 条目 | 落点 | 用例 |
|---|---|---|---|
| B1 | VSC advisor 池中止同构丢弃（C-10a~e） | `src/agent-tools/async-discard.mjs:49/86/100/111`（私有共享核 + 双导出）· `src/agent/run-stages.mjs:279`（C-10d 唯一接线） | T-D11~T-D13 |
| B2 | 结算面拒发不记账（消费点守卫） | `src/agent-tools/advisor-async.mjs:359`（launchRefused 上移）· `:430`（记录段守卫）· `:441`（state 照归 settled） | T-RS1~T-RS2 |
| B3 | 冻结窗口 file_ops / batch_segment | `src/agent/execute-tools.mjs:126`（拦·键扩 + l3TouchedPaths）· `:362-365`（记·recordFileMutation + _touchedFiles）· `src/agent-tools/batch-segment.mjs:184`（记） | T-FZ1~T-FZ4 |
| B4 | 评审估算器 CJK 加权（双端） | VSC `src/advisor/compaction.mjs:12/46` · CLI `src/advisor/compaction.mjs:14/47`（estimateText 单源） | T-EST1~T-EST2 |
| B5 | digest 注入预算统一（双端） | 新档双端 `src/agent-tools/digest-budget.mjs`；VSC 四族（subagent-async:392-396 / advisor-async:476-478 / escalate:219 / consult:130-134）；CLI 两入口（subagent-async:344-345 / consult:187-190）+ re-export（VSC subagent-async:31；CLI :26） | T-DG1~T-DG3 |

### 二、决策透明表（实施决策 / 与设计文本的差异处置）
| # | 事项 | 决策 | 依据 |
|---|---|---|---|
| 1 | VSC `test/advisor-context-budget.test.mjs` T-CB1 导入面白名单 | 由 `[providerSpec]` 更新为 `[providerSpec, estimateText]`（1 行夹具） | B4 选定候选 1 的必然结果（设计 §17.3 已述 import 面）；不更新则该断言必红。仅夹具维护、断言意图（叶子/无 I/O）保留——如实披露，非静默 |
| 2 | 行数基线漂移（并发他批写入） | advisor-async 起点 495（设计 as-of 493）、execute-tools 491（483） | 落点仍守 500 硬限（各 497）；未硬压、未拆分 |
| 3 | 修正轮 2 件（评审轮 1 表项 1/2） | ① CLI `consult.mjs:187-190` 超限路径 D-DG3 口径对齐（标签行不计预算 + 超限消息保留族标签行）· ② VSC `advisor-async.mjs:478` saved 清单行 escapeXml | 内部代码评审建议；轮 2 复验通过 |

### 三、审计与代码评审（轮次 / 终态）
- 内部分歧审计（explore·只读）：四类偏差（验收未竟 / 静默简化 / 越域 / 文档漂移）**0 发现**；21 档与声明实施域逐档相符；3 条 🔵 观察（行数 ±、l3TouchedPaths try/catch 承前等价、双端 sync/async 落盘形态未登记）——均非偏差。
- 内部代码评审轮 1（advisor）：VERDICT **pass**（🔴0 / 🟡1 optional / 🔵2）。
- 修正轮：2 件落修 + T-DG1 断言扩（标签保留 + 正文落盘 + 标签不入盘）。
- 评审轮 2（仅验修正声明）：VERDICT **pass**；残 1 项 🔵（CLI 测试档行数回填）→ 父侧收口。
- **终态：clean**。

### 四、实测（先落盘再查）
- VSC `npm test`：tests 525 · pass 516 · fail 0 · skip 9。
- CLI `npm test`：tests 567 · pass 551 · fail 1——`test/doc-consistency.test.mjs` T41 的 6 条 V1/V2 违规全部落他批在途档（ACP-CHANNEL-FIXES / PORTABILITY / TUI-SELECTION，均未跟踪）；本批触碰档零命中（check-doc-width：VSC 新增 0；CLI 本批 0）。
- 红→绿双向复现（修前红）：B2 2 例、B3 4 例、B4 双端各 1 例、B5 双端 3+2 例——回退源后均红、复归后均绿。
- 行数实测（→ 设计预计）：VSC async-discard 114（~99）· advisor-async **497**（≤498）· execute-tools **497**（~489）· subagent-async 467（~470 净减）· escalate 226（~224）· consult 474（~473）· digest-budget 66（~70）；CLI subagent-async **435**（474 净减）· consult 469（~465）· digest-budget 77（~70）。**src 全档 ≤500 ✓**。

### 五、偏差披露（超声明 / 未竟）
- 零越域：触碰 = 设计实施域 21 档（VSC 10 src + 5 test；CLI 4 src + 2 test）；文档域零落笔。
- 行数超预计：async-discard 114（头注/双 spec 展开）；测试扩例档 4 处（async-parity 474/~440、guard-completion 339/~290、eng-settlement 366/~330、async-settle 424/~390）——无硬限约束，父侧收口回填。
- 残项（非本批引入、未动）：VSC subagent 面超限清单行仍为既有裸插形态（评审已注明不强制）；CLI B2/B3 对位面按设计 §18.4 登记维持零改。
- 未 commit（随批提交）；§5 之外无未竟项。

## §6 验证与收口（父代理自写）

**2026-09-11 20:05 · 父侧收口**

- **交付核验**（父侧抽核）：**VSC 525/516/0/9 skip** · CLI 567/551/1（唯一红 = `doc-consistency T41①`——他链在飞档，本批 21 档零命中）；红→绿双向实证（B2/B3/B4/B5 各例修前红可复现）；行数对表：VSC advisor-async **497** / execute-tools **497**（≤500 ✓）、CLI subagent-async 474→**435**（净减）；面：B1–B5 双端 21 档 = 声明域（审计零越域）。
- **AC 核销**：AC-B1-1~4 / AC-B2-1 / AC-B3-1 / AC-B4-1 / AC-B5-1..3 + CLI 对位 + AC-R-1/R-2 按 §5 逐条过。
- **内部评审**：审计 0 偏差（3 🔵 观察）+ 代码评审 2 轮 pass（修正 2 件）→ 终态 clean。
- **父侧裁定（须知 #1）**：T-CB1 白名单 1 行夹具同步（`[providerSpec, estimateText]`）——**接受**（B4 选定「复用 estimateText」的机械后果；断言意图保留；披露在案）——**不走新评审**。
- **核销同步清单**（D7）：状态行——无本批独立需求池条目（B 家族源自评审链/异步残留清扫——见 §1）；计数——T/AC 与 §2 一致（用例 14 / AC 17）；指针——设计档 §15/§16/§17/§18 可达；变更记录——设计档在档。
- **令牌**：链终——consume-design 已消费（本批**全链路闭环 ✓**）。
- **遗留**：① 测试档行数按 §5 实测回填（本行记录——async-parity 474 / guard-completion 339 / eng-settlement 366 / async-settle 424 / async-discard 114）；② VSC subagent 面超限清单行裸插形态（登记不强制）；③ CLI B2/B3 对位面登记维持零改；④ commit 随「扫」批。
