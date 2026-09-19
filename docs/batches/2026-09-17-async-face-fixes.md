# 2026-09-17 · 异步面收尾批（队列 / 显示小修）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（台账 #20 / #21 / #31 已核销）

### 1.1 批件（三条 · 用户 2026-09-17 23:33「评估一下，分一下批，然后开始处理」授权）

| # | 条目 | 实况（台账证据行） |
|---|---|---|
| #20 | ED-4 排队取消缺「同款机读线提醒」 | `advisor-async.mjs:226-235` 取消出队分支无 `pushReal`（对照 `async-settle.mjs:235` running 面有）；补 = 一行 + 测试锚 |
| #21 | VSC 队列载体缺口：`_asyncAdvisorQueue` 不在 VSC CARRIER_FIELDS | VSC 端 parent 部分字段缺失 ⇒ refill 可重启已取消排队评审（原触发=条件（phase 2 核心统一）——本批提前落） |
| #31 | queued 取消路径幽灵块 | `thincoder-cli/src/tui/subagent-async.mjs:262`（⟦ev⟧cancelled 删块）→ `async-settle.mjs:230`（settle 仍发 ⟦ev⟧stopped）→ `subagent-blocks.mjs:246-257`（stopped 分支先建块再冻结+写墓碑）⇒ 幻影 stopped 块；**未实跑复现**——设计轮须**先给复现路径（用例先红）**，再定修法 |

### 1.2 边界

- **做**：三条各自的最小正确修（#31 含复现用例：先红后绿）；各条所属设计档条文收正 + 用例/验收。
- **不做**：不改发射面（token 发射点——#19 批 E1 已证无缺陷）· 不碰 #19 在途实施面（同文件并发写靠调度器串行，不手工避让）· 不碰 VSC phase 2 统一本体（#21 = 加宽后 a+b 两条都落——缺陷闭环为准；2026-09-17 §1 讨论记录·六项裁定⑤）· 不碰冻结批档 / `_archive/**` / 参照树。
- **并行面**：本批设计（文档面）与 #19 实施（代码面）并行无碰面。

### 1.3 父侧注记

- 2026-09-17 23:33 用户裁定「开始处理」（技术待办全量评估 + 分批）；本批即立（异步面三条）。
- **首交付 + 父侧裁决（2026-09-17 23:43）**：设计轮（id=7）交付——#20 设计齐（含新证缺口 F-3）；#21 探针实证「仅补 CARRIER_FIELDS 不足」；#31 原链第二跳**证伪**（不可复现登记）+ 可达面另证（唯一燃料 = 取消后仍在队列 → 补位重启；CLI 不可达 · VSC 评审族可达 = #21）+ 3 加固候选。**六项裁定**：① c1（`queueRunnable` 拒终态）→ **准**；② c2（`⟦ev⟧cancelled` 键级墓碑，带读取面核实条件）→ **准**；③ F-3②（`executeCancelAction` advisor fallback 早退）→ **并入**（属另一机制则停下上报）；④ F-6（queued 取消补 `logEvent("ev:cancelled")` + `LOGGING.md:77` 口径）→ **准**；⑤ #21 加宽（a+b 两条都落——缺陷闭环为准）→ **准**（原边界句收正：「不碰 VSC phase 2 统一本体」仍成立）；⑥ F-2 台账坐标收正 → **父侧已落**（#31 证据行实址 `thincoder-core/agent-tools/subagent-async.mjs:262`）。**→ 派 fix 轮落五项 → 点火评审。**
- **fix 轮（id=9）交付 + 二轮裁定（2026-09-17 23:50）**：五项全落位（c1 §6.9 终态守卫 / c2 §6.8.2 键级墓碑+交互 / F-3② §6.11 工具路径收口 / F-6 日志面两写点 / #21 a+b）——父侧实读核验通过（逐处 spot-check ✓）。**新发现二轮裁定**：**F-11（VSC ⏹ advisor 分支绕 `executeCancelAction` ⇒ 不发 `⟦ev⟧cancelled` / 不 relay ⇒ webview 评审等待头悬留）= 并入**（同取消路径族——VSC 对位形）；**F-12（`cancelSyncChild` 无 `logEvent`）= 并入**（④ 日志面同族补全；若实读属另一机制则停下上报）；F-10（c1 只跳过不剔除）→ **接受**（已入条文边界；今日不可达）。**→ 派二轮 fix 轮 → 落位后点火评审。**
- **设计评审轮 1（2026-09-18 00:05 · VERDICT: changes-required——🔴1 / 🟡5 / 🔵1）**：发现表由评审自写入 §3。**父侧裁决：7/7 全数接受**（🔴#1 = 发射点两说 ⇒ 单源化裁定：**核 queued 分支（含 `pushReal`）为唯一发送点**，工具路径经它收尾不另发；CLI mouse 直连路径由 fix 轮实读代码定性——自持发射则收编/去重，本就调核则一句「经同点」；🟡#2 §2.12 行 1 补 #20 两项 + Δ · #3 七档 >300 审视结论 · #4 AC-AF4 宿主 / AC-AF2 TUI 半断言 · #5 `was` 来源点名 + 中继档入表 · #6 坐标 as-of · 🔵#7 计数口径）。需求档面无裁决项。**→ 派 fix 轮（id=17）→ 落位后评审核销轮。**
- **fix 轮（id=17）交付 + 父侧核验（2026-09-18 00:13）**：7/7 落位（§2.14 在册——单权威清单，声明「§2.12/§2.13 冲突处以此为准」）。**#1 🔴 单源化落定**：唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支（接口 = 可选第三形参 `onToken`；三条调用路各传本层通道、均不另发——`AGENT-LOOP-SUBAGENT.md:225-227`）；**mouse 直连去重**（实读定性：`mouse.mjs:233-240` 自持发射 ⇒ `emit` 上移传进核调用、自持行删——`:237-239`）；父侧抽读核验 ✓（`:225-227` / `:234-239` / `:242-243` / `TUI.md:297-300` 单源句）。#2–#7 逐条落位 ✓（受影响表行 1 Δ +11..17 · 7 档 >300 审视结论 · T-AF13/T-AF14 新增 · `was` = 中继合成 + 中继档明文不动 · 坐标 as-of · 计数口径）。**机检口径注**：读数 848/4 = 并行线在写物（`scripts/doc-check.mjs` M〔activebatch coder 在改〕+ `ANCHOR-DEBT-REPAIR.md` 未跟踪 + persona 两档 M）——af 写域**零新增**已按行实证；**收口前须静置复跑**（列为 §6 前置）。**→ 点火核销轮（轮 2）。**
- **评审核销轮 2（2026-09-18 00:17 · VERDICT: pass）**：轮 1 七条 **Fixed 5 · Partially fixed 2（🟡 · 非阻断）· New 1（🔵）**；剩余 🔴 0 · 新 🔴 0——设计 token 已签发（值不落文档——运行时凭证）；发现表由评审自写 §3（轮次 2）。**三项尾巴裁定（全收）**：① T-AF13 / T-AF14 的宿主行 + Δ 补入受影响文件表（承 §2.14 单一权威口径）② §2.12 行 4 坐标→`:180-192` + `§2.14:338` 悬空指针收正 ③ `§6.11:238` 与 `§2.14:347` mouse 去重措辞统一（守卫形）+ mouse 路由覆盖缺口处置（补用例或登记）。**→ 派微 fix 轮（id=21）→ 核验 → §4 代签 → 派实施 coder。**
- **微 fix 轮（id=21）交付 + 父侧核验（2026-09-18 00:24）**：三项全落位（§2.15 在册）——父侧抽读 ✓（`AGENT-LOOP-SUBAGENT.md:238` 守卫形 + `:654` 变更记录；§2.15 行 8/9 Δ 收正（+75..120 / +11..17）；`:210` 坐标 `:180-192` as-of 落；`:339` 悬空指针改指 §2.15 ②；**T-AF15 新增**（mouse 路由对位 · 回归锁）+ 计数缺口明文登记）。**机检口径**：落笔前 837/3（回归）；写入终态 851/4 全为并行线在写档（本批写域按行实证零新增）——**收口前静置复跑**照旧（§6 前置）。**→ §4 代签 → 派实施 coder（initial）。**
- **实施轮（id=24）交付 + 父侧核验（2026-09-18 00:55）**：终态 **clean**（内部审计 findings 3 全报 · 内部代码评审 pass · fix 0 轮）——三端 **298/298 · 628/628 · 591/591**（fail 0）；**父侧复跑**（af 专属档）：核 `advisor-cancel-faces.test.mjs` **7/7** · CLI `queued-stop` + `sync-cancel` **12/12**（fail 0）✓；**实读核验**：`advisor-async.mjs:217` 三形参 · `:239-242` 机读线（逐字同 running 面模板）· `:244` `onToken` 发射 · `:245` 日志直记 ✓。**开口项裁定（三项）**：① 表行 3/7 宿主漂移（实测宿主 = 新档 `advisor-cancel-faces.test.mjs` 0→215〔拆分理由：核 `core-hygiene.test.mjs` >300 闸〕；`advisor-pool-queue.test.mjs` 零改动）→ **以 §5 实况为准**（§6 收口记录，§2 表不回改——追加制）；② §6.10 ④「三读面载体吸收」vs `refillAdvisorQueue` 直读 → **裁定：实现同式吸收**（1 行，对齐设计声明；契约不缩水）；③ T-AF2「同一确认」queued 面未达（出队⇒既有 unknown-id error）→ **裁定：核侧补终态确认面（tombstone 读取 ⇒ 真幂等，对齐 §2.1 ③ 逐字判据）**；不采「收窄措辞」（删约需用户裁）。**另附**：T-AF11 / T-AF14 先红未实跑 → 随本轮补（回退实跑 + sha256 核对）。**→ 派 fix 轮（id=29）。**
- 所属设计档由设计轮勘察定（候选：`docs/core/design/AGENT-LOOP-SUBAGENT.md` · `ASYNC-RESULT-CONTAINER.md` · `docs/cli/design/TUI.md`）。

## §2 批次任务与设计修订（eng-designer）

### 2.0 范围与轮次

**轮次** = initial（设计轮）。**范围** = 台账 #20 / #21 / #31 三条最小正确修的设计条文 + 实施面（受影响文件 / AC / 用例表）。
**方法** = 先实读定位（`file:line`）→ 再以临时探针**实跑**四条定向复现（`A / B / C / D`，探针脚本临时落在 `.thincoder/tmp/`，跑毕即删；读数逐条入本表）→ 才落修法与判据。
**探针口径**：驱动真实核模块（`advisor-async.mjs` / `subagent-async.mjs` / `async-settle.mjs` / `subagent-scheduler.mjs`）+ 真实 CLI TUI 路由（`subagent-blocks.mjs` `routeSubToken`）；零网络 / 零 LLM（排队条目从不 start）。

### 2.1 #20 —— ED-4 排队取消缺「同款机读线提醒」

**根因复核（实读）**：`thincoder-core/agent-tools/advisor-async.mjs:226-235`（`cancelAsyncAdvisor` 的 `queued` 分支）= 出队 + `cancelled/done` 置位 + 出池 + 墓碑 + `_settle()`——**无 `pushReal`**。
对照 running 面：`thincoder-core/agent-tools/async-settle.mjs:231-236`（cancelled settle 分支）有 `pushReal(parent, { role: "user", content: "[System reminder: async advisor review #N cancelled — the review did not settle; token not issued (评审已取消——token 未签发)]" })`。
设计句早已要求（`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.11 第 3 条「queued 评审 → … + **同款机读线提醒** + 幂等」）⇒ **实现缺一句，非设计缺条**。

**复现（探针 B，正证）**：真 `launchAsyncAdvisor` 入队（ack = `{"ok":true,"id":"5","queued":true,"position":1}`）→ `cancelAsyncAdvisor(agent,"5")` ⇒ `{status:"cancelled",was:"queued"}`、队列 1→0、出池；
**机读线（`agent.history`）增行 = 0**、token 流 = 新增 0。⇒ 模型侧「已取消」不可知（下回合仍可能等这条评审）。

**修法（两处，同一分支）**：
1. **机读线提醒**：queued 分支补 `pushReal`，文案**逐字同 running 面模板**（`async-settle.mjs` 同一条；advisor 族专属 id 插值走 `escapeXml` 同式）——不新造队列专用文案（「同款」= 同一条）。
2. **块面事件**：同一分支补 `⟦ev⟧cancelled`（零字段，relay 前缀 `advisor#<id>/`）——探针 B′ 实证：**当前零发射**，CLI 面板的评审排队块**孤悬不移除**（`docs/cli/design/TUI.md` §6.8.2 条文「取消 / 出队 → 移除块（不冻结）」对评审族今日未落，发射源缺）；子代理族同面已发（`thincoder-core/agent-tools/subagent-async.mjs:262`）。

**逐字判据**：queued 取消后 ① 机读线恰 +1 条 `role:"user"` 的 `[System reminder: async advisor review #<id> cancelled — the review did not settle; token not issued` 起首消息；② 事件流恰 +1 条 `⟦ev⟧cancelled`（**无** `⟦ev⟧stopped`——见 §2.3）；③ 重复取消幂等（返回同一确认、不重复注入）；④ 队列余项 `position` 按 `1..n` 重编号（现状已成立，勿回归）。

### 2.2 #21 —— VSC 队列载体缺口（`_asyncAdvisorQueue`）

**根因链（实读 + 探针 D 复现）**：
1. `thincoder-vscode/src/agent.mjs:39-43` `CARRIER_FIELDS` 列 11 款，**无 `_asyncAdvisorQueue`**（`:144-150` 按该表建访问器）⇒ `launchAsyncAdvisor` 的 `parent._asyncAdvisorQueue ??= []`（`advisor-async.mjs:414`）落 **per-run agent 自有属性**，不随 `history` 跨 run 存活。
2. VSC 取消路径用**合成 parent**（`thincoder-vscode/src/extension/panel-messages.mjs:220-221`：`{ _asyncAdvisors: lines.history._asyncAdvisors, history: lines.history }`）→ `dequeueAdvisor`（`advisor-async.mjs:264-271`）**直读** `parent._asyncAdvisorQueue` ⇒ **no-op**。
3. 条目留在队列 → 任一槽释放 → settle 公共尾部 `refillAdvisorQueue`（`async-settle.mjs:278-279` → `advisor-async.mjs:294-316`）按队首 `queue.splice(pick,1)[0].start()` ⇒ **重启已取消评审**（无终态守卫）。
**探针 D 读数**：部分 parent 取消后 **队列残留 = 1**；随后 `refillAdvisorQueue` ⇒ `queued.start` 次数 = **1**（重启实发）。
**同族判据缺口（探针 C）**：子代理族 `queueRunnable`（`subagent-scheduler.mjs:272-294`）对 `cancelled:true, done:true` 条目**仍返 true** ⇒ `maybeRefillAsync`（`:363-378`）同样会 `start()` 一条已取消条目（CLI 今日不可达——出队单容器；判据面缺口在册）。

**修法（两点；**仅第 1 点不足**——探针 D 已证）**：
1. `thincoder-vscode/src/agent.mjs:39-43` `CARRIER_FIELDS` 增 `"_asyncAdvisorQueue"`（录入位置与 `_asyncQueue` 相邻）；`docs/core/design/AGENT-LOOP.md` §2.3 载体字段集 **10 → 11 款**（本批已改，见 2.5）。
2. 读面**载体吸收**：`dequeueAdvisor` 的队列读取改经 `carrierField(parent, "_asyncAdvisorQueue")`（`async-settle.mjs:52-56` 单点；#94 载体口径）——使「部分 parent（只携池 + `history`）」不再 no-op。
   **落点唯一性**：`refreshAdvisorQueuedTokens` / `refillAdvisorQueue`（`:275-286` / `:294-316`）两读面调用点恒为完整 parent（settle 尾部 / 面板），本批**零改**（最小面——若实现轮发现部分-parent 调用点则同式吸收并回报）。
**逐字判据**：① 合成 parent（仅池 + `history`）下 queued 取消 ⇒ 队列**零残留**、出池 + 墓碑；② 其后任一 refill ⇒ 该条目 `start()` **零调用**；③ VSC 形（`history` 载体）下队列容器跨 run 同一（`history._asyncAdvisorQueue`）；④ 既有全量测试绿。

### 2.3 #31 —— queued 取消路径幽灵块（复现结论：原链**证伪**，可达面另证）

**原链逐跳核对**：
- 第一跳（`⟦ev⟧cancelled` 删块）= 真。**坐标收正**：台账写 `thincoder-cli/src/tui/subagent-async.mjs:262`——**该文件不存在**（CLI 无 `src/tui/subagent-async.mjs`），实址 = `thincoder-core/agent-tools/subagent-async.mjs:262`（`executeCancelAction` 的 queued 分支）。
- 第二跳（「settle 仍发 `⟦ev⟧stopped`」）= **假**。queued 分支（`subagent-core .../subagent-async.mjs:184-201`）**不调 `settleAsyncEntry`**（注释逐字「无 settle 事件——出队即终态」）；`⟦ev⟧stopped` 唯一发射点 = `async-settle.mjs:230`（cancelled settle 分支，须 run 链 `finally` 到达）。
  **探针 A 读数**：真 `executeCancelAction` 走 queued 取消 ⇒ token 流 = `["coder#9/⟦ev⟧cancelled␞"]`（**仅此一条**）；块 有→无；`_frozenSubKeys` = 0；`state.lines` = 0；池内移除 + 墓碑 `cancelled/coder`。⇒ 无 stopped、无块重建。
