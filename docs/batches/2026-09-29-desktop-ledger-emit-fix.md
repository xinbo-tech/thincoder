# 2026-09-29 · 桌面台账出站修复（sessionResume 缺 await · #600 真机腿闭合）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 21:15 走查（段 11 台账标记不显：「段9有了，段11还是没看见，你要再检查一下」）+ 21:21「修」；父侧根因定位 = sessionResume 缺 await（台账 #666）。
> 台账 = #666（desktop · 归批）。前情 = docs/batches/2026-09-29-desktop-statusline-cli-gap.md §6（已收口 2026-09-29）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

- 用户 2026-09-29 21:15 走查：「现在段9有了，显示是对的了，但是段11还是没看见，你要再检查一下。」——#600 批「真机腿（段 9 ∕ 段 11 目视）」在此捕获 #600 面外断点。
- 21:21：「**修**」——批点燃。

### 1.2 根因（父侧定位 · 2026-09-29 21:2x · 台账 #666）

**断点 = `thincoder-desktop/src/main/ipc.mjs:171-180` `sessionResume()`：**

```js
const receipt = resumeSession(currentCwd())   // resumeSession 已 async（session-actions.mjs:75）——缺 await ⇒ receipt = Promise
if (receipt?.ok === true && …) scheduleSessionGC(receipt.cwd)        // 对 Promise 恒假 ⇒ 死
if (ledgerEmit && receipt?.ok === true && receipt.slot != null) {    // 恒假 ⇒ 死
  void pushLedgerLines({ … })                                        // 永不调起
}
```

⇒ ① **`pushLedgerLines` 永不调起**（台账出站起点——`ev:ledger` 全链零出站；段 11 恒缺；**R8 台账行 ∕ detailLines 同链同死**）② `scheduleSessionGC` 显式点火同死。

**证据链（四段）**：

1. 隔离实例复现（`.thincoder/tmp/probe-statusline-ledger.mjs`）：临时家 + 开项目 ⇒ 段 11 恒缺 ∧ 主进程 `webContents.send` 出站探针 = **零帧**（`sent: []`）；
2. 同条件纯 node 直跑核 `runLedgerScan`（`probe-scan-direct.mjs` + `scan-child.mjs`）= 正常（`RENDER-CALLED` ∧ `state.ledger.marker` 非空）——核面健康；
3. 渲染 ∕ 归约 ∕ 订阅链路逐段读核齐备（`events-slices.mjs:153-160` · `statusline.mjs:84/:195` · `mount-status.mjs:29`）——断点唯一；
4. `git show HEAD:thincoder-desktop/src/main/ipc.mjs` 实读 = **同形无 await**——非本日引入，长期潜伏（async 化时点待考，记录面登记）。

**性质**：接线面回归——R8 接线时 `resumeSession` 尚同步（`receipt.ok` 可判）；其 async 化后此调用点未随动 ⇒ 守卫静默失效。单元件（核面 ∕ 渲染面）全绿拦不住——**#600 真机腿是唯一捕获位，已实逮**。

### 1.3 批面（授权口径）

- ① **修**：`sessionResume` ⇒ `async` + `await`（守卫按真实回执判）——设计轮先核派遣缝（handler 返回值被 RPC 层 await 的现行面，避免改坏回执链）；
- ② **同族排查**：`ipc.mjs` 全部 handler 对 async action 的调用点（同「守卫判在 Promise 上」形——逐一现状 + 处置）；
- ③ **回归用例**（批内件）：能真逮住本类的机检——判据 = 修前形态**红可复现**、修后绿（沿 INPUT-FIXES-SMALL §5.4 判例）；
- ④ **收尾真机复核**（父侧）：段 11 显「台账 7·39」（真实计数）∧ R8 台账行 ∕ 提示面复活——**并闭合 #600 真机腿**（#600 §6 在册「待父侧」）。
- **边界**：主修面 = `ipc.mjs`（若设计判需动其它档，明示理由）；不重开 ∕ 不回改 #600（冻结）；核件（core）零改。

### 1.4 判据与验收

- 机检：批内件修前红 → 修后绿（红 = 缺 await 形态、绿 = 现状形态；脚本化重建）；
- 真机：段 11 `台账 ${pool}·${tech}` 常驻 +（首拍）台账明细行；`sent` 探针含 `ev:ledger`；
- 链：设计 → 评审（用户点）→ 批准（用户签）→ 实施 → 父侧真机复核。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 条目（覆盖）与本批边界

**需求基础** = 本批 §1（缺陷修复批——目标 §1.1 ∕ 根因 §1.2 ∕ 批面 §1.3 ∕ 判据 §1.4 四段齐备；台账 #666 在册）。

| # | 条目 | 批面 |
|---|---|---|
| B1 | `sessionResume` 修法定形（`async` + `await`——两守卫复活：`scheduleSessionGC` ∕ `pushLedgerLines`） | ① |
| B2 | 同族排查表（`ipc.mjs` 全 handler 对 async action 的调用点——现状 + 处置） | ② |
| B3 | 批内回归件（修前红可复现 ∕ 修后绿——`docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs`） | ③ |
| B4 | 真机复核配方（隔离探针 + 用户实机——闭合 #600 真机腿） | ④ |
| B5 | 文档随动判定（零改动 + 逐处依据） | ⑤ |

**不含（边界）**：不重开 ∕ 不回改 #600（冻结）；核件（`thincoder-core`）零改；渲染面设计零改；不建常驻套件；不新增接线纪律规范行（呈上抛①待裁）。

