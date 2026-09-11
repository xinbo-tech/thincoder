# 子代理 abort 来源标注（可诊断性）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 13:18 · 来源 = 用户 13:17「两条都办」（C#155 **本仓接管**）。

---

## §1 讨论（主 agent 记）

### 需求来源

- 用户反馈（**已实证两次**）：子代理死亡只报 `aborted due to timeout`——**无错误栈 / 无来源层标注**（~600s 死 = 已修 bug 复发/残留路径——**直连无痕**）；
- 登记原注 owner = 平台；用户 13:17 裁定 **本仓接管**。
- 登记：`docs/TODO.md`「子代理 abort 无来源标注——死亡不可诊断」行。

### 本批条目（1 条——三方一致锚）

| # | 条目 | 内容 | 证据锚（as-of 2026-09-11） |
|---|---|---|---|
| **D1** | **abort 来源层标注** | abort 传播链（provider / agent / settlement）在死亡报告中**标明来源层**（至少：哪一层发起、何触发、残留路径还是正常路径）——使「~600s 死」一类不可诊断类问题**一次可判** | `src/provider/core.mjs:70`（600s 绝对墙钟废除注——`new DOMException("The operation was aborted","AbortError")` 无来源层；`sse.mjs:169` 注释确认 timeout 直透） |

### 已核事实（供 designer 免重复勘察）

- 审计一手（id=28）：`src/provider/core.mjs:28` `new DOMException("The operation was aborted","AbortError")`——**无来源标注**；`:70` 600s 墙钟已废除（注在案）；`src/provider/sse.mjs:169` timeout 直透；
- abort 传播链消费面：子代理结算/报告面（`src/agent-tools/*` settle 族）与 TUI 状态面——**来源信息在哪一层丢失**由勘察定；
- 用户实证两次的死亡形态 = 无栈无来源——**诊断增强目标 = 一次可判**。

### 范围边界（明确不做）

- **不改 abort 机制本体**（何时 abort / 谁有权 abort 零改）；只加**可诊断性**（来源层标注 / 报告面字段）；
- 不碰他链在途档；不改提示词语义；**不得自行新建档**（必须新建 → 停下打回主 agent）。

### 待设计裁定

1. **来源面分层设计**（provider 内：timeout / 用户中断 / 父级取消 / 残留路径——层的枚举与判据）；
2. **标注载体**（DOMException 的 message/reason/cause 字段 vs 上报面新增字段——选型 ≥2）；
3. **残留 600s 路径**是否需一并切除（`core.mjs:70` 注面——勘察结论）；
4. 受影响文件全清单（行数/增量）+ 用例/AC（逐条回指 D1）+ 双端面（VSC 是否同款——勘察）；
5. 纪律核对（D1 · 既有 abort 测试锁零伤 · 双端纪律）。

### 状态

**已收口 2026-09-11**（用户「两条都办」）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）

**状态：任务书就绪**（2026-09-11——需求/设计/测试三层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。

**落档位置**：需求 = `docs/requirements/AGENT-LOOP.md` §6（F-D1.1–F-D1.4 + 判定句 + 边界）；设计+测试 = `docs/design/AGENT-LOOP.md` §20（20.1–20.10）；台账 = `docs/TODO.md` 行 151 状态推进（在途（第 24 批）→ 设计已落档，待评审）。

### 本批条目（1 条——三方一致锚）

| # | 条目 | 三层落点 | 判定句（验收语义） |
|---|---|---|---|
| **D1** | abort 来源层标注 | 需求 §6 / 设计 §20 / AC-AP1–AC-AP8 | 任何 abort/超时死亡，报告文本标明「哪一层发起（provider/agent/settle）+ 何触发（user/timeout/cancel/stop/unknown）」——「~600s 死」类一次可判 |

**要件细分（D1 内——三层同编号）**：F-D1.1 产生点标注（trigger 枚举 5 值 + layer 三分）· F-D1.2 链式传播保真（reason 逐跳）· F-D1.3 死亡报告合成（原 message 前缀 + 来源后缀）· F-D1.4 未知显式告警（unknown 不得静默）。

### 五问裁定（§1 待设计裁定——结论摘要，论证见设计 §20）

