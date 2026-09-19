# 2026-09-18 · 模式联动批（#41 翻转重估 + #45 UI 联动）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `1efc90a2`；三包全绿含 T-V13 转绿 · plan 腿运行时实测成立）

### 1.1 批件（用户 2026-09-18 01:43 裁定「同批，现在做」）

| # | 条目 | 实况 |
|---|---|---|
| **#41** | 模式翻转族不重估装配钩子 | `/eng` · `/session` 切槽 · ACP 装载 · 核心 `eng` 工具——翻转后 ① 相位行静默 ② 无 E2 启动门槛（下次启动才重估）。**语义已裁（父侧）：拒翻（fail-closed，与入口门槛同语义）+ 明示原因**——语义边界由设计轮勘定并回报（台账 #41） |
| **#45** | 工具驱动的模式/参数变更不联动 UI | 用户 2026-09-18 01:41 报告：agent 经工具开工程模式 / plan 模式 ⇒ **VSC 前端显示不变**（CLI 未验）。父侧侦察（01:42）：① `eng` 工具**已有通知缝**——`configureEngMirror`（`thincoder-core/agent-tools/eng.mjs:17-23`，注释逐字「端装配层可覆盖为本端镜像写盘 / 面板提示；**缺省不覆盖 = no-op**——CLI 语义」）⇒ 候选缺口 = VSC 端未接该缝；② plan 面有推送先例——`onPlanMode`（`thincoder-vscode/src/extension/panel-callbacks.mjs:251` 推 webview；`panel-session.mjs:166` 会话加载推）——**用户路径推、agent 工具路径是否推未核实**；③ `settings` 工具驱动的参数变更联动面**未核** |

### 1.2 设计轮要做（核实 + 统一设计）

1. **两端核实**（只读）：VSC 端是否 `configureEngMirror`（接缝状态）· plan 工具是否走同一 setter / 回调 · `settings` 工具改动后的通知路径 · CLI 端显示面（TUI 是否有模式显示 + 是否需要联动）· #41 的四条翻转路径各自现状。
2. **统一通知链设计**：模式/参数变更 → 端显示（VSC webview / CLI TUI）的单一路径；#41 的「拒翻」语义落地（哪类翻转拒、明示什么、哪些内态翻转不受阻）。
3. **§2 任务书**（实施面 / 受影响文件表 / AC / 用例 / 报告格式）。

### 1.3 边界

- **不改**：VSC phase 2 统一本体（#21 边界的既有裁决）· 注入器判据序（#34 批在飞——同域串行）· 已裁定机制（单源化 / c1 / c2 / 豁免闸门）。
- **禁触**：`scripts/**` · 冻结批档 · `_archive/**` · 参照树 · 提示词面内容。
- 同域串行：`MANIFEST.md` 与 B 实施（id=35）同档 ⇒ 调度器排队，不手工避让。

### 1.4 台账

- **#41 / #45** → 本批；完成后一并核销。

### 1.5 父侧裁定（2026-09-18 02:15——对设计轮上报项 1–5 逐条 · 父侧直接执行 · 可 revert）

| 号 | 上报项 | 裁定 |
|---|---|---|
| 1 | FR11 与拒翻冲突 | **接受收正**：父侧已落 `docs/core/requirements/PORTABILITY.md:62`（无前提限定为「不要求已退役概念文件 / 产品流程文件」；仓根锚 = E2 既有前提） |
| 2 | plan 腿静态已接 / 运行时未验 | **验收轮必做**：实施交付前实测一次「agent 用 plan 工具 ⇒ VSC 面板切换」；若实测确不变 ⇒ 断点在运行时，另立条目（不阻塞本批） |
| 3 | `/session` 判据点前置于 `switchToSlot` | **确认**（半态论证成立：判据落其后会留下「指针已切、会话未换」⇒ 下次保存跨槽覆盖） |
| 4 | `MANIFEST.md` 同档并飞 | **无冻结**：#34 评审（id=38）已 PASS、凭证已签发；#34 fix 轮（id=41）与本批串行由调度器保证（两轮改动面不重叠：§2.3 行补 / §2.6 条 3 vs §2.8 新增） |
| 5 | 需求侧无条目 | **待补（父侧债务已上账）**：#41 → `ENGINEERING-MODE-V2-SPEC-MANIFEST.md` 补条目（随实施轮前）；#45 → 功能板条目（落点父侧勘定后补） |

## §2 批次任务与设计修订（eng-designer）

**轮次**：initial（2026-09-18 02:0x 落笔 · eng-designer）。**设计落点**（机制条文已落档，本段 = 任务书指针）：

| 面 | 设计档 | 落点 |
|---|---|---|
| #41 拒翻语义 + 判据单源 | `docs/core/design/MANIFEST.md` | **§2.8**（F1 判据单源 / F2 拒翻判据表 / F3 明示面 / F4 ACP / F5 边界 / F6 FR11 登记）；§2.2 接口表新导出 `resolveEngineeringManifest`；§2.4 KD-M1-20/21；§3.1 AC-19/AC-20；§3.2 T37–T40 |
| #45 VSC 通知链 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | **§3.3**（核实表 + 单一路径机制图 + 判据两条）——**§12 对表零改**（零新增消息类型） |
| #45 CLI 半 | `docs/cli/design/TUI.md` | **§7.3**（banner 每帧 recompute 契约 + 负向锁）——CLI 端**零改动** |

### 2.1 核实结论表（逐项实读——「已接 / 未接 / 未验」三态）

| # | 核实项 | 结论 | 证据（file:line） |
|---|---|---|---|
| 1 | VSC 是否接 `configureEngMirror` | **已接**——但只做「槽写 + config 镜像 + 结果尾提示串」，**零 webview 推送** | `thincoder-vscode/src/agent/setup-tooltable.mjs:79-104` |
| 2 | plan 工具是否走同一 setter / 回调 | **已接（静态链完整）· 运行时未验** | `thincoder-vscode/src/agent.mjs:423-426` → `thincoder-vscode/src/extension/panel-callbacks.mjs:251` |
| 3 | `settings` 工具的通知路径 | **未接**——核工具零通知缝 + `config-watch` 自写抑制关掉兜底 | `thincoder-core/agent-tools/settings.mjs`（`configure`/`notify`/`onChange`/`postMessage`/`panel` 零命中）· `thincoder-vscode/src/extension/config-watch.mjs`（自写抑制） |
| 4 | CLI 显示面（TUI 模式 **banner** + **参数段**） | **已接（每帧 recompute——零改动需求）**——参数段同取**活对象 / TUI 状态**，无 `config.json` 镜像链 | 模式 banner `thincoder-cli/src/tui/render-frame.mjs:220-224`；参数段 `:376-392`（`agent._currentTurn` / `agent.provider` / `state.tokens` / `state.ctxCache`） |
| 5 | #41 `/eng` | **未接**（该档零 manifest 面命中） | `thincoder-cli/src/tui/cmd-eng.mjs:34` / `:68-78` |
| 6 | #41 `/session` 切槽 | **未接**（`applySession` 后无重估） | `thincoder-cli/src/tui/cmd-session.mjs:92` |
| 7 | #41 ACP 装载 | **未接**（两缺口：装配期不传 `slotData` + 装载后无重估） | `thincoder-cli/src/acp.mjs:84` / `:230-249` / `:280-294` |
| 8 | #41 核心 `eng` 工具 | **未接**（零 manifest 面，且**先写态后返回**） | `thincoder-core/agent-tools/eng.mjs:53` / `:71` |
| 9 | VSC 装配钩子是否每 run 重估 | **已接（对）**——钩子块在 `hydrateRun` 体内、判据每轮按槽重取 | `thincoder-vscode/src/agent/setup.mjs:371-396` · `thincoder-vscode/src/agent/agent-state.mjs:87-91` |