### 2.2 修法定形与派遣缝（实读证据）

**修法（最小两 token，`thincoder-desktop/src/main/ipc.mjs`）**：

- `:171` `function sessionResume()` ⇒ `async function sessionResume()`；
- `:172` `const receipt = resumeSession(currentCwd())` ⇒ `const receipt = await resumeSession(currentCwd())`；
- `:173-179`（两守卫、`void pushLedgerLines` 调用、注释、`return receipt`）**逐字不动**。
- 锚点：`resumeSession` = async（`session-actions.mjs:75-79`）；守卫两处 = `ipc.mjs:174`（GC）∕ `:176-178`（台账出站）。

**派遣缝（为何 `async` + `await` 不改回执形）**：

- 注册面：`ipc-registry.mjs:81-84` —— `ipcMain.handle(channel, (_event, payload) => { …; return handler(payload) })`：**直返 handler 返回值**；Electron `ipcMain.handle` 对 thenable 返回值等待后回复 `invoke`。
- **修前面同为 Promise**：修前 sync `sessionResume` 返回的是未 await 的 `resumeSession` promise ⇒ 注册面所见 = `Promise<信封>`；修后 async 函数同见 `Promise<信封>` ⇒ **渲染端回执零变**（同证 §1.2「渲染端一直收到正确回执」）。
- 先例（同缝在册）：`openProjectChannel`（async，`:127-139`）· `fileOpen`（async，`:243-252`）——均 async 直返、真机链正常。
- `void pushLedgerLines(…)`（`:177`）语义保持：后台面不经回执等待；出站抛自吞（`project-info.mjs:154-155`）。
- 信封本体单源未动（`session-actions.mjs:21-28`）。

### 2.3 同族排查表（`ipc.mjs` 全 handler 对 async action 的调用点）

| 处理体 | 调用面 | callee | 内部同步消费 | 处置 |
|---|---|---|---|---|
| `readConfig`（`:105-110`） | `loadConfigImpl`（默认真核件） | **sync**（`thincoder-core/config.mjs:233`） | 有（`Object.keys`） | 不改 |
| `openProjectChannel`（`:127-139`） | `await openProject(…)` | async | 有——`:134` 守卫（await 后 ✓） | 不改 |
| `sessionList`（`:148-151`） | `listSessions` | **sync**（`sessions.mjs:37`） | 有——解构 `rows` | 不改 |
| `sessionCreate`（`:156`） | `createSession` | **async**（`session-actions.mjs:37`） | **无**（直返） | 不改（结构豁免）——最邻近点：未来若加内部守卫须先 await（同型预防） |
| `sessionSwitch`（`:157`） | `switchSession` | sync（`:47`） | 无（直返） | 不改 |
| `sessionRename`（`:158-162`） | `renameSession` | sync（`:57`） | 有——`:161` 守卫 | 不改 |
| `sessionDelete`（`:164-169`） | `deleteSession` | sync（`:68`） | 有——`:168` 守卫 | 不改 |
| **`sessionResume`（`:171-180`）** | `resumeSession` | **async**（`:75`） | **有——`:174` ∕ `:176` 两守卫（判在 Promise 上）** | **改（本批 B1）** |
| `historyPage`（`:190-195`） | `pageHistory` | sync（`session-slots.mjs:170`） | 有——`:192-194` | 不改 |
| `fileOpen`（`:243-252`） | 编辑器探测 ∕ spawn ∕ `shell.openPath` | async | 有（await 后 ✓） | 不改 |
| 其余 35 处理体（直返类——枚举见下注） | 直返 callee 返回值 | 含 async（示例：`ledgerRead` `project-info.mjs:41` · `pushLedgerLines` `:113`） | **无**（内部零守卫） | 不改（结构豁免：注册面 await） |

**「其余直返类」枚举**（45 − 上表 10 行 = 35 处理体；均内部零守卫 ∕ 直返 ⇒ 结构豁免）：

- 会话 ∕ 回合 ∕ 维护面（11）：`recentProjects` · `msgSend` · `msgInterrupt` · `approvalRespond` · `questionRespond` · `subagentStop` · `sessionPrefs` · `sessionFlags` · `atComplete` · `sessionGc` · `sessionIndex`
- 索引 ∕ 设置面（4）：`indexBuild` · `indexStatusChannel` · `settingsEnvChannel` · `settingsToolsChannel`
- providers 面（8）：`providerListChannel` · `providerSaveChannel` · `providerRemoveChannel` · `providerVerifyChannel` · `providerSetKeyChannel` · `providerDelKeyChannel` · `providerModelsChannel` · `providerSetProxyChannel`
- model ∕ settings 面（3）：`modelListChannel` · `modelCatalogChannel` · `settingsAgentChannel`
- mcp 面（6）：`mcpToolsChannel` · `mcpListChannel` · `mcpSaveChannel` · `mcpRemoveChannel` · `mcpUpdateChannel` · `mcpReconnectChannel`
- 配置 ∕ 台账 ∕ 相位（3）：`configWriteChannel` · `ledgerReadChannel` · `batchStatusChannel`

**结论**：唯一命中 = `sessionResume`；零第二发。顺带核（宿主投影面，非 action 调用点）：`historyPage` 内 `agentHost.flagsOf` = 同步纯读（`agent-host.mjs:211-214`）✓；`scheduleSessionGC` ∕ `pushLedgerLines` 皆为「副作用调用」形（不消费返回值）⇒ 其 async 与否对调用点零影响。

