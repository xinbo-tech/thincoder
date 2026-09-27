# 2026-09-27 · 环境变量配置面拔除（核 2 支 + 测试 seam）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 01:51 裁定（「不用环境变量做配置…完全不用」）+ 01:52 澄清（「不是说不用系统环境变量」）+ 01:54 追加（「存量的也直接拔掉，不要再留了」）——台账 #437。。
> 台账 = #437（设计不依赖环境变量 · 归批）。前情 = docs/batches/2026-09-26-desktop-impl-9.md §6（已收口 2026-09-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 **2026-09-27 01:51** 裁定（「不用环境变量做配置…**完全不用**」）✓ + **01:52** 澄清（「**不是说不用系统环境变量**」✓ ⇒ 规则收窄 = **不得用 env 做"自有配置 / 行为输入"通道** ✓·系统原语照常 ✓）+ **01:54** 追加（「**存量的也直接拔掉，不要再留了**」✓ ⇒ **无过渡回退** ✗）。台账 **#437** ✓。

### 1.2 条目（三件 · **同轮不可分** ✗）

1. **核产品面 2 支拔除** ✗——`THINCODER_LOG_DIR`（`thincoder-core/log.mjs:51` · `:64` ✓）· `THINCODER_TRACES_DIR`（`thincoder-core/traces/trace-store.mjs:50` · `:56` ✓）⇒ **兑现面** = 遵守新规的等价能力（**`config.json` 键 ∥ 显式 setter / 传参** —— 形由设计裁 ✓）；**禁** = env 回退 ✗（用户明令 ✓）。
2. **测试 seam 全量改制** ✗——实读命中 **≥11 档**（core 3：`advisor-cancel-faces` / `async-discard` / `log.test` ✓ ∥ **cli 8**：`input-lock` / `integration/subagent-lifecycle` / `provider-error-surface` / `queue-payload-binding` / `session-gc-cli` / `subagent-zero-block` / `sync-cancel` / `trace-bounds` ✓）；**权威清单 = 设计首步全仓实扫** ✗（**本批父侧 grep 受 200 命中上限截断** ✓·且 vscode 面与他名 env〔如 `THINCODER_TUI_WRAPPED` ✓〕未扫 ✓）⇒ 同轮改制（**否则测试写真实 `~/.thincoder/logs` ⇒ 污染** ✗）。
3. **关联文档面随动** ✓——`docs/core/design/LOGGING.md:91/:104/:105/:120` ✓ · `docs/core/requirements/LOGGING.md:71/:79/:88` ✓ · `docs/core/design/AGENT-LOOP-SUBAGENT.md:813` ✓。**不改** ✗：`docs/batches/**`（冻结记录 ✓）· `thincoder-cli/docs/_archive/**`（归档 ✓）· `.thincoder/tmp/**`（临时件 ✓）。

### 1.3 判据（机器可核 ✓）

① 全仓 grep `THINCODER_LOG_DIR|THINCODER_TRACES_DIR` **零命中**（排除临时候选面 = `.thincoder/tmp/**` · 日志件 · 冻结批档 · `_archive/**` ✓）；② **三端测试全绿**（`node test/run.mjs` × 3 ✓）；③ **行为等价** ✓——日志 / 轨迹仍能落指定落点（由新 seam 驱动 ⇒ 用例证明 ✓）；④ `doc-check` 本批面零新增 ✓；⑤ **本批 diff 的 env 读取增量为 0** ✗（`process.env.<自有名>` 计数 ✓）。

### 1.4 边界 / 依赖

**不做** ✗：桌面端（其四支 = **系统原语替换** ✓·按 01:52 澄清不属本规 ✓）· 工具层 `HTTPS_PROXY`（**例外面** ✓·外部约定 ⇒ 父侧默认不动 ✓）。**待裁（设计首步定）** ✗：他名自有 env（`THINCODER_TUI_WRAPPED` 类 ✓）是否同批拔 ⇒ 判据 = 是否属"自有配置 / 行为输入" ✓。
**依赖** ✓：与在飞三舱（批 A-1 / A-2 / A-3）**零文件交集** ✓（其域 = `thincoder-desktop/**` ✓）⇒ 可并行 ✓；**本批域** = `thincoder-core/**` + `thincoder-cli/test/**` + `thincoder-vscode/**` + 三份核心文档 ✓。

### 1.5 域裁定（父侧 · 2026-09-27 01:58 · **覆盖 §1.4 的域句** ✓）

**缘起** ✗：#44 上抛「§1.4 域声明（`core/**` + `cli/test/**` + `vsc/**` + 三文档）与判据（"自有配置 / 行为输入"全族）相抵」✓——并给出同判下的实际族面（cli/src·bin 七支：`THINCODER_HEAP_WATCH` · `THINCODER_HEAP_SNAPSHOT` · `THINCODER_TUI_WRAPPED` · `THINCODER_TEST_CRASH` · `THINCODER_TEST_TUI_ACTIVE` · `THINCODER_TEST_CLEANUP_OUT` · `THINCODER_DEBUG_RENDER` ✓；core 两支：`THIN_DEBUG_BODY` · `ADVISOR_DEBUG` ✓；bench / 工具面：`BENCH_JUDGE` / `BENCH_PRICES` / `BENCH_RESULTS_DIR` · `THINCODER_SMOKE` · `DOC_CHECK_NESTED` · `FAKE_MCP_READY_FILE` ✓）。

**裁定** ✓：**扩域 · 全族同批拔** ✗——依据 = 用户规则**全称**（「完全不用」+「**不要再留了**」✓）⇒ **以判据为准** ✓（§1.4 的窄域句**失效** ✗·以本块为准 ✓）。

**唯一保留集 = 外部约定** ✗（非"我们的配置" ✓）：`NODE_TEST_CONTEXT` · `ELECTRON_RUN_AS_NODE` · `HTTPS_PROXY` / `NO_PROXY` 一族 · CI 与 `npm_*` 系 ✓。**其余自有名一律拔** ✗。

**实施切分** ✓（**同批** ✗·三组舱切）：**S1** = core 2 支 + 全测试 seam + 文档随动 ✓ ∥ **S2** = cli 运行时开关 ✓ ∥ **S3** = bench / 工具面 ✓。

**排除面** ✓：冻结批档 · `**/_archive/**` · `.thincoder/tmp/**` ✗。

### 1.6 上抛裁定（父侧 · 2026-09-27 02:12 · 对 §2.5 六条 ✓）

1. **判据① 域 = 准并加宽一格** ✓：域 = **代码面**（四产品树 `.mjs`，含测试 ✓）+ **活档规范句**（`docs/core/design/**` · `docs/cli/design/**` · **`docs/core/requirements/**` · `docs/cli/requirements/**`** 〔父侧本轮落笔后即入域 ✓〕· `docs/RELEASE.md` 与 `thincoder-cli/AGENTS.md`〔父侧落笔后入域 ✓〕）；**排除** = 冻结批档 / `**/_archive/**` / `.thincoder/tmp/**` / changelog 与历史段（**记录面** ✓）。
2. **需求档两处 env 句 = 父侧笔** ✓（本块同轮落定 ✓）：`docs/cli/requirements/CRASH-REPORTS.md`（可关值集合句 ⇒ 配置键 `diagnostics.heapSnapshot` / `heapWatch` 取 `false` ✓）· `docs/core/requirements/LOGGING.md`（测试隔离句 ⇒ 日志落点缝〔进程内〕✓）。
3. **`FAKE_MCP_READY_FILE` 死块 ⇒ 随批删** ✓（实扫零消费者 = 死面 ✓·**无"预留豁免"一说** ✗）。
4. **两处 smoke 用法行 ⇒ 父侧笔** ✓（`docs/RELEASE.md` ∥ `thincoder-cli/AGENTS.md`——替换文本照 §2.5 #4 ✓·打标「父侧直接执行」✓）⇒ **不入实施舱 files** ✗。
5. **调试三支退场 = 准** ✓（`THINCODER_DEBUG_RENDER` / `THIN_DEBUG_BODY` / `ADVISOR_DEBUG` 一并拔 ✓·按 D-CF5 ✓）——**能力收缩已向用户披露** ✓（可否决 ⇒ 回退形 = argv / 配置键 ✓）。
6. **用户面换落点通道收缩 = 准** ✓（本批拔尽 ✗·**不另批加配置键** ✓）——**已向用户披露** ✓（若需保留 ⇒ 另案 ✓）。

### 1.0 用户授权（**父侧代点火 + 代批准** · 2026-09-27 02:18 ✓）

用户原话 ✓：「**你自动跑完吧**」⇒ 本批链上：**设计评审点火权** + **§4 批准权** + **修正 / 实施轮派发** + **收口核销 / 提交推送** —— 均**委托父侧自动执行** ✓。

**射程** ✓：当前在飞链（批 A 六舱 · 批 C 收尾 · 本批）+ **批 B**（既定射程 ✓·用户 2026-09-26 22:25「能两批都做就都做了吧」✓）。
**父侧自缚三条** ✗（沿本仓先例 `docs/batches/2026-09-21-end-diff-doctrine.md` §1.0 ✓）：
1. **代签仅在三条件齐备时**：「评审 pass（0 🔴）∧ 修正轮落地并逐条核验 ∧ token 已签发」✓；
2. **代签写明依据** ✓（评审 id / 核验结论 / 发现处置表 ✓）；
3. **需新范围 或 用户口径裁决 ⇒ 停下** ✗（不因授权扩张射程 ✓）。**已披露默认**（能力收缩两件 ✓·§2.5 #5 / #6 ✓）= 按披露走 ✓·用户随时可否决 ✓。

### 1.7 评审轮 1 处置（父侧 · 2026-09-27 02:26 ✓）

**评审读回** ✓：`changes-required`（**1 🔴 · 6 🟡 · 4 🔵 = 11 条** ✓·发现表逐字在 §3 ✓·`reviewId 93614b78` ✓）。**逐条裁定** ✗：**10 条接受 ✓ · 1 条（#11）= 正面覆盖核验（无需动作 ✓）**。

- **设计面 8 条（#1 #2 #4 #5 #6 #7 #8 #10 ✓）⇒ 修正轮 #57（eng-designer · round=fix ✓）**：点修 + 逐条读回 + 报 `号 → file:line` ✓·禁动需求档 / 产品码 ✗。
- **父侧笔 2 条 ⇒ 同轮落定** ✓：**#3** = `docs/cli/requirements/CRASH-REPORTS.md:25` F4 行「可关（env）」⇒「可关（配置键 `diagnostics.heapWatch` 取 `false`）」✓ + 变更记录行 ✓；**#9** = `docs/core/requirements/LOGGING.md` 变更记录补 2026-09-27 行 ✓（§4.4 缝口径随动 ✓）——两档规范面改动自此记录面可追 ✓。
- **#11 留痕** ✓：族面覆盖经评审实核齐全（17 名命中档全在影响表 ✓·例外面在册 ✓）。
- **代签前置** ✓：本轮**不是 pass** ⇒ 无 token 签发 ✓·§4 不代签 ✓（自缚三条件第一条未达 ✓）。**下步** = #57 落定 ⇒ 父侧核验 ⇒ 二轮评审（授权内代点火 ✓）⇒ pass 后方谈 §4 ✓。

### 1.8 修正轮核验 + 二轮评审点火（父侧 · 2026-09-27 03:30 ✓）

**修正轮（#57）核** ✓：`号 → file:line` 清单齐（#1 #2 #4 #5 #6 #7 #8 #10 ✓）；**双闸零新增** ✓（锚闸悬空 34 = 基线 · 行宽 18 = 全存量；**修正中引入的 1 锚 + 7 长行已自纠归零** ✓）；§2.8 收尾核 + 坐标漂移注已入档 ✓。
**父侧亲验** ✓：`docs/cli/design/CRASH-REPORTS.md:33` = `{ dir, heapSnapshot = true, armHeapSnapshot }`（**`env` 已除** ✓）+ `:34` 判定单点句 ✓；`docs/core/design/CONFIG.md:123` = ③ 行补「命名 / 成对例外」✓·`:144` / `:146` 逐行标 ✓·`:147` judge/prices 补 `_reset` 半 ✓·`:152` 混合形口径 ✓·`:154` 派生消费面登记（= #7 ✓）。
**#57 三条上报价处置** ✓：① 需求档面（`:25` 残句 + 两档变更记录）= **父侧已于 02:27–02:28 落定** ✓（其读取时点早于我的落笔 ✓·交界面无冲突 ✓）；② `CORE-UNIFICATION` 行 14 / 子表行 3 的「待补拆分计划」与盘上既有预案相抵 = **列入二轮评审对象** ✗（评审裁后再动 ✓·不自裁 ✓）；③ #10 坐标更正（实指 §1.5 `:30` ✓）照准 ✓。
**二轮评审已点火** ✓（授权内代点火 ✓·`documents` = 轮 1 七档 + 修正轮新触三档〔`CLI-DEBT` / `CORE-UNIFICATION` / `VSC-DEBT`〕✓）。

### 1.9 实施舱体系与 S1 交付核（父侧 · 2026-09-27 04:00 ✓）

**㈠ S1 核舱（#62）交付核** ✓：`cd thincoder-core && node test/run.mjs` ⇒ **700/700 · 0 fail**（父侧复跑 ✓）；advisor pass（0🔴 · fix 0 轮 ✓）；9 档全落（③ 缝成对 + 写门两侧同形 + `diagnostics` 两键 + 调试面退场 ✓）。
**其披露处置** ✓：① **实删 42 行** vs 估 −6（点区块含体 + 说明 ⇒ 无附带删除 ✓·审计复验 ✓）= **准** ✓；② `agent.mjs:265` 拼接 `try {` 保原样 = **准** ✓（存量格式 ✓）；③ `log.mjs` 行读数（现 201）⇒ **收口轮设计面** ✓；④ §1.5「S1 = 全测试 seam」措辞与本批实分（core-only）**相抵** ✗ ⇒ **本块收正**：S1 实域 = **核面**（5 src + 3 测试 + `core-hygiene` 登记 ✓）；**全部非核测试 seam 分归 S2b1 / S2b2 / S3a2 / S3b** ✓；⑤ **cli/vsc 实测 15 档仍含已拔名** ✗（S2/S3 落舱前其事件断言预期红 ✓）= **同批闭合义务** ⇒ **已即派** ✓；⑥ 读档超 ≤12 预算 = 披露 ✓（其产出健康 ✓·不究 ✓）。

**㈡ 实施舱体系（8 舱 · 域互斥 ✓）**：**S1** 核（#62 ✅ 交付 ✓）∥ **S2a** cli 源（#63 🔄）⇒ **S2b1** cli 堆/工具族测试（#66 ⏸ dep #63 ✓）· **S2b2** cli 日志/轨迹缝族测试（#67 ⏸ dep #63 ✓）∥ **S3a1** bench 源（#64 🔄）⇒ **S3a2** bench 测试（#68 ⏸ dep #64 ✓）∥ **S3b** vsc 测试（#65 🔄）✓。
**判据闭合分工** ✓：① 零残引 = 各舱自域 ✓ + 父侧终扫（收口轮 ✓）；② 全绿 = 各包自跑 ✓；⑤ env 增量 0 = 各舱 diff ✓。

### 1.10 S2a 交付核 + 偏差点处置（父侧 · 2026-09-27 04:13 ✓）

**核** ✓：`bin/**` + `src/**` 对七名 **零命中**（父侧递归实扫 ✓）；六档零越面 ✓；其自证读数可信（旗标冒烟 exit 1 + 唯一 stderr 行零旧名 ✓·沙箱探针证键贯通 ✓）。

