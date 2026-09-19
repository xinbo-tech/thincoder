# 多实例协作感知（MULTI-INSTANCE-COLLAB）· 设计

> 板块 = **多实例协作感知**（同一工作目录多副本 agent 互相感知与避让）。
> 本档 = 该机制的**设计面唯一权威**（共享状态分类 / 感知面 L1–L2 / 域面 L3 / config 原子写 F5 / 决策）。
> 相邻权威 = `docs/core/design/SESSION.md`（§6.2 槽位认领 / 判活 / slotOccupancy——本机制上游存储层基建，复用不重造）·
> `docs/core/design/WORKSPACE.md`（工作区面）· `docs/core/design/SETTINGS-TOOL.md`（settings 工具走 `writeConfigAtomic` 原子写盘）。
> 需求侧 = `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（F-MI1–F-MI5 / N-MI1–N-MI5）。
> 建档：2026-09-15（**CLI 尾部真批 · 纯新建**——`thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史；VSC 端按双端镜像纪律同构实现——逐字锚 = §3.2 L1 注入文案 + §3.3 schema + §4.3 软提示文案，
> VSC 侧实现坐标归 VSC 轮（P2），本档只保留机制原则与 CLI / 核侧坐标）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与范围边界

同一 `~/.thincoder/sessions/` / `~/.thincoder/peers/` 目录下的多实例（CLI + VS Code 双端）在 **agent 认知层**互相感知：
agent 自主知道「有同伴在」，写前避让文件域竞争，无需用户口头协调。

- **不做**：跨实例实时聊天 / 任务编排 / 冲突自动合并；文件域感知是**软提示**（不阻止写，非文件锁）。
- 判断标准 = **写入语义**：共享单一文件（读-改-写竞态 → 需 mtime 门控 / 合并）vs 追加独立快照 / 分文件（天生无冲突）。

## 2. 共享状态四分类（as-of 2026-09-06 完整梳理）

### A 类：已有防护（复用存储层基建）

| 共享物 | 路径 | 防护机制 |
|---|---|---|
| 会话数据文件 | `~/.thincoder/sessions/{cwd-hash}.json.N` | slotSessions 进程认领 + isProcessAlive + slotOccupancy + end marker + .bak 轮转 + mtime 门控（`SESSION.md` §6.2） |
| 会话 manifest | 同目录 `.json.manifest` | 条目级合并 + deletions 显式表达 + active 单值指针 |
| 向量 / 个人记忆 | `~/.thincoder/memory.db` | sqlite WAL 并发（低险） |

### B 类：裸写无防护（本机制覆盖——F5）

| 共享物 | 路径 | 风险 |
|---|---|---|
| config.json | `~/.thincoder/config.json` | 🔴 全局共享；整节内存写回抹掉对端改动（F5——用户实证「一端改配置另一端出现意外」） |
| 项目元数据 | `{cwd}/.thincoder/advisor.md` 等 | 🔵 低活跃低险 |

### C 类：按文件设计天然低冲突（无需协调）

项目 memory（每 entry 独立文件）· 日志 / tmp（appendFile 原子追加）· traces（按 sessionKey 分文件）·
checkpoints（追加式独立快照目录——ID 随机后缀防碰撞 + 清理幂等；语义上同 cwd 多实例快照都应可恢复，隔离反而破坏用途）。

### D 类：工作区本身（L1/L2/L3 主战场）

repo 代码 / 文档 / git 操作无跨实例协调——同时改同文件互相覆盖（实况曾靠口头回避）。

## 3. 感知面：L1 回合注入 / L2 查询工具

数据源全部复用 `SESSION.md` §6.2（manifest `slotSessions` + 判活）——**纯只读**（N-MI3，感知面结构化上无任何 fs 写调用）。

### 3.1 `peerInstances(cwd)`（`thincoder-core/peer-instances.mjs:99`——双端同构）

- 读 manifest `slotSessions` → 按 sessionId（`{pid}-{ts}-{rand}` 进程级）去重分组 → slots 数组；
- **一次批量判活**（`batchAlive(pids)`——`thincoder-core/process-probe.mjs:59`，单次 tasklist/ps 全量比对）；探测失败（null）≠ 全死——按「无活伴」降级（不显示幽灵同伴）；
- self = `sessionId === getSessionId()`（本进程恒活不查）；
- **端字段**：`probeCmdlines(pids)`（`thincoder-core/process-probe.mjs:91`）一次 exec 拿全部 pid+cmdline，`VSC_END_RE`（extensionHost 族）命中 → `vscode`，其余 → `cli`；失败 → end 缺省；
- **惰性缓存（TUI 假死批收正 · 2026-09-18）**：命中判据 = **manifest mtime 未变 ∨ 快照年龄 < `PEER_PROBE_TTL_MS = 5000` ms** ⇒ 直接返回缓存快照（零 exec 零读）；
  缺失 / 损坏 → `[]`（不缓存空结果）；缓存上限 `CACHE_MAX = 64`；快照记 `probedAt`（上次实探时刻）。
  **可测缝（TTL 两侧）**：模块级 `nowFn`（缺省 `Date.now`——经 `_setPeerInstancesTestImpl` 注入、`??` 兜底、测试 finally 恢复）
  ⇒ 「TTL 内命中 / TTL 外重探」两侧均可**确定性**断言，免真实 ≥ 5 s 等待。
  **修因**：`saveSession` 每回合重写 manifest（`thincoder-core/session.mjs:163-172`）⇒ 纯 mtime 判据**每回合自击穿**，
  每回合重跑 `tasklist` + `Get-CimInstance`（1–3 s **同步 exec**，独占事件循环——主 agent 回合假死源之一）。
  TTL 只影响**新鲜度**（同伴来去在人类时标），不影响正确性；TTL 内不重探 = 与 T-L1c「零 exec」同向。
