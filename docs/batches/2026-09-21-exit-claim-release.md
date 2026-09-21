# 2026-09-21 · exit-claim-release
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 · 来源 = 用户 2026-09-21 21:56 事故报告（正常退出未恢复会话）。
> 台账 = #211（SESSION.md · 归批）。前情 = docs/batches/2026-09-21-git-noninteractive.md（已收口 2026-09-21）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-21

**本批条目**（需求档 `docs/core/requirements/SESSION.md` §2.5 · 台账 #211 · 板块 SESSION.md）：

| # | 条目 | 一句话 |
|---|---|---|
| F-XR1 | 退出释放 | 优雅退出前释放本进程全部槽认领（`staleClaims` 保留集空）——失败容忍，退出恒达 |
| F-XR2 | 路标保留 | 端标记保持指向退出前槽不置空——下次启动「无属主即可用」直达恢复，零探测 |
| F-XR3 | 崩溃面零变 | 非优雅退出不经本路径，探测三态判据（D-MI10）语义原样 |
| F-XR4 | 双端同源 | 机制核内单点；CLI 接线 = `key-handler.mjs` 退出分支；VSC 接线 = extension `deactivate` |

**事故链与授权口径**：用户 2026-09-21 21:56 实测 Ctrl+C×2 正常退出 → 1.7s 后重启新开空槽 44，旧会话（槽 41，5554 条）未恢复（数据完好）。根因 = 退出路径零释放 + 恢复押在 OS 探测明确判死上（探测 unknown ⇒ 保守新开槽）。父侧取证（crash-reports / peers / manifest / 事件日志四源互证）→ 修法方案（释放认领 + 路标保留 + 探测只管崩溃）完整呈报（含边界表 + T1–T4 验收骨架）→ **用户 22:26 问「vsc 侧需要处理吗」→ 父侧实勘 VSC 同雷（deactivate 链零释放）→ 用户 22:28「可以，开始吧」= 本批点火授权**。

**关键判据**：① 恢复判定链现状（`session-slots.mjs:277-297`）——端标记可用 ∧ 属主空/死/本进程 ⇒ 认领；属主探测 unknown ⇒ 保守放弃（`usableSlot` 无属主分支零探测直达——释放后恢复即走此支）；② 释放谓词单源 = `staleClaims`（`session-slots-manifest.mjs:114-120`，F-CR1 批已验）；③ CLI 优雅退出唯一收口 = `key-handler.mjs:139-154`（空闲双确认分支 → `process.exit(0)`）；VSC `deactivate` 支持 async；④ 不做时间窗启发式；ACP `session/close`（#168①）与崩溃路径（F-XR3）不在本批。

**排除面**：提示语义修正（台账 #212 · CRASH-REPORTS 板块）**不并入本批**——分属两板块两需求点，另案走批。

**补充（2026-09-21 22:4x · 设计稿交回 + 父侧纠偏）**：① eng-designer #1 交回设计（SESSION.md §6.18 + D-SE41/42）；其 §2 写入被拒——根因 = 父侧把 §1 状态行写成「讨论已收口」触发整档冻结门（词面纪律坑重犯——状态行只留「进行中」最小词面），已纠偏复开（上方状态行 + 本行存证）。② 父侧实勘裁决 designer 三上抛：`/exit` 第二退出路径属实（`cmd-exit.mjs:5-7` → `ctx.exit` → `index.mjs:441`）→ 需求 F-XR4 已订正双入口；`exitImpl` 缝不存在（全 CLI 零命中——交接摘要旧词顺入）→ T4 订正为 `exitDelay`+`exitTimer` 既有缝；`session-boot.test.mjs` 实测 447 行（原记 319 过期）→ 已订正。三笔 = 需求档笔面，父侧直接执行可 revert。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成——§2 已落（本批条目覆盖 / 落点表 8 文件 / 关键决策 D-SE41/42 / 红线五项对照 / T1–T6 验收对照 / 上抛项无新增）；设计稿 = 设计档 §6.18（父侧已核验通过），待点火评审

**本批条目（覆盖）**：需求档 `docs/core/requirements/SESSION.md` §2.5 F-XR1–F-XR4 全覆盖（条目表 = §1 同源不复制）；F-XR4 按双入口订正形态承接（CLI Ctrl+C×2 + `/exit` 两点、VSC `deactivate` 一点）。不覆盖：ACP `session/close`（#168① 另案）· 提示语义修正（#212 另批）· 崩溃路径（F-XR3 = 语义锁零变）。

