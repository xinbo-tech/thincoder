# 2026-09-20 · 文档面收口批（DOC-FACE-CLOSURE-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 13:0x · 来源 = 用户 13:05「**为什么不全点火**」+ 台账 #127 / #135（余三则）/ #136（余项）。
> 本档 = **文档面收口**（一处重复/陈旧登记 + 行数相抵 + 测试叙事的收口）；不触产品码。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目清单（3 条台账）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#127** | **收口批（①–⑦ 七处重复的收口 · 扣⑤）** | ⑤（`ContinueError`）**已由 P2 落地** ✓ ⇒ 扣重；待办 = **②⑦⑥ 优先**（按**台账 #127 evidence + P3 §2.5** 为准：**[4] 层 system 尾块 / 多实例聚合 / memory schema**——原「`buildSpawnChild` 收口 / 派发四调用点 / guard 双 helper」括注系父侧误写（属 P2 已闭面），**以本行为准**）+ **① 择机** + **③④ 保留 + DOC 收正**。 |
| 2 | **#135（余三则）** | **P2 收口项四则的余项** | ① 行数/相抵收正（车道 3 已落 ⇒ 复核残余）· ② `setup.mjs` **489/490 贴线口径**（父侧已裁按 `find` 记 + 注「下次触碰即触线」⇒ 入档）· ③ 钩子定时器 —— **已并入 sync 可达性批**（#133 批 · #135-④）✓ ⇒ 扣重 · ④ advisor 🔵 未采纳两条登记（五路共档 / 端侧第四 kind 残口——**是否补只读源锚**由本批定）。 |
| 3 | **#136（余项）** | **库存清账批余项** | ① TESTING §6.2 余 4 处内部叙述（逐处判「收正 / 保留」）· ② 批档 §1 状态行 + §2.5 档态回填（父侧面 ✓ 随本批）。 |

### 1.2 边界

- **不触**：产品码 / `scripts/**` / 归档档 / 冻结批档 / 他批写域 · P2/P1 已收口面的**已落条款**。
- 与在途批的重叠：**doc-face 仅在 `docs/**`**（sync 批 = 核面 ⇒ 零重叠 ✓）。

### 1.3 验收（方向）

① 逐条「台账 id → 改动 file:line 或判保留理由」；② `doc-check` 净增 0（锚 0 · 行宽 0）；③ 计数/枚举自洽（D3）；④ 与已收口批的条款零相抵。

### 1.4 台账

#127 / #135 / #136 → 本批（在途）· 落定后核销。

## §2 批次任务与设计（eng-designer）

**批次任务与设计（eng-designer · 2026-09-20 · 轮次 = initial）**

**状态行**：✅ 3 条逐条设计已出（2.1 #127 / 2.2 #135 / 2.3 #136）· 受影响文件表 = 2.4 · 验收命令 = 2.5 · 边界 = 2.6 · 不一致处 = 2.8。

**书源**：本档 §1（3 条清单 + 边界 + 验收方向）；证据 = 台账 #127 / #135 / #136 全段；判据 = 2026-09-20 治理口径（错档 / 死对象 / 计数不符三类）+ D8（修订式残句禁入规范面）+ D3（计数·枚举同改）+「与已收口批条款零相抵」。
**轮次口径**：initial（设计轮）——**本席零落笔**；落笔 = §5 实施轮（车道见 2.4）。全批**零产品码 / 零 `scripts/**`**。

### 2.1 条目 1 · #127 同形重复 7 处（⑤ 扣重 · 逐条处置 · 登记落点 = `AGENT-LOOP.md` §6.18）

**⑤ 扣重（已收口 · P2 落地 · 本席复核）**：核 `thincoder-core/agent/helpers.mjs:205` `export class ContinueError` 单源；端 `thincoder-vscode/src/agent.mjs:7` import + `:43` re-export（端侧零第二类，`:463` 消费）⇒ 本批零动作，验收 = D-1。

**清单生效条件（承 §1 「#127」行更正）**：本表 ②⑦⑥ 清单以 §1 更正后的裁定为准（按台账 #127 evidence + P3 §2.5——[4] 层 system 尾块 / 多实例聚合 / memory schema）。

**逐条处置表（①–⑦ · 逐条「改法 或 判保留 + 理由」）**：

| # | 处 | 现状（实读 / 登记源） | 判 | 改法 / 落点 |
|---|---|---|---|---|
| ② | [4] 层 system 尾块 | 核 `thincoder-core/agent/setup.mjs:221-229`（`loadProjectInstructions` 块 + skills 清单）∥ 端 `thincoder-vscode/src/agent/setup.mjs` 同块（现盘 `:355` 起） | **优先收口（码面另轮）** | 抽核侧 helper 两端同调（P3 §2.5 判「低风险优先项」）——本批登记，零码动 |
| ⑦ | 多实例聚合 | 端 `thincoder-vscode/src/extension/peer-instances.mjs:78-93` 镜像核私有件 `groupSlotSessions`（核 `thincoder-core/peer-instances.mjs:84-99`，**未导出**；端档 `:10` 自述） | **收口（码面另轮）** | 核侧导出 `groupSlotSessions` 后两端改调——本批登记，零码动 |
| ⑥ | memory schema / 描述 | 端 `thincoder-vscode/src/memory-tool.mjs:42-60` 端前端形态 ∥ 核 `thincoder-core/memory/docs.mjs:251` `memoryTools`（执行器） | **收口（码面另轮）** | 契约单源 + 端注入差异段；**双改登记已落 = `docs/core/design/MEMORY.md` §6.9**（本批只回指，不重述——D2） |
| ① | 上下文注入块 | 端 `src/agent/context-injections.mjs` ∥ 核 `agent/setup.mjs` + `agent/helpers.mjs`——`listWorkDir` 除 JSDoc 逐字一致（尚无分叉） | **择机收口 + 双改纪律** | 收口 = 核面抽可注入公共面 + 端调用点改指（另轮）；**收口前双改纪律入档**（本行） |
| ③ | 提醒族 | 核 `agent/setup-reminders.mjs` ∥ 端 `src/agent/setup-reminders.mjs`——**已分叉**（env 行端身份 = 合法端差） | **判保留 + 双改纪律** | 端身份差异**不消**（已裁保留）；纪律 = 改核档共享行 ⇒ 同轮改端档（本行） |
| ④ | 续跑循环 | CLI `thincoder-cli/src/tui/agent-turn.mjs` ∥ 端 `thincoder-vscode/src/extension/panel-turn-loop.mjs`（规则同形 · 呈现面不同） | **判保留 + 双改纪律** | 纪律 = 规则口径（`autoTurn` 自动续跑 / 手动静默停）改一侧 ⇒ 同轮改另一侧（本行）；收口候选 = 抽核纯函数 `continueDecision(error, {autoTurn, autoApprove})`（择机） |
| ⑤ | `ContinueError` | 核单源 + 端转口（已收口 · P2） | **已收口（扣重）** | — |