- 第三跳（stopped 对已移除块**建块再冻结**）= 真。`routeSubToken` 非嵌套路径在事件分派前先 `ensureSubTaskKey`（`thincoder-cli/src/tui/subagent-blocks.mjs:193`）→ `stopped` 分支（`:259-270`）置 done + `freezeSubTaskLines` + 出 `subTasks`。
  **探针 E 读数**：先 `⟦ev⟧queued` 建块 → `⟦ev⟧cancelled` 删块（块=无）→ 补发 `⟦ev⟧stopped` ⇒ **`state.lines` 0 → 1**、`_frozenSubKeys` 0 → 1、行文本 `subagent activity: coder#9` ⇒ **幻影冻结块成立（第三跳本身真）**。

**可达性结论（复现路径）**：幻影需「一条 cancelled 条目**事后仍被 settle**」——唯一现实路径 = **取消后条目仍留在队列 → 补位 `start()` 重启 → 其 run 链 settle 走 cancelled 分支 → `⟦ev⟧stopped`**（探针 C / D 已证 refill 会重启已取消条目）。
该前提在 **CLI 不成立**（两取消路径与队列同容器，出队即生效——探针 A），在 **VSC 评审族成立**（= §2.2 #21）。
⇒ **本项登记「CLI 不可复现（原链第二跳证伪）」**，可达面归 #21；**不臆造修法**，加固候选列 §2.6（待父侧裁定）。

### 2.4 设计条文收正（本批落位——`file:line` 逐条）

| # | 档 | 落点 | 收正内容 |
|---|---|---|---|
| 1 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | `:209-215`（§6.11 第 3 条） | 队列取消**收尾三面逐字**：机读线提醒文案（逐字同 running 面）· `⟦ev⟧cancelled` 发射源 · **不经 settle ⇒ 无 `⟦ev⟧stopped`**（并明证台账 #31 第二跳不成立）+ 幂等 / 池面收口 |
| 2 | 同上 | `:179-180`（§6.10 排队面补充 ④） | **队列载体**：`_asyncAdvisorQueue` 属载体字段集；出队 / 补位 / 刷新三读面经载体吸收，部分 parent 下**不得 no-op** |
| 3 | 同上 | `:616-617`（变更记录） | 一行变更记录（本批） |
| 4 | `docs/core/design/AGENT-LOOP.md` | `:93-95`（§2.3 字段集）+ `:97-98`（全集结论） | 字段集 **10 → 11 款**（增 `_asyncAdvisorQueue`）；「10 款即全集」结论作废（改写 + 核实证据坐标） |
| 5 | 同上 | `:81`（seam 表 `carrier` 行）· `:122`（验收点 2 夹具）· `:401`（§6.18 VSC 接线行）· `:110`（VSC 绑定不变式） | 同题计数一致性收口：字段清单补款 · 夹具「10 款」→「11 款」· 「十款 + 1 = 十一绑定」→「十一款 + 1 = 十二绑定」· 绑定不变式「全部 10 字段」→「11 字段」 |
| 6 | 同上 | `:512-514`（变更记录） | 一行变更记录（本批） |
| 7 | `docs/cli/design/TUI.md` | `:297-300`（§6.8.2 排队块条） | 取消 / 出队**发射源两处**（子代理族 / 评审族）+ **已移除块不复建**风险行（`⟦ev⟧stopped` 建幻影冻结块——可达面 = 取消后补位重启） |
| 8 | 同上 | `:576-577`（变更记录） | 一行变更记录（本批） |

**未改（有意）**：`AGENT-LOOP.md:477-479` 三条历史变更记录保留原计数（7→8→10——历史语义留档，形式合规）；`thincoder-vscode/docs/**` 参照历史一字未动（保留 ≠ 维护）。

### 2.5 受影响文件表（实施轮 · R24a 行数口径 = 换行符计数）

| # | 文件 | 现行行数 | 预计Δ | 动作（file:line） | 归属 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor-async.mjs` | 450 | +10..14 | `:226-235` queued 分支补 `pushReal` + `⟦ev⟧cancelled`（#20）；`:264-271` `dequeueAdvisor` 队列读改 `carrierField`（#21） | 核 |
| 2 | `thincoder-vscode/src/agent.mjs` | 477 | +1 | `:39-43` `CARRIER_FIELDS` 增 `"_asyncAdvisorQueue"`（#21） | VSC |
| 3 | `thincoder-core/test/advisor-pool-queue.test.mjs` | 219 | +30..45 | T-AF1–T-AF4（#20 / #21 判据） | 核测 |
| 4 | `thincoder-cli/test/queued-stop.test.mjs` | 182 | +25..40 | T-AF5 回归锁（今日即绿）+ T-AF6（候选采纳时**先红**） | CLI 测 |
| 5 | `thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs` | 241 | +1 | `:46` 夹具 `CARRIER_FIELDS` 同步补款（发现 F-9） | VSC 测 |
| 6 | `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs` | 253 | +1 | `:88-89` 夹具同步（若其断「全字段绑定」语义） | VSC 测 |
| 7 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 435 | +2..4 | **候选 c1**：`queueRunnable`（`:272-294`）拒终态条目——**待裁** | 核 |
| 8 | `thincoder-cli/src/tui/subagent-blocks.mjs` | 449 | +2..3 | **候选 c2**：cancelled 分支（`:185-192`）落键级墓碑——**待裁** | CLI |

**跨档限制**：`advisor-async.mjs` 现行 450 行（软线 300 超、硬帽 500 未越）——本批增量后仍 ≤464，**不触拆分面**；`subagent-blocks.mjs` 449 同理。
**并发面**：#19 在途实施面（`subagent-blocks.mjs` / `subagent-freeze.mjs` / `subagent-scheduler.mjs` 代码）与本批**零点 1/2 重叠**（本批前两点不碰三档）；第 7/8 行若裁采纳，则与 #19 **同在途同文件** ⇒ 实施靠调度器串行（父侧已定）。

### 2.6 决策记录 + #31 加固候选（待裁）

| # | 决策 | 选定 | 否决 / 备选（理由） |
|---|---|---|---|
| D-AF1 | #20 提醒文案 | **逐字复用 running 面同一条**（设计句「同款」= 同一条） | 新造队列专用文案（如加 `(was queued — never started)`）——**否决**：引入第二条模板（D2 单一权威源），且非设计句要求 |
| D-AF2 | #20 事件面归属 | `⟦ev⟧cancelled` 发射点放 **`cancelAsyncAdvisor` 内**（核单点，与子代理族同址） | 放 CLI TUI mouse / 引擎侧补发（现状：mouse 侧补发、引擎侧漏）——**否决**：两处补发 = 双源，失序 / 漏发面重现 |
| D-AF3 | #21 修法组合 | **(a) VSC `CARRIER_FIELDS` 补款 + (b) `dequeueAdvisor` 读面载体吸收** | 仅 (a)——**否决**（探针 D 实证：合成 parent 下仍 no-op）；仅 (b)——**否决**（队列自体不跨 run 存活）；(b′) 改 VSC 调用点传队列字段——**次选**（VSC 侧一行，但任何后续部分-parent 调用点复发） |
| D-AF4 | #21 读面范围 | 只改 `dequeueAdvisor` 一处 | 同式吸收 `refillAdvisorQueue` / `refreshAdvisorQueuedTokens`——**本批不取**（调用点恒为完整 parent，零缺陷；最小面原则），实现轮若发现部分-parent 调用点则同式吸收并回报 |
| D-AF5 | #31 处置 | **登记「CLI 不可复现（原链第二跳证伪）」+ 加固候选**，不臆造修法 | 直接改 TUI `ensureSubTaskKey` 语义（拒建已终块）——**否决**：sync 取消路径（`subagent-core .../subagent.mjs:363` 直发 `⟦ev⟧stopped`）存在「块尚未建」合法形，全局拒建会破其冻结语义 |

**#31 加固候选（父侧裁定项——均未落笔）**：
- **c1（推荐 · 核侧判据）**：`queueRunnable` / `maybeRefillAsync` 跳过 `entry.cancelled === true || entry.done === true` 的条目（探针 C：现状返 true ⇒ `start()` 实发）——**族无关**，直接消灭「取消后被重启」这一幻影唯一燃料。
- **c2（推荐 · TUI 侧）**：`⟦ev⟧cancelled` 删块时同步落**键级墓碑**（`_frozenSubKeys.add(key)`）⇒ 后续 `⟦ev⟧stopped` 经 `ensureSubTaskKey` 直接丢弃（零幻影）；**风险** = 须核 `_frozenSubKeys` 的其它读取面（`freezeAllSubTasks` / `freezeReclaimDigestedBlocks`）对该键无「必有冻结载体行」的隐含假设。
- **c3（零风险 = 锁）**：T-AF5 形式的回归锁用例（今日即绿）——把「queued 取消零 `⟦ev⟧stopped`」钉成机器判据，防将来有人把 queued 分支并入 settle 时静默引入幻影。
- **不取**：改 `⟦ev⟧cancelled` 语义 / 改发射面（#19 批 E1 已证无缺陷）/ 新增按族分支。

### 2.7 验收标准（AC · 逐条回指台账条目）

| # | 判据（每条可机判） | 回指 |
|---|---|---|
| AC-AF1 | queued 评审取消后机读线**恰 +1 条** `role:"user"` 提醒（关键子串 `cancelled — the review did not settle; token not issued`）；重复取消不重复注入 | 台账 #20 |
| AC-AF2 | 同一次取消事件流**恰 +1 条** `⟦ev⟧cancelled`、且**零** `⟦ev⟧stopped`；CLI 面板该排队块被移除（`subTasks` 无该 key） | 台账 #20 · `TUI.md` §6.8.2 |
| AC-AF3 | **部分 parent**（仅池 + `history`）取消 ⇒ 队列零残留 + 出池 + cancelled 墓碑；其后 `refillAdvisorQueue` 对该条目 `start()` **零调用** | 台账 #21 |
| AC-AF4 | VSC `history` 载体下 `_asyncAdvisorQueue` 跨 run **同一容器**（`CARRIER_FIELDS` 含该键；两测试夹具同步） | 台账 #21 |
| AC-AF5 | CLI queued 取消全链零 `⟦ev⟧stopped`、零幻影块（`_frozenSubKeys` / `state.lines` 零增） | 台账 #31 |
| AC-AF6 | **条件项**（c1 / c2 裁采纳时）：取消后仍被 settle 的条目不产 `⟦ev⟧stopped` / 不新建块（未采纳则如实记录现状行为） | 台账 #31 |
| AC-AF7 | 三包全量 `npm test` 绿（core / cli / vsc）+ 仓根 `node scripts/doc-check.mjs` 锚 / 行宽**零新增** | 常规门 |

### 2.8 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望输出 | AC |
|---|---|---|---|---|
| T-AF1 | 正常 | advisor 池满 + 异 scope 发起（→ `queued`）→ queued 取消 | 出队 + 余位 `position` 重编号 + 出池 + cancelled 墓碑 + 机读线 1 条 + `⟦ev⟧cancelled` 1 条 | AC-AF1/2 |
| T-AF2 | 边界 | 同一 queued id 重复取消 | 幂等：同一确认、零重复注入、零重复 token | AC-AF1 |
| T-AF3 | 边界（**先红**） | 部分 parent `{_asyncAdvisors, history}` 下 queued 取消 → 槽释放 → refill | 队列零残留；该条目 `start()` 零调用（今日红：残留 1 + 重启 1） | AC-AF3 |
| T-AF4 | 边界 | 取消队尾项 | 余项 `position` 严格递增无空洞（`1..n`） | AC-AF1 |
| T-AF5 | 正常（回归锁） | CLI 全链：真 spawn 队列块（`⟦ev⟧queued`）→ `executeCancelAction` → token 经 `routeSubToken` | token 流**仅** `⟦ev⟧cancelled`；块移除；`_frozenSubKeys` / `lines` 零增（今日即绿——锁不变式） | AC-AF5 |
| T-AF6 | 错误（条件项） | 构造「取消后条目仍在队列」→ refill 重启 → 该条目 settle（cancelled 分支） | c1 采纳：不重启；c2 采纳：stopped 不建块；未采纳：记录现状（`lines` +1 = 幻影）为已知面 | AC-AF6 |
| T-AF7 | 错误 | 取消未知 id / 已 done id / depth>0 调用 | 既有错误文案逐字不变（零改面） | AC-AF7 |

### 2.9 发现表（本批所见——逐条，含非阻断项）

| # | 类 | 发现（证据） | 处置 |
|---|---|---|---|
| F-1 | **证伪** | 台账 #31 第 2 跳不成立：queued 取消不调 `settleAsyncEntry`（`subagent-async.mjs:184-201` 注释逐字「无 settle 事件」）；探针 A 实测 token 流仅 `⟦ev⟧cancelled`。**第 3 跳成立**（探针 E：`lines` 0 → 1） | 设计档条文收正（2.4 行 1/7）+ §2.3 登记 |
| F-2 | 坐标收正 | 台账 #31 坐标 `thincoder-cli/src/tui/subagent-async.mjs:262` **该文件不存在**——实址 `thincoder-core/agent-tools/subagent-async.mjs:262` | 本批以实址落笔；台账文案收正 = 父侧域（建议随核销同步） |
| F-3 | 新缺口（同分支） | ① advisor queued 取消**零 `⟦ev⟧cancelled`** ⇒ CLI 评审排队块孤悬不移除（探针 B′：`cancel` 后块仍在、`refreshAdvisorQueuedTokens` 亦不移除）；② 引擎路径 advisor fallback（`subagent-async.mjs:252-254`）**早退**，连子代理族那套 TUI 维护（`⟦ev⟧cancelled` / refill / 依赖标注）一并跳过 | 已并入 #20 修法（同分支）；若父侧判「仅补提醒」则第 2 点移出本批 |
| F-4 | 判据缺口 | `queueRunnable` 对 `cancelled/done` 条目返 **true**（探针 C：`dead.start` 实发 1）⇒ refill 会启动已取消条目 | 候选 **c1**（待裁） |
| F-5 | 可达面 | 幻影唯一燃料 = 「取消后仍在队列 → 补位重启」；CLI 今日不可达（出队单容器，探针 A），**VSC 评审族可达**（= #21） | 候选 **c2** + c1（待裁） |
| F-6 | 日志面 | queued 取消无 `logEvent("ev:cancelled")`（running 面经 settle 日志三连有；`LOGGING.md:77` 口径未覆盖 queued 分支）⇒ 取消面在日志不可见 | **范围追加请求**（一行 + LOGGING.md 口径一句）——父侧裁 |
| F-7 | 机检口径 | `doc-check.mjs` 行宽失败文案写「超 300 字符」，**实际阈值 = 声明面 `lineWidth`（实测 350）**：355 红 / 334 不红 | 文档债（#26 族）——本批不改，登记 |
| F-8 | 夹具体 | VSC 两个测试夹具自带 `CARRIER_FIELDS` 副本（`scenario-03:46` 8 款 · `vsc-panel-rings:89` 2 款）——生产表补款后夹具不同步则**测不出缺口** | 受影响文件表第 5/6 行 |
| F-9 | 需求侧 | 三条均**非需求档条目**（技术待办）；设计锚 = `AGENT-LOOP-SUBAGENT.md` §6.10/§6.11 · `AGENT-LOOP.md` §2.3 · `TUI.md` §6.8.2 | 清单交父侧（不落笔——需求档 = 父侧笔） |

### 2.10 边界（本批不做）

- 不改**发射面**（token 发射点锚位——#19 批 E1 已证无缺陷）；不动 `⟦ev⟧cancelled` / `⟦ev⟧stopped` 语义。
- 不碰 **#19 在途实施面**（`subagent-blocks.mjs` / `subagent-freeze.mjs` / `subagent-scheduler.mjs` 代码）——本批前两点零重叠；候选 c1/c2 若采纳由调度器串行（同文件并发写不手工避让）。
- 不碰 **VSC phase 2 统一本体**（#21 仅补载体字段 + 核侧读面吸收）· 不碰冻结批档 / `_archive/**` / 参照树（`thincoder-vscode/docs/**` 一字未动）· 不碰需求档（父侧域）。
- 不新造队列专用文案 / 不新造第二套队列 / 不新增按族分支。

### 2.11 自检读数与待裁项

**自检**：① 需求覆盖 = 三条逐条有「根因（file:line）→ 复现读数 → 修法 → 判据 → 用例 → AC」✓；② 三链一致 = 台账 #20/#21/#31 ↔ 本节条目 ↔ 设计档条文（2.4 表）✓；
③ 机检（`node scripts/doc-check.mjs`）：锚 **837**（= 早存基线，本批零新增）；行宽 **3**（本批终态——期间本批曾使 `AGENT-LOOP.md:93` 达 355 字符触发第 4 条，**已折行清零**，见 F-7 阈值口径）；
④ 探针 4 条（A / B·B′ / C / D）+ E 全部实跑，临时脚本落 `.thincoder/tmp/` 并**已删**（不入库）；⑤ 设计档行数：`AGENT-LOOP.md` 511 → 515 · `AGENT-LOOP-SUBAGENT.md` 617 → 623 · `TUI.md` 582 → 588。

**待父侧裁定（4 项，未落笔）**：① 候选 **c1**（`queueRunnable` 终态守卫——族无关，推荐）· ② 候选 **c2**（cancelled 落键级墓碑——推荐，须核 `_frozenSubKeys` 读取面）· ③ **F-3** 第 2 点（advisor fallback 早退是否并入本批）· ④ **F-6** 日志行（`ev:cancelled` 补记 + `LOGGING.md` 口径）。
**另请父侧处置**：F-2（台账 #31 坐标文案收正——父侧域）。

