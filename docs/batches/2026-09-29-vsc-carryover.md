# 2026-09-29 · vsc-carryover
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 20:42 直令——池面转批：VSC 收尾族（#640 ∕ #642 ∕ #643）。
> 台账 = #640 ∕ #642 ∕ #643（VSC 收尾族 · 归批）。前情 = 端差批 ∕ residuals 族转出。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（2026-09-29 20:44 · 立批——设计轮已派）

- **来源** = 用户 20:42 直令；触发 = 池面转批——VSC 收尾族三条。
- **条目**：**#640**（设置面失败面 S15 · VSC 侧向桌面形收正——结构化载荷；父侧已裁方向：VSC 向桌面收正）· **#642**（goal-panel 🎯 入口回合后消失——`clearPanels` 抹 `_goalInfo`）· **#643**（`S._llmCalls` 死计数清——`send.js:31` + `status-bar.js:83` 写 ∕ 零读；清时同步动 `docs/vsc/requirements/WEBVIEW.md:66` 行——**需求档笔 = 父侧**，设计师出清单、父侧落笔）。
- **口径**：VSC 写域（`thincoder-vscode/webview/**` + `src/**`）；端向 = 桌面行为準（#640 已裁）。
- **边界**：需求档零触（清单上抛）；不动 desktop。
- **授权** = 13:52 ∕ 17:02 全权。

- **#17（追加 · 父侧 2026-09-29 20:45）**：VSC `autoThink` 档位开关（对齐 CLI `/think` 的 Auto 组）——与 #635 反向差族交叉（桌面已有 `settings-agent.mjs:42`；VSC 无）。设计给：VSC 设置面落点 + 载荷对齐 + 与 #635「反向差全消口径」的关系句（并单或独立给由）。

**U1–U6 父侧裁定（2026-09-29 21:10）**：
- **U1** #642 会话载入基线推送 = **不纳入本批**（零端差——桌面同缺；如后续有需求另议）。
- **U2** #643 需求档行（`WEBVIEW.md:66` P2-2 半截 + 同笔 P2-1 坐标）= **纳入 #654 父侧笔族**（实施波前落）。
- **U3** #640 P2-7 行（`WEBVIEW.md:85`）= **收正为「单槽待显」**（与实施一致；并入 #654 同笔）。
- **U4** render-core 注释三处（`composer/panel.mjs:24 ∕ :299 ∕ :328`）= **登记下轮**（并入 #662 码注族）。
- **U5** 词值 = **照拟**（`settings.reason.mtimeConflict` ∥ `settings.agent.autoThink` = 桌面同值两语；父侧内容权，实施时核词面）。
- **U6** 到期事件（P2-3 ∕ P2-4）= **随动重登记**（实施 ∕ 收口轮核）；CLI `thinking:null` 标记差 = 登记在册。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-29 · 评审轮 1 发现 1–10 ∕ 轮次 2 发现 1–6 全数落地；四条（#640 ∕ #642 ∕ #643 ∕ #17）逐条设计；上抛六项已裁（零待裁）；设计档两档随动已落（2026-09-29——见本段末记录块））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（vsc-carryover · 2026-09-29 · eng-designer）**

> 依据 = 本档 §1（台账三条：**#640 ∕ #642 ∕ #643**）+ 台账三行 + 父侧已裁方向（#640：VSC 向桌面形收正——`docs/batches/2026-09-29-enddiff-clearance.md` §2.1 #634 行 ∕ KD-EC-7）。**本轮 = 设计轮**：产品码零触 ∕ 需求档零触 ∕ desktop 零触 ∕ 不发起评审；设计档更新随实施波落（靶句已列，笔权 = eng-designer）。§1 追加项 **#17 未入本轮射程**（派单三条；依赖 #635 全消口径未裁）——已上抛（见「上抛项」①），如父侧回信纳入再补设计。

**1. 本批条目（覆盖 ∕ 不纳入）**

| 台账 | 面 | 届盘实读（2026-09-29） | 处置 |
|---|---|---|---|
| #640 | VSC 设置面（`webview` + `src/extension`） | 仍真——`showSettingsError(text)` 裸串 + 6s 自散 + 关面板静默丢弃（`webview/settings.js:61-72`；入线 `chat-messages.js:152-154`；发射 7 处全携 `text:` 裸串） | 本批设计 · 收正 = 段标 + 词化码 + 面板态驻留（关面板不丢）——方向 = 桌面形（KD-EC-7） |
| #642 | VSC webview（`panels/input/chat-messages`） | 仍真——回合起点 `clearPanels`（`input.js:101`）抹 `_goalInfo` × goal 变更门控（`panel-turn-loop.mjs:130`）⇒ 🎯 回合后消失；且**跨会话残留**（`clearMessages` 现不触面板态——今日残留至下次回合起点） | 本批设计 · 重置点归位：回合起点 → 会话切换 |
| #643 | VSC webview 三档 + 需求档行（**父侧笔**） | 仍真——`_llmCalls` 定义 `state.js:101` ∕ 写 `input.js:99` + `status-bar.js:111` ∕ **零读**（全仓 grep 复读；登记所载坐标 `send.js:31` ∕ `status-bar.js:83` 已漂移） | 本批设计 · 码面三处清 + 需求档行清单上抛 |
| 不纳入 | — | **#17**（§1 追加 20:45——派单未列；其「与 #635 关系句」依赖 #635 未裁） | 零设计（上抛 ①；已另发 ask） |

**2. 逐条设计**

### #640 · 设置面失败面 S15 收正（VSC → 桌面形）

**现状实读（①②③ 三链）**
- **VSC 形**：`webview/settings.js:61-72` `showSettingsError(text)`——`#settings-error-banner` 裸串、`setTimeout(() => el.remove(), 6000)` 自散、面板关（`panel.style.display === "none"`）⇒ 直接 return（静默丢）。入线 = `webview/chat-messages.js:152-154`（`case "providerError": showSettingsError(m.text)`）。发射 7 处（全携 `text:` 裸串）：`src/extension/panel-mcp.mjs:129`（重连·无此服务器）·`:140`（重连失败）·`:151`（测试·无此服务器）·`:165`（编辑保存 err）∥ `src/extension/panel-messages-settings.mjs:59`（加渠道 err）·`:71`（准入探针 `probe.error`）·`:84`（删渠道 err）。
- **桌面形（参考 · 零动）**：`views/settings.mjs:254-265` `noticeNode` = 段标（`SCOPE_WORD` 七段闭集 :66-67；`panel` ⇒ 零段标）+ 文本（`reasonWord(notice.reason)`——`REASON_WORD :49-64` 表内出词 ∕ 表外原样直传 ∕ 缺空 ⇒ 零节点）；槽 = `{scope, reason}`（`mount-settings.mjs:79-88` `report`）；驻留 = 面板开时驻留、开 ∕ 关帧清槽（`mount-settings-exits.mjs:179/:193`）；词面 = `i18n-settings.mjs:33-44/:91-102`。
- **方向已裁**（`enddiff-clearance` KD-EC-7）：消——VSC 向桌面形收正（桌面形信息更全）；判据 = 两端失败面同形（段标 + 词化码 ∕ 不静默丢）。

**方案**
1. **载荷 v2**（`providerError`）：`{ type:"providerError", scope, reason }`——
   - `scope` ∈ VSC 段名闭集 {`providers`,`mcp`,`agent`,`consultAdvisor`,`tools`,`env`} ∪ {`panel`}（`panel` ∕ 闭集外 ⇒ 零段标，沿桌面判）；段名词键 = 复用现有 `settings.providersSection` ∕ `settings.mcpSection` ∕ `settings.agentSection` ∕ `settings.consultAdvisorSection` ∕ `settings.toolsSection` ∕ `settings.envSection`（**零新段名键**）。
   - `reason` = 码 ∕ 原样串；webview 解析 = 桌面 `reasonWord` 同式：**表内出词、表外原样直传、空 ⇒ 零节点**。
2. **webview**（`webview/settings.js`）：`showSettingsError(scope, reason)` 重写——
   - 表 `SCOPE_WORD`（六段 ↦ 上述词键）+ `REASON_WORD` v1 = {`mtime-conflict` → `settings.reason.mtimeConflict`}（**v1 恰收录可达码**——7 站可判码仅写冲突一类；表随新码产者一行扩张）；`reasonWord(reason)` 出词规则同上。
   - banner = `[段标?][文本]` 两子节点（携 `data-scope`）；**删 6s 自散**（面板开时驻留至替换 ∕ 关面板）。
   - **关面板不丢**：模块级单槽 `_lastFailure`（最后一条胜）；面板关时到达 ⇒ 落槽；`buildSettings()` 尾 ⇒ 有槽即渲（开面板补显）；`closeSettings()` ⇒ 清槽（关 = 销账）。
3. **extension**（7 站点）：统一经助手 `postProviderError(panel, scope, err)`（新，住 `src/extension/settings.mjs`——两消费档均已引本档；置载荷构造单源）：
   - `err === CONFIG_CONFLICT_HINT`（核导出常量 `config-io.mjs:42`——`conflictError` 的唯一非空返回）⇒ `reason = "mtime-conflict"`；其余 ⇒ `reason = err` 原样。
   - 站点 scope：`panel-mcp.mjs` 四处 = `mcp`；`panel-messages-settings.mjs` 三处 = `providers`。
4. **i18n**：`settings.reason.mtimeConflict` 两语新键（值建议 = 桌面同值：en `Config changed elsewhere — reload before saving` ∕ zh `配置已在别处变更——请重载后再保存`——两端同形；**内容权 = 父侧核定**，上抛 ⑥）。

**受影响文件（file 级 · 现读 = 内容行口径 · as-of 2026-09-29；增量 = 设计预期，实施轮届盘重锚）**

| 文件 | 现读 | 变更 | Δ 预期 |
|---|---|---|---|
| `thincoder-vscode/webview/settings.js` | 138 | `showSettingsError` 重写 + `SCOPE_WORD` ∕ `REASON_WORD` ∕ `reasonWord` + `_lastFailure` 槽 + `buildSettings` ∕ `closeSettings` 挂点 | ≈ +45 −10 |
| `thincoder-vscode/webview/chat-messages.js` | 262 | `providerError` 支改传 `(m.scope, m.reason)` | ±2 |
| `thincoder-vscode/webview/settings.css` | 379 | 段标 span 一条样式（>300 顾问线 ∕ <500 硬——+5 行级，免拆） | ≈ +5 |
| `thincoder-vscode/locales/en.json` · `zh.json` | 272 · 272 | +`settings.reason.mtimeConflict`（两语同增） | +1 +1 |
| `thincoder-vscode/src/extension/settings.mjs` | 350 | +`postProviderError`（含冲突码分派）；>300 顾问线在越（既有）——本件 +14 行级、无新职责，拆分预案不在本件（下一结构轮判） | ≈ +14 |
| `thincoder-vscode/src/extension/panel-mcp.mjs` | 167 | 四站点改走助手 | ≈ ±8 |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 204 | 三站点改走助手 | ≈ ±7 |
| `thincoder-vscode/test/smoke-settings.mjs` | 97 | 调用形随动 = `showSettingsError("panel", "test error")` | ±1 |
| `docs/vsc/design/SETTINGS.md` | 578 | 新节 §2.15「设置面失败面（S15 收正）」——段标 ∕ 码表 ∕ 驻留 ∕ 关面板槽 + 变更记录 1 行 | ≈ +26 |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 682 | §3.2 增第 20 项（19⇒20——计数与列表同改）+ §12 `providerError` 行 ⑤ 载荷增注（②③ 列坐标随实现轮 emit 重出）+ 变更记录 1 行 | ≈ +6 |