**T 项处置** ✓：
- **T1**（§2.3 字面「三钩改 `args.includes`」vs 实现取**原始 argv** ✗）⇒ **收口轮改措辞、不改码** ✓ ——其证据成立：`args` = 命令位后切片 ⇒ 旗标居首永假 ✗；全剥离则 `bin --test-crash` 会进包装层 ✗（ANSI 污染 stdout ✗）⇒ 原样 argv 为等价唯一解 ✓。
- **T2**（坐标漂移 `bin:58-61` vs 设计 `:151-155` ✓）⇒ 收口轮随登记收正 ✓。
- **T5 / T7**（两处未登记副作用 ✗）：① 包装门改 argv ⇒ 仅直系子进程生效（旧 env 门及于全后代 ✓）⇒ TUI 会话内嵌套起多一层包装 ✓（无功能破坏 ✓）；② `loadConfig()` 现于**全命令路径**运行（含 `--version` ✓）⇒ 老字段迁移写回 / 告警可能出现 ✓（stdout 未污染 ✓）⇒ **收口轮在 `CONFIG.md` §6.2 补注** ✓（是否收窄读键命令面 ⇒ 设计裁 ✓）。
- **T6** ✗✗：`bin/thincoder.mjs` **499 行贴 500 硬限（余 1）** ⇒ **已入台账 #438**（tech_todo · 归批 ✓·载体 = `CLI-DEBT.md:35` A4 ✓）——**余量 1 ⇒ 任何再增即越硬限** ✗ ⇒ 命令分发表外提须先于该档下次触碰 ✓。
- **两条 🔵 注释建议** ✓ ⇒ 收口轮一并裁（改注释 ⇒ 需重跑相关评审 ✓·当时冻结期未改 ✓ = 正确 ✓）。
- **域外注（13 档 cli 测试仍驱动旧通道 ✓）= S2b1 / S2b2 已承接** ✓（在飞 ✓）。

### 1.11 S3a1 交付核（父侧 · 2026-09-27 04:18 ✓）

**核** ✓：`bench/lib/**` + 三入口对三名零命中（父侧实测 ✓——命中仅余 `bench/test/**` = S3a2 域 ✓）；6/6 语法绿 ✓；缝行为 10/10 + dry-run 三支 exit 0（其自证 ✓·内审 CLEAN ✓·评审 pass 0🔴 ✓）。
**披露处置** ✓：① USAGE 扩面（+14/+11/+8 ✓）= ② 面（CLI 契约）正当扩张 ⇒ **准** ✓；② toolcall 两参数（grep 实证无判官面 ✓）⇒ **准** ✓；③ **档外清场（删 62 件 untracked 夹具产物 + 自检产物 ✓）** ⇒ hmm：**删动作** ✗ ⇒ 审查：所删 = **测试跑出的 untracked 产物**（旧 env 重定向已死 ⇒ 落真实 `bench/results/` 污染 ✓）+ 其自检产物 ✓；**12 件 tracked 资产零动** ✓ ⇒ **处置正当** ✓ + 已披露 ✓；**操作纪律注记** ✗：子代删档须「只删自产 / 已披露」——本次合规 ✓；④ 读档超预算 ✓ 披露 ✓（读多写零越权 ✓）。
**域外项 ⇒ 收口轮 / 在册** ✓：② `run.mjs` 310 · `probe.mjs` 310 · `toolcall.mjs` 262（越 300 建议线 ⇒ 登记 + 拆分计划 / 免拆口径 ✓）；③ `bench/README.md:43-53` 参数表未列三新参（**用户面文档** ✗）⇒ 收口轮设计面并入（或另立条目 ✓）；⑤ `preflight.mjs` 不接 `--judge-config`（设计裁「0 参」✓）⇒ 登记「跑批与单跑预检不同源」之意图缺口 ✓；⑥ 批档 §2.6 #3 前提已废（读点现惰性 ✓）⇒ 收口轮收正 ✓；⑦ `--max-cost` / `--recompute` / `--rejudge` 三路径未端到端实跑 = 如实未验 ✓。
**⚠️ 纪律传令** ✓：**S3a2（#68）落舱前，父侧与各舱不跑 bench 全量套件** ✗（否则夹具产物落真实 `bench/results/` + 撞 KD-10 同名拒写 ✓）——本块即传令面 ✓。

### 1.12 S2b2 交付核 + 首跑红面定性（父侧 · 2026-09-27 04:28 ✓）

**核** ✓：8 档落位（7 档日志/轨迹缝 + 1 档 argv/假 HOME ✓·设缝/重置成对 ✓）；`cli` 全量 **865/865**（其自证 ✓·复跑）；三 env 名（含注释）零命中 ✓；内审 none-found + 评审 pass（0🔴 ✓·fix 0 ✓）。
**"首跑 1 红（`doc-check.test.mjs` T-DC-15）" 定性** ✗（其自报"负载抖动"= 观察性 ✓·未证根因 ✓ —— **诚实 ✓**）：**父侧给出更可信的根因** ✗ —— 该档正被 **S2b1（#66）在飞改制**（`:303-320` 的 `--nested` 面 ✓）⇒ **两舱同树跑全量套件 + 一舱在改该档** ⇒ 瞬时红属**并跑干扰** ✓（非负载抖动 ✓）。**纪律补丁** ✗：**同树多舱在飞期间，全量套件读数只作参考** ✓——终局读数以**全部舱落定后的父侧复跑**为准 ✓（本批判据②的最终面 = 收口轮父侧读 ✓）。
**其余处置** ✓：④ 未落的 🔵（`provider-error-surface.test.mjs:273` 未落盘时抛 TypeError 而非断言失败）⇒ **在册**（收口轮设计面 / 另批 ✓·存量非本批引入 ✓）。

### 1.13 S3a2 交付核（父侧 · 2026-09-27 04:31 ✓）

**核** ✓：`node --test "bench/test/*.test.mjs"`（cwd=`thincoder`）⇒ **116/116 · exit 0**（父侧亲跑 ✓·较 S3a1 基线 90/26红 转全绿 ✓）；`bench/` 全树三 env 名 + `process.env` **零命中** ✓（纯删零增 ✓）；`bench/results/` 跑后与跑前一致（沙箱隔离成立 ✓）；fix 1 轮（`fixtures.mjs` 陈旧注释改述 ✓）后复跑绿 ✓。
**禁令解除** ✓：**bench 全量套件禁令自此解除** ✓（S3a1 §1.11 所立 ✓）。
**域外项 ⇒ 收口轮** ✓：① 记录面收正（§2.6 #3 前提已废 · §2.3:169「须在 import 前」句 ✓）；② 🟡#2 参数面在测试内不可证伪（**双面同值 ⇒ 删参数亦绿** ✓ ⇒ 可选强化 = 留一条只靠参数的腿 ✓）⇒ 登记 ✓；③ 存量 🔵（`judge-fallback:16` 未用导入 · `recompute:166` 恒真占位 ✓）；④ 坐标漂移（`fixtures.mjs:18` vs 表 `:17` · `judge.test.mjs` 297 vs 表 298 ✓）。
**env 批实施进度** ✓：S1 ✅ · S2a ✅ · S3a1 ✅ · S3a2 ✅ · S3b ✅（**五舱交付核毕** ✓）⇒ 仅余 **S2b1（#66）** 一舱 ⇒ 落定即全批实施完成 ✓。

### 1.14 S2b1 交付核 + **实施全面完成**（父侧 · 2026-09-27 04:35 ✓）

**S2b1（#66）核** ✓：cli 全量 **865/865 · exit 0**（**父侧亲跑 ✓**·86.8s）；17 名全族在 cli 测试树零命中 ✓；`process.env` 面全枚举（余三处皆保留集 ✓）；fix 1 轮 ✓·clean ✓。
**其两条上抛处置** ✓：① **两处 smoke 用法行（旧形现为「静默 skip = 假绿」✗）⇒ 父侧同轮落定** ✓（`thincoder-cli/AGENTS.md:35` · `docs/RELEASE.md:119` ⇒ `node test/smoke-qwen-thinking.mjs --smoke` ✓·打标「父侧直接执行」✓）；② 记录面收正（CLI-DEBT B8 332 ⇒ 340 · §2.6 #3 前提废 ✓）⇒ 收口轮设计面 ✓。
**域外项** ✓：键面全链路无自动化承重（S2a 曾沙箱探针证一次 ✓）+ 慢例缺省形覆盖缺口 ⇒ **收口轮设计面 / 在册** ✓（`doc-check` T-DC-15 并跑敏感 = 存量 ✓）。

**【本批实施全面完成】** ✓✓（七舱全交付且**父侧逐舱亲跑核毕**）：S1 ✅ 700/700 · S2a ✅ 0 残引 · S2b1 ✅ 865/865 · S2b2 ✅ 865/865 · S3a1 ✅ 0 残引 · S3a2 ✅ 116/116 · S3b ✅ 1010/1010 ✓。
**判据终局读数** ✓：① 零残引（各族面实扫 ✓）· ② 各包全绿（core 700 / cli 865 / vsc 1010 / bench 116 ✓）· ③ 行为等价（缝/键/argv 三面用例 + 沙箱探针 ✓）· ④ doc-check 本批面零新增 ✓· ⑤ env 读取增量 0（各舱 diff 自证 ✓）。
**下一步** ✓：**收口轮设计面**（T1/T2/T5/T7 + 记录面收正 + 在册刷新 + README 参数表 + 两条覆盖缺口登记 ✓）⇒ 该轮落定后：§6 收口 + 台账 #437 核销 + 提交 + `consume-design` ✓。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.3 影响文件表（现读数 → 预计增量 / 改点）

**core**

| 文件 | 行 | Δ | 改点 |
|---|---|---|---|
| `thincoder-core/log.mjs` | 89 | +6 | `:51` 缝读点（`_logsDir ?? homedir()`）· `:64` 写门（`NODE_TEST_CONTEXT` ∧ `_logsDir === null`）· 新增 `_set` / `_reset` 对 |
| `thincoder-core/traces/trace-store.mjs` | 300 | +6 | `:50` / `:56` 同形；`:103` `_resetTraceStateForTest` = 状态复位（非 root）⇒ 保留 |
| `thincoder-core/config.mjs` | 420 | +6 | DEFAULTS 加 `diagnostics.{heapWatch,heapSnapshot} = true` + 类型回退 |
| `thincoder-core/agent.mjs` | 446 | −2 | `:265` `ADVISOR_DEBUG` 分支删 |
| `thincoder-core/provider/core.mjs` | 492 | −6 | `:129` / `:170` / `:368` `THIN_DEBUG_BODY` 分支删（含 `:365` 注释） |
| `test/log.test.mjs` | 121 | ±0 | `:71` 测试名 + `:72-117` 三处 env → 缝调用 |
| `test/advisor-cancel-faces.test.mjs` | 254 | ±0 | `:93-116` / `:223-250` 两处 env → 缝（try/finally 复原 → `_reset`） |
| `test/async-discard.test.mjs` | 254 | ±0 | `:28` / `:32` 同形 |

⚠️ `trace-store.mjs` 300 → ~306：超 300 建议线（< 500 硬线 ⇒ 无拆分义务；与 `bin` 483 同族既有在册债）——登记。

**cli**

| 文件 | 行 | Δ | 改点 |
|---|---|---|---|
| `bin/thincoder.mjs` | 483 | +10 | `:45` 门改 argv 标志 · `:94-100` 三钩改 `args.includes` + `--test-cleanup-out=` 解析 · 顶部 `--tui-wrapped` 剥离 · `:151-155` 前插两键 `loadConfig()` 读（抛 ⇒ 默认开） |
| `src/crash-reports.mjs` | 180 | −8 | `:73-75` `heapSnapshotEnabled(env)` + 关值集合删；`:86` 签名改 `{ heapSnapshot = true }` |
| `src/heap-watch.mjs` | 89 | −6 | `:24-27` `heapWatchEnabled(env)` + 关值集合删；`startHeapWatch({ enabled = true })` |
| `src/tui/wrapped-spawn.mjs` | 59 | ±0 | `:50` env 注入 → argv 注入（`["--tui-wrapped", ...args]`）· `:46` 注释 |
| `src/tui/tui-lifecycle.mjs` | 104 | +4 | `:62` 读点改缝 · 新增 `_setCleanupOutPathForTest` · `:57` 注释 |
| `src/tui/render-loop.mjs` | 131 | −1 | `:125` `THINCODER_DEBUG_RENDER` 分支删 |
| `test/heap-watch.test.mjs` | 114 | −6 | `:34-48` 关值矩阵 → `enabled:false` 单例 + 默认开例 |
| `test/crash-reports.test.mjs` | 244 | −4 | `:38` / `:44-45` `{ env: {THINCODER_HEAP_SNAPSHOT} }` 参数形 → `{ heapSnapshot: bool }` |
| `test/tui-stderr-capture.test.mjs` | 165 | −8 | `:66-76` HEAP_SNAPSHOT env 对删 · `:84-99` 三处 spawn env → argv（「宿主 env 透传中和」段整体消失） |
| `test/doc-check.test.mjs` | 333 | ±0 | `:303-320` 子实例改直跑本档 + `--nested`（须实证非空跑——2.6 #1） |
| `test/input-lock.test.mjs` | 310 | ±0 | `:359-364` env → 缝 |
| `test/integration/subagent-lifecycle.test.mjs` | 400 | ±0 | `:198` / `:241` 同形 |
| `test/provider-error-surface.test.mjs` | 115 | ±0 | `:263` / `:270` 同形 |
| `test/queue-payload-binding.test.mjs` | 154 | ±0 | `:93` / `:112` 同形 |
| `test/subagent-zero-block.test.mjs` | 204 | ±0 | `:28` / `:32` 同形 |
| `test/sync-cancel.test.mjs` | 123 | ±0 | `:171-186` 同形 |
| `test/trace-bounds.test.mjs` | 114 | ±0 | `:24-31` env → 缝 · `:5` 注释 |
| `test/session-gc-cli.test.mjs` | 231 | −2 | `:29` 沙箱 env：`THINCODER_TUI_WRAPPED: "1"` → argv `--tui-wrapped`；`THINCODER_TRACES_DIR` **直接落**（假 HOME 已使子进程 `configDir` = 沙箱 ⇒ 该钉冗余，`trace-store.mjs:50` 走 `homedir()` 派生） |
| `test/smoke-qwen-thinking.mjs` | 96 | ±0 | `:12-15` 门改 `process.argv.includes("--smoke")`（缺 ⇒ skip + exit 0） |
| `test/smoke-responses.mjs` | 62 | ±0 | `:24` 注释随改（门控同构句） |

**vsc**

| 文件 | 行 | Δ | 改点 |
|---|---|---|---|
| `test/activity-live-visibility.test.mjs` | 400 | ±0 | `:33` / `:45` 缝调用 · `:73` 注释 |
| `test/async-parity.test.mjs` | 493 | ±0 | `:16` 头注 · `:50` / `:54` |
| `test/async-visibility.test.mjs` | 453 | ±0 | `:43` / `:54` · `:108` 注释 |
| `test/nested-token-relay.test.mjs` | 231 | ±0 | `:40` / `:48` · `:61` 注释 |
| `test/upstream-parity.test.mjs` | 276 | ±0 | `:37` / `:40` |
| `test/workspace-guard.test.mjs` | 488 | ±0 | `:6` 头注 · `:44` / `:58` · `:111` 注释 |
| `test/trace-store.test.mjs` | 400 | −4 | `:41-46` / `:54` / `:93-100` 缝调用 · `:90-92` 写门用例改述（未设缝不落盘）· `:121-390` 读根改本地变量 |
| `test/fixtures/fake-mcp-server.mjs` | 45 | −4 | `:42-43` `FAKE_MCP_READY_FILE` 死块删（实扫零消费者） |

**bench**

| 文件 | 行 | Δ | 改点 |
|---|---|---|---|
| `lib/output.mjs` | 62 | +6 | `:15-16` → `setResultsDir(dir)`（读点 `_resultsDir ?? join(BENCH_DIR,"results")`）；`--results-dir` 解析 |
| `lib/judge.mjs` | 274 | +6 | `:33-34` → `_setJudgeConfigPathForTest` / `_resetJudgeConfigPathForTest` + `--judge-config` |
| `lib/prices.mjs` | 156 | +6 | `:24-25` → `_setPricesPathForTest` / `_resetPricesPathForTest` + `--prices` |
| `run.mjs` / `probe.mjs` / `toolcall.mjs` | 296 / 299 / 254 | +4 各 | 参数表补 `--results-dir` / `--judge-config` / `--prices` |
| `test/fixtures.mjs` | 204 | ±0 | `:17` → `setResultsDir(SANDBOX)`（**仍须在 import run.mjs 之前**） |
| `test/probe.test.mjs` · `probe-report.test.mjs` | 263 · 164 | ±0 | 装载期 `setResultsDir` + spawn 面补 `--results-dir` |
| `test/toolcall.test.mjs` · `toolcall-report.test.mjs` | 279 · 159 | ±0 | 同形 |
| `test/judge.test.mjs` · `judge-fallback.test.mjs` · `preflight.test.mjs` | 298 · 230 · 137 | ±0 | `BENCH_JUDGE` → 缝（进程内）+ spawn 面补 `--judge-config` |
| `test/recompute.test.mjs` | 167 | ±0 | `BENCH_PRICES` → 缝 + spawn 面补 `--prices` |
| `test/trace-cleanup.test.mjs`（vsc） | 132 | 0 | **零改**（实扫零命中——前版清单误列） |