- **探测异步化（同批）**：`thincoder-core/process-probe.mjs` 增 `batchAliveAsync` / `probeCmdlinesAsync`（`execFile` promise 化；
  **同一注入缝** `_setProcessProbeTestImpl`——测试注入的同步函数经 `await` 消费，零新缝）；
  读面 `peerInstances` → **async**，`pushPeerReminder` → **async**（装配点 `prepareRun` 已 async——`await pushPeerReminder(agent)`）。
  **清理面形态（2026-09-18 · F-MI7）**：`cleanDeadOwners` / `usableSlot` / `allocateFresh` / `ensureActive` **零自有探测**——判据 = 「入口一次束 + 查表」形态（`probeOwnersAsync` / `probeOwnersSync`，见下条）；`resumeSlot` 整链 **async**（会话起点 / 认领路径零同步 exec）。
  同步面仅剩**两处有界同步消费**（同束 `probeOwnersSync`，`SYNC_PROBE_MS` = 2 s 紧界）：① `activeSlot` 冷路径；② 占用判定 `slotOccupancy`（`thincoder-core/session.mjs`，拆分后随 `session-lifecycle.mjs`）。
  两处均带**零探测早退**（粘性早退 / 无属主或本进程属主）——详面 = `SESSION.md` §6.2；测试锚 = 本档「判据（测试层 · F-MI7）」条 ③。
- **活判定身份校验（本批 · F-MI6 / N-MI6 · 2026-09-16 · 评审 #3 落点澄清）**：身份过滤**不进 `batchAlive`**（保持**纯存在性**——`thincoder-core/peer-domains.mjs` 死文件清理语义零变、**零改**）；过滤落点 = **读面 `peerInstances()`**（存在性结果 × 命令行复核）+ **清理面 `filterDeadOwners`**（详面见下条判据单源）。命令行命中**本产品标记族**才计为活同伴。
  标记族 = ① CLI 入口族（命令行含 `thincoder.cjs` / `thincoder.mjs` / `thincoder-cli` 路径段）· ② VSC 宿主族（既有 `VSC_END_RE`——extensionHost）；
  命令**明确可得且不命中** ⇒ 不列为同伴（消除 pid 复用假阳性——台账实测 `docs/TODO.md:27`）；命令探测失败 / 该 pid 缺行 ⇒ **保守保留**（探测失败 ≠ 死；既有降级语义不变）。
- **判据单源**：身份判据实现住 **`thincoder-core/process-probe.mjs`**——`batchAlive` / `probeCmdlines` / `isProductProc(cmdline)` / `classifyEnd` / `filterDeadOwners`；
  **感知面（读）与陈旧记录清理面（写）调用同一实现**，零第二套标记正则（清理面 = `thincoder-core/session-slots.mjs` `cleanDeadOwners`（as-of 2026-09-18 `:205-219`）（机制面 = `SESSION.md` §6.2）——`isProcessAlive` 之外加身份复核，pid 活 + 身份不符 ⇒ 条目可删）。
  注入缝（R6 形态）= `process-probe.mjs` 模块级 `_setProcessProbeTestImpl({ aliveFn, cmdlineFn })` + `??` 默认 + 测试 finally 恢复；
  清理面 API = `filterDeadOwners(pid, { alive, cmdline }) → boolean`——**`alive` 三态**（`true` 活 / `false` 死 / `undefined` 未知，**缺省 = 未知**）：
  `false` ⇒ `true`（可删，pid 死语义原样）；`true` ⇒ 命令明确可得且非本产品 ⇒ `true`；**未知 / 缺行 ⇒ `false`（保守保留，D-MI10）**。
  三态判据单源 = `ownerState(pid, { aliveSet, cmds }) → "dead" | "alive" | "unknown"`（`filterDeadOwners` 与占用 / 空闲判定同源消费——`SESSION.md` §6.2）。
- **清理面扫描形态（本批 · 复审 #2）**：清理面与读面**同形态**——**单次批量**取命令行（一次 `probeCmdlines` 覆盖全量待判 pid，`filterDeadOwners` 逐条消费该批量结果），**不做每 pid 一次 exec**（对齐 §8 `D-MI3` 否决口径与需求档 `N-MI3` 批量判活；R6 注入缝 `cmdlineFn` 即此批量语义）。
- **探测束与有界形态（2026-09-18 · F-MI7）**：探针族两形态各增**束 API**——`probeOwnersSync(pids) → { aliveSet, cmds }` / `probeOwnersAsync(pids) → { aliveSet, cmds }`（每束 ≤1 批量判活 + ≤1 批量 cmdline；异步形态两 exec **并发**）。
  同步形态超时 = `SYNC_PROBE_MS = 2000`（阻塞事件循环 ⇒ **紧界**）；异步形态沿用 10 s / 15 s（不阻塞，量级不变）。
  cmdline 一发**仅在存在非自身存活属主时**必需（无活外人 ⇒ 省发）——束内自决，调用面零探测零判据。
  **失败 ⇒ `aliveSet = null`（未知）**：判据层按「保留 / 不可认领」降级（三态判据），**任何调用面不得把 `null` 当「全死」**。
