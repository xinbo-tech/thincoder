# 2026-10-10 · vsc-consistency
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 03:49「不认自设条件——等条件的一起拿出来清理」+ 清账二遍 = VSC 面 4 条（#1047 ∥ #1048 ∥ #1051 ∥ #1101）。
> 台账 = #1047（vsc · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 清账二遍）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10 03:49 清账二遍令——本批 = VSC 面 4 条；授权 = 会话全自动沿用。

**条目（4）**：
- `#1047`：VSC 自持 `src/agent-tools/async-discard.mjs` 未随 #9 bg 核心收编——一致性评估（收编 ∥ 判有意分持）。
- `#1048`：探针/运行径字段面不等——① `probeTargetOf` 不携 `providers[].headers`；② `setup-wizard.mjs:78` upsert 保留 `proxy: true`（运行走代理·探针直连）——对齐或裁定。
- `#1051`：VSC provider 弹窗代际跨框残余窗——协议携请求 id（`models` 消息）。
- `#1101`：VSC 锚与工作区 folders 解耦（多根工作区；用户 16:22–16:31 定向在册——「没选过不猜 ∥ 选了记住」；单根/无工作区零变化）+ ㈡ 语料范围可见化（core 全端一行）。

**边界**：`thincoder-vscode/**` + 核 provider-flow 探针面（#1048①）+ `WEBVIEW-PROTOCOL` 协议面；单根工作区 ∥ CLI ∥ 桌面逐字零回归。

**授权口径**：会话全自动（03:07「全自动」+ 03:49 清账二遍令）——设计 → 评审（用户点火）→ 批准 → 实施。

**父侧办结（2026-10-10）**：① 需求档两处归父侧笔（`docs/core/requirements/AGENT-LOOP.md:184` 对侧引用句 ∥ `docs/vsc/requirements/PROJECT.md:27` Multi-root 行 + 状态栏真值复核）——落讫入 §6；② 设计档随正清单（§6.20 引用面 11 处 + D-AD7 收口 + API-CONTRACT 重生成）= 实施轮随落 ✓；③ #1101 走查面（未选定标记视觉形 ∥ 首开弹拍体感）= §4/走查看果 ✓；④ ㈡ 移出 ✓（§1 已加随正行）。

**父裁（2026-10-10 · 评审 #75 changes-required 回执）**：🔴1 ∥ 🟡3 ∥ 🔵3 逐条——F1（1047-5「核件」不在盘：`thincoder-core/test/async-discard.test.mjs` 已随 2026-09-28 测试树全清）⇒ 修轮改造：主判 = 结构面（grep 0 命中 + check-syntax + doc-check 增量）+ 注明核用例面已全清；如需运行腿限既有批内件（`docs/batches/2026-09-29-tools-carryover.test.mjs:34` ∥ `docs/batches/2026-10-07-browser-async-fix.b.test.mjs:335`）且先跑为凭 ∥ F2（需求档 `docs/core/requirements/AGENT-LOOP.md:184` 悬空锚耦合 doc-check 增量闸）⇒ **父侧已接并已落**：该行改为「运行期面 = 核单源 `thincoder-core/agent-tools/async-discard.mjs`——VSC 自持副本已退场，2026-10-10 收编批」（父侧笔 · 可 revert）；`:184` 不复引删除档 ⇒ 闸可判 ∥ F3（恢复点标「构造末」引 `chat-panel.mjs:47-49` 矛盾）∥ F4（`PROJECT-SWITCHER.md` §3 号位冲突）⇒ 修轮收正 ∥ 🔵 F5..F7 修轮随正或维持。**修复轮 = eng-designer #86**；报告回后复评（round 2）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（定点修正轮落讫（#86 · 承 §3 轮次 1——7 号全处置）；条目 = #1047/#1048/#1051/#1101㈠（㈡ 已裁移出））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（eng-designer · 2026-10-10）**——本批条目 4 条：#1047 / #1048 / #1051 / #1101㈠；**㈡（语料范围可见化）经父裁移出本批**（无需求基础 ∥ 落点超批内代码面；零回归句无涉——见上抛①）。本设计轮零文件写入（批令：只写 §2）——**设计交付 = 本段**（评审对象）；各设计档随正 = 实施轮随落（清单见「受影响文件与设计档随正」）。

**关键裁定**