### 2.12 fix 轮（eng-designer · 2026-09-17）——父侧六项裁定逐条落位

**轮次** = fix（承 §1.3 派单）。**范围** = ①–⑤ 五项落笔 + F-2 无动作。**方法** = 先实读核证（c2 条件两条 / F-3② 归属）→ 才落条文；实读不成立的项如实报告、不硬改。
**本轮不做** = 需求档 · 代码 · 冻结批档 · `_archive/**` · 参照树（`thincoder-vscode/docs/**` 一字未动）。§2.11 待裁 4 项本轮全部裁定落位。

**裁项 → 落位（file:line；行号 = 本轮终态实测）**：

| # | 裁项 | 落位（设计条文） | 核证读数（本轮实读） |
|---|---|---|---|
| ① | c1 `queueRunnable` 拒终态 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.9 新增「终态守卫」条 `:161-165`；§6.10 ② 补指针 `:183` | 谓词单点 = `entryTerminal(entry)`（拟落 `subagent-scheduler.mjs`，与 `queueRunnable:272` 同址）；两消费点 = `queueRunnable`（`maybeRefillAsync:369` 经它判）· `refillAdvisorQueue`（`advisor-async.mjs:294`——该档 `:63` 已 import 同模块，**无新环**） |
| ② | c2 键级墓碑（带条件） | `docs/cli/design/TUI.md` §6.8.2 `:299-304`（风险行重写为已裁设计） | **条件两条成立**：① 读取面全扫——`_frozenSubKeys` 生产写点 1（`subagent-freeze.mjs:86`）/ 读点 1（`subagent-blocks.mjs:85`）＋ 测试面；`freezeAllSubTasks:204` / `freezeReclaimDigestedBlocks:229` **不读该集**（遍历 `subTasks`）⇒「必有冻结载体行」隐含假设**不存在**；② 与存活闸（§6.8.3.2 P0-a）交互 ✓——写入时条目已终态（`done`+`cancelled`+出池）⇒ `livePoolHas:132` 判 false ⇒ 丢弃语义成立 |
| ③ | F-3② advisor fallback 收口 | `AGENT-LOOP-SUBAGENT.md` §6.11 第 3 条新增「工具路径收口」面 `:226-228` | **实读 = 同取消路径**：`subagent-async.mjs:252-254` 早退跳过的正是 §6.11 第 3 条同款收尾（`⟦ev⟧cancelled` + 队列刷新）⇒ 落笔；**不属另一机制**，无停报项 |
| ④ | F-6 日志 + LOGGING 口径 | `docs/core/design/LOGGING.md` §6.2 `:78-79` + `AGENT-LOOP-SUBAGENT.md` §6.11「日志面」`:223-225` | 写点两处 = `advisor-async.mjs:226-235` / `subagent-async.mjs:184-201` 的 queued 分支；与 `settleAsyncEntry:208` running 面事件名 / 字段同形（写点互斥 ⇒ 同次取消恰一条） |
| ⑤ | #21 (a)+(b) 两条都落 | 设计条文 = §2.2 修法 1/2（上轮已落，本轮复核**零改**）；边界句收正见下 | (b) 落点 `dequeueAdvisor`（`advisor-async.mjs:264-271`）读面载体吸收，吸收单点 = `carrierField`（`async-settle.mjs:52`） |
| — | F-2 台账坐标 | **无动作**（父侧已收正 #31 实址） | — |

**边界句收正（⑤ 伴随）**：`#21` 本批实际落 **(a) VSC `CARRIER_FIELDS` 补款 + (b) 核侧 `dequeueAdvisor` 读面载体吸收**两条；
**「不碰 VSC phase 2 统一本体」仍成立**（本批只补载体字段 + 核侧读面吸收，不触 phase 2 统一本体）。
注：§1.2 边界句现文括注「（#21 只补载体字段）」已成陈文——§1 为父侧笔，本处只记裁后语义，请父侧随裁定同步收正。

**受影响文件表收正（实施轮口径 · 行数 = 换行符计数 · 本轮实测）**：

| # | 文件 | 现行行数 | 预计Δ | 动作（file:line） | 归属 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor-async.mjs` | 450 | +7..11 | `:226-235` queued 分支补 `logEvent("ev:cancelled")`（④）· `:264-271` `dequeueAdvisor` 载体吸收（#21⑤b）· `:294-316` `refillAdvisorQueue` 终态守卫（①） | 核 |
| 2 | `thincoder-core/agent-tools/subagent-async.mjs` | 437 | +7..11 | `:184-201` `cancelAsyncSubagent` queued 分支补 `logEvent`（④）· `:252-254` advisor fallback 展开（取条目 + 取消 + `was==queued` 收尾——③） | 核 |
| 3 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 435 | +6..9 | 新增导出 `entryTerminal(entry)` + `queueRunnable:272` 头判（①） | 核 |
| 4 | `thincoder-cli/src/tui/subagent-blocks.mjs` | 449 | +3..5 | `:180-192` cancelled 分支调 `tombstoneSubKey(state, key)`（②——坐标 as-of 2026-09-18 实读；见 §2.15 ②） | CLI |
| 5 | `thincoder-cli/src/tui/subagent-freeze.mjs` | 237 | +5..7 | 新增导出 `tombstoneSubKey(state, key)`（键级墓碑——与 `freezeSubTaskLines:82` 同址） | CLI |
| 6 | `thincoder-vscode/src/agent.mjs` | 477 | +1 | `:39-43` `CARRIER_FIELDS` 增 `"_asyncAdvisorQueue"`（#21⑤a） | VSC |
| 7 | `thincoder-core/test/advisor-pool-queue.test.mjs` | 219 | +40..55 | T-AF1–T-AF4 + T-AF8–T-AF10（#20 / #21 / c1 / ③ / ④） | 核测 |
| 8 | `thincoder-cli/test/queued-stop.test.mjs` | 182 | +25..40 | T-AF5 回归锁（含 c2 断言收正）+ T-AF6（c1+c2 定稿） | CLI 测 |
| 9 | `thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs` | 241 | +1 | `:46` 夹具 `CARRIER_FIELDS` 同步补款（F-8） | VSC 测 |
| 10 | `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs` | 253 | +1 | `:88-89` 夹具同步（F-8） | VSC 测 |

**跨档限制**：`advisor-async.mjs` 450 → ≤461 · `subagent-async.mjs` 437 → ≤448 · `subagent-scheduler.mjs` 435 → ≤444——均 < 500 硬帽，**不触拆分面**。
**并发面**：① ② 的实施落点（`subagent-scheduler.mjs` / `subagent-blocks.mjs` / `subagent-freeze.mjs`）与 #19 在途实施面**同文件** ⇒ 实施靠调度器串行（父侧已定；`files` 声明面，不手工避让）。

**用例表增补 / 收正**：

| # | 类 | 输入 | 期望输出 | AC |
|---|---|---|---|---|
| T-AF5（**收正**） | 正常（回归锁） | CLI 全链：`⟦ev⟧queued` 建块 → `executeCancelAction` → token 经 `routeSubToken` | token 流**仅** `⟦ev⟧cancelled`；块移除；`state.lines` **零增**；`_frozenSubKeys` **含该 key**（c2 键级墓碑——原「`_frozenSubKeys` 零增」断言作废） | AC-AF5 |
| T-AF6（**定稿**） | 错误 | 终态条目（`cancelled:true` / `done:true`）留在队列 → `maybeRefillAsync` / `refillAdvisorQueue`；再补发 `⟦ev⟧stopped` 经 `routeSubToken` | c1：`start()` **零调用**（两族同判）；c2：`state.lines` 零增、`subTasks` 无该 key（零幻影） | AC-AF6 |
| T-AF8（**新增**） | 边界 | `queueRunnable(parent, entry)` 三形：`cancelled:true` / `done:true` / 双真；对照活条目 | 三形全 false；活条目仍 true（零回归） | AC-AF6 |
| T-AF9（**新增**） | 正常 | 工具路径 advisor queued 取消（`executeCancelAction({id})`；`ctx.callbacks` 记 token） | `⟦ev⟧cancelled` 恰 1 条（前缀 `advisor#<id>/`）+ 余位刷新 token；重复取消 0 新增；`⟦ev⟧stopped` 0 条 | AC-AF8 |
| T-AF10（**新增**） | 正常 | `THINCODER_LOG_DIR` 隔离目录读档：queued 取消（两族）+ running 取消 | queued ⇒ `ev:cancelled` 恰 1 条（`id` 形 = `advisor#<id>` / `<role>#<id>`）；running ⇒ 仍 1 条（写点互斥不重复记） | AC-AF9 |

**AC 收正 / 增补**：

| # | 判据（可机判） | 回指 |
|---|---|---|
| AC-AF5（收正） | CLI queued 取消全链零 `⟦ev⟧stopped`、`state.lines` 零增；`_frozenSubKeys` 含该 key（键级墓碑——**无**载体行） | 台账 #31 |
| AC-AF6（定稿） | 终态条目不启动（两族 `start()` 零调用）+ 补发 `⟦ev⟧stopped` 零块零行 | 台账 #31 |
| AC-AF8（新增） | 工具路径 advisor queued 取消 ⇒ `⟦ev⟧cancelled` 恰 1 条（CLI 面板评审排队块移除）+ 余位刷新；running 路径零变 | 台账 #20 · F-3② |
| AC-AF9（新增） | queued 取消 ⇒ 日志档 `ev:cancelled` 恰 1 条（`id` 与 running 面同形） | F-6 |

**决策记录增补**：

| # | 决策 | 选定 | 否决 / 备选（理由） |
|---|---|---|---|
| D-AF6 | c1 落点 | **单点谓词 `entryTerminal` + 两消费点**（`queueRunnable` / `refillAdvisorQueue`） | 只落 `queueRunnable`（评审族同形缺口留着——c1 自陈「族无关」，两族燃料同源）；两处各写 inline 判据（第二份判据 = 漂移面） |
| D-AF7 | c2 墓碑写入形态 | **键级 helper `tombstoneSubKey`（落 `subagent-freeze.mjs`，与墓碑写点同址）** | `subagent-blocks.mjs` 内 inline `state._frozenSubKeys.add(key)`（破「墓碑写入单一权威」§6.8.3.3）；写载体行（无内容行可冻结——伪造块） |
| D-AF8 | c2 写入条件 | **与移除同一守卫**（命中移除才写） | 无条件写（失序 `cancelled` 打到 running 块即写墓碑 ⇒ 下一 token 触发一次伪复活留痕；no-block 面无幻影可防） |

**发现表增补（本轮所见——逐条）**：

| # | 类 | 发现（证据） | 处置 |
|---|---|---|---|
| F-10 | 残留面 | c1 守卫**只跳过不剔除**：终态条目滞留队列时，排队块刷新面会把该条目当 queued 呈现（`refreshQueuedTokens` 遍历 `_asyncQueue` 全体——`subagent-scheduler.mjs:335-351`） | 今日 CLI 不可达（出队恒生效）· VSC 经 ⑤b 零残留 ⇒ 登记不修（边界已写进 §6.9 条） |
| F-11 | 端侧缺口（**新**） | VSC ⏹ 的 **advisor** 分支（`thincoder-vscode/src/extension/panel-messages.mjs:216-223`）**不经** `executeCancelAction`——直调 `cancelAsyncAdvisor` 后 `break`，既不发 `⟦ev⟧cancelled` 也不 relay ⇒ webview 评审等待头悬留（F-3① 的 VSC 对位形） | **停报不落笔**（超出 ③ 的核侧落点；请父侧裁定是否并入——落点 = 端侧 `:216-223`，或改走 `executeCancelAction` 经 callbacks 中继） |
| F-12 | 事件面（**非阻断**） | `cancelSyncChild`（sync ⏹——`subagent-async.mjs:222-231`）无 `logEvent` 直记 | 报告不落笔（④ 只覆盖 queued 取消面；是否补记归父侧另裁） |
| F-13 | 端差核对（**已核**） | ④ 两写点在**核侧**（两端同引核单点）⇒ **零端差**；VSC `src/agent-tools/` 仅 `async-discard.mjs` / `index.mjs` 两档（无 scheduler / advisor 镜像）⇒ c1 / ② 落核即两端生效 | 已核（写入 §6.11 日志面条） |

**自检读数（fix 轮终态）**：
① 五项逐处落位（上表 `file:line` 逐条）✓；② 三链一致 = 台账 #20 / #21 / #31 ↔ 本节 ↔ 设计档条文（`AGENT-LOOP-SUBAGENT.md` §6.9 / §6.10 ② / §6.11 第 3 条 · `TUI.md` §6.8.2 · `LOGGING.md` §6.2）✓；
③ 机检（`node scripts/doc-check.mjs`）：锚 **837**（= 早存基线，零新增）· 行宽 **3**（= 基线，零新增）✓；④ 设计档行数：`AGENT-LOOP-SUBAGENT.md` 617 → **631** · `TUI.md` 582 → **589** · `LOGGING.md` 152 → **155**（含各档变更记录）；
⑤ 探针 = **零**（fix 轮只落条文；c2 条件核验走**实读全扫**〔写点 / 读点逐处列出〕，未跑脚本）；⑥ 有意未改：`AGENT-LOOP.md`（⑤a 计数面上轮已落，本轮零改）· 历史变更记录原计数留档。

### 2.13 二轮 fix 轮（eng-designer · 2026-09-17）——二轮裁定 F-11 / F-12 逐条落位

**轮次** = fix（承 §1 讨论记录·二轮裁定〔F-11 / F-12〕派单；**父侧指针收正 2026-09-18——原引「§1.5」无此节**）。**范围** = F-11 / F-12 两裁项落笔（设计条文 + 受影响文件表行 + 用例 + AC）。
**方法** = 先实读核证（F-12 归属判定：属取消路径族 / 另一机制）→ 才落条文；实读不成立即停报、不硬改。
**本轮不做** = 需求档 · 代码 · 冻结批档 · `_archive/**` · 参照树（`thincoder-vscode/docs/**` 一字未动）· 已定条文内容零改（c1 / c2 / F-3② / F-6 / #21 面）。

**裁项 → 落位（design 条文；行号 = 本轮终态实测）**：

| # | 裁项 | 落位（设计条文） | 核证读数（本轮实读） |
|---|---|---|---|
| ① | F-11 VSC ⏹ advisor 分支绕 `executeCancelAction` | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.11 第 3 条新增「端侧路径收口」面 `:234-239`（+ 计数行收正 `:221`）；`docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 `cancelSubagent` 行 `:52` | 实读 `thincoder-vscode/src/extension/panel-messages.mjs:216-223`：advisor 分支直调 `cancelAsyncAdvisor(合成 parent, id)` 后 `break`——**零 `callbacks`**（对照同 case 子代理族 `:247` 的 `callbacks.onToken = relaySubagentEventToken`）⇒ 事件无中继；且 `cancelAsyncAdvisor` queued 分支今日**零发射**（#20 修法面）⇒ webview 评审等待头悬留（F-3① 端侧对位形）；模块内该 import 仅此一处（`:220`） |
| ② | F-12 `cancelSyncChild` 无 `logEvent` | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.2 sync 定向中止新增「日志面」`:66-70`；`docs/core/design/LOGGING.md` §6.2 `ev:cancelled` 写点 两个 → 三个 `:78-81` | **归属判定 = 属取消路径族（非「另一机制」——无停报项）**：`thincoder-core/agent-tools/subagent-async.mjs:222-231` 为定向中止**提交点**（`entry.stopped = true` + `ctrl.abort({ abortTrigger:"cancel", abortDetail:"sync-child-cancel" })`）；全仓唯一调用面 = CLI TUI mouse ⏹（`thincoder-cli/src/tui/mouse.mjs:211`——`cancelSyncChild` 全仓调用点仅此 1 处）；既有取消族事件形 = `logEvent("ev:cancelled", { id: childLogId })`（`thincoder-core/agent-tools/async-settle.mjs:208`，`id = <role>#<id>`）；sync 折叠出口另记 `child:done`（kind `partial`——`thincoder-core/agent-tools/subagent.mjs:377`）⇒ 两记录分属取消面 / spawn 面 |

**受影响文件表增补 / 收正（实施轮口径 · 行数 = 换行符计数 · 本轮实测）**：

| # | 文件 | 现行行数 | 预计Δ | 动作（file:line） | 归属 |
|---|---|---|---|---|---|
| 2（**收正**） | `thincoder-core/agent-tools/subagent-async.mjs` | 437 | +8..13 | 既有 `:184-201`（④ 日志）+ `:252-254`（③ 收口）之外，增 `:222-231` `cancelSyncChild` 提交点补 `logEvent("ev:cancelled", { id: k })`（F-12） | 核 |
| 11 | `thincoder-vscode/src/extension/panel-messages.mjs` | 479 | −8..−3 | `:216-223` **删 advisor 专用分支**（advisor 目标并入共用 `executeCancelAction` 路径——③ 收口自动继承；含退役其内联 `import`）；`:224-235` 注释收正一句（advisor 并入）（F-11） | VSC |
| 12 | `thincoder-vscode/test/chat-panel-messages.test.mjs` | 421 | +18..28 | 新增 T-AF11（F-11 判据——**先红**） | VSC 测 |
| 13 | `thincoder-cli/test/sync-cancel.test.mjs` | 177 | +15..25 | 新增 T-AF12（F-12 日志面——**先红**） | CLI 测 |

