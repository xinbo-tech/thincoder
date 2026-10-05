# 2026-10-05 · 消化账务（报告不许无声消失）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 01:40「这个问题真应该处理一下。」＋ 01:44「可以」（认界）——主目标 = 消化报告账务缝（递出即销账 + 零回检）；同族 = #929（结束信号缺席被静默当正常）∥ 空停（可行性待裁）；边界（不做）= 半句 `stop` 信号层 ∥ 模型层。事故档 = 台账 #926。
> 台账 = #930（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（需求档 §4.15 已落（F-DA1–F-DA6）· 设计舱待点火）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批缘由（用户原话 = 唯一标尺）**

- 用户 2026-10-05 01:40：「这个问题真应该处理一下。」
- 用户 2026-10-05 01:44：「可以」（认界——处理方向过）

**事故事实（#926 事故档 · 对表合成）**：qwen3.7-flash 半途停笔 → 挂起状态机按「回合返回 + 池非空 + 无 pendingInput」误判空闲（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:51/:53/:59`）→ 报告投递（起跑窗「一次注入全部 pending」`:59`）**同刻即入已消费账**（`:77`「冻结 ∥ 归档恒落**投递时点**」）→ 唯一消化窗口答偏（零处理、`tools:0`）→ 轮末零回检、无重投 ⇒ **「没消化」被记成「消化过了」，无人知晓**。

**定性链（终版）**：假空闲触发（半途停笔撕缝）→ 首窗口即偏、无第二窗口 → **递出即销账 + 零回检**。

**关键判据（本批标尺）**：**凡「该处理而没处理、该完成而没完成」的系统，不许静默**——要么自身回检，要么摆到可见面。**归档 ≠ 销账**：归档保持起跑窗提前（#738 用户口径不动）；**销账 = 控制面，后移到「见账」**。

**处理方向（三件式——需求正文 = `docs/core/requirements/AGENT-LOOP.md` §4.15）**：① 保底 = 未清算可见化；② 核心 = 账务回路（销账后移 + 未见账自动重投）；③ 防死循环 = 重投上限与显式升级。同族 = 结束信号缺席（#929 · F-DA5）∥ 空停（F-DA6 · 可行性由设计裁）。

**边界（不做）**：非空半句 `stop` 检测（信号层不可分辨——已知边界）∥ 模型层（无抓手）。两条写进设计档，不做。

**授权口径**：01:44「可以」= 处理方向认界 + 全链（需求 → 设计 → 评审 → 批准 → 实施）；沿用本夜批系沿例。

**本批条目（覆盖）**：主件 = 消化报告账务缝（F-DA1–F-DA4）；同族件 = #929（F-DA5）+ 空停（F-DA6）；证据档 = #926；需求档 = `docs/core/requirements/AGENT-LOOP.md` §4.15（已落）。

**台账**：#930（core · 归批）。

**父侧裁定（内容权威——2026-10-05 02:0x · 设计轮核验后、评审点火前）**：

1. **三条逐字文本 = 定稿**（零改）：账目要求行（`DIGEST_ACCOUNT_DOMAIN`）∥ 升级提醒（`pushReal`）∥ F-DA5 缺席提醒——逐字 = §2 草稿位（`:62-64`）。
2. **重投上限 N = 2 确认**（`DA_RETRY_LIMIT = 2`——总投递 ≤3；KD-DA4 维持）。
3. **行为增量接受**（KD-DA9 必要配套）：① anthropic `max_tokens` / google `MAX_TOKENS` 截断首次获可见提醒；② `llm:done.finish` 对三 transport 由 null ⇒ 归一值——已登记（§6.31.7 行为增量登记）。
4. **上抛 2 / 4 由父侧执行**：需求档 §4.15 尾改指 = **已落**（`docs/core/requirements/AGENT-LOOP.md:300`）；VSC `WEBVIEW-PROTOCOL.md` §3.2 增字段行 + 桌面 `PROJECT.md` §4.2 行数账 = 实施批随落。
5. 设计核验结论：F-DA1–F-DA6 逐条覆盖（含机械检面）∥ 归档时点 / 用户输入优先 / maxTurns / 注入格式零改声明在位 ∥ fallback 逐字沿用 ∥ 零新 `⟦ev⟧` ∥ 端点判据同源（端差 = 显示载体已登记）。核验通过，进入评审。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-05 · 设计单源 = AGENT-LOOP-ASYNC-POOL.md §6.31；评审轮次 1 修正已落（13 条 · §2 修正块逐号）；实施中裁定已落（#41 披露① · §2 微块）；实施后同步轮已落（#44 ∥ #45 ∥ #47 收正 + as-built 回填 · §2 同步块）；实施后终收笔已落（载体族读数 / 状态词收正 · §2 终收笔块）；尾三行数账回填已落（§6.31.9 收正 1 + 补 2 · §2 尾三行块）；>300 审视块全扫补列已落（越线缺行 ×2 补行 · §2 越线补列块）；doc-check exit 0（悬空 0 / 行宽 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖——三方一致：需求 §4.15 F-DA1–F-DA6 / 本表 / 设计档 §6.31 验收 A-DA1–A-DA8）**

| # | 条目（需求 §4.15） | 设计落点（判据与决策单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31） |
|---|---|---|
| F-DA1 | 清算后移（投递后保持未清算；见账才销；未见账 ⇒ 驻 pending ⇒ 经合并消化轮回路自动续开重投） | §6.31.2 三角色（投递 ≠ 销账）+ §6.31.4 投递面两态门控（首投任意回合 ∥ 重投仅消化轮）+ §6.31.5 见账面（覆盖才离容器）；**归档时点零改**（起跑窗）→ A-DA1 |
| F-DA2 | 逐条报账判据（账目覆盖全部投递条目；零工具轮机械可检） | §6.31.3 账目合同：`[digest-ack #<id>] digested|deferred`——行含标记 + id 词界即覆盖（纯文本判据，禁工具代理）→ A-DA2 |
| F-DA3 | 上限与升级（同条重投 ≤N；超限 ⇒ 停止自动重投 + 显式「未处理」） | §6.31.5 `DA_RETRY_LIMIT = 2`（总投递 ≤3）+ 升级 = 离容器入 `_unsettledDigests` + 恰一条提醒 + 恰一条 `ev:unsettled` → A-DA3 |
| F-DA4 | 未清算可见化（会话 / 面板可见；父侧可读可接手） | §6.31.6：`subagent status` 增 `unsettled` 段（三态 + 单查同解析）+ 三端残余行（核键 `digest.residue`；CLI 痕行 ∥ 桌面 / VSC 行元素）+ 升级提醒（pushReal 三端同源）→ A-DA4 |
| F-DA5 | 结束信号缺席显式化（#929） | §6.31.7：四 transport 归一（anthropic / google / responses 补报；sse 照旧）+ 缺席支（同面提醒 + `ev:finish-missing`）；既有 length / insufficient 处理零变 → A-DA5 |
| F-DA6 | 空停显式化 | §6.31.8：空判加宽为**空白判**——既有重试（≤2）/ 抛错骨架零改；非空半句 `stop` = 登记边界不做 → A-DA6 |
| N1–N4 | 零回归 / 可机判 / 三端同源 / 不烧预算 | A-DA7（全覆盖轮零提醒零事件；归档 ∥ 用户输入优先 ∥ maxTurns ∥ 注入格式 / 预算逐条零改）· A-DA8（批内件全绿 + doc-check）· §6.31.6 端差登记（显示载体按端）· §6.31.5 成本闸（幂等 + 上限） |

**机制设计**：细则全部住设计档 §6.31.1–§6.31.13（单源——本段不复载）：投递账 / 见账 / 销账三角色 ∥ 账目合同 ∥ `beginRun` 投递两态（会话标记 `_daSession`；fallback 逐字沿用）∥ `finalizeAgentTurn` 见账（落痕取件 `_lastRunOutput` 载体吸收读）∥ 上限与升级 ∥ 三端可见面 ∥ F-DA5 transport 归一 ∥ F-DA6 空白判。

**受影响面（摘要——全表 = §6.31.9）**：核 14 档（含新档 `thincoder-core/agent/digest-account.mjs`（拟新增））；CLI 2 档；桌面 3 档；VSC 3 档；文档 6 档（本档 §6.31 + §6.8 指针 ∥ `docs/cli/design/TUI.md` §6.9 ∥ `docs/core/design/AGENT-LOOP.md` §2.3（载体 13 ⇒ 14 款）∥ `docs/core/design/LOGGING.md`（两事件行）∥ 桌面 `RENDERER.md` §1.1 + `IPC.md` §1 ∥ VSC `WEBVIEW.md` §5.1 + `WEBVIEW-PROTOCOL.md` §5/§6.3）。

**验收对照**：A-DA1–A-DA8（§6.31.11）逐条回指 F-DA1–F-DA6 / N1–N4；用例 T-DA1–T-DA14（§6.31.10——宿主 = 批内件 `docs/batches/2026-10-05-digest-accounting.test.mjs`（拟新增））+ 各端批内腿；机检 = `node scripts/doc-check.mjs`（**设计轮实跑 exit 0**：悬空 0 · 行宽 0——读数即闸态基线）。

**关键决策（KD-DA1–KD-DA10 · 含否决案——全表 = §6.31.13）**：账目 = 文本标记机检（被否：工具调用代理 ∥ 语义判）· 见账落 `finalizeAgentTurn`（被否：核循环 after-run——端面帧 / 痕行时序倒置 ∥ 三端自检）· 落痕取件（被否：runTurn 返回契约 ∥ 历史尾扫——假覆盖）· N = 2（被否 N = 1 ∥ N ≥ 3）· 升级离容器（被否留容器标位 ∥ 静默丢弃）· 账目要求独立常量行两档同发（被否并入域文本 ∥ 仅 AUTO 泛句）· 报告保留至销账（被否注入即释放）· 用户回合投递不销账（被否用户回合投递即销 / 重投）· F-DA5 归一 + 同面（被否仅留痕 ∥ 无归一）· F-DA6 空白判加宽（被否新事件面 ∥ 按因分文）。

**上抛项（须父侧 / 用户裁或执行）**：
1. **逐字文本 = 父侧内容权威**（三条：`DIGEST_ACCOUNT_DOMAIN` 合同句 ∥ 升级提醒句 ∥ F-DA5 缺席提醒句——本设计给合同 + 草稿位，落点 = §6.31.3 / §6.31.5 / §6.31.7；草稿见本段末）。
2. **需求档 §4.15 尾部改指**：现文「设计侧 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（判据与决策单源——待本批设计落）」→ 改「（判据与决策单源 = §6.31）」（需求档 = 主 agent 笔——本轮未写）。
3. **重投上限取值确认**：N = 2（总投递 ≤3——KD-DA4）；如父侧另有成本口径可改（改一处常量）。
4. **随落披露**：VSC `WEBVIEW-PROTOCOL.md` §3.2 增字段登记行（`unsettled`）与桌面 `PROJECT.md §4.2` 行数账随动 = 实施批随落（各档变更记录已注）。
5. **行为增量登记（已在设计档登记）**：anthropic `max_tokens` / google `MAX_TOKENS` 截断首次获可见提醒；`llm:done.finish` 对三 transport 由 null ⇒ 归一值（KD-DA9 的必要配套——如不接受「无归一」，F-DA5 判据失效，须回父侧另裁）。

**逐字文本草稿位（父侧定稿用）**：
- 账目要求行（`DIGEST_ACCOUNT_DOMAIN`，两档同发、transient、携未销账 id 清单）：`[System reminder: digest accounting — for every report listed below as not yet accounted, emit exactly one line: "[digest-ack #<id>] digested — <key points>" (handled) or "[digest-ack #<id>] deferred — <reason>" (not handled). Not yet accounted: <ids>. Do not omit any.]`
- 升级提醒（pushReal）：`[System reminder: <n> background report(s) were delivered but never accounted after <3> digest rounds — automatic re-delivery has stopped and they are marked UNSETTLED: <list>. Their content was delivered in this conversation; process them there or re-spawn the work. Readable via subagent action:'status'.]`
- F-DA5 缺席提醒（同「非 stop 异常」面）：`[System reminder: the previous turn ended without a finish signal — the provider did not report how generation ended. If the response appears incomplete, continue from where it left off.]`

