# 缺陷修复 · VSC 宿主 subagent spawn 全链断裂（agent.tools 未装配）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 用户 VSC 实跑报错（「vsc端spawn eng-designer时报错：agent.tools is not iterable」）+ VSC 侧挂账条目（`docs/TODO.md:41`）。
> **状态：已收口**（2026-09-15——修复单笔 `9a0ec8e4` · 反证红→绿闭环 · 全链绿：VSC 553/553 · 集成 33/33 · 核 178/178 · 三闸 0——详见 §6）。
> 规模 = **缺陷修复小批**（单笔 + 回归用例；不扩面——其他待办另批）。

## §1 讨论（主 agent）

### 1.1 问题（用户实测）

VSC 面板（Extension Development Host · 调试态实跑）内，**任何角色**的 `subagent` spawn 立即崩：

```
agent.tools is not iterable
```

⇒ 子代零产出、设计轮无法启动 ⇒ **工程模式在 VSC 宿主不可用**，且缺陷无法在 VSC 内自修（修它要 spawn eng-coder = 坏路径本身）。

### 1.2 影响面（实证）

- VSC 面板内 spawn **全角色皆崩**（两支形态——评审 #1 复核收正 2026-09-15）：explore / plan 崩于**只读过滤分支更早一步**（`readonlyToolNames` → `tools.filter` 无兜底）；其余角色（coder / eng-coder / eng-designer）崩于**子代装配展开** `[...agent.tools]`；**用户所见串 = 后者**（实测角色 = eng-designer——两支修复前均不可用，红面结论不变）；
- 连带阻断：VSC 侧在跑的 5 个批次（`docs/batches/2026-09-15-{core-defect-fixes,check-tooling-debt,eng-discipline-prompts,cli-async-discard,doc-contract-reconcile}.md`）设计轮全部起不来；
- 自动测试**未拦截**（553/553 全绿）——见 1.4。

### 1.3 根因链（父侧逐段独立实核）

| # | 环节 | 实证（file:line） |
|---|---|---|
| ① | VSC 顶层 agent 工厂**无 `tools` 字段** | `thincoder-vscode/src/agent/setup.mjs:300-324`（`buildTopLevelAgent()` 逐字段：`_tasks`/`_goal`/`_touchedFiles`/`config`… 无 `tools`）；全档 `agent.X = …` 赋值（`:519-528` · `:600-607` · `:653-657`）**无一处 `agent.tools`**；全仓 git 历史 `-S"agent.tools ="` = VSC 树**零命中**（该字段从未存在）⇒ `.tools` 恒 `undefined` |
| ② | 该 agent 被作为**父对象**交给核 spawn | `setup.mjs:361`（注册核 subagent 工具——`vscSubagentFace(subagentTool)`；工具面 = `@thincoder/core/agent-tools.mjs` 动态载入）；`agent/execute-tools.mjs` 以该 agent 为 toolCtx 载体 |
| ③ | 核 spawn 读 `parent.tools` | `thincoder-core/agent-tools/subagent-spawn.mjs:287-292`（explore/plan：`readonlyToolNames(parent.tools)` + `.filter`；其余角色：`tools = parent.tools`）⇒ 子代 `createAgent({tools: undefined})` |
| ④ | 子代首轮装配展开 `agent.tools` | `thincoder-core/agent/setup.mjs:293`：`const tools = [...agent.tools, taskTool, …]` ⇒ **TypeError**（用户所见报错逐字） |

**对照面（CLI 正常）**：`thincoder-cli/src/cli/make-agent.mjs:111-117` 显式 `createAgent({ tools: applyToolExclusions([...baseTools, ...mcpTools], excludeTools) })`；CLI 真跑路径 `thincoder-cli/src/tui/startup.mjs:218` 即 `agent.tools.map(...)` ⇒ CLI 的 agent 对象确有该字段。

**回归引入点**：W13（`c38dada0`）把 VSC spawn 面换核到 `@thincoder/core` 单源——换核后核侧读 `parent.tools`，而 VSC 宿主工厂从未提供该字段（旧 VSC 自持 spawn 用自持工具表、不读 `agent.tools`）⇒ 换核即断。其夹具注（下）自证当时已知该读点。

### 1.4 为什么自动测试没拦住（夹具替宿主补了缺字段）

- `thincoder-vscode/test/integration/scenario-02-eng-chain.test.mjs:77` 手工塞 `tools: []`（原注逐字：「W13：子代理装配读 parent.tools（真跑夹具——无工具子代理仅报报告）」）；
- 同型：`test/eng-designer-role.test.mjs:57` · `test/integration/scenario-03:58` · `test/subagent-audit-summary.test.mjs:33` 均以 `tools: []` 起父对象；
- ⇒ 夹具**从未使用生产宿主形状**（`buildTopLevelAgent()` 产物）⇒ 集成测试绿、真机全炸。

### 1.5 修复方向（父侧裁定 · 交 §2 出任务书）

**取「VSC 宿主补装配」单点**：`hydrateRun`（`setup.mjs`）在每轮 B 类绑定处补 `agent.tools = tools`（= 本档已建的工具数组，`:408` 起）——覆盖全部核侧读点（spawn 的 `parent.tools`、子代装配展开、核 MCP 辅助面）。

