# 2026-09-20 · VSC 行为/能力两则批（VSC-RULES-RETRY-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 13:0x · 来源 = 用户 13:05「**为什么不全点火**」+ 台账 #130 / #132。
> 本档 = **VSC 端两则**（能力接线 + 行为跟进）；两端语义冲突以 CLI 为标尺（既有裁定）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目清单（2 条台账）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#130** | **VSC `loadRules` 未接线**（能力面） | 用户 2026-09-15 裁「**先登记**」⇒ 本次点火：判定「接线」的**正确面**（完整路径——需要多大改多大）：钩子规则文件的加载/生效面与 CLI 的 `loadRules` 语义对齐；**若判定「端侧不需要该面」也须给结论 + 理由**（不许留悬）。 |
| 2 | **#132** | **P1 批 3 跟进两则** | ① **Retry `y/n`**（CLI 交互面）——语义/文案按 CLI 既有标尺；② **log-only** 面收口——按台账 #132 的 evidence 逐条。 |

### 1.2 边界

- **不触**：核面（归 sync 批）· `scripts/**` · 归档档 · 冻结批档 · 需求档（若需新需求条目 ⇒ 设计席**上抛**，父侧笔）。
- 设计档面：本批落地后随收口轮（或设计席判「随落随记」并给落点）。

### 1.3 验收（方向）

① 逐条「台账 id → 设计（落点/改法/判据）」；② 验收命令可跑（cmd.exe · 全 ASCII · 禁中文 `findstr /c:`）；③ 受影响文件表（源/测试档标行数 + 预计增量）；④ **先红后绿路径**明示；⑤ 不一致处（如有）。

### 1.4 台账

#130 / #132 → 本批（在途）· 落定后核销。

## §2 批次任务与设计（eng-designer）

**轮次**：initial · **作者**：eng-designer · **日期**：2026-09-20 · **任务书** = 本档 §1 全段 · **证据** = 台账 #130 / #132（evidence 行）+ P1/P3/结构整合批档 + 本席现盘实读（坐标均带 `file:line`）· **机检基线**（本席写前/写后各一跑）：悬空 0 · 行宽 0 · exit 0 ⇒ 净增 0 义务 ✓

### 2.0 口径与承接

- **标尺**：两端语义冲突以 CLI 为标尺（§1 头注）；本批两条 = ① VSC 规则面**接线**（能力面）② CLI X8 两则跟进（行为面）。
- **已裁承接**：用户 2026-09-20 05:15「都按建议」= U1 取**选项②**（两端保留两套语义 + 显式登记；取一侧 / 新机制均不取）· `loadRules` 死码「先登记」；09-20 05:32 裁 = #132 ① 取**选项①**（与 `continue` 同形仅 y/n）。
- **禁改动面**：核面（`thincoder-core/**` 代码——归 sync 批）· `scripts/**` · 归档档 / 冻结批档 · 他批写域 · 需求档（上抛）· 两端 webview 面（本批零改）。
- **设计档面 = 随落随记（本席已落）**：`docs/core/design/WORKSPACE.md` §1 行 + **新增 §2.3 规则发现面（权威定义）** + §2.2 #171 现状注 · `docs/core/design/LOGGING.md` §6.2（`err:provider`）· `docs/cli/design/TUI.md` §2 键面枚举 + §4.3（框面 + log-only）；各档变更记录 1 条（设计轮——LOGGING.md 批次条随 fix 轮补入〔评审 #1〕；fix 轮追加行与零改档见 §2.9）。

### 2.1 #130 —— VSC `loadRules` 接线：**正确面判定 = 双面接线**（非删除、非「不需要」）

**结论（先给结论，不留悬）**：VSC 的规则面 = **A 面（stream 规则 · 两端，与 CLI 语义对齐）+ B 面（`.cursor/rules` 作用域规则 · VSC 端面）**。两面共用一条判据：**一线程一语义**——`.thincoder/rules/*.md` 恒 = stream 规则（两端同义）；`.cursor/rules/*` 恒 = 作用域规则（VSC 专属）。**判「端侧不需要该面」不成立**——理由见下 A-0 / B-0。

#### A 面 —— stream 规则在 VSC 生效（CLI 语义对齐 · 已裁未落项）

- **A-0 判定依据**：① `docs/core/design/AGENT-LOOP.md:33`（#78）逐字记「`agent.streamRules` 在 VSC 全仓零消费方——VSC `src/**` 0 命中」，`:142`（A7）已裁（2026-09-13 · 按建议）「归一后两端生效」——**已裁未落**；② 两产品**同读一份** `~/.thincoder/config.json`（`agent.streamRules` 键）⇒ 现态 = 用户配置的流规则在 VSC **静默不生效**（与 #122「用户配的 hooks 在 VSC 静默不生效」同族 · 该族评级 = 高）；③ 机制已在核（provider `chat()`），VSC 已用核 provider 且**已有** warnings 通道（`thincoder-vscode/src/agent/run-stages.mjs:54-55`）⇒ 缺口 = 装配与选项两处小接线。
- **A-1 装配合并（新叶 + 调用点）**：新叶 `thincoder-vscode/src/agent/rules-face.mjs` 导出 `mergeFileRules(configRules, cwd)`——逐字镜像 CLI `thincoder-cli/src/cli/make-agent.mjs:44-48` 语义（`discoverRules(cwd)` 置前 + 按 `pattern` 去重 + 文件规则为空时**原样返回**零改）；调用点 = `thincoder-vscode/src/agent/setup.mjs` 配置读段（`:218-240` 读 `loadRaw()` 族）——新增 `cfgStreamRules = mergeFileRules(raw.agent?.streamRules ?? [], cwd)`。
- **A-2 配置透传**：`setup.mjs:253-258` 的 `agentFields` 白名单补 `streamRules: cfgStreamRules` ⇒ 经 `thincoder-vscode/src/agent/agent-state.mjs:96-109`（`agent: { ...cfg.agentFields, engineering }`）**自动**落到 `agent.config.agent.streamRules`（该档零改——实核）。**子代理**（depth>0 走核循环）自动继承：核 `agent-tools/subagent-spawn.mjs:342-348` 子 config = `{ ...parent.config, agent: { ...parent.config.agent, … } }`（实核）⇒ 同一份 streamRules 达子回合。
- **A-3 消费接线（循环）**：`thincoder-vscode/src/agent.mjs`：① run 级新增 `const streamRuleFired = new Set()`（镜像核 `thincoder-core/agent.mjs:183`——`repeat:"once"` 的跨 chat 调用去重集）；② `chat()` 调用（`:263-288`）补 `streamRules: agent.config.agent?.streamRules ?? []` + `firedPatterns: streamRuleFired`（镜像核 `agent.mjs:259-260`）；③ 响应后处理段（`:325-327` `injectResponseReminders` **之前**）补 `ruleTriggered` 分支（镜像核 `agent.mjs:305-315`）：调新叶 `applyRuleTriggered(agent, history, fullHistory, response)`（部分输出 `pushReal` + 注入 `[System reminder — stream rule "<name>": <message>]`）⇒ 返回 true 则 `continue` 重入同上下文。
- **A-4 warnings 文案收正**：`thincoder-vscode/src/agent/run-stages.mjs:52-60` 注入文本由 `warnings from your last response` 收正为 CLI **逐字** `stream rule warnings from your last response`（核 `thincoder-core/agent/run-stages.mjs:33-39`）——旧注释「本端无 stream rules」句随删（失效表达不留在规范面）。
- **A-5 判据**：见 §2.5 命令 2（T-A1…T-A4——T-A4 = warn 面，评审 #3 补）。
- **A-6 边界**：不改核 provider（`streamRules` 由核 `chat()` 消费——已有）· 不改 CLI 端 · 不新增配置键（复用 `agent.streamRules`）· 不改 `firedPatterns` 语义。

