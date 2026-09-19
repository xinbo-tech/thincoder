# 批：2026-09-18 · VSC 会话界面接线修复（台账 #90）

> 批次边界：交付目标 = 「VSC 会话界面接线缺陷（F-W13–F-W16）修复」；条目集 = 需求档 `docs/vsc/requirements/WEBVIEW.md` F-W13–F-W16（承只读审计 id=98 · 用户 18:13「修，都修」批准）。
> 前情 = 配置页批 `docs/batches/2026-09-18-vsc-settings-wiring.md`（同板块前批 · 在实现轮）——**本批与其共享 `panel-messages.mjs` 写域 ⇒ 实现轮由调度器按文件冲突自动排队让位**。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）

### 1.1 目标与理由

用户 2026-09-18 17:59 要求「对 vsc 端的会话界面也做一次整体评估」→ 只读审计 id=98（🔴 **0** · 🟠 4 · 🔵 8 + 10 条设计意图）→ 用户 18:13「**修，都修**」。本批修四条 🟠；🔵 八条与设计意图十条**不在射程**（各自消解路径 + 到期条件已在需求档在册）。

### 1.2 本批覆盖的条目（逐条可交付 · 判据与链路见需求档）

| # | 需求 | 本批交付 |
|---|---|---|
| ① | **F-W13** 批权限卡必须可释放 | 合并询问卡（`permission-gate.mjs:92` 发 · 无 `promptId` · `webview/permission.js:86-117` 渲染）补释放路径（或携 `promptId` 并入逐项卡族）；Stop / Ctrl+I ⇒ **卡消失**（或转已拒绝态）；剩余按钮点击**零静默无效**（现 `panel-messages.mjs:315` `shift()` 空队 no-op） |
| ② | **F-W14** 回合中改模型须落盘（无静默覆盖） | 二选一（设计裁定并给判据）：**A** 忙态显式禁用模型/推理按钮（`loading.js` 派生）· **B** 回合尾落盘不携快照模型字段（`panel-chat.mjs:329` / `panel-callbacks.mjs:305` 的 `slotStamp` 面）⇒ 选择持久 |
| ③ | **F-W15** `@file` 展开不得污染人读线 | **口径 = A（父侧推荐 · 用户未异议即按此走）**：恢复回读**剥离展开**（还原 `@路径` 或等价简洁形）⇒ 活面/恢复面同形 + 人读线干净；落点由设计裁定（`history-window.mjs` 属核面 ⇒ 若落核须在受影响表标注并说明理由） |
| ④ | **F-W16** 工具非零退出可见性（CLI 对位） | 非零退出 ⇒ 可见失败信号（判据扩 / 摘要不吞退出码 / 卡片态，至少一项）；与 CLI 对位口径一致（`tool-summaries.mjs:60-68` 把退出状态拼进摘要）或按端差登记（设计给判据） |

### 1.3 本批不做（明确）

- **🔵 八条**（P2-1…P2-8 · 死写 / 死计数 / idle 残留轮次 / `@` 下拉重开 / 恢复卡缺摘要段 / 裁剪窗缺口 / 索引进度残留 / reload 撞在飞回合）零动作——除非与四条 🟠 自然同点（由设计裁定并**显式标注**）。
- **设计意图十条**（I-1…I-10）零动作（勿误修）——尤其 **I-8**（非零退出上游 `ok:true`，`dispatch.mjs:445`）不得改动。
- 配置页批写域**除 F-W14 必改点**（`panel-messages.mjs:139`）外零触碰；同域冲突由调度器排队消解，不手工串行。
- 不改会话切换守卫 / 槽原语 / `turn-model.mjs` 试运行语义 / `injectAtRefs` 展开本体。

### 1.4 边界

- 写域 = `thincoder-vscode/webview/**`（`permission.js` · `autocomplete.js` · `ui.js` 摘要与卡态面）+ `thincoder-vscode/src/extension/**`（`permission-gate.mjs` · `panel-messages.mjs` · `panel-callbacks.mjs`）+ 测试面；（F-W15 若落核 ⇒ `thincoder-core/history-window.mjs` 由设计标注后纳入）。
- 需求档 = 父侧笔（F-W13–F-W16 已落 · 不再扩写）。

### 1.5 验收口径

1. **可机判**：四条逐条断言级用例；**先红后绿**（F-W13 / F-W16 现态必红；F-W14 / F-W15 的先红形态由设计给全）。
2. **零回归**：`thincoder-vscode` `npm test` 全绿；CLI 对位面无回归（`tool-summaries` 面只在 F-W16 读对位时触碰）。
3. `node scripts/doc-check.mjs` 按档归属零新增。

## §2 批次任务与设计

### 2.1 设计裁定（四条 → 判据）

> 机制单源 = `docs/vsc/design/WEBVIEW.md` §4.1–§4.4（形态 / 忙态门 / 卡态判据 / 恢复面清洗）+ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 · §3.2 · §4.4 · §4.6（消息面 / id 纪律 / 释放通道）。本节只记**裁定 + 判据 + 先红**。

| # | 条目 | 裁定（选定 → 否决） | 判据（命令 / 断言级） | 先红 |
|---|---|---|---|---|
| ① | F-W13 批权限卡必可释放 | **甲：合并卡携 `promptId` 并入逐项卡族**（单一释放通道 `releasePermission` + 同一移除选择器 `.permission-prompt[data-prompt-id]`）→ 否决乙（单开释放语义：同语义两通道 + 消费者按类分支；`permissionWithdrawn` 已按 id 精确匹配，缺的只是「卡没 id」） | W13-1 停驻批门 + `_abortController.abort()` ⇒ 队空 ∧ 发 `{type:"permissionWithdrawn", promptId:<卡 id>}` ∧ promise = `"deny"`；W13-2 `data-prompt-id` 落 DOM + 收 `permissionWithdrawn` ⇒ 卡移除；W13-3 三按钮载荷携 `promptId`；W13-4 空队响应 ⇒ 发 `permissionWithdrawn{promptId}`（可见处置）；W13-5 两条目 id 精确匹配（非 `shift`） | 现态全红（零 postMessage / 无 `data-prompt-id` / `shift()` 空队 no-op / `shift()` 命中错条目） |
| ② | F-W14 回合中改模型不得静默覆盖 | **A：忙态显式禁用**（判据 = `_turnState !== "idle"`——与 `turnBusy()` 同源）→ 否决 B（回合尾落盘不携快照：落点 `panel-chat.mjs` 现处 **500 行硬限**，且入口守卫缺位时任何第三方写槽路径仍会被旧快照覆写）；B 的诉求由 A 直接消解（忙态无写 ⇒ 快照恒等于槽值 ⇒ 零覆写） | W14-1 `running` / `susp` ⇒ 两按钮 `disabled === true`（idle ⇒ false）；W14-2 忙态点击 ⇒ 零 `selectModel` / `selectReasoning` 且浮层关；W14-3 忙态 `models` 推送 ⇒ 零回写 post（显示仍刷）；W14-4 idle 面零回归（点击照发） | W14-1/W14-2/W14-3 现态红（零 `disabled` 派生 · 忙态照发 · 照回写） |
| ③ | F-W15 `@file` 展开不得污染人读线 | 口径 **A（父侧推荐）**：恢复时剥离展开还原简洁形；**落点 = 端侧显示边界**（`panel-session.mjs` `sendHistoryPage` user 分支——与既有 `stripEditorInjection` 同点同序），剥离函数与产者同档（`file-refs.mjs`）；否决落核 `history-window.mjs`——① 现消费方只有 VSC（核内 re-export 只供 `isRealUserMsg`；CLI 恢复渲染不经此档，全仓零 CLI 消费）② 注入语法的产者住端侧 ③ 落核即把端语法搬进核（D2 反） | W15-1 经真 `injectAtRefs` 产生的文本过 `sendHistoryPage` ⇒ 恢复文本 === 注入前原文（逐字）；W15-2 多引用 + 前后文 ⇒ 逐条还原；W15-3 边界（无摘要块 / 摘要块形近 / 字符数不符）⇒ 原样返回（fail-closed）；W15-4 `injectAtRefs` 返回值（落线 / 模型输入）逐字不变 | W15-1/W15-2 现态红（恢复面 = 展开文）；W15-3 现态绿（锁定不误伤） |
| ④ | F-W16 工具非零退出可见性 | 形式 = **判据扩（卡态 = 红 + 保持展开）+ 摘要含退出状态**（同一判据派生；「至少一」取全）→ 否决仅摘要（卡仍绿）/ 仅展开（折叠面读作 `(empty)`） | W16-1 `bash` 非零退出结果 ⇒ 状态词错误 + 红 + body 保持 `open` + 摘要含 `exit code N`；W16-2 `(killed: …)` 同判据；W16-3 退出 0 ⇒ 绿 + 折叠 + 摘要不含 `(exit code 0)`（零回归）；W16-4 反例：正文提及 `(exit code 1)`（非独占行）⇒ 不判失败；W16-5 恢复卡同判据（`buildFinishedToolCard`） | W16-1/W16-2/W16-5 现态红（`/^Error[:：]/` 判成功 ⇒ 绿 + 自动折叠 + 摘要 `(empty)`） |

**口径说明（可翻转项）**：② 的忙态判据取 `susp` 同禁（父侧判定句「含 digest/susp」按同读）；若只禁 `running` ⇒ 判据改一处（`!== "idle"` → `=== "running"`），代价 = 在飞蒸馏落盘窗回归（`panel-callbacks.mjs:319` 携旧回合 `slotStamp`）。此二选一由父侧（或用户）可翻。