- 备选（核侧容错 `agent.tools ?? []`）**否决**：会让子代**静默无工具**（比崩更糟——缺陷隐形化）；且核侧语义正确（父必须有工具表），缺陷在宿主。
- 必有面：① 生产宿主形状的**回归用例**（反证：拆除现有夹具 `tools: []` 补丁 ⇒ 必红；修复后 ⇒ 必绿）；② **全角色 spawn 冒烟**（explore / plan / coder / eng-coder / eng-designer 各一路，或按 §2 判据等价面）；③ 文档收正（VSC 模块权威档 + W13/W15 相关行）。

### 1.6 范围边界

只修此一处 + 其回归/冒烟面 + 对应文档行；**不带**任何其他待办（核内笔/文档维护批/技术待办均不动）。

## §2 批次任务（eng-designer）

> 父侧代写落档（源 = eng-designer 本席报告附录，**逐字**；写通道因骨架缺失 fail-closed——补骨架后由父侧落档，零加工）。

**依据** = 本档 §1（父侧逐段实核）；**本席复核** = 直读取证（零 explore 委派——勘察预算未用）——根因链 ①–④ 逐点一致、修复方向复核成立、兜底条件未触发（见 2.1 D）。
**文档收正** = 已由本席落盘（坐标 = 2.7；落盘后三闸 + VSC 域 doc:check 复跑全绿）——实施笔（§5）**零重复触碰**这两档。
**任务项 ↔ 落点映射**：任务项 1 → 2.1；任务项 2 → 2.2/2.3 + AC1/AC2/AC6；任务项 3 → 2.4；任务项 4 → 2.7 + AC7；任务项 5 → 2.5 + AC3–AC5；任务项 6 → 2.8 + AC8。

### 2.1 修复点（唯一生产改动——精确化）

| 项 | 内容 |
|---|---|
| 文件 | `thincoder-vscode/src/agent/setup.mjs`（现 681 行） |
| 落点 | `hydrateRun` B 类 run 绑定区（:518–:528）；建议 = `agent._provider = provider`（:521）之后 |
| 改动 | 新增一行 `agent.tools = tools`（附一行注释注记：核 spawn 父对象读点——每轮重指） |
| 引用源 | **同一引用** = 上文工具装配面 `const tools = [...]`（:408–:414：baseTools + readImage? + agentTools + mcpTools + opts.extraTools）——直接引用，不做拷贝 |
| 语义 | B 类 run 绑定：复用 agent 每轮重指（不残留上轮引用）——与 `_role`/`_provider` 同区同语义 |

**A 核侧读点覆盖（单点覆盖——逐点实核）**

| # | 读点 | 坐标 | 修复后语义 |
|---|---|---|---|
| ① | spawn 角色过滤 / 直传 | `thincoder-core/agent-tools/subagent-spawn.mjs:287-292` | explore/plan = `readonlyToolNames(parent.tools)` 过滤；其余 = `parent.tools` 直传 |
| ② | escalate（sync + async 两路） | `thincoder-core/agent-tools/subagent-actions.mjs:405` · `thincoder-core/agent-tools/escalate-async.mjs:192` | `tools: parent.tools`——同链同值 |
| ③ | 子代装配展开 | 核 `agent/setup.mjs:293`（`[...agent.tools, …]`） | 子代 `.tools` 由核 `createAgent`（核 `agent.mjs:57-64`）落值——父表非空 ⇒ 子代非空 |
| ④ | 容错读数面 | 核 `config.mjs:375` · `consult.mjs:269-271`（`?? []` 形态） | 由空表变真表——consult 子代恢复 CLI 同序只读工具面（同根因派生面，零额外改动） |

**B 相互影响实核（无）**：`vscSubagentFace` = 数组构造期一次性装饰（`setup.mjs:360`）——与绑定零交互；绑定不触发注册 / 重排（工具注册面 = 数组构造本身）；`agent.mjs` 调用期载体回填（`:394-406`）面 = provider / tasks / planMode / goal / _onTaskUpdate——**不含 tools**（本单点不与任一面竞争）。

**C 候选对比（单方向声明 + 复核）**

| # | 候选 | 判据 | 结论 |
|---|---|---|---|
| 1 | hydrateRun B 区补绑定 | 生产侧单点；覆盖 A 表全部读点；CLI 对位（`thincoder-cli/src/cli/make-agent.mjs:111-117` 显式 tools） | **选定** |
| 2 | 工厂初值 `tools: []` | 崩前可过——但水合前空表谎报「有工具」、子代拿空表 = 静默无工具 | 否决 |
| 3 | 核侧容错 `agent.tools ?? []` | 子代静默无工具（缺陷隐形化）；核语义正确（父必有表）——照 §1.5 | 否决 |

**D 兜底判据（未触发）**：VSC 顶层 agent 装配单点实核——`buildTopLevelAgent` 消费者 = `setupAgentRun`（`setup.mjs:679`）与 `agent.mjs:105-109` hydrate 复用路径（面板回合 / 续跑 / 直连 / destroy 重建同路径）；无第二父对象来源。