**登记落点（本批唯一文档面动作）**：`docs/core/design/AGENT-LOOP.md` §6.18 表 **+1 行**「同形重复族（#127）双改纪律 + 收口登记」+ 同表**同族事件载荷双改纪律行**补**机检补充项**句（内容 = 端侧只读源锚对拍——核 kind 字面集 ∥ 端映射集；判补 · 执行 = 码面小轮 · 触发 = 核事件族批 ∕ 该用例档下次触碰；见 §2.2-④(b)）+ 同节收尾注**计数收正（十面 → 十一面）**+ 本档 as-of 刷新（承 P2 §2.29-#9 口径；取值口径 = 下段）+ 变更记录 1 条。
**as-of 取值口径**：按**落笔后** `find /c /v ""` 实测刷新，记双值形态（落笔前 **567** → 落笔后 N；`find` 口径，`read` 口径 = +1 尾行——承 `AGENT-LOOP.md` 变更记录 `:560` 双值先例 + P2 §2.29 读数口径登记）；不以落笔前读数占位 · 不做行号漂移追改（D4）。
**行内容要点（落笔按此 · 机检关键串 = D-2）**：① ①–⑦ 逐条一句（含现状 + 判 + 落点）；② 双改纪律句（①③④ 各自「改核侧 ⇒ 同轮改端侧」）；③ 码面另轮项（①②⑥⑦）标「另轮 · 本批零动」；④ 回指单源 = P3 批档 §2.5（分析）+ `MEMORY.md` §6.9（⑥ 登记）。
**与已收口面零相抵核**：⑤ 句须与 P2 实态一致（D-1 核）；⑥ 句只回指 `MEMORY.md` §6.9 不重述（D-4 核）；行内零修订式残句（D-12 核）。

### 2.2 条目 2 · #135 余三则（复核残余 · 贴线归账 · 🔵 定论）

**① 行数 / 相抵收正复核（车道 3 已落 ⇒ 本席复核 · 读数 = 本刻实跑 `find /c /v ""`）**：

| 档 | 登记读数（车道 3 / VSC-DEBT） | 现盘实读 | 判 |
|---|---|---|---|
| `thincoder-core/agent/helpers.mjs` | 411（`CORE-UNIFICATION.md:886`） | **411** | ✓ |
| 端 `src/agent/run-stages.mjs` | 402（VSC-DEBT `:274`） | **402** | ✓ |
| 端 `src/agent/execute-tools.mjs` | 407（`:275`） | **407** | ✓ |
| 端 `src/agent/setup.mjs` | 489（find）/ 490（read）（`:276`） | **489** | ✓（口径见 ②） |
| 端 `src/agent.mjs` | 478（`:273`） | **478** | ✓ |
| 端 `src/extension/permission-gate.mjs` | 117（`:277`） | **117** | ✓ |
| 端 `test/files.mjs` | 116（`:278`） | **117** | ✗ **残余 ⇒ 收正**（+1 = P2 收口单件 T-QP 档登记行 `:116`；批档 §5 收口轮已记 117） |
| 端新增三用例档 | 264 / 217 / 102（`:279`） | 264 / 217 / 102 | ✓ |

- **表述相抵 3 处**（§2.16 验收 #2 期望 1→2 · §2.18 验收 #6 改述 · §2.19 边界④）＝ 车道 3 已落（P2 §2.30 ②(b)）⇒ 本批零动作（他批记录体）。
- `AGENT-LOOP.md` as-of 自陈 **564**（P2 §2.30 #13）∥ 现盘 **567**（+3 = 后续批触碰漂移）⇒ 本批落登记行**同轮刷新**（承 P2 §2.29-#9；取值口径 = 落笔后 `find /c /v ""` 实测 · 双值——见 §2.1）；不追改（D4）。
- **收正落点**：`docs/vsc/design/VSC-DEBT.md:278`——「**116**（本批 +4——三条机制层用例档登记 `:112-115`；登记面）」→「**116 → 117**（本批 +5——批注行 `:112` + 三条机制层用例档登记 `:113-115` + 收口单件 T-QP 档登记 `:116`；登记面）」；+N 与行区间按实读定稿（依据 = §2.11 行 5）；验收 = D-5。

**② `setup.mjs` 489/490 贴线口径（父侧已裁 ⇒ 归账）**：端 `thincoder-vscode/src/agent/setup.mjs` 现盘 **489（`find`）/ 490（`read`）**；口径 = **按 `find` 记（489）** + 注「下次触碰即触线」——**已在册**（VSC-DEBT `:276` 逐字含「`find` 口径 489 < 490 未触线；`read` 口径 490 = 恰在触发线 ⇒ 下次触碰即触线」）。
本批 = 复核 + 归账（§2 记录裁决，零新落笔）；触发 = 该档下次触碰（拆分计划在册 VSC-DEBT §12.1）；验收 = D-6。

**④ advisor 🔵 两条定论（本批裁定 · 登记于本段）**：

- **(a) 五路共档**（T-QP5 五 leg 共用单例 test ⇒ 首 leg 失败中断后 leg）⇒ **判不补**。理由：设计行「逐路断言」已由逐 leg 三条断言 + leg 名消息满足（P2 未采纳理由成立）；拆 5 例零断言增量、仅诊断粒度收益 ⇒ 不值得另开码面轮。备选「拆 5 例」**否决**。
- **(b) 端侧第四 kind 残口**（核侧新增第四 kind 会被 `thincoder-vscode/src/extension/panel-subagent-relay.mjs:115` 三目静默归入 `waiting-deps`，端侧零覆盖）⇒ **判补（只读源锚一条）**：形态 = 端测试档内读核发射面 kind 字面集与端映射集对拍（新 kind ⇒ 用例红；只读 · 零产品码改动面）。
  先例 = `thincoder-vscode/test/context-percent-parity.test.mjs`「含对端源锚」式（登记于 `test/files.mjs:104`）；**执行归属 = 码面小轮**（本批零产品码）；触发 = 下次触碰 `thincoder-vscode/test/subagent-queued-payload.test.mjs` 或核事件族批；验收 = D-7（定论登记在场）。
  **耐久登记**：本裁决随本批落笔入 `AGENT-LOOP.md` §6.18「同族事件载荷双改纪律」行**机检补充项**（落点规格 = §2.1 登记落点）——#135 核销后触发面不复依赖本批档。

### 2.3 条目 3 · #136 余项（TESTING 需求档逐处判 · 批档档态回填）

**① TESTING 逐处判（`docs/core/requirements/TESTING.md` · 需求档 ⇒ 父侧笔；判据 = 已定口径「命令/脚本/env 死字面 ⇒ 收正；该档主题叙述 ⇒ 保留」）**

扫描（族 = v1 门词面 + 死脚本名 · 本席实跑 as-of 2026-09-20 ⇒ 命中 **7 行**：`:3` `:103` `:107` `:120` `:170` `:175` `:181`）：