### 2.2 受影响文件表（行数 as-of **2026-09-18 实测** · 口径 = 含末行；设计档两行 = **实计终值**、Δ = 实计净增，其余 Δ = 估）

| 文件 | 行数 | Δ | 面 |
|---|---|---|---|
| `thincoder-vscode/src/extension/permission-gate.mjs` | 104 | +8 | ① 释放通道泛化（队列参数）+ 合并卡 id |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 481 | +7 | ① 响应 id 匹配 + 孤儿回写 |
| `thincoder-vscode/webview/permission.js` | 118 | +5 | ① `data-prompt-id` + 三载荷携 id |
| `thincoder-vscode/webview/chat.js` | 411 | ±2（注释面——零行为） | ① 消费者注释订正（选择器本已覆盖） |
| `thincoder-vscode/webview/loading.js` | 64 | +10 | ② `modelSwitchBlocked()` + `applyBusyLock` 派生禁用 / 关浮层 |
| `thincoder-vscode/webview/model-picker.js` | 136 | +10 | ② 两入口守卫（点击 + `models` 回写） |
| `thincoder-vscode/webview/controls.css` | 648 | +5 | ② `.ctrl-btn:disabled` 可见态 |
| `thincoder-vscode/src/extension/file-refs.mjs` | 46 | +30 | ③ `stripAtRefs`（与产者同档） |
| `thincoder-vscode/src/extension/panel-session.mjs` | 353 | ±1 | ③ `sendHistoryPage` user 分支接剥离 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 425 | +1 | ② 状态栏判据集 +1（`waiting` 含批队——§2.7 ②） |
| `thincoder-vscode/webview/lib.js` | 64 | +12 | ④ `isToolFailure` 判据单源 |
| `thincoder-vscode/webview/ui.js` | 470 | +6 | ④ 活卡：判据换源 + 摘要含退出状态 + 展开门 |
| `thincoder-vscode/webview/tool-card-restore.mjs` | 77 | +3 | ④ 恢复卡同判据 |
| `thincoder-vscode/test/webview-permission-batch-release.test.mjs`（拟新增 | 0 | ~150 | ① |
| `thincoder-vscode/test/webview-model-busy-gate.test.mjs`（拟新增 | 0 | ~110 | ② |
| `thincoder-vscode/test/at-refs-restore.test.mjs`（拟新增 | 0 | ~140 | ③ |
| `thincoder-vscode/test/webview-tool-failure-signal.test.mjs`（拟新增 | 0 | ~110 | ④ |
| `thincoder-vscode/test/files.mjs` | 89 | +4（清单登记） | 四档入册（N-W5 清单制） |
| `docs/vsc/design/WEBVIEW.md` | 326（实计终值） | +72（254 → 326：设计轮 +46〔实计 300〕· §2.7 修轮 +19〔实计 319〕· §2.8 修轮 +6 · §2.9 收正轮 +1） | 机制单源 §4.1–§4.4 · 新 §9 |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 490（实计终值） | +39（451 → 490：设计轮 +21〔实计 472〕· §2.8 修轮 +8 · 实现轮 +10） | 机制单源 §3 / §3.2 / §4.4 / §4.6 |

- 跨限面：`panel-chat.mjs` 现 **500 行整**（硬限），本批**零触碰**（②选 A 的直接收益）；`chat-panel.mjs` 425 → **426**（距硬限余量 ≥74——不入近限档）；新增行一律入近限档（`panel-messages.mjs` 481 → ≤489 · `ui.js` 470 → ≤476）。
- **CSS 不入门（依据）**：`controls.css` **648 行**（>500 · 本批 +5 = `.ctrl-btn:disabled` 可见态）——「500 硬限」闸对象 = **代码模块**：① 判据句自带模块缝语义（越档 ⇒ 结构拆分并保持**对外缝** = 既有**导出名** / 调用点零改——`docs/vsc/requirements/PROJECT.md:72` N-P3）；② 先例 `VSC-DEBT.md` §3.3 D-3 两目标档均为 `.mjs` ⇒ **CSS = 渲染资产（无导出缝、拆分无判据面）、不入该闸、零拆分计划**。
- 同域冲突：`panel-messages.mjs` 与在飞配置页批共享写域 ⇒ 实现轮由调度器排队让位（§1 前言已载；本批触碰点 = `batchPermissionResponse` case，与配置页面零重叠）。

### 2.3 用例表（正常 / 边界 / 错误 + 先红形态）

| 用例 | 类 | 输入 | 期望 | 先红形态（读数） |
|---|---|---|---|---|
| W13-1 停驻批门 Stop 释放 | 正常 | `batchPermissionGate(panel)` 停驻 + `abort()` | 队空 ∧ `permissionWithdrawn{promptId}` ∧ resolve `"deny"` | 红：`posted` 零 `permissionWithdrawn`（`permission-gate.mjs:94-98` 无 post） |
| W13-2 卡族 id + 移除 | 正常 | `showBatchPermissionRequest({tools,count,promptId:7})` + `permissionWithdrawn{7}` | 卡 `dataset.promptId==="7"`；投放后卡不在 DOM | 红：卡无 `data-prompt-id`（`permission.js:86-117`）⇒ 选择器不命中 |
| W13-3 三按钮载荷 | 正常 | 点 approve-all / one-by-one / deny | 载荷 = `{choice, promptId}` | 红：载荷只有 `choice`（`:103/:107/:111`） |
| W13-4 空队响应零静默无效 | 错误 | `batchPermissionResponse{choice:"deny",promptId:99}` + 空队 | 零 throw ∧ 发 `permissionWithdrawn{99}` ∧ 队仍空 | 红：`shift()` 空队 ⇒ `entry?.resolve` no-op（`panel-messages.mjs:315`） |
| W13-5 id 精确匹配 | 边界 | 两条目（id 1/2）+ 响应 id=2 | 只 id=2 出队；id=1 仍在 | 红：`shift()` 命中队头（id=1） |
| W13-6 旧 webview 兼容 | 边界 | 无 `promptId` 的 `batchPermissionResponse` | 回退队头（既有语义） | 绿（回归锚——不得改） |
| W13-7 释放 ⇒ 状态栏刷新 | 正常 | 批门停驻（`batchPermissionGate(panel)` 未决）+ 期间一次 `_refreshStatus()` + `abort()` | 停驻期 status === `waiting`；释放后 ∈ {`idle`, `running`}（非残留 `waiting`） | 红：`chat-panel.mjs:205` 判据只读 `_permissionQueue` / `_questionQueue`（漏 `_batchPermissionQueue`）⇒ 停驻期读作 `running`；释放路径（`permission-gate.mjs:94-98`）零 `_refreshStatus` ⇒ 残留 `waiting` |
| W14-1 禁用派生 | 正常 | `turnState` running / susp / idle | 两按钮 `disabled` = true / true / false | 红：零 `disabled` 派生 |
| W14-2 忙态点击零写槽 | 正常 | 忙态点模型 / 推理按钮 | 零 `selectModel` / `selectReasoning`；浮层关 | 红：忙态照发（`model-picker.js:11` · `:29`） |
| W14-3 忙态 `models` 回写门 | 边界 | 忙态 `handleModelsMessage({models, prefs})` | 零回写 post ∧ 显示仍更新 | 红：照回写（`model-picker.js:116-117`） |
| W14-4 idle 零回归 | 正常 | idle 点击 + `models` 推送 | 照发（与现态同） | 绿（回归锚） |
| W15-1 恢复面还原 | 正常 | `injectAtRefs("@a.txt 看下", cwd)` 产物过 `sendHistoryPage` | 文本 === 注入前原文（逐字） | 红：恢复面 = 展开文 + 尾部摘要块 |
| W15-2 多引用 + 前后文 | 正常 | 两引用 + 前后文字 | 逐条还原、顺序保持 | 红：同上 |
| W15-3 不误伤（fail-closed） | 边界 | ① 手打 `[File: x]`（无摘要块）② 摘要块形近（字符数不符） | 原样返回（逐字不变） | 绿（锁定；实现后仍须绿） |
| W15-4 落线 / 机读线零改 | 边界 | `injectAtRefs` 返回值 | 与现态逐字相同（模型仍见正文） | 绿（回归锚） |
| W15-5 标题源文本同源剥离 | 正常 | 真 `injectAtRefs("@a.txt 看下", cwd)` 产物（`a.txt` 正文含唯一哨兵）经 `generateTitle(panel, slot)`（槽 `activeProvider` = 假 provider） | 捕获的请求载荷不含哨兵 ∧ 含 `@a.txt` ∧ 请求 ≥1 次（夹具前提五条见 §2.7 ①） | 红：`panel-session.mjs:266` 直取未剥离人读线 ⇒ 载荷含哨兵 |
| W16-1 非零退出（空输出） | 正常 | `[stdout]:\n(empty)\n\n(exit code 1)` | 错误 + 红 + 保持 `open` + 摘要含 `exit code 1` | 红：绿 + 自动折叠 + 摘要 `(empty)`（`ui.js:291` · `:276-283`） |
| W16-2 非零退出（有输出） | 正常 | `[stdout]:\nboom\n\n(exit code 2)` | 同上 + 摘要 = `boom (exit code 2)` | 红 |
| W16-3 被杀（含用户中断） | 错误 | `(killed: timeout)` · `(killed: user interrupted)`（用户 Stop / abort 打断——`thincoder-core/tools/bash.mjs:220-223` `signal?.aborted`） | 错误 + 红 + 展开 + 摘要含 `killed` | 红 |
| W16-4 成功面零回归 | 正常 | `[stdout]:\nok\n\n(exit code 0)` | 绿 + 折叠 + 摘要 `ok`（不含 `(exit code 0)`） | 绿（回归锚） |
| W16-5 反例面 | 边界 | 结果正文含 `see (exit code 1) in log`（非独占行） | 不判失败（绿 / 折叠） | 绿（锁定判据精度） |
| W16-6 恢复卡同判据 | 正常 | `buildFinishedToolCard({name:"bash", result:"…(exit code 1)"})` | 状态词错误 + 红 | 红（`tool-card-restore.mjs:28` 同旧谓词） |