### 2.2 受影响文件表（行数 = as-of 2026-09-18 02:0x `\n` 计数实测；落点以函数名为准，行号为参考——D4）

| # | 文件 | 当前行数 | 变更 | 编辑点（函数级） | 增量 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 258 | 修改 | 新导出 `resolveEngineeringManifest(cwd, { writer, init })`——入口决策树（非抛错）；仅 `node:fs`/`node:path`（保叶子）+ 头注契约行 | +~45 |
| 2 | `thincoder-cli/src/cli/make-agent.mjs` | 223 | 修改 | `attachManifest` 体改**薄包装**（委托 #1；四条出口文案逐字不变——AC-19） | ±~10 |
| 3 | `thincoder-core/agent-tools/eng.mjs` | 88 | 修改 | `enter` 分支改**先判后翻**（判据 = #1 · `writer:'main'`；判据通过 ⇒ 缺档格建档 + `agent.manifest` ← 结果；拒 ⇒ 返回原因串、零副作用）；`exit` / 幂等 enter 零改 | +~15 |
| 4 | `thincoder-cli/src/tui/cmd-eng.mjs` | 78 | 修改 | ON 方向先判后翻（判据同源 · `writer:'main'`；准 ⇒ 缺档格建档 + `agent.manifest` ← 结果）；拒 ⇒ `pushLine` warn + **零 `pushLabel`**；OFF 零改 | +~12 |
| 5 | `thincoder-cli/src/tui/cmd-session.mjs` | 106 | 修改 | 目标槽**合值** `=== true` 时**在 `switchToSlot` 之前**先判（`loadSlotFile` 纯读预读，判据 = `MANIFEST.md` §2.2 会话权威值；拒 ⇒ 切槽整体不发生 + 原因行）；准 ⇒ `applySession` 之后一行附着（`agent.manifest` ← 结果；缺档格 = `writer:'main'` 建档） | +~14 |
| 6 | `thincoder-cli/src/acp.mjs` | 455 | 修改 | `session/load`（`:249`）/ `session/resume`（`:294`）两路：`loadSlotFile` 后先判（判据同取合值；拒 ⇒ 既有 ACP 错误通道、不建会话）+ `applySession` 后一行重估（附着 / 缺档格 `writer:'main'` 建档） | +~20 |
| 7 | `thincoder-vscode/src/agent/agent-state.mjs` | 119 | 修改 | 新导出 `syncToolDrivenDisplayState(agent, callbacks)`（端显示同步 cell 本体——两条判据 + 读后复位） | +~20 |
| 8 | `thincoder-vscode/src/agent.mjs` | 478 | 修改 | 工具批后「载体镜像回填」块（`:419-434`）尾追加一行调用（#7）；既有 task/plan/goal 三腿**零改** | +~2 |
| 9 | `thincoder-vscode/src/agent/setup.mjs` | 475 | 修改 | ① 钩子块（`:371-396`；模式门 `if` = `:378-396`）改薄包装（委托 #1）；② `hydrateRun` 槽应用处 `agent._engShown` ← 当前 `engineering`（**已展示基线**语义——非 `undefined`/`null`）；③ `decorate.settings`（`:126`）换包装实例（`execute` 返回置 `agent._settingsTouched`） | +~18 |
| 10 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 380 | 修改 | 新增两回调 `onEngMode` / `onSettingsChanged`——同指 `panel._pushSettingsLight()`（与 `onPlanMode` 同族） | +~4 |
| 11 | `thincoder-core/test/tool-seams-agent.test.mjs` | 149 | 修改 | 新增拒翻四态 + 先判后翻零副作用（AC-20 · T37–T40） | +~70 |
| 12 | `thincoder-cli/test/cmd-eng.test.mjs` | 71 | 修改 | 新增 `/eng` 拒翻 + 标签零发（AC-20） | +~25 |
| 13 | `thincoder-vscode/test/tool-display-sync.test.mjs` | 0 | 新增 | `syncToolDrivenDisplayState` 两条判据 + `_engShown` 基线复位 + 深度 > 0 no-op（AC-D · `WEBVIEW-PROTOCOL.md` §3.3 判据①②） | +~50 |
| 14 | `thincoder-vscode/test/settings-tool.test.mjs` | 198 | 修改 | 新增端包裹置位 `_settingsTouched`（AC-E） | +~12 |
| 15 | `thincoder-vscode/test/files.mjs` | 83 | 修改 | 清单登记新档一行（单元清单 = 显式列表——漏登记不被执行） | +1 |

- **零改回归面（AC-19）**：`thincoder-cli/test/make-agent-manifest-gate.test.mjs`（184）· `thincoder-vscode/test/setup-reminders.test.mjs`（321）· `thincoder-vscode/test/protocol-coverage.test.mjs`——**三档必须零改全绿**（改 = 薄包装走样或协议面被动的红灯）。
- **行数说明（>300 软线审视——本批实测）**：
  · **近 500 硬限三档**：`thincoder-cli/src/acp.mjs`（455）· `thincoder-vscode/src/agent.mjs`（478）· `thincoder-vscode/src/agent/setup.mjs`（475）——本轮增量均为单点微增（+~20 / +~2 / +~18）⇒ **不拆**（拆档会把「装载序 → 判据 → 应用」切成两档，反增耦合）；三档行数债随下次触碰评估。
  · `thincoder-vscode/src/extension/panel-callbacks.mjs`（实读 380 > 300 软线——评审发现 6③）——本轮 **+~4**（两回调同指既有 sink）⇒ **不拆**（回调族同档内聚，拆档只增跳转成本）；债随下次触碰评估。
  · `thincoder-core/manifest.mjs`（as-of 02:0x = 258；同域在途批（#34 值变重推）已落 +10 ⇒ 树内实读 **268**）本轮 +~45 ⇒ **≈313——首次跨 300 软线**，**拆分复核结论 = 不拆**：本档 = M1 机制本体单档（schema 常量 / 校验器 / 读 / 写 / 路径解析 / 入口决策树），「判据单源」（KD-M1-4 / M1-8 / M1-20）正由同档共存保证——拆档 = 把同一判据切成两份 export 面（校验与入口树分档 = 双源风险）；距 500 硬限余量 ≈187 行。
  · `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs`（实读 **491**——评审发现 6① 原为 `—`）——**本批不再追加**：491 + ~30 ≈ 521 **越 500 硬限** ⇒ 原行 13 的 AC-D 用例改落**新档** `thincoder-vscode/test/tool-display-sync.test.mjs`（行 13；含清单登记行 15）；该档行数债随下次触碰评估。
