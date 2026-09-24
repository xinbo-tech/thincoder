# 多实例协作感知（MULTI-INSTANCE-COLLAB）· 设计

> 板块 = **多实例协作感知**（同一工作目录多副本 agent 互相感知与避让）。
> 本档 = 该机制的**设计面唯一权威**（共享状态分类 / 感知面 L1–L2 / 域面 L3 / 意图认领面 claims / config 原子写 F5 / 决策）。
> 相邻权威 = `docs/core/design/SESSION.md`（§6.2 槽位认领 / 判活 / slotOccupancy——本机制上游存储层基建，复用不重造）·
> `docs/core/design/WORKSPACE.md`（工作区面）· `docs/core/design/SETTINGS-TOOL.md`（settings 工具走 `writeConfigAtomic` 原子写盘）。
> 需求侧 = `docs/core/requirements/MULTI-INSTANCE-COLLAB.md`（F-MI1–F-MI5 / N-MI1–N-MI5）。
> 建档：2026-09-15（**CLI 尾部真批 · 纯新建**——`thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史；VSC 端按双端镜像纪律同构实现——逐字锚 = §3.2 L1 注入文案 + §3.3 schema + §4.3 软提示文案 + §4.4 认领软提示文案，
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

## 4. 域面 L3：文件写域登记 + 冲突检测 + 意图认领（claims）

### 4.1 选型结论

① sessions 目录受 cwd 分片限（登记域是任意文件路径——装不下）；② manifest 扩展被否决（条目级合并只认已知字段、旧版整对象写丢未知字段）；
③ **选定：每实例独立登记文件 + 目录扫描聚合**——end marker 单写者模式同型（写失败容忍 + 损坏按缺失降级 + 崩溃残留判活可清）→ `thincoder-core/peer-domains.mjs`。

### 4.2 登记存储（D-L3a）

- 目录 `~/.thincoder/peers/`，每实例单文件 `{sessionId}.json`（单写者 = 本实例；**足迹面字段** `{sessionId, pid, end, cwd, domains: [绝对路径], updatedAt}`——认领面另有 `claims` / `claimsUpdatedAt` 两字段，见 §4.4.1）。
- **写点 = 回合级**：结构化写工具执行成功时 `recordPeerWrites`（`:258`）记入 `agent._peerWritten`（Set<绝对路径>）→ 回合末 `finalizeAgentTurn` 调 `flushPeerDomains`（`:277`）整写一次（`.tmp + rename` 原子）。**本回合无写入 → 不写**（hot 窗口不被空回合提前清掉）。
- `PEER_WRITE_TOOLS` = 既有 `FILE_MUTATORS` ∪ `file_ops`（后者在 FILE_MUTATORS 之外故显式并入）。
- 目标解析 `peerWriteTargets(tool, args, cwd)`（`:79`）：touchedPaths 优先（apply_patch / edit-batch 多文件）；file_ops 取 source/dest 双算；其余 path 单参兜底；相对路径按 cwd resolve；畸形入参跳过。
- 崩溃残留：聚合时惰性清理（死 pid 文件 unlink——**判活探测失败（null）≠ 死，不得据此删除**）；损坏文件按缺失降级（不删——属主下次 flush 覆盖）。

### 4.3 冲突检测（D-L3b）

`peerDomains(cwd)`（`:179`）聚合本 cwd 其他活实例登记（self 排除）；`conflicts(cwd, targets)`（`:190`）：targets 命中他实例 **hot 域**
（`updatedAt` 在 `HOT_WINDOW_MS = 5 * 60 * 1000` 内——`:37`——且域含 target / 互为包含）→ 返回 `[{ target, by: [{end, pid, sessionId}] }]`。纯只读、不抛（失败按零冲突）。

- **hot 窗口语义**：「写后登记 + hot 窗口」——登记真实足迹，「正在写」弱化为「刚写过」；bash 大通道本就不可拦——诚实边界：L3 覆盖结构化写工具足迹 + hot 提示。
- **路径重叠** `pathsOverlap(a, b)`（`thincoder-core/peer-claims.mjs:74`——`thincoder-core/peer-domains.mjs:34` re-export 保名面）：相等或互为目录包含；区分大小写按平台；分隔符归一。
- **缓存**：聚合结果按 peers 目录 mtime 惰性缓存（目录未变不重扫）；**N-MI3 度量**：单次写工具调用新增开销上限 = 目录 stat 一次；注册 flush = 回合末一次整写。

**dispatch 钩子**（`thincoder-core/agent/dispatch.mjs` + `thincoder-core/agent/run-stages.mjs`）：执行前 `peerCollabNote(agent, tool, args)`（`:218`）查 conflicts——
命中 → 工具结果附**软提示**（不阻止）；成功后 `recordPeerWrites`（仅成功写计入）；routed（ACP 客户端执行）成功同样记账。
**共享钩点**——认领面同点接线（写前命中 / 写后登记见 §4.4.4 / §4.4.3）。

**软提示文案（逐字契约，双端一致）**：

> `[peer-collab] ${target} — another live instance (${who}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`

`who` = 各 `{end} pid={pid}` 以 ", " 连接。无冲突 / 无目标 / 降级 → null（调用方零附加）。
- **分隔符不属逐字锚**：多行提示的行间分隔符不属逐字契约——核逐行 `\n`（`thincoder-core/peer-domains.mjs:250`）、端块内空行 `\n\n`（`thincoder-vscode/src/extension/peer-domains.mjs:259`）；单行文案本体不受影响。

### 4.4 意图认领面（claims · TTL 租约 · P1）

> 定位：把「本实例正在这块文件域活动」做成跨实例可机的**结构化弱信号**（L2——非对话、非消息通道）。
> 与足迹面（D-MI5）**分存**：足迹记「已写过什么」，认领记「正在做哪里、租约到何时」——同实例文件、不同字段、不同时间戳、互不改写。
> 认领**非锁、非预留、非承诺**：零阻断（D-MI6 不动——写照发）；覆盖边界同 L3（仅结构化写工具——bash 大通道不管，诚实边界）。
> 术语注意：本面「认领 / claims」= **意图认领**（文件域级 · 租约）——与 `docs/core/design/SESSION.md` §6.2 的**槽位认领**（slot claim——会话存储隔离）**无关**，两概念不联动。
> 需求档同词两用：N-MI3「不认领**槽位**」/ F-MI7「认领路径」= **槽位面**；F-MI8 / F-MI9 / N-MI7 的「认领 / 认领面」= **本面**（意图认领）。
> 触发面证据（as-of 2026-09-25 · 设计轮实读）：长回合足迹空窗真实存在——足迹 flush 只在 run 收尾落一次（`thincoder-core/agent/run-stages.mjs:154`；端侧更窄 = 仅 depth-0 收尾，
> `thincoder-vscode/src/agent/run-stages.mjs:418-419`），而一次实施 run 可达数十分钟 ⇒ 期间对端零信号。
> 「子代理收尾 flush 足迹」变体 = **已在机制内**（子代理走同一 run 收尾、同点零缺）⇒ 认领面补的是**回合内即时性**，与变体不重叠。

#### 4.4.1 存储与字段（D-MI17）

同 `peers/{sessionId}.json`（单写者 = 本进程，不变）扩两字段：

| 字段 | 属面 | 语义 |
|---|---|---|
| `claims` | 认领面（本批新增） | `[{ target, claimedAt, expiresAt }]`——target = 与写目标同源的绝对路径（文件 / 目录皆可）；两时间戳 = epoch ms |
| `claimsUpdatedAt` | 认领面（本批新增） | 认领字段上次落盘时刻（与足迹面 `updatedAt` 分属两面） |
| `domains` · `updatedAt` | 足迹面（D-MI5——零改） | 既有语义原样（hot 窗口判据只读本面时间戳） |

- **认领对象形态 = 与写目标同源的绝对路径**（`peerWriteTargets` 解析产物——`thincoder-core/peer-domains.mjs:79`）：文件级写记文件、目录级操作（`file_ops`）记目录；**不自动上扩**为目录（精度优先）。
- **覆盖去冗（方向性包含谓词）**：判据 `covers(coarse, fine)` = 相等或 coarse 为 fine 的**目录前缀**（单方向——对称谓词 `pathsOverlap`（`thincoder-core/peer-claims.mjs:74`）不作包含判据；归一 / 大小写同款）。三分支：
  - 已有认领 `covers` 新目标 ⇒ **只续约**（不新增）；新目标 `covers` 已有认领项 ⇒ **替换**（被覆盖项出集、新目标入集）；无包含关系 ⇒ 新目标入集。
  - **不变式 = 集内无被覆盖项**（即集内必为最粗覆盖者）⇒ 覆盖新目标的集内项至多一个（续约对象唯一——不存在多覆盖者择一问题）。
- **分存纪律 = 字段级合并写（read-modify-write）**：认领落盘只改 `claims` / `claimsUpdatedAt`（其余字段逐字保留，含未知字段）；足迹落盘只改 `domains` / `updatedAt`（同法保留认领字段）。
- **落盘原语 = 原子写（`.tmp + rename`）**：核经 `writeSessionFile`（`thincoder-core/session-slots.mjs:128`——与足迹面同一原语、单源）；端同法（`writeRecordAtomic`——`thincoder-vscode/src/extension/peer-claims.mjs:89-94`——tmp+rename）。
  **理由**：两侧聚合缓存以 peers 目录 mtime 为键（核 `thincoder-core/peer-domains.mjs:156-172`；端 `thincoder-vscode/src/extension/peer-domains.mjs:90-111` + 头注 `:8-9`）——rename 翻目录 mtime ⇒ 对端缓存失效、认领**回合内可见**；就地重写（同名单）不动目录 mtime ⇒ 对端不可见（本层立项动因落空）。
- **兼容（双向）**：旧读者忽略新字段（两侧扫描器只校验既有必填字段——`thincoder-core/peer-domains.mjs:111-118`）；旧记录无 `claims` ⇒ 认领面零命中（按缺失降级，不炸）。
- **测试沙箱**：核侧 peers 目录此前零缝 ⇒ 随本批增 `_setPeersDirForTest` / `_resetPeersDirForTest`（形态先例 = 端侧同名缝，`thincoder-vscode/src/extension/peer-claims.mjs:36-37`）。

#### 4.4.2 租约语义（D-MI18）

- **TTL** = `CLAIM_TTL_MS = 30 * 60 * 1000`（30 min）；**续约** = 同目标再次写成功，或目标被已有认领覆盖（续约对象 = 该覆盖认领——§4.4.1）⇒ `expiresAt = now + TTL`（`claimedAt` 保持首次）。
- **过期失效** = 读面按 `expiresAt > now` 过滤 + 本实例落盘时剪除（**不 unlink**——过期不是崩溃残留）。
- **进程死亡即失效** = 复用聚合面既有批量判活（`batchAlive`——`thincoder-core/process-probe.mjs:118`）与死文件惰性清理：属主死 ⇒ 整条记录不可见并随既有清理删除。
- **崩溃残留** = 与足迹面同一路径（死 pid 文件聚合时清理）；探测失败 / 未知 ⇒ 保守不删（D-MI10 零变）。

#### 4.4.3 认领与落盘时机（D-MI18 / D-MI19）

- **认领触发 = 结构化写工具执行成功**（与足迹同一钩子点：核 `thincoder-core/agent/dispatch.mjs:421-423` · 端 `thincoder-vscode/src/agent/execute-tools.mjs:253-261`）——**零新手工动作**；工程模式各里程碑（批点火 / 实施轮派发 / 写轮）**不新增耦合**：实施轮写文件即自动认领。
- **落盘节流**：本次写含新目标（不在上次落盘集内）⇒ 即刻整写（原子写原语见 §4.4.1）；否则仅当距上次落盘 ≥ `CLAIM_RENEW_FLUSH_MS = 60 * 1000` ⇒ 续约落盘；其余 **零 IO**。失败容忍（NF2 同型——下次写重试）。
- **无显式释放面**（D-MI19）：释放只有三条——租约到期 / 属主进程死亡 / 记录被死清理。
- **落盘门控（测试卫生）**：认领落盘前置「本 cwd 会话 manifest 在场」判据（端侧既有 L3 门同法——`thincoder-vscode/src/agent/execute-tools.mjs:189`）；足迹面零改。

#### 4.4.4 写前命中与软提示升级（D-MI20）

- **钩点** = 与既有 L3 预检同点（核 `thincoder-core/agent/dispatch.mjs:358-359` · 端 `thincoder-vscode/src/agent/execute-tools.mjs:187-195`）——一次聚合扫描同时供两面（零二次扫描）。
- **命中判据** = 目标 ∩ 他实例（同 cwd · self 排除）**未过期认领**（`expiresAt > now` ∧ `pathsOverlap`）。
- **软提示文案（逐字契约，双端一致）**：

> `[peer-collab] ${target} — another live instance (${who}) holds a live intent claim on it (claimed ${age}, lease ${left} min left); concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`

`who` = 认领属主 `${end} pid=${pid}`（无 end 则 `pid=${pid}`），仅足迹命中的属主追加 ` (recent write)`，以 ", " 连接；
`age` = `just now`（< 1 min）/ `${n} min ago`；`left` = `max(1, ceil((expiresAt − now) / 60000))`。
- **分隔符不属逐字锚**（同 §4.3 口径）：多行提示的行间分隔符端差（核 `\n` / 端块内 `\n\n`）不入逐字契约——单行文案本体锚不受影响。
- **去重（防刷行）**：同一（目标 × 认领属主）**每 run 至多一行**（`agent._peerNoted` Set——**清空落点 = `flushPeerDomains` 首步**：先于「无写入即返回」早退，去重集不随无写回合泄漏；核侧调用点 = `finalizeAgentTurn` 首行（`thincoder-core/agent/run-stages.mjs:154`）；新属主出现 ⇒ 新行）。
- **优先级**：目标命中认领 ⇒ 出认领行并**抑制该目标足迹行**（不双行）；仅足迹命中 ⇒ 既有足迹文案**零变**（D-MI5 面不动）。
- **端侧混合命中合成（端差定形）**：端侧足迹面 = **单条聚合行**（`thincoder-vscode/src/extension/peer-domains.mjs:211-221`）⇒ 混合命中（同写既有认领命中目标、又有仅足迹命中目标）按 target **过滤聚合列表**——认领命中目标各出认领行（逐字锚同上 · 逐 target）；足迹聚合行剔除已被认领行覆盖的 target 后照原形态拼接；余项为零 ⇒ 该行不出。
  三态（逐字形态）：纯足迹 ⇒ 聚合行零变；纯认领 ⇒ 仅认领行；混合 ⇒ 认领行 + 过滤后聚合行（零双报）。
- **降级**：聚合失败 / 目录缺失 / 记录损坏 / 探测失败 ⇒ 零提示、零抛错（工具主流程永不受认领面影响）。
- **零阻断**：认领命中绝不改变工具执行与结果（写照发——D-MI6 不动）。

#### 4.4.5 成本与降级（N-MI7）

- 单次写调用新增 IO 上界 = **至多一次**实例文件合并写（节流窗内）+ 目录 stat 一次（既有缓存命中零扫描）；无新目标且续约窗内 ⇒ **零 IO**。
- 认领读写失败静默降级（NF2）；聚合面探测失败不缓存空结果（既有语义不变）。

#### 4.4.6 模块落点与双端对位（D-MI21）

| 面 | 落点 |
|---|---|
| 核 · 认领逻辑 | `thincoder-core/peer-claims.mjs`（认领存储 / 租约 / 命中判据 / 文案 / 合并写 / 节流 / `nowFn` 与重置缝；peers 路径与 `pathsOverlap` 归口于此） |
| 核 · 接线 | `thincoder-core/peer-domains.mjs`（`peerCollabNote` 组合认领行 · `recordPeerWrites` 调认领登记 · `flushPeerDomains` 字段级合并写 + `_peerNoted` 首步清空 · 聚合载荷增 `claims`） |
| 核 · 钩点 | `thincoder-core/agent/dispatch.mjs`（写前 / 写后两处——既有钩子内接线，只换调用行 + 3 行；该档 496 行贴硬限——距 500 余 4 行） |
| 端 | `thincoder-vscode/src/extension/peer-domains.mjs`（就地扩；落盘若越 300 软线 ⇒ 认领块外提 `thincoder-vscode/src/extension/peer-claims.mjs`）· 钩点 = `thincoder-vscode/src/agent/execute-tools.mjs` · 去重集清空 = `thincoder-vscode/src/agent/run-stages.mjs` |
| 常量 / 文案锚 | `CLAIM_TTL_MS` · `CLAIM_RENEW_FLUSH_MS` · 认领软提示文案——双端各持副本，**测试对拍等值 / 逐字同串**（N-MI2 各端自持；跨端读取比对形态先例 = `thincoder-vscode/test/prompts-mirror-anchors.test.mjs:40-44`；常量 / 文案同串面 = AC-IC11） |

#### 4.4.7 判据（测试层）

测试档 = `thincoder-core/test/peer-claims.test.mjs`（核半）+ `thincoder-vscode/test/peer-claims.test.mjs`（端半）。
沙箱 = 核 `_setPeersDirForTest` / 端同名缝 + 时钟缝 `_setPeerClaimsTestImpl({ nowFn })` + 判活注入 `_setProcessProbeTestImpl`（`thincoder-core/process-probe.mjs:48`）。
四路锚：① 写入 / 续约 / 节流（落盘计数断言——零真实等待）；② 过期 / 死属主 / 崩溃残留 / 旧记录兼容（注入时钟与判活）；③ 命中 / 文案逐字 / 去重 / 优先级 / 端侧混合命中合成 / 降级；④ 分存回归（认领落盘不改 `domains` / `updatedAt`；足迹落盘不改 `claims`；既有足迹面行为零变）。

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
| 域面 L3 | `thincoder-core/peer-domains.mjs`（`HOT_WINDOW_MS:37` · `peerWriteTargets:79` · `peerDomains:179` · `conflicts:190` · `peerCollabNote:218` · `recordPeerWrites:258` · `flushPeerDomains:277` · 测试缝 `:50/:58`；`pathsOverlap` 归口 `thincoder-core/peer-claims.mjs:74`——本档 re-export `:34`） |
| 意图认领面 | `thincoder-core/peer-claims.mjs`（认领存储 / 租约 / 命中 / 文案 / 合并写 / `nowFn` 缝；peers 路径与 `pathsOverlap` 归口于此）· 接线 = `thincoder-core/peer-domains.mjs` §4.4.6 · 端 = `thincoder-vscode/src/extension/peer-domains.mjs` + `thincoder-vscode/src/extension/peer-claims.mjs`（认领块——越 300 软线外提）+ `thincoder-vscode/src/agent/execute-tools.mjs`（钩点） |
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
| D-MI14 | 清理 / 认领面 = **入口一次探测束 + 判据查表**；`resumeSlot` 整链 **async**（2026-09-18 裁定） | 原逐 pid `isProcessAlive` 形态 = 1 发批量 cmdline + N 发逐 pid 判活 ⇒ 初始化窗口叠 2–3 轮 = 8–12 s 同步独占（批档 `2026-09-18-init-block` §1.1 实测）。现形态：`probeOwnersAsync`（会话起点 / 认领）/ `probeOwnersSync`（**两处同步消费面**——① `activeSlot` 冷路径；② 占用判定 `slotOccupancy`）各 ≤1+≤1 exec；`SYNC_PROBE_MS` = 2 s 紧界 + 零探测早退；例外锚 = 本档 §3.1「判据（测试层 · F-MI7）」条 ③，到期条件随需求档 `MULTI-INSTANCE-COLLAB.md` F-MI7 例外句（本批登记 · 不重述）。被拒备选：① 全链 async（`activeSlot` 有 4 处同步消费面——`session.mjs` `saveSession` · `token-ttl` · CLI 三条命令；`slotOccupancy` 调用面同形——`session.mjs` 切换链 + CLI TUI / ACP 命令 + VSC 会话切换消息面，await 化需逐面传播）；② 维持逐 pid（成本不除） |
| D-MI12 | **常态各面独立实现 → 本批双面同改（同源缺陷冻结级特例 · 2026-09-18 裁定）**：本批（`2026-09-18-init-block`）核 + VSC 镜像**同批落地**；此后批次回常态（各面独立实现） | 同源缺陷为冻结级（初始化窗口 8–12 s 同步独占）且两面对**同一 manifest**——单面修则另一端仍旧形态（用户裁定面 = 批档 §1.2③ 明列两实现面同批落地）。**另注**：VSC 宿主族命中面天然包含他窗口 VS Code 宿主 ⇒ 该局限与 D-MI10 同向（宁可多留）。**VSC 面处置**：镜像 `cleanDeadOwners` / `usableSlot` / `resumeSlot` 同批 async + 束化；`peer-instances.mjs` 本地同步副本（`batchAlive` · `probeCmdlines` · `classifyEnd` 复本——实核坐标 `:39` / `:74` / `:88`）**单源化**（引核 `thincoder-core/process-probe.mjs`，本地副本删）；`pushPeerReminder` 改**只读缓存 + 启动期异步刷新**（每回合零同步 exec）。核面判据 = D-MI13 |
| D-MI15 | **任何探测必有界**：同步形态 `SYNC_PROBE_MS = 2000`（逐 pid 兼容面 `isProcessAlive` 同）；异步形态 10 s / 15 s（不阻塞，不变量级）；**无 timeout 的 `execSync` 为禁形** | 本机实测 `tasklist` 单发 >10 s 且 31 个 stuck 实例存活 40–220 s+（父进程已死——批档 §1.1 证据 5）：无界同步 exec = 事件循环无界冻结。紧界 + 失败降级（未知 ⇒ 保留）是唯一安全组合。否决「维持 10 s 同步界」（同步独占的代价比异步高一级——10 s 冻结已达用户可感级） |
| D-MI16 | 探测**失败**（束 / 批量返回 `null`）在认领 / 占用面 = **未知**：条目保留 · 槽不可认领/不判空闲；仅显示面（L1/L2 同伴列表）可降级为空 | 「探测失败 ⇒ 全死」的实际后果 = 清理面**删活属主条目** + 恢复面**认领活属主的槽** = 双进程同槽（本批 root cause；批档 §2 finding F-3）；两方向代价不对称（D-MI10 同源）。否决「失败 ⇒ 全死」（原实现方向——正是本批修因） |
| D-MI17 | 认领存储 = **同实例文件分字段**（`claims` / `claimsUpdatedAt` 与足迹 `domains` / `updatedAt` 各守其字段——落盘为字段级合并写） | 复用单写者实例文件 + 一次聚合扫描供两面（N-MI1 不新建平行存储）。否决「独立第二文件」：目录扫描与死清理各增一套（且旧读者会把它当损坏件）；否决「仅内存」：跨进程不可见（本层目的落空） |
| D-MI18 | 认领时机 = **结构化写成功即登记**；落盘 = 新目标即刻 + 续约节流（`CLAIM_RENEW_FLUSH_MS = 60000`）；TTL = `CLAIM_TTL_MS = 30 * 60 * 1000` | 零新手工动作（写钩子既有）；租约以真实写为锚（零假足迹——D-MI5 否决「写前预登记」的口径不变）。否决「随足迹 run 收尾 flush」（长回合空窗未消——本层立项动因）；否决「每次写都落盘」（无谓 IO——节流窗内零 IO） |
| D-MI19 | 释放 = **租约到期 / 属主进程死亡 / 死清理**——无显式释放面 | 否决「批收口显式释放」（批与文件非一一对应 + 需新动作 + 早释隐藏活认领）；否决「轮末释放」（长回合中段即失信号——正是本层要补的窗） |
| D-MI20 | 命中反馈 = **认领级软提示**（逐字锚）+ 每（目标 × 属主）每 run 一次去重；认领行**抑制同目标足迹行** | 同频道升级（D-MI6 零阻断不动）；去重防刷行（30 min 租约下每写都提示 = 噪音）。否决「新开第二提示通道」（双通道难辨、噪声翻倍） |
| D-MI21 | 双端 = **语义同源 · 各端自持**（核拆 `thincoder-core/peer-claims.mjs`；端就地扩——越 300 软线再拆） | N-MI2 实现各自独立；文案 / 两常量逐字对拍（测试断言）。否决「两端同构同拆」（端侧行数余量足够——拆档徒增面） |

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
- 2026-09-22（**措辞退场批（wording-retire）· 点修轮（发现 1 语族补扫）· eng-designer**——承用户 2026-09-22 裁定（措辞退场 · 语族补扫）；批档 = `docs/batches/2026-09-22-wording-retire.md`）：§8 D-MI12 行——「面间不追赶」旧名从活面退场（改「常态各面独立实现 / 本批双面同改 = 同源缺陷冻结级特例」平实措辞）；**零新语义**；旧字面仅存记录面 / 归档面。
- 2026-09-22（**措辞退场批（wording-retire）· 评审轮 1 发现 #4 · 父侧直接执行裁定 · eng-designer**——承 `docs/batches/2026-09-22-wording-retire.md` §3 轮次 1 发现 #4）：§8 D-MI14 / D-MI12 两行去日期式修订标记——「收正」式标记转裁定语；D-MI12 特例括注同转 + 「核 + VSC 镜像同步收正」改「同批落地」+ 理由列引文改间接述。决策语义 / 锚值零改（常态 / 双面同改特例并存）。同族更大面（全仓修订式表达清理）= 台账 #225。
- 2026-09-25（**intent-claims 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-25-intent-claims.md` §1.1 · 台账 #23）：新增 **§4.4 意图认领面（claims · TTL 租约 · P1）**——存储分字段 / 租约 30 min 与续约节流 /
  写成功即认领 / 写前命中软提示升级（逐字锚）/ 成本与降级 / 模块落点与双端对位 / 测试判据（§4.4.1–§4.4.7）；§4 标题与档头逐字锚清单同改；§7 坐标表增「意图认领面」行；§8 增 **D-MI17–D-MI21**。
- 2026-09-25（**intent-claims 批 · 设计评审轮 1 修正 · eng-designer**——fix 轮；承 `docs/batches/2026-09-25-intent-claims.md` §3 轮次 1 发现 1–9）：
  §4.4.1 补**落盘原语 = 原子写**（核 `writeSessionFile` / 端 tmp+rename——两侧目录 mtime 缓存失效理由）与**覆盖去冗方向性判据**（`covers` 三分支 + 集内无被覆盖项不变式）；
  §4.4.2 续约对象对齐；§4.4.3 落盘句加原语指针；§4.4.4 补**核侧 `_peerNoted` 清空落点**（`flushPeerDomains` 首步）与**端侧混合命中合成**（过滤聚合列表）；
  §4.4.6 常量行先例指针改引跨端读取比对形态；§4.2 / §4.3 各补认领面指针；术语注意扩到需求档用法（N-MI3 / F-MI7 = 槽位面）。**零新语义**。
- 2026-09-25（**intent-claims 批 · 实施后收正轮（fix）· eng-designer**——承 `docs/batches/2026-09-25-intent-claims.md` §5 上抛 2 / 父侧派单）：
  文档面 re-anchor——§4.2 / §4.3 / §4.4 / §7 各坐标随实施落盘逐锚实读重指（核 `thincoder-core/peer-domains.mjs` · 端 `thincoder-vscode/src/agent/execute-tools.mjs` / `thincoder-vscode/src/extension/peer-domains.mjs`）；
  `peerCollabNote` 签名按实现收正为 `(agent, tool, args)`；`pathsOverlap` 归口指针改指 `thincoder-core/peer-claims.mjs`；
  两新档 / 两测试档「拟新增」标记去除；§4.3 / §4.4.4 明写**分隔符不属逐字锚**（端块内 `\n\n` vs 核 `\n`——端差登记）。
  **零新语义**（锚 / 口径 / 实态同步面）。