### 2.4 验收（承 §1.5 —— 读数口径）

1. 四条**逐条断言级**：上表 22 例；`node --test thincoder-vscode/test/<四档>` 全绿，且**先红项实现前必红**（读数逐条记入 §5）。
2. 零回归：`thincoder-vscode` `npm test` 全绿；协议机检双向对账集不动（只增字段 / 只补登——§12 · §13 首列判别式集零变）。
3. `node scripts/doc-check.mjs` **按档归属零新增**：本批两档（`docs/vsc/design/WEBVIEW.md` · `WEBVIEW-PROTOCOL.md`）零悬空、零超宽行；全仓读数 = **6 悬空 / 9 超宽**（悬空与批前同值；超宽 7 → 9 = 他档在飞改动面新增行 2——`docs/core/design/PROMPT-SYSTEM.md:292` · `docs/core/requirements/PROMPT-SYSTEM.md:168`，逐条非本批面）；新增 2 条**报告面**（符号·宽：`modelSwitchBlocked` / `isToolFailure`——实现轮落地后自然退场）。
4. 边界纪律：`dispatch.mjs` 的 `ok:true`（I-8）零动；`turn-model.mjs` 零动；`injectAtRefs` 展开本体零动；人读线存储本体零动；`_archive/**` 零动。

### 2.5 边界（本批不做）

- 🔵 八条（P2-1…P2-8）与设计意图十条零动作；四条 🟠 与它们的自然同点：**零**（已逐条核：`permission.js` 改动只触合并卡函数体 · `ui.js` 改动只触 `finishToolCard` / `resultSummary` · `model-picker.js` 改动只触两入口守卫）。
- 不做 `permissionWithdrawn` 的「已拒绝态」变体（卡消失为唯一释放形态）；**不做工具卡 `(stopped)` 面的判据扩**（`(stopped)` = `execute` 工具的用户中止自报形——`thincoder-core/tools/execute.mjs:147`，不入 `isToolFailure` 判据）；**`(killed: user interrupted)` 并入失败面**（父侧裁定：用户中断的命令确未完成 ⇒ 卡面如实显示失败更诚实；与 CLI 摘要含该状态同向；判据点 = W16-3 邻位）；不做成功面 `(exit code 0)` 拼接。
- 不做 `execute` 工具 stderr-only 分支的核结果形态改动（核语义禁改——登记见 2.6 #4）。

### 2.6 上抛项（父侧裁定 / 收正 —— 均为范围外发现，本批未动）

1. **`generateTitle` 消费污染文本**：`thincoder-vscode/src/extension/panel-session.mjs:262` 读人读线首条 user 消息（= 注入文）⇒ 会话标题可能由文件正文生成（F-W15 同根因、不同面）。建议：同批接 `stripAtRefs`（1 行，与 ③ 同点）或父侧登记（消解路径 + 到期条件）。
2. **VS Code 状态栏 `waiting` 残留**：释放路径（`releasePermission`）不调 `_refreshStatus`，且 `chat-panel.mjs:205` 不读 `_batchPermissionQueue` ⇒ Stop 释放后状态栏可能仍读「waiting for your input」（host 状态栏面，非 webview 卡面）。建议 1 行 `_refreshStatus()` 于释放路径，或父侧登记。
3. **F-W16 端差二条待父侧落登记**（需求档 §4 = 父侧笔）：① 卡态（红 + 保持展开）为本端独有形态（CLI 无卡）② 成功面 CLI 恒拼 `(exit code 0)`、本端不拼。
4. **`execute` stderr-only 失败分支无退出标记**：`thincoder-core/tools/execute.mjs:154` 有 stderr 时结果不含 `(exit code N)` ⇒ 判据无标记可判、仍读成功；核结果形态改动不在射程 ⇒ 登记（消解路径 = 核面补标记；到期 = 核工具输出面下次触碰）。
5. **`@` 引用语法非单射残余**：`file-refs.mjs:34-38` 用 split/join 替换 ⇒ 文件正文含 `@raw` 形态 / 正文含 `[File: …]` 文字时，逆变换只能 fail-closed（最坏 = 原样显示注入文，零误伤零损坏）。
6. **设计档预存在悬空小节引用**：`docs/vsc/design/WEBVIEW.md` 头注与变更记录引 `§9`（切面取舍）×2，而该档无 §9——本批未动（避免动既有行号与语义），建议父侧裁定（补节 or 改指针）。
7. **需求档预存在债（父侧同轮写入面）**：`docs/vsc/requirements/WEBVIEW.md:49`（309 字符超宽 = F-W13–F-W16 段）+ `:59`（悬空 `_archive/SETTINGS-PANEL-2.md:31`）——前批 advisor-face 已报备为父侧自收正项，本批只读复核（零新增）。
8. **批档形态收正（本批自身动作 · 机械面）**：`2026-09-18-vsc-session-wiring.md` 的状态行原写于档头引块（不在 §1 段内）⇒ `batch_segment` 解析 fail-closed（§2 拒写）；已按 `BATCH-RECORD.md` §4.9 解析口径移入 §1 首行（形态 = `**状态行**：🔄 进行中（设计轮 · eng-designer）`，**值逐字未改**）。
9. **F-W4 两卡面在「瘦身长结果」上失对齐**（评审发现 4 · 本批登记 · 零动作）：人读线工具结果经 `thincoder-core/session-segments.mjs:53-55` 瘦身（头 500 字符 + `\n… (truncated for storage)`）⇒ 长结果尾部 `(exit code N)` **不入盘**；恢复卡读的正是该瘦身文本（`thincoder-core/history-window.mjs:152` `result: toolMsg.content`）⇒ **无标记可判** ⇒ 恢复卡读成功（绿 / 折叠），活卡（全文）红 + 保持展开 ⇒ 设计档 §4.3「两卡面终态同形（F-W4）」在该类输入不成立。**判据（先红复现）**：>500 字符的失败结果（`(exit code 1)` 居尾）过 `slimForDisplay` ⇒ 产物不含 `(exit code 1)`；同文本过 `buildFinishedToolCard`（`thincoder-vscode/webview/tool-card-restore.mjs:28`）⇒ 绿。**消解路径**：瘦身面保留尾部状态行（核 `session-segments.mjs` 瘦身策略加尾保留）或核结果面另携退出码字段。**到期条件**：核瘦身 / 记录存储面下次触碰（本批禁改——§1.4 人读线存储本体零动）。**取登记而非用例的理由**：暴露成红的用例须同批改核面（否则该例恒红，与 §2.4「四档全绿」验收相抵）。
10. **F-W15 端差：CLI 面渲染仍显展开文**（评审发现 10 · N-W6 端差登记 · 本批零动作）：本批口径 = **端侧显示边界剥离**（`panel-session.mjs` `sendHistoryPage` user 分支 + 标题源 `:266`）⇒ 人读线盘面（CLI 与本端**共文件**）零改 ⇒ **同一消息的 CLI 恢复渲染仍显 `[File: …]` 展开文**（两端不同形）。现状 = 端差已在设计层落判（§4.4 落点判据：核窗口面零 CLI 消费 ⇒ 落核零收益）；**是否另轮处置 = 父侧裁定**（若改须 CLI 对位同裁——需求档 §4 端差登记面 = 父侧笔）。到期条件：CLI 恢复渲染面 / 需求档 §4 端差登记面下次触碰。

11. **`bash` spawn 失败形态无退出状态行**（实现轮评审 🔵#6 带上 · 本批零动作）：`thincoder-core/tools/bash.mjs:189` 非 abort spawn 错误分支产 `Command failed: <error.message>` + `[stdout]:`（真 spawn 失败：命令不存在 / ENOENT / EACCES）——**无 `(exit code N)` / `(killed: …)` 状态行** ⇒ F-W16 判据两分支（`Error:` 前缀 ∪ 独立成行状态行——`webview/lib.js:91-96`）均不命中 ⇒ 卡读**绿 + 折叠**（活卡 / 恢复卡同）。
    消解路径 = 核结果面在该分支补状态行（与 #4 `execute.mjs:154` 同族）或端侧判据集加 `Command failed:` 前缀（跨端措辞面 ⇒ 须 CLI 对位同裁）；到期条件 = 核工具输出面（`bash.mjs` / `execute.mjs` 结果包装）下次触碰。
12. **第三卡面（历史孤儿工具卡）未入 F-W16 判据**（父侧裁定：登记 · 另轮 · 本批零动作）：`thincoder-vscode/webview/ui.js:359-392` `buildToolHistory`（`historyPage` 中无宿主帧的工具行保底卡）状态词**恒 `tool.done` + 绿**（`:374` 硬编码 `#4ec9b0`——零判据读取）⇒ 同一失败结果**三卡面不同形**：活卡 = 红 + 保持展开（`ui.js:295-331`）· 恢复卡 = 红（`tool-card-restore.mjs:29`）· 本卡 = 绿 + 折叠（摘要经 `resultSummary` `:283-286` 已含退出状态 ⇒ **摘要对、卡态错**的第三形态）。
    是否同形 = **另裁点**：设计档 §4.3 的「两卡面终态同形（F-W4）的机器面」只点名活卡 + 恢复卡 ⇒ 第三卡面未入判据（非回归——设计未覆盖）；纳入 ⇒ 同改 `buildToolHistory`（判据 + 红 + 展开）与 §4.3 / §6 决策句；不纳入 ⇒ §4.3 须明载该差异（否则读者按「同形」推断出错误期待）。到期条件 = 工具卡族面（`ui.js` 卡面构造 / F-W4 判据面）下次触碰。