```
cd D:\teamcode\thincoder && node -e "const t=require('fs').readFileSync('docs/core/requirements/TESTING.md','utf8').split('\n');const re=/test:full|test:integration|slow-gate|run-fast|run-full|run-integration|\u5feb\u5c42|slow\s*\u95e8|check-ledger|check-doc-width/;t.forEach((l,i)=>{if(re.test(l))console.log((i+1)+': '+l.slice(0,90))})"
```

逐处判表：

| 处 | 现文（摘） | 判 | 改法（父侧落笔 · 草案） |
|---|---|---|---|
| `:3` | 板块行「分层纪律 / **slow 门** / ……」 | **保留** | 板块·主题面枚举（该档主题叙述）；改之零语义收益 ⇒ 照留 |
| `:103` | F17「`check-ledger` L1–L4」 | **收正** | 死对象 → **改述**（无承接——映射单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.8）：台账一致性归核内 SQLite（`thincoder-core/ledger.mjs` · `docs/core/design/LEDGER.md` §6/§6.1——CHECK + `ledgerCount` + 写门；盘上无脚本）；**不得换名**（承残清批 N-5 裁定） |
| `:103` | F17「`check-doc-width`（行宽）」 | **收正** | 死脚本名 → `scripts/doc-check-width.mjs` |
| `:103` | F17「`slow` 门（归册防漏）」 | **保留** | 保留面枚举项（主题面）；语义已由设计档 §6.1 C3「归册」承接 |
| `:107` | F21「**快层**用例总数下降……」（可机判） | **收正** | v1 词面 → 「单入口执行集用例总数下降」（与设计档 §6.2 已收正词面同式） |
| `:120` | §5.4「`check-ledger.mjs` / `check-doc-width.mjs`……」 | **收正** | 死脚本名 ×2 → `scripts/doc-check.mjs` / `scripts/doc-check-width.mjs` |
| `:170` | F28「……不动**快层**」 | **收正** | → 「不动单入口执行集」 |
| `:175` | N18「不进**快层**（`npm test` 目标集合零变）……」 | **收正** | → 「不进单入口执行集（`npm test` 目标集合零变）」 |
| `:181` | §6.3「不进**快层** / ……」 | **收正** | → 「不进单入口执行集 / ……」 |

（收正 7 处 / 判保留 2 处；与批档记「余 4 处」的处数差 = 2.8-②。执行 = 父侧；本设计给判 + 改法草案，验收 = D-8 / D-9。）

**② 批档档态回填（`docs/batches/2026-09-20-residual-sweep-batch.md` · 请求源 = 该档 §5 ⑥-1 + §6 遗留 ②）**

| 行 | 现文 | 回填后（目标文本 · 要点） | 执行 |
|---|---|---|---|
| `:8` | 「**状态行**：🔄 进行中（设计轮待发）」 | 「**状态行**：✅ 已收口（§6 · 2026-09-20 13:0x · #128/#129/#131/#120 已核销；余项 = 需求面 TESTING 族词面）」 | 父侧（§1 段） |
| `:128` | 产品文本两档行「**eng-coder 轮（待派）** / 未落」 | 「**eng-coder 轮（已落 · 批 2）** / 已落」；触碰列补「读数 = §5 ②/③/④」 | 设计席（§2 段） |
| `:129` | 需求档 13 档行「未落」 | 「部分已落（收正 24 + 判保留 5；余项在册）」+ 触碰列补指针 | 设计席（§2 段） |
| `:167` | §2.7 E 块头「**未落 · 读数待实现轮**」 | 「**已落**（批 2）；读数 = §5 ②/③/④」 | 设计席（§2 段） |

（执行方判定依据 = D1 一段一作者：§1 段 = 主 agent 笔、§2 段 = 设计席笔。回填 = 档态事实，零新语义。落笔次序 = §2 三行（设计席）先 · §1 状态行（父侧）后——状态行改「已收口」触 L4 冻结语义，后置免自缚。）

### 2.4 受影响文件表 + 实施分批

| 档 | 面 | 执行 | 触碰 | 判据 |
|---|---|---|---|---|
| `docs/core/design/AGENT-LOOP.md`（§6.18 +1 行 · 同族行机检补充项 · 收尾注计数 · as-of · 变更记录） | 设计档 | **eng-designer（设计档笔）** | +1 行 / 改 3 处 / 追加 1 条 | D-2 / D-3 / D-4 / D-12 |
| `docs/vsc/design/VSC-DEBT.md:278` | 设计档 | eng-designer | 1 行 | D-5 / D-12 |
| `docs/core/requirements/TESTING.md`（收正 7 处） | 需求档 | **主 agent（父侧笔）** | 7 处 / 6 行 | D-8 / D-9 |
| `docs/batches/2026-09-20-residual-sweep-batch.md`（`:8` `:128` `:129` `:167`） | 批档（他批） | `:8` 主 agent · 余 3 行设计席 | 4 行 | D-10 |
| 本批档 §2（本设计） | 批档 | 本席 | — | — |

**分批**：**车道 A = 设计档 2 档**（eng-designer · 单轮可同落）· **车道 B = 需求档 1 档**（主 agent）· **车道 C = 他批档回填 4 行**。三车道文件面互斥 ⇒ 可并行；**同档禁并行双改**。
**码面另轮登记（本批零动）**：②⑦⑥① 收口本体（改法 = P3 §2.5）+ ④-b 只读源锚（定论见 2.2）。

### 2.5 验收命令清单（cmd.exe · 全 ASCII · 中文串以 `\u` 转义 · 判据非中文 `findstr`）

```
D-1  cd D:\teamcode\thincoder && node -e "const fs=require('fs');const c=fs.readFileSync('thincoder-core/agent/helpers.mjs','utf8');const v=fs.readFileSync('thincoder-vscode/src/agent.mjs','utf8');const pos=c.includes('export class ContinueError')&&v.includes('import { ContinueError')&&v.includes('export { ContinueError }');const neg=!/class\s+ContinueError/.test(v);console.log(pos&&neg?'OK D-1 single-class':'FAIL D-1 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"
```

```
D-2  cd D:\teamcode\thincoder && node -e "const t=require('fs').readFileSync('docs/core/design/AGENT-LOOP.md','utf8');const keys=['\u540c\u5f62\u91cd\u590d\u65cf\uff08#127\uff09','\u5341\u4e00\u9762','\u673a\u68c0\u8865\u5145\u9879','ContinueError','groupSlotSessions','continueDecision','setup-reminders.mjs','context-injections.mjs','MEMORY.md'];const miss=keys.filter(k=>!t.includes(k));console.log(miss.length?('FAIL D-2 '+JSON.stringify(miss)):'OK D-2 127 row keys');process.exit(miss.length?1:0)"
```

