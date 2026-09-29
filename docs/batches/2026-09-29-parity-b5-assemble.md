# 2026-09-29 · parity-b5-assemble
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户全修令 + parity-closeout §2 归批表 B5（装配序上提）——annex :68 :69 + 重造⑨ + 上提⑤ + 未核②。
> 台账 = #570（core ∕ desk · 归批）。前情 = `docs/batches/2026-09-29-parity-closeout.md` §2 归批表 **B5**（全修令下）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:4x）
- **来源**：用户**全修令** + `parity-closeout` §2 归批表 **B5**。
- **射程**：annex `:68`（装配序——core `setup.mjs:42` 仅 `prepareRun`；desk `agent-assemble.mjs:4-15` 自持）· `:69`（团队层取值 `:35/:43/:49`）· 重造⑨ + 上提⑤ + 未核②（CLI 装配点先勘察）。
- **口径**：形取三端实盘；核形不乱动；行为零变对拍。
- **台账**：#570。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（评审 #72 修正轮十条逐条落位（段内就地修正 + 修正块 = §2.11；1..10 收口表在册））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**（设计轮交付 · parity-b5-assemble · 2026-09-29 · eng-designer）**

> **口径**：设计 = 本节自持（先例 = parity-b2-queued §2）；实施 = 单轮 eng-coder（改动集 = core 新档 + desk ∕ CLI 两档 + 锁档）；**设计档收正 = §2.8（转单，未随本设计轮落笔）**。行坐标 = `docs/batches/2026-09-29-parity-closeout.md` §2 ∕ annex 行号；路径略记 core=`thincoder-core/` · desk=`thincoder-desktop/` · cli=`thincoder-cli/` · vsc=`thincoder-vscode/`。**行数口径 = 内容行**（read 工具「N lines total」含末空行恰 +1——同 parity-b2-queued §2.8-N2）。证据 = 本批实读（2026-09-29 04:4x–05:1x，read ∕ grep ∕ glob）。

### 2.1 本批条目（覆盖）与边界

| # | 条目（归批行） | 面 | 落点 |
|---|---|---|---|
| C1 | 行 `:68`（装配序）· 重造⑨（`:137`）· 上提⑤（`:167`）——**装配序上提**（desk ∕ CLI 两造 ⇒ 核单源） | 实施（本批） | §2.3–2.6 |
| C2 | 行 `:69`（团队层取值：`teamConfig` ∕ `gitAuthor` ∕ `validateProvider` 端本地）——**上提核单源** | 实施（本批） | §2.2–2.6 |
| C3 | 未核②（`:190b`）——**CLI 装配点勘察闭合**（`subagent-blocks` 内部 = B7 面，零触） | 勘察（本批） | §2.2 |
| C4 | 行为零变对拍（装配序 = 启动路径 · 判据要实）——**批次本地对拍锁**（全清令新规形） | 实施（本批） | §2.4 ∕ §2.5 |
| C5 | 受影响文件表（core ∕ desk ∕ cli）+ 实施序 | 档面 | §2.6 |
| C6 | §2 落盘（本 append + 状态行） | 档面 | 本批 |

- **validateProvider 去留裁定（2026-09-29 父侧回执）**：**纳入**——依据三层（全修令判据「用户可见端差 = 缺陷；唯一例外 = 宿主能力面须实证」——留端方未给实证；上提⑤ ∕ closeout `:69` 为较新处置且证据列点名 `:49`；不可观察实证成立——§2.4-③）；留端方两处（`desktop-flow-vsc-align.md:313/:317` ∕ `desktop-impl-8.md:206/:343`）= 已收口批档历史记录，**不回溯改**（本批仅活档面收正——§2.8）。
- **边界**：① **VSC 零触**（零面实证——§2.2；其 fork 面归 B1）② **核机制零重设计**（纯搬 + 转口 + 注入缝；`setup.mjs` ∕ `agent.mjs` 零改）③ B1（run-stages 族）∕ B2 ∕ B4 射程零触 ④ `probeTargetFromEntry`（desk `settings-panel-write.mjs:52`）归 B10——零触 ⑤ annex ∕ 台账 ∕ 需求档零触（需求档两处收正 = 主 agent 笔，§2.8）⑥ 零 UI 面（无交互决策）。

### 2.2 三端装配序现状表（C3 · 勘察 · 逐处 file:line）

| 端 | 装配序载体（现读） | 序（实读） | 团队层取值 | 后装配面 | 消费点 |
|---|---|---|---|---|---|
| **核** | `core/agent/setup.mjs`（240）——**仅 `prepareRun:42`**（每 run pre-flight：上下文注入 ∕ system prompt ∕ 工具注入）；`core/agent.mjs` `createAgent:63`（纯工厂）∥ `runAgent:102`（`:131` 调 prepareRun） | **无装配序**（closeout `:68` 实读复核 ✓） | 无（无 `teamConfig` ∕ `gitAuthor`） | 无 | 核内（runAgent 链） |
| **desk** | `desk/src/main/agent-assemble.mjs`（103）：`assembleFor:58-100` + `DEFAULT_DEPS:28-31` + `teamConfig:35-40` ∕ `gitAuthor:43-45` ∕ `validateProvider:49-54`；缝尾 `installExecRunSeams():103` | 配置(`:60`) → 代理注入(`:63-65`) → 记忆+embedder(`:67-71`) → 文件规则(`:72-77`) → 记忆层〔项目(`:78-82`) + 团队(`:83-88`)〕 → 工具(`:89-92`) → 代理+三字段(`:93-96`) | **端本地**：`teamConfig`(`:35-40`) ∕ `gitAuthor`(`:43-45`)——档头自注「端本地最小实现 ∕ 不引他端模块」(`:33` ∕ `:42`) | `_slot`(`:97`) → `validateProvider(agent, config)`(`:98`) | `agent-host.mjs:47`（import）· `:55`（re-export 五名）· `:91`（`assemble = assembleFor` 注入面）· `:153-158`（`assembleAndLoad`：cwd = `projects.currentCwd():154`；装配后 `loadAgentSlot:156`——槽装载留端） |
| **CLI** | `cli/src/cli/make-agent.mjs`（215）：`assembleAgent:24-138` + `applyToolExclusions:16-21` + `attachManifest:163-176` + `validateProvider:185-198` + `teamConfig:201-206` ∕ `gitAuthor:209-215` | 配置(`:25`) → 代理注入(`:30-33`) → 记忆+embedder(`:35-40`) → cwd=`process.cwd()`(`:41`) → 文件规则(`:44-49`) → 记忆层〔项目(`:51-56`) + 团队(`:58-63`)〕 → 工具(`:64`) → **MCP 面**（`.mcp.json` 合并+连接+警告 `:66-110` · CLI 独有） → 代理+剔除+三字段(`:112-124`) → `attachManifest(:129`) → `validateProvider(:132`) + config 覆盖(`:134-136`) | **端本地**：同两函数（**逐字同构**——desk `:35-40` ≡ CLI `:201-206`；desk `:43-45` ≡ CLI `:209-215`，仅 `config.` ∕ `config?.` 差一级） | `_mcpWarnings`(`:124`) + `attachManifest`(`:129`，M1 钩子——CLI 独有) | `command-interactive.mjs:12`（import 五名）· `:32` ∕ `:123`（两装配点）· `:149`（修复后复验——**清标径实消费**）· `:151-155`（`_mcpWarnings` 消费）；`acp.mjs:28` · `:75`（`excludeTools: ACP_EXCLUDED_TOOLS`） |
| **VSC** | `vsc/src/agent/setup.mjs`（428）：`buildTopLevelAgent:80`（纯对象工厂）+ `hydrateRun:113`（每轮 reconcile）+ `setupAgentRun:424-427`——fork 形 | 无核装配序调用；装配 = 端壳 hydrate（序面归 B1——`:33` ∕ `:37` ∕ `:181`） | **零面**：`vsc/src` 全树对 `createAgent` ∕ `assembleBuiltinTools` ∕ `teamConfig` ∕ `gitAuthor` ∕ `memory.team` **零命中**（本批 grep）；memory 面 = 工具级 `memory-tool.mjs:79` `memoryFor(cwd)`、`:84` 恒 `author:"unknown", team:null`；项目层 sync 仅索引面 `embed-config.mjs:177-178` | — | — |