### 2.4 受影响文件与测试面

| 文件 | 现值 | 预计 Δ | 内容 |
|---|---|---|---|
| `thincoder-desktop/src/main/ipc.mjs` | ≈330 行 | **±2 处 token**（行数不变） | B1 修法 |
| `docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs` | 0（新增） | **~110–140** | B3 批内件 |
| 设计档（`docs/desktop/design/**`） | — | **0** | B5 零改动（依据 §2.9） |

行数判据：`ipc.mjs` ≈330（>300 建议 ∕ <500 硬限——#28 已拆注册族；本批零行数增量，无新拆分义务）；新档 ≤300 ✓。集成面零涉（主进程接线修复——无业务流新增）。

测试运行命令（实施轮 ∕ 复核轮）：`node --test docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs`（仓根 `thincoder/`）。

### 2.5 用例表（批内件 B3——修前红可复现 ∕ 修后绿）

**形态**：源码抽取 + `node:vm` 沙箱（真跑产品源文本、注入替身）。理由：`ipc.mjs` 静态 import `electron`（`:39`）⇒ 平 node 不可直导入。
抽取面 = `sessionResume` 函数块（`src.indexOf("function sessionResume(")` + 花括号配平）→ `vm.runInNewContext(fnText + ";sessionResume", { resumeSession, currentCwd, scheduleSessionGC, pushLedgerLines, ledgerEmit })`；断言面 = **行为读数**（替身调用次数 ∕ 入参），非文本扫描（防假绿）。

| 例 | 型 | 输入（替身） | 期望输出 |
|---|---|---|---|
| R1 | 正常 | `resumeSession` ⟶ `{ok:true,reason:null,cwd:"/p",slot:7}`；`post`=spy | `scheduleSessionGC` 恰 1 次（`"/p"`）∧ `pushLedgerLines` 恰 1 次（`{cwd:"/p",key:"7",post}`）∧ 返回 thenable ∧ `await` 值 = 信封（形不变） |
| R2 | 边界（后台面） | `pushLedgerLines` ⟶ **永不 resolve 的 Promise** | handler 返回的 Promise 仍即刻 settle（race 100ms 内）⇒ `void` 语义锁定（若改 await 即红） |
| R3 | 错误径 | `{ok:false,reason:"no-project",cwd:null,slot:null}` | 两 hook 各 0 次 ∧ 信封原样返回 |
| R4 | 边界 | `{ok:true,…,slot:null}` | GC 1 次 ∧ 出站 0 次（`slot != null` 门） |
| R5 | 边界 | `ledgerEmit = null`（未注入） | 出站 0 次 ∧ GC 1 次（GC 不依赖注入面） |
| R6 | 反例（变异牙） | live 源去 await 变异：`"await resumeSession(" → "resumeSession("` | ① 变异必须命中（变异前 ≠ 变异后——未命中即实现未落 await，红）；② 同一断言体在变异源下**必抛**（= 修前形态红，脚本化复现） |

**红→绿闭环**：修前（无 await）⇒ R1–R5 红（守卫死、两 hook 零调）；修后 ⇒ R1–R6 全绿。R6 常驻锁「牙」——防未来假绿。

### 2.6 真机复核配方（父侧执行 · 闭合 #600 真机腿）

**腿 1——隔离探针（复用，零新写）**：`cd thincoder && node .thincoder/tmp/probe-statusline-ledger.mjs`（隔离家 + 临时项目 + 真台账库复制到该项目键位；序 = 开项目 → 12s → dump → 重开项目 → dump + `sent` 探针）。

修后期望读数（判据）：

- `R.sent` 含 `channel:"ev:ledger"` 帧（≥1）——载荷含 `marker`（首拍必携；本场景非空 `{text,warn}`）+ `lines` ∕ `detailLines` 随拍；**修前 = `sent: []`**（§1.2 已录——前后翻转即证）；
- `R.firstDump.segs` ∧ `R.reanchorDump.segs` 各含 `seg:"ledger"`：text 形 = `台账 <pool>·<tech>`（真实计数；参考现值 `7·39`——以探针实读为准）；`title` = 明细行（tooltip 载波）；
- `ledgerNode` 非 null（段 11 节点在场）；
- `mainOut` ∕ `pageLog` 无 `[project-info] ledger emit failed`。

**腿 2——用户实机（父侧 + 用户目视）**：真家启动桌面 → 开项目（`D:\teamcode`）→ 渲染面自动一次 `session:resume`（`IPC.md:229`）⇒ 段 11 现 `台账 <pool>·<tech>` 常驻 ∧ 流内台账行（`[data-ledger-line]`）复活；段 9 同屏复核（#600 真机腿 = 段 9 ∕ 段 11 目视——本批闭合，记 §6）。

**时序注**：首拍 = `setImmediate` 起 + 明细判活探束（TTL 缓存）⇒ 数秒可观；周期拍 120s 不在探针窗（重锚强制二次首拍——探针已内置）。

### 2.7 验收对照（B1–B5 回指批面 ①–⑤）

| AC | 条目 | 判定方式 |
|---|---|---|
| AC-1 | B1 | 批内件 R1/R3/R4/R5 绿（修后）+ `node --check` ipc.mjs OK；§2.2 两 token 落形 |
| AC-2 | B2 | §2.3 表逐点（实读证据；唯一命中 = `sessionResume`） |
| AC-3 | B3 | 修前跑件录红（R1–R5 红 ∕ R6 变异腿脚本复现）→ 修后 R1–R6 全绿 |
| AC-4 | B4 | §2.6 两腿读数（探针 `sent` 含 `ev:ledger` + 段 11 在场；实机目视）；#600 闭合记 §6 |
| AC-5 | B5 | §2.9 零改动依据逐处；行数判据（§2.4） |

