# 2026-09-29 · core-hygiene
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 同令排队入场——台账 #577（路径盘符大小写族）+#579（核 agent.mjs 拆分债）。
> 台账 = #577 ∕ #579（core · 排队入场）。前情 = 2026-09-29 波后微件（用户「排队做」令下）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:5x）
- **来源**：同令——台账 **#577 ∕ #579** 排队入场。
- **射程**：#577 路径盘符大小写族（node_modules link target 大小写 + 台账库键规范化——**同根一药**）∥ #579 核 `agent.mjs` 拆分债（`runAgent` ≈360 行单函数 ∕ 档 462→≈468）。
- **口径**：#577 修产生方（路径规范化）不改模块解析面；#579 导入面零改判据 + 行为零变对拍；与 B1 实施面同域串行。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（fix 轮 #1–#5（§2.9）+ P2 ∕ P3 就绪核与届盘重锚（§2.10）+ §3 轮次 2 修正 1–5（§2.11）落毕 · 触发 = B1 §6 收口）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**（设计轮交付 · core-hygiene · 2026-09-29 · eng-designer）**

### 2.0 交付形态与口径

- 本批 = **设计轮**：产品码 ∕ 测试码零写；唯一落盘 = 本 §2 段。**设计档落点 = 本 §2 自持**（先例 = B1 ∕ B2 §2）；机制新增（dev-link 工具 ∕ 三拆归属）随实施轮并入权威档（清单 = §2.8）。
- 坐标口径 = `readFileSync(...).split("\n").length`（含末空行元素）；**as-of 本设计轮实读（2026-09-29 05:2x）**。
- 与 B1 串行：#579 实施锚 = **B1 收口后届盘重锚**（B1 实施在途：`thincoder-core/agent.mjs` +≈6 · AGENT-LOOP 系文档同窗）；#577 与 B1 零文件交叠（可并行）。
- 台账：#577 ∕ #579（在途 · 本批）。判据环境 = 本机（win32 · 仓根 `D:\teamcode\thincoder`）。

### 2.1 本批条目（覆盖）与边界