**差额点（desk ∥ CLI 同序面 · 上提归一对象）**：

1. **cwd 取材**：desk = 注入项目根（`agent-host.mjs:154`）∥ CLI = `process.cwd()`（`:41`）——**留端**（adapter）。
2. **工具面**：CLI 增 MCP 合入 + `applyToolExclusions`（`:112-118`）∥ desk 零（端差登记 `SHELL.md:151`）——**留端**。
3. **validateProvider**：CLI 清标 + 三档文案 + 返回 agent（`:185-198`）∥ desk 不清标 + 泛句（零读）+ config 覆盖在内（`:49-54`）——**上报归一**（可观察零变论证 §2.4-③）。
4. **`_slot` ∕ `_mcpWarnings` ∕ `attachManifest`**：端壳面——**留端**。
5. **`teamConfig` ∕ `gitAuthor`**：两造体逐字同构（重造本体——归一对象）。
6. desk ∕ CLI 序的 1–8 步**逐段对齐**（同序同义）——上提后核为唯一实现。

**未核②闭合**：CLI 装配点 = `cli/src/cli/make-agent.mjs` `assembleAgent`（本表实读；原「CLI 树 `prepareRun` 零 import」在册句 = 正确——CLI 经核 `runAgent` 链消费 prepareRun，其**装配点**即本档）；`cli/src/tui/subagent-blocks.mjs` 内部 = B7 面（零触）。

### 2.3 上提方案（C1 ∕ C2 · 核形 + 注入面 + 端壳 adapter 面界）

**KD-1 核形 = 新 sibling 档 `core/agent/assemble.mjs`**（≈95–120 行；不并入 `setup.mjs`——① 行数顾问线（240 + ≈110 > 300）；② 生命周期分离（setup = 每 run pre-flight；assemble = 会话起点构造一次）；③ 与 R7 在册形一致（`desktop-flow-vsc-align.md:312` 拟 `thincoder-core/agent/assemble.mjs`））。登记面措辞「`core/agent/setup.mjs` 扩」= 读作 **setup 面扩展**（实取本档——N3）。

**接口契约（核导出面 5 名）**：

```
assembleAgent({ cwd, deps = {}, toolsFinalize = null }) → Promise<agent>
  序：loadConfig → injectProxy → createMemory(+embedder) → discoverRules(+streamRules 合并)
     → 记忆层（项目 → 团队）→ assembleBuiltinTools → [toolsFinalize 缝] → createAgent + providers ∕ activeProvider ∕ activeModel
DEFAULT_DEPS = Object.freeze({ loadConfig, createMemory, createAgent, assembleBuiltinTools,
                               discoverRules, syncDir, team: teamConfig, author: gitAuthor })
teamConfig(config) → { name, repo, dir } | null   // config?.memory?.team 有 repo 才成层；缺省 name="default" ∕ dir=join(configDir,"teams",name)
gitAuthor() → string                              // git user.name；缺 ⇒ "unknown"（node:child_process 探测——注入缝 = DEFAULT_DEPS.author）
validateProvider(agent, config) → agent           // 判据 name && model && baseURL；有效 ⇒ 清标；无效 ⇒ 记标记 + reason = config?.providerInvalidReason ?? 三档文案
```

**注入面（desk `DEFAULT_DEPS` 在册形继承 + 一缝扩展）**：

- 八缺省缝（desk `:28-31` 逐字随搬）+ `deps.injectProxy` 可选缝（缺省 = 动态 import `../proxy.mjs`——desk `:63` 在册形）；embedder ∕ `ensureClone` 保持动态 import（`../embedding.mjs` ∕ `../git/gitmem.mjs`——纯搬）。
- **`toolsFinalize(baseTools, { config, cwd, provider }) → tools` ∕ `Promise<tools>`**（新缝）：缺省 = 恒等；核体 **`await toolsFinalize(...)`**（同步返回值与 Promise 同判——CLI MCP 合入属实异步：`make-agent.mjs:97-98` 动态 import + `Promise.allSettled`）；**CLI 专用**——MCP 合入 ∕ `applyToolExclusions` 落此（**位次保持**：工具装配后、createAgent 前——与 CLI 现序 `:64 → :66-110 → :112` 逐位同）。

**端壳 adapter 面界（留端清单）**：

| 端 | 留端面（不动） | 消费形（改动） |
|---|---|---|
| desk | cwd 注入（`projects.currentCwd()`）· `_slot` · 校验调用（`agent.config`）· 不连 MCP ∕ 不附着 manifest（两项在册端差保持——`SHELL.md:151`）· `installExecRunSeams()` 尾 | `assembleFor({ cwd, slot, deps })` = 核调用 + 两行后处理（`_slot` ∕ 校验；wrapper ≈10 行）；四名 re-export 转口（`assembleFor` 名面保留） |
| CLI | cwd=`process.cwd()` · MCP 面（入 `toolsFinalize`）· `_mcpWarnings` · `applyToolExclusions` · `attachManifest` · 校验调用 | `assembleAgent({ excludeTools, slotData, deps })` = 核调用 + MCP 缝 + 后处理（wrapper）；四名 re-export 转口（`teamConfig` ∕ `gitAuthor` ∕ `validateProvider` ∕ `DEFAULT_DEPS`——**增 `DEFAULT_DEPS` = 加法**；L1 四名断言两转口对称）+ `deps` 形参新增（additive——N9） |
| VSC | 全树 | 零触 |

### 2.4 行为零变判据（C4 · 装配序 = 启动路径 · 判据要实）

① **调用面零改**（import 路径与名面）：desk `agent-host.mjs:47` ∕ `:55`（五名 re-export）；CLI 消费面五档 = `command-interactive.mjs:12`（五名 import；另 `:163-164` 直用 `teamConfig` ∕ `gitAuthor`）· `acp.mjs:28` · `distill-command.mjs:4`（`teamConfig` ∕ `gitAuthor`）· `memory-command.mjs:3`（`teamConfig`）· `command-table.mjs:12`（`teamConfig`）——转口保名面 ⇒ 全部零触。
② **序 ∕ 注入值零变**：对拍锁 B1 ∕ B5 ∕ B6（假 deps 记调用序 + 注入值断言——§2.5）。
③ **validateProvider 统一 · 可观察面判据句**（裁定要求①）：