**跨档限制**：`panel-messages.mjs` 479（软线 300 超、硬帽 500 未越）——本轮为**减行**、不触拆分面；`subagent-async.mjs` 437 → ≤450 同理。
**并发面**：两项实施落点（`panel-messages.mjs` / `subagent-async.mjs`）与 #19 在途实施面（`subagent-blocks.mjs` / `subagent-freeze.mjs` / `subagent-scheduler.mjs`）**零重叠**——无同文件并发写面。

**用例表增补**：

| # | 类 | 输入 | 期望输出 | AC |
|---|---|---|---|---|
| T-AF11（**新增 · 先红**） | 正常 | VSC 夹具：`history._asyncAdvisors` 置 queued 条目（`relayPrefix "advisor#5/"`）+ `history._asyncAdvisorQueue` 置该条目 → `handlePanelMessage(p, { type:"cancelSubagent", id:"5", role:"advisor" })` | 队列零残留 + 出池 + cancelled 墓碑 + `subagent` 协议消息**恰 1 条** `{ role:"advisor", id:5, status:"cancelled", was:"queued" }`（今日红：零消息——等待头悬留）+ 零裸文本泄漏 + 零 `⟦ev⟧stopped` | AC-AF10 |
| T-AF12（**新增 · 先红**） | 正常 | `THINCODER_LOG_DIR` 隔离目录 + registry 置 `coder#1`（live）→ `cancelSyncChild(parent, "coder#1")`；随后 `stopped` 态再调 + registry miss 各一次 | 日志档 `ev:cancelled` **恰 1 条**（`id:"coder#1"`——与异步取消族同形）；error 两分支零新增 | AC-AF11 |

**AC 增补**：

| # | 判据（可机判） | 回指 |
|---|---|---|
| AC-AF10 | VSC ⏹ advisor 目标：queued 命中 ⇒ `⟦ev⟧cancelled` 恰 1 条经中继（webview 收 `cancelled(was:"queued")`）+ 队列零残留 + 零 `⟦ev⟧stopped`；running 命中 ⇒ `⟦ev⟧stopped` 经中继（webview 收 `cancelled`——块定格） | 台账 #20 · F-11 |
| AC-AF11 | sync ⏹ 取消 ⇒ 日志档 `ev:cancelled` 恰 1 条（`id` = `role#N`）；error 两分支零记录 | F-12 · `LOGGING.md` §6.2 |

**决策记录增补**：

| # | 决策 | 选定 | 否决 / 备选（理由） |
|---|---|---|---|
| D-AF9 | F-11 修法 | **删 VSC advisor 专用分支**——advisor 目标与子代理族同经 `executeCancelAction`（收尾单源；与 `WEBVIEW-PROTOCOL.md:52`「advisor role 复用同路由」既定契约同向） | 保留分支 + 就地补 `callbacks` / `refreshAdvisorQueuedTokens`——**否决**：第二份收尾（与核 `/` CLI mouse 并列成三份）= 漂移面（D-AF2 同理由）；端侧再自持一份——同否决 |
| D-AF10 | F-12 写点 | **`cancelSyncChild` 提交点**（取消动作点——与 ② queued 出队点同口径） | 落折叠出口（`subagent.mjs` catch ② 分支）——**否决**：折叠点是 spawn 面（成功 / 折叠共用出口），且他日新调用面（他端 ⏹）会漏记；只记 `⟦ev⟧stopped` token 面——**否决**：token 面非日志面，诊断档案无痕 |

**发现表增补（本轮所见——逐条）**：

| # | 类 | 发现（证据） | 处置 |
|---|---|---|---|
| F-14 | 计数征 | §6.11「队列取消收尾**五面**」与实列六条不符（漏计「幂等与池面」——设计轮条文已含该项） | **consistency 面就地收正**：`AGENT-LOOP-SUBAGENT.md:221` 改「七面」并逐组列明（设计轮四 + fix 轮二 + 二轮 fix 一）；内容条文零改 |
| F-15 | 端差（**在案**） | F-12 写点今日**仅 CLI 可达**——VSC 无 sync ⏹ 面（`AGENT-LOOP-SUBAGENT.md` §6.7.2「面」行已在案）；写点落核单点 ⇒ 他日接路自动继承 | 无动作（登记） |
| F-16 | 注释陈文（非阻断） | `thincoder-vscode/src/extension/panel-callbacks.mjs:75` 注释「核仅在 queued 取消路径发」——③ / F-11 落地后外延（advisor queued 亦发；语句仍真——仍限 queued 取消路径） | 不列受影响文件表（语义零错）；实现轮可顺带收正 |
| F-17 | 双源面（**在案**） | 取消收尾现有两处实现（核 `executeCancelAction:260-276` / CLI mouse `mouse.mjs:233-239`）——§6.11「两路同通道同式」既定设计 | 本批不动；端侧新增路径一律并共用路径（D-AF9 已钉）——若将来再增路径须先议合并 |

**自检读数（二轮 fix 轮终态）**：
① 两裁项逐处落位（上表 `file:line` 逐条）✓；
② 三链一致 = 台账 #20（F-11 归评审取消面）/ #21 / #31 回指行与本节一致、既有条文零改 ✓；
③ 机检（`node scripts/doc-check.mjs`）：锚 **837**（= 基线，零新增）· 行宽 **3**（= 基线，零新增）✓；
④ 设计档行数：`AGENT-LOOP-SUBAGENT.md` 631 → **644** · `LOGGING.md` 155 → **158** · `WEBVIEW-PROTOCOL.md` 332 → **333**（各含变更记录一行）；
⑤ 探针 = **零**（fix 轮只落条文；F-12 归属核验走**实读**——调用面 / 提交点 / 事件形逐处列出）；
⑥ 有意未改：`docs/cli/design/TUI.md`（本轮零碰）· 历史变更记录原计数留档 · 需求档（父侧域）。

### 2.14 三轮 fix 轮（eng-designer · 2026-09-18）——设计评审轮 1 七条逐条落位

**轮次** = fix（承 §1.3 派单 id=17）。**范围** = §3 发现表七条逐条（父侧已逐条裁定接受）。**方法** = 先实读核证（#1 code 定性 / #6 坐标实读）→ 才落条文；**零写码**。
**本轮不做** = 需求档 · 代码（#1 只读定性）· 冻结批档 / `_archive/**` / 参照树 · 已裁定面机制结论（c1 / c2 / #21 / F-3② / F-6 / F-11 / F-12 零改）。

**七条 → 落位（file:line = 本轮终态实读）**：

| # | 级别 | 落位 | 核证读数（本轮实读） |
|---|---|---|---|
| 1 | 🔴 | 发射点单源化——`docs/core/design/AGENT-LOOP-SUBAGENT.md:225-227`（唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支〔含 `pushReal`〕，接口 = 可选 `onToken` 形参）· `:234-236`（工具路径改述「经核单点，不另发」）· `:237-239`（**CLI mouse 直连路径去重**——新增句）· `:242`（端侧经核单点）；`docs/cli/design/TUI.md:297-300`（发射源族 × 落点同步）；批档 §2.12 行 2 收正见下 | **mouse 定性 = 自持发射 ⇒ 去重**：`thincoder-cli/src/tui/mouse.mjs:206-208` 评审族**直调** `cancelAsyncAdvisor`（不经 `executeCancelAction`）；`:233-240` 在 `r?.was === "queued"` 分支**自行** `emit(`${key}/⟦ev⟧cancelled\x1e`)`（`emit` = `routeSubToken` 就地路由 + `pushLine` 兜底）。核 queued 分支落地发射后该行为重复来源 ⇒ 修法 = `emit` 上移传进核调用、自持发射行仅子代理族保留。另核证：`cancelAsyncAdvisor(agent, id)` 现签名无通道（`advisor-async.mjs:212`），`⟦ev⟧` 发射面恒经调用方通道（`:381-382` launch 面同式）⇒ 形参为必需接口 |
| 2 | 🟡 | §2.12 行 1 收正（补 #20 两项 + Δ 计入）——见下「受影响文件表收正」（行 1 收正 + 行 2 同口径） | §2.12 行 1（`:205`）三项动作 vs §2.1 修法 1/2（`:46-47`）+ §2.5 行 1（`:98`）+ AC-AF1/AF2（`:130-131`）两份清单并存 ⇒ 以本段收正表为**单一权威清单**（§2.12 / §2.13 两表未列行 = 零改，原文有效） |
| 3 | 🟡 | 见下「>300 存量档审视结论」（7 档逐档一句） | 引 zero-block 批口径（`TUI.md` §6.8.3.4「>300 advisory 档审视结论」）+ `AGENT-LOOP-SUBAGENT.md` §6.20.4 拆分计划在册面；核对表 = `thincoder-core/test/core-hygiene.test.mjs` `SOFT_LINE_REGISTRY`（核档在册面，实读 `:26-29`） |
| 4 | 🟡 | AC-AF4 宿主落定 = **T-AF14（新增 · VSC 测）**（`scenario-03-subagent-lifecycle.test.mjs` 夹具同步）；AC-AF2 TUI 半落定 = **T-AF13（新增 · CLI 测）**——见下用例表增补 | AC-AF4 原无对位用例（仅两夹具同步）· AC-AF2 的 TUI 半（`subTasks` 无该 key）原无宿主（T-AF1/T-AF9 宿主为核测档，断不到 TUI 面；T-AF5 为子代理族回归锁） |
| 5 | 🟡 | `was` 生产点点名 + 中继档登记行——`AGENT-LOOP-SUBAGENT.md:243`（点名）+ 受影响文件表第 15 行（**本批不动**） | **来源 = 中继合成**（`thincoder-vscode/src/extension/panel-callbacks.mjs:74-76`：`rest.startsWith("⟦ev⟧cancelled")` → `emit({ status:"cancelled", was:"queued" })`）——**非条目字段透传**（核 ack 的 `was` 不回传端侧）⇒ 中继档结构不变、本批零改（AC-AF10 / T-AF11 判据即由该既有映射满足） |
| 6 | 🟡 | `docs/cli/design/TUI.md:494`（§6.8.3.8 坐标收正 + as-of 标注）；批档侧 c2 落点行（§2.12 行 4）坐标已在 §2.15 ② 同口径收正 | 实读 `thincoder-cli/src/tui/subagent-blocks.mjs`：`⟦ev⟧cancelled` 分支 = `:180-192`（注释段起 `:180`、正则守卫 `:185`、删块 `:188`）；`TUI.md:492` 原记 `:167-179` 系 **implementation 后漂移**（zero-block 实施使该档 437 → 449；`:167-179` 现为 `⟦ev⟧async` 分支面）⇒ 非机制冲突，标 as-of 即收口 |
| 7 | 🔵 | `docs/cli/design/TUI.md:297-300`——「**发射源两处**」句改写为**按族 × 落点逐条列名**（去计数声明，消声明-枚举不符） | 与 `AGENT-LOOP-SUBAGENT.md` §6.11 第 3 条「队列取消收尾**七面**」（`:221`——面 = 收尾面）口径分列：本句 = 发射源名单，不并入面计数；子代理族两路**互斥**（同一事件只有一路在链上）而非「同族两处」 |

**受影响文件表收正（实施轮口径 · 行数 = 换行符计数 · 本轮实测；§2.12 / §2.13 两表与本表冲突处以本表为准）**：

| # | 文件 | 现行行数 | 预计Δ | 动作（file:line） | 归属 |
|---|---|---|---|---|---|
| 1（**收正**） | `thincoder-core/agent-tools/advisor-async.mjs` | 450 | **+11..17**（原 +7..11——补计 #20 两项） | `:212` `cancelAsyncAdvisor` 增可选形参 `onToken`（#1）· `:226-235` queued 分支补 `pushReal` 机读线（#20·逐字同 running 面模板）· 同分支经 `onToken` 发 `⟦ev⟧cancelled`（#20 + #1 单点）· 同分支补 `logEvent("ev:cancelled")`（④）· `:264-271` `dequeueAdvisor` 载体吸收（#21⑤b）· `:294-316` `refillAdvisorQueue` 终态守卫（①） | 核 |
| 2（**收正**） | `thincoder-core/agent-tools/subagent-async.mjs` | 437 | +8..13（不变） | `:184-201` queued 分支补 `logEvent`（④）· `:252-254` advisor 落池分支：传 `ctx.callbacks?.onToken` 入核（**不另发**——#1 裁定）+ `refreshAdvisorQueuedTokens` 余位刷新（③ 收口保留） | 核 |
| 14（**新增**） | `thincoder-cli/src/tui/mouse.mjs` | 251 | −1..+2 | `:206-240` 评审族**去重**：`emit` 上移 → `cancelAsyncAdvisor(agent, id, emit)`；自持发射行加 `!isAdvisorBlock` 守卫（子代理族面零改）（#1）· 251 < 300 软线——不触档位面 | CLI |
| 15（**新增 · 登记行**） | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 381 | **0（本批不动）** | `:74-76` = `was:"queued"` 生产点（中继合成面——#5 点名）；既有映射已覆盖 AC-AF10 / T-AF11 判据 ⇒ 本批零改 | VSC |

**>300 存量档审视结论（R24a 口径 · 承 zero-block 批先例 · 7 档逐档一句）**：

- `thincoder-core/agent-tools/advisor-async.mjs`（450 → ≤467）：改动面 = 既有 queued 分支内三条 + 既有函数形参 + 既有守卫点（未新增职责 / 未新增模块）⇒ **无需拆分**；>300 为存量——**已在册** `core-hygiene.test.mjs` `SOFT_LINE_REGISTRY`（`:27`）；距 500 硬帽余量 ≥33 行（该档顶注自记「500 行 = 硬帽在册」）。
- `thincoder-core/agent-tools/subagent-async.mjs`（437 → ≤450）：改动面 = 既有分支 / 既有早退点行内改 ⇒ **无需拆分**；在册（同表 `:28`）。
- `thincoder-core/agent-tools/subagent-scheduler.mjs`（435 → ≤444）：改动面 = 新增一个导出谓词 `entryTerminal`（2 行级）+ 既有函数头判 + 既有守卫 ⇒ **无需拆分**；在册（同表 `:29`）+ 拆分计划已在 `AGENT-LOOP-SUBAGENT.md` §6.20.4 登记（依赖派生族候选——消解条件 = 该档下次实质改动时）。
- `thincoder-cli/src/tui/subagent-blocks.mjs`（449 → ≤454）：改动面 = 既有 cancelled 分支一行调用 + import ⇒ **无需拆分**；CLI 侧无在册表 ⇒ **存量债登记**（zero-block `TUI.md` §6.8.3.4 已记「437 → ~460 · >300 为存量〔2026-09-05 由 625 行拆出后漂移〕⇒ 登记存量债」——本批同口径续记）。
- `thincoder-vscode/src/agent.mjs`（477 → ≤478）：改动面 = 既有 `CARRIER_FIELDS` 数组补一词（`:39-43`）⇒ **无需拆分**；VSC 侧无行数机检表 ⇒ 存量债登记（距 500 硬帽余量 22 行——本批 +1）。
- `thincoder-vscode/src/extension/panel-messages.mjs`（479 → ≤476）：改动面 = **减行**（删 advisor 专用分支 `:216-223`）⇒ **无需拆分**；存量债登记（本批净减）。
- `thincoder-vscode/test/chat-panel-messages.test.mjs`（421 → ≤449）：测试档新增一例 ⇒ **无需拆分**；测试档「无硬限约束」判例在案（R3 不复议——同族先例 2026-09-13 批「测试档无硬限约束」判）。

**用例表增补（#4）**：

| # | 类 | 输入 | 期望输出 | AC |
|---|---|---|---|---|
| T-AF13（**新增 · 先红**） | 正常 | CLI 测档直驱：真 `launchAsyncAdvisor` 入队（池满 + 异 scope）→ `cancelAsyncAdvisor(agent, id, emit)`（`emit` = `routeSubToken(state, …)` 就地路由 + 兜底 pushLine） | token 流**恰 1 条** `advisor#<id>/⟦ev⟧cancelled`；`subTasks` 无该 key（排队块移除）；`_frozenSubKeys` 含该 key（c2）——今日红（核零发射 ⇒ 块孤悬） | AC-AF2（TUI 半） |
| T-AF14（**新增**） | 边界 | VSC 测档（`scenario-03` 夹具）：`agent._asyncAdvisorQueue ??= []`（模拟核写侧 `advisor-async.mjs:414`）→ 再访问 | 落 `history._asyncAdvisorQueue`（`agent` 字段与 `history` 同容器——访问器绑定）+ 二次访问同一容器（跨 run 同一容器语义） | AC-AF4（宿主落定） |

**AC 收正（#4 / #5）**：

| # | 判据（可机判） | 回指 |
|---|---|---|
| AC-AF2（**收正**） | 同一次取消事件流恰 +1 条 `⟦ev⟧cancelled`、且零 `⟦ev⟧stopped`；CLI 面板该排队块被移除（`subTasks` 无该 key——**宿主 = T-AF13**〔直调路由〕+ **T-AF15**〔mouse 路由——§2.15〕） | 台账 #20 · `TUI.md` §6.8.2 |
| AC-AF4（**收正**） | VSC `history` 载体下 `_asyncAdvisorQueue` 跨 run 同一容器（`CARRIER_FIELDS` 含该键；两测试夹具同步）——**宿主 = T-AF14**（+ `scenario-03:46` / `vsc-panel-rings:89` 夹具同步） | 台账 #21 |
| AC-AF10（**补注**） | `was:"queued"` 生产点 = 中继合成（`panel-callbacks.mjs:74-76`——本批零改；核 ack 的 `was` 不回传端侧） | 台账 #20 · F-11 |

