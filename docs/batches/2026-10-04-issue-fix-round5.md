# 2026-10-04 · issue 修复批·五（杂项 6 条：ledger-migrate 旗 ∥ declared 补行 ∥ 桌面 defaultModel 补设 ∥ 工程模式出口 basis 维 ∥ TUI-OOM 余项 ∥ Home 索引）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 00:39「五组都开了」（承 00:31「都自动跑」）；条目源 = 2026-10-03 分诊与在册归批（#834 ∥ #835 ∥ #842 ∥ #848 ∥ #863 ∥ #867——杂项面；#876 沿用户「以后再说」不动）。
> 台账 = #834 ∥ #835 ∥ #842 ∥ #848 ∥ #863 ∥ #867（杂项 · 归批）。前情 = 无（同会话兄弟批——一组~四组 = `2026-10-04-issue-fix-round{1,2,3,4}.md`）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批性质**：归批组第五组（杂项 6 条）——用户 00:39「五组都开了」；全链。

**本批条目（6）**：**#834** ledger-migrate 写旗 ∥ **#835** declared 标志补行 ∥ **#842** 桌面 defaultModel 补设路径 ∥ **#848** 工程模式出口条件 basis 维 ∥ **#863** TUI-OOM 余项 ∥ **#867** Home 索引。**#876 商店护栏 = 用户「以后再说」在册——不收**。**锚 = 台账行在册**（复验先读：`ledger_query` cwd=D:\teamcode\thincoder）。

**复验令**：逐条实读复验；已消/前提变者按实况登记。

**授权口径**：全链；都自动跑（自缚三条在册）。

**边界**：**#834 ∥ #835 涉及 ledger 系件（`thincoder-core/ledger-*.mjs`）= #51 在飞写域** ⇒ 设计轮只写文档；实施须待 #51 收口后派发（设计文件表照列供后续派发）。其余照常——#56 ∥ #59 ∥ #57/#58 ∥ 面板面零触。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-04 · 设计落笔（11 档）+ fix 轮收正（评审 #70 发现 1–11 · 全采纳）落毕；实施按写域排程（#834 ∥ #835 待 #51 收口））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 复验结论（逐条实读——对现盘）
| # | 复验点（file:line） | 结论 |
|---|---|---|
| #834 | `ledger-migrate.mjs:75-82`（writeGateFlag 只做仓根解析）∥ `ledger-cmd.mjs:56-72`（写门含第 4 条声明源候选） | **成立**——两处判面对「声明源前缀形」将不同拍 |
| #835 | `declaration.mjs:85` `publicRepos.length > 0` ⇒ declared 真（值比较）；三登记面无该连带句 | **成立**（代码已含——文档缺句） |
| #842 | `mount-settings-reads.mjs:59,74-89`（provider 空 ⇒ 段 none 零请求）∥ `settings-sections.mjs:70-72`（采用钮判据）∥ 渠道段无「设为当前」 | **成立**（config 级补设死端） |
| #848 | `verify.mjs:82-91`（schema 无 basis）∥ `tool-docs/verify.md`（self-reported）∥ `persona-engineering.md:78`（Close three states——无「根据」条）；gitee IKJKHH 原文全读（八条完成闸 + A/B 采 · C 否） | **成立**（「第 9 条」= 八条清单延伸位） |
| #863 | `/undo`：`undo-stack.mjs:38-44`（MAX_UNDO=50 · 字节无界）成立；`_advisorRuns`：关闭点（`advisor-async.mjs:464-481` ∥ `design-token.mjs:145`）无 priorOutput 释放 ∥ 无逐实例回收；小容器族逐项实读 | **实况重定**：只读快照链健在（CLI 侧 `cmd-undo.mjs:18-42` = 死副本）；capturedConsole **存活**（`core/agent/dispatch-run.mjs:41,75-76,126-129,162-163`——拼接在 offload 之后 ⇒ 可突破 64K）；`_turnControllers`（`agent-turn.mjs:157-164` 链头清零）/`_frozenSubKeys`（`subagent-blocks.mjs:83-95` 复活删）/`expandedBlocks`（`fold-block.mjs:38-43` toggle 增删）有回收面 |
| #867 | 已缓解面（`memory/schema.mjs:24-26,46-55`）实读；`cwd===homedir()` 检测零命中；`engines`（`thincoder-cli/package.json:19-21`）仅声明无运行期校验 | **成立**（三项未做面） |