> **判据句**：「desk 统一后相对旧实现，可观察行为零变」当且仅当下列实证成立——**① 文案零消费**：`_providerInvalidReason` 全 `thincoder-desktop/**`（含 renderer）恰一处命中 = 写点 `agent-assemble.mjs:53`（**零读点**）；marker 唯一读点 `turn-driver.mjs:155` 仅读布尔 `_providerInvalid`，其对外面 = 回执码字面 `provider-invalid`（独立面——`IPC.md:111` 在册）⇒ 旧泛句 ∕ 新三档文案**均无读面**。**② 清标径不可达**：desk 全树 `validateProvider` 调用点恰一处（`agent-assemble.mjs:98`，装配尾），入参恒为 `createAgent` 新建对象（核 `agent.mjs:69-93` 字段表零该两标记）；desk 零复验径（复验径仅 CLI `command-interactive.mjs:149`）⇒ 有效分支 `delete` 恒 no-op。**③ 返回值**：旧返 `undefined` ∕ 新返 `agent`——desk 唯一调用点未消费返回值 ⇒ 零观察面。

④ **CLI 侧可观察面逐项保持**：三档文案（`command-interactive.mjs:35-37` headless 错误面 ∕ `acp/handlers-session.mjs:176` ACP 错误面已实读消费）· 清标（`:149` 复验径）· config 覆盖（`:134-136`）· 返回 agent——对拍锁 B4 锁死。
⑤ **核件面零改**：`setup.mjs`（240）· `agent.mjs`（461）· 各核依赖面——改动集外（锁 L1 结构扫描 + 改动集机检复核）。
⑥ **残余面（报告列）**：desk 若未来新增复验径 ∕ reason 读点，将观察到「三档文案 + 清标」——本批不预置消费面（登记 N8）。

### 2.5 对拍锁（C4 · 批次本地件）

- **落点** = `docs/batches/2026-09-29-parity-b5-assemble.test.mjs`（**批次本地单元件**——全清令新规：名随批次档 ∕ 住批次目录 ∕ 不进仓套件；先例（在盘 5 档 · 皆 2026-09-28）= `docs/batches/2026-09-28-desktop-session-title.test.mjs` · `2026-09-28-desktop-subblock-follow.test.mjs` · `2026-09-28-tech-debt-closeout-r6.test.mjs` ∕ `-r7` ∕ `-r8`）。复跑 = `node --test docs/batches/2026-09-29-parity-b5-assemble.test.mjs`。
- **写门路径（#545 在册 · 立即形）**：子代理对 `docs/batches/*.test.mjs` 被 `core/agent/write-gate.mjs:133-155`（cross-batch 判据，非绑定档）拒 ⇒ 实施者写 `.thincoder/tmp/`（两层深）→ **父侧 copy 至终位**（先例 = #517 批实测形；长期形「写门豁免」= 判据语义面，不在本批——N5）。
- **判据 = 可观察面 + 结构面**（修前读数 = 本 §2 在册证据；锁 = 对改后盘的断言）：

| # | 面 | 用例 | 判据 |
|---|---|---|---|
| L1 | 同源锁 | 三档 import（核 `agent/assemble.mjs` ∕ desk `agent-assemble.mjs` ∕ CLI `make-agent.mjs`） | 四名 `teamConfig` ∕ `gitAuthor` ∕ `validateProvider` ∕ `DEFAULT_DEPS`：desk ∕ CLI 转口 **=== 核件同一绑定**；两转口档**零本地定义**（结构扫描：无四名本体 `function` ∕ `const` 声明） |
| B1 | 装配序（核 · 注入面机验） | 假 deps（八缝记录调用序 + 入参）· config 带 projectDir + team（+embedding 两形；**team 假 `dir` 预置 `.git`**——`gitmem.mjs:33` `existsSync` 早退 ⇒ 零网络 ∕ 零 clone，锁确定性） | 序 = `loadConfig → injectProxy → createMemory → discoverRules → syncDir(project) → syncDir(team) → assembleBuiltinTools → createAgent`；注入值：`memory.codeOrigin===cwd` ∕ `streamRules` 合并（文件规则在前 ∕ 同 pattern 去重）· `assembleBuiltinTools` 入参 `{author, team, model}` · `provider.proxyUri` 同步 · 三字段落位 |
| B2 | 工具终形缝 | `toolsFinalize` 在场（同步返回值）∕ 在场（返回 Promise）∕ 缺席 | 在场 ⇒ 返回值（Promise ⇒ 其 await 值）进 `createAgent` 且入参 = baseTools；缺席 ⇒ baseTools 原样（恒等） |
| B3 | `teamConfig` | 无 repo ∕ 缺省名 ∕ 显式 name+dir | 无 ⇒ `null`；缺省 ⇒ `{name:"default", dir:join(configDir,"teams","default")}`；显式 ⇒ 优先 |
| B4 | `validateProvider` | 有效（携旧标）∕ 无 name ∕ 无 model ∕ 无 baseURL ∕ config 覆盖（非空串）∕ config 覆盖 = 空串 | 有效 ⇒ 清两标 + 返 agent；无效 ⇒ 三档文案逐字（`provider 不存在` ∕ `model 缺失` ∕ `缺少 baseURL`）；覆盖值优先（`??` 判——空串亦覆盖 ⇒ `""`；与 CLI 旧真值判之差 = 已判定可忽略：`loadConfig` 只产 `null` ∕ 非空串（`config.mjs:329-332`）⇒ 实盘不可观察） |
| B5 | desk adapter | `assembleFor({cwd, slot, deps:假})` | `_slot===slot` ∧ 校验已跑（无效 provider 两形可判）∧ 序 = B1 序 ∧ `agent.config` 传校验 |
| B6 | CLI adapter | `assembleAgent({deps:假})`（空 MCP 配置） | `_mcpWarnings` 在场（空数组）∧ 非工程 ⇒ `agent.manifest===null`（attachManifest 已跑）∧ `applyToolExclusions` 恒等语义（空列表原样返） |

- **运行面**：锁绿 + 三档 `node --check` + 三档模块加载烟测（`node -e import()`——desk 档尾 `installExecRunSeams` 平 node 零 electron——档头 :15 在册）；`@thincoder/core` 三树 node_modules 链形解析已在盘（先例 = parity-b2-queued §3 轮 1 实读）。
- **集成面**：零动（三前端集成窗口 50–100 纪律；本批无业务场景变化——装配序真机面由父侧收口跑）。
- **F-注**：全清令后「核心套件空清单恒绿」——本锁 = 本批唯一机检承载（判据句 §2.4-③ 为其人工面）。

### 2.6 受影响文件表（core ∕ desk ∕ cli）+ 实施序

| 树 | 档 | 现读 | 预期 | 动作 |
|---|---|---|---|---|
| core | `thincoder-core/agent/assemble.mjs` | — | **Δ ≈ +95–120（新增）** | 上提产物（§2.3 接口契约；纯搬为体 + 注释随搬 + validateProvider 统一形） |
| core | `thincoder-core/agent/setup.mjs` | 240 | **Δ 0** | 零改（pre-flight 面不动） |
| desk | `thincoder-desktop/src/main/agent-assemble.mjs` | 103 | **Δ ≈ −53…−68（终形 ≈35–50）** | 删装配段 ∕ 三函数本体 ⇒ 消费核件 + 四名转口 + wrapper（cwd 注入 ∕ `_slot` ∕ 校验调用）+ 档头重写 + `installExecRunSeams` 尾不动 |
| desk | `thincoder-desktop/src/main/agent-host.mjs` | 260 | **Δ 0** | re-export ∕ 注入面零改（`:47` ∕ `:55` ∕ `:91`） |
| cli | `thincoder-cli/src/cli/make-agent.mjs` | 215 | **Δ ≈ −40…−75（终形 ≈140–175）** | 装配段删 ⇒ `toolsFinalize` 缝（MCP+剔除）+ 四名转口 + `deps` 形参 + `applyToolExclusions` ∕ `attachManifest` 留端 + 档头重写 |
| cli | `command-interactive.mjs`（186）· `acp.mjs`（143）· `acp/handlers-session.mjs`（292）· `distill-command.mjs` · `memory-command.mjs` · `command-table.mjs` | — | **Δ 0** | 调用面零改（枚举 = §2.4-①） |
| vsc | （全树） | — | **Δ 0** | 零面零触 |
| 文档 | `docs/batches/2026-09-29-parity-b5-assemble.test.mjs` | — | **Δ ≈ +160–220（新增）** | 对拍锁（§2.5；#545 路径：tmp → 父侧 copy） |
| 文档 | 设计档收正（清单 = §2.8） | — | Δ | 转单（未随本设计轮落笔） |

