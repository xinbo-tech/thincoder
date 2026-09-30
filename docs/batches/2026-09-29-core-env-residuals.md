# 2026-09-29 · core-env-residuals（核 ∥ env 收口遗留：覆盖缺口补腿 + 域外四条收正）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:56 令）——核 ∥ env 收口遗留载体：台账 #439（键面测试缺口两处）∥ #441（批 B 域外四条）。。
> 台账 = #439 ∕ #441（核/environment 面 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账集中处置令（16:56）；授权 = 13:52 全权。
- **条目（2 行）**：**#439**（env 键面全链路无自动化承重——补沙箱 config.json + 假 HOME 的 spawn 腿（先例 `session-gc-cli.test.mjs:29` ⇒ 原档随全清令删除；副本 = `.thincoder/tmp/session-gc-cli.precedent.txt:26-31`）；`--test-crash` 缺省形真 spawn 腿）· **#441**（批 B 域外四条：① `diskLonger` 未过滤盘面（`session-slot-write.mjs:74` vs `session.mjs:209`）② `{ provider: null }` 核不校值域（设计有意 ∥ 缺口 ⇒ 收口轮裁）③ `token-ttl.mjs:246-266` 记录缺 `effort` ④ 类型脏载链可抛（`session-lifecycle.mjs:172-173 → config.mjs:109`——按纪律「非本批引入 ≠ 免修」）。
- **口径**：设计 = eng-designer（①–③ 裁定 + 修法；④ 小修）；实施 = eng-coder（评审 + 代签 §4 + token 后）；测试腿 = 批次本地件。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 · 2026-09-29
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- **#439① 键面全链路承重缺口** ⇒ 腿一（§2.3）：批内件「沙箱 config.json + 假 HOME + `--import` 探针」spawn 腿（4 态矩阵）。
- **#439② `--test-crash` 缺省形无真 spawn 覆盖** ⇒ 腿二（§2.4）：批内件「零参默认路径 + 包装触发」真 spawn 腿。
- **#441 ①–④** ⇒ 收口裁定表（§2.5）：四条修法均已由 `2026-09-28-tech-debt-closeout`（§5.1 轮 4 表）落位；本批 = 收口裁定 + 核在盘 + 端侧拒例核验——**产品码零改动**。

### 2.2 设计档落点

- 本批 = 收口轮：设计承载 = 本记录 §2（一次性批次材料）；机制判据归属既有档、零改档：
  - 键面链名录 = `docs/core/design/CONFIG.md:140-141`（`diagnostics.heapSnapshot` → `prepareCrashReporting`；`diagnostics.heapWatch` → `startHeapWatch`）；argv 三旗标行 = `:142-144`。
  - 偏好写面判据 / 值域边界表 = `docs/core/design/SESSION.md` §6.21（`:713-741`——判据句 2 / 边界情形表第 2 行 / 不做句）。
  - 端侧契约 = `docs/desktop/design/IPC.md:110`（§2 `session:prefs` 行）+ `:180-189`（「会话级偏好注」项 5 / 7）。
- 腿件落点 = **新档 `docs/batches/2026-09-29-core-env-residuals.test.mjs`**（批内件——名随批档；复跑 = 仓根执行 `node --test docs/batches/2026-09-29-core-env-residuals.test.mjs`；不进仓套件）。

### 2.3 腿一（#439①）：键面全链路 spawn 腿

**缺口**：`diagnostics.heapWatch` / `heapSnapshot` → bin 读键（`thincoder-cli/bin/thincoder.mjs:51-54`）→ 形参（`:59` / `:66`）→ 消费者调用（`thincoder-cli/src/crash-reports.mjs:87-89` `armHeapSnapshot(1)`；`thincoder-cli/src/heap-watch.mjs:70-71` timer 注册）全链无常驻用例（S2a 探针一次性、已删）。

**形态（每 case 一份沙箱）**

