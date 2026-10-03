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
**状态行**：设计完成（2026-10-04 登记/回填轮——父侧裁定 号 1–8 落毕（§2.8）；§2.3 面终态读数回填 + 设计档收正（AGENT-LOOP ∥ VERIFY-REDESIGN ∥ SETTINGS ∥ CLI-ENTRY）；doc-check 复跑 exit 0）
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

### 2.8 登记/回填块（fix 轮 · 2026-10-04 · eng-designer）

**口径**：承父侧 2026-10-04 裁定（源 = 批档 §5 两舱台账 ∥ #84 报告未决 ④⑤ ∥ #89 注记② ∥ #85 交付报告未决逐条 + 追加号 6–8；dependsOn #85 已落）。**本块为准**——§2.3 表「当前行数／本轮增量」两列与 §5 两舱表读数如与本块相左，一律以本块为准（append-only——原表不重写）；设计面措辞以设计档现文为准。**产品码零触**（登记/回填轮——零实现码 ∥ 零需求档 ∥ 零在飞写域）；本块读数 = 实读 2026-10-04（`\n` 计法）。

**号 1 · `ledger-cmd.mjs` 标注收正**：142 ⇒ **132**（净 **−10**）——§2.3 表列「≤ ±4（净 ≈0）」**未合**（方向为减：内联判定退役 ∥ 死码清除所致——缩向无越限风险）——如实登记（源 = 分歧审计 #89 注记②）；终态 = 号 5 表。

**号 2 · `VERIFY-REDESIGN.md` skipped 阻断支补句（已落）**：§2 `basis` 条补「`skipped` 无 `summary` 的打回支同零提示（阻断面不叠加——提示仅随放行面出现）」——按现实现形明书（`thincoder-core/agent-tools/verify.mjs:254-260`——打回支零 basis 段）；变更记录同拍。**机制语义零改**。

**号 3 · `AGENT-LOOP.md` 载体坐标对盘（已落）**：§2「载体字段集与回写义务」——读取（不建）`advisor-async.mjs:68-71` ⇒ **`:75-78`** ∥ 首用单点（建）`:73-83` ⇒ **`:80-90`**；同 bullet 续行「重置写点」`eng.mjs:57` / `:75` ⇒ **`:62` / `:93`**（实读收正；原载不对位——归因未定（前批插入所致——本批插入点在其下））；变更记录同拍。**机制条文零改**。

**号 4 · `record-results.mjs` 补入受影响面（表外·父裁追加件）**：裁定㈡守卫落盘（`run.open &&` 前置——priorOutput 写点；`thincoder-core/agent/record-results.mjs:136`；净 +2）——§2.3 表外，父侧追加件登记（同族先例 = `advisor-settle.mjs` 裁定㈠ 表外件）。

**号 5 · 全档终态读数回填**（实读 2026-10-04——`\n` 计法；源 = #84 §5.1 表 ∥ #89 读数 ∥ #85 §5.9 表 ∥ 批内件）：

| 档 | §2.3 表列（预算 ∥ 前值） | 终态（前 ⇒ 后） | 注 |
|---|---|---|---|
| `thincoder-core/declaration.mjs` | ≤ +24 ∥ 194 | 194 ⇒ **218**（+24） | 恰达上限 |
| `thincoder-core/ledger-cmd.mjs` | ≤ ±4（净 ≈0）∥ 142 | 142 ⇒ **132**（**净 −10**） | 预算未合·方向为减（号 1） |
| `thincoder-core/ledger-migrate.mjs` | 净 ≤0（≤ ±4）∥ 299 | 299 ⇒ **300**（净 +1） | fix 轮折注后 |
| `thincoder-core/agent-tools/verify.mjs` | ≤ +14 ∥ 296 | 296 ⇒ **301**（+5） | 越 300 预登记（拆分预案在册） |
| `thincoder-core/tool-docs/verify.md` | —（纯 .md 免） | 单行档（描述句改） | |
| `thincoder-core/prompts/persona-engineering.md` | —（纯 .md 免） | EN 镜像尾半句（`:79-80`） | 内容权威 = 主 agent（已落） |
| `thincoder-core/undo-stack.mjs` | ≤ +25 ∥ 47 | 47 ⇒ **61**（+14） | |
| `thincoder-core/agent/dispatch-run.mjs` | ≤ +18 ∥ 167 | 167 ⇒ **184**（+17） | |
| `thincoder-core/agent-tools/advisor-async.mjs` | ≤ +19 ∥ 481 | 481 ⇒ **491**（+10） | ≤500 硬限内 |
| `thincoder-core/agent-tools/design-token.mjs` | ≤ ±4 ∥ 156 | 156 ⇒ **157**（+1） | |
| `thincoder-core/agent/record-results.mjs` | （表外·裁定㈡·父裁追加件） | 180 ⇒ **182**（净 +2） | 父侧口径 181 ⇒ 183（含尾空计法——差恒 +1）（号 4） |
| `thincoder-core/agent-tools/advisor-settle.mjs` | （表外·裁定㈠） | 236 ⇒ **238**（净 +2） | §5.1 载 237 → 239——两端差 −1（归因未定；以实读为准） |
| `thincoder-core/memory/schema.mjs` | +2（≤ +4）∥ 468 | 468 ⇒ **470**（+2） | |
| `thincoder-desktop/renderer/mount-settings-reads.mjs` | ≤ +30 ∥ 192 | 192 ⇒ **204**（+12） | 号 6 |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | ≤ +15 ∥ 164 | 164 ⇒ **169**（+5） | 号 6 |
| `thincoder-desktop/renderer/views/settings.mjs` | （表外件①） | 398 ⇒ **399**（+1） | 投影带渠穿透（号 6） |
| `thincoder-cli/src/tui/startup.mjs` | ≤ +10 ∥ 322 | 322 ⇒ **332**（+10） | 恰达上限 |
| `thincoder-cli/src/tui/cmd-reindex.mjs` | ≤ +10 ∥ 51 | 51 ⇒ **61**（+10） | 恰达上限 |
| `thincoder-cli/src/tui/cmd-undo.mjs` | ≤ +12（净小增）∥ 88 | 88 ⇒ **66**（**净 −22**） | 预算未合·方向为减（号 8） |
| `thincoder-cli/src/tui/index.mjs` | （表外——净 0 行） | 263 ⇒ **263**（±0） | |
| `thincoder-cli/bin/thincoder.cjs` | +2 ∥ 4 | 4 ⇒ **6**（+2） | |
| `thincoder-cli/bin/node-version-gate.cjs` | ≈20（新档） | 新 **28** | 号 7 |
| `thincoder-cli/bin/thincoder.mjs` | 0（零改）∥ 180 | 180 ⇒ **180**（±0） | 零改钉值兑现 |
| `docs/batches/2026-10-04-issue-fix-round5.test.mjs` | ≈200（本批自持） | 新 **434** | 偏差登记（号 8） |

