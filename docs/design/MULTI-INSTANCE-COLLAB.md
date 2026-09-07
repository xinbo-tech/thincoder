# 多实例协作感知（MULTI-INSTANCE-COLLAB） > 状态：**已批准（2026-09-06——用户裁定 A 方案全量一次设计——评审 0🔴 通过（/）——决策点 ①-⑥ 用户全按推荐（全 A）——评审建议 1-8 全采纳已修订落本节——待实现）**。
> 范围：CLI（thincoder）+ VS Code（thincoder-vscode）双端——同一 `~/.thincoder/sessions/` 目录下的多实例协作。
> 关联：SESSION.md §10（端分离/存储层多实例机制——本需求的上游基建）、§11（agent 自我感知家族——相邻但独立，R10 单独立项因难度高）。 ## 1. 需求（Requirements） ### 总体目标 用户常在同一工作目录同时开多个 thincoder 副本（CLI + VS Code 扩展 + 多会话面板）。**存储层**已有完善的实例隔离（slotSessions 进程认领、slotOccupancy、end marker、isProcessAlive——见 SESSION.md §10），副本间**不会互相覆盖会话文件**。但 **agent 认知层互不知晓**——每个 agent 不知道自己所在目录还有别的活 thincoder 副本在同时工作，遇到文件竞争需用户口头告知才回避（实况：2026-09-06 本会话 CLI + VS Code 同开 d:\teamcode，靠用户口述"CLI 在跑，回避"才协调）。目标：让副本在 **agent 层互相感知并可协作**——agent 自主知道"有同伴在"，能避让文件域竞争，无需用户口头协调。 ### 功能性需求 | # | 用户故事 | 验收语义 |
|---|---|---|
| F1 (L1) | 作为用户，我希望每个 thincoder 实例启动/回合时**自知所在 cwd 有多少活 thincoder 副本**（各自端/进程/占用槽） | 回合注入"活跃实例清单"；agent 无需询问即可知有同伴 |
| F2 (L2) | 作为 agent，我希望**能主动查询**当前 cwd 的活实例及其状态 | 只读查询工具，agent 可随时调用 |
| F3 (L3) | 作为用户，我希望多个副本**不互相踩文件**——写文件前知道目标是否被他实例占用 | 实例登记"正在写的文件域"；他实例写前检测冲突域并主动回避/报告 |
| F4 (checklist 协调) | 作为用户，我希望多个副本各自维护的 checklist 项**不被互相覆盖**（各自建项、状态变更不丢） | 两端 checklist 并发写不静默丢项（现为裸整文件覆盖） |
| F5 (config 写原子性) | 作为用户，我希望在一端改配置（provider/key/agent 设置）后，**另一端不出现意外**（配置被旧快照覆盖） | `~/.thincoder/config.json` 并发写不互相抹除（现为整文件裸写、无 mtime 门控） | ### 非功能需求 | # | 维度 | 标准 |
|---|---|---|
| N1 | 低侵入 | 复用 SESSION.md §10 现成基建（slotSessions/slotOccupancy/isProcessAlive），不新建平行存储 |
| N2 | 端一致 | CLI / VS Code 行为一致（lockstep） |
| N3 | 只读安全 | L1/L2 纯只读（不认领、不写 manifest）；L3 的登记/检测不阻塞主流程（度量见 §2a.5 D-L3b——缓存命中零扫描、flush 回合末一次） |
| N4 | 隐私 | 实例清单不含敏感信息（无 API key/会话内容，仅进程/端/槽——字段白名单 {pid, end, sessionId, slots}） | ### 范围边界 - **不做**：跨实例实时聊天/消息传递、任务分配/编排、自动合并冲突文件——那是多 agent 协作平台的范畴，超出"同一工作目录多副本互不干扰"的本需求。
- L3 是"文件域感知"（写前检查他实例登记域），**不是文件锁**（不阻止写，只告知/建议避让）。 ## 1a. 共享状态全景（2026-09-06 完整梳理——R10 设计输入） 多实例同 cwd 时共享的状态分四类，现状核实如下： ### A 类：已有防护（存储层会诊修过——复用其基建） | 共享物 | 路径 | 防护机制 |
|---|---|---|
| 会话数据文件 | `~/.thincoder/sessions/{cwd-hash}.json.N` | slotSessions 进程认领 + isProcessAlive + slotOccupancy + end marker + .bak 轮转 + mtime 门控（SESSION.md §10） |
| 会话 manifest | 同目录 `.json.manifest` | 条目级合并 + deletions 显式表达 + active 单值指针（§10 会诊产物） |
| 向量/个人记忆 | `~/.thincoder/memory.db` | sqlite WAL 并发（低险——待专项确认读多写少路径） | ### B 类：裸写无防护（真实风险——设计须覆盖） | 共享物 | 路径 | 现状 | 风险 |
|---|---|---|---|
| checklist | `{cwd}/.thincoder/checklist.md` | 裸整文件覆盖（CLI/VSC 同路径同构） | 🔴 并发写覆盖丢项（已入 R10 F4） |
| checklist-done | 同目录 `checklist-done.md` | 裸覆盖 + readDoneRoots 读 | 🟡 同型（F4 一并覆盖） |
| config.json | `~/.thincoder/config.json` | 裸 writeFileSync 整文件覆盖；读-改-写窗口无 mtime 门控（**启动读盘 → 内存 → 整节写回**——会话层 F2 同型竞态，config 层未修） | 🔴 全局共享（所有 cwd 所有实例）；**用户实证：一端改配置另一端出现意外（多次踩雷）——已入 R10 F5** |
| 项目元数据 | `{cwd}/.thincoder/advisor.md` 等 | 待核（低活跃） | 🔵 低险 | ### C 类：按文件设计天然低冲突（无需协调） | 共享物 | 路径 | 为何低险 |
|---|---|---|
| 项目 memory | `{cwd}/.thincoder/memory/*.md` | 每 entry 独立文件（MEMORY 设计"git 友好、避免冲突"） |
| 日志 | `~/.thincoder/logs/`、`{cwd}/.thincoder/tmp/` | appendFile 追加（原子） |
| traces | `~/.thincoder/traces/` | appendFile + 按 sessionKey 分文件 |
| checkpoints | `~/.thincoder/checkpoints/{cwd-hash12}/` | **追加式独立快照目录——无需隔离**（2026-09-06 排查结论）：ID 随机后缀防同毫秒碰撞 + 清理幂等（按 ID sort 删最旧到 MAX=100）+ 快照天生无共享可变状态；且语义上"同 cwd 多实例快照都应可恢复"——隔离反而破坏用途 | ### D 类：工作区本身（最深竞争点——R10 L3 的主目标） | 共享物 | 现状 | 风险 |
|---|---|---|
| repo 代码/文档文件 | 无跨实例协调（各实例独立 read/write/edit/bash） | 🔴 同时改同文件互相覆盖——实况：CLI 与 VS Code 同开同 repo，靠口头回避 |
| git 操作 | 无跨实例协调（checkpoint 快照各自为政） | 🟡 |
| docs/ 设计文档 | 无协调 | 🟡（多 agent 并行改设计文档） | ### 梳理结论 - A 类已解决（会话——工程量大但已做好），R10 设计**复用其基建**（slotSessions/isProcessAlive 等），不重造。
- B 类需补并发防护：checklist/checklist-done（F4 已入）；config.json 写原子性（F5 已入）。
- C 类安全，设计不涉及（含 checkpoints——排查确认无需隔离，见上表）。
- D 类是 R10 L1/L2/L3 的**主战场**（注入感知 → 查询 → 文件域协调）。
- **排查方法论注记**：并非所有"多实例写同一目录"都要协调——判断标准是**写入语义**：共享单一文件（读-改-写竞态 → 需 mtime 门控/合并，如 config/checklist）vs 追加独立快照/分文件（天生无冲突 → 无需隔离，如 checkpoint/traces/memory 每 entry 独立文件）。 ## 2. 初步设计方向（登记时澄清产物——**被 §2a 取代——历史输入，实现以 §2a 为准**） ### L1 — 活跃实例清单注入（最低成本，直击实况痛点） - 数据源：manifest `slotSessions`（各活进程认领的槽）+ `isProcessAlive`——已全部现成。
- 新只读汇总函数 `peerInstances(cwd)`：遍历 slotSessions，筛活进程，输出 `[{ end: cli|vscode, pid, sessionId, slots: [...] }]`（本进程自身排除或标记 self）。
- 注入：回合启动时（与 AUTO/ENG reminder 同通道 setup-reminders），若 `peerInstances(cwd).length > 1`，注入一行"本目录另有 N 个活跃 thincoder：...——文件操作注意避让"。
- 端识别：进程 cmdline（CLI 是 `thincoder`，扩展宿主是 `Code.exe --extensionDevelopmentPath`）或本端 marker 存在性——设计定稿（§2a.4 决策点③已裁定 A：批量 cmdline 探测）。 ### L2 — 实例查询工具 - 新只读工具（`peer_instances`）：agent 主动调 `peerInstances(cwd)`，返回活实例清单——不依赖注入时机。
- 与 R8/R9（身份/模式自感知）共用查询通道设计考量。 ### L3 — 文件写域登记 + 冲突检测 - 实例登记"正在写的文件域"：近似 git checkout 锁语义但**非阻塞**——写前登记目标域，写完释放。
- 登记存储：沿用 sessions 目录（每实例一个轻量域文件）或 manifest 扩展——设计定稿（§2a.5：`~/.thincoder/peers/` 每实例单文件——end marker 单写者模式）。
- 检测：他实例写文件前查目标是否在别实例登记域 → 冲突则报告/建议避让（不阻止——范围边界）。 ### checklist 协调（F4——2026-09-06 用户补充） - **现状**：两端 checklist 存**同一路径** `{cwd}/.thincoder/checklist.md`；写入 = 裸 `writeFileSync` **整文件覆盖**，无锁、无合并、无 mtime 防护。多实例同 cwd 并发写 → **后写覆盖先写、静默丢项**（与会话层曾修的覆盖问题同型——会话已上 .bak + mtime 门控，checklist 层未上）。
- **设计方向（已定稿 §2a.3）**：mtime 门控 + ID 键合并（write() 内收口）。
- **验收方向**：两实例并发各自 add → 两文件端 checklist 都保留两项（不丢）。 ### config 写原子性（F5——2026-09-06 用户实证升级） - **根因**：CLI `loadConfig()`（**启动读一次**进内存）+ 多处整节内存写回（providers/mcp.servers——§2a.2 清单表）；读-改-写窗口 + 整文件覆盖 + 无 mtime 门控——**与会话层会诊 F2 修过的 .bak 轮转 + mtime 门控完全同型**（会话层已修、config 层未修）。
- **用户实证**：多次踩雷——"一端改了配置，另外一端就会出现一些意外"（provider/key/agent 设置被旧快照覆盖）。
- **设计方向（已定稿 §2a.2）**：消灭整节内存写回（fresh raw 单操作语义）+ 写前 mtime 门控（冲突放弃 + .bak 保现场）。
- **验收方向**：进程 A（长跑）→ 进程 B 改 config → A 做一次配置保存 → B 的改动保留（不抹除）。 ## 2a. 设计（Design——2026-09-06 · 用户裁定 A：全量一次设计） > 状态：**已批准（2026-09-06——用户裁定 A 方案（全量 F4/F5/L1/L2/L3 一个设计一个批）——评审 0🔴 通过（/）——决策点 ①-⑥ 用户全按推荐（全 A）——评审建议 1-8 全采纳已修订落本节——待实现）**。 ### 2a.1 总骨架 五项按共享物风险分两族，复用两套已实证模式： | 族 | 项 | 复用模式 | 模式出处 |
|---|---|---|---|
| **写安全** | F5 config.json 原子性 / F4 checklist 并发防护 | mtime 门控 + 写前重读合并 + .bak 轮转 + 冲突枚举返回（"四件套"）；共享索引条目级合并 | SESSION §10 会话层 F2/会诊；session-rename mtime-conflict 先例 |
| **感知** | L1 注入 / L2 查询 / L3 登记检测 | 只读复用 slotSessions/isProcessAlive；end marker 单写者文件模式 | SESSION §10 D-1/NF2 | ### 2a.2 F5 — config.json 写原子性（先修——用户踩雷项） **根因实证**（探索 §3）：CLI `persistRaw` 本身安全（磁盘新鲜读→mutate→写）；**真旧快照源 = 7 处整节内存写回**（评审修正 #1——实核：providers 写回 6 处 + mcp.servers 写回 1 处）： | # | 调用点 | 写回 | 改法（fresh raw 单操作） | 验收用例 |
|---|---|---|---|---|
| 1 | config-helpers.mjs syncProviderField（L21-23） | `raw.providers = agent.providers` | 改签名 {name, field, value}——fresh raw.providers 上单字段补丁 | T-F5b |
| 2 | tui/pickers.mjs add preset（L358） | 同上 | fresh raw.providers push 目标项 | T-F5b |
| 3 | tui/pickers.mjs add 自定义（L372） | 同上 | fresh 上 push | T-F5b |
| 4 | tui/pickers.mjs remove（L386） | 同上 | fresh 上 splice | T-F5b |
| 5 | tui/pickers.mjs setKey（L404） | 同上 | fresh 上改目标项 key | T-F5b |
| 6 | tui/pickers.mjs setContext（L445） | 同上 | fresh 上改目标项 context | T-F5b |
| 7 | tui/cmd-mcp.mjs（L87） | `raw.mcp.servers = agent.config.mcp.servers` | fresh raw.mcp.servers 上只写目标 server 条目 | **T-F5e（评审修正 #1——cmd-mcp 专属验收）** | 进程 A 启动读 providers 快照 → 常驻数小时 → B 改了 providers → A 任一 /provider 操作把 B 的改动整体抹掉。VS Code 侧无此形态（探索证实：扩展各路径现用现读，无整对象内存写回调用点）。 **D-F5a（CLI——消灭整节内存写回——评审修正 #1 清单表见上）**：上表 7 处整节写回全部改为"在磁盘新鲜 raw 上执行单操作"语义（各改法见表右列）。效果：写频低（用户操作触发）、窗口缩到 mutate 内、双进程并发改不同 provider → 都保留。 **D-F5b（双端——saveConfig/saveRaw 写前 mtime 门控 + .bak 最后防线）**：session-rename mtime-conflict 先例同型：
- persistRaw/saveConfig 读后记 `t0 = stat(mtime)` → mutate → 写前重 stat → 不等 → **放弃 + 返回 `{ok:false, reason:"mtime-conflict"}`**（调用方提示"config changed on disk concurrently — retry"）——不自动合并（config 语义是用户显式操作，重试比猜测合并安全）；重试路径 = 调用方用户再按一次
- mtime 冲突时先 `.bak-{ts}` 轮转保现场（仅冲突时——config 低频写不膨胀）
- CLI 3 直调点（config-helpers persistRaw / cmd-config L86 / setup-wizard L64）+ settings.mjs writeDisk 一并走 D-F5b 包装（收口函数 `writeConfigAtomic(path, raw)`）
- **冲突处置（决策点①——已裁定 A）**：放弃提示重试（用户显式操作，重试成本低）。 **D-F5c（验收测试）**：仿 session-safety 伪属主范式（探索 §7——seedFile 直写模拟对端，无真 spawn）：
- T-F5a：A 读基线 → seedFile 写 V2（模拟 B 改）→ A 保存 → 返回 mtime-conflict + .bak 落盘 + V2 未被抹（文件内容 = V2）
- T-F5b：CLI 整节写回消灭验证——syncProviderField/pickers 流在"内存 providers 旧 + 磁盘新"下操作单 provider → 磁盘其他 provider 改动保留（语义断言：不再整节替换）
- T-F5e（评审修正 #1）：cmd-mcp 写回改造专属用例——内存 mcp.servers 旧 + 磁盘新 → 改目标 server → 磁盘其他 server 改动保留
- T-F5c：VS Code saveRaw 同型门控（镜像用例——session-io-parity 同文件/同 describe 模式）
- T-F5d：无并发时保存照常（零回归） ### 2a.3 F4 — checklist 并发防护 **现状实证**（探索 §2）：双端 checklist.mjs 写 = 私有 `write()` 整文件覆盖——parse 读带写回副作用、add、mark 双写三写点；无任何 mtime/锁。竞态 = parse→write 窗口交错丢项。 **D-F4a（写前 mtime 门控 + 合并重写——"四件套"中门控+合并变体）**：
- `write(filePath, items)` 升级：写前 `statSync(filePath).mtimeMs !== 读时基线` → 磁盘被并发方改 → **重读磁盘 + 合并**（checklist 结构化行——ID 是天然合并键）： - 合并 = 双方 items union by ID（本端新增项 + 盘上他端新增项都保留）；done 集合 union - **ID 冲突**（并发 add 各自从同基线分配同号）：同 ID 不同内容 → 盘上保留、本端项重分配新 ID（max+1 续分配） - 重写后返回 `{merged:true, items}` 供调用方继续（add/mark 的结果以合并后为准）
- **基线规则（评审修正 #6）**：基线 = 本读-改-写链内最近一次 stat 的 mtime；**本进程自写后刷新基线**（parse 规范化写回副作用——写后重 stat 记基线）——防自写误判并发（union 幂等内容无害，但 merged 标志/重分配分支不被误触发）
- 侵入点 = 私有 write() 内收口（3 写点自动获得防护——parse 写回 / add / mark 双写）
- checklist-done.md 同型（mark 走同一 write）
- **.bak（决策点②——已裁定 A）**：不做 .bak 轮转（cwd 在 git 仓库内——git 兜底现场） **D-F4b（测试）**：
- T-F4a：A parse（基线 M0）→ seedFile 写盘（B 加了项——模拟）→ A add → 结果文件含 A 新项 + B 新项（不丢）+ merged 语义
- T-F4b：并发 add 同 ID（seedFile 里 B 的项 ID = A 将分配 ID）→ 合并后无重复 ID、B 项保留、A 项重分配
- T-F4c：无并发 → 零行为变化（既有 checklist 全用例回归——**含 parse 规范化写回 → add 链的自写用例**——评审修正 #6：自写不触发 merged/重分配）
- T-F4d：mark 双写路径同防护（done union） ### 2a.4 L1/L2 — peer-instances 模块（感知） **数据源实证**（探索 §4）：sessionId = `{pid}-{ts}-{rand}` 进程级（可去重分组）；slotSessions 条目无端标签（端识别真缺口——决策点③裁定补 cmdline 探测）；isProcessAlive 单 pid tasklist 调用（每回合 N 次 = 贵——**需批量**）；marker 指向槽非进程。 **D-L2a（`src/peer-instances.mjs` 新模块——双端同构）**：
- `peerInstances(cwd)` → `[{ pid, sessionId, slots: [...], end?, self: bool }]`： - 读 manifest slotSessions → 按 sessionId 去重分组 → slots 数组 - **一次批量判活**（新 `batchAlive(pids)`——单次 tasklist/ps 全量 PID 集合比对——修复 isProcessAlive 每 pid 一次 execSync 的成本问题；CLI 新函数 + VS Code 同构） - self 排除 = sessionId === getSessionId()（本进程） - 惰性：manifest mtime 缓存（变了才重查——活实例变化必伴随 manifest 写——仿 agent._slotMtime 先例）
- **端字段（决策点③——已裁定 A：批量 cmdline 探测）**：批量 cmdline 探测（一次 Get-CimInstance/ps 拿全部 pid+cmdline → 过滤 Code.exe/扩展宿主 vs node/thincoder——manifest mtime 变了才做一次，~百 ms 级）满足 F1"各自端"需求。 **D-L1a（回合注入）**：setup-reminders.mjs 新 `pushPeerReminder(agent)`（仿 pushEnvStateReminder——CLI agent 形态 / VS Code history+opts 形态按各端惯例）：
- 时机：env-state 之后、time reminder 之前（depth-0、transient:true——注入纪律同 env-state）
- 条件：`peerInstances(cwd).filter(p => !p.self).length > 0` 才注入（无同伴零开销——peerInstances 惰性 mtime 缓存保证）
- 文案："本目录另有 N 个活跃 thincoder（{end} pid={pid}…）——文件操作注意避让"
- **注入频率（决策点④——已裁定 A：每回合注入）**：有同伴就每回合注入（一致可预期；成本 = 回合一次 stat + manifest 变了才批量判活）。 **D-L2b（查询工具）**：L2 挂 L1 模块导出——工具注册（CLI builtinTools 区 / VS Code registry）：只读工具 `peer_instances` 无参返回 peerInstances(cwd)（去掉 self）——agent 主动查。**schema description 逐字锚（评审修正 #7——2026-09-06 定稿，双端照抄）**："peer_instances — read-only: list other live ThinCoder instances sharing this workspace cwd. Returns [{ pid, end, sessionId, slots }]; never includes self; pure read — writes nothing." **D-Lx（测试）**：
- T-L1a：seedFile manifest 两活条目（伪活 pid = 本进程 pid 变体）+ 本端条目 → 注入含"N 个同伴"（transient + 位置在 time reminder 前）
- T-L1b：无同伴（仅 self）→ 不注入（零开销断言——无 push）
- T-L1c：惰性缓存——manifest mtime 未变 → 二次调用不重查（注入计数 mock）
- T-L2a：peer_instances 返回清单字段完整（pid/sessionId/slots/end/去 self）——**字段白名单精确断言（评审修正 #3）**：返回字段仅 {pid, end, sessionId, slots}——出现任何其他键（key/内容类）即红
- T-L2b：死主条目（DEAD pid）不出现
- T-L2c：批量判活 = 一次 exec（spy 调用计数 = 1）
- T-N3/N4（评审修正 #3）：peer_instances 查询 + L1 注入路径——fs 写点 mock 计数 = 0（只读性——不写 manifest/peers/sessions）；AC-R10c 相应含只读断言 ### 2a.5 L3 — 文件写域登记 + 冲突检测（最难点——单独设计节） **选型分析结论**（探索 §6）：①sessions 目录受 cwd 分片限（登记域是任意文件路径——装不下）②manifest 扩展被 SESSION.md §10.1 NF1 否决理由毙（评审修正 #4——manifest 条目级合并只认已知字段、旧版整对象写丢未知字段——"未知字段丢失窗口"）③**每实例独立登记文件 + 目录扫描聚合**——end marker 单写者模式同型（写失败容忍 + 损坏按缺失降级 + 崩溃残留 isProcessAlive 判活可清）。 **D-L3a（登记存储——`~/.thincoder/peers/` 目录 + 每实例单文件）**：
- 文件：`{sessionId}.json`（单写者 = 本实例；内容 `{sessionId, pid, end, cwd, domains: [绝对路径], updatedAt}`）
- 写点：**回合级**——回合结束（或回合中域集合变更时）整写一次本实例文件（低频——仿 manifest 认领先例）；**不按文件级高频登记**（N3 不阻塞主流程）
- **累积机制（评审修正 #2）**："本回合实际写过的文件"集合由**写工具钩子**（D-L3b 同一钩子）记录——每次结构化写工具执行时：①查冲突（检测）②记入本回合域集合（记录）——检测+记录一次完成；回合结束 flush 整写
- domains 语义（**决策点⑤——已裁定 A：写后登记 + hot 窗口**）：A **本回合实际写过的文件**（事后域——写后登记——记录真实足迹——"正在写"语义弱化为"刚写过"——5 分钟内视为 hot）——bash 大通道本就不可拦，诚实边界：L3 覆盖结构化写工具足迹 + hot 提示
- 崩溃残留：聚合时惰性清理（读到死 pid 文件 → 删——isProcessAlive 一次批量）；session-gc 冷清理面不扩展（peers 文件短命）
- 端间可见：目录扫描其他活实例文件 → domains 汇总 **D-L3b（写前检测）**：结构化写工具（write/edit/apply_patch/delete/file_ops）执行前查 `peerDomains(cwd).conflicts(target)` → 命中他实例 hot 域 → 工具结果附提示（**不阻止**——范围边界）——**反馈形态（决策点⑥——已裁定 A：软提示）**。**缓存（评审修正 #2）**：peerDomains 聚合结果按 peers 目录 mtime 惰性缓存（仿 manifest 惰性——目录未变不重扫）。**N3 度量（评审修正 #2）**：单次写工具调用新增开销上限 = 目录 stat + 缓存命中零扫描（缓存有效时无新增 IO 面）；注册 flush = 回合末一次整写。 **D-L3c（测试）**：
- T-L3a：A 写文件 x → peers 文件含 x → seedFile B 实例登记含 x → B 写 x → 提示出现（不阻止——写成功）
- T-L3b：B 登记死 pid → 聚合时惰性清理（文件消失）
- T-L3c：无冲突 → 零提示（零回归）
- T-L3d：peers 文件损坏 → 按缺失降级（不崩——end marker NF2 同型） ### 2a.6 受影响文件 | 文件 | 端 | 动作 | 内容 |
|---|---|---|---|
| `src/peer-instances.mjs` | CLI | ADD | **感知面（评审修正 #8）**：peerInstances/batchAlive/惰性缓存（含测试注入缝 aliveFn） |
| `src/peer-domains.mjs` | CLI | ADD | **域面（评审修正 #8——独立文件，防 300 行超限）**：peerDomains 聚合/conflicts/登记 flush/惰性死清理 |
| `src/extension/peer-instances.mjs` + `src/extension/peer-domains.mjs` | VS Code | ADD | 同构（`_setSessionsDirForTest` 注入缝随既有） |
| `src/agent/setup-reminders.mjs` | 双端 | MODIFY | pushPeerReminder（env-state 同文件/同纪律） |
| `src/agent/setup.mjs` | 双端 | MODIFY | 注入调用点（env-state 后 time 前） |
| 工具注册（builtinTools/registry + 写工具钩子） | 双端 | MODIFY | peer_instances 只读工具（schema 逐字锚见 D-L2b）+ 写工具前检测/记录钩子（L3b/L3a 累积） |
| `src/tools/checklist.mjs` | 双端 | MODIFY | D-F4a write 门控+合并+基线规则 |
| `src/config.mjs` + `config-helpers.mjs` + `tui/pickers.mjs` + `tui/cmd-mcp.mjs` | CLI | MODIFY | D-F5a 清单表 7 处消灭整节写回 + D-F5b writeConfigAtomic 收口 |
| `src/config-io.mjs` | VS Code | MODIFY | D-F5b saveRaw 门控 |
| `src/agent-tools/settings.mjs` | 双端 | MODIFY | writeDisk 走 D-F5b 收口 |
| `test/checklist.test.mjs` / `test/session-io-parity.test.mjs` / 新测试 | 双端 | MODIFY/ADD | T-F4/T-F5/T-L 系 + T-N3/N4（伪属主范式） |
| 本文件 + CHANGELOG | CLI | MODIFY | 设计/核销 + 父侧交付 | ### 2a.7 决策点裁定记录（2026-09-06 用户全按推荐） ① F5 冲突处置：**A 放弃+提示重试** ② F4 .bak：**A 不做（git 兜底）** ③ L1/L2 端字段：**A 批量 cmdline 探测** ④ L1 注入频率：**A 每回合（有同伴时）** ⑤ L3 domains：**A 写后登记 + hot 窗口** ⑥ L3 冲突反馈：**A 工具结果附注（软）** ### 2a.8 验收（AC-R10） - AC-R10a（F5）：T-F5a..e 绿——用户踩雷场景（长跑 A + B 改 config + A 保存 → B 改动保留）复现修复（含 cmd-mcp 专属用例）
- AC-R10b（F4）：T-F4a..d 绿——双实例并发 add 不丢项（含自写基线不误触发）
- AC-R10c（L1/L2）：T-L1/L2 + T-N3/N4 绿——有同伴注入/无同伴零开销/查询只读完整（fs 写点零）+ 字段白名单
- AC-R10d（L3）：T-L3a..d 绿——冲突提示不阻止 + 死登记惰性清理 + 缓存命中零扫描
- AC-R10e：双端全量回归绿（镜像用例同 describe 模式落 session-io-parity） ## 3. 与既有机制的关系 | 既有 | 关系 |
|---|---|
| SESSION.md §10 slotSessions/isProcessAlive | **上游基建**——L1/L2 直接读它 |
| SESSION.md §10 slotOccupancy | L2 查询的槽级基础 |
| SESSION.md §11（R5/R8/R9 家族） | 相邻但独立——家族管"agent 自知环境身份/模式"，R10 管"agent 知同伴" | ## 4. 受影响文件（初步——待设计细化）**（被 §2a.6 取代——2026-09-06 评审修正 #5——历史输入，实现以 §2a.6 为准）** | 文件 | 端 | 动作 | 预期内容 |
|---|---|---|---|
| `src/session-gc.mjs` 或新 `src/peer-instances.mjs` | CLI | ADD | `peerInstances()` 汇总（复用 slotSessions/isProcessAlive） |
| `src/extension/...`（同构） | VS Code | ADD | 同上 |
| `src/agent/setup-reminders.mjs` | 双端 | MODIFY | L1 注入（回合启动，peerInstances>1 时） |
| `src/prompts/*.md` 或工具注册 | 双端 | MODIFY | L2 只读工具注册 |
| L3 登记/检测 | 双端 | ADD | 文件域登记 + 冲突检测（设计细化） |
| `src/tools/checklist.mjs` | 双端 | MODIFY | F4：checklist 写入并发防护（mtime 门控 + 合并，见 checklist 协调节） |
| `src/config.mjs` / `src/config-io.mjs` | 双端 | MODIFY | F5：config.json 写原子性（mtime 门控 + 合并——复用会话层 F2 经验，见 config 写原子性节） | ## 5. 验收方向（待设计细化）**（被 §2a.8 取代——2026-09-06 评审修正 #5——历史输入，实现以 §2a.8 为准）** - L1：双开同 cwd → 各实例回合注入含对方清单；agent 能复述"有 N 个同伴"。
- L2：agent 调查询工具 → 返回活实例清单（只读、不含敏感）。
- L3：实例 A 登记写 `src/x.mjs` → 实例 B 写 `src/x.mjs` → B 收到冲突提示（不阻止）。
- F4：双实例并发各自 add checklist 项 → 两端文件都保留两项（后写不覆盖先写）。
- F5：长跑进程 A → B 改 config → A 配置保存 → B 的改动保留（不抹除）。 ## 变更记录 - 2026-09-06：需求落档（R10——三级 L1/L2/L3，独立立项）；来源：用户实测"同目录多副本靠口头回避"。
- 2026-09-06：F4 补充（checklist 协调——用户指出"几个 thincoder 各自建的 checklist 项也需要协调"——现状核实：两端 checklist 同路径 + 裸整文件覆盖 + 无并发防护）。
- 2026-09-06：§1a 共享状态全景（用户要求完整梳理——A 类已防护/B 类需补/C 类安全/D 类工作区主战场——四类核实；config.json 写原子性列入待评估）。
- 2026-09-06：F5 config 写原子性升级（用户实证"一端改配置另一端意外、多次踩雷"——根因核实：启动读一次内存快照 + 整文件写回 + 无 mtime 门控——与会话层 F2 同型，config 层未修——复用 F2 经验）。
- 2026-09-06：checkpoint 隔离判断（排查后**排除**——追加式独立快照 + ID 随机防碰撞 + 清理幂等 + 语义上多实例快照都应可恢复——记入 §1a C 类，防将来重复排查）。
- 2026-09-06：设计层落档（§2a——用户裁定 A 全量一次设计——探索七节输入——F4/F5/L1/L2/L3 分节设计 + 六个决策点 🅰/🅱 待评审拍板——待评审）。
- 2026-09-06：评审 0🔴 通过（/）——决策点 ①-⑥ 用户全按推荐（全 A）——评审建议 1-8 全采纳修订（F5 逐点清单 7 处 + T-F5e cmd-mcp 用例 + L3 累积机制/N3 度量 + N3/N4 只读与白名单断言 + NF1 锚明 + §4/§5 superseded + F4 基线规则 + peer_instances 逐字锚 + 域面拆独立文件）——**已批准待实现**。