### 2.4 边界（不做）

- 不改配置档 schema 语义（只加 `diagnostics` 两键；既有键零动）；不做 env→配置档的一次性迁移读取（**禁回退**）。
- 不改日志 / 轨迹 / bench 的**落点默认值**与文件格式（行为等价面）。
- 不重命名既有 CLI 参数 / 不动命令解析序（`--tui-wrapped` 等只在 bin 顶部剥离）。
- 不新增产品配置面以外的通道；`bench` 族参数只在工具自身 CLI 内。
- 不触需求档 / `RELEASE.md` / `AGENTS.md` / 冻结批档 / `_archive`（上抛或排除）。

### 2.5 上抛项（主代理 / 父侧裁定）

1. **判据① 域需精确化**：现文「活文档规范句」未划记录面。设计按「代码面（四产品树 `.mjs`，含测试）+ 活机制档规范句（`docs/core/design/**` · `docs/cli/design/**`）」为域，排除 = 冻结批档 / `_archive/**` / `.thincoder/tmp/**` / changelog 与历史段（记录面）/ 需求档与 `RELEASE.md`·`AGENTS.md`（非设计笔域）。
2. **需求档两处 env 句**（主代理笔）：`docs/cli/requirements/CRASH-REPORTS.md:37,48`（`THINCODER_HEAP_SNAPSHOT` / `_HEAP_WATCH` 可关值集合句）⇒ 建议改「配置键 `diagnostics.heapSnapshot` / `heapWatch` 取 `false` 关闭」；`docs/core/requirements/LOGGING.md:71,79,88`（`THINCODER_LOG_DIR` 测试隔离 + 实现级坐标）⇒ 与判据① 冲抵，建议改「日志落点缝（进程内）」。
3. **`FAKE_MCP_READY_FILE` 死块**：实扫零消费者（仅夹具自身读）⇒ 建议随本批删（已列 B5）；若父侧判为「预留面」则保留并登记。
4. **非设计笔域两处 smoke 用法行**（替换文本）：`docs/RELEASE.md:119` → `node test/smoke-qwen-thinking.mjs --smoke`；`thincoder-cli/AGENTS.md:35` 同前（原文 `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs`）。
5. **调试三支退场 = 能力收缩**（`THINCODER_DEBUG_RENDER` · `THIN_DEBUG_BODY` · `ADVISOR_DEBUG`）：本批按 D-CF5 一并拔除（同批）；**用户可否决**（否决 ⇒ 回退为 argv / 配置键，可 revert）。
6. **用户面 log-dir / traces-dir 覆盖能力收缩**：`THINCODER_LOG_DIR` 与 `THINCODER_TRACES_DIR` 原可用于非测试场景（`log.mjs:24` / `trace-store.mjs:47` 注释称「测试隔离 / override」但显式设置即可用）——拔除后**不再有用户面换落点通道**；若需保留 ⇒ 另批加配置键（`diagnostics.logsDir` 等），本批不做。

### 2.6 实施轮待实证（未验证项，不得当既成事实）

1. `doc-check.test.mjs` 子实例「非空跑」：子进程直跑本档 + `--nested` 须实证输出含 `node:test` 汇总行（`# pass` ≥ 1）；否则回退 `test/dc-nested-entry.mjs` 入口档。
2. `smoke` 参数门在 `prepublish` glob（`node --test "test/*.mjs"`）下零花费：按 argv 语义推定（门缺 ⇒ skip 块，`:24-89` 全在 `else` 内）——**未实测**。
3. bench setter 时序：`test/fixtures.mjs` 的 `setResultsDir` 必须先于 `import run.mjs`（`run.mjs` 顶层捕获结果目录）。
4. `--tui-wrapped` 在宿主 TUI 会话内（argv 不受 env 透传）两态行为——预期消除旧「假红」，须实测。

### 2.7 判据回指（§1.3 ①–⑤）

| §1.3 | 回指 |
|---|---|
| ① 全仓 grep 零命中（域见 2.5 #1） | 2.3 逐档改制 + 2.2 例外登记；实施轮复跑 17 名 grep（含 spawn env 注入形） |
| ② 三端测试全绿（含 bench） | `thincoder-core` / `thincoder-cli` / `thincoder-vscode` 各 `node test/run.mjs` + `bench` `node --test "test/*.test.mjs"` |
| ③ 行为等价 | B1 缝驱动落点（用例证明）· B2 键驱动武装 / 启动 · B3 argv 门两态（包装子不包装） |
| ④ doc-check 零新增 | `node scripts/doc-check.mjs` 读数对比本批前 |
| ⑤ env 读取增量 0 | 本批 diff 内 `process.env.<自有名>` 计数 = 0（含 spawn env 注入形） |

**A 段补录（条目表 / 出批面）**——本轮首次 append 因首行 `## §2` 标题形式被骨架保护拒收，改以本行起；内容与设计定稿等值，段内位置落在 2.3–2.7 之后（append-only 既定）。

**设计单源**：`docs/core/design/CONFIG.md` §6.2（配置通道纪律 + 保留集 + 自有面名录 + D-CF5 / D-CF6）；本节只登记本批任务面 / 影响面 / 判据回指，机制条文不复制。

### 2.1 条目表（B1–B6 · 覆盖 §1.2 三条需求）

| # | 条目 | 覆盖 §1.2 | 兑现形 | §1.3 判据 |
|---|---|---|---|---|
| B1 | core 两支拔除（`THINCODER_LOG_DIR` · `THINCODER_TRACES_DIR`） | ① | ③ 缝：`log.mjs` `_setLogsDirForTest` / `_resetLogsDirForTest`；`trace-store.mjs` `_setTracesRootForTest` / `_resetTracesRootForTest`；写门 = `NODE_TEST_CONTEXT` ∧ 未设缝 | ①③⑤ |
| B2 | cli 用户面两开关（`THINCODER_HEAP_WATCH` · `THINCODER_HEAP_SNAPSHOT`） | ① | ① 键：`diagnostics.heapWatch` / `diagnostics.heapSnapshot`（默认 `true`）；bin 入口读键后经显式参数传入模块 | ①③⑤ |
| B3 | cli 包装 + 测试钩四支（`THINCODER_TUI_WRAPPED` · `..._TEST_CRASH` · `..._TEST_TUI_ACTIVE` · `..._TEST_CLEANUP_OUT`） | ① | ④ argv：`--tui-wrapped` / `--test-crash` / `--test-tui-active` / `--test-cleanup-out=<路径>`（bin 顶部剥离，生产零路径） | ①③⑤ |
| B4 | bench 三支 + 工具面两支 + 嵌套支（`BENCH_RESULTS_DIR` · `BENCH_JUDGE` · `BENCH_PRICES` · `THINCODER_SMOKE` · `DOC_CHECK_NESTED`） | ① | ② 参数 + ③ 缝（bench）· ④ argv（`--smoke` / `--nested`） | ①③④⑤ |
| B5 | 测试面全量改制 + 孤儿死块删除 + 调试三支退场 | ② | 见 2.3（core 3 / cli 14 / vsc 8 / bench 9 档）；`FAKE_MCP_READY_FILE` 死块删；`THINCODER_DEBUG_RENDER` / `THIN_DEBUG_BODY` / `ADVISOR_DEBUG` 整体删 | ②③④⑤ |
| B6 | 文档随动 5 档 | ③ | `CONFIG.md`（新 §6.2 机制节 + changelog）· `LOGGING.md` §6.2 / §6.4 / D-LG8 · `CRASH-REPORTS.md` §3.2 / §4.2 / §4.3 · `MODEL-BENCH.md` §2.1-6 / AC-5 · `AGENT-LOOP-SUBAGENT.md` T15 断言面 | ④ |

**归类规则（形由受众定）**：该 env 的**文档化受众**决定承接形 —— 用户面 ⇒ 配置键；测试隔离落点 ⇒ 进程内缝；**子进程调用面 ⇒ CLI 参数 / argv 标志**（子进程看不见进程内缝——本批实扫发现 `session-gc-cli` / `tui-stderr-capture` / judge 族 / recompute 族均经 spawn env 注入，故 `BENCH_JUDGE` / `BENCH_PRICES` 定为「② 参数 / ③ 缝」双面，非纯缝）。

### 2.2 不在本批（出批 / 零改面）

| 面 | 处置 | 理由 |
|---|---|---|
| 需求档 env 句（`docs/cli/requirements/CRASH-REPORTS.md:37,48` · `docs/core/requirements/LOGGING.md:71,79`） | **上抛**（主代理笔域） | 需求档 = 主代理笔；与判据① 的域逐条登记（2.5 #1 / #2） |
| `docs/RELEASE.md:119` · `thincoder-cli/AGENTS.md:35`（smoke 用法行） | **上抛**（非设计笔域） | 替换文本随附（2.5 #4） |
| 冻结批档 · `**/_archive/**` · `.thincoder/tmp/**` | 零改 | §1.5 排除面（记录面 / 临时面） |
| 桌面端四支 · 工具层 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` 一族 | 零改 | §1.5 例外面（系统原语 / 外部约定） |
| `TESTING.md` · `TRACES.md` | 零改（实扫零命中） | TESTING.md §10 smoke 用法为纯脚本形、无 env 字面；TRACES.md 只述 `tracesRoot()` |
| 既有缝 `_setConfigPathForTest`（`thincoder-core/config-io.mjs:37-42`） | 零改（引为形态先例） | 本批只新增同形缝 |

### 2.8 评审轮 1 修正轮落账（承 §3 发现 · #1–#10 · eng-designer · 2026-09-27）

**口径**：零新语义——除 #5 的登记面 / 读数面外，全部为指针 / 形态 / 口径面；逐号落点（均已读回）：

| 号 | 落点（`file:line`） | 状态 |
|---|---|---|
| #1 | `docs/cli/design/CRASH-REPORTS.md:33`（§2.1 接口行去 `env`，与 §3.2 / `CONFIG.md` 名录行同形）· `:34`（判定单点句）· `:200`（changelog） | ✅ |
| #2 | `docs/core/design/CONFIG.md:123`（③ 形态列明「命名 / 成对例外」）· `:144`（cleanup-out 混合形）· `:146`（setResultsDir 命名例外）· `:147`（judge / prices 补 `_reset` 半）· `:152-153`（混合形口径 + `settings` 派生消费面行）· `:201`（changelog） | ✅ |
| #4 | 本块「影响表读数复核」（12 行更正 + 13 行相符留痕） | ✅ |
| #5 | `CLI-DEBT.md:35`（A4 = `bin/thincoder.mjs` 482→≈492 · 余 18→≈8）· `:48`（A 表 7→9 档）· `:59-60`（B8 = `doc-check.test.mjs` **332** · B9 = `provider-error-surface.test.mjs` **309**）· `:62`（表说明）· `:100`（changelog）；`CORE-UNIFICATION.md:1102-1103`（在册 / 已登 = **49 / 19 / 30**）· `:1117`（主表行 6 = `agent.mjs` **445**）· `:1129`（子表行 18 = `traces/trace-store.mjs` 299→≈305——含补登义务）· `:1968`（changelog）；`VSC-DEBT.md:311`（`async-visibility` **452** 首登 · `activity-live-visibility` **399** 首登 · `trace-store.test` 读数刷新）· `:721`（changelog）。≥300 面复核：`config.mjs` 420 / `provider/core.mjs` 492 已在册（主表行 1 / 次优先列表）；`subagent-lifecycle` 现读 244 ⇒ 低于软线（原 400 系失真读数，flag 消解）；`input-lock` 404 与 A15（`:46` · 403 raw）相符 | ✅ |
| #6 | `MODEL-BENCH.md:78`（run 用法行 +3 参）· `:95-97`（参数表 +3 行）· `:1764` / `:1777-1779`（probe 三参）· `:1992` / `:2006-2007`（toolcall +2 参 · 无判官面）· `:2183`（changelog） | ✅ |
| #7 | 同 #2（消费面段——`settings` 工具类型表由全量 DEFAULTS 派生，双端面扩张登记） | ✅ |
| #8 | `MODEL-BENCH.md:109`（§2.1-6 本体行内挂单源指针，与三链同形） | ✅ |
| #10 | 本块「判据① 词表口径」行 | ✅ |

**#4 · 影响表读数复核**——`read` 口径 = 表口径（`wc -l` = raw，两者差 +1）。**表值失真 12 行逐行更正如下；与本节不符者以本节现读为准**：

| 行 | 表值（失真） | 现读 |
|---|---|---|
| `thincoder-core/log.mjs` | 89 | **196**（raw 195）——#4 命中行 |
| `test/crash-reports.test.mjs` | 244 | **111**（110） |
| `test/input-lock.test.mjs` | 310 | **404**（403） |
| `test/integration/subagent-lifecycle.test.mjs` | 400 | **244**（243） |
| `test/provider-error-surface.test.mjs` | 115 | **310**（309） |
| `test/queue-payload-binding.test.mjs` | 154 | **115**（114） |
| `test/subagent-zero-block.test.mjs` | 204 | **231**（230） |
| `test/sync-cancel.test.mjs` | 123 | **204**（203） |
| `test/trace-bounds.test.mjs` | 114 | **123**（122） |
| `test/session-gc-cli.test.mjs` | 231 | **154**（153） |
| `test/smoke-qwen-thinking.mjs` | 96 | **89**（89） |
| `test/smoke-responses.mjs` | 62 | **78**（77） |

（失真值多与邻行 / 他行现读重合——疑成表时列错位；不追因。抽查相符 13 行：`crash-reports.mjs` 180 · `bench/lib/output.mjs` 62 · `provider/core.mjs` 492 · `traces/trace-store.mjs` 300 · `bin/thincoder.mjs` 483 · `config.mjs` 420 · `test/log.test.mjs` 121 · `test/doc-check.test.mjs` 333 · `test/heap-watch.test.mjs` 114 · `test/tui-stderr-capture.test.mjs` 165 · `test/advisor-cancel-faces.test.mjs` 254 · `test/async-discard.test.mjs` 254 · `agent.mjs` 446。表内其余行未逐行复读——实施轮以实读为准；Δ 列不随读数更正而变。）

**#10 · 判据① 词表口径**：判据① 的词表 = 族面**全量 17 名**（≠ 原两名；原两名 = 其中「目录键两支」子集），以 §1.5 域裁定（`:30`）的清单为准 = cli/src·bin 七支 + core 调试两支（`THIN_DEBUG_BODY` / `ADVISOR_DEBUG`）+ 目录键两支（`THINCODER_LOG_DIR` / `THINCODER_TRACES_DIR`）+ bench / 工具面六支；实施轮复跑 grep（§2.7 回指 ① 行）按 17 名收尾。

**通道参数矩阵（#6 / #8 落定）**：`run` 3 参 · `probe` 3 参（`--results-dir` / `--judge-config` / `--prices`）· `toolcall` **2 参**（无判官面——`--results-dir` / `--prices`）· `preflight` **0 参**；缺省 = `bench/results/`（相对 `bench/` 解析）· `bench/judge.json` · `bench/prices.json`；覆盖值 = 绝对路径直用、相对路径按 cwd 解析。

**缝例外三例（#2 · `CONFIG.md` §6 名录逐行标）**：① `cleanup-out` = ④→③ 混合形（argv 解析 + 进程内缝）· 单半（无 `_reset`）；② `setResultsDir` = 命名例外（不与 `_set<名>ForTest` 对齐；无 `_reset`）；③ judge / prices = 成对 `_set` / `_reset`（名录原漏 `_reset` 半，已补）。

**面外发现（本轮不动 · 报父侧）**：
1. **#3 / #9 = 需求档面（主代理笔域）**：`docs/cli/requirements/CRASH-REPORTS.md:25`（F4 行残 env 句——真残留坐标）· `docs/core/requirements/LOGGING.md:71`（引新 §6.2 口径）且两档变更记录缺 2026-09-27 条目——均未落笔。
2. **主表行 14 / 子表行 3 指针计划源误**：拟补 `2026-09-22-slot-end-param.md` §2.3 指针——实核该档 `:313` 记「不拆」预裁、`core-hygiene.test.mjs:87-93` 已登记拆分预案与触发条件，与行 14「待补拆分计划」口径相抵 ⇒ 归父侧裁（本轮未动）。

**收尾核（doc-check 终读 · eng-designer · 2026-09-27）**：`node scripts/doc-check.mjs` 读数 = 候选 26736 · 悬空 **34** · 拟新增 34 · 迁移期引文 216 ⇒ **FAIL(锚) 34 = 闸态存量，本批面零新增**（修正轮曾引入 1：`CORE-UNIFICATION.md` 子表行 18 注「`traces/jsonl.mjs` 式」带 `/` 被判路径锚——已改**裸名**「`jsonl.mjs` 式」，与姊妹行 `context-compress.mjs` / `edit-diff-guards.mjs` 惯例一致；**裸名不入路径锚闸**）。

**行宽面同核**：修正轮曾引入 7 行 >300 字符（`CLI-DEBT.md:100` · `CONFIG.md:201` · `CORE-UNIFICATION.md:1102` / `:1968` · `MODEL-BENCH.md:2183` · `VSC-DEBT.md:311` / `:721`——均 changelog / 登记行），已就地断行收正（续行缩进沿本档既有惯例）⇒ 现 FAIL(行宽) **18 行 = 全存量**（他批面），本批面零新增。

**坐标漂移注（承上行 · 行宽收正致）**：本块表内 `#5` 行所列编号系**收正前**；收正后现编号 = `CORE-UNIFICATION.md:1102-1104`（在册 / 已登）· `:1119`（主表行 6）· `:1131`（子表行 18）· `:1970`（changelog）；`VSC-DEBT.md:311-312`（登记块）· `:722`（changelog）；`CLI-DEBT.md:100-101` · `CONFIG.md:201-202` · `MODEL-BENCH.md:2183-2184`（均为断行后覆盖区间）。