### 2.2 回归用例（硬项——生产宿主形状 + 反证面）

**新档** = `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`；**必须登记** `test/integration/files.mjs`（漏登记 = run-integration 启动自检 fail——`run-integration.mjs:45-47`）。
**驱动面 = 生产宿主形状**：`hydrateRun(buildTopLevelAgent(), { provider, cwd, input, depth: 0, role: null, getAuto, opts: {} })` 产物作父对象——装配面 = 修复点本体；测试**零手写 tools 字段**（修复行移除即红 = 测试有效性机判面）。
生产面调用期载体照搬（测试无法驱全 runAgent；两处同源照搬、非修复面——① `agent.provider = provider`（`agent.mjs:402` 同款——核 `resolveChildProvider` / `resolveAdvisorProvider` 读 `parent.provider`）；② async 池面（如需）：`agent._asyncSubagents = new Map()` + `agent._asyncQueue = []`（现 scenario-02 夹具同款载体行））。
夹具骨架参照 scenario-02 `before/after`（`_setConfigPathForTest` 沙箱 + 临时 cwd）；mock provider = `test/integration/helpers/mock-llm.mjs`（本地 SSE 零外网）；子代报告 ≥ MIN_REPORT_CHARS（防续写轮——scenario-02 同款重复句）。

| 例 | 形态 | 断言（机判） |
|---|---|---|
| T1 | explore（结构） | 父 `Array.isArray(parent.tools) && parent.tools.length > 0`；`buildSpawnChild` 产物 `child.tools` = 数组、非空、且 `child.tools !== parent.tools`（只读过滤生效） |
| T2 | coder（结构） | `child.tools === parent.tools`（非只读分支直传）+ 非空数组 |
| T3 | eng-designer（结构——用户实测角色） | 工程父（`opts.engState = {enabled: true}`）+ 可读 batchDoc；`child.tools` 非空数组 + `child._batchDoc` = 绑定路径绝对值 |
| T4 | explore（行为——用户报错路径） | mock provider 真跑 `subagentTool.execute({ task, role: "explore", async: false }, ctx)` 正常返回报告（修复前逐字崩 `agent.tools is not iterable`）；`llm.calls ≥ 1` |

**反证（判据落 §5 复跑链——原样读数 + 实验后恢复现场）**：
① 临时拆修复行（`agent.tools = tools` 注释化）⇒ 新档红（T4 = 用户报错逐字复现）；恢复 ⇒ 全绿。
② 转换后 scenario-02 同法拆修复行 ⇒ 其 spawn 例红（子代装配 `[...agent.tools]` 崩）；恢复 ⇒ 绿。
③ 未转换的 3 处手工夹具（`eng-designer-role:57` · `scenario-03:58` · `subagent-audit-summary:33`）：如实登记「无守卫能力」——其 `tools: []` 为确定性补丁（拆补丁恒红、修复后亦红 ⇒ 不构成反证面；评估表见 2.3）。
④ §5 记录命令与输出行原样（含实验后恢复的复跑绿）。

### 2.3 夹具评估（4 处——逐处处置）

| # | 夹具 | 处置 | 依据 |
|---|---|---|---|
| 1 | `test/integration/scenario-02-eng-chain.test.mjs:77` | **改 = 生产宿主形状派生**（`engParent` 异步化：hydrateRun 产物 + 载体行两处照搬；拆 `tools: []` 补丁） | §1.4 根因（夹具替宿主补字段）；本批反证面载体；eng-coder 真跑链即成守卫 |
| 2 | `test/eng-designer-role.test.mjs:57` | 保留 | 单元域门 / 枚举 / 装配探针（零网络）——`tools: []` 为确定性最小假件；守卫由新档承担 |
| 3 | `test/integration/scenario-03-subagent-lifecycle.test.mjs:58` | 保留 | 生命周期主体（spawn→settle→报告）；转换收益 = 守卫重复、成本 = 水合 / 载体复杂度上升 |
| 4 | `test/subagent-audit-summary.test.mjs:33` | 保留 | 纯装配单测（A2 摘要文本面）——父对象 = 摘要输入载体，与工具表无关 |

（同类回潮防护判据 = 拆修复行 ⇒ 至少一面红——即新档 + 转换后 scenario-02。）

### 2.4 冒烟面（角色覆盖——核 spawn 门序）

| 角色 | 路径 | 说明 |
|---|---|---|
| explore | T1（门序+装配）+ T4（真跑） | 只读分支 |
| coder | T2（门序+装配） | 非只读分支 |
| eng-designer | T3（门序+装配） | 工程装配 + batchDoc 绑定 |
| eng-coder | 转换后 scenario-02 既有例（token 链真跑 sync + async） | 生产形状父对象 |
| plan | 不加例——与 explore 同过滤分支（T1 已覆盖该分支） | 如实声明 |

门族调用形态 = `gateEngCoderSpawn(parent, 0, role, false)` + `buildSpawnChild`（承 `eng-designer-role.test.mjs:64-67` buildProbe 先例：真门序 + 真绑定，零网络；depth-0 下 gate 恒返回 null——门面为空、装配面为实）。

