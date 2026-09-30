# 2026-09-30 · 堆快照采集治理（运行期开关 ∥ 默认收网 ∥ 通知面）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 19:10「问题都解决完了还采集你妈逼啊」+ 19:12「这个搞掉，别挂着」（台账 #740）——冻结修复后快照臂仍持续采集且无法运行期关闭；父侧当轮处置（配置关臂 ∥ 存量 11 份已清留 1 份案底）+ 代码面收口交本批。
> 台账 = #740（桌面诊断 · 归批）。前情 = docs/batches/2026-09-30-desktop-heap-freeze.md（已收口 2026-09-30——快照臂及其 §5.5 上抛未了面之承批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-30
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 立案（用户 19:12「这个搞掉，别挂着」· 台账 #740）

**用户原话**：「问题都解决完了还采集你妈逼啊！」（19:10）∥「这个搞掉，别挂着。」（19:12）。

**案由**：冻结修复批（前情档）收口后，快照臂仍持续采集（当日实例 24 分钟 5 份），暴露三个缺口：① **无运行期开关**（`thincoder-desktop/src/main/main.mjs:121-128` 两键开机单次读——改配置须重启）；② **无收网条款**（前情批 §5.5 上抛「用户面运行期开关」未做 ∥ 无观察期/到期安排）；③ 通知面 = 每次采集弹「快照采集中——界面或短暂停顿」。

**当轮已处置（父侧直接执行 · 可 revert）**：`~/.thincoder/config.json` 加 `diagnostics.heapSnapshot:false`（读回验证 ✓；**只关采集臂、冻结自愈保留**）；存量快照 11 份已清（留最新 1 份案底）；自清链实核 = 「30 天窗搭车武装」（`heap-watch.mjs:58-69` `purgeOwnFiles`）**不受停采影响**——更正父侧 #740 初报之「永久滞留」表述。

**本批 = 代码面收口**：① 运行期开关（形待设计：config 热读 ∥ 用户面开关——原批上抛项）；② 默认口径/收网条款（隐私先例 = `thincoder-core/config.mjs:86` traces D-TR6「新用户零采集」——快照 = 150MB 级会话堆转储、现行默认开，须逐项对口径）；③ 通知面随动。

**授权**：本会话 00:14「排空」全链 + 用户 19:12 令（fast lane 单点全流程）。**避让面**：桌面会话在飞域（renderer CSS ∥ `docs/desktop/design/PROJECT.md` 等 30 档）零触——文档随动如遇域冲突后置。

**父侧订正注（2026-09-30 19:3x · §3 轮次 1 发现 6 ∥ 7 承接）**：① §1.1 引「前情批 §5.5 上抛『用户面运行期开关』」**不实**——`docs/batches/2026-09-30-desktop-heap-freeze.md` §5.5 无该句；`:484` 之「用户面开关」= §2.15 分段常量面、非快照臂 ⇒ 本批缺口以**用户 19:10 实报**成立（不依赖该引）；② §1.1「`heap-watch.mjs:58-69`」指**桌面档** `thincoder-desktop/src/main/heap-watch.mjs`（全路径以本注为准——与 CLI 同名档区分）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 ∥ 收正轮落（承 §3 轮次 1 发现 1–5 ∥ 7–8 逐号；发现 6 父侧 §1 承接）· 上抛 2 · 随动 4 · 2026-09-30）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（initial）· eng-designer · 2026-09-30**

### 一、本批条目（覆盖）

| # | 条目 | 来源 | 状态 |
|---|---|---|---|
| 1 | **快照臂运行期开关**：`diagnostics.heapSnapshot` 改键运行期生效（桌面热读——免重启）；用户面 = CLI `/config` 切换项 | §1 缺口①（用户 19:10/19:12 · 台账 #740）；前情上抛承批 | 设计落 ✓（三.1 ∥ 三.5） |
| 2 | **默认口径翻转 + 收网条款**：`diagnostics.heapSnapshot` 默认 `true` ⇒ `false`（隐私默认关——D-TR6 同族）；收网 = 默认关 ∪ 手动收（运行期开关） | §1 缺口②；§1.1 隐私先例逐项对口径 | 设计落 ✓（三.2 ∥ 三.3） |
| 3 | **通知面**：随 ①② 定——保留（零改） | §1 缺口③ | 设计落 ✓（三.4） |

- 本批**不含**：冻结门 ∥ 自愈臂语义（禁令零碰）· renderer 域（在飞）· 桌面设计档随动（在飞 ⇒ §八后置）· 需求档笔（主 agent）。
- 需求核对（设计前置）：三缺口均为**既有机制的口径治理**（机制本体 = KD-53 在册 ∥ 核两键在册）——无需求五要素缺口；隐私先例逐项对口径见三.2（先例原文 = `thincoder-core/config.mjs:86` 注释 ∥ `docs/core/design/TRACES.md:59/113`）。∘ 需求补件上抛 = 无。

### 二、设计档落点（D6 读回在盘——已落）

| 档 | 落点（现行实读） | 内容 |
|---|---|---|
| `docs/core/design/CONFIG.md` | §6.2 名录 `:142`（`THINCODER_HEAP_SNAPSHOT` 行）· 变更记录 `:235` | 默认值收正（`true` ⇒ `false`）+ 桌面热读注 |
| `docs/cli/design/CRASH-REPORTS.md` | §3.2 `:78` · §4.3 `:125` · 变更记录 `:201` | 判定句翻转（fail-closed）+ 两键默认相反收正 |
| `docs/cli/design/CLI-DEBT.md` | 表 A `A6` 行 `:35` · 变更记录 `:123` | `cmd-config.mjs` 读数刷新 472 ⇒ ≈490（终值随实施） |
| `docs/desktop/design/PROJECT.md` | **后置**（在飞域——§八随动清单①） | KD-53 族三决策 + §4.1/§4.2 值列 |
| 机制单源（暂） | 本段（§2 三.1–三.5）——PROJECT.md 随动落地前以本段为准 | 运行期开关机制 ∥ 切换面 ∥ 判定形 ∥ 边界 |

### 三、机制设计

**3.1 运行期开关（机制 = 事件驱动热读 · 两源一应用点）**

- **应用点（装配层 = `thincoder-desktop/src/main/main.mjs`）**：新增 `syncHeapSnapshot()`——`loadConfig()?.diagnostics` 读回 ⇒ `heapWatch.setSnapshotEnabled(d.heapSnapshot === true)`；读抛 ⇒ 回退默认（关——fail-closed）+ `console.error` 一行（零静默）。
- **源①（外部写盘——手编 ∕ CLI `/config` ∕ 他进程）**：既有 `startConfigWatch` 接线（`main.mjs:167`）的 `onChange` 同拍调用 `syncHeapSnapshot()`（与 `ev:config` 出站并列）。
- **源②（同进程自写——桌面 agent `settings` 工具 ∥ 端内写面）**：核 `onConfigSelfWrite`（`thincoder-core/config-io.mjs:107`——多订阅 Set；含退订面）新增订阅 ⇒ 同调 `syncHeapSnapshot()`；窗口 `closed`（`main.mjs:168`）随 `configWatch.dispose()` 同点退订。
- **两源之据**：config-watch 对**同进程自写**按设计抑制（核 `config-watch.mjs:70` `noteSelfWrite` 基线刷新）；桌面 agent 在**主进程内跑**（`agent-host.mjs:37` `runAgent` 实读）⇒ `settings set` 写盘 = 自写 ⇒ 只挂源①会「改键不生效」；源②正是该径的可见钩。
- **机制侧（`thincoder-desktop/src/main/heap-watch.mjs`）**：句柄面增 `setSnapshotEnabled(enabled)`——同值 = 零动作（幂等）∥ 过渡记 `[heap] snapshot collection enabled ∕ disabled (runtime)` 日志行；`false` ⇒ 渲染径即时零取（`takeSnapshot` 守卫 `:142` ∥ `checkNow` 早退 `:177`——压力在场**不占 once 位** ⇒ 再开当拍即取）。
- **补装（`false→true`）**：主进程近上限臂补装——门 = `armed ∧ ¬armDone`（仅武装开启且未装过时恰一次；`armed=false` ⇒ 运行期开快照键亦零 arm）。
- **臂调用观测缝（T4 ∕ T5 ∕ T6 判据承载）**：既有注入参数 `armMainSnapshot`（`:99`——缺省 `() => v8.setHeapSnapshotNearHeapLimit(1)`）；测试注入计数假件即可观测「零 arm ∕ 补装恰一次」，缺省 = 生产行为零改（平 node 直测）。
- **语义边界（证据在册）**：`v8.setHeapSnapshotNearHeapLimit` 为**一次性 API**——Node 文档逐字「no-op if … called more than once」「limit must be a positive integer」⇒ **已装臂不可运行期撤**（留至进程重启；触发 = 主进程近 OOM——罕见）；运行期关 ⇒ **渲染快照即时零取**（用户的采集痛点面 = 此径）。
- `heapWatch`（武装门）**不随运行期**（保持开机单读）：自愈语义零碰（禁令）+ 最小改幅；采集臂关 ⇒ 用户可见面零采集。
- **跨键口径（如实登记）**：**桌面两键非独立**——`heapWatch=false` ⇒ 快照臂零装（武装块 `:266-274` 在 `armed` 闸内，运行期开快照键亦零 arm——见上行补装门）；**CLI 两键独立**（快照键 ∥ watch 键各自判定各自机制——`CRASH-REPORTS.md` §3.2 ∥ §4.3）。

