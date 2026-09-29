# 2026-09-29 · desktop-execute-electron-node
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户桌面走查（execute 工具整体失效实勘）+ 14:14「那两条走查问题也处理吧」令；台账 #602。
> 台账 = #602（desktop · 归批）。前情 = 无（独立批 · 走查直开）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与实勘（父侧 · 2026-09-29）

- **用户口径**：桌面走查发现 execute 工具不可用（父侧两次实调工具级超时 30s ∕ 90s 各一次）；14:14「那两条走查问题也处理吧」= 开批令。
- **机制定位（实勘在册）**：核 `thincoder-core/tools/execute.mjs:84` `spawn(process.execPath, childArgs)`——**全档 grep `ELECTRON_RUN_AS_NODE` 零命中**；桌面宿主主进程 = `electron.exe` ⇒ `process.execPath` = electron.exe ⇒ 子进程（inline `["--input-type=module","--eval",code]` `:227` ∕ scriptFile `:219`）按 Electron 应用启动、不执行代码 ⇒ 悬挂至超时被杀（共享日志 05:16–05:18Z 悬挂子进程 ×2 实锤）。CLI 宿主 execPath = node ⇒ 不受影响；VSC 扩展宿主 = Electron 二进制 node 模式（env 携旗标；见 §2.4 实读引证）⇒ 同值幂等、不受影响（端差 = 核件隐含前提「execPath 即 node」被桌面宿主破坏）。
- **影响面**：桌面端**全部角色**（父侧 ∕ 子代理 ∕ 设计实施链）execute 工具不可用——桌面线会话的工程能力受阻。

### 1.2 口径与边界（父侧）

- **修法定型 = 设计轮**（拟修向 = `runNode` 检测 `process.versions.electron` 补 `ELECTRON_RUN_AS_NODE:"1"` 或等价开关；**设计轮须全域清扫**「`spawn(process.execPath` ∕ `execPath` 消费点」同类前提破坏面——共几处 ∕ 各端影响，逐处裁定）。
- **验收面**：桌面宿主下 execute 跑通（inline ∕ scriptFile 两径 + 超时面）＋ CLI ∕ VSC 零回归；真机腿 = 桌面线会话亲跑（父侧）。
- **授权**：本批在用户 13:52「自己跑完」授权面内（代点火 + 代签，自缚三条件照旧）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-29 · §2 与 TOOLS.md §6.18 已落；评审 #210 修正轮七条已落（§2.8）；机检 V1–V5 · 真机腿 = 父侧桌面亲跑）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 来源 | 完成判定句 |
|---|---|---|---|
| B1 | **桌面宿主 `execute` 恢复可用**（根因修复：execPath=Electron 前提破坏） | 台账 #602 · §1.1 | Electron 宿主下 execute 子进程以 node 语义启动——inline ∕ scriptFile ∕ nodeArgs 直通 ∕ 超时面四读（机检 V2 ∕ 真机 V6） |
| B2 | **同族前提破坏面清扫**（execPath 消费点全量枚举 + 逐处裁定）+ `lint` 快路径同源修复 | §1.2 口径 | 产品码消费点 2 处修复；全仓命中逐档裁定在册（§2.4）；lint 快路径经 exec-run `opts.env` 透传（机检 V3 = lint 径绑定 ∕ V4 = 缺省径透传） |
| B3 | **三端零回归** | §1.2 验收面 | 旗标仅 Electron 判据触发——非 Electron 环境 env 逐字零变（机检 V1 ∕ V2 复位支 ∕ V3 复位支；五包 `npm test` 收口轮 V7） |

**「两条走查问题」对位（14:14 令）**：① #602（桌面 execute 失效）⇒ 本批 B1–B3；② #601（夹具污染真家——另案：已清场 ∕ 隔离补丁 ∕ 14:2x 核销，见台账 #601），本批零涉。B2 的 `lint` 快路径 = 设计轮自查新增（非走查令「两条」之一）。

**界外登记（本批不做）**：PATH-`node` 邻类两处（`shared.mjs:247` · `verify.mjs:202`）· `hooks` ∕ `mcp` ∕ `lsp` 配置命令面 · 打包 fuse 面 · 产品码实施（下轮 eng-coder 链）。

### 2.2 设计档落点

- **`docs/core/design/TOOLS.md`**（工具系统设计档——execute ∕ lint 机制单源）——**设计轮已落**：新增 **§6.18**（node 语义子进程启动面）+ **§7 D-TO14** + §6.4 随动两处（execute 边界句补半句 · **lsp 行失实收正**——`:197` 声称 `process.execPath` 直跑，实读核 `thincoder-core/tools/lsp.mjs:148` = `config.lsp.servers` 的 `command` 直跑；consistency 面当场修 + 报告）+ 变更记录一行。
- 本节（批档 §2）= 一次性材料（条目 ∕ 文件表 ∕ 验收 ∕ 用例位）。
- **需求档对位**（`docs/core/requirements/TOOLS.md`）：**零改**——N6「execute = 纯净 node ESM 子进程」语义不变（本修恰是使桌面宿主回到该语义）；N7「lint 零依赖」零涉。可选补注（宿主运行时语义半句）= 主 agent 笔——上报不代写。
- 批内件落位 = `docs/batches/2026-09-29-desktop-execute-electron-node.test.mjs`（复跑 `node --test docs/batches/2026-09-29-desktop-execute-electron-node.test.mjs`）。

