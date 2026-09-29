# 2026-09-29 · parity-b7-minor
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 三端对位收编 §2 归批表 B7（小面可选族）+ 用户「都处理」令。
> 台账 = #571（desktop ∕ vsc · 归批）。前情 = `docs/batches/2026-09-29-parity-closeout.md` §2 归批表 B7（annex :36 ∕ :106 ∕ :115 ∕ 反⑦）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（B7 四项（:36 ∕ :106 ∕ :115 + 反⑦）逐项实读裁定在册：做 5 ∕ 留端 2 ∕ 锁 1；波划分四波；评审范围清单 8 条；修正轮 1+2 落地（评审 #142 九条全收 ∕ #152 五条全收）；W4 文档收正轮（D 舱）六处收正 ∕ 读回（详 §2 W4 记录））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**（设计轮交付 · parity-b7-minor · 2026-09-29 · eng-designer）**

### 2.0 交付形态与口径（设计轮 · 零实施）

- 本批 = **设计轮（立任务书 + 设计 · 评审就绪）**：交付 = 本节自持（先例 = B1 §2.0 ∕ B2 §2「设计 = 本节自持」）；**产品码 ∕ 测试码 ∕ 评审零触**；实施归后续派单（波划分见 2.4）。
- 行坐标 = 来源批档：`docs/batches/2026-09-29-parity-closeout.md` §2 归批表 B7 行（覆盖 = annex `:36` ∕ `:106` ∕ `:115` + 反⑦ `:184`）；annex = `docs/batches/2026-09-28-flow-vsc-align-annex-inventory53.md`。路径略记：core=`thincoder-core/` · desk=`thincoder-desktop/` · vsc=`thincoder-vscode/` · cli=`thincoder-cli/` · rc=`thincoder-render-core/`。
- 证据：**本席实读**（2026-09-29 11:4x–12:1x，read ∕ grep ∕ glob）；「批档」= 引自批记录（未逐条复勘）。行数 = 届读引用值（read 口径；实施轮按届盘重锚——项目既定口径）。
- 前置在册（届盘已收）：B1–B5 均已收口（各档 §6）；B1 §2.5-A2 载位（`.cursor/rules` 常驻集尾块）自注「判据面属 B7」——本批承接（2.2.3）。
- 边界：B8 ∕ B9 ∕ B10 面零触（B8 在跑）；B2 已收口队列族零触；#564 在途面零触；annex ∕ 台账 ∕ 需求档零触（父侧笔）。

### 2.1 本批条目（覆盖）与边界

| # | 行 | 面 | 本批处置 | 落点 |
|---|---|---|---|---|
| 1 | annex `:36` | 协议行解析 ∕ 工具参数摘要（desk 自持 `:58` ∕ `:68`） | 裁定：1a 做 ∕ 1b 留端 ∕ 1c 锁 | §2.2.1 |
| 2 | annex `:106` | 子代理事件映射 ∕ 中继（CLI 未接 rc） | 裁定：2a 做 ∕ 2b 留端 ∕ 2c 锁 | §2.2.2 |
| 3 | annex `:115` | 规则面（`.cursor/rules` 增量去留） | 裁定：3a 做 ∕ 3b 做（载位承接） | §2.2.3 |
| 4 | annex `:184`（反⑦） | rc/subblocks（CLI） | 收口 = 与 #2 同面（2a + 2b + 2c） | §2.2.4 |

- **覆盖判据**：closeout B7 行四件（`:36` ∕ `:106` ∕ `:115` + 反⑦）逐件有现状 + 处置 + 判据——零遗漏。
- **不做**：实施；annex 触；B1–B5 已收口段回改（B1 A2 载位 = 前向承接，非回改）；超 B7 射程扩面（`:36` 行 VSC 卡头面 ∕ 参数三形收口 → 转出 B10，见 2.2.1-注）。

### 2.2 逐项现状与处置

#### 2.2.1 `:36` 协议行解析 ∕ 工具参数摘要

**现状（实读）**：

| 面 | 落点 | 实读 |
|---|---|---|
| desk 协议行解析 | `desk/src/main/agent-bridge.mjs:58-65`（`parseEvToken`） | 自持；relay 前缀先剥再解析（`RELAY_HEAD_RE:55`）；消费 = `:179` onToken 唯一 |
| desk 参数摘要 | 同档 `:68-86`（`summarizeArgs`） | 自持小函数（档头自注「不引他端模块」）；消费 = `:230`（`ev:tool-call`）+ `desk/src/main/suspensions.mjs:16/:57`（审批载荷） |
| CLI 参数摘要 | `cli/src/tui/tool-args.mjs:18-75`（`describeToolArgs`） | 按工具挑关键字段（覆盖 15+ 工具族——含 memory ∕ lsp ∕ git ∕ checkpoint ∕ websearch）；消费 = `tool-events.mjs:155` ∕ `startup.mjs:86` ∕ `subagent-blocks.mjs:340` |
| VSC 参数面 | `vsc/src/extension/panel-callbacks.mjs:201` | 原始 JSON（`JSON.stringify(a, null, 2)`）直发 webview——无摘要面（`panel-toolpanel.mjs` = 载荷构造器，非摘要——annex 对位句实读割裂，F5） |
| 结果摘要面 | rc `tool-summary.mjs:35`（`formatToolSummary`）∥ cli `tool-summaries.mjs:7` | rc 面消费 = VSC `webview/tool-summary.js` shim + desk `renderer/views/chat-tool.mjs:21`；CLI 自持副本；跨端对拍锁（tool-summary-parity）随 09-28 全清退役 |
| 生成侧剥除 | core `agent/spawn-child.mjs:117`（`stripEventToken`） | 已核单源（两端消费）——本行零动作 |

**差距**：① 参数摘要双造——desk（19 行简形、60 截断）∥ CLI（57 行全形）；两档自注均称「形仿卡片头」而 VSC 卡头 = 原始 JSON（三形并存）。② `parseEvToken` 单端面——VSC ∕ CLI 无 bare `⟦ev⟧` 消费路径（事件全经 relay 前缀 ∕ 各端 carrier 到达；desk 面 = 端壳桥防御形）。③ 结果摘要面 rc ∥ CLI 对拍锁已亡——无锁漂移面（F2 家族）。

**处置**：

- **1a 参数摘要上提核件单源【做】**：核新档 `core/tool-args.mjs`——体 = CLI `describeToolArgs` 现体（覆盖最全；默认分支 160 ∕ 80 截断；`sliceByWidth` 以核内简版切片替代——全角宽度语义差 = 登记差额）。desk `summarizeArgs` 本体退役（agent-bridge ∕ suspensions 两消费点改核件）；CLI 档收窄为转口（`toolArgsLines` 留端）。
- **1b `parseEvToken` 留端【不做——判据】**：单端桥面（消费唯一 = desk onToken；VSC ∕ CLI 零对位物 ⇒ 无第二实现可去重）；其 relay 形识别已由 rc relay 单源覆盖（2a 后 VSC 亦同源）；表外名原样透传 = 端内出站契约（B2-③ 先例「载荷形 = 端内契约，不逐字移植」）。
- **1c 对拍锁重建【做】**：批次本地件 `docs/batches/2026-09-29-parity-b7-minor.test.mjs`（全清令新规：名随批次档 ∕ 住批次目录 ∕ 不进仓套件；先例 = B2 §2.4）——覆盖四面：① relay 换接同绑定（2a）② rc 文法副本 ↔ core `parseRelayPath` 权威（F6）③ 结果摘要 rc ↔ CLI 逐字对拍（③）④ CLI 事件映射 ↔ rc relay 语义（2c）。
- **注（转出）**：VSC 卡头原始 JSON ∕ desk ∕ CLI 摘要三形收口 = UI 面（B10 射程）——本批报告列，不扩面。

#### 2.2.2 `:106` 子代理事件映射 ∕ 中继（+ 反⑦ 同面）

**现状（实读）**：

| 面 | 落点 | 实读 |
|---|---|---|
| 映射单源（rc） | `rc/subblocks/relay.mjs` | `relayEventToSubPatch:72` ∕ `isRelayToken:56` ∕ `createRelayScope:45` ∕ `queuedInfoOf:51`；消费 = **desk 唯一**（`agent-bridge.mjs:39-40` 直取 + `:167-172` 分流） |
| VSC 产者 | `vsc/src/extension/panel-subagent-relay.mjs` | 自持映射（`:83-147`）+ 双缓存（`:48-69`）；仅取 core 文法（`:31` `parseRelayPath`）；**零 `@thincoder/render-core` import（全 src 实读 grep）**——rc 档头句「R2 后 VSC 该档经本件取值」（`rc/subblocks/relay.mjs:4`）与盘不服（F1）；R2 交接项 = 对拍锁（RM-3 ∕ RM-4）——随 09-28 全清退役（F2） |
| CLI 面 | `cli/src/tui/subagent-blocks.mjs` + `subagent-freeze.mjs` 等 | 自持 TUI 映射（`SUB_EVENT_RE:48` ∕ `routeSubToken:148` ∕ queued ∕ async ∕ 冻结 ∕ 墓碑 ∕ 嵌套子块）；仅取 core 文法（`:20`）；零 rc 消费 |
| 内容 chunk 构形 | desk `agent-bridge.mjs:116-133`（`subChunkOf`）∥ VSC `panel-subagent-relay.mjs:172-191` | 双造（desk 自注「构造面同形 = 扩展端先例」——逐字孪生） |

**差距**：① VSC 产者与 rc 单源同面双造（守卫锁已亡——无锁漂移面）；② CLI 未接 rc（反⑦）——载体不同（TUI 块树 ∥ 图形端 patch 状态机）；③ 内容 chunk 构形双造。

**处置**：

- **2a VSC 换接 rc relay【做】**（完成 R2 交接）：事件面改 `relayEventToSubPatch` + per-panel `createRelayScope()`（WeakMap 代两缓存）；`queuedInfoOf` 转口改 scope 形（消费面 `thincoder-vscode/src/extension/suspension.mjs:38`（import）∕ `:94`（调用）等 import 名零改）；信封 ∕ outbox ∕ 留痕（`ev:substrip` → `deps.onStripped` ∕ `ev:subcontent`）保形。② 内容 chunk 构形单源入 rc（`subblocks/relay.mjs` 增 `relaySubContentChunk(face, a, b)`——逐字搬 desk 现体）——desk ∕ VSC 双消费。
- **2b CLI 留端【不做——判据】**：① **结构封死**：rc = `"private": true`（`rc/package.json:4`）且 CLI 发布面仅 `@thincoder/core`（`cli/package.json:22-24`）——CLI 无法持该依赖（发布即破）；② **消费契约不通约**：rc 输出 = 图形端状态 patch 词汇（started ∕ queued ∕ turn ∕ done ∕ settled ∕ cancelled）；CLI = TUI 块树（嵌套路由 ∕ 墓碑 ∕ 冻结记账 ∕ 消化等待 ∕ 压缩面板——patch 无此词汇），换接后仍留端大半；③ **用户可见不变式同源**：文法 = 核单源（已消费）· 事件语义 = 在册设计表（RENDER-CORE.md §5 ∕ TUI.md §6）· B2 已收口队列族（`:25 ∕ :26` 邻面）——B2 校准（留端 = 非可见差 + 载体绑端；判缺陷 = 用户可见送达差——本项非）；④ 防漂移替代 = 2c 锁。
- **2c 语义对拍锁【做】**（并入 1c）：CLI `routeSubToken` ↔ rc `relayEventToSubPatch` 单层令牌语料语义同判（识别集 ∕ 九类分类 ∕ queued 四字段可比项）；嵌套面 = CLI 独有载位（列外——SUBAGENT-TAIL 显示契约在册）。
- **反⑦收口句**：「rc/subblocks（CLI）」之「仍真」状态消解 = **图形两端（desk ∕ VSC）rc 单源收口（2a）+ CLI 面留端判据在册（2b）+ 对拍锁在盘（2c）**——非「不处理」，为「按判据定案」。

#### 2.2.3 `:115` 规则面（`.cursor/rules` 增量去留）

**现状（post-B1 实读）**：

- 读取面 = 核单源：`core/rules.mjs:72`（`loadRules`）；VSC `extension/rules.mjs:31` = 同名转口。
- 分类 ∕ JIT ∕ 尾块 = VSC 端壳：`vsc/src/agent/rules-face.mjs`——`classifyRules:48` ∕ `loadScopedRules:60` ∕ `scopedRulesBlock:67` ∕ `injectScopedRules:97` ∕ `matchesGlob` 住 `extension/rules.mjs:37-74`。
- **在飞缺口（F3）**：`injectScopedRules`（JIT 注入）**零调用点**——B1 删 `execute-tools.mjs` ∕ 退役 `agent.mjs`（两调用点所在档）后仅存定义（全仓 grep 实读：非定义的唯一引用 = R10 临时探针）。B1 档 §2.3 件 1「端独有 8 项」①自注「规则 JIT = B7 载位（保留注入点——实施轮与 B7 同拍）」⇒ 本批承接；**VSC 现盘 = 尾块活 ∕ JIT 死（用户可见回归在飞）**。`applyRuleTriggered:33` 同为零消费孤儿（F4——核 `agent.mjs` 已持同义逻辑）。
- desk ∕ CLI = 零消费（desk 经核装配得 stream 面——`core/agent/assemble.mjs:80-85`；`.cursor/rules` 面未消费 = 批档「面登记」）；**stream 合并双造**：core `assemble.mjs:80-85` ∥ VSC `rules-face.mjs:21-27`（`mergeFileRules`）。
- 尾块载位：VSC `setup.mjs:281`（`opts.promptTail = scopedRulesBlock(...)`）→ 核 `agent/setup.mjs:46/:245-247`（B1 §2.5-A2 增补）；`panel-turn-loop.mjs:191/:224` 书写回。

