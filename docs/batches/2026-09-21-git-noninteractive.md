# 批次档 · 2026-09-21 · git 工具非交互加固（git-noninteractive）

> 前情 = 无（承台账 **#207** ✗ 用户 2026-09-21 20:26 报「会话多次在 git rebase 时卡死」+ 截图实锤 ✗ **20:28「开」= 立批** ✓）。
> 触发：已发布版 `0.12.64` 中 `git` 工具 `{action:"rebase", rebaseAction:"continue"}` **反复冻死整个会话**（截图：工具卡 done ✗ 回合不再推进 ✗ 重启重试再冻 ✓）。
> 定因（父侧全链实读 · 证据在 §1）＝ **同步 spawn + 零非交互加固**：`rebase --continue` 需造提交 ⇒ 起编辑器 ✗ 无 TTY 下编辑器永不退出 ⇒ `execFileSync` 无限等待 = 全进程锁死 ✓。
> 授权：**父侧代点火 / 代批准（用户 2026-09-21 12:00「自动跑到完成吧」+ 20:28 本条立批）**；自缚照旧：① 代签仅当「评审 pass（0🔴）∧ 落点逐条核验 ∧ token 已签发」② 代签在 §4 写明授权与依据 ③ 新范围 / 口径裁决 ⇒ 停下不代签 ④ 射程 = 本批收口。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（2026-09-21）

**模块目标（一句话）**：`git` 工具的任何调用都**不得因交互等待卡死会话**——编辑器 / 凭据 / GUI 三族交互一律压制 ✗ 并以**超时 + 明确报错**兜底（冻结 ⇒ 失败可见 ✓）。

**功能点（可验收）**

| # | 功能点 | 验收方向 |
|---|---|---|
| ① | **编辑器族压制**：`rebase --continue` / `pull`（merge 路径）等**任何**可起编辑器的路径不再起编辑器（核心单点加固 ✗ 非逐调用点补 ✓） | 无 TTY 下 `rebase --continue`（冲突已解态）⇒ **返回**（不再挂）✗ 输出与手动 `GIT_EDITOR=true` 等价 ✓ |
| ② | **凭据 / GUI 族压制**：私仓推送 / 缺凭据 ⇒ **明确失败**（不得弹凭据 GUI / 不得挂） | 无凭据 push ⇒ 返回错误文本（不挂 ✓）|
| ③ | **超时兜底 + 明确报错**：任何 spawn 超时 ⇒ fail-closed（错误文案 + 恢复指引 ✗ 参照 rebase 快照锚 ✓）——**冻结绝不再现** | 故意慢子进程（如编辑器脚本 sleep）⇒ 到时返回错误 ✗ 进程不被锁死 ✓ |
| ④ | **全 action 面清算**：逐 action 过一遍「可起编辑器 / 凭据 / GUI / pager」清单 ✗ 表格式结论（含已防护位复核 ✓） | 清单在册 ✗ 遗漏项 = 0 ✓ |

**边界（本批不做）**：不改 bash 工具（其加固照旧 ✓）✗ 不新增 action / 参数 / 用户选项 ✗ 不改成功路径的输出形态（`-c` 类加固对输出零影响 ✓）✗ 不动 checkpoint / 快照语义 ✗ 不重写整个 git 工具（异步化的**尺度** = 设计裁定题 ✓）✗ 表外档 / 新需求条目 ✓。

**背景证据（定因链 · 全实读）**：① `thincoder-core/tools/git-ext.mjs`（rebase action）= `--continue` 裸形（无 `--no-edit` ✗ 无 env ✗ 无 timeout ✗）；② `thincoder-core/tools/shared.mjs` `runGit` = **同步 `execFileSync`**（stdio `["ignore","pipe","pipe"]` ✗ 无 `timeout` ✗ 无 `env` 覆盖 ✓）；③ **对照实锤**：`thincoder-core/tools/bash.mjs` 设 `GIT_EDITOR: "true"` ⇒ 同一会话里 **bash 跑 rebase 不冻 ✗ git 工具跑就冻**（全 `thincoder-core` grep `GIT_EDITOR|GIT_SEQUENCE|GIT_TERMINAL` 仅此一处命中 ✓）；④ 兄弟位已防护：`merge` / `revert` 带 `--no-edit`（`tools/git.mjs` 实读 ✓）⇒ 本批 = 把「类级加固」补到核心单点 ✓；⑤ 无自愈：`tools/exec-run.mjs` 头注自述「默认径忽略 signal（execFileSync 不可中断）」✓ 现有超时仅 `SYNTAX_CHECK_TIMEOUT=10s` / `BASH_TIMEOUT_MS=120s`（均与本路径无关 ✓）。