- **同文件并发**：`thincoder-vscode/src/agent/setup.mjs` 与 VSC 批（id=35）同档 ⇒ 调度器排队，**串行实施**，开工前 `git status` 复读行数。

### 2.3 验收标准（逐条回指——需求侧锚归主 agent：本批两条目 req_doc 均为 null）

| # | 验收标准 | 回指 | 落点 |
|---|---|---|---|
| AC-A | **#41 拒翻四态 + 先判后翻零副作用**：① 合法档 → 放行 + 附着 ② 缺档 + 根可解析 → 放行 + 建档 ③ 缺档 + 根不可解析 → 拒翻 ④ 档非法 → 拒翻；③④ 断言模式仍 OFF、`agent.manifest` 仍 null、`_pendingReminders` 零新增、`_advisorRuns` 未重置 | 台账 #41 · 父侧裁定（本档 §1.1） | `MANIFEST.md` §3.1 **AC-20** |
| AC-B | **#41 判据单源 + 入口回归**：两端入口钩子改薄包装后四条出口结果与文案逐字不变（既有测试档零改全绿） | 台账 #41 | `MANIFEST.md` §3.1 **AC-19** |
| AC-C | **#41 明示面四处**：`eng` 工具返回含原因句；`/eng` 拒时 warn 行 + 零标签；`/session` 拒时**切槽整体不发生**（`switchToSlot` / `applySession` 均不调——判据前置于 `switchToSlot`）；ACP 拒时不建会话 | 台账 #41 · §2.8 F3 | `MANIFEST.md` §2.8 F3 + 用例 T39 |
| AC-D | **#45 VSC 模式腿**：`eng` 工具翻转 ⇒ `callbacks.onEngMode` 触发 ⇒ webview 收 `agentSettings` 快照且 `engineering` 为新值（`#eng-btn` 态随变）；`plan` 腿保持既有链 | 台账 #45 | `WEBVIEW-PROTOCOL.md` §3.3 |
| AC-E | **#45 VSC 参数腿**：`settings` 工具执行 ⇒ `onSettingsChanged` 触发 ⇒ 四快照重推 | 台账 #45 | `WEBVIEW-PROTOCOL.md` §3.3 |
| AC-F | **#45 协议面零扰动**：无新增消息类型、载荷字段 / 发射点 / 消费位零变 ⇒ `protocol-coverage` 双向对账用例零改全绿、§12 表零改 | 台账 #45 | `WEBVIEW-PROTOCOL.md` §3.3 + §12 |
| AC-G | **#45 CLI 半成文**：`renderStatus` 纯函数直驱——改 `agent.config.agent.engineering` / `agent.planMode` 后重调，banner 段随变（CLI 端**零代码改动**） | 台账 #45 | `TUI.md` §7.3 |

### 2.4 用例表（详表 = `MANIFEST.md` §3.2 T37–T40；此处列本批全量面）

| 面 | 正常 | 边界 | 错误 |
|---|---|---|---|
| #41 翻转（核心 `eng` 工具） | T37 合法档放行 | T38 缺档 + 根可解析 ⇒ 建档放行 | T39 拒翻两格 · T40 零副作用（**先红**） |
| #41 翻转（CLI `/eng`） | 同 T37（标签 + 明细行） | OFF 方向恒放行 | 拒翻 ⇒ warn 行 + **零标签** |
| #41 切槽（`/session`） | 目标槽工程 + 合法档 ⇒ 切换 + 附着 | 目标槽普通会话 ⇒ 零 manifest I/O；**遗留槽（无 `engineering` 字段）+ 当前工程会话 ⇒ 合值 true ⇒ 预判据照触发** | 拒 ⇒ 不切槽 + 原因行 |
| #41 ACP（load / resume） | 装载 + 重估附着 | `session/new` 无会话 ⇒ config 回退（零改）；遗留槽同格（合值判据） | 拒 ⇒ ACP 错误对象、不建会话 |
| #45 VSC | 工具翻 ENG ⇒ 快照重推 | 深度 > 0 ⇒ `?.` no-op | 拒翻 ⇒ 面板**不**变（模式未翻） |
| #45 CLI | banner 随活对象变 | 同帧零状态 | — |

### 2.5 边界（本批不做）

- **不改**：VSC phase 2 统一本体（#21 边界既有裁决）· 注入器判据序（#34 批在飞）· 已裁定机制（单源化 / c1 / c2 / 豁免闸门）· `ATTACHMENT` 之外的 manifest 键与默认档。
- **不碰**：`scripts/**` · 冻结批档 · `_archive/**` · 参照树 · 提示词面内容。
- **不在本批**：`settings` 工具的**核内**通知缝（本批走端侧包装——核零缝即核零改，留核缝 = 工具面另案）· VSC phase-2 去 decorate 收敛通道 · CLI 端任何模式缓存副本。
- **需求侧（状态已核——2026-09-18 02:2x）**：① FR11 口径**已收正**（`docs/core/requirements/PORTABILITY.md:62` 收正文 + 本档 §1.5 裁定 1）——§2.8 F6 已改指该行，**无待收正项**；② `SPEC-MANIFEST.md` 补 #41 的 AC 锚（主 agent 域，父侧债务）；③ #45 侧无需求档（req_doc = null）——是否补需求条目由父侧裁。

### 2.6 报告格式（eng-coder 交回时）

交付表（逐条 AC-A…AC-G）+ 改动清单（`file:line`）+ 机检读数（`node scripts/doc-check.mjs`：悬空 / 行宽 / 拟新增 三读数——**本批基线 = 悬空 451 · 行宽 2 · 拟新增 3**，须零新增）+ 三仓 `npm test` 读数（core / cli / vsc）+
**先红证明**（T40：实现前必红）+ **plan 腿运行时实测（父侧裁定 2——§1.5）**：实施交付前实测一次「agent 用 `plan` 工具 ⇒ VSC 面板切换」——给读数 + 结论（成立 / 断点在运行时 ⇒ 另立条目，不阻塞本批）；观测通道 = 面板 `planMode` 消息（`thincoder-vscode/src/agent.mjs:423-426` → `thincoder-vscode/src/extension/panel-callbacks.mjs:251`）+ 未决项（若有，逐条列明，不得静默降级）。