1. **来源面分层** = trigger（5 值）× layer（3 值：provider/agent/settle——D1 原文三分）+ detail 载站点名（设计 §20.2/§20.3 第 1 条）；
2. **标注载体** = 结构化 `err.abortInfo` 主载体 + 报告面合成器 `deathLine`（否决 message 内嵌与新通道两候选——§20.2 Q2）；
3. **残留 600s** = CLI 请求链**无可切除对象**（绝对墙钟 2026-09-01 已废；实证文案不符）；有意边界（proxy 头 600s / 读侧 idle 120s / consult watchdog 600s 等）保留并加 `timeout` 标注；**唯一在网生产点 = VSC 镜像绝对墙钟**（§20.4）——登记 + 父侧排程；
4. **受影响文件** = 见下表；用例 T-AP1–T-AP9 / AC-AP1–AC-AP8（§20.7/§20.8）；
5. **纪律核对** = 既有 abort 测试五档零伤（T-AP8）；双端纪律 = 各端独立实现、差异如实登记（§20.9）。

### 受影响文件（行数 as-of 2026-09-11——全表见设计 §20.6）

- **文档域（已落）**：`docs/requirements/AGENT-LOOP.md`（134 → §6）· `docs/design/AGENT-LOOP.md`（1024 → §20）· `docs/TODO.md`（行替换）；
- **实施域（eng-coder）**：新增 `src/abort-provenance.mjs`（~90 行）+ `test/abort-provenance.test.mjs`（~170 行）；改动
  `src/provider/core.mjs` / `sse.mjs` / `anthropic.mjs` / `google.mjs` / `rate.mjs` · `src/proxy.mjs` · `src/agent.mjs` ·
  `src/agent-tools/{subagent,subagent-run,subagent-async,escalate-async,advisor-async,consult}.mjs` · `src/tui/key-handler.mjs`（均 ±2–8 行）；
- **父侧面**：`CHANGELOG.md`（父侧核销注）。

### 验收标准（逐条回指 D1——每条可机判；全表见设计 §20.8）

AC-AP1 词汇表（triggerOf 四形态 + TRIGGERS 计数 5）· AC-AP2 五处 hop 保 reason（grep 裸 `ctrl.abort()` 命中 = 0）·
AC-AP3 合成器五处在位（`deathLine(` ≥5；`err?.message ?? String(err)` = 0）· AC-AP4 unknown 显式 ·
AC-AP5 timeout/cancel/stop 标注 · AC-AP6 既有五档测试族全绿 ·
AC-AP7 `node scripts/check-doc-width.mjs` 本批触碰档零新增违规 · AC-AP8（P1 cause 链——可剥离）。

### 明确出批（登记——本批不做）

TUI 块面错误文案（digest 已是首次可判载体）· tool-result/sync 重抛面 · MCP 家族同形标注 · 自动遥测上报 · 提示词语义。

### 需父侧排程（本批写域外——发现一手）

**VSC 镜像 600s 绝对墙钟残留**：`thincoder-vscode/src/provider.mjs:28`（`FETCH_TIMEOUT_MS = 600_000`）→ `:324` 每请求
`AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])`（`:24-27` 注释 "CLI parity" 已陈旧）——
用户实证文案 "aborted due to timeout" 的**唯一在网生产点**（CLI 链实测不符）。所需档 = VSC
`docs/design/AGENT-LOOP.md` + `PROVIDER.md` + `src/provider.mjs`；最小改动面 = `:324` 去绝对墙钟 /
`:327` 头阶段语义对齐 CLI；另有 VSC 镜像标注/合成面（`entry.error` 合成族）。

**未确认面（open）**：① 用户实证两次的原始死亡文本未入档（§20.4 有机械论证——可补截图二审，不阻塞）；② detail 短串是否收紧为枚举（实现后按实测收敛）。

**纪律核对**：本批触碰档 `check-doc-width.mjs` 零新增违规（两仓实跑——CLI 仓另见 2 条他批在途档的存量违规报面，非本批写域）；三方条目一致 = 本表 D1/F-D1.x ↔ 需求 §6 ↔ 设计 §20.8 AC。

### 修正轮（评审轮次 1 后——2026-09-11）

**裁决：轮次 1 = changes-required（🔴1 · 🟡0 · 🔵4）——五条全落（Fixed，无驳回 / 无延后）。** 落点（行号 as-of 修正轮末）：