**KD-1（#1047）＝ 收编（退场式——对象已无消费者）。** 三条实读：
① 运行期面已归核单源：VSC `src/extension/suspension.mjs:52-54`（`loadSuspensionCore`——动态 import 核 `agent/suspension.mjs`）⇒ 中止收尾走核 `agent/suspension.mjs:131-137`（aborted 分支四调用）∥ 核主循环 `agent/run-stages.mjs:21`（import 四函数）+ `:213-218`（回合尾接线）；VSC 侧无 `run-stages.mjs`（主循环归核）。
② VSC 副本零消费者：全 VSC 树 `async-discard` / `discardAbortedPool` / `discardAbortedAdvisors` import 命中 = 0（唯一命中 = 档自身）；VSC 测试树全清重置（`thincoder-vscode/test/files.mjs:8` 空清单）⇒ 无测试引用。
③ 副本内容 = 核 2026-09-15 落地前的对侧基准（126 行；缺 bg/browser 两族 spec ∥ 缺 `pruneQueue` ∥ advisor `wasStatus` 无 queued 面）——零消费者下无运行影响。
裁定：**收编 = 删档退场 + 文档随正**。否决「有意分持」：分持须有活消费者或端特语义，两项皆无；D-AD7（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:342`）登记的收敛方向已由主循环归核自然达成——残余 = 死档本体 + 文档指针。
动作：删 `thincoder-vscode/src/agent-tools/async-discard.mjs`；`thincoder-vscode/AGENTS.md:45`（模块图行）退场；核设计档引用扫描面随正（清单下）；`API-CONTRACT.md:2962-2963` 生成区重生成（两行随消）；需求档 `docs/core/requirements/AGENT-LOOP.md:184` 对侧引用 = 主 agent 笔（上抛②）。

**KD-2（#1048）＝ 已落地（零代码动作——本批 = 复跑 + 核销面）。** 实读：
① 核 `thincoder-core/provider-flows.mjs:79-91`——`probeTargetOf` 携 `headers`（`:89`，仅 plain-object；注释点名 #1048①，`:76-77`）；
② CLI `thincoder-cli/src/cli/setup-wizard.mjs:74-79`——探针条目 = `{...existing}` 合并条目（既有渠盘上 `proxy`/`headers` 随行；`:74-75` 注「探针 ≡ 写后运行态」——#1048②；`:78` 条目本体）；
③ 批内件两腿在盘：`docs/batches/2026-10-08-proxy-per-channel.test.mjs`——T3 `:119`（headers 门）/ T5 `:244`（向导实跑）。
本批动作 = 复跑 T3/T5（读数入 §5）+ 台账核销（主 agent 面）。

**KD-3（#1051）＝ 协议携请求 id（上行 + 回显 + 判据三改）。**
现状缺陷（原文在册：`docs/batches/2026-10-07-provider-config-parity.md:471`——「跨框同代际残余窗口需协议携请求 id 才能完全隔离」）：现判据 `_fetchEpoch !== _addDialogEpoch`（弃向 = `settings-provider-dialog.js:251`；记代际点 = `:216`）只证「本实例有在飞」，不证结果归属——旧框在飞果在新框（新框亦有在飞 ⇒ 代际相等）到达即落框（窄窗）。
改法：① 上行——`paFetchModels` 载荷 + `id`（模块级单调 `++_fetchSeq`；发时记 `_pendingFetchId`）（`:216-219`）；② 宿主——`handleTestProvider` 结果原样回显 `id`（`panel-messages-settings.mjs:149-153`）；③ 落框——`updateTestProviderResult` 判据改「`!_els` ∥ `r.id === undefined` ∥ `r.id !== _pendingFetchId` ⇒ 弃」；命中 ⇒ 渲染 + `_pendingFetchId = null`（防重放）（`:250-260`）；④ 开/关框清 `_pendingFetchId = null`（`:179-191` ∥ `:195-200`）；⑤ 代际变量 `_addDialogEpoch`/`_fetchEpoch` 退场（`_pendingFetchId` + 开关清覆盖同判——单变量收窄；`:19-20` 声明区随删）。
协议档随正：`WEBVIEW-PROTOCOL.md` §13 `testProvider` 行（`:535` 载荷 + `id`）∥ §12 `testProviderResult` 行（`:455` 备注 + `id` 回显）∥ §3.2 增行 + 计数同拍（D3——现计数实施轮实读）∥ 变更记录。
设计档随正：`SETTINGS.md:486`（§2.16 ①）「框实例代际……（在飞探果跨框零污染）」句 ⇒ 请求 id 归属句。
复核项：`thincoder-vscode/test/smoke-settings.mjs:81-82` 直调无 id 形 ⇒ 新判据下早退（冒烟无语义断言 ⇒ 零红——实施轮实跑复核）。

**KD-4（#1101㈠）＝ 最小完整式（前置实读见下「现状读数」）。**
**(b) 选了记住**：记录 = `context.workspaceState` 键 `thincoder.projectFolder`（fsPath 串）；读/写助手沿 `loadModelPrefs`/`saveModelPrefs` 先例（`session-io.mjs:239-248`——try/catch 包裹）。写点 = 一切成功切换后：`applyProjectSwitch`（`panel-project.mjs:41-64`——picker 径 + `setProject`-fsPath 径两路同点）∥ 跟随自动切换（`chat-panel.mjs:96-116`）。恢复点 = `ChatPanel` 构造内 · 订阅块之前（`chat-panel.mjs:90-96` 之间——`:96` 首个 `context.subscriptions.push` 之前；先于一切 `_cwd()` 消费）；恢复条件 = 多根 ∧ 无活 override ∧ 记录 ∈ folders（失效记录忽略不抛）；恢复动作 = `setProjectFolder(记录)`（单点，`panel-messages.mjs:82-89`）。单根/无工作区 = 不读不写。
语义裁定：记录 = 「最后一次成功切换的锚（最近所在）」——对齐桌面「重启自动重开上次」；否决「仅显式选择才记」（跟随锚亦为用户工作现场；两套记录 = 第二真相源）；否决「不记」（用户 16:26 明向「选了记住」）。**边界明写：记录 = 最后一次成功切换的锚——非活锚**（工作区兜底回落径（`chat-panel.mjs:148-156`）改活锚而不写记录——两义分立）。
**(a) 没选过不猜**：判定 = `_cwdOverride === null` ∧ 多根——新增导出 `hasProjectOverride()`（`panel-messages.mjs:43-44` 邻位）；`projectInfo`（`panel-project.mjs:18-24`）载荷 + `chosen`（布尔）。
显著化：`session-bar.js:151-165`——`m.multi && !m.chosen` ⇒ 按钮文本 `📁 {name} · {t("project.notChosen")}`（title 同携）；新 i18n 键 `project.notChosen`（`locales/en.json`+`zh.json`——`project.*` 族 `:274-277` 邻位；终词形实施轮定稿）。
「选一次」弹拍：面板首开拍（`resolveWebviewView`——`chat-panel.mjs:169`）单次弹；门四 = 多根 ∧ `!hasProjectOverride()` ∧ 未弹过 ∧ `!turnBusy()`；弹 = 复用 `pickProject(panel)`（`panel-project.mjs:86-118`——零新选择器）；「未弹过」= `thincoder.projectPickOffered`（workspaceState bool——弹即写，结果无关；ESC 后不再主动弹）。频度 = 每工作区恰一次（16:26「多根首启让用户选一次」逐字）；否决每窗重弹（打扰）∥ 纯标记不弹（弱于「让用户选一次」）。
记录不清裁定：记录不随文件夹变化自动清（恢复时成员校验兜底）；既有失效回落（`chat-panel.mjs:148-156` 第三支路）零触。

**#1101 现状实读读数（面板 UI 当前锚呈现——定形前置件；全项 = 设计轮本席现读）：**
① 按钮：`webview/index.html:26` `#project-btn`（默认隐藏）；`session-bar.js:151-165`——`m.multi` 才显示；文本 `📁 {name}`（name = folders 匹配 `m.current` 者 ∥ 路径末段兜底）；title = `m.current`（跟随开 ⇒ `+ " · " + t("project.followActiveOn")`）；单根/无工作区 = 隐藏。
② 点击 → `setProject`（无 fsPath——`session-bar.js:148`）→ 宿主 `panel-messages-session.mjs:109-110` → `pickProject`（QuickPick：folders 行 + 「跟随活动文件」开关行——`panel-project.mjs:95-108`）。
③ 锚值链 = `_cwdOverride ?? folders[0] ?? process.cwd()`（`panel-messages.mjs:44`）；「未选过」= `_cwdOverride === null`——**UI 面零区分标记**（未选过与已选过同形 = 静默问题之 UI 根因，实读在案）。
④ 成员校验 `setProjectFolder`（`panel-messages.mjs:82-89` 非成员硬拒）；运行/挂起拒（`panel-project.mjs:44-47` ∥ `panel-messages-session.mjs:106`）。
⑤ 不跨重启记忆（`_cwdOverride` 模块级内存；设计档 `docs/vsc/design/PROJECT-SWITCHER.md:30`「不跨窗口持久化」在册）。
⑥ 跟随默认 off（`chat-panel.mjs:99` 读 `thincoder.project.followActiveEditor`）。
结论 = 与批 §1 已知七点一致；新增两点 =（i）未选定态 UI 不可见（③）；（ii）`workspaceState` 先例已存（`session-io.mjs:239-248`）⇒ (b) 零新机制。

