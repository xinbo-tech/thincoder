# 会话与历史（SESSION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 会话数据层 | `thincoder-core/session.mjs` · `session-store.mjs` · `session-segments.mjs` · `session-guard.mjs` · `session-migrate.mjs` · `session-rename.mjs` | `thincoder-vscode/src/extension/session-io.mjs` · `session-slot-write.mjs`（记录存储内联） |
| 槽位 | `thincoder-core/session-slots.mjs` | `thincoder-vscode/src/extension/session-slots.mjs` |
| 清理 | `thincoder-core/session-gc.mjs`（+ `session gc` 子命令） | `thincoder-vscode/src/extension/session-gc.mjs` |
| 历史读取工具 | `src/agent-tools/read-history.mjs` | 同名（同路径对） |

**存储契约**：两端读写同一批档同一 `version`（1 / 2）——同一 `~/.thincoder/sessions/<hash>.json.{N,manifest}`。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 89 | `agent-tools/read-history.mjs` | 同路径 | 0.3881 · 异 | ③ | 进核 | 以 CLI 为准（相对路径按 cwd 解析 + 宽松版本校验 + 磁盘全量可查） | 分叉 ＝ ① 相对路径解析 ② 版本校验口径（`version` 1/2）③ 本会话可查范围——CLI 流式迭代磁盘 `src/agent-tools/read-history.mjs:295-304` / VSC 只读内存 `:260`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 123 | `thincoder-core/session.mjs` ↔ `src/extension/session-io.mjs` | ② | 融合：数据层取一侧 + VSC 的 `history-window` 拆面按核内结构归位 | 分叉 ＝ 目录归属（VSC 住 `extension/`）；存储契约两端自述同格式（同一 `~/.thincoder/sessions/<hash>.json.{N,manifest}`——VSC 头注 `:2-8`）⇒ 前提成立 | — | S1（建核补齐） |
| 124 | `src/session-slots.mjs` ↔ `thincoder-vscode/src/extension/session-slots.mjs` | ② | 融合：取一侧（slot / manifest / 认领 / 属主判定） | 分叉 ＝ 目录归属；头注互指「同构镜像」（CLI `src/session-slots.mjs:19` / VSC `:21`）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 125 | `thincoder-core/session-gc.mjs` ↔ `thincoder-vscode/src/extension/session-gc.mjs` | ② | 融合：取一侧；冷 cwd 手动面 = **双端同面**（2026-09-21 端差注销——VSC 补命令入口走数据面 API；判据 / 执行面单源见 §6.17） | 分叉 ＝ 目录归属（端壳档纯转口重导出核五名）；保留期 / 阈值两端同值 ⇒ 前提成立 | — | S1（建核补齐） |
| 126 | `src/session-store.mjs` ↔ `thincoder-vscode/src/extension/session-slot-write.mjs` | ② | 融合：核内单一记录存储 + 槽写入面归位 | 分叉 ＝ 切分与目录归属（VSC 记录存储内联于槽写面）；槽写语义两端同 ⇒ 前提成立 | — | S1（建核补齐） |
| 127 | `src/session-segments.mjs` · `session-guard.mjs` · `session-rename.mjs` · `session-migrate.mjs` ↔ 核内（VSC 侧内联于 `session-io` / `session-slots`） | ② | 融合：按核内结构归位（段 / 归属守卫 / 改名 / 旧短哈希迁移四面各保留） | 分叉 ＝ 拆档粒度（VSC 未拆）；能力面逐条对位（VSC `session-io.mjs:92-113` 迁移遍 / `:399` 改名枚举同构）⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A14 | `agent-tools/read-history.mjs`（#89） | ① | 相对路径按 cwd 解析；只要求有 `history` 数组；本会话流式迭代磁盘（`:295-304`）；空 path 明确报错 | 相对路径不做 cwd 解析；要求 `version` 1 / 2；本会话只读内存（`:260`） | 以 CLI 为准（相对路径 + 宽松校验 + 磁盘全量） | ① VSC 里传相对路径不再直接 `not found`；② 旧版 / 无 `version` 字段的会话档从「拒」变「可查」 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12 搬入）

**本子系统无对外契约变更行**（§2.12.2 无对应行；§2.12.3 第 3 行「会话 / 历史面」为**已兼容**登记）：