```
D-3  cd D:\teamcode\thincoder && node -e "const fs=require('fs'),path=require('path');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.md')?[path.join(d,e.name)]:[]);const hits=walk('docs').filter(f=>!f.includes('_archive')&&!f.includes('batches')).filter(f=>fs.readFileSync(f,'utf8').includes('\u540c\u5f62\u91cd\u590d\u65cf\uff08#127\uff09'));console.log(hits.length===1?('OK D-3 single source '+hits[0]):('CHECK D-3 '+JSON.stringify(hits)));process.exit(hits.length===1?0:1)"
```

```
D-4  cd D:\teamcode\thincoder && node -e "const l=require('fs').readFileSync('docs/core/design/AGENT-LOOP.md','utf8').split('\n').find(x=>x.includes('#127'))||'';const pos=l.includes('MEMORY.md')&&l.includes('\u00a76.9');const neg=!l.includes('\u7aef\u524d\u7aef\u5f62\u6001');console.log(pos&&neg?'OK D-4 pointer-only':'FAIL D-4 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"
```

```
D-5  cd D:\teamcode\thincoder && node -e "const t=require('fs').readFileSync('docs/vsc/design/VSC-DEBT.md','utf8').split('\n');const ok=!!t.find(x=>x.includes('test/files.mjs')&&x.includes('117'))&&!t.find(x=>x.includes('test/files.mjs')&&x.includes('**116**'));console.log(ok?'OK D-5 files.mjs 117':'FAIL D-5');process.exit(ok?0:1)"
```

```
D-6  cd D:\teamcode\thincoder && node -e "const t=require('fs').readFileSync('docs/vsc/design/VSC-DEBT.md','utf8');const pos=t.includes('481 \u2192 489')&&t.includes('489 < 490')&&t.includes('\u4e0b\u6b21\u89e6\u78b0\u5373\u89e6\u7ebf');console.log(pos?'OK D-6 setup line rule':'FAIL D-6');process.exit(pos?0:1)"
```

```
D-7  cd D:\teamcode\thincoder && node -e "const t=require('fs').readFileSync('docs/batches/2026-09-20-doc-face-closure-batch.md','utf8');const a=t.includes('\u4e94\u8def\u5171\u6863')&&t.includes('\u5224\u4e0d\u8865');const b=t.includes('\u7b2c\u56db kind')&&t.includes('\u5224\u8865');console.log(a&&b?'OK D-7 rulings registered':'FAIL D-7 a='+a+' b='+b);process.exit(a&&b?0:1)"
```

```
D-8  cd D:\teamcode\thincoder && node -e "const t=require('fs').readFileSync('docs/core/requirements/TESTING.md','utf8');const n=(t.match(/\u5355\u5165\u53e3\u6267\u884c\u96c6/g)||[]).length;const pos=n>=4&&t.includes('scripts/doc-check-width.mjs')&&t.includes('scripts/doc-check.mjs');console.log(pos?('OK D-8 v2 wording x'+n):('FAIL D-8 n='+n));process.exit(pos?0:1)"
```

```
D-9  cd D:\teamcode\thincoder && node -e "const t=require('fs').readFileSync('docs/core/requirements/TESTING.md','utf8');const bad=[];for(const k of ['\u5feb\u5c42','check-ledger','check-doc-width'])if(t.includes(k))bad.push(k);console.log(bad.length?('FAIL D-9 '+JSON.stringify(bad)):'OK D-9 dead words clear');process.exit(bad.length?1:0)"
```

```
D-10 cd D:\teamcode\thincoder && node -e "const fs=require('fs');const t=fs.readFileSync('docs/batches/2026-09-20-residual-sweep-batch.md','utf8');const s=t.slice(0,t.indexOf('## \u00a73'));const pos=s.includes('\u5df2\u6536\u53e3')&&s.includes('\u5df2\u843d \u00b7 \u6279 2')&&s.includes('\u90e8\u5206\u5df2\u843d');const neg=!s.includes('\u672a\u843d \u00b7 \u8bfb\u6570\u5f85\u5b9e\u73b0\u8f6e');console.log(pos&&neg?'OK D-10 backfill':'FAIL D-10 pos='+pos+' neg='+neg);process.exit(pos&&neg?0:1)"
     域 = `## §3` 前（§1–§2）——§5 记录面引用（该档 `:328`）存史不回改，负向判不入域
```

```
D-11 cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .
     判据 = 按档归属零新增（本批改动档 = `AGENT-LOOP.md` / `VSC-DEBT.md` / `TESTING.md`：零新增悬空 ∕ 零新增超宽行——先例 = `docs/vsc/design/VSC-DEBT.md` §12.4#5）
     读法 = 逐条 `✗` 行核对 file 归属（他档存量 ∕ 他席在途增量不计入本批门禁）；全档读数只作过程记录
     预期读数 = 悬空 0 · 行宽 0 行（本刻基线实跑 = 候选 18360 / 悬空 0 / exit 0；行宽 OK）⇒ 净增义务 = 0，落笔后复跑同判
```

```
D-12 cd D:\teamcode\thincoder && node -e "const fs=require('fs');const L=f=>fs.readFileSync(f,'utf8').split('\n');const sel=[['docs/core/design/AGENT-LOOP.md',l=>(l.includes('\u540c\u5f62\u91cd\u590d\u65cf\uff08#127\uff09')||l.includes('\u9762\u7684\u673a\u5236 / \u5951\u7ea6\u6743\u5a01'))&&!/^-\s*2026-/.test(l),2],['docs/vsc/design/VSC-DEBT.md',l=>l.includes('test/files.mjs')&&l.includes('117'),1],['docs/core/requirements/TESTING.md',l=>l.includes('\u5355\u5165\u53e3\u6267\u884c\u96c6')||l.includes('doc-check'),6],['docs/batches/2026-09-20-residual-sweep-batch.md',l=>l.includes('\u5df2\u843d \u00b7 \u6279 2')||l.includes('\u90e8\u5206\u5df2\u843d')||(l.includes('\u72b6\u6001\u884c')&&l.includes('\u5df2\u6536\u53e3'))||(l.includes('\u5df2\u843d')&&l.includes('\u8bfb\u6570 = \u00a75')),4]];const bad=['~~','\u539f\u8bb0','\u65e7\u503c','\u6b64\u524d'];let out=[],n=0;for(const[f,pred,floor]of sel){const rows=L(f).filter(pred);n+=rows.length;if(rows.length<floor)out.push(f+' rows='+rows.length+'<'+floor);for(const k of bad)if(rows.some(l=>l.includes(k)))out.push(f+' has '+k)}console.log(out.length?('FAIL D-12 '+JSON.stringify(out)):('OK D-12 no revision residue x'+n));process.exit(out.length?1:0)"
     扫描面 = 本批全部规范面落点行：AGENT-LOOP 新行 + 收尾注行（变更记录行豁免——记录面）· VSC-DEBT 收正行 · TESTING 收正 6 行 · 回填档 4 行
     判据 = 行集非空（逐档计数下限 2 / 1 / 6 / 4）∧ 行集内 `~~` ∕ `原记` ∕ `旧值` ∕ `此前` 零命中（D8）