**用户侧现状**：其仓 `C:\thincoder\v2-vibe-coding` 的 rebase 在途 ✗ 即时解法已给出（改用 **bash 工具**跑 `git rebase --continue` 或 `git -c core.editor=true rebase --continue` ✓）。

**与发布的关系**：缺陷在已发布 `0.12.64` 中（「已知变坏不得出厂」族前科 ✓）⇒ 修复**随下一代 CLI 发布** ✗ **发布动作 = 用户门** ✓。

## §2 批次任务（eng-designer）


**状态行**：🔄 设计完成（2026-09-21 · 设计轮 · eng-designer）· 待评审（§3）

**设计档落点**：`docs/core/design/TOOLS.md` **§6.14**（新增——git 工具非交互加固 · 台账 #207 承接面）+ 同档变更记录一行。

**本批覆盖条目（= §1 四功能点 · 逐条落点 + 可机判判据）**

| # | 条目（§1） | 设计落点（§6.14 节内） | 判据 |
|---|---|---|---|
| ① | 编辑器族压制（核心单点 · 非逐调用点补） | 加固集逐字（`GIT_EDITOR` / `GIT_SEQUENCE_EDITOR` / `EDITOR` / `VISUAL` = `true`）+ 单点落位（`GIT_ENV` 住 `thincoder-core/tools/git-run.mjs`（拟新增）；三形适配器薄壳化） | A23 · A27 · A28 |
| ② | 凭据 / GUI 族压制 | 加固集逐字（`GIT_TERMINAL_PROMPT=0` + `GIT_ASKPASS=` 空串）+ 超时兜底（helper 路实测不受 env 约束——实测 #6） | A24 · A25 |
| ③ | 超时兜底 + 明确报错（冻结绝不再现） | 超时语义表（`GIT_TIMEOUT_MS` 120s / `GIT_NET_TIMEOUT_MS` 300s · **全量适用** · SIGTERM → 1.5s 树杀 → 1.5s kick）+ 超时文案逐字（`gitTimeoutNote(ms)`——含快照恢复指引） | A24 · A26 |
| ④ | 全 action 面清算 | 清算表 **32 行** × 四族（值 = `—` / `固` / `固·超` / `实害`；遗漏 = 0；`实害` 恰 1 行 = `rebase`） | A29 · A28 |

**机制裁定（单列 · 裁定 + 取舍理由住 §6.14「同步 → 异步」）**：同步 → **异步**（`spawn` + 树杀 + 超时 + kick）。
理由两条实读：① 同步窗口内 TUI / Stop / 其它工具全程不可用（= 目标症状同形，只是有界）；② 同步超时只杀直接子 ⇒ 编辑器孤儿实测存活（实测 #1）。
附带裁定：树杀先行抽 `thincoder-core/tools/process-tree.mjs`（拟新增）以避 `shared → git-run → execute → shared` 循环（`execute.mjs:29` 模块求值期调 `DESC`（`const` · TDZ））；`execute.mjs` 改 import + re-export，导出面零变。

**本批明确不做（= §1 边界逐条 · 详表住 §6.14「边界」与「表外复核」）**：不改 `bash` 工具（其加固照旧）· 不新增 action / 参数 / 用户选项 · 成功路径输出形态零变 · checkpoint / 快照语义零改 · 不接 Stop / abort（`runGit` 族无 `ctx.signal` 通路）· 不动表外复核五位（`gitDiffOne` · `tools/patch.mjs:278` · `git/checkpoint.mjs` · `advisor/repos.mjs` · `bash.mjs`）· 不设 `GIT_SSH_COMMAND` / `SSH_ASKPASS`（登记为超时兜底面）· 不改 README / 需求档 / 版本号。

**受影响文件（逐档读数 as-of 2026-09-21 · 增量与体量档注详 §6.14 落位表）**

