# 多实例协作感知（同 cwd 多副本协作）

> 板块：agent 协作感知。状态：**已实现**（CLI 端 2026-09-06 落地并提交——感知 L1/L2/L3 + checklist 同步 F4 + config 原子写 F5；本文档 2026-09-07 重写为人类可读当前态）。
> 权威源（CLI）：`thincoder-core/peer-instances.mjs`（感知面 L1/L2）、`thincoder-core/peer-domains.mjs`（域面 L3）、`thincoder-core/tools/checklist-sync.mjs`（checklist 并发同步机 F4）、`thincoder-core/config.mjs` `writeConfigAtomic`（config 原子写 F5）。
> 装配点（CLI）：`src/agent/setup-reminders.mjs`（L1 注入 `pushPeerReminder`）、`src/agent/setup.mjs`（回合注入时序）、`src/agent/dispatch.mjs` + `src/agent/run-stages.mjs`（L3 检测/记录/flush 钩子）、`src/cli/make-agent.mjs`（`peer_instances` 只读工具装配）、`src/tui/config-helpers.mjs` 等（F5 写点收口）。
> 关联：`SESSION.md` §10（slotSessions/isProcessAlive/slotOccupancy——本机制上游存储层基建，复用不重造）、`SETTINGS-TOOL.md`（settings 工具走 `writeConfigAtomic` 原子写盘）。
> 范围：CLI（thincoder）+ VS Code（thincoder-vscode）双端——同一 `~/.thincoder/sessions/` / `~/.thincoder/peers/` 目录下的多实例协作。VS Code 端按双端镜像纪律同构实现（双端逐字锚：§3.2 L1 注入文案 + §3.3 schema + §4.3 软提示文案）。

## 变更记录

- 2026-09-06：立项 + 需求 + 设计 + 实现（R10——三级感知 L1 注入/L2 查询/L3 文件域 + checklist 协调 F4 + config 原子写 F5；用户裁定全量一次设计；六个决策点全按推荐 A 落地；评审建议 1-8 全采纳）。来源：用户实测"同目录多副本靠口头回避"。
- 2026-09-07：重写为当前态（格式正常化、历史变更流水账折叠为本记录）。

---

> 需求层已迁出（2026-09-10 需求层拆分批）：本板块需求见 `../requirements/MULTI-INSTANCE-COLLAB.md`——本档保留设计+测试层。

---

## 2. 现状：共享状态四分类

多实例同 cwd 时共享的状态分四类（2026-09-06 完整梳理——决定哪些需协调、哪些天生安全）。**判断标准是写入语义**：共享单一文件（读-改-写竞态 → 需 mtime 门控/合并）vs 追加独立快照/分文件（天生无冲突 → 无需隔离）。

### A 类：已有防护（存储层会诊修过——复用其基建）

| 共享物 | 路径 | 防护机制 |
|---|---|---|
| 会话数据文件 | `~/.thincoder/sessions/{cwd-hash}.json.N` | slotSessions 进程认领 + isProcessAlive + slotOccupancy + end marker + .bak 轮转 + mtime 门控（SESSION.md §10） |
| 会话 manifest | 同目录 `.json.manifest` | 条目级合并 + deletions 显式表达 + active 单值指针（§10 会诊产物） |
| 向量/个人记忆 | `~/.thincoder/memory.db` | sqlite WAL 并发（低险） |

### B 类：裸写无防护（本机制覆盖）

| 共享物 | 路径 | 现状 | 风险 |
|---|---|---|---|
| checklist | `{cwd}/.thincoder/checklist.md` | 裸整文件覆盖（CLI/VSC 同路径同构） | 🔴 并发写覆盖丢项（F4） |
| checklist-done | 同目录 `checklist-done.md` | 裸覆盖 | 🟡 同型（F4 一并覆盖） |
| config.json | `~/.thincoder/config.json` | 裸写整文件覆盖；读-改-写窗口无 mtime 门控 | 🔴 全局共享（所有 cwd 所有实例）；用户实证"一端改配置另一端出现意外"（F5） |
| 项目元数据 | `{cwd}/.thincoder/advisor.md` 等 | 低活跃 | 🔵 低险 |

### C 类：按文件设计天然低冲突（无需协调）

