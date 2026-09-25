# 2026-09-25 · file-tier-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 12:57「这七批都派出去」——技术待办排批 · 批 1/7：文件档位轮（条目 #91/#254/#301）。
> 台账 = #91 / #254 / #301（技术待办 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（任务书指针 = 本档 §2 · 条目细节以台账 evidence 为准——派单逐条自本档重导，禁从兄弟批转录）：

| # | 条目 | 现读数 / 要点 | 面 |
|---|---|---|---|
| #91 | VSC 设置面四档拆分（②③④ 在册） | chat-panel **498**（触发线 490 已越 · 硬限 500 余 2 行）· settings 410 · settings-tools 399 | VSC |
| #254 | 300 线 / 超限档拆分轮 | VSC 546/514 · CLI 474 等 300+ 档（含 edit-arg-guard 批新增四档读数——见条目 evidence） | 双端 |
| #301 | 超软线档读数漂移刷新 + 补登轮 | dispatch 493 · subagent-actions 495 · advisor-async 481 · shared 467 · agent.mjs 436（as-of 09-19，批内现刷）+ context.mjs 495 无计划行 | 核 |

**边界**：拆分 / 归册 / 读数刷新型——零行为变化；拆分后各档 ≤500 硬限；读数以批内实测为最终值。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 pass（0🔴 / 4🟡 / 6🔵）· fix 轮十项逐条落位（见 §2 修正轮块）· 待用户批准（§4））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2 设计（initial 轮 · 2026-09-25 · eng-designer · 承 §1 三条目 #91 / #254 / #301）

**需求源与三方链**：本批三条目 = §1 条目表；条目细节以台账 evidence 为准（本设计不新增需求条目）。三方链 = §1 → 本 §2 → 设计档落位（VSC-DEBT §12.1 追加块 + §13 新节 · CORE-UNIFICATION §2.8.1 刷新/补登 · CLI 面登记 = 本段）；需求档（`docs/vsc/requirements/PROJECT.md` / `docs/cli/requirements/*`）零改——需求面同步项 = 上抛 3。

**一、条目覆盖表（逐条）**

| # | 条目 | 覆盖 | 处置 |
|---|---|---|---|
| #91 | VSC 设置面四档拆分（②③④ 在册） | ✅ | ② `chat-panel.mjs` **497**：触发已到（余量 ≤5 · 越 490 · 已被 `bf145af5`/`bac3046d` 触碰）⇒ **本批拆分执行**（S1）；③ `settings.mjs` **409** / ④ `settings-tools.js` **398**：触发未到（净增 ≥40 / 下次触碰均未到）⇒ **计划重锚 + 读数刷新**（S5-③④），零执行 |
| #254 | 300 线 / 超限档拆分轮 | ✅ | 执行集合 = ① `busy-injection-vsc.test.mjs` **546**（越 500 硬限——无豁免通道）· ② CLI `busy-injection.test.mjs` **474**（前批登记「用例按族分档 · 下批执行」⇒ 本批即该轮）· ③ VSC `src/agent.mjs` **496**（逐档触线 >495 **已越**——单源 = VSC-DEBT §12.1）；`chat.css` **514** = 维持 CSS 不入门（零拆 · 读数刷新 · 引证 = KD-22）；edit-arg-guard 四档 = 评估落定（core 2 档补登 §2.8.1 / CLI 2 档登记于本段，均不执行）；其余 300+ 档 = 归册/读数刷新（刷新面见下，口径 = 逐项登记、非全量普查） |
| #301 | 超软线档读数漂移刷新 + 补登轮 | ✅ | CORE-UNIFICATION §2.8.1 逐行复测刷新 + **补登 3 行**：`context.mjs` **440**（立案「无计划行」——补计划）· `tools/edit-diff.mjs` **415** · `tools/file.mjs` **468**（后两档 = #254 四档评估的 core 半）；计数句同步（在册 **46** · 已登 **18** · 待补 **28**）+「距硬限最近五档」重排（**496 / 495 / 495 / 491 / 481**） |

**二、设计档落点**

| 面 | 落点 | 内容 |
|---|---|---|
| VSC | `docs/vsc/design/VSC-DEBT.md`：§12.1 追加 2026-09-25 块 + **§13 新节**（设置面拆分与超限档拆分）+ 变更记录 | S1 / S2 / S3 拆分设计 + S5 登记刷新 + KD-20–KD-26 + 验收 |
| 核 | `docs/core/design/CORE-UNIFICATION.md` §2.8.1：就地刷新 + 补登 3 行 + 计数句 + 变更记录 | S6 读数刷新与补登 |
| CLI | 设计档零改（理由 = 用例号零改 ⇒ 既有文档锚零动、无判据变更；CLI 无档位登记册——登记面缺口 = 上抛 2）；CLI 面登记（busy-injection 拆分方案 · `model-picker.mjs`「不预拆」现状刷新 · edit-arg-guard CLI 两档评估）= 本段 S4 / S5 | — |
| 批档 | 本 §2（任务与设计 · 实测读数 · 验收对照） | — |

**三、实测读数表（`wc -l` 口径 = `readFileSync(utf8).split("\n").length - 1`，与核机检同口径；as-of 2026-09-25 设计轮实读；**批内实测为最终值**——实施轮交付前复测，差异以实施轮实测为准并收正）**

> 本表 = 本批扫描面（三树 >300 共 120 档）中「越 500 ∨ ≥490 ∨ 已有登记 ∨ 本批触碰」四类并集；纯中段未登记档不在本表（非全量普查口径，先例 = VSC-DEBT §12.1 既有注）。

| 档 | 读数 | 处置 |
|---|---|---|
| `thincoder-vscode/src/extension/chat-panel.mjs` | **497**（余 3） | 拆（S1） |
| `thincoder-vscode/test/busy-injection-vsc.test.mjs` | **546**（越 500） | 拆（S3） |
| `thincoder-vscode/src/agent.mjs` | **496**（触线 >495 已越） | 拆（S2） |
| `thincoder-vscode/webview/chat.css` | **514**（越 500） | 零拆（CSS 不入门 · KD-22）+ 读数刷新 |
| `thincoder-vscode/webview/controls.css` | **658** | 同上（同族先例：since 2026-09-18 已裁零拆分） |
| `thincoder-vscode/webview/ui.js` | **494** | 归册（首次登记）；触发 = 下次实质触碰 ∨ 余量 ≤5——未到 |
| `thincoder-vscode/test/async-parity.test.mjs` | **492** | 归册（自冻结批档转登记）；计划 = 用例族切面；触发 = 越 500 前 ∨ 下次实质触碰 |
| `thincoder-vscode/test/session-boot.test.mjs` | **490**（余 10） | 读数刷新；触发（∨ 余量 ≤5）未到 |
| `thincoder-vscode/test/workspace-guard.test.mjs` | **487** | 读数刷新（无拆分义务） |
| `thincoder-vscode/src/extension/settings.mjs` | **409** | 计划重锚（S5-③） |
| `thincoder-vscode/webview/settings-tools.js` | **398** | 计划重锚（S5-④） |
| `thincoder-vscode/src/extension/suspension.mjs` · `src/agent/run-stages.mjs` · `src/agent/setup.mjs` · `src/agent/execute-tools.mjs` · `src/extension/panel-messages.mjs` · `src/extension/panel-session.mjs` | **447 / 421 / 421 / 417 / 357 / 312** | 读数刷新（触发均未到：>450 面两档未越；>497 未越） |
| `thincoder-cli/test/busy-injection.test.mjs` | **474** | 拆（S4） |
| `thincoder-cli/src/tui/model-picker.mjs` | **499**（余 1） | 零拆（登记 =「触发式 · 不预拆」——触发 >500 未到 · 先例判据逐字见 2026-09-19-cli-delete-confirm §:91/:197）；读数刷新 |
| `thincoder-cli/test/edit-tool-improvement.test.mjs` | **446** | 评估落定（S5-⑤ · 不执行） |
| `thincoder-cli/src/acp/bridge.mjs` | **394** | 评估落定（S5-⑤ · 不执行） |
| `thincoder-core/agent/dispatch.mjs` | **496**（距硬限 4） | #301 刷新（不得再增量） |
| `thincoder-core/agent-tools/subagent-actions.mjs` | **495**（距硬限 5） | #301 刷新 |
| `thincoder-core/provider/responses.mjs` | **495** | #301 刷新（读数未变） |
| `thincoder-core/provider/core.mjs` | **491** | #301 刷新（次优先面） |
| `thincoder-core/agent-tools/advisor-async.mjs` | **481** | #301 刷新 |
| `thincoder-core/tools/shared.mjs` | **471** | #301 刷新 |
| `thincoder-core/agent-tools/consult.mjs` | **471** | #301 刷新（次优先面） |
| `thincoder-core/tools/file.mjs` | **468** | 补登（S6 · 次优先面移出） |
| `thincoder-core/agent-tools/subagent-async.mjs` | **456** | #301 刷新（次优先面） |
| `thincoder-core/memory/schema.mjs` · `git/checkpoint.mjs` · `session-store.mjs` | **453 / 444 / 441** | #301 刷新（次优先面） |
| `thincoder-core/agent.mjs` | **442** | #301 刷新 |
| `thincoder-core/context.mjs` | **440** | 补登（S6 · 立案「无计划行」） |
| `thincoder-core/tools/edit-diff.mjs` | **415** | 补登（S6） |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | **407** | #301 刷新（跌破 ≥437——次优先面移出，仍在册） |
| `thincoder-core/model-specs.mjs` · `test/model-specs.test.mjs` · `test/provider-merge.test.mjs` · `process-probe.mjs` · `session-lifecycle.mjs` | **348 / 477 / 306 / 315 / 318** | #301 刷新（行 13/14 · 行 12 · 行 13 · 行 10 · 行 11） |