**逐条落地表（动作 ∥ 目标 file:line（现读）∥ 期望 ∥ 机检法）：**

| # | 动作 | 目标 file:line（现读） | 期望 | 机检法 |
|---|---|---|---|---|
| 1047-1 | 删档（`git rm`——tracked） | `thincoder-vscode/src/agent-tools/async-discard.mjs`（126 行 ⇒ 0） | 档退场；VSC 树零残留 | VSC 树 grep 三符号 ⇒ 0 命中（源面）+ `scripts/check-syntax.mjs` 全绿 |
| 1047-2 | 模块图行退场 | `thincoder-vscode/AGENTS.md:45` | 行删（135 ⇒ 134） | 实读 + check-syntax |
| 1047-3 | 设计档引用扫描面随正 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（:219/:248/:253/:277/:288/:289/:290/:292/:342/:377/:383）∥ `AGENT-LOOP-SUBAGENT.md:520` | 死坐标/对侧句处置（删 ∥ 改指核单源；判据保留）∥ D-AD7 收口注 | `node scripts/doc-check.mjs` 锚 0 悬空增量（需求档行 = 父侧同拍落——已接）+ 逐处实读 |
| 1047-4 | API-CONTRACT 生成区重生成 | `docs/core/design/API-CONTRACT.md:2962-2963` ∥ 生成器 `scripts/api-contract.mjs` | 两行随消；其余零差 | 重生成后 diff 逐行判 |
| 1047-5 | 回归主判 = 结构面 + 运行腿（核用例面已随 2026-09-28 测试树全清——`thincoder-core/test/` 现仅 `run.mjs`+`slow.mjs`） | VSC 源面 grep 三符号 ∥ `thincoder-vscode/scripts/check-syntax.mjs` ∥ `node scripts/doc-check.mjs`（锚 0 悬空增量）∥ 运行腿 = 批内件两件（`docs/batches/2026-09-29-tools-carryover.test.mjs` ∥ `docs/batches/2026-10-07-browser-async-fix.b.test.mjs`——核 `async-discard` bg/browser 两族各一） | 三符号 0 命中 ∥ check-syntax 全绿 ∥ 锚 0 悬空增量 ∥ 两腿全绿 | 前三直跑；两腿 `node --test` 直跑（本修轮实跑：16/16 ∥ 10/10 绿——复跑入 §5） |
| 1048-1 | 复跑两腿 | `docs/batches/2026-10-08-proxy-per-channel.test.mjs`（T3 `:119` / T5 `:244`） | 全绿（读数入 §5） | `node --test` 直跑 |
| 1048-2 | 落地实读复核 | `thincoder-core/provider-flows.mjs:89` ∥ `thincoder-cli/src/cli/setup-wizard.mjs:74-79` | `headers` 携行 + 合并条目在案 | 本段已读（设计轮读数）；T3/T5 为准 |
| 1051-1 | 上行 + `id` | `settings-provider-dialog.js:216-219`（+ `:19-20` 声明区） | 载荷携 `id`；`_pendingFetchId` 记；代际变量退场 | 批内件源锁 + postSink 腿（id 在场） |
| 1051-2 | 宿主回显 `id` | `panel-messages-settings.mjs:149-153` | 结果携 `id`（原样） | 批内件宿主腿（假 panel 收包） |
| 1051-3 | 落框判据改 id ∥ 开/关清 | `settings-provider-dialog.js:250-260` ∥ `:179-191` ∥ `:195-200` | 旧 id 弃 ∥ 当前 id 落 ∥ 重开弃旧 ∥ 双发先旧后新 ⇒ 旧弃新落 | 批内件四腿（mini 假 DOM 装填） |
| 1051-4 | 协议档行随正 | `WEBVIEW-PROTOCOL.md:535` ∥ `:455` ∥ §3.2 增行（+D3 计数）∥ 变更记录 | `id` 登记在位；计数与列表同改 | `node scripts/doc-check.mjs` EXIT 0 |
| 1051-5 | 设计档句随正 | `SETTINGS.md:486`（§2.16 ①） | 代际句 ⇒ 请求 id 归属句 | 实读 + doc-check |
| 1101-1 | 记录读写助手 | `session-io.mjs:239-248` 邻位 | 键 `thincoder.projectFolder` 读/写宽容 | 批内件宿主腿（假 Memento） |
| 1101-2 | 写点（一切成功切换） | `panel-project.mjs:41-64` ∥ `chat-panel.mjs:96-116` | 成功 ⇒ 记录 = 新 fsPath；拒径零写 | 批内件宿主腿（成功/拒两态）+ 源锁 |
| 1101-3 | 恢复点（构造内 · 订阅块之前） | `chat-panel.mjs:90-96` 之间（`:96` 首个 `context.subscriptions.push` 之前） | 多根 ∧ 无 override ∧ 记录∈folders ⇒ 恢复；余零写 | 批内件宿主腿（命中/失配/单根/无记录 四态） |
| 1101-4 | `chosen` 载荷 + 标记 | `panel-messages.mjs:43-44` 邻位 ∥ `panel-project.mjs:18-24` ∥ `session-bar.js:151-165` ∥ locales | 未选定 ⇒ 标记；已选/单根零变 | 批内件 webview 腿（两态文本）+ 源锁 |
| 1101-5 | 首开弹拍 | `chat-panel.mjs:169` ∥ `panel-project.mjs:86-118`（复用） | 门四全过 ⇒ 弹一次 + 写 `projectPickOffered`；余零动作 | 批内件宿主腿（四态）+ 源锁 |
| 1101-6 | 设计档随正 | `docs/vsc/design/PROJECT-SWITCHER.md`（`:30` 句 + §3 下新子节 = **§3.1 锚记忆与未选定面**） | `:30` 句随正为跨重启记忆（指向 §3.1）；最小完整式（含「记录 = 最后一次成功切换 · 非活锚」边界句）入 §3.1 | 实读 + doc-check |