**验收判据（机检）**
- （批件 · fake DOM 直驱 `webview/settings.js`）① 开面板 + `showSettingsError("mcp","mtime-conflict")` ⇒ banner 在场 ∕ 段标文本在场 ∕ 文本 = 词化句（≠ 原串）；② 表外 reason ⇒ 文本逐字 = 原样串 ∧ 段标仍在；③ `scope:"panel"` ⇒ 零段标节点；④ 关面板态调用 ⇒ 零节点 ∧ 开面板（buildSettings 后）⇒ 复现（**关面板不丢**）；⑤ 单实例（二次调用替换）；⑥ `closeSettings()` 后复开 ⇒ 不复现（关 = 销账）；⑦ 源锁：`showSettingsError` ∕ 渲染路径**零 `setTimeout`**（不自散）。
- （扩展侧源锁 · 文本锁）`grep "providerError"`：发射全 7 处经助手（零 `text:` 字面残留）；助手含 `CONFIG_CONFLICT_HINT` 冲突码分派。
- 真机腿（建议 · 父侧）：制造写冲突（外部改 `config.json` 后于面板保存）⇒ 段标 + 词句驻留（无 6s 自散）∧ 关面板重开仍见。
- 两端同形（人工对读 · 随本批落时核——判据原文 =「段标 + 词化码 ∕ 不静默丢」）。

**决策记录（含被否）**
- **KD-VC-1 · 载荷字段 = `{scope, reason}`**（桌面同名同义——单字段消歧）。被否：① `{scope, code, text}`（双字段优先级歧义）；② 仅加 `scope` 沿用 `text`（词化码无渠）。
- **KD-VC-2 · 词表 v1 = 恰可达集（`mtime-conflict` 一枚）**。被否：全量 14 码镜像（不可达项 = 死表 ∕ D3 违——表外原样直传 ⇒ 零信息损，表可一行扩张）。
- **KD-VC-3 · 关面板路径 = 单槽待显（不取系统级提示）**：需求档 P2-7（`requirements/WEBVIEW.md:85`）在册消解路 =「关闭态转系统级提示」——本件取**面板面单槽待显**，由 = ① 桌面形 = 面板面（无系统级面——同形判据）；② 失败源含面板外动作（模型菜单加 ∕ 删渠道、探活）⇒「无痕」本体随本件消；③ 系统级提示 = 新面，超本件。**P2-7 行随动 = 父侧裁**（上抛 ③）。
- 被否：保留 6s 自散（信息弱形，直违判据）；被否：仅「关面板不丢」半修（达不到「不自散」主句）。

> **§2 勘误（本刻 · 父侧回信）**：**#17 纳入本轮**——依据 = §1 的 20:45 追加项即本批射程（§1 = 任务书本体；派单复述只列三条 = 父侧笔误，以 §1 为准）。上块「本批条目」表 **#17 行以本条为准**（处置 = 本批设计，独立小节随下块落）。

### #642 · goal 面板回合存续（重置点归位）

**现状实读**
- 回合起点钩 `composerHooks.onTurnStart`（`input.js:95-102`）→ `if (!S._suspended) clearPanels()`（`:101`）→ `panels.js:39-46` 抹 `_goalInfo` ∕ `_taskProgress` ∕ `_taskStatus` + 隐双面板 + 开合态不重置。
- goal 推送 = **变更门控**（`panel-turn-loop.mjs:129-138`：`goalChanged` 才 `onGoal`）⇒ 清后无变更 ⇒ 🎯（判据 `status-bar.js:28` `S._goalInfo?.status === "active"`）不再回归——「入口回合后消失」。
- **桌面参考**（对读）：`ev:goal` ∕ `ev:tasks` 切片按会话键、无回合起点清空（`events-slices.mjs:81-88` · `events.mjs:37/:42`；批档 `2026-09-29-residuals-round2.md:464` 报告在册）。
- **绑定面实读**：`clearPanels` 唯一调用点 = `input.js:101`（回合起点）；`clearMessages` 支（`chat-messages.js:119-128`）现**不触**面板态 ⇒ 会话切换后残留（今日 = 残留至下次回合起点；若只做 goal-only 半裁 ⇒ 残留延至下次 goal 变更 = **修出的窗口扩大**——故归位重置点）。

**方案 = 重置点归位（回合起点 → 会话切换），函数体零动**
1. `input.js` `onTurnStart`：删 `if (!S._suspended) clearPanels()` + 删 import `clearPanels`（`:16`）；钩体留 `_turnStart` ∕ `_lastOutputAt` ∕ `hadToolResult`（+#643 删 `_llmCalls` 行）；钩注随动收正。
2. `chat-messages.js` `case "clearMessages"`：同点加 `clearPanels()`（会话切换 ∕ 载入 ∕ boot 经此一径——宿主发射点单源 = `panel-session.mjs:147`）；import 面 +1 名（同档 `:21` 已引 panels.js 五名）。
3. `panels.js` `clearPanels()`：体**零动**（goal ∕ task 双清 + 双面板隐 + **开合态不重置**——桌面「构树重挂不丢态」同语义）；头注收正（语义从「回合起点」改判「会话边界」）。
- 效果：① 回合后 🎯 存续（含开合态与面板内容）；② 跨会话零残留（切换即清）；③ **task 徽标 ∕ 面板同判跨回合存续**（同一函数同一根因——随动；桌面 tasks 切片同无回合清空；**若父侧要求严格单点 ⇒ 退化形 = goal-only，代价 = 跨会话残留保留 + task 语义双轨**，见 KD-VC-5）。

**受影响文件（file 级 · 现读 = 内容行口径）**

| 文件 | 现读 | 变更 | Δ |
|---|---|---|---|
| `thincoder-vscode/webview/input.js` | 127 | 删 `clearPanels` 调用 + import；钩注随动（+#643 删行同块） | −2 ±3 |
| `thincoder-vscode/webview/chat-messages.js` | 262 | `clearMessages` 支 + `clearPanels()`；import 面 +1 名 | +2 |
| `thincoder-vscode/webview/panels.js` | 126 | `clearPanels` 头注改判（会话边界语义；体零动） | ±2 |
| `docs/vsc/design/WEBVIEW.md` | 740 | §2 行面板区句收正（回合起点不清——跨回合存续；会话切换清；开合态不重置）+ 变更记录 1 行 | ≈ +2 |
| `docs/batches/2026-09-29-residuals-round2-vsc.test.mjs` | 245 | **零改**（L3-D 直调 `clearPanels`——体零动 ⇒ 断言照绿；L3-S 不锁调用点——已逐行复读核） | 0 |

**验收判据（机检）**
- 源锁（**判别性**）：`input.js` 零 `clearPanels` 引用（旧 = 有 ⇒ 旧红新绿）；`chat-messages.js` `clearMessages` 支含 `clearPanels()`（旧 = 无 ⇒ 旧红新绿）。
- 行为腿（批件 · fake DOM）：`clearPanels()` 体语义 = goal ∕ task 双清 + 双面板隐 + `_goalPanelOpen` 不重置（= L3-D 复跑 + task 同判新腿）；goal 置位后 `renderStatusBar()` ⇒ 🎯 在场（存续面）。
- 真机腿（父侧）：goal active ⇒ 发一轮 ⇒ 回合后 🎯 在场 ∧ 可开合 ∧ 面板内容未失；切会话 ⇒ 双侧清零（新会话无目标 ⇒ 零 🎯）；task 徽标同理跨回合存续。
- 桌面对读（参考 · 零跑）：上列桌面坐标。

**决策记录**
- **KD-VC-4 · 重置点归位（函数体零动 ∕ 调用点换）**。被否：① goal-only 半裁（跨会话残留窗口修出扩大——见现状实读）；② `clearPanels` 拆双函数（同根同函数，半裁留 legacy 无据）。
- **KD-VC-5 · task 面随动**（同函数同根因 + 桌面同判）。被否：task 面留原样（= 对已知错结构叠最小补丁——违铁律 2）。

### #643 · `S._llmCalls` 死计数清（码面三处 + 需求档行上抛）

**现状实读**：定义 `state.js:101`（`_llmCalls: 0, // LLM calls this turn (CLI turn-count parity)`）；写 `input.js:99`（回合起点归零）+ `status-bar.js:111`（`handleUsageMessage` 内 `S._llmCalls++`）；**零读**（全仓 grep：`thincoder-vscode/**` 码面仅上述三处——无第四处 ∕ 测试面零；`thincoder-render-core/composer/panel.mjs:24/:299/:328` 三处注释提及 = **域外面**，上抛 ⑤）。需求档在册 = `requirements/WEBVIEW.md:66` P2-2（父侧笔）；到期已触发（`residuals-round2` 波 2 已触碰 `status-bar.js` ∕ `state.js`——`2026-09-29-residuals-round2.md:467` 在册）。

**方案 = 三处删除（零语义∶死计数无读面）**
1. `state.js:101`——删槽 + 行注。
2. `input.js:99`——删 `S._llmCalls = 0`；钩注随动（#642 同块）。
3. `status-bar.js:111`——删自增；`handleUsageMessage` 头注（`:108`「count the LLM call」半句）随动删。
- 不动：`status-bar.js:50` `turn N/M` 段（源 = `_turnFrame`，与本计数无关）；`input.js` `_turnStart` ∕ `_lastOutputAt` 簿记。

**受影响文件（file 级）**

| 文件 | 现读 | 变更 | Δ |
|---|---|---|---|
| `thincoder-vscode/webview/state.js` | 139 | 删 `_llmCalls` 槽 + 行注 | −1 ∕ −2 |
| `thincoder-vscode/webview/input.js` | 127 | 删归零行（与 #642 同块随动） | −1 ±2 |
| `thincoder-vscode/webview/status-bar.js` | 134 | 删自增 + 头注半句 | −1 ±1 |

**上抛（需求档 · 父侧笔——逐处清单）**
- `docs/vsc/requirements/WEBVIEW.md:66` 现文 = `- **P2-1** `ctx.activeSession` 死写（`chat.js:195` 写 / 全树零读） · **P2-2** `S._llmCalls` 死计数（`send.js:31` + `status-bar.js:83` 写 / 零读）⇒ 消解 = 下次触碰该档时清；到期 = 相应档下次修改。`
  - 落笔建议：**删 P2-2 半截**（` · **P2-2** … 零读）`——含其已漂移坐标），保留 P2-1 及尾句（尾句对 P2-1 仍适用）。
  - 顺手可及（另注）：P2-1 坐标亦已漂移——现盘写点 = `webview/chat-messages.js:136`（`chat.js:195` 失据）；P2-1 本体仍真（全树零读复读在案）。如父侧同笔 ⇒ 一处坐标替换。
- 相关期后项：本行清后，`residuals-round2` 报告项 #2（`2026-09-29-residuals-round2.md:467`）载体落定、可核销（父侧台账面）。

**验收判据（机检）**
- grep：`_llmCalls` 在 `thincoder-vscode/{webview,src,test}/**` **零命中**（旧 = 3 命中 ⇒ 旧红新绿）；render-core 三处注释 = 域外面（排除于扫描域，上抛 ⑤）。
- 行为腿（批件 · fake DOM）：`handleUsageMessage({usage:{...}})` ⇒ `!("_llmCalls" in S)`。
- `node --check` 三档绿。

### #17 · VSC Auto（`autoThink`）档位开关（承 §1 追加 · 小件）

**现状实读**
- **机制**（核单源）：`thincoder-core/auto-think.mjs` `classifyAndApply`（turn 0 ∧ `agent.config.agent.autoThink` 为真 ⇒ 一次廉价分类调用定难度 low/medium/high ⇒ 映射模型 `reasoningEffortEnum` ⇒ 写 `agent.provider.reasoningEffort`）。
- **CLI（`/think` Auto 组）**：`thincoder-cli/src/tui/cmd-think.mjs:30`（`autoThinkEnabled = agent.config?.agent?.autoThink === true`）· `:63`（菜单 autoOn）· `:92-94`（toggle 回执）· `:119-126`（`cfg.autoThink = !cfg.autoThink`；**开 auto 同时清 `thinking:null` 显式 off 标记**）。
- **桌面（对位形）**：`views/settings-agent.mjs:62` `{ path: "agent.autoThink", word: "settings.agent.autoThink", kind: "boolean" }`（NAMED_FIELDS 十八键之末——R7 增；表头在 `:42`，父侧引号即该处）；词面 `i18n-views.mjs:170 ∕ :314`。
- **VSC 现状（三段链实读）**：① 读面**半在场**——`loadAgentSettings()` 已载 `autoThink: a?.autoThink ?? d.autoThink`（`src/extension/settings.mjs:42`），但 **push 快照 `agentSettings()`（`:130-157`）未携该键** ⇒ webview 收不到；② 写面**不在**——`saveAgentSettingsFromPanel`（`settings-panel-write.mjs:64-107` 逐字段支）无 autoThink 支（`applyAgentPatch :31-38` = 泛键循环——补支即达）；③ 控件面**不在**——`settings-agent.js`（183 行）agent 卡无 Auto 控件。键本体已活（W15 #175a 死键复活——`config.json → agent.config.agent` 归一在位；默认 false ⇒ 零行为变化；记录面 = `docs/batches/2026-09-15-vsc-core-wiring.md:225/:2460-2461`）。