#### B 面 —— `.cursor/rules` 作用域规则真生效（VSC 端面）

- **B-0 判定依据**：① 用户环境实证该约定的真实使用——`D:\teamcode\thin4\.cursor\rules\{project_rules.mdc, test-red-stop-platform-auth.mdc}`（后者 `alwaysApply: true` + `description`）+ 本产品树 `thincoder-vscode/.cursor/rules/python.mdc`（`globs: "*.py"`）⇒ 「写了规则没人用」在用户侧可达；② 死码 `thincoder-vscode/src/extension/rules.mjs`（`loadRules` + `matchesGlob`）的设计意图即此面；③ 用户已否「统一到 globs」（P3 选项③）⇒ 本面 = **附加**面、不替代 A 面。**不取「删除死码」**（接线取代删除；删除 = 用户既有 `.cursor/rules` 永久失效）。
- **B-1 读取面收正**：`thincoder-vscode/src/extension/rules.mjs`——① 目录收敛为 **`.cursor/rules` 单读**（去掉 `.thincoder/rules`——归 A 面，消「同名不同物」）；② frontmatter 补 `alwaysApply` 解析（`"true"` ⇒ `true`）；③ 头注/字段注释随改（说明单目录 + 三分类）。
- **B-2 三分类（判据 = `rules-face.mjs`，单源 · **按序判定互斥**）**：① `alwaysApply === true` ⇒ **常驻集**（**先判**——`globs` 同在不改分类〔评审 #2〕）② 有 `globs` ⇒ **作用域集** ③ 无 `globs` 且无 `description` ⇒ **常驻集** ④ 仅 `description`（Cursor agent-requested 语义）⇒ **不注入**（登记——本端无该机制）。
- **B-3 常驻集注入**：[4] 层尾块——`setup.mjs:354-363`（项目指令块邻位）追加 `systemPrompt += scopedRulesBlock(cwd)`（块文 `\n\nProject rules (.cursor/rules):\n- <name>: <content>`；无命中 ⇒ **零改字符串**）。取向 = 与 `AGENTS.md` 同槽（每 run 重建、无需去重、不进 history）。
- **B-4 作用域集注入（JIT）**：`thincoder-vscode/src/agent/execute-tools.mjs` 工具批派发前（与 L3 记账 / stall 提醒同址族）——文件路径类工具（`FILE_MUTATORS` ∪ `file_ops` ∪ `read`/`glob`）取 `tool.touchedPaths?.(args) ?? [args?.path]`，命中**未注入**规则（`agent._rulesInjected` = 会话级 Set，挂 agent 单例）⇒ history 注入 `[System reminder — project rule "<name>" (globs: <g>): <content>]`（**派发前**——模型下一轮可见）；每规则每会话恰一次（去重键 = `name`）。语义一句话 = 「Agent 将触碰匹配文件时，该文件作用域的规则先入上下文」。**读点与缓存载体（评审 #6——消「逐批重读」歧义）**：目录读点 = **每 run 一次**（装配期 B-3 同点——`loadRules(cwd)` 单次调用 + 分类）；结果缓存于 `agent._rules`（`{ always, scoped }`）；JIT 判定只读该缓存（零重读盘）。去重集 `agent._rulesInjected` 惰性初始化（`??= new Set()`）——顶层 agent 单例 ⇒ 去重域 = 会话；子代理 agent 每 run 新对象 ⇒ 去重域 = 该子回合。
- **B-5 判据**：见 §2.5 命令 3（T-B1/T-B2/T-B3/T-B4）。
- **B-6 边界**：CLI 端不读 `.cursor/rules`（**登记**，非缺陷）· `description`-only 不注入（登记）· 不做规则热重载（**每 run 读一次目录**——分类缓存载 `agent._rules`，B-3 / B-4 共用该次读取，见 B-4）· 不做规则优先级 / 互斥仲裁（多规则命中 = 全注入，按名排序稳定）· webview 零改（无 UI 面）· 不引入 Cursor 的 `@-mention` / agent-requested 机制。

### 2.2 #132 ① —— Retry 询问改「仅 y/n」（去 `a` 键整会话 AUTO 副作用）

- **裁定承接**：用户 2026-09-20 05:32 = 选项①「与 `continue` 同形（仅 y/n）+ 同轮收正设计行」；②（另开 retry 分支）/ ③（仅纳入用例）**不取**。
- **落点 1（判据单源）**：`thincoder-cli/src/tui/interaction.mjs` 新增导出 `isYesNoModal(name)`（`const YES_NO_MODALS = new Set(["continue", "retry"])`）+ 注释一句（`a` 不属该族键面）。**选此档的理由**：`key-modes.mjs` 已 import 该档（`QUESTION_CUSTOM`），`render-frame.mjs` → `interaction.mjs` 无环（实核：`interaction.mjs` 仅引 `ansi.mjs` + 核两档）。
- **落点 2（按键面）**：`thincoder-cli/src/tui/key-modes.mjs:43-45 / :61 / :67`——原 `isContinue`（单判据四用途）拆为：`yOnly = isYesNoModal(state.permission.name)`（`validKeys` / `answer === "a"` 的 AUTO 门 / `approved` 判据三处换 `yOnly`）∥ `isContinue`（仅保轨迹行豁免 `:69`——`retry` **保留** `[approved]` / `[denied]` 轨迹行，与 continue 面不同：continue 有自有输出行、retry 无）。
- **落点 3（框面）**：`thincoder-cli/src/tui/render-frame.mjs:326-328`（标题）与 `:351-354`（提示行）按 `isYesNoModal` 分流：`retry` ⇒ 标题 ` Retry? (y/n) ` · 提示行 ` y: retry │ n: stop`（`continue` 两字面零改；通用框与 batch 框零改）。
- **判据**：见 §2.5 命令 1（T-R1/T-R2/T-R3/T-R4）。
- **边界**：不动 `ContinueError` 面 · 不动 batch 框（`a/o/n`）· 不动通用权限框（`y/n/a` + `a` = AUTO 语义保持）· 不新增模态 / 不新增 TUI 组件 · 不改 `state.permission` 载具形态。

### 2.3 #132 ② —— provider 原文余行 = log-only（表面零膨胀）

- **裁定承接**：父侧 05:32 = 只入日志 + **不增 UI 行**（诊断面保住 · 表面零膨胀）。
- **落点**：`thincoder-cli/src/tui/agent-turn.mjs` 非中止 provider 失败分支（`:229-233` 邻位）——`logEvent("err:provider", { err: errLine, head: restLines })`：`errLine` = 既有脱敏首行（复用，不重算）· `restLines` = 余行（`rawMsg.split("\n").slice(1)`）合单行（` / `）⇒ **同过脱敏管道**（`PROVIDER_URL_RE` ⇒ `[endpoint]`——与 `err` 同式）⇒ 自限 ≤200 字符（超限尾随 `…`；**先脱敏后截断**——防截断留 URL 残段）。自限理由：`err` 200 + `head` 200 + 固定字段 ≈ 460 < 512 硬限（`log.mjs` NF-L2）。
- **脱敏面定论（评审 #4）/ 空余行取值（评审 #7）**：`head` 与 `err` **同管道**——依据 = `LOGGING.md` §6.3 **D-LG4「URL 不入事件」**（规范面覆盖全部事件字段）+ T-L1「不含原 URL」无条件断言；否决「登记为例外」（与 D-LG4 相抵）。**无余行 ⇒ 传 `null` / `undefined`**（勿传空串——空串会落字段）。
- **字段预算依据**：`log.mjs:39-43`（字段帽 `head` ≤300 / `err` ≤200 / 其余 ≤120）+ `:126-131`（超 512 丢可选字段）⇒ 两字段布局为唯一不触丢字段的形态；**不新增字段帽键**（`log.mjs` 属核面——本批禁改）。
- **判据**：见 §2.5 命令 1（T-L1/T-L2/T-L3）。
- **边界**：不改 VSC（其诊断面 = `<details>` 折叠原文——已有）· 不加 dim 细节行 / 不加 `<details>` 对位（裁定明令）· 不动 `llm:error` 核事件（核面）· `PROVIDER_URL_RE` 双写现状不动（单源化 = 跨批结构面——登记不变）。