**评审轮次 1 修正（fix 轮 · 2026-10-05）——承 §3 轮次 1（3🔴 / 5🟡 / 5🔵 · 13 条）· 父侧逐条实读核证 · 全收；逐号 = 终值 + 落点（行号 = 修正后现盘；行数口径 = 内容行数——先例注 = `AGENT-LOOP-ASYNC-POOL.md` §6.20.4）**

1. 🔴 报告释放点收正——`docs/core/design/AGENT-LOOP.md` §6.15 释放点条 → `:408-409`（会话态 = 注入后 `releaseChildHold`（仅 `childAgent`）＋ `report` 保留至销账 / 升级（N 上限封顶）∥ fallback = 逐字沿用「注入即释放」）＋ §7 D-AL23 行 → `:494`（同款收正 + 「本批推翻（理由 = 重投需原文）」注）；设计侧反向登记 = KD-DA7 → `AGENT-LOOP-ASYNC-POOL.md:996`；受影响面补 §6.15 / §7 → 同档 `:935` 行。
2. 🔴 `subagent status` 单查未命中支收正（单查序 = 子代理池 → 评审池 → pending / 升级账本；三处皆无 ⇒ 原错误文案）——`AGENT-LOOP-ASYNC-POOL.md` §6.11 第 1 条 → `:131`；设计 §6.31.6 同拍 → `:877-878`；受影响面补 §6.11 → `:933` 行。
3. 🔴 空响应判据收正（空白判 `String(content ?? "").trim() === ""`）——`AGENT-LOOP.md` §6.5 第 1 条 → `:319`；§6.2 枚举句补缺席支（「异常 / 缺席 `finishReason` 提醒」）→ `:229`；受影响面补 §6.5 / §6.2 → `AGENT-LOOP-ASYNC-POOL.md:935` 行。
4. 🟡 测试档入表（批内件 + 三端腿逐档名 · 拟新增 / 预计增量——写法沿 `:903`）——`AGENT-LOOP-ASYNC-POOL.md` §6.31.9 → `:929-932`（4 行）。
5. 🟡 载体归属裁 + 三面计数对清——`_daSession` 判入字段集（跨 run 会话标记——与 `_suspended` 同类，写面 = 挂起会话置 / 复位）∥ `_lastRunOutput` 判不入（run 内落痕——边界句）；核 §2.3 **15 款**（13 ⇒ 15）∥ VSC 端壳表 **16 款**（14 ⇒ 16——现盘实读 = `panel-turn-loop.mjs:76-80` 14 款）∥ 夹具 **15 款**——落点 `AGENT-LOOP.md:85` / `:100-101` / `:102` / `:103` / `:106` / `:107` / `:122-123` / `:126` / `:137` ∥ `AGENT-LOOP-ASYNC-POOL.md:928` / `:935` / `:983`。
6. 🟡 `AGENT-LOOP.md:123` 「已落地」作用域收正（限上行通道批两款——12 ⇒ 14 款）；本批目标态 = 16 款标「待实施」（同址括注原读作已落地 15 款——两处状态相反已消）。
7. 🟡 >300 块收正——`AGENT-LOOP-ASYNC-POOL.md:939-941`：补 `thincoder-vscode/src/extension/panel-turn-loop.mjs`（303 → ≈307）结论（本批不拆 + 登记去向）；未越线四档改述（`anthropic.mjs` / `google.mjs` / `chat-digest-rows.mjs` / `suspension-drive.mjs`——增量后仍在 300 内）；存量清单补 `helpers.mjs`（481——同类遗漏对清）。
8. 🟡 清位 / 读位落点明写——`AGENT-LOOP-ASYNC-POOL.md` §6.31.5 → `:863-865`（清位 = `run-start.mjs` beginRun 会话态起跑即清（`armAccountRound`）∥ 读位 = `run-stages.mjs` finalize（`harvestAccountOutput`））；受影响面补注 → `:907` / `:909-910`。
9. 🔵 注入回合条件补句（仅会话态消化轮；用户回合自行答复不判销账、条目留容器）——`AGENT-LOOP-ASYNC-POOL.md` §6.31.3 → `:848`（新增 bullet）。
10. 🔵 VSC 记录 / 复列承接句（`end` 记录携 `unsettled` ⇒ 复列随出残余元素）——`AGENT-LOOP-ASYNC-POOL.md:882`；受影响面补 §5.7 → `:937` 行。
11. 🔵 数账重锚——`:935`（旧读 634 ⇒ **637 → 642**——内容行数口径；§3 引「638」= 读取器显示值 +1，非漂移）∥ `:936`（161 ⇒ **164**）；§3.2 计数同改（二十三项 ⇒ 二十四项）并入随落项 → `docs/vsc/design/WEBVIEW-PROTOCOL.md:747`；`:937` 行落点补 §6.3 / §3.2；同类对清（非 §3 点名 · 随 #11 sweep）：`:933`（918 ⇒ **1104 → 1116**）∥ `:934`（913 ⇒ **916 → 917**）。
12. 🔵 批档引文重锚（§1 面 = 主 agent 笔——本席未写 · 已 note 上抛）：`:14` 引文按现句重锚「冻结 ∥ 归档恒落**投递时点**」（`AGENT-LOOP-ASYNC-POOL.md:77` 现文）∥ `:35` 引补全路径 `docs/core/requirements/AGENT-LOOP.md:300`——**待主 agent 落**。
13. 🔵 显示口径注（终态行 N = 起跑数不扣减 ∥ 未销账数由残余行承载）——`docs/cli/design/TUI.md:537`（+ 变更记录 `:917`）；受影响面注 → `AGENT-LOOP-ASYNC-POOL.md:934` 行。

**同轮一致性对清（非 §3 点名 · 随 #5/#7/#11 sweep——一致性面）**：`:933` / `:934` 两行数账重锚 ∥ `helpers.mjs` 补入存量清单 ∥ `_lastRunOutput` 边界句 ∥ 变更记录 fix 行三处（`AGENT-LOOP.md:542-543` · `AGENT-LOOP-ASYNC-POOL.md:1012-1013` · `TUI.md:917`）。

**披露（非阻断）**：① 行数口径 = 内容行数（读取器显示值 +1——非漂移；先例注 = §6.20.4）；② `AGENT-LOOP.md:453`「（14 款）」= §6.18 W15 行现态读数（现盘真值——未列 §3 面，留待实施期随收）；③ 机检 = `node scripts/doc-check.mjs` **exit 0**（悬空 0 · 行宽 0 · 行数面差异 = 报告态工单）；④ §1 两条（第 12 号）本席笔域外——终值已列，待主 agent 落。

**实施中裁定（#41 披露① · fix 轮 · 2026-10-05 11:1x）——退出清场残余注入按投递账过滤**

- 缘由：#41 实施披露①（会话异常收束非 abort 径——`finishSuspension` idle 清场对「已投递未销账」条目再注入一次：内容已在历史 ⇒ 重复；条目离容器 ⇒ 脱离账务面；总投递可超 3）——父侧实读复核成立 + 裁定采纳（按投递账过滤——披露候选修①；否决候选「设计侧登记接受」）。
- 终值（= 设计档 §6.31.5 补句）：**退出清场残余注入按投递账过滤**——`entry._daDelivered === true` ⇒ 不注入且不动容器（内容已在历史——防重复；仍驻 pending——状态面可见、可续账）；其余条逐字沿用（注入顺序 ∥ `left` ∥ `reclaim` ∥ `injected` / `error` 语义不缩水）；fallback（无 `_daSession`）不受触（`_daDelivered` 恒缺省）。
- 落点：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.5（清账面段邻——新 bullet）+ 变更记录 +1 行。
- 实施 = #44（同轮——本裁定句落码）。
- 机检读数（本读）：`node scripts/doc-check.mjs` **exit 0**（悬空 0 · 行宽 0 · 扫描域 docs 178 档；报告态：行数面差异 18 条 = 存量工单，非本笔）。

**实施后同步轮（fix 轮 · 2026-10-05）——设计档收正 + as-built 回填 + 句族清扫（承 #44 ∥ #45 ∥ #47 三笔修正〔出口缝两笔 + 合规拆档笔〕+ §3 轮次 2 残留 2 条 🔵；零新语义 = 收正 / 回填 / 登记）**

**收正表（现文 ⇒ 终值——设计档落点 = 修正后现盘；逐条 read-back 在盘）**

| # | 面 | 现文 ⇒ 终值 |
|---|---|---|
| 1 | 同句族全扫（#45 披露③） | 「fallback 逐字沿用 / 不受触（`_daDelivered` 恒缺省）」⇒ 条件句：会话态 = 投递账过滤（`_daDelivered` 条不注入且留容器）∥ fallback = 缺省条逐字沿用 + `_daDelivered` 条跳过且留容器（#45 落码终态）。落点 = §6.31.4 `:857` ∥ §6.31.5 `:873` ∥ 用例表 T-DA7 `:957` ∥ A-DA7 `:980`（全扫 extend——已知五点外第 6 点）∥ §6.31.12-2 `:986` ∥ 变更记录既往条目 `:1021` |
| 2 | §6.31.5 缝区间行号 | `139-147` ⇒ `:143-162`（#44 ⇒ #45 落码——as-built 实读；落点 `:873`） |
| 3 | §6.31.5 升级句登记 | 补 `ev:unsettled` `ids` = join 串注（`logEvent` 只收标量——先例 `ev:discarded`；落点 `:870`） |
| 4 | §6.31.9 as-built 回填 | `suspension.mjs` 326 → **348**（+30/−8）∥ `run-start.mjs` 111 → **152**（+44/−3）∥ 测试档两档 = 主档 **408** ∥ 出口缝档 **165**（沿革 406 ⇒ 456 ⇒ 502——表下注）∥ `LOGGING.md` 161 → **164**（+3）∥ 本档自指 = 1104 → **1126**（读数口径注同拍） |
| 5 | §6.31.10 用例表 | 补 T-DA15（出口缝①·idle 清场投递账过滤）∥ T-DA16（出口缝②·fallback 支分区）；用例宿主句同拍（出口缝档两腿——纯搬移） |
| 6 | 边界登记（#45 披露④） | fallback 跳过条在纯 fallback 进程内无离容器路径 ∥ `_daRetry` 在 fallback 不兑现（与 `shouldDeliverEntry` 不对称）——**边界（非缺陷）**（落点 §6.31.12-2 `:986`） |
| 7 | 墓碑确认（父侧 11:3x 勘） | D-SD5 依赖满足判据 = settle ∥ consumed 任一（`thincoder-core/agent-tools/subagent-scheduler.mjs:107`）——**不随销账后移**（墓碑仍落注入时点）；本批未触 `subagent-async.mjs` 行为（注记面除外）——入设计档变更记录（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1023`） |
| 8 | §2 摘要收正（评审轮次 2 #14） | `:56` 载「载体 13 ⇒ 14 款」= 设计轮旧值 ⇒ 终值 **13 ⇒ 15 款**（＋`_unsettledDigests` ∕ `_daSession`——同节 fix 块 #5）；该行文档面读数以同节 fix 块 #1–#3 终值为准——**以本块为准** |
| 9 | §2 前块同句族注 | `:54`（「fallback 逐字沿用」）∥ `:97`（「fallback…不受触（`_daDelivered` 恒缺省）」）——以设计档 §6.31.4 / §6.31.5 现文（条件句）为准 |

**门读数**：`node scripts/doc-check.mjs` = **exit 0**（悬空 0 · 行宽 0）。

**披露（落点外——如实登记）**：① §1 `:36` 同句族实例（「fallback 逐字沿用」）= 主 agent 笔域，未触；`docs/core/design/AGENT-LOOP.md` §6.18 `:454` / `:456`「（14 款）」= 实施期应收项（VSC 端壳表现盘 = 16 款）——未列本轮落点，供父侧随收。② 设计档 §6.31.9 其余行（核 12 档 + 端 8 档）仍为设计轮读数 / 估值——未列本轮清单，未触（as-built 值散见 §5）。③ 同句族域外实例（`escalate-async.mjs:109-111`）按产品码零触未动（#47 既披露）。

**实施后终收笔（fix 轮 · 2026-10-05）——载体族读数 / 状态词收正（承 #42 实装〔VSC 端壳载体表 14 ⇒ 16 款〕；承 §3 轮次 2 #15 ∥ §2 同步轮披露① 应收项 · 父侧扩令 = 族内全扫；零新语义 = 读数 / 状态词面）**

**落点表（现文 ⇒ 终值——设计档 = `docs/core/design/AGENT-LOOP.md`，修正后现盘）**

| # | 落点 | 现文 ⇒ 终值 |
|---|---|---|
| 1 | `:123`（§2.3 VSC 绑定不变式括注） | 「**本批目标态 = 16 款**（＋`_unsettledDigests` ∕ `_daSession`；待实施）」⇒「**本批已落地 = 16 款**（＋`_unsettledDigests` ∕ `_daSession`）」 |
| 2 | `:454`（§6.18 上行通道消费 ∕ 唤醒面行） | 「装配期 14 款访问器别名」⇒「装配期 **16 款**访问器别名」 |
| 3 | `:456`（§6.18 W15 行） | 「载体字段访问器别名住共享 `history`（14 款）」⇒「（**16 款**）」 |

＋ 设计档变更记录落一行（`AGENT-LOOP.md:544`——本笔）。

**族内全扫（`14 款` ∥ `15 款` ∥ `16 款` ∥ `待实施` ∥ `目标态`——逐处实读，二分）**

- **已收正（3）**：`:123` ∥ `:454` ∥ `:456`（上表）。
- **仍真零动（10）**：核字段集 15——`:103` ∥ `:106` ∥ `:122`（「全部 15 字段」）∥ `:126` ∥ `:137`（夹具）；变更记录历史面——`:541`–`:543` ∥ `:564` ∥ `:571`（记录面——不回改）。
- 扩扫注（`1[2-6] 款` ∥ `N 字段` 覆扫）：`:104` ∥ `:581` ∥ `:616`–`:618` ∥ `:621`–`:622`（10 ∕ 11 ∕ 13 款 / 字段——变更记录历史面）——零动。

**门读数**：`node scripts/doc-check.mjs` = **exit 0**（悬空 0〔闸态阈值 0〕· 行宽无 >300 单行〔变更记录 ∥ 历史沿革区带豁免在效〕· 扫描域 docs 178 档；行数面差异 18 条 = 报告态存量工单〔端面行数账〕——非闸）。

**披露（落点外——如实登记）**：① 端壳表旧读数存于他批面（他批面零触——未动；供父侧后续轮随收）：`AGENT-LOOP-UPSTREAM.md:262` ∥ `:390` ∥ `:575` ∥ `:796`（「12 → 14 款」）· `docs/vsc/design/VSC-DEBT.md:273`。② `thincoder-vscode/src/extension/panel-turn-loop.mjs:21`（「件 1-⑤⑥——14 字段」与同档 `:86-87`「16 字段…前为 14 款」并存）——产品码零触；供码面注释轮裁（交付溯源读 ∥ stale 计数）。③ 派单更正已收（落档段 = §2；§5 未触）。

**尾三行数账回填（fix 轮 · 2026-10-05）——§6.31.9 收正 1 + 补 2（承 §5 注释族清扫轮披露③〔`async-settle.mjs` 设计记 302 ⇒ 现盘 326 ∥ 本笔两档缺行〕；零新语义 = 读数面）**

**逐行表（现文 ⇒ 终值——设计档 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`，修正后现盘 · read-back 在盘）**