**方案（四件）**
1. **落点**：`webview/settings-agent.js` agent 卡，`#ag-verifyguard`（`:25`）后位新增 switch 复选框 `#ag-autothink`（渲染两态 = `SS.agentSettings.autoThink` 驱动）。位序注：桌面位序 = R7 追加尾位（`NAMED_FIELDS` 末）；**位序非对齐面**，对齐面 = 键 ∕ 控型 ∕ 写语义。
2. **写链**：payload 增 `autoThink: chk("ag-autothink")`（`buildAgentPayload` `:120` verifyGuard 邻位——恒携布尔）；`saveAgentSettingsFromPanel` 增 `if (payload.autoThink !== undefined) patch.autoThink = !!payload.autoThink`（**逐字同 verifyGuard 式**——`:79`）——显式布尔写（false 亦写、非删键；对齐桌面布尔写）。
3. **读链**：`agentSettings()` 快照增 `autoThink: s.autoThink,`（补环——`loadAgentSettings:42` 已在；读语义 = `?? DEFAULTS.autoThink` 缺省 false）。
4. **词面**：`locales/en.json` · `zh.json` 增 `settings.agent.autoThink`（值建议 = 桌面同值：en `Auto-think (classify task difficulty per turn)` ∕ zh `自动思考（按回合分类任务难度）`——跨端同键逐字；内容权 = 父侧核定）。

**与 #635 关系句（两态收束——父侧要求）**
- 关系：#17 与 #635「反向差五项」之 **autoThink 项 = 同项两面**（需求面 ∕ 落面）：VSC 轴 = 本件（形状设计）；桌面轴 = #635 的保留 ∕ 撤回裁定。**并单判 = 不并 #635 轮**（由 = 形状与全消口径正交、可先行落定；#635 轮载体 = 桌面设置面，VSC 落面住本批）——依赖未决不阻塞形状。
- **采纳态**（#635 裁「补 VSC」= 全消向 VSC 补）：本件即该项落点 ⇒ 随本批实施；#635 autoThink 项由父侧随裁定核销 ∕ 注「已由本批落地」。
- **不采纳态**（#635 裁 VSC 不补控件——「保留桌面」∥「撤桌面」两子形皆然）：本件**随其退场** ⇒ 零实施；台账 #17 核销为「不采纳」（VSC 维持无控件；键本体仍活——`config.json` 可手改）。两态下本设计文本皆成立（不采纳态留档备查）。

**受影响文件（file 级）**

| 文件 | 现读 | 变更 | Δ |
|---|---|---|---|
| `thincoder-vscode/webview/settings-agent.js` | 183 | agent 卡增 Auto switch（verifyGuard 后位）+ payload 增 `autoThink` 布尔 | ≈ +3 |
| `thincoder-vscode/src/extension/settings.mjs` | 350 | `agentSettings()` 快照增 `autoThink: s.autoThink,` | +1 |
| `thincoder-vscode/src/extension/settings-panel-write.mjs` | 183 | `saveAgentSettingsFromPanel` 增 autoThink 布尔支（同 verifyGuard 式） | +2 |
| `thincoder-vscode/locales/en.json` · `zh.json` | 272 · 272 | +`settings.agent.autoThink`（两语同增） | +1 +1 |
| `docs/vsc/design/SETTINGS.md` | 578 | §2.3 Agent 运行参数增 autoThink 句（读 ∕ 写 ∕ 控件三链）+ 变更记录 1 行 | ≈ +3 |

**验收判据（机检）**
- 读链源锁：快照对象含 `autoThink: s.autoThink,`（旧 = 无 ⇒ 旧红新绿）。
- 写链行为腿（**纯 Node 可直驱**——`settings-panel-write.mjs` 头注在册「无 vscode import——单测可在 extension host 外运行」）：tmp 家 → ① `{autoThink:true}` ⇒ `raw.agent.autoThink === true`；② `{autoThink:false}` ⇒ `false`（显式写）；③ 载荷不带该键 ⇒ 键零动（缺席 ≠ 清空）。
- 渲染/载荷腿（fake DOM）：`agentCardHtml()` 两态（SS true ⇒ `checked` ∕ false ⇒ 无）；change 触发 ⇒ posted `saveAgentSettings.settings.autoThink` 布尔（可行则加；否则以源锁代）。
- 真机腿（父侧）：开关 ⇒ `config.json agent.autoThink` 翻转 ∧ 面板重开读回同值 ∧ 开启后下一回合分类器生效（行为可辨）。
- 对位复读：CLI `cmd-think.mjs:30` ∕ 桌面 `views/settings-agent.mjs:62` 同键同义（在案）。

**决策记录**
- **KD-VC-6 · 落位 = agent 卡布尔开关组（verifyGuard 后位）**。被否：consult/advisor 卡尾位（桌面位序照搬——该卡混 slot 面控件 ∕ 需另加显式绑定；位序非对齐面）。
- **KD-VC-7 · 写语义 = 显式布尔写（false 亦写）**。被否：false ⇒ 删键（与 verifyGuard ∕ 桌面布尔写分叉——键缺省 false 同值，但盘面形态分裂）。

**披露（#17 面）**
- ① **CLI ∕ 桌面·VSC 差（既有 · 不扩）**：CLI 开 auto 同时清 `thinking:null` 显式 off 标记（`cmd-think.mjs:119-126`——防 auto 写入 effort 与 `enable_thinking:false` 矛盾）；桌面 ∕ 本件 = 纯布尔（零标记逻辑）。该差 = 既有桌面差（非本件引入）；如要消 ⇒ 两端同修 ∕ 另立（现登记）。
- ② **登记到期事件（requirements `WEBVIEW.md` §2 册 · 裁量归父侧）**：a) **P2-3**（`:79` 默认值物化——消解 = 差异提交 ∕ 到期 = agent 卡下次触碰）——本件触碰 `settings-agent.js` ⇒ 到期触发；**本件不contain**（差异提交 = payload 面重构，超小件射程）——建议父侧改登记到期（指向「差异提交专轮」）∥ 或随动裁。b) **P2-4 ∕ 2026-09-29 裁定**（`:80-82` 缺席 ≡ 清空 ∕ advisor.provider·model 缺席 ⇒ 保持现值；到期 = `settings-panel-write.mjs` 族下次触碰）——本件触碰该档（+2 行）⇒ 到期触发；实读半幅在盘（写面 `if (key in adv)` 守卫 `:151-156`；webview 恒发 null `settings-agent.js:121-126`）——建议父侧随动裁（补 webview 半幅 ∕ 重登记）。

**3. 三链同源对照**

| 条目 | 台账 | 本 §2 | 设计档落点 | 需求档 |
|---|---|---|---|---|
| #640 | #640（在途） | 本档 #640 节 | `SETTINGS.md` §2.15 新节 + `WEBVIEW-PROTOCOL.md` §3.2（19⇒20）/ §12 | 关联行 `WEBVIEW.md:85`（P2-7——父侧随动；上抛 ③） |
| #642 | #642（在途） | 本档 #642 节 | `WEBVIEW.md` §2 行面板区句 + 变更记录 1 行 | 无行（台账即登记面——如实） |
| #643 | #643（在途） | 本档 #643 节 | 无（码面清 + 需求档行退场） | `WEBVIEW.md:66` P2-2 半截删（父侧落笔——上抛 ②） |
| #17 | #17（在途 · §1 追加） | 本档 #17 节 | `SETTINGS.md` §2.3 + 变更记录 1 行 | 无行（台账即登记面——如实）；#635 关系句 = 本档 #17 节 |

**4. 测试面（批次件）**
- 新批件 `docs/batches/2026-09-29-vsc-carryover.test.mjs`（暂存 `.thincoder/tmp/` → 父侧 copy 终位——#545 立即形先例；harness 沿 `2026-09-29-residuals-round2-vsc.test.mjs` mini 假 DOM 先例；#17 写链腿 + #640 设置面腿可直驱真模块）。
- 腿清单：#640 七腿 · #642 三腿 · #643 两腿 · #17 三腿（见各节验收）。
- 不新增集成面（批内件形）。

**5. 边界（不做）**
- 产品码 ∕ 需求档零触（本轮）；desktop 零触（端向 = 桌面为準——对读在案）；render-core 零触（注释三处 = 域外——上抛 ④）。
- 不做：#640 的 VSC 本地英文串词化（`No MCP server named…` 四串——超 7 站码化射程，披露）；会话载入的 goal ∕ task 基线推送（上抛 ①）；P2-7 系统级提示面（KD-VC-3）；P2-3 差异提交（#17 披露②a）；CLI `thinking:null` 标记清理差（#17 披露①）；#635 全消口径本体（裁定权 ∕ 非本批）。
- 不发明：词表 v1 恰可达；载荷字段 = 桌面同名；autoThink 写语义 = verifyGuard 同式。

**6. 上抛项（父侧裁）**
- ① **#642 会话载入基线推送**（goal ∕ task）：现无（载入后至首次变更前零显示；桌面侧同缺）——先例 = `panel-session.mjs:141/:146`（autoApprove ∕ planMode 载入即推）；本件未含（不发明）；如父侧纳入 ⇒ 落点 = 该档载入链 + 批件腿 +1。
- ② **#643 需求档行删**（`WEBVIEW.md:66` P2-2 半截——逐处清单见 #643 节）；同笔可及 = P2-1 坐标漂移（`chat.js:195` ⇒ `chat-messages.js:136`）。
- ③ **#640 P2-7 行随动**（`WEBVIEW.md:85`）：本件取「单槽待显」，与在册消解路「系统级提示」异——请裁收正 ∕ 保留双径。
- ④ **render-core 注释三处**（`composer/panel.mjs:24 / :299 / :328` 含 `_llmCalls` 归零句）：VSC 写域外 ∕ 共享包——建议随本批一行级清（零行为）∥ 登记 next render-core 轮。
- ⑤ **词值核定**（内容权）：#640 `settings.reason.mtimeConflict` ∕ #17 `settings.agent.autoThink`——建议皆 = 桌面同值（两语）。
- ⑥ **到期事件两件 + CLI 标记差**（#17 披露①②——P2-3 ∕ P2-4 到期已触发裁量 ∕ CLI `thinking:null` 标记差登记）。
- （原「#17 判」上抛项已由父侧回信消解——#17 纳入本轮，本条即其设计。）

**7. 读回核实（D6）**：本 §2 三块 append（6017 + 4616 + 本块）落盘后逐块回读（块头 ∕ 表体 ∕ 状态行）；全节坐标按现盘复读（file:line 逐处在案）。

**§2 勘误补记（本刻 · eng-designer · 交叉引用收正）**：上列各块内的上抛序号按「6. 上抛项」终表（① 会话载入基线 ∕ ② #643 需求档行 ∕ ③ P2-7 行 ∕ ④ render-core 注释 ∕ ⑤ 词值核定 ∕ ⑥ 到期事件两件 + CLI 标记差）为准——逐处收正：① #640 i18n 行「上抛 ⑥」⇒ **上抛 ⑤（词值核定）**；② #643 现状实读行与验收行两处「上抛 ⑤」⇒ **上抛 ④（render-core 注释）**；③ 首注 ∕ 条目表 #17 行（「未入本轮射程 ∕ 上抛 ①」）以 **§2 勘误（#17 纳入）** 为准——#17 已设计落档（见 #17 节），原「上抛 ①」随父侧回信消解，终表① 现义 = 会话载入基线推送。其余序号引用（:82 ∕ :198 ∕ :200 ∕ :209 ∕ :210）复核一致、零改。**行文按 append-only 不改旧行——以本补记为准**（读回核在案）。