**处置**：

- **3a 规则面全面上提核件单源【做】**：核 `rules.mjs` 扩（`classifyRules` ∕ `matchesGlob`+`simpleGlobMatch` ∕ 尾块文本单源 ∕ `injectScopedRules` ∕ `mergeStreamRules` 自 `assemble.mjs:80-85` 抽取导出）+ 核 `prepareRun` 自持尾块（读 `.cursor/rules` ⇒ 追加相同文本）+ 核 `dispatch.mjs` 增 JIT 缝（相位一末 ∕ 相位二前——现读 `:222` 行前；`depth === 0` 门 = 原 VSC 语义；打点 = `prepared` 非拒项 `{tool, args}`）。VSC `rules-face.mjs` ∕ `extension/rules.mjs` 退役（B 面 ∕ `matchesGlob` 入核，`mergeFileRules` 改取核件）；`promptTail` 链退役（3b）。desk ∕ CLI **零码改动**（乘核径自动取得——核装配 ∕ 核循环 ∕ 核 dispatch 三处均在核）。
- **3b promptTail 载位退役【做，同波】**：B1 §2.5-A2 载位（`core/agent/setup.mjs:46` 参 ∕ `:247` 消费；`core/agent.mjs:135` 传递；VSC `setup.mjs:281` ∕ `panel-turn-loop.mjs:191/:224`）——核自持后该链零义 ⇒ 全链删除（B1 档自注「判据面属 B7」= 本批承接句）。
- **判据（为何判修而非留）**：① `:115` = 用户可见端差（同 workspace 下 VSC 注入 `.cursor/rules` 而 desk ∕ CLI 不注入 ⇒ agent 行为按端别）；② **非宿主约束**（`.cursor/rules` = 工作区文件约定，无宿主 API）；③ 09-28 18:57 口径「用户可见端差 = 缺陷；唯一例外 = 宿主能力面须实证」+ §1.3「登记后保留已废」；④ 在飞缺口（F3）同面必修。⇒ 不属例外 ⇒ 全修（方向 = 保留能力 ∕ 三端统一取得；退役能力方向 = 产品回归，须 §4 另裁——默认不取）。
- **附**：3a 落地后 desk ∕ CLI 新增 `.cursor/rules` 两面（尾块 + JIT）——**可见扩面**（对齐方向），随 §4 明示。

#### 2.2.4 反⑦（rc/subblocks CLI）——收口对照

反⑦行（annex `:184`）= `:106` 同面之反向发现（CLI 未接 rc）：处置同 2.2.2——**2a（做）+ 2b（留端判据）+ 2c（锁）**；「仍真」状态以「图形两端单源收口 + CLI 面判定留端」消解（非核销 ∕ 非挂账）。

### 2.3 受影响文件与测试面（表）

**设计档落点**：本节自持（不另立设计档——B1 §2.0 ∕ B2 §2 先例）；实施轮须同笔收正的权威档 = `docs/core/design/WORKSPACE.md`（§2.3 面定义 ∕ §1 行 ∕ §2.2 #171 现注）+ `rc/subblocks/relay.mjs` 档头（F1）+ 其余实扫清单（实施轮起手扫：desk ∕ cli 档头引句，含 `tool-args` ∕ `rules-face` 名面引文）。

| 树 | 档 | 现读 | 预期 | 动作 | 波 |
|---|---|---|---|---|---|
| core | `rules.mjs` | **124**（R10 在册） | ≈205–215 | 扩五件（classify ∕ matchesGlob ∕ 尾块文本 ∕ JIT ∕ mergeStreamRules 抽取） | W1 |
| core | `tool-args.mjs` | **新** | ≈65 | 新档——`describeToolArgs` 单源（CLI 现体为基） | W1 |
| core | `agent/dispatch.mjs` | **245**（read 实读） | +≈12 | JIT 缝（相位一末 ∕ 相位二前；depth===0 门） | W1 |
| core | `agent/setup.mjs` | **241**（B1 在册） | ≈247 | 尾块自持（+6） ∕ promptTail 参删（−1） | W1 |
| core | `agent/assemble.mjs` | **115**（read 实读） | ≈110 | merge 内联改核件调用 | W1 |
| rc | `subblocks/relay.mjs` | **141**（annex 在册） | ≈180 | 增 `relaySubContentChunk`（内容构形单源） | W2 |
| vsc | `src/extension/panel-subagent-relay.mjs` | **271** | ≈235–250 | 事件面换接 rc + scope 化 + 构形取核 | W2 |
| vsc | `src/agent/rules-face.mjs` | **120**（B1 在册） | **0（删）** | B 面入核（A 面 merge 入核；`applyRuleTriggered` 孤儿随删） | W2 |
| vsc | `src/extension/rules.mjs` | **75**（WORKSPACE 在册） | **0（删）** | `matchesGlob` 入核；`loadRules` 转口零消费 | W2 |
| vsc | `src/agent/setup.mjs` | **299**（read 实读） | ≈292 | `mergeFileRules` 改取核件；`:281` promptTail 行删 | W2 |
| vsc | `src/extension/panel-turn-loop.mjs` | **312**（read 实读） | ≈310 | promptTail 三处（`:159` 注 ∕ `:191` ∕ `:224`）删 | W2 |
| desk | `src/main/agent-bridge.mjs` | **334**（R5 在册·越 300 软线——登记续期） | ≈316–318 | `summarizeArgs` 本体删（`:67-86`）+ import 改核 | W3 |
| desk | `src/main/suspensions.mjs` | **129**（read 实读） | ±1 | `:16` import 改核 | W3 |
| cli | `src/tui/tool-args.mjs` | **85**（read 实读） | ≈35 | 转口化（`toolArgsLines` 留端） | W3 |
| 锁 | `docs/batches/2026-09-29-parity-b7-minor.test.mjs` | **新** | ≈180–220 | 1c 四面锁（`node --test` 直跑） | W4 |

**测试面**：① 批次本地件 = 1c 锁档（四面判据；全清令新规）；② 集成面：无新增 ∕ 无修改（集成窗口 50–100 纪律；三端行为验收 = 真机走查面，父侧）；③ 核 ∕ 端套件：不触（全清后重建期——**not repo-suite verified**；父侧收口轮跑为唯一套件运行）。锁档边界：只锁 B7 四面，不重复 B2 锁面（queue family）。

### 2.4 波划分（表）

| 波 | 域 | 内容 | 验收（机检 ⇒ 可绿） |
|---|---|---|---|
| **W1 · 核机制** | core | 规则面五件上提（classify ∕ matchesGlob ∕ 尾块文本 ∕ JIT ∕ merge 抽取）+ 尾块自持 + dispatch JIT 缝 + tool-args 新档 | 平 node 直驱四组读数（分类三例 ∕ JIT 命中 ∕ 尾块逐字 ∕ 合并去重）；`node --check` 5/5 |
| **W2 · VSC 收编** | vsc + rc | relay 换接 rc（事件面）+ 内容构形取核 + rules 两档退役 + promptTail 链退役 | relay 语料对拍（冻结期望表 ∥ rc 输出逐字）；尾块文本逐字对（前 ∥ 后）；JIT 复归读数；`node --check` |
| **W3 · desk ∕ CLI 收编** | desk + cli | desk 摘要收编（两消费点）+ CLI tool-args 转口化 | desk 摘要采样（6 工具族；新形 = 核件同函数）；CLI 标题行对拍（示例逐字；已登差额外零变）；`node --check` |
| **W4 · 锁 + 收口** | 锁 + docs | 对拍锁档落盘（四面）+ rc 档头句收正 + 文档收正（WORKSPACE.md 三处等） | 锁 4 面全绿；文档收正逐处读回 |

- **依存序**：W1 →（W2 ∥ W3）→ W4。W2 ∕ W3 无共享文件（可并行）；W4 依赖三波全落。
- **零实施声明**：本批（设计轮）四波均 = 后续实施派单（eng-coder）；批内零产品码 ∕ 零测试码 ∕ 零文档落笔（除本节）。

### 2.5 验收对照（回指 · 三链同源）

| 源行（closeout B7） | 本批输出 | 状态 |
|---|---|---|
| `:36` | §2.2.1（1a 做 ∕ 1b 留端判据 ∕ 1c 锁） | ✓ |
| `:106` | §2.2.2（2a 做 ∕ 2b 留端判据 ∕ 2c 锁） | ✓ |
| `:115` | §2.2.3（3a 做 ∕ 3b 做） | ✓ |
| `:184` 反⑦ | §2.2.4（收口对照） | ✓ |

批级验收（派单 §2 验收三项）：① 逐项设计行（现状 ⇒ 修法 ∕ 不做 ⇒ 判据）✓；② 波划分表 ✓（2.4）；③ 评审范围清单 ✓（2.8）。引用链一致：closeout B7 行 ↔ 本节条目 ↔ 波（三链同源）。

### 2.6 关键决策（含否决备选）

- **KD-1** 参数摘要取 CLI 形上提核件（覆盖最全；desk 信息量对齐 = 可见变更随 §4）。备选（拒）：取 desk 简形——CLI 富分支退化为损。
- **KD-2** VSC 换接 rc relay（R2 交接收口；锁重建承接 RM-3 ∕ RM-4 遗产）。备选（拒）：维持产者 + 仅重建 RM 锁——双造留存、rc 档头句永假。
- **KD-3** CLI 留端（结构封死 + 消费契约不通约 + B2 校准）。备选（拒）：CLI 持 rc 依赖——发布破（private 包）。
- **KD-4** 规则面全面上提（含在飞缺口 F3 修复；desk ∕ CLI 零码取得 = 三端同面）。备选（拒）：维持 VSC-only（「登记后保留」已废；非宿主面）；全端退役能力（产品回归，须 §4 另裁——默认不取）。
- **KD-5** B1 §2.5-A2 载位承接 = 本批退役（B1 档自注面，前向承接非回改）。
- **KD-6** 锁载体 = 批次本地件（全清令新规；先例 B2 §2.4）。
- **KD-7** 内容 chunk 构形并入 2a（双造同面、载体一致）。备选（拒）：留端——同面双造无判据。

### 2.7 发现项（F）与上抛

- **F1** rc relay 档头句失实（`rc/subblocks/relay.mjs:4`「R2 后 VSC 该档经本件取值」——VSC 全 src 零 render-core import 实读）⇒ 实施轮随 2a 收正（文档面）。
- **F2** 死锁家族：RM-3 ∕ RM-4（relay 映射 ∕ 文法）· tool-summary-parity（摘要）——随 09-28 全清令退役后未重建（queue-visible 已由 B2 收）⇒ 本批 1c 收 relay + 摘要两面；文法面同锁（F6）。
- **F3** 在飞缺口：VSC scoped-rules JIT 现零调用点（B1 收编后；用户可见回归在飞）⇒ 3a 修复路径；若 §4 裁规则面另向 ⇒ 须先行修复该缺口（不得悬挂）。
- **F4** `applyRuleTriggered` 孤儿（同 F3 族；核已持同义逻辑）⇒ 随 3a 退役。
- **F5** annex `:36` 行 VSC 对位句两处实读割裂：①「relay token 走 render-core」——盘面 = 产者自持（同 F1 族）；②「panel-toolpanel.mjs」= 载荷构造器，非摘要面 ⇒ 报告列（annex 零触）。
- **F6** rc 文法副本（逐字复制 core `relay-prefix.mjs`）漂移登记在册（rc relay 档头）——1c 锁面覆盖（权威比对）。
- **上抛**：① VSC 卡头 ∕ desk ∕ CLI 参数三形收口 = UI 面 ⇒ B10 报告（转出）；② B8 在跑（IPC 载荷契约）——2a 不触 desk IPC 载荷面（rc relay 载荷键 = rc 既有形）；若 B8 同笔动 relay 载荷键 ⇒ 以 B8 为准并通报（交叉点登记）；③ 台账行建议（父侧笔）：B7 面四项 + 死锁家族 F2 + 在飞缺口 F3。

### 2.8 评审范围清单（给 §3 设计评审）

