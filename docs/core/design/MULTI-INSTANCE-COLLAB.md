# 多实例协作感知（MULTI-INSTANCE-COLLAB）· 设计

> 板块 = **多实例协作感知**（同一工作目录多副本 agent 互相感知与避让）。
> 本档 = 该机制的**设计面唯一权威**（共享状态分类 / 感知面 L1–L2 / 域面 L3 / checklist 同步 F4 / config 原子写 F5 / 决策）。
> 相邻权威 = `docs/core/design/SESSION.md`（§10 槽位认领 / 判活 / slotOccupancy——本机制上游存储层基建，复用不重造）·
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
| 会话数据文件 | `~/.thincoder/sessions/{cwd-hash}.json.N` | slotSessions 进程认领 + isProcessAlive + slotOccupancy + end marker + .bak 轮转 + mtime 门控（`SESSION.md` §10） |
| 会话 manifest | 同目录 `.json.manifest` | 条目级合并 + deletions 显式表达 + active 单值指针 |
| 向量 / 个人记忆 | `~/.thincoder/memory.db` | sqlite WAL 并发（低险） |

### B 类：裸写无防护（本机制覆盖——F4 / F5）

| 共享物 | 路径 | 风险 |
|---|---|---|
| checklist / checklist-done | `{cwd}/.thincoder/checklist{,-done}.md` | 🔴 裸整文件覆盖 ⇒ 并发写丢项（F4） |
| config.json | `~/.thincoder/config.json` | 🔴 全局共享；整节内存写回抹掉对端改动（F5——用户实证「一端改配置另一端出现意外」） |
| 项目元数据 | `{cwd}/.thincoder/advisor.md` 等 | 🔵 低活跃低险 |

### C 类：按文件设计天然低冲突（无需协调）

项目 memory（每 entry 独立文件）· 日志 / tmp（appendFile 原子追加）· traces（按 sessionKey 分文件）·
checkpoints（追加式独立快照目录——ID 随机后缀防碰撞 + 清理幂等；语义上同 cwd 多实例快照都应可恢复，隔离反而破坏用途）。

### D 类：工作区本身（L1/L2/L3 主战场）

repo 代码 / 文档 / git 操作无跨实例协调——同时改同文件互相覆盖（实况曾靠口头回避）。

## 3. 感知面：L1 回合注入 / L2 查询工具

数据源全部复用 SESSION §10（manifest `slotSessions` + 判活）——**纯只读**（N-MI3，感知面结构化上无任何 fs 写调用）。

### 3.1 `peerInstances(cwd)`（`thincoder-core/peer-instances.mjs:171`——双端同构）

- 读 manifest `slotSessions` → 按 sessionId（`{pid}-{ts}-{rand}` 进程级）去重分组 → slots 数组；
- **一次批量判活**（`batchAlive(pids)`——`:76`，单次 tasklist/ps 全量比对）；探测失败（null）≠ 全死——按「无活伴」降级（不显示幽灵同伴）；
- self = `sessionId === getSessionId()`（本进程恒活不查）；
- **端字段**：`probeCmdlines(pids)`（`:106`）一次 exec 拿全部 pid+cmdline，`VSC_END_RE`（extensionHost 族）命中 → `vscode`，其余 → `cli`；失败 → end 缺省；
- **惰性缓存**：manifest mtime 未变 → 直接返回缓存快照（零 exec 零读）；缺失 / 损坏 → `[]`（不缓存空结果）；缓存上限 `CACHE_MAX = 64`；
- 测试注入缝：`_setPeerInstancesTestImpl({ aliveFn, cmdlineFn })` / `_resetPeerInstancesTestImpl()`（`:37` / `:44`——注入即清缓存）。

### 3.2 L1 回合注入（`pushPeerReminder`）

装配 = `thincoder-core/agent/setup-reminders.mjs`；时序（`setup.mjs`，depth-0）= env-state 之后、time reminder 之前（time 保持 LAST——prefix-cache 契约）。
形态 = **depth-0、transient:true**（同 env-state 纪律）；无同伴零开销（惰性缓存）；任何感知失败静默跳过（注入绝不打断回合）。

**注入文案（逐字契约，双端一致）**：

> `[System reminder: 本目录另有 ${peers.length} 个活跃 thincoder（${who}）——文件操作注意避让]`