**边界句收正（#1 伴随）**：核 queued 取消的收尾**单源**（发射 + `pushReal` 同址）；子代理族保持既有两路形态（`executeCancelAction` / mouse 各一处，互斥）——**本批不合并该族**（F-17「两路同通道同式」仍成立；合并 = 另议）。
端侧单源化落点仍为 F-11 既定修法（删 VSC advisor 专用分支、并入 `executeCancelAction`）——本批只把**发射面**移入核单点，**不改**该裁定。

**自检读数（三轮 fix 轮终态）**：
① 七条逐处落位（上表 `file:line` 逐条）✓；② 三链一致 = 台账 #20 / #21 / #31 ↔ 本节（含 §2.14 收正表）↔ 设计档条文（`AGENT-LOOP-SUBAGENT.md` §6.11 · `TUI.md` §6.8.2 / §6.8.3.8）✓；
③ 设计档行数（本轮终态实读）：`AGENT-LOOP-SUBAGENT.md` 645 → **654**（含变更记录两行）· `TUI.md` 590 → **594**（含变更记录两行）；
④ 探针 = **零**（#1 定性走**实读**——mouse 调用面 / 形参面 / 发射通道逐处列出）；⑤ 有意未改：`AGENT-LOOP.md` · `LOGGING.md` · `WEBVIEW-PROTOCOL.md`（本轮零碰）· 历史变更记录原计数留档。

**§2.14 读数收正 + 机检读数（三轮 fix 轮终态 · 2026-09-18 实跑）**：

- **读数收正**：上述自检 ③ 两数勘误——设计档行数（本轮终态**实测**）= `docs/core/design/AGENT-LOOP-SUBAGENT.md` **644 → 653**（+9：块面事件面 +3 · 工具路径收口 +3 · 端侧句 +1 · 变更记录 +2）· `docs/cli/design/TUI.md` **589 → 593**（+4：§6.8.2 +2 · 变更记录 +2）。上文「645 → 654 · 590 → 594」为落笔估算值，**以本行为准**。
- **机检（`node scripts/doc-check.mjs` · cwd = 仓根 · 实跑）**：锚 = **848 悬空** · 行宽 = **4 行** >300 字符。
  - **本批写域零新增**（逐行实读）：① 锚——三档（`AGENT-LOOP-SUBAGENT.md` / `TUI.md` / 本批档）命中清单 12 处**全在早存行**（`AGENT-LOOP-SUBAGENT.md:4` / `:398` / `:399` / `:407` / `:409` / `:624`），本批新增行（`:225-227` · `:234-243` · `:652-653` · `TUI.md:297-300` / `:494` / `:587-588` · 本节）**贡献 0**；`TUI.md` 与`本批档`各自 0 命中；② 行宽——三档新增行零 >300 非表格行（逐行实测）。
  - **读数与早存基线（837 / 3）不可直接相减——归因在档**：本次 `848 / 4` 面内含**并行线在写面**（`git status` 实证：`scripts/doc-check.mjs` M〔判据本体检修中〕+ 未跟踪新档 `docs/core/design/ANCHOR-DEBT-REPAIR.md` + `docs/core/design/prompts/persona-engineering.md` M）；行宽 4 行中 `docs/core/design/prompts/persona-engineering.md:137`（507 字符）/ `:139`（416）**= 并行线在写档**，`ENG-TOKEN-BINDING.md:147`（360）/ `MANIFEST.md:144`（364）= 早存档。**本批不认领他档红面、亦不代改**（写域外——报父侧）。
- **受影响文件表行数复核（本轮实测）**：`advisor-async.mjs` 450 · `subagent-async.mjs` 437 · `subagent-blocks.mjs` 449 · `mouse.mjs` 251 · `panel-callbacks.mjs` **380**（`wc -l` 口径；读取工具显示 381 = 尾换行渲染差——§6.20.4 脚注同口径，非漂移）。

### 2.15 微 fix 轮（eng-designer · 2026-09-18）——设计评审核销轮 2 三项尾巴逐条落位

**轮次** = fix（承 §1.3 派单 id=21）。**范围** = ① T-AF13 / T-AF14 宿主行与 Δ ② 坐标收正 + 悬空指针 ③ mouse 去重措辞统一 + 路由覆盖处置。
**方法** = 先实读核证（坐标 / mouse 路由可测面 / 计数观测缝）→ 才落笔；**零写码**。
**本轮不做** = 需求档 · 代码（只读定性）· 冻结批档 / `_archive/**` / 参照树 · 已裁定机制结论（单源化 / c1 / c2 / F-3② / F-6 / F-11 / F-12 零改）。

**三项 → 落位（file:line = 本轮终态实读）**：

| # | 尾巴 | 落位 | 核证读数（本轮实读） |
|---|---|---|---|
| ① | T-AF13 / T-AF14 无宿主行与 Δ | 见 §2.15「受影响文件表收正 / 增补」两行（行 8 = `queued-stop.test.mjs` · 行 9 = `scenario-03-subagent-lifecycle.test.mjs`） | 宿主落定依据：T-AF13 需「真状态 + `routeSubToken` 就地路由 + 真实坐标几何」三面——`thincoder-cli/test/queued-stop.test.mjs:16-18`（三面 import）· `:76-82`（mouse 装配）· `:134-141`（真实坐标点击全链）；T-AF14 需「`history` 跨 run 载体 + 访问器绑定」——`scenario-03-subagent-lifecycle.test.mjs:46`（夹具表）· `:61-63`（绑定循环） |
| ② | §2.12 行 4 坐标 + §2.14 行 6 悬空指针 | §2.12 行 4（`:210`）坐标 `:185-192` → **`:180-192`**（标 as-of 2026-09-18）；§2.14 行 6 落位列原句「…收正表第 4 行」（该表实为 #1 / #2 / #14 / #15 四行——所指行不存在）→ 改指 **§2.15 ②**；同行读数格坐标「正则守卫 `:187`」→ **`:185`** | 实读 `thincoder-cli/src/tui/subagent-blocks.mjs`：`:180` 注释段起 · `:185` 正则守卫 `/^⟦ev⟧cancelled(\x1e|$)/` · `:187` 块存活守卫（`live && !live.done && live.async !== true`）· `:188` 删块 · `:192` 分支闭合 ⇒ 全跨 = `:180-192`（与 §2.14 行 6 主值一致） |
| ③ | mouse 去重措辞两说 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:238` 改写为**守卫形**（与 §2.14 行 14 同口径）+ 本档变更记录补一行（`:654`） | 两说实对照：设计档原句「`emit` 上移……，删除自持发射行（子代理族自持发射面不动）」vs §2.14 行 14「自持发射行加 `!isAdvisorBlock` 守卫（子代理族面零改）」——同效异写；实读 `thincoder-cli/src/tui/mouse.mjs:201` / `:206-208` / `:235` ⇒ 第 `:235` 行 = **两族共用行**（`emit(`${key}/⟦ev⟧cancelled\x1e`)`）⇒ 守卫形为准（字面「删除」= 子代理族发射静默消失） |
| ③′ | mouse 路由覆盖 | **补对位用例 T-AF15**（可测部分——见下用例表）+ **计数缺口登记**（见下覆盖缺口段） | 可测面实读：⏹ 门控显式含 advisor 族（`thincoder-cli/src/tui/subagent-panel.mjs:127`——`sub.role === "advisor"` 在列）；mouse 评审族实调 `cancelAsyncAdvisor`（`mouse.mjs:201` / `:206-208`）；出队读面 = `_asyncAdvisorQueue`（`thincoder-core/agent-tools/advisor-async.mjs:264-271`）⇒「点击 → 块移除 / 队列零残留 / 键级墓碑」三面可断言 |

**受影响文件表收正 / 增补（实施轮口径 · 行数 = 换行符计数 · 本轮实测；行 8 / 行 9 与 §2.12 同名行冲突处以本表为准——§2.12 / §2.13 / §2.14 未列行 = 零改，原文有效）**：

| # | 文件 | 现行行数 | 预计Δ | 动作（file:line） | 归属 |
|---|---|---|---|---|---|
| 8（**收正**） | `thincoder-cli/test/queued-stop.test.mjs` | 182 | **+75..120**（原 +25..40——补计 T-AF13 + T-AF15 宿主） | T-AF5 回归锁（含 c2 断言收正）· T-AF6（c1+c2 定稿）· **T-AF13**（直调路由：真 `launchAsyncAdvisor` 入队 → `cancelAsyncAdvisor(agent, id, emit)`——宿主三面见上 ① 行）· **T-AF15**（mouse 路由对位：真实坐标 ⏹ 命中评审排队块） | CLI 测 |
| 9（**收正**） | `thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs` | 241 | **+11..17**（原 +1——补计 T-AF14 用例） | `:46` 夹具 `CARRIER_FIELDS` 同步补款（F-8）· **T-AF14**（AC-AF4 宿主——见下用例表） | VSC 测 |

**跨档限制**：本表两行均为测试档（测试档无硬限约束——R3 判例在案）⇒ 不触拆分面。

**用例表增补（③′）**：

| # | 类 | 输入 | 期望输出 | AC |
|---|---|---|---|---|
| T-AF15（**新增 · 回归锁**） | 正常 | CLI 测档（`queued-stop.test.mjs`·真实坐标几何契约）：`advisor#5` 排队块（`routeSubToken` 收 `⟦ev⟧queued` 建块）+ 真池条目与 `_asyncAdvisorQueue` 就位 → 面板首块头 ⏹ 坐标点击（`createMouseDispatch.onMouseClick`） | 块移除（`subTasks` 无该 key——**由核单点经通道发射达成**：去重若误删共享行且漏传通道 ⇒ 本例红）+ 队列零残留 + `_frozenSubKeys` 含该 key（c2——先红）+ 停止提示行 | AC-AF2（mouse 路由对位） |

**AC 收正**：AC-AF2（§2.14 `:372`）宿主列补注 `+ T-AF15`（mouse 路由端态；T-AF13 = 直调路由「恰 1 条」计数宿主）——两路由各得其宿主。

**mouse 路由覆盖缺口（登记——结论）**：mouse 路由的「**恰 1 条** `⟦ev⟧cancelled`」**计数**无断言宿主（无观测缝）——mouse 内部 `emit` 不外露；二次发射经 `routeSubToken` 幂等
（`subagent-blocks.mjs:180-192`：`live` 已缺 ⇒ 守卫不中、零状态变更），唯一差异面 = `scheduleRender()`（`:190`——实参 = 调用方 `render`）多一次调用，该面与既有渲染调用混流 ⇒ 计数为脆性口径，**不设断言**。
⇒ 计数面由 **T-AF13**（核层：测试自带 `emit` 计数）覆盖；mouse 路由端态面由 **T-AF15** 覆盖；子代理族自持发射零回归面由 T-AF5 / 同档用例 2（`queued-stop.test.mjs:119-156`）覆盖。

**自检读数（微 fix 轮终态）**：
① 三项逐处落位（上表 `file:line` 逐条）✓；
② 三链一致 = 台账 #20（T-AF13 / T-AF15 → AC-AF2）· #21（T-AF14 → AC-AF4）· #31（c2 面）↔ 本节 ↔ 设计档条文（`AGENT-LOOP-SUBAGENT.md` §6.11 第 3 条）✓；
③ 用例表 ↔ AC 全量对齐（十五例零悬空）：T-AF1/2/4 → AC-AF1 · T-AF1/13/15 → AC-AF2 · T-AF3 → AC-AF3 · T-AF14 → AC-AF4 · T-AF5 → AC-AF5 · T-AF6/8 → AC-AF6 · T-AF7 → AC-AF7 · T-AF9 → AC-AF8 · T-AF10 → AC-AF9 · T-AF11 → AC-AF10 · T-AF12 → AC-AF11；
④ 设计档行数（本轮终态实测）：`AGENT-LOOP-SUBAGENT.md` **653 → 654**（+1 = 变更记录一行）；`TUI.md` · `LOGGING.md` · `WEBVIEW-PROTOCOL.md` 本轮零碰；
⑤ 受影响文件表行数复核（本轮实测，`wc -l` 口径）：`queued-stop.test.mjs` 182 ✓ · `scenario-03-subagent-lifecycle.test.mjs` 241 ✓（与本表两值一致）；
⑥ 机检（`node scripts/doc-check.mjs` · cwd = 仓根 · **实跑两次**）：**落笔前读数（2026-09-18 00:23）= 锚 837 · 行宽 3 行**（回归 §2.11–§2.13 早存基线；§2.14 的 848 / 4 系并行线在写面，静置后一度收敛）；**写入终态复跑 = 锚 851 · 行宽 4 行**——**增量全在并行线在写档**（`git status` 实证：他批 M 面 `MANIFEST.md:91`〔382〕等，非本批写域）。
   **本批写域零新增（逐行实证）**：`docs/batches/**` 命中 **0 处**（含本档新增 §2.15）；`AGENT-LOOP-SUBAGENT.md` 命中 12 处**全在早存行** `:4` / `:398` / `:399` / `:407` / `:409` / `:624`（与 §2.14 同一清单）——本轮新增行 `:238` / `:654` 贡献 **0**；
   行宽 4 行（`ENG-TOKEN-BINDING.md:147`〔360〕· `MANIFEST.md:91`〔382〕· `prompts/persona-engineering.md:137`〔507〕/ `:139`〔416〕）**均非本批写域**；
⑦ 探针 = **零**（本轮只改述 / 只登记；mouse 可测面核证走**实读**——门控 / 路由 / 出队读面逐处列出）；
⑧ 有意未改：`docs/cli/design/TUI.md`（§6.8.2 发射源名单已按族 × 落点列名、无「自持发射」两说——零碰）· 历史变更记录原计数留档 · 需求档（父侧域）。

### 2.16 fix 轮 2（eng-designer · 2026-09-18）——实施轮开口项 1 / 4 / 6 落位

**轮次** = fix（承 §1.3 实施轮（id=29）交付 · 开口项 1 / 4 / 6 父侧裁定）。**范围** = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.11 第 3 条「幂等与池面」补三处 + 本档变更记录一行。
**方法** = 先实读核证（三处各自证据坐标：两返回点 / 墓碑读取判据与两写入点 / 载体字段集与取号函数）→ 才落条文；**零写码**。
**本轮不做** = 机制变更 · §6.11 之外的面 · 其他档 · 已裁定机制（单源化 / c1 / c2 / T-AF2 幂等语义）零改 · 需求档 · 代码。

**三处 → 落位（file:line = 本轮终态实读）**：

| # | 处 | 落位 | 核证读数（本轮实读） |
|---|---|---|---|
| ① | 确认形状 | `AGENT-LOOP-SUBAGENT.md:232`（§6.11 第 3 条「幂等与池面」补注） | 首发 = `advisor-async.mjs:255`（`return { id: key, status: "cancelled", was: "queued" }`）· 重复 = 同档 `:229`（`return { id: key, status: "cancelled" }`——无 `was`）；端侧 `was` 生产点 = `panel-callbacks.mjs:74-76`（中继合成——承 §2.14 #5） |
| ② | 确认面外延 | 同档 `:233-235` | 读取判据 = `advisor-async.mjs:229`（`tomb?.status === "cancelled" && tomb.role === "advisor"`）；两取消面同形写入 = `async-settle.mjs:229`（running 经 settle）/ `advisor-async.mjs:246`（queued 出队点）——墓碑形状 `{status, role}` 无面别 ⇒ 曾 running 取消、已 settle 出池的 id 亦答同一确认；全早退在写点前（`advisor-async.mjs:223-231`）⇒ 零重复注入 / 发射 / 日志 |
| ③ | 跨 run 墓碑无区隔 | 同档 `:236-237` | `_asyncTombstones` ∈ VSC 载体字段集（`thincoder-vscode/src/agent.mjs:41`）· `_subAgentCounter` 不在（同档 `:40-44`）· 取号 = `subagent-scheduler.mjs:404-414`（`max(counter ?? 0, 活池 max) + 1`——只扫两活池）⇒ 编号空间无跨 run 隔离 |
| ④ | 变更记录 | 同档 `:662-664` | 一行（本档变更记录） |

**自检读数（本轮终态 · 实跑）**：
① 三处逐处落位（上表 `file:line` 逐条）✓；② 回指 = §5.6 实施轮开口项 1 / 4 / 6（父侧裁定：① 接受不扩墓碑形状 · ④ 登记 · ⑥ 补形状句；无台账条目）+ 设计档 §6.11 第 3 条——同源 ✓；
③ 机检（仓根 `node scripts/doc-check.mjs` · 实跑三次）：落笔前 = 悬空 **627** · 行宽 **2**（= 派单基线）；首稿 = 悬空 632 · 行宽 **4**（**新增 2 行超宽**——`:233` 308 / `:661` 375 ⇒ **已折行收正**）；终稿 = 悬空 **632** · 行宽 **2** ✓。
④ Δ 归因（逐行实证）：**本批写域零新增**——`AGENT-LOOP-SUBAGENT.md` 命中 10 处全为早存行（落笔前 `:398` / `:399` / `:407` / `:409` → 终稿 `:405` / `:406` / `:414` / `:416` = 同清单 +7 行位移）；批档命中 **0**；**+5 = 并行线在写档**（`docs/core/design/ANCHOR-DEBT-REPAIR.md:184` 五条符号命中——落笔前该档零入闸命中）——**不认领他档红面**（写域外，报父侧）。
⑤ 设计档行数（实测）：`AGENT-LOOP-SUBAGENT.md` **655 → 665**（+10 = 正文 +7〔补注 6 行 + 折行 +1〕· 变更记录 +3）。
⑥ 探针 = **零**（三处均走实读核证——返回点 / 读取判据 / 写点 / 载体字段集 / 取号函数逐处列出）。