### 2.8 关键决策

- **KD-1 修法定形 = 最小两 token**（`async` + `await`；守卫 ∕ 注释 ∕ 返回零动）——依据 = §2.2 派遣缝实读 + §2.3 同族（无结构改动理由）。
- **KD-2 注册面零改**（不给 registry 加统一 await 包装）——现状直返 + Electron await 已正确（先例两档在册）；包装 = 无因扩面。被否。
- **KD-3 `void pushLedgerLines` 保持**（不 await）——后台面不经回执等待（R2 用例锁）；await 会拖慢 `session:resume` 回执（首拍含明细判活探束）。被否：改为 await。
- **KD-4 回归件形态 = 源码抽取 + vm 行为面**——真跑产品源文本（避文本断言假绿 ∕ 避 electron 实例重面）。被否：纯文本扫描 ∕ electron 实例 ∕ 常驻套件。
- **KD-5 批内件（不建常驻套件）**——沿测试纪律：单元件随批档；集成面零涉。
- **KD-6 文档随动 = 零改动**（依据 §2.9）。

### 2.9 文档随动判定（零改动 · 逐处）

- `ipc.mjs:28-29` 头注（KD-38 接线自述）：「`pushLedgerLines` 挂 `session:resume` 成功径」修后仍真（接线未变、恢复生效）⇒ 不动；
- `IPC.md` §1 `ev:ledger` 行（`:28`）：载荷 ∕ 触发（启动拍 + 周期拍）∕ 消费描述与修后现实一致 ⇒ 不动；
- `IPC.md` §2 会话族注项 5（`:167-172`）：信封 ∕ reason 分档 ∕ fail-loud 面不含 handler 同步性断言 ⇒ 不动；
- `PROJECT.md` KD-38（`:78`）· D10（`:847`——父侧收正，原引 `:816`）：「开项目成功链」指向与修后现实一致 ⇒ 不动。
- **结论：设计档零改动**（本批设计住 §2；机制面描述无失真）。

### 2.10 上抛项

- ①【可选·低优先】接线纪律句（「接线面 async 化 ⇒ 对回执的同步消费点须随动 await；判在 Promise 上恒假」）拟落点 = `ipc-registry.mjs` 档头纪律列。本批**不落**（维持零改动口径）——呈主 agent 裁（并入后续文档批 ∕ 否）。
- ②【登记】`resumeSession` async 化时点考古（§1.2 ③「长期潜伏」在册）——本批不追。
- ③【非阻断】`createSession`（async）面：现形无内部消费（有据不改）；若后续批在该 handler 增内部守卫，须先 await——同型预防点已在 §2.3 表标注。

### 2.11 修正轮记录（评审轮 1）

承 §3 轮次 1（🔴 0 · 🟡 2 · 🔵 4——全部父侧裁定接受）：本节逐号收载修正**现行值**（早前小节文字与本节冲突处，以本节为准）。修法本体（§2.2 两 token）零动；不触产品码；不 re-run 评审。

**1 → 抽取锚收正（B3 抽取面现行值）**：锚 = `src.indexOf("function sessionResume(")` + **前置回扫**——命中点前缀 `"async "` ⇒ 抽得文本前置补 `"async "`（修后态）；无前缀 ⇒ 原样（修前 ∕ 变异态）——两态块皆可编译（`await` 合法性随 `async` 前缀落位；修前真形块内无 `await` 亦编译）。
实核（落笔前内存推演）：该串盘面唯一命中 1 处（`ipc.mjs:171`）；修前真形 ∕ 变异态 ∕ 修后态三态抽取块皆可 `node:vm` 编译并跑断言。落点 = 本节 ∕ 原 §2.5 抽取面句（`:128`）。

**2 → 红集收正（修前 ∕ 变异源）**：红集 = **R1 ∕ R4 ∕ R5**（守卫死 ⇒ `scheduleSessionGC` ∕ `pushLedgerLines` 计数断言抛）；**R2 ∕ R3 ∕ R7 = 两态皆绿语义锁**（结算时序 ∕ 失败信封 ∕ 拒绝直传——不依赖守卫）。R6 限定 = **守卫敏感断言体**（R1 ∕ R4 ∕ R5 型）在变异源下必抛——非全台七例。
红录 = 变异函数（`"await resumeSession(" → "resumeSession("`）施加于实读源 ⇒ 同台断言（R6 即该腿常驻；未命中 ⇒ 实现未落 await，红）。替身前置：`resumeSession` 须 Promise 返回（`async` 形——镜像真签名 `session-actions.mjs:75`）——守卫敏感性的前提。
落点 = 本节 ∕ 原 §2.5 红→绿闭环句（`:139`）· R6 行（`:137`）· AC-3（`:162`）。

**3 → 坐标收正**：《readConfig 行》（§2.3 表）sync 依据坐标 = `thincoder-core/config.mjs:234`（`:233` 为注释行；`:234` = `export function loadConfig()`——非 async 声明，判据成立）。IPC.md 同符号坐标（IPC.md `:238`）一并收正 ⇒ `:234`。
落点 = 本节 ∕ 原 §2.3 表 `readConfig` 行（`:90`）· IPC.md `:238`（本轮落）。