**设计档落点**：`docs/core/design/SESSION.md` §6.18（判据句 / 接线序 / 端壳裁定 / 边界情形 / 验收回指）+ §7 D-SE41/42 决策行；落点表与用例细表 = 本节（一次性材料，不入设计档）。

**机制设计一句话**：核内薄函数 `releaseClaimsAll(cwd)`（`loadManifest` → `staleClaims(m, [])` 保留集空 → 非空才 `saveManifest`；整体 try/catch 永不抛）——CLI 两点同步插行、VSC `deactivate` async 前置释放；释放零触碰 marker 面，恢复走 D-2 ① 支既有判据零新语义。细则 = 设计档 §6.18，本节不复制。

**受影响文件与测试面**（8 文件）：

| # | 文件 | 改动 | 量级 |
|---|---|---|---|
| 1 | `thincoder-core/session-slots-manifest.mjs` | 新增 `releaseClaimsAll(cwd)`（与 `staleClaims` / `saveManifest` 同档单源） | +~22 |
| 2 | `thincoder-cli/src/tui/key-handler.mjs` | Ctrl+C×2 空闲双确认退出分支：`cleanup()` 后、`exitTimer` 注册前插释放（+ import） | +2 |
| 3 | `thincoder-cli/src/tui/index.mjs` | `/exit` 路径（`cmd-exit.mjs:6` → `ctx.exit`）同型插行（+ import） | +2 |
| 4 | `thincoder-vscode/extension.mjs` | `deactivate` 改 async，`await releaseClaimsOnExit(_cwd())` 前置于既有三步 | ~4 |
| 5 | `thincoder-vscode/src/extension/session-io.mjs` | 薄包装 `releaseClaimsOnExit`（node 可测缝；`workspaceFolders` 空 ⇒ false 不落核） | +~8 |
| 6 | `thincoder-core/test/session-slot-write.test.mjs` | T1 / T2 核面用例新组 | 新组 |
| 7 | `thincoder-cli/test/tui-exit-cleanup.test.mjs` | T4 CLI 退出 e2e 新组 | 新组 |
| 8 | `thincoder-vscode/test/session-exit-release.test.mjs` | T5 VSC 端壳机判新档 | 新档 |

**关键决策**：D-SE41 = 释放函数与谓词 / 落盘**同档单源**（住 `session-slots-manifest.mjs`，与 `staleClaims` / `saveManifest` 判据面零复制，§6.16 落盘判据三条自动继承）；D-SE42 = CLI 退出链**否决 async 化**、取同步插行（同步单文件写零改造零新竞态面，100ms 窗内同步完成零竞态；`ctx.exitDelay ?? 100` 原值保留不动）。

**红线五项对照**：① F-XR1 失败容忍——try/catch 永不抛、退出恒达（写失败 = 认领残留，恢复走既有探测面，现状形态）；② F-XR2 路标保留——释放零触碰 marker 面（不调 `writeEndMarker`、不写 null；与 `deleteSlot` 显式置空路径严格区分）；③ F-XR3 崩溃面零变——D-MI10 探测三态判据一字不动，崩溃路径信号无 JS 钩子不可达释放面；④ F-XR4 双端同源——机制核内单点，端壳 = 纯转口两行（W11 形态，零端差零镜像必要）；⑤ NF1——零新增跨端共享可变字段（认领集 = 共享 manifest 既有结构）。

**验收对照（T1–T6 · 判据级）**：

- T1 = 释放后盘面三断言（manifest 无本进程条目 ∧ marker 仍指原槽 ∧ 槽文件完好）；
- T2 = T1 后 `resumeSlot` 返回原槽非空数据 + 探测束零 exec（沙箱单进程替身注入）；
- T3 = 崩溃路径负向回归（认领在 + 探测 unknown ⇒ 全新分配，现状锁）；
- T4 = CLI 退出 e2e（`exitDelay` 注入 + `ctx.exitTimer` 捕获——先释放后定时器注册 / 桩收 `exit(0)` / 释放抛错仍注册退出 = 失败容忍）；
- T5 = VSC 端壳机判（沙箱 + deactivate 结构机检）；T6 = 三端测试全绿。