1. **覆盖完整性**：closeout B7 行四件（`:36` ∕ `:106` ∕ `:115` + 反⑦）逐件 = 现状 + 处置 + 判据 ∕ 修法——零漏检（对照 closeout §2 归批表 B7 行逐字）。
2. **证据可读回**：全部 file:line = 本席实读面（read ∕ grep）；「批档」引用面（B1 ∕ B2 ∕ R2 ∕ R5 ∕ R10）逐处核。
3. **「不做」判据核**（两处）：1b（parseEvToken 留端）∥ 2b（CLI 留端）——是否满足「非用户可见差 + 载体绑端 + 用户可见不变式同源」（B2 校准）；是否构成「登记后保留」复活（应驳回）。
4. **三链一致**：§2 条目 ↔ 2.5 验收 ↔ annex ∕ closeout 行号——同源零讹。
5. **可见变更面明示**：1a（desk 摘要形变）+ 3a（desk ∕ CLI 新增 `.cursor/rules` 两面 + VSC JIT 复归）——§4 批准面是否显式。
6. **波划分可执行**：依存序（W1 → W2 ∥ W3 → W4）· 每波验收机检化 · 文件域无交叠冲突 · 零实施边界。
7. **冲突 ∕ 承接面**：B1（A2 载位承接句）· B2（锁先例 ∕ 队列族零触）· R2（交接项）· B10（转出）· B8（交叉点）——逐项无相抵。
8. **残留面**：双造 ∕ 孤儿退场的干净度（`rules-face` ∕ `extension/rules.mjs` ∕ promptTail 链 ∕ `summarizeArgs` ∕ `applyRuleTriggered`）+ rc 档头句收正 + 文档收正靶清单（实施轮实扫）。

### 2.9 附注：与在册旧登记的关系（零新语义 · 评审核用）

- 2.2.3 规则面方向与 2026-09-20 U1 登记句（`WORKSPACE.md` §2.2 现状注「两端保留两套语义 + 显式登记」）的关系：判据基准以 **09-28 18:57 ∕ 09-29 在案口径**（用户可见端差 = 缺陷；「登记后保留」已废）为准——U1 句效力若与九二九口径相抵，以本批 §4 复核为准（评审范围清单第 3 条覆盖此点）。
- 射程说明：closeout §1.3 收回条款之直接对象 = annex §3 七条 + 余例外簇；`:115` 属 closeout §2 标记「增量去留未裁」行——本批即其裁定载体（同判据续审，非收回条款的直接对象）。

### §2 修正轮 1（评审 #142 · 轮次 1 · 九发现全收落地 · 2026-09-29 · eng-designer）

**依据** = 本档 §3 轮次 1 发现表（🔴1 ∕ 🟡5 ∕ 🔵3；VERDICT = changes-required）+ 父侧裁定（九条全收；① = 必落）。**本块为准，上文行文不改**（修正轮块先例 = `docs/batches/2026-09-15-cli-async-discard.md:142`）；只落九发现导出项——不夹带新范围；产品码 ∕ 实施 ∕ 评审点火零触。新增坐标 = 本席实读（2026-09-29 12:0x–12:1x，read ∕ grep）。

**① 1a 删件漏第三消费面（🔴）——二择一写定：取「agent-bridge 保名转口」**

- desk `agent-bridge.mjs`：`summarizeArgs` 本体（`:67-86`——注 + 19 行 switch）删；**名面保留** = `import { describeToolArgs as summarizeArgs } from "@thincoder/core/tool-args.mjs"` + `export { summarizeArgs }`（`:68` 名面不变、体改核调；本地绑定供内部调用面）。
- 三消费面零改（实读）：`agent-host.mjs:53` 转口句（`export { ACTIVITY_EVENTS, parseEvToken, summarizeArgs } from "./agent-bridge.mjs"`）· `suspensions.mjs:16` import · `agent-bridge.mjs:230` 调用；`main.mjs:15` 启动链不受触 ⇒ 原「本体删即命名导出缺失（装载期 SyntaxError）」路径封死。
- 受影响表收正：desk `agent-bridge.mjs` 行（动作列 = 「`summarizeArgs` 本体删（`:67-86`）+ 保名转口（`:68` 名面存续——核件单源）」）；`suspensions.mjs` 行（动作列 = 「零改（保名转口后 `:16` 面存续）」· Δ 收正 ±1 → **0**）。
- 并 W3 验收：`node --check` + 装配链 `main.mjs → agent-host.mjs → agent-bridge.mjs` 名面全解析（防 ESM 命名导出缺失类）。

**② 1c-③ 逐字对拍补掩码（🟡）**

- 1c-③ 判据收正 = 「结果摘要 rc ↔ CLI **逐字对拍 + 掩码**」；掩码集 = 已登记端差三面：① 成功面退出状态（`rc/tool-summary.mjs:19-26` ∥ `cli/src/tui/tool-summaries.mjs:60-68`——CLI 成功面拼 `(exit code 0)`，rc 不拼）；② 状态位族（`(exit code N≠0)` ∕ `(killed: …)` ∕ `(spawn failed)`）；③ `verify` 分支（CLI `tool-summaries.mjs:8`——rc 零对位）。
- 判据形：掩码面先归一（成功面退出状态剪除 ∕ 状态位族折叠）再比；掩码外语料**逐字全等**（漂移即红）；`verify` 语料不入逐字射程（rc 零对位——按登记差在册）⇒ W4「锁 4 面全绿」可达。

**③ 受影响表补核 `agent.mjs` 行（🟡）**

| 树 | 档 | 现读 | 预期 | 动作 | 波 |
|---|---|---|---|---|---|
| core | `agent.mjs` | **467**（read 实读） | **467（Δ=0——行内两处改）** | 3b promptTail 链退役：`:102` 形参 `promptTail = null` 删 ∕ `:135` 实参删（行数不变） | W1 |

**④ 尾块面 depth 语义写定 + 子代理面明示（🟡）**

- 写定 = **尾块 ∕ JIT 两缝同门 `depth === 0`**。依据：① JIT 缝句在册「`depth === 0` 门 = 原 VSC 语义」；② 原 VSC 尾块 = host `hydrateRun` 单点写入（`vsc/src/agent/setup.mjs:281`——仅顶层径；子代装配全在核——`spawn-child.mjs → runAgent` 无 `promptTail` 传递面）；③ 邻位 skills 门 `core/agent/setup.mjs:240-244` 同律；④ B1 `docs/batches/2026-09-29-parity-b1-vsc-core.md:773` 在册「子代理不带 host 尾块」——全深度落形破此行。
- 落地形 = `core/agent/setup.mjs:245-247` 追加点包 `depth === 0` 门（可与 skills 门同块——实施舱定）。
- 子代理面（深 1+）= **显式零变更**（三端皆不携 `.cursor/rules`——B1 `:773` 在册态保持；随 §4 明示，见 ⑨）。

**⑤ W4 锁档落位机制写定（🟡）**

- 实施舱（子代理）对 `docs/batches/*.test.mjs` 写门拒（#545——B1 `:918` 在册）⇒ 落位 = **tmp 先行 + 父侧 copy 收位**（沿 B1 `:24` 先例）：锁档先落 `.thincoder/tmp/2026-09-29-parity-b7-minor.test.mjs`（gitignored），`node --test` 于 tmp 件直跑取证；父侧收位至 `docs/batches/2026-09-29-parity-b7-minor.test.mjs`。
- W4 验收形收正：① tmp 件四面全绿（实施舱读数）；② 收位后母本逐字一致（父侧）。

**⑥ 收正靶清单点名 + 起手扫扫描域扩（🟡）**——2.3 节「设计档落点」段靶清单收正（本块为准）：

- rc 设计档 `docs/render-core/design/RENDER-CORE.md:176-178`：§5 导出面补 `relaySubContentChunk` 行（现无）；`:178`「先例…R2 后 VSC 差分 = 零」句（2a 落地后始为真）。
- `docs/vsc/design/WEBVIEW.md:255` ∕ `:281` ∕ `:291` ∕ `:615`：`panel-subagent-relay.mjs` 坐标格（键构造 ∕ `postSubagentEvent` ∕ `emitToolPanel` ∕ `relaySubagentContentChunk`；2a 改写后即漂；`:615` = 六档现读数 as-of 2026-09-22 行）。坐标注：`:281` 两引坐标（`:143-155` ∕ `:109-111`）对现盘 271 行已不落靶——现读 def = `postSubagentEvent:215` ∕ `emitToolPanel:162-164`；收正按现读重出。
- `docs/vsc/design/WEBVIEW-PROTOCOL.md:415-417` ∕ `:425`：`sub:*` ∕ `subagent` ∕ `subagentApproval` ∕ `toolPanel` 行坐标格（同因漂）。
- `thincoder-vscode/src/agent/run-helpers.mjs:18`：引 `rules-face` 消费面——3a 退役后失实。
- `thincoder-core/advisor/compaction.mjs:155-160`：「单源 describeToolArgs（`../tui/tool-args.mjs`）」句——1a 后失指（单源迁核 `tool-args.mjs`）。
- `thincoder-core/advisor/loop.mjs:67`：「CLI = `tui/tool-args.mjs` 的 `describeToolArgs`」句——同族。
- 本席实读补（同族扫描目标）：`thincoder-vscode/src/agent.mjs:5` ∕ `thincoder-vscode/src/agent/setup.mjs:10`（档头键面提及 `opts.promptTail`——随 3b 链退役收正）。
- 起手扫扫描域 = desk ∕ cli **＋ core ∕ vsc**（词族 = `render-core` ∕ `rules-face` ∕ `describeToolArgs` ∕ `summarizeArgs` ∕ `promptTail` ∕ `relaySubagentContentChunk`——引被改面者逐处核）。

**⑦ 数值收正（🔵）**

- 受影响表 core `agent/setup.mjs` 行：现读 **241（B1 在册）⇒ 253**（read 实读；与 B1 §5.P4-I 行数账「253（+12）」同源）；预期 ≈247 ⇒ **≈258**（253 + 6 − 1——Δ 以 253 为基重算）。

**⑧ `relaySubContentChunk(face, a, b)` 返回契约 ∕ 宿主分工写定（🔵）**

- 返回形 = **内容 chunk 载荷（纯函数）或 `null`**：`{ role, id, kind, text, sub?, tool?, face?, cmd? }`（逐字搬 desk `subChunkOf` 现体——`desk/src/main/agent-bridge.mjs:116-133`）；无 relay 前缀 ⇒ `null`（调用面原样转发）。
- rc 档头零宿主约束（`rc/subblocks/relay.mjs:5-6`）不破：**返回 chunk，不走 deps 注入**——rc 侧零宿主调用 ∕ 零 DOM。
- 宿主分工（副作用留宿主）：desk 消费 = 既有 `chunkOut` ⇒ `post("ev:subchunk")`（`agent-bridge.mjs:162`；desk `subChunkOf` 删、改调核件）；VSC 消费 = rc 取 chunk 后两宿主调用照旧——`noteContentFirst(panel, ch, face)`（`vsc/src/extension/panel-subagent-relay.mjs:188`）+ `emitToolPanel(panel, ch, chunk)`（`:189`）。
- 坐标注（收正）：评审句所指「现体 `desk/src/main/agent-bridge.mjs:172-191` 含两宿主调用」——`:172-191` 实属 **VSC** `panel-subagent-relay.mjs`（`relaySubagentContentChunk` 定义域）；desk 现体 = `:116-133`（`subChunkOf`——**零宿主**）⇒ 搬迁源 = desk 现体；两宿主调用不入 rc、留 VSC 侧。

**⑨ 可见变更面枚举补全（🔵）**

- 补 1a 项下：**CLI 参数标题行全角截断语义差**——核件切片以「核内简版切片」替代 CLI `sliceByWidth`（`cli/src/tui/render.mjs:46`——宽度感知 ∕ 全角计宽）⇒ 默认分支（`cli/src/tui/tool-args.mjs:72`）全角截断续接点可异于现端（160 ∕ 80 两档触发）；**已登记差额**（2.2.1 处置句原 `:53`）。
- 收正后全量枚举（供 §4 批准面）= ① 1a：desk 摘要形变（信息量对齐核件形）+ CLI 标题行全角截断面（登记差额）；② 3a：desk ∕ CLI 顶层新增 `.cursor/rules` 两面（尾块 + JIT）+ VSC JIT 复归（F3 在飞缺口修复）；③ 子代理面（深 1+）= 显式零变更（见 ④）。

### §2 修正轮 2（评审 #152 · 轮次 2 · 五发现全收落地 · 2026-09-29 · eng-designer）

**依据** = 本档 §3 轮次 2 发现表（🟡3 ∕ 🔵2；VERDICT = pass）+ 父侧裁定（五条全收；1–5 全落；本单 = 放行前补强）。**本块为准，上文行文不改**（修正轮块先例 ∕ 轮 1 同式）；只落五发现导出项——不夹带新范围；产品码 ∕ 实施 ∕ 评审点火 ∕ §3 面零触。坐标 = 评审在册（轮 2）+ 本席实读复核面（read，2026-09-29 12:1x）。

**①（发现 1 · 🟡 · 补强修正②）掩码集补第三项：失败面 `(empty)` 占位归一**（二择一写定：取「掩码集补第三项」）

- 1c-③ 掩码集收正 = 已登记端差**四面**（三项掩码量 + 一项语料排除）：① 成功面退出状态（剪除——CLI 拼 `(exit code 0)` ∕ rc 不拼）；② 状态位族（`(exit code N≠0)` ∕ `(killed: …)` ∕ `(spawn failed)`——折叠）；③ **失败面 `(empty)` 占位（新补——有状态位且末条为 `(empty)` 时于比前剪除该占位）**；④ `verify` 分支（语料排除——rc 零对位）。
- 新补依据（本席实读复核）：`rc/tool-summary.mjs:25-26` 登记 ∕ `:84-85` 同规 ∕ `:94` 实作抑制；语料实例（失败且输出为空，core `tools/bash.mjs:222` 形）⇒ CLI 出 `bash: (empty) (exit code 1)`（`cli/src/tui/tool-summaries.mjs:60-68` 末条原样入 parts）∥ rc 出 `bash: (exit code 1)`；③ 归一后即逐字全等。无状态位时两端同形（不改）。
- 判据形不变：掩码面先归一（①剪除 ∕ ②折叠 ∕ ③剪除）再比；掩码外语料**逐字全等**（漂移即红）；`verify` 语料不入逐字射程（rc 零对位——按登记差在册）⇒ W4「锁 4 面全绿」可达。