| # | 级别 | 处置 | 落点（file:line） |
|---|---|---|---|
| 1 | 🔴 | **取①**：形态③纳 `"timeout"` + 判据行加 `reason.abortTrigger === "timeout"` + 站点 #12 分错误面/信号面 + T-AP5 补断言并入 AC-AP5 | `design/AGENT-LOOP.md:1119`（判据行）· `:1134`（形态③）· `:1180`（站点 #12）· `:1256`（T-AP5）· `:1268`（AC-AP5） |
| 2 | 🔵 | 补求值链段（`err.abortInfo` 优先 → `triggerOf(signal)` → `err.name` 兜底 + 三步归属） | `design/AGENT-LOOP.md:1127-1130` |
| 3 | 🔵 | §20.6 文档域表改「批前基线 → 落档后（轮次 1 实测）」+ 口径注（134 → 168 · 1024 → 1282） | `design/AGENT-LOOP.md:1213` 起（表）· `:1220`（口径注） |
| 4 | 🔵 | 四站点只读抽查（全带 reason——改动表零增）+ 补既存证据行 | `design/AGENT-LOOP.md:1139`；实值：`key-handler.mjs:94`/`:114` = `{interrupt:true}` · `key-modes.mjs:224` = `{interrupt:true,message}` · `acp/session.mjs:49` = `{interrupt:true,message:"cancelled by client"}` |
| 5 | 🔵 | §2.1 补一行指针（本档）+ `PROVIDER.md` §3 补一行指针 + `LOGGING.md` 核得零改 | `design/AGENT-LOOP.md:97` 与 `:99` · `design/PROVIDER.md:126` 与 `:1366` · LOGGING.md 零改（`llm:error` err = `errText(e, 200)` 截断字符串——字段/截断形态不变，P1 仅换内容来源） |

**#1 取①理由（为何非②）**：定时器面仅 consult watchdog 一处为信号面（`consult.mjs:206-212` 裸 `ctrl.abort()`——需载荷），其余三处为错误面（`sse.mjs:176-179` body destroy / `proxy.mjs:86` reject / `proxy.mjs:104` body destroy——走 `timeoutError`）。
取②（定时器统一走 `timeoutError` / 原生 TimeoutError、形态③维持两值）会让 `triggerOf` 依赖读错误对象上的 `abortInfo`（第三种 timeout reason 形态），且 #2 要消的「error 域条款混载」残留在信号判据列；
① 使判据列全为 `signal.reason` 可求值、与 cancel/stop 同族载荷（程序性中止 = `{abortTrigger}`），增量仅 1 个枚举值。

**行数口径说明（#3——本 §2 同源）**：原行数值（134 / 1024）= 批前基线；落档后实测（评审轮次 1 读数）= 168 / 1282（append-only——原行不重写，以本块为准）。

**修正轮自检**：三处一致（判据行 / 形态③ / 站点 #12 逐字对齐）✓ · 三方条目一致（本表 D1/F-D1.x ↔ 需求 §6 ↔ §20.8 AC-AP1–AC-AP8）✓ · 需求档零改（F-D1.1「枚举 5 值」不受影响）✓ · 回读核实（D6）✓ · `node scripts/check-doc-width.mjs`：本批触碰档（`design/AGENT-LOOP.md` / `design/PROVIDER.md`）零超限行、V1/V2/V3 零新增 ✓（报面余额 = 他批在途档：宽度 10 文件 / 17 行、一致性新增 4 条——非本批写域）。

### 交付后设计刷新（2026-09-11——eng-designer 自写，eng-coder 交付终态后）

**触发**：代码评审 🟡-1 / 🟡-2 与偏差披露 ①④⑦ 交父侧处置 → 本刷新轮落 4 项（只改文档、零代码、需求档零碰、`src/**` 零碰）。

| # | 处理 | 落点（file:line as-of 本刷新轮） |
|---|---|---|
| 1 | 设计 §20.3 第 2 条 `annotateAbort` 签名改「4 参可选」形态——`(err, signal, layer, detail)`，第 4 参可选、3 参调用兼容、缺省回落 `unrecorded`（与实现 `src/abort-provenance.mjs:60` 一致） | `docs/design/AGENT-LOOP.md:1149` |
| 2 | 设计 §20.3 第 4 条站点表 #8 行号漂移校正——`:293`/`:325` → `:306`/`:338`（按实现实测） | `docs/design/AGENT-LOOP.md:1176` |
| 3 | 设计 §20.3 补两处同类站点（按实现实际）——定时器面 `google.mjs:203`（google-sse-idle）入 #12 行；合成器面 `consult.mjs:334` 与 `:343` 入第 3 条合成点清单（随行校正 #12 与合成点链行号至交付后实测） | `docs/design/AGENT-LOOP.md:1161` · `:1180` |
| 4 | 设计 §20.6 实施域行数/增量刷新（交付后实测——`abort-provenance.mjs` 117 · 新测档 190；净变列含他批并发）+ 行数警戒数值同步；§2 修正块 `:113` 折行（433 字符 → 3 行 ≤300——本批触碰档宽度违规清零 · AC-AP7 判据面） | `docs/design/AGENT-LOOP.md:1222-1247` · 批次档 §2（本块前） |