### 2.4 受影响文件表（行数 = 本席今日实读 · 含末行；新增档标「新」）

| # | 档 | 现读 | 预计增量 | 面 / 子项 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/agent/rules-face.mjs` | **新**（≈75） | +75（新档） | A 面（mergeFileRules / applyRuleTriggered）+ B 面（分类 / 块文 / JIT 匹配 / 去重）——两面判据单源 |
| 2 | `thincoder-vscode/src/agent/setup.mjs` | 489 | **+5**（494） | A-1/A-2/B-3（cfg 读 2 + agentFields 1 + import 1 + 尾块调用 1）——**拆分复核见下** |
| 3 | `thincoder-vscode/src/agent.mjs` | 479 | **+8**（487） | A-3（Set 1 + chat 选项 2 + 分支 4 + import 1） |
| 4 | `thincoder-vscode/src/agent/run-stages.mjs` | 402 | **+1 / −1**（402） | A-4（warnings 文案 + 注释） |
| 5 | `thincoder-vscode/src/agent/execute-tools.mjs` | 407 | **+8**（415） | B-4（import 1 + 派发前注入 6 + 注释 1） |
| 6 | `thincoder-vscode/src/extension/rules.mjs` | 116 | **+22**（138） | B-1（目录收敛 / `alwaysApply` / 头注） |
| 7 | `thincoder-vscode/src/agent/agent-state.mjs` | 149 | **0** | A-2 经 `agentFields` 展开自动承接（**实核后零改**） |
| 8 | `thincoder-vscode/test/vsc-stream-rules.test.mjs` | **新**（≈130） | +130（新档） | A 面用例（T-A1…T-A4——T-A4 随 fix 轮补，评审 #3） |
| 9 | `thincoder-vscode/test/scoped-rules.test.mjs` | **新**（≈140） | +140（新档） | B 面用例（T-B1…T-B4） |
| 10 | `thincoder-vscode/test/files.mjs` | 117 | **+2**（119） | 两新档登记行 |
| 11 | `thincoder-cli/src/tui/interaction.mjs` | 137 | **+9**（146） | ① 落点 1（`isYesNoModal` 单源） |
| 12 | `thincoder-cli/src/tui/key-modes.mjs` | 293 | **+4**（297） | ① 落点 2（yOnly 拆判据 + 头注） |
| 13 | `thincoder-cli/src/tui/render-frame.mjs` | 403 | **+7**（410） | ① 落点 3（标题 / 提示行 + import） |
| 14 | `thincoder-cli/src/tui/agent-turn.mjs` | 367 | **+9**（376） | ② 落点（logEvent + restLines 自限 + 注释） |
| 15 | `thincoder-cli/test/provider-error-surface.test.mjs` | 120 | **+55**（175） | ①/② 用例扩档（T-R1…T-R4 · T-L1…T-L3） |
| 16 | 设计档三档（已落） | — | — | WORKSPACE.md / LOGGING.md / TUI.md（§2.0） |

- **行数门 / 拆分复核（逐档审视——评审 #5 收正；数值 = 本席设计轮实读，含末行）**：
  - `setup.mjs` 494（**>300 咨询线 standing** · 距 500 硬限 **6** 行）——改动面 = 配置透传 3 行 + 触达 2 行（非新职责族）⇒ **本轮判「不动」**；**复核触发** = 下次触碰后 >497 或新增注入族 ⇒ 拆分候选 = 配置读段 → `agent/setup-config.mjs`。
  - `agent.mjs` 487（距硬限 **13**）——改动面 = 循环内分支（Set 1 + chat 选项 2 + `ruleTriggered` 分支 4 + import 1——非新职责 / 未新增模块级函数）⇒ **不动**；复核触发 = 下次触碰后 >495 ⇒ 拆分候选 = 响应后处理段（builtin / interrupt / reminders）→ `agent/response-stages.mjs`。
  - `run-stages.mjs` 402（+1/−1）——改动面 = 一行文案 + 注释（非新职责）⇒ **不动**；复核触发 = 下次触碰后 >450 ⇒ 拆分候选 = 压缩检查段（`runCompactionCheck`）。
  - `execute-tools.mjs` 415——改动面 = 派发前一处注入调用 + import（非新职责）⇒ **不动**；复核触发 = 下次触碰后 >450 ⇒ 拆分候选 = 批权限收集段（`collectBatchPermission`）。
  - `render-frame.mjs` 410——改动面 = 框面分流两处 + import（非新职责）⇒ **不动**；复核触发 = 下次触碰后 >450 ⇒ 拆分候选 = 状态栏段（`renderStatus`）。
  - `agent-turn.mjs` 376——改动面 = 失败分支一条 `logEvent` + 注释（非新职责）⇒ **不动**；复核触发 = 下次触碰后 >450 ⇒ 拆分候选 = 错误面段（provider 失败面族）。
  - **余档均 <300**：`key-modes.mjs` 297（余量 3）· `interaction.mjs` 146 · `extension/rules.mjs` 138 · `files.mjs` 119 · 新叶 ≈75 / 两新测试档 ≪300 ✓。

### 2.5 验收命令与先红后绿（cmd.exe · 全 ASCII · 无中文 `findstr /c:`）

```
1  cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/provider-error-surface.test.mjs
2  cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/vsc-stream-rules.test.mjs
3  cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/scoped-rules.test.mjs
4  cd /d D:\teamcode\thincoder\thincoder-vscode && node test/run.mjs
5  cd /d D:\teamcode\thincoder\thincoder-cli && node test/run.mjs
6  cd /d D:\teamcode\thincoder\thincoder-core && node test/run.mjs
7  cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .
8  node -e "const fs=require('node:fs'),p=require('node:path'),o=require('node:os'),d=p.join(o.homedir(),'.thincoder','logs'),f=fs.readdirSync(d).sort().pop();for(const l of fs.readFileSync(p.join(d,f),'utf8').split('\n'))if(l.indexOf('err:provider')>=0)console.log(l)"
```
（命令 1 现盘基线 = **3/3 pass**（本席今日实跑）；命令 8 = 真跑故障后的人读核验面，非判据闸。）

**先红后绿路径（逐项明示）**

| 子项 | 先红（断言级——非导入错误） | 转绿条件 |
|---|---|---|
| A（#130） | 实现轮**先落最小占位**（新叶导出空实现 / 原样透传）→ 落 T-A1…T-A4 → 跑红：T-A1 规则未并入（`agent.config.agent.streamRules` 空）· T-A2 命中规则后 history 零提醒 ∧ 无重入 · T-A3 子回合零提醒 · T-A4 注入文案仍为 `warnings from your last response`（未收正） | 接线落定 ⇒ 命令 2 全绿 |
| B（#130） | 同上占位 → T-B1…T-B4 → 跑红：常驻集块零命中（systemPrompt 不含规则名）· 作用域集命中路径后 history 零注入 · 二次命中重复注入 | 实现落定 ⇒ 命令 3 全绿 |
| ①（#132） | `a` 键用例先红（现盘 `a` ⇒ `agent.autoApprove === true` ∧ resolve(true)）；框面用例先红（现提示行 = ` y: approve │ n: deny │ a: approve all (AUTO)`） | key-modes / render-frame 落定 ⇒ 命令 1 全绿 |
| ②（#132） | 日志用例先红（现盘无 `err:provider` 事件） | logEvent 落定 ⇒ 命令 1 全绿 |