- 沙箱 = `mkdtempSync`；状态注入 = `<home>/.thincoder/config.json` 的 `diagnostics` 段；env = `{ ...process.env, USERPROFILE: home, HOME: home }`。
- 探针 = 用例生成于沙箱内的 `probe.mjs` + `--import pathToFileURL(probe)`（**Windows 裸盘符路径会 ERR_UNSUPPORTED_ESM_URL_SCHEME——须 file:// URL**，本轮实证）。
- 探针计数两消费者：`globalThis.setInterval` 包裹计数（heap-watch 定时器）+ `require("node:v8").setHeapSnapshotNearHeapLimit` CJS 对象改写计数（快照武装）——**机制事实**：ESM namespace 赋值只读抛错，但核 `crash-reports.mjs:79` 默认形参取 CJS 对象活值 ⇒ 改写 CJS 对 `import * as v8` 读点生效（本轮两档实测）。
- spawn = `spawnSync(process.execPath, ["--import", probeURL, BIN, "--test-crash"], { env, cwd: 仓根, encoding: "utf8", timeout: 60_000 })`——`--test-crash`（`bin:107-110`）位于两消费点之后 ⇒ 快出 exit 1 + 探针 `process.on("exit")` 同步写回计数 JSON。

**判据（4 态矩阵——设计轮亲跑全四态读数）**

| 态 | config `diagnostics` | interval 计数 | snapshot 计数 |
|---|---|---|---|
| 缺省（无 config 文件） | — | ≥1（实测 1） | ≥1（实测 1） |
| 全关 | `{heapWatch:false, heapSnapshot:false}` | 0 | 0 |
| 独关 watch | `{heapWatch:false, heapSnapshot:true}` | 0 | ≥1（实测 1） |
| 独关 snapshot | `{heapWatch:true, heapSnapshot:false}` | ≥1（实测 1） | 0 |

- 断言形 = 关态 `== 0` / 开态 `≥ 1`（「实测 1」为当前读数——不作精确判据，免与无关启动定时器耦合）。
- 每 case 三附判：exit == 1 ∧ stderr 含 `R25 test crash`（崩溃门在 ⇒ 两消费点已过——防早期失败假绿）∧ 计数 JSON 在（探针装载负控；缺失 ⇒ 红）。
- 隔离 = 假 HOME ⇒ 真实 `~/.thincoder` 零触；沙箱 exit 钩子清理。

### 2.4 腿二（#439②）：零参缺省形包装触发 spawn 腿

**缺口**：包装门（`bin:44-46`）`command === undefined` 支（零参默认路径）——原两腿（`entry-diagnostics-keys.test.mjs` ∕ `tui-stderr-capture.test.mjs`）随全清令随树删除 ⇒ 现盘零在册用例（同 §2.6 测试树空口径）。`--test-crash` 必占命令位（`bin:40` 取过滤后首元）⇒ 零参形与崩溃旗标不可共存。

**形态**：沙箱 HOME；`spawnSync(process.execPath, [BIN], { env: 假 HOME, cwd: 仓根, timeout: 120_000 })`——零参、非 TTY（stdio 管道）。
链路：父包装（`bin:45` `spawnTuiWrapped()`）→ 子 `--tui-wrapped`（`thincoder-cli/src/tui/wrapped-spawn.mjs:48`）→ 子内 TUI 门非 TTY 抛错（`thincoder-cli/src/tui/index.mjs:76-78`）→ 子 `exitSoon(1)`（`thincoder-cli/src/command-interactive.mjs:169-172`）→ 父同码退（`wrapped-spawn.mjs:54-55`）。

**判据（设计轮亲跑读数：exit 1 · ≈1.2s）**

1. exit == 1（同码退链）；
2. stderr 含 `TUI requires a TTY`（tee 实时转发——子进程真起 + 走默认路径的判别面）；
3. 沙箱 `crash-reports/` 恰一份 `tui-stderr-*.log`（**包装父签名**；头行 `# tui-stderr … pid=` + 转发错误行；恰一份 = 恰一次包装）；
4. stdout 含 `thincoder loading`（包装父加载行在写面）。

### 2.5 #441 四条裁定（收口轮）

**前提核对**：四条修法已由 `2026-09-28-tech-debt-closeout` §5.1 轮 4 表落位；本批 = 收口裁定 + 核在盘。坐标按本轮实读收正（漂移登记见 §2.9）。

| 条 | 裁定 | 修法坐标（已落 · 本轮实读） |
|---|---|---|
| ① `diskLonger` 盘面 | **过滤**（盘侧同滤——对齐读侧口径） | `thincoder-core/session-slot-write.mjs:77-78` |
| ② `{provider:null}` 值域 | **核侧不校值域 = 设计有意**（载荷形（形面）由端侧契约把守） | 明文 `session-slot-write.mjs:219-234`；端侧拒例 `thincoder-desktop/src/main/agent-host.mjs:65-75` + 消费 `:197-198` |
| ③ token 最小记录缺 `effort` | **补键（键齐）**——与规范结构同源 | `thincoder-core/token-ttl.mjs:263` |
| ④ 类型脏载链可抛 | **守卫**（恢复不中断）——册链已闭合 | `thincoder-core/session-lifecycle.mjs:176-181` / `:186-198` |

