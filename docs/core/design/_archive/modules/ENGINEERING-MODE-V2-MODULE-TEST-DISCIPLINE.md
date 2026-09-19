# 工程模式 v2 · 模块设计（M10 测试纪律）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M10）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-TEST-DISCIPLINE.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 基础族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

v1 测试门禁是**三层**：`lint`（check-syntax）→ `test:full`（全量，slow 门控放行）→ `test:integration`（集成集）。
配套一套**慢测层归册机制**——`slow()` 门控（`THINCODER_TEST_FULL=1` 才跑）把重 IO 用例从快层 skip 出去，
`slow-gate.mjs` reporter 拦截「未归册而超阈」的漏网用例，还有五套 runner 脚本（`run-fast` / `run-full` /
`run-integration` / `slow-gate` / `slow`）与一套「批次收口的测试退役三选一」流程。
本模块把门禁**简化**为一条 `test` 全绿——砍掉慢测层归册、多套脚本、测试退役台账：**测试是开发期工具，不是库存**。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | 统一 `test` 命令：一条命令跑全量（单元 + 集成 + slow 全跑），全绿即门禁 | ②.1 |
| F2 | 砍多套脚本：`run-fast` / `run-full` / `run-integration` / `slow-gate` / `slow` → 收敛为一条 `test` | ②.2 |
| F3 | 砍慢测层归册：`slow()` 不再 skip（慢就慢，全量跑）；`slow-gate` 防漏拦截删除；`THINCODER_TEST_FULL` / `THINCODER_SLOW_GATE_MS` env 门全部删除 | ②.3 |
| F4 | 砍测试退役台账：不做「批次收口的测试退役三选一」流程 | ②.4 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零残留 | 全仓无 `run-fast` / `run-full` / `run-integration` / `slow-gate` 脚本残留（package.json scripts + 文件名 + 消费者引用）——AC-M10-2 |
| N2 | 零归册机制 | 全仓无慢测层归册机制（`THINCODER_TEST_FULL` / `opts.skip` 慢门 / 慢层拦截）——AC-M10-3 grep 无匹配 |
| N3 | 零悬空 import | 35 档测试文件的 `import { slow } from "./slow.mjs"` 不悬空——`slow` 导出名保留（纯别名） |
| N4 | 可机判 | 验收 = `npm test` exit 0 + 文件不存在 + grep 无匹配，无散文判据 |

### 1.4 范围边界（本模块不做）

- 不做测试**内容**（各模块自己写自己的测试用例）——只砍机制、不写新用例。
- **不砍 `lint`（check-syntax）脚本**：规格 ② 砍多套脚本清单 = `run-fast` / `run-full` / `run-integration` / `slow-gate` / `slow`，**不含 check-syntax**；AC-M10-2 也只验 package.json 无多套测试脚本。`lint` 是语法门（node --check），非测试门，CI 两作业 + VSC `vscode:prepublish` 仍消费——本模块不触碰（见 §2.5）。
- 不引入新测试框架 / 依赖（零依赖不变）。

## 2. 设计层

### 2.1 方案与理由

**决策一：`slow.mjs` 的归册语义怎么砍（规格 ②.2 + ②.3 + AC-M10-3 的张力）**

规格 ②.2 把 `slow` 列入「砍多套脚本」，②.3 说「不再归册到慢测层 + 快层 skip」，AC-M10-3 判据「无慢测层归册机制 · grep 无匹配」。但全仓 **35 档测试文件 + 2 档 fixture** 都在 `import { slow } from "./slow.mjs"`（核 5 · CLI 18 · VSC 12，`slow(` 调用面一致）——整档删 `slow.mjs` 会悬空全部 import，而 AC-M10-3 又要求 grep 无 `THINCODER_TEST_FULL` 归册机制。二者张力下的**决定**：

`slow.mjs` 收敛为 `export { test as slow } from "node:test"`（头注改写为「slow ≡ test——已废归册语义；保留导出名以不悬空既有 import」）。三包同名同形（核 / CLI / VSC 语义同源、各面独立实现）。

**为什么**：