**用例判据（逐条可机检）**

- **T-A1**（装配合并）：临时 cwd 含 `.thincoder/rules/r1.md`（`pattern` 规则）+ config 两规则 ⇒ 合并结果 = 文件规则置前 ∧ 同 `pattern` 只留文件侧（镜像 CLI `make-agent.mjs:44-48`）；无目录 ⇒ 原样返回（**恒等**断言）。
- **T-A2**（abort 动作 · 端到端 · 可观测副作用判据——评审 #9）：`globalThis.fetch` 桩 SSE（先例 = `thincoder-vscode/test/provider-timeout-semantics.test.mjs:49-53` 假流族）产出命中 `pattern` 的文本 + `action: "abort"`（规则夹具 `repeat: "once"`）⇒ 断言 ① 请求计数 = 2（循环重入——`continue` 分支生效）② history 出现 `[System reminder — stream rule "r1": …]` ∧ 部分输出已入 history ③ 第二次响应再命中同 `pattern` ⇒ **不再重入**（请求计数不增至 3——`firedPatterns` 去重生效）。**观测缝记明**：`chat` 载荷形（`streamRules` / `firedPatterns`）不经 HTTP 体 ⇒ fetch 桩不可见——判据 = 载荷生效的端到端效果（① = 载荷到位的最强可观测证据）。
- **T-A3**（子回合继承）：以父 config 派生子 agent（核 `subagent-spawn.mjs`）⇒ 子 `agent.config.agent.streamRules` 非空（继承判据）。
- **T-A4**（warn 面 · 文案逐字——评审 #3 补）：warn 规则（`action: "warn"` + `pattern`）命中 ⇒ ① 请求计数 = 1（warn 不重入）② history 出现逐字 `stream rule warnings from your last response` ∧ `- <name>: <message>`。**现盘先红读数** = VSC `src/agent/run-stages.mjs:58` 逐字为 `warnings from your last response`（差 `stream rule` 两词）。
- **T-B1**（读取与分类）：`alwaysApply: true` ⇒ 常驻集；无 frontmatter 且无 `globs` ⇒ 常驻集；`globs` 有值 ⇒ 作用域集；仅 `description` ⇒ **两集皆无**；**`alwaysApply: true` + `globs: "*.py"` ⇒ 常驻集**（优先级面——不进作用域集，评审 #2）；`.thincoder/rules/` 内容**不被**读取（目录收敛断言）。
- **T-B2**（常驻集）：临时 cwd 含常驻规则 ⇒ systemPrompt 含 `Project rules (.cursor/rules):` ∧ 规则名与正文；无 `.cursor/rules` ⇒ systemPrompt 逐字同修前。
- **T-B3**（JIT 注入）：作用域规则 `globs: "*.py"` + 工具批含 `read` 目标 `a.py` ⇒ 派发前 history 出现该规则提醒；同会话二次 `read b.py` ⇒ **零新注入**（会话级去重）；不匹配路径（`a.md`）⇒ 零注入。
- **T-B4**（CLI 无对位 · 登记面）：`thincoder-cli` 树对 `.cursor/rules` 零读点（源码扫描断言——本批不改 CLI）。
- **T-R1**（① 键面）：`state.permission = { name: "retry" }` ⇒ 按 `a`：`agent.autoApprove` 仍 false ∧ `_pendingReminders` 零增 ∧ `state.permission` 仍在 ∧ resolve 未被调用；按 `y` ⇒ resolve(true)；按 `n` / Esc ⇒ resolve(false)。
- **T-R2**（① 端到端）：沿用现档 rig（`runAgentTurn` 注入首抛）——`retry` 框 `n` ⇒ 单调用 + `[error]` 保留；`y` ⇒ 重入（`resume=true` + 新 signal）；`a` ⇒ **不重入**（键被吞 ⇒ 悬挂态由 T-R1 断言，rig 收尾走 `n`）。
- **T-R3**（① 框面字面）：`renderRows`/`renderStatus` 输出含 ` y: retry │ n: stop` ∧ 标题含 ` Retry? (y/n) `；`continue` 框两字面零改；通用框仍含 `a: approve all (AUTO)`。
- **T-R4**（① 回归）：通用 permission 框 `a` ⇒ `autoApprove === true` ∧ 推 AUTO reminder（既有语义零回归）；batch 框 `a/o/n` 零改。
- **T-L1**（② 日志 · 脱敏覆盖面——评审 #4）：`THINCODER_LOG_DIR=临时目录` + 两行原文（**第一行含 URL**；**第二行含标记串 + 另一 URL**）⇒ 目录内新增日志行含 `"ev":"err:provider"` ∧ `err` 含 `[endpoint]` ∧ `head` 含第二行标记 ∧ `head` 亦含 `[endpoint]` ∧ 整行**不含任一原 URL**（两行覆盖——`head` 同管道断言真正生效）。
- **T-L2**（② 边界）：单行原文 ⇒ `head` 字段**不在**（`logEvent` 丢 null/undefined——现状语义；**空串守卫**：传 `""` 会落字段 ⇒ 本用例可判，评审 #7）∧ 行全长 <512。
- **T-L3**（② 表面零膨胀）：多行原文 ⇒ 推入行仅 `[error]` 1 + 诊断 2 = 3 行（逐行断言）；字符串抛出 ⇒ `[error] boom` 单行（既有用例零回归）。

### 2.6 边界（本批不做）

- 不做：核面代码（`thincoder-core/**`——归 sync 批）· `scripts/**` · 归档 / 冻结批档 · 他批写域 · 需求档（上抛）· 两端 webview（零改）· provider 重试策略 / AUTO 机制 / batch 框语义 · 规则热重载 · 规则优先级仲裁 · Cursor `@-mention` / agent-requested 机制 · `PROVIDER_URL_RE` 单源化（跨批结构面——登记不变）。
- **hooks 族（台账 #122）非本批射程**——「用户配的 hooks 在 VSC 静默不生效」为同族不同面（另账）；本批规则接线不触 hooks 读面 / `hooks.mjs`（评审 #8）。
- 不删 `thincoder-vscode/src/extension/rules.mjs`（**接线取代删除**——见 B-0）。

### 2.7 上抛 / 登记 / 不一致处（逐条）