**读数收正（终稿复跑 · 2026-09-18 01:17 实跑）**：上文 ③ 的「终稿 = 悬空 632」为落笔当时读数（含并行线在写面 `docs/core/design/ANCHOR-DEBT-REPAIR.md:184` 五条符号命中）；**本段写入后复跑 = 悬空 627 · 行宽 2**（与派单基线逐字对齐——并行线该面已复归）。两轮读数下**本批写域均为零新增**：`AGENT-LOOP-SUBAGENT.md` 命中 10 处全为早存行（`:405` / `:406` / `:414` / `:416`）· 批档命中 0。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

## 设计评审（独立评审子代理）· af 批

**评审对象**（声明面）= ① #20 / ② #21 / ③ #31 + 加固 c1/c2 / ④ fix 轮 F-3②·F-6·F-11·F-12 / ⑤ 批档 §2.12/§2.13；**范围** = 六档（`AGENT-LOOP-SUBAGENT.md` · `AGENT-LOOP.md` · `LOGGING.md` · `TUI.md` · `WEBVIEW-PROTOCOL.md` · 批档）逐档通读。
**边界与限制**：无 document map / 无项目标准档 ⇒ Document ownership 面按 AGENTS.md 约定 + 跨档一致性判定（降级）；方法学按 AGENTS.md + 评审准则判定（discipline 层提示词不在面内）；代码坐标（`file:line` / 源档行数）不在声明面内 ⇒ 标 `unverified`（本表不断言其真伪）；档面行数已 spot-check：`AGENT-LOOP.md` 515 ✓ · `AGENT-LOOP-SUBAGENT.md` 644 ✓ · `TUI.md` 589 ✓ · `LOGGING.md` 158 ✓ · `WEBVIEW-PROTOCOL.md` 333 ✓（与 §2.11–§2.13 自检读数一致）；11 款载体计数收口（`AGENT-LOOP.md:81` / `:93-98` / `:122` / `:401`）与三链回指抽查通过（无发现）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements · Clarity | 🔴 | advisor **queued 取消**的收尾 / 发射点在终稿内两说并存：核 `cancelAsyncAdvisor` queued 分支（批档 §2.1 修法 1/2 `2026-09-17-async-face-fixes.md:46-47` + D-AF2 `:115` + `AGENT-LOOP-SUBAGENT.md:224`「出队即发」）——`executeCancelAction` advisor 落池分支（`AGENT-LOOP-SUBAGENT.md:231-232`「queued 命中时…发 `⟦ev⟧cancelled`」+ 批档 §2.12 行 2 `:205`）；`AGENT-LOOP-SUBAGENT.md:233` 又保 CLI mouse 直连路径「既有同款维护不变」（F-17 `:312` 自陈取消收尾两处实现）⇒ 同一工具路径并存 ≥2 个发送面，而 AC-AF2 / AC-AF8 / T-AF9（批档 `:131` / `:234` / `:225`）均要求「恰 1 条」`⟦ev⟧cancelled`；设计未给单一发射点或去重规则 ⇒ 实现轮无法从终稿唯一推出落点 | 钉单一发射点并逐处改述：定核 queued 分支（含 `pushReal`）为唯一发送点，则 `AGENT-LOOP-SUBAGENT.md:231-232` 与批档 §2.12 行 2 的「发 `⟦ev⟧cancelled`」改为「经该点（不另发）」；同句写明 CLI mouse 直连路径的发射面处置（收编进核单点 / 去重）——同一事件的四处描述须单源化 |
| 2 | Affected-file annotations | 🟡 | 终稿实施清单不闭合：批档 §2.12 行 1（`:204`）对 `advisor-async.mjs` 只列 `logEvent` / `carrierField` / `refillAdvisorQueue` 守卫三项（Δ +7..11），**未列** #20 的两项交付（`:226-235` queued 分支 `pushReal` 机读线提醒 + `⟦ev⟧cancelled`——见 §2.1 `:46-47` 与 §2.5 行 1 `:98` 的 +10..14），而 AC-AF1 / AC-AF2（`:130-131`）仍以这两项为判据 | §2.12 行 1 补列两项动作并把 Δ 计入（同表行 2「+8..13」同口径）；若两项已裁定移出该档，则同步改写 §2.5 行 1、§2.1 修法 1/2 与 `AGENT-LOOP-SUBAGENT.md` §6.11「机读线提醒」面——避免两份实施清单并存 |
| 3 | Affected-file annotations | 🟡 | 7 个 >300 存量档在终稿表中仅以「<500 硬帽未越 ⇒ 不触拆分面」作结（`:107` / `:215` / `:281`），无同批先例形态的「改动面 → 是否需拆」审视与存量债登记（先例 = `TUI.md` §6.8.3.4「>300 advisory 档审视结论」· `AGENT-LOOP-SUBAGENT.md` §6.20.4 拆分计划）：`advisor-async.mjs` 450 · `subagent-async.mjs` 437 · `subagent-scheduler.mjs` 435 · `subagent-blocks.mjs` 449 · `thincoder-vscode/src/agent.mjs` 477 · `panel-messages.mjs` 479 · `chat-panel-messages.test.mjs` 421（行数 = 表值，源档侧 `unverified`） | 逐档补一句 >300 档审视结论（改动面 = 既有分支内小改 ⇒ 无需拆分；需拆则给拆分面）或引既有存量债登记行——与 zero-block 批口径对齐 |
| 4 | Acceptance criteria | 🟡 | AC ↔ 用例映射缺口：AC-AF2 的「CLI 面板该排队块被移除（`subTasks` 无该 key）」（`:131`）无对位用例——T-AF1 / T-AF9（`:142` / `:225`）宿主为核测档（`advisor-pool-queue.test.mjs`，`:210`）断不到 TUI 面，T-AF5（`:222`）为子代理族回归锁；AC-AF4（`:133`）在用例表（`:140-148` / `:220-226`）内无任何对位用例（仅靠两个 VSC 夹具同步 `:212-213`） | 给 AC-AF4 指定宿主（既有 VSC 载体绑定用例名）或补一例；AC-AF2 的 TUI 半在 T-AF9 内加 `routeSubToken` 断言（`advisor#<id>/⟦ev⟧cancelled` ⇒ `subTasks` 无该 key）或补 T-AF13 |
| 5 | Clarity | 🟡 | AC-AF10 / T-AF11（`:295` / `:288`）要求 webview 收 `cancelled(was:"queued")`，但 `was` 字段的生产点未在任何落点句或受影响文件表中点名——VSC 中继面 `panel-callbacks.mjs`（`relaySubagentEventToken`）不在表内，而 F-16（`:311`）又称其 `:75` 注释「实现轮可顺带收正」 | 点名 `was` 来源（条目 `wasStatus` 透传 / 中继合成）并按 criterion 8 把中继档入表（结构不变 / ±N）或明文「本批不动」 |
| 6 | Document ownership | 🟡 | 同一分支在活档中坐标不一致：`TUI.md:492`（§6.8.3.8「不改 … `⟦ev⟧cancelled` 出队语义（`subagent-blocks.mjs:167-179`）」）vs 批档 §2.5 / §2.12（`:105` / `:207`「cancelled 分支（`:185-192`）」）——两处均未标 as-of（可能是跨轮滞后，非机制冲突） | 两处标 as-of，或把 c2 落点行统一到实现轮实测坐标 |
| 7 | Clarity | 🔵 | `TUI.md:297-298` 新句「**发射源两处**：子代理族 …（`executeCancelAction` 与 mouse ⏹ 直连路径各一处）、评审族 `cancelAsyncAdvisor` …；评审族工具路径经 `executeCancelAction` 落池分支发射」与其后枚举（子代理族 2 落点 + 评审族 1 + 工具路径 1）计数不符（F-14 同族） | 改为按「族 × 落点」逐条列名，或标注计数口径（族数 / 落点数），与 §6.11「七面」口径一致 |

**计数**：🔴 × 1 · 🟡 × 5 · 🔵 × 1（= 7 条；无「通过」结论——#1 为机制级落点不一致，须处置后方可过）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2（核销轮）· 对象** = af 批 设计评审轮 1 七条修复声明（fix 轮 id=17 交付 · 批档 §2.14）。**方法** = 六档本轮 fresh 全量重读（`AGENT-LOOP-SUBAGENT.md` / `AGENT-LOOP.md` / `LOGGING.md` / `TUI.md` / `WEBVIEW-PROTOCOL.md` / 批档；后三档本轮零碰已核）；行数复核：`AGENT-LOOP-SUBAGENT.md` 653 ✓ · `TUI.md` 593 ✓（与 §2.14「读数收正」一致）· `AGENT-LOOP.md` 515 ✓ · `LOGGING.md` 158 ✓ · `WEBVIEW-PROTOCOL.md` 333 ✓。**限制**：代码面坐标（`file:line` / 源档行数）不在声明面内 ⇒ 标 `unverified`（本表只判档面自洽）；「按轮次衰减」= 只核修复声明 + 明显新问题。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `AGENT-LOOP-SUBAGENT.md` · `TUI.md` · 批档 §2.14 | 🔴 | **Fixed** | 单源化落定——`AGENT-LOOP-SUBAGENT.md:225: **发射单源化（2026-09-18 设计评审轮 1 #1 裁定）**：queued 取消的 `⟦ev⟧cancelled` **唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支**`；`:226: 发射经**调用方传入的 `onToken` 通道**（接口 = 可选第三形参 `cancelAsyncAdvisor(agent, id, onToken)`，缺省不就绪则不发射）`；`:227: **全链三条调用路各传本层通道、均不另发**…——同一取消事件全链恰发射一次`；工具路径改述 `:235: （**发射由该单点完成，本路径不另发**）`；mouse 去重 `:237-238: 按单源化裁定**去重**：`emit` 上移并作为通道传进核调用，删除自持发射行（子代理族自持发射面不动——该族两路互斥、各发一次）`；端侧 `:242: `⟦ev⟧cancelled` **经核单点发射**`；`TUI.md:299: 核 `cancelAsyncAdvisor` queued 分支 = **唯一发射点**（…三路各传本层通道、均不另发）`；批档 `:347` 新增 mouse 行（251 · −1..+2）。⇒ AC-AF2 / AC-AF8 / T-AF9 的「恰 1 条」现可唯一推出 ✓ |
| 2 | 2 | 批档 §2.14 | 🟡 | **Fixed** | `批档:345: 450 | **+11..17**（原 +7..11——补计 #20 两项）` + 动作列含 `:212` 形参 · `:226-235` `pushReal` 机读线（#20·逐字同 running 面模板）· 同分支经 `onToken` 发 `⟦ev⟧cancelled`（#20 + #1 单点）· 同分支 `logEvent`（④）· `:264-271` 载体吸收 · `:294-316` 终态守卫；`:341: （§2.12 / §2.13 两表与本表冲突处以本表为准）` ⇒ 单一权威清单成立 ✓ |
| 3 | 3 | 批档 §2.14 | 🟡 | **Fixed** | `批档:350: **>300 存量档审视结论（R24a 口径 · 承 zero-block 批先例 · 7 档逐档一句）**`——7 档（advisor-async ≤467 / subagent-async ≤450 / scheduler ≤444 / blocks ≤454 / VSC agent.mjs ≤478 / panel-messages ≤476 / chat-panel-messages.test ≤449）逐档「改动面→无需拆分 / 存量债登记 / 硬帽余量」，如 `:352: 改动面 = 既有 queued 分支内三条 + 既有函数形参 + 既有守卫点（未新增职责 / 未新增模块）⇒ **无需拆分**`；在册面引 `SOFT_LINE_REGISTRY`（代码坐标 `unverified`）✓ |
| 4 | 4 | 批档 §2.14 | 🟡 | **Partially fixed（非阻断）** | 用例落位 ✓：`:364: CLI 测档直驱：真 `launchAsyncAdvisor` 入队（池满 + 异 scope）→ `cancelAsyncAdvisor(agent, id, emit)`` + `AC-AF2（TUI 半）`；`:365: VSC 测档（`scenario-03` 夹具）` + `AC-AF4（宿主落定）`；`:371-372` AC 收正。**尾巴**：两新用例的**宿主文件与 Δ 未入受影响文件表**——行 8 = `:213: T-AF5 回归锁（含 c2 断言收正）+ T-AF6（c1+c2 定稿）`、行 9 = `:214: `:46` 夹具 `CARRIER_FIELDS` 同步补款（F-8）`（+1）、行 12 = `:280: 新增 T-AF11` 皆不含 T-AF13 / T-AF14 ⇒ 与 `:341` 单一权威清单口径冲突（补一行宿主 CLI 测 / VSC 测 + Δ 即收口） |
| 5 | 5 | `AGENT-LOOP-SUBAGENT.md` · 批档 §2.14 | 🟡 | **Fixed** | `AGENT-LOOP-SUBAGENT.md:243: `was` 生产点 = **中继合成**（`thincoder-vscode/src/extension/panel-callbacks.mjs` 面 `relaySubagentEventToken`…核 ack 的 `was` 字段不回传端侧）——中继档结构不变、本批零改。`；批档 `:348: **0（本批不动）**` + `:74-76` = `was:"queued"` 生产点（中继合成面——#5 点名）` ✓ |
| 6 | 6 | `TUI.md` · 批档 §2.14 | 🟡 | **Partially fixed（非阻断）** | 活档侧 ✓：`TUI.md:494: `⟦ev⟧cancelled` 出队语义（`subagent-blocks.mjs:180-192`——本行坐标为 **as-of 2026-09-18 实读**，原记 `:167-179` 系 implementation 后行号漂移，非机制变更）`。**尾巴**：批档侧未统一——`:338: 批档侧 c2 落点行口径统一见下收正表第 4 行` 所指行不存在（收正表实为 #1 / #2 / #14 / #15 四行），且 `:209: `:185-192` cancelled 分支调 `tombstoneSubKey(state, key)`（②）` 仍持旧坐标（同段自读实址 = `:180-192`）⇒ 删/改该指针 + 行 4 坐标同口径即收口 |
| 7 | 7 | `TUI.md` | 🔵 | **Fixed** | `TUI.md:297: **`⟦ev⟧cancelled` 发射源（按族 × 落点逐条列名）**：`——计数声明已去；`:298-300` 按族列落点（子代理族两路互斥 / 评审族唯一发射点）✓ |
| 8 | (new) | `AGENT-LOOP-SUBAGENT.md:238` · 批档 §2.14:347 · `TUI.md:297-300` | 🔵 | **New（非阻断）** | mouse 去重落笔两说 + 无对位用例：`AGENT-LOOP-SUBAGENT.md:238: 删除自持发射行（子代理族自持发射面不动——该族两路互斥、各发一次）` vs `批档:347: 自持发射行加 `!isAdvisorBlock` 守卫（子代理族面零改）（#1）`——同效、两种写法（建议统一为条件/守卫形，防误删共享行）；且 T-AF1–T-AF14 无 mouse 路径对位用例（AC-AF2「恰 1 条」在 mouse 路由无断言宿主） |

**计数**：轮 1（🔴1 / 🟡5 / 🔵1）→ 本轮 **Fixed 5 · Partially fixed 2（🟡，皆非阻断）· New 1（🔵）**；剩余 🔴 = 0 · 新 🔴 = 0。

VERDICT: pass

## §4 用户批准（主 agent）

**代签 2026-09-18 00:25**（承用户 23:33「开始处理」授权）：设计评审轮 1 changes-required → fix 轮（id=17）→ 核销轮 PASS → 微轮（id=21）——设计面终稿；设计 token 已签发（值不落文档——运行时凭证）。**实施面** = §2.2 / §2.12 / §2.13 / §2.14 / §2.15 并集（冲突处以 §2.14 / §2.15 为准）——13 档；AC-AF1–11 / T-AF1–15 全量。**→ 派 coder（initial 轮）。**

## §5 实施记录（eng-coder）

### 5.1 轮次与终态（eng-coder · initial 实施轮）

**轮次** = initial（承 §4 代签派单）。**实施面** = §2.2 / §2.12 / §2.13 / §2.14 / §2.15 并集（冲突处以 §2.14 / §2.15 为准）。
**终态** = **clean**——内部偏差审计 findings 3 逐条报告 / 处置（四类中 部分实现 = 0 · 静默简化 = 0）；内部代码评审（advisor `type=code` 轮 1）VERDICT = **pass**（🔴0 / 🟡3〔评审自陈均非阻断〕/ 🔵3）⇒ **fix round = 0 轮**。

**验证读数（实跑 · 修复态）**：

| 项 | 命令 | 读数 |
|---|---|---|
| 核 | `cd thincoder-core && npm test` | tests 298 · pass 298 · **fail 0** |
| CLI | `cd thincoder-cli && npm test` | tests 628 · pass 628 · **fail 0** |
| VSC | `cd thincoder-vscode && npm test` | tests 591 · pass 591 · **fail 0** |
| 机检 | 仓根 `node scripts/doc-check.mjs` | 锚 758 悬空 · 行宽 4 行（终态复跑；首跑 836 / 3——差异 = 并行线在写面） |
终态复跑（2026-09-18 00:55 · 含并行线在写面实跑）：核 **298 / 298** · CLI **628 / 628** · VSC **591 / 591**——全 fail 0（数值较首跑 297 / 614 / 590 增长 = 并行线在写用例，非本批）。

