# 批次档 · 2026-09-17 · 异步子代理「零块」修复（subagent-zero-block）

> 段位：工程模式 v2（ENGINEERING-MODE-V2）follow-on —— 台账技术待办 **#19**（异步子代理「零块」）。
> 触发：用户 2026-09-17 22:10「把那个19处理了。」（从技术待办点名开批）。
> 授权：本批沿用用户 2026-09-17 22:08「自动跑完」同款自动链（代你点火评审；若要中途接管，会话面说一声即可）。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-17（异步子代理「零块」修复 · 台账 #19 已核销）

### 1.1 条目（台账 #19 要点）

**症状**：已起跑的异步子代理可能**不在活动面板出现任何块**——2026-09-16 实测：同一批派出者有的有块、有的零块；活体样本 `eng-coder#20` = **域冲突排队 → 域释放后起跑**，56 回合 24 分钟在跑、面板**零块**（同批直发 `#4/#6/#8` 均有块）。

**既有分析（2026-09-16 · explore#9）**：
- by-design 面：「`[model]` 延后到实际启动」是**有意为之**（queued 入队不画块）；
- 三窗口未验（relay `_wvReady` 边界 / history 数组身份更换孤儿窗口 / `started` 与首 chunk 时序）；
- **候选机制收窄（当时）**= 「该域释放补位路径未发 `[model]` 建块 token」；
- **修法（当时定方向）**= 把「域释放起跑」并入单一发射点（与 `subagent-run.mjs:143-145` 同点发 `⟦ev⟧async` + `[model]`；queued 态仍不画）；落点 = `subagent-scheduler.mjs` 的域冲突释放分支（**当时行号未实读——unverified**）；
- 判据（当时）= 定向复现（带 `files` 声明 → 造域冲突 → 释放 ⇒ 出块）+ 起跑即发两 token 的断言（含「queued 不发」反证）；
- 附带项 = 「spawn 站点必先调 `nextSubagentId`」补断言（当时「仅约定、无断言」）。

**（2026-09-17 设计轮收正）**：上述「候选机制 / 修法方向」假设已由**定向复现证伪**——起跑链（域释放补位）无缺陷；真根因 = **墓碑对存活条目生效**（RC-1，设计档 TUI.md §16.1）。附带项核对 = `nextSubagentId` 断言**已由 ED-5 落地**（`scheduler:412-428`）。本节 1.1 为条目存量表述，存史。

### 1.2 父侧 recon（2026-09-17 22:1x · 现行代码实核 —— 供设计轮根因重推导）

**启动路径全表（grep 实核 `.start()` 调用点）**：

| 路径 | 落点 | 说明 |
|---|---|---|
| 直发 | `thincoder-core/agent-tools/subagent-run.mjs:206` | spawn 即可跑 → `entry.start()` |
| 补位 | `thincoder-core/agent-tools/subagent-scheduler.mjs:369` | `maybeRefillAsync` 内 `queue.splice(pick,1)[0].start()` |
| escalate | `thincoder-core/agent-tools/escalate-async.mjs:298`（定义 `:253`） | 独立族 |
| advisor | `thincoder-core/agent-tools/advisor-async.mjs:421`（定义 `:374`） | 独立族 |

**单一发射点**：`subagent-run.mjs` 的 `entry.start()`（定义 `:126`；`⟦ev⟧async` + `[model]` 发射在 `:147-149`，注释明写「锚点 = 实际启动；queued 不 paint，补位启动才发」）。

**补位 = 唯一一条**：`maybeRefillAsync`（`scheduler:356-371`）扫描「依赖全满足 + 域无冲突」的 earliest 条目启动——**域释放与池容量共用同一函数**；调用点 = `agent/run-stages.mjs:232` · `agent-tools/async-settle.mjs:281` · `agent-tools/subagent-async.mjs:264` · CLI `src/tui/mouse.mjs:236`。

**⇒ 关键重推导入口**：条目 1.1「该域释放补位路径未发 token」的假设，**在现行代码中未找到独立分支**——域释放经同一 `maybeRefillAsync → entry.start()` 链路、发射点同一（若域释放起跑则必发）。故设计轮须：① 以**定向复现**先证伪或证实（复现不出 ⇒ 根因另有其面）；② 复核「面板零块」= **连排队块都未出现** ⇒ 嫌疑面含排队 paint 链（spawn 时 `⟦ev⟧queued` → `refreshQueuedTokens`（`scheduler:327-344`，**relay 异常被 catch 吞** `:342`））与三窗口；③ 若复现命中「起跑链无缺陷」，则本批落点转为**可观测性加固**（如：起跑时对建块失败留痕）。

**加固点核对**：「nextSubagentId 断言」**已由 ED-5 落**（`consumeSubagentToken` `scheduler:412-417` + `assertPoolKeyFree` `:424-428`）——待设计轮核销确认。

### 1.3 判据（承条目在册；设计轮可细化）

1. **定向复现**：带 `files` 声明 → 造域冲突 → 冲突解除 ⇒ **面板出块**（跑前/跑后对照）；
2. **token 断言**：起跑即发 `⟦ev⟧async` + `[model]`（含「queued 不发两 token」反证——by-design 语义不破）；
3. 若根因为不可复现的 relay 窗口 ⇒ 判据转为**留痕/降级可见**（禁静默）。

### 1.4 段序

1. 设计（eng-designer）：**根因重推导**（含定向复现试跑）+ 落点定案 + §2 任务书；
2. 设计评审（**自动链：代你点火**——沿用 22:08 授权）；
3. 父侧裁决 → §4（父侧代签）；
4. eng-coder 实施（按设计定案面）；
5. 父侧收口（§6）+ 台账 #19 核销。

### 1.5 父侧处置（设计轮交付后 · 2026-09-17 · 父侧直接执行——可 revert）

- **状态行补行**（§1）——`batch_segment` 门禁前提（设计者 §2 被拒一次；同款教训第二例——建批即置状态行，已入册）。
- **§2 父侧誊录组装**（设计者授权复用：交付报告原话「本报告即该正文的同源副本……可直接复用作 §2 文本」；表格 / 读数逐字，摘要处指向设计档 §16）。
- 设计轮发现处置：#1（§1.1 假设证伪）→ **Fixed**（本节 1.1 收正注）· #2（共享单点收口是否算扩族）→ **父侧裁定：不算扩族**（零新增按族代码）· #3（触发源不可重建）→ 如实登记 · #4（全仓机检 FAIL，早存）→ **登记**（#26 族）· #5（queued 取消幽灵块，未实跑）→ **登记**（另立技术待办）· #6（VSC 同族面）→ **登记**（本批边界 2.7）。
- **评审点火受阻 + 落点错（2026-09-17 22:2x 初判 → 22:24 父侧复核收正）**：① **设计落错了档**——基准层文档地图（`docs/README.md:3-4`）明定：产品 `docs/**`（`thincoder-cli/docs/`）＝**迁移期参照历史（保留 ≠ 维护）**；canonical CLI 设计 = `docs/cli/design/TUI.md`（2026-09-15 B 式迁移批复建、按读者面拆三档——`docs/cli/design/TUI.md:9`）。设计者（及父侧初判）误依旧路径把 §16 写进了**参照档**（`thincoder-cli/docs/design/TUI.md`——触「旧档原地一字不改」政策；其最后 git 提交 = 迁移期 `c4cdfee9`）。② 点火被拒真因 = **`docs/cli/` 部分层不在 manifest docRoot 五根内**（部分层 2026-09-15 建，manifest 未随更新）——canonical 档同样在此闸外。**收正计划**：fix 轮 = §16 自参照档收割 → 重落 canonical 档（按其三档结构定落点）→ 参照档恢复原状（收割前**不得**先 restore）；机制面（docRoot 纳入 cli/vsc 部分层）= 待用户裁。本批驻在评审闸前。台账 #32 描述已同步收正。