### 2.1 本批条目（覆盖 · 六条）
| # | 台账 | 修法一句话 | 设计档落点（本设计轮已落笔） |
|---|---|---|---|
| 1 | #834 | 迁移旗判面与写门同源——共享解析单点 `resolveDeclaredRef`（`declaration.mjs` 新导出） | `LEDGER.md` §6.1 口径 5 ∥ §8 T55 ∥ 变更记录 |
| 2 | #835 | 三登记面补 `declared` 连带句（publicRepos 非空 ⇒ declared=true） | `PORTABILITY.md` §3.1 ∥ `MANIFEST.md` KD-M1-35 ∥ `MEMORY.md` §6.15 |
| 3 | #842 | 缺激活渠道态全渠扇出补设（`model:catalog` + 既有 `useModel`——零新 IPC／写面） | `SETTINGS.md` §2.15 ∥ §2.14 随正 ∥ §5 T-DSK62 |
| 4 | #848 | verify 可选 `basis`（缺省提示不阻断）+ 提示词「出口条件第 9 条」 | `VERIFY-REDESIGN.md` §2/§3/§7 D-VR9 ∥ `docs/core/design/prompts/persona-engineering.md`（EN 落地 = 实施轮） |
| 5 | #863 | /undo 双上界 + oversize 态 + 死副本清除；console 回显双上界；`_advisorRuns` 回收 | `TUI-COMMANDS.md` §5.3 ∥ `AGENT-LOOP.md` §6.4 ∥ `AGENT-LOOP-ASYNC-POOL.md` §6.10 |
| 6 | #867 | home 根防护 + SKIP_DIRS 补表（Library ∥ go）+ Node 版本运行期校验（fail-fast） | `MEMORY.md` §6.14 L-④ ∥ `CLI-ENTRY.md` §1 |