### 2.7 修正轮（设计评审轮 1 后——2026-09-18；eng-designer）

**裁决：轮次 1 = PASS（🔴0 · 🟡8 · 🔵2）——十项全收（父侧逐条裁定接受）。** 落点（file:line = as-of 修正轮末）：

| # | 级别 | 处置 | 落点（file:line） |
|---|---|---|---|
| 1 | 🟡 | FR11 三处「待收正 / 待落」→ **已落收正**（口径单源 = 需求档该行；另两处只挂指针——D2） | `docs/core/design/MANIFEST.md` §2.8 F6（`:345-346`）· §4 新旧两条（`:451` · `:468`）+ 本档 §2.5（`:120`） |
| 2 | 🟡 | OFF 方向两读 → **取「删 F2 括注」读法**：不改 `agent.manifest`；清陈旧 = 会话起点钩子（附两条理由 + 注入器判据序 / 两处读盘证据） | `MANIFEST.md` §2.8 F2 表 OFF 行（`:306`）+ 表下「F2 三条收正」首条（`:313-316`） |
| 3 | 🟡 | 预判据触发条件：按槽字段 → **改合值**（同 `MANIFEST.md` §2.2 会话权威值——遗留槽格收口） | `MANIFEST.md` §2.8 F3 表两行（`:330-331`）+ 表下「F3 触发条件口径」（`:333`）；本档 §2.4（`:110-111`） |
| 4 | 🟡 | 放行分支两处缺 → 补**附着动作**（`agent.manifest` ← 结果）+ **`writer:'main'`** + 反证格 | `MANIFEST.md` §2.8 F2 表两行（`:307-308`）+ 表下第 2/3 条（`:317-318`）· AC-20（`:394`）· T38（`:445`）；本档 §2.2 行 3–6（`:70-73`） |
| 5 | 🟡 | `AC-21` 悬空 → 两行回指改 **AC-D / AC-E**（不新立 AC-21——避免同义双号） | 本档 §2.2 行 13/14（`:80-81`） |
| 6 | 🟡 | 行数注记三处 → 实测补（491 / 198）+ `manifest.mjs` 跨 300 拆分复核结论 + `panel-callbacks.mjs` 入 >300 审视；**实测导出**：原行 13 承接档 491 + ~30 ≈ 521 **> 500 硬限** ⇒ AC-D 用例改落新档（+ 清单登记行） | 本档 §2.2 行 13/14/15（`:80-82`）+ 行数说明（`:85-89`） |
| 7 | 🟡 | 父侧裁定 2（plan 腿运行时实测）无落点 → 落 §2.6 报告格式（读数 + 结论 + 观测通道） | 本档 §2.6（`:125`） |
| 8 | 🟡 | CLI **参数**面未核未登记 → 补判定 + 证据（活对象直读 ⇒ 零改） | 本档 §2.1 行 4（`:57`）；`docs/cli/design/TUI.md` §7.3（`:543-545`）+ 变更记录（`:583`） |
| 9 | 🔵 | `_engShown` 复位语义未定值 → 写明**已展示基线**（`← 当前 engineering` 布尔；非 `undefined` / `null`） | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.3 判据①（`:115-118`）+ 变更记录（`:368`）；本档 §2.2 行 9（`:76`） |
| 10 | 🔵 | 坐标同锚 → VSC 钩子块 `:371-396`（模式门 `:378-396`） | `MANIFEST.md` §2.2 钩子行（`:109`）；本档 §2.2 行 9（`:76`）。**半条未落（回报主 agent）**：`eng.mjs:24-35` 缝注释坐标落点 = 本档 §1.1（`:12`，主 agent 段）——一段一作者，未改 |

