# 2026-09-20 · 卫生族批（HYGIENE-SWEEP-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 14:3x · 来源 = 用户 14:29「**点火4条**」+ 台账 **#138 / #139 / #140**（三条均为今晚实作时撞见的**同因不同面**族）。
> 本档 = **指称/读数卫生**三则；不触行为面。

## §1 讨论（主 agent）

### 1.0 用户授权（**父侧代点火 + 代批准** · 时限 **到 2026-09-20 17:00**）

**用户原话**（14:40）：「**全自动跑到下午五点**」⇒ 授权窗口内，本批（及窗口内开立的其他批）链上的**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**（不必逐次请点）。

**父侧自缚（代签条件）**：① 仅当「**评审 pass（0 🔴）** ∧ **修正轮已落地并逐条核验** ∧ **token 已签发**」三条件齐备时代签；② 每次代签在 §4 写明「**父侧代签（用户 14:40 授权 · 窗口至 17:00）+ 依据**」（评审 id / 核验结论 / 发现处置表）；③ 超出窗口（17:00 后）到达任一硬门 ⇒ **停下等用户**；④ 需要**新范围**或**用户口径裁决** ⇒ 仍停下（不因授权而扩张射程）。

**状态行**：🔄 进行中（实施轮）

### 1.1 条目（3 条 · 三车道文件面互斥 ⇒ 可并行）

| # | 台账 | 条目 | 要点 |
|---|---|---|---|
| 1 | **#138** | **设计档头注「§6–§9」悬空节区族**（≥9 档：`CHECKPOINT`/`CONFIG`/`CONSULTATION`/`CONTEXT-COMPACTION`/`I18N`/`MCP`/`MEMORY`/`PROVIDER` `:8` + `PROMPT-SYSTEM.md:10`） | 各档实况 = §1–§8 + 变更记录（无 §9）——成因 = 行数规则废除批整节退役 §9；**同法先例 = `WORKSPACE.md:8`/`:107` 与 `LOGGING.md:8`/`:152-154`**（**删引用不补 §9**——补会复活已废规则 ✗）；**落批前先全域重扫**（原 grep 受 200 行上限截断 ⇒ 清单可能不全）。 |
| 2 | **#139** | **产品码注释陈旧节号族**（`thincoder-vscode/src/agent.mjs:97` 等引 `AGENT-LOOP.md §11`） | 现行 `docs/core/design/AGENT-LOOP.md` 无 §11（节次 §1–§8 + 变更记录）；该号仅存归档档 `thincoder-vscode/docs/_archive/design/AGENT-LOOP.md:444`；**口径 = 改指内对应节或删指称；`_archive` 引文可留** ✓。 |
| 3 | **#140** | **`VSC-DEBT` §12.1「现盘」块过时** | 四档读数漂移（`agent.mjs` **494** · `setup.mjs` **495** · `run-stages` **403** · `execute-tools` **418**）+ `test/files.mjs` **119** 现势回填；**须注「触发线未触」**（`agent.mjs` 线 >495 · `setup.mjs` 线 >497 —— **距硬限 500 各 6/5 行** ✓ 防后续误判）。 |

### 1.2 边界

- **不触**：行为面 / 产品逻辑（#139 只改注释 ✓）· `scripts/**` · 归档档内容（可引 ✓）· 冻结批档 · 他批写域。
- **口径统一**：三类 = **指称卫生**（对象已消失 ⇒ 改指或删；历史面可留引文 ✓）。

### 1.3 验收（方向）

① 逐条「台账 id → 改动 file:line 或判保留理由」；② **落批前重扫读数**（#138 清单闭合）；③ `doc-check` 净增 0（锚 0 · 行宽 0）；④ 计数/枚举自洽（D3）。

### 1.4 台账

#138 / #139 / #140 → 本批（在途）· 落定后核销。

## §2 批次任务与设计（eng-designer）

### 2.0 轮次与面判定

**轮次 = initial** · 任务书 = 本档 §1 全段 · 台账 = #138 / #139 / #140 · 设计 = 本节（单批施工材料随批档承载——承 `docs/core/design/DOC-CODE-RECONCILE.md` §5.2「单批施工材料不进长驻设计档」（`:375`）；不另立长驻设计档，零新语义）。
**面判定（实施路由）**：#138（12 设计档）与 #140（`docs/vsc/design/VSC-DEBT.md`）= **设计档面** ⇒ 设计席执行；#139（13 产品码档 · 仅注释面）= **产品码面**（fail-closed）⇒ eng-coder + token 门（走 §5）。全批零行为面改动。

### 2.1 #138 设计档头注「§6–§9」悬空节区族

**重扫闭合读数（as-of 2026-09-20 · 域 = `docs/**` 递归全扫）**

| 子类 | 读数 | 明细 |
|---|---|---|
| 头注节区「（§6–§9 · …）」 | **12 档**（原清单 9 档受 grep 200 行上限截断 ⇒ 重扫**新增 3 档**：`SESSION.md:8` · `TOOLS.md:9` · `TRACES.md:8`） | CHECKPOINT `:8` · CONFIG `:8` · CONSULTATION `:8` · CONTEXT-COMPACTION `:8` · I18N `:8` · MCP `:8` · MEMORY `:8` · PROVIDER `:8` · PROMPT-SYSTEM `:10` + 新增 3。全域仅此 12 处（`docs/cli` / `docs/vsc` / 需求档域 = 0 命中；`docs/cli/requirements/TUI.md:97` 唯一命中 = 已完成收正的沿革记录行，不入族；`docs/batches/**` 记录面命中不入族） |
| 变更记录 / 叙述「§9」片段 | **22 处 / 9 档** | CHECKPOINT `:209`/`:214` · CONFIG `:145`–`:149` · CONSULTATION `:249`/`:255` · CONTEXT-COMPACTION `:487`/`:496` · I18N `:84` · MEMORY `:542`/`:546`/`:550` · PROMPT-SYSTEM `:332` · PROVIDER `:420`/`:422`/`:424` · TRACES `:110`/`:111`/`:112` |
| 判保留（零改 · 三类） | **16 处 / 7 档** | 旧档节号：CONFIG `:35` · `:139` · CONTEXT-COMPACTION `:476`/`:482` · MEMORY `:509`/`:517` · SESSION `:384`/`:392`；活节 §9：PROMPT-SYSTEM `:320` · PROVIDER `:175`/`:201`/`:444` · TOOLS `:4`/`:528`；映射叙述：PROMPT-SYSTEM `:107`/`:115` |

**改法（删引用不补 §9）**

| # | 子类 | 改法 | 改后形态 / 样本 |
|---|---|---|---|
| 1 | 头注节区 12 档 | `（§6–§9 · …）` → `（§6–§8 · …）`（范围端点改实况；`^## 8` 全 12 档实核——其后 = 变更记录者 **10 档** + 例外 **2 档**（位点见下注）） | 逐档只改括号内端点。**TOOLS / PROMPT-SYSTEM 说明**：两档另有 v2 期重建的**新 §9**（TOOLS = checklist 废除 · PROMPT-SYSTEM = 反向引用）——不属 2026-09-14/15 B 轮机制面块（两档首部 v2 指针行按档分列——见下注）⇒ 头注照改 `§6–§8`；批档「各档无 §9」概括于此两档不成立（处置不变 · 见 §2.10 不一致 2） |
| 2 | 变更记录片段 22 处 | **纯删指称片段**（节名 + 读数），同句其余语义词逐字保留；挂接标点归一；**零注记**（承 `DOC-DISCIPLINE.md` §3.7 D-DD15） | CHECKPOINT `:209`「…· §8 **不并项与历史沿革** · §9 体量（低于软线，无需拆分）；来源 =」→「…· §8 **不并项与历史沿革**；来源 =」；CONFIG `:149`「§9 行数读数随收（152 → **153**）。」整片段删；MEMORY `:542`「…· §9 拆分表 +1 行（归一退场）；来源 =」→「…；来源 =」；TRACES `:112`「机制条文（§6–§9）零改」→「机制条文（§6–§8）零改」（范围形按头注同法 · 同先例 `LOGGING.md:153`） |
| 3 | 判保留 16 处 | 零改 | 判据 = 指称对象 ≠ 本档退役体量节（旧档节号 / 活节 / 映射叙述三类；同 2026-09-16 行数规则废除批「保留面」判据句） |
| 4 | 变更记录行 | 12 档各 +1 行（**不写「§9」字面**——同先例 `LOGGING.md:160`） | 「2026-09-20（**卫生族批 · 台账 #138 · eng-designer**）：首部机制面节区改 `§6–§8` + 历史节号指称清理（行数规则废除批残留）；设计源 = `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2。」（逐档适配既有行文体例） |

**例外 2 档位点与 v2 首部指针（`§6–§8` 括注限定面）**：`TOOLS.md`——§8 后另有活 §9（`:494` checklist 废除）· 变更记录 `:511` · 首部 v2 指针行 `:4` 指 §9；`PROMPT-SYSTEM.md`——§8 后另有活 §10（`:222`）与活 §9（`:322` 反向引用）· 变更记录 `:293` · 首部 v2 指针行 `:3` 指 §10。

**理由（不补 §9）**：补 §9 会复活已废体量节（用户 2026-09-16 裁定「文档不受行数限制」）；同法先例 = `WORKSPACE.md:8`/`:107` · `LOGGING.md:8`/`:152-154`（VSC 两则批已落）。
**边角**：12 档均为 `.md` ⇒ 受影响文件表不列行数列（条目 2 收正后口径）；逐档净增 = changelog 1 行 + 片段删除（净行数变化仅此）。