**登记（后续改进——本刷新零语义变更）**：死亡行后缀预算（超长 message 时后缀可被截尾吞——评审 🟡-2 建议「先削 message 再拼后缀」）——按父侧裁定登记不落（设计 §20.10 登记项 ④；属后续批）。

**自检**：4 项落点逐一回读核实（D6）✓；两仓 `check-doc-width` 本批触碰档零新增（报面余额 = 他批在途档——非本批写域）✓；三方条目一致不受影响（D1 / F-D1.x ↔ 设计 §20.8 AC 零改）✓；§2 修正块 `:113` 折行后原违规清零 ✓。

**自纠注（同轮）**：本块首版 `:123` 触发 V2「4 项」括号枚举计数不一致（3）——已修为 4 项枚举；修复后复跑本批触碰档零新增。

**自纠注 2（同轮）**：落点清单核对时发现 #8 一处当时漏落（设计 `:1176`）——已补落；4 项落点经逐条回读全部在位。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖·词汇表完整性（重点核①） | 🔴 | **trigger 判据表 / reason 形态③ / 站点 #12 三方不一致**：形态③只枚举 `"cancel"\|"stop"`（design:1120）；timeout 判据行只认 `reason.name==="TimeoutError"` 或错误自带 `abortInfo`（design:1110）；但站点 #12 明确把 `abort({abortTrigger:"timeout"})` 列为定时器面动作备选（design:1164）、规则句自定「定时器 = timeout」（design:1167）——按判据字面实现，该类定时器 abort 在下游被分类为 `unknown`（误报）；T-AP5/AC-AP5 只盖 `timeoutError` 路径（design:1237 / design:1249），无测试覆盖 reason 负载的 timeout 路径 → 缺口可静默过测 | 三处取一后必须一致：①形态③纳入 `"timeout"` + timeout 行补判据 `reason.abortTrigger === "timeout"` + 补断言（`triggerOf({abortTrigger:"timeout"}) → timeout`，并入 AC-AP5 面）；或②删站点 #12 的 `abort({abortTrigger:"timeout"})` 备选、定时器面统一走 `timeoutError`/原生 TimeoutError（形态③维持 cancel\|stop） |
| 2 | 清晰度 | 🔵 | timeout 判据行混载 error 域条款（"或错误自带 `abortInfo.trigger=\"timeout\"`"，design:1110）——在 `triggerOf(signal)` 判据列内不可求值（design:1129-1130）；err-first 求值顺序归属（deathLine / annotateAbort / triggerOf）未一句写死 | 补一句求值链：err.abortInfo 优先 → 否则 triggerOf(signal) → 否则 name 兜底 / unknown，并注明各步归属 |
| 3 | 文档卫生（数值漂移） | 🔵 | §20.6 文档域行数注记与"本批已落"实况不符（design:1195）：`requirements/AGENT-LOOP.md` 实 168 行（注 `134 → ~162`，design:1199）、本档实 1282 行（注 `1024 → ~1230`，design:1200）；批次 §2 镜像同数（batches:72） | 刷新为实际值或改标"变更前基线"，两处同源更新（纯 .md 豁免行数要求——本项为卫生项） |
| 4 | 证据（unverified） | 🔵 | user 面四站点（`tui/key-handler.mjs:94`/`:114`、`tui/key-modes.mjs:224`、`acp/session.mjs:49`，design:1109）无改动列入（表内 key-handler 仅 stop 两处，design:1221）——依赖"形态①既存"假定（design:1119），无既存证据；若某点实测无 reason，该面死亡落 `unknown` 且无 AC 拦截 | 实现时抽查四站点 reason 实值；若不符补入改动面。评审未核代码（unverified） |
| 5 | 文档归属（unverified） | 🔵 | §20 自认相关面含 §2.1（中断语义）/ `PROVIDER.md` §3 / `LOGGING.md`（design:1032），文档域清单（design:1195-1201）未含三处——若其中逐字载明 reason 形态 / `llm:error` err 字段形态，则本批落档后滞后 | 父侧核对三处是否需一行指针（单一权威源——只需指针不需复制）；评审未读该节（unverified） |