- **已知局限（本批登记）**：manifest 记录不含 cwd、进程 cwd 无跨平台可移植获取面 ⇒ 被他 cwd 的**真实** thincoder 实例（或他窗口 VS Code 宿主）复用 pid 时仍可能误报——根因 = 身份判据不含 cwd（§8 D-MI9 已否决 cwd 匹配）；处置方向 = **保守保留**（D-MI10 不对称）；**消解路径未定**（登记为已知局限，非本批可解）。
- **已知局限（误删方向 · 本批登记 · 复审 #3）**：标记族**假阴性**——真实本产品实例命令行不含 `thincoder.cjs` / `thincoder.mjs` / `thincoder-cli` 路径段且非 extensionHost（如包装器 / 新入口形态）⇒ 清理面会删**活**属主槽条目——正是 `D-SE3` 要防的「双进程同槽」方向（`D-MI10` 不对称只护「探测失败 / 缺行」）。
  接受边界 = 入口族命中面（CLI 入口段 / extensionHost）内无此方向；族外残差接受（放宽标记族 = 复引入 pid 复用误报——`D-MI11` 判据零改）；消解路径 = 实测出现该形态时按形态补进标记族（单源改点 = `isProductProc`）。
- **判据（测试层 · 需求档 F-MI6 / N-MI6）**：读面 = `thincoder-core/test/peer-instances.test.mjs`（注入缝 `:37/:44` 首用——身份不符 ⇒ **不列为同伴**；身份符 / 探测失败 / 缺行 ⇒ **保留**）；清理面 = `thincoder-core/test/session-slot-write.test.mjs`（同判据：不符 ⇒ 删，不确定 ⇒ 不删）；
  本批受影响文件（当前行数 / 增量）= 批次档 `docs/batches/2026-09-18-init-block.md` §2.3 + 同档 §2「fix 轮附录」（实施面受影响文件；F-MI6 侧沿革 = 批次档 `docs/batches/2026-09-15-core-defect-fixes.md` §四）。
- **判据（测试层 · 需求档 F-MI7 · 本批锚 · 2026-09-18）**：测试档 = `thincoder-core/test/process-probe.test.mjs`（束 API / 三态 / 注入缝计数 / 零同步 exec 扫描——核半）· `thincoder-core/test/session-slot-write.test.mjs`（扩——有界同步例外锚）· `thincoder-vscode/test/zero-sync-exec.test.mjs`（零同步 exec 扫描——端半）；四路锚：
  ① **零同步 exec 扫描（两域分档）**：核域 = `thincoder-core/session-slots.mjs` · `thincoder-core/session.mjs` · `session-lifecycle.mjs` · 端域 = `thincoder-vscode/src/extension/session-slots.mjs` · `thincoder-vscode/src/extension/peer-instances.mjs`；分档 = N3 门禁（`thincoder-core/test/core-hygiene.test.mjs:96-107`）；
  域内零 `execSync` / `execFileSync` / `spawnSync` 直引（形态先例 = `thincoder-core/test/tool-seams.test.mjs:289-299`——核 / 端两半同形；域完整性对账先例 = `thincoder-vscode/test/settings-open-snapshots.test.mjs:163-185`）；`thincoder-core/process-probe.mjs` = 探针族单点落点（豁免——不在零域）。
  ② **束 exec 上界**（注入缝计数）：每束 ≤1 批量判活 + ≤1 批量 cmdline、零逐 pid——经 `_setProcessProbeTestImpl({ aliveFn, cmdlineFn })` 计数断言（越出即红）。
  ③ **有界同步例外锚**（`activeSlot` / `slotOccupancy` 两面）：零探测早退命中（粘性 / 无属主 / 本进程属主）⇒ 计数断言零探测；探测失败 / 超时（注入形——零真实 2 s 等待）⇒ 未知保守保留（占用判定 ⇒ `{ occupied: true, unknown: true }`）；
  界值单源 = `SYNC_PROBE_MS = 2000`（探针族一份常量）。
  ④ **初始化窗口静默读数**（< 2 s）：取值单源 = `docs/vsc/design/SETTINGS.md` §2.11 三路（静态扫描 / 注入式时序断言 / 实机读数）；实机读数承批次档 `docs/batches/2026-09-18-init-block.md` §1.5（实测 C）→ §6 收口。
- 测试注入缝：`_setPeerInstancesTestImpl({ aliveFn, cmdlineFn, nowFn })` / `_resetPeerInstancesTestImpl()`（`:37` / `:44`——注入即清缓存；`nowFn` 同批新增——TTL 面见上）。
- **VSC 镜像面收正（2026-09-18 · init-block 批 · F-MI6）**：端侧 `thincoder-vscode/src/extension/peer-instances.mjs` 判活 / 标记正则 / 批量 cmdline **本地副本删除**（本地副本 = `:39` `batchAlive` · `:74` `classifyEnd` · `:88` `probeCmdlines`）——判据**引核**（经 `@thincoder/core/process-probe.mjs` 引用，单源不变）；
  端侧只留 **END / 命名空间薄壳**；注入缝转口——端侧 `_setAliveProbeForTest` 转注入核缝 `_setProcessProbeTestImpl`（同缝语义——测试免双缝）。
  验收：既有同伴用例行为零变（引核后同一判据）+ 端侧本地判活 / 标记正则 / cmdline 副本零残留（扫描判据 = 本档「判据（测试层 · F-MI7）」条 ①）。