### 2.2 #139 产品码注释陈旧节号族（`AGENT-LOOP.md §11*`）

**族界定（重扫实核）**：族形 = 注释中与文档名紧邻的 `AGENT-LOOP(.md)? §11*`。两套旧编号同号：
- **VSC 侧** = VSC 自持 `AGENT-LOOP.md` §11「agent 生命周期对齐 CLI」（2026-09-08）——该档**已归档**（仅存 `thincoder-vscode/docs/_archive/design/AGENT-LOOP.md:444`）；现行核档该面**无对应节 ⇒ 无改指靶**。
- **core / cli 侧** = CLI `AGENT-LOOP.md` §11.x（R13 async advisor / R14 分域池 / D-24c 废弃记录）——现行住所 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.10「回合外事件后台化统一模型（分域池 + async advisor）」。

**闭合清单 = 16 处 / 12 档（注释面 · vsc 8 档 + core 3 + cli 1）**：

| # | 坐标 | 侧 / 编号 | 改法 | 改后样本（逐字） |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/agent.mjs:99` | VSC §11 | 删指称 | `// agent 生命周期对齐 CLI（2026-09-08）：顶层 agent 会话级单例复用。` |
| 2 | `thincoder-vscode/src/agent/setup.mjs:8` | VSC §11 | 删指称 | 头注 `* agent 生命周期对齐 CLI（2026-09-08）：setupAgentRun 拆出…` |
| 3 | `thincoder-vscode/src/extension/chat-panel.mjs:67` | VSC §11 | 删指称 | 头注同式清理 |
| 4 | `thincoder-vscode/src/extension/chat-panel.mjs:85` | VSC §11（+同行裸形） | 删指称（全形 + 同行裸形 `§11`） | `// 销毁点（切换边界守卫在上方 turnBusy() 检查——销毁安全）` |
| 5 | `thincoder-vscode/src/extension/chat-panel.mjs:101` | VSC §11（+同行裸形） | 同 4 | `// 销毁点（工作区兜底即换 cwd——agent 不跨项目复用）` |
| 6 | `thincoder-vscode/src/extension/panel-chat.mjs:42` | VSC §11（+同行裸形） | 同 4 | `/** 绑定判定（纯函数，单测锚点）：…` |
| 7 | `thincoder-vscode/src/extension/panel-chat.mjs:122` | VSC §11（+同行裸形） | 同 4 | `// 会话级顶层 agent 单例（2026-09-08）：ensureSlot 后绑定判定：…` |
| 8 | `thincoder-vscode/src/extension/panel-chat.mjs:201` | VSC §11.1③/F2 | 删指称（弃空括号） | `// F2（2026-09-08）：runOpts 不再搬运 engState/planMode 状态载荷` |
| 9 | `thincoder-vscode/src/extension/panel-project.mjs:40` | VSC §11（+同行裸形） | 同 4 | `// 销毁点（2026-09-08）：换项目 → 会话级 agent 销毁（AC4——agent` |
| 10 | `thincoder-vscode/src/extension/panel-session.mjs:103` | VSC §11（+同行裸形） | 同 4 | `// 销毁点（2026-09-08）：会话切换/新建/删除/项目切换/面板打开的` |
| 11 | `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs:2` | VSC §11（测试头注） | 删指称 | `* agent-lifecycle-singleton.test.mjs — agent 生命周期对齐 CLI（2026-09-08 …` |
| 12 | `thincoder-vscode/test/files.mjs:30` | VSC §11（登记注释） | 删指称 | `// agent 生命周期单例（2026-09-08）：resetRunState/…` |
| 13 | `thincoder-core/agent-tools/advisor-async.mjs:2` | CLI §11.2（R13） | **改指** | `async advisor reviews (AGENT-LOOP-SUBAGENT.md §6.10 — R13, 2026-09-06).` |
| 14 | `thincoder-core/agent-tools/subagent-async.mjs:46` | CLI §11.1（R14） | **改指** | `// Async pool limits per role domain (AGENT-LOOP-SUBAGENT.md §6.10 — R14, 2026-09-06):` |
| 15 | `thincoder-core/config.mjs:52` | CLI §11.1 + §11.2 | **改指** | `// Async pool limits (AGENT-LOOP-SUBAGENT.md §6.10 D-24a/R14 + R13 — POOL-CONFIG-`（该行分隔符形态异常 · 执行轮实读确认 · 见 §2.10 不一致 3） |
| 16 | `thincoder-cli/src/tui/suspension-drive.mjs:36` | CLI §11.3（废弃记录） | **整行删**（纯指针行；`D-24c` 在 docs 全域零命中 ⇒ 无现行靶；否决「改指归档址」——归档档不作现状权威） | 行删（行数 −1 · 全批唯一） |

**判保留（逐类理由）**：

| 类 | 坐标 | 理由 |
|---|---|---|
| 模型可见文案 / 日志面（4 处） | `advisor.mjs:50`（工具描述串）· `advisor-async.mjs:369`（错误串）· `subagent-async.mjs:116`（console.warn）· `subagent.mjs:143`（工具描述串 · 含 §15/§18/§11.1） | 批档边界「**只碰注释**」；文案面改动 = 产品可见文本 ⇒ 须独立裁定（J-1 在册「含模型可见位点」） |
| 独立裸形面（无文档名的 `§11*`） | VSC 侧 ≈51 行（`agent-state.mjs` · `setup.mjs` · `panel-turn-loop.mjs` 等）· core / cli 侧 ≈60 行（`§11.2 D-24b` 族等） | 承 J-1「**裸形面 = 另轮读数域**」——多头指称：同仓同号另有 `WEBVIEW.md §11.1` · `ACP-CLIENT.md §11` · `SESSION.md §11.x` 等载体 ⇒ 不可机械判 |
| 同括号非紧邻 token（1 处） | `thincoder-core/agent-tools/subagent-scheduler.mjs:365`（`(AGENT-LOOP.md §15 … + §20 … + §11.1 …)`——文档名绑定 §15） | 边缘形态：全行本属 J-1 面（§15/§20 皆死）；按「紧邻形」族界不纳入（并入 J-1 扩面轮） |
| 同族更大面（N≥9 全族） | 源面 108 行 / 45 档（J-1 残差 · as-of 2026-09-18） | 在册 `DOC-DISCIPLINE.md` §3.9 J-1；消解路径 = 独立「扩面轮」（「锚实核逐处人判」定新靶）⇒ 本批不纳入 |
| 同型异档族 | `SESSION.md §9+` 引（core 18 行 / vsc 8 行；现行核档仅 §1–§8） | 不在 #139 族界（批档只名 `AGENT-LOOP.md §11`）⇒ 上报（§2.10 不一致 5 · 建议另立条目） |

**先例**：`advisor.mjs:147`（deadname-sweep2：`(AGENT-LOOP.md §11.2)` → `(AGENT-LOOP-SUBAGENT.md §6.10)`）· `subagent-actions.mjs` 三处（`§7.2` → `§6.7.2`，同法不同号）。
**机械约束**：行内替换、行数零变（保护贴线档：`agent.mjs` **494** · `setup.mjs` **495** · `agent-lifecycle-singleton.test.mjs` **491**）；全批唯一 −1 行 = 第 16 处。
**实施路由**：产品码面（fail-closed）⇒ eng-coder + token 门。
**登记**：`DOC-DISCIPLINE.md` §3.9 J-1 残差块 +1 行——「§11 子族（全形 · 注释面）已处置（批档 `2026-09-20-hygiene-sweep-batch.md` §2 · 2026-09-20）；余面（`§7.2` / `§15` / `§17`–`§29` 等 + 文案 / 裸形面）仍在册，随扩面轮」；**同档变更记录 +1 行**（同型先例 = `DOC-DISCIPLINE.md:1304` 库存清账批 #128）。

### 2.3 #140 VSC-DEBT §12.1「现盘」块

**改法**：按现盘刷新 `docs/vsc/design/VSC-DEBT.md` §12.1 机制层端差批读数块（`:272`–`:278`）+ 落「触发线未触」注（口径 = vsc-rules-retry 批 §5.8 逐字：`agent.mjs` 触发线 **>495** · `setup.mjs` **>497**）+ 块内落**逐档触线单源句**（源 = 同批 §2.4 / §5.8）+ `:265` 对齐（越档面触发句去 490 旧口径 · 改指单源行——见下表 `:265` 行）。

| 行 | 现载 | 复测（as-of 2026-09-20 · `wc -l` ≡ `find /c /v ""` · 本席实读） | 改后要点 |
|---|---|---|---|
| `:265` | 越档面三档（`chat-panel.mjs` / `suspension.mjs` / `settings.mjs`）触发句「触发 = 条件：其一净增越 490 或下次触碰」 | 本批不重测——读数归既有块单源（`:264` / `:268`） | 去 490 旧口径 → 「触发 = 下次触碰（触线判据 = 块内**逐档触线（单源）**行）」；`:587` 变更记录面 490 句照留（历史面 ✓） |
| `:273` | agent.mjs 483 → 478；「现盘 478（< 490 触发线）⇒ 触发条件 = 净增越 490」 | **494** | 现盘 **494**（触发线 **>495**——**未触** · 距 500 硬限 **6** 行；拆分候选在册 = 响应后处理段 → `agent/response-stages.mjs`）；「>490」旧口径句改判（不留尸体） |
| `:274` | run-stages 377 → 402（>300 咨询线、≤500 硬限） | **403** | 现盘 403（>300 咨询线、≤500 硬限） |
| `:275` | execute-tools 393 → 407（同上） | **418** | 现盘 418（同上） |
| `:276` | setup.mjs 481 → 489；「贴线——`find` 口径 489 < 490 未触线…⇒ 下次触碰即触线」 | **495** | 现盘 **495**（触发线 **>497**——**未触** · 距 500 **5** 行；拆分候选在册 = 配置读段 → `agent/setup-config.mjs`）；「490 贴线」旧口径句改判 |
| `:277` | permission-gate 109 → 117 | **117（未漂移）** | 零改 |
| `:278` | test/files.mjs 116 → 117 | **119** | 现势回填 **119**（+2 = `vsc-stream-rules.test.mjs` / `scoped-rules.test.mjs` 登记） |
| `:279`–`:280` | 新用例档 264 / 217 / 102 · ledger 324 | 未漂移（本席复测） | 零改 |
| `:282` / `:284` | provider-probe-window 122 · session-boot 440 | 未漂移 | 零改 |