- 慢层归册机制随之砍净（`THINCODER_TEST_FULL` skip 逻辑 + `opts.skip` 慢门删除）——②.3 + AC-M10-3 同时满足；
- 35 档 + 2 fixture 的 `import { slow }` 零悬空——保留一个「无语义」的 `slow` 导出名（历史 import 兼容面）；
- 否决「整档删 + 35 档 `slow(` → `test(` 全改」：改动面巨大（35 档 + 2 fixture 手工重写），纯机械重命名、零语义收益，孤儿 import 风险高；
- 否决「保留 `slow()` skip 语义（`THINCODER_TEST_FULL` 门）」：与 ②.3「慢就慢，全量跑」直接冲突，AC-M10-3 grep 命中 `THINCODER_TEST_FULL` / `opts.skip` → 红。

**决策二：统一 runner 的形态**

**决定**：每包新建 `test/run.mjs`（`package.json` `"test": "node test/run.mjs"`），每包一个薄启动器（核 ~15 行 / CLI ~18 行 / VSC ~45 行）。

**为什么**：

- 新名无「fast/full」分层包袱；可承载 VSC 显式清单 + 集成清单自检；shell glob 跨平台展开沿用既有 `shell:true` 先例；
- 否决「`package.json` 直连 `node --test <glob>`（零 runner 档）」：VSC 需显式清单（非 `.test.mjs` smoke 档必须可跑）+ 集成清单自检无处安放；既有 `run-full.mjs` 头注实证「node --test 不认 glob」→ 需 `shell:true` 展开，直连跨平台风险高；
- 否决「复用 `run-fast.mjs` 改名」：省一个文件，但保留「fast」语义名 = 分层语义残留——AC-M10-2 只验 package.json，但残留分层名 = 形态不干净（残留即示范）。
目标集合分面：

- **核**：`test/*.test.mjs`（单层 glob）。
- **CLI**：`test/*.test.mjs` + `test/integration/*.test.mjs`（两层 glob）。
- **VSC**：`test/files.mjs` 显式清单（单元）+ `test/integration/files.mjs` 显式清单（集成）——**非 `.test.mjs` 命名的 smoke 档（`smoke-provider.mjs` / `smoke-settings.mjs`）必须保持可跑**，故不用 glob；集成清单自检 ①②③（清单在盘 / 无漏登记 / 单元集成零混入）随 `run.mjs` 承接下来，④（集成档禁 slow()）**删除**——`slow ≡ test` 后无「禁 slow()」语义。

### 2.2 架构 / 接口 / 数据流契约

```text
简化前：npm test ─► run-fast.mjs ─► node --test（挂 slow-gate reporter）
                        │             └─ slow() 门控（THINCODER_TEST_FULL）→ 慢用例 skip
         npm run test:full ─► run-full.mjs ─► 置 THINCODER_TEST_FULL=1 → 全跑
         npm run test:integration ─► run-integration.mjs ─► 只跑集成集
简化后：npm test ─► run.mjs ─► node --test <目标全集>
                        │             └─ slow ≡ test（无 skip，全量跑）
                        └─ 目标 = glob（核/CLI）或显式清单（VSC）
```

**无新增导出**——`slow` 导出名保留但语义 = `test`；`run.mjs` 是启动器不是模块，零 export。**删除的接口**：`slow-gate.mjs` 的 default reporter、`THINCODER_TEST_FULL` / `THINCODER_SLOW_GATE_MS` 两个 env 门。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

> 行数 = 勘察实测（as-of）。路径相对各包根（核 = `thincoder-core/`，CLI = `thincoder-cli/`，VSC = `thincoder-vscode/`）；仓根 = 三包外。