**§2 修正轮落地（评审轮 1 · 发现 1–10 · eng-designer · 2026-09-29）**

> 口径：承 §3 轮次 1 发现表——十条全数裁定接受，逐号落地（零漏号）；零新语义（只落评审所请 ∕ 父侧已裁口径）；产品码 ∕ 需求档 ∕ desktop 零触；**设计档正式条款零触**（U0 = 随实施波——本轮零设计档笔）。行文沿 append-only——上文各块零改；凡本块所指「收正」处，以本块为准（沿本档 :93 ∕ :232 勘误块式样）。

**① 裁定回填（评审 #1——①–⑥ ↔ U1–U6 逐条对号）**

| 上抛（:222–:228） | §1 裁定（21:10 · :19–:25） | 状态 |
|---|---|---|
| ① 会话载入基线推送（#642） | U1 = **不纳入本批**（零端差——桌面同缺；后续有需求另议） | 已裁 ∕ 关闭 |
| ② #643 需求档行（`WEBVIEW.md:66` P2-2 半截 + 同笔 P2-1 坐标） | U2 = **纳入 #654 父侧笔族**（实施波前落） | 已裁 ∕ 转移 #654 |
| ③ #640 P2-7 行（`WEBVIEW.md:85`） | U3 = **收正「单槽待显」**（与实施一致；并入 #654 同笔） | 已裁 ∕ 转移 #654 |
| ④ render-core 注释三处（`composer/panel.mjs:24 ∕ :299 ∕ :328`） | U4 = **登记下轮**（并入 #662 码注族） | 已裁 ∕ 登记 #662 |
| ⑤ 词值核定（`settings.reason.mtimeConflict` ∥ `settings.agent.autoThink`） | U5 = **照拟**（桌面同值两语；实施时核词面） | 已裁（照拟） |
| ⑥ 到期事件两件（P2-3 ∕ P2-4）+ CLI `thinking:null` 标记差 | U6 = **随动重登记**（实施 ∕ 收口轮核）；CLI 标记差 = 登记在册 | 已裁（重登记） |

**结论 = 上抛六项全数已裁、零待裁**（+ #17 判已由父侧回信消解——在册 :228 ∕ :93）；状态行「上抛六项」口径同轮收正（= 已裁 ∕ 零待裁——本次 status 更新同落）。

**② 文档靶点收正（评审 #2 ∕ #3 ∕ #7）**

- **#2**：上文 `:79`（`WEBVIEW-PROTOCOL.md` 靶点行）收正——补 **§7 D-P11（`:325`）「十九项 ⇒ 二十项」** 与 **§3.2 纪律行（`:103`）「行 1–19 ⇒ 行 1–20」** 两处计数同步（D3 计数与列表同改——先例 `:672` ∕ `:677`）。
  **Δ 复核**：净增 2 行（第 20 行 + 变更记录行）+ 4 处原地替换（§3.2 标题 ∕ 纪律行 ∕ §7 D-P11 ∕ §12 行）⇒ **≈ +3**（自原 ≈ +6 收紧——原值含余量）。
- **#3**：上文 `:185`（#17 `SETTINGS.md` 靶点行）收正——并入 **§1 卡清单 Agent 行（`SETTINGS.md:16`）**：控件枚举随增 `autoThink`（新控件落地后该行陈旧；原地编辑、零净增）；Δ 维持 ≈ +3。
- **#7**：第 20 项增量描述明标「**既有载荷替换**」（`{text}` ⇒ `{scope, reason}`——纪律句「不改既有字段语义」之明文例外）+ 变更记录注明**兼容面 = 同批两端同发**（host + webview 同包发——无跨版本混跑面）。

**③ 到期项 ∕ 写域 ∕ 登记式（评审 #4 ∕ #5 ∕ #6）**

- **#4 · `_confirmDelete` 到期项 = 随本批落 ①**（`SETTINGS.md:441-444` 到期条件「`settings.js` 下次触碰」= 本批 #640 触发；父侧倾向在案；补登在册——原三链表 ∕ 边界块零提之缺随本条补齐）：
  落 ① = **保留门 + 同步注释**——`settings.js:43` 门体零动（零调用点复读在案：全 webview 删除入口均走 `_confirmSecretDelete`——`settings-providers.js:57/:68` ∕ `settings-tools.js:28/:46/:196` ∕ `input.js:127`；`_confirmDelete` 仅存定义）；`:42` 失实句收正（「provider rows — ruling exception」分句退场——provider 行已入确认门 ∕ 判入不可复得类〔裁定 A · `SETTINGS.md:427-428`〕）；`:44-47` 不可复得类枚举补 provider 行。
  落位判据 = `settings.js` 保留门在位（`smoke-settings.mjs:95` handler 断言照绿）∧ 注释失实短语零残留。
  受影响面随动：上文 `:70`（`settings.js` 行）变更列并入本 ①（Δ 含注释改写，净 ±0~2）；上文 `:77`（`test/smoke-settings.mjs` 行）——**该档此条零改**（#640 自身调用形随动 ±1 照旧）。
- **#5 · byte 级寄存器 = 显式延后 + 依据**：`thincoder-vscode/AGENTS.md`「Webview ↔ Extension Message Protocol」表（`:75-103`）= 消息名 ∕ 载荷 byte 级寄存器（`WEBVIEW-PROTOCOL.md:5` 声明在册）。处置 = **延后**——依据：① 本批写域 = `thincoder-vscode/{webview,src}/**` + `docs/vsc/**`（§1 口径行）；该表住产品树、非本批写域。② 其演化口径在册 = `WEBVIEW-PROTOCOL.md` §8.2 #1（`:349`）「仍住产品树（只读，零写入）→ 产品树降格后随批处置」。③ 机制面登记落点 = 协议档 §3.2 行 20（byte 形态变更已在册；寄存器只登记形态——同步随产品树降格批 ∕ 父侧另裁）。**披露**：寄存器现表未含 `providerError` 行（既有缺行、非本批引入——届盘实读）⇒ 同批更新须先补缺行，一并随延后。
- **#6 · 登记式补齐**：
  a) 上文 `:72`（`settings.css`）收正——**结论** = 本批不拆（+5 行 = 段标 span 单条样式；不改结构 ∕ 不增职责）；**触发阈值** = 450 行（本仓阈值先例）或**设置面样式族下次结构改动**（先到即拆）；**组边界**（三段 · 按现分节注释）= ① 面板骨架 + 通用件（面板框 ∕ 卡框 ∕ 字段 ∕ 按钮 ∕ 开关）② 卡面样式族（providers ∕ MCP ∕ consult ∕ agent 徽标 ∕ model-menu）③ first-run 面板段；**到期条件** = 阈值到达时 ∕ 下次结构改动时。
  同笔 `:78` 行靶点增「§3 增 `settings.css` 越线登记行（登记式）」——Δ ≈ +26 ⇒ **≈ +30**（+4 行级）。
  b) 上文 `:74`（`settings.mjs`）收正——**改引既有登记行**（`SETTINGS.md:449-451`：触发阈值 450 ∕ 下次结构改动，先到即拆）：本件净增 ≈ +15（#640 ≈ +14 + #17 +1 ⇒ 350 ⇒ ≈365）**不触发**（< 450；单助手增行 ∕ 零新职责——非该行「结构改动」所指）；登记行结论零变（「现 350」读数随实施届盘回填——`SETTINGS.md:449`）。

**④ 验收面补腿与例外（评审 #8 ∕ #10）**

- **#8 · #640 补两腿**（并入批件腿清单——上文 `:82` 行后位）：
  **⑧ 闭集外 scope**（如 `"bogus"`）⇒ **零段标**（段标节点不落——同 `panel` 支；`reason` 仍走表外原样直传）；
  **⑨ 空 reason**（`""`——缺 `undefined` 同判）⇒ **零节点**（banner ∕ 文本节点不落；沿 `:56`「空 ⇒ 零节点」与桌面同判——桌面 `views/settings.mjs:89` `reasonWord`：缺 ∕ 空 ⇒ `null`；`:256` `noticeNode`：`text === null` ⇒ 零节点）。两腿均可达（fake DOM 直驱 `showSettingsError`）⇒ 不适用「不可达」写法。
- **#10 · 英文四串残留**（`No MCP server named "<name>"` ×2 ∕ `MCP reconnect <name> failed: <msg>` ∕ 编辑保存 `err` 透传）：
  **需求侧差口登记语**（本档在册；需求档落笔 = 父侧笔面如裁）：四串未词化——本批词化面 = `reason` 码路径（表内出词）；四串 = 站内原生英文文案（无码——表外原样直传通道）。
  **验收面例外注**（并入上文 `:85` 两端同形腿）：人工对读覆盖 = 段标 + 词化码路径；四串所在站以原样英文呈现 = 已知例外（登记在册）。
  **关系句**：判据「词化码」适用面 = 可判码者（`reason`）；四串之词化 ∕ 保留 = 后续扩表 ∕ 父侧裁（本批披露 + 登记，零新增实施面）。

**⑤ 方法论项（评审 #9——设计档后置落笔依据）**

后置落笔（设计档更新随实施波）适用依据（补 `:33` 口径行）：① **靶句已列**——各节受影响文件表逐条给出落点 + Δ（设计内容本体 = 本 §2 自持在册；落笔 = 设计面向权威档移居）；② **先例**——本会话同制（`docs/batches/2026-09-29-tools-carryover.md` §1 U0 已裁「设计档落笔 = 随实施轮」）；协议档 changelog 亦多为实现轮落笔（`WEBVIEW-PROTOCOL.md:646` ∕ `:662` ∕ `:669`）；③ **落点均为「实施后现态」描述**（§2.15 新节 ∕ §2.3 增句——设计轮先落 = 与盘面不符 ∕ 须二次重写）；④ 本批口径 = 设计档正式条款零触（U0 = 随实施波）。⇒ 口径自证：非「后置不落」，= 「落点已定、笔随实施」。

**⑥ 读回核实（D6）**：本块 append 落盘后回读核（块头 ∕ 表体 6 行 ∕ 结论行 ∕ 各条）；本块所引坐标 = 2026-09-29 届盘实读——`WEBVIEW-PROTOCOL.md:5`（寄存器声明行 · 复读核定——评审所引一致）`:103` ∕ `:325` ∕ `:349` ∕ `:414`；`SETTINGS.md:16` ∕ `:427-428` ∕ `:441-444` ∕ `:449-451`；`thincoder-vscode/AGENTS.md:75-103`；`webview/settings.js:42-48`；`test/smoke-settings.mjs:95`；桌面判 `views/settings.mjs:89` ∕ `:256`。

**§2 微勘误 + 披露补（同轮 · 读回后 · eng-designer）**

- **① 射程收窄（#4 条内句）**：「全 webview 删除入口均走 `_confirmSecretDelete`」指**删除确认族（入口册六项）**——即上行所列全部 6 处调用点；会话删除确认 ∕ AUTO 启用确认两处为另族自持弹框（`session-bar.js` ∕ `mode-buttons.js`——`SETTINGS.md:423-426` 在册），不在该句射程。**「`_confirmDelete` 零调用点」主判不变。**
- **② 披露补（#5 寄存器）**：寄存器表另见同族滞后行——`thincoder-vscode/AGENTS.md:92` 记 `providerInfo`（**已退场**；现体 = `providerStatus`——`thincoder-vscode/src/extension/settings.mjs:299` 发 `providerStatus`；旧档 `thincoder-vscode/docs/_archive/design/WEBVIEW.md:400` 有「已退场——现体 = `providerStatus`」注）。与该表未含 `providerError` 行同属寄存器滞后（非本批引入）——随 #5 延后处置与产品树降格批一并。
- **③ 观察（非阻断 · 已覆盖）**：`WEBVIEW-PROTOCOL.md:414`（§12 `providerError` 行）③ 列现读 `webview/chat-messages.js:147`，实际 `case` 现位 = `:152`（届盘实读）——已由 #640 靶点句「②③ 列坐标随实现轮 emit 重出」覆盖，无需另立。

**§2 修正轮落地（评审轮 2 · 发现 1–6 · eng-designer · 2026-09-29）**