### 2.7 父侧裁定带上三项（修轮折入 · 逐项落点 + 判据 + 先红）

> 承 §2.6：父侧逐条裁定「带上」= #1（标题面）· #2（释放 ⇒ 状态栏刷新）· #6（`WEBVIEW.md` 悬空 `§9`）。本段 = 三项的设计落点 + 判据 + 读数；**零新语义**（均为既有机制的同族补点——不新增需求条目，需求档零笔）。**不动作**：#3 / #7（需求档 = 父侧笔）· #4（核结果形态禁改）· #5（fail-closed + 登记）· #8 后半（配置页批已冻结）· **#9 / #10（本轮新增——零动作登记）**。

**① 标题面（F-W15 族 · 承 §2.6 #1）**

- 缺陷：`thincoder-vscode/src/extension/panel-session.mjs:262` 取人读线首条 user 消息 → `:266` `generateSessionTitle(firstUser.content, …)`——人读线 = **注入文**（`panel-chat.mjs:246` 落线调 `injectAtRefs` · 产者 `file-refs.mjs:34-42`）⇒ 标题可由 `[File: …]` **文件正文**生成（F-W15 同根因 · 不同面）。
- 落点：`:266` 入参同接**同档剥离函数**（`file-refs.mjs`——与 ③ 同一函数、零第二实现）+ import 行 1 条（`:16` 邻位；同一 import 服务 ③ 与 ① 两面，调用点内联零增行）。
- 判据（用例 **W15-5**）：真 `injectAtRefs("@a.txt 看下", cwd)` 产物（`a.txt` 正文含唯一哨兵）过 `generateTitle` ⇒ **入参级**（捕获交给标题生成器的文本）**不含哨兵** ∧ 含 `@a.txt`。**捕获手法 = 本地 HTTP 服务器捕请求载荷**（既有先例 = `test/trace-store.test.mjs:323-347` `sseServer()`：`node:http` + `listen(0, "127.0.0.1")` + 记录 `req` 体；不断言响应、不取 `mock.module`——端侧 test 树零先例）。
- 先红：现态 `:266` 直取注入文 ⇒ 入参/载荷必含哨兵（红）。
- **夹具前提五条**（捕获成立的必要条件）：① 隔离 = `_setConfigPathForTest` + `_setSessionsDirForTest`（先例 `test/chat-panel.test.mjs:31-45`），临时 `config.json` 内 provider 条目 `baseURL` = 假服务 url（端壳经 `presets.mjs` 读盘配置取 key / provider）；② 槽数据 `activeProvider` = 该 provider 名（`panel-session.mjs:266` 取 `data.activeProvider`）+ `history[0]` = 真 `injectAtRefs` 产物；③ **剥离后文本 ≥ 10 字符**（核 `thincoder-core/generate-title.mjs:28` 短文本早退 ⇒ 零请求；`"@a.txt 看下"` 实为 9 字符——用例首句须 ≥10）；④ 哨兵须入**前 200 字符窗**（`:33` `userText.slice(0, 200)`）⇒ 哨兵放 `a.txt` 正文首行；⑤ 断言三条并列 = 请求 ≥1 次（防零请求假绿）∧ 载荷不含哨兵 ∧ 载荷含 `@a.txt`。
- **待裁（报告项 · 本轮未落）**：会话列表回退引号面同源污染——`panel-session.mjs:291` `title: s.title || \`"${truncate(s.firstMessage, 40)}"\``，其 `firstMessage` 由核 `session-store.mjs:329` 取未剥离人读线 `slice(0, 80)` ⇒ 标题缺失窗内下拉项仍读文件正文；**跨端面**（该行注释明载「Same label fallback chain as CLI /session」）⇒ 若修须 CLI 对位同裁。

**② 释放 ⇒ 状态栏刷新（F-W13 族 · 承 §2.6 #2）**

- 判据（单源 = `WEBVIEW-PROTOCOL.md` §4.4）：`waiting` = **权限 / 批权限 / question 三队列任一非空**（现态 `chat-panel.mjs:205` 只读前二者）+ **释放 ⇒ 必刷**（刷新点单源 = 释放通道 `releasePermission`——`permission-gate.mjs:27-35`，泛化后含批队参数）。
- 先红二条（现态读数）：㈠ 批门停驻期任一 `_refreshStatus()` 触发（如 `panel-messages.mjs:286` question 响应）⇒ 判据漏批队 ⇒ 读作 `running`（卡在屏而「需你输入」丢失）；㈡ 停驻释放 `permission-gate.mjs:94-98`（splice + resolve `"deny"` · 零 `_refreshStatus`）⇒ 残留 `waiting`（直到回合尾 `panel-chat.mjs:348` 才收正）。
- 判据（用例 **W13-7**）：批门停驻（`batchPermissionGate(panel)` 未决）+ 期间一次 `_refreshStatus()` + `abort()` 释放 ⇒ 停驻期 status === `waiting` ∧ 释放后 === `idle`（`running` 亦合规——非残留 `waiting`）。
- 面：`chat-panel.mjs:205` 判据集 +1（`this._batchPermissionQueue?.length`——懒建队列 `permission-gate.mjs:89`，构造器零改）+ 释放通道 +1 行。

**③ `WEBVIEW.md` 悬空 `§9` 收正（承 §2.6 #6）——裁定 = 补节（否决改指针）**

- 判据：① 逆向引用 **4 处**（本档头注 `:7` / 变更记录 `:292` + 迁移台账档 INVENTORY `:260` / `:407` D-VM8）⇒ 改指针须同改他批档、且内容无归属；② **单源指定**——INVENTORY `:260` 明载「切面取舍理由（含否决备选）见 `docs/vsc/design/WEBVIEW.md §9`」（缺的是节，不是指针）；③ 补节零跨档写。
- 落点：`docs/vsc/design/WEBVIEW.md` 新增 **§9「三档切面取舍（拆档决策 · 含否决备选）」**（切面表三行 + 判据「读者面不同」+ 否决备选二条 + 批次材料指针 INVENTORY §9.2——D2 不复制）；插于 §8 与 §10 之间 ⇒ 既有节号零变、两处悬空引用**就地转活**（零文本改写）。

**计数同轮同步（D3）**

| 表 | 批前 | 本轮 | 说明 |
|---|---|---|---|
| §2.2 受影响文件表 | 19 行 | **20 行** | 增 `chat-panel.mjs` 行（② 判据集）；`panel-session.mjs` / `permission-gate.mjs` / `WEBVIEW.md` / `WEBVIEW-PROTOCOL.md` 行按实改复核（读数见下） |
| §2.3 用例表 | 20 行 | **22 行** | 增 W13-7（② 状态栏）· W15-5（① 标题面）；**收正**：§2.4 原记「上表 22 例」= 计数漂移（实计 20）——本轮 +2 后实计 22（与原误数巧合同值，不追认） |
| 拟新增测试档 | 4 档 | 4 档（不变） | 两新例分别入 `webview-permission-batch-release.test.mjs`（Δ ~120 → ~150）· `at-refs-restore.test.mjs`（Δ ~110 → ~140） |

**读数复核（本轮实测 · 同 §2.2 口径 = 含末行）**

- `docs/vsc/design/WEBVIEW.md` **300 → 319**（本轮 Δ **+19** = 新 §9 14 行 + §4.1/§4.4 各 1 + 变更记录 3；**评审修正轮再 +6 ⇒ 325**——§4.2 / §4.3 / §4.4 各 1 + 变更记录 3，见 §2.2 与修轮段）；§2.2 原记「254 + 48（已落）」为**估列**（表头自载「Δ = 估」）——254 + 48 = 302 vs 实计 300（差额 2 行），本轮起该行改实计口径。
- `docs/vsc/design/WEBVIEW-PROTOCOL.md` **472 → 480**（本轮 Δ **+8** = §4.4 1 + §4.6 1 + §7 D-P13 1 + §9 U-P8 1 + 变更记录 4）；§7 D-P **十二 → 十三** · §9 U-P **七 → 八**（计数与列表同改）。
- `thincoder-vscode/src/extension/chat-panel.mjs` **425** 行（表口径）；父侧所报 **424** = `find /c /v` 口径（本机复核 424）——两口径差 1 行，**距 500 硬限余量 ≥ 75 行**（② 改点单行）。
- `panel-session.mjs` 353 · `permission-gate.mjs` 104 · `file-refs.mjs` 46：与 §2.2 现值同（Δ 列另计）。

**机检读数（`node scripts/doc-check.mjs`）**

- **悬空 6 / 超宽 7 = 与批前同值**（逐条同为他档预存在债——6 悬空逐条比对一致）；本批两档零新增（闸面）。**评审修正轮复跑：6 悬空 / 9 超宽**——增 2 = 他档在飞改动面新增行（`docs/core/design/PROMPT-SYSTEM.md:292` · `docs/core/requirements/PROMPT-SYSTEM.md:168`）；本批两档仍零（逐条归属核）。
- 报告面（符号·宽——不入闸）：本批两档**零新增**——措辞取既有描述式，拟新增符号名（`stripAtRefs`）只出现在本批档 §2 面、不进设计档；批前 2 条（`modelSwitchBlocked` / `isToolFailure`）随行号位移，实现轮落地后自然退场。
- 中途读数提示：§9 以反引号全档名引用时曾多出 2 条报告面（文件名切词）⇒ 改取本板块既有短名引用形（INVENTORY §9.2——与 `VSC-MIGRATION.md:50` / `:119` 同形）后归零。