**4 → IPC.md 档头计数收正**：IPC.md `:3` 分发实现计数 **308 ⇒ 330**（落笔前实读 = `ipc.mjs` 330 行；本批零行数增量）——收正后档头 ∕ §2.4 ∕ 盘面三处同值。
落点 = IPC.md `:3`（本轮落）。

**5 → R2 判据收正（任务刻竞速）**：R2 现行判定 = handler 返回的 Promise 于 `setImmediate` 哨兵前 settle（任务刻竞速——微任务 ∕ 同拍内；无墙钟计时器、测试零尾随）。正确实现（`void` 语义）⇒ settle 胜；若改 `await pushLedgerLines`（永不 settle）⇒ 哨兵先至即红。
落点 = 本节 ∕ 原 §2.5 R2 行（`:133`）。

**6 → 用例表增 R7（reject 径）**：R7 = 替身 `resumeSession` ⟶ reject（`Error`）⇒ handler 返回 Promise 拒绝**同因直传（不吞）** ∧ 两 hook 0 次；**两态皆绿语义锁**（fail-loud——与会话族注项 5 同面）。§2.4 测试面行数预期随动 = **~130–160**（六例 110–140 + R7 增量）。
落点 = 本节 ∕ 原 §2.5 用例表（`:130-137`）· §2.4 表（`:118`）。

**AC 同拍（现行值）**：AC-3 = 修前跑件录红（红集 R1 ∕ R4 ∕ R5；R2 ∕ R3 ∕ R7 标两态皆绿语义锁）+ R6 变异腿（守卫敏感断言体必抛）→ 修后 **R1–R7 全绿**。落点 = 本节 ∕ 原 AC-3（`:162`）。

**文档面（随修落点）**：§2.9 口径随动 = **修法零文档面（维持——§2.9 原判定面本轮零改）+ 两处评审随修**：① IPC.md `:3` 档头计数（308 ⇒ 330）；② IPC.md `:238` `loadConfig` 坐标（`:228` ⇒ `:234`）。两处已随本轮落盘（IPC.md 变更记录 `:423`）。

**补记（并发面 · 落笔后复核）**：本节落笔后复核发现 `ipc.mjs` 被**本批外写入**触及（mtime 2026-09-29 21:42 本地；本轮修复动作未写该档）——首读 330 行 → 复核 **331 行**；+1 行落于 `msg:interrupt` 注释族 ⇒ 该点之后行号 +1（`file:open` 处理体现盘 = **`:244-253`**，原引 `:243-252`；本批修法面 `:171-179` 区不受影响）。
复核读数：`function sessionResume(` 唯一命中 1（`:171`）；`async` ∕ `await` 两计数仍 0（修前形态未变）。IPC.md 档头 ∕ 变更行已按**最新实读 331** 收正（#4 项内「330」为落笔前读数）。**§5 实施前请再实读复核一次行数 ∕ 锚点**（并发线在飞；本批零行数增量判据不变）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（轮次 1）· 对象 = 批档 §2 设计（待评审）· 评审面 = 批档全文 + `docs/desktop/design/IPC.md` 全文 + 代码缝自读（`ipc.mjs` ∕ `ipc-registry.mjs` ∕ `session-actions.mjs` ∕ `project-info.mjs` ∕ `projects.mjs` ∕ 锚点抽读）。