### 2.3 机制设计

**（1）判据**：`process.versions.electron` truthy = 「本进程运行时为 Electron ⇒ `process.execPath` 属 Electron 族二进制」。不判端名；不判环境变量在场与否（已处 node 模式的 Electron 宿主 = 同值幂等——不分叉）。

**（2）单点**：核件新增 `thincoder-core/tools/node-child.mjs`——`nodeChildEnv(base = process.env, isElectron = !!process.versions.electron)`：真 ⇒ 返回 `{ ...base, ELECTRON_RUN_AS_NODE: "1" }`（副本，不改父进程 env）；假 ⇒ 原样返回 `base`（同引用——与 spawn 缺省继承逐字等价，零行为变）。第二参 = 判据注入（纯函数机检用——先例 `_setGitTimeoutForTest` 族）。

**（3）注入点（全径覆盖）**：

- `execute.mjs` `runNode`（`:84` spawn 选项）补 `env: nodeChildEnv()`——inline（`:227`）∕ scriptFile（`:219`）两径与 `nodeArgs` 直通（`[...nodeArgs, scriptAbs]`——只进 args 不进 env）均汇入 `runNode`（`:230`）⇒ 单点覆盖全径、零旁路；
- `linter.mjs` `nodeCheckResult`（`:50`）调用携 `env: nodeChildEnv()`；
- `exec-run.mjs` `defaultRun`（`:39-43`）补 `opts.env` 透传（缺省径 = execFileSync 也吃 env）；注入径 `runInterruptible`（`:60`）本已读 `env` ⇒ 执行面契约收敛为 `{ cwd?, timeout?, signal?, env? }`（doc 收正 + 缺省径补齐）。

**（4）端执行器消费（零改读数）**：VSC ∕ desktop 端注入的执行器 = 核 `runInterruptible`（R3 上提单源）⇒ env 透传自动成立；CLI 缺省径 = execFileSync ⇒ 透传补齐后成立。

**（5）超时 ∕ 中止面**：零涉（env 不进 kill 径——现有超时 ∕ 树杀语义逐字不变）。

### 2.4 受影响文件与测试面

| # | 档 | 现行数 | 增量 | 内容 |
|---|---|---|---|---|
| 1 | `thincoder-core/tools/node-child.mjs` | — | 新建 ≈28 | `nodeChildEnv` 单点（判据 + 旗标 + 零变支 + 档头注） |
| 2 | `thincoder-core/tools/execute.mjs` | 235（`wc -l` 实读 2026-09-29） | +2~3 | import + `runNode` spawn 选项 `env: nodeChildEnv()`（+一行注释） |
| 3 | `thincoder-core/tools/linter.mjs` | 120 | +2 | import + `nodeCheckResult` 调用携 env |
| 4 | `thincoder-core/tools/exec-run.mjs` | 139 | +1~3 | `defaultRun` env 透传 + 契约注释收正 |
| 5 | `docs/batches/2026-09-29-desktop-execute-electron-node.test.mjs` | — | 新建 ≈100 | 机检 V1–V5（行为 4 + 形面 1） |
| 6 | `docs/core/design/TOOLS.md` | **1175**（`wc -l` 实读 2026-09-29） | ≈+35（设计轮已落） | §6.18 + D-TO14 + §6.4 随动两处 + 变更记录 |

> 行数口径 = `wc -l`（同 `TOOLS.md` §6.14 落位表）；核三档现读 = 235 ∕ 120 ∕ 139（与表内一致）· `TOOLS.md` **1175**（设计轮落定 1172 + 本修正轮 +3）——读数 as-of 2026-09-29 实读。`TOOLS.md` §6.14 表 243（as-of 2026-09-21）与 235 之差 = 其后 `killProcessTree` 外提等改动净减——两读各带 as-of，非漂移。`.md` 档 = 免登记（不计体量档线）。

**波划分**：波 1 = eng-coder 单轮（1–5 号：核件 + 接入 + 批内件落位并跑绿）；波 2 = 父侧（6 号已落；V6 桌面亲跑 + V7 收口轮）。

**清扫读数（execPath 消费点 · 全仓 as-of 2026-09-29）**：