### 2.9 收口轮落位（承 §5 实施实证 · 逐条 1→7 · eng-designer · 2026-09-27）

**口径**：只收不新增语义——除登记 / 读数面外无机制变更；产品码 / 测试码零触碰（实施已冻结）；逐号落点均已读回。**本段与 2.3 / 2.6 不符者，以本段现读为准**。

| 号 | 项 | 落位 / 收正后 |
|---|---|---|
| 1 | T1 / T2（#63）cli 表行 | 表述收正：三钩实取**原始 argv**（`_argvRaw.includes`）——`args` = 命令位后切片 ⇒ 旗标居首永假；全剥离则 `bin --test-crash` 进包装层（ANSI 污染 stdout）⇒ 改措辞、不改码。坐标收正：两键 `loadConfig()` 读实落 `bin/thincoder.mjs:58-61`（表写 `:151-155`） |
| 2 | T5 / T7（#63）未登记副作用 | 补注落 `CONFIG.md` §6.2 + 该档 changelog：① 包装门改 argv ⇒ 仅直系子进程生效（旧 env 门及于全后代）——TUI 会话内嵌套起多一层包装 + 一份 `tui-stderr-*.log`（无功能破坏）；② `loadConfig()` 全命令路径运行（含 `--version` / `completion`）——老字段迁移写回 / 告警可能出现（stdout 未污染） |
| 3 | 记录面收正（§2.3 / §2.6） | §2.6 #3 前提已废（读点现惰性 ⇒ 无 setter 时序义务；§2.3 `test/fixtures.mjs` 行「仍须在 import run.mjs 之前」句同撤）· `log.mjs` 行读 89 → **201** · `test/fixtures.mjs` 缝坐标 `:17` → **`:18`** · `judge.test.mjs` 298 → **297**（本段为准） |
| 4 | 在册刷新 | `CLI-DEBT.md`：A4 = **499**（余 **1**——注「余量 ≤1 期间禁增；命令分发表外提须先于该档下次触碰」· 外提独立债 = 台账 #438）· B8 = **340**（「±0 行」注撤）· changelog 随记；bench 侧（无独立档位册）：`run.mjs` **310** / `probe.mjs` **310**（越 300 建议线 · ≤500 硬限 ⇒ 无拆分义务）= 本段登记（触发式：越 500 前 ∨ 该档下次实质改动时重裁）；`toolcall.mjs` **262**（< 300 ⇒ 无登记义务） |
| 5 | 用户面文档 | `bench/README.md` 参数表 +3 行（`--results-dir` / `--judge-config` / `--prices`） |
| 6 | 覆盖缺口登记 ×2（台账已挂 ✓） | ① `diagnostics.heapWatch` / `heapSnapshot`「键 → bin → 形参」全链路无自动化承重（S2a 沙箱探针证一次，非常驻）；② `--test-crash` 必占命令位 ⇒ 缺省形（零参）包装触发无真 spawn 覆盖 |
| 7 | 域外登记（#68 · B14 🟡#2） | 参数面在测试内不可证伪（双面同值 ⇒ 删参数亦绿）——可选强化 = 留一条只靠参数的腿（另案） |

### 2.10 收尾核（终读 · eng-designer · 2026-09-27）

**闸读（`node scripts/doc-check.mjs` · plain 与 `--nested` 同读 · 两次一致）**：候选 26739 · 悬空 **48**（47 路径/坐标 + 1 符号 = `MODEL-SPECS.md:323` `cacheMode`）· 注记豁免 82 · 拟新增 29 · 迁移期引文 216 · FAIL(行宽) **18**（全存量，§2.8 :307 已核）。

**本批面零新增（判据 = 行归属，非计数）**：48 条悬空分布 = `CHECKPOINT.md` 12 · `TOOLS.md` 9 · `SESSION.md` 6 · `CORE-UNIFICATION.md` 5 · `ENGINEERING-MODE-V2.md` 3 · `MODEL-SPECS.md` 3 · `requirements/CHECKPOINT.md` 3 · vsc `SETTINGS.md` 2 · vsc `WEBVIEW.md` 2 · `ENG-TOKEN-BINDING.md` 1 · `requirements/TOOLS.md` 1 · `VSC-DEBT.md` 1。本批笔域内两档的悬空（`CORE-UNIFICATION.md` 5 条 · `VSC-DEBT.md` 1 条）已逐 hunk 核于本批 diff 块之外（`@@ -1099…` / `@@ -1114…` / `@@ -1126…` / `@@ -1964…`；`@@ -308…` / `@@ -715…`）；余 42 条位于本批未触碰的档。本批档在闸表中仅现于 `迁移期引文——列报·不入闸`（`CONFIG.md:37/38/46`）与 `报告面` 符号行 ⇒ 批面零新增成立。

**口径差（未证 · 报 §6）**：§2.8 收尾核记「悬空 34 · 拟新增 34 · 候选 26736」，与本次同形调用读数（48 · 29 · 26739）差额未得归因；行宽 18 两侧一致、候选基数近同 ⇒ 同扫描面；HEAD `d18a89db`（2026-09-26 20:33）后无提交、48 条之被引行全数未动 ⇒ 差非本批行面所致。**本段闸读与 §2.8 收尾核不符者，以本段现读为准；终读以 §6 复核取读为准。**

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（轮次 · 对象 = 环境变量配置面拔除全族：`CONFIG.md` 新 §6.2 + 四树影响表 + 三链回指）**

审读面 = `docs/core/design/{CONFIG,LOGGING,MODEL-BENCH,AGENT-LOOP-SUBAGENT}.md` · `docs/cli/design/CRASH-REPORTS.md` · `docs/core/requirements/LOGGING.md` · `docs/cli/requirements/CRASH-REPORTS.md`（+ 就座验证读了被审对象点名的四树影响表载体 `docs/batches/2026-09-27-env-config-purge.md` §2.3 与判据 §1.3/§2.7，及代码面 `thincoder-core/{log.mjs,config-io.mjs,agent-tools/settings.mjs,traces/trace-store.mjs,provider/core.mjs,config.mjs}` · `thincoder-cli/{bin/thincoder.mjs,src/crash-reports.mjs}` · `bench/lib/output.mjs`（只为核行数 / 核 env 面，非审查对象）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 同一机制两处描述相抵（同一档内、且本批未列该行的随动面）：`docs/cli/design/CRASH-REPORTS.md:33`（§2.1）仍把注入接口记为 `prepareCrashReporting({ dir, env, armHeapSnapshot })`，而本批已改的 `:77`（§3.2）写「判定单点 = bin 入口读键后以显式参数传入（`prepareCrashReporting({ heapSnapshot })`）」；`env` 形参的唯一消费者就是被拔的 F3② env 判定（实核 `thincoder-cli/src/crash-reports.mjs:74` / `:83` 注释，且 `crash-reports.test.mjs:38` 是唯一调用形）⇒ 实施后 §2.1 行必与实现相抵（批次表 `:85` 已定签名改 `{ heapSnapshot = true }`）。姊妹面已同步（§4.2 `:114` 的 `startHeapWatch` 签名去 `env`）⇒ §2.1 属漏扫（批次 §2.5 B6 只列 §3.2 / §4.2 / §4.3）。 | 把该接口行的通道面补齐为与 §3.2 / `CONFIG.md:140` 名录行同形（去 `env`、列 `heapSnapshot`），或写明 `env` 的保留用途；核同档是否另有同类残留。 |
| 2 | Document ownership | 🟡 | ③ 通道「形态」与名录 / 消费档落点不一致（同一机制两形）：`CONFIG.md:123` 定形 = `_set<名>ForTest(v)` / `_reset<名>ForTest()` **成对**；`CONFIG.md:146` 名录行 = `setResultsDir()`（名形不同 ∧ 无 `_reset` 半），且 `MODEL-BENCH.md:106`（契约面）同用 `setResultsDir`；`CONFIG.md:147`（judge / prices）只列 `_set` 半，而影响表 `:123-124` 有 `_resetJudgeConfigPathForTest` / `_resetPricesPathForTest` ⇒ 名录漏半。④ 行 `CONFIG.md:144`（`--test-cleanup-out` → `_setCleanupOutPathForTest`）是 ④→③ 混合形，③ 形态未覆盖。 | 二选一钉死：名录名形（含 `_reset` 半）与 ③ 形态对齐；或在 ③ 形态列明记「命名 / 成对例外」并逐行标；混合形（argv 解析 + 进程内缝）单列一条口径。 |
| 3 | Requirements | 🟡 | 需求档规范面残留 env 句且未落入本批上抛清单的实际坐标：`docs/cli/requirements/CRASH-REPORTS.md:25`（F4 行）仍写堆看门狗「默认开启、可关（**env**）」，与设计 `CRASH-REPORTS.md:125`（配置键 `diagnostics.heapWatch`）及同档 F4 判定句 `:47`（配置键）相抵；本批上抛登记指向 `:37,48`（批档 `:144`），而现盘 `:37`/`:47` 已是配置键口径、无 env 字面 ⇒ 真正的残留在 `:25` 未被登记。 | 把 `:25` 并入本批需求档随动清单（同时收正 `:37,48` 坐标）；判据① 在 §1.6 #1 的域（含 `docs/cli/requirements/**`）下须该行同步才可能达成。 |
| 4 | Affected-file size | 🟡 | 影响表读数失真（抽查 1 命中）：`docs/batches/2026-09-27-env-config-purge.md:69` 记 `thincoder-core/log.mjs | 89`，现盘实读 = 195/196 行（该行 `:51` / `:64` 坐标与现盘逐字吻合 ⇒ 行对象无歧；同表另 6 行抽查正确：`crash-reports.mjs` 180 · `bench/lib/output.mjs` 62 · `provider/core.mjs` 492 · `trace-store.mjs` 300 · `bin/thincoder.mjs` 483 · `config.mjs` 420）。 | 重读该行行数（本批最核心一档）；顺带复核表内未抽查行的读数，避免以失效读数判层级。 |
| 5 | Affected-file size | 🟡 | 本批改动的 ≥300 行档无拆分计划 / 越线登记：`config.mjs` 420 · `agent.mjs` 446 · `provider/core.mjs` 492 · `trace-store.mjs` 300（Δ+6 ⇒ 306）· `bin/thincoder.mjs` 483 · `doc-check.test.mjs` 333 · `input-lock.test.mjs` 310 · `integration/subagent-lifecycle.test.mjs` 400 · `activity-live-visibility` 400 · `async-parity` 493 · `async-visibility` 453 · `workspace-guard` 488 · `trace-store.test.mjs` 400（号源 = 批档 §2.3 行）。 | 按本仓既有先例（`MODEL-BENCH.md:2103`「越 300 处置 = 登记 + 拆分计划（拆点 / 落点 / 消解窗口）」）逐档登记或注明「±0 / 负增不动」的免注册口径。 |
| 6 | Clarity | 🟡 | 新通道未进 CLI 契约面：`MODEL-BENCH.md:106`（§2.1-6）已把结果目录覆盖通道定为 `--results-dir`，`CONFIG.md:146-147` 另定 `--judge-config` / `--prices`，但 §2.1 用法块 `:78` 与参数表 `:84-95` 三参数皆无（表内只到 `--dry-run` / `--recompute` / `--rejudge`）；影响表 `:125` 明写 run / probe / toolcall 三档实现面补三参数 ⇒ 契约面落后于实现面（§10.8 `:1761` / §11.9 `:1986` 同类面**未逐行核**）。 | 三档 CLI 契约（用法行 + 参数表）补入 `--results-dir` / `--judge-config` / `--prices`，与实现面单源对齐；`CONFIG.md:147` 的「若既有等价参数存在则复用」句改为定值。 |
| 7 | Completeness | 🟡 | 新 DEFAULTS 键的消费面未登记：批档 `:71` 给 `thincoder-core/config.mjs` 加 `diagnostics.{heapSnapshot,heapWatch}`，而 `settings` 工具的类型表在装载期由**全量 DEFAULTS** 派生（实核 `thincoder-core/agent-tools/settings.mjs:8-9` · `:62 const TYPE_MAP = _buildShapeTable(DEFAULTS)`）⇒ 双端 agent 可见可写键面扩张，且 `CONFIG.md:70`（§4.1 第 3 行）把该类型面定为**对外契约点**；四树影响表与 §6.2 名录均未提该消费面（VSC 侧同源派生见 `CONFIG.md:21`）。 | 在影响表 / §6.2 增一行登记（或明示「不需改码，仅面扩张」并判是否要 VSC 面板 / 文档同步），免实施轮出批发现。 |
| 8 | Clarity | 🔵 | 回指形态不齐：四链中三链在本体行内挂单源指针（`LOGGING.md:104` · `CRASH-REPORTS.md:79` · `AGENT-LOOP-SUBAGENT.md:813`），`MODEL-BENCH.md` 只在变更记录 `:2173` 挂「通道纪律单源 = `CONFIG.md` §6.2」，其 §2.1-6 本体行 `:106` 无指针。 | §2.1-6 行内补单源指针（与三链同形）。 |
| 9 | Methodology | 🔵 | 需求档规范面已被改（`requirements/LOGGING.md:71` 引 `CONFIG.md` §6.2——该节 2026-09-27 新建；`requirements/CRASH-REPORTS.md:37/:47` 用 `diagnostics.heapSnapshot`/`heapWatch`——实核 `thincoder-core/config.mjs` 现无 `diagnostics` 键），但两档**变更记录均无 2026-09-27 条目**（各自止于 2026-09-15）⇒ 记录面滞后于规范面。 | 随本批补两档变更记录行（主代理笔域），使规范面改动在记录面可追。 |
| 10 | Acceptance criteria | 🔵 | 判据① 字面词表窄于被判族：批档 `:21` 只列 `THINCODER_LOG_DIR|THINCODER_TRACES_DIR` 两名，而 §1.5 裁定把族面扩到 17 名（`:30`），17 名 grep 只出现在 §2.7 映射行（`:161`）。 | 判据① 词表改为 17 名清单（或写明「以 §2.5 #1 全族清单为准」），免实施轮按两名收尾。 |
| 11 | Scope（核验记） | 🔵 | 族面覆盖经实核**齐全**：17 名在代码 / 测试面的全部命中档均已在影响表（core 3 / cli 14 / vsc 8 / bench 9 + 运行面 6 档），无漏档；桌面端与 `HTTPS_PROXY` 族按 §1.5 例外面排除在册；`FAKE_MCP_READY_FILE` 死块实核仅夹具自读（`thincoder-vscode/test/fixtures/fake-mcp-server.mjs:42-43`）。 | ——（无需动作；作覆盖度留痕） |