**实施序（eng-coder 单轮）**：① 核新档落（`agent/assemble.mjs`——纯搬 + 统一形）；② desk 改指（+档头重写）；③ CLI 改指（+MCP 缝 +档头重写）；④ 锁档（tmp 写）→ 跑：锁绿 + 三档 `node --check` + 三档加载烟测；⑤ 设计档收正（§2.8——随轮；需求档两处 = 报告转主 agent）；⑥ §5 报告（改动集恰 3 档 + 1 锁档 ∕ 零行为变声明 ∕ 读数回填）。
**回归判据（复用 §2.4）**：① 改动集机检 = 恰 core 新档 + desk ∕ CLI 两档（+锁档）；② 锁绿（L1+B1–B6）；③ 调用面 ∕ 消费面零改（枚举 = §2.4-①；6 档 = desk 1 ∕ cli 5）。

### 2.7 验收对照（回指归批行）

| # | 判据 | 面 | 回指 |
|---|---|---|---|
| AC1 | 三端装配序现状表（逐处 file:line ∕ 差额点 ∕ 未核②闭合） | 档面（§2.2） | 未核② `:190b` |
| AC2 | 上提方案（核形 + 接口契约 + 注入面 + 端壳 adapter 面界） | 档面（§2.3） | 行 `:68` ∕ `:69` ∕ 重造⑨ |
| AC3 | 行为零变判据（启动路径；可观察面判据句 + 锁） | 机检 + 档面（§2.4 ∕ §2.5） | 上提⑤ ＼ 全批 |
| AC4 | 受影响文件表（core ∕ desk ∕ cli）+ 实施序 | 档面（§2.6） | 全行 |
| AC5 | §2 落盘（本 append + 状态行） | 档面 | 本批 |
| AC6 | 边界：VSC 零触 ∕ 核不重设计 ∕ B1·B2·B4 零触 ∕ B10 零触 ∕ 需求档零触（收正转单照登） | 改动集机检 | §2.1 |

### 2.8 设计档收正清单（转单 · 未随本设计轮落笔）

> 未落笔理由 = 读数待实施回填 + 避让在飞文档批窗口（机械可落；逐处已定）。**活档残留检查（裁定要求②）**：validateProvider 端差 = **活档零残留**——`docs/desktop/design/SHELL.md:151` ∕ `PROJECT.md:793` 只登两项端差（MCP ∕ `attachManifest`）；全 `docs/**` 对 `_providerInvalidReason` ∕ 「不分档」零命中（批档面除外 = 历史记录，不回溯改）。另发现「第三份装配 ∕ 共享化议题另立」句族 = 活档残留 **10 处**（设计档 8 ∕ 需求档 2；族界 = 断言 ∕ 登记面——名面（标题 ∕ 树注 ∕ 导航名 ∕ 定位句）与记录面（变更记录 ∕ 归档）不随收正；逐处见下表）——随本批收正。

| 档 | 逐处（前 ⇒ 后） | 落点建议 |
|---|---|---|
| desk `SHELL.md` §4 | `:139`「同一份契约、第三种装配」⇒「装配序 = 核单源（`thincoder-core/agent/assemble.mjs`）+ 端壳 adapter（cwd ∕ `_slot` ∕ 校验调用；端差在册）」；`:153`「共享化议题不并入本批…独立议题」⇒「序 + 团队层取值已上提核件（本批）；余端差 = MCP ∕ `attachManifest`」 | 随实施轮 |
| desk `PROJECT.md` | `:131`（§3.4 指针行——「共享化议题行」指称随 §4 收正）· `:162`（agent-assemble.mjs 行 ⇒ 消费核件 + wrapper 口径；「壳装配第三份」句族随改）· `:653`（P3 行 ⇒「序 + 团队层取值已上提核件；余端差在册」口径）· `:791`（§10-D 行——共享化议题登记 ⇒ 同上改述） | 随实施轮 |
| desk `requirements/PROJECT.md` | `:23`（壳装配行）· `:214`（P3 行）——「共享化议题另立」改述 | **主 agent 笔**（需求档）——转主 agent |
| core `ARCHITECTURE.md` | `:176`（§4.2 三端壳面对位表——「第三份（形态对齐——共享化 = 独立议题）」⇒「装配序核单源 + 端壳 adapter（余端差在册）」）· `:191`（§6 未决设计批登记——共享化议题 ⇒ **本批部分落定**改述） | 随实施轮 |
| core `AGENT-LOOP.md` | `:18` 模块地图行补 `agent/assemble.mjs`；`:180` 模块职责表补一行（装配序 + teamConfig/gitAuthor/validateProvider） | 随实施轮 |
| core `MEMORY.md` | `:250` `teamConfig()` 出处 ⇒ 核 `agent/assemble.mjs` | 随实施轮 |
| core `SETTINGS-TOOL.md` | `:139` 读取器判据点坐标（`make-agent.mjs:150`「`!team?.repo`」）⇒ 核 `agent/assemble.mjs` | 随实施轮 |
| cli `ACP-CLIENT.md` | `:568` 覆盖坐标（`make-agent.mjs:134-135` 取 `config.providerInvalidReason`）⇒ 核 `validateProvider(agent, config)` 统一面 | 随实施轮 |
| — | `probeTargetFromEntry`（`desk settings-panel-write.mjs:52`）归 B10——**零触**（裁定边界注记） | — |

### 2.9 上抛项 ∕ 发现（逐条报告）

| # | 发现 | 处置 |
|---|---|---|
| N2 | validateProvider 去留歧义（上提⑤ ∕ `:69` 纳入 ⇔ R7 ∕ impl-8 留端） | **已裁 = 纳入**（2026-09-29 父侧回执）；留端方两处 = 批档历史记录，不回溯改 |
| N3 | 核形落点：登记面措辞「`core/agent/setup.mjs` 扩」——实取 = 新 sibling 档 `agent/assemble.mjs`（行数 + 生命周期二分；R7 在册形同） | KD-1；若父侧另裁「严格落 setup.mjs」须回炉（240+≈110 > 300 顾问线） |
| N4 | VSC 措辞三源不一：annex 上提⑤「VSC 侧瘦身」∥ closeout「三端消费」∥ 派单受影响表（core ∕ desk ∕ cli）——实盘 = **VSC 零面**（零命中实证） | 本批 VSC 零触；措辞差异登记 |
| N5 | 锁档写门（#545 在册）：子代理写 `docs/batches/*.test.mjs` 被拒 ⇒ 立即形 = `.thincoder/tmp/` 暂存 → 父侧 copy | 本批照立即形执行；长期形（写门豁免）= 判据语义面另裁 |
| N6 | 派单「四段序」措辞：实读 = **七段序**（`agent-assemble.mjs:4-7` 自陈 ∕ SHELL.md §4 批档 §2.2(b) 1–7） | 零动作（口径对齐） |
| N7 | desk-impl-8 三差收口对照：① MCP ② `attachManifest` = 留端仍真（本批零动）；③ validateProvider = 本批收编函数体（可观察零变）——**消费面**（fail-loud ∥ picker）仍各端自持 = 端差实存（非本批射程） | 登记（第③差函数体面销案 ∕ 消费面留） |
| N8 | desk 残余面：未来若新增复验径 ∕ reason 读点，「三档文案 + 清标」将变可观察 | 登记（§2.4-⑥） |
| N9 | CLI `assembleAgent` 新增 `deps` 形参（additive 注入面；缺省 = 核缺省；零行为变） | 披露（先例 = desk `deps` 形参在册） |
| N10 | 统一 `validateProvider` `??` 判 vs CLI 旧真值判之「假值非 null」输入差（空串等） | **已判定可忽略差**（登记）：`loadConfig` 只产 `null` ∕ 非空串（`config.mjs:329-332`）⇒ 实盘不可观察；B4 空串例在册（§2.5） |

