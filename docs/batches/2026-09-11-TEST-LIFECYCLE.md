# 测试生命周期与集成集 · 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分）**：本档对端（VSC）份已由 VSC 仓 `docs/batches/2026-09-11-TEST-LIFECYCLE（VSC 仓）` 逐字承载（D10——零改写）；本档保留本仓份。
> 移出条目（对端份）清单：§5 对端面（as-of `:213`；该计数标 unverified——受并发他链改写影响）——条目计数（对端份 / 本仓份）= ≈23 / ≈35（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-11 · 来源 = 用户 15:37「对 cli 和 vscode 的所有测试做一个评估，统计…」→ 16:04「单元测试和集成测试的做法是我们线下做项目开发时长期沿用的策略…常出的问题才会进集成测试」→ 16:09「测试在批次档里列着，用过就退役是有数据支撑的」→ 16:13「开」。

---

## §1 讨论（主 agent）

### 一、用户机制（原话锚）

1. **两桶来源**：**单元测试** = 开发期产物，开发过程中为改对代码而写——用过即退役；**集成测试** = **不是在开发阶段准备的**——根据**业务**设立 + 按**实际运行情况**补充（**常出的问题才进集成测试**）；**上线前的检查**跑。
2. **退役台账**：测试在批次档里列着（§2 文件表 / §5 交付表 / files.mjs 注册表）——「用过就退役」**有数据支撑**，零新增簿记。
3. **用户否决**「模块下次被触碰顺退」（无定义/无台账/无上界——想不到运行形态）：采纳，该方案废弃。
4. **层次不重复（用户 16:19 补——线下开发逻辑）**：程序员用**单元测试交付**（开发自证），**集成测试用于验收**——「不会说同样的测试你做一遍我再做一遍，没有意义」。推论：**②③ 不是 ① 的改写镜像**（覆盖面不同：① = 开发期自证工具；②③ = 验收面）；**验收依据 = ②③**；长期保护集中在 ②③，① 常态是开发期工具、不承担验收职责。

### 二、机制 v3（讨论收敛——三层来源）

| 层 | 来源 | 寿命 / 去处 |
|---|---|---|
| ① 单元（开发期） | 每批开发过程（批次档 §2 列着） | **批次收口时处置：默认退役**；是业务场景素材 → 转②③ |
| ② 集成·业务 | 业务场景设立（开发期不产） | 常驻 + **发布门**（上线前检查 = ②+③） |
| ③ 集成·生产 | 实际运行常出的问题补入 | 常驻（越用越准） |

- **命运通道（①→②③）**：「转」= 改写成**业务语气场景**（断言只写业务可观察结果），不保留事故形态。

### 三、维护模型（零新角色）

| 件 | 执行人 | 钩子 |
|---|---|---|
| ① 本批测试逐条处置 + **②集成影响核** | 主 agent | 批次 §6 核销同步清单**加一行**（唯一新钩子；漏填 = 记录可见缺口）——**双半：①本批单元档处置（退/转）＋②本批需求是否触及集成场景（新增/修订/无）** |
| ① 落手（删档/改写） | eng-coder | 维护小批 / 随触碰批（删除清单制——09-07 先例） |
| ② 新增与演进 | **触发 = 需求发展（用户 16:14 补）：集成用例随需求不断提而变化——主 agent 评估更新**（不外包不自动；判②影响 → 需变则出条目）→ eng-designer 定形 → eng-coder 落 | 业务变化 / 需求批次收口 / 发布前 |
| ③ 收编 | 用户 → 主 agent 登记 → 转② | 每个真问题处理后 |
| 规则本身 | eng-designer 写 · 用户裁定 | 规则变更时 |
| 争议裁决 | 用户（唯一例外裁判） | 随时 |

### 四、普查数据（本批输入——2026-09-11 · 4 路 explore · 110 档全读）

- 盘面：CLI 64 档 / ~557 用例；VSC 46 档 / ~469 用例；slow 归册 23。mtime 分布（09-07 存量清零后 4 天重建）：09-11 = 38 · 09-10 = 39 · 09-09 = 18 · 09-08 = 14 · 09-07 = 2。
- 分类：**A 活契约 98 · B 事件残迹 8 · C 合并 4 · D 0**；升格候选 0（三条件全套不满足）。
- **B 退役清单（8——全在 CLI）**：`activity-debloat` · `advisor-description` · `advisor-thinking-picker` · `deepseek-v41-specs` · `distill` · `mouse-sane-gate` · `tool-args` · `websearch-config`。
- **C 合并（4）**：`config`→`config-merge` · `prompts-normal-audit`→`prompts-dual-source` · `subagent-id-counter`→`subagent-scheduler` · `settings-panel`→`config-pool`（VSC——裁定点：extension 面断言并入纯单元档是否接受）。
- **削段 ~20 处**：防回潮静态锚（8+ 档）→ 收归 `doc-consistency` 扫描器族；源码/文档字符串锚（turn-across-segments T8/T11 · verify-redesign T-V9/V10 · eng-designer-role T58 · index-perception T-I9 等）；邻档重复用例（activity-flow↔async-visibility 等）。
- **防误退三判定**：镜像≠冗余（两仓无跨仓 import）· 归档≠机制死（调用点全活）· `doc-consistency` = `check-doc-width` **唯一**执行面（删 = 文档门停跑）。

### 五、首批集成用例草案（7 场景——eng-designer 正式化：三态 + 映射 + 可机验）

| # | 场景 | 首批用例方向（正常/边界/错误） |
|---|---|---|
| ① | **普通模式完整工具流**（用户点名必选） | 改文件→lint→验证→`verify passed`；失败→verify 拦住不得声称完成；浅改浅验分层 |
| ② | 工程模式全链 | 需求→设计→评审→token→实施→收口→消费；无 token 写被拒；修正轮收敛 |
| ③ | 子代理生命周期 | spawn→观察→报告→结算；cancel 清理；并行域冲突排队 |
| ④ | 会话恢复/中断续跑 | kill→resume 计数不重置；续跑无重复副作用 |
| ⑤ | TUI/面板基本盘 | 编辑→提交→响应；审批/提问面；Esc 干净退出 |
| ⑥ | commit/验证关口 | pathspec 不混入他批 staged；verify 门（skipped 需理由 / failed 拒绝） |
| ⑦ | 配置装载与 provider 选路 | 真实配置启动选路；坏配置软失败/回退 |

- 双端：①–⑦ 两仓各自实例化（CLI + VSC）；③ 机制同源双端各跑。
- 演进纪律：**最小可跑起步，不一次写满——之后「常出的问题」才往里加**（③层收编）。

### 六、次序与范围

- 次序：**先建②（保护墙先立）→ 扫①（110 档一次性处置）→ ③ 种子（GH#6/#7 生产反馈场景化收编）**。
- 范围：`docs/requirements/TESTING.md` + `docs/design/TESTING.md` 扩节（CLI；VSC 对位档随勘察同步）· 集成集目录/runner（发布门）设计 · §6 收口「测试处置行」（核销同步清单）· 首执行清单（普查 8 退 / 4 并 / 削段）。

### 七、状态