**核证成立项（无发现）**：§2.2 修法两 token 与盘面逐字一致（`ipc.mjs:171` ∕ `:172`；`:173-179` 确为两守卫 ∕ 注释 ∕ `void` 调用 ∕ `return`）；`resumeSession` 确为 async（`session-actions.mjs:75`）；派遣缝论断成立（`ipc-registry.mjs:81-84` 直返 handler 返回值；修前 ∕ 修后注册面同见 `Promise<信封>`）；§2.3 同族排查 45 处理体逐点复核（10 行 + 35 枚举 = 45 ✓；`sessionResume` 外全部为 sync 消费或直返豁免，`recentProjects` 两 callee 亦 sync——`projects.mjs:25` ∕ `:74`）；无第二调用方（全仓 `sessionResume` 仅 `ipc-registry.mjs:37`）；现存用例零受影响（`docs/batches/*.test.mjs` 对 `ipc.mjs` 的存量断言 = 处理体名在场 ∕ 档头「四十五项」——两 token 修法不触）；§2.6 探针在盘且字段名逐一对上（`R.firstDump` ∕ `R.reanchorDump` ∕ `R.sent` ∕ `ledgerNode` ∕ `mainOut` ∕ `pageLog`）；IPC.md:229「自动一次 session:resume」引证正确；`[project-info] ledger emit failed` 期望串在盘（`project-info.mjs:154`）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 清晰性 ∕ 可行性（B3 抽取面） | 🟡 | §2.5 抽取锚 `src.indexOf("function sessionResume(")`（批档:128）与 §2.2 修法目标形（`:171` ⇒ `async function sessionResume()`，批档:73）自抵触——修后函数以 `async ` 起，该锚抽得的文本不含 `async`，而块内含 `await` ⇒ `vm.runInNewContext` 编译抛 SyntaxError（await 仅合法于 async 函数体 ∕ 模块顶层）⇒ AC-3「修后 R1–R6 全绿」按字面不可达 | 锚随修后形状（改 `"async function sessionResume("`，或抽得后回扫补 `async` 前缀），使抽取块在修前 ∕ 修后两态皆可编译 |
| 2 | 验收判据（修前红集） | 🟡 | §2.5:139 与 AC-3（§2.7:162）称「修前（无 await）⇒ R1–R5 红」；按 R1 判读式（返回 thenable + `await` 取值）实推，修前仅 R1 ∕ R4 ∕ R5 红（守卫死 ⇒ 期望 hook 调用 0 次）；**R2 ∕ R3 在守卫死形态下照样成立 ⇒ 绿**；R6「同一断言体在变异源下必抛」（:137）同只对守卫敏感断言体成立 | 修前红集收为 R1 ∕ R4 ∕ R5（R2 ∕ R3 标「两态皆绿的语义锁」）；AC-3 录红口径同拍；R6 加限定「断言体 = 守卫敏感件」 |
| 3 | 坐标漂移 | 🔵 | §2.3 表 `readConfig` 行引 `thincoder-core/config.mjs:233` 为 `loadConfig` sync 依据——盘面声明在 `:234`（`:233` 为注释行）；IPC.md §2 设置族注项 1（IPC.md:238）同符号引 `:228`（该行实为上一函数 `}`）——同一符号两处坐标未对盘 | 两处坐标收正至 `thincoder-core/config.mjs:234`；sync 判据本身成立（`:234-241` 实读无 await） |
| 4 | 文档状态（数值漂移） | 🔵 | IPC.md 档头（IPC.md:3）记 `ipc.mjs`（**308**），盘面实读 ≈330 行（与 §2.4「≈330」一致）——档头计数滞后 ~22 行（先于本批既已滞后；本批零行数增量） | 档头计数收正至盘面实读（≈330），或在残留登记中挂账；本批零改口径不因此失效 |
| 5 | 测试确定性 | 🔵 | R2（批档:133）以「race 100ms 内 settle」判 `void` 语义（墙钟判据）——正确实现下 settle 为微任务级，仅「挂起」方向依赖计时器 | 改任务刻竞速（`setImmediate` ∕ 微任务）作确定性判据；计时器路径须清，防测试尾随 |
| 6 | 覆盖边界（可选） | 🔵 | B3 六例覆盖守卫矩阵 ∕ 失败信封（R3），未覆盖 `resumeSession` **抛错径**（reject ⇒ handler 拒绝直传——会话族注项 5 fail-loud 面，IPC.md:172） | 可选加一例（reject 替身 ⇒ handler 拒绝 ∕ 不吞）；非本类必需，属同缝纪律锁 |

**外范围备注（无严重度）**：§2.9 引 `PROJECT.md:78`（KD-38）∕ `:816`（D10）两处零改依据未在评审面内——**unverified**，需硬证据时另行取样核对（`PROJECT.md` 不在本轮 Documents to Review）；§1.2 证据 4 的 `git show HEAD:…` 面本轮无 git 可核（盘面现状 `ipc.mjs:172` 无 await 与根因一致）。

**评审面限制**：本轮无 document map ∕ 无项目标准档宣告 ⇒ 文档归属判据降级（按 Project Guide 粗判：本批设计住批档 §2，未新建档 ∕ 未重述既有段 ⇒ 归属面判合规）。

VERDICT: pass
计数：🔴 0 ∕ 🟡 2 ∕ 🔵 4

## §4 用户批准（主 agent）

### 4.1 批准（父侧代签 · 2026-09-29 21:50）

- **授权基础**：用户 2026-09-29 21:38「后续你自己跑完吧」——全链授权（评审代点火 ∕ 批准代签，沿自缚三条件）。
- **自缚三条件核验**：
  - ① 设计评审 **pass**——§3 轮次 1（🔴0 · 🟡2 · 🔵4），六条全部裁定「接受」并落修正轮；
  - ② 修正轮 **6/6 落地**并经父侧逐项核验——§2.11（`:189-217`）回读在位；IPC.md 盘面实读 `:3` = **331** ∕ `:238` = `config.mjs:234` ✓；抽取锚复核（`function sessionResume(` 唯一命中 · `:171`）；
  - ③ 设计 **token 在位**（值不落档——运行时凭证）。
- **外范围核验（父侧补）**：`PROJECT.md:78`（KD-38）实读成立 ✓；`D10` 实址 `:847`——§2.9 原引 `:816` 系坐标笔误，已父侧机械收正（`:180` 行；记录面 · 可 revert）。
- **批准结论**：**准予实施**——修法 = §2.2 两 token（`ipc.mjs:171` `async` ∕ `:172` `await`）+ 回归件按 §2.5 ∕ §2.11 现行值。
- **实施注意（交 eng-coder）**：`ipc.mjs` 存在**跨进程并发写**（另一实例连续微写：父侧首读 330（§2.11 记）→ 331（修正轮复核）→ **332**（本轮实读））⇒ 落笔前实读复核锚点、落笔后回读确认；IPC.md `:3` 的 331 于收口时按最终实读复核（§2.11 补记在册）。
- **附**：真机腿-2（用户实机目视段 11）留待用户重启后复核（§6 记录）；批内件落位 `docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs`。

## §5 实施记录（eng-coder）

**状态行**：实施完成（码面两 token + 批内件 R1–R7 两轮；审计 1 轮——命中 1〔§5 未落位，已随本段补落〕∕ 代码评审 1 轮 = pass——终态 clean；真机腿归父侧）

### 5.1 交付摘要

按 §2.2 修法（最小两 token）+ §2.5 ∕ §2.11 批内件落位；`:173-179` 守卫区 ∕ `ipc-registry.mjs` ∕ 其余全档零触。