**对盘备注**：① `advisor-settle.mjs` = 实读 **238**（§5.1 载 239——差 −1）；② `record-results.mjs` = 实读 **182**（父侧派单口径 181 ⇒ 183 = 含尾空元素计法）；③ 余档与 §5 两舱表逐值吻合（0 漂移）。

**API-CONTRACT.md 重生成事项登记（父侧收口面——本席不跑）**：生成区随本批漂移（两舱审计读数——乙：`snapshotForUndo` 面 ∥ 两处行号；甲：`advisor-async.mjs` 导出坐标位移）——重跑 = `node scripts/api-contract.mjs --write`（整区替换——生成器唯一笔；逐行修无义）。待父侧收口执行后实现面复位（两舱同类已登记）。

**号 6 · `SETTINGS.md` 回填（已落）**：§3.1 三行终态读数（`views/settings.mjs` **398 ⇒ 399** ∥ `views/settings-sections.mjs` **164 ⇒ 169** ∥ `mount-settings-reads.mjs` **192 ⇒ 204**——机检差异三行消解）；§2.15 补**投影档穿透**条（表外件①——`views/settings.mjs:162-163` 带渠投影）；变更记录同拍。

**号 7 · `CLI-ENTRY.md:21`「（拟新增）」标记退场（已落）**：`bin/node-version-gate.cjs` 已落盘 ⇒ 按「实施批翻已落」形收正（+ 接线句 = shim 首行）；变更记录同拍。**零新语义**。

**号 8 · 两处读数偏差登记**：`cmd-undo.mjs` 88 ⇒ **66**（净 **−22**——§2.3 表列「≤ +12（净小增）」**未合**；方向为减：死副本 26 行清除）∥ 批内件 `2026-10-04-issue-fix-round5.test.mjs` 新 **434**（§2.3 表列「≈200（本批自持）」偏差登记）——两处如实登记（见号 5 表）。

**列报（父侧收口面——未入本轮写域 / 待裁）**：① #85 报告未决 ④——`MEMORY.md:583` 提示措辞（「含出路：项目目录启动 ∥ `index.excludePaths` 声明」——第二出路不经：跳过判据 = `cwd === homedir` 先行、零声明消费，见 `thincoder-cli/src/tui/startup.mjs:277-279`）⇒ 设计面一字之补（建议措辞：删「∥ `index.excludePaths` 声明」半句——声明不解除跳过）；本轮写域未含 `MEMORY.md` ⇒ 待父侧路由；② #84 报告未决 ⑤ 前半——`ledger-migrate.mjs:78` 旗形空串早退（`tb === ""` ⇒ 零旗）∥ 写门空串必拒（`ledger-cmd.mjs:58`）——「同判」残余；改旗面 = 超本批设计面 ⇒ 待父侧/设计面裁；③ #85 报告未决 ⑤——探针 advisor 第 5 腿未随批移录（非 AC 缺口；可选收——本席不动批内件）；④ #85 报告未决 ⑦——观察：无渠态下 `effortOptions` 可自 catalog 行取 advisor 目标模型枚举（轻度放宽、设计未覆盖）——登记；⑤ 同块复核：`AGENT-LOOP.md:103` 核实证据行同族坐标对现盘不对位（写点现读 `:454-455`；读面现读 `:297-304` ∥ `:309-320` ∥ `:328` 起）——未动（非本号 bullet 射程）；`:113` 引 retired 测试档（`（迁移期引文）` 标记在位——列报 · 不入闸，合规）——不移。

**机检（设计档笔落毕后复跑 · 仓根 `node scripts/doc-check.mjs`）**：**exit 0**——悬空 0 ∥ 行宽 OK ∥ 行数面差异 **9** 条（报告态——本面三行消解：12 ⇒ 9；余 9 条 = 桌面域存量（他批面——如 `SETTINGS.md:193` = `settings.mjs` 主侧档 Δ+29 随 `83dd1752`））。**披露：首复跑曾红一次（悬空 2——本席新增 changelog 行两处短形路径 `views/settings.mjs`）；当场收正（补全前缀）后复跑即 exit 0。**