- **fix 轮中断记录（2026-09-17 22:31）**：id=7 被用户重启中断（partial 落草：`docs/cli/design/TUI.md` +125/−1，未审未报）——父侧已 `git checkout` 还原目标档至 HEAD，fix 轮**全新重派**（源 = 参照档 §16 完整无损）。
- **fix 轮重派（id=2）交付 + 父侧核验 ✓（2026-09-17 22:38）**：§6.8.3 全节（`:343-471` 八项齐）+ §6.8.1 指针行（`:311-312`）+ 变更记录（`:546-550`）+ 受影响文件表第 5 行（`:428`）实读相符；档 419→555 行；自检本批面零新增（悬空锚 837→837）。**§2 收正 14 条已父侧套改**（设计师 ③ 表 13 条 + 同源追加 AC-ZB5 回指一条〔③ 表外〕）；**参照档已恢复原状**（收割核验毕——`git checkout`）。
- **fix 轮发现处置（7 条）**：① 原文自相矛盾（dim/日志面）→ 就地收正（接受）· ② basename 双载 → 全路径（接受）· ③ 旧档编号指称 → canonical 编号（接受）· ④ 需求档无 N 条目 → **父侧裁定：台账 #19 为锚，本批不补**（CLI 需求档下次触碰携入）· ⑤ LOGGING.md 事件登记 + ⑥ 悬空节号（`TUI-SESSION-VIEW.md` / `TUI-COMMANDS.md`）→ **并入微 fix 轮**（零新语义一致性收口）· ⑦ 机检 / 外部并发 → 登记不改。
- **本批现态**：设计已落 canonical ✅；**待 docRoot 多根批（#32）落定后点火设计评审**（canonical 档纳入评审根依赖该批）。
- **微 fix 轮（id=4）交付 + 父侧核验 ✓（2026-09-17 22:45）**：LOGGING.md `:78`/`:79`（两事件入 `ev:*` 族·形态同款）+ `:148` 变更记录 · `TUI-SESSION-VIEW.md:216` / `TUI-COMMANDS.md:157`（`§9`→`§8`）+ 伴随变更记录 ×2——实读相符；机检零新增（837→837 · 4→4）。
- **微轮发现处置（5 条）**：①（`docs/cli/requirements/TUI.md:7` 同款悬空）→ **Fixed · 父侧直接执行**（`:7` `§9`→`§8` + 本档变更记录一行）；②（LOGGING `:82` 写入点枚举面）→ **Fixed · 父侧直接执行**（枚举补两新事件落点一句）；③（字段面未定）→ 登记（§5 实装后回填）；④（历史变更记录 `§9` 指称 = 时点材料）→ 不改；⑤ 接受（同族核对完成）。

- **评审轮次 1（2026-09-17 23:15 · VERDICT: changes-required——🔴1 / 🟡5 / 🔵5）**：发现表 + VERDICT 由**父侧转录**入 §3（评审子代理本轮未落段——§3 系父侧转录，已标注）；关键证据父侧逐条复核属实（`async-settle.mjs:259/:266` done-in-pool 留池 · `async-discard.mjs:13-14/:55` 留池判定与 `!done ∧ !cancelled` 存活式 · `subagent-blocks.mjs:81` 導碑守卫原意 · `TUI.md:414/:400/:458` 逐字）。🔴 = 存活判据「键在池内」与 done-in-pool 常态冲突。**处置**：发现 1/2/3/4/6/7/8/9/10/11 → **Accepted · 派 fix 轮**；发现 5（LOGGING 字段面）→ **Deferred**（实装后回填，§2.10③ 已登记）。
- **fix 轮（id=2）交付 + 父侧核验 ✓（2026-09-17 23:23）**：11/11 落位（四点同文 `TUI.md:397`/`:409`/`:426`/`:454` 实读一致 · helper 摘除面 `:400-406` · 契约 `:427-428` · 表格 `:436-446` · T-ZB/AC-ZB `:462-479`）——**§2 同源收正 9 条已父侧就地替换**（逐字照 §2.11 表 ①–⑨）；**§2.11 出批发现① 的 LOGGING 措辞收正已当场执行**（父侧直接执行 · 可 revert——`:78` 两处：存活判据收窄 + 「每次复活记一条」；同档变更记录一行）。**→ 评审核销轮（轮 2）待点火。**
- **出批观察登记（本批零碰）**：v1 台账档 `docs/TODO.md:46`（「零块」条目）仍载**已证伪的修法方向**（「域释放补位未发建块 token」——本批 §1.1 E1 已证伪）——v1 档归 **v1 文档退役批**（v2 §12；触发=条件）统一处置，本批零碰。
- **评审核销轮（轮 2，2026-09-17 23:28）**：**VERDICT: pass**（🔴0 / 🟡0 / 🔵2——2 🔵 = 行数口径注（`TUI.md:440`/批档 `:308`：576 与 read 报 577 的口径差）/ `§2:151` 加粗格式（已当场收正）；父侧处置 = 前者收口轮随 §6 收正——零语义）；发现表 + 计数由父侧转录入 §3。**→ §4 代签 + 派 coder。**

> 本节之后由 eng-designer 接手写 §2 批次任务与设计档修订（**已交付 · §2 由父侧誊录**）；设计就绪后由**用户发起**设计评审——本批经用户 2026-09-17 22:08「自动跑完」授权（**代点火**）。

## §2 批次任务（eng-designer）

> 写入方式 = **父侧誊录组装**（设计者 `batch_segment` 因 §1 缺状态行被门拒〔fail-closed〕；设计者授权直接复用——报告原话「本报告即该正文的同源副本……可直接复用作 §2 文本」；表格 / 读数逐字，摘要处指向设计档 §6.8.3）。状态行已由父侧补于 §1。

**状态：任务书就绪**（2026-09-17 · eng-designer）。实施者 = eng-coder（设计 token 门——签发在评审 + 用户批准之后，值不落文档）。
本 §2 = coder 任务书本体；逐字契约 / 数据流 / 用例与验收全文住设计档 `docs/cli/design/TUI.md` §6.8.3（6.8.3.1–6.8.3.8），本段只做任务书 + 口径锚。

### 2.0 根因与复现（设计者交付报告）

**根因 RC-1（正证——已复现）**：墓碑 `state._frozenSubKeys` 一旦写入某 key，`ensureSubTaskKey`（`subagent-blocks.mjs:82-83`）对该 key **永久返回 null** ⇒ 该条目**此后全部 token 被静默丢弃**（丢弃分支 `:181` 无痕）⇒ 面板永久零块，而子代理跑完 56 回合。
**§1.1 假设「域释放补位路径未发建块 token」= 证伪**：撞域 → queued → 域释放 → `maybeRefillAsync` → `entry.start()` **两 token 齐发**，真实 TUI waiting 块 → running 块，零异常。
**证据链 E1–E4 + 三入口表** = `docs/cli/design/TUI.md` §6.8.3.1（同类失效已被承认：`tool-events.mjs:202-204` 逐字注释 + `isAsyncSpawnResult` 守卫——但**只在 tool 结果一个入口设防**）。
**复现读数（原文 · 两段）**：

```
① ack          = {"id":"2","role":"explore","status":"queued","position":1,"waiting":"waiting-deps","reason":"waiting for: eng-coder#1（域冲突 src\a.mjs）"}
① tokens@spawn = ["explore#2/⟦ev⟧queued\x1ewait\x1e1\x1equeued\x1ewaiting for: eng-coder#1（域冲突 src\a.mjs）"]
② TUI block    = EXISTS queued={"kind":"wait","position":1,...} async=undefined
③ tokens@refill= ["explore#2/⟦ev⟧async\x1e","explore#2/[model]m"]
③ entry status = running | queue len = 0
④ TUI block    = EXISTS queued=null async=true model=m
⑤ unhandledRej = []
```

```
症状正复现：
① 入队后  panel块数 = 1 | subTasks = [ 'eng-coder#20' ]
② 清扫后  墓碑 keys = [ 'eng-coder#20' ] | subTasks = []
③ 起跑后  panel块数 = 0 | subTasks = []
④ 被缓冲未落地 _pendingAsyncKeys = [ 'eng-coder#20' ]
```

**触发源归属（如实标注）**：2026-09-16 事故的具体触发源**不可重建**（丢弃面按设计无痕）；修法落**墓碑生效点单一收口**，与触发源无关（D-ZB1）。

### 2.1 覆盖条目与不在本批

- **台账 #19**（本批唯一语义面）：块生命周期**墓碑存活闸**（显示面）+ 静默面留痕；**发射面零改**（E1 证无缺陷）。
- **不在本批**：见 2.7（边界）。

### 2.2 设计定案（逐条可机判——全文 `docs/cli/design/TUI.md` §6.8.3.2/§6.8.3.3）

| 定案点 | 结论 |
|---|---|
| 不变量（本批立） | **墓碑只能断言「此块已终」，不得对「仍在池中存活」的条目生效** |
| P0-a 存活复活 | `ensureSubTaskKey`（`subagent-blocks.mjs:80-99`）墓碑命中时先 `livePoolHas(state, key)`——存活判据 = **条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**（全文 §6.8.3.2/§6.8.3.3）——存活 ⇒ 摘墓碑 + **摘旧冻结载体行** + 照常建块（model/async 由后续 token 重填）；否则维持丢弃 |
| P0-b 清扫跳过 | `freezeAllSubTasks`（`subagent-freeze.mjs:142-154`）对**存活** key **跳过**（不置 done / 不写墓碑 / 不出 `subTasks`）——存活判据同①；**已终态（含 done-in-pool）照旧冻结**；池外照旧 |
| P1 留痕 | 复活分支 `logEvent("ev:subagent-block-revived")`（**每次复活记一条（无去重状态）**）；`refreshQueuedTokens` catch（`subagent-scheduler.mjs:340-342`）补 `logEvent("ev:queued-paint-failed")` |
| helper 归址 | `livePoolHas(state, key)` 定义于 `subagent-freeze.mjs`（与墓碑写点同址——墓碑条件与写入单一权威；`blocks → freeze` import 已存在 `:31` ⇒ 无环） |
| UI 决策 | 零新增 UI 形态——可见证据 = 块回归本身；留痕只走日志面（机判可查） |
| 降级 | `state._agent` 缺省（headless/夹具）⇒ 与批前**逐字等价**（丢弃），零回归 |