### 2.5 验收判据（可机器验证——逐条回指任务项）

| # | 判据 | 读数 / 命令 | 回指 |
|---|---|---|---|
| AC1 | 新档全绿 + 登记在册 | `npm run test:integration` ⇒ 29/29/0 → **29+N / 29+N / 0**（N = 新档例数 = 4；scenario-02 例数不变） | 任务项 2 |
| AC2 | 反证红面实证 | §5 原样记录（2.2 反证 ①②）——拆修复行 ⇒ 红；恢复 ⇒ 绿 | 任务项 2 |
| AC3 | 零回归（VSC 五命令：`npm test` · `npm run lint` · `npm run test:full` · `npm run test:integration` · `npm run doc:check`） | 553/518/0/35 · 193 JS OK · 553/553/0 · 见 AC1 · 0 命中 | 任务项 5 |
| AC4 | 核回归 | `node --test`（cwd = `thincoder-core`）178/178/0（核零改动） | 任务项 5 |
| AC5 | 仓根三闸（宽度 · 台账 · 锚） | 0 行超 · 0 违规 · 0 悬空——**本席基线实跑 = 全绿**；终态复跑零新增 | 任务项 5 |
| AC6 | 夹具处置落地 | 2.3 表 1 已转换（无 `tools: []`、无手写 tools 赋值）；表 2/3/4 保持现值 | 任务项 2 |
| AC7 | 文档收正 | 2.7 两落点（VSC 侧 + 核侧）已落 + §5 提交含之 | 任务项 4 |
| AC8 | 边界 | 见 2.8（核 / CLI / 台账 / 他段零触碰；单笔提交） | 任务项 6 |

**读数基线（本席实跑 · cwd = 仓根）**：① `check-doc-width` → 410 文件零超 + V1/V2/V3 新增 0；② `check-ledger` → 0 违规；③ `doc-anchors --domain .` → 0 悬空；VSC 域 `doc:check`（strict）→ 0 命中。
（测试面基线值 = 上批收口读数：VSC 553/518/0/35 · 553/553/0 · 29/29/0 · 核 178/178/0——§5 以开工实测复核。）

### 2.6 受影响文件表（R24a）

| # | 文件（cwd = 仓根） | 现值 | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/agent/setup.mjs` | 681 | +2（≤+5） | B 区补 `agent.tools = tools`——**唯一生产改动**（>500 硬限 = 既有登记——承 R3/W12/W14–W17 判例「登记不升级」） |
| 2 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | 新 | ~+130–170 | 生产宿主形状回归用例（新档） |
| 3 | `thincoder-vscode/test/integration/files.mjs` | 18 | +1 | 清单登记（漏登记 = 启动自检失败） |
| 4 | `thincoder-vscode/test/integration/scenario-02-eng-chain.test.mjs` | 198 | ~+10–20（净） | `engParent` 改生产宿主形状派生（拆 `tools: []`） |
| 5 | `thincoder-vscode/docs/design/AGENT-LOOP.md` | 1573 | **已落**（1572 → +1） | §11.2 B 列（:464）+ 变更记录（:41）——本席 |
| 6 | `docs/core/design/AGENT-LOOP.md` | 502 | **已落**（501 → +1） | §6.18 #83 行（:394）+ 变更记录（:501）——本席 |

### 2.7 文档收正（已落——本席；实施笔零重复触碰）

1. **`thincoder-vscode/docs/design/AGENT-LOOP.md`**（1573 行）：① §11.2 B 类绑定清单（:464）补 `tools`（每轮绑定工具表——核 spawn 父对象读点 `parent.tools`）；② 变更记录（:41 首行）= 2026-09-15 缺陷修复条目（含批次档指针）。
2. **`docs/core/design/AGENT-LOOP.md`**（502 行）：① §6.18「自持工具登记面（#83）」行（:394）补「同装配面每轮绑定 `agent.tools`」事实句；② 变更记录（:501）= 同题条目。
（凭证值零落档；落盘后回读核对 + 三闸 / doc:check 复跑——读数见 2.5。）

### 2.8 边界与交付链

