# 批：2026-09-18 · 工具失败判据同族残项（`bash` spawn 失败形态）

> 批次边界：交付目标 = 「**`bash` spawn 失败形态纳入失败判据（或给出不纳入的判据）**」；条目源 = `docs/batches/2026-09-18-vsc-session-wiring.md` **§2.6 登记 #11**（同族未登记残）。
> 前情 = `docs/batches/2026-09-18-vsc-session-wiring.md` §2.6 #11（已收口冻结 ⇒ 不回改）。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）

### 1.1 目标与理由

会话接线批（F-W16）把「工具失败可见性」判据扩到 `(exit code N≠0)` 与 `(killed: …)` 两形态。**同族残**：`thincoder-core/tools/bash.mjs:189` 的 **spawn 失败形态**（`Command failed: …`——如 `spawn ENOENT`）产出的是 `result`（非异常抛出）⇒ 在本端新判据（`webview/lib.js` `isToolFailure`）下**仍读绿 + 折叠**，与「非零退出可见」的承诺不一致。用户 2026-09-18 22:22「别等明天了，能做的今天就做」⇒ 本批。

### 1.2 本批覆盖的条目

| # | 需求 | 本批交付 |
|---|---|---|
| ① | **同族残须收口**（§2.6 #11 消解） | 二择一并给判据：**（甲）核面修**——`bash.mjs` spawn 失败形态改为可被判据识别的形态（如 `(spawn failed)` 尾部状态位）；**（乙）判据面扩**——`isToolFailure` 认出 `Command failed:` 前缀。设计须给选型理由 + 影响面（CLI 端亦读该形态 ⇒ 甲/乙的端差须说清） |

### 1.3 本批不做

- 不改 `(exit code N)` / `killed: …` 既有判据（前一族已收口 ✓）。
- 不碰 `(stopped)` 面（前批已裁「形态族不同 · 不入判据」）。
- 不改人读线存储 / 摘要裁剪语义。

### 1.4 边界

- 写域 = `thincoder-core/tools/bash.mjs`（核面补状态位）· **`thincoder-vscode/src/tools/shell.mjs`**（宿主 bash 产者——已裁（甲）扩射程的必然面：spawn 失败与超时两路收正为判据可识形态）· `thincoder-vscode/webview/lib.js`（端侧判据族 +1 成员）· 相应测试档（`thincoder-vscode/test/webview-tool-failure-signal.test.mjs` 扩例 · 新核档 `thincoder-core/test/bash-spawn-failure.test.mjs` · CLI 用例 CL-1）· 设计档 `docs/vsc/design/WEBVIEW.md` §4.3 同步。
- 需求档 = 父侧笔（如需要新条目由父侧落）。

### 1.5 验收口径

1. **可机判**：spawn 失败（如 `spawn ENOENT`）⇒ 卡面**红 + 保持展开 + 摘要含失败状态**（先红形态：现态读绿 + 折叠）。
2. **零回归**：既有两形态判据用例 + 成功面用例全绿；CLI 端形态零回归（或端差登记）。
3. `thincoder-vscode` / `thincoder-cli` 相关测试全绿；`doc-check` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

### 2.1 设计裁定（二择一 → 选型 + 否决 + 端差影响）

| # | 条目 | 裁定（选定 → 否决） | 判据（断言级） | 先红 |
|---|---|---|---|---|
| ① | **同族残须收口**（§2.6 #11 消解；产者面收正——本端真产者 = 宿主 bash） | **选（甲 · 扩射程）：产者两处补状态位** —— ① 核 `thincoder-core/tools/bash.mjs:183-190`（CLI 面产者）尾补独占状态位 `(spawn failed)`；② **本端卡面产者 = 宿主 `thincoder-vscode/src/tools/shell.mjs`**（`:242-260` exec 回调）。**前提收正（评审 id=118 #1 实核）**：本端工具集登记的是宿主实现（`thincoder-vscode/src/tools/index.mjs:29` · `:172-175` 进 `builtinTools` ⇒ `thincoder-vscode/src/agent/setup.mjs:162` · `:307` 绑 `agent.tools`），**核 `bash.mjs` 的 `Command failed:` 形态在本端无产者**（全树 `grep` = 0 命中）⇒ 原「本端卡面收核 spawn 形态」不实；收正后**仍取（甲）扩射程**、不改判核/CLI 面（本端卡面即 F-W16 的用户可见承诺面）。宿主侧同批收正三处（共同规则 = **退出码槽只接受数字**）：spawn 失败 ⇒ `(spawn failed)`（`error.code` 为 errno 字符串 ∧ `child.pid` 未定义 = 进程未启动）；超时 ⇒ `(killed: timeout <N>ms)`（旧形 `(killed — timeout …)` = 破折号形，判据不认）；输出超容 ⇒ `(killed: output limit exceeded)`（旧形 `(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)`）。端侧判据族**随扩一名**（`thincoder-vscode/webview/lib.js` `toolFailureStatus` 正则 + 分支各一处；`isToolFailure` 零改——经其派生）。**否决（乙）判据面认 `Command failed:` 前缀**：① 措辞跨端耦合（端侧判据写死产者消息字面 ⇒ 产者改字即静默复辟——正是本缺陷类）② **第三信号仍缺**（该分支不产状态文本 ⇒ `resultSummary` 落 `last="(empty)"` ∧ `status=""` ⇒ 摘要仍读 `→ (empty)` ⇒ 须**二次手术** = 比甲更散的两处改）③ CLI 端零收益（见下表）④ 判据集失界（认「产者消息前缀」则边界不可枚举）。**否决第三路 `Error:` 前缀**（核侧控制信号——`thincoder-core/agent/dispatch.mjs:369` · `:420` · `:426` · `:438` 与 `thincoder-vscode/src/agent/execute-tools.mjs:249` 同读；射程为零但语义升格面 + 第三信号仍缺）。**否决第四路伪造 `(exit code N)`**（进程未启动、退出码不存在 ⇒ 造假状态骗模型）。**否决改判射程（只收核/CLI 面）**：本端卡面即本缺陷的用户可见面 ⇒ 改判 = 承诺落空（id=118 #1 二择一之乙）。**否决把 spawn 错词写进退出码槽**（`(exit code ENOENT)` = 既非退出码也非族形态 ⇒ 判据不认，正是现缺陷） | W16-7 活卡 result = **宿主 bash spawn 真产形**（`bashTool.execute({command:"echo hi"},{cwd:<不存在目录>})`）⇒ 状态词 `tool.error` + 红 + 保持 `open` + `aria-expanded="true"` + 摘要 `→ (spawn failed)`；W16-8 恢复卡同判据（同真产形）；W16-11 活卡 = 宿主超时真产形 ⇒ 红 + 保持展开 + 摘要 `→ (killed: timeout 400ms)`；C-1 核产形尾行 `=== "(spawn failed)"` ∧ 首行 `/^Command failed: /` ∧ `!startsWith("Error:")`；C-3 宿主产形尾行 `=== "(spawn failed)"` ∧ 诊断行含 `ENOENT` | W16-7 / W16-8 现态红（**真产形**：绿 + 折叠 + `→ (exit code ENOENT)`——读数见 2.3）；W16-11 现态红（绿 + 折叠 + `→ (killed — timeout 400ms)`）；C-1 现态红（无状态位）；C-3 / C-4 / C-6 现态红（见 2.3） |

**端差影响（逐选型 · CLI 端读同一人读线的表现——真读数 · CLI 代码本批零改）**

| 选型 | CLI 读数（`thincoder-cli/src/tui/tool-summaries.mjs:60-68`） | 本端读数 | 结论 |
|---|---|---|---|
| 现态 | `bash: (empty)`（实跑——核产形） | 绿 + 折叠 + `→ (exit code ENOENT)`（实跑——**宿主真产者**） | 两端**同残**（各端各自的产者；核 spawn 形在本端无产者） |
| **（甲·扩射程）选定** | `bash: (spawn failed)`（实跑——该档认「末条非包装行」） | 红 + 保持展开 + `→ (spawn failed)` | **两端同修**：CLI 零改即得可见信号；本端既有端差二条（卡态为本端独有 / 成功面不拼 `(exit code 0)`）不变 |
| （乙）否决 | 仍 `bash: (empty)`（端侧零改） | 红 + 折叠 + `→ (empty)`（摘要未修） | 残项在 CLI 端存续 + 判据跨端措辞耦合 |