| 共享物 | 路径 | 为何低险 |
|---|---|---|
| 项目 memory | `{cwd}/.thincoder/memory/*.md` | 每 entry 独立文件（"git 友好、避免冲突"） |
| 日志 | `~/.thincoder/logs/`、`{cwd}/.thincoder/tmp/` | appendFile 追加（原子） |
| traces | `~/.thincoder/traces/` | appendFile + 按 sessionKey 分文件 |
| checkpoints | `~/.thincoder/checkpoints/{cwd-hash12}/` | **追加式独立快照目录**：ID 随机后缀防同毫秒碰撞 + 清理幂等（按 ID sort 删最旧到 MAX=100）；快照天生无共享可变状态；语义上"同 cwd 多实例快照都应可恢复"——隔离反而破坏用途 |

### D 类：工作区本身（最深竞争点——L3 主目标）

| 共享物 | 现状 | 风险 |
|---|---|---|
| repo 代码/文档文件 | 无跨实例协调（各实例独立 read/write/edit/bash） | 🔴 同时改同文件互相覆盖——实况：靠口头回避 |
| git 操作 | 无跨实例协调（checkpoint 快照各自为政） | 🟡 |
| docs/ 设计文档 | 无协调 | 🟡（多 agent 并行改设计文档） |

**结论**：A 类已解决（复用基建，不重造）；B 类补并发防护（F4/F5）；C 类安全（含 checkpoints——排查确认无需隔离）；D 类是 L1/L2/L3 主战场。

---

## 3. 感知面：L1 回合注入 / L2 查询工具

感知数据源全部复用 SESSION §10：manifest `slotSessions`（各活进程认领的槽）+ `isProcessAlive`——纯只读（N3，本模块结构化上无任何 fs 写调用）。

### 3.1 `peer-instances.mjs`（`thincoder-core/peer-instances.mjs`——双端同构）

- **`peerInstances(cwd)`** → `[{ pid, sessionId, slots, end?, self }]`：
  - 读 manifest `slotSessions` → 按 sessionId 去重分组（sessionId = `{pid}-{ts}-{rand}` 进程级）→ slots 数组；
  - **一次批量判活**（`batchAlive(pids)`——单次 tasklist/ps 全量 PID 集合比对，修复 `isProcessAlive` 每 pid 一次 execSync 的成本）；探测失败（返回 null）≠ 全死——只读面按"无活伴"降级（不显示幽灵同伴），域面据此不执行死清理；
  - self = `sessionId === getSessionId()`（本进程，恒活不查）；
  - 端字段（决策③ A：批量 cmdline 探测）——`probeCmdlines(pids)` 一次 exec 拿全部 pid+cmdline，`VSC_END_RE`（`--extensionDevelopmentPath|--type=extensionHost|extensionHostProcess`）命中 → `vscode`，其余 → `cli`；探测失败 → end 字段缺省；
  - **惰性缓存**：manifest mtime 未变 → 直接返回缓存快照（零 exec/零读）；manifest 缺失/损坏 → `[]`（按缺失降级，不缓存空结果——stat 一次成本）。缓存有上限（CACHE_MAX=64，旧条目先出）。
- **测试注入缝**：`_setPeerInstancesTestImpl({ aliveFn, cmdlineFn })` / `_resetPeerInstancesTestImpl()`——default null 生产行为不变；注入即清缓存（测试间不串）。

### 3.2 L1 回合注入（`pushPeerReminder`）

仿 `pushEnvStateReminder` 形态：**depth-0、transient:true**（注入纪律同 env-state），无同伴零开销（惰性 mtime 缓存保证 manifest 未变零 exec）。任何感知失败静默跳过（注入绝不打断回合）。装配时序（setup.mjs，depth-0）：env-state 之后、time reminder 之前——time reminder 保持 LAST（prefix-cache 契约）。

**注入文案（逐字契约，双端一致）**：

> `[System reminder: 本目录另有 ${peers.length} 个活跃 thincoder（${who}）——文件操作注意避让]`

其中 `who` = 各同伴 `{end} pid={pid}`（有 end 时）或 `pid={pid}`，以"、"连接。有同伴（非 self > 0）才注入，每回合注入。

### 3.3 L2 查询工具（`peer_instances`）

只读工具 `peer_instances`（无参、readonly）返回 `peerInstances(cwd)`（去掉 self）——agent 主动查，不依赖注入时机。装配：CLI `make-agent.mjs`（挂感知模块导出 `peerInstancesTool`）/ VS Code registry。