**域外注（给父侧 · 不判级）**：`docs/RELEASE.md:119` 与 `thincoder-cli/AGENTS.md:35` 的 `THINCODER_SMOKE=1 …` 用法行仍在（已由批档 §1.6 #4 / §2.5 #4 登记为「父侧笔」待落）；`docs/core/requirements/LOGGING.md:79` 的 `THINCODER_LOG_DIR` 字面属历史 / 不并项表（记录面），已由 §2.5 #2 登记。

计数：**1 🔴 · 6 🟡 · 4 🔵 = 11 条**。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2（复核轮 1 处置 + 修正轮新触及三档〔CLI-DEBT / CORE-UNIFICATION / VSC-DEBT〕首审）· 发现表：**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（承轮 1 发现 1 处置面） | 🟡 | `docs/cli/design/CRASH-REPORTS.md:33-34` 接口行残留半句「默认参数保调用点零改（生产判定单点 = bin 入口读配置键 `diagnostics.heapSnapshot` 后显式传入——§3.2）」：签名面已与 `:77`（§3.2）· `CONFIG.md:140` 同形（轮 1 🔴 的实质已闭合），但该半句可读作「bin 调用点零改」，与 §3.2 相抵——照字面实施 ⇒ bin 不传参 ⇒ 配置键失效（取证恒开） | 将该半句限定为「其余调用点（如 `thincoder-cli/test/fixtures/r25-oom.mjs:13` 无参调用）零改」；或删除半句、只留 §3.2 判定单点句 |
| 2 | Affected-file size annotations | 🟡 | `docs/cli/design/CLI-DEBT.md:35`（A4）：`bin/thincoder.mjs` **482 → ≈492**（本批 +10）· 余量 **18 → ≈8**；行内「触发已到（前批定线 = 实施读数 ≥480 ⇒ 命令分发表外提）· 未执行（另案）」——拆分计划「实施 = 该档下次实质触碰时」而本批即该档触碰（+10）却未执行，「另案」无载体/时点指针；再 +9 行即越 500 硬限 | 本批执行命令分发表外提（含 MS-1 读取面同批改指）；或把「未执行」补为带载体与时点的登记 + 加「余量 ≤10 期间禁增」条件 |
| 3 | Doc hygiene | 🟡 | 失效表达留规范面、以现状注标注而非删除（2026-09-18 用户裁定）：`docs/core/design/LOGGING.md:55`（「VS Code 同构模块」）+`:57` · `:121`（D-LG9「镜像实现」）+`:123`；`docs/core/requirements/LOGGING.md:56`（F-L6「镜像实现」）+`:58` · `:71`（尾句「共享目录与格式 = 两端镜像实现（F6）」）+`:73`——本批未引入（存量；本批面 = `CONFIG.md` §6.2 零残留）；另 `:79`（§5 不并项表）仍以 `THINCODER_LOG_DIR` 作「已入设计档 §6.2 / §6.4」的实例 | 改述为现态陈述 + 删现状注（沿革入变更记录——先例 = 2026-09-25 hygiene-ab 批对 `CONFIG.md` §6.1 的 D8 修订式清理）；`:79` 注明该名已随本批退场 |
| 4 | Affected-file size annotations | 🔵 | 登记面刷新/标注三处缺口：(a) `docs/cli/design/CLI-DEBT.md:46`（A15）`test/input-lock.test.mjs` **403**——含 `THINCODER_LOG_DIR` 隔离段（`thincoder-cli/test/input-lock.test.mjs:359`）属本批缝面改制触碰面，无「本批触碰」标注（对照 B8 行体例 / 册 §1 行维护①）；(b) `docs/core/design/CORE-UNIFICATION.md:1133-1135` 次优先表 `thincoder-core/provider/core.mjs` **491**——本批删 `THIN_DEBUG_BODY` 分支（`thincoder-core/provider/core.mjs:129/170/368`）未随批刷新（同批行 6 `agent.mjs` 已刷新），「距 500 硬限最近五档」句同处失真；(c) `docs/vsc/design/VSC-DEBT.md:311` 块题「（续 · 2026-09-27 env-config-purge **批后** · `wc -l` 口径）」与同块估读「**399 → ≈395**」并存（设计轮产物） | (a) 补「本批触碰（缝面改制 · Δ0）」标注；(b) 随批刷新该行读数与「最近五档」句；(c) 块题改「批（设计轮）」或给估读加标注 |
| 5 | Clarity | 🔵 | `docs/core/design/CORE-UNIFICATION.md:1131`（子表行 18）归因字面「（本批 +6——`diagnostics` 键面 / 通道纪律注）」与名录不符：`THINCODER_TRACES_DIR` 的通道 = ③ 缝（`CONFIG.md:139`），该档无 `diagnostics` 键面（实读 `thincoder-core/traces/trace-store.mjs` 仅 `:50`/`:56` env·门面 + `:286` `traces.retentionHours`）；另 `:1970-1971` 变更记录「主表行 6 读数 442 → 445」实指**子表**行 6（`agent.mjs`——本档「主表行 6」= `permission.mjs`） | 归因改「缝面（setter / reset + 写门）/ 通道纪律注」；指称改「子表行 6（`agent.mjs`）」 |

**计数（本轮）**：0🔴 · 3🟡 · 2🔵（轮 1 = 1🔴 · 6🟡 · 4🔵）。**复核注**：轮 1 被引用的发现 1 / 2 / 5 / 6 / 7 / 8 处置经逐条复核在位（CRASH-REPORTS §2.1 接口行 · `CONFIG.md` §6.2 例外标注与混合形口径 · CLI-DEBT A4+B8/B9 · MODEL-BENCH 三档契约参数 · VSC-DEBT 越线登记块 · CORE-UNIFICATION §2.8.1 行 18/行 6+计数句）；抽读行数 482 / 332 / 309 / 299 / 445 / 452 / 399 / 399 / 403 / 491 与 `SOFT_LINE_REGISTRY` 实读 **48 项**（+本批 1 = 49 句成立）全部与在册读数相符。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-27 03:38 · 父侧代签** ✓（用户 02:18 授权：「**你自动跑完吧**」⇒ 本批链上**点火权 + §4 批准权**委托父侧 ✓·**自缚三条在册 §1.0** ✓）

**三条件齐备** ✓：
- ① **评审 pass（0 🔴）** ✓：轮 1 = **1🔴 · 6🟡 · 4🔵**（11 条）⇒ 修正轮 #57（**8 条设计面**）⇒ **轮 2 = 0🔴 · 3🟡 · 2🔵 pass** ✓——**§3 两轮逐字在档** ✓（轮 1 `reviewId 93614b78` · 轮 2 `reviewId dd4618a6` ✓）。
- ② **修正轮已落地并逐条核验** ✓：父侧亲验两处靶点（`CRASH-REPORTS.md:33` 去 `env` + `CONFIG.md:123` 例外标注 ✓）· 双闸零新增（悬空 34 / 行宽 18 = 存量 ✓）· 轮 2 复核确认 ✓。
- ③ **token 已签发** ✓（**值不落文档**——运行时凭证 ✓）。

**轮 2 发现处置（五条）** ✓：**#1 = Fixed**（父侧直接执行 · ③ 小改：`CRASH-REPORTS.md:34` 半句限定为「其余调用点（`r25-oom.mjs` 无参调用）零改」✓·单行级 · 零新语义 ✓）；**#2 = Deferred**（A4 外提 = 独立重构案 ⇒ 已在册 `CLI-DEBT.md:35` ✓·另批裁 ✓）；**#3 = Deferred**（现状注清理 = 存量 hygiene 面 ✗）；**#4 / #5 = Deferred**（登记刷新 / 指称字面 ⇒ **随本批收口轮设计面统一收** ✓）。

**实施范围** = 三组（§1.5 裁定 ✓）：**S1** = 核 2 支 + 全测试 seam + 文档随动（设计面已随修正轮落定 ✓）· **S2** = cli 运行时开关 + 其测试 · **S3** = bench / 工具面 + vsc 面 ✓。**禁区** ✗：桌面端（系统原语 / 例外面 ✓）· `HTTPS_PROXY` 族 ✓。

## §5 实施记录（eng-coder）

**状态行**：实施完成（8 档缝替换 + 6 档改造全落位 · 定向 47/47 + 44/44 绿 · 全量 865/865 绿（终稿面）· 审计 3 黄条 + 评审 2 项全修在位 · 终态 clean（逐舱读数见各舱块））

**2026-09-27 · S1 核舱实施（eng-coder）** — 文件面 9 档（5 源 + 4 测试）· 验收读数：`cd thincoder-core && node test/run.mjs` ⇒ **tests 700 / pass 700 / fail 0**（exit 0 · 46.6s）。

**交付摘要**（按 §2.3 影响表逐行兑现）：

- **③ 缝（先例 `config-io.mjs:37-42` 同形）**：`log.mjs:50` `let _logsDir = null` + `:51` `_setLogsDirForTest` / `:52` `_resetLogsDirForTest`（读点 `:56` `_logsDir ?? join(homedir(), ".thincoder", "logs")`）；`traces/trace-store.mjs:47` `let _tracesRoot = null` + `:48` / `:49` 成对（读点 `:53` `_tracesRoot ?? join(configDir, "traces")`）。`_resetTraceStateForTest`（状态复位 = 非 root）保留。
- **写门（两侧同形）**：`log.mjs:69` / `trace-store.mjs:59` = `process.env.NODE_TEST_CONTEXT && _x === null ⇒ 跳过写盘`——与 `CONFIG.md:128` 相符（未设缝 ⇒ 不写盘）。
- **调试三支退场**：`THIN_DEBUG_BODY` 三点（`provider/core.mjs` 旧 `:129` / `:170` / `:368` 区块）整删；`ADVISOR_DEBUG` 单行删（`agent.mjs`）——零残引、无附带删除。
- **配置键面（同批义务）**：`config.mjs` DEFAULTS 加 `diagnostics: { heapWatch: true, heapSnapshot: true }` + 布尔类型回退。
- **测试面转缝**：`test/log.test.mjs` · `test/advisor-cancel-faces.test.mjs`（两处 env → 缝 + finally `_reset`）· `test/async-discard.test.mjs:29`。
- **登记（同批义务）**：`test/core-hygiene.test.mjs` `SOFT_LINE_REGISTRY` 加 `"traces/trace-store.mjs"`（= 超声明 1 档，见下表 #2）。

**决策透明表**：

| # | 决策 / 事项 | 理由 · 依据 |
|---|---|---|
| 1 | cli / vsc 面 16 档（仍驱动已拔名）不在本舱 | §4 范围 = S1（core 面）；S2 / S3 承接 ⇒ 域外命中上抛（见下「上抛」①） |
| 2 | 超声明 1 档 = `test/core-hygiene.test.mjs` | §2.8.1 行 18 明文「同批义务」⇒ 已披露、非越权 |
| 3 | `provider/core.mjs` 实删 42 行（§2.3 估 −6） | 设计语义 = 调试开关整体删除（点区块含体 + 说明块）⇒ 四点整删、无附带；内部审计复验四点对齐 |
| 4 | `trace-store.mjs` 302 行 > 300 不拆 | 设计预裁「登记不拆」（§2.8.1 行 18）+ 已入册 |
| 5 | `agent.mjs:265` 拼接 `try {` 保持原样 | 存量格式（`.thincoder/tmp/core-probe/agent.mjs:250-251` 逐字同形）⇒ 非本批引入；零语义 · 最小 diff |
| 6 | 缝 setter 不加归一 / 写门保持 `=== null` | 设计单源逐字（`CONFIG.md:123` / `:128` + 先例 `config-io.mjs:37` 无归一）⇒ 改则偏离单源；代码评审 🟡 可选、无实发调用方 ⇒ 记录在案 |

**审计与代码评审轮次与终态**：

- **内部 explore 发散审计**（read-only · 对设计逐条）：**CLEAN** —— 七面一致（缝形 / 写门 / 零残引 / 键面 / 测试面 / 未越声明面 / 登记）。4 条观察皆记录面：行差 42（已披露）· §2.3 `log.mjs` 基线 `89` 系数据错（现读 201 行 · 见上抛④）· §5 待写 · `agent.mjs:265` 存量 ⇒ 零偏差、零 must-fix。
- **内部 advisor 代码评审**（轮 1）：**VERDICT: pass** —— **0🔴** · 4🟡（1 可选代码 + 1 在册债 + 2 登记面）+ 4🔵（存量 / 协同）⇒ 无 must-fix。
- **fix round = 0**（终态 clean）。响应表：① 行 1（setter 归一）= **Won't-fix**（设计单源 + 先例同形；可选建议记录）；② 行 2 / 3 / 5（登记刷新）= **Deferred**（§4 轮 2 #4 / #5 裁「随本批收口轮设计面统一收」）；③ 行 4（在册超 300）= 无动作（R3 不升级）；④ 行 6 / 7（存量格式 · 存量时钟脆点）= 无动作（最小 diff）；⑤ 行 8（§5 / §6 空）= 本段 + 父侧 §6。

**上抛父侧（域外 · 只报不改）**：

1. **判据②（三端全绿）须同批闭合**：cli / vsc 16 档仍读已拔名（`thincoder-cli/test/input-lock.test.mjs:359` · `subagent-zero-block.test.mjs:28` · `sync-cancel.test.mjs:172`；`thincoder-vscode/test/async-parity.test.mjs:50` · `trace-store.test.mjs:54`〔`:121` 回读〕）⇒ 核写门改键后其事件断言拿不到落盘（S2 / S3 落舱前为预期红）。且 §1.5 措辞「S1 = core 2 支 + **全测试 seam**」与本舱「core-only」切分相抵 ⇒ 收口轮须对齐措辞。
2. `_setTracesRootForTest` 现盘零消费者（全树 grep 仅自身 + `CONFIG.md:139` + 批档）⇒ 判据③轨迹半载体 = `thincoder-vscode/test/trace-store.test.mjs`（未改制 · S2 / S3 面）。
3. `diagnostics` 两键暂无消费者（`thincoder-cli/src/crash-reports.mjs:73` / `heap-watch.mjs:25` 仍读 env）⇒ 按 B2 在 S2 承接（与 `CONFIG.md:140-141` 名录一致，非本舱缺陷）。
4. §2.3 影响表 `log.mjs` 行基线 `89` 系数据错（现读 201 行）⇒ 父侧收口轮随登记刷新。
5. 判据④ `doc-check` 属批次级读数（本舱未跑）⇒ **unverified**。

### 交付摘要（S2a · cli 源舱 env 拔除）

**范围**：六档 —— `thincoder-cli/bin/thincoder.mjs` · `src/crash-reports.mjs` · `src/heap-watch.mjs` · `src/tui/wrapped-spawn.mjs` · `src/tui/tui-lifecycle.mjs` · `src/tui/render-loop.mjs`。`test/**` 按 §2.3 归 S2b1/S2b2 ⇒ 本舱零触（`git status` 复核：cli 测试档零改动）。零 git 提交。

**落点（依 §2.3 改点行）**

- ① 键驱动：`bin:58-61` 读 `loadConfig().diagnostics`（装载器抛 ⇒ `{}` ⇒ 默认开；`loadConfig` = `bin:20` 静态 import ⇒ 非静默吞）→ `bin:66` `prepareCrashReporting({ heapSnapshot })` · `bin:73` `startHeapWatch({ enabled })`，两处判据 `!== false`（fail-open）。两模块内 env 判定与关值集合全删（`heapWatchEnabled` / `heapSnapshotEnabled` / 关值常量退场）。
- ④ argv 门：`bin:46-47` 顶部剥离 `--tui-wrapped`（门 = `_tuiWrapped`）· `bin:112-117` 三测试钩（`--test-crash` / `--test-tui-active` / `--test-cleanup-out=`）先于命令分派、按原始 argv 判定（位置无关）；注入点 `wrapped-spawn.mjs:48` = `["--diagnostic-dir=…", script, "--tui-wrapped", ...argv]`，env 零标记注入。
- ③ 缝 / 退场：`tui-lifecycle.mjs:58/61` `_cleanupOut` + `_setCleanupOutPathForTest`（单半例外——复位面无消费者）；`render-loop.mjs` 调试渲染分支删（`THINCODER_DEBUG_RENDER` 退场）。

**验证（实跑取证）**