**设计档落地**：`WEBVIEW.md` §4.1 / §4.4 / §6 D-W17 / **新 §9** / §10 行 8·11 / 变更记录；`WEBVIEW-PROTOCOL.md` §4.4 / §4.6 / §7 D-P13 / §9 U-P8 / §11 行 8 / 变更记录。

**四条已裁机制零改**：F-W13 甲（并族 + 单释放通道）· F-W14 A（忙态禁用）· F-W15 口径 A + 端侧落点 · F-W16 判据扩 + 摘要含退出状态——本轮只在其族内**补判据 / 判据集**（①②），机制本体零动；🔵 八条与设计意图十条零动作。

### 2.8 评审修正轮（评审 id=104 发现 1–8 + 端差登记 · eng-designer · 2026-09-18）

> 处置执行人 = 本段（承 §3 轮次 1 的 Issue / Suggestion 列 + 父侧逐条裁定）；**零新语义**（表体 / 边界 / 措辞 / 判据面的收正 + 两条零动作登记，不新增需求条目、不动四条机制本体）。**表体改动均就地回填**（非另立副本——D2）。

| 号 | 类别 | 改动 | 落点 `file:line` | 读数 |
|---|---|---|---|---|
| 1 | 🟡 §2.2 失同步 | 补 `chat-panel.mjs` 行（**425 → +1**）；两新测试档 Δ `~120/~110` → **`~150/~140`**；两设计档改**实计口径**；表头补口径句（含末行 · 设计档 = 实计净增） | 批档 §2.2（`docs/batches/2026-09-18-vsc-session-wiring.md:56` · 行 `:69` · `:73` · `:75` · `:78-79`） | §2.2 **20 行** = §2.7 计数表 20 行（脚本实计）；16 档行数逐档复读与表值一致 |
| 2 | 🟡 用例表 vs 验收句 | §2.3 按号序补 **W13-7**（§2.7 ② 判据逐字派生）· **W15-5**（§2.7 ① 判据逐字派生），四列齐全 | 批档 §2.3（`:95` · `:104`） | §2.3 **22 行** = §2.4「上表 22 例」= §2.7 计数表 22 行；用例号实计 = W13-1…7 / W14-1…4 / W15-1…5 / W16-1…6 |
| 3 | 🟡 F-W16 跨面 | `killed: user interrupted` **并入失败面**（父侧裁定）⇒ §2.5 排除项收窄为只 `(stopped)`；W16-3 改「被杀（含用户中断）」并入该值；设计档同轮补判据项与边界句 | 批档 §2.5（`:122`）· §2.3 W16-3（`:107`）· 设计档 `docs/vsc/design/WEBVIEW.md:105` · `:109` | `thincoder-core/tools/bash.mjs:220-223`（`signal?.aborted` ⇒ `killed: user interrupted`）· `execute.mjs:147`（`(stopped)`）实读在案 |
| 4 | 🟡 F-W4 两卡面 | 按 §2.6 体例加**登记 #9**（现状 / 判据（先红复现）/ 消解路径 / 到期条件 + 取登记而非用例的理由） | 批档 §2.6 #9（`:135`） | 读数 = `session-segments.mjs:53-55`（头 500 截断）· `history-window.mjs:152`（`result: toolMsg.content`）· `tool-card-restore.mjs:28` |
| 5 | 🟡 controls.css 648 | §2.2 跨限面句补 **CSS 不入门依据**（闸对象 = 代码模块：判据句自带模块缝语义 + D-3 先例两档均 `.mjs`）——零拆分计划 | 批档 §2.2（`:82`） | `controls.css` 实计 **648**（含末行口径）✓；依据句引 `docs/vsc/requirements/PROJECT.md:72` N-P3 |
| 6 | 🔵 §4.2 措辞 | 「与 Send / Stop 同源」→「**同经 `S._turnState` 派生的独立谓词**」+ 点明差值（Send / Stop = `=== "running"`；本门 = 非 `idle`） | 设计档 `WEBVIEW.md:96` | `webview/loading.js:56-57` 实读 = `=== "running"`（两行）✓ |
| 7 | 🔵 W15-5 捕获缝 | 指定 **捕获手法 = 本地 HTTP 服务器捕请求载荷**（先例 `test/trace-store.test.mjs:323-347`）+ **夹具前提五条**（含「剥离后 ≥10 字符」「哨兵入前 200 字符窗」两陷阱） | 批档 §2.7 ①（`:146` · `:148`）· §2.3 W15-5（`:104`） | 核 `thincoder-core/generate-title.mjs:28`（`<10` 早退）· `:33`（`slice(0,200)`）；端侧 test 树零 `mock.module` 先例（实查） |
| 8 | 🔵 悬空 `§5.6` | `§5.6` → **`§5.5`** 收正 | 设计档 `WEBVIEW.md:31` | 同档 §5 止于 §5.5（两层独立内容在 `:199-207`）；本档 `§5.6` 零残留 |
| ⑩ | 端差登记（N-W6） | §2.6 加**登记 #10**（F-W15 端侧剥离 ⇒ CLI 面仍显 `[File: …]`；是否另轮处置 = 父侧裁）+ 设计档 §4.4 补端差句（指针 = 需求档 §4 + 批档 §2.6 #10） | 批档 §2.6 #10（`:136`）· 设计档 `WEBVIEW.md:117` | 端侧剥离落点实读 = `panel-session.mjs:200-213`（与 `stripEditorInjection` 同点同序）✓ |

**本修轮读数（终值）**

- `docs/vsc/design/WEBVIEW.md` **319 → 325**（Δ **+6** = §4.2 / §4.3 / §4.4 各 1（长行切分）· 变更记录 3）；`WEBVIEW-PROTOCOL.md` **480**（零触碰）。§2.2 该行取**实计终值 325**（父侧派单所据 319 = §2.7 修轮读数——本修轮自身 +6，故表值随实计；§2.7 读数复核处已加指针）。
- 机检 `node scripts/doc-check.mjs`：**本批两档零悬空 · 零超宽**（逐条归属核，两档各 0 行）；全仓 **6 悬空 / 9 超宽**（悬空同批前；超宽 7 → 9 两行 = 他档在飞改动面新增行——`docs/core/design/PROMPT-SYSTEM.md:292` · `docs/core/requirements/PROMPT-SYSTEM.md:168`）；§2.4 · §2.7 机检句已同步该读数。
- 过程留痕（诚实面）：本修轮自身首轮曾把 `WEBVIEW.md:96 / :103 / :317` 三条推过 300 字符线 ⇒ 被机检打红 ⇒ 就地**切分**（同列续行形）后复跑归零——**长行纪律在本轮自身被测到并已收正**。

**观察项（零动作 · 交父侧裁）**

1. **`(stopped)` ∥ `(killed: user interrupted)` 判据面相反**：两者同为用户中止面（`execute` 自报 `(stopped)` 不入判据集 / bash `killed: user interrupted` 入失败面）——按父侧裁定 ③ 落笔；若认二者应同面，须另裁且涉核面 `execute.mjs:147` 形态改动（越本批射程）。
2. **需求档缺「§5 越档面指针」节**：`docs/vsc/requirements/PROJECT.md` 变更记录（`:78`）载「批 7 新增 §6 N-P1–N-P3 **+ §5 越档面指针**」，而档内 §4 → §6 直跳（无 §5）——发现 5 的 CSS 豁免依据若拟落需求档，落点缺位（需求档 = 父侧笔，本批零动）。

### 2.9 交付面之外收正轮（父侧裁定 5 项 · eng-designer · 2026-09-18）

> 承 §5.6（实现轮代码评审 🔵#3/#4/#6）+ §5.7 披露 ④ + 父侧裁定「交付面之外 5 项全由设计面落」。**只落交付面之外**：实现面代码（`ui.js` / `bash.mjs` 零触碰）· 需求档 · 他批档 · `_archive/**` · 四条机制与已落用例逐条零动。**坐标口径** = as-of 2026-09-18 实现轮实测（读数逐项在表）。

| 项 | 改动 | 落点 `file:line` | 读数（本轮实测） |
|---|---|---|---|
| ① | 协议档 §12 `agentSettings` 行②列 + 表头注按实测重出（标 as-of） | `docs/vsc/design/WEBVIEW-PROTOCOL.md:330`（行）· `:322`（注） | `node test/protocol-coverage.test.mjs --emit` ⇒ `chat-panel.mjs:329/:334` + `panel-messages.mjs:432`；打开拍触发位 = `panel-messages.mjs:415`（`_pushSettingsLight()`）——**直发点实测 3 处**（原「共 4 处」归正） |
| ② | 批档 §2.2 `WEBVIEW-PROTOCOL.md` 行读数随 §5 收正 | 批档 `:79` | 实计 **490** = §5.4 终值 ✓（Δ +39：451 → 490——实现轮 +10） |
| ③ | §2.6 加登记 **#11**（`bash.mjs:189` spawn 失败形态） | 批档 `:138-139` | 运行读数：`isToolFailure('Command failed: spawn ENOENT…')` = **false**（对照 `(exit code 1)` = true）⇒ 绿 + 折叠 |
| ④ | 设计档 §4.1 / §4.4 散文面坐标按实测重出（标 as-of） | `docs/vsc/design/WEBVIEW.md:89` · `:115` | `chat.js:257-263`（case 全块）· `panel-session.mjs:264`（首条 user 消息读取）· `:269`（生成调用入参剥离位） |
| ⑤ | §2.6 加登记 **#12**（第三卡面 `buildToolHistory` 未入判据） | 批档 `:140-141` | `ui.js:374` 状态词恒 `tool.done` + 绿（硬编码）；摘要经 `resultSummary`（`ui.js:283-286`）已含退出状态 |