> 口径：承 §3 轮次 2 发现表——六条全数裁定接受，逐号落地（零漏号）；零新语义（只落评审所请）；产品码 ∕ 需求档 ∕ desktop ∕ render-core 零触；行文沿 append-only——上文各块零改，凡本块所指「收正」处以本块为准。设计档笔：`WEBVIEW-INPUT.md` §1 ∕ §2 本刻同笔收正（在批写域内——父侧派单）；其余设计档正式条款零触（U0 = 随实施波；靶点以本块为准）。

**① 门清单两档对齐（评审 #1——届盘复读：批档侧为真；处置 = `SETTINGS.md` 靶点并入）**

- 届盘实读（grep 全 webview）：`_confirmSecretDelete` 调用点 = **6 处**——`webview/settings-providers.js:57`（`deleteProviderKey`）· `:68`（`removeProvider`）· `webview/settings-tools.js:28`（`deleteEmbedKey`）· `:46`（`deleteWebsearchKey`）· `:196`（`deleteMcpServer`）· **`webview/input.js:127`**（`composerHooks.confirmRemoveProvider = (onConfirm) => window._confirmSecretDelete(null, onConfirm)`——入口 6 门调用点，经 hook）。⇒ 批档 `:261` 清单为**真**（6 点 ↔ 入口册六项 1:1 成立）；`_confirmDelete(` 调用点 = 0（仅定义 `settings.js:43`）复核一致。
- 不一致侧 = `SETTINGS.md:298`「`removeProvider` 域内发射 2 处（… · `model-picker.js:25`）」——`model-picker.js:25` **已失据**：该档上提批后实读 **16 行**；入口 6 发射位现 = 核 `thincoder-render-core/composer/model-menu.mjs:304`（footer `onClick: () => hooks.confirmRemoveProvider?.(() => post("removeProvider"))`）+ VSC 桥 `webview/input.js:34`（OUT 表逐字面）。
- 处置：**`SETTINGS.md` 靶点（上文 `:78` 行）增「§2.10 域 ∕ 清单收正」**，收正要件 = ⓐ 门调用点清单补 `input.js:127`（入口 6——经 hook 链路注）；ⓑ 入口 6 段（`:268-289`）与发射位坐标按盘重述（`model-picker.js:25` ∕ `:26` 系坐标退场 ⇒ 核 `model-menu.mjs:304` + 桥 `input.js:34`；footer `onClick` 现式 = hook 注入）；ⓒ `:297-299` 域 ∕ 计数 ∕ 映射句按现盘重述。
- 连带事实（届盘 · 供 ⓒ 参照）：W17-17 所在存量测试族已随 **2026-09-28 全清重置**退役（`thincoder-vscode/test/files.mjs:4`；`thincoder-vscode/**` 现零 `*.test.mjs`）——「fail-closed 扫描域」关切落于文本面与测试面重建时；`SETTINGS.md:291-295` 测试面引用句滞后随该档下次触碰处置（本批不扩）。

**② `input.js` 坐标 ∕ 行数对账（评审 #2——批档侧为真；不一致侧 = `WEBVIEW-INPUT.md`，本刻同笔收正）**

- 届盘实读：`thincoder-vscode/webview/input.js` = **127 行**——批档 `:113` ∕ `:144` 之 127 为真；批档 `:98` 回合钩区间 `:95-102`（`:101` 调用）与 `:99`（`_llmCalls` 归零）逐处核准（均真）。
- `WEBVIEW-INPUT.md` 收正清单（旧 ⇒ 新；全数届盘实读；`input.js`（127 行）· `send.js`（12 行）· `autocomplete.js`（15 行）= 上提批搬核后接线档）：
  - `:15` C-B2-1 落点：`input.js:42` ∕ `:77` ∕ `autocomplete.js:99` ⇒ 核 `composer/panel.mjs:126-132`（组合守卫 `:128`）· `:161-170`（组合守卫 `:163`）· 核 `composer/atmenu.mjs:119-129`（组合守卫 `:121`）。
  - `:16` C-B2-2 规则句：「`input.js` 不发送」⇒「composer 核件不发送」；「`input.js` 的 keydown 先于 `autocomplete.js` 注册」⇒「composer 核件的 keydown 先于 @ 面（atmenu）注册」（右列核坐标复读一致，零改）。
  - `:17` C-B2-3：规则句收正为现态（`isOpen()` = `display !== "none"` 单判据；元素恒在——缺元素支随工厂化退场）；落点 `input.js:135-138` ⇒ 核 `composer/atmenu.mjs:86-88`；让位调用点补 `panel.mjs:169` ∕ `:180`。
  - `:18` C-B2-5 落点：「`webview/send.js`（守卫出口）」⇒ 核 `composer/panel.mjs` `send()`（`:291-293`）。
  - `:19` C-B2-6：「`send.js:18`」⇒ 核 `composer/panel.mjs:287`（空输入静默出口）。
  - `:37` C-B2-6 ⑤落点：「`webview/send.js`（出口分流）」⇒ 核 `composer/panel.mjs` `send()`。
  - `:55`：「`input.js` 分支不处理」⇒「核件键位面不处理」。
  - `:63-66` §1.1：`input.js:54-61` ∕ `:63-67` ∕ `:69-74` ∕ `:40-46` ⇒ 核 `panel.mjs:140-147` ∕ `:149-153` ∕ `:155-160` ∕ `:126-132`。
  - `:70` §2：「`input.js:92-110`」⇒ 核 `panel.mjs:178-196`（顺序注 `:172-177`）。
  - 变更记录：+1 行（本刻落笔）。
- 线划 = 「已失据者收正（行为 ∕ 坐标不在该档者）；同名转口存续者不动」（如 `loading.js` `applyBusyLock` 转口名在位——零改）。**契约点 ∕ 判别式零变**。

**③ #640 腿⑦ 源锁写窄（评审 #3）**

- 上文 `:82` 腿⑦ 收正为：「**⑦ 源锁（写窄）**：`showSettingsError` 体内**零 `setTimeout`**（banner 移除路径零定时器——不自散）；**注**：同档打开等待定时器（`settings.js:96-100`——250ms 回退，合法面）**不在锁域**。」
- 依据：同档 `requestAgentSettingsThen`（`settings.js:95-104`）合法保有 250ms 超时回退（`SETTINGS.md:40` 在册）——文件级 ∕ 渲染路径级 grep 写法会假红并诱导删合法回退 ⇒ 锁域收窄至移除路径。

**④ `_confirmDelete` 登记条落点（评审 #4）**

- `SETTINGS.md` 靶点（上文 `:78` 行）增并入：**「§3 `_confirmDelete` 登记条收正 ∕ 核销（到期条件达成）」**——先例 = 该档 `:427`「已消解」· `:432`「已核销」；处置 = 本批落 ① 后该条（`SETTINGS.md:441-444`）自「登记不修」改为收正 ∕ 核销陈述（到期条件「`settings.js` 下次触碰」已随本批达成 ∕ 执行）；变更记录行承担日期指向。
- 判据：落档后该条无「未履行的到期条件」读法（已核销 ∕ 已收正）。上文 `:262` 的 `smoke-settings.mjs:95` 落位判据届盘复读一致（断言行现文含 `window._confirmDelete`；该档实读 97 行）。

**⑤ §4 腿清单计数随列表收正（评审 #5）**

- 上文 `:213` 收正为：「腿清单：**#640 九腿**（编号清单 ①–⑨——⑧⑨ 为修正 ④ 所补）· **#642 三腿**（源锁 ∕ 行为腿 ∕ 真机腿；桌面对读 = 参考不计）· **#643 两腿**（grep 源锁 ∕ 行为腿；`node --check` = 语法闸不计）· **#17 四腿**（读链源锁 ∕ 写链行为腿 ∕ 渲染 ∕ 载荷腿 ∕ 真机腿；对位复读 = 参考不计）（见各节验收）。」
- 顺核：#640 七 ⇒ 九（收正）；#642 ∕ #643 复核一致（零改）；**#17 三 ⇒ 四**（真机腿同 #642 首例判——逐条判据条目计、参考对读 ∕ 复读不计）。

**⑥ §2.15 关系句（评审 #6）**

- `SETTINGS.md` 靶点（上文 `:78` 行 §2.15 计划）增：「§2.15 计划段并入关系句（逐字建议）：**『槽（`_lastFailure`）= 消息面瞬态状态，非面板字段状态——不触 §1 单一状态源原则（§1「DOM ∕ 模块变量不持独立状态」指 config 字段面）』**」；§1 本体不另动（关系句已在其落点消歧）。

**⑦ 读回核实（D6）**：`WEBVIEW-INPUT.md` 已改区块全数回读（L15-19 ∕ L37 ∕ L55 ∕ L63-66 ∕ L70 ∕ L241-242 逐处对照现盘坐标）；本块 append 落盘后回读核（块头 ∕ 六条 ∕ 清单）。

**披露（本刻）**

- (a) `WEBVIEW-INPUT.md` §5 决策记录 D-I3 ∕ D-I5 含同族旧名（`input.js` ∕ `send.js` ∕ `autocomplete`——决策语境、非坐标）——未动（评审射程 = §1 ∕ §2）；随该档下次触碰复核。
- (b) `input.js:127` 行末注释 `model-picker.js:26` 已失据（该档现 16 行）——产品码注释面（笔 = eng-coder）；建议实施轮随 #642 ∕ #643 同笔收正（零行为）。
- (c) `SETTINGS.md:291-295` 测试面引用句指向已退役存量测试（2026-09-28 全清重置）——非本批引入、非 #1 射程内核；随该档下次触碰 ∕ 测试面重建批处置。

**§2 设计档随动落地（V2 舱 #642 靶点 · eng-designer · 2026-09-29）**

- 承 §5 披露 2 与代码评审 🟡（`docs/vsc/design/WEBVIEW.md` §2 行面板区句 + 变更记录 1 行未落；上文 `:116` 载 ≈ +2）：本刻落笔——§2 行面板区句补**重置点 = 会话边界**（回合起点不清 ⇒ 回合后 🎯 ∕ task 存续 ∥ 会话切换 ∕ 载入经 `clearPanels()` 清 goal ∕ task 双侧；开合态不重置）+ 变更记录 1 行（740 ⇒ 742 · 净 +2）。**零新语义**（实现终态随动）。
- 实现逐处复读（本刻 · file:line）：`thincoder-vscode/webview/input.js:94-100`（钩零清；零 `clearPanels` 引用）∥ `thincoder-vscode/webview/chat-messages.js:123`（`clearMessages` 支清）∥ `thincoder-vscode/webview/panels.js:39-48`（清体零动、开合态不重置）。产品码 ∕ 需求档 ∕ 其余设计档零触；读回（D6）在案。

**§2 设计档落点（设计档笔 · eng-designer · 2026-09-29 · fix 轮）**

> 承派单（V1 舱 #139 上抛④「设计档未落 ∥ 笔权 = eng-designer」）：`SETTINGS.md` ∥ `WEBVIEW-PROTOCOL.md` 两档逐处落地（靶句 = 上文 §2 `:78` ∕ `:185` ∕ 修正轮 ⓐⓑⓒ ∕ §3 两登记 ∕ 变更记录）；产品码 ∕ 需求档 ∕ desktop ∕ render-core 零触；行宽纪律遵（>300 散文行折行）；坐标 = 实施后现盘（含 V2 舱位移与父侧裁定导出项）。**零新语义**。

**① 逐处表（file:line = 落点后现态）**