| 面 | 命令 | 结果 |
|---|---|---|
| 六档语法 | `node --check` ×6 | 6/6 绿 |
| 崩溃钩（argv 门 · 零残留 · stdout 契约） | `node bin/thincoder.mjs --test-crash --test-tui-active --test-cleanup-out=.tc-smoke-cleanup.txt`（多形态，含旗标居首形 = 字面 `args.includes` 法必假的那一形） | exit 1 · stderr 唯一行 `[error] R25 test crash (--test-crash)`（零 env 名）· stdout 空 · 缝文件 60B（= `RECOVERY_SEQUENCE.length`）✓ |
| 键驱动两态（行为对照） | 沙箱 HOME + `--import ./.tc-probe.mjs`（计数 `setInterval`）：`heapWatch:false` / 默认 | `setIntervalCalls=0` vs `=1`（两跑均 exit 1）⇒ 键贯通至消费点 ✓ |
| 判据①（自有 env 零残引） | grep 七名（`bin` + `src/**` 全树） | 零命中；唯一 `process.env` = `src/tui/cmd-shell.mjs:24` `LOCALAPPDATA`（保留集系统原语）✓ |
| 判据⑤（env 读取增量 0） | 六档 `process.env` 计数 | 0 ✓ |
| 红面边界（承继面实跑） | `node --test test/heap-watch.test.mjs test/crash-reports.test.mjs`（沙箱 HOME） | 红例 = 2：`crash-reports.test.mjs` T2 env 关值矩阵 · `heap-watch.test.mjs` 装载期 `heapWatchEnabled` 缺失；同档其余 7 例绿 ⇒ 无附带破坏 ✓ |
| 临时残留 | glob `.tc-*`（cli 树） | no matches ✓ |

**终态**：`clean`。

### 决策透明表

| 编号 | 类型 | 内容 | 依据 / 影响 |
|---|---|---|---|
| T1 | **设计档口径未随动（D-1）** | §2.3 字面「三钩改 `args.includes`」；实现取**原始 argv**（`_argvRaw.includes`，`bin:112/114/115`）。`args` = 命令位之后的切片 ⇒ 旗标居首（`thincoder --test-crash`）永假（实测落 Unknown command）；若顶部自剥离全旗标则 `bin --test-crash` 会进包装层（父向 stdout 写 ANSI ⇒ 违 T-R25a.2）。 | 保等价唯一解（居首 / 居尾 / 前置 `--tui-wrapped` 各形态均直崩、stdout 干净）。**请收口轮改 §2.3 措辞**（审计 D-1 与代码评审行 1 同源）。 |
| T2 | 坐标偏移 | 两键读落 `bin:58-61`（VERSION 之后、`prepareCrashReporting` 之前）——§2.3 写「`:151-155` 前插」；实读为消费点（`:66` / `:73`）之前的唯一可落位。 | 语义达成（入口读键），仅行号漂移；§2.8#4「实施轮以实读为准」口径内。 |
| T3 | 崩溃 throw 消息 | `"R25 test crash (--test-crash)"`（原含 env 名）。 | 验收④「错误消息零残留旧名」；实跑取证。 |
| T4 | 缝单半例外 | `_setCleanupOutPathForTest` 无复位半（`null` 可作复位入口）。 | 与 CONFIG.md:144 名录行同形（§2.8 缝例外①）。 |
| T5 | 行为变化（未登记） | 包装标记改 argv 后仅直系子进程生效（旧 env 门经 env 继承及于全部后代 ⇒ 证据 `test/tui-stderr-capture.test.mjs:84` 注 + 冻结档 `docs/design/_archive/TUI-STDERR-CAPTURE.md:33`）⇒ TUI 会话内嵌套起 `thincoder`/`tui` 由「不包装」变「多一层包装父 + 一份 `tui-stderr-*.log`」。 | 代码评审行 5（🔵）；无功能破坏，建议收口轮在 CONFIG.md §6.2 补行为注。 |
| T6 | 文件贴限 | `bin/thincoder.mjs` = 499 行（余量 1；本批 +≈17 vs §2.3 估 +10 / CLI-DEBT A4「482 → ≈492 · 余 18 → ≈8」）。 | 代码评审行 2（🟡·非 must-fix）：收口轮刷新 §2.3 与 CLI-DEBT A4 读数。 |
| T7 | 副作用面（未登记） | `bin:60` `loadConfig()` 现于全命令路径运行（含 `--version` / `completion`）⇒ 老字段迁移写回（`thincoder-core/config.mjs:244`）与告警行（`:245` / `:293`）可能出现在此前零配置面命令上（stdout 未污染）。 | 代码评审行 4（🔵）；设计已指定入口读键 ⇒ 非偏离。 |

### 审计与代码评审轮次与终态

- **内部发散审计**（explore · 只读 · 1 轮）：终态 **DEVIATIONS**——唯一发现 = D-1（文档面，低）；六条判据逐条「齐」+ 独立复跑六档语法 6/6 绿；PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST 三类空缺（无越面改动）。
- **自修**：**0 处**（D-1 = 设计档口径 ⇒ 报告面；不改码、不自行改档）。
- **代码评审**（advisor `type=code` · 1 轮 · 同步）：**VERDICT: pass**——0 🔴 / 2 🟡（均非 must-fix：T1 同源 · T6 贴限）/ 4 🔵（`bin:44` 注释断言过强 · `bin:60` 副作用面 = T7 · `wrapped-spawn.mjs:48` 嵌套包装行为注 = T5 · `wrapped-spawn.mjs:50` 注释「env 直传」措辞）。🔵 均属注释 / 登记面建议，**未改码采纳**（避免评审对象失效），留父侧收口轮。
- **引用自核**：被 host 抽查判「未匹配 / unreadable」的三条引文经实读复核——`docs/core/design/CONFIG.md:130` 逐字相符（host 口径 = 被截断引文所致）；`CONFIG.md:145` 调试退场行本身相符，被引片语「调试三支退场（」非该行内容（该措辞属批档旧写法）；`thincoder-cli/test/tui-stderr-capture.test.mjs:84` 逐字相符（host 判 unreadable = 路径口径问题）。三条所指结论均不受影响。
- **fix round**：**0 轮**（无 must-fix）。
- **终态：`clean`**。承继义务在册：cli 测试面（S2b1 / S2b2）未闭合 ⇒ 全量测试现为预期红（§2.3 承继行），非本舱缺陷。

### S3b · vsc 测试面 env→进程内缝（8 档）

**交付摘要**：`§2.3` vsc 表 8 档全部落位——6 档 env 隔离改为进程内日志缝（`_setLogsDirForTest` / `_resetLogsDirForTest` 成对）· trace-store 档 traces 缝化 + 读根全改本地变量 + 写门用例改述 · fake-mcp 夹具死块 + 孤儿 import 删净。缝形、写门语义、退场名录逐点对齐 `CONFIG.md` §6.2；判据①–⑤ 兑现（读面 + 行为面实证）。

**改动面（8 档 · git diff --numstat）**

| 文件 | +/− | 关键位（file:line 现读） |
|---|---|---|
| `test/activity-live-visibility.test.mjs` | +4/−3 | import :23 · set :34 · after reset :46 · 注释 :74 改述（读点 `_logDir` :77-79） |
| `test/async-parity.test.mjs` | +4/−3 | 头注 :16–17 · import :32 · set :51 · reset :55 |
| `test/async-visibility.test.mjs` | +4/−3 | import :31 · set :44 · reset :55 · 注释 :109 |
| `test/nested-token-relay.test.mjs` | +4/−3 | import :25 · set :41 · reset :49 · 注释 :62 |
| `test/upstream-parity.test.mjs` | +3/−2 | import :26 · set :38 · reset :41 |
| `test/workspace-guard.test.mjs` | +5/−4 | 头注 :5–7（列举缝名）· import :22 · set :45 · after reset :59 · 注释 :112 · 先例指针重指 `async-parity.test.mjs:49-60` |
| `test/trace-store.test.mjs` | +29/−39 | 头注 :3–4 · import :27–28 · after 兜底复位 :44 · `freshRoot()` 缝 set :52 / `done()` 复位 :53 · 写门用例改述 :90（未设缝不落盘）· 读根全本地变量（:60 / :72 / :240 / :259 / :339-349）· F6 写失败缝化 :269 + finally :276 · 删 `_prevTracesDir` env 复位 |
| `test/fixtures/fake-mcp-server.mjs` | +0/−6 | env 握手死块（4 行）+ 孤儿 `readFileSync` import + 邻空行删净；仅余 `:7` `node:readline` 单 import |

**决策透明表**

| # | 决策 | 依据 | 影响 |
|---|---|---|---|
| 1 | `freshRoot()` 改返 `{ root, done }`（原返单个清理函数） | 设计要求「读根改本地变量」——env 读点须有本地替代 | 8 处读点改本地 `root`；`done()` = 复位缝 + 清 tmp |
| 2 | F6 写失败用例：缝指向 `blocker` 文件 + `finally` 复位 | 与改前 env 语义等价（原指向文件路径） | 零 |
| 3 | 不调用 `_resetTraceStateForTest()` | `_seqCache` 键含全目录（`trace-store.mjs:141`），freshRoot 目录唯一 ⇒ 无跨用例残留；prune 节流不涉断言 | 零 |
| 4 | `.thincoder/tmp/*.log`、`docs/_archive/**` 旧 env 名不动 | 批档 §1.5 / §1.6 排除面 | 零 |
| 5 | 设计面计数/坐标漂移（见界外注记）不改设计档 | 设计档非本角色作者；批档 append-only | 记录在案，收口轮刷新 |

**审计与代码评审轮次 · 终态**

| 轮 | 类型 | 对象 | 结论 |
|---|---|---|---|
| 分叉审计 R1 | 只读 explore 逐档对账（设计单源 vs 现盘 8 档） | 8 档 | 四类偏差零命中（**CLEAN**）；越界零（mtime 面仅 8 档同窗）；判据④⑤复核读数为源面零命中 |
| 代码评审 R1 | advisor `type=code`（同步）· 8 档 + documents = 批档 / `CONFIG.md` | 8 档 | **VERDICT: pass**（无 🔴）；发现 1×🟡 + 3×🔵 ⇒ 响应表 4/4 不采纳为必修（理由见下） |

**响应表（评审发现 → 处置）**

| # | 发现 | 级别 | 处置 | 理由 |
|---|---|---|---|---|
| 1 | 5 档 >300 行咨询线（async-parity ≈493 · workspace-guard ≈488 · async-visibility ≈453 · activity-live-visibility ≈400 · trace-store.test ≈390） | 🟡 非必修 | 不动作 | 存量在册（VSC-DEBT `:295`/`:301`/`:311-312`）；本批 Δ≈0；R3 不升级不重开 |
| 2 | 批档 §2.3 vsc 表读数/坐标漂移（改点坐标统一 +1；trace-store `400 \| −4` vs 现读 ≈390） | 🔵 | 记录在案 · 本批不改 | 批档 append-only + 设计档非本角色作者 ⇒ 收口轮读数刷新统一收 |
| 3 | trace-store 写门用例标题「不碰盘」无独立断言（body 仅断返回值 `undefined`） | 🔵 | 不动作 | 与改前等价（原 body 亦仅断返回值）；设计指定「改述」已兑现；可选强化留后续触碰 |
| 4 | workspace-guard 日志缝无正控（唯一消费 = 否定断言 `turnStarts()` :212/:216） | 🔵 | 不动作 | 越出设计改点面（不加行）；判据③ 日志面由同批另 5 档正控证明 |

**fix round**：0（审计 + 评审均零必修项，无自修）
**终态**：**clean**

**验证证据（命令 + 读数）**
- `node --check` × 8 档：`Syntax OK`（8/8）
- `cd thincoder-vscode && node test/run.mjs`（终稿复跑）：`ℹ tests 1010 · pass 1010 · fail 0 · cancelled 0 · skipped 0 · duration_ms 140845.9531`，exit 0
- 判据④：8 档源面 `THINCODER_(LOG_DIR|TRACES_DIR)` 零命中；判据⑤：`FAKE_MCP_READY_FILE` 全仓源面零命中（仅文档登记行）
- env 增量：8 档 `process.env` 零命中（本批 env 读取增量 = 0）

**界外注记（未动 / 供收口轮）**
- 残留旧 env 名：`.thincoder/tmp/*.log`（运行产物）· `docs/_archive/requirements/LOGGING.md:34`（归档历史档）——非本批判据域，未动。
- 设计面计数/坐标漂移（非语义面）：`fake-mcp-server.mjs` 实删 −6 vs §2.3 声明 −4；`trace-store.test.mjs` 表基线 400 与现读 ≈390 不符；vsc 表改点坐标统一 +1（import 行所致）。
- 未动面：`src/**` · core · cli · bench · 桌面端 · 设计档 · `test/files.mjs`（8 档本已在册，无需改）。
- 判据②③ 由实施侧复跑（上列读数）；审计子代理为静态面装配，未复跑命令。

### S3a1 · bench 源面舱（env→CLI 参数→进程内缝 · 6 档）

**状态句**：实施完成（六档落位 · 源面行为面全绿 · 审计 CLEAN · 评审 pass · fix round 0 · 终态 clean）。

**交付摘要**：`§2.3` bench 源面三档（`run` / `probe` / `toolcall`）+ 三 lib（`output` / `judge` / `prices`）全部落位 —— env 三名（`BENCH_RESULTS_DIR` / `BENCH_JUDGE` / `BENCH_PRICES`）→ ② CLI 参数 + ③ 进程内缝（混合形：argv 经入口解析后落缝，既有 lib 调用点零改即生效）。缝形 / 命名例外 / 缺省锚 / 覆盖解析语义逐条对齐 `CONFIG.md` §6.2；本舱 env 读取增量 = 0。

**改动面（6 档 · 现读）**

| 文件 | 关键位 |
|---|---|
| `bench/lib/output.mjs` | `:16` `let _resultsDir = null` · `:17` 读点 `?? join(BENCH_DIR, "results")` · `:20` `setResultsDir`（命名例外 · 无 `_reset` 半） |
| `bench/lib/judge.mjs` | `:34` / `:35` 读点 + `:38` / `:39`（成对缝） |
| `bench/lib/prices.mjs` | `:25` / `:26` 读点 + `:29` / `:30`（成对缝） |
| `bench/run.mjs` | 用法 `:31` + 说明 `:41-43` · parse `:206-208` · 落缝 `:286-289`（三参） |
| `bench/probe.mjs` | 用法 `:26` + 说明 `:35-37` · parse `:73-75` · 落缝 `:275-278`（三参） |
| `bench/toolcall.mjs` | 用法 `:26` + 说明 `:36-37` · parse `:72-73` · 落缝 `:225-227`（**两参** —— 本面无判官档消费者） |

**决策透明表**

| # | 决策 / 事项 | 理由 · 依据 |
|---|---|---|
| 1 | toolcall 仅接 `--results-dir` / `--prices` | `§2.8` 通道参数矩阵（`:255`）+ grep 实证：`bench/toolcall/**` 对 `judgeConfigPath` / `loadJudgeConfig` 零命中 ⇒ 补 `--judge-config` 即死参（「按各脚本适用面」读法；与 run / probe 三参不同） |
| 2 | 三入口 USAGE 同批补「用法行 + 说明行」 | ② 面 = CLI 契约面（`MODEL-BENCH.md` §2.1 / §10.8 / §11.9 参数表同批随动）⇒ 行数超 `§2.3`「+4 各」估值（run +14 / probe +11 / toolcall +8）——披露：超出部分 = 用法说明三行 + 落缝注释，非范围扩面 |
| 3 | `setResultsDir` 无 `_reset` 半 | `CONFIG.md:146` 名录「命名 / 成对例外」逐字；复位面无消费者（不造死半） |
| 4 | 生产 CLI 路径复用 `_set*ForTest` 名 | `CONFIG.md:152` 混合形逐字（argv → ③ 缝）；不新造平行 setter（否则双入口面） |
| 5 | 未拆 `run.mjs` / `probe.mjs`（现读 310 / 310 行） | 拆 = 结构面变更，越出本舱设计改点面（`§2.3` 只列参数 / 缝合）⇒ 行数越线与登记刷新归收口轮（评审行 #1 / #2 同源） |
| 6 | `bench/results/` 清场 62 件 untracked 夹具产物 | 该目录 = 留档面，夹具产物系 bench 测试跑写入（S3a2 未改制前 env 重定向已死）；逐档 `delete`（非递归）· 基线 12 件 tracked 资产 + 既有 1 件 pdf 未动 · 本舱自检产物 `bench/tmp-s3a1-verify/`（6 件 + 目录）同清 ⇒ 现态零残留 |
| 7 | 读面超预算 | 实读档数超 `§2` 预算（≤12 档）—— 为核消费面 / 残引 / 逐脚本适用面，读面含六档 + 设计单源 + 批档 + 消费面与测试面取证；读多写零越权，如实披露 |