- **改动面** = 生产改动 1 处 + 测试面（新档 1 + 清单 1 + scenario-02 转换）+ 文档面 2 档（VSC 侧 + 核侧，已落）。
- **零触碰**：`thincoder-core/**`（只读核对）· `thincoder-cli/**` · 台账 `docs/TODO.md` · 旧树 `_retired-thincoder-vscode` · 本档 §1 / §3–§6。
- **单笔提交**：含本批全部改动（生产 + 测试 + 两权威档——后者为设计师已落内容）；批次档本体不入笔（父侧统一）；回退点 = 单笔 revert。
- **施工者写入手段** = `batch_segment({ segment, text })`（无路径参数，段号由身份定）；**兜底** = 任何时点发现 hydrateRun 非唯一父来源 / 载体行不足以稳定驱动 ⇒ 停下报告，不自行扩面。
- **UI/交互** = 无面（装配层修复——webview / 交互 / 面板零触碰）。
- **发现（随批报告——不静默）**：① 核权威档 `docs/core/design/AGENT-LOOP.md`（§9 体量行）自报 493 行 vs 实读 **502 行**——读数滞后（若 500 硬限适用文档 = 已越限；拆分 = 父侧裁定面，非本批扩面）；② consult 子代工具面随修复恢复（同根因派生面——如实登记）；③ 未转换 3 夹具保持遮蔽形态（评估在案）。
- **评审就绪自检（A3）**：① 修复点精确到 file:line ✓ ② 受影响文件 + 行数标注（R24a）✓ ③ 验收逐条回指（AC 表）✓ ④ UI/交互无面声明 ✓ ⑤ 方案对比（含否决理由）✓。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 本档 §1（问题/根因链）+ §2（任务书：修复点 · 回归用例与反证面 · 夹具处置 · 冒烟 · AC1–AC8 · 边界）；另读 `thincoder-vscode/docs/design/AGENT-LOOP.md`、`docs/core/design/AGENT-LOOP.md` 全档。
**定点取证**（判据 8 行数 + 设计自点名坐标）：VSC setup.mjs 681 · files.mjs 18 · scenario-02 198 · VSC 档 1573 · 核档 502；
核 `agent-tools/subagent-spawn.mjs:287-293` · `agent/helpers.mjs:315-317` · 核 `agent/setup.mjs:293` · 核 `agent.mjs:57-64` · VSC `agent.mjs:394-407` · `agent-state.mjs:87-95` · `consult.mjs:269-271` · `config.mjs:375` ·
夹具四处（scenario-02:77 / eng-designer-role:57 · 64-67 / scenario-03:58 / subagent-audit-summary:33）——§2.1 A 表读点、§2.6 行数、§2.7 两落点均复核在位。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements / 证据准确性 | 🟡 | §1.2 记「全角色（explore/plan/coder/eng-coder/eng-designer）同错——逐字同一报错」（:22），§2.2 T4 又以 explore 为「用户报错路径」并注「修复前逐字崩 `agent.tools is not iterable`」（:107）、反证①同口径（:110）。实读核源：explore/plan 走只读过滤分支（`thincoder-core/agent-tools/subagent-spawn.mjs:289-290`），`readonlyToolNames` = `tools.filter(...)`（`thincoder-core/agent/helpers.mjs:315-317`）无兜底 ⇒ 修复前 explore/plan 在更早一步崩 `Cannot read properties of undefined (reading 'filter')`；用户所见串来自非只读分支的子代装配展开（`thincoder-core/agent/setup.mjs:293`），与用户实测角色 eng-designer（:5）同支。对照 consult 走 `agent.tools ?? []`（`thincoder-core/agent-tools/consult.mjs:269-271`）故不崩。 | 修正 §1.2 口径（两支崩点/串不同）；反证①的「逐字复现用户报错」例改用非只读角色（coder，或实测角色 eng-designer），explore 留作 T1 过滤分支结构例；§5 如实记录两支实际报错串（红面结论不变）。 |
| 2 | Affected-file size | 🟡 | `thincoder-vscode/src/agent/setup.mjs` 实读 681 行（与 §2.6 :158 标注一致）——>500 硬限、本批再 +2、设计未附拆分计划，仅以「既有登记——承 R3/W12/W14–W17 判例『登记不升级』」承接；该判例本体不在本评审可读面（未复核）。判据 8 硬限口径（>500 带拆分计划）与 R3「不重开既有裁定」字面冲突。 | 非阻塞（按 R3 不重开）。建议 §2.6 该行落既有登记的坐标指针（如 VSC 档变更记录 2026-09-08「setup.mjs 500 行边缘（挂 TODO 拆）」`thincoder-vscode/docs/design/AGENT-LOOP.md:61`）或 §2.8 挂「拆分另批」条目，使拆分面有可追落点。 |
| 3 | Affected-file size / 数字漂移 | 🔵 | 核档实读 502 行，其 §9 自报 **493**（`docs/core/design/AGENT-LOOP.md:466`）——读数滞后；本批 +1 落于已越限档（§2.6 :163「501 → +1」）。设计已如实登记（§2.8 发现① :178）并交父侧裁定。 | 保持登记（R7c 数字漂移=报告面）；建议变更记录顺带把 §9 自报值改为实读值或标注口径，防下批复用旧基线。 |
| 4 | Document ownership / 方法论 | 🔵 | 两档收正由设计者先落（`thincoder-vscode/docs/design/AGENT-LOOP.md:464` / `:41`；`docs/core/design/AGENT-LOOP.md:394` / `:501`——均复核在位），顺序 = 文档先于实现；AC7（:148）只判「已落 + §5 提交含之」，不判实现落点与文档措辞一致。 | §5 收口加一句机械核对（实现落点 = hydrateRun B 区每轮重指，与落地句一致）；不一致先改文档再收，防文档先行的措辞漂移。 |
| 5 | Acceptance criteria 可机判性 | 🔵 | AC3（:144）五命令读数并排为无标签串「553/518/0/35 · 193 JS OK · 553/553/0 · 见 AC1 · 0 命中」——命令↔读数靠顺序推断（命令表见 `thincoder-vscode/package.json:123-127`）。 | 改逐命令一行（命令 \| 期望读数 \| 实测留白）供 §5 直填，避免机判错位。 |
| 6 | Clarity / 可追溯 | 🔵 | §2 映射行与 AC 回指列（:62、:142-149）引用「任务项 1..6」，正文未编号列举；任务项 3（§2.4 冒烟面）无对应 AC（仅经 AC1 用例数间接覆盖）。 | §2 头部补 6 项任务索引（或回指改节号）；§2.4 门面并入 AC 回指。 |
| 7 | Feasibility / 覆盖枚举 | 🔵 | §2.1 A 表称「单点覆盖——逐点实核」（:76-81）未列核内 `agent.tools` 的非容错读与写：`thincoder-core/mcp.mjs:270` / `:287`（`for (const t of agent.tools)`）、`:294`（`agent.tools = keep`）。单点绑定同样覆盖（读得真表、写由每轮重指复位），但表未列；VSC 是否触达该段未追踪（未核）。 | A 表补该三点 + 一句不可达/复位注（零成本，防后续误读为遗漏）。 |
| 8 | 回归网位置（Scope） | 🔵 | T1–T3 零网络结构例只落集成档（§2.2 :98）——`npm test` 快层对本缺陷类仍无守卫（本缺陷正于「553/553 全绿」漏网，:24/:43）；快层已有直驱 hydrateRun 先例（`thincoder-vscode/test/agent-lifecycle-singleton.test.mjs:272`、`test/context-parity.test.mjs:72`）。 | 可选：T1/T2 另置快层一例；不改亦满足 §1.5①（集成档守卫已在）。 |
| 9 | 评审面限制 | 🔵 | 本轮无项目标准档 / 无文档地图声明 ⇒ 方法论合规与文档归属按 AGENTS.md + 通用判据降级判定；归属结论仅覆盖本评审可读面（批次档 + 两 AGENT-LOOP 档），未跨档全扫。 | 如父侧存档，可把归属判定升级为机检；本批两落点经复核落在既有 owner 档、未新增档、未发现机制级（同机制两处不同述）矛盾。 |