| # | 项 | 为何无法兼容（实测 / 证据） | 上抛形态（四要素） | 裁定状态 |
|---|---|---|---|---|
| 3 | **会话 / 历史面** | **已兼容**（无需上抛）：两端读写同一批档同一 `version`（1 / 2）+ 旧短哈希迁移面**单源**（核 `session-migrate.mjs`——经核 `sessionPath` 首次访问时调用，`thincoder-core/session-slots.mjs:58-61`）⇒ 归一后历史可直接续读 | 登记为「已兼容」· 兼容形态 = 复用现成迁移函数 | 已兼容（登记） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。
**本批（SESSION-CLAIM · 2026-09-21）落点表** = `docs/batches/2026-09-21-session-claim-release.md` §2（唯一承载面——一次性批次材料）；本档 §6.16 承载判据句 / 边界情形 / 验收回指。
**本批（STARTUP-LATENCY · 2026-09-21）落点表** = `docs/batches/2026-09-21-startup-latency.md` §2（唯一承载面——一次性批次材料）；本档 §6.17 承载判据句 / 边界情形 / 端差注销 / 验收回指。
**本批（EXIT-CLAIM-RELEASE · 2026-09-21）落点表** = `docs/batches/2026-09-21-exit-claim-release.md` §2（唯一承载面——一次性批次材料）；本档 §6.18 承载判据句 / 接线序 / 边界情形 / 验收回指。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/SESSION.md`（866 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：已作废 / 旧结构叙述（(d) 类）· 一次性批次材料（受影响文件表 / 用例表 / AC 表 / 变更流水账）· 时点状态行与交付核销标记。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**（CLI 侧会话实现住 `src/**`）——本节一律按**现状路径**落笔（会话数据层住 `thincoder-core/**`；`thincoder-cli/src/tui/**` = CLI 壳体面）。符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 存储模型

- **按 cwd 隔离**：会话目录 `~/.thincoder/sessions/`——文件前缀 = cwd 的 **40 位完整 sha1**（非截断）。
- **Windows 盘符大写归一化**：CLI `process.cwd()` 与 VS Code `uri.fsPath` 算出的盘符大小写不同，归一化保证两端得到同一 hash。
- **槽位制、无「当前文件」**：`{hash}.json.N` = 第 N 槽位的完整会话；`{hash}.json.manifest` = 槽位元数据 + active 指针 + 进程认领表 `slotSessions`。
- **active = 共享当前指针**（**不是「当前会话」**）：旧版端 / ACP 的恢复依据 + 无记录端的一次性继承源 + 列表回退高亮；**本端恢复依据 = 本端 end marker**（§6.10），不再以 active 为第一依据。
- **文件无上限**：槽位按需递增（`/session` 查看 / 切换，`/new` 开新槽）。
- **旧格式迁移**（`thincoder-core/session-migrate.mjs`）：12 位短 hash（VSC 历史 16 位）文件**一次性**重命名为 40 位（幂等、首次访问时执行）；legacy `{hash}.json`（v1 单会话）读取时迁移进槽位。
- 目录形态：

```
~/.thincoder/sessions/
  {hash}.json.N                    # 槽位会话文件（N 从 1 递增）
  {hash}.json.manifest             # 槽位元数据 + active 指针 + slotSessions 认领表
  {hash}.json.manifest.cli|.vscode # 本端记录 end marker（§6.10——各端单写者）
  {hash}.json                      # legacy v1 单会话（读取时迁移进槽位）
  {hash}.json.*.tmp / .corrupted / .unreadable / .bak-* / .manifest.corrupted
```

### 6.2 并发安全（CLI ↔ VS Code 双进程）

**认领与属主**：

- **sessionId** = 每进程唯一 `pid-timestamp-random`（manifest `slotSessions` 的认领值）。
- **ensureActive 认领序**：① 当前 active 空闲 → ② **文件缺失的空槽号**（不认「最小空闲号」——死主的旧槽文件仍在，会 resume 进陌生会话且退出时覆盖）→ ③ 全被活进程占用时开新槽（新号从 max+1 起，跳过活认领号 / 现存文件号；max 取 `allSlots[last]` 而非 spread——数万槽位时 RangeError 风险）。
- **死主条目清理**：`ensureActive` 开头删除 owner 已死的 `slotSessions` 条目。纪律：死主判定**必须跑批量判活 + 三态判据 `ownerState`**（不能以「文件缺失」短路——活进程在「认领→首次保存」窗口文件暂缺，误删会致双进程同槽；**不得以探测失败当死**）；清理落盘**必须传 `deletions` 参数**（条目级合并会把磁盘上仍存在的死条目从 fresh 复活回写）；`deadParam` 按调用时状态过滤刚重新认领的槽。
  **批 1 扩（2026-09-16）**：死主判定 = 身份复核双条件——pid 死 ⇒ 删（既有）；pid 活 + 命令行**明确可得且不命中本产品标记族** ⇒ 同判可删（pid 复用即此场景）；探测失败 / 缺行 ⇒ **保守保留**（探测失败 ≠ 死）。判据单源 = `process-probe.mjs` `filterDeadOwners`（本模块只调一行——详面 = `MULTI-INSTANCE-COLLAB.md` §3.1 / D-MI11）。
  **探测形态（2026-09-18 · F-MI7）**：判活 = **入口一次探测束**（`probeOwnersAsync` / `probeOwnersSync`）+ `ownerState` 查表——本模块 `cleanDeadOwners` / `usableSlot` / `allocateFresh` / `ensureActive` **零自有 exec**；认领链 `resumeSlot` 为 **async**；探测失败 / 缺行 ⇒ **未知 ⇒ 保守保留**（D-MI10 同向）。
- **`isProcessAlive(pid)`**：Windows `tasklist /FO CSV`（PID 列精确比对） / Unix `kill(pid, 0)`；**实现住 `process-probe.mjs`**（本模块 re-export 保 import 面零变）；同步有界 2 s，**返回 `true | false | undefined` 三态**（`undefined` = 未知——超时 / 探测失败；未知不作「死」判据，与 D-MI10 同向）。
  **认领 / 占用 / 清理 / 新会话死主四路不经它**：改经批量束 + `ownerState` 三态判据；**「假 ⇒ 判死」形态的调用点一律改经 `ownerState`**（未知 ⇒ 保守保留）——不得布尔化消费三态结果。
  **消费面全枚举（本批改经束）**：核内 `session.mjs`（`:385` / `:400` / `:497`——含 `slotOccupancy`）· `session-slots.mjs`（`:213` / `:248` / `:275` / `:301` / `:436`）
  · `session-gc.mjs`（`liveSlots` / `deleteColdCwd`）+ `session-stale.mjs`（`listStaleCwds`——存量面同判）（**符号锚 · as-of 2026-09-21**；未知 ⇒ 不判冷 / 保留）⇒ 全部改经束 + `ownerState`（零判定消费残留）；
  端侧 `thincoder-vscode/src/extension/session-io.mjs:91` / `:100`（+ 镜像档）= 随 F-MI6 引核收正（判定收归核束；端侧薄壳只留 END / 命名空间面）。
- **slot 粘性**：`saveSession` 首次认领后缓存 `agent._slot`，**永不重跑** ensureActive（原实现每次保存重推——manifest active 被并发方翻动时会话静默迁移 → 双副本 / 覆盖他人）；`applySession` 清空缓存；ACP 加载路径显式钉回目标槽。
- **ACP 同进程多会话**：`session/new` 立即钉独立槽；load/resume 钉槽前查 `sameProcessPinned`（同槽占用 → 显式 fork 新槽）；**绝不 `_slot = null` 等下次保存**（会落回同进程 active 槽即他人槽）；`session/delete` 删非 active 槽时立即重钉。
- **`slotOccupancy`**：目标槽是否被**另一活进程**占用——**排除本进程属主**；探测 = **入口一次有界批量束**（`probeOwnersSync`，零逐 pid exec）；**探测失败 ⇒ `{ occupied: true, unknown: true }`（保守：未知不得认领、不报空闲——D-MI10 同向）**。

- **认领释放（F-CR1 · 2026-09-21 · SESSION-CLAIM 批）**：认领**随绑定走**——绑定迁移落点执行「释放本进程残留认领」。**保留集公式** = 落点槽 ∪ 本进程其余活绑定槽（同 cwd manifest 内）⇒ 释放谓词 = `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`；目标被占 ⇒ 保留集 = 空。各落点 = 公式代入（`newSession` ⇒ {新槽} · `switchToSlot` 未占 ⇒ {目标} / 被占 ⇒ 空 · `claimSlot` ⇒ {认领槽}）；活绑定集口径 per end 见 §6.16。
- 落点 = 三个核原语 + 端壳对应件（对称）：`newSession` 的 `releaseStale` 选项由**调用面 opt-in**（CLI `/new` 传、ACP 不传）· VSC 端壳 `newSlot` / `switchToSlot` / `resumeSlot` 包装同判据（§6.15）。
- **ACP 不入释放面**：可核调用面清单（`newSession` 四点 / `switchToSlot` / `claimSlot` 逐条实读）= §6.16 表。
  落盘 = 释放集并入各落点**既有那一次** `saveManifest` 的 `deletions.slotSessions`（**落盘判据三条**——写盘同一次 fresh 快照 / 值条件删除 / 内存认领表移除——见 §6.16）；`active` / `m.slots` / 槽文件 / 端标记一律不动（只删属主条目）。
  安全性：释放后他端可认领；本进程再切入 ⇒ `slotOccupancy` 判占 ⇒ 不认领 + 下次保存 fork ⇒ 零双写（互覆保护不依赖旧认领）。边界情形与不做面见 §6.16。

**写盘防护**：

- **原子写**：先写 `.tmp` 再 rename（跨盘失败降级 unlink+rename → 直写）——防中途崩溃产生截断 JSON。
- **`.corrupted` 兜底**：读失败的文件改名 `.corrupted` 保留现场、不覆盖；**损坏的 manifest 同样改名 `.manifest.corrupted`**（否则覆盖后全部槽位元数据丢失、`/session` 列表变空）。
- **`.unreadable` 保留**：version / cwd / history 结构校验失败改名 `.unreadable` 保留现场（不静默返回 null）；**`version > 2` 的新版文件不动**；cwd 不匹配（别人的文件）也不动。
- **覆盖防护（`.bak` 轮转）**：写前校验目标槽 `sessionStart` 与本进程不符 → 先 rename `.bak-{ts}` 再写；**`version > 2` 的文件无论 sessionStart 一律轮转**；检查按 mtime 缓存避免每次保存全量解析。
- **`saveManifest` 条目级合并**（`{...fresh.slots, ...m.slots}`）：**删除意图经 `deletions` 参数显式表达**；**active 是单值**——只有显式翻指针的调用点（ensureActive 分支 / newSession / switchToSlot / deleteSlot 删到 active）传 `setActive`，其余调用点默认保留磁盘 fresh.active。

### 6.3 会话文件内容（v2 · 双线结构）

字段集：`version`（1 = 旧单线；2 = 双线；> 2 只读不动）· `cwd` · `title` · `activeProvider` + `activeModel`（槽双字段**恒非空**）· `updatedAt` · `history`（人读线）· `contextHistory`（机读线）· `tasks` · `planMode` · `autoApprove` · `engineering` · `engDesignToken` · `goal` · `advisor` · `pendingReminders` · `sessionStart`。

- **双线写入契约**：真实消息（用户输入 / assistant 回复 / tool 结果 / 多模态图像）走 `pushReal` → 同时进 `history` 与 `contextHistory`；**机读消息**（`[System reminder:` / `[User interrupt:` / 压缩 note / task·plan 回注）只进机读线；**transient 消息**（编辑器上下文注入等）**人读线落盘时过滤**、**机读线保留**——恢复必须逐字节重建 provider 前缀缓存所见的序列。
- **`slimForDisplay`（人读线落盘瘦身）**：copy-on-write 映射（**绝不原地改**——两线共享对象引用）；assistant `tool_calls[].function.arguments` 截 300 字符；`tool` 消息 content 截 500 字符（head + 截断标记）；多模态 user content 数组保留 text part、**丢弃 image_url base64 part**；**`contextHistory` 一字不动**。
- **消息时间戳 `ts`**：每条真实消息 `pushReal` 单点打点（epoch ms）；压缩重建注入的 note 同刻打点；**「Understood」占位并入尾首 assistant 时随该条原 ts**（2026-09-16 并入分支——`thincoder-core/context.mjs` 并入分支）；**旧消息（恢复自存档）不补 ts**（补近似值误导取证）；`slimForDisplay` 保留 ts；ts 是**本地字段**（发送层剥离、UI 不渲染——仅 read_history 输出 / 会话 JSON 可见）。

### 6.4 保存与恢复

- **`saveSession`**：`history = (_fullHistory ?? history).filter(非 transient + 非 legacy-transient)`；`contextHistory = agent.history.filter(非 legacy-transient)`（**机读线保留 transient**）；写 `agent._slot` 槽 + 更新 manifest 摘要（`slotDigest`：messageCount / turnCount / firstMessage / activeProvider / title）；
返回轮转的 `.bak` 路径或 null。TUI 每次回合结束保存（崩溃最多丢半轮）。
- **恢复入口**：启动恢复（TUI）= `await resumeSlot(process.cwd())`（三支决策 + 认领 + 写本端 marker）→ `applySession` → `agent._slot = slot`（**首保存必落恢复槽**）；headless `thincoder chat` 不恢复。`loadSlotFile` = **无认领副作用**的槽文件读取器（version 1/2 + history 数组 + cwd 匹配）：结构不符 → `.unreadable`；解析失败 → `.tmp` 备份优先回退（回退成功则提升为正主）；
**主文件缺失时恢复孤儿 `.tmp`**。
- **`applySession`**：人读线 `_fullHistory` ← `data.history`；机读线 `agent.history` ← `data.contextHistory`（缺失/为空才回退 history 播种）；title / tasks / planMode / autoApprove / goal / pendingReminders / sessionStart / advisor 逐字段；`activeProvider ≠ 当前` 按名切回（找不到不回切）；
清 `_slot` / `_slotMtime` 与 `_compressFailures` / `_verifyRetries`。
- **机读线必须从 `contextHistory` 恢复**（从完整 history 重建会把已压缩的中间过程塞回上下文——实测 prompt 膨胀到 283%）。
- **v1 老文件回退播种**时剥离被 slim 截断的 `tool_calls.arguments`（以 `…` 结尾 → 置 `{}`——截断可劈断 `\uXXXX` 产生 400 毒载荷）。

### 6.5 切换与归档

- **`/new`**（`newSession` + `resetSessionState`）：分配新槽并**立即记录所有权**（防并发方认领）；**并释放本进程残留认领**（F-CR1——§6.2 公式代入：保留集 = {新槽}；`/new` 调用面传 `releaseStale`——见 §6.2 认领释放）；开头清理死主条目（连 `m.slots` 条目一并删、回收复用）；
`resetSessionState` 清 `_fullHistory` / `title` / `_sessionStart` / `_engDesignToken` / 压缩与验证计数 / `tasks` / `planMode` / `goal` / `reminders` / `_slotMtime` / `_slot` **以及进程级注入标志**（不清则新会话永不注入 OS/cwd reminder）；**不清 `autoApprove`**（用户偏好跨会话保持——有意）。
- **`/session`（`listSlots`）**：按 updatedAt 降序列出全部槽位元数据；**只读操作不认领**。
- **`/session N`（`switchToSlot`）**：**直接 `loadSlotFile` 读目标槽**（不经 activeSlot——有认领副作用）；只改 manifest 指针、**无文件拷贝**；目标槽空闲则一并认领 + 释放本进程残留认领（§6.2 公式代入：保留集 = {目标槽}），被另一活进程占用则不认领且保留集 = 空（旧认领一并释放——下次保存 fork 既有语义）（`slotOccupancy` 提示）；随后 `applySession` 清空 `_slot` 缓存。
- **删除与退出**：`deleteSlot` 删文件 + 清 manifest 条目 + `deletions` 显式删除 + 删到 active 时置空 active 指针；删到本端记录槽 → marker 置 null（文件保留）；ACP `session/delete` 只删 archive，**在存会话立即 `newSession` 重钉**；`/exit` / Ctrl+C 只保存当前槽（**退出不归档**——避免「打开关掉就塞满槽位」）。

### 6.6 与 VS Code 的契约对齐点

- **基础契约**：cwd hash（40 位 sha1 + 盘符大写）· 槽位认领（slotSessions + 判活束 / `ownerState` 三态）· 双线落盘（`history` + `contextHistory`）· 旧格式回退（无 contextHistory → 从 history 播种）· transient 过滤（人读线过滤、机读线保留）· 本端记录 marker（形态 / 写者 / 置空语义双端一致）。
- **跨端共享契约增补**（2026-09-01 四模型共识）：`sessionStart` 打点（CLI `setup.mjs` 赋一次 / VSC `saveLines` 赋一次——**VSC 恒 null 则覆盖防护永不触发**）· legacy transient 过滤（读 loadSlotFile + 写 saveSession 双点）· 机读线判定（`contextHistory.length > 0`，否则 VSC 恢复空机器线）· v1 回退剥离截断 args · 同会话并发追加检测（VSC 磁盘 history 比待写快照长 → 轮转 `.bak`）· 
`activeModel` 双向 · manifest 死主清理（`deletions`）· `loadManifest` 容错（`!m.slots` → `{}`）· 读校验顺序（**cwd 先行**——「别人的文件不动」优先于结构校验）。
- **新字段双端同步条款**：CLI `saveSession` 全量覆盖写、VSC `saveLines` `...existing` 保留未知字段 ⇒ 两端字段集必须同步演进；任一端新增槽内字段须在同一变更中双端实现，否则 CLI 保存会**静默删除 VSC 侧新字段**。

### 6.7 会话标题生成

**链单源（双端同一套机制 · 2026-09-21 块标题行对齐批）**：源 / 生成 / 触发 / 写 / 读·展示**五环**两端同源（谓词 ∈ 源、时点 ∈ 写），各端只留端壳（触发调用 + chrome）。

- **源 = 首条真实 user 消息**，谓词单源 = `isRealUserMsg`（`thincoder-core/history-window.mjs:17-19`：角色为 `user` ∧ content 为串 ∧ 非 `[System reminder:` 前缀）。
  CLI 取记录存储 `firstUserMessage()`（绑定态；未绑定回退内存人读线——`thincoder-core/generate-title.mjs:104-123`）；VSC 取内存人读线（`fullHistory` 经 `keepReal` 过滤——端壳 `thincoder-vscode/src/extension/panel-session-write.mjs`）。
- **生成** = 核 `generateTitle(userContent, provider)`（`thincoder-core/generate-title.mjs:23`）：三格式分派 · **显式禁用思考**（OpenAI 兼容 body 加 `thinking:{type:"disabled"}`；anthropic / google 分支不传即不思考）· `max_tokens` 100 · 标题规范 ≤40 字符无引号 · 超时 10s · 失败静默返 null。
  两端同调该函数（VSC 端壳 `thincoder-vscode/src/extension/generate-title.mjs` 只做 key / provider 解析——无第二请求实现）。
- **触发** = 会话**尚无标题**即尝试（一次成功即停；失败静默、下回合再试——两端同判据：CLI `ensureSessionTitle` 的 `title` 在场短路；VSC 端壳读槽 `title` 空判）。
- **写形 = 单写**：标题值随**回合尾整档 save** 落盘——CLI `agent.title` → `saveSession(agent)`（`thincoder-core/session.mjs:121`）；VSC `saveLines` 的 `extra.title`（`title: extra.title ?? existing.title ?? ""`）。两端均不为标题另开第二写。
- **时点** = 回合尾、整档 save **之前**生成（两端同序）；标题期 = busy 窗口（VSC 面另见 §6.15）。
- **读 / 展示**：**列表面**（CLI `/session` / VSC `pushSessions`）两端同读 `listSlots` 的标题（回退链 `title → firstMessage → "(empty)"`——VSC `pushSessions` 同链）；
  **常显 = 两端 chrome 常驻**（VSC 面板顶栏 / CLI 状态行段——CLI 段取值 = `agent.title` 活读 · **空值零注入**（非回退链）；落点设计 = `docs/cli/design/TUI.md` §7.4；D8 消 · 2026-09-21）；
  空窗差（生成前 / 失败期：VSC 顶栏显回退链值 ∥ CLI 段零注入）= **已登记端差**（A9——结构性不对称 + 证据 + 显式裁定）；`/session` 列表按需面不变。
- **边界**：标题规范 / 超时 / 失败语义 / 手动重命名链（`renameSlot`）零改；机器注入消息（`[System reminder:` 前缀）永不入标题源。

### 6.8 会话恢复时 provider/model 无效 → 模型重选

触发场景：会话保存时用的 provider（或模型）已不存在，重进时 config 里已无——曾直接 throw → uncaughtException 报错退出、进不了 TUI。现改为引导 UI 重选。

- **模型 = 显式复合 `provider:model`**：config 顶层 `defaultModel` 是**新会话起点**；会话槽 `activeProvider` + `activeModel` 双字段恒非空——恢复 = 槽值（不看 config）。
- **D-S1 启动前校验**：`loadConfig` 对 defaultModel 缺失 / 无效**不再抛错**——runtimeProvider 置空对象 `{}` + `providerInvalidReason`（「无效」判据收窄为三类：空值 / 缺冒号或段残缺 / 未知 provider——**不含「候选外」**）；`validateProvider` 幂等（判据 = model / baseURL / name 缺失；**MODEL_SPECS 成员资格不是 allowlist**）。不抛错、不退出；
TUI 路径在 `startTUI` 前置 `agent.provider = null`。
- **D-S2 TUI 重选流程**：`startTUI` 首帧前检查 `_providerInvalid`（或 `!agent.provider`）→ 先弹模型选择 picker → 选定后继续正常启动；取消（Esc）→ **仍进入 TUI** + 提示行（绝不因无 provider 拒绝进入）。
- **D-S3 恢复优先级**（`applySession`）：① 槽 `activeProvider` 在 providers[] 存在 → provider/model 按槽值设（legacy 槽 activeModel 缺省 = 回该渠道默认模型）+ 重算 compactThreshold（auto 时）+ 返回 switched；② 槽 provider 没了 → **静默保持现状**（仅当两方都无效才弹）。
- **D-S4 headless**（`thincoder chat`）：遇无效 defaultModel → `console.error` 可读消息 + `exitSoon(1)`（不弹 UI、明确退出码）。
- **关键决策**：检测后置 provider = null（空对象流入下游是崩溃源）；校验点收敛到 assembleAgent 之后一处；**否决**启动即退出打印「请编辑 config」· 静默回退第一个可用 provider · 自动用 defaultModel 覆盖会话槽模型（用户上次明确选的模型不能静默丢）。
- 模型面机制权威（清单 provider 化 / 放行语义 / 渠道准入）→ `PROVIDER.md`（本节只承载会话恢复侧）。

### 6.9 消息时间戳与 read_history 工具

- **描述**：查本会话消息历史（`agent._fullHistory`——压缩不丢——审计完整）——回忆之前说过 / 做过的事（决策 / 工具时序 / 过去裁定）。
- **筛选**：role / keyword（content 子串）/ tool（工具消息 name）/ since / until（epoch ms）/ limit（**默认 50、上限 200**）/ direction（oldest|newest——默认 newest）。
- **时间窗**：since / until **inclusive-inclusive**；since > until → 空结果；排序按数组序（ts 仅过滤不重排）。
- **返回**：JSON 数组——`{ts, role, name?, tool_call_id?, content 截断, tool_calls 概要}`；内容逐条截断（~500 字符 + 标记）；无 ts 消息：不匹配时间窗 + 返回 `ts: null` 标记。
- **数据源** = `agent._fullHistory`；**readonly: true**（planMode 放行 / 免审批 / explore 只读集自动）；注册 = agent-tools 聚合 + setup——**depth-0 only**（子代理查父历史语义混淆）。

### 6.10 端分离恢复：本端 end marker

> 解决的问题：CLI 与 VSC 面板同开同一项目时，共享 manifest 的 active 指针两端互写——退出重进恢复进「另一个不是退出前」的会话。用户裁定：① 完全各记各的；② 迁移一次性继承（无本端记录时继承共享 active 的死主槽**一次**——记录写下后永久分离）。

- **D-1 记录形态**：路径 `{hash}.json.manifest.cli|.vscode`（manifest 旁的独立小文件——**非 manifest 内嵌字段**）；内容 `{"slot": <number|null>, "updatedAt": <epoch ms>}`；**文件缺失 = 从未记录**（迁移窗口，可继承一次）；**`slot: null` = 显式置空**（删过本端槽）——两者必须区分；读侧降级 = 缺失或解析失败一律按「缺失」处理（不 rename 不 unlink），`slot: null` 除外（**绝不继承**）；写者仅本端；
端常量 CLI `"cli"` / VSC `"vscode"`。
- **D-2 恢复决策**（`await resumeSlot(cwd) → {slot, data}`——**async**，2026-09-18 起）：① 本端记录可用（slot ≠ null 且 ∈ m.slots 且槽文件在盘 且属主 空/死/本进程）→ 认领 + 读槽；② 记录缺失 → 一次性继承（m.active 在且 ∈ m.slots 且文件在盘 且属主 空/死）→ 认领 + 写记录；③ 其余一切（slot:null / 槽已被删 / 属主为活外人 / 继承失败）→ 全新分配 + 写记录 + data = null。
- **claim 后读槽失败**（解析失败 / `.unreadable`）→ **保持已 claim 槽 + data:null**——不回滚认领、不改 marker；下次保存原地重建该槽。
- **missing → 继承、null → 全新**的区分理由：删槽后置 null 使「删过」可辨认——用户删除自己会话后重开 = 全新起步，不继承对方遗留、不复活被删会话。
- **D-3 启动钉 `_slot`**：`await resumeSlot` → `applySession` 之后 `agent._slot = slot`——否则并发方在首回合前翻 active，首次保存会静默迁移到新槽（恢复确定性要求**首保存必落恢复槽**）。
- **D-4 marker 维护点**（每次落点原子写，失败容忍）：CLI `resumeSlot` 各步 / `saveSession` 首认领之后 / `newSession` 成功后 / `switchToSlot` 成功后 / `deleteSlot` 删到本端记录槽 → 置 null（文件保留）；
  VSC 镜像（ensureSlot·status / newSlot / 打开历史会话 / deleteSlotAndUpdate；**2026-09-18 起 `ensureSlot` 冷路径零探测**——收敛成功落 marker，维护点语义不变；**打开历史会话 = 未占目标槽才写**——端差判据见 §6.15）。
  **非维护点**：日常保存（`_slot` 粘性已定，不写 marker）。
- **D-5 listSlots 高亮按端**：`listSlots` 保持 manifest active 语义（ACP session/list 零变化）；TUI `/session` 与面板高亮改以本端记录槽为准；manifest active 保留为跨端回退高亮。
- **D-6 manifest.active 定位修订**：认领 / 新建 / 切换 / 删除的 setActive 纪律**原样保留**（旧版端互操作 + ACP + 继承读取 + 列表回退）；仅新型恢复决策不再以它为第一依据。
- **D-7 混合版本矩阵**：新版 + 新版 = 完整分离（目标态）；新版 + 旧版（任一方向）= 旧版仍翻 active / 抢死槽，数据安全但退化为现状形态（建议同步升级）；旧版 + 旧版 = 现状。升级过渡首日仅先启动端能继承共享 active 死槽——一次性继承的固有代价。
- **D-8 已知限制**：同端多活进程时 marker 为「端内最后认领者」语义——后启动者覆盖 marker；交错重启时先者会话需 `/session` 手动找回。ACP 不经 marker（显式钉槽不变）。
- **被否方案**：① manifest 内嵌 `cliLast` / `vscodeLast` 字段（双端写同一文件 + 旧版写丢未知字段）；② 恢复目标 = updatedAt 最新槽（跨端每次保存互触、语义不符）；③ 取消一次性继承（升级后第一次打开即触发原 bug）；④ 只修 CLI（VSC resolve 仍翻 active ⇒ **必须双端同批**）。

### 6.11 agent 运行环境自我感知（env-state reminder）

- **机制**：每回合注入**一条统一的「环境状态」transient reminder**（与 AUTO / 时间 reminder 同通道、同可变形态——避 prefix 缓存）——一次注入覆盖家族四项；变更在下回合自然感知。
- **行模板**：`[System reminder: env: {cli|vscode}, mode: {eng|normal}, model: {model-id}, slot: {N|null}, resumed: {yes|no}.]`
- **字段映射**：`env` = 运行身份（仓常量 `END`，不做 cmdline 判别）· `mode` = 工程模式（`config.agent.engineering`）· `model` = `activeModel ?? provider.model ?? "unknown"` · `slot` = **粘性当前会话槽**（CLI `agent._slot` / VSC `_engPersist.slot`——**非 manifest active 共享指针**；无绑定窗口如实 `slot: null`，**不读 active 回退**）· 
`resumed` = 会话恢复感知（有历史的会话被恢复后**首个回合 `resumed: yes` 一次**，后续回合 no；无恢复事件恒 no）。
- **规则**：**git 不入 env-state 行**（CLI 已有富 git context 注入，VSC 补同款，不重复 clean|dirty 摘要）；**不改身份文本**（身份经 env 字段携带）；消费指导：`resumed: yes` → 进程级内存态已随旧进程消失（designToken / async 注册表 / guard 标记等不假设仍在）；错误路径安全降级（slotSessions 不可读 → 注入不崩、字段降级）。
- **注入句解耦**（双信号分离）：`process restarted` 句 = **进程级信号**（VSC 模块级闸 `restartDetectionDone` 保留不迁；CLI 进程启动专用标记——仅启动 resume 路径设一次）；`resumed` = **会话级信号**（VSC agent 级 `_resumedPending`——agent 换槽销毁重建天然对齐；CLI `applySession` 武装恢复事件）。两信号独立——**切槽发 resumed:yes 不发 process restarted 句**。
- **顺带修复**：CLI 全新会话不误报 `resumed` / `process restarted`（去 `_sessionStart != null` 推断，改显式恢复事件）。
- 归属注：行模板本体（提示词 / 身份面）不在本板块——见 §8.2 登记行。

### 6.12 会话目录残留 GC 与标题写契约

- **残留分类与保留期**：`.corrupted` / `.unreadable` / `.manifest.corrupted` / `.bak-*` = 30 天；孤儿 `.tmp`（无对应主文件）= 7 天。
- **自动残留 GC**：触发 = 进程启动**窗外**的一次性延迟拍（核侧 `setTimeout`——**全链异步、零同步扫描**，2026-09-21 §6.17 / D-SE39）+ 可选手动命令；范围 = sessionsDir 下**当前 cwd 的 hash 前缀**文件（不跨 cwd 扫描）；**排除** = 活跃槽对应文件的任何现场后缀、manifest 主文件、end marker 主文件（保守）；保留期边界语义 = `mtime < now − retention` 即删（older-than，恰好等于保留期者保留）。
- **冷 cwd / 存量组清理**（**执行面双档**——90 天冷 cwd 面（cwd 存活组唯一出口）= **显式命令面**；三合取存量组 = **自动面（有界）+ 显式面（全量）**——**双端同面**，2026-09-21 端差注销见 §6.17）：
  判定 = 该 cwd hash 下**无任何活跃数据文件**（主文件不存在或全部属死主）**且** manifest mtime 距今 > **90 天**；**2026-09-21 判据扩**（cwd 不可达 / 零内容组 + 7 天安全窗——唯一公式与边界见 §6.17）；`session gc --dry-run` 枚举 sessionsDir 全目录（跨 cwd）报告不删；`session gc --confirm <hash>`（或 `--all`）
显式清理该 cwd hash 前缀**全部文件**（manifest + end marker + 死主槽数据文件 + 裸 v1 `{hash}.json` + 残留）——含数据文件是为避免制造**孤儿数据**；删除前警告 + **重校验**（TOCTOU 防护，期间变活跃则拒绝）；**2026-09-21 起经回收目录（可回退）**——§6.17。
- **标题写契约**：`renameSlot` / `setSlotTitle` 返回 `{ ok: true }` | `{ ok: false, reason: "file-missing" | "parse-failure" | "mtime-conflict" | "invalid-slot" }`——reason 与内部判定一一对应、**不含用户文本**（渲染由调用方决定）；双端同契约，调用方同步适配。
- **模块与实现约束**：GC 逻辑入**独立模块** `thincoder-core/session-gc.mjs`（不塞 `session-slots.mjs`——500 行硬限）；`renameSlot` 自 session-slots 拆入 `thincoder-core/session-rename.mjs`；残留 GC 与冷 cwd 共用文件集合判断；**存量清立面（2026-09-21）** = 分组 / 判据 / 回收入 `thincoder-core/session-stale.mjs`（§6.17）。

### 6.13 跨会话历史检索与检索族消歧

- **`read_history` 参数扩展**：新参数 `path`（可选——默认本会话）：目标会话文件路径（显式）或 `cwd:` 前缀指定目录（自动发现该 cwd 的会话槽）；**本会话缺省 = 零行为变化**（既有调用全不传 path）。
- **发现面**（path = `cwd:xxx`）：列全部槽 + 时间序——**不做死槽过滤**；每槽摘要行 = **槽号 + 完整文件路径 + title / 消息数 / updatedAt**（模型无法自行算 sha1(cwd) 拼文件名）；第二步深查 = `path = <摘要行的完整文件路径>` 重调。
- **检索护栏（双保险）**：行扫第一道 `READ_HISTORY_SCAN_MAX = 200,000` 行（流式计数）+ 消息数第二道 `READ_HISTORY_MAX_MESSAGES = 50,000`；两道超限返回**同一逐字文案** `{error: "session too large — refine keyword or since/until"}`（双端同常量同文案）；返回条数沿用 §6.9 的 limit 语义（> 200 → 200）。
- **错误路径**：未知 cwd → 明确错误返回；cwd 无槽 → 空列表 + 提示；目标文件缺失 / 损坏 → 错误返回不崩。
- **消歧总纲（描述尾段——实现时并入各工具描述）**：查**本会话**说过 / 裁定过 → read_history（默认）；查**别的会话 / 项目**旧对话 → read_history 带 path/cwd；查**本 run 改过哪些文件** → recent_changes；查**跨会话已存知识 / 约定** → memory search；查**项目设计文档** → doc_search；查**代码实现** → code_search；查 git 历史快照 → checkpoint（cat/list）。互相不替代。

### 6.14 长会话记录内存有界：磁盘为准 + 内存窗口

> 问题（事故形态）：人读线 `_fullHistory` 永不压缩、全量常驻内存——TUI 会话 ~19.4 分钟 ≈ 8GB 堆（爬升型 OOM）。用户裁定修复方向 = **磁盘为准 + 内存窗口**。

- **记录存储 = 定长分段 JSONL sidecar**：目录 `{槽文件路径}.d/`（与槽文件同目录同前缀；**VSC 侧不可见**——其 GC 后缀表 / 发现正则 / 迁移重命名均不匹配 `.d`）；`meta.json` = `{ "v", "segSize", "identity", "degraded"? }`——段粒度保险 + **会话身份锚**（防跨会话采纳）+ 降级标记；段文件 `seg-NNNNNN.jsonl`（六位零填充，**只追加、不回改**）；行 = `JSON.stringify(slimForDisplay(m))`——
与槽 JSON `history` 元素**逐字节同形**（投影零转换）；追加过滤与 saveSession 同源（跳过 transient 与 legacy-transient）。
- **索引与常量**（单源 = `thincoder-core/session-store.mjs`）：`RECORD_SEG_MESSAGES = 100`（绝对序号 i → 段 `floor(i/100)+1`、行 `i%100`）· `RECORD_WINDOW_MESSAGES = 200`（内存窗口——与首屏 `INITIAL_HISTORY_MESSAGES` 同值）· `RECORD_DIR_SUFFIX = ".d"`。
- **总条数与不变式**：`total` = `(段文件数−1)×segSize + 末段行数`（**末段空文件按 0 行计**）；**半行容忍**（末段尾行 JSON 解析失败视为未写完、忽略，不自动修复）；**段不可变不变式** = 仅末段可追加，轮转 = 末段满 segSize 后下一次追加新建下一段。
- **绑定与对账**（bind 时**先验身份、后比计数**）：① **身份核验**——`meta.identity`（会话身份 = `sessionStart`）vs 现场身份（`agent._sessionStart`）；两侧均非空且相等 → 同源；一侧非空一侧为空、或两侧非空不等 → **陈旧 / 孤儿 sidecar——不得采纳**（原目录改名 `.d.stale-<epochms>`，按现场重建）；两侧均空 → 采纳；② **计数对账**——`meta.degraded` 在场 → 以 JSON 为准重建（清标记）；
段总条数 < JSON 条数 → 以 JSON 为准重建整个 sidecar；段总条数 ≥ JSON 条数 → **以段为准**（崩溃后未保存消息可见）；两者皆空 → 新目录（懒创建）；③ **身份固化**——sidecar 创建时写 `meta.identity`（可为 null），每次投影保存时若为空且现场身份非空则补写。
- **落盘投影 = 流式拼接段文件**（`[` + 各段原文（已逐字节同形）+ `]`——无需重序列化，O(1) 内存；与既有形态逐字节同构）。
- **追加时点 = pushReal 同步追加**（单点；独立 try/catch）：崩溃保留最大化；读路径恒新鲜。**失败 = 降级（失败即停 + 标记 + 追赶）**：append 失败 → `_degraded` 置位 + **追加停写**（store 恒为连续前缀——杜绝中段缺口破坏段/行算术）；保存时若 `_memTotal > store.total()` 且缺口 ⊆ 窗口容量 → 先从窗口**追赶重试**追加；窗口已滑过缺口 → 不补写（宁停写不写洞）；追赶失败 → 降级保存（投影照 store 前缀 + `meta.degraded` + stderr 一行诊断）；
恢复面对账见标记 → 以 JSON 为准重建（清标记）。
- **数据流（改动后）**：写 = `pushReal(msg)` → `_fullHistory.push` + 窗口驱逐（> 200）+ `agent._recordStore?.append(msg)` → `agent.history.push`；存 = `saveSession` → 绑定则流式投影（`history` = 段拼接、`contextHistory` = 内存），未绑定则既有全量物化路径；恢复 = `loadSlotFile` → `applySession(agent, data, {slot})` → 绑定（身份核验 + 对账）
→ `_fullHistory = store.tail(200)`；读 = read_history 本会话 `store.iterate` / TUI 恢复 `store.tail(200)` + `store.total()` / 翻页 `store.page(绝对区间)`。
- **TUI 分页契约**：恢复描述符 = `{ history（≤201 = 尾窗 200 + ±1 页沿头一条——不渲染，供跨页回合标签判定）, total, base }`（单源 `sessionDescriptor()`；两调用点同源 = 启动路径与 `/session` 切换）；「N messages」标签口径 = `total`（非窗口长度）；翻页锚 = `state._historyTotal`；`store.page(start, end, { margin = 1 })` 返回 `{ messages, base }`——
±1 页沿供跨页回合标签判定与页末 tool_result 配对（缺 ±1 = 标签重复与配对失配回归）；顺带修复「活消息增长使翻页锚漂移」。
- **read_history 契约**：本会话（无 path）走 `store.iterate` 流式匹配（输出构造 / 字段 / limit 默认值与上限逐字不变）；跨会话（`path=` / `cwd:`）**逐字保持**读槽 JSON（投影全量）+ 既有护栏；未绑定（测试 / 模式 F）回退内存 `_fullHistory` 过滤。
- **语义 delta 登记**（不修）：匹配基准 = **存储文本（slim 后）**——工具结果 > 500 字符、工具参数 > 300 字符的尾段被 slim 丢弃 ⇒ 落于丢弃段的 keyword **不再命中**；输出截断省略数 N 按存储文本长度计（对已带存储标记者 N ≈ 标记长，不反映原始丢弃量）；真实丢弃量以存储全文为准。
- **生命周期联动**：`deleteSlot → unlinkRecordStore`（`rmSync` 递归）；`.bak` 轮转对**非本会话活动绑定面**联动改名 sidecar（判据 = `agent._recordStore?.dir`）；`.corrupted` / `.unreadable` 改名**不联动**（现场原地保留，由身份核验在槽号复用时拒采纳）；孤儿 sidecar 在 bind 处被拒并改名 `.stale-*`；冷项目 GC 用 `rmSync` 递归删目录；`/rename` 只改标题（sidecar 零动作）。
- **VSC 兼容红线**：槽 JSON `version` 2 / `history` 全量数组 / `contextHistory` 逐字节保持——**VSC 零改动**；VSC 继续全量覆写槽 JSON，CLI 侧对账规则保证下次绑定时以更长者为基准或拒采纳重建。

### 6.15 VS Code 面板装配接线面（VSC 轮并入 · 2026-09-15）

> **来源** = `thincoder-vscode/docs/design/SESSION.md`（520 行 · VSC 产品档——迁移期参照历史）。本节 = 该档中「根层所缺」的 **VS Code 面板接线面**（(a) 机制 / (b) 实现细节与坐标）。与 CLI 共享的契约正文（存储模型 / 并发 / 双线 / end marker / GC / 检索 / 记录存储）已入 §6.1–§6.14，不重复（D2）。

- **W11 接线面（2026-09-15 · CORE-UNIFICATION VSC 单元 W11——本节会话机制面单源 = 核）**：VSC 端壳五档
（`session-io` · `session-slots` · `session-slot-write` · `session-gc` · `panel-session`，均住 `thincoder-vscode/src/extension/`；
2026-09-16 VSC-DEBT 批（D-3）起 `panel-messages` 会话族 handler 另立 `panel-messages-session.mjs`——同属本面；
2026-09-18 拆分批起 `panel-session` 写面另立 `panel-session-write.mjs`——同属本面）
内部改指 `@thincoder/core/session.mjs` 族（`loadSlotFile` / `saveSlotData` / `listSlots` / `renameSlot` /
`slimForDisplay` / `isLegacyTransient` + `session-slots` / `session-gc` / `session-slot-write` 各面）；
存储契约 version 1/2 不变（同一 `~/.thincoder/sessions/<hash>.json.{N,manifest}`，与 CLI 共文件）。
`session-gc` 面（含启动钩子 `scheduleSessionGC`）**纯转口**——核钩子 `dir` / `prefix` 由 `sessionPath(cwd)` 派生
（随核 `_setSessionsDirForTest` 沙箱缝）；核 `gcResidue` / `listColdCwds` / `deleteColdCwd` 的默认 `dir` 为核内
configDir 版（端侧无直调点）。`sessionsDir()`（`thincoder-vscode/src/extension/session-slots.mjs:52`）= 核 `sessionPath` 反推
（核未导出根访问器）。
**端壳保留 = 端差两款**：
① end marker 层（`thincoder-vscode/src/extension/session-slots.mjs`：`END = "vscode"` `:60` · `readEndMarker` `:69` · `writeEndMarker` `:82`）
与其四个维护落点（`resumeSlot` / `newSlot` / `switchToSlot` / `deleteSlotAndUpdate`——`thincoder-vscode/src/extension/session-io.mjs`：`:88` / `:123` / `:175` / `:199`；
§6.10 D-4「VSC 镜像」——核对应件写死核端 marker `.cli`，直接消费 = 跨端互写；数据层 = 核 `loadSlotFile`，
端壳无核 `resumeSlot` 的裸 v1 单文件兜底——差异登记见批次档 §5）；`deleteSlotAndUpdate` 随槽删记录存储 sidecar
（核 `deleteSlot` 同源步 `unlinkRecordStore`——`thincoder-core/session-store.mjs:376`）；
② **（cwd, slot）型** token 台账三式（`thincoder-vscode/src/extension/session-slot-write.mjs:48` 起——核 token 面为 agent 型）。

- **运行中禁止切换（会话切换竞态修复）**：`newSession` / `deleteSession` / `switchSession`（webview loadSession）/ 项目切换三处均以 `_turnActive` + `_susp.active` 守卫（warning 拒绝——对齐 CLI `applyProjectSwitch` 模式）。运行中放行会让旧 turn 的 stream / complete / 标题灌进新会话视图（「思考串台」）、内容落错槽。
- **turnSlot / slotOverride（纵深防御）**：`saveLines` / `_saveLines` / `generateTitle` 带 slotOverride——`runPanelChat`（`thincoder-vscode/src/extension/panel-chat.mjs`）回合入口捕获 `turnSlot`，onComplete / abort / finally 的保存与标题一律落 `turnSlot` 而非面板当前 `_slot`——运行中即便并发切换，旧 turn 流也不灌新会话视图、内容不落错槽。
- **绑定入口三处**：`_slot` 为 null 时经 `ensureSlotAsync(panel)`（`thincoder-vscode/src/extension/panel-session.mjs:42`）
一次 `await resumeSlot(cwd)` 解析并钉槽（**async**，2026-09-18 起——boot 快段与 F-W18 后的 settings 推送链两处 `await`；`session-io.resumeSlot` 包装器在恢复入口顺带触发一次残留 GC 调度）——面板 `openSessionContent`（webviewReady 快段——B2 后绑槽归快段，
`status` 慢段不绑槽）、`onProjectChanged`
（`panel-project.mjs`——项目切换 / 多根 `setProjectFolder` 后 `panel._slot = null` 再重绑）、
`ensureSlot(panel)`（`thincoder-vscode/src/extension/panel-session.mjs:63`）= **零探测冷路径**（读缓存 / `panel._slot` 现值——可能 null + 后台收敛）；
项目切换经 `applyProjectSwitch` 守卫运行中拒绝 + `setProjectFolder` 校验 + `onProjectChanged`
重绑，per-cwd UI 随 `_cwd()` 刷新。
- **slot 粘性 + 钉槽检查**：面板 `_slot` 在打开 / 切换时**绑定一次**，之后所有读写不再重读共享 manifest 的 active 指针；「打开历史会话」**判据前置（F-CR2 · 2026-09-21 · 判据句见 §6.16）**：先 `slotOccupancy`（纯读判据）判占用——
**受占 ⇒ 拒绝路径不进入 `switchToSlot`**（共享指针 / 本端记录 / 解析缓存 / 认领集四不动）+ 不钉槽（`_slot = null`）+ 提示 → `loadSession` 经缓存重绑本端原槽；
未占 ⇒ `switchToSlot`（读目标槽成功才翻 active；记录 / 缓存仅未占才写穿——`session-io.mjs:186-189`；文件缺失/损坏 → null 不产生幻影指针）+ 绑定 → `_loadSession()`。
- **跨端 `m.active` 与「他端翻指针」语义（2026-09-19 裁定 · 本节单源）**：`m.active` = **跨端共享当前指针**（D-SE1）——**他端翻动 = 合法事件 + 本进程零运行时效果**：
绑定点（`panel._slot`）与解析缓存（`session-io` 的 `slotCache`）**永不因外部翻指针迁移**——只在**本进程四落点**维护
（`thincoder-vscode/src/extension/session-io.mjs`：`resumeSlot` `:88` / `newSlot` `:123` / `switchToSlot` `:175` / `deleteSlotAndUpdate` `:199`——皆本端动作）；
本端记录（end marker）同理——只由本端落点写（§6.10 D-4）。
  - **P1 写面**：他端 `saveManifest(setActive)` 翻 `m.active` 后，本进程 `slotCache(cwd)` / `panel._slot` 逐字不变（零写穿、零回读 `m.active`）——缓存写穿仅限上列四落点。
  - **P2 读面**：缓存未命中 ⇒ **null**（零探测；不回退读 `m.active`）——`ensureSlot` 冷路径照此消费（返 null 属契约，后台收敛由 `ensureSlotAsync` 单飞承担）。
  - **P3 释放**：删掉**本进程已绑定**的槽 ⇒ 绑定随槽释放（`panel._slot = null` · 本 cwd 缓存条目删——落点 = `deleteSlotAndUpdate` 缓存块 + `deleteSession` 重绑分支）——**不收养**他端 / 幸存 `m.active`；下次 `ensureSlotAsync` → `resumeSlot` 见本端记录**显式 `slot: null`** ⇒ 跳过一次性继承 ⇒ **全新分配**（D-SE11——不复活被删会话、不粘他端活槽）。
  - **P4 记录面**：仅当被删槽 = **本端记录槽** ⇒ 记录显式置空（`{slot: null}`——「删过」可辨认，免继承）；他端活槽 / 幸存 active 绝不进本端记录。
  - **P5 展示面例外（只读）**：会话列表高亮可回退共享 active（`thincoder-vscode/src/extension/panel-session.mjs:219-222`——本端记录槽命中优先）；只读展示，零绑定 / 零写面效果（D-SE1）。
- **跨端翻指针行为场景（与上条 P1–P5 对位）**：

| 场景 | 输入 | 期望 |
|---|---|---|
| 他端翻指针 | 另一进程 `saveManifest(setActive)` 翻 `m.active` | 本进程 `slotCache` / `panel._slot` 逐字不变（P1） |
| 冷路径未命中 | 本进程未解析 + 缓存空 | `ensureSlot` 返 null（不回退读 `m.active`）；`ensureSlotAsync` 随后正常认领（P2） |
| 删本端绑定槽 | `deleteSession(panel, panel._slot)` | `_slot = null` + 缓存条目删 + 本端记录槽 ⇒ 记录显式置空；再解析 ⇒ 全新分配（P3 / P4） |
| 删非绑定槽 | `deleteSession(panel, 其他槽)` | 绑定 / 缓存 / 记录三者零变 |
| 列表高亮回退 | 本端记录槽被对端删除 | 高亮回退共享 active——只读、零绑定效果（P5） |

- **端差登记 · 记录面写条件（2026-09-19 · init-block 批）**：目标槽被另一活进程占用时——核 = **无条件写**记录（`thincoder-core/session-lifecycle.mjs:284-285`——D-2① 不满足 ⇒ 落 D-2③ 全新分配）；端 = **条件写**（`thincoder-vscode/src/extension/session-io.mjs:186-189`——仅未占才写记录 / 缓存）。
- 场景：打开被另一活进程占用的历史槽 ⇒ 核落 D-2③ 并写新槽记录；端不写 + `_slot = null` → 经缓存重绑本端原槽（占槽判定 `panel-messages-session.mjs:48-55`）。

- **（2026-09-21 · SESSION-CLAIM 批 · 本节单源）**：① **F-CR2 收正**——受占目标 ⇒ 面板路径**不进入**端壳 `switchToSlot`（判据前置：占用判定前置于切换调用）；端壳函数内被占分支 = **零写**（不认领 / 不翻共享指针 / 不写本端记录 / 不写解析缓存——占用判定前置于 `m.active` 赋值）；核 `switchToSlot` 受占语义不变（CLI 切换成立——指针 / 记录按 D-6 / D-4 落点 + 保留集 = 空释放旧认领——见 §6.5 / §6.2）。
  ② **F-CR1 端壳释放**——`newSlot` / `switchToSlot` 释放本进程残留认领（§6.2 公式代入：保留集 = {落点槽}；端壳单绑定 = **假定 + 复核条件**——见 §6.16），`resumeSlot` 包装经核 `claimSlot` 同判据；释放集并入各落点既有 `saveManifest` 的 `deletions`（落盘判据见 §6.16）。

- **否决备选（跨端翻指针）**：删绑定槽时**收养幸存 active**（绑定点 / 缓存 / 记录任一面）——绕开 `usableSlot` / `slotOccupancy` 守卫（可能收养另一活进程的槽 ⇒ 双端双写互覆盖），且与 D-SE2 粘性同病灶（并发翻动被静默跟随）——见 §7 D-SE31。
- **字段往返完整（key-presence 写，v2 语义）**：槽位文件**全量覆盖写**，`saveLines`
（`thincoder-vscode/src/extension/panel-session-write.mjs:34`）以 `...existing` 展开式透传不认识字段、仅覆盖扩展自己拥有的字段——CLI 写入的
`activeModel` / `engineering` / `engDesignToken(s)` 等字段在 VS Code 侧往返不丢（往返透传是契约——漏一字段即永久丢失）。
`engDesignToken` / `engDesignTokens` 用 `"key" in extra ? extra.key : existing.key ?? null` 语义——显式 null
（清盘）必赢、缺席保留槽值（R16 TTL 过期后 restore 清盘、turn 尾 agentState 携显式 null 必须 pin；abort /
finally 保存无 agentState → 缺席保留槽值不误清）。
- **`setSlot*` 写面（W11 起单源 = 核 `thincoder-core/session-slot-write.mjs`；端壳转口）**：`setSlotAutoApprove`（`:126`）/
`setSlotPlanMode`（`:131`）/ `setSlotEngineering`（`:136`）/ `setSlotAdvisorGuard`（`:141`）/ `newSlotData`（`:38`）；
端壳 `thincoder-vscode/src/extension/session-slot-write.mjs` = 转口 + **（cwd, slot）型 token 台账三式**（见上 W11 接线面）。
`loadSlotForWrite` 对「无文件但本进程刚 claim 的槽」返回 `newSlotData` 默认记录——否则
`setSlot*` 落在「claim 先行、首保存落盘」的新槽时 `if (!data) return false` 静默丢标志（AUTO-bug 修复）；
version>2 / 异 cwd / 损坏 / 未知槽返回 null（新版 CLI 文件不属本端覆盖——v3 interop 前保守姿态）。
- **标题触发时机与写形（2026-09-21 块标题行对齐批——链单源 = §6.7）**：标题 await 在回合尾 finally **忙态归位之前**（stream
完成即触发——`panel-turn-stages.mjs` `finalizeTurn`）；期间 `_turnState` 仍 running——标题窗口 = busy——webview Stop 显
（running 派生）+ 路由守卫 running→拒收（归位 idle 后标题会让窗口内新消息直开并发回合与标题 LLM 调用赛跑）。**写形 = 单写**：
标题值喂入同一拍的整档 `saveLines`（`extra.title`）——不另开 `setSlotTitle` 直写；写后刷会话列表（`pushSessions`）。
错误路径（评审 #2）：`generateTitle` 内部全 try/catch 吞错 + 调用点兜底 try/catch——**归位恒执行**（标题抛错不卡永久 busy）。
标题期消息拒收（routeUserTurn running 分支——无排队无回执——拒收警告明示）。
- **懒加载历史分页（VSC 端**，端壳 `thincoder-vscode/src/extension/history-window.mjs` = 纯转口（`:12`）⇒ 核 `thincoder-core/history-window.mjs`）**：
`HISTORY_PAGE_SIZE = 200`（核 `:24`——对齐 CLI 首屏）；`historyWindow(history, before)`（核 `:107`）——`before == null`
取**末页**（首屏只发末页），否则取 `before` 前结束的一页 `[s, e)` 半开区间（loadOlder 页不重渲染边界消息）
；`idx` 为**全局** history 下标（分页永不重编号）。输出模型 = 帧容器（assistant 一帧一条消息、工具卡**嵌套**
`tools[]` 随帧下发）+ 滚动配对（`tool_call_id` 次序——并行批乱序完成全配；未配调用 `result:null`）+
turnStart 回扫判定（跨页一致）。发送清洗（`sendHistoryPage`）：user 消息剥离 editor-context 注入；孤儿 tool
消息 text 截 64K；assistant 嵌套 `tools[].result` 截 64K（防未 slim 老文件超大结果进 webview）。
- **会话上下文注入序（VSC 端富注入——CLI 同款演进）**：面板每回合重建上下文线后，会话级注入按固定序落
机读线——**disk 历史重放（保序打头）→ git / env-state / process-restarted transient（落在重放后、最新
user 前）→ time 注入（恒为该轮最后一条，位置契约由测试独立锁定）**。git 富注入（GIT-ASYNC L21——2026-09-09
双端异步化）：`collectGitContext` / `pushGitContext` → async + 失败冷却 30s（端 `thincoder-vscode/src/agent/setup-reminders.mjs:115` `pushGitContext` ·
核 `thincoder-core/agent/helpers.mjs:189` `collectGitContext`——采集 / 冷却随核单源）——确认序契约不变（git 仍在重放后、time 恒为最后一条）；all-or-nothing 保持。

### 6.16 会话认领释放与拒绝零副作用（2026-09-21 · SESSION-CLAIM 批）

> 需求 = `docs/core/requirements/SESSION.md` §2.3（F-CR1–F-CR3）；批档 = `docs/batches/2026-09-21-session-claim-release.md`。
> 本节承载本批的判据句 + 边界情形 + ACP 调用面清单；落点与测试面清单 = 批档 §2（一次性材料）；机制叙述就地并入 §6.2（认领释放）· §6.5（切换落点）· §6.15（端壳面）· §7（D-SE32 / D-SE33）。

**判据句（F-CR1 · 认领随绑定）**

- 释放谓词（**唯一公式**）：释放 A ⟺ `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`；**保留集 = 本次落点槽 ∪ 本进程其余活绑定槽**（同 cwd manifest 内）。各落点 = 公式代入（单绑定端 ⇒ {落点槽}；目标被占 ⇒ 空）。
- 释放时机 = **绑定迁移落点**（不是定时 / 后台清扫）：CLI `/new`（`thincoder-cli/src/tui/cmd-new.mjs:11` 调用面）· CLI `/session N`（`thincoder-cli/src/tui/cmd-session.mjs:105` 调用面）·
  启动恢复（`thincoder-cli/bin/thincoder.mjs:342` 钉槽落点，经 `resumeSlot` → `claimSlot`）· VSC 端壳 `newSlot` / `switchToSlot` / `resumeSlot` 包装（`thincoder-vscode/src/extension/session-io.mjs`）。
- **落盘判据（D-SE4 同型）**：① 释放集按**写盘同一次 fresh 快照**计算 / 校验（不得以陈旧内存 manifest 直接构 `deletions`）；② 条目删除 = **值条件删除**（仅当该槽 fresh 属主仍为本进程 sessionId——防窗口内他人新认领被误删）；③ 写盘同时从**内存认领表** `m.slotSessions` 移除该条目（防后续保存经条目级合并复活回写）。
- 落盘载体 = 各落点**既有那一次** `saveManifest` 的 `deletions.slotSessions`（零新增写盘次数）。
- **活绑定集口径（per end）**：CLI TUI = 本进程唯一 agent 的 `agent._slot`；ACP = 各在存会话 `agent._slot`（多会话多认领属其设计——**本批不入释放面**，F-CR3 零回归）；VSC 见下条。
- **VSC 单绑定（假定 + 复核条件）**：假定 = WebviewViewProvider 单实例视图 ⇒ 同宿主单绑定（依据 `thincoder-vscode/src/extension/chat-panel.mjs:107-116`）；复核条件 = 同 cwd 出现多于一个活绑定（多窗口 / 多面板）⇒ 该落点**不释放**（或按活绑定全集计算保留集）——假定失效不得释放他端活绑定认领。
- 释放面只碰 manifest 认领集（删属主条目）；共享指针 / 端标记语义与落点集（D-4 / D-6）零改。

**ACP 调用面（实读 · 2026-09-21）——「ACP 不入释放面」可核清单**

| 释放原语 | ACP 调用点（实读） | 处置 |
|---|---|---|
| `newSession` | `thincoder-cli/src/acp/handlers-session.mjs:152`（`session/new`）· `thincoder-cli/src/acp/handlers-slots.mjs:106`（`session/load` fork）· `thincoder-cli/src/acp/handlers-slots.mjs:159`（`session/resume` fork）· `thincoder-cli/src/acp/handlers-slots.mjs:190`（`session/delete` 重钉） | 四点均不传 `releaseStale`（调用面 opt-in）⇒ 零释放 |
| `switchToSlot` | 零调用点（ACP 侧仅语义引注——`thincoder-cli/src/acp/handlers-slots.mjs:84`） | 释放不可达 |
| `claimSlot` | 零调用点——调用面 = 核 `resumeSlot`（`thincoder-core/session-slots.mjs:291`）+ VSC 端壳 `resumeSlot`（`thincoder-vscode/src/extension/session-slots.mjs:131`） | ACP 不调 `resumeSlot`（导入面无该名——`thincoder-cli/src/acp/handlers-session.mjs:13` / `thincoder-cli/src/acp/handlers-slots.mjs:16`）；ACP 认领 = 直写 `m.slotSessions`——`thincoder-cli/src/acp/handlers-slots.mjs:96-99` / `:151-154` |

**边界情形**（保留集取值 = 公式代入）

| 情形 | 判据 |
|---|---|
| 目标槽空闲（切换成功） | 认领目标 + 保留集 = {目标}——旧绑定与残留一并释放；再切回旧槽 ⇒ 已空闲 ⇒ 重新认领（验收①） |
| 目标槽被另一活进程占用 | 不认领目标 + **保留集 = 空**（旧认领与残留一并释放）——下次保存经 `allocateFresh` fork 新槽（既有语义）；VSC 面板对位 = **拒绝路径**（判据前置零写——F-CR2） |
| 重选当前绑定槽 | `slotOccupancy` 排除本进程 ⇒ 判空闲 ⇒ 认领幂等 + 保留集 = {该槽} ⇒ 只清残留 |
| 无绑定窗口（`_slot` / `panel._slot` = null） | 窗口内零认领；首次保存经 `activeSlot` 认领落点槽（既有语义）——不复活旧认领 |
| 删槽 | `deleteSlot` 既有释放语义不动（条目 + 文件 + 记录存储 + marker 置空） |
| 混合版本 | 旧版端只增不减（单向纪律）；新版释放后旧版端认领 ⇒ 本端再切入判占 + fork（同「目标被占」行） |

**落点与测试面（清单承载）**：file 级落点表（行数 / 预期增量 / >300 档审视）与测试覆盖档位 = **`docs/batches/2026-09-21-session-claim-release.md` §2**（一次性批次材料——§8.1 分层纪律；本档不复制，判据 / 边界 / 决策留本节）。
尺度结论：本批为既有档内增量（>300 档 = `thincoder-core/session-lifecycle.mjs` / `thincoder-vscode/test/session-boot.test.mjs`——逐档读数与增量见批档 §2）——**无档位拆分需要**。

**验收回指（需求档 §2.3 四条）**：① 切换释放 + 重认领 = 核 / CLI 两档；② 拒绝路径四不动 = 组⑮（四不动断言）+ 端壳零写；③ 他端认领后本端再切入 = 判占 + `allocateFresh` fork（integration 档）；④ 双端对称 = 核三原语 × 端壳三件同判据（保留集口径 / `deletions` 落盘 / 占用判据单源 `slotOccupancy`）。

**不做（边界）**：跨 cwd 释放（绑定迁项目时旧 cwd 认领保留至进程退出——另案登记）· ACP 会话关闭面释放（多会话进程属其设计面——另存待办）· 提示文案（#161①——用户 2026-09-21 01:46 裁「不改」）· 槽文件格式 / `version` / 端标记语义 / 共享 active 语义（D-SE1 / D-SE9 不动）· 不新增机械门。


### 6.17 启动等待：会话 GC 热路径 + sessions 存量治理（2026-09-21 · STARTUP-LATENCY 批）

> 需求 = `docs/core/requirements/SESSION.md` §2.4（F-SL1 / F-SL2；2026-09-21 03:36 用户裁定「端差应消除、两端共用同一套机制」）；批档 = `docs/batches/2026-09-21-startup-latency.md`。
> 本节承载本批判据句 / 边界情形 / 端差注销 / 验收回指；落点表与用例表 = 批档 §2（一次性材料——本节不复制）。

**问题形态（实测钉定 · 2026-09-21）**：`resumeSlot`（`thincoder-core/session-lifecycle.mjs:38`）→ `scheduleSessionGC(cwd)`（同档 `:39`）→ `gcResidue` 的同步 `readdirSync`（`thincoder-core/session-gc.mjs:86`）——存量 20,227 项时单次 ≈10s，落在启动 await 链内 ⇒ 启动 9.6–16s 的 ~95%（空 HOME 对照 495ms）。
双端同源：CLI = `thincoder-cli/bin/thincoder.mjs:322`；VSC 端壳 = `thincoder-vscode/src/extension/session-io.mjs:89`（经纯转口 `thincoder-vscode/src/extension/session-gc.mjs:15`）⇒ F-SL1 修核面即双端同判，读数面同判据。

**F-SL1 判据句（热路径零同步阻塞）**

- **D-SE34（全链异步化；触发形态 = 启动窗外延迟拍，见 D-SE39）**：清立面两档（`thincoder-core/session-gc.mjs` 与 `thincoder-core/session-stale.mjs`）内**零同步扫描**——`readdirSync` / `statSync` / `readFileSync` / `unlinkSync` / `rmSync` 禁用（目录与逐文件面一律 `node:fs/promises`）。
  同步 fs 仅保留 `existsSync` 单条目探测；**既有单条目同步面保留**（`loadManifest` 单文件读 + `migrateHashLength` ≤15 次 `existsSync`——不随存量线性劣化，归「bounded 单文件」面）。
  判据句 = 启动路径同步 fs 阻塞样本 ≤50ms——**机检路由三档**：① 结构扫描（两档零同步动词）② 行为代理（事件循环未被同步扫描吞噬）③ **收口真机读数**（CPU profile 同步自时 / ≤50ms 样本——归收口面）；用例详情 = 批档 §2 用例表。
- **编排**：`scheduleSessionGC(cwd)` 保持「每进程每前缀一次 + 不阻塞调用面」；pass = ① 一次**异步目录快照**（readdir 恰一次）② 残留面（当前前缀——`gcResidue` 既有判据）③ 存量面（有界 `STALE_SWEEP_LIMIT` 组/次）。
  触发时点 = **启动窗外延迟拍**（核侧 `setTimeout`——`GC_PASS_DELAY_MS` = 3s，自调度点起；核无需感知「启动完成」——无帧概念保持）；**不做帧耦合**（核无帧概念、VSC 无帧事件——异步化已满足判据；否决理由见 §7 D-SE34 / D-SE39）。
  **触发与启动解耦判据句（D-SE39）**：启动链（`resumeSlot` → 装配 → TTY 门）不因 pass 竞争超 2s——读数 = 无参启动至拒印时刻（非 TTY 环境代理「TTY 门」）≤2s × 复测 ≥2 次；结构性保证 = pass 起点 ≥ 调度点 + 3s（落于启动窗之外）。**测试缝** = `_setSessionGcDelayForTest(ms)`（`_setSessionsDirForTest` 同款——用例可置 0 立即点火；默认值 = 3s 可断言）。

**F-SL2 判据句（可清组——唯一公式）**

- **组** = sessions 根下同一 40 位 cwd 哈希前缀的全文件集合（前缀族 = `thincoder-core/session-slots.mjs:81` `sessionPath` 所得 `{hash}.json` + 各后缀）。
- **可清组 ⟺ 三合取（D-SE35）**：
  ① **无活属主**——manifest `slotSessions` 全量经**入口一次探测束** + `ownerState` 三态：**活 / 未知（探测失败 / 缺行）⇒ 保留**；无 manifest ⇒ 无认领面 ⇒ 该条自动满足。
  ② **内容面不可达或无内容**（二择一）：**T1** = 组内可读数据文件的 `cwd` 字段**全部不存在于磁盘**（至少读到一份；一份都读不到 ⇒ T1 不成立 ⇒ 保留）；**T2** = 组内无任何数据文件（无 `.json.N`、无裸 `{hash}.json`——只剩清单 / 端标记 / 残留）。
  ③ **安全窗**——组内**最新 mtime** < now − 7 天（`STALE_SAFETY_WINDOW_MS`；与孤儿 `.tmp` 保留期同值同族——异常现场窗口）。
- **理由链**：cwd 不可达 ⇒ 内容在恢复 / 检索发现 / 列表呈现三条产品路径均不可达；T2 ⇒ 内容面为零；安全窗兜住「临时不可达」（网络盘 / 外接盘）与竞态；属主三态守住活数据。**90 天冷判据保留**（`COLD_CWD_RETENTION_MS` 不变——cwd 存活组唯一出口）。
- **端无关**（F-SL2 口径扩）：判据与执行面不引用端——双端共享 sessions 根，任一端可清另一端弃用 cwd。
- **实测分布（as-of 2026-09-21 · 设计轮实读）**：9,358 组 ⇒ 一次性清理预期 **≈7,384 组**（T1 = 5,869 · T2 = 1,515）；余 = 0–7 天窗口 1,970 组 + cwd 存活 4 组；抽样 262/262 组 cwd 均不存在且全为临时目录（`%TEMP%` 下测试遗留）。

**执行面（D-SE37）**

- **自动面（判据集合 = 三合取组）**：绑 `scheduleSessionGC` 的启动窗外延迟拍（`GC_PASS_DELAY_MS` = 3s；每进程一次）——**仅三合取组（D-SE35）**；**90 天冷 cwd 判据面（cwd 存活组唯一出口）不入自动面**，保持显式命令面——cwd 存活 = 内容可达，自动回收在回收期后不可逆（与核档头注「手动——v1 不自动删 manifest」同向，`thincoder-core/session-gc.mjs:10-11`）。全链异步、失败静默 + 回收清运（超期回收批）。
- **有界语义（D-SE37 / D-SE40）**：`STALE_SWEEP_LIMIT`（500）= **每 pass 总评估组数上限**（**不是删除数**；**含 ① 面 manifest 读**）；评估闸 = **过 ③ 进 ① 即耗 1**——该组的 ① manifest 读与（若过 ① 的）② 内容读均在此预算内；达上限即停（余量下一 pass 继续）；③ 短路组零预算（纯内存比较、零 IO——不占）。
- **求值序 / 短路口径**：③ 组最新 mtime `< now − 7 天` → ① 无活属主（入口一次探测束 + `ownerState` 三态）→ ② 内容不可达 / 零内容；任一步不通过 ⇒ **保留并短路**（不进下一档）。**预算口径**：③ 短路组零预算（未读盘）；① / ② 短路组已耗 1（① manifest 读已发生——不退）。
- **选取顺序 = 组最新 mtime 升序**（最旧优先；自最旧未处理组起评估，至过 ③ 组数达 `STALE_SWEEP_LIMIT` 或全集用尽）。
  **前向推进论证（D-SE40）**：升序 + 过 ③ 即耗 ⇒ 每 pass 评估面 = 升序**最旧前缀**（≤500 组）——可清组回收后自目录消失（前缀面收缩、恒向未及面收敛）；活跃写入使组最新 mtime 上移（排序后移 / 偶发落出 ③ 窗）；③ 窗内组零预算（不阻塞）。
  **恒保留组**（① 活 / 未知、② T1 成立 / 不可读）占前缀预算 ⇒ 自动面可在该相位滞留（边界行在册；兜底 = 显式全量面 limit = Infinity）。**否决**「上限仅落 ② 面」（① 面 manifest 读无界 ⇒ 单 pass 无界——见 D-SE40）·「③ 短路组计预算」·「本 pass 跳过集」（新机制面——登记边界 + 兜底即可）。
- **单 pass 成本读数（登记 · 2026-09-21）**：目录快照 1 次 readdir（存量 9,358 组 / 20,227 项量级）+ 逐条目 stat 异步（≈20k 次——非阻塞）+ **① 面 manifest 读 ≤500 次**（预算内——进入 ① 面者各一次）+ 批量探测束 ≤1 + **② 内容读 ≤500 组**（组均 ≈2.2 文件 ⇒ ≤≈1.1k 次读）——**每 pass 总评估 ≈500 组（含 ① manifest 读）**；设计目标 = 零同步阻塞 + 单 pass 有界，真机耗时随收口登记。
- **显式命令面**：`session gc --dry-run`（当前 cwd 残留 + 全部可清组候选——带 reason 与文件数）/ `--confirm <hash>`（单组）/ `--confirm --all`（全量）——**零新增旗标**（判据扩展使候选面自然扩大）；删除前重校验（TOCTOU）。
- **落地顺序**：逐组「重校验 → 逐文件 rename 进回收批（残留 / 端标记 → manifest → 数据文件）」；单文件失败 / 回收根不可写 = 跳过并计数（部分移动态安全——不可达性保证任意中途状态无害；不 unlink 兜底 ⇒ 零误删）。
- **两级窗口 + 回收目录（D-SE36）**：判据窗 7 天 + 回收保留 7 天 ⇒ **不可逆删除最早 = 最后写入 + 14 天**；回收根 = **由当次 sessions 根 `dir` 派生（同级）**——`sessions-trash/<批次时间戳>/`（sessions 根外——不参与扫描 / 不入发现面；`dir` 注入缝因此覆盖回收批，启动钩子路 `dir` 自 `sessionPath` 派生）；清运面带**注入 now 的缝**；恢复 = 移回原目录（命令输出提示）。

**VSC 命令入口 + 端差注销（D-SE38 · 用户 2026-09-21 03:36 裁定）**

- 命令 = `thincoder.sessionGc`（`thincoder-vscode/package.json` contributes.commands 注册 · 处理体挂 `thincoder-vscode/extension.mjs:128` 起同址簇）；流程 = `listColdCwds`（核数据面）→ 计数报告 → 模态警告确认 → 逐组 `deleteColdCwd`（内部重校验）→ 汇总；**不消费 `runSessionGc`**（console 形态属 CLI 壳——核内零消费方结构机检保持）。
- **目录来源（D-SE38）**：处理体**显式传端侧派生的 sessions 根**（`thincoder-vscode/src/extension/session-slots.mjs:52` `sessionsDir()`——核 `sessionPath` 反推）——不依赖核函缺省 `dir`（缺省 = 核内 configDir 版）；备选「统一走核根访问器」否决（核未提供根访问器——新增核面属新机制，本轮不引入）；用例沙箱缝 = 处理体接受注入 `dir` + 装置显式传 temp 目录。
- 端侧命令档 = `thincoder-vscode/src/extension/session-gc-command.mjs`；原「冷 cwd 手动执行面仅 CLI」端差**注销**——注销落地清单 = §6.12 冷 cwd 条 + 本节 + `thincoder-vscode/src/extension/session-gc.mjs` 档头注 + **需求侧 `docs/core/requirements/SESSION.md` §4.5 ④ 行**（「冷 cwd 手动 GC 无 shell 通道」——**父侧直改**，需求档笔域不在本代理；本轮只登记落点）。

**边界情形（判据取值 = 公式代入）**

| 情形 | 判据 |
|---|---|
| 属主活（他进程 / 本进程） | 保留（不候选）——F-SL2「不动活数据」 |
| 属主探测未知（超时 / 失败 / 缺行） | 保留（未知不作死判据——D-MI10 同向） |
| cwd 存在（哪怕久无写入） | T1 不成立 ⇒ 仅走 90 天冷判据 |
| 数据文件不可读 / 无 `cwd` 字段 | T1 不成立 ⇒ 保留（fail-safe） |
| 组内残留含非数据文件 | 随组处理（判据在组粒度；后缀保留期仅用于当前前缀的 `gcResidue`） |
| 并发双进程同扫 | 删除幂等（rename 失败跳过 / 重校验拒绝）——无需锁 |
| 删除中途失败（含单文件 rename 报错 / 回收根不可写） | 跳过并计数；部分移动态安全（组不可达）；**原文件零删除**（不 unlink 兜底）；下次 pass 重扫再判（幂等） |
| 回收批超期 | 后续 pass 清运（7 天窗口）；清运失败（占用 / 权限）⇒ 静默跳过、不误删在期批、后续 pass 重试 |
| 恒保留组（① 活 / 未知、② T1 成立 / 不可读）达 ≥500 组 | 该类组**计入 500 预算**（评估闸 = 过 ③ 进 ①）且恒保留 ⇒ **自动面滞留**（升序窗口被占用、更新的可清组暂不进入）；**兜底 = 显式命令面**（`session gc --confirm --all`——全量面 limit=Infinity） |

**验收回指（需求 §2.4 四条 + `docs/cli/requirements/TUI.md` §3 N12）**：① 同步阻塞 ≤50ms = **机检路由三档**（结构扫描 + 行为代理 ≤1s + 收口真机读数——≤50ms 归收口面）；② 启动到 TTY 门 ≤2s / `--version` ≤0.5s = 真机读数（验收面）；③ 三端测试全绿；④ 存量回落且零误删 = 判据矩阵 + 一次性清理用例（dry-run 全列 / confirm 全移 / 幂等 / 可回退）。端差注销 + VSC 命令入口可机检（命令注册 + 直调点）——用例清单见批档 §2。

**不做（边界）**：不改槽文件 / manifest / 端标记形态 · 不改 90 天冷判据与残留后缀保留期 · 不引入常驻进程 / 周期后台定时器（清理 = 启动窗外一次性延迟拍 + 显式命令）· 不动二次成本四项（单进程化 / 懒加载 / execSync 去重 / MCP 连接）· 不读 / 不改用户 config.json · 轨迹面策略裁决不动（见 `docs/core/design/TRACES.md` §6.4）。


### 6.18 优雅退出认领释放（2026-09-21 · EXIT-CLAIM-RELEASE 批）

> 需求 = `docs/core/requirements/SESSION.md` §2.5（F-XR1–F-XR4）；批档 = `docs/batches/2026-09-21-exit-claim-release.md` §2。
> 本节承载本批判据句 / 接线序 / 端壳裁定 / 边界情形 / 验收回指；落点表与用例细表 = 批档 §2（一次性材料）。
> 与 §6.10 端分离语义的关系：释放零触碰 marker 面（D-4 维护点集不变——**退出释放 = 非维护点**，marker 保持原值正是本批语义）；恢复直达 = D-2 ① 支既有判据，**零新恢复语义**。

**机制形态（D-SE41——核薄函数）**

- 名 = `releaseClaimsAll(cwd)`，住 `thincoder-core/session-slots-manifest.mjs`（与释放谓词 `staleClaims` / 落盘 `saveManifest` **同档单源**——判据面零复制）。
- 语义 = 退出全释放：`loadManifest` → `staleClaims(m, [])`（保留集空 = 本进程全部认领）→ 非空 ⇒ `saveManifest(cwd, m, null, { release: [] })`——§6.16 落盘判据三条自动继承（fresh 同次快照取释放集 / 值条件删除 / 内存认领表同步移除）。
- 早退面：磁盘无 manifest ⇒ `existsSync` 单条目早退**零写**（不给从未有会话的 cwd 造空 manifest）；本进程无认领 ⇒ 零写返回（不碰他进程条目——值条件天然，且免给共享 manifest 白刷一次 `sessionId`）。
- 失败容忍（F-XR1「退出恒达」）：整体 try/catch，**永不抛出**，返回 boolean（true = 有释放且落盘成功；false = 早退 / 失败——断言面）。写失败盘面 = 认领残留 → 恢复走既有探测面（现状形态，数据零险）。

**判据句（F-XR1 / F-XR2）**

- 释放时机 = **优雅退出路径**（进程结束前、数据保存完成之后）；不在运行期任何常规落点（与 §6.16 绑定迁移释放互补——非定时清扫，保留集口径不同面：迁移释放 = 落点 ∪ 活绑定，退出释放 = 空 = 全量）。
- **F-XR2 端标记不置空（对照 `deleteSlot` 置空路径区分）**：释放原语零触碰 marker 面（不调 `writeEndMarker`、不写 null）。区分：`deleteSlot` 删到本端记录槽 → `writeEndMarker(cwd, null)`（核 `thincoder-core/session-slots.mjs` + 端壳 `thincoder-vscode/src/extension/session-io.mjs:207`）= **显式置空**——删槽 = 会话不再要（下次全新起步）；退出释放 = 会话还要回（**路标保留**——下次直达恢复）。
- 恢复直达支实证：释放后盘面 = marker 指原槽 ∧ `slotSessions[原槽]` 无属主 ⇒ `usableSlot` true（`thincoder-core/session-slots.mjs:230-235` 无属主分支先于属主判定短路——**该槽可用性判定零探测**）→ D-2 ① 支 `claimSlot` + `loadSlotFile` 直接恢复。
- 入口探测束（`resumeSlot:281`）是否零 exec 取决于 manifest 内**他进程**属主有无：单进程常态（事故锚形态）= 清单空 ⇒ `probeOwnersAsync` 入参清单空早退零 exec（`thincoder-core/process-probe.mjs:266-268`）；T2 用例沙箱 = 单进程盘面 ⇒ 机判成立。

**CLI 接线序（F-XR4 · 同步插行两点）**

- 两点同源（同一退出语义双入口，均收口 `cleanup() → setTimeout(exit, 100)` 链）：① Ctrl+C×2 空闲双确认分支——`thincoder-cli/src/tui/key-handler.mjs:149-152`：`cleanup()` 之后、`exitTimer` 注册之前插 `releaseClaimsAll(process.cwd())`（+ import）；② `/exit` 命令——`cmd-exit.mjs:6` 经 `ctx.exit`（`thincoder-cli/src/tui/index.mjs:441`）同型插行。
- **退出序钉定**：回合尾既有保存（数据面）→ `cleanup()`（终端恢复）→ **释放** → `exitTimer`（100ms）→ `exit(0)`。
- **100ms 窗口钉定**：释放 = 同步单文件写（loadManifest + saveManifest 同步 fs——会话面既有形态），先于 `setTimeout` 注册**同步完成** ⇒ 窗口内零竞态；`ctx.exitDelay ?? 100` 原值保留（既有测试缝 + crash-report 写窗对齐不动）。
- cwd 域 = `process.cwd()`——与启动恢复（`thincoder-cli/bin/thincoder.mjs:322`）同域同参（CLI 生命周期锚定启动 cwd）。**不引入 async**（否决 async 化退出链——同步写零改造零新竞态面，见 D-SE42）。

**VSC 接线（F-XR4 · async deactivate 前置释放）**

- `deactivate`（`thincoder-vscode/extension.mjs:170-174`）改 **async**：`await releaseClaimsOnExit(cwd)` 前置于既有三步（stopSampler / closeAllMcp / dispose）。VS Code 宿主 await async `deactivate`（合法——宿主等待窗口）；释放 = 窗口内最有价值步**抢先执行**，宿主超时强杀时残留 = 现状形态（认领保留——恢复走探测面），数据零险。
- cwd = 面板域 `_cwd()`（`thincoder-vscode/src/extension/panel-messages.mjs:37`——workspaceFolders[0]，与认领落点同域）；`workspaceFolders` 空 ⇒ **跳过释放**（`_cwd()` 回退宿主任意 process.cwd()——不给宿主 cwd 造盘面 / 误放他项目认领）。
- 薄包装 `releaseClaimsOnExit(cwd)` 住 `thincoder-vscode/src/extension/session-io.mjs`（node 可测缝——`extension.mjs` 依赖 vscode 模块不可直测）：无 workspace ⇒ false；否则转核 `releaseClaimsAll`（容忍逻辑全在核——端侧零重复）。

**端壳裁定（F-XR4 双端同源）**：释放机制核内单点；端壳对位 = **纯转口两行**（`session-slots.mjs` / `session-io.mjs` 各一——W11 转口纪律形态）。端壳镜像的既有理由 = marker 端差与 resumeSlot 算法（§6.10 D-1/D-2）——本面两者不涉（谓词 = `getSessionId` 字符串比较，零探测零束零端差）⇒ 无镜像必要。NF1 红线：零新增跨端共享可变字段。

**边界情形**

| 情形 | 判据 |
|---|---|
| 磁盘无 manifest（全新 cwd / 从未有过会话） | `existsSync` 早退零写——退出不造盘面 |
| 本进程无认领（已全释放 / 仅他人认领） | `staleClaims` 空 ⇒ 零写返回 false（他进程条目零动——值条件天然） |
| 本进程多认领（历史残留） | 保留集空 = 全释放（F-XR1 全量语义） |
| 释放写盘失败（IO / 权限） | try/catch 返回 false——退出恒达；盘面 = 认领残留（恢复走探测面——现状形态） |
| 崩溃路径（kill / 终端窗口关闭 / V8 fatal） | 不可达释放面（信号无 JS 钩子）⇒ 认领保留 ⇒ 恢复走 D-MI10 探测三态（F-XR3 语义零变） |
| ACP 进程退出 | 零接线（ACP 无 TUI——不经 key-handler / ctx.exit；`session/close` 语义 = #168① 另案不动） |
| Ctrl+C 单按 / 双按（非空闲退出分支） | 非退出不释放（中止回合 / 全停后台——需求边界原样） |
| VSC 多窗口同 cwd | B 窗退出只释 B 认领（sessionId 区分 + 值条件删除——A 窗条目 owner ≠ B 天然不动） |
| 释放后他人即时认领原槽 | fresh 属主 ≠ 本进程 ⇒ 不删（§6.16 值条件 ②）；本进程已退 ⇒ 无后续保存复活面 |
| 混合版本 | 旧版端零释放机制 ⇒ 其认领恢复走探测面（现状形态）；认领集 = 共享 manifest 既有结构（非新字段）⇒ 无跨端读冲突 |

**验收回指（需求 §2.5 T1–T6 · 判据级；用例细表 = 批档 §2）**

- T1 = 造认领 → `releaseClaimsAll` → 盘面三断言（manifest 无本进程 `slotSessions` 条目 ∧ marker 仍指原槽 ∧ 槽文件完好）——核 `thincoder-core/test/session-slot-write.test.mjs` 新组。
- T2 = T1 后 `resumeSlot` 返回 `{slot: 原槽, data 非空}` + 探测束零 exec（沙箱单进程盘面 ownerPids 空 ⇒ 早退——替身注入断言）。
- T3 = 崩溃路径负向回归（认领在 + 探测 unknown ⇒ 全新分配——现状锁）。
- T4 = CLI 退出分支 e2e（`exitDelay` 注入 + `ctx.exitTimer` 捕获——先释放后定时器注册 / 桩收 `exit(0)` / 释放抛错仍注册退出 = 失败容忍）——`thincoder-cli/test/tui-exit-cleanup.test.mjs` 新组。
- T5 = VSC 端壳机判（`releaseClaimsOnExit` 沙箱 + deactivate 结构机检）——`thincoder-vscode/test/session-exit-release.test.mjs` 新档。
- T6 = 三端测试全绿。

**不做（边界）**：探测三态判据（D-MI10）一字不动 · 不做时间窗猜死活启发式 · 崩溃路径不接线（F-XR3）· ACP `session/close`（#168① 另案）· `deleteSlot` 既有语义（含 marker 置空）不动 · 槽文件格式 / `version` / marker 形态与维护点集不动 · NF1 零跨端共享可变字段 · 跨 cwd 认领释放不入本批（§6.16「另案」面原样——本批释放域 = 退出 cwd 单 manifest）· Ctrl+C 单按两按（非退出）不释放。

## 7. 关键决策记录（D-SE1–D-SE42）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-SE1 | 槽位制 + **active = 共享当前指针 ≠ 当前会话** | 旧版端互操作 + ACP + 列表回退需要；本端恢复另设 end marker（D-SE9） |
| D-SE2 | **slot 粘性**（首次认领后缓存 `agent._slot`，永不重跑 ensureActive） | 每次保存重推会被并发翻动的 active 静默迁移 → 双副本 / 覆盖他人 |
| D-SE3 | 死主判定**必须跑批量判活 + 三态判据**（`ownerState`；单 pid 兼容面 = `isProcessAlive`），不得以「文件缺失」短路；**批 1 扩（2026-09-16）**：pid 活 + 身份不符（命令明确可得且非本产品）同判可删 | 活进程「认领→首次保存」窗口文件暂缺，误删致双进程同槽；pid 复用 ⇒ 陈旧记录不清理——补身份复核（判据单源 = `process-probe.mjs`，详面见 §6.2） |
| D-SE4 | manifest **条目级合并** + 删除意图经 `deletions` 显式表达 | 否则磁盘死条目从 fresh 复活回写；`active` 单值只由显式翻指针调用点写 |
| D-SE5 | 覆盖防护 = `.bak` 轮转（按 `sessionStart`；`version > 2` 一律轮转） | 跨端 / 跨进程覆盖对方现场的实锤防线；mtime 缓存避免每次保存全量解析 |
| D-SE6 | 会话文件 = **双线结构**（`history` 人读 / `contextHistory` 机读） | 机读线须与 provider 前缀缓存逐字节一致；人读线可按显示需要瘦身 |
| D-SE7 | `slimForDisplay` = **copy-on-write**（绝不原地改） | 两线经 pushReal 共享对象引用——原地改会污染机读线与前缀缓存 |
| D-SE8 | 恢复时**机读线必须从 `contextHistory` 取** | 从完整 history 重建会把已压缩中间过程塞回上下文（实测 prompt 膨胀 283%） |
| D-SE9 | 恢复依据 = **本端 end marker**（非共享 active） | 共享 active 两端互写正是原 bug；各记各的 + 一次性继承是用户裁定 |
| D-SE10 | marker = **manifest 旁独立小文件**（非内嵌字段） | 内嵌 = 双端写同一文件（正是本 bug 类）+ 合并 / 旧版写丢未知字段 |
| D-SE11 | **missing → 继承一次 / `slot: null` → 全新** | 让「删过」可辨认——删自己会话后重开不继承对方遗留、不复活被删会话 |
| D-SE12 | 启动 `resumeSlot` 后**钉 `agent._slot`** | 闭合首保存迁移窗口（并发方首回合前翻 active 会静默迁移）——恢复确定性 |
| D-SE13 | 端分离恢复**双端同批**落地 | 只修 CLI ⇒ VSC resolve 仍翻 active / 抢死槽，CLI marker 槽被活外人占用后回到 bug |
| D-SE14 | env-state 行 `slot` 取**粘性 `_slot`**（不读共享 active） | 避免 ACP 多会话张冠李戴；无绑定窗口如实 `slot: null` |
| D-SE15 | `resumed` **按会话跟踪** + 与 `process restarted` 句**双信号解耦** | 「切槽恢复」不得被误当「普通续跑」，也不得误报进程重启；两信号各有独立闸 |
| D-SE16 | 冷 cwd 删除**含数据文件** | 只删 manifest 而留数据文件会制造孤儿数据（无 manifest 引用却仍占盘）——正是要治理的累积问题 |
| D-SE17 | 标题写契约改 `{ok, reason}`（四类失败原因可区分） | 裸 boolean 无法区分 file-missing / parse-failure / mtime-conflict / invalid-slot |
| D-SE18 | 跨会话检索 = **`read_history` 加参数**（非新工具） | 检索族已多（5 工具选错）——单工具扩展 + 消歧总纲，本会话缺省零行为变化 |
| D-SE19 | 发现面**不做死槽过滤**（v1） | 摘要必须含寻址字段（槽号 + 完整路径）；死槽过滤收益低、易误判 |
| D-SE20 | 记录存储 = **定长分段 JSONL sidecar** | 可按页读 / 无索引文件 / 已写段只读；否决槽 JSON 内窗口化 · 单文件 offset 索引 · 字节触发清单 · 全档 offset |
| D-SE21 | 内存窗口 = **200 条**（与首屏同值） | 上界可控且概念单一；否决 500/1000 · 字节窗 · 无窗（保留窗口 = 安全带 + 快路径） |
| D-SE22 | 投影 = **流式拼接段文件** | O(1) 内存、与既有形态逐字节同构；否决物化数组再序列化 · 投影降级为「窗口 + 计数」（破坏 version 2 契约） |
| D-SE23 | 追加 = **pushReal 同步**；失败 = **降级（失败即停 + 追赶 + 标记）** | 崩溃保留最大化、读路径恒新鲜；否决保存点批量 / 周期刷盘；「下次保存对账自愈」不成立（投影源 = store，两侧同缺无修复路径） |
| D-SE24 | 对账 = **计数比较**（段 vs JSON，不做逐条校验） | 成本低收益足；同长异容退化面如实登记 |
| D-SE25 | 本会话检索走存储、跨会话保持 JSON | `path=` 换轨收益低（JSON 仍有护栏）+ 避免「外部 slot 的 sidecar 解释权」扩展面；否决「统一走存储」 |
| D-SE26 | **模式 F（未绑定）零回归** | `thincoder chat` / 测试 / 未覆盖路径保留全量物化行为；窗口仅在绑定态或 depth>0 子代理启用 |
| D-SE27 | VSC 运行中禁止切换 + **turnSlot 纵深防御**（保存 / 标题落回合捕获槽） | 运行中切槽 = 旧 turn 流串台 + 内容落错槽；turnSlot 使并发切换零窗口 |
| D-SE28 | VSC `setSlot*` 写面 = **Parnas 拆分** + `loadSlotForWrite` 对新槽补默认记录 | 一次性写面档（session-slot-write.mjs）避免槽写逻辑混入既有档；新槽无记录 → 静默丢标志（AUTO-bug） |
| D-SE29 | VSC 懒历史分页 = **帧容器 + 嵌套 tools[] + 全局 idx**（HISTORY_PAGE_SIZE 200） | 跨页消息永不重编号；工具卡随帧渲染防跨页双显；匹配 CLI 首屏 200 |
| D-SE30 | VSC 标题触发 = **回合尾、忙态归位之前**；写形 = 标题值随整档 `saveLines` 落盘（单写；链单源 = §6.7） | 标题期 = busy 窗口（webview Stop 显 + 路由守卫拒收）；标题抛错不卡永久 busy；单写免「整档 save + 独立 `renameSlot`」两次落盘 |
| D-SE31 | 跨端 `m.active` 翻动 = **他端合法事件、本进程零效果**（绑定 / 缓存 / 记录不因外部翻指针迁移；释放时**不收养幸存 active**——§6.15 裁定条 P1–P5） | 收养绕开 `usableSlot` / `slotOccupancy` 守卫（可能接手另一活进程的槽 ⇒ 双端双写互覆盖）；且与 D-SE2 粘性同病灶——本端绑定只在四个本端落点维护 |
| D-SE32 | 认领**随绑定走**（F-CR1）：绑定迁移落点释放本进程残留认领（保留集 = 落点槽 ∪ 其他活绑定；被占目标 ⇒ 保留集空）；释放集并入落点既有 `deletions` 写；`active` / `m.slots` / 槽文件零动 | 认领只增不减 ⇒ 进程活着期间访问过的槽在他端一律打不开且随会话累积；释放不损互覆保护（他端认领 ⇒ 本端再切入判占 + 保存 fork）。否决：保存面全局清扫（ACP 多会话误伤）· `activeSlot` 内释放（裸调用面会放掉真绑定） |
| D-SE33 | 拒绝路径**判据前置**（F-CR2）：面板受占切换不进入 `switchToSlot`（共享指针 / 记录 / 缓存 / 认领四不动）；端壳函数内被占分支 = 零写 | 先写后判 ⇒ 被拒切换仍翻共享指针（实测 active 41→40）；回滚形态否决（回滚窗口内他端可读脏指针 + 二次写）。核侧受占 = 切换成立（保留 D-6 / D-4 落点语义——fork 面依赖指针翻至目标槽） |
| D-SE34 | GC 热路径**全链异步化**（零同步扫描；触发形态 = 启动窗外延迟拍，见 D-SE39——不做帧耦合） | 判据 = 同步 fs 阻塞 ≤50ms，「重活异步化」支即满足；核无帧概念 / VSC 无帧事件 ⇒ 帧耦合推迟支否决；分片外壳不换收益 |
| D-SE35 | 可清组判据 = **三合取**（无活属主 / cwd 不可达或零内容 / 7 天安全窗）；90 天冷判据保留 | 实测 9,358 组：mtime 判据覆盖 0 组（30 天窗仅 1 组）⇒ 必须以语义判据为主；cwd 不可达 = 内容三路径不可达；T2 收零内容组（实测 3,172 组）。否决「仅 cwd 不可达」（零内容组永留）·「仅 mtime」（覆盖零） |
| D-SE36 | **两级窗口 + 回收目录**（判据 7 天 + 回收 7 天 ⇒ 不可逆 ≥14 天；同卷 rename 进 sessions 根同级的 `sessions-trash/`——由 `dir` 派生） | 一次性批量删除须可回退（父侧指令）；同卷 rename = 廉价原子；回收根随 `dir` 派生 ⇒ 注入缝覆盖回收批。否决直接 unlink（不可回退）·「复制备份再删」（双份磁盘 + 备份判据另立） |
| D-SE37 | 执行面**双层**（自动面 = **仅三合取组**、有界 ≤500 组/次总评估（含 ① manifest 读——D-SE40）；显式面 = 全量（含 90 天冷 cwd 面）；`session gc` 三形态零新增旗标） | 自动面防回潮（新遗留随 7 天窗自然到期）、显式面做存量；**cwd 存活组（内容可达）不入自动面**——自动回收将致不可逆（对齐「v1 不自动删 manifest」纪律）；否决纯自动（每次启动做重活）· 纯手动（不跑就永不清理） |
| D-SE38 | **端差注销**：冷 cwd 手动面双端同面（VSC 命令走数据面 API；不消费 `runSessionGc`） | 用户 2026-09-21 03:36 裁定「端差应消除、两端共用同一套机制」；核机制已在（五导出 + 端壳转口）⇒ 只补端侧入口；走数据面保核内零消费方结构机检 |
| D-SE39 | GC 触发 = **启动窗外延迟拍**（核侧 `setTimeout`——`GC_PASS_DELAY_MS` = 3s，自调度点起；每进程每前缀一次；不 unref——保后台排空现状） | 真机复测：`setImmediate` 拍与启动链同循环 ⇒ pass 在跑时 `resumeSlot` 126ms → 1.9 / 1.9 / 3.8s、无参启动拒印 2.96 / 4.16s（验收 ≤2s ✗）；3s ⇒ pass 起点 ≥ 调度点 + 3s = 结构落于启动窗外（2s 档裕度 ≈0）；否决「调用面首帧后点火」（VSC / ACP 无统一帧事件、多调用面分散） |
| D-SE40 | 自动面预算 = **每 pass 总评估组数 ≤ `STALE_SWEEP_LIMIT`**（过 ③ 进 ① 即耗——含 ① manifest 读；余量下一 pass 继续） | 真机复测：① 面原对全部过 ③ 组逐组读（≈6,887 组 ⇒ ≈6.9k 次/pass）⇒ 单 pass 拖至 ≈40s 量级（对照 `session gc --dry-run` 全面 41.6s / 6,887 候选）；否决「上限仅落 ② 面」（① 面无界）·「跳过集」（登记边界 + 显式面兜底） |
| D-SE41 | 退出释放 = **核薄函数 `releaseClaimsAll(cwd)`**（`staleClaims` 保留集空 + 既有 `saveManifest` release 面；失败容忍返回 boolean 永不抛；无 manifest / 无认领早退零写） | 谓词 / 落盘判据**零新增**（复用 F-CR1 单源——§6.16 落盘判据三条自动继承，防双判据漂移）；失败容忍 = F-XR1 退出恒达（残留 = 现状形态，恢复走探测面）；早退防「退出造盘面」（20k 存量教训同向）。否决：运行期定时清扫（ACP 误伤）· 端壳镜像释放（谓词零端差——镜像即复制） |
| D-SE42 | 接线 = CLI **同步插行两点**（Ctrl+C 双确认分支 + `/exit`→`ctx.exit`——cleanup 后、exitTimer 注册前；100ms 窗口原值）+ VSC `deactivate` 改 **async 前置释放**（无 workspace 跳过） | 同步写先于定时器注册完成 ⇒ 窗口零竞态（async 化反引入竞态面）；`exitDelay` 原值不动（测试缝 + crash-report 写窗）；VSC 前置 = 最有价值步抢先（截杀由失败容忍兜住）；双入口同源 `ctx.exit` 单收口（「唯一收口」上抛订正） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/SESSION.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 档首「变更记录」+ §14 顶注的逐条修正轮记录 | 逐批变更流水账（含提交号 / 轮次号） | 历史叙述——本档自有变更记录；旧档即该历史的载体 |
| §10 / §11 / §13 的「需求层已迁出」注 | 需求层拆分批的迁出记录 | 时点材料——需求现住 `docs/core/requirements/SESSION.md`（本层） |
| §11.2 / §11.3 的「已交付核销」+ 提交号 + consume 号 + 「待重评审」 | 交付与评审状态标记 | 时点状态——live 跟踪面归批次档 / 台账（D2） |
| §13 顶注「设计已落本节——round1 评审 1🔴+6🟡+3🔵 全采纳——复审发起权在用户」 | 评审过程与采纳计数 | 评审过程材料——现行验收面见 §6.13 |
| §14.1 问题陈述的 file:line 事实表 | 事故取证清单（时点坐标） | 时点证据——结论已入 §6.14；行号随实现演进失真 |
| §14.2 方案选型四表（记录形态 / 窗口口径 / 投影 / 追加时点） | 选型对比逐行评估 | 结论已提炼入 §7（D-SE20–D-SE23）——原表为批次语境 |
| §14.4 逐条否决论证全文 | 否决理由原文 | 结论已提炼入 §7 |
| §2.1 / §2.2 / §5.1 内的「原实现…缺陷」叙述 | 旧结构缺陷的更正过程 | 现行形态已入 §6.2 / §6.5 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §11 device 行模板本体（提示词 / 身份文本面） | env-state 行模板与身份文本的落点 | 属**提示词系统**板（正本 = `docs/core/design/prompts/`——提示词 = 产品代码，内容权归主 agent）；本节只承载 slot / resumed 的会话语义 |
| §7 标题生成的 VSC `requestTitle` 三分支实现细节 | VSC 侧独立实现 | 属 VSC 产品树（`thincoder-vscode/src/**`——产品级档留各产品树） |
| §8 的模型清单 / 放行语义 / 渠道准入面 | 清单 provider 化 · `parseModelRef` 语义 · 准入校验 | 属**供应商与模型**板（本层 `PROVIDER.md`） |
| §9 read_history 的注册面（agent-tools 聚合 / setup 过滤） | 工具注册与角色过滤 | 属**工具系统**板（本层 `TOOLS.md`）· 会话语义已入 §6.9 / §6.13 |
| §14.5 受影响文件全清单 | 逐档行数与增量 | **一次性批次材料**（文档分层纪律）——批次档承载 |
| §14.6 用例表 T-RS1–T-RS14 · §14.7 AC-RS1–AC-RS10 | 测试用例与验收清单 | **一次性批次材料**——测试资产归测试层，验收勾销归批次档 |
| §14.8 边界登记项（C5 `/undo` 快照上限 · C6 `_advisorRuns` 回收 · C7 小容器族） | 转 `docs/TODO.md` 的技术待办 | 台账面（本层 `TODO.md`——唯一权威）；本档只记「曾登记」 |
| §14.9 VSC parity 影响评估 · §14.10 物证回填钩 | 单批评估与取证钩子 | 时点材料——结论（VSC 零改动）已入 §6.14 末行 |
| §11.2 / §11.3 受影响文件表 + 验收 AC1–AC5 / AC1–AC3 | 逐批文件与验收 | 同上（一次性批次材料） |
| §6.1 / §6.2 契约矩阵 | 双端契约对位表 | 已并入 §6.6（同一来源，不重复登记） |
| 源档 §4.3 `slimForDisplay` 逐字符截断值（300 / 500 / 截断标记）与 `contextHistory` 一字不动 | VSC 侧瘦身细节 | 双端同语义已入 §6.3（VSC 常量值一致；不逐字符登记） |
| 源档 §9 懒历史分页的 webview 渲染细节（DOM 嵌容器内 / scroll 补偿前置 / `.welcome` 移除） | 前端渲染面 | 属 VSC 产品树 webview 面——§6.15 只登记契约（HISTORY_PAGE_SIZE / 输出模型 / turnStart 判定）；渲染层不并 |
| 源档 §10 注入序的 `loadSession` 同步会话级 UI（_autoApprove/planMode 面板标志 + 工具条按钮同步） | VSC 装配细节 | 面板 UI 同步 = VSC 专有面（`thincoder-vscode/**`）；注入序本体已入 §6.15 |

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #89 / #123–#127 · §2.5.1 A14 · §2.12.3 第 3 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（**B 轮并入 · 第 2 批**）：新增 §6 **机制面**（存储模型 / 并发安全 / 双线结构 / 保存与恢复 / 切换归档 / 跨端契约 / 标题生成 / 模型重选 / 时间戳与 read_history / end marker / env-state / 残留 GC 与标题契约 / 跨会话检索 / 记录内存有界）· §7 **关键决策记录（D-SE1–26）** · §8 **不并项与历史沿革** · 来源 = `thincoder-cli/docs/design/SESSION.md`（**旧档一字未改**——
原地作参照历史）；首部加机制面指针一行。
- 2026-09-15（**VSC 轮并入 · 批 7**）：§6.15 新增 **VS Code 面板装配接线面**（运行中禁止切换 / turnSlot /
  绑定入口三处 / 字段往返与 setSlot\* 写面 / 标题触发时机 A2 / 懒历史分页 / 注入序）· §7 补 **D-SE27–30** ·
  §8.2 补 4 行不并项登记；来源 = `thincoder-vscode/docs/design/SESSION.md`（**旧档一字未改**——原地作参照历史）；
  坐标按现状实核（`thincoder-vscode/src/extension/panel-session.mjs:22` · `session-slot-write.mjs` · `thincoder-vscode/src/extension/history-window.mjs:22,106` ·
  `thincoder-vscode/src/agent/setup-reminders.mjs:145,163`）。
- 2026-09-15（**W11 · VSC 端壳改指核会话面**）：§6.15 补 W11 接线面（端壳五档内部改指核会话面 + 端差保留两款 + 全量转口面）；
  绑定入口 / `saveLines` / `setSlot*` 写面坐标按实核收正（端壳 `thincoder-vscode/src/extension/session-slots.mjs:41/49` ·
  `thincoder-vscode/src/extension/session-io.mjs:55` · `thincoder-vscode/src/extension/session-slot-write.mjs:48` ·
  `thincoder-vscode/src/extension/panel-session.mjs:28/63`）；§4 第 3 行迁移面收正为核单源坐标；机制条文零改。
- 2026-09-16（**批 1 CORE-DEFECT-FIXES · eng-designer · 含复审修正轮**）：§6.2 / D-SE3 面补**死主判定身份复核**条（判据单源 = `thincoder-core/process-probe.mjs` `filterDeadOwners`）；体量读数刷新 **311 → 389**。
- 2026-09-18（**init-block 批 · eng-designer**——承 `docs/batches/2026-09-18-init-block.md` §1）：§6.2 死主判定纪律改「批量判活 + 三态判据 `ownerState`」（不得以探测失败当死）
  + 补**探测形态**条（入口一次探测束 · 四路零自有 exec · `resumeSlot` async）；`isProcessAlive` 条改述（实现移居 `thincoder-core/process-probe.mjs` · 同步有界 2 s · 本档 re-export 保 import 面）；
  `slotOccupancy` 条补有界束 + 失败 ⇒ `{occupied:true,unknown:true}`；§6.3 恢复入口 / §6.15 绑定入口三处改 `await resumeSlot`（`ensureSlot` 冷路径零探测）；D-SE3 判据句同步。
- 2026-09-18（**init-block 批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-init-block.md` §3 发现 8 / 10）：
  §6.2 `isProcessAlive` 条改三态契约（`true | false | undefined`；超时 / 探测失败 = 未知——对齐 D-MI10/D-MI16，未知不作死判据）+ **消费面全枚举**（核内三档逐坐标 + 端侧两处引核收正）+ 「假 ⇒ 判死」改法纪律；§6.6 基础契约槽位认领行收正（`isProcessAlive` → 判活束 / `ownerState`）；删修订式表达（探测形态条「逐 pid 探测已删」）。**零新语义**（三态 = 评审发现 8 的直接导出项）。
- 2026-09-19（**init-block 批 · eng-designer fix 轮**——承 `docs/batches/2026-09-18-init-block.md` §6 第 2・5 项；裁定 = 父侧 2026-09-19）：§6.15 新增**跨端 `m.active` / 他端翻指针裁定条**
  （P1–P5 判据句 + 五场景表 + 否决备选）+ §7 补 **D-SE31**；§6.15 引行收正（`session-slots.mjs` `:41→52` · `:49→60/69/82` · `session-io.mjs:55→89/124/166/188` · 绑定入口
  `ensureSlot→ensureSlotAsync`（`panel-session.mjs:42`）+ `ensureSlot:63` · `saveLines` → `panel-session-write.mjs:34` · 历史分页 → 核 `:24/107` · git 注入 `setup-reminders.mjs:145/163→115` + 核 `helpers.mjs:189`）；
  W11 名册补 `panel-session-write.mjs` 注（2026-09-18 拆分批产物——同属本面）。**零新语义**（裁定 = §6 第 2 项派单兑现；引行 = 第 5 项）。
- 2026-09-19（**init-block 批 · fix 轮 5** · eng-designer——承批次档 §6 · fix 轮 4 上抛 3 裁定）：W11 名册补 `panel-messages-session.mjs` 注（2026-09-16 VSC-DEBT 批 D-3 产物——同属本面）。**零新语义**。
- 2026-09-19（**init-block 批 · fix 轮** · eng-designer——承批次档 §6）：§6.15 裁定条补**端差登记**（切槽记录面写条件：核无条件 / 端条件写）+ 场景行；§6.15 两处引行收正（`session-io.mjs` `:89/124/166/188` → `:88/123/169/195`）；
  §6.10 镜像表补端差句（打开历史会话 = 未占才写 → 判据见 §6.15）· 占槽句改述（`_slot = null` + 经缓存重绑本端原槽）· P5 引行收正（`panel-session.mjs:225-228` → `:219-222`）。**零新语义**。
- 2026-09-20（**卫生族批 · 台账 #138 · eng-designer**）：首部机制面节区改 `§6–§8` + 历史节号指称清理（行数规则废除批残留）；设计源 = `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2。
- 2026-09-21（**SESSION-CLAIM 批 · eng-designer**——承 `docs/batches/2026-09-21-session-claim-release.md` §1）：§6.2 新增**认领释放**条（F-CR1 判据 + 三核原语落点 + `deletions` 落盘纪律）· §6.5 `/new` 与 `/session N` 落点补释放语义 ·
  §6.15 补 **F-CR2 判据前置**（受占 ⇒ 不进入 `switchToSlot`；端壳函数内被占分支零写）+ 端壳释放条 · §5 补本批落点指针 · §7 补 **D-SE32 / D-SE33** · 新增 **§6.16**（判据句 / 边界情形表 / 本批落点表 / 测试面 / 验收回指）；来源 = 需求档 §2.3（F-CR1–F-CR3，台账 #165 / #161②）。
- 2026-09-21（**SESSION-CLAIM 批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-21-session-claim-release.md` §3 发现 #2–#7）：
  §6.2 认领释放条改**单一保留集公式**（落点槽 ∪ 其余活绑定槽；被占 ⇒ 空）+ 各落点取值 = 公式代入；§6.16 新增 **ACP 调用面实读表**（`newSession` 四点不传 `releaseStale`；`switchToSlot` / `claimSlot` 零调用点）；
  §6.16 补**落盘判据三条**（fresh 同次快照 / 值条件删除 / 内存认领表移除）· 活绑定集口径改「假定 + 复核条件」（VSC 单实例）· 落点表与测试面表移出（清单唯一承载面 = 批档 §2）——§5 指针同改 · 补回 **§7 节标题** · 验收回指「三不动」收正「四不动」。**零新语义**（均为评审发现直接导出项）。
- 2026-09-21（**STARTUP-LATENCY 批 · eng-designer**——承 `docs/batches/2026-09-21-startup-latency.md` §1）：新增 **§6.17**（F-SL1 全链异步化判据 / F-SL2 可清组三合取判据 + 两级窗口与回收目录 + 双层执行面 + VSC 命令入口 / 边界情形表 / 验收回指）
  ——同时 §6.12 冷 cwd 条与残留 GC 触发句收正（**端差注销** + 异步化指针）；§2.2 #125 行端差处置列同收正；§7 补 **D-SE34–D-SE38**；§5 补本批落点指针；来源 = 需求档 §2.4（F-SL1 / F-SL2，台账 #173）。
- 2026-09-21（**STARTUP-LATENCY 批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-21-startup-latency.md` §3 发现 1–13）：
  §6.17 执行面钉**自动面判据集合 = 三合取组**（90 天冷 cwd 面保持显式面）+ **有界语义 = 每 pass 内容判据评估 ≤500 组**（非删除数）+ 选取顺序（组最新 mtime 升序——前向推进论证）+ 求值序 / 短路（③→①→②）+ 单 pass 成本读数；
  D-SE36 回收根改**由 `dir` 派生**（+ 清运 `now` 缝）· D-SE38 补端侧 sessions 根显式传 + 用例沙箱缝 + 需求侧注销落点 · §6.12 冷 cwd 条执行面标签收正（双档）· §6.17 验收机检路由改三档 + 边界情形表补错误路径行 · §7 D-SE36 / D-SE37 同步；**零新语义**（均为评审发现直接导出项）。
- 2026-09-21（**STARTUP-LATENCY 批 · 设计评审轮 2 修正** · eng-designer——承 `docs/batches/2026-09-21-startup-latency.md` §3 轮次 2 残留 14 / 15）：
  §6.17 边界情形表补 **② 面保留组计入 500 预算 ⇒ 自动面滞留（兜底 = 显式命令面）** 行 · 单 pass 成本读数补 **① 面 manifest 读**（≈7.4k 次/pass，异步）；**零新语义**（均为评审残留直接导出项）。
- 2026-09-21（**STARTUP-LATENCY 批 · 收口前残留收正** · eng-designer——承 `docs/batches/2026-09-21-startup-latency.md` §5 实施读数 + 父侧裁定）：两处引 `thincoder-cli/bin/thincoder.mjs` 坐标按实施后实读收正（§6.16 钉槽落点 `:342` · §6.17 双端同源 CLI 锚 `:322`）；**零新语义**。
- 2026-09-21（**STARTUP-LATENCY 批 · 收口前机制微修** · eng-designer——承 `docs/batches/2026-09-21-startup-latency.md` §2 修正轮 3 = 父侧 04:5x 真机复测）：
  §6.12 / §6.17 GC 触发改**启动窗外延迟拍**（`GC_PASS_DELAY_MS` = 3s；启动解耦判据句在档）+ 自动面预算改**过 ③ 进 ① 即耗**（含 ① manifest 读，总评估 ≤500/pass；有界语义 / 前向推进论证 / 成本读数 / 边界行同步）；§7 补 **D-SE39 / D-SE40**；来源 = 验收② 实测 2.9–4.2s（对照 ≤2s ✗）根因两处。
- 2026-09-21（**块标题行对齐批 · eng-designer**——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §1 · 用户 07:26 范围更正）：§6.7 改为**双端同一套机制**四环单源（源谓词 = `isRealUserMsg` / 生成 = 核 `generateTitle` / 触发 = 无标题即尝试 / 写形 = 随回合尾整档 save 单写）+ VSC `requestTitle` 独立实现旧句去净；
  §6.15 标题触发条改「时点 + 单写形」；D-SE30 同步。**零新协议语义**（改的是同一链的调用形与落点）。
- 2026-09-21（**块标题行对齐批 · D8 裁定轮 · eng-designer**——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §2.12 · 父侧代裁）：§6.7「读 / 展示」行收正——**常显位 = 两端 chrome**（VSC 顶栏 / CLI 状态行段；落点设计 = `docs/cli/design/TUI.md` §7.4）——D8 由「上抛」改判**消（b 形 · 两端常显）**；`/session` 按需列表面零变。

- 2026-09-21（**块标题行对齐批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-21-vsc-block-title-align.md` §2.13 · 发现 1 / 4）：§6.7 两处收正——①「读 / 展示」行限定形（**列表面**同回退链；CLI 段 = `agent.title` 活读 · 空值零注入；空窗差 = 已登记端差〔A9〕）；② 环枚举重基 = **源 / 生成 / 触发 / 写 / 读·展示五环**（谓词 ∈ 源、时点 ∈ 写）。**零新语义**。
- 2026-09-21（**EXIT-CLAIM-RELEASE 批 · eng-designer**——承 `docs/batches/2026-09-21-exit-claim-release.md` §1）：新增 **§6.18**（判据句 / 核薄函数 / CLI·VSC 接线序 / 端壳裁定 / 边界情形 / 验收回指 T1–T6）；§7 补 **D-SE41 / D-SE42**；§5 补落点指针；来源 = 需求档 §2.5（台账 #211；用户 22:28 批准）。批档 §2 写入被冻结机制拒——待父侧处置。