**schema description 逐字锚（2026-09-06 定稿，双端照抄——禁止自行解释）**：

> "peer_instances — read-only: list other live ThinCoder instances sharing this workspace cwd. Returns [{ pid, end, sessionId, slots }]; never includes self; pure read — writes nothing."

字段白名单（N4）：返回字段仅 `{pid, end, sessionId, slots}`——出现任何其他键（key/内容类）即红。纯只读：查询路径 fs 写点计数 = 0。

---

## 4. 域面 L3：文件写域登记 + 冲突检测

### 4.1 选型

①sessions 目录受 cwd 分片限（登记域是任意文件路径——装不下）；②manifest 扩展被否决（SESSION §10.1 NF1：manifest 条目级合并只认已知字段、旧版整对象写丢未知字段）；③**每实例独立登记文件 + 目录扫描聚合**——end marker 单写者模式同型（写失败容忍 + 损坏按缺失降级 + 崩溃残留 isProcessAlive 判活可清）。→ `thincoder-core/peer-domains.mjs`（评审修正 #8：独立文件，防 300 行超限）。

### 4.2 登记存储（D-L3a）

- 目录 `~/.thincoder/peers/`，每实例单文件 `{sessionId}.json`（单写者 = 本实例；内容 `{sessionId, pid, end, cwd, domains: [绝对路径], updatedAt}`）。
- **写点 = 回合级**：结构化写工具执行成功时经 `recordPeerWrites` 把实际写过的文件记入 `agent._peerWritten`（Set<绝对路径>，回合级）→ 回合末 `finalizeAgentTurn` 调 `flushPeerDomains` 整写一次（`.tmp+rename` 原子——`writeSessionFile`）。**本回合无写入 → 不写**（文件按自身 updatedAt 自然过期——hot 窗口不被空回合提前清掉；低频 N3）。
- `PEER_WRITE_TOOLS` = 既有 `FILE_MUTATORS`（write/edit/insert_after/hashline_edit/apply_patch/delete）∪ `file_ops`（在 FILE_MUTATORS 之外故显式并入）。
- 目标解析 `peerWriteTargets(tool, args, cwd)`：tool.touchedPaths 优先（apply_patch/edit-batch 多文件）；file_ops 无 touchedPaths——source/dest 双算；其余 path 单参兜底。相对路径按 cwd resolve 为绝对路径；解析失败/畸形入参跳过（零目标 = 无检测无登记）。
- 崩溃残留：聚合时惰性清理（`scanPeersDir` 读到死 pid 文件 → unlink 删除——isProcessAlive 一次批量；**判活探测失败（null）≠ 死——不得据此删除**）；损坏文件按缺失降级（不删——NF2 同型，属主下次 flush 覆盖）。
- 端间可见：目录扫描其他活实例文件 → domains 汇总。

### 4.3 冲突检测（D-L3b）

`peerDomains(cwd)` 聚合本 cwd（normalizeCwd 同构比较）的其他活实例登记（self 排除）。`conflicts(cwd, targets)`：targets（绝对路径）命中他实例 **hot 域**（updatedAt 在 HOT_WINDOW_MS 内且域含 target/互为包含）→ 返回 `[{ target, by: [{end, pid, sessionId}] }]`。纯只读、不抛（失败按零冲突）。

- **hot 窗口**：`HOT_WINDOW_MS = 5 * 60 * 1000`（决策⑤ A——"写后登记 + hot 窗口"语义：登记真实足迹，"正在写"弱化为"刚写过"，5 分钟内视为 hot）。bash 大通道本就不可拦——诚实边界：L3 覆盖结构化写工具足迹 + hot 提示。
- **路径重叠** `pathsOverlap(a, b)`：相等或互为目录包含（file_ops 目录级操作/delete 整目录语义）；区分大小写按平台（Windows 不区分）；分隔符归一。
- **缓存（评审修正 #2）**：聚合结果按 peers 目录 mtime 惰性缓存（目录未变不重扫）；死清理删文件改目录 mtime——以清理后的 mtime 缓存。**N3 度量**：单次写工具调用新增开销上限 = 目录 stat 一次（缓存命中零扫描）；注册 flush = 回合末一次整写。