**②（发现 2 · 🟡 · 补强修正③）core `agent.mjs` 行补越线登记句**

- 修正③ 表行收正（本项为准）：

| 树 | 档 | 现读 | 预期 | 动作 | 波 |
|---|---|---|---|---|---|
| core | `agent.mjs` | **467**（read 实读·越 300 软线——拆分债登记；免拆判据：本批仅行内两处删改 ∕ 结构不变） | **467（Δ=0——行内两处改）** | 3b promptTail 链退役：`:102` 形参 `promptTail = null` 删 ∕ `:135` 实参删（行数不变） | W1 |

- 行式 = 同 desk 行（`:116`「越 300 软线——登记续期」）；距 500 硬限 33 行；拆分动作不随本批（后续批择机）。

**③（发现 3 · 🟡 · 补强修正⑥）收正靶清单补 `RENDER-CORE.md:151`**

- 修正⑥ 靶清单补一行（本项为准）：rc 设计档 `docs/render-core/design/RENDER-CORE.md:151`——面表行 7「工具摘要单源」判词「桌面摘要住**主进程**（`thincoder-desktop/src/main/agent-bridge.mjs` `summarizeArgs`）」，1a 后失实（desk 体 = 核件保名转口——摘要实现单源迁核 `tool-args.mjs`）；与 `:176-178` 同笔收正；同表计数行 `:168` 按实核随动（判词类别未变则计数不变）。

**④（发现 4 · 🔵 · 补强修正⑧）合同句补两处：`ch` 导出式 + 面集 gate 写定**

- ① `ch` 导出式：合并返回 chunk = desk 形（携 `role` ∕ `id`——`subChunkOf:120` identity 面），**不携频道键 `ch`** ⇒ VSC 消费点由 chunk 重导出：`ch = "sub:" + \`${chunk.role}#${chunk.id}\``（现盘 `panel-subagent-relay.mjs:187` = `"sub:" + path.head`；`path.head` 文法 = `role#id`（`subChunkOf:119-120` 同拆解）⇒ 重导出等价）。
- ② 面集 gate 写定：rc `relaySubContentChunk` **保四面 gate**（`face ∈ {text ∕ think ∕ toolCall ∕ toolOutput}`）——非四面（含第五路 `toolResult` 死路）⇒ `null` 早退（与「无前缀」同口——合并形统一 `null` 返回）；判词随迁（VSC `panel-subagent-relay.mjs:167-169` 引 `WEBVIEW.md` §5.3 无产者证据链）。
- 等价性（本席实读）：现调用面止四面——VSC 四点（`panel-callbacks.mjs:139` ∕ `:143` ∕ `:198` ∕ `:219`）∥ desk 单点（`agent-bridge.mjs:177` = `text` 面，∈ 四面）⇒ gate 恒真 ∕ 不触——desk ∕ VSC 行为等价；VSC 四点 = falsy 判，现值 `false` → 合并形 `null` 等价生效。

**⑤（发现 5 · 🔵）W4 残留面句登记 B1 批级归档锁口径**（三择一写定：取「标为历史件 + 约定不重跑」；备选拒：同笔收正）

- 对象：B1 批级归档锁 `docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs`（`:870` 直载真件 `panel-turn-loop.mjs`）——`:939`（A2 promptTail 装配写回 `"TAIL-BLOCK"`）∥ `:750`（`panel-turn-loop.mjs` 行数冻结 312）两断言随 3b 退役失据（B1 期状态快照——复跑时按代际已知失效，非回归信号）。
- 落地（W4 收口面）：标为历史件 · 约定不重跑——W4 收口报告列明该件与两失据断言；**B1 件零改**（归档面「收口不删不退不处置」在册口径 ∕ 记录面不回改；同笔收正 = 回改已收口批归档件且削冻结面——不取）。本批自持锁档（2.3 锁行）不受此口径影响。

### §2 W4 文档收正轮（D 舱 · 六处逐处 · 2026-09-29 · eng-designer）

**依据** = 本档 §2 `:130`（W4 行）+ §5 边界项（`:397` ∕ `:443-444` ∕ `:496` ∕ `:516-519`）——派单 = 六处逐处点修（处置执行人 = 本席；父侧已裁定接受）；**零产品码 ∕ 零实施 ∕ 零评审点火**。逐处「实读 → 收正 → 读回」；行号 = 现盘实读（2026-09-29 13:1x，read ∕ grep）。

**逐处处置（读回 ✓）**：

1. **读取面归位（`docs/core/design/WORKSPACE.md`）**——派单路径原文「`docs/desktop/design/WORKSPACE.md`」为笔误（盘面无此档）；权威档 = **core 档**（本档 `:101` 点名 ∕ 09-28 批档 `:1200` 同指——`:36/:41` 坐标族吻合）。收正 6 行区 + 变更记录 1 行：
   - `:15`（§1 行——VSC 档 ⇒ 「已退役（迁移期引文——两档已删）」；核 **124 ⇒ 261**）
   - `:36`（§2.2 #171 行——处置列 ∕ 归属段两格：VSC 两档退役 · 核 `124 ⇒ 261` · VSC `75 ∕ 120 ⇒ 0（删）`）
   - `:41-42`（现状注——U1 选项②登记句退场（判据基准 = 09-28 ∕ 09-29 在案口径）；更新句合并收编 B7 3a：「读取面 = 核单源；三端同得」）
   - `:51`（作用域规则 bullet——「VSC 端面」⇒ 「B7 3a 起三端同面」）
   - `:52`（读取行——VSC 端壳两档退役 ∕ `matchesGlob` ∕ `simpleGlobMatch` 入核单源）
   - `:55`（「CLI 端不读该目录」失效句删 ⇒ 「desk ∕ CLI 端同得该目录两面（尾块 + 作用域 JIT）」）
2. **`docs/desktop/design/IPC.md:84`**——「核内无此单源，端各自实现」失实 ⇒ 收正「单源 = 核 `thincoder-core/tool-args.mjs` `describeToolArgs`（B7 1a；本端 `agent-bridge.mjs` 保名转口 `summarizeArgs`）」+ 变更记录 1 行。
3. **`docs/cli/design/TUI-TOOL-OUTPUT.md`（`:47 ∕ :50` 死坐标 ∕ `:18` ∕ `:81`）**——收正 4 处 + 变更记录 1 行：`:47`（`describeToolArgs` 单源 = 核 `thincoder-core/tool-args.mjs:16` ∕ 本端 `:14` 转口）· `:49`（`tool-events.mjs:153 ⇒ :158`——实读复核扩获）· `:50`（`toolArgsLines :81 ⇒ :20-23`）· `:8`（as-of 注补 §4 重锚句）。
4. **`docs/core/design/CORE-UNIFICATION.md:1294`**——引 CLI `:18` 收正为核 `thincoder-core/tool-args.mjs:16`（CLI 转口 `:14`）；同族死坐标 `:1331`（实读复核扩获）同拍 + 变更记录 1 行。
5. **批档措辞 `mergeStreamRules` ↔ 实落名**——实核落名 = **`mergeFileRules`**（`thincoder-core/rules.mjs:74`；`thincoder-core/agent/assemble.mjs:18/:82` 消费）——本条前段设计行文以实落名为准。
6. **rc 档头句收正**——**已落 · 零动作**（A 舱 `thincoder-render-core/subblocks/relay.mjs:4-5`——R2 交接收口句在盘；限定语「W2 落地后为真」条件已满足）；产品码面本舱零触。

**届盘重锚（供本记录 · §5.C4 披露转正）**：`tool-events.mjs:155 → :158`（已落 TUI-TOOL-OUTPUT.md）；`subagent-blocks.mjs:340 → :345`（本舱四档内无引用面）；`startup.mjs:86` 仍准。

**列报（清单外 ∕ 未改——父侧路由）**：① `docs/core/design/ADVISOR-GUARDS.md:369` 引 CLI `thincoder-cli/src/tui/tool-args.mjs:51`——B7 1a 后死指针（现 = 核 `thincoder-core/tool-args.mjs:49`）；② rc ∕ core「（W2 ∕ W3 落地后为真）」限定语四处（`rc/subblocks/relay.mjs:5` · `core/tool-args.mjs:5` · `core/advisor/compaction.mjs:157` · `core/advisor/loop.mjs:67`）——条件已满足，去限定属产品码面（§5.C6-5 在册）；③ 设计收正靶清单未列入本舱派单者：rc 设计档 `RENDER-CORE.md:151` ∕ `:176-178` · `docs/vsc/design/WEBVIEW.md:255/:281/:291/:615` · `WEBVIEW-PROTOCOL.md:415-417/:425`——未落（父侧路由）。

**附注**：本舱四档改动经 `node scripts/doc-check.mjs` 复核——零悬空命中 ∕ 零超宽命中（两处退役引文以「迁移期引文」形登记 → 列报 · 不入闸）；存量 136 悬空 ∕ 46 超宽 = 清单外既有面（列报）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = `docs/batches/2026-09-29-parity-b7-minor.md` §2（设计轮）· 只读本档 + B1 档（评审范围声明面）。
**限制声明**：未提供 Project Standards ∕ Document Map ⇒ 方法论合规与文档归属判据按根 `AGENTS.md` + 本档自身规范评定（降级）；annex ∕ closeout 原文不在评审范围 ⇒ 逐行覆盖只对本档两表自洽性核（引用面抽核）。
**实读抽查（通过项）**：`core/rules.mjs` 124 ∕ `rc/subblocks/relay.mjs` 141 ∕ `desk/src/main/agent-bridge.mjs` 334 ∕ `desk/src/main/suspensions.mjs` 129 ∕ `cli/src/tui/tool-args.mjs` 85 ∕ `vsc/src/agent/setup.mjs` 299 ∕ `vsc/src/extension/panel-turn-loop.mjs` 312 ∕ `vsc/src/agent/rules-face.mjs` 120 ∕ `vsc/src/extension/rules.mjs` 75 ∕ `core/agent/dispatch.mjs` 245（相位界 `:222`）——全部命中；`parseEvToken:58-65` ∕ `summarizeArgs:67-86` ∕ `classifyRules:48` ∕ `injectScopedRules:97` ∕ `relayEventToSubPatch:72` ∕ `relaySubagentContentChunk:172-191` ∕ `loadRules:72` ∕ `promptTail` 链（`core/agent/setup.mjs:46/:247` · `core/agent.mjs:135` · `vsc/setup.mjs:281` · `panel-turn-loop.mjs:159/:191/:224`）——逐处吻合；F1（VSC 全 src 零 render-core import）· F3（`injectScopedRules` 定义外零引用）· F4（`applyRuleTriggered` 零消费者；核 `agent.mjs:336` 持同义）· 2b 结构判据（rc `private:true` @ `rc/package.json:4` · CLI 发布 deps 仅 `@thincoder/core` @ `cli/package.json:22-24`）——均实证成立。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / Affected-file coverage | 🔴 | 1a 的 desk 面删件漏第三消费面：受影响表只列 `agent-bridge.mjs`（`:116`）与 `suspensions.mjs`（`:117`），但 `thincoder-desktop/src/main/agent-host.mjs:53` = `export { ACTIVITY_EVENTS, parseEvToken, summarizeArgs } from "./agent-bridge.mjs"`（`summarizeArgs` 同名转口），且 `thincoder-desktop/src/main/main.mjs:15` 直接 `import { createAgentHost } from "./agent-host.mjs"` ⇒ 按表施工（`agent-bridge.mjs:68` 本体删）即 ESM 命名导出缺失 = **装载期 SyntaxError，桌面主进程起不来**（同类欠声明 = B1 §1.6「派单 files 欠声明」教训） | 二择一写定并入表：① `agent-bridge.mjs` 保名转口（本体删后仍导出该名）；② 受影响表补 `agent-host.mjs` 行（现读 ∕ Δ 标注）并明改其转口句——两条路必择其一，不得留白 |
| 2 | Acceptance（锁判据可满足性） | 🟡 | 1c ③「结果摘要 rc ↔ CLI **逐字对拍**」未写掩码，而该面已有在册端差：`rc/tool-summary.mjs:19-26` 明载「成功面不拼 `(exit code 0)`」与状态位族归属，`cli/tool-summaries.mjs:60-68` `_bashSummary` 成功面**亦拼** status；CLI 另有 `verify` 分支（`:8`）rc 无 ⇒ 逐字对拍含 bash ∕ verify 语料必红 | 判据句补「逐字对拍 + 掩码 = 已登记端差集（成功面退出状态 ∕ 状态位族 ∕ `verify` 分支）」或限定语料射程，使 W4「锁 4 面全绿」可达 |
| 3 | Affected-file annotation | 🟡 | 3b 的链清单点名 `core/agent.mjs:135`（`:91`），但受影响表（`:103-119`）无该档行——核心 `agent.mjs`（现盘 467 行）将改动（另含 `:102` 的 `promptTail = null` 形参）却无现值 ∕ Δ 标注 | 表内补核 `agent.mjs` 行（现值 + Δ，或注「结构不变」）；若判该档不动，则须说明 `:135` ∕ `:102` 两处留存的零义 |
| 4 | Requirements / Semantics gap | 🟡 | 3a「核 `prepareRun` 自持尾块」（`:90`）未写 depth 语义，而同句点名 JIT 缝 `depth === 0` 门；核现盘 promptTail 追加点无 depth 门（`core/agent/setup.mjs:245-247`，邻位 skills 清单反有 `depth === 0` 门 `:240-244`）⇒ 全深度落形则**三端子代理均开始携 `.cursor/rules`**，而 B1 在册现状为「子代理不带 host 尾块」（`:773`）；`:93` ∕ `:172` 的可见变更面枚举亦未含子代理面 | 写定尾块面 depth 语义（与 JIT 缝对齐 ∕ 或有意放开并说明），并把子代理面纳入可见变更面明示（§4 批准面） |
| 5 | Feasibility / Coordination | 🟡 | W4「对拍锁档落盘」（`:119` 的 `docs/batches/2026-09-29-parity-b7-minor.test.mjs`）未写落位机制，而该路径被子代理写门拒（B1 `:918` 记 #545；同档 `:24` 记实际落位 = tmp 先行 + 父侧 copy 收位） ⇒ 判据「锁 4 面全绿」与可写面不一致 | W4 写明落位机制（tmp 先行 + 父侧收位 ∕ 或注明由父侧落盘），或把锁件落点改为实现者可写面 |
| 6 | Document ownership / 收正靶清单 | 🟡 | `:101` 靶清单 = WORKSPACE.md 三处 + rc 档头 + 泛指「其余实扫清单（desk ∕ cli 档头引句）」，未点名本次被改写面的作者档与源码引文：rc 设计档 `docs/render-core/design/RENDER-CORE.md:176-178`（§5 导出面——2a 新增 `relaySubContentChunk` 无对应行；其「R2 后 VSC 差分 = 零」句在 2a 后才为真）· `docs/vsc/design/WEBVIEW.md:255/:281/:291/:615` 与 `docs/vsc/design/WEBVIEW-PROTOCOL.md:415-417/:425`（`panel-subagent-relay.mjs` 坐标格——2a 改写后即漂）· 源码侧引文 `thincoder-vscode/src/agent/run-helpers.mjs:18`（引 `rules-face` 消费面，退役后失实） | 靶清单按面点名上述档位与坐标（rc 设计档新导出行 ∕ VSC 两设计档坐标格 ∕ vsc 源码引文），并把起手扫的扫描域从 desk ∕ cli 扩到 core ∕ vsc |
| 7 | Affected-file annotation（数值） | 🔵 | 核 `agent/setup.mjs` 现读列标 **241（B1 在册）**（`:108`），现盘实读末行 = **253**（与 B1 §5.P4-I 行数账「253（+12）」一致）⇒ 基线陈旧，Δ 亦以旧基计（≈247 应为 ≈258） | 现读列改 253（或标 as-of 前值）；预期 Δ 按 253 为基重算 |
| 8 | Clarity | 🔵 | 2a-② 新函数 `relaySubContentChunk(face, a, b)`（`:73`）未述返回契约 ∕ 宿主分工，而「逐字搬 desk 现体」的现体（`desk/src/main/agent-bridge.mjs:172-191`）内含 `noteContentFirst(panel, ch, face)`（`:188`）与 `emitToolPanel(panel, ch, chunk)`（`:189`）两宿主调用，与 rc 档头「本档零 DOM 零宿主」（`rc/subblocks/relay.mjs:5-6`）相抵 | 写定核侧返回形（返回 chunk ∕ 或 deps 注入 note+emit 两缝），保 rc 侧零宿主约束 |
| 9 | Scope（可见面枚举） | 🔵 | `:53` 已登记「`sliceByWidth` 以核内简版切片替代——全角宽度语义差 = 登记差额」（切片器现住 `thincoder-cli/src/tui/render.mjs:46`），但 `:172` 的可见变更面枚举仅列 1a「desk 摘要形变」与 3a 两面，未含 CLI 侧全角截断语义差 | 枚举补该已登记差额（CLI 标题行全角截断面），或注明其归入 1a 口径 |