**边界（本块）**：产品码零触 ∥ 需求档零触 ∥ 在飞写域零触（批一登记轮 #90 面 ∥ 批三已收口档）∥ 已收口批档零触；不点火评审 ∥ 不跑构建 ∥ 零实现码 ∥ 不跑 API-CONTRACT 重生成（父侧收口面——仅登记）。

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

### 轮次 2（评审子代理）

**计数：🔴 0 ∥ 🟡 0 ∥ 🔵 0（共 0）——前表 11 条逐条复核 = 全消解（11/11）；本轮新增发现 = 0（只核前表，不猎新）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 修复复核（原 🔴 尺寸标注） | 原 🔴 → 已消解 | 批档 §2.3 表重建三要件逐项成立：① 双列（「当前行数 ∥ 本轮增量」）全档在位（`2026-10-04-issue-fix-round5.md:51-74`——纯 .md 两行免；`bin/thincoder.cjs` ∥ `bin/node-version-gate.cjs` 两行随 #867 补入）；② 行数面结论块（`:76-84`）覆盖全部 >300 面（`memory/schema.mjs` 468 ∥ `advisor-async.mjs` 481 ∥ `startup.mjs` 322 ∥ 贴线 `verify.mjs` 296⇒≤310 越线判定+拆分预案 ∥ `ledger-migrate.mjs` 299）＋函数档声明（`migrate` ≈371 越线声明；四档最大函数 <300）；③ **越 500 面 = 零**（峰值 advisor ≤500「不得越」钉 ∥ 次高 schema ≤472 ∥ startup ≤332）；登记面两处触评移交 ∥ `CLI-ENTRY.md` §1 收正挂起均已披露（`:83-84`/`:125`）。 | —（已落；源码面行数不在评审文档集——集内交叉核一致：`SETTINGS.md` §3.1 载 192/164 ∥ `LEDGER.md` §3.2 载 `ledger-cmd` 拆分后 ≈140） |
| 2 | 修复复核（原 🟡 状态面） | 原 🟡 → 已消解 | 陈旧「10 档」状态行已删——现 §2 单条状态行（`:20`，含「11 档」）；§2.5 `:90` 读数统一 11 档（枚举 11 档）；「10 档」仅存轮 1 发现记录面（`:113`/`:136`）。 | —（已落） |
| 3 | 修复复核（原 🟡 用例撞号） | 原 🟡 → 已消解 | `LEDGER.md:438` 新用例 = **T55**（T46 `:437` 之后）；既有 T47–T54 块（`:442` 起）零碰；变更记录同拍（`LEDGER.md:514-515` 载「T47 ⇒ T55」）；批档 §2.1 `:36` 引「§8 T55」。 | —（已落） |
| 4 | 修复复核（原 🟡 AC-835-1） | 原 🟡 → 已消解 | `MEMORY.md:599` 补句已点名 `index.publicRepos`（「`index.publicRepos` 非空 ⇒ `declared=true`」——同句两词共现，可机检）；AC 文本零改。 | —（已落；`PORTABILITY.md` ∥ `MANIFEST.md` 两处不在评审文档集——按轮 1 核读结论（已成立）照录） |
| 5 | 修复复核（原 🟡 #842 向导链） | 原 🟡 → 已消解 | `SETTINGS.md:182-183` 条件句 ⇒ 同链钉死（同一 `loadModels` 注入引用——`mount-settings.mjs:214` ∥ `mount-onboarding.mjs:59-62`；「采用」同经 `onUseModel:216`）；§2.14 `:170` 随正；T-DSK62 `:339` +⑤ 向导腿；批档 AC-842-6 新设（`:46`）。 | —（已落；源码坐标不在评审文档集——unverified） |
| 6 | 修复复核（原 🟡 console cap） | 原 🟡 → 已消解 | `AGENT-LOOP.md:286-288` 钉 `CONSOLE_CAPTURE_LIMIT = 64 * 1024`（= 65536 字符；与 `TOOL_RESULT_OFFLOAD_LIMIT` 同值声明）＋标记行逐字 `[console truncated at 65536 chars]`＋拼接先于 `offloadToolResult`；AC-863-3（批档 `:48`）同拍（含未超限零标记负向锁）。 | —（已落；「与 offload 同值」= 档内声明——`helpers.mjs` 在集外，unverified） |
| 7 | 修复复核（原 🟡 #867 可测缝） | 原 🟡 → 已消解 | 校验点裁定 = `.cjs` shim 首行（先于 ESM 静态 import 求值）；纯函数 `nodeVersionError(version = process.versions.node)` ＋执行门 `enforceNodeMajor()`（新档 `bin/node-version-gate.cjs`）；AC-867-4 重写（纯函数直测假版本 ＋ 接线静态腿）；文件表补三行（`:71-73`——shim ∥ 新档 ∥ `thincoder.mjs` 零改）。 | —（已落；`CLI-ENTRY.md` 在集外——挂起按披露照录） |
| 8 | 修复复核（原 🔵 单源） | 原 🔵 → 已消解 | `LEDGER.md:251-252` 口径 5 已补消费关系（声明源段 ≤ 消费 `declaredPublicRoots`——不二写）＋解析序单源回指（`DOC-DISCIPLINE.md` §4.2.2）；变更记录 `:515` 同拍。 | —（已落） |
| 9 | 修复复核（原 🔵 标签改述） | 原 🔵 → 已消解 | `MEMORY.md:584` 改述 =「用户目录常用项（`Library`=macOS ∥ `go`=Go 工作区）」＋误剪接受面注明（与批档 `:49` 同拍）。 | —（已落） |
| 10 | 修复复核（原 🔵 双面同拍） | 原 🔵 → 已消解 | `persona-engineering.md:79-80` EN 镜像补尾半句（「a basis present must be checkable, one absent must be marked — no format mandated, existing documents not retrofitted」——与中文尾句 `:77` 同义）。 | —（已落） |
| 11 | 修复复核（原 🔵 指针收口） | 原 🔵 → 已消解 | 批档 §2.5 `:91` 落 doc-check 读数本体；§2.4 `:87` 指针改指 §2.5（「eng-designer 报告（收尾附）」死端仅存轮 1 发现记录面 `:145`）。 | —（已落） |