**讨论收敛 2026-09-11 16:13**（用户「开」）。下一步 = §2 批次任务（eng-designer）。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求层 + 设计/测试层已落档，待设计评审；含排程与裁定项）。实施者 = eng-coder（设计 token 门）。本 §2 = 任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/TESTING.md` §2–§4（F6–F14 · N7–N9 · §2.1 维护模型，已落）· 设计+测试 = `docs/design/TESTING.md` §3–§10（已落）；VSC 对位 = `thincoder-vscode/docs/design/TESTING.md`（新建，已落 + README 登记）。

### 本批覆盖的需求条目（三链锚——批次档 §2 = 需求档 = 设计档回指）

| # | 本批条目 | 需求回指 | 设计回指 | 交付物 |
|---|---|---|---|---|
| TL-1 | 测试生命周期机制（三层来源/寿命/命运通道/处置判据/演进评估/收编） | F6–F11 · N7 | CLI 设计档 §3 | 文档（已落） |
| TL-2 | §6 处置行（双半）+ 同步面清单 | F9 | CLI 设计档 §3.3 | 文档（已落）+ 落笔项（排程） |
| TL-3 | 集成集承载/runner/发布门契约（双端） | F12 · F14 · N9 | CLI 设计档 §4 + VSC 档 §3 | 新档 runner + 门禁接线（待实施） |
| TL-4 | 首批场景 + 种子（三态机验） | F12 · F13 | CLI 设计档 §5 + VSC 档 §4 | `test/integration/*`（两仓，待实施） |
| TL-5 | 首执行①扫：退役/合并/削段 | —（一次性执行——见设计档 §7） | CLI 设计档 §7 | 测试面执行（删除清单制，待实施） |
| TL-6 | 双端对位档（VSC 新建 + 登记） | F14 | VSC 档（已落） | 文档（已落） |
| TL-7 | 批级机检（宽度/一致性/快层） | AC-TL10 | CLI 设计档 §6 | 执行 + 父侧核验 |

### 三态用例方向（七场景 + 种子——正式化用例见设计档 §5）

| # | 场景 | 正常 | 边界 | 错误 |
|---|---|---|---|---|
| ① | 普通模式完整工具流（必选） | 改档→lint→verify passed | doc-only 浅改快路径 | verify failed 打回 |
| ② | 工程模式全链 | 评审→token→spawn→consume | 修正窗口放行/链终拒 | 无 token 拒绝 |
| ③ | 子代理生命周期 | spawn→结算 | 域冲突排队 | cancel 清理 |
| ④ | 会话恢复/中断续跑 | 计数不重置 | 中断续跑无重复 | 坏档干净回退 |
| ⑤ | TUI/面板基本盘 | 输入→提交→响应 | 审批/提问面 | 退出清理锁序 |
| ⑥ | commit/验证关口 | pathspec 不混入他批 | skipped 须理由 | failed 拒绝 |
| ⑦ | 配置装载与 provider 选路 | 真实配置选路 | 未知名明确报错 | 坏配置软失败 |
| 种子 | S1 异步结果不丢（GH#6）· S2 渲染字面量（GH#7） | —（归场景 ③/⑤ VSC 实例） | — | — |

### 受影响文件（当前行数 + 预计增量——全表见设计档 §8）

- **CLI**：requirements/TESTING.md 42→+~110【已落】· design/TESTING.md 79→+~300【已落】· test/run-integration.mjs 新 ~40 · test/integration/* 新 ~600–900 · scripts/release-check.mjs 62→+~15 · package.json 42→+1 行
- **CLI（续）**：docs/design/RELEASE.md 128→+~6 · AGENTS.md 68→±4 · docs/README.md 239→±1 · 测试面 8 退（~723 行）/ 4 并 / 削段
- **VSC**：docs/design/TESTING.md 新 ~150【已落】· docs/design/README.md 123→+~5【已落】· test/run-integration.mjs 新 ~45 · test/integration/files.mjs 新 ~15 · test/integration/* 新 ~500–800 · package.json 129→+2 行 · settings-panel→config-pool（裁定）· 削段点名档 · AGENTS.md 122→±5 · docs/design/RELEASE.md 200→+~6
- **同步面（落笔项）**：ENGINEERING-MODE 两档（§1.12/§1.15/§2.19 枚举）+ 双端提示词 D7 双源——冻结窗口排程（设计期不触碰；归属与清单见设计档 §3.3）

### 验收标准（逐条回指——机验细目见设计档 §6）

| AC | 标准 | 回指 |
|---|---|---|
| AC-TL1 | 需求档/设计档固定结构在位（grep 断言） | F6–F14/N7–N9 |
| AC-TL2 | CLI 集成入口退出码 0（场景 + 种子全绿） | F12 |
| AC-TL3 | VSC 集成入口退出码 0（按本端清单） | F12/F14 |
| AC-TL4 | 普通模式场景档 + 三态齐全 | F13 |
| AC-TL5 | npm test/test:full 零混入 + 集成档零 slow( | F12 |
| AC-TL6 | 两仓发布门接线（串断言 + 实测跑通） | F12 |
| AC-TL7 | 8 退档不存在 + 并档差额对账 | §7 首执行 |
| AC-TL8 | 削段后扫描器族在岗 + 点名档零残留 | §7 首执行 |
| AC-TL9 | §6 处置行定义 + 同步面清单在位 | F9 |
| AC-TL10 | 两仓机检零新增（口径 = 批前/批后差；他链归其链）+ 快层绿 | 批级 |
| AC-TL11 | VSC 对位档在场 + 登记 + 镜像策略子串 | F14 |
| AC-TL12 | 种子 S1/S2 场景件断言绿 | F11 |

### 明确不在本批

- 真付费端点进层（smoke 独立不动）· PTY 级全 TUI 驱动（⑤ 模块级起步）
- VSC commit 镜像缺口修复（技术待办在案）· slow 门/分层机制改动（零改）
- 集成集一次性写满（最小可跑起步——扩面走演进入口）
- 同步面文档/提示词的**本批设计期落笔**（排程项——见上）

### 呈请裁定项（待用户裁定后执行）

**VSC `settings-panel` → `config-pool` 合并**：extension 面断言并入纯单元档（happy-dom env 沿 helpers/webview-env.mjs 先例）。设计建议：**接受**（同板块凝聚 + 减碎片；分节标注「面板显示面」）；备选：不接受（原地保留，差额表调整）。接受与否都须差额对账。

### 排程说明

① 集成集（TL-3/TL-4——保护墙先立）→ ② 扫①（TL-5——**集成集全绿后才执行**）→ ③ 种子 S1/S2 随集成集首版落地。双端可并行（CLI / VSC 文件域不相交——除同步面文档按排程）。同步面落笔 = 无冻结窗口冲突时（父侧排程；文档 = eng-designer 修订 · 提示词 = 主 agent 内容权 + eng-coder 落笔）。

**父侧登记项**：需求池补登（记录 = 主 agent）——本批需求条目入 `docs/TODO.md` 需求池组（组计数同改——D3）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；eng-designer 自写；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（🔴 0 · 🟡 3 · 🔵 4——发现表见 §3）。本修正轮逐条落修 **7/7**——只动文档（CLI 设计档 + CLI 需求档 + VSC 对位档 + 本 §2），实现面零碰、零新语义。

**一、逐条落点（file:line as-of 本轮落修后）**

| 发现 | 落点 |
|---|---|
| 🟡#1 削段/接收档行数 | `docs/design/TESTING.md` §8.1.1（:334-348——削段/接收/并档逐行 + 拆分预审句 + 跨仓归属注记）· §7.3（:302 指针）· §8.1 计数行（:332） |
| 🟡#2 域外载体 | `docs/design/TESTING.md` §7.4（:304-314——`test/integration-provider.mjs` 退（删除）入删除清单制 + 名式外载体判定规则 + 覆盖附注） |
| 🟡#3 N1 作用域 | `docs/requirements/TESTING.md` §3 N1（:53——单元档作用域限定 + 集成档排除句；对齐设计档 §4.3） |
| 🔵#4 判定探针 | `docs/design/TESTING.md` §4.5（:170——`_verifyPassed` 判定探针口径句） |
| 🔵#5 N8 回指 | `docs/design/TESTING.md` §6 AC-TL1（:253——子串枚举补「最小可跑起步」）；本档 TL-4 回指更新（下表） |
| 🔵#6 数字落定 | `docs/design/TESTING.md` §8.1（:322）· §8.2（:354）· `thincoder-vscode/docs/design/TESTING.md` §6（:73） |
| 🔵#7 候选 2 表述 | `docs/design/TESTING.md` §4.2（:144——目标参数已存在（`run-fast.mjs`:18-19）；真实分界 = slow-gate + 消费方语义） |

**二、TL 表回指更新（🔵#5——三方一致；上文 TL 表 TL-4 行以本行为准）**

| # | 本批条目 | 需求回指 | 设计回指 | 交付物 |
|---|---|---|---|---|
| TL-4 | 首批场景 + 种子（三态机验） | F12 · F13 · **N8**（最小可跑起步） | CLI 设计档 §5 + VSC 档 §4 | `test/integration/*`（两仓，待实施） |

**三、计数更新（D3——上文「受影响文件」与设计档同步）**

- 测试面 = **9 退**（8 B 类 723 行 + 1 域外补录 157 行 ≈ 880 行）/ 4 并 / 削段；设计档 AC-TL7 同步（设计档 §6）。
- 实测落定：`requirements/TESTING.md` **74 行**（原估 42→+~110）· VSC 对位档 **96 行**（原估 ~150/~160）。

**四、边界**：零代码 · 不碰 §3 评审段 · 提示词面零碰（同步面仍为排程项——设计档 §3.3）。

## §3 设计评审（评审子代理）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件标注（八维 #8） | 🟡 | 削段/接收面未逐档标注「现状行数 + 预计增量」：CLI 档 §7.3（`docs/design/TESTING.md`:298-299）点名 `turn-across-segments`/`verify-redesign`/`eng-designer-role`/`index-perception` 等切点而全无行数；§8.1 仅一行汇总「测试面（§7）…删除 ~723 行 + 增」（:319）；削段断言收归目标 `test/doc-consistency.test.mjs`（实测 236 行）未入 §8.1；并档目标增量未标（`prompts-dual-source.test.mjs` 333 → 并入 72 → ~405 行——已越 300 咨询线）。对照：VSC 侧削段档有行数（`TESTING（VSC 仓）`:80）。实测：CLI `turn-across-segments` 136 行 / `verify-redesign` 154 行 / `eng-designer-role` 346 行。 | §8.1 补削段/接收档逐行（现状行数 + 增量或「结构不变」），或明示其行数随「执行轮逐条清单」同表核销；`prompts-dual-source` 并档后 ~405 行（>300）加一句拆分预审说明。 |
| 2 | 普查完整性（范围） | 🟡 | 测试载体漏网：`test/integration-provider.mjs`（≈157 行，含 5+ `test()` 用例——multi-provider 配置/切换）不在任一执行面（`run-fast.mjs`:19 / `run-full.mjs`:9 目标为 `test/*.test.mjs`，该档名不匹配）、无活引用（grep 零命中——仅 `.thincoder/tmp` 临时文件与 `_archive` 提及），也不在 §7 三清单/§8 影响表/普查 A–D 分类中；名字与新建 `test/integration/` 域相邻易混。普查「CLI 64 档」恰等于 `*.test.mjs` 实数——该档在普查域外。 | §7（或 §3.1 域定义处）补「非 `*.test.mjs` 名式测试载体」处置判定（退/迁入集成域/明示排除理由），删档纳入删除清单制核销。 |
| 3 | 需求覆盖 / 文档一致性 | 🟡 | `requirements/TESTING.md`:53（N1）为无限定句式——「需真实 fs / git 子进程 / 定时器 / 网络的测试……用 `slow()` 包装」；集成档同用真实 fs/git/进程，而设计红线为「不得用 `slow()`」（`design/TESTING.md`:154、§9 #2 :350）——两档对同一批文件字面冲突。故障面真实：`slow()` 以 `THINCODER_TEST_FULL` 门控（`test/slow.mjs`:22-28），集成 runner 下会静默 skip。 | 需求 N1 加作用域限定（「单元档（`test/` 顶层 `*.test.mjs`）」或「快/全两层执行面内」）；设计侧已有 §4.3 红线 + AC-TL5 机械兜底，不需改。 |
| 4 | 验收标准一致性 | 🔵 | §4.5（:169）「②③ 只断言业务可观察结果……不锁私有结构形状」，但 §5.1/§5.6 机验手段含私有内存旗位 `_verifyPassed`（:183/:227——实为 agent 内部态，`src/agent.mjs`:67、`src/agent-tools/verify.mjs`:150），非「状态文件/产物」。 | 二选一——把该旗位明示为口径内判定探针，或机验改挂可观察面（verify 输出串/报告文本/产物）。 |
| 5 | 需求映射（三方条目一致） | 🔵 | N8（最小可跑起步）无 TL 条目回指（批次档 §2 的 TL-1–TL-7 无一行圈 N8——:83-91），也不在 AC-TL1 固定子串枚举（`design/TESTING.md`:252）。 | AC-TL1 子串枚举补 N8（「最小可跑起步/本表即首批上限」）或 N8 挂 TL-4 回指列。 |
| 6 | 数字抽查（.md 豁免硬标——估计偏差） | 🔵 | `requirements/TESTING.md` 实际 74 行，与「42→+~110【已落】」（批次档 §2:108、`design/TESTING.md`:309）预期 152 不符；VSC 对位档实际 96 行，与「新 ~150」（`TESTING（VSC 仓）`:73、批次档 :110）/「~160」（`design/TESTING.md`:325）不符。（`design/TESTING.md` 79→~380 实测吻合；代码/测试面抽查全部 ±1 内。） | 修正两处估计值或注明 as-of 口径，防后续核销以错数对账。 |
| 7 | 方案选型表述 | 🔵 | §4.2 候选 2 否决语「复用 `run-fast.mjs` 加目标参数」与实现不符——该入口已收目标参数（`run-fast.mjs`:18-19，默认 `test/*.test.mjs`）；真实分界 = 其挂载 slow-gate（>800ms 未归册即红）与消费方语义（`design/TESTING.md`:144 后半句已写对）。 | 行内修正否决表述，使该备选记录可复核。 |

计数：🔴 0 · 🟡 3 · 🔵 4（合计 7）

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 16:52 父侧代签**——用户 16:40「后续你也自动推进到全完成吧」（授权窗口——本日 12:48 授权延展至排空）；三条件齐备：轮次 1 pass（🔴0·🟡3·🔵4）+ **修正轮 7/7 落修 + 父侧核验通过**（§8.1.1 逐行表 / §7.4 域外载体 / N1 作用域限定 / 探针口径 / N8 回指 / 数字落定 / 候选 2 表述——逐条抽核 ✓）+ **token 已签发**（值不落档）。

**批准范围**：CLI 面（`run-integration.mjs` + `test/integration/*` + mock-llm 复用 + release-check 集成步 + package.json + 首执行清单 9 退/4 并/削段）+ VSC 面（集成集 + files.mjs + 门禁 + 合档/削段）+ 连带文档（RELEASE.md / AGENTS.md / README.md）。

**父侧裁定（随签）**：

1. **VSC `settings-panel` → `config-pool` 合并 = 接受**（设计建议；分节标注「面板显示面」）——用户如有异议一句话翻转；
2. 执行轮顺带：`thincoder-vscode/docs/design/README.md` 行数注对齐（实测 125）。

**遗留（批准时登记）**：提示词 D7 双源同步（处置槽位枚举——D5 窗口让位，窗关即落）；0.8.10 存量用户下个发布生效。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

### 实施记录（VSC 面——eng-coder 自写）

**状态：clean**（2026-09-11——集成集 28/28 退出码 0 · 快层 483 pass/0 fail · doc-width 新增 0；内部偏差审计 1 轮 + 内部代码评审 pass + 修正轮 6/6 落地）。未 commit；未发起用户级评审（设计评审已由父侧完成，本链设计 token 复用）。

#### 一、交付摘要（as-of 落地）

1. **集成集（TL-3/TL-4）**：`test/run-integration.mjs`（新，53 行——清单启动器 + 启动前自检四项：清单在盘 /
   漏登记反证（递归）/ 两清单零混入 / 集成档禁 slow）；`test/integration/files.mjs`（新，18 行——显式清单）；
   7 场景档共 1012 行 + 共享夹具 `test/integration/helpers/mock-llm.mjs` 86 行；**28 用例**（①–⑦ 各三态 + 种子 S1 落 ③ / S2 落 ⑤）。
   断言面 = 业务可观察结果为主（产物/送达/放行-打回/渲染逐字）；判定探针 `_verifyPassed` 按 CLI 侧设计档 §4.5 口径内使用。
2. **接线**：`package.json` `test:integration` script + `vscode:prepublish` = `lint → test:full → test:integration`（三环）。
3. **扫①（TL-5）**：合档 + 削段（逐条清单见下）。
4. **连带文档**：`docs/design/RELEASE.md`（发布门三环 5 处 + 变更记录）、`AGENTS.md`（Testing 段 +3 行）、`docs/design/TESTING.md`（§6 受影响文件表对齐执行结果 + README 行数注落定 125 as-of 本批 + 状态行）。

#### 二、削段 / 合档清单（删除清单制——逐条与理由）

| 档 | 处置 | 理由（真契约留 / 重复自明删） |
|---|---|---|
| `test/settings-panel.test.mjs` → `test/config-pool.test.mjs` | **合档**：源档删；断言全并入（8+5=13 用例）；并后 193 行（差额 = 头部/import/env 装配去重） | 父侧随签裁定 = 接受（分节标注「面板显示面」；happy-dom 沿 helpers/webview-env.mjs） |
| `test/turn-across-segments.test.mjs` · T8 | **删**（11 断言） | 源码字面锚（循环条件/抛点/复位点/单一计算点/负向旧参锚）——行为由 T1–T4 + T9（真 runAgent 段间）+ T10（真 runChild 消费）覆盖 |
| 同上 · T11 | **裁**（8 → 2 断言） | agent.mjs 种子锚 = T9 行为覆盖、runChild 种子锚 = T10 行为覆盖 → 删；escalate-async 种子支全仓唯一覆盖 → 保留最小锁 |
| `test/verify-redesign.test.mjs` · T-V9 | **删**（6 断言） | guard 文案负向锚——旧语义早退役，现行守卫行为由集成 ①（重试提醒）与 T-V1~V6 覆盖 |
| 同上 · T-V10 | **裁**（6 → 2 断言） | 三条「旧词组不复现」负向锚删；保留 `verification.status` 正向参数名锚（模型据此声明） |
| `test/eng-designer-role.test.mjs` · T58 | **改挂行为面**（5 源码 regex → 2 行为断言） | 枚举 regex 脆弱（重排/改名即红）；改断言渲染产物（agentCardHtml 的 eng-designer 槽位）+ 频道建块（role 入族行为） |
| `test/index-perception.test.mjs` · T-I9 | **裁**（6 → 4 断言） | 旧串负向全路径 grep + 两条源码形态锚删（ignored 语义由 git 慢档组行为锁）；词表锁 + no-index 抽检保留 |
| 同上（评审修正轮） | **拆档** | 328 行 > 300 咨询线 → git 慢档组（T-I6/T-I6b/T-I7/T-I10）独立成 `test/index-ignored-slow.test.mjs`（123 行）；本档 258 行；两档各自入册 |
| `test/activity-flow.test.mjs` · never-born 补桩用例 | **删**（邻档重复） | 承载方 = `async-visibility.test.mjs` T-V4/T-V5（精确成员表 + 不补行边界 + 痕迹断言） |

#### 三、审计与代码评审（终态 = clean）

- **内部 explore 偏差审计 ×1**：DEVIATIONS 2 条（均 🔵 doc-drift 数字：`TESTING.md` 行数注、`AGENTS.md` +3 未同步）→ 当场修正；无部分实现 / 静默简化 / 清单外变更。
- **内部 advisor 代码评审 ×1**：**pass**（🔴 0 · 🟡 2 · 🔵 4）——无 🔴；修正轮 6/6 收敛（下表）。

#### 四、修正轮（评审发现逐条——同 designToken 复用）

| # | 严重级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | `index-perception.test.mjs` 328 行 > 300 咨询线 | **Fixed**：拆出 git 慢档组 → 258 行 + 新档 123 行（登记 `test/files.mjs`）；`THINCODER_TEST_FULL=1` 实跑 4/4 |
| 2 | 🟡 | `TESTING.md` 状态行陈旧（「待设计评审 + 用户批准后进入实施」） | **Fixed**：改「已实施（集成集 + 发布门三环已接线；执行结果见 §6 表）」 |
| 3 | 🔵 | runner 自检非递归（子目录漏登记盲区）+ slow 子串判据（注释误伤） | **Fixed**：递归收集 `.test.mjs` + import 形态判据（`/from "…slow.mjs"/` 或 `slow(`） |
| 4 | 🔵 | scenario-05 自建 `INDEX_IDS` 与共享夹具重复 | **Fixed**：`helpers/webview-env.mjs` 新增 `installFullIndexFixture()`；scenario-05 改用之 |
| 5 | 🔵 | scenario-03 墙钟 `flush()` 等待（flake 面） | **Fixed**：改条件轮询 `until(pred)`（scenario-02 同类改造同步） |
| 6 | 🔵 | scenario-02 裸取 regex `[1]`（文案一变即 TypeError） | **Fixed**：先 `assert.ok(match, …)` 再取值（两处） |

#### 五、实测证据（先落盘再查）

- `npm run test:integration` → **28/28 · 0 fail · 退出码 0**（日志 `thincoder-vscode/_t-int-full-3.log`；修正轮后复跑）。
- `npm test`（快层）→ **490 用例 / 483 pass / 0 fail / 7 skip(slow) · 退出码 0**（`_t-fast-2.log`）。
- `node scripts/check-doc-width.mjs` → 新增超宽 0 + 新增一致性违规 0（存量基线内 29）。
- 拆档慢档组：`THINCODER_TEST_FULL=1 node --test test/index-ignored-slow.test.mjs` → 4/4。
- 清单自检反证：临时投放未登记档 → runner 点名失败（`_t-int-manifest.log`）；档已删除。

#### 六、偏差与披露（如实——供 §6 核销）

- **超原 file 域声明的新增（披露即合规）**：`test/integration/helpers/mock-llm.mjs`（共享夹具——设计受影响表未具名，属 `test/integration/*` 域内）；
  `test/index-ignored-slow.test.mjs`（评审修正轮拆档新增）；`test/helpers/webview-env.mjs`（评审修正轮新增 `installFullIndexFixture`）；
  `docs/design/TESTING.md`（§6 执行结果对齐 + 状态行 + 变更记录——父侧随签裁定「行数注对齐」范围内 + 评审 #2 修正）。
- **明确未碰**：`docs/design/README.md` 本体（行数注落点在 TESTING.md §6；README 另含他批在飞增量）；提示词 D7 枚举（同步面——排程项）；CLI 仓文件（另一 eng-coder 域）；`test/files.mjs` 单元清单**零含集成档**（有意——集成档只登集成清单，runner 自检机械兜底）。
- **口径披露**：种子 S1/S2 以用例形式落 ③/⑤ 档（设计「种子落此」口径——非独立档）；场景 ⑥ 正常态只用「他批未暂存改动」（CLI `--only` pathspec 的 pre-staged 分支 = VSC commit 镜像缺口（技术待办）——本批不覆盖，档头注明）；场景 ⑤ 错误态 = Stop/abort 清理链（CLI「退出键 → cleanup」的本端语义映射——VSC 无 TUI 退出键，档头注明）。
- **遗留（非本批）**：`docs/design/SETTINGS.md` 对 `settings-panel` 的既有引用未随合档改指（他链文档面）；批次档本 §5 落笔前审计引用为空（本节即填实）。

**格式修补（追加——2026-09-11 · 透明度披露）**：§5 上文两条超宽行（>300 字符——「一、交付摘要」第 1 条、「六、偏差与披露」首条）已**就地折行**（折后 <300）——doc-width 机检（CLI `scripts/check-doc-width.mjs`）对该档口径的修复；语义零变更（仅换行）。手段说明：段写入通道（batch_segment）为 append-only，无法改写既有行，故以一次定点折行修补本段自身行——段内、未动他人段、未改语义，随批如实披露。

**计数更正（追加——2026-09-11 · 修正轮后实测；上文数字以本块为准）**：修正轮（评审 #3–#6 加固 / #1 拆档）改动了行数——最终实测：
`test/run-integration.mjs` **60 行**（原记 53）；7 场景档共 **1024 行**（原记 1012；scenario-02 185 / 03 234 / 05 152）；
`test/index-perception.test.mjs` **259 行**（原记 258）；`test/index-ignored-slow.test.mjs` **122 行**（原记 123）；
`test/helpers/webview-env.mjs` **90 行**（+28——新增 `installFullIndexFixture`，修正轮 #4）。VSC 设计档 §6 表已同步（run-integration 60 / 场景档 1024）。
四面实测在修正轮后复跑：`test:integration` 28/28 · 退出码 0；`npm test` 490 用例 / 483 pass / 0 fail / 7 skip；`check-doc-width` 新增超宽 0 + 新增一致性违规 0。

# §5 实施记录（eng-coder 自写——CLI 面：集成集保护墙 ②）

## 一、交付摘要（实测行数 as-of 2026-09-11）

| 件 | 行数 | 说明 |
|---|---|---|
| `test/run-integration.mjs` | 18 | 集成集入口（glob `test/integration/*.test.mjs`；不挂 slow-gate；退出码直传） |
| `test/integration/normal-mode-toolflow.test.mjs` | 115 | ① 普通模式完整工具流（三态） |
| `test/integration/engineering-chain.test.mjs` | 155 | ② 工程模式全链（三态） |
| `test/integration/subagent-lifecycle.test.mjs` | 167 | ③ 子代理生命周期（三态 + 种子 S1 容错态） |
| `test/integration/session-resume.test.mjs` | 155 | ④ 会话恢复 / 中断续跑（三态） |
| `test/integration/tui-basics.test.mjs` | 138 | ⑤ TUI 基本盘（三态） |
| `test/integration/commit-verify-gate.test.mjs` | 95 | ⑥ commit / 验证关口（三态；走真 dispatch 调用链） |
| `test/integration/config-provider-routing.test.mjs` | 98 | ⑦ 配置装载与 provider 选路（三态；伪 HOME + 真 CLI 子进程） |
| `scripts/release-check.mjs` | 85（原 62） | 发布门第三步骤 + 失败详情提取 helper 单源（含无标记回退） |
| `package.json` | 43（+1） | `test:integration` script |
| 连带文档 | — | `docs/design/RELEASE.md` · `AGENTS.md` · `docs/README.md`（发布门与三层执行面表述） |

集成集 7 档合计 923 行 / 22 用例。

## 二、实测（先落盘再查）

- `node test/run-integration.mjs` = **22/22 绿**（~3.8s，退出码 0）——AC-TL2。
- `npm run test:integration` 同绿（npm script 接线实测）。
- 快层 `npm test`：592 tests / 577 pass / 1 fail / 14 skipped——唯一 fail = `doc-consistency` T41（命中他批档 ACP-CHANNEL-FIXES / PORTABILITY / TUI-SELECTION / VSC-MIRROR-SWEEP——**批前即红，他链归其链**）。
- 全量 `set THINCODER_TUI_WRAPPED= && node test/run-full.mjs`：592 / 591 pass / 1 fail（同上一条）。置空前 `tui-stderr-capture` 的慢测 fail 系外层 TUI 包装环境的 `THINCODER_TUI_WRAPPED=1` 被继承（子进程按设计不包装）——置空后该档 6/6 绿，**非本批引入**。
- 发布门 `npm run release:check`：lint（302 文件 OK）→ test:full 17s（1 fail 他链）→ 中止（集成步单独实测绿）；改后失败详情提取照常（`✖ test:full FAILED` + 详情段实测）。
- 零混入实证：`fs.globSync("test/*.test.mjs")` 命中集成档 0；`test/integration/` 内 `slow(` 零命中。
- 宽度/一致性：`node scripts/check-doc-width.mjs` 我方改动文件零新增（RELEASE.md 一度 317 字符超宽——本轮拆行修掉；其余命中全为他批档）。

## 三、AC 透明表（逐条回指）

| AC | 状态 | 证据 |
|---|---|---|
| AC-TL1 | 文档面（eng-designer 已落——本次未触碰） | 需求档 F6–F14 / N7–N9 固定子串在位 |
| AC-TL2 | ✓ | `node test/run-integration.mjs` 退出码 0（22/22） |
| AC-TL3 | VSC 面（他执行者） | — |
| AC-TL4 | ✓ | ① 档在场 + 正常/边界/错误三态用例 |
| AC-TL5 | ✓ | 单层 glob 未变 + 集成档零 `slow(`（机检见上） |
| AC-TL6 | CLI 半 ✓ | release-check 第三步骤 + `test:integration` script；全链实测跑到集成步（他链 fail 阻断后续步骤） |
| AC-TL7 / TL8 | 不属本次（扫①排程在集成集全绿后） | — |
| AC-TL9 | 文档面（eng-designer） | — |
| AC-TL10 | 证据齐（父侧核验） | 快层结果 + 宽度/一致性差集见上 |
| AC-TL11 | VSC 面 | — |
| AC-TL12 | CLI 半（S1）；S2 归 VSC（设计 §5.8） | ③ 档含 S1 双判据（正常注入 + 错误轮不误杀） |

## 四、审计与代码评审（轮次与终态）

- **内部偏离审计（explore，1 轮）**＝ DEVIATIONS 2 行：🔵#1 AC-TL6「实测全链可跑」缺端到端证据（已补——release-check 实跑记录见上）；🟡#2 §4.5「禁止同断言双持」——⑥ 三态与既有单测同断言面最重（设计 §5.6 表本身规定该三态，非擅改）。
- **fix round 1（审计处置）**：⑥ 改走真 dispatch 调用链（agent 发起 → 工具执行 → 用户批准面），断言面加层；⑤ 保持（key 驱动武装路径 vs 单测直调 cleanup——审计判定为增量）；① 审计判定为增量（真循环 + 完成守卫顶回）。③ mock 改内容键控（消除脚本序号错位风险）。
- **内部代码评审（advisor type=code，1 轮）**：**VERDICT pass**（🔴 0 · 🔵 2 · unverified 1 · out-of-scope 注 2）。
  - 🔵#1 设计档 §8.1 仍为"预计增量"口径（实测 runner 18 行 vs 预计 ~40）→ **Deferred**（§8.1 属设计档写权 = eng-designer；实测数字已在本 §5 登记）。
  - 🔵#2 种子归入与 CLI 落点未登记 + AC-TL12 未按端限定 → **Deferred**（同写权理由；CLI 侧 S1 落点已在 §5 与"偏差披露"登记）。
  - unverified（AC-TL2/6/10 运行面——评审只读未复跑）→ **Deferred 至父侧终验轮**（本执行者侧证据与可复跑命令见"实测"节）。
  - out-of-scope 注 2 条（release-check 无标记回退 + 失败形摘要行；③ mock 对齐）→ **Fixed**（本轮落地：无 `failing tests:` 标记回退输出尾 40 行；失败步骤打 `✖ … FAILED`；③ 改内容键控 mock）。改动后复跑：集成集 22/22 绿、release-check 失败路径实测通过。
- **终态**：clean（审计 2 项全处置；评审 pass 的 🔵/unverified 三行均已裁决并登记）。

## 五、偏差披露（如实）

1. **S2（GH#7）无 CLI 载体**：webview DOM 渲染断言在 CLI 侧不存在（设计 §5.8 归 ⑤ VSC 实例）——CLI 面只落 S1；AC-TL12 的 S2 半归 VSC 执行者。
2. **④ 驱动缝**：正常/边界态经 `_setSessionsDirForTest` 隔离 sessions 目录（真 fs + 真槽文件 + 真 session 模块），未起 HOME 重定向子进程；错误态走真子进程 + HOME 重定向。设计 §4.4 明许 CLI 侧模块直驱。
3. **`test/files.mjs` 未涉及**：CLI 仓无测试登记档（登记制是 VSC 侧产物——设计 §9 #3）；集成档按单层 glob 承载，无需登记（零混入已实测）。
4. **实测数字 vs 设计估计**：`test/integration/*` 实为 7 档 923 行（设计 §8.1 估 ~600–900）；runner 18 行（估 ~40）；release-check 85 行（估 +~15，实为 +23）。设计档 §8.1 落定为 eng-designer 写权——已随评审 🔵#1 登记为收口项。
5. **他链红**：快层 / 全量各 1 fail = `doc-consistency` T41（他批档 §/计数违规）——批前即红，未处置（不属本批）。

# §5 实施记录（eng-coder 自写——CLI 面：扫① 首执行清单 · TL-5）

**执行者**：CLI 面 eng-coder（第三实例；保护墙 ② 已全绿后入场——设计档 §7 次序硬约束满足）。**状态**：执行中（本块 = 先落逐条清单；结果回填见本段后续追加块）。
**依据**：设计档 `docs/design/TESTING.md` §7（§7.1/§7.2/§7.3/§7.4）+ §8.1.1 逐行表；批次档 §2 TL-5；任务书 = 本批设计 token（§4 已签发）。

## 一、逐条清单（删除清单制——先出清单后动手；差额 = 清单数）

### A. 退役（9 档 = §7.1 8 B 类 + §7.4 域外补录 1；合计 ~880 行）

| # | 档 | 行数 as-of | 处置 | 断言去向 |
|---|---|---|---|---|
| A1 | `test/activity-debloat.test.mjs` | 202 | 退（删除） | 事件残迹（普查 B 类）——无迁移；`queued-stop`/`subagent-tail-merge` 等活档不动 |
| A2 | `test/advisor-description.test.mjs` | 19 | 退 | 同上——文案去数字化已由 `advisor-provider` 等覆盖 |
| A3 | `test/advisor-thinking-picker.test.mjs` | 114 | 退 | 同上——picker 行为由 `model-ref`/`tui-selection-surfaces` 活档覆盖 |
| A4 | `test/deepseek-v41-specs.test.mjs` | 86 | 退 | 同上——预设值由 `config-merge` AC-3 锚住 |
| A5 | `test/distill.test.mjs` | 88 | 退 | 同上——distill 机制调用点全活、断言为开发期自证 |
| A6 | `test/mouse-sane-gate.test.mjs` | 82 | 退 | 同上——sane-gate 行为由 TUI 活档覆盖 |
| A7 | `test/tool-args.test.mjs` | 22 | 退 | 同上 |
| A8 | `test/websearch-config.test.mjs` | 110 | 退 | 同上——死键移除为一次性迁移锁 |
| A9 | `test/integration-provider.mjs` | 157 | 退（删除） | §7.4 域外载体（名式外——零执行面 + 零活引用）；`normalizeUsageCache` 独有直测 → 恢复路径 = 设计档 §3.4 演进入口（不随本批改写） |

- **`test/files.mjs` 注销项核验**：CLI 仓**无**测试登记档（设计档 §9 #3「CLI 无登记制（沿 glob 惯例）」；`**/files.mjs` 全仓零命中）——任务书本项在 CLI 面无对应动作，如实登记；VSC 面登记差分 = 他执行者域（其 §5 已落 `config-pool` 不登记差分）。
- 连带披露（文档面悬空引用——非本执行者写域，供父侧排程）：`docs/design/TUI.md:470`（activity-debloat 档名指针）· `docs/design/ACP-CLIENT.md` AC7 行（四档 `git diff --stat` as-of 断言）· 批次档 `ACP-CHANNEL-FIXES`/`SUBAGENT-TAIL` 相关行（历史 as-of，不再成立）。

### B. 并档（3 组——§7.2 #1–#3；#4 VSC `settings-panel`→`config-pool` 不在本执行者域）

| # | 源档 | 目标档 | 行数 as-of | 处置 | 断言去向 |
|---|---|---|---|---|---|
| B1 | `test/config.test.mjs` | `test/config-merge.test.mjs` | 45 → 176 | 断言并入 → 删源 | 2 用例 / 5 断言 verbatim 迁入（+ 局部 helper 复制）；目标 → ~221 行 |
| B2 | `test/prompts-normal-audit.test.mjs` | `test/prompts-dual-source.test.mjs` | 72 → 333 | 同上 | T-NA1/T-NA2（12 断言）verbatim 迁入；T-NA3 负向 → C2 收归接收档；T-NA4（邻档重复）→ 删（见 C3）。**并档后实测 ~340 行（非设计估 ~405——差额 = T-NA3/NA4 未整档并入，去向改进 C2/C3）**；拆分预审见「三」 |
| B3 | `test/subagent-id-counter.test.mjs` | `test/subagent-scheduler.test.mjs` | 49 → 135 | 同上 | 2 用例 / 7 断言 verbatim 迁入 + 夹具/import；目标注释同步改指（:89-92 现行指针在并档后悬空）+ → ~184 行 |

### C. 削段（§7.3 三类——逐条判：真契约留 / 重复自明删）

#### C1 点名档（CLI 本仓点名 = `turn-across-segments` / `verify-redesign` / `eng-designer-role`；`index-perception` 等为 VSC-only）

| 档 | 判 | 明细 |
|---|---|---|
| `test/turn-across-segments.test.mjs` · T8 | **删 2 留 7** | 删：「状态行字段不再取段内值」+「旧段内载荷字面不得复现」（负向旧形锚——新型由 T6/T7 行为覆盖）；留：段内帽循环条件/抛点/循环内 turnFrame 接线/发射行读帧值/复位点唯一 + !resume 块内/approval 发射行（**CLI 无 VSC 的 T9/T10 行为档——无行为覆盖的接线锚按真契约留**，不照搬 VSC 全删） |
| `test/verify-redesign.test.mjs` · T-V9 | **留 2 删 4** | 删：`run syntax checks and tests`/`test failures`/`verify reported test failures`/`tests are still failing` 四旧句负向锚（旧语义早退役；行为由 T-V1~V6 + 集成 ① 覆盖）；留：`declaring the outcome`/`verify was not passed` 正句 |
| 同上 · T-V10 | **留 2 删 6** | 删：3 旧语义串 ×2 档（→ C2 收归接收档）；留：`verification.status` 正向参数名锚 ×2 |
| `test/eng-designer-role.test.mjs` | **删 11** | T32：`system.md 未复活`（→ C2 归并退役文件族）；T40：`父代理更新设计文档`（→ C2 收归）· 负向正则「勾销未见进设计档」（**删——重复**：:303-:304 正向锚已锁「勾销落批次档 §6 / 不进设计档」）· `ARCHITECT`/`You design and delegate`/`你是架构师` ×2 档（→ C2 归并身份句族）· `过渡期主 agent 代行`/`主 agent·产品经理产物`（→ C2 收归）；全部正向路由锚（§2.2/§2.5/§2.6/§2.8/§2.15 + README/AGENTS/persona）**留** |

#### C2 防回潮静态锚（收归接收档 `test/doc-consistency.test.mjs`；原档删段）

> 类定义（执行轮操作化——逐条可核）：对**退役态**（退役文件 / 旧句 / 旧节）的零残留断言，目标为文档（`docs/**`）或提示词（`src/prompts/**`、`docs/design/prompts/**`）。

| # | 来源档 | 收归锚（→ 接收档 T75/T76） |
|---|---|---|
| C2-1 | `prompts-async-guidance` | 退役提示词文件 10 名未复活（含 `system.md`——归并 eng-designer T32 同名断言） |
| C2-2 | 同上 | `ESCALATE.md` 旧句 ×2（同步旧路径 / 同步语义零回归）；`AGENT-LOOP.md` §14.2 切片内 `显式同步保留`（段落作用域——全档扫描假阳：历史引用段合法存在） |
| C2-3 | `prompts-dual-source` | 旧三值句 ×6 档 / 旧相邻形态 ×2 / 旧源 DEAD 10 串 ×4 档 / 旧勾销句 ×2 / 旧身份句族（ARCHITECT 等 ×2 + 旧交付物句 / 主会话即 designer / coder 旧身份 4 串 ×2 + architect 裸词）/ `dn 旧路由块`（与 DEAD 归并） |
| C2-4 | `prompts-normal-audit` | T-NA3 `§21` 悬空指针 ×2（随并档收归——原档随 B2 删源） |
| C2-5 | `verify-redesign` | T-V10 三旧语义串 ×2 档 |
| C2-6 | `eng-designer-role` | `ENGINEERING-MODE.md` §2.8 切片内旧路由句 / `docs/README.md` 过期限定句 / `AGENTS.md` 旧归属句（+ C2-3 身份句族归并） |
| C2-7 | `ledger` | T95 旧口径句 `状态推进 = eng-designer` ×7 档（含 VSC 侧 3 档路径——沿原断言形态） |

- **判定保留（附理由，供核销）**：`prompts-async-guidance` 的 sync 引导负向族（现行引导契约的背面——非退役物锁）· `portability-advisor-context:117` `check-doc-width` 零指涉（现行通用化契约）· `prompts-dual-source` 维护者注 / 泛化副本零残留（现行内容卫生/去重契约）· 其余源码面负向锚（class 2 域——逐条判留，不在本收归）——收归后字符串**零丢失**（逐字进接收档 T76）。
- 接收档增量预估：+2 用例（T75 文件族 / T76 串族，表驱动）≈ +55–65 行 → 235 → ~295 行（守 300 咨询线内）。

#### C3 邻档重复（去重——保留承载方）

| 项 | 处置 |
|---|---|
| `prompts-normal-audit` T-NA4（旧三值句/旧路由块 ×2 档） | **删**（重复——承载方 = C2 收归接收档 T76；原档存在性检查随 B2 并档自指化删） |
| `prompts-dual-source` T-CL4 DEAD ×4 档 vs `prompts-async-guidance:184` vs T-NA4 | **归并**（三处同族——单一承载 = 接收档 T76） |
| `activity-flow` ↔ `async-visibility` 等 | **VSC-only**（设计档 §8.1.1 跨仓归属注记）——CLI 面零对位 |

### 二、对账口径

- 断言数：并档组守「不减」（verbatim——B1 +5 / B2 +12 / B3 +7）；削段组按删除清单核销（C1 删 2+4+6+11；C2 迁移（原档删、接收档承接——逐串零丢失）；C3 去重）。
- 行数前后对表 + 接收档实测增量 ——随执行结果回填。
- 真跑证据（先落盘再查）：定向各档 + 快层 `node test/run-fast.mjs`（基线 = 保护墙 ② 记录：592 用例 / 577 pass / 1 fail（他批 doc-consistency T41 存量红）/ 14 skip）。

### 三、拆分预审（B2 特例——设计档 §8.1.1 要求）

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | 不拆（单档 ~340 行） | 纯文件读取型锚族、同质；无 slow/fast 执行层分界（VSC `index-perception` 拆档判据 = git 慢档组，本档无）；拆 = 前导/双源配对夹具复制（~25 行重复）+ 断言族割裂；300 = 咨询线（AGENTS.md），在树先例（`prompts-async-guidance` 419 / `advisor-chain-guards` 498）；守 500 硬限 | **选定** |
| 2 | 拆两档（第 2/9 批 engineering 面 + 第 15/16/23 批 common/角色面） | 无语义分界（三代锚同属"双源提示词锚"）；前导重复 + 配对读取重复 | 否决 |

**执行顺序**：A 退 → B 并 → C 削/收归 → 清点 → 对账 → 内部审计/评审。

### 四、执行结果与对账（回填——删除清单制核销；2026-09-11）

**状态：实施完成、审计处置完毕；代码评审轮见本段后续追加块。**（本块 = 结果 + 对账 + 偏差；审计发现见「五」）

#### 4.1 逐条核销（对照「一、逐条清单」）

**A 退役（9/9 落）**：8 B 类 + `integration-provider.mjs`（157 行）全删——`test/scripts/src` 全仓 grep 零活引用（仅余两处悬挂注释，已清——见 4.4-2）；连带披露项（`docs/design/TUI.md:470` · `ACP-CLIENT.md` AC7 行 · 两批档史面）维持披露、未改（非本执行者写域）。
**`test/files.mjs` 注销项核验**：CLI 仓无登记档（`**/files.mjs` 零命中 + 设计档 §9 #3）——无对应动作（结论即处置）。

**B 并档（3/3 落）**：

| 组 | 源档删 | 迁入实测 | 目标档实测（估） |
|---|---|---|---|
| B1 | `config.test.mjs` ✓ | +2 用例 / +5 断言（verbatim） | `config-merge` 176→216 行（估 ~221 ✓ 线内） |
| B2 | `prompts-normal-audit.test.mjs` ✓ | +T-NA1/NA2（12 断言）；T-NA3→接收档 T76；T-NA4 删（重复） | `prompts-dual-source` 333→346 行（设计估 ~405——差额 = T-NA3/NA4 未整档并入，去向记 C2/C3；拆分预审选定「不拆」） |
| B3 | `subagent-id-counter.test.mjs` ✓ | +2 用例 / +7 断言 + 夹具/import | `subagent-scheduler` 135→182 行（估 ~184 ✓）；指针改指 2 处（本节 :94-97 + `batch-doc-gate` 头注） |

**C 削段（逐条判结果）**：

| 项 | 落点 | 实测 |
|---|---|---|
| C1-1 `turn-across-segments` T8 | 删 2（状态行旧取值 / 旧载荷字面两负向锚——新型由 T6/T7 行为覆盖）/ 留 7 接线·契约锚 | 136→133 行 · 断言 24→22 |
| C1-2 `verify-redesign` T-V9 | 6→2（留 2 正句）；删 4 旧句负向锚 | 154→152 行 · 32→25（两案合） |
| C1-3 同上 T-V10 | 8→2（留 `verification.status` ×2；3 旧语义串 ×2 档 → T76） | — |
| C1-4 `eng-designer-role` | 删 11（T32 一 + T40 十——旧路由/身份句/过期限定/旧归属 + 勾销正则（重复）删） | 346→341 行 · 98→90 |
| C2 防回潮收归（6 来源档） | 原档删段 → 接收档 T75（退役文件 10 名）+ T76（16 条表 / 95 项串×档检查；2 条段落切片防历史引用假阳） | 接收档 236→297 行（≤300 线内） |
| C3 邻档重复 | T-NA4 删（承载方 = T76）· DEAD 三处归并单承载 · VSC-only 项零对位（复述） | — |

#### 4.2 断言去向与零丢失

- 并档组守「verbatim 不减」：+5 / +7 / +12 逐条迁入（审读可对）。
- 收归零丢失：35 收归串 + 10 退役文件名逐字入接收档；原档对应负向断言删除、grep 零残留。
- 削段组按清单核销（差额 = 清单条目；「真契约留」项见清单 C1/C2 判定表）。

#### 4.3 实测证据（先落盘再查）

- 定向 12 档实跑：**134 tests / 132 pass / 0 fail / 2 skip（slow）**（日志 `thincoder/_tl-touched.log`）。
- 快层 `node test/run-fast.mjs` ×2：**562 tests / 546 pass / 1 fail / 15 skip**——唯一 fail = `doc-consistency T41①`（批前存量红：他批档 V1 违规——ACP-CHANNEL-FIXES / PORTABILITY / TUI-SELECTION / VSC-MIRROR-SWEEP；**本批新增 0**）；慢门 0 命中（首跑 6 条 = 负载型 flake——隔离复跑 21/21 绿复核，`_tl-gate.log`；日志 `_tl-fast.log` / `_tl-fast2.log`）。
- `node --test test/doc-consistency.test.mjs`：**T75/T76 绿**（11/10/1——唯一红同 T41①）。
- `node scripts/check-doc-width.mjs`：本批改动档新增超宽 0 / 新增一致性违规 0（12 条新增全为他链批档；本批 `docs/batches/2026-09-11-TEST-LIFECYCLE.md` 零新增）。
- **AC-TL8 机验**：三点名档原锚串 grep **零残留**（3+7+7 串）；扫描器族在岗（执行面未删）。
- 删除档名全仓 grep：仅文档记史面（非执行面）——无破链。

#### 4.4 偏差与披露（如实）

1. **他链并发（重要）**：执行期间同工作区 peer instance 并发改写 `test/ledger.test.mjs`（重写为 `pr()`/in-process 形态——214→175 行）+ `scripts/check-ledger.mjs` + prompts + 若干档；本执行者的 ledger 单断言移除**仍落地**（其版本保留本注释）；`prompts-async-guidance` 基线→本编辑间另有 +4 行/+1 断言漂移（归并发链）。**对账以逐条清单为准**；绝对计数差额归并发链（§2.19 他链在飞口径）。
2. **超原清单的连带改动（披露即合规）**：`test/batch-doc-gate.test.mjs` 头注改指（并档后指针）；`test/advisor-provider.test.mjs` + `test/tui-selection-surfaces.test.mjs` 两处悬挂注改指（被删档名残留——审计 🔵 处置；注释级零语义）。
3. **接收档行数**：首版 317 行（越 300 咨询线、超清单自估 ~295——审计 🟡 点名）→ 压缩至 297（表行合并 / 注释压缩 / `hitsOf` 判据谓词提取；**断言面零减**，反证改为真谓词测试）。
4. **`normalizeUsageCache` 覆盖缺口**：`integration-provider.mjs` 独有直测随退删除——恢复路径 = 设计档 §3.4 演进入口（§7.4 附注——不随本批改写）。
5. **文档面悬挂引用（未改——非本执行者写域）**：`docs/design/TUI.md:470`（activity-debloat 档名）· `docs/design/ACP-CLIENT.md` AC7 行（四档 as-of 断言）· 批次档 ACP-CHANNEL-FIXES / SUBAGENT-TAIL 相关行——历史 as-of，建议父侧排程（eng-designer）处理或判豁免。
6. **行数口径**：本段行数 = 换行符计数（与设计档 as-of 口径一致）；`ledger.test.mjs` 的 214 基线含他链改写前形态（见 4.4-1）。

#### 五、内部审计（explore 子代理 ×1——偏离审计；发现与处置）

**审计轮次 ×1（本会话内，对照设计档 §7 + 批次档 §2 TL-5）**：发现 **2🟡 + 2🔵（无 🔴）**——逐条处置如下（全部就地修复，无挂账）：

| # | 级别 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 批次档 §5 执行前只有清单、无结果/对账/披露（D1） | **Fixed**：本「四、执行结果与对账」块回填（逐条核销 + 断言去向 + 实测证据 + 偏差披露） |
| 2 | 🟡 | `test/doc-consistency.test.mjs` 实测 317 行——越 300 咨询线、超清单自估 ~295，且无预审/披露（D2） | **Fixed**：压缩至 **297 行**（表行合并 / 注释压缩 / `hitsOf` 判据谓词提取——断言面零减） |
| 3 | 🔵 | 两处悬挂注释仍指名已退役档（`advisor-provider:8` · `tui-selection-surfaces:4,27`）（D3） | **Fixed**：一并改指（注释级；超清单改动，已在 4.4-2 披露） |
| 4 | 🔵 | 收归反证为自证式（`String.includes` 恒真——不构成谓词有效证据）（D4） | **Fixed**：反证改为对**同一判据谓词**（`hitsOf`）跑含串样本（`deepEqual([probe])`）——谓词失效即红 |

**审计正面核验摘要（摘）**：A 9 退全不在盘 ✓ · B 三组并档注与迁入断言数逐点对上（+5/+7/+12）✓ · C 三档削段实测断言数与清单一致、CLI 无 T58 遗漏（VSC 对位）✓ · D 收归串当前树逐条真值成立（DEAD 10 串现居 `common.md`、切片两条目 `§2.8`/`§14.2` 各自历史引用在切片外）✓ · E 无越权（10 档全落 §4 批准范围）、`run-fast.mjs` glob 未动、无破链 ✓ · 他链并发未回退本执行者改动 ✓。
**审计未能核验项**（其侧无执行工具）：T75/T76 实跑、快层/宽度实跑——三项已由本履行者补跑（结果见 4.3）；其判定基础为静态核验，与实跑结论一致。

#### 六、内部代码评审与修正轮（终态）

**内部代码评审（advisor type=code ×1）**：评审对象 = 本执行交付 10 档 + 设计档 §7 / 批次档 §5；**VERDICT: pass**（0 🔴 · 0 🟡 · 4 🔵 + 2 条范围外注记）。4 条 🔵 逐条处置（修正轮——同 designToken 复用）：

| # | 发现 | 处置 |
|---|---|---|
| 1 | `prompts-async-guidance.test.mjs:6` 头注仍写「退役态与全仓零引用也在此对账」——与收归后现状不符（存在检查已迁 T75） | **Fixed**：头注改指接收档 T75（与削段注一致；纯注释） |
| 2 | T75 仅扫 `src/prompts/` 单面；双源镜像面 `docs/design/prompts/` 未入扫（收归后 T75 为防回潮唯一承载） | **Fixed**：T75 双面循环（10 名 × 2 目录 = 20 检查） |
| 3 | T76 反证只覆盖 `hitsOf` 字符串分支；2 条 RegExp 条目无活性探针（正则写坏即静默假阴） | **Fixed**：补 RegExp 分支探针（`hitsOf("…architect…", [/architect/i])`） |
| 4 | 三档行数 346 / 419 / 341 越 300 咨询线（存量/预审在案） | **受记**（R3——不重提本批判定；后续触碰批再审） |

**范围外注记 ×2（无严重级）**：设计档 §7.3/§8.1.1 的 CLI 点名档切点编号 T8/T11、T58 与 CLI 实际用例编号（T1–T8 / T30–T40）不符（T11/T58 只在 VSC 对位档）——执行轮按逐条清单处置、审计记录在案；`ledger.test.mjs` 被他链并发改写——现态核符（本批删段注释与 T75/T76 收归均落地）。
**披露**：评审轮 3 条过程类引用经宿主机械校验不符（`persona-engineering.md:22` / `setup.mjs:280` / `discipline-normal.md:121`——均非发现表引用、不支撑结论）——如实登记。

**终态：clean**。修正轮后复跑：`node --test test/doc-consistency.test.mjs test/prompts-async-guidance.test.mjs` = 53 tests / 52 pass / 1 fail（T41① 批前存量红——同上）；接收档终版 **300 行（≤300 咨询线）**；快层 `node test/run-fast.mjs` 三跑 = **562 tests / 546 pass / 1 fail（T41① 同款）/ 15 skip · 慢门 0 命中**（`_tl-fast3.log`）。
**未 commit**（红线）；未发起用户级评审（设计评审 = 父侧链）；§5 本段自写（append-only，含清单/对账/偏差/轮次/终态）。

## §6 验证与收口（父代理自写）

**2026-09-11 18:05 · 父侧收口**

- **三面交付核验**：CLI 建（#152）· VSC 面（#154）· CLI 扫①（#153）——三份 §5 俱在；抽核：集成集 CLI **22/22**（父侧实跑）· VSC **28/28**（coder 实测 + 文件面核）；扫①：汰 9 档缺席 ✓ · 3 并收编 ✓ · T75/T76 防回潮锚在位 ✓。
- **L2 全量（父侧实跑——唯一全量验收点）**：`npm run release:check` = lint ✓ → test:full **561/562**（唯一红 = `doc-consistency T41①`——他链在飞档 V1/V2/V3 新增违规，非本批面）→ 集成步 **22/22** ✓（父侧单跑）。`THINCODER_TUI_WRAPPED` 置空后 tui-stderr-capture 转绿（环境继承——已知，首次跑 560/562 双红）。
- **AC 核销**：AC-TL1–TL12 按三面 §5 逐条过（CLI 半 / VSC 半合齐；S1/S2 分端落实；AC-TL10 本行即证据）。
- **核销同步清单**（D7）：状态行——`docs/TODO.md`「测试生命周期与集成集」需求池条目 → **已核销并移入归档档**（本批交付）+ 组计数 5→4（父侧落笔）；计数——T/R 清单与 §2 一致；指针——需求 `TESTING.md` §2 / 设计档可达；变更记录——设计档在档。
- **遗留移交**：① `doc-consistency T41①` 归其链（修正轮在飞——群 A/群 B/活动区修正落地后复扫）② VSC `docs/design/SETTINGS.md` 对 `settings-panel` 的既有引用未随合档改指（文档层小活）③ `docs/design/TUI.md:470` / `ACP-CLIENT.md` AC7 行悬挂注释（#153 披露——父侧排程）④ `normalizeUsageCache` 独有直测随退删除——恢复路径 = §3.4 演进入口。
- **令牌**：链终——consume-design 已消费（本批**全链闭环 ✓**）。
- **发布面**：`test:integration` script + VSC `vscode:prepublish` 三环 + CLI `prepublishOnly` 已接线——**发布门就绪**；发布动作本身 = 挂起（用户 17:16 裁定）。