**关键决策 D-ZB1–D-ZB5**（含否决备选）= §6.8.3.5；**接口契约** = §6.8.3.3。

### 2.3 受影响文件表（5 行 · 行数 = 设计轮 read 实测，含尾行）

| # | 档 | 文件 | 现况 | 本批动作（file:line） | 预计后 |
|---|---|---|---|---|---|
| 1 | CLI·源 | `thincoder-cli/src/tui/subagent-blocks.mjs` | 437 | `:31` import 面加 `livePoolHas` / `removeFrozenSubTaskLine` · `:80-99` `ensureSubTaskKey` 墓碑分支加存活复活 + 旧载体行摘除 + 留痕 | ~460 |
| 2 | CLI·源 | `thincoder-cli/src/tui/subagent-freeze.mjs` | 176 | `:142-154` `freezeAllSubTasks` 加存活跳过 + 新增导出 `livePoolHas(state, key)` / `removeFrozenSubTaskLine(state, key)`（与墓碑写点同址） | ~205 |
| 3 | 核·源 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 429 | `:340-342` catch 补 `logEvent`（+ 顶注 import 面 `:12-22` 补 `logEvent`——现未 import） | ~437 |
| 4 | CLI·测 | `thincoder-cli/test/subagent-zero-block.test.mjs` | 新 | T-ZB1–T-ZB6（§6.8.3.6）；直驱 `routeSubToken` / `freezeAllSubTasks` / `refreshQueuedTokens`——零网络、零定时器 | ~120 |
| 5 | 设计档 | `docs/cli/design/TUI.md` | 419 | 本节（§6.8.3）+ §6.8.1 墓碑存活闸指针行 + 变更记录一行 | 555 行（本批已落） |

**跨文件限**：三份源档预计后均 < 500 硬限（460 / 205 / 437）——无拆分需要。

### 2.4 验收标准（AC-ZB1–AC-ZB7 · 逐条机判——`docs/cli/design/TUI.md` §6.8.3.7）

| # | 验收标准 | 机判 | 回指 |
|---|---|---|---|
| AC-ZB1 | 墓碑命中且条目**存活** ⇒ 复活建块 | T-ZB1 / T-ZB2 | 台账 #19 症状 |
| AC-ZB2 | 墓碑命中且条目**不存活**（池外 / `entry.done === true`〔含 done-in-pool〕/ `entry.cancelled === true`）⇒ 维持丢弃（迟到 chunk 丢弃语义不回归） | T-ZB3 | 批次档 §1.1 by-design 面 |
| AC-ZB3 | `freezeAllSubTasks` 不冻存活条目；已终态（含 done-in-pool）照旧冻结 | T-ZB4 | 批次档 §1.2 ②（清扫面） |
| AC-ZB4 | 发射面零改：域释放补位仍发 `⟦ev⟧async` + `[model]`；queued 仍不发 `[model]` | 既有断言（`advisor-pool-queue.test.mjs:86/211`——**仅 async 面**）+ T-ZB1（**`[model]` 面**落位断言） | 批次档 §1.3 判据 2 |
| AC-ZB5 | 降级面（无 `state._agent`）行为与批前逐字一致 | T-ZB5 | §6.8.1 降级路径条 |
| AC-ZB6 | 留痕：复活分支与 relay 异常各留一条可观测痕（禁静默） | T-ZB6 | 批档 §1.3 判据 3 |
| AC-ZB7 | 两端全量 `npm test` 绿 | `npm test`（cli + core） | 常规门 |

### 2.5 测试与判据口径

- 用例表 T-ZB1–T-ZB6 = `docs/cli/design/TUI.md` §6.8.3.6（正常 / 边界 / 错误齐）；测试档 = `thincoder-cli/test/subagent-zero-block.test.mjs`（新，~110 行；直驱零网络零定时器）；
- 既有断言对照 = `advisor-pool-queue.test.mjs:86/211` 同族（AC-ZB4）；全量门 = cli + core `npm test` 绿（AC-ZB7）。

### 2.6 eng-coder 任务书（六强制字段）

**① 目标与理由**——落台账 #19（用户 2026-09-17 22:10 点名）：修「墓碑对存活条目生效 ⇒ 全 token 流静默丢弃 ⇒ 面板永久零块」——修法 = 墓碑生效点单一收口（存活闸 P0-a/P0-b + 禁静默 P1）；发射面零改。
**② 轮次**——`initial`。
**③ 已知事实**——2.0 根因 / 复现读数 + `docs/cli/design/TUI.md` §6.8.3.1 证据链 / 三入口表 + §6.8.3.3 接口契约（`state._agent` 挂载先例 `thincoder-cli/src/tui/subagent-panel.mjs:123`；key 命名空间 `role#id`）；降级面契约 = §6.8.3.2 末。
**④ 设计要点与禁止范围**——实现面 = 2.3 表 1–4 行逐处；逐字契约照 `docs/cli/design/TUI.md` §6.8.3.2/§6.8.3.3（不得自创）。**禁触**：发射面（`subagent-run.mjs:147-149` · `subagent-scheduler.mjs:331-344`）· `isAsyncSpawnResult` 判定面 · `⟦ev⟧cancelled` 出队语义 · awaitingDigest 驻留与 `_freezeAt` 锚点 · `computePanelBlocks` 现算面 · VSC 面 · 提示词 / 需求档 / `_archive/**`。不新增按族分支（墓碑共享单点天然覆盖五族——**非扩族**，父侧已裁）；不引入块落盘恢复。行数实测回写 §5。
**⑤ 验收标准**——2.4 表 AC-ZB1–AC-ZB7（逐条机判；报告逐条读数）。
**⑥ 交付报告格式**——交付表（AC-ZB1–7 逐条）+ 触碰面清单（file:line + 行数实测改前→改后）+ 验证读数原文（新增测试档全绿 + cli/core 全量 `npm test`）+ 出批边界外所见；实施记录自写批档 §5（`batch_segment`，段 = §5）。

### 2.7 边界与出批登记（本批不做——`docs/cli/design/TUI.md` §6.8.3.8 同源）

- 不改发射面（E1 已证无缺陷）；不新增按族代码；不改 `isAsyncSpawnResult` / `⟦ev⟧cancelled` 语义 / awaitingDigest 驻留 / `computePanelBlocks`；
- 不引入块落盘恢复；不改提示词 / 需求档 / `_archive/**`；
- **VSC 对位不在本批**（独立实现 `panel-callbacks.mjs` / `suspension.mjs`）——登记观察项；
- 出批观察（设计轮发现 #5，未实跑）：queued 取消路径可能产生幽灵块（`⟦ev⟧cancelled` 删块后 settle 仍发 `⟦ev⟧stopped` ⇒ stopped 分支先建块再冻结+墓碑）——已另立技术待办。

### 2.8 发现与处置（F-1–F-6）

| # | 发现 | 处置 / 状态 |
|---|---|---|
| 1 | §1.1 假设被证伪 | **已处置**：§1.1 收正注（存史保留）+ 真根因入 2.0 |
| 2 | 真根因为墓碑共享单点——「共享单点收口、不新增按族代码」是否算扩族 | **父侧裁定：不算扩族**（零新增按族代码；五族覆盖为自然结果） |
| 3 | 触发源不可重建 | **如实登记**（2.0 末 + §6.8.3.1 末） |
| 4 | 全仓机检 FAIL（837 悬空锚 + 4 行宽）——早存非本批 | **登记**：归 #26 族 |
| 5 | queued 取消幽灵块（未实跑） | **登记**：另立技术待办（本批零碰） |
| 6 | VSC 同族面未触碰 | **登记**：本批边界（2.7） |

### 2.9 §2 收正记录（fix 轮 · 2026-09-17 · eng-designer · 收正重落 canonical 档）

**背景**：本批设计原误落参照档（`thincoder-cli/docs/design/TUI.md` §16——迁移期参照历史，保留 ≠ 维护）。本 fix 轮 = 自参照档**只读收割** → 重落 canonical 档 `docs/cli/design/TUI.md` **§6.8.3**；参照档由父侧恢复原状（收割已完成——**可以 restore**）。**零新语义**：§16 八项逐项迁移，仅适配 canonical 档编号与既有风格。