`who` = 各同伴 `{end} pid={pid}`（有 end 时）或 `pid={pid}`，以「、」连接。有同伴才注入，每回合注入。

### 3.3 L2 查询工具（`peer_instances`）

只读工具（无参、readonly）返回 `peerInstances(cwd)` 去 self——agent 主动查，不依赖注入时机。
装配：CLI = `thincoder-cli/src/cli/make-agent.mjs`（挂 `peerInstancesTool`——`thincoder-core/peer-instances.mjs:219`）；VSC = registry 同构。

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

**dispatch 钩子**（`thincoder-core/agent/dispatch.mjs` + `agent/run-stages.mjs`）：执行前 `peerCollabNote(cwd, tool, args)`（`:214`）查 conflicts——
命中 → 工具结果附**软提示**（不阻止）；成功后 `recordPeerWrites`（仅成功写计入）；routed（ACP 客户端执行）成功同样记账。

**软提示文案（逐字契约，双端一致）**：

> `[peer-collab] ${target} — another live instance (${who}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`

`who` = 各 `{end} pid={pid}` 以 ", " 连接。无冲突 / 无目标 / 降级 → null（调用方零附加）。

## 5. checklist 并发同步（F4）

双端 checklist 同路径 `{cwd}/.thincoder/checklist.md` / `checklist-done.md`——并发写原为裸整文件覆盖（丢项）。
写入收口 = `thincoder-core/tools/checklist-sync.mjs`（`flushWrite`——门控 + 合并 + 序列化）。`.bak` 不做（cwd 在 git 仓库内——git 兜底现场）。

### 5.1 基线规则

- 基线 = 本读-改-写链内**最近一次 stat 的 mtime**（`noteReadBaseline` 读链登记；stat→read 序——微窗口写入只造成假合并，绝不漏检静默覆盖）；
- **本进程自写后刷新基线**——防自写误判并发（merged 标志 / 重分配分支不被误触发）。

### 5.2 flushWrite 语义与合并规则（ID union）

`flushWrite(filePath, items, { reread, doneFile, isDone })`：写前 stat ≠ 基线（磁盘被并发改过）→ 重读磁盘 + 合并（ID 是天然合并键）→ 重写后返回 `{ merged, items }`
（merged=true 时 items 为落盘真相——本端节点原地重分配，调用方引用即最终 ID）。

- 本端新增 + 盘上他端新增都保留；done 集合 union；
- **ID 冲突**：同 ID 不同文本 → 盘上保留、本端项重分配（max+1 续分配，子树 ID 前缀同步换新）；同 ID 仅状态不同 → `in_progress` 胜 `pending`；同 ID 同文本 → 去重，子树仍逐层合并；
- **归档排除**：checklist 合并按 done 文件归档根 ID 排除（并发 mark-done 的旧 pending 副本不复活已归档项）；`checklist-done.md` 自身合并 = **纯 union**；
- 层内递归合并：磁盘序在前；重分配 max 计算域 = 双端全树 + 归档根。

### 5.3 测试缝

`_setWriteGateHookForTest(fn)`——写前门控处注入「对端写盘」钩子（伪属主范式，无真 spawn）；生产不设置（null → 零行为影响）。

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
| 感知面 L1/L2 | `thincoder-core/peer-instances.mjs`（`peerInstances:171` · `batchAlive:76` · `probeCmdlines:106` · `peerInstancesTool:219` · 测试缝 `:37/:44`） |
| 域面 L3 | `thincoder-core/peer-domains.mjs`（`HOT_WINDOW_MS:26` · `peerWriteTargets:71` · `pathsOverlap:92` · `peerDomains:183` · `conflicts:194` · `peerCollabNote:214` · `recordPeerWrites:231` · `flushPeerDomains:248` · 测试缝 `:45/:52`） |
| L1 注入装配 | `thincoder-core/agent/setup-reminders.mjs`（`pushPeerReminder`）· `thincoder-core/agent/setup.mjs`（注入时序：env-state 后 time 前） |
| L3 钩子 | `thincoder-core/agent/dispatch.mjs` + `thincoder-core/agent/run-stages.mjs`（写前检测 / 成功记录 / 回合末 flush） |
| L2 工具装配（CLI） | `thincoder-cli/src/cli/make-agent.mjs` |
| F4 同步机 | `thincoder-core/tools/checklist-sync.mjs`（`flushWrite` + 基线规则）；`thincoder-core/tools/checklist.mjs`（parse / add / mark 走 flushWrite） |
| F5 原子写 | `thincoder-core/config.mjs`（`writeConfigAtomic`——`:29` export · `:242` 自用迁移面）；写点收口 = `thincoder-cli/src/tui/{config-helpers,pickers,cmd-mcp,cmd-config}.mjs` + `src/cli/setup-wizard.mjs` + `thincoder-core/agent-tools/settings.mjs` |