**必落注①（块内）**：「**触发线未触（as-of 2026-09-20 复测）**：`agent.mjs` 494（线 >495）· `setup.mjs` 495（线 >497）；距 500 硬限 **6 / 5** 行」——防后续误判（承父侧更正：原「已触」不成立）。
**必落注②（块内 · 逐档触线单源）**：「`agent.mjs` **>495** · `setup.mjs` **>497** · `run-stages.mjs` / `execute-tools.mjs` **>450**（源 = `docs/batches/2026-09-20-vsc-rules-retry-batch.md` §2.4 / §5.8）；未列档触发 = 触碰时复核（拆分候选按 §12.2 各档）」——§12.1 各行「触发」口径以此为准（`:265` 同指）。
**变更记录**：VSC-DEBT 变更记录 +1 行（as-of 2026-09-20 · 卫生族批 · 台账 #140）。
**判保留（上报）**：同节 `:267`–`:270`（上行通道批读数块：`agent.mjs` 485 → 492 · `suspension.mjs` 397 → 406）——与机制层端差块时序不合（492 → 483 → 494 非单调 · 疑读数失真）；本批按 #140 范围只刷新机制层端差块 ⇒ 该块处置 = 父侧裁定（§2.10 不一致 6）。
**机械约束**：`.md` 档 ⇒ 不列行数；改动 = 行内改数 + 增注 + changelog 1 行。

### 2.4 接口契约（指称形态 · 前后逐字）

- **#138 目标形态**：头注 `（§6–§8 · …）`；变更记录无 §9 指称片段（判保留 16 处原样）；12 档变更记录各 +1 行（不含「§9」字面）。
- **#139 目标形态**：① **改指形** = `AGENT-LOOP-SUBAGENT.md §6.10`（与 `advisor-async.mjs:23`/`:283`/`:371` 既有同形）；② **删指称形** = 无 token 的语义句（样本见 §2.2 · 弃空壳括号）；③ 保留面 4 处原样（文案 / 日志）。
- **#140 目标形态**：块内六行读数 = {494 · 403 · 418 · 495 · 117 · 119} + 「触发线未触」注（>495 / >497 · 余 6 / 5 行）+ 逐档触线单源句（源 = vsc-rules-retry 批 §2.4 / §5.8）+ `:265` 对齐（去 490 旧口径）。
- **扫描接口（验收命令族 · 全 ASCII · cwd = 仓根）**：C1 = `/\u00a76[\u2013\u2014-]\u00a79/`（12 档头注）· C2 = `\u00a79`（12 档余留行）· C4 = `/AGENT-LOOP(\.md)?\s+\u00a711/`（三产品树 · `\s` 兼容异常分隔符）· C5 = 行数复读。

### 2.5 受影响文件表

**#138（设计档面 · 12 档 · 全 `.md` ⇒ 行数两列不列——条目 2 收正后口径）**

| 档 | 动作 | 行数 / Δ |
|---|---|---|
| `docs/core/design/CHECKPOINT.md` · `CONFIG.md` · `CONSULTATION.md` · `CONTEXT-COMPACTION.md` · `I18N.md` · `MCP.md` · `MEMORY.md` · `PROVIDER.md` · `PROMPT-SYSTEM.md` · `SESSION.md` · `TOOLS.md` · `TRACES.md`（12 档） | 头注节区改 §6–§8 + §9 片段删（逐档见 §2.1）+ 变更记录 +1 行 | — / — |

**#139（产品码面 · 12 档 / 16 处 · 行数口径 `wc -l` · 本席实读 as-of 2026-09-20）**

| 档 | 现行数 | 位置 | 预计 Δ |
|---|---|---|---|
| `thincoder-vscode/src/agent.mjs` | **494**（贴线 · 禁增行） | `:99` | Δ0（行内） |
| `thincoder-vscode/src/agent/setup.mjs` | **495**（贴线 · 禁增行） | `:8` | Δ0 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 441 | `:67`/`:85`/`:101` | Δ0 |
| `thincoder-vscode/src/extension/panel-chat.mjs` | 252 | `:42`/`:122`/`:201` | Δ0 |
| `thincoder-vscode/src/extension/panel-project.mjs` | 98 | `:40` | Δ0 |
| `thincoder-vscode/src/extension/panel-session.mjs` | 295 | `:103` | Δ0 |
| `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` | **491**（贴线 · 禁增行） | `:2` | Δ0 |
| `thincoder-vscode/test/files.mjs` | 119 | `:30` | Δ0 |
| `thincoder-core/agent-tools/advisor-async.mjs` | 481 | `:2` | Δ0 |
| `thincoder-core/agent-tools/subagent-async.mjs` | 456 | `:46` | Δ0 |
| `thincoder-core/config.mjs` | 419 | `:52` | Δ0 |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 324 | `:36` | **−1**（纯指针行整行删 · 全批唯一） |

**#140 / 登记（设计档面）**

| 档 | 动作 | 行数 / Δ |
|---|---|---|
| `docs/vsc/design/VSC-DEBT.md` | §12.1 块按现盘刷新 + 触发线注 + 逐档触线单源句 + `:265` 对齐（去 490 旧口径）+ 变更记录 +1 行 | — / — |
| `docs/core/design/DOC-DISCIPLINE.md` | §3.9 J-1 残差块 +1 行登记（§11 子族已处置）+ 变更记录 +1 行 | — / — |

**拆分计划**：零新增越 500 档；`.mjs` 全在 ≤500 内（最大 495）⇒ 无拆分义务；贴线三档（494 / 495 / 491）**禁增行**（机械约束见 §2.6 KD-7）。

### 2.6 关键决策记录

| # | 决策 | 否决备选 | 理由 |
|---|---|---|---|
| KD-1 | 头注范围端点改实况 `§6–§8`；**删引用不补 §9** | ① 补建 §9 ② 判保留不动 | 补 = 复活已废体量规则（用户 2026-09-16 裁定）；保留 = 死指称（本批对象）；同法先例 = WORKSPACE / LOGGING |
| KD-2 | 变更记录 §9 片段 = **纯删、零注记**（D-DD15） | ① 逐行加「§9 已删」注记 ② 整行删 | 注记 = 百处噪音且注记本身指死物；整行删丢历史语义 |
| KD-3 | #139 族界 = **紧邻形** `AGENT-LOOP(.md)? §11*` + 同行裸形归一 | ① 全族 N≥9 一把 sweep ② 只做 VSC §11 | ① J-1 在册、要求逐处定靶（扩面轮面）② core §11.1/§11.2 与 VSC 同号同因，拆分处置失一致 |
| KD-4 | VSC §11 = **删指称**（不引归档址） | 改指 `thincoder-vscode/docs/_archive/design/AGENT-LOOP.md` §11 | 归档档不作现状权威（承 ledger「与归档档区分」口径）；「归档址 + as-of」形态用于设计档对位表，产品码注释不引历史档 |
| KD-5 | core §11.x = **改指** `AGENT-LOOP-SUBAGENT.md §6.10` | 删指称 | 有现行靶 + 先例（deadname-sweep2 `advisor.mjs:147` 同法）；保住可追踪性 |
| KD-6 | #140 = 刷新块 + 触发线复测注；旧「>490 / 490 贴线」口径句**改判** | ① 保留旧句加注 ② 只改数字不注触发线 | ① 留尸体（D8 禁修订式残句）② 父侧明确要求注「未触」防误判 |
| KD-7 | 机械约束 = 行内替换、**行数零变** | 顺手重排 / 整理 | 保护贴线档（494 / 495 / 491）不触触发线 |
| KD-8 | J-1 残差块 **+1 行登记**（§11 子族已处置） | 不登记 | 防后续重复 sweep §11（未来读者据 J-1 判「未处置」）；一行最小面 |
| KD-9 | `:265` **就地对齐**（去 490 旧口径 → 指块内逐档触线单源行） | 登 §2.10 上报面（父侧之二选） | 残留 490 = 「已触」误判源（实证 = `2026-09-20-doc-face-closure-batch.md:291`）——就地消解即根因消解；登记不消因 |

### 2.7 验收标准（逐条回指）+ 用例表