| # | 文件 | 现状行数 | 改动 |
|---|---|---|---|
| 1 | `thincoder-core/tools/git-run.mjs`（拟新增） | 0 | `GIT_ENV` + 两档超时 + `gitTimeoutNote(ms)` + `spawnGit()`（async · 树杀 · kick · 错误形同构） |
| 2 | `thincoder-core/tools/process-tree.mjs`（拟新增） | 0 | `killProcessTree` 单源（自 `execute.mjs` 抽出） |
| 3 | `thincoder-core/tools/execute.mjs` | 243 | 改 import + re-export（导出面零变） |
| 4 | `thincoder-core/tools/shared.mjs` | 467 | `runGit` 改 async 薄壳 + `gitFailureMessage` 增 `timedOut` 分支（≈473 / **500 硬限——本批不得再增**） |
| 5 | `thincoder-core/tools/git.mjs` | 420 | `runGitRaw` 改 async 薄壳 + **34 处** `await`（7 / 1 / 26） |
| 6 | `thincoder-core/tools/git-ext.mjs` | 173 | `runGitStrict` 改 async 薄壳 + **15 处** `await`（3 / 12） |
| 7 | `thincoder-core/tools/git-checkpoint.mjs` | 143 | 1 处 `await` |
| 8 | `thincoder-core/test/git-noninteractive.test.mjs`（拟新增） | 0 | A23–A28 用例（scratch 仓 + 挂死夹具 + 本地 401 服务 + 结构断言） |

**验收（机判 · 承 §1）**：A23 编辑器族压制（先红）· A24 凭据 helper 族 + 超时（先红）· A25 凭据原生路（回归守卫）· A26 超时三件套（先红）· A27 形保真（回归）· A28 单点结构断言（先红）· A29 清算表齐全（文档面）。
**三链同源自检**：§1 四功能点 = 本节覆盖表四行 = §6.14 判据 A23–A29（回指表 = §6.14「验收」节）——逐条对应，无缺口。

**设计轮夹具（仓外 scratch 仓 · 可复跑）**：`.thincoder/tmp/gitni-design-probe{,2,3,4,5,6}.mjs`（13 格读数 = §6.14 实测表；夹具 = 挂死进程 + 冲突态 scratch 仓 + 本地 401 服务，实施轮可直接改造成 A23–A26 用例）。

**修正轮 1（承 §3 轮次 1：🔴 2 · 🟡 4 · 🔵 5 · 发现 11 = 复核回执零动作）——逐号收正（as-of 2026-09-21 · 设计档 = `docs/core/design/TOOLS.md` §6.14 + §6.12/§6.13 边界行）**

| 号 | 处置 | 改动落点（`docs/core/design/TOOLS.md` file:line · 本轮末态） |
|---|---|---|
| 1 🔴 | 受影响面补 VSC 行 + 回归面扩面（**二选一取「A27 扩展」**） | 落位表行 9–11（`:599-601`）——`thincoder-vscode/src/tools/ide.mjs`（144 行；`changesSection` `:133` 转 async + `:136` 1 处 `await`；`:70` `collectSection` 已 async ⇒ 扇出受控）+ `thincoder-vscode/test/tools-ide-changes.test.mjs`（拟新增）+ `test/files.mjs` 登记 1 行；`:531`「全部调用点已在 async 函数内」→ `:543-544` **真实射程**（核三档 46 处 + VSC 例外 1 处）；A27 行 `:623` 改**两包**全量；测试面 `:638-639` 补 VSC 用例面 |
| 2 🔴 | A28① 改**白名单谓词** | A28 行 `:624`——`execFileSync` 命中 = **白名单恰一处**（`shared.mjs` `gitDiffOne` 函数体内）∧ 白名单外零命中（含三适配器体内）；表外复核 `:609` 补「= A28① 白名单位」；边界不动（表外五位 + `gitDiffOne` 零改） |
| 3 🟡 | A24 注入缝 + 写明层位 | 注入面行 `:515` 补 **`_setGitTimeoutForTest(ms)` / `_resetGitTimeoutForTest()`**（模块级 · `??` 缺省回落 · `finally` 复位；先例 `manifest.mjs:40-41` · `thincoder-core/session-gc.mjs:136`）；A24 行 `:620` 写明**适配器层**（`gitTool.execute` → `runGitStrict` → `spawnGit` 缺省解析）；A26 = `spawnGit` 直调 + 参数覆盖 |
| 4 🟡 | 杀语义 + 文案收正 | 新增**「被杀后仓态与恢复锚」按写动作类表** `:530-538`（有快照类 / 无快照类·git 自持态 `MERGE_HEAD`·`pull`/`merge` / 无快照类·其余写面；格源注 = #12 实测 + 其余 git 自持语义）；超时文案 `:524` 逐字收正（`process killed, tree best-effort`——与树杀尽力而为一致；恢复锚 = `git status` / git abort-continue / checkpoint list；301 → 297 字符） |
| 5 🟡 | 300s 依据收正 | 网络面超时行 `:513` 改指需求档 **`docs/core/requirements/TOOLS.md` §4.7 TTY-DRIVE N3（`:141`）** + 注「**候选参照值**（该行自述『数值口径待设计轮定』）」；旧指 §4.4 U3 已删 |
| 6 🟡 | 边界行补指针 | §6.12 边界 `:364` · §6.13 边界 `:451` 各补「该族体于 §6.14 批转异步薄壳，签名与语义不变，见 §6.14」 |
| 7 🔵 | await 计数收正（体量半边**驳回** · 见下） | `git.mjs` **34 → 30**（`runGitStrict` 26 → **22**——调用点逐行实读；`runGit` 7 · `runGitRaw` 1）：落位表行 5 `:595` + `:543`（核三档 = 30 + 15 + 1 = **46**）；落位表补**行数口径注** `:603` |
| 8 🔵 | 证据粒度 | 故障族表 `:462` 编辑器链标 **unverified**（`VISUAL` / `EDITOR` 两段）；#8 `:478` 归因标 **unverified**（`GIT_ASKPASS=` 与 `GIT_TERMINAL_PROMPT=0` 两键同场不可分离）；#5 `:475` 补同注；最小集裁定不动 |
| 9 🔵 | A25 加固 | A25 行 `:621`——夹具钉 **`LC_ALL=C`**（同式复位）+ 墙钟界注（**< 5s = 经验界**、与机器负载相关、非契约值）；测试面复位纪律行 `:637` 同步 |
| 10 🔵 | 平台注（**已实测回实**，原评审 unverified） | 新增 **平台注（win32）** `:519`——实测：注册 `SIGTERM` 处理器的子进程仍 184ms 内被杀、处理器未执行 ⇒ SIGTERM = 硬终止、① 宽限步空转；上界 `timeout + 3s` 与 A26① 不变 |
| 11 🔵 | 无动作（复核回执） | — |