- 形态合法性：进程未启动 ⇒ **无退出码**可拼（禁伪造）；`(spawn failed)` 是「调用未启动」的如实状态位。同族对照 = `thincoder-core/tools/execute.mjs:144`（`Error: failed to start node: …`——execute 侧 spawn 失败走既有 `Error:` 前缀分支；本批零触该档）。
- 可达性对照：spawn 形态**天然短**（子进程未启动 ⇒ 无输出体）⇒ 会话接线批 §2.6 #9 的人读线瘦身截尾（`thincoder-core/session-segments.mjs:53-55` 头 500 字符）对本形态**不可达** ⇒ 恢复卡同判据在此成立（长结果面残项仍另案）。

### 2.2 机制落点（单源）

- 设计单源 = `docs/vsc/design/WEBVIEW.md` **§4.3**（工具失败可见面——判据族三成员闭集句 · 两端同读句 · 边界句「判据只认状态位、不认产者措辞」· 形态可达性两则）。
  **坐标收正 1 处（一致性面 · 已就地收正）**：派单所称「§4.4（工具失败可见面）」与该档实况不符——`§4.4` = 恢复面用户文本清洗（F-W15）；工具失败可见面实居 **§4.3**（承会话接线批）。本批按实况落 §4.3。
- 决策 = §6 **D-W19**（含三条否决备选）· 交互 = §8 **U-W11**（spawn 失败摘要 = 状态位本体）· 回指 = §10 行 10 补词（行数不变——11 行）· 变更记录 +1 条（3 行）。
- 需求档零笔（父侧笔）；`thincoder-core/tool-docs/bash.md` 零触（见 2.8 #2）。

### 2.3 先红读数（**实跑**，非推理）

| 读数面 | 命令 / 输入 | 现态读数 |
| **本端产者（宿主 bash）** | 真 `thincoder-vscode/src/tools/shell.mjs` `bashTool.execute({command:"echo hi"},{cwd:"<不存在目录>"})` | `"(exit code ENOENT)"`——**无状态位**（errno 字符串被塞进退出码槽）；`isToolFailure` = false |
| 本端产者（超时） | 同档 `{command:<sleep 5s>, timeout:400}` | `"(killed — timeout 400ms)"`——破折号形（族要求 `killed: ` 冒号形）⇒ false |
| 本端产者（输出超容） | 同档 3MB stdout | 尾行 `"(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)"` ⇒ false |
| 本端产者（既有形态锚） | 同档 `{command:"echo hi"}` / `{command:"exit 3"}` | `"[stdout]:\nhi\r\n\n(exit code 0)"`（绿 ✓）/ `"(exit code 3)"`（**判据已真** ⇒ 本端非零退出面本来就在闸内） |
| 本端产者（中止面 · **登记不修**） | 同档 + `AbortSignal` 中止 | `"(stopped)"` / `"[stdout]:\n111\n(stopped)"` ⇒ false（`(stopped)` 裁定不动——见 §2.8 #8） |
| 核产形（CLI 面产者） | 真 `thincoder-core/tools/bash.mjs` `bashTool.execute({command:"echo hi"},{cwd:"<不存在目录>"})` | `"Command failed: spawn C:\Windows\system32\cmd.exe ENOENT\n[stdout]:\n(empty)"`（无状态位；`startsWith("Error:")` = false） |
| 端判据（两形） | `lib.isToolFailure(<上式>)` / `lib.toolFailureStatus(<上式>)` | `false` / `""`（**两产者同残**） |
| 端活卡（真产形直喂） | 真 `ui.js` 路径（`addTool` → `finishTool`）· result = 宿主 spawn 真产形 | 状态词 `done (1ms)` · 色 `#4ec9b0`（绿）· `body.open = false` · `aria-expanded="false"` · 摘要 `→ (exit code ENOENT)` |
| 端恢复卡 | 真 `tool-card-restore.mjs` `buildFinishedToolCard({name:"bash",args,result:<宿主 spawn 真产形>})` | 状态词 `done` · 绿 · 折叠 |
| 端活卡（目标形预演） | result = `…\n(spawn failed)`（判据未扩 ⇒ 现态） | 绿 + 折叠 + 摘要 `→ (spawn failed)`（**先红 = 卡面缺红/展开**；摘要文本本身已就位） |
| CLI 端（现态） | 真 `formatToolSummary("bash", <核 spawn 真产形>)` | `"bash: (empty)"`（**同残**——本批新发现） |
| CLI 端（目标形） | `formatToolSummary("bash", "[stdout]:\n(empty)\n\n(spawn failed)")` | `"bash: (spawn failed)"`（端侧零改即得 ✓ 实跑） |
| **第二先红** | `lib.isToolFailure(<目标形态>)`——目标形态 = 尾行 `(spawn failed)` | `false` ⇒ **两产者 + 端判据须同批落地**（只改一处 ⇒ 形式落地而判据不认 / 或用例恒红） |

> 读数口径：上表全为本修轮（2026-09-18 22:4x–22:5x）**实跑**读数——真产者直跑（宿主 `shell.mjs` / 核 `bash.mjs`）+ 真 `ui.js` / `tool-card-restore.mjs` / `formatToolSummary` 消费面；**无夹具手写字符串**（评审 #1 的处置本体）。
| **第二先红** | `lib.isToolFailure(<目标形态>)`——目标形态 = 尾行 `(spawn failed)` 的产形 | `false` ⇒ **核面 + 端面须同批落地**（只改一处 ⇒ 形式落地而判据不认 / 或用例恒红） |

### 2.4 用例表（先红 + 恒绿）

| # | 类 | 输入 | 期望（断言级） | 现态 |
|---|---|---|---|---|
| W16-7 | 正常（**先红**） | 活卡 result = **宿主 bash spawn 真产形**（`shell.mjs` `bashTool.execute({command:"echo hi"},{cwd:<不存在目录>})` 直喂——**禁夹具手写字符串**，评审 #1 判据） | 状态词 `tool.error` + 红 + `body.open = true` + `aria-expanded="true"` + 摘要 `→ (spawn failed)` | 红（绿 + 折叠 + `→ (exit code ENOENT)`——2.3 实跑） |
| W16-8 | 正常（**先红**） | 恢复卡 `buildFinishedToolCard({name:"bash", args, result:<同真产形>})` | 状态词 `tool.error` + 红 + 展开 | 红（绿 + 折叠） |
| W16-9 | 边界（**恒绿** · 判据精度） | 正文提及 `see (spawn failed) in log`（非独立成行） | 不判失败（绿 + 折叠 + 摘要照旧） | 绿（锁定） |
| W16-10 | 边界（**恒绿** · 锁否决面） | **三形**：① `Command failed: …\n[stdout]:\n(empty)`（无状态位 = （乙）所认措辞面）② `(exit code ENOENT)` ③ `(killed — timeout 400ms)`（②③ = 收正前宿主历史形） | **均不判失败**（判据只认族形态 ⇒（乙）不得从判据面复辟；非数字退出码槽不入判据）；他日再现「无状态位的失败形态」= 新残（登记路径同 §2.6 #11 体例） | 绿（锁定——②③ 本修轮对现态 `lib.js` 实跑 = false） |
| W16-11 | 正常（**先红**） | 活卡 result = **宿主 bash 超时真产形**（`{command:<sleep 5s>, timeout:400}` 直喂） | 状态词 `tool.error` + 红 + 保持展开 + 摘要 `→ (killed: timeout 400ms)` | 红（绿 + 折叠 + `→ (killed — timeout 400ms)`——2.3 实跑） |
| W16-1…W16-6（既有 · **恒绿回归锚**） | 非零退出（空 / 有输出）· 被杀两值 · 退出 0 · 反例非独立成行 · 恢复卡 | 同前批 | 全绿（零回归） | 绿 |
| C-1（核新档 · **先红**） | 正常 | `bashTool.execute({command:"echo hi"},{cwd:<不存在目录>})` | 末条非空行 `=== "(spawn failed)"` ∧ 首行 `/^Command failed: /` ∧ `!result.startsWith("Error:")` | 红（无状态位） |
| C-2（核新档 · 恒绿锚） | 正常 | `bashTool.execute({command:"echo hi"},{cwd:<tmp>})` / `{command:"exit 3"}` | 含 `(exit code 0)` / 含 `(exit code 3)` ∧ 二者均不含 `(spawn failed)` | 绿（既有产形锁定——2.3 实跑基线） |
| C-3（端产者新档 · **先红**） | 正常 | 宿主 `bashTool.execute({command:"echo hi"},{cwd:<不存在目录>})` | 末条非空行 `=== "(spawn failed)"` ∧ 诊断行 `/^Command failed: /`（含 `ENOENT`） | 红（`"(exit code ENOENT)"`） |
| C-4（端产者新档 · **先红**） | 正常 | 宿主 `{command:<sleep 5s>, timeout:400}` | 末条非空行 `=== "(killed: timeout 400ms)"` | 红（`"(killed — timeout 400ms)"`） |
| C-5（端产者新档 · 恒绿锚） | 正常 | 宿主 `{command:"echo hi"}` / `{command:"exit 3"}` | 含 `(exit code 0)` / 含 `(exit code 3)` ∧ 二者均不含 `(spawn failed)` | 绿（实跑基线） |
| C-6（端产者新档 · **先红**） | 边界 | 宿主 3MB stdout | 末条非空行 `=== "(killed: output limit exceeded)"` | 红（`(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)`） |
| CL-1（CLI 新档 · **先红**） | 正常 | 真核 `bashTool.execute({command:"echo hi"},{cwd:<不存在目录>})` → `formatToolSummary("bash", <该产形>)` | `=== "bash: (spawn failed)"` | 红（`"bash: (empty)"`——2.3 实跑） |