| # | 落点 | 现文 ⇒ 终值 |
|---|---|---|
| 1 | `:915`（async-settle 行） | 「`302` ∕ `+7`」⇒「302 → **326（as-built）** ∕ +29 / −5（as-built——本批合计：#41 ∥ #44/#45 ∥ #47；净 +24）」 |
| 2 | `:916`（补行——async-settle 行后） | 补 `thincoder-core/agent-tools/escalate-async.mjs`——307 → **309（as-built）**（+4 / −2——注释族清扫条件句；注释面 only 零行为） |
| 3 | `:917`（补行——同上） | 补 `thincoder-core/agent-tools/subagent-panel.mjs`——272 → **273（as-built）**（+2 / −1——注释族清扫条件句；注释面 only 零行为） |

＋ 行 1 说明列同展（`releaseChildHold` + 账本写助手 + 出口缝注条件句 + 归档注收正）；设计档变更记录落一行（本笔——`:1027-1028`，同步轮条后）。

**门读数**：`node scripts/doc-check.mjs` = **exit 0**（悬空 0〔闸态阈值 0〕· 行宽 OK〔区带豁免在效——变更记录 ∥ 历史沿革〕· 扫描域 docs 178 档；行数面差异 18 条 = 报告态存量清单〔端面行数账——非本笔〕）。

**披露（落点外——如实登记）**：① `escalate-async.mjs` Δ 机读拆分 = +4 / −2（`git diff --numstat` HEAD→现盘；净 +2 = 块面 3 行 ⇒ 5 行）——派单速记「+5 / −3」为整块替换口径，净增一致（本表取机读值）。② `escalate-async.mjs`（309）越 300 软线为存量（批档 §5 载「在册存量」判；登记面本轮未复核）：本笔补行后该档入 §6.31.9，而 §6.31.9 >300 审视块 ∥ 本档 §6.20.4 拆分计划面均未列该档（实扫零命中）——本档无对应拆分登记；>300 块未触（落点禁），补列 ∥ 接受由父侧裁。③ 落点 = 三行 + 变更记录一行；表内其余行 / 批档 §1 ∥ §3–§6 / 他批面零触；产品码零触。

**>300 审视块全扫补列（fix 轮 · 2026-10-05）——越线缺行 ×2 补列（承 #61 披露② 父侧裁定〔补列——不豁免〕+ 父侧扩令全扫；零新语义 = 登记面）**

**全扫读数（本批触档 27 产品档——内容行数逐档实读；域 = §6.31.9 表 + §5 交付块）**：越线 8 = 已覆盖 6（核 `suspension.mjs` 348 ∥ `helpers.mjs` 489 ∥ `async-settle.mjs` 326 ∥ `responses.mjs` 307 ∥ VSC `suspension.mjs` 337 ∥ VSC `panel-turn-loop.mjs` 306——块内既有行零动）∥ 新补 2（下表）∥ 未越线 19（不列）。

**补行表（落点 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.9 >300 块——现盘 `:947-948` · read-back 在盘）**

| # | 档 | 终值（as-built） | 处置句 ⇒ 拆分预案去向 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/escalate-async.mjs` | 307 → **309**（+4 / −2） | 注释面 only 条件句收正（无新职责 / 无新导出）⇒ 本批不拆；拆分计划随该档下次结构性触碰登记（先例 = §6.20.4） |
| 2 | `thincoder-core/agent-tools/subagent-async.mjs` | 466 → **469**（+6 / −3） | 墓碑注条件句收正（注释面 only）⇒ 本批不拆；拆分计划随该档下次结构性触碰登记（先例 = §6.20.4） |

＋ 设计档变更记录落一行（本笔——`:1032-1033`，尾三行条后）。

**门读数**：`node scripts/doc-check.mjs` = **exit 0**（锚悬空 0〔闸态阈值 0〕· 行宽 OK〔源域全部 .md 无 >300 字符单行〕· 行数面差异 18 条 = 报告态存量清单〔全为端面行数账——非本笔〕）。