| # | 档 | 落点 | 变更 |
|---|---|---|---|
| 1 | `SETTINGS.md` | `:420-446`（§2.15 新节） | 失败面 S15：载荷 v2 `{scope, reason}` ∕ 段标+码表 ∕ 单槽 `_lastFailure` 驻留 ∕ 关=销账 ∕ 关系句 ∕ 九腿 + 机检面 |
| 2 | `SETTINGS.md` | `:16`（§1 Agent 行） | 控件枚举 + `autoThink` |
| 3 | `SETTINGS.md` | `:42-44`（§2.3） | autoThink 三链句（读 ∕ 写 ∕ 控件） |
| 4 | `SETTINGS.md` | `:166-169`（§2.10 本批后态） | 门调用点清单 6 处（补 `webview/input.js:125`——经 hook 链路）；定义位 `:44`；注释收正陈述（落 ① 已执行） |
| 5 | `SETTINGS.md` | `:275-277 ∕ :280 ∕ :290 ∕ :294`（§2.10 入口 6 段） | footer `onClick` = hook 注入；门位 = 桥 `input.js:125` + OUT 桥 `:33`；`settings.js` 两处坐标收正（`:49` ∕ `:50-57`）；实读段标「读数时点 = 落门前」 |
| 6 | `SETTINGS.md` | `:303-305 ∕ :309`（§2.10 判据域 ∕ 范围限制） | 显式名单 `model-picker.js` ⇒ `input.js`；发射 2 处 = `settings-providers.js:68` + 桥 `input.js:33` |
| 7 | `SETTINGS.md` | `:475-478`（§3） | `_confirmDelete` 登记条收正 ∕ 核销（到期条件达成） |
| 8 | `SETTINGS.md` | `:497-500`（§3 新增） | `settings.css` 越线登记行（385 行——本批不拆 ∕ 阈值 450 ∕ 三段组边界） |
| 9 | `SETTINGS.md` | `:483-484`（§3） | `settings.mjs` 读数回填 350 ⇒ 359 |
| 10 | `SETTINGS.md` | `:545-549`（变更记录） | 本批 1 条 |
| 11 | `WEBVIEW-PROTOCOL.md` | `:79 ∕ :104 ∕ :326` | §3.2 十九 ⇒ 二十项 + 纪律行「行 1–20」+ §7 D-P11 同改 |
| 12 | `WEBVIEW-PROTOCOL.md` | `:102`（§3.2 行 20 新增） | `providerError` 既有载荷替换（纪律句明文例外）+ 发射 ∕ 接收点 |
| 13 | `WEBVIEW-PROTOCOL.md` | `:415`（§12 行） | ②③ 列实施后实读重出（`settings.mjs:302` ∕ `chat-messages.js:154`）+ ⑤ 载荷 v2 注 |
| 14 | `WEBVIEW-PROTOCOL.md` | `:517-519`（变更记录） | 本批 1 条（兼容面 = 同批两端同发） |

**② 与实施终态一致（#640 ∥ #17）**：载荷 v2 `{scope, reason}` ∥ 单槽 `_lastFailure`（`settings.js:87`）∥ 7 站点统一助手（`settings.mjs:300-303`）∥ `settings.js` 190 行（内容口径）；#17 四件（`settings-agent.js:26-27 ∕ :123` ∥ `settings.mjs:42 ∕ :137` ∥ `settings-panel-write.mjs:80` ∥ 两语键 `:112`）——逐处在盘。

**③ 披露（逐条）**
- (a) `input.js` 门 ∕ 桥坐标按 **V2 舱后现盘**：`127 ⇒ 125`（门调用）· `34 ⇒ 33`（OUT 桥）——修正轮载 127 ∕ 34 为 V2 前读数。
- (b) `protocol-coverage` 坐标提取器（`test/protocol-coverage*.test.mjs`）随 **2026-09-28 测试面全清退役** ⇒ §12 ②③ 列以**人工实读**重出（非 `--emit`）；变更记录同注。
- (c) 机检读数（`node scripts/doc-check.mjs` · 本刻）：**本批两档贡献 0**（0 悬空 · 0 超宽——逐条归属核讫）；全树 = 悬空 **42** ∕ 行宽 **77**，全数落在域外档（core ∕ desktop ∕ render-core ∕ `WEBVIEW-INPUT.md` ∕ `WEBVIEW.md` ∕ `VSC-DEBT.md`）——树面闸态为跨批既存，非本批引入。
- (d) 域外观察（非本档射程，未动）：`WEBVIEW-INPUT.md:17 ∕ :242` 两路径锚悬空（`composer/panel.mjs` 短形——建议收正为全限定 `thincoder-render-core/composer/panel.mjs:169 ∕ :180`）+ `:242` 行宽 330；`SETTINGS.md` 余下遗留坐标（`:90` ∕ `:235` 邻域 ∕ `:263`——`settings.js` 位移所致）建议随该档下次触碰收。
- (e) 行数账（内容口径）：`SETTINGS.md` 578 ⇒ **623**；`WEBVIEW-PROTOCOL.md` 682 ⇒ **687**。

**④ 读回（D6）**：两档已改区块全数回读（§2.15 全节 ∕ §2.10 改区 ∕ §3 改区 ∕ 两档变更记录 ∕ §3.2 行 20 ∕ §12 行）；本块 append 后回读核。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（vsc-carryover · 四档在域：批档本体 + `WEBVIEW-PROTOCOL.md` ∕ `SETTINGS.md` ∕ `WEBVIEW-INPUT.md`）**

口径注：无项目标准档 ∕ 无文档地图（按 Project Guide + 各档自述归属判）；需求档 `requirements/WEBVIEW.md` ∕ 设计档 `WEBVIEW.md` ∕ 全部源码 = 评审域外 ⇒ 其行号与「实读」断言未核（载荷处已标 unverified）。批档所标 `SETTINGS.md` 578 ∕ `WEBVIEW-PROTOCOL.md` 682 与现盘一致（内容行口径）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Methodology | 🟡 | §2「6. 上抛项」（批档 `:221`–`:228`）读面仍作「父侧裁」待决，而 §1 U1–U6（`:19`–`:25`，2026-09-29 21:10）已逐条裁定且 1:1 对应（①↔U1 会话载入基线不纳入 ∕ ②↔U2 需求档行并入 #654 ∕ ③↔U3 P2-7 收正「单槽待显」∕ ④↔U4 render-core 注释登记下轮 ∕ ⑤↔U5 词值照拟 ∕ ⑥↔U6 到期事件随动重登记）；仅 #17 一条带「已消解」注（`:228`）。状态行「上抛六项」（`:28`）同读作未决 | 按 §2 既有勘误块式样追加一条裁定回填（①–⑥ ↔ U1–U6 逐条对号），状态行「六项」口径同步收正为已裁/零待裁 |
| 2 | Doc ownership | 🟡 | #640 对 `WEBVIEW-PROTOCOL.md` 的靶点（`:79`）只列 §3.2 计数/列表 + §12 行 + 变更记录；该档自有的另两处同源计数未列——§7 D-P11「十九项」（`WEBVIEW-PROTOCOL.md:325`）与 §3.2 纪律行「行 1–19」（`:103`）。本档 D3「计数与列表同改」先例逐次把 D-P11 列入同笔（`:672`「§7 D-P11 计数 十四项 → 十五项（与 §3.2 标题同轮对齐）」· `:677`「§7 D-P11 计数同改」）；漏列 ⇒ 落档后文内自相矛盾（标题「二十项」∥ D-P11「十九项」∥「行 1–19」） | 靶点行补入 §7 D-P11 与 §3.2 纪律行两处计数同步，并按之复核 +6 行预算 |
| 3 | Doc ownership | 🟡 | #17 的 `SETTINGS.md` 靶点（`:185`）只含 §2.3；未含 §1 卡清单的 Agent 行（`SETTINGS.md:16`——该行枚举本卡控件「maxTurns…verifyGuard + Subagent models」）。新控件 `#ag-autothink`（`:167`）落地后该行为陈旧清单 | 把 §1 Agent 行并入 #17 的文档靶点（或写明该行非活清单的判定依据） |
| 4 | Requirements | 🟡 | #640 触碰 `webview/settings.js`（`:49` ∕ 受影响表 `:70`）与 `test/smoke-settings.mjs`（`:77`），正落在 `SETTINGS.md` §3 已登记到期项的触发面上：「直通门 `_confirmDelete` 零调用点 + `settings.js` 注释失实」（`SETTINGS.md:441`–`:444`，到期条件 =「`settings.js` 下次触碰（届时按 ① 执行）」；暂缓理由明列 `test/smoke-settings.mjs:95` 断言）。本批对其它到期项（P2-3 ∕ P2-4，`:200`）逐条登记，该条在「边界 ∕ 不做」（`:216`–`:219`）与三链表中零提 | 在该条的到期处置上二择一并落文：随本批落 ① 首选修法，或显式重登记（给由 + 新到期条件） |
| 5 | Doc ownership | 🟡 | #640 改的是既有载荷的 byte 级形态（`{text}` → `{scope, reason}`，`:54`），而 `WEBVIEW-PROTOCOL.md:5` 声明「消息名 / 载荷的 byte 级维护寄存器 = `thincoder-vscode/AGENTS.md`」（§8.2 登记其仍在产品树——`:349`）；三张受影响文件表与 §5 边界均未提该寄存器（寄存器现值 = `unverified`，域外） | 受影响文件面补登该寄存器并给处置（同批更新 ∕ 显式延后 + 依据）；若判定其不在本批写域，写明口径来源 |
| 6 | File-size | 🟡 | (a) `settings.css` 379 行（`:72`）越 300 顾问线、增量后 ≈384——只记「免拆」，未给触发阈值 ∕ 组边界 ∕ 到期条件，而本仓对越线档惯例为登记式复核（`SETTINGS.md:433`–`:436`、`:449`–`:451` 两例：结论 + 触发阈值 + 组边界 + 到期条件）；(b) `settings.mjs` 350 行（`:74`）写「拆分预案不在本件（下一结构轮判）」，与该档已登记拆分行（`SETTINGS.md:449`–`:451`：触发阈值 450 ∕ 下次结构改动，先到即拆）读作分歧 | 两处按登记式补齐：settings.css 给触发阈值与到期条件（或明示免拆判据）；settings.mjs 改为引用既有登记行并说明本件增量不触发的依据 |
| 7 | Doc ownership | 🔵 | §3.2 纪律句（`WEBVIEW-PROTOCOL.md:103`）以「只增不改（…不改既有字段语义）」起头、以「新增 ∕ 变更一律入本节登记表」收束；而 #640 载荷 v2 是既有字段的**替换**（`text` 去、`{scope, reason}` 立），靶点只写「增第 20 项」（`:79`）——登记行不标「替换」时，纪律句与行文留歧义 | 第 20 项的增量描述明确标为既有载荷替换（并在变更记录注明兼容面 = 同批两端同发） |
| 8 | Acceptance | 🔵 | #640 验收腿（`:82`）未盖两条已定规则的分支：`:55`「闭集外 ⇒ 零段标」（腿 ③ 只测 `scope:"panel"`）与 `:56`「reason 空 ⇒ 零节点」 | 补两条腿或并入 ③；若认定不可达，写明不可达依据 |
| 9 | Methodology | 🔵 | 设计声明「设计档更新随实施波落（靶句已列）」（`:33`），与 Project Guide（AGENTS.md）「Discussion → docs：设计决策即刻落档，不得后置」存在口径张力（本仓两式皆有先例：设计轮落笔 ∕ 实施轮落笔） | 本节写明该后置的适用依据（先例 ∕ 靶句已列），或改为设计轮落笔，使口径自证 |
| 10 | Requirements | 🔵 | 「边界 ∕ 不做」（`:218`）把「VSC 本地英文串词化（`No MCP server named…` 四串）」记为披露项，而本批判据含「词化码」（`:85` 引判据原文）——该残留未进上抛、未在验收面注明在外；两端人工对读时该差口无登记语（需求档原文 = `unverified`，域外） | 把该残留登记为需求侧差口（或在验收面注明例外），与「词化码」判据的关系一句话交代 |

**发现计数：🔴 0 ∕ 🟡 6 ∕ 🔵 4（共 10）**

VERDICT: pass

### 轮次 2（评审子代理）

**设计评审（轮次 2 · vsc-carryover · 四档在域：批档本体 + `WEBVIEW-PROTOCOL.md` ∕ `SETTINGS.md` ∕ `WEBVIEW-INPUT.md`）**