| 批档 §1.3 / 设计要点 | 设计落点 | 机检 |
|---|---|---|
| ① 逐条「台账 id → 改动 file:line 或判保留理由」 | §2.1 / §2.2 / §2.3 | 本表 + C1 / C2 / C4 / C5 |
| ② 重扫读数（#138 清单闭合） | §2.1（**12 / 22 / 16**） | C1 / C2 |
| ③ `doc-check` 净增 0 | §2.8 C3 | 悬空 0 · 行宽 0 |
| ④ 计数 / 枚举自洽（D3） | 12 档 / 22 处 / 16 处（判保留 **7 档**）· 16 处 / **12** 档 · 6 行读数 · 4 处保留 | C1 / C2 / C4 计数同源 |
| A5 不一致处 | §2.10（7 条） | — |

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| N1 | 正常 | C1 复跑（12 档） | `C1-HITS 0` |
| N2 | 正常 | C2 复跑（12 档） | `C2-HITS 16` + 逐行 = §2.1 判保留集 |
| N3 | 正常 | C4 复跑（三树） | `C4-HITS 4` + 恰 = `advisor.mjs:50` / `advisor-async.mjs:369` / `subagent-async.mjs:116` / `subagent.mjs:143` |
| N4 | 正常 | C5 复跑（6 档） | 494 · 495 · 403 · 418 · 117 · 119（顺序同命令） |
| N5 | 正常 | C3 复跑 | 悬空 0 / 行宽 0 |
| N6 | 正常 | VSC-DEBT `:265` 对齐落地后 | 全档 `490` 命中 **1**（仅变更记录面 `:587`）· C5 复读 494 · 495 · 403 · 418 · 117 · 119 |
| B1 | 边界 | 头注档 ∈ {TOOLS · PROMPT-SYSTEM}（有 v2 新 §9） | 照改 `§6–§8`；新 §9 引用（`TOOLS:4`/`:528` · `PROMPT-SYSTEM:320`）零改 · C2 计数含之 |
| B2 | 边界 | 片段删后标点悬空 | 归一（无空壳括号 / 悬空分号）· 逐处回读（D6） |
| B3 | 边界 | 坐标漂移（`agent.mjs:97` 实为 `:99`；J-1 全表 as-of 09-18） | 按**内容**逐处回读定位 · 不按旧行号 |
| E1 | 错误 | 误删判保留 16 处之一 | C2 ≠ 16 ⇒ 红 · 回滚该处 |
| E2 | 错误 | 误动文案 / 日志面 | C4 ≠ 4 或命中集外出现 ⇒ 红 |
| E3 | 错误 | 贴线档增行（494 / 495 / 491） | **以 C5 输出为准**（行数 = 换行符数 ≡ `wc -l`；含尾空段的 `read` / `split` 法报 **+1**——同档实测 494/495 · 495/496 · 491/492）⇒ 越线即停 · 上报 |

### 2.8 验收命令（全 ASCII · cwd = 仓根 · 禁中文 `findstr /c:`）

```
C1  node -e "const fs=require('fs');const F=['CHECKPOINT','CONFIG','CONSULTATION','CONTEXT-COMPACTION','I18N','MCP','MEMORY','PROVIDER','PROMPT-SYSTEM','SESSION','TOOLS','TRACES'];let n=0;for(const f of F){fs.readFileSync('docs/core/design/'+f+'.md','utf8').split('\n').forEach((l,i)=>{if(/\u00a76[\u2013\u2014-]\u00a79/.test(l)){n++;console.log(f+':'+(i+1))}})}console.log('C1-HITS',n)"
C2  node -e "const fs=require('fs');const F=['CHECKPOINT','CONFIG','CONSULTATION','CONTEXT-COMPACTION','I18N','MCP','MEMORY','PROVIDER','PROMPT-SYSTEM','SESSION','TOOLS','TRACES'];let n=0;for(const f of F){fs.readFileSync('docs/core/design/'+f+'.md','utf8').split('\n').forEach((l,i)=>{if(l.indexOf('\u00a79')>=0){n++;console.log(f+':'+(i+1)+' '+l.trim().slice(0,50))}})}console.log('C2-HITS',n)"
C3  node scripts/doc-check.mjs --root .
C4  node -e "const fs=require('fs'),p=require('path');const re=/AGENT-LOOP(\.md)?\s+\u00a711/;let n=0;const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','_archive','.git'].includes(e.name))continue;const f=p.join(d,e.name);if(e.isDirectory())walk(f);else if(/\.(mjs|cjs|js)$/.test(e.name)){fs.readFileSync(f,'utf8').split('\n').forEach((l,i)=>{if(re.test(l)){n++;console.log(f+':'+(i+1))}})}}};['thincoder-core','thincoder-cli','thincoder-vscode'].forEach(walk);console.log('C4-HITS',n)"
C5  node -e "const fs=require('fs');const F=['thincoder-vscode/src/agent.mjs','thincoder-vscode/src/agent/setup.mjs','thincoder-vscode/src/agent/run-stages.mjs','thincoder-vscode/src/agent/execute-tools.mjs','thincoder-vscode/src/extension/permission-gate.mjs','thincoder-vscode/test/files.mjs'];for(const f of F)console.log((fs.readFileSync(f,'utf8').match(/\n/g)||[]).length,f)"
```

### 2.9 边界（本批不做）· D8 自查 · UI 面

- **边界**：行为面零改（注释 / 文档字面外零触碰）· `scripts/**` · 归档档内容（`_archive/**`）· 冻结批档（`docs/batches/**` 不回改）· 需求档（父侧笔）· 提示词面（内容权 = 主 agent）· 模型可见文案 / 日志面 · 独立裸形面 · J-1 余族（N≥9 非 §11）· `SESSION.md §9+` 异档族 · 他批写域。
- **D8 自查（现役规范面禁修订式残句）**：全部改动 = 删 / 改指称——**零划除线 · 零「原 X ⇒ 改 Y」· 零「已废 / 作废」corpse 注记**；头注 / 注释改后即终态形；变更记录行不写已删对象字面（同 `LOGGING.md:160` 先例）；规范面无修订式残句。
- **UI / 交互面**：零 UI（纯文档 / 注释字面）；**无 open 项**（VSC-DEBT `:267`–`:270` 处置 = 上报建议，非本批 open）。

### 2.10 不一致处（上报）

1. 批档 / 台账「≥9 档」vs 重扫 **12 档**（新增 SESSION / TOOLS / TRACES）——处置不变（§2.1）。
2. 批档「各档实况 = §1–§8（无 §9）」vs TOOLS / PROMPT-SYSTEM **有 v2 期重建的新 §9**（异实同名）——头注照改 `§6–§8`（理由见 §2.1-1）。
3. #139 坐标 `agent.mjs:97` vs 实读 `:99`；J-1 全表坐标 as-of 09-18 普遍漂移（例：`panel-chat.mjs` 拆分后 499 → 252）⇒ 执行**按内容回读定位**；`config.mjs:52` 分隔符形态异常（精确形扫描漏配 · 以实读为准）。
4. #139 族界：本轮 = §11 子族；同型更大面（J-1 残差 N≥9 全族 108 行）不纳入——理由与登记见 §2.2（J-1 +1 行）。
5. **`SESSION.md §9+` 引**（core 18 行 / vsc 8 行 · 如 `SESSION.md §11.1` / `§12` / `§13` / `§14.3`）——现行 `docs/core/design/SESSION.md` 仅 §1–§8 ⇒ 同型死指称族（异档）；不在本批族界，建议另立条目 / 并入 J-1 型 sweep。
6. VSC-DEBT `:267`–`:270` 读数块时序不合（485 → 492 ∥ 483 → 478 ∥ 现 494）——疑读数失真；本批只刷新机制层端差块 ⇒ 该块处置建议 = 父侧裁定（改判 / 标 as-of）。
7. 工具面观察：本机 `grep` 对含 CJK 的 pattern 零命中（多例复现）⇒ 本批验收命令一律 ASCII 转义形（`\u00a7` 等）——与批档「禁中文 `findstr /c:`」硬约束同源；执行轮勿用 CJK 检索形。

### 2.11 设计评审修正轮（§3 轮次 1 · 7 条逐条落 · 2026-09-20 · eng-designer）

**轮次** = fix（定点 · 追加制）。**依据** = 本档 §3 轮次 1 发现表 7 条（评审 id=63 · **VERDICT = pass** · 🟡 5 / 🔵 2）——父侧逐条裁定**接受**（`Suggestion` 列 = 处置建议；处置执行 = 本席）。**改动形态** = ① 被点名处**就地收正**（不留划改残迹——旧文可经 git 历史逐字复核）② 本节 = 追加制逐条记录。**本轮零新语义**（只落发现表直接导出项）；零产品码 · 零需求档 · 零 `scripts/**` · 零他批写域；§1 / §3–§6 = 他人段零触。