**发现 7 体量半边（驳回 + 证据）**：评审读数 468 / 421 / 174 / 244 = **读取工具显示口径**（= `wc -l` + 1，末行空行——同档自带先例注）；本档标注口径 = **`wc -l`**（换行符计数），机检同源 = `thincoder-core/test/core-hygiene.test.mjs:141`（`split("\n").length - 1`），先例 = `AGENT-LOOP-SUBAGENT.md:448` · `DOC-CODE-RECONCILE.md:263`。本目录实读（wc -l）：`shared.mjs` **467** · `git.mjs` **420** · `git-ext.mjs` **173** · `execute.mjs` **243** · `git-checkpoint.mjs` **143** ⇒ 标注**维持**（`shared.mjs` 预算仍 ≈473 < 500，档位结论不变）。评审自身该条「`git-checkpoint.mjs` 143 ✓」即 `wc -l` 口径，与其余四行的 +1 口径混用 ⇒ 判「口径差非漂移」。

**机检（触碰档零新增）**：`node scripts/doc-check.mjs`（仓根）——修正前 = 悬空 **5** / 行宽 **3**；修正后 = 悬空 **5** / 行宽 **3**（同集；`docs/core/design/TOOLS.md` 零悬空、零超宽；新增引用均「拟新增/迁移期引文」列报面不入闸）。**上报**：父侧记基线「悬空 3」与本机读数不符——本机 5 条 = `AGENT-LOOP-SUBAGENT.md:2047` / `:2065` / `:2066` + `CONTEXT-COMPACTION.md:558` / `:757`（均非本批触碰档，未处理）。