用例号口径：W16-7…W16-11 = **F-W16 用例族续号**（承会话接线批 W16-1…W16-6，同一需求面不断线）；C-1 / C-2 = 核产者用例（`thincoder-core/test/bash-spawn-failure.test.mjs`）；**C-3…C-6 = 端产者用例**（`thincoder-vscode/test/shell-spawn-failure.test.mjs`）；CL-1 = CLI 侧用例（`thincoder-cli/test/tool-summary-spawn-form.test.mjs`）。

### 2.5 受影响文件表（行数 as-of 2026-09-18 22:3x 实测 + Δ）

| 文件 | 行数 as-of | tier | Δ 预期 | 改动点 |
|---|---|---|---|---|
| `thincoder-core/tools/bash.mjs` | 268 | ≤300 咨询档（余 32）· ≤500 硬限 | +2~4 | `:183-190` spawn 错误分支：parts 化 + 尾状态位 `(spawn failed)` + 注释；首行 `Command failed: <message>` 与 `[stdout]:` 段**原样保留** |
| `thincoder-vscode/src/tools/shell.mjs` | 319 | ≤500 硬限 | +3~7 | `:242-260` exec 回调三处收正（**退出码槽只接受数字**）：`:252` 超时形 ⇒ `(killed: timeout <N>ms)`；`:258` 退出码槽按 `typeof error.code === "number"` 判 + `child.pid === undefined` ⇒ `(spawn failed)` / 否则（输出超容）⇒ `(killed: output limit exceeded)`；spawn 失败面补诊断行 `Command failed: <error.message>`（核产者同款——**不入判据**，模型/用户仍得 errno） |
| `thincoder-vscode/webview/lib.js` | 96 | 远低 300 | +3~5 | `:71-81` `toolFailureStatus`：正则增 `spawn failed` 备选 + 分支；`:66-70` / `:84-90` 两处注释载第三成员（D3 计数纪律） |
| `thincoder-vscode/test/webview-tool-failure-signal.test.mjs` | 140 | 测试档 | +~45 | W16-7 / W16-8 / W16-11（**真产者输入**——直跑宿主 `shell.mjs`）+ W16-9 / W16-10 扩形 + 头注（设计权威行补 §6 D-W19 · §8 U-W11 与本批档指针） |
| `thincoder-vscode/test/shell-spawn-failure.test.mjs` | **新档 0** | 测试档（**须登记 `test/files.mjs`**——清单制自检 fail-closed） | +~55 | C-3…C-6（宿主产者四态：spawn 失败 / 超时 / 输出超容 / 既有形态锚） |
| `thincoder-core/test/bash-spawn-failure.test.mjs` | **新档 0** | 测试档（核 runner 单层 glob 自动收集——无清单档） | +~40 | C-1 先红 + C-2 恒绿 |
| `thincoder-cli/test/tool-summary-spawn-form.test.mjs` | **新档 0** | 测试档（CLI runner 两层 glob 自动收集——无清单档） | +~25 | CL-1（核真产形 → `bash: (spawn failed)`） |
| `thincoder-vscode/test/files.mjs` | 95 | 测试清单 | +1 行 | 新档登记行 + `:92` 注释「W16-1…W16-6」→「W16-1…W16-11」（D3——新增用例号须随清单注释同改） |
| `docs/vsc/design/WEBVIEW.md` | 336（改前 325）→ **349**（本修轮读回实测） | ≤500 硬限 | 设计轮 +11 · **本修轮 +13** | §4.3（产者面 / 失败信号数端差 / 非数字退出码槽边界 / 摘要面收窄）· §6 D-W19（补产者两处 + 否决项——同行）· §8 U-W11 · §10 行 10（同行补产者坐标 · 行数不变——11 行）· 变更记录 +1 条（3 行） |

**设计轮 Δ 分项收正（评审 #5 off-by-one）**：11 = **6**（§4.3）+ 1（D-W19）+ 1（U-W11）+ 0（§10 同行）+ 3（变更记录）——原记 §4.3 为 7（错 1）；336 − 325 = 11 ✓ 自洽。**位移判据（两插入点分段）**：§4.3 +6 在 D-W6 行之上 · D-W19 +1 在其下 ⇒ 225（D-W6）/ 254 / 256 = +6 / +7 / +7 **非均匀而正确**（原 §2.6 #5 记为「非均匀 ⇒ 须一致」= 误判；本修轮实测 +9 / +9 / +9 均匀 = 新增全在报告行之上，同判据双向验证）。

新增档 3 个（`thincoder-vscode/test/shell-spawn-failure.test.mjs` · `thincoder-core/test/bash-spawn-failure.test.mjs` · `thincoder-cli/test/tool-summary-spawn-form.test.mjs`）+ `files.mjs` 清单 +1 行；无删档；无跨 500 硬限档。

### 2.6 验收（逐条可机判）

1. **端用例（本端卡面）**：`node --test thincoder-vscode/test/webview-tool-failure-signal.test.mjs` ⇒ 全绿（W16-1…W16-6 既有 + W16-7…W16-11 新增）；**先红三例（W16-7 / W16-8 / W16-11）实现前必红**（读数 = 2.3；**输入取自真产者**——`import` 宿主 `shell.mjs` 直跑取产形，非夹具手写字面串）。
2. **端产者用例**：`node --test thincoder-vscode/test/shell-spawn-failure.test.mjs` ⇒ 全绿；**C-3 / C-4 / C-6 实现前必红**。
3. **核用例**：`node --test thincoder-core/test/bash-spawn-failure.test.mjs` ⇒ 全绿；**C-1 实现前必红**。
4. **CLI 用例**：`node --test thincoder-cli/test/tool-summary-spawn-form.test.mjs` ⇒ 全绿；**CL-1 实现前必红**（`bash: (empty)`——2.3 实跑）。
5. **三套测试闸零回归**（批档 §1.5 #3 口径）：`cd thincoder-vscode && npm test` ∧ `cd thincoder-core && npm test` ∧ `cd thincoder-cli && npm test` 全绿；VSC 侧清单自检：新增档须同批登记 `test/files.mjs`（未登记档永不执行 ⇒ 自检即失败）。
6. **判据真值表（一行机判）**：`isToolFailure` 八形态 = `[true, true, true, false, false, false, false, false]`——顺次 = 目标 `(spawn failed)` 形 / `(exit code 1)` / `(killed: timeout 400ms)` / `(exit code 0)` / `Command failed:` 无状态位 / `(exit code ENOENT)` / `(killed — timeout 400ms)` / `(stopped)`（后两形 = 收正前宿主历史形；本修轮已对现态 `lib.js` 实跑后五形）；实现轮取真读数回填 §5。
7. **doc-check 按档归属零新增**：`node scripts/doc-check.mjs` ⇒ `docs/vsc/design/WEBVIEW.md` **零悬空 ∧ 零 >300 字符行**（表行不计——决策表长行为既有形态；本修轮实测：**349 行**（`split("\n")` 含尾行）· 超宽 = 0）；**全仓读数 = 5 悬空 / 11 超宽（与批前同值**——本修轮实跑）；`WEBVIEW.md` 的 7 条「符号·宽」报告行 = 既有（不入闸）；**行位移实测 225 / 254 / 256 → 234 / 263 / 265（+9 / +9 / +9 均匀**——本修轮新增全在报告行之上）。
8. **上游语义零触碰**：`thincoder-core/agent/dispatch.mjs:445` 的 `ok: true`（设计意图 I-8）零改；新产形 `!startsWith("Error:")`（C-1 断言锁 ⇒ 核侧控制信号零触碰）。