口径注：无项目标准档 ∕ 无文档地图（按 Project Guide + 各档自述归属判，两项判据降级）；域外（源码 ∕ 需求档 ∕ desktop ∕ render-core ∕ `WEBVIEW.md`）断言未核 = `unverified`。轮次 1 十条（🔴 0 ∕ 🟡 6 ∕ 🔵 4）已在 §2 修正轮块逐条落地（①–⑥ ↔ U1–U6 对号已核）。行数标注复核：`SETTINGS.md` 末行 578 ✓；`WEBVIEW-PROTOCOL.md` 末内容行 682（683 为空行）✓——两处与批档标注一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc ownership | 🟡 | 删除确认门调用点清单与 `SETTINGS.md` §2.10 不符：批档 `:261` 列「全 webview 删除入口均走 `_confirmSecretDelete`……`input.js:127`」（并自称 = 入口册六项 1:1），而 `SETTINGS.md:297`–`:299` 的判据域 = `settings*.js`（8 档）∪ `model-picker.js`（9 档）、入口 6 载体 ∕ 发射位 = `webview/model-picker.js:25`——两档不能两立：`input.js:127` 若为真 ⇒ W17-17 fail-closed 扫描域漏一档；若为误记 ⇒ #4 落① 的「零调用点复读」证据链错一处 | 届盘复读两侧坐标并把两侧对齐：真 ⇒ `SETTINGS.md` 靶点并入 §2.10 域 ∕ 清单收正；误 ⇒ 批档清单收正（并核入口 6 全链） |
| 2 | File-size | 🟡 | `input.js` 现读标注与在域文档冲突：批档 `:113` ∕ `:144` 标 **127** 行，`WEBVIEW-INPUT.md:17` 引 `input.js:135-138`——127 行文件不可能含 135–138 行，二者必有一误；另 `WEBVIEW-INPUT.md:70` 的 ↑/↓ 判定区间（`:92-110`）与批档 `:98` 的回合钩区间（`:95-102`）互相包含（同一行段不能两事）——同族坐标可疑 | 按盘重锚该档坐标（本批两次触碰该档）：以 127 为准 ⇒ 同笔收正 `WEBVIEW-INPUT.md` §1 ∕ §2；反之 ⇒ 改批档行数 ∕ Δ 基线 |
| 3 | Acceptance | 🟡 | #640 腿⑦ 源锁写「`showSettingsError` ∕ **渲染路径**零 `setTimeout`（不自散）」（`:82`）——`settings.js` 同档合法保有打开等待器的 250 ms 超时回退（`SETTINGS.md:40` ∕ §2.8 `settings.js:78-100`）；按文件级 ∕ 渲染路径级 grep 落腿 ⇒ 假红，且诱导删合法回退定时器 | 锁写窄为「banner 移除路径零定时器」（如 `showSettingsError` 体内零 `setTimeout`），并注明打开等待定时器不在锁域 |
| 4 | Doc ownership | 🔵 | 本批落①（批档 `:260`–`:261`）履行的正是 `SETTINGS.md:441`–`:444` 登记条的到期条件（「`settings.js` 下次触碰（届时按 ① 执行）」），但该档靶点清单（`:78` ∕ 修正 ⑥a `:267`）只列 §2.15 新节 + §3 settings.css 登记行 + 变更记录——该条自身的核销 ∕ 收正未列（先例：`:427`「已消解」· `:432`「已核销」） | 靶点并入「§3 该登记条收正 ∕ 核销（到期条件达成）」；若判由变更记录行承担，则在该行写明 |
| 5 | Methodology | 🔵 | 腿清单计数与列表失同步：§4 `:213` 仍「#640 七腿」，而修正 ④（`:272`）已在 `:82` 后位补 ⑧⑨ ⇒ 实为九腿（同文档内计数与列表不同改——与 #2 修正所引 D3 口径相抵） | `:213` 计数随列表收正为九腿（并顺核其余三条计数与实际腿数一致） |
| 6 | Doc ownership | 🔵 | 新机制在 `webview/settings.js` 引入模块级槽 `_lastFailure`（批档 `:60`），而 `SETTINGS.md:11` 明文「单一状态源 = config.json（DOM ∕ 模块变量不持独立状态）」——§2.15 计划段（「驻留 ∕ 关面板槽」）未写与 §1 的关系句，后续读者可能按 §1 判其违例 | §2.15 补关系句：槽 = 消息面瞬态状态，非面板字段状态（不触 §1 单一状态源原则）∥ §1 括注随动 |

**发现计数：🔴 0 ∕ 🟡 3 ∕ 🔵 3（共 6）**

VERDICT: pass

## §4 用户批准（主 agent）

**批准（代签）· 2026-09-29 21:37**——依据 = 用户 13:52 ∕ 17:02 全权（代点火 + 代批 + 代签）。

- **评审状态**：**评审通过**（§3 两轮——轮 1 十条 + 轮 2 六条全数落地复核成立；零 🔴）。
- **批准范围** = §2 设计（#640 载荷 v2 + 驻留 ∥ #642 复位点迁移 ∥ #643 死计数清 ∥ #17 autoThink）+ 轮 2 收口修正（门清单定谳 = `input.js:127` 为真 ∥ `WEBVIEW-INPUT.md` 十处重锚 ∥ 腿⑦ 写窄 ∥ 登记条核销靶点 ∥ 腿清单 9 ∕ 3 ∕ 2 ∕ 4 ∥ §2.15 关系句）。
- **实施切分** = 双舱：**V1**（#640 + #17——设置面）∥ **V2**（#642 + #643——webview 面）；产品文本面随动 = `input.js:127` 行末注释收正（修正轮披露 b）。
- **验收** = 腿清单（#640 九腿 ∥ #642 三腿 ∥ #643 两腿 ∥ #17 四腿）+ 批内件直跑 ∥ doc-check 复核。

## §5 实施记录（eng-coder）
**状态行**：实施完成（V1 舱（#640 + #17）· 终态 clean（审计 1 轮 CLEAN + fix round 1 ∥ 代码评审 1 轮 pass）· 2026-09-29）



**V2 舱实施记录（#642 ∥ #643 · 2026-09-29 · eng-coder）**

**交付面** = V2 舱（VSC webview 面）；#640 ∕ #17（V1 舱）∥ desktop ∥ render-core ∥ 需求档零触。逐处表（file:line = 现文口径）：

| # | 条目 | file:line | 变更 | 类 |
|---|---|---|---|---|
| 1 | #642 | `webview/input.js:15-16` | 删 `import { clearPanels } from "./panels.js"`（panels.js import 全清） | 码 |
| 2 | #642 | `webview/input.js:94-100` | 删钩体 `if (!S._suspended) clearPanels()`；钩注随动收正（`:95-96`——`clearPanels` 字面零残留） | 码 |
| 3 | #642 | `webview/chat-messages.js:21` | import 面补 `clearPanels` 名 | 码 |
| 4 | #642 | `webview/chat-messages.js:123` | `clearMessages` 支加 `clearPanels()`（清先于 `:127 renderStatusBar()`——徽标不残留） | 码 |
| 5 | #642 | `webview/panels.js:39-48` | `clearPanels()` 体零动；头注改判「会话边界重置」（开合态不重置 = 构树重挂不丢态） | 注 |
| 6 | #643 | `webview/state.js:101`（删行位） | 删 `_llmCalls` 槽 + 行注 | 码 |
| 7 | #643 | `webview/input.js:99`（删行位） | 删 `S._llmCalls = 0` | 码 |
| 8 | #643 | `webview/status-bar.js:111`（删行位） | 删 `S._llmCalls++`；头注 `:108`「count the LLM call」半句随动删 | 码 |
| 9 | 披露 b | `webview/input.js:125` | 行末注释收正：`model-picker.js:26`（失据）⇒ 核 `model-menu.mjs:304`（footer 出口——F-W17 确认门）——零行为 | 注 |

**批内件**：`docs/batches/2026-09-29-vsc-carryover-webview.test.mjs`（终位名）——**直写终位被写入闸拒**（跨批批档保护判该名异批）⇒ 现暂存 `.thincoder/tmp/2026-09-29-vsc-carryover-webview.test.mjs`（220 行 · 五腿：C1 ∥ C2 ∥ C3（#642）∥ D1 ∥ D2（#643））；终位 copy = 父侧（#545 先例；两处相对 import 同深、均可跑）。

**读数**：
- 批件直跑（`node --test .thincoder/tmp/2026-09-29-vsc-carryover-webview.test.mjs`）⇒ **5/5 绿**（C1 源锁 ∕ C2 回合起点存续 ∕ C3 会话边界清 ∥ D1 grep 源锁 ∕ D2 行为腿）。
- `node --check`：六档全绿（五产品档 + 批件）。
- 行数账：`input.js` 127 ⇒ 125 ∥ `chat-messages.js` 262 ⇒ 263 ∥ `panels.js` 126 ⇒ 128（+2 全注释）∥ `state.js` 139 ⇒ 138 ∥ `status-bar.js` 134 ⇒ 133。
- grep：`_llmCalls` 于 `thincoder-vscode/{webview,src,test}/**` **零命中**（旧 = 3）；`clearPanels` 余引 = `chat-messages.js:21 ∕ :123` + `panels.js:39`（定义）+ `state.js:84`（注释）——`input.js` 零引（含注释面）。
- 判别性（`git diff` 逐行复核）：旧 = `input.js` 含调用 ∕ `clearMessages` 支无调用 ∕ 三档含 `_llmCalls` ⇒ 五腿对旧态必红。
- 读回（D6）：五档变更区 + 批件全文回读在案；`panel-session.mjs:147`（`clearMessages` 发射单源、先于 `:151 sendHistoryPage`）复核成立。

**审计 ∕ 评审轮次与终态**：
- 内部探索发散审计（explore · 只读）＝ **clean**——判据全覆盖、零越界、零残留、判别性成立；另列记录面 2 项（§5 本块 ∥ `WEBVIEW.md` 设计档笔）。
- 内部代码评审（advisor · code）＝ **pass（零 🔴）**：1 🟡（`docs/vsc/design/WEBVIEW.md` §2 行面板区句 + 变更记录 1 行未落——设计档笔 = eng-designer ∕ 父侧路由，非阻塞）+ 2 🔵（记录面登记；`input.js:95` 注释内 `send.js:62-63,69,72` 历史坐标失据——披露 b 射程外，留观察）。
- **修正轮 = 0**（无阻塞项入修）；终态 = **converged**。

**披露 ∕ 上抛（父侧）**：
1. 批件终位 copy（现 `.thincoder/tmp/`——写闸拒异批名；终位 copy 待父侧）。
2. 设计档 `WEBVIEW.md` §2 靶点待笔（批档 §2 `:116` 载 ≈ +2——非本舱射程，上抛）。
3. 观察（非本舱）：`input.js:95` ∕ `:121` 同族历史坐标（`send.js` ∕ `model-picker.js` 系）仍失据——本批按披露 b 仅收正 `:125`；render-core 注释三处（`panel.mjs:24 ∕ :299 ∕ :328`）= U4 登记在册（#662）。

**状态行**：实施完成（V1 舱：#640 + #17 · 终态 clean/converged——分歧审计 1 轮 CLEAN（1 条非四类观察 ⇒ fix round 1 已处置）；代码评审 1 轮 = pass（🔴0 · 🟡2 · 🔵6——全非阻断，无 must-fix））

### V1 舱（设置面）实施记录 · eng-coder · 2026-09-29

**范围** = §2 #640（设置面失败面 S15 收正：载荷 v2 + 段标/词化码 + 不自散 + 关面板不丢）∥ #17（autoThink 档位开关 四件），含两轮修正块对 #640 ∥ #17 的收正（腿清单 9 腿 ∕ 腿⑦写窄 ∕ `_confirmDelete` 落①）。产品码 = 11 档（下表单源）+ 批件 1 档（暂存）；desktop ∥ render-core ∥ 需求档 ∥ V2 面（#642/#643 文件）零触。

**（1）落点表（file:line = 终态；行数 = 内容行）**