**落点判定理由（三档读者面）**：`docs/cli/design/` 三档按读者面拆分——界面核心档（`TUI.md`）承载**子代理活动区块的显示层契约**（§6.8）；`TUI-SESSION-VIEW.md` 承载会话恢复 / 回合驱动 / 显示层内存；`TUI-COMMANDS.md` 承载命令层与选择面。本机制 = 子代理块的**生命周期存亡规则**（墓碑生效条件 / 复活建块 / 清扫跳过）——读者面 = §6.8 子代理活动区块 ⇒ 落 **§6.8.3**（与 §6.8.1 去加戏 / §6.8.2 嵌套同层并列＝既有两例同款）。

**编号映射表（1:1）**：

| 旧（参照档 §16） | 新（canonical §6.8.3） | 项 |
|---|---|---|
| §16.1 | §6.8.3.1 | 问题陈述与根因（RC-1 + 证据链 E1–E4 + 三入口表） |
| §16.2 | §6.8.3.2 | 设计与逐字契约（P0-a / P0-b / P1 / UI 决策 / 降级） |
| §16.3 | §6.8.3.3 | 接口契约（读取面） |
| §16.4 | §6.8.3.4 | 受影响文件 |
| §16.5 | §6.8.3.5 | 关键决策 D-ZB1–D-ZB5 |
| §16.6 | §6.8.3.6 | 用例表 T-ZB1–T-ZB6 |
| §16.7 | §6.8.3.7 | 验收标准 AC-ZB1–AC-ZB7 |
| §16.8 | §6.8.3.8 | 边界 |

**§2 逐字收正文本**（行号 = as-of 本记录写入前；父侧就地替换——§2 为父侧誊录组装，本子代理只能 append）：

**① 2.2 设计行（强制项）**——定位（`§2:109`）现文：
`**2.2 设计定案（逐条可机判——全文 TUI.md §16.2/§16.3）**`
收正后逐字：
`**2.2 设计定案（逐条可机判——全文 `docs/cli/design/TUI.md` §6.8.3.2/§6.8.3.3）**`

**② 2.3 表第 5 行（强制项）**——定位（`§2:131`）现文：
`| 5 | 设计档 | `thincoder-cli/docs/design/TUI.md` | 1529 | 本节（§16）+ §6 F-2 行指针 + 变更记录一行 | 本批已落 |`
收正后逐字：
`| 5 | 设计档 | `docs/cli/design/TUI.md` | 419 | 本节（§6.8.3）+ §6.8.1 墓碑存活闸指针行 + 变更记录一行 | 555 行（本批已落） |`

**③ 其余 §16 指称同源收正（保持 §2 自洽——逐条逐字）**：

| # | 位置 | 收正后逐字 |
|---|---|---|
| ③-1 | 引言（`§2:72` 末） | …摘要处指向设计档 §6.8.3）。 |
| ③-2 | 引言（`§2:75`） | 本 §2 = coder 任务书本体；逐字契约 / 数据流 / 用例与验收全文住设计档 `docs/cli/design/TUI.md` §6.8.3（6.8.3.1–6.8.3.8），本段只做任务书 + 口径锚。 |
| ③-3 | 2.0（`§2:81`） | **证据链 E1–E4 + 三入口表** = `docs/cli/design/TUI.md` §6.8.3.1（同类失效已被承认：`tool-events.mjs:202-204` 逐字注释 + `isAsyncSpawnResult` 守卫——但**只在 tool 结果一个入口设防**）。 |
| ③-4 | 2.2 末行（`§2:121`） | **关键决策 D-ZB1–D-ZB5**（含否决备选）= §6.8.3.5；**接口契约** = §6.8.3.3。 |
| ③-5 | 2.3 表第 4 行（`§2:130`） | `T-ZB1..T-ZB6（§6.8.3.6）`（该行其余不动） |
| ③-6 | 2.4 标题（`§2:135`） | ### 2.4 验收标准（AC-ZB1–AC-ZB7 · 逐条机判——`docs/cli/design/TUI.md` §6.8.3.7） |
| ③-7 | 2.5（`§2:149`） | - 用例表 T-ZB1–T-ZB6 = `docs/cli/design/TUI.md` §6.8.3.6（正常 / 边界 / 错误齐）；测试档 = `thincoder-cli/test/subagent-zero-block.test.mjs`（新，~110 行；直驱零网络零定时器）； |
| ③-8 | 2.6 ③（`§2:156`） | **③ 已知事实**——2.0 根因 / 复现读数 + `docs/cli/design/TUI.md` §6.8.3.1 证据链 / 三入口表 + §6.8.3.3 接口契约（`state._agent` 挂载先例 `thincoder-cli/src/tui/subagent-panel.mjs:123`；key 命名空间 `role#id`）；降级面契约 = §6.8.3.2 末。 |
| ③-9 | 2.6 ④（`§2:157`） | 逐字契约照 `docs/cli/design/TUI.md` §6.8.3.2/§6.8.3.3（不得自创）。（该行其余不动） |
| ③-10 | 2.7 标题（`§2:161`） | ### 2.7 边界与出批登记（本批不做——`docs/cli/design/TUI.md` §6.8.3.8 同源） |
| ③-11 | 2.8 表第 3 行（`§2:174`） | \| 3 \| 触发源不可重建 \| **如实登记**（2.0 末 + §6.8.3.1 末） \| |

**本 fix 轮已落的机械面**（`docs/cli/design/TUI.md`）：§6.8.3 全节（`:343-…`，八项齐）+ §6.8.1 **墓碑存活闸指针行**（`:311-312`）+ 变更记录一行（`:546-550`，含收正说明）。**未触碰**：参照档（只读收割）、`thincoder-cli/**` 源与测试、需求档、`_archive/**`、其它 canonical 档。

**迁移期修正（零新语义——照收正）**：① `subagent-panel.mjs:123` → 全路径 `thincoder-cli/src/tui/subagent-panel.mjs:123`（该 basename 双载：CLI 与 core 同名档）；② 流程图注「dim 一行」→「日志面一行」（与本节 UI 决策「零新增 UI 形态」同源——原文自相矛盾处对齐决策面）；③ 旧档编号指称（`T-P5` / `§6 F-3` / `§17.5.5`）→ canonical 编号（§6.8.1 降级路径条 / 已结算待消化驻留零动）；④ 批次档路径改仓根相对（`docs/batches/2026-09-17-subagent-zero-block.md`）。

**自检读数**（`node scripts/doc-check.mjs`——M8 单引擎，日志 `.thincoder/tmp/dc-{base,after,final}.log`）：悬空锚 **837 → 837（零新增）**；行宽 **4 → 4（零新增）**；目标档新增**报告面**行 6 条（`livePoolHas` ×5 · `liveKeys` ×1——设计轮前瞻符号，实装后自动消失；报告面·**不入闸**）；**拟新增 1 条** = 前瞻测试档 `thincoder-cli/test/subagent-zero-block.test.mjs`（批 9 族豁免·列报不入闸）。**行数**：`docs/cli/design/TUI.md` 419（read 口径）→ **555**。

**设计面发现（出批登记项——父侧裁）**：① 需求档 `docs/cli/requirements/TUI.md` 无本机制 N 条目（本批需求锚 = 台账 #19）——三链之一（需求面）现由台账承接；② 新增日志事件 `ev:subagent-block-revived` / `ev:queued-paint-failed` 未登记入 `docs/core/design/LOGGING.md` §6.2「事件面（v1 覆盖）」——登记点 = 该档 `:77` `ev:*` 族（**本批未动**＝范围外，登记备裁）；③ `TUI-SESSION-VIEW.md` / `TUI-COMMANDS.md` 变更记录行内「由 `docs/cli/design/TUI.md` §9 拆分沿革登记」= 悬空节号（canonical 界面核心档无 §9，现为 §8 不并项与历史沿革）——**一致性面**、非本批面，登记备裁。

**读数补正（本记录写入后复跑 · `node scripts/doc-check.mjs`）**：行宽计 **5 行** = 4 行早存 + **1 行外部并发新增**——`docs/core/design/MANIFEST.md:275`（450 字符，内容 = **docRoot 多根批**「2026-09-17 · eng-designer」changelog 行；该批与本批并行、非本批触碰面）。**本批面（`docs/cli/design/TUI.md`）行宽零新增、悬空锚零新增**（两次复跑仅该外部行出现差异）。同批并行面另见：`PROJECT-MANIFEST.json` / `docs/core/design/prompts/persona-engineering.md` 等 = 他批在途（`git status` 可见）——本批零碰。