## 8. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-MI1 | F5 冲突处置 = **放弃 + 提示重试** | 用户显式操作，重试成本低。否决「自动合并」（猜测合并不如重试安全） |
| D-MI2 | F4 **不做 .bak** | cwd 在 git 仓库内——git 兜底现场 |
| D-MI3 | L1/L2 端字段 = **批量 cmdline 探测** | 一次 Get-CimInstance/ps 拿全部 pid+cmdline。否决「每 pid 一次 exec」（成本） |
| D-MI4 | L1 注入频率 = **每回合**（有同伴时） | 一致可预期；成本 = 回合一次 stat + manifest 变了才批量判活 |
| D-MI5 | L3 语义 = **写后登记 + hot 窗口**（5 分钟） | 记录真实足迹；bash 大通道本就不可拦（诚实边界）。否决「写前预登记」（假足迹） |
| D-MI6 | L3 冲突反馈 = **工具结果附软提示**（不阻止） | 范围边界——避让是建议非锁 |
| D-MI7 | L3 存储 = 每实例独立登记文件 + 目录扫描聚合 | §4.1——否决 sessions 目录受 cwd 分片限 / manifest 扩展（未知字段丢失） |
| D-MI8 | 感知面**纯只读** + 惰性缓存 + 批量判活 | N-MI3——不新建平行存储，复用 SESSION §10 基建 |

## 9. 与既有机制的关系

| 既有 | 关系 |
|---|---|
| `SESSION.md` §10 slotSessions / isProcessAlive / slotOccupancy | **上游基建**——L1/L2 直接读它，不重造 |
| `SESSION.md` §11（R5/R8/R9 家族） | 相邻但独立——家族管「agent 自知环境身份 / 模式」，本机制管「agent 知同伴」 |

## 10. 不并项与历史沿革

### 10.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现（CLI 端 2026-09-06 落地并提交…）」） | 时点状态行 | 批次语境——现行态已入 §1–§7 |
| 旧档 §7 测试覆盖表（T-L1a..T-F5d + 验收段） | 用例编号集 + 单批验收清单 | 批次材料——行为面由现行测试族覆盖 |
| 旧档 §10 受影响文件表（实现时点 · 含 VSC 镜像行） | 单批文件清单与 VSC 实现坐标 | 一次性材料 + VSC 面坐标（P2 ⇒ VSC 轮）——CLI / 核侧现行坐标已入 §7 |
| 旧档变更记录（2026-09-06 / 2026-09-07） | 历史叙述（评审建议 1–8 全采纳等批序） | 本档自有变更记录；决策结论已入 §8 |

### 10.2 不并项登记（跨板块——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| VSC 端同构实现的逐文件坐标 | VSC 产品面实现面 | P2 ⇒ VSC 轮（需求侧 VSC 坐标已入 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` 判定句）；双端逐字锚（§3.2 / §3.3 / §4.3 文案）本档在留 |

## 11. 体量与拆分规划（R24a）

**实测行数**：本档 **221 行**（根层新建 · as-of 2026-09-15）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 纯新建 · eng-designer**）：建档——`thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并逐条实核（`thincoder-core/{peer-instances,peer-domains,config}.mjs` ·
  `thincoder-core/tools/checklist-sync.mjs` · `thincoder-core/agent/{setup-reminders,setup,dispatch,run-stages}.mjs` · `thincoder-cli/src/cli/make-agent.mjs`）；
  VSC 实现坐标不并（P2 ⇒ VSC 轮——§10.2）；批次材料 / 状态行 / 用例编号集不并（§10.1）。