**本轮改动文件**：仅 `docs/core/design/TOOLS.md`（§6.14 逐号 + §6.12/§6.13 边界 + 变更记录 1 条）。**零新语义**（10 条发现逐号落位；需求档 = 主 agent 笔——本轮只收正引用，未触需求档；实现代码零触）。
**未决 / 登记（不上抛）**：`VISUAL` / `EDITOR` 两段因「最小集裁定（不加探针）」保持 unverified；win32 平台注已由本轮实测回实；A27 的两包全量跑法 = 实施轮跑项（`thincoder-vscode` 侧须先登记 `test/files.mjs`，否则 runner fail-closed 不收）。

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 受影响文件 / 完备性 | 🔴 | 漏列 VSC 侧核 `runGit` 唯一消费方 `thincoder-vscode/src/tools/ide.mjs`：`:17` 自核 `shared.mjs` import `runGit`，`:136` 在**非 async** 函数 `changesSection`（`:133-144`）里**无 await** 调用，`:140` `porcelain.split("\n")` 在 try（`:135-139`）之外 ⇒ `runGit` 转异步后 `porcelain` = Promise ⇒ TypeError，经 `:52-58` 逐段 catch 渲染成 `(error: …)`（每次取 changes 都坏）。与 `TOOLS.md:531`「全部调用点已在 async 函数内」及落位表 `TOOLS.md:576-585` / 批档 §2:56-65 相抵；A27 回归面（`TOOLS.md:605`）只含 `thincoder-core` ⇒ 无防线 | 落位表补该档并写明处置（`changesSection` 转 async + 1 处 await；`collectSection` `:64` 已是 async ⇒ 扇出受控），把 VSC 包该工具面的用例纳入回归面 |
| 2 | 验收判据 | 🔴 | A28①（`TOOLS.md:606`）要求四档 `execFileSync` **零命中**，但 `shared.mjs:222`（`gitDiffOne`，`:220-236`）按本设计自己的表外复核（`TOOLS.md:591`）与边界（`TOOLS.md:623`「不动表外复核五位与 `gitDiffOne`」）**保留**该调用 ⇒ 判据在本批射程内不可能转绿：实现轮只剩三条坏路（留红判据 / 越界改 `gitDiffOne`（拖 file・edit 族入批）/ 静默缩小判据）。另三档核验：`git.mjs:21`・`git-ext.mjs:25` 各 1 处（可随薄壳摘除）· `git-checkpoint.mjs` 零命中 | 判据改射程到 git spawn 面（或写明精确谓词 / 白名单位），使「批后转绿」与「表外零改」可同时成立 |
| 3 | 验收判据 / 可跑性 | 🟡 | A24（`TOOLS.md:602`）写「runner 侧小 timeout 注入」，但注入面只落到 `spawnGit(cwd, args, {timeout})`（`TOOLS.md:515`），三适配器签名不变（`TOOLS.md:506`・`:531`）⇒ 工具级 `push` 路拿不到小超时：该例要么等满 300s（`TOOLS.md:513`），要么依赖一条未声明的生产态缝 | 补写测试态注入缝（模块级 setter / 参数覆盖 + `??` 缺省回落，finally 复位）并写明 A24 走哪一层 |
| 4 | 可行性 / 杀语义安全（㊀） | 🟡 | 超时后仓态只有 `rebase --continue` 一格（#12・`TOOLS.md:482`），恢复指引句只列 rebase / clean（`TOOLS.md:522`）；**非快照类写动作**被切后的后果与恢复锚未写——`pull`（`git.mjs:365-371`）・`merge`（`git.mjs:387-392`）均无 `snapshotBefore`，中途被杀可留 MERGE_HEAD / 半程工作树。另：逐字文案断言「the process tree was killed」，而 `killProcessTree` 天然尽力而为（`execute.mjs:65-72` try/catch{}・`:119` 同姿态）且 kick（`TOOLS.md:516③`）无条件 settle ⇒ 文案可能过度声称 | 按写动作类补「被杀后仓态不变量 + 恢复锚」一句（含无快照类靠 git 自持态恢复），并让文案与「树杀尽力而为」一致（或登记杀失败面） |
| 5 | 需求覆盖 / 引用 | 🟡 | 网络面 300s 的依据「需求档 `docs/core/requirements/TOOLS.md` §4.4 U3 参照值「档 ≤ 3 分钟」」（`TOOLS.md:513`）对不上：该档 `:78` §4.4 = 「范围边界（不做）」；U3（`:132`）是 TTY 用户故事、无该值；「档 ≤3 分钟」实在 `:141`（§4.7 TTY-DRIVE 的 **N3** 行），且该行自述「数值口径**待设计轮定**」 | 收正坐标与状态（改指 §4.7 N3 并注明其为候选参照值），或另立依据 |
| 6 | 文档一致性 | 🟡 | §6.12 边界（`TOOLS.md:364`）・§6.13 边界（`TOOLS.md:451`）均写「不改 `runGitStrict` 族（写面）」，本轮把 `runGitStrict` 体改异步薄壳（`TOOLS.md:583`）——批内口径与既有边界行相抵（同式收正先例 = `TOOLS.md:712`） | 两处边界行补一句指向 §6.14（或注明该口径仅限本批） |
| 7 | 标注核对 | 🔵 | 体量标注与本目录读数同向差 1：`shared.mjs` 467→**468**（`TOOLS.md:581`）· `git.mjs` 420→**421**（`:582`）· `git-ext.mjs` 173→**174**（`:583`）· `execute.mjs` 243→**244**（`:580`）；`git-checkpoint.mjs` 143 ✓（`:584`）。await 面：`git.mjs` 的 `runGitStrict` 实为 **22** 调用点（另 `:9` import 行）非 26 ⇒ 合计 34→**30**（`runGit` 7 ✓・`runGitRaw` 1 ✓；`git-ext` 15 ✓ = 3+12；`git-checkpoint` 1 ✓ = `:28`） | 复读后再把 473 当硬限余量基准（档位结论不变：≈474 < 500） |
| 8 | 证据粒度（㊃） | 🔵 | 故障族定义表把编辑器解析链整条标「`git var GIT_EDITOR` 实测」（`TOOLS.md:462`），但 #4（`:474`）只证 env > `core.editor` 与兜底 `vim`，`VISUAL`/`EDITOR` 两段未逐段实测；#8（`:478`）把「封 askpass 升级路」归给 `GIT_ASKPASS=`，与 `GIT_TERMINAL_PROMPT=0` 不可分离（两键同场，且 #5 `:475` 同读数） | 未实测段标 unverified 或补两条探针；最小集裁定（`:505`）不受影响 |
| 9 | 用例脆弱性 | 🔵 | A25（`TOOLS.md:603`）断 git 自带英文句 `terminal prompts disabled`——该句随 locale 变（Git for Windows 有本地化；`GIT_ENV` 继承 `process.env` 含 LANG/LC_ALL），且 `< 5s` 为机器负载相关墙钟界 | 夹具侧钉 locale（如 `LC_ALL=C`）或改断失败形态；墙钟界放宽 / 注明 |
| 10 | 平台注 | 🔵 | 超时动作序①「给 git 一次自行收尾机会（不直接 SIGKILL）」（`TOOLS.md:516`）预设 SIGTERM 可被优雅接收；报告平台 = win32（批档 `:28`）上 Node 对子进程 `SIGTERM` 实为硬终止（**本评价未从在卷文件核实 ⇒ unverified**）⇒ 该 1.5s 步可能空转（上界 timeout+3s 与 A26① 不受影响） | 加一句平台注，避免把「宽限」读成保证 |
| 11 | 复核回执（无问题项） | 🔵 | ㊂ 清算表 32 行 = `git.mjs:77` enum 逐项同序（遗漏 0），逐行读数与代码相符：commit 无 `-m` 即拒（`git.mjs:215`）・tag create 轻量（`:279`）・clean 无 `-i`（`git-ext.mjs:115`）・rebase `--continue` 裸形无 `--no-edit`（`git-ext.mjs:88-92` ⇒ 唯一实害位 ✓）・merge/revert `--no-edit`（`git.mjs:390`/`:384`）。㊁ 文件集依据成立：`shared.mjs` 468/500 + ≈95 ⇒ 越 500 硬限 ⇒ 新档必需 ✓；依赖环真实（`execute.mjs:29` import `DESC` + 模块求值期调用 `:174`）⇒ `process-tree.mjs` 拆分正当 ✓，`killProcessTree` 再导出面须保留（`test/tool-seams.test.mjs:26`）✓。㊄ §1 四功能点 ↔ A23–A29 回指逐条可对（`TOOLS.md:609-616`）✓。设计轮夹具 6 档在盘（`.thincoder/tmp/gitni-design-probe{,2-6}.mjs`）✓ | — |