**受影响文件与设计档随正（行数 = 现读；delta = 预估——实施轮实测回填）：**

产品码（VSC）：删 `src/agent-tools/async-discard.mjs`（126 ⇒ 0）· `AGENTS.md`（135 ⇒ ≈134）· `src/extension/panel-messages.mjs`（379 ⇒ ≈385：+`hasProjectOverride`）· `src/extension/panel-project.mjs`（118 ⇒ ≈128：projectInfo+`chosen` ∥ 写点 ∥ 新弹拍函数）· `src/extension/chat-panel.mjs`（443 ⇒ ≈455：构造末恢复 ∥ resolve 弹拍 ∥ 跟随写点）· `src/extension/session-io.mjs`（249 ⇒ ≈263：两助手）· `src/extension/panel-messages-settings.mjs`（244 ⇒ ≈246：id 回显）· `webview/settings-provider-dialog.js`（266 ⇒ ≈266：代际删 ∥ id 三处增）· `webview/session-bar.js`（165 ⇒ ≈170）· `webview/chat-messages.js`（271：零改——`m` 原样透传）· `locales/en.json`+`zh.json`（295/295 ⇒ 296/296：+`project.notChosen`）。

测试面：新增批内件 `docs/batches/2026-10-10-vsc-consistency.test.mjs`（#1051 四腿 + #1101 宿主 ∥ webview 腿；装缝 = `registerHooks` vscode 桩（`docs/batches/2026-10-08-provider-key-guards-vsc.test.mjs:75` 先例）+ mini 假 DOM（`docs/batches/2026-10-07-provider-config-parity-vsc-harness.mjs` 先例）；越 500 行拆 `-b` 档 ∥ 测试台抽公档先例在册）。复跑：#1048 = `docs/batches/2026-10-08-proxy-per-channel.test.mjs`（T3 `:119` / T5 `:244`）；#1047 = 结构面（grep ∥ check-syntax ∥ doc-check）+ 运行腿两件（`docs/batches/2026-09-29-tools-carryover.test.mjs` ∥ `docs/batches/2026-10-07-browser-async-fix.b.test.mjs`——核用例面已随 2026-09-28 测试树全清，无核内件可跑）。VSC `npm test` = 空清单绿（`test/files.mjs:8`）——集成面零涉。

文档面（随正——实施轮随落）：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.20 引用扫描面（`1047-3` 行所列——统一判：对象已删 ⇒ 括注/坐标删或改指核单源；判据保留、死指针零悬空；`:342` D-AD7 收口注）· `AGENT-LOOP-SUBAGENT.md:520` · `API-CONTRACT.md`（重生成）· `SETTINGS.md:486` · `WEBVIEW-PROTOCOL.md`（`:455`/`:535`/§3.2/变更记录）· `docs/vsc/design/PROJECT-SWITCHER.md`（`:30`/§3.1）· 各档变更记录行。

**验收对照（回指条目——每条机检）**：
- #1047 = 删档 + 结构面（VSC 源面 grep 三符号 0 命中 ∥ `thincoder-vscode/scripts/check-syntax.mjs` 全绿 ∥ `node scripts/doc-check.mjs` 锚 0 悬空增量（需求档行 = 父侧同拍落——已接））+ 运行腿两件全绿 + VSC `npm test` 绿。
- #1048 = T3/T5 复跑绿 + 两落地实读位在案（`provider-flows.mjs:89` ∥ `setup-wizard.mjs:74-79`）。
- #1051 = 批内件四腿绿 + 协议两行 + §3.2 计数同拍 + doc-check EXIT 0。
- #1101㈠ = 批内件腿（记录读写 ∥ 恢复四态 ∥ 弹拍四态 ∥ 标记两态）+ 零回归判据句（下）+ §4/走查面（真机看按钮标记与首开弹拍——用户面）。

**零回归判据句（仅辖 ㈠；㈡ 已裁出、无涉）**：
- **多根工作区面** = 新增三件（记录读写 ∥ 恢复 ∥ 弹拍+未选定标记）——其余逐字不改；
- **单根工作区 ∥ 无工作区 ∥ CLI ∥ 桌面** = 链路与输出逐字不变：单根仍隐藏按钮（`multi` 判据零改——`panel-project.mjs:23`）∥ `_cwd()` 回落链逐字（`panel-messages.mjs:44`）∥ 无工作区守卫零触 ∥ CLI/桌面零文件零行为变动（diff = 0）。

**零触确认（本设计轮）**：本设计轮零文件写入（唯 §2 经 `batch` 工具追加——两拍）；产品码/测试档/设计档/需求档/他批（#1100 等）零触；㈡ 零涉（父裁移出）。