| 面 | 档 ∕ 坐标 | 现状 | 裁定 |
|---|---|---|---|
| 核 · 产品 | `thincoder-core/tools/execute.mjs:84` | `spawn(process.execPath, …)` 无 env | **修（1 号）** |
| 核 · 产品 | `thincoder-core/tools/linter.mjs:50` | `runCommand(process.execPath, ["--check", …])` | **修（2 号）** |
| 核 · 产品 | `thincoder-core/tools/exec-run.mjs:39-43` | **承载面**：`defaultRun` 不透 `opts.env`（2 号须经此） | **改（3 号）** |
| CLI · 产品 | `thincoder-cli/src/tui/wrapped-spawn.mjs:48` | TUI 自重启 `spawn(process.execPath, …)` | 零动作——宿主恒 node（CLI 入口由 node 执行），前提成立 |
| 工程 ∕ 测试面 9 档 | 核 `test/run.mjs:48` · CLI `scripts/check-syntax.mjs:48` ∕ `scripts/release-check.mjs:12-13` ∕ `test/run.mjs:49-50` · VSC `scripts/check-syntax.mjs:48` ∕ `test/run.mjs:68` · render-core `test/run.mjs:70,81` · desktop `test/run.mjs:48` ∕ `test/rc-resolve.mjs:8`〔注〕 | `spawnSync(process.execPath, …)` | 零动作——node 直跑（`node <script>` ∕ `npm test`），前提成立 |
| VSC · 产品 | `src/**` | 实读零 `spawn(process.execPath`（核件经该宿主运行 ⇒ 1 ∕ 2 号修复覆盖面含该径） | 零动作——扩展宿主 = Electron 二进制 node 模式（env 携旗标，批档 `2026-09-25-desktop-impl-3.md:333` 实证血缘继承）⇒ 修复对该径同值幂等（零行为变） |
| desktop · 产品 | `src/**` | 实读零 spawn(execPath)（`exec-run.mjs` = 纯转口） | 零动作 |
| 文档面 | `docs/core/design/TOOLS.md:197`（lsp 行）等 docs 文字命中 | 声称「`process.execPath` 直跑」= 失实（实读 `lsp.mjs:148` = 配置 `command`） | **文档收正**（consistency——设计轮已落，见 §2.2） |

〔注〕`rc-resolve.mjs:8` = 档头注记文字（非 spawn 点），同列登记。

**邻类（非 execPath——登记，零动作；建议另立台账）**：`thincoder-core/tools/shared.mjs:247`（`autoSyntaxCheck`）· `thincoder-core/agent-tools/verify.mjs:202`（语法提示）以 PATH `"node"` 启动——桌面无 PATH-node 时为假红 ∕ 静默跳过（**不同前提类**：非 execPath 消费点）；`hooks` ∕ `mcp` ∕ `lsp` 配置命令面同属 PATH 类。

### 2.5 验收对照（回指 §2.1；机检 = 批内件 V1–V5，真机 = 父侧 V6，收口 = V7）

| # | 判据 | 形式 | 腿 |
|---|---|---|---|
| V1 | `nodeChildEnv(base, true)` ⇒ 含 `ELECTRON_RUN_AS_NODE:"1"` ∧ base 键全保留 ∧ 非别名；`(base, false)` ⇒ 原样 base（同引用、无该键） | 行为（纯函数） | 平 node |
| V2 | 临时置 `process.versions.electron`（try/finally 复位；实读可置可删）⇒ 经真工具面 `executeTool.execute({code:"console.log(process.env.ELECTRON_RUN_AS_NODE ?? 'unset')"})` 输出 `1`；复位后输出 `unset` | 行为（真子进程 env 读数——判别「接入在场」） | 平 node |
| V3 | 置位 `process.versions.electron` ⇒ **经 lint 快路径**（临时 .mjs 过 `lint` 工具）驱动 `configureExecRun` 探针捕获 `opts.env`：`opts.env.ELECTRON_RUN_AS_NODE === "1"`（linter → exec-run 绑定在场）；复位 + `resetExecRun()` 还原 | 行为（注入径探针 · linter 消费点驱动） | 平 node |
| V4 | 缺省径透传：`runCommand(process.execPath, ["-e","console.log(process.env.PROBE ?? 'unset')"], { env: {...process.env, PROBE:"1"} })` ⇒ 输出 `1` | 行为（缺省径真子进程读数） | 平 node |
| V5 | 形面断言（3 条 · **归一空白**后匹配）：`execute.mjs` spawn 选项含 `env: nodeChildEnv()` · `linter.mjs` 调用携 `env: nodeChildEnv()` · `exec-run.mjs` `defaultRun` 含 `opts.env` 透传。注：源文本断言对格式敏感（换行 ∕ 缩进 ∕ 注释插入）——归一空白为构成性前提 | 结构核（源文本断言——「注入开关的形面断言」） | 平 node |
| V6 | **桌面真机四读**：inline（`console.log(1+1)` ⇒ `2`）· scriptFile（tmp .mjs ⇒ 输出）· nodeArgs（`["--check"]` + scriptFile ⇒ ok）· 超时面（长挂脚本 + 小 timeoutMs ⇒ 超时文案含实际 ms） | 真机（桌面线会话亲跑——**父侧**） | 真机 |
| V6b | 代理读数（可先跑）：直调 `electron.exe` + `["--input-type=module","--eval","console.log(1+1)"]` + env 补旗标 ⇒ stdout `2` ∕ exit 0（<10s） | 探测（父侧一次性探针，可住 `.thincoder/tmp/`） | 真机代理 |
| V7 | 五包平 node 腿 `npm test` **失败集合 ⊆ 批前失败集合**（核 ∕ CLI ∕ VSC ∕ desktop ∕ render-core——口径同既有回归判据 `docs/core/design/TOOLS.md` §6.12 A13） | 收口轮（**非 coder 链**） | 平 node |