### 2.10 关键决策（给由）

- **KD-1 核形 = 新 sibling 档 `core/agent/assemble.mjs`**（不并 `setup.mjs`）：行数顾问线 + 生命周期分离 + R7 在册形同（§2.3）。
- **KD-2 validateProvider 纳入 + 统一形**：以「可观察行为零变」为界（§2.4-③ 判据句）；统一体 = CLI 语义（三档文案 ∕ 清标 ∕ 覆盖）+ desk 参数形（`config`）。
- **KD-3 注入面 = `DEFAULT_DEPS` 八缝（desk 在册形继承）+ `toolsFinalize` 一缝**（CLI MCP 位次保持）+ 动态 import（proxy ∕ embedding ∕ gitmem）。
- **KD-4 端壳留面**：cwd ∕ `_slot` ∕ `_mcpWarnings` ∕ `attachManifest` ∕ `applyToolExclusions` ∕ 校验调用点 ∕ 缝尾——各端 adapter（§2.3 表）。
- **KD-5 锁 = 批次本地件**（全清令新规）+ #545 立即形（tmp → 父侧 copy）；判据 = 同源绑定 + 序 + 可观察面。
- **KD-6 VSC 零触**：零面实证（零命中）；其装配 fork（hydrate 序）归 B1。
- **KD-7 文档收正 = 转单**：需求档两处 = 主 agent 笔；其余随实施轮（避让在飞窗口 + 读数回填）。

### 2.11 修正块（评审 #72 · 轮次 1 · 十条逐条落位 · 2026-09-29 · eng-designer）

> **段位与形式**：本段 = 评审 #72（§3 轮次 1 · 🔴0 ∕ 🟡6 ∕ 🔵4 = 10 条）逐条落位——**段内就地修正**（本作者段内；失效表述不留节面——承 2026-09-18 失效表达裁定；原行可由 git 历史逐字复核）+ 本块逐条记录；**零新语义**（只落评审十条 + 父侧裁定；发现 1 的补扫两处见下行）；产品码 ∕ 测试件 ∕ §1 ∕ §3–§6 ∕ 核件代码 ∕ 其它批射程零触。

**逐号收口（1..10）**

| # | 处置 | 落点（§2 面） |
|---|---|---|
| 1 | ✅ 收正清单补全 + 计数核准：评审四处（`desk PROJECT.md:131 ∕ :162 ∕ :653` · `core ARCHITECTURE.md:176`）+ 本席按「核准计数」义务补扫同族两处（`desk PROJECT.md:791` · `core ARCHITECTURE.md:191`） | §2.8（intro 计数句 · PROJECT 行 · ARCHITECTURE 行新增） |
| 2 | ✅ 取「CLI 增 `DEFAULT_DEPS` 转口」侧：CLI 三名 → **四名 re-export**（加法——L1 四名断言两转口对称；名面零破） | §2.3 端壳表 CLI 行 · §2.6 CLI 行 |
| 3 | ✅ 契约写明可 await：`toolsFinalize` 返回面 `tools` ∕ `Promise<tools>` + 核体 `await`（同步返回值与 Promise 同判——CLI MCP 属实异步 `make-agent.mjs:97-98`）；B2 补「返回 Promise」例 | §2.3 注入面 · §2.5-B2 |
| 4 | ✅ 零改消费面补三档 + 一处直用：`distill-command.mjs:4` · `memory-command.mjs:3` · `command-table.mjs:12` · `command-interactive.mjs:163-164` | §2.4-① · §2.6 零改行 ∕ 回归判据③ |
| 5 | ✅ N1 行删除 + 节尾「N1 更正」段删除（失效表述不留节面；订正过程文字归本块） | §2.9（原 N1 行）· §2 尾段 |
| 6 | ✅ 取「假 team `dir` 预置 `.git`」侧（**不加缝**——八缝冻结形保持；`gitmem.mjs:33` 早退 = 锁确定性） | §2.5-B1 用例列 |
| 7 | ✅ 坐标现读收正：`SHELL.md:120`→`:151`（三处）· `PROJECT.md:754`→`:793` · SHELL 表行 `:108`→`:139` ∕ `:122`→`:153` · PROJECT 表行 `:160`→`:162` | §2.2-2 · §2.3 端壳表 desk 行 · §2.8（intro · 两表行） |
| 8 | ✅ 保 `??`（实盘不可观察）+ B4 补空串覆盖例 + 登记「已判定可忽略差」（N10 新增） | §2.3 契约（零改）· §2.5-B4 · §2.9-N10 |
| 9 | ✅ 改引在盘先例（去 b2 锁引——不在盘）；列在盘 5 档（皆 2026-09-28） | §2.5 锁落点行 |
| 10 | ✅ 补 `acp/handlers-session.mjs`（292）+ 受影响表「预期」列全列改 **Δ 增量记法**（终形数随括注） | §2.6 表（CLI 零改行 · 各预期列） |

**计数核准（发现 1 口径）**：句族「第三份 ∕ 第三种装配 · 共享化另立」活档残留 = **10 处**——**设计档 8**（`SHELL.md:139 ∕ :153` · `desk PROJECT.md:131 ∕ :162 ∕ :653 ∕ :791` · `core ARCHITECTURE.md:176 ∕ :191`）+ **需求档 2**（`desk requirements/PROJECT.md:23 ∕ :214`——主 agent 笔）。**族界 = 断言 ∕ 登记面**；名面（标题 ∕ 树注 ∕ 导航名 ∕ 定位句：`SHELL.md:3 ∕ :25 ∕ :52 ∕ :137` · `IPC.md:5` · `desk PROJECT.md:4 ∕ :24 ∕ :129` · `ARCHITECTURE.md:82`）与记录面（变更记录 ∕ 归档）**不随收正**（桌面壳装配面仍真——adapter 形）。原判「4 处」= 计数失准（清单不完整 + 坐标漂移），按发现 1 落正。