**删除（runner 族 + gate 族 + gate 自验 + gate 夹具）**

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/test/run-fast.mjs` | 48 | 删除 | −48 | 整档（快层入口 + slow-gate reporter 挂载） |
| `thincoder-core/test/run-full.mjs` | 11 | 删除 | −11 | 整档（置 `THINCODER_TEST_FULL=1` 委托 node --test） |
| `thincoder-core/test/slow-gate.mjs` | 46 | 删除 | −46 | 整档（`slowGate` default reporter——防漏拦截） |
| `thincoder-cli/test/run-fast.mjs` | 48 | 删除 | −48 | 整档 |
| `thincoder-cli/test/run-full.mjs` | 11 | 删除 | −11 | 整档 |
| `thincoder-cli/test/run-integration.mjs` | 19 | 删除 | −19 | 整档（集成集 glob 入口） |
| `thincoder-cli/test/slow-gate.mjs` | 43 | 删除 | −43 | 整档 |
| `thincoder-cli/test/slow-gate.test.mjs` | 52 | 删除 | −52 | 整档（gate 机制自验——红/绿两端 + 文件级条目） |
| `thincoder-cli/test/fixtures/slow-gate-marked.mjs` | 11 | 删除 | −11 | 整档（gate 夹具） |
| `thincoder-cli/test/fixtures/slow-gate-unmarked.mjs` | 12 | 删除 | −12 | 整档（gate 夹具） |
| `thincoder-cli/test/fixtures/slow-gate-no-tests.mjs` | 9 | 删除 | −9 | 整档（gate 夹具） |
| `thincoder-vscode/test/run-fast.mjs` | 50 | 删除 | −50 | 整档 |
| `thincoder-vscode/test/run-full.mjs` | 14 | 删除 | −14 | 整档 |
| `thincoder-vscode/test/run-integration.mjs` | 61 | 删除 | −61 | 整档（含清单自检 ①②③④） |
| `thincoder-vscode/test/slow-gate.mjs` | 43 | 删除 | −43 | 整档 |
| `thincoder-vscode/test/slow-gate.test.mjs` | 53 | 删除 | −53 | 整档 |
| `thincoder-vscode/test/fixtures/slow-gate-marked.mjs` | 11 | 删除 | −11 | 整档 |
| `thincoder-vscode/test/fixtures/slow-gate-unmarked.mjs` | 12 | 删除 | −12 | 整档 |
| `thincoder-vscode/test/fixtures/slow-gate-no-tests.mjs` | 9 | 删除 | −9 | 整档 |

**修改（`slow.mjs` → 纯别名）**

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/test/slow.mjs` | 32 | 修改 | −27 | `slow()` 门控（:24 `const FULL` · :29 `opts.skip`）→ `export { test as slow }` + 头注改写 |
| `thincoder-cli/test/slow.mjs` | 30 | 修改 | −25 | `slow()` 门控（:22 · :27）→ 同上 |
| `thincoder-vscode/test/slow.mjs` | 30 | 修改 | −25 | `slow()` 门控（:22 · :27）→ 同上 |