- **端侧缓存端差（2026-09-18 · init-block 批 · 登记）**：VSC 侧刷新 = `PEER_PROBE_TTL_MS` 到期 **stale-while-revalidate**（先返旧快照、后台异步重探）+ 启动期异步预热；
  **预热落点（父侧裁定 2026-09-19）**：启动期异步预热的落点 = **panel resolve 面**（键 = **panel cwd**）——对齐 SWR 缓存键；`activate()` 无 per-cwd 键，多根工作区会预热错键。
  **端差**：零同步 exec 纪律 ⇒ TTL = **新鲜度上界**（核侧 = mtime ∨ TTL 双判据——端侧不复刻 mtime 判据）；`N-MI2` lockstep 不受影响——同伴清单**不入**认领 / 占用判定（判定面单源 = 核束 + `ownerState`）。

### 3.2 L1 回合注入（`pushPeerReminder`）

装配 = `thincoder-core/agent/setup-reminders.mjs`；时序（`setup.mjs`，depth-0）= env-state 之后、time reminder 之前（time 保持 LAST——prefix-cache 契约）。
形态 = **depth-0、transient:true**（同 env-state 纪律）；无同伴零开销（惰性缓存）；任何感知失败静默跳过（注入绝不打断回合）。
**异步形态（TUI 假死批 · 2026-09-18）**：`pushPeerReminder` = async（内部 await 读面）——装配点 `prepareRun` 为
depth-0 分支内 `await pushPeerReminder(agent)`；**注入时序与文案零变**（env-state 后、time reminder 前）。

**注入文案（逐字契约，双端一致）**：

> `[System reminder: 本目录另有 ${peers.length} 个活跃 thincoder（${who}）——文件操作注意避让]`

`who` = 各同伴 `{end} pid={pid}`（有 end 时）或 `pid={pid}`，以「、」连接。有同伴才注入，每回合注入。

### 3.3 L2 查询工具（`peer_instances`）

只读工具（无参、readonly）返回 `peerInstances(cwd)` 去 self——agent 主动查，不依赖注入时机。
装配：CLI = `thincoder-cli/src/cli/make-agent.mjs`（挂 `peerInstancesTool`——`thincoder-core/peer-instances.mjs:152`）；VSC = registry 同构。

**schema description 逐字锚（双端照抄——禁止自行解释）**：

> "peer_instances — read-only: list other live ThinCoder instances sharing this workspace cwd. Returns [{ pid, end, sessionId, slots }]; never includes self; pure read — writes nothing."

**字段白名单**（N-MI4）：返回字段仅 `{pid, end, sessionId, slots}`——出现任何其他键即红；查询路径 fs 写点计数 = 0。

## 4. 域面 L3：文件写域登记 + 冲突检测

### 4.1 选型结论

① sessions 目录受 cwd 分片限（登记域是任意文件路径——装不下）；② manifest 扩展被否决（条目级合并只认已知字段、旧版整对象写丢未知字段）；
③ **选定：每实例独立登记文件 + 目录扫描聚合**——end marker 单写者模式同型（写失败容忍 + 损坏按缺失降级 + 崩溃残留判活可清）→ `thincoder-core/peer-domains.mjs`。

### 4.2 登记存储（D-L3a）

- 目录 `~/.thincoder/peers/`，每实例单文件 `{sessionId}.json`（单写者 = 本实例；内容 `{sessionId, pid, end, cwd, domains: [绝对路径], updatedAt}`）。
- **写点 = 回合级**：结构化写工具执行成功时 `recordPeerWrites`（`:231`）记入 `agent._peerWritten`（Set<绝对路径>）→ 回合末 `finalizeAgentTurn` 调 `flushPeerDomains`（`:248`）整写一次（`.tmp + rename` 原子）。**本回合无写入 → 不写**（hot 窗口不被空回合提前清掉）。
- `PEER_WRITE_TOOLS` = 既有 `FILE_MUTATORS` ∪ `file_ops`（后者在 FILE_MUTATORS 之外故显式并入）。
- 目标解析 `peerWriteTargets(tool, args, cwd)`（`:71`）：touchedPaths 优先（apply_patch / edit-batch 多文件）；file_ops 取 source/dest 双算；其余 path 单参兜底；相对路径按 cwd resolve；畸形入参跳过。
- 崩溃残留：聚合时惰性清理（死 pid 文件 unlink——**判活探测失败（null）≠ 死，不得据此删除**）；损坏文件按缺失降级（不删——属主下次 flush 覆盖）。

### 4.3 冲突检测（D-L3b）

`peerDomains(cwd)`（`:183`）聚合本 cwd 其他活实例登记（self 排除）；`conflicts(cwd, targets)`（`:194`）：targets 命中他实例 **hot 域**
（`updatedAt` 在 `HOT_WINDOW_MS = 5 * 60 * 1000` 内——`:26`——且域含 target / 互为包含）→ 返回 `[{ target, by: [{end, pid, sessionId}] }]`。纯只读、不抛（失败按零冲突）。

- **hot 窗口语义**：「写后登记 + hot 窗口」——登记真实足迹，「正在写」弱化为「刚写过」；bash 大通道本就不可拦——诚实边界：L3 覆盖结构化写工具足迹 + hot 提示。
- **路径重叠** `pathsOverlap(a, b)`（`:92`）：相等或互为目录包含；区分大小写按平台；分隔符归一。
- **缓存**：聚合结果按 peers 目录 mtime 惰性缓存（目录未变不重扫）；**N-MI3 度量**：单次写工具调用新增开销上限 = 目录 stat 一次；注册 flush = 回合末一次整写。