（口径注：父侧 §1 行内 `chat-panel 498` / `settings 410` / `settings-tools 399` / `chat.css 515` 等 = read 含末行口径，与 `wc -l` 差 1——本表一律 `wc -l`，以本表为准。）

**四、机制设计（逐拆点 / 新档划分 / 索引登记 / 缝 / 零行为判据）**

> 总则（本批全部拆分共用的零行为变化判据，逐条可机检）：① **对外缝零改** = 既有导出名 / 调用点 / import 行逐字不变（re-export 或类内薄委托实现）；② **纯结构搬移** = 逐字搬迁（注释随迁）· 零改名 · 零新分支 · 零顺手优化；③ **用例零改** = 既有用例断言零改（例外 = 点名允许更新的结构锚档，逐处列名）；④ **协议面零改** = `postMessage` 形态/判别式集不变（协议两机检档绿）；⑤ **全绿** = 三树 `npm test` 全绿、计数不降；⑥ **行数** = 拆分后各档 ≤500 硬限（越线档回归触发线以下）。

**S1 · `chat-panel.mjs` 497 → 目标 ≤430（#91 ②）**

- **拆点**（as-of 2026-09-25 实读）：**Settings 段整段 `:334-418`**（≈85 行）= 委派族（`_providerStatus` :336 · `_saveProviderKey` :337 · `_deleteProviderKey` :338 · `_saveMcpServer` :339 · `_deleteMcpServer` :340 · `_setAutoApprove` :342-350 · `_setPlanMode` :359-368 · `_engineeringOn` :371-373）+ 推送链（`_pushStatus` :375-377 · `_pushSettingsLight` :385-396 · `_pushSettings` :398-408）+ `_agentSettingsSession` :413-418。
- **新档**：`thincoder-vscode/src/extension/panel-settings-push.mjs`（登记名沿用 2026-09-18-vsc-settings-wiring §2.3 登记案；**拆面由原案「推送面 ≈40 行」扩为「Settings 段整段」**——立案后该档 424 → 497（+73 漂移）且原案不足以脱离触发线；KD-21）。
- **缝**：类内薄委托——`ChatPanel` 保留同名方法（每方法一行委托给新档导出函数，传 `this`）；`_pushSettings` 内对 `_pushMcpStatus` / `_pushIndexStatus` 的调用**经 panel 实例**（新档函数持 `panel` 参数直呼，零注入、零环）。
- **外部调用点零改（逐面点名）**：`_pushSettingsLight` 11 处（`panel-callbacks.mjs:162,163` · `panel-messages-settings.mjs:95,108,111,145,158,167,181,195,201`）· `_pushSettings` 7 处（`panel-index.mjs:117` · `panel-messages-settings.mjs:61,64,77,86,88,99`）· `_pushStatus` 4 处（`panel-messages-settings.mjs:73` · `panel-messages.mjs:312` + 档内两处）· `_agentSettingsSession` 3 处（`image-handler.mjs:121` · `panel-messages.mjs:311`）。
- **机检锚影响（允许更新的结构锚 · 逐处列名）**：`test/settings-open-snapshots.test.mjs:163-185` 链集常量——含 `shellCandidates` 字面的源档集合，换位 `chat-panel.mjs` → `panel-settings-push.mjs`（该锚 fail-closed 设计即要求同轮更新）；其余锚自动通过（`engine-floor-guard` 静态闭包动态计算 · `protocol-coverage` 只校验形态集与判别式 · `zero-sync-exec` 只读 settings.mjs）。
- **索引登记**：VSC-DEBT §12.1（读数 + 触发状态）· §13.2（本设计）· `thincoder-vscode/AGENTS.md:56` 模块地图行随批并入新档名（产品文本面 · 实施轮）；`test/files.mjs` 零改（无新测试档）。
- **验收**：`chat-panel.mjs ≤430` ∧ 新档 `≤300` ∧ 消费面文件 `git diff --stat` = 空（缝零改）∧ VSC `npm test` 全绿。

**S2 · VSC `src/agent.mjs` 496 → 目标 ≤460（#254 ③）**

- **拆点**（as-of 2026-09-25 实读）：**响应后处理段 `:300-344`**（≈45 行）= `traceStop` :300 · 内置工具结果本地化 :302-313 · interrupt 提交 :315-324 · usage 记账 :326-334 · 流规则 abort 消费 :336-340 · 响应提醒注入 :342-344（登记候选逐字 = 「响应后处理段（builtin / interrupt / reminders）」· VSC-DEBT §12.1 :276/:283）。
- **新档**：`thincoder-vscode/src/agent/response-stages.mjs`（拟新增 · 登记名沿用）。
- **搬运契约（控制流）**：段内三处控制流须保真——interrupt 提交段的 `throw`（helper 内抛出 ⇒ 随调用栈自然传播，**调用点必须在主 `try`（`:182-478`）内**）；流规则 abort 的 `continue`（helper 回传判别式 `{action:"continue"}`、调用侧翻译 `continue`——先例 = VSC-DEBT §12.2.1 段 A `{done:true}` 式）；usage 记账的 `callbacks.onUsage?.()` 与 agent 字段写点（`:331-332`）随迁。入参面 = `{agent, history, fullHistory, response, provider, callbacks, cfgVerifyGuard}`（实施轮按实读定形）。
- **残余**：`:346-409` 提交分支（no-tool-call 提交 / 工具调用提交）**留档**——列该档下一轮候选；触发句 `>450` 保持有效。
- **机检锚影响**：`test/upstream-parity.test.mjs:207-215`（字符串计数锚——查 `drainChildUpstream`/`composeTurnDomain` 在 agent.mjs 的计数，不受本次搬移影响）· `test/integration/reasoning-echo-live.test.mjs:97-99`（`assistantToolCallMessage(` 在 agent.mjs 计数 == 1——该调用住在 `:400` 提交分支，留档 ⇒ 计数不变）。**两锚零改**（实施轮复跑确证）。
- **验收**：`agent.mjs ≤460` ∧ 新档 `≤300` ∧ VSC `npm test` 全绿 ∧ 上述两锚零破。

**S3 · `busy-injection-vsc.test.mjs` 546 → 两档（#254 ① · 越 500 硬限）**