**dispatch 钩子**（dispatch.mjs，结构化写工具执行路径）：执行前 `peerCollabNote(agent.cwd, tool, args)` 查 conflicts——命中他实例 hot 域 → 工具结果附**软提示**（决策⑥ A：不阻止）；成功后 `recordPeerWrites`（仅成功写计入"实际写过"——检测+记录一次完成）。routed（M2 ACP 客户端执行）成功同样记账。

**软提示文案（逐字契约，双端一致）**：

> `[peer-collab] ${target} — another live instance (${who}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`

其中 `who` = 各 `{end} pid={pid}`，以 ", " 连接。无冲突/无目标/降级 → null（调用方零附加）；感知失败绝不打扰工具执行。

---

## 5. checklist 并发同步（F4）

双端 checklist 同路径 `{cwd}/.thincoder/checklist.md` / `checklist-done.md`——多实例并发写原为裸整文件覆盖（丢项）。写入收口到 `thincoder-core/tools/checklist-sync.mjs`（`flushWrite`——门控 + 合并 + 序列化；自 checklist.mjs 拆出，防超 300 行 advisory 线）。`.bak` 不做（决策② A：cwd 在 git 仓库内——git 兜底现场）。

### 5.1 基线规则

- 基线 = 本读-改-写链内**最近一次 stat 的 mtime**（`noteReadBaseline` 在读链登记；读前 stat——stat→read 序，对端在读与 stat 微窗口写入只造成假合并，绝不漏检静默覆盖）。
- **本进程自写后刷新基线**（parse 规范化写回 / flushWrite 写后重 stat 记基线）——防自写误判并发（union 幂等内容无害，但 merged 标志/重分配分支不被误触发）。

### 5.2 flushWrite 语义

`flushWrite(filePath, items, { reread, doneFile, isDone })` 收口 parse 规范化写回 / add / mark 双写三写点：写前 stat ≠ 基线（磁盘被对端并发改过）→ 重读磁盘 + 合并（checklist 结构化行——ID 是天然合并键）→ 重写后返回 **`{ merged, items }`**（merged=true 时 items 为落盘真相——本端节点原地重分配，调用方引用即最终 ID）。

**合并规则（ID union）**：

- 本端新增项 + 盘上他端新增项都保留；done 集合 union。
- **ID 冲突**（并发 add 各自从同基线分配同号）：同 ID 不同文本 → **盘上保留、本端项重分配**（max+1 续分配，子树 ID 前缀同步换新——"T4.1" → "T5.1"）；同 ID 仅状态不同 → `in_progress` 胜过 `pending`（标记不丢）；同 ID 同文本 → 去重（parse 规范化幂等场景），子树仍逐层合并（防丢任一端子新增）。
- **归档排除**：checklist 文件合并时按 done 文件归档根 ID 排除（含子任务点号 ID——并发 mark-done 的"盘上有旧 pending 副本"不复活已归档项）；`checklist-done.md` 自身合并 = **纯 union**（无归档排除）。
- 层内递归合并：磁盘序在前；重分配 max 计算域 = 双端全树 + 归档根（根层防撞）。

### 5.3 测试缝

`_setWriteGateHookForTest(fn)`——在每次写前门控处注入"对端写盘"钩子（模拟本链 parse 后、write 前对端实例的真实并发写）——伪属主范式，无真 spawn。生产不设置（null → 零行为影响）。

---

## 6. config.json 原子写（F5）

### 6.1 根因实证

CLI 多处**整节内存写回**（读入内存的 `agent.providers` / `agent.config.mcp.servers` 整数组写回磁盘）——进程 A 启动读 providers 快照 → 常驻 → B 改了 providers → A 任一 /provider 操作把 B 的改动整体抹掉。用户多次踩雷：**"一端改了配置，另外一端就会出现一些意外"**（provider/key/agent 设置被旧快照覆盖）。VS Code 侧无此形态（各路径现用现读，无整对象内存写回调用点）。

### 6.2 双管齐下（D-F5a + D-F5b）