### 2.2 机制设计（逐条：根因 ∥ 修法 ∥ 落点 ∥ 验收判据）
- **#834**：根因 = 迁移旗（`writeGateFlag`）与写门（`assertTaskBookGate`）判面分裂（写门已含声明源候选 · #832 T46；旗只做仓根解析）。修法 = 判定单源——`declaration.mjs` 新导出 `resolveDeclaredRef(base, part)`（① 仓根解析 → ② 声明源前缀解析序，同名多仓取声明序首者；返回 `{ ok, abs }`），写门与迁移旗同消费。AC-834-1 声明源前缀（目标在）⇒ 写门通过 ∧ 零旗；AC-834-2 未声明 ∥ 声明根缺位 ∥ 目标档缺 ⇒ 两处同判（拒／旗）；AC-834-3 仓根形全谱逐字零变（回归腿）。
- **#835**：根因 = 三登记面未写 publicRepos 对 declared 的连带读数（代码实读已含）。修法 = 三处各补句（正本 = `PORTABILITY.md` §3.1；另两处短句 + 指针）。AC-835-1 三档各含补句（可机检 grep「publicRepos」∧「declared」同句/邻句）；AC-835-2 句与实读一致（值比较；非空即真）。零代码。
- **#842**：根因 = 激活渠道 = null 时 `loadModels` 段归 none 零请求（死端）。修法 = 该态改取 `model:catalog`（全渠扇出——既有通道）⇒ 候选行 `{ provider, id }`；「采用」经既有 `onUseModel(provider, id)` 写 `defaultModel`（`settings:agent`）⇒ 回读转常规面。视图形 = `modelChoicesTree`/`modelRowNode` 带渠行（显示 `provider · id`；采用判据 = 行自带渠非空）。AC-842-1 缺态段 ready + 全渠候选；AC-842-2 采用 ⇒ 落盘 + 回读；AC-842-3 无渠 ⇒ 空态词（禁假造）；AC-842-4 catalog 失败 ⇒ 段 none + report（零静默）；AC-842-5 有渠态判据零变；**AC-842-6 向导步同链同效**：向导步 2 与设置面 = 同一 `loadModels` 注入引用（注入点 = `mount-settings.mjs:214`；调用点 = `mount-onboarding.mjs:59-62`）——缺渠道态 ⇒ 向导候选面同全渠；「采用」同写 `defaultModel`（批内件腿：同链源码断言 ∥ 桩直调）。**向导结局钉死（fix 轮）**：同链 ⇒ 死端同消解、零向导档改动（异链条件句已收正——`SETTINGS.md` §2.15）。
- **#848**：根因 = verify「自报即放行」无「根据」维 + 提示词八条出口闸全查形式。修法 = A：`verification` 增可选 `basis`（判据源 ∥ `file:line` ∥ `unverified`；`passed`/`skipped` 缺失 ⇒ 提示行，**不阻断**；`failed` 面零提示）+ 描述（schema ∥ `tool-docs/verify.md`）；B：`persona-engineering.md`「Close three states」邻位增「每句判据带根据」条（中文设计档已落 · EN 落地 = 实施轮；**文案不携编号**——「第 9 条」= 报方八条清单位置，落地面自含）。AC-848-1 带 basis ⇒ 回显；AC-848-2 缺 basis ⇒ 提示 ∧ `_verifyPassed` 不变；AC-848-3 failed/未声明 ⇒ 零 basis 段；AC-848-4 提示词双面各 +1 条（`##` 计数不变）；AC-848-5 老调用零行为破坏。
- **#863**：① /undo：`undo-stack.mjs` 增 `MAX_UNDO_BYTES`（10MB——read 守卫同值先例；超限 ⇒ oversize 占位条目 · 可见不可回退）+ `MAX_UNDO_TOTAL_BYTES`（64MB——超限逐最旧驱逐）；`cmd-undo.mjs` 增 oversize 分支（选中 ⇒ 提示 + 不回退）+ 死副本清除（CLI 旧 `snapshotForUndo` 删——单源 = 核档）。② console 回显：`dispatch-run.mjs` 采集端 cap = `CONSOLE_CAPTURE_LIMIT`（64K 字符 = 65536——与 `TOOL_RESULT_OFFLOAD_LIMIT` 同值；到限停收 + 段尾恰一行逐字标记 `[console truncated at 65536 chars]`〔发生丢弃才加〕）+ 拼接先于 `offloadToolResult`（错误路径同款——同 cap ∥ 同标记）。③ `_advisorRuns`：关闭点 `priorOutput = null` + 新实例创建时去重回收（design 同 docSetKey 保最新 closed；code closed 清除）。AC-863-1 快照双上界（超限行为可断言）；AC-863-2 oversize 不可回退且不误删（与 null 创建态分判）；AC-863-3 console 双上界：采集端——洪水 console ⇒ 采集量 ≤ 65536 字符 ∧ 段尾恰一行标记（逐字 `[console truncated at 65536 chars]`；未超限 ⇒ 零标记〔负向锁〕）；拼接端——段 ∥ 本体拼接先于 `offloadToolResult`：拼接后 ≤65536 ⇒ 直出 ∥ >65536 ⇒ 落盘 + 预览；错误路径同 cap ∥ 同标记；AC-863-4 关闭后 priorOutput=null ∧ F2h designId 复用零变；AC-863-5 Map 不随代数单调增。
- **#867**：① home 检测：启动索引 ∥ `/reindex` 触发面（`startup.mjs` `backgroundIndex` ∥ `cmd-reindex.mjs`）判 `cwd === homedir`（resolve 后平台归一）⇒ 跳过索引（三 sync 零调用）+ 一行可见提示（含出路）；不阻断启动。② `SKIP_DIRS` 补用户目录常用项（`Library`=macOS ∥ `go`=Go 工作区）。③ **Node 主版本 ≥24 前置校验（fail-fast）**：执行点 = **`.cjs` shim 首行**（`bin/thincoder.cjs`——先于 `.mjs` 链任何 ESM 静态 import 求值〔「顶层校验」置 `.mjs` 不可达其先——ESM 静态依赖先求值〕）；校验 = **纯函数** `nodeVersionError(version = process.versions.node)`（`bin/node-version-gate.cjs` 新档——版本串入参 ⇒ 直测假版本；返回 null ∥ 一行错误串）+ 执行门 `enforceNodeMajor()`（shim 首行 `require(...)` 调用 ⇒ 不满足：逐字一行 `thincoder requires Node.js >= 24 (current: <版本串>)` + `exit 1`）；射程 = npm bin 入口（`node bin/thincoder.mjs` 直跑面 = 开发 ∥ 测试——边界登记）。AC-867-1 home 夹具 ⇒ 零索引 + 提示行；AC-867-2 非 home 零行为变（回归）；AC-867-3 SKIP_DIRS 两新项生效（walk 剪枝）；AC-867-4 假旧版本 ⇒ 错误（可测缝 = 纯函数直调：`nodeVersionError("20.0.0")` ⇒ 逐字错误串 ∥ `"24.0.0"` ⇒ null——`process.versions.node` 不可造已消解）+ 接线腿（静态）= `.cjs` shim 首行 `enforceNodeMajor()` 先于 `import("./thincoder.mjs")`（源码断言）；真旧版端到端不可造面登记。