**披露（落点外——如实登记）**：① 块内既有行零动——`:945` 行（`subagent-actions-query.mjs` 记「270 → ≈302 越软线」）与 as-built 现读 **277**（+13 / −6）不符（设计轮估值未兑现；既有行按令零动——供父侧后续轮裁）；② 未越线 19 档（含近线者：`run-stages.mjs` 293 ∥ `chat-digest-rows.mjs` 288 ∥ `page-read.mjs` 285 ∥ `google.mjs` 284 ∥ `subagent-panel.mjs` 273——不列）；③ 批内件面（非产品档——不在本扫域）：主档 408 ∥ 出口缝档 165 ∥ 三端腿 169 / 134 / 178；④ 产品码 ∥ 判据 / 值 / 文案零触；批档 §1 / §3–§6 ∥ 他批面（含看门狗批在飞面）零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 设计 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31（＋同档 §6.8 指针）＋ 批档 §2；范围 = Documents to Review 九档（需求档 §4.15 仅作 requirement-fit 抽查，不在列表内）。限制：无项目标准档 / 无文档地图声明（文档所有权按 Project Guide＋设计档自带纪律判）；代码档行数不在声明范围内，仅按文档面 spot-check。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档所有权（机制级） | 🔴 | **报告释放点两处相反**：`docs/core/design/AGENT-LOOP.md:406`（“**三消费点**注入完成后调用（回合尾收集 / run 起始 pending 注入 / 挂起残差）”，同句含 `entry.report = null`）＋同档 `:491`（“释放点 = 注入完成后置空（三消费点同点 + 幂等守卫）”，否决列含“「不置空」（挂起期分钟级驻留）”）∥ 设计 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:854`（“`releaseChildHold(entry)`（= 仅释放 `childAgent`——`report` 保留至销账 / 升级”）、`:865`（“覆盖 ⇒ 离容器（splice）+ `releaseSettledEntry`（含 report 释放）”）、KD-DA7 `:987`（“被否：注入即释放（重投空手——回路不成立）”）。受影响面只列 §2.3（`:927`），§6.15 / §7 未入；旧决策被推翻而两档均无登记 | 把 `AGENT-LOOP.md` §6.15 释放点条与 §7 D-AL23 行并入本批受影响面：逐句收正为「会话态 = 注入后 `releaseChildHold`（report 保留至销账 / 升级，N 上限封顶）∥ fallback = 逐字沿用」；D-AL23 行注推翻（理由 = 重投需原文）或在 §6.31.13 增「推翻 D-AL23」登记 |
| 2 | 文档所有权（机制级） | 🔴 | **`subagent status` 单查未命中语义两处相反**：`AGENT-LOOP-ASYNC-POOL.md:131`（“未命中两池 → 既有错误文案不变。”）∥ 同档 `:874`（“**单查 id** 未命中双池时落 pending / 升级账本同解析（原 unknown error 收窄——登记）”）；受影响面（`:925`）未列 §6.11 | 把 §6.11 第 1 条（状态通道）并入本批受影响面：单查序与未命中支收正为「先子代理池 → 评审池 → pending / 升级账本；三处皆无 ⇒ 原错误文案」 |
| 3 | 文档所有权（机制级） | 🔴 | **空响应判据两处相反**：`AGENT-LOOP.md:317`（“**空响应恢复**：`!response.content` → 注入”）∥ 设计 `AGENT-LOOP-ASYNC-POOL.md:896`（“**判据加宽**：`handleCompletion` 空判 `!response.content` ⇒ **空白判**”）；同族旧枚举句 `AGENT-LOOP.md:227`（“异常 `finishReason` 提醒”）未含缺席支；§6.5 未入受影响面 | 把 `AGENT-LOOP.md` §6.5 第 1 条（＋§6.2 响应后处理枚举句）并入受影响面：判据改空白判、补 F-DA5 缺席支（同面提醒 + 留痕） |
| 4 | 受影响面 / 尺寸标注 | 🟡 | §6.31.9 表**无任何测试档行**：用例宿主 `docs/batches/2026-10-05-digest-accounting.test.mjs`（拟新增，`AGENT-LOOP-ASYNC-POOL.md:953`）与“各端批内腿”（未点名文件）均未按“新档 / 当前行数 + 预计增量”入表（对照同表新档行写法 `:903`） | 补测试档行（批内件 + 各端腿逐档名 + 新档与预计增量），或明写测试档不入表的口径依据 |
| 5 | 文档所有权（悬空） | 🟡 | **载体字段登记不完整**：设计新增载体级字段 `carrier._daSession`（`AGENT-LOOP-ASYNC-POOL.md:838`，`:852` 以 `carrierField(agent, "_daSession")` 读）与 `_lastRunOutput`（落 `agent.history`，`:862`），而 `AGENT-LOOP.md:105`（“**扩容（2026-10-05 消化账务批）**：**14 款**”）、`:120`（“run 起始对**全部 14 字段**成立”）、`:135`（“字段集 14 款全无预置”夹具）与设计 `:974`（只登记 `_unsettledDigests`）⇒ 全集声明 / 跨 run 绑定 / 夹具面不含 `_daSession` | 把 `_daSession`（及 `_lastRunOutput` 若判为跨 run 面）并入 §2.3 字段集与 VSC 端壳表，计数与“不预置载体字段”夹具同拍；或补边界句明写二者不属字段集 |
| 6 | 文档状态 | 🟡 | `AGENT-LOOP.md:121`（“（载体 15 款 · **实现已落地**）”）为已实现断言，而设计 `:924` 将同一载体字段列为未实施改动（“载体字段 +1（`_unsettledDigests`；14 ⇒ 15）”）——两处状态相反 | §2.3 该括注收正：「实现已落地」限定到 `_childUpstream` / `_childUpstreamSeq`，15 款标“本批目标态（待实施）” |
| 7 | 受影响面 / 档级 | 🟡 | “**>300 档审视**”（`AGENT-LOOP-ASYNC-POOL.md:931`）漏 `thincoder-vscode/src/extension/panel-turn-loop.mjs`（`:924` 记 303 → +3，越软线且本批触碰，无审视结论 / 拆分计划）；同块反列未越线档（`anthropic.mjs` 225 / `google.mjs` 273，`:912`、`:913`） | 审视块补 `panel-turn-loop.mjs` 结论（拆分计划或登记去向），未越线档按口径移出或改述 |
| 8 | 清晰度 | 🟡 | **落痕清位点无落点**：`:862` 写“驱动侧起跑前清位、收尾读位——核助手 `armAccountRound(carrier)`”，但受影响表无对应行（`run-start.mjs` 行 `:905` 只写“投递门控两态 + 账目要求行”；`turn-loop.mjs` 行 `:907` 只写落痕写点），“驱动侧”指核驱动 ∥ 端驱动未定 | 明确 `armAccountRound` / `harvestAccountOutput` 的调用文件与时机，受影响表面为清位点补行 / 增注 |
| 9 | 清晰度 | 🔵 | 账目要求行**注入回合条件未写**：`:847` 只写“**两档同发**”，而投递门控允许首投落“任意回合”（`:853`）——用户回合（非消化轮）是否同发、模型该轮作答如何处置未定 | §6.31.3 / §6.31.4 补注入条件（仅消化轮发 ∥ 任意会话态回合发但只在消化轮记账）与用户回合作答处置 |
| 10 | 完整性 / 端面 | 🔵 | **VSC 记录 / 复列面未随收**：CLI（`:918`“记录携 `unsettled` + 残余痕行”）与桌面（`:920`“end 记录携 `unsettled`（归一）”）显式登记记录面，VSC 只写“`digest` end 消息增 `unsettled`”（`:878`）；而 `docs/vsc/design/WEBVIEW.md:515` 的复列句只出终态元素（`docs/vsc/design/WEBVIEW.md:513` 起列）未含残余元素 | VSC 补记录 / 复列承接句（end 记录携 `unsettled` ⇒ 复列出残余元素），或登记“复列不出残余行”的端差 |
| 11 | 文档卫生（数账） | 🔵 | 行数账漂移：`:927` 记 `AGENT-LOOP.md` §2.3“634 / +4 −4”（净 0 ⇒ 634），现盘 638 行；`:928` 记 `LOGGING.md` §6.2“161 / +2”，现盘 164 行。另 `docs/vsc/design/WEBVIEW-PROTOCOL.md:86` 标题“（二十三项——只增不改）”、`:747` 将 §3.2 增字段行留实施批随落，未带计数同改（先例 `:740`“D-P11 计数同改”）；设计 `:929` 只指 §5（§6.3 键表 27 ⇒ 28、§3.2 未列） | 两档读数按现盘重锚；随落项补“§3.2 计数同改（二十三项 ⇒ 二十四项）”；`:929` 行落点补 §6.3 / §3.2 |
| 12 | 文档卫生（引文） | 🔵 | 批档引文失锚：`docs/batches/2026-10-05-digest-accounting.md:14` 引 `:77`“冻结 ∥ 归档恒落消费时点”，现文为“冻结 ∥ 归档恒落**投递时点**”（`AGENT-LOOP-ASYNC-POOL.md:77`）；`:35`“（`AGENT-LOOP.md:300`）”与设计档同名（设计档 638 行 ∥ 需求档 348 行）指称歧义 | 批档引文按现句重锚；同名档引用补全路径（`docs/core/requirements/AGENT-LOOP.md:300`） |
| 13 | 验收 / 显示口径 | 🔵 | 重投轮同屏两行口径交互未注：CLI 终态行按起跑数计（`docs/cli/design/TUI.md:536`“**计数口径 = 起跑数**”），而条目在销账前驻 pending（`:837`）⇒ 未销账条目先计入“已消化 N 份”，与残余行同屏（`:537`） | §6.31.6 / TUI 条补一句口径注（终态行 N = 起跑数不变 ∥ 明写其中 M 份未销账由残余行承载） |

VERDICT: changes-required（发现 3🔴 / 5🟡 / 5🔵——3 条 🔴 未解决：报告释放点、status 单查未命中语义、空响应判据三处机制级两地方不一致）。

### 轮次 2（评审子代理）

**轮次 2 复核（fix 轮后 · 现盘实读）**——承轮次 1（3🔴 / 5🟡 / 5🔵 · 13 条）：13 条逐条现盘实读核证，**全 Fixed**；新增 2 条 🔵（非阻断）；未解决 🔴 = 0。
> 本轮实读面 = 批档全文 + 六档涉改区域逐点实读（全部 13 条落点与回指面）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `AGENT-LOOP.md` ∥ `AGENT-LOOP-ASYNC-POOL.md` | 🔴 | Fixed | `AGENT-LOOP.md:408`「**fallback 面**（无挂起驱动）逐字沿用；池内与挂起未消化窗口**零变化**（报告仍到达、status / observe 可读）」＋`:409`「挂起会话态（`_daSession === true`）注入后改调 `releaseChildHold(entry)`——**仅释放 `childAgent`**」＋ D-AL23 `:494`「**2026-10-05 消化账务批推翻会话态一截**（理由 = 重投需原文）」＋ `AGENT-LOOP-ASYNC-POOL.md:996`「**推翻 `docs/core/design/AGENT-LOOP.md` §7 D-AL23**（会话态一截——原位注记同拍）」；受影响面 `:935` 已列 §6.15 / §7 |
| 2 | 2 | `AGENT-LOOP-ASYNC-POOL.md` | 🔴 | Fixed | `:131`「**单查未命中双池 ⇒ 续查 pending / 升级账本**」「**三处皆无 ⇒ 既有错误文案不变**」；设计侧 `:877`「**单查 id** 未命中双池 ⇒ 续查 pending / 升级账本同解析（收窄登记——§6.11 同拍）」/ `:878` 单查序句；受影响面 `:933` 已列 §6.11 |
| 3 | 3 | `AGENT-LOOP.md` | 🔴 | Fixed | `:319`「**空响应恢复**：**空白判**（`String(content ?? "").trim() === ""`」；`:229`「异常 / 缺席 `finishReason` 提醒——2026-10-05 消化账务批 · #929」；受影响面 `:935` 已列 §6.5 / §6.2 |
| 4 | 4 | `AGENT-LOOP-ASYNC-POOL.md` | 🟡 | Fixed | `:929`-`:932` 四行测试档入表（核宿主 + CLI / 桌面 / VSC 三端腿——「（拟新增）」+ 预计增量；`:929`「核侧用例宿主（T-DA1–T-DA10 / T-DA12–T-DA14——平 node 直驱：假 carrier / 假 runTurn / 直驱 `finalizeAgentTurn` 同窗）」） |
| 5 | 5 | `AGENT-LOOP.md` | 🟡 | Fixed | §2.3 `:101`「**`_daSession`**（会话标记——布尔；挂起会话期 true / 退出置 false」入册 ＋ `:106`「**扩容（2026-10-05 消化账务批）**：**15 款**」＋ `:107`「清单外注：`_lastRunOutput`（run 内落痕——起跑清位 / 收尾取件）不入本集」＋ `:122`「run 起始对**全部 15 字段**成立」＋ `:137`「字段集 15 款全无预置」；设计 `:928` / `:983` / `:996` 同拍 |
| 6 | 6 | `AGENT-LOOP.md` | 🟡 | Fixed | `:123`「**实现已落地** = 上行通道批两款（`_childUpstream` / `_childUpstreamSeq`，12 ⇒ 14 款）；**本批目标态 = 16 款**（＋`_unsettledDigests` ∕ `_daSession`；待实施）」 |
| 7 | 7 | `AGENT-LOOP-ASYNC-POOL.md` | 🟡 | Fixed | `:940`「（303 → ≈307 越软线）：改动 = 载体表 +2 字段（数组行内追加——无新职责 / 无新导出）⇒ **本批不拆**」；`:941`「增量后仍在 300 内（不入此列）」＋ `helpers.mjs` 入存量 |
| 8 | 8 | `AGENT-LOOP-ASYNC-POOL.md` | 🟡 | Fixed | `:863`「**清位** = `thincoder-core/agent/run-start.mjs`（beginRun——会话态起跑即清；调核助手 `armAccountRound(carrier)`；fallback 零动作）」；`:909` / `:910` 行注同拍 |
| 9 | 9 | `AGENT-LOOP-ASYNC-POOL.md` | 🔵 | Fixed | `:848`「**注入回合条件**：仅**会话态消化轮**（`_daSession` ∧ `isDigestRound`）且未销账清单非空时注入」 |
| 10 | 10 | `AGENT-LOOP-ASYNC-POOL.md` | 🔵 | Fixed | `:882`「**记录 / 复列承接**：`end` 记录随载荷携 `unsettled` ⇒ 重建复列随出残余元素」；`:937` 落点补 §5.7 |
| 11 | 11 | `AGENT-LOOP-ASYNC-POOL.md` ∥ `WEBVIEW-PROTOCOL.md` | 🔵 | Fixed | 数账重锚 `:933`「1104 → 1116」/ `:935`「637 → 642」；`WEBVIEW-PROTOCOL.md:747`「§3.2 增字段登记行 + **标题计数同改（二十三项 ⇒ 二十四项）** = 实施批随落」；残留 ±1 见 New |
| 12 | 12 | `docs/batches/2026-10-05-digest-accounting.md` §1 | 🔵 | Fixed | `:14`「冻结 ∥ 归档恒落**投递时点**」＋ `:35`「`docs/core/requirements/AGENT-LOOP.md:300`」 |
| 13 | 13 | `docs/cli/design/TUI.md` | 🔵 | Fixed | `:537`「**两行同屏口径**：终态行 N 仍按起跑数（不扣减）∥ 未销账数由残余行承载（两行各表其一）」；`:917` 变更记录 |
| 14 | (new) | `docs/batches/2026-10-05-digest-accounting.md` §2 | 🔵 | New: `:56` 摘要仍载设计轮旧值「`docs/core/design/AGENT-LOOP.md` §2.3（载体 13 ⇒ 14 款）」与旧文档面，未随同节 fix 块终值（`:935`「载体字段 +2（13 款 ⇒ 15 款」）重锚 ⇒ 同节两值并存 | 就地重锚或加「以 §2 fix 块（终值）为准」注 |
| 15 | (new) | `AGENT-LOOP-ASYNC-POOL.md` | 🔵 | New: `:936`「`docs/core/design/LOGGING.md` §6.2」行「164」与同表口径（读取器 − 1；fix 块 `:86` 载「192 ⇒ **164**」之旧读 161 + 2 = 163）差 1——现盘该档显示 164 行 ⇒ 内容 163 | 按现盘重锚（161 ⇒ 162 ∥ 164 ⇒ 163）并统一读法注；`AGENT-LOOP.md:454` / `:456`「（14 款）」现态读数已有披露（批档 `:92` · 留待实施期随收）——建议随 `:935` 行同列以免遗漏 |

**计数**：Fixed 13（原 3🔴 / 5🟡 / 5🔵）· New 🔵 2 · Unfixed 0 · 未解决 🔴 = 0。
**VERDICT: pass**（13 条全 Fixed 实测在盘；2 条新增 🔵 非阻断——🔴 零）

## §4 用户批准（主 agent）

**2026-10-05 10:47 用户亲签**——用户原话：「**开炮**」（承 01:44「可以」认界 + 两轮设计评审 pass + 13 条修正在盘 + token 已签发）。

**三条件核验（自缚惯例）**：① 评审 pass ✓（轮 1 = changes-required〔3🔴/5🟡/5🔵〕→ 修正轮 #39〔13 条全落〕→ **轮 2 = pass**〔13 条全 Fixed 实测在盘；新增 2 条 🔵 非阻断——已入 §3 轮次 2〕）；② 修正落地并逐条核验 ✓（父侧实读：`:408`/`:409`/`:494`/`:131`/`:319`/`:229`/`:929-932`/`:848`/`:882`/`:537`/`:747` + §1 两条父侧亲笔）；③ token 已签发 ✓（运行态不入档）。

**批准范围** = 本批全量（核 14 档 + 批内件 ∥ CLI 2 ∥ 桌面 3 ∥ VSC 3 ∥ 各端批内腿 ∥ 随落两项：`WEBVIEW-PROTOCOL.md` §3.2 增字段登记行 + 桌面 `PROJECT.md` §4.2 行数账）。

**实施派单** = 双舱（一面一舱）：**#41 核面**（14 档 + 批内件）∥ **#42 端面**（CLI/桌面/VSC 8 档 + 3 端腿 + 随落 2 项——dependsOn #41）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-05 · 核面舱 #41 + 出口缝修正轮 #44 + 出口缝修正·第二笔 + 合规拆分笔（件①拆档 502⇒408/165 ∥ 件②注释收正 · 父侧裁定 11:5x）+ 注释族清扫笔（#47 披露④ · 父侧扩令全族扫——审计 clean / 评审 pass 见追加块））


**§5 实施记录（eng-coder · 核面舱 #41 · 2026-10-05 · initial 轮）**

**落地表（file → Δ——as-built 实读）**

| # | 文件 | Δ | 落点 |
|---|---|---|---|
| 1 | `thincoder-core/agent/digest-account.mjs`（新增 · 182 行） | 全档 | 账务单件：`DA_RETRY_LIMIT = 2` / `isDigestRound` / `shouldDeliverEntry` / `digestAccountRequirement` / `coversDigestId` / `accountDigestRound`（销账 ∥ 重投 ∥ 升级）/ `unsettledReminder` / `unsettledRows`·`unsettledRow`·`unsettledCount` / `armAccountRound`·`harvestAccountOutput` |
| 2 | `thincoder-core/agent/helpers.mjs` | +8 | `DIGEST_ACCOUNT_DOMAIN` 常量位（逐字 = 父侧定稿） |
| 3 | `thincoder-core/agent/run-start.mjs` | +38 / −7 | 会话态投递门控两态（首投任意回合 ∥ 重投仅消化轮）+ 留容器 + `releaseChildHold` + 账目要求行（先投递后拼清单）+ 清位 `armAccountRound`；fallback 分支逐字沿用 |
| 4 | `thincoder-core/agent/run-stages.mjs` | +27 / −2 | finalize 见账 pass（恒达窗：正常 ∥ Abort-continue ∥ 异常抛）+ F-DA5 缺席支（同面提醒 + `ev:finish-missing`）+ 中止清账本 |
| 5 | `thincoder-core/agent/turn-loop.mjs` | +3 | 收口落痕 `agent.history._lastRunOutput`（见账读位取件） |
| 6 | `thincoder-core/agent/completion.mjs` | +2 / −1 | 空白判（`String(content ?? "").trim() === ""`——既有重试 ≤2 / 抛错骨架零改） |
| 7 | `thincoder-core/agent/suspension.mjs` | +9 / −1 | `_daSession` 置位 / 复位 + 中止清升级账本 |
| 8 | `thincoder-core/agent-tools/async-settle.mjs` | +19 | `releaseChildHold`（仅释放 `childAgent`）+ `appendUnsettledDigest`（升级账本写助手）+ 注释收正（归档恒落投递时点） |
| 9 | `thincoder-core/agent-tools/subagent-actions-query.mjs` | +8 / −4 | status `overview.unsettled`（三态行）+ 单查续查 pending / 账本（三处皆无 ⇒ 原错误文案） |
| 10 | `thincoder-core/agent.mjs` | +1 / −1 | finalize ctx 携 `upstreamTurn` / `timerTurn` |
| 11 | `thincoder-core/provider/anthropic.mjs` | +14 / −1 | `stop_reason` 捕获 + 归一（end_turn / stop_sequence ⇒ stop；tool_use ⇒ tool_calls；max_tokens ⇒ length；余者透传） |
| 12 | `thincoder-core/provider/google.mjs` | +11 / −1 | `candidate.finishReason` 捕获 + 归一（STOP ⇒ stop；MAX_TOKENS ⇒ length；余者透传） |
| 13 | `thincoder-core/provider/responses.mjs` | +1 / −1 | completed ⇒ stop（incomplete 两值既判零改） |
| 14 | `thincoder-core/i18n.mjs` | +3 | 键 `digest.residue`（逐字 = WEBVIEW-PROTOCOL §6.3 键表） |
| 15 | `docs/batches/2026-10-05-digest-accounting.test.mjs`（新增 · 406 行） | 全档 | 用例宿主：T-DA1–T-DA10 · T-DA12–T-DA14 + 补充臂（会话标记 / 清账面 / 常量面） |

边界确认：端面 8 档 + 3 端腿 + 随落 2 项 = 舱 #42（本舱零触）；设计档 / 需求档零触（除本段经 batch 工具落档）。

**红绿两读（先红后绿——账目覆盖 / 重投 / 升级 / 缺席支四腿各至少一红）**

- **红读**（改前码：`git stash` 暂存 11 档集成改动、保留新增单件与加性常量——同命令直跑）：**pass 4 / fail 10**。红腿 = T-DA1（覆盖）· T-DA2（重投）· T-DA3 · T-DA5（升级）· T-DA8 · T-DA10 · T-DA12 · T-DA13（缺席支）· T-DA14 · 补充臂（读数：`_daRetry` 未清 / 条目被 `splice` 直吞 / `_daDelivered` 未置 / `failures` 未计 / 提醒与事件零发 / status 段缺 / 归一无值 / 空停旧判）。
- **绿读**（恢复后复跑——同命令）：**pass 14 / fail 0**。
- 命令 = `node --test docs/batches/2026-10-05-digest-accounting.test.mjs`（仓根 `thincoder/`）。

**门读数**

- `node --check` 全触档 **15/15 exit 0**。
- 相邻批内件复跑（改后）：`2026-10-01-timer-wake-delivery` 6/6 绿 ∥ `2026-10-04-subagent-panel-live-face` 21/21 绿 ∥ `2026-09-29-parity-b1-vsc-core-susp` 6/6 绿 ∥ `2026-09-30-consult-family` 8/8 绿 ∥ `2026-10-04-responses-robustness` 8/8 绿 ∥ `2026-10-04-core-patch-batch` 12/12 绿。
- 存量红（**改前即红——改前 / 改后同读数逐条比对核证**，非本批）：`2026-09-30-block-arrival-timing` 1 红（`chatStream.alignPlan` 缺）∥ `2026-09-29-parity-b1-vsc-core-host` 2 红 ∥ `2026-10-01-zero-semantic-sweep` 4 红。
- `node scripts/doc-check.mjs` **exit 0**（悬空 0 · 行宽 0 · 扫描域 docs 178 档）；`node scripts/prompt-refs-check.mjs` **exit 0**（提示词面 80 档 ∥ 代码面 418 档——J1/J2/J3 三式零命中）。
- 三文本逐字对读（批档 §2 草稿位 ⇒ 产出）：账目要求行 ∥ 升级提醒 ∥ F-DA5 缺席提醒——**全一致**（对读脚本实跑；静态段逐字 + 占位替换后全串等值）。

**审计与代码评审轮次（内部——终态 = clean）**

- 审计（explore 只读 · 对设计 §6.31 逐节 / A-DA1–A-DA8 / 批档 §2 终值 / 三逐字文本）：**四类偏差 0**；1 🔵（`coversDigestId` 同行长 id 首现吞后随正例）⇒ 自修（出现位续扫）+ T-DA9 补腿。
- 代码评审轮 1（advisor code）：**VERDICT pass**（3 🟡 / 5 🔵，无 must-fix）；三项小修随轮落：① `async-settle.mjs` 注释「归档恒落消费时点」⇒「投递时点」（对齐 §6.8/§6.31 不变量）；② `digest-account.mjs` 补注「核内写点只落 history」（吸收读序澄清）；③ 批内件日志读面加固（免按日现算文件名 + 正控哨兵——零条断言不再恒真）。
- 代码评审轮 2（fix 复核）：三项 **Fixed 实读在盘**；**VERDICT pass**（未解决 🔴 = 0）。

**披露（偏差 / 未决——如实登记）**

1. 🟡 **未修（设计面空白——请父侧裁）**：会话异常收束（非 abort 的非 AbortError）时 `finishSuspension` 的 idle 清场对「已投递未销账」条目会再注入一次（报告已在历史 ⇒ 重复内容；总投递可超 3）。设计 §6.31.5「清账面」未涉此径——不擅造语义；候选修 = 清场前按 `_daDelivered === true` 过滤（2 行）或设计侧登记「接受」。
2. 🟡 **协调项（#42）**：会话自然退出条件现依赖「digest 轮经核 `runAgent` 收尾且 `isDigestRound` 成立」——三端若让 digest 轮不落该分类或不走核 finalize ⇒ 热循环（零等待空转）。建议 #42 核验单条 + 防御登记（连续零进度轮上限）。旧桩语义已失真（先例 `2026-10-04-subagent-panel-live-face.test.mjs` 以 `splice(0)` 表消费）。
3. 🟡 **登记**：批内件 406 行 > 300 软线（设计 §6.31.9 估 ≈160–220；批档「as-built 实测为准」）——保留单档宿主（与设计单档宿主一致）；如需拆分请父侧裁。
4. 🔵 报备：`ev:unsettled` 的 `ids` 以 join 串落盘（`logEvent` 只收标量——先例 `ev:discarded`；数组字段会被静默丢弃）——设计 / LOGGING 行可选补注（未落）。
5. 越清单改动：**无**（15 档 = 批准清单；无清单外文件触碰——审计机扫核实）。

**落地表 Δ / 行数收正（as-built 机读实跑——上表为落档时估值，以下列现读为准）**

- `git diff --numstat`（`thincoder-core` 实跑）：`run-start.mjs` **+31/−2** ∥ `run-stages.mjs` **+27/−4** ∥ `async-settle.mjs` **+26/−4** ∥ `subagent-actions-query.mjs` **+13/−6** ∥ `completion.mjs` **+3/−1** ∥ `suspension.mjs` **+8/−1** ∥ `anthropic.mjs` **+14/−2** ∥ `google.mjs` **+13/−2**；其余同表（`agent.mjs` +1/−1 ∥ `turn-loop.mjs` +3 ∥ `helpers.mjs` +8 ∥ `i18n.mjs` +3 ∥ `responses.mjs` +1/−1）。
- 新增档内容行数：`thincoder-core/agent/digest-account.mjs` = **185 行** ∥ 批内件 `docs/batches/2026-10-05-digest-accounting.test.mjs` = **406 行**。

**§5 实施记录（eng-coder · 出口缝修正轮 #44（#41 披露① · 父侧裁定）· 2026-10-05）**

**落点表（file:line → Δ——as-built 实读）**

| # | 文件 | 落点 | Δ |
|---|---|---|---|
| 1 | `thincoder-core/agent/suspension.mjs` | `finishSuspension` idle 支 `:144-148`＋注释 `:8-9` / `:117-125` | `left = residual.splice(0)` ⇒ 投递账过滤：`_daDelivered === true` 条不注入且留容器（不入 `left`、不入 `reclaim`）；其余条逐字沿用（注入顺序 ∥ `left` ∥ 首错前缀语义不缩水）。abort 支 / 无注入器径零触 |
| 2 | `docs/batches/2026-10-05-digest-accounting.test.mjs` | T-DA15 `:364-411`＋档头 `:4-6` / `:11-12` | 新腿三面：① 清场单点直驱（跳过集 ∩ 注入集——`injected` / `left` / 容器三键）② 回退形直驱（无投递账条全量注入零变）③ 全径（会话内消化轮抛非 abort 错 ⇒ idle 清场——披露①原场景；含 `reclaim` 面与 report 零释放） |

**红绿两读（先红后绿——T-DA15）**

- 红读（修正行落前，同工作区）：`node --test docs/batches/2026-10-05-digest-accounting.test.mjs` ⇒ **pass 14 / fail 1**（T-DA15 红：#151 已投递条被注入）。
- 绿读（修正后复跑，同命令）：**pass 15 / fail 0**。

**门读数**

- `node --check` 两触档（`thincoder-core/agent/suspension.mjs` ∥ 批内件）**exit 0**。
- 相邻批内件复跑（改后）：`2026-10-01-timer-wake-delivery` **6/6** 绿 ∥ `2026-10-04-subagent-panel-live-face` **21/21** 绿 ∥ `2026-09-29-parity-b1-vsc-core-susp` **6/6** 绿。
- `node scripts/doc-check.mjs` **exit 0**（悬空 0 · 行宽 OK；行数面差异 18 条 = 报告态存量工单）。

**审计与代码评审轮次（内部——终态 = clean / pass）**

- 审计（explore 只读 · 对裁定逐点 + 批档 §2 终值块 + 设计 §6.31.5）：**四类偏差 0**；观察 O1–O5——O2（档头摘要句未随收）⇒ 自修（`:8-9` 补过滤限定）已在盘；O5 = fallback 面二阶交互（见披露 1）。
- 代码评审轮 1（advisor code）：**VERDICT pass**（0 🔴 · 0 must-fix；🟡 ×3 / 🔵 ×3——逐条响应见下表）。无修项 ⇒ 无轮 2（无「修复声明」可核——轮 1 pass 即收敛）。

**评审轮 1 响应表**

| # | 评（面） | 级 | 条目 | 响应 |
|---|---|---|---|---|
| 1 | `suspension.mjs` × fallback 支 | 🟡 | 留容器条跨会话驻留 ⇒ fallback 取尽支无投递账判据（重复 + 离账务面）；登记句「fallback 不受触」不再结构性成立（可达性未复核——宿主面 = 舱 #42） | **不改码**（非 must-fix ＋ 裁定明令 fallback 零触）；转父侧裁＝披露 1（护支 ∥ 登记边界——#43 域） |
| 2 | `suspension.mjs` 341 行 | 🟡 | > 300 软线（存量登记：§6.31.9 拆分计划在册） | 按 R3 只报不升级；本批不拆 |
| 3 | 批内件 456 行 | 🟡 | > 300 软线（§5 披露 3 既有登记） | 请父侧显式裁定（保留单档宿主 ∥ 拆分）；非阻断 |
| 4 | `suspension.mjs:149` | 🔵 | `indexOf` 未命中则 `splice(-1,1)` 静默删尾（当前调用图不可达；O(n²)） | 说明保留（现形态 = 裁定文本逐条对应物、即评审对象）；「单遍分区」记录为稳健性候选（不随轮改） |
| 5 | 批内件 T-DA15 | 🔵 | 覆盖缺口三处（`_daRetry` 组合 ∥ 抛错交错前缀 ∥ 「可续账」半程） | 记录为候选补腿；本轮按任务书「补一腿」范围交付（不扩围） |
| 6 | 批内件档头 `:12` | 🔵 | 「（同 §5）」引文在 §5 落前悬空 | 本追加块落档即消（红绿读数已入上「红绿两读」块） |

**披露（如实登记）**

1. 🟡 **转父侧裁（设计缝——审计 O5 ∥ 评审 #1 同点 · 独立双证）**：修正后已投递未销账条跨会话退出驻留容器（`_daSession` 复位后仍在），而 fallback 分支（`run-start.mjs:64-74` `splice(0)` 取尽 + `releaseSettledEntry`）无投递账判据 ⇒ 任何非会话 run 见到该状态即：内容二次进历史（重复）＋条目携 report 离容器（脱离账务面）；登记句「fallback（无 `_daSession`）不受触（`_daDelivered` 恒缺省）」由此不再结构性成立。可达性未复核（三端宿主面 = 舱 #42）。父侧二选一：fallback 支护支 ∥ 设计档登记边界（#43 域——本席零触）。
2. 🔵 设计档引文漂移（#43 域——未改）：§6.31.5 缝区间记 `139-147`（现盘缝 = `:144-148`）；§6.31.9 `suspension.mjs` 行 Δ 仍修正前读数（现盘 341 行）；§6.31.10 用例表止于 T-DA14（无 T-DA15 行）。
3. 🔵 墓碑边界观察（#43 域——非本笔缺陷）：`async-settle.mjs:401`「consumed」墓碑仍恒落投递点——请父侧确认 spawn 依赖面（D-SD5）不随销账后移。
4. 越清单改动：**无**（轮内 Δ = 两档：`suspension.mjs` ＋ 批内件；abort 支 / 端面 / 他舱 / 设计档零触——审计机扫核实）。

**轮内实读行数（as-built）**：`suspension.mjs` = **341 行**（现盘）∥ 批内件 = **456 行**（现盘；前块 as-built 记 406 行——本轮新腿＋档头同步后 +50）。

**实施记录（端面舱 #42 · eng-coder · 2026-10-05 · 终态 = clean）**

### 一、逐端落点表（file → Δ → 落点；行数 = 内容行数口径）

| 端 | 档 | 现行 ⇒ 实读 | 落点 |
|---|---|---|---|
| CLI | `thincoder-cli/src/tui/lifecycle-records.mjs` | 199 ⇒ **207**（+8） | `digestEndRecord` 携 `unsettled`（> 0 才携）；`digestTraceLines` 终态行之后再落残余行（核字典 `digest.residue`） |
| CLI | `thincoder-cli/src/tui/suspension-drive.mjs` | 254 ⇒ **261**（+7） | 判据单源 = 核 `unsettledCount`（import + 调用）；非上行轮门 `upstream ? 0 : …` |
| 桌面 | `thincoder-desktop/src/main/turn-face.mjs` | 200 ⇒ **206**（+6） | `emitDigestEnd` 帧 ∥ 记录同源同点携 `unsettled`（非上行且 > 0） |
| 桌面 | `thincoder-desktop/renderer/events-wake.mjs` | 102 ⇒ **104**（+2） | `onDigest` end 归一 `unsettled` 入轮记录（缺省 0） |
| 桌面 | `thincoder-desktop/renderer/views/chat-digest-rows.mjs` | 273 ⇒ **288**（+15） | 残余行（锚 `data-digest-residue`；词键核字典直取）+ 行型闭集 +1 |
| 桌面 | `thincoder-desktop/renderer/page-read.mjs` 【**表外随落**·复列承接】 | 281 ⇒ **285**（+4） | 折叠轮投影携 `unsettled`（记录随载荷 ⇒ 重建同出残余行） |
| VSC | `thincoder-vscode/src/extension/suspension.mjs` | 328 ⇒ **334**（+6） | 收尾帧 ∥ 记录携 `unsettled`（非上行且 > 0）；判据件动态装载、先于 `try`（W8 契约②） |
| VSC | `thincoder-vscode/webview/chat-status.js` | 151 ⇒ **163**（+12） | `digestResidueEl` 导出 + end 后追加（`.digest-status` 族） |
| VSC | `thincoder-vscode/webview/record-restore.js` 【**表外随落**·复列承接】 | 130 ⇒ **134**（+4） | 重建随出残余元素（`data-idx` 同位） |
| VSC | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 303 ⇒ **306**（+3） | `CARRIER_FIELDS` 14 ⇒ 16（+`_unsettledDigests` +`_daSession`；表注计数同改） |
| 文档 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | — | §3.2 行 24 + 标题 ∥ 行 1–24 ∥ D-P11 二十四项 + 实施轮变更记录 |
| 文档 | `docs/desktop/design/PROJECT.md` | — | §4.2 新块（本批四产品行数账 + 批内件行数） |
| 批内件 | `docs/batches/2026-10-05-digest-accounting-{cli,desktop,vsc}.test.mjs` | 169 ∥ 134 ∥ 175 行 | T-DA11 三端腿（随批留存 · 不进仓套件） |

### 二、三腿红绿读数（同命令 · 基线 = 本批产品码 stash 后）

- CLI 腿：基线 **2/5 红**（CLI-1 ∥ CLI-4 ∥ CLI-5）⇒ 落码 **5/5 绿**。
- 桌面腿：基线 **2/6 红**（DSK-1 ∥ DSK-4 ∥ DSK-5 ∥ DSK-6）⇒ 落码 **6/6 绿**。
- VSC 腿：基线 **0/4 红**（四条全红）⇒ 落码 **4/4 绿**。

### 三、门读数

- `node --check`：全触档 exit 0（10 产品档 + 3 腿档，含 `.js` 面）——逐档 Syntax OK。
- `node scripts/doc-check.mjs`：**exit 0**（锚悬空 = 0 · 行宽 0；行数面对照表为报告态工单，非闸）。
- `node scripts/prompt-refs-check.mjs`：exit 0（三式零命中）。
- 相邻批内件复跑（改前 ∥ 改后同读数逐条比对）：`digest-rows-natural-form-cli-vsc` 11/11 ✓ · `digest-replay-choices` 9/9 ✓ · `residuals-round2`（W8）12/12 ✓ · `subagent-panel-live-face` 21/21 ✓ · 核批内件 16/16 ✓（末条含并行舱 #44 追加用例，非本席）。
- **本批引起 1 处跨批红（披露）**：`2026-10-01-digest-rows-natural-form.test.mjs` 腿 ⑦ —— 两锁被本批语义取代：`:629` 终态轮键面锁（八键——现归一入 `unsettled`）∥ `:650` turn-face `appendRecord` 源字面锁（现携 `...extra`）。内审复核「被取代」判定成立；该档为归档批件、不在本批文件域 ⇒ **未改，待父侧裁（改钉 or 接受）**。
- 存量红（改前 = 改后，非本批）：`zero-semantic-sweep` 3 红 ∥ `audit-remediation` M2a ∥ `triple-end-digest-unify`（整档失败）。

### 四、内审与代码评审（内部 · 终态 = clean）

- **审计（explore 只读 · 四类偏差）**：3 条 🔵 —— ① 表外两档（`page-read.mjs` ∥ `record-restore.js`）判定 = **确为「复列承接」所需且最小**（VSC 重建唯一产者；桌面折叠为显式字段白名单，不补即记录键丢）；② `panel-turn-loop.mjs` 残留「② 14 字段」计数句；③ WEBVIEW-PROTOCOL 设计轮句「= 实施批随落」无收口行。②③ **已自修**；① 随落披露（如实）。
- **代码评审轮 1（advisor code）**：**VERDICT pass**（0 🔴；🟡2 + 🔵3）。处置：评审「行 24 接收格点名错位」半边成立 ⇒ 已收正（`webview/chat-status.js` + 分发 `chat-messages.js:194`）；「发射格应改 panel-turn-loop」半边经本席复核 = **误**（`driveTurn` / `endMsg` 实证住 `suspension.mjs:174/219`，已 grep 定证）⇒ 发射格保持；🟡 越线两款 = 在册（本批不拆）；🔵 三条全采纳并自修：残余判据两形归一 `(msg.unsettled ?? 0) > 0` ∥ VSC 判据件装载前移 `try` 外 ∥ VSC 腿正控失效收正（先清根再断言）。修后复跑：三腿 + 核件 + W8 + live-face 全绿，doc-check exit 0。终态 = **clean**（0 未决）。

### 五、解释性裁定（裁明 · 随交付披露）

1. **CLI 同设「非上行轮」门**：任务书 CLI 行未复述该门（桌面 ∥ VSC 行逐字有）；裁定 = 三端判据同源（设计「判据三端同源」句）+ TUI.md「消化轮收尾后」措辞 ⇒ CLI 实现 `upstream ? 0 : unsettledCount(agent)`。审计评 = 忠实。
2. **残余行 / 元素随终态行同门**：`n = 0 ∧ unsettled > 0` 为不可达组合（未销账条在起跑快照必计入 `n`）；沿「终态行之后再落一行」位次句。审计评 = 忠实且可证不可达。
3. **三端记录统一「> 0 才携」**：零噪音；跨批旧记录零回归三端各有腿（CLI-4 ∥ DSK-5 ∥ VSC-2）。
4. **桌面 `onDigest` 无条件归一键**（`unsettled: 0`）——后果 = 旧批腿 ⑦ `:629` 键面锁红（见「三」披露）。

### 六、披露（父侧需知）

- **表外两档**（设计 §6.31.9 未列）：`thincoder-desktop/renderer/page-read.mjs` ∥ `thincoder-vscode/webview/record-restore.js` —— 复列承接唯一缝，无更小实现面；前者已在桌面 PROJECT.md §4.2 自标「设计表外随落补入」，后者随 §5 本行披露。
- **设计档 §6.31.9 VSC 行点名**：表中「`suspension.mjs` +3 end 消息增 `unsettled`」与实况 **合**（实证同档）；但表中 `record-restore.js` 缺位（复列承接线）⇒ 供 #43 文档轮补登记。
- **doc-check 行数面**：19 条报告态差异中，本批四产品档（turn-face ∥ events-wake ∥ chat-digest-rows ∥ page-read）为新增漂移（本批未回填 SHELL/ACTIVITY/CHAT 行数表——按 §2 只允许「声明内两档随落 + §5」）。
- 行数口径注：设计 §6.31.9 记 `chat-digest-rows.mjs` 现行 274，本席实测基线 273（±1 = 读取器显示值口径，沿批档先例）。

**读数收正（内审自修后 as-built · 2026-10-05）**：代码评审 🔵 三采纳落地后两档行数后移——`thincoder-vscode/src/extension/suspension.mjs` 328 ⇒ **337**（+9；判据件装载前移带注释净 +3）∥ VSC 腿 `docs/batches/2026-10-05-digest-accounting-vsc.test.mjs` **178 行**（正控收正 +3）。上表相应两格（suspension 334 ∥ VSC 腿 175）以本行为准；桌面 PROJECT.md §4.2 行 5 的 VSC 腿行数已同拍收正为 178。其余八档读数与上表一致（复核实读）。

**§5 实施记录（eng-coder · 出口缝修正·第二笔（#44 披露①扩散面 ∥ 披露④稳健性候选 · 父侧裁定 2026-10-05 11:2x）· 2026-10-05）**

**落点表（file:line → Δ——as-built 实读）**

| # | 文件 | 落点 | Δ |
|---|---|---|---|
| 1 | `thincoder-core/agent/run-start.mjs` | fallback 支 `:65-86`；口径注释 `:33-36` / `:70-73` | 投递账分区（注入前）：`_daDelivered === true` 条不注入且留容器（原序）；缺省条逐字沿用取尽语义（先离容后注入 ∥ 注入顺序 ∥ `releaseSettledEntry` 面）。session 支 / abort 支零触 |
| 2 | `thincoder-core/agent/suspension.mjs` | `finishSuspension` `:143-162`；doc 块 `:122-126` | 单遍分区替换 `indexOf`＋`splice` 双查（`left` / 离容顺序 / 留容器顺序不缩水；未命中静默删尾失败类消除）。abort 支 / 无注入器径 / `reclaim` 调用点零触 |
| 3 | `thincoder-core/agent-tools/subagent-async.mjs` | D-SD5 墓碑注 `:397-403`（`writeTombstone` 调用 `:404`） | 父侧 11:3x 勘——「注入即消费（调用方随即从容器移除）」收正为条件句（会话态不随即离容器 ∥ fallback：缺省条取尽离容器——先离容后注入 / `_daDelivered` 条同判据跳过且留容器）；注释面 only，落点 / 时机零改 |
| 4 | `thincoder-core/agent/digest-account.mjs` | 模块头 `:14-16` | 同句族失效句收正（fallback = 零账目动作＋投递账跳过；「既有 `splice(0)` 路径」改述「取尽语义（先离容后注入）」）——**越清单披露项**（父侧未点名） |
| 5 | `docs/batches/2026-10-05-digest-accounting.test.mjs` | T-DA16 `:413-457`；档头 `:5` / `:12` | 新腿两面：① fallback 直驱（已投递条不注入 + 留容器 + 零释放 ∥ 缺省条照注入 + 原序 + 照释放 + 零账目动作）② 清场单遍分区顺序面复核（改前 / 改后同绿） |

**红绿两读（先红后绿——T-DA16）**

- 红读（修正行落前，同工作区）：`node --test docs/batches/2026-10-05-digest-accounting.test.mjs`（仓根 `thincoder/`）⇒ **pass 15 / fail 1**（T-DA16 红——首断言：已投递条留容器，`actual [] vs expected [161, 163]`；改前 fallback 支 `splice(0)` 全数注入 + 离容器）。
- 绿读（修复后复跑，同命令——终态树复跑同读数）：**pass 16 / fail 0**。

**门读数（终态树——四门）**

- ① 批内件 **16/16 绿**（T-DA1–T-DA10 / T-DA12–T-DA16 + 补充臂；含 T-DA15 三面零回归）。
- ② `node --check` 五触档（`run-start.mjs` ∥ `suspension.mjs` ∥ `subagent-async.mjs` ∥ `digest-account.mjs` ∥ 批内件）**5/5 exit 0**。
- ③ 相邻件复跑（终态）：`2026-10-01-timer-wake-delivery` **6/6** ∥ `2026-10-04-subagent-panel-live-face` **21/21** ∥ `2026-09-29-parity-b1-vsc-core-susp` **6/6**——零回退。
- ④ `node scripts/doc-check.mjs` **exit 0**（悬空 0 · 行宽 0 · 扫描域 docs 178 档；行数面差异 19 条 = 报告态——全为端面（desktop / render-core）行数账，非本轮触档）。

**审计与代码评审轮次（内部——终态 = clean / pass）**

- 审计（explore 只读 · 对父侧裁定逐点 + 批档 §2 终值 + 设计 §6.31）：**四类偏差 0**；观察 O1–O5（O1 = 设计档 §6.31 现文滞后——随 #43/#46；O2 = 本追加块落档即消；O3–O5 = 编号口径 / 注释笔误面）。
- 代码评审轮 1（advisor code）：**VERDICT pass**（0 🔴 · 0 must-fix；🟡×4 = 设计档滞后 ∥ 批内件 502 > 500 ∥ suspension 348 / subagent-async 469 越 300 存量；🔵×5 = 注释精确化 ×2 ∥ 文档卫生 ∥ 覆盖候选 ∥ 登记候选）。
- 代码评审轮 2（fix 复核——轮 1 🔵 #5/#6 注释精确化三处：`subagent-async.mjs:400-401` ∥ `run-start.mjs:35-36` ∥ `digest-account.mjs:15-16`）：**VERDICT pass**（两条 Fixed 实读在盘；未解决 🔴 = 0；无新增）。

**披露（如实登记）**

1. 🟡 **批内件越 >500 硬门**：`docs/batches/2026-10-05-digest-accounting.test.mjs` 现盘 **502 行（内容口径；读取器 503）**——本笔 +46（T-DA16 全块）即越线之笔；设计 §6.31.9 估 ≈160–220。父侧二择（拆档——拆点 = 出口缝两腿 ∥ 豁免登记——先例 `docs/batches/2026-09-30-cross-end-digest-recovery.md:496`「批内件 >500 = 裁豁免登记（890 行——批内件惯例，625 行先例在册）」）；本轮按任务书「禁全量重写」未擅拆（#44 披露 3 同款待裁）。
2. 🔵 **设计档 §6.31 失效句随 #43/#46 收正**（引用面）：`:857`「**逐字沿用**现有 `splice(0)` 取尽 + 注入 + `releaseSettledEntry`」∥ `:873` / `:1016`「fallback（无 `_daSession`）不受触（`_daDelivered` 恒缺省）」∥ `:981`「fallback 逐字沿用（一发注入，结果不丢）」；`:954`（T-DA7 行「逐字旧行为」）同拍——登记句不再结构性成立（本笔护支落码）。
3. 🔵 **设计档登记候选**（评审 🔵）：fallback 跳过条在纯 fallback 进程内无离容器路径（report / childAgent 长持）∥ `_daRetry` 在 fallback 不兑现重投（与 `shouldDeliverEntry` 不对称）——实现零改，设计侧补边界句。
4. 🔵 **注释面未收正面（域外）**：`async-settle.mjs:186`（「既有 `releaseSettledEntry` 逐字沿用——注入即释放」）∥ `:174-175`（「三消费点…」）——同句族另一处；供父侧并入注释轮清扫。
5. 越清单改动：**+1 档**（`digest-account.mjs` 模块头注释收正——父侧未点名；按「越声明如实披露」办）。父侧指定追加档 = `subagent-async.mjs`；端面 / 他舱 / 设计档零触（除本段经 batch 工具落档）。

**轮内实读行数（as-built——终态，内容行数口径）**：`run-start.mjs` = **152** ∥ `suspension.mjs` = **348** ∥ `subagent-async.mjs` = **469** ∥ `digest-account.mjs` = **186** ∥ 批内件 = **502**。

**§5 实施记录（eng-coder · 合规拆分笔（件①拆档 ∥ 件②注释收正 · 父侧裁定 2026-10-05 11:5x）· 2026-10-05）**

**落点表（file:line → Δ——as-built 实读）**

| # | 文件 | 落点 | Δ |
|---|---|---|---|
| 1 | `docs/batches/2026-10-05-digest-accounting-exit-seam.test.mjs`（新增 · 165 行） | 档头 `:1-13` + 自足夹具 `:25-70` + T-DA15/T-DA16 全块 `:72-165` | 出口缝两腿**纯搬移**（腿块 94 行逐字节等值——备份对照脚本实跑）；档头 = 拆档注 / 行数注（165 ∥ 408）/ 跑法 / 逐字零改声明 |
| 2 | `docs/batches/2026-10-05-digest-accounting.test.mjs` | 删原 `:364-458`（95 行）；档头 `:5-7` 替换原 `:5-6`（净 +1）+ `:13` 替换原 `:12`（1:1）、`:4` 未动 | 502 ⇒ **408 行**（内容口径）；腿号清单改「出口缝两腿已拆档至出口缝档」+ 行数注新增 + 红读句收正 |
| 3 | `thincoder-core/agent-tools/async-settle.mjs` | `releaseSettledEntry` 注 `:170-178`（7 行 ⇒ 9 行，+2） | 三消费点句条件句收正：fallback 面（无 `_daSession`）注入完成后调本 helper（逐字沿用）∥ 会话态（`_daSession`）注入后改调 `releaseChildHold`（仅释放 `childAgent`——`report` 保留至销账 / 升级；§6.31.4 ∥ KD-DA7）；注释面 only 零行为；对句 = `:185-189` |

**红绿读数（两档——拆前基线 ⇒ 拆后）**

- 拆前基线（备份 = 拆前原档，实跑复证）：**pass 16 / fail 0**。
- 拆后：宿主档 **14/14 绿** ∥ 出口缝档 **2/2 绿**——合计 **16/16**（纯搬移无红态；腿块逐字节对照 + 两档实跑双证）。
- 命令（仓根 `thincoder/`）：`node --test docs/batches/2026-10-05-digest-accounting.test.mjs` ∥ `node --test docs/batches/2026-10-05-digest-accounting-exit-seam.test.mjs`。
- 逐字核证（脚本实跑）：出口缝档末 94 行 = 备份 `:364-457` 逐字节等值；宿主档 = 备份 − `:364-458` + 档头三处（重构等式实跑成立）；夹具子集逐块对照在（唯二处行尾注释按本档实况收正：CORE 行尾注删未用导出 `ContinueError` ∥ SUSP 行尾注 `poolLive` ⇒ `finishSuspension`）。

**门读数（终态树）**

- ① `node --check` 三触档（宿主档 ∥ 出口缝档 ∥ `async-settle.mjs`）**3/3 exit 0**。
- ② `node scripts/doc-check.mjs` **exit 0**（悬空 0 · 行宽 0 · 扫描域 docs 178 档；行数面差异 19 条 = 报告态存量——与拆前同数）。注：锚扫描域 = `.md` 全量（`scripts/doc-check-targets.mjs`——批内件 `.mjs` 结构上不入锚域，拆前 / 拆后同）。
- ③ `node scripts/prompt-refs-check.mjs` **exit 0**（提示词面 80 档 · 代码面 418 档 · 命中 0）。

**审计与代码评审轮次（内部——终态 = clean）**

- 审计（explore 只读 · 对三档 + 拆前备份 + 设计 §6.31）：**偏差 = PARTIAL ×1（时序面——§5 append 未落，本块落档即消）**；其余 SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST = 0；逐点核证含：腿块 94/94 行哈希配对等值 ∥ 宿主 = 备份 − 删除段 + 档头三处（块外零改全覆盖）∥ 新档自足 / 无占位残留 ∥ 注释收正与实况一致（`run-start.mjs:39/:54` ∥ `:65/:84` ∥ `run-stages.mjs:280/:288`）。
- 代码评审轮 1（advisor code）：**VERDICT pass**（0 🔴 · 0 must-fix；🟡3 = 两档 300 软线在册存量 ×2 + 设计档 doc-state 滞后 ∥ 🔵4）。处置：🔵 #6（出口缝档头 `:8-9`「经真 `runAgent` 一轮贯通」对本档多腿不成立）**采纳自修**（收正为「两腿主体直驱核件 `finishSuspension` / `startSuspension` ∥ T-DA16① 另经真 `runAgent` 一轮」）；🔵 #4 由本块落档覆盖；🟡3 / 🔵 #5 / #7 = 在册 / 域外 / 与设计同源——有据非修。
- 代码评审轮 2（fix 复核）：**VERDICT pass**（Fixed 1 · Accepted 4 · Unfixed 2〔均 🔵 非阻断〕· 新发现 0 · 🔴 0）；收正后复跑：出口缝档 **2/2 绿** ∥ 腿块字节等值复证 ∥ 行数面 165 ∥ 408 不变。

**披露（如实登记）**

1. 越清单改动：**无**（轮内 Δ = 三档：两批内件 + `async-settle.mjs` 注——父侧点名面；设计档 / 端面 / 他舱零触）。
2. 夹具自足子集两处行尾注释收正（非腿面——新档自足子集所携，按本档实况；腿块逐字零改已在盘）。
3. 拆前备份 `.thincoder/tmp/da-split-backup.test.mjs`（tmp 面——逐字对照参照物；非交付面）。
4. 🔵 同句族域外实例（未触——供父侧）：`escalate-async.mjs:109-111`「消化注入完成后由 `releaseSettledEntry` 置 null」句；`async-settle.mjs:185-189` 对句在册（评审 🔵 #5 归入注释轮）。

**§5 实施记录（eng-coder · 注释族清扫（最后一件）· fix 轮（#47 披露④ + 父侧扩令全族扫）· 2026-10-05）**

**落点表（file → 落点 → Δ——as-built 实读）**

| # | 文件 | 落点 | Δ |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/escalate-async.mjs` | 点名处注释块（原 `:109-111` 三行 ⇒ 现 `:109-113` 五行） | 「**消化注入完成后由 `releaseSettledEntry` 置 null**」无条件句 ⇒ 条件句：**消化注入完成后释放**（池内未消化窗口不释放——表 2 候选 2 否决）；fallback 面（无 `_daSession`）由 `releaseSettledEntry`（async-settle.mjs）置 null（逐字沿用）；会话态（`_daSession`）注入后改调 `releaseChildHold`（仅释放 `childAgent`——`report` 保留至销账 / 升级；§6.31.4 ∥ KD-DA7）。措辞 = 范式 `async-settle.mjs:170-178` 逐字对读；注释面 only 零行为 |
| 2 | `thincoder-core/agent-tools/subagent-panel.mjs` | 族扫描变体域新发现（原 `:260-261` 两行 ⇒ 现 `:260-262` 三行） | 「（注入即从两者移除）」无条件句 ⇒ 两态：fallback 面注入即从两者移除；会话面注入后不随即移除——留容器至销账 / 升级，移除 = `accountDigestRound` 的 splice；§6.31。**越点名面披露项**（内审独立复核所得——与本批第二笔父侧勘「注入即从容器移除」同句类）；注释面 only 零行为 |