**逐条由**

- **① 过滤**：快照侧 `data` 源自 `loadSlotFile`（已滤 legacy transient——`session.mjs:219`）；盘侧 raw ⇒ 坏档 legacy 注入条目凭空把盘面算长 ⇒ 无并发也误判轮转（`.bak` 白产 + 误报 concurrent append）。同滤后两口径对齐（谓词单源 = `session-segments.mjs:24-30`）；真并发追加判据保持（滤后盘长 > 快照即轮转）。影响面：干净档逐字零变；脏档仅丢 legacy 注入条目（读侧本就不视其为历史——`session.mjs:123` / `session-slots.mjs:267` 同涤）；轮转从不删数据。修点唯一（`diskLonger` 全仓仅此一处——`session-guard.mjs` 三判据集不含长度面）。
- **② 设计有意**：设计源 = SESSION.md §6.21 判据句 2（只立「键闭集 + 至少一键」）+ 边界表第 2 行（表外值 ⇒ 按 null、读侧容忍）+ 不做句（不校验端侧控件域）；IPC.md 注 5（端侧不重算槽语义 / 档位枚举校验面 = 端侧控件闭集）+ 注 7（reason 闭集 / 失败径零写）。架构由：核为三端共享写口——核侧补校 = 立第二份值域副本（违 D2 单源向）；跨端 / 手工档读侧容忍为存量行为。端侧把守 = 形面（null 仅 effort + 非空串 + provider 须同送 model）——拒例本轮探针复核在盘（读数：`{provider:null}` / `{model:null}` / `{provider:null,model:'m'}` / `{model:""}` ⇒ `invalid-patch`；`{effort:null}` 过 patch 门 ⇒ 仅 effort 允许 null）。
- **③ 键齐**：该支（`persistEngTokens`）只产**全新槽**（claim 先行、首保存前）⇒「老槽禁回填」不适用；键恒在 = 与 `newSlotData`（`session-slot-write.mjs:50`）规范结构 / `saveSession` 携带面（`session.mjs:170`）同源；`?? null` = 未设（回落配置面 / 渠道默认）。三产者（`newSlotData` / `saveSession` / 最小记录）键面自此齐。
- **④ 守卫**：册链 = `:172-173 → config.mjs:109`（`resolveCompactThreshold → providerSpec → specForModel` 的 `.toLowerCase` 抛点在 `model-specs.mjs:261`——本轮直调实证：`resolveCompactThreshold(null,{model:5})` 抛 TypeError）；守卫 = 非串 model 不重算阈值 + 档位块按「未登记」归一 ⇒ 脏载不打断恢复（与本档「不静默改写」读侧口径一致）。**备注**：脏值仍落 `agent.provider.model`（`:175`）——下游同类消费面无类型门（见 §2.9 上抛 1）。

**消费面影响勘（端侧拒例）**：`setSlotPrefs` 全仓消费面 = 桌面单家（`thincoder-desktop/src/main/session-slots.mjs:191-196` 转口 + `agent-host.mjs:200` 调用；CLI / VSC 零直调）⇒ 本裁定消费面零改；端侧拒例在盘 + 探针读数在案（上）。

### 2.6 受影响文件与测试面

| 文件 | 现读 | 预期增量 | 说明 |
|---|---|---|---|
| `docs/batches/2026-09-29-core-env-residuals.test.mjs` | 新档 | ≈ +170 行 | 批内件：腿一 4 case + 腿二 1 case + 沙箱 / 探针工具面 |
| （产品码） | — | **0** | §2.5 四条已落——实施轮 = 核在盘 + 跑腿 |

**测试面**：批内件 1 档（5 个 spawn ≈ 6s）；假 HOME 隔离；不进仓套件（核 / cli 测试树空——全清令口径；复跑走批档路径）。

### 2.7 验收对照（条目 → 判据）