| # | 档 | 落位（落笔前后实读 · file:line） | Δ |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/ipc.mjs` | `:171` `function sessionResume() {` ⇒ `async function sessionResume() {`；`:172` `const receipt = resumeSession(currentCwd())` ⇒ `const receipt = await resumeSession(currentCwd())`（回读复核；落笔后逐行 hash 对读：仅此两行变动，`:173-179` 各行 hash 与落笔前相同） | 行数中性（332 ⇒ 332） |
| 2 | `docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs`（新） | R1–R7（抽取锚 + `async ` 前置回扫 ∕ `node:vm` 沙箱五替身注入 ∕ 行为面断言——非文本扫描） | 0 ⇒ **149** 行（§2.11-6 预期 ~130–160 ✓） |

**机检两轮（cwd `thincoder/`；命令 `node --test docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs`）**：

- **修前形态（录红）**：`tests 7 · pass 3 · fail 4` —— ✖ R1 ∕ R4 ∕ R5（守卫判在 Promise 上 ⇒ 两 hook 计数 0，断言抛）· ✖ **R6**（变异未命中：源内无 `await resumeSession(`——即 §2.5 R6①「未命中 ⇒ 实现未落 await，红」本意）· ✔ R2 ∕ R3 ∕ R7（两态皆绿语义锁）。
- **落两 token 后（全绿）**：`tests 7 · pass 7 · fail 0`（R1–R7）。
- `node --check`：两档均 `Syntax OK`。

### 5.2 决策透明表（实现轮裁量 · 报告级）

| # | 项 | 裁量 | 依据 |
|---|---|---|---|
| 1 | R6 变异命中判据落形 = `assert.ok(mutated !== src, …)`（初版 `assert.notEqual(mutated, src, …)` 失败时整档 dump 源文本 ≈28KB 噪声 ∕ 同判据） | 改（同红绿语义） | 落笔后按最终件重跑修前一门核讫：R6 仍按「未命中 ⇒ 红」抛（读数同上） |
| 2 | 批内件落终位 `docs/batches/`（#545 写门**通过**） | 直落终位 | 设计备选支路（`.thincoder/tmp/` 暂存）未启用；沿 #545 现行法 |
| 3 | R6「必抛」收紧为「必由断言体抛」（`threw?.name === "AssertionError"`） | 收紧（语义内强化） | §2.11-2「守卫敏感断言体…必抛」——防错型抛（TypeError 等）假绿；审计判语义内 ∕ 非偏差 |

### 5.3 验证（机检 · 终态）

- 两轮读数如上；`ipc.mjs` 回读：`:171` = `async function sessionResume() {` ∕ `:172` = `const receipt = await resumeSession(currentCwd())`；`:173-179` 逐行 hash 与落笔前相同（逐字零动 ✓）。
- **并发线实读**（§4 交办「落笔前复核」）：落笔前 = 332 行 ∕ `function sessionResume(` 唯一命中 1（`:171` 修前形 · `await resumeSession` 计数 0）；落笔后 = 332 行（行数中性 ✓）。
- **git diff 归属**（`git diff -- thincoder-desktop/src/main/ipc.mjs`）：全档 5 hunk —— 本会话 = **1 hunk（`@@ -166,8 +168,8 @@`）恰两行 token**；另 4 hunk = **批外并发写**（editor-open #627 ∕ msg:interrupt #656 ∕ fileOpen 重写 ∕ 档头 KD-39 句；其中 #627 注释 + import 于本人落笔前实读已在盘）——非本批产物、本批零触。
- **not repo-suite verified**（全清令：仓套件不跑——父侧收口跑为唯一套件跑）。

### 5.4 审计与代码评审（轮次与终态）

- **审计轮 1**（explore · 只读偏离审计）：四判据（部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 表外改动）——命中 **1**：§5 未落位（本段即补，§5 即该补落）；其余三判据 0 命中（两 token ∕ 七例两态矩阵 ∕ 清单 ∕ 文档面逐项持证）。
- **评审轮 1**（advisor · code）：VERDICT **pass**（🔴 0 · 🟡 2〔均非 must-fix〕· 🔵 3）；逐条回应见 5.5。
- **fix round**：1 轮（= 落 §5 本段；码面 ∕ 批内件**零改**——回应项均非 must-fix 且涉设计冻面）。终态 = **clean**（未触 5 轮上限）。

### 5.5 评审回应表（逐条）

| # | 级 | 项（评审原文要旨） | 回应 |
|---|---|---|---|
| 1 | 🟡 | `ipc.mjs` 332 行超 300 顾问线（<500 硬限） | **不改**——既存债务（#28 已拆注册族；§2.4 在册零行数增量）；非 must-fix |
| 2 | 🟡 | `:177` `void pushLedgerLines(…)` 拒绝面（callee 内 try 外路径抛 ⇒ 经 `main.mjs:129-130` fatal 升级 = 退出 5） | **本轮不改**——设计 KD-3 有意 `void`（R2 锁）+ 任务书边界「`:173-179` 逐字零动」；**呈父侧裁**（可选硬化 = 调用点 `.catch`，不动时序基线 ∕ R2 判据）——披露见 5.6-2 |
| 3 | 🔵 | 测试件锚 ∕ 变异「首次命中」无唯一性断言 | **报告级不改**——失效方向为响的（假红非假绿）；改件会破坏「件 ↔ 两轮读数」一一对应 |
| 4 | 🔵 | 花括号朴素配平（体内注释 ∕ 串含 `{` 即截断） | **报告级不改**——现盘体内两注句无花括号（已核）；当下成本 ∕ 收益不成立 |
| 5 | 🔵 | R1/R4/R5 不能区分 `receipt.cwd` vs `currentCwd()` 入参来源（二者同值 `/p`） | **报告级不改**——被测线 `:174` 在本批两 token 之外；精度注记在案 |