1. **需求条目（上抛 · 需求档 = 主 agent 笔）**：#130 为**能力面**，建议入需求档五要素——落点建议 `docs/core/requirements/WORKSPACE.md`（工作区约定板），内容 = ① stream 规则两端生效（含 VSC · 沿用 `agent.streamRules`）② `.cursor/rules` 三分类语义（常驻 / 作用域 JIT / `description`-only 不注入）③ 边界（CLI 不读 `.cursor/rules`）。本席只给建议文本，不落笔。
2. **落点（实现落定后收口轮）**：`docs/core/design/AGENT-LOOP.md` §A7/#78 行「VSC `src/**` 0 命中」现态句按实现收正（本批**不落**——避免把未实现态写成现态）。
3. **产品文本面**：`thincoder-vscode/AGENTS.md` 模块地图补新叶 `src/agent/rules-face.mjs`（产品文本面 ≠ 本席写域 · 同 #110 族）——**非阻塞**。
4. **不一致处（A5 · 附证据）**：
   - **(a)【已裁 2026-09-20 fix 轮】** 任务书句「与 CLI 侧 `loadRules` 的语义对齐」——**CLI 侧无 `loadRules`**（全仓 grep：该符号仅 `thincoder-vscode/src/extension/rules.mjs:23`；CLI 面 = 核 `thincoder-core/rules.mjs:22 discoverRules` + `streamRules` 消费）⇒ 父侧裁定：本席解读成立——按「CLI 侧规则**语义**」对齐（非符号级）；「钩子规则文件」措辞 = 父侧简报笔误（**本批无 hooks 面**——hooks 族 = #122，另账）。口径定稿见 §2.1。
   - **(b)【已裁 2026-09-20 fix 轮】** 台账 #130 标题只点 `.cursor/rules`；实况含**两条**面（stream 面在 VSC 亦零消费 = #78/A7 已裁未落）⇒ 父侧裁定：本批两面同收——A 面（stream 规则两端生效）+ B 面（`.cursor/rules` 本体）；能力面收口以本 §2.1 为准。
   - **(c)** `docs/core/design/WORKSPACE.md` §2.2 #171「融合：取一侧」与 U1 裁定（选项②「两端保留两套语义」）及两档**非同一职责**（实读）相抵 ⇒ **已当场加现状注**（一致性面 · 逐条登记）；`CORE-UNIFICATION.md` #171 同名行（该档 §2.5 原表）未动——如需同轮加注请父侧裁定写域。
   - **(d)【已裁 2026-09-20 fix 轮】** 本档 §1 标题「VSC 行为/能力两则批（#130 + #132 · VSC 端）」——#132 ①/② 实为 **CLI 端**面（口径差）⇒ 父侧裁定：登记维持、无动作（§1 = 父侧段，标题订正权在父侧）。
   - **(e)** `thincoder-vscode/src/extension/rules.mjs:2-13` 头注自述读两目录 ⇒ 与本批「单目录」定义相抵 ⇒ **实现轮随改**（设计定义已落 `WORKSPACE.md` §2.3）。
   - **(f)** 文档债面：VSC 侧规则/`loadRules` 在 `docs/vsc/design/*` 无登记（唯 `thincoder-vscode/docs/_archive/COMPETITIVE_ANALYSIS.md:126` 自述「自研 + .cursor/rules 兼容」= 归档面）⇒ 无对位文档债需收正。

### 2.8 交付回指（三链一致）

| 本批条目（§1.1） | 设计（本 §2） | 验收（§2.5 判据） |
|---|---|---|
| #130 VSC `loadRules` 接线（正确面判定） | §2.1（A 面 A-1…A-6 ∥ B 面 B-1…B-6 · 结论 + 依据） | T-A1…T-A4 · T-B1…T-B4（命令 2/3/4/6） |
| #132 ① Retry 改仅 y/n | §2.2（落点 1–3 + 判据 + 边界） | T-R1…T-R4（命令 1/5） |
| #132 ② 原文余行 log-only | §2.3（落点 + 字段预算 + 判据） | T-L1…T-L3（命令 1/5/7/8） |

### 2.9 fix 轮（设计评审轮 1 · §3 发现表 10 条逐条落 · 2026-09-20）

**轮次**：fix（定点 · 追加制）· **作者**：eng-designer · **任务书** = 本档 §3 发现表全段（VERDICT = pass 后定点修正）· **处置执行人** = 本席（`Suggestion` 列 = 评审员建议；父侧已逐条裁定接受——含 #8 口径裁定）。§2.0–§2.8 内被定点修正的面 = 本轮就地收正（不另立副本）。

**逐条落（发现号 → 落点 → 处置）**

| # | 类别 | 落点（行号以回读为准） | 处置 |
|---|---|---|---|
| 1 | 🟡 变更溯源 | `docs/core/design/LOGGING.md` 变更记录 | 补 1 条（批名 + #132② + 落点 + 设计源——形制同 `WORKSPACE.md` / `TUI.md` 同批条） |
| 2 | 🟡 分类判据 | §2.1 B-2 + `docs/core/design/WORKSPACE.md` §2.3 + §2.5 T-B1 | 三分类改**按序判定（互斥）**：`alwaysApply` 先判 ⇒ `globs` 同在不改分类；T-B1 补一例（`alwaysApply: true` + `globs: "*.py"` ⇒ 常驻集） |
| 3 | 🟡 A 面 warn 覆盖 | §2.1 A-5 + §2.5（新增 T-A4 + 先红表 A 行） | 补 **T-A4**：warn 命中 ⇒ 注入文案逐字 `stream rule warnings from your last response`（现盘先红读数 = VSC `run-stages.mjs:58`） |
| 4 | 🟡 日志脱敏面 | §2.3（落点 + 定论行）+ §2.5 T-L1 + `LOGGING.md` §6.2 | 定论 = `head` **同过脱敏管道**（`PROVIDER_URL_RE` ⇒ `[endpoint]`；依据 `LOGGING.md` §6.3 D-LG4「URL 不入事件」）；T-L1 夹具 URL 移入第二行 + 补 `head` 含 `[endpoint]` / 整行不含原 URL 断言 |
| 5 | 🟡 拆分复核 | §2.4 行数门段 | >300 六档**逐档结论**（`setup.mjs` / `agent.mjs` / `run-stages.mjs` / `execute-tools.mjs` / `render-frame.mjs` / `agent-turn.mjs`）+ 余档 <300 一句 |
| 6 | 🔵 读点 / 缓存载体 | §2.1 B-4 + B-6 | 写死：读点 = **每 run 一次**（装配期 B-3 同点）+ 缓存载体 = `agent._rules`（`{ always, scoped }`）；JIT 只读该缓存（零重读盘） |
| 7 | 🔵 `head` 空余行取值 | §2.3 定论行 + §2.5 T-L2 | 写死「无余行 ⇒ 传 `null` / `undefined`（勿传空串）」；T-L2 补空串守卫判据 |
| 8 | 🟡 范围 / 协调 | §2.6 + §2.7 4(a)/(b)/(d) | §2.7 三处回写 **【已裁 2026-09-20 fix 轮】**（口径定稿 = A 面 + B 面；「钩子规则文件」措辞 = 父侧简报笔误 ⇒ 本批无 hooks 面）；§2.6 补 #122 hooks 族显式列名（非本批射程） |
| 9 | 🔵 T-A2 观测缝 | §2.5 T-A2 | T-A2 改**可观测副作用判定**（请求计数 = 2 / history 提醒 / `repeat: "once"` 不再重入）+ **观测缝记明**（`chat` 载荷形不经 HTTP 体 ⇒ fetch 桩不可见） |
| 10 | 🔵 `§9 体量` 悬空引用 | `WORKSPACE.md` 首部 + 变更记录 · `LOGGING.md` 首部 + 变更记录 ×2 | 取**「删引用」**（补 §9 会复活已废的体量节——2026-09-16 文档行数规则废除批）；节区 `§6–§9` → `§6–§8`、历史 §9 指称删除 |

**D8 自查（现役规范面禁修订式残句）**：本轮所改各面（本档 §2 · 三设计档）规范面无 `~~strikethrough~~` / 「原 X ⇒ 改 Y」 / 木乃伊化「作废」标；清理动作只落**废止面**（§9 残引 = 已失效表达，直接删）与**记录面**（各档变更记录 + 本表）。三设计档规范面新句 = 状态句（非修订句）。

**机检读数（写后）**：`node scripts/doc-check.mjs --root .` = exit 0 · 悬空 0 · 行宽 0（与写前基线同级）。逐条可机检断言 + 实跑读数 = 交付报告（C1 / C2 / C3）。