**本轮未触**：产品码 ∕ 测试件 ∕ §1 ∕ §3–§6 ∕ 核件代码 ∕ 其它批射程；读回核验 = 段内修正 + 本块落毕后逐处复读（结论见交付报告）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 本档 §2（`2026-09-29-parity-b5-assemble.md` §2.1–§2.10）。评审面 = 设计面证据抽检（受影响文件表读数、三端坐标、活档残留清单）+ 锁判据可满足性。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | 本档:149 ∕ :153 ∕ :155 的收正清单不完整——活档「第三份 ∕ 第三种装配 · 共享化另立」句族另有 4 处未入表：`docs/desktop/design/PROJECT.md:131`（指针行）· `:162`（agent-assemble.mjs 行「壳装配第三份」）· `:653`（P3 行「第三种装配；共享化 = 独立议题」）· `docs/core/design/ARCHITECTURE.md:176`（§4.2 三端壳面对位表「第三份（形态对齐——共享化 = 独立议题）」）；且该处「活档残留 4 处」与表列 5 处坐标数不一致。实施后上述活档将与核单源新形并存（同机制两处不同描述） | 把 4 处补入 §2.8 清单（含核侧 ARCHITECTURE.md §4.2 行——本批新增核档），并核准「N 处」计数 |
| 2 | Clarity | 🟡 | :107 L1 判据写「四名 `teamConfig` ∕ `gitAuthor` ∕ `validateProvider` ∕ `DEFAULT_DEPS`：desk ∕ CLI 转口 === 核件同一绑定」，但 :84 ∕ :127 的 CLI 侧只列「三名 re-export 转口」，且 CLI 现档 `thincoder-cli/src/cli/make-agent.mjs` 全树 `DEFAULT_DEPS` 零命中（grep）——L1 按字面在 CLI 档不可满足 | 二选一：CLI 增 `DEFAULT_DEPS` 转口（加法，名面不破）或把 L1 的 `DEFAULT_DEPS` 断言限定 desk 转口 |
| 3 | Clarity | 🟡 | :77 契约 `toolsFinalize(baseTools, { config, cwd, provider }) → tools` 未标 async ∕ 未写 `await`，但 CLI 侧 MCP 合入属实异步（`make-agent.mjs:97-98` 动态 import + `Promise.allSettled`）；而 B6（:113）只用「空 MCP 配置」，漏 await 的同步写法可能不被锁捕获 | 契约写明返回面可 await（核 `await toolsFinalize(...)`；缺省恒等），并在 B2 补一例返回 Promise 的缝 |
| 4 | Clarity | 🟡 | :89 ∕ :134 的「调用面零改」枚举面不全：`teamConfig` ∕ `gitAuthor` 另有消费者 `src/cli/distill-command.mjs:4` · `src/cli/memory-command.mjs:3` · `src/command-table.mjs:12`（另 `src/command-interactive.mjs:163-164` 直用）——转口方案下它们零改，但清点名单只列 4 档 | 把三档补入零改消费面清单（回归机检同列） |
| 5 | Doc hygiene | 🟡 | :166 N1 行仍写「本批 §1 仍为模板占位（零讨论内容）」，与盘上 §1.1（已由父侧落盘）矛盾；订正只以节尾 :186「N1 更正」追加形式存在——失效表述留在节面，读者须回读死条目 | 删去 N1 行失效句 ∕ 并入现状（订正过程文字归记录面），节面只留当前状态 |
| 6 | Acceptance criteria | 🟡 | :108 B1 的 team 形要真跑 `ensureClone`（:76 明确该函数保持动态 import、不在注入面内；`thincoder-core/git/gitmem.mjs:32-37`：`<dir>/.git` 不在即 `git clone` 远端）——网络 ∕ 时长不可控，锁确定性无保障 | 二选一：加 `ensureClone` 注入缝（`??` 缺省回真实实现，生产零变），或让假 team 的 `dir` 预置 `.git`（`gitmem.mjs:33` 早退） |
| 7 | Clarity | 🔵 | 活档坐标漂移：`docs/desktop/design/SHELL.md` 的 `:108` ∕ `:120` ∕ `:122`（本档 :149 ∕ :153）实为 `:139`（同一份契约、第三种装配）∕ `:151`（两项显式端差登记）∕ `:153`（共享化议题不并入本批）；desk `PROJECT.md` 的 `:160` ∕ `:754` 实为 `:162`（agent-assemble.mjs 行，读数 103 对）与 `:793`（两项端差登记 · §10 行 H）。结论面（validateProvider 活档零残留）经重读成立，但收正轮按现坐标会落空 | 收正轮现读坐标（或改用节锚点）再落笔 |
| 8 | Clarity | 🔵 | 统一 `validateProvider` 契约（:71 `config?.providerInvalidReason ?? 三档文案`）与 CLI 现判据（`make-agent.mjs:134` 真值判）在「假值非 null 值」输入上不同；实盘 `loadConfig` 只产 `null` ∕ 非空串（`config.mjs:329-332`）⇒ 实际不可观察 | 若求逐字等值改用真值判；否则在 B4 补一例空串覆盖并登记为已判定的可忽略差 |
| 9 | Clarity | 🔵 | :101 引的先例 `docs/batches/2026-09-29-parity-b2-queued.test.mjs` 盘上不存在（`docs/batches/*.test.mjs` 现 = 5 档，皆 2026-09-28；b2 批可能在飞 ∕ 暂存 `.thincoder/tmp`） | 复引在盘先例（`2026-09-28-desktop-session-title.test.mjs`）或待 b2 锁落位后补引 |
| 10 | Clarity | 🔵 | 受影响文件表（:121-131）未给零改档 `acp/handlers-session.mjs` 现读行数（实读内容 292），且「预期」列给终形行数而非 `≤±N` 增量形；表内其余读数抽检全对（desk 103 ∕ CLI 215 ∕ host 260 ∕ setup 240 ∕ command-interactive 186 ∕ acp 143 ∕ agent.mjs 461），无越档、新档 ≈95–120 在顾问线内 | 补齐该档行数并统一增量记法 |

**抽检通过面（无发现）**：desk `agent-assemble.mjs` 全段坐标（:28-31 ∕ :35-40 ∕ :43-45 ∕ :49-54 ∕ :58-100 ∕ :97 ∕ :98 ∕ 尾 :103）· CLI `make-agent.mjs` 全段坐标（:16-21 ∕ :24-138 ∕ :163-176 ∕ :185-198 ∕ :201-215）· desk `agent-host.mjs:47 ∕ :55（五名 re-export）∕ :91 ∕ :153-158` · CLI 消费点 `command-interactive.mjs:12 ∕ :32 ∕ :123 ∕ :149 ∕ :151-155 ∕ :35-37` · `acp.mjs:28 ∕ :75` · `handlers-session.mjs:176` · CLI 三档文案 ∕ 清标 ∕ 覆盖面实存 · desk `validateProvider` 调用点恰一处、`_providerInvalidReason` 活代码零读点（`turn-driver.mjs:155` 仅读布尔）· VSC `src` 树四名零命中 · `@thincoder/core` 链接在 desk ∕ cli `node_modules/@thincoder/` 在盘 · 核 `setup.mjs` 仅 `prepareRun:42` · `createAgent` 存 `config` 且字段表零 `_providerInvalid*` · 核内无既有 `teamConfig` ∕ `gitAuthor` 等价物（零重复造）。

**评审限制（证据面）**：文档地图与项目标准档均未提供（环境无）——文档归属按仓内既有单源约定评（SHELL.md §4 ∕ ARCHITECTURE.md §4.2 = 其主题主档）；方法学按 Project Guide + 六段体在盘实读评。另：`core/agent/write-gate.mjs:133-155` = `batchRecordWriteConflict`（cross-batch containment）确在盘，但其对 `docs/batches/*.test.mjs` 的触发面（`batchDocBases` 语义）未读——**unverified**（不影响该路径可行性：tmp 暂存 → 终位仍是安全形）。

计数：🔴 0 · 🟡 6 · 🔵 4

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 2026-09-29 05:0x）