| 条目（台账） | 判据 |
|---|---|
| #439① | §2.3 四态矩阵逐态吻合 + 每 case 三附判 + 负控（计数缺失 ⇒ 红） |
| #439② | §2.4 四判据（exit 1 / stderr tee / 恰一份包装日志 / 加载行） |
| #441①–③ | §2.5 裁定在案 + 修法坐标在盘（读复核）；② 端侧拒例探针读数在案 |
| #441④ | 册链守卫在盘；下游同类面 = §2.9 上抛 1（另册——非本批） |

### 2.8 关键决策

| 项 | 决策 | 由 |
|---|---|---|
| 腿一探针机制 | `--import` 探针双计数（`setInterval` + CJS v8 改写） | 直接观测「消费者调用发生 / 未发生」= 链贯通最强判据；行为面（60s 预警 / 真实快照）测试窗内不可观测。弃案：真实 OOM 触发（GB 级 · 慢 · 抖）· 时序观察（60s 不可行） |
| 腿一断言形 | 关态 `==0` / 开态 `≥1` | 四态矩阵已捕获失配 / 反接 / 忽略（含 swap 反接态）；精确 `==1` 属读数不作判据（与无关定时器解耦） |
| 腿二载体 | 真 spawn 零参形（非 `--test-crash`） | 命令位独占（`bin:40`）⇒ 崩溃旗标与零参不可共存；包装父签名 + 非 TTY 子失败径即充分判别面 |
| ② 裁定 | 核侧不校值域 = 有意 | 见 §2.5 ② 由（D2 单源 + 存量读侧容忍 + 端侧已把守） |
| 腿件形态 | 单档双组 | 同批同域（CLI 入口面）；先例 = 批内件单档（`2026-09-29-core-hygiene.test.mjs` 形态） |

### 2.9 上抛项

1. **#441④ 下游同类面（报而不扩）**：脏载非串 model 经 `session-lifecycle.mjs:175` 落 `agent.provider.model`；下游 spec 查表消费面无类型门——`token-window.mjs:151-152`（`contextUsage`——经 `context.mjs:278` 在共享 run stage 常规触达）· `token-window.mjs:161`（`historyPercent`）· `thincoder-desktop/src/main/agent-host.mjs:148`。静态可达（非串真值经 `data.activeModel || slotProvider.model` 透传），行为路径未执行。建议另立条目：下一核面轮裁「adoption 边界归一 ∥ 消费点防御」。
2. **前提校正**：四条修法已由 tech-debt-closeout 落位 ⇒ 实施轮零产品码改动；复核发现任一条不在盘 ⇒ 停并报（fail-closed）。
3. **坐标漂移登记**：台账引 `session-slot-write.mjs:74` / `session.mjs:209` / `token-ttl.mjs:246-266` / `bin:58-61` / `bin:66` / `bin:73` → 本轮实读 `:77-78` / `:219` / `:246-269` / `:51-54` / `:59` / `:66`。
4. **#439 两腿回迁 ∕ 常驻化去向（报而不扩）**：本批两腿落点 = 批内件（§2.6 明示不进仓套件）⇒ 台账 #439「自动化承重」意图在仓套件面仍空。去向挂单测树重建面——测试树口径恢复后处置（回迁 `thincoder-cli/test/` ∕ 常驻化，随重建面定形）；本批不改测试树口径。

### 2.10 修正块（评审轮 1 · 2026-09-29）

评审 #34（pass · 🔴0 ∕ 🟡2 ∕ 🔵3）号 1 ∕ 2 ∕ 4 就地落位；号 3 ∕ 5 = §1 面（父侧自办）；产品码 ∕ 他档零改。

- **号 1（🟡 · §2.4 缺口句）**：改「原两腿（`entry-diagnostics-keys.test.mjs` ∕ `tui-stderr-capture.test.mjs`）随全清令随树删除 ⇒ 现盘零在册用例」（同 §2.6 测试树空口径）；原 S2b1 括注删除。
- **号 2（🟡 · §2.9）**：补上抛 4——两腿回迁 ∕ 常驻化去向挂单测树重建面（测试树口径恢复后处置；本批不改测试树口径）。
- **号 4（🔵 · §2.5 ②）**：「值域名由端侧契约把守」改「载荷形（形面）由端侧契约把守」（与 IPC.md 注 5「模型值域＝名域」区分；落点实读 = ② 表行）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审 · core-env-residuals（§2 两腿块 + #441 四条收口裁定）