**VERDICT: changes-required**

**计数**：🔴 1 · 🟡 0 · 🔵 4（重点核①命中——判据缺口；②③④⑤⑥ 核对通过；范围 = 批次档 §2 / 需求 §6 / 设计 §20 全节 + 状态行）

### 轮次 2（评审子代理）

**轮次 2 · 单轮校验（修正轮 5 条落点复核——只读锚点 ±10）**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| — | — | — | 无发现——5/5 落点全核、行号精确命中（无 ±8 偏移残留）：#1 三处对齐（`design/AGENT-LOOP.md:1119` 判据行 `reason.abortTrigger === "timeout"` / `:1134` 形态③纳 `"timeout"` / `:1180` 站点 #12 分错误面/信号面）+ T-AP5 `:1256` + AC-AP5 `:1268`；#2 求值链段 `:1127-1130`；#3 §20.6 口径 `:1213`/`:1220`（134→168 · 1024→1282 + LOGGING 零改注）；#4 四站点证据行 `:1139`（实值与批次档 `:110` 逐字一致）；#5 文档面（`design/AGENT-LOOP.md:97`/`:99` + `design/PROVIDER.md:126`/`:1366` + LOGGING 零改结论）与批次档修正块 `:101-117`。无残遗 / 未落 / 新增矛盾。 | — |

计数：🔴 0 · 🟡 0 · 🔵 0
VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 23:50 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 changes-required（🔴1 · 🔵4）→ 修正轮 5/5（含🔴取①三处对齐）→ 父侧实文核验 + **轮次 2 = pass**（5/5 核销 · **0 发现**）→ **token 已签发**（值不落档）。

**批准范围**：新档 2（`src/abort-provenance.mjs` ~90 + `test/abort-provenance.test.mjs` ~170）+ 改动 14（provider core/sse/anthropic/google/rate · proxy · agent.mjs · agent-tools subagent/subagent-run/subagent-async/escalate-async/advisor-async/consult · tui/key-handler——均 ±2–8 行；全表见设计 §20.6）。

**遗留（批准时登记）**：① 与批 32（headers）文件域重叠（anthropic/google/rate）——批 32 尚在修正轮，不冲突；同起需 scheduler 串行；② 需求档 134→168 行数与现盘复核（设计者文档任务）；③ commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

### 交付摘要（eng-coder 自写 · 2026-09-11）

**状态：实施完成——16 档（新档 2 + 改动 14）；测试全绿；内部审计/代码评审轮次与终态见本节"审计与评审"段。**

设计权威 = `../design/AGENT-LOOP.md` §20（含修正块）；需求 = `../requirements/AGENT-LOOP.md` §6（F-D1.1–F-D1.4）。

**落点（file:line as-of 交付）**

- 新档 `src/abort-provenance.mjs`（117 行）：词汇表（trigger 5 值 · layer provider/agent/settle + 兜底 unrecorded）+ 6 导出
  （`TRIGGERS` / `triggerOf` / `abortError` / `timeoutError` / `annotateAbort` / `deathLine`）——纯函数、零 import。
- 新测档 `test/abort-provenance.test.mjs`（188 行）：T-AP1–T-AP10。
- **产生点**：#1 `provider/core.mjs:30`/`:32`（sleep）· #2 `core.mjs:422`（request——undici 拒否补标）· #3 `sse.mjs:187`（stream-read）·
  #4 `anthropic.mjs:81`/`:189`（transport-anthropic）· #5 `google.mjs:108`/`:212`（transport-google）· #6 `rate.mjs:90`（rate-gate——含 reason 透传）·
  #7 `proxy.mjs:74`/`:82`/`:188`/`:192`/`:227`/`:234`（proxy 单点六调用）+ 定时器 `:81`/`:99` ·
  #8 `agent.mjs:306`（annotate——interrupted response，name/message 零改）/`:338`（post-chat）· #9 `subagent.mjs:292`/`:297`（sync-stopped）。
- **hop #10 五处**：`subagent-run.mjs:104-105` · `subagent.mjs:70-71` · `escalate-async.mjs:179-180` · `advisor-async.mjs:288-289` ·
  `consult.mjs:422-423`——双分支 `ctrl.abort(baseSignal.reason)`（裸 `.abort()` 代码面零残留）。