### 2.10 微 fix 轮（2026-09-17 · eng-designer · 出批发现 ⑤⑥ 零语义收口）

**背景**：承 §2.9 设计面发现 ⑤⑥，父侧裁定并入微 fix 轮——（a）新增日志事件登记入 `docs/core/design/LOGGING.md` §6.2 事件面；（b）两处悬空节号收正。范围 = **只做这两项**（零新语义 / 不新增事件 / 族描述与机制条文零改）；`src/**` · 需求档 · 参照档零碰。

**落点（as-of 落档后）**：

| # | 项 | 落点 |
|---|---|---|
| 1 | 事件登记（2 条） | `docs/core/design/LOGGING.md:78-79`（§6.2 事件面——`ev:*` 族内、`err:internal` 前） |
| 2 | LOGGING 变更记录一行 | `docs/core/design/LOGGING.md:148` |
| 3 | 悬空节号收正 | `docs/cli/design/TUI-SESSION-VIEW.md:216`（§9 → §8） |
| 4 | 该档变更记录一行 | `docs/cli/design/TUI-SESSION-VIEW.md:206` |
| 5 | 悬空节号收正 | `docs/cli/design/TUI-COMMANDS.md:157`（§9 → §8） |
| 6 | 该档变更记录一行 | `docs/cli/design/TUI-COMMANDS.md:153` |

**族内形态对照**（新条目 vs §6.2 既有条目——同款：粗体事件名 + `——` 语义 + 反引号写入点）：

- 既有：**`ev:settled` / `ev:stopped` / `ev:cancelled`** —— settle 回调分流 + **中止清池 `ev:stopped`**（…）；字段 id / kind / poolN / where。
- 新增①：**`ev:subagent-block-revived`** —— 墓碑存活闸**复活分支**留痕（`thincoder-cli/src/tui/subagent-blocks.mjs` `ensureSubTaskKey`——墓碑命中但条目**池内存活（在池 ∧ 非 done / 非 cancelled）** ⇒ 摘墓碑 + 重建块；**每次复活记一条（无去重状态）**）。
- 新增②：**`ev:queued-paint-failed`** —— 排队块刷新 relay 异常留痕（`thincoder-core/agent-tools/subagent-scheduler.mjs` `refreshQueuedTokens` catch——池状态不被破坏）。

**字段面（如实标注）**：设计源 `docs/cli/design/TUI.md` §6.8.3.2 P1 只定事件名与留痕条件、**未定字段**——登记面不携字段（禁造 / 零新语义）；实装后（§5）可按实测回填。

**发现与处置（本子代理面）**：

| # | 发现 | 处置 |
|---|---|---|
| 1 | `docs/cli/requirements/TUI.md:7` 同款悬空节号（引 `docs/cli/design/TUI.md` §9） | **不处置**——需求档 = 主 agent 笔，移交主 agent 收正 |
| 2 | `docs/core/design/LOGGING.md:82`「写入点落位」内「`ev:*` 在子代理族 spawn / settle 分流点」= **枚举面**；本批两事件写入点（显示层 blocks / 核 scheduler 排队刷新）在该枚举外 | **登记**——父侧未授权改该行，本批零碰、备裁（§6.2 内两处口径并轨） |
| 3 | 同批档案核对：`docs/cli/design/TUI-TOOL-OUTPUT.md` 变更记录**无**同款指称 | 该族悬空点全集 = 落点 #3 / #5 + 发现 1（三处，均已定位） |

**自检读数**（`node scripts/doc-check.mjs` · 前后各一跑，日志 `.thincoder/tmp/dc-zbmfix-{base,after}.log`）：悬空锚 **837 → 837（零新增）** · 行宽 **4 → 4（同 4 行早存——零新增）** · 拟新增 **3 → 3** · 候选 16397 → 16405（新增引用全解析）；`src/**` 零改动 · 参照档零碰。

### 2.11 设计评审轮次 1 修正记录（2026-09-17 · eng-designer · fix 轮）

**背景**：设计评审轮次 1 = **changes-required**（发现表 11 条：🔴1 / 🟡5 / 🔵5——§3 父侧转录）。父侧逐条裁定：**#1/2/3/4/6/7/8/9/10/11 = Accepted · 派 fix 轮**；**#5（LOGGING 字段面）= Deferred**（实装后回填）。本轮 = **只改设计文档**（`docs/cli/design/TUI.md` §6.8.3）——`src/**`、需求档、参照档、`LOGGING.md` 均零碰（#5 裁定「不碰该档」）。

**逐条处置（发现号 → 落点；行号 = as-of 本轮写入后）**

| # | 级别 | 处置 | 落点（`docs/cli/design/TUI.md`） |
|---|---|---|---|
| 1 | 🔴 | 存活判据逐字收窄：**条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**——P0-a / P0-b / 接口契约池读取行 / D-ZB3 **四点同文**（实读校验 4 处逐字一致）；P0-b 明写「已终态（含 done-in-pool）照旧冻结」；T-ZB3 增 done-in-pool 边界断言；T-ZB4 增「池内 done-in-pool 照旧冻结」向；AC-ZB2 / AC-ZB3 同步 | P0-a `:397` · P0-b `:409`/`:410` · 池读取 `:426` · D-ZB3 `:454`；T-ZB3 `:464` · T-ZB4 `:465`；AC-ZB2 `:474` · AC-ZB3 `:475` |
| 2 | 🟡 | P0-a 写死旧冻结载体行处置（二选一取「**摘除**」）：新增 helper `removeFrozenSubTaskLine(state, key)` = 摘该 key 全部 `_frozenSubTask` 载体行 + `releaseLine` 负向出账 + 摘除位之后 `_freezeAt` 在途锚点 −1；T-ZB1 增机判 | P0-a `:400-404` · helper 归址 `:405-406` · 接口契约 helper 行 `:427` · 受影响文件表 1/2 行 `:436-437` · T-ZB1 `:462` |
| 3 | 🟡 | 接口契约写死 key 映射规则（最后 `#` 切分 → `role` + `id`；命中 = `pool.has(String(id))` ∧ `entry.role === role`；非池键（`compress#N` 等）= false）+ 池键 = `String(id)` 证据（`subagent-run.mjs:187` / `advisor-async.mjs:410`）；T-ZB1 夹具改真实池键形 `set("2", entry)` | `:428`（映射行）· `:462`（T-ZB1 输入） |
| 4 | 🟡 | 本节（§2.11）补建——评审声明所引之节：逐条处置表 + 自检读数 + §2 同源收正文本 | 本节 |
| 5 | 🟡 | **Deferred**（LOGGING 字段面——实装后按实测回填；本轮零碰该档） | —（§2.10③ 登记保持） |
| 6 | 🟡 | §6.8.3.4 补 >300 两档审视结论（F-R24a：函数档核查 + 无需拆分 + 存量债登记） | `:444-446` |
| 7 | 🔵 | 数值收正：跨文件限行与表内同数（460 / **205** / 437——190→205 随 #2 新增 helper 重估、462→460 为复估） | 表 `:436-437` · 跨文件限 `:442` |
| 8 | 🔵 | 坐标收正：顶注 import 面 `:10-12` → **`:12-22`**（实读：`subagent-scheduler.mjs` import 语句块 = `:12`–`:22`） | `:438` |
| 9 | 🔵 | AC-ZB4 回指收窄：既有断言标注**仅 async 面** + T-ZB1 明列 **`[model]` 面**落位断言 | `:476` · `:462` |
| 10 | 🔵 | 「每 key 一次」→「**每次复活记一条（无去重状态）**」（+ 去重须新增载体 = 第二份存活账 ⇒ 否决）；流程图同款同改 | P1 `:413-415` · 流程图 `:391` |
| 11 | 🔵 | 入口表第 1 行加可达条件注：回合尾站点执行时两池必空 ⇒ P0-b 对存活条目不可达；**P0-b 真实生效面 = `suspension-drive.mjs:296`** | `:372`（〔① 注〕）+ 注文 `:378-380` |

**派生一致性收正（零新语义——由 #3 直接派生）**：§6.8.3.8 边界行补「**复活可达面** = 键可映射到两池条目者（subagent / escalate / advisor）；非池键（`compress#N` 等）判 false ⇒ 维持既有丢弃语义」——与 #3 映射规则同源（原句「天然覆盖五族」单独读会与映射规则矛盾）。落点 `:484`。

**留痕**：本档变更记录一行（`:562-566`）。

**自检读数**（`node scripts/doc-check.mjs` · M8 单引擎；日志 `.thincoder/tmp/dc-zbfix-{base,after,final}.log`）：