### 2.7 边界（本批不做）

- 不改 `(exit code N)` / `(killed: …)` 既有判据真值（`toolFailureStatus` 仅**增**备选 `spawn failed`；既有成员判定序与时序不变）；不碰 `(stopped)` 裁定（核 `thincoder-core/tools/execute.mjs:147` 与宿主 `thincoder-vscode/src/tools/shell.mjs:88` · `:248` · `:300` 同形——**均不入集**；宿主中止面形态端差 = §2.8 #8 登记）。
- **不改 `ui.js`**（批档 §1.4 写域未含该档）：`resultSummary` 的 `WRAPPER` 正则（`ui.js:277`）**不扩**——`(spawn failed)` 摘要行为 = 状态位本体（**无输出形**零影响；非空输出形末行不入摘要 = 已知形态差，登记见 §2.8 #3）。
- **不改宿主终端可见路两形**（`shell.mjs:85` / `:95`——无 harness 可验 ⇒ 登记不修，见 §2.8 #8）；**不改需求档**（父侧笔——待收正项见 §2.8 #5）。
- 不改人读线存储 / 摘要裁剪语义（`session-segments.mjs` 零触）；不引撒销机制；`_archive/**` 零触；已收口批档（会话接线批 / 密钥确认批等）零触。
- 不改实现面代码（本轮只设计）；`thincoder-core/tool-docs/bash.md` 零触（见 §2.8 #2）。
- **写域扩一档**：`thincoder-vscode/src/tools/shell.mjs`（选甲·扩射程的必然面——父侧派单 §① 已明列该档 ⇒ 视为已授权；**§1.4 写域行由父侧收正**，见修正轮上报）。

### 2.8 上抛项（范围外发现 / 父侧裁）

1. **CLI 端同残（本批新发现 · 附读数）**：`formatToolSummary("bash", <现态 spawn 形态>)` = `"bash: (empty)"`（`thincoder-cli/src/tui/tool-summaries.mjs:60-68`）⇒ **CLI 端亦丢失败信号**（#11 原登记只载本端卡面）。（甲）落地后两端同修（CLI 零改即得 `bash: (spawn failed)`）；**若父侧认为 CLI 端还须独立可见性（色 / 标记）**，= 新条目（CLI 无卡态语义；端差登记面 = `docs/vsc/requirements/WEBVIEW.md` §4 = 父侧笔）。
2. **`thincoder-core/tool-docs/bash.md:17-26` 输出格式块仅列 `(exit code N)`**（`(killed: …)` 亦未列——既有简化，非本批引入；本批新产形同不入该块）⇒ **是否补两态 = 父侧裁**（工具描述 / 提示词面 = 父侧笔 · 本批零触）。附：`tool-docs/` 无 `docs/**` 模板镜像（`glob **/tool-docs/bash.md` = 1 命中）⇒ 若补为单档改。
3. **`ui.js:277` `WRAPPER` = 状态位族在消费面的第二份枚举**（D2 单源张力 · 本批零动作）：族扩面须同看；**「摘要零影响」只成立在无输出形**（`→ (spawn failed)` = 状态位本体）；**非空输出形**下 `(spawn failed)` 不过滤 ⇒ 末行输出不入摘要（与 `(exit code N)` 不同形——2.3 / 设计 §4.3 实跑在案）；单源化候选 = `lib.js` 出状态位谓词、`ui.js` 读之（`ui.js` 现 474 行 · 近 300 咨询档 ⇒ 宜随该档下次触碰）。
4. **实现轮并列项**：第二先红（2.3 末行）⇒ **核面 + 端面须同批落地**（只改核面 ⇒ 判据不认；只改端面 ⇒ 产者不产状态位）——已列为验收 1 / 2 的并列项。
5. **需求档侧待收正（父侧笔 · 评审 id=118 #2 实核 · 本批只登记坐标）**：`docs/vsc/requirements/WEBVIEW.md:39`（F-W16 行）① **射程半句**：字面 =「工具非零退出可见性（CLI 对位）」——spawn 失败 / 被杀同族但字面未列 ⇒ 建议补「含同族无退出码形态（spawn 失败 · 被杀）」或明文认账（否则下一位读者按字面读会认为本批越射程）；② **证据单元格滞后（同行）**：仍写修复前机制 `webview/ui.js:291` `isError=/^Error[:：]/`（`:291` 现为注释行；判据实为 `webview/ui.js:295` 消费 `webview/lib.js:91-96` `isToolFailure`）∧ `ui.js:276-283` 实为 `:276-287`；③ **产者坐标**：该行只载核产者（`tools/bash.mjs:225-227`）——本端真产者 = `thincoder-vscode/src/tools/shell.mjs:242-260`，建议同补。本批按批档 §1.2 ① 执行（批 = 任务书）；需求档 = 父侧笔，本项**只登记不代写**。
6. **批档 §1 状态行形态收正（本批自身动作 · 机械面）**：本档 §1 状态行原写于档头引块（`> 状态行：…`——不在 `## §1` 段内、且非 `**状态行**：` 形态）⇒ `batch_segment` 解析 fail-closed（§2 拒写）。已按 `thincoder-core/agent-tools/batch-segment.mjs:42` 判据移入 **§1 首行**，**值逐字未改**——与会话接线批 §2.6 #8 同款处置。
7. **并行实例在飞（仅记录 · 零动作）**：本设计轮两次 `doc-check` 之间，`docs/vsc/design/VSC-DEBT.md`（22:28 · 49,242 字节；21:58 为 26,596）与 `SETTINGS.md`（22:27）处**他实例在写**状态 ⇒ 全仓读数瞬时 +4 悬空 / +3 超宽（新增坐标全在这两档）；第三次读数回落至批前值（5 / 11）。非本批面（本批档归属恒零新增）。

8. **宿主 bash 同族第二 / 第三处残项（评审 id=118 #4 处置 · 本批登记不修——消解路径 + 到期条件在册）**：① **终端可见路两形**：`(killed — timeout ${…}ms; interrupted in the terminal)`（`thincoder-vscode/src/tools/shell.mjs:85`）与 `(exit code unavailable in terminal mode — watch the terminal if it matters)`（`:95`）——判据均不认 ⇒ 读绿（仅摘要照显文本）；**本批不修**（终端路须真 VS Code shell integration，仓内测试面无 harness ⇒ 改动不可验证）。消解路径 = 终端完成面取 shell integration 的退出码（`TerminalShellExecution` 面——本端未用，可行性未验）或按族形态改写两形；到期条件 = 终端模式面（`runInVisibleTerminal`）下次触碰。
   ② **新发现：中止面同语义两形端差**——宿主用户中止 = `(stopped)`（`shell.mjs:88` · `:248` · `:300`），核用户中止 = `killed: user interrupted`（`thincoder-core/tools/bash.mjs:220-223`）⇒ **本端中止读绿、CLI 端中止读红**（同一用户动作两端不同判；实跑在案：`AbortSignal` 中止 = `"(stopped)"` / `"[stdout]:\n111\n(stopped)"`）。消解路径 = 宿主对齐核形（`killed: user interrupted`），或把 `(stopped)` 纳入族（**须先推翻既有 `(stopped)` 裁定**）；到期条件 = 宿主 bash 终止面下次触碰。本批零动作（禁改既有裁定）。
   ③ 输出超容形（`:258` 旧形 `(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)`）**本批已收正**（⇒ `(killed: output limit exceeded)`）⇒ 不登记（用例 C-6）。
9. **CLI 侧测试面读数（评审 #3 的豁免依据 + 新建项）**：CLI 无失败判据面（TUI 完成行不判色、无卡态）⇒ 同族在 CLI 侧的机判面 = **摘要一处**（CL-1）；本修轮 `grep formatToolSummary` 全仓 = 仅 `src/tui/tool-events.mjs:20` · `:273` 与 `_archive` 文档，**CLI 测试面零命中该档** ⇒ CL-1 为新档首例（消解路径 = 随 CLI 摘要面下次触碰扩至 bash 之外的工具形态；到期条件 = 同前）。