### 5.6 透明披露（上抛父侧）

1. **并发线（§4 在册）实读**：`ipc.mjs` = 332 行（本会话首读 ∕ 落笔前 ∕ 回读三读同值）；`git diff` 另 4 hunk 为批外并发写产物——本批不触 ∕ 不并轨（父侧收口请按最终实读复核 IPC.md `:3` 的档头计数）。
2. **`:177` 拒绝面（评审 🟡2 · 本侧已自证）**：`pushLedgerLines` 内部 try 只覆盖动态 import（`project-info.mjs:117-122`）与 `post` 出站（`:153-155`）；`stopLedgerRefresh()`（`:115`）与 `startLedgerSurface({…})`（`:158`）在 try 外——修前该调用点已死 ⇒ 本批**新激活**；落未处理拒绝时经 `main.mjs:129-130`（`unhandledRejection → fatal`）+ `:57-60`（记错 + `EXIT.FATAL`）升级为应用退出。可选硬化（调用点 `.catch`）本批零改、呈裁。
3. **真机腿归父侧**（§2.6 ∕ §4）：段 11 目视 + `sent` 探针含 `ev:ledger` + #600 闭合。
4. **计数**：通道 ∕ 白名单 ∕ 注册序零改；`ipc.mjs` 行数中性；批内件 149 行 ≤ 300 ✓。

### 5.7 边界核对（未做 = list）

- 未动（按设计）：`:173-179` 守卫区 · `ipc-registry.mjs` · 任何其它档 · 核件 ∕ 渲染面 ∕ VSC 树。
- 未跑：全仓套件（父侧收口）；未落 §2.10 上抛①（接线纪律句）；未追 §2.10 ②（`resumeSession` async 化考古）。

## §6 验证与收口（父代理）

### 6.1 验证（父侧 · 2026-09-29 22:0x）

- **token 回读**（父侧实读 `ipc.mjs:166-180`）：`:171` = `async function sessionResume() {` ✓ ∕ `:172` = `const receipt = await resumeSession(currentCwd())` ✓ ∕ `:173-179` 守卫 ∕ 注释 ∕ `void pushLedgerLines` ∕ `return receipt` 逐字在位 ✓；全档 332 行。
- **批内件复跑**（父侧独立）：`cd thincoder && node --test docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs` ⇒ `tests 7 · pass 7 · fail 0` ✓（与实施读数一致）。
- **真机腿-1（隔离探针 · 父侧实跑）**：`.thincoder/tmp/probe-statusline-ledger.mjs` ⇒ **绿**——`sent` 含 `ev:ledger`（`{"key":"1","detailLines":["台账 tc-sl-proj-q9Nd0V：…"],"marker":{"text":"台账 0·0","warn":false}}`）✓；段 11 在场（`firstDump` ∕ `reanchorDump` 皆 `[data-seg="ledger"]` = `台账 0·0`）✓；`mainOut` 空（无 `[project-info] ledger emit failed`）✓。（夹具项目无台账数据 ⇒ 计数 `0·0` 系预期——机制腿 = 帧在场 ∧ 段在场。）
- **真机腿-2（用户实机目视）**：待用户重启桌面实例后目视段 11 = `台账 N·M`（本批闭合 #600 真机腿）——**留用户**（§6.3）。
- **套件面**：not repo-suite verified（全清令——仓套件不跑；父侧收口跑保留）。

### 6.2 上抛处置

1. **`:177` `void pushLedgerLines` 拒绝面**（评审 🟡2 · 本批新激活）×：裁定 = **不在本批内改**（KD-3 + 边界「`:173-179` 逐字零动」在案）——**转册** `docs/batches/2026-09-29-hatch-clearance-2.md` §1.8（设计轮裁：`.catch` 硬化 ∥ 维持 fail-loud）。
2. **真机腿**：见 6.1——腿-1 已绿；腿-2 留用户。
3. **IPC.md `:3` 计数**：修正轮落值 **331**（as-of）；盘面现读 **332**（批外并发线写入：`msg:interrupt` 注释族 +1）——归该并发线收口随动，本批不再追（防跨会话写竞）。
4. §2.10 上抛①（接线纪律句）∕ ②（考古）：维持不落（原裁在案）。

### 6.3 结算（D7）

- **角色表**：§1 讨论（主 agent）· §2 设计（eng-designer · 含 §2.11 修正轮）· §3 评审（评审子代理 · 轮次 1 pass）· §4 批准（主 agent 代签）· §5 实施（eng-coder · 终态 clean）· §6 本段（父侧）。
- **状态行**：§1 → 已收口 2026-09-29；全档冻结。
- **计数 ∕ 指针**：批内件 `docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs`（149 行）在位可跑 ✓；§2.9 零改动结论维持（`:816 ⇒ :847` 机械收正在 §4 在册）✓。
- **台账**：#666 → 已核销（依据 = 本节 + §5 + 腿-1 读数）；#600 真机腿 = 腿-1 ✓ ∕ 腿-2 待用户目视补记。
- **欠账**：`:177` 拒绝面 → #673 §1.8 在册；并发线计数 → 归其收口。
- **观察项**：腿-2（用户重启目视）——闭合前如见异常，另案处理。