### 2.6 关键决策（含被否候选）

| # | 决策 | 理由 ∕ 被否候选 |
|---|---|---|
| KD-1 | 修法 = **核内单点 `nodeChildEnv`**（`tools/node-child.mjs`）+ 两消费点接入 + exec-run 透传收敛 | 见 §6.18 ∕ D-TO14。① 两消费点各自内联判据——重复检测，第二点漏修即复发（本次 lint 快路径即第二点）· ② 端注入缝 `configureNodeChildEnv`——判据为运行时事实、三端同判据同取值 ⇒ 无端差值可注入，新增缝 + 三端接线代价 > 收益 · ③ 直改 `process.env.ELECTRON_RUN_AS_NODE = "1"`——污染父进程并殃及后续全部子进程 · ④ 依赖 PATH `node` ∕ 随产物分发 node 二进制——不可靠 ∕ 破零依赖 · ⑤ exec-run 内按 `cmd === process.execPath` 隐式补 env——对普通命令行为不可见的分叉（魔法） |
| KD-2 | 判据 = `process.versions.electron`（truthy）；已处 node 模式者为同值幂等（不分叉） | 否：判 `process.env.ELECTRON_RUN_AS_NODE` 在场（node 宿主不存在该量——判据失准）；判端名（违契约 5——端差以注入表达；`docs/core/design/CORE-UNIFICATION.md` §2.2） |
| KD-3 | 注入点 = `runNode` 单点（两径 + nodeArgs 全盖）+ linter 快路径 | 否：只在 inline 径补（scriptFile 漏）；在 `execute()` 入参层补（旁路可绕） |
| KD-4 | 测试 = 行为核（子进程 env 读数）+ 形面断言；判据注入双形（helper 缺省参 + 路径核临时置 `process.versions.electron`——try/finally 复位） | 否：仅结构核（不能证真启动语义）；仅纯函数核（不能证接入在场）；真 Electron 机检常驻（破平 node 腿纪律——真机面归父侧 V6） |
| KD-5 | 文档单源 = TOOLS.md §6.18 + 批档 §2 一次性材料；需求档零改 | 否：并入 §6.4（与边界段混叠）· 新开设计档（与 TOOLS.md 双权威，违 D2）· 需求档补行（语义未变——不必） |

### 2.7 上抛项

1. **邻类 PATH-`node` 两处**（`shared.mjs:247` · `verify.mjs:202`）——建议另立台账条目（桌面分发场景假红 ∕ 静默跳过面）；本批零动作。
2. **lsp 行失实收正**（TOOLS.md:197 → `config.lsp.servers` 的 `command`）：consistency 面当场修；若父侧认为该行涉他批口径可回退该行（§6.18 不受影响）。
3. **打包 fuse 前提**（`RunAsNode`）——现仓零 fuses 配置下成立；打包批登记一句（非本批）。
4. **可选加固**（父侧裁）：桌面 E2E 套件增 execute 冒烟用例——本批不做（真机面 = V6 亲跑）。
5. **真机腿依赖**：V6 需桌面线会话（父侧）——若届时不可得，V6b 代理读数 + V1–V5 已构成最小闭环，V6 记「未产」如实。

### 2.8 修正轮记录（设计评审 #210 · §3 轮次 1 · 七条逐号落定 · 2026-09-29）