**本轮不做（守边界）**：拒翻裁定与先判后翻核序零改 · 本档 §3（评审段）零改 · 需求档（`docs/core/requirements/**`）零改 · `scripts/**` / 冻结批档 / `_archive/**` / 参照树 / 代码面零改。
**零新语义**：十项均为评审发现 + 父侧裁定的直接导出项（无新需求条目、无新 AC、无新协议消息）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计轮 1 核验（模式联动批 #41 + #45）**——核验对象：`MANIFEST.md §2.8`（F1–F6 / KD-M1-20/21 / AC-19/20 / T37–T40）· `WEBVIEW-PROTOCOL.md §3.3` · `TUI.md §7.3` · 批档 §2 任务书 · FR11 收正。逐项实读核过设计引的核实表（9 项全中：`eng.mjs:53/:71` 先写态、`cmd-eng.mjs:34`、`cmd-session.mjs:92`、`acp.mjs:84/:249/:294`、`render-frame.mjs:220-224`、`panel-callbacks.mjs:251`、`agent.mjs:423-426`、`setup-tooltable.mjs:79-104`、`setup.mjs:378-396`、`agent-state.mjs:88-91`），并抽查受影响文件行数标注（12 档读数与实读一致）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / Doc-state | 🟡 | FR11 收正已落地而设计侧三处仍记「待收正 / 待落」：`MANIFEST.md:330-331`（F6 末句「须需求侧收正…主 agent 域」）· `MANIFEST.md:439`（§4「需求侧待同步…FR11…与拒翻分支冲突」）· `batches/2026-09-18-mode-propagation.md:115`（§2.5「需求侧待落①」）；对照 `PORTABILITY.md:62` 已落收正 + 同档 `:34`（§1.5 裁定 1「接受收正…已落」）——三处与已落状态矛盾（R7a / R7e） | 三处改指已落（引 `PORTABILITY.md:62` + 裁定行）；F6 拟口径「开启无**项目文档**前提」与已落文本「不要求已退役概念文件 / 产品流程文件」措辞不同 ⇒ 取一处口径、另处挂指针 |
| 2 | Clarity / Consistency | 🟡 | OFF 方向的 `agent.manifest` 处置两处相反：`MANIFEST.md:301`（F2 表「**恒放行**（清 `agent.manifest = null`）」）vs `batches/2026-09-18-mode-propagation.md:70`（行 3「`exit` / 幂等 enter **零改**」）+ `:71`（行 4「OFF 零改」）；四条路径编辑点均无清陈旧动作，且无 AC / 用例覆盖该点（AC-20 只管 enter 四态，AC-17 / T29 管的是**钩子重调**路径）。行为面等价（注入器判据②先于 `agent.manifest` 读），但两读法实现不同 | 二选一收正：① 删 F2 括注（清陈旧归钩子重调——与行 3/4「零改」一致）；② 保留 F2 语义 ⇒ 四条路径编辑点各补一行清陈旧 + 一条用例 |
| 3 | Requirements / Edge | 🟡 | 切槽 / ACP 预判据触发条件与同机制权威值规则不同口径：`MANIFEST.md:317`（F3「目标槽 `engineering === true` 时先判」）· `:318`（ACP「同款先判」）按**槽字段**触发，而权威值 = 「槽带字段 ? 槽值 : config 回退」（`MANIFEST.md:92` · KD-M1-12）；遗留槽（无 `engineering` 字段）自工程会话切入时合值 = true（`thincoder-core/session.mjs:311-317`——缺席保持内存值）⇒ 预判据不触发，抛错落在 `applySession` 之后 ⇒ AC-C「拒 ⇒ 切槽整体不发生」（`batches/2026-09-18-mode-propagation.md:93`）在该格不成立（父侧裁定 3 要消灭的半态面） | 触发条件改写为「目标槽合值（槽字段优先 + config 回退）=== true」；或明写「遗留槽不预判、其拒翻落在切槽后」并配一格用例 |
| 4 | Feasibility / Clarity | 🟡 | 放行分支实施细节两处缺：① **附着动作**（`agent.manifest` ← 结果）——AC-20①/②（`MANIFEST.md:384`）与 T37/T38（`:434-435`）要求，而 F2 表放行行（`:302-304`）与四个编辑点（`batches/2026-09-18-mode-propagation.md:70-73`）均未写「谁在何处赋值」；② **`writer` 取值未定**——接口缺省 `writer = "subagent"`（`MANIFEST.md:286`），而 `writeManifest` 仅 `writer === "main"` 放行（`thincoder-core/manifest.mjs:237-240`）⇒「缺档 + 根可解析 → 就地建档」须传 `'main'`，否则退化为 `{ok:false, code:'init-failed'}`（拒翻）——与 F2 / AC-20② 的放行语义相反 | F2 表 + 四个编辑点补一句「判据通过 ⇒（`writer:'main'`）建档 + `agent.manifest` ← 结果」（或统一经薄包装复用）；该分支补一条反证用例 |
| 5 | Acceptance criteria | 🟡 | `AC-21` 悬空：`batches/2026-09-18-mode-propagation.md:80-81`（§2.2 行 13/14 以「（AC-21）」「（AC-21②）」回指），但交付面无 AC-21 定义——§2.3 只到 AC-G（`:89-97`），`WEBVIEW-PROTOCOL.md` §3.3 无 AC 编号面（`:91-118` 只「判据两条」）。VSC 半实际只能按 AC-D/E/F 读（R7d 语义悬空） | 两行回指改 AC-D / AC-E；或在 §2.3（或 §3.3）补 AC-21 定义，并与 §3.3 两条判据互指 |
| 6 | Affected-file size annotations | 🟡 | criterion 8 面三处：① 行 13/14（`thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` · `thincoder-vscode/test/settings-tool.test.mjs`）「当前行数」列 = `—`（两档在树内、可实测）——`batches/2026-09-18-mode-propagation.md:80-81`；② `thincoder-core/manifest.mjs`（258，`:68`）本轮 +~45 ≈ **303 首次越过 300 软线**，行数说明段（`:84`）只审 acp / agent / setup 三档；③ `panel-callbacks.mjs`（380 > 300，`:77` 行 10）未入 >300 审视 | 补两档当前行数；`manifest.mjs` 补「跨 300 的拆分复核结论」（或给增量界值 `≤±N`）；`panel-callbacks.mjs` 纳入 >300 审视行 |
| 7 | Requirements / Coordination | 🟡 | 父侧裁定 2（`batches/2026-09-18-mode-propagation.md:35`「plan 腿静态已接 / 运行时未验 ⇒ **验收轮必做**：实施交付前实测一次…若实测确不变 ⇒ 断点在运行时，另立条目」）在任务书无落点：AC-D（`:94`）只写「`plan` 腿保持既有链」· §2.4 用例表（`:101-108`）无对应格 · §2.6 报告格式（`:119-120`）未列该项（R5 协调项，非缺陷） | §2.6 加一行「plan 腿运行时实测读数 + 结论（成立 / 另立条目）」；或 §2.3 补 AC-D′ 并写明观测通道 |
| 8 | Requirements / Coverage | 🟡 | #45 的「**参数**」半句在 CLI 端未核未登记：`TUI.md:538-544`（§7.3）只成文**模式 banner** 契约，核实表同限（`batches/2026-09-18-mode-propagation.md:57`「CLI 显示面（TUI **模式显示**）已接」）；批档 §1.2 第 1 项要求核「CLI 端显示面…是否需要联动」——`settings` 工具驱动的参数变更在 CLI 侧（header 模型段 / 状态栏 token·context 段）有无活读面 = 未登记（结论若为「活读零改」应落一句，否则「CLI 零改动」不完整） | TUI §7.3 或核实表补一句 CLI 参数面判定（活对象直读 ⇒ 零改；有缓存副本 ⇒ 另立条目） |
| 9 | Clarity | 🔵 | `_engShown` 复位语义未定值：`WEBVIEW-PROTOCOL.md:115`（判据①「`_engShown` 在 `hydrateRun` 按槽应用处复位」）· `batches/2026-09-18-mode-propagation.md:76`（行 9 ②同语）——「复位」= 置为当前 `engineering`（已展示基线）还是置 `undefined`/`null` 未写；两读法行为不同（后者每 run 首个工具批无条件重推一次快照） | 写明基线语义（建议：hydrate 处 ← 当前 `agent.config.agent.engineering`）+ 一条判据用例 |
| 10 | Doc hygiene（R7c） | 🔵 | 同一钩子块两处坐标不一：`MANIFEST.md:109` 记 `thincoder-vscode/src/agent/setup.mjs:375-391`，`batches/2026-09-18-mode-propagation.md:76` 记 `:378-396`；实读钩子块 = `:371-396`（模式门 `if` 起于 `:378`）。另 `:12` 引 `thincoder-core/agent-tools/eng.mjs:24-35` 称「注释逐字」，该注释段实在 `:17-23`（所引句 = `:19-20`） | 两处坐标同锚（建议 `:371-396` / 模式门 `:378-396`）；缝注释坐标改 `:17-35` |