- **悬空锚 837 → 837（零新增）**——首跑曾 **+5**（`:397` / `:410` / `:426` / `:454` 的 `async-discard.mjs:*` 与 `:402` 的 `subagent-panel.mjs:50` 用**裸 basename**；两者双载〔core+vscode / CLI+core〕⇒ 判悬空）→ 全路径化后复跑归零（**§2.9 迁移期修正①同款教训再证**：双载 basename 必全路径）；
- **行宽 4 → 4（零新增）**；本档全档无 >300 行（收正后 `:426`/`:428`/`:454` = 288 / 282 / 293）；
- **拟新增 3 → 3**；候选 16421 → 16479；
- 本档报告面（**不入闸**）：`livePoolHas` ×5 · `removeFrozenSubTaskLine` ×6 · `liveKeys` ×1（前瞻符号 = 拟实现面，实装后自动消失）；
- 档行数 **555 → 576**（read 口径·含尾行；受影响文件表第 5 行 `:440` 已同步「→ 576 行」）。

**§2 同源收正（父侧就地替换——逐字；行号 = as-of 本节写入前；§2 为父侧誊录组装，本子代理只能 append）**：

| # | 位置 | 收正后逐字 |
|---|---|---|
| ① | 2.2 表 P0-a 行（`§2:121`） | \| P0-a 存活复活 \| `ensureSubTaskKey`（`subagent-blocks.mjs:80-99`）墓碑命中时先 `livePoolHas(state, key)`——存活判据 = **条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`（running/queued）**（全文 §6.8.3.2/§6.8.3.3）——存活 ⇒ 摘墓碑 + **摘旧冻结载体行** + 照常建块（model/async 由后续 token 重填）；否则维持丢弃 \| |
| ② | 2.2 表 P0-b 行（`§2:122`） | \| P0-b 清扫跳过 \| `freezeAllSubTasks`（`subagent-freeze.mjs:142-154`）对**存活** key **跳过**（不置 done / 不写墓碑 / 不出 `subTasks`）——存活判据同①；**已终态（含 done-in-pool）照旧冻结**；池外照旧 \| |
| ③ | 2.2 表 P1 行（`§2:123`） | 仅括注改：`logEvent("ev:subagent-block-revived")`（**每次复活记一条（无去重状态）**） |
| ④ | 2.3 表行 1–4（`§2:134-137`） | `~462` → **`~460`** · `~195` → **`~205`** · `:10-12` → **`:12-22`** · `~110` → **`~120`**；行 1/2 动作面补 `removeFrozenSubTaskLine`（逐字照设计档 §6.8.3.4 表） |
| ⑤ | 跨文件限（`§2:140`） | **跨文件限**：三份源档预计后均 < 500 硬限（460 / 205 / 437）——无拆分需要。 |
| ⑥ | AC-ZB2 行（`§2:147`） | 逐字照设计档 §6.8.3.7 `:474`（不冻存活 / 已终态含 done-in-pool 照旧冻结的两向句） |
| ⑦ | AC-ZB3 行（`§2:148`） | 逐字照设计档 §6.8.3.7 `:475` |
| ⑧ | AC-ZB4 行（`§2:149`） | 逐字照设计档 §6.8.3.7 `:476`（既有断言「**仅 async 面**」+ T-ZB1「**`[model]` 面**」） |
| ⑨ | §2.10 新增①（`§2:261`） | 「…墓碑命中但条目**池内存活** ⇒ 摘墓碑 + 重建块；**每 key 一次**）」（载 LOGGING 登记逐字）→「…墓碑命中但条目**池内存活（在池 ∧ 非 done / 非 cancelled）** ⇒ 摘墓碑 + 重建块；**每次复活记一条（无去重状态）**）」 |

（⑥/⑦/⑧ 以设计档为单一权威——逐字照抄即可；本表不重复长句，避 D2 双载。）

**出批发现（移交父侧——本轮零碰面）**：

- **`docs/core/design/LOGGING.md:78`**（#5 缓办档）：事件描述两处与 #1/#10 收正后**不再同文**——①「条目**池内存活**」未携收窄判据；②「**每 key 一次**」与「每次复活记一条（无去重状态）」冲突。父侧裁定「不碰该档」⇒ **本轮未改**；建议随 #5 回填轮同改（措辞级，逐字同本表 ⑨ 右列）。
- **无其它出批面**：`src/**` 零改；需求档零改（`docs/cli/requirements/TUI.md` 无本机制 N 条目——需求锚 = 台账 #19，§2.9 已登记）；参照档零碰。

## §3 设计评审（评审子代理）

> **父侧转录**（评审子代理本轮未落段——发现表 + VERDICT 按评审报告逐字转录；出处 = 评审轮次 1，2026-09-17 23:15）。
> 评审对象：`docs/cli/design/TUI.md` §6.8.3 + §6.8.1 指针行 · `LOGGING.md` §6.2 · 批档 §2。
> **说明**：本节现含两条——轮 1（父侧转录，见下）与轮 2 核销（工具追加、戳号为工具计数口径「轮次 1」——与轮号错位属工具口径，历史事实登记）。

**VERDICT: changes-required** ｜ 计数：🔴1 · 🟡5 · 🔵5（共 11 条）

| # | File | Severity | Issue（摘要） | Suggestion（摘要） |
|---|---|---|---|---|
| 1 | `TUI.md:414`（连带 `:400` / `:458`） | 🔴 | 存活判据「键在池内」与 done-in-pool 语义冲突：池内常态含已 settle 未收集条目（`async-settle.mjs:259/:266` · `async-discard.mjs:13-14`）⇒ P0-a 对已终态同样复活（违 AC-ZB2 与 `subagent-blocks.mjs:81` 導碑守卫原意）；P0-b 与 `:400`「已终态照旧冻结」自相矛盾；迟到 chunk 自述为「正常高频面」（`:440`） | 判据收窄为「在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`」，三处同文；T-ZB3 补 done-in-pool 边界用例 |
| 2 | `TUI.md:399-400` + `subagent-freeze.mjs:89-92` / `render-segments.mjs:76` / `subagent-panel.mjs:50` | 🟡 | 复活后旧冻结载体未处理：導碑源已把 `_frozenSubTask` 行 splice 进流，P0-a 只删導碑+建新块 ⇒ 一 key 两载体、共用折叠键 `sub-${key}`（`:284` 明定无缝衔接），旧块永久留流 | §6.8.3.2 明写旧行处置（优先复活时摘除，或如实登记后果）+ 用例机判 |
| 3 | `TUI.md:414-416` | 🟡 | 块键 `role#id` ↔ 池键 `String(id)`（`subagent-run.mjs:187` / `advisor-async.mjs:410`）映射规则未定义——照字面 `pool.has(key)` = 恒 miss（静默失效） | 写死映射规则（最后 `#` 切分 + `entry.role` 比对 + 非池键 false）；T-ZB1 用真实池键形 |
| 4 | 批档 `:241` 末节 | 🟡 | 评审对象声明引「§2.11 修正记录」而全文无 §2.11（grep 零命中） | 补写 §2.11 或收正指针（二选一） |
| 5 | `LOGGING.md:78-79` | 🟡 | 协调项（非缺陷）：两新事件条目未携字段面（同族既有条目皆带字段；`:77`） | 实装轮按实测回填（§2.10③ 已登记）——不阻塞本设计 |
| 6 | `TUI.md:424-430` | 🟡 | 超档（>300 advisory）未给「主动审视/拆分规划」标注（blocks 437→~462 · scheduler 429→~437；判据 = `METHODOLOGY.md:67` F-R24a） | >300 两档各补一句审视结论（或登记存量债） |
| 7 | `TUI.md:430` vs `:424-425` | 🔵 | 数值漂移：表内 ~462/~195 vs 跨文件限行 460/190 | 收正一处 |
| 8 | `TUI.md:426` | 🔵 | 坐标精度：「顶注 import 面 `:10-12`」实际 import 块 = `:12-22` | 收正 |
| 9 | `TUI.md:460` | 🔵 | AC-ZB4 回指与断言内容不完全对应（`advisor-pool-queue.test.mjs:86/:211` 均 async 面） | 回指收窄或 T-ZB1 补 `[model]` 面 |
| 10 | `TUI.md:402`（P1①「每 key 一次」） | 🔵 | 去重语义未定（導碑删后可再次复活；若要去重则需新增状态） | 明写「每次复活一条（无去重状态）」或指定载体 |
| 11 | `TUI.md:372`（入口表第 1 行） | 🔵 | 站点可达条件未注：`agent-turn.mjs:232/:240` 决定该站点执行时两池必空 ⇒ P0-b 在此恒 no-op（真实生效面 = `suspension-drive.mjs:296`） | 入口表加可达条件注（不改落点） |

**亮点**：根因证据链完整（E1 证伪旧假设处置正确）· 落点单一收口与非逐源打补丁取舍合理 · 坐标抽查无一虚指 · 用例三态齐备。

### 轮次 1（评审子代理）

**核销轮（轮 2）结论**：只核 §3 轮次 1 发现表 11 条 + `LOGGING.md:78` + 批档 §2 同源收正 9 条 + §2.11 的修复落位——**11/11 落位属实**（#5 依父侧裁定 Deferred 保持）；四点同文 `TUI.md:397`/`:409`/`:426`/`:454` greps 实读逐字一致；helper 摘除面 `:400-406`；key 映射 `:428`；>300 审视 `:444-446`；T-ZB/AC-ZB `:462-479`；入口表注 `:372`/`:378-380`；`LOGGING.md:78` 措辞收正到位（+`:152` 变更记录）；§2 九条逐条对照一致；§2.11 已建（批档 `:278-329`）。

计数：🔴 0 · 🟡 0 · 🔵 2

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene（行数口径） | 🔵 | `TUI.md:440` 与批档 `:308` 记「→ 576 行（read 口径·含尾行）」；实读 read 工具报「577 lines total」（末行 = 空行；同口径对照 `LOGGING.md` 报 153 总行而末内容行 = 152）——空尾行是否计入的标注歧义，读数差 1 | 统一尾行口径（如注「576 内容行 · read 显示 577 行含尾空行」），或按工具口径收正为 577 |
| 2 | Doc hygiene（逐字格式） | 🔵 | 批档 `:151`（AC-ZB4 行）与设计档 `TUI.md:476` 非逐字——「**仅 async 面**」「**`[model]` 面**」两处加粗标记在 §2 版丢失（文字内容一致，仅 markdown 格式） | `§2:151` 补加粗对齐，或把 §2.11 ⑧ 的「逐字照」降为「内容照」 |

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-17 23:28 · 父侧代签**（用户 2026-09-17 22:08「自动跑完」授权——代签承 2026-09-11 先例）——批准范围：

1. **设计**：§6.8.3 零块修复（墓碑存活闸 P0-a/P0-b + 禁静默 P1——`docs/cli/design/TUI.md` §6.8.3 全节 + §6.8.1 指针行 + `LOGGING.md` §6.2 两事件）；**评审全链**：轮 1 changes-required（🔴1 / 🟡5 / 🔵5——父侧转录入 §3）→ fix 轮（id=2，11/11 落位 + 父侧核验）→ 轮 2 核销 **PASS**（🔴0 / 🟡0 / 🔵2——2 🔵 收口轮随 §6 收正）。
2. **实现**：spawn `eng-coder`（任务书 = 本节 §2；设计凭证已签发——值不落档，运行时凭证）。
3. **实施面 = §2.3 表 1–4 行**（blocks / freeze / scheduler / 新测试档）；出批边界 = §6.8.3.8。**零禁令**：发射面（`subagent-run.mjs:147-149` / `subagent-scheduler.mjs:331-344`）零改——E1 已证无缺陷。

## §5 实施记录（eng-coder）

**状态行**：✅ 完成（初轮交付 → 内部偏离审计 0 偏离 → advisor 代码评审 pass；机判读数见 5.3）

### 5.1 交付摘要（台账 #19 · 实施面 = §2.3 表 1–4 行，零扩面）

1. **`thincoder-cli/src/tui/subagent-freeze.mjs`** —— 新增导出 `livePoolHas(state, key)`（存活判据**逐字** =「条目在池 ∧ `entry.done !== true` ∧ `entry.cancelled !== true`」；key 映射 = 最后 `#` 切分 + `entry.role === role` + 非池键 false）与 `removeFrozenSubTaskLine(state, key)`（摘该 key 全部 `_frozenSubTask` 载体行 + `releaseLine` 负向出账 + 摘除位**之后**锚点 −1）；`freezeAllSubTasks` 加 **P0-b 存活跳过**（已终态含 done-in-pool / 池外照旧冻结）。
2. **`thincoder-cli/src/tui/subagent-blocks.mjs`** —— `ensureSubTaskKey` 墓碑分支加 **P0-a 存活复活**（`livePoolHas` 命中 ⇒ 摘墓碑 → 摘旧载体行 → 留痕 → 照常建块；不存活 ⇒ 维持丢弃）；import 面补 `livePoolHas` / `removeFrozenSubTaskLine` / `logEvent`；re-export 面（`:34`）未动（无第三方消费者）。
3. **`thincoder-core/agent-tools/subagent-scheduler.mjs`** —— `refreshQueuedTokens` 的 catch 补 `logEvent("ev:queued-paint-failed")`；**发射行 `onToken(...)` 逐字未改**（"`:331-344` 发射面零改"成立——改动只在 catch 分支 = §6.8.3.2② / §2.3 表行 3 的批准落点）。
4. **`thincoder-cli/test/subagent-zero-block.test.mjs`**（新）—— T-ZB1–T-ZB6（正常 2 / 边界 2 / 错误 2）；直驱 `routeSubToken` / `routeSubToolCall` / `freezeSubTaskLines` / `freezeAllSubTasks` / `refreshQueuedTokens`——零网络、零定时器（throttle 面 `routeSubToolOutput` 未被使用）。

**留痕字段面（实测定义——供 LOGGING.md 回填轮采用）**：`ev:subagent-block-revived` 携 `{ id }`（值 = 块键 `role#N`）· `ev:queued-paint-failed` 携 `{ id }`（值 = `role#N`）——与 `ev:cancelled` / `child:done` 族字段同形（`LOGGING.md:65` / `:77`）；设计源未定字段（§2.10③ 登记 · 评审 #5 Deferred），此处按「实装后按实测回填」授权定义。
**降级面**：`state._agent` 缺省 ⇒ `livePoolHas` 恒 false ⇒ 与批前**逐字等价**（T-ZB5 机判；既有 `subagent-tail-merge.test.mjs:267` 同款墓碑丢弃断言不回归）。

### 5.2 触碰面清单（file:line + 行数实测改前→改后）

| # | 档 | 落点（改后行号） | 改动 | 行数（read 口径·含尾行） |
|---|---|---|---|---|
| 1 | `thincoder-cli/src/tui/subagent-blocks.mjs` | `:20-22`（import）· `:83-96`（墓碑分支） | 墓碑分支加存活复活（摘墓碑 `:93` / 摘载体行 `:94` / 留痕 `:95`） | **437 → 450**（+13） |
| 2 | `thincoder-cli/src/tui/subagent-freeze.mjs` | `:15`（import）· `:120-136`（`livePoolHas`）· `:146-162`（`removeFrozenSubTaskLine`）· `:199-207`（P0-b） | 新增两 helper + `freezeAllSubTasks` 存活跳过 | **176 → 238**（+62） |
| 3 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | `:14-15`（import）· `:333-334`（注）· `:346-349`（catch） | catch 补 `logEvent` | **429 → 436**（+7） |
| 4 | `thincoder-cli/test/subagent-zero-block.test.mjs` | 新档（`:1-231`） | T-ZB1–6 六用例 + 隔离读档夹具 | 新 → **231** |
| 5 | 设计档（`docs/cli/design/TUI.md`） | — | **本子代理零碰**（作者 = eng-designer） | 577（不变） |

**估值对照（§2.3 表「预计后」）**：blocks 460→**450** ✓ · scheduler 437→**436** ✓ · freeze 205→**238**（+33，全为文档注释，无功能偏差）· 测试档 120/110→**231**（~2×，逐条实证注释所致）——三项源档均 < 500 硬限，**无拆分需要**（设计档 §6.8.3.4 审视结论保持）。

### 5.3 验证读数（原文）

- `cd thincoder-cli && npm test` → `ℹ tests 609` · `ℹ pass 609` · `ℹ fail 0` · `ℹ cancelled 0` · `ℹ skipped 0` · `ℹ duration_ms 38721.7931`
- `cd thincoder-core && npm test` → `ℹ tests 294` · `ℹ pass 294` · `ℹ fail 0` · `ℹ cancelled 0` · `ℹ duration_ms 12489.9439`
- `cd thincoder-cli && node --test test/subagent-zero-block.test.mjs` → 6 pass / 0 fail（T-ZB1–6 逐条 `✔`；`duration_ms 624.8378`〔复跑口径〕）
- `cd thincoder-cli && npm run lint` → `check-syntax: 173 file(s) OK`
- 复跑时机说明：上列两端全量读数为**post-review 注释级收正后**的复跑结果（`subagent-freeze.mjs:143` 一行注释，零语义）。

### 5.4 AC-ZB1–AC-ZB7 逐条机判回指

| # | 机判 | 读数 |
|---|---|---|
| AC-ZB1 | T-ZB1 / T-ZB2 | `✔ T-ZB1 存活复活`（块存在 / 墓碑摘 / `async===true` / `model==="m"` / 旧载体行 0 / 账不飘 / 锚点两向）· `✔ T-ZB2`（文本+turn+工具入块 / 面板 1 块 running） |
| AC-ZB2 | T-ZB3 | `✔ T-ZB3`（池外真终态 · done-in-pool · cancelled 三形 + `role` 不匹配 / 非池键 / 无 `#` 形态） |
| AC-ZB3 | T-ZB4 | `✔ T-ZB4`（存活块留驻未置 done 未写墓碑；池外已终块与 done-in-pool 块照旧冻结进流） |
| AC-ZB4 | 既有断言 + T-ZB1 | 既有 `advisor-pool-queue.test.mjs` 同族断言随全量门绿（609/609）；`[model]` 面落位断言 = T-ZB1 `model==="m"`；发射行 `subagent-scheduler.mjs:345` 逐字未改 |
| AC-ZB5 | T-ZB5 | `✔ T-ZB5`（无 `_agent` / 无池 ⇒ false；墓碑命中维持丢弃） |
| AC-ZB6 | T-ZB6 | `✔ T-ZB6`（复活分支每次复活记一条〔两轮 ⇒ 两条〕；relay 异常记一条 + `doesNotThrow` + 队列未动） |
| AC-ZB7 | cli + core `npm test` | 见 5.3（609/609 · 294/294 全绿） |

### 5.5 审计与代码评审（轮次与终态）

- **内部偏离审计（explore 子代理 · 1 轮 · 阻塞）**：四类偏离（部分实现 / 静默简化 / 文档漂移 / 出清单改动）= **无**；逐条核验 1–7 全 ✅（存活判据逐字 · P0-a 三步 · P0-b 双向 · P1 双留痕 · 禁触面零改 · T-ZB1–6 无未断言期望项 · 单一收口成立〔`_frozenSubKeys` 全仓写点唯一〕）。出批观察 4 条：O-1 §5 空（本段落笔即消解）· O-2 行数估值差（5.2 已回写）· O-3 LOGGING 字段面待回填（5.1 已供字段）· O-4 两条防御分支无测试命中 → **处置：采纳**——T-ZB3④ 补「非池键 / 无 `#` / 空 role-id」断言。
- **advisor 代码评审（1 轮 · 同步 · 评审对象 = 四档实现面）**：**VERDICT: pass**（🔴 0 · 🟡 3 · 🔵 2）。
  - 🟡#1/#2（存量）：`subagent-blocks.mjs` 450 行 / `subagent-scheduler.mjs` 436 行 >300 advisory——存量债（设计档 §6.8.3.4 F-R24a 审视结论在册），本批 +13 / +7 行；**非阻塞**（<500 硬限）。
  - 🟡#3（协调）：§5 空 + §2.3 估值/实测差 → **本段落笔消解**。
  - 🔵#4：锚点「恰等摘除位不移」边界 → **已采纳**（注释级收正，`subagent-freeze.mjs:143`，零语义）。
  - 🔵#5：AC-ZB7 评审侧无执行面未复跑 → 本报告 5.3 = 实跑读数（父侧 §6 可复核）。
  - 出批面（零严重级）：`thincoder-core/agent-tools/advisor-async.mjs:284` 的 `catch { /* relay 失败不影响池状态 */ }` 仍是静默面（P1② 姊妹通道；设计只定 `refreshQueuedTokens` 一处）——**登记不改**。
- **终态：`clean`**——审计 0 修正轮；advisor pass 后无 fix 轮，仅 1 处注释级收正（已披露）；无未处置发现。

### 5.6 决策透明表（实施轮自主判定——须父侧知悉）

| # | 判定 | 依据 | 影响 |
|---|---|---|---|
| 1 | `subagent-blocks.mjs:22` 增 `import { logEvent } from "@thincoder/core/log.mjs"` | §2.3 表行 1 未列该 import，但 P0-a「留痕」必须（§6.8.3.2 P1①） | 零风险（CLI 侧先例 `agent-turn.mjs:23` / `suspension-drive.mjs:19`） |
| 2 | 两条日志事件携 `{ id }` 字段（值 = `role#N`） | 设计未定字段（评审 #5 Deferred · §2.10③「实装后按实测回填」） | 供父侧回填轮采用（与 `ev:cancelled` / `child:done` 同形） |
| 3 | `livePoolHas:129` 增 `pool instanceof Map` 守卫 · `:125` 非池键形态早退 | 契约「非池键判 false」的防御实现（不越判据） | 与契约同判；T-ZB5 / T-ZB3④ 机判 |
| 4 | `removeFrozenSubTaskLine` 返摘除行数 | 设计只定行为未定返回值 | 零语义（调用点不用返回值） |
| 5 | 测试档实测 231 行（>§2.3「~120」/§2.5「~110」） | 逐条实证注释 + 四向边界断言 | 文件体积（<500），无拆分需要 |
| 6 | **未触碰** `docs/core/design/LOGGING.md` | 批准面 = §2.3 表 1–4 行；字段回填 = Deferred（父侧轮） | 5.1 已供字段实测 |