**不改面**：本档 §1 / §3–§6（他人段）· 产品码（实施面）· 需求档 · `scripts/**` · 他批写域。`docs/cli/design/TUI.md` **零改**（#4 的 `head` 管道细节归 `LOGGING.md` §6.2 单源——TUI.md §4.3 已以指针表述，D2 不重述）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面**：批次档 §2 全段 + 已落设计档三面（`WORKSPACE.md` §2.3 · `LOGGING.md` §6.2 · `TUI.md` §2+§4.3）｜依据 = 四档全文实读 + 档内互核（产品码在评审面外 ⇒ 源码 `file:line` 引证与现读行数未逐条复核；台账 #130/#132 evidence 行不在评审面 ⇒「逐条 evidence」粒度不可核）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性（声明 vs 实况） | 🟡 | 批次档 §2.0（:39）声明「设计档面 = 随落随记（本席已落）…各档变更记录 1 条」，但 `LOGGING.md` 变更记录实况无本批条目（全档 `09-20` 0 命中；`WORKSPACE.md:108` / `TUI.md:599` 各 1 条）⇒ §6.2 新增 `err:provider` 无变更溯源行 | 在 `LOGGING.md` 变更记录补 1 条（形制同 `WORKSPACE.md:108` / `TUI.md:599`：批名 + #132② + 落点 + 设计源） |
| 2 | 清晰度（分类判据） | 🟡 | 三分类对 `alwaysApply: true` + `globs` 并存无优先级：批档:59（「`alwaysApply === true` 或（无 globs 且无 description）⇒ 常驻集；有 `globs` ⇒ 作用域集」）与 `WORKSPACE.md:51` 同句式——同一规则并中两集判据，而两集产物不同（每 run 系统提示词 ∥ 命中路径 JIT）；T-B1（批档:133）矩阵无该组合 | 在 B-2 / §2.3 写死优先级（如 alwaysApply 先判），并补 T-B1 一例（`alwaysApply: true` + `globs: "*.py"`） |
| 3 | 验收覆盖（A 面 warn 路径） | 🟡 | A 面判据集（批档:130-132 T-A1…T-A3；A-5 = 批档:52）只覆盖合并 / abort 端到端 / 子回合继承——`warn` 动作与 A-4 文案收正（`run-stages.mjs:52-60` ⇒ `stream rule warnings from your last response`，批档:51）无任何用例；§2.5 转绿条件「命令 2 全绿」对 warn 面无判据 | 补一条 A 面用例（warn 规则命中 ⇒ 下轮注入文案逐字比对，如 T-A4），或写明「warn 面以核既有用例为判据」的口径 |
| 4 | 需求/一致性（日志面脱敏） | 🟡 | `head` 脱敏面无定义：批档:77 只对 `err`（脱敏首行）写脱敏，`head` = 原文余行合单行**原文照录**；与 `LOGGING.md:97`（「URL 不入事件」）/`:114`（D-LG4）及 T-L1（批档:141）无条件断言「不含原 URL」相抵——T-L1 夹具把 URL 放首行，断言仅因首行脱敏而成立（余行是否实际含 URL 未复核——产品码在评审面外，unverified） | 写一句明确决定：`head` 与 `err` 同管道过 `PROVIDER_URL_RE`（`[endpoint]`），或登记为例外；若取同管道，T-L1 把 URL 移入第二行以真正覆盖 |
| 5 | 受影响文件表（>300 拆分复核） | 🟡 | 拆分复核段（批档:103）只对 `setup.mjs` 给结论；`agent.mjs` 487 / `execute-tools.mjs` 415 / `render-frame.mjs` 410 仅集体一句「>300 standing，非本批引入」，`agent-turn.mjs`（367→376，>300）完全未入复核段 | 对全部 >300 受影响源档逐档补一行结论（含 `agent-turn.mjs`），形制同 TUI.md §6.8.3.4（zero-block 批）逐档审视结论 |
| 6 | 清晰度（B-4 读取/缓存点） | 🔵 | B-4（批档:61）JIT 匹配所需规则集的读点与缓存载体未写：与 B-6（批档:63）「不做规则热重载（每 run 读一次目录）」并置——按字面逐批重读与「每 run 一次」相抵，只读一次则缓存面（挂何处）缺位 | 在 B-4/B-6 写明读点与缓存载体（每 run 分类一次 + 结果缓存于 `rules-face` / agent 字段），供实现轮照落 |
| 7 | 清晰度（head 取值语义） | 🔵 | 落点算式（批档:77）`rawMsg.split("\n").slice(1)` 合单行对单行原文得空串；T-L2（批档:142）要求 `head` 字段**不在**（据「丢 null/undefined——现状语义」）⇒ 空余行取值在落点与用例间表述不一致 | 落点补一句「无余行 ⇒ 传 null/undefined（勿传空串）」 |
| 8 | 范围/协调 | 🟡 | A 面源自 #78/A7（2026-09-13 已裁未落）而 #130 台账标题只点 `.cursor/rules`；任务书「`loadRules` / 钩子规则文件」措辞歧义（§2.7 4a/4b/4d 已自登记，批档:156-157/159）；同族 #122（hooks 面，批档:47 引为族证据）未在 §2.6 边界（批档:147）显式列名 | 确认本批两面口径（含「钩子」所指是否含 hooks 面）并回写 §2.7 登记（设计面不改） |
| 9 | 验收可观测性（T-A2） | 🔵 | T-A2（批档:131）断言含「`chat` 载荷携 `streamRules`/`firedPatterns`」，但观测手段只写 `globalThis.fetch` 桩（HTTP 层）——若 VSC `agent.mjs` 直引核 `chat`（ESM 绑定不可注入），该断言无观测缝（同用例的 history 提醒 / 重入 / 部分输出已可端到端证明接线） | 改写为可观测副作用断言，或写明观测缝（模块级注入点 + `??` 默认回落） |
| 10 | 文档卫生（pre-existing） | 🔵 | `WORKSPACE.md:8` / `:106` 与 `LOGGING.md:8` / `:152-154` 引用「§9 体量」，两档实况均为 §1–§8 + 变更记录（无 §9）——悬空引用（非本批引入） | 补 §9 或删引用（低优先；可并入文档面收口批） |

**VERDICT: pass**

计数：🔴 0 · 🟡 6 · 🔵 4（合计 10 条）。

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

### 5.1 交付摘要（eng-coder · 实施轮 initial · 2026-09-20）

**结论**：§2 任务书 12 条修正后定稿条款**全部落定**，无 PartB、无简化交付；A 面（stream 规则两端生效）· B 面（`.cursor/rules` 作用域规则）· #132 ①② 四组判据（T-A1…A4 / T-B1…B4 / T-R1…R4 / T-L1…L3）逐条有对位用例。**先红后绿**：最小占位 → 落用例 → 断言级红（读数见 §5.3）→ 实现 → 复跑绿（读数见 §5.3/§5.4）。**机检**：锚 0 悬空 · 行宽 0（净增 0）。

### 5.2 改动清单（设计点 → file:line → Δ）