- **依据** = 同上三条件——评审 **#72 pass**（0🔴）；修正轮 **#78 落地已核**（10/10 · 零不成立）；token 在位。
- 修正轮披露三则**受理**：① 补扫两处（`desk PROJECT.md:791` ∕ `core ARCHITECTURE.md:191`）并入 10 处清单；② 族界裁定（名面 ∕ 记录面不随收正，除外点主清单在册）；③ 形式 = 段内就地修正 + 修正块。
- **需求档两处**（`desk requirements/PROJECT.md:23 ∕ :214`）= 主 agent 笔——父侧随实施结算落（不占核 ∕ 端实施面）。
- 实施 = 核件新档 + 两端 adapter + 批内件 + 文档收正（§2.7）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（单轮 ①–⑥ · 改动集 = 3 源码档 + 1 锁档 + 7 设计档收正（13 处）· 锁绿 7/7 · 审计 ∕ 评审两轮终态 clean）



**（实施轮交付 · parity-b5-assemble · 2026-09-29 · eng-coder · 单轮 ①–⑥ 全落）**

### 5.1 交付摘要（改动集机检）

**源码面 = 恰 3 档 + 1 锁档**（设计 §2.6 表逐行落；读数 = 内容行）：

| # | 档 | 动作 | 读数 |
|---|---|---|---|
| 1 | `thincoder-core/agent/assemble.mjs` | **新增**（核单源：五导出 + 八缺省缝 + `injectProxy` 可选缝 + `toolsFinalize` 缝） | **115**（设计估 ≈95–120 ✓） |
| 2 | `thincoder-desktop/src/main/agent-assemble.mjs` | 改指（103 ⇒ 32：核调用 + `_slot` ∕ 校验调用 + 四名转口 + 档头重写 + `installExecRunSeams` 尾不动） | **32**（设计估 ≈35–50，偏小 3——见 5.5-①） |
| 3 | `thincoder-cli/src/cli/make-agent.mjs` | 改指（215 ⇒ 140：核调用 + `toolsFinalize` 缝（MCP + 剔除）+ 四名转口（增 `DEFAULT_DEPS` = 加法）+ `deps` 形参 + `applyToolExclusions` ∕ `attachManifest` 留端 + 档头重写） | **140**（设计估 ≈140–175 ✓ 下沿） |
| 4 | `.thincoder/tmp/2026-09-29-parity-b5-assemble.test.mjs` | **新增**（对拍锁 L1 + B1–B6；#545 立即形——待父侧 copy 至 `docs/batches/`） | **297**（设计估 ≈+160–220——见 5.5-①） |

**零改面（实读核）**：核 `agent/setup.mjs` ∕ `agent.mjs`（核机制零重设计）· desk `agent-host.mjs`（`:47` ∕ `:55` ∕ `:91` ∕ `:153-158` 零改）· CLI 消费五档 · VSC 全树（四名零命中）· 需求档（`docs/desktop/requirements/PROJECT.md` 两处保持原状）· 其余 docs（除 §2.8 清单）。

### 5.2 逐档落点（file:line · 实读）

| 档 | 落点 |
|---|---|
| core `agent/assemble.mjs` | 档头 `:1-12` · 导入 `:14-19` · `DEFAULT_DEPS` `:22-25` · `teamConfig` `:29-35` · `gitAuthor` `:37-39` · `validateProvider` `:45-56` · `assembleAgent` `:63-115`（`injectProxy` 缝 `:70` ∕ `toolsFinalize` 缝 `:109` ∕ 三字段 `:111-113`） |
| desk `agent-assemble.mjs` | 档头重写 `:1-14` · 核 import `:15` · 四名转口 `:20` · `assembleFor` `:22-29`（核调用 `:25` · `_slot` `:26` · 校验 `:27`）· 缝尾 `:31-32` 不动 |
| CLI `make-agent.mjs` | 档头重写 `:1-9` · 核 import `:12` · 四名转口 `:16` · `applyToolExclusions` `:18-26` 留端 · `assembleAgent` `:28-51`（`deps` `:31` · `cwd = process.cwd()` `:32` · `toolsFinalize` `:39` · `_mcpWarnings` `:41` · `attachManifest` `:46` · 校验 `:49`）· `finalizeTools` `:53-102` · `attachManifest` `:126-141` 留端 |

### 5.3 设计档收正（§2.8 清单 · 逐处 · file:line）

> 按 §3 轮 1 发现 7 口径「**现读坐标**再落笔」（设计快照坐标已因在飞文档批漂移：SHELL `:139/:153` → 现 `:135/:149`；desk PROJECT `:131/:162/:653/:791` → 现 `:132/:163/:676/:815`）。**族界照 §2.11**：名面 ∕ 记录面未动（未追加变更记录行——设计未要求）。

| # | 档 | 现读落点 | 前 ⇒ 后（要点） |
|---|---|---|---|
| 1 | `docs/desktop/design/SHELL.md` | `:135` | 「同一份契约、第三种装配」⇒「**装配序 = 核单源（`thincoder-core/agent/assemble.mjs`）+ 端壳 adapter（cwd ∕ `_slot` ∕ 校验调用；端差在册）**」 |
| 2 | 同档 | `:149` | 「共享化议题不并入本批…独立议题」⇒「**序 + 团队层取值已上提核件（本批）**（`thincoder-core/agent/assemble.mjs`）：余端差 = MCP ∕ `attachManifest`」 |
| 3 | `docs/desktop/design/PROJECT.md` | `:132` | §3.4 指针行 ⇒「…+ **装配序上提核件与余端差行**」 |
| 4 | 同档 | `:163` | agent-assemble 行：`103` ⇒ **`32`**（实读）；说明 ⇒「装配面 adapter（**消费核单源**…四名同名转口…）」；「壳装配第三份」句删 |
| 5 | 同档 | `:676` | P3 行 ⇒「落定 = SHELL.md §4（**序 + 团队层取值已上提核件；余端差在册**）」 |
| 6 | 同档 | `:815` | §10-D 行 ⇒「**序 + 团队层取值已上提核件（本批）** ｜ 余端差在册（MCP ∕ `attachManifest`）」 |
| 7 | `docs/core/design/ARCHITECTURE.md` | `:176` | §4.2 三端对位表 ⇒「**装配序核单源**（`thincoder-core/agent/assemble.mjs`）+ 端壳 adapter（余端差在册）」 |
| 8 | 同档 | `:191` | §6 未决设计批 ⇒「**本批部分落定**——序 + 团队层取值已上提核件；余端差在册」 |
| 9 | `docs/core/design/AGENT-LOOP.md` | `:18` | §1 归属表「装配 ∕ 提醒 ∕ 收尾」核列补 `thincoder-core/agent/assemble.mjs` |
| 10 | 同档 | `:179`（新行） | §6.1 模块地图补一行（装配序核单源 + `DEFAULT_DEPS` ∕ `teamConfig` ∕ `gitAuthor` ∕ `validateProvider`） |
| 11 | `docs/core/design/MEMORY.md` | `:250` | `teamConfig()` 出处 ⇒ 核 `thincoder-core/agent/assemble.mjs` |
| 12 | `docs/core/design/SETTINGS-TOOL.md` | `:139` | 读取器判据点 `make-agent.mjs:150`（`!team?.repo`）⇒ 核 `thincoder-core/agent/assemble.mjs:31`（实读同句） |
| 13 | `docs/cli/design/ACP-CLIENT.md` | `:568` | 覆盖坐标 `make-agent.mjs:134-135` ⇒ 核 `validateProvider(agent, config)`（`config?.providerInvalidReason` + 三档文案兜底） |