- **取消 / 停止 #11**：`subagent-async.mjs:203`（subagent-cancel）/`:227`（sync-child-cancel）· `advisor-async.mjs:215`（advisor-cancel）·
  `consult.mjs:457`（consult-stop）/`:360`（consult-cleanup）· `key-handler.mjs:63`/`:68`（session-stop）。
- **定时器 #12**：错误面 `sse.mjs:178`（sse-idle）· `proxy.mjs:81`（proxy-header）/`:99`（proxy-body-idle）· `google.mjs:203`（google-sse-idle——规则句覆盖勘察外站点）；
  信号面 `consult.mjs:213`（consult-watchdog）。
- **合成器**（`deathLine`）：`subagent-run.mjs:162` · `advisor-async.mjs:303` · `escalate-async.mjs:258` · `consult.mjs:334`/`:343` ·
  `subagent.mjs:346` · `core.mjs:107`（`llm:error`——P1）。

### 透明表（AC-AP1–AC-AP8）

| # | 判定 | 结果 | 证据 |
|---|---|---|---|
| AC-AP1 | 词汇表（T-AP1 绿 + TRIGGERS=5） | Done | `test/abort-provenance.test.mjs` T-AP1（4 形态 + 计数 5） |
| AC-AP2 | 五处 hop 保 reason + 裸 `.abort()`=0 | Done | T-AP2（行为：`armSyncChildAbort` 深等）+ T-AP10（五档扫描） |
| AC-AP3 | 合成器五处在位（`deathLine(` ≥5；残留形态=0） | Done | T-AP9；实点数 6（consult 两处——见偏差披露） |
| AC-AP4 | unknown 显式（不得静默） | Done | T-AP4（两形态：已标注 reason 缺 / 完全未标注） |
| AC-AP5 | timeout / cancel / stop 三面标注 | Done | T-AP5（两形态）+ T-AP7（cancel/stop + 站点载荷扫描） |
| AC-AP6 | 既有五族全绿（零回归） | Done | `node --test` 五档：55/55 pass（实跑记录见下） |
| AC-AP7 | `check-doc-width.mjs` 本批触碰档零新增 | **部分**——本批文档域（design/AGENT-LOOP.md · design/PROVIDER.md · requirements/AGENT-LOOP.md · TODO.md）零新增；**批次档 §2 修正块 `:113` 超宽 433 字符（他段——非本档写域，未改，见偏差披露）**；一致性新增 5 条 = 他批在途档（ACP-CHANNEL-FIXES / PORTABILITY / TUI-SELECTION） |
| AC-AP8 | P1 cause 链（T-AP6） | Done（未剥离） | T-AP6 绿——cause 段独立于 abort 后缀（非 abort 网络死亡同判） |

### 行数对表（§20.6 实施域——当前实测）

| 文件 | §20.6 基线 | 交付后实测 | 备注 |
|---|---|---|---|
| `src/abort-provenance.mjs` | —（新） | 117 | 设计 ~90 估 |
| `test/abort-provenance.test.mjs` | —（新） | 188 | 设计 ~170 估 |
| `src/provider/core.mjs` | 482 | 477 | 本批 +2 行（import/注释）——他批并发删行（净 −5） |
| `src/provider/sse.mjs` | 266 | 265 | ±0（import +1 与删行相抵） |
| `src/provider/anthropic.mjs` | 226 | 225 | ±0 同构 |
| `src/provider/google.mjs` | 259 | 258 | +1（含 google-sse-idle 额外站点） |
| `src/provider/rate.mjs` | 108 | 109 | +1（import） |
| `src/proxy.mjs` | 267 | 262 | −5（本地 abortError 单点删除——调用面语义不变） |
| `src/agent.mjs` | 401 | 414 | 他批并发增量为主 |
| `src/agent-tools/subagent.mjs` | 403 | 405 | +2（import + 注释） |
| `src/agent-tools/subagent-run.mjs` | 203 | 206 | +3 |
| `src/agent-tools/subagent-async.mjs` | 473 | 474 | +1（注释）——500 硬限内 |
| `src/agent-tools/escalate-async.mjs` | 287 | 290 | +3 |
| `src/agent-tools/advisor-async.mjs` | 350 | 354 | +4 |
| `src/agent-tools/consult.mjs` | 456 | 461 | +5（含两处额外合成）——500 硬限内 |
| `src/tui/key-handler.mjs` | 440 | 441 | +1——500 硬限内 |