| # | 级 | 处置 | 落点 |
|---|---|---|---|
| 1 | 🟡 | 口径归一：§2.4 VSC 行 = 单一口径（Electron 二进制 node 模式 · env 携旗标）并分述「覆盖面 ∕ 同值幂等」；§1 `:12` 限定半句 = 主 agent 亲落 | 本档 §2.4（VSC 行）· §1 `:12` |
| 2 | 🟡 | V3 补驱动方（置位 ⇒ 经 lint 快路径过 `lint` 工具驱动 `configureExecRun` 探针）；B2 判定句与读数一一对应（V3 = lint 径绑定 ∕ V4 = 缺省径透传） | 本档 §2.5 V3 · §2.1 B2 |
| 3 | 🔵 | V5 补「归一空白」断言前提 + 格式敏感注（换行 ∕ 缩进 ∕ 注释插入） | 本档 §2.5 V5 |
| 4 | 🔵 | V7 口径 = 失败集合 ⊆ 批前失败集合（同既有回归判据 A13） | 本档 §2.5 V7 |
| 5 | 🔵 | 行数对账（`wc -l` as-of 2026-09-29）：`TOOLS.md` 1175（设计轮 1172 + 修正轮 +3）· 核三档 235 ∕ 120 ∕ 139；§6.14 表 243（as-of 2026-09-21）与 235 之差 = 其后 `killProcessTree` 外提等改动净减——表下补口径注 | 本档 §2.4 表行 2 ∕ 行 6 + 表下注 |
| 6 | 🔵 | 「两条」对位：① #602（桌面 execute 失效）⇒ 本批 B1–B3；② #601（夹具污染真家）⇒ 另案已核销（见台账 #601）；B2 的 `lint` 面 = 设计轮自查新增（非走查令） | 本档 §2.1（B 表后） |
| 7 | 🔵 | 「契约 5」消悬空：`TOOLS.md` §6.18 判据段补出处（端差以注入表达 = `docs/core/design/CORE-UNIFICATION.md` §2.2）+ KD-2 同补 + `TOOLS.md` 变更记录一行 | `TOOLS.md` §6.18 · 本档 §2.6 KD-2 |

**边界**：本轮零机制面改动（口径 ∕ 读数 ∕ 指针 ∕ 对位收正）；产品码 ∕ 测试件零触；§3–§6 零触；§1 仅 `:12` 限定半句一处（主 agent 亲落 · 笔界）。**零新语义**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

限制声明：本轮读范围 = 两档（批档 + `docs/core/design/TOOLS.md`）；源码坐标 ∕ 行数 ∕ 全仓 grep 读数未对盘复核（设计自报项 = unverified）；无项目标准档与文档地图声明——ownership 与 methodology 依 Project Guide + 两档自载规约判定。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc-state（一致性） | 🟡 | VSC 宿主运行时属性两处表述互斥：§1.1 称「CLI ∕ VSC 宿主 execPath = node ⇒ 不受影响」（批档 `:12`），§2.4 称 VSC「扩展宿主 = Electron 二进制 node 模式（env 携旗标）」（批档 `:80`，附实证引注）——同一事实两说；两口径对「VSC 零动作」结论均成立 ⇒ 非决策面矛盾，属状态不一致。 | 收正为单一口径（以 §2.4 实读引证为准，或给 §1.1 补旗标限定半句）；同行「经 1 ∕ 2 号修复受益」与「同值幂等」宜分述（受益 ∕ 零变语义不同）。 |
| 2 | Acceptance（覆盖） | 🟡 | linter 消费点（B2 后半）无行为级读数：B2 完成判定句称「lint 快路径经 exec-run `opts.env` 透传（机检 V3 ∕ V4）」（批档 `:30`），但 V3 未写明驱动方（批档 `:94`）——若探针仅直调 exec-run，则 linter→exec-run 的 env 绑定只由 V5 源文本断言承载（批档 `:96`）；V4 验证的是 `defaultRun` 通用透传（批档 `:95`），不触 linter 点。 | V3 明确以「置位 `process.versions.electron` ⇒ 经 lint 快路径」驱动 `configureExecRun` 探针（或 V6 真机四读外补一读 lint 快路径），使 B2 完成判定句与读数一一对应。 |
| 3 | Test（脆弱面） | 🔵 | V5 形面断言以源文本串（`env: nodeChildEnv()` ∕ `opts.env`）为判据（批档 `:96`）——对换行 ∕ 空格 ∕ 注释插入敏感；其中 execute ∕ exec-run 两条已由 V2 ∕ V4 行为覆盖，仅 linter 一条为唯一读数。 | 断言归一空白 ∕ 锚定稳定 token（调用表达式存在性）；保留亦宜注明其对格式敏感的前提。 |
| 4 | Acceptance（口径） | 🔵 | V7「五包平 node 腿 `npm test` 全绿」（批档 `:99`）与项目既有回归口径（TOOLS.md `:360` A13「失败集合 ⊆ 批前失败集合（口径同 A-MS6）」）不一致——若仓内存在批前失败，「全绿」不可达。 | 改同口径（失败集合 ⊆ 批前），或注明「as-of 批前全绿」为该判据前提。 |
| 5 | 数字面（标注） | 🔵 | 行数读数两处待对账：① §2.4 表 `TOOLS.md` 现行数 1139（批档 `:67`）——本档实读末行 = `:1173`（设计轮已落，`§6.18` 起自 TOOLS.md `:961`）⇒ 1139 = 落笔前读数未随「已落」更新（.md 免登记，不影响判据）；② `execute.mjs` 现行数 235（批档 `:63`）与 TOOLS.md §6.14 落位表读数 243（TOOLS.md `:597`，as-of 2026-09-21）差 8——若系 §6.14 批 `killProcessTree` 外提后净缩减则自洽。 | 按 `wc -l` 对盘一次并注明 as-of；源码三档（235 ∕ 120 ∕ 139）本轮未对盘（读范围限两档）——建议机检轮顺带复核。 |
| 6 | Requirements（可追溯） | 🔵 | 14:14 令文「那两条走查问题」未逐条对位（批档 `:11` 仅载 execute 失效一宗）；B1–B3（批档 `:29-31`）无「两条」对位句。 | §1 或 §2.1 补一行「两条」→ B 条目对位（两条 = 两起超时同宗 ∕ execute + lint，择一写明）。 |
| 7 | Clarity（悬空引用） | 🔵 | 「契约 5」在 §6.18（TOOLS.md `:970`）与 KD-2（批档 `:106`）两处作为判据依据使用，两档内均无该编号定义或档位指针——档内不可解析。 | 补该编号出处指针（或改自明表述），消悬空。 |