**验证证据（命令 + 读数）**

| 面 | 命令 | 结果 |
|---|---|---|
| 六档语法 | `node --check` ×6 | 6/6 绿 |
| 缝行为（进程内 · 装载期先设 dead env） | 六档动态 import 后逐项断言 | ① 三档默认锚 = `bench/results` / `bench/judge.json` / `bench/prices.json` 且 env 值零命中；② `setResultsDir` / `_set*` 生效、`_reset*` 复原；③ 相对值按 cwd 解析；④ `probe.parseArgs` 返三字段；⑤ `toolcall.parseArgs` 返两字段且 `--judge-config` 拒收（未知参数）⇒ 10/10 |
| 端到端 | 三支 `--dry-run --results-dir bench/tmp-s3a1-verify` | 三支 exit 0 · 六件产物落指定目录（run / probe / toolcall × {json, md}）⇒ 通道贯通 |
| 残引 | 全仓 grep（三名 + `process.env`） | 六档零命中（`env` 仅 shebang）；bench 全树命中全在 `bench/test/**`（S3a2 域） |
| 全量套件 | bench 套件（`node --test`） | **116 用例 · 90 过 · 26 红** —— 红面全为 `bench/test/**` 仍写已拔 env（S3a2 待改面），**非本舱回归**；同跑会把夹具产物写入真实 `bench/results/`（已清，见决策表 6） |
| 清场复核 | `git status`（bench 面） | 仅六档 `M`；`bench/results/` = 12 tracked + 1 既有 pdf；`bench/tmp-s3a1-verify/` 不存在 |

**审计与代码评审轮次 · 终态**

| 轮 | 类型 | 对象 | 结论 |
|---|---|---|---|
| 分叉审计 R1 | 只读 explore 对设计逐条（8 面） | 六档 | **CLEAN** —— 缝形四要件 / 命名例外 / 逐脚本适用面 / env 零残引 / 运行期取值（无装载期缓存）/ 档外改动零 / 残留零 / 注释与代码一致，逐条相符；观察 3 条（三入口 USAGE 未列 `--help` = 存量同形 · `§2.6 #3` 前提已废 · `§5` 本段） |
| 代码评审 R1 | advisor `type=code`（同步）· 六档 + documents = 批档 / `CONFIG.md` | 六档 | **VERDICT: pass** —— 0 🔴 · 2 🟡（非必修：`run.mjs` 310 / `probe.mjs` 310 越 300 建议线）+ 2 🔵（`output.mjs:42` 文案硬编码 `bench/results/` · 三入口真值门对空串静默）。host 抽查 1 条引文未机械匹配（`output.mjs:42`）⇒ 自核实读：该行「同名产物已存在：bench/results/…」逐字在位，所指成立 |

**响应表（评审发现 → 处置）**

| # | 发现 | 级别 | 处置 | 理由 |
|---|---|---|---|---|
| 1 | `run.mjs` 310 行越 300（未登记拆分） | 🟡 非必修 | 不动作（报告面） | R3 文件档位债不升级；拆 = 结构面变更，越出本舱改点面 ⇒ 收口轮刷新登记 |
| 2 | `probe.mjs` 同（310 行；在册 299 余量 1） | 🟡 非必修 | 不动作 | 同上 |
| 3 | `output.mjs:42` 拒写文案硬编码落点 | 🔵 | 不动作 · 上抛 | 该文案被 `bench/test/**` 三档断言 ⇒ 改动落 S3a2 面（域外） |
| 4 | 三入口真值门（空串静默落缺省） | 🔵 | 不动作 | 设计未定空值语义；改则新增用户面错误路径（非本舱改点面）⇒ 报告面 |

**fix round = 0**（审计 + 评审均零必修项）· **终态：`clean`**。

**上抛父侧（域外 · 只报不改）**

1. **判据②（全量测试）须 S3a2 同批闭合**：`bench/test/**` 仍 100% 写已拔三名（`test/fixtures.mjs` · `test/judge.test.mjs` · `test/recompute.test.mjs` · `test/probe*.test.mjs` · `test/toolcall*.test.mjs` 等）⇒ 现读数 = 116 / 90 / 26 红（预期红）；**S3a2 落舱前勿跑 bench 全量套件**（跑则夹具产物落真实 `bench/results/`，且撞 KD-10 同名拒写）。
2. **行数 / 登记刷新**：`run.mjs` 310 · `probe.mjs` 310（越 300）· `toolcall.mjs` 262（+8 vs `§2.3` 估 +4，未越线）⇒ 收口轮刷新 `§2.3` 与在册口径（拆点计划 / 「登记不拆」）。
3. `bench/README.md:43-53` 参数表未列三新参（不在 B6 五档随动清单内）⇒ 如需用户面文档同步，另立条目。
4. `§2.6 #3`「`run.mjs` 顶层捕获结果目录」前提已废（现读点惰性）⇒ 收口轮收正记录面（`bench/test/fixtures.mjs` 同源陈旧注释随 S3a2 清理）。
5. `bench/preflight.mjs` 不接 `--judge-config`（设计裁「preflight 0 参」）⇒ 带判官档覆盖的跑批与单跑预检不同源（KD-34 单源意图留缺口）；设计面裁定。
6. **未验证项**：`--max-cost` 截断路径 / `--recompute` / `--rejudge` 未端到端实跑（本舱实证面 = dry-run 三支 + 进程内行为）；判据④⑤在 bench 面由 S3a2 承接。

### §5 实施记录（eng-coder）

**舱**：S2b2 cli 测试面舱（日志/轨迹缝族）——8 个 cli 测试档的 env 隔离缝 → **进程内缝 ∥ argv**；本舱 env 增量 = 0；零 src/bin/core 改动。

**改动面（8 档，逐档 set/reset 落点）**
| 档 | 缝 | 设 / 重置 |
|---|---|---|
| `test/input-lock.test.mjs` | 日志缝（import `:26`） | `:360` / `:365`（finally） |
| `test/integration/subagent-lifecycle.test.mjs` | 日志缝（import `:19`） | `:199` / `:242`（finally） |
| `test/provider-error-surface.test.mjs` | 日志缝（import `:20`） | `:264` / `:271`（finally，夹具内） |
| `test/queue-payload-binding.test.mjs` | 日志缝（import `:19`） | `:94` / `:113`（finally） |
| `test/subagent-zero-block.test.mjs` | 日志缝（import `:21`） | `:29`（before）/ `:33`（after） |
| `test/sync-cancel.test.mjs` | 日志缝（import `:22`，读档仍走 `todayLogPath()` `:179`） | `:171` / `:184`（finally） |
| `test/trace-bounds.test.mjs` | 轨迹缝（import `:17`） | `:23`（beforeEach）/ `:28`（afterEach） |
| `test/session-gc-cli.test.mjs` | 子进程面 = argv（env 只留假 HOME） | `WRAP_GATE` `:18`；8 处 spawn 全带门 `:70/:87/:117/:122/:127/:130/:145/:148`；沙箱 env `:30` |

**判据对账**：① 三 env 名（`THINCODER_LOG_DIR` / `THINCODER_TRACES_DIR` / `THINCODER_TUI_WRAPPED`）八档零命中（含注释；全 `thincoder-cli/test` 树亦零命中）② 8 档定向跑 47/47 绿 ③ cli 全量 865/865 绿 ④ env 增量 0 ⑤ 未碰 src/bin/core 与兄弟舱档（`tui-stderr-capture.test.mjs` 等未动）。

**决策透明表**
1. **argv 插法（我的实现选择）**：设计只定「env→argv 门」，未定写法。选单一常量 `WRAP_GATE = "--tui-wrapped"` + `[BIN, WRAP_GATE, ...]` 覆盖 8/8 spawn（先例同形：`tui-stderr-capture.test.mjs`）。附注：这 8 处命令均非包装门路径（command 存在且非 `tui`），argv 门在此为**显式/防御性等值**（原 env 亦同——去掉亦行为等价；保留以逐条兑现设计且防 gate 未来收窄）。
2. **`prevEnv` 保存-还原双分支退场**（`trace-bounds` / `sync-cancel`）：缝重置语义 = 复位为「无缝」，两档均无嵌套使用 ⇒ 无需保存旧值；`let prevEnv` 声明随之删除。
3. **跨档指针去名**（`subagent-zero-block:9`）：原注释「（async-discard.test.mjs 同款）」指向兄弟舱档，其机制未必同步 ⇒ 改机制直述，避免失效指针。
4. **`session-gc-cli` 头注重写（`:24-26`）**：去掉「该 env 优先于 `configDir`」的失效表述，改为「traces 根同派生自 `configDir`」。
5. **未落可选强化**：`provider-error-surface.test.mjs:273`（`readdirSync(logDir)[0]` 未落盘时抛 TypeError 而非断言失败）——存量、非本批引入、越出本舱 ±0 改点面 ⇒ 不动，交父侧按需入册。

**审计与代码评审轮次与终态**
- **内部 explore 背离审计：1 轮** —— 四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）**均 none found**；1 条观察（`input-lock:360-362` 设缝与 `try` 间夹 `abort()`）裁定合规、无动作（重置仍在 finally；与改前同序）。
- **内部 advisor 代码评审（type=code）：1 轮** —— **VERDICT: pass**；无 🔴、无 must-fix 🟡。非必修项：🟡 在册（`input-lock` 404 行 / `provider-error-surface` 310 行越 300 建议线 —— CLI-DEBT A15 / B9 在册，R3 口径不升级）；🔵 批档 §2.3 坐标与现盘统一 +1（属 §2.8 #4「实施轮以实读为准」口径，收口轮刷新）；🔵 上述 `:273`。
- **fix round = 0**（两轮均无必修项 ⇒ 无自修轮）。
- **终态：clean**。

**读数（复现命令）**
- `cd thincoder-cli && node --test <8 档>` → tests 47 / pass 47 / fail 0
- `cd thincoder-cli && node test/run.mjs` → tests 865 / pass 865 / fail 0（首跑 1 红 = 域外档 `doc-check.test.mjs` T-DC-15；隔离跑 19/19 绿、全量复跑全绿 ⇒ 判负载瞬时抖动，与该档零接触面）
- 验收 grep：八档三 env 名零命中 · `prevEnv` / `delete process.env` 零命中 · `process.env` 仅 `session-gc-cli:30`（宿主环境透传扩散）

### S3a2 · bench 测试面舱（eng-coder · 2026-09-27）

**舱面**：批档 §2.3 bench 段（`:161-174`）· 9 档测试（`bench/test/`）——`BENCH_RESULTS_DIR` / `BENCH_JUDGE` / `BENCH_PRICES` 三名 → **进程内缝 + CLI 参数双面**；env 增量 0；零触 `bench/lib/**`、`bench/{run,probe,toolcall,preflight}.mjs`（S3a1 面）、`bench/results/**`、核/cli/vsc/桌面端、设计档。

**交付摘要**：9 档 15 行 env 写/删 → 缝调用（含 `try…finally` 同行形），相应 CLI 调用点补参；每处 1 occurrence、`node --check` 九档全 `Syntax OK`；`fixtures.mjs` 注释前提按上抛 4 收正（承下）。

**改动面（逐档：缝 / 设·重置 / 参数面）**

| 档 | 缝 | 设 · 重置 | CLI 参数面 |
|---|---|---|---|
| `fixtures.mjs` | `setResultsDir`（import `:12`） | `:18` | 无（驱动档，`main` 于 `:19` 装载） |
| `probe.test.mjs` | 同上 | `:31` | `:219` |
| `probe-report.test.mjs` | 同上 | `:20` | 6 处：`:47` `:97` `:99` `:102` `:105` `:148` |
| `toolcall.test.mjs` | 同上 | `:31` | 2 处：`:164` `:267` |
| `toolcall-report.test.mjs` | 同上 | `:23` | 7 处：`:44` `:104` `:115` `:117` `:120` `:132` `:153` |
| `judge.test.mjs` | 判官缝（import `:13`） | `:88` / `:93`（finally）· `:103` / `:104`（内联复位） | `:90` · `:104`（`runWith`）；`:167` 默认腿 ⇒ 零补参 |
| `judge-fallback.test.mjs` | 判官缝（import `:11`） | `:177` / `:228`（finally） | 无 CLI 调用面（`rejudgeMain` 直调）⇒ 条件式不适用 |
| `preflight.test.mjs` | 判官缝（import `:16`） | `:127` / `:132` | `:128`（阻断腿）；`:111` 默认腿 ⇒ 零补参 |
| `recompute.test.mjs` | 价格缝（import `:10`） | `:91` / `:93` · `:149` / `:151`（finally） | `:93` · `:151`；默认价腿 ⇒ 零补参 |

**判据对账（§2.7 ①②③⑤ 的 bench 域）**
- ① 零残引：`bench/` 全树三 env 名**零命中**（测试面 + 产品面）。
- ② 测试全绿：`cd thincoder && node --test "bench/test/*.test.mjs"` ⇒ **tests 116 / pass 116 / fail 0 / exit 0**（S3a1 基线 = 116 / 90 绿 / 26 红）。
- ③ 行为等价：九档落档面全部指向 mkdtemp 沙箱；跑后 `bench/results/` 读数与跑前一致（仅 2026-09-24/25 存量件，零污染）。
- ⑤ env 增量 0：本舱纯删 15 行、零增；`bench/**` 全树 `process.env` **零命中**。
- 双面可用（实读）：`run.mjs:287-289` 三参 → 三缝（先于 `:294` `startupPreflight`（其内 `:264` 读点）与 `:295` `runMain`）· `probe.mjs:276-278` · `toolcall.mjs:226-227`（`:225` 注明本面无判官档面）。

**决策透明表**
1. **「spawn 面」= 测试内 CLI 调用 args 补参**（非子进程注入）：本舱九档为进程内调用面，双面以「参数 ⊎ 缝」同位表达（§2.5 归类规则）。
2. **只对确有覆写的调用点补参**：`judge.test.mjs:167` · `preflight.test.mjs:111` · recompute 默认价腿均用仓内默认 ⇒ 零补参，避免过度补参掩盖默认路径回归。
3. **参数一律追加在 args 末位**：保持既有参数序、最小 diff。
4. **`fixtures.mjs` 注释前提收正**（承 S3a1 上抛 4）：`:4` / `:18` 两行 1:1 改述为「读点惰性 · 与 import 顺序无关」；「先设缝、再装载」的**序**保留（§2.3 `:169` 硬性序不违）。
5. **缝重置语义**：`setResultsDir` 无 reset（`output.mjs:20`，无状态）⇒ 档内不回退；判官/价格两缝成对 set/reset，重置落在 `finally` 或测试尾。

**审计与代码评审轮次与终态**
- **内部 explore 背离审计：1 轮** —— 四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）**均 none found**；逐档缝-参成对、时序正确、无清单外改动。
- **内部 advisor 代码评审（type=code）：1 轮** —— **VERDICT: pass**（🔴 0 / 🟡 2 / 🔵 2）。
  - 🟡#1（`fixtures.mjs:4` / `:18` 陈旧装载序前提）⇒ **fix round 1 已修**。
  - 🟡#2（参数面测试内不可证伪：双面同值 ⇒ 删参数亦绿）⇒ 非 must-fix，转上抛（下条 2）。
  - 🔵#1（`judge-fallback.test.mjs:16` `FIXTURES` 未用导入 · `recompute.test.mjs:166` 恒真占位断言）⇒ 存量、改动面外 ⇒ 报告面。
  - 🔵#2（§2.3 坐标 / 读数漂移：seam 落 `:18` vs 表 `:17`；`judge.test.mjs` 现 297 vs 表 298）⇒ 收口轮刷新。
- **fix round = 1**（仅 🟡#1 两条注释；改后复跑 **116/116 全绿**）。
- **终态：clean**。