机检口径注：本批改动面 = 代码 + 测试档（不在 doc 扫描域）⇒ 对锚 / 行宽贡献 **0**；读数本身含并行线在写面（§2.14「848 / 4」· §2.15「851 / 4」同口径），**不认领他档红面**。
**机检复跑（§5 落笔后 · 2026-09-18 00:49 实跑）**：锚 **758** 悬空 · 行宽 **4** 行——**本批写域零新增（逐行实证）**：

- 本批档（`docs/batches/2026-09-17-async-face-fixes.md`）锚命中 **0 处**；§5 全节行宽最大 296 字符（无 >300 行）。
- 行宽 4 行 = `AGENT-PARAMS.md:136`（308——并行线在写）/ `ENG-TOKEN-BINDING.md:147`（360）/ `prompts/persona-engineering.md:137·139`（507·416）——**均非本批写域**。
- 锚数 836 → 758 的变化 = 并行线在改（`scripts/doc-check.mjs` / `ANCHOR-DEBT-REPAIR.md` 族）——**本批不认领**；§6 静置复跑口径照旧。


**先红实证（把源码回退到预修复态实跑 —— 逐条）**：

- 回退 `thincoder-core/agent-tools/advisor-async.mjs` + `subagent-async.mjs` 至 HEAD ⇒ 转红：T-AF1（机读线 0 ≠ 1）· T-AF3（队列残留 1 ≠ 0）· T-AF8（`queueRunnable` 返 true ≠ false）· T-AF9（`⟦ev⟧cancelled` token 流空）· T-AF10（日志 `ev:cancelled` 0 ≠ 1）；同档既有 7 例保持全绿（零回归）。
- 回退 `thincoder-cli/src/tui/subagent-blocks.mjs` + `subagent-freeze.mjs` 至 HEAD ⇒ 转红：T-AF5 · T-AF6 · T-AF13 · T-AF15 + 既有 F-2 queued ⏹ 例（c2 断言面）。
- 回退 / 复原**逐档 sha256 核对**（`advisor-async.mjs` 9925217c… · `subagent-async.mjs` be632b45…；复原后与回退前一致）——无残留改动。
- **未做实跑**：VSC 两例（T-AF11 / T-AF14）——先红性为结构论证（原 advisor 分支零 callbacks ⇒ 零中继消息，等待头悬留；夹具不含该载体字段 ⇒ `history` 侧 undefined），标 **unverified-by-run**（如实登记，不冒充实证）。

### 5.2 改动清单（`file:line` = 实施终态实测 · 行数 = 换行符计数）

| # | 文件 | 动作（file:line） | 行数 |
|---|---|---|---|
| 1 | `advisor-async.mjs`（核） | `cancelAsyncAdvisor` 增形参 `onToken`（`:217`）· queued 分支收尾三面：`pushReal`（`:239-242`）/ `⟦ev⟧cancelled` 经 `onToken` 单点发射（`:244`）/ `logEvent`（`:245`）· `dequeueAdvisor` 载体吸收（`:279`）· `refreshAdvisorQueuedTokens` 载体吸收（`:292`）· `refillAdvisorQueue` 终态守卫（`:319`） | 450 → 467 |
| 2 | `thincoder-core/agent-tools/subagent-async.mjs` | queued 分支补 `logEvent`（`:202`）· `cancelSyncChild` 提交点补 `logEvent`（`:236`）· advisor 落池分支收口（传通道不另发 + 余位刷新，`:259-268`） | 437 → 451 |
| 3 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 新增导出 `entryTerminal`（`:270-272`）· `queueRunnable` 头判（`:283`） | 435 → 446 |
| 4 | `thincoder-core/test/advisor-cancel-faces.test.mjs` | **新档**——T-AF1–AF4 / T-AF8–AF10 宿主（清单外，动因见 5.3） | 0 → 215 |
| 5 | `thincoder-core/test/advisor-pool-queue.test.mjs` | **零改动**（设计表行 3 的宿主改落新档——漂移项见 5.5） | 219（不变） |
| 6 | `thincoder-cli/src/tui/subagent-freeze.mjs` | 新增导出 `tombstoneSubKey`（`:99-106`——键级墓碑，只写键集不写载体行） | 237 → 246 |
| 7 | `thincoder-cli/src/tui/subagent-blocks.mjs` | cancelled 分支**与移除同一守卫**下写键级墓碑（`:188-192`）· import 面（`:33`） | 449 → 453 |
| 8 | `thincoder-cli/src/tui/mouse.mjs` | `emit` 上移（`:202-203`）· 核调用传通道 `cancelAsyncAdvisor(agent, id, emit)`（`:209`）· 共享发射行加 `!isAdvisorBlock` 守卫（`:238`） | 251 → 254 |
| 9 | `thincoder-cli/test/queued-stop.test.mjs` | T-AF5（工具路径回归锁）· T-AF6（c1 两族 + c2）· T-AF13（直调路由）· T-AF15（mouse 路由对位）+ 既有 F-2 例 c2 断言收正 | 182 → 306 |
| 10 | `thincoder-cli/test/sync-cancel.test.mjs` | T-AF12（F-12 日志面） | 177 → 203 |
| 11 | `thincoder-vscode/src/agent.mjs` | `CARRIER_FIELDS` 补 `"_asyncAdvisorQueue"`（`:42`）+ 字段集注释「十一字段」收正（`:35-39` / `:130-131`） | 477 → 478 |
| 12 | `thincoder-vscode/src/extension/panel-messages.mjs` | 删 advisor 专用分支（原 `:216-223`）· W13 注释收正（advisor 并入共用路径，`:216-225`） | 479 → 476 |
| 13 | `thincoder-vscode/test/chat-panel-messages.test.mjs` | T-AF11（⑭ 例）· 档头 `test(` 计数行收正（19 = 10 + 9） | 421 → 458 |
| 14 | `thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs` | 夹具 `CARRIER_FIELDS` 补款（`:46`）· T-AF14（载体绑定） | 241 → 255 |
| 15 | `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs` | 夹具同步（`:88-95`——`_asyncAdvisorQueue` 建位 + 访问器别名） | 253 → 254 |

**档位**：全部 ≤ 500 硬帽（最大 = `thincoder-vscode/src/agent.mjs` 478）；`>300` 面在册 / 存量债登记口径承 §2.14「>300 存量档审视结论」——**本批新增 >300 档 1 个**（`advisor-cancel-faces.test.mjs` 215 < 300，**不涉**；`queued-stop.test.mjs` 306 属测试档无硬限裁例）。

### 5.3 决策透明表（实施轮裁定与理由）

| # | 项 | 实施选定 | 理由 / 证据 |
|---|---|---|---|
| 1 | 发射单源化（评审轮 1 #1） | 唯一发射点 = 核 `cancelAsyncAdvisor` queued 分支；三路（工具路径 / CLI mouse / VSC）各传本层通道、**均不另发**；mouse 共享行加 `!isAdvisorBlock` 守卫（子代理族自持发射零改） | 守卫形防误删共享行（该族两路互斥、各发一次）；核内发射 `try/catch` 兜底 relay 失败不改池状态 |
| 2 | c1 终态守卫 | 单点谓词 `entryTerminal` + 两消费点；**只跳过、不剔除、不重编号** | 承设计 F-10 边界（守卫零副作用）；`refillAdvisorQueue` 跳过 ⇒ 「取消后仍被 settle」燃料族无关封死 |
| 3 | c2 键级墓碑 | 新增 helper `tombstoneSubKey`（落 freeze 模块 = 墓碑写点同址）；**与移除同一守卫**（命中移除才写） | 承 D-AF7 / D-AF8；只写 `_frozenSubKeys`、不写载体行（不伪造块）；存活闸（`livePoolHas`）复活路径不受影响 |
| 4 | 载体吸收面 | `dequeueAdvisor`（表列）+ `refreshAdvisorQueuedTokens`（**实施轮新吸收**）；`refillAdvisorQueue` **未吸收** | 新吸收动因 = F-11 后 VSC ⏹ 带出**部分-parent 调用点**（合成 parent 只携池 + `history`，`:264` 调刷新面）⇒ 依 §2.2 逃逸条款「发现即同式吸收并回报」；<br>refill 调用点恒完整 parent（审计 + 代码评审双复核确认）——差异项见 5.5 ③ |
| 5 | 测试宿主改落新档 | T-AF1–AF4 / T-AF8–AF10 落**新档** `advisor-cancel-faces.test.mjs`（原档 `advisor-pool-queue.test.mjs` 零改动） | 核 `core-hygiene.test.mjs` 对 `test/**` 同样生效（`>300` 且未登记 ⇒ 红；注册表 `:25-34` 无测试档条目）——用例实测体量 +152 行 ⇒ 原档 371 > 300 **必红**；拆出后原档 219 / 新档 215 双绿。设计 Δ 估（+40..55）未含实际断言体量 |
| 6 | 注释随行收正（3 处） | ① `thincoder-vscode/src/agent.mjs` 字段集注释「十字段」→「十一字段」（含新增款说明）② 同档绑定不变式注释同收正 ③ `chat-panel-messages.test.mjs` 档头计数行「17 = 8 + 9」→「19 = 10 + 9」 | 代码 / 清单语义变更后注释须与实况一致（②③ 系**在案漂移**：原计数在案即与实际例数不符，本批按实况收正） |

**清单外改动（逐项 · 已报告 ⇒ 透明可接受）**：

1. **新档** `thincoder-core/test/advisor-cancel-faces.test.mjs`（+215 行）——动因见上表 #5。
2. `refreshAdvisorQueuedTokens` 载体吸收（1 行级）——动因见上表 #4（§2.2 逃逸条款明示「同式吸收并回报」）。
3. 上表 #6 三处注释收正（零行为）。
4. **未改**（与设计表差异，如实登记）：`advisor-pool-queue.test.mjs` 0 改动；`panel-callbacks.mjs` 0 改动（表列 0 ✓）。

### 5.4 验收 / 用例逐条读数（AC-AF1–11 · T-AF1–15）

| 判据 | 宿主（实施终态） | 读数 |
|---|---|---|
| AC-AF1 / T-AF1·AF2·AF4 | `advisor-cancel-faces.test.mjs`（T-AF1 `:69` · T-AF2 `:91` · T-AF4 `:104`） | 机读线恰 +1（逐字同 running 面模板）· 重复取消零重复注入 / 零 token · 余位 `1..n` 严格递增 ✅ |
| AC-AF2 | T-AF13（`queued-stop.test.mjs:265`）+ T-AF15（`:288`） | `⟦ev⟧cancelled` 恰 1 条（前缀 `advisor#<id>/`）· 零 `⟦ev⟧stopped` · `subTasks` 无该 key · 键级墓碑在位 ✅ |
| AC-AF3 / T-AF3 | `advisor-cancel-faces.test.mjs:117` | 部分 parent ⇒ 队列零残留 · 出池 · cancelled 墓碑（经载体吸收落 `history`）· 其后 refill 该条目 `start()` 零调用 ✅ |
| AC-AF4 / T-AF14 | `scenario-03-subagent-lifecycle.test.mjs:245` + 两夹具同步 | 写侧落 `history` 同容器 · 二次访问不重建 ✅ |
| AC-AF5 / T-AF5 | `queued-stop.test.mjs:219` | token 流仅 `⟦ev⟧cancelled` · 块移除 · `state.lines` 零增 · `_frozenSubKeys` 含该 key ✅ |
| AC-AF6 / T-AF6·AF8 | `queued-stop.test.mjs:238` · `advisor-cancel-faces.test.mjs:149` | 两族补位零启动（`cancelled:true` / `done:true` / 双真三形全 false）· 补发 `⟦ev⟧stopped` 零块零行 ✅ |
| AC-AF7 | 三包 `npm test` + doc-check | 见 5.1 读数 ✅ |
| AC-AF8 / T-AF9 | `advisor-cancel-faces.test.mjs:166` | 工具路径恰 1 条 + 余位刷新 token · 重复取消零新增 ✅ |
| AC-AF9 / T-AF10 | `advisor-cancel-faces.test.mjs:183` | 三写点（评审 queued / 子代理 queued / running 经 settle）各恰 1 条 · error 分支零记录 ✅ |
| AC-AF10 / T-AF11 | `chat-panel-messages.test.mjs:439` | webview 收恰 1 条 `cancelled(was:"queued")` · 队列零残留 · 零裸文本泄漏 · 机读线恰 1 ✅ |
| AC-AF11 / T-AF12 | `sync-cancel.test.mjs:169` | 日志档 `ev:cancelled` 恰 1（`id:"coder#1"`）· error 两分支零新增 ✅ |
| T-AF7（零改面） | 既有档（`advisor-pool-queue.test.mjs` / `queued-stop.test.mjs` 既有例） | 错误文案逐字不变 ✅ |

### 5.5 审计与代码评审（轮次与终态）+ 开口项

**① 内部偏差审计（explore · 轮 1 · 只读）** = `AUDIT VERDICT: findings(3)`——四类逐类：**部分实现 = 无 · 静默简化 = 无**；DOC-DRIFT = D-2 · OUT-OF-LIST = D-1 / D-3。

| # | 级 | 发现 | 处置（本轮） |
|---|---|---|---|
| D-1 | 🟡 | 新档 `advisor-cancel-faces.test.mjs` 不在受影响文件表（表行 3 指向 `advisor-pool-queue.test.mjs`，实测零改动） | **已报告**（5.2 #4 / 5.3 #5）；表行收正 = 设计者 / 父侧域（本报告 5.5 ③ 同列） |
| D-2 | 🟡 | 批档 §5 实施记录为空 + 受影响表行 3 未收正 | §5 = **本段已写**（实施记录落地）；表行收正归设计者 / 父侧（eng-coder 不编辑设计文档） |
| D-3 | 🔵 | `.thincoder/tmp/` 探针 / 备份残留（3 脚本 + 回退副本 + 2 备份 + 7 日志） | **已逐项清理**（清理后该目录仅余他批历史残留——非本批写域） |

**② 内部代码评审（advisor `type=code` · 轮 1 · 同步）** = `VERDICT: pass`——🔴0 · 🟡3（评审自陈均非阻断）· 🔵3。

- 🟡 = ① T-AF2 用例表子句「同一确认」未达（queued 出池后重复取消返回既有 unknown-id error；AC-AF1 的「不重复注入」满足，且与既有 ED-4 判据 4 锁定行为一致）
  ② §6.10 ④「三读面载体吸收」声明 vs `refillAdvisorQueue` 直读（今日调用点恒完整 parent ⇒ 零缺陷）
  ③ 测试宿主清单漂移（= D-1 同源）。
- 🔵 = 陈旧注释（`panel-messages.mjs` 的 `cancelAdvisorReview` 名）· `queued-stop.test.mjs` 越 300 软线（测试档无硬限裁例在案——R3 不复议）· §2.15 ② 坐标措辞（「`:192` 分支闭合」实为墓碑写点，闭合在 `:196`）。
⇒ **无 must-fix 项** ⇒ **fix round = 0 轮**；三项 🟡 全数为报告项，落本报告与父侧收口。

**③ 交父侧收口的三项（本实施轮不做 —— 归属设计文档 / 父侧域）**：

1. 受影响文件表行 3（`advisor-pool-queue.test.mjs`）与实际宿主（新档）不一致——请收正表行或补落新档行（§5 已记录实况）。
2. §6.10 ④「出队 / 补位 / 排队刷新三读面经载体吸收」与实现（`refillAdvisorQueue` 直读）不一致——父侧择一：实现轮同式吸收（1 行）或在设计档收正该句（本批按 §2.14 权威清单「该面零改」执行，未擅自扩面）。
3. T-AF2 用例表子句「幂等：同一确认」与 queued 面实况（出池 ⇒ 既有 error）不一致——父侧择一：收正措辞（「同一确认」限定 running 面）或核 queued 分支补终态确认面。

**④ 表值微差（如实登记 · 非判据）**：`subagent-async.mjs` 451（表 ≤450）· `subagent-scheduler.mjs` 446（≤444）· `subagent-freeze.mjs` 246（≤244）· `mouse.mjs` 254（≤253）· `queued-stop.test.mjs` 306（≤302）· `sync-cancel.test.mjs` 203（≤202）· `chat-panel-messages.test.mjs` 458（≤449）——均远低于 500 硬帽，仅设计表行数估值精度问题。

### 5.6 fix 轮（eng-coder · 2026-09-18 · 承 §4 三项开口项裁定）

**轮次** = fix（同 designId + designToken——父侧派单）。**范围** = 三项开口项：① `refillAdvisorQueue` 载体吸收 ② T-AF2 终态确认面 ③ T-AF11 / T-AF14 先红实跑。
**方法** = 先实读（调用点 / 语义面）→ 改代码 → 用例 → 实跑；③ 用「回退 → 实跑转红 → 复原 → sha256 核对」。
**本轮不做** = 新功能 / 面外重构 · 需求档 · 冻结批档 / `_archive/**` / 参照树 · 其他批在途面（`thincoder-cli/src/cli/**` · `bin/` · `scripts/**`）· 已裁定机制（单源化 / c1 / c2 / F-3② / F-6 / F-11 / F-12 / T-AF13 / T-AF15 零改）。

**①–③ 逐项落位（file:line = 本轮终态实读）**：