**上抛项**：
1. **[已裁·移出] ㈡ 语料范围可见化**——移出本批：候需求基础/用户定向（不入本批设计面；零回归句无涉）。父裁 2026-10-10（本段落笔前——「裁 = B」）。
2. **[父侧笔·已接（#1047 行已落；落讫入 §6）] 需求档两处**：#1047——`docs/core/requirements/AGENT-LOOP.md:184` 对侧引用句（档面随正）；#1101——`docs/vsc/requirements/PROJECT.md:27` Multi-root 行（现状句随本批收正；并请复核「状态栏标明工作目录」句现状真值）。
3. **[知会] 设计档随正清单**（实施轮随落——见「文档面」；含 §6.20 引用扫描面统一判 + API-CONTRACT 重生成）。
4. **[知会] #1101 走查面**：未选定标记视觉精确形 ∥ 首开弹拍体感 = §4/走查看果；i18n 键终词形实施轮定稿。

**定点修正轮（承 §3 轮次 1 · 评审 #75 · changes-required——🔴1 ∥ 🟡3 ∥ 🔵3；父裁 = 逐号处置 7/7；修复轮 #86 · eng-designer · 2026-10-10）**

**轮性质** = fix（逐号点修——未重开探索 ∥ 未扩面 ∥ 零新语义）；**落笔方式** = §2 就地修正（本作者段内——修正点直接落 §2 对应行）+ 本块逐号留痕（形式先例 = `docs/batches/2026-10-01-record-shape-contract.md` §2 修正块）；§2 状态行经 `batch status` 同拍。**禁面零触**：§1 ∥ §3 ∥ 产品码 ∥ 需求档（父侧域）∥ 他批档；不 re-run 评审（发起权 = 父侧）。

- **号 1（🔴 · `1047-5` 核件不在盘）收正**：`1047-5` 行重写 = 回归主判（结构面 + 运行腿）——核用例面已随 2026-09-28 测试树全清（`thincoder-core/test/` 现仅 `run.mjs`+`slow.mjs`）；死档引用三处改毕（`1047-5` 行 ∥ 测试面复跑句 ∥ `#1047` 验收行——父裁点名两处 + 同族一处）。运行腿 = 既有批内件两件（`docs/batches/2026-09-29-tools-carryover.test.mjs` ∥ `docs/batches/2026-10-07-browser-async-fix.b.test.mjs`——核 `async-discard` bg/browser 两族各一）。**本修轮实跑读数（绿 ⇒ 挂闸）**：`docs/batches/2026-09-29-tools-carryover.test.mjs` ⇒ **16/16 pass**（63.7s）∥ `docs/batches/2026-10-07-browser-async-fix.b.test.mjs` ⇒ **10/10 pass**（2.2s）——两件全绿。
- **号 2（🟡 · doc-check 判据耦合需求档悬空锚）收正**：判据句改「锚 0 悬空增量（需求档行 = 父侧同拍落——已接）」——`1047-3` 机检法 ∥ `#1047` 验收行两处同步；上抛②状态随正（待主 agent 笔 ⇒ 父侧已接——`#1047` 行已落）；需求档 `:184` 实读 = 已改核单源句（父侧笔——本修轮零触、不依赖其到位）。
- **号 3（🟡 · `1101-3` 标签/坐标互斥）收正**：恢复点标签「构造末」+ 坐标 `:47-49`（构造头）⇒ 标签「构造内 · 订阅块之前」+ 坐标 `:90-96` 之间（`:96` 首个 `context.subscriptions.push` 之前）——KD-4 (b) ∥ `1101-3` 行两处同步。
- **号 4（🟡 · `1101-6` 落节号不可解）收正**：落点明写 = `docs/vsc/design/PROJECT-SWITCHER.md` §3 下新子节「**§3.1 锚记忆与未选定面**」（`:30` 句随正为跨重启记忆、指向 §3.1）；文档面随正清单同拍（`:30`/§3 ⇒ `:30`/§3.1）。
- **号 5（🔵 · 记录 vs 活锚边界）随正**：KD-4 语义裁定补边界句「记录 = 最后一次成功切换的锚——非活锚（兜底回落径改活锚而不写记录）」；`1101-6` 行明该边界句入 §3.1。
- **号 6（🔵 · 行数 delta 形）维持**：数位经评审抽读实核（三处 ±1 = 尾行记法差）；「现数 ⇒ ≈目标」已载「delta = 预估——实施轮实测回填」= 界承诺之实——`≤±N` 属形变、无信息增益（不虚设界值）。
- **号 7（🔵 · `:216`/`:251` 引述向）收正**：KD-3 现状句引文与判据向对齐（`_fetchEpoch !== _addDialogEpoch`——弃向 = `:251`；记代际点 = `:216`）。

**读回（D6）**：§2 修正面逐处复核——死档零实义引用（`async-discard.test` 余存仅记录面：§1 父裁块 ∥ §3 评审表 ∥ 本块留痕）∥ 号 3/4 文字在盘可核 ∥ `1047-5` 行 · 测试面句 · 验收行三处同步。**git 腿披露**：HEAD 无此档（未提交）⇒「原行可由 git 历史逐字复核」不可依——原行逐字面 = 本轮回话记录（落笔前全文读 + 逐处回读）。**本次写面** = 本档 §2（就地修正 + 本块）——产品码 ∥ 测试档 ∥ 设计档 ∥ 需求档 ∥ 他批零触；㈡ 零涉。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（对象 = §2；计数：🔴 1 · 🟡 3 · 🔵 3）**

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 可行性 / 验收 | 🔴 | `1047-5` 载「核件回归（既绿）`thincoder-core/test/async-discard.test.mjs`——复跑全绿」、`#1047` 验收载「核件绿」——该档**不在盘**：`thincoder-core/test/` 实读仅 `run.mjs` + `slow.mjs`；设计自身引用的两份设计档已登记其退场（`AGENT-LOOP-ASYNC-POOL.md:320`、`AGENT-LOOP-SUBAGENT.md:486` 均注「（已随 2026-09-28 测试树全清退场——档不在盘）」）。`node --test` 无档可跑 ⇒ 该腿不可绿、验收不可判。 | 换可跑腿：本批已有引用核档的批内件（`docs/batches/2026-09-29-tools-carryover.test.mjs:34`、`docs/batches/2026-10-07-browser-async-fix.b.test.mjs:335`——均 import 核 `agent-tools/async-discard.mjs`）；或把 #1047 验收收在结构面（源面 grep 0 命中 + check-syntax + doc-check 增量）并注明核用例面已随 2026-09-28 全清。 |
| 2 | 验收 / 协调 | 🟡 | `#1047` 门「`node scripts/doc-check.mjs` 锚 0 悬空增量」在 `docs/core/requirements/AGENT-LOOP.md:184` 仍携 `thincoder-vscode/src/agent-tools/async-discard.mjs` 的路径引用下不可达零——锚域 = `docs`、排除 = `_archive`/`batches`（PROJECT-MANIFEST.json:27-38），需求档路径引用在域内，删档即成悬空；该面 = 本段上抛②（未入批内随正清单）。协调项。 | 把该需求档行纳入本批文档随正清单（或标为迁移期引文式「列报 · 不入闸」），使锚增量与删档在同一遍可判。 |
| 3 | 清晰度 | 🟡 | `1101-3` 恢复点写「`ChatPanel` 构造末」但坐标 = `chat-panel.mjs:47-49`——该处是构造**头**（`constructor(context) {` ∥ `this._context = context` ∥ `this._panel = null`），构造体实际延至 `:158`；标签与坐标互斥。 | 令标签与坐标一致（写明「构造内 · 订阅块之前 ∥ 之后」并给对应坐标），使落点与「先于一切 `_cwd()` 消费」的理据同读。 |
| 4 | 清晰度 / 档归属 | 🟡 | `1101-6` 落点写「`PROJECT-SWITCHER.md`（`:30` 句 + §3 新节）」，但该档 §3 已存（`PROJECT-SWITCHER.md:34`「## 3. 切换流程（实现面）」），另有 §4/§5/§6——「§3 新节」不可解。 | 点明落节（新 §7 ∥ 既有 §3 / §6 下子节），使规范面只有一处落点。 |
| 5 | 注记 | 🔵 | 记录语义 =「最后一次成功切换的锚（最近所在）」，而第三切换落点（工作区兜底回落 `chat-panel.mjs:148-156`）改活锚而不写记录；「记录不清裁定」（恢复时成员校验兜底）已覆盖记忆面，但「记录」与「活锚」两义仍可辨（记录档被重新加入工作区 ⇒ 重启恢复到非最近锚）。既有裁定，不重开。 | 在设计正文与该节内写明裁定边界（记录 = 最后一次成功切换，非活锚）。 |
| 6 | 注记 | 🔵 | 受影响表用「现数 ⇒ ≈目标」而非「≤±N ∥ structure unchanged」形；抽读实核数位与盘一致（126 / 118 / 165 / 249 / 266 / 271 逐条相符；379 / 443 / 135 与读取器尾行记法差 1）；无档逼近 500 软线 ∥ 800 硬限，故无需拆分计划 —— 新批内件已携越 500 拆 `-b` 计划。 | 保留数位，把增量写成界（`≤±N`）更合判据形。 |
| 7 | 注记 | 🔵 | `KD-3` 现状句「现判据 `_fetchEpoch === _addDialogEpoch`（`settings-provider-dialog.js:216` ∥ `:251`）」：`:251` 现文为 `_fetchEpoch !== _addDialogEpoch`（弃向），`:216` 为赋值（记代际）非判据点；判据实质（只证本实例有在飞）无误。 | 引文与判据向对齐（`!==` ∥ 记代际点），免下游按 `===` 读旧判据。 |

**结论**：🔴 1（#1047 核件腿 = 不在盘档）⇒ 不改不可批。余 🟡/🔵 不阻断。抽读实核通过项：#1048 两腿在盘（`provider-flows.mjs:89` headers 携行 ∥ `setup-wizard.mjs:74-79` 合并条目 ∥ T3 `:119` / T5 `:244`）+ VSC 面探针目标已收编核 `probeTargetOf`（`settings.mjs:13/:234` ∥ `settings-panel-write.mjs:14/:55`）⇒「已落地」裁定成立；#1047 零消费者（VSC 源面三符号 0 命中）成立；#1051 机制闭合（唯一上行 `settings-provider-dialog.js:217`、唯一宿主回显 `panel-messages-settings.mjs:153`、webview 全量透传 `chat-messages.js:169-170`、代际变量仅 `:19/:20/:181/:199/:216/:251` 六处）；#1101 现状读数与机制落点逐条相符（`session-io.mjs:242-248` 先例 ∥ `panel-project.mjs:41-64`/`:23`/`:86-118` ∥ `chat-panel.mjs:99`/`:169` ∥ `session-bar.js:148`/`:151-165` ∥ `index.html:26`）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审 · round 2（对象 = §2；承 §3 轮次 1 的 7 号）——计数：前轮 7 号 = Fixed 6 ∥ Accepted 1 ∥ Unfixed 0；本轮新发现 = 🔴 0 ∥ 🟡 1 ∥ 🔵 1（均不阻断）**

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `thincoder/docs/batches/2026-10-10-vsc-consistency.md:80` | 🔴 | Fixed | 三处同步已核（`1047-5` :80 ∥ 测试面 :99 ∥ 验收 :104）——均不再引既删档；新腿 = 「运行腿 = 批内件两件（`docs/batches/2026-09-29-tools-carryover.test.mjs` ∥ `docs/batches/2026-10-07-browser-async-fix.b.test.mjs`——核 `async-discard` bg/browser 两族各一）」，对盘在盘且引核单源（`thincoder/docs/batches/2026-09-29-tools-carryover.test.mjs:34` = 「const { discardAbortedBgTasks } = await mod("thincoder-core/agent-tools/async-discard.mjs")」∥ `thincoder/docs/batches/2026-10-07-browser-async-fix.b.test.mjs:335` = 「const { discardAbortedBrowserTasks } = await import("../../thincoder-core/agent-tools/async-discard.mjs")」）；顶层用例逐行清点 = 16 ∥ 10（无 skip/todo/only）＝所载「16/16 ∥ 10/10」；`thincoder/thincoder-core/test/` 实读仅 `run.mjs`+`slow.mjs`（原缺陷前提成立）；死档引用余存仅记录面（:25 / :133 / :143）。 |
| 2 | 2 | `thincoder/docs/core/requirements/AGENT-LOOP.md:184` | 🟡 | Fixed | 现文不复引删除档 = 「运行期面 = 核单源 `thincoder-core/agent-tools/async-discard.mjs`——VSC 自持副本已退场，2026-10-10 收编批」；设计判据句两处带「（需求档行 = 父侧同拍落——已接）」（:78 / :104）。附核（正向）：锚闸另有仓内唯一 basename 兜底（`thincoder/scripts/doc-check-anchors.mjs:192` = 「if ((env.repoBasenames.get(basename(a.token)) ?? 0) === 1) return null;」；本轮 glob 复核：仓内同名档现 2 ⇒ 删档后 1）⇒ 「锚 0 悬空增量」可判。 |
| 3 | 3 | `thincoder/docs/batches/2026-10-10-vsc-consistency.md:56` | 🟡 | Fixed | KD-4 (b) 与 `1101-3` 行（:90）统一 = 「恢复点 = `ChatPanel` 构造内 · 订阅块之前（`chat-panel.mjs:90-96` 之间——`:96` 首个 `context.subscriptions.push` 之前；先于一切 `_cwd()` 消费）」；对盘：`thincoder/thincoder-vscode/src/extension/chat-panel.mjs:96` = 「context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {」为构造内首个订阅 push（:47-:95 无订阅 push、无 `_cwd()` 消费）⇒ 标签与坐标同读。 |
| 4 | 4 | `thincoder/docs/batches/2026-10-10-vsc-consistency.md:93` | 🟡 | Fixed | 落点明写 = 「`docs/vsc/design/PROJECT-SWITCHER.md`（`:30` 句 + §3 下新子节 = **§3.1 锚记忆与未选定面**）」；文档面（:101）同拍；对盘：`thincoder/docs/vsc/design/PROJECT-SWITCHER.md:34` = 「## 3. 切换流程（实现面）」——标题族 §1/§2/§3/§4/§4.1/§5/§5.1/§6/变更记录，无既存 §3.1 ⇒ 号位可用。 |
| 5 | 5 | `thincoder/docs/batches/2026-10-10-vsc-consistency.md:57` | 🔵 | Fixed | 边界句在位 = 「**边界明写：记录 = 最后一次成功切换的锚——非活锚**（工作区兜底回落径（`chat-panel.mjs:148-156`）改活锚而不写记录——两义分立）」；`1101-6` 行（:93）明该边界句入 §3.1。 |
| 6 | 6 | `thincoder/docs/batches/2026-10-10-vsc-consistency.md:130` | 🔵 | Accepted | 非修理由成立 = 「**号 6（🔵 · 行数 delta 形）维持**：数位经评审抽读实核（三处 ±1 = 尾行记法差）；「现数 ⇒ ≈目标」已载「delta = 预估——实施轮实测回填」= 界承诺之实——`≤±N` 属形变、无信息增益（不虚设界值）。」；本轮抽读数位相符、无档逼近 500/800 线 ⇒ 无拆分义务。关闭本号。 |
| 7 | 7 | `thincoder/docs/batches/2026-10-10-vsc-consistency.md:49` | 🔵 | Fixed | 现状句改 = 「现判据 `_fetchEpoch !== _addDialogEpoch`（弃向 = `settings-provider-dialog.js:251`；记代际点 = `:216`）」；对盘：`thincoder/thincoder-vscode/webview/settings-provider-dialog.js:251` = 「if (!_els || _fetchEpoch !== _addDialogEpoch) return」∥ `:216` = 「_fetchEpoch = _addDialogEpoch // 在飞代际：跨框弃果（落框前比对）」——判据向与记位对齐。 |
| 8 | 3（残留） | `thincoder/docs/batches/2026-10-10-vsc-consistency.md:97` | 🔵 | New | 同族第三处未同步（残留）：受影响行数表仍作「（443 ⇒ ≈455：构造末恢复 ∥ resolve 弹拍 ∥ 跟随写点）」——与 :56 / :90 的「构造内 · 订阅块之前」并读可生歧；建议该括注随正（不阻断）。 |
| 9 | (new) | `thincoder/docs/core/design/CORE-UNIFICATION.md:35` | 🟡 | New | 扫描面缺口（report-only · 不阻断）：B9 行仍引「`thincoder-vscode/src/agent-tools/async-discard.mjs:57-74`」（同行无「（迁移期引文」标记），而 `1047-3` / 文档面清单（:78 / :101）未列该档；锚域 = docs、排除 = `_archive`/`batches`（`thincoder/PROJECT-MANIFEST.json:34` = `"domain": "docs",`）。核为非闸口项：该引用删档后经仓内唯一 basename 兜底判非悬空（`thincoder/scripts/doc-check-anchors.mjs:192`）⇒ 不击穿「锚 0 悬空增量」。建议纳入文档面随正（或加「（迁移期引文…）」标记）。 |

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（批内件 13/13 ∥ #1047 结构面 0 悬空增量 ∥ #1048 复跑 10/10；审计 clean ∥ 评审 pass；修正 0 轮）



**范围**：#1047 删档 ∥ #1048 复跑 ∥ #1051 请求 id 归属 ∥ #1101㈠ 锚记忆 + 未选定面（VSC 舱）。设计 token 已签（round=initial）。

**改动面（我）**：`thincoder-vscode/`：`src/extension/session-io.mjs`（+`loadProjectFolder`/`saveProjectFolder` 宽容读写助手）· `src/extension/panel-messages.mjs`（+`hasProjectOverride()`）· `src/extension/panel-messages-settings.mjs`（`handleTestProvider` 回显 `id`）· `src/extension/panel-project.mjs`（`projectInfo` +`chosen`；+`rememberProjectFolder`/`restoreProjectFolder`/`maybeOfferProjectPick`）· `src/extension/chat-panel.mjs`（构造内恢复点 ∥ 跟随径写点 ∥ resolve 内弹拍）· `webview/settings-provider-dialog.js`（`_fetchSeq`/`_pendingFetchId` 落框判据）· `webview/session-bar.js`（未选定标记两态）· `locales/{en,zh}.json`（+`project.notChosen`）· `AGENTS.md`（模块图死行退场）；**删除** `src/agent-tools/async-discard.mjs`（`git rm` + 落盘删）。
**批内件**：`docs/batches/2026-10-10-vsc-consistency.test.mjs`（13 腿）+ 同名 `.harness.mjs`（mini 假 DOM + `vscode` 装缝测试台；主档越 500 软线 ⇒ 拆档，先例在册）。

**读数（实施轮实测）**
- 批内件：`node --test docs/batches/2026-10-10-vsc-consistency.test.mjs` ⇒ **13/13 pass**（#1051 七腿 ∥ #1101 六腿；含「构造内恢复时序」腿 = 首个订阅 push 时恢复已生效）。
- #1047 结构面：VSC 源面三符号（`async-discard`/`asyncDiscard`/`ASYNC_DISCARD`）**0 命中**（余存仅 `docs/_archive/**` ∥ `.thincoder/tmp/*` ∥ `*.vsix` 构建产物 = 非源面）；`node scripts/check-syntax.mjs` ⇒ **137 JS files OK**（删档后 138→137）；仓内同名档唯一化 ⇒ `glob **/async-discard*.mjs` 仅 **1** 件（`thincoder-core/agent-tools/async-discard.mjs`）；`node scripts/doc-check.mjs` ⇒ `FAIL(锚): 5 条悬空` 而其中 **`async-discard` 命中 0**（删档悬空增量 = **0**——唯一 basename 兜底在效）；运行腿：`docs/batches/2026-09-29-tools-carryover.test.mjs` **16/16** ∥ `docs/batches/2026-10-07-browser-async-fix.b.test.mjs` **10/10**。
- #1048 复跑：`docs/batches/2026-10-08-proxy-per-channel.test.mjs` ⇒ **10/10 pass**（T3 三态 7 断 + headers 门全中 ∥ T5 既有渠经代理实捕 + 新渠直连）；调用形 = **绝对大写盘符路径**（相对/小写盘符形触发 `@thincoder/core` junction realpath 大小写分裂 ⇒ T4 伪红；该档 `:21` 自载此启动形）。
- VSC 仓套件：`npm test`（`node test/run.mjs`）⇒ 空清单绿（批内件不入仓套件，随批归档）。

**决策透明表（实施轮）**
| 决策点 | 落法 | 依据 |
|---|---|---|
| 落框判据变量形 | 模块级 `_fetchSeq` + 在飞 `_pendingFetchId`；命中即清（防重放）；开/关框双清 | §2 KD-3（探针 id 化；代际形退场根因 = 关→开同为 +1 的对称缺陷） |
| 宿主 id 回显形 | `...(msg.id !== undefined ? { id: msg.id } : {})`（缺 id 不携键） | §2 KD-3；新判据下无 id 发送方必然早退 |
| 锚记录助手形态 | 两薄助手（读缺/抛 ⇒ 空串；写空值零写；沿 `saveModelPrefs` 先例） | §2 1101-1 |
| 恢复点 | `ChatPanel` 构造内 · 首个 `context.subscriptions.push` 之前 | §2 1101-2（先于一切 `_cwd()` 消费） |
| 写点 | 成功切换后两路同点（显式切换器 ∥ 跟随自动切换）；拒径零写；兜底回落径**不写** | §2 1101-2/KD-4（记录 = 最后成功切换的锚——非活锚） |
| 弹拍 | 门四全过 ⇒ 弹即写标记 → 复用 `pickProject`（零新选择器） | §2 1101-4 |
| 未选定标记 | `projectInfo` +`chosen`（判据 = `_cwdOverride !== null`）→ webview 文本 + title 同携 | §2 1101-4（标记只在多根 ∧ 未选定；单根隐藏零变） |
| 测试台 | 抽公档 `.harness.mjs`（mini 假 DOM + `vscode` 装缝） | 主档越 500 软线 ⇒ 拆档（先例 = 批 10-07/10-08 两档） |

**审计与评审轮次（内部链）· 终态**
- 发散审计（explore 子代理 · read-only）：**VERDICT: clean**（16 判据条目逐条合法覆盖；四类偏差 0）。
- 独立代码评审（advisor · code round 1）：**VERDICT: pass**（🔴 0 ∥ 🟡 1 非阻断 ∥ 🔵 5 咨询）。🟡 项 = 「显式选择 == 当前锚」径早退（`panel-project.mjs:128`）⇒ 记录不写 + `chosen` 恒 false ⇒ 面持续「未选定」——设计字面制下成立（无切换），属呈现面次优，已随交付报告上抛父侧裁（设计层）。
- **修正轮 = 0**（无 🔴 / 无阻断项；终态 = clean）。评审面只读 ⇒ 上列读数由本档落，父侧 §6 复核。

**父侧指令豁免（本轮不做 · 非本批判据）**：§2 的 `1047-3` ∥ `1047-4` ∥ `1051-4` ∥ `1051-5` ∥ `1101-6`（设计档/需求档随正行）按父侧明令归兄弟批 #100 面；`docs/vsc/design/PROJECT-SWITCHER.md` 现面仍作「重启后回到 `workspaceFolders[0]`」（:30）且无 §3.1 ⇒ 档面与已落行为相抵，待该面收口。

**未决/交接**：`AGENTS.md` 实测 **135** 行（§2 表「≈134」，差 1 属尾行记法——实测值以本行为准）；`extension.mjs` 本侧 `_cwd()` 镜像不读 `_cwdOverride`（`:201-203`）⇒ 退出释放取 `folders[0]` 而非恢复锚（本批把该形态扩到默认径；文件不在批受影响表内，判给父侧）。

## §6 验证与收口（父代理）

**交付物**：8/11 ✅ + 3 ❌（❌ 归面记录）—— `#1047` 删档（VSC 副本 + `AGENTS.md` 死行；源面三符号 0 命中 ∥ 结构面 0 悬空增量 ∥ 运行腿 16/16 ∥ 10/10）∥ `#1048` 复跑 T3/T5 **10/10**（零代码动作——已落地）∥ `#1051` 请求 id 归属（上行 + 宿主回显 + 落框四态 + 清在飞防重放）∥ `#1101㈠` 锚记忆（读写助手 + 恢复点五态 + 写点两路同点）+ 未选定面（`chosen` 载荷 + 钮标记 + 首开弹拍一次）；批内件 **13/13**。❌ 三行 = 设计档随正（#1047-3/4 ∥ #1051-4/5 ∥ #1101-6）+ UI 走查面 → 归 #100 面 / 用户面。

**父侧验证读数**：批内件 **13/13 绿**（父侧实跑 · 487ms）∥ VSC 结构面：三符号 0 命中 ∥ `check-syntax` **137 files OK** ∥ doc-check 悬空 5（`async-discard` 命中 0——删档增量 0）∥ 需求档回笔落讫（`docs/vsc/requirements/PROJECT.md:27` Multi-root 行现形句 + 变更记录 1 行 = 主 agent 笔）。

**上抛处置**：① 弹拍选中当前锚根径（记录不写 · 标记恒「未选定」）⇒ **父裁①**（该径视同显式选择——用户「选了记住」在这条径上有实体；早退省了切换、不该省记忆）；物件面归 #100 在飞域 ⇒ 入账 **#1193**（归批）∥ ② `extension.mjs:201-203` `_cwd()` 镜像不读 `_cwdOverride` ⇒ 退出释放错根 ⇒ 入账 **#1194**（归批）∥ ③ `AGENTS.md` 135 行（§2「≈134」差 1——尾行记法）⇒ 记录在案（零动作）∥ ④ 评审 4 项 🔵 带理由维持（沿预存先例）。

**评审终态**：设计评审 round1（🔴1 核件不在盘 + 🟡1 文档锚耦合）⇒ 定点修轮（号 1/2 落地）→ 实施：审计 clean ∥ 代码评审 pass（🔴0 ∥ 🟡1 非阻断 ∥ 🔵5）∥ 修正 0 轮；终态 = clean。

**走查面（登记待读 · 用户面）**：① 多根 · 未选定 ⇒ 钮「📁 <根名> · 未选定」（title 同携）② 选定后标记消失、重启回所选根 ③ 首开弹拍恰一次、ESC 后不再弹 ④ 单根 ⇒ 钮隐藏零变 ⑤ #1051 面：连点两次「拉取」⇒ 只落最后一次；关后重开、旧果迟到 ⇒ 状态行不动；（已知缺口 = 选中当前锚根径的标记滞留 ⇒ #1193 待落）。

**结算**：#1047 ∥ #1048 ∥ #1051 ∥ #1101（㈠ 落讫；㈡ 前已裁移出）⇒ 核销（evidence = 本档 + 13/13 读数）。**待办**：波尾 scoped commit；设计档随正（11 处 + `PROJECT-SWITCHER.md` §3.1 = #100 面）。