**计数**：发现 9（🔴 0 · 🟡 2 · 🔵 7）——无阻塞项。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

### 5.1 交付摘要

- 单笔提交 = `9a0ec8e4`（`fix(vsc): bind agent.tools in hydrateRun - restore subagent spawn (regression)`），6 档：生产 1 + 测试 3 + 设计文档 2（后者为设计者已落内容，随单笔入库）。
- 唯一生产改动 = `thincoder-vscode/src/agent/setup.mjs:522-523`：注 + `agent.tools = tools`（hydrateRun B 类绑定区，紧接 `:521` `agent._provider = provider`；引用 `:408-414` 同一数组、不拷贝——每轮重指语义）。
- 测试面 = 新档 `test/integration/host-shape-spawn.test.mjs`（4 例）+ `test/integration/files.mjs:18` 登记 + `test/integration/scenario-02-eng-chain.test.mjs` `engParent`（:67）生产宿主形状化。
- 行数口径（read 显示行＝尾行空行计入；内容行＝显示行−1）：setup.mjs 683（内容 682）· scenario-02 197（内容 196）· 新档 125（内容 124）· files.mjs 20（内容 19）。

### 5.2 验收逐条（AC1–AC8）

| AC | 结论 | 读数 / 证据 |
|---|---|---|
| AC1 | ✅ | `npm run test:integration` ⇒ tests 33 / pass 33 / fail 0（29+N，N=4）；`files.mjs:18` 登记在册（启动自检通过） |
| AC2 | ✅ | 反证红/绿原样读数见 5.3（拆行 ⇒ 新档 4/0/4 红 + scenario-02 3/1/2 红；恢复 ⇒ 4/4 + 3/3 绿） |
| AC3 | ✅ | fast 553/518/0/35 · lint 194 JS OK（基线 193，+1 新档）· full 553/553/0 · integration 见 AC1 · doc:check 命中 0 |
| AC4 | ✅ | 核 `node --test`（cwd = thincoder-core）⇒ tests 178 / pass 178 / fail 0——核零改动 |
| AC5 | ✅（零新增；基线例外一项见 5.6） | 台账 = 0 处违规；锚 `--domain .` = OK(V5) 0 条悬空；宽度 = 基线同值 1 行超（`docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md:186`，450 字符——§3 评审段行、开工前即在、非本批写域） |
| AC6 | ✅ | scenario-02 与新档零手写 `tools` 赋值（grep 实核）；三夹具原样在位：`eng-designer-role:57` · `scenario-03:58` · `subagent-audit-summary:33`（均 `tools: []`） |
| AC7 | ✅ | 两档落点在位（VSC `docs/design/AGENT-LOOP.md:464`+`:41`；核 `docs/core/design/AGENT-LOOP.md:394`+`:501`），措辞与实装一致（5.5），随单笔提交入库 |
| AC8 | ✅ | `git commit --only` 单笔 6 路径；核 / CLI / 台账 / 本档 §1 §3 零触碰；批次档不入笔（父侧统一） |