- **D-F5a 消灭整节内存写回**：原 7 处整节写回全部改为"在磁盘新鲜 raw 上执行单操作"语义（config-helpers `syncProviderField` 单字段补丁 / pickers add preset·add 自定义·remove·setKey·setContext 在 fresh raw.providers 上 push·splice·改单字段 / cmd-mcp 在 fresh raw.mcp.servers 上只写目标 server 条目）。效果：写频低（用户操作触发）、窗口缩到 mutate 内、双进程并发改不同 provider → 都保留。
- **D-F5b 收口函数 `writeConfigAtomic(path, mutate)`**（config.mjs）——持整条「新鲜读 → mutate 单操作 → 写前重 stat → 写」链，所有 config.json 写点（config-helpers persistRaw / cmd-config / cli setup-wizard / settings writeDisk）都经它落盘。

### 6.3 writeConfigAtomic 语义

- **t0 取在新鲜读之前**（stat→read 序）：对端在 stat 与 read 之间微窗口写入只造成假冲突（放弃重试），绝不带旧内容覆盖对端新值——read→stat 序存在漏检窗口。
- **写前重 stat ≠ t0 → 放弃本次写**（磁盘上对端新值保持在线不抹）；先 copy `.bak-{ts}` 留现场（仅冲突时——config 低频写不膨胀；copy 而非 rename：冲突即放弃、本体不动，"保现场"是额外副本，非轮转腾位）。
- **返回 `{ ok: false, reason: "mtime-conflict" }`**，调用方提示 "config changed on disk concurrently — retry"——**不自动合并**（config 是用户显式操作——重试比猜测合并安全，决策① A）。重试路径 = 调用方用户再按一次。
- 文件缺失（首写）→ t0 = null；对端在本端读后创建 → null ≠ 新 mtime → 冲突放弃。
- 畸形文件**拒写**（throw，绝不静默覆盖）；写后 chmod 0600 尽力而为（config 含 API key，不可世界可读）。

---

## 7. 测试覆盖（原 T-L/T-F4/T-F5 系，伪属主 seedFile 范式——无真 spawn）

| # | 类别 | 输入 / 场景 | 预期 |
|---|---|---|---|
| T-L1a | L1 | seedFile manifest 两活条目（伪活 pid = 本进程 pid 变体）+ 本端条目 | 注入含"N 个同伴"（transient + 位置在 time reminder 前） |
| T-L1b | L1 | 无同伴（仅 self） | 不注入（零开销断言——无 push） |
| T-L1c | L1 | manifest mtime 未变 | 二次调用不重查（注入计数 mock） |
| T-L2a | L2 | `peer_instances` 查询 | 返回清单字段完整（pid/sessionId/slots/end/去 self）——**字段白名单精确断言** |
| T-L2b | L2 | 死主条目（DEAD pid） | 不出现 |
| T-L2c | L2 | 多 pid 判活 | 批量判活 = 一次 exec（spy 计数 = 1） |
| T-N3/N4 | L2/L1 | peer_instances 查询 + L1 注入路径 | fs 写点 mock 计数 = 0（只读性——不写 manifest/peers/sessions） |
| T-L3a | L3 | A 写文件 x → peers 文件含 x；seedFile B 实例登记含 x → B 写 x | 提示出现（不阻止——写成功） |
| T-L3b | L3 | B 登记死 pid | 聚合时惰性清理（文件消失） |
| T-L3c | L3 | 无冲突 | 零提示（零回归） |
| T-L3d | L3 | peers 文件损坏 | 按缺失降级（不崩——end marker NF2 同型） |
| T-F4a | F4 | A parse（基线 M0）→ seedFile 写盘（B 加了项）→ A add | 结果文件含 A 新项 + B 新项（不丢）+ merged 语义 |
| T-F4b | F4 | 并发 add 同 ID（seedFile 里 B 项 ID = A 将分配 ID） | 合并后无重复 ID、B 项保留、A 项重分配 |
| T-F4c | F4 | 无并发 / 自写链（parse 规范化写回 → add） | 零行为变化（自写不触发 merged/重分配） |
| T-F4d | F4 | mark 双写路径 | 同防护（done union） |
| T-F5a | F5 | A 读基线 → seedFile 写 V2（模拟 B 改）→ A 保存 | 返回 mtime-conflict + .bak 落盘 + V2 未被抹（文件内容 = V2） |
| T-F5b | F5 | 整节写回消灭验证——内存 providers 旧 + 磁盘新 → 单 provider 操作 | 磁盘其他 provider 改动保留（不再整节替换） |
| T-F5e | F5 | cmd-mcp 写回——内存 mcp.servers 旧 + 磁盘新 → 改目标 server | 磁盘其他 server 改动保留 |
| T-F5c | F5 (VSC) | VS Code saveRaw 同型门控（镜像用例） | 同 F5a 语义 |
| T-F5d | F5 | 无并发时保存 | 照常（零回归） |