**3.2 默认口径（翻转 + 逐项对口径）**

- **决策**：`diagnostics.heapSnapshot` 默认 `true` ⇒ `false`（`thincoder-core/config.mjs:90`）；`heapWatch` 默认**保持** `true`（仅显式 `false` 可关）。
- **逐项对口径（D-TR6 先例 × 快照 × watch）**：

| 面 | traces（D-TR6 · 2026-09-05 用户裁） | heap 快照（本批翻转） | heapWatch（保持） |
|---|---|---|---|
| 内容 | 完整对话内容 | **会话堆转储**（内存态超集：对话 + 凭据级对象） | 数值读数 + 冻结现场 JSON（小） |
| 体量 ∕ 份 | KB–MB ∕ 会话 | 25MB+（实测：探针 7.4 ∕ 24.1MB；恢复态 25MB） | KB 级 |
| 采集条件 | 连续（每 LLM 调用） | 条件（健康阈值 ∥ 冻结自复 ∥ 近 OOM——实例实测 5 份 ∕ 24 分钟） | 连续采样（60s——零写盘） |
| 现行默认 | **OFF**（发布隐私） | **ON**（2026-09-27 立键）⇒ 本批翻转 OFF | ON |
| 收网 ∕ 保留 | 24h 启动清理 | 30 天自清（搭车武装——采集关不影响） | 30 天（现场族） |

  ⇒ 快照内容敏感度 **≥** traces ∥ 体量 **>** traces——「新用户零采集」先例逐项覆盖 ⇒ 翻转成立；watch 因「自愈臂 = 修复本体 ∥ 内容零敏感（读数 ∥ 现场登记）」不动。
- **判定形（fail-closed）**：桌面 `main.mjs`（`diagnostics.heapSnapshot === true`）+ CLI `bin/thincoder.mjs:59`（`!== false` ⇒ **`=== true`**——读抛 ∕ 损坏 ⇒ 不武装，与默认同向）；`heapWatch` 判定形不变（`!== false`——默认开同向）。
- **存量零迁移**：用户机显式 `heapSnapshot:false` **保留**（与默认重合）；显式 `true` 的存量不受影响（显式值优先——`config.mjs:280` 布尔校验既有面）。
- **CLI 面同键同语义**：`prepareCrashReporting` 近上限臂随默认关（取证 opt-in；取舍 = 首次 OOM 无快照——显式开后恢复；设计面成文 = `CRASH-REPORTS.md` §3.2 已落）。

**3.3 收网条款（手动；观察窗被否）**

- 收网 = **默认关（无界形态消解）+ 显式开后的手动关闭**（运行期开关 ∥ 配置键——同一键、同一面）。
- **观察窗（自动到期）被否**：① 默认关已消「装了就采、无人关」的实际事故形（本次事件形）；② opt-in = 显式诊断动作——自动到期会在诊断中途静默停采（**毁证据窗**——比「忘了关」更高害）；③ 引入启用时点持久态 + 计时器 + 到期语义（三新面 vs 最小改幅）；④ 保留面已有界（30 天自清——`thincoder-desktop/src/main/heap-watch.mjs:58-69` 实核：采集关不影响武装 ⇒ 自清照跑）。

**3.4 通知面（保留 · 零改）**

- 采集门收网后（默认关）预告自然零出；显式开期（诊断态）保留「快照采集中——界面或短暂停顿」预告——**停顿解释价值**（`main.mjs:139-143` 零改）。
- 被否：删除 ∥ 静默化——③ 的抱怨场景 = 不想要的连续采集；该场景已由 ①② 消解（诊断态下该预告 = 信息而非噪音）。

**3.5 用户面（命令面 = CLI `/config`；设置面后置）**

- **CLI `/config` 增 `diagnostics.heapSnapshot` 切换项**（先例 = `traces.enabled` 切换项逐式 ∥ 同批隐私族）。
  - 菜单项（`cmd-config.mjs:356` 后同列）：`diagnostics.heapSnapshot = <on|off>（堆快照采集——默认关——桌面会话即时生效）`；显示判定 = `dc.heapSnapshot === true`（fail-closed 显示）。
  - 写面：`saveProxy((raw) => { raw.diagnostics = { ...(raw.diagnostics ?? {}), heapSnapshot: newVal } })`（显式布尔 ∥ 保族内他键——沿 `traces.enabled` 逐式）；确认行：`diagnostics.heapSnapshot = <on|off>（桌面会话即时生效 ∕ 本进程下次启动）`；View 行同拍（`:379` 邻位）。
  - 语义：CLI 侧写盘 = 他进程 ⇒ 桌面经源①**即时生效**；CLI 本进程 = 下次启动（bin 单点——回显已注）。
- **设置面（桌面设置面板诊断行）后置**：renderer 域在飞（§八清单②）；上抛项「用户面」由命令面承接。
- **辅助径（零码）**：agent `settings` 工具（`settings set diagnostics.heapSnapshot false`——主进程自写 ⇒ 源②即时生效）；手编 `config.json`（源①）。三径合 = 「用户可及」。
- 被否：桌面原生菜单（新 UI 面 + 菜单态同步 + `SHELL.md` 在飞——射程外）；仅配置键面（上抛项 = 用户面 ⇒ 须可操作开关）。

### 四、受影响文件与测试面（落点表 · file:line as-of 2026-09-30 实读）

| 档 | 现行 ⇒ 预期 | 落点（file:line） | 变更 |
|---|---|---|---|
| `thincoder-desktop/src/main/heap-watch.mjs` | 299 ⇒ ≈312 | 头注 `:10-11` · JSDoc `:71-75` · 签名 `:76-100` · 状态区 `:101-111` · 武装块 `:266-274` · 句柄返回 `:276-298` | `setSnapshotEnabled` 句柄 + `armDone` 闸 + 注释随动——**越 300 顾问线（越层段登记）**；硬限 500 未及；消解预案 = 下次本档结构性触碰轮拆分 ∥ 头注压缩 |
| `thincoder-desktop/src/main/main.mjs` | 188 ⇒ ≈205 | 导入区 `:21-32` · 装配块 `:121-160`（判定形 `:127-128`）· 钩族 `:161-163` · 新 sync ∥ 订阅落位（`:163-164` 之间）· `onChange :167` · 收尾 `:168` | 启动读判定形 + `syncHeapSnapshot` + 两源接线 + 退订 + 注释随动 |
| `thincoder-core/config.mjs` | 431 ⇒ ≈433 | DEFAULTS `:89-90` | 默认翻转（`heapSnapshot: false`）+ 注释 |
| `thincoder-cli/bin/thincoder.mjs` | 178 ⇒ ≈179 | `:49-54` · `:59` | 判定形 `=== true`（fail-closed）+ 注释 |
| `thincoder-cli/src/tui/cmd-config.mjs` | 472 ⇒ ≈490 | `:37` · `:343` · `:356` 邻位 · `:379` 邻位 · `:438` 邻位 | `/config` 切换项（菜单 + 处理支 + View 行）——CLI-DEBT A6 已随触刷新 |
| `docs/batches/2026-09-30-heap-snapshot-switch.test.mjs` | 批内件（新档——预估 ≈180–260；T9 源扫腿含内） | — | 单元腿 T1–T8 + 源扫腿 T9 + 结构腿（§五 A1–A4） |
| `docs/core/design/CONFIG.md` ∥ `docs/cli/design/CRASH-REPORTS.md` ∥ `docs/cli/design/CLI-DEBT.md` | **设计轮已落**（§二表——读回 ✓） | `:142/:235` ∥ `:78/:125/:201` ∥ `:35/:123` | 默认口径 ∥ 判定句 ∥ 登记刷新 |
| `docs/core/design/API-CONTRACT.md` | 生成区（生成器 `scripts/api-contract.mjs`） | 桌面 `heap-watch.mjs` 行号组 `:2070-2083` | 本批行号位移 ⇒ 实施 ∥ 收口轮 `--check`，漂移 ⇒ `--write`（机械） |