### 5.3 反证实验（原样读数）

拆行实验（`agent.tools = tools` 注释化；实验后已恢复——终态净 diff = +2 行）：

- 新档 `node --test test/integration/host-shape-spawn.test.mjs` ⇒ `tests 4 / pass 0 / fail 4`；T4 失败行逐字：`TypeError: agent.tools is not iterable`（用户报错逐字复现）；T1–T3 均红（父表非空/子代表断言首触即红）。
- scenario-02 ⇒ `tests 3 / pass 1 / fail 2`——两 spawn 例（正常/边界）红（同串）；无 token 例（拒在装配前）保持绿。
- 只读分支（explore/plan——修复前更早一步崩）探针原样：`parent.tools = undefined`；`TypeError: Cannot read properties of undefined (reading 'filter')`，栈 `readonlyToolNames (thincoder-core/agent/helpers.mjs:316:24)` ← `buildSpawnChild (thincoder-core/agent-tools/subagent-spawn.mjs:289:21)`。
- 两支报错串如实分列：非只读支（coder / eng-coder / eng-designer——用户实测角色同支）= `agent.tools is not iterable`；只读支（explore/plan）= `Cannot read properties of undefined (reading 'filter')`——与 §3 评审 #1 口径一致。
- 恢复后复跑：新档 4/4 绿、scenario-02 3/3 绿（全部读数落盘 `.thincoder/tmp/W18-t-*.log`）。

### 5.4 复跑链（终态读数）

| # | 命令 | 终态读数 |
|---|---|---|
| 1 | VSC `npm test` | 553/518/0/35 |
| 2 | VSC `npm run lint` | 194 JS files OK |
| 3 | VSC `npm run test:full` | 553/553/0 |
| 4 | VSC `npm run test:integration` | 33/33/0 |
| 5 | VSC `npm run doc:check` | 命中 0 处 |
| 6 | 核 `node --test` | 178/178/0 |
| 7 | 仓根 `check-doc-width` / `check-ledger` / `doc-anchors --domain .` | 1 行超（基线同值）· 0 违规 · 0 悬空 |

（长测试输出全部先落盘再读：`.thincoder/tmp/W18-f-*.log`。）

### 5.5 父侧裁决落地

- **裁决①（T4 角色改 coder）**：已落——`host-shape-spawn.test.mjs:117/:121` 用 coder；explore 保留 T1 结构例。**偏差如实记录**：§2.2 T4 行字面仍为 explore、§2.4 冒烟表把 explore 真跑面记在 T4——改向后 explore 真跑面无例承载（其只读过滤分支由 T1 结构面覆盖）；文档层收正（§2.2/§2.4 行与 §3 #1 口径对齐或明标让位）归设计者/父侧写域，本批对 `docs/batches/**` 零触碰。
- **裁决②（文档-实现一致性）**：核对通过、无需上抛——实装 = hydrateRun B 区每轮重指 `agent.tools`（同引用不拷贝），与 VSC `docs/design/AGENT-LOOP.md:464`「tools（每轮绑定工具表——核 spawn 父对象读点 parent.tools）」及核 `docs/core/design/AGENT-LOOP.md:394`「同装配面每轮把装载后的工具表绑定到 agent 对象」逐面一致。
- **裁决③（核 mcp 读点可达性）**：**VSC 路径不可达**——VSC 端壳 `closeAllMcp` = `src/extension/panel-mcp.mjs:100`
  （按核 `_sessions` 注册表断开，不读 `agent.tools`；`panel-mcp.mjs:17` 自核 mcp.mjs 仅取 connectMcpServer / probeMcpServer / _sessions）；
  核 `mcp.mjs:270` / `:287` / `:294` 调用点全在 CLI（`thincoder-cli/src/tui/index.mjs` · `cmd-mcp.mjs`），VSC 零调用。
  补注：即便触达，单点绑定使其读得真表；`:294` 写（`agent.tools = keep`）由下一轮重指复位。

### 5.6 发现与例外（随批报告——不静默）

1. **宽度闸基线例外**：开工实测 = 1 行超（`docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md:186`，450 字符；§3 评审段行——评审落笔晚于设计者基线）；终态同值 ⇒「零新增」成立、「0 行超」不成立。处置 = 父侧/文档层折行（本批对该档零触碰）。
2. **行数预测差（口径归一）**：scenario-02 现 197 显示行（内容 196）⇒ 净 −1 vs §2.6 预测「~+10–20 净」——预测未中（不触阈值，登记）；setup.mjs 683 显示行 = 预测 683 一致（内容行口径 682——评审对「差 1」的计数系口径伪差）。
3. **锚闸口径**：仓根无域参命令并入 CLI 域（`thincoder-cli/docs` 37 条 V5-A 悬空——基线既有、非本批面；设计者口径 = `--domain .`）。终态 `--domain .` ⇒ 0 悬空。
4. **同族字段面登记（越批）**：VSC 宿主对象同不含 `autoApprove`（grep 零赋值），而核 spawn/scheduler 族以 `parent.autoApprove` 为读点——是否有 `ctx.getAuto` 等价承接未核（unverified）；属 §1.6 边界外，供父侧裁量。
5. **setup.mjs 越限登记债**：682 内容行 > 500 硬限——承接 R3/W12/W14–W17 判例「登记不升级」（§2.6 :158 已登记）；本批净 +2 行未改变档位，拆分 = 另批面。