**口径注**：上表实测含他批在途改动（共享档并发编辑——如 core/proxy 出现负增量）；全部档仍 < 500 硬限，本批未触发拆分治理。

### 测试实测（先落盘再查）

| 命令 | 结果 | 日志 |
|---|---|---|
| `node --test test/abort-provenance.test.mjs` | 10/10 pass | `%TEMP%\ap-tests.log` |
| `node --test <五族：sync-cancel / async-settle / queued-stop / subagent-observe-send / advisor-chain-guards>` | 55/55 pass | `%TEMP%\ap-tap8.log` |
| `node test/run-fast.mjs`（快层全量） | 495 tests · 481 pass · **1 fail（T41 doc-consistency——他批在途档 5 条 V1/V2，非本批文件）** · 13 skip（slow 门） | `%TEMP%\ap-full.log` |
| `node scripts/check-syntax.mjs` | 280 档 OK | — |
| `node scripts/check-doc-width.mjs` | 本批文档域零新增；§2:113 超宽一条（他段——见偏差披露）；一致性新增 5 条他批 | `%TEMP%\ap-width.log` |

### 偏差披露（逐条——含"超出 §20.6 所列"的同类站点）

1. **`annotateAbort` 第 4 参 `detail`（可选）**：§20.3 第 2 条签名行写 `(err, signal, layer)`，站点表 #2 写 `annotateAbort(provider, "request")`（detail 无处承载）——实现取站点表形态（第 4 参可选，缺省回落 `unrecorded`），3 参调用兼容。
2. **unknown 形态 token 收紧（内部审计 🟡 修正）**：trigger 解析为 `unknown` 时，detail 恒用逐字 token `no reason on signal`（§20.3 第 3 条），不再优先渲染产生点站点名——T-AP4 断言同步收紧。已标注（unknown）+ 未标注两形态均含该 token。
3. **信号域 detail 回落读取 `reason.abortDetail`**：错误未标注而信号 reason 为形态③时，detail 取 `abortDetail`（站点名）而非裸 `unrecorded`——理由：D-24-1「detail 载站点名」+ 否则该字段全链只写不读（审计 🔵）。有 abortInfo 时产生点 detail 优先（求值链不变）。
4. **额外站点（§20.6 未列，均在已列文件内）**：① `google.mjs:203` 读侧 idle 定时器（§20.3 第 4 条规则句「定时器 = timeout」覆盖勘察外站点）；② `consult.mjs:334`/`:343` 两处报告/日志合成（设计只列 `:341` 一处——同为结算/报告面，判定句 F-D1.3 覆盖）。两处均并入 T-AP9/T-AP10 扫描；建议父侧按「锚#3 修正轮 docs FIRST」请设计者刷新 §20.3 第 4 条 / §20.6 行数与站点表（非本档写域）。
5. **共享 `abortError` message 统一为 `The operation was aborted`**：原用 `Aborted` 的产生点（anthropic/google/rate/subagent/agent）文案随之统一；全仓 grep 无断言/谓词依赖旧文案（审计核实）。
6. **`timeoutError` name 保持 `Error`**（不升级 TimeoutError）：既有分类谓词（`classifySyncAbort` / `classifyErr` / sse/google 的 AbortError 分支）零变化。
7. **批次档 §2 修正块 `:113` 超宽（433 字符）**：属 §2（一段一作者——非本档写域），未改；需 §2 作者折行方可 AC-AP7 全绿。
8. **VSC 600s 绝对墙钟残留**：本批零碰（写域外）——按 §20.10 登记父侧排程。
9. **留面（登记——明确不做）**：`subagent-actions.mjs:445`/`:466`（sync escalate 错误面）与 `dispatch.mjs:41`（tool-result 面）仍为 message 压缩形态——§20.10 ② 已登记「sync 重抛面」，非本批写域。

### 审计与评审（eng-coder 自写——轮次与终态）

**① 内部定点审计（explore——round 1，divergence-only）**：0 🔴 · 🟡2 · 🔵4。

- 🟡-1「§5 未写」→ 本节落定（Fixed——交付记录补全，测试档尾注所指即本节）。
- 🟡-2「unknown 形态 literal-form」：已标注错误曾渲染产生点 detail（`unknown@provider:stream-read`）——已收紧为逐字 token（Fixed：`src/abort-provenance.mjs:112`
  `const text = trigger === "unknown" ? NO_REASON : (detail == null ? UNRECORDED : String(detail))` + T-AP4 断言同步两形态）。