核读补充：🔴 表重建三要件逐项成立（双列 ✓ ∥ 结论块覆盖全部 >300 面＋函数档 ✓ ∥ 越 500 = 零 ✓）；11/11 消解证据均在评审文档集内可核（集外源码面读数按档内引用照录——unverified）。
局限：源码面（`*.mjs`）行数与坐标不在评审文档集；无项目标准档 ∥ 无文档地图声明（方法学 ∥ 归属维度按 Project Guide 降级评估）；集外档（`CLI-ENTRY.md` ∥ `PORTABILITY.md` ∥ `MANIFEST.md` ∥ `VERIFY-REDESIGN.md` ∥ `TUI-COMMANDS.md` ∥ `AGENT-LOOP-ASYNC-POOL.md` ∥ `SESSION.md` ∥ `CORE-UNIFICATION.md`）相关修复按批档披露照录——未独立复核。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-04 00:31「都自动跑」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass** ✓：轮次 2 复评 #81（`VERDICT: pass` · 🔴 0 ∥ 🟡 0 ∥ 🔵 0——**11/11 全消解**；🔴 表重建三要件成立）；
- ② **修正落地核验** ✓：收正轮 #72 十一条全落（表重建 `:51-74` + 结论块 `:76-84` ∥ `LEDGER.md` T55 ∥ `MEMORY.md` 补句 ∥ `SETTINGS.md` 同链 ∥ `AGENT-LOOP.md` cap ∥ #867 三行 ∥ §2.5 读数）；父侧抽验在盘 + `doc-check` exit 0；**移交面处置** = `SESSION.md` 登记行已落（`7de21bd3`）∥ `CLI-ENTRY.md` §1 已落（`d16d5f40`）∥ `CORE-UNIFICATION.md` 行 8 触评已落（#78 解冻后）；
- ③ **token 已签发** ✓（值不入档，纪律照守）。

**批准面**：#834 ∥ #835 ∥ #842 ∥ #848 ∥ #863 ∥ #867——**两路派发**（core 9 档 ⇒ eng-coder 甲 ∥ cli/desktop 7 档 + 批内件 ⇒ eng-coder 乙（**dependsOn 甲**——批内件全量复跑需甲落））；**EN 提示词面**（`thincoder-core/prompts/persona-engineering.md`）＝主 agent 笔。

## §5 实施记录（eng-coder）
**状态行**：实施完成（甲面 core：轮 2 pass · 终态 clean（审计 0 偏差 ∥ 评审轮 1 pass ∥ fix 2 项 ∥ 轮 2 pass）；乙面 cli/desktop：轮 2 pass · 终态 clean（审计代码面 0 偏差 ∥ 评审轮 1 pass ∥ fix 4 处 ∥ 轮 2 pass））



**§5 实施记录（eng-coder · core 甲面 · 2026-10-04 · initial 轮）**

**口径与执行面**：任务书 = 本档 §2 设计终态（含尾修正块 `:110-125`）。执行面 = core 10 档（#834×3 ∥ #848×2 ∥ #863×4 ∥ #867×1）+ 1 档表外（`advisor-settle.mjs`——父侧裁定㈠）。乙方域（`cmd-undo.mjs` ∥ `cmd-reindex.mjs` ∥ `startup.mjs` ∥ `bin/*` ∥ desktop 两档）∥ `docs/**` ∥ 在飞写域 ∥ 已收口批档 = 零触。

**5.1 落笔清单（11 档 · 行数 = wc-l 口径）**