### 2.3 受影响文件表（实施轮派发用；行数 = 实读 as-of 2026-10-04——`\n` 计法；纯 .md 免）
| # | 文件 | 变更要点 | 当前行数 | 本轮增量（≤±N ∥「结构不变」） |
|---|---|---|---|---|
| #834 | `thincoder-core/declaration.mjs` | +`resolveDeclaredRef`（组合包装——消费 `declaredPublicRoots`） | 194 | ≤ +24 |
| | `thincoder-core/ledger-cmd.mjs` | 写门消费共享判定 | 142 | ≤ ±4（净 ≈0） |
| | `thincoder-core/ledger-migrate.mjs` | `writeGateFlag` 消费共享判定（内联退役） | 299 | 净 ≤0（≤ ±4） |
| #835 | （零代码——设计档三处已落） | — | — | — |
| #842 | `thincoder-desktop/renderer/mount-settings-reads.mjs` | `loadModels` 增 catalog 分支 | 192 | ≤ +30 |
| | `thincoder-desktop/renderer/views/settings-sections.mjs` | `modelChoicesTree`/`modelRowNode` 带渠行 | 164 | ≤ +15 |
| #848 | `thincoder-core/agent-tools/verify.mjs` | schema + 报告提示/回显段（`basis`） | 296 | ≤ +14（⇒ ≤310——越线判定见下） |
| | `thincoder-core/tool-docs/verify.md` | 描述句 | —（纯 .md 免） | —（纯 .md 免） |
| | `thincoder-core/prompts/persona-engineering.md` | 「Close three states」邻位 +1 条（EN——内容权威 = 主 agent；fix 轮：EN 镜像补尾半句） | —（纯 .md 免） | —（纯 .md 免） |
| #863 | `thincoder-core/undo-stack.mjs` | 双上界 + oversize 态 | 47 | ≤ +25 |
| | `thincoder-cli/src/tui/cmd-undo.mjs` | oversize 分支 + 死副本清除 | 88 | ≤ +12（净小增） |
| | `thincoder-core/agent/dispatch-run.mjs` | 采集 cap + 拼接序修正 + 标记行 | 167 | ≤ +18 |
| | `thincoder-core/agent-tools/advisor-async.mjs` | 关闭轻量化 + 回收 | 481 | ≤ +19（硬限内——见下） |
| | `thincoder-core/agent-tools/design-token.mjs` | 关闭点轻量化 | 156 | ≤ ±4 |
| #867 | `thincoder-cli/src/tui/startup.mjs` | home 检测 + 跳过索引 + 提示行 | 322 | ≤ +10 |
| | `thincoder-cli/src/tui/cmd-reindex.mjs` | home 检测（`/reindex` 触发面） | 51 | ≤ +10 |
| | `thincoder-core/memory/schema.mjs` | `SKIP_DIRS` +2 项 | 468 | +2（≤ +4） |
| | `thincoder-cli/bin/thincoder.cjs` | shim 首行接线（version gate——fix 轮落点） | 4 | +2 |
| | `thincoder-cli/bin/node-version-gate.cjs` | 纯函数 + 执行门（fix 轮新增） | —（拟新增） | ≈20（新档） |
| | `thincoder-cli/bin/thincoder.mjs` | **零改**（校验点让位 `.cjs` shim——见 §2.2 #867③） | 180 | 0 |
| 批内件 | `docs/batches/2026-10-04-issue-fix-round5.test.mjs` | 六条用例腿（随批留存） | —（拟新增） | ≈200（本批自持） |