- 🔵「abortDetail 只写不读」→ 已加信号域 detail 回落（Fixed：`abort-provenance.mjs:75-76` `detailOf` + `:83`/`:85` 取 `reason.abortDetail`；错误已标注时产生点 detail 优先）；T-AP7 补断言。
- 🔵「google 定时器 / consult 两合成点超出 §20.6 字面计数」·🔵「annotateAbort 第 4 参」·🔵「consult 超时分支不走合成器（设计只列 :341）」——已在偏差披露 ①/③/④ 摆面（父侧设计刷新项，见下）。
- 清单核验：**16 档全部落在 §20.6 实施域表内**（无超清单文件）；五处 hop 双分支 / 六处合成点 + core P1 / #1–#12 站点逐行核到。

**② 内部代码评审（advisor——round 1，全量 16 档 + 三文档）**：**VERDICT pass**——0 🔴 · 🟡3 · 🔵1。

- 🟡-1 doc-state（设计 §20.3 第 2 条签名行 `(err, signal, layer)` vs 实现第 4 参可选；站点表 #8 行号漂移 `agent.mjs:293/:325` → 实测 `:306`/`:338`）——非功能缺口、非机制矛盾，属父侧 doc 层刷新。
- 🟡-2 设计缺口（超长 message 时 detail 预算 ≤0 → 后缀可被截尾吞；与设计 §20.3 第 3 条字面同款＝**非实现偏离**）——建议设计刷新时把「为后缀预留固定位，先削 message 再拼后缀」写死。
- 🟡-3 协调项（AC-AP7「部分」＝批次档 §2:113 超宽 433 字符，他段写域）。
- 🔵 clipDetail 非串 detail 稳健性 → **修正轮落地**（Fixed：`abort-provenance.mjs:112` `String(detail)` 归一化 + `test/abort-provenance.test.mjs:94` 防御断言）。

**③ 内部代码评审 round 2（校验轮——只验修正项与冻结裁决表）**：**VERDICT pass**——修正项引用逐条命中、串/null detail 行为与修前逐字等价、无新伤；无新发现问题。

**终态：clean**（0 🔴 全链；🟡 三条 = 父侧 doc/协调面——偏差披露 ①/②/⑦/④ 已摆；🔵 修正已落地并经 round 2 校验）。

**测试终验（修正轮后复跑，先落盘再查）**：`node --test test/abort-provenance.test.mjs` = 10/10 · 五族 = 55/55 · `node test/run-fast.mjs` = 519 tests / 504 pass / **1 fail（T41 doc-consistency——他批在途档 5 条 V1/V2，非本批文件）** / 14 skip。

**交父侧处置项（非本档写域）**：① 设计刷新（`design/AGENT-LOOP.md` §20.3 第 2 条签名行 / 站点表 #8 行号 / 第 4 条站点表补 google-sse-idle 与 consult 两合成点 / §20.6 行数与增量）；② 批次档 §2:113 折行（AC-AP7 全绿条件）；③ VSC 600s 残留排程（§20.10 登记在案）。

## §6 验证与收口（父代理自写）

**2026-09-12 04:45 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **10/10**（T-AP1–T-AP10）· 五族 55/55 · 快层 **519/504/1**（T41 他链）· 全量基线同 2 条（他批）；
- **父侧抽核**：`annotateAbort` 4 参可选（:1149）✓ · 站点 #8 行号校正 ✓ · `google-sse-idle` 补入 ✓ · **§2:113 折行 ✓**（433→207，AC-AP7 收口）；
- 刷新轮：4/4 落 + D6 自纠 2 处（V2 枚举 + #8 漏落）；行数口径说明（读回 117/190 vs wc 116/189——取基线同法）。

### 逐条验收结论

- **AC-AP1–AP8 全绿**（含 AP7 = 折行后 doc-width 本批零新增）；**Simplified 零 · Not done 零**；偏差 9 条如实。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：16 档实测对表 ✓ · 指针：设计 §20.6 ↔ §5 ✓ · 待办：三项（下）✓

### 遗留项

1. **§20.7 用例表止于 T-AP9、交付含 T-AP10**——后续轮补行（登记）；
2. §20.10 登记项（后缀预算等——登记不落裁定）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