**新增（统一 runner）**

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/test/run.mjs` | 0 | 新增 | +15 | 目标 `test/*.test.mjs` → `node --test` |
| `thincoder-cli/test/run.mjs` | 0 | 新增 | +18 | 目标 `test/*.test.mjs` + `test/integration/*.test.mjs` |
| `thincoder-vscode/test/run.mjs` | 0 | 新增 | +45 | 目标 `files.mjs` + `integration/files.mjs` + 清单自检 ①②③（④ 删） |

**修改（接线两端：package.json + 消费端）**

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/package.json` | 33 | 修改 | −2 | scripts：`test` → `node test/run.mjs` · 删 `test:full` |
| `thincoder-cli/package.json` | 47 | 修改 | −3 | scripts：`test` → `node test/run.mjs` · 删 `test:full` · 删 `test:integration` |
| `thincoder-vscode/package.json` | 137 | 修改 | −4 | scripts：`test` → `node test/run.mjs` · 删 `test:full` · 删 `test:integration` · `vscode:prepublish` 去 `test:full && test:integration`（留 `lint && doc:check && test`） |
| `thincoder-cli/scripts/release-check.mjs` | 86 | 修改 | −8 | 步骤 2（`test/run-full.mjs`）+ 步骤 3（`test/run-integration.mjs`）→ 单步骤 `test/run.mjs`；`printFailingDetails` 摘要提取保留（单测试步骤仍用） |
| `.github/workflows/test.yml` | 58 | 修改 | ±0 | core 作业 :46 `npm run test:full` → `npm test`（CLI / VSC 作业已跑 `npm test`——零改） |

**修改（硬引用修复——删 runner 后必断的测试面）**

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-cli/test/doc-anchors.test.mjs` | 436 | 修改 | ±0 | T-V5-15（:246-251）`readFileSync(join(REPO, "test", "run-fast.mjs"))` → `"test/run.mjs"`；断言 :250 `runner.includes('test/*.test.mjs')` 保持（run.mjs 目标 glob 仍在） |
| `thincoder-vscode/test/files.mjs` | 85 | 修改 | −1 | 单元清单 :75 去 `"test/slow-gate.test.mjs"` 条目（删档后悬空） |

**软清理（残留即示范——注释面 ±0，不触断言）**

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-cli/test/doc-consistency.test.mjs` | 289 | 修改 | ±0 | :175 `THINCODER_TEST_FULL: "1"`（no-op env，**必清**——AC-3/T8 零匹配要求）· :262 注释「run-fast 默认目标」→「run.mjs 单元发现集」 |
| `thincoder-cli/test/turn-across-segments.test.mjs` | 85 | 修改 | ±0 | :9 注释「`node test/run-full.mjs`」→「`node test/run.mjs`」 |
| `thincoder-cli/test/portability-index.test.mjs` | 134 | 修改 | ±0 | :114 注释「归册 slow」措辞（归册机制已废） |
| `thincoder-vscode/test/integration/files.mjs` | 24 | 修改 | ±0 | :6-7 头注「run-integration.mjs 启动自检」「集成档不得 import slow.mjs」→ 改指 `run.mjs` + 删 slow 禁令句 |
| `thincoder-vscode/test/chat-panel.test.mjs` | 270 | 修改 | ±0 | :18 注释「归册阈值纪律」措辞 |
| `thincoder-vscode/test/chat-panel-messages.test.mjs` | 422 | 修改 | ±0 | :11 注释「归册阈值纪律」措辞 |
| `thincoder-vscode/test/edit-tool-improvement.test.mjs` | 338 | 修改 | ±0 | :60 注释「>500 ⇒ 归册」措辞 |

（**两端接线确认**：`package.json` scripts 是「接线一端」，`release-check.mjs` + `.github/workflows/test.yml` 是「消费端另一端」——两处同批改，改一端留另一端 = 死脚本引用。）

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M10-1 | `slow.mjs` 保留为纯别名（`slow ≡ test`），不整档删 | 35 档 + 2 fixture 都在 import `slow`；整档删 = 悬空 import + 35 档机械重写；纯别名同时满足 ②.3（无归册）与 AC-M10-3（grep 无 `THINCODER_TEST_FULL`/`opts.skip`） |
| KD-M10-2 | `slow-gate.mjs` + `slow-gate.test.mjs` + 3 夹具整体删 | gate 的存在理由 = 「快层里 slow() 全 skip → 超阈即未归册」；slow 层 skip 一砍，gate 判据恒等式失效，无意义 |
| KD-M10-3 | 统一 runner 命名 `run.mjs`（新名），不复用 `run-fast` | 新名无「fast/full」分层语义包袱；复用旧名 = 分层语义残留（残留即示范） |
| KD-M10-4 | VSC 统一 runner 承接集成清单自检 ①②③，删 ④ | ①②③ 是 fail-closed 清单契约（漏登记即失败），仍有效；④「集成档禁 slow()」因 `slow ≡ test` 失去语义，删除 |
| KD-M10-5 | VSC 保持显式清单（`files.mjs` + `integration/files.mjs`），CLI/核保持 glob | 非 `.test.mjs` smoke 档（VSC）必须可跑，glob 会漏；CLI/核全为 `.test.mjs`，glob 即可——目标集 keeper 区分是既有约定，保留 |
| KD-M10-6 | `lint`（check-syntax）**不进** M10 砍单 | 规格 ② 砍单不含 check-syntax、AC-M10-2 不验 lint；`lint` 是语法门非测试门，CI 两作业 + VSC prepublish 仍消费——砍它是范围扩展（见 §2.5 观察项） |

### 2.5 与既有纪律冲突核对

- **规格 ①「lint + test:full + test:integration → 一条 test」里的 `lint`**：本设计读作「旧发布门的三层描述」——机器可判的砍单（规格 ② + AC-M10-2）只列测试 runner 脚本、不含 `check-syntax`。故 `lint` 脚本保留、不进砍单（KD-M10-6）。若本意是**连 `lint` 一起从门禁/脚本砍掉**，那是范围扩展，需主 agent 另行裁定（本设计按 fail-closed 不扩范围）。
- **`docs/core/design/TESTING.md`（测试纪律权威源）需重写**：L1/L2/L3 三层 → 单层 `test`；慢层归册段、集成段、发布门链（`lint → test:full → test:integration`）全部随之改写。这是规格 ④（砍退役台账）的文档落点之一——**不在本模块的代码改动清单内**，属跨模块文档一致性义务（D2 单一权威源），随 M10 实施批或后续文档批落地。
- **提示词「测试纪律（工程侧——寿命/门禁/归册）」段需改**（规格 ④）：`docs/core/design/prompts/discipline-engineering.md` 的「归册 / 测试退役三选一 / 慢层」判据随 M10 作废——这是**产品提示词内容面**（内容权归主 agent、落笔归 eng-coder），经 M9 单向生成承载，**本模块只记录改法、不代笔**。
- **其他设计档的 `test:full` / `test:integration` 引用（残留）**：`ARCHITECTURE.md` · `CORE-UNIFICATION.md` · `DOC-DISCIPLINE.md` · `ENGINEERING-MODE.md` · `PROMPT-SYSTEM.md` · `AGENT-LOOP-SUBAGENT.md` 等有散在引用——M10 落地后成悬空指针。**标注为观察项**（不阻断本批、需后续一致性清扫），本模块不改写这些档。
- **`doc-anchors.test.mjs` T-V5-15 的 `run-fast.mjs` 读档断言**：这是唯一「读 runner 文件内容」的测试——`run.mjs` 目标 glob 语义不变（仍含 `test/*.test.mjs`），改档名即可，断言 `runner.includes('test/*.test.mjs')` 保持。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | `npm test` 一条命令跑全量（单元 + 集成 + slow 全跑） | AC-M10-1 | ✅ 跑命令（三包各自 `npm test`） |
| AC-2 | 无 `run-fast` / `run-full` / `run-integration` / `slow-gate` 等多套脚本残留 | AC-M10-2 | ✅ 检查三包 `package.json` scripts（仅 `test` 一条测试入口）+ 文件名不存在 |
| AC-3 | 无慢测层归册机制 | AC-M10-3 | ✅ `grep -rn "THINCODER_TEST_FULL\|THINCODER_SLOW_GATE_MS"` 代码面无匹配（排除 docs/ 与批次档） |
| AC-4 | 全量测试全绿（门禁依据） | AC-M10-4 | ✅ `npm test` → exit 0（三包） |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：统一入口 | 三包各自 `npm test` | exit 0；集成档 + 慢档（原 slow()）均被执行（不再 skip） |
| T2 | 正常：脚本收敛 | 读三包 `package.json` scripts | 测试入口仅 `test`（`node test/run.mjs`）；无 `test:full` / `test:integration` / `run-fast` / `run-full` / `run-integration` / `slow-gate`（AC-2） |
| T3 | 正常：慢档全跑 | 原 `slow()` 用例（如 `doc-consistency` T41⑥）在 `npm test` 下 | 被执行、通过（不再 skip；`DOC_CONSISTENCY_CONC_CHILD` 守卫仍防递归） |
| T4 | 正常：slow 别名不悬空 | `grep -rn 'from "./slow.mjs"'` | 35 档 import 仍在，且 `slow.mjs` 导出 `slow`（`slow ≡ test`）——import 可解析（N3） |
| T5 | 边界：VSC 显式清单 | VSC `npm test` | 非 `.test.mjs` smoke 档（`smoke-provider.mjs` / `smoke-settings.mjs`）被执行（清单 keeper 未丢） |
| T6 | 边界：VSC 集成清单自检 | VSC `run.mjs` 跑集成清单 | 自检 ①②③ 通过（清单在盘 / 无漏登记 / 单元集成零混入）；④ 已删（不再查 slow()） |
| T7 | 边界：CLI 集成并入 | CLI `npm test` | `test/integration/*.test.mjs` 被执行（`run.mjs` 第二层 glob） |
| T8 | 错误：残留检测 | `grep -rn "THINCODER_TEST_FULL\|THINCODER_SLOW_GATE_MS"` 代码面（排除 docs/ 与批次档） | 零匹配（AC-3）——`slow.mjs` 别名无 env 门、`run.mjs` 无 env 门 |
| T9 | 错误：死脚本引用 | `grep -rn "run-full\|run-integration\|run-fast\|slow-gate"` 全仓（排除 docs/ 与批次档 + 本设计档） | 零匹配（`release-check.mjs` / `test.yml` / `files.mjs` / `doc-anchors.test.mjs` 引用已改指 `run.mjs`） |
| T10 | 回归：发布门消费端 | CLI `npm run release:check` · CI core 作业 | 单测试步骤（`run.mjs`）exit 0；无对已删 runner 的调用 |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 基础族 · eng-designer）：建档——M10 测试纪律模块设计。
  三层门禁 → 一条 `test` 全绿；`slow.mjs` → 纯别名（KD-M10-1）、`slow-gate` 族整体删；
  统一 runner = `run.mjs`（核/CLI glob · VSC 显式清单）；`lint`（check-syntax）不进砍单（KD-M10-6）；
  验收逐条回指 AC-M10-1..4。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——两对比表改为「决定 + 理由」段落，保留全部技术判断（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