### 5.7 出批边界外所见（零处置）

- `thincoder-core/agent-tools/advisor-async.mjs:284` 静默 catch（同 5.5 advisor 出批面）。
- `docs/core/design/LOGGING.md:78-79` 两事件条目无字段（Deferred 回填面——本 5.6#2 提供字段）。
- 本批零碰面：发射面（`subagent-run.mjs:147-149` / `subagent-scheduler.mjs:345` 发射行）· `isAsyncSpawnResult` 判定面 · `⟦ev⟧cancelled` 出队语义 · awaitingDigest 驻留与 `_freezeAt` 锚点语义 · `computePanelBlocks` · VSC 面 · 提示词 / 需求档 / 参照树 / `_archive/**`——皆实读未动。

## §6 验证与收口（父代理）

### 6.1 父侧实施核验（2026-09-17 23:45——实读 + 实跑，非转录）

- **实读**（三码档逐段）：① `subagent-freeze.mjs:120-136` `livePoolHas`——四点判据逐字（`state._agent` 降级 → false；最后 `#` 切分 + `entry.role` 对齐 + `Map` 守卫；`entry.done === true || entry.cancelled === true` 排除）；② `:146-162` `removeFrozenSubTaskLine`——`releaseLine` 负向出账 + 摘除位之后锚点 −1（恰等不动，注释已注）；③ `:199-207` `freezeAllSubTasks` 存活跳过（`continue`）；④ `subagent-blocks.mjs:83-96` 墓碑存活闸（不存活 → `return null`；存活 → 摘墓碑 + 摘载体行 + 留痕）；⑤ `subagent-scheduler.mjs:346-349` catch 留痕（`:345` 发射行逐字未改——零改面成立）。
- **实跑**（父侧复跑，非转抄）：`thincoder-cli` **609/609 · fail 0**（含 T-ZB1–6 在场）· `thincoder-core` **294/294 · fail 0**。
- AC-ZB1–7 ↔ §5 交付表逐条对上；出清单自主判定 5 项（§5.6 表）+ 留痕字段 `{ id }` = `role#N` 采纳为回填依据。