```

**落笔前预检三条（承评审 #7 · 本席已跑 · as-of 本刻）**：① 「同形重复族（#127）」全 docs 唯一（排除 `batches` / `_archive`）= 现盘 **0 命中** → 落笔后 1（= `AGENT-LOOP.md` 新行；`MEMORY.md` / 他档零命中）✓；② 他批档负向串「未落 · 读数待实现轮」= `2026-09-20-residual-sweep-batch.md` 内 **2 命中**（`:167` §2 面 + `:328` §5 记录面引用）⇒ D-10 否定判**限定域 = `## §3` 前**（记录面引用不回改）✓；③ `scripts/` 面 `check-ledger` 映射实读：盘上四档（`doc-check.mjs` / `doc-check-anchors.mjs` / `doc-check-targets.mjs` / `doc-check-width.mjs`）· 无 `check-ledger*` ⇒ 台账面**改述**（无承接——归核内 SQLite；映射单源 = `DOC-DISCIPLINE.md` §3.8）——§2.3-① `:103` 改法已按此收正 ✓。

**读数复核（raw · 人读对照）**：对七档实跑 `find /c /v ""`（路径 = 2.2-① 表全列）——期望 411 / 402 / 407 / 489 / 478 / 117 / 117（本刻实跑同值）。
**D-1 / D-6 / D-7 本刻已跑 = 绿**（⑤ 单类 ✓ · 贴线口径行 ✓ · 定论登记 ✓）；**D-11 基线本刻实跑 = 悬空 0 · 行宽 0（exit 0）**；**D-2–D-5 / D-8–D-12 = 落笔后跑**（D-10 / D-12 = 落笔后判据——本刻对现盘先跑为红，属预期）。

### 2.6 边界（本批不做）

产品码（②⑦⑥① 收口本体 · ④-b 源锚本体——登记另轮）· `scripts/**` · 归档档 · 冻结批档 §3–§6 他人段 · 他批记录体（P2 档）· 已收口面条款 · 行号漂移追改（D4）· 需求档笔（父侧）· 提示词双面 · 提示词模板。零新需求条目（全为存量收口）。

### 2.7 三向同源 + UI 决策

批档 §2 条目 3 条 = 设计表（2.1 / 2.2 / 2.3）= 台账 **#127 / #135 / #136** ✓。**UI / 交互决策：无（全文档面）。**

### 2.8 不一致处 / 上抛（A5 · 逐条附证据 · 未就地动）

| # | 级 | 发现 | 证据 | 处置建议 |
|---|---|---|---|---|
| 1 | 🟡 | 批档 §1 的 #127 括注三项（`buildSpawnChild` 收口 / 派发四调用点 / guard 双 helper——「两侧既有 ⇒ 单源在核」）与台账 #127 evidence + P3 §2.5 的 ②⑦⑥ 枚举（[4] 层尾块 / 多实例聚合 / memory schema）不符；三项均属 P2 面已闭事项 | 台账 #127 evidence 段 vs `2026-09-20-structure-consolidation-batch.md` §2.5 表 | 本设计**按台账 evidence + P3 §2.5 落**；请父侧复核 §1 括注（错植更正或显式改准） |
| 2 | 🔵 | 「TESTING §6.2 余 4 处」处数不可复现：现盘族扫 = 7 行（`:3` `:103` `:107` `:120` `:170` `:175` `:181`），本表判 收正 7 / 保留 2（处级） | 扫描命令 + 读数（2.3-①）；原始 4 处清单未入档 | 以现盘全扫逐处判为准；清单外零动作 |
| 3 | 🔵 | `test/files.mjs` 现盘 **117** ∥ VSC-DEBT `:278` 记 **116**（同批收口单件 +1 未回填） | 本刻 `find` 实读 + P2 §5 收口轮 ③ 自陈 117 | 已判收正（2.2-① · D-5） |
| 4 | 🔵 | `AGENT-LOOP.md` as-of 自陈 **564** ∥ 现盘 **567**（+3 = 后续批触碰漂移） | P2 §2.30 #13 记 564 + 本刻 `find` 实读 | 本批落登记行同轮刷新（承 P2 §2.29-#9）；不追改（D4） |
| 5 | 🔵 | P2 §6 遗留 ①（`findstr /c:"depc"` 锚不可命中）与 ②（五路坐标 as-of 偏 1）不在本批 §1 射程 | `2026-09-20-mechanism-parity-batch.md` §5 收口轮 ①② + §6 遗留 | 随报父侧排程（并入本批需扩 §1 授权；① 涉及 P2 §2.22 判据面 = 他批/已收口面） |

### 2.9 案例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| C1 | 正常 | 三车道逐条落笔（A 设计档 2 档 / B 需求档 / C 批档回填） | 落点与 2.1–2.3 目标文本逐字一致；D-1–D-12 全绿 |
| C2 | 边界 | 判保留项（`:3` · `:103` slow 门 · ③④ 端身份差异）· 码面另轮项 | 零触碰；判保留逐条带理由（2.1 / 2.3 表） |
| C3 | 错误 | 修订式残句入档 / 越界（产品码 · 他批 §3–§6 · 冻结面） | D-12 红；越界 = §5 停笔上报 |
| C4 | 边界 | 同档并行双改 / 净增 >0（新悬空 / 新超宽行） | 禁（2.4 分批）；D-11 净增 0 |

### 2.10 关键决策记录（含被否备选）

| # | 决策 | 理由 / 被否备选 |
|---|---|---|
| K-1 | #127 登记落点 = `AGENT-LOOP.md` §6.18 **单行** | 与 P2「同族事件载荷双改纪律」行同址先例；单源（D2）。**否决** = 分档登记（③ 提醒档 / ⑦ 多实例档 / ① 装配档——多源漂移）· 新建登记档（零收益） |
| K-2 | ②⑦⑥① 收口本体 = 登记 + 码面另轮 | 本批 = 零产品码批（§1 边界）；P3 §4「未裁先动产品码」为零动纪律 |
| K-3 | ④-b = **判补**（只读源锚） | 纪律面（§6.18 双改纪律）已有但零机检牙；一条只读对拍成本低、先例在册。**否决** = 判不补 |
| K-4 | ④-a = **判不补** | 拆 5 例零断言增量（仅诊断粒度）；P2 未采纳理由成立 |
| K-5 | 执行方分配：需求档 = 父侧 · 批档 §2 回填 = 设计席 · 设计档 = eng-designer | D1 写权矩阵（一段一作者） |
| K-6 | VSC-DEBT `:278` 收正（116 → 117） | 复核残余唯一实差；同批内生 +1 ⇒ 块语义（本批净读数）应含之。**否决** = 判 as-of 不动 |

### 2.11 设计评审修正轮（§3 轮次 1 · 7 条逐条落 · 2026-09-20 · eng-designer）