计数：🔴 0 · 🟡 2 · 🔵 5

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-29 13:52「别等我了，自己跑完」授权——自缚三条件核验）：**

① **评审 pass**：§3 轮次 1 = 通过（🔴0 · 🟡2 · 🔵5——评审 #210）；
② **修正轮落定**：七条全落（§2.8 在册；父侧抽验通过：§2.1 B2 判定句 ∕ §2.5 V3 驱动方 ∕ V5 归一空白 ∕ V7 失败集合口径 ∕ §2.4 表 `wc -l` 读数（TOOLS.md 1175 · 三档 235 ∕ 120 ∕ 139）∥ §2.6 KD-2「契约 5」出处（`CORE-UNIFICATION.md` §2.2）——逐处现读一致）；
③ **token 在位**（评审 #210 签发——值不落档）。

**准予进入实施（§5）。** 波 1 = eng-coder 单轮（§2.4 表 1–5 号：`node-child.mjs` 新建 + 两消费点接入 + `exec-run` 透传 + 批内件 V1–V5 跑绿）。波 2 = 父侧（6 号已落；V6 真机四读 + V6b 代理读数 + V7 五包收口轮）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（波 1：四核件 + 批内件落位 · V1–V5 5/5 绿 · 内部背离审计 ∕ 代码评审 pass · fix round 0 · 2026-09-29）


### 波 1 实施记录（desktop-execute-electron-node · 2026-09-29 · eng-coder）

**范围** = §2.4 表 1–5 号：`node-child.mjs` 单点新建 + `execute` ∕ `linter` 两消费点接入 + `exec-run` `opts.env` 透传 + 批内件 V1–V5 落位跑绿。
**不在本波**：6 号（`TOOLS.md`——设计轮已落，批档声明零触）· V6 ∕ V6b ∕ V7（父侧：真机四读 ∕ electron 代理读数 ∕ 五包收口轮）。

**（1）逐项改动表（file:line = 落定后现盘；逐处读回）**

| # | 文件:行 | 改动 | Δ（`wc -l`） |
|---|---|---|---|
| 1 | `thincoder-core/tools/node-child.mjs`（新建） | `nodeChildEnv(base = process.env, isElectron = !!process.versions.electron)`——真 ⇒ `{ ...base, ELECTRON_RUN_AS_NODE: "1" }` 副本（不改父进程 env）；假 ⇒ 原样 `base`（同引用，逐字零变）；含档头注 + 判据注入第二参 | 新建 · **21** |
| 2 | `thincoder-core/tools/execute.mjs:31` ∕ `:87-88` | import `nodeChildEnv` + `runNode` spawn 选项补 `env: nodeChildEnv()`（inline `:230` ∕ scriptFile `:222` ∕ nodeArgs 直通均经 `runNode` 调用 `:233` 汇入 ⇒ 单点零旁路） | +3（235⇒**238**） |
| 3 | `thincoder-core/tools/linter.mjs:7` ∕ `:51` | import `nodeChildEnv` + `nodeCheckResult` 调用携 `env: nodeChildEnv()` | +1（120⇒**121**） |
| 4 | `thincoder-core/tools/exec-run.mjs:17-19` ∕ `:43` | 契约头注收正 `opts = { cwd?, timeout?, signal?, env? }` + `defaultRun` 补 `if (opts.env !== undefined) options.env = opts.env` | +2（139⇒**141**） |
| 5 | `.thincoder/tmp/2026-09-29-desktop-execute-electron-node.test.mjs`（候选终位 = `docs/batches/2026-09-29-desktop-execute-electron-node.test.mjs`） | 机检 V1–V5（行为 4 + 形面 1）；#545 立即形——写门判「跨批」拒 `docs/batches/` 落位，退 tmp 暂存（待父侧 copy 收位）；含两笔收笔：审计引证自修 + 终位复跑命令补句 | 新建 · **105** |