机检形态细表 = 设计档 §6.18 验收回指。

**上抛项**：无新增。设计期三上抛（`/exit` 第二退出路径属实 / `exitImpl` 缝不存在 / 测试行数过期）已由父侧实勘裁决并落需求档订正（§1 补充行②）；本节已按订正后形态承接（T4 = `exitDelay`+`exitTimer` 既有缝）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（设计评审轮 1 · 评审子代理 · 2026-09-21）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | T4 子断言「释放抛错仍注册退出」（SESSION.md §6.18 验收回指 :517；本批 §2 T4 同句；承需求 §2.5 ④ :80）与 D-SE41 核契约「整体 try/catch 永不抛出」（:473 / :567）内部矛盾：CLI 接线 = 裸同步调用（D-SE42 未定 try/catch）——核按契约不抛 ⇒「释放抛错」在接线层不可自然发生；若测试强令其抛（模块 mock——设计未名此缝），裸调用形态下异常上抛 ⇒ 定时器**不**注册，断言反证接线缺防护。 | 三择一并落句：① T4 失败容忍子断言改锚核面（`releaseClaimsAll` 失败返回 false 不抛 ⇒ 定时器恒注册——与 D-SE41 对齐）；② 若须接线层抛错容纳 ⇒ §6.18 接线序补 try/catch 一句 + T4 以模块 mock 驱动（命名 mock 缝）；③ 与需求 §2.5 ④ 措辞同步订正。 |
| 2 | Affected-file size annotations | 🟡 | 批档 §2 落点表（:36-45）只有增量无现值列；抽查：`thincoder-core/session-slots-manifest.mjs` 实读 **297 行** → +~22 ≈ **319 越过 300 咨询线**（未越 500 硬限）——本批无 >300 档审视句（先例 = SESSION-CLAIM 批 §6.16 :388-389 有「行数 / 预期增量 / >300 档审视」）；`session-slot-write.test.mjs` 实读 285 行 → T1/T2 新组大概率同越 300。 | §2 表补现值列 + 尺度结论一句：点名 `session-slots-manifest.mjs`（~319）与 `session-slot-write.test.mjs`（估 >300）两档的拆档审视结论（单凝 releasing 面不拆亦可，须显式登记理由）。 |
| 3 | Clarity | 🟡 | `releaseClaimsOnExit` 被钉为 node 可测缝（session-io.mjs 现无 vscode import——实核 ✓），但「无 workspace ⇒ false」判据落在包装内（:493）：workspaceFolders 唯经 vscode 模块可观察，包装自 `cwd` 无法区分「真目录」与 `_cwd()` 的 process.cwd() 回退 ⇒ 该判据在 vscode-free 档内不可实现。 | 钉参数形：extension.mjs（已 import vscode）解析 workspaceFolders 后**显式传入**目录路径或 hasWorkspace 旗标；包装保持 vscode-free，「无 workspace ⇒ false」改述为入参判据。 |
| 4 | Doc hygiene | 🔵 | 设计档变更记录末行（:653）留「批档 §2 写入被冻结机制拒——待父侧处置」，而批档 §2 现已落地（:25-61）——历史面残留悬置待办语。 | 改该行为已处置记录（承 §1 补充② 纠偏复开），历史面不留开口工单。 |
| 5 | Size note | 🔵 | 两个接线档已贴 500 硬限：`key-handler.mjs` 实读 **475**（+2 → 477）· `thincoder-cli/src/tui/index.mjs` 实读 **491**（+2 → 493）——既有负债不翻案（R3），但本域余量 ~2%。 | §2 表注一行余量提示，后续涉此两档的批次预先备拆档案。 |

**锚点实证（引用纪律）**：§6.18 全部 file:line 抽查通过——`staleClaims`（session-slots-manifest.mjs:114-120）· `saveManifest` opts.release 判据三条（:76/:87-92）· `probeOwnersAsync` 空清单早退（process-probe.mjs:266-268）· `usableSlot` 无属主短路（session-slots.mjs:230-235）· CLI 退出两点（key-handler.mjs:149-152 · cmd-exit.mjs:6 · index.mjs:441）· VSC deactivate（extension.mjs:170-174）· `_cwd()`（panel-messages.mjs:37）· session-io.mjs 无 vscode import（:23-40）——引证与盘面一致。