| 条目 | 文件（终态行数） | 落点 | 改动 | Δ |
|---|---|---|---|---|
| #640 | `thincoder-vscode/webview/settings.js`（138 ⇒ **190**） | `:62-119` ∕ `:163-172` ∕ `:188-189` | `SCOPE_WORD`（六段 ↦ 既有 `settings.*Section` 词键）+ `REASON_WORD` v1（`mtime-conflict`）+ `reasonWord`（表内出词 ∕ 表外直传 ∕ 空 ⇒ null）+ 单槽 `_lastFailure` + `renderSettingsError`（单实例 banner ∕ 段标+文本两子节点 ∕ `data-scope` ∕ 零自散）+ `showSettingsError(scope, reason)` 重写；`closeSettings()` 清槽 + 卸 banner；`buildSettings()` 尾补渲 | +52 |
| #640 | 同档 `:42-48` | 修正①（评审 #4 到期项落①） | `_confirmDelete` 保留门零动 + `:42` 失实句收正（「provider rows — ruling exception」退场）+ `:45-47` 不可复得类枚举补 provider 行 | 含上 |
| #640 | `thincoder-vscode/webview/chat-messages.js`（264） | `:153-156` | `providerError` 支改传 `(m.scope, m.reason)` + 一行载荷 v2 注 | ±2 |
| #640 | `thincoder-vscode/webview/settings.css`（385） | `:278-282` | 段标样式 `.settings-error-banner .settings-error-scope` 一条 | +6 |
| #640 | `thincoder-vscode/locales/en.json:186` · `zh.json:186`（各 274） | 同笔两语 | `settings.reason.mtimeConflict`（值 = 桌面同值逐字：`Config changed elsewhere — reload before saving` ∕ `配置已在别处变更——请重载后再保存`） | +1 +1 |
| #640 | `thincoder-vscode/src/extension/settings.mjs`（350 ⇒ **359**） | `:12` ∕ `:297-303` | import `+CONFIG_CONFLICT_HINT` + `postProviderError(panel, scope, err)`（`err === CONFIG_CONFLICT_HINT` ⇒ `"mtime-conflict"`；其余原样；载荷构造单源） | +9 |
| #640 | `thincoder-vscode/src/extension/panel-mcp.mjs`（167） | `:129 ∕ :140 ∕ :151 ∕ :165` | 四站点改走助手（scope `mcp`）+ import 补名 | ±0 |
| #640 | `thincoder-vscode/src/extension/panel-messages-settings.mjs`（204） | `:59 ∕ :71 ∕ :84` | 三站点改走助手（scope `providers`）+ import 补名 | ±0 |
| #640 | `thincoder-vscode/test/smoke-settings.mjs`（97） | `:88` | 调用形随动 `showSettingsError("panel", "test error")` | ±0 |
| #17 | `thincoder-vscode/webview/settings-agent.js`（183 ⇒ **186**） | `:26-27` ∕ `:122-123` | `#ag-autothink` switch（verifyGuard 后位；两态 = `SS.agentSettings.autoThink` 驱动）+ 载荷 `autoThink: chk("ag-autothink")`（恒携布尔） | +3 |
| #17 | `thincoder-vscode/locales/en.json:112` · `zh.json:112` | 同笔两语 | `settings.agent.autoThink`（桌面同值逐字：`Auto-think (classify task difficulty per turn)` ∕ `自动思考（按回合分类任务难度）`） | +1 +1 |
| #17 | `thincoder-vscode/src/extension/settings-panel-write.mjs`（184） | `:80` | `saveAgentSettingsFromPanel` 增 autoThink 支（逐字 verifyGuard 式；显式布尔写） | +1 |
| #17 | `thincoder-vscode/src/extension/settings.mjs:137` | 读链补环 | `autoThink: s.autoThink,`（`loadAgentSettings:42` 原已在） | 含上 |
| 批件 | `.thincoder/tmp/2026-09-29-vsc-carryover-settings.test.mjs`（371 行 · 暂存） | 终位 = `docs/batches/2026-09-29-vsc-carryover-settings.test.mjs`（**父侧 copy 收位**——我席直写终位被批记录写门拒（文件名撞批档命名族），故按 §2「暂存 `.thincoder/tmp/` → 父侧 copy」先例落暂存位；两层深同形 ⇒ 两处可直跑） | #640 九腿 ①–⑨ + 扩展侧文本锁（L640-X）+ #17 三机驱腿（真机腿 = 父侧面） | 新增 |

**（2）验证读数（本机 · 2026-09-29 21:5x–22:0x 本地）**

- `node --test .thincoder/tmp/2026-09-29-vsc-carryover-settings.test.mjs` ⇒ **13/13 pass**（九腿 + L640-X + 三腿；0 fail）。
- `node test/smoke-settings.mjs`（cwd = `thincoder-vscode/`）⇒ `SMOKE-OK: settings panel split is behaviorally wired`。
- `node scripts/check-syntax.mjs` ⇒ `133 JS files OK`；`node --check` 改动 9 档（8 产品/测试 + 批件）⇒ 9/9 绿。
- 词值核（U5「照拟」）：两新键与桌面单源逐字对读一致（`thincoder-desktop/renderer/i18n-settings.mjs:33/:91` ∥ `i18n-views.mjs:170/:314`）。
- **not repo-suite verified — the parent-side closeout run is the only repo-suite run.**
- D6 读回：11 档逐处读回核（`settings.js` 全档；余档按改区）+ 批件读回（L17-② 收正形）+ 本 append 落盘后回读。

**（3）审计与评审轮次（内部）· 终态**

- **分歧审计（explore · 只读）1 轮**：四类偏差（PARTIAL ∕ SILENT-SIMPLIFICATION ∕ DOC-DRIFT ∕ OUT-OF-LIST）= **零**（逐条要点对读：载荷 v2 单源 ∕ 段名闭集 ∕ 词表 v1 ∕ 单槽四挂点 ∕ 7 站点 ∕ #17 四件——全在盘）；1 条非四类观察（L17-② 腿③ 判别性弱：false 之后测「缺席零动」同值假绿）⇒ **fix round 1** 已处置（先置 true 再缺席保存、期望 true；复跑 13/13）。
- **代码评审（advisor · code）1 轮**：**pass**（🔴0 · 🟡2 · 🔵6，全非阻断；零 must-fix ⇒ 未开 round 2）。🟡 = ① 面板 agent 保存路径未接失败面（下透明表 #1）② 批件 371 行 ∥ harness 复本；🔵 = 行数两处（已登记）· `chk` 回退窄窗 · 批件命名 · §5/§6 空（本条即补）· 两端同形对读口径。
- **终态 = clean（converged）**。

**（4）决策透明表（披露 ∕ 报告项 —— 父侧裁）**

| # | 事项 | 性质 | 本舱处置 | 去向 |
|---|---|---|---|---|
| 1 | 面板 agent 保存路径未接失败面：`panel-messages-settings.mjs:143` 丢弃 `saveAgentSettingsFromPanel` 返回的冲突串（`settings-panel-write.mjs:172` `conflictError`）⇒ agent 卡（含新 `#ag-autothink`）遇 mtime 冲突零 banner、盘面未变。设计射程 = **恰 7 站点**（明文枚举）⇒ 本舱不静默扩射程 | 评审 🟡#1 · 设计缺口 | 零改（守设计射程）+ 本条上抛 | 父侧二择一：① 接助手（一行级，射程 7⇒8 需回填设计）② 登记差口（同 #17 披露①式）；**真机腿措辞建议钉死到「渠道加/删 ∥ MCP 编辑保存」** |
| 2 | 批件 371 行 > 300 顾问线 + mini 假 DOM harness = `residuals-round2-vsc` 先例整块复本 | 评审 🟡#2 | 零改（沿先例；批件随批归档） | 终位收位时可抽共享 harness ∥ 注记「复本有意」 |
| 3 | `settings.mjs` 359 行 ∥ `settings.css` 385 行（>300 顾问线，<500 硬） | 评审 🔵#3/#4 | 照既有登记不重议（阈值 450 ∕ 下次结构改动，先到即拆） | 无动作 |
| 4 | `autoThink` 恒携布尔 + `chk` 缺元素回退 `false` ⇒ 窄窗（快照缺键 + 250ms 回退先发）可把盘上手改 `true` 显式覆写为 `false`；全部推送面恒携该键（`panel-settings-push.mjs:96/:103` ∥ `panel-messages.mjs:308`）⇒ 窗口极窄；与 verifyGuard 同形既有惯例 | 评审 🔵#5 | 零改（KD-VC-7 + 「逐字 verifyGuard 式」） | 父侧如需硬化：快照缺键 ⇒ 不发该字段（须与 verifyGuard 同笔，免单键分叉） |
| 5 | 批件暂存名 `…-vsc-carryover-settings.test.mjs`（V1 舱后缀）vs 设计靶名 `…-vsc-carryover.test.mjs`；V2 舱将再落一件 | 评审 🔵#6 · 记录面滞后 | 从派单名（V1 舱） | 父侧 copy 收位时定两件终名 + 同笔收正批档靶名行 |
| 6 | **设计档未落**：`SETTINGS.md`（§2.15 新节 ∕ §2.3 autoThink 句 ∕ §1 Agent 行 ∕ §2.10 域清单 ∕ §3 登记条核销）+ `WEBVIEW-PROTOCOL.md`（§3.2 第 20 项 + 纪律行 + §7 D-P11 + §12）——§2 明文「笔权 = eng-designer」；先例 = residuals-round2 §5「本席不改设计档」 | 已知未落项（非本舱偏差） | 零触设计档 | 父侧派设计面笔（靶句已在 §2） |
| 7 | 真机腿两件（#640：制造写冲突 ⇒ 段标+词句驻留、关面板重开仍见；#17：开关 ⇒ `config.json` 翻转 ∧ 重开读回 ∧ 开启后分类器生效） | 父侧面 | 本舱零真机面 | 父侧 |
| 8 | 两端同形对读口径：段名闭集 ∕ 词键**端内自持**（VSC `settings.*Section` ∥ 桌面 `settings.section.*`；桌面段集含 `model/models`、VSC 含 `consultAdvisor`）——同形 = **形状**同（闭集外 ∕ `panel` 零段标 · 表外直传 · 空零节点），非段名词逐字同 | 评审 🔵#8 · 对读口径 | 零改 | 父侧人工对读按「形状」核（防读假差） |
| 9 | 偶见 `thincoder-vscode/console.log('`（0 字节杂件）+ 并发他舱改动（V2 面 ∕ desktop ∕ 需求档父侧笔） | 审计观察 | 零触 | 只报（非本舱产物） |

**（5）边界**：产品码 = 上列 11 档；desktop ∥ render-core ∥ 需求档（`docs/vsc/requirements/**`）∥ V2 面（`webview/input.js ∕ panels.js ∥ state.js ∥ status-bar.js`）零触；判据谓词（遮罩 ∥ 扫描域）零改；#640 的 VSC 本地英文四串（`No MCP server named…` 等——站内原生文案）按 §2 修正④#10 = 表外原样直传通道，保持原样（已知例外在册）。

**（6）写后核（D6）**：11 档逐处读回（改区）＋ 批件读回（含 fix round 1 收正形）＋ 本 append 落盘后回读核。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）· 2026-09-29**

- **交付核验**：V1（#640+#17——`settings.js` 190 行 ∥ 7 站点统一助手 ∥ 单槽 `_lastFailure` ∥ i18n 两键）+ V2（#642+#643——九处）逐处抽核在盘；批内件两件亲跑 **13/13**（settings）∥ **5/5**（webview）——终位 `docs/batches/2026-09-29-vsc-carryover-{settings,webview}.test.mjs`。
- **文档面**：设计档两档随动落（`SETTINGS.md` 578⇒623 ∥ `WEBVIEW-PROTOCOL.md` 682⇒687——含门清单定谳：`input.js:125` 为真 ∥ `model-picker.js:25` 失据）；`WEBVIEW.md` 面板区句（#142）。机检：本批两档 0 悬空 ∥ 0 超宽。
- **真机腿（VSC 宿主面）**：两件（渠道加 ∕ 删保存失败面 ∥ MCP 编辑保存失败面）**未跑**——本席无 VS Code 宿主运行面 ⇒ **登记待用户面复验**（措辞钉死：渠道加/删 ∥ MCP 编辑保存）。
- **台账**：#640 ∥ #642 ∥ #643 ∥ #17 ∥ #634（S15 落面）→ 核销。
- **遗留**：7⇒8 差口（#675）∥ providers 读面缺口（#671）∥ vsc 两档坐标遗留（新立）。
- **状态**：本批收口。