**核验摘要（独立实读 · 2026-09-29）**：§2 引文抽样逐条回读吻合——`bin/thincoder.mjs:40/44-46/51-54/59/66/107-110` · `crash-reports.mjs:79/:87-89` · `heap-watch.mjs:47/:70-71` · `wrapped-spawn.mjs:22/:26-27/:48/:53-55` · `tui/index.mjs:76-78` · `command-interactive.mjs:169-172` · 命令位独占（`bin:40` 过滤后首元 ⇒ 零参形与 `--test-crash` 不可共存）✓；#441 四条修法在盘（`session-slot-write.mjs:77-78` ∕ `:219-234` + `agent-host.mjs:65-75`/`:197-200` ∕ `token-ttl.mjs:263` ∕ `session-lifecycle.mjs:176-181`/`:186-198`，抛点 `model-specs.mjs:261` 复核）✓ ⇒ 「产品码零改动」成立；设计档落点（`CONFIG.md:140-144` · `SESSION.md:713-741` · `IPC.md:110`/`:180-189`）逐条吻合 ✓；上抛 1（`token-window.mjs:151-152`/`:161` · `agent-host.mjs:148` · `context.mjs:278`）静态可达性成立 ✓。沙箱隔离机制（`config-io.mjs:32` `homedir()` 派生 + 假 HOME/USERPROFILE）成立 ✓。**限制**：无 Project Standards ∕ Document Map 声明——文档归属判据按 AGENTS.md + 在档先例降级核对。

| # | 类别 | 严重度 | 发现 | 改法 |
|---|---|---|---|---|
| 1 | Doc-state（记录间状态异述） | 🟡 | §2.4 缺口句「零参默认路径无真 spawn 用例（S2b1 只覆盖 `tui` 支）」与 `2026-09-28-tech-debt-closeout.md:817`（#439② 已交付「缺省形真 spawn 腿 `thincoder-cli/test/tui-stderr-capture.test.mjs:100-110`（零参 ⇒ 包装触发 + 子 stderr tee + 同码 1）」）及 `:844`（cli 893/893 绿含 #439 两腿）相抵；亦与 §2.3 自身「S2a 探针一次性、已删」的叙事不一。现盘事实（`thincoder-cli/test/` 仅 `run.mjs` ∕ `slow.mjs` ∕ 冒烟 3 件）支持「缺口成立」，但成立理由 = 全清令清树（`2026-09-28-tech-debt-closeout.md:40` 评审 #3① 同记），非「从未覆盖」 | 缺口句改「原两腿（`entry-diagnostics-keys.test.mjs` ∕ `tui-stderr-capture.test.mjs`）随全清令随树删除 ⇒ 现盘零在册用例」，与 §2.6「测试树空——全清令口径」同述 |
| 2 | Scope ∕ coordination（R5） | 🟡 | 两腿落点为批内件且明示「不进仓套件」（§2.6）⇒ 台账 #439「自动化承重」意图在仓套件面仍空；§2.9 上抛项未登记其去向 | §2.9 补一条上抛（回迁 ∕ 常驻化去向——测试树口径恢复后），或明示常驻化不在本批射程 |
| 3 | Clarity（引文悬空） | 🔵 | §1.1 先例引 `session-gc-cli.test.mjs:29` 不在盘（glob 零命中），同族仅存 `.thincoder/tmp/session-gc-cli.precedent.txt`（沙箱段 `:26-31`） | 引文改指保留副本，或注明「已随全清令删除」（沙箱纪律已内联于 §2.3） |
| 4 | Clarity（用词） | 🔵 | §2.5 ② 句「值域名由端侧契约把守」与 IPC.md 注 5「端侧…**不校验模型值域**」（`docs/desktop/design/IPC.md:187`）同词异指——同句其后括注「形面（null 仅 effort + 非空串 + provider 须同送 model）」实指载荷形（与 `agent-host.mjs:65-75` 逐条相符） | 该处「值域名」改「载荷形（形面）」，与 IPC 注 5 的「模型值域＝名域」区分 |
| 5 | Doc hygiene | 🔵 | §1 状态行留占位字面「🔄 进行中（…）」（`:6`）——先例 `2026-09-25-eng-ownership.md:259` 同形判 🔵 | 状态行随实况收尾（去 `（…）` 或补实况） |

**域外注（不计严重度）**：`docs/batches/2026-09-28-tech-debt-closeout.md:761` 引 `agent-host.mjs:76-86` ∕ `:303` 与本轮实读（`:65-75` ∕ `:197-198`）漂移（该档后续重构所致）；`docs/cli/design/CLI-ENTRY.md:56` 同引已删先例档名。