**dispatch 钩子**（`thincoder-core/agent/dispatch.mjs` + `thincoder-core/agent/run-stages.mjs`）：执行前 `peerCollabNote(cwd, tool, args)`（`:214`）查 conflicts——
命中 → 工具结果附**软提示**（不阻止）；成功后 `recordPeerWrites`（仅成功写计入）；routed（ACP 客户端执行）成功同样记账。

**软提示文案（逐字契约，双端一致）**：

> `[peer-collab] ${target} — another live instance (${who}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`

`who` = 各 `{end} pid={pid}` 以 ", " 连接。无冲突 / 无目标 / 降级 → null（调用方零附加）。

## 5. checklist 并发同步（F4）——**已废（历史沿革）**

> **本节描述的对象已消失**（2026-09-18 判据面收正批收正）：checklist 工具族随 **M7 废除批**删除——工具本体 / 同步机 / `tool-docs` 提示词档三处载体**全仓零命中**（核 `tools/` 下无该族）⇒ 原「F4 同步机」（写前门控 + 合并 + 序列化 / 基线规则 / ID union 合并 / 写前门控测试缝）**整节作废**。**原 5.1 基线规则 · 5.2 语义与合并规则 · 5.3 测试缝三小节内容随载体删除一并撤除**（本节只留本历史条）。
> **史实存** = 本文档变更记录 + git 历史；**真值依据** = 退场族 N5 在册（`docs/core/design/ANCHOR-DEBT-REPAIR.md` §3-Q6 六形表——全仓零命中）。
> **现行承接**：待办总账 = **台账**（SQLite 单一权威源——`docs/core/design/LEDGER.md`；机制单源）；多实例并发面余项 = §3 感知面 / §4 域面 / §6 config 原子写（F5——在役）。

## 6. config.json 原子写（F5）

### 6.1 根因

CLI 多处**整节内存写回**（读入内存的 providers / mcp.servers 整数组写回磁盘）——进程 A 快照常驻 → B 改了 → A 任一操作把 B 的改动整体抹掉。
VSC 侧无此形态（各路径现用现读）。

### 6.2 双管齐下（D-F5a + D-F5b）

- **D-F5a 消灭整节内存写回**：原 7 处整节写回全部改为「在磁盘新鲜 raw 上执行单操作」语义（单字段补丁 / fresh raw 上 push·splice·改单字段）——双进程并发改不同 provider 都保留；
- **D-F5b 收口函数 `writeConfigAtomic(path, mutate)`**（`thincoder-core/config.mjs:29` export）——持「新鲜读 → mutate 单操作 → 写前重 stat → 写」全链，所有 config.json 写点（config-helpers persistRaw / cmd-config / setup-wizard / settings writeDisk）都经它落盘。

### 6.3 writeConfigAtomic 语义

- **t0 取在新鲜读之前**（stat→read 序）——read→stat 序存在漏检窗口；
- **写前重 stat ≠ t0 → 放弃本次写**（对端新值保持在线不抹）；先 copy `.bak-{ts}` 留现场（仅冲突时；copy 而非 rename——本体不动）；
- 返回 `{ ok: false, reason: "mtime-conflict" }`，调用方提示重试——**不自动合并**（config 是用户显式操作——重试比猜测合并安全）；
- 文件缺失（首写）→ t0 = null；对端在本端读后创建 → 冲突放弃；
- 畸形文件**拒写**（throw，绝不静默覆盖）；写后 chmod 0600 尽力而为（config 含 API key）。

## 7. 机制面坐标（核 / CLI · as-of 2026-09-15 实核）

| 面 | 落点 |
|---|---|
| 感知面 L1/L2 | `thincoder-core/peer-instances.mjs`（`peerInstances` · `peerInstancesTool` · 测试缝 `:37/:44`）+ **`thincoder-core/process-probe.mjs`（探测与判据单源）**：`batchAlive` / `probeCmdlines` 及其 `*Async` 对偶 · `probeOwnersSync` / `probeOwnersAsync` 束（2026-09-18 增） · `ownerState` / `isProductProc` / `classifyEnd` / `filterDeadOwners` · **`isProcessAlive`（2026-09-18 自 `session-slots.mjs` 移居——单 pid 兼容面，同步有界 2 s）**；陈旧清理面 = `thincoder-core/session-slots.mjs`（`cleanDeadOwners`——探针入参化，零自有 exec） |
| 域面 L3 | `thincoder-core/peer-domains.mjs`（`HOT_WINDOW_MS:26` · `peerWriteTargets:71` · `pathsOverlap:92` · `peerDomains:183` · `conflicts:194` · `peerCollabNote:214` · `recordPeerWrites:231` · `flushPeerDomains:248` · 测试缝 `:45/:52`） |
| L1 注入装配 | `thincoder-core/agent/setup-reminders.mjs`（`pushPeerReminder`）· `thincoder-core/agent/setup.mjs`（注入时序：env-state 后 time 前） |
| L3 钩子 | `thincoder-core/agent/dispatch.mjs` + `thincoder-core/agent/run-stages.mjs`（写前检测 / 成功记录 / 回合末 flush） |
| L2 工具装配（CLI） | `thincoder-cli/src/cli/make-agent.mjs` |
| F5 原子写 | `thincoder-core/config.mjs`（`writeConfigAtomic`——`:29` export · `:242` 自用迁移面）；写点收口 = `thincoder-cli/src/tui/{config-helpers,pickers,cmd-mcp,cmd-config}.mjs` + `src/cli/setup-wizard.mjs` + `thincoder-core/agent-tools/settings.mjs` |