**上抛父侧（域外 · 只报不改）**
1. **记录面收正**：§2.6 #3「`run.mjs` 顶层捕获结果目录」前提已废；§2.3 `:169`「（仍须在 import run.mjs 之前）」句 ⇒ 收口轮收正（代码侧同源注释本舱已清）。
2. **可选强化（🟡#2，另轮）**：留一条只靠参数的腿（如 `recompute.test.mjs:91` 去缝、仅 `--prices changed` 承重），使参数面成为可证伪的承重面。
3. **存量在册（非本舱改点面）**：`run.mjs --rejudge` 端到端未跑（上抛 6）；`--results-dir ""` 空串静默落缺省（S3a1 响应表行 4）；`bench/README.md:43-53` 参数表未列三新参（上抛 3）。

**读数（复现命令）**
- `cd thincoder && node --test "bench/test/*.test.mjs"` → tests 116 / pass 116 / fail 0 / exit 0
- `node --check` 九档 → 全 `Syntax OK`
- grep `bench/` 全树：三 env 名 + `process.env` → 零命中

**披露**：本舱读档预算 ≤12 已超支（S1 先例，如实披露）；§5 段首状态行（前舱所设「实施完成」）本舱未改写——本舱状态以上块为准。

### S2b1 · cli 测试面舱（eng-coder · 2026-09-27）

**舱面 / 边界**：§2.3 cli 测试面六档（`thincoder-cli/test/`）——env 输入 → 三通道（配置键 / argv / 形参）；铁律 = 测试内零自有 env 名。零触 `src/**` · `bin/**` · core · vsc · bench · 桌面端 · 设计档；零 git 提交。

**改动面（6 档 · `git diff --numstat` 现读）**

| 文件 | +/− | 现读行（批档表列） | 关键位（现读） |
|---|---|---|---|
| `test/crash-reports.test.mjs` | +11/−15 | **106**（111） | 头注改述 :3 · T1 去 `env:{}` :29 · **T2「关值矩阵（8 值：`0`/`false`/`off`/`no` + 空白/大小写变体）」→ `heapSnapshot:false` 单例** :35-38 · **T3（7 值 env 表）→ `{}` / `{heapSnapshot:true}` 两格** :41-46 · T4 去 `env:{}` :51 |
| `test/heap-watch.test.mjs` | +16/−23 | **106**（114） | 头注 :3 · import 去 `heapWatchEnabled` :9 · T-HW1 :27 · **T-HW2（关值 7 值矩阵 + 开值 6 值表 + 两处 `heapWatchEnabled` 单测）→ `enabled:false` 单例（:36 注入低于首档保确定性）+ 默认开单例** :34-42 · T-HW3/4/5 摘 `env:{}` :53 / :77 / :91 / :99 / :104 |
| `test/tui-stderr-capture.test.mjs` | +16/−26 | **154**（165） | 头注门名 :2 · `clearSig()` 引用计数式精确摘除 :20 · **T6 期望补 `--tui-wrapped`** :62 · `THINCODER_HEAP_SNAPSHOT` 关值对（旧 :66-76）整删 · **慢例 1 = `tui --test-crash`** :73 · **慢例 2 = 两格 `--tui-wrapped+tui` / `chat`（`--test-crash` 居尾）** :87-89 |
| `test/doc-check.test.mjs` | +12/−4 | **340**（333） | `runSelf()`：`node --test <本档>` → 直跑 `node <本档> --nested` + env 去 `NODE_TEST_CONTEXT` :302-309 · 门 `process.env.DOC_CHECK_NESTED` → `process.argv.includes("--nested")` :323 · 非空跑断言（汇总行 `pass ≥ 1`）:330-333 |
| `test/smoke-qwen-thinking.mjs` | +5/−5 | **90**（89） | 用法行 :2 · 门 `THINCODER_SMOKE !== "1"` → `!process.argv.includes("--smoke")` :14-15 · `want` = `argv[2]` → 首个非旗标参 :25 |
| `test/smoke-responses.mjs` | +1/−1 | **77**（78） | 注释指针随改（门控同构句）:24 |

**行数读数 / 漂移登记**（口径 = `find /c /v ""`；批档 §2.4 :266 已声明「`read` 口径 = 表口径，`wc -l` = raw，两者差 +1」⇒ 与表列值存在 ≤1 口径差）：crash-reports 111→106 · heap-watch 114→106 · tui-stderr 165→154 · doc-check 333→340 · smoke-qwen 89→90 · smoke-responses 78→77。`git diff --numstat` 净行（无口径歧义）= **−4 / −7 / −10 / +8 / 0 / 0**。**与表列 Δ 相抵者 1 档**：`doc-check` 表列 Δ ±0 → 净 **+8**（非空跑断言新增所致）⇒ `CLI-DEBT.md:59` B8 行「332 / ±0 行」注随之失真（见上抛 2）；余 5 档与表列 Δ 同向。**末次修正**：`:70` 指针 `bin:111` → `bin:114`（实测 = `_argvRaw.includes("--test-crash")` 所在行；改后定向 + 全量复跑，读数见下）。

**判据对账（§2.7 ①②③④⑤ + §2.6 #2）**

- ① **零残引（17 名全族）**：`thincoder-cli/test` 全树（`**/*.mjs`）逐名扫 §1.5 :30 全族 17 名（cli/src·bin 七支 + `THIN_DEBUG_BODY` / `ADVISOR_DEBUG` + 目录键两支 + bench / 工具面六支）⇒ **零命中**（含注释、用例名、文档锚）。
- ① 补 · **`process.env` 面全枚举**：全 cli 测试树命中 **10 处 / 9 档**，**无一处 `process.env.<名>` 读取**。本舱面 3 处 = `tui-stderr-capture:73` / `:89`（`{ ...process.env, USERPROFILE, HOME }` 沙箱透传）+ `doc-check:306-307`（`{ ...process.env }` + `delete env.NODE_TEST_CONTEXT`——§1.5 :34 唯一保留集，读/删允许）；余 7 处 = 存量 / 兄弟舱 HOME 沙箱透传。
- ② **测试全绿**（末次修正后复跑）：定向 `node --test <本舱四档>` ⇒ **tests 44 / pass 44 / fail 0 / cancelled 0 / skipped 0 / todo 0 / duration_ms 2590.0 / exit 0**；**全量** `node test/run.mjs` ⇒ **tests 865 / suites 14 / pass 865 / fail 0 / cancelled 0 / skipped 0 / todo 0 / duration_ms 56625.9 / exit 0**（日志 `%TEMP%\s2b1-targeted-final.log` · `%TEMP%\tc-suite-2b1-final2.log`）。
- ③ **行为等价 / 判别承重**：关值判别面改参数单例后逐档定向复跑全绿；判别承重不靠越档注入（见决策 #1）。
- ④ **崩溃 / 包装面实跑**：慢例 1 = 包装发生 + `tui-stderr-*.log` 落盘 + `crash-*.json` 在场 + 子崩溃码 1 → 父 1；慢例 2 两格 = 零包装 + 崩溃记录照常 + 同码 1。
- ⑤ **env 增量 = 0**：纯删 / 改判据形，零新增 env 名。
- ⑥ **prepublish 零花费（§2.6 #2）**：`node --test test/smoke-qwen-thinking.mjs test/smoke-responses.mjs` ⇒ 两档各打印 skip（门未开）+ `pass 2 / fail 0 / exit 0`，零网络 / 零 token（两档自该读数后内容未变 ⇒ 读数有效）。

**决策透明表**

| # | 决策 / 事项 | 理由 · 依据 |
|---|---|---|
| 1 | **判别承重面归「注册与否 / 调用计数」，不归越档 sample**（审计修正项） | `enabled:false` 真判别 = `src/heap-watch.mjs:70` 关值**返回同一 `checkNow`** ⇒ 唯一可判别差异 = `:71` 是否注册 ⇒ 断言面 = `timer.calls.length`（T-HW2 :37 / :41）。**「注入越档 sample 证判别」部分否决**：越档注入只证预警逻辑（= T-HW3 :44-59 之职），不证开关判别。T-HW2 :36 注入**低于首档**仅为确定性（不依赖真实堆态）⇒ :38「关值句柄零输出」断言不引噪声。 |
| 2 | T6 期望补 `--tui-wrapped`（:62） | 表外**必然随动**：注入形由 `src/tui/wrapped-spawn.mjs:48` 定 ⇒ 逐字断言须同步；§2.3 未列该期望行。 |
| 3 | 慢例 1 取 `tui --test-crash` 形（:73） | 崩溃门改 argv（`bin:114` 按原始 argv、位置无关）后 `--test-crash` 必现；它居首即占命令位（`bin:47`）⇒ **缺省形（零参）无法与崩溃旗标共存** ⇒ 缺省形包装触发在本档**无真 spawn 覆盖**（已知缺口 · 如实登记）。缺省形与 `tui` 形在 `bin:51` 同格；「非 TUI」判别由慢例 2 `chat` 格承担。 |
| 4 | 慢例 2 两格改 `--tui-wrapped+tui` / `chat`，`--test-crash` 居尾（:87-89） | 审计发现：原两格中 `--test-crash` 居首占命令位 ⇒ 包装门在任何命令取值下已假 ⇒ **两格判别力归零**；改后分别真检「旗标剥离」与「命令位 ∈ {缺省, tui}」两合取项。 |
| 5 | `doc-check` 非空跑实证落为**档内断言**（:330-333） | §2.6 #1「须实证非空跑——否则回退 `test/dc-nested-entry.mjs`」的**持久形**（未新建档）：直跑子实例须吐 node:test 文本汇总行（`pass ≥ 1`，两个并发实例各断言一次）。启动形 `node --test` → 直跑 + `--nested`、env 去 `NODE_TEST_CONTEXT`（继承则走序列化子模式、只吐二进制事件流、无汇总行——实跑实证）。 |
| 6 | `clearSig()` 改引用计数式精确摘除（:20） | 终点 = 本引用归零（异引用监听者不碰、无 `listenerCount > 0` 空转面）——评审项落地。 |
| 7 | smoke 门 → `--smoke`；`want` 取**首个非旗标参**（:25） | 门旗标居 `argv[2]` 会顶掉 provider 名位；host 参数面语义（`--smoke [providerName]`）逐字兑现用法行 :2。 |

**审计与代码评审轮次与终态**

- **内部 explore 背离审计：1 轮** —— 3 黄条（均在**判别力面**：红线例旗标占位致两格判别力归零 · T6 期望缺 `--tui-wrapped` · `chat` / `tui` 命令位判别）⇒ **全部自修并实证**；**清单外面零**（`git status` 复核：六档 = 声明面；`src/**` / `bin/**` 零触）。
- **内部 advisor 代码评审（type=code）：2 轮** —— 轮 1 = **VERDICT pass**（0🔴；2 项发现 ⇒ 自修落地）；轮 2 = **VERDICT pass**（复核两 fix 在位；残余 🔵 1 项**不采纳** = `heap-watch.test.mjs:93` `w2.checkNow()` 于 `:87` `console.error` 复原后执行 ⇒ 每次运行一行真 stderr 噪声——无假红、无逻辑面，改则动已评审对象 ⇒ 记录在案）。
- **fix round = 1**（自修 5 项 = 审计 3 + 评审 2；改后复读 / 定向复跑复核，轮 2 确认在位）。
- **终态：`clean`**。

**上抛 / 登记（域外 · 只报不改）**

1. **人工 smoke 文档面仍带旧门**：`thincoder-cli/AGENTS.md:35` 与 `docs/RELEASE.md:119` 仍写 `THINCODER_SMOKE=1 node --test test/smoke-qwen-thinking.mjs` ⇒ 现行为 = `node test/smoke-qwen-thinking.mjs --smoke`；旧形在新门下 = 静默 skip（人工 smoke 会**假绿**）。文档面非本角色作者（§2.5 #4 已列替换文本）⇒ 收口轮替换。
2. **`docs/cli/design/CLI-DEBT.md:59` B8 行**：读数 332 → **现读 340**；「本批触碰 … **±0 行**」注与实施读数（+12/−4）不符 ⇒ 收口轮刷新（仍在册「触发式」口径内，不升级）。
3. **键面承重缺口（评审项）**：`diagnostics.heapWatch` / `heapSnapshot` 两键的**键 → bin 读取（`bin:58-61`）→ 形参（`bin:66` / `bin:73` → 模块）** 全链路无自动化承重——本舱只覆盖模块形参两态（T2 / T3 · T-HW2）⇒ 收口轮在册或另立条目。
4. **`doc-check.test.mjs` T-DC-15 并发域敏感性（存量）**：S2b2 首跑全量现 1 红、隔离跑 19/19 绿（§1.12 父侧定性 = 两舱同树并跑干扰）；本舱改其子实例启动形（实例生成数不变），此后全量跑（S2b2 复跑 + 本舱 ×2）全绿 ⇒ 记录面提示。
5. **本舱慢例缺省形覆盖缺口**（决策 #3）——披露面，供收口轮判是否补面。

**披露**：本舱改写 §5 段首状态行（值保持「实施完成」；读数更新为终稿面——前值 = 前舱读数，逐舱读数见各舱块）。本舱读档预算超支情况：无越界读写，仅本表列六档 + 批档 / 设计档只读。

## §6 验证与收口（父代理）

**验证与收口（父侧 · 2026-09-27 05:12 ✓）**

### 6.1 交付与验收（父侧逐舱亲跑 ✓）

- **交付** ✓：七舱全数落位（S1 核 9 档 / S2a cli 源 6 档 / S2b1 cli 测试 6 档 / S2b2 cli 测试 8 档 / S3a1 bench 源 6 档 / S3a2 bench 测试 9 档 / S3b vsc 测试 8 档）✓；另父侧直接执行两笔（`thincoder-cli/AGENTS.md:35` · `docs/RELEASE.md:119` 的 smoke 用法行 ✓）。
- **判据终局读数** ✓（**皆父侧亲跑**）：① 零残引 ✓（core / cli / bench 各树实扫 ✓）· ② **core 700/700 · cli 865/865 · vsc 1010/1010 · bench 116/116** ✓（exit 0 ✓）· ③ 行为等价（缝 / 键 / argv 三面 + 沙箱探针 ✓）· ④ doc-check 本批面零新增 ✓ · ⑤ **env 读取增量 0** ✓。
- **`doc-check` 终读** ✗：**悬空 48 · 行宽 18**（全为**他档存量** ✓·本批 authored 行零落 ✓ 已由收口轮逐 diff 核证 ✓）；**与早前同形读数（34）不一致** ✗ ⇒ **归因未证**（候选基数近同 ✓·非本批行面所致 ✓）⇒ 记入 **台账 #435** 并留 §6 观察 ✓——**不猜因、不改数** ✓。

### 6.2 结算（D7 清单 ✓）

- **台账**：**#437 核销** ✓（环境变量配置规则 → 本批落地 ✓）；**#438**（bin 499 贴硬限 ✓）· **#439**（两条覆盖缺口 ✓）在册 ✓。
- **本档冻结** ✓；角色表 / 状态行 / 计数 / 指针随动 ✓（§1 十四块 ✓ + 各舱 §5 ✓）。
- **未决项（在册 · 不静默）** ✗：① `bin/thincoder.mjs` **499/500 ⇒ 命令分发表外提须先于该档下次触碰** ✓（#438 ✓）；② 两条覆盖缺口（键面无自动化承重 · 慢例缺省形 ✓·#439 ✓）；③ `CORE-UNIFICATION` 行 14 / 子表行 3「待补拆分计划」与盘上既有预案相抵 ✗ ⇒ **另裁**（父侧笔域小改 ✓ 或另批 ✓）；④ **破坏性变更的用户面注记**（环境变量停止生效 ✓）⇒ 发版注记待落 ✗（`docs/RELEASE.md` 未列 ✓）；⑤ 现状注清理（失效表达留规范面 ✓）= 存量 hygiene 面 ⇒ **另批** ([#435](../../docs/core/design/…) 一族 ✓)。
- **设计槽** ✓：本批 `designId` 于链终点 `consume-design` 消费 ✓。

### 6.3 结语

**一句话** ✓：**四个包（core / cli / vsc / bench）的自有环境变量配置面**已**全部拔净** ✗ —— 17 名零残引 ✓·等价能力换成**配置键 / CLI 参数 / 进程内缝 / argv 门**四类 ✓·**用户 2026-09-27 裁定「不用环境变量做配置」在本仓落地** ✓。