发现计数：🔴 2 · 🟡 4 · 🔵 5（共 11 行）。
VERDICT: changes-required

### 轮次 2（评审子代理）

**复核轮 2（承轮 1：🔴 2 · 🟡 4 · 🔵 5 · 发现 11 · 回执 1）——逐号核验：10/10 落 ✓ · 新矛盾 1（🟡）**

| # | 原# | 落点 | 严重度 | 状态 | 核验证据（本轮实读） |
|---|---|---|---|---|---|
| 1 | ①🔴 | `docs/core/design/TOOLS.md:544` · `:599-601` · `:623` · `:638-639` | — | ✅ Fixed | `:599`「`thincoder-vscode/src/tools/ide.mjs` \| 144 \| `changesSection`（`:133`）转 async + `:136` 1 处 `await`」· `:623`「**两包**全量：`thincoder-core` `node --test` + `thincoder-vscode` `npm test`」；代码坐标逐一吻合——`thincoder-vscode/src/tools/ide.mjs:48` `async execute(args, ctx) {` · `:64` `async function collectSection(what, ctx) {` · `:70` `case "changes": return changesSection(ctx)` · `:133` `function changesSection(ctx) {` · `:136` `porcelain = runGit(ctx.cwd, ["status", "--porcelain"])`；新用例档未在盘（拟新增 ✓）· `test/files.mjs` 未登记（实施轮 +1 ✓） |
| 2 | ②🔴 | `TOOLS.md:624` · `:609` | — | ✅ Fixed | `:624`「`execFileSync` 命中 = **白名单恰一处**（`shared.mjs` `gitDiffOne` 函数体内——表外复核位、零改）∧ 白名单外零命中（含三适配器体内零命中）」+ 先红行「批前 ① = 4 处命中（`shared.mjs` 2 · `git.mjs` 1 · `git-ext.mjs` 1）」——实读逐项吻合：`thincoder-core/tools/shared.mjs:222`（`:220` `export function gitDiffOne(cwd, abs) {` 体内）+ `:455` · `thincoder-core/tools/git.mjs:21` · `thincoder-core/tools/git-ext.mjs:25`；批后 `runGit`/`runGitRaw`/`runGitStrict` 转 spawnGit ⇒ 唯一保留 = `shared.mjs:222` ⇒ 可转绿 ✓ |
| 3 | ③🟡 | `TOOLS.md:515` · `:620` | — | ✅ Fixed | `:515`「**测试态缝** `_setGitTimeoutForTest(ms)` / `_resetGitTimeoutForTest()`（模块级 · `git-run.mjs` 导出——先例 `manifest.mjs:40-41` · `thincoder-core/session-gc.mjs:136`；用例 `finally` 复位）」；先例实读在：`thincoder-core/manifest.mjs:40-41` `_setProjectRootForTest` / `_resetProjectRootForTest` ✓ · `thincoder-core/session-gc.mjs:136` `_setSessionGcDelayForTest(ms)` ✓ |
| 4 | ④🟡 | `TOOLS.md:524` · `:530-538` | — | ✅ Fixed | 文案收正 = 「process killed, tree best-effort」+ git 自持态恢复锚；仓态表对码实读：有快照 8 项 = `git-ext.mjs:86`（rebase）/`:114`（clean）+ `git.mjs:287`/`:313`/`:322`/`:335`/`:352`/`:376`（snapshotBefore 8 调用点 8/8 ✓）；`pull`/`merge` 无快照 ✓；「工具未暴露 abort 形」✓（`git-ext.mjs:89` `if (sub === "abort") cmdArgs.push("--abort")` = rebase 位） |
| 5 | ⑤🟡 | `TOOLS.md:513` | — | ✅ Fixed | 「依据 = 需求档 `docs/core/requirements/TOOLS.md` **§4.7 TTY-DRIVE N3**（`:141`）「档 ≤ 3 分钟」——该行自述「数值口径**待设计轮定**」⇒ 本批取其作**候选参照值**（非既有契约值）」；需求档实读 `:141` = N3 行（「档 ≤3 分钟」+「口径待设计轮定」）三重吻合 ✓；旧指 §4.4 U3 已删 ✓ |
| 6 | ⑥🟡 | `TOOLS.md:364` · `:451` | — | ✅ Fixed | `:364`「不改 `runGitStrict` 族（写面已是严格形——该族体于 §6.14 批转异步薄壳，签名与写面语义不变，见 §6.14）」· `:451`「`runGitStrict` 族（写面——该族体于 §6.14 批转异步薄壳，签名与语义不变，见 §6.14）」✓ |
| 7 | ⑦🔵 | `TOOLS.md:543` · `:595` | — | ✅ Fixed | `:543`「机械 `await` **46 处**（`git.mjs` 30 = `runGit` 7 · `runGitRaw` 1 · `runGitStrict` 22；`git-ext.mjs` 15 = `runGit` 3 + `runGitStrict` 12；`git-checkpoint.mjs` 1）」· `:595`「**30 处**加 `await`（`runGit` 7 · `runGitRaw` 1 · `runGitStrict` **22**——调用点实读；原记 26 系误计）」——本轮实读调用点逐项同（git.mjs 22+7+1 · git-ext 12+3 · `git-checkpoint.mjs:28` 1）✓；体量半边遵父侧裁（不议） |
| 8 | ⑧🔵 | `TOOLS.md:462` · `:475` · `:478` | — | ✅ Fixed | `:462`「`VISUAL` / `EDITOR` 两段未逐段实测 = **unverified**」· `:475`「两键同场、归因不可分离（见 #8）」· `:478`「**归因 unverified**——`GIT_ASKPASS=`（空串）与 `GIT_TERMINAL_PROMPT=0` 两键同场、单独归因不可判」✓ |
| 9 | ⑨🔵 | `TOOLS.md:621` · `:637` | — | ✅ Fixed | `:621`「夹具钉 locale（`LC_ALL=C`——注入同 `GIT_EDITOR` 式，`finally` 复位）」+「**< 5s = 经验界**、与机器负载相关、非契约值」；`:637` 复位纪律行 ✓ |
| 10 | ⑩🔵 | `TOOLS.md:519` | — | ✅ Fixed | 「**平台注（win32）**：Node 对子进程 `SIGTERM` 在 win32 上实为**硬终止**（本设计轮实测：…184ms…）…上界 `timeout + 3s` 与 A26① 不受影响。」✓（批档 `:85` 同读数） |
| 11 | ⑪🔵 | — | — | ✅ 无动作 | 复核回执维持（零动作） |
| 12 | (new) | `docs/batches/2026-09-21-git-noninteractive.md:62` | 🟡 | New | 修正轮未同步 §2 本体面：`:62` 仍「`git.mjs` \| 420 \| `runGitRaw` 改 async 薄壳 + **34 处** `await`（7 / 1 / 26） \|」——而本档修正轮表 `:82` 已记「`git.mjs` **34 → 30**（`runGitStrict` 26 → **22**…）」· `TOOLS.md:595`/`:543` 已 30/46；且 `:56-65` 受影响文件表（行 1–8）未补 VSC 三档（`TOOLS.md:599-601`：`ide.mjs` / `tools-ide-changes.test.mjs` / `files.mjs`）。doc-state lag（R7a/R7e：报告面，非阻断） |
| 13 | (new) | `docs/core/design/TOOLS.md:642-643` | 🔵 | New（非阻断提示） | 边界行「不新增 action / 参数 / 用户选项（超时与加固均为常量，不进 schema）」与 `:515` 测试态缝并存——缝为模块级测试导出（缺省回落、不进用户面）⇒ 语义不抵，仅提示后续实现勿把缝接线到参数面（登记面已写「不进用户参数面」✓，本行 = 复核留痕） |