### 5.7 自含交付协议（审计 + 代码评审——轮次与终态）

- 偏差审计（explore）轮 1 = **clean**：四类偏差均未发现；定点核对全过（夹具面 / 断言对表 / 文档一致性 / 超清单 / 反证链成立性 / 冒烟面 / 边界）。
- advisor 代码评审轮 1 = **pass**（0🔴 · 3🟡 · 3🔵）；应对表见交付报告——其中「§5 记录」项与行数项已于本篇落地，其余 3 项 Deferred（登记债 / 先例形态 / 保真登记，均非阻塞）。
- 终态 = **clean**（0 修正轮；无未决 🔴）。

### 5.8 §5 段内格式修正（越声明域披露）

- 事实：§5 首次落段后自查宽度闸发现本席段内一行 374 字符（5.5 裁决③ bullet，原 :255）> 300。
- 处置：对该行做**纯折行**（一条 bullet 折为 4 行；语义逐字不变、零内容增删）；写入手段 = 直接编辑本档——**在本席声明的 files 写域之外，如实披露**（唯一改动对象 = 本席自己段内的一行；§1–§4 / §6 与 :186 行零触碰）。
- 依据：宽度闸「零新增」= AC5 硬项；段内自纠不涉他人文本。复跑读数：`check-doc-width` ⇒ 1 行超（仅 :186——§3 评审段行、基线同值）· 台账 0 违规 · 锚 `--domain .` 0 悬空。

## §6 验证与收口（父代理）

**状态：已收口**（2026-09-15 · 修复单笔 + 反证闭环 + 全链复跑 + 设计凭证终消费）。

### 6.1 交付总账
- **单笔提交** = `9a0ec8e4`（6 档 · +152/−24）：`setup.mjs` +2（修复行 `:522-523`——B 区 `agent.tools = tools`，同引用每轮重指）· `host-shape-spawn.test.mjs` 新档 124 行（4 例）· `files.mjs` +1（登记）· `scenario-02` ±43（生产形状派生——`tools: []` 补丁拆净）· 两档文档（设计者已落内容）各 ±3。
- **反证闭环（原样）**：拆修复行 ⇒ 新档 `4/0/4`（T4 逐字 `agent.tools is not iterable`）+ scenario-02 `3/1/2`；恢复 ⇒ 新档 `4/4` + scenario-02 `3/3`。只读分支探针逐字 = `Cannot read properties of undefined (reading 'filter')`（`helpers.mjs:316` ← `subagent-spawn.mjs:289`）——两支分列在案（§5.3）。

### 6.2 终态全链读数（冻结态）
VSC `npm test` 553/518/0/35 · `test:full` **553/553/0** · `test:integration` **33/33/0**（29+N）· `lint` **194 JS OK** · `doc:check` 0 命中 · 核 `node --test` **178/178/0** · 仓根 宽度 **OK**（父侧折行后）· 台账 **0 违规** · 锚 **0 悬空**。

### 6.3 验收对照（AC1–AC8）
AC1 33/33/0 ✓ · AC2 反证红/绿原样实证 ✓ · AC3 五命令零回归 ✓ · AC4 核 178/178 ✓ · AC5 三闸 ✓ · AC6 夹具处置（1 转换 + 3 保留）✓ · AC7 文档收正 + 入提交 ✓ · AC8 边界（一处披露：§5 段内自纠折行）✓。

### 6.4 评审发现裁决落地（9 项）
Fixed+Dispatched #1（口径收正 + T4=coder + 两支串留证）· Deferred #2/#3/#8（R3 登记 · 数字漂移随下次触碰 · 快层增强可选）· Dispatched #4/#7（文档-实现一致性核对**通过** · 核 mcp 读点 **VSC 不可达**结论在案）· Not an issue #5/#6/#9。

### 6.5 未决/移交
① 核档 §9 自报 493 vs 实读 502——随下次文档面触碰收正；② `setup.mjs` **683** > 500 硬限——既有登记（`docs/TODO.md:49`），拆分另批；③ CLI 域锚 37 悬空（基线既有 · 非本批 · CLI 零触碰）；④ VSC 侧挂账条目（`docs/TODO.md:41`）可转已核销（证据 = 本笔）；⑤ `autoApprove` VSC 宿主零赋值候选（同族 · unverified · 供后续裁量）。

### 6.6 收口动作
- 档头状态行 ✓ · 设计凭证终消费（`consume-design`）✓
- 本档提交（父侧统一）：记录面单笔随收口推送

**收口裁定**：修复生效（用户实测面 = VSC 宿主 spawn 全角色）+ 反证闭环 + 全链零回归 ⇒ **通过**。