- **拆点**（按用例族 + 夹具自持，as-of 实读段界）：**迁出组 = webview 引导族**——T-V16-1 `:85-103` · 4a `:105-122` · 4b `:124-133` · 5 `:135-163` · 8 `:167-189` + **T-V19 `:493-523`**（该例为全档唯一同时消费 `W` 与 `protoPanel` 者——与引导族同组即闭合唯一跨组硬耦）+ `before`/`after` `:38-65` + `W`/`capturedPosts`/`resetSend` `:34-83` + `protoPanel` `:465-491`；**留守组 = 桩面板族**——T-V16-2 `:226-254` · 7 `:267-288` · 3 `:290-307` · 3b `:309-333` · 4c `:335-346` · 6 `:357-410` · 10 `:412-444` · 5b `:446-461` + T-V21 `:525-546` + `stubPanel`/`withWarnings`/`sessionPanel`/`settle`/`BUSY_IMG`/`busyItem`。
- **新档**：`thincoder-vscode/test/busy-injection-vsc-webview.test.mjs`（≈250 行预计）；原档留守（≈300 行预计）。
- **用例号零改零重排**（`T-V16-*` / `T-V19` / `T-V21` 逐字随例搬迁——文档侧用例号锚判据 = 串在 test 树内，与文件名无关）。
- **索引登记**：`test/files.mjs` **+1 行**（新档登记 + 行内注释记拆分理由——先例 `queue-visible-shell.test.mjs` 登记行）；既有登记行 `:19` 的注释与现盘漂移（仍写「T-V16-1…4 + 3b」）**同轮收正为实际覆盖面**。
- **验收**：两档各 `≤500`（目标各 ≤300）∧ VSC `npm test` 全绿 ∧ 用例计数守恒 **15 = 6 + 9** ∧ `slow(` 零因（拆分不触归册面）。

**S4 · CLI `busy-injection.test.mjs` 474 → 三档（#254 ② · 登记「用例按族分档 · 下批执行」兑现）**

- **拆点**（按驱动机制 + 夹具自持，as-of 实读）：**① 渲染/状态栏族** → 迁 `busy-injection-render.test.mjs`：T-F16-6 `:271-300` · 10 `:315-327` · 11 `:329-336` · 12 `:338-357` · 14 `:378-396` · 17 `:432-438` + `convState`/`convText` `:306-313`；**② 消费/送达/步边界族** → 迁 `busy-injection-consume.test.mjs`：T-F16-2 `:127-135` · 9 `:236-251` · 5 `:255-267` · 15 `:398-408` · 16 `:410-430` · 18 `:440-458` · 19 `:460-473` + `turnRig` `:95-125` + `RECEIPT`；**③ 留守 = 按键门 + 入队族**：T-F16-1 `:71-91` · 3 · 4 · 8 · 13 + `keyCtx`/`pressEnter`。
- **新档**：`thincoder-cli/test/busy-injection-render.test.mjs`（≈130）· `thincoder-cli/test/busy-injection-consume.test.mjs`（≈160）；原档 ≈240。
- **夹具自持**：`baseState`/`stripAnsi` 为两新档共用件 ⇒ **就地重定义**（各档自持副本，零跨档 import——先例 = model-specs 家族 helpers 就地重定义）；用例号零改零重排；CLI 运行器（glob）零改 ⇒ **零登记动作**。
- **验收**：三档各 ≤500（目标各 ≤300）∧ CLI `npm test` 全绿 ∧ 用例计数守恒 **18 = 6 + 7 + 5**。

**S5 · 登记刷新（归册 / 计划重锚 · 零执行）**

- **③ `settings.mjs` 409**：登记案重锚（2026-09-18-vsc-settings-wiring §2.3 行 5）——环境面七件现读区间（`shellCandidates` :88-115 · `proxySettings` :224-227 · `websearchSettings` :230-233 · `saveWebsearchKeyFromPanel` :236-243 · `deleteWebsearchKeyFromPanel` :246-252 · `saveProxySettingsFromPanel` :276-287 · `testProxyConnection` :291-314 ≈91 行）→ `settings-env.mjs`（缝 = re-export）；触发 = 净增 ≥40 ∨ 下次触碰（代理/检索面）——未到。
- **④ `settings-tools.js` 398**：登记案重锚（同行 2）——MCP 面现读区间（`renderMcpList` :165-230 · `updateMcpTestResult` :233-241 · `updateMcpTools` :244-263 · `parseHeadersLike` :356-369 · `openMcpForm` :373-393 · `kvToInput` :396-398 · `bindToolsControls` MCP 段 :99-146 ≈170 行）→ `settings-mcp.js`；触发同上——未到。
- **⑤ edit-arg-guard 四档评估落定（#254 · 「下一拆分轮一并评估」兑现）**：core 两档 = **补登**（S6 · `edit-diff.mjs` 415 三面候选 / `file.mjs` 468 按工具族四面候选；触发 = 越 500 前 ∨ 下次实质改动）；CLI 两档 = **登记不执行**（`bridge.mjs` 394 = 两面候选〔桥 edit 路由族 / 历史回放〕；`edit-tool-improvement.test.mjs` 446 = 核例族/桥例族二分〔候选档名 `edit-bridge.test.mjs`〕；触发同上；本轮零新增用例增量仍 < 500）。
- **其余归册**：`ui.js` 494（首次登记 · VSC-DEBT §12.1）· `async-parity.test.mjs` 492（自冻结批档转正登记 + 计划「用例族切面」）· `session-boot.test.mjs` 490 / `workspace-guard.test.mjs` 487 / `suspension.mjs` 447 / `run-stages.mjs` 421 / `setup.mjs` 421 / `execute-tools.mjs` 417 / `panel-messages.mjs` 357 / `panel-session.mjs` 312 / CLI `model-picker.mjs` 499（「不预拆」现状 + 余量 1 注）——读数刷新（触发未到，零动作）。
- **CSS 类**：`chat.css` 514 · `controls.css` 658 = 维持「CSS 不入门」（零拆分计划 · 读数刷新为记录值——KD-22）。

**S6 · 核面读数刷新 + 补登（#301 · CORE-UNIFICATION §2.8.1 就地刷新）**

- **刷新面**（值 = §三 表）：主表行 4/5/6/7/8/9/11 + 子表行 1/4/5/6/8/9/11/14 + 计数句（在册 **46** · 已登 **18** · 待补 **28**）+「距硬限最近五档」重排 + 次优先面重排（≥437 **六档**：`provider/core` 491 · `consult` 471 · `subagent-async` 456 · `memory/schema` 453 · `git/checkpoint` 444 · `session-store` 441；`tools/file.mjs` 补登移出 · `subagent-spawn.mjs` 407 跌破移出）。
- **补登 3 行**：子表行 15 = `context.mjs` **440**——拆点 = 压缩族（`applyCompression` :184-275 · `compressIfNeeded` :275-354 · `compressFallback` :380-393 · `shrinkOversized` :403-435 ≈180 行）外提 `context-compress.mjs` 式姊妹档；余 ≈260（触发 = 越 500 前 ∨ 下次实质改动）。子表行 16 = `tools/edit-diff.mjs` **415**——拆点 = 守卫/校验族（`assertEditArgsExclusive` :141 · `assertEditsContainer` :149 · `assertEditEntries` :155 · `validateEditEntry` :170 + 五文案 :48-58）。子表行 17 = `tools/file.mjs` **468**——拆点 = 按工具族四面（read :64 / write :192 / insert_after :284 / hashline_edit :384；先例 `git-ext.mjs`）。
- **零改面**：`SOFT_LINE_REGISTRY` 名册零改（机检只锁名册，读数属设计面）；核产品码零改（本批核面 = 纯文档刷新）。

**五、受影响文件与测试面全列（行数口径 = `wc -l` · 现读数 as-of 2026-09-25 设计轮 · Δ = 预计）**