- **零触（在飞域 + 禁令）**：`thincoder-desktop/renderer/**`（全域 ∥ 在飞）· `docs/desktop/design/{PROJECT,RENDERER,UI,IPC,SHELL,E2E-TESTING}.md`（在飞——随动后置）· `src/main/{suspension-drive,projects,window}.mjs`（在飞批域）· `thincoder-render-core/**` · prompts 面 · VSC 树（无消费面——实读）· 冻结门 ∥ 自愈语义。
- **在飞域核对（三在途批受影响面实读）**：`#736`（renderer CSS 十二档 + theme + 核件覆盖段 + PROJECT.md/UI.md）∥ `#738`（`suspension-drive.mjs` + renderer 四档）∥ `#734`（已提交 `c7539822`——余设计档值列回填）⇒ 与本批落点**零交**。
- **测试面**：批内件单档（随批档命名——不入仓套件；仓测试树 2026-09-28 全清重置后本面无在册用例 ⇒ 无回归面）；`node --check` 四源档；真机腿 = 父侧（§五 A5）。

### 五、验收对照（回指 §1 缺口 ①②③ ∥ 台账 #740）

| # | 腿 | 判据 | 承载 |
|---|---|---|---|
| A1 | 机制腿（单元 + 源扫） | T1 基线取 ∥ T2 关后阈值零取 ∥ T3 关→开当拍恢复取 ∥ T4 同值幂等（零 arm ∥ 零日志）∥ T5 `false→true` 补装臂恰一次（`armDone` 闸）∥ T6 heapWatch 关 ⇒ 零 arm（运行期开快照键亦零 arm）∥ T7 过渡日志逐字 ∥ T8 关时冻结自复零取（`skipped:"disabled"` 记录）∥ T9 读抛径（main.mjs 源扫：读区块 catch 在场 ∧ 告警行 `console.error` 零静默 ∧ 落值谓词 `=== true`——读抛 ⇒ 关） | 批内件（假源注入缝：`armMainSnapshot` ∥ `log` ∥ `sample` ∕ `snapshot`——平 node 直测；T9 = 源扫形〔main.mjs 自跑入口无平 node 直测位——如实登记〕） |
| A2 | 切换面腿（单元） | `/config` 选择 ⇒ `persistRaw` 收 `raw.diagnostics.heapSnapshot = <bool>`（显式 ∥ 族内他键保留）；菜单 ∥ 确认行文案逐字；Esc ∥ 异常零写 | 批内件（ctx mock——沿 `cmd-config-effort` 先例） |
| A3 | 默认腿（单元） | 沙箱空 config ⇒ `loadConfig().diagnostics = { heapWatch: true, heapSnapshot: false }`；raw `{heapSnapshot:true}` ⇒ true；非布尔 ⇒ 回退 false | 批内件（沙箱 HOME ∥ `_setConfigPathForTest`） |
| A4 | 判定形腿（结构） | bin `:59` = `=== true` ∧ watch = `!== false`；main.mjs 在场 = `onConfigSelfWrite` 订阅 + onChange 同拍 sync + `setSnapshotEnabled` 调用；`node --check` 四档 | 批内件（结构扫） |
| A5 | 真机腿（父侧 D16——两径） | ① 桌面在跑（暂开）⇒ CLI `/config` 切 off ⇒ 桌面 `[heap] snapshot collection disabled (runtime)` 行 + 新快照档零增；切 on ⇒ enabled 行 + 下一阈值拍可采；② 桌面 agent `settings set diagnostics.heapSnapshot false` ⇒ 同效（源②径）；③ 清键冷启 ⇒ 快照臂不武装（默认关） | 父侧（本机桌面 = 用户活动实例——择窗跑） |
| A6 | 文档腿 | 三档设计面读回逐处核（§二表 ✓ 本轮）；行宽 ≤300 机检；需求档随动核（§八——已落 ∥ 同窗先于实施轮） | 本轮 + 收口轮 |
| A7 | 覆盖核对 | §1 缺口①–③ ↔ 本段一表三行一一对应；零触清单与在飞域实读一致 | 评审面 |

### 六、关键决策表（含被否）

| # | 决策 | 依据 | 被否（何故） |
|---|---|---|---|
| D1 | 运行期机制 = **事件驱动热读 · 两源**（config-watch onChange + `onConfigSelfWrite`） | 既有基础设施复用（最小改幅）∥ 全写径覆盖（外部 + 同进程自写）∥ 即时（去抖 300ms 级） | 采样拍节流重读（≤60s 延迟 + 每拍回读——钩面已在，冗余）· 仅 config-watch（漏同进程自写——桌面 agent 工具径失效） |
| D2 | 用户面 = **CLI `/config` 项**（命令面） | 先例逐式（traces 两项）∥ 写盘 = 他进程 ⇒ 桌面热读一条链 ∥ 最小改幅 | 桌面设置面板（renderer 在飞——后置）· 桌面原生菜单（新 UI 面 + 同步 + 在飞文档——射程外）· 仅配置键面（上抛项 = 用户面） |
| D3 | 默认 = `heapSnapshot` **true ⇒ false** | 逐项对口径（三.2：敏感度 ≥ traces ∥ 体量 > traces）⇒ D-TR6 先例覆盖 ∥ 用户 19:10 口径 ∥ opt-in 成本已低（运行期开关） | 维持 true（「问题都解决完了还采集」= 用户否决）· 分端双默认（同键双语义 = 漂移）· 新键分立（前情批 D2 已否——键面膨胀） |
| D4 | 收网 = **默认关 + 手动** | 无界形态消解 ∥ opt-in 显式 ∥ 保留面有界（30 天自清） | 观察窗自动到期（毁诊断窗 ∥ 三新面——三.3） |
| D5 | `heapWatch` **不随运行期**（开机单读） | 自愈语义零碰（禁令）∥ 最小改幅 ∥ 其可见面近零（warn 行进 stderr） | 两键同热（臂启停 = 定时器 ∥ 武装过渡 + 自愈语义触碰） |
| D6 | 通知面 = **保留（零改）** | 采集门收网 ⇒ 预告零出；诊断态保留 = 停顿解释 | 删除 ∥ 静默化（诊断态无解释 + 零收益改幅） |
| D7 | 主进程近上限臂：**运行期不可撤**（如实登记） | Node 文档逐字（一次性 API ∥ limit 须正整数）——不可为 | 撤臂（API 不可得）；不开臂（启动态关则不装——已含） |

### 七、边界（不做）

- 冻结门 ∥ 自愈臂 ∥ 恢复动作语义零改（禁令）。
- `heapWatch` 运行期切换不做（D5）；主进程近上限臂已装态不可运行期撤（D7——留至重启）。
- renderer 域 ∥ 桌面在飞档零触；零新 IPC 通道；零新配置键；VSC 树零触（无消费面）。
- 桌面设置面板诊断行 = 后置（UX 轮）；桌面设计档随动 = 后置（在飞）。
- CLI 本进程快照键 = 下次启动生效（bin 单点——如实注于切换回显）。

### 八、随动 ∥ 上抛

- **随动（后置——域冲突）**：① `docs/desktop/design/PROJECT.md` KD-53 族（三决策 + §4.1/§4.2 值列 `heap-watch 299⇒≈312` ∥ `main 188⇒≈205` + 变更记录）——在飞 ⇒ 另轮；② 桌面设置面板诊断行（renderer + `settings:agent` 面——UX 轮）；③ `API-CONTRACT.md` 生成区（实施 ∥ 收口轮 `--check`）。
- **发版说明面（CHANGELOG）**：默认翻转 = 用户可见行为变更 ⇒ `thincoder-cli/CHANGELOG.md` `[Unreleased]` 段一条（发版流程单源 = `docs/RELEASE.md`）；**归发版轮**（本批 ∥ 实施轮不落笔）。
- **需求档随动（主 agent 笔——已落）**：`docs/cli/requirements/CRASH-REPORTS.md`——F3① `:34-35` ∥ F3② `:37`（逐句落点保留）+ F3 行 ∥ §1 例外标注 + 变更记录 `:104` ⇒ 默认关口径（本席实读核 ✓ · 2026-09-30 工作树）。**次序 = 同窗、先于实施轮**（先改档再码）——实施轮开口核本项在盘。
- **披露（引用精度）**：§1.1 引「前情批 §5.5 上抛『用户面运行期开关』」——实读前情档 §5.5 无该句；「用户面开关（欲运行期开关 ⇒ 另裁）」唯一字面出处 = 前情档 `:484`（§2.15 E4-JS 块——**分段常量**之用户面开关，非快照臂）。本批 ① 承批口径以 §1 ∥ 派单为准（19:10 实报；缺口成立）；无阻。
- **上抛（≤2）**：① 观察窗若父侧坚持（本设计否）——须先裁「毁诊断窗」风险（三.3）；② 桌面设置面板行 ∥ PROJECT.md 随动落位窗口（在飞批落地后择轮）。