**设计就绪**：机制单源 = `docs/vsc/design/WEBVIEW.md` §4.3 · §6 D-W19 · §8 U-W11；本 §2 = 批任务面（条目 / 用例 / 受影响文件 / 验收 / 边界 / 上抛）。评审与批准 = 父侧点火。

### 2.9 评审修正轮（id=118 · 🔴1 · 🟡3 · 🔵2——逐号落地 · 2026-09-18 22:5x）

**选型裁定（#1）**：取 **（甲 · 扩射程）**——产者两处补状态位（核 `thincoder-core/tools/bash.mjs:183-190` + 宿主 `thincoder-vscode/src/tools/shell.mjs:242-260`，**同名同形** `(spawn failed)`）；**否决（乙）改判核/CLI 面收口**（本端卡面即 F-W16 的用户可见承诺面 ⇒ 收口 = 承诺落空）。前提收正：本端工具集登记的是宿主实现（`thincoder-vscode/src/tools/index.mjs:29` · `:172-175` ⇒ `thincoder-vscode/src/agent/setup.mjs:162` · `:307`）⇒ 核 `bash.mjs` 形态在本端无产者（评审 #1 实核成立）。

| 发现号 | 处置 | 坐标（读数） |
|---|---|---|
| #1 🔴 | §2.1 裁定前提收正 + 取（甲·扩射程）；§2.3 / §2.4 用例输入**全部换真产者直跑**（禁夹具手写字符串）；设计 §4.3 增「产者两处」句 · §6 D-W19 补产者两处 + 否决改判 | 批档 §2.1（`:45`）· §2.2 端差表（`:51-53`）· §2.3（`:68-80`）· §2.4（`:87-101`）；设计 `docs/vsc/design/WEBVIEW.md` §4.3 `:104-109` · §6 `:241` |
| #2 🟡 | 登记需求档待收正三项（射程半句 · 证据单元格 `ui.js:291` → `lib.js:91-96` + `ui.js:295` · 产者坐标）——**父侧笔，只登记不代写** | 批档 §2.8 #5（`:149`） |
| #3 🟡 | 验收补 **CLI 闸**（三套 `npm test`）+ 新建用例 CL-1（核真产形 → `bash: (spawn failed)`）+「CLI 摘要面零用例」实测依据在册 | 批档 §2.6 #4 / #5（`:128-129`）· §2.5（`:115`）· §2.8 #9（`:156`） |
| #4 🟡 | 超时形**分治**：子进程路（`shell.mjs:252`）本批收正 ⇒ `(killed: timeout <N>ms)`（判据既有成员——**零判据扩**）；终端路两形（`:85` · `:95`）**登记不修**（无 harness 不可验证）；另新发现「中止面同语义两形端差」（宿主 `(stopped)` vs 核 `killed: user interrupted`）同登记 | 设计 §4.3 `:110` / `:118-119`；批档 §2.8 #8（`:153-155`）· §2.4（W16-11 · C-4） |
| #5 🔵 | 分项收正 = **6 + 1 + 1 + 0 + 3 = 11**（原 §4.3 记 7）✓ 与 336 − 325 = 11 自洽；并纠正位移判据：**两插入点分段** ⇒ +6 / +7 / +7 非均匀而正确（本修轮 +9 / +9 / +9 均匀 = 同判据反向验证） | 批档 §2.5 末两段（`:119-121`）· §2.6 #7（`:131`） |
| #6 🔵 | 「摘要零影响」收窄为**无输出形**，并写明非空输出形形态差（末行不入摘要 ≠ `(exit code N)` 形） | 设计 §4.3 `:121-124`；批档 §2.7 · §2.8 #3（`:147`） |

**本修轮实测读数**（真产者直跑 + 真消费面）：宿主 spawn = `"(exit code ENOENT)"`（判据 false）· 宿主超时 = `"(killed — timeout 400ms)"`（false）· 宿主超容尾行 `"(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)"`（false）· 宿主中止 = `"(stopped)"`（false）· 核 spawn = `"Command failed: spawn …ENOENT\n[stdout]:\n(empty)"`（false）· 真活卡（宿主真产形）= `done` + 绿 + 折叠 + 摘要 `→ (exit code ENOENT)` · 真恢复卡同 · CLI `formatToolSummary` = `"bash: (empty)"` → 目标形 `"bash: (spawn failed)"` ✓。

**待裁 / 待办（父侧）**
1. **§1.4 写域行须补一档**：本批写域扩至 `thincoder-vscode/src/tools/shell.mjs`（选甲·扩射程的必然面；派单 §① 已明列该档 ⇒ 视同已授权，§1 行由父侧收正）。
2. **需求档两处（父侧笔）**：F-W16 射程半句 + 证据单元格坐标（见 §2.8 #5）——本批只登记。
3. **§2.8 #2（`tool-docs/bash.md:17-26` 输出格式块补两态）** 沿用上一轮上抛，未决。
4. **实现轮并列**：C-1 / C-3 / C-4 / C-6 与 W16-7 / W16-8 / W16-11 须同批落地（第二先红——只改一处 ⇒ 形式落地而判据不认）。
5. **文档产物**：机制单源 = 设计 `docs/vsc/design/WEBVIEW.md` §4.3 · §6 D-W19（本修轮改写 6 处 + 变更记录 +1 条；`doc-check` 按档归属零新增——全仓 5 悬空 / 11 超宽，WEBVIEW.md 超宽 0）。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🔴 | **前提不实 · 目标产者错位**：批档 §1.1 / §2.1 的落点前提「本端卡面会收到核 `bash.mjs:189` 的 `Command failed: …` spawn 形态」不成立——本端 `bash` ≠ 核 `bash.mjs`。实核证据链：① `thincoder-vscode/src/tools/index.mjs:29` `import { bashTool } from "./shell.mjs"`、`:172-175` 该实例进 `builtinTools`；② `thincoder-vscode/src/agent/setup.mjs:162`（`baseTools = builtinTools…`）· `:307`（`agent.tools = baseSet`）= 本端运行时工具集；③ 核登记册无 bash（`thincoder-core/agent-tools.mjs:6-23` 全为纪律/家族工具；`family-tools.mjs:121` 只追加元工具），本端无核 bash 路径；④ `thincoder-vscode/**` 全树 `grep "Command failed"` = **0 命中**（该形态在本端无产者）；⑤ 宿主 bash 的 spawn 失败面 = `thincoder-vscode/src/tools/shell.mjs:242-260` 的 exec 回调（非 AbortError 且非 `error.killed` ⇒ `(exit code ${error.code ?? 1})`；spawn 失败时 `error.code` 为 errno 字符串——Node 语义、未在仓内验证）⇒ `(exit code ENOENT)` 不匹配 `lib.js:75` 的 `exit code (\d+)` ⇒ 加 `(spawn failed)` 后**仍读绿 + 折叠**（摘要 `→ (exit code ENOENT)`；若落到 `?? 1` 分支则读红）。后果：批档 §1.5 #1（卡面红 + 展开 + 摘要含失败状态）在真路径上**不因本改而变**；W16-7 / W16-8 的先红 = 夹具喂手写字符串的先红（§2.3 端侧读数 = happy-dom 手写 result），实现后用例全绿而用户可见面未修。 | 先按真产者复核目标端链路（输入取自宿主 bash 的真产形，而非手写字符串），再定射程：或把宿主 bash 的 spawn/错误面纳入同族（含其状态位形态与端侧判据成员），或把本批改判为核/CLI 面收口、本端宿主面残项按 §2.6 #11 体例登记（消解路径 + 到期条件）。 |
| 2 | Requirements | 🟡 | **需求档侧滞后（父侧笔，设计未触）**：`docs/vsc/requirements/WEBVIEW.md:39`（F-W16）字面射程 = 「非零退出」，spawn 失败（无退出码）同族但字面未列（设计 §2.8 #5 已上抛 ✓）；同行证据单元格仍写修复前机制（`webview/ui.js:291` `isError=/^Error[:：]/`）——实核：`ui.js:291` 现为注释行、判据实为 `isToolFailure`（`ui.js:295` · `lib.js:91-96`），与 `WEBVIEW.md:104` 的「判据单源」句不同步；`ui.js:276-283` 亦已延到 `:287`。 | 父侧裁：F-W16 补半句射程（或明文认账），并把证据单元格收正为判据单源坐标（或标注「修复前快照」）。 |
| 3 | Acceptance | 🟡 | **验收闸缺 CLI**：批档 §1.5 #3 明列 `thincoder-vscode` / `thincoder-cli` 相关测试全绿；设计 §2.6 #4 只闸 `thincoder-vscode` + `thincoder-core`。本改确改 CLI 可见面：核 bash 产形经 `thincoder-cli/src/tui/tool-summaries.mjs:60-68`（「末条非包装行」）读作 `bash: (empty)`（改前）→ `bash: (spawn failed)`（改后），两读数已按码追溯。 | 验收补 `thincoder-cli` 测试闸；若确无命中面，给出「CLI 测试面零触及 bash 摘要形态」的实测依据后豁免。 |
| 4 | Scope | 🟡 | **同族第二处残项未登记**：本设计轮已落的 `WEBVIEW.md:106` 称状态位族为**闭集三成员**、`D-W19`（`:238`）逐条否决备选；但本端宿主 bash 另有两处失败/终止形态既不入集也未进 §2.8 上抛：超时 `(killed — timeout ${…}ms)`（`shell.mjs:252` 子进程路 · `:85` 终端路）——`lib.js:71-81` 不认（要求 `killed: ` 冒号形）⇒ 读绿 + 折叠（仅摘要照显文本）。设计已为 CLI 侧同类残项建项（§2.8 #1），此条缺同款登记。 | 按 §2.6 #11 体例登记该宿主面残项（消解路径 + 到期条件），或明写族切面判据说明不入本批之由。 |
| 5 | Clarity | 🔵 | **账目 off-by-one（机械面）**：批档 §2.5 受影响档表 Δ 分项 7+1+1+0+3 = 12 ≠ 声明 Δ +11（336 − 改前 325 = 11）；§2.6 #5 的 doc-check 报告行位移 219 / 247 / 249 → 225 / 254 / 256 非均匀（+6 / +7 / +7），三行同在唯一插入点（§4.3）之下 ⇒ 位移须一致。现态实核：`WEBVIEW.md` 225 = D-W6 行 · 254 = §12.4/§14.4 行 · 256 = §3 退场模块行；336 行 · `^.{301,}$` 零命中（与「over300 = 0」相符）。 | 基线或分项二择一收正，使合计与 Δ 自洽（不涉 tier——336 ≪ 500）。 |
| 6 | Clarity | 🔵 | **「零影响」句覆盖面大于实核面**：`WEBVIEW.md:115` 以「`(spawn failed)` 经 `(empty)` 占位分支等效」为由声明摘要读数零影响。按码追溯：空输出形确得 `→ (spawn failed)`（`ui.js:276-287`：last = 状态行本体 ⇒ content 空 ⇒ 返 status）✓；但 spawn 错误携非空 stdout 时，未扩的 `WRAPPER`（`ui.js:277`）⇒ last 仍为状态行 ⇒ 末行输出被吞（`→ (spawn failed)`），与同族 `(exit code N)`（被 WRAPPER 滤掉 ⇒ `→ <末行> (exit code N)`）不同形。 | 该句收窄到「无输出形」，或按 W16-9 体例补一侧边界。 |