**读数复核（本轮实测）**

- `docs/vsc/design/WEBVIEW.md` **325 → 326**（Δ **+1** = 变更记录一条；§4.1 / §4.4 两处 = **行内改写**——零行数增减）；§2.2 该行随实计改 **326**。§5.4 记 325 = **实现轮终值**（该行「本批零触碰 ✓」对实现轮仍成立）——两值差 1 = 本轮变更记录行；§5 = eng-coder 段，本轮零触碰。
- `docs/vsc/design/WEBVIEW-PROTOCOL.md` **490 → 490**（本轮两处 = **单行替换**——零行数增减）⇒ §2.2 表值 = §5.4 表值 = 实测 **490** 三者同值 ✓。
- **机检** `node scripts/doc-check.mjs`：本批两档**零悬空 · 零超宽**（逐档归属核）；全仓 **5 悬空 / 11 超宽**——悬空 5 = §5.3 同值（逐条他档路径族债：`AGENT-LOOP-SUBAGENT.md:417` · `CORE-UNIFICATION.md:515` · `DOC-DISCIPLINE.md:529` · `SESSION.md:238` · `WORKSPACE.md:18`）；超宽 11（§5.3 读 8 ⇒ +3，逐条他档：`CONTEXT-COMPACTION.md:303` · `prompts/persona-engineering.md:137/:139` 等）——**本批两档改动前后同读数（零新增）**。
- **协议机检** `node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs`（`thincoder-vscode/`）= **7 / 7 pass**（§12 新行五列齐 · 首列 ↔ 提取集双向对账零漂）。
- **边界核**：代码面（`thincoder-vscode/**` · `thincoder-core/**`）· 需求档 · 他批档 · `_archive/**` **零触碰**——本段全部改动 = 三份 md（两设计档 + 本批档 §2）。
- **过程留痕（诚实面）**：§12 该行「（共 4 处）」为**历史计数**，提取器实测直发点 = **3**（`--emit` 输出逐字）⇒ 本轮按 D3「计数与列表同改」归正，并把非直发位（打开拍触发位 `:415`）**标注化**（不再计入处数）；若父侧认该计数应保留原语义，该格可回退。

**观察项（零动作 · 交父侧）**

1. **§12 其余行的坐标同样已随实现轮位移**（`proxySettings` / `websearchSettings` / `shellCandidates` / `i18n` / `turnState` 等行）：本轮按父侧裁定的「该行」范围**只重出 `agentSettings` 行**；其余行仍按 `:325` 声明的 as-of 口径读（D4 许可）。拟全表 sweep 时，提取器 `--emit` 输出 = 唯一权威，宜另轮一次做完。
2. **§4.4 同源坐标另有一处历史记录**（`WEBVIEW.md:323`——§2.8 修轮条目内记 `panel-session.mjs:262` · `:266`）：本轮**不改写历史条目**，改由本轮变更记录条（`:325`）回指「上条记录所载坐标 = 该轮时点值」——与协议档 `:322` 收正注同法。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件表 · 验收（criterion 8） | 🟡 | `docs/batches/2026-09-18-vsc-session-wiring.md:60-78` 受影响文件表实计 **19 行、无 `chat-panel.mjs` 行**，而 `:160` 计数表断言「19 → **20 行**（增 `chat-panel.mjs` 行）」；② 改点确在 `chat-panel.mjs:205`（`:149`），该档 425 行（实读 `chat-panel.mjs:424-425`）⇒ 被改文件的行数/Δ 未落表。同批失同步另二处：两新测试档 Δ 仍记 ~120/~110（`:72`/`:74`）vs §2.7 修后 ~150/~140（`:162`）；两设计档行仍记 254/+48 · 451/+28（`:77-78`）vs 读数复核 319 · 480（`:166-167`；实读同为 319 · 480） | 把 §2.7 已列读数回填 §2.2：补 `chat-panel.mjs` 行（425 → +1）、两新档 Δ 取修后值、两设计档改实计口径——表体与计数表同步 |
| 2 | 验收标准（例数 vs 表体） | 🟡 | §2.3 用例表实计 **20 行**（`:87-106`），而 §2.4 与 §2.7 均记 **22 例 / 22 行**（`:110` · `:161`）；W13-7 · W15-5 只以判据段存在于 §2.7（`:148` · `:140`），无「类／输入／期望／先红形态」四列行 ⇒ 验收句「上表 22 例」指不到 22 行 | 在 §2.3 表尾补 W13-7 · W15-5 两行（四列齐全），或把 §2.4/§2.7 计数改为与表体一致 |
| 3 | 需求边界（F-W16） | 🟡 | 判据 `(killed: …)`（`WEBVIEW.md:103`）覆盖核 bash 的 `killed: user interrupted`（`thincoder-core/tools/bash.mjs:221-223`：`signal?.aborted` ⇒ 该值）——即用户 Stop/abort 面；批 §2.5 明载「不做工具卡 `(stopped)`／abort 面的判据扩」（`:118`），W16-3 仅演 `killed: timeout`（`:103`）⇒ Stop 打断中的 bash 卡由「绿+折叠」翻「红+展开」，跨两处边界且未裁未登记 | 裁定 `killed: user interrupted` 的归属（并入失败面／排除该值），结论同步进 §2.5 边界句与 W16-3 邻位用例（或按端差登记） |
| 4 | 需求覆盖（F-W4 两卡面对齐） | 🟡 | 恢复卡读的人读线工具结果经 `slimForDisplay` **头 500 字符截断**（`thincoder-core/session-segments.mjs:53-55`；回读 `thincoder-core/history-window.mjs:152` 取 `toolMsg.content`）⇒ bash 结果 > ~500 字符时尾部 `(exit code N)` 不入盘，恢复卡仍读成功，活卡（全文）红+展开 ⇒ `WEBVIEW.md:104` 断言「两卡面终态同形（F-W4）的机器面」在该类输入不成立；§2.6 未登该残余（对照 `:125-127` 的 #3/#4/#5 体例） | 按 §2.6 体例加一条登记（现状＝恢复面对瘦身长结果无标记可判；消解路径＝瘦身面保留尾状态行／判据面另取标记；到期条件），或扩 W16-6 一条「已瘦身长结果」用例把该形态暴露成红 |
| 5 | 文件规模闸（criterion 8） | 🟡 | `thincoder-vscode/webview/controls.css` 实计 **648 行**（> 500 硬限）且本批 +5（`:66`），但 §2.2「跨限面」注只列 `panel-chat.mjs`（`:80`）——未给拆分计划、未引既有裁定（同板块先例＝`VSC-DEBT.md` §3.3 D-3 要求越限档拆至 ≤500） | §2.2 跨限面句补 controls.css（648 → +5）并给拆分计划或引裁定；若判定 CSS 不入该闸，写明依据以免闸面口径分叉 |
| 6 | 清晰度 | 🔵 | `WEBVIEW.md:96` 写「判据 = 忙态（`S._turnState !== "idle"`——与 Send／Stop 同源）」；实读 Send/Stop 派生 = `=== "running"`（`webview/loading.js:56-57`），与本门谓词（含 `susp`）不同谓词 ⇒「同源」易被读成同判据（D-W16 正否决仅 running） | 改写为「同经 `S._turnState` 派生的独立谓词」并点明差值（Send/Stop＝running；本门＝非 idle） |
| 7 | 验收可执行性 | 🔵 | W15-5 判定写「入参级（…经 provider 请求载荷或等价入参捕获）」（`:140`），但捕获缝未指定：`panel-session.mjs:18` 直 import `./generate-title.mjs`，端侧 test 树零 `mock.module` 先例（实查）；`_generateTitle` 实例覆盖（`test/chat-panel.test.mjs:162`）只桩掉整函数、捕不到入参 | 指定捕获手法与夹具前提（既有先例＝本地 HTTP 服务器捕请求载荷，`test/trace-store.test.mjs:325`），或把该例改为产物面断言并同步 §2.7 判据句 |
| 8 | 文档卫生 · 方法论 | 🔵 | `WEBVIEW.md:31` 引「§5.6」（两层状态独立），本档 §5 只到 §5.5（内容实住 `:198-206`）⇒ 悬空节引；与同批 ③ 已收正的 `§9` 悬空同类（批档 `:151-154`），未一并扫 | 把 `§5.6` 收正为 `§5.5`（或补出该节），与 §9 的同一 sweep 一并落 |
| 9 | 文档一致性（协议表） | 🔵 | 协议档 §12 `permissionWithdrawn` 行②列只记发射点 `permission-gate.mjs:34`（`WEBVIEW-PROTOCOL.md:347`）；① 的孤儿回写（批档 `:49`：空队响应 ⇒ host 发 `permissionWithdrawn`）将在 `panel-messages.mjs` 增第二发射点，而同表口径要求多发射点以「（共 N 处）」全列 | 实现轮把第二发射点补进该行②列（或⑤备注记同点），保持发射点全列口径 |
| 10 | 端差显式（N-W6） | 🔵 | F-W15 取端侧显示边界剥离（`WEBVIEW.md:112-113`）⇒ 同一人读线的 CLI 面渲染仍显 `[File: …]` 展开文（「人读线＝CLI 共文件」为需求档 F-W15 行已载前提）；设计落点判据只论证核窗口面零 CLI 消费（实查成立：CLI 侧零 `history-window` 消费），未把该端面差列入登记 | 按 N-W6「端差逐条登记」体例补一条（CLI 面现状＋是否另轮处置），机制零改 |
| 11 | 文档归属（判据降级项） | 🔵 | 本评审无文档地图（review context 明示）⇒ 归属判据降级，仅按三档自述切面（`WEBVIEW.md:4` · `:277-279`）比对：F-W13／F-W14／F-W16 落点（§4.1–§4.3＋协议 §3／§3.2／§4.4／§4.6）与三分吻合；F-W15 新节落 `WEBVIEW.md` §4.4，与 `WEBVIEW-INPUT.md`「消息渲染契约」面相邻（该档不在评审范围，未能实读比对是否已有同位描述） | 确认并记 F-W15 显示边界面的归属依据；若 INPUT 档已有同位描述，收一处留指针（D2） |