| 设计点 | 档 → 落点 | Δ（实读） |
|---|---|---|
| A-1/A-3 + B-2/B-3/B-4 判据单源 | `thincoder-vscode/src/agent/rules-face.mjs`（新）——`mergeFileRules:18-24` · `applyRuleTriggered:30-36` · `classifyRules:47-55` · `loadScopedRules:56-58` · `scopedRulesBlock:63-68` · `PATH_TOOLS:71` · `matchCandidates:76-84` · `injectScopedRules:94-116` | 新档 117 行 |
| A-1 cfg 读 + A-2 透传 | `agent/setup.mjs:40`（import）· `:219`（声明）· `:242`（`mergeFileRules`）· `:261`（`agentFields.streamRules`） | +6（489→496） |
| B-3 常驻集尾块 + B-4 缓存载体 | `agent/setup.mjs:363-364`（`systemPrompt += scopedRulesBlock(agent, cwd)`——同点本 run 唯一一次目录读 + `agent._rules` 缓存） | 含上行 |
| A-3 消费接线 | `src/agent.mjs:18`（import）· `:180`（`streamRuleFired` Set）· `:281-282`（`streamRules` / `firedPatterns`）· `:334-338`（`applyRuleTriggered` → `continue`，位于 `injectResponseReminders` 之前） | +15（479→495） |
| A-4 文案收正 | `agent/run-stages.mjs:47-51`（头注删「本端无 stream rules」失效句）· `:59`（`stream rule warnings from your last response`——核逐字） | +1/−1（403） |
| B-4 JIT 注入 | `agent/execute-tools.mjs:25-26`（import）· `:90-97`（派发前 `injectScopedRules(agent, history, ruleCalls)`） | +11（418） |
| B-1 读取面收正 | `src/extension/rules.mjs`——头注重写（单目录 `+ 三分类）· `loadRules:36-58`（`.cursor/rules` 单读 + `alwaysApply: meta.alwaysApply === "true"` :48）· `:53` `source: ".cursor/rules"` | +8（116→124） |
| A-2 自动承接 | `agent/agent-state.mjs` | **0 改**（`agentFields` 展开自动落 `agent.config.agent.streamRules`——实核） |
| ① 判据单源 | `thincoder-cli/src/tui/interaction.mjs:13-16`（`YES_NO_MODALS` + `isYesNoModal`） | +5（137→143） |
| ① 按键面 | `src/tui/key-modes.mjs:10`（import）· `:45-50`（`yOnly` 拆判据：validKeys）· `:66`（AUTO 门）· `:72`（approved 判据）· `:74`（`isContinue` 仅保轨迹行豁免） | +13/−9 |
| ① 框面 | `src/tui/render-frame.mjs:16`（import）· `:327-331`（标题：` Retry? (y/n) `）· `:354-359`（提示行：` y: retry │ n: stop`） | +9/−2（403→409） |
| ② log-only | `src/tui/agent-turn.mjs:231-237`（余行合单行 → 同过 `PROVIDER_URL_RE` → 自限 ≤200 → `head`；无余行传 `null`） | +7（368→375） |
| 用例（A/B） | `test/vsc-stream-rules.test.mjs`（新 142 行 T-A1…A4）· `test/scoped-rules.test.mjs`（新 152 行 T-B1…B4）· `test/files.mjs:116-117`（登记） | 新档 ×2 +2 |
| 用例（①②） | `test/provider-error-surface.test.mjs`（T-R1…R4 + T-L1…L3；原 3 例零改） | +167（120→287） |
| 清单外（见 §5.5） | `test/context-parity.test.mjs:281`（T-CI-7 旧字面锁 → A-4 新字面） | +1/−1 |

**未改面**（边界核）：核 `thincoder-core/**` 零改 · `scripts/**` 零改 · 需求档/设计档零改 · webview 零改 · `agent-state.mjs` 零改 · `PROVIDER_URL_RE` 双写维持（登记不变）。

### 5.3 先红后绿读数（断言级 · 非导入错误）

| 子项 | 先红读数（实现前） | 复跑绿读数（实现后） |
|---|---|---|
| A（命令 2） | T-A1 `mergeFileRules` 原样透传 ⇒ 首项 = `cfg-dup`（非 `r1`）· T-A2 请求计数 = **1**（应 2——未重入）· T-A3 `parent.config.agent.streamRules` = `undefined` · T-A4 事件链零 `stream rule warnings` 文案（实读 `["task","[System reminder: current time …","WARNME hit"]`） | 命令 2 = **4/4 pass** |
| B（命令 3） | T-B1 分类集为空（`[]`，实读）· T-B2 无 `Project rules (.cursor/rules):` 块 · T-B3 命中路径零注入（实读 history = `["tool-output"]`）· T-B4（登记面）绿 | 命令 3 = **4/4 pass** |
| ①（命令 1） | `a` 键 ⇒ `resolve` 被调（实读 1，应 0）+ `autoApprove` 翻转；端到端 `a` ⇒ 重入（实读 calls = 2，应 1）；框面断言「retry 标题逐字」= false | 命令 1 = **10/10 pass** |
| ②（命令 1） | 无 `err:provider` 事件（`entry` = undefined，T-L1/T-L2 红）；T-L3（表面零膨胀锁）先/后皆绿（回归锁） | 含上行 |

### 5.4 验收命令读数（命令 1–8）

| # | 命令 | 读数 |
|---|---|---|
| 1 | `node --test test/provider-error-surface.test.mjs`（cli） | tests 10 / pass 10 / fail 0 |
| 2 | `node --test test/vsc-stream-rules.test.mjs` | tests 4 / pass 4 / fail 0 |
| 3 | `node --test test/scoped-rules.test.mjs` | tests 4 / pass 4 / fail 0 |
| 4 | `node test/run.mjs`（vscode） | tests 847 / pass 847 / fail 0 / cancelled 0 |
| 5 | `node test/run.mjs`（cli） | tests 745 / pass 745 / fail 0 |
| 6 | `node test/run.mjs`（core） | tests 435 / pass 435 / fail 0 |
| 7 | `node scripts/doc-check.mjs --root .` | exit 0 · `OK(锚): 0 条悬空` · `OK(行宽): 源域全部 .md 无 >300 字符单行`（净增 0） |
| 8 | 真跑故障面人读核验（非判据闸） | 用户日志域最新档 0 条 `err:provider`（本改动后尚无真故障）——字段形由 T-L1/T-L2 隔离目录实证 |

### 5.5 决策透明表（实现面细化 / 偏离，逐条报）

| # | 项 | 处置 | 理由 |
|---|---|---|---|
| 1 | B-4 路径候选归一（设计公式 `touchedPaths ?? [args?.path]` **之上**） | `matchCandidates:76-84`——绝对路径归一出 cwd 相对候选（前缀比对**大小写不敏感** + 剥前导 `./`） | 设计公式下 `read` 收绝对路径（本仓文档惯例 `D:\teamcode\…`）时 `*.py` 永不命中 ⇒ 设计意图「命中路径」落不了地；归一为**超集**（只增命中）。**上抛 §5.7-1**（设计档未记该步） |
| 2 | `scopedRulesBlock(agent, cwd)` 签名（设计行文 `scopedRulesBlock(cwd)`） | 增 `agent` 形参 | B-4 要求「读点 = 每 run 一次 + 缓存 `agent._rules`」——同点完成读+分类+缓存，setup 侧净 +1 行 |
| 3 | `head` 余行合单行 | `split("\n").slice(1).map(trim).filter(Boolean).join(" / ")`（设计算式为 `slice(1)` 合 ` / `） | 纯空白余行 ⇒ `null`（合「无余行 ⇒ 传 null」精神）；先脱敏后截断（`agent-turn.mjs:235-237`） |
| 4 | T-L3 三行断言形态 | 取 `[error]` 起连续三行 deepEqual + 第 4 行限 `[denied] retry` 轨迹行 | 授权应答（`n`）会追加 retry 轨迹行（① 面既定）——断言面锁定「失败面恰三行」而不误伤轨迹行 |
| 5 | 清单外改动：`test/context-parity.test.mjs:281` | 旧字面 → A-4 新字面 | A-4 文案收正的**机械必然**（该例锁旧 VSC 措辞，不改即红）；设计 §2.4 表未列该档 ⇒ 本条为超清单披露（内审独立检出同一条，判定「机械必然」） |
| 6 | `thincoder-vscode/AGENTS.md` 模块地图未补新叶 | **不改**（设计 §2.7-3 登记「产品文本面 ≠ 本席写域 · 非阻塞」） | 写域边界；内审同判「非本轮 DOC-DRIFT」 |
| 7 | `applyRuleTriggered(agent, …)` 的 `agent` 形参保留（评审 #4） | 保留 + 注释声明留位（`:29`） | 设计 A-3 逐字四参调用形（批档 :50）；删参 = 偏离设计调用形 |

### 5.6 内审 + 代码评审轮次与终态

| 环节 | 轮次 | 读数 | 终态 |
|---|---|---|---|
| 内部偏差审计（explore · 只读） | 1 | **DEVIATIONS** = 2 条（均 🔵 低）：① 超清单 `test/context-parity.test.mjs`（已自报）② `matchCandidates` 归一未在两设计档登记；无 PARTIAL / 无 SILENT-SIMPLIFICATION / 边界零越 | 处置见 §5.5-1/5 |
| advisor 代码评审 | 轮 1 | **VERDICT: pass**（8 条：🟡×2 非 must-fix + 🔵×6；无 🔴） | — |
| fix 轮 1（承轮 1 发现 #1/#4/#5/#6/#8） | 1 | 5 项逐条落：① 归一 tolerant 化（`:77/81/82`）+ T-B3 绝对路径变体用例（`scoped-rules.test.mjs:129-133`）② `agent` 形参留位声明（`:29`）③ `glob.pattern` 边界登记（`:93`）④ 分支次序消歧注（`agent.mjs:336-337`，事实经核 `provider/sse.mjs:207/219-225` 复核）⑤ T-B4 `existsSync` 前置（`:140`） | 复跑：命令 2/3 = 8/8 · 命令 4 = 847/847 · 命令 5 = 745/745 · 命令 6 = 435/435 · 命令 7 = 0/0 |
| advisor 代码评审（fix 声明核验） | 轮 2 | **VERDICT: pass**（5 项 fix 声明逐项实读核验通过；新增 1 条 🔵 = 大小写不敏感比对为无条件、非阻塞；面内无新 🔴） | **clean（收敛）** |

**未修项（透明登记，均非 must-fix）**：`>300` 行 standing 各档照 §2.4 既定处置不动（`setup.mjs` 496 / `agent.mjs` 495——距 500 硬限 4/5 行，下次触碰即按既定拆分候选复核）· §2.4 行数表回填（记录面，归收口轮）· `alwaysApply` 严格 `"true"` 字面（与设计 B-2 具名一致，健壮性提示维持）。

### 5.7 上抛项（父侧 / 设计席面）

1. **设计档补记（阻塞面 = 无）**：`WORKSPACE.md` §2.3 / 批档 §2.1 B-4 建议补一句「绝对路径先归一为 cwd 相对（前缀比对不敏感）」——本席实现已落（§5.5-1），设计档为单源，须设计席笔。
2. **§2.4 表行数回填**：含 fix 轮增量（`agent.mjs` 487→495 · `provider-error-surface.test.mjs` 175→287 · `rules-face.mjs` ≈75→117）+ 补列 `test/context-parity.test.mjs`（A-4 波及档）。
3. **产品文本面**：`thincoder-vscode/AGENTS.md:43` 模块地图补 `src/agent/rules-face.mjs`（§2.7-3 已登记非阻塞）。
4. **设计档收正**：`AGENT-LOOP.md` §A7/#78「VSC `src/**` 0 命中」现态句（§2.7-2 明定收口轮）。
5. **行数余量警示**：`setup.mjs` 496 · `agent.mjs` 495（硬限 500）——下一批触碰任一档即触发 §2.4 既定拆分候选，建议父侧排期。
6. **并发写域提示（环境面）**：本轮实施期间工作树存在他批在途改动（核 `agent-tools/*` · `hooks.mjs` · `panel-turn-loop.mjs` · `sync-block-stop.test.mjs` 等，非本席写域）；三包全绿读数含他批在途态，收口轮复跑以定稿态为准。

### 5.8 §5.2 行数读数勘误（D6 回读复算 · append-only）

§5.2 的 Δ 列取材自「读窗末行号」，与 `wc -l`（换行计数）口径差分 ±1——以本行为准（脚本复算，非目测）：

| 档 | 实读 `wc -l` | §2.4 预计 | 差 |
|---|---|---|---|
| `thincoder-vscode/src/agent/rules-face.mjs`（新） | **116** | ≈75 | +41（注释/文档面密度高——判据单源含两面 + 四段 JSDoc） |
| `thincoder-vscode/src/agent/setup.mjs` | **495** | 494 | +1 |
| `thincoder-vscode/src/agent.mjs` | **494** | 487 | +7（含 fix 轮 2 行注释） |
| `thincoder-vscode/src/agent/run-stages.mjs` | **403** | 402 | +1 |
| `thincoder-vscode/src/agent/execute-tools.mjs` | **418** | 415 | +3 |
| `thincoder-vscode/src/extension/rules.mjs` | **124** | 138 | −14 |
| `thincoder-vscode/test/vsc-stream-rules.test.mjs`（新） | **141** | ≈130 | +11 |
| `thincoder-vscode/test/scoped-rules.test.mjs`（新） | **151** | ≈140 | +11 |
| `thincoder-vscode/test/files.mjs` | **119** | 119 | 0 |
| `thincoder-vscode/test/context-parity.test.mjs`（清单外） | **360** | —（§2.4 未列） | — |
| `thincoder-cli/src/tui/interaction.mjs` | **142** | 146 | −4 |
| `thincoder-cli/src/tui/key-modes.mjs` | **298** | 297 | +1 |
| `thincoder-cli/src/tui/render-frame.mjs` | **408** | 410 | −2 |
| `thincoder-cli/src/tui/agent-turn.mjs` | **374** | 376 | −2 |
| `thincoder-cli/test/provider-error-surface.test.mjs` | **287** | 175 | +112（T-R/T-L 七例逐条断言 + 夹具，超预计最多的一档） |

**行数门结论**（照 §2.4 触发线复核）：`setup.mjs` 495（触发线 >497——**未触发**，距硬限 5）· `agent.mjs` 494（触发线 >495——**未触发**，距硬限 6）· 余档均 <450 触发线；新档均 ≪300。**无拆分义务**。§5.7-5 的余量警示读数以本表为准（496/495 → **495/494**）。§5.2 的形态勘误：B-1 行「头注重写（单目录 `+ 三分类）」（两处反引号失衡，纯排版面）——语义 以上文 §5.2 同行为准。

## §6 验证与收口（父代理）

**2026-09-20 14:2x 父侧收口**

**交付核验（四道）**：设计轮（#49 · #130 判「接线=双面」A/B · #132 两则）✓ · 评审（id=51 · **pass** 6🟡·4🔵）✓ → **修正轮（#54）10/10** ✓ · **实施轮（#57 · eng-coder）**✓：A 面（stream 规则并入/传递/chat 选项/`ruleTriggered` 重入/warn 文案）/ B 面（`.cursor/rules` 单读 + 三分类按序 + 常驻尾块 + JIT 作用域注入 + 缓存 `agent._rules`）· ①（`isYesNoModal` 单源 + `yOnly` 拆 + 框面 ` Retry? (y/n) `）· ②（`err:provider`：`err`/`head` **同过脱敏管道** · 无余行传 `null` · 表面零膨胀）⇒ 三包 **847/745/435** 全绿 · advisor 两轮 pass · 终态 clean ✓

**读数**：先红逐面留痕（A 4/4 · B 3/4 · ① 三处 · ② T-L1/L2）→ 后绿（10/10 · 4/4 · 4/4）✓ · 命令 7 锛 0 · 行宽 0 ✓

**台账**：**#130 / #132 → 已核销** ✓

**遗留（显式）**：① 设计档补记：`WORKSPACE.md` §2.3 / §2.1 B-4 补「绝对路径先归一为 cwd 相对」句（设计席 · 无阻塞）；② §2.4 行数表回填（以 §5.8 实读为准）+ 补列 `test/context-parity.test.mjs`（清单外机械波及档 · 已披露）；③ 产品文本面：`thincoder-vscode/AGENTS.md:43` 模块地图补 `rules-face.mjs`；④ `AGENT-LOOP.md` §A7/#78「VSC 零消费」现态句收正（§2.7-2）；⑤ 行数余量：`setup.mjs` 495 / `agent.mjs` 494（硬限 500）⇒ 下一批触碰即按既定拆分候选复核。

**提交**：`0987f3ee`（26 档 · 已 push ✓）。