计数：🔴 1 · 🟡 3 · 🔵 2

VERDICT: changes-required

### 轮次 2（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | **F-W16 第三卡面（孤儿恢复卡）未纳入本批、设计 §4.3 亦未登记**：`thincoder-vscode/webview/ui.js:360-392` `buildToolHistory` 不读判据——状态词恒 `tool.done` + `#4ec9b0` 绿（`ui.js:374`）、`aria-expanded="false"` 恒折叠（`ui.js:369`）；仅摘要经 `resultSummary` 携状态位（`ui.js:375`）⇒ `(spawn failed)` 在该卡面**无红 / 无展开**，「失败面三信号」不成立。设计 `docs/vsc/design/WEBVIEW.md:112` 句 =「活卡…与恢复卡…同读该判据——两卡面终态同形（F-W4）的机器面」未载第三卡面；`docs/vsc/requirements/WEBVIEW.md:146`（父侧 2026-09-18 22:1x 裁定 ①）已裁「登记另批」 | §4.3 补第三卡面登记句（形态 = 摘要含状态位、色 / 展开不随判据）并指向其另批状态，使「两卡面」句与实现面一致；批档 §2.7 边界同补一句 |
| 2 | Feasibility | 🟡 | **宿主 spawn 判据含未实测前提**：§2.1（`:45`）与设计 `WEBVIEW.md:110` 的判据 = `error.code` 非数字 ∧ `child.pid` 未定义 ⇒ `(spawn failed)`；§2.3（`:68-80`）实测表只覆盖产形文本读数（`"(exit code ENOENT)"` 等），**无 `child.pid` / 输出超容 `error.code` 读数**；且 else 分支把「一切非数字 `error.code`」判为 `(killed: output limit exceeded)`——pid 前提若不成立，spawn 失败会被误标为输出超容（C-3 / C-6 可兜住，判据本身未验） | §2.3 补一条真跑读数（同输入下打印 `error.code` / `child.pid` / `error.killed`），或给出该分支的等价判据（`error.errno` / `error.syscall`） |
| 3 | Requirements | 🟡 | **需求行 F-W16 三处滞后在册未闭**：`docs/vsc/requirements/WEBVIEW.md:39` ① 射程半句只写「非零退出」（spawn 失败无退出码）② 证据单元格仍写修复前机制 `webview/ui.js:291` `isError=/^Error[:：]/` ∧ `ui.js:276-283`（本轮实核：`:291` 为注释行，判据实为 `ui.js:295` `isToolFailure`；`resultSummary` 实为 `:276-287`）③ 产者坐标只载核 `tools/bash.mjs:225-227` | 三处同批收正（射程半句 / 证据单元格坐标 / 产者两处坐标），与设计 §4.3 同步 |
| 4 | Scope | 🟡 | **本批必改档不在写域**：`thincoder-vscode/src/tools/shell.mjs`（本端卡面真产者）未列 §1.4 写域（`:28`）；§2.7（`:141`）与 §2.9 待办 1 自报「视同已授权」 | §1.4 写域补该档，或明载授权口径 |
| 5 | Clarity | 🔵 | **§2.3 表外残留重复行**：`:83` `\| **第二先红** \| lib.isToolFailure(<目标形态>) \| … \|` 与表内 `:80` 行重复，且落在「读数口径」引块之后 ⇒ 不成表、渲染为散行 | 删 `:83`（或并入 `:80` 措辞），读数块保持单源 |
| 6 | Clarity | 🔵 | **受影响档计数口径不一 + tier 短语失准**：`bash.mjs` 标 268（实测尾行 `:268` `}` + 尾空行 ⇒ 含尾行口径 269；§2.6 #7 `:131` 自声明用 `split("\n")` 含尾行口径）· `test/files.mjs` 标 95（末行 `]` = `:95` + 尾空行 ⇒ 96）；同表 `shell.mjs` 标 319 · §2.8 #3 `ui.js` 标 474 用含尾行口径 ⇒ 同表两口径。另 §2.8 #3 的「`ui.js` 现 474 行 · 近 300 咨询档」与设计 `WEBVIEW.md:241` D-W13「`ui.js` 492 行近硬限」不同值 | 统一按 §2.6 #7 声明的口径重出各行计数（无跨档影响——均 < 500）；ui.js 读数 / tier 短语按现值收正 |
| 7 | Clarity | 🔵 | **本修轮 Δ 无分项且与位移不相容**：§2.5 `:117` 记「设计轮 +11 · 本修轮 +13」（336 → 349），§2.6 #7 `:131` 记三锚点位移 +9 / +9 / +9（实测现值 234 / 263 / 265 = D-W6 行 / §12.4·§14.4 行 / §3 退场模块行），#7 括注「本修轮新增全在报告行之上」⇒ 与「13 − 9 = 4 行加在锚点之下」矛盾；设计轮已给分项（11 = 6+1+1+0+3），修轮未给 | 补本修轮分项（或收正 #7 括注），使 Δ 与位移双向自洽 |
| 8 | Clarity | 🔵 | **§4.3 `:109` 的证据句将被本批自身推翻**：句载「`thincoder-vscode/**` 全树 `grep "Command failed"` = 0 命中（2026-09-18 实核）」，而 §2.5 `:110` 明列宿主 spawn 失败面**补诊断行 `Command failed: <error.message>`（核产者同款）** ⇒ 实现后该 grep 非零 | 该句加 as-of 限定并注明本批新增的同字面诊断行（不入判据、仅诊断），免实现轮后按旧读数读作「宿主无产者」 |
| 9 | Clarity | 🔵 | **「不可达」句射程与终端路残项无设计档指针**：`WEBVIEW.md:119` 谓「两产者同批收正后该二形在仓内不可达」按字面成立，但同族非族形仍可达且不判失败——`thincoder-vscode/src/tools/shell.mjs:85`（`(killed — timeout …; interrupted in the terminal)`）· `:95`（`(exit code unavailable in terminal mode …)`）；该残项只住批档 §2.8 #8 ①（`:153`），设计 §4.3 未随 `:118` 的 `(stopped)` 端差句体例给出指针 | §4.3 补终端路残项指针（或把「不可达」限定到两产者形态），使机制单源自足 |