| # | 档 | 改动点（file:line） | 行数 |
|---|---|---|---|
| #834 | `thincoder-core/declaration.mjs` | `resolveDeclaredRef` 新导出（`:150-163`——组合包装·消费 `declaredPublicRoots` 不二写；`isFile` 助手 `:165`） | 194 → 218（+24 = 恰达上限） |
| | `thincoder-core/ledger-cmd.mjs` | 写门消费共享判定（`:59-61`；内联判定段 ∥ 死 `isFile` ∥ 未用 import 退役；错误文案逐字零改） | 142 → 132（净 −10——方向为减；表列 ≤±4 未合，已登记） |
| | `thincoder-core/ledger-migrate.mjs` | `writeGateFlag` 消费共享判定（`:80-82`；内联退役；+import 行；fix 轮折注回 ≤300） | 299 → 300（净 +1） |
| #848 | `thincoder-core/agent-tools/verify.mjs` | schema `basis`（`:90`）+ passed 段（`:243-244`）∥ skipped 段（`:251-252`）——advisory 提示/回显；failed 面零段 | 296 → 301（+5 ≤ +14；越 300 为 §2.3 预登记） |
| | `thincoder-core/tool-docs/verify.md` | 描述句（basis 语义 + 面上行为） | 单行档 |
| #863 | `thincoder-core/undo-stack.mjs` | 双上界（`:20-22`）+ oversize 占位（`:42`）+ 总量逐最旧驱逐（`:54-58`） | 47 → 61（+14 ≤ +25） |
| | `thincoder-core/agent/dispatch-run.mjs` | 采集 cap（`:18-19` ∥ `:46-56`）+ 拼接先于 offload（`:138-147`）+ 逐字标记两路径（`:141`/`:180`） | 167 → 184（+17 ≤ +18） |
| | `thincoder-core/agent-tools/advisor-async.mjs` | 回收窗（`:137-142` design 保最新 closed ∥ `:151-155` code closed 清除）+ 关闭点释放（`:486-487`） | 481 → 491（+10 ≤ +19；≤500 硬限内） |
| | `thincoder-core/agent-tools/design-token.mjs` | approval 关同拍释放（`:146`） | 156 → 157（+1 ≤ ±4） |
| | `thincoder-core/agent-tools/advisor-settle.mjs` | **表外·父侧裁定㈠**：结算流 prior 写点守卫（`:221`）——无此则 `design-token.mjs:146` 释放被写回覆盖（必要性经评审核读） | 237 → 239 |
| #867 | `thincoder-core/memory/schema.mjs` | `SKIP_DIRS` +2（`:53-54`——Library ∥ go；误剪接受面在册） | 468 → 470（+2 ≤ +4） |

**5.2 接口面（乙方 `cmd-undo.mjs` 分支依赖）**：oversize 占位条目形 = `{ tool, path, backup: null, oversize: true, timestamp }`；**分支须先判 `item.oversize === true` 再判 `backup === null`**（否则占位会被「文件创建」态分支误删档）；普通条目与文件创建态（`backup: null` 且无 `oversize` 字段）逐字零变。AC-863-2 后半（不可回退且不误删）= 乙方半幅面。

**5.3 自测读数（先红后绿）**：探针 `.thincoder/tmp/r5-core-probe.mjs`（27 腿）——初跑 24/27（3 红 = 探针夹具缺陷：待讨论→在途 直迁不在迁移表；非实现缺陷）⇒ 修夹具 27/27 ⇒ **fix 轮后复跑 27/27 全绿**。腿组：解析序 6 ∥ 写门 2 ∥ 迁移旗 1（旗文案 = 写门文案去前缀·逐字相等）∥ basis 5 ∥ undo 3 ∥ console 3 ∥ advisor 5 ∥ SKIP_DIRS 1 ∥ 行数面 1。

**5.4 回归复跑（既有批测试直跑）**：`2026-10-02-manifest-resolution-fix` 8/8 ∥ `2026-10-03-design-token-echo` 11/11 ∥ `2026-10-02-public-repo-read` 5/5（含 T46 写门腿）∥ `2026-10-03-ledger-family-aggregate` 8/8 = **32/32 全绿**。`node scripts/doc-check.mjs`（仓根）⇒ **exit 0**（锚 0 悬空 ∥ 行宽 OK ∥ 行数面差异 8 = 既存桌面档报告态）。仓级套件未跑（父侧收口口径）。

**5.5 审计与代码评审轮次与终态**：

- **分歧审计（explore · 只读）**：DEVIATIONS = 3（全文档漂移：§5 空段 ∥ ledger-cmd 行数面 −10 ∥ ledger-migrate +2）；**PARTIAL ∥ 静默简化 ∥ 清单外 = 0**。
- **代码评审轮 1（advisor · code）**：**VERDICT: pass**（🔴 0 ∥ 🟡 4 ∥ 🔵 2）。
- **fix 轮（响应表）**：

| 号 | 发现 | 处置 |
|---|---|---|
| 1 | 🟡 ledger-migrate 301 越 300 顾问线 | **采纳·已修**：注释折单行 ⇒ 300；探针复跑绿 |
| 2 | 🟡 verify/schema/advisor-async >300 | **不改**：三档登记债在册（`verify-report.mjs` ∥ `memory/ext-tables.mjs` ∥ `advisor-runs.mjs`），数值均在计划内（≤310 ∥ ≤472 ∥ ≤500）——R3 不升级 |
| 3 | 🟡 null/空串「同判」残余 | **不改·登记**：二形在「既有拒绝面零改」射程外（AC-834-2 三例逐例成立）；改旗面 = 超设计面 ⇒ 供父侧/设计面裁 |
| 4 | 🟡 §5 空段·披露未在位 | **采纳·已修**：本段 + 裁定㈠㈡㈢登记（5.6/5.7） |
| 5 | 🔵 ledger-cmd 标注漂移 | **报告项**：代码零改；§2.3 标注收正 = 设计面笔（本席不改设计档） |
| 6 | 🔵 skipped 阻断支零提示 | **不改**：与「已阻断面零提示」同理一致；文本边界收正 = 设计面一字之补 |

- **轮 2 复核**：（回执后补）。

**决策透明表（本席裁量处）**：