| # | 条目 | 台账 | 本批处置 |
|---|---|---|---|
| A | 路径盘符大小写族：node_modules link target `D:\` vs `d:\`（模块实例分立）+ 台账库双实例同根 | #577 | 设计 + 实施：link 产生方工具 ∕ 键面扫账零改 ∕ 台账半 = **转引**（§2.2） |
| B | 核 `agent.mjs` 拆分债（`runAgent` ≈360 行单函数 ∕ 档 462→≈468） | #579 | 设计 + 实施：三拆 + 导入面零改 + 对拍判据（§2.3） |

**边界（不做）**：① B1 实施面零触（`thincoder-vscode/**` ∕ B1 核增补——届时串行）；② **模块解析面零改**（loader ∕ resolve 语义不动；修产生方）；③ 产品行为零变；④ 仓外面（已发布产物 ∕ 全局 npm link ∕ 未重启消费进程）报道不修；⑤ 台账库代码零改（已交付面）；⑥ 他批（B2 锁 ∕ doc-sync ∕ desktop 族）零触。

### 2.2 #577 方案：win32 路径产生面统一（一药两病）

#### 2.2.1 产生方逐处盘点（实读）

| 产生方 | 现状（实读） | 判定 |
|---|---|---|
| **① link 生成**（node_modules junction 目标拼写） | 五链实读：vsc ∕ desktop 的 core + vsc ∕ desktop 的 render-core = `D:\…`；**cli 的 core = `d:\…`（唯一漂移）**；跨包模块恒等实测 = `false`（同一文件 `queued.mjs` 经 vsc-link ∕ cli-link 两次载入——本设计轮复现，同 B2 锁件头注证据 `.thincoder/tmp/2026-09-29-parity-b2-queued.test.mjs:10-12`） | **本批修复面**（§2.2.2） |
| **② sha1 键（台账）** | `ledger-db.mjs:41-43` = `sha1(normalizeCwd(root))[:16]`（已归一）；迁移 ∕ 审计命令面 = `ledger-migrate.mjs`（300 行）；2026-09-25 批实跑（296+28→324 · 源回收 · 报告 ∕ 备份 ∕ 回收目录在盘） | **转引**（在册行已含——§2.2.4） |
| **③ 其它 sha1-路径键 ∕ 路径键族** | 全族经 `normalizeCwd` 单源（逐面表见下） | **零改**（判据 = case 变体试例 · §2.2.3） |

③ 逐面表：

| 面 | 键 ∕ 判据 | 落点 | 归一形 |
|---|---|---|---|
| session 槽 | `hash = sha1(normalizeCwd(cwd))` | `session-slots.mjs:71-80` | ✓ 单源 |
| git checkpoint | `sha1(normalizeCwd(cwd))[:CWD_HASH_LEN]` | `git/checkpoint.mjs:16-19 · :41`（09-25 批单源化） | ✓ |
| traces | `sessionKey` sha1(normalizeCwd)[:12] + `cwdHash` | `traces/trace-store.mjs:63-66 · :248` | ✓ |
| peers | 载荷 cwd 归一 + 同 cwd 比较 | `peer-claims.mjs:179` ∕ `peer-domains.mjs:171-178 · :286` | ✓ |
| memory origin | 盘符大写（**内联副本**，与 normalizeCwd 同语义） | `memory/origin.mjs:21` | ✓（形式 = 内联；单源化 = 可选微件，登记 F4） |
| subagent scheduler | win32 文件键全小写 `fileKey` | `agent-tools/subagent-scheduler.mjs:69-70` | ✓（契约自持，不改） |
| 迁移族（刻意无归一） | 变体键枚举（找旧键专用） | `ledger-migrate.mjs:40-44` ∕ `session-migrate.mjs:12-30` | 设计使然（不改） |

**「折叠大小写 + 分隔符统一」的落地口径**（KD）：

- **键面**（契约不变更）：盘符折叠（唯一观察到的漂移源）+ 分隔符由 `resolve()` 统一（既有 T21 含 `\`/`/` 混写例）；**非盘符段不折叠**（`LEDGER.md` §2.1 明载）。
- **链面**（本批新增判）：规范形 = `realpathSync.native`（**盘符大写 + 真大小写 + `\` 分隔**）。
- **全路径折叠否决**：键面会改变既有键 ⇒ 全量迁移成本（session ∕ traces ∕ ledger 三库）；链面会破坏真目录拼写——两无收益（漂移源只有盘符）。

#### 2.2.2 修复方案：link 产生方（`scripts/dev-link.mjs` 新档）

**病灶链**：junction 目标串 = 创建时**原样存储**（本设计轮探针实证：`symlinkSync` 给 `d:\…` 读回 `d:\…`）；`npm link` 的目标拼写随调用进程 cwd 拼写漂（vsc ∕ desktop 落 `D:`、cli 落 `d:`）⇒ Node 模块恒等 = 解析 URL 串恒等 ⇒ 跨包引同一文件 = 两实例（实测 `===` false）。

**修法（确定性产生方工具 · 工程工具面）**：

- 新 `scripts/dev-link.mjs`：
  - 覆盖面 = 五链（**target 派生规则 = 各产品 `package.json` 的 `@thincoder/*` 依赖声明 × 仓根兄弟目录**：`@thincoder/<n>` → `<repo>/thincoder-<n>`，读回该目录 `package.json.name` 逐字对账——实读三产品：cli = core ∕ vsc = core+render-core ∕ desktop = core+render-core（`thincoder-cli/package.json:22-24` ∕ `thincoder-vscode/package.json:32-35` ∕ `thincoder-desktop/package.json:14-17`）；**与现存链无关 ⇒ 缺失链可判 ∕ 可建**；目标兄弟目录缺位 ⇒ 报错跳过，不建悬空链）；
  - **规范形 target = `realpathSync.native(resolve(sibling))`**——实读陷阱：`.native` 面做大小写规范化（`d:\…` → `D:\…`），`fs.realpathSync`（JS 面）**保留原样**——工具必须用 `.native`；
  - 建链 = `symlinkSync(target, link, "junction")`（目标串原样存储 ⇒ 规范形可确成；win32 外 = `"dir"` symlink）；
  - 模式：缺省 **apply**（逐链动作：缺失 ⇒ **建**；同路径异拼写 ∕ 异路径 ⇒ **修**（重建规范链）；规范 ⇒ no-op；物化副本 ⇒ 跳过报出）· `--check`（只读：0 = 全规范 ∕ 1 = 漂移，逐链报「同路径异拼写 ∕ 异路径 ∕ 缺失 ∕ 物化副本」）· `--json`（`--check --json` 输出 = `{ links: [{ product, link, target, class }], ok }`——补例入 T4）；
  - **物化副本（真目录）缺省不替换**（打包窗在场——`RELEASE.md` §5.3 物化纪律）；`--force` 才换（显式——仅物化副本类；**明示不入本批判据**：替换 = 对真实 `node_modules` 的破坏性写入，批本地件不构造；该类判定由 T4 纯函数例覆盖）；
  - 零依赖（全 `node:` 面）；纯函数可直测（`classify` ∕ `canonicalTarget` 导出）。
- **环境收敛（ops 动作 · 必披露 · 本机）**：`node scripts/dev-link.mjs` ⇒ 修 cli core 链（`d:`→`D:`）；`--check` 复判 = 0；跨包恒等复测（vsc↔cli · `queued.mjs`）= `true`。**B2 锁零触**（其「最强可达形」维持——父侧已裁）。
- 文档：`CORE-UNIFICATION.md` §2.6.1（dev 链接恢复 ∕ 判 = 本工具）+ `RELEASE.md` §5.3（收敛序 `npm install` → `npm link` → **dev-link**）；CI 零改（ubuntu 无盘符面）。
- **否决**：① 仅文档「npm link 用大写盘符」——不可机检 ∕ 不可修；② 消费侧比较全改 realpath ∕ lowercase——不改产生方（与父口径相抵）+ 模块恒等是 loader 级语义（用户码不可 patch）；③ 依赖 `npm link` 重做——拼写随进程漂（复发源）；④ 改物化 ∕ npm install 面——发布链面，越本批。

#### 2.2.3 判据（case 变体 ∕ 逐链规范）

- **T1 台账键 case 变体**：`ledgerKey('D:\\x') === ledgerKey('d:\\x')` —— **本设计轮实读 true**（键值 = `056b8aee16abdaab`）。
- **T2 session 槽 case 变体**：`sessionPath('d:\\x') === sessionPath('D:\\x')`（`_setSessionsDirForTest` 缝，不碰真实目录）+ `normalizeCwd` 直驱（`d:/a/b` → `D:/a/b`）。
- **T3 其余键面**：checkpoint ∕ traces ∕ peers 同判（可达面直驱；不可达面 = 结构扫描 `normalizeCwd` 单源）。
- **T4 链面**：工具纯函数面单测（`classify` ∕ `canonicalTarget` 含「同路径异拼写」+「物化副本」例）+ 本机 `--check` 退出码读数 + `--check --json` 可解析 ∕ 五链记录 ∕ 字段面（§5 记录）。
- **T5 跨包恒等复测**（环境收敛后）：`queued.mjs` vsc-link ∘ cli-link `===` → true（复测读数；**不改任何锁档**）。
- **T6 负控**：工具对合成「异拼写」夹具判红（防判据空过）。
- 现存用例档注：core 测试树 09-28 全清后 = `run.mjs` ∕ `slow.mjs` 两档（09-25 批的 `ledger-key-normalize.test.mjs` 已随清）⇒ 本批判据 = **批本地件** `docs/batches/2026-09-29-core-hygiene.test.mjs`（档案制）。

#### 2.2.4 台账并轨结论（转引）+ 现读残留

- **在册行 = 有**：#286（需求 · 已核销）+ #287（tech_todo · 已核销），task_book = `docs/batches/2026-09-25-ledger-key-normalize.md`（已收口冻结）。交付物实读在位：键归一（`ledger-db.mjs:41-43`）· 迁移命令面（`ledger-migrate.mjs`）· 审计面；实跑证据 = `ledger-backup/20260925-060441/migrate-report.json`（296→324 · 源 28 行全迁 · recycled）+ `ledger-trash/20260925-060441/16012aba….db`（28 行在盘）。
- ⇒ **本批 = 转引：不重复设计 ∕ 不重复实施**。派单前提「sha1 未规范化」= **已消解态**（描述对象为 09-25 前）。
- **迁移评估 = 已交付**（296+28→324 · 幂等护栏 · 备份两道 · 源回收不删）；存根审计 = 命令面在册（本批只读 re-run 读数见下）。
- **现读残留（如实 · 非现役代码复现）**：本刻 `ledger audit`（只读）读数 = 目标库 1（580 行）+ **变体源 `16012aba….db` 1 行**（`#19b…` · 已废弃；DDL 无 `executor` 列 = 旧构建产物；birth ∕ mtime 换算本地 = 09-25 06:29 ∕ 06:30 —— **迁移批（06:04:41）之后 25 分钟**）⇒ 定性 = **旧代码写者的一次写入**（未重启进程 ∕ 旧内嵌核产物；具体进程未取证）——**非仓内现役代码**（T1 实读 true；五 junction 全活链）。
- 处置建议（**父侧 ops · 本批不执行**）：`thincoder ledger audit` → `migrate --dry-run` →（幂等护栏内）`--confirm` 回收；根治 = 旧写者退场（装载旧核的窗口重启 ∕ 发布新核后旧产物退场）。

### 2.3 #579 方案：核 `agent.mjs` 三拆

#### 2.3.1 目标与口径

- 债 = **函数层首判据**：`runAgent` `:102-:461` ≈360 行（≥300 不达标）；档 462（B1 后 ≈468）。
- 口径：**导入面零改**（23 名既有导出面全保——re-export 承接）· **行为零变**（逐字搬移 + 对拍判据）· **先 B1 后本件**（同文件族串行）。
- 先例 = 拆分族既成形（外提 + re-export 保面：`session-slots-manifest.mjs` ∕ 桌面 `mount-settings` 四拆 ∕ `events` 三拆形）。

#### 2.3.2 切点表（verbatim 搬移 · 坐标 as-of 未含 B1 增行）

| 新档 | 迁入段（现坐标） | 内容 | 新档导出 |
|---|---|---|---|
| `agent/run-start.mjs` | `:104-:190` | 起跑前段（distill await ∕ pendingAsync 注入 ∕ `_inAutoTurn` ∕ prepareRun ∕ `_runStartHistoryLen` ∕ 复位块 ∕ auto-turn 域文本 ∕ eng 授权注释块） | `beginRun(agent, input, callbacks, opts) → { maxTurns, threshold, toolSchemas, toolByName, systemPrompt }`（opts 键面 = D4；`tools` 死绑定去——KD-8） |
| `agent/turn-loop.mjs` | `:191-:220` ∥ `:224-:269` ∥ `:318-:446` ∥ `:448-:451`（真区间 = `:224-:446` **扣除** chat-call 段 `:270-:317`——两行零交叠） | 回合环（循环局部 ∕ `_ctxBasis` ∕ drainChildUpstream ∕ `_turnFilesMark` ∕ `for` 循环本体 verbatim（扣 `:270-:317`）∕ 零落盘结账 + `ContinueError`） | `runTurnLoop(agent, ctx)`（ctx 键面 = D4） |
| `agent/chat-call.mjs` | `:270-:317`（环体 `:224-:446` 内切出段——同 turn-loop 行扣除；+ `streamOutputAllowed` 定义 `:95-:99` 随迁） | 模型调用（messages 组装 ∕ autoThink ∕ chat ∕ AbortError-中断臂） | `callModelTurn(agent, ctx) → response`（ctx 键面 = D4）+ `streamOutputAllowed`（agent.mjs re-export 保面） |
| `agent.mjs`（留） | `:1-:100` + 新 `runAgent` 编排 | 编排（beginRun → `try{ runTurnLoop }catch{thrownError}finally{finalizeAgentTurn}`）+ 状态工厂 + 面 | `runAgent(agent, input, callbacks = {}, opts = {})` **签名逐字不动** |

- **控制流零转换**：环内 `continue` ∕ `return cr.content` ∕ `throw ContinueError` 全留 turn-loop 内——无 return-协议改造（行为等价结构性成立）。
- 行数估：runAgent ≈ 100–125 · run-start ≈ 110–120 · turn-loop ≈ 240–250 · chat-call ≈ 70–80（全体 ≤300 ✓）。
- 机械改写 = 三类：缩进 ∕ 包裹行 + 相对说明符（`./agent-tools/x` ↔ `../agent-tools/x`）+ import 重排 ∕ 接口收窄（新写面——D1 第三类声明；`tools` 去留 = KD-8）。

#### 2.3.3 导入面零改（23 名逐名锁）

- 面 = **23 名**：`runAgent` ∕ `createAgent` ∕ `streamOutputAllowed` ∕ `ContinueError` ∕ `listWorkDir` ∕ `loadProjectInstructions` ∕ `readonlyToolNames` ∕ `collectGitContext` ∕ `escapeXml` ∕ `MIN_REPORT_CHARS` ∕ `REPORT_CONTINUATION` ∕ `DEFAULT_SUBAGENT_TURNS` ∕ `SUBAGENT_TOOL_EXCLUSIONS` ∕ `excludeSubagentTools` ∕ `hasCodeMutations` ∕ `PERSONA_ENGINEERING` ∕ `PERSONA_NORMAL` ∕ `COMMON` ∕ `DISCIPLINE_ENGINEERING` ∕ `DISCIPLINE_NORMAL` ∕ `CONSULT_BASE` ∕ `ENG_ON_REMINDER` ∕ `ENG_OFF_REMINDER`。
- 消费面 **19 档**（不动）：核 8（`agent/spawn-child.mjs:20` · `agent-tools/consult.mjs:25` · `eng.mjs:17` · `escalate-async.mjs:28` · `skill.mjs:2` · `subagent-actions.mjs:17` · `subagent-async.mjs:19` · `subagent-spawn.mjs:18`）· CLI 5（`acp/session.mjs:16` · `cli/make-agent.mjs:3` · `command-interactive.mjs:8` · `tui/agent-turn.mjs:17` · `tui/cmd-eng.mjs:14`）· 桌面 3（`src/main/agent-assemble.mjs:19` · `agent-host.mjs:36` · `turn-face.mjs:27`）· VSC 3（`src/agent/run-stages.mjs:42` · `src/extension/image-handler.mjs:25` · `panel-turn-loop.mjs:17`）。
- 新档 = **内部面**（不被 re-export；零新公开名——`streamOutputAllowed` 除外：原地迁 + re-export 同面）。

#### 2.3.4 对拍判据（行为零变）

- **D1 逐字搬移核（主判据）**：以 P2 起点刻工作树实读副本（或起点实情下之 `HEAD` 版——§2.10-C）为源，逐段与三新档对拍。**段清单（分母 = 7，段间零交叠）**：run-start `:104-:190`（1 段）· turn-loop `:191-:220` ∥ `:224-:269` ∥ `:318-:446` ∥ `:448-:451`（4 段——`:270-:317` 归 chat-call 已扣除）· chat-call `:270-:317` ∥ `:95-:99`（2 段）。**容许改写 = 三类**：① 缩进 ∕ 包裹行；② 相对说明符（`./x` ↔ `../x`）；③ **import 重排 + 接口收窄**（新写面：三新档 import 块 ∕ 三接口签名 ∕ ctx 装配；实例即声明面——收窄实例 = 解构行 `tools` 去（KD-8），报告逐处列）。断言各段行序列逐行相等（三类外零差异）。报告形 =「7/7 段吻合（+ 声明改写 N 处）」。
- **D2 面锁**：`agent.mjs` 导出名集合 = 23 名（集合相等机检）；四档 `node --check` + 装载（`import(...)`）零抛。
- **D3 结构哨兵**：agent.mjs 现档不含已迁哨兵串（`for (let turn` ∕ `_continueSegments = resume` ∕ `await chat(agent.provider`）；三新档各含对应哨兵。
- **D4 投影核（自由变量逐段投影）**：逐段枚举所读自由变量（段内未绑定者），断言各自在新档签名 ∕ ctx ∕ 本档 import 内出现——漏一即静默行为丢失（`node --check` ∕ `import()` 不触）。
  - 段级归属：run-start 面 ← `:104-:190`；turn-loop 面 ← `:191-:220` ∥ `:224-:269` ∥ `:318-:446` ∥ `:448-:451`；chat-call 面 ← `:270-:317` ∥ `:95-:99`。
  - 跨界面枚举（设计轮 as-of 现盘；实施轮届盘重导后逐条复核）：run-start ← `{ agent, input, callbacks }` + opts `{ depth, signal, overrideTurns, resume, autoTurn, upstreamTurn, timerTurn, extraTools }`；turn-loop ← `{ agent, maxTurns, threshold, toolSchemas, toolByName, systemPrompt, depth, signal, autoTurn, streamOutput, consumeInjected, consumeQueuedInput, callbacks }`（`autoTurn` ∕ `streamOutput` 经此转发至 chat-call）；chat-call ← `{ agent, systemPrompt, toolSchemas, streamOutput, callbacks, signal, streamRuleFired, autoTurn, depth, turn }`。
  - 逐键消费点（缺一即该点静默失效）：`consumeQueuedInput` `:258` ∕ `streamOutput` `:283` ∕ `autoTurn` `:296` ∕ `streamRuleFired` `:197`→`:288`（跨接口键实例）；模块级引用 = 各新档 import 块承载。
  - 报告形 = 各档「自由变量 N/N 有落点」。
- **D5 端到端等价轮（P2 必备）**：按先例范式复建夹具（本地环回 SSE + 调用方注入 `provider`——入口 = `agent.mjs:279` `chat(agent.provider, …)`；先例 = `.thincoder/tmp/old-cli-susp-test.mjs:14-38` 脚本服务器 ∕ `:39-42` `createAgent({ provider, … })` ∕ `:220` `{ baseURL, apiKey, model }` 真跑——归档副本按形态复建、不原址直跑）。
  - 一条等价轮（tool-call 轮 + 收尾）真跑 `runAgent`；观测面 = 终态 content ∕ 工具执行 ∕ 关键历史形态。
  - **拆分前（P2 起点快照态）先跑记基线 → 拆分后复跑，观测面逐项相等**；报告形 =「等价轮 2/2 绿（前 ∕ 后）」。
  - 夹具随批本地件（暂存 → 父侧 copy 终位——两层深相对 import 同形）。
- **缝 ∕ 判据**：`provider/**` 无**模块级 stub ∕ 注入缝**（实读）——但**可达缝在**：调用方注入 `provider` 对象（`agent.mjs:279` `chat(agent.provider, …)`）+ 本地环回 SSE 服务器（先例 = `.thincoder/tmp/old-cli-susp-test.mjs`）。⇒ **端到端等价轮入判据体 = P2 必备（D5）**；行为零变 = D1 逐字核 + D2 ∕ D3 面锁 + D4 投影核 + D5 真跑。
- **落位摩擦在册**（台账 #545：写门拒子代理写 `docs/batches/*.test.mjs`）⇒ 立即形 = 暂存 `.thincoder/tmp/2026-09-29-core-hygiene.test.mjs`（两层深，相对 import 同形）→ 父侧 copy 终位；复跑 = `node --test docs/batches/2026-09-29-core-hygiene.test.mjs`。

### 2.4 受影响文件表（行数账）

| 树 | 文件 | 现值 | → 估 | 动作 |
|---|---|---|---|---|
| core | `thincoder-core/agent.mjs` | 462 | ≈ 100–125 | 编排残留 + 面（re-export 块原样） |
| core | `thincoder-core/agent/run-start.mjs` | — | 新 ≈ 110–120 | 起跑前段（verbatim） |
| core | `thincoder-core/agent/turn-loop.mjs` | — | 新 ≈ 240–250 | 回合环（verbatim） |
| core | `thincoder-core/agent/chat-call.mjs` | — | 新 ≈ 70–80 | 模型调用 + `streamOutputAllowed` |
| scripts | `scripts/dev-link.mjs` | — | 新 ≈ 120–160 | 五链建 ∕ 修 ∕ 判（工程工具面） |
| 文档 | `docs/batches/2026-09-29-core-hygiene.test.mjs` | — | 新 ≈ 170–250 | 批本地判据件（T1–T6 + D1–D5；D5 环回夹具） |
| 文档 | `docs/core/design/CORE-UNIFICATION.md` ∕ `docs/RELEASE.md` | — | Δ 小 | 工具句（§2.8） |
| 文档 | AGENT-LOOP 系 + `STRUCTURE-DEBT.md`（§2.8 清单） | — | Δ | 拆分归属句 + 坐标随动 |

**零改面**：`thincoder-vscode/**` ∕ `thincoder-cli/**` ∕ `thincoder-desktop/**`（产品码）· `thincoder-core/**` 其余 · `ledger-db.mjs` ∕ `ledger-migrate.mjs` · B2 锁档 ∕ B1 在途档 ∕ CI。

### 2.5 实施序

| 段 | 内容 | 前置 ∕ 串行 | 回退半径 |
|---|---|---|---|
| P0 | 基线读数（`dev-link --check` 现状 = 预期 1 红 + 台账 audit 读数） | 无 | 只读 |
| P1 | #577：`scripts/dev-link.mjs` + 环境收敛 + 判据 T1–T6 + 文档两处 | 无（与 B1 并行安全——文件零交叠） | 单工具 + docs |
| P2 | #579：三拆（B1 收口后届盘重锚 → 逐字搬移 → D1–D5：D4 投影核 + **D5 端到端等价轮（必备**——先跑基线 → 拆分后复跑）） | **B1 实施收口** | core 4 档（单提交可 revert） |
| P3 | 文档面收正（§2.8；B1 文档窗后）+ 台账核销建议 | P1 ∕ P2 | docs |

**实现面路由**：P1 工具 = `scripts/**` 工程工具面（父侧直改授权——机械件 + 判据已过设计）；环境收敛 = ops（必披露）；批本地判据件 = 实施者写（`.thincoder/tmp` 暂存 → 父侧 copy 终位）；P2 = 产品码（eng-coder + 设计 token）；P3 设计档笔权 = eng-designer。

### 2.6 验收对照（回指）

| AC | 判据 | 面 | 状态 |
|---|---|---|---|
| AC1 | #577 方案：产生方三族盘点 + link 修复工具 + 判据 T1–T6 | §2.2 | ✓ |
| AC2 | #577 台账并轨结论：在册行 = 有 ⇒ 转引；迁移评估 = 已交付；残留现读 + 处置建议 | §2.2.4 | ✓ |
| AC3 | #579 方案：切点 ∕ 新档 ∕ 导入面零改 ∕ 对拍判据 | §2.3 | ✓ |
| AC4 | 受影响文件表 + 实施序（两件分批 ∕ B1 串行） | §2.4 ∕ §2.5 | ✓ |
| AC5 | §2 落盘（本段 append + 状态行） | 本段 | ✓ |

### 2.7 关键决策 + 上抛项

- **KD-1** 设计档落点 = §2 自持（先例 B1 ∕ B2）；机制结论实施轮并入权威档（§2.8）。
- **KD-2** #577 = **修产生方**；模块解析面零改；全路径折叠否决（键面迁移成本 ∕ 链面破坏真拼写——§2.2.1）。
- **KD-3** link 工具 = `scripts/dev-link.mjs`（`.native` 规范形 + junction 原样存储实证）；`npm link` 不废除（标准开发命令），**收敛 ∕ 判面** = 工具。
- **KD-4** 台账半 = 转引（#286 ∕ #287 已交付）；本批零触台账代码。
- **KD-5** #579 = 逐字搬移（控制流零转换）；三新档；面锁 23 名。
- **KD-6** 行为对拍主判据 = D1 逐字核 + D2 ∕ D3 面锁 + **D4 投影核 + D5 端到端等价轮（P2 必备**——可达缝 = 调用方注入 `provider` + 环回 SSE；§2.3.4 缝 ∕ 判据条）。
- **KD-7** B1 串行（P2 锚 = B1 收口后届盘重锚）；B2 锁零触。
- **KD-8** 接口收窄 = 声明类：`tools` 死绑定 **去**（`agent.mjs:131` 解构 · 全 runAgent 零读取——实读 ∕ grep 复证；`prepareRun` 仍返回该键，`setup.mjs` 零改）——解构行 ∕ `beginRun` 返回面（5 键）均不携；三新档 import 块 ∕ 接口签名 ∕ ctx 装配 = 新写面（收窄 ∕ 重排实例归 D1 第三类声明面）。

**上抛项（逐条）**：

- **F1**（面状）core 测试树全清后现值 = `run.mjs` ∕ `slow.mjs` 两档——本批判据落批本地件（合规）；报告。
- **F2**（残留）台账现读变体源 1 行（§2.2.4）——旧代码写者（具体进程未取证）；处置建议在册（ops：audit → migrate）；本批不执行。
- **F3**（披露）`npm link` 的全局联结副作用（`%APPDATA%\npm\node_modules\@thincoder\core`）——本工具不创建全局联结（直建产品链）；与既有实践差一行披露。
- **F4**（登记）`memory/origin.mjs:21` 内联盘符归一（与 `normalizeCwd` 同语义重副本）——可选单源化微件（键值零变），非本批。
- **F5**（登记）B2 锁跨包恒等断言在环境收敛后可升级 `===`——**不改**（他批在途 · 父侧已裁「最强可达形维持」）；收敛后可选收正另裁。
- **F6**（量）`agent.mjs` 引用密度 = 343 处 ∕ 44 档（本设计轮 census）⇒ 实施轮按「**语义句收正 + 纯行号 as-of 留存**」口径处理（top 档 = §2.8）。

### 2.8 实施轮须收正的权威档清单（防漏改）

> 执行口径（P3）：**逐行过清单签收**；档内引行处理 = F6（语义句收正 + 纯行号 as-of 留存）；收正读数留 §5 ∕ §6。

| 档 | 逐处 | 收正内容 |
|---|---|---|
| `docs/core/design/CORE-UNIFICATION.md` | §2.6.1（安装口径表） | dev 链接恢复 ∕ 判 = `node scripts/dev-link.mjs` |
| `docs/RELEASE.md` | §5.3（恢复收敛序行邻位） | 收敛序补第三步（dev-link） |
| `docs/core/design/AGENT-LOOP.md` | 主循环归属句 ∕ §2.3 现态块（实施轮实扫） | runAgent 编排 + 三档归位 |
| `docs/core/design/STRUCTURE-DEBT.md` | §2 #3 行（`:20`，引 `agent.mjs:147` ∕ `:142-159`） | 复位块新家 = `agent/run-start.mjs` |
| AGENT-LOOP 系（UPSTREAM ∕ SUBAGENT ∕ ASYNC-POOL ∕ TURN-CAP-CONTINUE ∕ CONTEXT-COMPACTION ∕ SEND-STALL-DISTILL ∕ TOOLS） | 游标 ∕ 复位 ∕ 压缩点 ∕ 蒸馏点 ∕ turnSeq 语义句 | 新档归位；纯行号 as-of 留存（口径句一行） |
| `docs/vsc/design/VSC-DEBT.md` §12.1 | 读数行 | **B1 先改**；本件不触 |

### 2.9 修正块（评审 #96 · §3 轮次 1 · 发现 1–5 逐号落定 · eng-designer · 2026-09-29）

> 性质：评审 #96（🔴0 · 🟡3 · 🔵2 · pass，§3 轮次 1 在册）五条的唯一权威落点。形式 = **段内就地修正**（本作者段内——与评审发现相抵的旧表述已就地删除、无残体，原行可由 git 历史逐字复核）+ 本块逐条记录；零新语义（只落评审五条 + 父侧裁定）；产品码 ∕ 测试件 ∕ 核件 ∕ §5 ∕ §6 ∕ 其它批射程 = 零触。坐标 = 本块 append 前实读。

**逐号收口（1..5）**

| # | 处置 | 改动（本档 file:line） |
|---|---|---|
| 1 | ✅ 落 | `:112`（turn-loop 行：真区间 = `:224-:446` 扣除 `:270-:317`，并列子段四处）；`:113`（chat-call 行：内切出注——两行零交叠）；`:128`（D1 钉死段清单 7 段 + 分母口径） |
| 2 | ✅ 落（提升） | `:136-139`（D5 = P2 必备：夹具范式 ∕ 环回 SSE + 注入 provider ∕ 拆分前后基线对拍 ∕ 报告形）；`:140`（局限句改写为准确表述：无模块级 stub——可达缝在）；`:164`（P2 序 = D1–D5）；`:186`（KD-6 同步） |
| 3 | ✅ 落 | `:131-135`（D4 投影核：段级归属 + 跨界面键面逐项枚举 + 逐键消费点）；`:128`（D1 第三类 = import 重排 + 接口收窄 + 实例声明）；`:118`（改写类 2 → 3）；`:111` ∕ `:113`（接口键面注）；`:188`（KD-8 = `tools` 死绑定去留口径：去） |
| 4 | ✅ 落 | `:71`（target 派生规则 = `package.json` 声明 × 兄弟目录 + 目标缺位动作）；`:74`（apply 逐链动作 + `--json` 输出契约）；`:75`（`--force` 明示不入本批判据 + 理由）；`:86`（T4 补「物化副本」+ `--json` 例） |
| 5 | ✅ 维持 + 口径落字 | `:201`（§2.8 注：P3 逐行签收 + F6 口径）；其余零改（建议即「维持」） |

- **相抵旧表述 = 已删**（git 历史留存；无残体）：旧「端到端真跑零变不入判据体（不构造）」· 旧「自现存链派生」· 旧「两类机械改写」· 旧 `:224-:446` 无扣除声明行。
- **计数同步**：D 族 = **5**（D1–D5）；D1 段分母 = **7**（run-start 1 ∕ turn-loop 4 ∕ chat-call 2）；收窄实例 = **1**（`tools`）；判据件估 ≈ **170–250**。
- **读回核验**：修正面落毕后逐处复读（结论见交付报告）。

### 2.10 P2 ∕ P3 就绪核与届盘重锚（eng-designer · 2026-09-29 · 触发 = B1 §6 收口 · 零实施）

> 性质：设计面就绪核（四件 = 改动面 ∕ 判据 ∕ 验收 ∕ 行数账，逐项）+ 届盘坐标重锚 + 缺件补强；产品码 ∕ 测试件 ∕ 核件零写。
> 触发依据 = B1 批档 §6「已收口 2026-09-29」；P2 启动条件（§2.5 P2 行「B1 §6 收口后届盘重锚」）已满足。
> 坐标 = 本块 append 前实读（仓根工作树 · 本机 2026-09-29 11:4x）。
> **效力**：本块 = 坐标 ∕ 消费面 ∕ census 的届盘权威——与上文 as-of 记法不一致处，以本块为准（差异 = 漂移，非语义变更）。

**A · 届盘量与口径消歧**

- `thincoder-core/agent.mjs`：**内容行 466**（行 1–466；`:466` = runAgent 闭合 `}`）· `split("\n").length` = **467**（含末空行元素——§2.0 口径字面值）。两值并列防复漂：在册「466（split 口径）」（台账 #579 ∕ B1 §5 台账材料）实为**内容行数**；B1 §5.P4-I 行数账「467（+5）」（`docs/batches/2026-09-29-parity-b1-vsc-core.md:694`）= **split 字面值**——两记法同指一态。
- 漂移 = **+5**（462 → 467 split），全部来自 B1 两处 hunk（`git diff HEAD` 实读；工作树未提交）：① 回合域文本块（`:181-186` 区，净 +3）· ② 蒸馏块（`:387-392` 区，净 +2）。均为 P4-I 端壳键（`turnDomainText` ∕ `distillSignal`）。
- `runAgent` = **`:102-:466`（365 行单函数）**——函数层首判据（≥300）仍成立。

**B · D1 段表届盘重锚（分母 = 7 不变 · 段间零交叠）**

| # | 段 | as-of | 当前 | 头 ∕ 尾锚（当前行） |
|---|---|---|---|---|
| 1 | run-start | `:104-:190` | **`:103-:193`** | 头 = distill await 注释首行（`:103`）；尾 = eng 授权注释块末行（`:193`） |
| 2 | turn-loop a | `:191-:220` | **`:194-:223`** | 头 `let guardPushbacks = 0`；尾 `agent._turnFilesMark = agent._touchedFiles.length` |
| 3 | turn-loop b | `:224-:269` | **`:227-:272`** | 头 `for (let turn = 0; …`；尾 = `await injectTurnReminders(agent, { depth })` 后空行 |
| 4 | chat-call | `:270-:317` | **`:273-:320`** | 头 `const messages = [{ role: "system" …`；尾 = chat 调用 catch 块闭合 `}` |
| 5 | turn-loop c | `:318-:446` | **`:321-:451`** | 头 = 空行（语义首 = builtinToolResults 注释行 `:322`）；尾 = `for` 闭合 `}`（`:451`） |
| 6 | turn-loop d | `:448-:451` | **`:453-:456`** | 头 = #417 收尾注释首行（`:453`）；尾 `throw new ContinueError(maxTurns)`（`:456`） |
| 7 | chat-call ② | `:95-:99` | **`:95-:99`** | `streamOutputAllowed` 全块——零漂 |

- 段 1 头记法收正：as-of `:104` = 注释二行起记；本重锚取**注释整块**（`:103` 起）——防注释首行留守孤儿。
- 留守面（agent.mjs 不迁）= `:1-:94` + `:100-:102`（头 ∕ import ∕ `createAgent` ∕ re-export ∕ doc ∕ 签名；中间段 7 `:95-:99` 随迁扣除）+ `:224-:226`（空 ∕ `let thrownError` ∕ `try`）+ `:457-:466`（catch ∕ finally ∕ 闭合）——新 runAgent 编排承载；段间留守缝 = `:224-:226` ∕ `:452`。
- 漂移分区：`:103-:181` 零漂 · `:182-:387`（旧记）+3 · `:388+`（旧记）+5。
- 实施轮复导：以 P2 起点快照按「锚串逐段重导」（本表头 ∕ 尾锚即锚串）；复导读数入 §5。

**C · D1 源修正（就绪核发现 ① · 就地补强）**

- 发现：设计 D1 原文「P2 起点快照 = `git show HEAD:thincoder-core/agent.mjs`」——届盘失效风险：`git status` = 未提交 **121 unstaged + 37 untracked**（含 `agent.mjs` 本体 ∕ B1 全码面 ∕ B4 ∕ B5 波面）；`HEAD` 版 = B1 前态（462）≠ 工作树（467）。
- 收正：P2 起点源 = **起点刻工作树实读副本**；父侧若在派单前落波面提交，则 `git show HEAD:` 可作快照源（两者择一，以起点实情定）。对拍语义不变（快照 ⇄ 三新档逐字）。
- 起点复核：`git diff HEAD -- thincoder-core/agent.mjs` 读数登记（预期 = B1 两 hunk；另有增量 ⇒ 并段报告）。

**D · D3 ∕ D4 ∕ D5 ∕ KD-8 坐标随迁（同一届盘）**

- D3 哨兵（agent.mjs 现档不含 ∕ 三新档各含）：`for (let turn` **`:227`** · `agent._continueSegments = resume` **`:146`** · `await chat(agent.provider` **`:282`**。
- D4 逐键消费点：`consumeQueuedInput` **`:261`**（as-of `:258`）· `streamOutput` 实参位 **`:286`**（as-of `:283`）· `autoTurn`（logCtx）**`:299`**（as-of `:296`）· `streamRuleFired` 定义 **`:200`** → 消费 **`:291`**（as-of `:197`→`:288`）。跨界面键面枚举与段级归属（as-of 键）语义零变。
- D4 键面届盘补列（run-start +4 ∕ turn-loop +1；B1-P4-I 新增键——坐标 = `thincoder-core/agent.mjs`，本轮实读复核）：run-start ← `injections` ∕ `promptTail` ∕ `toolDecorate`（**`:135`**，入 prepareRun 实参）· `turnDomainText`（**`:185`**，域文本选择消费）；turn-loop ← `distillSignal`（**`:390`**，蒸馏调用实参）。五键须随 opts ∕ ctx 逐键携带——`??` 回落径静默（漏一即行为丢失；`node --check` ∕ `import()` ∕ D5 核侧等价轮均不触）。
- D5 缝位：`chat(agent.provider, …)` 调用点 = **`:282`**（as-of `:279`）；夹具范式件 `.thincoder/tmp/old-cli-susp-test.mjs` 在盘（按形态复建、不原址直跑——维持）。
- KD-8：`tools` 死绑定 = **`:131` 解构行（零漂）**；零读取复证（本轮 grep：绑定面无第二读点——命中皆注释 ∕ `toolSchemas` 值面 ∕ 路径串）；`prepareRun` ∕ `setup.mjs` 零改维持。

**E · 导入面届盘重锚（门锁 23 名零漂 · 消费面 19 → 18 档）**

- D2 门锁：导出名集合 = **23 名**（本轮重导复核，`runAgent` 在内）。
- 消费面现盘 = **18 档**（口径 = 产品树四端 `thincoder-core` ∕ `thincoder-cli` ∕ `thincoder-vscode` ∕ `thincoder-desktop`；`bench/**` ∕ gitignored `.thincoder/tmp/**` 不计入此分母）：
  - core 10：`agent/assemble.mjs` · `agent/spawn-child.mjs` · `agent-tools/{consult,eng,escalate-async,skill,subagent-actions,subagent-async,subagent-spawn}.mjs` · `vision-reader.mjs`
  - CLI 5：`acp/session.mjs` · `command-interactive.mjs` · `tui/agent-turn.mjs` · `tui/cmd-eng.mjs` · `test-startup.mjs`
  - VSC 1：`extension/panel-turn-loop.mjs`（动态 import）
  - 桌面 2：`agent-host.mjs` · `turn-face.mjs`
- 对 as-of 19 档差异：**−4** = VSC `src/agent/run-stages.mjs`（B1 删档）· VSC `src/extension/image-handler.mjs`（届盘无 `agent.mjs` 直引）· 桌面 `src/main/agent-assemble.mjs` ∕ CLI `src/cli/make-agent.mjs`（B5 改道 `@thincoder/core/agent/assemble.mjs`）；
  **+3** = core `agent/assemble.mjs` ∕ core `vision-reader.mjs` ∕ CLI `test-startup.mjs`（并行波新档）。
- 实施轮：P2 起点一行扫描复导消费面（扫描面 = 产品树 18 档 + 清单外 `bench/**` ∕ gitignored `.thincoder/tmp/**` 同扫——`bench/probe/driver.mjs:13` 实读 = `createAgent` ∕ `ContinueError` 消费方；读数入 §5）；18 档 = 「导入面零改」验证分母。

**F · 行数估带刷新**

| 档 | 届盘 | → 估 |
|---|---|---|
| `agent.mjs`（留） | 466 | ≈ 100–130（编排 + 面） |
| `agent/run-start.mjs` | — | ≈ 110–125（段 91 + import ∕ 包装） |
| `agent/turn-loop.mjs` | — | ≈ 230–250（段 211 = 30+46+131+4 + import ∕ 包装） |
| `agent/chat-call.mjs` | — | ≈ 60–80（段 53 = 48+5 + import ∕ 包装） |
| 判据件（批本地） | 160（T1–T6 已落） | +D1–D5 ⇒ ≈ +60–150 |

**G · P3 就绪核（文档面 · 另波）**

- 触发：B1 §6 已收口 + B1 文档窗已含 ⇒ P3 前置满足。
- §2.8 逐档实读在位：`CORE-UNIFICATION.md:454`（§2.6.1）· `RELEASE.md:100`（§5.3；恢复收敛序句 `:116`）· `AGENT-LOOP.md:178`（归属句）∕ `:198`（§6.2 主循环节）
  - `STRUCTURE-DEBT.md:20`（§2 #3；其内引 `agent.mjs:147` ∕ `:142-159` = 09-15 as-of，正待收正）· AGENT-LOOP 系 7 档在盘
  - `VSC-DEBT.md §12.1`（`:252`）= **B1 已落**（`:328` 455⇒9 + 收口刷新块 5344⇒2304）⇒ 该行核销、本件维持不触
- 补强一（census 重锚 + 余量处置）：非批档 census 届盘 = **347 处 ∕ 45 档**（原口径，含 `make-agent.mjs` 字面撞形；设计轮 343 ∕ 44 ⇒ +4 ∕ +1）；去撞形精确 = **317 处 ∕ 39 档**（其中 `thincoder-core/agent.mjs` 前缀引 = 123 处；口径可复算）。§2.8 未列余量（top）与处置：

| 余量档 | 数 | 处置 |
|---|---|---|
| `DOC-DISCIPLINE.md` | 17 | J-1 残差块对核 agent.mjs 的两坐标行（`:115 §23.3.1` ∕ `:208 §7.2`——行随拆分迁移）⇒ P3 顺扫收正 |
| `MODEL-BENCH.md` | 8 | KD-43 `:157`（`_touchedFiles` 每 run 重置）语义句 ⇒ P3 顺扫；余 = 纯行号 as-of 留存 |
| `desktop/{IPC,PROJECT,UI}.md` | 17 | 低密度——P3 实施轮实扫（语义句收正 ∕ as-of 留存同口径） |
| `core/requirements/{AGENT-LOOP,SEND-STALL-DISTILL,TURN-CAP-CONTINUE}.md` | 13 | **需求层——笔权 = 主 agent**：P3 列报不改笔 |
| `TODO-archive.md` ∕ `_archive/**` | 14 | 记录面 ⇒ 不触 |

  其余低密度（`DOC-SYSTEM` 4 · `ENGINEERING-MODE-V2` 4 · `ARCHITECTURE` 3 · `RENDER-CORE` 3 · `WEBVIEW` 3 · `ACP-CLIENT` 2 · `DESIGN-TOKEN-SETTLEMENT` 2 · `ESCALATE` 2 等）：P3 实施轮实扫同口径。
- 补强二（判据具体化）：① 逐处读回（D6）；② `node scripts/doc-check.mjs` 零新增（悬空 ∕ 行宽——存量悬空归 #588 清账轮，不混）；③ 语义句判据 = 语句 ∕ 三新档实位一致（新家点名 = `agent/run-start.mjs` ∕ `agent/turn-loop.mjs` ∕ `agent/chat-call.mjs`；`runAgent` 编排留 `agent.mjs`）；④ F6 口径复核（纯行号 as-of 留存 = 合规形态，不逐处改）。
- 补强三（验收）：**AC6** = §2.8 清单 + 余量表逐行签收（收正处逐处读回）+ doc-check 零新增 + 台账核销建议（#577 ∕ #579）落 §5 ∕ §6。
- 边界：需求层 ∕ 记录面 ∕ #588 悬空清账轮面 ∕ B1 已结面零触；产品码零触。

**H · 就绪核逐项结论（四件）**

| 阶段 | 改动面 | 判据 | 验收 | 行数账 | 结论 |
|---|---|---|---|---|---|
| P2 | ✓（4 档 + 判据件，§2.3.2） | ✓ D1–D5（本轮重锚） | ✓ AC3 ∕ AC4 | ✓ 补强（A–F） | **评审就绪** |
| P3 | ✓ 补强（§2.8 + 余量表） | ✓ 补强（①②③④） | ✓ 补强（AC6） | ✓ 补强（census） | **评审就绪** |

**评审面**：本块（§2.10）+ §2.3.2 ∕ §2.3.3 ∕ §2.3.4 届盘重锚处；核对面 = `thincoder-core/agent.mjs`（工作树）· 消费面 18 档 · P3 目标档（§2.8 + 余量表）· B1 批档 §6 ∕ 台账 #579 读数。本块零新机制语义（改动 = 坐标重锚 ∕ 就绪补件 ∕ 记法消歧）。

### 2.11 修正块（评审 #139 · §3 轮次 2 · 发现 1–5 逐号落定 · eng-designer · 2026-09-29）

> 性质：评审 #139（🔴0 · 🟡2 · 🔵3 · pass，§3 轮次 2 在册）五条的唯一权威落点。形式 = **段内就地修正**（本作者段内——与评审发现相抵的旧表述已就地删除、无残体，原行可由 git 历史逐字复核）+ 本块逐条记录；零新语义（只落评审五条 + 父侧裁定）。产品码 ∕ 测试件 ∕ 核件 ∕ §3 ∕ §4 ∕ §5 ∕ §6 ∕ 其它批射程 = 零触。坐标 = 本块 append 前实读。

**逐号收口（1..5）**

| # | 处置 | 改动（本档 file:line） |
|---|---|---|
| 1 | ✅ 落（落前实读复核——与评审坐标逐点相符，五键均落于所迁段内） | `:269`（§2.10-D 前条尾句收窄为「as-of 键」）+ `:270`（新增后条 = **D4 键面届盘补列**：run-start +4 = `injections` ∕ `promptTail` ∕ `toolDecorate`（`:135`）· `turnDomainText`（`:185`）；turn-loop +1 = `distillSignal`（`:390`）；坐标 = `thincoder-core/agent.mjs`） |
| 2 | ✅ 落（单句化） | `:128`（§2.3.4 D1 源向 = 起点刻工作树实读副本（或起点实情下之 `HEAD` 版——§2.10-C）；旧「`git show HEAD:`」原句已删） |
| 3 | ✅ 落（缝记法补注） | `:256`（§2.10-B 留守面 = `:1-:94` + `:100-:102`——段 7 `:95-:99` 随迁扣除，补注消解与段 7 交叠） |
| 4 | ✅ 落（口径注 + 扫描面并入） | `:277`（§2.10-E：18 档口径 = 产品树四端；`bench/**` ∕ gitignored `.thincoder/tmp/**` 不入分母）+ `:284`（P2 起点扫描并入清单外两地；`bench/probe/driver.mjs:13` 实读 = `createAgent` ∕ `ContinueError`） |
| 5 | ✅ 落（指位收正） | `:239`（§2.10-A：「B1 §5.1 行数账」→「B1 §5.P4-I 行数账（`docs/batches/2026-09-29-parity-b1-vsc-core.md:694`）」） |

**相抵旧表述 = 已删**（git 历史留存；无残体）：旧 D1 源句「以 P2 起点快照（`git show HEAD:thincoder-core/agent.mjs`）为源」· 旧留守面「`:1-:102`」（无扣除记法）· 18 档旧无口径注 · 旧「B1 §5.1 行数账」指位 · §2.10-D 旧无五键。

**计数同步**：D 族 = 5 · D1 段分母 = 7 · 消费面 = 18 档（分母不变，口径注为新增）· 键面补列 = +5（run-start 4 ∕ turn-loop 1）——均与前块一致。

**读回核验**：落毕逐处复读 `:128` ∕ `:239` ∕ `:256` ∕ `:269-:270` ∕ `:277` ∕ `:284`（结论见交付报告）。

## §3 设计评审（评审子代理）
**状态行**：评审完成 2026-09-29（轮次 2：🔴 0 · 🟡 2 · 🔵 3 · pass；轮次 1 记录与计数在本段轮次 1 块）



### 轮次 1（评审子代理）

**审查基准（2026-09-29 · 设计评审子代理）**：射程 = 本批档 §2 全文（实读）；坐标 ∕ 行数 ∕ 引用件抽查已对盘（`thincoder-core/agent.mjs` = 462 行 · `runAgent` `:102-:461`；`ledger-db.mjs:41-43`；`session-slots.mjs:71-80`；`STRUCTURE-DEBT.md:20`；`RELEASE.md:100` §5.3（恢复收敛序 `:116`）；`CORE-UNIFICATION.md:454` §2.6.1；五链在位 ∕ core 测试树 = `run.mjs` ∕ `slow.mjs`。未可核：仓外台账制品（`ledger-backup/**` ∕ `ledger-trash/**`）、junction 目标盘符拼写（本评审工具面无可读重解析点）、`.native` 规范化探针读数。
**限制**：无 Document Map 声明 ⇒ Document ownership 判据降级（按放置面 + Project Guide 判）；无 Standards 档。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | §2.3.2 切点表两段坐标交叠：turn-loop 行声明 `:224-:446`（本档 `:112`），chat-call 行声明 `:270-:317`（本档 `:113`）——后者含于前者，无扣除声明；D1「N/N 段吻合」的段清单与分母遂无定义（实读 `thincoder-core/agent.mjs:224-:446` = `for` 循环体全域，`:270-:317` 在其中） | turn-loop 行注明真区间 = `:224-:446` 扣除 `:270-:317`（或改写为并列子段），并在 D1 写死段清单 ∕ 分母口径 |
| 2 | Acceptance criteria | 🟡 | KD-6 局限声明（本档 `:131`）称「provider/** 无 stub ∕ 注入缝 ⇒ 端到端真跑零变不入判据体」，但仓内已有可达缝与夹具先例：`.thincoder/tmp/old-cli-susp-test.mjs:14-38` 本地 SSE 脚本服务器 + `:39-42` `createAgent({ provider, … })` + `:220` `{ baseURL: "http://127.0.0.1:<port>", apiKey: "x", model: "m" }` 真跑 `runAgent`（含 tool-call ∕ auto-turn ∕ 摘要轮断言）；缝 = 调用方传入的 `provider` 对象（`agent.mjs:279` `chat(agent.provider, …)`），非模块级 stub（该档为归档副本，相对说明符指其原 CLU 测试位——范式可复用，档本身不可原位直跑） | 二选一：把「一条等价轮端到端跑」提为 P2 判据（复用该夹具范式），或把局限句改写为准确表述（无模块级 stub；可达缝 = 调用方 provider + 环回服务器；未采用理由写明） |
| 3 | Acceptance criteria | 🟡 | D1（本档 `:128`）只容许两类机械改写，但三拆必生第三类**新写码面**：三新档 import 清单 + `beginRun` ∕ `runTurnLoop` ∕ `callModelTurn` 的接口与 ctx ∕ opts 装配（这些行不在任何「迁入段」内 ⇒ 零判据覆盖）；且 `beginRun` 返回面（本档 `:111`）漏 `tools`——现档 `agent.mjs:131` 解构含该绑定（实读其在 runAgent 内零读取），与「逐字」口径自相矛盾。漏传一个 ctx 键（如 `consumeQueuedInput` `agent.mjs:258` ∕ `streamOutput` `:283` ∕ `autoTurn` `:296`）即静默行为丢失，D1 ∕ D2 ∕ D3 均不触（`node --check` ∕ `import()` 不见自由变量） | 补一条投影判据：逐段枚举所读自由变量并断言各自在新档签名 ∕ ctx 内出现；D1 改写类补第三类「import 重排 + 接口收窄」并写明 `tools` 去留口径 |
| 4 | Acceptance criteria | 🔵 | dev-link 契约未钉死的边：覆盖面「自**现存**链派生」（本档 `:71`）与 `--check` 的「缺失」类（`:74`）不自洽——缺失链推不出 target（apply 面能否补建未写）；`--force`（`:75`）与 `--json`（`:74`）无对应判据（T4 `:86` 只覆盖 `classify` ∕ `canonicalTarget` + `--check` 退出码） | §2.2.2 写明：target 派生规则（产品 `package.json` 声明 ↔ 仓内兄弟目录）、「缺失」在 apply 模式的动作（建 ∕ 只报）、`--force` ∕ `--json` 各补用例或明示不入判据 |
| 5 | Document ownership | 🔵 | 机制新增（dev-link 工具 ∕ 三拆归属）本设计轮只落 §2 自持（KD-1 `:172`），权威并入延至 P3（`:189-:198` 清单）——Project Guide「设计决策须立即入档」下的既定延迟（先例 B1 ∕ B2）。目标档实核均在位：`docs/core/design/CORE-UNIFICATION.md:454`（§2.6.1）· `docs/RELEASE.md:100`（§5.3）· `docs/core/design/STRUCTURE-DEBT.md:20`（#3 行，引 `agent.mjs:147` ∕ `:142-159` = as-of 09-15 坐标，与现档已漂，正待 P3 收正） | 维持；P3 按 §2.8 清单逐行签收（含 F6 的 343 处 ∕ 44 档「语义句收正 + 行号 as-of 留存」口径），§5 ∕ §6 留收正读数 |

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 2

### 轮次 2（评审子代理）

**审查基准（2026-09-29 · 设计评审子代理 · 轮次 2 · 射程 = §2.10 就绪核块 + 关联节 §2.3.2 ∕ §2.3.3 ∕ §2.3.4 ∕ §2.4 ∕ §2.8）**：核对面逐项对盘**全中**——`thincoder-core/agent.mjs` = 467 split ∕ 466 内容行 ∕ `runAgent` `:102-:466`（365 行）· D1 段表 7/7 头尾锚（`:103/:193` · `:194/:223` · `:227/:272` · `:273/:320` · `:321/:451` · `:453/:456` · `:95/:99`）+ 段间零交叠 + 留守缝 `:224-:226` ∕ `:452` · D3 哨兵 `:227` ∕ `:146` ∕ `:282` · D4 逐键消费点 `:261` ∕ `:286` ∕ `:299` ∕ `:200→:291` · KD-8 `:131`（零第二读点）· 导出面 23/23 逐名 · 消费面 18/18 在位 · P3 目标档抽查（`CORE-UNIFICATION.md:454` · `RELEASE.md:100`＋`:116` · `STRUCTURE-DEBT.md:20` · `AGENT-LOOP.md:178` ∕ `:198` · `VSC-DEBT.md:252`＋`:327-328`）全中 · 批本地判据件 160 行（T1–T6 在位）· core 测试树 = `run.mjs` ∕ `slow.mjs` · 触发依据 = B1 §6「已收口 2026-09-29」在位。未可核（随标 unverified）：git 系读数（§2.10-A 两 hunk 归因 ∕ C 的 `git status` 121+37——评审工具面无 git 面）；census（347 ∕ 45 · 317 ∕ 39）未复算；仓外台账制品。
**限制**：无 Document Map ∕ 无 Standards 声明 ⇒ Document ownership 与方法论合规按根 AGENTS.md + 批档先例评定（降级）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | §2.10-D（`:269`）届盘重锚未随迁 D4 键面枚举（§2.3.4 `:133` 标 as-of）：现盘 run-start 段另读 `injections` ∕ `promptTail` ∕ `toolDecorate`（`thincoder-core/agent.mjs:135`）与 `turnDomainText`（`:185`）；turn-loop 段另读 `distillSignal`（`:390`）——五键均 B1-P4-I 新增（本块 `:240` 自点名后二者）；接口面声明「opts 键面 = D4 ∕ ctx 键面 = D4」⇒ 按 as-of 枚举落形会丢五键（`??` 回落径静默；`node --check` ∕ `import()` ∕ D5 核侧等价轮均不触） | §2.10-D（或 §2.3.4 枚举处）补列五键及坐标，或于点名届盘重导清单逐键复核（run-start +4 键 ∕ turn-loop +1 键） |
| 2 | Doc hygiene | 🟡 | §2.10-C（`:263`）收正 D1 源向（工作树副本；`git show HEAD:` 仅提交态备选），但 §2.3.4 `:128` 原句「以 P2 起点快照（`git show HEAD:thincoder-core/agent.mjs`）为源」未就地消解——同一判据源两处规范句（本档 §2.9 先例 = 相抵旧表述就地删除；§2.10 效力句兜底） | 落正 §2.3.4 `:128`（源向改「起点刻工作树实读副本（或起点实情下之 HEAD）」或加「以 §2.10-C 为准」指针），使 D1 源向单句 |
| 3 | Clarity | 🔵 | 留守面 `:1-:102`（§2.10-B `:256`）与段 7（chat-call ② `:95-:99`——`streamOutputAllowed` 定义随迁 + re-export 保面，§2.3.2 `:113`）交叠未注——分区（留守面 + 7 段 + 缝）与文件不精确铺满 | 按段 5 ∕ 段 6 的「缝」记法补注（`:1-:94` + `:100-:102`，或「含扣除」） |
| 4 | Clarity | 🔵 | 消费面「18 档」（§2.10-E `:276/:283`）18/18 在位，但枚举口径未声明——清单外另有代码消费方 `thincoder/bench/probe/driver.mjs:13`（`createAgent ∕ ContinueError`；另 gitignored `.thincoder/tmp/**` 数件） | 注明口径（产品树）或将 bench ∕ tmp 并入 P2 起点扫描（该扫描已在册）并记读数 |
| 5 | Clarity | 🔵 | §2.10-A（`:239`）指位「B1 §5.1 行数账」不存在——`467（+5）` 实在 B1 §5.P4-I 行数账（`docs/batches/2026-09-29-parity-b1-vsc-core.md:694`） | 指位改 §5.P4-I |

范围外注记（不赋定级）：P1 工具实落 `scripts/dev-link.mjs` = 173 行 vs §2.4 `:151` 估带 120–160（超带 +13；≤300 线内）——§5.1 `:368` 未对账该带（P1 面 ∕ 非本评审射程）。

VERDICT: pass

计数：🔴 0 · 🟡 2 · 🔵 3

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 2026-09-29 05:1x）

- **依据** = 十批全修令 + 排空授权执行口径（三条件：评审 pass ∧ 修正落地核验 ∧ token 在位）——评审 **#96 pass**（0🔴 · 3🟡 ∕ 2🔵）；修正轮 **#99 落地已核**（5/5 全落）；token 在位。
- 修正轮披露三则**受理**：① D5 取「前后对拍」形（拆分前基线 → 拆分后复跑逐项相等——更强，采纳）；② `--force` 不入本批判据（理由：破坏性写入真 `node_modules`；类判定由 T4 纯函数例覆盖——采纳）；③ `--json` 输出契约新钉 = `{ links: [{ product, link, target, class }], ok }`（采纳）。
- **实施 = P1 → P2 → P3**：P1（#577 工具 + 环境收敛 + T1–T6；与 B1 并行安全）**即发**；P2（#579 三拆；启动条件 = **B1 §6 收口后届盘重锚**——由 B1 链自然触发）；P3（文档收正；B1 文档窗后）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（P1 ∕ P2 双波段——P2（#579）终态 clean（分歧审计 1 轮 ∕ 代码评审 2 轮））


### 5.1 P1（#577 路径盘符族）实施记录 · eng-coder · 2026-09-29

**波段**：#577（批档条目 A 的实施面）。#579（条目 B）= P2 未启（前置 = B1 收口后届盘重锚）。
**终态 = clean（converged）**：分歧审计 1 轮（唯一偏差 = §5 未写——交付时点前置项，本段落地消解）；代码评审 round 1（🔴0 · 🟡1 · 🔵5）+ fix round 1（6/6 全受理并修复）+ round 2 验修复（pass · 零新增）。

**改动表（file:line · 行数口径 = §2.0）**

| # | 文件 | 位置 | 动作 | 内容 |
|---|---|---|---|---|
| 1 | `thincoder/scripts/dev-link.mjs` | `:1-173` | 新增 | 五链规范形工具：规范形 = `realpathSync.native`（陷阱 = JS 面保留输入拼写）；target 派生 = 产品 `package.json` 声明 × 仓内兄弟目录 + `name` 逐字对账（缺位 ∕ 读取解析失败 ∕ 对账失败 ⇒ errors 报错跳过，不建悬空链）；模式 = apply（缺省：建 ∕ 修 ∕ no-op ∕ 物化副本跳过）· `--check`（只读 0/1）· `--json`（只读；契约 `{ links: [{ product, link, target, class }], ok }`）· `--force`（仅物化副本、破坏性、不入本批判据）；导出 classify ∕ canonicalTarget ∕ planLinks ∕ checkLinks ∕ applyLinks ∕ main |
| 2 | `.thincoder/tmp/2026-09-29-core-hygiene.test.mjs` | `:1-160` | 新增（暂存） | 批内件 T1–T6；终位 = `docs/batches/2026-09-29-core-hygiene.test.mjs`（父侧 copy）；导入以 `process.cwd()` 为仓根解析 |
| 3 | 环境（ops · 非文件面） | `thincoder-cli/node_modules/@thincoder/core`（junction） | 重建 | 目标串 `d:\teamcode\thincoder\thincoder-core` → `D:\teamcode\thincoder\thincoder-core`（apply 读数）；其余四链 no-op；可逆（`npm link` 复发 → dev-link 再修） |

**验证命令与读数（本机 · 2026-09-29）**

| 命令 | 读数 |
|---|---|
| `node scripts/dev-link.mjs --check`（修前基线） | 退出码 1：cli core = `case-variant·同路径异拼写`；余四链 `ok`（4 规范 ∕ 1 漂移） |
| `node scripts/dev-link.mjs`（apply） | `[repaired] thincoder-cli（case-variant → ok）` + 四 no-op；终态 5 规范 ∕ 0 未收敛；退出码 0 |
| `node scripts/dev-link.mjs --check`（修后） | 退出码 0：5 规范 ∕ 0 漂移 |
| `node scripts/dev-link.mjs --check --json` | `ok:true` · 五链逐条 `class:"ok"` · 契约键面 = `links` ∕ `ok` |
| 恒等复测（`queued.mjs` vsc 链 ∘ cli 链） | `===`：**false（修前）→ true（修后）** |
| `node --test .thincoder/tmp/2026-09-29-core-hygiene.test.mjs`（仓根跑） | **6/6 pass**（T1–T6；fix round 1 后复跑同绿） |
| 仓套件（三端 npm test） | 未跑——父侧收口跑 = 唯一仓套件跑点 |

**T1–T6 落点（对照 §2.2.3）**：T1 台账键 case 变体（转引 #286 ∕ #287；键值锁 `056b8aee16abdaab`）· T2 session 槽（注入缝）· T3 其余键面（traces 直驱 + 五面结构扫描 `normalizeCwd` 单源）· T4 链面（classify 五类例含同路径异拼写 ∕ 物化副本 + canonicalTarget `.native` 折叠 + `--check` 退 0 + `--json` 契约）· T5 跨包恒等 · T6 负控（合成三产品夹具：异拼写 + 链缺失 ⇒ 判红；修复转绿；B2 锁零触）。

**审计与评审轮次（内部）**

- 分歧审计（explore · 只读）：1 轮——偏差 1 = §5 未写（本段即消解）；工具逐条（§2.2.2）∕ 判据逐条（T1–T6）∕ 声明面 ∕ 越界零改 = 全吻合；运行时读数受审计面零执行留 unverified（本段上表为证据面）。
- 代码评审（advisor · round 1）：pass（🟡1 · 🔵5）——fix round 1 逐条：① `planLinks` 两处读取 ∕ 解析入 errors 通道（不抛；坏 JSON ∕ 兄弟无 `package.json` 两路探针已过）；② 头部补「判定面 = win32 开发链」；③ 判据件夹具变体改 `flipDriveCase` 取反构造（零盘符大小写假设）；④ T5 补 `typeof` 前提（防空过）；⑤ 判据件头部补适用范围（末段实跑断言 = win32 收敛态）；⑥ 头部病灶读数加「收敛前」as-of。
- 代码评审（advisor · round 2 · 验修复声明）：**pass**（6/6 已修 ∕ 零新增）。

**交付透明表（决策与披露）**

| # | 事项 | 性质 | 处置 ∕ 去向 |
|---|---|---|---|
| 1 | §2.5 P1 行「+ 文档两处」（CORE-UNIFICATION §2.6.1 ∕ RELEASE §5.3）未落 | 范围裁定 | 父侧已裁 = 归 P3（设计档笔权 = eng-designer）；本波任务书验收 ①–④ 无文档项 |
| 2 | `--force` 面 = 实现但零跑 | 判据口径 | §2.9 #2 明文不入本批判据（破坏性写入真 `node_modules`）；类判定由 T4 纯函数例覆盖 |
| 3 | 环境收敛 = ops 动作（junction 重建——披露） | 本机副作用 | 单链（cli core）；其余四链零动；可逆 |
| 4 | 批外观察：`thincoder-core/ledger.mjs:188` `notifyKey` 另一处内联盘符归一（形 = `\`→`/` + 盘符大写；§2.2.1 ③ 表未列） | 超范围注 | 零改（非本批射程）——供父侧登记参考 |
| 5 | `scripts/**` 工程工具面（不入 `files` 声明） | 声明面说明 | 按任务照落 + 本表披露 |
| 6 | 批内件暂存 `.thincoder/tmp/`（落位摩擦 #545） | 落位 | 终位由父侧 copy；复跑命令同一（cwd = 仓根） |

### 5.2 P2（#579 核 agent.mjs 三拆）实施记录 · eng-coder · 2026-09-29

**波段**：#579（批档条目 B）——`thincoder-core/agent.mjs` 三拆（run-start ∕ turn-loop ∕ chat-call）+ 23 名导出面锁 + D1–D5 对拍。
**起点源** = 起点刻工作树实读副本（§2.10-C）；`git diff HEAD -- thincoder-core/agent.mjs` 实读登记 = **4 hunk**——2 净增（回合域文本 +3 ∕ 蒸馏 +2 ⇒ 净漂移 +5，与 §2.10-A 在册两处 hunk 相符）+ 2 净零（P4-I 键面：签名行 ∕ prepareRun 实参行——即 §2.10-D 五键面）。
**终态 = clean（converged）**：分歧审计 1 轮（0 偏差；唯一 PARTIAL = 本段未写——本段落地消解）；代码评审 round 1（🔴 0 · 🟡 1 非阻断 ∕ 协调 + 🔵 4）+ fix round 1 + round 2（验修复：发现 1–3 Fixed ∕ 4–5 非阻断 Unfixed ∕ 零新增）。

**改动表（file:line · 行数口径 = §2.0）**

| # | 文件 | 位置 | 动作 | 内容 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent.mjs` | `:1-105`（466 → 105 内容行） | 改写 | 收窄为编排面：`beginRun → try{return await runTurnLoop}catch{thrownError}finally{finalizeAgentTurn}` + 状态工厂 + re-export 面（`streamOutputAllowed` 转口 `:49`；导出面 23 名不变） |
| 2 | `thincoder-core/agent/run-start.mjs` | `:1-111` | 新增 | `beginRun(agent, input, callbacks, opts)`——段 1（基线 `:103-193`，91 行）verbatim；收窄 1 = `tools` 死绑定去（`:47`，KD-8）；说明符 3（`:35/36/39`） |
| 3 | `thincoder-core/agent/turn-loop.mjs` | `:1-244` | 新增 | `runTurnLoop(agent, ctx)`——段 2/3/5/6（基线 `:194-223` ∕ `:227-272` ∕ `:321-451` ∕ `:453-456`，30+46+131+4 行）verbatim；说明符 1（`:53`）；模型调用段外提 callModelTurn（调用点 `:105`） |
| 4 | `thincoder-core/agent/chat-call.mjs` | `:1-68` | 新增 | `callModelTurn(agent, ctx)` + `streamOutputAllowed`——段 4/7（基线 `:273-320` ∕ `:95-99`，48+5 行）verbatim；说明符 1（`:23`） |
| 5 | `.thincoder/tmp/2026-09-29-core-hygiene-p2.test.mjs` | `:1-305` | 新增（暂存） | P2 判据件 D1–D5（终位 `docs/batches/` 同名件由父侧 copy——**基线快照须同笔归档**，见透明表 #3） |
| 6 | `.thincoder/tmp/2026-09-29-agent-p2-baseline.mjs` | 466 内容行 | 新增（暂存） | P2 起点快照（D1 对拍源；查找序 = env → 判据件同目录 → tmp） |
| 7 | `.thincoder/tmp/2026-09-29-core-hygiene-p2-obs-pre.txt` | 1 行 | 新增（暂存） | D5 拆分前观测基线（后跑观测行逐字节相等） |

**验证命令与读数（本机 · 2026-09-29 · 仓根）**

| 命令 ∕ 判据 | 读数 |
|---|---|
| `node --test .thincoder/tmp/2026-09-29-core-hygiene-p2.test.mjs` | **5/5 pass**（D1–D5） |
| D1 逐字搬移核 | **7/7 段吻合** · 内容改写 6 处（说明符 5 ∕ 收窄 1）· 缩进归一 4 段（逐段 1/46 · 1/131 · 4/4 · 46/48）· 留守面守恒（并集 = 全档 466 行 · 样本 6/6） |
| D2 面锁 | 23/23 名集合相等 · `node --check` 4/4 · `import()` 零抛（agent.mjs + 三新档直装） |
| D3 哨兵 | 3/3（agent.mjs 零命中；run-start `:62` ∕ turn-loop `:59` ∕ chat-call `:27` 各含对应串） |
| D4 投影核 | **113/113 落点**（签名 39 · import 26 · 调用链 34 · 消费点 9 · 说明符 5） |
| D5 等价轮 | **2/2 绿（前 ∕ 后）**——观测行前后逐字节相等（拆分前跑用初版夹具，D5 段零改；`obs-pre` 为证） |
| 行数账 | agent.mjs 105 · run-start 111 · turn-loop 244 · chat-call 68 · 判据件 305（全 ≤300 建议线）；最大单函数 `runTurnLoop` ≈222 < 300 ⇒ #579「365 行单函数」债判消解 |
| 消费面复导（P2 起点扫描） | **18/18 档**零改（core 10：assemble ∕ spawn-child ∕ consult ∕ eng ∕ escalate-async ∕ skill ∕ subagent-actions ∕ subagent-async ∕ subagent-spawn ∕ vision-reader；CLI 5；VSC 1；桌面 2）；清单外同扫 = `bench/probe/driver.mjs:13`（createAgent ∕ ContinueError） |
| 消费者装载 smoke | `agent-tools/subagent-spawn.mjs` ∕ `agent/assemble.mjs` ∕ `vision-reader.mjs` 三档 import 零抛；`createAgent` 直驱 ok |
| 仓套件（三端 npm test） | 未跑——父侧收口跑 = 唯一仓套件跑点 |

**审计与评审轮次（内部）**

- 分歧审计（explore · 只读）：1 轮——7 项逐项吻合（段面 ∕ 面锁 ∕ 编排面 ∕ 接口链 ∕ 边界 ∕ 判据诚实性 ∕ 任务书出入）；唯一 PARTIAL = §5 P2 回执未落（本段消解）；附观察 = 段 2 随迁后处 try 覆盖内（§2.3.2 明文形态之必然，正常路径零差）。
- 代码评审（advisor · round 1）：pass（🔴 0 · 🟡 1 非阻断 ∕ 协调 + 🔵 4）——fix round 1（3 码侧 + 2 记录）：① D1 快照查找序 = env → 同目录 → tmp + 拆分后缺快照硬失败；② D4 import 区域 = 行级截断 + 剥整行注释（并修掉头注释内 `export ` 命中次生缺陷）；③ D1 补留守面守恒（并集 + 6 样本行）。
- 代码评审（advisor · round 2 · 验修复）：**pass**（发现 1–3 Fixed ∕ 4–5 非阻断 Unfixed ∕ 零新增）。

**交付透明表（决策与披露）**

| # | 事项 | 性质 | 处置 ∕ 去向 |
|---|---|---|---|
| 1 | 任务书「预期 = B1 两 hunk」实读 = 4 hunk | 读数登记 | 净漂移 +5 仍来自在册两处（+3 ∕ +2）；另 2 = P4-I 键面净零 hunk——§2.10-A ∕ D 合并口径成立 |
| 2 | 判据件为独立分档（`-p2.test.mjs` · 305 行）≠ 设计单件名（§2.4 带 170–250） | 记录项 | 父侧派单已按分档件；分档 + 行数账 = 本段（305 在 §2.10-F 刷新带 220–310 内；两档合计 465） |
| 3 | 基线快照 ∕ 观测基线落暂存（gitignored） | 归档协调 | 判据件已加同目录回退 + 拆分后缺快照硬失败；父侧 copy 判据件时**同笔归档** `2026-09-29-agent-p2-baseline.mjs`（否则归档件硬红——失败方向安全） |
| 4 | 两处 as-of 跨档指称保留（turn-loop `:52`「上方 injectAsyncResult :113-117」· chat-call `:58`「interrupt branch below」） | 逐字口径 | verbatim 三类外零改；后手注释对齐或登记（零行为） |
| 5 | 段 2（基线 `:194-223`）随迁后处 runTurnLoop 内 = try 覆盖内（原档在 try 外） | 结构缝披露 | §2.3.2 明文编排形态之必然；正常路径零差；异常路径差 = finalize 多跑一次（方向更安全） |
| 6 | 声明改写 = 缩进 4 段 ∕ 说明符 5 ∕ 收窄 1；新写面 = 三新档 68 行（423 内容行 − 段面 355 行） | 声明面 | D1 报告形逐项列（上表读数） |

**未决 ∕ 边界诚实项**：① 仓套件未跑（父侧收口）；② 判据件终位 copy + 快照同笔归档（父侧动作）；③ 陈旧跨档注释对齐与 §2.8 文档收正面（P3）不在本波段。

## §6 验证与收口（父代理）