**（2）届盘实读 vs 设计表（§2.4 行数账）**

| 文件 | 设计读（⇒估） | 届盘实读（本波后） | 说明 |
|---|---|---|---|
| `node-child.mjs` | 新建 ≈28 | **21** | 内容齐备（判据 + 旗标 + 零变支 + 档头注）——估算偏保守 |
| `execute.mjs` | 235（⇒+2~3） | **238**（+3） | 与预估一致 |
| `linter.mjs` | 120（⇒+2） | **121**（+1） | env 行内补入调用行（原地改，不新增行）——增量口径差 1 行 |
| `exec-run.mjs` | 139（⇒+1~3） | **141**（+2） | 头注 +1 行 + 代码 +1 行 |
| 批内件 | 新建 ≈100 | **105** | 一致 |

**（3）决策透明表（适配 ∕ 随改 ∕ 披露 ∕ 只报）**

| 类 | 项 | 处置 | 依据 |
|---|---|---|---|
| 适配 | `defaultRun` env 透传取**条件式**（`if (opts.env !== undefined) options.env = opts.env`），非无条件赋值 | 与同档 cwd 行（`:42`）逐字同形；缺省（undefined）不设 = 继承语义逐字零变（行为等价） | §2.3(3)「补 `opts.env` 透传」+ 契约句「缺省不设 = 继承」 |
| 随改 | `exec-run.mjs` 契约头注 ∕ `defaultRun` 函注 | 头注收正 `{ cwd?, timeout?, signal?, env? }` + env 语义句；函注「cwd 未给则不设」⇒「cwd ∕ env 未给则不设」 | §2.3(3)「doc 收正 + 缺省径补齐」；注释与实现同变 |
| 披露 | 批内件落位 = `.thincoder/tmp/`（非 `docs/batches/`） | 写门判「跨批记录写」拒（子代理绑定档在场 ⇒ 批内非绑定档路径拒）；退 tmp 同件并报告，不绕门 | 兄弟批 #545 立即形成例（`desktop-micros` ∕ `window-queue-parity` 同款） |
| 披露 | `execute.mjs` env 行上方 1 行注释（§6.18 指针） | 设计表「+一行注释」预算内 | §2.4 行 2 增量列 |
| 只报 | TOOLS.md「拟新增」字样 ∕ §6.18 消费点坐标顺移 ∕ 批档 §2.2·§2.4 批内件终位未达 ∕ 邻类句未列 linter 全查径 PATH 命令 | 零改——不在本批写域（批档声明 TOOLS.md ∕ 批档零触） | 父侧收口轮（见收敛块） |

**（4）验证命令与读数（2026-09-29 14:4x–15:0x）**

- `node --test .thincoder/tmp/2026-09-29-desktop-execute-electron-node.test.mjs`（仓根 `thincoder/` 跑）⇒ **5/5 pass**（V1–V5 · fail 0；共跑三轮：落位首轮 → 审计引证自修后 → 终位命令补句后）。
- `node --check` 五档（四核件 + 批内件）⇒ **5/5 OK**。
- V2 读数：置位 ⇒ `1`；复位 ⇒ `unset`。V3 读数：探针捕获 `opts.env.ELECTRON_RUN_AS_NODE === "1"` ∧ 复位支 `opts.env === process.env`（同引用）。V4 读数：`1`。V5 读数：三条形面断言（归一空白后）全过。
- 独立复核（审计 ∕ 评审各一次）：全仓 `process.execPath` 产品码 node 语义消费点 = 核内 2 处（两处均修），CLI 1 处 ∕ 工程面各档前提成立 ∕ VSC·desktop `src/**` 零命中；`runCommand` 调用点仅 linter 新携 env，旧调用点零曾被传 env ⇒ 零静默行为变。
- **未跑仓级套件**（repo suite = 发布门 · 父侧收口一次跑 —— V7 五包）。

**（5）写后核（D6）**：四核件 + 批内件逐处读回（`node-child.mjs` 全档 · `execute.mjs:31/:85-89` · `linter.mjs:7/:51` · `exec-run.mjs:17-19/:40-45` · 批内件全档）；三档 `git diff` 对盘 = 逐字设计、零附带改动（工作树其余 M ∕ ?? = 他批在途，不入本批判据）。

**收敛块（审计 + 代码评审轮次与终态 · desktop-execute-electron-node 波 1 · eng-coder · 2026-09-29）**