**行数面结论（>300 ∥ 贴线档复核——as-of 2026-10-04 实读；形态对照 = #882 批 §2.4 先例）**：
- `memory/schema.mjs`（468——本批前读 454 = as-of 2026-09-27）：>300 存量；在册拆分方案 = 扩展名表组拆 `memory/ext-tables.mjs`（拟新增——`MANIFEST.md` §2.3 注在册）；本批 +2（常量区）⇒ ≤472 ≪ 500 ⇒ **复核点结论 = 维持预案、不拆**；函数级：`migrate` ≈371 行（`:99-468`——≥300 函数档越线〔存量〕）——函数档拆分债一并声明（候选 = 迁移步族逐版本出档；本批增量不入该函数）。
- `agent-tools/advisor-async.mjs`（481——在册 = `CORE-UNIFICATION.md` §2.8.1 行 8：481＝实读 2026-09-25，对盘同值；`AGENT-LOOP-ASYNC-POOL.md:117` 载 357 = as-of 2026-09-16 前读）：>300 存量；在册拆分方案（行 8）= 实例注册表 + 启动解析面（`:62-158` ≈97 行）外提 `advisor-runs.mjs`（拆后 ≈390 ∥ 新档 ≈110）；**本批触评 = 不构成「下次实质改动」触发**（行级——既有函数体内轻量化 ∥ 回收；零新函数 ∥ 零导出面变；先例 = 批·一修轮 `config.mjs` 行触评同款）——计划续挂；增量 ≤ +19（481 ⇒ ≤500——硬限内，实施轮不得越）；函数级：最大单函数 `launchAsyncAdvisor` ≈106 行（<300 ✓）。
- `cli/src/tui/startup.mjs`（322）：>300 存量（在册 = `SESSION.md` §6.19 面 `:970` 邻位——拆点候选 = 启动屏族 ∥ 后台索引族外提〔`backgroundIndex` 已函数化〕；触发条件 = 越 500 硬限 ∥ 该档下次实质改动）；本批增 ≈ +10（`backgroundIndex` 内 home 判据 + 提示行——行级非结构性）⇒ ≤332 ⇒ 拆分窗口顺延；函数级：最大单函数 `historyToLines` ≈119（<300 ✓）。
- `agent-tools/verify.mjs`（296——贴线）：**越线判定 = 预期越 300**（#848 增 ≤ +14 ⇒ ≤310——三处点增 ∥ 零结构面）；**拆分预案（登记）** = 报告辅助族（`appendBlockGuidance:58` ∥ 归一 helper ×2 ∥ 诊断注入缝——≈45 行）抽 `verify-report.mjs`（拟新增）⇒ 拆后 ≈265 回线；**触发 = 越 500 硬限即拆；消解窗口 = 该档下次结构性触碰**（本批 = 点增非结构性 ⇒ 拆不入本批——先例 = `2026-09-30-core-tools-pairfix` §2「拆分 = 独立结构动作」）；函数级：最大单函数 = `verifyTool.execute` ≈200 行（<300 ✓）。
- `ledger-migrate.mjs`（299——贴线）：增量净 ≤0 方向（`writeGateFlag` 内联退役 → 消费共享单点）⇒ 维持 ≤300（先例 = `2026-09-25-ledger-key-normalize` 同档折行压缩）；不拆。
- **越 500 面 = 零**（峰值 = `advisor-async.mjs` ≤500〔在册方案 + 不得越钉〕；次高 = `schema.mjs` ≤472 ∥ `startup.mjs` ≤332）⇒ 除在册方案外零新增拆分预案。
- **登记面移交（报父侧）**：行 8 触评 ∥ `SESSION.md` 登记行触评 = 本批未落笔——`CORE-UNIFICATION.md` = 批·一修轮在飞面（#67）；`SESSION.md` 登记行 = 批·四 U2 未裁面 ⇒ 移交父侧排程落位（内容 = 本块）。
- **CLI-ENTRY.md §1 收正（挂起——报父侧）**：`docs/cli/design/*` = #51 写域在飞 ⇒ 本批不触；收正目标文本 = 「入口链首个可执行点 = `bin/thincoder.cjs`（shim）首行——先于 `.mjs` 链任何 ESM 静态 import 求值；校验 = 纯函数 `nodeVersionError(version = process.versions.node)`（`bin/node-version-gate.cjs`——供直测假版本），不满足 ⇒ 一行显式错误（当前版本 + 要求）+ `exit 1`」——待 #51 让渡后同拍落（承批·二 `ACP-CLIENT.md` 先例）。

### 2.4 验收对照（回指条目）
六条 AC 全文见 §2.2（AC-834-1–3 ∥ AC-835-1–2 ∥ AC-842-1–6 ∥ AC-848-1–5 ∥ AC-863-1–5 ∥ AC-867-1–4）；逐条设计档对位 = §2.1 落点列。doc-check（仓根 `node scripts/doc-check.mjs`）为验收项——复跑读数（收正轮）见 §2.5。

### 2.5 本设计轮自检
- 设计档落笔 11 档：`LEDGER.md` ∥ `PORTABILITY.md` ∥ `MANIFEST.md` ∥ `MEMORY.md` ∥ `AGENT-LOOP.md` ∥ `AGENT-LOOP-ASYNC-POOL.md` ∥ `VERIFY-REDESIGN.md` ∥ `docs/core/design/prompts/persona-engineering.md` ∥ `SETTINGS.md` ∥ `CLI-ENTRY.md` ∥ `TUI-COMMANDS.md`（枚举 11 档）。
- `node scripts/doc-check.mjs` 复跑读数（收正轮 · 2026-10-04）：**exit 0**——悬空 0 ∥ 行宽 OK（源域全部 .md 无 >300 字符单行）∥ 行数面差异 8 条（报告态——入闸项零红）。
- 三方一致：本 §2 条目 = 设计档 AC 回指 = 台账六行（#834 ∥ #835 ∥ #842 ∥ #848 ∥ #863 ∥ #867）——无条目增删。

### 2.6 关键决策与被否
| # | 决策 | 被否 / 理由 |
|---|---|---|
| #834 | 共享解析下沉 `declaration.mjs`（与 `declaredPublicRoots` 同层——「引用解析」家族） | 否决：迁移面内联（两处写——单源违约）· 判定留 `ledger-cmd.mjs` 供迁移面 import（层次倒挂）· 不修（读写判定互相打架） |
| #848 | 采 A+B（声明式 + 提示词条），C（机检）不做 | 报方 IKJKHH 明确否 C（语义判定假阳不可控）；`basis` 可选（必填 = 假阳 ∥ 阻断回归）；自报形态保留（有意设计） |
| #842 | 全渠扇出复用 `model:catalog` + 既有 `useModel` 出口 | 否决：渠道行加「设为当前」（写面须先有模型）· 仅靠输入区菜单规避（条目所指 = 设置面自身缺路径） |
| #863 | 小容器族逐项复核（修 = /undo ∥ console ∥ `_advisorRuns`；`_turnControllers`/`_frozenSubKeys`/`expandedBlocks`/`_asyncTombstones` = 有回收面/有界——不修） | 复核依据见 §2.0（桩：墓碑语义必要 ∥ 会话有界；加清反而破迟到 token/依赖查询语义） |
| #867 | home ⇒ 跳过 + 明示（不阻断启动）；版本校验 fail-fast | 否决：「启动交互确认」（改造面大——报方另一候选；保守先跳过+明示）· 版本校验只警告（fail-slow 无益） |