**未发现 🔴**：四条翻转路径（核心 `eng` 工具 · `/eng` · `/session` · ACP）的判据单源化与先判后翻序均可实现（`config.agent.engineering` 由核心工具在内存直写、写点先于返回——实读 `eng.mjs:51-53` / `:64-78`）；VSC 通知链的单 sink `_pushSettingsLight()` 实存且确推四快照（`chat-panel.mjs:318-327`），`agentSettings` 快照随盘面（`settings.mjs:154-166` + `config-io.mjs:117-136` 无缓存读）⇒ #45 两腿可达；CLI 半零改动结论成立（`render-frame.mjs:218-224` 活对象直读 + `agent-turn.mjs:132-134` 1s ticker）。

**计数**：🔴 0 · 🟡 8 · 🔵 2（共 10 条）——全部非阻断。

VERDICT: pass

### 轮次 2（评审子代理）

**模式联动批（#41+#45）· 设计评审轮 2 = 修项核验**——对象 = 批档 §2.7 十项修项（🟡#1–#8 / 🔵#9–#10）的落位与自洽；逐项实读（档面全文 + 档面所引代码坐标只读抽检）。**结论：10/10 已落，无 🔴 / 无新增 🟡。**

| 修项 | 结论 | 实读证据 |
|---|---|---|
| 🟡#1 FR11 三处改指 | ✅ 已落 | `docs/core/design/MANIFEST.md:345-346`（F6 改指 `PORTABILITY.md:62` + 只挂指针）· `:451` · `:468`（「已落 / 无待收正项」）· 批档 `:120`；口径源 `docs/core/requirements/PORTABILITY.md:62` 收正文实读在位；FR11 面「待收正 / 待落」零残留（grep） |
| 🟡#2 OFF 行取「删括注」读法 | ✅ 已落 | `MANIFEST.md:306`（「不改 `agent.manifest`」）+ `:313-316`；理由证据实读吻合：`thincoder-core/agent/setup-reminders.mjs:117-118`（判据② 确先于 ③ 返回）· 两读盘面 `thincoder-core/agent/write-gate.mjs:50` · `thincoder-core/agent-tools/batch-segment.mjs:81-83`；与批档 `:70-71`「OFF 零改」自洽 |
| 🟡#3 预判据改合值 | ✅ 已落 | `MANIFEST.md:330-331` + `:333`；批档 `:110-111`；`thincoder-core/session.mjs:314-317`（缺席保持内存值）实读吻合；`loadSlotFile` 实存（`thincoder-core/session.mjs:182`——无认领副作用读取器）；`thincoder-cli/src/tui/cmd-session.mjs:84` `switchToSlot` 在其后 ⇒ 预判据点可实现 |
| 🟡#4 附着赋值 + `writer:'main'` | ✅ 已落 | `MANIFEST.md:307-308` + `:317-318` · AC-20 `:394` · T38 反证格 `:445`；批档行 3–6 `:70-73`；写门实读 `thincoder-core/manifest.mjs:248-251`（缺省 `"subagent"`；`writer !== "main"` → 抛） |
| 🟡#5 AC-D/E 回指 | ✅ 已落 | 批档 `:80-81` 回指 AC-D / AC-E（定义 `:99-100`）；AC-21 零残留（仅 §3 轮 1 历史 + §2.7 修项描述） |
| 🟡#6 行数实测 + 新档 | ✅ 已落 | 实读：`thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` = 491 · `thincoder-vscode/test/settings-tool.test.mjs` = 198 · `thincoder-vscode/test/files.mjs` = 83（显式清单——登记即跑）· `thincoder-core/manifest.mjs` = 268；新档 `thincoder-vscode/test/tool-display-sync.test.mjs` 实不存在（= 新增 0）；行数说明三档复核结论齐（`:85-89`，含 491 承接档越限导出项） |
| 🟡#7 plan 腿实测 | ✅ 已落 | 批档 `:125`（读数 + 结论 + 观测通道 + 未决项禁静默降级） |
| 🟡#8 CLI 参数面判定 | ✅ 已落 | 批档 `:57`（核实表行 4）+ `docs/cli/design/TUI.md:543-545` + `:583`；坐标实读吻合：`thincoder-cli/src/tui/render-frame.mjs:376-392` 恰含 `_currentTurn` / `_maxTurns` / `state.tokens` / `agent.provider` / `state.ctxCache`（banner `:220-224`） |
| 🔵#9 `_engShown` 定值 | ✅ 已落 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:116-117`（已展示基线布尔 + 非 undefined/null 理由）+ `:368`；批档 `:76` 同口径 |
| 🔵#10 坐标同锚 | ✅ 已落 | `MANIFEST.md:109` 与批档 `:76` 同锚 `:371-396` / 模式门 `:378-396`——实读吻合（`thincoder-vscode/src/agent/setup.mjs:371` / `:378` / `:396`）；半条（缝注释坐标）= `thincoder-core/agent-tools/eng.mjs:17-23` 实读在位（所引句 `:19-20`） |

另抽检同表其余档读数（`agent-state.mjs` 119 · `make-agent.mjs` 223 · `eng.mjs` 88 · `cmd-eng.mjs` 78 · `acp.mjs` 455 · `agent.mjs` 478 · `panel-callbacks.mjs` 380 · `tool-seams-agent.test.mjs` 149 · `cmd-eng.test.mjs` 71 · 零改回归面 184 / 321）——全部与实读一致（±1 尾行口径内）。

**本轮新发现（3 条——全 🔵，非阻断）**：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene（R7c） | 🔵 | 批档行数说明 `batches/2026-09-18-mode-propagation.md:88` 同句内算术不一致：树内实读 268 + 本轮 +~45 ⇒ 应 ≈313（同句「距 500 硬限余量 ≈187」= 500−313，与该值自洽），句中写「≈303」（= as-of 旧基数 258 + 45） | 该句两数取一（建议 ≈313 + 余量 ≈187）；拆分复核结论（不拆）不受影响 |
| 2 | Doc hygiene / Clarity | 🔵 | `docs/core/design/MANIFEST.md:455`（④「AC-20② 补 writer 判据」）与同条目收尾句 `:457`（「AC-19 / AC-20 判据面均零改」）自陈相抵——AC-20 判据面本轮确有增补 | 收尾句改「AC-19 零改 · AC-20 结论零改（② 补 writer 实现要件）」或等价措辞 |
| 3 | Clarity | 🔵 | 批档 `:72`（§2.2 行 5）「判据 = §2.2 会话权威值」——本档 §2.2 = 受影响文件表、不含该定义（定义在 `MANIFEST.md` §2.2）；§2.7 落点表 `:135` 同款 | 两处补全 `MANIFEST.md §2.2`（与本档 §2.2 节号相撞） |