### 九、逐处读回（D6——本轮）

- `CONFIG.md:142`（默认 `false` + 热读注）+ `:235`（变更记录）——读回 ✓（2026-09-30 本席实读）。
- `CRASH-REPORTS.md:78`（判定 fail-closed）+ `:125`（两键默认相反）+ `:201`（变更记录）——读回 ✓。
- `CLI-DEBT.md:35`（472 ⇒ ≈490）+ `:123`（变更记录）——读回 ✓。
- 本段落盘 = batch 工具回执（附于父侧）+ 落盘实读复核。

**行宽自检注（同轮 · D6 附）**：§2 存在非表格 >300 单行 1 处（三.1 机制侧句 `:56`，317 字符）；记录面在行宽闸域外（`PROJECT-MANIFEST.json:31-34` `anchors.exclude` 含 `batches` ∥ `scripts/doc-check.mjs:65` 行宽检查复用该 exclude）；append-only 机制下不做折行——如实登记（设计三档真判据命中 = 0，见 §九）。

**行宽自检附（同轮）**：设计三档（CONFIG.md ∥ CRASH-REPORTS.md ∥ CLI-DEBT.md）真判据扫描 = 非表格 >300 命中 **0**（本席实跑——证据见交付报告③）；§2 本文命中 1（即上注 `:56`）。上注「见 §九」指称订正为「见本节 ∥ 交付报告」——§九 仅载三档读回。

### 十、设计收正轮记录（fix · 承 §3 轮次 1 · eng-designer · 2026-09-30）

> 父侧裁定 = 8 条全收；本席逐号落 **7 条**（发现 6 = 父侧 §1 订正注承接——零触）；上文就地收正处 = 现行有效表述；机制本体 ∥ 需求档 ∥ 产品码 ∥ §1 ∥ §3–§6 零触。

| 号 | 改动 | 落点（收正后实读） |
|---|---|---|
| 1 | 臂调用观测缝指名（既有注入参数 `armMainSnapshot`——`heap-watch.mjs:99`）∥ A1 承载句同步；机制侧行折为两行 | 三.1 `:58-60` · §五 A1 `:124` |
| 2 | 读抛径腿 = T9（main.mjs 源扫——catch 在场 ∧ `console.error` 零静默 ∧ 谓词 `=== true`）；T1–T9 计数随动 | §五 A1 `:124` · §四 `:112` |
| 3 | 需求档随动次序成文（同窗、先于实施轮）；逐句落点保留（F3① `:34-35` ∥ F3② `:37`）；实读核 = 已落（工作树） | §八 `:156` · §五 A6 `:129` |
| 4 | 判定句「运行期可显式开」⇒ 分端生效时点（桌面热读 ∥ CLI 下次启动）∥ 变更记录 +1 行 | `docs/cli/design/CRASH-REPORTS.md:78` · `:202` |
| 5 | 发版说明面（CHANGELOG）登记——归发版轮 | §八 `:155`（新增行） |
| 7 | 裸名引补全路径（`thincoder-desktop/src/main/heap-watch.mjs:58-69`——桌面档限定） | 三.3 `:86` |
| 8 | 跨键口径成文（桌面两键非独立 ∥ CLI 两键独立）∥ T6 括注 | 三.1 `:63`（新增行）· §五 A1 `:124` |

**行宽 ∥ 读回（D6）**：上列改动行 ≤300 机检 ✓；三.1 机制侧 317 字符行随发现 1 折为两行——前轮行宽登记项消解（§2 现行非表格 >300 = 0）；逐号读回 = 交付报告③。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（设计评审 · 首轮 · 逐条附证）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | A1 中 T4／T5／T6 三腿判据核心 = 臂调用观测（「零 arm」／「补装臂恰一次」——`docs/batches/2026-09-30-heap-snapshot-switch.md:119`），但承载句只写「假源注入缝——平 node 直测」（同处）——臂面（`v8.setHeapSnapshotNearHeapLimit` 一次性 API——`:56`／`:57`）的观测缝形态未指名；该源档不在本轮评审范围，现签名是否可注入 = unverified。 | 在机制段（三.1）指名臂调用观测缝形态（沿既有注入参数先例，或模块级缝 + `??` 默认回退、缺省不改生产行为），使 T4／T5／T6 有可执行判据。 |
| 2 | Acceptance criteria | 🟡 | 三.1 新增的读失败路径——「读抛 ⇒ 回退默认（关——fail-closed）+ `console.error` 一行」（`:52`）——在验收表 A1–A7（`:117-125`）中无对应腿；A4 为结构在场扫，不覆盖该行为。 | 补一条单元腿（读抛 ⇒ 回退关 + 零静默告警一行），或注明该路径由哪一腿承载。 |
| 3 | Requirements | 🟡 | 需求档 `docs/cli/requirements/CRASH-REPORTS.md` F3（「默认武装」／「默认开」——设计自述 `:150`）与本批默认翻转相反；随动已上抛但未给落笔时点——项目纪律 = 先改档再码（Project Guide：Docs conflict → stop and report … update the docs, then code）。需求档不在本轮评审范围 ⇒ 其原文未核验（unverified）。 | 写明需求档随动与实施轮的次序（同窗、先于实施），保留 `:150` 的逐句落点（F3① `:34-35`／F3② `:37`）。 |
| 4 | Document ownership | 🟡 | `docs/cli/design/CRASH-REPORTS.md:78`（本批已改活面句）「…判定形 fail-closed，运行期可显式开」位于 **CLI 面**档内，易读作 CLI 进程运行期热生效；与设计「CLI 本进程 = 下次启动（bin 单点）」（`:93`／`:145`）的生效时点表述不一（措辞级，非机制级）。 | 收紧为分端生效时点口径（桌面热读 ∥ CLI 下次启动），或指 `docs/core/design/CONFIG.md` §6.2 名录行。 |
| 5 | Document ownership | 🔵 | 默认值翻转属用户可见行为变更；§2 四落点表与 §八随动 ∥ 上抛清单（`:100-109`／`:147-152`）均无 `CHANGELOG` 面——`docs/core/design/CONFIG.md:68` 将 CHANGELOG 条目列为配置键面 / 默认值变更的落地物之一。 | 在随动 ∥ 上抛清单登记发版说明面（或注明归发版轮）。 |
| 6 | Clarity | 🔵 | §1.1 与档头引「前情批 §5.5 上抛『用户面运行期开关』」（`:13`／`:4`）经设计段实读披露为不实（真实出处 = 前情档 `:484`、分段常量面——`:151`）；披露已足，误引句留于 append-only §1（不可改）。 | 收口段附一条订正注（引称与实读出入——留痕）。 |
| 7 | Clarity | 🔵 | §1.1／三.3 的裸文件名引（`heap-watch.mjs:58-69`——`:15`／`:81`）未带路径前缀；树内同名档存在（桌面 `thincoder-desktop/src/main/heap-watch.mjs`（`:102`）∥ CLI `thincoder-cli/src/heap-watch.mjs`（`docs/cli/design/CRASH-REPORTS.md:112`））——有错认余地（§2 四表已用全路径，正文未统一）。 | 首次出现处统一全路径（或行内注明「桌面」限定）。 |
| 8 | Clarity | 🔵 | 跨键交互未成文：T6 定「heapWatch 关 ⇒ 零 arm」（`:119`）＋三.1「`heapWatch`（武装门）…」（`:58`）＝桌面面两键非独立（heapWatch=false ⇒ 快照臂亦零装）；CLI 面两键为独立判定（`docs/cli/design/CRASH-REPORTS.md:78`／`:125`）——该差异未见机制 ∥ 边界段与随动档。 | 机制段或边界段补一句跨键交互口径（或登记为已知边界），防跨键预期落差。 |