| # | 文件 | 现 → 预计 | 面 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/chat-panel.mjs` | **497 → ≤430**（净 −70±10） | S1 拆出（Settings 段 −85 + 薄委托 ≈+12） |
| 2 | `thincoder-vscode/src/extension/panel-settings-push.mjs` | 新建 ≈95 | S1 新档（≤300） |
| 3 | `thincoder-vscode/src/agent.mjs` | **496 → ≤460**（净 −38±5） | S2 拆出（:300-344 −45 + import） |
| 4 | `thincoder-vscode/src/agent/response-stages.mjs` | 新建 ≈60 | S2 新档（≤300） |
| 5 | `thincoder-vscode/test/busy-injection-vsc.test.mjs` | **546 → ≈300** | S3 留守档 |
| 6 | `thincoder-vscode/test/busy-injection-vsc-webview.test.mjs` | 新建 ≈250 | S3 新档 |
| 7 | `thincoder-vscode/test/files.mjs` | 139 → 140（+1 行登记） | S3 索引登记 |
| 8 | `thincoder-vscode/test/settings-open-snapshots.test.mjs` | ±1（链集常量换位——**点名允许**的结构锚更新） | S1 |
| 9 | `thincoder-cli/test/busy-injection.test.mjs` | **474 → ≈240** | S4 留守档 |
| 10 | `thincoder-cli/test/busy-injection-render.test.mjs` | 新建 ≈130 | S4 新档 |
| 11 | `thincoder-cli/test/busy-injection-consume.test.mjs` | 新建 ≈160 | S4 新档 |
| 12 | `thincoder-vscode/AGENTS.md` | ±1 行（:56 模块地图并入两新档名——产品文本面） | S1/S2 |
| 13 | `docs/vsc/design/VSC-DEBT.md` | §12.1 追加块 + §13 + 变更记录 | 设计档 |
| 14 | `docs/core/design/CORE-UNIFICATION.md` | §2.8.1 刷新 + 补登 3 行 + 计数 + 变更记录 | 设计档 |
| 15 | 本批档 | §5 实施读数（实施轮）+ §2 本段 | 记录 |

**测试面**：无新增行为用例（纯结构搬移——既有用例回归即判据）；测试档级动作 = 新增 3 档（行 6/10/11）+ `files.mjs` 登记 + 锚档 1 处（行 8）。

**六、验收对照（逐条可机检）**

| # | 判据 | 机检命令（口径 = 仓根 · `wc -l` 语义） |
|---|---|---|
| AC-1 | 行数达标：行 1 ≤430 · 行 2 ≤300 · 行 3 ≤460 · 行 4 ≤300 · 行 5 ≤500 · 行 6 ≤500 · 行 9 ≤500 · 行 10 ≤300 · 行 11 ≤300；全部 ≤500 硬限 | `node -e "for(const [p,m] of [['thincoder-vscode/src/extension/chat-panel.mjs',430],['thincoder-vscode/src/extension/panel-settings-push.mjs',300],['thincoder-vscode/src/agent.mjs',460],['thincoder-vscode/src/agent/response-stages.mjs',300],['thincoder-vscode/test/busy-injection-vsc.test.mjs',500],['thincoder-vscode/test/busy-injection-vsc-webview.test.mjs',500],['thincoder-cli/test/busy-injection.test.mjs',500],['thincoder-cli/test/busy-injection-render.test.mjs',300],['thincoder-cli/test/busy-injection-consume.test.mjs',300]]{const n=require('fs').readFileSync(p,'utf8').split('\n').length-1;if(n>m)throw new Error(p+' '+n+'>'+m);console.log('ok',n,p)}"` |
| AC-2 | 缝零改：消费面文件 `git diff --stat` 空 ∧ 调用点数守恒（`_pushSettingsLight` 11 · `_pushSettings` 7 · `_pushStatus` ≥4 · `_agentSettingsSession` ≥3——grep 计数逐档同值） | `git diff --stat -- thincoder-vscode/src/extension/panel-messages-settings.mjs thincoder-vscode/src/extension/panel-callbacks.mjs thincoder-vscode/src/extension/panel-index.mjs thincoder-vscode/src/extension/panel-messages.mjs thincoder-vscode/src/extension/image-handler.mjs` ⇒ 空输出 |
| AC-3 | 用例计数守恒：VSC **15 = 6 + 9** · CLI **18 = 6 + 7 + 5**（`grep -c "test("` 逐档） | 三档/两档计数相加复原 |
| AC-4 | 全绿：三树 `npm test` exit 0（含协议两机检、core-hygiene） | `cd thincoder-vscode && npm test` ∧ `cd thincoder-cli && npm test` ∧ `cd thincoder-core && npm test` |
| AC-5 | 登记在盘：`test/files.mjs` 含 `busy-injection-vsc-webview` 行 ∧ VSC-DEBT §13 在档 ∧ §2.8.1 三新行 + 次优先六档读数在档 | grep 点名 |
| AC-6 | 结构锚恰一处更新（行 8）且其余锚零改：`upstream-parity.test.mjs` / `reasoning-echo-live.test.mjs` 计数锚复跑绿；`engine-floor-guard` 闭包绿 | 随 AC-4 全绿 + `git diff --stat -- thincoder-vscode/test/upstream-parity.test.mjs thincoder-vscode/test/integration/reasoning-echo-live.test.mjs` = 空 |
| AC-7 | 核面零码改：`thincoder-core/**` 源/测试 `git diff --stat` = 空 ∧ `SOFT_LINE_REGISTRY` 名册零改 | `git diff --stat -- thincoder-core` ⇒ 空（设计档除外——文档在 `docs/`） |
| AC-8 | 读数以批内实测为最终值：实施轮交付前逐档复测（AC-1 命令），差异复核后以实施轮实测收正（§5 载原样读数） | §5 读数表 |

**七、关键决策**

| # | 决策 | 否决备选 / 理由 |
|---|---|---|
| KD-20 | **执行集合判定口径** = 只执行三类：越 500 硬限 ∨ 触发条件已到 ∨ 登记明示「下批执行」；「不预拆」/「触发未到」档一律零执行（只刷新登记） | 否决「全部 300+ 档一律预拆」（违各档登记判据、批量噪声）；否决「只拆越 500」（#91 触线已到 + 登记明示两类将悬空） |
| KD-21 | chat-panel 拆点由原案「推送面 ≈40」**扩为 Settings 段整段 `:334-418`（≈85）** | 原案立案后该档 +73 行漂移、原案不足以脱离触发线（424−40=384 的旧预算失效）；Settings 段 = 档内既有节注释界（`:334`/`:420`）天然切点 |
| KD-22 | `chat.css` 514 / `controls.css` 658 **维持「CSS 不入门」= 零拆分计划**（读数只作记录） | 引既有裁定：N-P3 判据句自带模块缝语义 + id=104 先例（`.mjs` 两档）+ 2026-09-21 loading-screens 评审「按既有裁定不升级、不重开」；推翻须新裁定 ⇒ 上抛 1 |
| KD-23 | 测试档拆分按「用例族 + 夹具自持」分档；**用例号零改零重排**；新档夹具就地重定义（零跨档 import） | 否决「按文件物理顺序二分」（夹具跨组断裂）；否决「重排编号」（制造文档锚悬空） |
| KD-24 | VSC `agent.mjs` 拆点 = 登记候选「响应后处理段 :300-344」**本批执行**；控制流以判别式回传保真；提交分支留档 | 触线 >495 已越（496）——本批即拆分轮；一次性全拆（含 :346-409）风险高于收益（`return` 语义面） |
| KD-25 | 读数口径 = `wc -l`（`split("\n").length - 1`，与核机检同式）；**批内实测为最终值**（设计值 as-of 2026-09-25，实施轮复测收正） | 否决 read 含末行口径（父侧 §1 旧记 +1——本表已在口径注消解） |
| KD-26 | CLI 档位登记 = 本批落批档（记录面）；**不新造 CLI 档位册**，缺口上报 | 新造册 = 机制增量（超本批边界）；先例 = VSC 侧曾有「活债载体」同类问题（2026-09-18-vsc-settings-wiring §3 的（活动面）裁定） |

**八、上抛项（父侧定夺）**