**族扫描二分表（`thincoder-core/**` · 四式 + 变体补扫——逐处实读）**

- 四式 = `releaseSettledEntry` ∥ 「注入完成后」∥ 「消化注入」∥ 「置 null」（含 `置null`）；变体补扫 = 置空 ∥ 释放 ∥ 驻留 ∥ 注入即 ∥ 随即 ∥ 从容器 / 从两者 / 离容器 / 留容器 ∥ 消费点 ∥ 保留至销账 / 重投需原文 ∥ 条目持有。句族判读口径 = 语义类；域 = `thincoder-core/**`（父侧扩令；`#47` 披露④ 用语「同句族域外实例」同口径）。

| 处（file:line） | 判读 |
|---|---|
| `escalate-async.mjs:109-113`（点名处） | **已修**（失真——无条件句收正为条件句） |
| `subagent-panel.mjs:260-262`（变体域） | **已修**（失真——「注入即从两者移除」无条件句收正为两态） |
| `async-settle.mjs:170-178` | 已真值（范式——#47 已收正；本笔对句来源） |
| `async-settle.mjs:185-189`（含 `:188`「注入即释放」句） | 已真值（对句——fallback 面零调用 + `releaseSettledEntry` 逐字沿用；「注入即释放」为 fallback 限定句——注入条释放时机为真） |
| `digest-account.mjs:5-6 / :14-16 / :78 / :80 / :164` | 已真值（三角色 / fallback 零账目动作 / 覆盖离容器 + 释放 / 升级离容器 / 残余判据） |
| `run-start.mjs:33-36 / :46-47 / :54 / :68-73` | 已真值（两态分区注释——会话留容器 ∥ fallback 取尽 + 投递账跳过） |
| `run-stages.mjs:287-288` | 已真值（消费点①——`suspDriven=false` 支径专属；会话内回合由端驱动置 `suspDriven: true`——CLI `agent-turn.mjs:193` 实证） |
| `subagent-async.mjs:397-403` | 已真值（本批第二笔已收正——条件句） |
| `suspension.mjs:9 / :120 / :124 / :145-149 / :238` | 已真值（清场投递账过滤 / 会话标记） |
| 代码面（`digest-account.mjs:23` ∥ `:100` ∥ `run-stages.mjs:16` ∥ `:288` ∥ `run-start.mjs:38` ∥ `:84` ∥ `async-settle.mjs:179` ∥ `:190`） | 零动（代码非注释——结构性命中） |
| 族外字面命中（逐处实读零动）：会话信号快照 `subagent.mjs:317` ∥ 槽位 `peer-instances.mjs:48/:52` ∥ `process-probe-exec.mjs:25` ∥ tpm `provider/rate.mjs:93` ∥ 测试缝缓存 `peer-domains.mjs:54` ∥ `shell-candidates.mjs:12/:32` ∥ `shell-identity.mjs:79` ∥ 中止面 `subagent-spawn.mjs:316` ∥ `subagent.mjs:284` ∥ `session-store.mjs:121` ∥ 槽释放 / 取消面 `subagent-scheduler.mjs:188/:279` ∥ `advisor-async.mjs:249` ∥ `subagent-async.mjs:251` | 零动（机制无关） |