**核验说明（声明限制）**：无项目标准档 / 无文档地图声明 ⇒ 文档归属按 Project Guide ∥ 在审档互证判定（降级）；设计引用的源档（`thincoder-desktop/**` ∥ `thincoder-core/**` ∥ `thincoder-cli/**`）不在评审范围 ⇒ 其行号 / 行为断言与 §2 四 行数参数（`299⇒≈312 ∥ 188⇒≈205 ∥ 431⇒≈433 ∥ 178⇒≈179 ∥ 472⇒≈490`）本轮未核验（unverified）。可核部分逐处相符：三档设计面落点（`CONFIG.md:142/:235` ∥ `CRASH-REPORTS.md:78/:125/:201` ∥ `CLI-DEBT.md:35/:123`）∥ 三档行宽自检（非表格 >300 命中 0——本轮实跑）∥ §2 行宽自述（`:56` 恰 317 字符——本轮实跑）∥ 设计 ⇄ CLI-DEBT 读数一致（472 ⇒ ≈490 两处同值）。

计数：🔴 0 · 🟡 4 · 🔵 4（共 8 条）

VERDICT: pass

## §4 用户批准（主 agent）

**批准**：✅ 设计批准（2026-09-30 19:4x · 父侧代签）。依据 = 用户 19:12「这个搞掉，别挂着」（台账 #740）+ 本会话 00:14「排空」全链授权。

**三条件齐备**：① 设计评审 **pass** ✓（§3 轮次 1：🔴0 ∥ 🟡4 ∥ 🔵4——8 条全收）；② 收正轮已落地并核验 ✓（#6 = 父侧 §1 订正注已落 ∥ #1–5/#7/#8 = 收正轮（§十）逐条父侧实读核验）；③ token 已签发 ✓（值不落档）。

**随批准裁定**：需求档（`docs/cli/requirements/CRASH-REPORTS.md`）父侧已落（§八 `:156`——同窗先于实施轮）；发版说明面 = 归发版轮（§八 `:155`）；上抛 2 项随档在案。**执行归属 = CLI 会话**；实施舱 = 本笔后即派。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-30 · 13/13 绿 ∥ 审计 CLEAN ∥ 评审 pass（§5.3）· fix 轮 2–4（§5.4 D1 ∥ §5.5 R3 ∥ §5.7 前批归档件契约收正——暂存待父侧收位）∥ 终态 clean（§5.4 §5.5 §5.7））
> 实施轮 · eng-coder · 承 §2 全节（三.1–三.5 ∥ §四 落点表 ∥ §五 A1–A4 ∥ §六 决策）；A5 真机腿 = 父侧择窗（本舱零做）；A6 机检 = 收口轮。

### 5.1 交付摘要（逐落点 · 行数 = 本席实读）

| 落点 | 交付 | 行数（设计基 ⇒ 实读） |
|---|---|---|
| `thincoder-desktop/src/main/heap-watch.mjs` | `setSnapshotEnabled` 句柄（同值幂等 ∥ 过渡日志逐字 ∥ `armDone` 闸补装恰一次 ∥ `armed=false` 零 arm ∥ 开机武装置 `armDone`）+ 头注 ∥ JSDoc 随动 | 299 ⇒ **315**（+16；越 300 顾问线——设计已登记） |
| `thincoder-desktop/src/main/main.mjs` | 启动判定形 `=== true` ∥ `syncHeapSnapshot()`（读回 `=== true`；读抛 ⇒ 关 + `console.error`）∥ 源① `onChange` 同拍 ∥ 源② `onConfigSelfWrite` 订阅 ∥ 窗口 `closed` 随 `dispose` 同点退订 | 188 ⇒ **203**（+15） |
| `thincoder-core/config.mjs` | `diagnostics.heapSnapshot: false`（默认翻转）+ 注释 | 431 ⇒ **433**（+2） |
| `thincoder-cli/bin/thincoder.mjs` | 判定形 `=== true`（fail-closed）+ 注释 | 178 ⇒ **179**（+1） |
| `thincoder-cli/src/tui/cmd-config.mjs` | `/config` 菜单项 ∥ 处理支（显式布尔 ∥ 族内他键保留）∥ View 行（文案逐字 §三.5） | 472 ⇒ **488**（+16——CLI-DEBT A6 终值 = 488，收口轮回填） |
| `docs/batches/2026-09-30-heap-snapshot-switch.test.mjs` | 批内件 13 用例（T1–T9 ∥ A2 ×2 ∥ A3 ∥ A4）。**首落 `.thincoder/tmp/`**（跨批护栏挡 `docs/batches/*.test.mjs` 直写——先例 = 2026-09-30-desktop-heap-freeze 同法）⇒ **父侧收位 `docs/batches/` 同名件**；终位零改码已核（`REPO = dirname(..)/../..` 两层深同解 ∥ 取件路径全绝对 ∥ `@thincoder/core` 按被导入件自身目录解析） | 新档 · 299 行 |

**验证证据**：`node --test .thincoder/tmp/2026-09-30-heap-snapshot-switch.test.mjs` = **13 pass / 0 fail**；同模块回归 `node --test docs/batches/2026-09-30-desktop-heap-freeze.test.mjs` = **12 pass / 0 fail**；`node --check` 五源档全绿（A4 腿内实跑）。

### 5.2 决策透明表（实现级判断点 · 零另发明）

| # | 判断点 | 取值 | 理由 |
|---|---|---|---|
| 1 | 启动读 catch 亦 `console.error` 一行 | 是（设计仅对 `syncHeapSnapshot` 明写零静默） | 两读点同向 fail-closed；T9 源扫判据 = 读区块 catch ∧ `console.error` |
| 2 | 过渡日志不判 `armed` | 异值必记 ∥ 同值零记 | §三.1 逐字未设 armed 条件；T4 判「同值零日志」、T6 仅判「零 arm」 |
| 3 | View 行文案（设计只锁菜单 ∥ 确认行逐字） | `diagnostics.heapSnapshot: <on\|off>（堆快照采集——默认关——桌面会话即时生效）` | 沿菜单同式 + traces 先例（View 与菜单同 parenthetical） |
| 4 | `node --check` 实检五源档（设计记「四」） | 五档 | 落点表 5 源档全覆盖——超集非缺失（见 5.3 响应表 ⑤） |
| 5 | `setSnapshotEnabled` 归一 `value === true` | 是 | 与两端判定形同口径（fail-closed 单源） |
| 6 | `armDone` 置位含臂抛错 ∥ 开机武装亦置位 | 是 | 「恰一次」语义 + Node 一次性 API（重调 no-op ∥ 已装不可撤） |

### 5.3 审计与代码评审轮次（终态 = clean）

| 轮 | 面 | 结果 |
|---|---|---|
| 1 | 内部偏离审计（explore · 只读） | **CLEAN**——四类偏差（部分实现 ∥ 静默简化 ∥ 档漂移 ∥ 超清单）全 0；5 条 🔵 观察 |
| 1 | 内部代码评审（advisor） | **VERDICT: pass**——🔴 0 ∥ 🟡 4（全 report-only）∥ 🔵 5 |

**fix round（1 轮 · 自审发现）**：审计 🔵 措辞项当轮修两处——`heap-watch.mjs` 头注「关 ⇒ 全静默」⇒「关 ⇒ 零采样 ∕ 零快照 ∕ 零现场，唯运行期过渡行照记」（事实准确化）；`main.mjs` 读抛告警句「stays disabled」⇒「disabled」（on→读抛过渡下亦确）。修后复跑 13/13 ∥ 12/12 全绿。advisor 轮后 **0 必改项**（零追加修正轮）。

**advisor 响应表（9 条全收）**：① heap-watch 315 越线——设计 §四 `:107` 已登记（消解预案在册），report-only 零动作；② cmd-config 488 越线——CLI-DEBT A6 在册（终值待收口回填），report-only；③ config 433 越线——预存（本批 +2），登记建议随收口轮，report-only；④ 批内件落位（设计落点 `docs/batches/` vs 交付 tmp）——**父侧收位轮**（本表 5.1 行 + 披露；护栏所致、先例同法，非缺陷）；⑤ `node --check` 四/五口径——本表如实记「五档实检」，§四 原文「四」为设计笔误（收口轮可收正）；⑥ 行数预估漂移——5.1 实读列为终值（315 ∥ 203 ∥ 488），PROJECT.md 随动轮按此落；⑦ §5 空——本段即填；⑧ 源扫腿对格式敏感（`:182` 正则 ∥ `:285` ∥ 240 字符窗）——设计 §五 A1 已登记「源扫形」在先，report-only；⑨ 过渡行与武装态解耦（`armed=false` 亦记过渡行）——件头已如实登记 + 设计 §三.1 跨键口径成文，文案不动（T7 逐字锁），report-only。