**计数**：🔴 0 · 🟡 5 · 🔵 6（发现 11 条）

VERDICT: pass

## §4 用户批准

**2026-09-18 18:13 用户直接批准** —— 逐字「**修，都修**」（四条 🟠 全修）；父侧推荐口径 A（F-W15）用户未异议 ⇒ 按此走。

## §5 实施与修正记录

（eng-coder 写）

### 5.1 交付摘要（eng-coder · 2026-09-18 实现轮）

四条机制逐条落地（**零设计偏离**——裁定 / 判据 / 边界均逐字取自 §2.1 与设计档 `WEBVIEW.md` §4.1–§4.4）：

| # | 条目 | 落地读点（实现后） |
|---|---|---|
| ① | **F-W13 批权限卡必可释放**（甲：并族 + 单释放通道） | `permission-gate.mjs:95-101`（合并卡共用 `_permissionSeq` ⇒ 携 `promptId`）· `:30-39`（`releasePermission(panel, entry, verdict, queue)`：出队 + resolve + `permissionWithdrawn` + `_refreshStatus?.()`）· `:104`（Stop / Ctrl+I ⇒ 同通道 deny 释放）· `panel-messages.mjs:312-327`（响应 id 精确匹配，非 `shift`；孤儿 ⇒ `:320` 回写 `permissionWithdrawn{promptId}`，不改队列 ⇒ 零刷新）· `chat-panel.mjs:206`（`waiting` = 权限 / 批权限 / question 三队列）· `permission.js:91`+`:105`（合并卡 `data-prompt-id` + 三发点 `reply` 携 id）· `chat.js:253-262`（**仅注释订正**——消费者选择器本已覆盖） |
| ② | **F-W14 忙态门 A**（判据 = `!== "idle"`） | `loading.js:40-42`（`modelSwitchBlocked()`）· `:49-59`（`applyModelSwitchGate`：`disabled` + `aria-disabled` + 关两浮层）· `:70`（于 `applyBusyLock` 同点派生）· `model-picker.js:14`/`:32`（两按钮点击守卫）· `:122-125`（`models` 回写门：显示仍刷、零 post）· `controls.css:222-231`（`.ctrl-btn:disabled` 可见态） |
| ③ | **F-W15 显示边界剥离 + 标题面** | `file-refs.mjs:58-80`（`stripAtRefs`——与产者同档；fail-closed：摘要块 / 字符数 / 头部任一条不吻合即**整条原样返回**）· `panel-session.mjs:206`（`sendHistoryPage` user 分支：`stripAtRefs(stripEditorInjection(...))`——同点同序）· `:269`（`generateTitle` 入参同源剥离——零第二实现） |
| ④ | **F-W16 判据扩 + 摘要含退出状态** | `lib.js:71-81`（`toolFailureStatus`）+ `:91-96`（`isToolFailure`——判据单源）· `ui.js:272-287`（摘要：失败面拼退出状态、无输出 ⇒ 只余状态行）· `:295`/`:298-331`（判据换源 + 红 + 保持展开）· `tool-card-restore.mjs:29`（恢复卡同判据） |

**交付物**：四机制代码面 13 档 + 四个新测试档（`test/webview-permission-batch-release` · `webview-model-busy-gate` · `at-refs-restore` · `webview-tool-failure-signal`）+ `test/files.mjs` 登记 + 协议档 `WEBVIEW-PROTOCOL.md` §12/§13 表体同步。

**决策透明表（实现层取值，均零新语义）**

| # | 决策 | 依据 / 备选 |
|---|---|---|
| 1 | 判据语法**单源二次导出**：`lib.js` 除 `isToolFailure` 外增 `toolFailureStatus(text)`（返回状态标记文本或 `""`） | 摘要需**拼接**退出状态文本 ⇒ 若在 `ui.js` 复写状态行正则即「零散点」反例（设计 §4.3「同一判据派生，零散点」）；备选 = ui.js 自持正则（否决） |
| 2 | 摘要失败面豁免 `(empty)` 占位与状态行本体（`content = last !== "(empty)" && last !== status ? last : ""`） | 设计 §4.3 逐字「无输出时 `→ (exit code 1)`——不再读作 `(empty)`」；第二条件由内部评审（第 1 轮 🟡#2）补——`execute` 无输出 + 非零退出的结果恰为裸状态行（`execute.mjs:154`），否则拼成 `(exit code 1) (exit code 1)` |
| 3 | `permission.js` 三发点改**局部箭头 `reply`** 形态（与既有 `permissionResponse` 同形） | §13 提取器**形态④已登记**（`reply` 返回字面量）——判别式集零变；备选 = 三处内联字面量（可行但同语义两形态，否决） |
| 4 | 三处注释压缩（`chat-panel.mjs` / `panel-messages.mjs` / `ui.js`）以守住 §2.2 近限档 | §2.2「新增行一律入近限档（`panel-messages.mjs` → ≤489 · `ui.js` → ≤476）」+「`chat-panel.mjs` 425 → 426（余量 ≥74）」为设计自设闸；语义零损（读数见 §5.4） |
| 5 | 四档实装 **24 块**（表 22 例 + `W14-1′` 谓词真值表 + `W14-2′` 进忙态关浮层） | 两例为 W14-1/W14-2 的同机制加强面（设计 §4.2 判据句逐条派生）；§2.3/§2.4 计数「22 例」= 设计表基线，实装为其超集 |

### 5.2 先红读数（实现前逐例实测 · 命令 = `node --test test/<档>`）

| 例 | 先红读数（实测） | 与 §2.3 预测 |
|---|---|---|
| W13-1 | 批卡 `promptId === undefined`（非 number）⇒ 断言「批卡携 promptId」失败 | ✅ 一致（零 post ⇒ 无 id） |
| W13-2 | 合并卡 `dataset.promptId === undefined`；`permissionWithdrawn` 后卡仍在 DOM | ✅ 一致 |
| W13-3 | 载荷 = `{type, choice}`（三按钮均无 `promptId`） | ✅ 一致 |
| W13-4 | 零 post（孤儿响应静默 —— `shift()` 空队 no-op） | ✅ 一致 |
| W13-5 | 两卡 id 均 `undefined`（无 id 可匹配；`shift()` 命中队头） | ✅ 一致 |
| W13-6 | **绿**（回归锚：无 `promptId` 回退队头） | ✅ 一致（绿） |
| W13-7 | 批门停驻期 `_refreshStatus()` 读得 `["idle"]`（判据漏批队 ⇒ 读作 idle，期望 `waiting`） | ✅ 一致 |
| W14-1 | `ctx.modelBtn.disabled === false`（零禁用派生） | ✅ 一致 |
| W14-1′ | `TypeError: modelSwitchBlocked is not a function` | ✅ 一致（符号不存在） |
| W14-2 | 忙态点击模型钮 ⇒ `.mm-overlay` 照开；推理浮层 `style.display === "block"` | ✅ 一致 |
| W14-2′ | 进忙态后模型菜单仍在（overlay 非 null） | ✅ 一致 |
| W14-3 | 忙态 `models` 推送 ⇒ 两 post 照发（`[{selectModel},{selectReasoning}]`） | ✅ 一致 |
| W14-4 | **绿**（回归锚：idle 开菜单 + 回写照发） | ✅ 一致（绿） |
| W15-1 | 恢复面 = 展开文 + 尾部摘要块（`[File: a.txt]…[Referenced files:…]`） | ✅ 一致 |
| W15-2 | 同上（多引用逐条未还原） | ✅ 一致 |
| W15-3 | **绿**（fail-closed 锁定：手打 `[File: x]` / 形近摘要块原样返回） | ✅ 一致（绿） |
| W15-4 | **绿**（回归锚：`injectAtRefs` 返回值逐字） | ✅ 一致（绿） |
| W15-5 | 捕获载荷含哨兵 `SENTINEL-AT-REFS-9f3a`（标题源未剥离） | ✅ 一致 |
| W16-1 | 状态词 `done (1ms)` ⇒ 绿 + 自动折叠 + 摘要 `(empty)` | ✅ 一致 |
| W16-2 | 状态词 `done (0ms)` ⇒ 绿 + 摘要 `boom`（无退出状态） | ✅ 一致 |
| W16-3 | 状态词 `done (0ms)`（`killed: timeout` / `killed: user interrupted` 两值同） | ✅ 一致 |
| W16-4 | **绿**（回归锚：退出 0 ⇒ 绿 + 折叠 + 摘要 `ok`） | ✅ 一致（绿） |
| W16-5 | **绿**（反例锁定：正文提及 `(exit code 1)` 不误报） | ✅ 一致（绿） |
| W16-6 | 恢复卡状态词 `done`（旧谓词 `/^Error[:：]/`） | ✅ 一致 |

**先红集合逐条落入 §2.3 标注的「现态必红」名单（W13-1…5 · W14-1…3 · W15-1/2 · W15-5 · W16-1/2/3/6）✓，回归锚（W13-6 · W14-4 · W15-3/4 · W16-4/5）实现前后均绿 ✓。**

