# 测试基建（TESTING）

> 板块：测试基建——slow 门机制、测试分层纪律（L0/L1/L2）、测试库存治理、测试生命周期与集成集（§3 起——2026-09-11 TEST-LIFECYCLE 批）。
> 权威源：`test/slow.mjs` + `test/slow-gate.mjs` + `test/run-fast.mjs` + `test/run-full.mjs`（分层执行入口）+ `test/run-integration.mjs`（集成集执行入口），`package.json` scripts。
> 关联：本文档 §1 是分层纪律（L0/L1/L2）的权威叙述（原 AGENT-LOOP §18.7 已迁此）；工程模式实现侧分级正文 = `src/prompts/persona-eng-coder.md` + `discipline-engineering.md`（模型侧实际拿到的分级正文——旧 engineering-sub.md 已随 PROMPT-SYSTEM 施工①退役）；仓库根 `AGENTS.md`（本项目的两分层测试政策与 smoke 说明）；VSC 对位档 = `TESTING（VSC 仓）`（本批新建——语义同源、各端原文自持）。
> 状态：**机制已落地并维持当前态**。分层纪律（L0/L1/L2）+ slow 门机制仍生效；2026-09-07 存量测试库存按"按需加"政策清零，测试随机制需要按需补（详见 §2）；2026-09-11 扩展测试生命周期与集成集（§3 起——设计已落，实施随本批）。


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

- **落笔时机 = 无冻结窗口冲突时（父侧排程）**：`ENGINEERING-MODE.md` 面他批在飞（ROLE-REDEFINITION 设计评审在途）——按 D5 冻结窗口纪律与 PORTABILITY 先例，本批设计期不触碰；落笔随排程执行。

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
| 3 | `test/` 内标签分族（`integration()` 门控 + 同域文件） | ①两类寿命混域——扫①删除清单须逐档 discriminate；标签漏标 = 误退/漏退（处置靠"记得标"）②同域 ③`test:full` "全量"语义被污染；slow 门与集成门两套 skip 叠加 ④同域 ⑤`files.mjs` 须分两类清单 ⑥同域 | 与 slow 门先例貌似同构——但 slow = 执行层门控（同一断言两面），集成 = 寿命分界（不同断言集）——机理不同 | 否决 |

**对照 slow 门先例（§1.2"为什么不用目录分层"）**：该注针对**快/慢同一断言双执行面**（防漂移）；①/②③ 是**不同断言集的不同寿命**——没有"防漂移"要保护，反而制造"处置边界靠自觉"的失稳点。隔离靠**域界**（机械可判），不靠**标记**（靠记得）。

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
| 目标集合 | glob `test/integration/*.test.mjs`（单层——沿本仓 runner 惯例） | 显式清单 `test/integration/files.mjs`（沿本端"登记即跑"惯例） |
| 入口 | `test/run-integration.mjs`（npm script `test:integration`——启动器形态沿 `run-full.mjs`） | 同款 |
| env 门 | 无（执行面 = 入口本身）；集成档**不得**用 `slow()`（无快层执行面） | 同 |
| 发布门接线 | `scripts/release-check.mjs` 步骤 +1（lint → test:full → test:integration；失败详情提取沿现有形态） | `vscode:prepublish` = `npm run lint && npm run test:full && npm run test:integration` |
| 不变量 | `npm test` / `test:full` 目标集合零变（单层 glob 天然排除集成档）；单文件调试 `node --test test/integration/x.test.mjs` 直达不经门 | 同（显式清单天然排除） |

- 裸 `node --test`（无参）非本仓入口（各入口均显式目标）——不设防线。
- 执行顺序：集成集运行面独立于 L0/L1/L2 任一层——**只在**发布门与手工入口跑（链上开发期纪律零变，见 §9 第 1 条）。

### 4.4 双端镜像策略

- 场景目录 = **共享语义源**（本文档 §5）；两仓**各自实例化**（语义同源、各端原文自持、不做 byte 一致）
- **驱动手段允许各端不同**：CLI = 真子进程 / 模块直驱 + 脚本化 provider；VSC = 扩展模块 + `vscode-mock` / happy-dom（本端工艺）——判据语义对齐、宿主各自
- 实现面互不追赶（不以任一端产物回改另一端）；差异如实登记（沿两端 README 镜像差异表先例）

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