| 项 | 落位 | 读数 |
|---|---|---|
| ① | `advisor-async.mjs:317-321`：`refillAdvisorQueue` 队列读改 `carrierField(parent, "_asyncAdvisorQueue")`（+ 注释） | 三读面全齐（出队 `:287` / 刷新 `:300` / 补位 `:320`）——与 `AGENT-LOOP-SUBAGENT.md:190-191`（§6.10 ④）逐字对齐；完整-parent 行为零变（`carrierField` 先取自有字段） |
| ① 用例 | `advisor-cancel-faces.test.mjs:164-182` 新增 **T-AF3′**——部分 parent（无自有队列字段）+ 载体队列 ⇒ 补位启动 + 启动即出队 | 先红实跑：临时改回直读 ⇒ 本例如期红（`starts` = `[]` ≠ `[ack.id]`），同档其余 7 例全绿 |
| ② | `advisor-async.mjs:222-231`：池内无条目先读墓碑——`cancelled` + `role:"advisor"` ⇒ 返回同一确认 `{id, status:"cancelled"}`（全早退——零重复注入 / 发射 / 日志）；非取消墓碑 / 无墓碑 ⇒ 既有 unknown-id 文案不变 | **统一口径（最小方案 · 明文）**：在册 `done` ⇒ 既有「already finished」error（`:232-233`，零改）· cancelled 墓碑在册（出池）⇒ 同一确认 · 未知 ⇒ 既有 error。`was` 不回传（墓碑形状 `{status, role}` 单源不改） |
| ② 工具路径 | `subagent-async.mjs:262-264`：落池判定放宽（+ cancelled 墓碑子句，role 守卫）——`executeCancelAction` 重复取消同幂等；`:268-271` 余位刷新守卫不变 | 子代理族墓碑不在此列（`role` 守卫）⇒ 子代理重复取消文案零改（`scenario-03:145-147` 例仍绿） |
| ② 用例 | `advisor-cancel-faces.test.mjs:91-119` T-AF2 重建（同一确认 + 零重复注入/发射/**日志**——`THINCODER_LOG_DIR` 隔离读档）· `:215-216` T-AF9 重复取消改判同一确认 + 零新增 token · `advisor-pool-queue.test.mjs:177-178` 既有 r3 断言收正（error → 同一确认） | 三处全绿；T-AF2 日志断言语义 = 该 id `ev:cancelled` 恰 1 条 |
| ③ | 先红实跑三条（见下「先红实证」）——两 VSC 档**逐档 sha256 核对复原** | 见读数 |

**先红实证（回退 → 实跑转红 → 复原 · 逐条）**：

- **T-AF11**（VSC ⏹ advisor 目标并入共用路径 · F-11）：`git checkout HEAD -- thincoder-vscode/src/extension/panel-messages.mjs`（回退到 pre-fix 的 advisor 专用分支形）⇒ `node --test test/chat-panel-messages.test.mjs`：**⑭ 红**——`posted.filter(m => m.type === "subagent")` = `[]`（预期恰 1 条 `cancelled(was:'queued')`——等待头悬留），同档其余 9 例全绿；复原后 **10/10 绿**。
- **T-AF14**（载体绑定 · AC-AF4 宿主）：临时回退夹具面（`scenario-03-subagent-lifecycle.test.mjs:46` CARRIER_FIELDS 去 `_asyncAdvisorQueue`）⇒ `node --test test/integration/scenario-03-subagent-lifecycle.test.mjs`：**T-AF14 红**（`:250` 写侧落 per-run agent 自有属性、非 `history` 容器），同档其余 5 例全绿；复原后 **6/6 绿**。
- **T-AF3′**（项①附带）：临时改回直读 ⇒ 红（见上表）；复原后 **8/8 绿**。
- **sha256 核对（复原态 = 回退前）**：`panel-messages.mjs` `25110de7ac40becb…` · `scenario-03-subagent-lifecycle.test.mjs` `6cdbafbd0a87d85d…` · `advisor-async.mjs` `8a020ecea8219e32…`——逐一 match ✓（临时备份落 `.thincoder/tmp/`，用完即删）。

**改动清单（本轮 · file:line = 终态实读 · 行数 = 换行符计数）**：

| # | 文件 | 动作（file:line） | 行数 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor-async.mjs` | 项① `:317-321` 载体吸收 · 项② `:222-231` 墓碑终态确认面（头注 `:217-218`） | 467 → 477 |
| 2 | `thincoder-core/agent-tools/subagent-async.mjs` | 项② `:262-264` 落池判定放宽（role 守卫） | 451 → 456 |
| 3 | `thincoder-core/test/advisor-cancel-faces.test.mjs` | T-AF2 重建（`:91-119`）· T-AF9 收正（`:215-216`）· **新增 T-AF3′**（`:164-182`）· 档头覆盖面句收正 | 215 → 253 |
| 4 | `thincoder-core/test/advisor-pool-queue.test.mjs` | 既有判据 4 的 r3 断言收正（`:177-178`——error → 同一确认；**清单外**，动因 = 项②行为变更联带） | 219（Δ=0 · 语义 1 处） |

**清单外改动（逐项 · 已报告 ⇒ 透明可接受）**：① 第 4 行（ED-4 测试断言退役——项②的必然联带，不更新则该档红）；② 新增 T-AF3′（项①的可红锁——宿主同为 af 批用例档，非新档）。
**两 VSC 档**为临时回退 exercise，**净零变更**（sha256 已核）。

**验证读数（实跑 · 修复 + 复原终态）**：

| 项 | 命令 | 读数 |
|---|---|---|
| 核 | `cd thincoder-core && npm test` | tests **299** · pass **299** · fail **0**（+1 = T-AF3′） |
| CLI | `cd thincoder-cli && npm test` | tests **628** · pass **628** · fail **0** |
| VSC | `cd thincoder-vscode && npm test` | tests **591** · pass **591** · fail **0** |
| 机检 | 仓根 `node scripts/doc-check.mjs` | 锚 悬空 **627** · 行宽 **2**（`prompts/persona-engineering.md:137`〔507〕/`:139`〔416〕）——**本批写域零新增**（本轮改动 = 代码 + 测试档，不在 doc 扫描域；读数面为并行线在写态，不认领他档红面） |

**审计与代码评审（轮次与终态）**：

- **① 内部偏差审计（explore · 轮 1 · 只读）** = `findings(1)`——代码交付面 **clean**（部分实现 0 · 静默简化 0 · 清单外 0）；1 × 🔵 = 设计档 §6.11 `:220`「未命中两池 / 已完成 → 既有错误文案」未含 cancelled 墓碑除外子句（措辞口径项——设计档 / 父侧域，本轮未编辑）。
- **② 内部代码评审（advisor `type=code` · 轮 1 · 同步）** = `VERDICT: pass`——🔴 0 · 🟡 3（评审自陈非阻断）· 🔵 4 ⇒ **fix round = 0 轮**。

**交父侧收口（本轮不做的开口项——逐条）**：

1. 🟡 **确认面外延**（`advisor-async.mjs:229`）：墓碑读取无面别（形状 `{status, role}`）⇒「曾 running 取消、已 settle 出池」的 id 重复取消亦答 `cancelled`（原 unknown-id error）。父侧择一：接受并登记（§6.11:230 写明确认面含 running 面）或收窄（需给墓碑加面别字段——破单源形状，成本更高）。副作用面零（早退在写点前）已核。
2. 🟡 **AC-AF4 首句「`CARRIER_FIELDS` 含该键」无对位宿主**：生产表（VSC `src/agent.mjs:40-44`）未导出、无测试 import；T-AF14 经**夹具副本**绑定 ⇒ 生产表删款时三端仍全绿（#21 静默回归——F-8 的反向面）。建议补「夹具副本 == 生产表」一行锁（需导出该常量）；不补则请在 §6 登记该残留面。
3. 🟡 **档位读数收正**：`advisor-async.mjs` 终态 **477**（设计表 ≤467——硬帽余量 23 行）· `subagent-async.mjs` **456**；两档 >300 但在册（`core-hygiene.test.mjs:27-28`）——仅登记（R3 不复议）。
4. 🔵 **跨 run 墓碑无区隔**（`advisor-async.mjs:228`）：`_asyncTombstones` 跨 run 存活而取号计数器不在载体集（VSC）⇒ 旧 run 的 cancelled 号在本 run 两池皆空时可被重新取到 ⇒ 陈旧 ⏹/cancel 答 `cancelled`（低影响、零状态变更）。
5. 🔵 **记录面收正（本段已落）**：§5.2 #5「`advisor-pool-queue.test.mjs` 零改动」⇒ 本轮 r3 断言收正；§5.1 读数 298 → **299**；§5.2 #4 行数 215 → **253**。
6. 🔵 **设计档措辞**（`AGENT-LOOP-SUBAGENT.md:230`）：「同一确认」未定形状（首发含 `was` / 重复无 `was`）——建议补一句确认形状（设计档 / 父侧域）。

### 5.7 fix 轮 2（微）（eng-coder · 2026-09-18）——AC-AF4 首句对位宿主（F-8 反向面锁）

**轮次** = fix（同 designId + designToken——承 §1.3 派单 / §5.6 开口项 2〔`:680`〕）。**范围** = ① AC-AF4 首句「`CARRIER_FIELDS` 含该键」的对位宿主 ②「夹具副本 == 生产表」锁（F-8 反向面：生产表删款三端仍全绿的静默回归）。**方法** = 实读定位 → 锁形态择定 → 落笔 → 三条先红实跑（回退 → 转红 → 复原 → sha256）→ 三端 + 机检。
**锁形态裁定** = **导出 + import**（弃「源读断言」形）——理由：结构式比较无文本解析脆面；VSC 测试 import `src/agent.mjs` 有在案先例（`scenario-01:20` / `turn-across-segments.mjs:25`）；导出 = 零副作用（唯一消费点仍 `src/agent.mjs:145` 绑定循环）。
**本轮不做** = 生产行为变更（除零副作用导出）· 其他面 · 需求档 · 冻结批档 / `_archive/**` / 参照树 · 其他批在途面。

**落位（`file:line` = 终态实读 · 行数 = `wc -l` 口径）**：

| # | 文件 | 动作（file:line） | 行数 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/agent.mjs` | `:40` `export const CARRIER_FIELDS = [`（导出——零副作用）· `:39` 注释补导出说明 · `:35` / `:130-131` 注释补「设计十一款 + 端自持 `_engDesignTokens` = 本表十二绑定」加式（消 11 vs 12 读误） | 478（三处均**原地**改——行位移零） |
| 2 | `thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs` | `:30` import `CARRIER_FIELDS as PROD_CARRIER_FIELDS` · `:48` 夹具副本扩至 12 款（补 `_asyncWaiters` / `_advisorRuns` / `_mutLog`——与生产表逐款同序）· `:259-266` **T-AF16 新增**（AC-AF4 首句宿主：生产表含键 + 夹具副本 == 生产表） | 255 → 266 |
| 3 | `thincoder-vscode/test/integration/vsc-panel-rings.test.mjs` | `:28` import · `:33-35` `BOUND_CARRIER_FIELDS` 抽出（`:95` 绑定循环改指）· `:261-268` **T-AF17 新增**（夹具含键 + 逐款 ⊆ 生产表） | 254 → 268 |

**先红实证（回退 → 实跑转红 → 复原 → sha256 核对）**：

- **A 生产表删款**（`src/agent.mjs:42` 临时去 `"_asyncAdvisorQueue"`）⇒ 两档 `node --test`：**T-AF16 + T-AF17 双红（fail 2）**，**T-AF14 保持绿**——原「生产表删款三端仍全绿」缺口当场复现（锁靶心）；复原 sha256 match。
- **B 夹具副本删款**（`scenario-03:48` 临时去该键）⇒ **T-AF14 + T-AF16 红**；复原 match。
- **C rings 夹具删款**（`vsc-panel-rings:35` 临时去该键）⇒ **T-AF17 红**；复原 match。
- **终稿复跑 A**（同式）⇒ 双红（fail 2）→ 复原 match。三文件终态 sha256：`agent.mjs 2d4114ed743cb806` · `scenario-03 64bc38d04471dd8d` · `vsc-panel-rings cdf6eacea22a98e2`。

**验证读数（实跑 · 终稿）**：

| 项 | 命令 | 读数 |
|---|---|---|
| 核 | `cd thincoder-core && npm test` | tests 299 · pass 299 · fail 0 |
| CLI | `cd thincoder-cli && npm test` | tests 628 · pass 628 · fail 0 |
| VSC | `cd thincoder-vscode && npm test` | tests **593** · pass 593 · fail 0（= 基线 591 + T-AF16/T-AF17） |
| 机检 | 仓根 `node scripts/doc-check.mjs` | 锚 **627** 悬空 · 行宽 **2**（= §5.6 早存基线；本批改动 = 代码 + 测试档，不在 doc 扫描域） |

**决策透明表（本轮）**：

| # | 项 | 选定 | 理由 |
|---|---|---|---|
| 1 | 锁形态 | 导出 + import（弃源读断言） | 无文本解析脆面；VSC 测试 import `src/agent.mjs` 先例在案；导出零副作用 |
| 2 | 夹具副本面 | scenario-03 = **全等**（12 款，deepEqual 双向）· rings = **子集 + 含键** | 前者为 AC-AF4 宿主夹具（声称「与生产同形」——全等才名副其实）；rings 为最小子集夹具（子集语义明示、含键删款即红） |
| 3 | 行位移归零 | 导出说明与加式全部**原地**改（不新增行） | 保 §2.14 / §5.6 的 as-of 坐标（`:40-44` 表 / 绑定块）不因本轮漂移 |
| 4 | 夹具扩 3 款的行为面 | 直接扩（先跑后证） | 三款在 scenario-03 断言面惰性（档内零引用）；593/593 实跑背书 + 评审复核同判 |

**清单外改动（逐项 · 已报告 ⇒ 透明可接受）**：① `src/agent.mjs` 导出（需求本体——经父侧裁定许可；零副作用）；② `:35` / `:130-131` 注释加式（🔵 评审项就地收正——零行为、零行位移）；③ T-AF16 / T-AF17 新用例（AC-AF4 首句 + 「两测试夹具同步」的对位宿主——设计用例表 T-AF1–15 未含，须由设计面补登，见下）。

**审计与代码评审（轮次与终态）**：

- **内部偏差审计（explore · 轮 1 · 只读）** = findings 1——代码面 **clean**（部分实现 0 · 静默简化 0 · 清单外 0）；1 × 🟡 DOC-DRIFT（批档未登记本轮 + 行数/指针漂移 ⇒ **本段即登记**）；附 🔵 = rings 档头 `:13-14`「零手写字段」措辞与同档自陈手写绑定相抵（`git log -S` 归属 = 既有行 `752fe592`，非本轮引入 ⇒ 交父侧）。
- **内部代码评审（advisor `type=code` · 轮 1 · 同步）** = `VERDICT: pass`——🔴 0 · 🟡 2（均非阻断：批档登记 = 本段；`agent.mjs` 478 行 >300 存量债已在册〔R3 不复议〕）· 🔵 2（Δ/行数记录漂移 = 随本段收正；「十一字段 vs 12 款」口径 = 已就地补加式）⇒ **fix round = 0 轮**（审后仅注释就地收正 1 处）。

**交父侧收口（本轮不做的开口项——逐条）**：

1. 批档行数/Δ 收正：§5.2 #14（`:561`）241 → 255 ⇒ 实况 **266**；#15（`:562`）253 → 254 ⇒ 实况 **268**；§2.14 行 9（`:414`）Δ +11..17 ⇒ ≤258 失效。
2. 设计 / 用例面补登：**T-AF16 / T-AF17**（本批新用例号）入用例表 + AC-AF4 宿主列（`:375` 现仅 T-AF14）；`vsc-panel-rings:89` 指针 ⇒ `:33-35` / `:95`。
3. rings 档头 `:13-14`「零手写字段」措辞（既有行）——收正或登记，父侧裁。
4. 设计档可选项：`AGENT-LOOP.md` §6.18 面记一句「VSC 载体表导出供对位锁」（公共面新增但零行为）——由设计者裁。

## §6 验证与收口（父代理）

### 6.1 父侧实施核验（2026-09-18 01:33——实读 + 实跑，非转录）

- **实跑**（父侧复跑）：核 `advisor-cancel-faces` + `advisor-pool-queue` **15/15** · CLI `queued-stop` + `sync-cancel` **12/12** · VSC `scenario-03` + `vsc-panel-rings` **13/13**；全量（coder 轮）：**299 / 628 / 593**（fail 0）。
- **实读**：`advisor-async.mjs:217` 三形参 · `:223-231` 墓碑确认面（role 守卫）· `:239-245` 机读线 + 发射 + 日志 · `:317-321` refill 载体吸收 ✓；`vscode/src/agent.mjs:40-44` CARRIER_FIELDS 导出（12 款含 `_asyncAdvisorQueue`）✓；`AGENT-LOOP-SUBAGENT.md:231-237` 确认面三处 ✓。
- 三侧删款实证（生产表 / 夹具 / rings）✓ + 逐档 sha256 复原核对 ✓。

### 6.2 交付面收正（父侧直记——表格补齐 / 计数 / 指针，可 revert）

- **T-AF16 / T-AF17 补登**：AC-AF4 宿主 = **T-AF14 + T-AF16**（生产表对位锁）· T-AF17（rings 子集锁）；§2.14 行 9 Δ 以 §5.7 实况为准（**266**）· 行 15 = **268**；`vsc-panel-rings:89` 指针 ⇒ `:33-35` / `:95`。
- 载体表导出 = fix 轮 2 新增（测试权威面）；`AGENT-LOOP.md` §6.18 面记一句 → 设计者下次触碰时补（在册）。
- rings 档头 `:13-14`「零手写字段」措辞（既有行，`752fe592` 归属）→ **登记不修**（R3 不复议）。

### 6.3 收口

- 交付提交 = **126c3abe**（17 档；+1031 / −43）；台账 **#20 / #21 / #31** → 已核销 ✓；凭证槽 consume ✓。