**审计 🔵 五条处置**：D1（`thincoder-cli/src/crash-reports.mjs` 注释仍作「默认开」——**清单外**，父侧裁：形参缺省 `= true` 有意保留、生产调用点恒显式传入 ⇒ 无功能缺口）∥ D2（CLI-DEBT 终值回填——收口轮）∥ D3（`API-CONTRACT.md` 生成区 `--check`——收口轮）∥ D4（§5 空——本段即填）∥ D5（措辞——当轮修）。

**披露（未做 ∥ 后置）**：A5 真机腿（父侧择窗）∥ A6 行宽机检（父侧）∥ 批内件物理收位（父侧——跨批护栏）∥ `API-CONTRACT.md` 生成区 `--check`（收口轮）∥ CLI-DEBT 终值回填（收口轮）∥ `docs/desktop/design/PROJECT.md` KD-53 值列随动（在飞域后置）∥ CHANGELOG（发版轮，§八 `:155`）。

### 5.4 fix round 2（父侧裁定 · 审计 D1 注释收正 · eng-coder · 2026-09-30）

**承**：§5.3 审计 D1（`thincoder-cli/src/crash-reports.mjs` 注释仍作「默认开」口径——清单外注；父侧裁定 = 修，点修 1 项——不做全量探索）。

**改动（注释面三处口径收正——行为面零改 ∥ 形参缺省勿动）**：

| # | 落点 | 收正（前 ⇒ 后） |
|---|---|---|
| 1 | `thincoder-cli/src/crash-reports.mjs:11-12`（头注 F3①） | 「默认开、配置键 `diagnostics.heapSnapshot` 可关」⇒「默认关、取 `true` 才武装（fail-closed；bin 读键后经 `heapSnapshot` 显式传入）」 |
| 2 | 同档 `:73`（JSDoc） | 「默认开——全路径单源」⇒「默认关——fail-closed，显式 `true` 才武装；全路径单源」 |
| 3 | 同档 `:76`（`opts.heapSnapshot` JSDoc） | 「默认开」⇒「配置默认关、显式 `true` 才武装——fail-closed；形参缺省 = 内部约定，生产调用点恒显式传值」 |

**读回证据（D6——实读原样）**：

- `:11-12` = 「"谁在持内存"；全路径单源，默认关、配置键 `diagnostics.heapSnapshot` 取 `true` 才武装 / （fail-closed；bin 入口读键后经 `heapSnapshot` 参数显式传入——F3②）。」
- `:73` = 「F3①：同点武装近堆上限堆快照（默认关——fail-closed，显式 `true` 才武装；全路径单源；开关 = bin 入口读配置键后经 `heapSnapshot` 传入）。」
- `:76` = 「快照武装开关（bin 入口经配置键判定后显式传入；配置默认关、显式 `true` 才武装——fail-closed；形参缺省 = 内部约定，生产调用点恒显式传值）」

**验证**：`node --check thincoder-cli/src/crash-reports.mjs` = exit 0（零输出——本席显式复跑取回）；`git diff` 该档 = 仅 `:11-12 ∥ :73 ∥ :76` 注释行（零逻辑差异——签名 `:79 heapSnapshot = true` 原样在场）；残留复扫「默认开 ∥ 可关」= 零命中；本档零测试面（批内件对模块零引用——唯一 `crash-reports` 命中 = 场景目录名，实读核）。

**审计与代码评审轮次（终态 = clean）**：

| 轮 | 面 | 结果 |
|---|---|---|
| 1 | 内部偏离审计（explore · 点修范围） | **CLEAN**——四类偏差全 0；三处对需求 F3②(`:37`) ∥ 设计 §3.2(`:78`) ∥ bin `:60` 逐点一致；形参缺省保留无未解释矛盾 |
| 1 | 内部代码评审（advisor · 点修范围） | **VERDICT: pass**——🔴 0 ∥ 🟡 0 ∥ 🔵 2（均 report-only） |

**fix round（评审后追加修正轮）= 0**——两 🔵 均 report-only、与父侧限域（三处 ∥ 形参缺省勿动）不扰 ⇒ 零追加轮（沿 §5.3 先例）。

**advisor 响应表（5 项全收）**：

| # | 项 | 处置 |
|---|---|---|
| R1 | 🔵 `:76` 未明写形参缺省值真值（`true`） | 收登记——零动作（父侧「形参缺省 = 内部约定」口径为界；追加明写越本轮限域，留父侧另裁） |
| R2 | 🔵 `:71` 存量短语「缩编程期窗口」语句不通（非本轮三处限域） | 收登记——零动作（存量措辞；父侧另裁） |
| R3 | 清单外注：`thincoder-cli/src/heap-watch.mjs:12`「与 F3① 同约定」在默认翻转后已反（对设计 `:125` 两键默认相反） | 本席实读复核在案（原文在场）——**转呈父侧路由**（同机制口径漂移、未被 D1 覆盖面收录；候选点修；本舱零触） |
| R4 | 清单外注：设计档 `docs/cli/design/CRASH-REPORTS.md:34` 引例 `test/fixtures/r25-oom.mjs` 树内不存在（glob 零命中；行尾自注「迁移期引文——档已删」） | 本席实读复核在案——转呈父侧路由（本舱零触） |
| R5 | 登记（非缺陷）：param 级未传参调用仍武装（fail-open）——父侧裁定保留 | 零动作（按声明不复提） |

**决策透明表（本舱判断点）**：

| # | 判断点 | 取值 | 理由 |
|---|---|---|---|
| 1 | 评审后追加修正轮 | 0 轮 | 两 🔵 均 report-only；R3/R4 越限域 ⇒ 零动作/转呈——收敛不扩散 |
| 2 | 批内件复跑 | 未跑 | 变更面 = 纯注释、本档零测试面；验收判据 = node --check ∥ diff（已全绿） |
| 3 | 清单外注（R3/R4） | 转呈不触 | 范围外零涉——父侧路由 |
| 4 | §5 状态行 | 随动收正（含 §5.4 指针） | 本段状态单源随动 |

**披露（本舱）**：① 追加修正轮 0 ∥ 零越限域（五源档 ∥ 文档 ∥ 其余任何文件零触）；② advisor 回执附机械引用核对块 1 条未解析（`thincoder-cli/src/crash-reports.mjs:76`——按 workspace 根解析路径不可读，系解析基差异；内容本席已实读复核、无实质出入）；③ 审计 AC3 面（diff）由本席 git 证据承载（审计装配无 git 工具——其自披露在案）。

### 5.5 fix round 3（父侧裁定 · R3 转呈注释收正 · eng-coder · 2026-09-30）

**承**：父侧派单口径照录 =「audit fix round 2」——承 §5.4 R3 转呈（`thincoder-cli/src/heap-watch.mjs:12`「与 F3① 同约定」随本批快照默认翻转已反——对设计 `:125` 两键默认相反）+ 父侧全树扫核（「默认开」失实仅此一处）；裁定 = 修、点修 1 项、不做全量探索。档内 fix 轮序列 = 1（§5.3）∥ 2（§5.4）⇒ 本段顺延记 3。

**改动（单行注释 ∥ 行为面零改 ∥ 行数不变）**：

| # | 落点 | 收正（前 ⇒ 后） |
|---|---|---|
| 1 | `thincoder-cli/src/heap-watch.mjs:12`（头注开关句） | 「默认开——与 F3① 同约定」⇒「默认开——判定形 `!== false`，与 F3 快照面默认相反〔快照默认关〕」（镜像设计 `docs/cli/design/CRASH-REPORTS.md:125` 定稿口径） |

**读回证据（D6——实读原样）**：

- `:12` = 「 * 开关：配置键 `diagnostics.heapWatch`（默认开——判定形 `!== false`，与 F3 快照面默认相反〔快照默认关〕）——bin 入口读键后经」

**验证**：`node --check thincoder-cli/src/heap-watch.mjs` = exit 0（零输出——本席实跑取回）；`git diff` 该档 = 仅 `:12` 一行注释（+1/−1——80 行不变）；对照面逐点核 = 设计 `:125` ∥ 需求 F3② `:37` ∥ F4② `:47` ∥ `thincoder-cli/bin/thincoder.mjs:60`/`:67` ∥ `thincoder-core/config.mjs:92`（`diagnostics: { heapWatch: true, heapSnapshot: false }`——本席实读）。