计数：🔴 0 · 🟡 4 · 🔵 5

VERDICT: pass

## §4 用户批准

**2026-09-18 22:22 用户裁定** —— 逐字「**别等明天了，能做的今天就做把**」（= 本批与四档拆分批立即开工；父侧按 22:13 常设规则「按建议」推进评审与实现）。

## §5 实施与修正记录

（eng-coder 写）

### 5.1 交付摘要（2026-09-18 23:0x–23:5x · 本实现轮）

判据族第三成员 `(spawn failed)` 全链落地（裁定（甲·扩射程）· **两产者同批**）：

- **核产者** `thincoder-core/tools/bash.mjs:189-198`：spawn 错误分支 parts 化——首行 `Command failed: <errno>` 与 `[stdout]:` 段内容逐字保留 + 尾独占状态位 `(spawn failed)`。
- **宿主产者** `thincoder-vscode/src/tools/shell.mjs:251-281`：三处收正（共同规则 = 退出码槽只接受数字）——超时 ⇒ `(killed: timeout <N>ms)`（冒号形）；非数字 `error.code` ⇒ `child.pid === undefined` ? `(spawn failed)`（+ 诊断行 `Command failed: <errno>`，不入判据）: `(killed: output limit exceeded)`。
- **端判据** `thincoder-vscode/webview/lib.js:77-81`：`toolFailureStatus` 正则 + 分支各一处（`isToolFailure` 零改——经其派生）；两处注释载第三成员。
- **零触碰核验**：`webview/ui.js`（第三卡面 `buildToolHistory`）· `(stopped)` 裁定 · 终端可见路两形（`shell.mjs:85`/`:95`）· `session-segments.mjs` · `WEBVIEW-PROTOCOL.md` · 需求档 · `_archive/**` · `tool-docs/bash.md` 逐条未触（全树 grep `spawn failed` 只命中本批四档 + 批档/设计档）。

真值表 8 形态实读 = `[true,true,true,false,false,false,false,false]`——与批档 §2.6 #6 逐位一致。

### 5.2 决策透明表（实现轮）

| # | 决策点 | 取 | 判据 / 读数 |
|---|---|---|---|
| ① | **pid 前提先真跑**（评审 id=124 #2 硬要求） | **前提成立，无须停手上报** | 实跑同参数 `exec` 四态：spawn 失败 = `code "ENOENT"`(string) ∧ `child.pid` **undefined** ∧ `killed` undefined；超时 = `code null` ∧ `killed true` ∧ pid 已定义；输出超容 = `code "ERR_CHILD_PROCESS_STDIO_MAXBUFFER"` ∧ pid 已定义 ∧ `killed` **未置**；成功 = `error null` ∧ pid 已定义 |
| ② | 核 spawn 分支形态（parts 化 vs 原串追加） | parts 化 + `"\n\n"` join（与核其他分支同形） | 首行 / `[stdout]:` 段内容逐字保留（C-1 锁首行 + 末条非空行）；批档 §2.5 明写「parts 化」 |
| ③ | 宿主 spawn 面是否补 `[stdout]:\n(empty)` 段 | 不补（保留宿主「空段省略」既有风格） | 设计只要求「诊断行 + 状态位」；C-3 / W16-7 断言面不含该段 → 两端状态位同名同形即达 |
| ④ | 宿主判据分支序 | `AbortError` → `error.killed`（超时）→ 非数字 code（pid 分派 spawn/超容）→ 数字 code/成功 | ① 读数证 `killed` 在超容面未置 ⇒ 超时分支不吞并超容面；既有成员判定序与时序零改（批档 §2.7） |

### 5.3 先红读数（真产者直跑 · 本实现轮实测）

| 读数面 | 输入 | 修前实读 | 修后实读 |
|---|---|---|---|
| 宿主 spawn | 宿主 `bashTool.execute({command:"echo hi"},{cwd:<不存在目录>})` | `"(exit code ENOENT)"` | `"Command failed: spawn C:\Windows\system32\cmd.exe ENOENT\n(spawn failed)"` |
| 宿主超时 | 宿主 `{command:<sleep 5s>, timeout:400}` | `"(killed — timeout 400ms)"` | `"(killed: timeout 400ms)"` |
| 宿主输出超容 | 宿主 3MB stdout | 尾行 `"(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)"` | 尾行 `"(killed: output limit exceeded)"` |
| 核 spawn | 核 `bashTool.execute({command:"echo hi"},{cwd:<不存在目录>})` | `"Command failed: …ENOENT\n[stdout]:\n(empty)"`（无状态位） | `"Command failed: …ENOENT\n\n[stdout]:\n(empty)\n\n(spawn failed)"` |
| 端判据（目标形） | `lib.isToolFailure("…\n(spawn failed)")` | `false` / `""` | `true` / `"(spawn failed)"` |
| 活卡（宿主真产形直喂） | 真 `ui.js` `addTool → finishTool` | 绿 `done` + 折叠 + 摘要 `→ (exit code ENOENT)` | 红 `tool.error` + 保持展开 + `aria-expanded="true"` + 摘要 `→ (spawn failed)` |
| 恢复卡（同真产形） | 真 `buildFinishedToolCard` | 绿 `done` + 折叠 | 红 + 展开 |
| CLI 摘要 | `formatToolSummary("bash", <核真产形>)` | `"bash: (empty)"` | `"bash: (spawn failed)"`（CLI 代码零改） |

**先红取得方式** = 先写用例 → 修前跑（非事后补记）：VSC 目标档 11 例 = 8 pass / 3 fail（W16-7 / W16-8 / W16-11）；C-3 / C-4 / C-6 三红（`(exit code ENOENT)` / `(killed — timeout 400ms)` / `(exit code ERR_CHILD_PROCESS_STDIO_MAXBUFFER)`）；C-1 一红（末条 `(empty)`）；CL-1 一红（`bash: (empty)`）——读数文本与批档 §2.3 逐字一致。

### 5.4 用例读数（命令 + pass/fail）

| 闸 | 命令 | 读数（修前 ⇒ 修后） |
|---|---|---|
| 端用例 | `node --test thincoder-vscode/test/webview-tool-failure-signal.test.mjs` | 8 pass · **3 fail**（W16-7/8/11）⇒ **11 pass · 0 fail** |
| 端产者 | `node --test thincoder-vscode/test/shell-spawn-failure.test.mjs` | C-3/C-4/C-6 红 ⇒ **4 pass · 0 fail** |
| 核用例 | `node --test thincoder-core/test/bash-spawn-failure.test.mjs` | C-1 红 ⇒ **2 pass · 0 fail** |
| CLI 用例 | `node --test thincoder-cli/test/tool-summary-spawn-form.test.mjs` | CL-1 红 ⇒ **1 pass · 0 fail** |
| 三套回归闸 | `npm test`（core / cli / vscode） | core **364 / 364** · cli **702 / 702** · vscode 首跑 577/588、复跑 651/658（**残余红 = 他实例在飞档**——见 5.7；本批 15 例两跑恒绿） |
| 真值表 | `lib.isToolFailure` 8 形态实读 | `[true,true,true,false,false,false,false,false]` ✓（§2.6 #6 逐位一致） |
| doc-check | `node scripts/doc-check.mjs` | 全仓 **5 悬空 / 11 超宽**（与批前同值；`docs/vsc/design/WEBVIEW.md` **零**悬空、**零** >300 行） |

### 5.5 受影响文件表（Δ = `git show HEAD:` → 现盘实测 · `split("\n")` 含尾行口径）