### 5.3 后绿读数（实现后实测 · 命令 + 读数）

| 命令 | 读数 |
|---|---|
| `cd thincoder-vscode && node --test test/webview-permission-batch-release.test.mjs test/webview-model-busy-gate.test.mjs test/at-refs-restore.test.mjs test/webview-tool-failure-signal.test.mjs` | **24 / 24 pass · 0 fail**（22 例 + `W14-1′`/`W14-2′`；W16-1 内含裸状态行断言） |
| `cd thincoder-vscode && npm test` | **tests 643 · pass 643 · fail 0**（快层 + 集成层全量；含 `test/files.mjs` 四档登记） |
| `node test/protocol-coverage.test.mjs --emit` | `permissionWithdrawn` = `panel-messages.mjs:320` + `permission-gate.mjs:36`（**共 2 处**）· `batchPermissionRequest` = `permission-gate.mjs:101` / `chat.js:264` · `permissionRequest` = `permission-gate.mjs:61` · `historyPage` = `panel-session.mjs:215` |
| `node test/protocol-coverage-reverse.test.mjs --emit` | `batchPermissionResponse` = `permission.js:108/:112/:116`（局部箭头形态）· `selectModel` = `model-picker.js:123/:79` · `selectReasoning` = `model-picker.js:124/:63` |
| `node scripts/doc-check.mjs`（仓根） | **5 悬空 / 8 超宽**（＝实现轮复跑读数；设计轮 = 6 / 9，差值 2 条为他档在飞改动面收正所致）；**本批两档（`design/WEBVIEW.md` · `WEBVIEW-PROTOCOL.md`）零悬空 · 零超宽** ✓ |
| 机制边界抽查（读证） | `(stopped)` 不入判据集（`lib.js:75` 正则集）✓ · 合并卡无「已拒绝态」变体（`chat.js:257-262` 仅移除）✓ · `injectAtRefs` 本体与落线/机读线零触碰（`sendHistoryPage` 只改下发副本）✓ |

### 5.4 实测行数 Δ（终值 · 口径 = `split("\n").length`，与 §2.2 表值同口径〔核：`WEBVIEW.md` 该口径 = 325 = 表值〕）

| 文件 | §2.2 表值 | 实测终值 | Δ | 备注 |
|---|---|---|---|---|
| `src/extension/permission-gate.mjs` | 104 | **110** | +6 | 估 +8 |
| `src/extension/panel-messages.mjs` | 481 | **488** | +7 | 估 +7 ✓；近限档 ≤489 ✓ |
| `src/extension/panel-session.mjs` | 353 | **356** | +3 | 估 ±1 |
| `src/extension/chat-panel.mjs` | 425 | **426** | +1 | = §2.2 预测 426 ✓（距硬限 74 ✓） |
| `src/extension/file-refs.mjs` | 46 | **81** | +35 | 估 +30 |
| `webview/permission.js` | 118 | **123** | +5 | 估 +5 ✓ |
| `webview/chat.js` | 411 | **412** | +1 | 注释面（估 ±2 ✓） |
| `webview/loading.js` | 64 | **93** | +29 | 估 +10（判据 + 派生门 + 注释） |
| `webview/model-picker.js` | 136 | **144** | +8 | 估 +10 ✓ |
| `webview/controls.css` | 648 | **659** | +11 | 估 +5（CSS = 渲染资产，不入模块闸——§2.2 依据） |
| `webview/lib.js` | 64 | **97** | +33 | 估 +12（两判据函数 + 注释） |
| `webview/ui.js` | 470 | **474** | +4 | 估 +6 ✓；近限档 ≤476 ✓ |
| `webview/tool-card-restore.mjs` | 77 | **78** | +1 | 判据换源（估 +3 ✓） |
| `test/files.mjs` | 89 | **94** | +5 | 四档入册（估 +4 ✓） |
| 四新测试档 | 0 | **167 · 178 · 149 · 141** | — | 估 ~150/~110/~140/~110 |
| `docs/vsc/design/WEBVIEW.md` | 325 | **325** | 0 | 本批零触碰 ✓ |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 480 | **490** | +10 | §12/§13 表体 + 两表头注 + 变更记录（§2.2 该行标「实计终值 480」⇒ 读数漂移，父侧可随本表收正） |

### 5.5 协议档表体同步（承 §2 ③ · 评审发现 9）

- **§12 `permissionWithdrawn` 行②列**：单点 `permission-gate.mjs:34` → **两点**「`src/extension/panel-messages.mjs:320/src/extension/permission-gate.mjs:36`（共 2 处）」+ ⑤ 列点明第二发射点来源（孤儿回写）——同表「多发射点全列」口径 ✓。
- **§12 其余重出行**：`batchPermissionRequest`（②`:101` / ③`:264`）· `permissionRequest`（②`:61`）· `historyPage`（②`:215`）；**§13 重出行**：`batchPermissionResponse`（②`permission.js:105` + `:108/:112/:116` 三发点 · 形态③/④）· `selectModel` / `selectReasoning`（②随忙态门）。
- **两表头注**各补本批实现轮口径行（重出集 + 「未同步重出的行仍按 as-of 口径读（D4）」）；**变更记录**补实现轮一条。**消息名 / 载荷字段 / 首列判别式集零变**（机检双向对账集不动）。

### 5.6 内部审计与代码评审（轮次 + 终态）

| 轮 | 形式 | 发现 | 处置 |
|---|---|---|---|
| 自审（实现轮内） | 逐档回读 + 边界抽查 | — | — |
| **偏差审计轮 1** | `explore` 子代理（只读 · 设计偏离审计） | 🟡 **§5 记录缺位**（§2.4 #1「读数逐条记入 §5」未落）· 🔵 协议档 `permissionWithdrawn` ②列坐标 `:322` 与源不符（注释压缩后 = `:320`） | 前者 = **本节（§5.1–§5.5 即回填）**；后者 = 就地收正为 `:320`（重跑提取器确认）；审计认定「四条机制 / 禁用范围 / fail-closed 咬合」全部核过（零 🔴、零越界、零静默降级） |
| **代码评审轮 1** | `advisor`（type=code · 全量代码面） | **VERDICT: pass**（🔴 0 · 🟡 2 · 🔵 4）· 🟡#2 = `resultSummary` 裸状态行形态重复状态（`execute` 无输出 + 非零退出可达） | **fix 轮 1**：`ui.js:285` 补状态行本体豁免 + `W16-1` 增裸状态行断言锁形（`npm test` 复跑 643/643 ✓）；🟡#1 = §5（本次回填）；🔵#3/#4（协议档 as-of 坐标与 §2.2 读数漂移）→ 交父侧裁定；🔵#5（>300 行预存在档）按 R3 零动作；🔵#6（`bash.mjs:189` spawn 失败形态仍读成功——同族未登记残）→ 交父侧登记 |
| 终态 | —— | —— | **`clean`**（偏差审计 🟡 已就地闭合；代码评审 pass + fix 轮 1 已复跑全绿） |

### 5.7 越界项与披露

- **越界项：无**（改动全在本批 §2.2 受影响文件表内；需求档 / 核 `thincoder-core/**` / `panel-chat.mjs` / `turn-model.mjs` / 槽原语 / `injectAtRefs` 本体 / 人读线存储本体 / 他批档 / `_archive/**` 全零触碰）。
- **主动披露**：① 四档实装 24 块（表 22 例 + 2 例加强面，见 §5.1 决策 5）；② 五处注释面压缩（§5.1 决策 4——为守 §2.2 近限档，语义零损）；③ 协议档 §12/§13 表体与两表头注、变更记录（本批 ③ 授权面）；④ `docs/vsc/design/WEBVIEW.md` **零改**（其 §4.2 引 `loading.js:56-57`、§4.4 引 `panel-session.mjs:262`/`:266` 等坐标为设计轮时点值，本批未动——如需重出由设计档作者裁）。

## §6 验证与收口

**收口（2026-09-18 19:2x · 父侧直接执行）**

- **交付判据**：评审 pass（id=104 · 0🔴 / 5🟡 / 6🔵）→ 修正（id=105 · 9 项）→ 实现（id=106 · clean：内部分歧审计 1 轮 + 代码评审 pass + fix 轮 1）→ 交付面之外收正（id=107 · 5 项）⇒ **四条 🟠 全闭**。
- **验收读数**：四新档 **24/24 pass**（父侧独立复跑同值）· vsc `npm test` **643/643** · `protocol-coverage{,-reverse}` **7/7** · `doc-check` 本批两档零新增。
- **先红后绿**：恒红名单逐条落红（W13-1…5 · W14-1…3 · W15-1/2 · W15-5 · W16-1/2/3/6）；回归锚前后均绿（W13-6 · W14-4 · W15-3/4 · W16-4/5）。
- **父侧两裁（承 #107）**：① §12「共 N 处」按提取器 `--emit` 权威 = **3 直发点**（`:415` = 触发位，已标注化）② §2.2 `WEBVIEW.md` 行取 **326**（实测终值；trail 面不删）。
- **残项登记（§2.6 #11 / #12）**：`bash.mjs:189` spawn 失败形态（同族读绿）· 第三卡面（`buildToolHistory` 未入判据）——各带现状 / 消解路径 / 到期条件。
- **观察项（别轮）**：§12 全表坐标 sweep（以 `--emit` 为唯一权威，一次做完）· `WEBVIEW.md:323` 历史条目按体例不改（由变更记录回指时点值）。
- **状态行**：✅ 已收口 2026-09-18（全档冻结——不再回改）。
- **台账**：#90 ⇒ 已核销。