**复扫读数（终态树）**：四式 + 变体复扫——族内 0 处失真残留；命中集 = 上表（已修 ×2 ∥ 已真值 ×7 组 ∥ 代码面 ×8 ∥ 族外字面命中零动）。端面只读复核（CLI / 桌面 / VSC）：同族命中 = CLI `suspension-drive.mjs:172` 自述 + `:181` 调用（宿主注入器行为本体，非失真）——无同族失真成员；域外零触（tmp / dist 副本非交付面）。

**门读数（终态树）**

- ① `node --check` 两触档（`escalate-async.mjs` ∥ `subagent-panel.mjs`）**exit 0**（stderr 空）。
- ② 批内件复跑（终态树）：宿主档 **14/14 绿** ∥ 出口缝档 **2/2 绿**（合计 16/16——注释面 only 零回归）。
- ③ `node scripts/doc-check.mjs` **exit 0**（悬空 0 · 行宽 OK · 扫描域 docs 178 档；行数面差异 18 条 = 报告态存量，非本笔——本笔零触 docs 面）。
- 无红绿对（注释面 only——零行为改动，先红后绿无适用面；以批内件复跑 + `node --check` 作零回归读数）。

**审计与代码评审轮次（内部——终态 = clean / pass）**

- **审计（explore 只读 · 对设计 §6.31.4 / §6.31.5 / 范式 / 批档）**：受审注释块本体四类偏差 = **0**；2 项 PARTIAL——① §5 未落档（时序面：落档即消——本块落档即消）；② 变体域候选 `subagent-panel.mjs:260`（判「族内残留」倾向）⇒ **自修**（如上落点表 #2；① 由本块消）。终态 = **clean**。
- **代码评审轮 1（advisor code）**：**VERDICT pass**（0 🔴 · 0 must-fix；🟡×2 = >300 软线在册存量 ∥ 设计档 §6.31.9 数账滞后（#43/#46 域）；🔵×1 = panel 句边界点注候选——非阻断）。无修项 ⇒ 无轮 2（无「修复声明」可核——轮 1 pass 即收敛）。宿主引文机核报 0/10 不符——本席对判定相关引用逐处实读复核（两注释块 ∥ `run-start.mjs:76-77` ∥ 设计档 `:855` / `:857` / `:915` / `:945` / `:986` / `:1002` ∥ `AGENT-LOOP-SUBAGENT.md:930`）**逐字在盘** ⇒ 判机核读数差异（非内容失真），如实登记——不影响评审结论采信（所依盘面已由本席独立复核）。