## 7. 首执行清单（扫①——一次性处置）

> 来源 = 批次档 `../batches/2026-09-11-TEST-LIFECYCLE.md` §1 普查（4 路 explore · 110 档全读）；域外载体补录（普查域外 1 档）见 §7.4。
> 执行纪律 = **删除清单制**（逐条列明 + 父侧核销；差额 = 清单数——2026-09-07 先例）。
> **次序硬约束：本清单只在集成集（§5）全绿后执行**（保护墙先立）。

### 7.1 退役（B 类——事件残迹 8 档，全在 CLI）

| # | 档 | 行数 as-of | 处置 |
|---|---|---|---|
| 1 | `test/activity-debloat.test.mjs` | 202 | 退（删除） |
| 2 | `test/advisor-description.test.mjs` | 19 | 退 |
| 3 | `test/advisor-thinking-picker.test.mjs` | 114 | 退 |
| 4 | `test/deepseek-v41-specs.test.mjs` | 86 | 退 |
| 5 | `test/distill.test.mjs` | 88 | 退 |
| 6 | `test/mouse-sane-gate.test.mjs` | 82 | 退 |
| 7 | `test/tool-args.test.mjs` | 22 | 退 |
| 8 | `test/websearch-config.test.mjs` | 110 | 退 |

### 7.2 合并（C 类——4 组）

| # | 源档 | 目标档 | 处置 |
|---|---|---|---|
| 1 | `test/config.test.mjs`（45） | `test/config-merge.test.mjs`（176） | 断言并入 → 删源 |
| 2 | `test/prompts-normal-audit.test.mjs`（72） | `test/prompts-dual-source.test.mjs`（333） | 同上 |
| 3 | `test/subagent-id-counter.test.mjs`（49） | `test/subagent-scheduler.test.mjs`（135） | 同上 |
| 4 | VSC `test/settings-panel.test.mjs`（86） | VSC `test/config-pool.test.mjs`（121） | **呈请裁定**（见 §10）——接受则同法，不接受则原地保留 |

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
| 1 | `test/integration-provider.mjs` | 157 | **退（删除）**——域外事件残迹（MODEL-MERGE 会话语境；唯一在册提及 = `docs/design/_archive/MODEL-MERGE-SESSION.md`）：零执行面（快/全目标 glob `test/*.test.mjs` 名式不匹配——集成集执行面同理）+ 零活引用（`*.mjs` grep 零命中）；入删除清单制（差额核销） |

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

- 削段其余点位（未点名——含防回潮静态锚 8+ 档）：行数随**执行轮逐条清单**同表核销（删除清单制；as-of 口径沿 §7.1/§7.2 先例）。
- 跨仓归属注记：`index-perception` / `activity-flow` / `async-visibility` 三档仅存于 VSC 仓（行数见 §8.2）——本仓削段点名档：`turn-across-segments` / `verify-redesign` / `eng-designer-role`。
- **拆分预审（并档特例）**：`prompts-dual-source.test.mjs` 并档后预计 ~405 行，已越 300 咨询线——并档执行轮附**拆分预审**（拆不拆按预审判；若拆，守"断言数不减"红线）。

### 8.2 VSC 仓