## 8. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-MI1 | F5 冲突处置 = **放弃 + 提示重试** | 用户显式操作，重试成本低。否决「自动合并」（猜测合并不如重试安全） |
| D-MI3 | L1/L2 端字段 = **批量 cmdline 探测** | 一次 Get-CimInstance/ps 拿全部 pid+cmdline。否决「每 pid 一次 exec」（成本） |
| D-MI4 | L1 注入频率 = **每回合**（有同伴时） | 一致可预期；成本 = 回合一次 stat + **探测触发判据见 D-MI13（mtime ∨ TTL）** |
| D-MI5 | L3 语义 = **写后登记 + hot 窗口**（5 分钟） | 记录真实足迹；bash 大通道本就不可拦（诚实边界）。否决「写前预登记」（假足迹） |
| D-MI6 | L3 冲突反馈 = **工具结果附软提示**（不阻止） | 范围边界——避让是建议非锁 |
| D-MI7 | L3 存储 = 每实例独立登记文件 + 目录扫描聚合 | §4.1——否决 sessions 目录受 cwd 分片限 / manifest 扩展（未知字段丢失） |
| D-MI8 | 感知面**纯只读** + 惰性缓存 + 批量判活 | N-MI3——不新建平行存储，复用 `SESSION.md` §6.2 基建 |
| D-MI9 | 活判定身份判据 = **命令行命中本产品标记族** | 「能拿到的证据里唯一区分本产品与他进程」的信号。否决 **cwd 匹配**（manifest 记录不含 cwd；进程 cwd 无跨平台可移植获取面——Windows/CIM 不提供）；否决**命令行全等**（启动形态多：`node bin/x.cjs` / `--inspect` / 卷路径大小写） |
| D-MI10 | 探测失败 / 缺行 ⇒ **保守保留**（不剔除、不删） | 方向性不对称：误保留 = 噪音（可忍）；误删 = 活实例失槽（破坏存储隔离，高危）。否决「探测失败即视为死」 |
| D-MI11 | 清理面 **同判据单源**（实现住 `process-probe.mjs`，`session-slots.mjs` 只调一行） | pid 死 ⇒ 删（既有）；pid 活 + 命令明确可得 + 身份不符 ⇒ 删（pid 复用即台账实测案）；其余保守不删。`session-slots.mjs` 现 490 行逼近 500 硬限 ⇒ 实现不外提即触硬限。否决「只修读面不修清理面」（manifest 永久膨胀 + 台账修法要求未满足） |
| D-MI13 | 读面缓存判据 = **mtime 未变 ∨ 快照年龄 < TTL(5 s)**；探测函数 **异步化**（同一注入缝）；写面（manifest）频率零改 | 纯 mtime 判据被 `saveSession` 每回合重写自击穿；同步 `execFileSync` 在回合路径上独占事件循环（假死源）。否决「改 manifest 写频率」（槽摘要新鲜度契约——/session 列表预览每回合更新，与探测解耦）·「后台异步刷新（stale-while-revalidate）」（首回空结果语义变化 + 时序依赖）。**边界**：TTL 只关新鲜度不关正确性；探测失败 / 缺行仍保守保留（D-MI10 零变） |
| D-MI14 | 清理 / 认领面 = **入口一次探测束 + 判据查表**；`resumeSlot` 整链 **async**（2026-09-18 收正） | 原逐 pid `isProcessAlive` 形态 = 1 发批量 cmdline + N 发逐 pid 判活 ⇒ 初始化窗口叠 2–3 轮 = 8–12 s 同步独占（批档 `2026-09-18-init-block` §1.1 实测）。现形态：`probeOwnersAsync`（会话起点 / 认领）/ `probeOwnersSync`（**两处同步消费面**——① `activeSlot` 冷路径；② 占用判定 `slotOccupancy`）各 ≤1+≤1 exec；`SYNC_PROBE_MS` = 2 s 紧界 + 零探测早退；例外锚 = 本档 §3.1「判据（测试层 · F-MI7）」条 ③，到期条件随需求档 `MULTI-INSTANCE-COLLAB.md` F-MI7 例外句（本批登记 · 不重述）。被拒备选：① 全链 async（`activeSlot` 有 4 处同步消费面——`session.mjs` `saveSession` · `token-ttl` · CLI 三条命令；`slotOccupancy` 调用面同形——`session.mjs` 切换链 + CLI TUI / ACP 命令 + VSC 会话切换消息面，await 化需逐面传播）；② 维持逐 pid（成本不除） |
| D-MI12 | **面间不追赶 → 本批双面同改（2026-09-18 收正）**：本批（`2026-09-18-init-block`）核 + VSC 镜像**同步收正**；此后批次回面间不追赶纪律 | 同源缺陷为冻结级（初始化窗口 8–12 s 同步独占）且两面对**同一 manifest**——单面修则另一端仍旧形态（用户裁定面 = 批档 §1.2③ 明列「两实现面同步收正」）。**另注**：VSC 宿主族命中面天然包含他窗口 VS Code 宿主 ⇒ 该局限与 D-MI10 同向（宁可多留）。**VSC 面处置**：镜像 `cleanDeadOwners` / `usableSlot` / `resumeSlot` 同批 async + 束化；`peer-instances.mjs` 本地同步副本（`batchAlive` · `probeCmdlines` · `classifyEnd` 复本——实核坐标 `:39` / `:74` / `:88`）**单源化**（引核 `thincoder-core/process-probe.mjs`，本地副本删）；`pushPeerReminder` 改**只读缓存 + 启动期异步刷新**（每回合零同步 exec）。核面判据 = D-MI13 |
| D-MI15 | **任何探测必有界**：同步形态 `SYNC_PROBE_MS = 2000`（逐 pid 兼容面 `isProcessAlive` 同）；异步形态 10 s / 15 s（不阻塞，不变量级）；**无 timeout 的 `execSync` 为禁形** | 本机实测 `tasklist` 单发 >10 s 且 31 个 stuck 实例存活 40–220 s+（父进程已死——批档 §1.1 证据 5）：无界同步 exec = 事件循环无界冻结。紧界 + 失败降级（未知 ⇒ 保留）是唯一安全组合。否决「维持 10 s 同步界」（同步独占的代价比异步高一级——10 s 冻结已达用户可感级） |
| D-MI16 | 探测**失败**（束 / 批量返回 `null`）在认领 / 占用面 = **未知**：条目保留 · 槽不可认领/不判空闲；仅显示面（L1/L2 同伴列表）可降级为空 | 「探测失败 ⇒ 全死」的实际后果 = 清理面**删活属主条目** + 恢复面**认领活属主的槽** = 双进程同槽（本批 root cause；批档 §2 finding F-3）；两方向代价不对称（D-MI10 同源）。否决「失败 ⇒ 全死」（原实现方向——正是本批修因） |