**覆盖对账**：需求 §2.5 F-XR1–F-XR4 全覆盖（机制 / 接线 / 端壳 / 边界表 / T1–T6 回指一一对位）；红线五项（失败容忍 / 路标保留 / 崩溃零变 / 双端同源 / NF1）逐项有落点；范围无蔓延（#212 / #168① / 崩溃面出批 = 需求边界原样）；方法学合规（判据句入设计档 / 落点表归批档 §2 / D-SE41-42 入 §7 / 变更记录在档）。

**计数**：🔴 0 · 🟡 3 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-21 23:04 父侧代签（用户 22:51 全自动授权「后续你自动跑吧」射程内）**

依据 = 设计评审轮 1（评审子代理 id=5 · §3 轮次 1）：**VERDICT: pass**（🔴 0 · 🟡 3 · 🔵 2），token 已随 Approved 签发（运行态，不入档）。

**逐条裁决表**（响应表——`| # | Action | Detail |`）：

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | T4 子断言「释放抛错仍注册退出」与 D-SE41「核永不抛」内部矛盾——按评审员建议面 ①+③ 收正：需求档 §2.5 ④ 句已改（`requirements/SESSION.md:80`——容忍面在核 D-SE41、接线层零防护、抛错形态须模块 mock 显式命名缝），T4 同步口径随实施轮任务书（`docs/core/design/SESSION.md:517` 同句由 eng-coder 按 §2 T4 修订面落地） |
| 2 | Fixed | 批档 §2 落点表补现值列 + >300 档审视句——随实施轮任务书附注（session-slots-manifest.mjs 297→~319、session-slot-write.test.mjs 285→+组；单凝面不拆，显式登记）落地于 §5 实施记录 |
| 3 | Fixed | `releaseClaimsOnExit` workspace 判据参数形钉死——eng-coder 任务书钉：extension.mjs（import vscode 侧）解析 workspaceFolders 显式传入目录路径或 hasWorkspace 旗标；包装保持 vscode-free |
| 4 | Fixed | 设计档变更记录 :653 悬置句改已处置记录——eng-coder 任务书附带一行（机械形修，可 revert） |
| 5 | Not an issue | key-handler.mjs 475 / index.mjs 491 贴近 500 硬限 = 既有负债（评审员亦判 🔵 不翻案）——本批 +2 零结构性影响；余量提示随 §2 表注登记 |

**批准**：设计通过（§3 轮次 1 pass + 上表修正面已分派）——eng-coder 实施轮放行，round=initial，红线五项（D-MI10 一字不动 / 无时间窗启发式 / F-XR3 崩溃面零变 / ACP 另案 / deleteSlot 对照不动）与 §2 边界为准。

## §5 实施记录（eng-coder）

### 实施记录（eng-coder · 2026-09-21 23:0x–23:5x）

**状态行**：实施完成——三端全绿（core 526 / cli 779 / vscode 912 · fail 0）；内审 explore 审计轮 1（🟡1 已修）+ advisor 代码评审轮 1 pass（🟡1🔵5，小修 2 笔已落）——终态 clean

**§1 落地摘要（逐落点 · 实读坐标）**：

| # | 落点 | 落地 |
|---|---|---|
| 1 | `thincoder-core/session-slots-manifest.mjs` | `releaseClaimsAll(cwd)`（:292-309，+~19）——loadManifest → `staleClaims(m, [])` → 非空才 `saveManifest(cwd, m, null, { release: [] })`（不 setActive——active 共享指针不动）；无 manifest existsSync 早退零写；整体 try/catch 永不抛返回 boolean（D-SE41） |
| 2 | `thincoder-cli/src/tui/key-handler.mjs` | Ctrl+C×2 空闲双确认退出分支：cleanup()（:153）后、exitTimer 注册（:158）前插 `releaseClaimsAll(process.cwd())`（:156）+ import（:8-10） |
| 3 | `thincoder-cli/src/tui/index.mjs` | `/exit` 闭包同型插行（:448）+ import（:39-41）——两入口同一退出语义 |
| 4 | `thincoder-vscode/extension.mjs` | `deactivate` 改 **async**（:176），前置 `try { releaseClaimsOnExit(_cwd(), (vscode.workspace.workspaceFolders?.length ?? 0) > 0) } catch {}`（:180）——workspace 判据在本侧解析（评审 #3 参数形）；`_cwd()` 局部镜像（:186-190，环避让——panel-messages `_cwd` 带 `_cwdOverride` 闭包态，静态 import 扩既有环） |
| 5 | `thincoder-vscode/src/extension/session-io.mjs` | 薄包装 `releaseClaimsOnExit(dir, hasWorkspace)`（:218-226）——vscode-free（入参形旗标；包装体代码面零 vscode 字面，T5d 机检锁死）+ import（:28-30） |