**计数**：🔴 0 · 🟡 2 · 🔵 3 = 5

**VERDICT: pass**

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权）。
- **三条件核检**：① **评审 pass**——本档 §3 轮次 1（在册）② **实施在跑**——#48（两腿真跑中）；落定后随 §5 入册 ③ **凭证**——评审已通过（token 在手）。
- **批准射程** = 本批 §2 全量（#439 ∕ #441 两行）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-29 · 两腿真跑 · #441 四条在盘 · 内部审计/评审轮 1–2 pass · fix 轮 1 已终）

### 5.1 交付摘要

- **两腿块实现 + 真跑**：腿一 #439①（键面 4 态矩阵）+ 腿二 #439②（零参真 spawn）——批内件 1 档双组（腿一 4 case + 负控 1 case + 腿二 1 case = 6 case），6/6 绿（实施轮亲跑——逐态读数见 §5.2）。
- **#441 四条在盘核**：①–④ 逐条实读在盘（§5.2 表）——只核不改；② 端侧拒例另以活核探针复核（5/5 PASS）。
- **产品码零改动**（四条修法由前批落位；本批未触任何产品档）。
- **测试件路径（#545 立即形）**：子代理写门对终位实测 fail-closed 拒（`thincoder-core/agent/write-gate.mjs:133-155`；拒文「write refused — cross-batch batch-record write…」在案）⇒ 暂存 `.thincoder/tmp/2026-09-29-core-env-residuals.test.mjs`（159 行）；**父侧收位**至终位 `docs/batches/2026-09-29-core-env-residuals.test.mjs`（§2.6）。复跑 = 仓根 `node --test <档>`（暂存位与终位同命令形态——均两层深、cwd 恒为仓根）。
- 一次性证据件：`.thincoder/tmp/envres-441-host-reject-probe.mjs`（#441② 端侧拒例活核，自判形；25 行）。

### 5.2 逐处表（腿 ∕ 条 → 读数）

| 腿 ∕ 条 | 判据 | 实测读数 |
|---|---|---|
| 腿一 #439① · 缺省（无 config 文件） | interval ≥1 ∕ snapshot ≥1 | **1 ∕ 1** · exit 1 · 535ms |
| 腿一 #439① · 全关 | ==0 ∕ ==0 | **0 ∕ 0** · exit 1 · 499ms |
| 腿一 #439① · 独关 watch | ==0 ∕ ≥1 | **0 ∕ 1** · exit 1 · 575ms |
| 腿一 #439① · 独关 snapshot | ≥1 ∕ ==0 | **1 ∕ 0** · exit 1 · 484ms |
| 腿一 · 负控（探针未载） | 计数缺失 ⇒ 存在性判据可判别 | 计数 JSON 未生成 · exit 1 · stderr 含 `R25 test crash` |
| 腿二 #439② | exit 1 ∕ stderr tee ∕ 恰一份包装日志 ∕ 加载行 | exit 1 · **1261ms** · `tui-stderr-*.log` 恰 1 份（头行 `# tui-stderr … pid=` + `TUI requires a TTY` 转发行）· stdout 含 `thincoder loading` |
| #441① | `thincoder-core/session-slot-write.mjs:77-78` 盘侧同滤 | 在盘 ✓（`disk.history.filter((m) => !isLegacyTransient(m)).length > data.history.length`；谓词单源 `session-segments.mjs:24-30`） |
| #441② | `session-slot-write.mjs:219-234` 明文「核侧不校值域」+ 端侧拒例 | 在盘 ✓；端侧活核 5/5 PASS——`{provider:null}` ∕ `{model:null}` ∕ `{provider:null,model:'m'}` ∕ `{model:""}` ⇒ `invalid-patch`；`{effort:null}` ⇒ 过 patch 门、后位 `slot-missing`（`agent-host.mjs:65-75` ∕ `:197-198`） |
| #441③ | `thincoder-core/token-ttl.mjs:263` 键齐 | 在盘 ✓（`effort: agent._slotEffort ?? null`） |
| #441④ | `thincoder-core/session-lifecycle.mjs:176-181` ∕ `:186-198` 类型守卫 | 在盘 ✓（两处 `typeof agent.provider.model === "string"` 门——脏载不中断恢复） |

### 5.3 双腿命令 + 结果原文

