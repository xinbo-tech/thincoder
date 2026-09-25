# 多实例协作感知（MULTI-INSTANCE-COLLAB）· 需求

> 板块 = **多实例协作感知**（同一工作目录多副本 agent 互相感知与避让）。
> 本档 = 该机制的**需求层权威**（F-MI1–F-MI9 / N-MI1–N-MI7 判定句）。
> 相邻面 = `docs/core/design/WORKSPACE.md`（工作区与会话槽）· `docs/core/design/SESSION.md`（会话存储与判活）·
> `docs/core/design/MULTI-INSTANCE-COLLAB.md`（**设计面权威**——2026-09-15 CLI 尾部真批新建）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 4**——`thincoder-vscode/docs/requirements/MULTI-INSTANCE-COLLAB.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名需求档（`thincoder-cli/docs/requirements/MULTI-INSTANCE-COLLAB.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> 逐节对账：F1–F5 / N1–N4 全由 F-MI1–F-MI5 / N-MI1–N-MI5 承载（零实质缺口）；§2 外部写感知（F6 / N5 / N6）= VSC 设置面板面（P2）⇒ 不并（§5.2 登记）；
> (d) 类入 §5.1。
> 实测口径 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 总体定位

用户常在同一工作目录同时开多个 ThinCoder 副本（编辑器多窗口 + 命令行 + 多会话面板）。**存储层**已有实例隔离
（槽位认领 / end marker / 判活），副本不会互相覆盖会话文件；但 **agent 认知层互不知晓**——每个 agent 不知道
同目录还有别的活副本在同时工作，文件竞争要靠用户口头协调。

**目标**：副本在 agent 层互相感知并可协作——agent 自主知道「有同伴在」，写前避让文件域竞争，无需用户口头协调。

### 范围边界

- **不做**：跨实例实时聊天 / 消息传递、任务分配 / 编排、自动合并冲突——那是多 agent 协作平台范畴。
- 文件域感知是「告知 / 建议避让」，**不是文件锁**（不阻止写——软提示）。

## 2. 功能性需求