**§2 现值列 + >300 尺度两档结论（评审 #2 分派 · 机器读数）**：`session-slots-manifest.mjs` 297→**316**（wc -l 口径）、`test/session-slot-write.test.mjs` 285→**358**——两档同批越 300 咨询线（未越 500 硬限）。**单凝面不拆**：前者 = 释放函数与谓词/落盘同档单源（D-SE41——拆档即复制判据面），后者 = 新组与既有组共享夹具（`seedReleaseState`/`countingProbe`——拆档即复制脚手架）。登记 = `test/core-hygiene.test.mjs` SOFT_LINE_REGISTRY（:63-68 注记理由 + 触发条件 = 越 500 或下次触碰随批拆）。接线两档 `key-handler.mjs` 480 / `index.mjs` 500（≤500 零余量——评审 #5 既有负债不翻案，下次触碰先备拆）。

**§3 测试面（T1–T6）**：T1/T2/T3 = `session-slot-write.test.mjs` F-XR1 新组 4 用例（全释放三断言 / 早退两态 / 恢复直达零探测（countingProbe 断言 `{alive:0,cmdline:0}`）/ 崩溃负向现状锁——幽灵属主 + unknown）；T4 = `tui-exit-cleanup.test.mjs` 新组 e2e（chdir 真实 temp 域对齐接线 `process.cwd()` 域 + setTimeout 包装观测「注册时释放已落盘」+ 真 30ms 定时器到时 `deepEqual(exitCalls,[0])` 桩收 exit(0) + 失败容忍段核 false ⇒ 定时器恒注册 exit(0) 照达）；T5 = `session-exit-release.test.mjs` 新档 4 用例（转核 / 无 workspace 跳过 / 核 false 透传 / deactivate 结构机检五断言）；T6 = 三端全绿（日志：`.thincoder/tmp/test-{core,cli,vscode}-exit-release.log`——`tests 526·pass 526·fail 0` / `tests 779·pass 779·fail 0` / `tests 912·pass 912·fail 0`）。

**§4 审计与评审轮次**：① 内审 explore 分歧审计轮 1——🔴0 🟡1（T4「桩收 exit(0)」子判据：桩已装但测试内定时器永不到时，桩零次被调）+ 备忘 2（SESSION.md :491 await 旧形残留 / 批档 §5 空置——本节即补）；修复轮 1 = T4 改真定时器到时观测（exitDelay:30 + await 120ms + `deepEqual(exitCalls,[0])`）+ :491 残留一行收正——偏差消解。② advisor 代码评审轮 1——**VERDICT: pass**（🔴0 🟡1🔵5）：🟡 = SESSION.md :493 包装签名字形旧形（父侧域，不阻 pass——随修）；🔵×5 = §6.18 实施前坐标漂移（父侧下次触碰收正）/ extension.mjs 行内 workspace 判据与守卫单源余量（设计裁定 #3 合法形态，登记提示）/ index.mjs 体量零余量（既有负债）/ T4 chdir temp 目录未清 / —；评审小修 2 笔已落（:493 签名字形一行 + T4 夹具 cwdDir finally 清理）→ 复跑绿。**终态 = clean**。