发现计数（本轮）：🔴 0 · 🟡 1（新）· 🔵 1（新）——承轮 1 十号全落（10/10）+ 回执 1 无动作。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 12:00「自动跑到完成吧」+ 20:28「开」快速通道 ✗ 三条件齐备）**：

- 依据 ① **评审链全清**：轮 1（评审 id=59）= **changes-required**（🔴 2 · 🟡 4 · 🔵 5）→ **修正轮 1**（#60 ✗ 10/11 落 ✗ ⑦ 体量半边经父侧裁**驳回**（文档口径 `wc -l` 正确））→ 轮 2 复核（id=61）= **pass**（🔴 0 ✗ 复核 **10/10 落** ✓ ✗ 新面 🟡1/🔵1 均非阻断 ✓）；
- 依据 ② **落点逐条核验（父侧实读 + 复核轮机验）**：`:544`/`:599-601`/`:623`/`:624`（白名单谓词 ✗ 判据可转绿 ✓）✗ `:543` 46 处 await ✗ `:530-538` 杀后仓态表（8/8 快照位对码 ✓）✗ `:524` 文案（tree best-effort ✓）✗ `:519` 平台注（实测回实 ✓）✗ `:513` 依据改指 §4.7 N3 ✓；
- 依据 ③ **token 已签发**（✗ 凭证值不落档）；
- **裁定表（轮 1 十一号 → 十落 + 一驳回）**：①🔴 `ide.mjs` 补入 → **Fixed**（`:599-601` ✗ A27 扩两包 `:623`）②🔴 A28① 白名单谓词 → **Fixed**（`:624` 可机判）③🟡 注入缝 `_setGitTimeoutForTest` → **Fixed**（`:515`/`:620` ✗ 先例 `session-gc.mjs:136`）④🟡 杀后仓态表 + 文案 → **Fixed**（`:530-538`/`:524`）⑤🟡 300s 依据 → **Fixed**（`:513`）⑥🟡 边界指针 → **Fixed**（`:364`/`:451`）⑦🔵 计数 46/30 → **Fixed**（体量半边 = 父侧裁驳回：文档口径正确 ✗ 读取工具 +1 为计法差异）⑧🔵 unverified 标注 → **Fixed**（`:462`/`:475`/`:478`）⑨🔵 LC_ALL + 墙钟注 → **Fixed**（`:621`）⑩🔵 平台注 → **Fixed**（`:519`）⑪🔵 回执 → **无动作** ✓；
- **新面（非阻断 ✗ 父侧收口统一处理）**：批档 §2 本体面待随 §6.14 同步（`:62` 的「34 处」→ 30 ✗ 受影响表 8 行未补 VSC 三档 ✓）；
- **实施派发**：eng-coder #62（§2 全表 ✗ A23–A29 ✗ 双包回归面（`thincoder-core` + `thincoder-vscode`）✓）。

## §5 实施记录（eng-coder）

（待批准后。）

## §6 验证与收口（主代理）

（待实施后。）