| # | 用户故事 | 判定句（可机器验证） |
|---|---|---|
| **F-MI1** | 作为 agent，我想在回合里知道自己所在工作目录还有多少活副本，以便主动避让 | 回合注入活跃实例提醒（**过滤自身**）——agent 无需询问即知有同伴（实现面：核 = `thincoder-core/peer-instances.mjs`（CLI 面）· VSC 自持镜像 = `thincoder-vscode/src/extension/peer-instances.mjs`） |
| **F-MI2** | 作为 agent，我想随时只读查询当前工作目录的活实例及其状态 | `peer_instances` 工具在位（只读）——`peerInstances()` 条目含 `self`；工具输出白名单 = `{pid, end, sessionId, slots}`（N-MI4；双实现面同 F-MI1） |
| **F-MI3** | 作为 agent，我想在写文件前知道目标文件是否被他实例的登记域覆盖，以便避让 / 报告 | 写路径命中他活实例的短时热登记域 ⇒ 返回 peer 冲突提示（软提示，写不被阻止）——域面：核 `thincoder-core/peer-domains.mjs` · VSC `thincoder-vscode/src/extension/peer-domains.mjs`；写侧：核 `thincoder-core/agent/dispatch.mjs` · VSC `thincoder-vscode/src/agent/execute-tools.mjs` |
| **F-MI5** | 作为用户，一端改配置后另一端不出现旧快照覆盖 | 共享配置写带 mtime 门控：检测到并发写 ⇒ 放弃本次写并提示重试——`thincoder-vscode/src/config-io.mjs` |
| **F-MI6** | 作为 agent / 用户，我不想把**无关进程**误当成同伴（进程号复用后仍报「另有活跃实例」） | 活判定须**校验进程身份**——命令行命中本产品**标记族**才算活（① CLI 入口族：命令行含 `thincoder.cjs` / `.mjs` / `thincoder-cli` 路径段 ② VSC 宿主族：既有 `VSC_END_RE`）；命令明确可得且**不命中** ⇒ **不列为同伴**（pid 复用即消除）；探测失败 / 该 pid 缺行 ⇒ **保守保留**（失败 ≠ 死）；判据实现**单源** = `thincoder-core/process-probe.mjs`（读面 `peer-instances.mjs` 与清理面 `session-slots.mjs` `cleanDeadOwners` 共用） |
| **F-MI7** | 作为用户 / agent，我不想启动与认领路径上的进程探测把宿主事件循环拖到假死（数秒冻结） | 启动 / 认领路径（`cleanDeadOwners` · `usableSlot` · `resumeSlot` · `ensureActive` · `allocateFresh`）的判活与命令行探测 = **批量**（一次 exec 取全量——N-MI3 在启动路径的落实）+ **非阻塞形态**（该路径不得用 `execSync` / `execFileSync`；核内异步对偶 `batchAliveAsync` / `probeCmdlinesAsync` 已在——承 `2026-09-18-tui-freeze` 批验收）；两实现面同步收正 = 核 `session-slots.mjs` · `process-probe.mjs` + VSC 镜像 `thincoder-vscode/src/extension/session-slots.mjs`（逐 pid 同步 `isProcessAlive` = 第一实害点——每属主一发 `tasklist`，本机 0.14–0.25 s/发）。判据 = ① 机检：认领落地路径（`cleanDeadOwners`/`usableSlot`/`resumeSlot`/`ensureActive`/`allocateFresh` 及调用链）零 `execSync`/`execFileSync`；**两处例外（父侧 2026-09-18/19 裁定 · 设计轮及复审收正）** = ① `activeSlot` 冷路径 ② 占用判定 `slotOccupancy`——各为单次**有界**同步束 ≤ `SYNC_PROBE_MS`（2 s）+ 粘性早退命中零探测（例外带测试锚；到期 = 复评两处 async 化及其调用面）；② 每认领 exec 上界 = ≤1 次批量判活 + ≤1 次批量 cmdline（零逐 pid exec）；③ 初始化窗口事件循环静默 < 2 s（同判据 = `WEBVIEW（VSC）` F-W18） |
| **F-MI8** | 作为用户，我想让并行实例在**同一项目写文件前就能互相看见「谁正意图写哪儿」**——不必等回合收尾才留痕（足迹 flush 只在 run 收尾，实施 run 可数十分钟） | 结构化写工具成功 ⇒ 本实例登记认领并落盘（新目标即刻；同域再写续约，续约落盘节流 ≥ 60 s）；租约 = 30 min，同域再写刷新 `expiresAt`；过期 / 属主进程死亡 ⇒ 读面零命中（过期条目落盘时剪除）；认领与足迹**分字段**（各自字段级合并写、互不改写；旧记录无 `claims` ⇒ 按缺失降级） |
| **F-MI9** | 作为用户，我想在他实例正认领的目标被写入前**收到一条软提示**（谁在做 · 多久了 · 租约剩多少），而写入照发不变 | 结构化写工具执行前，目标 ∩ 他实例**未过期认领** ⇒ 工具结果附认领级软提示（逐字锚；含属主标识与认领时长 / 剩余租约）；**写不被阻止**；同一（目标 × 属主）每 run 至多一行；仅足迹命中 ⇒ 既有文案零变；聚合失败 / 探测失败 / 记录损坏 ⇒ 零提示零抛错 |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| **N-MI1** | 低侵入 | 复用会话槽位基建（manifest / sessionId / 判活），不新建平行存储 |
| **N-MI2** | 端一致 | 各实现面行为语义一致（lockstep），实现各自独立（多实现面纪律；判活 / 标记判据面除外——以**核单源**为准〔F-MI6 / N-MI6〕；**无端差纯函数 / 落盘原语共享不属该射程**〔2026-09-25 peer 收口批——D-MI23 / D-MI24〕，独立性指其余**行为语义面**） |
| **N-MI3** | 只读安全 | 感知面纯只读（**不认领槽位**、不写 manifest；**意图认领面为另立面——见 F-MI8 / N-MI7**）；惰性缓存 = **manifest mtime 未变 ∨ 快照年龄 < TTL（5000 ms）** 命中缓存（2026-09-18 设计评审收正——TTL 判据系设计面 `D-MI13` 已交付语义的回写）；批量判活一次取全量进程集合（不做每进程一次子进程） |
| **N-MI4** | 隐私 | 实例清单不含敏感信息——字段白名单 `{pid, end, sessionId, slots}` |
| **N-MI5** | 降级不崩 | 探测失败（子进程不可用 / 目录缺失）⇒ 空集降级，不影响主流程 |
| **N-MI6** | 判据单源 · 方向不对称 | 身份判据零第二套标记正则（读面 / 清理面同一实现）；不确定时偏向**保留**（误保留 = 噪音可忍；误删 = 活实例失槽） |
| **N-MI7** | 认领面成本与降级 | 无新目标且续约窗内 ⇒ 零新增 IO；单次写调用新增落盘 ≤ 1（合并写）+ 目录 stat ≤ 1（缓存命中零扫描）；`CLAIM_TTL_MS` / `CLAIM_RENEW_FLUSH_MS` / 认领文案 = 双端等值 / 逐字同串（测试对拍） |