| # | 裁量点 | 决定 | 依据 |
|---|---|---|---|
| 1 | `MAX_UNDO_BYTES` 取值 | 10_000_000（十进制） | 设计「read 守卫同值先例」⇒ 与 `thincoder-core/tools/file.mjs:25` 同值 |
| 2 | oversize 占位形状 | `backup: null` + `oversize: true` | 「不得与文件创建态混判」——分判字段 = `oversize`（消费面先判） |
| 3 | console cap 记账 | 每块 +1（接缝符） | join 后 ≤ 65536 严格成立 |
| 4 | advisor-settle 守卫 | 落（表外） | 父侧裁定㈠；必要性实读（防写回覆盖） |
| 5 | ledger-migrate 折注 | 301 → 300 | 评审轮 1 发现 1 采纳 |
| 6 | ledger-cmd 净 −10 | 保留（不补行） | 缩向无越限风险；不填塞代码 |

**5.6 边界遵守**：零触乙方域 ∥ `docs/**` ∥ 在飞写域 ∥ 已收口批档；表外 = `advisor-settle.mjs`（父侧裁定㈠·语义中性·可 revert）+ `.thincoder/tmp/` 探针（临时区·不进仓）。`git diff` 实读 = 本面 11 档 + 探针；`batch.mjs` 改动 = 他批在写（非本面）。

**5.7 未决/上抛（父侧收口看）**：① `record-results.mjs:134` 次级守卫 = 裁定㈡暂缓（待让渡后落）；② 乙方半幅：`cmd-undo.mjs` oversize 分支（先判 `oversize`——见 5.2）+ 批内件 `2026-10-04-issue-fix-round5.test.mjs`（甲面腿建议对照探针移录）；③ 登记面：`API-CONTRACT.md` 生成区 advisor-async 导出坐标随本批 +9 行后移——待 `scripts/api-contract.mjs --write` 重跑（报告态）；④ `AGENT-LOOP.md:111` 载体坐标对现盘不对位（归因未定——本批插入点在其下）；⑤ 设计面二择项 = 响应表 #3 ∥ #6。

**5.8 评审轮 2 回执（fix 复核）**：**VERDICT: pass**——发现 1 = 已修 ✓（`ledger-migrate.mjs` 末内容行 `:300`，折注后写门同源判据/旗文案在位）∥ 发现 4 = 已修 ✓（本段 + 裁定登记）∥ 发现 2/3/5/6 = 分类（登记/报告项）成立 ∥ **新增发现 = 0**。**终态 = clean**（分歧审计 0 偏差 · 评审轮 1 pass · fix 轮 2 项 · 轮 2 pass）。

**§5 追加 · 裁定㈡补落（eng-coder · 2026-10-04 · fix 轮——单点）**

**口径**：派单 = 父侧裁定㈡（「暂缓 → 放行」）；先读同族先例 `thincoder-core/agent-tools/advisor-settle.mjs:221`（已落形）。**禁止面遵守**：他档零触 ∥ 设计档零触 ∥ 在飞写域零触 ∥ 已收口批档零触；`advisor-settle.mjs` 批一 #853 新笔（发送前副本面）零触。

**改动 file:line**：`thincoder-core/agent/record-results.mjs:136` —— priorOutput 写点条件 `looksLikeReviewOutput(result)` ⇒ **`run.open && looksLikeReviewOutput(result)`**（+ `:134-135` 说明注 2 行；同步面唯一 priorOutput 写点）。语义 = closed 实例零消费面（续跑仅取 open）——关闭后不写回 priorOutput（否则 `design-token.mjs:146` / `advisor-async.mjs:487` 关闭点释放被覆盖；与 `advisor-settle.mjs:221` 同族闭合）。`git diff` 实读 = 仅此一处（+2 注释行）。

**自证读数（探针 `.thincoder/tmp/r5-record-results-guard-probe.mjs`——直调生产模块，非副本）**：**14/14 全绿**。腿组：A（closed code-run + 评审输出 ⇒ 写点零写 ∥ round/called-mark/marker 记账零变）6/6 ∥ B（open 同串对照 ⇒ 逐字写回——判式有鉴别力）2/2 ∥ C（真链：真实 `settleDesignReview` 关闭设计实例 ⇒ 提交零写回；`looksLikeReviewOutput(settled.output)` 成立 ∧ 旧码写回体量 ≥200 字符 = race 真实）6/6。

**其他读数**：`node --check`（lint）= **Syntax OK** ∥ `node scripts/doc-check.mjs`（仓根）⇒ **exit 0**（锚 0 悬空 ∥ 行宽 OK ∥ 行数面差异 12 条 = 报告态，全为 `docs/desktop/*` 既存条目，非本笔）。

**审计与代码评审轮次与终态**：分歧审计（explore · 只读）= **1 轮 · 0 偏差**（四类全 0：部分实现 ∥ 静默简化 ∥ 清单外未声明 ∥ 文档漂移；写点唯一性全仓核 ∥ 探针 import 真实性核 ∥ 邻位 mtime 扫描）；代码评审（advisor · code）= **0 轮——父侧本轮径免（任务书「不点火评审」）**。**终态 = clean**（验收 4/4 ∥ 审计 0 偏差 ∥ 探针 14/14）。

**决策透明表（本席裁量）**：