## 9. 与既有机制的关系

| 既有 | 关系 |
|---|---|
| `SESSION.md` §6.2 slotSessions / isProcessAlive / slotOccupancy | **上游基建**——L1/L2 直接读它，不重造 |
| `SESSION.md` §6.11（R5/R8/R9 家族） | 相邻但独立——家族管「agent 自知环境身份 / 模式」，本机制管「agent 知同伴」 |

## 10. 不并项与历史沿革

### 10.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现（CLI 端 2026-09-06 落地并提交…）」） | 时点状态行 | 批次语境——现行态已入 §1–§7 |
| 旧档 §7 测试覆盖表（T-L1a..T-F5d + 验收段） | 用例编号集 + 单批验收清单 | 批次材料——行为面由现行测试族覆盖 |
| 旧档 §10 受影响文件表（实现时点 · 含 VSC 镜像行） | 单批文件清单与 VSC 实现坐标 | 一次性材料 + VSC 面坐标（P2 ⇒ VSC 轮）——CLI / 核侧现行坐标已入 §7 |
| 旧档变更记录（2026-09-06 / 2026-09-07） | 历史叙述（评审建议 1–8 全采纳等批序） | 本档自有变更记录；决策结论已入 §8 |

**旧锚映射（死锚 · 2026-09-19）**：旧档锚 ID `D-L1a` / `D-L2a` / `D-L2b` 未并入本档；代码 / 测试注释中的旧锚引点按语义归位：`D-L1a` → §3.2 · `D-L2a` → §3.1 · `D-L2b` → §3.3——**不复活旧 ID**（代码侧引点改否 = 父侧另行处置）。

### 10.2 不并项登记（跨板块——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| VSC 端同构实现的逐文件坐标 | VSC 产品面实现面 | P2 ⇒ VSC 轮（需求侧 VSC 坐标已入 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` 判定句）；双端逐字锚（§3.2 / §3.3 / §4.3 文案）本档在留 |

## 变更记录

- 2026-09-18（**init-block 批 · eng-designer**——承 `docs/batches/2026-09-18-init-block.md` §1）：§3.1 清理面形态收正为**入口一次探测束**
  （`probeOwnersSync` / `probeOwnersAsync` + `ownerState` 三态判据——`cleanDeadOwners` / `usableSlot` / `allocateFresh` / `ensureActive` 零自有 exec）；
  坐标 as-of 更新（`isProcessAlive` 移居 `process-probe.mjs`）；`:74` 行面 `filterDeadOwners` 判据三态化；新增「探测束与有界形态」块；§7 感知面行改指 `process-probe.mjs`；
  **D-MI14 重写**（入口束 + `resumeSlot` async + 两被拒备选）· **D-MI12** 改「本批双面同改」· 新增 **D-MI15**（任何探测必有界 `SYNC_PROBE_MS=2000`）/ **D-MI16**（探测失败 = 未知 ⇒ 保守）。

- 2026-09-18（**判据面收正批（#66）· eng-designer**——承 `docs/batches/2026-09-18-arbiter-face.md` §1）：
  **§5（F4 同步机）整节收正为历史条**（载体三处随 M7 废除全仓零命中——原 5.1 / 5.2 / 5.3 三小节随载体撤除）；**F4 关联行全数删除**（档头括注 · §7 坐标表 F4 行 · §8 D-MI2 行 · §2 B 类清单 checklist 行与标题括注——D8：对象消失 ⇒ 删，历史归本记录与 §5 历史条；**档头项 = 修正轮 2 补收**——评审 id=72 发现 8 余项）。
  语义零改（余面 = §3 / §4 / §6 / §7 其余行）。