## 4. 范围边界（不做）

- 不做跨实例消息传递 / 任务编排 / 冲突自动合并。
- 不做文件锁（避让是软提示，写不被阻止）。
- 不新建平行存储（感知面寄居既有会话槽位基建）。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/MULTI-INSTANCE-COLLAB.md`（VSC 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「定位」（感知面 / 文件域面 / 写入侧 / 清单写面 / 配置写面的实现行数注） | 时点行数注 | 时点坐标——现行坐标入各 F 判定句 |
| 旧档「跨端：与 CLI 仓同名需求档语义同源（lockstep）」注 | 跨仓对位句 | 语义同源已由 N-MI2 承载——不另立对位节 |
| 旧档变更记录（2026-09-12 建档行） | 建档流水 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/requirements/MULTI-INSTANCE-COLLAB.md`（2026-09-15 CLI 尾部真批对账并入——零新增正文）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注（板块行 + 状态行「已实现」+ 来源注「2026-09-10 自设计档抽取——需求层拆分批」） | 时点状态 / 批次语境 | 现行态已入 §1–§3 |
| 旧档 §1 实况叙述（「CLI + VS Code 同开同 repo，靠口述协调」） | 立项动因叙述 | 动机已入 §1（「文件竞争要靠用户口头协调」）——同一事实不重复（D2） |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档头注对会话存储档的指针（判活 / 槽位认领机制） | 相邻机制正文 | 归 `docs/core/design/SESSION.md` 与 `docs/core/design/WORKSPACE.md`（本档只留边界句） |
| 「机制在位无档补建」建档批注 | 建档批序 | 一次性材料——归批次档 |
| CLI 侧旧档 §2 外部写感知（F6 面板自动刷新 / N5 事件驱动 + 自扰抑制 / N6 可降级——VSC 设置面板面，2026-09-11 第 21 批） | VSC 专有面需求（设置面板 = VSC 界面形态） | **P2 ⇒ VSC 轮**——归 VSC 侧 SETTINGS 板块承载；本档不并 |
| CLI 侧同名需求档未迁面 | CLI 产品需求正文 | **已并入（2026-09-15 CLI 尾部真批）**——零实质缺口，(d) 类入 §5.1 |
| VSC 自持镜像面（`thincoder-vscode/src/extension/{peer-instances,session-slots}.mjs`）的活判定身份校验（F-MI6 同源） | 端面实现独立（多实现面纪律——N-MI2）；判活 / 标记判据以**核单源**为准（F-MI6 / N-MI6）；独立性指其余**行为语义面** | **本批落地（引核收正 · 2026-09-18 设计评审）**——本地判活 / 标记副本删除，判据引核 `thincoder-core/process-probe.mjs`（端侧只留 END / 命名空间薄壳）；核 / CLI 面本批同修 |

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/requirements/MULTI-INSTANCE-COLLAB.md` 逐节对账——**零实质缺口**
  （F1–F5 ⇒ F-MI1–F-MI5 · N1–N4 ⇒ N-MI1–N-MI5），零新增正文；§2 外部写感知（F6 / N5 / N6）= VSC 面板面（P2）登记 §5.2 不并；
  (d) 类入 §5.1；档头补设计侧指针（本批新建 `docs/core/design/MULTI-INSTANCE-COLLAB.md`）。旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 4**）：建档——`thincoder-vscode/docs/requirements/MULTI-INSTANCE-COLLAB.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；判定句坐标按现状实核改写（实现面改指 `thincoder-vscode/**` 现状路径）。