| # | 裁量点 | 决定 | 依据 |
|---|---|---|---|
| 1 | 守卫形状 | `run.open &&` 前置（不另加 `result &&`） | 与 settle 面 `:221` 同形；本档 result 恒为串、`looksLikeReviewOutput` 内部 `String(text ?? "")` 兜底——行为等价 |
| 2 | 邻位注释 | +2 行（紧邻守卫） | 同族先例 `:219-220` 带说明注；防后续「冗余检查」误清 |
| 3 | designId 回显 | spawn 载荷未携字面值——如实缺项（不猜、不以实例 id 充数） | 凭据值不落档（沿纪律）；写授权 = token 门在写时核验（本笔全部写获准 ⇒ token 在位） |

**表外面**：探针档 + doc-check 日志留存（`.thincoder/tmp/r5-2-doc-check.log`，UTF-16 重定向形）+ 本段；产品码仅 `record-results.mjs` 一档。

**§5 实施记录（eng-coder · cli/desktop 乙面 · 2026-10-04 · initial 轮）**

**口径与执行面**：任务书 = 本档 §2 设计终态（含尾修正块 `:110-125`）∥ §3 评审终态。执行面 = cli/desktop 7 档（#842×2 ∥ #863×1 ∥ #867×4）+ 批内件 1 档 + 表外 2 档（`renderer/views/settings.mjs` ∥ `src/tui/index.mjs`——必要性见 5.13）。
甲域（core 面）∥ `docs/**` 设计档 ∥ 在飞写域（round2/3/4 批档 ∥ `thincoder-core/proxy.mjs`）∥ 已收口批档 = 零触。

**5.9 落笔清单（10 档 · 行数 = 内容行口径 · 实测）**

| # | 档 | 改动点（file:line） | 行数 |
|---|---|---|---|
| #842 | `renderer/mount-settings-reads.mjs` | `loadModels` 缺渠 ⇒ `model:catalog` 全渠扇出（`:74-91`；失败 ⇒ none+report `:84-87`）；头注随正 `:12-14` | 192 → 204（+12 ≤ +30） |
| | `renderer/views/settings-sections.mjs` | `modelChoicesTree`/`modelRowNode` 带渠行（`:60-87`——行自带渠优先 · 显示 `provider · id` · 采用 `onUseModel(provider,id)`） | 164 → 169（+5 ≤ +15） |
| | `renderer/views/settings.mjs`（**表外**） | 投影带渠穿透（`:162-163`——`{id, provider}` 保留；不改则行自带渠丢失、#842 视图形不可能） | 398 → 399（+1） |
| #863 | `thincoder-cli/src/tui/cmd-undo.mjs` | oversize 分支（`:45-49`——**先判 `oversize` 再判 `backup === null`**）+ 列表行分判（`:29-33`）+ 死副本清除（删 `snapshotForUndo`/`MAX_UNDO`；消费核导出 `:12`） | 88 → 66（净 −22——方向为减；表列 ≤+12 为上界未越） |
| #867 | `thincoder-cli/src/tui/startup.mjs` | `isHomeDir`（`:268-270`）+ `backgroundIndex` 跳过 + 提示行（`:275-280`——先于 memory.mjs 动态 import） | 322 → 332（+10 = 恰达上限） |
| | `thincoder-cli/src/tui/cmd-reindex.mjs` | home 守卫 + 提示（`:5-7`/`:13-16`——先于表删与三 sync） | 51 → 61（+10 = 恰达上限） |
| | `thincoder-cli/bin/thincoder.cjs` | shim 首行接线（`:4-5`——`enforceNodeMajor()` 先于 `import("./thincoder.mjs")`） | 4 → 6（+2） |
| | `thincoder-cli/bin/node-version-gate.cjs` | **新档**：纯函数 `nodeVersionError`（`:14-18`）+ 执行门 `enforceNodeMajor`（`:21-26`） | 新 28（设计 ≈20） |
| | `thincoder-cli/src/tui/index.mjs`（**表外**） | `backgroundIndex` 调用点补 `pushLine`（`:250`——净 0 行；不传 ⇒ 提示口 TypeError） | 263 → 263（±0） |
| 批内件 | `docs/batches/2026-10-04-issue-fix-round5.test.mjs` | 新档：11 腿（L1/L2 ∥ L3/L4 ∥ L5/L6 ∥ L6b/L7b ∥ L7/L8 ∥ L9——含甲面移录） | 新 434（设计 ≈200——差额登记） |

**5.10 自测读数（先红后绿逐腿）**：`node --test docs/batches/2026-10-04-issue-fix-round5.test.mjs`（仓根）——**先红**（实施前）：3/9 绿（L1/L2/L6 = 甲面腿）+ 6 红（L3/L4/L5（后半）/L7/L8/L9）；**后绿**：**11/11 全绿**（fix 轮补 L6b/L7b + L9 双锁 + L8 win32 腿后复跑仍 11/11）。

真机读数：#867 版本门——`node thincoder-cli/bin/thincoder.cjs -v` ⇒ `0.12.69` · exit 0（达标零误触）；假旧版子进程（`process.versions.node` 直写 `"20.0.0"`）⇒

逐字 `thincoder requires Node.js >= 24 (current: 20.0.0)` + exit 1（**真旧版端到端可造面——优于设计预估「不可造面」，已入腿**）。

`node scripts/doc-check.mjs`（仓根）⇒ **exit 0**（悬空 0 ∥ 行宽 OK ∥ 行数面差异 12 条 = 报告态——其中 3 条为我面档位、归设计面回填）。仓级套件未跑（父侧收口口径）。