- 2026-09-15（**CLI 尾部真批 · 纯新建 · eng-designer**）：建档——`thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并逐条实核（`thincoder-core/{peer-instances,peer-domains,config}.mjs` ·
  `thincoder-core/tools/checklist-sync.mjs` · `thincoder-core/agent/{setup-reminders,setup,dispatch,run-stages}.mjs` · `thincoder-cli/src/cli/make-agent.mjs`）； （迁移期引文——机制已废）
  VSC 实现坐标不并（P2 ⇒ VSC 轮——§10.2）；批次材料 / 状态行 / 用例编号集不并（§10.1）。
- 2026-09-18（**TUI 假死批 · 修正轮-2（设计评审轮 1 的 12 条）· eng-designer**——承 `docs/batches/2026-09-18-tui-freeze.md` §3 轮次 1）：
  §3.1 补 TTL 可测缝（`nowFn` 入同一注入缝）；段内陈旧坐标收正为现状值（`peerInstances` / `batchAlive` / `probeCmdlines` / `peerInstancesTool` 四处）；
  §8 D-MI4 理由列加探测触发判据指针（mtime ∨ TTL → D-MI13）。语义零改。
- 2026-09-18（**TUI 假死修复批 · eng-designer**——承 `docs/batches/2026-09-18-tui-freeze.md` 的 §1）：§3.1 缓存判据收正（mtime ∨ TTL）
  + 探测异步化（`batchAliveAsync` / `probeCmdlinesAsync`，同一注入缝；读面 / `pushPeerReminder` → async）；
  §3.2 补异步形态行；§8 补 D-MI13–D-MI14；判据（身份 / 批量 / 保守保留）与文案零变。
- 2026-09-16（**批 1 CORE-DEFECT-FIXES · eng-designer · 含复审修正轮**）：§3.1 补 **F-MI6 / N-MI6 判定句**（身份校验——标记族命中才计活 · 探测失败保守保留 ·
  判据单源 `thincoder-core/process-probe.mjs`）与判据单源行；§8 补 **D-MI9–D-MI12**；体量读数 232 → 238。复审修正轮：§3.1 再补清理面探测**单次批量**形态（复审 #2）
  与标记族**假阴性误删方向**已知局限（复审 #3）；**签名收正**（2026-09-16）：§3.1 清理面 API = `filterDeadOwners(pid, { alive, cmdline })`（随实现同步——参数具名对齐 `thincoder-core/process-probe.mjs`）。
- 2026-09-18（**TUI 假死批 · 实施后收正轮（fix）· eng-designer**——承 `docs/batches/2026-09-18-tui-freeze.md` §5 与父侧派单）：
  §8 D-MI12 补 **VSC 端差登记**——面③（探测 TTL + 异步化）在 VSC 自持复本
  （`thincoder-vscode/src/extension/peer-instances.mjs` · `thincoder-vscode/src/agent/setup-reminders.mjs`）**未落地**（同步 · 无 TTL），处置归 VSC 轮（不修）。语义零改。
- 2026-09-18（**init-block 批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-init-block.md` §3 发现 6 / 7 / 10）：
  §3.1 补 **VSC 镜像面收正**（判活 / 标记正则本地副本删除 → 引核 `process-probe.mjs`；端侧只留 END / 命名空间薄壳；注入缝转口）与**端侧缓存端差**（TTL 到期 stale-while-revalidate + 启动期异步预热；TTL = 新鲜度上界；`N-MI2` 不受影响）——兑现 2026-09-18「处置归 VSC 轮」登记；
  删修订式表达（清理面形态行「收正 / 改」· 判据单源行「本批新增」）。**零新语义**（VSC 面 = 评审发现 7 的直接导出项）。
- 2026-09-18（**init-block 批 · 设计评审轮 2 修正** · eng-designer——fix 轮 2；承 `docs/batches/2026-09-18-init-block.md` §3 轮次 2 发现 1 / 3 / 5）：
  §3.1 补 **F-MI7 核侧锚**判据条（测试档 + 四路锚：零同步 exec 扫描 / 束 exec 上界 / 有界同步例外锚 / 初始化窗口静默读数）· 同步消费面登记**两处**（`activeSlot` + 占用判定 `slotOccupancy`——`:68` 句与 D-MI14 自述同改）· 本地副本枚举三件套取并统一（实核坐标入 §3.1 副本清单句 `:97` 与 D-MI12 `:213`）· 本批受影响文件指针行改指本批档 §2.3（评审所引 `:86`——现值 `:88`）。
  **零新语义**（= 评审轮次 2 发现的直接导出项；需求档 F-MI7 例外句扩面 = 拟改文交父侧）。
- 2026-09-19（**init-block 批 · fix 轮 3 · eng-designer**——父侧 2026-09-19 裁定落地）：§3.1 端侧缓存端差行补**预热落点**（= panel resolve 面 · 键 = panel cwd——对齐 SWR 缓存键；`activate()` 无 per-cwd 键，多根工作区会预热错键）。
- 2026-09-19（**init-block 批 · fix 轮 · eng-designer**——承批次档 §6）：§3.1 判据条收正——测试档补端半 `zero-sync-exec.test.mjs` · 核 / 端两域分档登记（N3 门禁）· 扫描形态补 `spawnSync`；§10.1 补旧锚映射（`D-L1a` / `D-L2a` / `D-L2b` 语义归位——不复活旧 ID）。**零新语义**。