**计数**：🔴 1 ∕ 🟡 5 ∕ 🔵 3（合计 9）。
VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象** = 本档 §2 修正轮 1 块（:182-240 · 九发现修正验收 · 轮 2 复审）。**限制声明**：Project Standards ∕ Document Map 未提供 ⇒ 方法论合规 ∕ 文档归属判据按根 `AGENTS.md` + 本档自身规范评定（降级）。**证据** = 本轮实读（read ∕ grep · 2026-09-29）：九修正逐条对盘核 + 被引坐标抽核（含被引批档 ∕ 源档）。

**实读核验（通过项）**：① 修正①——三消费面（`agent-host.mjs:53` ∕ `suspensions.mjs:16` ∕ `agent-bridge.mjs:230`）与 `main.mjs:15` 全部实读吻合；`@thincoder/core/tool-args.mjs` 子路径可用（core `package.json:31-33` = `"./*": "./*"`）⇒ 保名转口闭合原 🔴（装载期 SyntaxError 路径封死）。② 修正②三面坐标全落靶（`rc/tool-summary.mjs:19-26` ∕ `cli:60-68` ∕ `cli:8`）——仅掩码集完整性一项见下表。③ 修正③ ∕ ⑦数值对盘：core `agent.mjs` 467（`:102` ∕ `:135`）· core `agent/setup.mjs` 253（`:240-244` skills 门 ∕ `:245-247` 追加点）· B1 `:694` 行数账「253（+12）∕ 467（+5）」同源。④ 修正④依据逐项成立（B1 `:773` 句 · vsc `setup.mjs:281` 单点写入 · core skills 门同律 `:240-244`）。⑤ 修正⑤机制与先例实读（B1 `:24` ∕ `:918`；`.gitignore:19-20` tmp 在册）。⑥ 修正⑥所点坐标全部存在（RENDER-CORE.md:176-178 · WEBVIEW.md:255/:281/:291/:615 · WEBVIEW-PROTOCOL.md:415-417/:425 · run-helpers.mjs:18 · compaction.mjs:155-160 · loop.mjs:67 · vsc agent.mjs:5 ∕ setup.mjs:10）——仅漏一处见下表。⑦ 修正⑧坐标纠正成立（desk `subChunkOf:116-133` 零宿主 ∕ VSC `:172-191` ∕ `:188/:189` 两宿主调用 ∕ desk `chunkOut:162` ∕ rc 档头 `:5-6`）。⑧ 修正⑨两坐标成立（`cli/src/tui/render.mjs:46` ∕ `tool-args.mjs:72`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance（锁判据可满足性） | 🟡 | 修正②掩码集仍漏一项已登记端差：失败面 `(empty)` 占位（`thincoder-render-core/tool-summary.mjs:25-26` 登记 ∕ `:94` 实作抑制）——「失败且输出为空」语料（`thincoder-core/tools/bash.mjs:222` `[stdout]:\n(empty)` + `(exit code N)` 形）下 CLI 出 `bash: (empty) (exit code 1)`（`thincoder-cli/src/tui/tool-summaries.mjs:60-68` 末行原样入 parts），rc 出 `bash: (exit code 1)`；「成功面剪除 ∕ 状态位族折叠」后仍不逐字全等 ⇒ 语料含此类例则锁③必红，「掩码外语料逐字全等 ⇒ W4 锁 4 面全绿可达」不成立 | 掩码集补第三项（失败面 `(empty)` 占位归一——`thincoder-render-core/tool-summary.mjs:84-85` 同规），或在②判据句明示该类语料不入逐字射程；二择一写定 |
| 2 | Affected-file annotation | 🟡 | 修正③新增 core `agent.mjs` 行（`docs/batches/2026-09-29-parity-b7-minor.md:202` · 467 行 · 距 500 硬限 33 行）只标现值+Δ=0，无 300 线越线登记——表内既定惯例 = desk `agent-bridge.mjs` 行「越 300 软线——登记续期」（`:116`）；命中评审判据「>300 行文件须携拆分规划」 | 该行补越线登记句（拆分债登记 ∕ 或「仅行内两处删改、结构不变」免拆判据），与 desk 行同式 |
| 3 | Document ownership ∕ 收正靶清单 | 🟡 | 修正⑥点名清单漏 `docs/render-core/design/RENDER-CORE.md:151`（面表行 7「工具摘要单源」= 显式裁「桌面摘要住主进程（`thincoder-desktop/src/main/agent-bridge.mjs` `summarizeArgs`）」）——1a 后该句失实；同档已点名 `:176-178`，`:151` 不在该链上 | 收正靶清单补该坐标（rc 设计档面表行 7），与 `:176-178` 同笔收正 |
| 4 | Clarity（合并函数契约细节） | 🔵 | 修正⑧返回值契约两处未写定：① VSC 两宿主调用所需频道键 `ch = "sub:" + path.head`（现盘 `thincoder-vscode/src/extension/panel-subagent-relay.mjs:187`）不在返回 chunk（chunk 只携 `role` ∕ `id`）——须由 role/id 重导出；②「逐字搬 desk 现体」将失去 VSC 现版四面 gate（`:173` 第五面 `toolResult` 死路早退 false——无产者证据链见 `:167-169` 引 `WEBVIEW.md` §5.3） | ⑧合同句补 `ch` 的导出式；并写明合并函数是否保留四面 gate（现调用面止四面 ⇒ 行为等价——写明即消歧） |
| 5 | Coordination（残留登记） | 🔵 | 3b 退役 promptTail 链后，B1 批级归档锁（`docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs`——`:870` 直载真件 `panel-turn-loop.mjs`）两断言失据：`:939`（A2 promptTail 装配写回）· `:750`（行数冻结 312）；本轮扫描域（desk ∕ cli ∕ core ∕ vsc 树）与点名档均不含 `docs/batches/` 锁件 | W4 残留面句内登记该锁件口径（标为历史件 ∕ 约定不重跑 ∕ 或同笔收正） |

**计数**：🔴 0 ∕ 🟡 3 ∕ 🔵 2（合计 5）。

**范围外注记（不赋定级 · 不属本轮修正块）**：2.2.2-2a 句（`:73`）引 `queuedInfoOf` 消费面 = `suspension.mjs:27`——现盘实读 = `thincoder-vscode/src/extension/suspension.mjs:38` import ∕ `:94` 调用（`:27` 不落靶；该档 B1 期改过导入段）。备核。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 依据 = 用户 2026-09-29 令「都处理 ∕ 赶紧跑完」+ 排空授权三条件）

**三条件齐备** ✓：① **设计评审 pass** ✓（两轮：§3 轮次 1 changes-required → 修正轮 1 落 → §3 轮次 2 **pass**——🔴 0 · 🟡 3 ∕ 🔵 2 全收）；② **修正已落地并逐条核验** ✓（§2 修正轮 1 `:182-240` 九号 + 修正轮 2 `:242-275` 五号——父侧抽核读回）；③ **token 在位** ✓（复审签发）。

**授权面**：四波（W1 核机制 → W2 VSC ∥ W3 desk ∕ CLI → W4 锁 + 收口）。实施舱划分：**A**（核 ∕ rc 机制）· **B**（VSC 收编）· **C**（desk + CLI）· **D**（文档面）· **E**（锁件）——依赖序由调度器按 `files` ∕ `dependsOn` 自动排；`core/agent.mjs` 与 P2 三拆同档 ⇒ 本批核舱自动排队于其后（不手排）。
**边界**：产品码面 ∕ 文档面分舱；批内件 = tmp 先行 + 父侧 copy 收位（#545）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（实施舱 A（W1 + 3b + rc 构形单源）∥ B（W2 VSC 收编）∥ C（W3 desk + CLI 收编：1a 保名转口 ∕ CLI 转口化）∥ E（W4：锁件六面 6/6 绿 ∕ 注释六处读回）；各舱审计 1 轮 + 代码评审 1 轮 pass，终态 clean（详 5.5 ∕ 5.B5 ∕ 5.C5 ∕ 5.E4））



**（实施舱 A · W1 核机制 + 3b 链退役 + rc 内容构形单源 · 2026-09-29 · eng-coder）**

### 5.1 交付摘要（落点逐项 · 行数 = node split 口径）