**轮次** = fix（定点 · 追加制）。**依据** = 本档 §3 轮次 1 发现表 7 条（🟡 3 / 🔵 4 · VERDICT = pass）——父侧逐条裁定**接受**（`Suggestion` 列 = 处置建议 · 处置执行 = 本席）。**改动形态** = ① 被点名处**就地改述 / 补写**（不留划改残迹——旧文可在 git 历史逐字复核）② 本节 = 追加制逐条记录（号 → 改动落点 → 机检断言 / 本轮实测读数）。**本轮零产品码 · 零设计档正文落笔 · 零需求档落笔**（需求档 = 父侧笔 · 落点见 §2.3-①）；**零新条目 · 不重开三条定案**（§2.6 边界不变）。

| # | 级 | 处置 | 改动落点（本档 §） | 机检断言 / 本轮实测读数 |
|---|---|---|---|---|
| 1 | 🟡 | D-11 补**判据 + 读法 + 预期读数**（按档归属零新增 · 全档读数只作过程记录——先例 = `docs/vsc/design/VSC-DEBT.md` §12.4#5） | §2.5 · D-11 块 | 本刻基线实跑 = `悬空 0` · `行宽 0` · `exit 0`（候选 18360）；落笔后复跑同判 |
| 2 | 🟡 | §2.1 补**清单生效条件**句（②⑦⑥ 清单以 §1 更正后的裁定为准——按台账 #127 evidence + P3 §2.5）；**§1 零触碰**（父侧笔） | §2.1 · 表前新段 | 落笔后断言：§2.1 含「清单生效条件」∧ §1「#127」行含「按台账 #127 evidence + P3 §2.5」（父侧已落 ✓ 本席实读） |
| 3 | 🟡 | ④-b 裁决纳**耐久设计面登记**：`AGENT-LOOP.md` §6.18「同族事件载荷双改纪律」行补**机检补充项**——#135 核销后触发面不复依赖本批档 | §2.1 · 登记落点 + §2.2-④(b) + §2.4 表（改 3 处） | D-2 键表补 `机检补充项`（本席已改 · 落笔后绿）；落笔后断言 = 该行含「机检补充项」 |
| 4 | 🔵 | **as-of 取值口径**写明：落笔后 `find /c /v ""` 实测 · 双值形态（落笔前 **567** → 落笔后 N——承 `:560` 双值先例）；落笔前以声明口径复核一次（本刻实读 = 567） | §2.1 · as-of 段 + §2.2-① 行内指针 | 落笔后断言：新变更记录行含 `567 →` |
| 5 | 🔵 | VSC-DEBT `:278` 目标文本 **+N 与行区间按实读定稿**——+5 = `:112-116`（批注行 + 三档 + T-QP 档）；原拟「另 2 行 = 并行批次在途」不可复现 ⇒ 不携入目标文本 | §2.2-① · 收正落点行 | 本刻实读：`thincoder-vscode/test/files.mjs` = **117**（`find /c /v ""`）· 本批行 = `:112-116`（`git show d383c5f0 --numstat` 该档 +15 = 显示面消差批 10 + 本批 5）；落笔后 D-5 绿 |
| 6 | 🔵 | D-12 **扫描面扩到本批全部规范面落点**（AGENT-LOOP 新行 + 收尾注行 · VSC-DEBT 收正行 · TESTING 收正 6 行 · 回填档 4 行；变更记录豁免） | §2.5 · D-12 块（命令 + 判据行） | D-12 新形 = 行集非空（逐档下限 2 / 1 / 6 / 4）∧ 残句零命中；本刻对现盘先跑 = **FAIL（行集未落：1 / 0 / 1 / 0）**——落笔后复跑绿 |
| 7 | 🔵 | **落笔前预检三条** + 预检所得**两条修正**：① §2.3-① `:103` 改法收正（台账面**无承接** ⇒ 改述；原拟「归 `scripts/doc-check.mjs`」与实盘 / `DOC-DISCIPLINE.md` §3.8 相抵）② D-10 否定判**限定域 = `## §3` 前**（原全域判被该档 §5 记录面引用打红） | §2.5 · 预检块 + §2.3-① 行 | ① 唯一性 = 现盘 0 → 落笔后 1 · ② 负向串实读 = 2 命中（该档 `:167` / `:328`）· ③ `scripts/` 实读 = 四档、无 `check-ledger*`（单源 = `DOC-DISCIPLINE.md` §3.8） |

**新发现（本席预检所得 · 上报 · 未就地动）**：`docs/core/requirements/TESTING.md:103`（F17 保留面枚举）内 `doc-consistency` V1 / V2 / V3 为**同族死对象**——V1–V3 一致性族已随 M8 机检重写批撤除（`scripts/doc-check-width.mjs:4`「砍 V1/V2/V3 一致性族」；`thincoder-vscode/test/files.mjs:49-50` 同载），不在本批 `:103` 两处收正表与 D-9 死词表内。**处置建议**：随 `:103` 同轮一并改述（同一行半改 = 留死对象），或显式登记残差（带到期条件）；**判定权 = 父侧**（需求档笔 · C 类）。

**边界**：同 §2.6；本节只记 §3 七条的直接导出项（含预检直接导出的两条修正），零夹带新语义。

**变更记录**：2026-09-20（**设计评审 §3 轮次 1 · 修正轮** · eng-designer）：7 条逐条落（1 → §2.5 D-11 · 2 → §2.1 表前段 · 3 → §2.1 登记落点 + §2.2-④(b) + §2.4 表 · 4 → §2.1 as-of 段 + §2.2-① · 5 → §2.2-① 收正落点 · 6 → §2.5 D-12 · 7 → §2.5 预检块 + §2.3-①）；预检导出修正 2 条（`:103` 改法收正 · D-10 域限定）；新发现 1 条上报（`doc-consistency` V1–V3）。**零产品码 · 零设计档正文 · 零需求档**（需求档 = 父侧笔）。

### 2.12 实施轮（设计席 · 车道 A + C · 2026-09-20 · eng-designer）

**轮次**：initial（实施轮 · 设计档笔面）。**落笔面** = §2.4 车道 A（设计档 2 档）+ 车道 C 设计席 3 行；零产品码 · 零需求档 · 零 §1 / §3–§6。**D6 回读** ✓（逐笔 edit context 核）。

**① 逐条「设计点 → 改动 file:line」**