### 6.2 评审发现处置（§3 轮 1 → §4 → 实施）

- 🟡1/🟡2（两档行数 advisory：450 / 436）→ **登记**（存量债；<500 硬限，不阻塞；下次触碰该族再拆）。
- 🟡3（§5 空 + 行数估值差）→ **已修**（§5 落笔含实测回写）✓。
- 🔵4（锚点边界注）→ **已修**（`subagent-freeze.mjs:143` 注释级）✓。
- 🔵5（AC-ZB7 执行面）→ **父侧复跑补齐**（6.1 读数）✓。

### 6.3 设计档漂移裁定（不追改）

TUI.md §6.8.3.4「预计后」估值（460 / 205 / 437 / ~120）vs 实装（450 / 238 / 436 / 231）——该节头注已声明为「时点值随实装漂移」，实测以本档 §5 为准（D4）；**不追改**。

### 6.4 顺延微项（防压缩显式锚）

1. **LOGGING.md:78-79 字段回填**（数据已就绪：`{ id }` = `role#N`，见 §5.6#2）——**待 id=9（af 批——`LOGGING.md` 在其写域内）让出后父侧落**。
2. **TUI.md:440 口径注**（评审轮 2 🔵1「576 行 read 口径」）——同上待 id=9 让出 `TUI.md`。
3. `advisor-async.mjs:284` 静默 catch（出批所见）→ 零严重级，登记另批收口。

### 6.5 收口

- 交付提交 = **c8bb261d**（6 档：三码 + 新测试 + TUI.md + LOGGING.md）· 本档 §6 随收口提交。
- 台账 **#19**：在途 → 待核销 → **已核销**；凭证槽 consume（designId 不落文档——运行时凭证）。