| 文件 | pre → now | Δ 实测 | Δ 预期（§2.5） | 改动点 |
|---|---|---|---|---|
| `thincoder-core/tools/bash.mjs` | 269 → 277 | **+8** | +2~4 | `:189-198` spawn 分支 parts 化 + 状态位 + 注释 |
| `thincoder-vscode/src/tools/shell.mjs` | 319 → 339 | **+20** | +3~7 | `:251-281` 三处收正 + 注释（含登记指针） |
| `thincoder-vscode/webview/lib.js` | 97 → 100 | **+3** | +3~5 ✓ | `:77-81` 正则 + 分支；`:65-72`/`:86-93` 注释 |
| `thincoder-vscode/test/files.mjs` | 96 → 97 | **+1** | +1 ✓ | 新档登记行 + `:92` 注释 W16-1…W16-11 |
| `thincoder-vscode/test/webview-tool-failure-signal.test.mjs` | 141 → 208 | **+67** | +~45 | W16-7…W16-11 + 头注（真产者输入） |
| `thincoder-vscode/test/shell-spawn-failure.test.mjs` | 新档 → 62 | **+62** | +~55 | C-3…C-6 |
| `thincoder-core/test/bash-spawn-failure.test.mjs` | 新档 → 43 | **+43** | +~40 | C-1 / C-2 |
| `thincoder-cli/test/tool-summary-spawn-form.test.mjs` | 新档 → 25 | **+25** | +~25 | CL-1 |

Δ 超额说明（透明）：`bash.mjs` +8 与 `shell.mjs` +20 高于 §2.5 预期——差额全在注释（批次权威指针 + 判据理由，随码就近）；两档均远低 300 咨询档 / 500 硬限。

### 5.6 边界核验（零回归逐条）

`(exit code 0)`（C-5 / W16-4）· `(exit code 3)`（C-5 / C-2）· `killed: user interrupted`（W16-3 / W16-6）· `(killed: timeout 400ms)`（W16-3）· 成功面摘要不拼 `(exit code 0)`（W16-4）· 正文非独立成行 `(exit code 1)` / `(spawn failed)` 不误报（W16-5 / W16-9）· 三历史/否决形不判失败（W16-10：`Command failed:` 无状态位 / `(exit code ENOENT)` / `(killed — timeout 400ms)`）· `(stopped)` 不入集（实读 `false`）· 核 `!startsWith("Error:")`（C-1）。

### 5.7 审计与残余条件（本实现轮）

- **内部 explore 分歧审计**：1 轮（read-only）⇒ 发现 5 条（0 🔴 · 2 🟡 · 3 🔵）：① §5 未写入（本轮即修）② 真值表 8 号位 `(stopped)` 无用例（§2.4 表**本就未列**该例 ⇒ 按 §2.6 #6 规定以「实读一行机判」入 §5.4，不擅自扩用例表）③ 设计档 `WEBVIEW.md:109` 的「本端无产者」句被本批自身推翻（设计轮评审判定 pass 未收闸——**父侧/eng-designer 笔**，本实现轮只登记）④ 设计档/批档多处坐标随本实现位移（`bash.mjs` spawn 面 `:183-190` → `:183-198`；宿主面 `:242-260` → `:242-281`；`(stopped)` 位 `:300` → `:320`）⑤ 临时日志 `_t.log`（已删除——本实现轮自身动作，净额零）。**自修**：轮内修 ①（本文件）+ 本实现轮自身注释的失效行号指针（`shell.mjs` 超时分支注释不再引 `:311`，改内容指代）。
- **并行实例在飞（残余红归属 · 非本批）**：VSC 套件两跑残余红全为他实例在写档：首跑 11 档 = `src/extension/panel-session.mjs` 重复导出 SyntaxError（`saveLines` / `generateTitle`——四档结构拆分批在飞）；复跑 7 红 = `src/extension/panel-subagent-relay.mjs`（`relaySubagentEventToken` 重复声明）+ 协议表对账三例（`panel-subagent-relay.mjs:144` 未登记）。**本批 15 例两跑恒绿**；本批四档 diff 与该两档零交集。
- **doc-check 读数**：全仓 5 悬空 / 11 超宽 = 批前基线（超宽 11 行全在他档：CONTEXT-COMPACTION ×2 · PROMPT-SYSTEM ×2 · persona-engineering ×2 · ADVISOR-CONVERGENCE ×2 · ENGINEERING-MODE-V2 ×3；`WEBVIEW.md` 零）。

### 5.8 越界项

无。（`_t.log`/`_t2~4.log` = 本实现轮临时日志，已删除；`docs/**` 本实现轮零笔——§5 为本文件自身段。）

### 5.9 评审轮次与终态（本实现轮 · 内部）

| 轮 | 类型 | 对象 | 发现 | 处置 |
|---|---|---|---|---|
| 1 | explore 分歧审计（read-only） | 8 档 touched union vs 批档 §2 + 设计 §4.3/D-W19 | 5 条（0 🔴 · 2 🟡 · 3 🔵） | 见 5.7；轮内自修 2 项（§5 写入 + 自身注释失效行号指针）后复验 |
| 1 | advisor 代码评审（独立读码 · 判据表逐位复核 · 消费面接线复核） | 同 8 档 + 设计档/批档（上下文） | 8 条（**0 🔴** · 5 🟡 · 3 🔵；🟡 全标「非阻塞/report-only」） | **VERDICT: pass**；逐条处置 = 全部 report-only（①档位超 300 咨询档 = 现存债 R3 不升级 ②非数字 code else 侧排他性 = 设计形态所定、edge 态标记 unverified ⇒ 需设计侧裁新成员方可收窄 ③`filter` 面族全体既有病、设计 §2.7 边界未列 ④超容形恢复面恒不可见 ⇒ 建议父侧补登记 ⑤⑥设计档证据句/坐标漂移 = 父/设计侧笔 ⑦需求档 F-W16 三处滞后 = 父侧笔在册 ⑧测试环境前提 = 低风险留档）——**本批零新增修改**（评审后不再改档，免使 pass 失效） |

**终态：clean**（审计 1 轮 + 代码评审 1 轮，0 🔴，无可修项落地；残余 5 🟡 / 3 🔵 全为 report-only 或他笔面）。

## §6 验证与收口

**收口（2026-09-18 23:1x · 父侧直接执行）**

- **交付判据**：设计 → 评审 **changes-required**（id=118 · 🔴1「目标产者错位」）→ 修正（id=121 · 6/6 · 取**（甲）扩射程**）→ 轮 2 重评 **pass**（id=124 · 0🔴/4🟡/5🔵）→ 实现（id=126 · 终态 clean）⇒ **判据族第三成员全链落地**。
- **父侧独立复跑**：`webview-tool-failure-signal` + `shell-spawn-failure` + `bash-spawn-failure` + `tool-summary-spawn-form` **全绿**（与 coder 报数一致）。
- **验收读数**：核 `npm test` **364/364** · CLI **702/702** · 真值表 8 形态 = `[true,true,true,false,false,false,false,false]`（与设计 §2.6 #6 逐位一致）· `doc-check` 按档归属零新增（`WEBVIEW.md` 零悬空零超宽）。
- **先红（真产者）**：宿主 spawn `(exit code ENOENT)`→判据 false；修后 `Command failed: …\n(spawn failed)`→true · 卡红+展开+摘要 `→ (spawn failed)`；超时/输出超容/核 spawn/CLI 摘要/恢复卡逐面读数在册。
- **两产者同批**：核 `bash.mjs:189-198` + 宿主 `shell.mjs:251-281`（评审 🔴 的直接产物）+ 端判据 `lib.js:77-81` +1 成员。
- **transient 说明**：vsc 套件当时 7 红 = **他实例在飞拆分档**（`panel-subagent-relay.mjs` 重复声明——#127 四档拆分实现轮重建中），与本批 8 档零交集；本批 15 例两跑 + 终稿复跑恒绿。
- **范围外登记（待处置）**：① `WEBVIEW.md:109` 证据句被本批自身推翻（宿主新增同字面诊断行）⇒ 需 as-of 限定；② §4.3 坐标漂移（按实现重出 `:183-198`/`:242-281`/`:286-300`/`:320`）；③ 需求档 F-W16 三处滞后（射程半句 · 证据单元格 · 产者坐标；**F-W16 居 `:41`**）；④ 新成员 `(killed: output limit exceeded)` 的**恢复面恒不可见**（人读线头 500 截断丢尾状态位）⇒ 建议登记或并入「长结果面残项」；⑤ `panel-*` 系列他席在飞残余。
- **状态行**：✅ 已收口 2026-09-18（全档冻结）。
- **台账**：§2.6 #11 残项 ⇒ **消解**（两端产者收正 + 端判据 +1）。