| # | 设计点（§） | 改动（落盘后行号） |
|---|---|---|
| 1 | §2.1 · 登记落点「新行」 | `docs/core/design/AGENT-LOOP.md:426` **+1 行**「同形重复族（#127）双改纪律 + 收口登记」（①–⑦ 逐条含现状 + 判 + 落点 · ①③④ 双改纪律句 · ①②⑥⑦ 标「另轮 · 本批零动」· 回指 = P3 批档 §2.5 + `MEMORY.md` §6.9） |
| 2 | §2.1 · 机检补充项（承 §2.11 #3） | 同档 `:425`（同族事件载荷双改纪律行）句尾补「**机检补充项**」（#135 裁 · 端侧只读源锚对拍 · 判补 · 执行 = 码面小轮 · 触发 = 核事件族批 ∕ `subagent-queued-payload.test.mjs` 下次触碰） |
| 3 | §2.1 · 收尾注计数 | 同档 `:428`「十面」→「**十一面**」（纯计数收正 · 零修订式残句——D8） |
| 4 | §2.1 · as-of + 变更记录 | 同档 `:569-570` **+1 条**（含 `567 → 570 行` 双值；`find /c /v ""` 落笔后实测） |
| 5 | §2.2-① · 收正落点 | `docs/vsc/design/VSC-DEBT.md:278`：`**116**（本批 +4……）` → `**116 → 117**（本批 +5——批注行 :112 + 三档 :113-115 + T-QP :116；登记面）` |
| 6 | §2.3-② · 回填 | `docs/batches/2026-09-20-residual-sweep-batch.md:128`（执行方 →「**eng-coder 轮（已落 · 批 2）**」· 状态 →「**已落**」· 触碰列 +「读数 = §5 ②/③/④」） |
| 7 | §2.3-② · 回填 | 同档 `:129`（状态 →「**部分已落**（收正 24 + 判保留 5；余项在册）」· 触碰列 +「批 3 进度 = §6 角色表 / 遗留①」） |
| 8 | §2.3-② · 回填 | 同档 `:167`（「**未落 · 读数待实现轮**」→「**已落**（批 2）；读数 = §5 ②/③/④」） |

**② 机检读数（§2.5 命令原样复跑 · 先红 → 后绿）**

- **先红**（落笔前）：D-2 FAIL〔缺 5 键：同形重复族（#127）/ 十一面 / 机检补充项 / groupSlotSessions / continueDecision〕· D-3 `CHECK D-3 []`（0 命中）· D-4 FAIL pos=false neg=true · D-5 FAIL · D-10 FAIL pos=false neg=false · D-12 FAIL〔行集 1 / 0 / 1 / 0——与 §2.11 #6 先红读数逐字一致〕
- **后绿**：**D-2 OK**（键落位 = `:426` 新行 / `:425` 机检补充项 / `:428` 收尾注——§2.1 三处分工；D-2 判为全档 contains）· **D-3 OK**（单源 = `docs/core/design/AGENT-LOOP.md`）· **D-4 OK** · **D-5 OK** · **D-12 = 本席车道面绿**（AGENT-LOOP 行集 2 / VSC-DEBT 1）；D-1 / D-6 / D-7 复跑 = 绿
- **D-10 / D-12 残留 = 父侧面**（本席车道不可达）：① D-10 pos 第三元 `已收口` = §1 状态行（父侧笔 + 落笔次序后置——§2.3-②；本刻 `:8` 仍「🔄 进行中」）；② D-12 回填档行集 3/4（第 4 行 = §1 状态行）；③ D-12 TESTING 行集 1/6 = 车道 B（父侧笔）⇒ **父侧三处落笔后复跑即绿**
- **落笔缺陷 1 处（本席自查自正 · 如实登记）**：新行 ① 裸 `agent/helpers.mjs` = 悬空锚 ⇒ 首跑 doc-check 悬空 1 ⇒ 已改全路径 `thincoder-core/agent/helpers.mjs`，复跑归 0
- **D-11（C3）**：`候选 18425 · 悬空 0` · `OK(锚): 0 条悬空` · `OK(行宽): 源域全部 .md 无 >300 字符单行` · exit 0 ⇒ **本笔写集净增 0**（§2.1 目标「锚 0 · 宽 0」达成）
- **as-of 实测**：`AGENT-LOOP.md` **567 → 570 行**（`find /c /v ""` 口径）

**③ 不一致处（上抛 · 未就地动 · 附证据）**

| # | 级 | 发现 | 证据 |
|---|---|---|---|
| 1 | 🟡 | **sync 可达性批 `0987f3ee`（2026-09-20 14:17 落）漂移设计轮读数**：VSC `agent.mjs` 478 → **493** · `run-stages.mjs` 402 → **403** · `execute-tools.mjs` 407 → **418** · `setup.mjs` 489 → **495** · `test/files.mjs` 117 → **119**（+2 = `vsc-stream-rules.test.mjs` / `scoped-rules.test.mjs` 登记）⇒ §2.2-① 复核表与 VSC-DEBT §12.1 `:273-:277`「现盘」块按落笔时点已过时；且 `agent.mjs` 已越 490 触发线 · `setup.mjs` 已越 490 贴线 ⇒ 登记触发条件**已触** | `git show 0987f3ee --stat` + 本刻 `find /c /v ""` 实读 |
| 2 | 🔵 | `:278` 按 §2.2-① 定稿落 `116 → 117`（= 机制层端差批净读数 as-of 该批收口）；现盘 **119** = sync 批 +2（后批事件）——现势回填属他批登记面 | 同上 |
| 3 | 🔵 | 新行 ⑤ / ② 端侧坐标按**现盘**定稿（`:45` re-export / `:359` 起）；设计轮值（`:43` / `:355`）为 pre-sync 坐标；`:463 消费` 因漂移删略（D4：行号 = as-of） | `0987f3ee` 对 `agent.mjs` +2/+15 与 `setup.mjs` 前置漂移 |
| 4 | 🔵 | sync 批向 VSC [4] 层尾块增 `scopedRulesBlock`（`.cursor/rules` 常驻集）——② 同形对端差面 +1；② 收口（码面另轮）须覆盖该面 | `0987f3ee` VSC `setup.mjs` diff |
| 5 | 🔵 | D-10 / D-12 残留三项 = 父侧面（见 ②）——本席车道已尽 | 本刻 D-10 / D-12 读数 |

**边界**：同 §2.6；本节只记实施轮直接事实 + 读数 + 上抛，零新语义 · 零产品码 · 零需求档。