| 文件 | 现状（行数） | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-vscode/docs/design/TESTING.md` | 新 | 96（实测落定；原估 ~160） | 对位档（本批已落） |
| `thincoder-vscode/docs/design/README.md` | 123 | +~5 | 登记行 + 变更记录（本批已落） |
| `thincoder-vscode/test/run-integration.mjs` | 新 | ~45 | 集成集入口（清单制） |
| `thincoder-vscode/test/integration/files.mjs` | 新 | ~15 | 集成清单（登记即跑） |
| `thincoder-vscode/test/integration/*.test.mjs` | 新 | ~500–800 | 本端实例 + 种子 |
| `thincoder-vscode/package.json` | 129 | +2 行 | `test:integration` + prepublish 串 |
| `thincoder-vscode/test/settings-panel.test.mjs` → `config-pool.test.mjs` | 86 / 121 | 裁定 | 合并（§7.2 #4） |
| 削段点名档（VSC） | `turn-across-segments` 220 · `verify-redesign` 187 · `eng-designer-role` 169 · `index-perception` 342 · `activity-flow` 311 ↔ `async-visibility` 387 | 删段 | 执行轮出清单 |
| `thincoder-vscode/AGENTS.md` | 122 | ±~5 | Testing 段 |
| `thincoder-vscode/docs/design/RELEASE.md` | 200 | +~6 | 发布门表述 |

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
| 3 | 清单制（VSC `files.mjs`） | 兼容：单元清单零含集成档；集成清单独立（`test/integration/files.mjs`——"登记即跑"同性质）；CLI 无登记制（沿 glob 惯例） |
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
| D-TL4 | 首版驱动 = 真机制 + 脚本化 provider（不进真付费端点） | 真端点集成 | 机验须确定 + 费用/抖动；smoke 独立先例 |
| D-TL5 | 发布门叠加（不删 full） | 纯 ②③ 门 | §9 第 1 条 |
| D-TL6 | 不重复判据 = §3.2 四问 | 覆盖清单简单比对 | 判据盯"业务可观察 + 未覆盖"两条硬轴，可评审复核 |

**边界（不做）**：真付费端点进层 · PTY 级全 TUI 驱动（⑤ 模块级起步） · VSC commit 镜像缺口修复（技术待办在案） · slow 门/分层机制改动（零改） · 集成集一次性写满（最小起步） · 存量 helper 清理（不顺手清）。

**呈请裁定项**：VSC `settings-panel` → `config-pool` 合并——extension 面断言并入纯单元档（happy-dom env 沿 `helpers/webview-env.mjs` 先例）。设计建议：**接受**（同板块凝聚 + 减碎片；分节标注"面板显示面"）；备选：不接受（原地保留，差额表调整）。

## 变更记录

- 2026-09-11（测试生命周期与集成集批——TEST-LIFECYCLE）：新增 §3–§10（三层来源与寿命 / 处置判据与 §6 处置行 / 承载与 runner 选型 / 双端契约与镜像 / 首批场景 + 种子用例表 / AC-TL1–AC-TL12 / 首执行清单 / 受影响文件 / 纪律核对 / 决策记录与边界）；需求侧同步 = `../requirements/TESTING.md` §2–§4（F6–F14 · N7–N9 · §2.1 维护模型）。
- 2026-09-11（TEST-LIFECYCLE 修正轮——设计评审轮次 1 后）：§4.2 候选 2 表述修正 · §4.5 判定探针口径 · §6（AC-TL1 补 N8 子串 / AC-TL7 计数）· §7 引注 + §7.4 域外载体补录 · §8.1.1 削段/接收/并档逐行 · §8.1/§8.2 数字实测落定（7 条评审发现逐条落修——映射见批次档 §2）。
- 2026-09-11（第 20 批）：归册补登——`test/eng-designer-role.test.mjs` T30 自 `test(` 改 `slow(`（慢门实测点名）+ AC-A3（见 §1.2）。
- 2026-09-06：测试分层 + 精简专题（五杠杆批 L4 归属）设计落地本文件（首个设计由 AGENT-LOOP §23 迁出——用户"可以，这样更合理"）。
  - 三阶段收口实现：Phase 1 双端分层+防漏（D-T6 slow 门拦截）/ Phase 2 L0+ 流程修订（D-T3：首次实现 L1→L0+）/ Phase 3 存量清理+红线收窄（D-T5：断言数不减收窄为拆分轮专用）+ 镜像转 slow。
  - 双端 L2 终验 CLI 1486/1486 + VS Code 1204/1204；链测试墙钟较基准降 ~70%（≥50% 参照线过）。用户批准 2026-09-06。
- 2026-09-07：**存量测试库存清零**——94 个测试文件按"按需加"政策删除（含锁测试断言的覆盖/回归断言产物）；分层机制与脚本不动，测试转按需补。本文件随格式债清理批 A 重写为当前态。