1. **`chat.css` 514 的处置**：本批按既有裁定取「零拆分（CSS 不入门）+ 读数刷新」；若父侧本意 = 纳入拆分（推翻 2026-09-18 裁定），请明示新裁定——本批未拆。
2. **CLI 档位登记面缺口**：CLI 无 VSC-DEBT §12.1 / §2.8.1 对位册（`model-picker.mjs`「不预拆」案仅存冻结批档；`bin/thincoder.mjs` 481 · `advisor-chain-guards.test.mjs` 488 · `settings.test.mjs` 480 · `acp-contract.test.mjs` 461 无册可归）——建议立册 ≡ 指定载体。
3. `docs/vsc/requirements/PROJECT.md` §5/§6 读数同步（需求档 = 父侧笔）：如需 §5 补 2026-09-25 读数行。
4. `WEBVIEW-PROTOCOL.md` §12 ② 列 chat-panel 面坐标随拆再漂（机检不校验坐标；命中在册债 #284 全表 `--emit` 重出）——本批不修、实施轮零触该档。
5. `thincoder-vscode/AGENTS.md:56` 模块地图行并入两新档名（产品文本面）——已列受影响文件（行 12）；若父侧判「不动」，请裁。

**边界（本次不做）**：不执行 `settings.mjs` / `settings-tools.js` / `model-picker.mjs` / `ui.js` / `async-parity.test.mjs` / `session-boot.test.mjs` / `workspace-guard.test.mjs` / CSS 类 / edit-arg-guard 四档的拆分（触发未到 ∨ 不预拆 ∨ 不入门——登记刷新）；不做其余 28 档全量补登（补登范围与时点另定）；非全量普查（中段未登记档不入册）；不动需求档 · 提示词面 · 产品运行行为 · 台账（父侧笔）；零行为变化 = 全部拆分为纯结构搬移。

### §2 修正轮块（评审轮 1 · 十项逐条落位 · 2026-09-25 · eng-designer）

> 承 §3 轮次 1（🟡4 / 🔵6 · pass）+ 父侧裁定（全部接受）。§2 = append-only 面 ⇒ 既有行不改写——本块 = §2 面收正单源；设计档就地收正（CORE-UNIFICATION / VSC-DEBT / TUI / TUI-INPUT-BOX / WEBVIEW-INPUT + 各自变更记录）。

**逐条落位**：

1. **🟡 §2.8.1 主表行 14 读数与结论**：`session-slots-manifest.mjs` **264 → 321**（`wc -l` 实读 2026-09-25）；结论「≤300 免登记」→「**>300——须带（待补拆分计划行——在册 · 属「其余 28 档待补」）**」；子表行 3 同句收正（Δ+54 → Δ+111）。节头两处「逐行复测刷新」口径收窄为**实际复测面**（口径块 + 子表题行：面 = 主表行 4–11 · 14 与子表行 1 · 4–9 · 11 · 14–17；未列行保留各自 as-of）。**同轮附带收正**：主表行 9 `ledger-surface.mjs` **76 → 83**（本批复测面内漏刷）。
2. **🟡 AC-3 机检口径**：收正为**用例声明行计数**——命令 = `grep -c "^test("` 逐档（行首锚定；原 `grep -c "test("` 对 CLI 档把断言内 `.test(` 三行 `:319` / `:353` / `:428` 误计为 21）。判据数字零变：VSC **15 = 6 + 9** · CLI **18 = 6 + 7 + 5**（实测：VSC 两口径均 15 · CLI 行首口径 18）。
3. **🟡 S4 夹具清单**：补 `convState` / `convText`（`:306-313`）为**两新档共用件**——消费族用例 `:429` / `:472` 亦消费 ⇒ 各档自持副本、零跨档 import（同 `baseState` / `stripAnsi` 先例）。
4. **🟡 三处「用例宿主」句随拆收正**：`docs/cli/design/TUI.md` §7.5 用例宿主句（三档制 + T-F16-6 入渲染档）· `docs/cli/design/TUI-INPUT-BOX.md` §6 档位表其行（三档制宿主 + 逐例映射）· `docs/vsc/design/WEBVIEW-INPUT.md` §9 用例面行（两档制 + 「槽满跨载体」= T-V16-8 入 webview 档）；三处映射统一指向本批档 §2「四·S3 / 四·S4」。
5. **🔵 同节漂移 + 双值**：行 10 `agent/suspension.mjs` **234 → 240** · 行 11 `i18n.mjs` **102 → 106**；§2.8 U0 行 `tools/shared.mjs` 补指针（**现读数 471**——见 §2.8.1 行 9；原 452 = as-of 2026-09-14）。
6. **🔵 影响表行 7 读数**：`thincoder-vscode/test/files.mjs` 现读数 **139 → 138**（`wc -l`；139 = read 含末行口径）——该行改记「**138 → 139**（+1 行登记）」。
7. **🔵 影响表行 8 读数**：`settings-open-snapshots.test.mjs` 补现读数 **185**（`wc -l`）——该行改记「185 → ±1」。
8. **🔵 S2 新档 import 面 / 环**：VSC-DEBT §13.4 补「**import 面与环**」句——import 面 = `run-helpers.mjs`（`pushReal`）· `rules-face.mjs`（`applyRuleTriggered`）· `stop-trace.mjs`（`traceStop`）· `run-stages.mjs`（`injectResponseReminders`）；环 = `agent.mjs` ⇄ `run-stages.mjs` ⇄ `response-stages.mjs` 三节点（既有两节点环的扩展）；环安全按 §12.5 判据 + 机判句（该档顶层零解引用）。**取「记录 + 判据」而非「注入项避环」**——注入将改入参面（搬移零改形态优先）。
9. **🔵 S3 夹具范围**：`:34-83` → **`:34-81`**（`settle`(:83) 归留守档——实测消费点 `:231`–`:536` 全在留守族，引导族与 T-V19 零消费）。
10. **🔵 S1 账目**：`_agentSettingsSession` = **2 处（外档点名：`image-handler.mjs:121` · `panel-messages.mjs:311`）+ 档内自用 3 处**（`chat-panel.mjs:372/395/402`——随段迁入新档、经 panel 实例呼）；AC-2 同句收正为「`_agentSettingsSession` ≥2〔外档点名〕+ 档内自用 3〔随迁〕」——点名与计数同基（余项 `_pushSettingsLight` 11 · `_pushSettings` 7 · `_pushStatus` ≥4 零变）。

**机检读数（fix 轮落位后 · `node scripts/doc-check.mjs --root .`）**：悬空 **14**（fix 前 14——**零净增**；本批面新增 0）· 行宽超 300 清单 **19 → 18**（CORE-UNIFICATION §2.8.1 子表题行拆两行消 1——净 −1）。

**报告备查（非本批面 · 不改档）**：① `agent/dispatch.mjs` 现读 **497**（档记 496 = 设计轮实读；+1 来自在飞批的未提交工作树改动）——§2.8.1 行 4 数值本批不动，实施轮 AC-8 复测收正；② 主表行 3 `config-presets.mjs` 现读 **49** vs 档记 46（该行 as-of 2026-09-14、不在本批复测面——「未动档不重锚」惯例，留待其下一次实质改动）。

**追加（同轮 · 文档面机检收尾）**：本批面既有悬空引用 **10 条**（初始轮文本所致，非本轮新引入）随本轮一并收正——VSC-DEBT **8 条**（§12.1 本批块三档短路径 + §13 五处：`:592` / `:623` 两处 / `:646` / `:658`，行号按收正前现文）+ CORE-UNIFICATION **2 条**（子表行 17 借用面 + 「距硬限五档」行核内引用）；修法 = 加产品前缀 / `（拟新增）` 标注（**纯引用形式——零语义**）。
`node scripts/doc-check.mjs --root .` 终态：悬空 **14 → 4**（余 4 = 非本批面存量，住 `MODEL-SPECS.md` 3 处 · `SESSION.md` 1 处）；行宽 **19 → 18**。前一机检行按本稿为准（本批面净 −10——「零净增」达成且为负）。

### §2 实施后收正轮（2026-09-25 · eng-designer · 承 §5 代码评审 3 条 · 父侧裁「接受并收正」）

设计档收正三处（VSC-DEBT · 零语义——拆点 / 验收 / 需求面零改）：§12.1 追加「批后登记」块（九档批后读数〔`wc -l`〕+ 留守档 330 越线登记行〔结构不变 · 不拆理由〕）· §13.4 触发句收正 **>450 → >495**（以 §12.1 单源行为准；§2 四·S2 原句同源异述——批档既有行零改）· §11 变更记录一行；机检 = `node scripts/doc-check.mjs --root .` 本档零新增红（悬空 4 → 4 · 行宽 18 → 18）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批 2026-09-25-file-tier-sweep 设计（本档 §2 + VSC-DEBT §12.1/§13 + CORE-UNIFICATION §2.8.1）；状态 = 待评审。