**审计与代码评审轮次（终态 = clean）**：

| 轮 | 面 | 结果 |
|---|---|---|
| 1 | 内部偏离审计（explore · 点修范围 · 只读） | **CLEAN**——四类偏差全 0；:12 收正 ∥ 逻辑零触 ∥ live 面零残留逐点复核；4 观察（均非偏差） |
| 1 | 内部代码评审（advisor · 点修范围） | **VERDICT: pass**——🔴 0 ∥ 🟡 0 ∥ 🔵 1（存量悬垂注——report-only） |

**fix round（评审后追加修正轮）= 0**——两评审零 must-fix ⇒ 零追加轮（收敛）。

**审计观察处置（4 条）**：① diff 面限制披露 → 本席 git 证据承载（§5.4 先例）；② `_archive` 冻结档旧措辞 → 零动作（冻结面不回改）；③ 头注 `§8.3` 存量锚观察 → 与 advisor ① 同项，转呈父侧；④ 记录面 pending → 本段即填（§6 = 父侧）。

**advisor 响应表（1 条全收）**：

| # | 项 | 处置 |
|---|---|---|
| ① | 🔵 存量悬垂注：头注 `:2`/`:8`/`:21`/`:31`/`:62` 锚 `CRASH-REPORTS.md §8`/`§8.3`（活档 `docs/cli/design/CRASH-REPORTS.md` 仅 §1–§6——现址 = §4/§4.3；`D-HW2`/`D-HW5` 仅存 `_archive` 版 `:250`） | 收登记——**零动作**（存量 ∥ 非本轮清单 ∥ advisor 建议亦为「父侧路由」）；转呈父侧留痕 |

**决策透明表（本舱判断点）**：

| # | 判断点 | 取值 | 理由 |
|---|---|---|---|
| 1 | 收正句措辞 | 「默认开——判定形 `!== false`，与 F3 快照面默认相反〔快照默认关〕」 | 镜像设计 `:125` 定稿句 ∥ 父侧派单给定语义方向（保留「默认开」真值、替换失实从句；引称「F3」与原句「F3①」同族条目号） |
| 2 | 评审后追加修正轮 | 0 轮 | 两评审零 must-fix；🔵 系存量、越本轮限域 ⇒ 零动作/转呈——收敛不扩散 |
| 3 | 批内件复跑 | 未跑 | 变更面 = 纯注释、本档零测试面；验收判据 = read-back ∥ node --check ∥ git diff（已全绿） |
| 4 | 清单外注（① §8.3 锚） | 转呈不触 | 范围外零涉——父侧路由 |

**披露（本舱）**：① 追加修正轮 0 ∥ 零越限域（只改一行注释；其余档 ∥ 文档 ∥ 范围外零触）；② advisor 回执附机械引用核对块 3 条未解析（`heap-watch.mjs:12` ∥ `config.mjs:92` ×2——「file unreadable」，系解析基差异、与 §5.4 披露② 同源；内容本席已实读复核、无实质出入）；③ 审计 ∥ 评审 diff 面由本席 git 证据承载（两装配均无 git 工具——各自披露在案）。

### 5.6 追加（收尾核 · 关联回归复跑——转呈父侧 · 2026-09-30）

**事由**：收尾核中对该模块面（CLI `heap-watch.mjs` 全链路）做一道定向回归——复跑前批归档件（**非本批件**；§5.5 决策表 #3「批内件复跑 = 未跑」指本批 09-30 件，不受影响）：

`node --test docs/batches/2026-09-29-core-env-residuals.test.mjs`（仓根执行——沿该件头注自述的复跑形态）⇒ **tests 6 ∥ pass 5 ∥ fail 1**。

| case | 期望 | 实测 | 判 |
|---|---|---|---|
| 腿一 · 缺省（无 config 文件） | interval ≥1 ∥ snapshot ≥1 | ≥1（判过）∥ **0** | ✖ snapshot |
| 腿一 · 全关 | 0 ∥ 0 | 0 ∥ 0 | ✓ |
| 腿一 · 独关 watch | 0 ∥ ≥1 | 0 ∥ 1 | ✓ |
| 腿一 · 独关 snapshot | ≥1 ∥ 0 | 1 ∥ 0 | ✓ |
| 腿一负控（探针未载） | 计数缺失 | 判过 | ✓ |
| 腿二 · 零参真 spawn | exit 1 ∥ tee ∥ 加载行 | 判过 | ✓ |

**根因（证据在盘）**：09-29 件 `:116` = `{ state: "缺省（无 config 文件）", diagnostics: null, interval: 1, snapshot: 1 },`——该 case 期望 **snapshot ≥1 = 快照默认开的旧契约**；本批（09-30）默认翻转（`thincoder-core/config.mjs:92` `heapSnapshot: false` ∥ bin `=== true` 判定）⇒ 缺省态快照臂零装（实测 0）——即 **本批契约变更使前批归档件 1 case 失效**（另 3 case 两键皆显式注入 ⇒ 不受影响，实读核）。**非本舱改动所致**（本轮 = 纯注释、零行为面）；该红自本批实施轮落地翻转即在场——实施轮 §5.1 复跑面未含此件。

**边界（本舱零动作）**：属本轮限域（其余档零触 ∥ 范围外零涉）外——**转呈父侧裁**。候选处置（供裁）：① 随新契约更新 09-29 件「缺省」case 期望（snapshot `1 ⇒ 0`——改他批归档件）；② 按「批内件归档 ∥ 契约随批」口径于本批收口（§6）登记「09-29 件 1 case 被本批取代——复跑红属预期」；③ 挂台账（与 #439「回迁 ∕ 常驻化去向」同轮——测试树重建面）。

**对本段（§5.5）验收零影响**——定点 = 注释行；本节 = 定向回归发现的关联事实，如实登记不静默。

### 5.7 fix round 4（承 §5.6 转呈 · 前批归档件契约失效收正 · eng-coder · 2026-09-30）

**承**：父侧派单口径照录 =「audit fix round 3——前批归档件契约失效收正（父侧裁 = 修，点修 1 项）」——承 §5.6 转呈（09-29 件「缺省」case 期望 = 快照默认开旧契约；本批翻转后必红）。档内 fix 轮序列（1 §5.3 ∥ 2 §5.4 ∥ 3 §5.5）顺延 = **4**；派单序号「3」= 父侧计数口径（并存照录，不互校）。

**改动（点修 1 项 · 两行）**：

| # | 落点 | 收正（前 ⇒ 后） |
|---|---|---|
| 1 | `docs/batches/2026-09-29-core-env-residuals.test.mjs:116`（MATRIX 首项） | `snapshot: 1` ⇒ `snapshot: 0`（`interval: 1` **保持**——`heapWatch` 仍默认开，零改） |
| 2 | 同档 `:116` 上方（新行） | 取代注一行：「取代注（用例退场登记）：缺省快照面 2026-09-30 采集收网批翻转默认关——旧契约期望废止，见 `docs/batches/2026-09-30-heap-snapshot-switch.md` §2」 |

**落位形态（跨批护栏 ⇒ 暂存；收位 = 父侧）**：直写 `docs/batches/2026-09-29-core-env-residuals.test.mjs` 被跨批护栏拒（回执照录：「cross-batch batch-record write…Write only your own bound record…the parent agent handles other batch records」）⇒ 沿 §5.1 先例暂存 **`.thincoder/tmp/2026-09-29-core-env-residuals.test.mjs`**（= 原件 + 两行点修；逐行 hash 比对：除该两行外与原件全同——原件 160 行 ⇒ 暂存 161 行，净 +1）。**收位（暂存件同名覆盖回 `docs/batches/`）依护栏归父侧**——收位后按验收原命令复跑即得终验读数；本舱已发非阻断通报（notify_parent）。

**读回证据（D6——实读原样）**：

- 暂存件 `:116` = 「  // 取代注（用例退场登记）：缺省快照面 2026-09-30 采集收网批翻转默认关——旧契约期望废止，见 `docs/batches/2026-09-30-heap-snapshot-switch.md` §2」
- 暂存件 `:117` = 「  { state: "缺省（无 config 文件）", diagnostics: null, interval: 1, snapshot: 0 },」
- `git diff --no-index`（原件 ↔ 暂存件）= 恰 `+1 注释行` ∧ `snapshot: 1 ⇒ 0`（余行零差）。