**评审轮 1 响应表**

| # | 评（面） | 级 | 条目 | 响应 |
|---|---|---|---|---|
| 1 | `escalate-async.mjs`（309 行内容口径）∥ `async-settle.mjs`（326 行） | 🟡 | >300 软线（存量在册 · R3 只报不升） | **不改**（沿在册登记；注释笔零新债——零新职责 / 零新导出；拆分随结构触碰） |
| 2 | 设计档 §6.31.9（`:915`） | 🟡 | `async-settle.mjs` 行仍记「302 / +7」（现盘 326）；本笔两档未入受影响清单 | **设计档零触**（本席禁令）；两档「注释面 only——不入 §6.31.9 受影响清单」由本块登记；数账重锚随 #43/#46 文档域 |
| 3 | `subagent-panel.mjs:260-262` | 🔵 | fallback 半句未点注 #45 跳过支边界（设计 §6.31.12-2 已登记为边界非缺陷；该边界下 `digested:false` 偏保守——安全方向） | **记录不改**（可选精确化；句为真——跳过条无注入，「注入即移除」不涉；如需点注由父侧纳 #43/#46） |

**披露（如实登记）**

1. **越点名面改动 +1 档**：`subagent-panel.mjs`（族扫描变体域新发现——内审独立复核；判据 = 句族 = 语义类、域 = `thincoder-core/**`；与本批第二笔父侧勘同句类）——按「越声明如实披露」办。
2. **宿主引文机核观察**：评审回执附机核 0/10 不符——本席逐处实读复核为逐字在盘（见审计与评审轮次块）；如父侧另有机核口径，可复查。
3. 🔵 设计档 §6.31.9 数账滞后（`async-settle.mjs` 302 ⇒ 现盘 326；本笔两档缺行）——#43/#46 域，未触。
4. 边界确认：端面（CLI / 桌面 / VSC）零触 ∥ 设计档 / 需求档零触 ∥ 批档 §1-§4/§6 零触（本块除外）。

**轮内实读行数（as-built——内容口径；读取器显示值 +1）**：`escalate-async.mjs` = **309**（读取器 310；原 307）∥ `subagent-panel.mjs` = **273**（读取器 274）∥ `async-settle.mjs` = **326**（读取器 327）。

## §6 验证与收口（父代理）