**计数**：🔴 0 · 🟡 0 · 🔵 3（共 3 条）——全部非阻断。
**口径注**：评审上下文未提供文档地图与项目标准档 ⇒ Document ownership / methodology 面降级核验；抽检范围为档面所引代码坐标（只读，不涉 diff、不涉其他设计面）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-18 01:43 用户裁定「同批，现在做」= 本批批准**；设计评审两轮：轮 1 = PASS（🔴0 · 🟡8 · 🔵2）→ fix 轮（id=49）→ **轮 2 修项核验 = PASS**（10/10 落位 · 3 条新 🔵——父侧已就地收正：`:88` ≈313 · `:72`/`:135` 指全 `MANIFEST.md` §2.2 · `MANIFEST.md:457` AC-20 措辞）⇒ 实施轮派发（eng-coder · initial · 15 档）。

## §5 实施记录（eng-coder）

**轮次**：initial（eng-coder · 2026-09-18）。**终态 = clean**：内审（explore 只读分歧审计）= CLEAN（零 🔴/🟡）· advisor 代码评审 = VERDICT pass（🟡3 · 🔵4 · 🔴0；全部为文档/登记面，**代码列零改动**）· 自修正轮 0 次。

### 5.1 交付表（逐条对 §2.3）

| # | 状态 | 交付 | 证据（落点） |
|---|---|---|---|
| AC-A | ✅ Done | 拒翻四态 + 先判后翻零副作用：`eng` 工具 enter 分支 = 判据树 → 拒则返回原因串（模式仍 OFF / `agent.manifest` 仍 null / `_pendingReminders` 零新增 / `_advisorRuns` 未重置 / 镜像缝零调用），准则建档 + 附着 | `thincoder-core/agent-tools/eng.mjs`（enter 分支）· 用例 `thincoder-core/test/tool-seams-agent.test.mjs` T37–T40 |
| AC-B | ✅ Done | 判据单源 + 入口回归：CLI `attachManifest` 与 VSC `hydrateRun` 钩子块改薄包装（委托 `resolveEngineeringManifest`）；四条出口文案**逐字**（已用 HEAD 模板求值比对：invalid 76 字符逐字相等 · root-unresolvable 161 字符逐字相等） | `thincoder-cli/src/cli/make-agent.mjs` · `thincoder-vscode/src/agent/setup.mjs` · 决策树 `thincoder-core/manifest.mjs` |
| AC-C | ✅ Done | 明示面四处：工具返回 `Error: cannot enter engineering mode — <原句> (mode unchanged)` · `/eng` 拒 ⇒ warn 行 + 零标签 + 零副作用 · `/session` 拒 ⇒ 判据前置于 `switchToSlot`（两函数均不调）· ACP 拒 ⇒ 既有错误通道、不建会话 | `thincoder-cli/src/tui/cmd-eng.mjs` · `thincoder-cli/src/tui/cmd-session.mjs` · `thincoder-cli/src/acp.mjs`（load/resume 两路） |
| AC-D | ✅ Done | VSC 模式腿：工具批后单点 `syncToolDrivenDisplayState`（判据①`engineering` ≠ `_engShown` 已展示基线）⇒ `onEngMode` ⇒ `_pushSettingsLight()` 四快照重推；`plan` 腿零改 | `thincoder-vscode/src/agent/agent-state.mjs` · `thincoder-vscode/src/agent.mjs` · `thincoder-vscode/src/agent/setup.mjs`（基线置值）· `thincoder-vscode/src/extension/panel-callbacks.mjs` |
| AC-E | ✅ Done | VSC 参数腿：端侧 settings 包装 `execute` 返回后置位 `_settingsTouched` ⇒ 判据②读后复位 ⇒ `onSettingsChanged` | `thincoder-vscode/src/agent/setup.mjs`（`vscSettingsFace`）· 用例 `thincoder-vscode/test/settings-tool.test.mjs` T-S2.38 |
| AC-F | ✅ Done | 协议面零扰动：两回调体内零 `postMessage`（只调既有 sink）⇒ 无新增消息类型；`protocol-coverage.test.mjs` 与 §12 表零改 | `thincoder-vscode/src/extension/panel-callbacks.mjs` |
| AC-G | ✅ Done | CLI 半成文：banner/参数段均为活对象直读——CLI 端**零代码改动**（`render-frame.mjs` 未触碰） | `thincoder-cli/src/tui/render-frame.mjs`（未改） |

### 5.2 改动清单（逐档）

| # | 档 | 变更 | 说明 |
|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | 修改 | 新导出 `resolveEngineeringManifest(cwd, { writer, init })`——四出口非抛错决策树（`invalid` / `missing` / `root-unresolvable` / `init-failed`）；头注契约行 |
| 2 | `thincoder-core/agent-tools/eng.mjs` | 修改 | enter 分支先判后翻（判据 `writer:'main'`；拒 ⇒ 原因串 + 零副作用；准 ⇒ 附着 + 翻态）；`exit` / 幂等 enter 零改 |
| 3 | `thincoder-cli/src/cli/make-agent.mjs` | 修改 | `attachManifest` 改薄包装（委托决策树；`!ok` ⇒ 抛原句）；import 面收窄 |
| 4 | `thincoder-cli/src/tui/cmd-eng.mjs` | 修改 | ON 方向先判后翻（拒 ⇒ `pushLine` warn + 零 `pushLabel`）；OFF 零改；档头注按 FR11 收正口径改写 |
| 5 | `thincoder-cli/src/tui/cmd-session.mjs` | 修改 | 目标槽**合值** `=== true` ⇒ `loadSlotFile` 纯读预判（在 `switchToSlot` 之前）；拒 ⇒ 切槽整体不发生；准 ⇒ `applySession` 后一行附着 |
| 6 | `thincoder-cli/src/acp.mjs` | 修改 | `session/load` / `session/resume`：`loadSlotFile` 后先判（拒 ⇒ 既有错误通道、不建会话）+ `applySession` 后一行重估（`reattach`）；档头注 |
| 7 | `thincoder-vscode/src/agent/agent-state.mjs` | 修改 | 新导出 `syncToolDrivenDisplayState(agent, callbacks)`（两判据 + 读后复位） |
| 8 | `thincoder-vscode/src/agent.mjs` | 修改 | 工具批后「载体镜像回填」块尾一行调用 + import |
| 9 | `thincoder-vscode/src/agent/setup.mjs` | 修改 | ① 钩子块改薄包装（`init: depth === 0`）② `_engShown` 基线置值（槽应用处）③ 新导出 `vscSettingsFace` 包装 settings 实例 |
| 10 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 修改 | 新增 `onEngMode` / `onSettingsChanged` 两回调（同指 `_pushSettingsLight()`） |
| 11 | `thincoder-core/test/tool-seams-agent.test.mjs` | 修改 | 新增 T37–T40 + 既有 #91 镜像缝用例夹具加锚（enter 语义改判的连带适配） |
| 12 | `thincoder-cli/test/cmd-eng.test.mjs` | 修改 | 新增 T-20–T-22（拒翻零标签 / 档非法 / OFF 恒放行）+ 既有 T-18/T-19 夹具加锚 |
| 13 | `thincoder-vscode/test/tool-display-sync.test.mjs` | **新增** | 两判据 + `_engShown` 基线（含 `hydrateRun` 置值）+ 深度 > 0 no-op |
| 14 | `thincoder-vscode/test/settings-tool.test.mjs` | 修改 | 新增 T-S2.38 端包裹置位（AC-E） |
| 15 | `thincoder-vscode/test/files.mjs` | 修改 | 清单登记新档一行 |