命令（仓根执行）：

1. `node --check .thincoder/tmp/2026-09-29-core-env-residuals.test.mjs` ⇒ `Syntax: OK`
2. `node --test .thincoder/tmp/2026-09-29-core-env-residuals.test.mjs` ⇒ 6/6 绿——原文：

```
[读数] 缺省（无 config 文件）：interval=1 · snapshot=1 · exit=1 · 535ms
[读数] 全关：interval=0 · snapshot=0 · exit=1 · 499ms
[读数] 独关 watch：interval=0 · snapshot=1 · exit=1 · 575ms
[读数] 独关 snapshot：interval=1 · snapshot=0 · exit=1 · 484ms
[读数] 腿二：exit=1 · 1261ms · tui-stderr 恰 1 份 · stdout 载入行在
✔ 腿一 #439① 键面矩阵 · 缺省（无 config 文件） ⇒ interval ≥1 ∕ snapshot ≥1（真 spawn + --import 探针计数） (540.1168ms)
✔ 腿一 #439① 键面矩阵 · 全关 ⇒ interval ==0 ∕ snapshot ==0（真 spawn + --import 探针计数） (501.2366ms)
✔ 腿一 #439① 键面矩阵 · 独关 watch ⇒ interval ==0 ∕ snapshot ≥1（真 spawn + --import 探针计数） (579.7717ms)
✔ 腿一 #439① 键面矩阵 · 独关 snapshot ⇒ interval ≥1 ∕ snapshot ==0（真 spawn + --import 探针计数） (487.2753ms)
✔ 腿一负控：探针未载（无 --import）⇒ 计数缺失——存在性判据非恒真（缺失即红） (516.4478ms)
✔ 腿二 #439② 零参缺省路径 ⇒ 包装触发 + 子非 TTY 同码退（exit 1 ∕ tee ∕ 恰一份包装日志 ∕ 加载行） (1271.8546ms)
ℹ tests 6 · suites 0 · pass 6 · fail 0 · cancelled 0 · skipped 0 · todo 0 · duration_ms 4039.4726
```

3. `node .thincoder/tmp/envres-441-host-reject-probe.mjs` ⇒ 5/5 PASS（exit 0）——原文：

```
PASS {"provider":null} => invalid-patch（期望 invalid-patch）
PASS {"model":null} => invalid-patch（期望 invalid-patch）
PASS {"provider":null,"model":"m"} => invalid-patch（期望 invalid-patch）
PASS {"model":""} => invalid-patch（期望 invalid-patch）
PASS {"effort":null} => slot-missing（期望 slot-missing）
```

### 5.4 披露 ∕ 未做项

1. **测试件暂存（披露）**：终位写入被写门拒（#545 复现）⇒ 暂存 `.thincoder/tmp/`；**终位收位未做** = 父侧动作（声明内排除）。
2. **独立负控成例（披露 · 自加）**：§2.7 负控要求以独立 case 实现（探针未载 ⇒ 计数缺失）⇒ 6 个 spawn（§2.6 预报 5；量级内加固非弱化）。
3. **不进仓套件（披露）**：#439「自动化承重」在仓套件面仍空——设计 §2.9 上抛 4 已登记（测试树重建面另轮）。
4. 未做项：无（口径内全达；审计 ∕ 评审非阻塞项处置见 §5.5）。

### 5.5 轮次与终态（fix round）

- **内部 explore 分叉审计 · 轮 1**：静态逐条核（该装配无执行工具——运行时读数未由其复跑，读数面 = 实施轮真跑在案）——四类偏差零；唯一 🟡 = §5 未落盘（本段落定即消）；终位收位 open（父侧）。终态 clean。
- **内部 advisor 代码评审 · 轮 1**：**VERDICT pass**（🟡1 协调项 + 🔵6）。
- **fix 轮 1**：修 #4 ∕ #5 ∕ #6 ∕ #7（探针头注收窄 + 内置载荷↦期望 reason 比对 + exitCode 非零即红；腿二时钟界 60s ⇒ 10s——判别 30s 兜底路径；失败径 existsSync ∕ try 前置转显式断言）；#2 ∕ #3 处置 = 设计权威留档 ∕ §5 记实测（本节）。
- **内部 advisor 代码评审 · 轮 2（fix 复核）**：**VERDICT pass**——四项修复逐条实读核对落位；无新 🔴 ∕ 🟡。
- **终态 = clean**（修复后复跑：测试 6/6 · 探针 5/5 · `node --check` 两件 OK）。