### 2.7 上抛 / 注意（派发前看）
① **#834 ∥ #835** 实施待 **#51 写域收口**后派发（`ledger-*.mjs` 面；#835 本身零代码）。
② **CLI 面在飞写域**（#56 ∥ #59 ∥ #57/#58 ∥ 面板面）——#863 ∥ #867 的 CLI 档位实施派发前对表（本批设计档已落，见 §2.3 文件表）。
③ **round4 批**（#833）可能同档触碰 `MANIFEST.md`（:591 面）——本批 #835 落点 = KD-M1-35（:284 面）∶两处不同节，并发写作风险提示（父侧对表）。
④ 新核实缺陷（范围内）：`core/agent/dispatch-run.mjs` capturedConsole 拼接越 64K（原判「已消解」被实读推翻——按实况修）；CLI 侧 `snapshotForUndo` 死副本（双实现残）。
⑤ #890（#840 批内件配置缝）未了——本批 T-DSK62 涉桌面设置面复跑需隔离纪律（沿 #890 口径）。

**设计评审修正轮（§3 轮次 1 发现 1–11 · 父侧全采纳 · 2026-10-04 · eng-designer）**

- **号 1（🔴 尺寸标注）落毕**：§2.3 表重建（增「当前行数 ∥ 本轮增量」两列——实读 as-of 2026-10-04，纯 .md 免；`bin/thincoder.cjs` ∥ `bin/node-version-gate.cjs` 两行随 #867 落点补入）+ 行数面结论块（>300 复核：`memory/schema.mjs` 468／在册预案引用；`agent-tools/advisor-async.mjs` 481／在册方案＋本批触评＝续挂；`cli/src/tui/startup.mjs` 322／登记引用；贴线：`agent-tools/verify.mjs` 296 ⇒ 越线判定＋拆分预案登记、`ledger-migrate.mjs` 299；越 500 面 = 零；`migrate` ≈371 行函数档越线声明）+ 登记面移交（CORE-UNIFICATION §2.8.1 行 8 ∥ SESSION.md 登记行——避在飞面，待父侧排程）。
- **号 2（🟡 状态面）落毕**：§2 陈旧状态行（「10 档」条）删（删前 `:23-24`）；§2.5 读数统一 11 档。
- **号 3（🟡 用例撞号）落毕**：`LEDGER.md` 新用例 T47 ⇒ **T55**（`:437-438`）＋变更记录同拍（`:514-515`）＋§2.1 引用（`:36`）。
- **号 4（🟡 AC-835-1）落毕**：取「MEMORY 补句点名」支——`MEMORY.md:599` 「本键」⇒「`index.publicRepos`」（三档同拍可机检）。
- **号 5（🟡 向导结局）落毕**：实读钉死 = **同链**（`mount-settings.mjs:214` 注入 ∥ `mount-onboarding.mjs:59-62` 调用——同一 `loadModels` 引用）；`SETTINGS.md` §2.15 条件句收正（`:182-183`）、§2.14 随正（`:170`）、T-DSK62 +⑤ 向导腿（`:339`）；AC-842-6 新设（§2.2）。
- **号 6（🟡 console cap）落毕**：`AGENT-LOOP.md` §6.4 钉 `CONSOLE_CAPTURE_LIMIT = 64 * 1024`（与 `TOOL_RESULT_OFFLOAD_LIMIT` 同值）+ 标记行逐字 `[console truncated at 65536 chars]`；§2.2 ② ∥ AC-863-3 同拍。
- **号 7（🟡 #867 可测缝）落毕**：校验点裁定 = **`.cjs` shim 首行**（先于 ESM 静态 import 求值）；纯函数 `nodeVersionError(version = process.versions.node)`（新档 `bin/node-version-gate.cjs`）+ 执行门 `enforceNodeMajor()`；§2.3 表加 shim ∥ 新档 ∥ `bin/thincoder.mjs` 零改行；AC-867-4 重写（纯函数直测 + 接线静态腿）。**CLI-ENTRY.md §1 收正 = 挂起**（`docs/cli/design/*` = #51 写域在飞）——收正目标文本入 §2.3 注（承批·二 `ACP-CLIENT.md` 先例）。
- **号 8（🔵 单源）落毕**：`LEDGER.md` §6.1 口径 5 补消费关系（声明源段 ≤ 消费 `declaredPublicRoots`——不二写）＋解析序回指 `DOC-DISCIPLINE.md` §4.2.2（`:251-253`）。
- **号 9（🔵 标签改述）落毕**：`MEMORY.md:584` ——「macOS 用户目录项」⇒「用户目录常用项（`Library`=macOS ∥ `go`=Go 工作区）」＋误剪接受面注明。
- **号 10（🔵 双面同拍）落毕**：`persona-engineering.md` EN 镜像补尾半句（同义——可核 ∥ 必标、不规定格式、不追溯既有文档；`:79-80`）。
- **号 11（🔵 指针收口）落毕**：§2.5 落读数本体（下条）；§2.4 指针句收正（`:87`）。
- **doc-check 复跑（收正轮 · 2026-10-04）**：`node scripts/doc-check.mjs`（仓根）⇒ **exit 0**——悬空 0 ∥ 行宽 OK（源域全部 .md 无 >300 字符单行）∥ 行数面差异 8 条（报告态——入闸项零红）。
- **§2 内收正清单（承发现 2 ∥ 11 及本块各号）**：状态行去重（陈旧条删——删前 `:23-24`）∥ §2.1 T55（`:36`）∥ §2.2 #842/#863/#867 三条（`:46`/`:48`/`:49`）∥ §2.3 表重建（`:51` 起）∥ §2.4 指针（`:87`）∥ §2.5 读数（`:90-91`）——本块 = 修正轮记录（上列逐号对应）。
- **交叠 ∥ 挂起（报父侧）**：① `CLI-ENTRY.md` §1 收正挂起（#51 写域——待让渡后同拍落；目标文本已具）；② 登记面两处触评移交（`CORE-UNIFICATION.md` = 批·一修轮在飞面〔#67〕；`SESSION.md` 登记行 = 批·四 U2 未裁面）；③ 批·四所列我面 4 处行宽红点（`AGENT-LOOP-ASYNC-POOL.md:108` 等）= 收正轮对盘**未复现**（现读 ≤272 字符、均 <300）——本批自跑读数 = exit 0。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**计数：🔴 1 ∥ 🟡 6 ∥ 🔵 4（共 11）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件尺寸标注（判据 8） | 🔴 | 批档 §2.3「受影响文件表」（`docs/batches/2026-10-04-issue-fix-round5.md:54-72`）无「当前行数 ∥ 本轮增量」列——16 个源码/测试档无一标注（唯 `:56`/`:57` 两处近似「~20 行」「净 ~0」；纯 .md 两行免）；被触碰档中已越 300 的（`thincoder-core/memory/schema.mjs` 454——`MANIFEST.md:233`；`thincoder-core/agent-tools/advisor-async.mjs` 357——`AGENT-LOOP-ASYNC-POOL.md:117`）与贴线档（`thincoder-core/agent-tools/verify.mjs` 296——`MANIFEST.md:191`/:236，#848 还要加 schema+报告段）均无 tier 结论或拆分预案 ⇒ 越限判定与「spot-check 标注数字」均不可执行；对照先例 = #882 批同类清单（现行行数 × 增量）住批档 §2.4（`LEDGER.md:305`）。 | 按同仓先例补全表列（当前行数 + `≤±N` ∥「结构不变」；纯 .md 免）；对 >300 档回填复核结论（如 `schema.mjs` 现登记 = 扩展名表组拆 `memory/ext-tables.mjs`）；对可能越 500 的档附拆分预案；300+ 单函数面一并声明。 |
| 2 | 文档一致性 / 状态面 | 🟡 | §2 两条「**状态行**」并存且读数相抵——`:20`「11 档」vs `:23`「10 档」；§2.5（`:78`）句首「落笔 10 档」与同句尾「（11 档次）」自抵（枚举实为 11 档）。 | 删陈旧条，读数统一 11 档（与评审对象声明「十一档」一致）。 |
| 3 | 文档一致性 / 用例编号 | 🟡 | 新增「T47 迁移旗同源（#834）」（`LEDGER.md:437`）与既有「T47 正常：容器根锚…」（`LEDGER.md:441`，#882 批 2026-10-03 落——变更记录 `LEDGER.md:511` 载「T47–T54」）撞号；本批变更记录（`LEDGER.md:513`）与批档 §2.1（`:38`）同引「§8 T47」——引用二义。 | 新用例改号（下一空号 = T55；或 T46b 式后缀），并同步 §2.1 与 LEDGER 变更记录引用。 |
| 4 | 验收判据（判据 5） | 🟡 | AC-835-1（`:47`）判「可机检 grep『publicRepos』∧『declared』同句/邻句」：`PORTABILITY.md:62` ∥ `MANIFEST.md:284` 成立，但 MEMORY 补句（`MEMORY.md:599`）以「本键」指代、句内无 `publicRepos`（最近出现 = `:592`）——按字面机检该档不过。 | MEMORY 补句点名 `index.publicRepos`，或把 AC 形式改为「§6.15 节内两词共现」。 |
| 5 | 清晰度 / 覆盖（判据 1、4） | 🟡 | #842 向导面结局悬置——`SETTINGS.md:182`「**若**读取链随 `loadModels` 收敛，向导态自然同效（实施轮实读确认——不扩结构）」为条件句；§2.14（`SETTINGS.md:169-170`）把「设置面 ∥ 向导模型步」列为两处同零候选，而 T-DSK62（`SETTINGS.md:338`）与 AC-842-1..5 只覆盖设置面 ⇒ 向导死端是否消解不可判定。 | 钉死读取链关系（与 `loadModels` 同链 ⇒ 明写同效并给断言；异链 ⇒ 补文件表/AC 或把向导面余项显式登记）。 |
| 6 | 清晰度 / 常量钉值 | 🟡 | #863 ② console 采集 cap 未钉——`AGENT-LOOP.md:286` ∥ 批档 `:50` 仅「采集端 cap（超限截断 + 一次性标记行）」：无常量名/值、无截断标记行逐字（模型可见面）；同批 ① 的 undo 双上界给足确值（`TUI-COMMANDS.md:122`）。 | 钉采集 cap 常量与值（如与 offload 阈值同源）＋ 截断标记行逐字；AC-863-3 补对应断言口径。 |
| 7 | 验收判据 / 可测性 | 🟡 | #867 ③——AC-867-4（`:51`）「假旧版本 ⇒ 错误 + 非零退出」无可测缝（`process.versions.node` 不可造）；「入口壳顶层校验」（`CLI-ENTRY.md:20`）未钉与静态 import 的先后（ESM 静态依赖先求值——链含旧版不可达面则 fail-fast 落空）；文件表落点 = `bin/thincoder.mjs`（`:71`），未涉 `.cjs` shim（`CLI-ENTRY.md:19` 入口链）。 | 抽纯函数（版本串入参 + `process.versions.node` 缺省）供直测假版本；明写校验先于任何核面加载（或置 `.cjs` shim 首行）。 |
| 8 | 单源 / 归属 | 🔵 | 口径 5（`LEDGER.md:251`）新导出 `resolveDeclaredRef` 未写与解析层单一定义的消费关系（口径 4 钉「解析单一定义 = `declaredPublicRoots`」——`LEDGER.md:250`；`MEMORY.md:598` 钉「三消费面共用（解析层），不得二写」）；「同名多仓取声明序首者」的解析序归属（`MANIFEST.md:122` 指 `DOC-DISCIPLINE.md` §4.2.2——不在评审文档集，unverified）未挂指针。 | 补一句消费关系（≤ 消费 `declaredPublicRoots`）＋解析序回指单源档。 |
| 9 | 文档准确性 | 🔵 | `MEMORY.md:584`「`SKIP_DIRS` 补 **macOS 用户目录项**（`Library` ∥ `go`）」——`go` 非 macOS 特有（Go 工作区，跨平台）；两词以 basename 任意深度剪枝（`MEMORY.md:160` 既有表同款）——标注措辞与实义不完全对齐。 | 改述为「用户目录常用项（`Library`=macOS ∥ `go`=Go 工作区）」并注明既有误剪接受面。 |
| 10 | 提示词双面同拍 | 🔵 | `persona-engineering.md:77` 中文条尾句「有则可核 · 无则必标（不规定格式 · 不追溯既有文档）」在 EN 镜像（`:79`）未落——「各 +1 行」而尾句只见设计面。 | EN 面补半句（同义）或注明该句仅设计面不落地。 |
| 11 | 指针收口 | 🔵 | 批档 `:75`「设计轮自跑读数见 §2.5」→ §2.5（`:79`）又转「见本轮 eng-designer 报告（收尾附）」——档内指针死端，doc-check 读数在档内不可达。 | 落读数本体，或把指针改指报告持有面（明示档外）。 |

核读通过项（无发现）：#842 零新 IPC（`model:catalog`/`settings:agent` 皆既有通道——`SETTINGS.md:177-179`）∥ #848 提示词面不携编号 + basis 可选（`VERIFY-REDESIGN.md:28`/:32/:51/:119；`persona-engineering.md:79`）∥ #834 与写门口径 4 一致（`LEDGER.md:250-252`）∥ #863 实况翻转登记自洽（批档 §2.0/§2.2/§2.6/§2.7 互洽）。
局限：台账行原文与源码面（`*.mjs` 的 file:line）不在评审文档集内——相关读数按设计档内引用照录（unverified）；无项目标准档 / 无文档地图声明——方法学与归属维度按 Project Guide + 本评审判据评估（降级）。

VERDICT: changes-required

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