### 5.3 机检读数（复跑）

- **三仓 `npm test`**：core **316/316 全绿** · cli **640/640 全绿** · vsc **599/599 全绿**（零 fail）。
- **零改回归面**（AC-19）：`thincoder-cli/test/make-agent-manifest-gate.test.mjs` · `thincoder-vscode/test/setup-reminders.test.mjs` · `thincoder-vscode/test/protocol-coverage.test.mjs` **三档零改全绿**。
- **`node scripts/doc-check.mjs` 复跑**：悬空 **224** · 行宽 **2** · 拟新增 **2**——本批**零文档改动**（改动∩`docs/**` = ∅）⇒ 按档归属零新增成立。
  **读数口径差异（未决项）**：批档 §2.6 记基线「悬空 451 · 行宽 2 · 拟新增 3」，本次复跑为「224 · 2 · 2」——差异来自同工作树的在途文档批（卷面移动），且基线疑为另一调用口径所测；本批无文档面改动，故**零新增结论不受影响**。

### 5.4 先红证明（T40——实现前必红）

实现前跑 `thincoder-core/test/tool-seams-agent.test.mjs`（此时仅决策树已落、翻转面未改）：**tests 8 · pass 4 · fail 4**——T37 / T38 / T39 / T40 **四例全红**（届时 enter 分支仍先写态后返回）。实现后同档 **8/8 全绿**。

### 5.5 plan 腿运行时实测（§1.5 裁定 2）+ #45 两腿端到端实测

观测通道 = VSC 真 agent 循环（`runAgent` + 本地 mock provider，零外网）：

- **plan 腿（读数）**：脚本化 provider 先发 `plan{action:'enter'}` 工具调用再收尾 ⇒ `callbacks.onPlanMode(true)` **触发一次**、`agent._planMode === true`、`agent.planMode === true`。**结论 = 成立**（静态链在运行时闭合，**无断点**，不需另立条目）。
- **面板发射侧（读数）**：`buildPanelCallbacks` 装配后直调 `onPlanMode(true)` ⇒ webview 收 `{type:"planMode",active:true}`；直调 `onEngMode()` / `onSettingsChanged()` ⇒ 面板 `_pushSettingsLight()` 各调用一次（合计 2）。**结论 = #45 两腿回调→sink 链在运行时成立。**
- **#45 模式腿端到端（读数）**：同一循环内脚本化 provider 发 `eng{action:'enter'}`（cwd = 临时仓根）⇒ `engineering === true` · `agent.manifest` 附着 · `PROJECT-MANIFEST.json` 落盘（#41 放行 + 建档）⇒ **`callbacks.onEngMode(true)` 触发一次**、`_engShown` 跟随；`onSettingsChanged` **零触发**（本回合未动 settings——无假阳性）。

### 5.6 越表改动（超出 §2.2 十五档声明面——逐条理由）

| # | 档 | 理由 |
|---|---|---|
| A | `thincoder-cli/test/manifest-flip-refusal.test.mjs`（**新增**） | AC-C 的 `/session` 与 ACP 两路机检落点（§2.3 AC-C 明列该两路行为；§2.2 未给落点档） |
| B | `thincoder-core/test/core-hygiene.test.mjs` | 本批使 `manifest.mjs` 跨 300 软线——该档 `SOFT_LINE_REGISTRY` 登记为既有门（未登记即红），须加 `manifest.mjs` 一行 |
| C | `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs` | T-V13 的 eng enter 文案用例原跑在非锚 cwd——语义改判后必红，须给夹具加 `.git` 锚（文案断言本体零改） |
| D | `thincoder-vscode/src/agent/setup.mjs` 新导出 `vscSettingsFace` | AC-E 机检面（settings-tool 用例须拿到端侧包装实例）；形态与既有 `vscSubagentFace` 导出同族 |

### 5.7 未决项（逐条，不静默降级）

1. **doc-check 基线口径差异**（见 5.3）——请父侧核定新基线读数（悬空 224 · 行宽 2 · 拟新增 2）。
2. **`MANIFEST.md` 是否补载实现面两处**（advisor 评审 🔵）：① `syncToolDrivenDisplayState` 的返回值 `{eng, settings}`（本实现作为测试直驱面）；② 决策树「非 ENOENT 读错仍上抛」的边界（F3 明示面在该格退化为上抛）。二者均**不改代码即可收口**（补半句）。
3. **坐标漂移**（🔵）：VSC 钩子块在本批后实读 `setup.mjs` 钩子块起点后移（模式门在 `:396`），而 `MANIFEST.md` 与本档 §2.2 行 9 仍记 `:371-396` / 模式门 `:378-396`——D4 允许行号参考漂移，收正与否由父侧裁。
4. **遗留槽 `engineering: null` 的两端口径差**（🔵）：VSC 面 `slotEng != null` 与核 `data.engineering !== undefined` 在该形态下结果相反（本批 CLI 三处判据均与核同源；VSC 面为既有实现行）——建议登记端差或另批归并。
5. **`/session` 预判据的窄窗**（🔵）：预读成功而 `switchToSlot` 失败（槽未登记于会话 manifest）时，可能先按准翻列建档随后仍回显 `Slot not found`；所生成档为合法项目档且幂等，无数据风险。

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：两件逐条落位——**#41 拒翻语义**（fail-closed + 明示原因）四处（核心 `eng` 工具 / `/eng` / `/session` 切槽 / **ACP 装载**）+ **#45 工具驱动的模式/参数变更联动 UI**（VSC 端）：**18 档**改动；三包全量 **core 317→324 / CLI 657→669 / VSC 599** 全绿（含 **T-V13 转绿**）；**plan 腿运行时实测成立**。
- **提交**：`1efc90a2`。
- **残留（登记）**：近 500 硬限三档（`acp.mjs` 455 · `vscode/src/agent.mjs` 478 · `vscode/src/agent/setup.mjs` 475）⇒ 「不拆 + 行数债随下次触碰评估」已在批档 §2.4 在册；`manifest.mjs` 258 → ≈303 首越 300 软线同登记。
- **三账**：台账 **#41 / #45** 可核销；批档冻结；收口日期 2026-09-18。
