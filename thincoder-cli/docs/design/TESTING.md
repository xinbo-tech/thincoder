# 测试基建（TESTING）

> 板块：测试基建——slow 门机制、测试分层纪律（L0/L1/L2）、测试库存治理、测试生命周期与集成集（§3 起——2026-09-11 TEST-LIFECYCLE 批）。
> 权威源：`test/slow.mjs` + `test/slow-gate.mjs` + `test/run-fast.mjs` + `test/run-full.mjs`（分层执行入口）+ `test/run-integration.mjs`（集成集执行入口），`package.json` scripts。
> 关联：本文档 §1 是分层纪律（L0/L1/L2）的权威叙述（原 AGENT-LOOP §18.7 已迁此）；工程模式实现侧分级正文 = `src/prompts/persona-eng-coder.md` + `discipline-engineering.md`（模型侧实际拿到的分级正文——旧 engineering-sub.md 已随 PROMPT-SYSTEM 施工①退役）；仓库根 `AGENTS.md`（本项目的两分层测试政策与 smoke 说明）；VSC 对位档 = `TESTING（VSC 仓）`（本批新建——语义同源、各端原文自持）。
> 2026-09-14 扩入 CLI 自动验证面（E2E-HARNESS 批——§12；需求依据 = `../requirements/TESTING.md` §6；来源 = 用户 2026-09-14 立项裁定）。
> 状态：**机制已落地并维持当前态**。分层纪律（L0/L1/L2）+ slow 门机制仍生效；2026-09-07 存量测试库存按"按需加"政策清零，测试随机制需要按需补（详见 §2）；2026-09-11 扩展测试生命周期与集成集（§3 起——设计已落，实施随本批）；2026-09-14 扩入 CLI 自动验证面（§12——设计就绪；实施随批）。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/TESTING.md`——本档保留设计与测试细节。

## 1. 分层纪律（L0 / L1 / L2）与 slow 门

### 1.1 分层纪律（L0 / L1 / L2）

分层纪律把一次代码改动的验证拆成三级，级级向上收口，避免"随便改一点就跑上千个测试"：

| 层 | 时机 | 内容 | 谁跑 |
|---|---|---|---|
| **L0+** | 首次实现 | 语法检查 + 定向相关测试（秒级） | eng-coder |
| **L1** | 升级路径 | 快层 `npm test`（slow 层跳过） | eng-coder（仅 L0 空映射/触主干时显式升级到本层） |
| **L2** | 链终态 | `test:full` 全量（含 slow 真设备测试） | 父侧收口恰一次/端 |
| **L0** | 每个修正轮 | 改动即时验证 + verify 声明 | eng-coder |

- **首次实现 = L0+，不做全量**（D-T3 修订 L1→L0+）——`do NOT run the full suite`。报告义务句逐字："not full-suite verified — the parent-side L2 run is the only full-suite point."
- **L1 = `npm test` 快层**：无链上阶段默认跑；仅当 L0 空映射（mcp/prompts/context/session 无测试文件）或改动触主干/main 文件时，显式升级到 L1。**本链永不跑全量**。
- **L2 = `test:full` 全量**：链末父侧终验恰一次/端，不在 eng-coder 链内跑。
- verify 三层都只收模型的 `verification.status` 声明（passed / skipped+reason），不代跑任何测试（verify 语义见 VERIFY-REDESIGN.md）。

### 1.2 slow 门机制（分层执行）

`test/slow.mjs` 提供 `slow(name, fn)`——需要真实 fs / git 子进程 / 定时器 / 网络的测试（单用例 >500ms）用它包装：

- **默认 `npm test`（快层）自动 skip**（runner 输出可见 `↯ skipped`，不隐身）；
- **`npm run test:full`**（或 env `THINCODER_TEST_FULL=1`）跑全量——发版 / CI / 排查时用；
- 快层与全量共用同一套断言文件（不改名不挪目录），零漂移。

**为什么不用目录分层**：`test/**` 是唯一约定入口；同文件改名 + 同名导出门控，让 `node --test test/xxx.test.mjs` 单文件调试跑法（高频）与全量永远走同一断言。阈值依据实测：>500ms 的测试约占全量 CPU 的 95%，而 <5ms 的过半测试合计仅 376ms——**数量不是成本，重 IO 才是**。

#### 防漏拦截（D-T6）

快层 = `test/run-fast.mjs`（`npm test` 入口），并挂 `test/slow-gate.mjs` reporter：

- 跑完后机械检查「未标 slow 而超过拦截阈值」的用例，发现即**逐条点名 + 非零退出**（硬红防腐化——腐化根因就是无人拦截）；
- **拦截阈值 800ms > 归册阈值 500ms**（阈值缓冲——机器负载抖动不触红，只有真·漏网慢测才红）；env `THINCODER_SLOW_GATE_MS` 覆盖（供机制自验）；
- 注册表比对省略（恒等式）：快层里 slow() 用例全 skip，「test:pass 且超阈」⇔「未归册」；
- `run-fast.mjs` 并发 6（`--test-concurrency=6`——4 核机实测快层 29s → ~17-20s，勿再调高：c8 会把 400-500ms 中位带通胀过拦截线打地鼠式误红）；test:full 不动（默认调度）。

**归册补登（2026-09-11 第 20 批）**：`test/eng-designer-role.test.mjs` T30（角色注册五处——真实 `prepareRun`
装配）快层慢门实测 818.5ms > 800ms 拦截线 → 自 `test(` 改 `slow(` 归册（归册不是删除——快层 skip、
全量跑）。归册判据 = 慢门实测点名（不预判；同档其余用例若被后续快层点名，同法归册）。
**AC-A3**（机验）：该用例经 `slow(` 注册（源码断言）；快层 skip 可见、全量执行通过；`npm test` 零超阈拦截。

**分层入口**：

| 脚本 | 入口 | 用途 |
|---|---|---|
| `npm test` | `test/run-fast.mjs` | 快层（slow 跳过 + 防漏拦截） |
| `npm run test:full` | `test/run-full.mjs` | 全量（设 `THINCODER_TEST_FULL=1` 后 node --test） |
| 手工 | `node --test test/xxx.test.mjs` | 单文件调试（不经过 run-fast，无拦截） |

## 2. 测试库存治理（按需加）

2026-09-07 存量测试库存清零（94 个 .test.mjs 文件删除——一次性迁移锁/防回潮元测试/同锚多断等低信噪比存量整批清掉），转入**按需加**政策：

- **测试不强制配给每次改动**；机制需要时（新增/重构有明确行为契约要锁）再补用例；
- 补的测试若 >500ms 重 IO，用 `slow()` 归册，进 test:full 层（归册不是删除）；
- 红线：拆分/迁移类重构保证**断言数不减**（verbatim 迁移保真，见 system.md Module Split Policy 锚）；存量清理轮走**删除清单制**（逐条列明 + 父侧核销，差额 = 清单数，不再是"不减"）。

当前仓库的测试 = 按需补的少量用例 + 真端点 smoke，跑法见 `AGENTS.md` Testing policy：

- 快层 / 全量脚本照常可用（机制不动）；冒烟测试 `test/smoke-qwen-thinking.mjs` 不在任何一层，用 `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs` 手工跑（花真 API 钱）。

## 3. 测试生命周期（三层来源——机制）

> 需求依据：`../requirements/TESTING.md` §2（F6–F11）· §3（N7–N9）。本节 = 判据与接线细节。
> 术语辨异：**来源层**（①②③——测试的出身与寿命）与**验证层级**（L0/L0+/L1/L2——一次改动何时跑什么）是两个正交轴，勿混。

### 3.1 三层来源与寿命

| 层 | 落地物 | 来源 | 寿命 / 去处 |
|---|---|---|---|
| ① 单元（开发期） | `test/*.test.mjs` 顶层各档 | 每批开发过程（批次档 §2 列着） | 批次收口逐条处置：**默认退役**（删除）；业务可观察且未覆盖 → 转②③ |
| ② 集成·业务 | `test/integration/` 常驻档 | 业务场景设立（开发期不产） | 常驻 + 发布门（§4.3） |
| ③ 集成·生产 | `test/integration/` 常驻档 | 实际运行常出的问题补入 | 常驻（越用越准） |

- **退役台账零新增**：① 档的来源票据 = 批次档 §2 文件表 / §5 交付表 + VSC `test/files.mjs` 登记差分——处置行直接引用，不建新台账。
- **防误退三判定**（扫①执行时逐档判——批次档 `../batches/2026-09-11-TEST-LIFECYCLE.md` §1 普查口径）：镜像≠冗余（两仓无跨仓 import）· 归档≠机制死（调用点全活）· `doc-consistency` = `check-doc-width` 唯一执行面（删 = 文档门停跑）。

### 3.2 处置判据（退 / 转四问）

收口处置判定（§6 行 ①半 的判据次序）：

1. 业务可观察？（结果 = 用户可感知行为/产物——非内部结构形状）
2. ②③ 未覆盖？（同语义场景不在集成集）
3. 可稳定驱动？（脚本化 provider / 真实临时环境——不靠人工）
4. 以上全满足 → **转**（改写成业务语气场景——断言只写业务可观察结果、不保留事故形态）；否则 → **退**（删除）。

### 3.3 §6 处置行契约（双半）与同步面

「测试处置」行落在批次档 §6 核销同步清单（槽位枚举权威 = 需求档 `ENGINEERING-MODE.md` §1.12）。行内容两半：

| 半 | 内容 | 对账面 |
|---|---|---|
| ① 本批单元档处置 | 逐条：`退 <档名>` / `转 <档名> → 集成场景 <场景名>`；本批零单元档 → `本批零单元档——无处置` | 批次档 §2/§5 清单（逐条可对） |
| ② 集成影响核 | `新增 <场景>` / `修订 <场景>` / `无` | 主 agent 评估结论（F10——不外包不自动） |

- 执行人 = 主 agent（§6 作者）；① 落手（删档/改写）= eng-coder（维护小批 / 随触碰批——删除清单制，逐条列明 + 父侧核销）。
- **同步面（落笔清单）**——「测试处置」槽位的枚举落点与归属：

| 落点 | 归属 |
|---|---|
| `docs/requirements/ENGINEERING-MODE.md` §1.12 模板槽位行 + §1.15 D7 行 | eng-designer 修订（父侧排程） |
| `docs/design/ENGINEERING-MODE.md` §2.19 D7 行 | eng-designer 修订（父侧排程） |
| CLI `src/prompts/discipline-engineering.md` + `docs/design/prompts/discipline-engineering.md`（D7 枚举） | 主 agent 内容权 + eng-coder 落笔 |
| VSC 双源同款两文件（D7 枚举） | 同上 |

- **落笔时机 = 无冻结窗口冲突时（父侧排程）**：`ENGINEERING-MODE.md` 面他批在飞（ROLE-REDEFINITION 设计评审在途）——按 D5 冻结窗口纪律与 PORTABILITY 同规处置，本批设计期不触碰；落笔随排程执行。

### 3.4 演进评估（② 的发动机）与 ③ 收编

- 触发（主 agent 逐批核）：需求批次收口 / 行为变化（用户报"实际运行的常出问题"）/ 发布前。
- 评估动作（不外包、不自动）：对触发来源逐条问——是否触及既有场景族（§5）语义？是否新增"常出问题"值得常驻？→ 需变则出条目（形态 = §6 处置行 ②半 或需求池指针），交 eng-designer 定形、eng-coder 落。
- ③ 收编：真问题处理后——用户 → 主 agent 登记（落点 = 需求池条目或随 §6 行——不新增簿记）→ 转②（判据 = §3.2）。

## 4. 集成集：承载、执行与发布门

### 4.1 承载选型（2026-09-11）

判据：①扫①边界机械性（处置台账可判）②既有入口约定与单文件调试 ③快/全两层零混入（无配置漂移）④helpers/fixtures 复用成本 ⑤端内清单制适配 ⑥双端镜像成本。

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | `test/integration/` 子目录 | ①域界=目录界（扫①只碰顶层 `test/*.test.mjs`——机械可判）②同根（`node --test test/integration/x.test.mjs` 同形直达）③CLI 单层 glob / VSC 显式清单天然不含（零改）④同树复用（`../helpers/…` 一层可达）⑤VSC 另立集成清单（登记制同性质）⑥双端同名同位 | 目录多一层；`test/` 含两类寿命——以子目录分界（文档与处置行钉死该界） | **选定** |
| 2 | 仓根 `integration/` 平级目录 | ①域界同样清晰 ②第二测试根——"test/** 唯一入口"惯例破得更彻底 ③天然不含 ④helpers 跨树引用 ⑤同 1 ⑥双端多一套根约定 | 无额外收益（隔离已由子目录达成）——惯例成本更高 | 否决 |
| 3 | `test/` 内标签分族（`integration()` 门控 + 同域文件） | ①两类寿命混域——扫①删除清单须逐档 discriminate；标签漏标 = 误退/漏退（处置靠"记得标"）②同域 ③`test:full` "全量"语义被污染；slow 门与集成门两套 skip 叠加 ④同域 ⑤`files.mjs` 须分两类清单 ⑥同域 | 与 slow 门形态貌似同构——但 slow = 执行层门控（同一断言两面），集成 = 寿命分界（不同断言集）——机理不同 | 否决 |

**对照 slow 门（§1.2"为什么不用目录分层"）**：该注针对**快/慢同一断言双执行面**（防漂移）；①/②③ 是**不同断言集的不同寿命**——没有"防漂移"要保护，反而制造"处置边界靠自觉"的失稳点。隔离靠**域界**（机械可判），不靠**标记**（靠记得）。

### 4.2 runner 选型

| # | 候选 | 判据 | 结论 |
|---|---|---|---|
| 1 | 新入口 `test/run-integration.mjs` | 语义单一（集成集执行面）；不挂 slow-gate（不适用——不在快层）；退出码/摘要形态独立；发布门接线单点 | **选定** |
| 2 | 复用 `run-fast.mjs` 指向集成集（该入口已收目标参数——`run-fast.mjs`:18-19，默认 `test/*.test.mjs`） | 真实分界 = 其挂载 slow-gate（>800ms 未归册即红）与消费方语义——集成档 >800ms 必被拦或需 skip 特判；两个消费方（`npm test` / 发布门）语义混淆 | 否决 |

### 4.3 接口契约（双端）

| 项 | CLI（本仓） | VSC（`TESTING（VSC 仓）` §3 同构） |
|---|---|---|
| 目录 | `test/integration/` | `test/integration/` |
| 文件命名 | `<场景名>.test.mjs` | 同 |
| 目标集合 | glob `test/integration/*.test.mjs`（单层——沿本仓 runner 惯例） | 显式清单 `test/integration/files.mjs（VSC 仓）`（沿本端"登记即跑"惯例） |
| 入口 | `test/run-integration.mjs`（npm script `test:integration`——启动器形态沿 `run-full.mjs`） | 同款 |
| env 门 | 无（执行面 = 入口本身）；集成档**不得**用 `slow()`（无快层执行面） | 同 |
| 发布门接线 | `scripts/release-check.mjs` 步骤 +1（lint → test:full → test:integration；失败详情提取沿现有形态） | `vscode:prepublish` = `npm run lint && npm run test:full && npm run test:integration` |
| 不变量 | `npm test` / `test:full` 目标集合零变（单层 glob 天然排除集成档）；单文件调试 `node --test test/integration/x.test.mjs` 直达不经门 | 同（显式清单天然排除） |

- 裸 `node --test`（无参）非本仓入口（各入口均显式目标）——不设防线。
- 执行顺序：集成集运行面独立于 L0/L1/L2 任一层——**只在**发布门与手工入口跑（链上开发期纪律零变，见 §9 第 1 条）。

### 4.4 双端镜像策略

- 场景目录 = **共享语义源**（本文档 §5）；两仓**各自实例化**（语义同源、各端原文自持、不做 byte 一致）
- **驱动手段允许各端不同**：CLI = 真子进程 / 模块直驱 + 脚本化 provider；VSC = 扩展模块 + `vscode-mock` / happy-dom（本端工艺）——判据语义对齐、宿主各自
- 实现面互不追赶（不以任一端产物回改另一端）；差异如实登记（沿两端 README 镜像差异表同规）

### 4.5 覆盖划分（不重复纪律的落地）

- ① 可断言实现内部（开发自证自由度高）；②③ **只断言业务可观察结果**——允许读状态文件/产物验证结果，不锁私有结构形状
- **判定探针（口径内）**：`_verifyPassed`（verify 关口机械判定旗位——`src/agent.mjs` · `src/agent-tools/verify.mjs`）属口径内判定探针——§5.1/§5.6 以其判定值断言"放行/打回"业务结果，不视为"锁私有结构形状"；机验不改挂输出串（文案随模型措辞漂移；探针 = 机械判定信号本身，更稳）
- 禁止同断言双持；②③ 不做 ① 的机械改写（"同样的测试做两遍没有意义"）
- 处置判据（§3.2）即该纪律在收口时的执行面：① 的业务价值只有"转化为 ②③ 场景"这一条通路

## 5. 首批集成用例表（场景 + 种子——正式化）

> 结构：每场景三态（正常/边界/错误）+ 输入/驱动 + 预期输出（判据）+ 机验手段。映射列回指需求条目。
> 双端：本表 = 共享语义源；两仓各自实例化——VSC 实例的驱动面见 `TESTING（VSC 仓）` §4。
> 演进纪律：最小可跑起步——本表即首批上限，扩面只走 §3.4 两个入口。

### 5.1 ① 普通模式完整工具流（F13——用户点名必选）

| 态 | 输入 / 驱动 | 预期输出（判据） | 机验手段 |
|---|---|---|---|
| 正常 | 真 agent 循环（`runAgent`）+ 脚本化 provider + 临时工作区：读档 → 改档 → lint → verify{passed} | 目标文件被改；verify 认定 passed；`_verifyPassed=true`；报告含验证声明 | 文件内容断言 + verify 输出串 + 旗位 |
| 边界 | doc-only 浅改（改 `.md`）→ verify | doc-only 快路径放行（不要求 verification 声明）；不触发打回 | verify 输出分支串 |
| 错误 | 代码改动 + verification{status:"failed"} | verify 打回（`_verifyPassed=false` + 引导串）——不得声称完成 | 打回串 + 旗位 |

### 5.2 ② 工程模式全链

| 态 | 输入 / 驱动 | 预期输出（判据） | 机验手段 |
|---|---|---|---|
| 正常 | 真机制串联：评审结算（脚本化结论）→ design-token 签发 → spawn 门 → 链终 consume | token 签发；带 token spawn 放行；consume 后槽消费 | 令牌槽状态 + spawn 判决 + 二次 spawn 拒绝 |
| 边界 | 链未消费——同 designId 修正复用；消费后——再 spawn | 窗口内放行（docs FIRST）；链终后机械拒（需新评审新 token） | 两分支判决串 |
| 错误 | 无 token spawn eng-coder | 机械拒绝（明确文案 + 零 spawn） | 拒绝串 + 池空 |

（文档段——需求/设计撰写——非机械面，不入本用例；机械脊柱 = 评审结算 → token → 门 → 消费。）

### 5.3 ③ 子代理生命周期

| 态 | 输入 / 驱动 | 预期输出（判据） | 机验手段 |
|---|---|---|---|
| 正常 | 真调度器 spawn async + 脚本化 provider 子任务 → 结算 | 报告送达父侧；池清；id 递增 | 池/报告/计数断言 |
| 边界 | 两 spawn 文件域交叠 | 第二个 queued → 首清后自动启动（不手串行） | 状态序 + 终态 |
| 错误 | 运行中 cancel | 池释放、终态干净、无孤儿进程 | cancel 应答 + 池空 |

### 5.4 ④ 会话恢复 / 中断续跑

| 态 | 输入 / 驱动 | 预期输出（判据） | 机验手段 |
|---|---|---|---|
| 正常 | 真会话文件（HOME 重定向）+ 真 session 模块：写入含计数会话 → 重载 | 计数不重置；历史完整 | 读面数值 + 帧完整 |
| 边界 | 中断半程落盘 → 恢复 | 已知前缀保留；无重复帧（配对/孤儿检查） | 帧结构断言 |
| 错误 | 损坏/缺失会话档 → 恢复 | 干净回退（新会话、不崩溃、退出码正常） | 回退路径 + 退出码 |

### 5.5 ⑤ TUI / 面板基本盘

| 态 | 输入 / 驱动 | 预期输出（判据） | 机验手段 |
|---|---|---|---|
| 正常 | 真 state + key-handler：输入 → Enter 提交（runAgent 缝） | 文本送达 runAgentTurn；渲染面更新 | 交接文本 + 帧断言 |
| 边界 | 审批/提问面：permission 请求 → 面板响应 | 回调结果正确（批准放行） | 回调断言 |
| 错误 | 退出键 → cleanup | 清理锁序（真 createExitCleanup 序）；isTuiActive=false；零退出帧 | 调用序 + 状态 |

### 5.6 ⑥ commit / 验证关口

| 态 | 输入 / 驱动 | 预期输出（判据） | 机验手段 |
|---|---|---|---|
| 正常 | 真 git 临时仓 + 他批 pre-staged → commit path | 只提交列文件；他批 staged 不混入不丢失 | HEAD 集 + 索引断言 |
| 边界 | verify{skipped} 带理由 / 不带理由 | 带理由放行（标记）；无理由拒绝 | 两分支输出 |
| 错误 | verify{failed} | 拒绝（旗位 false） | 旗位 + 串 |

（VSC 实例：commit 面按本端现状——VSC commit 镜像缺口在案（技术待办），不在本批修复。）

### 5.7 ⑦ 配置装载与 provider 选路

| 态 | 输入 / 驱动 | 预期输出（判据） | 机验手段 |
|---|---|---|---|
| 正常 | HOME 重定向 + 真 config.json → `chat` 子进程启动 | 请求抵达选中 provider 的本地 mock（model/baseURL 匹配） | mock 收请求断言 |
| 边界 | 指定不存在的 provider 名 | 明确报错——不静默落第一个（防拿错 key） | 错误串 |
| 错误 | 坏配置（JSON 损坏 / 空 providers） | 软失败引导（不崩溃；退出码 + 可读文案） | 退出码 + 文案 |

### 5.8 种子组（③层首收编——生产反馈）

| 种子 | 来源 | 归入 | 场景化判据（机验） |
|---|---|---|---|
| S1 | GitHub #6（VSC——异步子代理结果不丢） | ③（VSC 实例） | 结算结果必达（注入断言）；错误轮不误杀（容错断言） |
| S2 | GitHub #7（VSC——webview 行内代码字面量） | ⑤（VSC 实例） | 渲染文本逐字（DOM 断言） |

（收编 = 改写成业务语气场景（断言只写业务可观察结果）；既有单测档不因收编移除——其寿命按扫①口径（本批清单内零动）。）

## 6. 验收标准（AC-TL——逐条回指需求）

| AC | 标准（可机验） | 回指 |
|---|---|---|
| AC-TL1 | 需求档 `../requirements/TESTING.md` §2/§3 含 F6–F14/N7–N9 固定子串（三层来源/命运通道/处置判据/发布门/演进评估/普通模式必选/最小可跑起步——grep 断言）；本文档 §3–§5 结构在位 | F6–F14 / N7–N9 |
| AC-TL2 | CLI `node test/run-integration.mjs` 退出码 0——首批场景 + 种子档全绿 | F12 |
| AC-TL3 | VSC 同款入口退出码 0（按本端清单） | F12 / F14 |
| AC-TL4 | 普通模式场景档在场 + 三态用例齐全（文件/用例名断言） | F13 |
| AC-TL5 | `npm test` / `test:full` 目标集合零混入（CLI 单层 glob 实证 + VSC 清单断言）；集成档零 `slow(` | F12 |
| AC-TL6 | CLI `scripts/release-check.mjs` 含集成步骤（源码串断言）；VSC `package.json` prepublish 含集成（串断言）；实测全链可跑 | F12 |
| AC-TL7 | 9 退档不存在（8 B 类 + 1 域外补录——§7.4）+ 并档差额对账（合并后源档删、断言并入；差额 = 清单数）——按用户裁定后的并档集合执行 | §7 |
| AC-TL8 | 削段后：doc-consistency 扫描器族在岗（其执行面未删）+ 点名档零残留（原锚串 grep） | §7 |
| AC-TL9 | 「测试处置」行定义在位（`../requirements/TESTING.md` §2 F9 + §2.1）+ 同步面清单在位（§3.3）——落笔项按排程核销 | F9 |
| AC-TL10 | 两仓 `node scripts/check-doc-width.mjs` 新增超宽 0 + 新增一致性违规 0（口径 = 批前/批后命中集合差——本批改动文件；他链在飞项归其链，不计入本批）；两仓快层全绿 | 批级 |
| AC-TL11 | VSC 对位档在场且登记（其 README 行）；镜像策略子串在位（语义同源/原文自持/不做 byte 一致） | F14 |
| AC-TL12 | 种子 S1/S2 场景件在场且断言绿（机验判据实现） | F11 |

> **作废注（2026-09-12 PROSE-ANCHOR-RETIRE）**：AC-TL8 第二半（「点名档零残留（原锚串 grep）」）随 `test/doc-consistency.test.mjs` T76 删除而作废——第一半（doc-consistency 扫描器族在岗）不变。见 §11.5。

## 7. 首执行清单（扫①——一次性处置）

> 来源 = 批次档 `../batches/2026-09-11-TEST-LIFECYCLE.md` §1 普查（4 路 explore · 110 档全读）；域外载体补录（普查域外 1 档）见 §7.4。
> 执行纪律 = **删除清单制**（逐条列明 + 父侧核销；差额 = 清单数——2026-09-07 起）。
> **次序硬约束：本清单只在集成集（§5）全绿后执行**（保护墙先立）。

### 7.1 退役（B 类——事件残迹 8 档，全在 CLI）

| # | 档 | 行数 as-of | 处置 |
|---|---|---|---|
| 1 | `test/activity-debloat.test.mjs` | 202 | 退（已删） |
| 2 | `test/advisor-description.test.mjs` | 19 | 退（已删） |
| 3 | `test/advisor-thinking-picker.test.mjs` | 114 | 退（已删） |
| 4 | `test/deepseek-v41-specs.test.mjs` | 86 | 退（已删） |
| 5 | `test/distill.test.mjs` | 88 | 退（已删） |
| 6 | `test/mouse-sane-gate.test.mjs` | 82 | 退（已删） |
| 7 | `test/tool-args.test.mjs` | 22 | 退（已删） |
| 8 | `test/websearch-config.test.mjs` | 110 | 退（已删） |

### 7.2 合并（C 类——4 组）

| # | 源档 | 目标档 | 处置 |
|---|---|---|---|
| 1 | `test/config.test.mjs`（45） | `test/config-merge.test.mjs`（176） | 断言并入 → 源已删 |
| 2 | `test/prompts-normal-audit.test.mjs`（72） | `test/prompts-dual-source.test.mjs`（333） | 同上（源已删） |
| 3 | `test/subagent-id-counter.test.mjs`（49） | `test/subagent-scheduler.test.mjs`（135） | 同上（源已删） |
| 4 | VSC `test/settings-panel.test.mjs`（86） | VSC `test/config-pool.test.mjs`（121） | **呈请裁定 → 已接受**（见 §10）：已并入 |

### 7.3 削段（约 20 个切点——三类）

| 类 | 对象 | 处置 |
|---|---|---|
| 防回潮静态锚（8+ 档） | 各档内文档/提示词锚断言 | 收归 `doc-consistency` 扫描器族（承接待建断言——执行轮落）；原档删段 |
| 源码/文档字符串锚 | `turn-across-segments` T8/T11 · `verify-redesign` T-V9/V10 · `eng-designer-role` T58 · `index-perception` T-I9 等 | 逐条判：真契约留、重复/自明删（执行轮出清单） |
| 邻档重复 | `activity-flow` ↔ `async-visibility` 等 | 去重（保留承载方；配合 §4.5 不重复纪律） |

- 数量口径：约 20 个切点 = 普查估计；**执行轮以逐条清单为准**（删除清单制——差额核销）；点名档现状行数见 §8.1.1。

### 7.4 域外载体补录（非 `test/*.test.mjs` 名式——普查域外）

> **名式外载体判定规则**：扫①域 = `test/*.test.mjs` 顶层名式；名式外测试载体不入 ① 域——逐档显式判定（退 / 迁入集成域 / 排除+理由），不得静默漏账。

| # | 档 | 行数 as-of | 处置 |
|---|---|---|---|
| 1 | `test/integration-provider.mjs` | 157 | **退（已删）**——域外事件残迹（MODEL-MERGE 会话语境；唯一在册提及 = `docs/design/_archive/MODEL-MERGE-SESSION.md`）：零执行面（快/全目标 glob `test/*.test.mjs` 名式不匹配——集成集执行面同理）+ 零活引用（`*.mjs` grep 零命中）；入删除清单制（差额核销） |

- 退因补充：内容 = 会话产物（模块直测与自指用例混排——"直接测 JSON parse"、档内局部 switchTo mock）；退役同时消除与新建 `test/integration/` 域的命名相邻混淆。
- 覆盖附注：`normalizeUsageCache` 直测为该档独有（`src/provider/sse.mjs` 为活代码）——退役后无直测；如需恢复该覆盖，走 §3.4 演进入口（业务设立），不随本批改写。
- `smoke-*.mjs` 真机冒烟档 = 手工面（不入任何层——沿 §2 政策；本批不动，非扫①对象）。

## 8. 受影响文件（as-of 2026-09-11）

### 8.1 CLI 仓

| 文件 | 现状（行数） | 预计增量 | 说明 |
|---|---|---|---|
| `docs/requirements/TESTING.md` | 42 | +32（实测落定 74 行；原估 +~110） | F6–F14/N7–N9 + §2.1 + 边界改（本批已落） |
| `docs/design/TESTING.md` | 79 | +~300 | §3–§10（本批已落） |
| `test/run-integration.mjs` | 新 | ~40 | 集成集入口 |
| `test/integration/*.test.mjs` | 新 | 场景档 ~600–900 | 首批场景 + 种子 |
| `test/helpers/mock-llm.mjs` | 55 | 0–20 | 复用（现零引用——集成集重新消费） |
| `scripts/release-check.mjs` | 62 | +~15 | 集成步骤 |
| `package.json` | 42 | +1 行 | `test:integration` script |
| `docs/design/RELEASE.md` | 128 | +~6 | 发布门表述 |
| `AGENTS.md` | 68 | ±~4 | Testing/发布门行 |
| `docs/README.md` | 239 | ±~1 | 测试基建行注 |
| 测试面（§7） | 9 退（8 B 类 + 1 域外补录——§7.4）/ 4 并 / 削段 | 删除 ~880 行 + 增 | 删除清单制 |

#### 8.1.1 削段 / 接收 / 并档目标逐行（as-of 2026-09-11 实测）

| 档 | 现状行数 | 处置 / 预计增量 |
|---|---|---|
| `test/turn-across-segments.test.mjs` | 136 | 削段（T8/T11——逐条判：真契约留、重复/自明删） |
| `test/verify-redesign.test.mjs` | 154 | 削段（T-V9/V10 同判） |
| `test/eng-designer-role.test.mjs` | 346 | 削段（T58 同判） |
| `test/doc-consistency.test.mjs`（接收档） | 236 | 承接防回潮静态锚断言族（8+ 档收归）——增量 = 执行轮落（删除清单制对账） |
| `test/prompts-dual-source.test.mjs`（并档目标） | 333 → 预计 ~405 | 并入 `prompts-normal-audit`（72） |
| `test/config-merge.test.mjs`（并档目标） | 176 → 预计 ~221 | 并入 `config`（45） |
| `test/subagent-scheduler.test.mjs`（并档目标） | 135 → 预计 ~184 | 并入 `subagent-id-counter`（49） |

- 削段其余点位（未点名——含防回潮静态锚 8+ 档）：行数随**执行轮逐条清单**同表核销（删除清单制；as-of 口径沿 §7.1/§7.2 同规）。
- 跨仓归属注记：`index-perception` / `activity-flow` / `async-visibility` 三档仅存于 VSC 仓（行数见 §8.2）——本仓削段点名档：`turn-across-segments` / `verify-redesign` / `eng-designer-role`。
- **拆分预审（并档特例）**：`prompts-dual-source.test.mjs` 并档后预计 ~405 行，已越 300 咨询线——并档执行轮附**拆分预审**（拆不拆按预审判；若拆，守"断言数不减"红线）。

### 8.2 VSC 仓

| 文件 | 现状（行数） | 预计增量 | 说明 |
|---|---|---|---|
| `docs/design/TESTING.md`（VSC 仓） | 新 | 96（实测落定；原估 ~160） | 对位档（本批已落） |
| `docs/design/README.md`（VSC 仓） | 123 | +~5 | 登记行 + 变更记录（本批已落） |
| `thincoder-vscode/test/run-integration.mjs` | 新 | ~45 | 集成集入口（清单制） |
| `thincoder-vscode/test/integration/files.mjs` | 新 | ~15 | 集成清单（登记即跑） |
| `thincoder-vscode/test/integration/*.test.mjs` | 新 | ~500–800 | 本端实例 + 种子 |
| `thincoder-vscode/package.json` | 129 | +2 行 | `test:integration` + prepublish 串 |
| `thincoder-vscode/test/settings-panel.test.mjs` → `config-pool.test.mjs` | 86 / 121 | 裁定 | 合并（§7.2 #4——已并入 `config-pool.test.mjs`） |
| 削段点名档（VSC） | `turn-across-segments` 220 · `verify-redesign` 187 · `eng-designer-role` 169 · `index-perception` 342 · `activity-flow` 311 ↔ `async-visibility` 387 | 删段 | 执行轮出清单 |
| `AGENTS.md`（VSC 仓） | 122 | ±~5 | Testing 段 |
| `docs/design/RELEASE.md`（VSC 仓） | 200 | +~6 | 发布门表述 |

### 8.3 同步面（落笔项——非本批设计期；清单与归属见 §3.3）

| 落点 | 现状 | 处置 |
|---|---|---|
| `docs/requirements/ENGINEERING-MODE.md` §1.12 + §1.15 | 枚举无「测试处置」 | 行内改写（冻结窗口排程） |
| `docs/design/ENGINEERING-MODE.md` §2.19 | 同上 | 行内改写（同上） |
| CLI 提示词双源 D7（`src/prompts/…` + `docs/design/prompts/…`） | 同上 | 主 agent 内容权 + eng-coder 落笔 |
| VSC 提示词双源 D7（同款两文件） | 同上 | 同上 |

## 9. 与既有纪律冲突点核对

| # | 既有纪律 | 结论 |
|---|---|---|
| 1 | L0/L1/L2 分层（§1） | **兼容（两轴）**：分层 = 一次改动的开发期验证纪律（何时跑什么）；集成集 = 验收/发布面。集成档不进任何一层。发布门 = lint + test:full + 集成（验收依据 = ②③——full 保留为兜底网；**不删 full**——①退役渐进期 + ②③ 覆盖尚浅；窄化属后续裁定） |
| 2 | slow 归册（§1.2） | 兼容：slow 门只管快层防漏；集成档不在快层、**不得用 `slow()`**（其执行面 = 入口自身——不靠 skip 机制） |
| 3 | 清单制（VSC `files.mjs`） | 兼容：单元清单零含集成档；集成清单独立（`test/integration/files.mjs（VSC 仓）`——"登记即跑"同性质）；CLI 无登记制（沿 glob 惯例） |
| 4 | 「代码变更至少要有一个测试」（双端提示词——CLI `src/prompts/discipline-normal.md:82` "Code changes need at least one test."） | **写作义务不变，留存策略新规**：写（每条需求用例映射 + 开发期自证）→ 用 → 收口处置（退/转）。verify 工具层"不强制每改动带测试"零变。附注：与 §2「按需加」库存政策为不同轴——同步轮一并核对表述 |
| 5 | 「不用目录分层」注（§1.2/§2） | 辨析：该注针对**快/慢**（同一断言两执行面——防漂移）；集成子目录 = **寿命分界**（不同断言集）——机理不同（§4.1） |
| 6 | D2 单一权威源 | 本机制详述只在 TESTING 两档；ENGINEERING-MODE/提示词只加槽位名（同步面清单 §3.3） |
| 7 | D5 冻结窗口 | 同步面落笔按冻结窗口排程（§3.3）——设计期不触碰在飞面 |
| 8 | 文档宽度/机检 | 本批两档过 `check-doc-width`（新增违规 0——批级 AC-TL10） |

## 10. 关键决策记录与边界

| # | 决策 | 否决备选 | 理由 |
|---|---|---|---|
| D-TL1 | 承载 = `test/integration/` 子目录 | 仓根 `integration/` · `test/` 内标签分族 | §4.1 |
| D-TL2 | runner = 新入口 | 复用 `run-fast` | §4.2 |
| D-TL3 | 集成档裸 `test()`（禁 slow） | slow 门控复用 | §9 第 2 条 |
| D-TL4 | 首版驱动 = 真机制 + 脚本化 provider（不进真付费端点） | 真端点集成 | 机验须确定 + 费用/抖动；与 smoke 独立形态同规 |
| D-TL5 | 发布门叠加（不删 full） | 纯 ②③ 门 | §9 第 1 条 |
| D-TL6 | 不重复判据 = §3.2 四问 | 覆盖清单简单比对 | 判据盯"业务可观察 + 未覆盖"两条硬轴，可评审复核 |

**边界（不做）**：真付费端点进层 · PTY 级全 TUI 驱动（⑤ 模块级起步） · VSC commit 镜像缺口修复（技术待办在案） · slow 门/分层机制改动（零改） · 集成集一次性写满（最小起步） · 存量 helper 清理（不顺手清）。

**呈请裁定项**：VSC `settings-panel` → `config-pool` 合并——extension 面断言并入纯单元档（happy-dom env 沿 `test/helpers/webview-env.mjs`（VSC 仓） 同款）。设计建议：**接受**（同板块凝聚 + 减碎片；分节标注"面板显示面"）；备选：不接受（原地保留，差额表调整）。

## 变更记录

- 2026-09-14（CLI 自动验证面批——E2E-HARNESS）：新增 §12（问题与现状 / 方案选型对比 / 架构与接口契约 / 四守卫机制裁定 / 接入点 / 覆盖边界 / 受影响文件 / AC-E2E1–AC-E2E10 / 用例表 T-E2E1–T-E2E10 / 关键决策 / 边界与待裁项）；需求侧同步 = `../requirements/TESTING.md` §6（F23–F28 · N13–N18）。
- 2026-09-14（E2E-HARNESS 批评审修正轮——评审 #84 逐条落地）：§12.1 守卫 3→4（+ `bin/thincoder.mjs:157` 接缝）· §12.4 守卫表增行 / 理由 1 收窄 / 结构机检枚举与排除口径 · §12.6 #7 与 §12.9 T-E2E7 拒句观测面 · §12.8 AC-E2E6 补单用例 ≤30s + 新增 AC-E2E9（N17）/ AC-E2E10（F26）· §12.7 读数与零改面同步 · §12.11 待裁 5→4 · §12.6 增 F19 相容口径（映射见批次档 §2）。
- 2026-09-13：**两仓合并批 3（S6）纪律句收窄**——§11.6 端差登记块按产品侧对位口径改写（R15）。
- 2026-09-11（测试生命周期与集成集批——TEST-LIFECYCLE）：新增 §3–§10（三层来源与寿命 / 处置判据与 §6 处置行 / 承载与 runner 选型 / 双端契约与镜像 / 首批场景 + 种子用例表 / AC-TL1–AC-TL12 / 首执行清单 / 受影响文件 / 纪律核对 / 决策记录与边界）；需求侧同步 = `../requirements/TESTING.md` §2–§4（F6–F14 · N7–N9 · §2.1 维护模型）。
- 2026-09-11（TEST-LIFECYCLE 修正轮——设计评审轮次 1 后）：§4.2 候选 2 表述修正 · §4.5 判定探针口径 · §6（AC-TL1 补 N8 子串 / AC-TL7 计数）· §7 引注 + §7.4 域外载体补录 · §8.1.1 削段/接收/并档逐行 · §8.1/§8.2 数字实测落定（7 条评审发现逐条落修——映射见批次档 §2）。
- 2026-09-11（第 20 批）：归册补登——`test/eng-designer-role.test.mjs` T30 自 `test(` 改 `slow(`（慢门实测点名）+ AC-A3（见 §1.2）。
- 2026-09-06：测试分层 + 精简专题（五杠杆批 L4 归属）设计落地本文件（首个设计由 AGENT-LOOP §23 迁出——用户"可以，这样更合理"）。
  - 三阶段收口实现：Phase 1 双端分层+防漏（D-T6 slow 门拦截）/ Phase 2 L0+ 流程修订（D-T3：首次实现 L1→L0+）/ Phase 3 存量清理+红线收窄（D-T5：断言数不减收窄为拆分轮专用）+ 镜像转 slow。
  - 双端 L2 终验 CLI 1486/1486 + VS Code 1204/1204；链测试墙钟较基准降 ~70%（≥50% 参照线过）。用户批准 2026-09-06。
- 2026-09-07：**存量测试库存清零**——94 个测试文件按"按需加"政策删除（含锁测试断言的覆盖/回归断言产物）；分层机制与脚本不动，测试转按需补。本文件随格式债清理批 A 重写为当前态。

## 11. 散文锚退役（PROSE-ANCHOR-RETIRE——2026-09-12）

> 需求依据：`../requirements/TESTING.md` §5（F15–F22 / N10–N12）。批次档 = `../batches/2026-09-12-PROSE-ANCHOR-RETIRE.md` §1（用户裁定 R1–R5）。
> 本批产出 = **逐条删除清单**（§11.3 CLI / §11.4 VSC）——清单外断言零触碰；T95 / AC75 处置见 §11.5。
> 双端纪律：语义同源、各端独立执行、不做 byte-identical、不加跨端同步依赖（F20）。VSC 端执行面登记见 `TESTING（VSC 仓）` §8。

### 11.1 判据（执行版）与口径裁定

判据三条（F15——同时成立即散文锚）：①断言对象是**非测试档文本**或其派生切片；②断言其**文本内容**在场 / 缺席 / 出现次数 / 相对顺序；③断言对象**不是**结构机检保留面所判属性。

**口径裁定（C1–C5——本批分类的唯一执行口径；与 §11.10 D-PA3/D-PA4 对应）**：

| # | 裁定 | 说明 |
|---|---|---|
| C1 | 载体判据 | 按**被断言文本的载体**判，不按 needle 原产地判。断言对象 = **执行产物**（函数 / 工具返回值、子进程输出、渲染帧、测试自建临时域文件）或**结构 / 数值常量** → 不命中 ①（保留）；直接读非测试档所得文本，或经 `import` 取到的 src 静态文案字面量 → 命中 ① |
| C2 | 非测试档边界 | `等` 展开 = 一切非 `test/**` 的仓内文件：`src/**` · `docs/**` · `scripts/**` · `bin/**` · `webview/**` · `locales/**`（资源文本保留——C1-d） · `package.json` · 仓根 `*.md` / `*.json` / `*.mjs` · `AGENTS.md` · `README*`；VSC 侧另含兄弟仓 `../thincoder-cli/**` |
| C3 | 保留面 = 封闭枚举 | **F17 封闭枚举**所判属性（V1/V2/V3 · L1–L3 · 行宽 · 归册 · **工具契约面**——工具契约面判定见 C1-b）。对非测试档文本的**出现次数 / 相对顺序 / 位置**断言**不属**该枚举 → 按散文锚处置 |
| C4 | 存在性断言保留 | `existsSync` 类文件存在性断言不属「文本在场 / 缺席」→ 判据 ② 不成立 → 保留（如 T75 退役提示词文件未复活） |
| C5 | 测试档自身保留 | 断言读的是 `test/**`（含 `test/files.mjs（VSC 仓）` 登记清单、`test/helpers/**`、fixtures、测试内常量）→ 判据 ① 不成立 → 保留 |

**归类三值**：`整删`（该用例全部断言均为散文锚——删后无内容残留）/ `段删`（夹锚断言——只删锚断言行，行为断言保留）/ `保留`（无锚断言；**不进清单**）。

**判据补充（2026-09-12 修正轮——PA-A1 / PA-A2 / PA-A3 裁定落地；C1 的实质判法）**：

| # | 补充 | 说明 |
|---|---|---|
| C1-a | **提示词句子不豁免（PA-A1）** | 载体判据按**实质**判——**不问文本从哪来**（读盘 / 装配器或渲染出口的返回值 / 写入 `systemPrompt` 的装配结果），只问**断言的是否是提示词句子**：断言提示词句子（含装配器传出的话语、注入块、降级句、槽文本，以及装配产物**与字面常量的全文相等 / 不等**）→ 命中 ①——**「不读文件」不是豁免理由**（判据 ② 的在场 / 缺席 / 出现次数 / 相对顺序 / 全文等同各形态均算） |
| C1-b | **工具契约面与工具返回文案保留（PA-A3）** | **模型实际收到的工具契约对象**（`tool.description` / `parameters` 说明）与**工具返回 / 拒绝文案** → 契约守卫 / 行为输出，非文档散文锁 → 保留。注：读 `src/**` **源码档文本**（含源码里的描述串）仍命中判据 ①——与「工具契约对象」断言是两回事 |
| C1-c | **非句子对象保留（C1 原义）** | 结构 / 数值 / 判定信号——槽文件表与集合成员、长度、警告清单与警告文案、旗位、退出码 → 保留 |
| C1-d | **locales 资源文本保留（PA-A2 裁定）** | `locales/**` 文本值 = **产品资源文案**（界面 / 本地化面——产品面，与 C1-b 同族）→ **不命中 ①**（保留、不进清单——C2 列举的面不因在列而自动命中）；读非测试档**源码 / 文档文本**仍命中 ① |

### 11.2 方案选型对比

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | 按档删（锚档整档删除） | 零误删：✗（粗筛锚档含混装档——会连带删行为用例）；对账：粗筛口径机判易；成本：最低 | 违 F18「混装档只删锚断言、不得整档删」——制造行为覆盖缺口 | 否决 |
| 2 | 逐条删除清单制（逐条列 `档 + 用例名 + 行号`，父侧核销） | 零误删：✓；对账：✓（用例总数下降 == 整删条数，机判）；沿既有纪律：✓（§2「存量清理轮走删除清单制」——2026-09-07）；键控：✓（档 + 用例名，行号 only as-of） | 清单体量大（本批 201 条处置行——100 CLI + 101 VSC）；逐条判定工作量在勘察轮 | **选定** |
| 3 | 目录 / 标签门控（读档断言族打标签，跳层不跑） | 零误删：✓；对账：✗（标签计数与「用例总数」口径脱钩）；退役性：✗（断言仍驻留 = 未退役）；成本：新增标签约定 + runner 改造 | 与 R2「全删」相悖；且与 slow 门形成两套 skip 叠加（§4.1 否决理由同族） | 否决 |

**粗筛 → 逐条判定的差额（诚实对账）**：批次档 §1 规模表的粗筛口径为「读档 + `includes`/`match` ≥3 的档 → 该档**全部**用例计入」，
得 CLI 29 档 / 344 用例、VSC 28 档 / 330 用例。粗筛把**断言对象是运行产物**的用例一并计入（混装档的 `includes` 多数落在运行时值上）。
逐条判定后（**含 2026-09-12 修正轮**——PA-A1 追加 / PA-A3 回退后实测）：CLI **71 整删 + 29 段删**（100 条处置行）· VSC **61 整删 + 40 段删**（101 条处置行）。差额 = 粗筛的已知高估（批次档 §1「规模」节自注「粗筛含混装档 → 禁止按档删」）+ 修正轮的净变动（PA-A1 追加 ×20 · PA-A3 回退 ×2）。

### 11.3 逐条删除清单——CLI 仓

> 键控 = `档 + 用例起始行`（行号 as-of 2026-09-12；执行轮以「档 + 用例名」定位，行号漂移不阻断——D4）。
> `整删` = 删该用例全部（用例总数 −1）；`段删` = 只删列出的断言行（用例总数不变，行为断言保留）。
> 清单外断言零触碰（N12）；档内未被点名的用例一律保留。

| 档 | 用例行 | 用例名（截断） | 归类 | 删除行号 | 依据 |
|---|---|---|---|---|---|
| abort-provenance | 167 | T-AP9 合成点残留扫描：五处全经 deathLine | 整删 | 167-175 | 读 src 源码文本 + 计数 |
| abort-provenance | 177 | T-AP10 hop 扫描：五处逐跳保 reason + 零裸 abort | 已删（整删） | 177-189 | 读 src 源码 match / includes |
| acp-channel | 261 | AC2 question.md 含「无交互面返回错误」句 | 整删 | 261-263 | 读 `src/tools/question.md` 子串 |
| acp-channel | 240 | T17 文法单一权威（三符号 + 消费方直连） | 段删 | 244-246 | 三行 src 文本 match / includes |
| acp-channel | 255 | AC1 装配接线锁（acp.mjs / make-agent） | 段删 | 257-258 | 两行 src 文本 match |
| advisor-chain-guards | 150 | T-CG5 code 守卫……旧锚零残留 | 段删 | 161-165 | 读两 src 文本 includes |
| advisor-chain-guards | 245 | T-CG8 压缩定锚（pinned 重挂） | 段删 | 276-278 | 读 `run.mjs` 文本 includes |
| advisor-context-budget | 89 | T-CB6 静态锚：旧 OOM 注释 / 旧常量零残留 | 整删 | 89-101 | 读 src 文本 + readdir 扫描 |
| advisor-sync-accounting | 49 | T-SG1 sync code run + 干净评审结果 | 段删 | 58-59 | 读 `record-results.mjs` 文本 |
| async-settle | 233 | 一致性（N1/AC1）：四族 settle 同守卫……记账单点 | 整删 | 233-243 | 读四 src + helper includes |
| attention-state | 191 | T-AT8 静态锚：render-frame 零 setInterval… | 整删 | 191-210 | 读四 src 文本 includes / 计数 |
| attention-state | 136 | T-AT5 鼠标路径清位（index.mjs 接线位） | 段删 | 147-151 | 读 `index.mjs` 文本 indexOf |
| batch-segment | 219 | T49 三条评审提示词双源——写 §3 指令 | 整删 | 219-235 | 读 `src/prompts` + `docs/design/prompts` |
| batch-segment | 237 | T49b 代码评审不带写指令 | 段删 | 239 | 读 `advisor-round1.md` 文本 |
| cmd-eng | 77 | T-21 推进档位契约要点落需求档（PO-12） | 整删 | 77-85 | 读 `docs/requirements/PORTABILITY.md` |
| design-review-streak-guard | 255 | T-SK9 静态锚：工具层消费 + 同步面计数 + 内防线 | 整删 | 255-272 | 读五 src 文本 includes |
| design-review-streak-guard | 43 | T-SK1 分类矩阵 | 段删 | 60-63 | 读 `review-streak.mjs` 文本 |
| doc-consistency | 231 | T74 宽度扫描单源（主流程调用 checkDocWidths） | 整删 | 231-237 | 读 `check-doc-width.mjs` 文本 |
| doc-consistency | 281 | T76 防回潮：退役串零残留（逐字扫描） | 整删 | 281-299 | RETIRED_STRINGS 逐条判定 = 散文锚（D-PA5） |
| doc-consistency | 201 | T72 跨仓引用（带 .md 形态 fail-closed） | 段删 | 213-216 | 读 `docs/README.md` 子串 |
| eng-designer-role | 193 | T34 persona 双源明写写域 + dispatch 判定 | 整删 | 193-206 | 读 4 档断言固定子串 |
| eng-designer-role | 90 | T30 角色注册面（schema / ROLES / tool-args） | 段删 | 95-96 · 104 | 读 `subagent.mjs` / `tool-args.mjs` |
| eng-designer-role | 127 | T32 边界：装配不静默回退 + 槽序 | 段删 | 131 · 133-134 | 装配产物 `assemblePrompt(...).prompt` 的句子位序与常量全文比对——PA-A1（C1-a）；槽表 / 长度 / warnings 结构断言保留（128 / 130 / 132） |
| eng-designer-role | 138 | T32b 接线：designer 实选场景 | 段删 | 141-145 · 148-149 | `prepareRun(...).systemPrompt` 提示词句子断言（PA-A1；147 装配点保留——150-168 消费）；工具契约对象与门文案断言按 C1-b 保留 |
| eng-designer-role | 301 | T40 写权路由六面 + 双源调用链 | 段删 | 304-316 · 321 · 326-331 · 336-337 · 340 | 读 ENGINEERING-MODE / README / AGENTS |
| home-expansion | 206 | T-H16 静态：展开逻辑全仓恰一处（src + bin） | 整删 | 206-224 | 读 src / bin 文本计数 + 命中文件 |
| home-expansion | 189 | T-H15 静态：README L1–L4 逐字命中 | 段删 | 195-196 | 读 `README.md` 子串 |
| hooks-stop | 248 | T-HS11 静态：事件集收口 + matcher 守卫形态 | 段删 | 250-252 | 读 `src/hooks.mjs` 三处子串 |
| ledger-surface | 230 | T105 四提示词两锚在位 + 脚本名零命中 | 整删 | 230-249 | 读 4 提示词 + 需求档子串 |
| ledger-surface | 252 | T106 空标记零注入；非空在位；warn 色段 | 段删 | 265-266 | 读 `src/tui/index.mjs` 子串 |
| ledger-surface | 290 | T110 错误：降级不崩……headless 零接线 | 段删 | 311 | 读 `bin/thincoder.mjs` 零命中 |
| ledger | 124 | T95 归属修订文本面（需求档 §1.13 + 两仓台账头部 + 4 人格档） | 整删 | 124-134 | 七档只断言固定子串在场（F22 点名） |
| ledger | 136 | AC49 双端锚 L-A / L-B 固定子串在位（4 文件逐字） | 整删 | 136-145 | 读 4 档断言 4 条字面子串 |
| ledger | 147 | T96 收拢执行面（归档档键控条目 + 组计数） | 段删 | 150-151 | 读两仓归档档子串（152 为机检返回） |
| memory-scan-bounds | 87 | T-MS4 三通道接线 | 段删 | 90-96 | 读三 src 文本调用形态 |
| portability-advisor-context | 52 | T-10 正常（注入）：有 AGENTS.md + docs/README.md | 整删 | 52-59 | 装配器出口（`buildAdvisorUserMessage` 返回值）提示词句子断言——PA-A1 裁定为锚（C1-a：不读文件不豁免） |
| portability-advisor-context | 61 | T-11 边界（缺料）：无地图 / 无标准文档 | 整删 | 61-68 | 同上（注入正文 + 降级句在场 / 旧指令句缺席——均为提示词句子） |
| portability-advisor-context | 70 | T-12 正常（声明）：advisor.docMap 指向自定义路径 | 整删 | 70-91 | 同上（声明注入正文 + 标准文档节句） |
| portability-advisor-context | 105 | T-20 提示词通用化句在场；自指=0 | 整删 | 105-133 | 读 6 档提示词子串 |
| prompts-async-guidance | 67 | A1 勘察 checklist 子条子串驻留 | 整删 | 67-73 | 读 `discipline-engineering.md` 6 子串 |
| prompts-async-guidance | 75 | A2 方案对比逐字驻留 | 整删 | 75-79 | 三处 includes 字面句 |
| prompts-async-guidance | 81 | A3 评审前预检子条子串驻留 | 整删 | 81-87 | 读同档断言 6 子串 |
| prompts-async-guidance | 89 | A4 实践沉淀逐字驻留 | 整删 | 89-92 | 两处 includes |
| prompts-async-guidance | 97 | 锚#1 零裁量句驻留 | 整删 | 97-101 | 三处 includes |
| prompts-async-guidance | 103 | 锚#2 需求池三句驻留 | 整删 | 103-107 | 三处 includes |
| prompts-async-guidance | 109 | 锚#3 修正轮 docs FIRST + 锚#5 链终消费 | 整删 | 109-114 | 四处 includes |
| prompts-async-guidance | 116 | 锚#4 拍板 ≠ 设计批准 + 指针句驻留 | 整删 | 116-121 | 四处 includes |
| prompts-async-guidance | 123 | 锚#6 凭证不落文档驻留 | 整删 | 123-126 | 两处 includes |
| prompts-async-guidance | 128 | 锚#7 调度器句驻留 | 整删 | 128-132 | 两处 includes（含 SQ_LITERAL） |
| prompts-async-guidance | 138 | C1 推进档位顶层规则驻留（persona-engineering） | 整删 | 138-143 | includes ×3 + indexOf 位序 |
| prompts-async-guidance | 145 | C2 step4 尾句驻留 | 整删 | 145-148 | 两处 includes |
| prompts-async-guidance | 150 | C3 分派表 User stop 条驻留 | 整删 | 150-153 | 两处 includes |
| prompts-async-guidance | 155 | C4 normal 档位语义段 | 整删 | 155-160 | 三处 includes |
| prompts-async-guidance | 165 | ASYNC-RESIDUE R1 escalation 段无 async:false | 整删 | 165-168 | doesNotMatch + includes |
| prompts-async-guidance | 170 | ASYNC-RESIDUE R2 重复句合一 | 整删 | 170-173 | includes + doesNotMatch |
| prompts-async-guidance | 175 | ASYNC-RESIDUE R4 advisor.mjs 机制限定句 | 整删 | 175-178 | 读 `advisor.mjs` 断言子串 |
| prompts-async-guidance | 180 | ASYNC-RESIDUE F-2/F-3 工程侧 async 段同基 | 整删 | 180-184 | includes ×2 + doesNotMatch |
| prompts-async-guidance | 186 | ASYNC-RESIDUE R6 路由面随迁 common | 整删 | 186-189 | 两处 includes |
| prompts-async-guidance | 191 | BATCH-4-DOC-CLEANUP F-1 ESCALATE.md 锚句驻留 | 整删 | 191-194 | 读 `ESCALATE.md` 断言子串 |
| prompts-async-guidance | 207 | §7.5 subagent 描述 Async spawn 锚句双句驻留 | 整删 | 207-214 | 读 `subagent.mjs` match / doesNotMatch |
| prompts-async-guidance | 216 | §7.5 subagent 描述 escalate 段 + async 参数 | 整删 | 216-220 | 两处 doesNotMatch |
| prompts-async-guidance | 222 | §7.7.1 advisor 描述无顶层同步引导 | 整删 | 222-225 | doesNotMatch |
| prompts-async-guidance | 236 | advisor AC1 各档含单值 VERDICT 裁决行指令 | 整删 | 236-241 | 循环 4 档 includes |
| prompts-async-guidance | 243 | advisor AC2 裁决后禁续 | 整删 | 243-251 | 循环 includes + 三处 includes |
| prompts-async-guidance | 253 | advisor AC7 双轨消除——旧 pass 定义不复发 | 整删 | 253-259 | 五处 doesNotMatch |
| prompts-async-guidance | 264 | 搜索条款宿主迁移：3 字面驻留 common | 整删 | 264-275 | 循环 includes / 反向 |
| prompts-async-guidance | 294 | §3.2 装配矩阵：输出=槽序拼接 + 层序内部锚 | 段删 | 297-301 | 装配产物 prompt 的句子位序断言——PA-A1（C1-a）；warnings 结构断言保留（303） |
| prompts-async-guidance | 307 | §3.2 装配矩阵：角色场景人格差异 + 常量导出面 | 段删 | 310-311 | 装配产物含人格档句子 / 自指句缺席（PA-A1；309 孤立常量随清理）；常量非空断言保留（313-315） |
| prompts-async-guidance | 318 | §3.2 consult 场景：返回 CONSULT_BASE 自含基底 | 段删 | 320 | 装配产物全文与字面常量相等——PA-A1（C1-a）；warnings 断言保留（321） |
| prompts-async-guidance | 327 | §3.4 降级链①：槽文件缺失→空缺+警告 | 段删 | 339-341 | 装配产物 prompt 的槽句在场 / 缺席（PA-A1）；warnings 诊断串断言保留（336-338） |
| prompts-async-guidance | 348 | §3.4 降级链②：common.md 缺失→同款警告 | 段删 | 357-358 | 同上（PA-A1）；warnings 诊断串断言保留（355-356） |
| prompts-async-guidance | 373 | §3.4 降级链④：基底缺失→不可用报错 | 整删 | 373-377 | 读 `src/agent/setup.mjs` 两处正则 |
| prompts-async-guidance | 403 | §2.7 #5 前 20% 巡检词 | 段删 | 410 | 读 pe 断言关键词正则（411 非空守卫留） |
| prompts-async-guidance | 196 | ASYNC 全族：AGENT-LOOP.md §14.2 陈述 | 段删 | 200-201 | 读 doc 后 slice 断言正则 |
| prompts-dual-source | 62 | AC22① 四条行为纪律句双源驻留 | 整删 | 62-81 | 循环 includes（64-71 / 74-80） |
| prompts-dual-source | 83 | AC22② 四步流程三句双源驻留 | 整删 | 83-89 | 循环三处 includes |
| prompts-dual-source | 91 | AC22③ 文档更新纪律三句 + D1–D7 全表 | 整删 | 91-100 | 循环 includes（93-97） |
| prompts-dual-source | 102 | AC23 主 agent 人格已改述 | 整删 | 102-109 | 循环四处 includes |
| prompts-dual-source | 111 | AC24 四维归属改述为设计者角色 | 整删 | 111-116 | 循环两处 includes |
| prompts-dual-source | 118 | AC25 persona-eng-designer 双源 FR19 子串 | 整删 | 118-130 | 循环 13 串 includes + 正则 |
| prompts-dual-source | 150 | T-RO1 链行节点双源在位 | 整删 | 150-153 | includes + indexOf 位序 |
| prompts-dual-source | 155 | T-RO2/T-RO3 Action 四值 + 计数词同改 | 整删 | 155-162 | includes + indexOf 词序 |
| prompts-dual-source | 164 | T-RO4 时序 bullet 双源逐字全文 + 位序 | 整删 | 164-171 | includes + indexOf 位序 |
| prompts-dual-source | 251 | T-CL2 六节关键句双源逐字 | 整删 | 251-258 | 循环 includes（253 / 256） |
| prompts-dual-source | 265 | T-CL3/T-CL4 C8 人格段双源在位 | 整删 | 265-284 | includes / 反向四源反证 |
| prompts-dual-source | 302 | AC61 勾销口径双源 | 整删 | 302-307 | 循环两处 includes |
| prompts-dual-source | 309 | AC64 persona-eng-coder 身份/边界句 + 头注 | 整删 | 309-317 | includes（311-312 / 315-316） |
| prompts-dual-source | 341 | T-NA1 英文落地条款锚 6 串全命中 | 整删 | 341-343 | 读 dn 循环 includes |
| prompts-dual-source | 345 | T-NA2 中文权威镜像锚 6 串全命中 | 整删 | 345-347 | 读 dnZh 循环 includes |
| prompts-dual-source | 381 | T-TD1 de 双源测试纪律新节驻留 | 整删 | 381-386 | 循环 11 串 includes |
| prompts-dual-source | 388 | T-TD2/T-TD6 dn 双源新句 + 旧句零残留 | 整删 | 388-396 | includes / 反向 |
| prompts-dual-source | 244 | T-CL1 common 十节标题双源驻留 | 段删 | 246 | 断言字面标题（247 为计数——保留面） |
| prompts-dual-source | 398 | T-TD3/T-TD4 pe 双源归属句驻留 | 段删 | 399-400 | 两处全文锚 includes |
| session-store | 365 | AC-RS1 追加单点：pushReal 唯一 append | 整删 | 365-373 | 读 `context.mjs` / `session.mjs` 文本 |
| subagent-memory-bounds | 86 | T-SM4b 窗口覆盖（代码评审 #2 回归） | 整删 | 86-92 | 读 src 源码文本 match |
| subagent-memory-bounds | 94 | T-SM4 释放点（三消费点调用在位） | 段删 | 105-111 | 读 src 文本（前半行为断言保留） |
| tui-selection-surfaces | 229 | 用例 10 文档面：设计档 §12.4 契约表落档 | 整删 | 229-236 | 读 `docs/design/TUI.md` 切片 + 子串 |
| turn-across-segments | 113 | T8 源码锚：段内帽零改动 + 编号帧唯一权威 | 整删 | 113-133 | 全 7 断言读 src 文本（含计数/序） |
| verify-redesign | 132 | T-V9 guard 文案声明式 | 整删 | 132-140 | 读 `src/agent/completion.mjs` 文案 |
| verify-redesign | 142 | T-V10 prompts 声明式 verify 语义在位 | 整删 | 142-152 | 读 `src/prompts/*.md` 常量子串 |

- **CLI 合计：25 档 · 整删 71 条 · 段删 29 条**（= 100 条处置行——含 2026-09-12 修正轮：PA-A1 追加 10 条 / PA-A3 回退 `settings` T-S2.24 1 条）。
- **零用例留存档注（D-PA8 例外——2026-09-12 实施轮实测）**：`portability-advisor-context` 4 例全整删 → 现存 = 档头退役注记空壳（10 行 / 0 例）；**保壳裁定**——头注留痕 = 可追溯；撤档会丢记录并改套件档计数。该档为 CLI 侧唯一零用例留存档。
- 常量面连带清理（同上清单执行轮一并落——非新增条目）：`test/doc-consistency.test.mjs` 的 `WS` / `readWs`（:245-246）· `PE_2` / `DE_2` / `DN_2`（:249-251）· `ledgerClosure7`（:252）· `RETIRED_STRINGS`（:253-272）· `hitsOf`（:273）随 T76 删除（`RETIRED_PROMPT_FILES`：248 **保留**——T75 消费）；
  其余各档被删用例留下的孤立 helper / import / 常量，执行轮按「删除后零 unused」一并清理（不得留死代码）。

### 11.4 逐条删除清单——VSC 仓

> **落点裁定**（VSC 侧记录 §1「设计必须回答的问题 #1」+「两侧各持自身范围」）：VSC 侧逐条清单**本端自持**——住 `TESTING（VSC 仓）` §8.1。
> 本档不再重述（D2 单一权威源）；两侧语义同源、各端原文自持（不做 byte-identical）。判据 / 口径裁定 / 归类三值 = 本档 §11.1（两侧共用）。

- **VSC 小计：27 档 · 整删 61 条 · 段删 40 条**（= 101 条处置行）——逐条见 `TESTING（VSC 仓）` §8.1。
- 本端**无整档删除**（每档均有保留用例）→ `test/files.mjs（VSC 仓）` 登记清单**零改**（63 条登记项 = 62 档 `.test.mjs` + 1 档 `smoke-settings.mjs`，与实档数不变）。
- **需求面（2026-09-12 修正轮二）**：VSC 侧需求自持于 `docs/requirements/TESTING.md`（VSC 仓）（F15–F22 / N10–N12——语义同源、各端原文自持）；本档 §11 判据为双端共享语义源（登记见 `TESTING（VSC 仓）` §8 头注）。
- **粗筛 → 逐条判定的差额**：VSC 侧记录 §1「事实基线」的粗筛口径 = 「读档 + `includes`/`match` ≥3 的档 → 该档**全部**用例」= 28 档 / ≈330 用例 ≈ 本仓 suite 50%。
  逐条判定后（含 2026-09-12 修正轮）= **61 整删 + 40 段删**（101 条处置行）——差额原因同 CLI 侧（粗筛把断言对象为运行产物的用例一并计入）。
  口径注：粗筛的「用例数」与本档对账口径（`test(` / `slow(` / `it(` 起始行计数）不同——**对账以本档口径为准**（命令见 §11.7 AC-PA1）。

### 11.5 T95 / AC75 同批处置（R5 / F22）

| 对象 | 位置 | 处置 | 形态理由 |
|---|---|---|---|
| 测试用例 T95 | `test/ledger.test.mjs` :124-134 | **整删**（已入 §11.3 清单） | 七档只断言固定子串在场——判据三条全中 |
| 验收标准 AC75 | `ENGINEERING-MODE.md`（设计档）§3.1 :2139-2141 | **就地退役注记**（保号） | 删行会让别处引用悬空（D4）；保号 + 明示退役态 |
| 用例行 T95 | `ENGINEERING-MODE.md`（设计档）§3.2 :2333 | **就地退役注记**（保号） | 同上 |
| 需求本体（归属修订） | 需求档 `ENGINEERING-MODE.md` §1.13 固定子串「记录 + 状态推进 + 物理落笔」 | **零改**——需求仍生效 | 要求本体由正文文字承载；退役的只是「由测试断言守」这一形式 |

- 退役注记逐字形态：「**已退役（2026-09-12 PROSE-ANCHOR-RETIRE）**——判据面作废（散文锚；见 `TESTING.md` §11.5）；需求本体不变。」
- **同步作废注**：本文档 §6 AC-TL8 第二半（「点名档零残留（原锚串 grep）」）随 `test/doc-consistency.test.mjs` T76 删除而作废——第一半（doc-consistency 扫描器族在岗）不变。已就地加注。

### 11.6 受影响文件（as-of 2026-09-12）

**文档面**（本批设计侧落笔）

| 文件 | 现状（行数） | 增量 | 说明 |
|---|---|---|---|
| `docs/requirements/TESTING.md` | 74 | +56（已落——实测 130，含修正轮二 §5.1 C1-d + 分仓对齐） | §5 散文锚退役与禁令（F15–F22 / N10–N12） |
| `docs/requirements/PROMPT-SYSTEM.md` | 412 | +5（已落——实测 417，含修正轮二 §2·§2.5·§2.7 去锚表述） | §10.2 F-TD6 / §10.3 N-TD2·N-TD3 / §9.3 N-P1 四处去锚断言 + 机制面三处（修正轮二）+ 变更记录 |
| `docs/design/TESTING.md` | 411 | +374（本批已落——§11 全节 as-built **784** + 本档 2026-09-12 清零轮变更记录行 1 → 现档 **785**） | §11 全节 |
| `docs/design/ENGINEERING-MODE.md` | 2624 | ±6（本批已落） | AC75 / T95 退役注记 + 变更记录 |
| `TESTING（VSC 仓）` | 98 | +184（本批已落——实测 282，含修正轮二） | §8 本端执行面 |
| `docs/requirements/TESTING.md`（VSC 仓）（VSC 仓——修正轮二新建） | 新 | +87（实测） | VSC 端需求自持（F15–F22 / N10–N12——语义同源） |

**提示词面**（主 agent 内容权 + eng-coder 落笔——非本批设计侧落笔）

| 文件 | 现状（行数） | 增量 | 说明 |
|---|---|---|---|
| `src/prompts/discipline-engineering.md` | 229 | +2 | 测试纪律节（:29）加禁写句 |
| `docs/design/prompts/discipline-engineering.md` | 158 | +2 | 同上（双源） |
| `src/prompts/discipline-engineering.md`（VSC 仓） | 241 | +2 | 同上（VSC 端自持原文） |
| `docs/design/prompts/discipline-engineering.md`（VSC 仓） | 164 | +2 | 同上 |

**禁写句逐字形态（草案——内容权归主 agent；落笔 = eng-coder）**：

> **禁止新写散文锚**：读非测试档断言「某句在场 / 缺席」的测试一律不做（`includes` / 逐字子串 / 查句子的正则）；新增断言只写**行为面**（业务可观察结果）与**结构机检面**。

- 落点 = 4 档「测试纪律」节各加 1 条 bullet（CLI/VSC × 双源）；各端原文自持——措辞可按端微调、语义不变（不做 byte-identical）。
- 机检锚串（AC-PA6 用）：`散文锚`（4 档各 ≥1 命中、位于「测试纪律」节内）+ `行为面`（同条内）。

**测试面**（逐条删除；行数为**现状**，增量为**估算净减**——含连带常量 / import 清理；执行轮实测回填）

| 档（CLI） | 现状 | 预计净减 | 档（VSC） | 现状 | 预计净减 |
|---|---|---|---|---|---|
| `abort-provenance` | 190 | −22 | `activity-closure` | 302 | −5 |
| `acp-channel` | 265 | −8 | `activity-flow` | 461 | −19 |
| `advisor-chain-guards` | 498 | −8 | `activity-live-ux` | 173 | −10 |
| `advisor-context-budget` | 121 | −13 | `advisor-chain-guards` | 427 | −15 |
| `advisor-sync-accounting` | 116 | −2 | `advisor-context-budget` | 179 | −15 |
| `async-settle` | 424 | −11 | `advisor-guard-completion` | 341 | −11 |
| `attention-state` | 211 | −25 | `advisor-refusal-accounting` | 239 | −9 |
| `batch-segment` | 321 | −18 | `async-visibility` | 410 | −8 |
| `cmd-eng` | 86 | −9 | `batch-doc-gate` | 178 | −13 |
| `design-review-streak-guard` | 292 | −22 | `child-permission` | 533 | −27 |
| `doc-consistency` | 301 | −37 | `context-parity` | 386 | −18 |
| `eng-designer-role` | 342 | −50 | `digest-visibility` | 199 | −7 |
| `home-expansion` | 225 | −21 | `doc-consistency` | 196 | −3 |
| | | | `eng-designer-role` | 189 | −1 |
| `hooks-stop` | 256 | −3 | `index-perception` | 260 | −5 |
| `ledger-surface` | 362 | −23 | `ledger` | 255 | −16 |
| `ledger` | 176 | −21 | `portability-vsc-advisor-context` | 193 | −67 |
| `memory-scan-bounds` | 99 | −7 | `portability-vsc-classification` | 205 | −22 |
| `portability-advisor-context` | 134 | −67 | `portability-vsc-index` | 225 | −57 |
| `prompts-async-guidance` | 420 | −≈181 | `prompts-async-guidance` | 535 | −≈288 |
| `prompts-dual-source` | 404 | −≈151 | `prompts-mirror-anchors` | 383 | −≈132 |
| `session-store` | 400 | −9 | `setup-reminders` | 298 | −3 |
| `subagent-memory-bounds` | 113 | −14 | `status-line` | 182 | −21 |
| `tui-selection-surfaces` | 237 | −8 | `tool-descriptions` | 86 | −33 |
| `turn-across-segments` | 134 | −40 | `turn-across-segments` | 197 | −2 |
| `verify-redesign` | 153 | −20 | `verify-redesign` | 181 | −12 |
| | | | `webview-turnstate` | 329 | −2 |

- 档位注（R24）：本批**只减不增**，无新越档风险。VSC 两档存量越 500 硬限——`prompts-async-guidance` 535 → 预计净减 −288 ≈ 247（回落 500 内）；`child-permission` 533 → 预计净减 −27 ≈ **506，仍越 500 硬限**——本批不拆（拆档破坏删除清单集中度，与既有削段口径一致）→ **登记存量债**：归属 = 后续批次，随该档下次触碰出拆分计划（执行轮实测回填）。300 咨询线内不拆沿既有口径。
- 两仓均**无整档删除**——`test/files.mjs`（VSC 登记清单）零改；CLI 为 glob 自动发现，零登记动作。
- **与并行批的文件域重叠面（登记——不裁定分派）**：本批与 `2026-09-12-LEDGER-SELF-CONTAINED`（并行批）**都触提示词档**——CLI 侧 `src/prompts/discipline-engineering.md` + `docs/design/prompts/discipline-engineering.md`；VSC 侧同款两档（见 `TESTING（VSC 仓）` §8.5）。
  重叠面 = 同两档、不同节位（本批 = 测试纪律节禁写句；该批 = 台账维护条款面）。**两侧实施分派方式与两侧记录的互引形态规范不属本批设计裁定范围**（属并行批设计范围）。
- **本批两侧记录（登记）**：CLI 侧 = `../batches/2026-09-12-PROSE-ANCHOR-RETIRE.md`；VSC 侧 = `2026-09-12-PROSE-ANCHOR-RETIRE（VSC 仓）`——各持自身范围；互引形态规范不属本批裁定。

**端差登记（N-CL4「端差逐条登记不静默」——2026-09-12 修正轮补；两仓合并批 3 收窄为产品侧对位）**

| # | 端差 | 事实（实测） | 处置 |
|---|---|---|---|
| 1 | 台账机检脚本的本仓归属 | CLI 仓 `scripts/check-ledger.mjs`（L1–L3；默认台账清单 = 本仓 + 对端仓台账，缺则跳过不报）；**VSC 仓 `scripts/` 无该脚本**（实测 = `check-doc-width.mjs` / `check-syntax.mjs` / `publish-all.mjs`） | 本批零改（L1–L3 判据面不动）；该面 = **端差在册**（下条） |
| 2 | 结构机检面的端内构成 | CLI = `scripts/check-doc-width.mjs` + `scripts/check-ledger.mjs` + `test/doc-consistency.test.mjs` + slow 门；VSC = `scripts/check-doc-width.mjs`（**行宽 + 一致性 V1/V2/V3 单源**）+ `scripts/check-syntax.mjs`（`npm run lint`）+ `test/doc-consistency.test.mjs` + slow 门 | 本端执行面登记于 `TESTING（VSC 仓）` §8.2；判据面两仓零改 |

**指针与端差（2026-09-12 修正轮二——就地消解；两仓合并批 3 收窄为产品侧对位）**：本批原登记的两项已就地消解（用户 2026-09-12 05:11 裁定否决「延后对齐轮」处置）——
① **需求落点**：VSC 侧需求档已建（`docs/requirements/TESTING.md`（VSC 仓）——本端自持、语义同源）；两侧需求指针均指本仓档。
② **设计档互引**：本档 §11.4 → `TESTING（VSC 仓）` §8 为**对端执行面指针**（各端自持其清单）；VSC 侧设计档 §8 头注 → 本档 §11 为**共享语义源**指针（（CLI 侧）注记同款）——非「跨产品写需求」（原写需求禁令已随两仓合并批 3 退役；本批存量已按产品分列消除）。
③ **台账机检执行面**：端差在册（上表第 1 行）+ 本批零改、零新造脚本——不构成本批待办。

### 11.7 验收标准（AC-PA——逐条回指需求）

| AC | 标准（可机验） | 回指 |
|---|---|---|
| AC-PA1 | 对账：CLI 快层用例总数 645 → **574**（−71）· VSC 653 → **592**（−61）；两仓下降数 == 清单整删条数（口径详见下） | F16 / F21 / N10 |
| AC-PA2 | 清单逐条落地：点名的用例名（整删）/ 断言行（段删）实测零命中；被删用例名不出现在留存测试文本中 | F16 / F21 |
| AC-PA3 | 零误删：`test/**` 改动集 ⊆ 清单点名档；清单点名档内**保留用例名集不变**（段删档整档跑仍绿） | F18 / N12 |
| AC-PA4 | 保留面在岗：CLI `scripts/check-doc-width.mjs` / `scripts/check-ledger.mjs` 判据面 diff 空；VSC `scripts/check-doc-width.mjs`（宽 + V1/V2/V3）判据面 diff 空 + 本端台账机检判据零改（执行面端差见 §11.6）；V1/V2/V3 · L1–L3 · 行宽 · slow 门实测绿 | F17 / N11 |
| AC-PA5 | 发布门不降：CLI `lint → test:full → test:integration` 三门全绿；VSC 三环（`vscode:prepublish`）全绿 | N11 |
| AC-PA6 | 禁令落档：需求档 §5 子串在位（F15–F22 / N10–N12）；提示词双端 4 档测试纪律节含禁写句——机检锚串 `散文锚`（4 档各 ≥1；逐字形态见 §11.6） | F19 |
| AC-PA7 | T95 / AC75 退役注记在位（设计档 `ENGINEERING-MODE.md` §3.1 / §3.2 两处）；`test/ledger.test.mjs` T95 / AC49 原断言行零命中 | F22 |
| AC-PA8 | 双端同批：两仓清单同批落地；零新增跨仓同步依赖 / 零 byte-identical 断言（F20） | F20 |
| AC-PA9 | 零死代码：改动档 `node --check` 全通过；被删用例留存的孤立 helper / import / 常量零残留 | §11.3 常量面清理条 |
| AC-PA10 | 批级机检：两仓 `check-doc-width.mjs` 新增超宽 0 + 新增一致性违规 0（口径 = 批前 / 批后命中集合差——本批改动文件）；两仓快层全绿 | 批级 |
| AC-PA11 | 需求档分仓：`docs/requirements/TESTING.md`（VSC 仓） 在位（含 F15–F22 / N10–N12 标识与判据口径）；两仓需求指针各指本仓档——零「需求落 CLI 侧档 / 沿既有先例」类表述（grep 两仓设计档 + 批档） | 批级（R7 对齐） |

**AC-PA1 计数口径与命令**（两仓同口径）：快层执行面内 `test(` / `slow(` / `it(` **起始行**计数。

```bash
node -e "const fs=require('fs'),p=process.argv[1];let n=0;for(const f of fs.readdirSync(p).filter(x=>x.endsWith('.test.mjs')))n+=(fs.readFileSync(p+'/'+f,'utf8').match(/^\s*(?:test|slow|it)\(/gm)||[]).length;console.log(n)" test
```

- 批前基准（as-of 2026-09-12 实跑）：CLI **645** · VSC **653**（= §11.3 / §11.4 清单的对账基准）。
- **as-of / 口径注（2026-09-12 实施轮实测）**：CLI 实施轮实测 = 基线 **647** / 落点 **576**（+2 = SWEEP 批 T111/T112 先落；下降 **71** == §11.3 整删条数——**Δ 不变**：645→574 与 647→576 同式）；对账判据 = 下降数 == 整删条数（不依赖绝对基数）。

### 11.8 用例表（T-PA——执行轮自验）

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T-PA1 | 正常：对账 | 清单落地后跑 AC-PA1 命令（两仓） | CLI 574 / VSC 592（下降数 == 71 / 61） | AC-PA1 |
| T-PA2 | 正常：保留面 | 两仓 `check-doc-width` + V1–V3 用例 + 台账机检 L1–L3（执行面端差见 §11.6） | 绿；判据面 diff 空 | AC-PA4 |
| T-PA3 | 正常：发布门 | 两仓三门 | 全绿 | AC-PA5 |
| T-PA4 | 边界：段删残留 | 被段删的档整档跑 | 用例名集不变、行为断言仍绿 | AC-PA3 |
| T-PA5 | 边界：禁令落档 | grep 需求档 §5 + 提示词 4 档（锚串 `散文锚`） | 子串在位 | AC-PA6 |
| T-PA6 | 错误：对账反证 | 人为多删一个保留用例 | 下降数 ≠ 清单条数 → 红（非空转反证） | AC-PA1 / AC-PA3 |
| T-PA7 | 边界：T95 / AC75 退役注记 | grep 设计档两处 + 原断言行 | 注记在位 + 原断言行零命中 | AC-PA7 |
| T-PA8 | 错误：零死代码 | `node --check` 各改动档 | 全通过 | AC-PA9 |
| T-PA9 | 边界：双端纪律 | 两仓清单差异核对 | 各端独立落地；零跨仓同步依赖 / 零 byte-identical 断言 | AC-PA8 |
| T-PA10 | 正常：需求档分仓 | ①`docs/requirements/TESTING.md`（VSC 仓） 存在 + 含 F15–F22 / N10–N12 标识；②两仓设计档需求指针 grep | ①在位齐全；②各指本仓档、零跨仓需求指针 | AC-PA11 |

### 11.9 边界与待裁项

**边界（不做）**

- 保留面（V1/V2/V3 · L1–L3 · 行宽 · slow 门）的**语义与判据零改**；
- 台账本体内容治理 · slow 门阈值与归册纪律 · 行为测试的增删改；
- **既有 AC 中的锚式判据**不随本批清理（射程 = 已落地测试断言 + F22 两项）；新批 AC 判据按 F19 只写行为面 / 结构机检面；
- 不新增测试档、不改快 / 全两层入口与 VSC 登记清单。
- **本批零 UI / 交互决策**（测试面退役，无界面变更）——无 `open` 项；设计档 8 项中「UI/交互决策落档」项本批**不适用**（显式声明，非缺项）。

**待裁项裁定结果（2026-09-12 04:41 用户「可以」——三项全裁定，不留「待议」；修正轮落地）**

| # | 对象 | 裁定 | 落地 |
|---|---|---|---|
| 1 | **装配器 / 渲染出口传出的提示词句子断言**（CLI `portability-advisor-context` T-10/T-11/T-12 · `eng-designer-role` T32/T32b · `prompts-async-guidance` §3.2/§3.4 保留项；VSC `portability-vsc-advisor-context` T-V07–T-V10 · `eng-designer-role` T57 边界 · `prompts-async-guidance` §3.2/§3.4 保留项） | **已裁定：裁为锚 → 追加删除**——判据复归**实质**：断言对象是提示词句子即属散文锚，**不因「不读文件」而得豁免**（判据补充见 §11.1 C1-a） | 已落 §11.3 / §11.4 清单（两仓合计 **20 条：7 整删（CLI 3 + VSC 4）+ 13 段删（CLI 7 + VSC 6）**） |
| 2 | `locales/*.json` 文本值**逐字**断言 | **已裁定：保留**（PA-A2——产品资源面；判据补充 C1-d） | 不进清单（零改） |
| 3 | 工具 `description` 静态文案（CLI `settings` T-S2.24 / VSC `settings-tool` T-S2.35） | **已裁定：回退——保留**（工具 `description` = 发给模型的**产品契约面** → 契约守卫，非文档散文锁；判据见 §11.1 C1-b） | 已从 §11.3 / §11.4 清单**撤出**；对应档行（`settings` / `settings-tool`）随之下清单 |
| 4 | 跨仓引用（本档 §11.4 + VSC 侧设计档 §8 头注） | **已就地消解（2026-09-12 修正轮二）**——VSC 侧需求档已建（`docs/requirements/TESTING.md`（VSC 仓）——本端自持、语义同源）；两侧需求指针均指本仓档；设计档互引 = 跨端执行面指针（（CLI 侧）注记同款） | 落点见 §11.6 + `TESTING（VSC 仓）` §8.6 |

**跨批协调项（2026-09-12——SWEEP-FOLLOWUP 守恒锁）**：`../design/ENGINEERING-MODE.md` §2.27.4 的 `SPLIT_CASES = { async: 42, dual: 21 }`
（守则 = 同档 `:1248`「守恒锁守则」）锁定 `test/prompts-async-guidance.test.mjs`（42 例）与 `test/prompts-dual-source.test.mjs`（21 例）——
本批实施（§11.3 清单）裁掉两档散文锚「大头」→ **实施轮删除这两档用例时，同批重测用例数并同步 `SPLIT_CASES` 及其派生数值**
（五处同值面：设计档 §2.27.1 / §2.27.4 / AC57 / §3.2 T111 + 需求档 `../requirements/ENGINEERING-MODE.md` §1.15）——不得让 SWEEP 锁静默变红。
SWEEP 批先落（现盘 42 / 21 / 合计 63 成立——父侧 2026-09-12 05:12 裁定）。

> **supersede 注（2026-09-12 实施轮后）**：上句为 as-of 2026-09-12 05:12 的历史表述——本批实施已按守恒锁守则同批同步：**现锁 = `SPLIT_CASES = { async: 14, dual: 4 }`（合计 18）**（设计档 `../design/ENGINEERING-MODE.md` :1355 · 需求档 `../requirements/ENGINEERING-MODE.md` §1.15 已同步）；上句「42 / 21 / 合计 63」不再为现锁值。

**C1-a 复核登记（2026-09-12 实施轮评审 🟡——三候选保留；不扩删）**

实施评审点名三处「C1-a 清单筛漏候选」——`batch-segment` T49b · `advisor-chain-guards` T-CG6 · `home-expansion` T-H15（「保留半」）。逐条复核结论 = **保留**；**不据此扩大删除范围——新增范围须用户裁定**：

- `advisor-chain-guards` T-CG6（`test/advisor-chain-guards.test.mjs:192`）：保留半 = **信号补齐逻辑断言**（自愈分支：`## Approval Signal` 补齐 + token 字面 + designId 回显；含 round 0 幂等）——断言对象 = 守卫逻辑，**非提示词句子面**。
- `batch-segment` T49b（`test/batch-segment.test.mjs:214`）：段删面（读 `advisor-round1.md` 文本行）已落清；「双源」追溯措辞仅存于档头注 / 节注（同档 `:6` / `:210`——非断言面）；用例体余部 = 适用面条件断言（`AC31/AC35` 注册面）——保留。
- `home-expansion` T-H15（`test/home-expansion.test.mjs:189`）：段删块（`README` L1–L4 逐字块）已落清；「L1–L4 逐字命中」追溯措辞仅存于用例名内（名集冻结——非断言面）；用例体余部 = `README` 示例值驱动的展开行为断言——保留。

### 11.10 关键决策记录

| # | 决策 | 否决备选 | 理由 |
|---|---|---|---|
| D-PA1 | 逐条删除清单制 | 按档删 / 标签门控 | §11.2 |
| D-PA2 | 保留面 = **封闭枚举**（**F17 封闭枚举**所判属性） | 「凡计数 / 序 / 形态断言皆结构」宽解 | 宽解会把对非测试档文本的出现计数一并留下——与判据 ② 直接冲突；且约束 5 要求防回潮负向锚逐条判定（默认可删） |
| D-PA3 | **载体判据**（C1）——按被断言文本的载体判 | needle 原产地判据 | 原产地判据会把**全部含消息文案的行为断言**卷进删除集（消息字面量均源于 src）——与 F18「混装档只删锚断言、行为用例一律保留」直接冲突 |
| D-PA4 | `import` 取到的 src **静态文案字面量**计入判据 ① | 视为「运行产物」豁免 | 静态字面量不是执行产物；豁免会留下「改一字即红」的同一病灶 |
| D-PA5 | `doc-consistency` `RETIRED_STRINGS`（18 条）/ `ledgerClosure7` **逐条判定 = 散文锚 → 删** | 默留（作为防回潮面） | 每条 = 读非测试档 + 断言其文本缺席（判据①②③全中）；约束 5 明令逐条判定、不得默留 |
| D-PA6 | T75（退役提示词文件未复活——`existsSync`）**保留** | 一并删 | 判据 ② 不成立（非文本在场/缺席）；它断言的是文件存在性即系统状态，非句子——亦本批唯一存活的防回潮面 |
| D-PA7 | T95 / AC75 = **就地退役注记（保号）** | 删行 / 保留断言 | 删行会让别处引用悬空（D4）；保留断言违 R5 |
| D-PA8 | 两仓**无整档删除** → VSC `test/files.mjs` 零改 | — | 事实结论（2026-09-12 实施轮实测更正）：除 `portability-advisor-context`（4 例全删 → 留档头退役注记的空壳——保壳留痕；注见 §11.3）外，每档均有保留用例（见 §11.3 / §11.4 档计数） |
| D-PA9 | **提示词句子不豁免**（C1-a——PA-A1 修正轮）：断言对象是**提示词句子**（含装配器 / 渲染出口传出、不读文件者）即属散文锚 | 「执行产物 = 不命中 ①」宽豁免 | 豁免会留下「改一字即红」的同一病灶（装配产物句子改了同样导致错位维护）——与 R1「散文锚一律不做」相悖；用户 2026-09-12 04:41 裁定 |
| D-PA10 | **工具契约面与工具返回文案保留**（C1-b——PA-A3 修正轮） | 按 C1「import 静态文案字面量」分支整删 | 工具 `description` / 参数说明 = 发给模型的**产品契约面**（工具契约对象）——锁它属**契约守卫**，非文档散文锁；读 `src/**` 源码档文本仍命中 ① |
| D-PA11 | **需求分仓**（2026-09-12 修正轮二——用户当日裁定「涉及 VSC 的文档必须在 VSC 仓写」）：VSC 侧需求自持于 `docs/requirements/TESTING.md`（VSC 仓）；本档需求面去代立规 | 维持单档承载（原「已登记依赖——未消解」处置） | 跨仓写需求违 R7（各仓自持）；依赖就地消解、不挂对齐轮（用户否决「以后再说」处置） |

### 变更记录（本批）

- 2026-09-12（**修正轮二——设计评审轮次 1 落修 #1–#8 + 追加 #9/#10**；只落直接导出的修正、零新语义）：
  §11.1 增 **C1-d**（locales 资源文本保留——PA-A2）+ C3 改指 **F17 封闭枚举**（#8）· C2 标注（#5）·
  §11.3 **T95 行界更正 124-134** + AC49 行界 136-145（#7）· §11.4 登记项计数 63 + 需求面登记（#9）·
  §11.5 行界同步 · §11.6 **禁写句逐字形态（草案——内容权归主 agent）** + 依赖**就地消解** + 档位算式更正（#2）·
  §11.7 AC-PA6 机检锚串（`散文锚`）+ **AC-PA11**（需求档分仓）· §11.8 T-PA5/T-PA10 ·
  §11.9 PA-A1 拆分更正（**7 整删 + 13 段删**——#6）+ locales 裁定行改指 C1-d + 跨仓引用行**就地消解** + **跨批协调项（SWEEP-FOLLOWUP 守恒锁）**（#10）·
  §11.10 D-PA2 枚举引用对齐（#8）+ **D-PA11**。
- 2026-09-12（**修正轮**——批次档 §1「待裁项裁定与缺陷处置（04:41）」逐条落地）：
  - §11.1 增**判据补充 C1-a / C1-b / C1-c**（提示词句子不豁免 · 工具契约面保留 · 非句子对象保留）。
  - §11.3 追加 10 条（`portability-advisor-context` T-10/T-11/T-12 整删 · `eng-designer-role` T32/T32b 段删 · `prompts-async-guidance` §3.2/§3.4 段删 5 条），并**撤出** `settings` T-S2.24（PA-A3 回退）；段删计数更正（实计 22，声明曾为 21——含本轮追加共 29）。
  - §11.4 同步 VSC 侧计数与差额（61 整删 + 40 段删 = 101 条）。
  - §11.6 新增**端差登记**（台账机检脚本本仓归属 / 结构机检面端内构成）与**已登记依赖——未消解**（对端引用 vs 并行批 R1/R7）。
  - §11.7 AC-PA1 对账数重算（CLI 574 / VSC 592）· AC-PA4 端差细化；§11.8 T-PA1/T-PA2 同步。
  - §11.9 待裁项改**裁定结果**（三项全裁定）；§11.10 增 D-PA9 / D-PA10。
  - 需求侧同步 = `../requirements/TESTING.md` §5.1 判据补充 + F17 工具契约面（同一裁定同源）。
- 2026-09-12（散文锚退役批——PROSE-ANCHOR-RETIRE）：新增 **§11**（判据执行版 + 口径裁定 C1–C5 / 方案选型对比 + 粗筛→逐条差额对账 / **逐条删除清单 CLI 71 整删 + 29 段删 · VSC 61 整删 + 40 段删**（修正轮后实测）/ T95 + AC75 处置 / 受影响文件 / AC-PA1–AC-PA10 / T-PA1–T-PA9 / 边界与待裁项 / 决策 D-PA1–D-PA8）；§6 AC-TL8 第二半作废注；
  需求侧同步 = `../requirements/TESTING.md` §5（F15–F22 / N10–N12）+ `../requirements/PROMPT-SYSTEM.md` 四处判据面去锚（F-TD6 / N-TD2 / N-TD3 / N-P1）。清单外断言零触碰（F18 / N12）。
- 2026-09-12（台账自持批·**基线清零 + 闸门收紧轮**——用户 11:06「残留即先例」裁定）：修 **§11 受影响文件表遗留**——本档行增量格原记「+361（本批已落——实测 772）」，与 as-built 不符 → 改为 **§11 全节 as-built 784（+373）+ 本行 1 = 现档 785**（PROSE 批 §6 遗留①销项）；本行即该 +1。

## 12. CLI 自动验证面（端到端 harness——E2E-HARNESS 批 · 2026-09-14）

> 需求依据：`../requirements/TESTING.md` §6（F23–F28 / N13–N18）。任务书 = `docs/batches/2026-09-13-CORE-UNIFICATION.md` §2。
> 来源：用户 2026-09-14 立项裁定「可以」+ 方案采定（② ACP harness + ③ 伪 isTTY 补充）；缘起与硬约束实核见需求档 §6 引。
> 一句话：以真子进程驱动 CLI 真入口，**ACP 协议面 + 伪 TTY 交互面**两张驱动面并用；TUI 渲染留人工真机。

### 12.1 问题与现状

- **缺环（本批要补的）**：CLI 的 TTY 依赖面在真无 TTY 环境不可自动验证——**四处** stdin 守卫
  （`src/cli/permission.mjs:35` · `src/cli/distill-command.mjs:40` · `bin/thincoder.mjs:157` · `src/tui/index.mjs:74`）在管道环境恒走降级分支 ⇒ 交互路径（权限 y/n 等）**现只能人工**；
  前三处 = 人机问答面（接缝目标——§12.4）；末一处 = TUI 接管硬门（保持直读——豁免，§12.4）；
  ACP 协议面亦无进程级全链用例——既有 ACP 测试为 in-process 面（假 notify/request 捕获，零子进程，`test/acp-channel.test.mjs:5-7`），集成集内 ACP 零命中（本设计轮 grep 实核）。
- **已有基础（复用面）**：真进程驱动先例 = `test/integration/config-provider-routing.test.mjs`（伪 HOME + 真 `bin/thincoder.cjs` 子进程 + 本地 mock——`:7` 驱动句 · `:20` 入口 · `:38-50` 驱动器）；脚本化 provider = `test/helpers/mock-llm.mjs`（SSE 端点，含 toolCall 步——零改复用）。
- **本批不做**：TUI 渲染 / 画布（人工真机）；真端点上云（smoke 独立在册——`test/smoke-qwen-thinking.mjs` 类）。

### 12.2 方案选型对比

判据：①目标契合（真进程全链）②覆盖面（协议/会话 vs 命令/交互）③零 TTY 可行 ④确定性（脚本化 provider / 无外网）⑤零新增依赖 ⑥成本（驱动件与维护面）⑦与 S2 验证链接口（走既有集成集）。

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | ACP 驱动单用 | ①✓ 真子进程跑 `thincoder acp` ②半（协议/会话/权限往返齐；CLI 本地命令面与本地 y/n 提示不在协议内）③✓ ④✓ ⑤✓ ⑥低（一个客户端件） | 覆盖漏面 = 命令行与本地交互分支 | 否决（单用） |
| 2 | 伪 isTTY+管道单用 | ①✓ ②半（命令面/本地权限 y/n 齐；ACP 协议面与结构化会话断言缺——chat 路径断言仅 stdout 文本）③✓（缝机制见 §12.4）④✓ ⑤✓ ⑥低 | 覆盖漏面 = 协议/会话面 | 否决（单用） |
| 3 | 两者并用 | ①✓ ②✓（并集：ACP 担会话/协议面 + 伪 TTY 担命令/交互面）③✓ ④✓ ⑤✓ ⑥中（两套驱动件 + 两张夹具面） | 成本 = 两驱动件；收益 = 覆盖并集 | **选定**（用户 2026-09-14 采定 ②+③） |
| 4 | PTY 方案（node-pty） | ③✗ ⑤✗（原生模块） | 硬约束排除 | 否决——本机 `cl.exe` / `node-gyp` 不可用；Node 内置不能创建 pty（实核：无 TTY 下 `new tty.ReadStream(0)` 抛 `ERR_TTY_INIT_FAILED`） |
| 5 | 模块级 in-process 直驱（现状形态） | ①✗ | 不满足「真 CLI 起来」目标（真进程行为 / 退出码 / 分流不经此面） | 否决（不补环） |

### 12.3 架构与接口契约

**驱动面（两张）与落点**

| 面 | 驱动 | 覆盖 | 落点（拟——实现轮落名） |
|---|---|---|---|
| A · ACP | 真子进程 `thincoder acp` + stdio NDJSON 帧 | initialize / authenticate · session/new · prompt 全回合（流式更新 / 工具 / 权限往返 / 取消） | `test/integration/e2e-*.test.mjs`（通配形态） |
| B · 伪 TTY | 真子进程 `bin/thincoder.cjs` + 伪 HOME/cwd + stdin 管道（测试期覆盖见 §12.4） | 非 TUI 命令行（argv / 退出码 / 分流）· 权限 y/n（chat 路径——`bin/thincoder.mjs:205`）· 降级分支对照 | 同上（通配形态） |

**驱动件（测试侧，`test/helpers/` 新建——拟名）**：

- `cli-process.mjs`（拟名）：进程驱动——`startCli({ args, home, cwd, env })`：真入口 spawn · 隔离伪 HOME/cwd（临时目录 + 自持 config.json——形态承 `test/integration/config-provider-routing.test.mjs:23-50`）· stdout/stderr 收集 · deadline 硬杀 + 可读超时句 · 返回退出码/输出。
- `acp-client.mjs`（拟名）：最小 ACP 客户端（stdio 行协议）——请求 / 通知收发 · 按 id 配对 · reverse-RPC 应答器注入（权限 / fs 面脚本化）· 帧全量留档（断言面）。
- 复用（零改）：`test/helpers/mock-llm.mjs`（56 行——脚本化 SSE + toolCall 步；**多轮步进原生支持**——按 `script` 数组逐请求步进（`:14`），两步脚本（toolCall → text）即 T-E2E10 所需，实核 `:5-14`）。

**数据流**：

```
测试进程 → spawn node bin/thincoder.cjs …（伪 HOME/cwd 隔离）
  ├─ A 面：ACP NDJSON（stdin/stdout）⇄ 会话 / 回合 / 权限往返
  └─ B 面：stdin 管道（应答）⇄ 交互命令
CLI → provider = 本地 mock（127.0.0.1，脚本化 SSE）→ agent 循环
断言面 = 协议帧 / stdout / stderr / 退出码 / 夹具工作区产物
```

**ACP 对外形态（引用——实现轮按此断）**：

- 方法面 = initialize / authenticate / session/new / session/prompt / session/cancel / session/close（M1）（`src/acp.mjs:6-8` 声明 · `src/acp.mjs:117-206` 实现）；
- reverse-RPC = `session/request_permission` + `fs/*`（`src/acp/bridge.mjs:11-14`）；
- 回合终 = prompt 返回 `{ stopReason: "end_turn" }`（`src/acp/bridge.mjs:19-20`）；取消 = `{ stopReason: "cancelled" }`（`src/acp.mjs:182`）；
- 未认证 = `-32000 authRequired`（`src/acp.mjs:131` · `src/acp.mjs:171`）。

### 12.4 与四处 TTY 守卫的关系（机制裁定：注入缝）

| 守卫 | 语义 | 处置 | 理由 |
|---|---|---|---|
| `src/cli/permission.mjs:35` | 「stdin 能否承担人机问答（y/n）」 | **接缝**（改经谓词 `stdinIsTTY()`） | 问答流可被管道喂答——伪 TTY 的正当目标面 |
| `src/cli/distill-command.mjs:40` | 「能否进交互式 wizard」 | **接缝**（同上） | 同类问答面（降级分支保留为对照组） |
| `bin/thincoder.mjs:157` | 「（无 key 时）能否进交互式配置向导」 | **接缝**（同上） | 与 distill 守卫字面同族（同一 `!provider.apiKey` → `setupWizard()` 判定）；wizard 本体 = 管道可喂答形态（`src/cli/setup-wizard.mjs:7-8`——头注即以管道输入为支持场景） |
| `src/tui/index.mjs:74` | 「能否接管终端（raw mode / 尺寸）」 | **不接缝**（保持真 TTY 硬门） | 伪 TTY 下 setRawMode / 尺寸不存在 = 不可发生态；TUI 渲染面留人工真机——以结构机检锚定 |

**机制裁定**：前三守卫（permission / distill / chat-wizard）改经**单谓词**（新档 `tty.mjs`（拟名）的 `stdinIsTTY()`——env 门 `THINCODER_TEST_FAKE_TTY=1` 覆盖为 true；缺省 = 原语义）；TUI 守卫保持直读、零接缝。

**「注入缝」优先于「脚本自行伪造属性」——建议与理由**：

1. 仓内既有约定：env 门测试缝是既定工艺——`bin/thincoder.mjs:84-90` 三缝（`THINCODER_TEST_CRASH` / `THINCODER_TEST_TUI_ACTIVE` / `THINCODER_TEST_CLEANUP_OUT`）
  + `THINCODER_TEST_FULL` / `THINCODER_SLOW_GATE_MS` 同族；**属性伪造作测试缝工艺无先例**——仓内唯一同手法 = `test-startup.mjs:46`
  （`Object.defineProperty(process.stdin, "isTTY", …)` + `:47` `setRawMode` 覆盖）＝启动黑屏手工 repro 脚本的一次性取巧，非测试套件内缝工艺（不入集成集、无断言纪律）。
2. 语义诚实：守卫问的是「能否交互」（策略判定），非「stdin 是不是终端」（传输事实）——谓词把判定收成命名单点、契约显式。
3. 可机检（fail-closed）：直读枚举可写死为 {谓词档 1 处 + TUI 守卫 1 处（豁免）}——新增直读即红；属性伪造面无可检之物。
4. 入口路径全继承：env 天然随 spawn 链下传；`--import` 旗标须逐 spawn 接线（漏加 = 静默走真分支、无红）。
5. 失败面收窄：伪造属性让「无 TTY 却 isTTY=true」扩散到一切读点（含未来新增——静默误入交互分支）；缝只影响经谓词的判定。

**实核登记（本设计轮实跑——供评审复核）**：

| 探针 | 读数 | 结论 |
|---|---|---|
| 管道 stdin 下 `process.stdin.isTTY` | `undefined` | 基线 |
| 管道下赋值 `= true` | 生效（`isTTY=true`） | 属性伪造机制可行 |
| `--import` 预载赋值 | 生效 | 同上 |
| 无 TTY 下 `new tty.ReadStream(0)` | 抛 `ERR_TTY_INIT_FAILED` | pty 路线排除 |

⇒ 两机制今天**都可行**——否决属性伪造 = **设计面裁量**（上列 1–5），如实登记（可行性面不构成否决理由）。

**结构机检（实现轮落测试，fail-closed）**：扫描域 = 仓内代码档（`src/**` · `bin/**` · `test/**` · `scripts/**` · 仓根 `*.mjs`；`docs/**` 引述文本不入）。
改动后 `process.stdin.isTTY` 直读枚举 = {谓词档（`tty.mjs`——拟名，落点见 §12.7 清单）：1 处；`src/tui/index.mjs:74`：1 处（豁免——真终端硬门）}；三守卫（permission / distill / bin-chat wizard）经谓词、零直读；谓词缺省（无 env）= 原语义（行为用例对照：无 env + 管道 ⇒ 权限路径仍走 `[deny]` 降级）。
**排除口径（非直读用法——不计入枚举，防误红）**：① 属性写点 `test-startup.mjs:46`（`Object.defineProperty(process.stdin, "isTTY", …)`——测试面手工 repro 脚本的属性伪造写点；其文本不含 `process.stdin.isTTY` 子串，直读形态扫描天然不命中；宽形态（仅 `isTTY`）须显式排除该写点）；② 文档面引述（设计 / 需求档文本）与扫描器自身文件（实现轮自命中排除）。

### 12.5 接入点与分层关系

- **落点 = `test/integration/`**（集成集）——`test/run-integration.mjs:5-6` 单层 glob `test/integration/*.test.mjs` 自动收揽（`:17` 执行行）；`npm run test:integration`；发布门第三步骤已接线（`scripts/release-check.mjs:81-83`）⇒ **零 runner / 零脚本 / 零 package.json 改动**。
- **慢用例归册语义**：harness 用例 = 重 IO 面（真子进程 + 网络回环 mock）——归册落点 = **集成层**（而非快层 + `slow()` 标记）：集成档不在 slow 门执行面、**不得用 `slow()`**（设计 §4.3 红线——`test/run-integration.mjs:6-8` 注）；快层（`npm test`）与全量（`test:full`）目标集合 = `test/*.test.mjs` 单层 glob ⇒ 集成档天然不进——**集合零变**。
- **与既有集成档分工（不重复纪律）**：既有 7 档各有其面（配置选路 · 普通工具流 · TUI 基本盘 · 会话恢复 · 子代理生命周期 · commit·verify 关口 · 工程模式链——清单见 `test/integration/`）；本批新增 = **补两处未覆盖面**：① ACP 协议面进程级全链；② TTY 依赖的交互路径（权限 y/n 等）——非既有档改写镜像（断言对象不同：协议帧 / 交互应答 vs 各档现面）。

### 12.6 覆盖边界（写死）

**能测（逐条——实现轮用例表逐条落）**：

| # | 能力 | 驱动 | 机验判据 |
|---|---|---|---|
| 1 | CLI 真入口 argv 分发 / 退出码 / stdout-stderr 分流 | B | 退出码 + 分流断言 |
| 2 | ACP 握手（initialize / authenticate） | A | 响应字段（protocolVersion / authMethods / authenticated） |
| 3 | ACP 会话全链（session/new → prompt → end_turn） | A | 帧序（session/update 流）+ `stopReason=end_turn` |
| 4 | ACP 工具调用 + 权限往返（approve / reject） | A | `session/request_permission` 往返 + 工具执行产物 / 拒执行 |
| 5 | ACP 取消（session/cancel） | A | `stopReason=cancelled` + 进程超时内收束 |
| 6 | ACP 错误面（未认证 / 坏行 / 未知方法 / 缺参数） | A | `-32000` · `-32600` · `-32601` · `-32602` |
| 7 | 权限 y/n（chat 路径——批准 / 拒绝） | B | 工具产物在/不在 + 回合收束；**拒句观测面 = mock 侧下一轮请求体**（`test/helpers/mock-llm.mjs:8` / `:13` 的 `requests`——denied 早退不经 stdout/stderr，实核 `src/agent/dispatch.mjs:324-336`） |
| 8 | 降级分支对照（缝未开 = 现行为） | B | `[deny]` 降级路径在位（缺省零行为变） |
| 9 | 夹具隔离（HOME/cwd 重定向） | A+B | 断言只碰临时域（零真实配置读写） |

> **与 F19 禁写散文锚的相容口径**（承 §11.1 C1 载体判据）：§12 内「可读拒句 / stdout 关键行 / 协议帧 / mock 请求体」类断言的对象 = **执行产物**（子进程输出 · 协议帧 · 测试自建临时域；含工具返回 / 拒绝文案——C1-b）——断言执行产物不命中判据 ① ⇒ 非散文锚、属 F19 允许的行为面。

**不测（明确排除）**：

- **TUI 渲染 / 画布 / 按键交互**——人工真机（用户自有终端）；harness 不驱动 TUI 入口（入口 wrapped-spawn 包装且父挂起——`bin/thincoder.mjs:35-37`——不适合外部接管）。
- 真付费端点 / 真实 provider（smoke 独立在册）。
- Windows ConPTY / 终端尺寸类平台行为（真机人工）。
- VSC 侧对位（本批仅 CLI）。

### 12.7 受影响文件（as-of 2026-09-14 · 落笔前读数 + 现档实测回填）

| 文件 | 现状行数 | 预计增量 | 变更 |
|---|---|---|---|
| `src/cli/permission.mjs` | 49 | +2 / −1 | 守卫改经谓词 `stdinIsTTY()` |
| `src/cli/distill-command.mjs` | 92 | +2 / −1 | 同上 |
| `bin/thincoder.mjs` | 415 | +2 / −1 | 同上（chat 无 key wizard 守卫——同族接缝） |
| `test/helpers/mock-llm.mjs` | 56 | 0 | 复用（两步脚本 toolCall→text 原生支持——实核 `:5-14`；零增强） |
| `docs/requirements/TESTING.md` | 130 | +47（本批已落——现档 **177** · 2026-09-14 实测） | §6（F23–F28 / N13–N18） |
| `docs/design/TESTING.md` | 786 | +194（本批已落）+ 评审修正轮净增——现档 **995** · 2026-09-14 修正轮后实跑 | §12 全节（含修正轮） |

**新建档（拟名——实现轮落；具体名以实现轮为准）**：

```
src/cli/tty.mjs                       谓词 stdinIsTTY()（env 门 THINCODER_TEST_FAKE_TTY）
test/helpers/cli-process.mjs          进程驱动器
test/helpers/acp-client.mjs           最小 ACP 客户端
test/integration/e2e-acp-session.test.mjs    A 面：握手 / 会话 / 权限 / 取消 / 错误
test/integration/e2e-interactive.test.mjs    B 面：权限 y/n + 降级对照
test/integration/e2e-cli-surface.test.mjs    命令行面：argv / 退出码 / 分流
```

**新建档预计规模**（实现轮实测回填）：`tty.mjs` ≈8 行 · `cli-process.mjs` ≈120 行 · `acp-client.mjs` ≈140 行 · `e2e-acp-session` ≈200 行 · `e2e-interactive` ≈110 行 · `e2e-cli-surface` ≈70 行——预计均在 300 软线内（无越档预判）。

**不变量（零改，机检锚定）**：`src/tui/index.mjs`（483 行——TUI 守卫保持直读；结构机检豁免点，见 §12.4）。
**零改面（登记）**：`test/run-integration.mjs` · `test/run-fast.mjs` · `test/run-full.mjs` · `scripts/release-check.mjs` · `package.json` · 仓根 `scripts/**`（三机检）· 快层 / 全量目标集合。

### 12.8 验收标准（AC-E2E——逐条回指需求）

| AC | 标准（可机验） | 回指 |
|---|---|---|
| AC-E2E1 | 集成新档在岗（通配枚举）；`node test/run-integration.mjs` exit 0——新档全绿 | F23 / F24 / F25 / F28 |
| AC-E2E2 | 驱动面结构：新档经**真子进程**驱动（驱动路径零 import 业务模块——结构断言；断言字面 = 协议 / 文案面） | F23 |
| AC-E2E3 | 零新增依赖：`package.json` 依赖面零变 + 仓内零原生 `.node` 模块（机检） | N13 |
| AC-E2E4 | 零 TTY 可跑：全部新档在当前无 TTY 环境跑绿（实测读数入批次档 §5） | N14 |
| AC-E2E5 | 确定性：全部新档 provider 一律本地 mock（结构断言）+ 重复执行一致（复跑读数） | N15 |
| AC-E2E6 | 时长与超时保底：驱动器 deadline 实现——**单用例硬超时 ≤30s**（超时 ⇒ 可读失败句 + 非零退出）；全档墙钟实测 ≤3 分钟（读数入批次档 §5） | N16 / N17 |
| AC-E2E7 | 分层零混入：`npm test` / `test:full` 目标集合零变；新档零 `slow(`（源码断言）；只在 `test:integration` 收录 | F28 / N18 |
| AC-E2E8 | 守卫不变量：结构机检在位——直读枚举 = {谓词档 1 处 + `src/tui/index.mjs:74` 1 处（豁免）}；permission / distill / bin（chat wizard）三守卫零直读（枚举与排除口径 = §12.4）；缺省零行为变（行为用例） | N13 / §12.4 |
| AC-E2E9 | 失败可诊断：断言失败输出含现场——子进程退出码 + stderr 尾段 + 协议帧 / 管道输出尾段（驱动件输出构造契约；反证用例：受控超时 / 失败探针 ⇒ 三要素在场、无静默挂起） | N17 |
| AC-E2E10 | 覆盖边界写死落实：§12.6「能测」9 行逐条有 ≥1 用例承载（行 ↔ 用例映射 = 实现轮用例表逐条落）；「不测」面零驱动（结构断言：新档零 `src/tui/**` 引用） | F26 |

### 12.9 用例表（T-E2E——正常 / 边界 / 异常）

| # | 态 | 输入 / 驱动 | 预期输出（判据） | 回指 |
|---|---|---|---|---|
| T-E2E1 | 正常 | A：initialize → authenticate → session/new → prompt（mock 单行回复） | 帧序（initialize 响应 / session/update 流）+ `end_turn`；退出 0 | F24 |
| T-E2E2 | 正常 | A：prompt 触发工具（mock toolCall 步——写夹具档）→ 客户端回 `approve_once` | 权限往返发生；夹具产物出现；`tool_call_update` completed | F24 / F25 |
| T-E2E3 | 边界 | A：同 T-E2E2 但回 reject | 工具未执行（零产物）；回合照常 `end_turn`；回执可读 | F25 |
| T-E2E4 | 边界 | A：prompt（mock delay 步）中途 `session/cancel` | `stopReason=cancelled`；进程超时内收束（零挂死） | F24 / N16 |
| T-E2E5 | 异常 | A：未 authenticate 即 session/new；坏行；未知方法；prompt 缺 text 块 | `-32000` / `-32600` / `-32601` / `-32602`——进程不崩栈 | F24 |
| T-E2E6 | 正常 | B：`chat` + mock toolCall + 管道喂 `y` | 工具执行（产物出现）；退出 0；stdout 回复透传 | F25 / F23 |
| T-E2E7 | 边界 | B：同 T-E2E6 但喂 `n` | 拒执行（零产物）+ 拒句观测 = **mock 下一轮请求体含 `Error: permission denied by user`**（`src/agent/dispatch.mjs:331-332`——denied 早退、不经 `callbacks.onToolResult`，chat 路径无 stdout/stderr 文本可判）+ 回合收束（退出 0） | F25 |
| T-E2E8 | 边界 | B：**对照组**——缝未开（无 env）+ 管道 | 权限路径走 `[deny]` 降级（现行为零变——缝缺省证明） | N13 / §12.4 |
| T-E2E9 | 正常 | B：`-v` / `--help` 等命令行面（隔离 HOME） | 退出码 0 / stdout 关键行；零副作用 | F23 |
| T-E2E10 | 异常 | A：ACP 会话内连续两轮 prompt（mock 两步脚本） | 队列串行（第二回合在首回合 `end_turn` 后收帧）；帧序无交错 | F24 / F27 |

### 12.10 关键决策记录

| # | 决策 | 否决备选 | 理由 |
|---|---|---|---|
| D-E1 | 采「ACP + 伪 TTY」两驱动面并用 | 单面 · PTY · 模块级直驱 | §12.2（用户 2026-09-14 采定 ②+③） |
| D-E2 | 伪 TTY 机制 = 产品侧 env 门单谓词缝 | 脚本伪造属性（`--import` 预载） | §12.4 理由 1–5（可行性已实核——裁量在设计面） |
| D-E3 | TUI 守卫不接缝（真 TTY 硬门）+ 结构机检锚定 | 守卫一律接缝 | 伪 TTY 下 TUI 接管 = 不可发生态；渲染面人工真机（用户裁定） |
| D-E4 | 落点 = `test/integration/`（零 runner 改动） | 新 runner / 快层 + slow | §12.5；集成集纪律（F12 / 设计 §4.3） |
| D-E5 | 断言字面 = 协议帧 / 进程输出 / 产物（零 import 业务模块） | 复用模块内部 API | e2e 纯度（F23——真进程面）；不重复纪律（§4.5） |

### 12.11 边界与待裁项

**边界（不做）**：TUI 渲染（人工真机）· pty / 原生模块 · 真付费端点 · VSC 对位（后续裁定）· 快层 / 分层机制改动 · 不引入新入口 / 脚本。

**待裁 / 未决（实现轮前须定或随轮登记）**：

1. 缝的环境变量命名与覆盖面（`THINCODER_TEST_FAKE_TTY`——只覆盖 stdin 判定；stdout 面本批零读点不改）——评审 / 用户可改。
2. TUI 守卫不接缝的结论——若用户希望 TUI 也自动驱动，须另设计 pty 面（本批硬约束下不可行）。
3. 时长预算 3 分钟的校准（首发实测后按读数收正）。
4. VSC 对位面（F14 双端实例化口径是否要求对端同期设立）——本批 CLI-only，待父侧 / 用户裁定。

**修正轮关闭项**：原「mock 多轮步进是否够用」——实核 `test/helpers/mock-llm.mjs:5-14`：按 `script` 数组逐请求步进（`:14` `script[Math.min(i++, script.length - 1)]`），两步脚本（toolCall → text）原生支持 ⇒ 判定「够用」，不再列待裁（2026-09-14 评审修正轮）。