- 2026-09-16（**批 1 CORE-DEFECT-FIXES** · eng-designer）：新增 **F-MI6**（活判定身份校验——标记族命中才计活 · 探测失败保守保留）与 **N-MI6**（判据单源 · 方向不对称）；
  F-MI1 / F-MI2 判定句补**核面坐标**（`thincoder-core/peer-instances.mjs`——此前只列 VSC 自持镜像）；§5.2 补 VSC 镜像面同源缺陷去向行（VSC 轮）；§6 体量读数同步。
- 2026-09-16（**批 1 CORE-DEFECT-FIXES · 复审修正轮** · eng-designer）：**F-MI2 判定句收口**——`peerInstances()` 条目含 `self`；工具输出白名单 = `{pid, end, sessionId, slots}`（= N-MI4）。
- 2026-09-18（**判据面收正批 · 父侧直接执行 · 可 revert**）：**F-MI4 撤项**——「清单写盘重读合并」的载体已随 M7 checklist 族退役（`docs/core/design/MULTI-INSTANCE-COLLAB.md` §5 历史条）⇒ 该需求条**移除**（现役面不留失效挂尸——承用户 2026-09-18 失效表达裁定）；并发写面现行承载 = 台账 SQLite 存储（台账 #11）。
- 2026-09-22（**措辞退场批（wording-retire）· 需求面 · 父侧直接执行 · 可 revert**——承用户 2026-09-22 08:15 裁定 + 批档 `docs/batches/2026-09-22-wording-retire.md`）：§5.2 行去「N-MI2」后的并列措辞 gloss（现文 = 「端面实现独立（多实现面纪律——N-MI2）」——判据面零变）；旧并列措辞从活面退场。
- 2026-09-25（**批 intent-claims · 需求新增 · 父侧**——承用户 05:01「我觉得可以把#23启动做了」；台账 #23 P1 意图认领层）：新增 **F-MI8 意图认领写入面** · **F-MI9 写前命中与软提示升级** · **N-MI7 认领面成本与降级**（判定句逐字如上表；设计档 = `docs/core/design/MULTI-INSTANCE-COLLAB.md` §4.4（D-MI17–D-MI21），批档 = `docs/batches/2026-09-25-intent-claims.md`）。
- 2026-09-25（**peer 收口批 · 需求面同步 · 父侧直接执行 · 可 revert**——承批 `docs/batches/2026-09-25-peer-closeout.md` 评审轮 1 修正（发现 2）；口径单源 = 设计档 §8 D-MI24）：**N-MI2** 射程句同步——补「无端差纯函数 / 落盘原语共享不属『实现各自独立』射程」（D-MI23 / D-MI24），「独立性指其余面」收正为「其余**行为语义面**」。设计面同批零偏。
- 2026-09-25（**peer 收口批 · 补记两笔 · 父侧直接执行 · 可 revert**——评审轮 2 报告收尾，承批 `docs/batches/2026-09-25-peer-closeout.md`）：① §5.2 理由列口径随 N-MI2 收正（「独立性指其余面」→「其余**行为语义面**」）；② **F-MI3 核面坐标补入**补记（域面 / 写侧各列核——与 F-MI1 / F-MI2 同形；笔迹 = 父侧 2026-09-25 承本批设计轮观察闭环）。