**§5 表外改动披露（全部必要 · 逐笔理由）**：① `thincoder-vscode/test/files.mjs` 登记新测试档（runner fail-closed 显式清单——未登记永不执行）；② `thincoder-core/test/core-hygiene.test.mjs` SOFT_LINE_REGISTRY 登记两档（>300 卫生门——评审 #2 裁决落地）；③ `thincoder-vscode/test/loop-sampler.test.mjs` LS-8 结构锁 deactivate 声明字面 async 形同步（设计改 async 触发的既有锁机械形修，锁意图不变）；④ `session-io.mjs` 注释措辞调整（初稿注释含 `workspaceFolders` 字面触发 workspace-guard 结构锁 #13 误报——该锁裸字面扫 `src/extension/**`，本批该档零新增读点，措辞消误报）；⑤ SESSION.md 共四处形修（:517 T4 句 + :653 变更记录 = 任务书分派；:491 await 旧形 + :493 签名字形 = 评审/审计发现的裁决残留同步，各一行机械形修）。红线五项全程零触碰：D-MI10 判据档未在 touched 清单 / 零时间窗启发式 / 崩溃路径零新逻辑 / ACP 零触碰 / deleteSlot 置空语义零触碰 / marker 写路径零触碰（releaseClaimsAll 零 writeEndMarker）。

## §6 验证与收口（父代理）

**2026-09-21 23:57 父侧验收与收口**

**验收依据** = eng-coder id=8 交付报告（交付表 7/7 Done）+ 父侧实读核验。轨迹：内审 explore 审计轮 1（🔴0 🟡1 已修）→ advisor 代码评审轮 1 **VERDICT: pass**（🔴0 🟡1 🔵5，小修 2 笔已落）——终态 clean。

**父侧核验（实读）**：
- 落点五处实读吻合：`session-slots-manifest.mjs:292-309`（releaseClaimsAll——语义/早退/永不抛）· `key-handler.mjs:152-158`（cleanup→release(:156)→exitTimer(:158) 序）· `index.mjs:444-450`（/exit 闭包同型插行）· `extension.mjs:176-190`（async deactivate + 前置释放 + `_cwd()` 环避让镜像）· `session-io.mjs:218-226`（纯转口两行 + workspace 入参形）。
- 测试证据（在盘）：`test-core-exit-release.log` = tests 526 · pass 526 · **fail 0**；`test-cli-exit-release.log` = 779/779/**0**；`test-vscode-exit-release.log` = 912/912/**0**。
- 分派形修落地：`design/SESSION.md:517`（T4 句 = D-SE41 口径「容忍面在核 · 接线层零防护 · 模块 mock 显式命名缝」）+ `:653`（变更记录）——读回旧句零残留 ✓。
- 红线五项：① D-MI10 判据档未触（不在改动清单）✓ ② 零时间窗启发式（releaseClaimsAll 纯同步盘面）✓ ③ F-XR3 崩溃面零新逻辑（T3 负向现状锁加固）✓ ④ ACP 零触碰 ✓ ⑤ deleteSlot/marker 零触碰（releaseClaimsAll 零 `writeEndMarker`；T1/T4/T5a 三面断言 marker 仍指原槽）✓。
- 表外 4 笔（`test/files.mjs` 登记新档 / `core-hygiene` SOFT_LINE_REGISTRY / `loop-sampler` LS-8 锁形修 / `session-io` 注释措辞消误报）——逐笔必要且已披露，父侧接受 ✓。
- 尺度：`session-slots-manifest.mjs` 297→**316** / `session-slot-write.test.mjs` 285→**358**（同批越 300 咨询线，登记 + 拆分触发条件）；`key-handler.mjs` 480 / `index.mjs` 500（既有负债，下次触碰先备拆）。

**父侧机械形修**（父侧直接执行 · 零语义 · 可 revert）：`design/SESSION.md` §6.18 四处实施前坐标按实读收正——:484（`key-handler.mjs:152-158` · `index.mjs:444-450`）· :491（`extension.mjs:176-190`）· :478（`session-io.mjs:210`）+ 变更记录补一行；核验 = 父侧本轮键档+源码双读（漂移源 = 本批落地所致）。

**结算同步核查（D7）**：§1 状态行 → 已收口（close）· §5 状态行在档（「实施完成——三端全绿…终态 clean」）· 计数：需求 §2.5 T1–T6 全达（用例 3 新组 + 1 新档）· 落点 8 + 表外 4 · 指针：台账 **#211** → 核销（evidence = 本节 + 落点坐标 × §5）· 段作者在位（§1/§4/§6 父侧 · §2 设计 · §3 评审 · §5 实施）· 前批遗留 = 无。

**收口动作**：commit（path-limited）+ push origin main → 台账 #211 待核销 → 已核销 → design 链消费。