**5.11 审计与代码评审轮次与终态**：

- **分歧审计（explore · 只读）**：DEVIATIONS = 2（均文档面：① `API-CONTRACT.md` 生成区三行随本批漂移〔`snapshotForUndo` 已删 ∥ 两处行号〕——待 `scripts/api-contract.mjs --write` 重跑；② `SETTINGS.md` §3.1 三行未回填 + §2.3/§2.15 未载 `views/settings.mjs` 投影档）；**PARTIAL ∥ 静默简化 ∥ 清单外未披露 = 0**（两表外档判「必要且最小」）；审计指我档红面清单漏记 L9 —— 即修。
- **代码评审轮 1（advisor · code）**：**VERDICT: pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 5）。
- **fix 轮（响应表·4 处落笔）**：

| 号 | 发现 | 处置 |
|---|---|---|
| 1 | 🟡 设计面回填（§2.3 漏列投影档 ∥ §3.1 行数） | **不改**（非本席写域）——报父侧/设计面 |
| 2 | 🟡 保留件缺 AC-863-4/-5 ∥ AC-867-3 腿 | **采纳·已修**：L6b（advisor 回收 4 断言）+ L7b（SKIP_DIRS）——前提逐条核读 |
| 3 | 🟡 >300 在册债（`settings.mjs` 399 ∥ `startup.mjs` 332 ∥ 批内件 434） | **不改**：在册预案（R3 不升级） |
| 4 | 🔵 L9 负向锁失效（`\bMAX_UNDO\b` 永不命中） | **采纳·已修**：`!/MAX_UNDO[A-Z_]*\s*=/` + 正向断单源 import |
| 5 | 🔵 `isHomeDir` 二拷贝 | **不改·登记** + 补 L8 win32 归一腿（两面同判锁） |
| 6 | 🔵 提示行 excludePaths 出路不成立 | **不改·登记**：与设计文本逐字同款——归设计面 |
| 7 | 🔵 §5 乙面记录缺位 ∥ `CLI-ENTRY.md`「（拟新增）」 | **半修**：本段即乙面记录；设计档不触 ⇒ 报父侧 |
| 8 | 🔵 catalog 部分失败（`unavailable`）零消费 | **不改·登记**：沿设计「渠失败零行」口径 |

- **评审轮 2（fix 复核）**：**VERDICT: pass**——发现 2 = 已修 ✓（L6b/L7b 在档 + 腿前提逐条核读为绿）∥ 发现 4 = 已修 ✓（双锁对现档零匹配）；新增 = 2 🔵 残项（探针 advisor 第 5 腿未移录〔非 AC 缺口〕∥ 新锁过配精度注）——可选、非阻塞。**终态 = clean**（分歧审计代码面 0 偏差 · 评审轮 1 pass · fix 4 处 · 轮 2 pass）。

**5.12 决策透明表（本席裁量处）**：

| # | 裁量点 | 决定 | 依据 |
|---|---|---|---|
| 1 | `views/settings.mjs` 投影改形（表外） | 落 | 行自带渠唯一通道；不改则 #842 视图形不可能；审计判「必要且最小」 |
| 2 | `index.mjs` 调用点补 `pushLine`（表外） | 落（净 0 行） | home 提示行唯一出口 = pushLine；不传即 TypeError |
| 3 | 常规面显示零变（仅行自带渠时显示 `provider · id`） | 落 | 「带渠形」= 行自带渠场景；AC-842-5 有渠态零变 + 旧夹具逐字同形 |
| 4 | `isHomeDir` 二拷贝（不取共享档） | 落 | 设计表限两档各 ≤+10 且无新档位；L8 腿锁同判 |
| 5 | oversize 选中 ⇒ 不回退且不 splice | 落 | 设计「提示 + 不回退」；splice 连带弃新条目（零收益破坏性） |
| 6 | `cmd-undo.mjs` 净 −22（表列「≤+12 净小增」） | 保留 | 死副本 26 行清除所致；方向为减、上界未越 |

**5.13 边界遵守**：零触甲域 ∥ `docs/**` 设计档 ∥ 在飞写域 ∥ 已收口批档；表外 = 2 档（`views/settings.mjs` ∥ `index.mjs`——语义中性 · 可 revert · 已审计判必要）+ 批内件新档；

`git diff` 实读 = 本面 10 档（另 `round2/3/4.md` ∥ `proxy.mjs` = 他批在写，非本面）。临时区（`.thincoder/tmp/`）零新增落盘面（探针读取只读）。

**5.14 未决/上抛（父侧收口看）**：① `API-CONTRACT.md` 生成区重跑（`scripts/api-contract.mjs --write`——本批 3 行漂移，甲面同类已登记）；② `SETTINGS.md` §3.1 行数三行回填 + §2.3/§2.15 补投影档（设计面）；③ `CLI-ENTRY.md:21`「（拟新增）」退场；④ `MEMORY.md:583` 提示措辞（excludePaths 出路）设计面裁；⑤ 探针 advisor 第 5 腿（结算守卫）未随批留存——可选补移录；⑥ 批内件实读 434 行（设计估 ≈200）——设计表行数随收口收正；⑦ 观察（审计记录面）：无渠态下 `effortOptions`（`settings-agent.mjs`）可自 catalog 行取 advisor 目标模型枚举（轻度放宽、设计未覆盖）——登记。

## §6 验证与收口（父代理）