- **内部背离审计（explore · 只读 · 轮次 1 即收敛）**：机制 ∕ 行为 ∕ 验收 ∕ 清单四类**零偏差**（🔴 无）；三残留项（TOOLS.md「拟新增」字样 ∕ 坐标顺移 ∕ 批内件终位）= 父侧收口面，只报不改。附记 ①：批内件头注「§2.2 预案」引证不确（§2.2 无该字面）——**已自修**（改「coder 任务书预案 ∕ 兄弟批同款立即形」）。② §5 现读为空——本记录即补。
- **代码评审（advisor · code · 轮次 1 即收敛）**：findings 5 条 = 🟡 3（皆非必改：TOOLS.md「拟新增」字样 ∕ 消费点坐标顺移 ∕ 批内件终位差）+ 🔵 2（V2 ∕ V3 复位支环境绝对读数加固建议 · 邻类句未列 linter 全查径 PATH 命令）；**无 🔴 ∕ 无 must-fix**。逐条处置：①②③ = 父侧文档收口（零动作）；④ = 明示前提（平 node 腿）已载 §2.5，保留设计字面（加固属可选项）；⑤ = 父侧邻类句收口（零动作）。
- **fix round = 0**（无 must-fix）；**终态 = clean**（审计四类零偏差 · 评审 pass · V1–V5 5/5 绿 · 语法门 5/5）；两笔可选收笔随记录在册（见（1）行 5）。
- **待父侧**：`TOOLS.md` 收口三残留（「拟新增」字样 ∕ 消费点坐标重锚 ∕ 邻类句可选补 clause）· 批内件 copy 收位 `docs/batches/` · V6 真机四读 + V6b 代理读数 · V7 五包收口轮 · §6 收口。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29——波 1 后即时部分，V7 待终局轮）**

**父侧 V6 代理读数（探针 `.thincoder/tmp/electron-exec-probe.mjs` · 宿 = 真 electron.exe（44.4.5）以 ELECTRON_RUN_AS_NODE 启动、**删旗标仿真桌面 env**——真判别）**：

| 读 | 期望 | 实测 |
|---|---|---|
| 宿主面 | execPath = electron.exe ∧ 宿 env 无旗标 | ✓（`D:\…\electron.exe`；`env flag after delete = unset`） |
| V6.0 子进程 env | `1`（旗标由 `nodeChildEnv` 施加，**非继承**） | ✓ `"1"` |
| V6.1 inline | `2` | ✓ `"2"` |
| V6.2 scriptFile | 输出在场 | ✓ `"from-scriptFile"` |
| V6.3 nodeArgs `["--check"]` | 净过（零诊断） | ✓ `"(no output)"`（空输出占位——exit 0） |
| V6.4 超时面（真悬挂 `setInterval` + `timeoutMs:1500`） | 文案含实际 ms | ✓ `"Error: script timed out after 1500ms — …"`（实际 1600ms 被杀） |

**V6b**（直调 `electron.exe -e "console.log(1+1)"` + 旗标）⇒ stdout `2` ✓。**性质**：代理宿主（electron-as-node——真二进制 ∕ 真核件 ∕ 真 spawn 径；非桌面 UI 会话）——全真桌面会话内实调 = 建议走查项（非阻断；同进程属性已证）。**V7**（五包 `npm test` 失败集合 ⊆ 批前）= 终局收口轮（全写者停后）——待落。**批内件转正**：`docs/batches/2026-09-29-desktop-execute-electron-node.test.mjs`（父侧 copy · 复跑 = `node --test docs/batches/…test.mjs`）。

**父侧收口笔清单（舱报披露②）**：`TOOLS.md:965 ∕ :1006`「拟新增」字样失实收正 · §6.18 消费点坐标重锚 · 邻类句可选补——**即时处理**（父侧笔面 · 零语义）。

**§6 续（V7 与结算 · 父代理 · 2026-09-29）**

**V7 五包套件（终局轮实跑）**：`thincoder-core` ∕ `thincoder-cli` ∕ `thincoder-vscode` ∕ `thincoder-desktop` ∕ `thincoder-render-core` 五包 `npm test` 逐包实跑——**五包全绿**（实态 = `test manifest is empty — zero tests = green（2026-09-28 full reset）`——全清令后测试树空清单，零测试零失败 ⇒ 失败集合 = ∅ ⊆ 批前 ✓）。**回归证据 = 批内件**：`docs/batches/2026-09-29-desktop-execute-electron-node.test.mjs` **父侧亲跑 5 ∕ 5**（V1–V5）。

**波 2 收官（父侧）**：V6 代理四读 + V6b ✓（上文）· TOOLS.md 收口笔六连 ✓（「拟新增」×2 退场 ∕ 消费点坐标重锚 ∕ 变更行）· 批内件收位 ✓。**上抛面**：邻类（PATH-node 两处 + 配置命令面）+ 打包 fuse（RunAsNode 前提）= 台账 **#611**（打包/发布轮）；V3 ∕ V4 ∕ V5 覆盖点全在。

**边界**：产品码零增量越表（四档 + 批内件）；设计档仅 TOOLS.md 收口笔（父侧直接执行标记）；需求档 ∕ 他批射程零触。

**结算（D7）**：**#602 → 已核销**（依据本节 + 上文 V6 读数 + 波 1 交付）。**状态行**：已收口 2026-09-29。