| 项 | 档（file） | 前 → 后 | 改动（file:line） |
|---|---|---|---|
| 1a | `thincoder-core/tool-args.mjs`（新） | — → **74** | `describeToolArgs:16-73` 单源（体 = CLI 现体；默认分支简版切片 `:70`——登记差额）；档头 `:10-12` 差额句 |
| 3a-① | `thincoder-core/rules.mjs` | 124 → **261** | 扩六件：`mergeFileRules:74` ∕ `classifyRules:148` ∕ `loadScopedRules:160` ∕ `scopedRulesBlock:167` ∕ `matchesGlob:176`（+`simpleGlobMatch:187`）∕ `PATH_TOOLS:215` ∕ `matchCandidates:220` ∕ `injectScopedRules:238`；import 面 `:30` |
| 3a-② | `thincoder-core/agent/setup.mjs` | 253 → **257** | 尾块自持 `:242-251`（depth-0 门内、skills 清单后；`agent._rules` 同点缓存）；promptTail 参 `:45-48` ∕ 消费点退役；import `:13` |
| 3a-③ | `thincoder-core/agent/dispatch.mjs` | 245 → **254** | JIT 缝 `:224-229`（相位一末 ∕ 相位二前；`depth === 0` 门；打点 = `prepared` 非拒项 `{tool,args}`；注 `agent.history`）；import `:23-24` |
| 3a-④ | `thincoder-core/agent/assemble.mjs` | 115 → **112** | merge 内联块 → 核件调用 `:82`（`D.discoverRules` 注入缝保留）；import `:18` |
| 3b-① | `thincoder-core/agent.mjs` | 106 → **106**（Δ0） | `:85` 形参 `promptTail = null` 删 ∕ `:87` 实参删（P2 三拆后届盘坐标重锚） |
| 3b-② | `thincoder-core/agent/run-start.mjs` | 112 → **112**（Δ0） | `:17` 参删 ∕ `:51` 实参删（P2 三拆新增 hop——届盘重锚，核侧全链始净） |
| rc | `thincoder-render-core/subblocks/relay.mjs` | 141 → **174** | 增 `relaySubContentChunk:155-173`（逐字搬 desk `subChunkOf:116-133` 现体 + 四面 gate、非四面 ∕ 无前缀同口 `null` + ch 重导式；见修正轮 2 ④）；档头 `:4-6` 收正（R2 交接由 B7 2a 收口——W2 落地后为真） |
| 引文 | `thincoder-core/advisor/compaction.mjs` | 175 → **176** | `:156-157` 单源迁核（`../tool-args.mjs`；W3 落地限定） |
| 引文 | `thincoder-core/advisor/loop.mjs` | 289 → **289** | `:67` 同族收正（核单源） |

- 产品码零越舱：VSC ∕ desk ∕ CLI 文件与 `docs/**` 零触；核内 `promptTail` 零残留（grep 核收）。全档 ≤500（最大 rules.mjs 261，< 300 软线）。
- 届盘重锚声明（设计修正轮 1 ③「本档与 P2 三拆同档——届盘坐标按实施刻重锚」）：3b 核侧实点 = 6（agent.mjs ×2 + run-start.mjs ×2 + setup.mjs ×2）；`agent.mjs` 现盘 106 行（拆后，原「467 越线登记」随 P2 拆分消解）。

### 5.2 读数（W1 验收四组 + 追加四组）

读数件（tmp 先行——修正轮 1 ⑤ 同法）：`.thincoder/tmp/2026-09-29-parity-b7-w1-readings.mjs`（仓根 `node` 直跑）。

- ① **分类三例**：always = `["always","no-fm"]` ∕ scoped = `["docs-only","scoped"]` ∕ desc-only 两集皆无；**与 VSC 前身逐字对拍相等** ✓
- ② **JIT 命中**：hit1=1 ∕ dup=0 ∕ hit2=1 ∕ miss=0 ∕ toolMiss=0（`bash` 非 PATH_TOOLS 负例）；**与 VSC 前身对拍相等**（counts + 注入文本）✓
- ③ **尾块逐字**：核 ∥ VSC 前身 `byteEqual=true`（97 bytes）；`agent._rules` 缓存 always ∕ scoped 齐 ✓
- ④ **合并去重**：盘读 `["a","b","c"]`（文件规则置前 ∕ 同 pattern 去重）∥ VSC 前身对拍相等 ∥ 文件对象原样 ∥ 空集恒等 ✓
- ⑤ **tool-args（核 ∥ CLI）**：13/13 非默认分支逐字等；唯一异 = 已登记差额例（默认分支 CJK 截断）——非缺陷（修正轮 1 ⑨）✓
- ⑥ **rc 契约表**：四面 shape ∕ 嵌套 `sub` ∕ 无 `ch` 键 ∕ `null` 双义（无前缀 ∪ 非四面）∕ ch 重导式——8/8 checks ✓
- ⑦ **dispatch JIT 缝端到端**：depth0 → 注入 1 条 + 工具 `ok=true`；depth2 → 注入 0 ✓
- ⑧ **prepareRun 直驱**：depth0 尾块在且居 systemPrompt 末 ∥ depth1 零 ∥ `runAgent` ∕ `prepareRun` 函数源无 `promptTail` ✓
- `node --check` **10/10** ✓ + `import()` 装载 **10/10 零抛** ✓ + VSC `rules-face.mjs`（junction→核件）∥ desk `agent-bridge.mjs` 装载 ✓

### 5.3 相邻批次归档单测复跑

- **B5 装配锁**（`docs/batches/2026-09-29-parity-b5-assemble.test.mjs`）：**7/7 通过**——merge 抽取零行为变实证（调用序含 `discoverRules` ∕ streamRules 合并 ∕ 文件对象恒等）。
- **P2 锁**（`.thincoder/tmp/2026-09-29-core-hygiene-p2.test.mjs`）：3/5——两断言随 3b **代际失效**（`段 103-193 未按序逐行吻合` ∕ `run-start 签名缺落点：promptTail`）＝ P2 期状态快照，非回归信号（同 B1 锁口径；3b「全链删除」为设计裁定）。

### 5.4 决策透明表（与设计的差 ∕ 实施舱自决面）

| # | 决策 | 依据 |
|---|---|---|
| 1 | 3b 核侧实为 6 点（含 `run-start.mjs` 两处）——设计原坐标 `:102/:135` 为 P2 三拆前口径 | 修正轮 1 ③ 届盘重锚注 + 修正④「全链删除」；避免留死参面 |
| 2 | 尾块自持落 skills 门同块内置后（软点「可与 skills 门同块——实施舱定」） | 修正轮 1 ④ |
| 3 | `mergeFileRules(configRules, cwd, discover = discoverRules)` 第三参 = 可注入 discover——保 `DEFAULT_DEPS.discoverRules` 缝（U79 装配序机验） | 表行「merge 内联改核件调用」零行为要件；B5 锁 7/7 佐证 |
| 4 | tool-args 默认分支 = 码元 `slice`（简版切片）；档头已登差额 | 修正轮 1 ⑨ |
| 5 | rc 档头 ∕ advisor 两引文 ∕ tool-args 档头补「（W2 ∕ W3 落地后为真）」限定 | 内部审计观察 O1（前向陈述时刻性——三处描述 W2 ∕ W3 后始为真的状态） |

### 5.5 审计与代码评审轮次与终态

- **发散审计（explore）回合 1**：DEVIATIONS 1 行（记录面：§5 未写——本写入即闭合）+ 观察 O1–O3；逐项核收 5/5 声明属实（纯搬面逐字复核成立）。
- **自修复回合 1**：O1 落地（4 处「落地后为真」限定语：rc 档头 ∕ advisor ×2 ∕ tool-args 档头）——注释面，零行为。
- **代码评审（advisor · type=code）回合 1**：**VERDICT: pass**（🔴 0 ∕ 🟡 0 ∕ 🔵 4——四条咨询项）；受评盘面 = 自修复后落定态；评审后零编辑（保「交付 = 受评盘面」）。
- **终态 = `clean`**（零阻塞发现；🔵 咨询项留父侧 ∕ W2 ∕ W3 处置——见 5.6）。
- fix round：审计后自修复 1 轮；评审后 0 轮。

### 5.6 咨询项与边界诚实项

1. 评审 🔵#1：`dispatch.mjs` 缝注释未写「注入落 assistant tool_calls 与 tool 结果之间——线序依发送前 `normalizeToolPairing` 归一」——建议后续注释笔采纳（现形 = 原 VSC 派发前语义，勿顺手改）。
2. 评审 🔵#2：tool-args 码元截断可断代理对（展示面；`helpers.mjs safeSliceUTF16` 同族防护未用于此）——建议差额句补一项或加同式守卫。
3. 评审 🔵#3：`advisor/compaction.mjs:155-161` 悬空 JSDoc（既存形态，非本批引入）——建议重排 ∕ 标 as-of。
4. 评审 🔵#4：`rules.mjs` JIT 注入不带 `transient`、`_rulesInjected` 跨恢复重建 ⇒ 可重注入（与源端逐字一致，文本幂等无害）——建议档头补注。
5. 边界诚实项：`node --check` ∕ 读数 = 本席执行读数（已跑，见 5.2）；B1 归档锁两断言（`docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs:939 ∕ :750`）为设计修正轮 2 ⑤ 在册；P2 tmp 锁两断言代际失效（同口径）；批档措辞「`mergeStreamRules`」↔ 实落名 `mergeFileRules` 属 docs 面（W4/D 舱）；W4 锁件未落（E 舱 ∕ tmp 先行口径）。

**（实施舱 B · W2 VSC 收编：2a relay 换接 rc + 3a ∕ 3b 规则面退役与尾块链删 · 2026-09-29 · eng-coder）**

### 5.B1 交付摘要（落点逐项 · 行数 = read 口径）