**核验面（实测抽查 · as-of 2026-09-25 本轮，口径 = `wc -l`）**：逐档读数抽查 34 档——chat-panel 497 ✓ · VSC agent.mjs 496 ✓ · busy-injection-vsc 546 ✓ · CLI busy-injection 474 ✓ · settings.mjs 409 ✓ · settings-tools.js 398 ✓ · ui.js 494 ✓ · panel-messages 357 ✓ · suspension 447 ✓ · chat.css 514 ✓ · core：dispatch 496 ✓ · subagent-actions 495 ✓ · responses 495 ✓ · provider/core 491 ✓ · advisor-async 481 ✓ · tools/shared 471 ✓ · consult 471 ✓ · tools/file 468 ✓ · subagent-async 456 ✓ · memory/schema 453 ✓ · git/checkpoint 444 ✓ · session-store 441 ✓ · agent.mjs 442 ✓ · context 440 ✓ · session-lifecycle 318 ✓ · process-probe 315 ✓ · subagent-spawn 407 ✓ · config.mjs 419 ✓ · session.mjs 244 ✓ · session-slots 298 ✓ · history-window 179 ✓ · session-slot-write 168 ✓ · child-marks 24 ✓。结构面实核：S1 拆点 `chat-panel.mjs:334-418` 逐方法坐标全中 ✓（`_providerStatus:336` … `_agentSettingsSession:413-418`）· 外部调用点 11/7/4 逐处可复现 ✓（`_pushSettingsLight` 11 · `_pushSettings` 7）· 锚 `settings-open-snapshots.test.mjs:163-185` 链集常量确需换位 ✓ · `workspace-guard.test.mjs:475-487` 四读点锁不受触 ✓（拆点段零 `workspaceFolders`）· `upstream-parity.test.mjs:207-215` / `reasoning-echo-live.test.mjs:96-103` 两计数锚住 `:123`/`:207`/`:400`（均在被迁段外）⇒ 零破成立 ✓ · S2 段 `:300-344` 逐行与主 `try(:182)/for(:183)` 结构相容（`continue` 翻译位可行）✓ · 段内依赖（`traceStop`/`pushReal`/`applyRuleTriggered`/`injectResponseReminders`）均可自既有模块 import ✓ · S3 用例族 15 = 6 + 9 ✓、`W`/`protoPanel` 跨组唯一性 ✓ · S4 18 = 6 + 7 + 5 ✓、`turnRig`/`RECEIPT` 归组 ✓ · CLI 运行器双层 glob（`test/run.mjs:44`）⇒ 零登记成立 ✓ · `SOFT_LINE_REGISTRY` = 名册 Set 恰 **46** 项 ✓（`context.mjs`/`tools/edit-diff.mjs`/`tools/file.mjs` 三档在册无计划行 ⇒ 补登语义成立）· `settings.mjs` 七件拆点行号全中（`:88-115`/`:224`/`:230`/`:236`/`:246`/`:276`/`:291`）✓ · 新档名五处盘上零冲突 ✓ · `_cwd` 反向边零（无档 import `chat-panel.mjs`）⇒ S1「零环」成立 ✓。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations | 🟡 | §2.8.1 主表行 14（`session-slots-manifest.mjs`）读数未刷新且结论失真：档内记 **264**/「≤300 免登记」，实测 **321**（`wc -l`）⇒ >300、且该档在 `SOFT_LINE_REGISTRY` 在册 46 之内（「已登 18」不含它 ⇒ 属「待补 28」）——「≤300 免登记」与同节口径「>300（软线）档须带拆分计划」相抵；该行不在本批刷新面（§2:132 列 8 行子表 + 7 行主表）之内，而节表头（`CORE-UNIFICATION.md:1107`）自称「逐行复测刷新 2026-09-25」 | 该行读数与结论同轮收正（264 → **321**，注「>300 · 待补拆分计划行」），并把节表头刷新口径收窄为实际刷新面（或逐行补 as-of），二者取一使表头与刷新面自洽 |
| 2 | Acceptance criteria | 🟡 | AC-3 的机检模式在 CLI 半不成立：`grep -c "test("` 对 `thincoder-cli/test/busy-injection.test.mjs` 输出 **21** 行（18 声明 + 断言内 `.test(t)`/`.test(l)` 三行 `:319`/`:353`/`:428`），而非判据所写 **18 = 6 + 7 + 5**；拆分后为 8 / 8 / 5（仍自洽但与所写数字不符）。VSC 半无此问题（实测恰 15 行） | 模式锚定行首（`grep -c "^test("`——两档声明均行首）或把判据改写为「用例声明行计数」并给出该口径命令 |
| 3 | Clarity | 🟡 | S4 夹具清单缺项：`convState`/`convText` 被列为随渲染族（①）迁出，但消费族用例亦消费 `convText`（`:429` ∈ T-F16-16 `:410-430`、`:472` ∈ T-F16-19 `:460-473`）⇒ 消费新档同样需要该夹具；设计仅点名 `baseState`/`stripAnsi` 为共用件（就地重定义） | 夹具清单补 `convState`/`convText` 为两新档共用件（各档自持副本，零跨档 import——同 `baseState` 先例） |
| 4 | Requirements（影响面） | 🟡 | S4 拆分后三处既有设计档「用例宿主」句部分失真，未列入受影响面 / 上抛：`docs/cli/design/TUI.md:657`（用例宿主 = `busy-injection.test.mjs`（T-F16-6…）——T-F16-6 迁往 `busy-injection-render.test.mjs`）· `docs/cli/design/TUI-INPUT-BOX.md:222`（宿主行列 T-F16-1…9，其中 2/5/6/9 迁出）· `docs/vsc/design/WEBVIEW-INPUT.md:182`（§9 用例面含「槽满跨载体」= T-V16-8，该例随引导族迁出）。机检不红（无行号锚 + 用例号串仍在 test 树内），但宿主指称随实施失真 | 三处宿主句收正（改指新档名或统一改为「用例宿主见批档 §2」形态），或作为显式留档项列入 §2「八」上抛清单 |
| 5 | Doc hygiene | 🔵 | 同一节内读数残留两处小漂移 + 一处分居：§2.8.1 行 10 `agent/suspension.mjs` 记 **234**（实测 240）· 行 11 `i18n.mjs` 记 **102**（实测 106）；另 `§2.8:1033`（U0 前置笔行）记 `thincoder-core/tools/shared.mjs` **452**，与 §2.8.1 行 9 的 **471** 并存（该行按「未动档不重锚」惯例可留，但两值同档并存易误读） | 两小漂移随本轮收正；`§2.8:1033` 补一句同指 §2.8.1 行 9 的指针（或就地收正），消同档双值 |
| 6 | Affected-file size annotations | 🔵 | 影响表行 7（`thincoder-vscode/test/files.mjs`）现读数记 **139**，实测 **138**（`wc -l`；139 = read 含末行口径——该表口径注只为另五处点名消解此差，本行未收） | 收正为 **138 → 139**（+1 行登记），与表内其余行口径统一 |
| 7 | Affected-file size annotations | 🔵 | 影响表行 8（`thincoder-vscode/test/settings-open-snapshots.test.mjs`）只给「±1」缺现读数 | 补现读数（实测 **185**） |
| 8 | Clarity | 🔵 | S2 新档 `src/agent/response-stages.mjs` 的 import 面 / 环面未点名：该档将 import `./run-stages.mjs`（`injectResponseReminders`），而 `run-stages.mjs:42` 已自 `../agent.mjs` import（该档头注自述「函数级静态环 · 环安全」）⇒ 形成三节点环（agent ⇄ run-stages ⇄ response-stages）；机检无环覆盖，但项目环纪律（VSC-DEBT §12.5）要求环上模块顶层零跨环读取 | 搬运契约补一句：该档 import 面 + 按 §12.5 环安全判据（顶层只 import 绑定、解引用在函数体）给一句机判句，或改为注入项避免扩环 |
| 9 | Clarity | 🔵 | S3 夹具范围与留守点名相抵：`W`/`capturedPosts`/`resetSend` 记 `:34-83`，而 `:83` = `settle`（同一清单又把 `settle` 列入留守组）；实测 `settle` 仅被留守族用例消费（`:231/:238/:244/:250/:272/:284/:338/:344/:420/:450/:458/:536`），引导族与 T-V19 零消费 | 范围收为 `:34-81`（`settle` 归留守档），或把 `settle` 明列两档自持件 |
| 10 | Clarity | 🔵 | S1 外部调用点账目不一致：`_agentSettingsSession` 记「3 处」但只点名 2 处（`image-handler.mjs:121` · `panel-messages.mjs:311`）；第 3 处实为档内自用（`:372`/`:395`/`:402` 三次）——AC-2 以「≥3」兜底 | 改「2 处（+ 档内自用 3 处）」或按 grep 口径重写计数（使点名与计数同基） |

