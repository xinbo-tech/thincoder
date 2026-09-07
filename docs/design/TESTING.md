# 测试基建（TESTING）

> 板块：测试基建——slow 门机制、测试分层纪律（L0/L1/L2）、测试库存治理。
> 权威源：`test/slow.mjs` + `test/slow-gate.mjs` + `test/run-fast.mjs` + `test/run-full.mjs`（分层执行入口），`package.json` scripts。
> 关联：本文档 §1 是分层纪律（L0/L1/L2）的权威叙述（原 AGENT-LOOP §18.7 已迁此）；工程模式注入体 `src/prompts/engineering-sub.md`（模型侧实际拿到的分级正文）；仓库根 `AGENTS.md`（本项目的两分层测试政策与 smoke 说明）。
> 状态：**机制已落地并维持当前态**。分层纪律（L0/L1/L2）+ slow 门机制仍生效；2026-09-07 存量测试库存按"按需加"政策清零，测试随机制需要按需补（详见 §2）。

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

## 变更记录

- 2026-09-06：测试分层 + 精简专题（五杠杆批 L4 归属）设计落地本文件（首个设计由 AGENT-LOOP §23 迁出——用户"可以，这样更合理"）。
  - 三阶段收口实现：Phase 1 双端分层+防漏（D-T6 slow 门拦截）/ Phase 2 L0+ 流程修订（D-T3：首次实现 L1→L0+）/ Phase 3 存量清理+红线收窄（D-T5：断言数不减收窄为拆分轮专用）+ 镜像转 slow。
  - 双端 L2 终验 CLI 1486/1486 + VS Code 1204/1204；链测试墙钟较基准降 ~70%（≥50% 参照线过）。用户批准 2026-09-06。
- 2026-09-07：**存量测试库存清零**——94 个测试文件按"按需加"政策删除（含锁测试断言的覆盖/回归断言产物）；分层机制与脚本不动，测试转按需补。本文件随格式债清理批 A 重写为当前态。