**验证**：基线（改前）复跑 `node --test docs/batches/2026-09-29-core-env-residuals.test.mjs`（cwd = 仓根）= **6 tests ∥ 5 pass ∥ 1 fail**（fail 逐字 =「缺省（无 config 文件）：snapshot 计数 ≥ 1（实测 0）」——前提证实）；暂存位复跑（同命令形态）= **6 pass ∥ 0 fail**；读数行：缺省 `interval=1 · snapshot=0` ∥ 全关 `0 · 0` ∥ 独关 watch `0 · 1` ∥ 独关 snapshot `1 · 0` ∥ 腿二 exit=1 判过。`node --check` 暂存件 = OK。口径对源三处实读：`thincoder-core/config.mjs:92`（`heapSnapshot: false`）∥ 需求 `docs/cli/requirements/CRASH-REPORTS.md:37` ∥ 设计 `docs/cli/design/CRASH-REPORTS.md:78`。

**审计与代码评审轮次（终态 = clean）**：

| 轮 | 面 | 结果 |
|---|---|---|
| 1 | 内部偏离审计（explore · 点修范围 · 只读） | **CLEAN**——四类偏差全 0（逐行 hash：差异恰两行）；4 观察（均非偏差） |
| 1 | 内部代码评审（advisor · 点修范围） | **VERDICT: pass**——🔴 0 ∥ 🟡 1（收位协调项——明示非必改、不阻断）∥ 🔵 3（全 report-only） |

**fix round（评审后追加修正轮）= 0**——零 must-fix；🟡 系父侧收位协调项、🔵 均既有/限域外 ⇒ 零追加轮（收敛）。

**审计观察处置（4 条）**：① 审计无执行面（6/6 未独立复算）→ 本席执行证据承载（两跑实读数）；② 基线红自洽 → 证实；③ bin 坐标批档内不一致（§2 三.2 记 `:59`、实读判定形 = `:60`——本段引用一律以实读 `:60` 为准）→ 转呈父侧/设计面（本舱零触）；④ 尺寸差 186B = 注释行字节数 → 佐证收存。

**advisor 响应表（4 条全收）**：

| # | 项 | 处置 |
|---|---|---|
| R1 | 🟡 收位协调项（归档位未收位前仍红） | 收登记——零动作（收位依护栏归父侧；本舱已通报） |
| R2 | 🔵 件头锚漂移（`bin` `:51-54` ∥ `:59` ∥ `:66` ⇒ 现盘 `:52-55` ∥ `:60` ∥ `:67`——本批 bin 178⇒179 所致） | 收登记——零动作（件头机制描述 = 派单明令零触限域；转呈父侧裁：随收位轮刷新 ∥ 登记批时坐标） |
| R3 | 🔵 取代注引证/措辞（未并引 §5.6；「用例退场登记」措辞） | 收登记——零动作（注文 = 派单逐字给定；收紧越限域；转呈父侧） |
| R4 | 🔵 开态判据宽于需求判定句（≥1 vs 恰一次 ∧ 参数 1——既有面） | 收登记——零动作（非本轮引入；转呈父侧裁） |

**决策透明表（本舱判断点）**：

| # | 判断点 | 取值 | 理由 |
|---|---|---|---|
| 1 | 直写被拒后落位形态 | 暂存 `.thincoder/tmp/` 同名件 + 父侧收位 | 护栏回执明示他批记录归父侧；§5.1 先例同法；不绕护栏、不静默 |
| 2 | 取代注文本 | 派单给定句逐字（前缀「取代注（用例退场登记）：」） | 父侧给定内容 + 派单「沿先例形」括注；不另发明 |
| 3 | 复跑位置 | 暂存位（cwd = 仓根） | 该件头注自述「两处均两层深 ⇒ 暂存位与终位同一命令形态」（实读核） |
| 4 | 评审后追加修正轮 | 0 轮 | 零 must-fix；收敛不扩散 |
| 5 | 其余面 | 零触 | 派单明令：其余 case ∥ 腿二 ∥ 负控 ∥ 件头 ∥ 产品码 ∥ 其他档——diff 恰两行实证 |

**披露（本舱）**：① 追加修正轮 0 ∥ 越限域零（改面 = 暂存件两行；产品码 ∥ 其余档零触）；② **验收原命令（`docs/batches/` 路径）的终验读数待父侧收位后取得**——本舱读数 = 暂存位同形命令（6/6 绿）；③ 审计 ∥ 评审装配均无 git/执行面——diff 与复跑由本席证据承载（两装配各自披露在案）；④ 观察③（§2 bin `:59` vs 实读 `:60`）转呈。

## §6 验证与收口（父代理）

### 6.1 终验读数

- 批内件（终位复跑）：`docs/batches/2026-09-30-heap-snapshot-switch.test.mjs` = **13 tests ∥ 13 pass ∥ 0 fail**（T1–T9 ∥ A2×2 ∥ A3 ∥ A4）。
- 前批件（收位后终位复跑）：`docs/batches/2026-09-29-core-env-residuals.test.mjs` = **6 ∥ 6 ∥ 0**（含 §5.6 契约失效行收正）。
- 同模块回归（前情批件 `2026-09-30-desktop-heap-freeze.test.mjs`）= 12/12（实施舱读数）。
- **A5 真机腿（隔离实例 · 6/6）**：探针 = `.thincoder/tmp/heap-snapshot-switch-probe.mjs`（tmp 家隔离 ∥ 零触用户活动实例）：① 外部写盘关 ⇒ `disabled (runtime)` 行 ✓ ② 外部写盘开 ⇒ `enabled (runtime)` ✓ ③ 源②同进程自写（主进程内 `persistRaw`）⇒ disabled（行计数 2）✓ ④ 冷启默认静默 ✓ ⑤ 冷启后外部开 ⇒ enabled ✓ ⑥ 两轮零快照档 ✓。未覆盖（非安全可构造）：真阈值触发 ∥ 近上限臂真装——机制面由 T1–T9 假源腿承载。
- 机检：`node --check` 五源档 + 收正档全绿；`api-contract --check` = **零漂移**（`--write` 后复检 · 2742 条；diff = 270 档纯行号刷新——积压 + 本批行移，零语义）。
- 微修轮三件（记录面 §5.4–§5.7）：`crash-reports.mjs` 注释三处 ∥ `heap-watch.mjs:12` 注释一处 ∥ 09-29 件契约行一处——`git diff` 均行级（注释/断言），行为面零改；其中两件经父侧收位（跨批护栏所致——同 §5.1 先例）。

### 6.2 D7 结算清单

- 角色表：§1 主 agent ∥ §2 eng-designer ∥ §3 评审子代理（轮次 1 · pass）∥ §4 主 agent（代签）∥ §5 eng-coder ∥ §6 父代理 ✓。
- 状态行：§1 → 已收口（随 close）∥ §2 设计完成 ∥ §5 实施完成。
- 计数：批内件 13 用例 ∥ 评审 🔴0 · 🟡4 · 🔵4 ∥ 微修 3 件 ∥ 台账 #740 → 核销（在途 → 待核销 → 已核销）、#744 在册。
- 指针：档头前情指针解析 ✓；台账指针 ✓；跨批件收位 ✓。
- CHANGELOG = 归发版轮（§八 `:155`）；需求档面已落（§八 `:156`）。
- 前批遗留交叉核对：前情批已收口、其遗留面 = 本批全承 ✓；09-29 件契约面随动 ✓；件头锚漂移 → #744。
- 知情残留（零动作 · 均 in-file 自注或 as-of 面）：注文措辞 ∥ 开态判据宽于需求（in-file 自注在案）∥ `docs/cli/design/CRASH-REPORTS.md:34` 迁移期引文（档已删——行尾自注）∥ 09-29 记录面 as-of 读数不复现（冻结记录零回改）∥ §2 `:59` 为设计时坐标（实施后判定形 = `bin:60`——以 §5/§6 为准）。

### 6.3 父侧直接执行项（打标 · 单提交可 revert）

① `~/.thincoder/config.json` 加 `diagnostics.heapSnapshot:false`（当轮处置）② 存量快照 11 份清理（留最新 1 份案底）③ 需求档 5 处（含变更记录）④ CLI-DEBT A6 终值 = 488 ⑤ `api-contract --write`（生成区）⑥ 两件批内件收位复制 ⑦ 本 §6。

### 6.4 收口结论

全链闭合（设计 → 评审 pass（8 条全收）→ 代签 → 实施（13/13）→ 微修 ×3 → 终验（A5 6/6 ∥ 机检零漂移））——**#740 核销；记录冻结**；收口序 = close → 台账核销 → 提交双推 → token 消费。