| 项 | 档（file） | 前 → 后 | 改动（file:line——改后坐标） |
|---|---|---|---|
| 2a | `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | 271 → **223** | 事件面换接 rc 单源：`relayEventToSubPatch:94`（+ null 双义复核 `:107-108`——消费判定保形）；per-panel scope `_relayScopes:63` ∕ `relayScopeOf:64-68`（WeakMap 代两缓存）；`queuedInfoOf` 转口 `:73`；内容构形 `relaySubagentContentChunk:136-143`（rc `relaySubContentChunk:137` + `ch` 重导 `:139`）；import 面 `:38-39`；档头换接注 `:22-36` |
| 3a | `thincoder-vscode/src/agent/rules-face.mjs` | 120 → **0（删）** | 五件已上提核（A 舱）；`applyRuleTriggered` 孤儿随删（F4） |
| 3a | `thincoder-vscode/src/extension/rules.mjs` | 75 → **0（删）** | `matchesGlob` 上提核；`loadRules` 转口零消费 |
| 3a ∕ 3b | `thincoder-vscode/src/agent/setup.mjs` | 299 → **298** | import 改核件 `:26`（`mergeFileRules` ← `@thincoder/core/rules.mjs`）；尾块写点删（原 `:280-281`）；档头键面收正 `:6` ∕ `:10-11` |
| 3b | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 312 → **310** | 尾块链删三处（原 `:191` ∕ `:224` 两行 + 原 `:159` 注）；`coreOpts` 面 `:190-192`；装配写回面 `:222-224` |
| 引文 | `thincoder-vscode/src/agent.mjs` | 10 → 10（Δ0） | 档头键面句收正 `:5` |
| 引文 | `thincoder-vscode/src/agent/run-helpers.mjs` | 89 → 89（Δ0） | `:18-19` 引 `rules-face` 句收正（起手扫产出——3a 退役后失实） |

- 产品码零越舱：core ∕ rc ∕ desk ∕ cli ∕ `docs/**` 零触；`suspension.mjs` 零改（转口层保形——import 名 ∕ 调用形零改）。
- vsc src 残留词族零命中（`promptTail` ∕ `rules-face` ∕ `scopedRulesBlock` ∕ `injectScopedRules` ∕ `classifyRules` ∕ `loadScopedRules` ∕ `applyRuleTriggered` ∕ `matchesGlob`——全树读盘核，读数⑥）。

### 5.B2 读数（W2 验收面）

读数件（tmp 先行）= `.thincoder/tmp/2026-09-29-parity-b7-w2-readings.mjs`（全量输出存 `…-readings.out.json`；baseline 快照三件同目录 `-baseline-relay.mjs` ∕ `-baseline-rules-face.mjs` ∥ `-baseline-rules-shell.mjs`——改写前现盘逐字 + import 行绝对化）。

- ① **relay 语料对拍**（baseline ∥ rc 换接后）：51 步语料（事件面全分支 + 嵌套剥除 + 表外 ∥ 非本面边界 + plain ∕ sync 两面板形态）——返回值序列逐字等 ∥ **27 条 webview 载荷 JSON 逐字等**（掩码仅 `startedAt` 时间戳——非行为面）；零首差 ✓
- ② **内容面语料对拍**（并入 ① 序列）：四面 + 非四面 + 嵌套 + 重复 + `b` 缺省 ∕ >120 截断 ∕ 对象形——载荷逐字等 ✓
- ③ **`queuedInfoOf` 形对拍**（并入 ① 序列）：queued 四形 ∥ started ∕ cancelled ∕ 终态清点 ∥ 缺省降级——逐字等 ✓
- ④ **尾块文本逐字对**（核件 ∥ 前身快照）：`byteEqual=true`（97 bytes）✓；**JIT 命中对拍**（counts [1,0,1,0] ∥ 注入文本）与前身逐字等 ✓
- ⑤ **JIT 缝复归读数**（VSC 形态 agent——`depth` 门）：depth0 → 注入 1 条 + 工具 `ok=true`；depth2 → 注入 0 ✓
- ⑥ **静态面核**：残留词族零命中 + 消费档 import ∕ 转口名单 ⊆ 本档导出面（panel-callbacks ∕ panel-messages-turn ∕ chat-panel ∕ suspension 四处零缺）✓
- `node --check`：**vsc 全树 133 JS files OK**（`npm run lint` = check-syntax 遍历）✓
- vsc `npm test`：零测试 = green（全清重置口径——清单空）✓

### 5.B3 决策透明表（与设计的差 ∕ 实施舱自决面）

| # | 决策 | 依据 |
|---|---|---|
| 1 | relay 实落 223 行（设计预期 ≈235–250）——差值 = 双缓存实现退役（~22 行）+ 事件面分支持平（~35 行）净效果；零功能删减 | 表行「≈」= 估数；读数全绿佐证 |
| 2 | 事件面消费判定 = 「快筛 + rc patch + null 复核」而非单用 rc `isRelayToken`——保形换接前语义（字面在文本中段的内容 chunk 仍走内容面；`isRelayToken` 单判会吞该类 chunk） | 设计「保形」口径；对拍①逐支零差实证 |
| 3 | `startedAt` 对拍掩码（`<ts>` 归一）——时间戳非行为面；原值均 number 另断言 | 对拍件内部口径（报告列明） |
| 4 | 档头 ∕ 注释中死名（`promptTail` ∕ `rules-face`）一律语义化改写（「尾块键退役」等）——词族扫描零命中 | 修正轮 1 ⑥ 起手扫词族；零命中 = 硬判据 |
| 5 | `run-helpers.mjs:18` 注释收正（任务书点名面之外——起手扫产出：「引被改面者逐处核」） | 修正轮 1 ⑥ 扫描域声明；vsc 树内、零行为 |

### 5.B4 边界诚实项

- baseline 快照三件的 import 行改写为绝对 file URL（tmp 位置解析需要）——语义零改，件内注释已标。
- A 舱 tmp 读数件（`2026-09-29-parity-b7-w1-readings.mjs`）∥ vsc `.thincoder/tmp` r10 探针引用已删档（rules-face ∕ extension/rules）——**代际失效**（复跑失据，非回归；同 B1 归档锁口径）。
- desk ∥ VSC 在「字面在文本中段」边界的**行为差为换接前既有态**（desk `isRelayToken` 吞 ∕ VSC 转内容面）——本舱保形未对齐；登记观察（父侧裁）。
- W4 锁件（`docs/batches/2026-09-29-parity-b7-minor.test.mjs`）= E 舱；本舱读数件为 tmp 先行，**未收位**。

### 5.B5 审计与代码评审轮次与终态（实施舱 B）

- **发散审计（explore）回合 1**：**零 DEVIATIONS**（四类偏差逐类核证全无——部分实施 ∕ 静默简化 ∕ 文档漂移 ∕ 表外改动）；观察项 5 条（O1 与设计估值差 ∕ O2 前导零 id 不可达 ∕ O3 docs/vsc 收正靶面 = W4/D 舱 + 两档未被设计点名 ∕ O4 代际失据件同 5.B4 ∕ O5 窗口甄别表外零）。审计边界：无执行面（对拍 ∥ lint 为读回级复核，非重跑）。
- **自修复回合**：0 轮（零 DEVIATIONS；观察项无产品码动作项）。
- **代码评审（advisor · type=code）回合 1**：**VERDICT: pass**（无 🔴；🟡 1 = 文件档行数 advisory（panel-turn-loop 310——既有债；本批 312 → 310 未增）；🔵 4 = 同一 token 双解析微效 ∕ ch 重导前提注 ∕ 文法副本漂移锁（W4/E 舱）待落 ∕ 设计估值对账（W4 文档面））——全 optional；**处置 = 逐条响应（接收现状 ∕ 零动作）**，响应表见交付报告。
- 受评盘面 = 审计后落定态；**评审后零编辑**（保「交付 = 受评盘面」）。
- **终态 = `clean`**；fix round：审计后 0 轮 ∕ 评审后 0 轮。

### 5.B6 咨询项与边界诚实项（实施舱 B）

- 评审域外注记（不赋定级 ∕ 父侧或 W4 处置）：B1 归档锁 G7 失据点多于设计修正轮 2 ⑤ 在册两条（补点面）· tmp 探针代际失效面 · 相邻档注释坐标滞后面 · rc 注句面——逐条见交付报告。
- 评审报告带宿主引文核验注 1 条（评审自身引用格式面，不涉产品发现）——本舱事实均以本席自读与盘上读数为准。
- 其余同 5.B4（代际失效件 ∕ desk ∥ VSC 边界行为差登记 ∕ W4 锁未落）。

**（实施舱 C · W3 desk + CLI 收编：1a 保名转口 ∕ CLI 转口化 · 2026-09-29 · eng-coder）**

### 5.C1 交付摘要（落点逐项 · 行数 = node split 口径）

| 项 | 档（file） | 前 → 后 | 改动（file:line——改后坐标） |
|---|---|---|---|
| 1a-desk | `thincoder-desktop/src/main/agent-bridge.mjs` | 334 → **318** | `summarizeArgs` 本体（原 `:67-86`）删 → **保名转口** `:67-70`（注 `:67-68` + `import { describeToolArgs as summarizeArgs } from "@thincoder/core/tool-args.mjs"` `:69` + `export { summarizeArgs }` `:70`）；档头句收正 `:5`（「B7 1a 保名转口——体 = 核件单源」）；调用面 `:214` 零改（原 `:230`——删件自然平移） |
| 1a-cli | `thincoder-cli/src/tui/tool-args.mjs` | 85 → **24** | 转口化：`export { describeToolArgs } from "@thincoder/core/tool-args.mjs"` `:14`；`toolArgsLines` 留端 `:20-23`；`sliceByWidth` import 删（`render.mjs` 其余消费零触）；档头重写 `:1-12`（转口族 + 已登记差额句 `:9-11`） |
| 零改核验 | desk `agent-host.mjs` ∕ `suspensions.mjs` ∕ `main.mjs` | Δ0 | 三消费面零改实读：`agent-host.mjs:53` 转口句 ∕ `suspensions.mjs:16` import（mtime 先于批——零改硬证）∥ `:57` 调用 ∕ `main.mjs:15` 启动链 |
| 夹具（tmp 先行） | `.thincoder/tmp/2026-09-29-parity-b7-w3-readings.mjs` ∕ `…-electron-stub.mjs` ∕ `…-cli-args-prev.mjs`（新） | — | ①读数三组 ②electron 桩（十字名面闭集——对 main 图 `from "electron"` 实读逐名吻合）③旧档快照（import 行绝对化；溯源三方对账 = 全等，85 行） |

- 产品码零越舱：core ∕ rc ∕ vsc ∕ `docs/**` 零触；`suspensions.mjs` 确零改（Δ=0，与修正轮 1 ① 收正一致）。
- CLI 行数估差披露：实落 24（设计预期 ≈35——估差 11 = 转口行 + `toolArgsLines` 留端的真实下限；零功能删减，见 5.C3-#2）。

### 5.C2 读数（W3 验收面）

读数件：`.thincoder/tmp/2026-09-29-parity-b7-w3-readings.mjs`（仓根 `node` 直跑）。

- ① **desk 摘要采样（6 工具族）**：bash ∕ read ∕ grep ∕ subagent ∕ memory ∕ unknown——`bridge.summarizeArgs === core.describeToolArgs` **恒等** + 逐族输出逐字等 ✓
- ①追 **两消费面实跑**：桥 `onToolCall` ⇒ `ev:tool-call` `argsSummary = "ls -la  (in d)"`（= 核件同函数）✓；待决门 `askSingle` ⇒ `ev:approval` `argsSummary = "\"x.mjs\""`（= 核件同函数）✓
- ② **CLI 标题行对拍**（旧档快照 ∥ 新转口）：20 例——**18 等 ∕ 2 差**；两差恰为默认分支全角截断（>80 ∕ >160 两档续接点异）= 修正轮 1 ⑨ **已登记差额**；`toolArgsLines` 新旧逐字等 ✓；`next.describeToolArgs === core.describeToolArgs` 恒等 ✓
- ③ **装配链装载**：无桩平 node = electron CJS 命名导出拦路（`SyntaxError: Named export 'protocol' not found`——实证记录）；electron 桩 + `registerHooks`（先例 = `test/rc-resolve.mjs`）后 **`main.mjs` → `agent-host.mjs` → `agent-bridge.mjs` 全链装载 + 名面全解析**（`createAgentHost` ∕ `summarizeArgs` ∕ `parseEvToken` ∕ `ACTIVITY_EVENTS` 逐层 function ∕ array）✓
- `node --check`：两产品档 **OK** ✓；平 node `import()` 装载追加：`suspensions.mjs` ∕ `tool-events.mjs` ∕ `startup.mjs` ∕ `subagent-blocks.mjs` 全解析 ✓

### 5.C3 决策透明表（与设计的差 ∕ 实施舱自决面）

| # | 决策 | 依据 |
|---|---|---|
| 1 | desk 转口对（import + export）落原函数位（`:67-70`，中段 import）——非置 import 区 | 修正轮 1 ①「`:68` 名面存续、体改核调」写定形逐字落位；ESM import 声明提升 ⇒ 语义零差（`:214` 调用面零改硬证） |
| 2 | CLI 实落 24 行（预期 ≈35）——差值 = 转口行 + `toolArgsLines` 留端的真实下限（原 57 行体全部迁核） | 表行「≈」= 估数；零功能删减（读数②） |
| 3 | 装配链判据 = electron 桩（`registerHooks`）——非直装 | 平 node 无 Electron 运行时（无桩 = 装载拦路，读数③实证）；桩 `requestSingleInstanceLock ⇒ false` 走 `main.mjs:70-73` 非主实例径（零窗口 ∕ 零通道注册），判据只证链路 |
| 4 | CLI 差额句落档头（机制句单源指核件档头）——不自造保形包装 | 修正轮 1 ⑨；对拍②证「已登差额外零变」 |
| 5 | 档头句（desk `:5` ∕ CLI `:1-12`）随收编收正 | D6 ∕ 注释与代码一致；零行为 |

### 5.C4 边界诚实项

- 坐标平移披露：desk 调用面 `:230 → :214`（删 20 行 + 转口 4 行的自然平移；修正轮 1 ① 的 `:230` 为改前口径，调用正文零改）；批档他舱面平移供 W4/D 档：`tool-events.mjs:155 → :158` ∕ `subagent-blocks.mjs:340 → :345`（`startup.mjs:86` 仍准）。
- 装配链判据 = 桩后 in-process 装载（真 Electron 运行时行为不在射程——端口径）；`report()` 仅 `--smoke` 写 stdout（`main.mjs:51`）⇒ 读数 stdout 零污染。
- 快照溯源：`cli-args-prev.mjs`（import 行归一后）↔ 现盘旧档 ↔ `git HEAD` **三方全等**（85 行）——对拍基线保真硬证。
- 未跑仓套件（**not repo-suite verified**——全清后重建期；父侧收口轮为唯一套件运行口径）；W4 锁件未落（E 舱 ∕ tmp 先行口径）。

### 5.C5 审计与代码评审轮次与终态（实施舱 C）

- **发散审计（explore）回合 1**：DEVIATIONS 1 行（记录面：§5 未写——本块写入即闭合）；代码面三类（部分实现 ∕ 静默简化 ∕ 越表改动）**零命中**；越界核查 = 无未报越表改动（改动集 = 两产品档 + tmp 三件）；观察 2 条（CLI 行数估差 ∕ `renderer/subagent-reduce.mjs:28` 既存失靶坐标——先于 W3）。审计边界：无执行面（读数 ∕ 装载为静态推演级复核）。
- **自修复回合 1**：本 §5 块 + §5 状态行（记录面闭合）——零代码编辑。
- **代码评审（advisor · type=code）回合 1**：**VERDICT: pass**（🔴 0；🟡 1 = desk 318 行（split ∕ 净行 317）越 300 顾问线（在册拆分债 ∕ 净减 17 行 ∕ 非必修）；🔵 3 = ②差额句未含「码元切可断代理对」第二后果 ∕ ③读数夹具版本相关全等断言 + 硬编 ROOT ∕ ④快照夹具 import 改写未标）——全 optional；**处置 = 接收现状 ∕ 零动作**（保「交付 = 受评盘面」）。
- 受评盘面 = 审计后落定态；**评审后零编辑**。
- **终态 = `clean`**（零阻塞发现；🟡 在册债 + 🔵 三条咨询项留父侧——见 5.C6）。
- fix round：审计后 1 轮（记录面）∥ 评审后 0 轮。

### 5.C6 咨询项与边界诚实项（实施舱 C）

1. 评审 🟡#1：desk `agent-bridge.mjs` 318 行（split；净行 317）> 300 顾问线——**在册拆分债**（批档 `:116`「越 300 软线——登记续期」）；本批净减 17 行，零动作（拆分后续批择机）。
2. 评审 🔵#2：CLI 差额句（`:9-11`）可补「码元切可断代理对（展示面）」——同 A 舱 §5.6-2 同族；建议后续注释笔采纳（核件面 = A 舱）。
3. 评审 🔵#3：读数夹具环境耦合两处（`:139` 版本相关全等断言——不参与真判据 `nameChainResolved` ∕ `:18` 硬编 ROOT）——夹具面、非产品码；可选修（稳定子串断言 ∕ `import.meta.url` 相对化）。
4. 评审 🔵#4：快照夹具 import 行改写无件内标记（B 舱先例「件内注释已标」）——可选补注（溯源 ∕ 诚实面）。
5. 评审范围外注记（不赋定级 ∕ 供 W4/D 舱路由）：
   - **新文档靶（不在修正轮 ①⑥ ∕ ②③ 收正清单内——起手扫产出）**：`docs/desktop/design/IPC.md:84`「核内无此单源，端各自实现」——1a + W3 后失实（单源迁核；desk = 保名转口）；`docs/cli/design/TUI-TOOL-OUTPUT.md:47`（`describeToolArgs`（`:18`））∕ `:50`（`toolArgsLines`，`:81`）∥ `docs/core/design/CORE-UNIFICATION.md:1294`（引 CLI `:18` 作「展示面单源」）——坐标成死指针（现盘 = 转口 `:14` ∕ `toolArgsLines:20-23`）。
   - A 舱「（W3 落地后为真）」限定语（`core/tool-args.mjs:5-7` ∕ `core/advisor/compaction.mjs:157` ∕ `core/advisor/loop.mjs:67`）随 W3 落地已成立——W4 收正时可去限定（核面，非本舱）。
   - `thincoder-desktop/renderer/subagent-reduce.mjs:28` 注释坐标（`agent-bridge.mjs:212-216`）既存失靶——先于 W3，非本舱导入。
6. 边界诚实项：`node --check` ∕ 读数 = 本席执行读数（已跑，见 5.C2）；文件表「预期」列偏差已披露（CLI 24 vs ≈35；desk 318 ∈ ≈316–318 ✓）。

**（实施舱 E · W4 锁件舱：1c 四面锁 + 顺并两面 + 注释六处 · 2026-09-29 · eng-coder）**

### 5.E1 交付摘要（落点逐项）

| 项 | 件（file） | 前 → 后 | 改动（file:line——改后坐标） |
|---|---|---|---|
| 锁（1c 四面 + 顺并两面） | `.thincoder/tmp/2026-09-29-parity-b7-minor.test.mjs`（新——tmp 先行 ∕ #545；终位 = `docs/batches/2026-09-29-parity-b7-minor.test.mjs`，父侧 copy 收位） | — → **387** | 六面：F1 relay 换接同绑定（2a）`:132` · F2 文法副本漂移锁（F6 · RM-4 复建）`:149` · F3 结果摘要 rc ∥ CLI（掩码 = 登记端差）`:195` · F4 CLI `routeSubToken` ∥ rc `relayEventToSubPatch`（2c）`:279` · F5 尾块逐字 `:332` · F6 rules 面三组 `:350` |
| 注 1 | `thincoder-core/tool-args.mjs:5` | 去「（W3 落地后为真）」限定（条件已满足，语义不变） | 注释级、零行为 |
| 注 2 | `thincoder-core/advisor/compaction.mjs:157` | 同位去限定 | 同上 |
| 注 3 | `thincoder-core/advisor/loop.mjs:67` | 同位去限定 | 同上 |
| 注 4 | `thincoder-desktop/renderer/subagent-reduce.mjs:28` | 坐标收正：`agent-bridge.mjs:212-216 → :261-265`（`onSubagentApproval` 现位实读；同注释 `state.mjs:190-201` ∕ `activity.js:133-136` 复核仍准、未动） | 同上 |
| 注 5 | `thincoder-vscode/src/extension/panel-callbacks.mjs:32-35` | 消费坐标系收正：`panel-messages-turn.mjs:24`（`:123` 调用）· `suspension.mjs:38`（`:94`）· `panel-messages.mjs:35`（`:328`）· `WV_OUTBOX_MAX` 零消费（机器面随 2026-09-28 测试全清退役） | 同上 |
| 注 6 | `thincoder-cli/src/tui/tool-args.mjs:11` | 差额句补半句「码元切可断代理对（展示面）」（§5.C6-2 ∕ A §5.6-2 同族） | 同上 |
| 夹具 | `.thincoder/tmp/2026-09-29-parity-b7-w4-probe.mjs`（scratch——预演用毕已删） | — | 零留存 |

- **依赖件**（锁装载面）：`.thincoder/tmp/2026-09-29-parity-b7-w2-baseline-relay.mjs` ∥ `-baseline-rules-face.mjs`（W2 前身快照，在册）；F5/F6 语料夹具 = A 舱 W1 读数件夹具逐字复用（零新造语料 ∕ 零新注入缝——父侧顺并条件成立）。
- 产品码零越舱：六处均注释级；`docs/**` 零触；A ∕ B ∕ C 舱机制面零触。

### 5.E2 读数（W4 验收面）

- `node --test .thincoder/tmp/2026-09-29-parity-b7-minor.test.mjs`：**6/6 全绿**（F1–F6；含追加面后三复跑同绿——末轮 = 收口态）。
- `node --check` **7/7 OK** = 锁件 + 六注释档；六处注释逐处读回 ✓（坐标见 5.E1）。
- **终位解析预证**：`new URL("../../…")` 自 `.thincoder/tmp/` ∥ `docs/batches/`（同两层深）对四依赖路径 8/8 全中——父侧 copy 后同命令直跑。
- 面内要点：F1 = W2 读数件 51 步计划逐字移植 + 掩码仅 `startedAt`（值另断言 number）+ 换接结构锚（VSC 取值自 rc 单源）；F2 = RM-4 复建（10 例 deepEqual + 正则 `.source` 恒等）；F3 = 30 例 + 掩码自证 4 行 + 登记端差三行显式断言（含 `verify` 射程边界）；F4 = 九类语料 14 例 + 边界 6 例 + queued 三可比项（`waiting` 列外）；F5 = byteEqual + 冻结 97 + `_rules` 缓存 + `prepareRun` depth 门；F6 = 分类 ∥ JIT（[1,0,1,0,0]）∥ 合并（["a","b","c"] ∕ 对象恒等 ∕ 空集恒等）。

### 5.E3 决策透明表（与设计的差 ∕ 实施舱自决面）

| # | 决策 | 依据 |
|---|---|---|
| 1 | 锁四面取**批档版**（relay 同绑定 ∥ 文法 ∥ 摘要 ∥ CLI 映射）；派单「尾块 ∥ rules」版为父侧合成、作废 | 父侧 spawn 回信裁定「取批档版四面（批档 `:55` §2.2.1 1c 原文）」 |
| 2 | 顺并两面成六面（F5 尾块 ∥ F6 rules 三组） | 父侧裁定条件 = 从 A 舱读数件直接复用（零新造语料 ∕ 零新注入缝）——夹具逐字复用 ∥ 期望值取 §5.2 读数，条件成立 |
| 3 | F3 掩码② 落形 = 折叠为 `«status»`（presence 保真、措辞归一），非整族剪除 | 修正轮文本用「折叠」；presence 保真优于剪除（剪除会吞「单侧缺失」信号） |
| 4 | F4「九类」定义 = `RENDER-CORE.md` §5 表九行（async ∕ [model]∥started ∕ queued ∕ turn ∕ cancelled∥stopped→cancelled ∕ settled ∕ done ∕ 表外⟦ev⟧）；缺字段降级形 ∥ 嵌套面 = 列外 | §5 全表（`:180-191`）＋ 2c 句「嵌套面 = CLI 独有载位（列外）」（批档 `:75`） |
| 5 | F1 追加换接结构锚（2 行）+ F3 掩码自证（4 行） | 内部审计观察 O4（整档回退不触红——收口）；判别力自证先例 = B2 锁负控 |
| 6 | 锁件越 300 顾问线（387 行）——不拆件 | 批档裁定锁 = 单一批次件（名随批次档）；六面顺并为父侧裁定成因而非膨胀（详 5.E5 响应 #1） |

### 5.E4 审计与代码评审轮次与终态（实施舱 E）

- **发散审计（explore）回合 1**：**零 DEVIATIONS**（四类偏差逐类核证全无）；观察 O1–O7（rc `:5` 限定语遗留 ∥ §5 未写——本块闭合 ∥ 终位 copy 待父侧 ∥ F1 结构面缺 ∥ F3 掩码串级 ∥ 核件差额句 ∥ F4 内态子集）；审计边界：无执行面（只读——`node --test` 6/6 与 `node --check` 7/7 为本席执行读数）。
- **自修复回合 1**（审计响应）：F1 追加换接结构锚（O4 收口）——零产品码。
- **代码评审（advisor · type=code）回合 1**：**VERDICT: pass**（🔴 0；🟡 3 ∥ 🔵 5——全 optional ∕ 未标「必修」）；受评盘面 = 自修复后落定态；**评审后零编辑**（保「交付 = 受评盘面」；响应表见 5.E5）。
- **终态 = `clean`**；fix round：审计后 1 轮 ∥ 评审后 0 轮。

### 5.E5 响应表 ∥ 咨询项与边界诚实项（实施舱 E）

| # | 评审发现（级） | 处置 | 依据 |
|---|---|---|---|
| 1 | 锁件 387 行越 300 顾问线（🟡——批档估 ≈180–220 = 四面版估值） | 接收 ∕ 记录（不拆） | 批档裁定锁 = 单一批次件；六面顺并 = 父侧裁定成因（5.E3-2）——行数估差本表在册 |
| 2 | 对拍基线仅 tmp 硬引（清 tmp ⇒ 断；P2 先例 = 三级回退链）（🟡） | 接收（设计锚定） ∕ 父侧路由 | 设计自身锚定 tmp 在册件（W2 快照）；耐久化 = 后续一笔（回退链 + 收位同笔复制两 baseline）——非本批必需 |
| 3 | `panel-callbacks.mjs` 317 行越 300 线（🟡） | 接收 ∕ 在册债 | 既有债（本笔零增长）；同批「越 300 软线——登记续期」先例 |
| 4 | `core/tool-args.mjs:7` advisor 注入面现盘无注入点（🔵） | 记录 ∕ 后续注释笔 | 状态已在册（`CORE-UNIFICATION.md:1294` ∕ `:1331`「两端未接（2026-09-28 实核）」）；建议后续笔补「（注入点——两端未接）」限定 |
| 5 | `loop.mjs:68`「未注入 ⇒ 不发进度行」与 `:233-236` 实作相抵（🔵） | 记录 ∕ 后续注释笔 | 实核成立（`:236` 无条件发 ∕ 缺省空串 ⇒ 仅余工具名）；零行为 |
| 6 | `compaction.mjs:155-161` 悬空 JSDoc（收正 `:157` 未归位）（🔵） | 记录 | 既存形态（A 舱 §5.6-3 在册）；本笔 = 限定语去字、未扩面 |
| 7 | F3「判别力」仅单对人造例（🔵） | 记录 | 真语料漂移见证可作后续笔（零新造语料） |
| 8 | 夹具 mkdtemp 不清理（🔵） | 记录 | W1 读数件同例；tmp 面、非产品面 |

- **边界诚实项**：`node --test` ∥ `node --check` ∥ 终位解析预证 = 本席执行读数（见 5.E2）；**not repo-suite verified**（全清后重建期——父侧收口轮为唯一套件运行口径）；rc `subblocks/relay.mjs:5` 仍携「（W2 落地后为真）」（同族第四处——非本舱六处清单内，D 舱列报②在册，父侧路由）；B1 归档锁两失据断言 = 历史件口径（设计修正轮 2 ⑤ 在册）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（五舱全落）**：
- A 码舱（1a 工具参数摘要上提核 + 3a/3b rules 搬家与载位承接 + promptTail 退役）；
- B 码舱（2c VSC relay 换接 rc——同绑定换接）；C 码舱（desk 保名转口 ∕ CLI 转口化）；
- D 文档舱（W4 文档收正六处：`core/design/WORKSPACE.md` 六行区 ∕ `desktop/design/IPC.md:84` ∕ `cli/design/TUI-TOOL-OUTPUT.md` 死坐标四处 ∕ `core/design/CORE-UNIFICATION.md:1294 ∕ :1331` ∕ `mergeStreamRules ⇒ mergeFileRules` 措辞 ∕ rc 档头句已落核）；
- E 锁件舱（W4 锁件六面 6/6：批档 1c 四面 + 父侧裁定顺并两面（尾块 ∥ rules——A 舱读数直复用成立）＋ 注释六处收正——含三处「（W2/W3 落地后为真）」限定语去限定 + 两处坐标收正 + CLI 半句补）。

**验证（父侧）**：锁件终位亲跑 `docs/batches/2026-09-29-parity-b7-minor.test.mjs` **6/6** ✓（用例已转正 · 两 baseline 快照留 `.thincoder/tmp/` 为装载依赖 · 在册）；五舱审计 ∕ 代码评审全 pass（B/E 两舱含 fix 轮复绿）；**not repo-suite verified**（父侧收口轮为唯一套件口径）。

**残留（转出在册 · 不阻塞）**：① rc `thincoder-render-core/subblocks/relay.mjs:5` 「（W2 落地后为真）」限定语一处（E 舱列报——同族第四处）；② D 舱列报三件：`docs/core/design/ADVISOR-GUARDS.md:369` 死指针（CLI `tool-args.mjs:51` ⇒ 核 `:49`）· 设计档收正靶六处未落（`RENDER-CORE.md:151 ∕ :176-178` · `WEBVIEW.md:255 ∕ :281 ∕ :291 ∕ :615` · `WEBVIEW-PROTOCOL.md:415-417 ∕ :425`）· rc ∕ core 限定语（承①）——归下一文档回填轮；③ E 舱评审咨询项 8 条（§5.E5 在册）。

**结算（D7）**：**#571 → 已核销**（依据本节 + 各舱 §5）。**状态行**：已收口 2026-09-29。