| # | 级 | 处置 | 改动落点（本档） | 机检断言 / 本轮实测读数 |
|---|---|---|---|---|
| 1 | 🟡 | 判保留行头档数 **8 → 7**（处数 16 保留） | §2.1 重扫闭合读数表第 3 行 | 该行 = 「**16 处 / 7 档**」+ 坐标枚举同数：**16 处 / 7 档** 逐处实核（C2 复算 50 = 12 头注 + 22 片段 + 16 判保留；per-file = CONFIG 2 · CONTEXT-COMPACTION 2 · MEMORY 2 · SESSION 2 · PROMPT-SYSTEM 3 · PROVIDER 3 · TOOLS 2；16 坐标逐处回读均含「§9」✓）。固定串「16 处 / 8 档」命中 **0** |
| 2 | 🟡 | 表头就地改 **12 档** + 删勘误注记（构成随迁入表头） | §2.2 表头 + §2.5 表前（原勘误行整行删） | 「16 处 / 13 档」命中 **0** · 「16 处 / 12 档」命中 1 · 「〔勘误」命中 **0** · 原勘误行尾串（「应为 **16 处 / 12 档**——vsc」）命中 **0**；新表头 = 「16 处 / 12 档（注释面 · vsc 8 档 + core 3 + cli 1）」 |
| 3 | 🟡 | 引用改**可解析落点**（V1 同判消解） | §2.0 | 旧引「`DOC-DISCIPLINE.md` §2.11」命中 **0**；新引 = `docs/core/design/DOC-CODE-RECONCILE.md` §5.2（`:375`）——实读 :375 含「**单批施工材料不进长驻设计档**」✓ · 目标档 §5.2 标题在位（`:372`）⇒ 段引用可解析 ✓。**注**：父侧简报与评审文记「§5.1」，实读该串居 **§5.2**（§5.1 = `:179`–`:370`）⇒ 本档按实读引 §5.2（登记于交付报告 ④） |
| 4 | 🟡 | §12.1 补**逐档触线单源句** + `:265` **就地对齐**（去 490 旧口径）——二选一取「就地」路线（否决「登 §2.10」= KD-9） | §2.3 改法 + 表新增 `:265` 行 + 必落注② + §2.4 + §2.5 + §2.6 KD-9 + §2.7 N6 | 单源实读逐字同源（`docs/batches/2026-09-20-vsc-rules-retry-batch.md` §2.4 `:105`–`:110` = setup >497 / agent >495 / run-stages · execute-tools >450；§5.8 `:334` 复述同值 ✓）；本档「逐档触线」命中 6 · 「必落注②」1 · KD-9 1 · N6 1。**实施后预期读数**（N6）= VSC-DEBT 全档 `490` 命中 **1**（仅变更记录面 `:587`；`:265` / `:273` / `:276` 现役面 0） |
| 5 | 🟡 | DOC-DISCIPLINE 行补「**变更记录 +1 行**」 | §2.2 登记行 + §2.5 表行 | 本档「变更记录 +1 行」命中 5（#138 12 档行 1 · VSC-DEBT 1 · DOC-DISCIPLINE 2 · 边角 1）；同型先例实读 = `DOC-DISCIPLINE.md:1304`（库存清账批 #128——§3.9 类登记与变更记录同轮）✓ |
| 6 | 🔵 | 括注限定 **10 档 + 2 例外**；v2 首部指针按档分列 | §2.1 改法表行 1 + 新增「例外 2 档位点与 v2 首部指针」注 | 例外位点逐处实读核对 ✓：`TOOLS.md`——v2 指针行 `:4` → §9 · 活 §9 `:494` · 变更记录 `:511`；`PROMPT-SYSTEM.md`——v2 指针行 `:3` → §10 · 活 §10 `:222` · 变更记录 `:293` · 活 §9 `:322` |
| 7 | 🔵 | E3 明写「**以 C5 输出为准**」+ 注 ±1 成因 | §2.7 用例表 E3 行 | 双计数法实跑（本席）：换行符法（≡ `wc -l` · C5 式）= agent.mjs **494** / setup.mjs **495** / lifecycle-singleton **491**；含尾空段法（`split('\n')`）= **495 / 496 / 492**（差 1 = 末行换行）——与 E3 注文逐值一致 ✓ |

**D8 自查（现役规范面禁修订式残句）**：本轮改动 = 计数收正（2 处头）· 引用改指（1 处）· 增注（例外注 / 单源句 / 必落注②/KD-9/N6）· **删**（勘误注记整行）；规范面零 `~~strikethrough~~` · 零「原 X ⇒ 改 Y」 · 零 corpse 注记；被删注记的历史语义由本表（记录面）承载。

**机检（写后实跑 · 全 ASCII · cwd = 仓根）**——F1 域 = 规范面（§2.0–§2.10；§2.11 记录面不计入），期望读数：16/7=1 · 16/8=0 · 16/12=1 · 16/13=0 · kanwu=0 · oldref=0 · newref=1 · c5rule=1 · tline=6；F2 期望：coords 16 · files 7 · notS9 0。