**计数**：🔴 0 · 🟡 4 · 🔵 6（共 10 条）。
**限制声明**：无项目标准档与文档地图声明 ⇒ 判据 3 / 7 按 Project Guide（AGENTS.md）与档内自述口径判；影响表内未抽查读数（VSC `controls.css` / `run-stages.mjs` / `setup.mjs` / `execute-tools.mjs` 等）标 unverified。
**VERDICT: pass**（无 🔴；🟡/🔵 均不阻断放行）。

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代执行 · 2026-09-25 全链授权口径）**

- **授权口径** = 2026-09-25「这七批都派出去」= 全链；代执行自缚三条件逐项核验：
  - ① 设计评审 **pass（轮 1 · 0🔴 / 4🟡 / 6🔵）** ✓；
  - ② 修正轮十项**全落并读盘核验** ✓（CU `:1093`/`:1098`/`:1102`/`:1104`/`:1081`/`:1107-1108`/`:1114` · VSC-DEBT `:607`/`:636-637`/`:644` · TUI.md `:657` 三宿主句——本席抽验通过）；
  - ③ designToken **在效** ✓。
- **上抛项裁决（五条）**：① `chat.css` 514 → **维持既有裁定**（CSS 不入门 · 零拆分——不推翻 2026-09-18 裁定）；② CLI 档位登记载体缺位 → **已入册 #340**（立册 ≡ 指定载体随该条处置）；③ 需求档 `PROJECT.md` §5/§6 读数 → **不补**（D2 单源：活动读数单源 = 设计档，需求档不载）；④ `WEBVIEW-PROTOCOL.md` §12 ② 列坐标随拆再漂 → 本批零触（在册 #284 全表 `--emit` 面覆盖）；⑤ `thincoder-vscode/AGENTS.md:56` 模块地图行 → **动**（实施轮并入两新档名——已列受影响文件行 12）。
- 据上：批① 进入实施（eng-coder · 按批档 §2 + 设计档 VSC-DEBT §13 实施；§5 实施记录由该档写）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（S1–S4 落地 · AC-1–AC-8 实测达 · 审计 CLEAN · 代码评审 pass（0🔴/3🟡 optional 均父侧文档层/1🔵 已披露）· 终态 clean）



### §5 实施（initial 轮 · 2026-09-25 · eng-coder · 承 §2 + 修正轮块）

**交付摘要**：S1 / S2 / S3 / S4 四拆全部落地（纯结构搬移 · 零行为变化）+ 索引登记（`files.mjs` +1 行 + `:19` 既有注释收正）+ `AGENTS.md` 模块地图并入两新档名（裁决⑤「动」）。S5 零执行面（`settings.mjs` / `settings-tools.js` / `model-picker.mjs` / `ui.js` / `async-parity` / `session-boot` / `workspace-guard` / CSS 类 / edit-arg-guard 四档）与 S6 核面 = **零触**（`thincoder-core/**` 本席零写；设计档 = 设计轮笔，实施轮零改）。

**逐档读数（`wc -l` 口径 = `split("\n").length - 1` · 实施轮实测）**

| 档 | 前 → 后 | 备注 |
|---|---|---|
| `thincoder-vscode/src/extension/chat-panel.mjs` | **497 → 426** | 目标 ≤430 ✓（净 −71 = 段 −85 − 导入 3 + 新导入 1 + 薄委托 14） |
| `thincoder-vscode/src/extension/panel-settings-push.mjs` | 新档 **119** | ≤300 ✓ |
| `thincoder-vscode/src/agent.mjs` | **496 → 457** | 目标 ≤460 ✓（净 −39 = 段 −45 + 调用块 +5 + 导入 1） |
| `thincoder-vscode/src/agent/response-stages.mjs` | 新档 **73** | ≤300 ✓ |
| `thincoder-vscode/test/busy-injection-vsc.test.mjs` | **546 → 330** | ≤500 ✓（留守 9 例） |
| `thincoder-vscode/test/busy-injection-vsc-webview.test.mjs` | 新档 **249** | ≤500 ✓（引导族 6 例） |
| `thincoder-vscode/test/files.mjs` | **140 → 141** | +1 行登记（`errata`：§2 行 7 记录的 139→140 为设计轮读数；实施轮现盘基线 140——另批在飞先增 peer 两行） |
| `thincoder-vscode/test/settings-open-snapshots.test.mjs` | **185 → 185** | 锚档恰一处更新（链集常量换位 + 行内注——行数零变） |
| `thincoder-cli/test/busy-injection.test.mjs` | **474 → 209** | ≤500 ✓（按键门 + 入队族 5 例） |
| `thincoder-cli/test/busy-injection-render.test.mjs` | 新档 **155** | ≤300 ✓（6 例） |
| `thincoder-cli/test/busy-injection-consume.test.mjs` | 新档 **198** | ≤300 ✓（7 例） |
| `thincoder-vscode/AGENTS.md` | **129 → 129**（±0 行） | :43 并入 `response-stages.mjs` · :56 并入 `panel-settings-push`（两行内联编辑） |

**AC 逐条读数（实施轮实测）**

| # | 判据 | 读数 | 结论 |
|---|---|---|---|
| AC-1 | 九档行数门 | 426 / 119 / 457 / 73 / 330 / 249 / 209 / 155 / 198（逐档 ≤ 各自门限 ∧ 全部 ≤500） | ✅ |
| AC-2 | 缝零改 | 消费面五档（`panel-messages-settings` / `panel-callbacks` / `panel-index` / `panel-messages` / `image-handler`）`git diff` 头集 = **零出现**；调用点计数：`_pushSettingsLight` 11（外档；另 1 处为注释提及）· `_pushSettings` 7（外档）+ 1 定义 · `_pushStatus` ≥4（2 外档 + 2 随迁档内）· `_agentSettingsSession` 2（外档点名）+ 3（随迁档内；另 1 处为注释提及）——与 §2 S1 点名清单逐点同值 | ✅ |
| AC-3 | 用例计数守恒（`grep -c "^test("` 行首口径） | VSC **15 = 9 + 6** · CLI **18 = 5 + 6 + 7** | ✅ |
| AC-4 | 三树 `npm test` 全绿 | VSC **987/987 pass · 0 fail** · CLI **850/850 · 0 fail** · 核 **663/663 · 0 fail**（exit 0） | ✅ |
| AC-5 | 登记在盘 | `files.mjs:20` 含 `busy-injection-vsc-webview` 行 ✓ · VSC-DEBT §13 在档 ✓ · §2.8.1 子表行 15–17（`context.mjs` 440 / `tools/edit-diff.mjs` 415 / `tools/file.mjs` 468）+ 计数句（在册 46 · 已登 18 · 待补 28）+ 距硬限五档 + 次优先六档 ✓ | ✅ |
| AC-6 | 结构锚恰一处 + 余锚零破 | 唯一更新 = `settings-open-snapshots.test.mjs:164` 链集常量；`upstream-parity.test.mjs` / `integration/reasoning-echo-live.test.mjs` 两计数锚 diff = 零出现 ∧ 复跑绿 · `engine-floor-guard` 闭包绿（随 AC-4） | ✅ |
| AC-7 | 核面零改 | 本席写面 = VSC/CLI 两树 + 本批档 §5；`thincoder-core/**` 零写（工作树内核面 diff 均为他批在飞笔——本批设计轮已录明） | ✅ |
| AC-8 | 读数以批内实测为最终值 | 本表即原样读数（§6 收口可直引） | ✅ |