**决策透明表**

| 项 | 决策 | 由 |
|---|---|---|
| 测试件落点 | 暂存 `.thincoder/tmp/`（终位写门实测拒） | #545 立即形 + 机械门强制；父侧收位 |
| 负控成例 | 独立 1 case（第 6 spawn） | §2.7 负控的显式实证；分叉审计判「合理实现」 |
| 计数面收窄（advisor 🔵#2） | 不实行 | 设计 §2.8 断言形决策（关态 ==0 ∕ 开态 ≥1）——设计权威面 |
| 腿二时钟界（advisor 🔵#6） | 60s ⇒ 10s（保留断言） | 判别 30s 兜底路径（`wrapped-spawn.mjs:54`）——比删除更硬 |
| 数值漂移（advisor 🔵#3） | §5 记实测（159 行 ∕ 6 个 spawn） | §2 append-only——不回改 |
| #441 四条 | 只核不改（任一不在盘 ⇒ 停并报） | 任务书口径——四条均在盘 ✓ |

### 5.6 收尾补记（doc-check 复跑比对 ∕ 仓面终核 · 2026-09-29）

- **`node scripts/doc-check.mjs` 复跑（§5 落盘后）与基线比对（`.thincoder/tmp/doc-check-before.txt` ⇒ `doc-check-after.txt`）**：本批写域（`core-env-residuals`）前后两跑**零命中** ⇒ **零新增红**。机械口径：`anchors.exclude` 含 `batches`（`PROJECT-MANIFEST.json:31-35`）⇒ 批档不在锚 ∕ 行宽 ∕ 行数扫描域（扫描域 = docs · 152 档；批档 271 档除外）——本批写域结构上不入闸。全局增量经归属核查为**并发他批**所致：+3 符号悬空 = `docs/vsc/design/WEBVIEW-INPUT.md`（`consumableAction` ∕ `slash` ∕ `turn`——同行批在改 `queued*.mjs` 族，档案 mtime 14:24 未变、解析面变）；−2 路径 = `docs/desktop/design/PROJECT.md`（mtime 17:43，并发写者）——均非本批写域。
- **仓面终核**：本批仓内写面 = 批次档 §5（本段）+ `.thincoder/tmp/` 暂存件（gitignore 域 `.gitignore:19`）；产品码 ∕ 他档零触（`git status` 差异全归他批在途：queue-pickup ∕ i18n-split ∕ desktop-rebuild 族）。真实家零触核（`~/.thincoder/crash-reports` 末档 = 08:43——本次运行零新增）。
- **仓套件口径**：批内件不进仓套件（`thincoder-cli/package.json` test = `node test/run.mjs` 仅收 `test/*.test.mjs` + `test/integration/*`）；**仓套件未跑**——父侧收口轮为唯一仓套件跑（纪律口径）。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落**：两条腿（#439① 键面矩阵 4 态 + 独立负控 ∕ #439② 零参真 spawn）——批内件 `docs/batches/2026-09-29-core-env-residuals.test.mjs`（159 行——**父侧收位 ✓**）+ 证据件 `.thincoder/tmp/envres-441-host-reject-probe.mjs`（25 行 · 探针停车场）；#441 四条在盘核（只核不改——逐条 `file:line` + ② 端侧活核 5/5）。
- **验证**：腿 **6/6 绿**（真 spawn ∕ 真跑读数——§5 在册）；探针 5/5；advisor 代码评审 2 轮 pass（fix 轮 1 终）。
- **批内件（本批单测归档件）**：`node --test docs/batches/2026-09-29-core-env-residuals.test.mjs`——随批留档、零仓套件消费、无处置。
- **集成面**：**不新增**（腿 = 批内件形；#439 仓套件承重面 = 上抛 4 另轮在册）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓（legs 6 case；产品码 diff = 零）④ 指针 ✓ ⑤ changelog：无（产品码零改——无档面变更记录义务）⑥ **台账勾销：#439 ∥ #441 → 已核销**（两步）⑦ 前批遗留交叉核：载体批 `2026-09-27-env-config-purge.md` 收口轮设计面——已核（腿随本批落）。
- **遗留（显式）**：#439 仓套件承重面（上抛 4）∥ 证据件留 `.thincoder/tmp/`。
- **收口结论**：本批终止。