**变更记录**：2026-09-20（**实施轮 · 车道 A + C · eng-designer**）：设计档 2 档落笔 + 他批档 3 行回填；D-2/D-3/D-4/D-5 后绿 · doc-check 净增 0 · as-of 567 → 570；上抛 5 条（sync 批漂移为主）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 文档面收口批（#127 + #135 余三则 + #136 余项）批档 §2 全段（含 §2.4 三车道执行表与 D-1–D-12）。评审类型 = 设计评审。范围 = 批档 + `docs/core/design/AGENT-LOOP.md` + `docs/vsc/design/VSC-DEBT.md` + `docs/core/requirements/TESTING.md` 四档（产品码 / `scripts/**` / 他批档 / `MEMORY.md` 面按声明排除 ⇒ 相关断言标记 unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | D-11（批档 `:181`）只有命令、无判据：批档 §1.3 ②（`:25`）的「doc-check 净增 0（锚 0 · 行宽 0）」未落到命令级读法，且 VSC-DEBT §12.4#5（`:420`）自记全档存量 = 悬空 5 + 行宽 11（`:422`）⇒ `node scripts/doc-check.mjs --root .` 的期望（exit 0 ∕ 按档归属零新增 ∕ 全档读数只作过程记录）不可判，本批 12 条验收中唯一无判据者 | 写明 D-11 判据与读法（建议照 VSC-DEBT §12.4#5 先例：本批改动 3 档零新增悬空 ∕ 零新增超宽行，全档读数入记录），或直接给出与基线读数的对照式 |
| 2 | Requirements coverage | 🟡 | 批档 §1:14 的 #127 括注（`buildSpawnChild` 收口 / 派发四调用点 / guard 双 helper）与设计 2.1（`:48-50`）的 ②⑦⑥（[4] 层 system 尾块 / 多实例聚合 / memory schema）为两套清单；设计已在 2.8-①（`:203`）登记「按台账 evidence + P3 §2.5 落」，但该差异未决——若 §1 括注为准，本设计处置清单落错对象（台账 #127 / P3 §2.5 不在本评审范围，unverified） | 落笔前裁定 §1 括注（更正或显式改准），并在 §2.1 写明「清单以裁定为准」的生效条件 |
| 3 | Clarity（semantic dangling） | 🟡 | 2.2-④(b)（`:85-86`）的裁决「判补（只读源锚）」在耐久设计面无登记：行内容要点只列「码面另轮项（①②⑥⑦）」（`:57`），2.4 的另轮登记虽含 ④-b（`:136`）但只在批档内，触发（下次触碰 `subagent-queued-payload.test.mjs` 或核事件族批）无台账钩子 ⇒ #135 核销（§1.4 `:29`）后该项只剩本批 §2 | 把 ④-b 纳入 §6.18 行另轮登记（或挂既有「同族事件载荷双改纪律」行的机检补充项），使 #135 核销后仍有可触发指针 |
| 4 | Clarity | 🔵 | AGENT-LOOP.md as-of 刷新（`:76` / `:129`「改 2 处」）未给取值口径：改 `:561` 的「本档 as-of **564 行**」还是新记录记「落笔后 N 行」；若取现盘 567（落笔前读数），+1 行 / 追加 1 条落笔后即再漂 2–4 行（本评审读取工具报 568 行 ∕ 含末尾空行，两口径可能差 1） | 写明取值口径 = 落笔后按 `find /c /v ""` 实测记入本批变更记录（承 `:560`「571 → 落笔后 544 行」双值先例）；落笔前以声明口径复核一次 |
| 5 | Clarity（计数自洽） | 🔵 | VSC-DEBT:278 目标文本「本批 +5——三条机制层用例档登记 `:113-115` + 收口单件 T-QP 档登记 `:116`」所举为 4 行；原文 `:112-115`（4 行）与「+4」自洽 ⇒ 修正后 +N 与列举对不上（除非 `:112` 亦本批行但未写入文本）；D-5（`:157`）只查串 117 ∕ `**116**` 缺席，不校验 +N（`test/files.mjs` 为范围外，unverified） | 落笔前以 `test/files.mjs` 实读定稿 +N 与行区间（若 `:112` 属本批行，一并写入区间），或改用不依赖 +N 的写法 |
| 6 | Acceptance criteria | 🔵 | D-12（`:185`）残句扫描只覆盖 2 行（AGENT-LOOP 新行 + VSC-DEBT `:278`），而案例表 C3（`:215`）声称「修订式残句入档 → D-12 红」；本批其余规范面落笔（TESTING 收正 7 处 / 6 行（`:131`）、他批回填 4 行（`:132`）、收尾注与 as-of 行）不在扫描面 | 把 D-12 扫描面扩到本批全部规范面落点（TESTING 6 行 + 回填 4 行 + 收尾注行）；变更记录属记录面可维持豁免 |
| 7 | Clarity（可核性） | 🔵 | 三处落笔前提在本评审范围内不可核，且 D 系列无覆盖：(a) `check-ledger` → `scripts/doc-check.mjs` 的现役映射（`:103`，依据 = 残清批裁定 + `scripts/**`）；(b) D-3（`:149`）的「同形重复族（#127）」全 docs 唯一（`MEMORY.md` §6.9 / 台账未读）；(c) D-10（`:177`）负向串「未落 · 读数待实现轮」在他批档唯一 | 落笔前各跑一次预检（`grep -r "同形重复族" docs` 排除 batches/_archive ∕ 他批档全串扫 ∕ `scripts/` 面实读），或把三条列入 2.5 的落笔前 checklist |

**计数**：🔴 0 · 🟡 3 · 🔵 4（共 7 条）。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**2026-09-20 14:3x 父侧收口**

**交付核验（三道）**：设计轮（#42 · 三则）✓ · 评审（id=52 · **pass** 3🟡·4🔵）✓ → **修正轮（#55）7/7** ✓ · **实施**：车道 A（`AGENT-LOOP.md` §6.18 **+1 行**同形重复族 § `:425` **机检补充项** § `:428` **十面 → 十一面** § `:569-570` 变更记录 as-of **567 → 570** 双值 ✓）· 车道 C（他批档回填 3 行 ✓）· **车道 B（父侧笔 ✓）**：`requirements/TESTING.md` **收正 6 行 / 7 处**（F17 三项：文档锚判据 / 台账判据 / `scripts/doc-check-width.mjs` · F21 · §5.4 · F28 · N18 · §6.3）+ 同族补一处（§5.4 「`slow` 门阈值」→「归册线（500ms）」）+ **判保留 2 处**（`:3` 板块行 · `slow` 归册纪律）✓

**读数**：D-1 / D-2 / D-3 / D-4 / D-5 / D-6 / D-7 / D-10 / D-12 = **全绿** ✓（修正轮先红 → 实施后后绿留痕 ✓）· 机检 **锛 0 · 行宽 0** ✓

**父侧裁定与更正**：① 评审 #2（§1 护注 vs 设计清单）→ **父侧误写已就地更正**（§1:14 以台账 #127 evidence + P3 §2.5 为准 ✓）② `doc-consistency` V1/V2/V3（#55 新发现 · 同族死对象）→ **接受并补入本批** ✓（已落 `:103` ✓）③ 保留面二处（`:3` / `slow` 归册纪律）= 设计口径已定 ✓

**台账**：**#127 / #135（余项）/ #136 → 已核销** ✓（#135 主体已核 · 本批余项已落 ✓）

**遗留（显式）**：① `VSC-DEBT` §12.1「现盘」块刷新（台账 **#140**：四档读数漂移 · **注：触发线未触——`agent.mjs` 494（线 >495）· `setup.mjs` 495（线 >497）**）；② 需求面余 8 处（TESTING §6.2 内部叙述的深层条目——按判保留口径在册）；③ §6.2 余面与 `:3` 板块行随下次板块 sweep。

**提交**：`docs: doc-face closure (#127/#135/#136) — …`（本笔）+ `0987f3ee`（两批实施）· 已 push ✓。