```
F1  node -e "const fs=require('fs');const t=fs.readFileSync('docs/batches/2026-09-20-hygiene-sweep-batch.md','utf8');const s=t.split('### 2.11')[0];const P=[['16/7',/16 \u5904 \/ 7 \u6863/g],['16/8',/16 \u5904 \/ 8 \u6863/g],['16/12',/16 \u5904 \/ 12 \u6863/g],['16/13',/16 \u5904 \/ 13 \u6863/g],['kanwu',/\u3014\u52d8\u8bef/g],['oldref',/DOC-DISCIPLINE\.md` \u00a72\.11/g],['newref',/DOC-CODE-RECONCILE\.md` \u00a75\.2/g],['c5rule',/\u4ee5 C5 \u8f93\u51fa\u4e3a\u51c6/g],['tline',/\u9010\u6863\u89e6\u7ebf/g]];for(const [n,re] of P)console.log(n,(s.match(re)||[]).length)"
F2  node -e "const fs=require('fs');const b=fs.readFileSync('docs/batches/2026-09-20-hygiene-sweep-batch.md','utf8').split('\n');const row=b.find(l=>l.includes('\u5224\u4fdd\u7559\uff08\u96f6\u6539'));const d=row.split('|')[3];const names=[...d.matchAll(/[A-Z][A-Z-]{2,}/g)].map(m=>({n:m[0],i:m.index}));const nums=[...d.matchAll(/:(\d+)/g)].map(m=>({n:+m[1],i:m.index}));const all=nums.map(x=>{const p=names.filter(y=>y.i<x.i);return [p.length?p[p.length-1].n:null,x.n]});const files=new Set(all.map(x=>x[0]));let bad=0;for(const [f,n] of all){const L=fs.readFileSync('docs/core/design/'+f+'.md','utf8').split('\n')[n-1]||'';if(!L.includes('\u00a79'))bad++}console.log('coords',all.length,'files',files.size,'notS9',bad)"
```

**C3 读数（写后实跑）**：`node scripts/doc-check.mjs --root .` = **exit 0 · 悬空 0 · 行宽 0**（与写前基线同级）。
**域注**：本档（`docs/batches/**`）在 doc-check 源域**之外**（`checkConfig.anchors.exclude` 含 `batches` ⇒ `walkMd` 逐层跳过）⇒ 本席改动按构造不移动其计数；观察到的候选 18453 → 18456（+3）来自**并行第三方在途写**（`docs/core/design/MODEL-SPECS.md` mtime ≈ 本修正轮窗口内 · glm53-flashx-row 车道），与本轮无关（悬空仍 0）。

**边界**：同 §2.9；本节只记 §3 七条的直接导出项，零夹带（不重开 #138 / #139 / #140 三条定案 · §2.10 计数不变 = 7 条）。

**变更记录**：2026-09-20（**设计评审 §3 轮次 1 · 修正轮** · eng-designer）：7 条逐条落（1 → §2.1 判保留行 · 2 → §2.2 表头 + §2.5 · 3 → §2.0 · 4 → §2.3 / §2.4 / §2.5 / §2.6 KD-9 / §2.7 N6 · 5 → §2.2 + §2.5 · 6 → §2.1 改法表 + 例外注 · 7 → §2.7 E3）；勘误注记整行删。**零产品码 · 零需求档 · 零 scripts**。

### 2.12 设计档面实施记录（eng-designer · 2026-09-20 · 承 §4 批准「文档面 → eng-designer」）

**范围** = #138（12 档）· #140（`VSC-DEBT.md`）· 登记（`DOC-DISCIPLINE.md`）；**零产品码 · 零需求档 · 零 `scripts/**` · 零他批写域**。**笔法** = 逐档落 + 落盘后回读（D6）· 行内替换 / 纯删（`.md` 不涉贴线行数保护）。

**逐条「设计点 → 改动 file:line」（行号 = 落笔后实读）**

| # | 设计点 | 改动 file:line |
|---|---|---|
| 1 | #138 头注 12 档：`（§6–§9 · …）` → `（§6–§8 · …）` | `docs/core/design/CHECKPOINT.md:8` · `CONFIG.md:8` · `CONSULTATION.md:8` · `CONTEXT-COMPACTION.md:8` · `I18N.md:8` · `MCP.md:8` · `MEMORY.md:8` · `PROVIDER.md:8` · `PROMPT-SYSTEM.md:10` · `SESSION.md:8` · `TOOLS.md:9` · `TRACES.md:8` |
| 2 | #138 片段 22 处纯删（含 TRACES `:112` 范围形改 `§6–§8`） | CHECKPOINT `:209`/`:214` · CONFIG `:145`–`:149`（5 处）· CONSULTATION `:249`/`:255` · CONTEXT-COMPACTION `:487`/`:496` · I18N `:84` · MEMORY `:542`/`:546`/`:550` · PROMPT-SYSTEM `:332` · PROVIDER `:420`/`:422`（+`:423` 同片段折行去「360 行」读数）/`:424` · TRACES `:110`/`:111`/`:112` |
| 3 | #138 changelog 12 档各 +1 行（不写「§9」字面） | CHECKPOINT `:217` · CONFIG `:150` · CONSULTATION `:256` · CONTEXT-COMPACTION `:523` · I18N `:87` · MCP `:214` · MEMORY `:562` · PROVIDER `:445` · PROMPT-SYSTEM `:337` · SESSION `:422` · TOOLS `:538` · TRACES `:113` |
| 4 | #138 判保留 16 处 | **零改**（C2 复跑 = 16 · 逐行 = §2.1 判保留集） |
| 5 | #140 现盘刷新 | `docs/vsc/design/VSC-DEBT.md:273`/`:274`/`:275`/`:276`/`:278`（读数 494 · 403 · 418 · 495 · **120**）；`:277` 零改（117 未漂移） |
| 6 | #140 `:265` 对齐（去旧口径 · KD-9） | `VSC-DEBT.md:265` → 「触发 = 下次触碰；触线判据 = 块内**逐档触线（单源）**行」 |
| 7 | #140 必落注①② | `VSC-DEBT.md:279`（触发线未触 · as-of 复测）· `:280`（逐档触线单源 + 未列档「触碰时复核」） |
| 8 | #140 changelog +1 行 | `VSC-DEBIT.md:593`–`:595`（三行折叠——见收正②） |
| 9 | 登记：§3.9 J-1 残差块 +1 行 | `docs/core/design/DOC-DISCIPLINE.md:497`（§11 子族全形 · 注释面已处置；余面仍在册，随扩面轮） |
| 10 | 登记 changelog +1 行 | `DOC-DISCIPLINE.md:1308` |

**验收读数（写后实跑 · 全 ASCII · cwd = 仓根）**：C1 = **0**（12 档头注零命中）· C2 = **16**（= 判保留集逐行）· C3 = `doc-check` **exit 0 · 悬空 0 · 行宽 0** · C4 = **20**（#139 产品码车道在途未落；判保留 4 处在内，终态期望 4）· C5 = **494 · 495 · 403 · 418 · 117 · 120**（`test/files.mjs` 现势 120 ≠ 设计 119——见偏离声明）。

**写后首跑红 → 就地收正（3 处 · 全在 `VSC-DEBT`）**：① `:273`/`:276` 拆分候选路径（`agent/response-stages.mjs` / `agent/setup-config.mjs` 盘上尚不存在）触 doc-check 悬空闸 ⇒ 按既有体例加 `（拟新增）` 标记（口径 = `scripts/doc-check-anchors.mjs:57` `NEW_MARKER = "（拟新增"`；同 §12.2 / `:42` 既有体例）⇒ 归「列报 · 不入闸」；② 新 changelog 行原 333 字符触行宽闸 ⇒ 折为 `:593`–`:595` 三行（各 ≤300）。收正后 C3 由首跑 FAIL（悬空 2 + 行宽 1）归 **0 · 0（exit 0）**。

**偏离声明（上报 ④）**：`:278` `test/files.mjs` **现势 120**（+3 = `vsc-stream-rules.test.mjs` / `scoped-rules.test.mjs` / `nested-token-relay.test.mjs` 登记）；设计值 119 = 落笔前测量，落笔窗口内**台账 #137（nested-token 批）在途写** `thincoder-vscode/test/files.mjs:119`（mtime 14:57 · `git diff` 实证 + 该批档在盘）⇒ 按 §2.7 B3「按内容回读」取现势 **120** 落笔（写 119 = 落盘即失效）；C5 期望「119」同因不可达（该档属产品码面，本车道不改）。

**「§11 子族已处置」入册时点声明**：#139 车道（eng-coder）本席写入时**在途未落**（`thincoder-vscode/src/agent.mjs:99` 等原样 · C4 = 20）——登记行按设计落「已处置」；该车道若最终未落，本行应随 §6 收口回改。

**边界**：同 §2.9；本记录只记本车道（设计档面）实施事实，零夹带（不重开 #138 / #139 / #140 定案 · §2.10 计数不变）。

**勘误（同日）**：上表 #8 行档名应为 `VSC-DEBT.md`（`:593`–`:595`）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**对象** = 批档 §2 全段（#138 / #139 / #140 · 受影响文件表 · C1–C5）· 状态 = 待评审 · 评审面 = 只读（未改任何文档 / 代码）。
**实核基线（本席读盘 as-of 2026-09-20 · `wc -l` 口径）**：#138 头注 12 档逐处在位（CHECKPOINT`:8` · CONFIG`:8` · CONSULTATION`:8` · CONTEXT-COMPACTION`:8` · I18N`:8` · MCP`:8` · MEMORY`:8` · PROVIDER`:8` · PROMPT-SYSTEM`:10` · SESSION`:8` · TOOLS`:9` · TRACES`:8`）· 全域 grep（docs 递归）仅此 12 处 + `TRACES.md:112`（改法已含 ⇒ 改后 C1 命中 0 ✓）· C2 现 50 行含「§9」− 12 头注 − 22 片段 = **16** ✓（与 §2.1 判保留集逐行同址）；#139 16 处坐标逐处实读，「改后样本」与原文同形（含 6 处同行裸形：`chat-panel.mjs:85`/`:101` · `panel-chat.mjs:42`/`:122` · `panel-project.mjs:40` · `panel-session.mjs:103`）；C4 现命中 **20 行** → 改后 **4 行**（`advisor.mjs:50` · `advisor-async.mjs:369` · `subagent-async.mjs:116` · `subagent.mjs:143`）＝ N3 期望集 ✓；#140 六读数逐值实测相符（agent.mjs 494 · setup.mjs 495 · run-stages 403 · execute-tools 418 · permission-gate 117 · test/files.mjs 119）· 触发线 >495 / >497 与 `2026-09-20-vsc-rules-retry-batch.md:334` 逐字同源 ✓ · 受影响文件表 12 档行数逐值相符 ✓ · 拆分义务判=零新增越 500 ✓。
**限制**：无文档地图 / 无项目标准档声明 ⇒ Document ownership 按被审档自身判据 + 跨档一致性判（降级）；`scripts/**` 域外 ⇒ C3 旗标语义未复核（`unverified`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Counts（D3） | 🟡 | 批档 `:52` 判保留行头记「**16 处 / 8 档**」，但同行坐标枚举只落 **7 档**（CONFIG · CONTEXT-COMPACTION · MEMORY · SESSION · PROMPT-SYSTEM · PROVIDER · TOOLS）；处数 16 实核成立（50 − 12 − 22），档数应为 7 | 该行档数收正为 **7**，或补出第 8 档坐标 |
| 2 | Doc hygiene / D3 | 🟡 | 批档 `:72` 仍写「闭合清单 = 16 处 / **13 档**」，收正以 `:144` 的〔勘误：… 应为 16 处 / 12 档〕形式挂在受影响文件表前 —— 失效表达留在规范面、且以「原 X ⇒ 改 Y」注记承载（设计自设 D3 自洽判据 ④ 不达标） | `:72` 就地改 **12 档**并删 `:144` 勘误注记（历史归记录面 / 变更记录） |
| 3 | Methodology / Document ownership | 🟡 | 批档 `:41` 引「承 `DOC-DISCIPLINE.md` §2.11「单批施工材料不进长驻设计档」」——实读 `docs/core/design/DOC-DISCIPLINE.md:50` §2 = 「机械校验最小集（V1–V6）」，无 2.x 子节、全档无「2.11」串 ⇒ 引用不可解析（V1「段引用可解析」同判）；该原则在盘上落点 = `docs/core/design/DOC-CODE-RECONCILE.md:375`（§5.1）· 另见 `:436` / `:465` | 改引可解析落点（`DOC-CODE-RECONCILE.md` §5.1）或改无节号形态（名称 + 语义名） |
| 4 | Clarity / consistency | 🟡 | #140 落定后 §12.1 将并存两套触线口径而无单源句：`VSC-DEBT.md:265`（现役面）「触发 = 条件：其一净增越 490 或下次触碰」（chat-panel / suspension / settings）vs 批档 `:114`/`:117` 改后的 `:273`/`:276`「触发线 >495 / >497」；`VSC-DEBT.md:587`（变更记录面）的 490 句照留 = 正确，但 §2.10 未登记 `:265` —— 残留 490 正是本批要防的「已触」误判源（`2026-09-20-doc-face-closure-batch.md:291` 实证） | §12.1 补一句逐档触线单源口径（源 = vsc-rules-retry §2.4/§5.8）并对齐 `:265`，或把 `:265` 登入 §2.10 上报面 |
| 5 | Methodology / completeness | 🟡 | 批档 `:165` 对 `docs/core/design/DOC-DISCIPLINE.md` 只给「§3.9 J-1 残差块 +1 行登记」，无变更记录行；对照 = 同批 12 档各要求变更记录 +1 行（`:61`）· VSC-DEBT 变更记录 +1 行（`:124`）· 同档实践 = §3.9-only 登记类改动亦配变更记录行（`DOC-DISCIPLINE.md:1304` 库存清账批 #128 同型） | DOC-DISCIPLINE 行补「变更记录 +1 行」 |
| 6 | Clarity | 🔵 | 批档 `:58` 括注「`^## 8` 全 12 档实核、**其后 = 变更记录**」仅对 10 档成立：`TOOLS.md:494` 有活 §9（`:511` 变更记录）· `PROMPT-SYSTEM.md:222` 有 §10、`:322` 有 §9（`:293` 变更记录）；同括注「各档首部『v2 就地更新…见 §9』行」只合 TOOLS（`TOOLS.md:4`）——PROMPT-SYSTEM 对应行指 §10（`PROMPT-SYSTEM.md:3`） | 括注限定为 10 档 + 2 例外（列 TOOLS / PROMPT-SYSTEM 活节位），v2 指针按档分列 §9 / §10 |
| 7 | Verification convention | 🔵 | 批档 `:112`/`:198` 与 C5（`:214`）计数口径 = `wc -l` ≡ `.match(/\n/g).length` —— 与含尾空段的行数计法差 1：实测 `agent.mjs` **494 / 495** · `setup.mjs` **495 / 496** · `agent-lifecycle-singleton.test.mjs` **491 / 492**；#140 的「距硬限 6 / 5 行」正建在此差上 | E3 明写「以 C5 输出为准」并注 ±1 成因（末行换行），防执行轮按别的计数法判「越线即停」 |

**计数**：🔴 0 · 🟡 5 · 🔵 2（无阻断项）
VERDICT: pass

### 轮次 2（评审子代理）

**对象** = §2.11 修正声明复核（承评审 id=63 pass → 修正轮 id=64）：只验轮次 1 发现表 7 条真落（每号一条陈述 + file:line 证据）+ 标出修正引入的新问题；不重开全量评审（窗口授权 14:40→17:00）。

**7/7 落点实核（as-of 本次读盘 · 本档 + 跨档证据点逐处回读）**
1. 判保留行档数收正 → 本档 `:52` ＝「**16 处 / 7 档**」+ 坐标枚举 7 档同数（per-file 2/2/2/2/3/3/2 ＝ 16）✓
2. 表头改 12 档 + 删勘误注记 → 本档 `:74`「**16 处 / 12 档（注释面 · vsc 8 档 + core 3 + cli 1）**」（8+3+1＝12 ✓）；§2.5 表前勘误行已删（全档「〔勘误」仅存 §2.11 / §3 记录面引文）✓
3. 引用改可解析落点 → 本档 `:41` 引 `docs/core/design/DOC-CODE-RECONCILE.md` §5.2（`:375`）；跨档实读：`:372` ＝ §5.2 标题 · `:375` 含「单批施工材料不进长驻设计档」· `:179` ＝ §5.1 标题 ⇒ 「§5.1 ＝ `:179`–`:370`」成立、段引用可解析 ✓（§5.1→§5.2 系对轮次 1 记录节的进一步收正，非新错）
4. `:265` 就地对齐 + 逐档触线单源句 → 本档 `:116`（新增 `:265` 行）· `:127`（必落注②）· `:136` / `:168` / `:185`（KD-9）· `:204`（N6）✓；单源值跨档实读同源（`2026-09-20-vsc-rules-retry-batch.md` `:105`–`:110`：setup >497 / agent >495 / run-stages · execute-tools >450；`:334` 复述 >495 / >497）✓
5. DOC-DISCIPLINE 补「变更记录 +1 行」→ 本档 `:108`（§2.2 登记行）+ `:169`（§2.5 表行）双落 ✓；同型先例实读 ＝ `DOC-DISCIPLINE.md:1304`（库存清账批条目内承载 §3.9 登记）✓ —— 但本条机检分桶有误，见发现 1
6. 括注限定 10 档 + 2 例外 → 本档 `:58`「其后 ＝ 变更记录者 **10 档** + 例外 **2 档**」+ `:63`（新增例外注）✓；例外位点跨档实读核对 ✓（TOOLS `:4` 指 §9 · 活 §9 ＝ `:494` · 变更记录 ＝ `:511` · `:528` 含「§9」；PROMPT-SYSTEM `:3` 指 §10 · 活 §10 ＝ `:222` · 变更记录 ＝ `:293` · 活 §9 ＝ `:322` · `:320` 含「§9」）
7. E3 明写口径 + ±1 成因 → 本档 `:210`「**以 C5 输出为准**（行数 ＝ 换行符数 ≡ `wc -l`；含尾空段法报 +1——同档实测 494/495 · 495/496 · 491/492）」✓（口径算术自洽）

**F1 / F2 声明读数复核**：F1 九项在盘面复算逐项相符（域 ＝ `### 2.11` 前：16/7＝1 · 16/8＝0 · 16/12＝1 · 16/13＝0 · kanwu＝0 · oldref＝0 · newref＝1 · c5rule＝1 · tline＝6）✓；F2 coords 16 / files 7 复算相符 ✓（notS9＝0 依赖 7 档设计档行文——抽查 PROMPT-SYSTEM `:320` · TOOLS `:4` · `:528` 均含「§9」✓，余项承轮次 1 实核，本席未逐项复跑）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Counts（D3） | 🟡 | 本档 `:248` 机检注「本档『变更记录 +1 行』命中 5（#138 12 档行 1 · VSC-DEBT 1 · DOC-DISCIPLINE 2 · 边角 1）」——总数 5 实核成立，分桶不符盘面：实际 ＝ `:145`（#138）· `:128` + `:168`（VSC-DEBT ×2）· `:108` + `:169`（DOC-DISCIPLINE ×2）⇒「VSC-DEBT 1」少计 §2.5 表行一处、「边角 1」无对应命中 | 分桶收正为「#138 12 档行 1 · VSC-DEBT 2 · DOC-DISCIPLINE 2」或删分桶括注只留总数 5；落地双点（`:108` / `:169`）与其余 6 条不受影响 |
| 2 | Acceptance / verifiability | 🔵 | 新落 N6（`:204`）期望「VSC-DEBT 全档 `490` 命中 1（仅变更记录面 `:587`）」无机检腿：§2.8 命令族 C1–C5（`:215`–`:219`）为闭集、无 `490` 计数命令（N1–N5 均挂 C1 / C2 / C4 / C5） | §2.8 补 C6（VSC-DEBT `490` 计数）并 N6 挂 C6；或把 N6 期望并回 §2.3 / §2.5 复测读数形 |
| 3 | Doc-state（记录面坐标） | 🔵 | 就地编辑后 §3 轮次 1 记录面所引**本档行号**与现状失配（可复核：§3 行 5 引 `:165` 现为空行、被引 DOC-DISCIPLINE 行现居 `:169`；§3 行 7 引「C5（`:214`）」现为代码围栏、C5 现居 `:219`）——成因（编辑位移 / 当轮笔误）不判 | 按内容回读消费（承 §2.7 B3「坐标漂移按内容回读定位」）；如需硬化，收口轮统查记录面行号并加 as-of 句 |

**计数**：🔴 0 · 🟡 1 · 🔵 2（7/7 真落确认，无阻断项）
**范围外注记（无级）**：本档 `:14` 状态行仍为「🔄 进行中（设计轮待发）」，与 §2 / §2.11 / §3 实际进度（设计轮已 pass · 修正轮已落）不符——§1 ＝ 主 agent 段，非本次复核对象，仅报不判。
VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 15:0x 父侧代签** —— 用户 14:40「**全自动跑到下午五点**」⇒ 本批**设计评审点火权 + §4 批准权**均在授权射程内（窗口 → 17:00）。

**三条件核验**：① 评审 **pass**（id=63 · 5🟡/2🔵）→ 修正轮 id=64 **7/7 Fixed** → **复核 id=67 pass**（7/7 真落逐号实核：`:52` 7 档 · `:74` 12 档 · `:41` §5.2 引用 · `:116`/`:127`/`:185`/`:204` 单源链 · `:108`/`:169` 变更记录行 · `:58`/`:63` 例外注 · `:210` C5 口径）✓；② 修正轮已落地并经父侧逐条核验 ✓；③ **token 已签发**（值不落档——运行时凭证）✓。

**批准范围**：本批全量。**实施分两面**：**文档面**（#138 十二档头注 + 22 处变更记录片段 + 16 处判保留零改 + 逐档 changelog + #140 现盘刷新 + DOC-DISCIPLINE §3.9 登记）→ **eng-designer** ✓；**产品码面**（#139 十六处注释：12 删指称 / 3 改指 AGENT-LOOP-SUBAGENT.md §6.10 / 1 整行删）→ **eng-coder + token** ✓。两路皆已派发 ✓。
## §5 实施记录（eng-coder）

### 5.1 交付摘要（#139 产品码面 · eng-coder · 2026-09-20）

**轮次** = initial（实施轮）。**范围** = §2.2 表内 **16 处 / 12 档**（产品码注释面：VSC 12 处删指称 + core 3 处改指 `AGENT-LOOP-SUBAGENT.md §6.10` + cli 1 处整行删）。**行为面零改**（全部落在注释/头注行）。**落盘前坐标按内容回读定位**（B3）——本轮 16 处坐标与 §2.2 给定行号**逐处相符**（无漂移）；台账原坐标 `agent.mjs:97` 已于设计轮收正为 `:99` ✓。

**逐条「条目号 → 改动 file:line → Δ」**

| # | 改动 file:line | 改法 | Δ |
|---|---|---|---|
| 1 | `thincoder-vscode/src/agent.mjs:99` | 删指称（`AGENT-LOOP.md §11（…）` → `agent 生命周期对齐 CLI（2026-09-08）`） | 0 |
| 2 | `thincoder-vscode/src/agent/setup.mjs:8` | 删指称（头注同式） | 0 |
| 3 | `thincoder-vscode/src/extension/chat-panel.mjs:67` | 删指称（头注同式） | 0 |
| 4 | `thincoder-vscode/src/extension/chat-panel.mjs:85` | 删指称（全形 + 同行裸形 `§11`） | 0 |
| 5 | `thincoder-vscode/src/extension/chat-panel.mjs:101` | 同 4 | 0 |
| 6 | `thincoder-vscode/src/extension/panel-chat.mjs:42` | 同 4 | 0 |
| 7 | `thincoder-vscode/src/extension/panel-chat.mjs:122` | 同 4 | 0 |
| 8 | `thincoder-vscode/src/extension/panel-chat.mjs:201` | 删指称（`§11.1③/F2` → `F2`；弃空括号） | 0 |
| 9 | `thincoder-vscode/src/extension/panel-project.mjs:40` | 同 4 | 0 |
| 10 | `thincoder-vscode/src/extension/panel-session.mjs:103` | 同 4 | 0 |
| 11 | `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs:2-3` | 删指称（测试头注；两行重排 · 行数不变） | 0 |
| 12 | `thincoder-vscode/test/files.mjs:30` | 删指称（登记注释） | 0 |
| 13 | `thincoder-core/agent-tools/advisor-async.mjs:2` | 改指 `AGENT-LOOP-SUBAGENT.md §6.10` | 0 |
| 14 | `thincoder-core/agent-tools/subagent-async.mjs:46` | 改指 | 0 |
| 15 | `thincoder-core/config.mjs:52` | 改指（`§11.1 D-24a/R14 + §11.2 R13` → `§6.10 D-24a/R14 + R13`） | 0 |
| 16 | `thincoder-cli/src/tui/suspension-drive.mjs`（原 `:36`） | **整行删** | **−1** |

**第 16 处被删行原文（可追溯性记录 · 承内审 🔵#3）**：`// 废弃记录见 AGENT-LOOP.md §11.3。`（源 = 本次实施轮 `git diff` 的 `-` 行，逐字）；全批唯一负向行数变化 ✓。

### 5.2 机检与包测试读数（实施轮实跑 · cwd = 仓根）

| 项 | 读数 |
|---|---|
| **C4**（`/AGENT-LOOP(\.md)?\s+§11/` 三树） | **4** —— `advisor.mjs:50` · `advisor-async.mjs:369` · `subagent-async.mjs:116` · `subagent.mjs:143` = §2.2 判保留 4 处（文案/日志面原样；N3 / E2 ✓） |
| **C5 口径行数** | `agent.mjs` **494** · `setup.mjs` **495** · `run-stages.mjs` 403 · `execute-tools.mjs` 418 · `permission-gate.mjs` 117 · `test/files.mjs` **120**（设计记 119——见 5.4 决策 2） |
| **cli 档行数** | `suspension-drive.mjs` **323**（324 − 1 = 唯一 −1 ✓） |
| **贴线三档（E3）** | `agent.mjs` 494 · `setup.mjs` 495 · `agent-lifecycle-singleton.test.mjs` 491 ⇒ **未增行**（零新增越线）✓ |
| **包测试（B1–B3）** | `thincoder-core` pass **440** / fail **0** · `thincoder-cli` tests **745** / pass **745** / fail **0** · `thincoder-vscode` tests **853** / pass **853** / fail **0** ⇒ **三包全绿** ✓ |
| **C1 / C3**（批级旁读；#138/#140 为他车道） | C1 = **0** · `node scripts/doc-check.mjs --root .` = **exit 0 · 悬空 0 · 行宽 0** ✓ |
| **D6 回读** | 16 处改后样本逐处断言 **16/16 命中 · mismatch 0**；12 档全形族零残留 |

### 5.3 内审 / 代码评审轮次与终态

| 轮 | 执行者 | 结论 | 计数 |
|---|---|---|---|
| 内审（探索只读 · 对设计与交付逐条比对） | explore 子代理 | **CLEAN** —— 四类偏差（部分实现 / 静默简化 / 文档漂移 / 越单改动）**均空**；16/16 逐字命中；Δ 全合；保留面恰 4；裸形面零改 | 偏差 0 |
| 代码评审 轮次 1 | advisor（type=code） | **VERDICT = pass** | 🔴 0 · 🟡 2（均非必改/不阻断）· 🔵 2 |
| **fix round** | — | **0 轮**（无必改发现） | — |

**终态 = `clean`**（内审 0 偏差 + 评审 pass 且无必改项）。

**advisor 发现处置（2 🟡 + 2 🔵 · 全部非必改）**：① 🟡 同族残面未登记（`advisor-async.mjs:23`/`:283`/`:371` 仍为 `AGENT-LOOP.md §6.10` 陈名形 · 与 #139 同型但出族界）= **上抛父侧**（建议登 J-1 残差或另立条目；本批不扩面）；② 🟡 文件体量 advisory（8 档越 300 咨询线 · 无一越 500 · 批内零增长 · VSC 侧在册）= 报告不判；③ 🔵 第 16 处被删行只读不可复核 = **本档 5.1 已补原文记录**（消解）；④ 🔵 读数漂移（`test/files.mjs` 119 → 现势 120 · 已声明）= 报告不判。

### 5.4 决策透明表（实施轮就地判断 · 逐条可核）

| # | 决策 | 依据 |
|---|---|---|
| 1 | 第 11 处两行头注的**折行点**（设计样本在此处省略为 `…`）：落 `:2` 收于 `（2026-09-08——`、`:3` 起 `面板会话级顶层 agent 单例）…` | 样本头形逐字（`— agent 生命周期对齐 CLI（2026-09-08 …`）· 行数 Δ0（贴线档 491 禁增行）· 括号不悬空 |
| 2 | `test/files.mjs` 现读 **120**（设计基线 119）⇒ N4 期望值不可达；本处交付仍 **Δ0** | 并行车道（nested-token）同窗口提交 `5fe7a17d` 追加一行 fixture 登记 ⇒ 非本批改动；已在交付报告上抛 |
| 3 | 第 7 处 `单例——ensureSlot` 归为样本形 `单例（2026-09-08）：ensureSlot` | 设计「改后样本（逐字）」为准（同式先例 = 第 1/2/3 处 `<label>（date）：` 头形） |
| 4 | 第 15 处删第二枚 `§11.2 ` token、保留 `R13` 标号 | 样本逐字 `…§6.10 D-24a/R14 + R13 — POOL-CONFIG-` |
| 5 | 第 8 处 `§11.1③/F2` → `F2`（③ 随指称一并去除） | 样本逐字 `// F2（2026-09-08）：runOpts 不再搬运…` |

### 5.5 上抛项（父侧裁定面 · 本批零动作）

1. **同族残面（§6.10 陈名形）**：`advisor-async.mjs:23`/`:283`/`:371` · `advisor.mjs:218` · `thincoder-core/test/advisor-pool-queue.test.mjs:2` 仍绑 `AGENT-LOOP.md §6.10`（该档现无 §6.10；`AGENT-LOOP.md` 自身把 async advisor 面指向 `AGENT-LOOP-SUBAGENT.md §6.10`）——与 #139 同型、出 KD-3 族界且未入 J-1 登记清单 ⇒ 建议登 J-1 残差 / 另立条目。
2. **读数漂移**：`test/files.mjs` 119 → 120（并行车道提交）；§2.5 / §2.7 N4 读数待父侧收口刷新（或保留偏离声明）。
3. **设计档引用坐标**：§2.4 括注中「与 `advisor-async.mjs:23/:283/:371` 既有同形」实读为 `AGENT-LOOP.md §6.10`（非 SUBAGENT 形；真同形先例 = `advisor.mjs:167`）；§2.2 所引先例 `advisor.mjs:147` 现为 invalids 错误串（`§11.2(R13)` 注释现居 `:153`）——实质主张（有现行靶 + 同法先例）成立，交付不受影响。
4. **判保留 4 处仍为死指称**（模型可见文案/日志面）——按 J-1 在册属独立裁定面，非本批缺陷。

**范围外**：`docs/**`（#138/#140 车道）· 裸形面残族（VSC ≈51 行 / core·cli ≈60 行）· J-1 余族 · 需求档 · `scripts/**` —— 本段零触碰 ✓。

## §6 验证与收口（父代理）

**2026-09-20 15:2x 父侧收口**

**交付核验（两面四道）**：设计（#60）✓ · 评审（id=63 pass 5🟡/2🔵）→ 修正轮（#64 7/7 + 两处自纠）→ 复核（id=67 **pass** · 7/7 真落逐号实核）✓ · **实施两路**：**文档面（#68）**✓——#138 十二档头注 + 22 处片段纯删 + 16 处判保留零改 + 逐档 changelog ✓ · #140 现盘刷新 + 必落注①② + `:265` 对齐 ✓ · DOC-DISCIPLINE 登记 ✓；**产品码面（#69）**✓——#139 十六处（12 删指称 / 3 改指 `AGENT-LOOP-SUBAGENT.md §6.10` / 1 整行删 −1）✓ · 零修正轮 ✓

**读数**：C1 **0**（写前 13）✓ · C2 **16**（写前 50）✓ · C3 `doc-check` exit 0 · 悬空 0 · 行宽 0 ✓ · C4 **4**（= 判保留集；写前 20）✓ · C5 六档 **494 · 495 · 403 · 418 · 117 · 120** ✓（`test/files.mjs` **现势 120**——#137 批同窗口 +1 · 非本批 Δ ✓）· 三包测试 **core 440 / cli 745 / vscode 853** 全绿 ✓ · 贴线三档 **494 / 495 / 491** 零变 ✓ · 唯一 −1 生效 ✓

**父侧裁定与采纳**：① 设计席路线「**就地消解即根因消解，登记不消因**」（#64 · ④-3）= **接受** ✓；② 实施席两处首跑闸红✓（悬空闸 → 「（拟新增）」标记 ✓ · 行宽闸 → 折行 ✓）；③ 两轮自捕偏差（夹具缺陷 · 勘误档名）✓ 全披露

**台账**：**#138 / #139 / #140 → 已核销** ✓

**遗留（显式）**：① 评审三条随收口轮：§2.11 分桶计数收正（VSC-DEBT 2 · 边角 0）· N6 补机检腿（C6）或并回读数形 · 记录面行号 as-of 句；② 本批遗留成新族：`TOOLS.md:363` D8 划改残句（**#142**）· `advisor*.mjs` 陈名形族（**#143**）· `SESSION.md §9+` 引族（**#141**）；③ §2.4/§2.5 设计档引用坐标微偏（实质主张成立 · 无影响）。

**提交**：待入库（本笔 + 后批）。