**验收（AC-R10 对应）**：T-F5a..e 绿（用户踩雷场景复现修复，含 cmd-mcp 专属）；T-F4a..d 绿（双实例并发 add 不丢项 + 自写基线不误触发）；T-L1/L2 + T-N3/N4 绿（有同伴注入/无同伴零开销/查询只读完整 + 字段白名单）；T-L3a..d 绿（冲突提示不阻止 + 死登记惰性清理 + 缓存命中零扫描）；双端全量回归绿（镜像用例同 describe 模式）。

---

## 8. 关键决策

| # | 决策点 | 裁定（全按推荐 A） |
|---|---|---|
| ① | F5 冲突处置 | **A 放弃 + 提示重试**（用户显式操作，重试成本低） |
| ② | F4 .bak | **A 不做**（cwd 在 git 仓库内——git 兜底现场） |
| ③ | L1/L2 端字段 | **A 批量 cmdline 探测**（一次 Get-CimInstance/ps 拿全部 pid+cmdline） |
| ④ | L1 注入频率 | **A 每回合**（有同伴时——一致可预期；成本 = 回合一次 stat + manifest 变了才批量判活） |
| ⑤ | L3 domains 语义 | **A 写后登记 + hot 窗口**（5 分钟——记录真实足迹；bash 大通道本就不可拦，诚实边界） |
| ⑥ | L3 冲突反馈 | **A 工具结果附软提示**（不阻止——范围边界） |

---

## 9. 与既有机制的关系

| 既有 | 关系 |
|---|---|
| SESSION.md §10 slotSessions/isProcessAlive | **上游基建**——L1/L2 直接读它 |
| SESSION.md §10 slotOccupancy | L2 查询的槽级基础 |
| SESSION.md §11（R5/R8/R9 家族） | 相邻但独立——家族管"agent 自知环境身份/模式"，本节管"agent 知同伴" |

---

## 10. 受影响文件（实现时点）

| 端 | 文件 | 动作 | 内容 |
|---|---|---|---|
| CLI | `thincoder-core/peer-instances.mjs` | ADD | 感知面：peerInstances/batchAlive/probeCmdlines/惰性缓存（含测试注入缝 aliveFn/cmdlineFn） |
| CLI | `thincoder-core/peer-domains.mjs` | ADD | 域面（独立文件，防 300 行超限）：peerDomains 聚合/conflicts/登记 flush/惰性死清理 |
| CLI | `thincoder-core/tools/checklist-sync.mjs` | ADD | F4 同步机：flushWrite 门控 + 合并 + 基线规则 |
| CLI | `thincoder-core/tools/checklist.mjs` | MODIFY | F4 接入：parse/add/mark 走 flushWrite（同步机拆出后只留 parse/树操作与工具执行） |
| CLI | `src/agent/setup-reminders.mjs` | MODIFY | pushPeerReminder（env-state 同文件/同纪律） |
| CLI | `src/agent/setup.mjs` | MODIFY | 注入调用点（env-state 后 time 前） |
| CLI | `src/agent/dispatch.mjs` + `src/agent/run-stages.mjs` | MODIFY | L3 写工具前检测/记录钩子 + 回合末 flush |
| CLI | `src/cli/make-agent.mjs` | MODIFY | peer_instances 只读工具装配 |
| CLI | `thincoder-core/config.mjs` + `src/tui/config-helpers.mjs` + `src/tui/pickers.mjs` + `src/tui/cmd-mcp.mjs` + `src/tui/cmd-config.mjs` + `src/cli/setup-wizard.mjs` + `thincoder-core/agent-tools/settings.mjs` | MODIFY | F5：7 处整节写回消灭 + writeConfigAtomic 收口 |
| VS Code | extension 同构（peer-instances/peer-domains/checklist-sync/config-io 镜像） | ADD/MODIFY | 双端镜像（`_setSessionsDirForTest` 注入缝随既有；schema/文案逐字锚见 §3/§4） |