**未触（照族界）**：名面 = `SHELL.md:3 ∕ :25 ∕ :52 ∕ :133` · `IPC.md:5` · `desk PROJECT.md:4 ∕ :25 ∕ :130` · `ARCHITECTURE.md:82`；记录面 = 各档变更记录 ∕ 归档。需求档两处（`desk requirements/PROJECT.md:23` ∕ `:214`）= 主 agent 笔，**零触**。

### 5.4 验证命令与读数（cwd = `D:\teamcode\thincoder`）

| 命令 | 读数 |
|---|---|
| `node --test .thincoder/tmp/2026-09-29-parity-b5-assemble.test.mjs` | **7/7 pass**（L1 + B1–B6；fail 0） |
| `node --check` × 4（核新档 ∕ desk ∕ CLI ∕ 锁档） | 全绿（`ALL-CHECKS-OK`） |
| 三档模块加载烟测（`import()` · 仓根解析） | 核 `{DEFAULT_DEPS, assembleAgent, gitAuthor, teamConfig, validateProvider}` · desk `{DEFAULT_DEPS, assembleFor, gitAuthor, teamConfig, validateProvider}` · CLI `{DEFAULT_DEPS, applyToolExclusions, assembleAgent, attachManifest, gitAuthor, teamConfig, validateProvider}`；**四名 desk === core ∕ cli === core 俱 true** · `DEFAULT_DEPS` frozen = true |
| 消费面枚举实读 | desk `agent-host.mjs:47 ∕ :55 ∕ :91 ∕ :153-158`；CLI `command-interactive.mjs:12 ∕ :32 ∕ :123 ∕ :149 ∕ :163-164` · `acp.mjs:28 ∕ :75` · `distill-command.mjs:4` · `memory-command.mjs:3` · `command-table.mjs:12` |
| 仓套件 | **未跑**（本批无业务场景变化、集成面零动——repo 套件按纪律归父侧收口一次跑） |

### 5.5 发现 ∕ 上抛（逐条）

① **行数落点差（读数回填项）**：desk 32（估 ≈35–50）· 锁档 297（估 ≈+160–220）——实落按最小形；CLI 140 ∕ 核 115 在估带内。
② **§2.4-③ 写点面现态**：desk 全树 `_providerInvalidReason` 字面由「恰一处命中（写点）」变**零命中**（写点随统一形归核）——「文案零消费」判据**更强成立**（零读面仍真；布尔唯一读点 = `turn-driver.mjs:177`，坐标漂自设计快照 `:155`）。
③ **需求档两处 = 主 agent 笔**（未触，照登）：`docs/desktop/requirements/PROJECT.md:23` · `:214`。
④ **越射程注记（本轮零动作 · 供父侧裁）**：
   - desk 悬空引注（本批移动所致）：`src/main/index-status.mjs:16` ∕ `:24` · `src/main/settings.mjs:177` 引 `agent-assemble.mjs:67-71` ∕ `:68`（该档现 32 行，坐标不存在）；建议改指核件（embedder 判据现住核 `assemble.mjs:76-79`）。
   - desk 批内自查件失真：`.thincoder/tmp/r10-desktop-selfcheck.mjs:25` 读项 `desktop_bridge_imports_coreRulesModule`（断言 adapter 源含 `from "@thincoder/core/rules.mjs"`）——现 adapter 不直接消费核 rules 面 ⇒ 该读项报 false（R10 批本地临时件 · 非套件）。
   - 射程外活档坐标（「移动致引注失效」族 · §2.8 未列）：`docs/core/design/MEMORY.md:413`（`make-agent.mjs:51`）· `docs/core/design/CONTEXT-COMPACTION.md:594`（`make-agent.mjs:112-118`）· `docs/cli/design/ACP-CLIENT.md:278`（`make-agent.mjs:15`）· `docs/core/requirements/SETTINGS-TOOL.md:25`（`make-agent.mjs:150`）· `docs/core/design/SETTINGS-TOOL.md:138`（「CLI 装配…（baseTools）」——baseTools 装配已归核）。
   - **锁档终位未落**：`.thincoder/tmp/2026-09-29-parity-b5-assemble.test.mjs` → 待父侧 copy 至 `docs/batches/2026-09-29-parity-b5-assemble.test.mjs`（#545 立即形；copy 后按档内命令复跑）。

### 5.6 审计与代码评审轮次与终态

| 轮 | 类型 | 结论 |
|---|---|---|
| 1 | 内部发散审计（read-only 子代理 · 七轴：接口契约 ∕ 端壳留面 ∕ 消费面零改 ∕ 判据句三实证 ∕ 锁质量 ∕ 越界 ∕ 文档收正） | 七轴全「成立，无发现」；唯一发散 = 「§5 未落盘」（随后即落） |
| 2 | 内部代码评审（advisor · code · 轮 1 全量） | VERDICT **pass**：🔴 0 · 🟡 1（协调项：锁档 copy——非缺陷）· 🔵 3（§5 待落 ∕ 行数标注漂移 + `turn-driver` 坐标 ∕ 锁与运行 cwd 耦合） |
| 3 | 内部代码评审（advisor · code · 轮 2 仅核修复声明） | VERDICT **pass**（host 机检 7/7 引注相符）：修复声明成立、未引新 🔴 |
| — | **终态 = clean** | fix round 1：锁 B6 位置无关化（`process.chdir(mkdtemp)` + `finally` 复原）→ 复跑 7/7 绿；余项 🟡1 ∕ 🔵2 = 非阻塞、非 must-fix（父侧收口项 ∕ 读数回填项） |

**fix round 记录**：① 实施期锁期望模型修正 1 轮（首跑 3 失败：序断言漏 `author` 求值位 · B5 ∕ B6 未配 projectDir ∕ team ⇒ 分层跳过——改「主序过滤投影 + 实际全序」双断言后 7/7）；② 评审后修复 1 轮（上表，含一次编辑回转 `.thincoder/tmp` 锁档 `finally` 收口，check 即捕并复跑）。两轮均已复跑验证。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**收口读数（父侧亲跑 · 冻结版）**：
- 批内件 `docs/batches/2026-09-29-parity-b5-assemble.test.mjs` = **7/7 pass**（L1 同源绑定 + B1–B6：装配序 ∕ toolsFinalize ∕ teamConfig ∕ validateProvider ∕ desk ∕ CLI 两端转口）；终位复跑 = 父侧亲跑。
- 全量批内件收口跑 = **124/124**（14 件 · 同刻 · 含本批）；四端套件 = 空清单绿（全清令制）。
- 三档加载烟测：四名转口 desk === core ∕ cli === core 俱 true；`DEFAULT_DEPS` frozen=true；`node --check` 全绿。

**落面（全落）**：核新档 `thincoder-core/agent/assemble.mjs`（115 内容行 · 五导出）+ desk 改指（103 ⇒ **32**）+ CLI 改指（215 ⇒ **140**）+ 锁 L1/B1–B6 + §2.8 收正 7 档 13 处（现读坐标）+ **需求档两笔（父侧笔）**：`docs/desktop/requirements/PROJECT.md` §2 壳装配行 ∕ §8 P3——核单源已落（+变更记录）。

**结算面（D7）**：台账 **#570**（B5 装配序上提）→ **已核销**（装配序 + 团队层取值住核 + 两端零本地定义实证）；**#589**（B5 残引族：desk 引注三处 + 文档五处）→ 挂册在途（另有载体）。
**真机面（父侧义务 · D16）**：桌面 ∕ CLI 启动装配冒烟（团队层取值两形）——人工走查；清单随本轮真机汇总行。

**状态行**：已收口 2026-09-29。