**修复轮（实施内自检 · 1 项）**：`endProbeWindow` 导入误删——S1 删除 `settings.mjs` 整行导入（该行 14 名中 13 名为 Settings 段专属、1 名 `endProbeWindow` 的消费点住**留守面** `resolveWebviewView`/`dispose`）⇒ 首轮 VSC 全量跑出 2 红（`ReferenceError: endProbeWindow is not defined`）→ 就地恢复单名导入（`chat-panel.mjs:13`）+ 复跑全量 987/987 绿。**余 13 名逐名复核无留守消费**（grep 逐名，读盘证据）。

**决策透明表（与 §2 设计的差异 · 逐条披露）**

| # | 项 | 处置 | 理由 / 证据 |
|---|---|---|---|
| D-1 | S2 新档入参面 | 实施为 `{agent, history, fullHistory, response, turn, depth, callbacks}` | §2 设计句自留「实施轮按实读定形」；实读段内零消费 `provider` / `cfgVerifyGuard`，多出 `turn`（traceStop 文案）/ `depth`（usage 记账门）两必需项 |
| D-2 | S4 `convState` 自持面 | 渲染档自持 `convState`+`convText`；消费档自持 `convText`（**未**含 `convState`） | 修正轮块 3 的落点 = 「消费族亦消费」⇒ 自持所用（同 `baseState`/`stripAnsi` 先例）；消费族逐例复核零 `convState(` 调用点（`:429`/`:472` 两处均传 `turnRig` state）——避免死码。若父侧判「字面两档同持」可补（1 处 4 行） |
| D-3 | `AGENTS.md` 落位 | `panel-settings-push` → :56（`src/extension/` 行）；`response-stages` → :43（`src/agent/` 行） | §2 记「:56 并入两新档名」；逐字照办会把 `agent/` 档名挂到 `src/extension/` 行（地图语义错位）——按模块地图语义各自落行，行数 ±0 |
| D-4 | 注释内行号残留 | `panel-settings-push.mjs` `setPlanMode` 注释内 `:359-364` 保持逐字（搬迁保真） | 该注释自指行号随搬迁失效（原指 `_setPlanMode` 自身坐标）；「逐字搬迁 · 零顺手优化」优先——留待该档下次实质改动时收正（登记于此） |
| D-5 | S3 分节标号 | 原档「第二部分 / 第三部分」标号逐字留守；「第四部分」两档各留半边（标号 + 归属注） | 用例号零改零重排（KD-23）不涉分节注释；半边标号会使读者找不到另半——各档加一行归属注消歧 |
| D-6 | `files.mjs` 基线 | 现盘 140（非 §2 修正轮记 139/138） | 他批在飞先增两行（peer-domains / peer-instances 登记）——本席 +1 行 = 141；§6 收口以现盘为基线 |

**审计 / 代码评审轮次**：见后续 append（§5 续块）。

### §5 内部审计 / 代码评审轮次与终态（2026-09-25 · eng-coder）

**自修轮（1 轮 · 实施内自检）**：`endProbeWindow` 误删 → 就地恢复单名导入 → 全量复跑 987/987 绿（见上「修复轮」）。

**内部审计（explore 子代理 · 只读分叉审计 · BLOCKING）**：**CLEAN**（0🔴 / 0🟡 / 5🔵）。四个偏差类（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）= 全零；硬约束核验（`_chat` / `resolveWebviewView` / 构造器两监听块留守）✓ · 控制流保真 ✓ · 用例号/计数 ✓ · 越表文件集 = 空 ✓。其 5 条 🔵 中 2 条为「审计侧工具受限未跑」（`git` / `npm test`——本席已跑，见 AC-2/AC-4/AC-6 读数）+ 1 条残余疑虑（`loadRaw().shell ?? null` 疑为新增默认值）——**已对拍证伪**：`git show HEAD:…/chat-panel.mjs` 两处逐字含 `?? null`（见 §5 证据锚），新档仅 `this.`→`panel.`。

**代码评审（advisor · type=code · 同步轮）**：**VERDICT: pass**（0🔴 / 3🟡 optional / 1🔵）。逐条处置：

| # | 级别 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 optional | VSC-DEBT §12.1 档位台账未随拆刷新（仍载 497 / 496 / 546 + 新档无登记行）——父侧文档层 | **非返工项**（设计档 = eng-designer 笔；批档 §4 裁定③「活动读数单源 = 设计档」⇒ 归 §6 收口轮收正）· 本席不触设计档 |
| 2 | 🟡 optional | 留守档 `busy-injection-vsc.test.mjs` 落地 **330** >300，无 >300 登记行（设计目标 ≈300 未达；硬限达标） | **非返工项**（登记面在 §12.1——随 #1 一并收口；本席已于 §5 读数表载明 330） |
| 3 | 🟡 optional | 同一触发阈值两处异述（§12.1 单源行 agent.mjs **>495** vs §13.4/批档 §2 的 **>450**）——交付值 457 落两值之间 | **非返工项**（文档层；按单源 >495 ⇒ 457 已脱线，收口陈述成立；§6 / 设计侧收正） |
| 4 | 🔵 | `panel-settings-push.mjs:57` 注释内自指行号 `:359-364` 随搬迁失效（逐字搬迁的自觉保留） | 维持不改（§5 D-4 已登记；建议该档下次实质改动时收正） |

**终态 = clean（收敛）**：审计 CLEAN、评审 pass、零返工项；3 条 🟡 均属父侧文档层（§6 收口范围），1 条 🔵 为已披露的搬迁残留。AC 全条读数见上表（AC-4 实跑 = VSC 987/987 · CLI 850/850 · 核 663/663，exit 0）。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#33`（内部审计 **CLEAN**〔0🔴 / 0🟡 / 5🔵〕· 代码评审 pass〔0🔴 · 🟡3 / 🔵1 optional〕· fix 轮 1 = 恢复 `endProbeWindow` 单名导入 · §5 在档）+ eng-designer `#38`（实施后收正 = 批后登记轮）。
- **本席复核（读盘抽验）**：S1 `chat-panel.mjs` **426** + 新档 `panel-settings-push.mjs` **119**（头注缝契约在盘）✓ · S2 `agent.mjs` **457** + 新档 `response-stages.mjs` **73**（控制流保真注 + 环注在盘）✓ · `files.mjs:19` 注释收正 + `:20` 新档登记 ✓ · **批后登记块**（VSC-DEBT `:305-309`：九档读数 + 330 越线登记）✓ · §13.4 触发句收正 **>495**（`:644`）✓。
- AC 读数（交付）：AC-1 九档 426 / 119 / 457 / 73 / 330 / 249 / 209 / 155 / 198 全达标 · AC-2 缝零改（消费面五档零 diff + 调用点守恒）· AC-3 用例守恒（15 = 9 + 6 · 18 = 5 + 6 + 7）· AC-4 三树 core **663/663** · cli **850/850** · vsc **987/987** · AC-5 登记在盘 · AC-6 唯一锚更新（`settings-open-snapshots.test.mjs:164`）· AC-7 核面零改 · AC-8 复测收正。
- 逐字搬迁对拍（交付）：S1 / S2 / S3 / S4 与 HEAD 规范化多重集比对——仅签名 / `this`→`panel` / 导入别名类差异 ✓。

**记录面**
- 批后登记（#38）：VSC-DEBT §12.1 批后块 + 330 越线登记行 + §13.4 收正 + 变更记录一行 + 批档 §2 追加块——本席实读核过 ✓。
- 存量摘要：批档 §2 四·S2 原句「>450」与 §12.1 单源行异述 = **留痕**（权威 = §12.1 单源行；§2 收正块 `:219` 已注）——接受；VSC-DEBT 存量行宽 3 行（`:301` / `:650` / `:711`）非本轮新增——登记不动。

**收口**：§1 置「已收口」· 记录冻结；台账 #91 / #254 / #301 → 待核销 → 已核销；designToken 消费（链终止）。
